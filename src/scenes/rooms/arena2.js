// Maple Bay Arena — canvas painters (no init): the jumbotron faces and the sprite helper used to paint whole rows of fans onto one canvas.
//   JW x JH = one scoreboard face (96 x 48 px = 6 x 3 world units).  paintJumbo(ctx, s) draws it; s.mode:
//     'idle' { l1, l2, clock }   'score' { home: {abbr, c, score}, away, q, clock (s), ball (0|1|-1), tick, to }   'intro' { num, name, pos }
//     'replay' { pts, name, f, e (+1 east basket), from: [u, v] }   'fancam' { spr (standing char sprite, or an array of frames), spr2, label, kiss }   'noise' { v 0..1 }
//     'text' { lines: [..], c }   'concert' { act, song, c, c2, beat }   'show' { title, scene, kind }   'final' { home, away, won }   + s.t (real seconds) on all
//   charSprite(key, spec, anim, frame, dir, opts) -> cached sprite { c, x, y, w, h }      ctxText(ctx, str, x, y, hex, scale, centre)
import { pixSprite } from '../../engine/sprites.js';
import { charArt } from '../../core/char.js';
import { mix } from '../../engine/raster.js';
import { textPx, tw, mascot, RED, CREAM, GOLD, LED } from '../../art/showpiece/_arena_lib.js';

export const JW = 96, JH = 48;
let SB = null;
export function charSprite(key, spec, anim, frame, dir, po) { const A = charArt(); if (!SB) SB = A.CHAR_SB; return pixSprite('af' + key + anim + frame + dir + (po ? (po.seated ? 's' : '') + (po.item || '') : ''), SB, () => A.drawChar(spec, po ? Object.assign({ anim, frame, dir }, po) : { anim, frame, dir })); }
export function ctxText(ctx, str, x, y, hex, sc = 1, centre = false) { if (centre) x = Math.round(x - tw(str, sc) / 2); ctx.fillStyle = hex; textPx((px, py) => ctx.fillRect(px, py, 1, 1), str, x, y, hex, sc); }
const bright = c => { const n = parseInt(c.slice(1, 7), 16), l = ((n >> 16) * 3 + (n >> 8 & 255) * 5 + (n & 255) * 2) / 2550; return l < .42 ? mix(c, '#ffffff', .45) : c; };
const R_ = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
const clockS = s => { s = Math.max(0, Math.ceil(s - .001)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
let ollieC = null;
function ollie(f) { if (!ollieC) ollieC = {}; if (ollieC[f]) return ollieC[f]; const c = document.createElement('canvas'); c.width = 24; c.height = 30; const x = c.getContext('2d'); mascot((dx, dy, col) => { if (col.length > 7) return; x.fillStyle = col; x.fillRect(12 + dx, 27 + dy, 1, 1); }, f); return ollieC[f] = c; }

export function paintJumbo(ctx, s) {
  const t = s.t || 0, m = s.mode || 'idle'; ctx.imageSmoothingEnabled = false; R_(ctx, 0, 0, JW, JH, '#07080d');
  // faint LED grid
  ctx.fillStyle = '#0d0f17'; for (let y = 1; y < JH; y += 2) ctx.fillRect(0, y, JW, 1);
  if (m === 'score' || m === 'final') {
    const H = s.home, A = s.away; R_(ctx, 0, 0, JW, 9, '#1a0c0c'); R_(ctx, 0, 9, JW, 1, RED);
    ctxText(ctx, m === 'final' ? 'FINAL' : s.to ? 'TIME OUT' : s.brk ? s.brk : 'Q' + s.q + '  ' + clockS(s.clock), JW / 2, 2, m === 'final' ? GOLD : s.clock < 24 && s.q === 4 && Math.floor(t * 3) % 2 ? '#ff5a4a' : CREAM, 1, true);
    for (const [T, x0, side] of [[H, 3, 0], [A, 53, 1]]) { const c = bright(T.c); R_(ctx, x0, 12, 40, 7, mix(T.c, '#000000', .55)); ctxText(ctx, T.abbr, x0 + 20, 13, CREAM, 1, true); const sc = String(T.score); ctxText(ctx, sc, x0 + 20, 22, c, 3, true); if (s.ball === side && m !== 'final') { R_(ctx, x0 + 17, 39, 6, 1, GOLD); R_(ctx, x0 + 18, 38, 4, 1, GOLD); } }
    R_(ctx, 47, 24, 2, 2, '#565c70'); R_(ctx, 47, 30, 2, 2, '#565c70');
    R_(ctx, 0, 41, JW, 7, '#12141c'); const tk = String(s.tick || 'LET\'S GO OTTERS'), w = tw(tk); if (w <= JW - 4) ctxText(ctx, tk, JW / 2, 42, LED, 1, true); else ctxText(ctx, tk, JW - Math.floor(t * 22) % (w + JW), 42, LED);
    if (m === 'final' && s.won && Math.floor(t * 2) % 2) { for (let i = 0; i < 14; i++) R_(ctx, (i * 37 + Math.floor(t * 30)) % JW, (i * 13 + Math.floor(t * 20)) % 40, 1, 2, [GOLD, RED, CREAM][i % 3]); }
  } else if (m === 'intro') {
    R_(ctx, 0, 0, JW, JH, '#1a0808'); for (let i = 0; i < 6; i++) R_(ctx, (Math.floor(t * 40) + i * 17) % JW, 0, 3, JH, '#2a0e0e');
    ctxText(ctx, '#' + s.num, 24, 8, RED, 4, true); ctxText(ctx, String(s.name).split(' ')[0], 70, 10, CREAM, 1, true); ctxText(ctx, String(s.name).split(' ').slice(1).join(' ').slice(0, 11), 70, 19, GOLD, 1, true); ctxText(ctx, s.pos || '', 70, 29, '#8fd0f0', 1, true); ctxText(ctx, 'YOUR MAPLE BAY OTTERS', JW / 2, 40, CREAM, 1, true);
  } else if (m === 'replay') {
    if (Math.floor(t * 3) % 2) { R_(ctx, 2, 2, 31, 9, RED); ctxText(ctx, 'REPLAY', 5, 4, CREAM); } const x0 = 14, y0 = 13, W = 68, Hh = 26; R_(ctx, x0, y0, W, Hh, '#8a6a3c'); R_(ctx, x0 + 1, y0 + 1, W - 2, Hh - 2, '#d9a45c'); R_(ctx, x0 + W / 2, y0, 1, Hh, CREAM);
    const e = s.e > 0, bx = e ? x0 + W - 5 : x0 + 4, by = y0 + Hh / 2; R_(ctx, bx - 1, by - 1, 3, 3, '#f08a2c'); R_(ctx, e ? x0 + W - 13 : x0 + 1, by - 5, 12, 10, RED);
    const fu = s.from ? s.from[0] : 5, fv = s.from ? s.from[1] : 0, sx = bx - (e ? 1 : -1) * fu * 4.4, sy = by + fv * 3, f = Math.min(1, ((t * .9) % 1.5)); R_(ctx, Math.round(sx) - 1, Math.round(sy) - 1, 3, 3, RED); for (let i = 0; i <= 10; i++) { const k = i / 10; if (k > f) break; ctx.fillStyle = k === Math.floor(f * 10) / 10 ? '#ffffff' : '#f08a2c'; ctx.fillRect(Math.round(sx + (bx - sx) * k), Math.round(sy + (by - sy) * k - Math.sin(k * Math.PI) * 6), 1, 1); }
    ctxText(ctx, '+' + s.pts + ' ' + String(s.name).slice(0, 14), JW / 2, 41, GOLD, 1, true); ctxText(ctx, s.kind || '', 64, 4, CREAM);
  } else if (m === 'fancam') {
    R_(ctx, 0, 0, JW, JH, s.kiss ? '#3a1028' : '#101828'); const pulse = Math.floor(t * 4) % 2;
    if (s.kiss) for (const [hx, hy] of [[8, 8], [84, 10], [10, 34], [86, 32], [48, 4]]) { const c = pulse ? '#ff7aa8' : '#e84a88'; R_(ctx, hx, hy + 1, 5, 2, c); R_(ctx, hx + 1, hy, 1, 1, c); R_(ctx, hx + 3, hy, 1, 1, c); R_(ctx, hx + 1, hy + 3, 3, 1, c); R_(ctx, hx + 2, hy + 4, 1, 1, c); }
    R_(ctx, 26, 3, 44, 34, '#283858'); R_(ctx, 27, 4, 42, 32, s.kiss ? '#5a2848' : '#3a5078');
    const fr = a => (Array.isArray(a) ? a[Math.floor(t * 5) % a.length] : a), draw = (sp, cx) => { sp = fr(sp); if (sp && sp.c) ctx.drawImage(sp.c, 7, 9, 20, 17, cx - 20, 4 + (pulse && s.bounce ? -2 : 0), 40, 34); };
    ctx.save(); ctx.beginPath(); ctx.rect(27, 4, 42, 32); ctx.clip(); if (s.spr2) { draw(s.spr, 39); draw(s.spr2, 57); } else draw(s.spr, 48); ctx.restore();
    R_(ctx, 0, 39, JW, 9, '#12141c'); ctxText(ctx, s.label || (s.kiss ? 'KISS CAM' : 'FAN CAM'), JW / 2, 41, s.kiss ? '#ff9ac0' : GOLD, 1, true); if (pulse) { R_(ctx, 3, 3, 3, 3, '#ff3a2a'); ctxText(ctx, 'LIVE', 8, 2, CREAM); }
  } else if (m === 'noise') {
    ctxText(ctx, 'MAKE SOME', JW / 2, 3, CREAM, 2, true); ctxText(ctx, 'NOISE!', JW / 2, 15, Math.floor(t * 5) % 2 ? GOLD : RED, 2, true); const n = Math.round((s.v || 0) * 22); for (let i = 0; i < 22; i++) R_(ctx, 4 + i * 4, 44 - (i < n ? 6 + Math.floor(i / 2) + (Math.floor(t * 12 + i) % 3) : 2), 3, i < n ? 6 + Math.floor(i / 2) + (Math.floor(t * 12 + i) % 3) : 2, i < n ? (i > 16 ? '#ff4a3a' : i > 10 ? GOLD : '#7df0a0') : '#22252f');
  } else if (m === 'text') {
    const L = s.lines || [], c = s.c || CREAM, n = L.length, big = n <= 2 && L.every(x => tw(x, 2) <= JW - 4), sc = big ? 2 : 1, lh = sc * 5 + 5, y0 = Math.round((JH - n * lh + 5) / 2); if (s.bg) R_(ctx, 0, 0, JW, JH, s.bg);
    L.forEach((x, i) => ctxText(ctx, x, JW / 2, y0 + i * lh, i === 0 ? c : i === 1 ? GOLD : '#8fd0f0', tw(x, sc) <= JW - 2 ? sc : 1, true)); if (s.ollie !== undefined) ctx.drawImage(ollie(4 + Math.floor(t * 4) % 4), 2, 14);
  } else if (m === 'concert') {
    const c = s.c || '#e84aa8', c2 = s.c2 || '#3fd0e0'; for (let i = 0; i < 24; i++) { const h = 4 + Math.floor((Math.sin(i * 1.3 + t * 7) * .5 + .5) * 20 * (.5 + .5 * Math.sin(t * 3 + i * .4) ** 2)) + (s.beat ? 4 : 0); R_(ctx, i * 4, 38 - h, 3, h, i % 2 ? c : c2); R_(ctx, i * 4, 38 - h - 2, 3, 1, '#ffffff'); }
    R_(ctx, 0, 0, JW, 9, '#12141c'); const a = String(s.act || ''); if (tw(a) <= JW - 4) ctxText(ctx, a, JW / 2, 2, '#ffffff', 1, true); else ctxText(ctx, a, JW - Math.floor(t * 20) % (tw(a) + JW), 2, '#ffffff'); R_(ctx, 0, 39, JW, 9, '#12141c'); const sg = String(s.song || ''); if (tw(sg) <= JW - 4) ctxText(ctx, sg, JW / 2, 41, GOLD, 1, true); else ctxText(ctx, sg, JW - Math.floor(t * 20) % (tw(sg) + JW), 41, GOLD);
  } else if (m === 'show') {
    const ice = s.kind === 'ice'; R_(ctx, 0, 0, JW, JH, ice ? '#0c1a34' : '#241408'); for (let i = 0; i < 26; i++) { const x = (i * 41 + Math.floor(t * (ice ? 6 : 30) * (1 + i % 3))) % JW, y = (i * 17 + Math.floor(t * (ice ? 9 : 0) * (1 + i % 2))) % JH; R_(ctx, x, y, 1, 1, ice ? '#cfe9f4' : '#f08a2c'); if (i % 5 === 0) { R_(ctx, x - 1, y, 3, 1, ice ? '#ffffff' : GOLD); R_(ctx, x, y - 1, 1, 3, ice ? '#ffffff' : GOLD); } }
    const T = String(s.title || '').split(' '), mid = Math.ceil(T.length / 2), a = T.slice(0, mid).join(' '), b = T.slice(mid).join(' '); ctxText(ctx, a, JW / 2, 6, ice ? '#ffffff' : GOLD, tw(a, 2) < JW ? 2 : 1, true); ctxText(ctx, b, JW / 2, 19, ice ? '#8fd0f0' : RED, tw(b, 2) < JW ? 2 : 1, true); R_(ctx, 0, 37, JW, 11, '#12141c'); ctxText(ctx, String(s.scene || '').slice(0, 23), JW / 2, 40, CREAM, 1, true);
  } else {
    ctxText(ctx, 'MAPLE BAY', JW / 2, 4, RED, 2, true); ctxText(ctx, 'ARENA', JW / 2, 16, CREAM, 2, true); ctxText(ctx, String(s.l1 || '').slice(0, 23), JW / 2, 30, GOLD, 1, true); ctxText(ctx, String(s.l2 || '').slice(0, 23), JW / 2, 38, '#8fd0f0', 1, true);
    ctx.drawImage(ollie(Math.floor(t * 2) % 2), 1, 20); if (s.clock) ctxText(ctx, s.clock, JW - 22, 2, '#565c70');
  }
  if (s.name && (m === 'idle' || m === 'score') && Math.floor(t / 5) % 6 === 5) { R_(ctx, 0, 0, JW, JH, '#1a0c0c'); ctxText(ctx, 'HONORARY OTTER', JW / 2, 6, GOLD, 1, true); ctxText(ctx, String(s.name).toUpperCase().slice(0, 11), JW / 2, 18, CREAM, tw(String(s.name).slice(0, 11), 2) < JW - 2 ? 2 : 1, true); ctx.drawImage(ollie(2 + Math.floor(t * 4) % 2), 36, 26); }
}
