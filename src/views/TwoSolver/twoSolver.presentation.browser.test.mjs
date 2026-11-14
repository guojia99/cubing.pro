import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { puzzles } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';

// TWO_SOLVER_URL=http://127.0.0.1:3129/tools/solver/222/ node src/views/TwoSolver/twoSolver.presentation.browser.test.mjs
// Uses the real dev server, Worker, datasets, clipboard and Node cubing model.
const url = process.env.TWO_SOLVER_URL || 'http://127.0.0.1:3129/tools/solver/222/';
const artifacts = process.env.TWO_SOLVER_ARTIFACTS || join('/var/folders/p8/b3ryxj6s1bd4wgsspxzhfnw40000gn/T/opencode', `two-solver-presentation-${Date.now()}`);
const families = {
  EG: ['CLL', 'EG1', 'EG2', 'LEG1'], TCLL: ['TCLL+', 'TCLL-'],
  LS: ['LS1', 'LS2', 'LS3', 'LS4', 'LS5', 'LS6', 'LS7', 'LS8', 'LS9'],
  EGLS: ['EGLS1', 'EGLS2'], FH: ['FH'], CBL: ['CBL'], TEG: ['TEG1', 'TEG2'],
};
const methods = Object.values(families).flat();
const defaults = { EG: 5, TCLL: 4, LS: 4, EGLS: 3, FH: 3, CBL: 2, TEG: 3 };
const changedDepths = { ...defaults, EG: 3, CBL: 1 };
const settingsKey = 'cubing.pro.two-solver.settings.v1';
let example = "R U R' F2 U' R2 F U2 R'";
const warnings = [
  '顺手度仅供排序参考，实际执行感受取决于握姿与指法；步数不含前置朝向调整。',
  '采用 two-tool 三连参考权重；不代表个人实测速度。',
];
const stageIds = ['orientation', 'base', 'preAuf', 'algorithm', 'postAuf'];
const report = { url, artifacts, checks: [], workers: [], datasets: [], pageErrors: [], consoleErrors: [] };
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(url).origin });
const page = await context.newPage();
page.setDefaultTimeout(8000);
page.on('worker', worker => report.workers.push(worker.url()));
page.on('pageerror', error => report.pageErrors.push(error.stack || error.message));
page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
context.on('response', response => {
  if (response.url().includes('/two-solver/data/')) report.datasets.push({ url: response.url(), status: response.status() });
});
// Isolate only unrelated account traffic; never replace any solver or cubing API.
await context.route(/\/v3\/cube-api(?:\/|$)/, route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"code":401,"data":null}' }));
const main = page.locator('main').last();
const results = page.locator('section[aria-label="解法列表"]');
const cards = results.locator('article');
const methodGroup = page.getByRole('group').filter({ has: page.locator('legend').filter({ hasText: /^方法/ }) });
const depth = family => page.getByRole('combobox', { name: `${family} 做底上限`, exact: true });
const overlap = page.getByRole('combobox', { name: '消步最大重叠数', exact: true });
let ready = false;
let allReady = false;
let kp;

async function check(name, run, enabled = ready) {
  if (!enabled) { report.checks.push({ name, status: 'blocked', reason: 'Required browser state unavailable' }); return; }
  try {
    const evidence = await run();
    report.checks.push({ name, status: 'passed', evidence });
    console.log(`PASS ${name}`, evidence ?? '');
  } catch (error) {
    report.checks.push({ name, status: 'failed', error: error.stack || String(error) });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

async function settled(expectedMethods, depths, maxOverlap) {
  // A captured result must reflect the changed options, not a previous idle UI.
  await page.waitForFunction(({ expectedMethods, depths, maxOverlap, example }) => {
    const panel = document.querySelector('section[aria-label="解法列表"]');
    if (!panel || document.querySelector('[role="progressbar"][aria-label="求解任务进行中"]')) return false;
    const summary = panel.querySelector(':scope > p');
    const selected = summary?.textContent.split(' · ')[1]?.split('、');
    const text = panel.textContent;
    return summary?.querySelector('code')?.textContent === example
      && selected?.length === expectedMethods.length && expectedMethods.every(method => selected.includes(method))
      && text.includes(`最多重叠 ${maxOverlap} 个动作`)
      && Object.entries(depths).filter(([family]) => expectedMethods.some(method => ({
        EG: ['CLL', 'EG1', 'EG2', 'LEG1'], TCLL: ['TCLL+', 'TCLL-'],
        LS: ['LS1', 'LS2', 'LS3', 'LS4', 'LS5', 'LS6', 'LS7', 'LS8', 'LS9'],
        EGLS: ['EGLS1', 'EGLS2'], FH: ['FH'], CBL: ['CBL'], TEG: ['TEG1', 'TEG2'],
      })[family].includes(method))).every(([family, value]) => text.includes(`${family} ${value}`));
  }, { expectedMethods, depths, maxOverlap, example }, { timeout: 30000 });
  assert.equal(await page.getByRole('button', { name: '取消', exact: true }).count(), 0);
  assert.deepEqual(await main.getByRole('alert').allTextContents(), []);
  while (await results.getByRole('button', { name: /显示更多解法/ }).count()) {
    await results.getByRole('button', { name: /显示更多解法/ }).click();
  }
  assert.ok(await cards.count() > 0, 'Real search must return cards');
}

async function snapshot() {
  return cards.evaluateAll(elements => elements.map(card => {
    // Read committed React props only. This observes the actual Worker result
    // without wrapping Worker/postMessage or importing the implementation oracle.
    const fiberKey = Object.keys(card).find(key => key.startsWith('__reactFiber$'));
    let fiber = card[fiberKey];
    const id = fiber?.key;
    let solution;
    while (fiber && !solution) {
      solution = fiber.memoizedProps?.solutions?.find(item => item.id === id);
      fiber = fiber.return;
    }
    if (!solution) throw new Error('Cannot observe committed real solution props');
    const rows = [...card.querySelectorAll('dl > [data-stage]')];
    const style = getComputedStyle(card);
    return {
      solution: JSON.parse(JSON.stringify(solution)), method: card.dataset.method,
      tint: style.getPropertyValue('--method-tint').trim(), background: style.backgroundColor,
      full: card.querySelector('[class*="completeAlg"] code')?.textContent,
      annotated: card.querySelector('details code')?.textContent,
      metrics: card.querySelector('[class*="solutionMetrics"]')?.textContent,
      moves: Number(card.querySelector('[class*="moveCount"] strong')?.textContent),
      stages: rows.map(row => ({ id: row.dataset.stage, label: row.querySelector('dt')?.textContent,
        text: row.querySelector('dd code')?.textContent, background: getComputedStyle(row).backgroundColor,
        color: getComputedStyle(row).color, dtColor: getComputedStyle(row.querySelector('dt')).color,
        ddColor: getComputedStyle(row.querySelector('dd')).color,
        marked: [...row.querySelectorAll('[data-cancelled="true"]')].map(span => ({ text: span.textContent,
          visible: getComputedStyle(span).display !== 'none' && getComputedStyle(span).visibility === 'visible',
          decoration: getComputedStyle(span).textDecorationLine })) })),
    };
  }));
}

const turns = text => (text.match(/\b[URFDLB](?:2|')?/g) || []).length;
function replay(card, maxOverlap, depths) {
  const s = card.solution;
  assert.equal(card.method, s.method);
  const family = Object.keys(families).find(family => families[family].includes(s.method));
  assert.ok(family, s.method);
  assert.ok(s.baseMoves <= depths[family], `${s.method}: ${s.baseMoves} > ${depths[family]}`);
  assert.equal(s.baseMoves, turns(s.base));
  assert.ok(s.boundary, 'Actual engine boundary must be present');
  assert.ok(Number.isInteger(s.boundary.overlap) && s.boundary.overlap >= 0 && s.boundary.overlap <= maxOverlap);
  assert.equal(s.boundary.left, s.base);
  assert.equal(s.boundary.right, [s.preAuf, s.algorithm, s.postAuf].filter(Boolean).join(' '));
  assert.equal(s.original, [s.orientation, s.base, s.preAuf, s.algorithm, s.postAuf].filter(Boolean).join(' '));
  const originalCount = turns([s.base, s.preAuf, s.algorithm, s.postAuf].join(' '));
  assert.equal(s.originalMoves, originalCount);
  assert.equal(s.moves, turns(s.execution));
  assert.equal(card.moves, s.moves);
  assert.equal(s.cancelled, originalCount - s.moves);
  assert.match(card.metrics, new RegExp(`做底\\s*${s.baseMoves}\\s*步`));
  assert.match(card.metrics, new RegExp(`消步\\s*${s.cancelled}\\s*步`));
  assert.deepEqual(card.stages.map(stage => stage.id), stageIds);
  const original = kp.algToTransformation(s.original);
  for (const [label, alg] of [['execution', `${s.orientation} ${s.execution}`], ['full', card.full === '无需转动' ? '' : card.full], ['annotated', card.annotated]]) {
    assert.ok(original.isIdentical(kp.algToTransformation(alg)), `${s.id}: ${label} changes the exact frame`);
    assert.equal(kp.defaultPattern().applyAlg(example).applyAlg(alg).experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }), true, `${s.id}: ${label} fails to solve`);
  }
  // Full copy may compact inspection rotations, but execution must stay byte-for-byte
  // at the engine's boundary budget, including adjacent moves left intentionally.
  if (s.execution) assert.ok(card.full === s.execution || card.full.endsWith(` ${s.execution}`), `${s.id}: extra full-copy simplification`);
  assert.doesNotMatch(card.full, /[()]|\/\/|\n/);
  assert.match(card.annotated, new RegExp(`未消步 ${originalCount} 步 → 消步后 ${s.moves} 步`));
  assert.match(card.annotated, /括号内动作仍执行一次/);
  const stageLines = card.annotated.split('\n').filter(line => !line.startsWith('// ') && line.includes('//'));
  assert.equal(stageLines.length, 5);
  let cumulative = 0;
  const source = [s.orientation, s.base, s.preAuf, s.algorithm, s.postAuf];
  const annotations = ['朝向', '做底', 'AUF', s.method, 'AUF'];
  stageLines.forEach((line, index) => {
    const count = index === 0 ? 0 : turns(source[index]);
    cumulative += count;
    assert.equal(line.slice(line.indexOf('//')), `//${annotations[index]} ${count}/${cumulative}`);
    const rendered = card.stages[index].text === '—' ? '' : card.stages[index].text;
    assert.equal(line.slice(0, line.indexOf('//')).trim(), rendered);
    assert.ok(kp.algToTransformation(source[index]).isIdentical(kp.algToTransformation(rendered)), `${s.id}: stage ${index} loses original actions`);
    for (const marker of card.stages[index].marked) {
      assert.match(marker.text, /^\([^()]+\)$/);
      assert.equal(marker.visible, true);
      assert.ok(marker.decoration.includes('underline'));
    }
    const offset = index < 2 ? 0 : source.slice(2, index).join(' ').trim().split(/\s+/).filter(Boolean).length;
    const mask = index === 0 ? [] : index === 1 ? s.boundary.leftMarked : s.boundary.rightMarked.slice(offset);
    const markedSource = source[index].trim().split(/\s+/).filter(Boolean).filter((_, i) => mask[i]);
    const markedDisplay = card.stages[index].marked.flatMap(marker => marker.text.slice(1, -1).split(/\s+/));
    assert.deepEqual(markedDisplay, markedSource, `${s.id}: stage ${index} must mark exactly the original boundary tokens`);
  });
  assert.ok(card.annotated.endsWith(`// 消步后完整解法 · 含朝向：${card.full}`));
  if (maxOverlap === 0) {
    assert.equal(s.boundary.overlap, 0);
    assert.ok([...s.boundary.leftMarked, ...s.boundary.rightMarked].every(value => value === false));
    assert.equal(s.cancelled, 0, 'Current engine preserves all internal turns with overlap disabled');
    assert.ok(card.stages.every(stage => stage.marked.length === 0 && !/[()]/.test(stage.text)));
    assert.equal(s.execution, [s.base, s.preAuf, s.algorithm, s.postAuf].filter(Boolean).join(' '));
  }
}

async function absentWarnings() {
  await results.locator('details').evaluateAll(details => details.forEach(detail => { detail.open = true; }));
  const text = await main.textContent();
  for (const warning of warnings) assert.ok(!text.includes(warning), `Obsolete warning present: ${warning}`);
  assert.ok(await results.locator('details[open]').count() > 0);
}

async function presentation() {
  const displayed = await snapshot();
  const byMethod = new Map();
  for (const card of displayed) {
    replay(card, 1, changedDepths);
    assert.match(card.tint, /^hsl\(\d+ 58% 76%\)$/);
    byMethod.set(card.method, card.background);
    assert.equal(new Set(card.stages.map(stage => stage.background)).size, 5, 'Five computed stage backgrounds');
    assert.equal(new Set(card.stages.map(stage => stage.dtColor)).size, 5, 'Five computed dt colors');
    assert.equal(new Set(card.stages.map(stage => stage.ddColor)).size, 5, 'Five computed dd colors');
    assert.ok(card.stages.every(stage => stage.dtColor === stage.color && stage.ddColor === stage.color));
  }
  assert.ok(byMethod.size >= 2, 'At least two actual methods must survive the result cap');
  assert.equal(new Set(byMethod.values()).size, byMethod.size, 'Actual methods have distinct computed backgrounds');
  // The 500-result cap need not include all 21 methods. Probe the shipped palette
  // on clones of a genuine rendered card, then separately require actual diversity.
  const source = await readFile(new URL('./SolutionCards.tsx', import.meta.url), 'utf8');
  const hues = JSON.parse(`[${source.match(/const METHOD_HUES = \[([^\]]+)\]/)?.[1]}]`);
  const ids = ['CLL', 'EG1', 'EG2', 'LEG1', 'TCLL+', 'TCLL-', ...families.LS, 'CBL', 'EGLS1', 'EGLS2', 'TEG1', 'TEG2', 'FH'];
  assert.equal(hues.length, 21);
  assert.equal(new Set(hues).size, 21);
  for (const card of displayed) assert.equal(card.tint, `hsl(${hues[ids.indexOf(card.method)]} 58% 76%)`, `${card.method}: shipped palette mapping`);
  const palette = await cards.first().evaluate((card, { hues, ids }) => {
    return ids.map((method, index) => {
      const probe = card.cloneNode(false);
      probe.dataset.method = method;
      probe.style.setProperty('--method-tint', `hsl(${hues[index]} 58% 76%)`);
      card.parentElement.append(probe);
      try { return { method, background: getComputedStyle(probe).backgroundColor }; }
      finally { probe.remove(); }
    });
  }, { hues, ids });
  assert.equal(new Set(palette.map(item => item.background)).size, 21, 'All 21 shipped tints compute to distinct card backgrounds');
  await absentWarnings();
  return { actualCards: displayed.length, actualMethods: Object.fromEntries(byMethod), palette };
}

try {
  await check('Dev server becomes available and real browser hydrates', async () => {
    const until = Date.now() + 60000;
    let last;
    while (Date.now() < until) {
      try {
        const response = await context.request.get(url, { timeout: 5000 });
        if (response.ok()) break;
        last = `HTTP ${response.status()}`;
      } catch (error) { last = error.message; }
      await page.waitForTimeout(1000);
    }
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    assert.ok(response.ok(), last);
    await page.getByLabel('打乱公式', { exact: true }).waitFor();
    await page.waitForFunction(() => !document.querySelector('#two-scramble')?.disabled);
    kp = await puzzles['2x2x2'].kpuzzle();
    ready = true;
    return { status: response.status() };
  }, true);
  await check('Exact family dropdown defaults, overlap one and automatic initial analysis', async () => {
    for (const [family, value] of Object.entries(defaults)) {
      assert.equal(await depth(family).inputValue(), String(value));
      assert.equal(await depth(family).evaluate(element => element.tagName), 'SELECT');
      assert.deepEqual(await depth(family).locator('option').evaluateAll(options => options.map(option => option.value)), ['0', '1', '2', '3', '4', '5', '6']);
    }
    assert.equal(await overlap.inputValue(), '1');
    assert.equal(await page.getByLabel('打乱公式', { exact: true }).inputValue(), example);
    assert.equal(await page.getByRole('button', { name: '分析解法', exact: true }).count(), 0);
    assert.deepEqual(await methodGroup.locator('input:checked').evaluateAll(inputs => inputs.map(input => input.parentElement.textContent)), families.EG);
    await settled(families.EG, defaults, 1);
    const displayed = await snapshot();
    displayed.forEach(card => replay(card, 1, defaults));
    assert.ok(report.workers.some(worker => new URL(worker).origin === new URL(url).origin));
    for (const method of families.EG) assert.ok(report.datasets.some(item => item.url.includes(`/${method}.json`) && item.status === 200));
    const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), settingsKey);
    assert.deepEqual(stored.familyDepths, defaults);
    assert.equal(stored.maxOverlap, 1);
    return { cards: displayed.length, stored };
  });
  await check('Known real example has marked cancellations and both copies preserve the exact original transformation', async () => {
    await settled(families.EG, defaults, 1);
    const displayed = await snapshot();
    const index = displayed.findIndex(card => card.solution.boundary.overlap > 0 && card.stages.some(stage => stage.marked.length));
    assert.ok(index >= 0, 'Known example must actually produce boundary cancellations');
    const card = cards.nth(index);
    const expected = displayed[index];
    await card.locator('details summary').click();
    replay(expected, 1, defaults);
    const copies = {};
    for (const [label, key] of [['复制完整解法', 'full'], ['复制分段注释', 'annotated']]) {
      await page.evaluate(() => navigator.clipboard.writeText('clipboard-before-real-copy'));
      await card.getByRole('button', { name: label, exact: true }).click();
      await page.waitForFunction(expected => navigator.clipboard.readText().then(text => text === expected), expected[key]);
      copies[key] = await page.evaluate(() => navigator.clipboard.readText());
      assert.equal(copies[key], expected[key]);
      assert.ok(kp.algToTransformation(expected.solution.original).isIdentical(kp.algToTransformation(copies[key])));
      assert.equal(kp.defaultPattern().applyAlg(example).applyAlg(copies[key]).experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }), true);
    }
    assert.ok(kp.algToTransformation(copies.full).isIdentical(kp.algToTransformation(copies.annotated)));
    await absentWarnings();
    return { method: expected.method, original: expected.solution.original, boundary: expected.solution.boundary, copies };
  });
  await check('EG three and CBL one automatically rerun and enforce each actual card family limit', async () => {
    await depth('EG').selectOption('3');
    await depth('CBL').selectOption('1');
    await page.getByLabel('CBL', { exact: true }).check({ force: true });
    await settled([...families.EG, 'CBL'], changedDepths, 1);
    const displayed = await snapshot();
    displayed.forEach(card => replay(card, 1, changedDepths));
    assert.ok(displayed.some(card => families.EG.includes(card.method)), 'Exercise actual EG cards at depth three');
    // This arbitrary example need not have a CBL route in <=1 base move.
    // Exercise a real CBL inverse explicitly instead of asserting its existence.
    const initialExample = example;
    const source = JSON.parse(await readFile(new URL('../../../public/two-solver/data/CBL.json', import.meta.url), 'utf8'));
    example = new Alg(source.records[0].algs[0]).invert().toString();
    await page.getByLabel('打乱公式', { exact: true }).fill(example);
    await settled([...families.EG, 'CBL'], changedDepths, 1);
    const cbl = await snapshot();
    cbl.forEach(card => replay(card, 1, changedDepths));
    assert.ok(cbl.some(card => card.method === 'CBL'), 'Real CBL fixture exercises its independent <=1 cap');
    example = initialExample;
    await page.getByLabel('打乱公式', { exact: true }).fill(example);
    await settled([...families.EG, 'CBL'], changedDepths, 1);
    return { cards: displayed.length, fixtureCBL: cbl.filter(card => card.method === 'CBL').length };
  });
  await check('Overlap zero automatically reruns without boundary marks or cross-stage savings', async () => {
    await overlap.selectOption('0');
    await settled([...families.EG, 'CBL'], changedDepths, 0);
    const displayed = await snapshot();
    displayed.forEach(card => replay(card, 0, changedDepths));
    assert.equal(await cards.locator('[data-cancelled="true"]').count(), 0);
    const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), settingsKey);
    assert.equal(before.maxOverlap, 0);
    assert.deepEqual(before.familyDepths, changedDepths);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await settled([...families.EG, 'CBL'], changedDepths, 0);
    assert.equal(await overlap.inputValue(), '0', 'Reload must retain zero rather than fall back to one');
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), settingsKey), before);
    (await snapshot()).forEach(card => replay(card, 0, changedDepths));
    return { cards: displayed.length, overlaps: [...new Set(displayed.map(card => card.solution.boundary.overlap))] };
  });
  await check('Overlap one enforces actual engine boundary budget without treating saved turns as overlaps', async () => {
    await overlap.selectOption('1');
    await settled([...families.EG, 'CBL'], changedDepths, 1);
    const displayed = await snapshot();
    displayed.forEach(card => replay(card, 1, changedDepths));
    assert.ok(displayed.some(card => card.solution.boundary.overlap === 1));
    return { cards: displayed.length, maximumActualOverlap: Math.max(...displayed.map(card => card.solution.boundary.overlap)), maximumSavedTurns: Math.max(...displayed.map(card => card.solution.cancelled)) };
  });
  await check('All 21 methods finish within 30 seconds with distinct pastel cards and five stage colors', async () => {
    await methodGroup.getByRole('button', { name: '全选', exact: true }).click();
    const started = Date.now();
    await settled(methods, changedDepths, 1);
    const elapsedMs = Date.now() - started;
    assert.ok(elapsedMs <= 30000, `All-method analysis exceeded 30 seconds: ${elapsedMs}`);
    assert.equal(await methodGroup.locator('input:checked').count(), 21);
    for (const method of methods) assert.ok(report.datasets.some(item => decodeURIComponent(new URL(item.url).pathname).endsWith(`/${method}.json`) && item.status === 200), `${method}: actual dataset fetched`);
    allReady = true;
    const evidence = await presentation();
    return { elapsedMs, ...evidence };
  });
  await check('v1 settings survive reload and automatically analyze the persisted family depths and overlap', async () => {
    const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), settingsKey);
    assert.deepEqual(before.familyDepths, changedDepths);
    assert.equal(before.maxOverlap, 1);
    assert.deepEqual([...before.methods].sort(), [...methods].sort());
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await settled(methods, changedDepths, 1);
    for (const [family, value] of Object.entries(changedDepths)) assert.equal(await depth(family).inputValue(), String(value));
    assert.equal(await overlap.inputValue(), '1');
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), settingsKey), before);
    (await snapshot()).forEach(card => replay(card, 1, changedDepths));
    return before;
  }, allReady);
  for (const theme of ['light', 'dark']) {
    await check(`${theme} theme has distinct computed presentation and no overflow at 390 and 320 pixels`, async () => {
      await page.evaluate(theme => localStorage.setItem('cubing-pro-theme', theme), theme);
      await page.emulateMedia({ colorScheme: theme });
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(theme => document.documentElement.classList.contains(theme) || document.documentElement.dataset.theme === theme, theme);
      await settled(methods, changedDepths, 1);
      const colors = await presentation();
      const layouts = [];
      for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 844 });
        const toggle = page.locator('button[aria-controls="two-solver-settings"]');
        if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
        await depth('EG').scrollIntoViewIfNeeded();
        await cards.locator('details').evaluateAll(details => details.forEach(detail => { detail.open = true; }));
        for (const target of [page.locator('#two-solver-settings'), cards.first(), cards.locator('[data-cancelled="true"]').first()]) {
          await target.scrollIntoViewIfNeeded();
          const geometry = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
          assert.ok(geometry.document <= width + 1 && geometry.body <= width + 1, JSON.stringify({ theme, ...geometry }));
          layouts.push(geometry);
        }
        await absentWarnings();
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      return { layouts, actualMethods: colors.actualMethods, palette: colors.palette };
    }, allReady);
  }
  await check('No unhandled browser errors or solver asset failures', async () => {
    assert.deepEqual(report.pageErrors, []);
    assert.deepEqual(report.consoleErrors, []);
    assert.ok(report.datasets.length > 0);
    assert.ok(report.datasets.every(item => item.status === 200));
    return { workers: report.workers.length, datasetResponses: report.datasets.length };
  });
} finally {
  await writeFile(join(artifacts, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(`Browser verification report: ${join(artifacts, 'report.json')}`);
}
if (report.checks.some(check => check.status !== 'passed')) process.exitCode = 1;
