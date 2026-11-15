// Maple Bay Natatorium — leisure pool, wellness corner, cafe, lido and the city props. ids furn.nat.* / prop.nat.* (helpers + geometry: _nat_lib.js)
//   slides (tower + The Twister flume + The Plunge drop slide; drawn in room coords, place at the room origin)   bridge   rock {s}   tallpalm {h, seed}   sauna   steam   plunge   wavegrille {w} (wall)
//   beacon {on, f}   bucketframe   bucket {tilt 0-3}   fountain {k: mushroom|arch|geyser|whale}   lounger {c, towel}   parasol {c, open}   cafecounter   cafetable {c}   djbooth   kiosk   cover {w, d}
//   hedge {w} (wall)   outshower   stack (winter: stacked loungers)   prop.nat.totem   prop.nat.flag {c}   prop.nat.marlin   prop.nat.banner {a, b}
import { R, box, qy, qx, qz, fq, lw, cyl, ball, dk, lt, mix, hash2, PW, px, C, lit, glow, rng, TEAL, TEAL_D, NAVY, BLUE, YEL, RED, ORG, WHITE, TILE, TILE_D, GROUT, STEEL, STEEL_D, INK, WOOD, WOOD_D, CEDAR, GLASS, WATER, WATER_L, WATER_D, SAND, LEAF, LEAF_D, PINK, LIME, FLOATS,
  S2, dot, tiles, railX, railY, glassY, glassX, palm, towel, textC, ring, trough, LEIS, FLUME_S, DROP_S } from './_nat_lib.js';
const { signY, textY, PAT } = R;

function slides() {
  const T = LEIS.TOWER, x0 = T.x0, y0 = T.y0, s = T.s, h = T.h;
  for (const [x, y] of [[x0, y0], [x0 + s, y0], [x0, y0 + s], [x0 + s, y0 + s]]) box(x - .08, y - .08, 0, .16, .16, h + 1.9, STEEL, { ol: false });
  for (const z of [1.3, 2.6]) { lw([x0, y0 + s, z], [x0 + s, y0 + s, z], STEEL_D); lw([x0 + s, y0, z], [x0 + s, y0 + s, z], STEEL_D); } lw([x0, y0 + s, 0], [x0 + s, y0 + s, 1.3], STEEL_D); lw([x0 + s, y0 + s, 1.3], [x0, y0 + s, 2.6], STEEL_D);
  box(x0 - .1, y0 - .1, h - .12, s + .2, s + .2, .12, '#f4f8f8', { t: (x, y) => ((Math.floor(x * 4) + Math.floor(y * 4)) & 1 ? '#cfe4e6' : '#dfeef0') });
  railX(x0, x0 + s, y0, h, .8); railY(x0, y0, y0 + s, h, .8);
  // stairs up the right side
  for (let i = 0; i < 16; i++) { const y = y0 + s + .9 - i * .26, z = i * .25; box(x0 + s + .15, y, z, .9, .26, .1, i % 2 ? '#dfe6e6' : '#cfd8da', { ol: false }); } lw([x0 + s + 1.05, y0 + s + 1.1, .9], [x0 + s + 1.05, y0 + .1, 4.85], YEL); lw([x0 + s + 1.05, y0 + s + 1.1, 0], [x0 + s + 1.05, y0 + s + 1.1, .9], STEEL_D); lw([x0 + s + 1.05, y0 + .1, 3.9], [x0 + s + 1.05, y0 + .1, 4.85], STEEL_D);
  // supports + chutes, back to front
  const segs = []; const add = (P, cf) => { for (let i = 0; i < P.length - 1; i++) segs.push({ a: P[i], b: P[i + 1], c: cf(i), k: P[i][0] + P[i][1] + P[i + 1][0] + P[i + 1][1], i }); };
  add(FLUME_S, i => (Math.floor(i / 4) % 2 ? YEL : BLUE)); add(DROP_S, i => (Math.floor(i / 5) % 2 ? '#e8584a' : RED)); segs.sort((p, q) => p.k - q.k);
  for (const g of segs) { if (g.i % 9 === 4 && g.a[2] > .9) { lw([g.a[0], g.a[1], 0], [g.a[0], g.a[1], g.a[2] - .1], STEEL); lw([g.a[0] + .06, g.a[1], 0], [g.a[0] + .06, g.a[1], g.a[2] - .1], STEEL_D); } trough(g.a, g.b, g.c, .44); }
  railX(x0, x0 + s, y0 + s, h, .8, STEEL, 3); railY(x0 + s, y0, y0 + s, h, .8);
  // striped canopy
  const top = [x0 + s / 2, y0 + s / 2, h + 2.7], cs = [[x0 - .3, y0 - .3], [x0 + s + .3, y0 - .3], [x0 + s + .3, y0 + s + .3], [x0 - .3, y0 + s + .3]];
  fq([top, [cs[0][0], cs[0][1], h + 1.9], [cs[1][0], cs[1][1], h + 1.9]], dk(YEL, .3)); fq([top, [cs[0][0], cs[0][1], h + 1.9], [cs[3][0], cs[3][1], h + 1.9]], dk(TEAL, .2)); fq([top, [cs[1][0], cs[1][1], h + 1.9], [cs[2][0], cs[2][1], h + 1.9]], TEAL); fq([top, [cs[3][0], cs[3][1], h + 1.9], [cs[2][0], cs[2][1], h + 1.9]], YEL);
  signY('SLIDES', x0 + .5, x0 + s - .5, y0 + s + .1, h + .1, h + .5, NAVY, '#ffffff', { lit: true });
}
function bridge() { for (let i = 0; i < 10; i++) { const a = i / 10, b = (i + 1) / 10, z = t => .12 + Math.sin(t * 3.1416) * .5; fq([[0, a * 3, z(a)], [1.6, a * 3, z(a)], [1.6, b * 3, z(b)], [0, b * 3, z(b)]], i % 2 ? WOOD : lt(WOOD, .1)); fq([[1.6, a * 3, z(a)], [1.6, b * 3, z(b)], [1.6, b * 3, z(b) - .14], [1.6, a * 3, z(a) - .14]], WOOD_D); for (const x of [0, 1.6]) { lw([x, a * 3, z(a) + .7], [x, b * 3, z(b) + .7], x ? YEL : dk(YEL, .2)); if (i % 3 === 0) lw([x, a * 3, z(a)], [x, a * 3, z(a) + .7], STEEL_D); } } }
function rock(p) { const s = p.s || 1; ball(.5 * s, .5 * s, .25 * s, .42 * s, '#a8a094', { squash: .7 }); ball(.75 * s, .6 * s, .16 * s, .26 * s, '#b8b0a4', { squash: .7 }); }
function tallpalm(p) { palm(.4, .4, 0, p.h || 2.6, p.seed || 1); ball(.4, .4, .02, .22, '#c8b88a', { squash: .4, ol: false }); }
function sauna() {
  box(0, 0, 0, 3.4, .12, 2.5, CEDAR, { l: PAT.planks(CEDAR, 4) }); box(0, 0, 0, .12, 2.4, 2.5, CEDAR, { r: PAT.planks(dk(CEDAR, .1), 4) });
  qz(.12, 3.4, .12, 2.4, .02, PAT.fboards(WOOD, .3)); box(.12, .12, 0, 3.28, .6, .46, lt(CEDAR, .1), { l: PAT.planks(CEDAR, 3) }); box(.12, .12, .46, 3.28, .3, .4, lt(CEDAR, .15), { ol: false }); box(.12, .72, 0, .6, 1.6, .46, lt(CEDAR, .1), { ol: false });
  box(2.6, 1.5, 0, .6, .6, .6, '#5a5560'); for (let i = 0; i < 5; i++) ball(2.72 + (i % 3) * .16, 1.62 + (i % 2) * .2, .66, .1, i % 2 ? '#8a8490' : '#6a6470', { ol: false }); glow(() => dot(2.9, 2.1, .3, '#ff8a3a', 2)); lit(() => dot(2.9, 2.11, .2, '#ff6a2a'));
  box(.3, .05, 1.9, .3, .1, .3, '#f4f0e8', { ol: false }); glow(() => qy(.32, .58, .16, 1.92, 2.18, '#ffd98a'));
  box(3.28, 0, 0, .12, 2.4, 2.5, CEDAR, { r: PAT.planks(dk(CEDAR, .15), 4), ol: false }); lw([.12, 2.4, 2.5], [3.4, 2.4, 2.5], WOOD_D); lw([.12, 2.4, 0], [.12, 2.4, 2.5], WOOD_D); glassY(.2, 1.3, 2.4, .1, 2.1); signY('SAUNA 85 C', 1.5, 3.3, 2.41, 2.08, 2.42, WOOD_D, '#fff2c8');
}
function steam() {
  box(0, 0, 0, 3, .12, 2.4, TILE, { l: tiles('#d8ecf0', 4, TEAL, 30, 33) }); box(0, 0, 0, .12, 2.2, 2.4, TILE, { r: tiles('#c8e0e6', 4) }); qz(.12, 3, .12, 2.2, .02, tiles('#cfe4e6', 4)); box(.12, .12, 0, 2.88, .55, .46, '#e4f2f4', { l: tiles('#d8ecf0', 4) });
  for (let i = 0; i < 26; i++) { const s = S2(.3 + hash2(i, 1, 3) * 2.5, 1 + hash2(i, 2, 3) * 1.1, .5 + hash2(i, 3, 3) * 1.6); R.ellipse(s[0], s[1], 4 + hash2(i, 4, 3) * 4, 2 + hash2(i, 5, 3) * 2, '#f4fbfc', 'glass'); }
  glassY(.12, 3, 2.2, 0, 2.2); glassX(3, .12, 2.2, 0, 2.2); signY('STEAM ROOM', .6, 2.5, 2.21, 1.75, 2.1, TEAL_D, '#ffffff');
}
function plunge() { cyl(.9, .9, 0, .9, .95, CEDAR, { t: '#7fd8f0', t2: '#bff0fa' }); for (let i = -4; i <= 4; i++) { const q = S2(.9, .9, .9); for (let k = 0; k < 14; k++) px(q[0] + i * 4, q[1] + 4 + k - Math.abs(i), C(dk(CEDAR, .3))); } for (const z of [.2, .7]) { const s = S2(.9, .9, z); for (let x = -19; x <= 19; x++) px(s[0] + x, s[1] + Math.round(10 * Math.sqrt(Math.max(0, 1 - (x / 20) ** 2))), C(STEEL_D)); } for (const x of [1.5, 1.8]) { lw([x, 1.55, 0], [x, 1.55, 1.4], STEEL); } for (const z of [.3, .6, .9]) lw([1.5, 1.55, z], [1.8, 1.55, z], STEEL); signY('8 C', .5, 1.3, 1.82, .3, .62, BLUE, '#ffffff'); }
function wavegrille(p) { const w = p.w || 4; qy(0, w, .04, 0, 1.1, '#3a4450'); for (let x = .1; x < w; x += .2) lw([x, .05, .08], [x, .05, 1.02], STEEL_D); for (const z of [.1, 1.02]) lw([0, .05, z], [w, .05, z], STEEL); signY('WAVE MACHINE', w / 2 - 1.7, w / 2 + 1.7, .05, 1.2, 1.6, YEL, INK); for (const x of [.3, w - .3]) dot(x, .06, 1.4, RED, 2); }
function beacon(p) { lw([.2, .2, 0], [.2, .2, 2.3], STEEL_D); lw([.26, .2, 0], [.26, .2, 2.3], STEEL); box(.08, .08, 2.3, .3, .3, .1, INK, { ol: false }); const c = p.on ? (p.f ? '#ffb030' : '#ff6a2a') : '#8a5a3a'; if (p.on) lit(() => ball(.23, .23, 2.56, .16, c)); else ball(.23, .23, 2.56, .16, c); fq([[.4, .2, 2.0], [.75, .2, 2.12], [.75, .2, 1.84], [.4, .2, 1.92]], STEEL); if (p.on && p.f) lit(() => { for (const [dx, dz] of [[-.5, .2], [.55, .25], [0, .6]]) dot(.23 + dx, .23, 2.56 + dz, '#ffe08a'); }); }
function bucketframe() { for (const x of [.1, 2.9]) { box(x - .08, .5, 0, .16, .16, 3.1, YEL, { ol: false }); lw([x, .58, 0], [x, .58, 3.1], dk(YEL, .3)); } box(0, .5, 3.1, 3, .16, .16, RED); lw([.1, .58, 1], [.6, .58, 0], dk(YEL, .2)); lw([2.9, .58, 1], [2.4, .58, 0], dk(YEL, .2)); for (const x of [.9, 2.1]) { lw([x, .58, 3.1], [x, .58, 2.75], STEEL_D); } lw([.6, .58, 3.3], [.6, .58, 3.1], BLUE); fq([[.2, .58, 3.3], [1, .58, 3.3], [1, .58, 3.42], [.2, .58, 3.42]], BLUE); }
function bucket(p) { const t = p.tilt || 0, a = t * .55, c = Math.cos(a), s = Math.sin(a), P = (u, v) => [.75 + u * c - v * s * .0, .3, .55 + v * c - u * s], q = (u, v) => { const X = u * c + v * s, Z = -u * s + v * c; return [.75 + X, .3, .6 + Z]; };
  fq([q(-.55, .45), q(.55, .45), q(.4, -.45), q(-.4, -.45)], BLUE); fq([q(-.55, .45), q(.55, .45), q(.55, .3), q(-.55, .3)], '#3b8fd8'); if (t < 2) fq([q(-.5, .44), q(.5, .44), q(.5, .36), q(-.5, .36)], '#bff0f6'); for (const u of [-.2, .15]) fq([q(u, .2), q(u + .12, .2), q(u + .1, -.3), q(u + .02, -.3)], YEL); dot(.75, .31, .6, INK, 2);
  if (t >= 2) for (let i = 0; i < 26; i++) { const k = hash2(i, t, 5), l = hash2(i, 9, 5); dot(.75 + .55 + k * .5 - l * .2, .3 + (l - .5) * .5, .55 - k * (t === 3 ? 2.9 : 1.6), i % 3 ? '#bff0f6' : '#ffffff', i % 4 ? 1 : 2); } }
function fountain(p) {
  const k = p.k || 'mushroom';
  if (k === 'mushroom') { cyl(.7, .7, 0, .12, 1.3, YEL); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, b = (i + 1) / 12 * 6.283; fq([[.7, .7, 1.6], [.7 + Math.cos(a) * .9, .7 + Math.sin(a) * .9, 1.25], [.7 + Math.cos(b) * .9, .7 + Math.sin(b) * .9, 1.25]], i % 2 ? RED : '#f4f8f8'); } }
  else if (k === 'arch') { for (let i = 0; i < 12; i++) { const a = i / 12 * 3.1416, b = (i + 1) / 12 * 3.1416; lw([.2, .2 + (1 - Math.cos(a)) * .9, Math.sin(a) * 1.5], [.2, .2 + (1 - Math.cos(b)) * .9, Math.sin(b) * 1.5], [RED, ORG, YEL, LIME, BLUE, '#8a5cc2'][i % 6]); lw([.28, .2 + (1 - Math.cos(a)) * .9, Math.sin(a) * 1.5], [.28, .2 + (1 - Math.cos(b)) * .9, Math.sin(b) * 1.5], [RED, ORG, YEL, LIME, BLUE, '#8a5cc2'][i % 6]); } }
  else if (k === 'whale') { ball(.6, .5, .3, .5, '#5ab0e0', { squash: .7 }); fq([[1.05, .5, .3], [1.45, .3, .6], [1.45, .7, .6]], '#4a98c8'); dot(.3, .75, .4, INK); dot(.6, .5, .72, '#2f6f98', 2); }
  else { cyl(.3, .3, 0, .2, .12, STEEL); dot(.3, .3, .14, INK, 2); }
}
function lounger(p) { const c = p.c || TEAL; for (const [x, y] of [[.05, .1], [.55, .1], [.05, 1.6], [.55, 1.6]]) lw([x, y, 0], [x, y, .28], STEEL_D); box(0, .5, .28, .65, 1.3, .07, '#f4f8f8', { t: (x, y) => (Math.floor(y * 5) % 2 ? c : lt(c, .15)) }); fq([[0, .5, .35], [.65, .5, .35], [.65, 0, .75], [0, 0, .75]], lt(c, .1)); fq([[.65, .5, .35], [.65, 0, .75], [.65, 0, .68], [.65, .5, .28]], dk(c, .25)); if (p.towel) towel(.1, 1.3, .35, p.towel === 2 ? PINK : YEL, .44); }
function parasol(p) { const c = p.c || YEL; cyl(.5, .5, 0, .2, .1, '#8a909c'); lw([.5, .5, .1], [.5, .5, 2.3], '#f4f8f8'); lw([.55, .5, .1], [.55, .5, 2.3], STEEL_D); const t = [.5, .5, 2.5]; if (p.open === 0) { fq([t, [.36, .5, 1.3], [.64, .5, 1.3]], c); lw([.5, .5, 2.5], [.5, .5, 1.3], dk(c, .25)); return; } for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + .39, b = (i + 1) / 8 * 6.283 + .39; fq([t, [.5 + Math.cos(a) * 1.3, .5 + Math.sin(a) * 1.3, 2.05], [.5 + Math.cos(b) * 1.3, .5 + Math.sin(b) * 1.3, 2.05]], i % 2 ? '#f4f8f8' : (i > 1 && i < 6 ? c : dk(c, .2))); } dot(.5, .5, 2.55, STEEL_D); }
function cafecounter() {
  box(0, 0, 0, .12, 5, 2.6, '#f4f8f8', { r: tiles('#eaf4f4', 4, YEL, 30, 34) }); R.signX('THE DEEP END', .13, .6, 4.4, 1.95, 2.4, NAVY, YEL, { lit: true });
  for (let i = 0; i < 4; i++) { qx(.13, .7 + i * .95, 1.5 + i * .95, 1.25, 1.85, '#2a3a4a'); const s = S2(.14, 1.44 + i * .95, 1.78); for (let j = 0; j < 4; j++) for (let u = 0; u < 9; u++) if (hash2(u, j + i * 4, 6) > .3) px(s[0] + u, s[1] - (u >> 1) + j * 2, C(j ? '#e8eef0' : YEL)); }
  box(.9, 0, 0, .8, 5, 1, '#f4f8f8', { r: (u, v) => (v < 4 ? TEAL_D : v < 9 + Math.sin(u / 5) * 2.5 ? TEAL : '#f4f8f8'), t: '#fbfdfd' });
  for (let i = 0; i < 2; i++) { const y = .5 + i * .8, c = i ? '#e8483a' : '#3b9be8'; box(1, y, 1, .5, .5, .2, STEEL, { ol: false }); cyl(1.25, y + .25, 1.2, .2, .5, c, { t: lt(c, .3), l: lt(c, .1) }); lit(() => dot(1.52, y + .25, 1.1, c, 2)); cyl(1.25, y + .25, 1.7, .22, .06, INK, { ol: false }); }
  box(1, 2.3, 1, .55, .9, .5, GLASS, { l: '#cfeef6', r: '#bfe6f0', t: '#dff6fa' }); for (let i = 0; i < 3; i++) box(1.1, 2.4 + i * .26, 1.02, .34, .2, .12, [YEL, '#d8a04a', '#e8c880'][i], { ol: false });
  box(1.05, 3.6, 1, .44, .4, .3, INK, { ol: false }); lit(() => qx(1.5, 3.66, 3.94, 1.08, 1.24, '#9fe8b0')); box(1.1, 4.3, 1, .3, .5, .34, '#f4f0e8', { ol: false }); dot(1.3, 4.55, 1.38, RED, 2);
}
function cafetable(p) { const c = p.c || YEL; const chair = (x, y) => { for (const [a, b] of [[x - .16, y - .16], [x + .16, y - .16], [x - .16, y + .16], [x + .16, y + .16]]) lw([a, b, 0], [a, b, .4], STEEL_D); box(x - .2, y - .2, .4, .4, .4, .06, '#f4f8f8', { ol: false }); }; chair(.3, 1); chair(1, .3); cyl(1, 1, 0, .08, .7, STEEL_D, { ol: false }); cyl(1, 1, .7, .55, .06, c, { t: lt(c, .2) }); chair(1.7, 1); chair(1, 1.7); box(.9, .85, .76, .16, .16, .2, RED, { ol: false }); dot(1.15, 1.1, .8, '#3b9be8', 2); }
function djbooth() { box(0, .3, 0, 2.4, .8, 1, INK, { l: (u, v) => ((Math.floor(u / 4) + Math.floor(v / 4)) % 3 ? '#2a2733' : ['#f28fb0', '#5ab0e0', '#a8d84a'][Math.floor(u / 8) % 3]), t: '#3a3644' }); lit(() => { for (let i = 0; i < 9; i++) qy(.14 + i * .25, .3 + i * .25, 1.11, .2, .3 + hash2(i, 2, 8) * .5, ['#f28fb0', '#5ab0e0', '#a8d84a'][i % 3]); }); for (const x of [.6, 1.6]) { cyl(x, .7, 1, .3, .05, '#4a4458'); dot(x, .7, 1.07, YEL, 2); } for (const x of [-.7, 2.5]) { box(x, .4, 0, .6, .6, 1.5, '#33303f'); for (const z of [.4, 1]) { const s = S2(x + .3, 1.01, z); R.ellipse(s[0], s[1], 3.4, 3.4, '#5a5568'); R.ellipse(s[0], s[1], 1.4, 1.4, INK); } } signY('DJ RIPTIDE', .2, 2.2, 1.11, .66, .96, '#f28fb0', '#ffffff', { lit: true }); }
function kiosk() { box(0, 0, 0, 2.6, 1.4, 2.3, '#f4f8f8', { l: (u, v) => (v > 14 && v < 30 && u > 5 && u < 37 ? '#2a3a4a' : PAT.vstripes('#f28fb0', '#f4f8f8', 5)(u, v)), t: '#e8eef0' }); box(.2, 1.4, .85, 2.2, .25, .08, WOOD, { ol: false }); fq([[-.1, 1.4, 2.3], [2.7, 1.4, 2.3], [2.7, 2.2, 1.9], [-.1, 2.2, 1.9]], PAT.vstripes(RED, '#f4f8f8', 6)); signY('ICES', .7, 1.9, 1.41, 1.92, 2.26, YEL, RED); for (let i = 0; i < 3; i++) { const s = S2(.6 + i * .6, 1.41, 1.5); R.ellipse(s[0], s[1], 2.5, 2.5, [PINK, '#f6e8b0', '#8a5a3a'][i]); px(s[0], s[1] + 3, C('#d8a868')); px(s[0], s[1] + 4, C('#d8a868')); } }
function cover(p) { const w = p.w || 16, d = p.d || 5; qz(-.3, w + .3, -.3, d + .3, .1, (x, y) => { const k = hash2(Math.floor(x * 3), Math.floor(y * 3), 4); return Math.sin(x * 1.1 + Math.sin(y) * 1.5) > .55 ? '#f4f8fb' : k > .9 ? '#3a6aa8' : (Math.floor(x / 2) % 2 ? '#2f5f9a' : '#2a5890'); }); for (let x = 1; x < w; x += 2.5) { lw([x, -.3, .12], [x, d + .3, .12], YEL); } lw([-.3, d + .3, .1], [w + .3, d + .3, .1], '#1f4070'); lw([w + .3, -.3, .1], [w + .3, d + .3, .1], '#1f4070'); }
function hedge(p) { const w = p.w || 4; qy(0, w, .3, 0, 1.5, (u, v) => { const k = hash2(u >> 1, v >> 1, 7); return k > .8 ? lt(LEAF, .15) : k < .2 ? LEAF_D : LEAF; }); qz(0, w, 0, .3, 1.5, lt(LEAF, .1), LEAF); if (R.ENV.season === 3) qz(0, w, 0, .3, 1.52, '#f4f8fb'); }
function outshower() { cyl(.3, .3, 0, .28, .05, TILE_D); lw([.3, .3, 0], [.3, .3, 2.2], STEEL); lw([.36, .3, 0], [.36, .3, 2.2], STEEL_D); lw([.3, .3, 2.2], [.3, .6, 2.2], STEEL); box(.2, .52, 2.1, .2, .2, .06, STEEL_D, { ol: false }); dot(.3, .31, 1.2, RED, 2); }
function stack() { for (let i = 0; i < 5; i++) box(0, 0, i * .14, .7, 1.8, .1, i % 2 ? TEAL : '#f4f8f8', { ol: false }); R.outline(0, 0, 0, .7, 1.8, .7, TEAL); if (R.ENV.season === 3) qz(0, .7, 0, 1.8, .71, '#f4f8fb'); }

/* ---------- city props ---------- */
function totem() { box(0, 0, 0, .6, .4, 3.4, '#f4f8f8', { l: (u, v) => (v > 40 ? TEAL : v > 34 + Math.sin(u / 2) * 2 ? '#8fe0ea' : v < 6 ? TEAL_D : '#f4f8f8'), r: TEAL_D }); lit(() => { const s = S2(.3, .41, 2.9); R.ellipse(s[0], s[1], 3, 3, '#ffffff'); for (let i = -3; i <= 3; i++) px(s[0] + i, s[1] + Math.round(Math.sin(i * 1.4)), C(BLUE)); }); for (let i = 0; i < 10; i++) textC('NATATORIUM'[i], .3, .41, 2.5 - i * .22 + .1, NAVY); if (R.ENV.season === 3) qz(0, .6, 0, .4, 3.42, '#f4f8fb'); }
function flag(p) { lw([.1, .1, 0], [.1, .1, 4.2], STEEL); lw([.16, .1, 0], [.16, .1, 4.2], STEEL_D); const c = p.c || BLUE; fq([[.16, .1, 4.1], [1.3, .1, 3.95], [1.3, .1, 3.25], [.16, .1, 3.4]], c); fq([[.16, .1, 3.9], [1.3, .1, 3.75], [1.3, .1, 3.6], [.16, .1, 3.75]], p.c2 || YEL); dot(.13, .1, 4.25, YEL, 2); }
function marlin() { box(0, 0, 0, 1.4, .9, .5, '#b8b0a4', { l: PAT.stone('#b0a89c'), r: PAT.stone('#988f84') }); const B = '#6a8a80', pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([.25 + t * 1.0, .45, .75 + Math.sin(t * 2.6) * .7]); } for (let i = 0; i < 10; i++) { const a = pts[i], b = pts[i + 1], w = .05 + Math.sin(i / 10 * 3.14) * .16; fq([[a[0], a[1], a[2] - w], [b[0], b[1], b[2] - w], [b[0], b[1], b[2] + w], [a[0], a[1], a[2] + w]], i % 2 ? B : lt(B, .12)); } lw(pts[10], [1.75, .45, 1.2], lt(B, .3)); fq([[.25, .45, .75], [.02, .45, 1.05], [.05, .45, .5]], dk(B, .15)); fq([[.6, .45, 1.45], [.95, .45, 1.95], [1.05, .45, 1.5]], dk(B, .1)); dot(1.15, .46, 1.36, INK); textC('MARLINS', .7, .91, .36, '#4a443c'); }
function banner(p) { for (const x of [.1, 2.7]) { lw([x, .2, 0], [x, .2, 1.75], STEEL_D); lw([x + .05, .2, 0], [x + .05, .2, 1.75], STEEL); } qy(0, 2.8, .25, .3, 1.75, '#f4f8f8'); signY(p.a || 'NATATORIUM', .05, 2.75, .26, 1.3, 1.72, TEAL, '#ffffff', { frame: false }); signY(p.b || 'SWIM TODAY', .05, 2.75, .26, .82, 1.26, '#f4f8f8', NAVY, { frame: false }); signY(p.c || 'OPEN 6-22', .05, 2.75, .26, .34, .8, '#f4f8f8', RED, { frame: false }); lw([0, .25, .3], [2.8, .25, .3], STEEL_D); lw([0, .25, 1.75], [2.8, .25, 1.75], STEEL); }

const F = (id, tags, size, draw, x) => Object.assign({ id: 'furn.nat.' + id, kind: 'furniture', tags: ['nat'].concat(tags), size, draw, variants: [{}] }, x);
const PR = (id, size, draw, x) => Object.assign({ id: 'prop.nat.' + id, kind: 'prop', tags: ['nat', 'civic'], size, draw, variants: [{}] }, x);
export default [
  F('slides', ['nat_slides'], [10, 13, 4], slides, { solid: false, vb: [0, 0, 0, 10.6, 13.2, 7.8] }),
  F('bridge', ['nat_bridge'], [1.6, 3, .7], bridge, { solid: false, vb: [-.1, 0, 0, 1.7, 3, 1.5] }),
  F('rock', ['nat_rock'], p => [(p.s || 1), (p.s || 1), .5 * (p.s || 1)], rock, { variants: [{ s: 1 }, { s: 1.6 }] }),
  F('tallpalm', ['nat_plant'], p => [.8, .8, (p.h || 2.6) + .6], tallpalm, { vb: p => [-.9, -.8, 0, 1.7, 1.5, (p.h || 2.6) + .9], variants: [{ h: 2.6 }, { h: 3.4, seed: 5 }] }),
  F('sauna', ['nat_sauna'], [3.4, 2.4, 2.5], sauna, { solid: false, seats: [0, 1, 2, 3].map(i => ({ x: .6 + i * .75, y: .45, z: .5, dir: 1 })), use: { x: 2.2, y: 2.9 } }),
  F('steam', ['nat_steam'], [3, 2.2, 2.4], steam, { solid: false, seats: [0, 1, 2].map(i => ({ x: .6 + i * .85, y: .45, z: .5, dir: 1 })), use: { x: 1.5, y: 2.7 } }),
  F('plunge', ['nat_plunge'], [1.8, 1.8, .95], plunge, { vb: [-.1, -.1, 0, 2, 2, 1.5], use: { x: 1.65, y: 2.2 } }),
  F('wavegrille', ['nat_wave'], p => [p.w || 4, .08, 1.6], wavegrille, { solid: false, variants: [{ w: 4 }] }),
  F('beacon', ['nat_beacon'], [.5, .5, 2.7], beacon, { solid: false, vb: [-.5, -.2, 0, 1, .7, 3.3], variants: [{}, { on: 1, f: 1 }] }),
  F('bucketframe', ['nat_bucket'], [3, 1.1, 3.3], bucketframe, { solid: false, vb: [-.1, .3, 0, 3.1, 1, 3.5] }),
  F('bucket', ['nat_bucket'], [1.5, .6, 1.2], bucket, { solid: false, vb: [-.3, 0, -2.6, 2.3, .8, 1.4], variants: [{ tilt: 0 }, { tilt: 1 }, { tilt: 2 }, { tilt: 3 }] }),
  F('fountain', ['nat_fountain'], p => (p.k === 'mushroom' || !p.k ? [1.4, 1.4, 1.6] : p.k === 'arch' ? [.5, 2.2, 1.5] : p.k === 'whale' ? [1.5, 1, .8] : [.6, .6, .14]), fountain, { solid: false, vb: p => (p.k === 'mushroom' || !p.k ? [-.3, -.3, 0, 1.7, 1.7, 1.7] : p.k === 'arch' ? [0, 0, 0, .5, 2.2, 1.6] : p.k === 'whale' ? [0, 0, 0, 1.6, 1.1, .9] : [0, 0, 0, .6, .6, .2]), variants: [{ k: 'mushroom' }, { k: 'arch' }, { k: 'geyser' }, { k: 'whale' }] }),
  F('lounger', ['nat_lounger'], [.65, 1.8, .4], lounger, { vb: [0, 0, 0, .7, 1.85, .85], seats: [{ x: .33, y: 1.05, z: .38, dir: 1 }], variants: [{ c: TEAL }, { c: YEL, towel: 2 }] }),
  F('parasol', ['nat_parasol'], [1, 1, 2.5], parasol, { solid: false, vb: [-.9, -.9, 0, 1.9, 1.9, 2.7], variants: [{ c: YEL }, { c: RED, open: 0 }] }),
  F('cafecounter', ['nat_cafe'], [1.7, 5, 2.6], cafecounter, { vb: [0, 0, 0, 1.75, 5, 2.7], staff: { x: .5, y: 2, dir: 0 }, use: { x: 2.3, y: 3.7 }, light: { x: 2.4, y: 2.5, z: 0, r: 3, c: '#ffe9b0' } }),
  F('cafetable', ['nat_table'], [2, 2, .8], cafetable, { solid: false, seats: [{ x: .3, y: 1, z: .46, dir: 0 }, { x: 1, y: .3, z: .46, dir: 1 }, { x: 1.7, y: 1, z: .46, dir: 2 }, { x: 1, y: 1.7, z: .46, dir: 3 }], variants: [{ c: YEL }, { c: '#5ab0e0' }] }),
  F('djbooth', ['nat_dj'], [2.4, 1.1, 1.1], djbooth, { vb: [-.8, .2, 0, 3.2, 1.15, 1.6], light: { x: 1.2, y: 1.6, z: 0, r: 3, c: '#f28fb0' } }),
  F('kiosk', ['nat_kiosk'], [2.6, 1.4, 2.3], kiosk, { vb: [-.2, 0, 0, 2.8, 2.3, 2.4], use: { x: 1.3, y: 2.6 } }),
  F('cover', ['nat_cover'], p => [p.w || 16, p.d || 5, .12], cover, { solid: false, vb: p => [-.4, -.4, 0, (p.w || 16) + .4, (p.d || 5) + .4, .2], variants: [{ w: 8, d: 4 }] }),
  F('hedge', ['nat_hedge'], p => [p.w || 4, .3, 1.5], hedge, { solid: false, variants: [{ w: 4 }] }),
  F('outshower', ['nat_outshower'], [.6, .6, 2.2], outshower, { use: { x: .3, y: 1 } }),
  F('stack', ['nat_stack'], [.7, 1.8, .7], stack, {}),
  PR('totem', [.6, .4, 3.4], totem, { light: { x: .3, y: 1, z: 0, r: 2.5, c: '#b0f0f4' } }),
  PR('flag', [.3, .2, 4.2], flag, { solid: false, vb: [0, 0, 0, 1.4, .3, 4.4], variants: [{}, { c: '#f4f8f8', c2: TEAL }] }),
  PR('marlin', [1.4, .9, 1.4], marlin, { vb: [-.1, 0, 0, 1.9, .95, 2.1] }),
  PR('banner', [2.8, .3, 1.75], banner, { vb: [0, 0, 0, 2.85, .32, 1.8], variants: [{}, { b: 'SWIM MEET', c: 'SAT 14:00' }] }),
];
