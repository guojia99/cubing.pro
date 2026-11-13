import assert from 'node:assert/strict';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import 'fake-indexeddb/auto';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const helper = fileURLToPath(new URL('./practiceSetup.ts', import.meta.url));

async function loadHelper(mock = false) {
  const result = await build({
    stdin: { contents: `export * from './src/components/puzzles/practiceSetup';
      ${mock ? '' : `export * from './src/components/puzzles/model';
      export * from './src/services/cubing-pro/algs/formulaPracticeHistory';`}`, resolveDir: root },
    bundle: true, write: false, format: 'esm', platform: 'node',
    plugins: [{ name: 'setup-model', setup(builder) {
      if (mock) {
        builder.onResolve({ filter: /^\.\/model$/ }, () => ({ path: 'model', namespace: 'mock' }));
        builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: `
          globalThis.setupModelLoads++;
          export const resolvePuzzle = (cube) => cube === 'unknown' ? null : '3x3x3';
          export const parsePuzzleAlg = () => ({experimentalLeafMoves: function* () {yield 'R';}});
          export async function inversePuzzleAlg(formula) {
            globalThis.setupCalls.push(formula);
            if (formula === 'invalid') throw new Error('invalid move');
            if (formula.startsWith('slow-')) await new Promise(resolve => globalThis.setupWaiters.push(resolve));
            return formula === 'empty' ? '' : "R'";
          }
        ` }));
      } else {
        builder.onResolve({ filter: /^cubing\// }, ({ path }) => ({ path: import.meta.resolve(path), external: true }));
      }
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

test('backend setups bypass model loading; cache isolates libraries and retries failures', async () => {
  globalThis.setupModelLoads = 0;
  globalThis.setupCalls = [];
  const { hasPracticeScramble, preparePracticeSetups } = await loadHelper(true);
  assert.equal(hasPracticeScramble(['', '  ', 'R U']), true);
  assert.equal(hasPracticeScramble(['', '  ']), false);
  assert.deepEqual(await preparePracticeSetups('333', 'PLL', [null, [], [' ']]), [[], [], []]);
  assert.equal(globalThis.setupModelLoads, 0, 'no model evaluation for backend-only or empty formulas');
  const formulas = [null, ['R', 'R', 'invalid', 'empty', ' ']];
  assert.deepEqual(await preparePracticeSetups('333', 'PLL', formulas), [[], ["R'"]]);
  assert.deepEqual(globalThis.setupCalls, ['R', 'invalid', 'empty']);
  await preparePracticeSetups('333', 'PLL', [['R', 'invalid']]);
  assert.deepEqual(globalThis.setupCalls, ['R', 'invalid', 'empty', 'invalid']);
  await preparePracticeSetups('333', 'OLL', [['R']]);
  await preparePracticeSetups('222', 'OLL', [['R']]);
  assert.equal(globalThis.setupCalls.filter(value => value === 'R').length, 3);
  assert.deepEqual(await preparePracticeSetups('unknown', 'PLL', [['R']]), [[]]);
});

test('300 concurrent formulas share pending work outside the 256 completed cache limit', async () => {
  globalThis.setupCalls = [];
  globalThis.setupWaiters = [];
  const { preparePracticeSetups } = await loadHelper(true);
  const formulas = Array.from({ length: 300 }, (_, index) => [`slow-${index}`]);
  const first = preparePracticeSetups('333', 'Concurrent', formulas);
  const second = preparePracticeSetups('333', 'Concurrent', formulas);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(globalThis.setupCalls.length, 300);
  assert.equal(globalThis.setupWaiters.length, 300);
  for (const resolve of globalThis.setupWaiters) resolve();
  assert.deepEqual(await first, await second);
  assert.equal(globalThis.setupCalls.length, 300, 'in-flight work must never be evicted');
  await preparePracticeSetups('333', 'Concurrent', [['slow-299']]);
  assert.equal(globalThis.setupCalls.length, 300, 'completed setups are reused');
  const evicted = preparePracticeSetups('333', 'Concurrent', [['slow-0']]);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(globalThis.setupCalls.length, 301, 'old completed setups are still bounded');
  globalThis.setupWaiters.at(-1)();
  await evicted;
});

test('real model validates moves and physical SQ1 cuts in the library formula domain', async () => {
  const { preparePracticeSetups } = await loadHelper();
  assert.deepEqual(await preparePracticeSetups('333', 'PLL', [["R U R'", 'NOT_A_MOVE'], ['answer'], ['// comment']]), [["R U' R'"], [], []]);
  assert.deepEqual(await preparePracticeSetups('unknown', 'PLL', [['R']]), [[]]);
  assert.deepEqual(await preparePracticeSetups('skewb', 'library', [['R'], ['H'], ['unknown']]), [["UR'"], ["UR' F UR F'"], []]);
  assert.deepEqual(await preparePracticeSetups('pyram', 'library', [['S']]), [["L R' L' R"]]);
  const sq1 = await preparePracticeSetups('sq1', 'library', [['/ (1,0)'], ['(0,0) /']]);
  assert.deepEqual(sq1[0], [], 'inverse would turn then slice through a joined corner');
  assert.equal(sq1[1].length, 1);
  assert.equal((await preparePracticeSetups('sq1', 'library', [["[B B] /U'eD'"]]))[0].length, 1);
});

test('native FTO setups survive practice history and remain separate from backend notation', async () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true, value: { getItem: () => null },
  });
  const { preparePracticeSetups, preparePuzzle, parsePuzzleAlg, applyPuzzleAlg,
    createPracticeSession, appendFormulaPracticeRecord, getFormulaPracticeHistory } = await loadHelper();
  const formulas = ['r', 'xr', '{F,U} S'];
  const setups = await preparePracticeSetups('fto', 'Native round trip', formulas.map(formula => [formula]));
  assert.match(setups[0][0], /2R'/);
  assert.match(setups[1][0], /Rv'/);
  const session = await createPracticeSession('fto', 'Native round trip', { mode: 'sequential', selectedFormulas: formulas });
  for (const [index, formula] of formulas.entries()) {
    assert.equal(setups[index].length, 1);
    const scramble = setups[index][0];
    assert.match(scramble, /^\/\/ cubing-pro:native\n/);
    await appendFormulaPracticeRecord('fto', 'Native round trip', session, {
      timeMs: 1000, formulaKey: formula, formulaName: formula, setName: 'Set', groupName: 'Group',
      scramble, scrambleIndex: 0, image: '', algs: [formula],
    });
  }
  const records = await getFormulaPracticeHistory('fto', 'Native round trip');
  assert.equal(records.length, 3);
  for (const record of records) {
    assert.equal(record.scramble, setups[formulas.indexOf(record.formulaKey)][0]);
    const state = await preparePuzzle('fto', record.algs[0], record.scramble, 'scramble');
    assert.equal(state.warning, undefined);
    assert.match(state.setup, /^\/\/ cubing-pro:native\n/);
    assert.ok(applyPuzzleAlg(state.pattern, parsePuzzleAlg(record.algs[0], 'fto'), 'fto')
      .isIdentical(state.kpuzzle.defaultPattern()));
    const replay = await preparePuzzle('fto', record.algs[0], state.setup, 'scramble');
    assert.ok(replay.pattern.isIdentical(state.pattern));
  }
  assert.throws(() => parsePuzzleAlg("2R' Rv'", 'fto', 'setup'), /Unsupported/);
  assert.equal(parsePuzzleAlg('Bl Br', 'fto', 'setup').toString(), 'BL BR');
  assert.equal(parsePuzzleAlg('R', 'skewb').toString(), 'UR');
  assert.equal(parsePuzzleAlg('R', 'skewb', 'setup').toString(), 'R');
});

test('modal prepares once per content, guards stale work, preserves backend data and timer identity', async () => {
  const bundle = await build({
    stdin: { contents: `
      import React, {useState} from 'react';
      import {createRoot} from 'react-dom/client';
      import {ChakraProvider} from '@chakra-ui/react';
      import {system} from './src/theme';
      import {I18nProvider} from './src/contexts/I18nProvider';
      import Modal from './src/views/Algs/components/FormulaPracticeModal';
      window.setupCalls = []; window.setupLoads = 0; window.setupWaiters = {};
      const item = (name, algs, scrambles) => ({setName: 'Set', groupName: 'Group', alg: {name, algs, scrambles, custom: {preserve: true}}});
      window.setupItem = item;
      function Host() {
        const [props, setProps] = useState({open: true, cube: '333', classId: 'Backend', flatAlgs: [item('Backend', ['answer'], ['original setup', 'alternate setup'])]});
        window.setSetupProps = patch => setProps(previous => ({...previous, ...patch}));
        return <Modal {...props} onClose={() => setProps(previous => ({...previous, open: false}))}/>;
      }
      createRoot(document.getElementById('root')).render(<React.StrictMode><ChakraProvider value={system}><I18nProvider><Host/></I18nProvider></ChakraProvider></React.StrictMode>);
    `, loader: 'tsx', resolveDir: root },
    bundle: true, write: false, outdir: '/practice-setup', jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"development"', 'process.env': '{}' },
    plugins: [{ name: 'controlled-setup', setup(builder) {
      builder.onResolve({ filter: /^\.\/model$/ }, ({ importer }) => importer === helper ? { path: 'model', namespace: 'mock' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: `
        window.setupLoads++;
        export const resolvePuzzle = cube => cube === '333' ? '3x3x3' : null;
        export const parsePuzzleAlg = () => ({experimentalLeafMoves: function* () {yield 'R';}});
        export async function inversePuzzleAlg(formula) {
          window.setupCalls.push(formula);
          if (formula === 'invalid') throw new Error('invalid formula');
          if (formula.startsWith('slow')) await new Promise(resolve => window.setupWaiters[formula] = resolve);
          return formula === 'R' ? "R'" : "U'";
        }
      ` }));
      builder.onResolve({ filter: /^\.\/AlgsCubeDiagram$/ }, () => ({ path: 'diagram', namespace: 'diagram' }));
      builder.onLoad({ filter: /.*/, namespace: 'diagram' }, () => ({ contents: `export default function Diagram() { return null; }` }));
      builder.onResolve({ filter: /^\.\/formulaPracticeTimer$/ }, () => ({ path: 'timer', namespace: 'timer' }));
      builder.onLoad({ filter: /.*/, namespace: 'timer' }, () => ({ contents: `
        import {PracticeTimer as Base} from '${root}/src/views/Algs/components/formulaPracticeTimer.ts';
        export * from '${root}/src/views/Algs/components/formulaPracticeTimer.ts';
        export class PracticeTimer extends Base {
          configure(input) {window.setupDraft = input; return super.configure(input);}
        }
      `, resolveDir: root }));
    } }],
  });
  const js = bundle.outputFiles.find(file => file.path.endsWith('.js')).text;
  const css = bundle.outputFiles.find(file => file.path.endsWith('.css')).text;
  const server = http.createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/bundle.js' ? 'text/javascript' : request.url === '/bundle.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/bundle.js' ? js : request.url === '/bundle.css' ? css : '<html><head><link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    const start = page.getByRole('button', {name: '开始练习', exact: true});
    await start.waitFor();
    assert.equal(await page.evaluate(() => window.setupLoads), 0);
    await start.click();
    await page.waitForFunction(() => document.querySelector('.fp-timer')?.disabled === false);
    await page.evaluate(() => window.setSetupProps({classId: 'Slow', flatAlgs: [window.setupItem('Old', ['slow-old'], [])]}));
    await page.waitForFunction(() => window.setupWaiters['slow-old']);
    assert.equal(await start.isDisabled(), true);
    assert.match(await page.locator('[role=dialog]').textContent(), /正在为缺失打乱/);
    await page.evaluate(() => window.setSetupProps({classId: 'Prepared', flatAlgs: [
      window.setupItem('Derived', ['invalid', 'R'], []),
      window.setupItem('Invalid', ['invalid'], []),
      window.setupItem('Backend', ['answer'], ['original setup', 'alternate setup']),
    ]}));
    await page.waitForFunction(() => document.querySelector('.fp-choices')?.textContent.includes('暂无打乱'));
    assert.equal(await start.isEnabled(), true);
    assert.deepEqual(await page.evaluate(() => window.setupCalls), ['slow-old', 'invalid', 'R']);
    await page.evaluate(() => window.setupWaiters['slow-old']());
    await page.getByRole('radio', {name: '按顺序', exact: true}).check();
    await start.click();
    const timer = page.locator('.fp-timer');
    await page.waitForFunction(() => document.querySelector('.fp-timer')?.disabled === false);
    assert.equal(await page.locator('.fp-scramble').textContent(), "R'");
    assert.deepEqual(await page.evaluate(() => window.setupDraft.algs.map(item => item.alg)), [
      {name: 'Derived', algs: ['invalid', 'R'], scrambles: ["R'"], custom: {preserve: true}},
      {name: 'Invalid', algs: ['invalid'], scrambles: [], custom: {preserve: true}},
      {name: 'Backend', algs: ['answer'], scrambles: ['original setup', 'alternate setup'], custom: {preserve: true}},
    ]);
    await timer.focus(); await page.keyboard.down('Space');
    assert.match(await timer.getAttribute('class'), /fp-timer-armed/);
    await page.keyboard.up('Space');
    assert.match(await timer.getAttribute('class'), /fp-timer-running/);
    await page.keyboard.press('Escape');
    await page.getByRole('button', {name: '题目详情', exact: true}).click();
    assert.deepEqual(await page.locator('.fp-detail .fp-alg').allTextContents(), ['invalid', 'R']);
    await page.getByRole('button', {name: '返回', exact: true}).click();
    await page.getByRole('button', {name: '下一题', exact: true}).click();
    await page.waitForFunction(() => document.querySelector('.fp-scramble')?.textContent === '暂无打乱');
    assert.equal(await timer.isDisabled(), true);
    await page.getByRole('dialog').focus();
    await page.keyboard.press('Space');
    assert.match(await timer.getAttribute('class'), /fp-timer-ready/);
    await page.getByRole('button', {name: '下一题', exact: true}).click();
    await page.waitForFunction(() => /^(original|alternate) setup$/.test(document.querySelector('.fp-scramble')?.textContent ?? ''));
    assert.equal(await timer.isEnabled(), true);
    assert.match(await page.locator('.fp-scramble').textContent(), /^(original|alternate) setup$/);
    await page.evaluate(() => window.setSetupProps({flatAlgs: [
      window.setupItem('Derived', ['invalid', 'R'], []), window.setupItem('Invalid', ['invalid'], []),
      window.setupItem('Backend', ['answer'], ['original setup', 'alternate setup']),
    ]}));
    await page.getByRole('button', {name: '练习配置', exact: true}).click();
    assert.equal(await page.getByRole('button', {name: '继续练习', exact: true}).isEnabled(), true);
    assert.deepEqual(await page.evaluate(() => window.setupCalls), ['slow-old', 'invalid', 'R']);
    await page.getByRole('button', {name: '继续练习', exact: true}).click();
    await page.getByRole('button', {name: '关闭练习器', exact: true}).click();
    await page.evaluate(() => window.setSetupProps({open: true}));
    await page.waitForFunction(() => document.querySelector('.fp-timer')?.disabled === false);
    assert.match(await page.locator('.fp-scramble').textContent(), /^(original|alternate) setup$/);
    assert.deepEqual(await page.evaluate(() => window.setupCalls), ['slow-old', 'invalid', 'R']);
    await page.getByRole('button', {name: '练习配置', exact: true}).click();
    await page.evaluate(() => window.setSetupProps({flatAlgs: [window.setupItem('Changed', ['slow-new'], [])]}));
    await page.waitForFunction(() => window.setupWaiters['slow-new']);
    await page.evaluate(() => window.setSetupProps({flatAlgs: [window.setupItem('Latest', ['R'], [])]}));
    await start.waitFor();
    await page.evaluate(() => window.setupWaiters['slow-new']());
    await page.getByRole('button', {name: '全选', exact: true}).click();
    await start.click();
    await page.waitForFunction(() => document.querySelector('.fp-timer')?.disabled === false);
    assert.equal(await page.locator('.fp-scramble').textContent(), "R'");
    await page.evaluate(() => window.setSetupProps({cube: 'unknown', classId: 'Unknown', flatAlgs: [window.setupItem('Unknown', ['R'], [])]}));
    await page.getByText('Unknown', {exact: true}).waitFor();
    await start.click();
    await page.waitForFunction(() => document.querySelector('.fp-scramble')?.textContent === '暂无打乱');
    assert.equal(await timer.isDisabled(), true);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
