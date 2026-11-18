import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";
import { chromium } from "playwright";

// Run: node --test src/views/DrawTools/drawDownload.browser.test.mjs
// Default: bundle the real views, palette, theme and translations, isolated from
// concurrent Next dev listeners. DRAW_DOWNLOAD_BASE_URL opts into an existing dev.
// Original dev reproduction (2026-11-18): PNG raised
// Attempting to parse an unsupported color function "color" and leaked a wrapper.
// Computed html/body/svg/path borderColor was
// color(srgb 0.12549 0.239216 0.286275 / 0.08), from Chakra preflight's border token.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const origin = process.env.DRAW_DOWNLOAD_BASE_URL ?? "http://draw-download.test";
const isolated = !process.env.DRAW_DOWNLOAD_BASE_URL;
const puzzles = ["sq1", "minx", "sk", "py", "fto"];
const locales = ["zh-CN", "en-US", "ja", "yue-Hant-HK", "ko", "fr", "es"];
const errorsByLocale = [
  "导出失败，请重试", "Export failed. Please try again.",
  "書き出しに失敗しました。再試行してください。", "匯出失敗，請再試",
  "내보내기에 실패했습니다. 다시 시도하세요.", "Échec de l’exportation. Réessayez.",
  "Error al exportar. Inténtalo de nuevo.",
];
const sourceSelector = ".draw-palette-canvas";
const formats = process.env.DRAW_DOWNLOAD_FORMAT ? [process.env.DRAW_DOWNLOAD_FORMAT] : ["svg", "png", "jpg"];
let bundle;

async function fixture() {
  if (!isolated) return;
  bundle = await build({
    stdin: {
      resolveDir: root, loader: "tsx", contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { ChakraProvider } from '@chakra-ui/react';
        import { system } from './src/theme';
        import { I18nProvider } from './src/contexts/I18nProvider';
        import { AppToaster } from './src/components/ui/toaster';
        import { AntThemeProvider } from './src/components/ui/AntThemeProvider';
        import { SQ1DrawView } from './src/views/DrawTools/SQ1DrawView';
        import { MinxDrawView } from './src/views/DrawTools/MinxDrawView';
        import { SkDrawView } from './src/views/DrawTools/SkDrawView';
        import { PyDrawView } from './src/views/DrawTools/PyDrawView';
        import { FtoDrawView } from './src/views/DrawTools/FtoDrawView';
        const views = { sq1: SQ1DrawView, minx: MinxDrawView, sk: SkDrawView, py: PyDrawView, fto: FtoDrawView };
        const View = views[location.pathname.match(/([a-z0-9]+)-d/)[1]];
        createRoot(document.getElementById('root')).render(
          <ChakraProvider value={system}><I18nProvider><AntThemeProvider>
            <AppToaster /><main><View /></main>
          </AntThemeProvider></I18nProvider></ChakraProvider>);
      `,
    },
    bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic",
    loader: { ".css": "empty" },
    define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" },
    logLevel: "silent",
    plugins: [{
      name: "isolated-next-navigation",
      setup(builder) {
        builder.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "navigation", namespace: "fixture" }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          resolveDir: root, loader: "js", contents: `
            import { useSyncExternalStore } from 'react';
            const subscribe = listener => { addEventListener('popstate', listener); return () => removeEventListener('popstate', listener); };
            export const usePathname = () => location.pathname;
            export const useSearchParams = () => new URLSearchParams(useSyncExternalStore(subscribe, () => location.search));
            export const useRouter = () => ({ replace: url => { history.replaceState(null, '', url); dispatchEvent(new PopStateEvent('popstate')); } });
          `,
        }));
      },
    }],
  });
}

async function open(browser, puzzle, theme = "light", width = 1440, locale = "en-US") {
  const context = await browser.newContext({
    viewport: { width, height: 1000 }, colorScheme: theme,
    acceptDownloads: true, reducedMotion: "reduce", serviceWorkers: "block",
  });
  const errors = [];
  const blocked = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== new URL(origin).origin || /cube-api|\/api\//.test(url.pathname) || !["GET", "HEAD"].includes(request.method())) {
      blocked.push({ url: request.url(), method: request.method() });
      return route.abort();
    }
    if (!isolated) return route.continue();
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: bundle.outputFiles[0].text });
    if (url.pathname === "/fixture.css") {
      const css = await Promise.all(["tokens.css", "design-system.css"].map(name => readFile(resolve(root, "src/styles", name), "utf8")));
      return route.fulfill({ contentType: "text/css", body: css.join("\n") });
    }
    if (url.pathname.startsWith("/draw-tools/")) return route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html class="${theme}"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>`,
    });
    blocked.push({ url: request.url(), method: request.method() });
    return route.abort();
  });
  await context.addInitScript(({ theme, locale }) => {
    if (!/^https?:$/.test(location.protocol)) return;
    localStorage.setItem("cubing-pro-theme", theme);
    localStorage.setItem("cubing_pro_locale", locale);
    const state = window.downloadProbe = { active: new Set(), captures: [], errors: [], fail: null, consumed: 0 };
    addEventListener("unhandledrejection", event => state.errors.push(String(event.reason)));
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    const blobs = new Map();
    URL.createObjectURL = blob => {
      if (state.fail === "url") { state.fail = null; state.consumed++; throw new Error("Injected SVG URL failure"); }
      const url = create(blob); state.active.add(url); blobs.set(url, blob); return url;
    };
    URL.revokeObjectURL = url => { state.active.delete(url); blobs.delete(url); return revoke(url); };
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) state.captures.push({ name: this.download, href: this.href, blob: blobs.get(this.href) });
      return click.call(this);
    };
    const toBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
      if (state.fail === "encode") { state.fail = null; state.consumed++; queueMicrotask(() => callback(null)); return; }
      return toBlob.call(this, callback, ...args);
    };
  }, { theme, locale });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${origin}/draw-tools/${puzzle}-d`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.locator(`${sourceSelector} [data-key]`).first().waitFor({ timeout: 90000 });
  await page.waitForFunction(value => document.documentElement.lang === value, locale);
  await page.evaluate(() => document.fonts.ready);
  assert.ok((await page.locator("html").getAttribute("class")).split(" ").includes(theme));
  return { page, context, errors, blocked };
}

async function clean(page, errors) {
  await page.waitForFunction(() => window.downloadProbe.active.size === 0);
  const state = await page.evaluate(() => ({
    errors: window.downloadProbe.errors,
    wrappers: [...document.querySelectorAll("svg.draw-palette-canvas")].filter(el => !el.closest("main")).length + document.querySelectorAll("iframe.html2canvas-container").length,
    anchors: document.querySelectorAll('a[download][href^="blob:"], a[download][href^="data:image/"]').length,
  }));
  assert.deepEqual(errors, [], "No uncaught browser exceptions");
  assert.deepEqual(state, { errors: [], wrappers: 0, anchors: 0 }, "No rejected promises, wrapper, iframe or download anchor leaks");
  assert.equal(await page.locator(sourceSelector).count(), 1);
}

async function customize(page) {
  const color = "#19a7c4";
  await page.locator('main [data-scope="popover"][data-part="trigger"]').click();
  await page.locator('input[type="color"]').fill(color);
  await page.locator('[data-scope="popover"][data-part="content"]').getByRole("button").click();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("button", { name: color, exact: true }).getAttribute("aria-pressed"), "true");
  await page.locator(sourceSelector).scrollIntoViewIfNeeded();
  const hit = await page.locator(sourceSelector).evaluate(svg => {
    const r = svg.getBoundingClientRect();
    for (let y = Math.max(0, r.top) + 4; y < Math.min(innerHeight, r.bottom) - 4; y += 4) {
      for (let x = r.left + 4; x < r.right - 4; x += 4) {
        const el = document.elementFromPoint(x, y)?.closest("[data-key]");
        const key = el?.getAttribute("data-key");
        if (key && svg.contains(el) && !/disable|fonts|line/.test(key)) return { x, y, key };
      }
    }
    return null;
  });
  assert.ok(hit, "Visible sticker must be reachable by a real pointer");
  await page.mouse.click(hit.x, hit.y);
  assert.equal(await page.locator(`${sourceSelector} [data-key="${hit.key}"]`).getAttribute("fill"), color);
  const slider = page.getByRole("slider").last();
  await slider.focus();
  await slider.press("ArrowRight");
  await slider.press("ArrowRight");
  assert.equal(await slider.getAttribute("aria-valuenow"), "3");
  return color;
}

async function downloadAndInspect(page, format, name, color) {
  const svg = page.locator(sourceSelector);
  const before = await svg.evaluate(el => ({
    xml: el.outerHTML, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height,
    intrinsicWidth: el.width.baseVal.value, intrinsicHeight: el.height.baseVal.value,
    text: [...el.querySelectorAll("text")].map(n => n.textContent),
    strokes: [...el.querySelectorAll("[stroke-width]")].map(n => n.getAttribute("stroke-width")),
  }));
  const button = page.getByRole("button", { name: new RegExp(format === "jpg" ? "JPG|JPEG" : format, "i") });
  let download;
  try {
    [download] = await Promise.all([
      Promise.race([
        page.waitForEvent("download"),
        page.waitForEvent("pageerror").then(error => { throw error; }),
      ]),
      button.click(),
    ]);
  } catch (error) {
    const diagnostic = await page.locator(sourceSelector).first().evaluate(el => ({
      borderColor: getComputedStyle(el).borderColor,
      errors: window.downloadProbe.errors,
      wrappers: [...document.querySelectorAll("svg.draw-palette-canvas")].filter(el => !el.closest("main")).length + document.querySelectorAll("iframe.html2canvas-container").length,
    }));
    throw new Error(`${format}: ${error.message}; ${JSON.stringify(diagnostic)}`);
  }
  assert.equal(download.suggestedFilename(), `${name}.${format}`);
  assert.equal(await download.failure(), null);
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const bytes = Buffer.concat(chunks);
  assert.ok(bytes.length > 200, `${format} must contain actual drawing data`);
  if (format === "png") assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  if (format === "jpg") {
    assert.equal(bytes.subarray(0, 3).toString("hex"), "ffd8ff");
    assert.equal(bytes.subarray(-2).toString("hex"), "ffd9");
  }
  if (format === "svg") assert.match(bytes.toString(), /^(?:<\?xml[^>]*>\s*)?<svg[\s>]/);
  const inspected = await page.evaluate(async ({ format, base64, before, color }) => {
    const capture = window.downloadProbe.captures.at(-1);
    const type = capture.blob?.type ?? capture.href.match(/^data:([^;,]+)/)?.[1];
    const expectedType = { png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml" }[format];
    const binary = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    const blob = new Blob([binary], { type: expectedType });
    const xml = format === "svg" ? await blob.text() : before.xml;
    const doc = new DOMParser().parseFromString(xml, "image/svg+xml");
    if (doc.querySelector("parsererror")) throw new Error("Invalid SVG XML");
    const exported = doc.documentElement;
    const sameText = JSON.stringify([...exported.querySelectorAll("text")].map(n => n.textContent)) === JSON.stringify(before.text);
    const sameStrokes = JSON.stringify([...exported.querySelectorAll("[stroke-width]")].map(n => n.getAttribute("stroke-width"))) === JSON.stringify(before.strokes);
    const decode = async source => {
      const url = URL.createObjectURL(source);
      try { const img = new Image(); img.src = url; await img.decode(); return img; }
      finally { URL.revokeObjectURL(url); }
    };
    const image = await decode(blob);
    const width = image.naturalWidth, height = image.naturalHeight;
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const actual = ctx.getImageData(0, 0, width, height).data;
    // Independent reference: serialize the user's live SVG directly, never call
    // production export helpers. Pixel comparison covers text and line thickness.
    const refDoc = new DOMParser().parseFromString(before.xml, "image/svg+xml");
    const refSvg = refDoc.documentElement;
    refSvg.setAttribute("width", String(width)); refSvg.setAttribute("height", String(height));
    refSvg.style.maxWidth = "none"; refSvg.style.height = `${height}px`;
    const reference = await decode(new Blob([new XMLSerializer().serializeToString(refSvg)], { type: "image/svg+xml" }));
    ctx.clearRect(0, 0, width, height); ctx.drawImage(reference, 0, 0);
    const ref = ctx.getImageData(0, 0, width, height).data;
    const rgb = color.slice(1).match(/../g).map(hex => parseInt(hex, 16));
    let samples = 0, background = 0, correctBackground = 0, visible = 0, delta = 0;
    for (let i = 0; i < actual.length; i += 4) {
      if (actual[i + 3] > 240 && rgb.every((v, channel) => Math.abs(actual[i + channel] - v) < (format === "jpg" ? 40 : 3))) samples++;
      if (ref[i + 3] === 0) {
        background++;
        if (format === "jpg" ? actual[i] > 245 && actual[i + 1] > 245 && actual[i + 2] > 245 && actual[i + 3] === 255 : actual[i + 3] === 0) correctBackground++;
      }
      if (ref[i + 3] > 240 && Math.min(ref[i], ref[i + 1], ref[i + 2]) < 220) visible++;
      for (let channel = 0; channel < 3; channel++) {
        const expected = format === "jpg" ? ref[i + channel] * ref[i + 3] / 255 + 255 - ref[i + 3] : ref[i + channel];
        delta += Math.abs(actual[i + channel] - expected);
      }
    }
    return { type, width, height, sameText, sameStrokes, samples, visible, background, backgroundRatio: correctBackground / background, meanError: delta / (width * height * 3) };
  }, { format, base64: bytes.toString("base64"), before, color });
  assert.equal(inspected.type, { png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml" }[format]);
  if (format !== "svg") {
    // Export resolution follows the drawing dimensions, not a narrow viewport's CSS shrink.
    assert.equal(inspected.width, Math.round(before.intrinsicWidth * 2), "2x intrinsic drawing width");
    assert.equal(inspected.height, Math.round(before.intrinsicHeight * 2), "2x intrinsic drawing height");
  } else {
    assert.equal(inspected.width, before.intrinsicWidth);
    assert.equal(inspected.height, before.intrinsicHeight);
  }
  assert.ok(inspected.samples > 20, `Painted sample color survives: ${JSON.stringify(inspected)}`);
  assert.ok(inspected.visible > 100, "Drawing is not blank");
  assert.ok(inspected.background > 100, "Reference contains transparent background samples");
  assert.ok(inspected.backgroundRatio > (format === "jpg" ? 0.95 : 0.995), `JPEG white / PNG and SVG transparent background: ${JSON.stringify(inspected)}`);
  assert.ok(inspected.meanError < (format === "jpg" ? 8 : 2), `Raster preserves user drawing, text and strokes: ${JSON.stringify(inspected)}`);
  assert.equal(inspected.sameText, true);
  assert.equal(inspected.sameStrokes, true);
  assert.equal(await svg.evaluate(el => el.outerHTML), before.xml, "Export must not mutate the user's SVG");
  assert.equal(await page.getByRole("button", { name: color, exact: true }).getAttribute("aria-pressed"), "true", "Export preserves the user's selected custom color");
  assert.ok(await page.evaluate(value => Object.keys(localStorage).some(key => localStorage.getItem(key)?.includes(value)), color), "Export preserves custom color history");
  await download.delete();
  return { bytes: bytes.length, ...inspected };
}

test("real drawing downloads: files, fidelity, themes, mobile, errors and retry", { timeout: 600000 }, async t => {
  await fixture();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) for (const width of [1440, 390]) for (const puzzle of puzzles) for (const format of formats) {
      if (process.env.DRAW_DOWNLOAD_FILTER && !`${puzzle} ${theme} ${width}`.includes(process.env.DRAW_DOWNLOAD_FILTER)) continue;
      await t.test(`${puzzle} ${theme} ${width}px ${format.toUpperCase()}`, async () => {
        const { page, context, errors } = await open(browser, puzzle, theme, width);
        try {
          const color = await customize(page);
          const name = `user drawing-${puzzle}-${theme}-${width}`;
          await page.locator('input:not([type]), input[type="text"]').first().fill(name);
          const inspected = await downloadAndInspect(page, format, name, color);
          await clean(page, errors);
          console.log(JSON.stringify({ puzzle, theme, viewport: width, format, ...inspected }));
        } finally { await context.close(); }
      });
    }
    if (!process.env.DRAW_DOWNLOAD_FILTER || process.env.DRAW_DOWNLOAD_FILTER === "text") await t.test("SQ1 user text survives all download formats", async () => {
      const { page, context, errors } = await open(browser, "sq1");
      try {
        await page.getByRole("tab").nth(1).click();
        const toggle = page.locator('[data-scope="switch"][data-part="control"]').first();
        if (await page.locator('input[role="switch"], input[type="checkbox"]').first().isChecked() === false) await toggle.click();
        await page.locator(`${sourceSelector} text`).first().waitFor();
        const textInputs = page.locator('main input[type="text"], main input:not([type])');
        assert.ok(await textInputs.count() > 1, "Real SQ1 text controls must be present");
        await textInputs.nth(1).fill("R");
        await page.waitForFunction(() => [...document.querySelectorAll('.draw-palette-canvas text')].some(el => el.textContent === "R"));
        const color = await customize(page);
        await textInputs.first().fill("user-text");
        for (const format of formats) await downloadAndInspect(page, format, "user-text", color);
        await clean(page, errors);
      } finally { await context.close(); }
    });
    for (const [index, locale] of locales.entries()) {
      if (process.env.DRAW_DOWNLOAD_FILTER && process.env.DRAW_DOWNLOAD_FILTER !== "errors" && process.env.DRAW_DOWNLOAD_FILTER !== locale) continue;
      await t.test(`${locale} localized errors and retry PNG/JPG/SVG`, async () => {
        const { page, context, errors } = await open(browser, "sk", index % 2 ? "dark" : "light", 390, locale);
        try {
          const color = await customize(page);
          await page.locator('input:not([type]), input[type="text"]').first().fill("retry");
          for (const format of ["png", "jpg", "svg"]) {
          const before = await page.evaluate(format => {
            window.downloadProbe.fail = format === "svg" ? "url" : "encode";
            return { consumed: window.downloadProbe.consumed, downloads: window.downloadProbe.captures.length };
          }, format);
          await page.getByRole("button", { name: new RegExp(format === "jpg" ? "JPG|JPEG" : format, "i") }).click();
          await Promise.race([
            page.getByText(errorsByLocale[index], { exact: true }).first().waitFor({ state: "visible" }),
            page.waitForEvent("pageerror").then(error => { throw error; }),
          ]);
          const after = await page.evaluate(() => ({ consumed: window.downloadProbe.consumed, downloads: window.downloadProbe.captures.length }));
          assert.equal(after.consumed, before.consumed + 1, "Failure must reach the actual export pipeline");
          assert.equal(after.downloads, before.downloads, "Failure must not download a corrupt file");
          await clean(page, errors);
          await downloadAndInspect(page, format, "retry", color);
          await clean(page, errors);
          const close = page.locator('[data-scope="toast"][data-part="close-trigger"]').first();
          if (await close.isVisible()) await close.click();
          // A new failure must produce its own visible toast.
          await page.getByText(errorsByLocale[index], { exact: true }).first().waitFor({ state: "hidden", timeout: 15000 });
          }
        } finally { await context.close(); }
      });
    }
  } finally { await browser.close(); }
});
