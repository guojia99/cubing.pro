import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";

// All application modules are real. Only HTTP responses and Next's host router
// are supplied by this offline browser harness; no service/component aliases.
const root = fileURLToPath(new URL("../../../", import.meta.url));
const artifacts = process.env.ADVERTISEMENT_ARTIFACTS ?? "/var/folders/p8/b3ryxj6s1bd4wgsspxzhfnw40000gn/T/opencode/advertisements-browser";
const api = "https://api.ads.test/v3/cube-api";
const bundle = await build({
  stdin: { resolveDir: root, loader: "tsx", contents: `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { ChakraProvider } from '@chakra-ui/react';
    import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
    import { SearchParamsContext, PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
    import { system } from './src/theme';
    import { AuthProvider } from './src/contexts/AuthProvider';
    import { I18nProvider } from './src/contexts/I18nProvider';
    import { AdminAdvertisementsPageView } from './src/views/admin/AdminAdvertisementsPageView';
    import { AdvertisementPageView } from './src/views/Advertisement/AdvertisementPageView';
    import { WelcomePageView } from './src/views/Welcome/WelcomePageView';
    import './src/styles/tokens.css';
    import './src/styles/app-chrome.css';
    import './src/styles/design-system.css';
    const router = { push: href => location.assign(href), replace: href => location.replace(href), prefetch() {}, refresh() {}, back: () => history.back(), forward: () => history.forward() };
    const Page = location.pathname.startsWith('/admin') ? AdminAdvertisementsPageView : location.pathname === '/advertisement' ? AdvertisementPageView : WelcomePageView;
    createRoot(document.getElementById('root')).render(<React.StrictMode><AppRouterContext.Provider value={router}><SearchParamsContext.Provider value={new URLSearchParams(location.search)}><PathnameContext.Provider value={location.pathname}><ChakraProvider value={system}><I18nProvider><AuthProvider><main data-app-main style={{padding: '24px 16px', maxWidth: 1472, margin: 'auto'}}><Page /></main></AuthProvider></I18nProvider></ChakraProvider></PathnameContext.Provider></SearchParamsContext.Provider></AppRouterContext.Provider></React.StrictMode>);
  ` },
  outfile: "fixture.js", bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_API_BASE": JSON.stringify(api), "process.env": "{}" }, logLevel: "silent",
});

const image = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600"><rect width="960" height="600" fill="#e4f4f7"/><g stroke="#164d61" stroke-width="8" stroke-linejoin="round"><path d="M480 100 700 225 480 350 260 225Z" fill="#fff"/><path d="M260 225 480 350 480 570 260 445Z" fill="#46b8c9"/><path d="M480 350 700 225 700 445 480 570Z" fill="#f5bf58"/><path d="M333 183 553 308M407 142 627 267M333 267 553 142M407 308 627 183M333 267V487M407 308V528M260 298 480 423M260 372 480 497M553 308V528M627 267V487M480 423 700 298M480 497 700 372" fill="none"/></g></svg>`;
const initial = () => [
  { key: "first", title: "First ad", description: "Precision puzzles for everyday practice.\nExplore our new collection.", contact: "Contact: cube@example.test", imageUrl: "/cover.png", targetUrl: "", duration: 1, enabled: true, products: [], showcase: [] },
  { key: "second", title: "Second ad", description: "A disabled advertisement", contact: "", imageUrl: "/cover.png", targetUrl: "https://shop.example.test/collection", duration: 1, enabled: false, products: [], showcase: [] },
];

test("real advertisement UI and services, entirely intercepted HTTP", { timeout: 180_000 }, async t => {
  await mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = { screenshots: [], checks: [], requests: [], unexpected: [], errors: [], expectedHttpErrors: [] };
  const contexts = [];
  async function open(options = {}) {
    const context = await browser.newContext({ viewport: { width: options.width ?? 1440, height: options.height ?? 1000 }, reducedMotion: options.motion ?? "reduce", serviceWorkers: "block" });
    contexts.push(context);
    const state = { items: initial(), gets: 0, saves: [], uploads: [], failLoad: false, failPublic: false, failSave: false, failUpload: false, malformedUpload: false, auth: 31, ...options };
    const expectedHttpFailures = new Set();
    context.on("page", page => {
      page.on("pageerror", error => report.errors.push(error.message));
      page.on("console", message => {
        if (message.type() !== "error") return;
        const entry = { text: message.text(), url: message.location().url };
        if (/^Failed to load resource: the server responded with a status of (422|503)\b/.test(entry.text) && expectedHttpFailures.has(entry.url)) report.expectedHttpErrors.push(entry);
        else report.errors.push(entry);
      });
    });
    await context.addInitScript(() => {
      if (location.origin !== "https://ads.test") return;
      localStorage.setItem("cubing_pro_locale", "en-US");
      localStorage.setItem("authToken_cubing_pro", JSON.stringify({ token: "offline-advertisement-test", expire: "", status: "" }));
    });
    await context.route("**/*", async route => {
      const request = route.request();
      const url = new URL(request.url());
      const pathname = url.pathname;
      const json = (body, status = 200) => {
        if (status >= 400) expectedHttpFailures.add(request.url());
        return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
      };
      if (url.origin === "https://ads.test" && pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: bundle.outputFiles.find(file => file.path.endsWith(".js")).text });
      if (url.origin === "https://ads.test" && pathname === "/fixture.css") return route.fulfill({ contentType: "text/css", body: bundle.outputFiles.find(file => file.path.endsWith(".css")).text });
      if (url.origin === "https://api.ads.test" && pathname.startsWith("/v3/cube-api/")) {
        const endpoint = pathname.slice("/v3/cube-api".length);
        report.requests.push({ method: request.method(), endpoint });
        if (request.method() === "GET" && endpoint === "/auth/current") return json({ data: { id: 1, Auth: state.auth, name: "Offline administrator" } });
        if (request.method() === "GET" && endpoint.startsWith("/user/kv/")) return json({ data: {} });
        if (request.method() === "GET" && endpoint === "/public/acknowledgments") return json([{ nickname: "Offline sponsor", wcaID: "", amount: 100, pinned: true }]);
        if (request.method() === "GET" && endpoint === "/public/otherLinks") return json({ links: [], categories: [] });
        if (request.method() === "GET" && endpoint === "/public/advertisements") return json(state.failPublic ? { message: "public offline" } : state.publicItems ?? state.items, state.failPublic ? 503 : 200);
        if (endpoint === "/admin/system_result/advertisements" || endpoint === "/admin/system_result/advertisements/image") {
          assert.equal(request.headers().authorization, "Bearer offline-advertisement-test");
          assert.match(request.headers().accept, /application\/json/);
          if (request.method() === "GET" && endpoint.endsWith("/advertisements")) {
            state.gets++;
            if (state.holdLoad) await (state.loadPromise ??= new Promise(resolve => { state.finishLoad = resolve; }));
            return json(state.failLoad ? { message: "load rejected" } : state.items, state.failLoad ? 503 : 200);
          }
          if (request.method() === "PUT" && endpoint.endsWith("/advertisements")) {
            assert.match(request.headers()["content-type"], /application\/json/);
            const body = request.postDataJSON();
            assert.ok(Array.isArray(body), "whole-list PUT must be a bare array");
            state.saves.push(body);
            if (state.holdSave) await new Promise(resolve => { state.finishSave = resolve; });
            if (state.failSave) return json({ message: "save rejected" }, 422);
            state.items = structuredClone(body);
            return json({ code: "200", data: null, msg: "ok" });
          }
          if (request.method() === "POST" && endpoint.endsWith("/image")) {
            assert.match(request.headers()["content-type"], /application\/json/);
            const body = request.postDataJSON();
            assert.deepEqual(Object.keys(body).sort(), ["Data", "ImageName"]);
            assert.ok(!body.Data.startsWith("data:"), "upload JSON contains raw base64, not a data URL");
            state.uploads.push(body);
            if (state.holdUpload) await new Promise(resolve => { state.finishUpload = resolve; });
            if (state.failUpload) return json({ message: "upload rejected" }, 422);
            return json({ code: "200", msg: "ok", data: state.malformedUpload ? { url: "javascript:alert(1)" } : { uid: `upload-${state.uploads.length}`, url: `/v3/cube-api/static/image/upload-${state.uploads.length}`, width: 960, height: 600 } });
          }
        }
        if (request.method() === "GET" && endpoint.startsWith("/static/image/")) return route.fulfill({ contentType: "image/svg+xml", body: image });
      }
      if (url.origin === "https://ads.test" && request.isNavigationRequest() && request.method() === "GET") return route.fulfill({ contentType: "text/html", body: '<!doctype html><html data-palette="haitian"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>' });
      if (url.origin === "https://ads.test" && request.resourceType() === "image") {
        const localPath = path.resolve(root, "public", `.${decodeURIComponent(pathname)}`);
        if (localPath.startsWith(path.join(root, "public") + path.sep)) {
          try { return await route.fulfill({ path: localPath }); } catch { /* Use a deterministic offline image for fixture URLs. */ }
        }
        return route.fulfill({ contentType: "image/svg+xml", body: image });
      }
      if (url.origin === "https://shop.example.test" && request.isNavigationRequest() && request.method() === "GET" && ["/collection", "/product"].includes(pathname)) return route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Offline link destination</title><p>Intercepted advertisement destination</p>" });
      report.unexpected.push({ method: request.method(), url: request.url() });
      return route.abort();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12_000);
    await page.goto(`https://ads.test${options.route ?? "/admin/advertisements"}`);
    await page.waitForFunction(() => document.documentElement.lang === "en-US");
    return { page, context, state };
  }
  async function capture(page, name, locator, fullPage = true) {
    if (process.env.ADVERTISEMENT_SCREENSHOTS !== "1") return;
    const filename = path.join(artifacts, `${name}.png`);
    if (locator) await locator.screenshot({ path: filename, animations: "disabled" });
    else await page.screenshot({ path: filename, fullPage, animations: "disabled" });
    report.screenshots.push(filename);
  }
  async function noOverflow(page) {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "page must fit the viewport");
  }
  function basicInformation(page) {
    return page.locator("section").filter({ has: page.getByRole("heading", { name: "Basic information", exact: true }) });
  }
  async function styledVisitLinks(scope, label) {
    const links = scope.getByRole("link", { name: "Visit", exact: true });
    const count = await links.count();
    assert.ok(count > 0, `${label}: Visit links must be rendered`);
    for (let index = 0; index < count; index++) {
      const layout = await links.nth(index).evaluate(element => {
        const style = getComputedStyle(element);
        const icon = element.querySelector("svg");
        const text = [...element.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        const range = document.createRange();
        if (text) range.selectNodeContents(text);
        const rect = element.getBoundingClientRect();
        const textRect = text ? range.getBoundingClientRect() : null;
        const iconRect = icon?.getBoundingClientRect();
        const bounds = value => value ? { x: value.x, y: value.y, width: value.width, height: value.height } : null;
        return { classes: element.className, display: style.display, border: parseFloat(style.borderTopWidth), radius: parseFloat(style.borderTopLeftRadius), rect: bounds(rect), text: bounds(textRect), icon: bounds(iconRect) };
      });
      assert.match(layout.classes, /\bchakra-button\b/, `${label}: Chakra button props must reach the anchor`);
      assert.ok(["flex", "inline-flex"].includes(layout.display), `${label}: button uses flex layout`);
      assert.ok(layout.border > 0 && layout.radius > 0, `${label}: outline and rounded corners must be visible`);
      assert.ok(layout.text?.width > 0 && layout.icon?.width > 0, `${label}: text and arrow must render`);
      assert.ok(Math.abs(layout.text.y + layout.text.height / 2 - layout.icon.y - layout.icon.height / 2) <= 2, `${label}: arrow and label must share the same line`);
      assert.ok(layout.icon.x >= layout.text.x + layout.text.width - 1, `${label}: arrow must follow the label`);
      assert.ok(layout.icon.x + layout.icon.width <= layout.rect.x + layout.rect.width + 1, `${label}: arrow fits inside the button`);
      report.checks.push({ code: "visit-button", label, index, ...layout });
    }
  }
  async function received(predicate) {
    for (let attempt = 0; attempt < 500; attempt++) {
      if (predicate()) return;
      await delay(10);
    }
    assert.fail("intercepted HTTP request was not received");
  }
  async function pngFile(page, name = "cover.png") {
    const base64 = await page.evaluate(() => {
      const canvas = document.createElement("canvas"); canvas.width = 960; canvas.height = 600;
      const ctx = canvas.getContext("2d"); ctx.fillStyle = "#42bddc"; ctx.fillRect(0, 0, 960, 600);
      return canvas.toDataURL("image/png").split(",")[1];
    });
    return { name, mimeType: "image/png", buffer: Buffer.from(base64, "base64") };
  }
  async function closePreview(page) {
    await page.getByRole("button", { name: "Close", exact: true }).last().click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  try {
    await t.test("load, edit, upload JSON and unwrap response, galleries, real previews and whole-list save", async () => {
      const { page, state, context } = await open({ holdLoad: true });
      await page.getByRole("status").filter({ hasText: "Loading" }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Save complete list" }).isDisabled(), true);
      assert.equal(typeof state.finishLoad, "function");
      state.finishLoad();
      state.holdLoad = false;
      await page.getByLabel("Title", { exact: true }).fill("Edited ad");
      await page.getByRole("status").filter({ hasText: "Unsaved changes" }).waitFor();
      await capture(page, "admin-desktop");
      await page.getByLabel("Title", { exact: true }).scrollIntoViewIfNeeded();
      await capture(page, "admin-editor-desktop", null, false);
      await noOverflow(page);
      await page.evaluate(() => { const a = document.createElement("a"); a.href = "/elsewhere"; a.textContent = "fixture navigation"; document.body.append(a); });
      page.once("dialog", dialog => dialog.dismiss());
      await page.getByRole("link", { name: "fixture navigation" }).click();
      assert.equal(new URL(page.url()).pathname, "/admin/advertisements");
      const file = await pngFile(page);
      state.holdUpload = true;
      await page.getByLabel("Upload image", { exact: true }).first().setInputFiles(file);
      await page.waitForFunction(() => document.querySelector('input[type="file"]')?.matches(':disabled'));
      await received(() => state.uploads.length === 1);
      assert.equal(state.uploads.length, 1);
      assert.equal(state.uploads[0].ImageName, file.name);
      assert.deepEqual(Buffer.from(state.uploads[0].Data, "base64"), file.buffer);
      assert.equal(await page.getByLabel("Title", { exact: true }).isDisabled(), true);
      assert.equal(await page.getByRole("button", { name: "Add advertisement", exact: true }).isDisabled(), true);
      state.finishUpload();
      state.holdUpload = false;
      await page.waitForFunction(() => [...document.querySelectorAll("input")].some(input => input.value === "/v3/cube-api/static/image/upload-1"));
      assert.equal(await page.locator("img").first().getAttribute("src"), `${api}/static/image/upload-1`);
      await page.getByRole("button", { name: "Enlarge image", exact: true }).first().click();
      await page.getByRole("dialog").getByRole("img").waitFor();
      assert.equal(await page.getByRole("dialog").getByRole("img").getAttribute("src"), `${api}/static/image/upload-1`);
      await closePreview(page);

      const products = page.getByRole("region", { name: "Products", exact: true });
      await products.getByRole("button", { name: "Add image" }).click();
      await products.getByLabel("Image URL", { exact: true }).fill("/product.png");
      await products.getByLabel("Caption", { exact: true }).fill("Product caption");
      await products.getByLabel("Product link", { exact: true }).fill("https://shop.example.test/product");
      await products.getByRole("button", { name: "Add image" }).click();
      await products.getByLabel("Image URL", { exact: true }).last().fill("/second-product.png");
      await products.getByLabel("Caption", { exact: true }).last().fill("Second product");
      await products.getByRole("button", { name: "Move up", exact: true }).last().click();
      assert.equal(await products.getByLabel("Caption", { exact: true }).first().inputValue(), "Second product");
      await products.getByRole("button", { name: "Delete", exact: true }).first().click();
      assert.equal(await products.getByLabel("Caption", { exact: true }).inputValue(), "Product caption");
      const showcase = page.getByRole("region", { name: "Showcase", exact: true });
      await showcase.getByRole("button", { name: "Add image" }).click();
      await showcase.getByLabel("Upload image", { exact: true }).setInputFiles({ ...file, name: "showcase.png" });
      await page.waitForFunction(() => [...document.querySelectorAll("input")].some(input => input.value === "/v3/cube-api/static/image/upload-2"));
      await showcase.getByLabel("Caption", { exact: true }).fill("Showcase caption");
      await basicInformation(page).getByRole("button", { name: "Preview", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("img", { name: "Edited ad" }).waitFor();
      assert.equal(await dialog.getByRole("link").count(), 0, "card preview must not navigate");
      await capture(page, "admin-card-desktop", dialog);
      await dialog.getByRole("button", { name: "Draft details preview" }).click();
      await dialog.getByRole("heading", { name: "Products", exact: true }).waitFor();
      await dialog.getByText("Showcase caption", { exact: true }).waitFor();
      assert.equal(await dialog.getByRole("link", { name: "Visit", exact: true }).getAttribute("href"), "https://shop.example.test/product");
      await styledVisitLinks(dialog, "admin-detail-desktop");
      await capture(page, "admin-detail-desktop", dialog);
      await dialog.getByRole("button", { name: "Product caption", exact: true }).click();
      const productPreview = page.getByRole("dialog", { name: "Product caption", exact: true });
      await productPreview.getByRole("button", { name: "Close", exact: true }).click();
      await productPreview.waitFor({ state: "hidden" });
      await closePreview(page);
      await basicInformation(page).getByRole("button", { name: "Move down", exact: true }).click();
      state.holdSave = true;
      await page.getByRole("button", { name: "Save complete list", exact: true }).click();
      await page.waitForFunction(() => document.querySelector('input[type="number"]')?.matches(':disabled'));
      assert.equal(await page.getByRole("button", { name: "Add advertisement" }).isDisabled(), true);
      await received(() => state.saves.length === 1);
      assert.equal(state.saves.length, 1);
      assert.deepEqual(state.saves[0].map(item => item.key), ["second", "first"]);
      assert.equal(state.saves[0][0].enabled, false);
      assert.equal(state.saves[0][1].imageUrl, "/v3/cube-api/static/image/upload-1");
      assert.equal(state.saves[0][1].products[0].href, "https://shop.example.test/product");
      assert.equal(state.saves[0][1].showcase[0].imageUrl, "/v3/cube-api/static/image/upload-2");
      state.finishSave();
      state.holdSave = false;
      await page.waitForFunction(() => !document.querySelector('input[type="number"]')?.matches(':disabled'));
      assert.equal(await page.getByRole("button", { name: "Save complete list" }).isDisabled(), true);
      await page.reload();
      await page.getByRole("button", { name: "2. Edited ad", exact: true }).click();
      assert.equal(await page.getByLabel("Title", { exact: true }).inputValue(), "Edited ad");
      assert.equal(await showcase.getByLabel("Image URL", { exact: true }).inputValue(), "/v3/cube-api/static/image/upload-2");
      await context.close();
    });

    await t.test("failed load retry, rejected saves and uploads preserve drafts, add/delete and permissions", async () => {
      const { page, state, context } = await open({ failLoad: true, width: 390 });
      await page.getByRole("alert").filter({ hasText: "Could not load" }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Save complete list" }).isDisabled(), true);
      assert.equal(await page.getByRole("button", { name: "Add advertisement" }).isDisabled(), true);
      state.failLoad = false;
      await page.getByRole("button", { name: "Retry", exact: true }).click();
      await page.getByLabel("Title", { exact: true }).fill("Retry draft");
      state.failSave = true;
      await page.getByRole("button", { name: "Save complete list" }).click();
      await page.getByRole("alert").filter({ hasText: "save rejected" }).waitFor();
      assert.equal(await page.getByLabel("Title", { exact: true }).inputValue(), "Retry draft");
      state.failUpload = true;
      const file = await pngFile(page);
      await page.getByLabel("Upload image", { exact: true }).first().setInputFiles(file);
      await page.getByRole("alert").filter({ hasText: "upload rejected" }).waitFor();
      assert.equal(await page.getByLabel("Image URL", { exact: true }).inputValue(), "/cover.png");
      state.failUpload = false;
      state.malformedUpload = true;
      await page.getByLabel("Upload image", { exact: true }).first().setInputFiles(file);
      await page.getByRole("alert").filter({ hasText: "Upload failed" }).waitFor();
      assert.equal(await page.getByLabel("Image URL", { exact: true }).inputValue(), "/cover.png");
      const uploadCount = state.uploads.length;
      await page.getByLabel("Upload image", { exact: true }).first().setInputFiles({ name: "bad.png", mimeType: "image/png", buffer: Buffer.from("not an image") });
      await page.getByRole("alert").filter({ hasText: "Upload failed" }).waitFor();
      assert.equal(state.uploads.length, uploadCount, "invalid image must be rejected before HTTP");
      await page.getByLabel("Unique key", { exact: true }).fill("contact");
      await page.getByRole("button", { name: "Save complete list" }).click();
      await page.getByRole("alert").filter({ hasText: "reserved" }).waitFor();
      assert.equal(state.saves.length, 1);
      await page.getByRole("button", { name: "Add advertisement" }).click();
      assert.equal(await page.getByLabel("Title", { exact: true }).inputValue(), "");
      assert.equal(await page.locator('input[type="checkbox"]').isChecked(), false);
      await page.getByLabel("Title", { exact: true }).fill("Created ad");
      await page.getByLabel("Image URL", { exact: true }).fill("/new.png");
      await page.getByLabel("Unique key", { exact: true }).fill("created");
      await page.getByRole("button", { name: "1. Retry draft", exact: true }).click();
      await page.getByLabel("Unique key", { exact: true }).fill("first");
      state.failSave = false;
      await page.getByRole("button", { name: "Save complete list" }).click();
      await page.waitForFunction(() => !document.querySelector('input[type="number"]')?.matches(':disabled'));
      assert.equal(state.saves.length, 2);
      assert.equal(state.saves[1][2].key, "created");
      assert.equal(state.saves[1][2].enabled, false);
      await capture(page, "admin-mobile");
      await page.getByLabel("Title", { exact: true }).scrollIntoViewIfNeeded();
      await capture(page, "admin-editor-mobile", null, false);
      await page.getByLabel("Upload image", { exact: true }).scrollIntoViewIfNeeded();
      await capture(page, "admin-upload-mobile", null, false);
      await noOverflow(page);
      await basicInformation(page).getByRole("button", { name: "Preview", exact: true }).click();
      await capture(page, "admin-card-mobile", page.getByRole("dialog"));
      await noOverflow(page);
      await page.getByRole("dialog").getByRole("button", { name: "Draft details preview", exact: true }).click();
      await capture(page, "admin-detail-mobile", page.getByRole("dialog"));
      await noOverflow(page);
      await closePreview(page);
      await page.getByRole("region", { name: "Advertisements", exact: true }).getByRole("button", { name: "3. Created ad", exact: true }).click();
      page.once("dialog", dialog => dialog.accept());
      await basicInformation(page).getByRole("button", { name: "Delete", exact: true }).click();
      const remaining = page.getByRole("region", { name: "Advertisements", exact: true }).getByRole("button");
      assert.deepEqual(await remaining.allTextContents(), ["1. Retry draft", "2. Second ad"]);
      assert.equal(await basicInformation(page).getByLabel("Title", { exact: true }).inputValue(), "Second ad");
      await context.close();
      const denied = await open({ auth: 8 });
      await denied.page.getByRole("status").waitFor();
      assert.equal(denied.state.gets, 0);
      assert.equal(await denied.page.getByLabel("Title", { exact: true }).count(), 0);
      await denied.context.close();
    });

    await t.test("empty-list deletion requires confirmation and uses PUT []", async () => {
      const { page, state, context } = await open({ items: [initial()[0]] });
      page.once("dialog", dialog => dialog.accept());
      await basicInformation(page).getByRole("button", { name: "Delete", exact: true }).click();
      page.once("dialog", dialog => dialog.dismiss());
      await page.getByRole("button", { name: "Save complete list" }).click();
      assert.equal(state.saves.length, 0);
      page.once("dialog", dialog => dialog.accept());
      await page.getByRole("button", { name: "Save complete list" }).click();
      await page.getByRole("button", { name: "Save complete list" }).waitFor({ state: "visible" });
      await page.waitForFunction(() => document.querySelector('button')?.disabled === true);
      assert.deepEqual(state.saves, [[]]);
      await context.close();
    });

    for (const width of [1440, 1024, 768, 390, 320]) await t.test(`admin columns, separate sections, image cards and reachable saves at ${width}px`, async () => {
      const ad = {
        ...initial()[0],
        products: Array.from({ length: 3 }, (_, index) => ({ imageUrl: `/product-${index}.png`, caption: `Product ${index + 1}`, href: "https://shop.example.test/product" })),
        showcase: Array.from({ length: 3 }, (_, index) => ({ imageUrl: `/showcase-${index}.png`, caption: `Showcase ${index + 1}` })),
      };
      const { page, state, context } = await open({ width, height: 900, items: [ad, initial()[1]] });
      const basic = basicInformation(page);
      const details = page.locator("section").filter({ has: page.getByRole("heading", { name: "Detailed content", exact: true }) });
      await basic.getByLabel("Title", { exact: true }).fill("Layout draft");
      assert.equal(await basic.count(), 1, "basic information has its own section");
      assert.equal(await details.count(), 1, "detailed content has its own section");
      const sections = await page.locator("[data-ad-editor-layout]").evaluate(element => {
        const rect = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
        const [list, editor] = element.children;
        const [basic, details] = editor.children;
        return { layout: rect(element), list: rect(list), editor: rect(editor), basic: rect(basic), details: rect(details), gap: parseFloat(getComputedStyle(element).columnGap), separate: basic.tagName === "SECTION" && details.tagName === "SECTION" && basic !== details, selectionOnly: [...list.querySelectorAll("button")].every(button => button.hasAttribute("aria-pressed")), selectionCount: list.querySelectorAll("button").length };
      });
      assert.equal(sections.separate, true, "basic and detailed content must be sibling sections");
      assert.equal(sections.selectionOnly, true, "left column contains selection buttons only");
      assert.equal(sections.selectionCount, 2);
      assert.ok(sections.details.y >= sections.basic.bottom, "detailed content must follow basic information without overlap");
      for (const section of [sections.basic, sections.details]) {
        assert.ok(Math.abs(section.x - sections.editor.x) <= 1 && Math.abs(section.width - sections.editor.width) <= 1, "both sections fill the right editor column");
      }
      if (width >= 1024) {
        assert.ok(Math.abs(sections.editor.width / sections.list.width - 3) <= 0.02, "desktop columns must have a 1:3 width ratio");
        assert.ok(Math.abs(sections.list.width - (sections.layout.width - sections.gap) / 4) <= 1, "left column occupies one quarter of the available column width");
        assert.ok(Math.abs(sections.list.y - sections.editor.y) <= 1 && sections.editor.x >= sections.list.right + sections.gap - 1, "desktop columns sit beside each other");
      } else {
        assert.ok(sections.editor.y >= sections.list.bottom && Math.abs(sections.list.width - sections.editor.width) <= 1, "narrow layouts stack full-width list and editor");
      }
      assert.equal(await basic.getByRole("region", { name: "Products", exact: true }).count(), 0);
      assert.equal(await details.getByLabel("Title", { exact: true }).count(), 0);
      const cover = await basic.getByRole("img", { name: "Preview", exact: true }).boundingBox();
      assert.ok(cover && cover.height >= 160 && cover.width > 0, "cover has a large image preview");
      report.checks.push({ code: "admin-editor-layout", width, ...sections, cover });

      const layoutFailures = [];
      for (const name of ["Products", "Showcase"]) {
        const gallery = details.getByRole("region", { name, exact: true });
        assert.equal(await gallery.getByLabel("Image URL", { exact: true }).count(), 3);
        const layout = await gallery.evaluate(element => {
          const grid = element.children[1];
          const rect = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
          return { display: getComputedStyle(grid).display, columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length, grid: rect(grid), clientWidth: grid.clientWidth, scrollWidth: grid.scrollWidth, cards: [...grid.children].map(card => ({ ...rect(card), border: parseFloat(getComputedStyle(card).borderTopWidth), radius: parseFloat(getComputedStyle(card).borderTopLeftRadius), clientWidth: card.clientWidth, scrollWidth: card.scrollWidth, image: rect(card.querySelector("img")), fields: [...card.querySelectorAll("input, textarea, button")].map(rect) })) };
        });
        report.checks.push({ code: "admin-image-card-grid", width, name, ...layout });
        try {
          assert.equal(layout.display, "grid", `${name}: image cards use a grid`);
          assert.equal(layout.columns, width >= 768 ? 2 : 1, `${name}: desktop/tablet has two columns and mobile has one`);
          assert.equal(layout.cards.length, 3);
          assert.ok(layout.scrollWidth <= layout.clientWidth + 1, `${name}: grid must not overflow (${layout.scrollWidth}px content / ${layout.clientWidth}px available)`);
          for (const card of layout.cards) {
            assert.ok(card.border > 0 && card.radius > 0, `${name}: each image has a bordered, rounded card`);
            assert.ok(card.x >= layout.grid.x - 1 && card.right <= layout.grid.right + 1, `${name}: card fits inside the grid`);
            assert.ok(card.scrollWidth <= card.clientWidth + 1, `${name}: card content must not overflow`);
            assert.ok(card.image.height >= 160 && card.image.width > 0, `${name}: each card has a large preview`);
            for (const field of [card.image, ...card.fields]) assert.ok(field.x >= card.x - 1 && field.right <= card.right + 1, `${name}: images and controls fit inside their card`);
          }
          const [first, second, third] = layout.cards;
          if (width >= 768) {
            assert.ok(Math.abs(first.y - second.y) <= 1 && second.x >= first.right, `${name}: first two cards share a row`);
            assert.ok(third.y >= Math.max(first.bottom, second.bottom) && Math.abs(third.x - first.x) <= 1, `${name}: third card wraps to the next row`);
          } else {
            assert.ok(second.y >= first.bottom && third.y >= second.bottom, `${name}: mobile cards stack without overlap`);
          }
        } catch (error) { layoutFailures.push(error.message); }
      }
      await page.evaluate(async () => { window.scrollTo(0, document.documentElement.scrollHeight); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
      const scrolling = await page.evaluate(() => ({ y: scrollY, bottom: scrollY + innerHeight, height: document.documentElement.scrollHeight }));
      assert.ok(scrolling.y > 0 && Math.abs(scrolling.bottom - scrolling.height) <= 1, "save visibility is checked at the actual page bottom");
      const topSave = page.getByRole("button", { name: "Save complete list", exact: true });
      const bottomSave = details.getByRole("button", { name: "Save changes", exact: true });
      const saves = [];
      for (const button of [topSave, bottomSave]) saves.push(await button.evaluate(element => {
        const r = element.getBoundingClientRect();
        const inside = r.width > 0 && r.height > 0 && r.x >= 0 && r.right <= innerWidth && r.y >= 0 && r.bottom <= innerHeight;
        const hit = inside && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return { name: element.textContent, enabled: !element.disabled, inViewport: inside, unobscured: Boolean(hit && element.contains(hit)), y: r.y, bottom: r.bottom };
      }));
      const toolbar = await page.locator('[aria-label="Save complete list"]').evaluate(element => ({ position: getComputedStyle(element).position, top: parseFloat(getComputedStyle(element).top), y: element.getBoundingClientRect().y }));
      assert.equal(toolbar.position, "sticky", "top save toolbar stays sticky");
      assert.ok(Math.abs(toolbar.y - toolbar.top) <= 1, "toolbar stays at its configured top inset after scrolling");
      assert.ok(saves[0].enabled && saves[0].inViewport && saves[0].unobscured, "sticky Save complete list remains visible and unobscured at the bottom");
      assert.ok(saves[1].enabled && saves[1].inViewport && saves[1].unobscured, "bottom Save changes remains visible and unobscured");
      report.checks.push({ code: "admin-save-visibility", width, scrolling, toolbar, saves });
      await bottomSave.click();
      await received(() => state.saves.length === 1);
      await page.getByRole("status").filter({ hasText: "Saved" }).waitFor();
      assert.equal(state.saves[0][0].title, "Layout draft", "bottom save submits the edited complete list");
      assert.equal(state.saves[0][0].products.length, 3);
      assert.equal(state.saves[0][0].showcase.length, 3);
      assert.equal(await topSave.isDisabled(), true);
      assert.equal(await bottomSave.isDisabled(), true);
      try { await noOverflow(page); } catch (error) { layoutFailures.push(error.message); }
      report.checks.push({ code: "admin-layout-failures", width, failures: layoutFailures });
      await context.close();
      assert.deepEqual(layoutFailures, [], `${width}px admin layout must not overflow`);
    });

    await t.test("nested encoded unsafe URLs are rejected before PUT without losing the draft", async () => {
      const { page, state, context } = await open();
      await page.getByLabel("Title", { exact: true }).fill("URL validation draft");
      for (const value of ["/%252fexample.test", "/%255cpath", "/%250a", "/%C2%85", "/%252525252541"]) {
        await page.getByLabel("Destination URL", { exact: true }).fill(value);
        await page.getByRole("button", { name: "Save complete list" }).click();
        await page.getByRole("alert").waitFor();
        assert.equal(state.saves.length, 0, value);
        assert.equal(await page.getByLabel("Title", { exact: true }).inputValue(), "URL validation draft");
      }
      await page.getByLabel("Destination URL", { exact: true }).fill("/advertisement?key=first#products");
      await page.getByRole("button", { name: "Save complete list" }).click();
      await received(() => state.saves.length === 1);
      assert.equal(state.saves[0][0].targetUrl, "/advertisement?key=first#products");
      await context.close();
    });

    await t.test("public API carousel ordering, links, details, image dialogs, desktop and mobile", async () => {
      for (const width of [1440, 390]) {
        const ad = { ...initial()[0], products: [{ imageUrl: "/product.png", caption: "Product caption", href: "https://shop.example.test/product" }, { imageUrl: "/internal.png", caption: "Internal product", href: "/algs" }], showcase: [{ imageUrl: "/showcase.png", caption: "Showcase caption" }] };
        const { page, state, context } = await open({ route: "/welcome", width, items: [ad, initial()[1], { ...initial()[0], key: "external", title: "External ad", targetUrl: "https://shop.example.test/collection" }] });
        const carousel = page.locator('.welcome-ad-stage');
        await carousel.locator('.welcome-ad-dot').nth(3).waitFor();
        assert.equal(await carousel.locator('.welcome-ad-dot').count(), 4, "fixed first, two enabled API ads, fixed contact last");
        await page.getByText("Offline sponsor", { exact: true }).waitFor();
        assert.equal(await carousel.evaluate(element => Boolean(element.closest("section").previousElementSibling?.querySelector(".thanks-person"))), true, "advertisements must immediately follow rendered ThanksSection");
        await carousel.locator('.welcome-ad-dot').nth(1).click();
        await carousel.getByRole("img", { name: "First ad", exact: true }).waitFor();
        assert.equal(await carousel.locator('.welcome-ad-content a').getAttribute("href"), "/advertisement?key=first");
        assert.equal(await carousel.getByRole("link", { name: "Details", exact: true }).getAttribute("href"), "/advertisement?key=first");
        await noOverflow(page);
        await capture(page, `home-${width}`, carousel.locator("xpath=.."));
        await page.getByText("Offline sponsor", { exact: true }).scrollIntoViewIfNeeded();
        await capture(page, `home-thanks-${width}`, null, false);
        const card = await carousel.locator('.welcome-ad-content').evaluate(element => {
          const link = element.querySelector("a"); const rect = link.getBoundingClientRect();
          const region = element.getBoundingClientRect();
          const style = getComputedStyle(link);
          return { classes: link.className, display: style.display, borderRadius: style.borderRadius, overflow: style.overflow, link: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, region: { x: region.x, y: region.y, width: region.width, height: region.height } };
        });
        assert.ok(card.classes.length > 0, "Chakra card props must reach the anchor");
        assert.ok(parseFloat(card.borderRadius) > 0, "advertisement card must have rounded corners");
        assert.equal(card.overflow, "hidden", "advertisement card must clip overflowing content");
        assert.ok(Math.abs(card.link.height - card.region.height) <= 1 && Math.abs(card.link.width - card.region.width) <= 1, "advertisement link must fill the card");
        await carousel.scrollIntoViewIfNeeded();
        const clipping = await carousel.locator('.welcome-ad-content').evaluate(element => {
          const link = element.querySelector("a");
          const rect = element.getBoundingClientRect();
          const hit = document.elementFromPoint(rect.x + 1, rect.y + 1);
          return { cornerClipped: !link.contains(hit), radius: getComputedStyle(element).borderRadius, overflow: getComputedStyle(element).overflow };
        });
        assert.equal(clipping.cornerClipped, true, "rendered advertisement card must clip its rounded corner");
        assert.equal(clipping.overflow, "hidden");
        assert.ok(parseFloat(clipping.radius) > 0);
        report.checks.push({ code: "rendered-card-clipping", width, ...clipping });
        report.checks.push({ code: "managed-card-layout", width, ...card });
        await carousel.locator('.welcome-ad-dot').nth(2).click();
        const external = carousel.locator('.welcome-ad-content a');
        assert.equal(await external.getAttribute("href"), "https://shop.example.test/collection");
        assert.equal(await external.getAttribute("target"), "_blank");
        assert.match(await external.getAttribute("rel"), /noopener/);
        const popupPromise = page.waitForEvent("popup");
        await external.click();
        const popup = await popupPromise;
        await popup.waitForLoadState("domcontentloaded");
        assert.equal(popup.url(), "https://shop.example.test/collection");
        await popup.close();
        await carousel.locator('.welcome-ad-dot').nth(1).click();
        await carousel.locator('.welcome-ad-content a').click();
        await page.waitForURL("**/advertisement?key=first");
        await page.getByRole("heading", { name: "First ad", exact: true }).first().waitFor();
        await page.getByRole("heading", { name: "Products", exact: true }).waitFor();
        assert.equal(await page.getByRole("link", { name: "Visit", exact: true }).count(), 2);
        const productLink = page.getByRole("link", { name: "Visit", exact: true }).first();
        assert.equal(await productLink.getAttribute("href"), "https://shop.example.test/product");
        assert.equal(await productLink.getAttribute("target"), "_blank");
        assert.equal(await page.getByRole("link", { name: "Visit", exact: true }).last().getAttribute("href"), "/algs");
        await styledVisitLinks(page, `public-detail-${width}`);
        const productPopupPromise = page.waitForEvent("popup");
        await productLink.click();
        const productPopup = await productPopupPromise;
        await productPopup.waitForLoadState("domcontentloaded");
        assert.equal(productPopup.url(), "https://shop.example.test/product");
        await productPopup.close();
        await noOverflow(page);
        await capture(page, `public-detail-${width}`);
        await page.getByRole("button", { name: "Product caption", exact: true }).click();
        await page.getByRole("dialog", { name: "Product caption" }).getByRole("img", { name: "Product caption", exact: true }).waitFor();
        await capture(page, `public-image-${width}`, page.getByRole("dialog"));
        await page.getByRole("dialog", { name: "Product caption", exact: true }).getByRole("button", { name: "Close", exact: true }).click();
        await page.getByRole("dialog").waitFor({ state: "hidden" });
        state.failPublic = true;
        await page.reload();
        await page.getByRole("alert").waitFor();
        state.failPublic = false;
        await page.getByRole("button", { name: "Retry", exact: true }).click();
        await page.getByRole("heading", { name: "Products", exact: true }).waitFor();
        await page.goto("https://ads.test/advertisement?key=second");
        await page.getByText("Ad not found", { exact: true }).waitFor();
        await page.goto("https://ads.test/advertisement?key=contact");
        await page.getByRole("heading", { level: 1 }).waitFor();
        assert.equal(await page.getByRole("alert").count(), 0);
        await context.close();
      }
    });

    await t.test("carousel timer advances after API duration and pauses on interaction", async () => {
      const { page, context } = await open({ route: "/welcome", motion: "no-preference" });
      const carousel = page.locator('.welcome-ad-stage');
      await carousel.locator('.welcome-ad-dot').nth(2).waitFor();
      await carousel.locator('.welcome-ad-dot').nth(1).click();
      await carousel.getByRole("button", { name: "Play", exact: true }).click();
      await page.getByRole("heading", { level: 1 }).hover();
      await page.waitForFunction(() => document.querySelectorAll('.welcome-ad-dot')[2]?.getAttribute('aria-current') === 'true');
      await carousel.hover();
      await page.clock.install();
      await page.clock.fastForward(15_000);
      assert.equal(await carousel.locator('.welcome-ad-dot').nth(2).getAttribute("aria-current"), "true");
      await context.close();
    });

    await t.test("failed public API preserves fixed carousel entries and detail retry handles malformed GET", async () => {
      const { page, state, context } = await open({ route: "/welcome", failPublic: true });
      const carousel = page.locator('.welcome-ad-stage');
      await carousel.locator('.welcome-ad-dot').nth(1).waitFor();
      assert.equal(await carousel.locator('.welcome-ad-dot').count(), 2);
      await carousel.locator('.welcome-ad-dot').last().click();
      assert.equal(await carousel.getByRole("link", { name: "Details", exact: true }).getAttribute("href"), "/advertisement?key=contact");
      state.failPublic = false;
      state.publicItems = { data: initial() };
      await page.goto("https://ads.test/advertisement?key=first");
      await page.getByRole("alert").waitFor();
      state.publicItems = initial();
      await page.getByRole("button", { name: "Retry", exact: true }).click();
      await page.getByRole("heading", { name: "First ad", exact: true }).first().waitFor();
      await context.close();
    });

    for (const width of [1440, 390]) for (const count of [12, 50]) await t.test(`${count + 2} carousel pagination controls fit and remain usable at ${width}px`, async () => {
      const items = Array.from({ length: count }, (_, index) => ({ ...initial()[0], key: `campaign-${index}`, title: `Campaign ${index + 1}` }));
      const { page, context } = await open({ route: "/welcome", width, items, motion: "no-preference" });
      const carousel = page.locator('.welcome-ad-stage');
      const dots = carousel.locator('.welcome-ad-dot');
      await dots.nth(count + 1).waitFor();
      assert.equal(await dots.count(), count + 2);
      const layout = await carousel.evaluate(element => {
        const controls = element.querySelector('.welcome-ad-controls');
        const rect = controls.getBoundingClientRect();
        const dots = element.querySelector('.welcome-ad-dots');
        const buttons = [...controls.querySelectorAll('button, a')].map(button => { const r = button.getBoundingClientRect(); return { text: button.textContent, x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; });
        return { viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth, controlsWidth: rect.width, controlsScrollWidth: controls.scrollWidth, dotsWidth: dots.clientWidth, dotsScrollWidth: dots.scrollWidth, controlsBottom: rect.bottom, buttons };
      });
      await noOverflow(page);
      assert.ok(layout.controlsScrollWidth <= layout.controlsWidth + 1, "carousel controls must not overflow horizontally");
      assert.ok(layout.dotsScrollWidth <= layout.dotsWidth + 1, "pagination must wrap instead of overflow");
      for (const button of layout.buttons) {
        assert.ok(button.x >= 0 && button.right <= width + 1, `${button.text}: control must stay inside viewport`);
        assert.ok(button.width > 0 && button.height > 0 && button.bottom <= layout.controlsBottom + 1, `${button.text}: control must fit the controls container`);
      }
      for (let index = 0; index < layout.buttons.length; index++) for (const other of layout.buttons.slice(index + 1)) {
        const button = layout.buttons[index];
        assert.ok(Math.min(button.right, other.right) - Math.max(button.x, other.x) <= 1 || Math.min(button.bottom, other.bottom) - Math.max(button.y, other.y) <= 1, `${button.text}/${other.text}: carousel controls must not overlap`);
      }
      await dots.nth(count).click();
      await carousel.getByRole("img", { name: `Campaign ${count}`, exact: true }).waitFor();
      await dots.last().click();
      assert.equal(await dots.last().getAttribute("aria-current"), "true");
      assert.equal(await carousel.getByRole("link", { name: "Details", exact: true }).getAttribute("href"), "/advertisement?key=contact");
      report.checks.push({ code: "carousel-pagination", count: count + 2, width, ...layout });
      await capture(page, `home-pagination-${count + 2}-${width}`, carousel.locator("xpath=.."));
      await context.close();
    });
  } finally {
    await Promise.all(contexts.map(context => context.close()));
    await browser.close();
    await writeFile(path.join(artifacts, "report.json"), JSON.stringify(report, null, 2));
  }
  assert.deepEqual(report.errors, [], "real components must not throw browser/React errors");
  assert.deepEqual(report.unexpected, [], "every request must have an explicit offline response");
  console.log(`Advertisement artifacts: ${artifacts}`);
  console.log(`Layout checks recorded: ${report.checks.length}; unexpected requests: ${report.unexpected.length}; unexpected console/page errors: ${report.errors.length}; expected mocked HTTP errors: ${report.expectedHttpErrors.length}`);
});
