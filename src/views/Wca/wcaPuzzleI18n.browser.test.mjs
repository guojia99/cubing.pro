import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { catalogs } from '../../i18n/index.ts';
import { SUPPORTED_LOCALES } from '../../i18n/locales.ts';
import { translateWcaPuzzleExtra as extra } from '../../i18n/messages/wca-puzzle-extra.ts';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

// npx tsx src/views/Wca/wcaPuzzleI18n.browser.test.mjs
// Uses production components and real Worker/data/clock/players. WCA API fixtures
// are deliberately intercepted to make country/scope checks deterministic.
const root = fileURLToPath(new URL('../../../', import.meta.url));
const bundle = await build({
  stdin: { resolveDir: root, loader: 'tsx', contents: `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {ChakraProvider} from '@chakra-ui/react'; import {system} from './src/theme';
    import {I18nProvider} from './src/contexts/I18nProvider';
    import TwoSolverView from './src/views/TwoSolver/TwoSolverView';
    import {WcaCompsView} from './src/views/Wca/WcaComps/WcaCompsView';
    import Twisty from './src/components/puzzles/TwistyPuzzlePlayer';
    import Square1 from './src/components/puzzles/Square1Player';
    import Native from './src/components/puzzles/NativeTwoByTwo';
    import Proficiency from './src/views/Algs/components/ProficiencySelect';
    import './src/styles/tokens.css'; import './src/styles/design-system.css';
    const colors={U:'#ffffff',D:'#ffff00',F:'#00aa00',B:'#0000ff',R:'#ff0000',L:'#ff8800'};
    function Players() {return <><section id="twisty"><Twisty puzzle="3x3x3" setup="" alg="R U R' U'" colors={colors} height={220}/></section><section id="square"><Square1 setup="" alg="(1,0) (2,0)" colors={colors} height={220}/></section><section id="native"><Native setup="" alg="R U" colors={colors} height={180} interactive/></section><section id="busy"><Native setup="" alg="F U" colors={colors} height={180} interactive/></section><Proficiency value="average" onChange={()=>{}}/></>}
    createRoot(document.getElementById('root')).render(<React.StrictMode><ChakraProvider value={system}><I18nProvider>{location.pathname.startsWith('/wca') ? <WcaCompsView/> : location.pathname==='/players' ? <Players/> : <TwoSolverView/>}</I18nProvider></ChakraProvider></React.StrictMode>);
  ` }, bundle: true, splitting: true, write: false, format: 'esm', outdir: '/locale-harness', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"', 'process.env': '{}' },
  loader: { '.woff': 'dataurl', '.woff2': 'dataurl', '.svg': 'dataurl' },
  plugins: [{ name: 'next-dynamic-browser', setup(builder) {
    builder.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: 'dynamic', namespace: 'adapter' }));
    builder.onLoad({ filter: /.*/, namespace: 'adapter' }, () => ({ resolveDir: root, contents: `import React,{lazy,Suspense} from 'react'; export default function dynamic(load, options={}) { const Component=lazy(load); return function Dynamic(props) { const Loading=options.loading; return <Suspense fallback={Loading ? <Loading/> : null}><Component {...props}/></Suspense> } }`, loader: 'tsx' }));
  } }],
});
const worker = await build({ entryPoints: [`${root}/src/views/TwoSolver/solver.worker.ts`], bundle: true, write: false, format: 'esm', platform: 'browser' });
const files = new Map(bundle.outputFiles.map(file => [file.path.replace('/locale-harness', ''), file.contents]));
const server = http.createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/solver.worker.ts') { response.setHeader('Content-Type', 'text/javascript'); response.end(worker.outputFiles[0].contents); }
  else if (files.has(path)) { response.setHeader('Content-Type', path.endsWith('.css') ? 'text/css' : 'text/javascript'); response.end(files.get(path)); }
  else if (path.startsWith('/two-solver/')) {
    try { response.setHeader('Content-Type', path.endsWith('.json') ? 'application/json' : 'text/javascript'); response.end(await readFile(`${root}/public${path}`)); }
    catch { response.statusCode = 404; response.end(); }
  } else { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><html><head><link rel="stylesheet" href="/stdin.css"></head><body><div id="root"></div><script type="module" src="/stdin.js"></script></body></html>'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.setDefaultTimeout(30000);
await context.addInitScript(() => {
  localStorage.setItem('cubing_pro_locale', 'zh-CN');
  const state = { posts: [], workers: 0 };
  const post = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function (...args) {
    if (args[0]?.baseUrl) state.posts.push({ type: args[0].type, id: args[0].id });
    return Reflect.apply(post, this, args);
  };
  window.localeProbe = state;
  const ids = new WeakMap();
  let sequence = 0;
  window.readSolverSnapshots = () => {
    const main = document.querySelector('main[data-settings-open]');
    const key = main && Object.keys(main).find(key => key.startsWith('__reactFiber$'));
    let fiber = key && main[key];
    let root = fiber;
    while (root?.return) root = root.return;
    if (root?.stateNode?.current !== root && fiber?.alternate) fiber = fiber.alternate;
    const values = [];
    for (; fiber; fiber = fiber.return) {
      for (let hook = fiber.memoizedState; hook && typeof hook === 'object'; hook = hook.next) {
        const value = hook.memoizedState;
        if (value?.result?.solutions && value.options && typeof value.scramble === 'string') {
          if (!ids.has(value)) ids.set(value, ++sequence);
          values.push({ identity: ids.get(value), id: value.id, scramble: value.scramble, count: value.result.solutions.length });
        }
      }
    }
    return values;
  };
});
async function locale(next) {
  await page.evaluate(next => {
    const oldValue = localStorage.getItem('cubing_pro_locale');
    localStorage.setItem('cubing_pro_locale', next);
    window.dispatchEvent(new StorageEvent('storage', { key: 'cubing_pro_locale', oldValue, newValue: next }));
  }, next);
  await page.waitForFunction(next => document.documentElement.lang === next, next);
}
const t = (language, key) => catalogs[language][key];
try {
  await page.goto(`${base}/tools/solver/222/`, { waitUntil: 'domcontentloaded' });
  const main = page.locator('main[data-settings-open]');
  await main.locator('#two-scramble').waitFor();
  await main.locator('#two-scramble').fill("R U R' F2 U' R2 F U2 R'");
  await page.waitForFunction(() => window.readSolverSnapshots().some(value => !value.id && value.count > 0), null, { timeout: 60000 });
  await page.waitForFunction(() => !document.querySelector('main [class*=spinner]'));
  const before = await page.evaluate(() => ({ snapshots: window.readSolverSnapshots(), posts: window.localeProbe.posts }));
  for (const { key } of SUPPORTED_LOCALES) {
    await locale(key);
    await main.getByRole('heading', { name: t(key, 'two.main.title'), exact: true }).waitFor();
    assert.deepEqual(await page.evaluate(() => ({ snapshots: window.readSolverSnapshots(), posts: window.localeProbe.posts })), before, `${key}: analysis result and Worker requests retained`);
    assert.equal(await main.getByRole('tablist', { name: t(key, 'two.main.mode'), exact: true }).count(), 1);
  }
  console.log('PASS production workbench: seven locales preserve analysis snapshot identity and real Worker request count');

  await locale('zh-CN');
  await main.getByRole('tab', { name: t('zh-CN', 'two.main.practice'), exact: true }).click();
  await page.waitForFunction(() => window.readSolverSnapshots().some(value => value.id && value.count > 0), null, { timeout: 60000 });
  await page.waitForFunction(() => !document.querySelector('main [class*=spinner]'));
  const timer = main.locator('[data-phase]');
  await main.getByRole('button', { name: t('zh-CN', 'two.main.startInspection'), exact: true }).click();
  await main.getByRole('button', { name: t('zh-CN', 'two.main.startSolve'), exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-phase]')?.getAttribute('data-phase') === 'running');
  const timing = await page.evaluate(() => ({ snapshots: window.readSolverSnapshots(), posts: window.localeProbe.posts, history: localStorage.getItem('cubing.pro.two-solver.practice.v1') }));
  for (const { key } of SUPPORTED_LOCALES) {
    await locale(key);
    assert.equal(await timer.getAttribute('data-phase'), 'running', `${key}: timer remains running`);
    assert.deepEqual(await page.evaluate(() => ({ snapshots: window.readSolverSnapshots(), posts: window.localeProbe.posts, history: localStorage.getItem('cubing.pro.two-solver.practice.v1') })), timing, `${key}: question and history retained`);
  }
  await main.getByRole('button', { name: t('es', 'two.main.stopTimer'), exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-phase]')?.getAttribute('data-phase') === 'stopped');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cubing.pro.two-solver.practice.v1')).length), 1);
  console.log('PASS production workbench: seven locales during running practice preserve question/Worker/history and save exactly once');

  let competitionRequests = 0;
  await context.route('**/api/v0/competition_index?*', async route => {
    competitionRequests++;
    await route.fulfill({ json: [] });
  });
  await context.route('**/wca/country*', route => route.fulfill({ json: [
    { id: 'Germany', name: 'Germany', iso2: 'DE' }, { id: 'China', name: 'China', iso2: 'CN' },
  ] }));
  await page.goto(`${base}/wca/wca-comps/`, { waitUntil: 'domcontentloaded' });
  for (const { key } of SUPPORTED_LOCALES) {
    await locale(key);
    await page.locator('.page-eyebrow').getByText(extra(key, 'wcaPuzzleExtra.competitions'), { exact: true }).waitFor();
    const scope = page.locator('.ant-segmented').first();
    await scope.getByText(t(key, 'wca.comps.scopeAll'), { exact: true }).click();
    await page.locator('.wca-comps-page .ant-select').first().click();
    const expected = new Intl.DisplayNames([key], { type: 'region' }).of('DE');
    await page.locator('.ant-select-dropdown:visible').getByText(expected, { exact: true }).waitFor();
    await page.keyboard.press('Escape');
  }
  console.log(`PASS WCA country options update for seven locales with deterministic API fixtures (${competitionRequests} requests)`);

  await page.goto(`${base}/players`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#twisty cubing-pro-managed-twisty-player')?.style.visibility === 'visible' && document.querySelector('#square input[type=range]')?.disabled === false);
  await page.locator('#square input[type=range]').fill('1');
  await page.evaluate(async () => {
    window.retainedTwisty = document.querySelector('#twisty cubing-pro-managed-twisty-player');
    window.retainedSquareCanvas = document.querySelector('#square canvas');
    window.retainedTwisty.timestamp = 250;
    await window.retainedTwisty.experimentalGet.timestamp();
  });
  for (const { key } of SUPPORTED_LOCALES) {
    await locale(key);
    await page.locator('#square canvas').getAttribute('aria-label').then(value => assert.equal(value, extra(key, 'wcaPuzzleExtra.squarePlayer')));
    assert.equal(await page.locator('#square input[type=range]').inputValue(), '1', `${key}: Square-1 playback position`);
    assert.equal(await page.locator('#busy [role=alert]').textContent(), extra(key, 'wcaPuzzleExtra.busy'));
    assert.equal(await page.evaluate(async () => document.querySelector('#twisty cubing-pro-managed-twisty-player') === window.retainedTwisty && document.querySelector('#square canvas') === window.retainedSquareCanvas && await window.retainedTwisty.experimentalGet.timestamp() === 250), true, `${key}: player/canvas identities and timestamp`);
  }
  console.log('PASS seven locales retain Twisty/Square-1 player identity and seek position; native ownership errors and canvas aria translate live');
  assert.deepEqual(errors, [], 'no browser runtime errors');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
