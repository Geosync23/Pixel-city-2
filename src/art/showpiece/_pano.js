// The Maple Bay panorama seen from the SkyDeck: one pure painter used by the wall art (furn.skydeck.pano), the telescope
// view and the elevator ride. Base space: PANO_W x PANO_H "wall pixels", u from the left, v UP from the bottom, horizon at HZ.
//   pano(put, { u0, w, v0 = 0, h = PANO_H, s = 1, time: 'day'|'dusk'|'night', season 0-3, frame (cloud drift 0..31), plane (u | -1), lit: fn => fn() })
//   put(x, y, hex): x, y in SCALED pixels of the requested window (y up). s > 1 paints the same scene with finer detail.
import { mix, hash2 } from '../../engine/raster.js';
export const PANO_W = 608, PANO_H = 64, HZ = 26, FRAMES = 32;
/** where each district sits in the panorama (base u of its centre) */
export const SPOTS = { hillcrest: 66, park: 146, oldtown: 208, harbor: 452, airport: 566, bay: 300 };
const rc = v => 150 + Math.pow(Math.max(0, v) / 14, .7) * 100 + Math.sin(v * .6) * 5; // river centre at height v

export function pano(put, o) {
  const s = o.s || 1, u0 = o.u0 || 0, v0 = o.v0 || 0, W = Math.round(o.w * s), H = Math.round((o.h || PANO_H) * s), T = o.time || 'day', se = o.season === undefined ? 1 : o.season;
  const N = T === 'night', D = T === 'dusk', L = o.lit || (f => f()), fr = o.frame || 0, X0 = Math.round(u0 * s), Y0 = Math.round(v0 * s), st = 1 / s;
  const tn = c => N ? mix(c, '#10163a', .72) : D ? mix(c, '#d8684a', .28) : c;
  const r = (u, v, w, h, c, c2) => { let a = Math.round((u - u0) * s), b = Math.round((u + w - u0) * s), y0 = Math.round((v - v0) * s), y1 = Math.round((v + h - v0) * s); if (b <= a) b = a + 1; if (y1 <= y0) y1 = y0 + 1; if (b <= 0 || a >= W || y1 <= 0 || y0 >= H) return; if (a < 0) a = 0; if (b > W) b = W; if (y0 < 0) y0 = 0; if (y1 > H) y1 = H;
    for (let y = y0; y < y1; y++) for (let x = a; x < b; x++) { const odd = (x + y) & 1; if (odd && c2 === 0) continue; put(x, y, odd && c2 ? c2 : c); } };
  const t = (u, v, w, h, c, c2) => r(u, v, w, h, tn(c), c2 ? tn(c2) : c2);
  const col = (uA, uB, vb, fn, c, c2) => { c = tn(c); c2 = c2 && tn(c2); const a = Math.max(0, Math.round((uA - u0) * s)), b = Math.min(W, Math.round((uB - u0) * s)); for (let x = a; x < b; x++) { const y0 = Math.max(0, Math.round((vb - v0) * s)), y1 = Math.min(H, Math.round((vb + fn(u0 + x / s) - v0) * s)); for (let y = y0; y < y1; y++) put(x, y, c2 && ((x + y) & 1) ? c2 : c); } };
  const lights = (uA, uB, vA, vB, dens, c, seed) => { if (!N && !D) return; if (D) dens *= .4; const a = Math.max(0, Math.round((uA - u0) * s)), b = Math.min(W, Math.round((uB - u0) * s)), y0 = Math.max(0, Math.round((vA - v0) * s)), y1 = Math.min(H, Math.round((vB - v0) * s)); if (b <= a || y1 <= y0) return; L(() => { for (let y = y0; y < y1; y++) for (let x = a; x < b; x++) if (hash2(x + X0, y + Y0, seed) < dens) put(x, y, c); }); };
  const lamp = (u, v, c, w = 1, h = 1) => { if (N || D) L(() => r(u, v, w, h, c)); };
  const disc = (u, v, rad, c) => { for (let dy = -rad; dy <= rad; dy += st) { const hw = Math.sqrt(Math.max(0, rad * rad - dy * dy)); if (hw > 0) r(u - hw, v + dy, hw * 2, st, c); } };
  const GR = ['#84c466', '#5fa852', '#b0a04c', '#e2eaf0'][se], GR2 = ['#78ba5e', '#559c4a', '#a49446', '#d2dde6'][se], LEAF = ['#f2a7c3', '#3f8a55', '#d9662b', '#c4d0da'][se], LEAF2 = ['#7cc75e', '#4f9a45', '#e8a63a', '#eef3f7'][se], SEA = '#3f8fc0', SEA2 = '#63add6';
  const snow = c => se === 3 ? mix(c, '#f4f8fb', .7) : c;
  const tree = (u, v) => { t(u, v, .8, 1.4, '#6a4a34'); t(u - 1.2, v + 1.2, 3.2, 2.2, hash2(u | 0, v | 0, 3) < .5 ? LEAF : LEAF2); t(u - .5, v + 3.2, 1.8, 1, LEAF2); };
  const house = (u, v, wall, roof, w = 4) => { t(u, v, w, 2.4, wall); t(u + w - 1, v, 1, 2.4, mix(wall, '#3a3050', .25)); t(u - .5, v + 2.4, w + 1, 1.1, snow(roof)); t(u + .5, v + 3.5, w - 1, .8, snow(roof)); if (N || D) { if (hash2(u | 0, v | 0, 9) < (N ? .75 : .4)) L(() => r(u + 1, v + .8, 1, 1, '#ffd98a')); } else t(u + 1, v + .8, 1, 1, '#5a7890'); };

  /* ---- sky ---- */
  const sky = N ? ['#0a0f2e', '#0f1740', '#172150', '#212f5f'] : D ? ['#3b3a7a', '#7a4c8e', '#c95c7c', '#f0885a', '#f9c26e'] : ['#4f9fdc', '#6cb3e6', '#93caee', '#bfe0f4'], bh = (PANO_H - HZ) / sky.length;
  sky.forEach((c, i) => { const v = PANO_H - (i + 1) * bh; r(u0, v, o.w, bh + st, c); if (i) r(u0, v + bh - 1.5, o.w, 2.5, c, sky[i - 1]); });
  if (N) { L(() => { const y0 = Math.max(0, Math.round((HZ + 3 - v0) * s)); for (let y = y0; y < H; y++) for (let x = 0; x < W; x++) if (hash2(x + X0, y + Y0, 7) < .007 / s) put(x, y, hash2(x, y, 2) < .3 ? '#ffe9b0' : '#dfe6ff'); disc(318, 54, 3, '#f4f0d8'); }); r(319.4, 55, 2, 1.6, '#c9c6b4'); }
  if (D) L(() => { disc(372, HZ + 1, 6, '#ffb060'); disc(372, HZ + 1, 4.4, '#ffe9a0'); });
  const cc = N ? ['#27325f', '#1c2650'] : D ? ['#f8b890', '#c97c8e'] : ['#ffffff', '#d8e8f4'];
  for (let cu = -96 + ((fr * 3) % 96); cu < PANO_W + 30; cu += 96) { r(cu, 50, 17, 2, cc[1]); r(cu + 2, 51.4, 12, 2.2, cc[0]); r(cu + 5, 53.6, 6, 1.4, cc[0]); r(cu + 48, 40, 22, 1.6, cc[1]); r(cu + 51, 41.2, 15, 2, cc[0]); r(cu + 56, 43.2, 7, 1.2, cc[0]); r(cu + 76, 46, 9, 1.2, cc[1]); }
  if (o.plane >= 0) { const pu = o.plane, pv = 55; r(pu, pv, 8, 1.3, N ? '#5a6488' : '#f4f6f8'); r(pu, pv + 1.3, 1.6, 1.8, '#d9483b'); r(pu + 3, pv - .7, 3, .7, N ? '#465078' : '#c2ccd6'); if (N) L(() => { r(pu + 7.6, pv + .3, .8, .8, '#ff5a4a'); r(pu + 3.5, pv - .7, .8, .6, '#7df0a0'); }); else r(pu - 9, pv + .5, 8, .5, '#ffffff', 0); }

  /* ---- far: mountains, far shore ---- */
  const PK = [[18, 19, .45], [58, 27, .5], [104, 18, .42], [148, 23, .5], [196, 13, .4], [556, 13, .35], [600, 21, .4]], mh = u => { let m = 0; for (const p of PK) m = Math.max(m, p[1] - Math.abs(u - p[0]) * p[2]); return m + hash2(Math.round(u * 2), 1, 5) * .8; };
  col(0, 240, HZ, mh, '#8ea3c6'); col(520, PANO_W, HZ, mh, '#8ea3c6'); col(0, 240, HZ + 16, u => mh(u) - 16, se === 1 ? '#c8d4e8' : '#f4f8fb'); col(520, PANO_W, HZ + 16, u => mh(u) - 16, '#f4f8fb');
  col(0, 240, HZ, u => mh(u) * .32, '#7f93b6'); col(410, 548, HZ, u => 3.4 - Math.abs(u - 480) * .05, '#7c98b4');
  /* ---- ground + water ---- */
  t(u0, 0, o.w, HZ, GR); t(526, 0, 90, HZ, se === 3 ? '#dfe6ea' : '#a9b094');
  for (let v = 13; v < HZ; v += st) { const le = 236 + (HZ - v) * 1.2; t(le, v, 528 - le + (HZ - v) * .6, st, v > HZ - 1.2 ? SEA2 : SEA); }
  for (let v = 14; v < HZ - 1; v += 2) for (let u = 256 + (v % 4) * 3; u < 520; u += 9) if (hash2(u, v, 4) < .5) t(u, v, 3, .5, SEA2);
  if (D) for (let v = 14; v < HZ; v += 1) L(() => r(372 - (HZ - v) * .5, v, (HZ - v) + 1, .6, '#ffd08a', 0));
  if (N) for (let v = 16; v < HZ; v += 2) r(316 - (HZ - v) * .2, v, 4, .6, '#8a94c0', 0);
  lights(412, 546, HZ, HZ + 2.4, .05, '#ffe2a0', 21);
  /* ---- Hillcrest: houses up a green hill, radio mast ---- */
  col(14, 126, 12, u => 14 - Math.pow((u - 70) / 56, 2) * 14, GR2, GR);
  for (const [u, v] of [[36, 15], [50, 19], [61, 22], [77, 23], [88, 20], [99, 17], [109, 14], [45, 14], [68, 17], [84, 15]]) house(u, v, ['#f0e6d2', '#e8d0b8', '#dfe8ee'][(u + v) % 3], ['#8a5a4a', '#5a6a84', '#a8563a'][u % 3]);
  for (const [u, v] of [[30, 13], [56, 15], [72, 20], [94, 14], [104, 19], [42, 18], [116, 12]]) tree(u, v);
  t(70, 27, .7, 10, '#b8bcc8'); t(69, 31, 2.7, .5, '#b8bcc8'); if (N || D) L(() => r(69.8, 37, 1.1, 1.1, '#ff5a4a')); else t(69.8, 37, 1.1, 1.1, '#d9483b');
  lights(20, 122, 13, 25, .02, '#ffd98a', 31);
  /* ---- the park: lawns, trees, pond, bandstand ---- */
  t(120, 13, 56, 10, GR2, GR); t(150, 17, 11, 2.4, SEA); t(151, 19, 8, .5, SEA2); t(134, 15, 3, 2.5, '#f4f0e8'); t(133.5, 17.5, 4, 1, '#d9483b');
  for (const [u, v] of [[122, 20], [128, 17], [140, 21], [146, 14], [164, 20], [170, 15], [158, 22], [126, 13], [172, 20], [138, 13]]) tree(u, v);
  lights(120, 176, 13, 22, .006, '#fff0c0', 33);
  /* ---- Old Town: terracotta roofs, the clock tower ---- */
  t(178, 13, 60, 12, se === 3 ? '#d8dee4' : '#c9b79a');
  for (const v of [22, 19, 16, 13]) for (let u = 180 + (v % 2) * 2; u < 234 - (HZ - v) * .2; u += 5.5) house(u, v + (hash2(u | 0, v, 1) < .4 ? .6 : 0), ['#f2e2c4', '#ecd2ae', '#f6ead8', '#e4c6a0'][(u * 3 + v) & 3], ['#c8603c', '#b8543a', '#d27848'][Math.floor(u + v) % 3], 4.2);
  t(204, 22, 2.6, 9, '#efe3c8'); t(206, 22, .8, 9, '#cdbf9f'); t(204.4, 31, 1.8, 1.4, '#8a4a3a'); t(204.9, 32.4, .9, 1.4, '#8a4a3a'); if (N || D) L(() => r(204.7, 28.4, 1.3, 1.3, '#fff0c0')); else t(204.7, 28.4, 1.3, 1.3, '#fff8e8');
  lights(178, 238, 13, 25, .03, '#ffd98a', 35);
  /* ---- the bay: lighthouse, boats ---- */
  t(257, 19.2, 17, 2, '#7a7468'); t(260, 21, 10, .8, '#8f897c'); t(265, 21.5, 3, 9, '#f4f0e8'); t(267, 21.5, 1, 9, '#d4d0c6'); t(265, 23.5, 3, 1.6, '#d04a3a'); t(265, 27, 3, 1.6, '#d04a3a'); t(264.6, 32.1, 3.8, .8, '#3a4050'); t(265.6, 32.9, 1.8, .8, '#3a4050');
  if (N || D) L(() => { r(264.6, 30.5, 3.8, 1.6, '#ffe9a0'); if (N) { r(268.4, 30.8, 46, 1.1, '#ffe9a0', 0); r(300, 30.2, 30, 2.2, '#ffe9a0', 0); } }); else t(264.6, 30.5, 3.8, 1.6, '#cfe6f2');
  const sail = (u, v, c) => { t(u, v, 5, 1, '#f4f0e8'); t(u + 2, v + 1, .6, 4.4, '#6a5a4a'); t(u + 2.6, v + 1.4, 2.2, 2.6, c); t(u + 2.6, v + 4, 1.2, 1.2, c); t(u + .6, v + 1.4, 1.4, 1.6, '#ffffff'); lamp(u + 2, v + 5.2, '#fff0c0', .7, .7); };
  sail(292, 17, '#ffffff'); sail(338, 21.5, '#f8d070'); sail(388, 15, '#ffffff'); sail(318, 23.4, '#f0a090');
  t(352, 16, 14, 2, '#f4f0e8'); t(352, 16, 14, .7, '#2f6fb0'); t(354, 18, 9, 1.5, '#dbe6ee'); t(358, 19.5, 2, 1.6, '#d9483b'); lights(354, 363, 18.2, 19.2, .5, '#ffe9a0', 37);
  /* ---- the harbor: quay, cranes, containers, a ship ---- */
  t(398, 9, 132, 6.5, '#a8a498'); t(398, 15, 132, .6, '#7c786e');
  t(418, 15.6, 36, 3, '#3a4a66'); t(418, 15.6, 36, .8, '#b8443a'); for (let i = 0; i < 5; i++) { t(421 + i * 5, 18.6, 4.5, 1.8, ['#d9483b', '#3b6fd0', '#e8b83a', '#4fa860', '#f07a5a'][i]); if (i % 2) t(421 + i * 5, 20.4, 4.5, 1.8, ['#2f9a94', '#e8b83a', '#d9483b'][i % 3]); } t(447, 18.6, 5, 5.4, '#f0ece4'); t(448, 22, 3, 1, '#5a7890'); t(449, 24, 1.4, 2, '#d9483b');
  for (const u of [408, 466, 498]) { t(u, 15, 1.1, 12, '#e8862c'); t(u + 5, 15, 1.1, 12, '#c8701c'); t(u - 7, 26.4, 22, 1.5, '#e8862c'); t(u + 1, 24.8, 3.4, 1.6, '#f4f0e8'); t(u - 5, 20, .4, 6.4, '#4a4a58'); t(u - 6, 19, 2.4, 1.2, '#4a4a58'); t(u, 21, 6, .5, '#c8701c'); lamp(u - 7, 27.9, '#ff5a4a'); }
  for (let i = 0; i < 9; i++) for (let j = 0; j < 1 + ((i * 7) % 3); j++) t(462 + i * 6.4, 9.6 + j * 1.9, 5.6, 1.7, ['#d9483b', '#3b6fd0', '#e8b83a', '#4fa860', '#8a5aa8', '#f07a5a'][(i * 5 + j * 3) % 6]);
  t(402, 9.4, 20, 4.4, '#8fa0a8'); t(402, 13.8, 20, 1, snow('#6a7a84')); for (let u = 404; u < 420; u += 4) t(u, 10, 2.4, 2.6, '#5a6a74');
  lights(398, 530, 9, 15, .035, '#fff0c0', 39);
  /* ---- the airport: runway, terminal, tower, a plane on approach ---- */
  t(530, 9.5, 80, 9, '#b6bac0'); t(530, 16, 80, 2, '#4a4e58'); for (let u = 533; u < 608; u += 6) t(u, 16.8, 3, .5, '#f4f0e8');
  t(544, 10.5, 36, 4.2, '#eef2f5'); t(545, 12, 34, 1.4, N ? '#ffe2a0' : '#6ab0d8'); t(544, 14.7, 36, .7, snow('#c8d0d8')); if (N) lights(545, 579, 12, 13.4, .7, '#ffe9a0', 41);
  t(587, 10.5, 2.6, 12, '#dfe5ea'); t(589, 10.5, .8, 12, '#b8c2cc'); t(585.6, 22.5, 5.4, 2.4, '#3a5a78'); t(586, 24.9, 4.6, .7, '#dfe5ea'); lamp(587.8, 25.6, '#ff5a4a'); if (N) L(() => r(586, 23, 4.6, 1.2, '#9fe8ff'));
  for (const u of [550, 560, 570]) { t(u, 15, 4.5, 1, '#f4f6f8'); t(u, 16, 1, 1.8, ['#d9483b', '#2f6fb0', '#e8b83a'][u % 3]); }
  if (N || D) L(() => { for (let u = 531; u < 608; u += 3) { r(u, 15.6, .6, .6, '#7df0a0'); r(u, 18.1, .6, .6, '#9fd0ff'); } });
  { const k = fr / FRAMES, pu = 470 + k * 110, pv = 47 - k * 24; t(pu, pv, 7, 1.2, '#f4f6f8'); t(pu, pv + 1.2, 1.5, 1.7, '#d9483b'); t(pu + 2.6, pv - .7, 2.6, .7, '#c2ccd6'); lamp(pu + 6.6, pv + .2, '#fff8d0', .8, .8); }
  /* ---- near: the river with its bridges, riverside trees ---- */
  for (let v = 0; v < 14; v += st) { const w = 11 - v * .5; t(rc(v) - w / 2, v, w, st, v % 3 < 1 ? SEA2 : SEA); }
  for (const v of [4.2, 9.2]) { const w = 11 - v * .5, c = rc(v); t(c - w / 2 - 2.5, v, w + 5, 1.3, '#e2dccc'); t(c - w / 2 - 2.5, v, w + 5, .4, '#a8a290'); t(c - .5, v - 1, 1, 1, '#a8a290'); lamp(c - w / 2 - 1, v + 1.3, '#fff0c0', .7, .7); lamp(c + w / 2 + .6, v + 1.3, '#fff0c0', .7, .7); }
  for (let v = 1.5; v < 12; v += 3.2) { tree(rc(v) - (11 - v * .5) / 2 - 5, v); tree(rc(v) + (11 - v * .5) / 2 + 4, v - .8); }
  /* ---- foreground: downtown rooftops right below the deck ---- */
  const BC = ['#4a5a78', '#3d6a80', '#5a5068', '#66788c', '#2f5a70', '#70687c'];
  for (let i = 0, u = -4; u < PANO_W; i++) {
    const w = 9 + Math.floor(hash2(i, 1, 11) * 6), near = Math.abs(u + w / 2 - rc(3)) < 22 || (u > 236 && u < 400); let h = near ? 0 : 3 + Math.floor(hash2(i, 2, 11) * 8); const c = BC[Math.floor(hash2(i, 3, 11) * BC.length)];
    if (h) { t(u, 0, w, h, c); t(u + w - 2, 0, 2, h, mix(c, '#1a1a30', .35)); t(u, h, w, .7, mix(c, '#ffffff', .35));
      for (let wv = 1; wv < h - 1; wv += 2) for (let wu = 1; wu < w - 3; wu += 2) { const on = hash2(Math.round(u + wu), wv, 13); if ((N && on < .55) || (D && on < .25)) L(() => r(u + wu, wv, 1, 1, on < .1 ? '#bfe8ff' : '#ffd98a')); else t(u + wu, wv, 1, 1, mix(c, '#bfe6f8', .45)); }
      if (hash2(i, 4, 11) < .6) t(u + 1, h + .7, 2.4, 1.1, '#b8bcc8'); if (hash2(i, 5, 11) < .5) { t(u + w - 3.4, h + .7, .5, 3.4, '#c8ccd8'); lamp(u + w - 3.6, h + 4.1, '#ff5a4a', .9, .9); } if (se === 3) t(u, h + .7, w, .5, '#f4f8fb', 0); }
    u += w + 1 + Math.floor(hash2(i, 6, 11) * 3);
  }
}
/** paint a pano window onto a 2D canvas context (y flipped). Returns the context. */
export function panoCanvas(ctx, o) { let last = null; pano((x, y, c) => { if (c !== last) ctx.fillStyle = last = c; ctx.fillRect(x, Math.round((o.h || PANO_H) * (o.s || 1)) - 1 - y, 1, 1); }, o); return ctx; }
