// Offline real-component harness: node --test src/views/DrawTools/PlayerCard/backgroundEditor.browser.test.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
test('mobile local background: touch rectangle, erase, undo, cover backdrop, crop and exact PNG', { timeout: 90000 }, async () => {
  const bundle = await build({
    stdin: { resolveDir: root, loader: 'tsx', contents: `
      import React from 'react'; import {createRoot} from 'react-dom/client';
      import {ChakraProvider} from '@chakra-ui/react'; import {system} from './src/theme';
      import {I18nProvider} from './src/contexts/I18nProvider';
      import {PlayerCardView} from './src/views/DrawTools/PlayerCard/PlayerCardView';
      import {paintCard, INITIAL_CROP} from './src/views/DrawTools/PlayerCard/composition';
      window.paintOriginal = (image) => { const c = document.createElement('canvas'); c.width=c.height=1080; paintCard(c,image,INITIAL_CROP,'','sans-serif'); return c.toDataURL(); };
      createRoot(document.getElementById('root')).render(<ChakraProvider value={system}><I18nProvider><PlayerCardView /></I18nProvider></ChakraProvider>);
    ` }, bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
    loader: { '.css': 'empty' }, define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
  });
  const browser = await chromium.launch({ executablePath: process.env.SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE || undefined });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
    const blocked = [], errors = [];
    await context.addInitScript(() => {
      localStorage.setItem('cubing_pro_locale', 'en-US');
      window.localBlobs = new Set();
      const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = blob => { const url = create(blob); window.localBlobs.add(url); return url; };
      URL.revokeObjectURL = url => { window.localBlobs.delete(url); revoke(url); };
    });
    await context.route('**/*', async route => {
      const req = route.request(), url = new URL(req.url());
      if (url.origin !== 'http://player-card.test' || req.method() !== 'GET') { blocked.push(req.url()); return route.abort(); }
      if (url.pathname === '/bundle.js') return route.fulfill({ contentType: 'text/javascript', body: bundle.outputFiles[0].text });
      if (url.pathname === '/styles.css') return route.fulfill({ contentType: 'text/css', body: (await Promise.all(['tokens.css','design-system.css'].map(f => readFile(`${root}/src/styles/${f}`, 'utf8')))).join('\n') });
      if (url.pathname.startsWith('/fonts/')) return route.fulfill({ contentType: 'font/woff2', body: await readFile(`${root}/public${url.pathname}`) });
      if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<html class="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>' });
      blocked.push(req.url()); return route.abort();
    });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://player-card.test/');
    const button = name => page.getByRole('button', { name, exact: true });
    await page.getByRole('heading', { name: 'Player card maker' }).waitFor();
    assert.equal(await button('Change background').count(), 0);
    const fixture = await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 720; c.height = 960;
      const ctx = c.getContext('2d'); ctx.scale(3,3); const gradient = ctx.createLinearGradient(0,0,240,0);
      gradient.addColorStop(0,'#4693b0'); gradient.addColorStop(1,'#62b36b'); ctx.fillStyle=gradient; ctx.fillRect(0,0,240,320);
      ctx.fillStyle='#c06a38'; ctx.beginPath(); ctx.ellipse(120,155,50,115,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#cb7843'; ctx.fillRect(110,120,20,60);
      return c.toDataURL();
    });
    const upload = () => page.locator('#player-card-photo').setInputFiles({ name: 'portrait.png', mimeType: 'image/png', buffer: Buffer.from(fixture.split(',')[1], 'base64') });
    await upload(); await button('Change background').waitFor();
    const preview = page.getByRole('img', { name: 'Card preview', exact: true });
    const snapshot = () => preview.evaluate(c => c.toDataURL());
    const original = await snapshot();
    assert.equal(original, await page.evaluate(async src => { const img = new Image(); img.src=src; await img.decode(); return window.paintOriginal(img); }, fixture));
    await button('Change background').click();
    assert.equal(await snapshot(), original, 'Opening the editor is pixel-identical');
    const surface = page.getByRole('img', { name: 'Background editing photo' });
    const cdp = await context.newCDPSession(page);
    async function stroke(from, to) {
      await surface.scrollIntoViewIfNeeded(); const r = await surface.boundingBox();
      const p = ([x,y]) => ({ x:r.x+r.width*x, y:r.y+r.height*y });
      await cdp.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[p(from)]});
      for (let i=1;i<=6;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[p([from[0]+(to[0]-from[0])*i/6,from[1]+(to[1]-from[1])*i/6])]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
    const sample = (x,y) => surface.evaluate((c,[x,y]) => [...c.getContext('2d').getImageData(Math.floor(c.width*x),Math.floor(c.height*y),1,1).data], [x,y]);
    await stroke([.23,.07],[.77,.9]);
    assert.equal(await button('Download PNG · 1080 × 1080').isDisabled(),true,'Unfinished box blocks export');
    await button('Use selection').click();
    await page.locator('#background-color').fill('#e02080');
    assert.deepEqual(await sample(.1,.3),[224,32,128,255]);
    assert.deepEqual(await sample(.5,.4),[203,120,67,255], 'Original foreground texture retained');
    assert.notDeepEqual(await sample(.25,.3),[224,32,128,255], 'Background colors inside the rectangle are retained');
    const beforeErase = await snapshot();
    await button('Redraw selection').click();
    await stroke([.77,.9],[.23,.07]);
    await button('Use selection').click();
    assert.equal(await snapshot(),beforeErase,'Reversed touch gesture produces the identical rectangle');
    const size = page.getByRole('slider', { name: 'Eraser size' });
    await size.scrollIntoViewIfNeeded(); await size.tap();
    assert.ok(Number(await size.inputValue()) > 1, 'Eraser size responds to touch');
    await size.focus(); await size.press('Home');
    for (let i=0;i<4;i++) await size.press('ArrowRight');
    assert.equal(await size.inputValue(), '5');
    await stroke([.5,.3],[.5,.65]);
    assert.deepEqual(await sample(.5,.4),[224,32,128,255]);
    await button('Undo last stroke').click();
    assert.equal(await snapshot(),beforeErase,'Undo restores the exact mask/composite');
    await page.getByLabel('Choose local backdrop', {exact:true}).setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('invalid image')});
    await page.getByRole('alert').waitFor();
    assert.equal(await button('Download PNG · 1080 × 1080').isDisabled(),false,'Decode failure allows exporting the previous result');
    assert.equal(await snapshot(),beforeErase);
    const backdrop = await page.evaluate(() => {
      const c=document.createElement('canvas');c.width=400;c.height=100;const ctx=c.getContext('2d');ctx.fillStyle='#1133dd';ctx.fillRect(0,0,400,100);ctx.fillStyle='#ffe000';ctx.fillRect(150,0,100,100);return c.toDataURL().split(',')[1];
    });
    await page.getByLabel('Choose local backdrop', {exact:true}).setInputFiles({name:'backdrop.png',mimeType:'image/png',buffer:Buffer.from(backdrop,'base64')});
    await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(b=>b.textContent==='Download PNG · 1080 × 1080').disabled);
    assert.deepEqual(await sample(.1,.3),[255,224,0,255],'Wide backdrop fills by cover, not stretching');
    assert.equal(await page.evaluate(()=>window.localBlobs.size),2);
    await button('Finish editing').click();
    assert.equal(await surface.count(),0);
    await page.locator('#player-card-name').fill('River');
    await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(b=>b.textContent==='Download PNG · 1080 × 1080').disabled);
    const beforeCrop = await snapshot();
    await page.locator('#player-card-zoom').focus(); await page.locator('#player-card-zoom').press('End');
    await preview.scrollIntoViewIfNeeded(); const r=await preview.boundingBox();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*.6,y:r.y+r.height*.5}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+r.width*.4,y:r.y+r.height*.5}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.notEqual(await snapshot(),beforeCrop,'Crop still responds outside editor');
    const exact = await snapshot();
    const [download] = await Promise.all([page.waitForEvent('download'),button('Download PNG · 1080 × 1080').click()]);
    const chunks=[]; for await (const chunk of await download.createReadStream()) chunks.push(chunk); const png=Buffer.concat(chunks);
    assert.deepEqual(png,Buffer.from(exact.split(',')[1],'base64'));
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a'); assert.equal(png.readUInt32BE(16),1080);assert.equal(png.readUInt32BE(20),1080);
    await button('Change background').click(); await button('Restore original').click();
    await button('Finish editing').click(); await button('Reset position and zoom').click(); await page.locator('#player-card-name').fill('');
    assert.equal(await snapshot(),original,'Restore preserves original photo pixels');
    assert.equal(await page.evaluate(()=>window.localBlobs.size),1,'Backdrop blob released on restore');
    await upload(); await button('Change background').waitFor();
    assert.equal(await page.evaluate(()=>window.localBlobs.size),1,'Previous photo blob released on replacement');
    for (const width of [390,1440]) { await page.setViewportSize({width,height:900}); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); }
    assert.deepEqual(blocked,[],'No network APIs, external requests or writes'); assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
});
