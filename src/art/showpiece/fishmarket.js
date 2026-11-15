// Bay Fish Hall — the iron-and-glass shed and its big fixtures (ids furn.fish.*). Stalls live in fishmarket_stalls.js, helpers + species in _fish_lib.js.
//   glasswall {w, time, h} (wall)   quaydoor {w, time, boat 0|1, c, crates, n} (wall: roller door open to the quay, a boat alongside)   column {h} iron column + lamp
//   tank {w} lobster tank body + tankglass {w} (its front pane, placed in front so the lobsters sort between)   icemachine {pour 0-3}   block {k 0..1, on} auction rostrum with the price clock
//   lot {sp: [ids], n, sold, c} auction crate   table {c} mess table with benches   catchboard {lines} A-frame   shuck {n} oyster-contest bar   fillet {step} filleting bench   sample {sp} tasting stand
//   recipes card rack   scale {kg 0..1, pan} platform scale   hose (wall)   banner {name} (wall)   cart {n} hand truck of fish boxes   bins   buoys (wall)   stampboard (wall) species chart
import { R, SPECIES, SPECIES_IDS, stamp, fishAt, fishSize, S2, dot, ice, tile, chalk, dial, crate, ironCol, bracket, pendant, SKY, IRON, IRON_D, IRON_L, TILE, ICE, ICE_D, STEEL, STEEL_D, SLATE, CHALK, WOOD, WOOD_D, WOOD_L, RED, BLUE, NAVY, TEAL, YEL, CREAM, INK, BRICK, WATER, WATER_L, WATER_D, CONC, GLASS, RUBBER } from './_fish_lib.js';
const { box, qy, qx, qz, fq, lw, cyl, ball, dk, lt, mix, rng, hash2, px, C, lit, glow, signY, PAT, ellipse, line, rect } = R;
const sky = t => SKY[t] || SKY.day;

function glasswall(p) {
  const w = p.w || 6, h = p.h || 5.2, s = sky(p.time), night = p.time === 'night';
  qy(0, w, .12, 0, 1, PAT.brick(dk(BRICK, .1))); qy(0, w, .13, 1, 1.12, '#d8d2c4');
  qy(0, w, .1, 1.12, h, (u, v) => { const vv = v / ((h - 1.12) * 16); return hash2(u >> 1, v >> 1) > .5 + (vv - .5) * .9 ? s[0] : s[1]; });
  // masts and a far shore through the glass
  const r = rng((p.seed || 1) * 13 + 5); for (let i = 0; i < w / 1.6; i++) { const x = .6 + i * 1.6 + r() * .6, mh = 1 + r() * 1.3; lw([x, .1, 1.12], [x, .1, 1.12 + mh], night ? '#3a4466' : '#7a8ea0'); lw([x - .25, .1, 1.12 + mh * .7], [x + .25, .1, 1.12 + mh * .7], night ? '#3a4466' : '#7a8ea0'); if (night) lit(() => dot(x, .1, 1.12 + mh, '#ffd070')); }
  qy(0, w, .1, 1.12, 1.4, night ? '#141c34' : p.time === 'day' ? '#5aa4c0' : '#7a8ca8', night ? '#1c2440' : null);
  if (!night) glow(() => { }); else glow(() => qy(0, w, .1, 1.12, h, '#2a3458', 'glass'));
  for (let x = 0; x <= w + .01; x += 1) { lw([x, .1, 1.12], [x, .1, h], IRON_D); if (x < w) { for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI; if (k) lw([x + .5 - Math.cos((k - 1) / 8 * Math.PI) * .5, .1, h - .75 + Math.sin((k - 1) / 8 * Math.PI) * .5], [x + .5 - Math.cos(a) * .5, .1, h - .75 + Math.sin(a) * .5], IRON); } lw([x + .5, .1, 1.12], [x + .5, .1, h - .75], IRON); } }
  for (const z of [2.2, 3.3, h - .75]) lw([0, .1, z], [w, .1, z], IRON); lw([0, .1, h], [w, .1, h], IRON_D); qy(0, w, .1, h - .1, h, IRON_D);
}
function quaydoor(p) {
  const w = p.w || 5, H = 3.5, s = sky(p.time), night = p.time === 'night', hull = p.c || '#2f6f9f';
  qy(0, w, .12, 0, 5.2, PAT.brick(dk(BRICK, .1)));
  // the view: sky, sea, the quay edge
  qy(.3, w - .3, .1, .55, H, (u, v) => (hash2(u >> 1, v >> 1) > v / 48 ? s[1] : s[0])); qy(.3, w - .3, .1, .55, 1.5, night ? '#16203c' : mix(WATER, s[0], .25), night ? '#1c2a4a' : WATER_L);
  for (let i = 0; i < 14; i++) { const x = .5 + hash2(i, 3, p.n || 0) * (w - 1.2), z = .65 + hash2(i, 9) * .8; lw([x, .1, z], [x + .25, .1, z], night ? '#3a4a70' : '#dff2f8'); }
  if (p.boat) { // a fishing boat alongside: hull, wheelhouse, mast, boxes on deck
    const bx = .7, bw = w - 1.6; qy(bx, bx + bw, .1, .7, 1.25, hull); qy(bx, bx + bw, .1, 1.25, 1.33, '#fbf7ee'); qy(bx, bx + bw, .1, .7, .8, dk(hull, .4)); fq([[bx + bw, .1, .7], [bx + bw + .5, .1, 1.33], [bx + bw, .1, 1.33]], hull);
    qy(bx + .2, bx + 1.2, .1, 1.33, 2.2, '#fbf7ee'); qy(bx + .3, bx + 1.1, .1, 1.7, 2.05, night ? '#ffd98a' : '#7fb6d0'); if (night) lit(() => qy(bx + .3, bx + 1.1, .1, 1.7, 2.05, '#ffd98a')); qy(bx + .15, bx + 1.25, .1, 2.2, 2.3, RED);
    lw([bx + 1.6, .1, 1.33], [bx + 1.6, .1, 3.2], '#5a4a3a'); lw([bx + 1.6, .1, 3.1], [bx + bw, .1, 1.6], '#5a4a3a'); lit(() => dot(bx + 1.6, .1, 3.25, night ? '#ff5a4a' : '#c83a2a'));
    for (let i = 0; i < (p.crates === undefined ? 4 : p.crates); i++) { const x = bx + 1.9 + (i % 3) * .5, z = 1.33 + Math.floor(i / 3) * .3; qy(x, x + .44, .1, z, z + .28, i % 2 ? '#3f8fb0' : '#e8a23a'); qy(x, x + .44, .1, z + .22, z + .28, ICE); }
    const t = S2(bx + .5, .1, 1.12); R.textS(p.name || 'MARGO', t[0], t[1], '#fbf7ee');
  }
  qy(.3, w - .3, .1, 0, .55, '#8a8f8f'); qy(.3, w - .3, .1, .48, .55, YEL, INK); for (const x of [1, w - 1]) { cyl(x, .1, .55, .1, .3, '#3a3a44', { ol: false }); cyl(x, .1, .85, .14, .06, '#3a3a44', { ol: false }); }
  // frame, the rolled-up shutter, bay number
  qy(0, .3, .12, 0, H, IRON); qy(w - .3, w, .12, 0, H, IRON); for (let z = .2; z < H; z += .5) { dot(.15, .12, z, IRON_L); dot(w - .15, .12, z, IRON_L); }
  qy(0, w, .12, H, H + .45, STEEL_D); for (let z = H + .06; z < H + .45; z += .09) lw([0, .12, z], [w, .12, z], dk(STEEL_D, .3));
  signY('QUAY ' + (p.n || 1), w / 2 - .9, w / 2 + .9, .121, H + .6, H + 1.05, NAVY, CREAM); if (night) glow(() => qy(.3, w - .3, .1, .55, H, '#1c2440', 'glass'));
}
function column(p) { const h = p.h || 4.6; ironCol(.4, .4, 0, h); bracket(.4, .4, h - .1, .9, 'x'); bracket(.4, .4, h - .1, .9, 'y'); pendant(1.25, .4, h - .1, h - .95); pendant(.4, 1.25, h - .1, h - .95); }
function tank(p) {
  const w = p.w || 3.4; box(0, 0, 0, w, 1.1, .7, STEEL, { l: tile(dk(TILE, .1)), r: tile(dk(TILE, .25)) }); qy(0, w, 1.1, .3, .42, RED);
  // water body: back and floor seen through the glass
  qz(0.05, w - .05, .05, 1.05, .72, (x, y) => (hash2(Math.floor(x * 8), Math.floor(y * 8)) > .7 ? '#8a8a84' : '#6f7a78')); qy(.05, w - .05, .05, .72, 1.5, '#3f8fb0', '#4a9cba'); qx(.05, .05, 1.05, .72, 1.5, '#357a9c');
  for (const [x, y, rr] of [[.5, .4, .16], [w - .6, .3, .2], [w / 2, .55, .12]]) ball(x, y, .78, rr, '#7a7a80', { squash: .6 });
  lit(() => { for (let k = 0; k < 6; k++) dot(w - .35, .2, .85 + k * .1 + (k & 1) * .03, '#dff6fb'); });
  box(-.04, -.04, 1.5, w + .08, .2, .08, STEEL_D, { ol: false }); lw([0, 0, .72], [0, 0, 1.5], STEEL_D); lw([w, 0, .72], [w, 0, 1.5], STEEL_D);
  signY('LIVE LOBSTER', .2, w - .2, -.01, 1.7, 2.1, RED, CREAM); lw([.4, 0, 1.58], [.4, 0, 1.7], INK); lw([w - .4, 0, 1.58], [w - .4, 0, 1.7], INK);
}
function tankglass(p) { const w = p.w || 3.4; qy(0, w, .04, 0, .8, '#9fd8e8', 'glass'); for (let x = .3; x < w; x += .9) { lw([x, .04, .12], [x + .18, .04, .62], '#eafafd'); } lw([0, .04, 0], [0, .04, .8], STEEL_D); lw([w, .04, 0], [w, .04, .8], STEEL_D); lw([0, .04, .8], [w, .04, .8], STEEL); qx(w, -1.02, .04, 0, .8, '#8fc8dc', 'glass'); lw([w, -1.02, .8], [w, .04, .8], STEEL); }
function icemachine(p) {
  const f = p.pour || 0; box(0, 0, 1.3, 1.6, 1, 1.5, STEEL, { l: lt(STEEL, .1), r: STEEL_D }); for (const [x, y] of [[.1, .1], [1.5, .1], [.1, .9], [1.5, .9]]) lw([x, y, 0], [x, y, 1.3], STEEL_D);
  qy(.15, 1.45, 1.001, 1.9, 2.6, '#8a98a4'); for (let z = 1.98; z < 2.6; z += .1) lw([.2, 1.001, z], [1.4, 1.001, z], '#6a7884'); signY('ICE', .5, 1.1, 1.002, 1.45, 1.8, BLUE, '#ffffff'); lit(() => dot(1.42, 1.002, 1.62, f ? '#6aff8a' : '#ff5a4a', 2));
  fq([[.5, 1, 1.3], [1.1, 1, 1.3], [1.2, 1.5, .95], [.4, 1.5, .95]], STEEL_D); // chute
  box(.1, 1.15, 0, 1.4, .9, .6, '#3f8fb0', { l: '#357a9c', r: '#2a6a8c' }); const top = .6 + .12; ice(.16, 1.44, 1.2, 2.0, .62); for (const [x, y, rr] of [[.5, 1.5, .2], [.95, 1.65, .24], [.7, 1.8, .16]]) ball(x, y, top - .02, rr, ICE, { d: ICE_D, t: '#ffffff', squash: .6, ol: false });
  if (f) lit(() => { for (let k = 0; k < 14; k++) { const t = ((k * 7 + f * 5) % 14) / 14, s = S2(.8 + (hash2(k, f) - .5) * .5, 1.5 + (hash2(k, 7) - .5) * .2, .95 - t * .25); rect(s[0], s[1], 2, 2, k % 3 ? '#ffffff' : ICE_D); } });
  lw([1.5, 1.3, .6], [1.9, 1.5, 1.25], WOOD_D); const s = S2(1.5, 1.3, .62); rect(s[0] - 3, s[1] - 2, 6, 4, STEEL_D); // scoop shovel
}
function block(p) {
  box(0, 0, 0, 3.2, 1.8, .45, WOOD, { t: PAT.fboards(WOOD_L, .3), l: PAT.planks(dk(WOOD, .15), 5), r: PAT.planks(dk(WOOD, .3), 5) }); box(1.1, 1.8, 0, 1, .4, .22, WOOD_D);
  box(.25, 1.0, .45, 1.1, .5, 1.05, WOOD_D, { l: PAT.planks(WOOD, 4) }); box(.2, .95, 1.5, 1.2, .6, .06, WOOD_L); signY('AUCTION', .5, 2.7, 1.801, .04, .42, NAVY, YEL, { frame: false });
  cyl(1.05, 1.2, 1.56, .08, .12, '#e8c06a', { ol: false }); dot(1.05, 1.2, 1.72, '#f6e08a'); const g = S2(.5, 1.25, 1.58); rect(g[0] - 4, g[1] - 1, 8, 2, WOOD_D); rect(g[0] - 1, g[1] - 4, 3, 4, WOOD);
  // the price clock: a big dial on a post, needle falls as the price drops
  lw([2.55, .3, .45], [2.55, .3, 2.2], IRON_D); lw([2.6, .3, .45], [2.6, .3, 2.2], IRON); dial(2.57, .32, 2.75, .62, p.k === undefined ? 0 : p.k, { rim: IRON_D, needle: p.on ? '#e0322a' : '#8a8a90' });
  const s = S2(2.57, .32, 2.75); for (let i = 0; i < 16; i++) { const a = Math.PI * (1.25 - i / 15 * 1.5); px(Math.round(s[0] + Math.cos(a) * 7), Math.round(s[1] - Math.sin(a) * 7), C(i < 5 ? '#3fa860' : i < 11 ? '#e8b83a' : '#e0322a')); }
  if (p.on) lit(() => { dot(2.57, .32, 3.48, '#ff5a4a', 2); });
}
function lot(p) { const c = p.c || ['#3f8fb0', '#e8a23a', '#4fa860', '#c8402e'][(p.n || 0) % 4]; crate(0, 0, 0, 1, .7, .32, c, p.sp || ['cod', 'cod'], p.n || 1); if (p.stack) crate(.05, .03, .0, .9, .64, .0, c, null); const s = S2(.92, .62, .34); line([s[0], s[1]], [s[0], s[1] - 10], INK); rect(s[0] - 4, s[1] - 16, 9, 7, p.sold ? RED : '#fbf7ee'); R.textS(String(p.n || 1), s[0] - (p.n > 9 ? 3 : 1), s[1] - 15, p.sold ? '#fbf7ee' : INK); }
function table(p) {
  const c = p.c || WOOD; for (const y of [0, 1.35]) { box(.1, y, .38, 2.2, .35, .06, c, { t: PAT.fboards(lt(c, .1), .18) }); for (const x of [.3, 2.0]) lw([x, y + .18, 0], [x, y + .18, .38], IRON_D); }
  box(0, .5, .68, 2.4, .7, .07, c, { t: PAT.fboards(lt(c, .15), .24) }); for (const x of [.25, 2.15]) { lw([x, .6, 0], [x, .6, .68], IRON_D); lw([x, 1.1, 0], [x, 1.1, .68], IRON_D); }
  cyl(1.2, .85, .75, .06, .14, '#fbf7ee', { ol: false }); cyl(1.34, .82, .75, .05, .12, '#7a4a2a', { ol: false }); const s = S2(.6, .85, .76); rect(s[0] - 3, s[1] - 1, 7, 3, '#fbf7ee'); rect(s[0] - 2, s[1], 5, 1, RED);
}
function catchboard(p) {
  const L = p.lines || ['COD', 'SALMON', 'CRAB'], n = Math.min(5, L.length); box(.05, .35, 0, 3.3, .1, .1, WOOD_D, { ol: false }); fq([[0, .2, 0], [3.4, .2, 0], [3.4, .5, 2.2], [0, .5, 2.2]], WOOD_D);
  chalk(['DAILY CATCH'].concat(L.slice(0, n)), 0.06, 3.34, .5, .1, 2.14, { head: '#f6dc8a' }); const s = S2(1.7, .5, 2.2); ellipse(s[0] + 16, s[1] - 1, 6, 4, WOOD_D); stamp(SPECIES.cod.map, SPECIES.cod.pal, s[0] - 8, s[1] - 9, {});
}
function shuck(p) {
  box(0, 0, 0, 3.4, 1, .95, TEAL, { l: PAT.planks(TEAL, 5), r: PAT.planks(dk(TEAL, .2), 5) }); box(-.05, -.05, .95, 3.5, 1.1, .08, STEEL, { t: lt(STEEL, .15) }); signY('OYSTER DERBY', .2, 3.2, 1.001, .35, .75, CREAM, TEAL, { frame: false });
  for (const x of [.55, 1.7, 2.85]) { box(x - .32, .3, 1.03, .64, .5, .04, WOOD_L, { ol: false }); const n = p.n === undefined ? 4 : p.n; for (let i = 0; i < n; i++) fishAt('oyster', x - .15 + (i % 2) * .3, .42 + Math.floor(i / 2) * .2, 1.09, { flip: i % 2 === 1 }); const s = S2(x + .1, .78, 1.08); line([s[0] - 5, s[1] + 1], [s[0] - 1, s[1]], '#7a4e2a'); line([s[0] - 1, s[1]], [s[0] + 3, s[1] - 1], '#e8eef2'); }
  cyl(3.1, .2, 1.03, .16, .26, STEEL_D); cyl(1.15, .2, 1.03, .1, .16, '#e8c06a', { ol: false }); dot(1.15, .2, 1.22, '#f6e08a');
}
function fillet(p) {
  const st = p.step || 0; box(0, 0, 0, 2.6, .9, .9, STEEL_D, { l: STEEL, r: dk(STEEL, .3), t: lt(STEEL, .2) }); qy(0, 2.6, .9, .1, .2, dk(STEEL, .4));
  box(.3, .15, .9, 1.5, .6, .05, '#f4f0e8', { ol: false, t: '#fbf7ee' }); if (st < 3) fishAt('salmon', 1.05, .45, .97, { k: 1 }); else { const s = S2(1.05, .45, .97); rect(s[0] - 7, s[1] - 2, 13, 2, '#f0906a'); rect(s[0] - 6, s[1] + 1, 13, 2, '#f0906a'); rect(s[0] - 7, s[1] - 1, 13, 1, '#f8c0a0'); }
  if (st > 0 && st < 3) { const s = S2(1.05, .45, .97); line([s[0] - 6 + st * 4, s[1] - 3], [s[0] - 6 + st * 4, s[1] + 3], '#f8a088'); }
  const k = S2(1.95, .5, .96); line([k[0] - 4, k[1] + 2], [k[0] + 5, k[1] - 2], '#e8eef2'); line([k[0] + 5, k[1] - 2], [k[0] + 9, k[1] - 4], INK); cyl(2.35, .25, .9, .14, .2, STEEL, { t: '#d8504a' }); signY('FILLETING', .15, 2.45, .901, .4, .78, '#fbf7ee', NAVY, { frame: false });
}
function sample(p) { cyl(.35, .35, 0, .08, .9, IRON, { ol: false }); cyl(.35, .35, 0, .22, .06, IRON_D); cyl(.35, .35, .9, .34, .05, STEEL, { t: '#fbf7ee' }); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, s = S2(.35 + Math.cos(a) * .18, .35 + Math.sin(a) * .18, .97); rect(s[0] - 1, s[1] - 1, 3, 2, p.c || '#f08a52'); line([s[0], s[1] - 1], [s[0], s[1] - 4], '#c8a060'); } const s = S2(.35, .35, 1.0); rect(s[0] - 6, s[1] - 14, 13, 7, '#fbf7ee'); R.textS('TRY', s[0] - 5, s[1] - 13, RED); line([s[0], s[1] - 7], [s[0], s[1]], INK); }
function recipes(p) { box(0, 0, 0, 1.2, .4, 1.5, WOOD, { l: PAT.planks(WOOD, 6) }); for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) { qy(.08 + i * .27, .3 + i * .27, .401, .25 + j * .4, .58 + j * .4, ['#fbf7ee', '#f6dc8a', '#bfe4ee', '#f8c8b8'][(i + j) % 4]); const s = S2(.14 + i * .27, .401, .5 + j * .4); stamp(SPECIES.sardine.map, SPECIES.sardine.pal, s[0] - 2, s[1], { ol: false }); } signY('RECIPES', .1, 1.1, .401, 1.5, 1.85, RED, CREAM); }
function scale(p) {
  box(0, 0, 0, 1.2, 1, .14, IRON_D, { t: STEEL }); box(.45, 0, .14, .3, .16, 1.3, RED, { l: '#b83a2a', r: '#8a2a20' }); dial(.6, .17, 1.62, .38, p.kg || 0, { rim: RED });
  if (p.pan) crate(.15, .25, .14, .9, .65, .26, '#3f8fb0', [p.pan, p.pan], 3);
}
function hose() { const s = S2(.5, .12, 1.3); ellipse(s[0], s[1], 9, 9, IRON_D); ellipse(s[0], s[1], 7, 7, '#3fa860'); ellipse(s[0], s[1], 4, 4, '#2f8a4a'); ellipse(s[0], s[1], 2, 2, IRON); lw([.5, .12, .75], [.5, .12, .2], '#3fa860'); lw([.5, .12, .2], [.9, .5, .02], '#3fa860'); dot(.9, .5, .04, '#e8c06a', 2); }
function banner(p) { const w = p.w || 7; qy(0, w, .1, 0, 1.1, NAVY); qy(.08, w - .08, .101, .08, 1.02, CREAM); const s = S2(.3, .101, .9); R.textY(p.name || 'BAY FISH HALL - EST. 1894', .3, .102, .92, NAVY); R.textY(p.sub || 'FRESH OFF THE BOATS', .3, .102, .46, RED); fishAt('salmon', w - .6, .103, .34, {}); fishAt('crab', w - 1.5, .103, .34, {}); }
function cart(p) { const n = p.n === undefined ? 3 : p.n; lw([0, .1, 0], [0, .1, 1.5], IRON); lw([0, .7, 0], [0, .7, 1.5], IRON); lw([0, .1, 1.5], [0, .7, 1.5], RED); box(0, .05, .12, .8, .7, .05, IRON_D, { ol: false }); cyl(.05, .0, .0, .12, .05, INK, { ol: false }); cyl(.05, .78, .0, .12, .05, INK, { ol: false }); for (let i = 0; i < n; i++) crate(.08, .08, .17 + i * .3, .68, .62, .26, i % 2 ? '#e8a23a' : '#3f8fb0', i === n - 1 ? [p.sp || 'mackerel'] : null, i); }
function bins(p) { cyl(.4, .4, 0, .32, .8, '#3a6a8a', { t: '#2a4a60' }); cyl(1.15, .45, 0, .3, .7, '#8a5a34', { t: ICE }); const s = S2(1.15, .45, .72); stamp(SPECIES.herring.map, SPECIES.herring.pal, s[0] - 5, s[1] - 2, {}); box(.2, 1.0, 0, .7, .5, .34, '#efe6d0', { ol: false }); box(.3, 1.05, .34, .6, .45, .3, '#e6dcc4', { ol: false }); const q = S2(.6, 1.5, .5); R.textS('SALT', q[0] - 8, q[1] - 2, BLUE); }
function buoys(p) { const w = p.w || 4; let x0 = 0; for (let i = 0; i <= 8; i++) { const x = i / 8 * w, z = 1.1 - Math.sin(i / 8 * Math.PI) * .35; if (i) lw([x0, .1, 1.1 - Math.sin((i - 1) / 8 * Math.PI) * .35], [x, .1, z], '#c8a060'); x0 = x; if (i && i < 8) { const s = S2(x, .1, z), c = [RED, YEL, '#fbf7ee', '#3fa88a', BLUE, '#e87a3a', RED][i - 1]; ellipse(s[0], s[1] + 4, 3, 4, c); rect(s[0] - 3, s[1] + 4, 7, 1, '#fbf7ee'); } } }
function stampboard(p) {
  const got = p.got || {}; qy(0, 6, .1, 0, 2.8, WOOD_D); qy(.08, 5.92, .101, .08, 2.72, '#f4ecd8'); R.textY('SPECIES OF THE BAY', .8, .102, 2.62, NAVY);
  SPECIES_IDS.forEach((id, i) => { const cx = .7 + (i % 6) * .94, z = 1.98 - Math.floor(i / 6) * .56, s = S2(cx, .102, z), [fw, fh] = fishSize(id); if (got[id] || p.all) stamp(SPECIES[id].map, SPECIES[id].pal, s[0] - (fw >> 1), s[1] - (fh >> 1), {}); else { stamp(SPECIES[id].map, {}, s[0] - (fw >> 1), s[1] - (fh >> 1), { ol: '#c8bca0' }); } });
}
const T = ['fishmarket'], A = (id, tags, size, draw, x) => Object.assign({ id: 'furn.fish.' + id, kind: 'furniture', tags: T.concat(tags), size, draw, variants: [{}] }, x), WALL = { wall: true, mount: 0, solid: false };
export default [
  A('glasswall', ['decor'], p => [p.w || 6, .15, p.h || 5.2], glasswall, Object.assign({ variants: [{ w: 6, time: 'day' }, { w: 6, time: 'dawn' }, { w: 6, time: 'night' }] }, WALL)),
  A('quaydoor', ['fish_quay'], p => [p.w || 5, .15, 5.2], quaydoor, Object.assign({ use: p => ({ x: (p.w || 5) / 2, y: .9 }), variants: [{ time: 'dawn', boat: 1, n: 1 }, { time: 'day', boat: 0, n: 2 }, { time: 'night', boat: 1, n: 3, c: '#c8402e', name: 'OSPREY' }] }, WALL)),
  A('column', ['column'], p => [.8, .8, p.h || 4.6], column, { vb: p => [-.1, -.1, 0, 1.6, 1.6, (p.h || 4.6) + .2], light: { x: 1, y: 1, z: 0, r: 5 }, variants: [{}] }),
  A('tank', ['fish_tank'], p => [p.w || 3.4, .1, 1.6], tank, { vb: p => [-.2, -.2, 0, (p.w || 3.4) + .2, 1.3, 2.3], use: p => ({ x: (p.w || 3.4) / 2, y: 1.75 }), variants: [{ w: 3.4 }] }),
  A('tankglass', ['decor'], p => [p.w || 3.4, .06, .8], tankglass, { vb: p => [-.1, -1.1, 0, (p.w || 3.4) + .2, .2, .9], solid: false, variants: [{ w: 3.4 }] }),
  A('icemachine', ['fish_ice'], [1.6, 2.1, 2.8], icemachine, { vb: [-.1, -.1, 0, 2.1, 2.3, 3], use: { x: .8, y: 2.6 }, variants: [{}, { pour: 1 }, { pour: 2 }] }),
  A('block', ['fish_block'], [3.2, 1.8, .5], block, { vb: [-.1, -.1, 0, 3.6, 2.4, 3.8], use: { x: 1.6, y: 2.7 }, staff: { x: .8, y: .55, dir: 1 }, variants: [{ k: 0 }, { k: .6, on: 1 }] }),
  A('lot', ['fish_lot'], [1, .7, .34], lot, { vb: [-.1, -.1, 0, 1.3, .9, 1.5], use: { x: .5, y: 1.2 }, variants: [{ n: 1, sp: ['cod', 'cod', 'bass'] }, { n: 7, sp: ['crab', 'crab'], sold: 1 }, { n: 12, sp: ['mackerel', 'herring', 'sardine', 'herring'] }] }),
  A('table', ['seating'], [2.4, 1.7, .76], table, { seats: [{ x: .6, y: .18, z: .44, dir: 1 }, { x: 1.8, y: .18, z: .44, dir: 1 }, { x: .6, y: 1.52, z: .44, dir: 3 }, { x: 1.8, y: 1.52, z: .44, dir: 3 }], use: { x: 2.8, y: .85 }, variants: [{}] }),
  A('catchboard', ['fish_board'], [3.4, .6, 2.2], catchboard, { vb: [-.1, 0, 0, 3.8, .8, 2.6], use: { x: 1.7, y: 1.1 }, variants: [{ lines: ['COD -30%', 'MACKEREL -20%', 'CRAB PLENTY', 'TUNA SCARCE'] }] }),
  A('shuck', ['fish_shuck'], [3.4, 1, 1.05], shuck, { vb: [-.1, -.1, 0, 3.6, 1.2, 1.5], use: { x: 1.7, y: 1.5 }, staff: { x: 1.7, y: -.45, dir: 1 }, variants: [{}, { n: 1 }] }),
  A('fillet', ['fish_fillet'], [2.6, .9, 1], fillet, { vb: [-.1, -.1, 0, 2.8, 1.1, 1.3], use: { x: 1.05, y: 1.4 }, staff: { x: 1.9, y: -.45, dir: 1 }, variants: [{}, { step: 2 }, { step: 3 }] }),
  A('sample', ['fish_sample'], [.7, .7, 1], sample, { vb: [-.2, -.2, 0, .9, .9, 2], use: { x: .35, y: 1.15 }, variants: [{}, { c: '#f8e8d8' }] }),
  A('recipes', ['fish_recipes'], [1.2, .4, 1.9], recipes, { use: { x: .6, y: .95 }, variants: [{}] }),
  A('scale', ['fish_scale'], [1.2, 1, .2], scale, { vb: [-.1, -.1, 0, 1.4, 1.2, 2.2], solid: true, use: { x: .6, y: 1.5 }, variants: [{}, { kg: .6, pan: 'cod' }] }),
  A('hose', ['decor'], [1, .15, 1.6], hose, Object.assign({ vb: [0, 0, 0, 1.2, .8, 1.7], variants: [{}] }, WALL)),
  A('banner', ['decor'], p => [p.w || 7, .12, 1.1], banner, Object.assign({ variants: [{}] }, WALL, { mount: 3.6 })),
  A('cart', ['decor'], [.8, .8, 1.5], cart, { vb: [-.2, -.2, 0, 1, 1, 1.7], variants: [{ n: 3 }, { n: 1 }] }),
  A('bins', ['decor'], [1.5, 1.5, .8], bins, { vb: [-.1, -.1, 0, 1.7, 1.7, 1.1], variants: [{}] }),
  A('buoys', ['decor'], p => [p.w || 4, .12, 1.2], buoys, Object.assign({ variants: [{}] }, WALL, { mount: 3.7 })),
  A('stampboard', ['fish_stamps'], [6, .12, 2.8], stampboard, Object.assign({ use: { x: 3, y: .8 }, variants: [{ all: 1 }, { got: { cod: 1, crab: 1, tuna: 1 } }] }, WALL, { mount: 1.1 })),
];
