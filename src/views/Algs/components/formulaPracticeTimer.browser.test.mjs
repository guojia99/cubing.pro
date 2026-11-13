import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';

// Optional browser tools live outside the repository. No production dependencies added.
// PRACTICE_BROWSER_TOOLS=/path/to/tools node src/views/Algs/components/formulaPracticeTimer.browser.test.mjs
const require = createRequire(process.env.PRACTICE_BROWSER_TOOLS
  ? `${process.env.PRACTICE_BROWSER_TOOLS}/package.json` : import.meta.url);
const { chromium } = require('playwright');
const esbuild = require('esbuild');
const root = fileURLToPath(new URL('../../../../', import.meta.url)).replace(/\/$/, '');
const component = `${root}/src/views/Algs/components/FormulaPracticeModal.tsx`;
const service = `${root}/src/services/cubing-pro/algs/formulaPracticeHistory.ts`;
const db = `${root}/src/services/cubing-pro/algs/formulaPracticeHistoryDb.ts`;

const bundle = await esbuild.build({
  stdin: { contents: `
    import React, {useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import {ChakraProvider} from '@chakra-ui/react';
    import {system} from '${root}/src/theme';
    import {I18nProvider} from '${root}/src/contexts/I18nProvider';
    import {useI18n} from '${root}/src/contexts/I18nProvider';
    import Modal from '${component}';
    import AlgsModal from '${root}/src/views/Algs/components/AlgsModal';
    import AlgsFilterPanel from '${root}/src/views/Algs/components/AlgsFilterPanel';
    import * as history from '${service}';
    import {importHistory} from '${db}';
    import {renderFromSimpleQuery} from '@/vendor/puzzle-drawing/visualcube/src/preset';
    import '${root}/src/styles/tokens.css';
    import '${root}/src/views/Algs/styles/algsDetail.css';
    window.practiceHistory = history; window.importHistory = importHistory;
    window.practiceVendorReference = setup => renderFromSimpleQuery({cubeSize:3,size:240,setup,view:'pll',
      sch:'#ffdd00,#00a651,#e53935,#ffffff,#2266ff,#ff8800'});
    window.practiceTest = {creates: [], appends: [], pages: [], summaries: [], failAppend: false, delayAppend: false, failSummary: false, failCreate: false, failDelete: false, failClear: false};
    const algs = Array.from({length: 4}, (_, i) => ({setName: 'Set', groupName: 'Group', alg: {name: 'Case '+(i+1), scrambles: ["R U R'", "F U F'"], algs: ["R U R' U'"], image: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect x="8" y="8" width="44" height="44" fill="#22a8cb"/></svg>'}}));
    const filterData = {name: 'PLL', sets: [{name: 'Set', groups: [{name: 'Group', algs: algs.map(item => item.alg)}]}]};
    function ControlsHost() {
      const [open, setOpen] = useState(false);
      const [sets, setSets] = useState(['Set']);
      const [groups, setGroups] = useState(['Set:Group']);
      const [hidden, setHidden] = useState([]);
      const toggle = (setter, value) => setter(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
      return <><div style={{width: '100%', maxWidth: 160}}><AlgsFilterPanel data={filterData} selectedSets={sets} selectedGroups={groups} hiddenFormulaKeys={hidden}
        onSetToggle={value => toggle(setSets, value)} onGroupToggle={value => toggle(setGroups, value)} onFormulaToggle={value => toggle(setHidden, value)}
        onSetSelectAll={() => setSets(['Set'])} onSetDeselectAll={() => setSets([])} onGroupSelectAll={() => setGroups(['Set:Group'])} onGroupDeselectAll={() => setGroups([])}
        onFormulaSelectAll={() => setHidden([])} onFormulaDeselectAll={() => setHidden(algs.map(item => 'Set:Group:'+item.alg.name))}/></div>
        <button onClick={() => setOpen(true)}>Open formula</button><AlgsModal open={open} onClose={() => setOpen(false)} cube="333" classId="PLL" items={algs} currentIndex={0} useVisualCube={false}/></>;
    }
    function Host() {
      const {setLocale} = useI18n(); window.setPracticeLocale = setLocale;
      const [props, setProps] = useState({open: true, cube: '333', classId: 'PLL', flatAlgs: algs});
      window.setPracticeProps = patch => setProps(prev => ({...prev, ...patch}));
      return <><button onClick={() => setProps(prev => ({...prev, open:true}))}>Reopen</button><Modal {...props} onClose={() => setProps(prev => ({...prev, open:false}))}/></>;
    }
    window.practiceRoot = createRoot(document.getElementById('root'));
    window.practiceRoot.render(<React.StrictMode><ChakraProvider value={system}><I18nProvider>{location.pathname === '/controls' ? <ControlsHost/> : <Host/>}</I18nProvider></ChakraProvider></React.StrictMode>);
  `, loader: 'tsx', resolveDir: root },
  // A single in-memory IIFE bundles dynamic imports; React.lazy still resolves asynchronously.
  bundle: true, write: false, outdir: '/practice-test', format: 'iife', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"', 'process.env': '{}' },
  plugins: [{ name: 'next-dynamic-browser', setup(build) {
    build.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: 'dynamic', namespace: 'browser-adapter' }));
    build.onLoad({ filter: /.*/, namespace: 'browser-adapter' }, () => ({
      contents: `import React, {lazy, Suspense} from 'react';
        export default function dynamic(load, options = {}) {
          const Component = lazy(() => load().then(module => ({default: module.default || module})));
          return function Dynamic(props) {
            const Loading = options.loading;
            return React.createElement(Suspense, {fallback: Loading ? React.createElement(Loading) : null}, React.createElement(Component, props));
          };
        }`, resolveDir: root,
    }));
  } }, { name: 'controlled-practice-storage', setup(build) {
    build.onResolve({ filter: /formulaPracticeHistory$/ }, (args) => ({ path: args.path, namespace: 'controlled' }));
    build.onLoad({ filter: /.*/, namespace: 'controlled' }, () => ({
      contents: `
        import * as api from '${service}';
        export const {computeAverages, computeTrimmedMean, PAGE_SIZE} = api;
        export async function createPracticeSession(...args) {
          const test = window.practiceTest; test.creates.push(args);
          if (test.failCreate) throw new Error('simulated create failure');
          return api.createPracticeSession(...args);
        }
        export async function appendFormulaPracticeRecord(...args) {
          const test = window.practiceTest; test.appends.push(args);
          if (test.delayAppend) await new Promise(resolve => test.releaseAppend = resolve);
          if (test.failAppend) throw new Error('simulated transaction abort');
          const record = await api.appendFormulaPracticeRecord(...args);
          if (test.loseAppendAckOnce) { test.loseAppendAckOnce = false; throw new Error('simulated lost acknowledgement after commit'); }
          return record;
        }
        export async function getFormulaPracticeHistoryPage(...args) {
          window.practiceTest.pages.push(args);
          return api.getFormulaPracticeHistoryPage(...args);
        }
        export async function getFormulaPracticeHistorySummary(...args) {
          const test = window.practiceTest; test.summaries.push(args);
          if (test.failSummary) throw new Error('simulated read failure');
          const result = await api.getFormulaPracticeHistorySummary(...args);
          if (test.delaySummary === args[1]) await new Promise(resolve => test.releaseSummary = resolve);
          return result;
        }
        export async function deleteFormulaPracticeRecord(...args) {
          if (window.practiceTest.failDelete) throw new Error('simulated delete failure');
          return api.deleteFormulaPracticeRecord(...args);
        }
        export async function clearFormulaPracticeHistory(...args) {
          if (window.practiceTest.failClear) throw new Error('simulated clear failure');
          return api.clearFormulaPracticeHistory(...args);
        }
        export function getFormulaPracticeHistory() { throw new Error('Unbounded history is forbidden'); }
      `, resolveDir: root,
    }));
  } }],
});
const js = bundle.outputFiles.find((file) => file.path.endsWith('.js')).text;
const css = bundle.outputFiles.find((file) => file.path.endsWith('.css')).text;
const server = http.createServer((request, response) => {
  response.setHeader('Content-Type', request.url === '/bundle.js' ? 'text/javascript' : request.url === '/bundle.css' ? 'text/css' : 'text/html');
  response.end(request.url === '/bundle.js' ? js : request.url === '/bundle.css' ? css : '<!DOCTYPE html><html data-palette="haitian"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const errors = [];
const origin = `http://127.0.0.1:${server.address().port}`;
const playerSelector = 'cubing-pro-managed-twisty-player';
async function poll(description, predicate, {timeout = 10000, interval = 50} = {}) {
  const deadline = performance.now() + timeout;
  const timeoutError = () => Object.assign(new Error(`Timed out waiting for ${description}`), {name: 'TimeoutError'});
  while (performance.now() < deadline) {
    let timer;
    let result;
    try {
      result = await Promise.race([
        predicate(),
        new Promise((_, reject) => { timer = setTimeout(() => reject(timeoutError()), Math.max(1, Math.ceil(deadline - performance.now()))); }),
      ]);
    } finally { clearTimeout(timer); }
    if (result === true) return;
    await delay(Math.min(interval, Math.max(0, deadline - performance.now())));
  }
  throw timeoutError();
}
const waitInBrowser = (page, description, predicate, arg) => poll(description, async () => Boolean(await page.evaluate(predicate, arg)));
async function assertWindowPracticeDialog(page) {
  await page.getByRole('dialog').evaluate(async element => {
    await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {})));
  });
  const metrics = await page.getByRole('dialog').evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const body = element.querySelector('.fp-body');
    return {x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
      viewportWidth: innerWidth, viewportHeight: innerHeight,
      maxHeight: getComputedStyle(element).maxHeight,
      overflow: element.scrollWidth > element.clientWidth || body.scrollWidth > body.clientWidth,
      pageOverflow: document.documentElement.scrollWidth > innerWidth};
  });
  assert.ok(Math.abs(metrics.x) <= 1 && Math.abs(metrics.y) <= 1, `dialog starts at viewport origin: ${JSON.stringify(metrics)}`);
  assert.ok(Math.abs(metrics.width - metrics.viewportWidth) <= 1, `dialog fills viewport width: ${JSON.stringify(metrics)}`);
  assert.ok(Math.abs(metrics.height - metrics.viewportHeight) <= 1, `dialog fills 100dvh: ${JSON.stringify(metrics)}`);
  assert.equal(metrics.maxHeight, `${metrics.viewportHeight}px`, 'dialog maximum height follows the viewport');
  assert.equal(metrics.overflow, false, 'dialog and scroll body have no horizontal overflow');
  assert.equal(metrics.pageOverflow, false, 'practice does not widen the document');
}
async function assertManagedPlayer(scope) {
  const player = scope.locator(playerSelector);
  await poll('managed practice player readiness', () => scope.evaluate(host => {
    const player = host.querySelector('cubing-pro-managed-twisty-player');
    return !!host.querySelector('[role="alert"]') || player?.style.visibility === 'visible'
      && !!host.querySelector('select:not(:disabled)');
  }), {timeout: 40000});
  assert.deepEqual(await scope.getByRole('alert').allTextContents(), []);
  assert.equal(await player.count(), 1, 'one real managed player under StrictMode');
  assert.equal(await player.isVisible(), true);
  const canvases = await player.evaluate(async element => (await element.experimentalCurrentCanvases()).map(canvas => [canvas.width, canvas.height]));
  assert.ok(canvases.length > 0 && canvases.every(([width, height]) => width > 0 && height > 0));
}
async function assertIconClose(page, button) {
  await button.evaluate(async element => {
    const animations = element.closest('[role="dialog"]').getAnimations({subtree: true});
    await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
  });
  assert.equal((await button.innerText()).trim(), '', 'close has no visible text');
  assert.equal(await button.locator('svg').count(), 1, 'close has an SVG X');
  const metrics = await button.evaluate(element => {
    const style = getComputedStyle(element);
    const svg = element.querySelector('svg');
    const probe = document.createElement('span'); probe.style.color = 'var(--destructive)'; element.appendChild(probe);
    const result = {width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height, radius: style.borderRadius, color: style.color, stroke: getComputedStyle(svg).stroke, expected: getComputedStyle(probe).color};
    probe.remove(); return result;
  });
  assert.equal(metrics.width, 32);
  assert.equal(metrics.height, 32);
  assert.equal(metrics.radius, '4px');
  assert.equal(metrics.color, metrics.expected);
  assert.equal(metrics.stroke, metrics.expected, 'SVG stroke is red');
  await button.hover();
  const hover = await button.evaluate(element => ({color: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor}));
  assert.equal(hover.color, metrics.expected);
  assert.notEqual(hover.background, 'rgba(0, 0, 0, 0)', 'close has hover feedback');
  await button.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  const focus = await button.evaluate(element => ({focused: element === document.activeElement, outline: getComputedStyle(element).outlineStyle}));
  assert.equal(focus.focused, true, 'close is keyboard reachable');
  assert.notEqual(focus.outline, 'none', 'close has a visible focus outline');
}
async function assertLocalDiagram(scope, expectedSetup) {
  const diagram = scope.locator('.puzzle-diagram');
  await diagram.scrollIntoViewIfNeeded();
  await diagram.locator('svg[role="img"], [role="alert"]').first().waitFor();
  assert.deepEqual(await diagram.getByRole('alert').allTextContents(), [], 'valid setup renders without errors');
  assert.equal(await diagram.getAttribute('data-puzzle'), '3x3x3', 'real local puzzle is prepared');
  assert.equal(await diagram.getAttribute('data-state-source'), 'scramble', 'practice diagram uses the recorded setup');
  const svg = diagram.locator('svg[role="img"]');
  assert.equal(await svg.count(), 1, 'one locally generated SVG under StrictMode');
  assert.equal(await svg.isVisible(), true);
  assert.ok(await svg.locator('path, polygon, rect, use').count() > 5, 'local SVG contains puzzle stickers');
  assert.equal(await diagram.locator('svg circle[fill="red"], svg rect[x="8"][fill="#22a8cb"]').count(), 0, 'local generation takes precedence over stored and formula-key images');
  const integrity = await svg.evaluate(svg => {
    const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    const invalid = [];
    let references = 0;
    const verify = id => {
      references++;
      const target = svg.getElementById(id);
      if (!target || target.closest('svg') !== svg || document.getElementById(id) !== target) invalid.push(id);
    };
    for (const node of [svg, ...svg.querySelectorAll('*')]) {
      for (const attribute of node.attributes) {
        if (attribute.localName === 'href') {
          if (attribute.value.startsWith('#')) verify(attribute.value.slice(1));
          else invalid.push(attribute.value);
        }
      }
      const values = [...node.attributes].map(attribute => attribute.value);
      if (node.localName === 'style') values.push(node.textContent);
      for (const value of values) for (const match of value.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
        if (match[1].startsWith('#')) verify(match[1].slice(1));
        else invalid.push(match[1]);
      }
    }
    return {duplicates, invalid, references, undefinedStops: [...svg.querySelectorAll('stop')].filter(stop => /undefined/i.test(stop.outerHTML)).length};
  });
  assert.deepEqual(integrity.duplicates, [], 'same-page practice SVG IDs are unique');
  assert.deepEqual(integrity.invalid, [], 'practice href/url references resolve inside their own SVG');
  assert.equal(integrity.undefinedStops, 0, 'any vendor gradient stops have valid colors');
  // Fixtures own these setups: recent/history rows are R U; live questions use
  // the displayed source text. Never derive the reference from diagram output.
  const setup = expectedSetup ?? await scope.locator('.fp-scramble').textContent();
  const actual = await svg.screenshot();
  const bounds = await svg.boundingBox();
  await svg.evaluate((svg, {setup,bounds}) => {
    const host = document.createElement('div');
    host.dataset.testid = 'practice-vendor-reference';
    host.style.cssText = `position:fixed;left:${bounds.x}px;top:${bounds.y}px;width:${bounds.width}px;height:${bounds.height}px;background:white;z-index:2147483647`;
    host.innerHTML = window.practiceVendorReference(setup);
    host.querySelector('svg').setAttribute('width','100%');
    host.querySelector('svg').setAttribute('height','100%');
    document.body.append(host);
  }, {setup,bounds});
  const reference = scope.page().getByTestId('practice-vendor-reference').locator('svg');
  try {
    const geometry = svg => ({viewBox:svg.getAttribute('viewBox'),nodes:[...svg.querySelectorAll('path,polygon,rect')].map(node => {
      const box = node.getBBox(), style = getComputedStyle(node);
      return {tag:node.localName,shape:['d','points','x','y','width','height','transform'].map(key => node.getAttribute(key)),
        box:[box.x,box.y,box.width,box.height],fill:style.fill,stroke:style.stroke};
    })});
    assert.deepEqual(await svg.evaluate(geometry),await reference.evaluate(geometry),'practice 2D matches the direct vendor plan for the recorded setup');
    const expected = await reference.screenshot();
    const pixels = await scope.page().evaluate(async images => {
      const samples = await Promise.all(images.map(async base64 => {
        const image = await createImageBitmap(await (await fetch('data:image/png;base64,'+base64)).blob());
        const canvas = document.createElement('canvas'); canvas.width=image.width; canvas.height=image.height;
        const context = canvas.getContext('2d'); context.drawImage(image,0,0); image.close();
        return {width:canvas.width,height:canvas.height,data:context.getImageData(0,0,canvas.width,canvas.height).data};
      }));
      if (samples[0].width !== samples[1].width || samples[0].height !== samples[1].height) throw new Error('Practice screenshot dimensions differ');
      let changed=0,colored=0;
      for (let i=0;i<samples[0].data.length;i+=4) {
        if ([0,1,2,3].some(channel => Math.abs(samples[0].data[i+channel]-samples[1].data[i+channel])>12)) changed++;
        if (samples[0].data[i+3]>128 && Math.max(...samples[0].data.slice(i,i+3))-Math.min(...samples[0].data.slice(i,i+3))>30) colored++;
      }
      return {changed,colored,total:samples[0].width*samples[0].height};
    }, [actual,expected].map(png => png.toString('base64')));
    assert.ok(pixels.colored>10,'practice thumbnail paints real colored pixels');
    assert.ok(pixels.changed/pixels.total<0.005,`practice upstream screenshot pixels: ${JSON.stringify(pixels)}`);
  } finally { await scope.page().getByTestId('practice-vendor-reference').evaluateAll(nodes => nodes.forEach(node => node.remove())); }
}
try {
  const interactionContext = await browser.newContext({viewport: {width: 1440, height: 900}});
  const interaction = await interactionContext.newPage();
  interaction.on('pageerror', error => errors.push(error.message));
  await interaction.goto(origin);
  const interactionDialog = interaction.getByRole('dialog');
  const interactionTimer = interaction.locator('.fp-timer');
  const interactionPhase = name => waitInBrowser(interaction, `interaction timer ${name}`, name =>
    document.querySelector('.fp-timer')?.classList.contains('fp-timer-' + name), name);
  const timerFocused = () => waitInBrowser(interaction, 'timer focus restored without test focus()', () =>
    document.activeElement === document.querySelector('.fp-timer'));
  const settleInput = () => interaction.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  let interactionSaves = 0;
  async function assertInteractionSaves() {
    assert.equal(await interaction.evaluate(() => window.practiceTest.appends.length), interactionSaves, 'one append per completed solve, none for control activation/interruption');
    assert.equal(await interaction.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'PLL')), interactionSaves, 'committed result count matches completed solves');
  }
  // Deliberately never focus the timer here: these solves depend on production focus restoration.
  async function solveFromRestoredFocus() {
    await timerFocused();
    await interaction.keyboard.down('Space'); await interactionPhase('armed');
    await interaction.keyboard.up('Space'); await interactionPhase('running');
    await assertInteractionSaves();
    await interaction.keyboard.down('Space');
    await interaction.keyboard.up('Space'); await interactionPhase('ready');
    interactionSaves++;
    await settleInput(); await interactionPhase('ready'); await assertInteractionSaves();
    await waitInBrowser(interaction, 'recent results refreshed', () => document.querySelector('.fp-stats')?.getAttribute('aria-busy') === 'false');
  }
  async function tabTo(button) {
    // Reach the control with real Tab navigation, including the modal focus trap.
    for (let i = 0; i < 80; i++) {
      await interaction.keyboard.press('Tab');
      if (await button.evaluate(element => element === document.activeElement)) return;
    }
    assert.fail('proficiency control must be reachable with Tab');
  }
  async function selectProficiencyWithSpace(button, restoresTimer) {
    const isReminder = await button.evaluate(element => Boolean(element.closest('.fp-reminder')));
    const label = await button.textContent();
    button = button.locator('..').getByRole('button', {name: label, exact: true});
    assert.notEqual(await button.getAttribute('aria-pressed'), 'true', 'exercise an actual proficiency change');
    await tabTo(button);
    await interaction.keyboard.down('Space');
    assert.equal(await button.getAttribute('aria-pressed'), 'false', 'native Space activation waits for keyup');
    if (restoresTimer) await interactionPhase('ready');
    await assertInteractionSaves();
    await interaction.keyboard.up('Space');
    if (isReminder) {
      assert.equal(await reminder.count(), 0, 'keyup selection dismisses the reminder');
      assert.equal(await recent.getByRole('button', {name: label, exact: true}).getAttribute('aria-pressed'), 'true', 'keyup updates completed formula proficiency');
    } else assert.equal(await button.getAttribute('aria-pressed'), 'true', 'keyup selects proficiency');
    await settleInput();
    await assertInteractionSaves();
    if (restoresTimer) {
      await timerFocused(); await interactionPhase('ready');
      await solveFromRestoredFocus();
    } else {
      assert.equal(await button.evaluate(element => element === document.activeElement), true, 'non-main selection retains control focus');
      assert.equal(await interactionTimer.count(), 0, 'history/detail cannot expose an active timer');
    }
  }
  await assertWindowPracticeDialog(interaction);
  assert.equal(await interaction.evaluate(() => document.fullscreenElement), null, 'window-filling layout needs no native fullscreen');
  assert.equal(await interactionDialog.getByRole('radio', {name: '权重随机', exact: true}).isChecked(), true);
  await interactionDialog.getByRole('checkbox', {name: '完成后提醒标记熟练度', exact: true}).check();
  const configCase = interactionDialog.getByRole('checkbox', {name: 'Case 4', exact: true});
  await configCase.focus(); await interaction.keyboard.press('Space');
  assert.equal(await configCase.isChecked(), false, 'configuration checkbox consumes Space');
  await interaction.keyboard.press('Space');
  assert.equal(await configCase.isChecked(), true);
  const configRange = interactionDialog.getByRole('slider');
  await configRange.focus(); await interaction.keyboard.press('Space'); await interaction.keyboard.press('ArrowRight');
  assert.equal(await configRange.inputValue(), '6', 'configuration range receives its own keyboard input');
  assert.equal(await interaction.evaluate(() => window.practiceTest.creates.length), 0);
  await assertInteractionSaves();
  await interactionDialog.getByRole('button', {name: '开始练习', exact: true}).click(); await interactionPhase('ready');
  await solveFromRestoredFocus();
  const reminder = interaction.locator('.fp-reminder');
  await reminder.getByRole('button', {name: '熟练', exact: true}).click();
  await timerFocused(); await interactionPhase('ready');
  assert.equal(await reminder.count(), 0, 'mouse selection dismisses the completed-result reminder');
  await solveFromRestoredFocus();
  const recent = interaction.locator('.fp-record').first();
  const recentUnknown = recent.getByRole('button', {name: '完全不会', exact: true});
  await recentUnknown.click();
  assert.equal(await recentUnknown.getAttribute('aria-pressed'), 'true');
  await timerFocused(); await interactionPhase('ready'); await solveFromRestoredFocus();
  await selectProficiencyWithSpace(reminder.getByRole('button', {name: '完全熟练', exact: true}), true);
  await selectProficiencyWithSpace(recent.getByRole('button', {name: '不熟练', exact: true}), true);
  console.log('PASS reminder/recent proficiency clicks restore timer focus; native Tab/Space keyup selection never starts timing, next Space solve saves exactly once');

  await interactionDialog.getByRole('button', {name: /查看全部/}).click();
  await interaction.locator('.fp-pagination').waitFor();
  await selectProficiencyWithSpace(interaction.locator('.fp-record').first().locator('.fp-proficiency button[aria-pressed="false"]').first(), false);
  await interaction.locator('.fp-record-open').first().click();
  await interaction.locator('.fp-detail').waitFor();
  await selectProficiencyWithSpace(interaction.locator('.fp-detail .fp-proficiency button[aria-pressed="false"]').first(), false);
  await interactionDialog.getByRole('button', {name: '返回', exact: true}).click();
  await interaction.locator('.fp-pagination').waitFor();
  await interactionDialog.getByRole('button', {name: '返回', exact: true}).click(); await interactionPhase('ready');
  await timerFocused(); await assertInteractionSaves();
  console.log('PASS history/detail proficiency keyup stays isolated; config checkbox/range input remains usable without starting a session');

  const sessionBeforeFullscreen = await interaction.evaluate(() => window.practiceTest.creates.length);
  const questionBeforeFullscreen = await interaction.locator('.fp-stage-top').textContent();
  async function enterFullscreen(label = '全屏', exitLabel = '退出全屏') {
    await interactionDialog.getByRole('button', {name: label, exact: true}).click();
    await waitInBrowser(interaction, 'real Chromium root fullscreen', () => document.fullscreenElement === document.documentElement);
    const exit = interactionDialog.getByRole('button', {name: exitLabel, exact: true});
    await exit.waitFor();
    assert.equal(await exit.getAttribute('aria-pressed'), 'true');
    await timerFocused(); await interactionPhase('ready');
    await assertWindowPracticeDialog(interaction);
  }
  await enterFullscreen();
  await solveFromRestoredFocus();
  const questionAfterFullscreenSolve = await interaction.locator('.fp-stage-top').textContent();
  await interactionDialog.getByRole('button', {name: '退出全屏', exact: true}).click();
  await waitInBrowser(interaction, 'native fullscreen exit', () => document.fullscreenElement === null);
  await interactionDialog.getByRole('button', {name: '全屏', exact: true}).waitFor();
  await timerFocused(); await interactionPhase('ready'); await assertInteractionSaves();
  assert.equal(await interactionDialog.isVisible(), true, 'exit keeps the modal open');
  assert.equal(await interaction.locator('.fp-stage-top').textContent(), questionAfterFullscreenSolve, 'exit keeps the current question');
  assert.equal(await interaction.evaluate(() => window.practiceTest.creates.length), sessionBeforeFullscreen, 'fullscreen does not replace the practice session');
  assert.notEqual(questionAfterFullscreenSolve, questionBeforeFullscreen, 'fullscreen solve advances the practice question');
  await assertWindowPracticeDialog(interaction);

  await enterFullscreen();
  await interaction.keyboard.down('Space'); await interactionPhase('armed');
  await interaction.evaluate(() => document.exitFullscreen());
  await interactionPhase('ready'); await timerFocused();
  await interaction.keyboard.up('Space'); await settleInput(); await interactionPhase('ready'); await assertInteractionSaves();
  await enterFullscreen();
  await interaction.keyboard.down('Space'); await interactionPhase('armed');
  await interaction.keyboard.up('Space'); await interactionPhase('running');
  await interaction.evaluate(() => document.exitFullscreen());
  await interactionPhase('ready'); await timerFocused(); await assertInteractionSaves();
  await enterFullscreen();
  await interaction.keyboard.down('Space'); await interactionPhase('armed');
  await interaction.keyboard.up('Space'); await interactionPhase('running');
  await interaction.keyboard.press('Escape'); await interactionPhase('ready');
  assert.equal(await interactionDialog.isVisible(), true, 'Escape interrupts without closing the practice modal');
  await assertInteractionSaves();
  if (await interaction.evaluate(() => document.fullscreenElement !== null)) {
    await interactionDialog.getByRole('button', {name: '退出全屏', exact: true}).click();
  }
  await waitInBrowser(interaction, 'fullscreen exit after Escape', () => document.fullscreenElement === null);
  await enterFullscreen();
  const questionBeforeClose = await interaction.locator('.fp-stage-top').textContent();
  await interactionDialog.getByRole('button', {name: '关闭练习器', exact: true}).click();
  await interactionDialog.waitFor({state: 'hidden'});
  await waitInBrowser(interaction, 'closing exits owned fullscreen', () => document.fullscreenElement === null);
  await interaction.getByRole('button', {name: 'Reopen', exact: true}).click(); await interactionPhase('ready');
  assert.equal(await interaction.locator('.fp-stage-top').textContent(), questionBeforeClose);
  assert.equal(await interaction.evaluate(() => window.practiceTest.creates.length), sessionBeforeFullscreen);
  await assertInteractionSaves();
  console.log('PASS real Chromium requestFullscreen/exit on document root, usable timer, session/results retained, armed/running fullscreenchange and Escape interrupt without saves, close exits owned fullscreen');

  for (const locale of ['zh-CN', 'en-US']) {
    await interaction.evaluate(locale => window.setPracticeLocale(locale), locale);
    const enterLabel = locale === 'zh-CN' ? '全屏' : 'Fullscreen';
    const exitLabel = locale === 'zh-CN' ? '退出全屏' : 'Exit fullscreen';
    await interactionDialog.getByRole('button', {name: enterLabel, exact: true}).waitFor();
    await enterFullscreen(enterLabel, exitLabel);
    await interactionDialog.getByRole('button', {name: exitLabel, exact: true}).click();
    await waitInBrowser(interaction, 'localized fullscreen exit', () => document.fullscreenElement === null);
    for (const fault of ['denied', 'unsupported']) {
      // Only fault paths are injected; successful fullscreen above always uses Chromium's native APIs.
      await interaction.evaluate(fault => {
        window.practiceFullscreenAttempts = 0;
        Object.defineProperty(document.documentElement, 'requestFullscreen', {configurable: true, value: fault === 'unsupported' ? undefined : () => {
          window.practiceFullscreenAttempts++;
          return Promise.reject(new DOMException('Test fullscreen denial', 'NotAllowedError'));
        }});
      }, fault);
      await interactionDialog.getByRole('button', {name: enterLabel, exact: true}).click();
      const unavailable = locale === 'zh-CN' ? '浏览器暂不支持或未允许全屏，已保持窗口内全屏练习。' : 'Browser fullscreen is unavailable or was denied. Practice still fills the window.';
      await interactionDialog.getByRole('status').filter({hasText: unavailable}).waitFor();
      assert.equal(await interaction.evaluate(() => window.practiceFullscreenAttempts), fault === 'denied' ? 1 : 0);
      assert.equal(await interaction.evaluate(() => document.fullscreenElement), null);
      assert.equal(await interactionDialog.getByRole('button', {name: enterLabel, exact: true}).getAttribute('aria-pressed'), 'false');
      await assertWindowPracticeDialog(interaction); await timerFocused();
      await solveFromRestoredFocus();
      await interaction.evaluate(() => { delete document.documentElement.requestFullscreen; });
    }
  }
  await interaction.evaluate(() => window.setPracticeLocale('zh-CN'));
  await interactionDialog.getByRole('button', {name: '全屏', exact: true}).waitFor();
  await interactionContext.close();
  console.log('PASS zh/en fullscreen and exit labels, denied/unsupported notices, 100dvh fallback and continued timing');

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(origin);
  let attempts = 0;
  const negativeStart = performance.now();
  await assert.rejects(poll('practice async false control', async () => {
    attempts++;
    return await page.evaluate(async () => { await new Promise(resolve => setTimeout(resolve, 10)); return false; });
  }, {timeout: 250, interval: 20}), {name: 'TimeoutError'});
  assert.ok(attempts >= 2 && performance.now() - negativeStart >= 250, 'Node polling awaits false promises and retries until timeout');
  const dialog = page.getByRole('dialog');
  await assertIconClose(page, dialog.getByRole('button', { name: '关闭练习器', exact: true }));
  const timer = page.locator('.fp-timer');
  const phase = async (name) => {
    try { await poll(`timer phase ${name}`, () => page.evaluate(name => document.querySelector('.fp-timer')?.classList.contains('fp-timer-' + name) === true, name), {timeout: 8000}); }
    catch (error) { console.error('PHASE FAILURE', name, await page.evaluate(() => ({ text: document.querySelector('[role=dialog]')?.textContent, active: document.activeElement?.outerHTML, timer: document.querySelector('.fp-timer')?.outerHTML })), errors); throw error; }
  };
  const start = async () => { await timer.focus(); await page.keyboard.down('Space'); await phase('armed'); await page.keyboard.up('Space'); await phase('running'); };
  const stop = async () => { await page.keyboard.press('KeyA'); await phase('ready'); };
  assert.equal(await page.evaluate(() => window.practiceTest.creates.length), 0);
  await dialog.getByRole('radio', { name: '按顺序', exact: true }).check();
  await dialog.getByRole('button', { name: '开始练习', exact: true }).click();
  await phase('ready');
  await dialog.getByRole('button', { name: '题目详情', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.locator('.fp-detail').waitFor();
  assert.equal(await dialog.getByRole('heading', { name: '题目详情', exact: true }).count(), 1);
  assert.equal(await page.locator('.fp-detail').getByRole('button', { name: '3D', exact: true }).getAttribute('aria-pressed'), 'true', 'auto defaults interactive details to 3D');
  await assertManagedPlayer(page.locator('.fp-detail'));
  await page.locator('.fp-detail').getByRole('button', { name: '2D', exact: true }).click();
  await assertLocalDiagram(page.locator('.fp-detail'));
  assert.equal(await page.locator('.fp-detail .fp-alg').textContent(), "R U R' U'");
  assert.equal(await dialog.getByRole('button', { name: '删除记录', exact: true }).count(), 0);
  assert.equal(await page.locator('.fp-detail .fp-mean').count(), 0);
  assert.equal(await page.locator('.fp-detail').textContent().then(text => text.includes('1970')), false);
  await dialog.getByRole('button', { name: '完全熟练', exact: true }).click();
  assert.equal(await dialog.getByRole('button', { name: '完全熟练', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(() => window.practiceTest.appends.length), 0);
  await dialog.getByRole('button', { name: '返回', exact: true }).click();
  await phase('ready');
  assert.equal(await page.locator('.fp-stage-top').textContent().then(text => text.includes('1 / 4')), true);
  console.log('PASS accessible current-question details, diagram/answer/proficiency, no fake timestamp or deletion, keyboard isolation');
  await start();
  await page.keyboard.down('Space');
  await page.keyboard.up('Space');
  await phase('ready');
  assert.equal(await page.evaluate(() => window.practiceTest.appends.length), 1);
  assert.equal(await page.evaluate(() => window.practiceTest.appends[0][3].formulaName), 'Case 1');
  assert.equal(await page.locator('.fp-stage-top').textContent().then((text) => text.includes('2 / 4')), true);
  await dialog.getByRole('button', { name: '关闭练习器', exact: true }).click();
  await page.getByRole('button', { name: 'Reopen', exact: true }).click();
  await phase('ready');
  assert.equal(await page.evaluate(() => window.practiceTest.creates.length), 1);
  assert.equal(await page.locator('.fp-stage-top').textContent().then((text) => text.includes('2 / 4')), true);
  await dialog.getByRole('button', { name: '练习配置', exact: true }).click();
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(() => window.practiceTest.appends.length), 1);
  await dialog.getByRole('button', { name: '继续练习', exact: true }).click();
  await phase('ready');
  assert.equal(await page.evaluate(() => window.practiceTest.creates.length), 1);
  console.log('PASS initial configuration, press/release timing, single save, close/reopen continuation, configuration keyboard isolation');

  await page.evaluate(() => { window.practiceTest.failAppend = true; });
  await start();
  await page.keyboard.press('KeyS');
  await phase('error');
  const failed = await page.evaluate(() => window.practiceTest.appends.at(-1));
  await dialog.getByRole('button', { name: '关闭练习器', exact: true }).click();
  assert.equal(await dialog.isVisible(), true);
  assert.equal(await dialog.getByText('请先完成成绩保存，再关闭或修改配置。', { exact: true }).isVisible(), true);
  await page.evaluate(() => { window.practiceTest.failAppend = false; window.practiceTest.delayAppend = true; });
  await dialog.getByRole('button', { name: '重试', exact: true }).click();
  await phase('saving');
  await page.keyboard.press('Space');
  await page.evaluate(() => { window.practiceTest.delayAppend = false; window.practiceTest.releaseAppend(); });
  await phase('ready');
  assert.deepEqual(await page.evaluate(() => window.practiceTest.appends.at(-1)), failed);
  assert.equal(await page.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'PLL')), 2);
  console.log('PASS failed save retains exact input/session, close blocked, delayed retry commits once');

  // Native Enter must start, not start and immediately stop through the document listener.
  await timer.focus(); await page.keyboard.press('Enter'); await phase('running');
  await timer.dispatchEvent('keydown', { code: 'KeyS', key: 's', repeat: true, bubbles: true });
  await phase('running');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await phase('ready');
  assert.equal(await page.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'PLL')), 2);
  await timer.focus(); await page.keyboard.down('Space'); await phase('armed');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.keyboard.up('Space'); await phase('ready');
  await timer.focus(); await page.keyboard.down('Space'); await phase('armed');
  await page.keyboard.down('Space'); await phase('armed');
  await page.keyboard.up('Space'); await phase('running');
  await page.keyboard.press('KeyS'); await phase('ready');
  const afterRepeat = await page.evaluate(() => window.practiceTest.appends.length);
  await page.keyboard.down('Space'); await phase('armed');
  await page.keyboard.up('Space'); await phase('running');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.hidden;
  });
  await phase('ready');
  assert.equal(await page.evaluate(() => window.practiceTest.appends.length), afterRepeat);
  await start(); await page.keyboard.press('Escape'); await phase('ready');
  assert.equal(await dialog.isVisible(), true);
  console.log('PASS Enter activation, repeat filtering, blur during armed/running, Escape interruption without false records');

  // Simulated primary pointer sequence also verifies ownership and cancellation.
  await timer.dispatchEvent('pointerdown', { pointerId: 11, isPrimary: true, button: 2 });
  await phase('ready');
  await timer.dispatchEvent('pointerdown', { pointerId: 12, isPrimary: false, button: 0 });
  await phase('ready');
  await timer.evaluate((element) => { element.setPointerCapture = () => {}; element.hasPointerCapture = () => false; });
  await timer.dispatchEvent('pointerdown', { pointerId: 13, isPrimary: true, button: 0 });
  await phase('armed');
  await timer.dispatchEvent('pointerup', { pointerId: 14, isPrimary: true, button: 0 });
  await phase('armed');
  await timer.dispatchEvent('pointercancel', { pointerId: 13, isPrimary: true, button: 0 });
  await phase('ready');
  await timer.dispatchEvent('pointerup', { pointerId: 13, isPrimary: true, button: 0 });
  await phase('ready');
  console.log('PASS right-click, multi-pointer filtering, pointer ownership and pointercancel');

  await page.evaluate(() => { window.practiceTest.failSummary = true; });
  await start(); await stop();
  await page.locator('.fp-notice').filter({ hasText: '历史加载失败。计时和成绩保存不受影响，请重试加载。' }).waitFor();
  const savesAfterReadFailure = await page.evaluate(() => window.practiceTest.appends.length);
  await page.evaluate(() => { window.practiceTest.failSummary = false; });
  await dialog.getByRole('button', { name: '重试', exact: true }).click();
  await waitInBrowser(page, 'history retry clears notice', () => !document.querySelector('.fp-notice')?.textContent.includes('历史加载失败'));
  assert.equal(await page.evaluate(() => window.practiceTest.appends.length), savesAfterReadFailure);
  console.log('PASS committed write survives statistics read failure without append retry');

  await page.evaluate(async () => {
    const records = Array.from({ length: 1045 }, (_, i) => ({ id: `seed-${i}`, createdAt: i + 1, timeMs: 1000 + i, formulaKey: 'Set:Group:Case 1', formulaName: `Seed ${i}`, setName: 'Set', groupName: 'Group', scramble: 'R U', scrambleIndex: 0, image: '', algs: ['R U'] }));
    records[1044].image = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><circle cx="30" cy="30" r="20" fill="red"/></svg>';
    await window.importHistory({ '333-PLL': { version: 2, sessions: [{ id: 'seed-session', createdAt: 1, mode: 'sequential', selectedFormulas: [], records }] } });
    window.setPracticeProps({ open: false });
  });
  await page.getByRole('button', { name: 'Reopen', exact: true }).click();
  await waitInBrowser(page, '1000-result statistics', () => document.querySelector('.fp-stats')?.textContent.includes('近 1000 次均值'));
  assert.equal(await page.locator('.fp-mean').textContent(), '01.54');
  await assertLocalDiagram(page.locator('.fp-record').first(),'R U');
  await assertLocalDiagram(page.locator('.fp-record').nth(1),'R U');
  assert.equal(await page.locator('.fp-stats').textContent().then((text) => text.includes('1000 / 1000 次')), false);
  await dialog.getByRole('button', { name: /查看全部/ }).click();
  await waitInBrowser(page, '20 history rows', () => document.querySelectorAll('.fp-record').length === 20);
  await assertLocalDiagram(page.locator('.fp-record').first(),'R U');
  await page.locator('.fp-record-open').first().click();
  await page.locator('.fp-detail').waitFor();
  await page.locator('.fp-detail').getByRole('button', { name: '2D', exact: true }).click();
  await assertLocalDiagram(page.locator('.fp-detail'));
  await dialog.getByRole('button', { name: '返回', exact: true }).click();
  await dialog.getByRole('button', { name: '下一页', exact: true }).click();
  await waitInBrowser(page, 'history page two', () => document.querySelector('.fp-pagination')?.textContent.includes('第 2 / 53 页'));
  assert.equal(await page.evaluate(() => window.practiceTest.pages.at(-1)[2]), 2);
  assert.equal(await page.evaluate(() => window.practiceTest.pages.at(-1)[3]), 20);
  for (const record of await page.locator('.fp-record').all()) await assertLocalDiagram(record,'R U');
  await page.locator('.fp-record-open').first().focus(); await page.keyboard.press('Enter');
  await page.locator('.fp-detail').waitFor();
  await page.locator('.fp-detail').getByRole('button', { name: '2D', exact: true }).click();
  await assertLocalDiagram(page.locator('.fp-detail'));
  assert.equal(await page.getByRole('dialog').count(), 1);
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(() => window.practiceTest.appends.length), savesAfterReadFailure);
  await dialog.getByRole('button', { name: '删除记录', exact: true }).click();
  await page.locator('.fp-confirm').waitFor();
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  assert.equal(await page.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'PLL')), 1045);
  await dialog.getByRole('button', { name: '返回', exact: true }).click();
  await page.locator('.fp-pagination').waitFor();
  await page.locator('.fp-record-open').first().click();
  await dialog.getByRole('button', { name: '删除记录', exact: true }).click();
  await page.evaluate(() => { window.practiceTest.failDelete = true; });
  await dialog.getByRole('button', { name: '确认', exact: true }).click();
  await dialog.getByText('操作未完成，请重试。', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'PLL')), 1045);
  await page.evaluate(() => { window.practiceTest.failDelete = false; });
  await dialog.getByRole('button', { name: '确认', exact: true }).click();
  await waitInBrowser(page, 'record deletion updates pagination', () => document.querySelector('.fp-pagination')?.textContent.includes('1044'));
  await dialog.getByRole('button', { name: '清空历史', exact: true }).click();
  await page.locator('.fp-confirm').waitFor();
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  assert.equal(await page.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'PLL')), 1044);
  await dialog.getByRole('button', { name: '清空历史', exact: true }).click();
  await page.evaluate(() => { window.practiceTest.failClear = true; });
  await dialog.getByRole('button', { name: '确认', exact: true }).click();
  await dialog.getByText('操作未完成，请重试。', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'PLL')), 1044);
  await page.evaluate(() => { window.practiceTest.failClear = false; });
  await dialog.getByRole('button', { name: '确认', exact: true }).click();
  await waitInBrowser(page, 'cleared history', () => document.querySelector('.fp-body')?.textContent.includes('暂无练习记录'));
  await dialog.getByRole('button', { name: '返回', exact: true }).click();
  await phase('ready');
  await start(); await stop();
  assert.equal(await page.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'PLL')), 1);
  console.log('PASS real IndexedDB pagination over 1045 rows, bounded 1000-result statistics, keyboard details, delete/clear confirmation, rebuilt session');
  console.log('PASS real local diagrams override stored/empty images in recent, paged history and record details');

  // Pending old-library writes and reads cannot update the active library.
  await page.evaluate(() => { window.practiceTest.delayAppend = true; });
  await start(); await page.keyboard.press('KeyS'); await phase('saving');
  await page.evaluate(() => window.setPracticeProps({ classId: 'OLL' }));
  await dialog.getByRole('button', { name: '开始练习', exact: true }).click(); await phase('ready');
  await page.evaluate(() => { window.practiceTest.delayAppend = false; window.practiceTest.releaseAppend(); });
  await waitInBrowser(page, 'active OLL library', () => document.querySelector('.fp-meta')?.textContent.includes('OLL'));
  assert.equal(await page.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'OLL')), 0);
  assert.equal(await page.locator('.fp-stage-top').textContent().then((text) => text.includes('1 / 4')), true);
  await page.evaluate(() => { window.practiceTest.delaySummary = 'OLL'; window.setPracticeProps({ open: false }); });
  await page.getByRole('button', { name: 'Reopen', exact: true }).click();
  await waitInBrowser(page, 'pending summary release', () => Boolean(window.practiceTest.releaseSummary));
  await page.evaluate(() => window.setPracticeProps({ classId: 'Other' }));
  await page.evaluate(() => window.practiceTest.releaseSummary());
  await dialog.getByRole('button', { name: '开始练习', exact: true }).click(); await phase('ready');
  assert.equal(await page.locator('.fp-meta').first().textContent().then((text) => text.includes('Other')), true);
  assert.equal(await page.locator('.fp-stats').textContent().then((text) => text.includes('近 0 次均值')), true);
  console.log('PASS old-library delayed saves and summary results cannot update new-library UI');

  // Configuration changes are staged, produce a new session only on confirmation,
  // and return to the active snapshot when the uncommitted draft is closed.
  const initialCreates = await page.evaluate(() => window.practiceTest.creates.length);
  await dialog.getByRole('button', { name: '练习配置', exact: true }).click();
  await dialog.getByRole('radio', { name: '随机', exact: true }).check();
  await dialog.getByRole('button', { name: '开始练习', exact: true }).click(); await phase('ready');
  assert.equal(await page.evaluate(() => window.practiceTest.creates.length), initialCreates + 1);
  assert.equal(await page.evaluate(() => window.practiceTest.creates.at(-1)[2].mode), 'random');
  await dialog.getByRole('button', { name: '练习配置', exact: true }).click();
  await dialog.getByRole('radio', { name: '权重随机', exact: true }).check();
  await dialog.getByRole('button', { name: '返回', exact: true }).click(); await phase('ready');
  assert.equal(await page.evaluate(() => window.practiceTest.creates.length), initialCreates + 1);
  await dialog.getByRole('button', { name: '练习配置', exact: true }).click();
  assert.equal(await dialog.getByRole('radio', { name: '随机', exact: true }).isChecked(), true);
  await dialog.getByRole('radio', { name: '权重随机', exact: true }).check();
  await dialog.getByRole('button', { name: '关闭练习器', exact: true }).click();
  await page.getByRole('button', { name: 'Reopen', exact: true }).click(); await phase('ready');
  assert.equal(await page.locator('.fp-stage-top').textContent().then(text => text.includes('随机')), true);
  assert.equal(await page.evaluate(() => window.practiceTest.creates.length), initialCreates + 1);
  await dialog.getByRole('button', { name: '练习配置', exact: true }).click();
  await dialog.getByRole('slider').fill('12');
  await dialog.getByRole('checkbox', { name: 'Case 4', exact: true }).uncheck();
  await page.evaluate(() => { window.practiceTest.failCreate = true; });
  await dialog.getByRole('button', { name: '开始练习', exact: true }).click();
  await dialog.getByText('会话创建失败，请重试。', { exact: false }).waitFor();
  await page.evaluate(() => { window.practiceTest.failCreate = false; });
  await dialog.getByRole('button', { name: '重试', exact: true }).click(); await phase('ready');
  assert.equal(await page.evaluate(() => window.practiceTest.creates.at(-1)[2].selectedFormulas.length), 3);
  await dialog.getByRole('button', { name: '显示答案', exact: true }).click();
  await assertLocalDiagram(page.locator('.fp-answer-content'),await page.locator('.fp-scramble').textContent());
  await dialog.getByRole('button', { name: '隐藏答案', exact: true }).click();
  assert.equal(await page.locator('.fp-answer-content').count(), 0);
  await page.evaluate(() => window.setPracticeProps({ flatAlgs: [{ setName: 'Set', groupName: 'Group', alg: { name: 'Case 1', scrambles: ['NEW QUESTION'], algs: ['NEW ANSWER'], image: '' } }] }));
  await page.locator('.fp-config').waitFor();
  await dialog.getByRole('button', { name: '开始练习', exact: true }).click(); await phase('ready');
  assert.equal(await page.locator('.fp-scramble').textContent(), 'NEW QUESTION');
  await start(); await stop();
  assert.equal(await page.evaluate(() => window.practiceTest.appends.at(-1)[3].scramble), 'NEW QUESTION');
  assert.deepEqual(await page.evaluate(() => window.practiceTest.appends.at(-1)[3].algs), ['NEW ANSWER']);
  await page.evaluate(() => window.setPracticeLocale('en-US'));
  await dialog.getByRole('button', { name: 'Show answer', exact: true }).waitFor();
  assert.equal(await dialog.getByRole('button', { name: 'Close practice', exact: true }).count(), 1);
  await dialog.getByRole('button', { name: 'Practice setup', exact: true }).click();
  assert.equal(await dialog.getByRole('radio', { name: 'Weighted Random', exact: true }).count(), 1);
  await dialog.getByRole('button', { name: 'Resume practice', exact: true }).click(); await phase('ready');
  await page.evaluate(() => window.setPracticeLocale('zh-CN'));
  console.log('PASS staged mode/selection/trim configuration, create failure retry, content snapshot invalidation, answer visibility and zh/en resources');

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 420 : 820 });
    await assertWindowPracticeDialog(page);
    const metrics = await dialog.evaluate((element) => ({
      overflow: element.scrollWidth > element.clientWidth,
      outside: element.getBoundingClientRect().right > innerWidth + 1,
      height: element.getBoundingClientRect().height,
      screen: innerHeight,
    }));
    assert.equal(metrics.overflow, false, `dialog horizontal overflow at ${width}`);
    assert.equal(metrics.outside, false, `dialog outside viewport at ${width}`);
    assert.ok(metrics.height <= metrics.screen + 1, `dialog height at ${width}`);
  }
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({width, height: 320});
    await assertWindowPracticeDialog(page);
    await dialog.getByRole('button', {name: '练习配置', exact: true}).click();
    const body = page.locator('.fp-body');
    assert.equal(await body.evaluate(element => element.scrollHeight > element.clientHeight), true, `short-screen config scrolls at ${width}`);
    const resume = dialog.getByRole('button', {name: '继续练习', exact: true});
    await resume.scrollIntoViewIfNeeded();
    const accessibility = await resume.evaluate(element => {
      const body = element.closest('.fp-body'), bounds = element.getBoundingClientRect(), scrollBounds = body.getBoundingClientRect();
      const close = document.querySelector('.fp-close'), closeBounds = close.getBoundingClientRect();
      return {scrollTop: body.scrollTop, reachable: bounds.top >= scrollBounds.top - 1 && bounds.bottom <= innerHeight + 1,
        closeVisible: closeBounds.top >= 0 && closeBounds.bottom <= innerHeight && closeBounds.right <= innerWidth,
        closeHit: close.contains(document.elementFromPoint(closeBounds.x + closeBounds.width / 2, closeBounds.y + closeBounds.height / 2))};
    });
    assert.ok(accessibility.scrollTop > 0, `short-screen config can scroll to its last action at ${width}`);
    assert.equal(accessibility.reachable, true, `resume remains reachable at ${width}`);
    assert.equal(accessibility.closeVisible && accessibility.closeHit, true, `close stays visible and clickable after scrolling at ${width}`);
    await dialog.getByRole('button', {name: '关闭练习器', exact: true}).click();
    await dialog.waitFor({state: 'hidden'});
    await page.getByRole('button', {name: 'Reopen', exact: true}).click(); await phase('ready');
    await assertWindowPracticeDialog(page);
  }
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await dialog.getByRole('button', { name: '练习配置', exact: true }).click();
  for (const palette of ['haitian', 'qingdai', 'zheshi', 'zhulu', 'xiangye', 'qinglian', 'rulin', 'doukou']) {
    for (const theme of ['light', 'dark']) {
      await page.evaluate(({ palette, theme }) => { document.documentElement.dataset.palette = palette; document.documentElement.className = theme; }, { palette, theme });
      const colors = await dialog.evaluate(element => {
        const probe = document.createElement('span');
        element.appendChild(probe);
        const resolve = value => { probe.style.color = value; return getComputedStyle(probe).color; };
        const result = {
          background: getComputedStyle(element).backgroundColor, expectedBackground: resolve('var(--card)'),
          foreground: getComputedStyle(element).color, expectedForeground: resolve('var(--foreground)'),
          accent: getComputedStyle(element).getPropertyValue('--fp-accent').trim(), expectedAccent: getComputedStyle(element).getPropertyValue('--accent').trim(),
        };
        probe.remove(); return result;
      });
      assert.equal(colors.background, colors.expectedBackground, `${palette}/${theme} card`);
      assert.equal(colors.foreground, colors.expectedForeground, `${palette}/${theme} foreground`);
      assert.equal(colors.accent, colors.expectedAccent, `${palette}/${theme} accent`);
      const buttonColors = await dialog.getByRole('button', { name: '继续练习', exact: true }).evaluate(element => {
        const probe = document.createElement('span'); probe.style.color = 'var(--accent)'; element.appendChild(probe);
        const result = [getComputedStyle(element).backgroundColor, getComputedStyle(probe).color]; probe.remove(); return result;
      });
      assert.equal(buttonColors[0], buttonColors[1], `${palette}/${theme} brand button`);
    }
  }
  await dialog.getByRole('button', { name: '继续练习', exact: true }).click(); await phase('ready');
  console.log('PASS all eight palettes in light/dark use project card, foreground and accent tokens');
  await page.evaluate(() => { document.documentElement.className = 'dark'; });
  await page.setViewportSize({ width: 1440, height: 900 });
  if (process.env.PRACTICE_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.PRACTICE_SCREENSHOT_DIR}/formula-practice-desktop.png`, fullPage: true });
  await dialog.getByRole('button', { name: '练习配置', exact: true }).click();
  await dialog.getByRole('radio', { name: '不重复随机', exact: true }).check();
  await dialog.getByRole('button', { name: '开始练习', exact: true }).click(); await phase('ready');
  await start();
  await page.evaluate(() => window.practiceRoot.unmount());
  assert.equal(await page.evaluate(() => document.body.hasAttribute('data-scroll-lock')), false);
  console.log('PASS 320/390/768/1024/1440 layouts, short-screen scroll, dark/reduced-motion render, running unmount cleanup');

  const recoveryContext = await browser.newContext();
  const recoveryPage = await recoveryContext.newPage();
  recoveryPage.on('pageerror', error => errors.push(error.message));
  await recoveryPage.goto(origin);
  const recoveryDialog = recoveryPage.getByRole('dialog');
  const recoveryTimer = recoveryPage.locator('.fp-timer');
  const recoveryPhase = name => poll(`recovery phase ${name}`, () => recoveryPage.evaluate(name => document.querySelector('.fp-timer')?.classList.contains('fp-timer-' + name) === true, name), {timeout: 8000});
  const recoverySolve = async () => {
    await recoveryTimer.focus(); await recoveryPage.keyboard.down('Space'); await recoveryPhase('armed');
    await recoveryPage.keyboard.up('Space'); await recoveryPhase('running');
    await recoveryPage.keyboard.press('KeyS');
  };
  await recoveryDialog.getByRole('radio', { name: '按顺序', exact: true }).check();
  await recoveryDialog.getByRole('button', { name: '开始练习', exact: true }).click(); await recoveryPhase('ready');
  await recoveryDialog.getByRole('button', { name: '下一题', exact: true }).click();
  await recoveryDialog.getByRole('button', { name: '关闭练习器', exact: true }).click();
  await recoveryPage.evaluate(() => window.practiceHistory.clearFormulaPracticeHistory('333', 'PLL'));
  await recoveryPage.getByRole('button', { name: 'Reopen', exact: true }).click(); await recoveryPhase('ready');
  assert.equal(await recoveryPage.evaluate(() => window.practiceTest.creates.length), 1);
  await recoverySolve(); await recoveryPhase('ready');
  const clearCalls = await recoveryPage.evaluate(() => window.practiceTest.appends);
  assert.equal(clearCalls.length, 2);
  assert.notEqual(clearCalls[0][2], clearCalls[1][2]);
  assert.deepEqual(clearCalls[0][3], clearCalls[1][3]);
  assert.equal(clearCalls[1][3].formulaName, 'Case 2');
  assert.equal(typeof clearCalls[1][3].id, 'string');
  assert.equal(typeof clearCalls[1][3].createdAt, 'number');
  assert.equal(await recoveryPage.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'PLL')), 1);
  assert.equal(await recoveryPage.locator('.fp-stage-top').textContent().then(text => text.includes('3 / 4')), true);
  await recoveryDialog.getByRole('button', { name: '关闭练习器', exact: true }).click();
  await recoveryPage.evaluate(() => window.importHistory({ '333-PLL': { version: 2, sessions: [] } }));
  await recoveryPage.getByRole('button', { name: 'Reopen', exact: true }).click(); await recoveryPhase('ready');
  await recoveryPage.evaluate(() => { window.practiceTest.failCreate = true; });
  await recoverySolve(); await recoveryPhase('error');
  const pendingRecovery = await recoveryPage.evaluate(() => window.practiceTest.appends.at(-1)[3]);
  const createCount = await recoveryPage.evaluate(() => window.practiceTest.creates.length);
  await recoveryDialog.getByRole('button', { name: '关闭练习器', exact: true }).click();
  assert.equal(await recoveryDialog.isVisible(), true);
  assert.equal(await recoveryDialog.getByRole('button', { name: '练习配置', exact: true }).isDisabled(), true);
  assert.equal(await recoveryPage.evaluate(() => window.practiceTest.creates.length), createCount, 'create failure must not loop');
  assert.equal(await recoveryPage.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'PLL')), 0);
  await recoveryPage.evaluate(() => { window.practiceTest.failCreate = false; window.practiceTest.loseAppendAckOnce = true; });
  await recoveryDialog.getByRole('button', { name: '重试', exact: true }).click(); await recoveryPhase('error');
  assert.equal(await recoveryPage.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'PLL')), 1);
  const recoveredSession = await recoveryPage.evaluate(() => window.practiceTest.appends.at(-1)[2]);
  await recoveryDialog.getByRole('button', { name: '重试', exact: true }).click(); await recoveryPhase('ready');
  const finalCall = await recoveryPage.evaluate(() => window.practiceTest.appends.at(-1));
  assert.deepEqual(finalCall[3], pendingRecovery);
  assert.equal(finalCall[2], recoveredSession);
  assert.equal(await recoveryPage.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'PLL')), 1, 'lost acknowledgement retry must not duplicate committed result');
  assert.equal(await recoveryPage.locator('.fp-stage-top').textContent().then(text => text.includes('4 / 4')), true);
  await recoveryDialog.getByRole('button', { name: '练习配置', exact: true }).click();
  await recoveryDialog.getByRole('button', { name: '关闭练习器', exact: true }).click();
  await recoveryDialog.waitFor({ state: 'hidden' });
  await recoveryContext.close();
  console.log('PASS external clear/import then resume: missing session recreation, create failure retry, stable pending ID/time, lost-ack idempotency, close/config restored');

  const legacyContext = await browser.newContext();
  const legacy = await legacyContext.newPage();
  legacy.on('pageerror', error => errors.push(error.message));
  await legacy.goto(origin);
  await legacy.evaluate(async () => {
    const records = [
      { id: 'legacy-image', createdAt: 2, formulaName: 'Legacy image', image: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><circle cx="30" cy="30" r="20" fill="red"/></svg>' },
      { id: 'legacy-formula-image', createdAt: 1, formulaName: 'Legacy formula image', image: '' },
    ].map(record => ({ ...record, timeMs: 1000, formulaKey: 'Set:Group:Case 1', setName: 'Set', groupName: 'Group', scramble: '', scrambleIndex: 0, algs: [] }));
    await window.importHistory({ '333-PLL': { version: 2, sessions: [{ id: 'legacy-session', createdAt: 1, mode: 'sequential', selectedFormulas: [], records }] } });
    window.setPracticeProps({ open: false });
  });
  await legacy.getByRole('button', { name: 'Reopen', exact: true }).click();
  const legacyDialog = legacy.getByRole('dialog');
  await legacyDialog.getByRole('button', { name: '开始练习', exact: true }).click();
  const legacyImages = ['svg circle[fill="red"]', 'svg rect[x="8"][fill="#22a8cb"]'];
  async function assertLegacyImage(scope, selector) {
    // Preparation replaces the loading box with the fallback, changing row height.
    await scope.locator('.puzzle-diagram').evaluate(element => element.scrollIntoView({ block: 'nearest' }));
    await scope.locator(selector).waitFor();
    assert.equal(await scope.locator(selector).count(), 1, 'image-only legacy record retains its fallback');
    assert.equal(await scope.locator('svg[role="img"]').count(), 0, 'no generated state for an image-only record');
    assert.deepEqual(await scope.getByRole('alert').allTextContents(), []);
  }
  for (const [index, selector] of legacyImages.entries()) {
    await assertLegacyImage(legacy.locator('.fp-record').nth(index), selector);
  }
  await legacyDialog.getByRole('button', { name: /查看全部/ }).click();
  await legacy.locator('.fp-pagination').waitFor();
  for (const [index, selector] of legacyImages.entries()) {
    const record = legacy.locator('.fp-record').nth(index);
    await assertLegacyImage(record, selector);
    await record.locator('.fp-record-open').click();
    await legacy.locator('.fp-detail').getByRole('button', { name: '2D', exact: true }).click();
    await assertLegacyImage(legacy.locator('.fp-detail'), selector);
    await legacyDialog.getByRole('button', { name: '返回', exact: true }).click();
    await legacy.locator('.fp-pagination').waitFor();
  }
  assert.equal(await legacy.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'PLL')), 2);
  assert.equal(await legacy.evaluate(() => window.practiceTest.appends.length), 0);
  await legacyContext.close();
  console.log('PASS image-only legacy stored-image and formula-key fallbacks in recent, paged history and 2D details');

  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touch = await touchContext.newPage();
  touch.on('pageerror', (error) => errors.push(error.message));
  await touch.goto(origin);
  await touch.getByRole('button', { name: '开始练习', exact: true }).click();
  const touchTimer = touch.locator('.fp-timer');
  const box = await touchTimer.boundingBox();
  const cdp = await touchContext.newCDPSession(touch);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }] });
  await waitInBrowser(touch, 'touch armed', () => !!document.querySelector('.fp-timer-armed'));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await waitInBrowser(touch, 'touch running', () => !!document.querySelector('.fp-timer-running'));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await waitInBrowser(touch, 'touch ready', () => !!document.querySelector('.fp-timer-ready'));
  assert.equal(await touch.evaluate(() => window.practiceTest.appends.length), 1);
  if (process.env.PRACTICE_SCREENSHOT_DIR) await touch.screenshot({ path: `${process.env.PRACTICE_SCREENSHOT_DIR}/formula-practice-mobile.png`, fullPage: true });
  console.log('PASS mobile real touch down/hold/release/start/stop writes exactly once');
  await touchContext.close();

  const controls = await browser.newPage({viewport: {width: 320, height: 820}});
  controls.on('pageerror', error => errors.push(error.message));
  await controls.goto(`${origin}/controls`);
  const filter = controls.locator('.algs-filter-panel');
  const caseOne = filter.getByRole('button', {name: 'Case 1', exact: true});
  await caseOne.waitFor();
  assert.equal(await caseOne.getAttribute('aria-pressed'), 'true');
  await caseOne.focus(); await controls.keyboard.press('Space');
  assert.equal(await caseOne.getAttribute('aria-pressed'), 'false');
  const unselectedColors = await caseOne.evaluate(element => {
    const probe = document.createElement('span'); probe.style.color = 'var(--card)'; element.appendChild(probe);
    const result = [getComputedStyle(element).backgroundColor, getComputedStyle(probe).color]; probe.remove(); return result;
  });
  assert.equal(unselectedColors[0], unselectedColors[1], 'unselected filter uses the neutral card');
  assert.equal(await filter.getByText('(3/4)', {exact: true}).count(), 1);
  await filter.getByRole('button', {name: 'Group', exact: true}).click();
  await filter.getByRole('button', {name: 'Group', exact: true}).click();
  assert.equal(await caseOne.getAttribute('aria-pressed'), 'false', 'scope toggle preserves hidden formulas');
  await caseOne.focus(); await controls.keyboard.press('Enter');
  assert.equal(await caseOne.getAttribute('aria-pressed'), 'true');
  for (const width of [320, 768, 1440]) {
    await controls.setViewportSize({width, height: 820});
    const grids = await filter.locator('.algs-filter-grid').evaluateAll(elements => elements.map(grid => ({
      overflow: grid.scrollWidth > grid.clientWidth,
      buttons: [...grid.querySelectorAll('button')].map(button => ({tag: button.tagName, width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height, radius: getComputedStyle(button).borderRadius, font: getComputedStyle(button).fontSize, border: getComputedStyle(button).borderTopWidth, shadow: getComputedStyle(button).boxShadow, check: getComputedStyle(button.querySelector('.algs-filter-check')).visibility})),
    })));
    for (const grid of grids) {
      assert.equal(grid.overflow, false);
      for (const button of grid.buttons) {
        assert.equal(button.tag, 'BUTTON'); assert.ok(button.height >= 32);
        assert.equal(button.radius, '4px'); assert.equal(button.font, '12px');
        assert.equal(button.border, '1px'); assert.equal(button.shadow, 'none');
        assert.equal(button.check, 'visible');
        assert.ok(Math.abs(button.width - grid.buttons[0].width) < 1, 'filter columns are equal width');
      }
    }
  }
  const formulaSection = filter.locator('.algs-filter-section').nth(2);
  await formulaSection.getByRole('button', {name: '全不选', exact: true}).click();
  assert.equal(await caseOne.getAttribute('aria-pressed'), 'false');
  assert.equal(await caseOne.locator('.algs-filter-check').evaluate(element => getComputedStyle(element).visibility), 'hidden');
  await formulaSection.getByRole('button', {name: '全选', exact: true}).click();
  assert.equal(await caseOne.getAttribute('aria-pressed'), 'true');
  assert.equal(await caseOne.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(12, 58, 77)', 'selected filter uses the semantic dark accent fill');
  await controls.getByRole('button', {name: 'Open formula', exact: true}).click();
  const formulaDialog = controls.getByRole('dialog');
  const formulaClose = formulaDialog.getByRole('button', {name: 'Close', exact: true});
  assert.equal(await formulaDialog.getByRole('button', {name: '3D', exact: true}).getAttribute('aria-pressed'), 'true');
  await assertManagedPlayer(formulaDialog);
  await formulaDialog.getByRole('button', {name: '2D', exact: true}).click();
  const formulaDiagram = formulaDialog.locator('.puzzle-diagram');
  await formulaDiagram.locator('svg[role="img"], [role="alert"]').first().waitFor();
  assert.deepEqual(await formulaDiagram.getByRole('alert').allTextContents(), []);
  assert.equal(await formulaDiagram.getAttribute('data-puzzle'), '3x3x3', 'false legacy useVisualCube preference still generates locally');
  assert.ok(await formulaDiagram.locator('svg[role="img"] path, svg[role="img"] polygon, svg[role="img"] rect, svg[role="img"] use').count() > 5);
  assert.equal(await formulaDiagram.locator('svg rect[x="8"][fill="#22a8cb"]').count(), 0);
  await assertIconClose(controls, formulaClose);
  await controls.keyboard.press('Enter');
  await formulaDialog.waitFor({state: 'hidden'});
  console.log('PASS native equal-grid filter buttons, 4px corners, keyboard toggles, preserved scope/labels, red icon-only modal closes with keyboard focus');
  await controls.close();
  assert.deepEqual(errors, []);
  console.log('PASS no browser runtime errors (React StrictMode)');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
