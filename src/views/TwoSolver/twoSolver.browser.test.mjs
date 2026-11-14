import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { puzzles } from 'cubing/puzzles';

// Run against an already running Next server; never replace Worker/data/native APIs.
// TWO_SOLVER_URL=http://127.0.0.1:3128/tools/solver/222/ node src/views/TwoSolver/twoSolver.browser.test.mjs
const url = process.env.TWO_SOLVER_URL || 'http://127.0.0.1:3128/tools/solver/222/';
const artifacts = process.env.TWO_SOLVER_ARTIFACTS || join('/var/folders/p8/b3ryxj6s1bd4wgsspxzhfnw40000gn/T/opencode', `two-solver-browser-${Date.now()}`);
await mkdir(artifacts, { recursive: true });
const report = { url, artifacts, checks: [], workers: [], datasets: [], networkFailures: [], consoleErrors: [], pageErrors: [], screenshots: [] };
const deadline = Date.now() + 195000;
const watchdog = setTimeout(async () => {
  report.checks.push({ name: '200-second runtime budget', status: 'failed', error: 'Browser suite exceeded 195 seconds; terminating within the 200-second limit.' });
  await writeFile(join(artifacts, 'report.json'), JSON.stringify(report, null, 2));
  console.error(`Runtime budget exceeded. Report: ${join(artifacts, 'report.json')}`);
  process.exit(1);
}, 195000);
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN', colorScheme: 'light' });
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(url).origin });
const page = await context.newPage();
page.setDefaultTimeout(8000);
page.on('worker', worker => {
  report.workers.push(worker.url());
  worker.on('close', () => {});
});
page.on('pageerror', error => report.pageErrors.push(error.stack || error.message));
page.on('console', message => {
  if (message.type() === 'error') report.consoleErrors.push({ text: message.text(), location: message.location() });
});
context.on('requestfailed', request => report.networkFailures.push({ url: request.url(), error: request.failure()?.errorText }));
context.on('response', response => {
  if (response.url().includes('/two-solver/data/')) report.datasets.push({ url: response.url(), status: response.status() });
});
// Only unrelated account API traffic is isolated. All solver, cubing and static assets use the network.
await context.route(/\/v3\/cube-api(?:\/|$)/, route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"code":401,"data":null,"message":"browser verification: signed out"}' }));
const main = page.locator('main').last();
const cards = page.locator('article').filter({ has: page.getByRole('button', { name: '复制完整解法', exact: true }) });
let analysisReady = false;
let practiceReady = false;
let routeReady = false;
let exampleScramble;
let displayed = [];
const results = page.locator('section[aria-label=解法列表]');
const scrambleInput = page.getByLabel('打乱公式', { exact: true });
const cancel = page.getByRole('button', { name: '取消', exact: true });
const cubeHost = label => page.locator(`div[data-solver-cube="${label}"]`);
const cubeRoot = label => page.locator(`body > div[data-solver-cube-player="${label}"]`);
async function poll(fn, label, timeout = 30000) {
  const until = Math.min(deadline, Date.now() + timeout);
  let last;
  while (Date.now() < until) {
    try { if (await fn()) return; } catch (error) { last = error; }
    await page.waitForTimeout(100);
  }
  throw new Error(`Timed out: ${label}${last ? ` (${last.message})` : ''}`);
}
async function shot(name, fullPage = false) {
  const path = join(artifacts, `${name}.png`);
  await page.screenshot({ path, fullPage });
  report.screenshots.push(path);
}
async function check(name, run, prerequisite = routeReady) {
  if (Date.now() > deadline - 5000) prerequisite = false;
  if (!prerequisite) { report.checks.push({ name, status: 'blocked', reason: 'Prerequisite browser operation failed' }); return; }
  try {
    const evidence = await run();
    report.checks.push({ name, status: 'passed', evidence });
    console.log(`PASS ${name}`, evidence || '');
  } catch (error) {
    report.checks.push({ name, status: 'failed', error: error.stack || String(error) });
    console.error(`FAIL ${name}: ${error.message}`);
    await shot(`failure-${report.checks.length}`).catch(() => {});
  }
}
async function settled(timeout = 30000) {
  await poll(async () => !(await page.getByRole('button', { name: '取消', exact: true }).count()), 'operation completes', timeout);
  const alerts = await main.getByRole('alert').allTextContents();
  assert.deepEqual(alerts, [], `UI operation errors: ${alerts.join('; ')}`);
}
async function analysisSettled(scramble, methods) {
  await poll(async () => {
    if (await cancel.count() || !await results.count()) return false;
    const snapshot = results.locator(':scope > p').first();
    return await snapshot.locator('code').textContent() === scramble
      && (!methods || (await snapshot.textContent()).includes(`· ${methods.join('、')} ·`));
  }, `new automatic analysis snapshot for ${scramble}`, 30000);
  await settled();
}
// Observe the real UI without replacing the Worker, timers, or solver APIs.
async function observeActivity() {
  await page.evaluate(() => {
    window.__solverActivity?.observer.disconnect();
    if (window.__solverActivity?.onInput) document.removeEventListener('input', window.__solverActivity.onInput, true);
    const state = { samples: [], inputs: [], started: performance.now(), observer: null, onInput: null };
    state.onInput = event => { if (event.target.id === 'two-scramble') state.inputs.push(performance.now()); };
    document.addEventListener('input', state.onInput, true);
    const sample = () => {
      const value = { busy: !!document.querySelector('[role="progressbar"][aria-label="求解任务进行中"]'),
        scramble: document.querySelector('section[aria-label="解法列表"] > p code')?.textContent ?? null,
        status: document.querySelector('[class*="statusRow"] [role="status"]')?.textContent ?? '' };
      const previous = state.samples.at(-1);
      if (!previous || previous.busy !== value.busy || previous.scramble !== value.scramble || previous.status !== value.status) state.samples.push({ ...value, at: performance.now() });
    };
    state.observer = new MutationObserver(sample);
    state.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.__solverActivity = state;
    sample();
  });
}
async function activity() {
  return page.evaluate(() => ({ samples: window.__solverActivity.samples, inputs: window.__solverActivity.inputs }));
}
async function playerState(label) {
  return cubeRoot(label).evaluate(async root => {
    const player = root.querySelector(':scope > twisty-player');
    if (!player) throw new Error('Missing actual twisty-player');
    const [vantage] = await player.experimentalCurrentVantages();
    if (!vantage) throw new Error('Missing 3D vantage');
    const { canvas, context: sharedContext } = await vantage.canvasInfo();
    const object = await player.experimentalCurrentThreeJSPuzzleObject();
    let meshes = 0;
    object.traverse(node => { if (node.isMesh) meshes++; });
    const rect = root.getBoundingClientRect();
    // cubing may copy its shared WebGL renderer into a 2D presentation canvas.
    const gl = sharedContext ? null : (canvas.getContext('webgl2') || canvas.getContext('webgl'));
    return { setup: (await player.experimentalModel.setupAlg.get()).alg.toString(),
      alg: (await player.experimentalModel.alg.get()).alg.toString(), timestamp: (await player.experimentalModel.detailedTimelineInfo.get()).timestamp,
      playing: (await player.experimentalModel.playingInfo.get()).playing,
      orbit: await player.experimentalModel.twistySceneModel.orbitCoordinates.get(),
      drag: await player.experimentalModel.twistySceneModel.dragInput.get(), meshes, canvas: { width: canvas.width, height: canvas.height,
        presentation: sharedContext ? 'shared-renderer-2d' : 'webgl', contextLost: sharedContext ? false : (gl?.isContextLost() ?? true) },
      inert: root.inert, hidden: root.getAttribute('aria-hidden'), opacity: getComputedStyle(root).opacity,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      text: root.textContent, overlays: [...root.querySelectorAll('p, [role="alert"], [role="status"]')].map(element => element.textContent) };
  });
}
async function healthyPlayer(label) {
  const host = cubeHost(label);
  assert.equal(await host.count(), 1);
  await host.scrollIntoViewIfNeeded();
  await poll(async () => await host.getAttribute('aria-busy') === 'false'
    && await cubeRoot(label).count() === 1
    && await cubeRoot(label).evaluate(root => !root.inert && getComputedStyle(root).opacity === '1'), `${label} visible and ready`, 20000);
  const state = await playerState(label);
  assert.ok(state.meshes > 0 && state.canvas.width > 0 && state.canvas.height > 0 && !state.canvas.contextLost, JSON.stringify(state));
  assert.equal(state.inert, false);
  assert.equal(state.hidden, 'false');
  assert.equal(state.opacity, '1');
  assert.equal(state.drag, 'auto');
  assert.deepEqual(state.overlays, [], 'no DOM text overlays over the native scene');
  assert.deepEqual(await host.getByRole('alert').allTextContents(), []);
  const geometry = await host.boundingBox();
  for (const key of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(geometry[key] - state.rect[key]) <= 2, `player follows host ${key}`);
  return state;
}
async function settingsScroll(width, height) {
  await page.setViewportSize({ width, height });
  const toggle = page.locator('button[aria-controls="two-solver-settings"]');
  if (width <= 760 && await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
  const settings = page.locator('#two-solver-settings');
  await settings.evaluate(element => { element.scrollIntoView({ block: 'start' }); element.scrollTop = 0; });
  await page.waitForTimeout(150);
  const geometry = await settings.evaluate(element => ({ height: element.clientHeight, scrollHeight: element.scrollHeight,
    maxHeight: getComputedStyle(element).maxHeight, overflowY: getComputedStyle(element).overflowY,
    overscroll: getComputedStyle(element).overscrollBehaviorY, top: element.scrollTop, windowY: scrollY }));
  assert.ok(geometry.height > 0 && geometry.height < geometry.scrollHeight, JSON.stringify(geometry));
  assert.ok(geometry.height <= Math.ceil(height * (width <= 760 ? 0.64 : 1)), 'bounded internal viewport');
  assert.notEqual(geometry.maxHeight, 'none');
  assert.equal(geometry.overflowY, 'auto');
  assert.equal(geometry.overscroll, 'contain');
  const rect = await settings.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, Math.max(95, rect.y) + 40);
  await page.mouse.wheel(0, 260);
  await poll(() => settings.evaluate(element => element.scrollTop > 0), 'wheel scrolls settings internally', 3000);
  const after = await settings.evaluate(element => ({ top: element.scrollTop, windowY: scrollY, height: element.clientHeight }));
  assert.ok(Math.abs(after.windowY - geometry.windowY) <= 1, JSON.stringify({ geometry, after }));
  assert.equal(after.height, geometry.height, 'wheel does not grow the settings panel');
  await settings.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(150);
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - geometry.windowY) <= 1, 'overscroll is contained at the bottom');
  await noOverflow();
  await shot(`settings-${width}x${height}`);
  return { before: geometry, after };
}
async function extractCards() {
  return cards.evaluateAll(elements => elements.map(card => {
    const steps = Object.fromEntries([...card.querySelectorAll('dl > div')].map(row => [row.querySelector('dt').textContent, row.querySelector('dd code').textContent]));
    return { title: card.querySelector('h3').textContent, orientation: steps['朝向'], base: steps['做底'], algorithm: steps['公式'],
      full: [...card.querySelectorAll('code')].find(code => code.parentElement.textContent.includes('完整解法 · 已消步 · 含朝向'))?.textContent,
      moves: Number(card.querySelector('[class*=moveCount] strong').textContent),
      metrics: card.querySelector('[class*=solutionMetrics]').textContent,
      color: card.querySelector('header p').textContent };
  }));
}
async function showAllCards() {
  while (await page.getByRole('button', { name: /显示更多解法/ }).count()) {
    await page.getByRole('button', { name: /显示更多解法/ }).click();
  }
}
async function noOverflow() {
  const geometry = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth,
    offenders: [...document.querySelectorAll('main *')].filter(element => { const r = element.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }).slice(0, 12).map(element => ({ tag: element.tagName, class: String(element.className), text: element.textContent.slice(0, 70) })) }));
  assert.ok(geometry.document <= geometry.width + 1 && geometry.body <= geometry.width + 1, JSON.stringify(geometry));
  return geometry;
}
try {
  await check('Chinese route and EG-only defaults', async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await scrambleInput.waitFor();
    await poll(() => scrambleInput.isEnabled(), 'hydrated controls');
    assert.equal(await page.getByRole('button', { name: '分析解法', exact: true }).count(), 0);
    assert.match(await main.innerText(), /从做底出发/);
    const methods = await page.getByRole('group').filter({ has: page.locator('legend').filter({ hasText: /^方法/ }) }).locator('label').evaluateAll(labels => labels.filter(label => label.querySelector('input')?.checked).map(label => label.textContent));
    assert.deepEqual(methods, ['CLL', 'EG1', 'EG2', 'LEG1']);
    exampleScramble = await page.getByLabel('打乱公式', { exact: true }).inputValue();
    routeReady = true;
    await shot('desktop-initial');
    return { methods, exampleScramble };
  }, true);
  await check('Page load automatically solves with real Worker and validated datasets', async () => {
    await analysisSettled(exampleScramble, ['CLL', 'EG1', 'EG2', 'LEG1']);
    await poll(async () => await cards.count() > 0, 'real solution cards');
    assert.ok(await cards.count() <= 30, 'initial render is paginated');
    assert.equal(await cards.first().getByRole('button', { name: '3D 解析', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await cubeHost('解法 3D 解析').count(), 1, 'first result 3D is mounted by default');
    await showAllCards();
    const text = await main.innerText();
    const stats = text.match(/公式源数据校验：通过 ([\d,]+) 条，拒绝 ([\d,]+) 条/);
    assert.ok(stats, 'validation statistics displayed');
    assert.ok(Number(stats[1].replaceAll(',', '')) > 0);
    assert.ok(report.workers.some(worker => new URL(worker).origin === new URL(url).origin), 'real same-origin solver Worker observed (production filenames are hashed)');
    for (const method of ['CLL', 'EG1', 'EG2', 'LEG1']) assert.ok(report.datasets.some(item => item.url.includes(`/${method}.json`) && item.status === 200), `${method} dataset fetched`);
    displayed = await extractCards();
    assert.ok(displayed.every(card => card.full && card.algorithm));
    analysisReady = true;
    await writeFile(join(artifacts, 'example-displayed-solutions.json'), JSON.stringify({ scramble: exampleScramble, cards: displayed }, null, 2));
    await shot('desktop-results');
    return { count: displayed.length, loaded: stats[1], rejected: stats[2] };
  });
  await check('Independent cubing replay of every displayed full sequence', async () => {
    const kpuzzle = await puzzles['2x2x2'].kpuzzle();
    const scrambled = kpuzzle.defaultPattern().applyAlg(exampleScramble);
    assert.equal(scrambled.experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }), false);
    const failures = displayed.flatMap((card, index) => scrambled.applyAlg(card.full === '无需转动' ? '' : card.full).experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }) ? [] : [{ index, ...card }]);
    assert.deepEqual(failures, []);
    return { replayed: displayed.length, nonemptyOrientations: displayed.filter(card => card.orientation !== '—').length };
  }, analysisReady);
  await check('Clipboard full sequence includes nonempty orientation', async () => {
    const index = displayed.findIndex(card => card.orientation !== '—');
    assert.ok(index >= 0, 'a nonempty orientation is available');
    await cards.nth(index).getByRole('button', { name: '复制完整解法', exact: true }).click();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    assert.equal(clipboard, displayed[index].full);
    assert.ok(clipboard.startsWith(`${displayed[index].orientation} `));
    return { index, clipboard };
  }, analysisReady);
  await check('Filters and sorting apply to returned cards', async () => {
    const panel = page.locator('section[aria-label=解法列表]');
    await panel.getByLabel('方法', { exact: true }).selectOption('CLL');
    assert.ok((await extractCards()).every(card => card.title.startsWith('CLL ')));
    await panel.getByLabel('底色', { exact: true }).selectOption('D');
    assert.ok((await extractCards()).every(card => card.color.includes('黄色底')));
    await panel.getByLabel('排序', { exact: true }).selectOption('moves');
    const moves = (await extractCards()).map(card => card.moves);
    assert.ok(moves.length > 0);
    assert.deepEqual(moves, [...moves].sort((a, b) => a - b));
    await panel.getByLabel('查找情形或公式').fill('no-such-case-browser-verification');
    assert.equal(await cards.count(), 0);
    await panel.getByRole('button', { name: '重置筛选', exact: true }).first().click();
    await showAllCards();
    assert.equal(await cards.count(), displayed.length);
    return { sortedCount: moves.length, restored: displayed.length };
  }, analysisReady);
  await check('Default scramble and first solution have independent healthy 3D scenes', async () => {
    await page.setViewportSize({ width: 1440, height: 2600 });
    await page.evaluate(() => scrollTo(0, 0));
    assert.equal(await cards.first().getByRole('button', { name: '3D 解析', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await cubeHost('解法 3D 解析').count(), 1, 'first solution shown without clicking');
    const scramble = await healthyPlayer('打乱状态 3D');
    assert.equal(scramble.setup, exampleScramble);
    assert.equal(scramble.alg, '');
    assert.equal(scramble.playing, false);
    const solution = await healthyPlayer('解法 3D 解析');
    assert.equal(solution.setup, exampleScramble);
    assert.equal(solution.alg, displayed[0].full === '无需转动' ? '' : displayed[0].full, 'entire full sequence matches without a text overlay');
    assert.equal(solution.playing, false);
    assert.equal(solution.timestamp, 0);
    await page.waitForTimeout(450);
    assert.equal((await playerState('解法 3D 解析')).timestamp, 0, 'no automatic playback');
    // A tall viewport allows both actual body-level scenes to be visible together.
    assert.equal(await page.locator('body > div[data-solver-cube-tree] > twisty-player').count(), 2);
    const simultaneous = await page.evaluate(() => {
      const roots = [...document.querySelectorAll('body > div[data-solver-cube-player]')];
      return roots.length === 2 && roots[0].firstElementChild !== roots[1].firstElementChild && roots.every(root => {
        const rect = root.getBoundingClientRect();
        return root.isConnected && !root.inert && getComputedStyle(root).opacity === '1' && rect.top >= 0 && rect.bottom <= innerHeight;
      });
    });
    assert.equal(simultaneous, true);
    await cubeRoot('解法 3D 解析').evaluate(root => root.querySelector('twisty-player').play());
    await poll(async () => (await playerState('解法 3D 解析')).timestamp > 0, 'direct player.play advances timestamp', 3000);
    await cubeRoot('解法 3D 解析').evaluate(root => root.querySelector('twisty-player').pause());
    const played = await playerState('解法 3D 解析');
    assert.equal(played.playing, false);
    const untouched = await playerState('打乱状态 3D');
    assert.equal(untouched.setup, scramble.setup);
    assert.equal(untouched.alg, '');
    assert.equal(untouched.timestamp, scramble.timestamp);
    await shot('desktop-native-playback');
    return { scramble, solution, playedTimestamp: played.timestamp, simultaneous };
  }, analysisReady);
  await check('Original base prefix and complete sequence configure the first result stages', async () => {
    const first = cards.first();
    const before = await extractCards();
    const prefix = [exampleScramble, displayed[0].orientation, displayed[0].base].filter(value => value && value !== '—').join(' ');
    await first.getByRole('button', { name: '做底完成', exact: true }).click();
    await poll(() => cubeHost('解法 3D 解析').getAttribute('data-setup').then(value => value === prefix), 'base setup from original dl prefix');
    const base = await healthyPlayer('解法 3D 解析');
    assert.equal(base.setup, prefix);
    assert.equal(base.alg, '', 'base stage excludes pre-AUF and algorithm');
    assert.equal(base.timestamp, 0);
    assert.equal(base.playing, false);
    assert.equal(await first.getByRole('button', { name: '做底完成', exact: true }).getAttribute('aria-pressed'), 'true');
    await first.getByRole('button', { name: '完整解法', exact: true }).click();
    const full = await healthyPlayer('解法 3D 解析');
    assert.equal(full.setup, exampleScramble);
    assert.equal(full.alg, displayed[0].full === '无需转动' ? '' : displayed[0].full);
    assert.equal(full.timestamp, 0);
    assert.equal(full.playing, false);
    await first.getByRole('button', { name: '复制完整解法', exact: true }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), displayed[0].full);
    if (await cards.count() > 1) {
      await cards.nth(1).getByRole('button', { name: '3D 解析', exact: true }).click();
      const second = await healthyPlayer('解法 3D 解析');
      assert.equal(second.alg, displayed[1].full === '无需转动' ? '' : displayed[1].full);
      assert.equal(second.timestamp, 0);
      assert.equal(second.playing, false);
      assert.equal(await cubeHost('解法 3D 解析').count(), 1);
      await first.getByRole('button', { name: '3D 解析', exact: true }).click();
      await healthyPlayer('解法 3D 解析');
    }
    assert.deepEqual(await extractCards(), before, 'stage and selection changes preserve complete output');
    return { prefix, full: full.alg, timestamp: full.timestamp };
  }, analysisReady);
  await check('Dragging the default scramble rotates its camera independently', async () => {
    const solutionBefore = await playerState('解法 3D 解析');
    const before = await healthyPlayer('打乱状态 3D');
    const rect = await cubeRoot('打乱状态 3D').boundingBox();
    await page.mouse.move(rect.x + rect.width * 0.45, rect.y + rect.height * 0.45);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.width * 0.7, rect.y + rect.height * 0.65, { steps: 12 });
    await page.mouse.up();
    await poll(async () => JSON.stringify((await playerState('打乱状态 3D')).orbit) !== JSON.stringify(before.orbit), 'drag changes camera orbit', 3000);
    const after = await playerState('打乱状态 3D');
    assert.equal(after.setup, before.setup);
    assert.equal(after.alg, before.alg);
    assert.deepEqual((await playerState('解法 3D 解析')).orbit, solutionBefore.orbit);
    await shot('desktop-scramble-drag');
    return { before: before.orbit, after: after.orbit, rect: after.rect };
  }, analysisReady);
  await check('Short desktop settings wheel scroll stays inside a fixed-height panel', () => settingsScroll(1440, 620), analysisReady);
  for (const width of [390, 320]) await check(`Results layout at ${width}px has no horizontal overflow`, async () => {
    const scrolling = await settingsScroll(width, 640);
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(250);
    await shot(`mobile-${width}-top`);
    await page.getByRole('heading', { name: /解法工作台/ }).scrollIntoViewIfNeeded();
    await shot(`mobile-${width}-results`);
    return { scrolling, layout: await noOverflow() };
  }, analysisReady);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await check('Rapid input edits debounce 400ms and only publish the latest snapshot', async () => {
    await observeActivity();
    const intermediate = `${exampleScramble} U`;
    const latest = `${exampleScramble} U2`;
    await scrambleInput.fill(intermediate);
    await page.waitForTimeout(100);
    await scrambleInput.fill(latest);
    await page.waitForTimeout(200);
    assert.equal(await cancel.count(), 0, 'no search during debounce window');
    assert.equal(await results.count(), 0, 'previous snapshot removed immediately');
    await analysisSettled(latest);
    const observed = await activity();
    const busy = observed.samples.filter(sample => sample.busy);
    assert.ok(busy.length > 0, 'automatic processing observed');
    const delay = busy[0].at - observed.inputs.at(-1);
    assert.ok(delay >= 375, `400ms debounce began too early: ${delay}ms`);
    assert.ok(observed.samples.filter(sample => sample.scramble).every(sample => sample.scramble === exampleScramble || sample.scramble === latest));
    const kpuzzle = await puzzles['2x2x2'].kpuzzle();
    const latestCards = await extractCards();
    assert.ok(latestCards.length > 0);
    assert.ok(latestCards.every(card => kpuzzle.defaultPattern().applyAlg(latest).applyAlg(card.full === '无需转动' ? '' : card.full).experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true })));
    // Supersede a real in-flight search, then edit rapidly again.
    await observeActivity();
    await scrambleInput.fill(`${exampleScramble} F`);
    await poll(() => cancel.count().then(count => count > 0), 'real in-flight analysis before superseding', 3000);
    await scrambleInput.fill(`${exampleScramble} R`);
    await page.waitForTimeout(80);
    await scrambleInput.fill(exampleScramble);
    await analysisSettled(exampleScramble);
    await page.waitForTimeout(600);
    const superseded = await activity();
    assert.ok(superseded.samples.filter(sample => sample.scramble).every(sample => sample.scramble === latest || sample.scramble === exampleScramble), JSON.stringify(superseded));
    assert.equal(await results.locator(':scope > p code').textContent(), exampleScramble);
    assert.ok((await extractCards()).every(card => kpuzzle.defaultPattern().applyAlg(exampleScramble).applyAlg(card.full === '无需转动' ? '' : card.full).experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true })), 'final cards solve the latest input, not an obsolete request');
    return { delayMs: delay, rapid: observed, superseded, count: latestCards.length };
  }, analysisReady);
  await check('Search options automatically rerun and publish a new captured snapshot', async () => {
    await observeActivity();
    await page.getByLabel('EG2', { exact: true }).uncheck({ force: true });
    await analysisSettled(exampleScramble, ['CLL', 'EG1', 'LEG1']);
    const observed = await activity();
    assert.ok(observed.samples.some(sample => sample.busy), 'new option search processed');
    assert.ok((await extractCards()).every(card => !card.title.startsWith('EG2 ')));
    await page.getByRole('button', { name: '常用四种', exact: true }).click();
    await analysisSettled(exampleScramble, ['CLL', 'EG1', 'EG2', 'LEG1']);
    return observed;
  }, analysisReady);
  await check('Random state generator and validation Worker', async () => {
    await page.getByRole('button', { name: /随机打乱/ }).click();
    await poll(async () => await scrambleInput.inputValue() !== exampleScramble, 'new random scramble');
    const scramble = await page.getByLabel('打乱公式', { exact: true }).inputValue();
    await analysisSettled(scramble);
    assert.notEqual(scramble, exampleScramble);
    const kpuzzle = await puzzles['2x2x2'].kpuzzle();
    assert.equal(kpuzzle.defaultPattern().applyAlg(scramble).experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }), false);
    return { scramble };
  });
  await check('Practice generation hides solution details', async () => {
    await page.getByRole('tab', { name: /计时练习/ }).click();
    await page.getByText('抽样与观察设置', { exact: true }).click();
    await page.getByLabel('启用 15 秒观察').uncheck();
    await page.getByRole('button', { name: /生成练习/ }).click();
    await settled();
    await poll(() => page.getByRole('button', { name: '查看解法', exact: true }).isEnabled(), 'practice ready');
    assert.equal(await cards.count(), 0);
    assert.equal(await page.locator('section[aria-label=解法列表]').count(), 0);
    assert.equal(await main.getByText(/公式源数据校验|完整解法 · 已消步|前置 AUF|后置 AUF/).count(), 0);
    assert.equal(await page.getByRole('button', { name: '复制完整解法', exact: true }).count(), 0);
    practiceReady = true;
    return { status: await main.getByRole('status').allTextContents() };
  });
  await check('Quick timed solve, +2 penalty and history survive reload', async () => {
    await page.getByRole('button', { name: '开始计时', exact: true }).click();
    await page.waitForTimeout(350);
    await page.getByRole('button', { name: '停止计时', exact: true }).click();
    const history = page.locator('section[aria-label=练习历史]');
    await history.locator('details summary').first().click();
    await history.getByLabel('成绩判罚').first().selectOption('+2');
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('cubing.pro.two-solver.practice.v1')));
    assert.equal(before.length, 1);
    assert.equal(before[0].penalty, '+2');
    assert.equal(before[0].inspectionMs, 0);
    assert.ok(before[0].elapsedMs > 0);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.getByRole('tab', { name: /计时练习/ }).click();
    await history.locator('details summary').first().waitFor();
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('cubing.pro.two-solver.practice.v1')));
    assert.deepEqual(after, before);
    assert.match(await history.innerText(), /\(\+2\)/);
    return { record: after[0] };
  }, practiceReady);
  await check('Bounded conditional generation targets CLL and minimum savings', async () => {
    const settings = page.getByText('抽样与观察设置', { exact: true });
    if (!(await page.getByLabel('按条件抽样').isVisible())) await settings.click();
    await page.getByLabel('按条件抽样').check();
    await page.getByLabel('目标方法', { exact: true }).selectOption('CLL');
    await page.getByLabel('最少消步数', { exact: true }).fill('0');
    await page.getByLabel('最多尝试次数', { exact: false }).fill('2');
    await page.getByRole('button', { name: /生成练习|下一条打乱/ }).click();
    await settled();
    await poll(() => page.getByRole('button', { name: '查看解法', exact: true }).isEnabled(), 'bounded sample hit');
    assert.equal(await cards.count(), 0);
    await page.getByRole('button', { name: '查看解法', exact: true }).click();
    await poll(async () => await cards.count() > 0, 'revealed conditional results');
    const generated = await extractCards();
    assert.ok(generated.some(card => card.title.startsWith('CLL ') && Number(card.metrics.match(/消步\s*(\d+)/)?.[1]) >= 0));
    assert.match(await main.innerText(), /条件抽样：CLL.*消步 ≥ 0.*第 [12]\/2 次命中/);
    return { matchingCLL: generated.filter(card => card.title.startsWith('CLL ')).length, attempts: 2, minimumSavings: 0 };
  });
  await check('Cancellation stays stopped until the next input change then recovers', async () => {
    await page.getByRole('tab', { name: /解法分析/ }).click();
    await page.getByRole('button', { name: '全选', exact: true }).click();
    // No pointer stability wait: a production search can finish while the
    // button scrolls into view. Activate cancellation as soon as it is mounted.
    await poll(() => page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find(element => element.textContent === '取消');
      button?.click();
      return !!button;
    }), 'cancel mounted task', 3000);
    assert.match(await main.innerText(), /已取消，本次未采用新结果/);
    const workersAfterCancel = report.workers.length;
    await observeActivity();
    await page.waitForTimeout(1000);
    assert.equal(await cancel.count(), 0);
    assert.equal(await results.count(), 0);
    assert.equal(report.workers.length, workersAfterCancel);
    assert.ok((await activity()).samples.every(sample => !sample.busy));
    await scrambleInput.fill(`${exampleScramble} U`);
    await poll(() => cancel.count().then(count => count > 0), 'input restarts cancelled search', 3000);
    await cancel.evaluate(button => button.click());
    await page.getByRole('button', { name: '常用四种', exact: true }).click();
    await scrambleInput.fill(exampleScramble);
    await analysisSettled(exampleScramble, ['CLL', 'EG1', 'EG2', 'LEG1']);
    assert.ok(report.workers.length > workersAfterCancel);
    assert.ok(await cards.count() > 0);
    return { workersObserved: report.workers.length, count: await cards.count() };
  });
  await check('Switching tabs cancels analysis and preserves the practice question and history', async () => {
    await page.getByRole('tab', { name: /计时练习/ }).click();
    const practiceScramble = await main.locator('[class*="practiceScramble"] code').textContent();
    const history = await page.evaluate(() => localStorage.getItem('cubing.pro.two-solver.practice.v1'));
    const revealedCount = await cards.count();
    await page.getByRole('tab', { name: /解法分析/ }).click();
    await poll(() => cancel.count().then(count => count > 0), 'tab return automatically starts analysis', 3000);
    await page.getByRole('tab', { name: /计时练习/ }).click();
    await observeActivity();
    await page.waitForTimeout(700);
    assert.equal(await cancel.count(), 0);
    assert.ok((await activity()).samples.every(sample => !sample.busy));
    assert.equal(await main.locator('[class*="practiceScramble"] code').textContent(), practiceScramble);
    assert.equal(await page.evaluate(() => localStorage.getItem('cubing.pro.two-solver.practice.v1')), history);
    assert.equal(await cards.count(), revealedCount, 'returning to practice preserves its reveal state');
    if (!revealedCount) await page.getByRole('button', { name: '查看解法', exact: true }).click();
    await poll(async () => await cards.count() > 0, 'practice result still available');
    assert.equal(await results.locator(':scope > p code').textContent(), practiceScramble);
    await page.getByRole('tab', { name: /解法分析/ }).click();
    await analysisSettled(exampleScramble);
    return { practiceScramble, preservedHistory: true };
  }, practiceReady);
  await check('TCLL+ dataset URL escapes plus and returns actual data', async () => {
    const target = new URL('../../../two-solver/data/TCLL%2B.json', url);
    const response = await context.request.get(target.href, { timeout: 20000 });
    assert.equal(response.status(), 200);
    const data = await response.json();
    assert.equal(data.method, 'TCLL+');
    assert.ok(data.records.length > 0);
    await page.getByRole('group').filter({ has: page.locator('legend').filter({ hasText: /^方法/ }) }).getByRole('button', { name: '清空', exact: true }).click();
    await observeActivity();
    await page.getByLabel('TCLL+', { exact: true }).check({ force: true });
    await analysisSettled(exampleScramble, ['TCLL+']);
    const observed = await activity();
    assert.ok(observed.samples.some(sample => sample.busy), 'TCLL+ selection actually processed before idle');
    assert.ok(observed.samples.some(sample => !sample.busy && sample.scramble === exampleScramble), 'new snapshot captured after automatic search');
    assert.ok(report.datasets.some(item => /TCLL%2B\.json/i.test(item.url) && item.status === 200), 'Worker requested percent-escaped TCLL+');
    const links = await page.locator('a').filter({ hasText: '查看公式库' }).evaluateAll(elements => elements.map(element => element.getAttribute('href')));
    assert.ok(links.length > 0);
    assert.ok(links.every(href => /TCLL%2B/i.test(href)));
    return { url: response.url(), records: data.records.length, links: links.slice(0, 2) };
  });
  await check('Dark theme screenshot and narrow layout', async () => {
    await page.evaluate(() => localStorage.setItem('cubing-pro-theme', 'dark'));
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await scrambleInput.waitFor();
    await analysisSettled(exampleScramble, ['TCLL+']);
    await poll(() => page.evaluate(() => document.documentElement.classList.contains('dark') || document.documentElement.dataset.theme === 'dark'), 'real dark theme');
    await page.evaluate(() => scrollTo(0, 0));
    await shot('desktop-dark');
    const colors = await main.evaluate(element => ({ color: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor }));
    await page.setViewportSize({ width: 320, height: 844 });
    await page.waitForTimeout(250);
    await shot('mobile-320-dark');
    await noOverflow();
    return colors;
  });
  await check('No serious browser console or unhandled errors', async () => {
    assert.deepEqual(report.pageErrors, []);
    assert.deepEqual(report.consoleErrors, []);
    return { pageErrors: 0, consoleErrors: 0, networkFailures: report.networkFailures };
  });
} finally {
  await writeFile(join(artifacts, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  clearTimeout(watchdog);
  console.log(`Browser verification report: ${join(artifacts, 'report.json')}`);
}
if (report.checks.some(check => check.status !== 'passed')) process.exitCode = 1;
