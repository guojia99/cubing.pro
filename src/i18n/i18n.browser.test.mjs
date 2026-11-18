import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { transform } from "esbuild";
import { chromium } from "playwright";

// Exercise the actual token module, including failures callers must observe.
const tokenSource = await readFile(new URL("../services/cubing-pro/auth/token.ts", import.meta.url), "utf8");
const { code: tokenCode } = await transform(tokenSource, { loader: "ts", format: "cjs", target: "es2022" });
const tokenKey = "authToken_cubing_pro";
const token = { token: "browser-test-token", expire: "", status: "" };
const storageError = new Error("Storage disabled by browser test");
const denyStorage = () => { throw storageError; };
function tokenModule(window) {
  const tokenModule = { exports: {} };
  runInNewContext(tokenCode, { module: tokenModule, exports: tokenModule.exports, window, URL, URLSearchParams, require: () => ({ refreshToken: denyStorage }) });
  return tokenModule.exports;
}
const values = new Map();
const storage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: key => values.delete(key),
};
const workingToken = tokenModule({ localStorage: storage });
workingToken.saveToken(token);
assert.equal(values.get(tokenKey), JSON.stringify(token));
assert.equal(JSON.stringify(workingToken.getToken()), JSON.stringify(token));
workingToken.removeToken();
assert.equal(workingToken.getToken(), null);
values.set(tokenKey, "invalid json");
assert.equal(workingToken.getToken(), null);
for (const mode of ["server", "getter", "getItem", "setItem", "removeItem"]) {
  const window = mode === "server" ? undefined : { localStorage: { ...storage, [mode]: denyStorage } };
  if (mode === "getter") Object.defineProperty(window, "localStorage", { get: denyStorage });
  const auth = tokenModule(window);
  if (["server", "getter", "getItem"].includes(mode)) {
    assert.equal(auth.getToken(), null);
    assert.equal(auth.AuthHeader().Authorization, "Bearer ");
    await auth.refreshTokenInter();
  }
  if (["server", "getter", "setItem"].includes(mode)) {
    assert.throws(() => auth.saveToken(token), /Unable to save authentication token/);
  }
  if (["server", "getter", "removeItem"].includes(mode)) {
    assert.throws(() => auth.removeToken(), /Unable to remove authentication token/);
  }
  if (["getter", "setItem"].includes(mode)) {
    window.location = { search: "?token=callback-test-token", href: "http://localhost/auth/callback?token=callback-test-token" };
    let replaced = false;
    window.history = { replaceState: () => { replaced = true; } };
    assert.throws(() => auth.processWcaCallbackToken(), /Unable to save authentication token/);
    assert.equal(replaced, false, "Failed token persistence must not complete the callback");
  }
}
console.log("PASS token read/save/remove, malformed JSON, unavailable storage, failed callback persistence");

// Use an existing local Next server (dev or production); never contact a backend.
const url = new URL(process.env.I18N_TEST_URL || "http://127.0.0.1:3000/settings/");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname), "Use a local test server");
const storageKey = "cubing_pro_locale";
const locales = [
  ["zh-CN", "简体中文"], ["en-US", "English"], ["ja", "日本語"],
  ["yue-Hant-HK", "廣東話"], ["ko", "한국어"], ["fr", "Français"], ["es", "Español"],
];
const browser = await chromium.launch();
const errors = [];
const blockedRequests = new Set();

async function createContext() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
  context.on("page", page => {
    page.on("pageerror", error => errors.push(error.stack || error.message));
    page.on("console", message => {
      if (message.type() === "error") errors.push(message.text());
    });
  });
  await context.route("**/*", route => {
    const request = route.request();
    const target = new URL(request.url());
    if (target.pathname.includes("/v3/cube-api")) {
      blockedRequests.add(`${request.method()} ${target.pathname}`);
      return route.fulfill({ status: 200, json: { code: "200", data: [] } });
    }
    if (target.origin !== url.origin || !["GET", "HEAD"].includes(request.method())) {
      blockedRequests.add(`${request.method()} ${target.origin}${target.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  return context;
}

function trigger(page) {
  return page.locator("header button[aria-label][aria-haspopup=menu]").first();
}

async function load(page, locale = "zh-CN") {
  await page.goto(url.href, { waitUntil: "networkidle" });
  await trigger(page).waitFor();
  await languageIs(page, locale);
}

async function languageIs(page, locale) {
  await page.waitForFunction(value => document.documentElement.lang === value, locale);
}

async function themeScriptType(page) {
  return page.locator("script").evaluateAll(scripts => {
    const script = scripts.find(script => script.textContent.includes("cubing-pro-theme") && !script.textContent.includes("self.__next_f"));
    return script ? script.getAttribute("type") || "" : null;
  });
}

async function open(page, current) {
  await trigger(page).click();
  const menu = page.getByRole("menu");
  await menu.waitFor();
  await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "menu");
  assert.equal(await menu.getByRole("menuitemradio").count(), 7);
  assert.equal(await menu.getByRole("menuitemradio", { checked: true }).count(), 1);
  assert.equal(await menu.getByRole("menuitemradio", { checked: true }).getAttribute("lang"), current);
  assert.equal(await trigger(page).getAttribute("aria-expanded"), "true");
  return menu;
}

async function select(page, next, current) {
  const menu = await open(page, current);
  const item = menu.getByRole("menuitemradio", { name: next[1], exact: true });
  // A normal Playwright click waits for positioning and fails on header interception.
  await item.click();
  await menu.waitFor({ state: "hidden" });
  await languageIs(page, next[0]);
  await page.waitForFunction(() => document.activeElement === document.querySelector("header button[aria-label][aria-haspopup=menu]"));
}

async function checkBounds(page, closedWidth) {
  const menu = page.getByRole("menu");
  await menu.getByRole("menuitemradio").first().click({ trial: true });
  const bounds = await menu.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const positioner = element.parentElement;
    return {
      left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
      width: innerWidth, height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      layer: Number(getComputedStyle(positioner).zIndex),
      headerLayer: Number(getComputedStyle(document.querySelector("header")).zIndex),
    };
  });
  assert.ok(bounds.left >= 0 && bounds.right <= bounds.width, JSON.stringify(bounds));
  assert.ok(bounds.top >= 0 && bounds.bottom <= bounds.height, JSON.stringify(bounds));
  assert.ok(bounds.layer > bounds.headerLayer, JSON.stringify(bounds));
  if (closedWidth !== undefined) assert.ok(bounds.scrollWidth <= closedWidth, `Menu adds viewport overflow: ${JSON.stringify(bounds)}`);
  return bounds;
}

async function checkHeader(page) {
  const login = page.locator("[data-app-header] a[href='/login'], [data-app-header] a[href='/login/']");
  await login.waitFor();
  const label = await login.getAttribute("aria-label");
  assert.ok(label?.trim(), "Login must retain its full accessible label");
  assert.equal(await page.getByRole("link", { name: label, exact: true }).count(), 1);
  const bounds = await login.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const header = element.closest("header").getBoundingClientRect();
    const text = element.querySelector("span:last-child");
    return {
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      left: rect.left, right: rect.right, loginWidth: rect.width,
      headerLeft: header.left, headerRight: header.right,
      textVisible: getComputedStyle(text).display !== "none",
    };
  });
  assert.ok(bounds.scrollWidth <= bounds.width, `Closed header overflows: ${JSON.stringify(bounds)}`);
  assert.ok(bounds.headerLeft >= 0 && bounds.headerRight <= bounds.width, JSON.stringify(bounds));
  assert.ok(bounds.left >= 0 && bounds.right <= bounds.width, JSON.stringify(bounds));
  assert.equal(bounds.textVisible, bounds.width >= 768, JSON.stringify(bounds));
  if (bounds.width < 768) assert.ok(bounds.loginWidth <= 40, JSON.stringify(bounds));
  await login.click({ trial: true });
  return bounds.scrollWidth;
}

try {
  const server = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: "block" });
  await server.route("**/*", route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
  const serverPage = await server.newPage();
  await serverPage.goto(url.href);
  const serverScriptType = await themeScriptType(serverPage);
  assert.notEqual(serverScriptType, null, "SSR must include the theme pre-hydration script");
  assert.equal(await serverPage.locator("script").evaluateAll(scripts => {
    const script = scripts.find(script => script.textContent.includes("cubing-pro-theme") && !script.textContent.includes("self.__next_f"));
    const emotion = document.querySelector("style[data-emotion]");
    return !!(script && emotion && (script.compareDocumentPosition(emotion) & Node.DOCUMENT_POSITION_FOLLOWING));
  }), true, "Theme script must precede Emotion styles before they move into head");
  await server.close();

  const context = await createContext();
  const page = await context.newPage();
  await load(page);
  assert.equal(await themeScriptType(page), serverScriptType, "Theme script must keep its SSR type during hydration");
  let current = "zh-CN";
  for (const next of locales) {
    await select(page, next, current);
    current = next[0];
    assert.equal(await page.evaluate(key => localStorage.getItem(key), storageKey), current);
    await page.reload({ waitUntil: "networkidle" });
    await languageIs(page, current);
    await open(page, current);
    await checkBounds(page);
    await page.keyboard.press("Escape");
    await page.getByRole("menu").waitFor({ state: "hidden" });
  }
  console.log("PASS seven real menu clicks, html.lang, radio selection, persistence after every reload");

  const peer = await context.newPage();
  await load(peer, current);
  for (const next of locales) {
    await open(peer, current);
    await select(page, next, current);
    current = next[0];
    await languageIs(peer, current);
    const checked = peer.getByRole("menuitemradio", { checked: true });
    await peer.waitForFunction(value => document.querySelector('[role="menuitemradio"][aria-checked="true"]')?.getAttribute("lang") === value, current);
    assert.equal(await checked.count(), 1);
    await peer.keyboard.press("Escape");
    await peer.getByRole("menu").waitFor({ state: "hidden" });
  }
  await select(peer, locales[1], current);
  current = "en-US";
  await languageIs(page, current);
  console.log("PASS native cross-tab storage events, bidirectional switching, open menu radio state");
  await peer.close();

  await trigger(page).focus();
  await page.keyboard.press("ArrowDown");
  const menu = page.getByRole("menu");
  await menu.waitFor();
  await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "menu");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await languageIs(page, "es");
  await menu.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement === document.querySelector("header button[aria-label][aria-haspopup=menu]"));
  await page.keyboard.press("Space");
  await menu.waitFor();
  await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "menu");
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Space");
  await languageIs(page, "en-US");
  await menu.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement === document.querySelector("header button[aria-label][aria-haspopup=menu]"));
  await page.keyboard.press("Enter");
  await menu.waitFor();
  await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "menu");
  await page.keyboard.press("f");
  await page.keyboard.press("Enter");
  await languageIs(page, "fr");
  await menu.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement === document.querySelector("header button[aria-label][aria-haspopup=menu]"));
  await page.keyboard.press("Enter");
  await menu.waitFor();
  await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "menu");
  await page.keyboard.press("Escape");
  await menu.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement === document.querySelector("header button[aria-label][aria-haspopup=menu]"));
  await page.keyboard.press("Enter");
  await menu.waitFor();
  await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "menu");
  await page.keyboard.press("Tab");
  await menu.waitFor({ state: "hidden" });
  console.log("PASS keyboard opening, arrows, Home/End, typeahead, Enter/Space, Escape focus return, Tab dismissal");

  current = "fr";
  for (const [width, height] of [[320, 740], [375, 812], [390, 844], [768, 900], [1280, 900], [1440, 900], [568, 320]]) {
    await page.setViewportSize({ width, height });
    const closedWidth = await checkHeader(page);
    await open(page, current);
    const bounds = await checkBounds(page, closedWidth);
    await page.keyboard.press("Escape");
    await menu.waitFor({ state: "hidden" });
    for (const next of locales) {
      await select(page, next, current);
      current = next[0];
      await checkHeader(page);
    }
    console.log(`PASS viewport ${width}x${height}: closed scrollWidth=${closedWidth}; seven clickable items; menu x=${bounds.left}..${bounds.right}, y=${bounds.top}..${bounds.bottom}`);
  }
  await context.close();

  for (const mode of ["writes", "read/write", "unavailable"]) {
    const blocked = await createContext();
    await blocked.addInitScript(mode => {
      const deny = () => {
        const error = new DOMException("Storage disabled by browser test", "SecurityError");
        error.stack = new Error(error.message).stack;
        throw error;
      };
      if (mode === "unavailable") Object.defineProperty(window, "localStorage", { get: deny });
      else {
        Storage.prototype.setItem = deny;
        if (mode === "read/write") {
          Storage.prototype.getItem = deny;
          Storage.prototype.removeItem = deny;
        }
      }
    }, mode);
    const offline = await blocked.newPage();
    // Cold loads/reloads used to intermittently recover from a script/style mismatch.
    for (let attempt = 0; attempt < 5; attempt++) {
      await load(offline);
      assert.equal(await themeScriptType(offline), serverScriptType, `Theme script type: ${mode}, load ${attempt}`);
      assert.deepEqual(errors, [], `Strict hydration: ${mode}, load ${attempt}`);
    }
    await checkHeader(offline);
    current = "zh-CN";
    for (const next of locales) {
      await select(offline, next, current);
      current = next[0];
      await open(offline, current);
      await offline.keyboard.press("Escape");
      await offline.getByRole("menu").waitFor({ state: "hidden" });
    }
    const darkBefore = await offline.locator("html").evaluate(element => element.classList.contains("dark"));
    await offline.getByRole("button", { name: "Apariencia", exact: true }).click();
    await offline.getByRole("button", { name: darkBefore ? "Claro" : "Oscuro", exact: true }).click();
    await offline.waitForFunction(wasDark => document.documentElement.classList.contains("dark") !== wasDark, darkBefore);
    assert.deepEqual(errors, [], `Storage ${mode}: language and theme switches must not report errors`);
    console.log(`PASS storage ${mode} blocked: seven real switches, html.lang and controlled radio state`);
    await blocked.close();
  }
  assert.deepEqual(errors, [], "Uncaught browser errors");
  console.log(`PASS zero uncaught browser errors; backend/external requests intercepted: ${JSON.stringify([...blockedRequests])}`);
} finally {
  await browser.close();
}
