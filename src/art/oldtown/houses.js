// Old Town houses: rowhouses / townhouses in six styles + grandma's cottage.
import { box, qz, fq, lw, ball, spx, glow, rng, dk, lt, PAT, grassC, ENV } from '../../engine/raster.js';
import { face, walls, wallsOn, mat, bays, win, winRow, door, wallLamp, drainpipe, flowerBox, ivy, railing, balcony, chimney, flatRoof, roofStuff, roofX, roofY, dormer, mansard, leanTo, planter, pot, pick, planePat, snowTop, isWinter, flowerC, leafC, stringLights, sY, sX, vbOf, D, PALETTE, SNOW } from './_lib.js';

const CURT = ['#f4ead8', '#e8b4a8', '#b8cdd6', '#c9d6b8', '#f0d890'];
const PAVE = ['#a9a296', '#a39c90'];

/* ---------- 1. brick brownstone with stoop ---------- */
const bsSize = p => [p.w || 5, p.d || 8, .75 + (p.floors || 3) * 2 + .5];
function brownstone(p) {
  const q = D(p, { w: 5, d: 8, floors: 3, seed: 1, wall: '#8f5a4c', trim: '#e6dccb' }), { w, d } = q, fl = q.floors, r = rng(q.seed), Dp = d - 1, base = .75, H = base + fl * 2;
  const Fy = face('y', Dp), Fx = face('x', w), stone = '#b9b0a0', dc = q.door || pick(r, PALETTE.door);
  qz(0, w, Dp, d, 0, PAVE[0], PAVE[1]);
  walls(0, 0, 0, w, Dp, H, q.wall, 'brick');
  Fy.q(0, w, 0, base, mat('stone', Fy.c(stone))); Fx.q(0, Dp, 0, base, mat('stone', Fx.c(stone)));
  Fy.box(0, w, base - .1, .1, .06, q.trim, { ol: false }); Fx.box(0, Dp, base - .1, .1, .06, q.trim, { ol: false });
  const cols = bays(w, { from: 1.9, m: .2, pitch: 1.35 }), all = [1.2, ...cols], xc = bays(Dp, { m: .9, pitch: 2.4 }), side = r() < .65;
  if (!side) ivy(Fx, .2, Dp * .7, base, H - .6, { cu: Dp * .25, seed: q.seed, v: r() });
  for (let f = 0; f < fl; f++) {
    const z = base + f * 2;
    if (side) winRow(Fx, Dp, z, { cols: xc, r, ww: .7, wh: 1.1, lintel: q.trim, mull: 'h', skip: () => r() < .25 });
    winRow(Fy, w, z, { cols: f ? all : cols, r, ww: .8, wh: f ? 1.15 : 1.3, zo: f ? .5 : .35, lintel: q.trim, mull: 'h', curts: CURT, fboxP: .18, catP: .07 });
  }
  cols.forEach(c => { Fy.win(c - .32, c + .32, .2, .52, { on: r() < .35, frame: '#3a3440' }); Fy.l(c - .1, .2, c - .1, .52, '#3a3440'); Fy.l(c + .1, .2, c + .1, .52, '#3a3440'); });
  door(Fy, 1.2, base, { c: dc, transom: true, frame: q.trim, double: true });
  Fy.box(.55, 1.85, base + 2.12, .12, .22, q.trim, { t: snowTop(lt(q.trim, .2)) });
  wallLamp(Fy, .38, base + 1.05);
  for (let i = 0; i < 3; i++) Fy.box(.6, 1.8, 0, base - i * .25, .25, stone, { t: snowTop(lt(stone, .2)) }, i * .25);
  for (const u of [.6, 1.8]) { lw(Fy.P(u, base + .55, 0), Fy.P(u, .8, .75), '#2f2f3a'); lw(Fy.P(u, .25, .75), Fy.P(u, .8, .75), '#2f2f3a'); lw(Fy.P(u, .5, .4), Fy.P(u, 1.05 - .37 * .55 + .2, .4), '#2f2f3a'); }
  if (w - 2.6 >= .8) planter(2.2, Dp + .35, 0, w - 2.6, .4, r, { c: '#77706c' });
  drainpipe(Fy, w - .14, base, H);
  const Fd = face('y', d - .03); railing(Fd, 1.95, w, 0, { h: .62 }); railing(Fd, 0, .45, 0, { h: .62 }); railing(face('x', w - .03), Dp, d, 0, { h: .62 });
  const R = flatRoof(0, 0, H, w, Dp, { c: q.trim, ov: .12, ph: .42, dent: true });
  chimney(R.x0, R.y0 + .2, R.z, 1.0, q.wall, { w: .5, d: .9 });
  roofStuff(r, Object.assign({}, R, { x0: R.x0 + .8 }), { n: 4, kinds: ['skylight', 'vent', 'antenna', 'planter', 'ac', 'dish'] });
}

/* ---------- 2. painted stucco rowhouse, tiled roof + dormers ---------- */
const stSize = p => [p.w || 4, p.d || 7, (p.floors || 2) * 2 + Math.round((p.d || 7) * .3 * 4) / 4];
function stuccoHouse(p) {
  const q = D(p, { w: 4, d: 7, floors: 2, seed: 1, wall: '#e8c9a0', roof: '#b8573f', trim: '#f4eee0' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2, rh = Math.round(d * .3 * 4) / 4;
  const Fy = face('y', d), Fx = face('x', w), sh = q.shut || pick(r, ['#3f6a5a', '#34506a', '#8a3a3a', '#5a6a3a', '#6a4a6a']), dc = q.door || pick(r, PALETTE.door);
  walls(0, 0, 0, w, d, H, q.wall, 'stucco');
  Fy.q(0, w, 0, .4, Fy.c(dk(q.wall, .28))); Fx.q(0, d, 0, .4, Fx.c(dk(q.wall, .28))); Fy.l(0, .4, w, .4, Fy.c(dk(q.wall, .45))); Fx.l(0, .4, d, .4, Fx.c(dk(q.wall, .45)));
  const up = bays(w, { m: .45, pitch: 1.75 }), gc = bays(w, { from: 1.75, m: .45, pitch: 1.9 }), xc = [d * .32, d * .7];
  for (let f = 0; f < fl; f++) {
    const z = f * 2;
    winRow(Fx, d, z, { cols: xc, r, ww: .7, wh: 1.05, trim: q.trim, skip: i => (i + f) % 2 === 1 && r() < .7 });
    winRow(Fy, w, z, { cols: f ? up : gc, r, ww: .8, wh: 1.15, zo: f ? .5 : .45, trim: q.trim, shut: w >= 4 ? sh : null, curts: CURT, fboxP: f ? .75 : .5, catP: .08 });
  }
  door(Fy, 1, 0, { c: dc, frame: q.trim, lite: true, step: .1 });
  Fy.box(.4, 1.6, 1.78, .1, .3, sh, { t: snowTop(lt(sh, .15)) });
  wallLamp(Fy, 1.72, 1.15);
  drainpipe(Fy, w - .12, 0, H);
  Fy.box(0, w, H - .14, .14, .08, q.trim, { ol: false });
  const rs = roofX(0, 0, H, w, d, rh, q.roof, { wall: q.wall });
  win(Fx, d / 2 - .25, d / 2 + .25, H + .25, H + .75, { r, trim: q.trim, mull: 'v', sill: false });
  const dn = w >= 5.5 ? 2 : 1, inset = d * .2;
  bays(w, { n: dn, m: .5 }).forEach(c => dormer(Fy, c - .5, c + .5, inset, H + inset * rs.s, .7, rs.s, { wall: q.wall, rh: .3, roof: q.roof, win: { r, trim: q.trim } }));
  chimney(w - .95, d / 2 - .3, H + rh - .25, 1.0, '#a8553f', { w: .6, d: .5 });
  pot(.28, d + .2, 0, { v: r() });
}

/* ---------- 3. clapboard townhouse with a bay-window stack and front gable ---------- */
const baySize = p => [p.w || 5, p.d || 8, (p.floors || 3) * 2 + .5 + (p.w || 5) * .5];
function bayHouse(p) {
  const q = D(p, { w: 5, d: 8, floors: 3, seed: 1, wall: '#b8cdd6', trim: '#f6f0e2', roof: '#5c6478' }), { w, d } = q, fl = q.floors, r = rng(q.seed), Dp = d - 1, base = .5, H = base + fl * 2, rh = w * .5;
  const Fy = face('y', Dp), Fx = face('x', w), dc = q.door || pick(r, PALETTE.door), acc = q.accent || dk(q.wall, .35);
  qz(0, w, Dp, d, 0, grassC()[0], grassC()[1]); qz(.6, 1.6, Dp, d, 0, PAVE[0], PAVE[1]);
  walls(0, 0, 0, w, Dp, H, q.wall, 'siding');
  Fy.q(0, w, 0, base, mat('brick', Fy.c('#9a6a58'))); Fx.q(0, Dp, 0, base, mat('brick', Fx.c('#9a6a58')));
  Fy.q(0, .14, base, H, Fy.c(q.trim)); Fx.q(Dp - .14, Dp, base, H, Fx.c(q.trim)); Fx.q(0, .14, base, H, Fx.c(q.trim));
  const xc = bays(Dp, { m: 1, pitch: 2.6 });
  for (let f = 0; f < fl; f++) { const z = base + f * 2; winRow(Fx, Dp, z, { cols: xc, r, ww: .7, wh: 1.15, trim: q.trim, mull: 'h', skip: () => r() < .3 }); if (f) win(Fy, .7, 1.5, z + .5, z + 1.65, { r, trim: q.trim, mull: 'h', curt: pick(r, CURT) }); Fy.l(0, z, w, z, Fy.c(dk(q.wall, .3))); }
  // door + porch
  door(Fy, 1.1, base, { c: dc, frame: q.trim, lite: true });
  for (let i = 0; i < 2; i++) Fy.box(.5, 1.7, 0, base - i * .25, .3, '#b9b0a0', { t: snowTop('#cfc6b6') }, i * .3);
  leanTo(Fy, .35, 1.85, base + 1.85, .7, .3, q.roof, { posts: [.4, 1.74], pz: .25, pc: q.trim });
  // bay stack
  const b0 = 2.25, b1 = w - .35, bd = .5, Fb = Fy.off(bd), G = face('x', b1);
  wallsOn(Fy, b0, b1, 0, H, bd, q.wall, 'siding');
  Fb.q(b0, b1, 0, base, mat('brick', Fb.c('#9a6a58'))); G.q(Dp, Dp + bd, 0, base, mat('brick', G.c('#9a6a58')));
  const bc = bays(b1 - b0, { n: b1 - b0 > 2.3 ? 2 : 1, m: .2 }).map(c => c + b0), bw = Math.min(.85, (b1 - b0) / bc.length - .3);
  for (let f = 0; f < fl; f++) {
    const z = base + f * 2;
    Fb.q(b0, b1, z + .1, z + .42, Fb.c(acc)); G.q(Dp, Dp + bd, z + .1, z + .42, G.c(acc));
    winRow(Fb, 0, z, { cols: bc, r, ww: bw, wh: 1.2, zo: .5, trim: q.trim, mull: 'h', curts: CURT, catP: .1, fboxP: f ? 0 : .5 });
    win(G, Dp + .1, Dp + bd - .1, z + .5, z + 1.7, { r, mull: null, sill: false });
    Fb.box(b0 - .04, b1 + .04, z + 1.84, .12, .05, q.trim, { ol: false }); G.q(Dp, Dp + bd, z + 1.84, z + 1.96, G.c(q.trim));
  }
  leanTo(Fy, b0 - .08, b1 + .08, H, bd + .1, .45, q.roof);
  // front gable
  roofY(0, 0, H, w, Dp, rh, q.roof, { wall: q.wall, wallPat: planePat(PAT.shingle(sY(acc)), true), barge: q.trim, over: .2 });
  const m = w / 2; win(Fy, m - .4, m + .4, H + rh * .22, H + rh * .22 + .7, { r, trim: q.trim, arch: true, sill: false, mull: 'v' });
  Fy.q(0, w, H - .16, H, Fy.c(q.trim)); Fx.q(0, Dp, H - .16, H, Fx.c(q.trim));
  // yard
  const g = leafC(r()); for (let x = 2.1; x < w - .2; x += .5) { ball(x, d - .3, .22, .24, isWinter() ? '#8fa89a' : g, isWinter() ? { t: SNOW } : undefined); const fc = flowerC(r); if (fc && r() < .6) spx(x, d - .3, .4, 0, 0, fc); }
  const Fd = face('y', d - .03); railing(Fd, 1.75, w, 0, { h: .45, c: q.trim, step: .18 }); railing(Fd, 0, .45, 0, { h: .45, c: q.trim, step: .18 }); railing(face('x', w - .03), Dp, d, 0, { h: .45, c: dk(q.trim, .15), step: .18 });
  chimney(w - .7, Dp * .3, H + .3, rh * .55 + .9, '#9a6a58');
}

/* ---------- 4. mansard townhouse with dormers and iron balconies ---------- */
const manSize = p => [p.w || 5, p.d || 8, (p.floors || 3) * 2 + 1.7];
function mansardHouse(p) {
  const q = D(p, { w: 5, d: 8, floors: 3, seed: 1, wall: '#e9dcc0', roof: '#5c6478', trim: '#f6f0e2' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2, mh = 1.7, inn = .55;
  const Fy = face('y', d), Fx = face('x', w), dc = q.door || pick(r, PALETTE.door), st = dk(q.wall, .12);
  walls(0, 0, 0, w, d, H, q.wall, 'plain');
  Fy.q(0, w, 0, 2, mat('stone', Fy.c(st))); Fx.q(0, d, 0, 2, mat('stone', Fx.c(st)));
  Fy.box(0, w, 1.92, .12, .07, q.trim, { ol: false }); Fx.box(0, d, 1.92, .12, .07, q.trim, { ol: false });
  for (let z = 2.3; z < H - .3; z += .5) for (const [F, len] of [[Fy, w], [Fx, d]]) { F.q(0, .28 + ((z * 2) & 1) * .14, z, z + .25, F.c(lt(st, .12))); F.q(len - .28 - ((z * 2) & 1) * .14, len, z, z + .25, F.c(lt(st, .12))); }
  const cols = bays(w, { m: .5, pitch: 1.6 }), gc = cols.filter(c => Math.abs(c - 1.1) > .95), xc = bays(d, { m: 1, pitch: 2.3 });
  winRow(Fx, d, 0, { cols: xc, r, ww: .7, wh: 1.0, arch: true, trim: q.trim, skip: () => r() < .4 });
  winRow(Fy, w, 0, { cols: gc, r, ww: .8, wh: 1.0, zo: .4, arch: true, trim: q.trim, mull: 'v' });
  door(Fy, 1.1, 0, { c: dc, frame: q.trim, arch: true, double: true, step: .1 });
  wallLamp(Fy, 1.1 + .78, 1.2);
  for (let f = 1; f < fl; f++) {
    const z = f * 2;
    winRow(Fx, d, z, { cols: xc, r, ww: .7, wh: 1.2, trim: q.trim, mull: 'h', skip: () => r() < .3 });
    winRow(Fy, w, z, { cols, r, ww: .8, wh: 1.35, zo: .32, trim: q.trim, lintel: q.trim, mull: 'cross', curts: CURT, sill: f > 1 });
    if (f === 1) cols.forEach(c => balcony(Fy, c - .6, c + .6, z + .3, { dep: .3, r, plants: true })); else if (r() < .5) flowerBox(Fy, cols[0] - .45, cols[0] + .45, z + .22, r);
  }
  drainpipe(Fy, w - .13, 0, H);
  box(-.1, -.1, H - .22, w + .2, d + .2, .22, q.trim, { t: snowTop(lt(q.trim, .2)) });
  const ms = mansard(0, 0, H, w, d, mh, inn, q.roof, { party: true, wall: q.wall });
  cols.forEach(c => dormer(Fy, c - .42, c + .42, .1, H + .1 * ms.s, 1.0, ms.s, { wall: q.trim, roof: dk(q.roof, .2), rh: .28, win: { r, mull: 'cross' } }));
  railing(face('y', d - inn), 0, w, H + mh, { h: .22, step: .2 });
  chimney(.2, d * .25, H + mh, .9, '#a8553f', { w: .5, d: .9 }); chimney(w - .7, d * .5, H + mh, .9, '#a8553f', { w: .5, d: .9 });
}

/* ---------- 5. stepped-gable brick merchant house ---------- */
const sgSize = p => [p.w || 4, p.d || 8, (p.floors || 3) * 2 + (p.w || 4) * .55 + 1];
function gableHouse(p) {
  const q = D(p, { w: 4, d: 8, floors: 3, seed: 1, wall: '#a8553f', trim: '#e9dfcc', roof: '#4f4a58' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2, rh = w * .55, m = w / 2;
  const Fy = face('y', d), Fx = face('x', w), dc = q.door || pick(r, PALETTE.door);
  walls(0, 0, 0, w, d, H, q.wall, 'brick');
  const cols = bays(w, { m: .45, pitch: 1.5 }), xc = bays(d, { m: 1, pitch: 2.4 });
  for (let f = 0; f < fl; f++) {
    const z = f * 2;
    winRow(Fx, d, z, { cols: xc, r, ww: .65, wh: 1.05, lintel: q.trim, skip: () => r() < .45 });
    if (f) winRow(Fy, w, z, { cols, r, ww: .78, wh: 1.0, zo: .45, arch: true, trim: f === 1 ? q.trim : null, mull: 'cross', sillc: q.trim, shut: f === 1 && w / cols.length > 1.7 ? dc : null, fboxP: .2 });
    if (f) { Fy.box(0, w, z - .08, .1, .05, q.trim, { ol: false }); for (const u of [.22, w - .22]) { Fy.dot(u, z + 1.0, 0, 0, '#2a2430'); Fy.dot(u, z + 1.0, 1, 1, '#2a2430'); Fy.dot(u, z + 1.0, -1, 1, '#2a2430'); Fy.dot(u, z + 1.0, 1, -1, '#2a2430'); Fy.dot(u, z + 1.0, -1, -1, '#2a2430'); } }
  }
  // ground floor: door + big arched shop/warehouse doorway
  door(Fy, 1, 0, { c: dc, frame: q.trim, transom: true, step: .1 });
  if (w >= 3.5) { const a = 1.85, b = w - .35; win(Fy, a, b, .5, 1.25, { r, on: true, arch: true, trim: q.trim, mull: 'cross', fbox: true }); }
  wallLamp(Fy, .3, 1.2);
  roofY(0, 0, H, w, d - .3, rh, q.roof, { over: .05, ovf: 0 });
  // stepped gable
  const n = w >= 5 ? 4 : 3, sw = (m - .5) / n, shh = (rh + .35) / n, bl = PAT.brick(sY(q.wall)), br = PAT.brick(sX(q.wall));
  for (let i = 0; i < n; i++) box(i * sw, d - .3, H + i * shh, w - 2 * i * sw, .3, shh, q.wall, { l: bl, r: br, t: snowTop(q.trim) });
  box(m - .5, d - .3, H + n * shh, 1, .3, .45, q.wall, { l: bl, r: br, t: snowTop(q.trim) }); box(m - .12, d - .27, H + n * shh + .45, .24, .24, .3, q.trim, { t: snowTop(q.trim) });
  for (let i = 0; i < n; i++) { Fy.l(i * sw, H + (i + 1) * shh, (i + 1) * sw, H + (i + 1) * shh, Fy.c(q.trim)); Fy.l(w - (i + 1) * sw, H + (i + 1) * shh, w - i * sw, H + (i + 1) * shh, Fy.c(q.trim)); }
  win(Fy, m - .32, m + .32, H + .25, H + .85, { r, arch: true, trim: q.trim, mull: 'v', sillc: q.trim });
  lw(Fy.P(m, H + rh + .1, 0), Fy.P(m, H + rh + .1, .6), '#3a2f2a'); lw(Fy.P(m, H + rh + .1, .55), Fy.P(m, H + rh - .2, .55), '#3a2f2a');
  drainpipe(Fx, d - .15, 0, H);
  chimney(w - .7, d * .3, H + rh * .3, rh * .5 + .8, q.wall);
}

/* ---------- 6. timber-frame house with jettied upper floors ---------- */
const tfSize = p => [p.w || 5, p.d || 7, (p.floors || 3) * 2 + (p.w || 5) * .55];
function timberHouse(p) {
  const q = D(p, { w: 5, d: 7, floors: 3, seed: 1, wall: '#efe4c8', beam: '#4a3528', roof: '#8a4a3a', base: '#b9ae9c' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2, jet = .25, rh = w * .55, m = w / 2;
  const F0 = face('y', d - jet), Fy = face('y', d), Fx = face('x', w), bm = q.beam, dc = q.door || pick(r, ['#5a3a2a', '#3f6a4a', '#8a2f3a', '#34506a']);
  walls(0, 0, 0, w, d - jet, 2, q.base, 'stone');
  const gc = bays(w, { from: 1.7, m: .4, pitch: 1.7 });
  winRow(F0, w, 0, { cols: gc, r, ww: .9, wh: .95, zo: .55, frame: bm, trim: bm, fboxP: .7, on: true });
  winRow(Fx, d, 0, { cols: [d * .5], r, ww: .7, wh: .9, zo: .6, frame: bm, trim: bm });
  door(F0, 1, 0, { c: dc, frame: bm, step: .1, lite: true });
  wallLamp(F0, 1.72, 1.2);
  for (let u = .1; u < w; u += .8) F0.poly([[u, 2], [u + .12, 2], [u + .12, 1.72]], dk(bm, .1), null, 0);
  walls(0, 0, 2, w, d, H - 2, q.wall, 'plain');
  const beams = (F, len, cols) => {
    const B = F.c(bm), t = .13;
    for (let f = 1; f <= fl; f++) F.q(0, len, f * 2 - (f === fl ? t : 0), f * 2 + (f === fl ? 0 : t), B);
    const posts = [0, len - t]; cols.forEach(c => { posts.push(c - .62, c + .5); });
    for (let f = 1; f < fl; f++) { const z = f * 2;
      posts.forEach(u => { if (u >= 0 && u <= len - t) F.q(u, u + t, z, z + 2, B); });
      F.q(0, len, z + .42, z + .42 + t * .8, B);
      const ps = posts.slice().sort((a, b) => a - b);
      for (let i = 0; i + 1 < ps.length; i++) { const a = ps[i] + t, b = ps[i + 1], isWin = cols.some(c => c > a && c < b); if (isWin || b - a < .35) continue; const up = (i + f) & 1; F.poly([[a, up ? z + .5 : z + 2], [a + .1, up ? z + .5 : z + 2], [b, up ? z + 2 : z + .5], [b - .1, up ? z + 2 : z + .5]], B); }
    }
  };
  const cols = bays(w, { m: .55, pitch: 1.9 }), xc = bays(d, { m: 1.1, pitch: 2.6 });
  beams(Fx, d, xc); beams(Fy, w, cols);
  for (let f = 1; f < fl; f++) { const z = f * 2; winRow(Fx, d, z, { cols: xc, r, ww: .75, wh: .95, zo: .62, frame: bm, sill: false, skip: () => r() < .3 }); winRow(Fy, w, z, { cols, r, ww: .88, wh: .95, zo: .62, frame: bm, sill: false, fboxP: .65, catP: .08, curts: CURT }); }
  roofY(0, 0, H, w, d, rh, q.roof, { wall: q.wall, barge: bm, over: .22, ovf: .18 });
  const B = Fy.c(bm); Fy.q(m - .07, m + .07, H, H + rh - .1, B); Fy.q(m - w * .25, m + w * .25, H + rh * .5, H + rh * .5 + .11, B);
  Fy.poly([[m - w * .25, H], [m - w * .25 + .1, H], [m - .07, H + rh * .5], [m - .17, H + rh * .5]], B); Fy.poly([[m + w * .25, H], [m + w * .25 - .1, H], [m + .07, H + rh * .5], [m + .17, H + rh * .5]], B);
  win(Fy, m + .14, m + .14 + .5, H + .2, H + rh * .5 - .12, { r, frame: bm, sill: false, mull: 'v' }); win(Fy, m - .64, m - .14, H + .2, H + rh * .5 - .12, { r, frame: bm, sill: false, mull: 'v' });
  chimney(w - .75, d * .25, H + rh * .35, rh * .45 + .9, '#9a6a58');
  drainpipe(Fx, d - .14, 2, H);
}

/* ---------- 7. grandma's house ---------- */
const gmSize = p => [p.w || 4, p.d || 7, 6];
function grandma(p) {
  const q = D(p, { w: 4, d: 7, seed: 3, wall: '#f0d890', roof: '#9a4a3a', trim: '#fff8ea', door: '#d8607a', shut: '#5a8a7a' }), { w, d } = q, r = rng(q.seed), Dp = d - 1.5, H = 4, rh = 2;
  const Fy = face('y', Dp), Fx = face('x', w), g = grassC();
  qz(0, w, Dp, d, 0, g[0], g[1]);
  for (let i = 0; i < 3; i++) qz(.75, 1.25, Dp + .15 + i * .45, Dp + .45 + i * .45, 0, '#cfc6b4', '#bdb4a2');
  walls(0, 0, 0, w, Dp, H, q.wall, 'stucco');
  Fy.q(0, w, 0, .45, mat('stone', Fy.c('#b9ae9c'))); Fx.q(0, Dp, 0, .45, mat('stone', Fx.c('#b9ae9c')));
  ivy(Fy, w - 1.1, w, .45, 3.3, { cu: w, seed: q.seed + 3, v: r() });
  if (!isWinter()) for (let z = .8; z < 3; z += .45) { const fc = flowerC(r) || '#e86a8a'; Fy.dot(w - .2 - r() * .5, z, 0, 0, fc, .03); Fy.dot(w - .2 - r() * .5, z + .2, 0, 0, fc, .03); }
  ivy(Fx, 0, Dp * .45, .45, 2.6, { cu: 0, seed: q.seed + 9, v: r() });
  const up = bays(w, { m: .55, n: 2 });
  winRow(Fx, Dp, 0, { cols: [Dp * .62], r, ww: .8, wh: 1.05, trim: q.trim, shut: q.shut, fbox: true, on: true });
  winRow(Fx, Dp, 2, { cols: [Dp * .62], r, ww: .8, wh: 1.05, trim: q.trim, shut: q.shut, curt: '#fff8ea' });
  win(Fy, 2.05, 3.05, .6, 1.7, { on: true, trim: q.trim, shut: w >= 4.5 ? q.shut : null, curt: '#fff8ea', fbox: true, r, cat: '#d88a3a', glowc: ['#ffd98a', '#f4c870'] });
  winRow(Fy, w, 2, { cols: up, r, ww: .85, wh: 1.1, trim: q.trim, shut: q.shut, curt: '#fff8ea', fbox: true, p: .75 });
  door(Fy, 1, 0, { c: q.door, frame: q.trim, lite: true, step: .1 });
  bmpHeart(Fy, 1, 1.25);
  leanTo(Fy, .3, 1.7, 1.85, .55, .35, q.roof, { posts: [.34, 1.6], pz: 0, pc: q.trim });
  wallLamp(Fy, 1.78, 1.15);
  Fy.box(0, w, H - .14, .14, .08, q.trim, { ol: false });
  const rs = roofX(0, 0, H, w, Dp, rh, q.roof, { wall: q.wall, tick: true });
  win(Fx, Dp / 2 - .25, Dp / 2 + .25, H + .3, H + .8, { r, trim: q.trim, mull: 'cross', sill: false });
  const inset = Dp * .16; dormer(Fy, w / 2 - .55, w / 2 + .55, inset, H + inset * rs.s, .75, rs.s, { wall: q.wall, rh: .32, roof: q.roof, win: { r, trim: q.trim, curt: '#fff8ea', on: true } });
  chimney(w - 1.05, Dp / 2 - .35, H + rh - .3, 1.2, '#a8553f', { w: .8, d: .6 });
  drainpipe(Fx, Dp - .14, 0, H);
  // garden
  for (let x = 1.9; x < w - .25; x += .42) { const gg = leafC(r()); ball(x, Dp + .3, .2, .2, isWinter() ? '#8fa89a' : gg, isWinter() ? { t: SNOW } : undefined); const fc = flowerC(r); if (fc) { spx(x, Dp + .3, .42, 0, 0, fc); spx(x, Dp + .3, .42, 1, 1, fc); spx(x, Dp + .3, .3, -2, 0, flowerC(r) || fc); } }
  if (ENV.season === 2) { ball(.35, Dp + .3, .16, .17, '#e08a2c', { squash: .8 }); ball(.6, Dp + .55, .12, .12, '#d9762b', { squash: .8 }); }
  if (isWinter()) { ball(w - .9, Dp + .9, .25, .25, '#f4f8fb'); ball(w - .9, Dp + .9, .62, .17, '#f4f8fb'); spx(w - .9, Dp + .9, .62, 1, 0, '#e08a2c'); spx(w - .9, Dp + .9, .66, -1, -1, '#2a2430'); stringLights([0, Dp + .02, H - .2], [w, Dp + .02, H - .2], Math.round(w * 2.5)); }
  // mailbox + picket fence with gate gap
  box(.2, d - .3, 0, .08, .08, .55, '#6a5a4a', { ol: false }); box(.08, d - .36, .55, .32, .2, .2, '#c8443a', { t: snowTop('#d8544a') });
  const Fd = face('y', d - .03), pk = q.trim; railing(Fd, 1.5, w, 0, { h: .48, c: pk, step: .14 }); railing(Fd, 0, .5, 0, { h: .48, c: pk, step: .14 }); railing(face('x', w - .03), Dp, d, 0, { h: .48, c: dk(pk, .14), step: .14 });
}
function bmpHeart(F, u, z) { for (const [dx, dy] of [[-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) F.dot(u, z, dx, dy, '#fff0f0', .01); }

const T = ['oldtown', 'residential'];
export default [
  { id: 'bld.oldtown.rowhouse.brick', kind: 'building', tags: [...T, 'house', 'rowhouse', 'brick'], size: bsSize, vb: vbOf(bsSize, { y: .4 }), door: { side: 'y', at: 1.2 }, draw: brownstone,
    variants: [{ w: 5, d: 8, floors: 3, seed: 11, wall: '#8f5a4c' }, { w: 4, d: 8, floors: 4, seed: 23, wall: '#a8553f', trim: '#e9dfcc' }, { w: 6, d: 9, floors: 3, seed: 37, wall: '#b5654a', door: '#3f6a4a' }, { w: 5, d: 8, floors: 4, seed: 58, wall: '#77575a', trim: '#d9cfc0', door: '#8a2f3a' }] },
  { id: 'bld.oldtown.rowhouse.stucco', kind: 'building', tags: [...T, 'house', 'rowhouse', 'stucco'], size: stSize, vb: vbOf(stSize, { y: .6 }), door: { side: 'y', at: 1 }, draw: stuccoHouse,
    variants: [{ w: 4, d: 7, floors: 2, seed: 4, wall: '#e8c9a0' }, { w: 4, d: 7, floors: 3, seed: 15, wall: '#c9d6b8', roof: '#7a5548' }, { w: 6, d: 8, floors: 2, seed: 27, wall: '#e8b4a8', roof: '#5c6478' }, { w: 5, d: 7, floors: 3, seed: 31, wall: '#b8cdd6', roof: '#b8573f' }, { w: 4, d: 6, floors: 2, seed: 44, wall: '#f0d890', roof: '#9a4a3a' }] },
  { id: 'bld.oldtown.rowhouse.bay', kind: 'building', tags: [...T, 'house', 'rowhouse', 'bay'], size: baySize, vb: vbOf(baySize, { y: .4 }), door: { side: 'y', at: 1.1 }, draw: bayHouse,
    variants: [{ w: 5, d: 8, floors: 3, seed: 5, wall: '#b8cdd6' }, { w: 5, d: 8, floors: 2, seed: 17, wall: '#e8b4a8', roof: '#7a5548', accent: '#c07a80' }, { w: 6, d: 9, floors: 3, seed: 29, wall: '#c9d6b8', accent: '#6a8a6a', roof: '#4f4a58' }, { w: 5, d: 8, floors: 3, seed: 41, wall: '#f0d890', accent: '#c98a3a', roof: '#9a4a3a' }] },
  { id: 'bld.oldtown.rowhouse.mansard', kind: 'building', tags: [...T, 'house', 'rowhouse', 'mansard'], size: manSize, vb: vbOf(manSize, { y: .6 }), door: { side: 'y', at: 1.1 }, draw: mansardHouse,
    variants: [{ w: 5, d: 8, floors: 3, seed: 6, wall: '#e9dcc0' }, { w: 6, d: 8, floors: 4, seed: 18, wall: '#d9cdb8', roof: '#4f4a58' }, { w: 5, d: 7, floors: 2, seed: 33, wall: '#e8d0c0', roof: '#6a5a6a' }, { w: 7, d: 9, floors: 3, seed: 47, wall: '#dcd6c4', roof: '#4a6a6a' }] },
  { id: 'bld.oldtown.rowhouse.gable', kind: 'building', tags: [...T, 'house', 'rowhouse', 'brick', 'gable'], size: sgSize, vb: vbOf(sgSize, { y: .8 }), door: { side: 'y', at: 1 }, draw: gableHouse,
    variants: [{ w: 4, d: 8, floors: 3, seed: 7, wall: '#a8553f' }, { w: 4, d: 8, floors: 4, seed: 19, wall: '#8f5a4c', roof: '#7a4a3a' }, { w: 5, d: 9, floors: 3, seed: 35, wall: '#c07850', door: '#3f6a4a' }, { w: 4, d: 7, floors: 2, seed: 49, wall: '#9c4a40', door: '#34406a' }] },
  { id: 'bld.oldtown.rowhouse.timber', kind: 'building', tags: [...T, 'house', 'rowhouse', 'timber'], size: tfSize, vb: vbOf(tfSize, { y: .6 }), door: { side: 'y', at: 1 }, draw: timberHouse,
    variants: [{ w: 5, d: 7, floors: 3, seed: 8 }, { w: 4, d: 7, floors: 2, seed: 21, wall: '#f4e8d0', roof: '#5c5a68' }, { w: 6, d: 8, floors: 3, seed: 38, wall: '#e8d8b0', beam: '#5a2f2a', roof: '#7a4a3a' }, { w: 5, d: 7, floors: 4, seed: 52, wall: '#f0e0c8', beam: '#3a3a44', roof: '#9a4a3a' }] },
  { id: 'bld.oldtown.grandma', kind: 'building', tags: [...T, 'house', 'home', 'grandma'], size: gmSize, vb: vbOf(gmSize, { y: .4 }), door: { side: 'y', at: 1 }, light: { x: 1, y: 7.4, z: 0, r: 3 }, draw: grandma,
    variants: [{ w: 4, d: 7, seed: 3 }, { w: 5, d: 7, seed: 9, wall: '#f4c8c0', shut: '#6a8ab0', door: '#5a8a7a' }, { w: 4, d: 8, seed: 14, wall: '#d8e4c8', roof: '#7a5548', shut: '#c8607a', door: '#e0a030' }] },
];
