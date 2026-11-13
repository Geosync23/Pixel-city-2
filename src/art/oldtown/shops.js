// Old Town mixed-use shop buildings and the named, enterable venues (cafe, bakery, bookstore, corner store).
import { box, qz, fq, lw, ball, cyl, cone, spx, glow, lit, rng, dk, lt, PAT, ENV } from '../../engine/raster.js';
import { face, walls, wallsOn, mat, bays, win, winRow, upperFloors, door, wallLamp, drainpipe, flowerBox, ivy, railing, balcony, chimney, flatRoof, roofStuff, roofX, dormer, mansard, leanTo, pot, pick, snowTop, isWinter, stringLights, sY, sX, vbOf, D, PALETTE, SNOW, awning, shopfront, fascia, hangSign, poster, chalkboard, spill, cylWin, crate, parasol, acUnit, antenna, bunting, cat, signV, neonV, planter } from './_lib.js';

const CURT = ['#f4ead8', '#e8b4a8', '#b8cdd6', '#c9d6b8', '#f0d890'];
const GOODS = ['#e8c84a', '#d85a4a', '#4a9ac0', '#e8e0cc', '#e88ab0', '#6ab890', '#b07a4a'];

/* ---------- 8. brick shop-below-flats with striped awning ---------- */
const s1Size = p => [p.w || 6, p.d || 7, (p.floors || 3) * 2 + .5];
function shopAwning(p) {
  const q = D(p, { w: 6, d: 7, floors: 3, seed: 1, wall: '#b5654a', front: '#2f5f55', awn: '#b8433a', awn2: '#f4ead8', name: 'SHOP', trim: '#e6dccb', icon: 'star' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2;
  const Fy = face('y', d), Fx = face('x', w);
  walls(0, 0, 0, w, d, H, q.wall, 'brick');
  Fy.q(0, w, 0, 1.78, Fy.c(q.front)); Fx.q(d - 2.6, d, 0, 1.78, Fx.c(q.front));
  shopfront(Fy, 1.75, w - .15, { c: q.front, r, goods: GOODS });
  shopfront(Fx, d - 2.45, d - .15, { c: q.front, r, goods: GOODS });
  door(Fy, 1.1, 0, { c: q.front, glass: true, frame: dk(q.front, .2), step: .08 });
  fascia(Fy, q.name, .15, w - .15, 1.84, 2.32, dk(q.front, .25), '#f8e6a8', { lit: true });
  fascia(Fx, '', d - 2.5, d - .1, 1.84, 2.32, dk(q.front, .25), '#f8e6a8');
  poster(Fx, d * .3, .5, r); if (d > 6) poster(Fx, d * .3 - .6, .45, r);
  upperFloors(Fy, Fx, w, d, fl, r, { ww: .8, wh: 1.05, zo: .75, lintel: q.trim, mull: 'h', curts: CURT, fboxP: .25, catP: .06 }, { lintel: q.trim, mull: 'h', skip: () => r() < .2 });
  drainpipe(Fx, .2, 0, H);
  awning(Fy, 1.6, w - .05, 1.8, { c: q.awn, c2: q.awn2, dep: .6, drop: .3 });
  hangSign(Fy, .25, 3.1, { c: q.awn, fg: '#fff4d0', icon: q.icon });
  const R = flatRoof(0, 0, H, w, d, { c: q.trim, ov: .12, ph: .42, dent: true });
  chimney(R.x0, R.y0 + .3, R.z, .9, q.wall, { w: .5, d: .8 });
  roofStuff(r, Object.assign({}, R, { x0: R.x0 + .8 }), { n: 4, kinds: ['ac', 'vent', 'antenna', 'skylight', 'dish', 'planter'] });
}

/* ---------- 9. stucco shop with timber front, recessed door, hanging sign, tiled roof ---------- */
const s2Size = p => [p.w || 5, p.d || 7, (p.floors || 3) * 2 + Math.round((p.d || 7) * .3 * 4) / 4];
function shopTimber(p) {
  const q = D(p, { w: 5, d: 7, floors: 3, seed: 1, wall: '#e9dcc0', front: '#5a3a2a', roof: '#b8573f', name: 'ANTIQUES', trim: '#f6f0e2', icon: 'key' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2, rh = Math.round(d * .3 * 4) / 4;
  const Fy = face('y', d), Fx = face('x', w), sh = q.shut || pick(r, ['#3f6a5a', '#34506a', '#8a3a3a', '#6a4a6a']);
  walls(0, 0, 0, w, d, H, q.wall, 'stucco');
  Fx.q(0, d, 0, .4, Fx.c(dk(q.wall, .28)));
  // shopfront: window | recessed door | window
  const dm = 2.5, fc = Fy.c(q.front);
  Fy.q(0, w, 0, 1.82, fc);
  shopfront(Fy, .12, dm - .62, { c: q.front, r, goods: q.goods || GOODS, shelf: true, pane: .7 });
  shopfront(Fy, dm + .62, w - .12, { c: q.front, r, goods: q.goods || GOODS, shelf: true, pane: .7 });
  Fy.q(dm - .62, dm + .62, 0, 1.7, '#2a2230'); glow(() => Fy.q(dm - .62, dm + .62, .1, 1.7, '#8a5a30'));
  Fy.poly([[dm - .62, 0], [dm + .62, 0], [dm + .5, .14], [dm - .38, .14]], '#cfc6b4');
  Fy.q(dm - .62, dm - .4, .1, 1.7, dk(fc, .25)); Fy.win(dm - .58, dm - .44, .5, 1.55, { on: true });
  door(Fy, dm + .06, .12, { c: q.front, glass: true, frame: dk(q.front, .15), w: .8, h: 1.5, wreath: true });
  fascia(Fy, q.name, .1, w - .1, 1.86, 2.3, dk(q.front, .2), '#f6d870', { lit: true });
  Fy.dot(w * .25, 2.42, 0, 0, '#2a2a34'); Fy.dot(w * .75, 2.42, 0, 0, '#2a2a34'); glow(() => { Fy.q(w * .25 - .08, w * .25 + .08, 2.34, 2.42, '#fff2c4', null, .1); Fy.q(w * .75 - .08, w * .75 + .08, 2.34, 2.42, '#fff2c4', null, .1); });
  win(Fx, d - 2.1, d - .5, .55, 1.6, { on: true, trim: q.front, r, mull: 'cross' }); poster(Fx, d * .35, .55, r);
  upperFloors(Fy, Fx, w, d, fl, r, { pitch: 1.7, ww: .8, wh: 1.0, zo: .8, trim: q.trim, shut: sh, curts: CURT, fboxP: .7, catP: .08 }, { trim: q.trim, skip: () => r() < .35 });
  hangSign(Fy, w - .3, 3.2, { c: q.front, fg: '#f6d870', icon: q.icon });
  drainpipe(Fy, .12, 1.9, H);
  Fy.box(0, w, H - .14, .14, .08, q.trim, { ol: false });
  const rs = roofX(0, 0, H, w, d, rh, q.roof, { wall: q.wall });
  win(Fx, d / 2 - .25, d / 2 + .25, H + .3, H + .8, { r, trim: q.trim, mull: 'v', sill: false });
  const inset = d * .18; bays(w, { n: w >= 6 ? 2 : 1, m: .5 }).forEach(c => dormer(Fy, c - .5, c + .5, inset, H + inset * rs.s, .7, rs.s, { wall: q.wall, rh: .3, roof: q.roof, win: { r, trim: q.trim } }));
  chimney(.4, d / 2 - .3, H + rh - .3, 1.0, '#a8553f', { w: .6, d: .5 });
  pot(.05, d + .22, 0, { v: r() }); pot(w - .1, d + .22, 0, { v: r() });
}

/* ---------- 10. corner building with a round turret ---------- */
const s3Size = p => [p.w || 7, p.d || 7, (p.floors || 3) * 2 + .5];
function shopTurret(p) {
  const q = D(p, { w: 7, d: 7, floors: 3, seed: 1, wall: '#c4956a', front: '#34406a', roof: '#5c6478', name: 'PHARMACY', trim: '#efe6d4', turret: '#efe6d4', icon: 'leaf' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2;
  const Fy = face('y', d), Fx = face('x', w), tr = .95, tx = w - .25, ty = d - .25;
  walls(0, 0, 0, w, d, H, q.wall, 'brick');
  Fy.q(0, w, 0, 1.8, Fy.c(q.front)); Fx.q(0, d, 0, 1.8, Fx.c(q.front));
  shopfront(Fy, 1.75, w - 1.1, { c: q.front, r, goods: GOODS, shelf: true }); shopfront(Fx, 1, d - 1.1, { c: q.front, r, goods: GOODS, shelf: true });
  door(Fy, 1.1, 0, { c: q.front, glass: true, frame: dk(q.front, .2), step: .08 });
  fascia(Fy, q.name, .15, w - 1.15, 1.86, 2.32, dk(q.front, .25), '#f8e6a8', { lit: true }); fascia(Fx, q.name, 1.05, d - 1.15, 1.86, 2.32, dk(q.front, .25), '#f8e6a8', { lit: true });
  const cy = bays(w, { to: w - 1.1, m: .45, pitch: 1.6 }), cx = bays(d, { to: d - 1.1, from: 0, m: .6, pitch: 1.8 });
  upperFloors(Fy, Fx, w, d, fl, r, { cols: cy, ww: .8, wh: 1.2, zo: .5, arch: true, trim: q.trim, mull: 'cross', curts: CURT, fboxP: 0 }, { cols: cx, ww: .8, wh: 1.2, arch: true, trim: q.trim, mull: 'cross' });
  for (let f = 1; f < fl; f++) { Fy.box(0, w, f * 2 + .12, .1, .05, q.trim, { ol: false }); Fx.box(0, d, f * 2 + .12, .1, .05, q.trim, { ol: false }); }
  hangSign(Fy, .3, 3.2, { c: q.front, fg: '#f8e6a8', icon: q.icon });
  const R = flatRoof(0, 0, H, w, d, { c: q.trim, ov: .12, ph: .42, dent: true });
  chimney(R.x0, R.y0 + .3, R.z, .9, q.wall, { w: .5, d: .8 });
  roofStuff(r, { z: R.z, x0: R.x0 + .8, y0: R.y0, x1: R.x1 - 1.6, y1: R.y1 - 1.6 }, { n: 3 });
  // turret (oriel from the first floor up, conical roof)
  const tz = 2.1, th = H + 1.3 - tz;
  cone(tx, ty, tz - .7, .5, -0.001, q.turret); cyl(tx, ty, tz - .45, tr * .62, .25, dk(q.turret, .15)); cyl(tx, ty, tz - .2, tr * .82, .2, dk(q.turret, .08));
  cyl(tx, ty, tz, tr, th, q.turret);
  for (let f = 1; f <= fl; f++) { const z = f * 2 + (f === fl ? .15 : .5), zt = z + (f === fl ? .75 : 1.15); if (f === fl && th < H - tz + 1) continue; for (const a of [100, 45, -10]) cylWin(tx, ty, tr + .01, a - 15, a + 15, z, zt, r() < .7); }
  cyl(tx, ty, tz + th, tr + .1, .14, dk(q.turret, .1), { t: q.roof });
  cone(tx, ty, tz + th + .14, tr + .16, 2.1, isWinter() ? '#cfd8e6' : q.roof);
  lw([tx, ty, tz + th + 2.2], [tx, ty, tz + th + 2.8], '#3a3440'); spx(tx, ty, tz + th + 2.8, 0, 0, '#e8b84a'); spx(tx, ty, tz + th + 2.8, 1, 1, '#e8b84a'); spx(tx, ty, tz + th + 2.8, 2, 1, '#e8b84a');
}
const s3VB = p => { const s = s3Size(p || {}); return [-.4, -.4, 0, s[0] + .9, s[1] + .9, s[2] + 3.6]; };

/* ---------- 11. market-street greengrocer: open stall front under a deep canopy, stepped false front ---------- */
const s4Size = p => [p.w || 6, p.d || 6, (p.floors || 2) * 2 + 1];
function shopMarket(p) {
  const q = D(p, { w: 6, d: 6, floors: 2, seed: 1, wall: '#d9b08a', front: '#3f6a4a', awn: '#3f8a5a', awn2: '#f4ead8', name: 'GREENGROCER', trim: '#f4ead8' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2;
  const Fy = face('y', d), Fx = face('x', w);
  walls(0, 0, 0, w, d, H, q.wall, 'brick');
  // open front
  const a = 1.75, b = w - .2;
  Fy.q(0, w, 0, 1.85, Fy.c(q.front));
  Fy.q(a, b, 0, 1.7, '#3a2c2e'); glow(() => Fy.q(a, b, 0, 1.7, '#f4c870', '#e8b058'));
  for (let i = 0; i < 3; i++) { const z = .45 + i * .4; Fy.q(a, b, z, z + .05, '#6a4a34'); for (let u = a + .08; u < b - .2; u += .24) { const c = pick(r, ['#e8483f', '#f6a23a', '#f6d04d', '#7ab84a', '#c06ad8', '#e8e0cc']); Fy.q(u, u + .16, z + .05, z + .13 + r() * .12, c); } }
  Fy.q(a, b, 0, .4, Fy.c(dk(q.front, .15)));
  door(Fy, 1, 0, { c: q.front, glass: true, frame: dk(q.front, .2), step: .08 });
  // tiered crates out front
  for (let u = a + .05; u + .5 <= b; u += .55) { crate(u, d + .32, 0, r, { h: .22 }); crate(u, d + .02, 0, r, { h: .45, d: .3 }); }
  if (ENV.season === 2) { ball(a - .3, d + .3, .14, .15, '#e08a2c', { squash: .8 }); ball(a - .1, d + .45, .1, .1, '#d9762b', { squash: .8 }); }
  chalkboard(Fx, d - 1.2, .5, { w: .7, h: .9 }); win(Fx, d * .2, d * .2 + 1.2, .6, 1.5, { on: true, r, trim: q.front, mull: 'cross' });
  upperFloors(Fy, Fx, w, d, fl, r, { ww: .8, wh: .85, zo: .7, trim: q.trim, curts: CURT, shut: q.front }, { trim: q.trim, zo: .7, wh: .85, skip: () => r() < .3 });
  awning(Fy, a - .15, w, 2.2, { c: q.awn, c2: q.awn2, dep: 1.0, drop: .45, scallop: true });
  for (const u of [a - .1, w - .05]) lw(Fy.P(u, 0, .95), Fy.P(u, 1.72, .95), '#4a3a2e');
  if (!isWinter()) bunting(Fy.P(a - .1, 1.6, .98), Fy.P(w - .05, 1.6, .98), Math.round((w - a) * 2.2)); else stringLights(Fy.P(a - .1, 1.62, .98), Fy.P(w - .05, 1.62, .98), Math.round((w - a) * 3));
  // false front with painted sign
  const R = flatRoof(0, 0, H, w, d, { c: q.wall, ph: .3, l: PAT.brick(sY(q.wall)), r: PAT.brick(sX(q.wall)), cap: q.trim });
  roofStuff(r, R, { n: 3, kinds: ['ac', 'vent', 'skylight', 'planter'] });
  const bl = PAT.brick(sY(q.wall)), br = PAT.brick(sX(q.wall));
  box(0, d - .3, H + .3, w, .3, .45, q.wall, { l: bl, r: br, t: snowTop(q.trim) }); box(w * .18, d - .3, H + .75, w * .64, .3, .35, q.wall, { l: bl, r: br, t: snowTop(q.trim) });
  fascia(Fy, q.name, .3, w - .3, H - .28, H + .28, q.trim, dk(q.front, .2));
  Fy.text('EST 1924', 0, w, H + .98, Fy.c(q.trim));
}
const s4VB = p => { const s = s4Size(p || {}); return [-.4, -.4, 0, s[0] + .5, s[1] + 1.3, s[2] + 1.5]; };

/* ================= named venues ================= */
/* ---------- cafe: Bean & Gone ---------- */
const cafeSize = p => [p.w || 6, p.d || 6, (p.floors || 2) * 2 + .5];
function cafe(p) {
  const q = D(p, { w: 6, d: 6, floors: 2, seed: 2, wall: '#efe2c6', front: '#2f5f4a', awn: '#2f6f55', awn2: '#f4ead8', name: 'BEAN & GONE', trim: '#fbf4e4' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2;
  const Fy = face('y', d), Fx = face('x', w);
  walls(0, 0, 0, w, d, H, q.wall, 'brick');
  Fy.q(0, w, 0, 1.8, Fy.c(q.front)); Fx.q(d - 3.2, d, 0, 1.8, Fx.c(q.front));
  shopfront(Fy, 1.9, w - .15, { c: q.front, r, base: .5, pane: 1.4, decal: w >= 5.5 ? 'COFFEE' : null });
  // people-ish silhouettes + pendant lamps inside
  for (let u = 2.4; u < w - .6; u += 1.1) { Fy.q(u, u + .28, .52, .9, '#5a4a52'); Fy.q(u + .05, u + .23, .9, 1.08, '#5a4a52'); lit(() => { Fy.dot(u + .6, 1.42, 0, 0, '#fff2c4'); Fy.dot(u + .6, 1.42, 0, 1, '#ffd98a'); }); }
  shopfront(Fx, d - 3.05, d - .15, { c: q.front, r, base: .5, pane: 1.4 });
  for (let u = d - 2.6; u < d - .6; u += 1.2) { Fx.q(u, u + .28, .52, .9, '#4a3f48'); Fx.q(u + .05, u + .23, .9, 1.08, '#4a3f48'); }
  door(Fy, 1.2, 0, { c: q.front, glass: true, frame: dk(q.front, .2), step: .08 });
  chalkboard(Fy, .12, .45, { w: .5, h: .85 });
  fascia(Fy, q.name, .15, w - .15, 1.86, 2.34, dk(q.front, .3), '#f8e6a8', { lit: true }); fascia(Fx, 'CAFE', d - 3.1, d - .1, 1.86, 2.34, dk(q.front, .3), '#f8e6a8', { lit: true });
  ivy(Fx, 0, d * .42, 0, H - .3, { cu: .2, seed: q.seed, v: r() });
  upperFloors(Fy, Fx, w, d, fl, r, { ww: .85, wh: 1.0, zo: .8, trim: q.trim, shut: q.front, curts: CURT, fboxP: .8, catP: .1 }, { from: d * .45, m: .4, trim: q.trim, shut: q.front });
  awning(Fy, 1.75, w - .05, 1.82, { c: q.awn, c2: q.awn2, dep: .6, drop: .28 }); awning(Fx, d - 3.1, d - .1, 1.82, { c: q.awn, c2: q.awn2, dep: .5, drop: .25 });
  stringLights(Fy.P(1.75, 1.36, .62), Fy.P(w - .05, 1.36, .62), Math.round(w * 2), { sag: .08, cols: ['#ffe08a', '#fff2c4'] });
  hangSign(Fy, .3, 3.25, { c: '#f4ead8', fg: '#5a3a2a', icon: 'cup' });
  pot(1.82, d + .22, 0, { v: .2, tall: true }); pot(.5, d + .22, 0, { v: .6, tall: true });
  // roof terrace
  const R = flatRoof(0, 0, H, w, d, { c: q.wall, ph: .5, l: PAT.brick(sY(q.wall)), r: PAT.brick(sX(q.wall)), cap: q.trim, roof: '#a88a6a' });
  box(R.x0, R.y0, R.z, 1.2, 1.4, 1.5, q.wall, { l: PAT.brick(sY(q.wall)), r: PAT.brick(sX(q.wall)), t: snowTop('#6f6a70') }); face('y', R.y0 + 1.4).q(R.x0 + .3, R.x0 + .9, R.z, R.z + 1.2, '#3a5a4a');
  planter(R.x0 + 1.5, R.y0, R.z, R.x1 - R.x0 - 1.6, .4, r);
  const px = [[R.x0 + 2.2, R.y0 + 1.6], [R.x1 - .9, R.y0 + 1.3], [R.x0 + 1, R.y1 - .9], [R.x1 - 1.3, R.y1 - .8]].filter(a => a[0] > R.x0 + .5 && a[1] < R.y1).sort((a, b) => a[0] + a[1] - b[0] - b[1]);
  px.forEach(([x, y], i) => { box(x - .2, y - .2, R.z, .4, .4, .4, '#e8e0d0', { t: snowTop('#f4ead8') }); if (i % 2 === 0) parasol(x, y, R.z, i ? '#2f6f55' : '#d8643a'); });
  lw([R.x0, R.y1 + .3, R.z + .3], [R.x0, R.y1 + .3, R.z + 1.9], '#4a3a2e'); lw([R.x1 + .3, R.y0, R.z + .3], [R.x1 + .3, R.y0, R.z + 1.9], '#4a3a2e'); lw([R.x1 + .3, R.y1 + .3, R.z + .3], [R.x1 + .3, R.y1 + .3, R.z + 1.9], '#4a3a2e');
  stringLights([R.x0, R.y1 + .3, R.z + 1.9], [R.x1 + .3, R.y1 + .3, R.z + 1.9], Math.round(w * 2)); stringLights([R.x1 + .3, R.y1 + .3, R.z + 1.9], [R.x1 + .3, R.y0, R.z + 1.9], Math.round(d * 2));
}

/* ---------- bakery: Rise & Shine ---------- */
const bakSize = p => [p.w || 6, p.d || 6, (p.floors || 2) * 2 + Math.round((p.d || 6) * .34 * 4) / 4];
function bakery(p) {
  const q = D(p, { w: 6, d: 6, floors: 2, seed: 3, wall: '#f4cdb8', front: '#fbf0dc', awn: '#e8869a', awn2: '#fff6ea', name: 'RISE & SHINE', trim: '#fff6ea', roof: '#a8503a', door: '#4a7a9a' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2, rh = Math.round(d * .34 * 4) / 4;
  const Fy = face('y', d), Fx = face('x', w), BREAD = ['#d9a05a', '#c98a45', '#e8c078', '#b8743a', '#f0d8a0', '#e8a0b0'];
  walls(0, 0, 0, w, d, H, q.wall, 'stucco');
  Fy.q(0, w, 0, .4, mat('tile', Fy.c('#7fa8c0'))); Fx.q(0, d, 0, .4, mat('tile', Fx.c('#7fa8c0')));
  shopfront(Fy, 1.8, w - .2, { c: q.front, r, goods: BREAD, shelf: true, base: .45, pane: 1.0, goodsh: .14 });
  for (let u = 2.1; u < w - .6; u += .9) lit(() => { Fy.dot(u, 1.36, 0, 0, '#fff2c4'); });
  door(Fy, 1.1, 0, { c: q.door, glass: true, frame: q.front, step: .08, gm: 'cross' });
  win(Fx, d - 2.3, d - .6, .6, 1.55, { on: true, r, trim: q.front, mull: 'cross', fbox: true, curt: '#fff6ea' });
  Fx.q(d * .22, d * .22 + .9, 0, 1.5, Fx.c(dk(q.door, .1))); Fx.l(d * .22, 0, d * .22, 1.5, dk(q.door, .6)); Fx.l(d * .22 + .9, 0, d * .22 + .9, 1.5, dk(q.door, .6)); for (let i = 0; i < 2; i++) crate(w + .05, d * .22 + 1.1 + i * .05, i * .28, r, { c: '#e8d8b0', w: .4, d: .5 });
  fascia(Fy, q.name, .2, w - .2, 1.86, 2.36, '#fff0d8', '#8a4a2a', { lit: true, mould: '#e8869a' });
  upperFloors(Fy, Fx, w, d, fl, r, { ww: .85, wh: 1.0, zo: .8, trim: q.trim, shut: q.door, curt: '#fff6ea', fboxP: 1, catP: .05 }, { trim: q.trim, shut: q.door, n: 2 });
  awning(Fy, 1.65, w - .05, 1.82, { c: q.awn, c2: q.awn2, dep: .6, drop: .3, scallop: true });
  hangSign(Fy, .3, 3.3, { c: '#8a4a2a', fg: '#f8d898', icon: 'bread' });
  wallLamp(Fy, .38, 1.15);
  Fy.box(0, w, H - .14, .14, .08, q.trim, { ol: false });
  const rs = roofX(0, 0, H, w, d, rh, q.roof, { wall: q.wall, tick: true });
  win(Fx, d / 2 - .3, d / 2 + .3, H + .3, H + .9, { r, trim: q.trim, arch: true, mull: 'v', sill: false });
  const inset = d * .17; bays(w, { n: w >= 6 ? 2 : 1, m: .7 }).forEach(c => dormer(Fy, c - .5, c + .5, inset, H + inset * rs.s, .7, rs.s, { wall: q.wall, rh: .3, roof: q.roof, win: { r, trim: q.trim } }));
  chimney(.5, d / 2 - .45, H + rh - .4, 1.5, '#a8553f', { w: .9, d: .9 });
  if (isWinter()) stringLights(Fy.P(0, H - .2, .1), Fy.P(w, H - .2, .1), Math.round(w * 2.5));
  pot(1.72, d + .2, 0, { v: .4 });
}

/* ---------- bookstore: Dog-Eared Books ---------- */
const bookSize = p => [p.w || 5, p.d || 7, (p.floors || 3) * 2 + 1.7];
function bookstore(p) {
  const q = D(p, { w: 5, d: 7, floors: 3, seed: 5, wall: '#8f5a4c', front: '#27473a', roof: '#4f4a58', name: 'DOG-EARED BOOKS', trim: '#e6d8b8' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2, mh = 1.7;
  const Fy = face('y', d), Fx = face('x', w), BOOKS = ['#b8433a', '#3f6a8a', '#e8c84a', '#5a8a5a', '#8a4a7a', '#e8e0cc', '#d9762b', '#34406a'];
  walls(0, 0, 0, w, d, H, q.wall, 'brick');
  Fy.q(0, w, 0, 1.82, Fy.c(q.front));
  door(Fy, 1, 0, { c: q.front, glass: true, frame: dk(q.front, .25), step: .08, gm: 'cross' });
  // projecting bay display window full of books
  const b0 = 1.75, b1 = w - .2, Fb = Fy.off(.35), G = face('x', b1);
  Fy.box(b0, b1, 0, 1.75, .35, q.front, { t: snowTop(dk(q.front, .1)) });
  Fb.win(b0 + .1, b1 - .1, .45, 1.62, { on: true, frame: dk(q.front, .5), glowc: ['#ffe3a8', '#f4cf86'] }); G.win(d + .05, d + .3, .45, 1.62, { on: true });
  for (let sh = 0; sh < 3; sh++) { const z = .47 + sh * .38; Fb.l(b0 + .1, z, b1 - .1, z, dk(q.front, .5)); for (let u = b0 + .16; u < b1 - .2;) { const bw = r() < .25 ? .16 : .07, c = pick(r, BOOKS); if (r() < .88) Fb.q(u, u + bw, z + .02, z + (bw > .1 ? .12 : .2 + r() * .1), c); u += bw + .015; } }
  for (let i = 1; i < 3; i++) { const u = b0 + (b1 - b0) * i / 3; Fb.q(u - .03, u + .03, .45, 1.62, Fb.c(q.front)); }
  fascia(Fy, q.name, .1, w - .1, 1.88, 2.36, dk(q.front, .25), '#f0cc6a', { lit: true });
  win(Fx, d - 2.2, d - .5, .6, 1.6, { on: true, r, trim: q.front, mull: 'cross', cat: '#e8e2d6' });
  for (const [u, z] of [[d * .2, .5], [d * .2 + .55, .62], [d * .2 + 1.15, .5]]) poster(Fx, u, z, r);
  ivy(Fx, 0, d * .55, 0, H - .5, { cu: 0, seed: q.seed + 4, v: r() });
  upperFloors(Fy, Fx, w, d, fl, r, { pitch: 1.6, ww: .8, wh: 1.05, zo: .75, lintel: q.trim, sillc: q.trim, mull: 'cross', blind: '#e6d8b8', catP: .1, fboxP: .2 }, { from: d * .4, m: .5, lintel: q.trim, mull: 'cross' });
  hangSign(Fy, .3, 3.3, { c: q.front, fg: '#f0cc6a', icon: 'book' });
  wallLamp(Fy, 1.66, 1.2);
  box(-.1, -.1, H - .2, w + .2, d + .2, .2, q.trim, { t: snowTop(lt(q.trim, .2)) });
  const ms = mansard(0, 0, H, w, d, mh, .6, q.roof, { party: true, wall: q.wall, wallPat: null });
  bays(w, { m: .5, pitch: 1.9 }).forEach(c => dormer(Fy, c - .45, c + .45, .1, H + .1 * ms.s, 1.0, ms.s, { wall: q.trim, roof: dk(q.roof, .2), rh: .3, win: { r, mull: 'cross' } }));
  chimney(w - .8, d * .3, H + mh, .9, q.wall, { w: .5, d: .9 });
  roofStuff(r, { z: H + mh, x0: .5, y0: .5, x1: w - 1.2, y1: d - 2 }, { n: 2, kinds: ['skylight', 'vent'] });
}

/* ---------- corner store: Lucky Corner ---------- */
const csSize = p => [p.w || 7, p.d || 6, (p.floors || 2) * 2 + .5];
function cornerStore(p) {
  const q = D(p, { w: 7, d: 6, floors: 2, seed: 7, wall: '#e2c48e', front: '#c8382e', sign: '#f6cf3a', name: 'LUCKY CORNER', trim: '#f4ead8' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2;
  const Fy = face('y', d), Fx = face('x', w);
  walls(0, 0, 0, w, d, H, q.wall, 'tile');
  Fy.q(0, w, 0, 1.8, Fy.c(q.trim)); Fx.q(0, d, 0, 1.8, Fx.c(q.trim));
  shopfront(Fy, 1.8, w - .15, { c: q.front, r, goods: GOODS, shelf: true, base: .35, glowc: ['#fff2d0', '#f4e0a8'] });
  shopfront(Fx, 2.3, d - .15, { c: q.front, r, goods: GOODS, shelf: true, base: .35, glowc: ['#fff2d0', '#f4e0a8'] });
  for (let u = 2.1; u + .45 < w - .3; u += 1.2) poster(Fy, u, 1.0, r, { w: .4, h: .45 });
  lit(() => Fy.text('OPEN', w - 1.4, w - .3, .92, '#ff5a6a', .01));
  door(Fy, 1.1, 0, { c: q.front, glass: true, frame: dk(q.front, .2), step: .08 });
  // ice chest + side posters
  Fx.box(.5, 1.7, 0, .8, .35, '#e8eef2', { t: snowTop('#f4f8fb') }); Fx.text('ICE', .5, 1.7, .62, '#4a8ac0', .36);
  for (let u = d - 3.9; u > 1.9; u -= .6) poster(Fx, u, .7, r);
  lit(() => { Fy.sign(q.name, .1, w - .1, 1.86, 2.42, q.sign, q.front, {}, .06); Fx.sign(q.name.split(' ')[0], .1, d - .1, 1.86, 2.42, q.sign, q.front, {}, .06); });
  Fy.l(.1, 1.86, w - .1, 1.86, q.front, .06); Fy.l(.1, 2.42, w - .1, 2.42, q.front, .06); Fx.l(.1, 1.86, d - .1, 1.86, dk(q.front, .2), .06); Fx.l(.1, 2.42, d - .1, 2.42, dk(q.front, .2), .06);
  const u = upperFloors(Fy, Fx, w, d, fl, r, { ww: .9, wh: 1.05, zo: .7, trim: q.trim, mull: 'v', blind: '#d8e0e4', catP: .08 }, { trim: q.trim, zo: .7, wh: 1.05, mull: 'v' });
  for (let f = 1; f < fl; f++) { const c = u.yc[(f * 2 + q.seed) % u.yc.length]; Fy.box(c - .3, c + .3, f * 2 + .7, .32, .22, '#c9ced4', { t: snowTop('#d9dee4') }); Fy.l(c - .22, f * 2 + .8, c + .22, f * 2 + .8, '#7a8088', .22); Fy.l(c - .22, f * 2 + .9, c + .22, f * 2 + .9, '#7a8088', .22); }
  hangSign(Fy, .28, 3.5, { c: '#2f7a4a', fg: '#f4ead8', icon: 'clover' });
  // crates & produce out front
  for (let x = 1.95; x + .5 < w - .2; x += .58) crate(x, d + .08, 0, r, { h: .3 + (r() < .4 ? .2 : 0) });
  drainpipe(Fx, .15, 0, H);
  const R = flatRoof(0, 0, H, w, d, { c: q.trim, ph: .4, ov: .06 });
  roofStuff(r, Object.assign({}, R, { y1: R.y1 - 1 }), { n: 4, kinds: ['ac', 'ac', 'vent', 'antenna', 'dish'] });
  // rooftop sign on a frame
  const sz = H + .4, sa = .6, sb = Math.min(w - .6, sa + 3.2), Fs = face('y', d - .5);
  for (let x = sa + .2; x < sb; x += .9) { lw([x, d - .5, sz], [x, d - .5, sz + .5], '#3a3440'); lw([x, d - .5, sz + .5], [x, d - 1.1, sz], '#3a3440'); }
  lit(() => Fs.sign(q.name.split(' ')[0], sa, sb, sz + .45, sz + 1.25, q.front, q.sign, {}, 0)); Fs.l(sa, sz + .45, sa, sz + 1.25, dk(q.front, .5)); Fs.l(sb, sz + .45, sb, sz + 1.25, dk(q.front, .5));
  if (isWinter()) stringLights(Fy.P(0, H - .1, .08), Fy.P(w, H - .1, .08), Math.round(w * 2.5));
}

const T = ['oldtown', 'shop', 'mixeduse'];
export default [
  { id: 'bld.oldtown.shop.awning', kind: 'building', tags: [...T, 'brick', 'market'], size: s1Size, vb: vbOf(s1Size), door: { side: 'y', at: 1.1 }, light: { x: 3, y: 7.8, z: 0, r: 4 }, draw: shopAwning,
    variants: [{ w: 6, d: 7, floors: 3, seed: 2, name: 'HARDWARE', icon: 'key' }, { w: 5, d: 7, floors: 4, seed: 13, wall: '#8f5a4c', front: '#34406a', awn: '#34508a', name: 'TAILOR', icon: 'scissors' }, { w: 7, d: 7, floors: 3, seed: 25, wall: '#c07850', front: '#6a2f3a', awn: '#e0a030', awn2: '#7a3a2a', name: 'DELICATESSEN', icon: 'fish' }, { w: 6, d: 7, floors: 2, seed: 36, wall: '#a8553f', front: '#3a3442', awn: '#3f8a7a', name: 'RECORDS', icon: 'note' }, { w: 5, d: 6, floors: 3, seed: 48, wall: '#c4956a', front: '#7a4a2a', awn: '#d8643a', name: 'FLORIST', icon: 'leaf' }] },
  { id: 'bld.oldtown.shop.timber', kind: 'building', tags: [...T, 'stucco'], size: s2Size, vb: vbOf(s2Size), door: { side: 'y', at: 2.5 }, light: { x: 2.5, y: 7.8, z: 0, r: 4 }, draw: shopTimber,
    variants: [{ w: 5, d: 7, floors: 3, seed: 3, name: 'ANTIQUES' }, { w: 6, d: 7, floors: 2, seed: 16, wall: '#c9d6b8', front: '#34506a', roof: '#5c6478', name: 'TOYS & GAMES', icon: 'star' }, { w: 5, d: 7, floors: 3, seed: 28, wall: '#e8b4a8', front: '#6a2f3a', roof: '#7a5548', name: 'CHOCOLATE', icon: 'clover' }, { w: 5, d: 6, floors: 2, seed: 39, wall: '#f0d890', front: '#2f5f55', name: 'TEA & SPICE', icon: 'leaf' }] },
  { id: 'bld.oldtown.shop.turret', kind: 'building', tags: [...T, 'corner', 'brick'], size: s3Size, vb: s3VB, door: { side: 'y', at: 1.1 }, light: { x: 6.5, y: 7.6, z: 0, r: 5 }, draw: shopTurret,
    variants: [{ w: 7, d: 7, floors: 3, seed: 4, name: 'PHARMACY' }, { w: 8, d: 7, floors: 4, seed: 14, wall: '#a8553f', front: '#2f5f55', roof: '#5f9a8a', name: 'OLD TOWN INN', icon: 'key' }, { w: 7, d: 8, floors: 3, seed: 26, wall: '#8f5a4c', front: '#6a2f3a', roof: '#9a4a3a', turret: '#e8c9a0', name: 'WINE BAR', icon: 'star' }, { w: 6, d: 6, floors: 2, seed: 43, wall: '#b5654a', front: '#3a3442', roof: '#4f4a58', name: 'POST', icon: 'note' }] },
  { id: 'bld.oldtown.shop.market', kind: 'building', tags: [...T, 'market', 'grocer'], size: s4Size, vb: s4VB, door: { side: 'y', at: 1 }, light: { x: 3.5, y: 7, z: 0, r: 4 }, draw: shopMarket,
    variants: [{ w: 6, d: 6, floors: 2, seed: 5 }, { w: 7, d: 6, floors: 2, seed: 12, wall: '#b5654a', front: '#34406a', awn: '#c8443a', name: 'FRUIT & VEG' }, { w: 5, d: 6, floors: 3, seed: 22, wall: '#c9b89a', front: '#7a3a2a', awn: '#e0a030', name: 'CHEESE' }, { w: 6, d: 7, floors: 2, seed: 34, wall: '#a8553f', front: '#2f5f6f', awn: '#3a7a9a', name: 'FISHMONGER' }] },
  { id: 'bld.oldtown.cafe', kind: 'building', tags: ['oldtown', 'shop', 'venue', 'cafe', 'enterable'], size: cafeSize, vb: vbOf(cafeSize, { z: 2.6 }), door: { side: 'y', at: 1.2 }, light: { x: 3, y: 6.9, z: 0, r: 5 }, draw: cafe,
    variants: [{ w: 6, d: 6, floors: 2, seed: 2 }, { w: 7, d: 6, floors: 2, seed: 8, wall: '#b5654a', front: '#27473a' }, { w: 6, d: 6, floors: 3, seed: 19, wall: '#d6c6b0', front: '#5a3a2a', awn: '#8a4a2a' }] },
  { id: 'bld.oldtown.bakery', kind: 'building', tags: ['oldtown', 'shop', 'venue', 'bakery', 'enterable'], size: bakSize, vb: vbOf(bakSize), door: { side: 'y', at: 1.1 }, light: { x: 3, y: 6.9, z: 0, r: 5 }, draw: bakery,
    variants: [{ w: 6, d: 6, floors: 2, seed: 3 }, { w: 7, d: 6, floors: 2, seed: 10, wall: '#f6e2b0', awn: '#e8a23a', door: '#8a4a2a' }, { w: 6, d: 6, floors: 3, seed: 20, wall: '#d8e4d8', awn: '#6aa890', door: '#c8607a', roof: '#6a5a6a' }] },
  { id: 'bld.oldtown.bookstore', kind: 'building', tags: ['oldtown', 'shop', 'venue', 'bookstore', 'enterable'], size: bookSize, vb: vbOf(bookSize), door: { side: 'y', at: 1 }, light: { x: 2.5, y: 7.9, z: 0, r: 5 }, draw: bookstore,
    variants: [{ w: 5, d: 7, floors: 3, seed: 5 }, { w: 6, d: 7, floors: 3, seed: 11, wall: '#77575a', front: '#3a2a4a', roof: '#3f4a5a' }, { w: 5, d: 7, floors: 2, seed: 24, wall: '#a8553f', front: '#1f3a4a' }] },
  { id: 'bld.oldtown.cornerstore', kind: 'building', tags: ['oldtown', 'shop', 'venue', 'cornerstore', 'corner', 'enterable'], size: csSize, vb: vbOf(csSize, { z: 2 }), door: { side: 'y', at: 1.1 }, light: { x: 4, y: 6.9, z: 0, r: 6 }, draw: cornerStore,
    variants: [{ w: 7, d: 6, floors: 2, seed: 7 }, { w: 8, d: 6, floors: 3, seed: 15, wall: '#d8dccf', front: '#2f7a4a', sign: '#fff2c0' }, { w: 7, d: 6, floors: 2, seed: 29, wall: '#c8d8e0', front: '#34508a', sign: '#f6cf3a' }] },
];
