import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { puzzles } from 'cubing/puzzles';

// Start the real Next site first, then run:
// TWO_SOLVER_URL=http://127.0.0.1:3129/tools/solver/222/ node src/views/TwoSolver/twoSolver.i18n.browser.test.mjs
// Only persisted locale/history fixtures are seeded. No routes, responses, clocks,
// randomness, React setters, clipboard, solver results or native players are mocked.
const url = process.env.TWO_SOLVER_URL || 'http://127.0.0.1:3129/tools/solver/222/';
const artifacts = process.env.TWO_SOLVER_ARTIFACTS || join('/var/folders/p8/b3ryxj6s1bd4wgsspxzhfnw40000gn/T/opencode', `two-solver-i18n-${Date.now()}`);
const keys = { locale: 'cubing_pro_locale', search: 'cubing.pro.two-solver.settings.v1', ui: 'cubing.pro.two-solver.ui.v1', history: 'cubing.pro.two-solver.practice.v1' };
const example = "R U R' F2 U' R2 F U2 R'";
const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const rawKey = /\b(?:two\.(?:main|detail|engine)|lang|nav)\.[\w.+-]+/;
const started = Date.now();
const deadline = started + 180000;
const report = { url, artifacts, checks: [], pageErrors: [], consoleErrors: [], workers: [], datasets: [], screenshots: [] };
await mkdir(artifacts, { recursive: true });
let browser;
let page;
let kp;
const watchdog = setTimeout(async () => {
  report.checks.push({ name: '180-second runtime budget', status: 'failed', error: 'Incomplete coverage is failure' });
  report.elapsedMs = Date.now() - started;
  await writeFile(join(artifacts, 'report.json'), JSON.stringify(report, null, 2));
  process.exit(1);
}, 180000);

const fixtures = [
  '随机练习',
  '条件抽样：任意所选方法；做底深度 不限；总步数上限 不限；消步 ≥ 0；第 1/2 次命中',
  JSON.stringify({ kind: 'conditional', method: 'CLL', base: '5', moves: '20', cancelled: 1, attempt: 2, attempts: 3 }),
].map((sampling, i) => ({ id: `i18n-legacy-${i}`, scramble: example, sampling,
  elapsedMs: 10000 + i * 1234, inspectionMs: 1250, inspectionPenalty: 'none', penalty: 'none',
  date: `2026-10-${15 - i}T13:14:15.000Z` }));

function observe({ keys, records, origin }) {
  if (location.origin !== origin) return;
  if (localStorage.getItem(keys.locale) === null) localStorage.setItem(keys.locale, 'en-US');
  // Seed once so reload tests cannot silently reset either locale or saved scores.
  if (records && localStorage.getItem(keys.history) === null) localStorage.setItem(keys.history, JSON.stringify(records));
  const identities = new WeakMap();
  let sequence = 0;
  const identity = value => {
    if (!identities.has(value)) identities.set(value, ++sequence);
    return identities.get(value);
  };
  const state = { posts: [], statuses: [], busyStarts: 0, busy: false, trees: 0 };
  // Transparent observation: preserve the native constructor, receiver, arguments,
  // return value, transfer list and exception behavior; never synthesize messages.
  const postMessage = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function (...args) {
    const message = args[0];
    if (message?.baseUrl && ['solve', 'scramble', 'validate'].includes(message.type)) {
      state.posts.push({ type: message.type, id: message.id, scramble: message.scramble });
    }
    return Reflect.apply(postMessage, this, args);
  };
  const fiberOf = element => {
    const key = element && Object.keys(element).find(key => key.startsWith('__reactFiber$'));
    let fiber = key && element[key];
    let root = fiber;
    while (root?.return) root = root.return;
    if (root?.stateNode?.current !== root && fiber?.alternate) fiber = fiber.alternate;
    return fiber;
  };
  const read = () => {
    for (let fiber = fiberOf(document.querySelector('main[data-settings-open]')); fiber; fiber = fiber.return) {
      const snapshots = [];
      for (let hook = fiber.memoizedState; hook && typeof hook === 'object'; hook = hook.next) {
        const value = hook.memoizedState;
        if (value?.result?.solutions && value.options && typeof value.scramble === 'string') {
          snapshots.push({ identity: identity(value), resultIdentity: identity(value.result), id: value.id ?? null,
            scramble: value.scramble, options: value.options, sampling: value.sampling, result: value.result });
        }
      }
      if (snapshots.length) return { analysis: snapshots.find(value => !value.id) ?? null, question: snapshots.find(value => value.id) ?? null };
    }
    return { analysis: null, question: null };
  };
  const chart = () => {
    for (let fiber = fiberOf(document.querySelector('.echarts-for-react')); fiber; fiber = fiber.return) {
      if (typeof fiber.stateNode?.getEchartsInstance === 'function') return fiber.stateNode.getEchartsInstance();
    }
    return null;
  };
  const sample = () => {
    const busy = !!document.querySelector('main [class*=spinner]');
    if (busy && !state.busy) state.busyStarts++;
    state.busy = busy;
    state.trees = Math.max(state.trees, document.querySelectorAll('body > [data-solver-cube-tree]').length);
    // The initial SSR is deliberately Chinese. Audit English only after the
    // provider has committed html.lang=en, including transient worker progress.
    if (document.documentElement.lang === 'en') {
      for (const element of document.querySelectorAll('main [class*=statusRow] [role=status], main [role=alert], [data-solver-cube] [role=status]')) {
        const text = element.textContent.trim();
        if (text && !state.statuses.includes(text)) state.statuses.push(text);
      }
    }
  };
  window.__twoI18n = { state, read, chart, identity, sample };
  addEventListener('DOMContentLoaded', () => {
    new MutationObserver(sample).observe(document.body, { subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ['lang', 'data-settings-open'] });
    sample();
  });
}

const main = () => page.locator('main[data-settings-open]');
const cards = () => main().locator('article[data-method]');
const button = name => main().getByRole('button', { name, exact: typeof name === 'string' });
const timer = () => main().locator('[data-phase]');
const snapshot = () => page.evaluate(() => window.__twoI18n.read());
const stored = key => page.evaluate(key => localStorage.getItem(key), key);
const activity = () => page.evaluate(() => {
  window.__twoI18n.sample();
  const { posts, busyStarts } = window.__twoI18n.state;
  return { posts: [...posts], busyStarts };
});
async function poll(fn, label, timeout = 18000) {
  const until = Math.min(deadline - 2000, Date.now() + timeout);
  let last;
  while (Date.now() < until) {
    try { const value = await fn(); if (value) return value; } catch (error) { last = error; }
    await page.waitForTimeout(60);
  }
  throw new Error(`Timed out: ${label}${last ? `: ${last.message}` : ''}`);
}
async function check(name, fn, enabled = true) {
  if (!enabled || Date.now() > deadline - 5000) {
    report.checks.push({ name, status: 'blocked', error: 'Prerequisite failed or runtime exhausted; coverage not passed' });
    return false;
  }
  const at = Date.now();
  try {
    const evidence = await fn();
    report.checks.push({ name, status: 'passed', elapsedMs: Date.now() - at, evidence });
    console.log(`PASS ${name}`);
    return true;
  } catch (error) {
    report.checks.push({ name, status: 'failed', elapsedMs: Date.now() - at, error: error.stack || String(error) });
    console.error(`FAIL ${name}: ${error.message}`);
    const path = join(artifacts, `failure-${report.checks.length}.png`);
    await page?.screenshot({ path, timeout: 1500 }).then(() => report.screenshots.push(path)).catch(() => {});
    await page?.keyboard.up('Space').catch(() => {});
    await page?.keyboard.press('Escape').catch(() => {});
    return false;
  }
}
async function newContext(records) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US', timezoneId: 'UTC', colorScheme: 'light' });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(url).origin });
  await context.addInitScript(observe, { keys, records, origin: new URL(url).origin });
  context.on('page', p => {
    p.setDefaultTimeout(4000);
    p.setDefaultNavigationTimeout(20000);
    p.on('worker', worker => report.workers.push(worker.url()));
    p.on('pageerror', error => report.pageErrors.push(error.stack || error.message));
    p.on('console', message => {
      if (message.type() === 'error' || /hydrat|did not match|server rendered/i.test(message.text())) {
        report.consoleErrors.push({ type: message.type(), text: message.text(), location: message.location() });
      }
    });
  });
  context.on('response', response => {
    if (response.url().includes('/two-solver/data/')) report.datasets.push({ url: response.url(), status: response.status() });
  });
  page = await context.newPage();
  return context;
}
async function loaded() {
  assert.ok((await page.goto(url, { waitUntil: 'domcontentloaded' })).ok());
  await poll(async () => await page.locator('html').getAttribute('lang') === 'en'
    && await main().getByRole('tab', { name: 'Analysis', exact: true }).isEnabled(), 'English provider hydration');
  assert.equal(await stored(keys.locale), 'en-US');
}
async function settled(kind = 'analysis', previous) {
  return poll(async () => {
    const value = (await snapshot())[kind];
    return value && value.result.solutions.length > 0 && value.resultIdentity !== previous
      && !await main().locator('[class*=spinner]').count() ? value : null;
  }, `real ${kind} result committed`, 25000);
}
async function openSettings(name, tab) {
  await button(name).click();
  const dialog = page.getByRole('dialog', { name: name === 'Solution settings' ? 'Analysis settings' : name === '计时设置' ? '计时器设置' : name, exact: true });
  await dialog.waitFor();
  if (tab) await dialog.getByRole('tab', { name: tab, exact: true }).click();
  return dialog;
}
async function closeSettings(dialog, apply = false, chinese = false) {
  await dialog.getByRole('button', { name: apply ? chinese ? '应用' : 'Apply' : chinese ? '取消' : 'Cancel', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
}
async function headerLocale(locale) {
  const current = await page.locator('html').getAttribute('lang');
  assert.notEqual(current, locale === 'en-US' ? 'en' : 'zh-CN', 'toggle must change the actual provider');
  await page.locator('[data-app-header]').getByRole('button', { name: current === 'en' ? 'Language' : '语言', exact: true }).click();
  await poll(async () => await page.locator('html').getAttribute('lang') === (locale === 'en-US' ? 'en' : 'zh-CN'), 'header language commit');
  assert.equal(await stored(keys.locale), locale);
}
async function timerLocale(locale) {
  const chinese = await page.locator('html').getAttribute('lang') !== 'en';
  const dialog = await openSettings(chinese ? '计时设置' : 'Timer settings', chinese ? '显示' : 'Display');
  const select = dialog.getByRole('combobox', { name: chinese ? '语言' : 'Language', exact: true });
  assert.equal(await select.inputValue(), chinese ? 'zh-CN' : 'en-US');
  await select.selectOption(locale);
  // Language is a transaction draft until the real Apply button is pressed.
  assert.equal(await page.locator('html').getAttribute('lang'), chinese ? 'zh-CN' : 'en');
  await closeSettings(dialog, true, chinese);
  await poll(async () => await page.locator('html').getAttribute('lang') === (locale === 'en-US' ? 'en' : 'zh-CN'), 'Display language Apply');
  assert.equal(await stored(keys.locale), locale);
}
async function english(scope = main()) {
  const values = await scope.evaluate(element => {
    const app = window.__twoI18n.read();
    const sources = [...new Set([app.analysis, app.question].filter(Boolean).flatMap(value => value.result.solutions.flatMap(s => [s.caseName, s.group])).filter(Boolean))];
    const visible = node => {
      if (!node.getClientRects().length) return false;
      for (let parent = node; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (style.display === 'none' || style.visibility !== 'visible' || style.opacity === '0') return false;
      }
      return true;
    };
    const result = [];
    const add = (node, type, text) => {
      if (!text?.trim()) return;
      // Only catalog case/group source fields may retain source-language names.
      // In particular PBL explanatory UI and all stage labels are still audited.
      const sourceField = node.closest('[class*=caseName],[class*=copyStatus],[class*=playerPanel] [id],select')
        && (type !== 'text' || !node.closest('select') || node.tagName === 'OPTION');
      let checked = text;
      if (sourceField) for (const source of sources.sort((a, b) => b.length - a.length)) checked = checked.replaceAll(source, '');
      // Native language names are proper names in the language picker only.
      if (node.matches('option[value="zh-CN"]') && text === '简体中文') checked = '';
      result.push({ type, text, checked, element: node.tagName });
    };
    for (const node of [element, ...element.querySelectorAll('*')]) {
      if (!visible(node)) continue;
      for (const attr of ['aria-label', 'title', 'placeholder', 'alt']) add(node, attr, node.getAttribute(attr));
      for (const attr of ['aria-labelledby', 'aria-describedby']) {
        const ids = node.getAttribute(attr)?.split(/\s+/) ?? [];
        add(node, attr, ids.map(id => document.getElementById(id)?.textContent ?? '').join(' '));
      }
      for (const child of node.childNodes) if (child.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.selectNode(child);
        if (range.getClientRects().length) add(node, 'text', child.textContent);
      }
      if (node.tagName === 'SELECT') for (const option of node.options) add(option, 'option', option.textContent);
    }
    return result;
  });
  assert.ok(values.length > 0, 'locale audit must inspect a rendered scope');
  const leaked = values.filter(value => cjk.test(value.checked) || rawKey.test(value.text) || /\{(?:count|color|method|time|date|moves|family|size)\}/.test(value.text));
  assert.deepEqual(leaked, [], `English visible/accessibility/option strings: ${JSON.stringify(leaked)}`);
  return values.length;
}
async function unchanged(before, kind) {
  // Exceed the analysis debounce, so an accidental locale effect is observable.
  await page.waitForTimeout(650);
  const current = (await snapshot())[kind];
  assert.deepEqual(current, before.snapshot, 'locale preserves exact snapshot and result identities/data');
  assert.deepEqual(await activity(), before.activity, 'locale sends no solve/scramble/validate requests and starts no work');
  assert.equal(await stored(keys.search), before.search, 'search options are byte-for-byte unchanged');
  assert.equal(await stored(keys.history), before.history, 'history is byte-for-byte unchanged');
  if (before.ui !== undefined) assert.equal(await stored(keys.ui), before.ui, 'language-only Apply does not mutate solver UI settings');
  if (before.phase !== undefined) {
    assert.equal(await timer().getAttribute('data-phase'), before.phase);
    assert.equal(await timer().locator('[class*=timerDigits]').textContent(), before.clock, 'stopped clock is preserved');
  }
}
async function sourceNames(value) {
  const expected = value.result.solutions.slice(0, 20);
  const actual = await cards().locator('[class*=caseName]').evaluateAll(nodes => nodes.map(node => ({ text: node.textContent,
    title: node.title })));
  assert.deepEqual(actual, expected.map(solution => ({ text: solution.caseName,
    title: [solution.group, solution.caseName].filter(Boolean).join(' · ') })), 'locale preserves exact source case/group names');
}
async function baseline(kind) {
  return { snapshot: (await snapshot())[kind], activity: await activity(), search: await stored(keys.search),
    history: await stored(keys.history), ui: await stored(keys.ui), ...(kind === 'question' ? {
      phase: await timer().getAttribute('data-phase'), clock: await timer().locator('[class*=timerDigits]').textContent(),
    } : {}) };
}
async function overflow(dialog) {
  const value = await page.evaluate(() => {
    const main = document.querySelector('main[data-settings-open]');
    return { width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth,
      main: main.scrollWidth, client: main.clientWidth };
  });
  assert.ok(value.document <= value.width + 1 && value.body <= value.width + 1 && value.main <= value.client + 1, JSON.stringify(value));
  if (dialog) {
    const geometry = await dialog.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const clipped = [...element.querySelectorAll('button,label,small,legend,select')].filter(node => {
        const style = getComputedStyle(node);
        return node.getClientRects().length && style.display !== 'inline' && node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 2;
      }).map(node => ({ text: node.textContent, client: node.clientWidth, scroll: node.scrollWidth }));
      return { left: rect.left, right: rect.right, height: rect.height, viewport: innerHeight, clipped };
    });
    assert.ok(geometry.left >= -1 && geometry.right <= value.width + 1 && geometry.height <= geometry.viewport + 1, JSON.stringify(geometry));
    assert.deepEqual(geometry.clipped, [], 'long English labels/options must fit their controls');
  }
  return value;
}
async function native(label) {
  const host = page.locator(`[data-solver-cube="${label}"]`);
  await poll(async () => await host.getAttribute('aria-busy') === 'false' && !!await host.getAttribute('aria-owns'), `${label} native host ready`, 12000);
  return page.evaluate(async label => {
    const host = document.querySelector(`[data-solver-cube="${label}"]`);
    const root = document.getElementById(host.getAttribute('aria-owns'));
    const player = root?.querySelector('twisty-player');
    if (!player) throw new Error('Missing connected real TwistyPlayer');
    const [vantage] = await player.experimentalCurrentVantages();
    const { canvas, context } = await vantage.canvasInfo();
    const gl = context ? null : canvas.getContext('webgl2') || canvas.getContext('webgl');
    const object = await player.experimentalCurrentThreeJSPuzzleObject();
    let meshes = 0;
    object.traverse(node => { if (node.isMesh) meshes++; });
    return { rootIdentity: window.__twoI18n.identity(root), playerIdentity: window.__twoI18n.identity(player),
      label: root.getAttribute('aria-label'), dataset: root.dataset.solverCubePlayer,
      setup: (await player.experimentalModel.setupAlg.get()).alg.toString(), alg: (await player.experimentalModel.alg.get()).alg.toString(),
      trees: document.querySelectorAll('body > [data-solver-cube-tree]').length, meshes,
      healthy: !!context || !!gl && !gl.isContextLost(), width: canvas.width, height: canvas.height };
  }, label);
}
function replay(setup, alg) {
  assert.ok(kp.defaultPattern().applyAlg(setup).applyAlg(alg).experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }), `Independent cube replay: ${setup} / ${alg}`);
}
async function chart() {
  return poll(() => page.evaluate(() => {
    const instance = window.__twoI18n.chart();
    if (!instance || instance.isDisposed()) return null;
    const option = instance.getOption();
    const canvas = instance.getDom().querySelector('canvas');
    return { identity: window.__twoI18n.identity(instance), series: option.series.map(({ name, data }) => ({ name, data })),
      x: option.xAxis[0].name, y: option.yAxis[0].name, tooltip: option.tooltip[0].renderMode,
      pixels: !!canvas && canvas.width > 0 && canvas.height > 0 && canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((v, i) => i % 4 === 3 && v > 0) };
  }), 'real ECharts rendered canvas');
}
async function historyDates(records, chinese = false) {
  const locale = chinese ? 'zh-CN' : 'en-US';
  const expected = await page.evaluate(({ records, locale }) => records.map(record => ({
    row: new Date(record.date).toLocaleString(locale),
    option: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(record.date)),
  })), { records, locale });
  const summaries = await main().locator('#two-practice-history details > summary').allTextContents();
  const options = await main().getByRole('combobox', { name: chinese ? '选择成绩复盘' : 'Select a result to review', exact: true }).locator('option').allTextContents();
  assert.equal(summaries.length, records.length);
  assert.equal(options.length, records.length);
  for (let i = 0; i < records.length; i++) {
    assert.ok(summaries[i].includes(expected[i].row), `${locale} history date: ${summaries[i]}`);
    assert.ok(options[i].includes(expected[i].option), `${locale} chart selection date: ${options[i]}`);
  }
}
async function tooltip(record, chinese = false) {
  const region = main().getByRole('region', { name: chinese ? '成绩曲线' : 'Results chart', exact: true });
  await region.locator('.echarts-for-react').scrollIntoViewIfNeeded();
  const point = await page.evaluate(id => {
    const chart = window.__twoI18n.chart();
    const series = chart.getOption().series[0];
    const index = series.data.findIndex(point => point.recordId === id);
    if (index < 0 || series.data[index].value === null) throw new Error('Real history point missing');
    const [x, y] = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [index, series.data[index].value]);
    const r = chart.getDom().getBoundingClientRect();
    return { x: r.left + x, y: r.top + y };
  }, record.id);
  await page.mouse.move(1, 1);
  await page.mouse.move(point.x, point.y);
  // Read rendered rich-text displayables following a real mouse hover, never
  // call formatter(), dispatchAction(), or an application chart event handler.
  const text = await poll(() => page.evaluate(() => {
    const zr = window.__twoI18n.chart().getZr();
    const text = [];
    const walk = element => {
      if (element.ignore || element.invisible) return;
      if (typeof element.style?.text === 'string') text.push(element.style.text);
      element.childrenRef?.().forEach(walk);
    };
    zr.storage.getRoots().forEach(walk);
    return text.find(value => /(?:Raw time:|原始用时：)/.test(value)) || null;
  }), 'native tooltip rendered after mouse hover', 4000);
  const locale = chinese ? 'zh-CN' : 'en-US';
  const date = await page.evaluate(({ date, locale }) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(date)), { date: record.date, locale });
  assert.ok(text.includes(date), `tooltip uses explicit ${locale} date ${date}: ${text}`);
  for (const label of chinese ? ['原始用时：', '日期：', '打乱：', '点击成绩点复盘'] : ['Raw time:', 'Date:', 'Scramble:', 'Click a result to review']) assert.ok(text.includes(label), `${label}: ${text}`);
  if (!chinese) assert.equal(cjk.test(text), false, text);
  assert.equal(rawKey.test(text), false, text);
  assert.ok(text.includes(record.scramble));
  assert.ok(!text.includes(record.sampling), 'sampling source text is not part of the tooltip schema');
  return text;
}

try {
  browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  kp = await puzzles['2x2x2'].kpuzzle();
  const analysisContext = await newContext();
  const ready = await check('Real Next SSR defaults Chinese; stored English hydrates without mismatch; 20 actual automatic results', async () => {
    const response = await analysisContext.request.get(url, { timeout: 20000 });
    assert.ok(response.ok(), `actual Next server returned ${response.status()}`);
    const html = await response.text();
    assert.match(html, /<html[^>]*lang="zh-CN"/);
    assert.ok(html.includes('二阶'), 'actual SSR uses provider default Chinese');
    await loaded();
    const value = await settled();
    assert.equal(value.scramble, example);
    assert.equal(value.options.maxSolutions, 20);
    assert.equal(value.result.solutions.length, 20, 'real retained engine result count');
    assert.equal(await cards().count(), 20);
    await sourceNames(value);
    for (const algorithm of await cards().locator('[data-full-solution]').allTextContents()) replay(example, algorithm);
    assert.equal(await main().getByRole('heading', { level: 1 }).textContent(), '2×2');
    await english();
    await english(page.locator('[data-app-header]'));
    assert.deepEqual(await main().getByRole('alert').allTextContents(), []);
    return { solutions: 20, posts: (await activity()).posts };
  });

  await check('Every analysis tab, method hint, color, field, dropdown and draft error is English', async () => {
    const before = await baseline('analysis');
    const dialog = await openSettings('Analysis settings');
    assert.deepEqual(await dialog.getByRole('tab').allTextContents(), ['Search', 'Filters']);
    assert.equal(await dialog.locator('label[title]').count(), 21);
    for (const name of ['White', 'Red', 'Green', 'Yellow', 'Orange', 'Blue']) assert.equal(await dialog.getByRole('checkbox', { name, exact: true }).count(), 1);
    for (const name of ['EG', 'TCLL', 'LS', 'EGLS', 'FH', 'CBL', 'TEG']) assert.equal(await dialog.getByRole('combobox', { name: `${name} base depth limit`, exact: true }).count(), 1);
    await english(dialog);
    await dialog.getByRole('button', { name: 'Clear', exact: true }).click();
    assert.match(await dialog.getByRole('alert').textContent(), /Select at least one method and one color/);
    assert.equal(await dialog.getByRole('button', { name: 'Apply', exact: true }).isDisabled(), true);
    await english(dialog);
    await dialog.getByRole('button', { name: 'Common EG', exact: true }).click();
    await dialog.getByRole('tab', { name: 'Filters', exact: true }).click();
    for (const name of ['Method', 'Color', 'Group', 'Sort']) assert.equal(await dialog.getByRole('combobox', { name, exact: true }).count(), 1);
    assert.equal(await dialog.getByRole('searchbox', { name: 'Find case or algorithm', exact: true }).count(), 1);
    await english(dialog);
    await closeSettings(dialog);
    await unchanged(before, 'analysis');
    return { methods: 21, tabs: ['Search', 'Filters'], preservedResult: before.snapshot.resultIdentity };
  }, ready);

  await check('Header switches both languages through site UI without worker requests or changing result/settings', async () => {
    const before = await baseline('analysis');
    const preview = await native('3D scramble state');
    await headerLocale('zh-CN');
    assert.equal(await main().getByRole('heading', { level: 1 }).textContent(), '二阶');
    assert.equal(await button('分析配置').count(), 1);
    const chinese = await native('打乱状态 3D');
    assert.equal(chinese.rootIdentity, preview.rootIdentity);
    assert.equal(chinese.playerIdentity, preview.playerIdentity);
    assert.equal(chinese.label, '打乱状态 3D');
    assert.equal(chinese.trees, preview.trees);
    await sourceNames(before.snapshot);
    await unchanged(before, 'analysis');
    await sourceNames(before.snapshot);
    await headerLocale('en-US');
    await unchanged(before, 'analysis');
    assert.equal((await native('3D scramble state')).playerIdentity, preview.playerIdentity);
    await english();
    return { resultIdentity: before.snapshot.resultIdentity, preview, chinese };
  }, ready);

  await check('English parser errors remain current and retranslate via header, including Chinese wire errors', async () => {
    for (const [input, englishError, chineseError] of [
      ['R'.repeat(4001), 'Sequence too long (maximum 4000 characters)', '序列过长'],
      ['M', 'Unsupported 2x2 move: M', '二阶不支持动作 M'],
    ]) {
      await main().getByRole('textbox', { name: 'Scramble', exact: true }).fill(input);
      await poll(async () => (await main().getByRole('alert').textContent()).includes(englishError), englishError);
      await english();
      const before = await activity();
      await headerLocale('zh-CN');
      await poll(async () => (await main().getByRole('alert').textContent()).includes(chineseError), 'current error translated Chinese');
      await headerLocale('en-US');
      assert.ok((await main().getByRole('alert').textContent()).includes(englishError));
      await page.waitForTimeout(650);
      assert.deepEqual(await activity(), before, 'retranslating a current error does not retry the task');
    }
    await main().getByRole('textbox', { name: 'Scramble', exact: true }).fill(example);
    await settled();
    assert.deepEqual(await main().getByRole('alert').allTextContents(), []);
  }, ready);

  await check('Actual clipboard full/annotated actions contain English stages and independently solve the cube', async () => {
    const value = await settled();
    const index = value.result.solutions.findIndex(s => s.orientation && s.base && s.preAuf && s.postAuf);
    assert.ok(index >= 0, 'real engine must provide orientation/base/both AUF stages for clipboard coverage');
    const card = cards().nth(index);
    await card.locator('details > summary').click();
    await main().locator('[class*=resultNotice] > summary').click();
    await english();
    const evidence = {};
    for (const [label, selector] of [['Copy full solution', '[data-full-solution]'], ['Copy annotated stages', 'details code']]) {
      const expected = await card.locator(selector).textContent();
      await page.evaluate(() => navigator.clipboard.writeText('i18n-copy-sentinel'));
      await card.getByRole('button', { name: label, exact: true }).click();
      const copied = await poll(() => page.evaluate(expected => navigator.clipboard.readText().then(text => text === expected ? text : null), expected), 'real clipboard write');
      assert.equal(cjk.test(copied), false, copied);
      assert.equal(rawKey.test(copied), false, copied);
      replay(value.scramble, copied);
      if (label === 'Copy annotated stages') {
        for (const stage of ['Orientation', 'Base', 'AUF', value.result.solutions[index].method]) assert.ok(copied.includes(`//${stage} `), `clipboard ${stage} comment`);
        assert.equal((copied.match(/\/\/AUF /g) || []).length, 2, 'both AUF stage annotations remain present');
        assert.ok(copied.includes('Original stages') && copied.includes('Before cancellation') && copied.includes('Full solution after cancellation'));
        assert.deepEqual(await card.locator('dt').evaluateAll(nodes => nodes.map(node => node.title)), ['Orientation', 'Base', 'Pre-AUF', 'Algorithm', 'Post-AUF']);
      }
      evidence[label] = copied;
    }
    await english();
    return evidence;
  }, ready);

  await check('320/390 English analysis dialogs and native 3D labels fit; stage actions use real player', async () => {
    const value = await settled();
    const evidence = [];
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const tab of ['Search', 'Filters']) {
        const dialog = await openSettings('Analysis settings', tab);
        await english(dialog);
        await overflow(dialog);
        await closeSettings(dialog);
      }
      await cards().first().getByRole('button', { name: '3D analysis', exact: true }).click();
      const modal = page.getByRole('dialog', { name: /3D analysis/ });
      await modal.waitFor();
      await poll(() => modal.evaluate(element => {
        const style = getComputedStyle(element);
        return element.getClientRects().length > 0 && style.opacity === '1' && style.visibility === 'visible';
      }), 'modal entrance animation settled before locale audit');
      await english(modal);
      const full = await native('Solution 3D analysis');
      assert.equal(full.label, 'Solution 3D analysis');
      assert.ok(full.healthy && full.width > 0 && full.height > 0 && full.meshes > 0);
      assert.ok(full.trees <= 2);
      replay(full.setup, full.alg);
      await modal.getByRole('button', { name: 'Base complete', exact: true }).click();
      const prefix = [value.scramble, value.result.solutions[0].orientation, value.result.solutions[0].base].filter(Boolean).join(' ');
      await poll(async () => await modal.locator('[data-solver-cube]').getAttribute('data-setup') === prefix, 'base stage');
      assert.equal((await native('Solution 3D analysis')).alg, '');
      await modal.getByRole('button', { name: 'Full solution', exact: true }).click();
      await poll(async () => await modal.locator('[data-solver-cube]').getAttribute('data-setup') === value.scramble, 'full stage restored');
      await overflow(modal);
      evidence.push({ width, full });
      await modal.getByRole('button', { name: 'Close 3D analysis', exact: true }).click();
      await modal.waitFor({ state: 'hidden' });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    return evidence;
  }, ready);

  await check('Heavy all-method real loading/search captures English transient progress, never raw Chinese/key strings', async () => {
    const old = (await settled()).resultIdentity;
    const dialog = await openSettings('Analysis settings');
    await dialog.getByRole('button', { name: 'Select all', exact: true }).click();
    for (const family of ['EG', 'TCLL', 'LS', 'EGLS', 'FH', 'CBL', 'TEG']) await dialog.getByRole('combobox', { name: `${family} base depth limit`, exact: true }).selectOption('0');
    const before = (await activity()).posts.length;
    const statusOffset = await page.evaluate(() => window.__twoI18n.state.statuses.length);
    await closeSettings(dialog, true);
    await poll(async () => (await activity()).posts.length > before && await main().locator('[class*=spinner]').count() > 0, 'real heavy task in flight', 6000);
    await headerLocale('zh-CN');
    const currentStatus = main().locator('[class*=statusRow] [role=status]');
    assert.match(await currentStatus.textContent(), /正在搜索所选方法与底色/);
    assert.equal(rawKey.test(await currentStatus.textContent()), false);
    await headerLocale('en-US');
    assert.match(await currentStatus.textContent(), /Searching selected methods and colors|Analysis complete/);
    await poll(async () => (await activity()).posts.length > before && !await main().locator('[class*=spinner]').count(), 'all-method actual task finishes', 30000);
    const statuses = await page.evaluate(() => window.__twoI18n.state.statuses);
    assert.ok(statuses.slice(statusOffset).some(text => /Loading .+ algorithms|Building the .+ full-state index/.test(text)), `fresh heavy source loading/indexing observed: ${JSON.stringify(statuses.slice(statusOffset))}`);
    assert.ok(statuses.some(text => /Searching selected methods|Base depth/.test(text)), 'actual in-flight search captured');
    for (const text of statuses) { assert.equal(cjk.test(text), false, text); assert.equal(rawKey.test(text), false, text); }
    assert.deepEqual(await main().getByRole('alert').allTextContents(), []);
    const value = (await snapshot()).analysis;
    if (value) assert.notEqual(value.resultIdentity, old);
    assert.equal(JSON.parse(await stored(keys.search)).methods.length, 21);
    assert.equal((await activity()).posts.length - before, 1, 'in-flight locale changes do not cancel/restart/search again');
    return { capturedStatuses: statuses, datasets: report.datasets.length };
  }, ready);
  await analysisContext.close();

  const practiceContext = await newContext(fixtures);
  const practiceReady = await check('Separate real fullscreen practice context loads legacy history and generates a real question', async () => {
    await loaded();
    await settled();
    assert.deepEqual(JSON.parse(await stored(keys.history)), fixtures);
    await main().getByRole('tab', { name: 'Practice', exact: true }).click();
    const question = await settled('question');
    assert.match(question.scramble, /^[RUF](?:2|')?(?: [RUF](?:2|')?)*$/);
    assert.equal(await page.locator('body').getAttribute('data-two-practice-active'), 'true');
    assert.equal(await page.locator('[data-app-header]').getAttribute('aria-hidden'), 'true');
    assert.equal(await cards().count(), 0);
    const dialog = await openSettings('Timer settings', 'Timer');
    assert.deepEqual(await dialog.getByRole('tab').allTextContents(), ['Timer', 'Display']);
    await english(dialog);
    await dialog.getByRole('checkbox', { name: 'Enable 15-second inspection', exact: true }).uncheck();
    await closeSettings(dialog, true);
    await button(/^History 3$/).click();
    for (const row of await main().locator('#two-practice-history details').all()) await row.locator('summary').click();
    const history = await main().locator('#two-practice-history').innerText();
    assert.ok(history.includes('Random practice'));
    assert.ok(history.includes('Conditional sampling: Any selected method; base depth Any; move limit Any; cancellation ≥ 0; matched on attempt 1/2'));
    assert.ok(history.includes('Conditional sampling: CLL; base depth 5; move limit 20; cancellation ≥ 1; matched on attempt 2/3'));
    assert.ok(!history.includes('"kind"'));
    await historyDates(fixtures);
    await english();
    const plot = await chart();
    assert.equal(plot.series[0].name, 'Single');
    assert.equal(plot.x, 'Attempt');
    assert.equal(plot.y, 'Seconds');
    assert.equal(plot.tooltip, 'richText');
    assert.ok(plot.pixels);
    await tooltip(fixtures[0]);
    return { question: question.id, legacySampling: history, chart: plot };
  });

  await check('Actual keyboard timing stops once; language Apply preserves stopped clock, question, result, search and records', async () => {
    const question = (await snapshot()).question;
    await button('Next').focus();
    await page.keyboard.down('Space');
    await poll(async () => await timer().getAttribute('data-armed') === 'true', 'real hold arms timer', 2000);
    await page.keyboard.up('Space');
    await poll(async () => await timer().getAttribute('data-phase') === 'running', 'keyboard starts real timer');
    await page.waitForTimeout(180);
    await page.keyboard.press('Space');
    await poll(async () => await timer().getAttribute('data-phase') === 'stopped' && JSON.parse(await stored(keys.history)).length === 4, 'one real saved score');
    assert.equal((await snapshot()).question.id, question.id);
    const rows = JSON.parse(await stored(keys.history));
    assert.equal(rows[0].id, question.id);
    assert.ok(rows[0].elapsedMs >= 100);
    assert.deepEqual(rows[0].searchOptions, question.options);
    await poll(async () => await cards().count() === 20, 'stopped question solutions revealed');
    await sourceNames(question);
    const before = await baseline('question');
    const preview = await native('3D scramble state');
    const plot = await chart();
    await timerLocale('zh-CN');
    await unchanged(before, 'question');
    await sourceNames(question);
    const chinesePreview = await native('打乱状态 3D');
    assert.equal(chinesePreview.playerIdentity, preview.playerIdentity);
    assert.equal(chinesePreview.rootIdentity, preview.rootIdentity);
    assert.equal(chinesePreview.trees, preview.trees);
    const chineseChart = await chart();
    assert.equal(chineseChart.identity, plot.identity);
    assert.equal(chineseChart.series[0].name, '单次');
    assert.equal(chineseChart.x, '次');
    assert.equal(chineseChart.y, '秒');
    const history = main().locator('#two-practice-history');
    assert.match(await history.innerText(), /随机练习/);
    assert.match(await history.innerText(), /条件抽样：/);
    assert.match(await main().getByRole('region', { name: '成绩曲线', exact: true }).innerText(), /统计基于全部已保存成绩/);
    await historyDates(rows, true);
    await tooltip(fixtures[0], true);
    await cards().first().getByRole('button', { name: '3D 解析', exact: true }).click();
    const modal = page.getByRole('dialog', { name: /3D 解析/ });
    await modal.waitFor();
    const player = await native('解法 3D 解析');
    assert.equal(player.label, '解法 3D 解析');
    assert.ok(player.healthy && player.meshes > 0 && player.trees <= 2);
    replay(player.setup, player.alg);
    assert.equal(await modal.getByRole('button', { name: '做底完成', exact: true }).count(), 1);
    await modal.getByRole('button', { name: '关闭 3D 解析', exact: true }).click();
    await modal.waitFor({ state: 'hidden' });
    await timerLocale('en-US');
    await unchanged(before, 'question');
    await sourceNames(question);
    assert.equal((await native('3D scramble state')).playerIdentity, preview.playerIdentity);
    const englishChart = await chart();
    assert.equal(englishChart.identity, plot.identity);
    assert.deepEqual(englishChart.series, plot.series);
    await tooltip(fixtures[0]);
    await historyDates(rows);
    await english();
    return { id: question.id, clock: before.clock, saved: rows.length, chartIdentity: plot.identity, native: player };
  }, practiceReady);

  await check('All fullscreen settings tabs in English fit 320/390, including long labels and Language draft cancellation', async () => {
    const before = await baseline('question');
    const evidence = [];
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const [name, tabs] of [['Solution settings', ['Search', 'Filters']], ['Practice settings', ['Practice']], ['Timer settings', ['Timer', 'Display']]]) {
        for (const tab of tabs) {
          const dialog = await openSettings(name, tab);
          await english(dialog);
          await overflow(dialog);
          if (tab === 'Display') {
            const language = dialog.getByRole('combobox', { name: 'Language', exact: true });
            assert.deepEqual(await language.locator('option').evaluateAll(options => options.map(o => ({ value: o.value, text: o.textContent }))), [{ value: 'zh-CN', text: '简体中文' }, { value: 'en-US', text: 'English' }]);
            await language.selectOption('zh-CN');
          }
          await closeSettings(dialog);
          assert.equal(await page.locator('html').getAttribute('lang'), 'en', 'Cancel discards language draft');
          assert.equal(await stored(keys.locale), 'en-US');
        }
      }
      evidence.push({ width, overflow: await overflow() });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await unchanged(before, 'question');
    return evidence;
  }, practiceReady);

  await check('Historical review dates and source-case names localize; switching language preserves current review/question', async () => {
    const before = await baseline('question');
    const stats = main().getByRole('region', { name: 'Results chart', exact: true });
    await stats.getByRole('combobox', { name: 'Select a result to review', exact: true }).selectOption(fixtures[1].id);
    await stats.getByRole('button', { name: 'Review', exact: true }).click();
    await poll(async () => (await snapshot()).analysis?.scramble === example && !await main().locator('[class*=spinner]').count(), 'actual legacy review solve');
    const review = await baseline('analysis');
    assert.match(await main().locator('[class*=reviewBanner]').innerText(), /History review.*Current search settings/);
    await english();
    await timerLocale('zh-CN');
    await unchanged(review, 'analysis');
    assert.match(await main().locator('[class*=reviewBanner]').innerText(), /历史复盘.*按当前搜索设置/);
    await timerLocale('en-US');
    await unchanged(review, 'analysis');
    assert.deepEqual((await snapshot()).question, before.snapshot);
    await english();
    await button('Return to current practice').click();
    assert.deepEqual((await snapshot()).question, before.snapshot);
    assert.equal(await stored(keys.history), before.history);
  }, practiceReady);

  await check('English locale persists across reload without init-script reset; retained history and localized UI survive', async () => {
    const history = await stored(keys.history);
    const search = await stored(keys.search);
    assert.equal(await stored(keys.locale), 'en-US');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await poll(async () => await page.locator('html').getAttribute('lang') === 'en', 'reload stored English');
    await settled();
    assert.equal(await stored(keys.locale), 'en-US');
    assert.equal(await stored(keys.history), history);
    assert.equal(await stored(keys.search), search);
    await english();
    await main().getByRole('tab', { name: 'Practice', exact: true }).click();
    await settled('question');
    await english();
    return { locale: await stored(keys.locale), records: JSON.parse(history).length };
  }, practiceReady);

  await check('No hydration/browser errors, no raw-key/CJK English transient messages, real workers/data/native trees observed', async () => {
    const state = await page.evaluate(() => ({ statuses: window.__twoI18n.state.statuses, maxTrees: window.__twoI18n.state.trees }));
    for (const text of state.statuses) { assert.equal(cjk.test(text), false, text); assert.equal(rawKey.test(text), false, text); }
    assert.ok(state.statuses.some(text => /Preparing practice|Practice ready/.test(text)));
    assert.ok(state.maxTrees > 0 && state.maxTrees <= 2);
    assert.deepEqual(report.pageErrors, []);
    assert.deepEqual(report.consoleErrors, []);
    assert.deepEqual(await main().getByRole('alert').allTextContents(), []);
    assert.ok(report.workers.some(worker => new URL(worker).origin === new URL(url).origin));
    assert.ok(report.datasets.length > 0 && report.datasets.every(response => response.status === 200));
    return { workers: report.workers.length, datasets: report.datasets.length, ...state };
  }, practiceReady);
  await practiceContext.close();
} catch (error) {
  report.checks.push({ name: 'Browser harness completed', status: 'failed', error: error.stack || String(error) });
  console.error(error);
} finally {
  report.elapsedMs = Date.now() - started;
  await writeFile(join(artifacts, 'report.json'), JSON.stringify(report, null, 2));
  await browser?.close();
  clearTimeout(watchdog);
  console.log(`Browser report: ${join(artifacts, 'report.json')}`);
  console.log(`Elapsed: ${report.elapsedMs}ms. Screenshots are failure artifacts, not visual-inspection claims.`);
}
if (!report.checks.length || report.checks.some(check => check.status !== 'passed')) process.exitCode = 1;
