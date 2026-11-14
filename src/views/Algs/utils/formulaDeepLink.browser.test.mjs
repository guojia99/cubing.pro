import assert from "node:assert/strict";
import { chromium } from "playwright";

// Run against Next dev/start with ALGS_TEST_URL (defaults to port 3000).
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const rawAlg = "F R U R' U' F'";
const target = { set: "Source+", group: "Group &", case: "Exact case", alg: rawAlg };
const path = "/algs/333/PLL/";
const url = `${process.env.ALGS_TEST_URL ?? "http://127.0.0.1:3000"}${path}`;
const storageKey = "333-PLL-Source+-Group_&-Exact_case";
const preferenceKeys = ["algs_user_selection", "algs_hidden_formulas_by_repo", `algs_custom_${storageKey}`, "algs:formula_practice_proficiency:333-PLL"];
try {
  await page.addInitScript(({ storageKey, rawAlg }) => {
    if (localStorage.getItem("formula-deep-link-seeded")) return;
    localStorage.setItem("formula-deep-link-seeded", "1");
    const data = { name: "Deep link fixture", sets: [{ name: "Source+", groups: [{ name: "Group &", algs: [
      { name: "Exact case", algs: ["R U R' U'", rawAlg] },
      { name: "Visible case", algs: ["R2 U2"] },
    ] }] }] };
    localStorage.setItem("alg_class_cache_333_PLL", JSON.stringify({ data, ts: Date.now() }));
    localStorage.setItem("algs_hide_formula_diagram", "1");
    localStorage.setItem("algs_hidden_formulas_by_repo", JSON.stringify({ "333::PLL": ["Source+:Group &:Exact case"] }));
    localStorage.setItem("algs_user_selection", JSON.stringify({ [storageKey]: { source: "custom", index: 0 } }));
    localStorage.setItem(`algs_custom_${storageKey}`, JSON.stringify(["U2 R2 F2"]));
    localStorage.setItem("algs:formula_practice_proficiency:333-PLL", JSON.stringify({ "Source+:Group &:Exact case": "mastered" }));
    localStorage.setItem("cubing_pro_locale", "en-US");
  }, { storageKey, rawAlg });

  await page.goto(`${url}?${new URLSearchParams(target)}`, { waitUntil: "domcontentloaded" });
  const modal = page.locator(".algs-formula-detail-modal");
  await modal.waitFor({ timeout: 60000 });
  const preview = modal.locator(".algs-formula-detail-modal__preview");
  await page.waitForFunction((raw) => document.querySelector(".algs-formula-detail-modal__preview")?.textContent.includes(raw), rawAlg);
  assert.ok((await preview.innerText()).includes(rawAlg));
  assert.equal(await modal.getByRole("button", { name: rawAlg, exact: true }).getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator(".algs-formula-card").count(), 1, "hidden case stays hidden");
  const snapshot = () => page.evaluate((keys) => keys.map((key) => localStorage.getItem(key)), preferenceKeys);
  const before = await snapshot();
  assert.equal(JSON.parse(before[0])[storageKey].source, "custom", "opening must not persist library selection");
  await modal.locator(".algs-formula-detail-modal__close").click();
  await modal.waitFor({ state: "hidden" });
  await page.getByRole("searchbox").fill("nothing matches");
  assert.equal(await modal.isVisible(), false, "closing stays closed across rerenders");

  const navigate = async (query) => {
    await page.evaluate((next) => window.history.pushState(null, "", next), `${path}${query}`);
  };
  await navigate(`?${new URLSearchParams({ ...target, alg: "R U R' U'" })}`);
  await modal.waitFor();
  assert.ok((await preview.innerText()).includes("R U R' U'"), "new query opens despite search filters");
  await modal.locator(".algs-formula-detail-modal__close").click();
  await modal.waitFor({ state: "hidden" });
  await page.goBack();
  await modal.waitFor();
  await page.waitForFunction((raw) => document.querySelector(".algs-formula-detail-modal__preview")?.textContent.includes(raw), rawAlg);
  await page.goForward();
  await page.waitForFunction(() => document.querySelector(".algs-formula-detail-modal__preview")?.textContent.includes("R U R' U'"));
  assert.deepEqual(await snapshot(), before, "deep-link navigation never writes preferences");

  await navigate("?set=incomplete");
  await modal.waitFor({ state: "hidden" });
  await page.getByRole("alert").filter({ hasText: "invalid or incomplete" }).waitFor();
  await page.getByRole("button", { name: "Dismiss notice" }).click();
  await page.getByRole("alert").filter({ hasText: "invalid or incomplete" }).waitFor({ state: "hidden" });
  await navigate(`?${new URLSearchParams({ ...target, alg: "missing" })}`);
  await page.getByRole("alert").filter({ hasText: "not found" }).waitFor();
  assert.equal(await modal.isVisible(), false);

  await navigate("");
  await page.getByRole("searchbox").fill("");
  await page.evaluate(() => {
    localStorage.setItem("algs_hidden_formulas_by_repo", JSON.stringify({ "333::PLL": [] }));
  });
  // A normal card open reloads the saved custom choice after a deep-link preview.
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".algs-formula-card").filter({ hasText: "Exact case" }).click();
  await modal.waitFor();
  await page.waitForFunction(() => document.querySelector(".algs-formula-detail-modal__preview")?.textContent.includes("U2 R2 F2"));
  assert.deepEqual(errors, []);
  console.log("PASS exact variant, hidden target, no preference writes, close, query changes, history and translated failures");
} finally {
  await browser.close();
}
