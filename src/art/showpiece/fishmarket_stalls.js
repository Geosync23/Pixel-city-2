// Bay Fish Hall — the market stalls (ids furn.fish.*). One parametric stall drawn item by item for twelve trades, plus the species specimen cards.
//   stall { kind: whole | tuna | shell | squid | oyster | smoke | salt | knife | tackle | chowder | sushi | chips, w, name, c (stall colour), sp: [species], lines: [chalk lines], kg 0..1 (scale needle),
//           pan (species on the scale pan), pennant: name | null, spark, seed }   faces +y, staff stands behind (-y), customers in front
//   specimen { sp, k } one species on a card (gallery / stamp book)
import { R, SPECIES, SPECIES_IDS, stamp, fishAt, fishSize, S2, dot, icePat, tile, chalk, dial, crate, IRON, IRON_D, IRON_L, TILE, ICE, ICE_D, STEEL, STEEL_D, SLATE, CHALK, WOOD, WOOD_D, WOOD_L, RED, BLUE, NAVY, TEAL, YEL, CREAM, INK } from './_fish_lib.js';
const { box, qy, qx, qz, fq, lw, cyl, ball, cone, dk, lt, mix, rng, hash2, PW, px, C, lit, glow, signY, PAT, ellipse, line, rect } = R;

const D = 1.5, CH = 1.02;                       // counter depth, back height
const zAt = y => CH - Math.max(0, y - .3) / 1.15 * .2;   // the display slopes toward the customer
const lemon = (x, y) => { const s = S2(x, y, zAt(y) + .03); ellipse(s[0], s[1], 2, 1.6, '#f6dc4a'); px(s[0] - 1, s[1] - 1, C('#fff6b0')); };
const tag = (x, y, c = RED) => { const s = S2(x, y, zAt(y)); line([s[0], s[1]], [s[0], s[1] - 6], '#8a7a5a'); rect(s[0] - 3, s[1] - 11, 7, 5, '#fbf7ee'); rect(s[0] - 2, s[1] - 9, 5, 1, c); px(s[0] - 2, s[1] - 7, C(INK)); px(s[0], s[1] - 7, C(INK)); };
const parsley = (x, y) => { const s = S2(x, y, zAt(y) + .02); for (const [a, b] of [[0, 0], [1, -1], [-1, -1], [2, 0], [0, -2]]) px(s[0] + a, s[1] + b, C(a & 1 ? '#3f8a45' : '#5fb84f')); };
/** lay groups of species across the ice: each group gets a column of the display */
function lay(w, sp, r, x0 = .25, x1) {
  x1 = x1 === undefined ? w - .25 : x1; const n = sp.length, gw = (x1 - x0) / n;
  sp.forEach((id, g) => { const [fw, fh] = fishSize(id), per = Math.max(1, Math.floor(gw * 16 / (fw + 3))), rows = fh > 6 ? [.52, .92, 1.3] : [.45, .7, .95, 1.2, 1.4];
    rows.forEach((y, ri) => { for (let i = 0; i < per; i++) { const x = x0 + g * gw + (i + .5) * gw / per + (ri & 1 ? .05 : -.03); fishAt(id, x, y, zAt(y) + .02, { flip: (ri + g) % 3 === 2 }); } });
    tag(x0 + g * gw + gw * .5, .33, [RED, BLUE, '#2f8a4a'][g % 3]); });
}
const heap = (id, x, y, n, r, sx = .22, sy = .16) => { for (let i = 0; i < n; i++) fishAt(id, x + (r() - .5) * sx * 2, y + (r() - .5) * sy * 2, zAt(y) + .03 + (i > n / 2 ? .04 : 0), { flip: r() < .5 }); };
const tray = (x0, x1, y0, y1, c = STEEL) => { fq([[x0, y0, zAt(y0) + .01], [x1, y0, zAt(y0) + .01], [x1, y1, zAt(y1) + .01], [x0, y1, zAt(y1) + .01]], c); lw([x0, y1, zAt(y1) + .01], [x1, y1, zAt(y1) + .01], dk(c, .35)); lw([x1, y0, zAt(y0) + .01], [x1, y1, zAt(y1) + .01], dk(c, .35)); lw([x0, y0, zAt(y0) + .01], [x1, y0, zAt(y0) + .01], lt(c, .3)); };
const jar = (x, y, z, c, h = .26) => { cyl(x, y, z, .09, h, c, { ol: false, l: lt(c, .1), r: dk(c, .15) }); cyl(x, y, z + h, .07, .04, '#c8a060', { ol: false }); const s = S2(x, y, z + h * .5); rect(s[0] - 2, s[1], 4, 2, '#fbf7ee'); };

const TOP = { whole: 'ice', tuna: 'ice', shell: 'ice', squid: 'ice', oyster: 'ice', smoke: 'wood', salt: 'wood', knife: 'wood', tackle: 'wood', chowder: 'steel', sushi: 'steel', chips: 'steel' };
const KIND = {
  whole(w, p, r) { lay(w, p.sp || ['cod', 'salmon', 'snapper', 'bass'], r, .25, w - .9); for (let i = 0; i < 4; i++) lemon(.5 + r() * (w - 1.8), .4 + r() * .9); parsley(.3, 1.35); parsley(w - 1.2, .5); },
  tuna(w, p, r) {
    fishAt('tuna', w * .36, .78, zAt(.78) + .03, { k: 2 }); fishAt('swordfish', w * .62, 1.25, zAt(1.25) + .02, { flip: true });
    // loins: deep red blocks with a pale grain
    for (let i = 0; i < 3; i++) { const x = w - 1.55 + i * .34, y = .48 + (i & 1) * .08; box(x, y, zAt(y) + .01, .28, .34, .12, '#b02a3a', { t: (X, Y) => (Math.floor((X + Y) * 14) % 3 === 0 ? '#d85a62' : '#b8303e'), l: '#8a1f30', r: '#701828' }); }
    tag(w - 1.2, .36, RED); tag(w * .3, .36, BLUE); lemon(w * .5, 1.3); lemon(w * .16, 1.2); parsley(w - .5, 1.25);
    // swordfish head as a trophy on the back shelf
    const s = S2(.5, .2, CH + .04); stamp(['....b....', '...bBb...', '..bBeBb..', '..bBBBb..', '...bbb...'], SPECIES.swordfish.pal, s[0] - 4, s[1] - 6, {}); line([s[0], s[1] - 6], [s[0] + 2, s[1] - 19], '#4a5a74'); line([s[0] + 1, s[1] - 6], [s[0] + 3, s[1] - 19], '#6a7a94');
  },
  shell(w, p, r) {
    for (let i = 0; i < 6; i++) fishAt('crab', .55 + (i % 3) * .52 + (i > 2 ? .2 : 0), .55 + Math.floor(i / 3) * .42, zAt(.6) + .03, { flip: i % 2 === 1 });
    tray(w * .46, w * .46 + .8, .4, 1.38, '#3a4a5a'); heap('mussel', w * .46 + .4, .62, 16, r, .3, .18); heap('mussel', w * .46 + .4, 1.08, 16, r, .3, .2);
    tray(w * .46 + .9, w * .46 + 1.65, .4, .86, '#d8ccb0'); heap('clam', w * .46 + 1.27, .62, 12, r, .28, .16);
    tray(w * .46 + .9, w * .46 + 1.65, .92, 1.38, '#f0d8c8'); heap('scallop', w * .46 + 1.27, 1.14, 7, r, .26, .14);
    for (let i = 0; i < 3; i++) fishAt('lobster', .7 + i * .55, 1.3, zAt(1.3) + .03, { red: true, flip: i === 1 });
    tag(.9, .36, RED); tag(w * .46 + .4, .36, BLUE); tag(w * .46 + 1.27, .36, '#2f8a4a'); lemon(1.9, 1.05); parsley(.3, 1.0);
  },
  squid(w, p, r) {
    fishAt('octopus', .6, .62, zAt(.62) + .03); fishAt('octopus', 1.05, 1.12, zAt(1.12) + .03, { flip: true });
    for (let i = 0; i < 5; i++) fishAt('squid', 1.75 + (i % 2) * .16, .48 + i * .2, zAt(.5 + i * .2) + .03, { flip: i % 2 === 1 });
    tray(w * .58, w * .58 + .7, .4, .9, '#2a2a36'); for (let i = 0; i < 6; i++) fishAt('urchin', w * .58 + .18 + (i % 3) * .2, .52 + Math.floor(i / 3) * .26, zAt(.6) + .03);
    heap('shrimp', w * .58 + .35, 1.18, 22, r, .32, .16); fishAt('eel', w - .75, .62, zAt(.62) + .03); fishAt('eel', w - .7, 1.05, zAt(1.05) + .03, { flip: true });
    tag(.8, .36, '#8a3a5e'); tag(1.8, .36, BLUE); tag(w * .58 + .35, .36, RED); tag(w - .7, .36, '#2f8a4a'); lemon(1.4, .6); lemon(w - 1.0, 1.32);
  },
  oyster(w, p, r) {
    for (let j = 0; j < 4; j++) for (let i = 0; i < Math.floor((w - 1.7) / .3); i++) fishAt('oyster', .38 + i * .3 + (j & 1) * .1, .46 + j * .28, zAt(.46 + j * .28) + .03, { flip: (i + j) % 2 === 0 });
    for (let i = 0; i < 5; i++) lemon(.5 + r() * (w - 2.2), .5 + r() * .8);
    // the shucking board: open oysters on a round plate, the knife, a towel
    const x = w - 1.15, y = .85, z = zAt(y) + .01; box(x - .2, y - .42, z, .95, .85, .05, WOOD_L, { t: PAT.fboards(WOOD_L, .2) }); const s = S2(x + .28, y, z + .07); ellipse(s[0], s[1], 9, 5, '#fbf7ee'); ellipse(s[0], s[1], 7, 3.5, '#dcecf2');
    for (const [a, b] of [[-5, -1], [0, -3], [5, -1], [-3, 2], [3, 2]]) { ellipse(s[0] + a, s[1] + b, 2, 1.4, '#b2b0a6'); px(s[0] + a, s[1] + b, C('#f6f2e6')); } px(s[0], s[1], C('#f6dc4a'));
    line([s[0] - 13, s[1] + 5], [s[0] - 8, s[1] + 3], '#7a4e2a'); line([s[0] - 8, s[1] + 3], [s[0] - 4, s[1] + 1], '#e8eef2'); rect(s[0] + 11, s[1] - 3, 5, 4, '#e8e2d4'); rect(s[0] + 11, s[1] - 2, 5, 1, RED);
    jar(.3, .2, CH + .03, '#c83a2a', .2); jar(.52, .2, CH + .03, '#e8c060', .16); tag(1.2, .36, BLUE);
  },
  smoke(w, p, r) {
    // oak rack with kippers and two sides of salmon
    lw([.12, .14, 2.02], [w - .12, .14, 2.02], WOOD_D); lw([.12, .14, 2.05], [w - .12, .14, 2.05], WOOD);
    for (let x = .35; x < w - 1.5; x += .22) { const s = S2(x, .14, 2.0), g = hash2(Math.floor(x * 9), 3) > .5 ? '#e09a3c' : '#c8822e'; rect(s[0] - 1, s[1], 3, 9, g); rect(s[0], s[1] + 1, 1, 7, '#f2c070'); px(s[0] - 1, s[1] + 9, C('#7a4a1c')); px(s[0] + 1, s[1] + 9, C('#7a4a1c')); px(s[0], s[1] - 1, C(INK)); }
    for (const x of [w - 1.25, w - .85]) { const s = S2(x, .14, 2.0); rect(s[0] - 2, s[1], 5, 14, '#e8763a'); for (let j = 2; j < 13; j += 3) rect(s[0] - 2, s[1] + j, 5, 1, '#f6b890'); rect(s[0] - 2, s[1] + 14, 5, 1, '#8a8a90'); px(s[0], s[1] - 1, C(INK)); }
    // the little smoker, parcels, a board of sliced salmon
    box(.15, .22, zAt(.3), .6, .5, .62, '#3a3a44', { l: '#33333c', r: '#26262e' }); glow(() => qy(.25, .65, .721, zAt(.3) + .1, zAt(.3) + .3, '#ff9a3a')); lit(() => qy(.33, .57, .722, zAt(.3) + .14, zAt(.3) + .24, '#ffb04a')); cyl(.45, .45, zAt(.3) + .62, .07, .5, '#4a4a56', { ol: false });
    for (let i = 0; i < 5; i++) { const x = 1.05 + (i % 3) * .42, y = .55 + Math.floor(i / 3) * .42; box(x, y, zAt(y), .34, .26, .1, '#e8dcc0', { ol: false, t: '#f2e8d0' }); const s = S2(x + .17, y + .13, zAt(y) + .11); rect(s[0] - 3, s[1], 7, 1, RED); }
    for (let i = 0; i < 4; i++) fishAt('kipper', 1.2 + i * .12, 1.26 + (i & 1) * .04, zAt(1.26) + .02 + i * .015);
    const bx = w - 1.3; box(bx, .5, zAt(.9), .9, .8, .04, WOOD_L, { ol: false }); for (let i = 0; i < 6; i++) { const s = S2(bx + .15 + i * .11, .9, zAt(.9) + .06); rect(s[0] - 2, s[1] - 2, 4, 5, '#f08a52'); rect(s[0] - 2, s[1], 4, 1, '#f8c0a0'); } lemon(bx + .75, 1.15);
    tag(1.5, .36, '#8a4a1c');
  },
  salt(w, p, r) {
    const cols = [['#fbf7ee', '#e0d8c8'], ['#f2b8b0', '#d89088'], ['#8a8a94', '#62626e'], ['#3a3a44', '#26262e'], ['#f6dc8a', '#d8b44a']];
    cols.forEach((c, i) => { const x = .45 + i * .5, y = 1.0; cyl(x, y, zAt(y), .2, .08, '#b88a5a', { t: '#d8b07a' }); cone(x, y, zAt(y) + .08, .17, .22, c[0]); const s = S2(x, y + .22, zAt(y) + .1); rect(s[0] - 2, s[1] - 2, 5, 4, '#fbf7ee'); px(s[0], s[1] - 1, C(RED)); });
    for (let i = 0; i < 7; i++) jar(.3 + i * .27, .42, zAt(.42), ['#c8402e', '#e8b83a', '#3f8a45', '#8a5a2a', '#e87a3a', '#5a3a2a', '#b83a6a'][i], .24);
    // sacks, a braid of garlic and a crate of lemons
    for (let i = 0; i < 2; i++) { const x = w - 1.35 + i * .55; ball(x + .22, .7, zAt(.7) + .18, .21, '#efe6d0', { squash: 1.05 }); const s = S2(x + .22, .92, zAt(.9) + .16); rect(s[0] - 4, s[1] - 2, 9, 1, BLUE); rect(s[0] - 4, s[1] + 1, 9, 1, BLUE); }
    crate(w - 1.3, 1.02, zAt(1.1), .7, .4, .14, WOOD, null); for (let i = 0; i < 8; i++) { const s = S2(w - 1.2 + (i % 4) * .16, 1.1 + Math.floor(i / 4) * .16, zAt(1.1) + .2); ellipse(s[0], s[1], 2, 1.6, '#f6dc4a'); px(s[0] - 1, s[1] - 1, C('#fff6b0')); }
    for (let i = 0; i < 6; i++) { const s = S2(w - .35, .14, 2.0 - i * .09); ellipse(s[0] + (i & 1), s[1], 2, 2, '#f4eedc'); px(s[0], s[1] + 1, C('#c8b890')); }
  },
  knife(w, p, r) {
    // magnet strip of knives under the fascia
    lw([.3, .14, 1.98], [w - 1.4, .14, 1.98], '#2a2a32'); for (let x = .4, i = 0; x < w - 1.5; x += .2, i++) { const s = S2(x, .14, 1.96), L = 8 + (i * 5) % 7; rect(s[0], s[1], i % 4 === 3 ? 4 : 2, L, '#dfe6ec'); rect(s[0], s[1], 1, L, '#f8fbfd'); rect(s[0], s[1] - 4, 2, 4, ['#7a4e2a', '#2a2a32', '#b83a2a', '#2f6f9f'][i % 4]); }
    // the grinding wheel on its treadle stand
    const gx = w - .95, gy = .75, gz = zAt(.75); box(gx - .3, gy - .28, gz, .6, .56, .08, WOOD_D); lw([gx - .2, gy, gz + .08], [gx, gy, gz + .5], IRON); lw([gx + .2, gy, gz + .08], [gx, gy, gz + .5], IRON);
    const s = S2(gx, gy, gz + .5); ellipse(s[0], s[1], 8, 8, '#8a8a90'); ellipse(s[0], s[1], 6, 6, '#b0b0b6', '#a0a0a8'); ellipse(s[0], s[1], 1.5, 1.5, INK);
    if (p.spark) lit(() => { for (let i = 0; i < 9; i++) px(s[0] - 7 - (i * 3) % 7, s[1] - 5 + ((i * 5 + p.spark * 3) % 9), C(i % 2 ? '#ffe070' : '#ff9a3a')); line([s[0] - 12, s[1] - 9], [s[0] - 5, s[1] - 5], '#e8eef2'); });
    // whetstones, cleavers and a strop on the counter
    for (let i = 0; i < 3; i++) { const x = .35 + i * .45; box(x, .55, zAt(.6), .34, .16, .06, ['#6a7a8a', '#b8a078', '#4a4a56'][i], { ol: false }); }
    for (let i = 0; i < 4; i++) { const s = S2(.5 + i * .42, 1.12, zAt(1.12) + .02); rect(s[0] - 5, s[1] - 2, 9, i % 2 ? 5 : 3, '#dfe6ec'); rect(s[0] - 5, s[1] - 2, 9, 1, '#f8fbfd'); rect(s[0] + 4, s[1] - 1, 5, 2, i % 2 ? '#2a2a32' : '#7a4e2a'); }
    const q = S2(.3, 1.36, zAt(1.36) + .02); rect(q[0], q[1] - 1, 22, 2, '#8a5a34');
  },
  tackle(w, p, r) {
    // rods, a yellow oilskin and a board of lures at the back
    for (let i = 0; i < 4; i++) { const x = .3 + i * .16; lw([x, .14, CH], [x + .04, .14, 2.75 - i * .1], ['#7a4e2a', '#2a2a32', '#b85a2a', '#3a5a4a'][i]); dot(x, .14, CH + .35, '#c8c8d0'); }
    const o = S2(1.25, .14, 2.0); rect(o[0] - 5, o[1], 11, 13, '#f2c230'); rect(o[0] - 5, o[1], 11, 2, '#d8a81c'); rect(o[0], o[1] + 2, 1, 11, '#c89a1c'); rect(o[0] - 7, o[1] + 1, 2, 8, '#f2c230'); rect(o[0] + 6, o[1] + 1, 2, 8, '#f2c230');
    qy(w - 2.0, w - .95, .141, 1.25, 1.95, '#e8dcc0'); for (let i = 0; i < 12; i++) { const s = S2(w - 1.9 + (i % 4) * .25, .141, 1.85 - Math.floor(i / 4) * .22); rect(s[0], s[1], 3, 1, ['#e0524a', '#f2c230', '#3b6fd0', '#3fa860'][i % 4]); px(s[0] + 3, s[1], C('#c8c8d0')); px(s[0] + 4, s[1] + 1, C('#c8c8d0')); }
    // net over the front edge, glass floats, a coil of rope, buoys, boots
    fq([[.15, .95, zAt(.95) + .01], [1.7, .95, zAt(.95) + .01], [1.7, 1.48, zAt(1.48) + .01], [.15, 1.48, zAt(1.48) + .01]], (X, Y) => ((X + Y) % 4 === 0 || (X - Y + 400) % 4 === 0 ? '#2f7a74' : null));
    [['#3fa88a', .5, .62, .15], ['#5a9ad8', .86, .56, .12], ['#e8a23a', 1.14, .68, .13], ['#3fa88a', 1.45, .58, .1]].forEach(([c, x, y, rr]) => { ball(x, y, zAt(y) + rr, rr, c, { t: lt(c, .5) }); dot(x - .03, y, zAt(y) + rr * 1.5, '#ffffff'); });
    const cx = w * .56, cy = .95; for (let k = 0; k < 4; k++) { const s = S2(cx, cy, zAt(cy) + .02 + k * .035); ellipse(s[0], s[1], 8, 4, k % 2 ? '#d8b878' : '#c8a060'); ellipse(s[0], s[1], 4, 2, '#8a6a3a'); }
    for (const [x, c] of [[w - 1.45, RED], [w - 1.05, '#f2c230']]) { cyl(x, .6, zAt(.6), .13, .3, c, { t: lt(c, .2) }); cyl(x, .6, zAt(.6) + .12, .135, .07, '#fbf7ee', { ol: false }); lw([x, .6, zAt(.6) + .3], [x, .6, zAt(.6) + .5], INK); }
    for (const x of [w - .62, w - .38]) { box(x, 1.05, zAt(1.1), .16, .3, .1, '#2f5a4a', { ol: false }); box(x, 1.05, zAt(1.1) + .1, .16, .16, .3, '#2f5a4a'); }
  },
  chowder(w, p, r) {
    [['#f4ecd0', .7], ['#e8a078', 1.6]].forEach(([c, x], i) => { cyl(x, .72, CH - .1, .36, .42, STEEL, { t: STEEL_D }); const s = S2(x, .72, CH + .31); ellipse(s[0], s[1], 7, 3.5, c); for (const [a, b, cc] of [[-3, 0, '#5fb84f'], [2, 1, '#f6b48a'], [0, -1, '#fbf7ee'], [4, -1, '#5fb84f']]) px(s[0] + a, s[1] + b, C(cc));
      line([s[0] + 3, s[1]], [s[0] + 10, s[1] - 9], '#8a8a94'); lit(() => { for (let k = 0; k < 4; k++) px(s[0] - 3 + k * 2 + ((p.seed || 0) + k) % 2, s[1] - 6 - k * 3 - (k & 1), C('#ffffff')); }); lw([x - .36, .72, CH + .1], [x - .5, .72, CH + .16], STEEL_D); lw([x + .36, .72, CH + .1], [x + .5, .72, CH + .16], STEEL_D); glow(() => qy(x - .3, x + .3, 1.08, CH - .16, CH - .1, '#ff9a3a')); });
    // bread bowls, oyster crackers, a stack of paper cups
    for (let i = 0; i < 5; i++) { const x = w - 1.5 + (i % 3) * .36, y = .55 + Math.floor(i / 3) * .34; ball(x, y, zAt(y) + .1, .14, '#d6924a', { t: '#e8b070', squash: .7 }); }
    jar(w - .4, .5, zAt(.5), '#f0e2b8', .32); for (let i = 0; i < 3; i++) cyl(w - 1.2 + i * .26, 1.2, zAt(1.2), .09, .2 + i * .05, '#fbf7ee', { ol: false, t: '#e8e2d4', r: '#d8d2c4' });
    const s = S2(.3, 1.25, zAt(1.25) + .02); rect(s[0], s[1] - 2, 9, 4, '#fbf7ee'); rect(s[0] + 1, s[1] - 1, 7, 1, RED);
  },
  sushi(w, p, r) {
    // a glass case of nigiri and maki, poke bowls on the counter
    const x0 = .25, x1 = w - 1.5, z = zAt(.8) + .02; qz(x0, x1, .4, 1.3, z, PAT.fboards('#c8b070', .12));
    const TOPS = ['#f08a52', '#e0524a', '#f8e8d8', '#f2c230', '#f8b8a4', '#b8303e'];
    for (let j = 0; j < 4; j++) for (let x = x0 + .12, i = 0; x < x1 - .1; x += .17, i++) { const s = S2(x, .5 + j * .22, z + .02), t = TOPS[(i + j * 2) % 6]; if ((i + j) % 5 === 4) { ellipse(s[0], s[1], 2, 1.5, '#2a2a36'); px(s[0], s[1], C('#fbf7ee')); px(s[0] + 1, s[1], C(t)); } else { rect(s[0] - 2, s[1], 4, 2, '#fbf7ee'); rect(s[0] - 2, s[1] - 1, 4, 1, t); px(s[0] - 2, s[1] - 1, C(lt(t, .4))); } }
    box(x0 - .04, .34, z + .02, x1 - x0 + .08, 1.02, .34, '#dff2f6', { l: '#cfe8f0', r: '#b8d8e4', t: '#eaf8fb', l2: 'glass', r2: 'glass', t2: 'glass' }); lw([x0 - .04, 1.36, z + .36], [x1 + .04, 1.36, z + .36], '#ffffff');
    for (let i = 0; i < 3; i++) { const x = w - 1.2 + (i % 2) * .5, y = .55 + Math.floor(i / 2) * .45 + (i === 2 ? 0 : 0), s = S2(x, y, zAt(y) + .08); cyl(x, y, zAt(y), .19, .08, '#2a2a36', { ol: false }); ellipse(s[0], s[1], 5, 2.5, '#fbf7ee'); for (const [a, b, c] of [[-2, 0, '#f08a52'], [0, -1, '#5fb84f'], [2, 0, '#e0524a'], [0, 1, '#f6dc4a'], [-1, -1, '#2a2a36']]) px(s[0] + a, s[1] + b, C(c)); }
    jar(w - .32, 1.2, zAt(1.2), '#5a3a2a', .18); const q = S2(w - .8, 1.3, zAt(1.3) + .03); rect(q[0] - 6, q[1], 12, 1, '#c8a060'); rect(q[0] - 6, q[1] + 2, 12, 1, '#c8a060');
  },
  chips(w, p, r) {
    // fryer with two baskets under a hood, the warming rack, paper cones
    box(.2, .2, CH - .02, 1.5, .7, .1, STEEL, { t: '#3a3a44' }); for (const x of [.3, 1.0]) { qz(x, x + .6, .28, .82, CH + .09, '#d89a3a', '#c8862a'); lw([x, .82, CH + .1], [x + .6, .82, CH + .1], STEEL_D); lw([x + .3, .82, CH + .1], [x + .3, 1.1, CH + .3], STEEL_D); lit(() => { for (let k = 0; k < 4; k++) px(S2(x + .15 + k * .1, .5, CH + .1)[0], S2(x + .3, .5, CH + .1)[1] - (k * 3 + (p.seed || 0)) % 5, C('#fff0b0')); }); }
    box(.1, .1, 2.1, 1.7, .5, .3, STEEL_D, { l: STEEL, r: dk(STEEL, .3) }); lw([.2, .35, 2.1], [.2, .35, 1.3], STEEL_D); lw([1.7, .35, 2.1], [1.7, .35, 1.3], STEEL_D); glow(() => qy(.2, 1.7, .601, 1.95, 2.1, '#ffb04a'));
    const rx = w - 1.9; box(rx, .4, zAt(.6), 1.0, .7, .05, STEEL, { ol: false }); for (let i = 0; i < 6; i++) { const s = S2(rx + .15 + (i % 3) * .3, .55 + Math.floor(i / 3) * .3, zAt(.7) + .08); ellipse(s[0], s[1], 4, 2, '#e0a83a'); px(s[0] - 2, s[1] - 1, C('#f6d070')); px(s[0] + 1, s[1], C('#c8862a')); }
    lit(() => qy(rx, rx + 1, .401, CH + .5, CH + .56, '#ff8a3a'));
    for (let i = 0; i < 4; i++) { const x = w - .8 + (i % 2) * .34, y = .6 + Math.floor(i / 2) * .45, s = S2(x, y, zAt(y)); R.fill([[s[0] - 3, s[1] - 9], [s[0] + 3, s[1] - 9], [s[0], s[1]]], i % 2 ? '#fbf7ee' : '#e8e2d4'); for (let k = -2; k <= 2; k++) rect(s[0] + k, s[1] - 12 - (k & 1), 1, 4, k % 2 ? '#f2c230' : '#f6dc4a'); }
    for (const [x, c] of [[rx + .2, '#fbf7ee'], [rx + .42, '#7a4a2a']]) { cyl(x, 1.25, zAt(1.25), .06, .22, c, { ol: false }); dot(x, 1.25, zAt(1.25) + .25, RED); }
    lemon(rx + .8, 1.28);
  },
};

function stall(p) {
  const w = p.w || 4, kind = KIND[p.kind] ? p.kind : 'whole', c = p.c || BLUE, r = rng((p.seed || 1) * 31 + 7), top = TOP[kind];
  // posts + fascia (drawn first: everything else is in front of them)
  for (const x of [.1, w - .1]) { lw([x, .12, 0], [x, .12, 2.95], IRON_D); lw([x + .04, .12, 0], [x + .04, .12, 2.95], IRON); }
  signY(p.name || 'FRESH FISH', 0, w, .12, 2.36, 2.95, c, CREAM, { frame: false }); lw([0, .12, 2.95], [w, .12, 2.95], dk(c, .5)); lw([0, .12, 2.36], [w, .12, 2.36], dk(c, .5));
  qy(0, w, .12, 2.18, 2.36, PAT.vstripes(CREAM, c, 4)); for (let x = 0; x < w; x += .25) { const s = S2(x + .125, .12, 2.18); px(s[0], s[1] + 1, C(x % .5 < .25 ? c : CREAM)); }
  for (const x of [w * .3, w * .7]) { lw([x, .13, 2.18], [x, .13, 2.05], INK); const s = S2(x, .13, 2.05); rect(s[0] - 2, s[1], 5, 2, '#2f6a5a'); lit(() => rect(s[0] - 1, s[1] + 2, 3, 1, '#fff6c8')); glow(() => ellipse(s[0], s[1] + 6, 8, 4, '#ffe9a0', 'glass')); }
  if (p.pennant) { const s = S2(w * .5, .12, 3.0); line([s[0], s[1]], [s[0], s[1] - 12], IRON_D); R.fill([[s[0] + 1, s[1] - 12], [s[0] + 15, s[1] - 9], [s[0] + 1, s[1] - 5]], '#f2c230'); R.fill([[s[0] + 1, s[1] - 12], [s[0] + 6, s[1] - 11], [s[0] + 1, s[1] - 5]], RED); px(s[0] + 9, s[1] - 9, C(NAVY)); px(s[0] + 11, s[1] - 9, C(NAVY)); }
  // counter body: white tile, a coloured band, dark kick
  box(0, .15, 0, w, D - .15, .8, TILE, { l: tile(dk(TILE, .08)), r: tile(dk(TILE, .22)), ol: false }); qy(0, w, D, .5, .62, dk(c, .1)); qx(w, .15, D, .5, .62, dk(c, .3)); qy(0, w, D, 0, .1, IRON_D); qx(w, .15, D, 0, .1, dk(IRON_D, .2));
  // back shelf + sloped display
  box(0, .12, .8, w, .2, CH - .8, STEEL, { ol: false, t: lt(STEEL, .2) });
  const pat = top === 'ice' ? (X, Y) => { const k = hash2(X, Y, p.seed || 1); return k > .88 ? '#a6cfe2' : k > .64 ? ICE_D : k < .1 ? '#ffffff' : ICE; } : top === 'wood' ? (X, Y) => ((Y + (X >> 1)) % 6 === 0 ? WOOD_D : hash2(X >> 3, (Y + (X >> 1)) / 6 | 0) > .6 ? WOOD_L : WOOD) : (X, Y) => ((X + Y * 2) % 23 === 0 ? '#e2eaee' : STEEL);
  fq([[0, .3, CH], [w, .3, CH], [w, D, zAt(D)], [0, D, zAt(D)]], pat); qy(0, w, D, .8, zAt(D), top === 'ice' ? ICE_D : dk(top === 'wood' ? WOOD : STEEL, .2)); fq([[w, .3, .8], [w, D, .8], [w, D, zAt(D)], [w, .3, CH]], top === 'ice' ? '#a6cfe2' : dk(top === 'wood' ? WOOD : STEEL, .36));
  lw([0, D, zAt(D)], [w, D, zAt(D)], top === 'ice' ? '#ffffff' : lt(top === 'wood' ? WOOD : STEEL, .3)); lw([0, D, 0], [0, D, zAt(D)], INK); lw([w, D, 0], [w, D, zAt(D)], dk(TILE, .5)); lw([0, D, 0], [w, D, 0], INK); lw([w, D, 0], [w, .15, 0], INK);
  KIND[kind](w, p, r);
  // chalk slate (standing on the back shelf, left) and the hanging scale (right)
  if (p.lines && p.lines.length) chalk(p.lines.slice(0, 2), .16, 1.84, .13, 1.12, 1.12 + .2 + Math.min(2, p.lines.length) * .44, {});
  const sx = w - .34; lw([sx, .2, 2.18], [sx, .2, 1.98], INK); dial(sx, .2, 1.82, .27, p.kg || 0, {}); const s = S2(sx, .2, 1.56); line([s[0] - 5, s[1]], [s[0], s[1] - 3], INK); line([s[0] + 5, s[1]], [s[0], s[1] - 3], INK); rect(s[0] - 6, s[1], 13, 2, STEEL); rect(s[0] - 5, s[1] + 2, 11, 1, STEEL_D);
  if (p.pan && SPECIES[p.pan]) { const [fw, fh] = fishSize(p.pan); stamp(SPECIES[p.pan].map, SPECIES[p.pan].pal, s[0] - (fw >> 1), s[1] - fh + 1, {}); }
}
function specimen(p) {
  const id = SPECIES[p.sp] ? p.sp : 'cod', k = p.k || 3, [w, h] = fishSize(id), s = S2(1.1, 1.1, 0); ellipse(s[0], s[1] - 2, w * k / 2 + 8, h * k / 2 + 7, ICE, ICE_D); stamp(SPECIES[id].map, SPECIES[id].pal, s[0] - ((w * k) >> 1), s[1] - 2 - ((h * k) >> 1), { k });
  R.textS(SPECIES[id].name.toUpperCase().slice(0, 18), s[0] - Math.min(18, SPECIES[id].name.length) * 2, s[1] + h * k / 2 + 8, INK);
}
const NAMES = { whole: 'KOWALCZYK DAUGHTERS', tuna: 'BIG BLUE', shell: 'CLAW & ORDER', squid: 'EIGHT ARMS', oyster: 'THE SHUCK STOPS HERE', smoke: 'HALVORSEN SMOKERY', salt: 'SALT OF THE BAY', knife: 'SHARP BROS', tackle: 'HOOK LINE & SINKER', chowder: 'CHOWDER POT', sushi: 'TIDE & RICE', chips: 'THE GOLDEN FRY' };
const COLS = { whole: BLUE, tuna: NAVY, shell: RED, squid: '#7a3a6a', oyster: TEAL, smoke: '#8a4a1c', salt: '#3a6a8a', knife: '#4a4a56', tackle: '#2f6a4a', chowder: '#b8502e', sushi: '#2a2a36', chips: '#d8862a' };
export const STALL_NAMES = NAMES, STALL_COLS = COLS, STALL_W = { whole: 5, tuna: 5, oyster: 5.5, smoke: 4.5, tackle: 5, squid: 4, shell: 4.5 };
export default [
  { id: 'furn.fish.stall', kind: 'furniture', tags: ['fishmarket', 'fish_stall'], size: p => [p.w || 4, D, 1.05], vb: p => [-.4, -.1, 0, (p.w || 4) + .4, D + .2, 4],
    use: p => ({ x: (p.w || 4) / 2, y: D + .55 }), staff: p => ({ x: (p.w || 4) * .62, y: -.4, dir: 1 }), draw: stall,
    variants: Object.keys(KIND).map((kind, i) => ({ kind, w: STALL_W[kind] || 4, name: NAMES[kind], c: COLS[kind], seed: i + 1, lines: ['COD $4', 'BASS $7'], kg: (i % 5) / 5, pan: i % 3 === 0 ? 'cod' : null, pennant: i === 0 ? 'YOU' : null, spark: kind === 'knife' ? 1 : 0 })) },
  { id: 'furn.fish.specimen', kind: 'prop', tags: ['fishmarket'], size: [2.2, 2.2, .1], vb: [-1.6, -1.6, 0, 3.8, 3.8, .6], solid: false, draw: specimen, variants: SPECIES_IDS.map(sp => ({ sp, k: 3 })) },
];
