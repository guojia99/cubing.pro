import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";

// TWO_SOLVER_URL=http://127.0.0.1:3129/tools/solver/222/ node src/views/TwoSolver/twoSolver.formula.browser.test.mjs
// Use the actual generator, Worker, links, Next route and modal. Only the library's
// expiring data cache is seeded from the public snapshot, because upstream can drift.
const url = process.env.TWO_SOLVER_URL || "http://127.0.0.1:3129/tools/solver/222/";
const origin = new URL(url).origin;
const example = "R U R' F2 U' R2 F U2 R'";
const bundle = await build({
  stdin: {
    contents: [
      'export * from "./formulaLink";',
      'export * from "./engine/types";',
      'export * from "../Algs/utils/formulaDeepLink";',
      'export { buildAlgsKey } from "../Algs/utils/storage";',
      'export { getAlgDisplayName } from "../Algs/utils/algDisplayName";',
      'export { algDeepLinkZhCN } from "../../i18n/messages/algs-deep-link";',
    ].join("\n"),
    resolveDir: fileURLToPath(new URL(".", import.meta.url)),
  },
  bundle: true, write: false, platform: "node", format: "esm",
});
const helpers = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
const datasets = new Map();
const classes = new Map();
for (const { id, api } of helpers.METHODS) {
  const data = JSON.parse(await readFile(new URL(`../../../public/two-solver/data/${id}.json`, import.meta.url), "utf8"));
  datasets.set(id, data);
  // Actual AlgClassDetail schema: class name is the API alias, set names retain
  // algset (LEG -> LEG-1, EG1 -> EG-1); group/case/raw strings are never normalized.
  const detail = { name: api, setKeys: [], sets: [] };
  for (const record of data.records) {
    assert.ok(record.set);
    let set = detail.sets.find(set => set.name === record.set);
    if (!set) {
      set = { name: record.set, groups_keys: [], groups: [] };
      detail.sets.push(set);
      detail.setKeys.push(set.name);
    }
    let group = set.groups.find(group => group.name === record.group);
    if (!group) {
      group = { name: record.group, algs: [] };
      set.groups.push(group);
      set.groups_keys.push(group.name);
    }
    group.algs.push({ name: record.name, algs: [...record.algs], scrambles: [] });
  }
  classes.set(api, detail);
}
const selections = {};
const custom = {};
for (const record of datasets.get("CLL").records) {
  const key = helpers.buildAlgsKey("222", "CLL", record.set, record.group, record.name);
  selections[key] = { source: "custom", index: 0 };
  custom[`algs_custom_${key}`] = JSON.stringify(["U2 R2 F2"]);
}
const preferences = {
  algs_user_selection: JSON.stringify(selections),
  ...custom,
  algs_hidden_formulas_by_repo: JSON.stringify({ "222::CLL": [] }),
  "algs:formula_practice_proficiency:222-CLL": JSON.stringify({}),
};
const browser = await chromium.launch({ headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "zh-CN" });
const errors = [];
const workers = [];
context.on("page", page => {
  page.setDefaultTimeout(30000);
  page.on("pageerror", error => errors.push(error.message));
  page.on("worker", worker => workers.push(worker.url()));
});
await context.addInitScript(({ origin, data, preferences }) => {
  if (location.origin !== origin || localStorage.getItem("two-solver-formula-seeded")) return;
  localStorage.setItem("two-solver-formula-seeded", "1");
  localStorage.setItem("cubing_pro_locale", "zh-CN");
  localStorage.setItem("alg_class_cache_222_CLL", JSON.stringify({ data, ts: Date.now() }));
  for (const [key, value] of Object.entries(preferences)) localStorage.setItem(key, value);
}, { origin, data: classes.get("CLL"), preferences });
const page = await context.newPage();
const main = page.locator("main[data-settings-open]");
const cards = main.locator("article[data-method]");
let popup;
async function snapshot() {
  // Read committed state, as in the workbench suite; never inject solver results.
  return main.evaluate(element => {
    let fiber = element[Object.keys(element).find(key => key.startsWith("__reactFiber$"))];
    let root = fiber;
    while (root?.return) root = root.return;
    if (root?.stateNode?.current !== root && fiber?.alternate) fiber = fiber.alternate;
    while (fiber) {
      if (typeof fiber.type === "function") {
        for (let hook = fiber.memoizedState; hook; hook = hook.next) {
          const value = hook.memoizedState;
          if (value?.result?.solutions && value.options && typeof value.scramble === "string" && !value.id) return value;
        }
      }
      fiber = fiber.return;
    }
    return null;
  });
}
async function poll(read, label, timeout = 60000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await read();
    if (value) return value;
    await page.waitForTimeout(100);
  }
  throw new Error(`Timed out: ${label}`);
}
const storedPreferences = target => target.evaluate(keys =>
  Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(preferences));
async function exactModal(target) {
  const modal = popup.locator(".algs-formula-detail-modal");
  await modal.waitFor({ state: "visible" });
  const resolved = helpers.resolveFormulaDeepLink(classes.get("CLL"), target);
  assert.equal(resolved.kind, "found");
  assert.equal(await modal.getByRole("heading").innerText(), helpers.getAlgDisplayName(resolved.item.alg, "zh-CN"));
  const preview = modal.locator(".algs-formula-detail-modal__preview");
  await poll(async () => (await preview.innerText()).includes(target.rawAlg), "exact raw source preview");
  assert.equal(await preview.getByText(target.rawAlg, { exact: true }).isVisible(), true);
  assert.equal(await preview.getByText(`${target.set} · ${target.group}`, { exact: true }).isVisible(), true);
  assert.equal(await modal.getByRole("button", { name: target.rawAlg, exact: true }).getAttribute("aria-pressed"), "true");
  return modal;
}
try {
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  assert.ok(response.ok());
  await main.locator("#two-scramble").waitFor();
  const initial = await poll(async () => {
    const value = await snapshot();
    return value?.result.solutions.length === 20 && await cards.count() === 20
      && !await main.locator('[class*="spinner"]').count() ? value : null;
  }, "actual automatic default 20-solution search");
  assert.equal(initial.scramble, example);
  assert.equal(initial.options.maxSolutions, 20);
  assert.deepEqual(initial.options.methods, ["CLL", "EG1", "EG2", "LEG1"]);
  assert.equal(initial.options.forbidTransitionRotations, true);
  assert.ok(workers.some(worker => new URL(worker).origin === origin));
  const before = await storedPreferences(page);
  assert.deepEqual(before, preferences);
  for (const value of initial.result.solutions) {
    assert.ok(value.source);
    const matches = datasets.get(value.method).records.filter(record => record.set === value.source.set
      && record.group === value.source.group && record.name === value.source.name && record.algs.includes(value.source.rawAlg));
    assert.equal(matches.length, 1);
    assert.equal(helpers.resolveFormulaDeepLink(classes.get(value.sourceApi), value.source).kind, "found");
  }
  const observedHrefs = [];
  for (const card of await cards.all()) {
    const link = card.locator('a[href^="/algs/222/"]');
    assert.equal(await link.count(), 1);
    assert.equal(await link.getAttribute("target"), "_blank");
    assert.deepEqual((await link.getAttribute("rel")).split(/\s+/).sort(), ["noopener", "noreferrer"]);
    const href = await link.getAttribute("href");
    observedHrefs.push(href);
    const linked = initial.result.solutions.find(value => helpers.formulaLibraryLink(value) === href);
    assert.ok(linked);
    assert.equal(await card.locator('[class*="caseName"]').getAttribute("title"), `${linked.source.group} · ${linked.source.name}`);
  }
  assert.deepEqual(observedHrefs.sort(), initial.result.solutions.map(helpers.formulaLibraryLink).sort());
  const link = cards.locator('a[href^="/algs/222/CLL/"]').first();
  assert.ok(await link.count(), "default generator must expose a real CLL source link");
  const href = await link.getAttribute("href");
  const expected = new URL(href, origin);
  const parsed = helpers.parseFormulaDeepLink(expected.search);
  assert.equal(parsed.kind, "target");
  const source = parsed.target;
  const parentUrl = page.url();
  const parentCards = await cards.locator("[data-full-solution]").allTextContents();
  const opened = page.waitForEvent("popup");
  await link.click();
  popup = await opened;
  await popup.waitForURL(expected.href);
  assert.equal(new URL(popup.url()).pathname, "/algs/222/CLL/");
  assert.deepEqual([...new URL(popup.url()).searchParams], [...expected.searchParams]);
  let modal = await exactModal(source);
  const key = helpers.buildAlgsKey("222", "CLL", source.set, source.group, source.name);
  assert.deepEqual(JSON.parse((await storedPreferences(popup)).algs_user_selection)[key], { source: "custom", index: 0 });
  assert.deepEqual(await storedPreferences(popup), before, "deep-link preview never persists a library choice");
  assert.equal(page.url(), parentUrl);
  assert.equal(await main.locator("#two-scramble").inputValue(), initial.scramble);
  assert.deepEqual(await snapshot(), initial, "popup leaves the current analysis intact");
  assert.deepEqual(await cards.locator("[data-full-solution]").allTextContents(), parentCards);
  console.log(`PASS real default 20-source links; popup ${expected.pathname} opens exact ${source.name} / ${source.rawAlg}`);

  await modal.locator(".algs-formula-detail-modal__close").click();
  await modal.waitFor({ state: "hidden" });
  await popup.getByRole("searchbox").fill("no-visible-formula-928174");
  await popup.waitForFunction(() => !document.querySelector(".algs-formula-card"));
  assert.equal(await modal.isVisible(), false, "same deep URL remains closed after rerender");
  const other = datasets.get("CLL").records.find(record => record.group !== source.group);
  const otherSource = { set: other.set, group: other.group, name: other.name, rawAlg: other.algs[0] };
  const nextHref = helpers.formulaLibraryLink({ sourceApi: "CLL", source: otherSource });
  await popup.evaluate(next => history.pushState(null, "", `${next}#another-case`), nextHref);
  modal = await exactModal(otherSource);
  await modal.locator(".algs-formula-detail-modal__close").click();
  await modal.waitFor({ state: "hidden" });
  await popup.evaluate(next => history.pushState(null, "", next), href);
  modal = await exactModal(source);
  assert.deepEqual(await storedPreferences(popup), before);
  await popup.evaluate(next => history.pushState(null, "", next), `${href}&alg=duplicate`);
  await modal.waitFor({ state: "hidden" });
  const invalid = helpers.algDeepLinkZhCN["algs.deepLink.invalid"];
  await popup.getByRole("alert").getByText(invalid, { exact: true }).waitFor();
  await popup.evaluate(() => history.pushState(null, "", "/algs/222/CLL/?set=CLL"));
  await popup.getByRole("alert").getByText(invalid, { exact: true }).waitFor();
  assert.equal(await modal.isVisible(), false, "an incomplete source tuple cannot open a fallback case");
  const missing = new URL(href, origin);
  missing.searchParams.set("alg", "R U R' missing-source");
  await popup.evaluate(next => history.pushState(null, "", next), missing.href);
  await popup.getByRole("alert").getByText(helpers.algDeepLinkZhCN["algs.deepLink.missing"], { exact: true }).waitFor();
  assert.equal(await modal.isVisible(), false);
  assert.deepEqual(await storedPreferences(popup), before);
  console.log("PASS close/rerender, changed query/hash case, repeat deep URL, exact translated notices and unchanged custom preferences");

  await popup.evaluate(() => history.pushState(null, "", "/algs/222/CLL/"));
  await popup.reload({ waitUntil: "domcontentloaded" });
  await popup.locator(".algs-formula-card").filter({ hasText: source.name }).click();
  await modal.waitFor({ state: "visible" });
  await poll(async () => (await modal.locator(".algs-formula-detail-modal__preview").innerText()).includes("U2 R2 F2"), "saved custom choice after normal open");
  assert.deepEqual(await storedPreferences(popup), before);
  await popup.close();
  await page.bringToFront();
  assert.equal(page.url(), parentUrl);
  assert.deepEqual(await snapshot(), initial);
  const config = page.getByRole("dialog", { name: "分析配置", exact: true });
  await main.getByRole("button", { name: "分析配置", exact: true }).click();
  await config.waitFor({ state: "visible" });
  await config.getByRole("button", { name: "取消", exact: true }).click();
  await config.waitFor({ state: "hidden" });
  await main.locator("#two-scramble").fill("U");
  const skip = await poll(async () => {
    const value = await snapshot();
    return value?.scramble === "U" && value.result.solutions.length > 0
      && !await main.locator('[class*="spinner"]').count() ? value : null;
  }, "parent remains functional and searches real skips");
  assert.ok(skip.result.solutions.every(value => value.caseName === "CLL Skip" && !value.source));
  assert.equal(await cards.locator('a[href^="/algs/222/"]').count(), 0, "skip cards have no invented source link");
  assert.equal(await main.locator("[data-sticky-scramble] code").textContent(), "U");
  assert.deepEqual(errors, []);
  console.log("PASS saved custom selection survives normal reopen; closing popup retains parent and real skip cards hide source links");
} finally {
  await browser.close();
}
