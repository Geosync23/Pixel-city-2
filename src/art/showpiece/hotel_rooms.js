// The Grand Maple Hotel — dining, rooftop, ballroom, spa and guest-room pieces. ids furn.hotel.* (lobby pieces: hotel.js; helpers: _hotel_lib.js)
//   dtable {n 2-8, r, c, cc, centre: candle|flowers|candelabra|tea|none, serve: [hex|0 per seat]} round clothed table with chairs   bstation {k} buffet station (eggs bacon pastry fruit pancakes juice coffee salmon benedict mimosa)
//   pass (wall) kitchen doors   barcounter {w}   backbar {w, name}   heater {on}   stringlights {w} (hang with z)   bass   drums   planter {w, lights}   drape {w, c, text} (wall)   cake {cut}   auction   guestbook
//   arch (walk-through)   lounger {c}   sauna {part: back|side|front|glass}   massage   swimmer {skin, hair, frame, soak} (entity sprite)   roomdoor {no, dnd, tray, mine} (wall)   hkcart   bed {tier 0-2}
//   minibar   wdesk (writing desk + telephone)   closet (robes)   tray {dome, c}   bathwall {w, d}   luggage   mic   poolrail
import { R, box, qy, qx, qz, fq, lw, cyl, ball, dk, lt, lit, glow, hash2, MARBLE, MARBLE_D, BRASS, BRASS_D, BRASS_L, BURG, RED, WALNUT, WALNUT_D, WALNUT_L, NAVY, GREEN, CREAM, LINEN, INK, GLASS, CEDAR, TILE, WATER, WATER_L, WARM,
  marble, S2, dot, railX, railY, bloom, fronds, bottles, candle, arcY } from './_hotel_lib.js';
const { signY, textY, PAT, rng } = R;
const STEEL = '#c8ccd4', STEEL_D = '#8a909c';

const chairAt = (x, y, dir, c) => { const s = .42, a = x - s / 2, b = y - s / 2, lc = dk(c, .5), back = () => { if (dir === 1) box(a, b, .44, s, .07, .55, c, { ol: false }); else if (dir === 0) box(a, b, .44, .07, s, .55, c, { ol: false }); else if (dir === 3) box(a, b + s - .07, .44, s, .07, .55, c, { ol: false }); else box(a + s - .07, b, .44, .07, s, .55, c, { ol: false }); };
  for (const [px, py] of [[a + .03, b + .03], [a + s - .03, b + .03], [a + .03, b + s - .03], [a + s - .03, b + s - .03]]) lw([px, py, 0], [px, py, .4], lc); if (dir < 2) back(); box(a, b, .36, s, s, .09, lt(c, .1), { ol: false }); if (dir >= 2) back(); };
const tableGeo = p => { const n = p.n || 2, r = p.r || (n > 4 ? 1.05 : .72), S = 2 * (r + .62), seats = []; for (let i = 0; i < n; i++) { const a = n === 2 ? Math.PI * (1 - i) : i * 6.283 / n + (n === 4 ? 0 : Math.PI / n), x = S / 2 + Math.cos(a) * (r + .3), y = S / 2 + Math.sin(a) * (r + .3), q = ((Math.round(a / 1.5708) % 4) + 4) % 4; seats.push({ x, y, z: .45, dir: [2, 3, 0, 1][q], a }); } return { n, r, S, seats }; };
function dtable(p) {
  const g = tableGeo(p), c = p.c || LINEN, cc = p.cc || BURG, cx = g.S / 2, cy = g.S / 2, sv = p.serve || [];
  g.seats.forEach(s => { if (s.x + s.y < cx + cy) chairAt(s.x, s.y, s.dir, cc); });
  cyl(cx, cy, 0, g.r * .96, .5, dk(c, .1), { ol: false, l: dk(c, .12), r: dk(c, .26) }); cyl(cx, cy, .5, g.r, .26, c, { l: dk(c, .06), r: dk(c, .2) });
  g.seats.forEach((s, i) => { const x = cx + Math.cos(s.a) * (g.r - .26), y = cy + Math.sin(s.a) * (g.r - .26); cyl(x, y, .76, .15, .012, '#ffffff', { ol: false }); if (sv[i]) { cyl(x, y, .775, .09, .03, sv[i], { ol: false }); dot(x, y, .83, lt(sv[i], .4)); } const gx = cx + Math.cos(s.a + .5) * (g.r - .2), gy = cy + Math.sin(s.a + .5) * (g.r - .2); lw([gx, gy, .76], [gx, gy, .9], '#d8ecf2'); dot(gx, gy, .92, '#eaf6fb'); });
  const k = p.centre === undefined ? 'candle' : p.centre;
  if (k === 'candle') { cyl(cx, cy, .76, .06, .03, BRASS, { ol: false }); candle(cx, cy, .79, .14); }
  else if (k === 'flowers') { cyl(cx, cy, .76, .08, .14, '#f4f0e8', { ol: false }); bloom(cx, cy, 1.08, .24, p.fc || ['#f8f4ea', '#f2a7c3', '#8fb89a'], p.seed || 2, 7); }
  else if (k === 'candelabra') { lw([cx, cy, .76], [cx, cy, 1.2], BRASS); lw([cx - .2, cy, 1.05], [cx + .2, cy, 1.05], BRASS); for (const dx of [-.2, 0, .2]) candle(cx + dx, cy, dx ? 1.05 : 1.2, .12); cyl(cx, cy, .76, .1, .03, BRASS, { ol: false }); }
  else if (k === 'tea') { lw([cx, cy, .76], [cx, cy, 1.36], BRASS); [[.8, .26], [1, .2], [1.2, .14]].forEach(([z, rr], i) => { cyl(cx, cy, z, rr, .015, '#ffffff', { ol: false }); for (let j = 0; j < 5 - i; j++) { const a = j * 6.283 / (5 - i) + i; dot(cx + Math.cos(a) * rr * .6, cy + Math.sin(a) * rr * .6, z + .05, [['#f4e0b0', '#e8c890'], ['#e8b060', '#f8f0e0'], ['#f2a7c3', '#8a5030']][i][j % 2], 2); } }); dot(cx, cy, 1.4, BRASS_L, 2); }
  g.seats.forEach(s => { if (s.x + s.y >= cx + cy) chairAt(s.x, s.y, s.dir, cc); });
}
const BST = { eggs: '#f6d24a', bacon: '#a8442e', pancakes: '#d8a25a', benedict: '#f6e2a0', salmon: '#f08a6a' };
function bstation(p) {
  const k = p.k || 'eggs', W = 1.4, D = .9, z = .8;
  box(0, 0, 0, W, D, z, LINEN, { l: (u, v) => (u % 9 === 0 ? '#e0d8c8' : LINEN), r: dk(LINEN, .16) }); qy(0, W, D, 0, .06, dk(LINEN, .3));
  if (k === 'closed') { cyl(.7, .45, z, .09, .16, '#f4f0e8', { ol: false }); bloom(.7, .45, z + .4, .22, ['#f8f4ea', '#f2a7c3', '#8fb89a'], 3, 6); for (const x of [.25, 1.15]) { cyl(x, .45, z, .15, .012, '#ffffff', { ol: false }); cyl(x, .45, z + .012, .12, .012, '#ffffff', { ol: false }); } return; }
  if (BST[k]) { const c = BST[k]; for (const x of [.25, 1.15]) lw([x, .45, z], [x, .45, z + .14], STEEL_D); lit(() => dot(.7, .5, z + .05, '#6ab0ff')); fq([[.15, .1, z + .34], [1.25, .1, z + .34], [1.25, .1, z + .85], [.15, .1, z + .85]], STEEL, lt(STEEL, .3)); lw([.15, .1, z + .85], [1.25, .1, z + .85], lt(STEEL, .5)); box(.15, .12, z + .12, 1.1, .62, .2, STEEL, { t: c, t2: k === 'pancakes' ? '#b8742e' : k === 'benedict' ? '#f6d24a' : k === 'bacon' ? '#c8644a' : lt(c, .2) }); if (k === 'salmon') { for (let i = 0; i < 4; i++) dot(.35 + i * .25, .45, z + .34, '#5a8a4a'); } }
  else if (k === 'pastry') { lw([.7, .45, z], [.7, .45, z + .8], BRASS); [[.08, .5], [.36, .36], [.62, .22]].forEach(([dz, rr], i) => { cyl(.7, .45, z + dz, rr, .02, '#ffffff', { ol: false }); for (let j = 0; j < 7 - i * 2; j++) { const a = j * 6.283 / (7 - i * 2) + i; ball(.7 + Math.cos(a) * rr * .62, .45 + Math.sin(a) * rr * .62, z + dz + .08, .075, j % 2 ? '#d6924a' : '#e8b060', { ol: false }); } }); }
  else if (k === 'fruit') { cyl(.7, .45, z, .14, .08, '#d8ecf2', { ol: false }); cyl(.7, .45, z + .08, .42, .16, '#d8ecf2', { ol: false, t: '#eaf6fb' }); const cs = ['#e8483a', '#f6d24a', '#f08a2c', '#5fb84f', '#8a5cc2', '#f28fb0']; const rr = rng(5); for (let i = 0; i < 14; i++) { const a = rr() * 6.283, d = rr() * .32; ball(.7 + Math.cos(a) * d, .45 + Math.sin(a) * d * .7, z + .28 + rr() * .1, .07, cs[i % 6], { ol: false }); } }
  else if (k === 'juice') { [['#f08a2c', .4], ['#f28fb0', 1]].forEach(([c, x]) => { cyl(x, .4, z, .12, .14, STEEL_D, { ol: false }); cyl(x, .4, z + .14, .2, .5, c, { l: c, r: dk(c, .15), t: lt(c, .3) }); cyl(x, .4, z + .64, .21, .05, STEEL, { ol: false }); lw([x, .62, z + .2], [x, .68, z + .14], STEEL_D); }); for (let i = 0; i < 4; i++) { lw([.55 + i * .1, .75, z], [.55 + i * .1, .75, z + .14], '#d8ecf2'); } }
  else if (k === 'coffee') { cyl(.45, .4, z, .22, .58, STEEL, { t: STEEL_D }); cyl(.45, .4, z + .58, .1, .1, INK, { ol: false }); lw([.45, .64, z + .16], [.45, .7, z + .1], INK); lit(() => dot(.45, .63, z + .3, '#ff6a3a')); for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) cyl(.95 + i * .13, .3 + j * .14, z, .05, .09, '#ffffff', { ol: false }); }
  else { box(.2, .2, z, 1, .5, .03, STEEL, { ol: false }); for (let j = 0; j < 2; j++) for (let i = 0; i < 5; i++) { const x = .32 + i * .19, y = .32 + j * .24; lw([x, y, z + .03], [x, y, z + .16], '#d8ecf2'); qy(x - .04, x + .04, y, z + .16, z + .36, '#f6b04a', 'glass'); dot(x, y, z + .37, '#fff0b0'); } }
  qy(W / 2 - .2, W / 2 + .2, D + .01, z - .3, z - .1, CREAM); lw([W / 2 - .14, D + .02, z - .2], [W / 2 + .14, D + .02, z - .2], INK);
}
function pass() {
  const y = .12; qy(0, 2.4, y, 0, 2.7, MARBLE_D); qy(.2, 2.2, y + .01, 0, 2.2, STEEL_D); for (const x0 of [.24, 1.22]) { qy(x0, x0 + .94, y + .02, 0, 2.16, STEEL); qy(x0, x0 + .94, y + .03, 0, .4, STEEL_D); const c = arcY(x0 + .47, y + .03, 1.5, .22, 0, 6.283, 12); fq(c, INK); lit(() => fq(arcY(x0 + .47, y + .04, 1.5, .18, 0, 6.283, 12), '#ffe9a0', '#fff4d0')); lw([x0 + .1, y + .03, 1.05], [x0 + .84, y + .03, 1.05], lt(STEEL, .4)); }
  lw([1.2, y + .03, 0], [1.2, y + .03, 2.16], INK); signY('KITCHEN', .3, 2.1, y + .01, 2.24, 2.66, INK, STEEL, { frame: false });
}
function barcounter(p) {
  const w = p.w || 6;
  box(0, 0, 0, w, 1, 1.05, WALNUT, { r: WALNUT_D }); qy(0, w, 1, 0, .12, INK);
  for (let x = .15; x < w - .5; x += .85) { qy(x, x + .7, 1.01, .28, .9, BURG, dk(BURG, .12)); for (const [dx, dz] of [[.18, .45], [.52, .45], [.35, .7], [.18, .75], [.52, .75]]) dot(x + dx, 1.02, dz, BRASS_L); }
  lw([0, 1.14, .2], [w, 1.14, .2], BRASS); lw([0, 1.14, .23], [w, 1.14, .23], BRASS_L); for (let x = .3; x < w; x += 1.2) lw([x, 1.02, .2], [x, 1.14, .2], BRASS_D);
  box(-.06, -.06, 1.05, w + .12, 1.14, .08, MARBLE, { l: marble(MARBLE_D, 8), r: MARBLE_D });
  // taps, shaker, coupes, garnish tray, a lamp
  box(w * .5 - .2, .2, 1.13, .4, .16, .3, BRASS, { ol: false }); for (const dx of [-.12, 0, .12]) { lw([w * .5 + dx, .36, 1.3], [w * .5 + dx, .46, 1.38], INK); }
  cyl(w * .28, .5, 1.13, .08, .26, STEEL, { ol: false }); cyl(w * .28, .5, 1.39, .06, .08, STEEL_D, { ol: false });
  for (let i = 0; i < 3; i++) { const x = w * .34 + i * .2; lw([x, .55, 1.13], [x, .55, 1.26], '#d8ecf2'); fq([[x - .08, .55, 1.36], [x + .08, .55, 1.36], [x, .55, 1.26]], ['#d8f0c8', '#f6b04a', '#e8546a'][i], 'glass'); lw([x - .08, .55, 1.36], [x + .08, .55, 1.36], '#eaf6fb'); }
  box(w * .7, .3, 1.13, .6, .3, .06, STEEL_D, { ol: false }); for (let i = 0; i < 4; i++) dot(w * .7 + .1 + i * .13, .45, 1.22, ['#f6d24a', '#5fb84f', '#e8483a', '#f08a2c'][i], 2);
  for (const x of [.35, w - .35]) { lw([x, .3, 1.13], [x, .3, 1.5], BRASS); lit(() => ball(x, .3, 1.56, .1, '#fff0b0', { ol: false })); }
}
function backbar(p) {
  const w = p.w || 6, H = 2.7, nm = p.name || 'THE WEATHERVANE', tw = Math.min(w - .3, (nm.length * 4 + 7) / 16);
  box(0, 0, 0, w, .5, H, WALNUT_D, { l: WALNUT }); qy(.12, w - .12, .5, .1, .9, WALNUT_L); for (let x = .2; x < w - .6; x += .9) { qy(x, x + .78, .51, .18, .82, WALNUT); dot(x + .39, .52, .5, BRASS_L); }
  lit(() => qy(.15, w - .15, .5, 1, 2.2, '#f6d68a', '#f0c070'));
  for (let s = 0; s < 3; s++) { const z = 1.02 + s * .4; qy(.15, w - .15, .51, z - .04, z, WALNUT_D); bottles(.2, w / 2 - .7, .52, z, s + 1); bottles(w / 2 + .7, w - .2, .52, z, s + 5); }
  qy(w / 2 - .62, w / 2 + .62, .51, 1, 2.2, '#9fc0c8', '#b8d4d8'); fq([[w / 2 - .5, .52, 1.3], [w / 2 - .3, .52, 1.3], [w / 2 + .1, .52, 2.1], [w / 2 - .1, .52, 2.1]], '#e0f0f2', 'glass'); for (const x of [w / 2 - .62, w / 2 + .62]) lw([x, .52, 1], [x, .52, 2.2], BRASS);
  signY(nm, w / 2 - tw / 2, w / 2 + tw / 2, .51, 2.24, 2.66, INK, BRASS_L, { lit: true, frame: false }); lw([.1, .51, 2.22], [w - .1, .51, 2.22], BRASS);
}
function heater(p) {
  cyl(.3, .3, 0, .26, .5, '#4a4f5c', { t: '#5a606e' }); lw([.3, .3, .5], [.3, .3, 1.9], STEEL); lw([.33, .3, .5], [.33, .3, 1.9], STEEL_D);
  cyl(.3, .3, 1.45, .15, .42, p.on ? '#4a3a34' : '#5a606e', { ol: false }); if (p.on) { lit(() => { cyl(.3, .3, 1.5, .13, .32, '#ff8a3a', { ol: false, t: '#ffd060', l: '#ffb040', r: '#e8642a' }); }); glow(() => ball(.3, .3, 1.7, .6, '#ffb060', { ol: false, t: '#ffd090', d: '#f08a40' })); } for (const dx of [-.13, 0, .13]) lw([.3 + dx, .44, 1.47], [.3 + dx, .44, 1.85], '#3a3440');
  cyl(.3, .3, 2.0, .44, .05, STEEL_D, { t: STEEL }); cyl(.3, .3, 2.05, .1, .06, STEEL_D, { ol: false });
}
function stringlights(p) { const w = p.w || 8, n = Math.round(w / .45); let prev = null; for (let i = 0; i <= n; i++) { const u = i / n, x = w * u, seg = (u * (p.sw || 2)) % 1, z = .5 - Math.sin(seg * Math.PI) * .32, q = [x, .05, z]; if (prev) lw(prev, q, '#3a3440'); prev = q; if (i % 1 === 0) { lit(() => dot(x, .05, z - .06, i % 3 === 0 ? '#ffe9a0' : '#ffd070', 2)); } } }
function bass() { lw([.3, .3, 0], [.3, .3, .12], INK); ball(.3, .3, .5, .3, '#a8642e', { squash: 1.05 }); ball(.3, .3, .98, .22, '#a8642e', { squash: .95 }); qy(.26, .34, .32, 1.1, 1.82, '#3a2a22'); ball(.3, .3, 1.88, .07, '#3a2a22', { ol: false }); for (const dx of [-.03, 0, .03]) lw([.3 + dx, .34, .36], [.3 + dx, .34, 1.8], '#e8e0d0'); qy(.22, .38, .34, .52, .58, '#3a2a22'); for (const dx of [-.12, .12]) lw([.3 + dx, .34, .6], [.3 + dx, .34, .78], '#3a2a22'); }
function drums() {
  cyl(.2, .95, 0, .04, .9, STEEL_D, { ol: false }); cyl(.2, .95, .9, .24, .025, BRASS, { ol: false }); cyl(.2, .95, .96, .24, .02, BRASS_L, { ol: false });
  cyl(1.25, .35, 0, .04, 1.15, STEEL_D, { ol: false }); cyl(1.25, .35, 1.15, .3, .03, BRASS_L, { ol: false });
  cyl(.95, .5, .5, .19, .2, '#b8242e', { t: LINEN }); lw([.95, .5, 0], [.95, .5, .5], STEEL_D);
  fq(arcY(.7, .85, .42, .4, 0, 6.283, 16), '#b8242e'); fq(arcY(.7, .86, .42, .34, 0, 6.283, 16), LINEN); fq(arcY(.7, .87, .42, .12, 0, 6.283, 10), '#b8242e'); for (const dx of [-.3, .3]) lw([.7 + dx, .86, 0], [.7 + dx, .86, .2], STEEL_D);
  cyl(.38, .7, .52, .2, .14, STEEL, { t: LINEN }); lw([.38, .7, 0], [.38, .7, .52], STEEL_D);
}
function planter(p) { const w = p.w || 3; box(0, 0, 0, w, .6, .5, '#5a4a40', { l: PAT.planks('#6a5648', 5) }); box(.05, .05, .5, w - .1, .5, .55, '#3f7a48', { l: (u, v) => (hash2(u, v, 2) > .8 ? '#5a9a58' : hash2(u, v, 3) > .85 ? '#2f6a3c' : '#3f7a48'), t: (x, y) => (hash2(Math.floor(x * 16), Math.floor(y * 16), 4) > .75 ? '#5a9a58' : '#468a50'), r: '#2f6a3c', ol: false }); if (p.lights) for (let x = .2; x < w; x += .35) lit(() => dot(x, .6, .62 + hash2(Math.floor(x * 9), 1, 1) * .35, '#ffe9a0')); }
function drape(p) {
  const w = p.w || 8, c = p.c || BURG, y = .1, H = 3.2, sw = 2;
  qy(0, w, y, 0, H, (u, v, ww, hh) => { const z = v / 16, x = u / 16, k = (x % sw) / sw, edge = 1.6 + Math.pow(Math.abs(k - .5) * 2, 2) * 1.1; if (z < edge - .08) return null; if (z < edge) return BRASS_L; const f = Math.floor(u / 3) % 3; return f === 0 ? dk(c, .16) : f === 1 ? c : lt(c, .08); });
  for (let x = 0; x <= w + .01; x += sw) { qy(Math.max(0, x - .22), Math.min(w, x + .22), y + .01, 0, H, c, dk(c, .14)); lw([Math.max(0, x - .22), y + .02, 1.2], [Math.min(w, x + .22), y + .02, 1.2], BRASS_L); }
  qy(0, w, y + .02, H - .2, H, dk(c, .2)); lw([0, y + .03, H - .2], [w, y + .03, H - .2], BRASS);
  if (p.text) { const tw = Math.min(w - .4, (p.text.length * 4 + 9) / 16); qy(w / 2 - tw / 2 - .06, w / 2 + tw / 2 + .06, y + .03, 2.02, 2.62, BRASS); signY(p.text, w / 2 - tw / 2, w / 2 + tw / 2, y + .04, 2.08, 2.56, CREAM, p.tc || BURG, { frame: false }); }
}
function cake(p) {
  cyl(.6, .6, 0, .5, .5, dk(LINEN, .1), { ol: false, r: dk(LINEN, .24) }); cyl(.6, .6, .5, .56, .26, LINEN);
  if (p.cut) { cyl(.6, .6, .78, .34, .2, '#fff8f0'); fq([[.6, .6, .99], [.9, .6, .99], [.8, .85, .99]], '#f2a7c3'); for (let i = 0; i < 4; i++) { cyl(.25 + i * .22, .98, .77, .08, .012, '#ffffff', { ol: false }); dot(.25 + i * .22, .98, .81, '#f2a7c3', 2); } return; }
  [[.78, .36, .24], [1.02, .26, .22], [1.24, .17, .2]].forEach(([z, r, h], i) => { cyl(.6, .6, z, r, h, '#fff8f0', { l: '#fff8f0', r: '#e8dccc' }); for (let j = 0; j < 8; j++) { const a = j * .785 + i; if (Math.sin(a) > -.3) dot(.6 + Math.cos(a) * r, .6 + Math.sin(a) * r, z + h * .5, j % 2 ? '#f2a7c3' : BRASS_L); } });
  bloom(.6, .6, 1.52, .12, ['#f2a7c3', '#f8f4ea'], 4, 5);
}
function auction() {
  box(0, 0, 0, 3.2, .9, .8, NAVY, { l: (u, v) => (u % 10 === 0 ? dk(NAVY, .2) : NAVY) }); lw([0, .9, .78], [3.2, .9, .78], BRASS_L);
  lw([.3, .3, .8], [.5, .22, 1.5], WALNUT_L); lw([.9, .3, .8], [.7, .22, 1.5], WALNUT_L); qy(.28, .92, .28, .95, 1.5, BRASS); qy(.33, .87, .29, 1, 1.45, (u, v) => (v > 5 ? '#f09a70' : (u + v) % 4 === 0 ? '#c8ecf4' : '#3a8ab8'));
  cyl(1.6, .4, .8, .26, .24, '#c89a5a', { t: '#a87a3a' }); ball(1.5, .38, 1.12, .1, '#e8483a', { ol: false }); ball(1.68, .42, 1.1, .1, '#f6d24a', { ol: false }); qy(1.56, 1.64, .4, 1.1, 1.4, '#2f5a4a'); const hb = arcY(1.6, .4, 1.04, .26, 0, Math.PI, 8, .5); for (let i = 0; i < hb.length - 1; i++) lw(hb[i], hb[i + 1], '#a87a3a');
  qy(2.3, 2.9, .3, .8, 1.3, CREAM); qy(2.36, 2.84, .31, .86, 1.24, BRASS_L); qy(2.42, 2.78, .32, .92, 1.18, CREAM); lit(() => dot(2.6, .33, 1.05, '#e8483a', 2));
  for (const x of [.6, 1.6, 2.6]) { box(x - .16, .62, .8, .32, .22, .02, CREAM, { ol: false }); lw([x - .1, .7, .83], [x + .1, .7, .83], INK); lw([x - .1, .78, .83], [x + .06, .78, .83], INK); }
}
function guestbook() { box(.15, .15, 0, .5, .3, 1, WALNUT); fq([[0, .1, 1.1], [.8, .1, 1.1], [.8, .6, .98], [0, .6, .98]], WALNUT_L); fq([[.08, .16, 1.1], [.72, .16, 1.1], [.72, .56, 1.01], [.08, .56, 1.01]], LINEN); lw([.4, .16, 1.1], [.4, .56, 1.01], '#b8b0a0'); for (let i = 0; i < 3; i++) lw([.14, .26 + i * .09, 1.08 - i * .02], [.34, .26 + i * .09, 1.08 - i * .02], '#5a5a8a'); lw([.6, .3, 1.07], [.72, .2, 1.4], '#f4f0e8'); dot(.72, .2, 1.42, '#f4f0e8'); }
function arch() { const W = 2.4; for (const x of [.1, W - .1]) { lw([x, .25, 0], [x, .25, 1.8], LINEN); lw([x + .04, .25, 0], [x + .04, .25, 1.8], '#d8d0c0'); cyl(x, .25, 0, .12, .08, LINEN, { ol: false }); } const a = arcY(W / 2, .25, 1.8, W / 2 - .1, 0, Math.PI, 14, .75); for (let i = 0; i < a.length; i++) { bloom(a[i][0], .25, a[i][2], .2, ['#f8f4ea', '#f2a7c3', '#8fb89a', '#fbe3ea'], i + 3, 5); } for (const x of [.1, W - .1]) for (let z = .4; z < 1.8; z += .45) bloom(x, .25, z, .13, ['#8fb89a', '#f8f4ea'], Math.round(z * 9), 4); }
function lounger(p) { const c = p.c || '#3f8a8a'; for (const [x, y] of [[.08, .1], [.72, .1], [.08, 1.9], [.72, 1.9]]) lw([x, y, 0], [x, y, .28], WALNUT_D); fq([[0, 0, .95], [.8, 0, .95], [.8, .7, .3], [0, .7, .3]], WALNUT_L); fq([[.06, .05, .97], [.74, .05, .97], [.74, .7, .36], [.06, .7, .36]], LINEN, c); box(0, .7, .26, .8, 1.3, .08, WALNUT_L); qz(.06, .74, .7, 1.95, .345, (x, y) => (Math.floor(y * 5) % 2 ? c : LINEN)); if (p.towel !== false) { box(.15, 1.6, .35, .5, .3, .12, '#f8f4ea', { ol: false }); lw([.15, 1.9, .41], [.65, 1.9, .41], c); } }
function sauna(p) {
  const W = 3.2, D = 2.4, H = 2.4, k = p.part || 'back', pl = (c, st = 4) => (u, v) => (v % st === 0 ? dk(c, .2) : hash2(u >> 3, Math.floor(v / st), 3) > .8 ? lt(c, .1) : c);
  if (k === 'back') { box(0, 0, 0, W, .12, H, CEDAR, { l: pl(CEDAR), ol: false }); box(.05, .12, 0, W - .1, .75, .48, CEDAR, { t: PAT.fboards(lt(CEDAR, .1), .2), l: pl(dk(CEDAR, .1), 5) }); box(.05, .12, .48, W - .75, .4, .42, CEDAR, { t: PAT.fboards(lt(CEDAR, .1), .2), l: pl(dk(CEDAR, .1), 5) });
    box(W - .62, .16, 0, .5, .5, .7, '#3a3440'); for (let i = 0; i < 6; i++) ball(W - .52 + (i % 3) * .15, .3 + Math.floor(i / 3) * .16, .76, .08, i % 2 ? '#8a8478' : '#6a645c', { ol: false }); lit(() => qy(W - .56, W - .18, .67, .1, .3, '#ff8a3a', '#ffb060')); glow(() => ball(W - .37, .5, .6, .5, '#ff9a50', { ol: false }));
    cyl(.5, .5, .9, .12, .16, '#8a5a34', { ol: false }); lw([.42, .5, 1.06], [.3, .5, 1.3], '#8a5a34'); lit(() => dot(1.6, .13, 2.1, '#ffd98a', 2)); glow(() => ball(1.6, .2, 2.05, .4, '#ffd98a', { ol: false })); qy(1.2, 1.5, .13, 1.3, 1.75, '#5a4030'); lw([1.35, .14, 1.4], [1.35, .14, 1.66], '#d8342e'); }
  else if (k === 'side') { box(0, 0, 0, .12, D, H, CEDAR, { r: pl(dk(CEDAR, .2)), ol: false }); }
  else if (k === 'front') { for (const x of [0, 2.1, W - .1]) box(x, 0, 0, .1, .1, H, dk(CEDAR, .15), { ol: false }); box(0, 0, H - .14, W, .1, .14, dk(CEDAR, .15), { ol: false }); qy(.1, 2.1, .1, .06, H - .14, '#e8f4f6', 'glass'); lw([.1, .1, 1.2], [2.1, .1, 1.2], dk(CEDAR, .2)); fq([[.3, .1, 1.4], [.42, .1, 1.4], [.9, .1, 2.1], [.78, .1, 2.1]], '#ffffff', 'glass'); signY('SAUNA', 1.1 - .7, 1.1 + .7, .11, H - .56, H - .16, dk(CEDAR, .3), CREAM, { frame: false }); }
  else { box(0, 0, 0, .08, .08, H, dk(CEDAR, .15), { ol: false }); box(0, D - .08, 0, .08, .08, H, dk(CEDAR, .15), { ol: false }); qx(.08, .08, D - .08, .06, H - .14, '#e8f4f6', 'glass'); box(0, 0, H - .14, .08, D, .14, dk(CEDAR, .15), { ol: false }); }
}
function massage() {
  for (const [x, y] of [[.1, .15], [.8, .15], [.1, 1.9], [.8, 1.9]]) lw([x, y, 0], [x, y, .55], WALNUT_D);
  box(0, 0, .55, .9, 2.05, .14, '#e8dcc8'); box(.04, .1, .69, .82, 1.9, .05, LINEN, { ol: false }); cyl(.45, .25, .74, .17, .08, '#f4f0e8', { ol: false }); qz(.04, .86, 1.2, 2, .745, '#8fd0d0'); lw([.04, 1.2, .75], [.86, 1.2, .75], '#6ab0b0');
  box(1.15, .2, 0, .5, .5, .7, WALNUT_L); qy(1.2, 1.36, .72, .7, .9, '#a8642e'); qy(1.42, 1.54, .72, .7, .86, '#2f5a4a'); candle(1.4, .4, .7, .12); for (let i = 0; i < 3; i++) box(1.18, .28, .08 + i * .12, .44, .34, .1, i % 2 ? '#8fd0d0' : LINEN, { ol: false });
}
function swimmer(p) {
  const f = p.frame || 0, sk = p.skin || '#ecba90', h = p.hair || '#4a3022';
  if (p.soak) { fq(arcY(.4, .3, .02, .34, 0, 6.283, 12, .1), '#b8ecf0'); box(.24, .22, 0, .32, .16, .14, sk, { ol: false }); ball(.4, .3, .28, .15, sk, { ol: false }); ball(.4, .26, .36, .14, h, { ol: false, squash: .6 }); dot(.35, .38, .28, INK); dot(.46, .38, .28, INK); return; }
  const s = [0, 1, 0, -1][f % 4]; qz(.05, 1.15, .1, .5, .01, (x, y) => ((Math.floor(x * 16) + Math.floor(y * 16) + f) % 3 === 0 ? '#e8fbfc' : null));
  box(.3, .2, 0, .5, .2, .08, p.suit || '#2f3f72', { ol: false }); ball(.85, .3, .12, .14, sk, { ol: false }); ball(.8, .28, .2, .13, h, { ol: false, squash: .6 });
  lw([.75, .3, .08], [.75 + .32 * (s >= 0 ? 1 : -.6), .3 + .2 * s, .08 + Math.abs(s) * .22], sk); lw([.75, .31, .1], [.75 + .32 * (s >= 0 ? 1 : -.6), .31 + .2 * s, .1 + Math.abs(s) * .22], sk);
  for (const [dx, dy] of [[-.05, .12], [-.12, .3], [0, .42]]) lit(() => dot(.2 + dx + (f % 2) * .04, dy, .04, '#ffffff'));
}
function roomdoor(p) {
  const y = .1, no = String(p.no || '701'), c = p.c || '#5a2a30';
  qy(0, 1.5, y, 0, 2.5, WALNUT_D); qy(.12, 1.38, y + .01, 0, 2.3, c); for (const [a, b] of [[.3, 1.0], [1.2, 2.1]]) { qy(.24, 1.26, y + .02, a, b, lt(c, .1)); lw([.24, y + .03, a], [1.26, y + .03, a], dk(c, .3)); lw([.24, y + .03, b], [1.26, y + .03, b], lt(c, .25)); }
  qy(.32, 1.18, y + .03, 1.58, 2.04, BRASS); textY(no, .75 - (no.length * 4 - 1) / 32, y + .04, 1.99, INK); dot(1.22, y + .03, 1.05, BRASS_L, 2); qy(1.16, 1.28, y + .03, .96, 1.0, BRASS_D);
  if (p.mine) lit(() => { dot(1.22, y + .04, 1.2, '#7df0a0'); }); else lit(() => dot(1.22, y + .04, 1.2, '#d8342e'));
  if (p.dnd) { qy(1.12, 1.32, y + .05, .5, .95, '#d8342e'); lw([1.16, y + .06, .7], [1.28, y + .06, .7], LINEN); }
  if (p.tray) { box(.3, .3, 0, .7, .4, .05, STEEL, { ol: false }); cyl(.5, .5, .05, .13, .1, STEEL, { ol: false }); dot(.82, .5, .1, '#d8ecf2', 2); }
  if (p.paper) { box(.5, .25, 0, .5, .34, .03, '#e8e4d8', { ol: false }); lw([.56, .35, .04], [.92, .35, .04], INK); }
  lit(() => dot(1.75, y, 1.9, '#fff0b0', 2)); glow(() => ball(1.75, y + .05, 1.9, .3, '#ffe2a0', { ol: false })); lw([1.75, y, 1.6], [1.75, y, 1.86], BRASS);
}
function hkcart() { for (const [x, y] of [[.1, .1], [1.1, .1], [.1, .6], [1.1, .6]]) cyl(x, y, 0, .06, .1, INK, { ol: false }); box(0, 0, .1, .9, .7, .9, '#8a909c', { l: STEEL }); for (let i = 0; i < 2; i++) lw([.04, .7, .42 + i * .3], [.86, .7, .42 + i * .3], STEEL_D); for (let i = 0; i < 4; i++) qy(.08 + i * .2, .24 + i * .2, .71, .46, .68, i % 2 ? LINEN : '#8fd0d0'); for (let i = 0; i < 3; i++) box(.08 + i * .27, .1, 1 + 0, .24, .5, .1 + (i % 2) * .08, LINEN, { ol: false }); qy(.1, .2, .71, .14, .36, '#5ab0d8'); qy(.26, .34, .71, .14, .32, '#f6d24a'); qy(.42, .5, .71, .14, .38, '#e87aa0');
  box(.9, .05, .1, .32, .6, .8, '#4a6a8a', { t: '#3a5a7a' }); lw([1.22, 0, 1.15], [1.22, .7, 1.15], STEEL); lw([1.22, 0, .9], [1.22, 0, 1.15], STEEL); lw([1.22, .7, .9], [1.22, .7, 1.15], STEEL); }
function bed(p) {
  const t = p.tier || 0, W = 2.4, D = 2.7, run = [BURG, NAVY, '#b8862e'][t] || BURG;
  box(0, 0, 0, W, .2, t === 2 ? 1.9 : 1.5, WALNUT, { l: PAT.planks(WALNUT, 9) }); qy(.15, W - .15, .2, .7, t === 2 ? 1.75 : 1.35, t ? run : dk(CREAM, .1), t ? dk(run, .12) : undefined); for (let x = .45; x < W - .2; x += .5) for (let z = .9; z < (t === 2 ? 1.7 : 1.3); z += .3) dot(x, .21, z, BRASS_L);
  box(0, .2, 0, W, D - .2, .3, WALNUT_D); box(.04, .2, .3, W - .08, D - .24, .26, LINEN, { l: '#ece6d8', r: '#dcd4c4' });
  for (const x of [.2, W / 2 + .1]) { box(x, .28, .56, W / 2 - .32, .5, .14, '#ffffff', { l: '#f0ece2', r: '#e0d8c8' }); } if (t) for (const x of [.5, W / 2 + .4]) box(x, .62, .56, .5, .3, .16, run, { ol: false });
  qz(.04, W - .04, 1.75, D - .04, .565, run, dk(run, .1)); qy(.04, W - .04, D - .04, .3, .56, run); lw([.04, 1.75, .57], [W - .04, 1.75, .57], BRASS_L); qz(.04, W - .04, 1.05, 1.75, .565, '#f4efe4');
  if (t === 2) { for (const [x, y] of [[.06, .26], [W - .06, .26], [.06, D - .06], [W - .06, D - .06]]) { lw([x, y, .3], [x, y, 2.5], WALNUT_L); lw([x + .04, y, .3], [x + .04, y, 2.5], WALNUT_D); } for (const yy of [.26, D - .06]) lw([.06, yy, 2.5], [W - .06, yy, 2.5], WALNUT_L); for (const xx of [.06, W - .06]) lw([xx, .26, 2.5], [xx, D - .06, 2.5], WALNUT_L); qy(.06, W - .06, D - .06, 2.2, 2.5, (u, v) => (v < 2 + Math.abs((u % 12) - 6) * .5 ? null : (u % 4 < 2 ? CREAM : '#e8dcc0'))); }
}
function minibar() { box(0, 0, 0, 1.4, .6, .95, WALNUT, { l: WALNUT }); qy(.08, .68, .6, .1, .86, WALNUT_L); qy(.76, 1.32, .6, .1, .86, '#3a3f4c'); lit(() => qy(.82, 1.26, .61, .16, .8, '#cfeaf2', '#b8dce8')); for (let s = 0; s < 3; s++) { lw([.82, .62, .2 + s * .2], [1.26, .62, .2 + s * .2], STEEL_D); for (let i = 0; i < 4; i++) qy(.86 + i * .1, .92 + i * .1, .62, .21 + s * .2, .34 + s * .2, ['#e8483a', '#f6d24a', '#5fb84f', '#a8642e'][(i + s) % 4]); } dot(.62, .61, .5, BRASS_L, 2);
  box(-.03, -.03, .95, 1.46, .66, .06, MARBLE); cyl(.3, .3, 1.01, .11, .2, STEEL, { ol: false }); lw([.42, .3, 1.08], [.48, .3, 1.16], INK); for (let i = 0; i < 2; i++) cyl(.62 + i * .16, .36, 1.01, .05, .08, '#ffffff', { ol: false }); box(.95, .2, 1.01, .34, .24, .03, STEEL_D, { ol: false }); dot(1.04, .32, 1.07, '#e8c06a', 2); dot(1.18, .32, 1.07, '#8a5030', 2); }
function wdesk() { for (const [x, y] of [[.08, .08], [1.52, .08], [.08, .62], [1.52, .62]]) lw([x, y, 0], [x, y, .72], WALNUT_D); box(0, 0, .72, 1.6, .7, .08, WALNUT, { t: PAT.fboards(WALNUT_L, .35) }); qy(.1, 1.5, .7, .56, .72, WALNUT_D); dot(.8, .71, .64, BRASS_L);
  box(.15, .2, .8, .34, .26, .1, '#2a2733'); lw([.14, .34, .92], [.5, .34, .92], '#2a2733'); lw([.14, .36, .95], [.5, .36, .95], '#3a3644'); dot(.2, .47, .86, BRASS_L); dot(.44, .47, .86, BRASS_L); lit(() => dot(.32, .47, .84, '#7df0a0'));
  qy(.7, .96, .3, .8, 1.12, CREAM); lw([.74, .31, 1.04], [.92, .31, 1.04], BURG); lw([.74, .31, .96], [.9, .31, .96], INK); lw([.74, .31, .9], [.88, .31, .9], INK);
  lw([1.3, .3, .8], [1.3, .3, 1.2], BRASS); box(1.14, .2, 1.18, .32, .2, .14, GREEN, { ol: false }); lit(() => qy(1.16, 1.44, .4, 1.14, 1.18, '#fff0b0')); glow(() => ball(1.3, .5, 1, .4, '#ffe2a0', { ol: false })); }
function closet() { box(0, 0, 0, 1.8, .6, 2.3, WALNUT, { l: '#3a2a26' }); qy(.08, 1.72, .6, .1, 2.2, '#4a3830'); lw([.1, .58, 1.95], [1.7, .58, 1.95], BRASS); for (const x of [.5, 1.1]) { lw([x, .59, 1.95], [x, .59, 1.86], BRASS_D); qy(x - .26, x + .26, .6, .7, 1.84, '#f8f4ea', '#ece6d8'); qy(x - .04, x + .04, .61, .7, 1.84, '#e0d8c8'); lw([x - .26, .61, 1.3], [x + .26, .61, 1.3], '#d8d0c0'); dot(x + .14, .61, 1.55, BRASS_L, 2); fq([[x - .26, .61, 1.84], [x, .61, 1.6], [x + .26, .61, 1.84]], '#e8e0d0'); }
  qy(1.42, 1.66, .6, 1.1, 1.84, NAVY); lw([1.54, .59, 1.95], [1.54, .59, 1.86], BRASS_D); for (const x of [.3, .62]) box(x, .5, .12, .26, .12, .08, '#f8f4ea', { ol: false }); box(1.1, .3, .12, .5, .3, .3, '#5a4a40', { ol: false }); box(0, 0, 2.2, 1.8, .64, .1, WALNUT_D); }
function tray(p) { for (const [x, y] of [[.1, .1], [.8, .1], [.1, .5], [.8, .5]]) lw([x, y, 0], [x, y, .68], BRASS_D); box(0, 0, .68, .9, .6, .05, LINEN); if (p.empty) return; cyl(.32, .3, .73, .22, .02, STEEL, { ol: false }); if (p.dome !== false) { ball(.32, .3, .8, .19, STEEL, { squash: .7 }); dot(.32, .3, .96, BRASS_L, 2); } else { cyl(.32, .3, .75, .15, .05, p.c || '#d6924a', { ol: false }); } lw([.7, .3, .73], [.7, .3, .88], '#d8ecf2'); cyl(.7, .3, .88, .05, .1, p.dc || '#f08a2c', { ol: false }); qy(.56, .64, .5, .73, .86, CREAM); }
function bathwall(p) { const w = p.w || .15, d = p.d || 3, H = p.h || 2.5, tl = (u, v) => (u % 8 === 0 || v % 8 === 0 ? '#b8ccd0' : v > 24 ? '#f4f0e8' : TILE); box(0, 0, 0, w, d, H, '#e8e4dc', { l: tl, r: tl, t: '#d8d0c4' }); }
function luggage() { box(0, 0, 0, 1.1, .5, .04, WALNUT_D, { ol: false }); for (const [x, y] of [[.08, .08], [1.02, .08], [.08, .42], [1.02, .42]]) lw([x, y, 0], [x, y, .45], BRASS_D); for (let i = 0; i < 4; i++) lw([.1 + i * .3, .08, .45], [.1 + i * .3, .42, .45], '#5a4030'); box(.08, .06, .46, .94, .4, .3, '#4a6a8a'); lw([.3, .46, .46], [.3, .46, .76], '#2a4a6a'); lw([.8, .46, .46], [.8, .46, .76], '#2a4a6a'); lw([.4, .26, .8], [.7, .26, .8], INK); }
function mic() { cyl(.2, .2, 0, .14, .04, INK, { ol: false }); lw([.2, .2, .04], [.2, .2, 1.25], STEEL_D); ball(.2, .2, 1.3, .06, STEEL, { ol: false }); }
function poolrail() { for (const x of [.1, .6]) { lw([x, .5, 0], [x, .5, .8], STEEL); const a = arcY(x, .25, .8, .25, 0, Math.PI, 8); for (let i = 0; i < a.length - 1; i++) lw([x, .25 - (a[i][0] - x), a[i][2]], [x, .25 - (a[i + 1][0] - x), a[i + 1][2]], STEEL); lw([x, 0, 0], [x, 0, .8], STEEL_D); } }

const T = ['hotel'];
const A = (id, tags, size, draw, x) => Object.assign({ id: 'furn.hotel.' + id, kind: 'furniture', tags: T.concat(tags), size, draw, variants: [{}] }, x);
const WALL = { wall: true, mount: 0, solid: false };
export default [
  A('dtable', ['hotel_table', 'table'], p => { const g = tableGeo(p); return [g.S, g.S, .8]; }, dtable, { seats: p => tableGeo(p).seats.map(s => ({ x: s.x, y: s.y, z: s.z, dir: s.dir })), vb: p => { const g = tableGeo(p); return [-.1, -.1, 0, g.S + .1, g.S + .1, 1.6]; },
    variants: [{ n: 2 }, { n: 4, serve: ['#f08a6a', '#d8a25a', 0, '#f6e2a0'] }, { n: 2, centre: 'tea' }, { n: 6, centre: 'flowers' }, { n: 8, centre: 'candelabra', c: '#22304e', cc: '#e8c06a' }] }),
  A('bstation', ['hotel_buffet'], [1.4, .9, 1.5], bstation, { vb: [-.1, -.1, 0, 1.5, 1, 1.8], use: { x: .7, y: 1.35 }, variants: ['eggs', 'bacon', 'pastry', 'fruit', 'pancakes', 'juice', 'coffee', 'salmon', 'benedict', 'mimosa'].map(k => ({ k })) }),
  A('pass', ['hotel_pass'], [2.4, .2, 2.7], pass, Object.assign({}, WALL)),
  A('barcounter', ['hotel_bar'], p => [p.w || 6, 1, 1.15], barcounter, { vb: p => [-.2, -.2, 0, (p.w || 6) + .2, 1.3, 1.8], use: p => ({ x: (p.w || 6) / 2, y: 1.6 }), staff: p => ({ x: (p.w || 6) * .4, y: -.45, dir: 1 }), variants: [{ w: 6 }] }),
  A('backbar', ['decor'], p => [p.w || 6, .5, 2.7], backbar, { variants: [{ w: 6 }] }),
  A('heater', ['hotel_heater'], [.6, .6, 2.3], heater, { vb: [-.4, -.4, 0, 1, 1, 2.7], variants: [{}, { on: 1 }] }),
  A('stringlights', ['overhead'], p => [p.w || 8, .1, .6], stringlights, { solid: false, overhead: true, variants: [{ w: 8 }] }),
  A('bass', ['instrument_prop'], [.6, .6, 1.95], bass, {}),
  A('drums', ['instrument_prop'], [1.5, 1.2, 1.2], drums, { vb: [-.2, -.1, 0, 1.7, 1.3, 1.4] }),
  A('planter', ['plant'], p => [p.w || 3, .6, 1.05], planter, { variants: [{ w: 3 }, { w: 4, lights: 1 }] }),
  A('drape', ['decor'], p => [p.w || 8, .15, 3.2], drape, Object.assign({ variants: [{ w: 8, text: 'CONGRATULATIONS' }, { w: 6, c: '#22304e', text: 'LIGHTHOUSE FUND' }, { w: 6, c: '#2f5a4a' }] }, WALL, { mount: .9 })),
  A('cake', ['hotel_cake'], [1.2, 1.2, 1.5], cake, { vb: [-.1, -.1, 0, 1.3, 1.3, 1.8], use: { x: .6, y: 1.6 }, variants: [{}, { cut: 1 }] }),
  A('auction', ['hotel_auction'], [3.2, .9, 1.5], auction, { use: { x: 1.6, y: 1.4 } }),
  A('guestbook', ['hotel_guestbook'], [.8, .6, 1.2], guestbook, { vb: [-.1, -.1, 0, .9, .7, 1.5], use: { x: .4, y: 1.05 } }),
  A('arch', ['decor'], [2.4, .5, 2.6], arch, { solid: false, vb: [-.3, -.1, 0, 2.7, .7, 2.9] }),
  A('lounger', ['hotel_lounger'], [.8, 2, .6], lounger, { vb: [-.1, -.1, 0, .9, 2.1, 1.1], seats: [{ x: .4, y: 1.05, z: .36, dir: 1 }], use: { x: 1.2, y: 1.3 }, variants: [{}, { c: '#e8a23a' }] }),
  A('sauna', ['hotel_sauna'], p => (p.part === 'side' ? [.12, 2.4, 2.4] : p.part === 'front' ? [3.2, .1, 2.4] : p.part === 'glass' ? [.08, 2.4, 2.4] : [3.2, .9, 2.4]), sauna, { seats: p => (!p.part || p.part === 'back' ? [{ x: .6, y: 1.0, z: .48, dir: 1 }, { x: 1.4, y: 1.0, z: .48, dir: 1 }, { x: 2.1, y: 1.0, z: .48, dir: 1 }] : []), variants: ['back', 'side', 'front', 'glass'].map(part => ({ part })) }),
  A('massage', ['hotel_massage'], [1.7, 2.05, .8], massage, { vb: [-.1, -.1, 0, 1.8, 2.15, 1.2], bed: { x: .45, y: 1.05, z: .76, dir: 1 }, use: { x: .45, y: 2.5 } }),
  A('swimmer', ['hotel_swimmer'], [1.2, .6, .4], swimmer, { solid: false, vb: [-.2, -.2, 0, 1.4, .8, .6], variants: [{ frame: 0 }, { frame: 1 }, { frame: 3, hair: '#e6c36a', skin: '#84502f' }, { soak: 1 }] }),
  A('roomdoor', ['hotel_roomdoor'], [2, .15, 2.5], roomdoor, Object.assign({ use: { x: .75, y: .7 }, vb: [0, 0, 0, 2.1, .9, 2.6], variants: [{ no: '704', mine: 1 }, { no: '705', dnd: 1 }, { no: '706', tray: 1 }, { no: '707', paper: 1 }] }, WALL)),
  A('hkcart', ['decor'], [1.25, .7, 1.2], hkcart, {}),
  A('bed', ['hotel_bed'], [2.4, 2.7, 1.5], bed, { vb: [-.1, -.1, 0, 2.5, 2.8, 2.7], bed: { x: 1.2, y: 1.35, z: .58, dir: 1 }, use: { x: 2.9, y: 1.6 }, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }] }),
  A('minibar', ['hotel_minibar'], [1.4, .6, 1], minibar, { vb: [-.1, -.1, 0, 1.5, .7, 1.4], use: { x: .7, y: 1.05 } }),
  A('wdesk', ['hotel_phone'], [1.6, .7, .8], wdesk, { vb: [-.1, -.1, 0, 1.7, .9, 1.6], use: { x: .8, y: 1.15 } }),
  A('closet', ['hotel_closet'], [1.8, .64, 2.3], closet, { use: { x: .9, y: 1.1 } }),
  A('tray', ['hotel_tray'], [.9, .6, .75], tray, { vb: [-.1, -.1, 0, 1, .7, 1.2], use: { x: .45, y: 1.05 }, variants: [{}, { dome: false }, { empty: 1 }] }),
  A('bathwall', ['partition'], p => [p.w || .15, p.d || 3, p.h || 2.5], bathwall, { variants: [{ d: 3 }, { w: 3, d: .15 }] }),
  A('luggage', ['decor'], [1.1, .5, .8], luggage, {}),
  A('mic', ['decor'], [.4, .4, 1.4], mic, { solid: false }),
  A('poolrail', ['decor'], [.7, .5, .85], poolrail, { solid: false }),
];
