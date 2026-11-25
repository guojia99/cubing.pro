// Offline component integration. Run with Node 22: node --test this-file.
// The real Go fixture + static export integration is run separately.
import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const entry = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import '@/styles/tokens.css';
import '@/styles/design-system.css';
import { system } from '@/theme';
import { I18nProvider } from '@/contexts/I18nProvider';
import { AppShell } from '@/components/layout/AppShell';
import { PlayerCardView } from '@/views/DrawTools/PlayerCard/PlayerCardView';
import { MyCards } from '@/views/DrawTools/PlayerCard/MyCards';
import { Request } from '@/services/cubing-pro/request';
window.requests = [];
window.cards = [];
window.png = null;
Request.defaults.adapter = async config => {
  window.requests.push({url:config.url, method:config.method, auth:config.headers.Authorization, page:config.params?.page});
  let data;
  if (config.method === 'post') {
    window.fields = [...config.data.keys()];
    window.uploadTemplate = config.data.get('template');
    if(window.failSave) throw Object.assign(new Error('Unavailable'),{response:{status:503}});
    window.png = config.data.get('png');
    data = {id:42,title:config.data.get('title'),template:config.data.get('template'),createdAt:'2026-11-25T00:00:00Z'};
    window.cards = [data];
  } else if (config.method === 'delete') { window.cards=[]; data={id:42}; }
  else if (config.url.endsWith('/image')) return {data:window.png,status:200,headers:{},config};
  else data={items:window.cards.slice((config.params.page-1)*20,config.params.page*20),total:window.cards.length,page:config.params.page};
  return {data:{data},status:200,headers:{},config};
};
const app = createRoot(document.getElementById('root'));
let renderId=0; const router={push(){},replace(){},prefetch(){}};
window.renderCards = () => app.render(<AppRouterContext.Provider value={router}><ChakraProvider value={system}><I18nProvider><MyCards key={++renderId} /></I18nProvider></ChakraProvider></AppRouterContext.Provider>);
app.render(<AppRouterContext.Provider value={router}><ChakraProvider value={system}><I18nProvider><AppShell><PlayerCardView /></AppShell></I18nProvider></ChakraProvider></AppRouterContext.Provider>);
`;

const artwork = '[data-testid="card-artwork"]';
const viewportSelector = 'canvas[data-motion-viewport], [data-motion-viewport] canvas';

async function assertLiveStage(page) {
  const art = page.locator(artwork);
  await art.scrollIntoViewIfNeeded();
  await page.locator(`${artwork}[data-motion-phase="running"]`).waitFor();
  const viewport = art.locator(viewportSelector);
  assert.equal(await viewport.evaluate(c => {
    const gl = c.getContext('webgl2');
    return gl instanceof WebGL2RenderingContext && !gl.isContextLost() && gl.drawingBufferWidth > 1;
  }), true, 'the viewport has a real WebGL2 drawing buffer');
  await page.waitForFunction(selector => !!document.querySelector(selector)?.dataset.motionPose, artwork);
  const first = await art.getAttribute('data-motion-pose');
  const frame = await viewport.screenshot();
  await page.waitForFunction(([selector, pose]) => document.querySelector(selector).dataset.motionPose !== pose, [artwork, first]);
  assert.ok(!(await viewport.screenshot()).equals(frame), 'a later rendered frame differs from the first frame');
}

async function assertStaticStage(page, source, phase) {
  const art = page.locator(artwork);
  await page.locator(`${artwork}[data-motion-phase="${phase}"]`).waitFor();
  await page.waitForFunction(selector => document.querySelector(selector)?.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}), `${artwork}[data-motion-phase="${phase}"] ${source}`);
  await art.locator(viewportSelector).waitFor({state:'hidden'});
  assert.ok(await page.getByRole('button', {name:/^(Pause|Resume) motion$/}).isHidden());
}

async function downloadedBytes(download) {
  return readFile(await download.path());
}

async function assertFullPhotoWorkbench(page) {
  await page.setViewportSize({width:1366,height:768});
  await page.emulateMedia({reducedMotion:'reduce'});
  const button = name => page.getByRole('button',{name,exact:true});
  await button('Animated portrait').click();
  const bench = page.getByTestId('motion-workbench');
  const brush = page.locator('#player-card-brush-size');
  const undo = button('Undo latest stroke');
  assert.ok(await undo.isDisabled());
  assert.ok(await button('Restore original background').isDisabled());
  await button('Repair eraser').click();
  await bench.waitFor();
  assert.equal(await brush.inputValue(),'12','an automatic matte is immediately editable');

  const portrait = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width=600; canvas.height=900;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle='#f1d0be'; ctx.fillRect(0,0,600,230);
    ctx.fillStyle='#406a8a'; ctx.fillRect(0,230,600,570);
    ctx.fillStyle='#52c1c9'; ctx.fillRect(0,800,600,100);
    ctx.fillStyle='#f47330'; ctx.fillRect(214,170,172,460);
    ctx.fillStyle='#00ff28'; ctx.fillRect(284,812,32,32);
    return canvas.toDataURL().split(',')[1];
  });
  await page.locator('#player-card-photo').setInputFiles({name:'portrait.png',mimeType:'image/png',buffer:Buffer.from(portrait,'base64')});
  await button('Replace solid background').click();
  await bench.waitFor();
  assert.deepEqual(await bench.evaluate(canvas=>[canvas.width,canvas.height]),[600,900]);
  const bounds = await bench.boundingBox();
  assert.ok(bounds && Math.abs(bounds.height/bounds.width-1.5)<.02,`full photo aspect ratio: ${JSON.stringify(bounds)}`);
  const at = (x,y) => ({position:{x:x*bounds.width,y:y*bounds.height}});
  const pixel = (x,y) => bench.evaluate((canvas,[px,py]) => [...canvas.getContext('2d').getImageData(px,py,1,1).data],[x,y]);
  assert.deepEqual(await pixel(72,828),[82,193,201,255],'picker shows the original lower band beyond the central square crop');
  await bench.click(at(.12,.92));
  await bench.waitFor({state:'hidden'});

  const art = page.getByTestId('card-artwork');
  await page.locator('#player-card-subject-scale').press('Home');
  for(let i=0;i<8;i++) await art.press('Shift+ArrowUp');
  const markerPixels = () => art.locator('canvas[role="img"]').evaluate(canvas => {
    const pixels = canvas.getContext('2d').getImageData(420,900,240,240).data;
    let green = 0;
    for (let i=0;i<pixels.length;i+=4) if(pixels[i+1]>100 && pixels[i+1]>pixels[i]+60 && pixels[i+1]>pixels[i+2]+50) green++;
    return green;
  });
  const before = await markerPixels();
  assert.ok(before>100,'the lower green remnant must initially be visible in the 1080×1440 export');
  await button('Repair eraser').click();
  await page.getByText('Cutout editor · isolated subject view',{exact:true}).waitFor();
  const isChecker = rgba => [[238,240,244,255],[216,221,230,255]].some(color=>color.every((v,i)=>v===rgba[i]));
  assert.ok(isChecker(await pixel(72,828)),'picking at 92% removed the lower band, not the center band');
  assert.deepEqual(await pixel(300,828),[0,255,40,255]);
  await brush.press('End');
  assert.equal(await brush.inputValue(),'52');
  await bench.click(at(.5,.92));
  const erased = await pixel(300,828);
  assert.ok(isChecker(erased),'erasing the full-photo bottom reveals the checkerboard');
  assert.equal(await markerPixels(),0,'the bottom remnant disappears from the final card, not just the workbench');
  await button('Restore brush').click();
  const ghost = await pixel(300,828);
  for (let channel=0;channel<3;channel++) {
    assert.ok(Math.abs(ghost[channel]-(erased[channel]*.78+[0,255,40][channel]*.22))<=2,'the original guides restoration at 22% opacity');
  }
  assert.equal(await markerPixels(),0,'the ghost is never exported');
  await undo.click();
  assert.equal(await markerPixels(),before,'undo recovers the same exported remnant pixels');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>window.scrollTo(0,0));
}

test('classic/motion, guest privacy, final PNG save, stored motion replay/download/delete', {timeout:180000}, async () => {
  const result = await build({ stdin:{contents:entry,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'esm',splitting:true,outdir:'out',entryNames:'app',chunkNames:'chunks/[name]-[hash]',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},plugins:[{name:'auth-only',setup(b){
    b.onResolve({filter:/contexts\/AuthProvider$/},()=>({path:'auth',namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`export const useAuth = () => ({currentUser:localStorage.getItem('test-auth') ? {id:1} : null,loading:false});`,loader:'js'}));
  }}] });
  const assets = new Map(result.outputFiles.map(f=>['/'+path.relative(path.join(root,'out'),f.path),f.contents]));
  let browser;
  try {
    const origin='http://127.0.0.1:14994';
    browser=await chromium.launch({executablePath:process.env.SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE || undefined});
    const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
    await page.addInitScript(()=>localStorage.setItem('cubing_pro_locale','en-US'));
    const sceneRequests=[];
    page.on('request',r=>{ if(new URL(r.url()).pathname.startsWith('/chunks/motionScene-')) sceneRequests.push(r.url()); });
    const errors=[]; page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
    await page.route('**/*',async route=>{
      const url = new URL(route.request().url());
      if(url.origin !== origin) return route.abort();
      if(assets.has(url.pathname)) return route.fulfill({contentType:url.pathname.endsWith('.css')?'text/css':'text/javascript',body:Buffer.from(assets.get(url.pathname))});
      if(url.pathname.startsWith('/fonts/player-card/')) return route.fulfill({body:await readFile(path.join(root,'public',url.pathname))});
      return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>'});
    });
    await page.goto(origin,{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'Classic square',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Save to My cards',exact:true}).count(),0);
    const fixture=await page.evaluate(()=>{
      const c=document.createElement('canvas'); c.width=c.height=360; const x=c.getContext('2d');
      // Synthetic geometric Rubik's cube only.
      x.fillStyle='#dbe8ed'; x.fillRect(0,0,360,360);
      for(let r=0;r<3;r++)for(let col=0;col<3;col++){x.fillStyle=['#d55042','#eecb4a','#4083bf'][(r+col)%3];x.fillRect(70+col*74,70+r*74,66,66);}
      return c.toDataURL().split(',')[1];
    });
    const upload=()=>page.locator('#player-card-photo').setInputFiles({name:'cube.png',mimeType:'image/png',buffer:Buffer.from(fixture,'base64')});
    await upload();
    const classic=page.getByRole('img',{name:'Card preview',exact:true});
    await page.waitForFunction(()=>!document.querySelector('#player-card-zoom').disabled);
    const before=await classic.evaluate(c=>c.toDataURL());
    assert.equal(sceneRequests.length,0,'classic does not load the Three scene');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.getByRole('button',{name:'Animated portrait',exact:true}).click();
    const art=page.getByTestId('card-artwork');
    const source = art.locator('canvas[role="img"]');
    const viewport = art.locator(viewportSelector);
    assert.deepEqual(await source.evaluate(i=>[i.width,i.height]),[1080,1440]);
    await assertStaticStage(page,'canvas[role="img"]','static');
    assert.equal(sceneRequests.length,0,'opening motion with reduced-motion never imports the scene');
    const motionPixels = () => source.evaluate(async canvas => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      return [...new Uint8Array(await crypto.subtle.digest('SHA-256', pixels))].join(',');
    });
    const zoom = page.locator('#player-card-zoom');
    const scale = page.locator('#player-card-subject-scale');
    assert.equal(await zoom.inputValue(),'1');
    const initialMotion = await motionPixels();
    await art.scrollIntoViewIfNeeded();
    const bounds = await art.boundingBox();
    assert.ok(bounds);
    const centerX = bounds.x + bounds.width / 2, centerY = bounds.y + bounds.height / 2;
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    assert.equal(await art.getAttribute('data-dragging'), 'true');
    await page.mouse.move(centerX + 32, centerY - 44, {steps: 3});
    await page.mouse.up();
    assert.equal(await art.getAttribute('data-dragging'), null);
    const dragged = await motionPixels();
    assert.notEqual(dragged, initialMotion, 'dragging the artwork at crop zoom 1 moves the exported subject');
    await art.press('Shift+ArrowLeft');
    assert.notEqual(await motionPixels(), dragged, 'keyboard nudge adjusts the export');
    await art.press('Shift+ArrowRight');
    assert.equal(await motionPixels(), dragged, 'opposite nudges restore the exact position');
    await scale.press('End');
    assert.equal(await scale.inputValue(),'1.8');
    assert.equal(await zoom.inputValue(),'1');
    assert.notEqual(await motionPixels(), dragged, 'subject scale changes exported pixels without changing crop zoom');
    await page.getByRole('button',{name:'Classic square',exact:true}).click();
    assert.equal(await page.getByRole('slider').count(),1);
    assert.ok(await classic.evaluate(canvas=>canvas.toDataURL()) === before, 'motion edits leave the classic PNG byte-identical before reset');
    await page.getByRole('button',{name:'Animated portrait',exact:true}).click();
    await page.getByRole('button',{name:'Reset position and zoom',exact:true}).click();
    assert.equal(await scale.inputValue(),'1');
    assert.equal(await motionPixels(), initialMotion, 'reset restores the full motion export exactly');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await assertLiveStage(page);
    assert.equal(sceneRequests.length,1,'the scene is imported lazily');
    await page.getByRole('button',{name:'Pause motion',exact:true}).click();
    await page.locator(`${artwork}[data-motion-phase="paused"]`).waitFor();
    await art.scrollIntoViewIfNeeded();
    const paused = await art.getAttribute('data-motion-pose');
    const frozen = await viewport.screenshot();
    await page.waitForTimeout(350);
    assert.equal(await art.getAttribute('data-motion-pose'),paused);
    assert.ok((await viewport.screenshot()).equals(frozen),'pausing freezes the whole scene, including particles and highlights');
    // A frozen pose still accepts new artwork from the editor.
    await page.locator('#player-card-zoom').press('End');
    await art.scrollIntoViewIfNeeded();
    assert.equal(await art.getAttribute('data-motion-pose'),paused);
    assert.ok(!(await viewport.screenshot()).equals(frozen),'crop edits refresh the 3D texture even while paused');
    await page.locator('#player-card-zoom').press('Home');
    await page.getByRole('button',{name:'Resume motion',exact:true}).click();
    await assertLiveStage(page);
    await page.emulateMedia({reducedMotion:'reduce'});
    await assertStaticStage(page,'canvas[role="img"]','static');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.getByRole('button',{name:'Classic square',exact:true}).click();
    assert.equal(await classic.evaluate(c=>c.toDataURL()),before,'classic pixels unchanged after switching');
    await assertFullPhotoWorkbench(page);
    assert.deepEqual(await page.evaluate(()=>window.requests),[],'guest editing never calls card API');
    await page.evaluate(()=>{localStorage.setItem('test-auth','1');localStorage.setItem('authToken_cubing_pro',JSON.stringify({token:'fixture-token'}));});
    await page.setViewportSize({width:1366,height:768});
    await page.reload(); await upload();
    await page.getByRole('button',{name:'Animated portrait',exact:true}).click();
    await art.waitFor();
    const downloadButton = page.getByRole('button',{name:'Download PNG · 1080 × 1440',exact:true});
    assert.equal(await page.evaluate(()=>window.scrollY),0,'the laptop editor opens without scrolling');
    for (const [label, element] of [['motion artwork', art], ['download', downloadButton]]) {
      const box = await element.boundingBox();
      assert.ok(box && box.height > 0 && box.y >= 0 && box.y + box.height <= 768,
        `${label} must fit the 1366×768 viewport: ${JSON.stringify(box)}`);
    }
    await page.getByRole('button',{name:'Save to My cards',exact:true}).click();
    await page.getByText('Saved to My cards.',{exact:true}).waitFor();
    assert.deepEqual(await page.evaluate(()=>window.fields.sort()),['png','template','title']);
    assert.equal(await page.evaluate(()=>window.uploadTemplate),'motion');
    assert.equal(await page.evaluate(async()=>{
      const saved=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(window.png);});
      return saved===document.querySelector('[data-testid=card-artwork] canvas[role=img]').toDataURL('image/png');
    }),true,'uploaded bytes are exactly the final preview PNG');
    if(process.env.SITE_PLAYER_CARD_SCREENSHOT) {
      await assertLiveStage(page);
      await art.screenshot({path:process.env.SITE_PLAYER_CARD_SCREENSHOT});
    }
    const expectedPng = Buffer.from(await source.evaluate(c=>c.toDataURL('image/png').split(',')[1]),'base64');
    assert.deepEqual(await page.evaluate(async()=>{const i=await createImageBitmap(window.png);return [i.width,i.height,window.png.type];}),[1080,1440,'image/png']);
    await page.evaluate(()=>window.failSave=true);
    await page.getByRole('button',{name:'Save to My cards',exact:true}).click();
    await page.getByText('Save failed. Retry or download the PNG.',{exact:true}).waitFor();
    const [download]=await Promise.all([page.waitForEvent('download'),downloadButton.click()]);
    assert.equal(download.suggestedFilename(),'player-card.png');
    assert.ok((await downloadedBytes(download)).equals(expectedPng),'503 does not affect the local PNG bytes');
    await page.evaluate(()=>window.renderCards());
    await page.getByRole('button',{name:'View',exact:true}).click();
    await art.locator('img').waitFor({state:'attached'});
    assert.equal(await art.evaluate(stage=>getComputedStyle(stage).touchAction),'pan-y','stored cards allow normal touch scrolling');
    await assertLiveStage(page);
    await page.emulateMedia({reducedMotion:'reduce'});
    await assertStaticStage(page,'img','static');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await assertLiveStage(page);
    await viewport.evaluate(c => c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    await assertStaticStage(page,'img','fallback');
    assert.deepEqual(await art.locator('img').evaluate(i=>[i.naturalWidth,i.naturalHeight]),[1080,1440]);
    const [savedDownload]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Download PNG',exact:true}).click()]);
    assert.ok(savedDownload.suggestedFilename().endsWith('.png'));
    assert.ok((await downloadedBytes(savedDownload)).equals(expectedPng),'stored replay downloads the same original PNG');
    page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Delete',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.requests.filter(r=>r.method==='delete').length),0);
    page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete',exact:true}).click();
    await page.getByText('No saved cards yet.',{exact:true}).waitFor();
    const requests=await page.evaluate(()=>window.requests);
    assert.ok(requests.every(r=>r.auth==='Bearer fixture-token'));
    assert.deepEqual(requests.filter(r=>r.url.endsWith('/image')).map(r=>r.url),['/user/cube-cards/42/image']);
    await page.evaluate(()=>{window.cards=Array.from({length:21},(_,i)=>({id:i,title:'Card '+i,template:'classic',createdAt:'2026-11-25T00:00:00Z'}));window.renderCards();});
    await page.getByText('Card 0',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'View',exact:true}).count(),20);
    await page.getByRole('button',{name:'Next',exact:true}).click();
    await page.getByText('Card 20',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'View',exact:true}).count(),1);
    assert.equal(await page.getByRole('button',{name:'Next',exact:true}).isDisabled(),true);
    assert.deepEqual(errors,[]);
  } finally {await browser?.close();}
});
