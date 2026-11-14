// Parallax scenery for the cutaway train ride (private helper of trainride.js).
// Everything outside the car is drawn here in true isometric planes so it lines up with the car:
//   sky -> far skyline strip (slow) -> mid skyline strip -> the city floor far below (iso ground plane) -> viaduct deck with the second track
//   -> catenary masts + wire -> station platform (floor, sign wall, waiting people) ... and near-side masts whipping past in front (drawFront).
// Strips are pixel art rendered once per theme/season with the raster (colour + night-light layers) and cached.
import * as R from '../engine/raster.js';
import { toSprite } from '../engine/sprites.js';
import { ambient } from '../core/clock.js';

export const THEME_OF = { downtown: 'downtown', oldtown: 'oldtown', arts: 'arts', harbor: 'harbor', hillcrest: 'hill', maplewood: 'suburb', railyard: 'yard', park: 'park', airport: 'airport' };
const { rect, mix, dk, lt, glow, lit, ellipse, fill, rng, textS, textW } = R;
const HZ = '#c4dcea', WIN = ['#ffe9a8', '#ffd98a', '#fff4d0', '#bfe6ff'];
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const strip = (w, h, draw) => toSprite(R.render([0, 0, w, h], draw, null, 0));
const leafC = v => R.foliage('leaf', v) || ['#dfe7ec', '#cfd9e0', '#e9eff3'][Math.floor(v * 3) % 3];

function tree(x, B, s, v, hz) {
  let c = leafC(v); if (hz) c = mix(c, HZ, hz); const bare = R.ENV.season === 3;
  rect(x, B - Math.round(s * .9), 2, Math.round(s * .9), hz ? mix('#6b4a36', HZ, hz) : '#6b4a36');
  if (bare && !hz) { for (let i = 0; i < 5; i++) rect(x - 4 + i * 2, B - s - 4 + Math.abs(i - 2) * 2, 1, 5, '#6b4a36'); ellipse(x + 1, B - s - 3, s * .55, s * .3, '#e9eff3', '#dfe7ec'); return; }
  ellipse(x + 1, B - s - 1, s * .62, s * .55, dk(c, .18)); ellipse(x, B - s - 3, s * .5, s * .42, c); ellipse(x - 2, B - s - 5, s * .26, s * .2, lt(c, .22));
}
function tower(x, w, h, c, B, r, hz) {
  if (hz) c = mix(c, HZ, hz);
  rect(x, B - h, w, h, c); rect(x, B - h, 2, h, lt(c, .28)); rect(x + w - 2, B - h, 2, h, dk(c, .22));
  if (!hz) { for (let y = B - h + 4; y < B - 2; y += 5) rect(x + 2, y, w - 4, 1, dk(c, .28)); for (let k = 5; k < w - 3; k += 5) rect(x + k, B - h + 2, 1, h - 2, dk(c, .1)); rect(x + 3, B - h - 3, w - 6, 3, dk(c, .4)); if (r() < .5) rect(x + (w >> 1), B - h - 11, 1, 8, '#56636b'); if (r() < .4) rect(x + 4, B - h - 6, 5, 3, '#8a8f9a'); }
  else if (r() < .35) rect(x + (w >> 1), B - h - 6, 1, 6, c);
  glow(() => { for (let y = B - h + 5; y < B - 3; y += hz ? 4 : 5) for (let k = 3; k < w - 3; k += hz ? 3 : 5) if (r() < (hz ? .22 : .34)) rect(x + k, y, 2, hz ? 1 : 3, WIN[Math.floor(r() * 4)]); });
}
function house(x, w, h, wall, roof, B, r, hz) {
  if (hz) { wall = mix(wall, HZ, hz); roof = mix(roof, HZ, hz); }
  rect(x, B - h, w, h, wall); rect(x + w - 2, B - h, 2, h, dk(wall, .18)); const rh = Math.round(w * .32);
  fill([[x - 2, B - h], [x + w / 2, B - h - rh], [x + w + 2, B - h]], roof); rect(x - 2, B - h, w + 4, 1, dk(roof, .3));
  if (r() < .6) rect(x + w - 6, B - h - rh + 1, 3, rh - 2, dk(wall, .3));
  if (hz) { glow(() => { if (r() < .6) rect(x + 2, B - h + 3, 2, 2, WIN[0]); }); return; }
  for (let y = B - h + 4; y < B - 7; y += 9) for (let k = 3; k < w - 5; k += 7) { rect(k + x, y, 4, 5, '#5b7f96'); rect(k + x, y, 4, 1, '#f4efe2'); if (r() < .55) glow(() => rect(k + x, y + 1, 4, 4, WIN[Math.floor(r() * 3)])); }
  rect(x + (w >> 1) - 2, B - 7, 4, 7, dk(roof, .2));
}
function crane(x, B, h, c) { rect(x, B - h, 2, h, c); rect(x + 6, B - h, 2, h, c); for (let y = B - h; y < B; y += 6) { rect(x, y, 8, 1, c); } rect(x - 14, B - h - 3, 44, 3, c); rect(x + 2, B - h - 12, 4, 10, dk(c, .2)); rect(x + 22, B - h, 1, 14, '#3a3644'); rect(x + 20, B - h + 14, 5, 3, '#3a3644'); lit(() => rect(x + 3, B - h - 13, 1, 1, '#ff6a5a')); }
function boxes(x, B, r, n) { const cs = ['#d2412f', '#2f8f96', '#e8c060', '#5a7ab0', '#8a5a3a', '#5aa84f']; for (let j = 0; j < n; j++) for (let i = 0; i < 3; i++) if (r() < .8 - j * .25) { const c = cs[Math.floor(r() * 6)]; rect(x + i * 13, B - 6 - j * 6, 12, 6, c); rect(x + i * 13, B - 6 - j * 6, 12, 1, lt(c, .25)); rect(x + i * 13 + 11, B - 6 - j * 6, 1, 6, dk(c, .3)); } }

const FAR = {
  downtown(W, B, r) { for (let x = 2; x < W - 24;) { const w = 10 + Math.floor(r() * 13); tower(x, w, 26 + r() * 54, ['#6f86a8', '#8296b4', '#5e7694', '#93a5bd', '#7a8fb0'][Math.floor(r() * 5)], B, r, .52); x += w + Math.floor(r() * 7) - 2; } },
  oldtown(W, B, r) { for (let x = 2; x < W - 22;) { const w = 14 + Math.floor(r() * 9); house(x, w, 12 + r() * 14, ['#b5654a', '#c9a27a', '#a85a48', '#d9c9a8'][Math.floor(r() * 4)], ['#7a4a3a', '#8a3d32', '#5c5360'][Math.floor(r() * 3)], B, r, .5); x += w + 2; } rect(150, B - 52, 5, 52, mix('#d9c9a8', HZ, .5)); fill([[149, B - 52], [152.5, B - 66], [156, B - 52]], mix('#5c5360', HZ, .5)); },
  harbor(W, B, r) { rect(0, B - 12, W, 12, '#8fc3d8'); for (let i = 0; i < 40; i++) rect(Math.floor(r() * W), B - 11 + Math.floor(r() * 10), 4, 1, '#b5dcea'); rect(0, B - 13, W, 1, '#6fa5bd'); for (const x of [40, 170, 290]) crane(x, B - 10, 34 + r() * 10, mix('#c96a3a', HZ, .45)); rect(210, B - 18, 60, 7, mix('#3a4a66', HZ, .4)); boxes(216, B - 18, r, 2); for (let x = 0; x < W; x += 3) rect(x, B - 16 - Math.round(4 * Math.sin(x / 31) + 3 * Math.sin(x / 13)), 3, 3, mix('#7fa08a', HZ, .7)); },
  hill(W, B, r) { const f = x => 34 + 20 * Math.sin(x * 2 * Math.PI / W) + 9 * Math.sin(x * 6 * Math.PI / W + 1); for (let x = 0; x < W; x++) { const h = Math.round(f(x)); rect(x, B - h, 1, h, mix((x + h) & 1 ? '#6fae5a' : '#79b964', HZ, .5)); } for (let i = 0; i < 22; i++) { const x = 6 + Math.floor(r() * (W - 20)), y = B - Math.round(f(x)) + 2 + Math.floor(r() * 16); rect(x, y, 6, 4, mix('#f4efe2', HZ, .3)); fill([[x - 1, y], [x + 3, y - 3], [x + 7, y]], mix('#b5654a', HZ, .35)); glow(() => rect(x + 2, y + 1, 2, 2, WIN[0])); if (r() < .7) tree(x + 9, y + 5, 6, r(), .45); } },
  suburb(W, B, r) { for (let x = 0; x < W; x += 2) { const h = 9 + Math.round(5 * Math.sin(x / 23) + 3 * Math.sin(x / 9)); rect(x, B - h, 2, h, mix(leafC((x % 40) / 40), HZ, .55)); } for (let x = 20; x < W - 20; x += 46 + Math.floor(r() * 30)) house(x, 14, 9, '#f4efe2', '#8a5a4a', B, r, .5); rect(300, B - 30, 3, 30, mix('#9aa3ad', HZ, .5)); ellipse(301, B - 33, 6, 5, mix('#9aa3ad', HZ, .5)); },
  airport(W, B, r) { for (let x = 0; x < W; x += 60) fill([[x - 30, B - 6], [x + 20 + r() * 20, B - 30 - r() * 14], [x + 80, B - 6]], mix('#8a8fb0', HZ, .72)); rect(0, B - 7, W, 7, mix('#9aa08a', HZ, .45)); rect(118, B - 44, 5, 40, mix('#d8dde2', HZ, .3)); rect(113, B - 50, 15, 7, mix('#5e7694', HZ, .3)); lit(() => rect(120, B - 53, 1, 2, '#ff6a5a')); for (const x of [200, 262]) { ellipse(x + 26, B - 7, 28, 13, mix('#c9ced6', HZ, .35)); rect(x + 12, B - 13, 28, 7, mix('#5c6068', HZ, .4)); } glow(() => { for (let x = 6; x < W; x += 14) rect(x, B - 3, 1, 1, '#9fd0ff'); }); },
  park(W, B, r) { for (let x = 4; x < W - 6; x += 9 + Math.floor(r() * 7)) tree(x, B, 12 + r() * 10, r(), .5); },
  yard(W, B, r) { for (const x of [50, 66, 250]) { const c = mix('#b5654a', HZ, .45); rect(x, B - 48, 4, 48, c); rect(x, B - 44, 4, 3, mix('#f4efe2', HZ, .4)); lit(() => rect(x + 1, B - 50, 1, 1, '#ff6a5a')); } for (let x = 110; x < 170; x += 15) { rect(x, B - 26, 13, 26, mix('#c9ced6', HZ, .4)); ellipse(x + 6, B - 26, 6.5, 3, mix('#aab2bb', HZ, .4)); } ellipse(320, B - 14, 22, 14, mix('#8a9aa6', HZ, .45)); rect(298, B - 14, 44, 14, mix('#8a9aa6', HZ, .45)); for (let x = 180; x < 240; x += 20) { rect(x, B - 12, 20, 12, mix('#7a6a5a', HZ, .5)); fill([[x, B - 12], [x + 20, B - 12], [x, B - 20]], mix('#5c5360', HZ, .5)); } },
};
FAR.arts = FAR.oldtown;
const MID = {
  downtown(W, B, r) { for (let x = 4; x < W - 44;) { const w = 22 + Math.floor(r() * 22); tower(x, w, 52 + r() * 62, ['#5a86b0', '#3f6f8f', '#6aa2bd', '#4a5f8a', '#7a9ab8', '#2f8f96'][Math.floor(r() * 6)], B, r); x += w + 3 + Math.floor(r() * 12); if (r() < .3) { tree(x, B, 11, r()); x += 10; } } },
  oldtown(W, B, r) { for (let x = 4; x < W - 36;) { const w = 22 + Math.floor(r() * 12); house(x, w, 28 + r() * 22, ['#b5654a', '#c96a4a', '#d9b98a', '#a85a48', '#c9a27a', '#8a6a8a'][Math.floor(r() * 6)], ['#7a4a3a', '#8a3d32', '#5c5360', '#4a5a6a'][Math.floor(r() * 4)], B, r); x += w + 1 + (r() < .25 ? 12 : 0); if (r() < .2) tree(x - 7, B, 10, r()); } },
  arts(W, B, r) { for (let x = 4; x < W - 40;) { const w = 24 + Math.floor(r() * 14), h = 30 + r() * 24, c = ['#e08a2c', '#7a5aa8', '#2f8f96', '#d2412f', '#e8c060', '#5aa84f'][Math.floor(r() * 6)]; house(x, w, h, c, '#4a4458', B, r); if (r() < .5) { const m = ['#f2a7c3', '#f4efe2', '#f2c230'][Math.floor(r() * 3)]; for (let i = 0; i < 5; i++) rect(x + 2 + i * 3, B - 9 - ((i * 7) % 5), 3, 3, m); } x += w + 2; if (r() < .3) { tree(x + 3, B, 12, r()); x += 12; } } },
  harbor(W, B, r) { rect(0, B - 14, W, 14, '#5fa3c4'); for (let i = 0; i < 70; i++) rect(Math.floor(r() * W), B - 13 + Math.floor(r() * 12), 5, 1, r() < .5 ? '#8fc3d8' : '#4a8fb0'); rect(0, B - 17, W, 3, '#8a6a4a'); for (let x = 3; x < W; x += 17) rect(x, B - 14, 2, 8, '#6b4a36'); for (const x of [30, 300]) crane(x, B - 17, 62, '#d9662f'); for (const x of [90, 380]) { const c = x < 200 ? '#8a9aa6' : '#b5654a'; rect(x, B - 47, 70, 30, c); for (let k = 0; k < 70; k += 4) rect(x + k, B - 47, 1, 30, dk(c, .15)); fill([[x - 2, B - 47], [x + 35, B - 57], [x + 72, B - 47]], dk(c, .3)); rect(x + 26, B - 31, 18, 14, '#3a3644'); glow(() => rect(x + 6, B - 40, 8, 4, WIN[1])); } boxes(190, B - 17, r, 3); boxes(236, B - 17, r, 2); rect(460, B - 24, 36, 8, '#f4efe2'); rect(470, B - 30, 12, 6, '#d2412f'); rect(476, B - 50, 1, 20, '#3a3644'); glow(() => rect(473, B - 28, 3, 2, WIN[0])); },
  hill(W, B, r) { const f = x => 30 + 24 * Math.sin(x * 2 * Math.PI / W - 1) + 8 * Math.sin(x * 8 * Math.PI / W); for (let x = 0; x < W; x++) { const h = Math.round(f(x)), g = R.grassC(); rect(x, B - h, 1, h, (x + h) & 1 ? g[0] : g[1]); if (h % 14 < 2) rect(x, B - h + (h % 14), 1, 3, '#a39e93'); } for (let x = 10; x < W - 40; x += 34 + Math.floor(r() * 26)) { const y = B - Math.round(f(x + 10)) + 3; rect(x - 3, y, 30, 3, '#b9b4a8'); house(x, 20 + Math.floor(r() * 6), 16 + r() * 8, ['#f4efe2', '#e8dcc0', '#d9c9d8', '#cfe0d8'][Math.floor(r() * 4)], ['#b5654a', '#5c5360', '#4a7a6a'][Math.floor(r() * 3)], y, r); tree(x + 30, y + 4, 12, r()); } },
  suburb(W, B, r) { rect(0, B - 3, W, 3, R.grassC()[0]); for (let x = 6; x < W - 40;) { tree(x, B, 13 + r() * 6, r()); x += 12; const w = 24 + Math.floor(r() * 8); house(x, w, 17 + r() * 6, ['#f4efe2', '#d8e2ea', '#e8d4b0', '#c9d9c0', '#e8c0b0'][Math.floor(r() * 5)], ['#8a5a4a', '#5c6068', '#7a4a3a', '#4a6a7a'][Math.floor(r() * 4)], B, r); x += w + 4; for (let k = 0; k < 12; k += 3) rect(x + k, B - 5, 1, 5, '#f4efe2'); rect(x, B - 4, 12, 1, '#f4efe2'); x += 14 + Math.floor(r() * 10); } },
  airport(W, B, r) { rect(0, B - 4, W, 4, '#8a8f9a'); rect(10, B - 30, 190, 26, '#d8dde2'); for (let k = 0; k < 190; k += 10) { rect(12 + k, B - 26, 8, 18, '#6aa2bd'); glow(() => rect(12 + k, B - 26, 8, 18, '#bfe6ff')); } rect(8, B - 33, 194, 4, '#f4efe2'); lit(() => textS('MAPLE BAY INTL', 70, B - 42, '#27408a')); rect(66, B - 44, 62, 9, '#f4efe2'); lit(() => textS('MAPLE BAY INTL', 70, B - 42, '#27408a'));
    for (const x of [230, 330, 430]) { const c = ['#d2412f', '#27408a', '#2f8f96'][(x / 100) & 3 % 3] || '#d2412f'; rect(x, B - 16, 62, 9, '#f4efe2'); ellipse(x + 62, B - 12, 8, 4.5, '#f4efe2'); rect(x + 8, B - 13, 44, 1, '#5b7f96'); fill([[x, B - 16], [x + 4, B - 36], [x + 14, B - 36], [x + 20, B - 16]], c); rect(x + 24, B - 9, 20, 3, '#c9ced6'); rect(x + 30, B - 7, 2, 7, '#56636b'); lit(() => rect(x + 9, B - 38, 1, 1, '#ff6a5a')); }
    rect(215, B - 62, 6, 58, '#d8dde2'); rect(208, B - 72, 20, 10, '#3f6f8f'); glow(() => rect(209, B - 70, 18, 5, '#bfe6ff')); rect(206, B - 74, 24, 2, '#f4efe2'); },
  park(W, B, r) { rect(0, B - 3, W, 3, R.grassC()[0]); for (let x = 6; x < W - 10; x += 13 + Math.floor(r() * 12)) tree(x, B - Math.floor(r() * 3), 16 + r() * 16, r()); for (let x = 40; x < W; x += 120) { rect(x, B - 20, 1, 20, '#3a3644'); lit(() => rect(x - 1, B - 22, 3, 2, '#fff1c0')); } rect(250, B - 16, 30, 2, '#8a5a3a'); fill([[244, B - 16], [265, B - 28], [286, B - 16]], '#4a7a6a'); rect(252, B - 14, 2, 14, '#f4efe2'); rect(276, B - 14, 2, 14, '#f4efe2'); },
  yard(W, B, r) { rect(0, B - 3, W, 3, '#8a8478'); for (const x of [10, 250]) { const c = x < 100 ? '#8a9aa6' : '#a8846a'; rect(x, B - 34, 120, 34, c); for (let k = 0; k < 120; k += 30) { fill([[x + k, B - 34], [x + k + 30, B - 34], [x + k, B - 48]], dk(c, .25)); rect(x + k, B - 46, 2, 12, '#bfe0ea'); glow(() => rect(x + k + 6, B - 26, 14, 6, WIN[1])); } rect(x + 44, B - 18, 26, 18, '#3a3644'); } for (let x = 140; x < 200; x += 20) { rect(x, B - 54, 18, 54, '#c9ced6'); rect(x + 14, B - 54, 4, 54, '#aab2bb'); ellipse(x + 9, B - 54, 9, 4, '#d8dde2'); rect(x, B - 30, 18, 1, '#8a8f9a'); } rect(218, B - 80, 7, 80, '#b5654a'); rect(218, B - 74, 7, 4, '#f4efe2'); rect(218, B - 64, 7, 4, '#f4efe2'); lit(() => rect(221, B - 82, 1, 1, '#ff6a5a')); boxes(390, B - 3, r, 3); boxes(440, B - 3, r, 2); },
};
const GND = {
  downtown: { base: ['#6b6f7c', '#747886'], roofs: ['#9aa3ad', '#8296b4', '#b9b4a8', '#5e7694'], road: '#4a4d5a' }, oldtown: { base: ['#a39e93', '#aba69b'], roofs: ['#8a3d32', '#7a4a3a', '#b5654a', '#5c5360'], road: '#8a8478' },
  arts: { base: ['#a39e93', '#aba69b'], roofs: ['#7a5aa8', '#e08a2c', '#4a4458', '#2f8f96'], road: '#8a8478' }, harbor: { base: ['#5fa3c4', '#69abc9'], roofs: ['#8a6a4a'], water: 1 },
  hill: { grass: 1, roofs: ['#b5654a', '#5c5360', '#4a7a6a'], trees: 1 }, suburb: { grass: 1, roofs: ['#8a5a4a', '#5c6068', '#7a4a3a'], trees: 1, road: '#6b6f7c' },
  airport: { base: ['#8a8f9a', '#9297a2'], roofs: [], lines: '#f2c230' }, park: { grass: 1, roofs: [], trees: 2, path: '#d9cfa8' }, yard: { base: ['#8a8478', '#928c80'], roofs: ['#8a9aa6', '#a8846a', '#d2412f', '#2f8f96'], rails: 1 },
};
function ground(th) {
  const g = GND[th] || GND.suburb, r = rng(th.length * 31 + 7), b = g.grass ? R.grassC() : g.base;
  return strip(128, 128, () => {
    rect(0, 0, 128, 128, b[0]); for (let i = 0; i < 500; i++) rect(Math.floor(r() * 128), Math.floor(r() * 128), 2, 1, b[1]);
    if (g.water) for (let i = 0; i < 60; i++) rect(Math.floor(r() * 124), Math.floor(r() * 128), 5, 1, r() < .5 ? '#8fc3d8' : '#4a8fb0');
    if (g.road) { rect(0, 54, 128, 18, g.road); rect(54, 0, 18, 128, g.road); for (let k = 2; k < 128; k += 12) { rect(k, 62, 6, 1, '#e9e4d6'); rect(62, k, 1, 6, '#e9e4d6'); } glow(() => { for (let k = 10; k < 128; k += 32) { rect(k, 53, 2, 2, '#ffd98a'); rect(53, k, 2, 2, '#ffd98a'); } }); }
    if (g.path) { for (let k = 0; k < 128; k++) rect(k, 60 + Math.round(8 * Math.sin(k * Math.PI / 64)), 1, 7, g.path); }
    if (g.lines) { rect(0, 30, 128, 2, g.lines); for (let k = 0; k < 128; k += 16) rect(k, 90, 9, 2, '#f4efe2'); glow(() => { for (let k = 4; k < 128; k += 16) rect(k, 28, 1, 1, '#9fd0ff'); }); }
    if (g.rails) for (const y of [20, 26, 96, 102]) { rect(0, y, 128, 1, '#56636b'); }
    const Q = [[4, 4], [76, 4], [4, 76], [76, 76]];
    for (const [qx, qy] of Q) {
      if (g.roofs.length && r() < .85) { const w = 24 + Math.floor(r() * 20), h = 22 + Math.floor(r() * 22), x = qx + Math.floor(r() * (46 - w)), y = qy + Math.floor(r() * (46 - h)), c = g.roofs[Math.floor(r() * g.roofs.length)]; rect(x + 3, y + 3, w, h, dk(b[0], .3)); rect(x, y, w, h, c); rect(x, y, w, 2, lt(c, .2)); rect(x + w - 2, y, 2, h, dk(c, .2)); if (!g.grass && !g.water) rect(x + 5, y + 6, 5, 4, '#c9ced6'); }
      if (g.trees) for (let i = 0; i < g.trees * 3; i++) { const x = qx + Math.floor(r() * 44), y = qy + Math.floor(r() * 44), c = leafC(r()); ellipse(x + 2, y + 2, 6, 6, dk(b[0], .25)); ellipse(x, y, 6, 6, c); ellipse(x - 1, y - 2, 3, 2, lt(c, .2)); }
    }
  });
}
const DECK = () => strip(48, 192, () => {
  const r = rng(11); rect(0, 0, 48, 192, '#8d8a80'); for (let i = 0; i < 700; i++) rect(Math.floor(r() * 48), Math.floor(r() * 192), 1, 1, r() < .5 ? '#7a776e' : '#a09d92');
  rect(0, 0, 48, 5, '#b9b4a8'); rect(0, 5, 48, 1, '#8a857a'); rect(0, 186, 48, 6, '#b9b4a8'); rect(0, 185, 48, 1, '#8a857a');
  // one track, centred under the (deliberately wide) cutaway car: car spans v 40..120 px on this plane, rails at v 62 and 114 -> strip rows 70 and 122
  { const y0 = 62; for (let x = 2; x < 48; x += 12) { rect(x, y0, 4, 70, '#6b5a4a'); rect(x, y0, 1, 70, '#7a6a5a'); } for (const y of [70, 122]) { rect(0, y, 48, 2, '#c9ced6'); rect(0, y + 2, 48, 1, '#56636b'); } }
});

export function createBackdrop() {
  const cache = new Map(); let BK = null, deck = null, season = -1;
  const get = (kind, th) => {
    if (season !== R.ENV.season) { cache.clear(); season = R.ENV.season; }
    const k = kind + th; let s = cache.get(k); if (s) return s;
    if (kind === 'g') s = ground(th); else { const far = kind === 'f', W = far ? 384 : 512, H = far ? 86 : 128, fn = (far ? FAR : MID)[th] || (far ? FAR : MID).suburb; s = strip(W, H, () => fn(W, H, rng(th.length * 17 + (far ? 3 : 5)))); s.W = W; s.H = H; }
    cache.set(k, s); return s;
  };
  const signs = new Map();
  const signStrip = name => { let s = signs.get(name); if (s) return s; const W = 416, H = 56;
    s = strip(W, H, () => { rect(0, H - 14, W, 14, '#b9b4a8'); rect(0, H - 15, W, 1, '#8a857a'); for (let x = 0; x < W; x += 52) { rect(x, 6, 3, H - 6, '#3f5a5a'); rect(x + 3, 14, 49, 26, '#bfe0ea'); for (let i = 0; i < 49; i += 2) rect(x + 3 + i, 14 + ((i * 7) % 26), 1, 1, '#e8f6fb'); rect(x + 3, 13, 49, 1, '#3f5a5a'); rect(x + 3, 40, 49, 2, '#3f5a5a'); }
      rect(0, 4, W, 3, '#34504f'); const t = name.toUpperCase(), tw = textW(t) + 10; for (const cx of [104, 312]) { rect(cx - (tw >> 1), 17, tw, 11, '#27408a'); rect(cx - (tw >> 1), 28, tw, 2, '#d2412f'); lit(() => { rect(cx - (tw >> 1) + 1, 18, tw - 2, 9, '#27408a'); textS(t, cx - (tw >> 1) + 5, 20, '#ffffff'); }); }
      for (const x of [26, 208, 390]) { rect(x, 0, 2, H - 14, '#56636b'); lit(() => rect(x - 2, 0, 6, 3, '#fff1c0')); glow(() => ellipse(x + 1, 3, 5, 3, '#ffe6b0')); }
      for (const x of [150, 250]) { rect(x, H - 22, 22, 3, '#8a5a3a'); rect(x, H - 27, 22, 2, '#8a5a3a'); rect(x + 2, H - 19, 2, 5, '#3a3644'); rect(x + 18, H - 19, 2, 5, '#3a3644'); } });
    signs.set(name, s); return s; };
  const tile = (b, spr, cam, W, c, off, alpha, light) => { // sheared skyline strip, base line Y = .5 X + c (world px)
    const w = spr.W, src = light ? spr.l : spr.c; if (!src) return; b.globalAlpha = alpha; const n0 = Math.floor((cam.x - off) / w);
    for (let n = n0; n * w + off < cam.x + W; n++) { const ox = Math.round(n * w + off - cam.x); b.setTransform(1, .5, 0, 1, ox, .5 * (ox + cam.x) + c - cam.y - spr.H); b.drawImage(src, 0, 0); }
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1;
  };
  const plane = (b, spr, cam, W, H, zg, off, alpha, light, v0, vh) => { // iso ground plane textured with a repeating tile
    const src = light ? spr.l : spr.c; if (!src) return; const pat = b.createPattern(src, 'repeat'); b.globalAlpha = alpha;
    b.setTransform(1, .5, -1, .5, -cam.x, -cam.y - 16 * zg); let u0 = 1e9, u1 = -1e9, a0 = 1e9, a1 = -1e9;
    for (const [X, Y] of [[cam.x, cam.y], [cam.x + W, cam.y], [cam.x, cam.y + H], [cam.x + W, cam.y + H]]) { const yy = Y + 16 * zg, u = X / 2 + yy, v = yy - X / 2; u0 = Math.min(u0, u); u1 = Math.max(u1, u); a0 = Math.min(a0, v); a1 = Math.max(a1, v); }
    if (v0 !== undefined) { a0 = v0; a1 = v0 + vh; } const sh = ((off % spr.w) + spr.w) % spr.w; b.translate(sh, v0 || 0); b.fillStyle = pat; b.fillRect(u0 - sh - 2, a0 - (v0 || 0), u1 - u0 + 4, a1 - a0);
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1;
  };
  const wallT = (b, cam, y0) => b.setTransform(1, .5, 0, 1, 0, .5 * cam.x + 16 * y0 - cam.y);
  const masts = (b, cam, W, d, y0, phase, col, sgn) => { // catenary masts on the plane y = y0; arms reach toward the track (sgn = +1: toward +y)
    b.fillStyle = col;
    for (let n = -3; n < 5; n++) { const x = (((d + phase) % 12.4) + 12.4) % 12.4 + n * 12.4, X = Math.round(16 * (x - y0) - cam.x); if (X < -80 || X > W + 80) continue;
      wallT(b, cam, y0); b.fillRect(X, -16 * 5, 2, 16 * 6); b.fillRect(X - 1, -16 * 5 - 2, 4, 2); b.setTransform(1, 0, 0, 1, 0, 0);
      const Y = Math.round(.5 * (X + cam.x) + 16 * y0 - cam.y - 16 * 4.8); for (let i = 0; i < 33; i++) b.fillRect(X - sgn * (2 * i + 1) - (sgn > 0 ? 1 : -1), Y + sgn * i, 2, 1); }
    b.setTransform(1, 0, 0, 1, 0, 0);
  };
  return {
    /** o: { d: units travelled, A, B: theme keys, k: crossfade 0..1, t: game minutes, weather, platform: {x0, name, people:[{ch,x,y}]} | null } */
    draw(ctx, cam, W, H, o) {
      if (!BK || BK.width !== W || BK.height !== H) BK = mk(W, H); if (!deck) deck = DECK();
      const b = BK.getContext('2d'), env = ambient(o.t, o.weather), px = o.d * 16; b.imageSmoothingEnabled = false; b.globalCompositeOperation = 'source-over'; b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1;
      b.fillStyle = '#9fd6e8'; b.fillRect(0, 0, W, H); b.fillStyle = '#bfe4f0'; b.fillRect(0, Math.floor(H * .5), W, H); for (let y = Math.floor(H * .4); y < H * .5; y += 2) b.fillRect(0, y, W, 1);
      if (env.dark > .5) { b.fillStyle = '#ffffff'; for (let i = 0; i < 46; i++) b.fillRect(Math.floor(R.hash2(i, 3, 1) * W), Math.floor(R.hash2(i, 9, 2) * H * .8), 1, 1); }
      const L = X => .5 * (X + cam.x) + 18 - cam.y, both = fn => { fn(o.A, 1); if (o.B && o.B !== o.A && o.k > .01) fn(o.B, o.k); };
      b.save(); b.beginPath(); b.moveTo(-2, L(-2)); b.lineTo(W + 2, L(W + 2)); b.lineTo(W + 2, H + 2); b.lineTo(-2, H + 2); b.closePath(); b.clip();
      both((th, a) => plane(b, get('g', th), cam, W, H, -7, px, a, false)); b.restore();
      both((th, a) => tile(b, get('f', th), cam, W, -40, px * .07, a, false)); both((th, a) => tile(b, get('m', th), cam, W, 18, px * .32, a, false));
      plane(b, deck, cam, W, H, -1, px, 1, false, -8, 192);
      wallT(b, cam, 11.5); b.fillStyle = '#56505c'; b.fillRect(-4, 16, W + 8, 14); b.fillStyle = '#b9b4a8'; b.fillRect(-4, 5, W + 8, 11); b.fillStyle = '#d8d2c2'; b.fillRect(-4, 4, W + 8, 2); b.fillStyle = '#8a857a';
      for (let X = -(((cam.x - px) % 32) + 32) % 32; X < W; X += 32) b.fillRect(Math.round(X), 6, 1, 10); b.setTransform(1, 0, 0, 1, 0, 0);
      masts(b, cam, W, o.d, 1.4, 0, '#56636b', 1); wallT(b, cam, 5.25); b.fillStyle = '#3a3644'; b.fillRect(-4, -Math.round(16 * 4.8), W + 8, 1); b.setTransform(1, 0, 0, 1, 0, 0);
      if (env.amb && env.amb !== '#ffffff') { b.globalCompositeOperation = 'multiply'; b.fillStyle = env.amb; b.fillRect(0, 0, W, H); b.globalCompositeOperation = 'source-over'; }
      const P = o.platform;
      if (P) {
        b.setTransform(1, .5, -1, .5, -cam.x, -cam.y); b.fillStyle = '#cfc8b8'; b.fillRect(16 * P.x0, -8, 416, 56); b.fillStyle = '#b9b2a2'; for (let k = 0; k <= 416; k += 32) b.fillRect(16 * P.x0 + k, -8, 1, 56); b.fillRect(16 * P.x0, 16, 416, 1);
        b.fillStyle = '#f2c230'; b.fillRect(16 * P.x0, 36, 416, 5); b.fillStyle = '#f4efe2'; b.fillRect(16 * P.x0, 44, 416, 2); b.setTransform(1, 0, 0, 1, 0, 0);
        const s = signStrip(P.name), ox = Math.round(16 * (P.x0 + .5) - cam.x); b.setTransform(1, .5, 0, 1, ox, .5 * (ox + cam.x) - 8 - cam.y - 56); b.drawImage(s.c, 0, 0); if (s.l && env.dark > .05) { b.globalCompositeOperation = 'lighten'; b.globalAlpha = Math.min(1, env.dark); b.drawImage(s.l, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over'; } b.setTransform(1, 0, 0, 1, 0, 0);
      }
      if (env.dark > .05) { b.globalCompositeOperation = 'lighten'; const a = Math.min(1, env.dark); both((th, k) => { tile(b, get('f', th), cam, W, -40, px * .07, a * k, true); tile(b, get('m', th), cam, W, 18, px * .32, a * k, true); }); b.globalCompositeOperation = 'source-over'; }
      ctx.drawImage(BK, 0, 0);
      if (P) for (const q of P.people) { const sp = q.ch.sprite(); if (!sp) continue; const s = R.WS(P.x0 + q.x, q.y, 0); ctx.drawImage(sp.c, Math.round(s[0]) + sp.x - cam.x, Math.round(s[1]) + sp.y - cam.y); }
      this.dark = env.dark;
    },
    drawFront(ctx, cam, W, H, o) { masts(ctx, cam, W, o.d, 11.3, 6.2, mix('#56636b', '#1a1d33', (this.dark || 0) * .7), -1); },
  };
}
