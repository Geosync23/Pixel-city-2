// Maple Bay Observatory — canvas painters (no game state): the planetarium programmes and the eyepiece views.
//   SKY_W, SKY_H            size of the unrolled planetarium sky (the left half goes on the left wall, the right half on the right wall; the corner is in the middle)
//   drawShow(ctx, progId, t, env) -> light colour     one frame of a programme at t seconds. env: { season, moon (phase), name (player) }
//   drawIdle(ctx, t, lines)                            the house-lights slide with up to 3 text lines
//   drawView(ctx, S, obj, t, o)                        what the eyepiece shows (S x S px). obj = an OBJECTS entry | { kind: 'sweep' } | { kind: 'city' }.
//                                                      o: { moon (phase), small, night, season, sx, sy (comet-sweep smudge 0..1), found, seed }
//   ctxText(ctx, str, x, y, hex, centre?)              3x5 pixel font on a 2D canvas
import * as R from '../../engine/raster.js';
import { moonDisc, planetDisc, CONSTELLATIONS, drawFigure } from '../../art/showpiece/_obs_lib.js';
import { panoCanvas, PANO_H } from '../../art/showpiece/_pano.js';

export const SKY_W = 448, SKY_H = 80;
const h2 = R.hash2, mix = R.mix, TAU = Math.PI * 2, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), sm = (a, b, t) => { const k = clamp((t - a) / (b - a)); return k * k * (3 - 2 * k); };
const TXT = new Map();
export function ctxText(ctx, s, x, y, c, centre) {
  s = String(s).toUpperCase(); const k = s + c; let t = TXT.get(k);
  if (!t) { const sp = R.render([0, 0, R.textW(s) + 1, 6], () => R.textS(s, 0, 0, c), null, 1); t = document.createElement('canvas'); t.width = sp.w; t.height = sp.h; t.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(sp.buf.buffer), sp.w, sp.h), 0, 0); t._x = sp.x; t._y = sp.y; if (TXT.size > 300) TXT.clear(); TXT.set(k, t); }
  ctx.drawImage(t, Math.round(centre ? x - R.textW(s) / 2 : x) + t._x, y + t._y);
}
const putOf = ctx => { let last = null; return (x, y, c) => { if (c !== last) ctx.fillStyle = last = c; ctx.fillRect(x, y, 1, 1); }; };
const STARS = []; for (let i = 0; i < 330; i++) STARS.push([Math.floor(h2(i, 1, 31) * SKY_W), Math.floor(h2(i, 2, 31) * (SKY_H - 6)), h2(i, 3, 31), h2(i, 4, 31) * 9]);
function stars(ctx, t, k = 1, dx = 0) { // k = how many are out (0..1)
  for (let i = 0; i < STARS.length; i++) { const s = STARS[i]; if (s[2] > k) continue; const tw = Math.sin(t * 2.2 + s[3]) > .82; let x = (s[0] + dx) % SKY_W; if (x < 0) x += SKY_W;
    ctx.fillStyle = s[2] < .08 ? '#ffffff' : s[2] < .3 ? (tw ? '#ffffff' : '#e8ecff') : tw ? '#8a9ad8' : '#5a6aa8'; ctx.fillRect(Math.floor(x), s[1], 1, 1); if (s[2] < .05) { ctx.fillRect(Math.floor(x) - 1, s[1], 3, 1); ctx.fillRect(Math.floor(x), s[1] - 1, 1, 3); } }
}
const fill = (ctx, c) => { ctx.fillStyle = c; ctx.fillRect(0, 0, SKY_W, SKY_H); };
const bands = (ctx, cols) => { const n = cols.length, bh = SKY_H / n; for (let i = 0; i < n; i++) { ctx.fillStyle = cols[i]; ctx.fillRect(0, Math.floor(i * bh), SKY_W, Math.ceil(bh) + 1); if (i) { ctx.fillStyle = cols[i - 1]; for (let x = (i & 1); x < SKY_W; x += 2) ctx.fillRect(x, Math.floor(i * bh), 1, 2); } } };
const horizon = (ctx, c, lights, snow) => { for (let x = 0; x < SKY_W; x++) { const hh = 5 + Math.sin(x / 31) * 2.5 + Math.sin(x / 9 + 2) * 1.2 + (x > 250 && x < 330 ? 3 : 0); ctx.fillStyle = c; ctx.fillRect(x, SKY_H - Math.round(hh), 1, Math.round(hh)); if (snow) { ctx.fillStyle = '#c8d4f0'; ctx.fillRect(x, SKY_H - Math.round(hh), 1, 1); } if (lights > 0 && h2(x, 3, 5) < lights * .22) { ctx.fillStyle = h2(x, 4, 5) < .7 ? '#ffd98a' : '#fff4d0'; ctx.fillRect(x, SKY_H - 1 - Math.floor(h2(x, 5, 5) * (hh - 1)), 1, 1); } } };
const glowDisc = (ctx, x, y, r, c, a = .5) => { ctx.globalAlpha = a; ctx.fillStyle = c; for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); ctx.fillRect(Math.round(x - w), Math.round(y + j), w * 2 + 1, 1); } ctx.globalAlpha = 1; };
const rays = (ctx, x, y, L, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x - L), Math.round(y), L * 2 + 1, 1); ctx.fillRect(Math.round(x), Math.round(y - L * .7), 1, Math.round(L * 1.4) + 1); for (let i = 1; i < L * .5; i++) { ctx.fillRect(Math.round(x + i), Math.round(y + i), 1, 1); ctx.fillRect(Math.round(x - i), Math.round(y - i), 1, 1); ctx.fillRect(Math.round(x + i), Math.round(y - i), 1, 1); ctx.fillRect(Math.round(x - i), Math.round(y + i), 1, 1); } };
const cloud = (ctx, t, cx, cy, rad, cols, dens = 1, spin = 0) => { for (let y = 2; y < SKY_H - 2; y += 2) for (let x = Math.max(0, Math.floor(cx - rad * 2.2)) & ~1; x < Math.min(SKY_W, cx + rad * 2.2); x += 2) { const dx = (x - cx) / 2, dy = y - cy, d = Math.hypot(dx, dy) / rad; if (d > 1.15) continue; const a = Math.atan2(dy, dx) + spin * (1.2 - d), n = Math.sin(a * 3 + d * 5 + t * .3) + Math.sin(x * .07 + y * .11 + t * .2) + Math.sin(y * .23 - x * .05), v = (1 - d) * 1.6 + n * .35; if (v * dens < .55) continue; if (v * dens < .8 && ((x >> 1) + (y >> 1)) & 1) continue; ctx.fillStyle = cols[Math.min(cols.length - 1, Math.floor(v * dens * 1.6))]; ctx.fillRect(x, y, 2, 2); } };

const SHOWS = {
  tonight(ctx, t, env) {
    const nk = sm(1, 12, t);
    bands(ctx, [mix('#3b3a7a', '#070b22', nk), mix('#7a4c8e', '#0a0f2e', nk), mix('#c95c7c', '#0f1740', nk), mix('#f0885a', '#172150', nk), mix('#f9c26e', '#212f5f', nk)]);
    if (t > 38) { const k = sm(38, 46, t); ctx.fillStyle = '#3a4a86'; for (let i = 0; i < 700 * k; i++) { const x = h2(i, 1, 77) * SKY_W, y = 44 - (x - 224) * .14 + (h2(i, 2, 77) - .5) * 22 * (.4 + h2(i, 3, 77)); if (i % 5 === 0) ctx.fillStyle = h2(i, 4, 77) < .3 ? '#8a9ad8' : '#3a4a86'; ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1); } }
    stars(ctx, t, sm(8, 24, t) * .9, -t * .35);
    if (t > 10) { ctx.fillStyle = '#fff4d0'; ctx.fillRect(120, 50, 2, 2); ctx.fillStyle = '#ffd0a0'; ctx.fillRect(388, 30, 2, 2); if (t < 30) { ctxText(ctx, 'VENUS', 121, 56, '#8a94c8', 1); ctxText(ctx, 'JUPITER', 389, 36, '#8a94c8', 1); } }
    if (t > 22 && t < 64) { const cs = CONSTELLATIONS.filter(c => c.season === (env.season || 0)), put = putOf(ctx); cs.forEach((c, i) => { const k = sm(22 + i * 4, 28 + i * 4, t), fade = 1 - sm(56, 62, t); if (k <= 0) return; ctx.globalAlpha = fade; const x0 = [262, 60, 356][i], y0 = [8, 12, 30][i]; drawFigure(put, k < 1 ? Object.assign({}, c, { lines: c.lines.slice(0, Math.ceil(c.lines.length * k)) }) : c, x0, y0, 56, 36, { lines: true, lineC: '#6a7ad0', big: 2 }); if (k >= 1) ctxText(ctx, c.name.split(',')[0], x0 + 28, y0 + 40, '#a8b4f0', 1); ctx.globalAlpha = 1; }); }
    if (t > 52) { const k = sm(52, 66, t), mx = 300, my = SKY_H - 4 - k * 46; glowDisc(ctx, mx, my, 12, '#3a4a86', .4); moonDisc(putOf(ctx), mx, Math.round(my), 8, clamp(env.moon === undefined ? .4 : env.moon, .12, .88), { dark: '#1a2248', detail: 1 }); }
    if (t > 66 && t < 68.5) { const k = (t - 66) / 2.5; ctx.fillStyle = '#ffffff'; for (let i = 0; i < 12; i++) ctx.fillRect(Math.round(60 + k * 90 - i * 2), Math.round(10 + k * 30 - i * .7), 2, 1); }
    horizon(ctx, mix('#2a2440', '#0a0c1c', nk), 1 - sm(4, 16, t) * .75);
    return mix('#c96a6a', '#3a4a9a', nk);
  },
  planets(ctx, t) {
    fill(ctx, '#05071a'); const put = putOf(ctx);
    for (let i = 0; i < 150; i++) { const a = h2(i, 1, 9) * TAU, sp = .3 + h2(i, 2, 9), ph = (h2(i, 3, 9) + t * sp * .05) % 1, d = ph * ph * 260, x = 224 + Math.cos(a) * d, y = 40 + Math.sin(a) * d * .45; if (x < 0 || x >= SKY_W || y < 0 || y >= SKY_H) continue; ctx.fillStyle = ph > .6 ? '#ffffff' : ph > .3 ? '#a8b4f0' : '#4a5a98'; ctx.fillRect(Math.floor(x), Math.floor(y), ph > .8 ? 2 : 1, 1); }
    if (t < 15) { const k = sm(0, 13, t), r = 30 - k * 25, x = 330 + k * 60, y = 44 - k * 10; glowDisc(ctx, x, y, Math.round(r + 3), '#3a6ad8', .25); planetDisc(put, 'earth', Math.round(x), Math.round(y), r, { t: t * .02 }); ctx.fillStyle = '#d8d4c0'; ctx.fillRect(Math.round(x - r * 2.4 - 6), Math.round(y - r * .4), Math.max(1, Math.round(r / 7)), Math.max(1, Math.round(r / 7))); }
    if (t > 12 && t < 30) { const k = sm(12, 22, t), o = sm(24, 30, t), r = 3 + k * 25, x = 320 - o * 420, y = 40 + o * 6; planetDisc(put, 'mars', Math.round(x), Math.round(y), r, { t: t * .03 }); if (k >= 1 && o < .2) ctxText(ctx, 'MARS', 320, 72, '#d9896a', 1); }
    if (t > 27 && t < 46) { const k = sm(27, 36, t), o = sm(40, 46, t), r = 4 + k * 30, x = 70 + k * 40 + o * 420, y = 40 - o * 4; planetDisc(put, 'jupiter', Math.round(x), Math.round(y), r, { t: t * .02 }); for (let i = 0; i < 4; i++) { const mx = x + Math.cos(t * (.3 + i * .13) + i * 2) * (r + 14 + i * 9); ctx.fillStyle = ['#f4e8c0', '#d8d4c0', '#c8b08a', '#a8a39a'][i]; ctx.fillRect(Math.round(mx), Math.round(y + (i - 1.5) * 2), 2, 2); } if (k >= 1 && o < .2) ctxText(ctx, 'JUPITER', 110, 3, '#e8cfa0', 1); }
    if (t > 43 && t < 62) { const k = sm(43, 52, t), o = sm(56, 62, t), r = 3 + k * 19, x = 336 - o * 60, y = 40 + o * 60; planetDisc(put, 'saturn', Math.round(x), Math.round(y), r); if (k >= 1 && o < .2) ctxText(ctx, 'SATURN', 336, 6, '#ecd9a0', 1); }
    if (t > 59) { const k = sm(59, 64, t); glowDisc(ctx, 224, 30, Math.round(4 * k), '#ffe9a0', .5); ctx.fillStyle = '#ffffff'; ctx.fillRect(223, 29, 2, 2); rays(ctx, 224, 30, Math.round(6 * k), '#fff4d0'); }
    if (t > 68) { ctx.fillStyle = '#6aa8ff'; ctx.fillRect(360, 44, 2, 2); ctxText(ctx, 'HOME', 361, 50, '#6a8ad8', 1); }
    return t < 13 ? '#3a6ad8' : t < 28 ? '#b8563a' : t < 44 ? '#c8a070' : t < 60 ? '#c8b880' : '#3a4a8a';
  },
  starbirth(ctx, t) {
    fill(ctx, '#080618'); stars(ctx, t, .5); const cx = 336, cy = 40;
    if (t < 26) { const k = sm(10, 25, t); cloud(ctx, t, cx - (1 - k) * 110, cy, 44 - k * 30, ['#3a1a4a', '#6a2a6a', '#a8487a', '#d8788a', '#f4b0a0'], 1 + k * .5, k * 6 + t * .1); cloud(ctx, t + 9, 110 + k * 200, 36, 30 - k * 24, ['#2a1a50', '#4a2a7a', '#7a4aa8', '#a878d0'], 1, k * 4); }
    if (t > 22 && t < 54) { const k = sm(22, 26, t), big = sm(48, 54, t), fl = t < 27 ? 1 - sm(24, 27, t) : 0, r = 3 + k * 4 + big * 12, col = mix('#fff8e0', '#ff6a3a', big);
      if (t > 30) { ctx.fillStyle = '#6a4a3a'; for (let i = 0; i < 260; i++) { const a = h2(i, 1, 4) * TAU + t * .15 * (1.4 - h2(i, 2, 4)), d = 16 + h2(i, 2, 4) * 60, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .28; if (Math.sin(a) < 0 || d > r + 4) { if (i % 3 === 0) ctx.fillStyle = h2(i, 5, 4) < .4 ? '#a8785a' : '#6a4a3a'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); } } for (let i = 0; i < 4; i++) { const a = t * (.5 - i * .09) + i * 1.7, d = 26 + i * 13, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .28; if (sm(40, 46, t) > i / 4) { ctx.fillStyle = ['#a8a39a', '#4a8ae8', '#d9683a', '#e8cfa0'][i]; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, i === 3 ? 3 : 2, i === 3 ? 3 : 2); } } }
      glowDisc(ctx, cx, cy, Math.round(r * 2.4), col, .22); glowDisc(ctx, cx, cy, Math.round(r * 1.5), col, .4); glowDisc(ctx, cx, cy, Math.round(r), '#ffffff', 1); rays(ctx, cx, cy, Math.round(r * 2.5 + Math.sin(t * 5) * 2), col); if (fl > 0) { ctx.globalAlpha = fl; fill(ctx, '#ffffff'); ctx.globalAlpha = 1; } }
    if (t >= 54 && t < 58) { const k = sm(54, 58, t), r = 15 * (1 - k); glowDisc(ctx, cx, cy, Math.round(r), '#ff5a2a', 1); }
    if (t >= 58) { const k = (t - 58) / 12, fl = 1 - sm(58, 60.5, t), rr = 6 + k * 70; for (let i = 0; i < 520; i++) { const a = h2(i, 1, 6) * TAU, d = rr * (.82 + h2(i, 2, 6) * .25), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .55; if (y < 0 || y >= SKY_H) continue; ctx.fillStyle = ['#ff7a5a', '#ffd070', '#7ad8ff', '#d878f0', '#ffffff'][i % 5]; ctx.fillRect(Math.round(x), Math.round(y), i % 7 === 0 ? 2 : 1, 1); } ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 1, cy - 1, 2, 2); if (fl > 0) { ctx.globalAlpha = fl; fill(ctx, '#ffffff'); ctx.globalAlpha = 1; } }
    return t < 22 ? '#8a3a7a' : t < 52 ? '#d8b880' : t < 58 ? '#c84a2a' : t < 61 ? '#ffffff' : '#8a6ad8';
  },
  aurora(ctx, t) {
    bands(ctx, ['#050816', '#070c20', '#0a122c', '#0e1a38']); stars(ctx, t, .8); const K = sm(8, 24, t) * (1 - sm(58, 67, t)), K2 = sm(30, 46, t) * (1 - sm(56, 64, t));
    for (let L = 0; L < 3; L++) { const amp = L === 0 ? K : K2 * (L === 1 ? .9 : .7); if (amp <= .02) continue;
      for (let x = 0; x < SKY_W; x++) { const ph = x * .021 + L * 2.1, base = 46 + L * 7 - Math.sin(ph + t * (.22 + L * .07)) * 9 - Math.sin(x * .053 - t * .31 + L) * 5, hh = (16 + Math.sin(x * .13 + t * 1.3 + L * 3) * 6 + Math.sin(x * .41 - t * 2.1) * 3) * amp * (1.2 + .5 * Math.sin(x * .017 + t * .2 + L)); if (hh < 1) continue;
        for (let j = 0; j < hh; j++) { const y = Math.round(base - j); if (y < 0 || y >= SKY_H) continue; const f = j / hh; if (f > .55 && ((x + y) & 1)) continue; if (f > .8 && (x & 1)) continue; ctx.fillStyle = f < .12 ? '#d8ffd0' : f < .45 ? (L === 2 ? '#4ad8c0' : '#5af08a') : f < .75 ? (L === 1 ? '#8a6ae8' : '#3ac890') : '#7a4ac8'; ctx.fillRect(x, y, 1, 1); } } }
    horizon(ctx, '#0a1020', 0, true); for (let i = 0; i < 46; i++) { const x = Math.floor(h2(i, 1, 12) * SKY_W), hh = 6 + Math.floor(h2(i, 2, 12) * 9); for (let j = 0; j < hh; j++) { const w = 1 + Math.floor(j * .45); ctx.fillStyle = j % 3 === 2 ? '#1a2a3a' : '#0c1624'; ctx.fillRect(x - w, SKY_H - 5 - hh + j, w * 2 + 1, 1); } }
    return mix('#0e1a38', K2 > .3 ? '#6a8ae0' : '#3ad88a', Math.max(K, K2) * .8);
  },
  comet(ctx, t, env) {
    const home = t >= 48 && t < 58; fill(ctx, home ? '#0a1030' : '#05071a'); stars(ctx, t, .75, home ? 0 : -t * .8); const put = putOf(ctx);
    const comet = (x, y, k, ang) => { const L = Math.round(10 + k * 90), ca = Math.cos(ang), sa = Math.sin(ang); for (let i = L; i >= 0; i--) { const f = i / L, w = 1 + f * (3 + k * 7); for (let j = -w; j <= w; j += 1) { if (h2(i, Math.round(j), 3) > 1.05 - f * .75) continue; const X = x + ca * i - sa * j * .6, Y = y + sa * i * .5 + ca * j * .6; ctx.fillStyle = f < .12 ? '#ffffff' : f < .4 ? '#c8e8ff' : f < .7 ? '#7aa8e8' : '#3a5aa8'; ctx.fillRect(Math.round(X), Math.round(Y), 1, 1); } } if (k > .2) { ctx.fillStyle = '#b8f0d0'; for (let i = 0; i < L * .8; i += 2) ctx.fillRect(Math.round(x + Math.cos(ang - .22) * i), Math.round(y + Math.sin(ang - .22) * i * .5), 1, 1); } glowDisc(ctx, x, y, Math.round(2 + k * 4), '#a8e8ff', .5); glowDisc(ctx, x, y, Math.round(1 + k * 2), '#ffffff', 1); };
    if (t < 10) { ctxText(ctx, 'THE MAPLE BAY COMET', 336, 30, '#c8e8ff', 1); ctxText(ctx, 'DISCOVERED FROM THIS DOME', 336, 42, '#6a8ad8', 1); }
    else if (t < 22) { const x = 400 - (t - 10) * 6; ctx.fillStyle = '#5a5e6a'; ctx.fillRect(Math.round(x), 38, 4, 3); ctx.fillStyle = '#8a8e9a'; ctx.fillRect(Math.round(x) + 1, 38, 2, 1); ctxText(ctx, 'FAR FROM THE SUN: DARK AND FROZEN', 336, 66, '#5a6aa8', 1); }
    else if (t < 48) { const k = sm(22, 40, t); glowDisc(ctx, 30, 40, Math.round(10 + k * 16), '#ffb040', .35); glowDisc(ctx, 30, 40, Math.round(5 + k * 7), '#ffe9a0', 1); rays(ctx, 30, 40, Math.round(14 + k * 10), '#ffd070'); comet(330 - k * 90 + Math.sin(t * .3) * 4, 42 - k * 6, k, 0.08); if (t > 36) ctxText(ctx, 'THE TAIL POINTS AWAY FROM THE SUN', 336, 70, '#7aa8e8', 1); }
    else if (home) { comet(300, 26, .45, -.5); horizon(ctx, '#0c0e1e', .8); ctx.fillStyle = '#0c0e1e'; for (let j = -9; j <= 0; j++) { const w = Math.round(Math.sqrt(81 - j * j)); ctx.fillRect(120 - w, SKY_H - 12 + j, w * 2, 1); } ctx.fillRect(110, SKY_H - 12, 34, 8); ctx.fillStyle = '#ffd98a'; ctx.fillRect(134, SKY_H - 9, 2, 2); ctxText(ctx, 'COMET HALVORSEN-' + String(env.name || 'YOU').toUpperCase().slice(0, 12), 300, 8, '#c8e8ff', 1); }
    else { const k = 1 - sm(58, 66, t); comet(300 + (1 - k) * 100, 30 - (1 - k) * 16, k * .4, -.5); ctxText(ctx, 'BACK IN 40,000 YEARS', 120, 36, '#6a8ad8', 1); }
    void put; return t >= 22 && t < 48 ? '#b89a6a' : '#4a7ad8';
  },
};
export function drawShow(ctx, id, t, env = {}) { const f = SHOWS[id] || SHOWS.tonight; ctx.globalAlpha = 1; return f(ctx, t, env) || '#3a4a9a'; }
export function drawIdle(ctx, t, lines = []) {
  bands(ctx, ['#1c2548', '#222c56', '#283362', '#2d3a6e']); stars(ctx, t, .35, t * 1.5);
  ctx.fillStyle = '#d9a441'; ctx.fillRect(250, 14, 172, 1); ctx.fillRect(250, 62, 172, 1); ctx.fillRect(26, 14, 172, 1); ctx.fillRect(26, 62, 172, 1);
  const cols = ['#f4d68a', '#f4ead0', '#8a94c8']; lines.slice(0, 3).forEach((s, i) => { ctxText(ctx, s, 336, 24 + i * 12, cols[i], 1); }); ctxText(ctx, 'MAPLE BAY OBSERVATORY', 112, 26, '#f4d68a', 1); ctxText(ctx, 'THE STAR THEATRE', 112, 38, '#f4ead0', 1); ctxText(ctx, 'RECLINE AND LOOK UP', 112, 50, '#8a94c8', 1);
}

/* ---------- eyepiece views ---------- */
let CITY = null;
export function drawView(ctx, S, ob, t, o = {}) {
  const c = S / 2, put = putOf(ctx), sc = o.small ? .55 : 1, dx = Math.sin(t * .23) * 3, dy = Math.cos(t * .17) * 2, X = Math.round(c + dx), Y = Math.round(c + dy), kind = ob.kind;
  ctx.globalAlpha = 1; ctx.fillStyle = kind === 'city' ? '#6cb3e6' : '#04050f'; ctx.fillRect(0, 0, S, S);
  if (kind === 'city') { if (!CITY || CITY._k !== o.time + o.season) { CITY = document.createElement('canvas'); CITY.width = 608 * 2; CITY.height = PANO_H * 2; panoCanvas(CITY.getContext('2d'), { u0: 0, w: 608, s: 2, time: o.time || 'day', season: o.season === undefined ? 1 : o.season, frame: 3, plane: -1 }); CITY._k = o.time + o.season; }
    const u = ((o.u0 || 380) * 2 + Math.sin(t * .2) * 40) | 0; ctx.imageSmoothingEnabled = false; ctx.drawImage(CITY, Math.max(0, Math.min(CITY.width - S / 1.5, u)), 24, S / 1.5, S / 1.5, 0, 0, S, S); }
  else {
    const seed = o.seed || 1, n = kind === 'moon' ? 10 : 70; for (let i = 0; i < n; i++) { const x = h2(i, seed, 41) * S + dx, y = h2(i, seed, 42) * S + dy, m = h2(i, seed, 43); ctx.fillStyle = m < .1 ? '#ffffff' : m < .4 ? '#a8b4f0' : '#4a5a98'; ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1); }
    if (kind === 'moon') moonDisc(put, X, Y, Math.round(S * .4 * sc), clamp(o.moon === undefined ? .5 : o.moon, .06, .94), { dark: '#10142c', detail: 1 });
    else if (kind === 'planet') { const id = ob.id, r = { venus: 9, mars: 8, jupiter: 14, saturn: 10 }[id] * sc * S / 96; if (id === 'jupiter') for (let i = 0; i < 4; i++) { const mx = X + Math.cos(seed * (1.3 + i) + i * 2.2) * (r + 8 + i * 6) * (i % 2 ? 1 : -1); ctx.fillStyle = '#f4e8c0'; ctx.fillRect(Math.round(mx), Y + (i % 2), i === 2 ? 2 : 1, i === 2 ? 2 : 1); }
      planetDisc(put, id, X, Y, r, { t: t * .01, phase: id === 'venus' ? .35 + (seed % 5) * .08 : undefined }); }
    else if (kind === 'nebula') { for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const ax = (x - X) / (S * .34 * sc), ay = (y - Y) / (S * .24 * sc), d = Math.hypot(ax, ay), n = Math.sin(ax * 4 + ay * 2) + Math.sin(ay * 5 - ax * 3 + 1) + Math.sin((ax + ay) * 7), v = 1.25 - d + n * .16 - (ay > .1 && Math.abs(ax) < .25 ? .5 : 0); if (v < .25) continue; if (v < .5 && ((x + y) & 1)) continue; ctx.fillStyle = v > 1 ? '#d8f4e0' : v > .75 ? '#8ad8b0' : v > .5 ? '#4a9a8a' : '#2a5a6a'; ctx.fillRect(x, y, 1, 1); } ctx.fillStyle = '#ffffff'; for (const [a, b] of [[0, 0], [3, -2], [-2, 2], [2, 3]]) ctx.fillRect(X + a, Y + b, 2, 2); }
    else if (kind === 'cluster') { for (let i = 0; i < 9; i++) { const x = X + (h2(i, 1, 51) - .5) * S * .5 * sc, y = Y + (h2(i, 2, 51) - .5) * S * .36 * sc; glowDisc(ctx, x, y, i < 7 ? 4 : 2, '#4a6ad8', .35); ctx.fillStyle = '#e8f0ff'; ctx.fillRect(Math.round(x) - 1, Math.round(y), 3, 1); ctx.fillRect(Math.round(x), Math.round(y) - 1, 1, 3); } }
    else if (kind === 'galaxy' || kind === 'spiral') { for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const rx = (x - X) * .92 + (y - Y) * .38, ry = (y - Y) * .92 - (x - X) * .38, ax = rx / (S * .4 * sc), ay = ry / (S * (kind === 'spiral' ? .34 : .13) * sc), d = Math.hypot(ax, ay); if (d > 1) continue; let v = 1 - d; if (kind === 'spiral') { const a = Math.atan2(ay, ax); v = (.5 + .5 * Math.sin(a * 2 - d * 9)) * (1 - d) * 1.3 + (d < .18 ? .6 : 0); } if (v < .12) continue; if (v < .3 && ((x + y) & 1)) continue; ctx.fillStyle = v > .8 ? '#fff4d8' : v > .55 ? '#c8c0d8' : v > .3 ? '#7a80b0' : '#3a4270'; ctx.fillRect(x, y, 1, 1); } if (kind === 'spiral') glowDisc(ctx, X + S * .3 * sc, Y - S * .16 * sc, 3, '#c8c0d8', .7); }
    else if (kind === 'ring') { const r = S * .13 * sc; for (let y = -r - 2; y <= r + 2; y++) for (let x = -r * 1.25 - 2; x <= r * 1.25 + 2; x++) { const d = Math.hypot(x / 1.25, y) / r; if (d > 1.1 || d < .5) { if (d < .5 && ((Math.round(x) + Math.round(y)) & 1)) { ctx.fillStyle = '#2a4a5a'; ctx.fillRect(Math.round(X + x), Math.round(Y + y), 1, 1); } continue; } ctx.fillStyle = d > .95 ? '#5a7a8a' : d > .7 ? '#a8d8c8' : '#7ab0b8'; ctx.fillRect(Math.round(X + x), Math.round(Y + y), 1, 1); } ctx.fillStyle = '#ffffff'; ctx.fillRect(X, Y, 1, 1); }
    else if (kind === 'globular') { for (let i = 0; i < 520 * sc; i++) { const a = h2(i, 1, 61) * TAU, d = Math.pow(h2(i, 2, 61), 2.2) * S * .3 * sc; ctx.fillStyle = d < 5 ? '#fff8e0' : h2(i, 3, 61) < .3 ? '#ffd9a0' : '#c8d0f0'; ctx.fillRect(Math.round(X + Math.cos(a) * d), Math.round(Y + Math.sin(a) * d), 1, 1); } }
    else if (kind === 'double') { glowDisc(ctx, X - 5, Y + 2, 5, '#ffb040', .4); glowDisc(ctx, X - 5, Y + 2, 2, '#ffe9a0', 1); rays(ctx, X - 5, Y + 2, 8, '#ffd070'); glowDisc(ctx, X + 6, Y - 3, 4, '#3a6ae8', .45); glowDisc(ctx, X + 6, Y - 3, 1, '#c8e0ff', 1); rays(ctx, X + 6, Y - 3, 5, '#8ab8ff'); }
    else if (kind === 'comet') { for (let i = 44 * sc; i >= 0; i--) { const f = i / (44 * sc), w = 1 + f * 7; for (let j = -w; j <= w; j++) { if (h2(i, Math.round(j), 3) > 1 - f * .7) continue; ctx.fillStyle = f < .15 ? '#ffffff' : f < .5 ? '#a8d8ff' : '#4a6ab8'; ctx.fillRect(Math.round(X - i * .9 + j * .3), Math.round(Y - i * .4 + j * .8), 1, 1); } } glowDisc(ctx, X, Y, 4, '#a8e8ff', .6); glowDisc(ctx, X, Y, 2, '#ffffff', 1); }
    else if (kind === 'sweep') { const sx = (o.sx === undefined ? .5 : o.sx) * S + dx, sy = (o.sy === undefined ? .5 : o.sy) * S + dy; glowDisc(ctx, sx, sy, 4, '#5a7aa8', .3 + .1 * Math.sin(t * 2)); glowDisc(ctx, sx, sy, 2, '#8ab0d0', .5); if (o.found) { ctx.strokeStyle = '#7df0a0'; ctx.lineWidth = 1; ctx.strokeRect(Math.round(sx) - 7.5, Math.round(sy) - 7.5, 15, 15); } }
  }
  // the round field stop
  ctx.fillStyle = '#000000'; for (let y = 0; y < S; y++) { const w = Math.sqrt(Math.max(0, (c - 1) * (c - 1) - (y + .5 - c) * (y + .5 - c))), a = Math.floor(c - w); ctx.fillRect(0, y, a, 1); ctx.fillRect(S - a, y, a, 1); }
}
