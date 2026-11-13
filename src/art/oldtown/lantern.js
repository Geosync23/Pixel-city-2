// "Lantern Row" food street: narrow colourful eateries with noren, paper lanterns and neon, plus the ramen bar venue.
import { box, qz, fq, lw, ball, cyl, hip, spx, glow, lit, rng, dk, lt, PAT, ENV } from '../../engine/raster.js';
import { face, walls, mat, bays, win, winRow, door, drainpipe, flatRoof, roofStuff, roofX, leanTo, pot, pick, snowTop, isWinter, stringLights, sY, sX, vbOf, D, SNOW, fascia, hangSign, poster, chalkboard, acUnit, antenna, signV, neonV, noren, lantern, lanternString, shingle, waterTank, railing, ventPipe, bitmap } from './_lib.js';

const SHOJI = ['#f4ead0', '#e8dcc0'], WARM = ['#ffd98a', '#f4b860'];
/** open serving counter: glowing kitchen, cook, bottles, counter with bowls, noren above */
function counterFront(F, a, b, r, o = {}) {
  const wood = o.wood || '#5a3a2a';
  F.q(a, b, .85, 1.75, '#3a2c2e'); glow(() => F.q(a, b, .85, 1.75, WARM[0], WARM[1]));
  F.l(a, 1.45, b, 1.45, '#6a4a34'); for (let u = a + .1; u < b - .12; u += .14 + r() * .08) F.q(u, u + .07, 1.46, 1.56 + r() * .1, pick(r, ['#7ab890', '#d85a4a', '#e8c84a', '#e8e0cc', '#6a8ac0']));
  for (let u = a + .35; u < b - .4; u += 1.1 + r() * .3) { F.q(u, u + .34, .9, 1.22, '#f4f0e8'); F.q(u + .06, u + .28, 1.22, 1.4, '#e8b890'); F.q(u + .04, u + .3, 1.38, 1.46, '#f4f0e8'); }
  F.q(a, b, 0, .85, mat('planks', F.c(dk(wood, .1))));
  F.box(a - .06, b + .06, .76, .1, .3, lt(wood, .25), { t: snowTop(lt(wood, .35)) });
  for (let u = a + .2; u < b - .1; u += .5 + r() * .2) { F.dot(u, .9, 0, 0, '#f4f0e8', .2); F.dot(u, .9, 1, 0, '#f4f0e8', .2); F.dot(u, .9, 2, 1, '#f4f0e8', .2); F.dot(u, .9, 0, -1, '#d85a4a', .2); F.dot(u, .9, 1, -1, '#d85a4a', .2); }
  noren(F, a, b, 1.75, { c: o.noren, h: o.nh || .38, mark: o.mark });
}
function menuStrips(F, u0, n, z, r) { for (let i = 0; i < n; i++) { const u = u0 + i * .26; F.q(u, u + .18, z, z + .62, F.c('#f4ead0'), null, .02); for (let k = 0; k < 4; k++) F.dot(u + .09, z + .52 - k * .13, 0, 0, k ? '#3a3440' : '#c8382e', .02); } }
function facadeAC(F, u, z) { F.box(u - .3, u + .3, z, .34, .24, '#c9ced4', { t: snowTop('#d9dee4') }); F.l(u - .2, z + .12, u + .2, z + .12, '#7a8088', .24); F.l(u - .2, z + .22, u + .2, z + .22, '#7a8088', .24); }

/* ---------- 12. food stall house ---------- */
const l1Size = p => [p.w || 4, p.d || 6, (p.floors || 2) * 2 + 1.25];
function stall(p) {
  const q = D(p, { w: 4, d: 6, floors: 2, seed: 1, wall: '#a8433a', wood: '#5a3a2a', noren: '#34406a', neon: '#ff6a8a', name: 'NOODLE', roof: '#4a5060', lant: ['#d8432f'] }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2, rh = 1.25;
  const Fy = face('y', d), Fx = face('x', w);
  walls(0, 0, 0, w, d, H, q.wall, 'planks');
  Fy.q(0, w, 0, 2, mat('planks', Fy.c(q.wood))); Fx.q(0, d, 0, .7, mat('planks', Fx.c(q.wood)));
  door(Fy, .8, 0, { c: '#7a5a3c', glass: true, gm: 'cross', frame: dk(q.wood, .2), glowc: WARM, step: .06, wreath: false });
  counterFront(Fy, 1.45, w - .15, r, { wood: q.wood, noren: q.noren });
  win(Fx, d - 1.9, d - .6, .85, 1.6, { on: true, r, frame: dk(q.wood, .3), trim: q.wood, glowc: WARM }); menuStrips(Fx, d - 3.2, 4, .9, r);
  facadeAC(Fx, d * .22, .3); drainpipe(Fx, .18, 0, H);
  for (let f = 1; f < fl; f++) { const z = f * 2;
    winRow(Fy, w, z, { cols: bays(w, { to: w - .7, m: .4, pitch: 1.5 }), r, ww: .9, wh: 1.0, zo: .7, frame: dk(q.wood, .3), trim: q.wood, glass: SHOJI, p: .75 });
    winRow(Fx, d, z, { cols: bays(d, { m: .9, pitch: 2.4 }), r, ww: .8, wh: .9, zo: .7, frame: dk(q.wood, .3), trim: q.wood });
    if (f > 1) leanTo(Fy, -.05, w + .05, z - .05, .35, .2, q.roof, { tick: true }); }
  leanTo(Fy, -.05, w + .05, 1.95, .7, .35, q.roof, { tick: true });
  lanternString(Fy.P(.15, 1.84, .72), Fy.P(w - .1, 1.84, .72), Math.max(3, Math.round(w * 1.4)), { sag: .1, cols: q.lant });
  roofX(0, 0, H, w, d, rh, q.roof, { wall: q.wall, over: .3, tick: true });
  neonV(Fy, w - .32, H + .05, q.name, { fg: q.neon, bg: '#241c30' });
  ventPipe(w * .3, d * .28, H + rh * .5, .8);
}

/* ---------- 13. tea house with stacked tiled eaves and a hipped roof ---------- */
const l2Size = p => [p.w || 5, p.d || 6, (p.floors || 2) * 2 + 1.5];
function teahouse(p) {
  const q = D(p, { w: 5, d: 6, floors: 2, seed: 1, wall: '#f0e6d0', wood: '#6a2f2a', roof: '#3f5a5a', name: 'TEA HOUSE', lant: '#d8432f' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2;
  const Fy = face('y', d), Fx = face('x', w), wd = dk(q.wood, .2);
  walls(0, 0, 0, w, d, H, q.wall, 'plain');
  for (const [F, len] of [[Fy, w], [Fx, d]]) { F.q(0, len, 0, .7, mat('planks', F.c(q.wood))); for (let f = 0; f < fl; f++) { F.q(0, len, f * 2 + 1.82, f * 2 + 2, F.c(q.wood)); } const n = Math.max(2, Math.round(len / 1.7)); for (let i = 0; i <= n; i++) { const u = Math.min(len - .14, len * i / n); F.q(u, u + .14, 0, H, F.c(q.wood)); } }
  door(Fy, 1.1, 0, { w: 1.2, c: '#8a5a3c', glass: true, gm: 'cross', double: true, frame: wd, glowc: WARM, step: .06, wreath: false });
  win(Fy, 2.1, w - .35, .8, 1.35, { on: true, frame: wd, glass: SHOJI, glowc: WARM, mull: 'cross', sill: false });
  fascia(Fy, q.name, 2.0, w - .25, 1.42, 1.8, '#2a2430', '#f6d870', { lit: true });
  // moon window on the side
  { const c = d * .62, z = 1.05, pts = []; for (let i = 0; i < 10; i++) pts.push([c + Math.cos(i * Math.PI / 5) * .5, z + Math.sin(i * Math.PI / 5) * .5]); Fx.poly(pts.map(p => [c + (p[0] - c) * 1.2, z + (p[1] - z) * 1.2]), Fx.c(q.wood)); Fx.poly(pts, SHOJI[0], SHOJI[1]); glow(() => Fx.poly(pts, WARM[0], WARM[1])); Fx.l(c - .5, z, c + .5, z, wd); Fx.l(c, z - .5, c, z + .5, wd); Fx.l(c - .25, z - .43, c - .25, z + .43, wd); Fx.l(c + .25, z - .43, c + .25, z + .43, wd); }
  menuStripsX(Fx, d - 1.6, r);
  for (let f = 1; f < fl; f++) { const z = f * 2;
    winRow(Fy, w, z, { cols: bays(w, { m: .35, pitch: 1.6 }), r, ww: 1.1, wh: 1.0, zo: .72, frame: wd, glass: SHOJI, glowc: WARM, mull: 'cross', sill: false, p: .8 });
    winRow(Fx, d, z, { cols: bays(d, { m: .5, pitch: 1.9 }), r, ww: 1.1, wh: 1.0, zo: .72, frame: wd, glass: SHOJI, glowc: WARM, mull: 'cross', sill: false, p: .6 });
    Fy.box(-.05, w + .05, z + .55, .08, .3, q.wood, { ol: false }); railing(Fy, 0, w, z + .6, { c: wd, h: .3, off: .3, step: .2 });
  }
  for (let f = 1; f < fl; f++) { leanTo(Fx, -.05, d + .05, f * 2 - .05, .4, .3, q.roof, { tick: true }); leanTo(Fy, -.05, w + .45, f * 2 - .05, .4, .3, q.roof, { tick: true });
    for (let u = .5; u < w; u += 1.25) lantern(Fy.P(u, f * 2 - .15, .42), { s: 1, c: q.lant }); }
  hip(-.3, -.3, H, w + .6, d + .6, 1.6, isWinter() ? '#dfe8f0' : q.roof, { over: 0, inset: .25, l: isWinter() ? SNOW : shingle(q.roof, true, { tick: true }), r: isWinter() ? '#cfdae6' : shingle(dk(q.roof, .22), false, { tick: true }) });
  box(w / 2 - .5, d / 2 - .5, H + 1.6, 1, 1, .12, dk(q.roof, .2), { t: snowTop(dk(q.roof, .1)) }); box(w / 2 - .12, d / 2 - .12, H + 1.72, .24, .24, .3, '#e8b84a', { ol: false });
  for (let u = .5; u < w; u += 1.25) lantern(Fy.P(u, H - .12, .3), { s: 1, c: q.lant });
  pot(.3, d + .2, 0, { tall: true }); pot(1.9, d + .2, 0, { tall: true });
}
function menuStripsX(F, u, r) { F.q(u, u + .9, .85, 1.6, F.c('#2a2430'), null, .02); for (let i = 0; i < 3; i++) { F.q(u + .1 + i * .26, u + .28 + i * .26, .95, 1.5, F.c('#f4ead0'), null, .03); } }

/* ---------- 14. stacked neon building (a different eatery on every floor) ---------- */
const NAMES = ['BAR', 'SUSHI', 'KARAOKE', 'GRILL', 'TEA', 'CURRY', 'DUMPLING', 'BBQ', 'UDON', 'CAFE', 'SAKE', 'TACOS'], NEON = ['#ff5a8a', '#5ad8ff', '#ffd84a', '#8aff9a', '#ff9a4a', '#c88aff'];
const l3Size = p => [p.w || 4, p.d || 6, (p.floors || 4) * 2 + .5];
function neonStack(p) {
  const q = D(p, { w: 4, d: 6, floors: 4, seed: 1, wall: '#d8d2c4', front: '#3a3442', neon: '#ff5a8a', name: 'IZAKAYA', noren: '#b8433a' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2;
  const Fy = face('y', d), Fx = face('x', w);
  walls(0, 0, 0, w, d, H, q.wall, 'tile');
  Fy.q(0, w, 0, 1.95, Fy.c(q.front)); Fx.q(0, d, 0, .5, Fx.c(dk(q.wall, .3)));
  door(Fy, .8, 0, { c: '#5a4a52', glass: true, frame: dk(q.front, .2), glowc: WARM, step: .06, wreath: false });
  Fy.win(1.5, w - .2, .5, 1.6, { on: true, glowc: WARM, frame: dk(q.front, .5) }); for (let u = 1.7; u < w - .5; u += .7) { Fy.q(u, u + .26, .5, .95, '#4a3f48'); Fy.q(u + .04, u + .22, .95, 1.12, '#4a3f48'); }
  noren(Fy, 1.5, w - .2, 1.6, { c: q.noren, h: .32 });
  lit(() => Fy.text('OPEN', 1.5, w - .2, .46, q.neon, .01));
  const blade = w - .32, a = .25, b = w - .85;
  for (let f = 1; f < fl; f++) {
    const z = f * 2, c = NEON[Math.floor(r() * NEON.length)], nm = pick(r, NAMES), dark = r() < .5;
    Fy.win(a, b, z + .75, z + 1.7, { on: r() < .8, mullion: 'v', glowc: pick(r, [WARM, ['#ffc0d0', '#f0a0b8'], ['#c0e8ff', '#a0d0f0'], WARM]) });
    if (r() < .5) { Fy.q(a + .03, b - .03, z + 1.35, z + 1.67, Fy.c('#e6dfd0')); }
    lit(() => Fy.sign(nm.length * 4 > (b - a) * 16 - 2 ? nm.slice(0, 4) : nm, a - .05, b + .05, z + .12, z + .58, dark ? '#241c30' : c, dark ? c : '#241c30', {}, .05));
    winRow(Fx, d, z, { cols: bays(d, { m: .8, pitch: 2.2 }), r, ww: .8, wh: .9, zo: .7 });
    if (r() < .7) facadeAC(Fx, d * .5, z + .25);
  }
  for (const u of [.2, .34]) drainpipe(Fx, u, 0, H);
  signV(Fx, d - .6, H - .3, pick(r, ['BAR', 'EAT', 'FOOD', 'SAKE']), { bg: '#241c30', fg: pick(r, NEON), lit: true });
  lanternString(Fy.P(.1, 1.95, .5), Fy.P(w - .7, 1.95, .5), Math.max(2, Math.round(w * 1.1)), { sag: .12, cols: ['#d8432f', '#f0b040'] });
  Fy.box(0, w, 1.95, .08, .5, q.front, { ol: false, t: snowTop(lt(q.front, .15)) });
  neonV(Fy, blade, H - .15, q.name, { fg: q.neon, bg: '#241c30' });
  const R = flatRoof(0, 0, H, w, d, { c: dk(q.wall, .12), ph: .4 });
  if (d >= 5) waterTank(R.x0 + .7, R.y0 + .7, R.z, { r: .5, h: .9 });
  roofStuff(r, Object.assign({}, R, { x0: R.x0 + 1.3, y1: R.y1 - .8 }), { n: 2, kinds: ['ac', 'vent', 'antenna'] });
  // rooftop billboard
  const Fs = face('y', d - .45), sz = H + .4, c2 = pick(r, NEON);
  for (let x = .5; x < w - .3; x += .8) { lw([x, d - .45, sz], [x, d - .45, sz + .4], '#3a3440'); lw([x, d - .45, sz + .4], [x, d - 1, sz], '#3a3440'); }
  lit(() => Fs.sign(pick(r, ['EAT!', 'BEER', 'COLA', 'YUM', 'HOT']), .2, w - .2, sz + .4, sz + 1.3, '#241c30', c2, {}, 0)); lit(() => { Fs.l(.2, sz + .4, w - .2, sz + .4, c2); Fs.l(.2, sz + 1.3, w - .2, sz + 1.3, c2); Fs.l(.2, sz + .4, .2, sz + 1.3, c2); Fs.l(w - .2, sz + .4, w - .2, sz + 1.3, c2); });
}

/* ---------- ramen bar: Noodle Lantern ---------- */
const rmSize = p => [p.w || 6, p.d || 6, (p.floors || 2) * 2 + 1.5];
function ramen(p) {
  const q = D(p, { w: 6, d: 6, floors: 2, seed: 4, wall: '#efe4cc', wood: '#4a2f28', noren: '#c8382e', roof: '#3a4250', name: 'NOODLE LANTERN', neon: '#ff5a4a' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2, rh = 1.5;
  const Fy = face('y', d), Fx = face('x', w), wd = dk(q.wood, .25);
  walls(0, 0, 0, w, d, H, q.wall, 'plain');
  Fy.q(0, w, 0, 2, mat('planks', Fy.c(q.wood))); Fx.q(0, d, 0, 2, mat('planks', Fx.c(q.wood)));
  for (const [F, len] of [[Fy, w], [Fx, d]]) { for (let f = 1; f < fl; f++) { F.q(0, len, f * 2 + 1.84, f * 2 + 2, F.c(q.wood)); F.q(0, len, f * 2 + .5, f * 2 + .62, F.c(q.wood)); } const n = Math.max(2, Math.round(len / 1.5)); for (let i = 0; i <= n; i++) { const u = Math.min(len - .12, len * i / n); F.q(u, u + .12, 2, H, F.c(q.wood)); } }
  // entrance with big noren, lattice sliding door
  door(Fy, 1.2, 0, { w: 1.2, c: '#8a5a3c', glass: true, gm: 'cross', double: true, frame: wd, glowc: WARM, step: .06, wreath: false });
  noren(Fy, .5, 1.9, 1.78, { c: q.noren, h: .55, n: 3 });
  counterFront(Fy, 2.2, w - .2, r, { wood: q.wood, noren: q.noren, nh: .3 });
  win(Fx, d - 2.6, d - .5, .8, 1.55, { on: true, frame: wd, trim: q.wood, glowc: WARM, mull: 'cross', r }); for (let u = d - 2.4; u < d - .8; u += .7) { Fx.q(u, u + .26, .8, 1.1, '#4a3f48'); Fx.q(u + .04, u + .22, 1.1, 1.26, '#4a3f48'); }
  chalkboard(Fx, d - 3.6, .6, { w: .7, h: .9 }); facadeAC(Fx, 1, .3); drainpipe(Fx, .2, 0, H);
  for (let f = 1; f < fl; f++) { const z = f * 2;
    winRow(Fy, w, z, { cols: bays(w, { to: w - .8, m: .4, pitch: 1.6 }), r, ww: 1.0, wh: 1.0, zo: .72, frame: wd, glass: SHOJI, glowc: WARM, mull: 'cross', sill: false, p: .8 });
    winRow(Fx, d, z, { cols: bays(d, { m: .6, pitch: 2 }), r, ww: 1.0, wh: 1.0, zo: .72, frame: wd, glass: SHOJI, glowc: WARM, mull: 'cross', sill: false });
  }
  leanTo(Fx, -.05, d + .05, 1.95, .5, .3, q.roof, { tick: true }); leanTo(Fy, -.05, w + .55, 1.95, .75, .38, q.roof, { tick: true });
  fascia(Fy, q.name, w / 2 - 1.95, w / 2 + 1.95, 2.42, 2.9, '#f4ead0', '#b82a22', { lit: true, mould: q.wood });
  lanternString(Fy.P(2.1, 1.84, .78), Fy.P(w, 1.84, .78), Math.round((w - 2) * 1.3), { sag: .1, cols: ['#d8432f', '#f4ead0'] });
  lw(Fy.P(.22, 1.9, .78), Fy.P(.22, 1.72, .78), '#2a2430'); lantern(Fy.P(.22, 1.72, .78), { s: 2 });
  roofX(0, 0, H, w, d, rh, q.roof, { wall: q.wall, over: .3, tick: true });
  neonV(Fy, w - .3, H + .2, 'RAMEN', { fg: q.neon, bg: '#241c30' });
  if (isWinter()) stringLights(Fy.P(0, H - .15, .32), Fy.P(w - .6, H - .15, .32), w * 2);
  ventPipe(w * .25, d * .25, H + rh * .5, .9); ventPipe(w * .25 + .5, d * .25, H + rh * .5, .5);
  pot(.05, d + .25, 0, { tall: true, c: '#4a5a6a' }); 
}

const T = ['oldtown', 'lanternrow', 'food', 'shop'];
export default [
  { id: 'bld.oldtown.lantern.stall', kind: 'building', tags: [...T, 'stall'], size: l1Size, vb: vbOf(l1Size, { y: 1.1, z: 1.2 }), door: { side: 'y', at: .8 }, light: { x: 2.5, y: 7, z: 0, r: 4 }, draw: stall,
    variants: [{ w: 4, d: 6, floors: 2, seed: 2, name: 'NOODLE' }, { w: 3, d: 6, floors: 2, seed: 9, wall: '#2f6f6a', noren: '#b8433a', neon: '#ffd84a', name: 'GYOZA', lant: ['#f0b040', '#d8432f'] }, { w: 5, d: 6, floors: 3, seed: 17, wall: '#d8a030', wood: '#4a3028', noren: '#2a2a3a', neon: '#5ad8ff', name: 'CURRY' }, { w: 4, d: 5, floors: 2, seed: 26, wall: '#34406a', noren: '#f4ead0', neon: '#ff9a4a', name: 'SKEWER', lant: ['#f4ead0', '#d8432f'] }, { w: 4, d: 6, floors: 3, seed: 33, wall: '#7a4a6a', noren: '#3f6a4a', neon: '#8aff9a', name: 'BAO' }] },
  { id: 'bld.oldtown.lantern.teahouse', kind: 'building', tags: [...T, 'teahouse'], size: l2Size, vb: vbOf(l2Size, { x: 1, y: 1.1, nx: .8, ny: .8, z: .6 }), door: { side: 'y', at: 1.1 }, light: { x: 2.5, y: 7, z: 0, r: 4 }, draw: teahouse,
    variants: [{ w: 5, d: 6, floors: 2, seed: 3 }, { w: 5, d: 6, floors: 3, seed: 12, wood: '#2f4a4a', roof: '#5a3a3a', name: 'DUMPLINGS', lant: '#f0b040' }, { w: 6, d: 6, floors: 2, seed: 21, wall: '#f4dcc0', wood: '#3a2a2a', roof: '#34405a', name: 'HOT POT' }, { w: 4, d: 6, floors: 3, seed: 30, wood: '#8a3028', roof: '#4a5a4a', name: 'SAKE' }] },
  { id: 'bld.oldtown.lantern.neon', kind: 'building', tags: [...T, 'neon', 'bar'], size: l3Size, vb: vbOf(l3Size, { z: 2 }), door: { side: 'y', at: .8 }, light: { x: 2, y: 7, z: 0, r: 4 }, draw: neonStack,
    variants: [{ w: 4, d: 6, floors: 4, seed: 4 }, { w: 3, d: 6, floors: 5, seed: 13, wall: '#c8d0d8', neon: '#5ad8ff', name: 'KARAOKE', noren: '#34406a' }, { w: 5, d: 6, floors: 3, seed: 22, wall: '#e0c8a0', neon: '#ffd84a', name: 'SUSHI', front: '#4a2f28' }, { w: 4, d: 5, floors: 4, seed: 31, wall: '#b8c8b8', neon: '#8aff9a', name: 'BBQ', noren: '#2a2a3a' }] },
  { id: 'bld.oldtown.ramen', kind: 'building', tags: ['oldtown', 'lanternrow', 'food', 'shop', 'venue', 'ramen', 'enterable'], size: rmSize, vb: vbOf(rmSize, { x: .8, y: 1.2, z: 1.2 }), door: { side: 'y', at: 1.2 }, light: { x: 3, y: 7, z: 0, r: 5 }, draw: ramen,
    variants: [{ w: 6, d: 6, floors: 2, seed: 4 }, { w: 7, d: 6, floors: 2, seed: 16, wood: '#2f3a44', noren: '#34406a', roof: '#5a3a3a' }, { w: 6, d: 6, floors: 3, seed: 27, wall: '#f4dcc0', wood: '#5a2a24' }] },
];
