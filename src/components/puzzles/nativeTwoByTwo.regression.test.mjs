import assert from 'node:assert/strict';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';

// node src/components/puzzles/nativeTwoByTwo.regression.test.mjs
// Real native player, React StrictMode and browser layout. All async injections
// below are test-only instance/prototype wrappers, never production hooks.
const root = fileURLToPath(new URL('../../../', import.meta.url));
const bundle = await build({
  stdin: { resolveDir: root, loader: 'tsx', contents: `
    import React, {useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import {flushSync} from 'react-dom';
    import Native from './src/components/puzzles/NativeTwoByTwo';
    import {TwistyPlayer} from 'cubing/twisty';
    window.calls = {thumbnail:0, interactive:0};
    window.initFailures = {thumbnail:1, interactive:1};
    window.stickyFailure = false;
    const original = TwistyPlayer.prototype.experimentalCurrentVantages;
    TwistyPlayer.prototype.experimentalCurrentVantages = async function(...args) {
      const role = this.parentElement.dataset.nativeTwoByTwo;
      window.calls[role]++;
      const vantages = [...await original.apply(this,args)];
      if (!vantages.length) return vantages;
      const wrapper = await vantages[0].scene.experimentalTwisty3DPuzzleWrapper();
      const puzzle = wrapper.twisty3DPuzzle.bind(wrapper);
      if (window.stickyFailure && role === 'thumbnail') {
        window.stickyFailure = false;
        wrapper.disconnect();
        await new Promise(resolve => setTimeout(resolve,100));
        // Explicit persistent fault on this native wrapper, not a one-shot
        // outer rejection. Only a new puzzle wrapper can recover this slot.
        wrapper.twisty3DPuzzle = () => Promise.reject(Error('injected cached native puzzle rejection'));
      }
      // Explicit fault: native resources exist, but the first readiness rejects.
      if (window.initFailures[role]-- > 0) {
        await puzzle();
        wrapper.twisty3DPuzzle = () => {
          wrapper.twisty3DPuzzle = puzzle;
          return Promise.reject(Error('injected first init failure: ' + role));
        };
      }
      return vantages;
    };
    const colors = {U:'#ffdd00',F:'#e53935',R:'#00a651',B:'#ff8800',L:'#2266ff',D:'#ffffff'};
    function Host() {
      const [cards, setCards] = useState([]);
      const [player, setPlayer] = useState(null);
      window.cards = value => flushSync(() => setCards(value));
      window.player = value => flushSync(() => setPlayer(value));
      return <><div style={{height:2400}}>Native focused regression</div>
        <section id="cards" style={{position:'fixed',left:0,top:0,width:180}}>
          {cards.map(({id,setup='',alg='',...rest}) => <div key={id} data-card={id}><Native colors={colors} height={180} setup={setup} alg={alg} {...rest}/></div>)}
        </section>
        {player && <div role="dialog" aria-modal="true" style={{position:'fixed',left:200,top:80,width:340,height:400,zIndex:1400,background:'white'}}>
          <button id="before">Before</button>
          <div id="clip" style={{overflow:'hidden',height:250}}>
            <Native colors={colors} height={280} setup="" alg="R U R'" interactive {...player}/>
          </div><button id="after">After</button>
        </div>}
      </>;
    }
    createRoot(document.getElementById('root')).render(<React.StrictMode><Host/></React.StrictMode>);
    window.native = async role => {
      const player = document.querySelector('[data-native-two-by-two="'+role+'"] > twisty-player');
      const [vantage] = await player.experimentalCurrentVantages();
      return {player, vantage, canvas:(await vantage.canvasInfo()).canvas};
    };
    window.inject = async (role, kind) => {
      const {player, vantage} = await window.native(role);
      if (kind === 'position') {
        const prop = player.experimentalModel.legacyPosition;
        const get = prop.get.bind(prop);
        prop.get = async () => {
          prop.get = get;
          const position = await get();
          // Explicit fault: configure's model read never settles until released.
          return new Promise(resolve => { window.releaseFault = () => resolve(position); });
        };
      } else {
        const register = vantage.experimentalNextRenderFinishedCallback.bind(vantage);
        vantage.experimentalNextRenderFinishedCallback = callback => {
          vantage.experimentalNextRenderFinishedCallback = register;
          if (kind === 'reject') throw Error('injected capture rejection');
          // Explicit fault: suppress the capture completion, retain a late callback.
          register(() => { window.releaseFault = callback; });
        };
      }
    };
  ` },
  bundle: true, write: false, outdir: '/native-focused', format: 'esm', splitting: true,
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' },
});
const files = new Map(bundle.outputFiles.map(file => [file.path.replace('/native-focused', ''), file.contents]));
const server = http.createServer((request, response) => {
  if (request.url === '/') {
    response.setHeader('Content-Type', 'text/html');
    response.end('<!doctype html><html><head><style>body{margin:0}</style></head><body><div id="root"></div><script type="module" src="/stdin.js"></script></body></html>');
  } else {
    response.setHeader('Content-Type', 'text/javascript');
    response.end(files.get(request.url) || '');
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({headless:true, args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport:{width:1000,height:800}});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.setDefaultTimeout(16000);
async function poll(fn, label, timeout = 16000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await fn()) return;
    await new Promise(resolve => setTimeout(resolve, 40));
  }
  throw Error('Timed out: ' + label);
}
async function readyCards(count) {
  await poll(() => page.evaluate(n => {
    const images = [...document.querySelectorAll('#cards img')];
    return images.length === n && images.every(img => img.complete && img.naturalWidth === 180);
  }, count), 'native PNG cards');
  assert.deepEqual(await page.locator('#cards [role="alert"]').allTextContents(), []);
}
async function readyPlayer() {
  await poll(() => page.evaluate(() => {
    const portal = document.querySelector('[data-native-two-by-two="interactive"]');
    return portal && !portal.inert && portal.style.opacity === '1';
  }), 'visible interactive native player');
  assert.equal(await page.locator('[data-native-two-by-two="interactive"] > twisty-player').count(), 1);
}
async function bounded() {
  const resources = await page.evaluate(() => window.resources());
  assert.ok(resources.players <= 2 && resources.observers <= 2 && resources.contexts <= 2, JSON.stringify(resources));
  return resources;
}
try {
  await page.addInitScript(() => {
    const observers = new Set(), contexts = new Set();
    let createdContexts = 0, createdObservers = 0;
    const Observer = ResizeObserver;
    window.ResizeObserver = class extends Observer {
      constructor(callback) { super(callback); createdObservers++; }
      observe(target, options) { observers.add(this); super.observe(target, options); }
      disconnect() { observers.delete(this); super.disconnect(); }
    };
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      const context = get.call(this, type, ...args);
      if (/^webgl2?$/.test(type) && context && !contexts.has(context)) {
        contexts.add(context); createdContexts++;
        this.addEventListener('webglcontextlost', () => contexts.delete(context));
        this.addEventListener('webglcontextrestored', () => contexts.add(context));
      }
      return context;
    };
    window.resources = () => ({players:document.querySelectorAll('twisty-player').length,
      observers:observers.size,contexts:contexts.size,createdContexts,createdObservers});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await poll(() => page.evaluate(() => !!window.cards), 'React host');
  await page.evaluate(() => window.cards([{id:'first'},{id:'waiting',setup:'R'}]));
  await poll(() => page.locator('#cards [role="alert"]').count().then(n => n === 2), 'first init rejects all affected subscribers');
  assert.match(await page.locator('#cards').textContent(), /injected first init failure/);
  await page.evaluate(() => window.cards([{id:'retry'},{id:'same'}]));
  await readyCards(2);
  assert.equal(await page.locator('[data-native-two-by-two="thumbnail"] > twisty-player').count(), 1, 'deduplicated retry reuses one native tree');
  console.log('PASS first thumbnail init reject, cleanup, slotPromise reset and deduplicated retry');

  await page.evaluate(() => {
    window.scrollTo(0,900);
    // Reproduce the lock geometry: the body box is viewport-high while its
    // overflowing document remains scrolled. The dialog is a fixed portal.
    document.documentElement.style.height = '2400px';
    document.body.style.height = '800px';
    document.body.style.overflow = 'hidden';
    window.player({});
  });
  await poll(() => page.locator('[role="dialog"] [role="alert"]').count().then(n => n === 1), 'interactive first init rejection');
  await page.evaluate(() => window.player(null));
  await page.evaluate(() => window.player({}));
  await readyPlayer();
  const geometry = await page.evaluate(() => {
    const root = document.querySelector('[data-native-two-by-two="interactive"]');
    const body = document.body.getBoundingClientRect();
    const host = document.querySelector('[data-native-two-by-two-host="interactive"]').getBoundingClientRect();
    return {scrollY,bodyTop:body.top,bodyBottom:body.top+document.body.clientHeight,hostTop:host.top,
      opacity:root.style.opacity,clip:root.style.clipPath,z:root.style.zIndex};
  });
  assert.equal(geometry.scrollY,900);
  assert.equal(geometry.bodyTop,-900);
  assert.ok(geometry.bodyBottom < geometry.hostTop,'old ancestor traversal would hide this player');
  assert.equal(geometry.opacity,'1');
  assert.equal(geometry.z,'1401');
  assert.match(geometry.clip,/30px/,'internal overflow clipping is retained');
  console.log('PASS real scrollY=900, body overflow lock, dialog boundary, internal clip, z-index+1', geometry);
  await page.evaluate(() => { document.querySelector('#clip').scrollTop = 20; });
  await poll(() => page.evaluate(() => {
    const portal = document.querySelector('[data-native-two-by-two="interactive"]');
    const host = document.querySelector('[data-native-two-by-two-host="interactive"]').getBoundingClientRect();
    return Math.abs(parseFloat(portal.style.top)-host.top)<0.1 && portal.style.clipPath.includes('20px');
  }), 'internal scroll updates native portal and clipping');
  await page.evaluate(() => { document.querySelector('#clip').scrollTop = 0; });
  await page.locator('#before').focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.closest('[data-native-two-by-two]')?.dataset.nativeTwoByTwo),'interactive','focus bridge enters native controls');
  await page.setViewportSize({width:850,height:720});
  await readyPlayer();
  const baseline = await bounded();

  await page.evaluate(() => window.inject('thumbnail','reject'));
  await page.evaluate(() => window.cards([{id:'capture-reject',setup:'F U2'}]));
  await poll(() => page.locator('#cards [role="alert"]').count().then(n => n === 1), 'capture rejection resets readiness');
  await page.evaluate(() => { window.stickyFailure = true; });
  await page.evaluate(() => window.cards([{id:'sticky-fail',setup:'F U'}]));
  await poll(() => page.locator('#cards [role="alert"]').count().then(n => n === 1), 'cached native puzzle rejection');
  assert.match(await page.locator('#cards').textContent(),/cached native puzzle rejection/);
  await page.evaluate(() => window.cards([{id:'sticky-retry',setup:'F U'}]));
  await readyCards(1);
  console.log('PASS persistent native puzzle rejection, native wrapper rebuild without new vantage/context/observer');

  await page.evaluate(() => window.inject('thumbnail','capture'));
  await page.evaluate(() => window.cards([{id:'hang',setup:'F'},{id:'affected',setup:'U'}]));
  await poll(() => page.evaluate(() => typeof window.releaseFault === 'function'), 'capture fault injected');
  await poll(() => page.locator('#cards [role="alert"]').count().then(n => n === 2), '10s capture timeout rejects active and queued');
  assert.match(await page.locator('#cards').textContent(), /timed out/);
  await page.evaluate(() => window.cards([{id:'recovered',setup:'L'}]));
  await readyCards(1);
  const latest = await page.locator('#cards img').getAttribute('src');
  await page.evaluate(() => window.releaseFault());
  await page.evaluate(() => window.cards([{id:'cache-latest',setup:'L'}]));
  await readyCards(1);
  assert.equal(await page.locator('#cards img').getAttribute('src'),latest,'late capture cannot overwrite latest cache');
  console.log('PASS explicit hung capture callback, real 10s timeout, all affected reject, retry and late completion');

  await page.evaluate(() => window.inject('interactive','position'));
  await page.evaluate(() => { window.releaseFault = undefined; window.player({setup:'F'}); });
  await poll(() => page.evaluate(() => typeof window.releaseFault === 'function'), 'position fault injected');
  await poll(() => page.locator('[role="dialog"] [role="alert"]').count().then(n => n === 1), '10s configure timeout');
  assert.match(await page.locator('[role="dialog"]').textContent(), /timed out/);
  await page.evaluate(() => window.player({setup:'L'}));
  await readyPlayer();
  const beforeLate = await page.evaluate(async () => {
    const {player} = await window.native('interactive');
    const object = await player.experimentalCurrentThreeJSPuzzleObject();
    window.originalPosition = object.onPositionChange;
    window.lateWrites = 0;
    object.onPositionChange = function(...args) { window.lateWrites++; return window.originalPosition.apply(this,args); };
    return (await player.experimentalModel.setupAlg.get()).alg.toString();
  });
  await page.evaluate(async () => { window.releaseFault(); await new Promise(resolve => setTimeout(resolve,100)); });
  assert.equal(await page.evaluate(() => window.lateWrites),0,'expired configure cannot touch shared object');
  assert.equal(beforeLate,'L');
  await page.evaluate(async () => {
    const {player} = await window.native('interactive');
    (await player.experimentalCurrentThreeJSPuzzleObject()).onPositionChange = window.originalPosition;
  });
  console.log('PASS explicit hung model read, real 10s timeout, recovery and zero stale shared-object writes');

  // Keep one capture busy; abandoned queued cards must never reach configure.
  await page.evaluate(() => { window.releaseFault = undefined; });
  await page.evaluate(() => window.inject('thumbnail','capture'));
  await page.evaluate(() => window.cards([{id:'busy',setup:'B'}]));
  await poll(() => page.evaluate(() => typeof window.releaseFault === 'function'), 'busy capture');
  await page.evaluate(() => window.cards([{id:'busy',setup:'B'},...Array.from({length:60},(_,i)=>({id:'cancel-'+i,setup:'R U'+(i%3===0?'2':'')}))]));
  await page.evaluate(() => window.cards([{id:'busy',setup:'B'}]));
  const configured = await page.evaluate(async () => {
    const {player} = await window.native('thumbnail');
    const get = player.experimentalModel.legacyPosition.get.bind(player.experimentalModel.legacyPosition);
    window.queuedReads = 0;
    player.experimentalModel.legacyPosition.get = (...args) => { window.queuedReads++; return get(...args); };
    window.releaseFault();
    await new Promise(resolve => setTimeout(resolve,200));
    player.experimentalModel.legacyPosition.get = get;
    return window.queuedReads;
  });
  await readyCards(1);
  assert.equal(configured,0,'unmounted queued subscribers allocate no work');
  console.log('PASS 60 queued StrictMode cards cancelled before configure');

  for (const role of ['thumbnail','interactive']) {
    await page.evaluate(async role => {
      const {vantage} = await window.native(role);
      (await vantage.renderer()).getContext().getExtension('WEBGL_lose_context').loseContext();
    },role);
    await poll(() => page.evaluate(() => window.resources().contexts === 2), 'native context restored');
    if (role === 'thumbnail') {
      await page.evaluate(() => window.cards([{id:'context-retry',setup:'D'}]));
      await readyCards(1);
    } else {
      await page.evaluate(() => window.player({setup:'D'}));
      await readyPlayer();
    }
    await bounded();
  }
  console.log('PASS explicit real WEBGL_lose_context on each slot, native restoration and next-request recovery');

  const distinct = new Set();
  for (let i=0;i<12;i++) {
    const setup = ['R','F','U','L'][i%4];
    await page.evaluate(({i,setup}) => {
      window.cards([{id:'stress-'+i,setup}]);
      window.player({setup});
    },{i,setup});
    await readyCards(1);
    await readyPlayer();
    distinct.add(await page.locator('#cards img').getAttribute('src'));
    await bounded();
  }
  assert.equal(distinct.size,4,'native thumbnails reflect all four latest setups');
  const final = await bounded();
  assert.equal(final.createdObservers,baseline.createdObservers,'no observer leaks on recovery/remount');
  assert.equal(final.createdContexts,baseline.createdContexts,'no context allocation on recovery/remount');

  // Rotate D into the visible top face; check the actual rendered PNG palette,
  // including the white bottom face after shader/material and context recovery.
  await page.evaluate(() => window.cards([{id:'white-D',setup:'x2'}]));
  await readyCards(1);
  const white = await page.locator('#cards img').evaluate(img => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 180;
    const context = canvas.getContext('2d'); context.drawImage(img,0,0);
    const {data} = context.getImageData(0,0,180,180);
    let white = 0;
    for (let i=0;i<data.length;i+=4) if (data[i]>230 && data[i+1]>230 && data[i+2]>230 && data[i+3]>128) white++;
    return white;
  });
  assert.ok(white>100,'white D palette survives native wrapper/context recovery: '+white);
  assert.deepEqual(errors,[],'no unhandled async faults');
  console.log('PASS latest-state/cache stress, white D palette and fixed two-tree/context/observer pool', final);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
