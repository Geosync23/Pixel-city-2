// Signature fixtures for the hand-made shop / service / grocery interiors of the converted public places
// (src/scenes/rooms/places_shops*.js). Ids `furn.pshop.*`. Fronts face +y like every venue fixture; wall pieces draw from local z 0 (give a mount).
// Function tags for (future) activities: record_bin, listening_station, book_browse, pet_pen, fish_tank, toy_demo, flower_display,
// tasting_board, artwork, pen_tester, flash_wall, laundry_machine, coffee_station, browse.
import { box, qy, qx, qz, lw, fq, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, textW, spx, hash2, rng } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, stool, sofa, counter, till, goods, shelf, heap, heap2, carton, bottle, lamp, mirrorY, PX, pleat } from './_lib.js';

const A = (id, tags, size, draw, x) => F('pshop.' + id, tags, size, draw, x);
const TAU = 6.2832, CH = '#c4c9ce', BR = '#d8a848', INK = '#2a2733';
const CLOTH = ['#d63a3a', '#3c64ad', '#f1ede4', '#3a3f4c', '#f2c230', '#3f8a55', '#e87aa0', '#c0a078', '#6fb6d8'];
const FLW = ['#e87aa0', '#f2c230', '#d63a3a', '#f1ede4', '#b07ad8', '#f28a30', '#ff9ab8', '#f6e04a'];
const SLEEVE = ['#d63a3a', '#f2c230', '#3c64ad', '#2a2733', '#f1ede4', '#e8843a', '#2f8f8a', '#7a55b0', '#e87aa0', '#3f8a55', '#8a5a3a', '#6fb6d8'];
const POLISH = ['#ff4a8a', '#e87aa0', '#f4b8c8', '#d63a3a', '#a82a4a', '#b07ad8', '#7a55b0', '#6fb6d8', '#2f8f8a', '#f2c230', '#f1ede4', '#3a3f4c', '#ff8a3a', '#9ccc4a'];
const RAINBOW = ['#d63a3a', '#e8643a', '#f28a30', '#f2c230', '#f6e04a', '#9ccc4a', '#3f8a55', '#2f8f8a', '#6fb6d8', '#3c64ad', '#7a55b0', '#b07ad8', '#e87aa0', '#8a5a3a', '#f1ede4', '#3a3f4c'];
const PALS = { paint: RAINBOW, polish: POLISH, sleeve: SLEEVE, flower: FLW,
  jar: ['#c8842a', '#e8d8a0', '#8a3a2a', '#d63a3a', '#5a8a4a', '#e8a040', '#f1ede4', '#6a3a7a'], tin: ['#3c64ad', '#d63a3a', '#f2c230', '#f1ede4', '#2f8f8a', '#3a3f4c'],
  toy: ['#d63a3a', '#f2c230', '#3c64ad', '#3f8a55', '#e87aa0', '#f28a30', '#7a55b0', '#6fb6d8'], pet: ['#d63a3a', '#f2c230', '#3f8a55', '#3c64ad', '#e8843a', '#8a5a3a'],
  paper: ['#f1ede4', '#f4e9cf', '#e8d8b0', '#9fd0e8', '#f4b8c8', '#b8e0a8', '#c8b8e8', '#3a3f4c'], oil: ['#3a3f4c', '#d63a3a', '#f2c230', '#3c64ad', '#8a9098', '#e8843a'],
  wine: ['#5a1f2a', '#3a5a3a', '#8a3a2a', '#2a2733', '#c8a850', '#3a2a48'], pasta: ['#f2d040', '#e8c060', '#d8a03a', '#d63a3a', '#3f8a55', '#f1ede4', '#3c64ad'] };
const palOf = p => (Array.isArray(p) ? p : PALS[p]);
/** filled disc on a y-plane */
const disc = (cx, y, cz, r, c, n = 12) => fq(Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * TAU) * r, y, cz + Math.sin(i / n * TAU) * r]), c);
/** tiny screen-aligned sprite; bottom-left at the world anchor. rows of chars -> palette */
const pix = (x, y, z, rows, pal) => { for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) { const c = pal[rows[j][i]]; if (c) spx(x, y, z, i, j - rows.length, c); } };
const SPR = {
  fish: ['o.oo', 'oooo', 'o.oo'], ham: ['.bb.', 'bbbb', 'bwwb'], bun: ['w.w.', 'w.w.', 'wwww', 'wkww', 'wwww'], bird: ['.yy', 'yyo', 'yy.', '.k.'], kit: ['k..k.', 'kkkk.', 'kwkwk', 'kkkk.'],
  pup: ['b....b.', 'bbbbbbb', '.bbbbkb', '.b..b..'], teddy: ['b.b', 'bbb', 'bwb', 'bbb', 'b.b'], duck: ['.yy', 'yyo', 'yyy'], rocket: ['.r.', 'rwr', 'rwr', 'r.r'],
  heart: ['r.r', 'rrr', '.r.'], dagger: ['.s.', '.s.', '.s.', 'kkk', '.k.'], rose: ['rr.', 'rr.', '.g.', '.gg', '.g.'], skull: ['www', 'kwk', 'www', 'w.w'], swallow: ['b...b', '.b.b.', '..b..'],
  anchor: ['.k.', 'kkk', '.k.', 'k.k', 'kkk'], star: ['.y.', 'yyy', 'y.y'], snake: ['gg.', '.g.', '.gg', '..g'], hero: ['.s.', 'rrr', 'rbr', '.b.', 'b.b'],
  hammer: ['sss', '.w.', '.w.', '.w.'], saw: ['w....', 'sssss', '.s.s.'], wrench: ['s.s', '.s.', '.s.', '.s.', 's.s'], pliers: ['s.s', '.s.', 'r.r', 'r.r'], driver: ['.s.', '.s.', '.y.', '.y.'], hat: ['.cc.', '.cc.', 'cccc'], bag: ['.kk.', 'cccc', 'cccc', 'cccc'],
};
const SC = { o: '#f28a30', b: '#8a5a3a', w: '#f1ede4', k: INK, y: '#f2c230', r: '#d63a3a', g: '#3f8a55', s: '#b8bcc0', c: '#c0704a' };
const sprite = (name, x, y, z, over) => pix(x, y, z, SPR[name], over ? Object.assign({}, SC, over) : SC);
const signW = t => Math.max(1, Math.ceil((textW(t) + 8) / 8) / 2);
const wire = (a, b) => (u, v) => (u % 3 === 0 || v % 3 === 0) ? a : b;
const bouquet = (x, y, z, c, s = 1) => { ball(x, y, z + .12 * s, .14 * s, '#3f7a48', { ol: false }); ball(x - .05 * s, y, z + .2 * s, .07 * s, c, { ol: false }); ball(x + .06 * s, y, z + .22 * s, .07 * s, lt(c, .2), { ol: false }); ball(x, y, z + .28 * s, .06 * s, c, { ol: false }); };
const bucket = (x, y, z, c, m) => { cyl(x, y, z, .11, .22, m || '#aab2ba', { t: '#4a5a4a' }); bouquet(x, y, z + .2, c); };
const animal = (x, y, z, c, e) => { bx(x, y, z + .05, .24, .13, .13, c); bx(x + .2, y + .01, z + .12, .13, .11, .13, c); spx(x + .3, y + .12, z + .2, 0, 0, INK); spx(x + .22, y + .06, z + .26, 0, 0, e || dk(c, .4)); spx(x + .02, y + .13, z + .05, 0, 0, dk(c, .4)); spx(x + .2, y + .13, z + .05, 0, 0, dk(c, .4)); spx(x, y + .06, z + .2, -1, 0, c); };
const wheel = (x, y, z, r, h, c, o) => cyl(x, y, z, r, h, c, Object.assign({ ol: false, t: lt(c, .18) }, o));

/* ---------- overhead pieces (hang from the ceiling, never solid) ---------- */
function hang(p) {
  const k = p.kind || 'bulb', c = p.c || '#f1ede4', x = .25, y = .25;
  if (k === 'basket') { post(x, y, 2.25, 2.8, '#8a9098'); cyl(x, y, 1.98, .15, .14, '#8a5a3a', { ol: false }); ball(x, y, 2.16, .2, K.leaf); for (const [dx, dy, l] of [[-.15, .08, .3], [.14, .12, .4], [.02, .18, .25]]) tube([x + dx, y + dy, 2.0], [x + dx, y + dy, 2.0 - l], K.leafD); for (let i = 0; i < 5; i++) spx(x, y, 2.2, Math.round((hash2(i, 1, p.seed || 0) - .5) * 9), Math.round((hash2(i, 2, p.seed || 0) - .5) * 7), p.c || '#e87aa0'); return; }
  if (k === 'lantern') { post(x, y, 2.3, 2.8, '#3a3f4c'); lit(() => ball(x, y, 2.04, p.r || .22, c, { squash: p.sq || 1, t: lt(c, .3) })); glow(() => ball(x, y, 2.04, (p.r || .22) + .06, '#ffe6a0', { ol: false })); lit(() => ball(x, y, 2.04, p.r || .22, c, { squash: p.sq || 1, t: lt(c, .3), ol: false })); for (const q of [-.08, .06]) lw([x - .17, y, 2.04 + q], [x + .17, y, 2.04 + q], dk(c, .16)); return; }
  if (k === 'salami') { tube([0, y, 2.6], [.5, y, 2.6], '#8a9098'); for (let i = 0; i < 3; i++) { const sx = .08 + i * .17, l = .3 + hash2(i, p.seed || 1) * .25, sc = i === 1 ? '#c8683f' : '#8a3a2a'; post(sx, y, 2.6 - .1, 2.6, '#e8dcc0'); cyl(sx, y, 2.5 - l, .05, l, sc, { ol: false, t: dk(sc, .2) }); lw([sx - .04, y + .03, 2.5 - l / 2], [sx + .04, y + .03, 2.5 - l / 2], '#e8dcc0'); } return; }
  if (k === 'mobile') { post(x, y, 2.5, 2.8, INK); lw([0, y, 2.5], [.5, y, 2.42], INK); lw([0, y, 2.5], [0, y, 2.3], INK); lw([.5, y, 2.42], [.5, y, 2.1], INK); lw([.3, y, 2.1], [.7, y, 2.02], INK); disc(0, y, 2.22, .1, '#d63a3a'); disc(.3, y, 2.02, .08, '#f2c230'); fq([[.62, y, 1.98], [.8, y, 1.9], [.66, y, 1.78]], '#3c64ad'); return; }
  if (k === 'buoy') { post(x, y, 2.3, 2.8, '#c8a878'); ball(x, y, 2.1, .17, p.c || '#e8643a'); lw([x - .14, y + .1, 2.1], [x + .14, y + .1, 2.1], '#f1ede4'); lw([x - .14, y + .1, 2.1 + PX], [x + .14, y + .1, 2.1 + PX], '#f1ede4'); return; }
  if (k === 'kite') { post(x, y, 2.5, 2.8, '#8a9098'); fq([[x, y, 2.55], [x + .22, y, 2.3], [x, y, 1.95], [x - .22, y, 2.3]], p.c || '#d63a3a'); fq([[x, y, 2.55], [x + .22, y, 2.3], [x, y, 2.3]], '#f2c230'); fq([[x, y, 2.3], [x, y, 1.95], [x - .22, y, 2.3]], '#3c64ad'); lw([x, y, 1.95], [x + .1, y, 1.8], INK); spx(x + .1, y, 1.8, 0, 0, '#e87aa0'); spx(x + .06, y, 1.72, 0, 0, '#f2c230'); return; }
  if (k === 'plane') { post(x, y, 2.3, 2.8, '#8a9098'); const pc = p.c || '#d63a3a'; bx(.05, .2, 2.12, .45, .1, .1, pc); bx(.15, .02, 2.2, .14, .46, .03, '#f2c230'); bx(.02, .14, 2.2, .06, .22, .03, pc); spx(.5, .25, 2.17, 0, 0, INK); return; }
  if (k === 'chandelier') { post(x, y, 2.4, 2.8, BR); cyl(x, y, 2.3, .06, .1, BR, { ol: false }); cyl(x, y, 2.12, .28, .04, BR, { t: dk(BR, .3) }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, cx = x + Math.cos(a) * .26, cy = y + Math.sin(a) * .26; post(cx, cy, 2.16, 2.26, '#f4f0e8'); lit(() => spx(cx, cy, 2.27, 0, -1, '#ffe680')); } for (let i = 0; i < 5; i++) spx(x, y, 2.1, Math.round((i - 2) * 3), 2 + (i % 2), '#d4eef2'); return; }
  if (k === 'shade') { post(x, y, 2.35, 2.8, INK); cyl(x, y, 2.08, .24, .06, dk(c, .1), { ol: false, t: dk(c, .2) }); cyl(x, y, 2.14, .16, .12, c, { ol: false }); cyl(x, y, 2.26, .07, .09, c, { ol: false }); lit(() => cyl(x, y, 2.06, .12, .02, '#fff2c4', { ol: false })); glow(() => cyl(x, y, 1.98, .22, .06, '#ffe6a0', { ol: false })); return; }
  if (k === 'tube') { post(.05, y, 2.6, 2.8, '#8a9098'); post(.45, y, 2.6, 2.8, '#8a9098'); bx(-.25, .18, 2.52, 1, .14, .08, '#d8dce0'); lit(() => qy(-.22, .72, .32, 2.5, 2.54, p.c || '#f4fbfc')); return; }
  post(x, y, 2.25, 2.8, INK); cyl(x, y, 2.2, .04, .06, BR, { ol: false }); glow(() => ball(x, y, 2.12, .14, '#ffd070', { ol: false })); lit(() => ball(x, y, 2.12, .08, p.c || '#ffe6a0', { ol: false }));
}
const HVB = [-.5, -.5, 1.5, 1.1, 1, 2.95];

const art = [
  /* ================= generic helpers ================= */
  A('sign', ['sign', 'decor'], p => [signW(p.text || 'SHOP'), .1, .6], p => {
    const t = p.text || 'SHOP', w = signW(t), bg = p.bg || INK, fg = p.fg || '#f6e8c0';
    bx(0, 0, 0, w, .05, .6, bg); const d = () => textY(t, (w * 16 - textW(t)) / 32, .06, .42, fg); if (p.lit) lit(d); else d();
    frameY(0, w, .05, 0, .6, p.fr || dk(bg, .45)); if (p.fr2) frameY(.04, w - .04, .05, .04, .56, p.fr2); if (p.lit) glow(() => qy(0, w, .05, -.05, 0, dk(fg, .35)));
  }, { wall: true, mount: 2, solid: false, vb: p => [-.2, -.2, -.1, signW(p.text || 'SHOP') + .2, .4, .8] }),

  A('shelf', ['shelf', 'browse'], p => [p.w || 2, .5, p.h || 2], p => {
    const w = p.w || 2, h = p.h || 2, c = p.c || '#e8e2d4', hh = p.name ? h - .4 : h;
    shelf(0, 0, 0, w, .5, hh, c, p.kind || 'cans', p.rows || 4, { seed: p.seed, back: p.back || '#4a4458', pal: palOf(p.pal), board: p.board });
    if (p.name) { box(0, .1, hh, w, .4, .38, p.hc || K.red); signY(p.name, 0, w, .5, hh, hh + .38, p.hc || K.red, p.ink || '#fff8e0', { frame: false }); }
  }, { use: p => ({ x: (p.w || 2) / 2, y: 1 }) }),

  A('platform', ['decor'], p => [p.w || 2, p.d || 1, .2], p => { const c = p.c || '#d2a26a'; box(0, 0, 0, p.w || 2, p.d || 1, p.h || .18, c, { t: p.top || lt(c, .2) }); }, { flat: false }),

  A('hanging', ['decor', 'overhead'], [.5, .5, 2.8], hang, { solid: false, overhead: true, vb: HVB, variants: ['basket', 'salami', 'mobile', 'buoy', 'kite', 'plane'].map(kind => ({ kind })) }),
  A('hanglight', ['decor', 'overhead', 'lamp'], [.5, .5, 2.8], hang, { solid: false, overhead: true, vb: HVB, light: { x: .25, y: .25, z: 0, r: 2.6 }, variants: ['bulb', 'lantern', 'chandelier', 'shade', 'tube'].map(kind => ({ kind })) }),

  A('barrel', ['decor', 'browse'], [.5, .5, 1], p => {
    const c = p.c || '#8a5a3a'; cyl(.25, .25, 0, .2, .6, c, { t: p.top || dk(c, .35) }); for (const z of [.12, .46]) cyl(.25, .25, z, .21, .03, '#5a5f6a', { ol: false, t: '#5a5f6a' });
    if (p.fill) cyl(.25, .25, .6, .17, .03, p.fill, { ol: false, t: p.fill, t2: lt(p.fill, .3) }); if (p.tag) { qy(.12, .38, .47, .24, .4, '#f4f0e8'); lw([.16, .47, .32], [.34, .47, .32], '#c0392b'); }
  }),

  A('crate', ['decor', 'browse'], [1, .5, .8], p => {
    const w = p.c || '#c8a068', cols = p.items || ['#d63a3a', '#f28a30', '#6fb858'];
    const cr = (x, z, c) => { box(x, .02, z, .48, .46, .26, w, { l: PAT.siding(dk(w, .18), 4), r: PAT.siding(dk(w, .36), 4), t: heap(c, 9, x * 7) }); frameZ(x, x + .48, .02, .48, z + .26, dk(w, .4)); };
    cr(0, 0, cols[0]); cr(.5, 0, cols[1]); if (cols[2]) cr(.24, .28, cols[2]);
  }),

  /* ================= barber ================= */
  A('barber.armchair', ['seating', 'armchair', 'barber'], [1, 1, 1.5], p => {
    const c = p.c || '#a82a2a';
    cyl(.5, .5, 0, .3, .05, '#8a9098'); cyl(.5, .5, .05, .09, .3, CH, { ol: false });
    box(.22, .2, .55, .56, .12, .75, c); bx(.3, .2, 1.3, .4, .12, .16, dk(c, .12)); lw([.22, .32, 1.3], [.78, .32, 1.3], lt(c, .3));
    bx(.14, .3, .5, .08, .46, .24, CH); box(.2, .3, .38, .6, .5, .17, c, { t: lt(c, .14) }); bx(.78, .3, .5, .08, .46, .24, CH);
    lw([.3, .8, .12], [.3, .8, .38], CH); lw([.7, .8, .12], [.7, .8, .38], CH); bx(.26, .8, .1, .48, .14, .04, CH);
  }, { seats: [{ x: .5, y: .55, z: .5, dir: 1 }], use: { x: .5, y: 1.4 } }),

  A('barber.pole', ['decor', 'barber'], [.5, .5, 1.9], p => {
    cyl(.25, .25, 0, .15, .1, '#3a3f4c'); cyl(.25, .25, .1, .05, .8, CH, { ol: false }); cyl(.25, .25, .9, .13, .08, CH, { t: '#8a9098' });
    lit(() => { for (let i = 0; i < 10; i++) cyl(.25, .25, .98 + i * .06, .1, .06, ['#d63a3a', '#f4f0e8', '#3c64ad', '#f4f0e8'][i % 4], { ol: false, t: '#f4f0e8' }); for (let i = 0; i < 9; i++) spx(.25, .25, 1.0 + i * .065, (i % 4) - 2, 0, i % 2 ? '#3c64ad' : '#d63a3a'); });
    cyl(.25, .25, 1.58, .13, .07, CH, { t: '#8a9098' }); ball(.25, .25, 1.72, .08, CH);
  }, { light: { x: .25, y: .25, z: 0, r: 1.6 } }),

  A('barber.station', ['decor', 'barber', 'mirror'], p => [p.w || 1.5, .5, 2.2], p => {
    const w = p.w || 1.5, c = p.c || '#5a3a28', fr = p.fr || BR;
    mirrorY(.15, w - .15, .08, 1.0, 2.1, fr); if (p.bulbs) lit(() => { for (let x = .22; x < w - .2; x += .22) spx(x, .09, 2.14, 0, 0, '#ffe680'); });
    box(0, .1, 0, w, .4, .85, c); for (let i = 0; i < 2; i++) { const a = .08 + i * w / 2, b = a + w / 2 - .16; frameY(a, b, .5, .15, .72, dk(c, .35)); spx((a + b) / 2, .5, .5, 0, 0, fr); }
    bx(-.02, .08, .85, w + .04, .44, .05, p.top || lt(c, .4));
    bottle(.2, .3, .9, '#3c64ad', .12); bottle(.34, .32, .9, '#3f8a55', .1); bottle(.48, .28, .9, '#e8843a', .14); cyl(w - .3, .3, .9, .07, .16, '#9fd0e8', { ol: false, t: '#6fb6d8' }); post(w - .32, .3, 1.06, 1.2, INK); post(w - .27, .3, 1.06, 1.16, '#d63a3a'); bx(w - .7, .22, .9, .22, .12, .05, '#f1ede4');
  }, { use: p => ({ x: (p.w || 1.5) / 2, y: 1 }) }),

  /* ================= laundromat ================= */
  A('laundry.washer', ['laundry', 'laundry_machine'], [1, .5, 1.15], p => {
    const c = p.c || '#e4e8ea'; box(0, 0, 0, 1, .5, 1.08, c); qy(0, 1, .5, 0, .1, dk(c, .45)); qy(.04, .96, .5, .86, 1.02, dk(c, .14));
    qy(.08, .22, .5, .89, .99, '#3a3f4c'); for (let i = 0; i < 3; i++) spx(.4 + i * .1, .5, .94, 0, 0, '#5a6272'); lit(() => { spx(.84, .5, .95, 0, 0, p.on ? '#5af07a' : '#ff5a4a'); spx(.84, .5, .95, 1, 0, p.on ? '#5af07a' : '#ff5a4a'); });
    disc(.5, .5, .47, .31, '#8a9098'); disc(.5, .5, .47, .25, p.on ? '#9fd0e8' : '#3a4458');
    if (p.on) { fq([[.27, .5, .4], [.73, .5, .4], [.66, .5, .28], [.5, .5, .22], [.34, .5, .28]], '#d4eef2'); disc(.44, .5, .44, .08, p.load || '#e87aa0', 8); disc(.58, .5, .38, .07, '#f2c230', 8); }
    else if (p.load) disc(.5, .5, .4, .12, p.load, 8);
    lw([.36, .5, .64], [.44, .5, .7], '#f4fbfc'); if (p.num) textY(String(p.num), .08, .5, .84, '#3c64ad');
  }, { use: { x: .5, y: 1 } }),

  A('laundry.dryer', ['laundry', 'laundry_machine'], [1, .5, 2.1], p => {
    const c = p.c || '#d8dce0'; box(0, 0, 0, 1, .5, 2.05, c); qy(0, 1, .5, 0, .1, dk(c, .45)); qy(.04, .96, .5, .96, 1.12, dk(c, .16));
    for (let i = 0; i < 4; i++) spx(.2 + i * .12, .5, 1.05, 0, 0, '#5a6272'); lit(() => { spx(.8, .5, 1.06, 0, 0, '#f6e04a'); spx(.86, .5, 1.06, 0, 0, p.on ? '#5af07a' : '#ff5a4a'); });
    for (const [z, on, k] of [[.52, p.on, 0], [1.56, p.on2, 1]]) { disc(.5, .5, z, .34, '#8a9098'); disc(.5, .5, z, .28, on ? '#f6d8a0' : '#3a4458'); if (on) { disc(.42, .5, z - .08, .1, CLOTH[(k * 3 + (p.seed || 0)) % 9], 8); disc(.58, .5, z + .02, .09, CLOTH[(k * 3 + 4 + (p.seed || 0)) % 9], 8); } lw([.34, .5, z + .14], [.42, .5, z + .2], '#f4fbfc'); }
    if (p.num) textY(String(p.num), .06, .5, 2.0, '#c0392b');
  }, { use: { x: .5, y: 1 } }),

  A('laundry.foldtable', ['laundry', 'table', 'browse'], [2, 1, 1.2], p => {
    table(0, 0, 2, 1, .85, p.c || '#e8e2d4', { thick: true, leg: '#8a9098' });
    for (let i = 0; i < 3; i++) { const k = CLOTH[(i * 2 + (p.seed || 0)) % 9], h = .1 + hash2(i, 3, p.seed || 1) * .2; box(.1 + i * .42, .15 + (i % 2) * .3, .85, .36, .34, h, k, { l: PAT.stripes(dk(k, .18), dk(k, .3), 2), r: PAT.stripes(dk(k, .36), dk(k, .46), 2), ol: false }); }
    box(1.4, .25, .85, .5, .5, .3, '#6fb6d8', { t: heap2(CLOTH, 8, p.seed || 2) }); frameZ(1.4, 1.9, .25, .75, 1.15, '#3c64ad');
  }, { use: { x: 1, y: 1.5 } }),

  A('laundry.cart', ['laundry', 'decor'], [1, .5, 1.1], p => {
    posts(.06, .06, .88, .38, 0, .4, '#8a9098'); for (const [x, y] of [[.06, .44], [.94, .44], [.94, .06]]) spx(x, y, 0, 0, 0, INK);
    box(.03, .03, .35, .94, .44, .42, '#e8ecee', { l: wire('#8a9098', '#e8ecee'), r: wire('#7d858e', '#d0d4d8'), t: p.empty ? '#c4c9ce' : heap2(CLOTH, 7, p.seed || 1) }); frameZ(.03, .97, .03, .47, .77, '#8a9098');
    if (p.rail) { post(.06, .25, .77, 1.6, CH); post(.94, .25, .77, 1.6, CH); for (let x = .2; x < .85; x += .15) bx(x, .1, 1.05, .08, .3, .5, CLOTH[Math.floor(x * 20) % 9]); tube([.06, .25, 1.58], [.94, .25, 1.58], CH); }
  }, { size: p => [1, .5, p.rail ? 1.7 : 1.1] }),

  A('laundry.soap', ['laundry', 'vending'], [1, .5, 1.9], p => {
    const c = p.c || '#3c64ad'; box(0, 0, 0, 1, .5, 1.85, c); qy(0, 1, .5, 0, .1, dk(c, .5)); lit(() => signY(p.name || 'SOAP', .05, .95, .5, 1.5, 1.8, '#f4fbfc', c, { frame: false }));
    for (let i = 0; i < 4; i++) { const x = .08 + i * .22; qy(x, x + .18, .5, .85, 1.42, '#1e2630'); qy(x + .02, x + .16, .5, .95, 1.3, ['#f28a30', '#6fb6d8', '#f4b8c8', '#9ccc4a'][i]); qy(x + .04, x + .14, .5, 1.08, 1.18, '#f4fbfc'); qy(x + .04, x + .14, .5, .7, .8, '#8a9098'); }
    qy(.1, .9, .5, .25, .5, '#1e2630'); frameY(.1, .9, .5, .25, .5, '#8a9098');
  }, { use: { x: .5, y: 1 } }),

  /* ================= nail bar ================= */
  A('nail.tableset', ['seating', 'table', 'nails'], [1.5, 1, 1.3], p => {
    const a = p.a || '#e87aa0', c = p.c || '#f1ede4';
    table(0, .1, 1.5, .5, .75, c, { thick: true, leg: p.leg || BR });
    lamp(.18, .3, .75, .5, a, { base: BR }); for (let i = 0; i < 5; i++) { cyl(.5 + i * .11, .22, .75, .035, .08, POLISH[(i * 3 + (p.seed || 0)) % POLISH.length], { ol: false }); spx(.5 + i * .11, .22, .83, 0, -1, INK); }
    bx(.62, .34, .75, .32, .2, .05, a); box(1.14, .2, .75, .26, .26, .14, '#f4f0f4'); lit(() => qy(1.17, 1.37, .46, .77, .86, '#b07af8'));
    stool(.75, .85, .45, a, { leg: BR });
  }, { seats: [{ x: .75, y: .85, z: .45, dir: 3 }], staff: { x: .75, y: -.4, dir: 1 }, use: { x: .75, y: 1.4 } }),

  A('nail.polishwall', ['nails', 'shelf', 'browse'], p => [p.w || 2, .2, 1.25], p => {
    const w = p.w || 2; qy(0, w, .04, 0, 1.25, p.bg || '#fbf2f2'); frameY(0, w, .04, 0, 1.25, p.fr || BR);
    for (let r = 0; r < 4; r++) { const z = .08 + r * .29; bx(.05, .04, z, w - .1, .12, .02, p.sh || '#e8d0d0'); let i = 0; for (let x = .1; x < w - .12; x += .11, i++) { const c = POLISH[(i + r * 4 + (p.seed || 0)) % POLISH.length]; qy(x, x + .07, .16, z + .02, z + .14, c); qy(x + .02, x + .05, .16, z + .14, z + .2, INK); } }
  }, { wall: true, mount: 1, solid: false, use: p => ({ x: (p.w || 2) / 2, y: .8 }) }),

  A('nail.pedi.armchair', ['seating', 'armchair', 'nails'], [1, 1.5, 1.4], p => {
    const c = p.c || '#f4b8c8'; bx(0, 0, 0, 1, .95, .12, '#e8ecee'); sofa(0, 0, 1, .9, c);
    box(.18, 1.0, 0, .64, .45, .3, '#e8ecee', { t: '#9fd0e8', t2: '#d4eef2' }); lit(() => spx(.5, 1.2, .3, 0, 0, '#f4fbfc'));
  }, { seats: [{ x: .5, y: .55, z: .42, dir: 1 }], use: { x: 1.5, y: .6 } }),

  /* ================= tattoo ================= */
  A('tattoo.bench', ['seating', 'bench', 'tattoo'], [2, 1, 1.5], p => {
    const c = p.c || INK;
    box(.4, .3, 0, 1.2, .4, .4, '#8a9098'); qy(.4, 1.6, .7, 0, .06, '#5a6272');
    box(0, .15, .58, .55, .7, .22, c, { t: lt(c, .14) }); box(0, .15, .4, 2, .7, .16, c, { t: lt(c, .14) }); lw([.55, .85, .56], [.55, .85, .4], lt(c, .3)); lw([1.4, .85, .56], [1.4, .85, .4], lt(c, .3));
    bx(1.3, .86, .6, .5, .12, .05, c); post(1.55, .92, .2, .6, CH);
    post(.1, .1, .8, 1.45, CH); tube([.1, .1, 1.45], [.45, .3, 1.35], CH); lit(() => cyl(.45, .3, 1.27, .08, .06, '#fff2c4', { ol: false })); glow(() => cyl(.45, .3, 1.2, .16, .06, '#ffe6a0', { ol: false }));
  }, { seats: [{ x: 1.1, y: .5, z: .56, dir: 1 }], staff: { x: 1, y: -.4, dir: 1 }, use: { x: 1, y: 1.5 }, light: { x: .5, y: .5, z: 0, r: 1.8 } }),

  A('tattoo.cart', ['tattoo', 'decor'], [.5, .5, 1.1], p => {
    posts(.06, .06, .38, .38, 0, .85, CH); bx(.04, .04, .3, .42, .42, .03, '#8a9098'); bx(.04, .04, .82, .42, .42, .04, '#d8dce0');
    for (let i = 0; i < 5; i++) cyl(.12 + i * .07, .14, .86, .025, .06, RAINBOW[(i * 3 + (p.seed || 0)) % 16], { ol: false }); bx(.14, .3, .86, .2, .06, .05, INK); spx(.36, .33, .9, 0, -1, BR); bx(.1, .1, .33, .3, .3, .14, '#3c64ad');
  }),

  A('flash', ['tattoo', 'flash_wall', 'decor'], p => [p.w || 2, .1, 1.4], p => {
    const w = p.w || 2, n = Math.floor(w / .5), names = ['heart', 'dagger', 'rose', 'skull', 'swallow', 'anchor', 'star', 'snake'], pc = p.paper || '#f4e9cf';
    if (p.board) { qy(0, w, .03, 0, 1.4, p.board); frameY(0, w, .03, 0, 1.4, dk(p.board, .4)); }
    for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) { const x = .05 + i * .5, z = .06 + r * .68, s = (p.seed || 0) + i * 3 + r * 5;
      qy(x, x + .4, .04, z, z + .58, p.dark ? '#1e1a28' : pc); frameY(x, x + .4, .04, z, z + .58, p.dark ? '#5a4a6a' : INK);
      for (let k = 0; k < 4; k++) { const nm = names[(s + k * 3 + Math.floor(hash2(i, k, s) * 3)) % 8]; sprite(nm, x + .06 + (k % 2) * .17, .05, z + .12 + (k >> 1) * .24, p.dark ? { k: '#f4f0e8', s: '#4ad8f0', r: '#ff4a8a', g: '#5af07a', b: '#4ad8f0', y: '#f6e04a' } : null); } }
  }, { wall: true, mount: .85, solid: false, use: p => ({ x: (p.w || 2) / 2, y: .8 }) }),

  /* ================= records / comics ================= */
  A('record.bin', ['record_bin', 'shelf', 'browse'], [2, 1, 1.2], p => {
    const c = p.c || '#8a5a3a', pl = palOf(p.pal) || SLEEVE, s = p.seed || 1;
    posts(.08, .08, 1.84, .84, 0, .45, dk(c, .3));
    if (p.kind === 'box') { table(0, 0, 2, 1, .7, c, { thick: true }); for (let i = 0; i < 3; i++) { const x = .08 + i * .64; box(x, .06, .7, .54, .88, .3, '#f1ede4', { t: (wx, wy) => pl[Math.floor(hash2(Math.floor(wy * 26 + 60), i, s) * pl.length)] }); qy(x + .17, x + .37, .94, .8, .9, '#3a3f4c'); frameZ(x, x + .54, .06, .94, 1.0, '#b8b4a8'); } return; }
    box(0, 0, .45, 2, 1, .35, c, { l: PAT.planks(dk(c, .14), 5), r: PAT.planks(dk(c, .32), 5), t: INK });
    for (let i = 0; i < 4; i++) { const x = .05 + i * .49; box(x, .06, .8, .42, .86, .2, '#1e1a28', { ol: false, t: (wx, wy) => pl[Math.floor(hash2(Math.floor(wy * 22 + 60), i, s) * pl.length)] });
      const cc = pl[(i * 5 + s) % pl.length]; qy(x, x + .42, .94, .72, 1.14, cc); disc(x + .21, .94, .93, .11, i % 2 ? '#1e1a28' : lt(cc, .5)); disc(x + .21, .94, .93, .04, pl[(i * 3 + s + 2) % pl.length], 6); frameY(x, x + .42, .94, .72, 1.14, dk(cc, .4));
      qy(x + .1, x + .3, .5, 1.0, 1.1, '#f4f0e8'); }
    if (p.name) signY(p.name, .2, 1.8, 1, .5, .72, '#f4e9cf', INK, { frame: true });
  }, { use: { x: 1, y: 1.5 }, variants: [{}, { kind: 'box' }, { name: 'JAZZ', seed: 4 }] }),

  A('record.wall', ['decor', 'record_wall', 'browse'], p => [p.w || 2, .15, 1.3], p => {
    const w = p.w || 2, com = p.kind === 'comic', cw = com ? .34 : .44, ch = com ? .5 : .44, n = Math.floor((w - .04) / (cw + .06)), pl = palOf(p.pal) || SLEEVE, s = p.seed || 1;
    for (let r = 0; r < 2; r++) { const z = .04 + r * .64; bx(0, .03, z - .03, w, .1, .03, p.sh || '#5a3a28');
      for (let i = 0; i < n; i++) { const x = .05 + i * (cw + .06), a = pl[Math.floor(hash2(i, r, s) * pl.length)], b = pl[Math.floor(hash2(i, r, s + 7) * pl.length)], m = Math.floor(hash2(i, r, s + 3) * 5);
        qy(x, x + cw, .08, z, z + ch, a);
        if (com) { qy(x, x + cw, .08, z + ch - .12, z + ch, b); lw([x + .04, .08, z + ch - .06], [x + cw - .06, .08, z + ch - .06], '#f4f0e8'); sprite(m % 2 ? 'hero' : 'star', x + .1, .09, z + .04, { r: b, b: dk(a, .4) }); }
        else if (m === 0) disc(x + cw / 2, .08, z + ch / 2, .15, b); else if (m === 1) qy(x, x + cw, .08, z, z + ch / 2, b); else if (m === 2) fq([[x, .08, z], [x + cw, .08, z], [x + cw, .08, z + ch]], b); else if (m === 3) { for (let k = 0; k < 3; k++) qy(x + .04, x + cw - .04, .08, z + .06 + k * .13, z + .12 + k * .13, b); } else { qy(x + .1, x + cw - .1, .08, z + .1, z + ch - .1, b); disc(x + cw / 2, .08, z + ch / 2, .06, a, 6); }
        frameY(x, x + cw, .08, z, z + ch, dk(a, .45)); } }
  }, { wall: true, mount: 1, solid: false, use: p => ({ x: (p.w || 2) / 2, y: .8 }), variants: [{}, { kind: 'comic' }] }),

  A('record.listen', ['listening_station', 'music'], [1, .5, 1.6], p => {
    const c = p.c || '#5a3a28'; box(0, 0, 0, 1, .5, .8, c, { l: goods('mags', 1, { seed: p.seed || 3, back: '#2a1f18', board: dk(c, .2), pal: SLEEVE }) }); qy(0, 1, .5, 0, .1, dk(c, .5)); qy(0, 1, .5, .68, .8, dk(c, .1));
    bx(.08, .06, .8, .56, .38, .06, INK); cyl(.34, .25, .86, .16, .012, '#1e1a28', { ol: false, t: '#1e1a28', t2: '#3a3444' }); cyl(.34, .25, .872, .05, .01, p.a || '#d63a3a', { ol: false }); lw([.58, .12, .9], [.42, .22, .89], CH);
    post(.82, .25, .8, 1.45, CH); lw([.72, .25, 1.45], [.92, .25, 1.45], CH); lw([.72, .25, 1.45], [.72, .25, 1.3], INK); lw([.92, .25, 1.45], [.92, .25, 1.3], INK); bx(.68, .22, 1.2, .07, .07, .12, p.a || '#d63a3a'); bx(.89, .22, 1.2, .07, .07, .12, p.a || '#d63a3a');
    lit(() => spx(.14, .44, .84, 0, 0, '#5af07a'));
  }, { use: { x: .5, y: 1 } }),

  A('comic.figures', ['decor', 'display', 'browse'], [1, .5, 2], p => {
    const c = p.c || INK; box(0, 0, 0, 1, .5, .35, c); bx(0, 0, .35, 1, .06, 1.5, '#3a3444'); lit(() => qy(.04, .96, .1, .35, 1.85, '#d4eef2'));
    for (let r = 0; r < 3; r++) { const z = .37 + r * .5; bx(.04, .08, z + .0, .92, .38, .02, '#e8ecee'); for (let i = 0; i < 3; i++) { const cc = RAINBOW[(r * 5 + i * 3 + (p.seed || 0)) % 14]; sprite(['hero', 'rocket', 'teddy', 'skull'][(r + i + (p.seed || 0)) % 4], .16 + i * .28, .3, z + .03, { r: cc, b: dk(cc, .3) }); } }
    frameY(.02, .98, .5, .35, 1.85, CH); lw([.5, .5, .35], [.5, .5, 1.85], CH); box(0, 0, 1.85, 1, .5, .1, c); lit(() => qy(.1, .9, .5, 1.87, 1.93, '#f6e04a'));
  }, { use: { x: .5, y: 1 }, light: { x: .5, y: .6, z: 0, r: 1.4 } }),

  /* ================= pets ================= */
  A('pet.tanks', ['fish_tank', 'pets', 'browse'], p => [p.w || 2, .5, 2], p => {
    const w = p.w || 2, n = Math.round(w / .66), c = p.c || '#3a3f4c'; box(0, 0, 0, w, .5, 1.95, c); qy(0, w, .5, 0, .08, dk(c, .5));
    for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) { const x0 = .06 + i * (w - .06) / n, x1 = x0 + (w - .06) / n - .06, z = .5 + r * .72, s = (p.seed || 0) + i * 7 + r * 13;
      lit(() => { qy(x0, x1, .5, z, z + .56, '#3aa0c8', '#4ab4d8'); qy(x0, x1, .5, z, z + .06, ['#e8d8a0', '#f4b8c8', '#9ccc4a', '#c8a070'][s % 4]); qy(x0, x1, .5, z + .52, z + .56, '#d4f4fc');
        for (let k = 0; k < 2; k++) { const px_ = x0 + .08 + hash2(s, k, 2) * (x1 - x0 - .16); lw([px_, .5, z + .06], [px_, .5, z + .2 + hash2(s, k) * .2], '#3f8a55'); }
        for (let k = 0; k < 3; k++) sprite('fish', x0 + .04 + hash2(s, k, 5) * (x1 - x0 - .3), .5, z + .2 + hash2(s, k, 9) * .3, { o: ['#f28a30', '#f6e04a', '#ff5a4a', '#f4fbfc', '#b07af8'][(s + k) % 5] }); });
      frameY(x0, x1, .5, z, z + .56, '#1e2630'); }
    qy(.06, w - .06, .5, .14, .42, dk(c, .2)); if (p.name) signY(p.name, .2, w - .2, .5, .16, .4, '#f6e04a', INK, { frame: false });
  }, { use: p => ({ x: (p.w || 2) / 2, y: 1 }), light: { x: 1, y: .7, z: 0, r: 1.8, c: '#8ad8f0' } }),

  A('pet.cages', ['pets', 'pet_pen', 'browse'], p => [p.w || 2, .5, 2], p => {
    const w = p.w || 2, n = Math.round(w / .66), c = p.c || '#c8a068', kinds = p.kinds || ['ham', 'bun', 'bird', 'kit', 'ham', 'bird']; box(0, 0, 0, w, .5, 1.95, c); qy(0, w, .5, 0, .08, dk(c, .5));
    for (let r = 0; r < 3; r++) for (let i = 0; i < n; i++) { const x0 = .06 + i * (w - .06) / n, x1 = x0 + (w - .06) / n - .06, z = .14 + r * .6, k = kinds[(i + r * n + (p.seed || 0)) % kinds.length];
      qy(x0, x1, .5, z, z + .5, '#f4ead0'); qy(x0, x1, .5, z, z + .08, k === 'bird' ? '#d8d2c0' : '#e8c860'); if (k === 'bird') lw([x0 + .06, .5, z + .22], [x1 - .06, .5, z + .22], '#8a5a3a');
      sprite(k, x0 + .1 + hash2(i, r, 3) * (x1 - x0 - .4), .5, z + (k === 'bird' ? .24 : .08), k === 'bird' ? { y: ['#f2c230', '#6fb6d8', '#9ccc4a'][(i + r) % 3] } : k === 'kit' ? { k: ['#e8843a', '#3a3f4c', '#c8a070'][(i + r) % 3] } : null);
      for (let x = x0 + 3 * PX; x < x1 - PX; x += 3 * PX) lw([x, .5, z + .1], [x, .5, z + .5], '#b8bcc0'); frameY(x0, x1, .5, z, z + .5, '#7d858e'); }
  }, { use: p => ({ x: (p.w || 2) / 2, y: 1 }) }),

  A('pet.pen', ['pets', 'pet_pen'], [2, 1.5, .9], p => {
    const f = '#c4c9ce'; qz(0, 2, 0, 1.5, .01, '#e8dcb8', '#d8c8a0'); for (let x = 0; x <= 2.001; x += .25) post(x, 0, 0, .7, f); for (let y = 0; y <= 1.501; y += .25) post(0, y, 0, .7, f); lw([0, 0, .7], [2, 0, .7], f); lw([0, 0, .7], [0, 1.5, .7], f);
    cyl(.4, .4, .01, .13, .07, '#d63a3a', { t: '#6fb6d8' }); bx(1.3, .25, .01, .5, .4, .1, '#7a55b0'); ball(.9, 1.1, .08, .08, '#f2c230');
    const pc = p.pc || ['#c8a070', '#f1ede4', '#8a5a3a']; animal(.55, .6, .01, pc[0]); animal(1.4, .28, .1, pc[2]); animal(1.15, .95, .01, pc[1]);
    for (let x = 0; x <= 2.001; x += .25) post(x, 1.5, 0, .7, f); for (let y = 0; y <= 1.501; y += .25) post(2, y, 0, .7, f); lw([0, 1.5, .7], [2, 1.5, .7], f); lw([2, 0, .7], [2, 1.5, .7], f); lw([0, 1.5, .35], [2, 1.5, .35], f); lw([2, 0, .35], [2, 1.5, .35], f);
    if (p.name) signY(p.name, .5, 1.5, 1.5, .72, .98, '#f6e04a', INK, {});
  }, { use: { x: 1, y: 2 } }),

  A('pet.birdcage', ['pets', 'pet_pen', 'decor'], [.5, .5, 1.9], p => {
    const g = p.c || BR; cyl(.25, .25, 0, .16, .04, g); post(.25, .25, .04, 1.0, g); cyl(.25, .25, 1.0, .21, .04, g, { t: '#e8dcb8' });
    for (let i = 0; i < 4; i++) { const a = (i / 8 + .55) * TAU; lw([.25 + Math.cos(a) * .2, .25 + Math.sin(a) * .2, 1.04], [.25 + Math.cos(a) * .2, .25 + Math.sin(a) * .2, 1.6], g); }
    lw([.12, .25, 1.25], [.38, .25, 1.25], '#8a5a3a'); sprite('bird', .2, .25, 1.26, { y: p.bird || '#3fae6a', o: '#f2c230' });
    for (let i = 0; i < 5; i++) { const a = (i / 8 + .05) * TAU; lw([.25 + Math.cos(a) * .2, .25 + Math.sin(a) * .2, 1.04], [.25 + Math.cos(a) * .2, .25 + Math.sin(a) * .2, 1.6], g); }
    cyl(.25, .25, 1.6, .21, .03, g, { ol: false }); ball(.25, .25, 1.66, .12, g, { squash: .6 }); spx(.25, .25, 1.8, 0, 0, g);
  }),

  A('pet.foodbags', ['pets', 'shelf', 'browse'], [1, .5, 1.2], p => {
    const cs = p.cs || ['#d63a3a', '#3c64ad', '#3f8a55', '#f2c230'];
    for (let i = 0; i < 4; i++) { const x = (i % 2) * .5, z = (i >> 1) * .5, c = cs[(i + (p.seed || 0)) % cs.length]; if (i === 3 && p.three) break; box(x + .02, .04, z, .46, .42, .48, c, { t: lt(c, .2) }); qy(x + .1, x + .4, .46, z + .14, z + .38, '#f4f0e8'); sprite('heart', x + .2, .47, z + .2, { r: c }); lw([x + .02, .46, z + .44], [x + .48, .46, z + .44], dk(c, .3)); }
  }, { use: { x: .5, y: 1 } }),

  /* ================= toys ================= */
  A('toy.tower', ['toy_demo', 'display', 'browse'], [1.5, 1.5, 2.5], p => {
    const cs = p.cs || ['#d63a3a', '#f2c230', '#3c64ad'];
    cyl(.75, .75, 0, .72, .5, cs[0], { t: lt(cs[0], .25) }); for (let i = 0; i < 8; i++) spx(.75, .75, .25, Math.round((i - 3.5) * 5), 3 - Math.abs(i - 3.5), '#f4f0e8');
    cyl(.75, .75, .5, .5, .5, cs[1], { t: lt(cs[1], .25) }); cyl(.75, .75, 1.0, .3, .5, cs[2], { t: lt(cs[2], .25) });
    box(.63, .63, 1.5, .24, .24, .32, '#c4c9ce'); lit(() => { qy(.67, .83, .87, 1.6, 1.72, '#d63a3a'); spx(.75, .87, 1.66, 0, 0, '#f6e04a'); }); box(.66, .66, 1.82, .18, .18, .18, '#aab2ba'); lit(() => { spx(.72, .84, 1.93, 0, 0, '#5af0f0'); spx(.8, .84, 1.93, 0, 0, '#5af0f0'); }); post(.75, .75, 2.0, 2.14, '#8a9098'); lit(() => spx(.75, .75, 2.15, 0, 0, '#ff5a4a'));
    bx(.55, .7, 1.56, .08, .08, .2, '#8a9098'); bx(.87, .7, 1.56, .08, .08, .2, '#8a9098');
    ball(.4, 1.05, 1.1, .1, '#e87aa0'); sprite('teddy', .75, 1.12, 1.0, null); box(1.05, .95, 1.0, .14, .14, .14, '#3f8a55'); box(1.08, .98, 1.14, .1, .1, .1, '#f2c230');
    sprite('duck', .2, 1.05, .5, null); ball(.5, 1.3, .6, .11, '#3c64ad'); sprite('rocket', .8, 1.36, .5, null); box(1.1, 1.2, .5, .16, .16, .16, '#d63a3a'); sprite('teddy', 1.33, .95, .5, { b: '#f1ede4', w: '#e87aa0' }); ball(1.3, .6, .6, .1, '#f2c230');
  }, { use: { x: .75, y: 2 } }),

  A('toy.cubby', ['shelf', 'browse'], p => [p.w || 2, .5, 2], p => {
    const w = p.w || 2, n = Math.round(w / .5), c = p.c || '#f1ede4', s = p.seed || 0, bk = [K.sky, '#f6e08a', '#f4b8c8', '#b8e0a8']; box(0, 0, 0, w, .5, 1.95, c); qy(0, w, .5, 0, .1, dk(c, .4));
    for (let r = 0; r < 4; r++) for (let i = 0; i < n; i++) { const x0 = .05 + i * (w - .05) / n, x1 = x0 + (w - .05) / n - .05, z = .14 + r * .45, k = Math.floor(hash2(i, r, s) * 6), cc = PALS.toy[(i + r * 3 + s) % 8];
      qy(x0, x1, .5, z, z + .4, bk[(i + r + s) % 4]); const mx = (x0 + x1) / 2;
      if (k === 0) disc(mx, .5, z + .13, .12, cc, 10); else if (k === 1) sprite('teddy', mx - .1, .5, z, { b: i % 2 ? '#8a5a3a' : '#c8a070' }); else if (k === 2) { qy(mx - .15, mx, .5, z, z + .14, cc); qy(mx, mx + .15, .5, z, z + .14, PALS.toy[(i + r + 3) % 8]); qy(mx - .07, mx + .08, .5, z + .14, z + .28, PALS.toy[(i + r + 5) % 8]); }
      else if (k === 3) sprite('duck', mx - .1, .5, z, null); else if (k === 4) sprite('rocket', mx - .1, .5, z, { r: cc }); else { qy(mx - .15, mx + .15, .5, z, z + .3, cc); qy(mx - .1, mx + .1, .5, z + .08, z + .2, '#f4f0e8'); }
      frameY(x0, x1, .5, z, z + .4, dk(c, .3)); }
  }, { use: p => ({ x: (p.w || 2) / 2, y: 1 }) }),

  A('toy.traintable', ['toy_demo', 'table'], [2, 1.5, 1], p => {
    table(0, 0, 2, 1.5, .6, '#8a5a3a', { thick: true, top: { t: '#6fb858', t2: '#7cc464' } }); qz(1.3, 1.8, .9, 1.3, .61, '#6fb6d8');
    const lp = [[.3, .2], [1.7, .2], [1.85, .5], [1.7, 1.25], [.3, 1.25], [.15, .75]]; for (let i = 0; i < 6; i++) { const a = lp[i], b = lp[(i + 1) % 6]; lw([a[0], a[1], .61], [b[0], b[1], .61], '#5a4a3a'); lw([a[0], a[1] + .05, .61], [b[0], b[1] + .05, .61], '#5a4a3a'); }
    ball(.6, .6, .68, .16, '#8a7a5a', { squash: .6 }); ball(.9, .5, .72, .1, '#3f8a55'); ball(1.2, .7, .7, .08, '#3f8a55'); box(1.45, .45, .6, .2, .16, .16, '#f1ede4', { t: '#d63a3a' });
    box(.5, 1.18, .62, .2, .12, .14, '#d63a3a'); bx(.54, 1.2, .76, .06, .06, .06, INK); box(.74, 1.18, .62, .18, .12, .1, '#3c64ad'); box(.96, 1.18, .62, .18, .12, .1, '#f2c230'); box(1.18, 1.18, .62, .18, .12, .1, '#3f8a55');
  }, { use: { x: 1, y: 2 } }),

  A('toy.robot', ['decor', 'display'], [1, .5, 2], p => {
    const c = p.c || '#d63a3a', m = '#aab2ba'; box(.26, .14, 0, .18, .24, .5, m); box(.56, .14, 0, .18, .24, .5, m); bx(.22, .12, 0, .26, .3, .08, '#5a6272'); bx(.52, .12, 0, .26, .3, .08, '#5a6272');
    bx(.08, .18, .7, .12, .16, .55, m); box(.2, .08, .5, .6, .36, .8, c); lit(() => { qy(.3, .7, .44, .85, 1.15, '#1e2630'); for (let i = 0; i < 3; i++) spx(.38 + i * .12, .44, 1.0, 0, 0, ['#5af07a', '#f6e04a', '#ff5a4a'][i]); lw([.34, .44, .92], [.66, .44, .92], '#5af0f0'); }); disc(.5, .44, .66, .07, '#f2c230', 8);
    bx(.7, .18, .7, .12, .16, .55, m); bx(.68, .16, .64, .16, .2, .08, '#d63a3a'); bx(.06, .16, .64, .16, .2, .08, '#d63a3a');
    box(.3, .12, 1.3, .4, .28, .36, m); lit(() => { qy(.36, .44, .4, 1.46, 1.56, '#f6e04a'); qy(.56, .64, .4, 1.46, 1.56, '#f6e04a'); }); qy(.38, .62, .4, 1.36, 1.4, INK); post(.5, .26, 1.66, 1.86, '#8a9098'); lit(() => ball(.5, .26, 1.9, .05, '#ff5a4a', { ol: false }));
  }, { light: { x: .5, y: .5, z: 0, r: 1.2 } }),

  /* ================= florist ================= */
  A('flower.buckets', ['flower_display', 'flowers', 'browse'], p => [p.w || 2, 1, 1.5], p => {
    const w = p.w || 2, c = p.c || '#5a8a6a', n = Math.round(w / .5), s = p.seed || 0, pl = palOf(p.pal) || FLW;
    box(0, 0, 0, w, .34, .7, c); for (let i = 0; i < n; i++) bucket(.25 + i * .5, .17, .7, pl[(i * 3 + s) % pl.length], p.m);
    box(0, .34, 0, w, .33, .4, c); for (let i = 0; i < n; i++) bucket(.25 + i * .5, .5, .4, pl[(i * 3 + s + 1) % pl.length], p.m);
    box(0, .67, 0, w, .33, .1, c); for (let i = 0; i < n; i++) bucket(.25 + i * .5, .83, .1, pl[(i * 3 + s + 2) % pl.length], p.m);
  }, { use: p => ({ x: (p.w || 2) / 2, y: 1.5 }) }),

  A('flower.coldcase', ['flower_display', 'flowers', 'fridge', 'browse'], p => [p.w || 2, .5, 2.1], p => {
    const w = p.w || 2, c = p.c || '#2f4a3a', n = Math.round(w / .66), s = p.seed || 0; box(0, 0, 0, w, .5, 2.05, c); qy(0, w, .5, 0, .14, dk(c, .4));
    lit(() => qy(.06, w - .06, .5, .18, 1.6, '#d4eef2', '#e4f6f8'));
    for (let r = 0; r < 2; r++) { const z = .2 + r * .72; lw([.06, .5, z + .0], [w - .06, .5, z], '#8a9098'); for (let x = .22; x < w - .15; x += .3) { const k = FLW[Math.floor(hash2(Math.round(x * 10), r, s) * 8)]; lit(() => { qy(x - .05, x + .05, .5, z + .01, z + .2, '#9fd0e8'); }); bouquet(x, .46, z + .2, k, 1.15); } }
    for (let i = 0; i <= n; i++) { const x = .06 + (w - .12) * i / n; lw([x, .5, .18], [x, .5, 1.6], '#5a6672'); if (i < n) lw([x + .06, .5, .8], [x + .06, .5, 1.1], '#f4fbfc'); } frameY(.06, w - .06, .5, .18, 1.6, '#5a6672');
    lit(() => signY(p.name || 'FRESH CUT', 0, w, .5, 1.64, 2.02, p.hc || '#3f8a55', '#f4fbfc', { frame: false }));
  }, { use: p => ({ x: (p.w || 2) / 2, y: 1 }), light: { x: 1, y: .7, z: 0, r: 1.6 } }),

  A('flower.worktable', ['flowers', 'counter', 'table'], [2, 1, 1.5], p => {
    const c = p.c || '#b07444'; table(0, 0, 2, 1, .85, c, { thick: true }); bx(.1, .1, .25, 1.8, .8, .04, dk(c, .15)); cyl(.4, .5, .29, .12, .3, '#aab2ba', { ol: false }); cyl(.75, .5, .29, .12, .3, '#aab2ba', { ol: false }); bouquet(.4, .5, .5, '#f2c230'); bouquet(.75, .5, .5, '#e87aa0');
    post(.12, .25, .85, 1.15, '#5a3a28'); post(.62, .25, .85, 1.15, '#5a3a28'); cyl(.37, .25, 1.07, .0, 0, c); bx(.12, .18, 1.06, .5, .14, .14, p.paper || '#c99a62'); qy(.14, .6, .32, .86, 1.06, lt(p.paper || '#c99a62', .15));
    for (let i = 0; i < 3; i++) cyl(.95 + i * .15, .22, .85, .05, .08 + (i % 2) * .05, ['#d63a3a', '#f2c230', '#3c64ad'][i], { ol: false });
    ball(1.2, .6, .9, .12, '#3f7a48', { ol: false, squash: .5 }); for (let i = 0; i < 4; i++) spx(1.2, .6, .93, i * 2 - 3, -(i % 2), FLW[i]); qz(1.0, 1.45, .45, .8, .86, '#f4e9cf');
    cyl(1.7, .4, .85, .09, .26, '#6fb6d8', { ol: false, t: '#3aa0c8' }); bouquet(1.7, .4, 1.08, p.a || '#d63a3a', 1.3);
  }, { staff: { x: 1, y: -.5, dir: 1 }, use: { x: 1, y: 1.5 } }),

  A('flower.cart', ['flower_display', 'flowers', 'browse'], [2, 1, 2.2], p => {
    const c = p.c || '#8a5a3a', a = p.a || '#d63a3a'; post(.08, .08, 0, 1.95, c); post(1.92, .08, 0, 1.95, c);
    box(.1, .1, .5, 1.8, .8, .28, c, { l: PAT.planks(dk(c, .14), 5), r: PAT.planks(dk(c, .32), 5), t: '#3a2a20' });
    for (let j = 0; j < 2; j++) for (let i = 0; i < 5; i++) bouquet(.3 + i * .35, .32 + j * .36, .72, FLW[(i * 3 + j * 5 + (p.seed || 0)) % 8], 1.25);
    disc(.45, 1, .32, .32, '#3a2a20', 14); disc(.45, 1, .32, .25, c, 12); disc(.45, 1, .32, .06, BR, 6); disc(1.55, 1, .32, .32, '#3a2a20', 14); disc(1.55, 1, .32, .25, c, 12); disc(1.55, 1, .32, .06, BR, 6);
    for (const q of [0, .25, .5, .75]) { const an = q * TAU; for (const cx of [.45, 1.55]) lw([cx - Math.cos(an) * .24, 1, .32 - Math.sin(an) * .24], [cx + Math.cos(an) * .24, 1, .32 + Math.sin(an) * .24], '#3a2a20'); }
    post(.08, .92, 0, 1.95, c); post(1.92, .92, 0, 1.95, c);
    box(-.05, -.05, 1.95, 2.1, 1.1, .08, a, { t: (x, y) => (Math.floor(x * 4 + 40) % 2 ? a : '#f4f0e8'), l: PAT.vstripes(a, '#f4f0e8', 4), r: dk(a, .3) }); qy(-.05, 2.05, 1.05, 1.82, 1.95, PAT.vstripes(a, '#f4f0e8', 4));
  }, { use: { x: 1, y: 1.5 }, vb: [-.4, -.4, 0, 2.4, 1.4, 2.4] }),

  /* ================= hardware / chandlery ================= */
  A('hw.pegwall', ['shelf', 'browse', 'tools'], p => [p.w || 2, .15, 1.5], p => {
    const w = p.w || 2, c = p.c || '#c8a068', names = ['hammer', 'saw', 'wrench', 'pliers', 'driver', 'wrench', 'hammer', 'driver']; qy(0, w, .03, 0, 1.5, (u, v) => (u % 4 === 2 && v % 4 === 2) ? dk(c, .35) : c); frameY(0, w, .03, 0, 1.5, dk(c, .45));
    for (let r = 0; r < 3; r++) { let i = 0; for (let x = .12; x < w - .2; x += .3, i++) sprite(names[(i + r * 3 + (p.seed || 0)) % 8], x, .05, .14 + r * .46 + (i % 2) * .06, { y: ['#f2c230', '#d63a3a', '#3c64ad'][(i + r) % 3], w: '#b07444' }); }
  }, { wall: true, mount: .9, solid: false, use: p => ({ x: (p.w || 2) / 2, y: .8 }) }),

  A('hw.bins', ['shelf', 'browse', 'tools'], p => [p.w || 2, .5, 1.7], p => {
    const w = p.w || 2, c = p.c || '#5a6272'; box(0, 0, 0, w, .5, 1.65, c, { l: (u, v, W_, H_) => { if (v < 2) return dk(c, .5); const cu = u % 6, cv = v % 5; if (cu === 0 || cv === 0) return dk(c, .3); if (cv === 2 && (cu === 2 || cu === 3)) return '#f4f0e8'; return ['#d8dce0', '#c4c9ce', '#e8843a', '#3c64ad', '#f2c230', '#d63a3a'][Math.floor(hash2(Math.floor(u / 6), Math.floor(v / 5), p.seed || 1) * (v > H_ * .55 ? 2 : 6))]; } });
    if (p.name) signY(p.name, .1, w - .1, .5, 1.36, 1.6, '#f2c230', INK, {});
  }, { use: p => ({ x: (p.w || 2) / 2, y: 1 }) }),

  A('hw.paint', ['shelf', 'browse'], p => [p.w || 1.5, .5, 2], p => {
    const w = p.w || 1.5, c = p.c || '#e8e2d4'; box(0, 0, 0, w, .5, 1.95, c); qy(0, w, .5, 0, .08, dk(c, .45));
    for (let r = 0; r < 4; r++) { const z = .12 + r * .36; qy(.04, w - .04, .5, z, z + .32, '#3a3444'); let i = 0; for (let x = .08; x < w - .2; x += .22, i++) { const k = RAINBOW[(i * 2 + r * 5 + (p.seed || 0)) % 14]; qy(x, x + .18, .5, z + .02, z + .24, '#c4c9ce'); qy(x, x + .18, .5, z + .08, z + .18, k); lw([x, .5, z + .24], [x + .18, .5, z + .24], '#8a9098'); } }
    const z = 1.58; for (let i = 0; i < Math.floor((w - .1) / .1); i++) qy(.06 + i * .1, .14 + i * .1, .5, z, z + .32, RAINBOW[i % 14], lt(RAINBOW[i % 14], .3));
  }, { use: p => ({ x: (p.w || 1.5) / 2, y: 1 }) }),

  A('hw.rope', ['shelf', 'browse'], [1.5, .5, 1.7], p => {
    const c = '#6a4a30'; posts(.04, .06, 1.42, .38, 0, 1.65, c);
    for (let r = 0; r < 3; r++) { const z = .2 + r * .5; tube([.04, .25, z + .16], [1.46, .25, z + .16], '#8a9098'); for (let i = 0; i < 3; i++) { const k = [['#d8c090', '#c8a878'], ['#3c64ad', '#f1ede4'], ['#e8643a', '#f2c230'], ['#f1ede4', '#d8dce0'], ['#3f8a55', '#2a5a3a']][(i + r * 2 + (p.seed || 0)) % 5], x = .28 + i * .46;
      disc(x, .46, z + .16, .2, k[0], 12); for (const rr of [.15, .1]) for (let q = 0; q < 10; q++) spx(x + Math.cos(q / 10 * TAU) * rr, .46, z + .16 + Math.sin(q / 10 * TAU) * rr, 0, 0, k[1]); disc(x, .46, z + .16, .05, '#5a4a3a', 6); if (i === 1) lw([x + .18, .46, z + .1], [x + .2, .46, z - .12], k[0]); } }
  }, { use: { x: .75, y: 1 } }),

  A('hw.lumber', ['shelf', 'browse'], [1, .5, 2.2], p => {
    const c = '#5a6272'; box(0, 0, 0, 1, .5, .12, c); post(.04, .06, 0, 2.1, c); post(.96, .06, 0, 2.1, c);
    for (let i = 0; i < 7; i++) { const x = .08 + i * .12, h = 1.5 + hash2(i, 2, p.seed || 1) * .6, k = p.pipes ? (i % 3 ? '#b8bcc0' : '#c8683f') : ['#d8b07a', '#c99a62', '#e0c090'][i % 3]; bx(x, .12 + (i % 2) * .06, .12, .1, .1, h, k); }
    post(.04, .44, 0, 1.2, c); post(.96, .44, 0, 1.2, c); lw([.04, .44, 1.2], [.96, .44, 1.2], c); lw([.04, .44, .6], [.96, .44, .6], c);
  }, { use: { x: .5, y: 1 } }),

  A('hw.lifering', ['decor'], [1, .1, 1], p => {
    if (p.kind === 'anchor') { const c = '#3a3f4c'; tube([.5, .05, .15], [.5, .05, .85], c); tube([.3, .05, .7], [.7, .05, .7], c); disc(.5, .05, .9, .07, c, 8); disc(.5, .05, .9, .03, p.bg || '#e8dcc0', 6); for (let i = 0; i <= 8; i++) { const a = Math.PI + i / 8 * Math.PI; spx(.5 + Math.cos(a) * .3, .05, .42 + Math.sin(a) * .3, 0, 0, c); spx(.5 + Math.cos(a) * .3, .05, .42 + Math.sin(a) * .3, 0, 1, c); } return; }
    if (p.kind === 'oars') { tube([.1, .05, .1], [.85, .05, .9], '#c8a068'); tube([.9, .05, .1], [.15, .05, .9], '#c8a068'); fq([[.02, .05, .0], [.2, .05, .06], [.14, .05, .22], [.0, .05, .14]], '#d63a3a'); fq([[.98, .05, .0], [.8, .05, .06], [.86, .05, .22], [1, .05, .14]], '#3c64ad'); return; }
    disc(.5, .05, .5, .42, '#f1ede4', 16); for (const a of [0, .25, .5, .75]) { const an = a * TAU + .4; fq([[.5 + Math.cos(an) * .42, .05, .5 + Math.sin(an) * .42], [.5 + Math.cos(an + .5) * .42, .05, .5 + Math.sin(an + .5) * .42], [.5 + Math.cos(an + .5) * .22, .05, .5 + Math.sin(an + .5) * .22], [.5 + Math.cos(an) * .22, .05, .5 + Math.sin(an) * .22]], p.c || '#d63a3a'); } disc(.5, .05, .5, .22, p.bg || '#e8dcc0', 12);
  }, { wall: true, mount: 1.2, solid: false, variants: [{}, { kind: 'anchor' }, { kind: 'oars' }] }),

  /* ================= pharmacy ================= */
  A('rx.counter', ['till', 'checkout', 'counter', 'pharmacy'], [3, .5, 2.1], p => {
    const g = p.a || '#3f8a55'; counter(0, 0, 3, .5, 1.05, p.c || '#f1ede4', '#d8dce0', { stripe: g });
    lit(() => qy(.1, 1.9, .3, 1.08, 1.68, '#d4eef2', '#e8f8fa')); frameY(.1, 1.9, .3, 1.08, 1.68, '#8a9098'); lw([1, .3, 1.08], [1, .3, 1.68], '#8a9098'); qy(.7, 1.3, .3, 1.08, 1.2, '#3a3f4c');
    till(2.3, .1, 1.05); bx(2.75, .15, 1.05, .16, .2, .22, '#f1ede4'); lw([2.77, .35, 1.2], [2.89, .35, 1.2], g); cyl(.4, .25, 1.05, .05, .1, '#e8843a', { ol: false, t: '#f1ede4' }); cyl(.55, .25, 1.05, .05, .1, '#e8843a', { ol: false, t: '#f1ede4' });
    box(0, .1, 1.72, 3, .3, .34, g); lit(() => { signY(p.name || 'PHARMACY', .5, 3, .4, 1.72, 2.06, g, '#f4fbfc', { frame: false }); qy(.14, .38, .4, 1.84, 1.94, '#f4fbfc'); qy(.21, .31, .4, 1.77, 2.01, '#f4fbfc'); });
  }, { staff: { x: 2.3, y: -.5, dir: 1 }, use: { x: 2.3, y: 1 } }),

  A('rx.cross', ['decor', 'sign'], [1, .1, 1], p => { const g = p.c || '#3fae6a'; glow(() => { qy(.3, .7, .04, .02, .98, dk(g, .3)); qy(.02, .98, .04, .3, .7, dk(g, .3)); }); lit(() => { qy(.36, .64, .05, .08, .92, g); qy(.08, .92, .05, .36, .64, g); qy(.42, .58, .06, .14, .86, lt(g, .4)); qy(.14, .86, .06, .42, .58, lt(g, .4)); });
  }, { wall: true, mount: 1.5, solid: false, light: { x: .5, y: .6, z: 0, r: 1.6, c: '#8af0a0' } }),

  /* ================= stationery / post ================= */
  A('pen.wall', ['shelf', 'browse', 'pen_tester'], p => [p.w || 2, .2, 1.4], p => {
    const w = p.w || 2, c = p.c || '#5a3a28'; qy(0, w, .04, 0, 1.4, c); frameY(0, w, .04, 0, 1.4, dk(c, .4));
    for (let r = 0; r < 3; r++) { const z = .1 + r * .42; bx(.05, .04, z, w - .1, .14, .08, lt(c, .25)); let i = 0; for (let x = .1; x < w - .1; x += 2 * PX, i++) { if (i % 9 === 8) continue; const k = RAINBOW[(Math.floor(i / 3) + r * 4 + (p.seed || 0)) % 14]; lw([x, .12, z + .08], [x, .12, z + .26 + (i % 3) * PX], k); spx(x, .12, z + .27 + (i % 3) / 16, 0, -1, INK); } }
    qy(w / 2 - .3, w / 2 + .3, .19, .02, .12, '#f4f0e8'); lw([w / 2 - .24, .19, .07], [w / 2 + .1, .19, .07], '#3c64ad'); lw([w / 2 - .2, .19, .05], [w / 2 + .2, .19, .05], '#d63a3a');
  }, { wall: true, mount: .85, solid: false, use: p => ({ x: (p.w || 2) / 2, y: .8 }) }),

  A('post.boxes', ['decor', 'browse'], p => [p.w || 2, .15, 1.3], p => {
    const w = p.w || 2, c = p.c || '#b8904a'; qy(0, w, .04, 0, 1.3, (u, v) => { const cu = u % 5, cv = v % 5; if (cu === 0 || cv === 0) return dk(c, .45); if (cu === 2 && cv === 2) return '#3a2a20'; if (cv === 4) return lt(c, .3); return c; }); frameY(0, w, .04, 0, 1.3, '#5a3a28');
    if (p.name) signY(p.name, .2, w - .2, .05, 1.06, 1.26, '#5a3a28', '#f6e8c0', { frame: false });
  }, { wall: true, mount: .9, solid: false }),

  A('paper.rolls', ['shelf', 'browse'], [1, .5, 1.6], p => {
    const c = p.c || '#8a5a3a'; box(0, 0, 0, 1, .5, .7, c, { t: '#3a2a20' }); qy(.06, .94, .5, .1, .6, dk(c, .2));
    for (let i = 0; i < 7; i++) { const x = .1 + (i % 4) * .22 + (i > 3 ? .11 : 0), y = i > 3 ? .34 : .16, h = .6 + hash2(i, 4, p.seed || 1) * .35, k = RAINBOW[(i * 3 + (p.seed || 0)) % 14]; cyl(x, y, .5, .07, h, k, { ol: false, t: '#f4f0e8' }); for (let q = 0; q < 3; q++) spx(x, y, .7 + q * .2, -1, 0, lt(k, .4)); }
  }, { use: { x: .5, y: 1 } }),

  A('writing.desk', ['table', 'display', 'pen_tester', 'browse'], [2, 1, 1.5], p => {
    const c = p.c || '#6a3a28'; table(0, 0, 2, 1, .8, c, { thick: true }); box(0, 0, .8, 2, .3, .4, c); for (let i = 0; i < 5; i++) { frameY(.06 + i * .38, .38 + i * .38, .3, .84, 1.16, dk(c, .35)); spx(.22 + i * .38, .3, 1.0, 0, 0, BR); }
    qz(.5, 1.3, .4, .9, .81, '#2f5a48'); qz(.7, 1.1, .5, .8, .82, '#f4f0e8'); lw([.75, .6, .82], [1.0, .6, .82], '#3c64ad'); cyl(.3, .6, .8, .06, .1, '#2a2a5a', { ol: false, t: INK }); post(.34, .6, .9, 1.15, '#f1ede4'); cyl(1.5, .5, .8, .07, .14, BR, { ol: false, t: '#3a2a20' }); for (let i = 0; i < 4; i++) post(1.46 + i * .03, .5, .94, 1.12 + (i % 2) * .05, RAINBOW[i * 3]);
    lamp(1.8, .2, 1.2, .3, '#3f8a55', { base: BR }); box(.1, .5, .8, .3, .22, .1, '#a83a3a', { ol: false }); box(.12, .52, .9, .26, .2, .06, '#2f5f8f', { ol: false });
  }, { use: { x: 1, y: 1.5 }, light: { x: 1.8, y: .4, z: 0, r: 1.5 } }),

  /* ================= art supply ================= */
  A('art.paintrack', ['shelf', 'browse'], p => [p.w || 2, .5, 2], p => {
    const w = p.w || 2, c = p.c || '#3a3f4c'; box(0, 0, 0, w, .5, 1.95, c); qy(0, w, .5, 0, .08, dk(c, .5));
    qy(.05, w - .05, .5, .12, 1.9, (u, v, W_, H_) => { const cu = u % 3, cv = v % 6; if (cv === 0) return '#cfc8b4'; if (cu === 2) return '#2a2733'; const k = RAINBOW[Math.min(13, Math.floor(u / W_ * 14))], row = Math.floor(v / 6); return cv === 5 ? '#f4f0e8' : cv >= 3 ? k : (row % 2 ? lt(k, .25) : dk(k, .18)); });
  }, { use: p => ({ x: (p.w || 2) / 2, y: 1 }) }),

  A('art.canvases', ['shelf', 'browse'], [1, .5, 1.6], p => {
    bx(0, .3, 0, 1, .2, .08, '#8a5a3a'); for (let i = 0; i < 5; i++) { const h = 1.5 - i * .22, wv = .95 - i * .12; box(.02, .06 + i * .08, .06, wv, .05, h, '#f4f0e8', { r: '#c8a878', ol: i === 4 }); }
    const ks = p.cs || ['#6fb6d8', '#f2c230']; qy(.06, .44, .43, .1, .58, ks[0]); qy(.06, .44, .43, .1, .3, '#3f8a55'); disc(.34, .43, .46, .06, ks[1], 8);
  }, { use: { x: .5, y: 1 } }),

  A('art.flatfile', ['shelf', 'browse', 'table'], [2, 1, 1.3], p => {
    const c = p.c || '#8a9098'; box(0, 0, 0, 2, 1, .9, c, { l: (u, v) => v % 4 === 0 ? dk(c, .35) : (u % 16 > 6 && u % 16 < 10 && v % 4 === 2) ? '#e8ecee' : c });
    qz(.1, .9, .15, .8, .91, '#f4f0e8'); qz(.2, .8, .25, .7, .92, '#9fd0e8'); cyl(1.3, .4, .9, .09, .16, '#c0704a', { ol: false, t: '#3a2a20' }); for (let i = 0; i < 5; i++) { post(1.25 + i * .025, .4, 1.06, 1.28 - (i % 2) * .05, '#c8a068'); spx(1.25 + i * .025, .4, 1.3 - (i % 2) * .05, 0, 0, RAINBOW[i * 3]); }
    for (let i = 0; i < 4; i++) cyl(1.6 + (i % 2) * .16, .3 + (i >> 1) * .2, .9, .06, .1, RAINBOW[i * 4 + 1], { ol: false, t: lt(RAINBOW[i * 4 + 1], .3) }); bx(1.1, .7, .9, .5, .16, .04, '#d2a26a'); for (let i = 0; i < 6; i++) spx(1.15 + i * .07, .78, .95, 0, 0, RAINBOW[i * 2]);
  }, { use: { x: 1, y: 1.5 } }),

  /* ================= gallery ================= */
  A('gal.plinth', ['artwork', 'display'], [1, 1, 1.9], p => {
    const c = p.c || '#f8f6f0', k = p.kind || 'twist', a = p.a || '#3c64ad', h = p.h || .8; box(.2, .2, 0, .6, .6, h, c); qy(.2, .8, .8, 0, .04, dk(c, .3));
    if (k === 'twist') { for (let i = 0; i < 7; i++) { const an = i * .5; box(.38 + Math.cos(an) * .08, .38 + Math.sin(an) * .08, h + i * .12, .24, .24, .12, i % 2 ? a : lt(a, .25), { ol: false }); } }
    else if (k === 'bust') { box(.36, .4, h, .28, .2, .2, '#d8d2c8'); ball(.5, .5, h + .42, .17, '#e8e2d8'); bx(.4, .42, h + .2, .2, .16, .1, '#e8e2d8'); }
    else if (k === 'spheres') { ball(.5, .5, h + .2, .22, a); ball(.5, .5, h + .52, .15, p.b || '#f2c230'); ball(.5, .5, h + .74, .09, p.d || '#d63a3a'); }
    else if (k === 'ring') { for (let i = 0; i < 16; i++) { const an = i / 16 * TAU; box(.46 + Math.cos(an) * .26, .46, h + .32 + Math.sin(an) * .26, .09, .09, .09, i % 2 ? a : dk(a, .15), { ol: false }); } }
    else if (k === 'glass') { lit(() => { box(.36, .36, h, .28, .28, .5, '#9fd0e8', { t: '#d4eef2', ol: false }); box(.42, .42, h + .5, .16, .16, .3, '#b07ad8', { ol: false }); }); }
    else { bx(.3, .44, h, .1, .12, .7, '#3a3f4c'); bx(.6, .44, h, .1, .12, .5, '#3a3f4c'); bx(.26, .42, h + .6, .5, .16, .12, a); ball(.66, .5, h + .82, .1, p.b || '#f2c230'); }
    qy(.26, .44, .8, h - .22, h - .1, '#f4f0e8'); lw([.29, .8, h - .16], [.41, .8, h - .16], '#8a9098');
  }, { use: { x: .5, y: 1.5 }, variants: ['twist', 'bust', 'spheres', 'ring', 'glass', 'stack'].map(kind => ({ kind })) }),

  A('gal.canvas', ['artwork', 'decor'], p => [p.w || 2, .1, p.h || 1.2], p => {
    const w = p.w || 2, h = p.h || 1.2, k = p.kind || 'sea', fr = p.fr || '#2a2733', s = p.seed || 1, a = .06, b = w - .06, z0 = .06, z1 = h - .06, H_ = z1 - z0, W_ = b - a;
    bx(0, 0, 0, w, .04, h, fr);
    if (k === 'sea') { qy(a, b, .05, z0, z1, '#9fd0e8'); qy(a, b, .05, z0, z0 + H_ * .45, '#2f6f9a', '#3c84ad'); qy(a, b, .05, z0 + H_ * .45, z0 + H_ * .5, '#f6e8c0'); disc(a + W_ * .7, .05, z0 + H_ * .72, H_ * .1, '#f6e04a', 8); fq([[a + W_ * .2, .05, z0 + H_ * .45], [a + W_ * .3, .05, z0 + H_ * .7], [a + W_ * .32, .05, z0 + H_ * .45]], '#f4f0e8'); for (let i = 0; i < 4; i++) lw([a + W_ * hash2(i, 1, s) * .7, .05, z0 + H_ * (.1 + i * .08)], [a + W_ * (hash2(i, 1, s) * .7 + .2), .05, z0 + H_ * (.1 + i * .08)], '#d4eef2'); }
    else if (k === 'field') { qy(a, b, .05, z0, z1, p.c || '#c0392b'); qy(a + W_ * .1, b - W_ * .1, .05, z0 + H_ * .1, z0 + H_ * .45, p.c2 || '#e8843a'); qy(a + W_ * .1, b - W_ * .1, .05, z0 + H_ * .55, z0 + H_ * .9, p.c3 || '#3a1f2a'); }
    else if (k === 'geo') { qy(a, b, .05, z0, z1, '#f4f0e8'); qy(a, a + W_ * .4, .05, z0 + H_ * .4, z1, '#d63a3a'); qy(a + W_ * .7, b, .05, z0, z0 + H_ * .3, '#3c64ad'); qy(a + W_ * .85, b, .05, z0 + H_ * .7, z1, '#f2c230'); lw([a + W_ * .4, .05, z0], [a + W_ * .4, .05, z1], INK); lw([a, .05, z0 + H_ * .4], [b, .05, z0 + H_ * .4], INK); lw([a + W_ * .7, .05, z0], [a + W_ * .7, .05, z0 + H_ * .4], INK); }
    else if (k === 'drip') { qy(a, b, .05, z0, z1, '#f1ede4'); for (let i = 0; i < 26; i++) { const x = a + hash2(i, 1, s) * W_, z = z0 + hash2(i, 2, s) * H_, c = [INK, '#d63a3a', '#f2c230', '#3c64ad', '#2a2733'][i % 5]; lw([x, .05, z], [Math.min(b, x + (hash2(i, 3, s) - .3) * .5), .05, Math.min(z1, Math.max(z0, z + (hash2(i, 4, s) - .5) * .5))], c); } }
    else if (k === 'portrait') { qy(a, b, .05, z0, z1, p.c || '#2f4a3a'); disc(a + W_ / 2, .05, z0 + H_ * .6, Math.min(W_, H_) * .2, '#f0c8a0', 10); qy(a + W_ * .25, b - W_ * .25, .05, z0, z0 + H_ * .36, p.c2 || '#8a2a2a'); qy(a + W_ * .32, b - W_ * .32, .05, z0 + H_ * .74, z0 + H_ * .86, '#4a3028'); }
    else { qy(a, b, .05, z0, z1, '#141a33'); for (let i = 0; i < 5; i++) disc(a + W_ * (.15 + i * .17), .05, z0 + H_ * (.3 + hash2(i, 2, s) * .4), H_ * (.08 + hash2(i, 5, s) * .1), ['#f6e04a', '#ff4a8a', '#4ad8f0', '#f4f0e8', '#b07af8'][i], 10); }
    if (p.light !== false) { bx(w / 2 - .2, 0, h + .04, .4, .12, .04, BR); glow(() => qy(a, b, .05, z1 - .1, z1, '#ffe6a0')); }
  }, { wall: true, mount: 1, solid: false, use: p => ({ x: (p.w || 2) / 2, y: 1 }), vb: p => [-.2, -.2, -.1, (p.w || 2) + .2, .4, (p.h || 1.2) + .3], variants: ['sea', 'field', 'geo', 'drip', 'portrait', 'night'].map(kind => ({ kind })) }),

  /* ================= cheese / deli / provisions ================= */
  A('cheese.counter', ['till', 'checkout', 'counter', 'tasting_board'], p => [p.w || 3, 1, 1.5], p => {
    const w = p.w || 3, c = p.c || '#f1ede4', deli = p.kind === 'deli', fish = p.kind === 'fish', s = p.seed || 0;
    box(0, 0, 0, w, 1, .5, c, { l: p.tile ? PAT.ftile ? ((u, v) => (u % 8 === 0 || v % 8 === 0) ? dk(c, .2) : c) : c : c }); qy(0, w, 1, 0, .08, dk(c, .5)); if (p.stripe) qy(0, w, 1, .36, .46, p.stripe);
    bx(0, 0, .5, w, .12, .62, dk(c, .1)); qz(.04, w - .04, .12, .98, .51, fish ? '#d4eef2' : '#e8dcc0', fish ? '#f4fbfc' : undefined);
    const nx = Math.floor((w - .9) / .36);
    for (let i = 0; i < nx; i++) { const x = .26 + i * .36, k = (i + s) % 5;
      if (fish) { const fc = ['#c4c9ce', '#e8843a', '#8a9098', '#f4b8c8'][k % 4]; fq([[x - .14, .5, .53], [x + .1, .44, .53], [x + .14, .5, .53], [x + .1, .58, .53]], fc); fq([[x - .14, .82, .53], [x + .1, .76, .53], [x + .14, .82, .53], [x + .1, .9, .53]], dk(fc, .1)); spx(x + .1, .5, .53, 0, -1, INK); }
      else if (deli && k % 2) { cyl(x, .4, .51, .07, .22, k === 1 ? '#8a3a2a' : '#c8683f', { ol: false, t: '#e8a0a0' }); ball(x, .75, .6, .12, '#e8a0a0', { squash: .7, ol: false }); }
      else { const cc = ['#f2d040', '#f0a030', '#f4e9cf', '#e8c060', '#d8e0c0'][k]; wheel(x, .42, .51, .15, .14, cc); fq([[x - .12, .82, .51], [x + .12, .82, .51], [x + .12, .66, .51]], cc); fq([[x - .12, .82, .51], [x + .12, .82, .51], [x + .12, .82, .63], [x - .12, .82, .63]].map(q => q), dk(cc, .12)); }
      qy(x - .06, x + .06, .97, .52, .6, '#f4f0e8'); }
    lit(() => { for (let x = .04; x < w - .9; x += 1.2) lw([x + .1, 1, .95], [x + .3, 1, .68], '#f4fbfc'); }); frameY(.02, w - .86, 1, .5, 1.1, '#8a9098'); lw([w - .86, 1, .5], [w - .86, 0, .5], '#8a9098');
    bx(0, 0, 1.1, w - .84, 1, .04, '#e8ecee'); box(w - .84, 0, .5, .84, 1, .5, c, { t: p.top || '#d2a26a' });
    if (!p.notill) till(w - .6, .3, 1.0); box(.2, .3, 1.14, .3, .3, .06, '#d8dce0'); bx(.3, .28, 1.2, .1, .06, .2, '#8a9098'); qz(.18, .52, .28, .62, 1.3, '#e8ecee');
    if (!fish) { qz(1.0, 1.5, .3, .7, 1.15, '#b07444'); for (let i = 0; i < 3; i++) box(1.06 + i * .14, .4, 1.15, .08, .08, .06, deli ? '#e8a0a0' : '#f2d040', { ol: false }); post(1.3, .6, 1.15, 1.3, '#d63a3a'); }
  }, { staff: p => ({ x: (p.w || 3) - .45, y: -.5, dir: 1 }), use: p => ({ x: (p.w || 3) - .45, y: 1.5 }), variants: [{}, { kind: 'deli', stripe: '#c0392b' }, { kind: 'fish', c: '#3c64ad' }] }),

  A('cheese.wheels', ['shelf', 'browse'], p => [p.w || 1.5, .5, 2], p => {
    const w = p.w || 1.5, c = p.c || '#8a5a3a'; posts(.04, .04, w - .08, .42, 0, 1.95, c);
    for (let r = 0; r < 4; r++) { const z = .2 + r * .45; bx(0, .02, z, w, .46, .04, lt(c, .2)); for (let x = .22; x < w - .1; x += .4) { const k = ['#f2d040', '#e8a030', '#f4e9cf', '#c8683f', '#e8c060'][Math.floor(hash2(Math.round(x * 10), r, p.seed || 1) * 5)]; wheel(x, .25, z + .04, .17, .16 + (r % 2) * .06, k); spx(x, .44, z + .14, 0, 0, '#c0392b'); } }
  }, { use: p => ({ x: (p.w || 1.5) / 2, y: 1 }) }),

  A('tasting', ['tasting_board', 'table'], [1, 1, 1.3], p => {
    const c = p.c || '#8a5a3a'; cyl(.5, .5, 0, .36, .8, c, { t: dk(c, .2) }); for (const z of [.14, .62]) cyl(.5, .5, z, .37, .04, '#5a5f6a', { ol: false, t: '#5a5f6a' });
    cyl(.5, .5, .8, .44, .05, lt(c, .3)); qz(.25, .7, .35, .65, .86, '#b07444'); const k = p.kind === 'deli' ? '#e8a0a0' : '#f2d040';
    for (let i = 0; i < 4; i++) box(.3 + (i % 2) * .16, .4 + (i >> 1) * .12, .86, .09, .08, .07, i % 3 ? k : '#f4e9cf', { ol: false }); post(.62, .5, .86, 1.02, '#d63a3a'); post(.66, .56, .86, 1.0, '#3c64ad');
    if (p.sign !== false) { post(.78, .3, .85, 1.15, '#3a3f4c'); qy(.62, .94, .3, 1.02, 1.22, '#2a2733'); lw([.66, .3, 1.14], [.9, .3, 1.14], '#f4f0e8'); lw([.66, .3, 1.08], [.84, .3, 1.08], '#f6e04a'); }
  }, { use: { x: .5, y: 1.5 } }),

  A('bulk.bins', ['shelf', 'browse'], p => [p.w || 2, .5, 2], p => {
    const w = p.w || 2, n = Math.round(w / .4), c = p.c || '#c8a068', fills = ['#e8d8a0', '#8a5a3a', '#f1ede4', '#c8842a', '#5a3a28', '#e8a040', '#9ccc4a', '#d63a3a', '#f4e9cf', '#3a2a20']; box(0, 0, 0, w, .5, 1.95, c); qy(0, w, .5, 0, .08, dk(c, .5));
    for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) { const x0 = .06 + i * (w - .06) / n, x1 = x0 + (w - .06) / n - .06, z = 1.0 + r * .0 - r * .0 + (r ? -.9 : 0) + .05, f = fills[(i + r * 4 + (p.seed || 0)) % 10];
      if (r === 0) { lit(() => qy(x0, x1, .5, z, z + .8, '#e4f2f4')); qy(x0, x1, .5, z, z + .5 + hash2(i, 2, p.seed || 1) * .22, heap(f, 12, i)); frameY(x0, x1, .5, z, z + .8, '#8a9098'); qy(x0 + .06, x1 - .06, .5, z - .1, z, '#3a3f4c'); spx((x0 + x1) / 2, .5, z - .06, 0, 0, '#d63a3a'); qy(x0 + .04, x1 - .04, .5, z + .66, z + .76, '#f4f0e8'); }
      else { box(x0, .1, .1, x1 - x0, .4, .6, lt(c, .12), { t: heap(f, 10, i + 5) }); qy(x0 + .04, x1 - .04, .5, .4, .52, '#f4f0e8'); cyl((x0 + x1) / 2, .32, .7, .04, .12, '#b8bcc0', { ol: false }); } }
    if (p.name) { box(0, .1, 1.87, w, .4, .1, p.hc || '#3f8a55'); }
  }, { use: p => ({ x: (p.w || 2) / 2, y: 1 }) }),

  A('coffee.station', ['coffee_station', 'drinkmachine', 'browse'], [2, .5, 1.9], p => {
    const c = p.c || '#3a3f4c'; counter(0, 0, 2, .5, .95, c, '#d8dce0', { stripe: p.a || '#e8843a' });
    for (let i = 0; i < 3; i++) { const x = .1 + i * .3; box(x, .1, .95, .24, .28, .5, ['#2a2733', '#8a3a2a', '#2f4a3a'][i]); lit(() => qy(x + .04, x + .2, .38, 1.28, 1.4, ['#f6e04a', '#f4f0e8', '#9ccc4a'][i])); bx(x + .09, .38, 1.02, .06, .06, .14, CH); }
    for (let i = 0; i < 2; i++) for (let k = 0; k < 4; k++) cyl(1.08 + i * .12, .26, .95 + k * .05, .045, .06, '#f4f0e8', { ol: false, t: '#e8dcc0' });
    box(1.36, .08, .95, .56, .36, .2, '#8a9098'); lit(() => qz(1.4, 1.88, .12, .4, 1.16, '#ff8a3a', '#e8643a')); for (let i = 0; i < 4; i++) lw([1.42 + i * .12, .14, 1.17], [1.42 + i * .12, .38, 1.17], '#a8553f'); bx(1.36, .06, 1.36, .56, .4, .03, '#d4eef2');
    box(0, .02, 1.5, 2, .2, .34, p.a || '#e8843a'); lit(() => signY(p.name || 'COFFEE', 0, 2, .22, 1.5, 1.84, p.a || '#e8843a', '#fff8e0', { frame: false }));
  }, { use: { x: 1, y: 1 } }),

  A('icefish', ['shelf', 'browse'], [2, 1, 1], p => {
    const c = p.c || '#3c64ad'; box(0, 0, 0, 2, 1, .6, c, { l: PAT.planks(dk(c, .12), 5), r: PAT.planks(dk(c, .3), 5), t: (x, y) => hash2(Math.floor(x * 10 + 50), Math.floor(y * 10 + 50), 3) > .6 ? '#d4eef2' : '#f4fbfc' });
    for (let i = 0; i < 6; i++) { const x = .3 + (i % 3) * .6, y = .3 + (i >> 1 & 1) * .0 + (i > 2 ? .45 : 0), fc = ['#c4c9ce', '#e8843a', '#8a9098', '#f4b8c8', '#aab2ba', '#d63a3a'][(i + (p.seed || 0)) % 6]; fq([[x - .2, y, .62], [x + .12, y - .08, .62], [x + .2, y, .62], [x + .12, y + .08, .62]], fc); fq([[x - .2, y, .62], [x - .28, y - .07, .62], [x - .28, y + .07, .62]], dk(fc, .15)); spx(x + .14, y, .62, 0, -1, INK); }
    cyl(1.75, .75, .6, .1, .08, '#f6e04a', { ol: false, t: '#f6e88a' }); qy(.7, 1.3, 1, .2, .44, '#f4f0e8'); lw([.76, 1, .32], [1.24, 1, .32], '#3c64ad');
  }, { use: { x: 1, y: 1.5 } }),

  /* ================= thrift / boutique ================= */
  A('thrift.bins', ['shelf', 'browse', 'rack'], [1.5, 1, 1], p => {
    const c = p.c || '#3c64ad'; for (let i = 0; i < 2; i++) { const x = i * .76; box(x, .05, 0, .72, .9, .55, i ? (p.c2 || '#d63a3a') : c, { t: heap2(p.shoes ? ['#8a5a3a', '#2a2733', '#f1ede4', '#d63a3a', '#3a2a20'] : CLOTH, 7, (p.seed || 1) + i) }); frameZ(x, x + .72, .05, .95, .55, dk(i ? (p.c2 || '#d63a3a') : c, .4)); }
    post(.75, .5, .55, .95, '#8a9098'); signY(p.name || '$2 BIN', .35, 1.15, .52, .78, 1.0, '#f6e04a', '#c0392b', {});
  }, { use: { x: .75, y: 1.5 } }),

  A('thrift.hatwall', ['shelf', 'browse'], p => [p.w || 2, .15, 1.3], p => {
    const w = p.w || 2; for (let r = 0; r < 2; r++) { bx(0, .03, .55 * r + .5, w, .05, .04, '#8a5a3a'); let i = 0; for (let x = .1; x < w - .3; x += .34, i++) { const c = ['#c0704a', '#3a3f4c', '#d63a3a', '#c0a078', '#3c64ad', '#f2c230', '#3f8a55'][(i * 3 + r * 2 + (p.seed || 0)) % 7]; sprite((i + r) % 3 === 2 ? 'bag' : 'hat', x, .09, r * .55 + .22, { c, k: dk(c, .4) }); spx(x + .12, .09, r * .55 + .5, 0, 0, BR); } }
  }, { wall: true, mount: .9, solid: false, use: p => ({ x: (p.w || 2) / 2, y: .8 }) }),

  A('jewel.case', ['display', 'browse', 'shelf'], p => [p.w || 1.5, .5, 1.15], p => {
    const w = p.w || 1.5, c = p.c || '#f1ede4'; box(0, 0, 0, w, .5, .7, c); qy(0, w, .5, 0, .06, dk(c, .4)); frameY(.08, w - .08, .5, .14, .6, p.fr || BR);
    lit(() => { box(.03, .03, .7, w - .06, .44, .36, '#d4eef2', { t: '#e8f8fa', ol: false }); }); qz(.06, w - .06, .06, .44, .72, p.velvet || '#3a2a48');
    for (let i = 0; i < Math.floor(w / .25); i++) { const x = .14 + i * .25; lit(() => { spx(x, .3, .78, 0, 0, ['#f6e04a', '#f4fbfc', '#ff4a8a', '#4ad8f0'][i % 4]); spx(x, .3, .78, 1, 0, BR); spx(x + .08, .4, .76, 0, 0, '#f4fbfc'); }); }
    frameY(.03, w - .03, .47, .7, 1.06, BR); frameZ(.03, w - .03, .03, .47, 1.06, BR);
  }, { use: p => ({ x: (p.w || 1.5) / 2, y: 1 }), light: { x: .75, y: .6, z: 0, r: 1.2 } }),
];
const cheeseCounter = art.find(a => a.id === 'furn.pshop.cheese.counter');
// same glass case without a till: a deli / cheese service counter that is NOT the shop's checkout
art.push(Object.assign({}, cheeseCounter, { id: 'furn.pshop.deli.case', tags: ['counter', 'tasting_board', 'shelf', 'browse'], draw: p => cheeseCounter.draw(Object.assign({ notill: true }, p)), variants: [{ kind: 'deli', stripe: '#a82a2a' }] }));
export default art;
