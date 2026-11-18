import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';

// Mount the real confirmation components under the production providers. This
// bounded harness can run while unrelated Next routes are being edited.
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const artifacts = '/var/folders/p8/b3ryxj6s1bd4wgsspxzhfnw40000gn/T/opencode/portal-theme';
await mkdir(artifacts, { recursive: true });
const bundle = await build({
  stdin: { resolveDir: root, loader: 'tsx', contents: `
    import React, {useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import {createPortal} from 'react-dom';
    import {App, Button} from 'antd';
    import {ChakraProvider} from '@chakra-ui/react';
    import {system} from '${root}/src/theme';
    import {I18nProvider} from '${root}/src/contexts/I18nProvider';
    import {AntThemeProvider} from '${root}/src/components/ui/AntThemeProvider';
    import Toolbar from '${root}/src/views/TeamMatch/components/TeamMatchJsonToolbar';
    import OneImport from '${root}/src/views/TeamMatch/components/BulkOneUidImportModal';
    import {createEmptySession} from '${root}/src/views/TeamMatch/sessionFactory';
    import {getDefaultLiveUISettings} from '${root}/src/views/TeamMatch/liveUiSettings';
    import '${root}/src/styles/tokens.css';
    import '${root}/src/styles/design-system.css';
    import '${root}/src/views/Competition/CompetitionComponents/groupTimer/GroupTimer.css';
    function Host() {
      const [session, setSession] = useState(() => ({...createEmptySession(), name:'Original', players:[
        {id:'p1', name:'Player One', oneId:'100', schoolId:'s1', wcaId:null, avatarDataUrl:null},
        {id:'p2', name:'Player Two', oneId:'200', schoolId:'s1', wcaId:null, avatarDataUrl:null}
      ]}));
      window.portalSession = session;
      return <><Toolbar session={session} liveUISettings={getDefaultLiveUISettings()} onHydrate={setSession} onImportLiveUI={()=>{}} />
        <OneImport session={session} dispatch={action=>{if(action.type==='UPSERT_PLAYERS')setSession(s=>({...s,players:action.players}));}} />
        {createPortal(<div className="group-timer-fs" style={{display:'none',position:'relative',height:'auto',minHeight:0,padding:16}}>
          <div className="group-timer-current-result">12.34</div><p className="group-timer-muted">Secondary</p>
          <p className="group-timer-spare-label">Spare warning</p><span className="group-timer-spare-tag">Spare</span>
          <div className="group-timer-actions">Actions</div><div className="group-timer-bottom-dock">Dock</div>
          <Button className="group-timer-btn-dnf">DNF</Button><Button className="group-timer-btn-plus2">+2</Button><Button className="group-timer-btn-dns">DNS</Button>
          <div className="group-timer-overview-modal-root">{['idle','progress','done'].map(state=><div key={state} className={'group-timer-overview-row group-timer-overview-row--'+state}>{state}</div>)}</div>
        </div>,document.body)}</>;
    }
    createRoot(document.getElementById('root')).render(<ChakraProvider value={system}><I18nProvider><AntThemeProvider><App><Host/></App></AntThemeProvider></I18nProvider></ChakraProvider>);
  ` }, bundle: true, write: false, outdir: '/portal-test', format: 'iife', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
});
const js = bundle.outputFiles.find(f => f.path.endsWith('.js')).text;
const css = bundle.outputFiles.find(f => f.path.endsWith('.css')).text;
const server = createServer((request, response) => {
  response.setHeader('Content-Type', request.url === '/bundle.js' ? 'text/javascript' : request.url === '/bundle.css' ? 'text/css' : 'text/html');
  response.end(request.url === '/bundle.js' ? js : request.url === '/bundle.css' ? css : '<html class="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const evidence = [];
async function token(selector, property, expected) {
  const values = await page.locator(selector).last().evaluate((element, { property, expected }) => {
    const probe = document.createElement('span');
    probe.style.setProperty(property, expected);
    element.appendChild(probe);
    const values = [getComputedStyle(element).getPropertyValue(property), getComputedStyle(probe).getPropertyValue(property)];
    probe.remove();
    return values;
  }, { property, expected });
  assert.equal(values[0], values[1], `${selector} ${property}`);
  evidence.push({ selector, property, actual: values[0], expected: values[1] });
}
try {
  for (const theme of ['light', 'dark']) for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.getByRole('button', { name: '同步 One ID', exact: true }).waitFor();
    await page.evaluate(theme => { document.documentElement.className = theme; }, theme);
    await page.waitForTimeout(100);
    const payload = await page.evaluate(() => ({ ...window.portalSession, name: 'Imported' }));
    const upload = () => page.locator('input[type=file]').setInputFiles({ name: 'team.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(payload)) });
    await upload();
    let confirm = page.getByRole('dialog', { name: '确认导入', exact: true });
    await confirm.waitFor();
    await token('.ant-modal-confirm-title', 'color', 'var(--foreground)');
    await token('.ant-modal-confirm-content', 'color', 'var(--foreground)');
    await token('.ant-modal-container', 'background-color', 'var(--card)');
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(artifacts, `${theme}-${width}-import.png`) });
    await confirm.getByRole('button', { name: /取\s*消/ }).click();
    await confirm.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => window.portalSession.name), 'Original');
    await upload();
    await confirm.getByRole('button', { name: /导\s*入/, exact: true }).click();
    await confirm.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => window.portalSession.name === 'Imported');
    await page.locator('.ant-message-notice').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: '同步 One ID', exact: true }).click();
    const editor = page.getByRole('dialog', { name: '同步 One ID', exact: true });
    await editor.locator('textarea').fill('Player One\t200');
    await editor.getByRole('button', { name: '解析并同步' }).click();
    const conflict = page.getByRole('dialog', { name: 'One ID 冲突' });
    await conflict.waitFor();
    await token('.ant-modal-confirm-title', 'color', 'var(--foreground)');
    await conflict.locator('.ant-modal-confirm-btns button').click();
    await conflict.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => window.portalSession.players[0].oneId), '100');
    await editor.locator('textarea').fill('Player One\t300\nUnknown\t400');
    await editor.getByRole('button', { name: '解析并同步' }).click();
    confirm = page.getByRole('dialog', { name: '确认同步 One ID' });
    await confirm.waitFor();
    await token('.ant-modal-confirm-title', 'color', 'var(--foreground)');
    await token('.ant-modal-confirm-content', 'color', 'var(--foreground)');
    await token('.ant-modal-container', 'background-color', 'var(--card)');
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(artifacts, `${theme}-${width}-one.png`) });
    await confirm.getByRole('button', { name: /取\s*消|Cancel/ }).click();
    await confirm.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => window.portalSession.players[0].oneId), '100');
    await editor.getByRole('button', { name: '解析并同步' }).click();
    await confirm.getByRole('button', { name: '确认写入' }).click();
    await confirm.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => window.portalSession.players[0].oneId === '300');
    await page.locator('.group-timer-fs').evaluate(el => { el.style.display = 'flex'; });
    for (const [selector, property, value] of [
      ['.group-timer-current-result', 'color', 'var(--foreground)'], ['.group-timer-muted', 'color', 'var(--muted-foreground)'],
      ['.group-timer-spare-label', 'color', 'var(--signal-warning)'], ['.group-timer-spare-tag', 'color', 'var(--signal-warning)'],
      ['.group-timer-bottom-dock', 'border-top-color', 'var(--border-default)'], ['.group-timer-actions', 'border-top-color', 'var(--border-default)'],
      ['.group-timer-btn-dnf', 'color', 'var(--destructive)'], ['.group-timer-btn-plus2', 'color', 'var(--signal-warning)'], ['.group-timer-btn-dns', 'color', 'var(--signal-info)'],
      ['.group-timer-overview-row--done', 'background-color', 'color-mix(in srgb,var(--signal-success) 12%,var(--card))'],
      ['.group-timer-overview-row--idle', 'background-color', 'color-mix(in srgb,var(--signal-warning) 12%,var(--card))'],
      ['.group-timer-overview-row--progress', 'border-top-color', 'var(--signal-warning)'],
    ]) await token(selector, property, value);
    assert.equal(await page.locator('.group-timer-fs').evaluate(el => getComputedStyle(el).getPropertyValue('--ant-color-text').trim()), '', 'native portal root has no Ant component variable scope');
    await page.screenshot({ path: join(artifacts, `${theme}-${width}-portal-states.png`) });
    console.log(`PASS ${theme} ${width}: contextual confirm/error colors, cancel/commit behavior, native portal semantic states`);
  }
  assert.deepEqual(errors, []);
} finally {
  await writeFile(join(artifacts, 'report.json'), JSON.stringify({ evidence, errors }, null, 2));
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
