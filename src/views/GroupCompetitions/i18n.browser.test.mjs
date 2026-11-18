import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import * as XLSX from 'xlsx';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const pendingRoot = process.env.COMPETITION_EXTRA_PENDING_ROOT === '1';
if (pendingRoot) console.log('ISOLATED COMPONENT CHECK: explicitly inject competitionExtra catalogs; root integration is NOT verified.');
const bundle = await build({
  stdin: { resolveDir: root, loader: 'tsx', contents: `
    import React,{useEffect,useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import {App} from 'antd';
    import {ChakraProvider} from '@chakra-ui/react';
    import {system} from '${root}/src/theme';
    import {I18nProvider,useI18n} from '${root}/src/contexts/I18nProvider';
    import {AntThemeProvider} from '${root}/src/components/ui/AntThemeProvider';
    import {catalogs} from '${root}/src/i18n';
    import * as extra from '${root}/src/i18n/messages/competition-extra';
    import {GcCompetitionsView} from './src/views/GroupCompetitions/Competitions/GcCompetitionsView';
    import {GcPlayersView} from './src/views/GroupCompetitions/Players/GcPlayersView';
    import {GcEventsView} from './src/views/GroupCompetitions/Events/GcEventsView';
    import {GcPktimerView} from './src/views/GroupCompetitions/Pktimer/GcPktimerView';
    import {GcRecordsView} from './src/views/GroupCompetitions/Records/GcRecordsView';
    import {GcStaticView} from './src/views/GroupCompetitions/Static/GcStaticView';
    import {KinCh} from './src/views/GroupCompetitions/Static/Kinsor';
    import {GcPlayerView} from './src/views/GroupCompetitions/Player/GcPlayerView';
    import Nemesis from './src/views/GroupCompetitions/Player/components/PlayerResultNemesis';
    import EventsOnly from './src/views/Static/EventSelectorEventsOnly';
    import {ScoreRangeChart} from './src/views/GroupCompetitions/Player/components/BestBoGroup';
    import {CubesCn} from './src/components/CubeIcon/cube';
    import {getCountryDisplayName} from './src/views/Wca/PlayerComponents/region/all_contiry';
    import {getInstanceByDom} from 'echarts';
    import './src/styles/tokens.css';
    const exportsByLocale={'zh-CN':extra.competitionExtraZhCN,'en-US':extra.competitionExtraEnUS,ja:extra.competitionExtraJa,'yue-Hant-HK':extra.competitionExtraYue,ko:extra.competitionExtraKo,fr:extra.competitionExtraFr,es:extra.competitionExtraEs};
    window.catalogGaps=Object.entries(exportsByLocale).flatMap(([locale,dict])=>Object.keys(dict).filter(key=>!catalogs[locale][key]).map(key=>locale+':'+key));
    if(${pendingRoot})for(const [locale,dict] of Object.entries(exportsByLocale))Object.assign(catalogs[locale],dict);
    function Controller(){
      const {locale,setLocale,t}=useI18n();
      const [scenario,setScenario]=useState('events');
      window.setScenario=(language,next)=>{setLocale(language);setScenario(next);};
      window.text=key=>t(key);
      window.localizedNames={event:CubesCn('333',locale),country:getCountryDisplayName('JP',undefined,locale)};
      window.chartText=()=>Array.from(document.querySelectorAll('[_echarts_instance_]')).flatMap(element=>{
        const option=getInstanceByDom(element)?.getOption();
        if(!option)return [];
        return [option.title?.map(item=>item.text),option.xAxis?.map(item=>item.name),option.yAxis?.map(item=>item.name),option.series?.map(item=>item.name),option.legend?.map(item=>item.data),typeof option.tooltip?.[0]?.formatter==='string'?option.tooltip[0].formatter:''].flat(Infinity).filter(value=>typeof value==='string');
      }).join(' ');
      useEffect(()=>{window.ready=locale+':'+scenario;},[locale,scenario]);
      const scenes={events:<GcEventsView/>,pk:<GcPktimerView/>,records:<GcRecordsView/>,static:<GcStaticView/>,kinch:<KinCh isSenior isCountry/>,player:<GcPlayerView/>,competitions:<GcCompetitionsView/>,players:<GcPlayersView/>,emptyNemesis:<Nemesis nemesis={[]} player={{Name:'Fixture Player'}}/>,selector:<EventsOnly events={['333','222','333bf']} onConfirm={events=>window.confirmedEvents=events}/>,ranges:<ScoreRangeChart data={[1,2,2,3]} ranges={[[0,2],[2,4]]}/>};
      return <main key={scenario} style={{padding:24}}>{scenes[scenario]}</main>;
    }
    createRoot(document.getElementById('root')).render(<ChakraProvider value={system}><I18nProvider><AntThemeProvider><App><Controller/></App></AntThemeProvider></I18nProvider></ChakraProvider>);
  ` },
  plugins: [{ name: 'navigation-fixture', setup(builder) {
    builder.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: 'navigation', namespace: 'fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ loader: 'js', resolveDir: root, contents: `
      import {useSyncExternalStore} from 'react';
      const subscribe=callback=>{window.addEventListener('popstate',callback);return()=>window.removeEventListener('popstate',callback);};
      const snapshot=()=>window.location.pathname+window.location.search;
      export const usePathname=()=>useSyncExternalStore(subscribe,snapshot).split('?')[0];
      export const useSearchParams=()=>new URLSearchParams(useSyncExternalStore(subscribe,snapshot).split('?')[1]||'');
      export const useParams=()=>({id:'fixture'});
      export const useRouter=()=>({replace:url=>{window.history.replaceState(null,'',url);window.dispatchEvent(new PopStateEvent('popstate'));}});
    ` }));
  } }],
  bundle: true, write: false, outdir: '/competition-extra-i18n', format: 'iife', jsx: 'automatic',
  loader: { '.woff': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"development"', 'process.env.NEXT_PUBLIC_API_BASE': '"http://127.0.0.1:20000/v3/cube-api"', 'process.env': '{}' },
});
const js = bundle.outputFiles.find(file => file.path.endsWith('.js')).text;
const css = bundle.outputFiles.find(file => file.path.endsWith('.css'))?.text ?? '';
const server = createServer((request, response) => {
  response.setHeader('Content-Type', request.url === '/bundle.js' ? 'text/javascript' : request.url === '/bundle.css' ? 'text/css' : 'text/html');
  response.end(request.url === '/bundle.js' ? js : request.url === '/bundle.css' ? css : '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
});
const event = { id: '333', name: '333', cn: '', otherNames: 'Rubik;Cube', class: '', isComp: true, isWCA: true, base_route_typ: 7, scrambleValue: '', autoScrambleKey: '333', puzzleId: '333' };
const events = [event, { ...event, id: '222', name: '222' }, { ...event, id: 'fto', name: 'fto', isWCA: false }];
const results = Array.from({ length: 24 }, (_, index) => ({ id: index + 1, key: index + 1, CompetitionID: 1, CompetitionName: 'Fixture Open', Round: '决赛', RoundNumber: 1, PersonName: 'Fixture Player', UserID: 1, CubeID: 'fixture', Best: 10, Average: 12, Result: [10, 11, 12, 13, 14], EventID: '333', EventName: '333', EventRoute: 7, Rank: 1 }));
const player = { id: 1, CubeID: 'fixture', Name: 'Fixture Player', WcaID: '2015TEST01', Detail: { Matches: 1, RestoresNum: 120, SuccessesNum: 120, PodiumNum: 1 }, BestResults: { Single: { '333': results[0], '222': { ...results[0], EventID: '222' }, fto: { ...results[0], EventID: 'fto' } }, Avgs: { '333': results[0], '222': results[0], fto: results[0] } } };
const sor = { PlayerId: 1, CubeId: 'fixture', Rank: 1, wca_id: '2015TEST01', WcaName: 'Fixture Player', PlayerName: 'Fixture Player', CountryIso2: 'JP', Result: 89.5, Results: [{ Event: '333', Result: 89.5, IsBest: true, UseSingle: true, ResultString: '10.00' }] };
const comp = { id: 1, Name: 'Fixture Open', Genre: 5, GroupId: 1, CompStartTime: '2026-11-01T00:00:00Z', CompEndTime: '2026-11-02T00:00:00Z', Status: 'Running', IsDone: true, Count: 1 };
const record = { Index: 1, id: 1, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z', EventId: '333', EventRoute: 7, ResultId: 1, UserId: 1, CubeId: 'fixture', UserName: 'Fixture Player', CompsId: 1, CompsName: 'Fixture Open', CompsGenre: 5, Best: 10, Average: 12, Repeatedly: null, Type: 'CR' };
const requests = [];
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const errors = [];
page.on('pageerror', error => { errors.push(error.message); console.error(error.stack); });
await page.route('**/v3/cube-api/**', async route => {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  requests.push({ path, body: request.postDataJSON() });
  let data;
  if (/\/public\/events\/?$/.test(path)) data = { Events: events };
  else if (path.includes('/statistics/kinch')) data = { items: [sor], total: 1 };
  else if (path.includes('/statistics/records')) data = { Records: [record], Best: { '333': [record] }, Average: { '333': [record] } };
  else if (path.endsWith('/comp_groups')) data = { items: [{ id: 1, name: 'Fixture Group' }] };
  else if (path.endsWith('/pkTimers')) data = { items: [{ id: 1, createdAt: '2026-11-01T12:00:00Z', groupName: 'Fixture Group', pkResults: { count: 5, event, players: [{ userName: 'Fixture Player', userId: 1, best: 10, average: 12, results: [10, 11, 12, 13, 14] }] } }], total: 1 };
  else if (path.endsWith('/results')) data = { All: results };
  else if (path.endsWith('/records')) data = [record];
  else if (path.endsWith('/nemesis')) data = [{ CubeId: 'rival', PlayerName: 'Fixture Rival' }];
  else if (path.endsWith('/comps')) data = { items: [comp], total: 1 };
  else if (path.endsWith('/sor')) data = sor;
  else if (path.endsWith('/player/')) data = { items: [player], total: 1 };
  else if (path.includes('/player/')) data = player;
  else if (path.includes('/comps/')) data = { items: [comp], total: 1 };
  else throw new Error('Unmocked API: ' + path);
  await route.fulfill({ json: { code: 200, data } });
});
const locales = ['zh-CN', 'en-US', 'ja', 'yue-Hant-HK', 'ko', 'fr', 'es'];
async function switchTo(locale, scenario) {
  await page.evaluate(({ locale, scenario }) => window.setScenario(locale, scenario), { locale, scenario });
  await page.waitForFunction(value => window.ready === value, `${locale}:${scenario}`);
}
async function text(key) { return page.evaluate(key => window.text(key), key); }
async function button(key) { return page.getByRole('button').filter({ has: page.getByText(await text(key), { exact: true }) }); }
async function tab(key) { return page.getByRole('tab').filter({ has: page.getByText(await text(key), { exact: true }) }); }
async function check(locale, context) {
  await page.waitForTimeout(150);
  const visible = (await page.locator('body').innerText()) + (await page.evaluate(() => window.chartText()));
  assert.doesNotMatch(visible, /competition(?:Extra|Admin)\.[A-Za-z]|\{(?:name|count|selected|total|seconds)\}/, `${locale}/${context}: raw key or parameter`);
  if (['en-US', 'ko', 'fr', 'es'].includes(locale)) assert.doesNotMatch(visible, /\p{Script=Han}/u, `${locale}/${context}: Chinese leaked`);
  assert.ok(visible.length > 5, context);
}
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => typeof window.setScenario === 'function');
  const gaps = await page.evaluate(() => window.catalogGaps);
  if (!pendingRoot) assert.equal(gaps.length, 0, `Root catalog integration missing ${gaps.length} entries; first: ${gaps.slice(0, 7).join(', ')}`);
  for (const scenario of ['events', 'pk', 'records', 'static', 'kinch', 'player', 'competitions', 'players', 'emptyNemesis', 'selector', 'ranges']) {
    for (const locale of locales) {
      await switchTo(locale, scenario);
      if (['pk', 'kinch', 'static', 'player', 'players'].includes(scenario)) await page.getByText('Fixture Player', { exact: true }).first().waitFor();
      if (scenario === 'competitions') await page.getByText('Fixture Open', { exact: true }).first().waitFor();
      await check(locale, scenario);
    }
    console.log(`PASS ${scenario}: 7 locales and live switching`);
  }
  for (const locale of locales) {
    await switchTo(locale, 'kinch');
    const names = await page.evaluate(() => window.localizedNames);
    await page.getByText(names.country, { exact: true }).waitFor();
    await page.getByRole('row').filter({ hasText: 'Fixture Player' }).getByRole('cell').filter({ hasText: '89.500' }).click();
    await page.getByRole('dialog').waitFor();
    await page.getByRole('dialog').getByText(names.event, { exact: true }).waitFor();
    await check(locale, 'Kinch detail');
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByRole('switch').click();
    await (await button('competitionAdmin.deselectAll')).click();
    await (await button('competitionAdmin.submit')).click();
    await page.getByText(await text('competitionAdmin.selectOne'), { exact: true }).waitFor();
    await (await button('competitionAdmin.speed')).click();
    await (await button('competitionAdmin.submit')).click();
    await check(locale, 'Kinch validation and presets');
    await page.locator('.ant-message-notice').waitFor({ state: 'hidden' });
    await page.getByRole('combobox', { name: await text('competitionExtra.region') }).click();
    await check(locale, 'country dropdown');
    await page.keyboard.press('Escape');
    await switchTo(locale, 'pk');
    await (await button('competitionExtra.collapseAll')).first().click();
    await (await button('competitionExtra.expandAll')).first().click();
    await page.getByText('Fixture Player', { exact: true }).waitFor();
    await check(locale, 'PK expand');
    await switchTo(locale, 'records');
    await page.getByRole('switch').click();
    await page.getByText(await text('competitionExtra.historicalRecords'), { exact: true }).waitFor();
    await page.getByRole('combobox', { name: await text('competitionExtra.recordEvent') }).click();
    await check(locale, 'record event dropdown');
    await page.keyboard.press('Escape');
    await page.getByRole('switch').click();
    await switchTo(locale, 'selector');
    await (await button('competitionAdmin.deselectAll')).click();
    await (await button('competitionAdmin.blind')).click();
    await (await button('competitionAdmin.submit')).click();
    assert.deepEqual(await page.evaluate(() => window.confirmedEvents), ['333bf']);
  }
  for (const locale of locales) {
    await switchTo(locale, 'player');
    for (const key of ['competitionExtra.singleQuantiles', 'competitionExtra.averageQuantiles', 'competitionExtra.resultDistribution', 'competitionExtra.averageResults', 'competitionExtra.byCompetition', 'competitionAdmin.nemesis', 'competitionAdmin.rankingScore']) {
      await (await tab(key)).click();
      await check(locale, key);
    }
    await (await button('competitionExtra.explanation')).hover();
    await page.getByText(await text('competitionExtra.sorTimed'), { exact: true }).waitFor();
    await check(locale, 'SOR explanation');
    await (await tab('competitionAdmin.result')).click();
    const downloadReady = page.waitForEvent('download');
    await (await button('competitionAdmin.download')).click();
    const download = await downloadReady;
    const chunks = [];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    const workbook = XLSX.read(Buffer.concat(chunks), { type: 'buffer' });
    const sheetName = await text('competitionAdmin.personalResults');
    assert.deepEqual(workbook.SheetNames, [sheetName]);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    assert.equal(rows.length, 24);
    const round = rows[0][await text('competitionAdmin.round')];
    assert.ok(round && round !== 'undefined');
    if (['en-US', 'ko', 'fr', 'es'].includes(locale)) assert.doesNotMatch(JSON.stringify(rows), /\p{Script=Han}/u);
    await (await tab('competitionAdmin.byEvent')).click();
    await (await tab('competitionAdmin.successRate')).click();
    await (await tab('competitionAdmin.records')).click();
    await check(locale, 'player records');
    await (await tab('competitionAdmin.competition')).click();
    await check(locale, 'player competitions');
    await (await tab('competitionAdmin.result')).click();
  }
  const lastKinch = requests.filter(request => request.path.includes('/statistics/kinch')).at(-1);
  assert.ok(lastKinch.body.events.includes('333'));
  assert.equal(lastKinch.body.age, 40);
  assert.ok(requests.some(request => request.path.includes('/statistics/records') && request.body.EventId === '333'));
  assert.deepEqual(errors, []);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const scenario of ['events', 'kinch', 'player', 'records', 'pk']) {
    await switchTo('fr', scenario);
    await check('fr', `mobile ${scenario}`);
  }
  console.log('PASS 77 locale/scenario checks + seven-language Kinch detail/validation, PK expansion, record modes, event presets, player charts/SOR and XLSX exports + five mobile flows; zero browser errors');
} catch (error) {
  console.error('Visible UI at failure:', await page.locator('body').innerText());
  throw error;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
