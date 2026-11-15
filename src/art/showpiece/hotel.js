// The Grand Maple Hotel — lobby and shared architecture. ids furn.hotel.* (+ prop.hotel.suitcase). Room / dining / spa pieces live in hotel_rooms.js, helpers in _hotel_lib.js.
//   revdoor {frame 0-3} revolving door (walk-through)   reception {w}   bell {ring}   keyrack {w} (wall)   desk {kind: concierge|shop|spa|host|steward, w, name}   cart {n, seed} brass luggage cart
//   prop.hotel.suitcase {c, tag, flat}   lift {open, at 0-1, name} (wall)   flowers {c: [3 colours], seed}   staffwall {you: {skin, hair, top}} (wall)   gallery {w} mezzanine balcony (wall, place with mount)
//   grandstair   easel {on}   shopcase {w}   doorway {name, c, shut} (wall)   chandelier {r} (hang with z)   window {w, time, view, c} (wall)   palm {seed}   board {lines: [..], c} notice board   carpet {w, d, c}
import { R, box, qy, qx, qz, fq, lw, cyl, ball, dk, lt, lit, glow, hash2, MARBLE, MARBLE_D, VEIN, BRASS, BRASS_D, BRASS_L, BURG, RED, WALNUT, WALNUT_D, WALNUT_L, NAVY, GREEN, CREAM, LINEN, INK, GLASS, WARM,
  marble, S2, dot, railX, railY, bloom, fronds, candle, arcY, skyline } from './_hotel_lib.js';
const { signY, textY, PAT, rng } = R;

function revdoor(p) {
  const f = (p.frame || 0) % 4, cx = 1.3, cy = 1.3, r = 1.2, H = 2.3, strips = [];
  cyl(cx, cy, 0, r + .05, .04, BRASS_D, { ol: false, t: '#b89a6a' }); cyl(cx, cy, .04, r - .12, .01, RED, { ol: false, t: '#8a2a2e' });
  for (const side of [Math.PI, 0]) for (let i = -9; i <= 9; i++) { const a = side + i * .085; strips.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, i]); }
  const wings = [0, 1, 2, 3].map(k => { const a = f * .3927 + k * 1.5708 + .3; return [cx + Math.cos(a) * (r - .1), cy + Math.sin(a) * (r - .1)]; });
  const draw = (list, back) => { for (const s of list) { if ((s[0] + s[1] < cx + cy) !== back) continue; if (s.length === 3) { if (Math.abs(s[2]) === 9) lw([s[0], s[1], 0], [s[0], s[1], H], BRASS); else if (s[2] & 1) lw([s[0], s[1], .12], [s[0], s[1], H - .1], '#cfeaf2'); dot(s[0], s[1], .1, BRASS_D); dot(s[0], s[1], H - .06, BRASS); dot(s[0], s[1], 1.1, BRASS_D); }
    else { fq([[cx, cy, .08], [s[0], s[1], .08], [s[0], s[1], H - .1], [cx, cy, H - .1]], '#d8f0f6', 'glass'); lw([s[0], s[1], .08], [s[0], s[1], H - .1], BRASS); lw([cx, cy, 1.1], [s[0], s[1], 1.1], BRASS); lw([cx, cy, .08], [s[0], s[1], .08], BRASS_D); lw([cx, cy, H - .1], [s[0], s[1], H - .1], BRASS_D); } } };
  draw(strips, true); draw(wings, true); lw([cx, cy, 0], [cx, cy, H], BRASS_L); draw(wings, false); draw(strips, false);
  cyl(cx, cy, H, r + .08, .32, WALNUT_D, { t: WALNUT }); cyl(cx, cy, H + .32, r - .3, .06, BRASS, { ol: false });
  for (const a of [-.9, -.3, .3, .9, 2.2, 2.8, 3.4, 4]) lit(() => dot(cx + Math.cos(a + 1.57) * (r + .08), cy + Math.sin(a + 1.57) * (r + .08), H + .16, '#ffe9a0'));
}
function reception(p) {
  const w = p.w || 5;
  box(0, 0, 0, w, 1, 1.05, MARBLE, { l: marble(MARBLE, 2), r: marble(MARBLE_D, 3) }); qy(0, w, 1, 0, .12, WALNUT_D); qx(w, 0, 1, 0, .12, WALNUT_D);
  for (let x = .5; x < w - .3; x += 1) { lw([x, 1, .22], [x, 1, .92], BRASS); }
  lw([.12, 1, .22], [w - .12, 1, .22], BRASS); lw([.12, 1, .92], [w - .12, 1, .92], BRASS);
  signY('RECEPTION', w / 2 - 1.3, w / 2 + 1.3, 1.01, .36, .8, BURG, BRASS_L, { frame: false });
  box(-.06, -.06, 1.05, w + .12, 1.12, .08, WALNUT, { t: PAT.fboards(WALNUT, .4) });
  // guest book, pen stand, lamps, a bowl of mints
  box(w * .28, .35, 1.13, .6, .4, .04, LINEN, { ol: false }); lw([w * .28 + .3, .35, 1.18], [w * .28 + .3, .75, 1.18], '#b8b0a0');
  for (const x of [.35, w - .35]) { lw([x, .3, 1.13], [x, .3, 1.5], BRASS); box(x - .14, .2, 1.48, .28, .2, .16, GREEN, { ol: false }); lit(() => qy(x - .12, x + .12, .4, 1.44, 1.48, '#fff0b0')); }
  cyl(w * .62, .55, 1.13, .12, .06, BRASS, { ol: false }); dot(w * .62, .55, 1.22, '#f8f4ea'); dot(w * .62 + .05, .55, 1.21, '#e87a8a');
}
function bell(p) { const k = p.ring ? 1 : 0; cyl(.15, .15, 0, .14, .03, WALNUT_D, { ol: false }); ball(.15, .15, .1, .11, BRASS, { squash: .7 }); dot(.15, .15, .2 + k * .02, BRASS_L); if (k) lit(() => { for (const [dx, dz] of [[-.22, .2], [.22, .22], [-.26, .08], [.26, .1]]) dot(.15 + dx, .15, .12 + dz, '#fff0b0'); }); }
function keyrack(p) {
  const w = p.w || 5, y = .1; qy(0, w, y, 0, 2.6, WALNUT_D); qy(.08, w - .08, y, .08, 2.52, WALNUT);
  const cols = Math.round((w - .4) / .36), cw = (w - .4) / cols;
  for (let r = 0; r < 3; r++) for (let i = 0; i < cols; i++) { const x = .2 + i * cw, z = 1.0 + r * .32, k = hash2(i, r, 9); qy(x + .03, x + cw - .03, y + .01, z + .03, z + .29, WALNUT_D); if (k > .3) { dot(x + cw / 2, y + .01, z + .2, BRASS_L); lw([x + cw / 2, y + .01, z + .19], [x + cw / 2, y + .01, z + .08], BRASS); } if (k > .7) qy(x + .05, x + cw - .1, y + .02, z + .04, z + .13, LINEN); if (k < .12) qy(x + .06, x + cw - .06, y + .02, z + .04, z + .1, '#e87a8a'); }
  for (let i = 0; i < 3; i++) { const cx = w / 2 + (i - 1) * 1.15, cz = 2.24; fq(arcY(cx, y + .01, cz, .2, 0, 6.283, 14), BRASS); fq(arcY(cx, y + .02, cz, .16, 0, 6.283, 14), LINEN); const a = [1.2, 2.6, .4][i]; lw([cx, y + .03, cz], [cx + Math.cos(a) * .12, y + .03, cz + Math.sin(a) * .12], INK); lw([cx, y + .03, cz], [cx + Math.cos(a + 2) * .08, y + .03, cz + Math.sin(a + 2) * .08], INK); }
  lw([0, y, 2.6], [w, y, 2.6], BRASS); lw([0, y, .95], [w, y, .95], BRASS);
}
const DESK = { concierge: [WALNUT, 'CONCIERGE', GREEN], shop: ['#3a2a34', 'BOUTIQUE', RED], spa: ['#d8c4a0', 'SPA', '#3f8a8a'], host: [WALNUT_D, 'WELCOME', BURG], steward: [BURG, 'TICKETS', NAVY] };
function desk(p) {
  const k = DESK[p.kind] || DESK.concierge, w = p.w || 2.6, c = p.c || k[0], nm = p.name || k[1], tw = Math.min(w - .2, (nm.length * 4 + 5) / 16);
  box(0, 0, 0, w, .9, 1, c, { l: PAT.planks(dk(c, .14), 6) }); qy(0, w, .9, 0, .1, dk(c, .5)); lw([.1, .9, .92], [w - .1, .9, .92], BRASS); lw([.1, .9, .2], [w - .1, .9, .2], BRASS);
  signY(nm, w / 2 - tw / 2, w / 2 + tw / 2, .91, .36, .8, dk(c, .45), BRASS_L, { frame: false });
  box(-.05, -.05, 1, w + .1, 1, .07, p.kind === 'spa' ? MARBLE : lt(c, .2), p.kind === 'spa' ? { t: MARBLE } : undefined);
  if (p.kind === 'spa') { cyl(.4, .4, 1.07, .12, .16, '#f4f0e8', { ol: false }); bloom(.4, .4, 1.5, .26, ['#f2a7c3', '#f8f4ea', '#e87aa0'], 3, 6); lw([.4, .4, 1.2], [.4, .4, 1.45], '#3f8a55'); for (let i = 0; i < 3; i++) box(w - .7, .25, 1.07 + i * .07, .5, .4, .07, i === 1 ? '#8fd0d0' : LINEN, { ol: false }); return; }
  if (p.kind === 'host') { box(w / 2 - .3, .2, 1.07, .6, .45, .05, BURG, { ol: false }); lw([w / 2, .2, 1.13], [w / 2, .65, 1.13], BRASS); lw([.25, .3, 1.07], [.25, .3, 1.42], BRASS); lit(() => dot(.25, .3, 1.46, '#fff0b0', 2)); return; }
  // banker's lamp + brochures (concierge) / tissue-wrapped parcels + a little bear (shop) / cash box (steward)
  lw([.35, .35, 1.07], [.35, .35, 1.36], BRASS); box(.17, .25, 1.34, .36, .2, .13, k[2], { ol: false }); lit(() => qy(.2, .5, .45, 1.3, 1.34, '#fff0b0'));
  if (p.kind === 'shop') { box(w - .8, .25, 1.07, .34, .3, .22, '#e8c06a', { ol: false }); lw([w - .63, .25, 1.07], [w - .63, .25, 1.29], RED); ball(w - .28, .45, 1.2, .1, '#9a6a3a', { ol: false }); ball(w - .28, .45, 1.34, .075, '#9a6a3a', { ol: false }); dot(w - .28, .45, 1.43, RED, 2); }
  else if (p.kind === 'steward') { box(w - .7, .3, 1.07, .45, .3, .16, '#4a4f5c', { ol: false }); for (let i = 0; i < 3; i++) qy(w - 1.3 + i * .1, w - 1.22 + i * .1, .6, 1.07, 1.25, [LINEN, '#f6d67a', LINEN][i]); }
  else { for (let i = 0; i < 4; i++) { const x = w - 1 + i * .2; qy(x, x + .16, .5, 1.07, 1.3, ['#5a9ad8', '#e8743a', '#5aa868', '#e8c06a'][i]); lw([x + .03, .5, 1.24], [x + .13, .5, 1.24], LINEN); } for (const [dx, dz] of [[0, 0], [.07, .05], [-.07, .05], [0, .1]]) dot(w / 2 + dx, .91, .3 + dz, BRASS_L); }
}
const CASE = ['#8a3a2e', '#2f5a4a', '#22304e', '#b8862e', '#5a4a40', '#7a2030', '#3f6a8a', '#c8b89a'];
function suitcaseAt(x, y, z, c, o = {}) { const w = o.w || .52, d = o.d || .28, h = o.h || .7; box(x, y, z, w, d, h, c); lw([x + w * .28, y + d, z], [x + w * .28, y + d, z + h], dk(c, .4)); lw([x + w * .72, y + d, z], [x + w * .72, y + d, z + h], dk(c, .4)); for (const zz of [.04, h - .04]) { dot(x + .03, y + d, z + zz, BRASS_L); dot(x + w - .03, y + d, z + zz, BRASS_L); } lw([x + w * .36, y + d / 2, z + h + .05], [x + w * .64, y + d / 2, z + h + .05], INK); if (o.tag) { qy(x + w * .42, x + w * .58, y + d + .01, z + h * .45, z + h * .68, LINEN); lit(() => dot(x + w * .5, y + d + .01, z + h * .58, '#ffd060')); } }
function suitcase(p) { if (p.flat) suitcaseAt(0, 0, 0, p.c || BURG, { w: .7, d: .5, h: .26, tag: p.tag }); else suitcaseAt(0, 0, 0, p.c || BURG, { tag: p.tag }); }
function cart(p) {
  const n = p.n === undefined ? 3 : p.n, rr = rng((p.seed || 1) * 17 + 3), W = 1.5, D = .8;
  for (const [x, y] of [[.12, .1], [W - .12, .1]]) { lw([x, y, .22], [x, y, 1.5], BRASS_D); }
  lw([.12, .1, 1.5], [W - .12, .1, 1.5], BRASS_D); const back = arcY(W / 2, .1, 1.5, W / 2 - .12, 0, Math.PI, 10, .36); for (let i = 0; i < back.length - 1; i++) lw(back[i], back[i + 1], BRASS_D);
  for (const [x, y] of [[.12, .12], [W - .12, .12], [.12, D - .1], [W - .12, D - .1]]) cyl(x, y, 0, .07, .1, INK, { ol: false });
  box(0, 0, .12, W, D, .1, BRASS, { t: RED }); qz(.08, W - .08, .08, D - .08, .225, '#8a2a2e');
  const stack = [[.14, .16, 0, .9, .5, .32], [.2, .2, .32, .7, .42, .28], [.92, .2, 0, .44, .36, .62], [.3, .22, .6, .5, .34, .24], [1.05, .3, .62, .3, .24, .3]];
  for (let i = 0; i < Math.min(n, stack.length); i++) { const s = stack[i], c = CASE[Math.floor(rr() * CASE.length)]; box(s[0], s[1], .22 + s[2], s[3], s[4], s[5], c); lw([s[0] + s[3] * .3, s[1] + s[4], .22 + s[2]], [s[0] + s[3] * .3, s[1] + s[4], .22 + s[2] + s[5]], dk(c, .45)); lw([s[0] + s[3] * .7, s[1] + s[4], .22 + s[2]], [s[0] + s[3] * .7, s[1] + s[4], .22 + s[2] + s[5]], dk(c, .45)); dot(s[0] + s[3] / 2, s[1] + s[4], .22 + s[2] + s[5] - .05, BRASS_L); }
  for (const [x, y] of [[.12, D - .1], [W - .12, D - .1]]) lw([x, y, .22], [x, y, 1.5], BRASS);
  const fr = arcY(W / 2, D - .1, 1.5, W / 2 - .12, 0, Math.PI, 10, .36); for (let i = 0; i < fr.length - 1; i++) { lw(fr[i], fr[i + 1], BRASS); lw([fr[i][0], fr[i][1], fr[i][2] + .06], [fr[i + 1][0], fr[i + 1][1], fr[i + 1][2] + .06], BRASS_L); }
  lw([W / 2, .1, 1.86], [W / 2, D - .1, 1.86], BRASS); lw([.12, D - .1, 1.5], [W - .12, D - .1, 1.5], BRASS); dot(W / 2, D - .1, 1.92, BRASS_L, 2);
}
function lift(p) {
  const y = .12, at = p.at === undefined ? 0 : p.at;
  qy(0, 2.4, y, 0, 3.2, marble(MARBLE, 5)); qy(.28, 2.12, y + .01, 0, 2.36, BRASS_D); qy(.36, 2.04, y + .02, 0, 2.28, p.open ? '#3a2a22' : BRASS);
  if (p.open) { lit(() => { qy(.44, 1.96, y + .03, .04, 2.2, '#f6e2b0'); qy(.44, 1.96, y + .03, .04, .9, '#c9a26a'); qy(.44, 1.96, y + .03, .9, .96, BRASS_L); qy(.9, 1.5, y + .03, 1.2, 1.9, '#fff4d0'); }); qy(.36, .52, y + .04, 0, 2.28, BRASS); qy(1.88, 2.04, y + .04, 0, 2.28, BRASS); }
  else { lw([1.2, y + .03, 0], [1.2, y + .03, 2.28], BRASS_D); for (const x0 of [.42, 1.26]) { qy(x0, x0 + .72, y + .03, .14, 2.14, lt(BRASS, .12)); for (let i = 0; i < 5; i++) { const a = arcY(x0 + .36, y + .04, .5, .3 - i * .05, 0, Math.PI, 8); for (let j = 0; j < a.length - 1; j++) lw(a[j], a[j + 1], BRASS_D); } for (let i = 0; i < 5; i++) lw([x0 + .1 + i * .13, y + .04, .9], [x0 + .1 + i * .13, y + .04, 2.02], BRASS_D); lw([x0 + .04, y + .04, .86], [x0 + .68, y + .04, .86], BRASS_D); } }
  // floor dial
  fq(arcY(1.2, y + .01, 2.5, .62, 0, Math.PI, 14).concat([[.58, y + .01, 2.5]]), WALNUT_D); fq(arcY(1.2, y + .02, 2.5, .54, 0, Math.PI, 14).concat([[.66, y + .02, 2.5]]), CREAM);
  for (let i = 0; i < 4; i++) { const a = Math.PI * (1 - (i + .5) / 4); lw([1.2 + Math.cos(a) * .4, y + .03, 2.5 + Math.sin(a) * .4], [1.2 + Math.cos(a) * .5, y + .03, 2.5 + Math.sin(a) * .5], INK); dot(1.2 + Math.cos(a) * .45, y + .03, 2.5 + Math.sin(a) * .45, i === Math.round(at * 3) ? '#d8342e' : BRASS_D); }
  const na = Math.PI * (1 - (at * 3 + .5) / 4); lit(() => lw([1.2, y + .04, 2.52], [1.2 + Math.cos(na) * .34, y + .04, 2.52 + Math.sin(na) * .34], '#d8342e')); dot(1.2, y + .04, 2.52, BRASS_L, 2);
  if (p.name) signY(p.name, .3, 2.1, y + .02, 2.98, 3.16, BURG, BRASS_L, { frame: false });
  qy(2.18, 2.34, y + .02, 1, 1.3, BRASS); lit(() => dot(2.26, y + .03, 1.2, p.open ? '#7df0a0' : '#ffd060'));
}
function flowers(p) {
  const c = p.c || ['#f8f4ea', '#f0e8c8', '#8fb89a'], s = p.seed || 1;
  cyl(.9, .9, 0, .42, .06, MARBLE_D, { ol: false }); cyl(.9, .9, .06, .2, .62, MARBLE, { ol: false }); cyl(.9, .9, .68, .85, .09, MARBLE);
  cyl(.9, .9, .77, .17, .1, BRASS_D, { ol: false }); cyl(.9, .9, .87, .24, .4, NAVY, { t: '#1a2238' }); lw([.72, 1.06, .95], [.72, 1.06, 1.2], lt(NAVY, .3));
  fronds(.9, .9, 1.25, 1.5, '#3f7a52', 9, s); for (let i = 0; i < 5; i++) { const a = i * 1.257 + s; bloom(.9 + Math.cos(a) * .5, .9 + Math.sin(a) * .5, 1.6 + (i % 2) * .3, .46, c, s + i, 8); }
  bloom(.9, .9, 2.25, .55, c, s + 9, 11); for (const [dx, dy] of [[-.5, .3], [.45, .4]]) { box(.9 + dx - .1, .9 + dy - .08, .77, .22, .16, .03, LINEN, { ol: false }); }
}
const FACES = [['#f8d0aa', '#4a3022', '#a8342e'], ['#84502f', '#2b2433', '#22304e'], ['#ecba90', '#e6c36a', '#2f5a4a'], ['#c4875a', '#2b2433', '#a8342e'], ['#ffe2c8', '#a9a9b4', '#3a3440'], ['#a66a44', '#6e4428', '#a8342e']];
function portrait(x, y, z, w, h, f, gold) { qy(x - .04, x + w + .04, y, z - .04, z + h + .04, gold ? BRASS_L : BRASS_D); qy(x, x + w, y + .01, z, z + h, gold ? '#3a4a6a' : '#5a5448'); if (!f) { textY('?', x + w / 2 - .09, y + .02, z + h / 2 + .16, '#8a8478'); return; }
  const cx = x + w / 2; qy(cx - w * .36, cx + w * .36, y + .02, z, z + h * .34, f[2]); qy(cx - w * .17, cx + w * .17, y + .02, z + h * .3, z + h * .72, f[0]); qy(cx - w * .2, cx + w * .2, y + .02, z + h * .62, z + h * .8, f[1]); qy(cx - w * .2, cx - w * .13, y + .02, z + h * .46, z + h * .66, f[1]); dot(cx - w * .07, y + .03, z + h * .52, INK); dot(cx + w * .08, y + .03, z + h * .52, INK); }
function staffwall(p) {
  const y = .1, w = 3.6; qy(0, w, y, 0, 1.9, WALNUT_D); qy(.06, w - .06, y + .005, .06, 1.84, WALNUT); signY('OUR PEOPLE', w / 2 - .9, w / 2 + .9, y + .01, 1.42, 1.84, WALNUT_D, BRASS_L, { frame: false });
  [0, 1, 3, 4].forEach((i, k) => portrait(.22 + i * .68 + (i > 2 ? .12 : 0), y + .01, .5 + (k % 2) * .08, .46, .62, FACES[k]));
  portrait(.22 + 2 * .68 - .04, y + .01, .46, .66, .86, p.you ? [p.you.skin || '#ecba90', p.you.hair || '#4a3022', p.you.top || '#5ab0e0'] : null, !!p.you);
  if (p.you) { qy(1.5, 2.26, y + .02, .2, .34, BRASS_L); lw([1.56, y + .03, .27], [2.2, y + .03, .27], BRASS_D); lit(() => { dot(1.54, y + .02, 1.36, '#fff0b0'); dot(2.24, y + .02, 1.36, '#fff0b0'); }); }
  for (const x of [.45, 1.13, 2.5, 3.18]) lw([x - .14, y + .02, .36], [x + .14, y + .02, .36], BRASS);
}
function gallery(p) {
  const w = p.w || 8, y = .08;
  for (let x = .5; x + 1.5 <= w; x += 2.5) { const cx = x + .75; fq(arcY(cx, y, 1.3, .75, 0, Math.PI, 12).concat([[x, y, 0.16], [x + 1.5, y, .16]].reverse()), '#3a2a2a'); glow(() => fq(arcY(cx, y + .01, 1.3, .68, 0, Math.PI, 12).concat([[x + .07, y + .01, .2], [x + 1.43, y + .01, .2]].reverse()), '#ffd98a', '#f4b860')); qy(x, x + .34, y + .02, .16, 1.9, BURG, dk(BURG, .2)); qy(x + 1.16, x + 1.5, y + .02, .16, 1.9, BURG, dk(BURG, .2)); const ar = arcY(cx, y + .02, 1.3, .78, 0, Math.PI, 12); for (let i = 0; i < ar.length - 1; i++) lw(ar[i], ar[i + 1], BRASS); }
  box(0, 0, 0, w, .9, .16, MARBLE, { l: marble(MARBLE_D, 7), r: MARBLE_D }); lw([0, .9, 0], [w, .9, 0], dk(MARBLE, .4)); for (let x = .6; x < w; x += 1.25) { box(x - .1, .5, -.22, .2, .4, .22, MARBLE_D, { ol: false }); }
  railX(0, w, .86, .16, .7, BRASS, Math.round(w / .3) + 1); for (let x = 0; x <= w + .01; x += 2.5) { box(Math.min(w - .16, x), .78, .16, .16, .12, .86, MARBLE, { ol: false }); lit(() => dot(Math.min(w - .08, x + .08), .84, 1.12, '#fff0b0', 2)); }
}
function grandstair() {
  const W = 3, n = 10, sd = .42, sh = .25, D = n * sd;
  for (let i = n - 1; i >= 0; i--) { const y = D - (i + 1) * sd, h = (i + 1) * sh; box(0, y, 0, W, sd, h, MARBLE, { l: i % 2 ? MARBLE_D : dk(MARBLE, .16), r: marble(MARBLE_D, 4), ol: false }); qz(.5, W - .5, y, y + sd, h + .005, RED, i % 2 ? '#8a2a2e' : undefined); qy(.5, W - .5, y + sd, h - sh, h, '#8a2a2e'); lw([.5, y + sd, h], [W - .5, y + sd, h], BRASS); lw([0, y + sd, h], [W, y + sd, h], dk(MARBLE, .35)); }
  for (const x of [.08, W - .08]) { lw([x, D, 1], [x, 0, n * sh + 1], BRASS); lw([x, D, 1.06], [x, 0, n * sh + 1.06], BRASS_L); for (let i = 0; i <= n; i += 1) { const y = D - i * sd; lw([x, y, i * sh], [x, y, i * sh + 1], BRASS_D); } }
  for (const x of [-.02, W - .28]) { box(x, D - .1, 0, .3, .3, 1.15, MARBLE); lw([x + .15, D + .05, 1.15], [x + .15, D + .05, 1.5], BRASS); lit(() => ball(x + .15, D + .05, 1.62, .13, '#fff0b0', { ol: false })); glow(() => ball(x + .15, D + .05, 1.62, .2, '#ffe2a0', { ol: false })); }
}
function easel(p) { lw([.3, .25, 0], [.6, .1, 1.6], BRASS_D); lw([1.3, .25, 0], [1, .1, 1.6], BRASS_D); lw([.8, 0, 0], [.8, .1, 1.6], BRASS_D); qy(.05, 1.55, .2, .5, 1.5, BRASS); qy(.1, 1.5, .21, .55, 1.45, '#2a2733'); textY('PIANO', .2, .22, 1.36, LINEN); if (p.on) lit(() => textY('NOW', .32, .22, .92, '#ffd060')); else textY('DAILY', .2, .22, .92, '#b8b0a0'); }
function shopcase(p) {
  const w = p.w || 3, H = 2.4; box(0, 0, 0, w, .5, H, '#3a2a34', { l: '#4a3840' }); qy(.1, w - .1, .5, .16, H - .52, '#f4e6d0');
  signY('BOUTIQUE', w / 2 - .7, w / 2 + .7, .51, H - .48, H - .04, RED, BRASS_L, { frame: false });
  for (let s = 0; s < 3; s++) { const z = .2 + s * .6; lw([.1, .5, z], [w - .1, .5, z], '#3a2a34'); qy(.1, w - .1, .5, z - .04, z, '#5a4850');
    for (let x = .3, i = 0; x < w - .4; x += .52, i++) { const k = (i + s * 2) % 5;
      if (k === 0) { qy(x - .14, x + .14, .51, z, z + .46, LINEN); lw([x, .51, z + .1], [x, .51, z + .46], '#d8d0c0'); dot(x + .07, .52, z + .3, BRASS_L); lw([x - .14, .51, z + .22], [x + .14, .51, z + .22], '#d8d0c0'); }
      else if (k === 1) { ball(x, .5, z + .13, .11, '#9a6a3a', { ol: false }); ball(x, .5, z + .3, .08, '#9a6a3a', { ol: false }); qy(x - .07, x + .07, .52, z + .36, z + .42, RED); }
      else if (k === 2) { qy(x - .08, x + .08, .51, z, z + .22, '#5ab0d8'); qy(x - .06, x + .06, .51, z + .22, z + .27, '#c8a070'); qy(x + .14, x + .24, .51, z, z + .3, '#a8642e'); }
      else if (k === 3) { qy(x - .14, x + .14, .51, z, z + .14, '#e8c06a'); qy(x - .1, x + .1, .51, z + .14, z + .26, '#e8c06a'); lw([x, .51, z], [x, .51, z + .26], RED); }
      else { qy(x - .12, x + .12, .51, z, z + .1, LINEN); qy(x - .1, x + .14, .51, z + .1, z + .2, LINEN); dot(x, .52, z + .06, BRASS_L); } } }
  lit(() => lw([.1, .5, H - .53], [w - .1, .5, H - .53], '#fff0b0'));
}
function doorway(p) {
  const y = .14, nm = p.name || '', c = p.c || BURG, W = p.w || 3, cx = W / 2, x0 = cx - .95, x1 = cx + .95, zt = 2.0;
  qy(0, W, y, 0, 3.5, marble(MARBLE, 6)); qy(cx - 1.4, cx - 1.1, y + .01, 0, 2.75, MARBLE_D); qy(cx + 1.1, cx + 1.4, y + .01, 0, 2.75, MARBLE_D); for (const x of [cx - 1.25, cx + 1.25]) { lw([x - .06, y + .02, .2], [x - .06, y + .02, 2.6], VEIN); lw([x + .06, y + .02, .2], [x + .06, y + .02, 2.6], VEIN); }
  qy(0, W, y + .01, 2.75, 2.92, MARBLE_D); lw([0, y + .02, 2.92], [W, y + .02, 2.92], BRASS); lw([0, y + .02, 2.75], [W, y + .02, 2.75], dk(MARBLE, .4));
  const open = arcY(cx, y + .02, zt, (x1 - x0) / 2, 0, Math.PI, 12, .55).concat([[x0, y + .02, 0], [x1, y + .02, 0]].reverse());
  if (p.shut) { fq(open, WALNUT); lw([cx, y + .03, 0], [cx, y + .03, zt + .55], WALNUT_D); for (const xx of [x0 + .14, cx + .14]) { qy(xx, xx + .66, y + .03, .2, .9, WALNUT_L); qy(xx, xx + .66, y + .03, 1.05, 1.9, WALNUT_L); } dot(cx - .1, y + .04, 1, BRASS_L, 2); dot(cx + .1, y + .04, 1, BRASS_L, 2); }
  else { fq(open, '#2a1c22'); lit(() => { fq(arcY(cx, y + .03, zt, (x1 - x0) / 2 - .34, 0, Math.PI, 10, .4).concat([[x0 + .34, y + .03, 0], [x1 - .34, y + .03, 0]].reverse()), lt(c, .15), c); qy(x0 + .34, x1 - .34, y + .03, 0, .5, dk(c, .25)); qy(cx - .5, cx + .5, y + .04, .9, 1.7, '#ffe2a0', '#f6c878'); });
    qy(x0, x0 + .34, y + .04, 0, zt + .05, WALNUT); qy(x1 - .34, x1, y + .04, 0, zt + .05, WALNUT); qy(x0 + .06, x0 + .28, y + .05, .2, 1.85, WALNUT_L); qy(x1 - .28, x1 - .06, y + .05, .2, 1.85, WALNUT_L); }
  const ar = arcY(cx, y + .03, zt, (x1 - x0) / 2, 0, Math.PI, 12, .55); for (let i = 0; i < ar.length - 1; i++) lw(ar[i], ar[i + 1], BRASS); lw([x0, y + .03, 0], [x0, y + .03, zt], BRASS); lw([x1, y + .03, 0], [x1, y + .03, zt], BRASS);
  if (nm) { const tw = Math.min(W - .1, (nm.length * 4 + 7) / 16); signY(nm, cx - tw / 2, cx + tw / 2, y + .02, 2.98, 3.44, c, BRASS_L, { lit: !!p.lit }); }
}
function chandelier(p) {
  const r = p.r || 1, cx = 1.2, cy = 1.2, top = p.h || 2.4;
  lw([cx, cy, .2], [cx, cy, top], BRASS_D);
  const tier = (z, rr, n, back) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283 + rr, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; if ((x + y < cx + cy) !== back) continue; lw([cx, cy, z + .25], [x, y, z], BRASS); lw([x, y, z], [x, y, z + .14], LINEN); lit(() => dot(x, y, z + .2, '#fff4c0', 2)); for (let k = 1; k <= 3; k++) lit(() => dot(x, y, z - k * .11, k % 2 ? '#e8f6fb' : '#ffe9a0')); } };
  for (const back of [true, false]) { tier(.9, r, 12, back); tier(1.35, r * .62, 8, back); tier(1.75, r * .3, 5, back); if (back) { cyl(cx, cy, .9, r, .04, BRASS, { ol: false }); } }
  for (let k = 0; k < 6; k++) lit(() => dot(cx, cy, .75 - k * .1, k % 2 ? '#e8f6fb' : '#ffe9a0', k < 2 ? 2 : 1)); lit(() => ball(cx, cy, .1, .09, '#e8f6fb', { ol: false })); cyl(cx, cy, top - .08, .16, .08, BRASS, { ol: false });
  glow(() => ball(cx, cy, 1.2, r * .75, '#ffe9a0', { ol: false, t: '#fff4c8', d: '#f6c878' }));
}
function windowArt(p) {
  const w = p.w || 2, H = 2.8, y = .1, t = p.time || 'day', fn = skyline(t, p.view || 'city', p.seed || 3), c = p.c || BURG, r = (w - .5) / 2, cx = w / 2, zt = H - r * .7;
  qy(0, w, y, 0, H + .1, WALNUT_D);
  const pane = (u, v, ww, hh) => { const X = u / ww, ax = (X - .5) * (w - .5), z = v / 16, top = zt + Math.sqrt(Math.max(0, r * r - ax * ax)) * .7; if (z > top - 0.1) return WALNUT_D; if (u % 14 === 0 || v % 18 === 0) return '#4a3a34'; return fn(X, Math.min(.999, z / H)); };
  if (t === 'night') qy(.25, w - .25, y + .01, .1, H, pane); else lit(() => qy(.25, w - .25, y + .01, .1, H, pane));
  if (p.drape !== false) { for (const [a, b] of [[0, .42], [w - .42, w]]) { qy(a, b, y + .03, 0, H, c, dk(c, .18)); for (let x = a + .08; x < b; x += .12) lw([x, y + .04, .05], [x, y + .04, H - .1], dk(c, .3)); lw([a, y + .04, 1.1], [b, y + .04, 1.1], BRASS_L); } qy(-.05, w + .05, y + .05, H - .08, H + .22, c); for (let x = .05; x < w; x += .25) dot(x, y + .06, H - .12, BRASS_L); lw([-.05, y + .06, H + .22], [w + .05, y + .06, H + .22], BRASS); }
  qy(.2, w - .2, y + .04, .02, .12, MARBLE);
}
function palm(p) { cyl(.4, .4, 0, .26, .46, BRASS, { t: '#5a4030' }); lw([.22, .56, .14], [.22, .56, .36], BRASS_L); lw([.4, .4, .46], [.4, .4, 1.3], '#7a5a3a'); fronds(.4, .4, 1.1, 1.9, '#3f8a55', 9, p.seed || 1); fronds(.4, .4, .9, 1.3, '#357a4a', 6, (p.seed || 1) + 5); }
function board(p) {
  const ln = p.lines || ['TODAY'], w = p.w || 2.6, c = p.c || '#22262e';
  lw([.25, .25, 0], [.25, .15, .5], BRASS_D); lw([w - .25, .25, 0], [w - .25, .15, .5], BRASS_D); lw([.25, 0, 0], [.25, .15, .5], BRASS_D); lw([w - .25, 0, 0], [w - .25, .15, .5], BRASS_D);
  box(0, .1, .5, w, .12, 1.45, BRASS, { l: BRASS, ol: true }); qy(.08, w - .08, .225, .58, 1.87, c);
  ln.slice(0, 3).forEach((t, i) => { const s = String(t).slice(0, Math.floor(w * 4 - 1)), x = w / 2 - (s.length * 4 - 1) / 32; const d = () => textY(s, x, .23, 1.8 - i * .44, i === 0 ? '#ffd060' : LINEN); if (i === 0 && p.lit) lit(d); else d(); });
}
function carpet(p) { const w = p.w || 4, d = p.d || 2, c = p.c || RED, c2 = p.c2 || BRASS; qz(0, w, 0, d, .012, (x, y) => { const e = Math.min(x, y, w - x, d - y); if (e < .08) return dk(c, .3); if (e < .2) return c2; if (e < .28) return dk(c, .2); const k = (Math.floor(x * 2) + Math.floor(y * 2)) & 1, fx = x * 2 - Math.floor(x * 2), fy = y * 2 - Math.floor(y * 2); return Math.abs(fx - .5) + Math.abs(fy - .5) < .18 ? c2 : k ? c : dk(c, .08); }); }

const T = ['hotel'];
const A = (id, tags, size, draw, x) => Object.assign({ id: 'furn.hotel.' + id, kind: 'furniture', tags: T.concat(tags), size, draw, variants: [{}] }, x);
const WALL = { wall: true, mount: 0, solid: false };
export default [
  A('revdoor', ['hotel_revdoor'], [2.6, 2.6, 2.7], revdoor, { solid: false, vb: [-.2, -.2, 0, 2.8, 2.8, 2.9], variants: [{ frame: 0 }, { frame: 2 }] }),
  A('reception', ['hotel_reception'], p => [p.w || 5, 1, 1.15], reception, { vb: p => [-.2, -.2, 0, (p.w || 5) + .2, 1.2, 1.8], use: p => ({ x: (p.w || 5) / 2, y: 1.5 }), staff: p => ({ x: (p.w || 5) / 2, y: -.45, dir: 1 }), variants: [{ w: 5 }, { w: 7 }] }),
  A('bell', ['hotel_bell'], [.3, .3, .25], bell, { solid: false, vb: [-.3, -.1, 0, .6, .4, .6], variants: [{}, { ring: 1 }] }),
  A('keyrack', ['decor'], p => [p.w || 5, .15, 2.6], keyrack, Object.assign({ variants: [{ w: 5 }] }, WALL)),
  A('desk', ['hotel_desk'], p => [p.w || 2.6, .9, 1.1], desk, { vb: p => [-.2, -.2, 0, (p.w || 2.6) + .2, 1.1, 2], use: p => ({ x: (p.w || 2.6) / 2, y: 1.4 }), staff: p => ({ x: (p.w || 2.6) / 2, y: -.45, dir: 1 }), variants: ['concierge', 'shop', 'spa', 'host', 'steward'].map(kind => ({ kind })) }),
  A('cart', ['hotel_cart'], [1.5, .8, 1.95], cart, { vb: [-.1, -.1, 0, 1.6, .9, 2.05], variants: [{ n: 3 }, { n: 0 }, { n: 5, seed: 4 }] }),
  { id: 'prop.hotel.suitcase', kind: 'prop', tags: ['hotel', 'luggage'], size: p => (p.flat ? [.7, .5, .3] : [.52, .28, .78]), solid: false, draw: suitcase, variants: [{}, { c: '#2f5a4a' }, { tag: 1 }, { flat: 1, c: '#22304e' }] },
  A('lift', ['hotel_lift'], [2.4, .2, 3.2], lift, Object.assign({ use: { x: 1.2, y: .7 }, variants: [{}, { open: 1, at: .66 }, { at: 1, name: 'LIFT' }] }, WALL)),
  A('flowers', ['hotel_flowers'], [1.8, 1.8, .8], flowers, { vb: [-.6, -.6, 0, 2.4, 2.4, 2.8], use: { x: .9, y: 2.3 }, variants: [{}, { c: ['#f08a7a', '#f6b4a4', '#f8dcd0'], seed: 2 }, { c: ['#7a55c8', '#b07ad8', '#f6d24a'], seed: 3 }, { c: ['#f2c230', '#e89a2a', '#7a4a2a'], seed: 4 }] }),
  A('staffwall', ['hotel_staffwall'], [3.6, .12, 1.9], staffwall, Object.assign({ use: { x: 1.8, y: .7 }, variants: [{}, { you: { skin: '#ecba90', hair: '#4a3022', top: '#5ab0e0' } }] }, WALL, { mount: .7 })),
  A('gallery', ['decor'], p => [p.w || 8, .9, 2], gallery, Object.assign({ vb: p => [0, 0, -.3, p.w || 8, 1, 2.1], variants: [{ w: 8 }] }, WALL, { mount: 2.6 })),
  A('grandstair', ['hotel_stairs'], [3, 4.2, 2.5], grandstair, { vb: [-.2, -.1, 0, 3.2, 4.6, 3.7], use: { x: 1.5, y: 4.7 } }),
  A('easel', ['hotel_easel'], [1.6, .3, 1.6], easel, { solid: false, use: { x: .8, y: .8 }, variants: [{}, { on: 1 }] }),
  A('shopcase', ['shelf_unit'], p => [p.w || 3, .5, 2.4], shopcase, { variants: [{ w: 3 }] }),
  A('doorway', ['hotel_door'], p => [p.w || 3, .25, 3.5], doorway, Object.assign({ use: p => ({ x: (p.w || 3) / 2, y: .8 }), variants: [{ name: 'THE GILDED MAPLE', w: 4.4 }, { name: 'BAY BALLROOM', c: '#22304e', shut: 1, w: 3.4 }, { name: 'SPA', c: '#2f6a6a' }] }, WALL)),
  A('chandelier', ['lamp', 'overhead'], [2.4, 2.4, 2.4], chandelier, { solid: false, overhead: true, vb: [-.2, -.2, 0, 2.6, 2.6, 2.6], light: { x: 1.2, y: 1.2, z: 0, r: 6 }, variants: [{}, { r: .7 }] }),
  A('window', ['window'], p => [p.w || 2, .12, 3], windowArt, Object.assign({ vb: p => [-.1, 0, 0, (p.w || 2) + .1, .3, 3.2], variants: [{ time: 'day' }, { time: 'dusk', view: 'bay', w: 3 }, { time: 'night', w: 3 }, { time: 'night', view: 'bay', w: 4, c: '#22304e' }] }, WALL, { mount: .4 })),
  A('palm', ['plant'], [.8, .8, 2.4], palm, { vb: [-.8, -.8, 0, 1.6, 1.6, 3.2], variants: [{ seed: 1 }, { seed: 4 }] }),
  A('board', ['hotel_board'], p => [p.w || 2.6, .35, 1.95], board, { use: p => ({ x: (p.w || 2.6) / 2, y: .9 }), variants: [{ lines: ['TODAY', 'WEDDING', '17 - 23'] }, { lines: ['COCKTAILS', 'THE ALEX', 'GOLDEN HOUR'], w: 3, lit: 1 }] }),
  A('carpet', ['rug'], p => [p.w || 4, p.d || 2, .02], carpet, { solid: false, flat: true, variants: [{}, { w: 6, d: 2, c: '#22304e' }] }),
];
