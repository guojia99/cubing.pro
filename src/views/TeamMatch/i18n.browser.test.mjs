import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const bundle = await build({
  stdin: { resolveDir: root, loader: 'tsx', contents: `
    import React, {useEffect, useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import {App} from 'antd';
    import {ChakraProvider} from '@chakra-ui/react';
    import {system} from '${root}/src/theme';
    import {I18nProvider, useI18n} from '${root}/src/contexts/I18nProvider';
    import {AntThemeProvider} from '${root}/src/components/ui/AntThemeProvider';
    import {TeamMatchProvider, useTeamMatchStore} from '${root}/src/views/TeamMatch/TeamMatchContext';
    import Steps from '${root}/src/views/TeamMatch/TeamMatchSteps';
    import PlayerEdit from '${root}/src/views/TeamMatch/components/PlayerEditModal';
    import TeamEdit from '${root}/src/views/TeamMatch/components/TeamEditModal';
    import SeedingEdit from '${root}/src/views/TeamMatch/components/SeedingPlayerModal';
    import PreliminaryBatch from '${root}/src/views/TeamMatch/components/PreliminaryBatchModal';
    import LiveSettings from '${root}/src/views/TeamMatch/components/LiveSettingsModal';
    import OneComp from '${root}/src/views/TeamMatch/components/OneCompPrelimImportCard';
    import PkModal from '${root}/src/views/TeamMatch/components/PkModal';
    import GroupModal from '${root}/src/views/TeamMatch/components/PkGroupModal';
    import Arena from '${root}/src/views/TeamMatch/components/PkArenaFullscreen';
    import GroupArena from '${root}/src/views/TeamMatch/components/PkGroupArenaFullscreen';
    import Bracket from '${root}/src/views/TeamMatch/components/BracketStage';
    import Podium from '${root}/src/views/TeamMatch/components/PodiumStage';
    import {getDefaultLiveUISettings} from '${root}/src/views/TeamMatch/liveUiSettings';
    import {createEmptySession} from '${root}/src/views/TeamMatch/sessionFactory';
    import {reduceSession} from '${root}/src/views/TeamMatch/sessionReducer';
    import {tm} from '${root}/src/views/TeamMatch/i18n';
    import '${root}/src/styles/tokens.css';
    import '${root}/src/views/TeamMatch/TeamMatch.css';
    const settings = getDefaultLiveUISettings();
    let fixture = createEmptySession();
    fixture.schools = [{id:'school', name:'Academy', kind:'standard'}];
    fixture.teams = Array.from({length:20}, (_,i)=>({id:'t'+i,name:'Team '+(i+1),schoolId:'school',kind:'school',playerIds:[0,1,2].map(j=>'p'+i+'-'+j),disabled:false,isSeed:false}));
    fixture.players = fixture.teams.flatMap(team=>team.playerIds.map(id=>({id,name:id,schoolId:'school',wcaId:null,oneId:null,avatarDataUrl:null})));
    fixture.players[0].oneId = '100';
    fixture.seeding = fixture.players.map((p,i)=>({playerId:p.id,eventId:'333',single:10+i/100,average:11+i/100,activeSource:'preliminary',preliminary:{single:10+i/100,average:11+i/100}}));
    fixture = reduceSession(fixture,{type:'ENSURE_ELIMINATION_STATE'});
    fixture = reduceSession(fixture,{type:'RANDOMIZE_ELIM_DRAW'});
    const main = reduceSession(reduceSession(reduceSession(fixture,{type:'SKIP_ELIMINATION_TO_MAIN_DRAW'}),{type:'CONFIRM_MAIN_BRACKET_POOL'}),{type:'RANDOMIZE_DRAW'});
    const bracket = reduceSession(main,{type:'REBUILD_BRACKET'});
    const pkMatch = bracket.rounds[0].find(match=>match.pk);
    const groupMatch = fixture.elimination.matches.find(match=>match.pk);
    const noop = ()=>{};
    function Controller() {
      const {locale,setLocale} = useI18n();
      const {state,dispatch} = useTeamMatchStore();
      const [scenario,setScenario] = useState('step0');
      window.setTeamMatchScenario = (language,next)=>{setLocale(language);setScenario(next);};
      window.teamMatchText = (key,params)=>tm(locale,'teamMatch.'+key,params);
      useEffect(()=>{
        const source = scenario==='bracket' ? bracket : scenario==='step6' || scenario==='step7' ? main : fixture;
        dispatch({type:'HYDRATE',session:{...source,wizardStep:Number(scenario.replace('step',''))||0}});
      },[scenario,dispatch]);
      useEffect(()=>{window.teamMatchReady = locale+':'+scenario;},[locale,scenario,state.session]);
      const session = state.session;
      const common = {open:true,onClose:noop};
      if(scenario==='player')return <PlayerEdit {...common} editing={null} schools={session.schools} onSave={noop}/>;
      if(scenario==='team')return <TeamEdit {...common} editing={null} schools={session.schools} players={session.players} usedPlayerIds={new Set()} activeTeamCount={0} onSave={noop}/>;
      if(scenario==='seeding')return <SeedingEdit {...common} player={fixture.players[0]} eventId="333" entry={fixture.seeding[0]} onSave={noop}/>;
      if(scenario==='batch')return <PreliminaryBatch {...common} session={session} eventId="333" dispatch={dispatch}/>;
      if(scenario==='settings')return <LiveSettings {...common} value={settings} onApply={noop}/>;
      if(scenario==='oneComp')return <OneComp session={fixture} dispatch={dispatch}/>;
      if(scenario==='pk')return <PkModal {...common} match={pkMatch} teams={fixture.teams} players={fixture.players} draft={[]} onDraftChange={noop} onSettle={noop} onManualWinner={noop} onReplay={noop} onClearCurrent={noop}/>;
      if(scenario==='groupPk')return <GroupModal {...common} match={groupMatch} teams={fixture.teams} players={fixture.players} draft={[]} onDraftChange={noop} onSettle={noop} onManualWinner={noop} onReplay={noop} onClearCurrent={noop}/>;
      const playerLite = team=>fixture.players.filter(p=>team.playerIds.includes(p.id)).map(p=>({...p,schoolName:'Academy',scoresLine:tm(locale,'teamMatch.scoreLine',{single:10,average:11}),playerBattlecry:''}));
      if(scenario==='arena')return <Arena {...common} settings={settings.arena} teamA={fixture.teams[0]} teamB={fixture.teams[1]} playersA={playerLite(fixture.teams[0])} playersB={playerLite(fixture.teams[1])} currentResults={[]} onOpenScoreEntry={noop} onOpenLiveSettings={noop}/>;
      if(scenario==='groupArena')return <GroupArena {...common} settings={settings.arena} columns={fixture.teams.slice(0,3).map(team=>({team,players:playerLite(team),dim:false}))} currentResults={[]} onOpenScoreEntry={noop} onOpenLiveSettings={noop}/>;
      if(scenario==='bracket')return <Bracket liveSettings={settings} onOpenLiveSettings={noop}/>;
      if(scenario==='podium')return <Podium/>;
      return <Steps liveUISettings={settings} onLiveUISettingsChange={noop}/>;
    }
    createRoot(document.getElementById('root')).render(<ChakraProvider value={system}><I18nProvider><AntThemeProvider><App><TeamMatchProvider><Controller/></TeamMatchProvider></App></AntThemeProvider></I18nProvider></ChakraProvider>);
  ` },
  bundle: true, write: false, outdir: '/team-match-i18n', format: 'iife', jsx: 'automatic',
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
const locales = ['zh-CN', 'en-US', 'ja', 'yue-Hant-HK', 'ko', 'fr', 'es'];
const scenarios = ['step0', 'step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'player', 'team', 'seeding', 'batch', 'settings', 'bracket', 'podium', 'pk', 'groupPk', 'arena', 'groupArena'];
async function switchTo(locale, scenario) {
  await page.evaluate(({ locale, scenario }) => { window.setTeamMatchScenario(locale, scenario); }, { locale, scenario });
  await page.waitForFunction(value => window.teamMatchReady === value, `${locale}:${scenario}`);
  await page.waitForTimeout(100);
}
async function checkText(locale, scenario) {
  if (['en-US', 'ko', 'fr', 'es'].includes(locale)) {
    // Ant animates the previous validation message out after revalidation.
    await page.waitForFunction(() => !/\p{Script=Han}/u.test(document.body.innerText), undefined, { timeout: 5000 });
  }
  const visibleText = await page.locator('body').innerText();
  assert.doesNotMatch(visibleText, /teamMatch\.[A-Za-z]|\{(?:p\d+|count|name|line)\}|dnf_team|^incomplete$/m, `${locale}/${scenario}: leaked key or state`);
  if (['en-US', 'ko', 'fr', 'es'].includes(locale)) assert.doesNotMatch(visibleText, /\p{Script=Han}/u, `${locale}/${scenario}: untranslated Chinese`);
  assert.ok(visibleText.length > 10, `${locale}/${scenario}: empty UI`);
}
async function button(key) {
  const title = await page.evaluate(key => window.teamMatchText(key), key);
  return page.getByRole('button', { name: title, exact: true });
}
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => typeof window.setTeamMatchScenario === 'function');
  for (const scenario of scenarios) {
    for (const locale of locales) {
      await switchTo(locale, scenario);
      await checkText(locale, scenario);
      if (scenario === 'player' || scenario === 'team') {
        await (await button('save')).click();
        await page.locator('.ant-form-item-explain-error').first().waitFor();
        await checkText(locale, `${scenario} validation`);
      }
    }
    console.log(`PASS ${scenario}: 7 locales, live language switching, no untranslated text or raw keys`);
  }
  for (const locale of locales) {
    await switchTo(locale, 'step0');
    for (const [button, key] of [['syncUid', 'syncUid'], ['pasteRoster', 'pasteRoster'], ['addPlayer', 'addPlayer']]) {
      const title = await page.evaluate(key => window.teamMatchText(key), button);
      await page.getByRole('button', { name: title, exact: true }).click();
      const dialogName = await page.evaluate(key => window.teamMatchText(key), key);
      const dialog = page.getByRole('dialog', { name: dialogName, exact: true });
      await dialog.waitFor();
      await checkText(locale, button);
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
    }
  }
  for (const locale of locales) {
    await switchTo(locale, 'step0');
    await switchTo(locale, 'oneComp');
    await page.locator('.ant-input-number-input').first().fill('123');
    await page.route('**/api/grade/comp?**', route => route.fulfill({ json: { code: 10000, data: [
      { u_id: 100, u_name: 'Known player', t_single: '1234', t_avg: '1500' },
      { u_id: 999, u_name: 'Outside roster', t_single: '2000', t_avg: '2500' },
    ] } }));
    await (await button('import')).click();
    const preview = await page.evaluate(() => window.teamMatchText('prelimPreviewTitle'));
    await page.getByRole('dialog', { name: preview, exact: true }).waitFor();
    await checkText(locale, 'One import preview');
    await page.keyboard.press('Escape');
    await page.getByRole('dialog', { name: preview, exact: true }).waitFor({ state: 'hidden' });
  }
  assert.deepEqual(errors, []);
  console.log(`PASS ${scenarios.length * locales.length} scenario/locale checks + 21 dialogs + 14 validation states + 7 One previews; zero browser errors`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
