import assert from "node:assert/strict";
import test from "node:test";
import { chromium, type Page } from "playwright";

import { SUPPORTED_LOCALES, type Locale } from "../../i18n/locales";
import { translateTutorialExtra } from "../../i18n/messages/tutorial-extra";
import { cornerCases, edgeCases, tutorialCases, TUTORIAL_SPECIAL_40_0 } from "./utils/caseData";

const baseURL = process.env.TUTORIAL_BASE_URL ?? "http://127.0.0.1:3000";
test("tutorial and SQ1 language switching in desktop and mobile browsers", async () => {
const browser = await chromium.launch({ headless: true });
const pageErrors: string[] = [];

async function switchLocale(page: Page, locale: Locale) {
  await page.evaluate((value) => {
    localStorage.setItem("cubing_pro_locale", value);
    window.dispatchEvent(new StorageEvent("storage", { key: "cubing_pro_locale", newValue: value }));
  }, locale);
  await page.waitForFunction((value) => document.documentElement.lang === value, locale);
}

try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage();
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`${baseURL}/draw-tools/sq1-d/`);
    const preset = page.locator("select").filter({ has: page.locator('option[value="星 Star"]') });
    await preset.waitFor();
    await preset.selectOption("风筝 Kite");
    const selectedShape = await page.locator(".draw-palette-canvas").innerHTML();
    for (const { key } of SUPPORTED_LOCALES) {
      await switchLocale(page, key);
      assert.equal(await preset.inputValue(), "风筝 Kite");
      assert.equal(await preset.locator("option:checked").textContent(), translateTutorialExtra(key, "tutorialExtra.sq1.kite"));
      assert.equal(await page.locator(".draw-palette-canvas").innerHTML(), selectedShape);
    }
    await page.getByRole("tab").nth(1).click();
    await page.waitForURL(/sq1_draw_tabs=double_sq/);
    const top = page.locator("select").filter({ has: page.locator('option[value="星 Star"]') }).first();
    await top.selectOption("风筝 Kite");
    const bottom = page.locator("select").filter({ has: page.locator('option[value="风筝 Kite"]') }).last();
    await bottom.selectOption("方 Square");
    await page.locator('[data-scope="switch"][data-part="control"]').click();
    await page.getByRole("textbox", { name: `${translateTutorialExtra("es", "tutorialExtra.sq1.topText")} 1`, exact: true }).fill("A");
    const shape = await page.locator(".draw-palette-canvas").innerHTML();
    const bottomValues = await bottom.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
    for (const { key } of SUPPORTED_LOCALES) {
      await switchLocale(page, key);
      assert.equal(await top.inputValue(), "风筝 Kite");
      assert.equal(await bottom.inputValue(), "方 Square");
      assert.equal(await top.locator("option:checked").textContent(), translateTutorialExtra(key, "tutorialExtra.sq1.kite"));
      assert.equal(await bottom.locator("option:checked").textContent(), translateTutorialExtra(key, "tutorialExtra.sq1.square"));
      assert.equal(await page.getByRole("textbox", { name: `${translateTutorialExtra(key, "tutorialExtra.sq1.topText")} 1`, exact: true }).inputValue(), "A");
      assert.deepEqual(await bottom.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value)), bottomValues);
      assert.equal(await page.locator(".draw-palette-canvas").innerHTML(), shape);
    }
    // Every top preset must expose and select a complementary bottom shape.
    for (const value of await top.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))) {
      await top.selectOption(value);
      const lower = page.locator("select").nth(2);
      assert.ok(await lower.locator("option").count(), value);
      assert.ok(await lower.inputValue(), value);
    }
    console.log(`PASS SQ1: seven locales, stable selections and geometry, all 29 presets (${width}px)`);

    await page.goto(`${baseURL}/tools/floppy-reduction/`);
    await page.locator('.fr-workbench input[value="tutorial"]').locator("..").click();
    const panel = page.locator(".fr-tutorial");
    await panel.waitFor();
    assert.equal(await panel.locator(".fr-tutorial-case").count(), 13);
    for (const { key } of SUPPORTED_LOCALES) {
      await switchLocale(page, key);
      const text = await panel.innerText();
      for (const item of [...cornerCases, ...edgeCases, ...tutorialCases, TUTORIAL_SPECIAL_40_0]) {
        assert.ok(text.includes(translateTutorialExtra(key, item.descriptionKey)), `${key}: ${item.label}`);
      }
      assert.ok(text.includes(translateTutorialExtra(key, "tutorialExtra.fr.parity")));
      assert.ok(text.includes(translateTutorialExtra(key, "tutorialExtra.fr.creditAfter").trim()));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), true, `FR overflow: ${key} ${width}px`);
    }
    await page.locator('.fr-workbench input[value="analyze"]').locator("..").click();
    await page.locator(".fr-input-actions button").last().click();
    const dialog = page.locator(".fr-help-dialog");
    await dialog.waitFor();
    for (const { key } of SUPPORTED_LOCALES) {
      await switchLocale(page, key);
      const text = await dialog.innerText();
      for (const item of [...cornerCases, ...edgeCases]) {
        assert.ok(text.includes(translateTutorialExtra(key, item.descriptionKey)), `${key}: help ${item.label}`);
      }
      assert.ok(text.includes(translateTutorialExtra(key, "tutorialExtra.fr.helpParity")));
    }
    console.log(`PASS FR: seven locales, 8 recognition cases + 13 tutorial cases, help parity and attribution (${width}px)`);
    await context.close();
  }
  assert.deepEqual(pageErrors, []);
} finally {
  await browser.close();
}
});
