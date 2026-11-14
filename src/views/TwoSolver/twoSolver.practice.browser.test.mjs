import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { puzzles } from 'cubing/puzzles';

// Run against the actual server. No worker, random, data, clock, clipboard,
// ECharts or native player API is mocked. Existing workbench tests are separate.
// TWO_SOLVER_URL=http://127.0.0.1:3129/tools/solver/222/ node src/views/TwoSolver/twoSolver.practice.browser.test.mjs
const url = process.env.TWO_SOLVER_URL || 'http://127.0.0.1:3129/tools/solver/222/';
const artifacts = process.env.TWO_SOLVER_ARTIFACTS || join('/var/folders/p8/b3ryxj6s1bd4wgsspxzhfnw40000gn/T/opencode', `two-solver-practice-${Date.now()}`);
const keys = { search: 'cubing.pro.two-solver.settings.v1', ui: 'cubing.pro.two-solver.ui.v1', history: 'cubing.pro.two-solver.practice.v1' };
const started = Date.now();
const deadline = started + 180000;
const report = { url, artifacts, checks: [], workers: [], datasets: [], pageErrors: [], consoleErrors: [], screenshots: [] };
await mkdir(artifacts, { recursive: true });
let browser;
const watchdog = setTimeout(async () => {
  report.checks.push({ name: 'Runtime budget', status: 'failed', error: 'Exceeded 180 seconds; incomplete coverage is failure' });
  report.elapsedMs = Date.now() - started;
  try { await writeFile(join(artifacts, 'report.json'), JSON.stringify(report, null, 2)); } finally { process.exit(1); }
}, 180000);

// Read committed React snapshots and the native ECharts component instance.
// Never call React setters, ECharts event handlers or application actions here.
function observe() {
  const state = { busyStarts: 0, busy: false, clicks: [] };
  const fiberOf = element => {
    const key = element && Object.keys(element).find(key => key.startsWith('__reactFiber$'));
    let fiber = key && element[key];
    let root = fiber;
    while (root?.return) root = root.return;
    if (root?.stateNode?.current !== root && fiber?.alternate) fiber = fiber.alternate;
    return fiber;
  };
  const snapshots = () => {
    for (let fiber = fiberOf(document.querySelector('main[data-settings-open]')); fiber; fiber = fiber.return) {
      const values = [];
      for (let hook = fiber.memoizedState; hook && typeof hook === 'object'; hook = hook.next) {
        const value = hook.memoizedState;
        if (value?.result?.solutions && value.options && typeof value.scramble === 'string') values.push(value);
      }
      if (values.length) {
        const reviewing = document.querySelector('[class*=practiceScramble] > span')?.textContent === '复盘中';
        const shown = document.querySelector('[class*=practiceScramble] code')?.textContent;
        return { question: values.find(value => value.id) ?? null,
          review: reviewing ? values.filter(value => !value.id && value.scramble === shown).at(-1) ?? null : null };
      }
    }
    return { question: null, review: null };
  };
  const chart = () => {
    for (let fiber = fiberOf(document.querySelector('.echarts-for-react')); fiber; fiber = fiber.return) {
      if (typeof fiber.stateNode?.getEchartsInstance === 'function') return fiber.stateNode.getEchartsInstance();
    }
    return null;
  };
  window.__practiceTest = { state, snapshots, chart };
  document.addEventListener('click', event => {
    const button = event.target.closest?.('button');
    if (button) state.clicks.push(button.getAttribute('aria-label') || button.textContent);
  }, true);
  addEventListener('DOMContentLoaded', () => {
    new MutationObserver(() => {
      const busy = !!document.querySelector('main [class*=spinner]');
      if (busy && !state.busy) state.busyStarts++;
      state.busy = busy;
    }).observe(document.body, { subtree: true, childList: true });
  });
}
let page;
let context;
let kp;
let ready = false;
let realRecords = [];
let seeded = false;
const main = () => page.locator('main[data-settings-open]');
const timer = () => main().locator('[data-phase]');
const sticky = () => main().locator('[data-sticky-scramble]');
const scramble = () => sticky().locator('code').textContent();
const cards = () => main().locator('article[data-method]');
const stats = () => main().getByRole('region', { name: '成绩曲线', exact: true });
const button = name => main().getByRole('button', { name, exact: typeof name === 'string' });
const stored = key => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), key);
const snapshots = async () => {
  const value = await page.evaluate(() => window.__practiceTest.snapshots());
  // Only generated live questions have this contract; reviews retain user notation.
  if (value.question) assert.match(value.question.scramble, /^[RUF](?:2|')?(?: [RUF](?:2|')?)*$/, 'every generated live question uses pure RUF');
  return value;
};
const phase = () => timer().getAttribute('data-phase');
const busy = () => main().locator('[class*=spinner]').count();
const activity = () => page.evaluate(() => window.__practiceTest.state.busyStarts);
const history = () => main().locator('#two-practice-history');
const recordButton = () => button(/^记录 [0-9]+$/);
async function poll(fn, label, timeout = 14000) {
  const until = Math.min(deadline - 2500, Date.now() + timeout);
  let last;
  while (Date.now() < until) {
    try { const value = await fn(); if (value) return value; } catch (error) { last = error; }
    await page.waitForTimeout(50);
  }
  throw new Error(`Timed out: ${label}${last ? ` (${last.message})` : ''}`);
}
async function check(name, fn, prerequisite = true) {
  if (!prerequisite || Date.now() > deadline - 6000) {
    report.checks.push({ name, status: 'blocked', error: 'Missing prerequisite or remaining runtime; coverage not passed' });
    return;
  }
  const at = Date.now();
  try {
    const evidence = await fn();
    report.checks.push({ name, status: 'passed', elapsedMs: Date.now() - at, evidence });
    console.log(`PASS ${name}`);
  } catch (error) {
    report.checks.push({ name, status: 'failed', elapsedMs: Date.now() - at, error: error.stack || String(error) });
    console.error(`FAIL ${name}: ${error.message}`);
    if (page) {
      const path = join(artifacts, `failure-${report.checks.length}.png`);
      await page.screenshot({ path, timeout: 2000 }).then(() => report.screenshots.push(path)).catch(() => {});
      await page.keyboard.up('Space').catch(() => {});
      await page.keyboard.press('Escape').catch(() => {});
    }
  }
}
async function questionReady(previousId) {
  return poll(async () => {
    const value = (await snapshots()).question;
    return value && value.id !== previousId && !await busy() && await button('下一条').isEnabled() ? value : null;
  }, 'actual generated and searched question', 20000);
}
async function openSettings(kind, tab) {
  await button(kind).click();
  const dialog = page.getByRole('dialog', { name: kind === '计时设置' ? '计时器设置' : kind === '解法设置' ? '分析配置' : kind, exact: true });
  await dialog.waitFor();
  if (tab) await dialog.getByRole('tab', { name: tab, exact: true }).click();
  return dialog;
}
async function apply(dialog) {
  await dialog.getByRole('button', { name: '应用', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
}
async function hold(ms = 350) {
  await page.keyboard.down('Space');
  await page.waitForTimeout(ms);
  assert.equal(await timer().getAttribute('data-armed'), 'true', 'configured hold arms timer');
  await page.keyboard.up('Space');
  await poll(async () => await phase() === 'running', 'Space release starts timer after real preparation', 20000);
  const live = (await snapshots()).question;
  assert.equal(await main().evaluate(element => element.className.includes('focusTiming')), true);
  assert.equal(await sticky().isVisible(), true, 'focus timing keeps the scramble visible');
  assert.equal(await scramble(), live.scramble, 'running timer displays the live question');
  await stickyGeometry(live.scramble, false);
}
async function replay(setup) {
  const algorithms = await cards().locator('[data-full-solution]').allTextContents();
  assert.ok(algorithms.length > 0, 'must have real engine solutions');
  for (const algorithm of algorithms) assert.ok(kp.defaultPattern().applyAlg(setup).applyAlg(algorithm === '无需转动' ? '' : algorithm)
    .experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }), `independent cubing replay: ${setup} / ${algorithm}`);
  return algorithms.length;
}
async function stopExactlyOnce(question, count) {
  await page.waitForTimeout(150);
  await page.keyboard.down('Space');
  await poll(async () => await phase() === 'stopped', 'stop on keydown');
  await page.waitForTimeout(360);
  await page.keyboard.down('Space'); // Actual repeated keydown from Playwright.
  await page.keyboard.up('Space');
  await page.waitForTimeout(150);
  assert.equal(await phase(), 'stopped', 'held stop and its keyup cannot advance');
  assert.equal(await scramble(), question.scramble);
  assert.equal((await snapshots()).question.id, question.id);
  await poll(async () => (await stored(keys.history))?.length === count + 1, 'exactly one record saved');
  const rows = await stored(keys.history);
  assert.equal(rows.length, count + 1);
  assert.equal(rows.filter(row => row.id === question.id).length, 1);
  assert.equal(rows[0].scramble, question.scramble);
  assert.deepEqual(rows[0].searchOptions, question.searchOptions);
  assert.equal(rows[0].inspectionMs, 0);
  assert.equal(rows[0].inspectionPenalty, 'none');
  assert.ok(rows[0].elapsedMs >= 100);
  await replay(question.scramble);
  return rows[0];
}
async function reviewed(record, live, before) {
  await poll(async () => !await busy() && (await snapshots()).review?.scramble === record.scramble, 'exact selected record replay');
  assert.equal(await scramble(), record.scramble);
  assert.equal(await sticky().getAttribute('aria-label'), '复盘打乱');
  const value = await snapshots();
  assert.deepEqual(value.question, live, 'review cannot overwrite live question/result');
  if (record.searchOptions) assert.deepEqual(value.review.options, record.searchOptions);
  assert.deepEqual(await stored(keys.history), before, 'review never creates or edits a score');
  return replay(record.scramble);
}
async function returnCurrent(live) {
  await button('返回当前练习').click();
  await poll(async () => !(await snapshots()).review && await scramble() === live.scramble, 'return to live question');
  assert.deepEqual((await snapshots()).question, live);
  assert.equal(await sticky().getAttribute('aria-label'), '当前练习打乱');
}
async function chartData() {
  return poll(() => page.evaluate(() => {
    const chart = window.__practiceTest.chart();
    if (!chart || chart.isDisposed()) return null;
    const option = chart.getOption();
    const canvas = chart.getDom().querySelector('canvas');
    return { series: option.series.map(({ name, type, data, connectNulls }) => ({ name, type, data, connectNulls })), categories: option.xAxis[0].data, yMin: option.yAxis[0].min, tooltipRenderer: option.tooltip[0].renderMode,
      canvas: canvas ? { width: canvas.width, height: canvas.height, pixels: canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((v, i) => i % 4 === 3 && v > 0) } : null };
  }), 'mounted native ECharts instance');
}
// Independent integration oracle; exhaustive statistical edge cases live in unit tests.
const adjusted = row => row.penalty === 'DNF' ? Infinity : row.elapsedMs + (row.penalty === '+2' ? 2000 : 0);
const average = (values, n) => {
  if (values.length < n) return null;
  const sorted = values.slice(-n).sort((a, b) => a - b).slice(1, -1);
  return sorted.every(Number.isFinite) ? sorted.reduce((a, b) => a + b, 0) / sorted.length : Infinity;
};
const plotValue = value => value === null || !Number.isFinite(value) ? null : value / 1000;
async function verifyChart(rows, windowSize) {
  const chronological = [...rows].reverse();
  const times = chronological.map(adjusted);
  const expected = { '单次': times.map(plotValue), ao5: times.map((_, i) => plotValue(average(times.slice(0, i + 1), 5))), ao12: times.map((_, i) => plotValue(average(times.slice(0, i + 1), 12))) };
  const value = await poll(async () => {
    const value = await chartData();
    if (value.categories.length !== Math.min(windowSize, rows.length)) return null;
    for (const [name, data] of Object.entries(expected)) {
      const actual = value.series.find(series => series.name === name)?.data;
      const wanted = data.slice(-windowSize);
      if (!actual || actual.length !== wanted.length || actual.some((point, i) => wanted[i] === null
        ? point.value !== null : typeof point.value !== 'number' || Math.abs(point.value - wanted[i]) > 1e-8)) return null;
    }
    return value;
  }, 'native chart reflects full saved dataset and selected window');
  assert.ok(value.canvas?.width > 0 && value.canvas.height > 0 && value.canvas.pixels, 'actual canvas has rendered pixels');
  assert.equal(value.yMin, 0);
  assert.equal(value.tooltipRenderer, 'richText');
  const ids = chronological.slice(-windowSize).map(row => row.id);
  for (const [name, data] of Object.entries(expected)) {
    const series = value.series.find(series => series.name === name);
    assert.ok(series, `${name} native series exists`);
    assert.equal(series.type, 'line');
    assert.equal(series.connectNulls, false);
    assert.deepEqual(series.data.map(point => point.recordId), ids);
    const wanted = data.slice(-windowSize);
    for (let i = 0; i < wanted.length; i++) {
      const actual = series.data[i].value;
      if (wanted[i] === null) assert.equal(actual, null, `${name}[${i}]: incomplete/DNF must not become zero`);
      else assert.ok(Math.abs(actual - wanted[i]) < 1e-8, `${name}[${i}]: ${actual} vs ${wanted[i]} seconds`);
    }
  }
  assert.deepEqual(value.categories, chronological.map((_, i) => String(i + 1)).slice(-windowSize));
  assert.deepEqual(value.series.find(series => series.name === 'DNF').data.map(point => point.recordId), chronological.slice(-windowSize).filter(row => row.penalty === 'DNF').map(row => row.id));
  for (const point of value.series.find(series => series.name === 'DNF').data) {
    assert.ok(Number.isFinite(point.value[1]) && point.value[1] > 0, 'DNF has a separate positive marker height, never a zero time');
  }
  return { points: ids.length, series: value.series.map(series => series.name), canvas: value.canvas };
}
async function noOverflow() {
  const geometry = await page.evaluate(() => {
    const main = document.querySelector('main[data-settings-open]');
    return { width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth, main: main.scrollWidth, client: main.clientWidth };
  });
  assert.ok(geometry.document <= geometry.width + 1 && geometry.body <= geometry.width + 1 && geometry.main <= geometry.client + 1, JSON.stringify(geometry));
  return geometry;
}
async function stickyGeometry(expected, pinned = true) {
  assert.equal(await sticky().isVisible(), true);
  const geometry = await sticky().evaluate(element => {
    const main = element.closest('main');
    const code = element.querySelector('code');
    const rect = element.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(code);
    let owner = element.parentElement;
    while (owner && !/(auto|scroll|hidden)/.test(getComputedStyle(owner).overflowY)) owner = owner.parentElement;
    const lines = [...range.getClientRects()].map(r => ({ top: r.top, bottom: r.bottom, left: r.left, right: r.right,
      visible: element.contains(document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2)) }));
    return { text: code.textContent, label: element.getAttribute('aria-label'), position: getComputedStyle(element).position,
      top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, offset: getComputedStyle(element).top,
      zIndex: getComputedStyle(element).zIndex, full: getComputedStyle(main).position === 'fixed',
      owner: owner === main ? 'main' : owner === document.body || owner === document.documentElement || !owner ? 'document' : owner.tagName,
      sibling: element.parentElement?.id === 'practice-panel' && element.nextElementSibling?.getAttribute('aria-label') === '计时练习',
      width: innerWidth, height: innerHeight, codeWidth: code.clientWidth, codeScroll: code.scrollWidth, lines };
  });
  assert.equal(geometry.text, expected);
  assert.equal(geometry.position, 'sticky');
  assert.equal(geometry.offset, geometry.full ? '0px' : '72px');
  assert.equal(geometry.zIndex, '20', 'sticky remains below settings (1400) and native 3D (2000)');
  assert.equal(geometry.owner, geometry.full ? 'main' : 'document');
  assert.equal(geometry.sibling, true, 'sticky is a top-level tabpanel sibling of practice');
  assert.ok(geometry.left >= -1 && geometry.right <= geometry.width + 1 && geometry.top >= -1 && geometry.bottom <= geometry.height + 1, JSON.stringify(geometry));
  assert.ok(geometry.codeScroll <= geometry.codeWidth + 1 && geometry.lines.length > 0, JSON.stringify(geometry));
  for (const line of geometry.lines) assert.ok(line.visible && line.top >= geometry.top && line.bottom <= geometry.bottom
    && line.left >= geometry.left && line.right <= geometry.right, JSON.stringify(geometry));
  if (pinned) assert.ok(Math.abs(geometry.top - (geometry.full ? 0 : 72)) <= 1, JSON.stringify(geometry));
  return geometry;
}
async function hitTest(locator) {
  await locator.scrollIntoViewIfNeeded();
  assert.equal(await locator.evaluate(element => {
    const r = element.getBoundingClientRect();
    const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return top === element || element.contains(top);
  }), true, 'control wins hit testing above fullscreen/native overlays');
}

try {
  browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN', colorScheme: 'light' });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(url).origin });
  await context.addInitScript(observe);
  context.on('page', p => {
    p.setDefaultTimeout(5000);
    p.setDefaultNavigationTimeout(20000);
    p.on('worker', worker => report.workers.push(worker.url()));
    p.on('pageerror', error => report.pageErrors.push(error.stack || error.message));
    p.on('console', message => { if (message.type() === 'error') report.consoleErrors.push({ text: message.text(), location: message.location() }); });
  });
  context.on('response', response => {
    if (response.url().includes('/two-solver/data/')) report.datasets.push({ url: response.url(), status: response.status() });
  });
  page = await context.newPage();
  kp = await puzzles['2x2x2'].kpuzzle();

  await check('Server ready within 20s; practice auto-generates real random question, fullscreen restores body/header', async () => {
    const until = Math.min(deadline, Date.now() + 20000);
    let available = false;
    while (Date.now() < until) {
      try {
        const response = await context.request.get(url, { timeout: Math.max(1, Math.min(2000, until - Date.now())) });
        if (response.ok()) { available = true; break; }
        const body = await response.text();
        const nextData = body.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
        let detail = body.slice(0, 1500);
        try { detail = JSON.parse(nextData).err?.message || detail; } catch { /* Preserve non-Next error responses too. */ }
        report.serverFailure = { status: response.status(), detail };
      } catch (error) { report.serverFailure = { error: error.message }; }
      await page.waitForTimeout(200);
    }
    assert.ok(available, `actual server unavailable after 20 seconds: ${JSON.stringify(report.serverFailure)}`);
    assert.ok((await page.goto(url, { waitUntil: 'domcontentloaded' })).ok());
    await main().getByRole('tab', { name: '练习', exact: true }).waitFor();
    await poll(() => main().getByRole('tab', { name: '练习', exact: true }).isEnabled(), 'UI hydrated');
    const before = await page.evaluate(() => ({ overflow: document.body.style.overflow, attribute: document.body.getAttribute('data-two-practice-active'),
      headers: [...document.querySelectorAll('[data-app-header]')].map(h => ({ inert: h.inert, hidden: h.getAttribute('aria-hidden') })) }));
    assert.ok(before.headers.length > 0, 'real app header present');
    await main().getByRole('tab', { name: '练习', exact: true }).click();
    const question = await questionReady();
    ready = true;
    assert.notEqual(question.scramble, "R U R' F2 U' R2 F U2 R'");
    assert.equal(kp.defaultPattern().applyAlg(question.scramble).experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }), false);
    assert.equal(await cards().count(), 0, 'solutions hidden until stop/reveal');
    assert.equal(await phase(), 'idle');
    assert.equal((await stored(keys.history)).length, 0);
    const fullscreen = await page.evaluate(() => {
      const r = document.querySelector('main[data-settings-open]').getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height,
        attribute: document.body.getAttribute('data-two-practice-active'), overflow: document.body.style.overflow,
        headers: [...document.querySelectorAll('[data-app-header]')].map(h => ({ inert: h.inert, hidden: h.getAttribute('aria-hidden'),
          display: getComputedStyle(h).display, visibility: getComputedStyle(h).visibility })) };
    });
    assert.ok(Math.abs(fullscreen.x) <= 1 && Math.abs(fullscreen.y) <= 1);
    assert.ok(Math.abs(fullscreen.width - 1440) <= 1 && Math.abs(fullscreen.height - 1000) <= 1, JSON.stringify(fullscreen));
    assert.equal(fullscreen.attribute, 'true');
    assert.equal(fullscreen.overflow, 'hidden');
    assert.ok(fullscreen.headers.every(h => h.inert && h.hidden === 'true' && (h.display === 'none' || h.visibility === 'hidden')));
    await button('退出专注').click();
    assert.deepEqual(await page.evaluate(() => ({ overflow: document.body.style.overflow, attribute: document.body.getAttribute('data-two-practice-active'),
      headers: [...document.querySelectorAll('[data-app-header]')].map(h => ({ inert: h.inert, hidden: h.getAttribute('aria-hidden') })) })), before);
    await page.evaluate(() => { document.body.setAttribute('data-two-practice-active', 'test-previous'); document.body.style.overflow = 'clip'; });
    await button('进入专注').click();
    await button('退出专注').click();
    assert.equal(await page.locator('body').getAttribute('data-two-practice-active'), 'test-previous');
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'clip');
    await page.evaluate(before => {
      document.body.style.overflow = before.overflow;
      if (before.attribute === null) document.body.removeAttribute('data-two-practice-active');
      else document.body.setAttribute('data-two-practice-active', before.attribute);
    }, before);
    await button('进入专注').click();
    assert.equal(await button('生成练习').count(), 0);
    return { scramble: question.scramble, fullscreen };
  });

  await check('Dedicated settings separate contents; config Space ignored, input accepts Space; hold configurable', async () => {
    const question = (await snapshots()).question;
    let dialog = await openSettings('练习设置');
    assert.deepEqual(await dialog.getByRole('tab').allTextContents(), ['练习']);
    assert.equal(await dialog.getByRole('checkbox', { name: '按条件抽样', exact: true }).count(), 1);
    assert.equal(await dialog.getByRole('checkbox', { name: '显示 3D 魔方', exact: true }).count(), 1);
    assert.equal(await dialog.getByRole('checkbox', { name: '启用 15 秒观察' }).count(), 0);
    assert.equal(await dialog.getByRole('combobox', { name: '起表按住时长', exact: true }).count(), 0);
    await dialog.getByRole('tab', { name: '练习', exact: true }).focus();
    await page.keyboard.down('Space');
    await page.waitForTimeout(350);
    await page.keyboard.up('Space');
    assert.equal(await phase(), 'idle');
    assert.equal(await timer().getAttribute('data-held'), 'false');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    dialog = await openSettings('计时设置');
    assert.deepEqual(await dialog.getByRole('tab').allTextContents(), ['计时器', '显示']);
    assert.equal(await dialog.getByRole('checkbox', { name: '按条件抽样' }).count(), 0);
    assert.equal(await dialog.getByRole('combobox', { name: '目标方法' }).count(), 0);
    assert.equal(await dialog.getByRole('combobox', { name: '起表按住时长', exact: true }).inputValue(), '300');
     await dialog.getByRole('checkbox', { name: '启用 15 秒观察' }).uncheck();
    await dialog.getByRole('combobox', { name: '起表按住时长', exact: true }).selectOption('550');
    await apply(dialog);
    assert.equal((await stored(keys.ui)).display.holdMs, 550);
    await button('下一条').focus();
    await page.keyboard.down('Space');
    await page.waitForTimeout(340);
    assert.equal(await timer().getAttribute('data-armed'), 'false');
    await page.keyboard.up('Space');
    assert.equal(await phase(), 'idle');
    assert.equal((await snapshots()).question.id, question.id);
    dialog = await openSettings('计时设置');
    await dialog.getByRole('combobox', { name: '起表按住时长', exact: true }).selectOption('300');
    await apply(dialog);
    await button('自定义复盘').click();
    const input = main().getByRole('textbox', { name: '复盘打乱', exact: true });
    await input.fill('R');
    await page.keyboard.press('End');
    await page.keyboard.press('Space');
    await page.keyboard.type('U');
    assert.equal(await input.inputValue(), 'R U');
    assert.equal(await phase(), 'idle');
    assert.equal((await stored(keys.history)).length, 0);
    await button('取消编辑').click();
    assert.equal((await stored(keys.ui)).inspection, false);
    return { holdMs: 300, inspection: false };
  }, ready);

  await check('Focused next Space starts without click; held stop records once and reveals same question; next hold prepares different question', async () => {
    const question = await questionReady();
    await button('下一条').focus();
    const clicks = await page.evaluate(() => window.__practiceTest.state.clicks.length);
    await hold();
    assert.equal((await snapshots()).question.id, question.id, 'focused next must not generate on Space');
    assert.equal(await scramble(), question.scramble);
    assert.equal(await page.evaluate(() => window.__practiceTest.state.clicks.length), clicks, 'Space suppresses native button click');
    realRecords.push(await stopExactlyOnce(question, 0));
    await timer().locator('[class*=timerDigits]').click();
    await hold();
    const next = (await snapshots()).question;
    assert.notEqual(next.id, question.id);
    assert.notEqual(next.scramble, question.scramble);
    assert.equal(await cards().count(), 0);
    assert.equal((await stored(keys.history)).length, 1, 'advance cannot score before stopping');
    realRecords.push(await stopExactlyOnce(next, 1));
    return { records: realRecords, independentlyReplayed: true };
  }, ready);

  await check('Focused copy/records Space suppresses button action; searchOptions survive changed live settings', async () => {
    const before = await stored(keys.history);
    const oldOptions = structuredClone(before[0].searchOptions);
    const dialog = await openSettings('解法设置');
    await dialog.getByRole('combobox', { name: '解法数量上限', exact: true }).selectOption('50');
    await apply(dialog);
    assert.equal((await stored(keys.search)).maxSolutions, 50);
    assert.deepEqual(await stored(keys.history), before);
    await page.evaluate(() => navigator.clipboard.writeText('practice-space-copy-sentinel'));
    const copy = cards().first().getByRole('button', { name: '复制完整解法', exact: true });
    await copy.focus();
    assert.equal(await copy.evaluate(element => element === document.activeElement), true, 'copy actually focused after stop');
    let clicks = await page.evaluate(() => window.__practiceTest.state.clicks.length);
    await hold();
    const copyQuestion = (await snapshots()).question;
    assert.deepEqual(await stored(keys.history), before, 'focused copy start does not score or edit history');
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'practice-space-copy-sentinel');
    assert.equal(await page.evaluate(() => window.__practiceTest.state.clicks.length), clicks);
    await stopExactlyOnce(copyQuestion, before.length);
    assert.equal(await page.evaluate(() => window.__practiceTest.state.clicks.length), clicks, 'stop/repeat/keyup cannot click the formerly focused copy button');
    assert.deepEqual((await stored(keys.history)).find(row => row.id === before[0].id).searchOptions, oldOptions);
    const expanded = await recordButton().getAttribute('aria-expanded');
    await recordButton().focus();
    assert.equal(await recordButton().evaluate(element => element === document.activeElement), true, 'records actually focused after stop');
    clicks = await page.evaluate(() => window.__practiceTest.state.clicks.length);
    await hold();
    const recordsQuestion = (await snapshots()).question;
    // Focus timing hides the actions from the accessibility tree. Inspect only
    // the persisted DOM attribute here; focus and interaction still use roles.
    const hiddenRecords = main().locator('button[aria-controls="two-practice-history"]');
    assert.equal(await hiddenRecords.count(), 1);
    assert.equal(await hiddenRecords.isVisible(), false, 'focus mode hides the records action while running');
    assert.equal(await hiddenRecords.getAttribute('aria-expanded'), expanded);
    assert.equal(await page.evaluate(() => window.__practiceTest.state.clicks.length), clicks);
    assert.equal((await stored(keys.history)).length, before.length + 1, 'focused records start cannot score until stopped');
    await stopExactlyOnce(recordsQuestion, before.length + 1);
    assert.equal(await recordButton().isVisible(), true);
    assert.equal(await recordButton().getAttribute('aria-expanded'), expanded, 'records never toggles on Space start/stop');
    assert.equal(await page.evaluate(() => window.__practiceTest.state.clicks.length), clicks, 'stop/repeat/keyup cannot click the formerly focused records button');
    return { realTimed: (await stored(keys.history)).length, historicSearchLimit: oldOptions.maxSolutions, currentSearchLimit: 50,
      copyQuestion: copyQuestion.id, recordsQuestion: recordsQuestion.id, suppressedButtonClicks: true, recordsExpanded: expanded };
  }, realRecords.length >= 2);

  async function finalChecks() {
  await check('Real ECharts point mouse click replays exact record; history penalties update native chart', async () => {
    const live = (await snapshots()).question;
    const rows = await stored(keys.history);
    const target = rows.at(-4);
    const chart = stats().locator('.echarts-for-react');
    await chart.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(120);
    await chartData();
    const point = await page.evaluate(id => {
      const chart = window.__practiceTest.chart();
      const option = chart.getOption();
      const series = option.series.find(series => series.name === '单次');
      const index = series.data.findIndex(point => point.recordId === id);
      if (index < 0 || series.data[index].value === null) throw new Error('Target point unavailable');
      const [x, y] = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [index, series.data[index].value]);
      const r = chart.getDom().getBoundingClientRect();
      return { x: r.x + x, y: r.y + y, index, value: series.data[index].value };
    }, target.id);
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    await page.mouse.click(point.x, point.y);
    await reviewed(target, live, rows);
    assert.equal(await stats().getByRole('combobox', { name: '选择成绩复盘', exact: true }).inputValue(), target.id);
    await returnCurrent(live);
    await recordButton().click();
    const index = rows.findIndex(row => row.id === target.id);
    const row = history().locator('details').nth(index);
    await row.locator('summary').click();
    for (const value of ['+2', 'DNF', 'none']) {
      await row.getByRole('combobox', { name: '成绩判罚', exact: true }).selectOption(value);
      await poll(async () => (await stored(keys.history))[index].penalty === value, 'historic penalty saved');
      await verifyChart(await stored(keys.history), 50);
    }
    await recordButton().click();
    return { clicked: target.id, point, independentReplay: true };
  }, seeded);

  await check('320/390 fullscreen has no overflow; settings and native 3D modal win hit testing', async () => {
    const evidence = [];
    // Review automatically exposes solutions without a reveal button.
    await button('上一条').click();
    await poll(async () => !await busy() && await cards().count() > 0, 'review solutions shown automatically');
    const setup = await scramble();
    await replay(setup);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const geometry = await noOverflow();
      const dialog = await openSettings('计时设置', '显示');
      const control = dialog.getByRole('combobox', { name: '曲线显示范围', exact: true });
      await hitTest(control);
      const bounds = await dialog.boundingBox();
      assert.ok(bounds.x >= -1 && bounds.x + bounds.width <= width + 1 && bounds.height <= 845, JSON.stringify(bounds));
      await noOverflow();
      await dialog.getByRole('button', { name: '取消', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      await cards().first().getByRole('button', { name: '3D 解析', exact: true }).click();
      const modal = page.getByRole('dialog', { name: /3D 解析/ });
      await modal.waitFor();
      await hitTest(modal.getByRole('button', { name: '做底完成', exact: true }));
      const host = modal.locator('[data-solver-cube]');
      await poll(async () => await host.getAttribute('aria-busy') === 'false', 'real native 3D initialized', 12000);
      const native = page.locator('body > [data-solver-cube-player="解法 3D 解析"]');
      await poll(() => native.evaluate(element => !element.inert && getComputedStyle(element).opacity === '1'), 'connected player positioned after modal layout');
      const state = await native.evaluate(async element => {
        const player = element.querySelector('twisty-player');
        const [vantage] = await player.experimentalCurrentVantages();
        const { canvas, context } = await vantage.canvasInfo();
        const gl = context ? null : canvas.getContext('webgl2') || canvas.getContext('webgl');
        const r = element.getBoundingClientRect();
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return { setup: (await player.experimentalModel.setupAlg.get()).alg.toString(),
          alg: (await player.experimentalModel.alg.get()).alg.toString(), healthy: !!context || !!gl && !gl.isContextLost(),
          width: canvas.width, height: canvas.height, hits: element === top || element.contains(top), inert: element.inert,
          opacity: getComputedStyle(element).opacity };
      });
      assert.equal(state.setup, setup);
      assert.ok(kp.defaultPattern().applyAlg(state.setup).applyAlg(state.alg).experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }));
      assert.ok(state.healthy && state.width > 0 && state.height > 0 && state.hits && !state.inert && state.opacity === '1', JSON.stringify(state));
      await modal.getByRole('button', { name: '做底完成', exact: true }).click();
      await poll(async () => await modal.getByRole('button', { name: '做底完成', exact: true }).getAttribute('aria-pressed') === 'true'
        && await host.getAttribute('data-alg') === '', '3D stage click reaches modal above fullscreen');
      await modal.getByRole('button', { name: '完整解法', exact: true }).click();
      await poll(async () => await host.getAttribute('data-setup') === setup && await host.getAttribute('data-alg') === state.alg, 'full native replay stage restored');
      await noOverflow();
      const path = join(artifacts, `practice-3d-${width}.png`);
      await page.screenshot({ path, timeout: 3000 });
      report.screenshots.push(path);
      await modal.getByRole('button', { name: '关闭 3D 解析', exact: true }).click();
      await modal.waitFor({ state: 'hidden' });
      assert.equal(await page.locator('body').getAttribute('data-two-practice-active'), 'true');
      const practiceDialog = await openSettings('练习设置');
      await hitTest(practiceDialog.getByRole('checkbox', { name: '显示 3D 魔方', exact: true }));
      await practiceDialog.getByRole('button', { name: '取消', exact: true }).click();
      await practiceDialog.waitFor({ state: 'hidden' });
      evidence.push({ width, geometry, native: state });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    return evidence;
  }, ready);

  await check('Cancelled generation stays cancelled; rapid tabs leave no stale question or auto retry loop', async () => {
    const old = (await snapshots()).question;
    const rows = await stored(keys.history);
    await button('下一条').click();
    await poll(() => button('取消').evaluate(element => { element.click(); return true; }), 'cancel task as soon as it mounts', 2500);
    await poll(async () => !await busy(), 'cancel settled');
    const starts = await activity();
    await page.waitForTimeout(1200);
    assert.equal(await activity(), starts, 'cancel cannot restart generation');
    assert.equal((await snapshots()).question.id, old.id);
    assert.match(await main().textContent(), /已取消/);
    await button('下一条').click();
    for (let i = 0; i < 3; i++) {
      await main().getByRole('tab', { name: '分析', exact: true }).click();
      await main().getByRole('tab', { name: '练习', exact: true }).click();
    }
    await poll(async () => !await busy(), 'rapid tabs settle');
    await page.waitForTimeout(1100);
    assert.equal(await busy(), 0);
    assert.equal((await snapshots()).question.id, old.id, 'cancelled worker response cannot replace question');
    assert.deepEqual(await stored(keys.history), rows);
    assert.deepEqual(await main().getByRole('alert').allTextContents(), []);
    await main().getByRole('tab', { name: '分析', exact: true }).click();
    assert.equal(await page.locator('body').getAttribute('data-two-practice-active'), null);
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    return { questionId: old.id, saved: rows.length, cancelledBusyStarts: starts };
  }, ready);

  await check('No browser errors, alerts or failed real datasets; real worker/data observed', async () => {
    assert.deepEqual(report.pageErrors, []);
    assert.deepEqual(report.consoleErrors, []);
    assert.deepEqual(await main().getByRole('alert').allTextContents(), []);
    assert.ok(report.workers.some(worker => new URL(worker).origin === new URL(url).origin));
    assert.ok(report.datasets.length > 0);
    assert.ok(report.datasets.every(item => item.status === 200));
    return { workers: report.workers.length, datasets: report.datasets.length };
  }, ready);
  }

  await check('Previous, arbitrary record and custom review preserve live question; Space exits review and scores live only', async () => {
    await button('重练').click();
    const live = (await snapshots()).question;
    const before = await stored(keys.history);
    await button('上一条').click();
    await reviewed(before[0], live, before);
    await returnCurrent(live);
    await recordButton().click();
    const index = before.length - 1;
    const row = history().locator('details').nth(index);
    await row.locator('summary').click();
    await row.getByRole('button', { name: '复盘此打乱', exact: true }).click();
    await reviewed(before[index], live, before);
    await returnCurrent(live);
    await recordButton().click();
    await button('自定义复盘').click();
    const custom = `D L B R U R' F2 U' R2 F U2 R'`;
    await main().getByRole('textbox', { name: '复盘打乱', exact: true }).fill(custom);
    await button('复盘打乱').click();
    await reviewed({ scramble: custom }, live, before);
    await returnCurrent(live);
    // Accessible selection supplements, but does not replace, native chart clicks.
    await stats().getByRole('combobox', { name: '选择成绩复盘', exact: true }).selectOption(before[index].id);
    await stats().getByRole('button', { name: '复盘', exact: true }).click();
    await reviewed(before[index], live, before);
    await timer().locator('[class*=timerDigits]').click();
    await hold();
    assert.equal((await snapshots()).review, null);
    assert.equal(await scramble(), live.scramble);
    assert.equal((await snapshots()).question.id, live.id);
    assert.deepEqual(await stored(keys.history), before, 'starting from review does not score history');
    const record = await stopExactlyOnce(live, before.length);
    assert.equal(record.id, live.id);
    assert.notEqual(record.id, before[index].id);
    return { previous: before[0].id, arbitrary: before[index].id, custom, recordedLive: record.id };
  }, realRecords.length >= 2);

  await check('Native canvas reflects current history and +2/DNF rerenders without zero-valued missing data', async () => {
    const rows = await stored(keys.history);
    const initial = await verifyChart(rows, 50);
    const penalty = main().getByRole('combobox', { name: '当前成绩判罚', exact: true });
    for (const value of ['+2', 'DNF', 'none']) {
      await penalty.selectOption(value);
      await poll(async () => (await stored(keys.history))[0].penalty === value, 'current penalty persisted');
      await poll(async () => {
        const data = await chartData();
        const last = data.series.find(series => series.name === '单次').data.at(-1);
        return value === 'DNF' ? last.value === null : Math.abs(last.value - (rows[0].elapsedMs + (value === '+2' ? 2000 : 0)) / 1000) < 1e-8;
      }, 'native series changes with current penalty');
      await verifyChart(await stored(keys.history), 50);
    }
    return initial;
  }, realRecords.length >= 2);

  await check('Reload seeded existing history on new page; single/ao5/ao12 use full data before 20/50 windowing', async () => {
    const actual = await stored(keys.history);
    assert.ok(actual.length >= 2 && realRecords.length >= 2, 'two newly timed real records required before seeding');
    // Only saved historic records are seeded; all random generation and solves remain real.
    const historic = Array.from({ length: 24 }, (_, i) => ({
      ...structuredClone(actual[i % actual.length]), id: `practice-browser-historic-${i}`,
      date: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
      elapsedMs: 8000 + i * 731, penalty: i === 6 || i === 7 ? 'DNF' : i === 3 ? '+2' : 'none',
      scramble: i === 0 ? "D L B R U R' F2 U' R2 F U2 R'" : actual[i % actual.length].scramble,
      inspectionMs: 0, inspectionPenalty: 'none', sampling: 'Existing historic integration fixture',
    }));
    const rows = [...actual, ...historic];
    await page.evaluate(({ key, rows }) => localStorage.setItem(key, JSON.stringify(rows)), { key: keys.history, rows });
    const oldPage = page;
    page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await oldPage.close();
    await poll(() => main().getByRole('tab', { name: '练习', exact: true }).isEnabled(), 'new page hydrated');
    await main().getByRole('tab', { name: '练习', exact: true }).click();
    await questionReady();
    assert.deepEqual(await stored(keys.history), rows, 'reloaded records and original searchOptions stay stable');
    await verifyChart(rows, 50);
    for (const windowSize of [20, 50]) {
      const dialog = await openSettings('计时设置', '显示');
      await dialog.getByRole('combobox', { name: '曲线显示范围', exact: true }).selectOption(String(windowSize));
      await apply(dialog);
      await verifyChart(rows, windowSize);
      assert.equal((await stored(keys.ui)).display.chartWindow, windowSize);
      assert.match(await stats().textContent(), new RegExp(`已保存 ${rows.length} 次`));
    }
    for (const name of ['ao5', 'ao12']) {
      const toggle = stats().getByRole('checkbox', { name, exact: true });
      await toggle.uncheck();
      await poll(async () => !(await chartData()).series.some(series => series.name === name), `${name} native series removed`);
      await toggle.check();
      await poll(async () => (await chartData()).series.some(series => series.name === name), `${name} native series restored`);
      await verifyChart(rows, 50);
    }
    const times = [...rows].reverse().map(adjusted);
    const format = ms => {
      if (ms === null) return '—';
      if (!Number.isFinite(ms)) return 'DNF';
      const ticks = Math.floor(ms / 10);
      const seconds = Math.floor(ticks / 100);
      return `${seconds >= 60 ? `${Math.floor(seconds / 60)}:` : ''}${seconds >= 60 ? String(seconds % 60).padStart(2, '0') : seconds}.${String(ticks % 100).padStart(2, '0')}`;
    };
    const metrics = await stats().locator('dl > div').evaluateAll(elements => Object.fromEntries(elements.map(el => [el.querySelector('dt').textContent, el.querySelector('dd').textContent])));
    const mean = list => list.every(Number.isFinite) ? list.reduce((a, b) => a + b, 0) / list.length : Infinity;
    assert.deepEqual(metrics, { 最新: format(times.at(-1)), 单次最佳: format(Math.min(...times)), 平均: format(mean(times)), mo3: format(mean(times.slice(-3))), ao5: format(average(times, 5)), ao12: format(average(times, 12)) });
    seeded = true;
    return { actualTimed: actual.length, historic: historic.length, total: rows.length, metrics };
  }, realRecords.length >= 2);
   await check('Next button and conditional practice generate pure RUF without altering history', async () => {
     const rows = await stored(keys.history);
     const previous = await questionReady();
     await button('下一条').click();
     const next = await questionReady(previous.id);
     assert.notEqual(next.id, previous.id);
     assert.equal(await scramble(), next.scramble);
     const dialog = await openSettings('练习设置');
     await dialog.getByRole('checkbox', { name: '按条件抽样', exact: true }).check();
     await dialog.getByRole('combobox', { name: '目标方法', exact: true }).selectOption('');
     await dialog.getByRole('combobox', { name: '指定做底深度', exact: true }).selectOption('');
     await dialog.getByRole('spinbutton', { name: '总步数上限', exact: true }).fill('');
     await dialog.getByRole('spinbutton', { name: '最少消步数', exact: true }).fill('0');
     await dialog.getByRole('spinbutton', { name: '最多尝试次数', exact: true }).fill('1');
     await apply(dialog);
     await button('下一条').click();
     const conditional = await questionReady(next.id);
     assert.notEqual(conditional.id, next.id);
     assert.match(conditional.sampling, /^条件抽样：/);
     assert.equal(await scramble(), conditional.scramble);
     assert.ok(conditional.result.solutions.length > 0);
     const reset = await openSettings('练习设置');
     await reset.getByRole('checkbox', { name: '按条件抽样', exact: true }).uncheck();
     await apply(reset);
     assert.deepEqual(await stored(keys.history), rows);
     return { next: next.scramble, conditional: conditional.scramble };
   }, seeded);

   await check('Sticky survives long charts/results in both scroll owners; 320/390 long notation wraps and review/live stay exact', async () => {
     const live = await questionReady();
     const rows = await stored(keys.history);
     const historic = rows.find(row => row.scramble.includes('D L B'));
     assert.ok(historic, 'six-face history fixture retained without filtering');
     await stats().getByRole('combobox', { name: '选择成绩复盘', exact: true }).selectOption(historic.id);
     await stats().getByRole('button', { name: '复盘', exact: true }).click();
     await reviewed(historic, live, rows);
     await returnCurrent(live);
     await button('自定义复盘').click();
     const long = "D L B R U R' F2 U' R2 F U2 R' F2 U R2 U' F R U2 F'";
     assert.ok(long.split(' ').length >= 11);
     await main().getByRole('textbox', { name: '复盘打乱', exact: true }).fill(long);
     await button('复盘打乱').click();
     await reviewed({ scramble: long }, live, rows);
     assert.ok(await cards().count() > 0, 'long review supplies real results below the chart');
     const evidence = [];
     const failures = [];
     for (const width of [1440, 320, 390]) {
       await page.setViewportSize({ width, height: 844 });
       for (const full of [true, false]) {
         const toggle = button(full ? '进入专注' : '退出专注');
         if (await toggle.count()) await toggle.click();
         await page.evaluate(() => {
           const main = document.querySelector('main[data-settings-open]');
           main.scrollTo({ top: 0, behavior: 'instant' });
           window.scrollTo({ top: 0, behavior: 'instant' });
         });
         const positions = [];
         for (const fraction of [0.5, 1]) {
           const scroll = await page.evaluate(({ full, fraction }) => {
             const main = document.querySelector('main[data-settings-open]');
             if (full) main.scrollTo({ top: (main.scrollHeight - main.clientHeight) * fraction, behavior: 'instant' });
             else {
               const top = (document.scrollingElement.scrollHeight - innerHeight) * fraction;
               document.body.scrollTo({ top, behavior: 'instant' });
               window.scrollTo({ top, behavior: 'instant' });
             }
             return { main: main.scrollTop, document: scrollY, bodyOverflow: document.body.style.overflow };
           }, { full, fraction });
           await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
           assert.ok((full ? scroll.main : scroll.document) > 300, `actual scroll beyond practice stage: ${JSON.stringify(scroll)}`);
           if (full) { assert.equal(scroll.document, 0); assert.equal(scroll.bodyOverflow, 'hidden'); }
           else assert.equal(scroll.main, 0);
           const geometry = await stickyGeometry(long, false);
           assert.equal(geometry.full, full);
           assert.equal(geometry.label, '复盘打乱');
           if (width <= 390) assert.ok(new Set(geometry.lines.map(line => Math.round(line.top))).size > 1, 'long notation actually wraps');
           await noOverflow();
           try {
             assert.ok(Math.abs(geometry.top - (full ? 0 : 72)) <= 1,
               `${width}px ${full ? 'fullscreen' : 'normal'} scroll ${fraction}: expected top ${full ? 0 : 72}, got ${geometry.top}; ${JSON.stringify(scroll)}`);
           } catch (error) { failures.push(error.message); }
           positions.push({ fraction, scroll, geometry });
         }
         evidence.push({ width, full, positions });
       }
     }
     await page.setViewportSize({ width: 1440, height: 1000 });
     await returnCurrent(live);
     await button('进入专注').click();
     await page.evaluate(() => { window.scrollTo(0, 0); document.querySelector('main[data-settings-open]').scrollTo(0, 0); });
     assert.equal(await scramble(), live.scramble);
     assert.deepEqual(await stored(keys.history), rows);
     assert.deepEqual(failures, [], 'sticky must pin at the exact requested viewport offset in every mode');
     return evidence;
   }, seeded);
   await finalChecks();
} catch (error) {
  report.checks.push({ name: 'Browser harness', status: 'failed', error: error.stack || String(error) });
} finally {
  report.elapsedMs = Date.now() - started;
  await writeFile(join(artifacts, 'report.json'), JSON.stringify(report, null, 2));
  await browser?.close().catch(() => {});
  clearTimeout(watchdog);
  console.log(`Browser verification report: ${join(artifacts, 'report.json')}`);
  console.log(`Elapsed: ${report.elapsedMs}ms. Screenshots captured, not visually inspected.`);
}
if (!report.checks.length || report.checks.some(check => check.status !== 'passed')) process.exitCode = 1;
