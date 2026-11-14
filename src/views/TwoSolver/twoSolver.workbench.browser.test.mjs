import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { puzzles } from 'cubing/puzzles';

// Run against main's actual Next server. No routes, Worker messages, solver data,
// clipboard methods, clocks, or native player APIs are replaced by this test.
// TWO_SOLVER_URL=http://127.0.0.1:3129/tools/solver/222/ node src/views/TwoSolver/twoSolver.workbench.browser.test.mjs
const url = process.env.TWO_SOLVER_URL || 'http://127.0.0.1:3129/tools/solver/222/';
const artifacts = process.env.TWO_SOLVER_ARTIFACTS || join('/var/folders/p8/b3ryxj6s1bd4wgsspxzhfnw40000gn/T/opencode', `two-solver-workbench-${Date.now()}`);
const settingsKey = 'cubing.pro.two-solver.settings.v1';
const uiKey = 'cubing.pro.two-solver.ui.v1';
const defaults = { EG: 5, TCLL: 4, LS: 4, EGLS: 3, FH: 3, CBL: 2, TEG: 3 };
const example = "R U R' F2 U' R2 F U2 R'";
const started = Date.now();
const deadline = started + 140000;
const report = { url, artifacts, checks: [], workers: [], datasets: [], pageErrors: [], consoleErrors: [], screenshots: [] };
await mkdir(artifacts, { recursive: true });
const watchdog = setTimeout(async () => {
  report.checks.push({ name: 'Runtime budget', status: 'failed', error: 'Exceeded 145 seconds' });
  await writeFile(join(artifacts, 'report.json'), JSON.stringify(report, null, 2));
  process.exit(1);
}, 145000);
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN', colorScheme: 'light' });
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(url).origin });
const page = await context.newPage();
page.setDefaultTimeout(30000);
page.setDefaultNavigationTimeout(30000);
page.on('worker', worker => report.workers.push(worker.url()));
page.on('pageerror', error => report.pageErrors.push(error.stack || error.message));
page.on('console', message => {
  if (message.type() === 'error') report.consoleErrors.push({ text: message.text(), location: message.location() });
});
context.on('response', response => {
  if (response.url().includes('/two-solver/data/')) report.datasets.push({ url: response.url(), status: response.status() });
});

// Observe committed hook values and DOM transitions; retain object identities to
// distinguish a real new search result from a filter-only render of the old one.
await context.addInitScript(() => {
  const ids = new WeakMap();
  let sequence = 0;
  const identity = object => {
    if (!ids.has(object)) ids.set(object, ++sequence);
    return ids.get(object);
  };
  const state = { samples: [], results: [], busyStarts: 0, busy: false };
  const read = () => {
    const main = document.querySelector('main[data-settings-open]');
    if (!main) return null;
    const key = Object.keys(main).find(key => key.startsWith('__reactFiber$'));
    let fiber = main[key];
    let root = fiber;
    while (root?.return) root = root.return;
    if (root?.stateNode?.current !== root && fiber?.alternate) fiber = fiber.alternate;
    let hooks;
    while (fiber) {
      if (typeof fiber.type === 'function' && fiber.memoizedState) { hooks = fiber.memoizedState; break; }
      fiber = fiber.return;
    }
    const snapshots = [];
    for (let hook = hooks; hook; hook = hook.next) {
      const value = hook.memoizedState;
      if (value?.result?.solutions && value.options && typeof value.scramble === 'string') snapshots.push(value);
    }
    const snapshot = snapshots.find(value => !value.id) || snapshots[0];
    if (!snapshot) return null;
    return { identity: identity(snapshot.result), scramble: snapshot.scramble, options: snapshot.options, result: snapshot.result };
  };
  const sample = () => {
    const busy = !!document.querySelector('main[data-settings-open] [class*="spinner"]');
    if (busy && !state.busy) state.busyStarts++;
    state.busy = busy;
    const snapshot = read();
    if (snapshot && !state.results.includes(snapshot.identity)) state.results.push(snapshot.identity);
    const value = { busy, identity: snapshot?.identity ?? null,
      status: document.querySelector('main [class*="statusRow"] [role="status"]')?.textContent || '' };
    if (JSON.stringify(state.samples.at(-1)?.value) !== JSON.stringify(value)) state.samples.push({ at: performance.now(), value });
  };
  window.__workbench = { state, read, sample };
  addEventListener('DOMContentLoaded', () => {
    new MutationObserver(sample).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-settings-open'] });
    sample();
  });
});

const main = page.locator('main[data-settings-open]');
const results = main.locator('section[aria-label="解法列表"]');
const cards = results.locator('article[data-method]');
const config = page.getByRole('dialog', { name: '分析配置', exact: true });
const root = label => page.locator(`body > [data-solver-cube-player="${label}"]`);
const host = label => page.locator(`[data-solver-cube="${label}"]`);
const kp = await puzzles['2x2x2'].kpuzzle();
let ready = false;

async function poll(fn, label, timeout = 30000) {
  const until = Math.min(deadline, Date.now() + timeout);
  let last;
  while (Date.now() < until) {
    try { const value = await fn(); if (value) return value; } catch (error) { last = error; }
    await page.waitForTimeout(60);
  }
  throw new Error(`Timed out: ${label}${last ? `: ${last.message}` : ''}`);
}
async function shot(name) {
  const path = join(artifacts, `${name}.png`);
  await page.screenshot({ path, timeout: 5000 });
  report.screenshots.push({ path, inspected: false });
}
async function check(name, fn, enabled = ready) {
  if (!enabled || Date.now() >= deadline - 5000) {
    report.checks.push({ name, status: 'blocked', reason: 'Missing prerequisite or runtime budget' });
    return;
  }
  try {
    const evidence = await fn();
    report.checks.push({ name, status: 'passed', evidence });
    console.log(`PASS ${name}`, evidence ?? '');
  } catch (error) {
    report.checks.push({ name, status: 'failed', error: error.stack || String(error) });
    console.error(`FAIL ${name}: ${error.message}`);
    await shot(`failure-${report.checks.length}`).catch(() => {});
    await page.keyboard.up('Space').catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
  }
}
const stored = key => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const snapshot = () => page.evaluate(() => window.__workbench.read());
const activity = () => page.evaluate(() => {
  window.__workbench.sample();
  const { busyStarts, results, samples } = window.__workbench.state;
  return { busyStarts, results: [...results], samples: [...samples] };
});
async function settled(limit, oldIdentity) {
  const value = await poll(async () => {
    const current = await snapshot();
    return current && current.identity !== oldIdentity && current.options.maxSolutions === limit
      && await results.count() && !await main.locator('[class*="spinner"]').count() ? current : null;
  }, `committed real ${limit}-solution snapshot`);
  assert.deepEqual(await main.getByRole('alert').allTextContents(), []);
  return value;
}
async function openConfig(panel = '搜索') {
  await main.getByRole('button', { name: '分析配置', exact: true }).click();
  await config.waitFor({ state: 'visible' });
  await config.getByRole('tab', { name: panel, exact: true }).click();
}
async function apply() {
  await config.getByRole('button', { name: '应用', exact: true }).click();
  await config.waitFor({ state: 'hidden' });
}
async function noOverflow() {
  const geometry = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(geometry.document <= geometry.width + 1 && geometry.body <= geometry.width + 1, JSON.stringify(geometry));
  return geometry;
}
async function playerState() {
  return root('解法 3D 解析').evaluate(async element => {
    const player = element.querySelector('twisty-player');
    const [vantage] = await player.experimentalCurrentVantages();
    const { canvas, context } = await vantage.canvasInfo();
    const object = await player.experimentalCurrentThreeJSPuzzleObject();
    let meshes = 0;
    object.traverse(node => { if (node.isMesh) meshes++; });
    const gl = context ? null : (canvas.getContext('webgl2') || canvas.getContext('webgl'));
    const r = element.getBoundingClientRect();
    return { setup: (await player.experimentalModel.setupAlg.get()).alg.toString(),
      alg: (await player.experimentalModel.alg.get()).alg.toString(),
      timestamp: (await player.experimentalModel.detailedTimelineInfo.get()).timestamp,
      playing: (await player.experimentalModel.playingInfo.get()).playing,
      orbit: await player.experimentalModel.twistySceneModel.orbitCoordinates.get(),
      drag: await player.experimentalModel.twistySceneModel.dragInput.get(),
      meshes, canvas: { width: canvas.width, height: canvas.height, healthy: !!context || !!gl && !gl.isContextLost() },
      inert: element.inert, opacity: getComputedStyle(element).opacity, hidden: element.getAttribute('aria-hidden'),
      overlays: [...element.querySelectorAll('p,[role="alert"],[role="status"]')].map(node => node.textContent),
      rect: { x: r.x, y: r.y, width: r.width, height: r.height } };
  });
}
async function healthyPlayer(setup, alg) {
  await poll(async () => await host('解法 3D 解析').getAttribute('aria-busy') === 'false'
    && await root('解法 3D 解析').evaluate(element => !element.inert && getComputedStyle(element).opacity === '1'), 'native player ready');
  const state = await playerState();
  assert.equal(state.setup, setup);
  assert.equal(state.alg, alg);
  assert.ok(state.meshes > 0 && state.canvas.width > 0 && state.canvas.height > 0 && state.canvas.healthy);
  assert.equal(state.hidden, 'false');
  assert.equal(state.drag, 'auto');
  assert.deepEqual(state.overlays, []);
  const bounds = await host('解法 3D 解析').boundingBox();
  for (const key of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(bounds[key] - state.rect[key]) < 2, `native root follows modal ${key}`);
  return state;
}
try {
  await check('Actual server available within 30 seconds; initial automatic solve retains exactly 20', async () => {
    const until = Date.now() + 30000;
    let available = false;
    while (Date.now() < until) {
      try {
        const response = await context.request.get(url, { timeout: Math.min(3000, until - Date.now()) });
        if (response.ok()) { available = true; break; }
      } catch { /* Main starts the real server; retry only inside this deadline. */ }
      await page.waitForTimeout(250);
    }
    assert.ok(available, 'Next server did not become available on port 3129 within 30 seconds');
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    assert.ok(response.ok());
    await main.locator('#two-scramble').waitFor();
    const value = await settled(20);
    ready = true;
    assert.equal(value.scramble, example);
    assert.equal(value.result.solutions.length, 20, 'retained engine results, not merely rendered pagination');
    assert.equal(await cards.count(), 20);
    assert.equal(await main.getByRole('button', { name: /显示更多/ }).count(), 0);
    assert.deepEqual(value.options.methods, ['CLL', 'EG1', 'EG2', 'LEG1']);
    assert.deepEqual(value.options.familyDepths, defaults);
    assert.equal(value.options.maxOverlap, 1);
    assert.ok(report.workers.some(worker => new URL(worker).origin === new URL(url).origin));
    for (const method of value.options.methods) assert.ok(report.datasets.some(item => item.url.endsWith(`/${method}.json`) && item.status === 200));
    assert.equal((await activity()).results.length, 1);
    return { retained: value.result.solutions.length, visible: await cards.count(), options: value.options };
  }, true);

  await check('Compact toolbar, no sidebar or hero, real 3/2/1-column geometry and mobile dialog fit', async () => {
    const css = await readFile(new URL('./SolutionCards.module.css', import.meta.url), 'utf8');
    assert.match(css, /max-width:\s*1199px/);
    assert.match(css, /max-width:\s*639px/);
    assert.equal(await main.locator('aside,[class*="sidebar"],[class*="hero"],#two-solver-settings').count(), 0);
    assert.equal(await main.locator('select,input:not(#two-scramble)').count(), 0, 'configuration controls belong only in the dialog');
    assert.equal(await main.getByRole('heading', { level: 1 }).textContent(), '二阶');
    const layouts = [];
    for (const [width, columns] of [[1440, 3], [1200, 3], [1199, 2], [1024, 2], [640, 2], [639, 1], [390, 1], [320, 1]]) {
      await page.setViewportSize({ width, height: 1000 });
      await cards.first().scrollIntoViewIfNeeded();
      const geometry = await cards.evaluateAll(elements => {
        const grid = elements[0].parentElement;
        return { display: getComputedStyle(grid).display, columns: getComputedStyle(grid).gridTemplateColumns.split(/\s+/).length,
          rects: elements.slice(0, 4).map(element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, width: r.width }; }) };
      });
      assert.equal(geometry.display, 'grid');
      assert.equal(geometry.columns, columns, `${width}px computed grid`);
      for (let i = 1; i < columns; i++) {
        assert.ok(geometry.rects[i].x > geometry.rects[i - 1].right, `${width}px distinct column positions`);
        assert.ok(Math.abs(geometry.rects[i].y - geometry.rects[0].y) <= 1);
      }
      assert.ok(Math.abs(geometry.rects[columns].x - geometry.rects[0].x) <= 1);
      assert.ok(geometry.rects[columns].y > geometry.rects[0].y);
      layouts.push({ width, ...geometry, overflow: await noOverflow() });
      if (width === 390 || width === 320) {
        await cards.first().locator('details > summary').click();
        await noOverflow();
        await shot(`results-${width}`);
        await cards.first().locator('details > summary').click();
        await openConfig();
        await config.getByRole('combobox', { name: '解法数量上限', exact: true }).scrollIntoViewIfNeeded();
        const box = await config.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
        await noOverflow();
        await shot(`config-${width}`);
        await config.getByRole('button', { name: '取消', exact: true }).click();
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await main.getByRole('button', { name: '分析配置', exact: true }).scrollIntoViewIfNeeded();
    const toolbar = await main.locator('header').first().boundingBox();
    const button = await main.getByRole('button', { name: '分析配置', exact: true }).boundingBox();
    assert.ok(button.x > toolbar.x + toolbar.width * 0.8);
    assert.ok(button.y >= toolbar.y && button.y + button.height <= toolbar.y + toolbar.height);
    await shot('desktop-workbench');
    return layouts;
  });

  await check('Configuration tabs and family defaults; drafts, Cancel and Escape discard every change', async () => {
    const before = { search: await stored(settingsKey), ui: await stored(uiKey), snapshot: await snapshot(), activity: await activity() };
    for (const dismissal of ['取消', 'Escape']) {
      await openConfig();
      assert.deepEqual(await config.getByRole('tab').allTextContents(), ['搜索', '筛选']);
      for (const [family, depth] of Object.entries(defaults)) assert.equal(await config.getByRole('combobox', { name: `${family} 做底上限`, exact: true }).inputValue(), String(depth));
      assert.equal(await config.getByRole('combobox', { name: '消步最大重叠数', exact: true }).inputValue(), '1');
      await config.getByRole('combobox', { name: '解法数量上限', exact: true }).selectOption('50');
      await config.getByRole('combobox', { name: 'EG 做底上限', exact: true }).selectOption('4');
      await config.getByRole('combobox', { name: '消步最大重叠数', exact: true }).selectOption('2');
      await config.getByRole('tab', { name: '筛选', exact: true }).click();
      await config.getByRole('searchbox').fill('draft-must-not-commit');
      await config.getByRole('combobox', { name: '排序', exact: true }).selectOption('moves');
      await config.getByRole('tab', { name: '搜索', exact: true }).click();
      assert.equal(await config.getByRole('combobox', { name: '解法数量上限', exact: true }).inputValue(), '50');
      assert.equal(await config.getByRole('combobox', { name: 'EG 做底上限', exact: true }).inputValue(), '4');
      assert.equal(await config.getByRole('combobox', { name: '消步最大重叠数', exact: true }).inputValue(), '2');
      await config.getByRole('tab', { name: '筛选', exact: true }).click();
      assert.equal(await config.getByRole('searchbox').inputValue(), 'draft-must-not-commit');
      assert.equal(await config.getByRole('combobox', { name: '排序', exact: true }).inputValue(), 'moves');
      assert.deepEqual(await stored(settingsKey), before.search);
      assert.deepEqual(await stored(uiKey), before.ui);
      assert.equal((await snapshot()).identity, before.snapshot.identity);
      if (dismissal === 'Escape') await page.keyboard.press('Escape');
      else await config.getByRole('button', { name: dismissal, exact: true }).click();
      await config.waitFor({ state: 'hidden' });
      assert.deepEqual(await stored(settingsKey), before.search);
      assert.deepEqual(await stored(uiKey), before.ui);
      assert.equal((await snapshot()).identity, before.snapshot.identity);
      await openConfig('筛选');
      assert.equal(await config.getByRole('searchbox').inputValue(), '');
      assert.equal(await config.getByRole('combobox', { name: '排序', exact: true }).inputValue(), 'recommended');
      await config.getByRole('tab', { name: '搜索', exact: true }).click();
      assert.equal(await config.getByRole('combobox', { name: '解法数量上限', exact: true }).inputValue(), '20');
      for (const [family, depth] of Object.entries(defaults)) assert.equal(await config.getByRole('combobox', { name: `${family} 做底上限`, exact: true }).inputValue(), String(depth));
      assert.equal(await config.getByRole('combobox', { name: '消步最大重叠数', exact: true }).inputValue(), '1');
      await config.getByRole('button', { name: '取消', exact: true }).click();
    }
    await page.waitForTimeout(600);
    assert.equal((await activity()).busyStarts, before.activity.busyStarts);
    assert.deepEqual((await activity()).results, before.activity.results);
    return { snapshotIdentity: before.snapshot.identity, discarded: ['search', 'filters', 'sort'] };
  });

  await check('Search Apply triggers exactly one rerun; 50 persists with first 20 and increments of 20', async () => {
    const before = await snapshot();
    const observed = await activity();
    await openConfig();
    await config.getByRole('combobox', { name: '解法数量上限', exact: true }).selectOption('50');
    await config.getByRole('combobox', { name: '单次搜索时限', exact: true }).selectOption('15000');
    await apply();
    const value = await settled(50, before.identity);
    assert.equal(value.result.solutions.length, 50);
    assert.equal(await cards.count(), 20);
    await main.getByRole('button', { name: '显示更多 · 20 / 50', exact: true }).click();
    assert.equal(await cards.count(), 40);
    await main.getByRole('button', { name: '显示更多 · 40 / 50', exact: true }).click();
    assert.equal(await cards.count(), 50);
    await page.waitForTimeout(650);
    const after = await activity();
    assert.equal(after.busyStarts - observed.busyStarts, 1, 'one worker search busy cycle for one applied transaction');
    assert.equal(after.results.length - observed.results.length, 1, 'one newly captured result');
    const settings = await stored(settingsKey);
    assert.equal(settings.maxSolutions, 50);
    assert.equal(settings.timeLimitMs, 15000);
    assert.deepEqual(settings.familyDepths, defaults);
    assert.equal(settings.maxOverlap, 1);
    await page.reload({ waitUntil: 'domcontentloaded' });
    const reloaded = await settled(50);
    assert.equal(reloaded.result.solutions.length, 50);
    assert.equal(await cards.count(), 20);
    assert.equal(await main.getByRole('button', { name: '显示更多 · 20 / 50', exact: true }).count(), 1);
    assert.deepEqual(await stored(settingsKey), settings);
    return { retained: 50, pages: [20, 40, 50], busyStarts: after.busyStarts - observed.busyStarts, persisted: settings };
  });

  await check('Filter and sort Apply reuse exact result identity with no worker activity; controls stay in config', async () => {
    const before = await snapshot();
    const observed = await activity();
    const method = before.result.solutions[0].method;
    await main.getByRole('button', { name: '筛选与排序', exact: true }).click();
    assert.equal(await config.getByRole('tab', { name: '筛选', exact: true }).getAttribute('aria-selected'), 'true');
    await config.getByRole('combobox', { name: '方法', exact: true }).selectOption(method);
    await config.getByRole('combobox', { name: '排序', exact: true }).selectOption('moves');
    assert.equal(await cards.count(), 20, 'draft filter leaves visible cards intact');
    await apply();
    const expected = before.result.solutions.filter(solution => solution.method === method).sort((a, b) => a.moves - b.moves || b.ergonomics.score - a.ergonomics.score);
    await poll(async () => await cards.count() === Math.min(20, expected.length), 'applied filter cards');
    assert.deepEqual(await cards.evaluateAll(elements => elements.map(element => element.dataset.method)), expected.slice(0, 20).map(solution => solution.method));
    assert.deepEqual(await cards.locator('[class*="moveCount"] strong').allTextContents(), expected.slice(0, 20).map(solution => String(solution.moves)));
    await openConfig('筛选');
    await config.getByRole('searchbox').fill('no-such-workbench-case-982371');
    await apply();
    assert.equal(await cards.count(), 0);
    assert.equal(await main.getByText('没有符合筛选的解法', { exact: true }).count(), 1);
    await openConfig('筛选');
    await config.getByRole('button', { name: '重置本页', exact: true }).click();
    await apply();
    await poll(async () => await cards.count() === 20, 'restored unfiltered cards');
    await page.waitForTimeout(700);
    assert.equal((await snapshot()).identity, before.identity);
    assert.equal((await activity()).busyStarts, observed.busyStarts);
    assert.deepEqual((await activity()).results, observed.results);
    assert.equal(await main.locator('select,input[type="search"]').count(), 0);
    return { method, matched: expected.length, resultIdentity: before.identity, workerReruns: 0 };
  });

  await check('Both actual clipboard actions independently replay with cubing', async () => {
    const value = await snapshot();
    const visible = await cards.evaluateAll(elements => elements.map(element => ({ full: element.querySelector('[data-full-solution]').textContent,
      annotated: element.querySelector('details code').textContent })));
    for (const item of visible) for (const alg of [item.full, item.annotated]) {
      assert.equal(kp.defaultPattern().applyAlg(value.scramble).applyAlg(alg === '无需转动' ? '' : alg).experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }), true);
    }
    const index = value.result.solutions.slice(0, 20).findIndex(solution => solution.orientation && solution.boundary.overlap > 0);
    assert.ok(index >= 0, 'exercise orientation and cancellation in actual cards');
    const copies = {};
    for (const [label, field] of [['复制完整解法', 'full'], ['复制分段注释', 'annotated']]) {
      await page.evaluate(() => navigator.clipboard.writeText('before-real-copy'));
      await cards.nth(index).getByRole('button', { name: label, exact: true }).click();
      await poll(() => page.evaluate(expected => navigator.clipboard.readText().then(text => text === expected), visible[index][field]), label);
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      assert.equal(copied, visible[index][field]);
      assert.ok(kp.algToTransformation(value.result.solutions[index].original).isIdentical(kp.algToTransformation(copied)));
      assert.equal(kp.defaultPattern().applyAlg(value.scramble).applyAlg(copied).experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }), true);
      copies[field] = copied;
    }
    return { replayedCards: visible.length, index, copies };
  });

  await check('Per-card 3D modal exact stages, native canvas playback/drag under focus lock; scroll recovers', async () => {
    const value = await snapshot();
    assert.equal(await host('解法 3D 解析').count(), 0, 'no card player mounted until opened');
    const evidence = [];
    for (const index of [0, 4]) {
      // Allow the previous modal's deferred focus/scroll restoration to settle
      // before programmatically jumping to the next trigger.
      await page.waitForTimeout(220);
      const button = cards.nth(index).getByRole('button', { name: '3D 解析', exact: true });
      // Keep Playwright's click from scrolling a viewport-edge trigger after the baseline.
      await button.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
      const scroll = await page.evaluate(() => scrollY);
      await button.click();
      const modal = page.getByRole('dialog', { name: /3D 解析/ });
      await modal.waitFor({ state: 'visible' });
      assert.equal(await page.evaluate(() => -parseFloat(document.body.style.top)), scroll, 'modal locks the pre-click scroll baseline');
      assert.equal(await modal.getAttribute('aria-modal'), 'true');
      const solution = value.result.solutions[index];
      const full = await cards.nth(index).locator('[data-full-solution]').textContent();
      await healthyPlayer(value.scramble, full);
      await modal.getByRole('button', { name: '做底完成', exact: true }).click();
      const prefix = [value.scramble, solution.orientation, solution.base].filter(Boolean).join(' ');
      await poll(() => host('解法 3D 解析').getAttribute('data-setup').then(text => text === prefix), 'base stage committed');
      const base = await healthyPlayer(prefix, '');
      assert.equal(base.timestamp, 0);
      await modal.getByRole('button', { name: '完整解法', exact: true }).click();
      await poll(() => host('解法 3D 解析').getAttribute('data-alg').then(text => text === full), 'full stage committed');
      const before = await healthyPlayer(value.scramble, full);
      const playBox = await poll(() => root('解法 3D 解析').evaluate(element => {
        const player = element.querySelector('twisty-player');
        const buttons = player.contentWrapper.querySelector('twisty-buttons');
        const button = buttons?.buttons?.['play-pause']?.htmlButton;
        if (!button) return null;
        const r = button.getBoundingClientRect();
        return r.width > 0 && r.height > 0 ? { x: r.x + r.width / 2, y: r.y + r.height / 2, width: r.width, height: r.height } : null;
      }), 'native play control laid out', 5000);
      assert.ok(playBox.width > 0 && playBox.height > 0);
      await page.mouse.click(playBox.x, playBox.y);
      await poll(async () => (await playerState()).timestamp > 0, 'native play button advances real timeline', 5000);
      await root('解法 3D 解析').evaluate(element => element.querySelector('twisty-player').pause());
      const box = await root('解法 3D 解析').boundingBox();
      await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.35);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6, { steps: 12 });
      await page.mouse.up();
      await poll(async () => JSON.stringify((await playerState()).orbit) !== JSON.stringify(before.orbit), 'native drag changes orbit inside modal focus lock', 5000);
      await page.mouse.wheel(0, 500);
      assert.equal(await page.evaluate(() => document.body.style.position), 'fixed');
      // Attempt to focus the background. Chakra must retain focus in the modal
      // or its explicitly associated body-level native player tree.
      await main.locator('button[aria-haspopup="dialog"]').first().evaluate(element => element.focus({ preventScroll: true }));
      await poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"],[data-solver-cube-player="解法 3D 解析"]')), 'modal focus trap');
      await shot(`native-modal-card-${index}`);
      await modal.getByRole('button', { name: '关闭 3D 解析', exact: true }).click();
      await modal.waitFor({ state: 'hidden' });
      await poll(async () => {
        const restored = await page.evaluate(() => ({ y: scrollY, position: document.body.style.position }));
        assert.notEqual(restored.position, 'fixed', 'modal releases body scroll lock');
        assert.ok(Math.abs(restored.y - scroll) <= 2, `original page scroll restored: expected ${scroll}, actual ${restored.y}`);
        return true;
      }, 'original page scroll restored');
      assert.equal(await host('解法 3D 解析').count(), 0);
      evidence.push({ index, prefix, full, nativePlayButton: playBox });
    }
    return evidence;
  });

  await check('Analysis config recovers after 3D modal with unobstructed controls and retained drafts', async () => {
    await page.evaluate(() => scrollTo(0, 0));
    await host('打乱状态 3D').waitFor();
    await openConfig();
    await poll(() => page.evaluate(() => [...document.querySelectorAll('body > [data-solver-cube-tree]')].every(element => {
      const r = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return style.opacity === '0' || style.visibility === 'hidden' || r.right <= 0 || r.bottom <= 0;
    })), 'no native player visually overlays config');
    const control = config.getByRole('combobox', { name: '解法数量上限', exact: true });
    await control.scrollIntoViewIfNeeded();
    assert.equal(await control.evaluate(element => {
      const r = element.getBoundingClientRect();
      const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return top === element || element.contains(top);
    }), true, 'config hit testing is not intercepted by the connected native root');
    await control.selectOption('20');
    await config.getByRole('tab', { name: '筛选', exact: true }).click();
    await config.getByRole('tab', { name: '搜索', exact: true }).click();
    assert.equal(await control.inputValue(), '20');
    await config.getByRole('button', { name: '取消', exact: true }).click();
    return { control: '解法数量上限', draft: '20', nativeOverlay: false };
  });

  await check('Analysis random button commits pure RUF scramble and real solutions; manual six-face input remains accepted', async () => {
    const before = await snapshot();
    await main.getByRole('button', { name: '随机打乱', exact: true }).click();
    const random = await settled(before.options.maxSolutions, before.identity);
    assert.match(random.scramble, /^[RUF](?:2|')?(?: [RUF](?:2|')?)*$/, 'generated scramble excludes D/L/B and x/y/z');
    assert.equal(await main.locator('#two-scramble').inputValue(), random.scramble);
    assert.ok(random.result.solutions.length > 0);
    for (const algorithm of await cards.locator('[data-full-solution]').allTextContents()) {
      assert.ok(kp.defaultPattern().applyAlg(random.scramble).applyAlg(algorithm === '无需转动' ? '' : algorithm)
        .experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }), `random solve independently replays: ${algorithm}`);
    }
    const manual = "D L B R U R' F2 U' R2 F U2 R'";
    await main.locator('#two-scramble').fill(manual);
    const custom = await settled(random.options.maxSolutions, random.identity);
    assert.equal(custom.scramble, manual, 'RUF restriction must not rewrite custom analysis');
    assert.equal(await main.locator('#two-scramble').inputValue(), manual);
    assert.ok(custom.result.solutions.length > 0);
    for (const algorithm of await cards.locator('[data-full-solution]').allTextContents()) {
      assert.ok(kp.defaultPattern().applyAlg(manual).applyAlg(algorithm === '无需转动' ? '' : algorithm)
        .experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }));
    }
    return { generated: random.scramble, manual, randomSolutions: random.result.solutions.length, manualSolutions: custom.result.solutions.length };
  });

  await check('No browser errors, solver alerts or failed dataset responses', async () => {
    assert.deepEqual(report.pageErrors, []);
    assert.deepEqual(report.consoleErrors, []);
    assert.deepEqual(await main.getByRole('alert').allTextContents(), []);
    assert.ok(report.datasets.length > 0);
    assert.ok(report.datasets.every(item => item.status === 200));
    return { pageErrors: 0, consoleErrors: 0, datasetResponses: report.datasets.length };
  });
} finally {
  report.elapsedMs = Date.now() - started;
  report.activity = await activity().catch(() => null);
  await writeFile(join(artifacts, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  clearTimeout(watchdog);
  console.log(`Browser verification report: ${join(artifacts, 'report.json')}`);
  console.log(`Elapsed: ${report.elapsedMs}ms. Screenshots captured only; no image inspection performed.`);
}
if (report.checks.some(check => check.status !== 'passed')) process.exitCode = 1;
