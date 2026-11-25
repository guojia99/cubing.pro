import type { Crop } from "./composition";
import { featherAlpha } from "./personCutout.mjs";
import { autoBackdropMatte } from "./autoBackdropMatte";
import { CARTOUCHE, H, HERO, PORTRAIT_WINDOW, portraitWindowPath, W, outlinePath, paintArch, paintFoot, paintOrreryTicks, paintOrnaments } from "./motionDesign";

export const MOTION_HEIGHT = H;
export type MotionPlacement = { x: number; y: number; scale: number };
export const INITIAL_MOTION_PLACEMENT: MotionPlacement = { x: 0, y: 0, scale: 1 };
export function clampMotionPlacement(placement: MotionPlacement): MotionPlacement {
  const clampVal = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : 0));
  return {
    x: clampVal(placement.x, -540, 540),
    y: clampVal(placement.y, -540, 540),
    scale: Math.max(0.5, Math.min(2.4, Number.isFinite(placement.scale) ? placement.scale : 1)),
  };
}
const Q = HERO.size;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };

function surface(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  return canvas;
}

function motionPhotoRaster(image: HTMLImageElement, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = surface(Math.max(1, Math.round(image.naturalWidth * scale)), Math.max(1, Math.round(image.naturalHeight * scale)));
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return ctx;
}

const autoMatteByImage = new WeakMap<HTMLImageElement, boolean>();
export function hasMotionAutoMatte(image: HTMLImageElement): boolean {
  const cached = autoMatteByImage.get(image);
  if (cached !== undefined) return cached;
  const ctx = motionPhotoRaster(image, W);
  const detected = autoBackdropMatte(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
  autoMatteByImage.set(image, detected);
  return detected;
}

export function createMotionCutoutCanvas(image: HTMLImageElement, transparentBackground: boolean): HTMLCanvasElement | null {
  const ctx = motionPhotoRaster(image, 2160);
  if (!transparentBackground) {
    const pixels = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (!autoBackdropMatte(pixels)) return null;
    ctx.putImageData(pixels, 0, 0);
  }
  return ctx.canvas;
}

function plate(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = surface(w, h);
  draw(canvas.getContext("2d")!);
  return canvas;
}

// Static sky and the two pierced mounts are prepared once, never during a drag.
function makePlates() {
  return {
    sky: plate(W,H,ctx => { paintNebula(ctx); paintMist(ctx); paintOrrery(ctx); }),
    windowTrim: plate(W,H,ctx => {
      ctx.save(); const path=portraitWindowPath(); ctx.clip(path);
      // The stepped translucent strokes darken only the inner 36 px of the photographic mount.
      ctx.strokeStyle="rgba(12,9,20,.011)";
      for(let inset=36;inset>0;inset-=3) { ctx.lineWidth=inset*2; ctx.stroke(path); }
      ctx.restore(); paintArch(ctx);
    }),
    foreground: [false,true].map(named => plate(W,H,ctx => {
      paintFoot(ctx,named); paintOrnaments(ctx);
    })),
  };
}
let plates: ReturnType<typeof makePlates> | undefined;

// Only the currently edited source is retained per output canvas. Brush strokes mutate a
// canvas in place: without a revision, an incoming replacement must always be read again.
type Source = HTMLCanvasElement | HTMLImageElement;
function prepareSource(source: Source, explicitCutout: boolean, replacement: boolean) {
  const w = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const h = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const scale = explicitCutout ? 1 : Math.min(1, W / Math.max(w,h));
  const width = Math.max(1,Math.round(w*scale)), height = Math.max(1,Math.round(h*scale));
  const graded = surface(width,height), ctx = graded.getContext("2d",{willReadFrequently:true})!;
  ctx.drawImage(source,0,0,width,height);
  const raw = ctx.getImageData(0,0,width,height), px = raw.data;
  const cutout = explicitCutout || autoBackdropMatte(raw);
  if (explicitCutout) {
    let nativeSoft = false;
    if (!replacement) for (let i=3;i<px.length;i+=4) {
      if (px[i]>0 && px[i]<255) { nativeSoft=true; break; }
    }
    if (!nativeSoft) featherAlpha(px,width,height,2.5*Math.min(width,height)/W);
  }
  const first = new Int32Array(height).fill(width), last = new Int32Array(height).fill(-1);
  if (cutout) {
    const [red,green,blue] = tone ??= splitTone();
    for (let y=0, i=0;y<height;y++) {
      const row=Math.round(y*(Q-1)/Math.max(1,height-1)) << 8;
      for (let x=0;x<width;x++,i+=4) {
        const alpha=px[i+3]; if (!alpha) continue;
        if (alpha>=8) { if (x<first[y]) first[y]=x; last[y]=x; }
        const r=px[i], g=px[i+1], b=px[i+2];
        const lift=shadowLift[(r*.213+g*.715+b*.072)|0];
        px[i]=red[row+Math.round(r+(24-r)*lift)];
        px[i+1]=green[row+Math.round(g+(20-g)*lift)];
        px[i+2]=blue[row+Math.round(b+(40-b)*lift)];
      }
    }
    ctx.putImageData(raw,0,0);
  }
  const artwork = cutout ? graded : source;
  const chip=plate(24,24,c=>c.drawImage(artwork,0,0,24,24));
  const sample=chip.getContext("2d")!.getImageData(0,0,24,24).data;
  const sum=[0,0,0]; let weight=0;
  for(let i=0;i<sample.length;i+=4) if(sample[i+3]>32) {
    const a=sample[i+3]; weight+=a;
    for(let c=0;c<3;c++) sum[c]+=a*sample[i+c];
  }
  const avg=sum.map(c=>c/(weight||1));
  const luma=.213*avg[0]+.715*avg[1]+.072*avg[2];
  const echo=avg.map((c,i)=>Math.round(Math.max(20,Math.min(152,[92,63,85][i]+.55*(c-luma)+.10*(luma-128)))));
  return {artwork,echo, silhouette:cutout ? {px,width,height,first,last} : null};
}
const shadowLift = Float32Array.from({length:256},(_,i)=>.22*(1-smooth(i/75)));

// Per-scanline soft-light transfer curves preserve coverage and do not tint transparent sky.
function splitTone() {
  const tables = [new Uint8Array(Q*256),new Uint8Array(Q*256),new Uint8Array(Q*256)];
  const stops=[[255,228,178,.09],[210,180,155,.035],[42,30,68,.09]];
  for(let y=0;y<Q;y++) {
    const t=y/(Q-1), i=t<.48?0:1, f=smooth(i===0?t/.48:(t-.48)/.52);
    const a=stops[i], b=stops[i+1];
    for(let c=0;c<3;c++) {
      const s=((a[c]/255*2-1)*a[3]*(1-f)+(b[c]/255*2-1)*b[3]*f);
      for(let v=0;v<256;v++) {
        const d=v/255, light=d<=.25?((16*d-12)*d+4)*d:Math.sqrt(d);
        tables[c][y*256+v]=Math.round(255*(d+s*(s<0?d*(1-d):light-d)));
      }
    }
  }
  return tables;
}
let tone: ReturnType<typeof splitTone> | undefined;

const smallW=W/4, smallH=H/4, pad=24, tileW=smallW+2*pad, tileH=smallH+2*pad;
function workspace() {
  const sub=surface(W,H);
  return {
    sub:sub.getContext("2d")!, scene:surface(W,H), sky:surface(W,H),
    matte:surface(tileW,tileH), inverse:surface(tileW,tileH), aura:surface(tileW,tileH), rim:surface(tileW,tileH), clippedRim:surface(W,H),
    source:undefined as Source|undefined, cutout:false, revision:undefined as number|undefined,
    prepared:undefined as ReturnType<typeof prepareSource>|undefined, crop:undefined as Crop|undefined,
    placement:undefined as MotionPlacement|undefined,
  };
}
const work = new WeakMap<HTMLCanvasElement,ReturnType<typeof workspace>>();
type Work = ReturnType<typeof workspace>;

export function paintMotionCard(canvas: HTMLCanvasElement, image: HTMLImageElement, crop: Crop, name: string, font: string,
  transparentBackground: boolean, replacement: HTMLCanvasElement|null=null, editRevision?: number, placement: MotionPlacement=INITIAL_MOTION_PLACEMENT) {
  plates ??= makePlates();
  const nextPlacement=clampMotionPlacement(placement);
  let w=work.get(canvas); if(!w) { w=workspace(); work.set(canvas,w); }
  const source=replacement??image, cutout=transparentBackground||replacement!==null;
  if(!w.prepared || w.source!==source || w.cutout!==cutout || (replacement && (editRevision===undefined || editRevision!==w.revision))) {
    w.prepared=prepareSource(source,cutout,!!replacement); w.source=source; w.cutout=cutout; w.revision=editRevision; w.crop=undefined; w.placement=undefined;
    const c=w.sky.getContext("2d")!; c.drawImage(plates.sky,0,0);
    const echo=c.createRadialGradient(540,590,12,540,590,470);
    echo.addColorStop(0,`rgba(${w.prepared.echo},.21)`); echo.addColorStop(1,`rgba(${w.prepared.echo},0)`);
    c.save(); c.globalCompositeOperation="screen"; c.fillStyle=echo; c.fillRect(70,120,940,940); c.restore();
  }
  if(!w.crop || w.crop.x!==crop.x || w.crop.y!==crop.y || w.crop.zoom!==crop.zoom || !w.placement ||
    w.placement.x!==nextPlacement.x || w.placement.y!==nextPlacement.y || w.placement.scale!==nextPlacement.scale) {
    developPortrait(w,image,crop,nextPlacement); w.crop={...crop}; w.placement=nextPlacement;
  }
  const label=name.trim(), c=canvas.getContext("2d")!;
  c.clearRect(0,0,W,H); c.save(); c.clip(outlinePath());
  c.drawImage(w.scene,0,0); c.drawImage(plates.foreground[label?1:0],0,0);
  if(label) paintLabel(c,label,font);
  c.restore();
}

function developPortrait(w: Work, image: HTMLImageElement, crop: Crop, placement: MotionPlacement) {
  const {artwork,silhouette}=w.prepared!;
  const scene=w.scene.getContext("2d")!; scene.drawImage(w.sky,0,0);
  const iw=image.naturalWidth, ih=image.naturalHeight;
  if (!silhouette) {
    const win=PORTRAIT_WINDOW, base=Math.max(win.w/iw,win.h/ih), scale=base*Math.max(1,crop.zoom*placement.scale);
    const width=iw*scale, height=ih*scale, unit=base*Math.min(iw,ih)/W;
    const left=win.x+Math.min(0,Math.max(win.w-width,(win.w-width)/2+crop.x*unit+placement.x));
    const top=win.y+Math.min(0,Math.max(win.h-height,(win.h-height)/2+crop.y*unit+placement.y));
    scene.save(); scene.clip(portraitWindowPath()); scene.drawImage(artwork,left,top,width,height); scene.restore();
    scene.drawImage(plates!.windowTrim,0,0); return;
  }
  const scale=Q/Math.min(iw,ih)*crop.zoom*placement.scale, width=iw*scale, height=ih*scale;
  const dx=HERO.x+(Q-width)/2+crop.x*HERO.k+placement.x, dy=HERO.y+(Q-height)/2+crop.y*HERO.k+placement.y, c=w.sub;
  c.clearRect(0,0,W,H); c.drawImage(artwork,dx,dy,width,height);
  const bottom=visibleBottom(silhouette,dx,dy,width,height);
  if (bottom>=1140) {
    const start=bottom-75;
    c.save(); c.globalCompositeOperation="source-atop";
    const shade=c.createLinearGradient(0,start,0,bottom);
    shade.addColorStop(0,"rgba(22,18,38,0)"); shade.addColorStop(1,"rgba(22,18,38,.16)");
    c.fillStyle=shade; c.fillRect(0,start,W,H-start);
    c.globalCompositeOperation="destination-in";
    const fade=c.createLinearGradient(0,start,0,bottom);
    for(const t of [0,.125,.25,.375,.5,.625,.75,.875,1]) fade.addColorStop(t,`rgba(0,0,0,${1-smooth(t)})`);
    c.fillStyle=fade; c.fillRect(0,0,W,H); c.restore();
  }
  compositeLight(w,scene);
}

// The lowest visible row follows the silhouette and the crop; a clipped-out hand or
// a transparent margin must not trigger the hem fade on a floating subject.
function visibleBottom(mask: NonNullable<ReturnType<typeof prepareSource>["silhouette"]>, dx:number, dy:number, dw:number, dh:number) {
  const {width,height,first,last,px}=mask;
  const x0=Math.max(0,Math.floor(-dx*width/dw)), x1=Math.min(width-1,Math.ceil((W-dx)*width/dw)-1);
  const y0=Math.max(0,Math.floor(-dy*height/dh)), y1=Math.min(height-1,Math.ceil((H-dy)*height/dh)-1);
  for(let y=y1;y>=y0;y--) {
    for(let x=Math.max(first[y],x0), end=Math.min(last[y],x1);x<=end;x++) {
      if(px[(y*width+x)*4+3]>=8) return Math.min(H,dy+(y+1)*dh/height);
    }
  }
  return 0;
}

function compositeLight(w: Work, scene: CanvasRenderingContext2D) {
  // Padded 1:4 optics only. The inverted matte needs a *white* exterior so silhouettes
  // touching the crop boundary still get an inward rim. Intersect again at full resolution.
  const mask=w.matte.getContext("2d")!; mask.clearRect(0,0,tileW,tileH); mask.drawImage(w.sub.canvas,pad,pad,smallW,smallH);
  const inv=w.inverse.getContext("2d")!; inv.fillStyle="white"; inv.fillRect(0,0,tileW,tileH);
  inv.save(); inv.globalCompositeOperation="destination-out"; inv.drawImage(w.matte,0,0); inv.restore();
  const aura=w.aura.getContext("2d")!; aura.clearRect(0,0,tileW,tileH); aura.save();
  aura.filter="blur(6px)"; aura.drawImage(w.matte,0,0); aura.filter="none";
  aura.globalCompositeOperation="source-in";
  const lightTop=pad+Math.round(HERO.y/4), lightBottom=pad+Math.round((HERO.y+Q)/4);
  const glow=aura.createLinearGradient(0,lightTop,0,lightBottom);
  glow.addColorStop(0,"rgba(231,190,134,.28)"); glow.addColorStop(1,"rgba(141,90,127,.20)");
  aura.fillStyle=glow; aura.fillRect(0,0,tileW,tileH); aura.restore();
  scene.save(); scene.globalCompositeOperation="screen";
  scene.drawImage(w.aura,-pad*4,-pad*4,tileW*4,tileH*4); scene.restore();
  scene.drawImage(w.sub.canvas,0,0);

  const rim=w.rim.getContext("2d")!; rim.clearRect(0,0,tileW,tileH); rim.save();
  rim.globalAlpha=.66; rim.filter="blur(.75px)"; rim.drawImage(w.inverse,0,0);
  rim.globalAlpha=.45; rim.filter="blur(2px)"; rim.drawImage(w.inverse,0,0);
  rim.filter="none"; rim.globalAlpha=1; rim.globalCompositeOperation="source-in";
  // The soft rim picks up both the local sky and the warm-to-violet direction of the key light.
  const ink=rim.createLinearGradient(0,lightTop,0,lightBottom); ink.addColorStop(0,"#f9dfa8"); ink.addColorStop(1,"#9b6d8b");
  rim.fillStyle=ink; rim.fillRect(0,0,tileW,tileH); rim.globalCompositeOperation="source-atop"; rim.globalAlpha=.25;
  rim.drawImage(w.sky,0,0,W,H,pad,pad,smallW,smallH); rim.restore();
  const ring=w.clippedRim.getContext("2d")!; ring.clearRect(0,0,W,H);
  ring.drawImage(w.rim,pad,pad,smallW,smallH,0,0,W,H);
  ring.save(); ring.globalCompositeOperation="destination-in"; ring.drawImage(w.sub.canvas,0,0); ring.restore();
  scene.save(); scene.globalCompositeOperation="screen"; scene.globalAlpha=.24;
  scene.drawImage(w.clippedRim,0,0); scene.restore();
}

function paintMist(ctx: CanvasRenderingContext2D) {
  const mist=surface(216,76), c=mist.getContext("2d")!, field=c.createImageData(216,76);
  for(let y=0,i=0;y<76;y++) for(let x=0;x<216;x++,i+=4) {
    const u=x/216,v=y/76, n=cloud(u*4+16,v*2.8+8);
    const fold=v-.45+.18*Math.sin(u*6)+.45*(n-.5);
    const haze=Math.exp(-fold*fold*18)*smooth(v*7)*smooth((1-v)*6)*smooth((n-.20)*2);
    field.data.set([116+52*n,83+38*n,133-23*n,Math.round(95*haze)],i);
  }
  c.putImageData(field,0,0); ctx.save(); ctx.globalCompositeOperation="screen";
  ctx.drawImage(mist,0,980,W,380);
  ctx.save(); ctx.translate(540,557); ctx.strokeStyle="rgba(232,202,163,.15)"; ctx.lineWidth=1.6;
  for(const r of [430,454]) { ctx.beginPath(); ctx.arc(0,0,r,.14,.96); ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,r,Math.PI-.96,Math.PI-.14); ctx.stroke(); }
  ctx.restore();
  for(let j=0;j<24;j++) {
    const n=noise(j*3.2,17), x=95+j*38.5, y=1045+195*noise(j*2.79,9);
    ctx.fillStyle=`rgba(255,220,169,${.31+.56*n})`; ctx.beginPath(); ctx.arc(x,y,.7+1.4*n,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// Repeating smooth lattice; warp its coordinates into narrow folds of interstellar dust.
const lattice = (() => {
  const grid = new Float32Array(64 * 64);
  let seed = 3818361;
  for (let i = 0; i < grid.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    grid[i] = seed / 4294967296;
  }
  return grid;
})();
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const u = x - ix, v = y - iy;
  const a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);
  const l = (iy & 63) << 6, m = ((iy + 1) & 63) << 6;
  const c = ix & 63, d = (ix + 1) & 63;
  return (lattice[l+c]*(1-a) + lattice[l+d]*a)*(1-b) + (lattice[m+c]*(1-a) + lattice[m+d]*a)*b;
}
function cloud(x: number, y: number) {
  return .56 * noise(x,y) + .26 * noise(x*2+13,y*2-7) + .12 * noise(x*4-6,y*4+23) + .06 * noise(x*8+28,y*8+9);
}

function paintNebula(ctx: CanvasRenderingContext2D) {
  const dust = surface(270, 360), low = dust.getContext("2d")!;
  const field = low.createImageData(dust.width, dust.height);
  for (let iy = 0; iy < dust.height; iy++) {
    const y = iy / dust.height;
    for (let ix = 0; ix < dust.width; ix++) {
      const x = ix / dust.width, p = (iy * dust.width + ix) * 4;
      const warp = cloud(x*3.7 + 12, y*4.5 + 9);
      const billow = cloud(x*5.2 + warp*3, y*6.8 + warp*4.8);
      const d = x + y * .72 - .93 + (warp-.5)*.67;
      const band = Math.exp(-d*d*13);
      const light = Math.min(1, Math.max(0, (billow-.26)*2.3)) * (.28+.72*band);
      const fissure = Math.exp(-Math.pow((billow-.54)*21,2)) * light * band;
      const teal = (1 - Math.cos((x+.44*y)*6.28))*.5;
      const rose = Math.exp(-((x-.70)**2+(y-.21)**2)*13);
      const night = Math.cos((y-.28)*3.8)*.5+.5;
      field.data[p]   = 16 + 12*night + light*(65-48*teal) + fissure*27 + rose*19;
      field.data[p+1] = 17 +  6*night + light*(23+24*teal) + fissure*15 + rose*8;
      field.data[p+2] = 34 + 20*night + light*(54+9*teal) + fissure*16 + rose*4;
      field.data[p+3] = 255;
    }
  }
  low.putImageData(field,0,0);
  ctx.drawImage(dust, 0, 0, W, H);
  const halo = ctx.createRadialGradient(540,530,16,540,530,452);
  halo.addColorStop(0,"#d9ae7c22"); halo.addColorStop(.66,"#e8b07c0e"); halo.addColorStop(1,"#a8797500");
  ctx.fillStyle = halo; ctx.fillRect(0,0,W,H);
  let seed = 348277;
  const next = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i=0; i<1150; i++) {
    const x = next()*W, y = next()*H, mag = next();
    const r = .55 + mag**7 * 1.9;
    ctx.fillStyle = i%3 === 0 ? "#dfdcef" : "#f6deac";
    ctx.globalAlpha = .2 + mag*.69;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    if (mag > .975) {
      ctx.globalAlpha = .47; ctx.fillRect(x-.65,y-3.8*r,1.3,7.6*r); ctx.fillRect(x-2.6*r,y-.6,5.2*r,1.2);
    }
  }
  ctx.globalAlpha = 1;
}

function paintOrrery(ctx: CanvasRenderingContext2D) {
  ctx.save(); ctx.translate(540,557);
  const gold = ctx.createLinearGradient(-452,-330,420,370);
  for (const [t,color] of [[0,"#d9b780"],[.22,"#bfa060"],[.43,"#f5e6bf"],[.65,"#977444"],[.9,"#e6cfa0"],[1,"#997d50"]] as const) gold.addColorStop(t,color);
  ctx.strokeStyle = gold; ctx.fillStyle = gold;
  const tau = Math.PI*2;
  for (const [r,width,opacity] of [[454,2,.86],[448,1.3,.7],[430,3,.77],[424,1,.9],[393,1,.54],[340,1.5,.38],[326,1,.29],[243,1.2,.31]]) {
    ctx.globalAlpha = opacity; ctx.lineWidth=width;
    ctx.beginPath(); ctx.arc(0,0,r,0,tau); ctx.stroke();
  }
  paintOrreryTicks(ctx);
  ctx.globalAlpha=.37; ctx.lineWidth=1.4;
  for (const angle of [-.62,.62]) {
    ctx.beginPath();ctx.ellipse(0,0,388,209,angle,0,tau);ctx.stroke();
  }
  ctx.globalAlpha=.76;
  for (const [angle, phase] of [[-2.44,-1],[-2.10,-.56],[-1.81,-.25],[-1.33,.25],[-1.04,.56],[-.70,1]]) {
    ctx.save();ctx.translate(Math.cos(angle)*373, Math.sin(angle)*373);
    ctx.beginPath();ctx.arc(0,0,9,0,tau);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,8,-Math.PI/2,Math.PI/2,phase<0);ctx.bezierCurveTo(phase*6,6,phase*6,-6,0,-8);ctx.fill();ctx.restore();
  }
  ctx.restore();
}

function paintLabel(ctx: CanvasRenderingContext2D, label: string, font: string) {
  ctx.save(); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  let size = 115;
  ctx.font = `400 ${size}px ${font}`;
  let ink = ctx.measureText(label);
  while (size > 1) {
    const fit = Math.min(CARTOUCHE.inkWidth / (ink.actualBoundingBoxLeft + ink.actualBoundingBoxRight), CARTOUCHE.inkHeight / (ink.actualBoundingBoxAscent + ink.actualBoundingBoxDescent));
    if (fit >= 1) break;
    size = Math.max(1, Math.min(size - 1, Math.floor(size * fit)));
    ctx.font = `400 ${size}px ${font}`; ink = ctx.measureText(label);
  }
  const x = CARTOUCHE.cx + (ink.actualBoundingBoxLeft - ink.actualBoundingBoxRight)/2;
  const y = CARTOUCHE.cy + (ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent)/2;
  ctx.shadowColor = "#100d16"; ctx.shadowBlur=3; ctx.shadowOffsetY=1.5;
  ctx.strokeStyle = "#513924"; ctx.lineWidth=2; ctx.lineJoin="round";ctx.strokeText(label,x,y);
  ctx.fillStyle = "#f7f0df";ctx.fillText(label,x,y);ctx.restore();
}
