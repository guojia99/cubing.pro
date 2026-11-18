import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import cstimer from 'cstimer_module';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const bundle = await build({
  stdin: { resolveDir: root, loader: 'tsx', contents: `
    import React, {useEffect, useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import {ChakraProvider} from '@chakra-ui/react';
    import {system} from '${root}/src/theme';
    import {I18nProvider} from '${root}/src/contexts/I18nProvider';
    import {AntThemeProvider} from '${root}/src/components/ui/AntThemeProvider';
    import {useCompetitionPublicI18n} from '${root}/src/views/Competition/i18n';
    import * as publicMessages from '${root}/src/i18n/messages/competition-public';
    import {CubesCn} from '${root}/src/components/CubeIcon/cube';
    import Detail from '${root}/src/views/Competition/CompetitionComponents/CompetitionDetail';
    import Records from '${root}/src/views/Competition/CompetitionComponents/CompetitionResultsWithRecord';
    import Top from '${root}/src/views/Competition/CompetitionComponents/CompetitionResultsWithTop';
    import ByEvents from '${root}/src/views/Competition/CompetitionComponents/CompetitionResultsWithEvents';
    import ByPlayers from '${root}/src/views/Competition/CompetitionComponents/CompetitionResultsWithPlayers';
    import Results from '${root}/src/views/Competition/CompetitionComponents/CompetitionResults';
    import Scrambles from '${root}/src/views/Competition/CompetitionComponents/CompetitionScrambles';
    import Timer from '${root}/src/views/Competition/CompetitionComponents/groupTimer/GroupTimer';
    import Registration from '${root}/src/views/Competition/CompetitionComponents/CompetitionRegistration';
    import Schedule from '${root}/src/views/Competition/CompetitionComponents/CompetitionSchedule';
    import Competitors from '${root}/src/views/Competition/CompetitionComponents/CompetitionCompetitors';
    import {CompetitionView} from '${root}/src/views/Competition/CompetitionView';
    import '${root}/src/styles/tokens.css';
    import '${root}/src/views/Competition/Competition.css';
    const schedule = (Round, RoundNum) => ({Round, RoundNum, IsRunning:true, Scrambles:[[
      "R U R' U'", "F U F' U'", "R2 U2 F2", "L U L'", "F2 D2 R2", "B2 U R2"
    ],["R2 F2 U2", "F2 R2 U2", "D2 L2 B2", "F2 D2 B2", "B2 D2 L2", "U2 B2 R2"]]});
    const event = (id, route=7) => ({Key:id, EventID:id, EventName:id, EventRoute:route, IsComp:true, Schedule:[schedule('初赛',1),schedule('决赛',2)]});
    const events = ['333','222','333mbf','2_7relay'].map(id=>({id, name:id, cn:id, otherNames:'', class:id==='2_7relay'?'relay':'', isComp:true, puzzleId:id==='333mbf'?'333':id, scrambleValue:id==='2_7relay'?'222,333':'', base_route_typ:id==='333mbf'?8:7}));
    const comp = {code:'0', msg:'', data:{id:777777, Name:'Fixture Cup', Status:'Running', Genre:5, GroupId:1, IsDone:false,
      CompStartTime:'2020-01-01', CompEndTime:'2099-01-01', City:'Fixture City', EventMin:'333;222;333mbf',
      OrganizersID:1, Org:{Name:'Fixture Team',Email:'team@example.test'}, Group:{name:'Fixture Group',qq_groups:'123'},
      Count:100, RegisterNum:3, CompedNum:3, EarliestID:0, LatestID:0, Illustrate:'', IllustrateHTML:'', RuleMD:'',
      comp_json:{Events:[event('333'),event('222'),{...event('333mbf',8),Schedule:[{...schedule('决赛',1),Scrambles:[["R U R'", "F R F'"]]}]},
        {...event('2_7relay',1),Schedule:[{...schedule('决赛',1),Scrambles:[["R U R'", "F R F'"]]}]}]}}};
    const results = ['333','222'].flatMap((id,idx)=>[1,2].flatMap(r=>[0,1,2].map(i=>({
      id:idx*100+r*10+i, key:idx*100+r*10+i, Index:i, EventID:id, EventName:id, EventRoute:7, CompetitionID:777777,
      CompetitionName:'Fixture Cup', Round:r===1?'初赛':'决赛', RoundNumber:r, PersonName:'Player '+i, CubeID:String(i+1),
      Best:10+i, Average:12+i, Result:[10+i,11+i,12+i,13+i,14+i], Rank:i, ResultJSON:'[]'
    }))));
    const records = [{id:1,Index:0,EventId:'333',EventRoute:7,ResultId:20,UserId:1,CubeId:'1',UserName:'Player 0',CompsId:777777,
      CompsName:'Fixture Cup',CompsGenre:5,Best:10,Average:null,Repeatedly:null,ThisResults:'',Type:'GR',createdAt:'2026-01-01',updatedAt:'2026-01-01'}];
    window.fixture = {comp, events, results, records};
    window.publicMessages = publicMessages;
    function Controller(){
      const {locale,setLocale,t,tf,p,round} = useCompetitionPublicI18n();
      const [scenario,setScenario] = useState('detail');
      window.switchCompetition = (language,next)=>{setLocale(language);setScenario(next);};
      window.competitionText = (key,params)=>key.startsWith('competitionPublic.')?p(key,params):params?tf(key,params):t(key);
      window.eventText = id=>CubesCn(id,locale);
      window.roundText = name=>round(name,3);
      useEffect(()=>{window.competitionReady=locale+':'+scenario;},[locale,scenario]);
      if(scenario==='view')return <CompetitionView/>;
      if(scenario==='detail')return <Detail comp={comp}/>;
      if(scenario.startsWith('status-'))return <Detail comp={{...comp,data:{...comp.data,Status:scenario.slice(7)}}}/>;
      if(scenario==='record')return <Records comp={comp} events={events} records={records}/>;
      if(scenario==='noRecords')return <Records comp={comp} events={events} records={[]}/>;
      if(scenario==='emptyTop')return <Top comp={comp} events={events} results={[]} topRank={3} event_divider with_best={false}/>;
      if(scenario==='top')return <Top comp={comp} events={events} results={results.map(r=>({...r}))} topRank={3} event_divider with_best={false}/>;
      if(scenario==='events')return <ByEvents comp={comp} events={events} results={results.map(r=>({...r}))}/>;
      if(scenario==='players')return <ByPlayers comp={comp} events={events} results={results.map(r=>({...r}))}/>;
      if(scenario==='results')return <Results comp={{...comp,data:{...comp.data,IsDone:true}}}/>;
      if(scenario==='scrambles')return <Scrambles comp={comp}/>;
      if(scenario==='endedScrambles')return <Scrambles comp={{...comp,data:{...comp.data,IsDone:true}}}/>;
      if(scenario==='noScrambles')return <Scrambles comp={{...comp,data:{...comp.data,comp_json:{Events:[{...event('333'),Schedule:[]}]}}}}/>;
      if(scenario==='registration')return <Registration comp={comp}/>;
      if(scenario==='missing')return <><Registration/><Schedule/><Competitors/><Scrambles/></>;
      if(scenario==='off')return null;
      return <Timer key={scenario} comp={scenario==='endedTimer'?{...comp,data:{...comp.data,IsDone:true}}:comp} baseEvents={scenario==='emptyTimer'?[]:events} open onClose={()=>setScenario('off')}/>;
    }
    createRoot(document.getElementById('root')).render(<ChakraProvider value={system}><I18nProvider><AntThemeProvider><Controller/></AntThemeProvider></I18nProvider></ChakraProvider>);
  ` },
  plugins: [{ name: 'browser-navigation', setup(builder) {
    // The package's browser build expects its original jQuery host. Use its real
    // Node renderer for fixture diagrams; the React image conversion still runs.
    builder.onResolve({ filter: /^cstimer_module$/ }, () => ({ path: 'cstimer', namespace: 'fixture' }));
    builder.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: 'navigation', namespace: 'fixture' }));
    builder.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: 'dynamic', namespace: 'fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ loader: 'jsx', resolveDir: root, contents: path === 'cstimer' ? `export default {getImage:()=>${JSON.stringify(cstimer.getImage("R U R' U'", '333'))}};` : path === 'navigation' ? `
      import {useSyncExternalStore} from 'react';
      const subscribe=fn=>{window.addEventListener('popstate',fn);return()=>window.removeEventListener('popstate',fn);};
      const navigate=url=>{history.replaceState(null,'',url);window.dispatchEvent(new PopStateEvent('popstate'));};
      const router={replace:navigate,push:navigate,prefetch:()=>{}};
      export const usePathname=()=>useSyncExternalStore(subscribe,()=>location.pathname);
      export const useSearchParams=()=>new URLSearchParams(useSyncExternalStore(subscribe,()=>location.search));
      export const useRouter=()=>router;
      export const useParams=()=>({id:'777777'});
    ` : `
      import React,{lazy,Suspense} from 'react';
      export default function dynamic(load){const Component=lazy(load);return props=><Suspense fallback={null}><Component {...props}/></Suspense>;}
    ` }));
  } }],
  bundle: true, write: false, outdir: '/competition-i18n', format: 'iife', jsx: 'automatic',
  loader: { '.woff': 'dataurl', '.woff2': 'dataurl', '.ttf': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"development"', 'process.env.NEXT_PUBLIC_API_BASE': '""', 'process.env.NEXT_PUBLIC_DEV_API_BASE': '""', 'process.env.NEXT_PUBLIC_NEXT_OUTPUT_EXPORT': '""', 'process.env': '{}' },
});
const js = bundle.outputFiles.find(file => file.path.endsWith('.js')).text;
const css = bundle.outputFiles.find(file => file.path.endsWith('.css')).text;
const server = createServer((request, response) => {
  response.setHeader('Content-Type', request.url === '/bundle.js' ? 'text/javascript' : request.url === '/bundle.css' ? 'text/css' : 'text/html');
  response.end(request.url === '/bundle.js' ? js : request.url === '/bundle.css' ? css : '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => { errors.push(error.message); console.error(error.stack); });
await page.addInitScript(() => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => {
    if (window.rejectCopy) throw new Error('Private clipboard diagnostic');
    window.copiedText = text;
  } } });
});
let failEvents = false;
let failResults = false;
let failCompetition = false;
await page.route('**/public/**', async route => {
  const url = new URL(route.request().url());
  const fixture = await page.evaluate(() => window.fixture);
  const status = (url.pathname.includes('/events') && failEvents) || (url.pathname.endsWith('/result') && failResults) || (url.pathname.endsWith('/777777') && failCompetition) ? 500 : 200;
  const data = url.pathname.includes('/events') ? { code: '0', data: { Events: fixture.events, UpdateTime: '2020-01-01' } }
    : url.pathname.endsWith('/record') ? { data: fixture.records }
    : url.pathname.endsWith('/result') ? { data: fixture.results }
    : fixture.comp;
  await route.fulfill({ status, json: status === 200 ? data : { error: '服务器私密错误详情' } });
});
const locales = ['zh-CN', 'en-US', 'ja', 'yue-Hant-HK', 'ko', 'fr', 'es'];
async function switchTo(locale, scenario) {
  await page.evaluate(({ locale, scenario }) => { window.switchCompetition(locale, scenario); }, { locale, scenario });
  await page.waitForFunction(value => window.competitionReady === value, `${locale}:${scenario}`);
}
const text = (key, params) => page.evaluate(({ key, params }) => window.competitionText(key, params), { key, params });
async function button(key) {
  const label = (await text(key)).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page.getByRole('button', { name: new RegExp(label + '(?:[（(]\\d+[）)])?$') });
}
async function checkText(locale, scenario) {
  const body = await page.locator('body').innerText();
  assert.doesNotMatch(body, /competition(?:Admin|Public)\.[\w.]+|\{(?:count|competition|scramble)\}|私密|Private clipboard/, `${locale}/${scenario}: raw key, placeholder, or diagnostic`);
  if (['en-US', 'ko', 'fr', 'es'].includes(locale)) {
    await page.waitForFunction(() => !/\p{Script=Han}/u.test(document.body.innerText));
    const attributes = await page.locator('[aria-label],[title],[placeholder],img[alt]').evaluateAll(elements => elements
      .filter(el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0)
      .flatMap(el => ['aria-label', 'title', 'placeholder', 'alt'].map(attr => el.getAttribute(attr) ?? '')).join('\n'));
    assert.doesNotMatch(attributes, /\p{Script=Han}|competition(?:Admin|Public)\./u, `${locale}/${scenario}: untranslated accessible text`);
  }
}
async function more(key) {
  await (await button('competitionAdmin.more')).click();
  await page.getByRole('menuitem', { name: await text(key), exact: true }).click();
}
async function closeDialog() {
  await page.getByRole('dialog').last().getByRole('button', { name: await text('competitionAdmin.close'), exact: true }).last().click();
  await page.waitForTimeout(350);
}
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/competition/777777?comps_tabs=scrambles`);
  await page.waitForFunction(() => typeof window.switchCompetition === 'function');
  const catalogs = await page.evaluate(() => window.publicMessages);
  const keys = Object.keys(catalogs.competitionPublicZhCN).sort();
  for (const catalog of Object.values(catalogs)) {
    assert.deepEqual(Object.keys(catalog).sort(), keys);
    for (const key of keys) {
      assert.ok(catalog[key].trim());
      assert.deepEqual(catalog[key].match(/\{\w+\}/g)?.sort(), catalogs.competitionPublicZhCN[key].match(/\{\w+\}/g)?.sort(), key);
    }
  }
  for (const scenario of ['detail', 'status-Reviewing', 'status-Reject', 'status-Temporary', 'status-Ban', 'noRecords', 'record', 'top', 'emptyTop', 'events', 'players', 'registration', 'missing', 'noScrambles', 'endedScrambles', 'endedTimer', 'emptyTimer']) {
    for (const locale of locales) {
      await switchTo(locale, scenario);
      await checkText(locale, scenario);
      if (scenario === 'top') {
        await page.locator('.ant-btn[aria-label]').click();
        await page.waitForFunction(() => Boolean(window.copiedText));
        assert.ok((await page.evaluate(() => window.copiedText)).includes(await text('competitionPublic.rankingsHeading', { competition: 'Fixture Cup' })));
      }
    }
    console.log(`PASS ${scenario}: seven locales and live switching`);
  }
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const locale of locales) {
      await switchTo(locale, 'scrambles');
      await page.getByRole('button', { name: await text('competitionPublic.groupTimer'), exact: true }).waitFor();
      await page.locator('.scramble-round-title').waitFor();
      await checkText(locale, 'scrambles');
      const selector = page.getByRole('combobox', { name: await text('competitionPublic.scrambleGroup'), exact: true });
      await selector.click();
      await page.getByTitle(await text('competitionPublic.scrambleGroupNumber', { count: 2 }), { exact: true }).last().click();
      await checkText(locale, 'scramble group popup');
      await page.getByRole('button', { name: await text('competitionPublic.groupTimer'), exact: true }).click();
      await page.locator('.group-timer-fs').waitFor();
      await checkText(locale, 'timer entry portal');
      await (await button('competitionAdmin.exitFullscreen')).click();
      await page.locator('.group-timer-fs').waitFor({ state: 'hidden' });
    }
    console.log(`PASS scrambles: seven locales, group selection and timer portal at ${viewport.width}px`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const locale of locales) {
    await switchTo(locale, 'off');
    await page.evaluate(() => {
      localStorage.removeItem('cubingPro.groupTimer.v1:777777');
      localStorage.setItem('cubingPro.groupTimerUi.v1', JSON.stringify({ inputMode: 'manual' }));
    });
    await switchTo(locale, 'timer');
    await page.getByRole('textbox', { name: await text('competitionAdmin.enterTime'), exact: true }).fill('12.34');
    await (await button('competitionAdmin.confirm')).click();
    await page.waitForFunction(() => Object.keys(JSON.parse(localStorage.getItem('cubingPro.groupTimer.v1:777777')).solves).length === 1);
    await (await button('competitionAdmin.useSpare')).click();
    await checkText(locale, 'spare scramble');
    await (await button('competitionAdmin.cancelSpare')).click();
    for (const key of ['competitionAdmin.settings', 'competitionAdmin.resultList', 'competitionAdmin.progress']) {
      await more(key);
      await page.getByRole('dialog').last().waitFor();
      await checkText(locale, key);
      await page.getByRole('dialog').last().locator('.ant-drawer-close,.ant-modal-close').click();
      await page.waitForTimeout(350);
    }
    await (await button('competitionAdmin.storedResults')).click();
    await page.getByRole('dialog').last().waitFor();
    await checkText(locale, 'history');
    await closeDialog();
    await more('competitionAdmin.export');
    await page.getByRole('textbox', { name: await text('competitionAdmin.exportPreview'), exact: true }).waitFor();
    assert.equal(await page.getByRole('textbox', { name: await text('competitionAdmin.exportPreview'), exact: true }).inputValue(), '333[1] 12.34 DNS DNS DNS DNS');
    await checkText(locale, 'export preview');
    await page.evaluate(() => { window.rejectCopy = true; });
    await (await button('competitionAdmin.copyMark')).click();
    await page.getByText(await text('competitionPublic.copyFailed'), { exact: true }).waitFor();
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('cubingPro.groupTimer.v1:777777')).exportByEvent), {});
    await page.evaluate(() => { window.rejectCopy = false; });
    await (await button('competitionAdmin.copyMark')).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('cubingPro.groupTimer.v1:777777')).exportByEvent['333']?.exportedRounds?.includes('0'));
    await checkText(locale, 'copy result');
    console.log(`PASS timer ${locale}: manual input, spare, settings/list/progress/history portals, export and copy failure recovery`);
  }
  await switchTo('en-US', 'off');
  await page.evaluate(() => {
    localStorage.removeItem('cubingPro.groupTimer.v1:777777');
    localStorage.removeItem('cubingPro.groupTimerUi.v1');
  });
  await switchTo('en-US', 'timing');
  await page.keyboard.down('Space');
  await page.waitForTimeout(400);
  await page.keyboard.up('Space');
  await page.locator('.group-timer-running').waitFor();
  await page.waitForTimeout(150);
  await page.keyboard.press('KeyA');
  await page.locator('.group-timer-running').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => Object.keys(JSON.parse(localStorage.getItem('cubingPro.groupTimer.v1:777777')).solves).length === 1);
  const timed = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('cubingPro.groupTimer.v1:777777')).solves)[0]);
  assert.ok(timed.timeMs >= 100 && !timed.dnf);
  await page.getByRole('button', { name: 'DNF', exact: true }).click();
  await page.getByRole('button', { name: 'DNS', exact: true }).click();
  assert.equal(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('cubingPro.groupTimer.v1:777777')).solves).length), 3);
  console.log('PASS keyboard timer: hold/release, stop, DNF and DNS');
  await switchTo('en-US', 'off');
  await page.evaluate(() => {
    localStorage.removeItem('cubingPro.groupTimer.v1:777777');
    localStorage.setItem('cubingPro.groupTimerUi.v1', JSON.stringify({ inputMode: 'manual' }));
  });
  await switchTo('en-US', 'multiBlind');
  const eventSelect = page.getByRole('combobox', { name: 'Event', exact: true });
  await eventSelect.click();
  await page.getByTitle(await page.evaluate(() => window.eventText('333mbf')), { exact: true }).last().click();
  await page.getByRole('textbox', { name: 'Cubes attempted', exact: true }).fill('3');
  await page.getByRole('button', { name: 'Next: timing', exact: true }).click();
  await page.getByRole('textbox', { name: 'Time', exact: true }).fill('1:20');
  await page.getByRole('button', { name: 'Confirm time', exact: true }).click();
  await page.getByRole('textbox', { name: 'Cubes solved successfully', exact: true }).fill('2');
  await page.getByRole('button', { name: 'Submit attempt', exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('cubingPro.groupTimer.v1:777777')).solves['333mbf|0|0']?.mbf?.solved === 2);
  await page.getByRole('button', { name: 'Understood', exact: true }).click();
  await more('competitionAdmin.export');
  assert.equal(await page.getByRole('textbox', { name: await text('competitionAdmin.exportPreview'), exact: true }).inputValue(), '333mbf[1] 2/3 1:20');
  await closeDialog();
  console.log('PASS multi-blind: attempted/time/solved stages and compatible export');
  await (await button('competitionAdmin.storedResults')).click();
  const beforeSwitch = await page.evaluate(() => localStorage.getItem('cubingPro.groupTimer.v1:777777'));
  for (const locale of locales) {
    await switchTo(locale, 'multiBlind');
    await checkText(locale, 'live history portal');
    const dialog = page.getByRole('dialog').last();
    assert.ok((await dialog.innerText()).includes(await page.evaluate(() => window.eventText('333mbf'))));
    assert.ok((await dialog.innerText()).includes(await text('competitionPublic.final')));
    assert.equal(await page.evaluate(() => localStorage.getItem('cubingPro.groupTimer.v1:777777')), beforeSwitch);
  }
  await closeDialog();
  await page.setViewportSize({ width: 390, height: 844 });
  await switchTo('fr', 'off');
  await page.evaluate(() => {
    localStorage.removeItem('cubingPro.groupTimer.v1:777777');
    localStorage.setItem('cubingPro.groupTimerUi.v1', JSON.stringify({ inputMode: 'manual' }));
  });
  await switchTo('fr', 'mobileTimer');
  await page.getByRole('textbox', { name: await text('competitionAdmin.enterTime'), exact: true }).fill('15.67');
  await (await button('competitionAdmin.confirm')).click();
  await more('competitionAdmin.export');
  assert.equal(await page.getByRole('textbox', { name: await text('competitionAdmin.exportPreview'), exact: true }).inputValue(), '333[1] 15.67 DNS DNS DNS DNS');
  await checkText('fr', 'mobile export');
  await closeDialog();
  console.log('PASS live history: seven locales preserve stored solves; mobile manual entry/export');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await switchTo('en-US', 'off');
  await page.evaluate(() => {
    localStorage.removeItem('cubingPro.groupTimer.v1:777777');
    localStorage.setItem('cubingPro.groupTimerUi.v1', JSON.stringify({ inputMode: 'timer', inspectionEnabled: true }));
  });
  await page.clock.install();
  await switchTo('en-US', 'inspection');
  await page.locator('.group-timer-tap-area').click();
  await page.locator('.group-timer-inspection').waitFor();
  await page.clock.runFor(1000);
  await switchTo('ja', 'inspection');
  assert.equal(await page.locator('.group-timer-inspection').count(), 1);
  await page.clock.runFor(16200);
  await page.waitForFunction(() => Object.values(JSON.parse(localStorage.getItem('cubingPro.groupTimer.v1:777777')).solves).some(rec => rec.dnf));
  assert.equal(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('cubingPro.groupTimer.v1:777777')).solves).length), 1);
  await checkText('ja', 'inspection timeout');
  await page.clock.resume();
  console.log('PASS inspection: live language change preserves countdown; >17 seconds records one DNF');
  await switchTo('en-US', 'off');
  failEvents = true;
  await switchTo('en-US', 'scrambles');
  await page.getByText(await text('competitionPublic.eventsFailed'), { exact: true }).waitFor();
  await checkText('en-US', 'event API failure');
  failEvents = false;
  await (await button('competitionAdmin.retry')).click();
  await page.locator('.scramble-round-title').waitFor();
  await switchTo('en-US', 'off');
  failCompetition = true;
  await switchTo('en-US', 'view');
  await page.getByText(await text('competitionPublic.competitionFailed'), { exact: true }).waitFor();
  await checkText('en-US', 'competition API failure');
  failCompetition = false;
  await (await button('competitionAdmin.retry')).click();
  await page.getByRole('heading', { name: 'Fixture Cup', exact: true }).waitFor();
  await switchTo('en-US', 'off');
  failResults = true;
  await switchTo('en-US', 'results');
  await page.getByText(await text('competitionPublic.resultsFailed'), { exact: true }).waitFor();
  await checkText('en-US', 'results API failure');
  failResults = false;
  await (await button('competitionAdmin.retry')).click();
  await page.getByRole('tab', { name: 'Champions', exact: false }).waitFor();
  await checkText('en-US', 'results retry');
  console.log('PASS API errors: localized messages, private diagnostics excluded, retries recover');
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
