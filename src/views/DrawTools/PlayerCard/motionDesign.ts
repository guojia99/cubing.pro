export const W = 1080;
export const H = 1440;
export const OUTLINE = { x: 4, y: 4, w: W - 8, h: H - 8, r: 60 } as const;
export const HERO = { x: 18, y: 320, size: 1044, k: 1044 / W } as const;
export const PORTRAIT_WINDOW = { x: 58, y: 116, w: 964, h: 1240 } as const;
export const CARTOUCHE = { cx: 540, cy: 1262, inkWidth: 554, inkHeight: 66 } as const;
export const SPARKS = [[137, 155], [934, 625], [540, 1358]] as const;

export function outlinePath(inset = 0) {
  const path = new Path2D();
  path.roundRect(OUTLINE.x + inset, OUTLINE.y + inset, OUTLINE.w - 2 * inset,
    OUTLINE.h - 2 * inset, Math.max(1, OUTLINE.r - inset));
  return path;
}

export function portraitWindowPath(inset = 0) {
  const { x, y, w, h } = PORTRAIT_WINDOW;
  const path = new Path2D();
  const top = Math.max(0, 180 - inset), bottom = Math.max(0, 36 - inset);
  path.roundRect(x + inset, y + inset, w - 2 * inset, h - 2 * inset, [top, top, bottom, bottom]);
  return path;
}

const nameplate = 'M190 1262 C226 1255 225 1222 271 1218 C359 1212 468 1227 540 1202 C612 1227 721 1212 809 1218 C855 1222 854 1255 890 1262 C854 1269 855 1302 809 1306 C721 1312 612 1297 540 1322 C468 1297 359 1312 271 1306 C225 1302 226 1269 190 1262 Z';
const rivet = { x: 242, y: CARTOUCHE.cy, color: '#efd293' } as const;

type ReliefRegion = 'subject' | 'frame' | 'metal';
type OrnamentMask = Exclude<ReliefRegion, 'subject'>;

// A detail on the real enamel mount identifies its silhouette even after saving as a flat PNG.
export function hasCartouche(source: HTMLCanvasElement | HTMLImageElement) {
  const sample = document.createElement('canvas');
  sample.width = sample.height = 1;
  const ctx = sample.getContext('2d')!;
  ctx.drawImage(source, rivet.x, rivet.y, 1, 1, 0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return Math.abs(r - 239) + Math.abs(g - 210) + Math.abs(b - 147) < 8;
}

export function paintReliefMask(ctx: CanvasRenderingContext2D, region: ReliefRegion, named = false) {
  ctx.save();
  ctx.scale(ctx.canvas.width / W, ctx.canvas.height / H);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.clip(outlinePath());
  if (region === 'subject') {
    // The PNG-only replay raises the full picture window; it never cuts the portrait to a cameo.
    for (let inset = 1; inset <= 72; inset++) {
      const t = inset / 72;
      const value = Math.round(255 * t * t * (3 - 2 * t));
      ctx.fillStyle = `rgb(${value} ${value} ${value})`;
      ctx.fill(portraitWindowPath(inset));
    }
  } else {
    paintFoot(ctx, named, region);
    paintOrnaments(ctx, region);
  }
  ctx.restore();
}

// Local origin is the centre of the orrery, with fill and stroke ink set by the caller.
export function paintOrreryTicks(ctx: CanvasRenderingContext2D) {
  const tau = 2 * Math.PI;
  for (let i = 0; i < 180; i++) {
    ctx.save(); ctx.rotate(i * tau / 180);
    const major = i % 15 === 0, mid = i % 5 === 0;
    ctx.lineWidth = major ? 2.7 : mid ? 1.6 : 1.2;
    ctx.globalAlpha = major ? .93 : .62;
    ctx.beginPath(); ctx.moveTo(0, -446); ctx.lineTo(0, major ? -428 : mid ? -434 : -440); ctx.stroke();
    if (major) {
      ctx.beginPath(); ctx.moveTo(0,-422); ctx.lineTo(-3.3,-414); ctx.lineTo(0,-407); ctx.lineTo(3.3,-414); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  // The north index jewel belongs to the orrery and stays behind the picture window.
  ctx.save();
  ctx.globalAlpha = 1;
  compassStar(ctx, 0, -445, 39);
  ctx.restore();
}

type Ink = string | CanvasGradient;

function gradient(ctx: CanvasRenderingContext2D, x: number, y: number, endX: number, endY: number, stops: readonly (readonly [number, string])[]) {
  const color = ctx.createLinearGradient(x, y, endX, endY);
  for (const [at, hex] of stops) color.addColorStop(at, hex);
  return color;
}

const brass = [[0, '#695035'], [.14, '#f5e6bf'], [.28, '#bfa060'], [.44, '#83623a'], [.61, '#e6cfa0'], [.69, '#fff0c9'], [.84, '#96743f'], [1, '#d9ba7d']] as const;
const ivory = [[0, '#9d805b'], [.17, '#e6d1a9'], [.37, '#fffae9'], [.56, '#f6eed8'], [.72, '#d9c49e'], [.91, '#b49870'], [1, '#8b734e']] as const;

function stroke(ctx: CanvasRenderingContext2D, path: Path2D, color: Ink, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke(path);
}

export function paintArch(ctx: CanvasRenderingContext2D) {
  ctx.save();
  stroke(ctx, portraitWindowPath(), '#5b4434', 3.6);
  stroke(ctx, portraitWindowPath(), gradient(ctx, 58, 116, 1022, 1356, brass), 2.5);
  stroke(ctx, portraitWindowPath(5), '#e9cc97bd', 1.5);
  ctx.restore();
}

export function paintFoot(ctx: CanvasRenderingContext2D, named: boolean, mask?: OrnamentMask) {
  ctx.save();
  ctx.lineCap = ctx.lineJoin = 'round';
  const gold = mask ? '#fff' : gradient(ctx, 120, 1084, 880, 1410, brass);
  for (const side of [1, -1]) {
    ctx.save();
    if (side < 0) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    // The double stem winds behind the mount; negative space between stems is actual sky.
    const stems: [string, number][] = [
      ['M39 1394 C146 1369 145 1280 224 1250 C266 1234 269 1209 250 1199 C231 1188 210 1207 217 1221 C222 1232 236 1229 235 1221', 3.8],
      ['M90 1391 C170 1356 201 1296 267 1307 C337 1318 378 1373 453 1355 C492 1346 514 1338 540 1358', 3.4],
      ['M150 1339 C203 1274 225 1274 266 1271 C292 1270 301 1259 301 1252 M312 1321 C319 1344 337 1358 364 1358', 1.7],
    ];
    if (!named) stems.push(
      ['M540 1358 C500 1330 495 1280 465 1254 C436 1226 412 1229 399 1201 C389 1180 398 1167 413 1170 C426 1172 427 1188 418 1193 C410 1198 405 1190 409 1185', 4.1],
      ['M518 1331 C493 1308 449 1315 419 1302 C387 1288 367 1270 371 1244 M480 1271 Q463 1246 475 1226', 2.8],
    );
    for (const [d, width] of stems) {
      const stem = new Path2D(d);
      if (!mask) stroke(ctx, stem, '#503a2d', width + 2.4);
      stroke(ctx, stem, gold, width);
      if (!mask) stroke(ctx, stem, '#efdcae', width * .27);
    }
    goldLeaf(ctx, 174, 1300, .39, .47, mask);
    goldLeaf(ctx, 224, 1250, -.55, .42, mask);
    goldLeaf(ctx, 341, 1334, 1.55, .49, mask);
    if (!named) {
      goldLeaf(ctx, 475, 1267, .43, .57, mask);
      goldLeaf(ctx, 420, 1303, -.94, .59, mask);
      lily(ctx, 380, 1255, -.22, .58, mask);
    }
    ctx.restore();
  }
  if (named) {
    const plaque = new Path2D(nameplate);
    if (!mask) {
      ctx.save();
      ctx.shadowColor = '#100c1bb3'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
      ctx.fillStyle = gradient(ctx, 0, CARTOUCHE.cy - 60, 0, CARTOUCHE.cy + 60, [[0, 'rgba(67,48,62,.88)'], [.32, 'rgba(30,24,43,.88)'], [.65, 'rgba(22,18,36,.88)'], [1, 'rgba(49,33,47,.88)']]);
      ctx.fill(plaque); ctx.restore();
      stroke(ctx, plaque, '#503b2e', 6.6);
    } else { ctx.fillStyle = mask === 'frame' ? '#fff' : '#000'; ctx.fill(plaque); }
    stroke(ctx, plaque, gold, 3.8);
    ctx.save(); ctx.translate(CARTOUCHE.cx, CARTOUCHE.cy); ctx.scale(.957, .865); ctx.translate(-CARTOUCHE.cx, -CARTOUCHE.cy);
    stroke(ctx, plaque, mask ? '#fff' : '#e6cfa0bb', 1.45); ctx.restore();
    for (const x of [rivet.x, W - rivet.x]) {
      ctx.fillStyle = mask ? '#fff' : rivet.color;
      ctx.beginPath(); ctx.moveTo(x - 4.4, rivet.y); ctx.lineTo(x, rivet.y - 6.2); ctx.lineTo(x + 4.4, rivet.y); ctx.lineTo(x, rivet.y + 6.2); ctx.closePath(); ctx.fill();
    }
  } else {
    lily(ctx, 540, 1325, 0, 1, mask);
  }
  ctx.restore();
}

export function paintOrnaments(ctx: CanvasRenderingContext2D, mask?: OrnamentMask) {
  ctx.save();
  ctx.lineCap = ctx.lineJoin = 'round';
  const gold = mask ? '#fff' : gradient(ctx, 100, 60, 950, 1370, brass);
  for (const side of [1, -1]) {
    ctx.save();
    if (side < 0) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    const tendrils = [
      'M25 398 C96 330 33 247 90 184 C127 143 162 149 180 107 C207 46 266 23 332 42 C386 59 439 54 474 38',
      'M37 604 C89 519 106 426 72 353 C29 257 70 177 115 161 C210 128 227 81 295 78 C335 76 349 100 337 111 C325 123 309 111 318 101',
      'M35 1257 C114 1166 74 1077 68 1002 C62 924 118 864 98 774 C75 663 52 634 61 566 C70 485 134 458 139 391 C143 353 126 333 107 344 C87 357 104 377 117 365',
      'M26 898 C98 826 52 745 99 680 C124 646 152 636 154 594 C156 562 140 552 129 562 C119 572 132 583 138 574',
      'M26 1391 C116 1394 137 1317 109 1269 C77 1214 65 1136 118 1086 C143 1063 157 1062 164 1039',
      'M66 1399 C224 1371 186 1293 290 1283 C324 1281 344 1303 334 1320 C321 1340 294 1328 299 1314 C302 1305 313 1306 316 1311',
      'M111 1399 C230 1351 291 1393 384 1376 C461 1361 464 1339 505 1346 L540 1358',
      'M144 1396 C267 1373 367 1424 492 1388 C512 1382 527 1372 540 1358',
      'M117 58 C195 33 281 41 382 104 C429 135 470 140 509 123 L540 112',
    ];
    for (let i = 0; i < tendrils.length; i++) {
      const path = new Path2D(tendrils[i]);
      const weight = [8, 3.2, 7, 3.8, 7, 4.2, 4, 2, 3][i];
      if (!mask) stroke(ctx, path, '#503a2d', weight + 3.3);
      stroke(ctx, path, gold, weight);
      if (!mask) stroke(ctx, path, '#f1dca7', weight * .22);
    }
    const leaves = [
      [68, 321, .58, .84], [65, 279, -.44, .73], [88, 200, .74, .83], [180, 107, .49, .86], [220, 66, 1.34, .59],
      [65, 549, .49, .83], [75, 504, -.15, .6], [109, 450, .65, .85], [93, 771, -.46, .8], [82, 868, .72, .95],
      [77, 950, -.51, .76], [68, 1020, .56, .98], [99, 1112, .55, .84], [118, 1324, .8, .89], [244, 1368, 1.47, .55],
    ];
    for (const [x,y,rotation,scale] of leaves) goldLeaf(ctx,x,y,rotation,scale,mask);
    lily(ctx, 137, 155, .41, 1.02, mask);
    lily(ctx, side === 1 ? 123 : 138, side === 1 ? 1168 : 1160, side === 1 ? -.34 : .35, side === 1 ? 1.13 : .8, mask);
    if (side < 0) lily(ctx, 146, 625, .48, .91, mask);
    else lily(ctx, 94, 818, .38, .64, mask);
    ctx.restore();
  }
  const rim = outlinePath(11);
  stroke(ctx, rim, gold, 22);
  if (!mask) {
    for (const [inset, color, weight] of [[1.5, '#f5e6bf', 2], [4, '#6d4e31', 1.7], [8, '#ddc28a', 1.2], [16, '#7c6034', 3], [20.5, '#f7e4b0', 2.6], [24, '#4e392e', 2]] as const) stroke(ctx, outlinePath(inset), color, weight);
    ctx.setLineDash([1.3, 4]);
    stroke(ctx, outlinePath(12), '#6c5237', 3);
    ctx.setLineDash([]);
  }
  compassStar(ctx, 540, 1358, 27, mask);
  ctx.restore();
}

function compassStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, mask?: OrnamentMask) {
  ctx.save();
  ctx.translate(x,y);
  if (!mask) {
    const jewel = ctx.createRadialGradient(0,0,1,0,0,r*1.55);
    jewel.addColorStop(0,'#ffe6a4aa'); jewel.addColorStop(.35,'#e6b37145'); jewel.addColorStop(1,'#e6b37100');
    ctx.fillStyle = jewel; ctx.fillRect(-r*2,-r*2,r*4,r*4);
  }
  const compass = new Path2D();
  for (let index=0; index<16; index++) {
    const angle = index*Math.PI/8-Math.PI/2;
    const radius = index % 4 === 0 ? r : index % 2 === 0 ? r*.52 : r*.15;
    if (!index) compass.moveTo(0,-radius); else compass.lineTo(Math.cos(angle)*radius,Math.sin(angle)*radius);
  }
  compass.closePath();
  ctx.fillStyle = mask ? '#fff' : gradient(ctx,-r,-r,r,r,brass); ctx.fill(compass);
  stroke(ctx,compass,mask ? '#fff' : '#faedc9',1.3);
  ctx.restore();
}

function goldLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, scale: number, mask?: 'frame' | 'metal') {
  ctx.save(); ctx.translate(x,y); ctx.rotate(rotation); ctx.scale(scale,scale);
  const leaf = new Path2D('M0 0 C-12 -27 -15 -55 9 -80 C10 -57 32 -31 0 0Z');
  ctx.fillStyle = mask ? '#fff' : gradient(ctx,-11,-40,17,-32,brass); ctx.fill(leaf);
  if (!mask) {
    stroke(ctx,leaf,'#705737',1.5);
    stroke(ctx,new Path2D('M0 0 Q10 -33 9 -76 M5 -31 Q1 -42 0 -47 M8 -46 Q13 -51 16 -59'),'#f4dfb0',1.45);
  }
  ctx.restore();
}

const tepals = [
  ['M0 0 C-6 -30 -29 -52 -34 -80 C-38 -99 -27 -116 -19 -113 C-2 -109 2 -90 0 -75 C3 -55 15 -31 0 0Z', 'M0 -1 C3 -37 -26 -72 -24 -102', 'M-28 -105 Q-18 -98 -18 -83'],
  ['M0 0 C19 -34 14 -65 43 -88 C66 -105 87 -91 87 -70 C69 -83 62 -68 50 -44 C39 -24 22 -13 0 0Z', 'M3 -3 C31 -25 36 -92 74 -86', 'M53 -80 Q70 -98 87 -70'],
  ['M0 0 C-16 -31 -40 -40 -63 -46 C-87 -52 -98 -74 -91 -91 C-77 -80 -64 -87 -41 -78 C-17 -66 -7 -34 0 0Z', 'M-2 -2 C-18 -38 -45 -65 -83 -82', 'M-91 -90 Q-88 -64 -59 -56'],
  ['M0 0 C16 -9 42 -48 70 -43 C91 -39 101 -16 92 -4 C89 -20 72 -22 57 -11 C40 1 16 9 0 0Z','M2 0 C28 -4 49 -37 72 -34', 'M65 -35 Q90 -42 93 -7'],
  ['M0 0 C-20 -4 -36 -23 -63 -20 C-84 -18 -91 -4 -88 8 C-72 0 -65 1 -52 11 C-37 22 -16 12 0 0Z','M-1 0 C-29 5 -44 -17 -71 -12','M-89 7 Q-76 -13 -60 -5'],
  ['M0 0 C-4 -18 -8 -35 2 -59 C9 -78 23 -78 28 -71 C30 -65 21 -56 20 -43 C19 -26 18 -12 0 0Z', 'M1 -2 C14 -23 6 -47 23 -71', 'M12 -67 Q22 -79 27 -70'],
] as const;

function lily(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, scale: number, mask?: 'frame' | 'metal') {
  ctx.save(); ctx.translate(x,y); ctx.rotate(rotation); ctx.scale(scale,scale);
  for (const [index,[silhouette, spine, fold]] of tepals.entries()) {
    const petal = new Path2D(silhouette);
    ctx.fillStyle = mask ? (mask === 'frame' ? '#fff' : '#000') : gradient(ctx,-55+index*6,-86,38-index*4,7,ivory);
    ctx.fill(petal);
    if (!mask) {
      stroke(ctx,petal,'#7e664a',1.45);
      stroke(ctx,new Path2D(spine),'#b29b73',1.7);
      stroke(ctx,new Path2D(fold),'#fff6db',2.1);
      ctx.save();ctx.clip(petal);ctx.translate(3,-1);
      stroke(ctx,new Path2D(spine),'#fff6df',1.15);ctx.restore();
    }
  }
  for (const [endX,endY] of [[-22,-44],[-8,-51], [17,-48],[29,-35]]) {
    const stem = new Path2D(); stem.moveTo(1,0); stem.quadraticCurveTo(endX*.3,-24,endX,endY);
    stroke(ctx,stem,mask ? '#fff' : '#9e7743',2.6);
    ctx.fillStyle = mask ? '#fff' : '#dbad62'; ctx.beginPath(); ctx.ellipse(endX,endY,2.6,5.5,-.7,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
