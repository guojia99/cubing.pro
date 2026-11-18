import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { expect } from "playwright/test";

const baseURL = process.env.COCKTAIL_BASE_URL ?? "http://127.0.0.1:3000";
const locales = ["zh-CN", "en-US", "ja", "yue-Hant-HK", "ko", "fr", "es"];
const source = JSON.parse(await readFile("public/iba/cocktails.json", "utf8"));
const resources = new Map();
for (const locale of locales) {
  resources.set(locale, locale === "zh-CN" ? Object.fromEntries(source.map((row) => [row.slug, row]))
    : JSON.parse(await readFile(`public/i18n/cocktails/${locale}.json`, "utf8")));
}
const displayName = (locale, slug) => locale === "zh-CN" && slug === "alexander"
  ? "亚历山大" : resources.get(locale)[slug].name;
const errors = [];
const browser = await chromium.launch({ headless: true });
const languageTabs = new WeakMap();

async function prepare(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
  await context.addInitScript(() => {
    localStorage.setItem("cubing-pro-cocktails-safety-ack-v1", "1");
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page };
}

async function selectLocale(page, locale) {
  let settings = languageTabs.get(page);
  if (!settings) {
    settings = await page.context().newPage();
    await settings.goto(`${baseURL}/iba/cocktails.json`);
    languageTabs.set(page, settings);
  }
  await settings.evaluate((next) => localStorage.setItem("cubing_pro_locale", next), locale);
  await page.waitForFunction((expected) => document.documentElement.lang === expected, locale);
}

async function expectText(locator, expected) {
  await expect(locator).toHaveText(expected, { timeout: 30000 });
}

async function selectMode(page, mode) {
  await page.locator(".food-list-modes label").filter({ has: page.locator(`input[value="${mode}"]`) }).click();
  await expect(page.locator(`.food-list-modes input[value="${mode}"]`)).toBeChecked();
}

try {
  const { context, page } = await prepare();
  const requests = new Map();
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname === "/iba/cocktails.json" || pathname.startsWith("/i18n/cocktails/")) {
      requests.set(pathname, (requests.get(pathname) ?? 0) + 1);
    }
  });
  await page.goto(`${baseURL}/other/cocktails/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await expectText(page.locator(".food-card-link").first(), "亚历山大");
  const firstCard = page.locator(".food-card").first();
  await firstCard.locator("button").nth(1).click();
  await firstCard.locator("button").nth(0).click();
  await selectMode(page, "tonight");
  await page.locator(".tonight-receipt").waitFor();
  await page.locator('.tonight-receipt input[type="checkbox"]').first().check({ force: true });
  for (const locale of locales) {
    await selectLocale(page, locale);
    await expectText(page.locator(".food-card-link").first(), displayName(locale, "alexander"));
    await expectText(page.locator(".tonight-receipt-dish").first(), displayName(locale, "alexander"));
    await page.waitForFunction(() => document.querySelector('.tonight-receipt input[type="checkbox"]')?.checked);
    const ingredient = resources.get(locale).alexander.ingredients[0];
    assert.match(await page.locator(".tonight-receipt-ingredient").first().textContent(),
      new RegExp(ingredient.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(await page.locator(".food-card").count(), 1);
    assert.equal(await firstCard.locator('button[aria-pressed="true"]').count(), 2);
    await selectMode(page, "favorites");
    await expectText(page.locator(".food-card-link").first(), displayName(locale, "alexander"));
    assert.equal(await page.locator(".food-card").count(), 1);
    await selectMode(page, "tonight");
    await page.locator(".tonight-receipt-dish").first().waitFor();
  }
  // The checked item remains usable after changing locale, in either direction.
  await page.locator('.tonight-receipt input[type="checkbox"]').first().uncheck({ force: true });
  await selectLocale(page, "zh-CN");
  await expectText(page.locator(".food-card-link").first(), "亚历山大");
  assert.equal(await page.locator('.tonight-receipt input[type="checkbox"]').first().isChecked(), false);
  await page.locator('.tonight-receipt input[type="checkbox"]').first().check({ force: true });

  await selectMode(page, "all");
  await expectText(page.locator(".food-card-link").first(), "亚历山大");
  await selectLocale(page, "ja");
  await expectText(page.locator(".food-card-link").first(), "アレキサンダー");
  await page.locator(".food-page-header button").first().count().then(async (count) => {
    if (count) await page.locator(".food-page-header button").first().click();
    else await page.getByRole("button", { name: "今夜は何を飲む？", exact: true }).first().click();
  });
  await page.getByRole("dialog").waitFor();
  await page.getByRole("dialog").getByRole("button", { name: "ランダムに選ぶ", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "カクテルを見る", exact: true }).waitFor();
  const pickedName = (await page.locator(".random-pick-name").textContent()).trim();
  assert.ok(Object.values(resources.get("ja")).some((row) => row.name === pickedName));
  const records = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((key) => key.startsWith("cubing-pro-cocktail-spin-"));
    return JSON.parse(localStorage.getItem(key));
  });
  const picked = source.find((row) => row.slug === records.at(-1).slug);
  assert.equal(records.at(-1).enName, picked.name, "spin history retains its original schema");
  await page.keyboard.press("Escape");
  await selectLocale(page, "zh-CN");
  await expectText(page.locator(".food-card-link").first(), "亚历山大");
  await page.locator(".food-card-link").first().click();
  await page.locator(".cocktail-detail-grid").waitFor();
  const imagePath = await page.locator(".cocktail-detail-image").getAttribute("src");
  for (const locale of locales) {
    await selectLocale(page, locale);
    await expectText(page.locator("main h1"), displayName(locale, "alexander"));
    const lists = page.locator(".cocktail-detail-grid ul");
    await page.waitForFunction((expected) => document.querySelector(".cocktail-detail-grid ul li")?.textContent === expected,
      resources.get(locale).alexander.ingredients[0]);
    assert.deepEqual(await lists.nth(0).locator("li").allTextContents(), resources.get(locale).alexander.ingredients);
    assert.deepEqual((await lists.nth(1).locator("li").allTextContents()).map((text) => text.replace(/^\d+\.\s*/, "")),
      resources.get(locale).alexander.method);
    assert.deepEqual(await lists.nth(2).locator("li").allTextContents(), resources.get(locale).alexander.garnish);
    assert.equal(await page.locator(".cocktail-detail-image").getAttribute("alt"), displayName(locale, "alexander"));
    assert.equal(await page.locator(".cocktail-detail-image").getAttribute("src"), imagePath);
    assert.equal(await page.locator('.cocktail-detail-grid a[href="https://iba-world.com/iba-cocktail/alexander/"]').count(), 1);
  }
  assert.equal(requests.get("/iba/cocktails.json"), 1);
  for (const locale of locales.slice(1)) assert.equal(requests.get(`/i18n/cocktails/${locale}.json`), 1,
    `${locale}: revisiting locale and detail route must reuse resources`);
  // Reload proves state is persisted, rather than only retained in React memory.
  await page.reload();
  await page.locator(".cocktail-detail-grid").waitFor();
  const saved = await page.evaluate(() => ({
    favorites: JSON.parse(localStorage.getItem("cubing-pro-cocktails-favorites")),
    tonight: JSON.parse(localStorage.getItem("cubing-pro-cocktails-tonight-list")),
    checked: JSON.parse(localStorage.getItem("cubing-pro-cocktails-tonight-checked")),
  }));
  assert.deepEqual(saved.favorites, [{ slug: "alexander" }]);
  assert.deepEqual(saved.tonight, [{ slug: "alexander" }]);
  assert.ok(saved.checked.includes(source[0].ingredients[0]));
  await page.locator('.food-detail-actions button').nth(0).click();
  await page.locator('.food-detail-actions button').nth(1).click();
  await page.locator('.food-detail-actions a').first().click();
  await page.locator(".food-card").first().waitFor();
  assert.equal(await page.locator(".food-card").first().locator('button[aria-pressed="true"]').count(), 0);
  await context.close();

  for (const path of ["/other/cocktails/", "/other/cocktails/alexander/"]) {
    const { context: failingContext, page: failingPage } = await prepare();
    let fail = true;
    await failingPage.route("**/i18n/cocktails/fr.json", (route) => fail
      ? route.fulfill({ status: 503, body: "Unavailable" }) : route.continue());
    await failingPage.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await failingPage.locator(path.endsWith("alexander/") ? ".cocktail-detail-grid" : ".food-card").first().waitFor();
    await selectLocale(failingPage, "fr");
    await failingPage.locator('main [role="alert"]').waitFor();
    assert.match(await failingPage.locator('main [role="alert"]').textContent(), /Impossible de charger/);
    assert.equal(await failingPage.locator(".food-card, .cocktail-detail-grid").count(), 0);
    fail = false;
    await failingPage.locator("main button").last().click();
    await expectText(failingPage.locator(path.endsWith("alexander/") ? "main h1" : ".food-card-link").first(), "Alexandre");
    await failingContext.close();
  }
  const { context: mobileContext, page: mobile } = await prepare({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`${baseURL}/other/cocktails/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await mobile.locator(".food-card-link").first().waitFor();
  await selectLocale(mobile, "fr");
  await expectText(mobile.locator(".food-card-link").first(), "Alexandre");
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
  await mobile.locator(".food-card-link").first().click();
  await expectText(mobile.locator("main h1"), "Alexandre");
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
  await mobileContext.close();
  assert.deepEqual(errors, []);
  console.log("PASS: actual cocktail routes switch seven languages via cross-tab locale synchronization; translated cards/details/receipts/random picks, favorites, tonight list, checked ingredients, shared cache, 503/retry and mobile fit verified");
} finally {
  await browser.close();
}
