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
import { system } from '@/theme';
import { I18nProvider } from '@/contexts/I18nProvider';
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
    window.png = config.data.get('png');
    window.uploadTemplate = config.data.get('template');
    if(window.failSave) throw Object.assign(new Error('Unavailable'),{response:{status:503}});
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
app.render(<AppRouterContext.Provider value={router}><ChakraProvider value={system}><I18nProvider><PlayerCardView /></I18nProvider></ChakraProvider></AppRouterContext.Provider>);
`;

test('classic/motion, guest privacy, final PNG save, stored motion replay/download/delete', {timeout:180000}, async () => {
  const result = await build({ stdin:{contents:entry,resolveDir:root,loader:'tsx'},bundle:true,write:false,outdir:'out',entryNames:'app',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},plugins:[{name:'auth-only',setup(b){
    b.onResolve({filter:/contexts\/AuthProvider$/},()=>({path:'auth',namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`export const useAuth = () => ({currentUser:localStorage.getItem('test-auth') ? {id:1} : null,loading:false});`,loader:'js'}));
  }}] });
  const js = result.outputFiles.find(f=>f.path.endsWith('.js')).contents;
  const css = result.outputFiles.find(f=>f.path.endsWith('.css')).contents;
  let browser;
  try {
    const origin='http://127.0.0.1:14994';
    browser=await chromium.launch({executablePath:process.env.SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE || undefined});
    const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
    await page.addInitScript(()=>localStorage.setItem('cubing_pro_locale','en-US'));
    const errors=[]; page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
    await page.route('**/*',async route=>{
      const url = new URL(route.request().url());
      if(url.origin !== origin) return route.abort();
      if(url.pathname === '/app.js') return route.fulfill({contentType:'text/javascript',body:Buffer.from(js)});
      if(url.pathname === '/app.css') return route.fulfill({contentType:'text/css',body:Buffer.from(css)});
      if(url.pathname.startsWith('/fonts/player-card/')) return route.fulfill({body:await readFile(path.join(root,'public',url.pathname))});
      return route.fulfill({contentType:'text/html',body:'<html><head><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>'});
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
    await page.getByRole('button',{name:'Animated portrait',exact:true}).click();
    const art=page.getByTestId('card-artwork');
    await art.locator('canvas').waitFor();
    assert.deepEqual(await art.locator('canvas').evaluate(i=>[i.width,i.height]),[1080,1440]);
    const transform=()=>art.evaluate(e=>getComputedStyle(e).transform);
    const first=await transform(); await page.waitForTimeout(350); assert.notEqual(await transform(),first);
    const sweep=()=>art.evaluate(e=>getComputedStyle(e,'::after').transform);
    await page.waitForTimeout(1500);const light=await sweep();await page.waitForTimeout(350);assert.notEqual(await sweep(),light);
    await page.getByRole('button',{name:'Pause motion',exact:true}).click();
    const paused=await transform();await page.waitForTimeout(250);assert.equal(await transform(),paused);
    await page.getByRole('button',{name:'Resume motion',exact:true}).click();
    await page.emulateMedia({reducedMotion:'reduce'}); assert.equal(await transform(),'none');
    assert.equal(await art.evaluate(e=>getComputedStyle(e,'::after').animationName),'none');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.getByRole('button',{name:'Classic square',exact:true}).click();
    assert.equal(await classic.evaluate(c=>c.toDataURL()),before,'classic pixels unchanged after switching');
    assert.deepEqual(await page.evaluate(()=>window.requests),[],'guest editing never calls card API');
    await page.evaluate(()=>{localStorage.setItem('test-auth','1');localStorage.setItem('authToken_cubing_pro',JSON.stringify({token:'fixture-token'}));});
    await page.reload(); await upload();
    await page.getByRole('button',{name:'Animated portrait',exact:true}).click();
    await page.getByRole('button',{name:'Save to My cards',exact:true}).click();
    await page.getByText('Saved to My cards.',{exact:true}).waitFor();
    assert.deepEqual(await page.evaluate(()=>window.fields.sort()),['png','template','title']);
    assert.equal(await page.evaluate(()=>window.uploadTemplate),'motion');
    assert.equal(await page.evaluate(async()=>{
      const saved=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(window.png);});
      return saved===document.querySelector('[data-testid=card-artwork] canvas').toDataURL('image/png');
    }),true,'uploaded bytes are exactly the final preview PNG');
    if(process.env.SITE_PLAYER_CARD_SCREENSHOT) await art.screenshot({path:process.env.SITE_PLAYER_CARD_SCREENSHOT});
    assert.deepEqual(await page.evaluate(async()=>{const i=await createImageBitmap(window.png);return [i.width,i.height,window.png.type];}),[1080,1440,'image/png']);
    await page.evaluate(()=>window.failSave=true);
    await page.getByRole('button',{name:'Save to My cards',exact:true}).click();
    await page.getByText('Save failed. Retry or download the PNG.',{exact:true}).waitFor();
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download PNG · 1080 × 1440',exact:true}).click()]);
    assert.equal(download.suggestedFilename(),'player-card.png');
    await page.evaluate(()=>window.renderCards());
    await page.getByRole('button',{name:'View',exact:true}).click();
    await page.getByTestId('card-artwork').locator('img').waitFor();
    const replay=await transform();await page.waitForTimeout(350);assert.notEqual(await transform(),replay);
    await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await transform(),'none');
    const [savedDownload]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Download PNG',exact:true}).click()]);
    assert.ok(savedDownload.suggestedFilename().endsWith('.png'));
    page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Delete',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.requests.filter(r=>r.method==='delete').length),0);
    page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete',exact:true}).click();
    await page.getByText('No saved cards yet.',{exact:true}).waitFor();
    const requests=await page.evaluate(()=>window.requests);
    assert.ok(requests.every(r=>r.auth==='Bearer fixture-token'));
    assert.ok(requests.some(r=>r.url==='/user/cube-cards/42/image'));
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
