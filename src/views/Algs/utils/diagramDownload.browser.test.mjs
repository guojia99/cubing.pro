import assert from "node:assert/strict";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";
import { chromium } from "playwright";

// Run: node --test src/views/Algs/utils/diagramDownload.browser.test.mjs
// Bundle the production entry point; fulfill every request in memory, with no
// Next/API server, external resources, or production-module substitutions.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const origin = "http://diagram-download.test";

async function open(browser, bundle) {
  const context = await browser.newContext({ acceptDownloads: true, serviceWorkers: "block" });
  const blocked = [];
  const errors = [];
  await context.route("**/*", route => {
    const url = route.request().url();
    if (url === `${origin}/bundle.js`) return route.fulfill({ contentType: "text/javascript", body: bundle });
    if (url === `${origin}/`) return route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><body><main id="source"><svg xmlns="http://www.w3.org/2000/svg"
        width="900" height="600" viewBox="10 20 120 80" style="width:45px;height:auto;max-width:100%">
        <rect x="30" y="40" width="30" height="20" fill="#19a7c4"/>
        <path d="M80 40h20v20H80z" fill="#e03040"/>
        <text x="30" y="85" font-family="sans-serif" font-size="10" fill="#102030">R &amp; U</text>
      </svg></main><script src="/bundle.js"></script></body></html>`,
    });
    blocked.push(url);
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.on("pageerror", error => errors.push(error.message));
  page.on("download", () => errors.push("Unexpected download"));
  await page.goto(`${origin}/`);
  await page.evaluate(() => {
    const state = window.probe = { active: new Set(), created: [], revoked: [], rejections: [], clicks: 0 };
    addEventListener("unhandledrejection", event => state.rejections.push(String(event.reason)));
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = blob => {
      const url = create(blob);
      state.active.add(url);
      state.created.push({ url, type: blob.type });
      return url;
    };
    URL.revokeObjectURL = url => {
      state.active.delete(url);
      state.revoked.push(url);
      revoke(url);
    };
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      state.clicks++;
      return click.call(this);
    };
    window.sourceSvg = document.querySelector("#source svg");
    window.sourceChild = window.sourceSvg.firstElementChild;
    window.sourceBefore = document.documentElement.outerHTML;
    window.sourceClicks = 0;
    window.sourceChild.addEventListener("click", () => window.sourceClicks++);
  });
  // Successful tests install their own download listener; failure tests keep it.
  return { page, context, errors, blocked };
}

async function clean(page, errors, blocked) {
  await page.waitForFunction(() => window.probe.active.size === 0);
  const state = await page.evaluate(() => ({
    unchanged: document.documentElement.outerHTML === window.sourceBefore,
    sameSvg: document.querySelector("#source svg") === window.sourceSvg,
    sameChild: window.sourceSvg.firstElementChild === window.sourceChild,
    active: window.probe.active.size,
    created: window.probe.created.map(({ url }) => url).sort(),
    revoked: [...window.probe.revoked].sort(),
    rejections: window.probe.rejections,
    anchors: document.querySelectorAll("a[download]").length,
    svgs: document.querySelectorAll("svg").length,
  }));
  assert.equal(state.unchanged, true, "Entire source DOM remains unchanged");
  assert.equal(state.sameSvg, true, "Source SVG identity survives");
  assert.equal(state.sameChild, true, "Source child identity survives");
  assert.equal(await page.evaluate(() => {
    window.sourceChild.dispatchEvent(new MouseEvent("click"));
    return window.sourceClicks;
  }), 1, "Source event listeners survive");
  assert.equal(state.active, 0);
  assert.deepEqual(state.created, state.revoked, "Every object URL is revoked exactly once");
  assert.deepEqual(state.rejections, [], "No unhandled promise rejection");
  assert.equal(state.anchors, 0, "No download anchor leak");
  assert.equal(state.svgs, 1, "No detached-export wrapper left in the DOM");
  assert.deepEqual(errors, [], "No uncaught exception or unexpected download");
  assert.deepEqual(blocked, [], "No API or external-resource requests");
}

async function downloadBytes(page, format, name, scale) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.evaluate(({ format, name, scale }) => {
      const svg = window.diagram.findDiagramSvg(document.querySelector("#source"));
      return format === "svg"
        ? window.diagram.downloadDiagramSvg(svg, name)
        : window.diagram.downloadDiagramPng(svg, name, scale);
    }, { format, name, scale }),
  ]);
  assert.equal(await download.failure(), null);
  const stream = await download.createReadStream();
  assert.ok(stream, "Browser must produce a readable downloaded file");
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const bytes = Buffer.concat(chunks);
  const filename = download.suggestedFilename();
  await download.delete();
  return { bytes, filename };
}

test("diagram downloads: real browser files, dimensions, pixels and rejection cleanup", { timeout: 90000 }, async t => {
  const bundle = await build({
    stdin: {
      resolveDir: root,
      contents: `import * as diagram from './src/views/Algs/utils/diagramDownload'; window.diagram = diagram;`,
    },
    absWorkingDir: root,
    bundle: true, write: false, format: "iife", platform: "browser", logLevel: "silent",
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const cases = [
      { label: "nonzero viewBox overrides intrinsic and CSS size", viewBox: "10 20 120 80", width: 120, height: 80 },
      { label: "comma-separated fractional viewBox", viewBox: "10,20,120.5,80.5", width: 120.5, height: 80.5 },
      { label: "missing viewBox falls back to 240", viewBox: null, width: 240, height: 240 },
      { label: "malformed viewBox falls back to 240", viewBox: "10 20 120", width: 240, height: 240 },
      { label: "zero width falls back independently", viewBox: "10 20 0 80", width: 240, height: 80 },
      { label: "negative height falls back independently", viewBox: "10 20 120 -1", width: 120, height: 240 },
    ];
    for (const fixture of cases) for (const format of ["svg", "png"]) {
      await t.test(`${format}: ${fixture.label}`, async () => {
        const { page, context, errors, blocked } = await open(browser, bundle.outputFiles[0].text);
        page.removeAllListeners("download");
        try {
          await page.evaluate(viewBox => {
            if (viewBox === null) window.sourceSvg.removeAttribute("viewBox");
            else window.sourceSvg.setAttribute("viewBox", viewBox);
            window.sourceBefore = document.documentElement.outerHTML;
          }, fixture.viewBox);
          const { bytes, filename } = await downloadBytes(page, format, "diagram");
          assert.equal(filename, `diagram.${format}`);
          assert.ok(bytes.length > 100, "Download contains actual image data");
          if (format === "svg") {
            const parsed = await page.evaluate(xml => {
              const doc = new DOMParser().parseFromString(xml, "image/svg+xml");
              const svg = doc.documentElement;
              return {
                errors: doc.querySelectorAll("parsererror").length,
                width: Number(svg.getAttribute("width")), height: Number(svg.getAttribute("height")),
                viewBox: svg.getAttribute("viewBox"), namespace: svg.namespaceURI,
                style: svg.getAttribute("style"), fill: svg.querySelector("rect").getAttribute("fill"),
                text: svg.querySelector("text").textContent,
              };
            }, bytes.toString("utf8"));
            assert.deepEqual(parsed, {
              errors: 0, width: fixture.width, height: fixture.height, viewBox: fixture.viewBox,
              namespace: "http://www.w3.org/2000/svg", style: null, fill: "#19a7c4", text: "R & U",
            });
          } else {
            assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
            assert.equal(bytes.readUInt32BE(16), Math.round(fixture.width * 2), "PNG width is 2x viewBox/fallback width");
            assert.equal(bytes.readUInt32BE(20), Math.round(fixture.height * 2), "PNG height is 2x viewBox/fallback height");
            if (fixture.viewBox === "10 20 120 80") {
              const pixels = await page.evaluate(async base64 => {
                const image = new Image();
                image.src = `data:image/png;base64,${base64}`;
                await image.decode();
                const canvas = document.createElement("canvas");
                canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0);
                const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                let white = 0, cyan = 0, red = 0, transparent = 0;
                for (let i = 0; i < rgba.length; i += 4) {
                  if (rgba[i + 3] !== 255) transparent++;
                  if (rgba[i] === 255 && rgba[i + 1] === 255 && rgba[i + 2] === 255 && rgba[i + 3] === 255) white++;
                  if (rgba[i] === 25 && rgba[i + 1] === 167 && rgba[i + 2] === 196 && rgba[i + 3] === 255) cyan++;
                  if (rgba[i] === 224 && rgba[i + 1] === 48 && rgba[i + 2] === 64 && rgba[i + 3] === 255) red++;
                }
                const pixel = (x, y) => [...ctx.getImageData(x, y, 1, 1).data];
                return { white, cyan, red, transparent, corner: pixel(1, 1), sticker: pixel(50, 50), second: pixel(150, 50) };
              }, bytes.toString("base64"));
              assert.deepEqual(pixels.corner, [255, 255, 255, 255]);
              assert.deepEqual(pixels.sticker, [25, 167, 196, 255], "viewBox origin maps colored geometry correctly");
              assert.deepEqual(pixels.second, [224, 48, 64, 255]);
              assert.equal(pixels.transparent, 0, "Entire PNG is opaque white-backed");
              assert.ok(pixels.white > 20000 && pixels.cyan > 2000 && pixels.red > 1000, JSON.stringify(pixels));
            }
          }
          assert.deepEqual(await page.evaluate(() => window.probe.created.map(({ type }) => type)),
            format === "svg" ? ["image/svg+xml"] : ["image/svg+xml", "image/png"]);
          await clean(page, errors, blocked);
        } finally { await context.close(); }
      });
    }

    for (const format of ["svg", "png"]) for (const [name, expected] of [
      ["  OLL/PLL\\case?%*:|\"<>\u0000\u001f\n\t  R  U  ", "OLL PLL case R U"],
      [" /\\?%*:|\"<>\u0000\u001f\n\t ", "cube-diagram"],
      ["\u516c\u5f0f R U'", "\u516c\u5f0f R U'"],
    ]) {
      await t.test(`${format}: sanitized filename ${JSON.stringify(expected)}`, async () => {
        const { page, context, errors, blocked } = await open(browser, bundle.outputFiles[0].text);
        page.removeAllListeners("download");
        try {
          const { filename } = await downloadBytes(page, format, name);
          assert.equal(filename, `${expected}.${format}`);
          await clean(page, errors, blocked);
        } finally { await context.close(); }
      });
    }

    const failures = [
      ["image-error", /SVG rasterization failed/, 1],
      ["context-null", /Canvas 2D context unavailable/, 1],
      ["context-throw", /injected context/, 1],
      ["draw-throw", /injected drawImage/, 1],
      ["blob-null", /Image encoding failed/, 1],
      ["blob-throw", /injected toBlob/, 1],
      ["source-url", /injected source URL/, 0],
      ["download-url", /injected download URL/, 1],
      ["anchor-click", /injected anchor click/, 2],
      ["invalid-scale", /Invalid SVG export scale/, 0],
    ];
    for (const [fault, expected, urlCount] of failures) {
      await t.test(`PNG rejects without hanging: ${fault}`, async () => {
        const { page, context, errors, blocked } = await open(browser, bundle.outputFiles[0].text);
        try {
          const result = await page.evaluate(async fault => {
            const restores = [];
            let consumed = 0;
            const patch = (target, key, value) => {
              const old = target[key];
              restores.push(() => { target[key] = old; });
              target[key] = value;
            };
            if (fault === "image-error") {
              const NativeImage = window.Image;
              patch(window, "Image", function () {
                const image = new NativeImage();
                Object.defineProperty(image, "src", { set() {
                  consumed++;
                  queueMicrotask(() => image.onerror?.(new Event("error")));
                } });
                return image;
              });
            }
            if (fault.startsWith("context-")) patch(HTMLCanvasElement.prototype, "getContext", () => {
              consumed++;
              if (fault === "context-throw") throw new Error("injected context");
              return null;
            });
            if (fault === "draw-throw") patch(CanvasRenderingContext2D.prototype, "drawImage", () => {
              consumed++; throw new Error("injected drawImage");
            });
            if (fault.startsWith("blob-")) patch(HTMLCanvasElement.prototype, "toBlob", callback => {
              consumed++;
              if (fault === "blob-throw") throw new Error("injected toBlob");
              setTimeout(() => callback(null), 0);
            });
            if (fault.endsWith("-url")) {
              const create = URL.createObjectURL;
              patch(URL, "createObjectURL", blob => {
                if (blob.type === (fault === "source-url" ? "image/svg+xml" : "image/png")) {
                  consumed++; throw new Error(`injected ${fault === "source-url" ? "source" : "download"} URL`);
                }
                return create(blob);
              });
            }
            if (fault === "anchor-click") patch(HTMLAnchorElement.prototype, "click", () => {
              consumed++; throw new Error("injected anchor click");
            });
            let timer;
            try {
              const result = await Promise.race([
                window.diagram.downloadDiagramPng(window.sourceSvg, "failure", fault === "invalid-scale" ? 0 : 2)
                  .then(() => ({ status: "resolved" }), error => ({ status: "rejected", error: String(error) })),
                new Promise(resolve => { timer = setTimeout(() => resolve({ status: "pending" }), 2000); }),
              ]);
              return { ...result, consumed, created: window.probe.created.length, clicks: window.probe.clicks };
            } finally {
              clearTimeout(timer);
              restores.reverse().forEach(restore => restore());
            }
          }, fault);
          assert.equal(result.status, "rejected", `Must reject within 2s, never hang: ${JSON.stringify(result)}`);
          assert.match(result.error, expected);
          assert.equal(result.consumed, fault === "invalid-scale" ? 0 : 1, "Injected failure reached the production pipeline");
          assert.equal(result.created, urlCount, "Failure occurs at the expected URL lifecycle stage");
          assert.equal(result.clicks, 0, "Failure must not initiate a download");
          await clean(page, errors, blocked);
        } finally { await context.close(); }
      });
    }

    await t.test("findDiagramSvg handles null, missing and nested SVG", async () => {
      const { page, context, errors, blocked } = await open(browser, bundle.outputFiles[0].text);
      try {
        assert.deepEqual(await page.evaluate(() => ({
          nullInput: window.diagram.findDiagramSvg(null),
          missing: window.diagram.findDiagramSvg(document.createElement("div")),
          nested: window.diagram.findDiagramSvg(document.body) === window.sourceSvg,
        })), { nullInput: null, missing: null, nested: true });
        await clean(page, errors, blocked);
      } finally { await context.close(); }
    });
  } finally { await browser.close(); }
});
