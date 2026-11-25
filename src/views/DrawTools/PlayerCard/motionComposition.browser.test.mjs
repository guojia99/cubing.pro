import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';

test('motion PNG: studio cutout, unobstructed portrait, real scene window and saved footer', {timeout: 90000}, async t => {
  const bundle = await build({stdin: {contents: `
    import {paintMotionCard} from './motionComposition';
    import {replaceSolidBackground} from './solidBackground';
    import {paintReliefMask, hasCartouche} from './motionDesign';
    window.fixture = {paintMotionCard, replaceSolidBackground, paintReliefMask, hasCartouche};`, resolveDir: fileURLToPath(new URL('.', import.meta.url))},
    bundle: true, write: false, format: 'iife'});
  const browser = await chromium.launch({executablePath: process.env.SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE || undefined});
  try {
    const page = await browser.newPage();
    await page.addScriptTag({content: bundle.outputFiles[0].text});
    const result = await page.evaluate(async () => {
      const {paintMotionCard, replaceSolidBackground, paintReliefMask, hasCartouche} = window.fixture;
      const surface = (w,h) => Object.assign(document.createElement('canvas'), {width:w,height:h});
      const imageOf = async canvas => {const i=new Image(); i.src=canvas.toDataURL(); await i.decode(); return i;};
      const src=surface(348,348), sc=src.getContext('2d');
      const box=(color,x,y,w,h)=>{sc.fillStyle=color; sc.fillRect(x,y,w,h);};
      box('#000000',134,20,86,96); box('#c49a7d',138,50,78,68); box('#f4f4ef',140,53,74,20);
      box('#de3a48',91,110,178,202); box('#ebc63b',173,112,8,103);
      box('#c49a7d',51,148,50,26); box('#c49a7d',46,98,19,63);
      box('#eee4db',46,119,17,18); // Pale knuckle connected to the darker hand.
      sc.clearRect(106,147,16,19); // Enclosed gap between bent arm and shirt.
      const person=await imageOf(src);
      const colored=async (bg,debris)=>{
        const c=surface(348,348), cx=c.getContext('2d'); cx.fillStyle=bg; cx.fillRect(0,0,348,348);
        cx.drawImage(src,0,0);
        if(bg==='#ffe0ef') {
          // A soft photographic edge connects the pink backdrop to similarly bright skin.
          const edge=cx.createLinearGradient(42,0,48,0); edge.addColorStop(0,bg); edge.addColorStop(1,'#eee4db');
          cx.fillStyle=edge; cx.fillRect(42,121,6,14);
        }
        if(debris){cx.fillStyle='#338c94'; cx.fillRect(73,96,4,3);}
        return imageOf(c);
      };
      const studios = await Promise.all(['#ffe0ef','#369acf','#f7f5f3'].map(color=>colored(color,true)));
      const manual=replaceSolidBackground(studios[2],{x:4,y:4});
      if(!manual) throw Error('Manual white-wall fixture did not meet the editor’s replacement contract');
      const canvas=surface(1080,1440), ctx=canvas.getContext('2d',{willReadFrequently:true});
      const render=async (image,clear=false,name='',replacement=null,crop={x:0,y:0,zoom:1},...revision)=>{
        ctx.fillStyle='#351e48'; ctx.fillRect(0,0,canvas.width,canvas.height);
        paintMotionCard(canvas,image,crop,name,'serif',clear,replacement,...revision);
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
        const png=await createImageBitmap(blob), decoded=surface(png.width,png.height), dc=decoded.getContext('2d');
        dc.drawImage(png,0,0); png.close();
        const data=dc.getImageData(0,0,decoded.width,decoded.height).data;
        const at=(x,y)=>Array.from(data.subarray(4*(y*decoded.width+x),4*(y*decoded.width+x)+4));
        const patch=(x,y,r=3)=>{
          const channels=[[],[],[]];
          for(let iy=y-r;iy<=y+r;iy++) for(let ix=x-r;ix<=x+r;ix++) {
            const off=4*(iy*decoded.width+ix); channels.forEach((values,k)=>values.push(data[off+k]));
          }
          return channels.map(values=>values.sort((a,b)=>a-b)[values.length>>1]);
        };
        return {at,patch,pixels:new Uint32Array(data.buffer),summary:{bytes:blob.size,width:decoded.width,height:decoded.height,
          corners:[[0,0],[1079,0],[0,1439],[1079,1439]].map(([x,y])=>at(x,y)[3]),center:at(540,720)[3],plaque:hasCartouche(decoded)}};
      };
      const reference=await render(person,true), photos=[];
      for(const s of studios) photos.push(await render(s));
      const [pink]=photos, samples=[reference,...photos];
      // In a 348px square with default crop each source pixel spans 3 output pixels.
      const point=(card,u,v)=>card.patch(18+3*u,320+3*v,2);
      const probe=(u,v)=>samples.map(card=>point(card,u,v));
      const optics={
        sky:probe(280,100), besideThumb:probe(34,128), knuckle:probe(54,128), thumb:probe(56,110), arm:probe(76,158), eye:probe(160,60),
        shirt:probe(246,248), badge:probe(177,165), black:probe(160,32), gap:probe(114,156), debris:probe(75,97), rim:probe(135,32),
      };
      // A star/tick is only 1–3 pixels wide. Test every output pixel, not the patch median.
      // This red band spans the lower orrery arcs and the old foreground mist.
      const shirtNoise=samples.map(card=>{
        let delta=0; for(let y=975;y<=1106;y++){const ref=card.at(485,y);
          for(let x=487;x<=737;x++){const p=card.at(x,y); for(let k=0;k<3;k++) delta=Math.max(delta,Math.abs(p[k]-ref[k]));}
        }return delta;
      });
      const named=await render(studios[0],false,'Orion'), namedTrim=await render(studios[0],false,'  Orion  ');
      const renamed=await render(studios[0],false,'Lyra'), blank=await render(studios[0],false,' \t ');
      const differences=(a,b,x,y,w,h)=>{
        let count=0; for(let iy=y;iy<y+h;iy++) for(let ix=x;ix<x+w;ix++) {const i=iy*1080+ix;if(a.pixels[i]!==b.pixels[i])count++;}return count;
      };
      let paleCrown=0;for(let y=1140;y<1380;y+=2) for(let x=420;x<660;x+=2){const [r,g,b]=pink.at(x,y); if(r>185&&g>160&&b>115)paleCrown++;}
      const shifted=await render(person,true,'',null,{x:108,y:0,zoom:1.5});
      const crop=[reference,shifted].map(card=>[card.patch(187,650),card.patch(110,553)]);
      const placements=[{x:0,y:0,scale:1},{x:-90,y:0,scale:1},{x:-90,y:-140,scale:1},
        {x:-90,y:-140,scale:.82},{x:75,y:90,scale:1.15}];
      const headProbes=[[540,347],[450,347],[450,207],[450,296],[615,363]];
      const placedHeads=[];
      for(const width of [348,696]) {
        const figure=surface(width,348), portrait=figure.getContext('2d');
        portrait.fillStyle='#de3a48'; portrait.fillRect(width/2-9,4,18,10);
        portrait.fillStyle='#27425e'; portrait.fillRect(width/2-16,14,32,52);
        const photo=await imageOf(figure);
        const frames=placements.map(placement=>{
          paintMotionCard(canvas,photo,{x:0,y:0,zoom:1},'','serif',true,null,undefined,placement);
          return headProbes.map(([x,y])=>Array.from(ctx.getImageData(x,y,1,1).data).slice(0,3));
        });
        placedHeads.push({width,frames});
      }
      const edits=[];
      const sampleEdit=async (...revision)=>point(await render(studios[2],false,'',manual,undefined,...revision),208,180);
      edits.push(await sampleEdit()); const brush=manual.getContext('2d'); brush.clearRect(199,169,21,21);
      edits.push(await sampleEdit(),await sampleEdit(7)); brush.fillStyle='#de3a48'; brush.fillRect(199,169,21,21); edits.push(await sampleEdit(8));
      // The same flat bar ends at y=1069 then at y=1177, without changing its source alpha.
      const central=surface(348,348), cc=central.getContext('2d'); cc.fillStyle='#de3a48'; cc.fillRect(144,125,63,125);
      const bar=await imageOf(central), high=await render(bar,true), low=await render(bar,true,'',null,{x:0,y:112,zoom:1});
      const edges={high:high.patch(570,1063,1),low:[1090,1110,1135,1154,1174].map(y=>low.patch(570,y,2)), skyAtHem:high.patch(570,1174,2)};
      // Neither the top nor the sides match 55% of this scene. All colors continue to the window edges.
      const mosaic=surface(348,348), m=mosaic.getContext('2d'), palette=['#346eae','#db6448','#298763','#dfbd50'];
      for(let y=0;y<348;y+=30) for(let x=0;x<348;x+=30){m.fillStyle=palette[(x/30+y/30)%4];m.fillRect(x,y,30,30);}
      const mosaicPhoto=await imageOf(mosaic), complex=await render(mosaicPhoto);
      // Compare inner-window pixels against the known source colors after a centred cover fit.
      const scene=[[180,345],[902,360],[164,945],[900,920],[540,195],[675,1090]].map(([x,y])=>{
        const u=Math.floor(174+(x-540)*348/1240),v=Math.floor((y-116)*348/1240);
        return [complex.patch(x,y),Array.from(m.getImageData(u,v,1,1).data).slice(0,3)];
      });
      const windowSamples=[placements[0],placements[3],placements[4]].map(placement=>{
        paintMotionCard(canvas,mosaicPhoto,{x:0,y:0,zoom:1},'','serif',false,null,undefined,placement);
        return Array.from(ctx.getImageData(540,555,1,1).data).slice(0,3);
      });
      const masks={};
      for(const [key,region,withName] of [['subject','subject',false],['crown','frame',false],['plaque','frame',true],['metal','metal',true]]){
        const mask=surface(540,720), mc=mask.getContext('2d');paintReliefMask(mc,region,withName);
        const bits=mc.getImageData(0,0,540,720).data,at=(x,y)=>bits[4*(Math.floor(y/2)*540+Math.floor(x/2))];
        let open=0,total=0;for(let y=1100;y<1400;y+=4) for(let x=120;x<960;x+=4){total++;if(at(x,y)<5)open++;}
        masks[key]={open:open/total,centre:at(540,590),corner:at(1,1),plaqueCentre:at(540,1262)};
      }
      return {cards:[reference,...photos,named,namedTrim,blank,complex].map(card=>card.summary),optics,shirtNoise,scene,windowSamples,crop,placedHeads,edges,edits,masks,
        upper:differences(pink,named,0,0,1080,1060),footer:differences(pink,named,147,1144,786,192),ink:differences(named,renamed,225,1210,630,100),
        trim:differences(named,namedTrim,0,0,1080,1440),empty:differences(pink,blank,0,0,1080,1440),paleCrown};
    });
    const {optics:o,edges,masks}=result, distance=(p,q)=>Math.max(...p.map((v,i)=>Math.abs(v-q[i])));
    t.diagnostic(`PNG bytes: ${result.cards.map(c=>c.bytes).join(', ')}; red-shirt max lateral variation: ${result.shirtNoise}; lower edge reds: ${edges.low.map(p=>p[0])}`);
    for(const card of result.cards){assert.deepEqual([card.width,card.height],[1080,1440]);assert.deepEqual(card.corners,[0,0,0,0]);assert.equal(card.center,255);assert.ok(card.bytes<3.5*1024*1024);}
    for(const field of ['sky','besideThumb','debris','gap']) {
      // An enclosed neutral-white spot may be a shirt highlight; only colored backdrops remove enclosed spill.
      const [sky,...actual]=o[field];
      for(const p of field==='gap'?actual.slice(0,2):actual) assert.ok(distance(p,sky)<16,`${field}: ${p} vs native alpha ${sky}`);
    }
    const expected={knuckle:[238,228,219],thumb:[196,154,125],arm:[196,154,125],eye:[244,244,239],shirt:[222,58,72],badge:[235,198,59]};
    for(const [key,rgb] of Object.entries(expected)) for(const p of o[key]) assert.ok(distance(p,rgb)<14,`${key}: ${p} vs ${rgb}`);
    for(const [r,g,b] of o.black) assert.ok(r>=3&&b>=r&&g<20&&b<24,`black hair stays dark: ${r},${g},${b}`);
    assert.ok(o.rim[0][0]>o.black[0][0],`subtle light-wrap inside the edge of dark hair: ${o.rim[0]} vs core ${o.black[0]}`);
    assert.ok(result.shirtNoise.every(d=>d<=3),`no mist or orrery line in front of clothing: ${result.shirtNoise}`);
    for(const [p,rgb] of result.scene) assert.ok(distance(p,rgb)<18,`full scene window must retain photo color outside the old ellipse: ${p} vs ${rgb}`);
    assert.deepEqual(result.windowSamples,[[219,100,72],[41,135,99],[52,110,174]],'the full-photo window follows placement while maintaining cover at zoom=1');
    const isSkin=p=>distance(p,expected.thumb)<14;
    assert.deepEqual(result.crop.map(row=>row.map(isSkin)),[[true,false],[false,true]],'crop preview must move and enlarge the hand');
    const isRed=p=>distance(p,expected.shirt)<14;
    for(const {width,frames} of result.placedHeads) for(const [frame,pixels] of frames.entries()) {
      assert.deepEqual(pixels.map(isRed),pixels.map((_,index)=>index===frame),
        `zoom=1: ${width}×348 cutout head must reach its new position, including above y=320 (placement ${frame}): ${JSON.stringify(pixels)}`);
    }
    assert.deepEqual(result.edits.map(isRed),[true,false,false,true],'7-argument edits and explicit edit revisions update the same replacement canvas');
    assert.ok(isRed(edges.high),'the bottom of a subject ending above y=1140 stays solid');
    assert.ok(isRed(edges.low[0])&&isRed(edges.low[1])&&edges.low[2][0]<200&&edges.low[2][0]>100&&edges.low[3][0]<150&&distance(edges.low[4],edges.skyAtHem)<12,
      `only the final 75px of a low subject should dissolve: ${JSON.stringify(edges)}`);
    assert.equal(result.upper,0);assert.ok(result.footer>3000&&result.paleCrown>100);assert.ok(result.ink>300);
    assert.equal(result.trim,0);assert.equal(result.empty,0);
    assert.equal(masks.subject.centre,255);assert.equal(masks.subject.corner,0);
    assert.ok(masks.crown.open>.55&&masks.plaque.open>.40);assert.equal(masks.plaque.plaqueCentre,255);
    assert.equal(masks.metal.plaqueCentre,0);assert.equal(masks.metal.centre,0);
    assert.deepEqual(result.cards.map(c=>c.plaque),[false,false,false,false,true,true,false,false],'replay detects the footer from the final PNG alone');
  } finally {await browser.close();}
});
