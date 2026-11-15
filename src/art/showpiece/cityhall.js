// Maple Bay City Hall — rotunda + council chamber furniture. ids furn.cityhall.* (records / clerk / mayor / archive / tower pieces: cityhall_rooms.js; city props + home prints: cityhall_ext.js; helpers: _ch_lib.js).
//   seal (floor inlay)   model {hl: district index | null, all, fixed} the city under glass   portrait {k 0-5} (wall)   desk {kind: info|shop|clerk|sec|archive|guard|licence, w}   directory   detector
//   ballotbox   statue {k: null|pigeon|cat|leaf}   planter {k: fern|tulips|sunflowers}   bunting {w, c} (wall)   flagpole {k: city|bay}   bench {w, c, dir} (backless)   noticeboard (wall)
//   daisfloor {w, d}   daisdesk {w, seal}   cchair {back}   podium   voteboard {h, t, s, a, n, v} (wall, lit)   clerktable   railing {w}   niche (wall arch behind the statue)
import { R, box, qy, qx, qz, fq, lw, cyl, ball, dk, lt, lit, glow, MARBLE, MARBLE_D, BRASS, BRASS_D, BRASS_L, BURG, NAVY, GREEN, CREAM, LINEN, INK, WARM, marble, S2, dot, railX, fronds, bloom,
  OAK, OAK_D, OAK_L, CIVIC, CIVIC_D, BAIZE, STONE, STONE_D, SEALBLUE, MAPLE, PAPER, SLATE, ctext, plaque, counter, num7, bust, frame, leaf } from './_ch_lib.js';
const { signY, textY, PAT, rng, px, C, ellipse } = R;

function seal() {
  const c = 3;
  qz(0, 6, 0, 6, .012, (x, y) => {
    const dx = x - c, dy = y - c, d = Math.hypot(dx, dy); if (d > 2.95) return null; if (d > 2.8) return BRASS_D; if (d > 2.7) return BRASS_L;
    const a = Math.atan2(dy, dx);
    if (d > 2.15) { const k = ((a / (Math.PI / 12)) % 2 + 2) % 2; return Math.abs(k - 1) < .2 && Math.abs(d - 2.43) < .11 ? BRASS_L : SEALBLUE; }
    if (d > 2.05) return BRASS;
    const u = dx - dy, v = dx + dy;
    if (v > .7) return Math.floor((v + Math.sin(u * 3) * .14) * 5) % 2 ? '#3a8aa8' : '#8fd0e0';
    return Math.floor((Math.atan2(-(v - .7), u) + 7) / (Math.PI / 10)) & 1 ? '#f6e2a8' : '#f0cc78';
  });
  const s = S2(3, 3, .02); leaf(s[0], s[1] - 4, 14, dk(MAPLE, .25)); leaf(s[0], s[1] - 4, 12, MAPLE); R.line([s[0], s[1] - 12], [s[0], s[1] + 6], dk(MAPLE, .3));
}
export const MODEL_D = [['hillcrest', .7, .6, '#b8c890'], ['arts', 2.2, .55, '#b07ad8'], ['airport', 3.7, .55, '#b8c0c8'], ['park', .7, 1.55, '#4f9a45'], ['downtown', 2.2, 1.5, '#8aa0c0'], ['maplewood', 3.7, 1.5, '#e0a060'], ['oldtown', .8, 2.45, '#c8683a'], ['harbor', 2.2, 2.5, '#4a8ab0'], ['railyard', 3.7, 2.45, '#8a6a55']];
function model(p) {
  const W = 4.4, D = 3.2, hl = p.hl;
  box(0, 0, 0, W, D, .62, OAK, { l: PAT.planks(dk(OAK, .12), 9), r: PAT.planks(dk(OAK, .3), 9) }); box(-.06, -.06, .62, W + .12, D + .12, .08, OAK_D);
  for (const [x, y] of [[.06, .06], [W - .06, .06]]) lw([x, y, .7], [x, y, 1.3], BRASS_D);
  qz(.1, W - .1, .1, D - .1, .705, (x, y) => { if (y > 2.78 + .12 * Math.sin(x * 2.2) || (y > 2.2 && x > 1.5 && x < 2.9 && y > 2.35 + .1 * Math.sin(x * 5))) return (Math.floor(x * 9 + y * 5) & 1) ? '#4a9ac0' : '#5aaad0'; if (Math.abs(x - (1.42 + .1 * Math.sin(y * 3))) < .05) return '#5aaad0'; const fx = x * 2.2 - Math.floor(x * 2.2), fy = y * 2.2 - Math.floor(y * 2.2); if (fx < .1 || fy < .1) return '#c8c0ae'; return (Math.floor(x * 7) + Math.floor(y * 7)) & 1 ? '#8fbf78' : '#84b56e'; });
  MODEL_D.forEach(([id, x, y, c], i) => { const r = rng(i * 7 + 5), on = hl === i || p.all;
    for (let k = 0; k < (id === 'downtown' ? 9 : 6); k++) { const bx = x + (r() - .5) * .95, by = y + (r() - .5) * .55, h = id === 'downtown' ? .22 + r() * .5 : id === 'airport' ? .06 : .08 + r() * .14;
      if (id === 'park' || (id === 'hillcrest' && k % 2)) ball(bx, by, .78, .08, k % 2 ? '#4f9a45' : '#62b356', { ol: false }); else { box(bx, by, .705, .15, .15, h, r() < .3 ? lt(c, .2) : c, { ol: false }); if (on) lit(() => { dot(bx + .08, by + .15, .705 + h * .6, '#ffe9a0'); dot(bx + .15, by + .07, .705 + h * .4, '#ffd070'); }); } }
    if (on) { glow(() => { const s = S2(x, y, .72); ellipse(s[0], s[1], 13, 6, '#ffe9a0', 'glass'); }); } });
  dot(2.5, 1.95, .74, p.fixed ? '#8fe0ff' : '#b9b4a8', 2); if (p.fixed) lit(() => { dot(2.5, 1.95, .8, '#ffffff'); dot(2.5, 1.95, .86, '#c8f0ff'); });
  // glass case
  lw([.06, .06, 1.3], [W - .06, .06, 1.3], BRASS_D); lw([.06, .06, 1.3], [.06, D - .06, 1.3], BRASS_D); for (const [x, y] of [[.06, D - .06], [W - .06, D - .06]]) lw([x, y, .7], [x, y, 1.3], BRASS);
  lw([.06, D - .06, 1.3], [W - .06, D - .06, 1.3], BRASS_L); lw([W - .06, .06, 1.3], [W - .06, D - .06, 1.3], BRASS_L);
  for (const x of [.7, 1.0, 2.9]) lw([x, D - .06, .8], [x + .35, D - .06, 1.22], '#eaf6fb');
  // brass district buttons + label
  MODEL_D.forEach((m, i) => { const x = .42 + i * .445; dot(x, D, .46, BRASS_D, 2); if (hl === i) lit(() => dot(x, D, .46, '#ffe9a0', 2)); else dot(x, D, .47, BRASS_L); });
  plaque('MAPLE BAY', W / 2 - .9, W / 2 + .9, D + .001, .1, .34);
}
const MAYORS = [{ skin: '#e8c0a0', hair: '#e0e0e0', top: '#3a3040', beard: '#e0e0e0', hat: '#2a2733', bg: '#5a4636' }, { skin: '#d8a880', hair: '#3a2a20', top: '#22304e', stache: '#3a2a20', chain: 1, bg: '#3a4a40' },
  { skin: '#f0c8a8', hair: '#b8b0a0', top: '#5a2a30', glasses: 1, chain: 1, bg: '#4a4658' }, { skin: '#8a5a3a', hair: '#2a2420', top: '#2f5a4a', chain: 1, bg: '#6a5a40' },
  { skin: '#e8b890', hair: '#c86a2a', top: '#7a2030', hat: '#e8c06a', bg: '#3a5060' }, { skin: '#c88a60', hair: '#d8d8d8', top: '#22304e', tie: '#c8402e', chain: 1, bg: '#40584a' }];
function portrait(p) { const k = (p.k || 0) % MAYORS.length, m = MAYORS[k], y = .1; frame(0, 1.3, y, .28, 1.8); qy(.08, 1.22, y, .36, 1.72, m.bg); qy(.08, 1.22, y, .36, .7, dk(m.bg, .25)); bust(.65, y, .44, m); plaque(['1887', '1911', '1934', '1962', '1987', 'NOW'][k], .2, 1.1, y, .02, .24); }
const DESKN = { info: 'INFORMATION', shop: 'CIVIC SHOP', clerk: 'CITY CLERK', sec: 'THE MAYOR', archive: 'ARCHIVE', guard: 'SECURITY', licence: 'LICENCES' };
function desk(p) {
  const w = p.w || 3, k = p.kind || 'info', stone = k === 'info' || k === 'guard';
  if (stone) { box(0, 0, 0, w, .9, 1.02, MARBLE, { l: marble(MARBLE, 2), r: marble(MARBLE_D, 3) }); box(-.05, -.05, 1.02, w + .1, 1, .07, OAK); } else counter(w, .9, 1.02, OAK, k === 'shop' ? CIVIC : OAK_L);
  signY(DESKN[k], .1, w - .1, .91, .46, .82, k === 'guard' ? NAVY : CIVIC, BRASS_L, { frame: false }); lw([.2, .91, .46], [w - .2, .91, .46], BRASS); lw([.2, .91, .82], [w - .2, .91, .82], BRASS);
  if (k === 'info') { lw([w - .3, .45, 1.09], [w - .3, .45, 1.95], BRASS); lit(() => { box(w - .52, .35, 1.9, .44, .2, .4, '#3b6fd0', { ol: false }); textY('I', w - .36, .56, 2.22, '#ffffff'); }); for (let i = 0; i < 4; i++) box(.3 + i * .2, .3, 1.09, .14, .1, .22, ['#e8b63a', '#5ab0e0', '#e0608e', '#8fdcb4'][i], { ol: false }); cyl(1.5, .6, 1.09, .09, .06, BRASS, { ol: false }); }
  else if (k === 'shop') { for (let i = 0; i < 3; i++) { lw([.35 + i * .3, .4, 1.09], [.35 + i * .3, .4, 1.5], LINEN); qy(.35 + i * .3, .58 + i * .3, .4, 1.32, 1.48, [CIVIC, MAPLE, '#e8b63a'][i]); } for (let i = 0; i < 3; i++) cyl(1.6 + i * .28, .5, 1.09, .09, .16, [LINEN, '#5ab0e0', BURG][i], { ol: false }); box(w - .7, .3, 1.09, .4, .3, .08, PAPER, { ol: false }); }
  else if (k === 'guard') { box(.3, .25, 1.09, .6, .12, .42, SLATE, { ol: false }); lit(() => qy(.34, .86, .375, 1.14, 1.46, '#6ab8dc', '#8fd0e0')); box(w - .9, .3, 1.09, .6, .4, .05, '#b8c0c8', { ol: false }); }
  else { box(.3, .3, 1.09, .5, .36, .1, PAPER, { ol: false }); box(.32, .32, 1.19, .46, .32, .04, LINEN, { ol: false }); lw([w - .4, .4, 1.09], [w - .4, .4, 1.45], BRASS); box(w - .55, .3, 1.42, .3, .2, .14, k === 'sec' ? BURG : GREEN, { ol: false }); lit(() => qy(w - .53, w - .27, .5, 1.38, 1.42, '#fff0b0'));
    if (k === 'archive') for (let i = 0; i < 4; i++) { qy(1.2 + i * .32, 1.46 + i * .32, .6, 1.09, 1.3, OAK_L); dot(1.33 + i * .32, .6, 1.2, BRASS); } if (k === 'clerk' || k === 'licence') { cyl(1.5, .5, 1.09, .08, .14, OAK_D, { ol: false }); cyl(1.75, .5, 1.09, .08, .14, MAPLE, { ol: false }); } }
}
function directory() {
  const w = 2.4, y = .22; for (const x of [.1, w - .1]) { box(x - .08, .08, 0, .16, .16, .12, BRASS_D, { ol: false }); lw([x, .16, 0], [x, .16, 3.25], BRASS); lw([x + .04, .16, 0], [x + .04, .16, 3.25], BRASS_L); dot(x, .16, 3.29, BRASS_L, 2); }
  qy(.14, w - .14, y, .45, 3.2, BRASS); qy(.2, w - .2, y, .5, 2.78, '#1c2028'); ctext('DIRECTORY', .14, w - .14, y, 3.12, '#4a3418');
  ['COUNCIL', 'RECORDS', 'CLERK 2F', 'MAYOR 2F', 'ARCHIVE', 'TOWER 4F'].forEach((t, i) => textY(t, .28, y, 2.68 - i * .4, i % 2 ? '#f4f0e8' : '#ffe9a0'));
}
function detector() { for (const x of [0, 1.1]) { box(x, .1, 0, .2, .3, 2.1, '#c8ccd4'); lw([x + .1, .4, .2], [x + .1, .4, 1.9], '#8a909a'); } box(0, .1, 2.1, 1.3, .3, .2, '#aab0ba'); lit(() => { dot(.25, .4, 2.2, '#6fe08a', 2); dot(1.05, .4, 2.2, '#6fe08a', 2); }); }
function ballotbox(p) {
  for (const [x, y] of [[.08, .08], [.72, .08], [.08, .52], [.72, .52]]) lw([x, y, 0], [x, y, .5], OAK_D);
  box(0, 0, .5, .8, .6, .55, OAK, { l: PAT.planks(dk(OAK, .1), 6) }); qz(.2, .6, .26, .34, 1.055, INK); const s = S2(.4, .6, .78); ellipse(s[0], s[1], 5, 5, BRASS); leaf(s[0], s[1], 3, MAPLE);
  lw([.4, .1, 1.05], [.4, .1, 1.45], BRASS_D); signY(p.shut ? 'CLOSED' : 'VOTE', -.05, .85, .12, 1.42, 1.72, p.shut ? '#6a6a70' : CIVIC, LINEN); if (!p.shut) { qy(.3, .5, .3, 1.05, 1.22, PAPER); }
}
function statue(p) {
  const k = p.k, BZ = '#8a6a3a', BZL = '#b8904a';
  box(0, 0, 0, 1.2, 1.2, .2, MARBLE_D); box(.1, .1, .2, 1, 1, .75, MARBLE, { l: marble(MARBLE, 4), r: marble(MARBLE_D, 5) }); box(.04, .04, .95, 1.12, 1.12, .1, MARBLE_D); plaque(null, .3, .9, 1.101, .42, .68);
  if (k === 'pigeon') { cyl(.6, .6, 1.05, .2, .12, BZ, { ol: false }); lw([.52, .6, 1.17], [.5, .6, 1.4], BZ); lw([.68, .6, 1.17], [.7, .6, 1.4], BZ); ball(.6, .6, 1.72, .36, BZ, { t: BZL, squash: .8 }); ball(.74, .7, 2.12, .19, BZ, { t: BZL }); const s = S2(.86, .86, 2.1); px(s[0], s[1], C('#e8c06a')); px(s[0] + 1, s[1], C('#e8c06a')); px(s[0] - 2, s[1] - 2, C(INK)); fq([[.3, .5, 1.9], [.05, .35, 2.2], [.2, .5, 1.6]], dk(BZ, .15)); lw([.3, .4, 1.5], [.02, .25, 1.45], BZ); }
  else if (k === 'cat') { ball(.6, .6, 1.4, .34, BZ, { t: BZL, squash: 1.05 }); ball(.62, .64, 1.92, .22, BZ, { t: BZL }); for (const d of [-.12, .12]) fq([[.62 + d - .07, .64, 2.08], [.62 + d + .07, .64, 2.08], [.62 + d, .64, 2.3]], BZ); lw([.9, .6, 1.1], [1.08, .6, 1.5], BZ); lw([1.08, .6, 1.5], [1.0, .6, 1.72], BZ); const s = S2(.7, .82, 1.94); px(s[0] - 2, s[1], C('#ffe9a0')); px(s[0] + 2, s[1] + 1, C('#ffe9a0')); }
  else if (k === 'leaf') { lw([.6, .6, 1.05], [.6, .6, 1.5], BZ); lw([.63, .6, 1.05], [.63, .6, 1.5], BZL); const s = S2(.6, .6, 2.05); leaf(s[0], s[1], 13, dk('#e8c06a', .3)); leaf(s[0], s[1], 11, '#e8c06a'); R.line([s[0], s[1] - 9], [s[0], s[1] + 9], '#b8862e'); }
  else { fq([[.42, .7, 1.05], [.78, .7, 1.05], [.78, .62, 1.27], [.42, .62, 1.27]], LINEN); lw([.48, .68, 1.14], [.72, .68, 1.14], '#8a8478'); lw([.48, .66, 1.2], [.66, .66, 1.2], '#8a8478'); }
}
function niche() { const w = 2.4, y = .12; qy(0, w, y, 0, 3.6, MARBLE_D); qy(.25, w - .25, y, .1, 2.7, dk(STONE_D, .22)); const pts = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; pts.push([w / 2 + Math.cos(a) * (w / 2 - .25), y, 2.7 + Math.sin(a) * .7]); } fq(pts, dk(STONE_D, .22)); for (let i = 0; i < pts.length - 1; i++) lw(pts[i], pts[i + 1], BRASS_D); lw([.25, y, .1], [.25, y, 2.7], BRASS_D); lw([w - .25, y, .1], [w - .25, y, 2.7], BRASS_D); glow(() => qy(.4, w - .4, y, 2.2, 3.1, '#ffe9b0', 'glass')); }
function planter(p) {
  const k = p.k || 'fern', r = rng((p.seed || 1) * 5 + 2); box(0, 0, 0, 1.6, .6, .5, STONE, { l: PAT.stone(dk(STONE, .15)), r: PAT.stone(dk(STONE, .3)) }); qz(.08, 1.52, .08, .52, .505, '#5a4030');
  if (k === 'fern') for (let i = 0; i < 3; i++) fronds(.35 + i * .45, .3, .5, .9, i % 2 ? '#3f8a55' : '#4f9a45', 7, i + 3 + (p.seed || 0));
  else for (let i = 0; i < 9; i++) { const x = .18 + i * .155, y = .2 + r() * .22, h = k === 'tulips' ? .32 + r() * .16 : .7 + r() * .45; lw([x, y, .5], [x, y, .5 + h], '#3f8a55'); if (k === 'tulips') { const c = ['#e0483a', '#f2c230', '#f28fb0', '#b07ad8'][i % 4]; ball(x, y, .55 + h, .075, c, { ol: false, squash: 1.2 }); } else { const s = S2(x, y, .56 + h); ellipse(s[0], s[1], 3.4, 3.4, '#f2c230'); ellipse(s[0], s[1], 1.4, 1.4, '#7a4a2a'); lw([x, y, .5 + h * .5], [x + .1, y, .5 + h * .6], '#4f9a45'); } }
}
function bunting(p) { const w = p.w || 6, c = p.c || MAPLE, y = .1, n = Math.max(1, Math.round(w / 3)); for (let s = 0; s < n; s++) { const x0 = s * w / n, x1 = (s + 1) * w / n; let prev = null; for (let i = 0; i <= 12; i++) { const t = i / 12, x = x0 + (x1 - x0) * t, z = .5 - Math.sin(t * Math.PI) * .22, q = [x, y, z]; if (prev) { lw(prev, q, '#6a5a48'); const mx = (prev[0] + x) / 2, mz = (prev[2] + z) / 2; fq([[prev[0], y, prev[2]], [x, y, z], [mx, y, mz - .2]], i % 2 ? c : CREAM); } prev = q; } } }
function flagpole(p) { const city = p.k !== 'bay', c = city ? CIVIC : SEALBLUE; cyl(.25, .25, 0, .2, .1, BRASS_D, { ol: false }); cyl(.25, .25, .1, .13, .08, BRASS, { ol: false }); lw([.25, .25, .18], [.25, .25, 2.85], BRASS); lw([.28, .25, .18], [.28, .25, 2.85], BRASS_L); dot(.26, .25, 2.9, BRASS_L, 2);
  fq([[.3, .25, 2.7], [.86, .25, 2.56], [.8, .25, 1.3], [.32, .25, 1.45]], c); fq([[.3, .25, 2.7], [.5, .25, 2.65], [.48, .25, 1.4], [.32, .25, 1.45]], dk(c, .15)); lw([.62, .25, 2.6], [.6, .25, 1.36], lt(c, .15)); const s = S2(.62, .25, 2.05); if (city) leaf(s[0], s[1], 3, '#f4ecd8'); else { ellipse(s[0], s[1], 3, 3, '#f4ecd8'); px(s[0], s[1], C(SEALBLUE)); } lw([.3, .25, 2.7], [.86, .25, 2.56], BRASS_L); }
function bench(p) { const w = p.w || 2, c = p.c || CIVIC; for (const x of [.12, w - .12]) { box(x - .08, .06, 0, .16, .48, .3, OAK_D, { ol: false }); } box(0, 0, .3, w, .6, .1, OAK, { t: PAT.fboards(OAK, .2) }); box(.06, .05, .4, w - .12, .5, .05, c, { ol: false, t: c, t2: lt(c, .1) }); if (p.bow) for (const x of [.05, w - .05]) { const s = S2(x, .6, .36); ellipse(s[0], s[1], 2.4, 2, '#f2a7c3'); px(s[0], s[1] + 3, C('#f2a7c3')); } }
function noticeboard() { const y = .1; qy(0, 2.4, y, 0, 1.6, OAK_D); qy(.08, 2.32, y, .08, 1.3, '#b8905a', '#b08850'); ctext('NOTICES', 0, 2.4, y, 1.56, BRASS_L); const r = rng(31); for (let i = 0; i < 7; i++) { const x = .16 + (i % 4) * .54 + r() * .1, z = .2 + Math.floor(i / 4) * .55 + r() * .08, c = [PAPER, '#f6e2a8', LINEN, '#cfe9f4', '#f6c8c0'][i % 5]; qy(x, x + .42, y, z, z + .46, c); lw([x + .06, y, z + .34], [x + .36, y, z + .34], '#6a5a48'); lw([x + .06, y, z + .24], [x + .3, y, z + .24], '#9a8a78'); lw([x + .06, y, z + .14], [x + .34, y, z + .14], '#9a8a78'); dot(x + .21, y, z + .44, ['#e0483a', '#3b6fd0', '#f2c230'][i % 3]); } }
function daisfloor(p) { const w = p.w || 9, d = p.d || 4; box(0, 0, 0, w, d, .3, OAK_D, { l: PAT.planks(dk(OAK, .2), 8), r: PAT.planks(dk(OAK, .4), 8), t: (x, y) => { const e = Math.min(x, y, w - x, d - y); return e < .1 ? BRASS_D : e < .18 ? dk(CIVIC, .3) : (Math.floor(x * 3) + Math.floor(y * 3)) & 1 ? CIVIC : dk(CIVIC, .06); } }); }
function daisdesk(p) {
  const w = p.w || 6, n = p.n || Math.max(1, Math.round(w / 1.25));
  box(0, 0, 0, w, .6, 1.05, OAK, { l: (u, v) => (u % 20 < 1 || v % 16 === 15 ? dk(OAK, .32) : (u % 20 > 2 && u % 20 < 18 && v > 3 && v < 12) ? dk(OAK, .08) : dk(OAK, .18)), r: PAT.planks(dk(OAK, .34), 6) }); box(-.04, -.04, 1.05, w + .08, .68, .06, OAK_D, { t: BAIZE });
  for (let i = 0; i < n; i++) { const x = (i + .5) * w / n; plaque(null, x - .28, x + .28, .601, .72, .9); lw([x - .2, .601, .81], [x + .2, .601, .81], '#4a3418'); lw([x + .3, .3, 1.11], [x + .22, .42, 1.42], INK); dot(x + .22, .42, 1.43, SLATE, 2); box(x - .32, .22, 1.11, .28, .2, .02, PAPER, { ol: false }); }
  if (p.seal) { const s = S2(w / 2, .6, .42); ellipse(s[0], s[1], 7, 7, BRASS_D); ellipse(s[0], s[1], 6, 6, SEALBLUE); leaf(s[0], s[1], 4, MAPLE); }
}
function cchair(p) { const c = p.c || '#4a2a24'; box(.06, .16, 0, .48, .48, .12, OAK_D, { ol: false }); box(.04, .12, .12, .52, .54, .33, c); if (p.back !== 0) { box(.04, .02, .45, .52, .12, p.tall ? 1.15 : .85, c); if (p.tall) { const s = S2(.3, .14, 1.4); ellipse(s[0], s[1], 3, 3, BRASS_L); } } }
function podium() { box(.2, .1, 0, .6, .45, .12, OAK_D); box(.25, .14, .12, .5, .36, .9, OAK, { l: PAT.planks(dk(OAK, .12), 5) }); fq([[.15, .05, 1.02], [.85, .05, 1.02], [.85, .6, 1.2], [.15, .6, 1.2]], OAK_L); lw([.15, .6, 1.2], [.85, .6, 1.2], OAK_D); qy(.15, .85, .6, 1.1, 1.2, OAK_D); const s = S2(.5, .5, .62); ellipse(s[0], s[1], 4, 4, BRASS); leaf(s[0], s[1], 2, MAPLE); lw([.75, .2, 1.1], [.6, .15, 1.5], INK); dot(.6, .15, 1.52, SLATE, 2); }
function voteboard(p) {
  const W = 7, H = 3.2, y = .2, v = String(p.v || '-------'), yy = y + .002;
  qy(0, W, y, 0, H, OAK_D); lw([0, y, H], [W, y, H], OAK_L); qy(.12, W - .12, yy, .12, H - .12, '#141820');
  lit(() => { ctext(p.h || 'MAPLE BAY CITY COUNCIL', .12, W - .12, yy, H - .2, '#ffd060'); ctext(String(p.t || '').slice(0, 26), .12, W - .12, yy, H - .64, '#f4f0e8');
    if (p.a !== undefined) { textY('AYE', .9, yy, 1.95, '#6fe08a'); num7(p.a | 0, 1.9, yy, 1.4, '#6fe08a', .3, .56); textY('NAY', 3.9, yy, 1.95, '#ff7a6a'); num7(p.n | 0, 4.9, yy, 1.4, '#ff7a6a', .3, .56);
      for (let i = 0; i < 7; i++) { const x = 1.1 + i * .8, c = v[i] === 'A' ? '#6fe08a' : v[i] === 'N' ? '#ff7a6a' : '#3a4250'; qy(x - .16, x + .16, yy, .9, 1.12, c); } }
    else { ctext(p.t2 || '', .12, W - .12, yy, 2.1, '#8fd0ff'); ctext(p.t3 || '', .12, W - .12, yy, 1.62, '#f4f0e8'); ctext(p.t4 || '', .12, W - .12, yy, 1.14, '#f4f0e8'); }
    ctext(p.s || '', .12, W - .12, yy, .62, p.sc || '#8fd0ff'); });
}
function clerktable() { for (const [x, y] of [[.1, .1], [1.9, .1], [.1, .8], [1.9, .8]]) lw([x, y, 0], [x, y, .72], OAK_D); box(0, 0, .72, 2, .9, .08, OAK, { t: PAT.fboards(OAK, .3) }); box(.2, .3, .8, .5, .4, .03, PAPER, { ol: false }); qz(.24, .66, .34, .44, .835, '#8a5a34'); lw([.3, .5, .84], [.6, .5, .84], '#6a5a48'); lw([.3, .58, .84], [.55, .58, .84], '#6a5a48'); box(1.2, .25, .8, .5, .35, .16, SLATE, { ol: false }); lw([.9, .6, .8], [.84, .7, 1.02], BRASS); signY('SIGN UP', .1, 1.9, .9, .26, .6, CIVIC, LINEN, { frame: false }); }
function railing(p) { const w = p.w || 4; for (const x of [.08, w - .08]) box(x - .08, .02, 0, .16, .16, .95, OAK, { ol: true }); railX(.16, w - .16, .1, 0, .8, BRASS); }

const T = ['cityhall'];
const A = (id, tags, size, draw, x) => Object.assign({ id: 'furn.cityhall.' + id, kind: 'furniture', tags: T.concat(tags), size, draw, variants: [{}] }, x);
const WALL = { wall: true, mount: 0, solid: false };
export default [
  A('seal', ['rug', 'ch_seal'], [6, 6, .02], seal, { solid: false, flat: true, vb: [-.1, -.1, 0, 6.1, 6.1, .2] }),
  A('model', ['ch_model'], [4.4, 3.2, 1.3], model, { vb: [-.2, -.2, 0, 4.6, 3.4, 1.5], use: { x: 2.2, y: 3.8 }, variants: [{}, { hl: 4 }, { all: 1, fixed: 1 }] }),
  A('portrait', ['ch_portrait'], [1.3, .1, 1.8], portrait, Object.assign({ use: { x: .65, y: .7 }, variants: [0, 1, 2, 3, 4, 5].map(k => ({ k })) }, WALL, { mount: .9 })),
  A('desk', ['ch_desk'], p => [p.w || 3, .9, 1.1], desk, { vb: p => [-.2, -.2, 0, (p.w || 3) + .2, 1.1, 2.4], use: p => ({ x: (p.w || 3) / 2, y: 1.45 }), staff: p => ({ x: (p.w || 3) / 2, y: -.45, dir: 1 }), variants: ['info', 'shop', 'clerk', 'sec', 'archive', 'guard', 'licence'].map(kind => ({ kind })) }),
  A('directory', ['ch_directory'], [2.4, .3, 3.3], directory, { vb: [-.1, -.1, 0, 2.5, .5, 3.4], use: { x: 1.2, y: .9 } }),
  A('detector', ['decor'], [1.3, .5, 2.3], detector, { solid: false, vb: [-.1, 0, 0, 1.4, .6, 2.4] }),
  A('ballotbox', ['ch_ballot'], [.8, .6, 1.1], ballotbox, { vb: [-.2, -.1, 0, 1, .8, 1.8], use: { x: .4, y: 1.15 }, variants: [{}, { shut: 1 }] }),
  A('statue', ['ch_statue'], [1.2, 1.2, 1.05], statue, { vb: [-.3, -.3, 0, 1.5, 1.5, 2.9], use: { x: .6, y: 1.75 }, variants: [{}, { k: 'pigeon' }, { k: 'cat' }, { k: 'leaf' }] }),
  A('niche', ['decor'], [2.4, .12, 3.6], niche, WALL),
  A('planter', ['plant'], [1.6, .6, .5], planter, { vb: [-.4, -.4, 0, 2, 1, 2], variants: [{}, { k: 'tulips' }, { k: 'sunflowers' }] }),
  A('bunting', ['decor'], p => [p.w || 6, .1, .5], bunting, Object.assign({ variants: [{}, { c: '#2f8a8a' }, { c: '#e8b63a', w: 9 }] }, WALL, { mount: 3.2 })),
  A('flagpole', ['decor'], [.5, .5, 2.9], flagpole, { vb: [-.1, -.1, 0, 1, .6, 3], variants: [{}, { k: 'bay' }] }),
  A('bench', ['ch_seat'], p => [p.w || 2, .6, .45], bench, { vb: p => [-.1, -.1, 0, (p.w || 2) + .1, .8, .6], seats: p => { const w = p.w || 2, n = Math.max(1, Math.round(w / .8)); return Array.from({ length: n }, (_, i) => ({ x: n === 1 ? w / 2 : .45 + i * (w - .9) / (n - 1), y: .3, z: .45, dir: p.dir === undefined ? 1 : p.dir })); }, variants: [{}, { w: 4, c: '#7a2030' }, { w: 3, c: '#f4ecd8', bow: 1 }] }),
  A('noticeboard', ['ch_notices'], [2.4, .1, 1.6], noticeboard, Object.assign({ use: { x: 1.2, y: .7 } }, WALL, { mount: .8 })),
  A('daisfloor', ['decor'], p => [p.w || 9, p.d || 4, .3], daisfloor, { variants: [{}] }),
  A('daisdesk', ['decor'], p => [p.w || 6, .6, 1.11], daisdesk, { vb: p => [-.1, -.1, 0, (p.w || 6) + .1, .8, 1.6], variants: [{ seal: 1 }, { w: 2.4, n: 2 }] }),
  A('cchair', ['ch_cchair'], p => [.6, .7, p.back === 0 ? .45 : p.tall ? 1.6 : 1.3], cchair, { seats: [{ x: .3, y: .42, z: .45, dir: 1 }], variants: [{}, { tall: 1, c: '#2f5a4a' }, { back: 0 }] }),
  A('podium', ['ch_podium'], [1, .7, 1.25], podium, { vb: [-.1, -.1, 0, 1.1, .8, 1.7], use: { x: .5, y: 1.2 }, pose: { x: .5, y: 1.15, z: 0, dir: 3 } }),
  A('voteboard', ['ch_board'], [7, .2, 3.2], voteboard, Object.assign({ use: { x: 3.5, y: .8 }, variants: [{ t: 'ROUTE 14: PUNCTUALITY', a: 4, n: 2, v: 'AANA-A-', s: 'VOTING', h: 'ITEM 2 OF 4' }, { t: 'NEXT MEETING', t2: 'TUESDAY 18:30', t3: 'PUBLIC WELCOME', s: 'CHAMBER OPEN' }] }, WALL, { mount: 1.9 })),
  A('clerktable', ['ch_signup'], [2, .9, .8], clerktable, { vb: [-.1, -.1, 0, 2.1, 1, 1.2], use: { x: 1, y: 1.4 }, staff: { x: 1, y: -.45, dir: 1 } }),
  A('railing', ['decor'], p => [p.w || 4, .2, .95], railing, { variants: [{}, { w: 6 }] }),
];
