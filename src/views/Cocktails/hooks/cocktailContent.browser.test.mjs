import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

// Exercise the real hooks in React without changing or depending on page wiring.
const { outputFiles } = await build({
  stdin: {
    contents: `
      import React, { StrictMode } from "react";
      import { createRoot } from "react-dom/client";
      import { I18nProvider, useI18n } from "@/contexts/I18nProvider";
      import { useCocktails, useCocktail } from "@/views/Cocktails/hooks/useCocktails";
      function List() {
        const state = useCocktails();
        return <pre id="list">{JSON.stringify(state)}</pre>;
      }
      function Detail() {
        const state = useCocktail("alexander");
        return <pre id="detail">{JSON.stringify(state)}</pre>;
      }
      function App() {
        const { setLocale } = useI18n();
        window.setCocktailLocale = setLocale;
        return <><List/><Detail/></>;
      }
      createRoot(document.getElementById("root")).render(<StrictMode><I18nProvider><App/></I18nProvider></StrictMode>);
    `,
    resolveDir: process.cwd(),
    sourcefile: "cocktail-hook-harness.tsx",
    loader: "tsx",
  },
  alias: { "@": resolve("src") },
  bundle: true,
  write: false,
  platform: "browser",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
});

const hits = new Map();
const server = createServer(async (request, response) => {
  const url = request.url;
  if (url === "/") {
    response.setHeader("Content-Type", "text/html");
    response.end('<!doctype html><div id="root"></div><script src="/harness.js"></script>');
  } else if (url === "/harness.js") {
    response.setHeader("Content-Type", "application/javascript");
    response.end(outputFiles[0].contents);
  } else if (url === "/iba/cocktails.json" || /^\/i18n\/cocktails\/(en-US|ja|yue-Hant-HK|ko|fr|es)\.json$/.test(url)) {
    hits.set(url, (hits.get(url) ?? 0) + 1);
    try {
      const data = await readFile(resolve(`public${url}`));
      response.setHeader("Content-Type", "application/json");
      if (url.endsWith("/ja.json")) setTimeout(() => response.end(data), 150);
      else response.end(data);
    } catch {
      response.writeHead(404).end();
    }
  } else response.writeHead(404).end();
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const { port } = server.address();
  await page.goto(`http://127.0.0.1:${port}`);
  const waitFor = async (expected) => {
    await page.waitForFunction((name) => {
      const list = JSON.parse(document.querySelector("#list").textContent);
      const detail = JSON.parse(document.querySelector("#detail").textContent);
      return !list.loading && !detail.loading && list.cocktails.length === 102
        && list.cocktails[0].name === name && detail.cocktail?.name === name;
    }, expected);
  };
  await waitFor("Alexander");
  for (const [locale, expected] of [
    ["en-US", "Alexander"], ["ja", "アレキサンダー"], ["yue-Hant-HK", "亞歷山大"],
    ["ko", "알렉산더"], ["fr", "Alexandre"], ["es", "Alejandro"],
  ]) {
    await page.evaluate((next) => window.setCocktailLocale(next), locale);
    await waitFor(expected);
    const state = await page.locator("#list").textContent().then(JSON.parse);
    const resource = JSON.parse(await readFile(resolve(`public/i18n/cocktails/${locale}.json`), "utf8"));
    assert.deepEqual(state.cocktails[0].ingredients, resource.alexander.ingredients);
    assert.equal(state.error, null);
  }
  for (const [url, count] of hits) assert.equal(count, 1, `${url}: list and detail share one request`);
  await page.evaluate(() => window.setCocktailLocale("ja"));
  await waitFor("アレキサンダー");
  assert.equal(hits.get("/i18n/cocktails/ja.json"), 1, "locale revisit uses cache");
  const racing = await browser.newPage();
  racing.on("pageerror", (error) => errors.push(error.message));
  await racing.goto(`http://127.0.0.1:${port}`);
  await racing.waitForFunction(() => typeof window.setCocktailLocale === "function");
  const japaneseRequest = racing.waitForRequest((request) => request.url().endsWith("/ja.json"));
  await racing.evaluate(() => window.setCocktailLocale("ja"));
  await japaneseRequest;
  await racing.evaluate(() => window.setCocktailLocale("fr"));
  await racing.waitForFunction(() => JSON.parse(document.querySelector("#detail").textContent).cocktail?.name === "Alexandre");
  await racing.waitForTimeout(200);
  const latest = JSON.parse(await racing.locator("#detail").textContent());
  assert.equal(latest.cocktail.name, "Alexandre", "late locale result cannot replace the active locale");
  await racing.close();
  assert.deepEqual(errors, []);
  console.log("PASS: real list/detail hooks follow I18nProvider across seven locales, share requests, reuse cache in Strict Mode, and ignore cancelled locale results");
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
