import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

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
    import '${root}/src/styles/tokens.css';
    import '${root}/src/views/Algs/styles/algsDetail.css';
    window.practiceHistory = history; window.importHistory = importHistory;
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
  bundle: true, write: false, outdir: '/practice-test', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"', 'process.env': '{}' },
  plugins: [{ name: 'controlled-practice-storage', setup(build) {
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
const browser = await chromium.launch({ headless: true });
const errors = [];
const origin = `http://127.0.0.1:${server.address().port}`;
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
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(origin);
  const dialog = page.getByRole('dialog');
  await assertIconClose(page, dialog.getByRole('button', { name: '关闭练习器', exact: true }));
  const timer = page.locator('.fp-timer');
  const phase = async (name) => {
    try { await page.waitForFunction((name) => document.querySelector('.fp-timer')?.classList.contains('fp-timer-' + name), name, { timeout: 8000 }); }
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
  assert.equal(await page.locator('.fp-detail svg').count(), 1);
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
  await page.waitForFunction(() => !document.querySelector('.fp-notice')?.textContent.includes('历史加载失败'));
  assert.equal(await page.evaluate(() => window.practiceTest.appends.length), savesAfterReadFailure);
  console.log('PASS committed write survives statistics read failure without append retry');

  await page.evaluate(async () => {
    const records = Array.from({ length: 1045 }, (_, i) => ({ id: `seed-${i}`, createdAt: i + 1, timeMs: 1000 + i, formulaKey: 'Set:Group:Case 1', formulaName: `Seed ${i}`, setName: 'Set', groupName: 'Group', scramble: 'R U', scrambleIndex: 0, image: '', algs: ['R U'] }));
    records[1044].image = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><circle cx="30" cy="30" r="20" fill="red"/></svg>';
    await window.importHistory({ '333-PLL': { version: 2, sessions: [{ id: 'seed-session', createdAt: 1, mode: 'sequential', selectedFormulas: [], records }] } });
    window.setPracticeProps({ open: false });
  });
  await page.getByRole('button', { name: 'Reopen', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.fp-stats')?.textContent.includes('近 1000 次均值'));
  assert.equal(await page.locator('.fp-mean').textContent(), '01.54');
  assert.equal(await page.locator('.fp-record').first().locator('svg circle').count(), 1, 'saved image wins in recent history');
  assert.equal(await page.locator('.fp-record').nth(1).locator('svg rect').count(), 1, 'empty legacy image falls back in recent history');
  assert.equal(await page.locator('.fp-stats').textContent().then((text) => text.includes('1000 / 1000 次')), false);
  await dialog.getByRole('button', { name: /查看全部/ }).click();
  await page.waitForFunction(() => document.querySelectorAll('.fp-record').length === 20);
  assert.equal(await page.locator('.fp-record').first().locator('svg circle').count(), 1);
  await page.locator('.fp-record-open').first().click();
  await page.locator('.fp-detail').waitFor();
  assert.equal(await page.locator('.fp-detail svg circle').count(), 1, 'saved image wins in record detail');
  await dialog.getByRole('button', { name: '返回', exact: true }).click();
  await dialog.getByRole('button', { name: '下一页', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.fp-pagination')?.textContent.includes('第 2 / 53 页'));
  assert.equal(await page.evaluate(() => window.practiceTest.pages.at(-1)[2]), 2);
  assert.equal(await page.evaluate(() => window.practiceTest.pages.at(-1)[3]), 20);
  assert.equal(await page.locator('.fp-record svg rect').count(), 20, 'paged legacy records use formula-key fallback');
  await page.locator('.fp-record-open').first().focus(); await page.keyboard.press('Enter');
  await page.locator('.fp-detail').waitFor();
  assert.equal(await page.locator('.fp-detail svg rect').count(), 1, 'empty legacy record detail uses formula-key fallback');
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
  await page.waitForFunction(() => document.querySelector('.fp-pagination')?.textContent.includes('1044'));
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
  await page.waitForFunction(() => document.querySelector('.fp-body')?.textContent.includes('暂无练习记录'));
  await dialog.getByRole('button', { name: '返回', exact: true }).click();
  await phase('ready');
  await start(); await stop();
  assert.equal(await page.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'PLL')), 1);
  console.log('PASS real IndexedDB pagination over 1045 rows, bounded 1000-result statistics, keyboard details, delete/clear confirmation, rebuilt session');
  console.log('PASS legacy empty-image fallback and stored-image precedence in recent, paged history and record details');

  // Pending old-library writes and reads cannot update the active library.
  await page.evaluate(() => { window.practiceTest.delayAppend = true; });
  await start(); await page.keyboard.press('KeyS'); await phase('saving');
  await page.evaluate(() => window.setPracticeProps({ classId: 'OLL' }));
  await dialog.getByRole('button', { name: '开始练习', exact: true }).click(); await phase('ready');
  await page.evaluate(() => { window.practiceTest.delayAppend = false; window.practiceTest.releaseAppend(); });
  await page.waitForFunction(() => document.querySelector('.fp-meta')?.textContent.includes('OLL'));
  assert.equal(await page.evaluate(() => window.practiceHistory.getFormulaPracticeHistoryCount('333', 'OLL')), 0);
  assert.equal(await page.locator('.fp-stage-top').textContent().then((text) => text.includes('1 / 4')), true);
  await page.evaluate(() => { window.practiceTest.delaySummary = 'OLL'; window.setPracticeProps({ open: false }); });
  await page.getByRole('button', { name: 'Reopen', exact: true }).click();
  await page.waitForFunction(() => Boolean(window.practiceTest.releaseSummary));
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
  assert.equal(await page.locator('.fp-answer-content svg').count(), 1);
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
  const recoveryPhase = name => recoveryPage.waitForFunction(name => document.querySelector('.fp-timer')?.classList.contains('fp-timer-' + name), name, { timeout: 8000 });
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

  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touch = await touchContext.newPage();
  touch.on('pageerror', (error) => errors.push(error.message));
  await touch.goto(origin);
  await touch.getByRole('button', { name: '开始练习', exact: true }).click();
  const touchTimer = touch.locator('.fp-timer');
  const box = await touchTimer.boundingBox();
  const cdp = await touchContext.newCDPSession(touch);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }] });
  await touch.waitForFunction(() => document.querySelector('.fp-timer-armed'));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touch.waitForFunction(() => document.querySelector('.fp-timer-running'));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touch.waitForFunction(() => document.querySelector('.fp-timer-ready'));
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
