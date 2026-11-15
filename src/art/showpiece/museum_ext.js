// Museum of Maple Bay — exterior, special-exhibition pieces and take-home goods.
//   bld.arts.museum2 (14 x 12, door on +y at 7): limestone hall with a six-column portico, copper dome, a modern glass wing and season banners (ENV.season picks the exhibition)
//   furn.mus.special {season 0-3} centrepiece: biplane / blue whale / giant tin robot / woolly mammoth      furn.mus.backdrop {season, w} freestanding mural wall
//   furn.home.wall.mus_print {k: picture id} framed print for home      furn.home.mus_dino desk-size skeleton      prop.mus.lostbox {k 0-2} an old box with something in it (city)
import * as R from '../../engine/raster.js';
import { STONE, STONE_D, MARBLE, BONE, BONE_D, BRASS, WOOD, WOOD_D, NAVY, RED, GOLD, INK, SEASON_C, SEASON_NAME, S2, dot, blob, strokes, hang, picW } from './_mus_lib.js';
const { box, qy, qx, qz, fq, lw, lit, glow, cyl, ball, dk, lt, rng, hash2, signY, textY, PAT, ENV, winX, winY } = R;
const COPPER = '#5aa890', LIME = '#e9e0c8';

function museum(p) {
  const s = ENV.season || 0, sc = SEASON_C[s], st = LIME, P = .6, H = 6;
  box(0, 0, 0, 14, 10.6, P, dk(st, .12), { l: PAT.stone(dk(st, .16)), r: PAT.stone(dk(st, .3)) });
  box(.4, .4, P, 13.2, 9.2, H - P, st, { l: PAT.stone(dk(st, .08)), r: PAT.stone(dk(st, .26)), t: '#8a8478' });
  for (let y = 1.2; y < 9; y += 2.05) { winX(13.6, y, y + 1.1, P + .9, P + 3.6, { on: true, mullion: 'cross', glowc: ['#ffe2a0', '#ffc27a'] }); qx(13.6, y - .12, y + 1.22, P + 3.6, P + 3.75, lt(st, .2)); }
  for (const x of [1, 2.4]) { winY(x, x + .95, 9.6, P + .9, P + 3.6, { on: true, mullion: 'cross', glowc: ['#ffe2a0', '#ffc27a'] }); qy(x - .1, x + 1.05, 9.6, P + 3.6, P + 3.75, lt(st, .2)); }
  qy(.4, 13.6, 9.6, H - .5, H - .35, dk(st, .3)); qx(13.6, .4, 9.6, H - .5, H - .35, dk(st, .45));
  // dome
  cyl(7, 5, H, 2.5, .7, dk(st, .1)); ball(7, 5, H + 1.5, 2.1, COPPER, { squash: .78 }); for (const dx of [-14, -7, 0, 7, 14]) { const a = S2(7, 5, H + .7), b = S2(7, 5, H + 3.2); R.line([a[0] + dx * 2.6, a[1] - 4 + Math.abs(dx) * .5], [b[0] + dx * .4, b[1] + 2], dk(COPPER, .3)); }
  cyl(7, 5, H + 3.1, .35, .5, st); lit(() => { const q = S2(7, 5, H + 3.4); R.rect(q[0] - 3, q[1] - 2, 7, 5, '#ffe9a0'); }); R.cone(7, 5, H + 3.6, .4, .6, COPPER);
  // modern glass wing
  box(10.2, 5.6, P, 3.4, 4.3, 6.4, '#2f7f86', { l: (u, v) => (u % 9 === 0 || v % 12 === 0 ? '#1f5a60' : ((u >> 3) + (v >> 3)) % 3 ? '#6fc0c8' : '#8ad4d8'), r: (u, v) => (u % 9 === 0 || v % 12 === 0 ? '#184a50' : '#4a9aa4'), t: '#3a4a50' });
  glow(() => { qy(10.2, 13.6, 9.9, P + .1, P + 6.3, (u, v) => (u % 9 === 0 || v % 12 === 0 ? null : hash2(u / 9 | 0, v / 12 | 0, 5) > .3 ? '#ffe2a0' : '#f4c070')); qx(13.6, 5.6, 9.9, P + .1, P + 6.3, (u, v) => (u % 9 === 0 || v % 12 === 0 ? null : hash2(u / 9 | 0, v / 12 | 0, 8) > .4 ? '#f4c870' : '#e0a858')); });
  lit(() => { qy(10.5, 13.3, 9.92, P + 4.5, P + 5.7, sc[0]); signY(SEASON_NAME[s].split(' ')[0], 10.5, 13.3, 9.92, P + 4.85, P + 5.35, sc[0], sc[1], { frame: false }); });
  // portico
  qy(3.8, 10.2, 9.6, P, 4.9, dk(st, .34)); qy(6, 8, 9.6, P, P + 3, '#4a3426'); qy(6.15, 6.95, 9.6, P + .1, P + 2.8, '#7fb6d0', '#9fcbe0'); qy(7.05, 7.85, 9.6, P + .1, P + 2.8, '#7fb6d0', '#9fcbe0'); glow(() => { qy(6.15, 7.85, 9.6, P + .1, P + 2.8, '#ffe2a0'); }); lw([7, 9.6, P], [7, 9.6, P + 3], '#4a3426');
  for (const [x, k] of [[4.55, 0], [8.75, 2]]) lit(() => { qy(x, x + .7, 9.62, P + 1, P + 3.9, sc[k]); qy(x + .08, x + .62, 9.62, P + 3.5, P + 3.6, sc[1]); qy(x + .15, x + .55, 9.62, P + 2, P + 2.9, sc[1]); qy(x + .25, x + .45, 9.62, P + 2.2, P + 2.7, sc[k ? 0 : 2]); });
  for (let i = 0; i < 6; i++) { const x = 4.25 + i * 1.1; if (i === 2 || i === 3) continue; box(x - .28, 10.05, P, .56, .56, .16, dk(st, .1), { ol: false }); cyl(x, 10.33, P + .16, .2, 3.95, MARBLE); glow(() => { const a = S2(x, 10.33, P + .3), b = S2(x, 10.33, P + 2.2); R.line([a[0] - 2, a[1] + 3], [b[0] - 2, b[1] + 3], '#ffe9b0'); }); box(x - .3, 10.03, 4.72, .6, .6, .18, st, { ol: false }); }
  for (const x of [5.35, 8.65]) { box(x - .28, 10.05, P, .56, .56, .16, dk(st, .1), { ol: false }); cyl(x, 10.33, P + .16, .2, 3.95, MARBLE); box(x - .3, 10.03, 4.72, .6, .6, .18, st, { ol: false }); }
  box(3.7, 9.5, 4.9, 6.6, 1.2, .8, st); lw([3.7, 10.7, 4.9], [10.3, 10.7, 4.9], dk(st, .4));
  R.gable(3.7, 9.5, 5.7, 6.6, 1.2, 1.7, 'y', '#8a8478', { wall: lt(st, .1), over: .1 }); for (let a = 0; a < 14; a++) blob(7 + Math.cos(a * .8) * (.5 - a * .03), 10.72, 6.25 + Math.sin(a * .8) * (.4 - a * .025), 2, 2, a % 2 ? GOLD : dk(GOLD, .2));
  textY('MUSEUM OF MAPLE BAY', 4.65, 10.7, 5.5, '#5a4a3a');
  // steps + cheek walls with bronze ammonites
  for (let i = 0; i < 4; i++) box(4, 10.6 + i * .35, 0, 6, .35, P - i * .15, lt(st, .06), { ol: false, l: dk(st, .1 + (i & 1) * .08) });
  for (const x of [3.3, 10]) { box(x, 10.6, 0, .7, 1.4, .8, st); for (let a = 0; a < 12; a++) blob(x + .35 + Math.cos(a * .9) * (.24 - a * .016), 11.3, 1.12 + Math.sin(a * .9) * (.24 - a * .016), 2, 2, a % 2 ? '#8a6a48' : '#6a5038'); glow(() => blob(x + .35, 12, .5, 3, 2, '#ffe9a0')); }
  if (s === 3) { qz(.5, 13.5, .5, 6.5, H + .01, '#f4f8fb', '#e2eaf0'); for (let x = 4; x < 10; x += .25) dot(x, 10.7, 5.72, '#f4f8fb', 0, -1); }
}

function special(p) {
  const s = p.season || 0; box(0, 0, 0, 3.4, 2.4, .3, '#3a3a48', { t: '#4a4a5a' }); qy(.1, 3.3, 2.4, .06, .1, BRASS); const Z = .3;
  if (s === 0) { for (const x of [1.2, 2.2]) lw([x, 1.2, Z], [x, 1.2, Z + 1.1], '#6a6a76'); qz(1.1, 2.1, .1, 2.3, Z + 1.25, '#f0e6cc', '#e2d6b8'); box(.4, 1.02, Z + 1.3, 2.5, .36, .34, RED); fq([[.4, 1.2, Z + 1.64], [.85, 1.2, Z + 1.64], [.4, 1.2, Z + 2.05]], RED); qz(.3, .7, .7, 1.7, Z + 1.5, '#f0e6cc'); for (const y of [.3, 2.1]) lw([1.3, y, Z + 1.27], [1.3, y, Z + 1.95], '#5a4030'); for (const y of [.3, 2.1]) lw([1.9, y, Z + 1.27], [1.9, y, Z + 1.95], '#5a4030'); qz(1.1, 2.1, .1, 2.3, Z + 1.95, '#f8eed8', '#eadcc0'); lw([1.1, 2.3, Z + 1.95], [2.1, 2.3, Z + 1.95], '#b8a888'); cyl(2.95, 1.2, Z + 1.36, .12, .2, '#3a3a44', { ol: false }); lw([3.05, .7, Z + 1.47], [3.05, 1.7, Z + 1.47], '#5a4030'); lw([3.05, 1.2, Z + 1.0], [3.05, 1.2, Z + 1.95], '#5a4030'); for (const y of [.85, 1.55]) { lw([1.9, y, Z + 1.3], [2.1, y, Z + .95], '#3a3a44'); blob(2.1, y, Z + .9, 2.4, 2.4, INK); } blob(1.75, 1.2, Z + 1.7, 2, 2, '#f4c8a0'); }
  else if (s === 1) { for (const x of [1, 2.3]) lw([x, 1.2, Z], [x, 1.2, Z + 1.2], '#6a6a76'); for (let i = 0; i < 12; i++) { const x = .5 + i * .22, r = .16 + .3 * Math.sin((i + 1) / 13 * Math.PI) ** .8; ball(x, 1.2, Z + 1.5, r, '#4a7a9a', { squash: .7, ol: false, d: '#c8dce4', t: '#6a9ab8' }); } fq([[.5, 1.2, Z + 1.5], [.05, .6, Z + 1.75], [.25, 1.2, Z + 1.5]], '#3a6a8a'); fq([[.5, 1.2, Z + 1.5], [.05, 1.8, Z + 1.75], [.25, 1.2, Z + 1.5]], '#4a7a9a'); fq([[2.2, 1.5, Z + 1.3], [2.5, 1.5, Z + 1.3], [2.1, 1.9, Z + .9]], '#3a6a8a'); blob(2.85, 1.42, Z + 1.56, 1, 1, INK); for (let i = 0; i < 5; i++) lw([2.3 + i * .12, 1.5, Z + 1.3], [2.5 + i * .12, 1.5, Z + 1.38], '#c8dce4'); }
  else if (s === 2) { for (const x of [1.15, 1.85]) box(x, 1, Z, .4, .5, .7, '#5a6a78'); box(.95, .85, Z + .7, 1.5, .8, 1.1, RED, { l: dk(RED, .1) }); lit(() => { const q = S2(1.7, 1.65, Z + 1.3); R.ellipse(q[0], q[1], 5, 5, '#f4e8c0'); R.line([q[0], q[1]], [q[0] + 3, q[1] - 2], INK); }); for (let i = 0; i < 3; i++) lit(() => dot(1.15 + i * .14, 1.65, Z + 1.55, ['#ffe04a', '#4ae08a', '#4a9aff'][i])); for (const x of [.6, 2.45]) { box(x, 1.05, Z + 1.0, .35, .35, .7, '#8a9aa8'); ball(x + .17, 1.22, Z + .95, .16, BRASS, { ol: false }); } box(1.15, .95, Z + 1.8, 1.1, .6, .7, '#a8b4c0'); lit(() => { for (const x of [1.35, 1.85]) qy(x, x + .22, 1.55, Z + 2.1, Z + 2.3, '#ffe04a'); }); qy(1.45, 1.95, 1.55, Z + 1.88, Z + 1.96, INK); lw([1.7, 1.25, Z + 2.5], [1.7, 1.25, Z + 2.85], '#6a6a76'); lit(() => blob(1.7, 1.25, Z + 2.9, 2, 2, '#ff5a4a')); cyl(.8, 1.25, Z + 1.2, .05, .3, BRASS, { ol: false }); }
  else { const F = '#8a5a3a', FD = '#5e3c28', fur = (x, y, z, r, sq) => ball(x, y, z, r, F, { squash: sq, t: '#a8744a', d: FD });
    for (const [x, y] of [[1.0, .8], [2.0, .8]]) box(x, y, Z, .36, .36, 1, '#54361f', { ol: false }); fur(1.5, 1.2, Z + 1.6, .78, .82); fur(2.0, 1.2, Z + 2.02, .5, .8); for (const [x, y] of [[1.0, 1.45], [2.0, 1.45]]) { box(x, y, Z, .36, .36, 1.05, '#6a4630'); for (let k = 0; k < 4; k++) dot(x + .05 + k * .09, y + .36, Z + 1.0 - (k % 2) * .08, FD, 0, 1); }
    for (let i = 0; i < 26; i++) { const x = .9 + hash2(i, 1, 4) * 1.5, z = Z + 1.05 + hash2(i, 2, 4) * .35; dot(x, 1.85, z, FD); dot(x, 1.85, z, FD, 0, 1); dot(x, 1.85, z, FD, 0, 2); }
    fur(2.62, 1.2, Z + 1.72, .5, .95); ball(2.5, 1.2, Z + 2.2, .26, F, { squash: .7, ol: false, t: '#a8744a' }); blob(2.78, 1.62, Z + 1.86, 1, 1, INK); blob(2.45, 1.7, Z + 1.6, 3, 4, FD);
    strokes(1.3, [[3.0, Z + 1.55, 3.12, Z + 1.0, 2], [3.12, Z + 1.0, 3.08, Z + .5, 1.6], [3.08, Z + .5, 3.22, Z + .36, 1.2]], F, '#4a3020'); strokes(1.6, [[2.82, Z + 1.3, 3.1, Z + .78, 1.3], [3.1, Z + .78, 3.36, Z + .9, 1.1], [3.36, Z + .9, 3.4, Z + 1.3, .8]], '#f4ecd8', BONE_D); strokes(.95, [[2.9, Z + 1.3, 3.16, Z + .82, 1.1], [3.16, Z + .82, 3.38, Z + 1.0, .8]], '#e0d6c0', BONE_D); }
}
function backdrop(p) {
  const s = p.season || 0, w = p.w || 8, c = SEASON_C[s], H = 2.6; box(0, 0, 0, w, .3, H, c[0]);
  qy(.08, w - .08, .3, .1, H - .08, (u, v, ww, hh) => { const x = u / ww, y = v / hh, h = hash2(u, v, 3);
    if (s === 0) { for (const [cx, cy] of [[.18, .7], [.5, .82], [.8, .64]]) if ((x - cx) ** 2 * 9 + (y - cy) ** 2 * 40 < .05) return '#f8f8f4'; if (Math.abs(x - .34) + Math.abs(y - .5) * 2.4 < .07) return '#e8483b'; if (Math.abs(x - .34 - (.44 - y) * .3) < .004 && y < .44 && y > .2) return '#f4f0e0'; if (Math.abs(x - .66) + Math.abs(y - .4) * 2.4 < .05) return '#f2c230'; return y > .5 ? '#7fc4ec' : '#a8dcf4'; }
    if (s === 1) { if (h > .992) return '#c8f0f4'; if (Math.abs(Math.sin(x * 20 + y * 6)) < .08 && y < .3) return '#2f7f86'; if ((x - .75) ** 2 * 6 + (y - .55) ** 2 * 30 < .03) return '#0f3a5a'; return y > .75 ? '#3a8ab8' : y > .45 ? '#1f5f8a' : '#143e62'; }
    if (s === 2) { const k = Math.floor(x * 14); if (y > .82 || y < .1) return '#2f7f86'; if ((x * 14 - k - .5) ** 2 + ((y * 5) % 1 - .5) ** 2 * .6 < .05) return '#f2c230'; return k & 1 ? '#c8402f' : '#d8563f'; }
    if (y > .55 && Math.abs(Math.sin(x * 9 + y * 3)) * .2 + .6 < y && y < .92) return (u + v) & 1 ? '#8fd6c0' : '#6ab8e0'; if (y < .18 + .08 * Math.abs(Math.sin(x * 12))) return '#f4f8fb'; if (h > .99) return '#ffffff'; return y > .5 ? '#2a3a78' : '#5a7ab8'; });
  lit(() => signY(['WINGS: THE ART OF FLIGHT', 'DEEP BLUE: GIANTS OF THE BAY', 'TIN & CLOCKWORK', 'ICE AGE MAPLE BAY'][s], .4, w - .4, .3, 2.05, 2.35, c[0], c[1], { frame: false }));
}
function print(p) { const h = p.h || .9, w = picW(p.k || 'dawn', h); hang(p.k || 'dawn', 0, w, .1, 0, h, p.frame || '#3a3440'); }
function dino() { box(.1, .25, 0, .8, .4, .5, WOOD_D); box(.05, .2, .5, .9, .5, .06, WOOD); const Z = .56, Y = .45; strokes(Y, [[.1, Z + .3, .4, Z + .42, .6], [.4, Z + .42, .62, Z + .5, .9], [.62, Z + .5, .76, Z + .66, .8], [.74, Z + .66, .92, Z + .64, 1.2], [.45, Z + .42, .52, Z + .2, .7], [.52, Z + .2, .46, Z, .6], [.46, Z, .56, Z, .5]]); for (let i = 0; i < 3; i++) lw([.5 + i * .05, Y, Z + .44], [.52 + i * .05, Y, Z + .3], BONE); }
function lostbox(p) { const k = p.k || 0, c = ['#6a4a34', '#4a5a4a', '#5a4a5a'][k]; box(0, 0, 0, .8, .6, .42, c, { l: PAT.planks(dk(c, .1), 5) }); box(0, 0, .42, .8, .6, .08, dk(c, .15)); for (const x of [.12, .62]) qy(x, x + .06, .6, 0, .5, BRASS); glow(() => blob(.4, .62, .3, 2, 2, '#fff4a0')); lit(() => { dot(.4, .6, .3, '#fff4a0'); dot(.4, .6, .3, GOLD, 1, 0); }); }

export default [
  { id: 'bld.arts.museum2', kind: 'building', tags: ['arts', 'museum', 'landmark', 'culture', 'venue'], size: [14, 12, 8.6], vb: [-.3, -.3, 0, 14.3, 12.3, 10.6], door: { side: 'y', at: 7 }, light: { x: 7, y: 12.8, z: 0, r: 6 }, variants: [{ seed: 1 }], draw: museum },
  { id: 'furn.mus.special', kind: 'furniture', tags: ['museum', 'mus_ex'], size: [3.4, 2.4, 3.2], vb: [-.1, -.1, 0, 3.6, 2.6, 3.4], use: { x: 1.7, y: 2.9 }, variants: [0, 1, 2, 3].map(season => ({ season })), draw: special },
  { id: 'furn.mus.backdrop', kind: 'furniture', tags: ['museum', 'gallerywall'], size: p => [p.w || 8, .3, 2.6], variants: [0, 1, 2, 3].map(season => ({ season })), draw: backdrop },
  { id: 'furn.home.wall.mus_print', kind: 'furniture', tags: ['home', 'decor', 'wall', 'art'], wall: true, solid: false, mount: 1.2, size: p => [picW(p.k || 'dawn', p.h || .9), .1, p.h || .9], variants: ['dawn', 'maple7', 'tram', 'koi'].map(k => ({ k })), draw: print },
  { id: 'furn.home.mus_dino', kind: 'furniture', tags: ['home', 'decor'], size: [1, 1, 1.3], variants: [{}], draw: dino },
  { id: 'prop.mus.lostbox', kind: 'prop', tags: ['museum'], size: [.8, .6, .5], solid: false, variants: [{ k: 0 }, { k: 1 }, { k: 2 }], draw: lostbox },
];
