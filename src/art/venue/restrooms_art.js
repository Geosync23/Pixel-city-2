// Real venue restrooms (owner msgs 151 + 192, BIBLE Direction update 28): art. ids furn.wc.*; rooms: src/scenes/rooms/restrooms.js, logic: src/sim/restrooms.js.
// Every piece takes p.style 'sky' (SkyDeck: dark stone, walnut, brass) | 'diner' (Dot's Diner: pink tile, teal metal, chrome) | 'hall' (City Hall: marble, oak, brass).
// Only the toilet bowl core (bowl()) is shared between the looks; everything else is drawn per style. Batch 2 (restrooms_art2.js) adds the styles
// service, station, mall, library, museum, gym, bar, arena to stall / bin / door / sign here, and its own basins, mirrors, floors and props.
//   stall   {style, occ (door shut + feet / red light), left (draw the left partition)}  tag wcstall; seats[0] = on the toilet, use = in front of the door
//   vanity  {style 'sky'|'hall'} (tag sink)       sink {style 'diner'} wall-hung basin + cracked mirror (tag sink)
//   mirror  {style 'sky' round backlit | 'hall' arched gilt} (wall)     dryer (wall, diner chrome)      bin {style}
//   pendant (sky, hang with z)   tube (wall, diner fluorescent)   sign {kind 'wash'|'level'|'civic'} (wall)   door {style 'sky'|'diner'} (wall: the venue's restroom door)
//   floor {style, w, d} (flat, under everything)   mints (tag wcmints, sits on the sky vanity)   mop (diner: bucket + wet-floor sign)   suggest (hall: suggestion box, tag wcsuggest)
import { box, qy, qx, qz, lw, fq, glow, lit, cyl, ball, dk, lt, mix, hash2, textS, isFlipped, PW, px, C } from '../../engine/raster.js';
import { F, bx, post, frameY, frameX } from './_lib.js';

export const PORC = '#f4f1ea', BRASS = '#c9a35a', CHROME = '#d5dbe0', INK = '#2a2733';
export const shadow = (x0, x1, y0, y1) => qz(x0, x1, y0, y1, 0, '#2a1f4538');
export const dot = (x, y, z, h, dx = 0, dy = 0) => { const s = PW(x, y, z); px(Math.round(s[0]) + dx, Math.round(s[1]) + dy, C(h)); };
export const blob = (x, y, z, rx, ry, h) => { const s = PW(x, y, z); for (let Y = Math.ceil(s[1] - ry); Y <= Math.floor(s[1] + ry); Y++) { const t = (Y - s[1]) / ry, hw = rx * Math.sqrt(Math.max(0, 1 - t * t)); for (let X = Math.ceil(s[0] - hw); X <= Math.floor(s[0] + hw); X++) px(X, Y, C(h)); } };
/** a disc / ring on a +y plane (round mirror, porthole) */
export const discY = (cx, y, cz, r, h, h2) => { const p = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; p.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]); } fq(p, h, h2); };

/** upright lettering on a +y plane (each 3x5 glyph kept square, the line stepping down the wall), centred on x0..x1 with its top at z.
    The engine's textY skews every glyph column, which turns S into = at this size; signs here need to be read. */
export function label(str, x0, x1, y, z, c) {
  const n = str.length, w = (n * 4 - 1) / 16, xm = (x0 + x1) / 2, fl = isFlipped(), A = PW(fl ? xm + w / 2 : xm - w / 2, y, z), B = PW(fl ? xm - w / 2 : xm + w / 2, y, z), q = Math.max(1, n * 4 - 1);
  for (let i = 0; i < n; i++) { const t = i * 4 / q; textS(str[i], Math.round(A[0] + (B[0] - A[0]) * t), Math.round(A[1] + (B[1] - A[1]) * t), c); }
}
/** the same on a +x plane, centred on y0..y1 */
export function labelX(str, x, y0, y1, z, c) {
  const n = str.length, w = (n * 4 - 1) / 16, ym = (y0 + y1) / 2, fl = isFlipped(), A = PW(x, fl ? ym - w / 2 : ym + w / 2, z), B = PW(x, fl ? ym + w / 2 : ym - w / 2, z), q = Math.max(1, n * 4 - 1);
  for (let i = 0; i < n; i++) { const t = i * 4 / q; textS(str[i], Math.round(A[0] + (B[0] - A[0]) * t), Math.round(A[1] + (B[1] - A[1]) * t), c); }
}
/** a little marker heart on a +x / +y plane, centred at (along, z) */
const HEART = [[0, -.1], [.1, .02], [.08, .07], [.04, .08], [0, .04], [-.04, .08], [-.08, .07], [-.1, .02]];
const heartX = (x, yc, zc, c) => { for (let i = 0; i < HEART.length; i++) { const a = HEART[i], b = HEART[(i + 1) % HEART.length]; lw([x, yc + a[0], zc + a[1]], [x, yc + b[0], zc + b[1]], c); } };
const heartY = (xc, y, zc, c) => { for (let i = 0; i < HEART.length; i++) { const a = HEART[i], b = HEART[(i + 1) % HEART.length]; lw([xc + a[0], y, zc + a[1]], [xc + b[0], y, zc + b[1]], c); } };

/* ---------- the one shared piece: a toilet bowl, side-on in its stall. x0 = the side wall it backs onto (it faces +x), cy = its centre along y.
   o: { hung, tank 'low'|'high'|'plate', seat, c, m (metal), tankC, plate } ---------- */
export function bowl(x0, cy, o) {
  const c = o.c || PORC, sc = o.seat || c, m = o.m || CHROME;
  if (o.tank === 'high') {   // Victorian high cistern on brackets, flush pipe, pull chain
    const tc = o.tankC || '#3f5f4f'; bx(x0 + .01, cy - .25, 1.62, .05, .5, .05, dk(m, .2)); box(x0 + .02, cy - .22, 1.66, .22, .44, .24, tc); lw([x0 + .24, cy - .2, 1.72], [x0 + .24, cy + .2, 1.72], lt(tc, .25));
    lw([x0 + .1, cy + .05, .48], [x0 + .1, cy + .05, 1.66], m); lw([x0 + .11, cy + .06, .48], [x0 + .11, cy + .06, 1.66], dk(m, .3));
    lw([x0 + .2, cy - .18, 1.66], [x0 + .2, cy - .18, 1.16], '#9a9a9a'); bx(x0 + .18, cy - .2, 1.06, .04, .04, .1, '#f1ede4');
  } else if (o.tank === 'low') { box(x0, cy - .19, .4, .2, .38, .42, c); lw([x0 + .2, cy - .15, .78], [x0 + .2, cy + .15, .78], dk(c, .18)); bx(x0 + .2, cy - .14, .7, .02, .06, .03, m); }
  else { qx(x0 + .015, cy - .12, cy + .12, .9, 1.08, o.plate || m); lw([x0 + .02, cy - .04, 1.0], [x0 + .02, cy + .04, 1.0], dk(o.plate || m, .35)); }   // concealed cistern: flush plate
  if (o.hung) box(x0, cy - .13, .2, .22, .26, .14, c);   // wall-hung: no pedestal
  else box(x0 + .26, cy - .1, 0, .4, .2, .26, c);
  cyl(x0 + .52, cy, .26, .2, .14, c, { t: sc }); blob(x0 + .52, cy, .405, 3.8, 1.9, lt(sc, .25)); blob(x0 + .52, cy, .4, 2.6, 1.2, '#a8d8e8');
  qx(x0 + .22, cy - .17, cy + .17, .4, .74, sc); frameX(x0 + .22, cy - .17, cy + .17, .4, .74, dk(sc, .35));   // lid up
}

/* ---------- stalls ---------- */
const ST = {
  sky: { w: 1.4, d: 1.6, top: 2.6, zb: .03, t: .08, door: .1, panel: '#4a3326', door2: '#5a3f2e', post: '#26272c', m: BRASS, toilet: { hung: true, tank: 'plate', plate: BRASS, seat: '#2b2b30' }, back: '#3a3d44' },
  diner: { w: 1.2, d: 1.5, top: 1.85, zb: .28, t: .05, door: .1, panel: '#3f9a94', door2: '#47a8a1', post: CHROME, m: CHROME, toilet: { tank: 'low', seat: '#2a2733' }, back: null },
  hall: { w: 1.6, d: 1.7, top: 2.25, zb: .16, t: .07, door: .12, panel: '#8a5a34', door2: '#9a6a3e', post: '#e8e2d6', m: BRASS, toilet: { tank: 'high', seat: '#8a5a34', m: BRASS, tankC: '#2f5f4f' }, back: '#e8e2d6' },
  // batch 2
  service: { w: 1.3, d: 1.5, top: 2.0, zb: .2, t: .05, panel: '#9aa3a8', door2: '#a8b0b4', post: '#7f878c', m: '#c2c8cc', toilet: { tank: 'low', seat: '#e8e4dc' }, back: '#c8ccd0', deco: 'rivets' },
  station: { w: 1.3, d: 1.6, top: 2.1, zb: .18, t: .06, panel: '#5a7a9a', door2: '#6a8aaa', post: '#c2c8cc', m: CHROME, toilet: { hung: true, tank: 'plate', plate: '#c2c8cc', seat: '#2a2733' }, back: '#eef0ea', deco: 'coin' },
  mall: { w: 1.5, d: 1.7, top: 2.4, dTop: 2.2, zb: .04, t: .07, panel: '#b8a6d8', door2: '#c4b4e0', post: '#e8e4f0', m: CHROME, toilet: { hung: true, tank: 'plate', plate: '#e8e8ec' }, back: '#efe6da', deco: 'rail' },
  library: { w: 1.3, d: 1.5, top: 2.1, zb: .14, t: .06, panel: '#3f5a46', door2: '#4a6a52', post: '#e9e0cc', m: BRASS, toilet: { tank: 'low', seat: '#7a5a3a' }, back: '#e9e0cc', frames: true, deco: 'numeral' },
  museum: { w: 1.4, d: 1.6, top: 2.5, dTop: 2.3, zb: .02, t: .06, panel: '#f2f0ec', door2: '#f8f6f2', post: '#2a2a2e', m: '#2a2a2e', toilet: { hung: true, tank: 'plate', plate: '#2a2a2e', seat: '#2a2a2e' }, back: '#f4f2ee', deco: 'edge' },
  gym: { w: 1.2, d: 1.5, top: 1.9, zb: .25, t: .05, panel: '#e2572e', door2: '#ec6a3c', post: '#3a3f4c', m: '#c2c8cc', toilet: { tank: 'low', seat: '#2a2733' }, back: '#dfe3e6', deco: 'number' },
  bar: { w: 1.2, d: 1.4, top: 1.9, zb: .22, t: .05, panel: '#2a2430', door2: '#33293a', post: '#1e1a22', m: '#8a8f98', toilet: { tank: 'low', seat: '#2a2733', c: '#e8e2d8' }, back: '#3a3040', deco: 'stickers' },
  // batch 3
  deco: { w: 1.4, d: 1.6, top: 2.4, dTop: 2.15, zb: .04, t: .07, panel: '#1e1a22', door2: '#26202c', post: '#c9a35a', m: BRASS, toilet: { tank: 'low', seat: '#1e1a22', m: BRASS }, back: '#e8c8c0', deco: 'sunray' },
  cafe: { w: 1.3, d: 1.5, top: 2.0, zb: .1, t: .06, panel: '#c8a070', door2: '#d4ae80', post: '#8a6a44', m: '#3a3a40', toilet: { tank: 'low', seat: '#c8a070' }, back: '#efe6d2', deco: 'planks' },
  ramen: { w: 1.2, d: 1.4, top: 2.0, zb: .06, t: .06, panel: '#4a3020', door2: '#5a3a28', post: '#2a1c14', m: '#8a8f98', toilet: { tank: 'low', seat: '#2a1c14' }, back: '#d8c8a0', deco: 'noren' },
  pizza: { w: 1.2, d: 1.4, top: 1.9, zb: .22, t: .05, panel: '#3f8a55', door2: '#4a9a62', post: '#f4f0e8', m: CHROME, toilet: { tank: 'low', seat: '#f4f0e8' }, back: '#f4f0e8', deco: 'band' },
  bakery: { w: 1.2, d: 1.4, top: 1.95, zb: .12, t: .06, panel: '#a8c8d8', door2: '#b4d2e0', post: '#f0e0c0', m: '#c2c8cc', toilet: { tank: 'low', seat: '#f4f0e8' }, back: '#f0e0c0', frames: true },
  aqua: { w: 1.3, d: 1.6, top: 2.2, zb: .08, t: .06, panel: '#1f7a8a', door2: '#2a8a9a', post: '#c9a35a', m: BRASS, toilet: { hung: true, tank: 'plate', plate: BRASS, seat: '#f4f1ea' }, back: '#2a6a9a', deco: 'porthole' },
  pool: { w: 1.2, d: 1.5, top: 1.9, zb: .25, t: .05, panel: '#5ab4c8', door2: '#68c0d2', post: '#e8eef0', m: CHROME, toilet: { hung: true, tank: 'plate', seat: '#2a2733' }, back: '#e8eef0', deco: 'number' },
  uni: { w: 1.2, d: 1.5, top: 1.95, zb: .22, t: .05, panel: '#2c3a5c', door2: '#35456a', post: '#c2c8cc', m: '#c2c8cc', toilet: { tank: 'low', seat: '#2a2733' }, back: '#e8e0d0', deco: 'flyers' },
  cinema: { w: 1.3, d: 1.5, top: 2.1, zb: .1, t: .06, panel: '#6a1e24', door2: '#7a262c', post: '#c9a35a', m: BRASS, toilet: { tank: 'low', seat: '#2a1a1a' }, back: '#4a1418', deco: 'stripe2' },
  fish: { w: 1.2, d: 1.4, top: 1.9, zb: .3, t: .04, panel: '#a8b0b4', door2: '#b4bcc0', post: '#7a8288', m: '#c2c8cc', toilet: { tank: 'low', seat: '#2a2733' }, back: '#e8eef0', deco: 'rivets' },
  obs: { w: 1.3, d: 1.5, top: 2.1, zb: .1, t: .06, panel: '#1c2448', door2: '#242e58', post: '#c9a35a', m: BRASS, toilet: { tank: 'low', seat: '#1c2448', m: BRASS }, back: '#2a3460', deco: 'stars' },
  nook: { w: 1.3, d: 1.5, top: 2.0, zb: .14, t: .06, panel: '#7a5a3a', door2: '#8a6a48', post: '#3a3036', m: '#c2c8cc', toilet: { tank: 'low', seat: '#f4f0e8' }, back: '#e8e0d0', deco: 'planks' },
  arena: { w: 1.2, d: 1.5, top: 1.95, zb: .22, t: .05, panel: '#d2392f', door2: '#dc4a3e', post: '#d8dcdf', m: CHROME, toilet: { hung: true, tank: 'plate', seat: '#2a2733' }, back: '#e6e6e2', deco: 'stripe' },
};
const STICK = ['#f2c230', '#4ad8f0', '#ff4a8a', '#9ccc4a', '#f4f0e8', '#b07af8'];
/** per-style marks on a stall's outer partition (x-plane at x) and on its shut door (y-plane at y) */
function decoX(s, p, x, D) {
  if (s.deco === 'stickers') { const r = (p.seed || 3) * 7; for (let i = 0; i < 7; i++) { const y = .15 + ((i * 37 + r) % 100) / 100 * (D - .4), z = .5 + ((i * 53 + r) % 100) / 100 * 1.1, c = STICK[(i + r) % STICK.length]; qx(x, y, y + .14, z, z + .1, c); } labelX('ROCK', x, .3, .9, 1.5, '#f4f0e8'); }
  else if (s.deco === 'stripe') { qx(x, 0, D - .1, 1.15, 1.25, '#f4f0e8'); }
  else if (s.deco === 'rivets') { for (let y = .1; y < D - .1; y += .3) { dot(x, y, s.top - .08, dk(s.panel, .35)); dot(x, y, s.zb + .08, dk(s.panel, .35)); } }
  else if (s.deco === 'rail') bx(x - .02, 0, s.top - .06, .04, D - .1, .04, CHROME);
  else if (s.deco === 'sunray') { const yc = D / 2, zc = s.top - .45; for (let i = 0; i < 7; i++) { const a = Math.PI * (.1 + i * .8 / 6); lw([x, yc, zc], [x, yc + Math.cos(a) * .5, zc + Math.sin(a) * .4], BRASS); } lw([x, .1, s.zb + .2], [x, D - .2, s.zb + .2], BRASS); }
  else if (s.deco === 'planks') { for (let y = .18; y < D - .1; y += .18) lw([x, y, s.zb + .02], [x, y, s.top - .02], dk(s.panel, .3)); }
  else if (s.deco === 'band') qx(x, 0, D - .1, .9, 1.0, '#c8343a');
  else if (s.deco === 'porthole') { const P = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; P.push([x, D / 2 + Math.cos(a) * .22, 1.4 + Math.sin(a) * .22]); } fq(P, BRASS); fq(P.map(q => [x, D / 2 + (q[1] - D / 2) * .75, 1.4 + (q[2] - 1.4) * .75]), '#3ab0d0'); dot(x, D / 2 - .05, 1.47, '#f4f8fb'); }
  else if (s.deco === 'flyers') { for (let i = 0; i < 4; i++) { const y = .15 + i * .3, z = .9 + (i % 2) * .35; qx(x, y, y + .2, z, z + .26, ['#f4f0e8', '#f2c230', '#9ccc4a', '#f4a8c0'][i]); lw([x, y + .04, z + .2], [x, y + .16, z + .2], '#5a5a60'); } labelX('E=MC2', x, .1, D - .2, 1.62, '#f4f0e8'); }
  else if (s.deco === 'stripe2') { qx(x, 0, D - .1, s.top - .3, s.top - .24, BRASS); qx(x, 0, D - .1, .5, .56, BRASS); }
  else if (s.deco === 'stars') { for (let i = 0; i < 9; i++) dot(x, .1 + (i * 37 % 100) / 100 * (D - .3), .6 + (i * 53 % 100) / 100 * 1.3, i % 3 ? '#f2dca0' : '#f4f8fb'); }
}
function decoY(s, p, xa, xb, y) {
  const n = String(p.n || 1);
  if (s.deco === 'coin') { bx(xb - .36, y - .01, .98, .12, .03, .2, '#b8943a'); dot(xb - .3, y + .02, 1.12, '#3a2a14'); lw([xb - .33, y + .02, 1.05], [xb - .27, y + .02, 1.05], '#3a2a14'); }   // the old pay lock (10 cents)
  else if (s.deco === 'numeral') { qy(xa + .25, xa + .55, y, 1.6, 1.78, BRASS); label(n === '2' ? 'II' : 'I', xa + .25, xa + .55, y, 1.75, '#3a2a14'); }
  else if (s.deco === 'number') label(n, xa + .2, xa + .5, y, 1.6, '#f4f0e8');
  else if (s.deco === 'edge') frameY(xa + .04, xb - .04, y, s.zb + .06, (s.dTop || 2.2) - .06, '#2a2a2e');
  else if (s.deco === 'stickers') { for (let i = 0; i < 4; i++) qy(xa + .12 + i * .2, xa + .24 + i * .2, y, .7 + (i % 2) * .5, .8 + (i % 2) * .5, STICK[i + 1]); }
  else if (s.deco === 'stripe') qy(xa, xb, y, 1.15, 1.25, '#f4f0e8');
  else if (s.deco === 'sunray') { const xc = (xa + xb) / 2, zc = 1.7; for (let i = 0; i < 7; i++) { const a = Math.PI * (.1 + i * .8 / 6); lw([xc, y, zc], [xc + Math.cos(a) * .4, y, zc + Math.sin(a) * .3], BRASS); } }
  else if (s.deco === 'porthole') { const xc = (xa + xb) / 2, P = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; P.push([xc + Math.cos(a) * .16, y, 1.5 + Math.sin(a) * .16]); } fq(P, BRASS); fq(P.map(q => [xc + (q[0] - xc) * .7, y, 1.5 + (q[2] - 1.5) * .7]), '#3ab0d0'); }
  else if (s.deco === 'band') qy(xa, xb, y, .9, 1.0, '#c8343a');
  else if (s.deco === 'stars') for (let i = 0; i < 5; i++) dot(xa + .1 + (i * 37 % 100) / 100 * (xb - xa - .2), y, .7 + (i * 53 % 100) / 100, '#f2dca0');
  else if (s.deco === 'flyers') qy(xa + .2, xa + .45, y, 1.1, 1.4, '#f2c230');
}
const stSize = p => { const s = ST[p.style] || ST.diner; return [s.w, s.d, s.top + .06]; };
function panelFace(s, x0, x1, y, z0, z1, c) {   // a door / partition face on +y, dressed per style
  qy(x0, x1, y, z0, z1, c);
  if (s === ST.hall || s.frames) { const i = .1; frameY(x0 + i, x1 - i, y, z0 + .12, (z0 + z1) / 2 - .05, dk(c, .3)); frameY(x0 + i, x1 - i, y, (z0 + z1) / 2 + .05, z1 - .12, dk(c, .3)); lw([x0 + i + .02, y, z1 - .14], [x1 - i - .02, y, z1 - .14], lt(c, .2)); }
  else if (s === ST.sky) { for (let x = x0 + .12; x < x1 - .05; x += .12) lw([x, y, z0 + .05], [x, y, z1 - .05], dk(c, .12)); }
  else { lw([x0, y, z1 - .02], [x1, y, z1 - .02], lt(c, .3)); lw([x0, y, z0 + .02], [x1, y, z0 + .02], dk(c, .25)); }
}
function panelX(s, x, y0, y1, z0, z1, c) {
  qx(x, y0, y1, z0, z1, dk(c, .14));
  if (s === ST.hall || s.frames) { const i = .12; frameX(x, y0 + i, y1 - i, z0 + .12, (z0 + z1) / 2 - .05, dk(c, .38)); frameX(x, y0 + i, y1 - i, (z0 + z1) / 2 + .05, z1 - .12, dk(c, .38)); }
  else if (s === ST.sky) { for (let y = y0 + .14; y < y1 - .05; y += .14) lw([x, y, z0 + .05], [x, y, z1 - .05], dk(c, .24)); }
  else lw([x, y0, z1 - .02], [x, y1, z1 - .02], lt(c, .2));
}
function stall(p) {
  const s0 = ST[p.style] || ST.diner, s = p.c || p.deco || p.m ? Object.assign({}, s0, p.c ? { panel: p.c, door2: lt(p.c, .1), back: p.c2 || s0.back } : {}, p.deco ? { deco: p.deco === 'none' ? null : p.deco } : {}, p.m ? { m: p.m, post: p.post || s0.post } : {}, p.frames ? { frames: true } : {}) : s0;   // batch 4: brand overrides (colour, deco, metal)
  const _x = s, W = s.w, D = s.d, T = s.t, H = s.top, z0 = s.zb, pw = s === ST.diner ? .05 : s.zb > .15 && s.deco ? .06 : .1, dTop = s.dTop || (s === ST.sky ? 2.2 : s === ST.hall ? 1.95 : H), occ = !!p.occ, cy = D * .45;
  const red = (q, pts, c) => { const X = Math.round(q[0]), Y = Math.round(q[1]); for (const [a, b] of pts) px(X + a, Y + b, C(c)); };
  if (s.back) qy(0, W, .01, 0, Math.min(H, 2.2), s === ST.hall ? (u, v) => (v % 10 === 0 ? '#d6cfc0' : (u + (v / 10 | 0) * 7) % 14 === 0 ? '#d6cfc0' : s.back) : s.back);   // the wall inside the stall
  shadow(.04, W - .04, .2, D - .1);
  if (p.left) box(0, 0, z0, T, D - pw, H - z0, s.panel, { ol: false });
  panelX(s, T, 0, D - pw, z0, H, s.panel);   // the side wall the toilet backs onto (own partition, or the stall to the left)
  // a hook on the back wall
  lw([W * .55, .02, 1.5], [W * .55, .1, 1.46], s.m);
  bowl(T, cy, s.toilet);
  // toilet roll on the side wall, by the seat
  if (s === ST.diner) { bx(T, cy + .32, .66, .05, .14, .16, '#e8e4dc'); cyl(T + .08, cy + .39, .62, .06, .08, '#f8f5ee', { ol: false }); }
  else { lw([T + .02, cy + .3, .78], [T + .1, cy + .3, .78], s.m); cyl(T + .1, cy + .4, .72, .06, .08, '#f8f5ee', { ol: false }); }
  if (s === ST.sky) lit(() => { lw([T + .06, .05, 2.38], [W - T - .06, .05, 2.38], '#ffd890'); });
  if (s === ST.hall) { const q = PW(T, cy - .45, 1.3); red(q, [[0, 0], [1, 0], [0, 1], [1, 1]], '#f2dca0'); }
  // open: the door has swung in against the right partition (drawn before it: only what shows through the doorway is seen)
  if (!occ) { qx(W - T - .06, D - pw - .7, D - pw - .02, z0 + .02, dTop - .02, dk(s.door2, .2)); lw([W - T - .06, D - pw - .02, z0 + .02], [W - T - .06, D - pw - .02, dTop - .02], dk(s.door2, .5)); }
  // right partition (the next stall's left wall), outer face visible
  box(W - T, 0, z0, T, D - pw, H - z0, s.panel, { ol: false }); panelX(s, W, 0, D - pw, z0, H, s.panel);
  if (s.deco) decoX(s, p, W, D);
  if (s === ST.diner && p.tag) { labelX('D+J', W, .7, 1.25, 1.45, INK); heartX(W, .4, 1.3, '#c8233a'); lw([W, 1.2, 1.0], [W, .7, 1.0], dk(s.panel, .3)); }   // carved into the partition

  // front: pilasters / posts
  if (s === ST.diner) { for (const x of [0, W - pw]) { bx(x, D - pw, 0, pw, pw, H, CHROME, { l: '#c2c8ce', r: '#9aa2aa' }); bx(x - .02, D - pw - .02, 0, pw + .04, pw + .04, .1, '#9aa2aa'); } }
  else for (const x of [0, W - pw]) box(x, D - pw, 0, pw, pw, H, s.post, s === ST.hall ? { l: (u, v) => ((u * 3 + v * 7) % 23 === 0 ? '#c8c2b4' : '#e8e2d6'), ol: false } : { ol: false });
  if (dTop < H) box(pw, D - .08, dTop, W - 2 * pw, .08, H - dTop, s === ST.hall ? s.panel : s.post, { ol: false });
  if (s === ST.hall) bx(0, D - pw - .02, H, W, pw + .02, .06, BRASS);
  if (s === ST.sky) bx(0, D - pw, H, W, pw, .05, BRASS);
  const xa = pw + .02, xb = W - pw - .02;
  if (occ) {   // shut: the door, its lock showing red, feet under it where there is a gap
    if (z0 > .1) for (const sx of [.4, .62]) { box(sx, D - .16, 0, .14, .16, .08, '#3a2f2a', { ol: false }); lw([sx, D - .002, .03], [sx + .14, D - .002, .03], '#5a4a40'); }
    panelFace(s, xa, xb, D - .02, z0 + .02, dTop - .02, s.door2); frameY(xa, xb, D - .02, z0 + .02, dTop - .02, dk(s.door2, .45));
    lw([xb - .1, D - .02, 1.0], [xb - .1, D - .02, 1.14], s.m); qy(xb - .3, xb - .14, D - .03, 1.2, 1.27, '#c8233a');
    if (s === ST.diner) heartY(xa + .3, D - .025, 1.4, '#c8233a');
    if (s.deco) decoY(s, p, xa, xb, D - .025);
  } else { qy(xb + .005, xb + .07, D - .005, 1.2, 1.28, '#3fa05a');   // vacant
    if (s.deco === 'noren') { const c = p.c3 || '#2c3a6a'; for (let i = 0; i < 3; i++) { const a = xa + i * (xb - xa) / 3 + .01, b = a + (xb - xa) / 3 - .03; qy(a, b, D + .01, 1.45, 1.95, c); } lw([xa, D + .01, 1.96], [xb, D + .01, 1.96], '#8a6a44'); dot((xa + xb) / 2, D + .02, 1.75, '#f4f0e8'); } }
  if (s === ST.sky) lit(() => { dot(W - pw / 2, D, 1.5, occ ? '#ff5a5a' : '#7df0a0'); dot(W - pw / 2, D, 1.53, occ ? '#ff8a8a' : '#b8ffcc'); });
}

/* ---------- basins ---------- */
function vanity(p) {
  const hall = p.style === 'hall', W = p.w || (hall ? 4.2 : 2.6), n = p.n || (hall ? 3 : 2), D = hall ? .62 : .56;
  shadow(0, W, 0, D + .08);
  if (hall) {
    box(0, 0, 0, W, D - .06, .8, '#2f5f4f', { t: '#2f5f4f' }); bx(0, D - .06, 0, W, .02, .08, BRASS);
    for (let i = 0; i < n * 2; i++) { const x0 = .12 + i * (W - .24) / (n * 2), x1 = x0 + (W - .24) / (n * 2) - .06; frameY(x0, x1, D - .06, .16, .7, '#244a3d'); lw([x0 + .02, D - .06, .68], [x1 - .02, D - .06, .68], '#4a7f6c'); }
    box(-.04, -.02, .8, W + .08, D + .04, .09, '#ece6da', { t: (x, y) => (Math.abs(((x * 1.7 + y * 3.1) % 1.1) - .55) < .02 ? '#c9c2b6' : hash2(Math.floor(x * 16), Math.floor(y * 16), 3) < .05 ? '#ddd6c9' : '#f1ece2'), l: '#ddd6ca' });
    for (let i = 0; i < n; i++) { const cx = (i + .5) * W / n; blob(cx, .32, .895, 6, 2.6, '#c9c2b6'); blob(cx, .33, .895, 5, 2, '#d8e8ee'); dot(cx, .34, .895, '#8e979d');
      lw([cx, .08, .89], [cx, .08, 1.18], BRASS); lw([cx, .08, 1.18], [cx, .2, 1.16], BRASS); lw([cx, .2, 1.16], [cx, .22, 1.08], BRASS); for (const dx of [-.16, .16]) { lw([cx + dx, .1, .89], [cx + dx, .1, .98], BRASS); lw([cx + dx - .04, .1, .98], [cx + dx + .04, .1, .98], '#e8d49a'); dot(cx + dx, .1, 1.0, dx < 0 ? '#c8574d' : '#4f74b8'); } }
    // linen towels on a brass tray + soap
    bx(W - .5, .1, .89, .42, .3, .02, BRASS); for (let k = 0; k < 4; k++) box(W - .46, .12, .91 + k * .045, .34, .24, .04, k % 2 ? '#f8f5ee' : '#efe9dc', { ol: false }); lw([W - .46, .36, .99], [W - .12, .36, .99], '#7a2030');
    cyl(.24, .3, .89, .07, .03, '#e8d49a', { ol: false }); bx(.2, .28, .92, .08, .05, .03, '#f2d7a8');
  } else {
    glow(() => qz(.1, W - .1, .1, D - .06, .005, '#ffd89040'));
    box(0, 0, .74, W, D, .1, '#2b2d33', { t: (x, y) => (Math.abs(((x * 2.3 - y * 1.3) % 1.3) - .65) < .015 ? '#4a4d55' : '#33363d'), l: '#24262b' });
    glow(() => qy(.06, W - .06, D, .7, .74, '#ffe2a0'));
    lw([.1, D + .02, .5], [W - .1, D + .02, .5], BRASS);   // towel bar under the slab
    for (let i = 0; i < n; i++) { const cx = .55 + i * .95; cyl(cx, .3, .84, .17, .11, '#f4f1ea', { t: '#d9d5cb' }); blob(cx, .3, .95, 3, 1.4, '#c4dfe8');
      lw([cx, .06, .84], [cx, .06, 1.26], BRASS); lw([cx + .01, .06, .84], [cx + .01, .06, 1.26], dk(BRASS, .3)); lw([cx, .06, 1.26], [cx, .24, 1.22], BRASS); dot(cx + .12, .06, 1.0, BRASS); }
    // rolled towels in a basket
    const bxx = W - .62; box(bxx, .14, .84, .46, .32, .12, '#b08a5a', { t: '#7a5a3a' }); for (let k = 0; k < 3; k++) { cyl(bxx + .1 + k * .13, .3, .9, .06, .08, '#f8f5ee', { ol: false, t: '#e6e0d4' }); } for (let k = 0; k < 2; k++) cyl(bxx + .16 + k * .13, .26, .97, .06, .07, '#f8f5ee', { ol: false, t: '#e6e0d4' });
    // orchid
    const ox = .16; cyl(ox, .16, .84, .07, .14, '#f4f1ea', { ol: false }); blob(ox, .16, .99, 3, 1, '#4f7a3a'); lw([ox, .16, .98], [ox, .16, 1.38], '#4f6a3a'); lw([ox, .16, 1.38], [ox + .18, .2, 1.32], '#4f6a3a');
    for (const [dx, dz] of [[0, .4], [.08, .38], [.15, .34], [.19, .3]]) { blob(ox + dx, .17, .98 + dz, 2, 1.5, '#f4eef6'); dot(ox + dx, .17, .98 + dz, '#d86aa8'); }
  }
}
function dinerSink() {
  // mirror (with a crack) + little glass shelf
  qy(.14, .66, .02, 1.12, 1.66, '#bcd9e4', '#c9e3ec'); frameY(.14, .66, .02, 1.12, 1.66, CHROME); frameY(.13, .67, .02, 1.11, 1.67, '#8a9098');
  lw([.2, .03, 1.62], [.28, .03, 1.5], '#eef8fb'); lw([.24, .03, 1.62], [.3, .03, 1.54], '#eef8fb'); lw([.56, .03, 1.66], [.5, .03, 1.5], '#7a8a94'); lw([.5, .03, 1.5], [.54, .03, 1.38], '#7a8a94');
  bx(.12, 0, 1.04, .56, .12, .02, '#cfe6ee'); bx(.2, .02, 1.06, .06, .05, .12, '#e87aa0'); dot(.23, .04, 1.2, '#f4f1ea');
  // basin on chrome legs
  shadow(.04, .76, .1, .5);
  lw([.14, .4, 0], [.14, .4, .62], CHROME); lw([.66, .4, 0], [.66, .4, .62], CHROME); lw([.15, .4, 0], [.15, .4, .62], '#9aa2aa'); lw([.67, .4, 0], [.67, .4, .62], '#9aa2aa');
  box(.06, 0, .62, .68, .46, .2, PORC, { t: (x, y) => (Math.abs(x - .4) < .24 && y > .12 && y < .38 ? '#d9d5cb' : PORC) }); blob(.4, .26, .82, 3, 1.3, '#a8d8e8'); dot(.4, .28, .82, '#7a8a94');
  dot(.7, .46, .8, '#a8a294'); dot(.7, .46, .79, '#a8a294', -1, 0);   // the chip
  for (const [x, c] of [[.24, '#c8574d'], [.56, '#4f74b8']]) { lw([x, .08, .82], [x, .08, .92], CHROME); lw([x - .05, .08, .92], [x + .05, .08, .92], CHROME); dot(x, .08, .94, c); }
  lw([.4, .06, .82], [.4, .06, .9], CHROME); lw([.4, .06, .9], [.4, .16, .88], CHROME);
  // pink soap bottle on the basin
  cyl(.62, .2, .82, .04, .1, '#f2a8c0', { ol: false }); lw([.62, .2, .92], [.62, .2, .98], '#f4f1ea'); lw([.62, .2, .98], [.62, .14, .98], '#f4f1ea');
}

/* ---------- walls: mirrors, dryer, lights, signs, doors ---------- */
function mirror(p) {
  if (p.style === 'hall') {
    const fr = BRASS, y = .04, p0 = [[.06, y, 0], [.84, y, 0], [.84, y, .95], [.76, y, 1.12], [.6, y, 1.24], [.45, y, 1.27], [.3, y, 1.24], [.14, y, 1.12], [.06, y, .95]];
    fq(p0.map(q => [q[0] - .06 + (q[0] < .45 ? 0 : .12), q[1], q[2] - .04 + (q[2] > .5 ? .08 : 0)]), dk(fr, .45)); fq(p0.map(q => [q[0] - .03 + (q[0] < .45 ? 0 : .06), q[1], q[2] - .02 + (q[2] > .5 ? .04 : 0)]), fr);
    fq(p0, '#b8d4de', '#c4dde6'); lw([.2, y, .9], [.42, y, .4], '#e6f4f8'); lw([.28, y, .95], [.46, y, .55], '#e6f4f8');
    dot(.45, y, 1.31, lt(fr, .3)); dot(.45, y, 1.34, fr);
  } else {
    glow(() => discY(.4, .03, .4, .44, '#ffe0a0')); lit(() => discY(.4, .035, .4, .42, '#f0d8a0'));
    discY(.4, .04, .4, .38, '#9fb6c2', '#a9c0cc'); lw([.24, .045, .56], [.38, .045, .3], '#d6e8ee'); lw([.3, .045, .6], [.42, .045, .38], '#d6e8ee');
  }
}
function dryer() {
  box(.1, 0, .1, .5, .22, .36, CHROME, { l: (u, v) => (u % 9 === 0 ? '#c2c8ce' : '#dde2e6'), r: '#aab2ba' }); cyl(.35, .16, .02, .06, .1, '#aab2ba', { ol: false });
  qy(.16, .54, .22, .3, .36, '#2a2733'); lw([.2, .221, .33], [.32, .221, .33], '#f4f1ea'); lw([.36, .221, .33], [.5, .221, .33], '#f4f1ea'); dot(.35, .22, .2, '#c8233a'); dot(.35, .22, .2, '#c8233a', 1, 0); dot(.35, .22, .2, '#8a1a2a', 0, 1);
}
function pendant() {
  lw([.2, .2, .4], [.2, .2, 1.6], BRASS);
  ball(.2, .2, .2, .2, '#c89a58', { ol: true }); blob(.2, .2, .26, 2, 1.5, '#f2d8a0'); cyl(.2, .2, .36, .07, .06, BRASS, { ol: false }); glow(() => { blob(.2, .2, .2, 3, 3, '#ffd890'); blob(.2, .2, .18, 2, 2, '#fff2c8'); }); lit(() => dot(.2, .2, .14, '#e8b860'));
}
function tube() {
  box(0, 0, 0, 1.2, .16, .12, '#e8e4dc', { ol: false }); lit(() => { qy(.06, 1.14, .16, .02, .09, '#f4fbff'); lw([.1, .17, .05], [1.1, .17, .05], '#ffffff'); }); glow(() => qy(.04, 1.16, .17, -.06, .14, '#e8f6ff60'));
  lw([.02, .16, 0], [1.18, .16, 0], '#b8b4aa'); dot(.9, .17, .05, '#9ab0c0');   // one end a bit grey: it flickers, Dot knows
}
function sign(p) {
  const k = p.kind || 'wash';
  if (k === 'wash') { qy(0, 1.5, .02, .1, .92, '#f8f5ee'); frameY(0, 1.5, .02, .1, .92, '#2a2733'); label('WASH', 0, 1.5, .02, .8, '#c8233a'); label('HANDS', 0, 1.5, .02, .44, '#c8233a'); dot(.08, .02, .86, '#8a9098'); dot(1.42, .02, .86, '#8a9098'); }
  else if (k === 'level') { lit(() => label('LEVEL 52', 0, 2, .02, .32, BRASS)); lw([0, .02, .04], [2, .02, .04], dk(BRASS, .2)); }
  else if (k === 'quiet') { qy(0, 1.6, .02, .1, .56, '#2f4a3a'); frameY(0, 1.6, .02, .1, .56, BRASS); label('QUIET', 0, 1.6, .02, .46, '#e9e0cc'); }
  else if (k === 'toilets') { qy(0, 2.2, .02, .1, .58, '#2f5a46'); frameY(0, 2.2, .02, .1, .58, '#f4f0e8'); label('TOILETS', 0, 2.2, .02, .48, '#f4f0e8'); }
  else if (k === 'otters') { qy(0, 2.2, .02, .1, .6, '#d2392f'); qy(0, 2.2, .02, .1, .18, '#f4f0e8'); label('OTTERS', 0, 2.2, .02, .52, '#f4f0e8'); }
  else { box(0, 0, 0, 2.3, .05, 1.2, BRASS, { ol: true }); qy(.08, 2.22, .05, .08, 1.12, '#b88f48'); label('PUBLIC', 0, 2.3, .05, .98, '#3a2a14'); label('WASHROOM', 0, 2.3, .05, .56, '#3a2a14'); lw([.3, .05, .62], [2.0, .05, .62], '#8a6a34'); for (const [x, z] of [[.14, .14], [2.16, .14], [.14, 1.06], [2.16, 1.06]]) dot(x, .05, z, '#f2dca0'); }
}
const DOORS = { pizza: ['#3f8a55', '#f4f0e8', CHROME, 'WC'], bakery: ['#a8c8d8', '#f0e0c0', '#c2c8cc', 'WC'], aqua: ['#1f7a8a', '#c9a35a', BRASS, 'WC'], nook: ['#7a5a3a', '#3a3036', '#c2c8cc', 'WC'], service: ['#8e979d', '#5e666c', '#c2c8cc', 'WC'], library: ['#6a4a30', '#e9e0cc', BRASS, 'WC'], museum: ['#f4f2ee', '#2a2a2e', '#2a2a2e', 'WC'], gym: ['#e2572e', '#3a3f4c', '#c2c8cc', 'WC'], bar: ['#2a2430', '#1e1a22', '#8a8f98', 'WC'] };
function door(p) {
  const sky = p.style === 'sky', c = sky ? '#4a3326' : '#c8233a', D2 = p.c ? [p.c].concat((DOORS[p.style] || DOORS.nook).slice(1)) : DOORS[p.style];   // p.c: a branch's own door colour (post offices)
  if (D2) {   // batch 2 doors: [leaf, frame, metal, plate text]
    const [lc, fc, m, t] = D2; qy(-.06, 1.06, .02, 0, 2.12, fc); qy(.03, .97, .05, 0, 2.04, lc); frameY(.03, .97, .05, 0, 2.04, dk(lc, .4));
    if (p.style === 'library') { frameY(.14, .86, .055, .2, .95, dk(lc, .3)); frameY(.14, .86, .055, 1.08, 1.9, dk(lc, .3)); dot(.82, .06, 1.0, BRASS); dot(.82, .06, 1.0, BRASS, 1, 0); qy(.3, .7, .06, 1.42, 1.62, BRASS); label(t, .3, .7, .06, 1.6, '#3a2a14'); }
    else if (p.style === 'museum') { lw([.86, .06, .9], [.86, .06, 1.3], m); label(t, .3, .7, .06, 1.62, m); lw([.3, .06, 1.24], [.7, .06, 1.24], '#c9c4ba'); }
    else if (p.style === 'gym') { qy(.03, .97, .055, .02, .22, '#3a3f4c'); lw([.12, .06, 1.1], [.5, .06, 1.1], m); qy(.3, .7, .06, 1.5, 1.74, '#f4f0e8'); label(t, .3, .7, .06, 1.7, '#3a3f4c'); }
    else if (p.style === 'bar') { for (let i = 0; i < 9; i++) { const x = .1 + (i * 37 % 80) / 100, z = .3 + (i * 53 % 150) / 100; qy(x, x + .12, .055, z, z + .1, STICK[i % STICK.length]); } lit(() => label(t, .3, .7, .06, 1.98, '#ff4a8a')); glow(() => qy(.25, .75, .07, 1.8, 2.04, '#ff4a8a40')); lw([.8, .06, .95], [.8, .06, 1.2], m); }
    else { const sv = p.style === 'service'; qy(.08, .92, .055, .02, .24, m); qy(.74, .9, .06, .95, 1.3, m); qy(.26, .74, .06, 1.4, 1.8, sv ? '#3a5a8a' : fc); label(t, .26, .74, .06, 1.72, sv ? '#f4f0e8' : lc); if (p.style === 'aqua') { discY(.5, .056, 1.05, .16, BRASS); discY(.5, .057, 1.05, .12, '#3ab0d0'); } }   // service: steel kick + push plate, blue WC plate
    return;
  }
  if (sky) {
    qy(-.06, 1.06, .02, 0, 2.36, '#26272c'); qy(.02, .98, .05, 0, 2.28, c); for (let x = .1; x < .95; x += .11) lw([x, .05, .04], [x, .05, 2.24], dk(c, .14));
    lw([.82, .06, .8], [.82, .06, 1.5], BRASS); lw([.83, .06, .8], [.83, .06, 1.5], dk(BRASS, .3));
    qy(.24, .7, .06, 1.38, 1.62, '#26272c'); lit(() => label('WC', .24, .7, .06, 1.58, BRASS));
    glow(() => qz(-.1, 1.1, .1, .5, .005, '#ffd89030'));
  } else {
    qy(-.06, 1.06, .02, 0, 2.08, CHROME); qy(.02, .98, .05, 0, 2.02, c); frameY(.02, .98, .05, 0, 2.02, dk(c, .45));
    discY(.5, .055, 1.5, .2, '#8a9098'); discY(.5, .06, 1.5, .16, '#d8eef4', '#c4e0ea'); lw([.42, .065, 1.56], [.5, .065, 1.44], '#f4fbff');
    qy(.06, .94, .06, .02, .2, '#d5dbe0'); qy(.72, .86, .06, 1.0, 1.24, '#d5dbe0'); lw([.74, .065, 1.12], [.84, .065, 1.12], '#9aa2aa');
    qy(.2, .8, .06, 2.1, 2.5, '#3f9a94'); lit(() => label('WC', .2, .8, .06, 2.4, '#f8f5ee')); lw([.2, .06, 2.1], [.8, .06, 2.1], '#2a6a64');   // enamel plaque over the door
  }
}

/* ---------- floors ---------- */
// a maple leaf (the city's seal) for the City Hall floor medallion: point-in-polygon in medallion units (leaf points toward -y = up-right on screen)
const LEAF = [[0, 1], [.11, .78], [.26, .86], [.2, .42], [.45, .68], [.5, .56], [.74, .62], [.66, .34], [.8, .28], [.48, .02], [.52, -.1], [.06, -.04], [.06, -.5], [-.06, -.5], [-.06, -.04], [-.52, -.1], [-.48, .02], [-.8, .28], [-.66, .34], [-.74, .62], [-.5, .56], [-.45, .68], [-.2, .42], [-.26, .86], [-.11, .78]].map(([u, v]) => [u, v - .25]);
/** is floor point (x, y) (medallion units, centred) inside the leaf? The leaf's stem points to the room's front corner, its tip to the back corner (screen up) */
function inLeaf(x, y) { const u = (x - y) / Math.SQRT2, v = -(x + y) / Math.SQRT2; let c = false; for (let i = 0, j = LEAF.length - 1; i < LEAF.length; j = i++) { const [xi, yi] = LEAF[i], [xj, yj] = LEAF[j]; if ((yi > v) !== (yj > v) && u < (xj - xi) * (v - yi) / (yj - yi) + xi) c = !c; } return c; }

function floorPat(p) {
  const st = p.style || 'diner', w = p.w || 5, d = p.d || 4;
  if (st === 'sky') return (x, y) => { const fx = x - Math.floor(x), fy = y - Math.floor(y); if (fx < .04 || fy < .04) return '#202228'; if ((Math.abs(x - .55) < .02 || Math.abs(y - .55) < .02) && x > .5 && y > .5 && x < w - .5 && y < d - .5 && (Math.abs(x - .55) < .02 ? true : true)) return '#a88a4a'; const k = (Math.floor(x) + Math.floor(y)) % 2; const v = hash2(Math.floor(x * 9), Math.floor(y * 9), 5); return v < .06 ? '#41444c' : k ? '#35383f' : '#30333a'; };
  if (st === 'hall') return (x, y) => {
    const e = Math.min(x, y, w - x, d - y); if (e < .32) return e < .05 || (e > .26 && e < .32) ? '#a88a4a' : '#2f5f4f';
    const cx = x - w / 2, cy = y - d / 2, r = Math.hypot(cx, cy * 1.0), a = Math.atan2(cy, cx);
    if (r < 1.6) { if (r > 1.5) return '#a88a4a'; if (r > 1.44) return '#f4ead0'; if (r > 1.38) return '#a88a4a'; return inLeaf(cx / 1.3, cy / 1.3) ? (inLeaf(cx / 1.18, cy / 1.18) ? '#d8b45e' : '#8a6a2a') : '#2f5f4f'; }
    const u = x + y, v = x - y, fu = u - Math.round(u), fv = v - Math.round(v); if (Math.abs(fu) + Math.abs(fv) < .2 && (Math.round(u) + Math.round(v)) % 2 === 0) return '#2a2a30';
    if (Math.abs(fu) < .025 || Math.abs(fv) < .025) return '#d4cdbf';
    const n = hash2(Math.floor(x * 5), Math.floor(y * 5), 9); return Math.abs(Math.sin(x * 3.1 + y * 1.7 + n * 2)) < .04 ? '#cfc8ba' : '#ece7dc';
  };
  return (x, y) => { const s = .25, i = Math.floor(x / s), j = Math.floor(y / s), fx = x / s - i, fy = y / s - j; if (fx < .14 || fy < .14) return '#c9c4b8'; const a = ((i % 4) + 4) % 4, b = ((j % 4) + 4) % 4; return (a === 1 && b === 1) || (a === 3 && b === 3) ? '#2a2733' : (hash2(i, j, 2) < .04 ? '#e2dccf' : '#f2efe6'); };   // penny tile with black dots
}
function floor(p) { const w = p.w || 5, d = p.d || 4; qz(0, w, 0, d, .005, floorPat(p)); }

/* ---------- small story pieces ---------- */
function mints() { cyl(.15, .15, 0, .13, .03, '#c2c8ce', { ol: false, t: '#e6eaee' }); for (const [x, y, c] of [[.1, .12, '#f8f5ee'], [.18, .14, '#9ad8b0'], [.13, .19, '#f8f5ee'], [.2, .2, '#f8f5ee'], [.08, .2, '#9ad8b0']]) dot(x, y, .04, c); }
function bin(p) {
  if (p.style === 'sky') { cyl(.2, .2, 0, .17, .6, '#9aa0a8', { l: '#b0b6be', r: '#80868e' }); cyl(.2, .2, .6, .17, .04, '#26272c'); }
  else if (p.style === 'hall') { cyl(.2, .2, 0, .12, .08, dk(BRASS, .2), { ol: false }); cyl(.2, .2, .08, .17, .5, BRASS, { l: '#d8b46a', r: '#a8844a' }); cyl(.2, .2, .58, .18, .04, dk(BRASS, .25)); ball(.2, .2, .66, .07, BRASS); }
  else if (p.style === 'station') { cyl(.2, .2, 0, .17, .62, '#2f5a46', { l: '#3a6a54', r: '#244a3a' }); cyl(.2, .2, .62, .18, .05, '#b8943a'); qy(.1, .3, .37, .3, .42, '#f4f0e8'); }
  else if (p.style === 'mall' || p.style === 'museum') { const c = p.style === 'mall' ? '#e8e4f0' : '#2a2a2e'; cyl(.2, .2, 0, .15, .5, c, {}); cyl(.2, .2, .5, .16, .03, p.style === 'mall' ? CHROME : '#4a4a50'); }
  else if (p.style === 'library') { cyl(.2, .2, 0, .16, .42, '#b08a5a', {}); for (const z of [.1, .2, .3]) cyl(.2, .2, z, .165, .015, '#8a6a40', { ol: false }); }
  else if (p.style === 'bar' || p.style === 'service') { cyl(.2, .2, 0, .17, .55, '#8a9098', { l: '#9aa0a8', r: '#6a7078' }); lw([.06, .37, .3], [.12, .37, .38], '#5a6068'); if (p.style === 'bar') qy(.12, .24, .37, .2, .28, '#ff4a8a'); }
  else if (p.style === 'arena') { cyl(.2, .2, 0, .17, .6, '#d2392f', {}); cyl(.2, .2, .3, .175, .08, '#f4f0e8', { ol: false }); cyl(.2, .2, .6, .18, .04, '#3a3f4c'); }
  else if (p.style === 'gym') { box(0, .05, 0, .4, .32, .5, '#3a3f4c', { t: '#2a2e38' }); }
  else { cyl(.2, .2, 0, .16, .46, '#efe6cf', { l: '#f4ecd8', r: '#d6ccb4' }); cyl(.2, .2, .46, .17, .04, CHROME); bx(.12, .36, 0, .16, .06, .03, CHROME); dot(.3, .3, .26, '#c8bea6'); dot(.31, .3, .24, '#c8bea6'); }
}
function mop() {
  // yellow bucket + wringer + mop, and a wet-floor A-frame
  cyl(.25, .25, 0, .2, .3, '#f2c230', { l: '#f6d050', r: '#d8a820' }); blob(.25, .25, .3, 4, 2, '#8ab0b8'); box(.12, .2, .3, .26, .1, .12, '#e0a818');
  lw([.3, .26, .1], [.12, .24, 1.25], '#b08a5a'); lw([.31, .26, .1], [.13, .24, 1.25], '#8a6a44'); blob(.3, .26, .2, 3, 2, '#e6e0d0');
  fq([[.55, .3, 0], [.85, .3, 0], [.78, .3, .7], [.62, .3, .7]], '#f2c230'); fq([[.85, .3, 0], [.85, .05, 0], [.78, .1, .7], [.78, .3, .7]], '#d8a820');
  dot(.7, .3, .45, INK); dot(.7, .3, .4, INK); dot(.7, .3, .32, INK); dot(.7, .3, .24, INK, 0, 0);
}
function suggest() {
  lw([.25, .2, 0], [.25, .2, .82], BRASS); lw([.26, .2, 0], [.26, .2, .82], dk(BRASS, .3)); cyl(.25, .2, 0, .15, .03, dk(BRASS, .2), { ol: false });
  box(0, 0, .82, .5, .36, .34, '#8a5a34', { t: '#7a4e2d' }); qz(.12, .38, .14, .2, 1.161, '#2a1f18'); lw([.04, .36, 1.1], [.46, .36, 1.1], BRASS); qy(.16, .34, .36, .88, 1.0, '#f4ead0'); label('?', .16, .34, .36, 1.0, '#7a2030');
  bx(.36, .08, 1.16, .1, .12, .02, '#f8f5ee'); lw([.36, .16, 1.18], [.18, .3, .95], '#c8bea6');
}

const S3 = ['sky', 'diner', 'hall'];
export default [
  F('wc.stall', ['wc', 'wcstall', 'restroom'], stSize, stall, { use: p => ({ x: (ST[p.style] || ST.diner).w / 2, y: (ST[p.style] || ST.diner).d + .4 }), seatsFor: p => { const s = ST[p.style] || ST.diner; return [{ x: s.t + .5, y: s.d * .45, z: .42, dir: 0 }]; },
    variants: [{ style: 'sky', left: true }, { style: 'sky', occ: 1 }, { style: 'diner', tag: 1 }, { style: 'diner', occ: 1 }, { style: 'hall', left: true }, { style: 'hall', occ: 1 }].concat(['service', 'station', 'mall', 'library', 'museum', 'gym', 'bar', 'arena', 'deco', 'cafe', 'ramen', 'pizza', 'bakery', 'aqua', 'pool', 'uni', 'cinema', 'fish', 'obs', 'nook'].flatMap(style => [{ style, left: true }, { style, occ: 1, n: 2 }])) }),
  F('wc.vanity', ['wc', 'sink'], p => [p.w || (p.style === 'hall' ? 4.2 : 2.6), p.style === 'hall' ? .62 : .56, .9], vanity, { vb: p => [-.3, -.3, 0, (p.w || (p.style === 'hall' ? 4.2 : 2.6)) + .3, .9, 1.6], use: p => ({ x: (p.w || (p.style === 'hall' ? 4.2 : 2.6)) / 2, y: 1.0 }), light: { x: 1, y: .8, z: 0, r: 1.6 }, variants: [{ style: 'sky' }, { style: 'hall' }] }),
  F('wc.sink', ['wc', 'sink'], [.8, .5, .85], dinerSink, { vb: [-.3, -.3, 0, 1.1, .8, 1.8], use: { x: .4, y: .9 }, variants: [{ style: 'diner' }] }),
  F('wc.mirror', ['wc', 'mirror', 'decor'], p => (p.style === 'hall' ? [.9, .08, 1.4] : [.85, .08, .85]), mirror, { wall: true, mount: 1.2, solid: false, light: { x: .4, y: .5, z: 0, r: 1.2 }, variants: [{ style: 'sky' }, { style: 'hall' }] }),
  F('wc.dryer', ['wc', 'decor'], [.7, .25, .5], dryer, { wall: true, mount: 1.0, solid: false, variants: [{}] }),
  F('wc.pendant', ['wc', 'lamp', 'overhead'], [.4, .4, 1.6], pendant, { solid: false, overhead: true, vb: [-.1, -.1, 0, .5, .5, 1.7], light: { x: .2, y: .2, z: 0, r: 2.4 }, variants: [{}] }),
  F('wc.tube', ['wc', 'lamp'], [1.2, .2, .16], tube, { wall: true, mount: 2.1, solid: false, vb: [-.1, -.1, -.2, 1.3, .3, .3], light: { x: .6, y: 1.2, z: 0, r: 2.6 }, variants: [{}] }),
  F('wc.sign', ['wc', 'sign', 'decor'], p => (p.kind === 'civic' ? [2.3, .06, 1.2] : p.kind === 'level' ? [2, .04, .4] : p.kind === 'quiet' ? [1.6, .04, .6] : p.kind === 'toilets' || p.kind === 'otters' ? [2.2, .04, .62] : [1.5, .04, .95]), sign, { wall: true, mount: 1.5, solid: false, variants: [{ kind: 'wash' }, { kind: 'level' }, { kind: 'civic' }, { kind: 'quiet' }, { kind: 'toilets' }, { kind: 'otters' }] }),
  F('wc.door', ['wc', 'door'], p => [1, .1, p.style === 'sky' ? 2.4 : 2.4], door, { wall: true, mount: 0, solid: false, vb: [-.2, -.2, 0, 1.2, .5, 2.7], variants: ['sky', 'diner', 'service', 'library', 'museum', 'gym', 'bar', 'pizza', 'bakery', 'aqua', 'nook'].map(style => ({ style })) }),
  F('wc.floor', ['wc', 'floor'], p => [p.w || 5, p.d || 4, .01], floor, { solid: false, flat: true, variants: S3.map(style => ({ style, w: 5, d: 4 })) }),
  F('wc.mints', ['wc', 'wcmints'], [.3, .3, .06], mints, { solid: false, variants: [{}] }),
  F('wc.bin', ['wc', 'bin'], [.4, .4, .72], bin, { variants: S3.concat(['station', 'mall', 'museum', 'library', 'bar', 'arena', 'gym']).map(style => ({ style })) }),
  F('wc.mop', ['wc', 'decor'], [.9, .5, 1.3], mop, { variants: [{}] }),
  F('wc.suggest', ['wc', 'wcsuggest'], [.5, .4, 1.2], suggest, { use: { x: .25, y: .8 }, variants: [{}] }),
];
