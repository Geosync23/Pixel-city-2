// minigame.js — ONE shared, touch-first mini-game kit for every skill activity (styles: minigame.css).
// The game sits in a sheet at the bottom of the screen (portrait) or docked on the right (landscape) so the character stays visible in the world;
// the simulation keeps running underneath (the sheet is not a modal) unless the player pauses.
//
//   play(def) -> Promise<{ score 0..1, stars 0..3, auto, quit, stats }>
//     def = { kind, title, icon?, hint, level (1..10), theme?: { icon, bad, color, color2, paper, icons[] }, o?: kind options, onBeat?(q 0..1, tag), custom?(env) -> game,
//             autoLabel?, noAuto? }
//     kinds: 'timing' (stop the marker in the zone; o.style 'bar' | 'ring'), 'rhythm' (falling notes, o.lanes 1..4, o.alt), 'trace' (drag along the dotted path),
//            'memory' (watch the sequence, repeat it), 'balance' (hold / release to keep the needle in the moving zone), 'aim' (o.mode 'throw': lock aim then power;
//            'pour': hold to fill to the line), 'sort' (o.bins [labels], o.items [[label, bin, color?]]), 'quickdraw' (tap the good ones, leave the bad ones),
//            'custom' (def.custom(env) returns a game object: arcade cabinets, chess).
//     Every game has Pause, Stop (quit any time) and Auto (the usual result at once: nobody is ever blocked).
//   A game object: { update(dt), draw(g), down?(x, y), move?(x, y), up?(x, y), done, score, want?() -> hint for tests, stats?() }
//     env = { W, H, lvl, d (0..1 difficulty), def, theme, beat(q, tag), cap(text), bins(labels, onPick) -> setActive(i), prog(i, n), icon(g, id, x, y, s), rnd() }
//   MG.cur = { def, kind, state() -> { t, done, score, paused, want }, auto(), quit(), pause(on), canvas, toClient(x, y) -> page coords } while a game is open (tests + keys).
//   abort() closes an open game without a result (the activity it belonged to was cancelled).   sheetRect() -> DOMRect | null.
//   stars(score) -> 0..3.   Keys: Space / Enter = tap at the hinted spot, Esc = pause.
import { G } from '../core/game.js';
import { el, root } from './kit.js';
import { iconCanvas, iconEl } from './_icons.js';

export const MG = { cur: null };
export const W = 180, H = 110;
const INK = '#2a2733', PAPER = '#fff4dc', GOOD = '#5fb84f', BAD = '#d8342e', GOLD = '#f2c230', SKY = '#eaf6fb';
const LANE_COL = ['#e0527a', '#3b82d6', '#f2c230', '#5fb84f'];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const stars = s => (s >= .85 ? 3 : s >= .55 ? 2 : s > .2 ? 1 : 0);

/* ---------- tiny pixel drawing helpers ---------- */
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const box = (g, x, y, w, h, c, edge = INK) => { R(g, x, y, w, h, edge); R(g, x + 1, y + 1, w - 2, h - 2, c); };
function disc(g, cx, cy, r, c) { g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy); for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); g.fillRect(cx - w, cy + y, w * 2 + 1, 1); } }
function ring(g, cx, cy, r, c, th = 1) { g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy); const n = Math.max(12, Math.round(r * 6.3)); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), th, th); } }
function line(g, x0, y0, x1, y1, c, th = 1) { g.fillStyle = c; const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))); for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n - (th - 1) / 2), Math.round(y0 + (y1 - y0) * i / n - (th - 1) / 2), th, th); }
function drawIcon(g, id, x, y, s = 1, alpha = 1) { if (!id) return; let c = null; try { c = iconCanvas(id); } catch (e) { c = null; } if (!c) return; const pad = (c.width - 16) / 2; g.globalAlpha = alpha; g.imageSmoothingEnabled = false; g.drawImage(c, pad, pad, 16, 16, Math.round(x), Math.round(y), 16 * s, 16 * s); g.globalAlpha = 1; }
function spark(parts, x, y, c = GOLD, n = 6) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 20 + Math.random() * 40; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, t: .5 + Math.random() * .3, c }); } }
function stepParts(parts, dt) { for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; if (p.t <= 0) parts.splice(i, 1); } }
function drawParts(g, parts) { for (const p of parts) R(g, p.x, p.y, 2, 2, p.c); }
export const draw = { R, box, disc, ring, line, icon: drawIcon, spark, stepParts, drawParts, INK, PAPER, GOOD, BAD, GOLD };

/* ====================================================================== the kinds ====================================================================== */
const KINDS = {};

/* ---- timing: stop the marker inside the zone, n rounds ---- */
KINDS.timing = E => {
  const o = E.def.o || {}, n = o.rounds || 5, got = [], parts = []; let i = 0, pos = Math.random(), dir = 1, spd = (o.speed || .75) + .85 * E.d, zw = (o.zone || .3) - .15 * E.d, z0 = .5, t = 0, flash = 0, flashQ = 0, wait = 0, bounce = 0;
  const newZone = () => { z0 = o.high ? .62 + Math.random() * .3 - zw / 2 * 0 : .18 + Math.random() * .64; z0 = clamp(z0, zw / 2 + .02, 1 - zw / 2 - .02); t = 0; };
  newZone(); E.prog(0, n);
  const g = { done: false, score: 0,
    update(dt) {
      stepParts(parts, dt); flash = Math.max(0, flash - dt); bounce = Math.max(0, bounce - dt);
      if (wait > 0) { wait -= dt; if (wait <= 0) { if (i >= n) { g.done = true; g.score = got.reduce((a, b) => a + b, 0) / n; } else newZone(); } return; }
      t += dt; pos += dir * spd * dt; if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; }
      if (t > 7) judge(0);
    },
    down() { if (wait > 0 || g.done) return; const dz = Math.abs(pos - z0); judge(dz <= zw * .18 ? 1 : dz <= zw / 2 ? .8 : Math.max(0, .5 - (dz - zw / 2) * 3.2)); },
    draw(c) {
      if (o.style === 'ring') {                       // focus ring: the moving ring must sit on the fixed one
        const cx = W / 2, cy = 50, r0 = 10 + z0 * 30, r = 10 + pos * 30; box(c, 20, 6, 140, 88, E.theme.paper || '#cfe3ef'); if (E.def.scene) E.def.scene(c, 21, 7, 138, 86, flash > 0 ? 1 : clamp(1 - Math.abs(pos - z0) * 2.2));
        ring(c, cx, cy, r0, '#ffffff', 2); ring(c, cx, cy, r0 + zw * 15, '#ffffff88'); ring(c, cx, cy, Math.max(2, r0 - zw * 15), '#ffffff88'); ring(c, cx, cy, r, flash > 0 ? (flashQ > .5 ? GOOD : BAD) : GOLD, 2);
        R(c, cx - 1, cy - 4, 2, 8, '#ffffffaa'); R(c, cx - 4, cy - 1, 8, 2, '#ffffffaa'); if (flash > .25) { c.globalAlpha = (flash - .25) * 2.5; R(c, 21, 7, 138, 86, '#ffffff'); c.globalAlpha = 1; }
      } else {
        const bx = 12, bw = 156, by = 72; const ic = E.theme.icon; const hop = bounce > 0 ? Math.sin((1 - bounce / .35) * Math.PI) * (flashQ > .5 ? 12 : 0) : 0, shake = bounce > 0 && flashQ <= .5 ? Math.sin(bounce * 60) * 3 : 0;
        if (E.def.scene) E.def.scene(c, 0, 0, W, 66, flashQ, bounce); else drawIcon(c, ic, W / 2 - 24 + shake, 12 - hop, 3);
        box(c, bx - 2, by - 2, bw + 4, 16, SKY); R(c, bx + (z0 - zw / 2) * bw, by, zw * bw, 12, GOOD); R(c, bx + (z0 - zw * .18) * bw, by, zw * .36 * bw, 12, '#8fe07a');
        R(c, bx + pos * bw - 2, by - 5, 5, 22, INK); R(c, bx + pos * bw - 1, by - 4, 3, 20, flash > 0 ? (flashQ > .5 ? GOLD : BAD) : BAD);
      }
      drawParts(c, parts);
    },
    want: () => ({ type: 'tap', x: W / 2, y: 50, ready: wait <= 0 && Math.abs(pos - z0) < zw * .16 }),
    stats: () => ({ perfect: got.filter(v => v >= 1).length, rounds: n }),
  };
  function judge(q) { got.push(q); i++; E.prog(i, n); flash = .5; flashQ = q; bounce = .35; wait = .55; if (q > .5) spark(parts, 12 + pos * 156, 78, q >= 1 ? GOLD : GOOD, q >= 1 ? 10 : 5); E.beat(q, 'hit'); zw *= .93; spd *= 1.07; }
  return g;
};

/* ---- rhythm: notes fall down lanes; tap the lane as the note crosses the line ---- */
KINDS.rhythm = E => {
  const o = E.def.o || {}, L = Math.max(1, Math.min(4, o.lanes || 3)), n = Math.round((o.notes || 14) + 8 * E.d), beat = 60 / ((o.bpm || 84) + 56 * E.d), T = 1.7 - .6 * E.d, notes = [], parts = [], x0 = 12, lw = (W - 24) / L, hitY = 90, topY = 4;
  let tt = 1.5, last = -1; for (let k = 0; k < n; k++) { let lane = o.alt ? k % L : Math.floor(Math.random() * L); if (!o.alt && L > 1 && lane === last && Math.random() < .5) lane = (lane + 1) % L; last = lane; notes.push({ t: tt, lane, q: -1 }); tt += beat * (E.d > .3 && Math.random() < .25 + .25 * E.d ? .5 : 1); }
  let now = 0, combo = 0, best = 0, sum = 0, padFlash = new Array(L).fill(0), padQ = new Array(L).fill(0), judged = 0; E.prog(0, n);
  const end = tt + .5;
  const g = { done: false, score: 0,
    update(dt) {
      now += dt; stepParts(parts, dt); for (let k = 0; k < L; k++) padFlash[k] = Math.max(0, padFlash[k] - dt);
      for (const nt of notes) if (nt.q < 0 && now - nt.t > .2) { nt.q = 0; judged++; combo = 0; E.prog(judged, n); E.beat(0, 'miss'); }
      if (now >= end) { g.done = true; g.score = clamp(sum / n); }
    },
    down(x) {
      const lane = clamp(Math.floor((x - x0) / lw), 0, L - 1); let bestN = null, bd = .22;
      for (const nt of notes) if (nt.q < 0 && nt.lane === lane) { const dd = Math.abs(nt.t - now); if (dd < bd) { bd = dd; bestN = nt; } }
      padFlash[lane] = .18;
      if (!bestN) { padQ[lane] = 0; sum = Math.max(0, sum - .15); combo = 0; E.beat(0, 'miss'); return; }
      const q = bd < .075 ? 1 : bd < .14 ? .75 : .45; bestN.q = q; sum += q; judged++; combo++; best = Math.max(best, combo); padQ[lane] = q; E.prog(judged, n);
      spark(parts, x0 + lane * lw + lw / 2, hitY, q >= 1 ? GOLD : LANE_COL[lane], q >= 1 ? 8 : 4); E.beat(q, 'note'); if (combo > 2 && combo % 4 === 0) E.cap('Combo x' + combo);
    },
    draw(c) {
      for (let k = 0; k < L; k++) { box(c, x0 + k * lw, topY, lw, H - topY - 4, k % 2 ? '#3a3644' : '#454050'); R(c, x0 + k * lw + 1, hitY - 6, lw - 2, 12, padFlash[k] > 0 ? (padQ[k] > 0 ? '#ffffff' : BAD) : LANE_COL[k] + '99'); R(c, x0 + k * lw + 1, hitY - 1, lw - 2, 2, '#fff8e0'); if (E.theme.icons && E.theme.icons[k]) drawIcon(c, E.theme.icons[k], x0 + k * lw + lw / 2 - 8, hitY - 8, 1, .9); }
      for (const nt of notes) { if (nt.q >= 0 && nt.q > 0) continue; const y = hitY - (nt.t - now) / T * (hitY - topY); if (y < topY - 8 || y > H) continue; const x = x0 + nt.lane * lw + 4, w = lw - 8; R(c, x, y - 5, w, 10, INK); R(c, x + 1, y - 4, w - 2, 8, nt.q === 0 ? '#77707f' : LANE_COL[nt.lane]); R(c, x + 2, y - 3, w - 4, 2, '#ffffff66'); }
      drawParts(c, parts);
    },
    want() { const nt = notes.find(q => q.q < 0); if (!nt) return { type: 'tap', ready: false }; return { type: 'tap', x: x0 + nt.lane * lw + lw / 2, y: hitY, ready: Math.abs(nt.t - now) < .04 }; },
    stats: () => ({ combo: best, notes: n }),
  };
  return g;
};

/* ---- trace: drag along the dotted path; the strokes you leave are the picture ---- */
KINDS.trace = E => {
  const o = E.def.o || {}, n = (o.strokes || 3) + (E.lvl > 5 ? 1 : 0), rad = 11 - 4.5 * E.d, pal = E.theme.pal || ['#d8342e', '#3b82d6', '#f2c230', '#5fb84f', '#8a5cc2'], parts = [], trails = [], got = [];
  let i = 0, pts = [], idx = 0, drawing = false, dev = 0, devN = 0, t = 0, wait = 0, cur = null;
  function gen() {
    pts = []; idx = 0; dev = 0; devN = 0; t = 0; drawing = false; const k = Math.floor(Math.random() * 3), m = 16;
    const ax = 26 + Math.random() * 20, ay = 22 + Math.random() * 60, bx = W - 26 - Math.random() * 20, by = 22 + Math.random() * 60, cx = W / 2 + (Math.random() - .5) * 60, cy = Math.random() < .5 ? 8 : H - 12, flip = Math.random() < .5;
    for (let j = 0; j <= m; j++) { const u = j / m; let x, y;
      if (k === 0) { x = (1 - u) * (1 - u) * ax + 2 * u * (1 - u) * cx + u * u * bx; y = (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * cy + u * u * by; }
      else if (k === 1) { x = ax + (bx - ax) * u; y = H / 2 + Math.sin(u * Math.PI * 2) * 26 * (flip ? -1 : 1); }
      else { const a = u * Math.PI * 1.7 + (flip ? 1 : 0); x = W / 2 + Math.cos(a) * 46; y = H / 2 - 2 + Math.sin(a) * 30; }
      pts.push({ x: clamp(x, 16, W - 16), y: clamp(y, 12, H - 14) }); }
  }
  gen(); E.prog(0, n);
  function endStroke() { const cover = idx / pts.length, av = devN ? dev / devN : 0, q = clamp(cover * clamp(1 - Math.max(0, av - rad * .55) / 16)); got.push(q); i++; E.prog(i, n); drawing = false; cur = null; wait = .45; E.beat(q, 'stroke'); if (q > .5) spark(parts, pts[Math.max(0, idx - 1)].x, pts[Math.max(0, idx - 1)].y, pal[i % pal.length], 8); }
  const g = { done: false, score: 0,
    update(dt) { stepParts(parts, dt); if (wait > 0) { wait -= dt; if (wait <= 0) { if (i >= n) { g.done = true; g.score = got.reduce((a, b) => a + b, 0) / n; } else gen(); } return; } t += dt; if (t > 9) endStroke(); },
    down(x, y) { if (wait > 0 || g.done) return; if (Math.hypot(x - pts[idx].x, y - pts[idx].y) < rad + 10) { drawing = true; cur = { c: pal[i % pal.length], p: [[x, y]] }; trails.push(cur); g.move(x, y); } },
    move(x, y) {
      if (!drawing) return; cur.p.push([x, y]);
      while (idx < pts.length && Math.hypot(x - pts[idx].x, y - pts[idx].y) < rad) idx++;
      const a = pts[Math.max(0, idx - 1)], b = pts[Math.min(pts.length - 1, idx)], vx = b.x - a.x, vy = b.y - a.y, l2 = vx * vx + vy * vy || 1, u = clamp(((x - a.x) * vx + (y - a.y) * vy) / l2); dev += Math.hypot(x - (a.x + vx * u), y - (a.y + vy * u)); devN++;
      if (idx >= pts.length) endStroke();
    },
    up() { if (drawing) endStroke(); },
    draw(c) {
      box(c, 8, 4, W - 16, H - 10, E.theme.paper || '#fffdf4'); if (E.def.scene) E.def.scene(c, 9, 5, W - 18, H - 12);
      for (const tr of trails) for (let j = 1; j < tr.p.length; j++) line(c, tr.p[j - 1][0], tr.p[j - 1][1], tr.p[j][0], tr.p[j][1], tr.c, E.theme.thin ? 2 : 4);
      if (wait <= 0 && !g.done) { for (let j = idx; j < pts.length; j++) R(c, pts[j].x - 1, pts[j].y - 1, 3, 3, j === idx ? INK : '#2a273377'); const p0 = pts[idx] || pts[pts.length - 1], pr = 5 + Math.sin(t * 8) * 1.5; ring(c, p0.x, p0.y, pr, pal[i % pal.length], 2); const pe = pts[pts.length - 1]; R(c, pe.x - 2, pe.y - 2, 5, 5, INK); R(c, pe.x - 1, pe.y - 1, 3, 3, GOLD); }
      drawParts(c, parts);
    },
    want: () => (wait > 0 || g.done ? { type: 'drag', ready: false } : { type: 'drag', ready: true, pts: pts.slice(idx).map(p => [p.x, p.y]) }),
    stats: () => ({ strokes: n }),
  };
  return g;
};

/* ---- memory: watch the pads light up, repeat the sequence ---- */
KINDS.memory = E => {
  const o = E.def.o || {}, k = E.lvl >= 4 ? 6 : 4, cols = k / 2, rounds = o.rounds || 3, pw = k === 4 ? 56 : 44, ph = 38, gx = (W - cols * pw - (cols - 1) * 6) / 2, gy = 12, cl = ['#e0527a', '#3b82d6', '#f2c230', '#5fb84f', '#8a5cc2', '#f08a2c'], parts = [], got = [];
  const pad = j => ({ x: gx + (j % cols) * (pw + 6), y: gy + Math.floor(j / cols) * (ph + 6) });
  let r = 0, seq = [], phase = 'show', st = 0, si = 0, inp = 0, lit = -1, litT = 0, wait = .5, bad = -1; const on = .5 - .2 * E.d, gap = .16;
  const len = () => 3 + r + (E.lvl >= 6 ? 1 : 0) + (E.lvl >= 9 ? 1 : 0);
  function newSeq() { seq = []; for (let j = 0; j < len(); j++) { let p = Math.floor(Math.random() * k); if (j && p === seq[j - 1]) p = (p + 1 + Math.floor(Math.random() * (k - 1))) % k; seq.push(p); } phase = 'show'; si = 0; st = 0; inp = 0; bad = -1; E.cap('Watch...'); }
  newSeq(); E.prog(0, rounds);
  const g = { done: false, score: 0,
    update(dt) {
      stepParts(parts, dt); litT = Math.max(0, litT - dt); if (litT <= 0) lit = -1;
      if (wait > 0) { wait -= dt; if (wait > 0) return; if (phase === 'end') { r++; E.prog(r, rounds); if (r >= rounds) { g.done = true; g.score = got.reduce((a, b) => a + b, 0) / rounds; return; } newSeq(); wait = .3; } return; }
      if (phase === 'show') { st += dt; if (st >= on + gap) { st = 0; si++; } if (si >= seq.length) { phase = 'input'; E.cap('Your turn: repeat it'); lit = -1; } else if (st < on) { lit = seq[si]; litT = .05; } }
    },
    down(x, y) {
      if (phase !== 'input' || wait > 0) return; let hit = -1; for (let j = 0; j < k; j++) { const p = pad(j); if (x >= p.x - 2 && x < p.x + pw + 2 && y >= p.y - 2 && y < p.y + ph + 2) hit = j; } if (hit < 0) return;
      lit = hit; litT = .2; const p = pad(hit);
      if (hit === seq[inp]) { inp++; E.beat(.8, 'pad'); spark(parts, p.x + pw / 2, p.y + ph / 2, cl[hit], 4); if (inp >= seq.length) { got.push(1); phase = 'end'; wait = .5; E.cap('Got it!'); E.beat(1, 'round'); } }
      else { bad = hit; got.push(inp / seq.length * .7); phase = 'end'; wait = .8; E.cap('Not quite'); E.beat(0, 'miss'); }
    },
    draw(c) { for (let j = 0; j < k; j++) { const p = pad(j), onn = lit === j; box(c, p.x, p.y, pw, ph, bad === j ? BAD : onn ? '#ffffff' : cl[j]); if (!onn) { R(c, p.x + 2, p.y + 2, pw - 4, 3, '#ffffff55'); R(c, p.x + 2, p.y + ph - 6, pw - 4, 4, '#2a273333'); } const ic = E.theme.icons && E.theme.icons[j]; if (ic) drawIcon(c, ic, p.x + pw / 2 - 8, p.y + ph / 2 - 8, 1); }
      if (phase === 'show') for (let j = 0; j < seq.length; j++) R(c, W / 2 - seq.length * 4 + j * 8, H - 8, 5, 4, j <= si ? GOLD : '#2a273355'); else for (let j = 0; j < seq.length; j++) R(c, W / 2 - seq.length * 4 + j * 8, H - 8, 5, 4, j < inp ? GOOD : '#2a273355');
      drawParts(c, parts); },
    want() { if (phase !== 'input' || wait > 0) return { type: 'tap', ready: false }; const p = pad(seq[inp]); return { type: 'tap', x: p.x + pw / 2, y: p.y + ph / 2, ready: litT <= 0 }; },
    stats: () => ({ rounds, longest: len() }),
  };
  return g;
};

/* ---- balance: hold to push the needle up, release to let it fall; stay in the moving zone until the bar fills ---- */
KINDS.balance = E => {
  const o = E.def.o || {}, hw = (o.zone || .17) - .075 * E.d, T = o.secs || 28, need = o.need || 11, parts = [], w1 = .9 + .9 * E.d, w2 = 2.1 + 1.6 * E.d, ph = Math.random() * 6;
  let v = .3, vel = 0, hold = false, t = 0, prog = 0, tug = 0, tugT = 2 + Math.random() * 3, inz = false, c0 = .5, lastBeat = 0;
  const g = { done: false, score: 0,
    update(dt) {
      t += dt; stepParts(parts, dt); vel += (hold ? 2.3 : -1.9) * dt; vel *= Math.pow(.12, dt); v += vel * dt; if (v < 0) { v = 0; vel = 0; } if (v > 1) { v = 1; vel = 0; }
      tugT -= dt; if (tugT <= 0) { tug = (Math.random() - .5) * (.25 + .35 * E.d); tugT = 1.6 + Math.random() * 3 - E.d; } tug *= Math.pow(.3, dt);
      c0 = clamp(.5 + .26 * Math.sin(t * w1 + ph) + .1 * Math.sin(t * w2) + tug, hw + .03, 1 - hw - .03); inz = Math.abs(v - c0) <= hw;
      prog = clamp(prog + (inz ? dt / need : -dt / 34)); if (inz && t - lastBeat > .9) { lastBeat = t; E.beat(.7, 'hold'); }
      E.prog(Math.round(prog * 10), 10);
      if (prog >= 1) { g.done = true; g.score = clamp(.8 + .5 * (1 - t / T)); spark(parts, W / 2, 40, GOLD, 14); E.beat(1, 'land'); } else if (t >= T) { g.done = true; g.score = prog * .75; }
    },
    down() { hold = true; }, up() { hold = false; },
    draw(c) {
      const gx = 12, gy = 8, gh = 92; box(c, gx - 2, gy - 2, 18, gh + 4, SKY); R(c, gx, gy + (1 - c0 - hw) * gh, 14, hw * 2 * gh, inz ? '#8fe07a' : GOOD); R(c, gx - 4, gy + (1 - v) * gh - 2, 22, 5, INK); R(c, gx - 3, gy + (1 - v) * gh - 1, 20, 3, inz ? GOLD : BAD);
      box(c, 40, 6, W - 48, 80, E.theme.paper || '#bfe3f2'); if (E.def.scene) E.def.scene(c, 41, 7, W - 50, 78, { v, c0, inz, prog, t, hold }); else drawIcon(c, E.theme.icon, 41 + (W - 50) / 2 - 24 + (v - c0) * 30, 22 + Math.sin(t * 6) * (inz ? 1 : 3), 3);
      box(c, 40, 90, W - 48, 10, '#e9dcc0'); R(c, 41, 91, (W - 50) * prog, 8, GOLD); R(c, 41 + (W - 50) * clamp(t / T), 89, 1, 12, BAD);
      drawParts(c, parts);
    },
    want: () => ({ type: 'hold', on: v < c0 + (vel > 0 ? -.03 : .03), ready: true }),
    stats: () => ({ secs: Math.round(t), prog }),
  };
  return g;
};

/* ---- aim: 'throw' = lock the aim, then the power; 'pour' = hold to fill, let go at the line ---- */
KINDS.aim = E => {
  const o = E.def.o || {}, pour = o.mode === 'pour', n = o.shots || (pour ? 3 : 5), got = [], parts = [];
  let i = 0, stage = 0, a = 0, ad = 1, p = 0, pd = 1, za = .5, zp = .5, wa = .28 - .13 * E.d, wp = .26 - .11 * E.d, sa = 1.0 + .9 * E.d, sp = 1.2 + 1.0 * E.d, la = 0, lp = 0, fly = 0, q = 0, wait = 0, fill = 0, hold = false, rate = .5, target = .7, band = .075 - .035 * E.d, spilled = false, streak = 0, bestStreak = 0;
  function next() { stage = 0; fly = 0; a = Math.random(); p = 0; za = .25 + Math.random() * .5; zp = .35 + Math.random() * .5; fill = 0; hold = false; spilled = false; rate = (.38 + Math.random() * .3) * (1 + .7 * E.d); target = .55 + Math.random() * .33; }
  next(); E.prog(0, n);
  function judge(v) { q = v; got.push(v); i++; E.prog(i, n); wait = pour ? .8 : 1.1; fly = 0; stage = 3; if (v >= 1) { streak++; bestStreak = Math.max(bestStreak, streak); } else streak = 0; E.beat(v, pour ? 'pour' : 'shot'); }
  const g = { done: false, score: 0,
    update(dt) {
      stepParts(parts, dt);
      if (stage === 3) { fly += dt; wait -= dt; if (!pour && fly > .55 && fly - dt <= .55 && q > 0) spark(parts, 140, 34, q >= 1 ? GOLD : '#ffffff', q >= 1 ? 12 : 4); if (wait <= 0) { if (i >= n) { g.done = true; g.score = got.reduce((x, y) => x + y, 0) / n; } else next(); } return; }
      if (pour) { if (hold) { fill += rate * dt; if (fill >= 1.04) { fill = 1.04; spilled = true; hold = false; judge(0); } } return; }
      if (stage === 0) { a += ad * sa * dt; if (a > 1) { a = 1; ad = -1; } if (a < 0) { a = 0; ad = 1; } } else if (stage === 1) { p += pd * sp * dt; if (p > 1) { p = 1; pd = -1; } if (p < 0) { p = 0; pd = 1; } }
    },
    down() {
      if (stage === 3 || g.done) return; if (pour) { hold = true; return; }
      if (stage === 0) { la = a; stage = 1; p = 0; pd = 1; E.beat(.5, 'lock'); } else if (stage === 1) { lp = p; const da = Math.abs(la - za) / (wa / 2), dp = Math.abs(lp - zp) / (wp / 2); judge(da <= 1 && dp <= 1 ? 1 : da <= 1.7 && dp <= 1.7 ? .5 : 0); }
    },
    up() { if (pour && hold && stage !== 3) { hold = false; if (fill < .08) return; const dd = Math.abs(fill - target); judge(dd <= band ? 1 : Math.max(0, .8 - (dd - band) * 5)); if (q > .6) spark(parts, 90, 30, GOLD, 8); } },
    draw(c) {
      if (pour) {
        box(c, 8, 4, W - 16, H - 10, E.theme.paper || '#3a3644'); const gx = 70, gy = 14, gw = 40, gh = 78; R(c, gx - 2, gy, 2, gh + 2, '#dfeef5'); R(c, gx + gw, gy, 2, gh + 2, '#dfeef5'); R(c, gx - 2, gy + gh, gw + 4, 3, '#dfeef5');
        const fh = Math.min(1, fill) * gh, col = (E.theme.pal || ['#8fd8f0', '#f08a2c', '#e0527a'])[i % 3]; R(c, gx, gy + gh - fh, gw, fh, col); if (fh > 2) R(c, gx, gy + gh - fh, gw, 2, '#ffffff88');
        const ty = gy + gh - target * gh; R(c, gx - 8, ty - band * gh, 6, band * 2 * gh, GOOD); R(c, gx + gw + 2, ty - band * gh, 6, band * 2 * gh, GOOD); for (let x = gx; x < gx + gw; x += 4) R(c, x, ty, 2, 1, '#ffffff');
        if (hold) { R(c, gx + gw / 2 - 1, 4, 3, gy + gh - fh - 4, col); drawIcon(c, E.theme.icon, gx + gw / 2 - 20, -2, 1); } if (spilled) { R(c, gx - 6, gy + gh + 3, gw + 12, 3, col); }
        if (stage === 3) drawIcon(c, q >= 1 ? 'ui.star' : q > .4 ? 'ui.check' : 'ui.cross', gx + gw + 14, 40, 2);
      } else {
        box(c, 8, 4, W - 16, H - 10, E.theme.paper || '#cfe9c8'); const ox = 34, oy = 78, tx = 140, ty = 34;
        if (E.def.scene) E.def.scene(c, 9, 5, W - 18, H - 12, { q, fly, stage }); else { R(c, tx + 6, ty - 22, 3, 60, '#8a8f9a'); box(c, tx - 4, ty - 26, 16, 18, '#fffdf4'); R(c, tx - 12, ty, 16, 2, '#e0703a'); for (let k = 0; k < 4; k++) R(c, tx - 11 + k * 4, ty + 2, 1, 7, '#ffffffaa'); }
        const ang = -1.25 + a * 1.1, za0 = -1.25 + (za - wa / 2) * 1.1, za1 = -1.25 + (za + wa / 2) * 1.1; for (let u = za0; u <= za1; u += .03) R(c, ox + Math.cos(u) * 30, oy + Math.sin(u) * 30, 2, 2, GOOD);
        const aa = stage === 0 ? ang : -1.25 + la * 1.1; line(c, ox, oy, ox + Math.cos(aa) * 28, oy + Math.sin(aa) * 28, stage === 0 ? BAD : INK, 2);
        box(c, 12, 12, 10, 60, SKY); R(c, 13, 13 + (1 - zp - wp / 2) * 58, 8, wp * 58, GOOD); if (stage >= 1) { const pv = stage === 1 ? p : lp; R(c, 10, 13 + (1 - pv) * 58 - 1, 14, 3, stage === 1 ? BAD : INK); }
        let bx = ox, by = oy - 6; if (stage === 3) { const u = clamp(fly / .55), ex = q >= 1 ? tx - 4 : q > 0 ? tx - 10 : tx - 30 + (lp - zp) * 80, ey = q >= 1 ? ty + 2 : q > 0 ? ty - 2 : ty + 30; bx = ox + (ex - ox) * u; by = oy - 6 + (ey - oy + 6) * u - Math.sin(u * Math.PI) * 46; if (u >= 1) { const v = fly - .55; bx = ex + (q >= 1 ? 0 : q > 0 ? -v * 40 : v * 10); by = ey + v * v * 160; } }
        if (E.def.projectile) E.def.projectile(c, bx, by, { q, fly, stage }); /* QA6: e.g. the fair's ring toss draws a ring, not a basketball */ else if (E.theme.icon) drawIcon(c, E.theme.icon, bx - 8, by - 8, 1); else { disc(c, bx, by, 5, INK); disc(c, bx, by, 4, '#e0703a'); R(c, bx - 4, by, 9, 1, INK); }
      }
      drawParts(c, parts);
    },
    want() { if (stage === 3 || g.done) return { type: 'tap', ready: false }; if (pour) return { type: 'hold', on: fill < target - rate * .03, ready: true }; return stage === 0 ? { type: 'tap', x: W / 2, y: 50, ready: Math.abs(a - za) < wa * .2 } : { type: 'tap', x: W / 2, y: 50, ready: Math.abs(p - zp) < wp * .2 }; },
    stats: () => ({ made: got.filter(v => v >= 1).length, shots: n, streak: bestStreak }),
  };
  return g;
};

/* ---- sort: one thing at a time; send it to the right bin before its timer runs out ---- */
KINDS.sort = E => {
  const o = E.def.o || {}, pool = (o.items || []).slice().sort(() => Math.random() - .5), n = Math.min(pool.length, Math.round(7 + E.lvl * .6)), items = pool.slice(0, n), tl = 4.6 - 2.3 * E.d, parts = [], got = [];
  let i = 0, t = 0, anim = 0, res = 0, toBin = 0, wait = .25; const setActive = E.bins(o.bins || [], pick); E.prog(0, n); E.cap(items[0] ? items[0][0] : '');
  function pick(b) { if (anim > 0 || wait > 0 || g.done) return; const it = items[i], ok = b === it[1]; res = ok ? 1 : 0; toBin = b; got.push(ok ? .7 + .3 * clamp(1 - t / tl) : 0); anim = .32; E.beat(ok ? .9 : 0, ok ? 'sort' : 'miss'); if (ok) spark(parts, W / 2, 50, GOLD, 6); setActive(b, ok); }
  const g = { done: false, score: 0,
    update(dt) {
      stepParts(parts, dt); if (wait > 0) { wait -= dt; return; }
      if (anim > 0) { anim -= dt; if (anim <= 0) { i++; E.prog(i, n); t = 0; if (i >= n) { g.done = true; g.score = got.reduce((a, b) => a + b, 0) / n; E.cap(''); } else E.cap(items[i][0]); } return; }
      t += dt; if (t >= tl) { res = 0; toBin = -1; got.push(0); anim = .3; E.beat(0, 'miss'); }
    },
    draw(c) {
      const nb = (o.bins || []).length || 1; for (let b = 0; b < nb; b++) { const bx = 8 + b * (W - 16) / nb; box(c, bx + 2, H - 22, (W - 16) / nb - 4, 18, '#e9dcc0'); R(c, bx + 4, H - 20, (W - 16) / nb - 8, 3, '#2a273322'); }
      if (i < n) { const it = items[i]; let x = W / 2 - 26, y = 14, s = 1; if (anim > 0) { const u = 1 - anim / .32; if (res && toBin >= 0) { x += ((8 + toBin * (W - 16) / nb + (W - 16) / nb / 2 - 26) - x) * u; y += (H - 60 - y) * u * u; } else x += Math.sin(u * 30) * 4; }
        box(c, x, y, 52, 52, anim > 0 && !res ? '#ffd9d2' : '#fffdf4'); R(c, x + 2, y + 44, 48, 6, it[2] || E.theme.color || '#d9c9a6'); drawIcon(c, it[3] || E.theme.icon, x + 10, y + 6, 2);
        if (anim <= 0) { box(c, 30, 72, W - 60, 8, '#e9dcc0'); R(c, 31, 73, (W - 62) * clamp(1 - t / tl), 6, t / tl > .7 ? BAD : GOLD); } }
      drawParts(c, parts);
    },
    want: () => (i < n && anim <= 0 && wait <= 0 ? { type: 'bin', i: items[i][1], ready: true } : { type: 'bin', ready: false }),
    stats: () => ({ right: got.filter(v => v > 0).length, of: n }),
  };
  return g;
};

/* ---- quickdraw: things pop up; tap the good ones quickly, leave the bad ones alone ---- */
KINDS.quickdraw = E => {
  const o = E.def.o || {}, cols = 5, rows = 3, cw = 32, ch = 30, gx = (W - cols * cw) / 2, gy = 7, goods = Math.round((o.goods || 10) + 6 * E.d), life = 1.7 - .7 * E.d, every = .8 - .32 * E.d, parts = [], cells = new Array(cols * rows).fill(null);
  let spawned = 0, hits = 0, bads = 0, missed = 0, t = 0, next = .5; E.prog(0, goods);
  const g = { done: false, score: 0,
    update(dt) {
      t += dt; stepParts(parts, dt); next -= dt;
      for (let j = 0; j < cells.length; j++) { const c = cells[j]; if (!c) continue; c.t += dt; if (c.gone > 0) { c.gone -= dt; if (c.gone <= 0) cells[j] = null; continue; } if (c.t >= life) { if (c.good) { missed++; E.beat(0, 'miss'); } cells[j] = null; } }
      if (next <= 0 && spawned < goods) { const free = []; for (let j = 0; j < cells.length; j++) if (!cells[j]) free.push(j); if (free.length) { const j = free[Math.floor(Math.random() * free.length)], good = Math.random() > (o.badShare ?? .3); cells[j] = { good, t: 0, gone: 0 }; if (good) spawned++; } next = every * (.7 + Math.random() * .6); }
      E.prog(hits + missed, goods);
      if (spawned >= goods && cells.every(c => !c || !c.good || c.gone > 0)) { g.done = true; g.score = clamp((hits - .7 * bads) / goods); }
    },
    down(x, y) {
      const cx = Math.floor((x - gx) / cw), cy = Math.floor((y - gy) / ch); if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return; const c = cells[cy * cols + cx]; if (!c || c.gone > 0) return;
      c.gone = .22; c.hit = true; if (c.good) { hits++; spark(parts, gx + cx * cw + cw / 2, gy + cy * ch + ch / 2, GOLD, 6); E.beat(1, 'pop'); } else { bads++; E.beat(0, 'bad'); }
    },
    draw(c) {
      box(c, gx - 4, gy - 3, cols * cw + 8, rows * ch + 6, E.theme.paper || '#8a6a44'); if (E.def.scene) E.def.scene(c, gx - 3, gy - 2, cols * cw + 6, rows * ch + 4);
      for (let j = 0; j < cells.length; j++) { const x = gx + (j % cols) * cw, y = gy + Math.floor(j / cols) * ch, q = cells[j]; if (!E.def.scene) R(c, x + 4, y + ch - 7, cw - 8, 4, '#2a273333'); if (!q) continue;
        const pop = Math.min(1, q.t / .12), yy = y + 6 + (1 - pop) * 10 - (q.gone > 0 ? (.22 - q.gone) * 40 : 0); drawIcon(c, q.good ? E.theme.icon : E.theme.bad, x + cw / 2 - 8, yy, 1, q.gone > 0 ? q.gone / .22 : 1);
        if (q.gone > 0 && !q.good) { line(c, x + 8, y + 6, x + cw - 8, y + ch - 8, BAD, 2); line(c, x + cw - 8, y + 6, x + 8, y + ch - 8, BAD, 2); } else if (q.gone <= 0) R(c, x + 6, y + ch - 5, (cw - 12) * clamp(1 - q.t / life), 2, q.good ? GOLD : '#ffffff88'); }
      drawParts(c, parts);
    },
    want() { for (let j = 0; j < cells.length; j++) { const q = cells[j]; if (q && q.good && q.gone <= 0 && q.t > .1) return { type: 'tap', x: gx + (j % cols) * cw + cw / 2, y: gy + Math.floor(j / cols) * ch + ch / 2, ready: true }; } return { type: 'tap', ready: false }; },
    stats: () => ({ hits, bads, missed }),
  };
  return g;
};

/* ====================================================================== the shell ====================================================================== */
let open = null;
function injectCss() { if (typeof document === 'undefined' || !document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/minigame.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/minigame.css' })); }
export function sheetRect() { return open ? open.sheet.getBoundingClientRect() : null; }
export function abort() { if (open) open.finish({ score: 0, stars: 0, quit: true, aborted: true }); }
export const isOpen = () => !!open;

export function play(def) {
  injectCss(); if (open) abort();
  return new Promise(resolve => {
    const lvl = Math.max(1, Math.min(10, def.level || 1)), d = (lvl - 1) / 9, theme = def.theme || {};
    const cv = el('canvas.mg-cv.pix', { width: W, height: H }), g2 = cv.getContext('2d'), cap = el('div.mg-cap'), binsEl = el('div.mg-bins'), pips = el('div.mg-pips'), hint = el('div.mg-hint', { text: def.hint || '' });
    const pauseBtn = el('button.mg-b', { 'aria-label': 'Pause', title: 'Pause', onclick: () => setPause(!paused) }, el('span', { text: 'II' })), autoBtn = def.noAuto ? null : el('button.mg-b.mg-auto', { title: 'Skip the game and take the usual result', onclick: () => finish({ score: -1, auto: true }) }, el('span', { text: def.autoLabel || 'Auto' })), quitBtn = el('button.mg-b.mg-x', { 'aria-label': 'Stop', title: 'Stop', onclick: () => finish({ score: 0, quit: true }) }, el('span', { text: 'x' }));
    const veil = el('div.mg-veil'), stage = el('div.mg-stage', null, cv, veil);
    const sheet = el('div.mg' + (innerWidth > innerHeight * 1.15 ? '.side' : ''), { role: 'dialog', 'aria-label': def.title || 'Mini-game' },
      el('div.mg-head', null, def.icon ? iconEl(def.icon, 2) : null, el('div.mg-tt', null, el('b', { text: def.title || '' }), el('small', { text: def.sub || `Level ${lvl}` })), autoBtn, pauseBtn, quitBtn), hint, stage, cap, binsEl, pips);
    root().append(sheet);
    let paused = false, done = false, raf = 0, last = performance.now(), t = 0, count = def.count === 0 ? 0 : .9, pipN = 0, held = false;
    const env = { W, H, lvl, d, def, theme, rnd: Math.random, icon: drawIcon,
      beat: (q, tag) => { try { def.onBeat && def.onBeat(q, tag); } catch (e) { /* cosmetic */ } },
      cap: s => { cap.textContent = s || ''; },
      prog: (i, n) => { if (n !== pipN) { pipN = n; pips.textContent = ''; for (let k = 0; k < Math.min(n, 24); k++) pips.append(el('i')); } const m = Math.min(n, 24), on = Math.round(i / n * m); [...pips.children].forEach((e, k) => e.classList.toggle('on', k < on)); },
      bins: (labels, onPick) => { binsEl.textContent = ''; const bs = labels.map((l, i) => el('button.mg-bin', { 'data-i': i, onclick: () => { if (!paused && count <= 0) onPick(i); } }, l)); binsEl.append(...bs); return (i, ok) => { const b = bs[i]; if (!b) return; b.classList.add(ok ? 'ok' : 'no'); setTimeout(() => b.classList.remove('ok', 'no'), 260); }; },
    };
    let game; try { game = def.kind === 'custom' ? def.custom(env) : (KINDS[def.kind] || KINDS.timing)(env); } catch (e) { console.error(e); sheet.remove(); return resolve({ score: -1, auto: true, stars: 0, error: true }); }
    const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); if (paused || done || count > 0) return; held = true; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ } const [x, y] = pt(e); game.down && game.down(x, y); });
    cv.addEventListener('pointermove', e => { if (paused || done || !held) return; const [x, y] = pt(e); game.move && game.move(x, y); });
    const upFn = e => { if (!held) return; held = false; if (done) return; const [x, y] = pt(e); game.up && game.up(x, y); };
    cv.addEventListener('pointerup', upFn); cv.addEventListener('pointercancel', upFn);
    function onKey(e) { if (done) return; if (e.key === 'Escape') { e.stopPropagation(); setPause(!paused); } else if ((e.key === ' ' || e.key === 'Enter') && !paused && count <= 0) { e.preventDefault(); e.stopPropagation(); const w = game.want ? game.want() : null; if (w && w.type === 'bin') { if (w.ready) binsEl.children[w.i] && binsEl.children[w.i].click(); } else if (w && w.type === 'hold') { /* hold games: keydown = press, keyup = release */ if (!held) { held = true; game.down && game.down(W / 2, H / 2); } } else game.down && game.down(w && w.x !== undefined ? w.x : W / 2, w && w.y !== undefined ? w.y : H / 2); } }
    function onKeyUp(e) { if ((e.key === ' ' || e.key === 'Enter') && held) { held = false; game.up && game.up(W / 2, H / 2); } }
    addEventListener('keydown', onKey, true); addEventListener('keyup', onKeyUp, true);
    function setPause(on) { if (done || paused === on) return; paused = on; if (on) { G.modal++; veil.textContent = ''; veil.append(el('b', { text: 'Paused' }), el('button.mg-big', { onclick: () => setPause(false) }, 'Resume'), autoBtn ? el('button.mg-big.alt', { onclick: () => finish({ score: -1, auto: true }) }, 'Auto-finish (usual result)') : null, el('button.mg-big.alt', { onclick: () => finish({ score: 0, quit: true }) }, 'Stop')); veil.classList.add('on'); } else { G.modal--; veil.classList.remove('on'); last = performance.now(); } }
    function frame(now) {
      if (done) return; raf = requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000); last = now; if (paused || G.modal > 0) return;   // another window (phone, a menu) is open: wait
      if (count > 0) { count -= dt; } else { t += dt; try { game.update(dt); } catch (e) { console.error(e); return finish({ score: -1, auto: true, error: true }); } }
      g2.fillStyle = theme.bg || '#f3e8cf'; g2.fillRect(0, 0, W, H); try { game.draw(g2); } catch (e) { console.error(e); return finish({ score: -1, auto: true, error: true }); }
      if (count > 0) { g2.globalAlpha = .55; g2.fillStyle = INK; g2.fillRect(0, 0, W, H); g2.globalAlpha = 1; drawIcon(g2, def.icon || 'ui.star', W / 2 - 24, H / 2 - 24 - Math.sin(count * 9) * 2, 3); }
      if (game.done) end();
    }
    function end() {
      const sc = clamp(game.score || 0), st = stars(sc); done = true; cancelAnimationFrame(raf);
      veil.textContent = ''; veil.append(el('div.mg-stars', null, [0, 1, 2].map(k => el('i' + (k < st ? '.on' : '')))), el('b', { text: (def.verdicts || ['Keep practising', 'Not bad', 'Nicely done', 'Perfect!'])[st] })); veil.classList.add('on', 'res');
      setTimeout(() => finish({ score: sc, stars: st, stats: game.stats ? game.stats() : {} }, true), def.resultMs || 950);
    }
    function finish(res, fromEnd) {
      if (open !== me) return; if (!fromEnd && done && !res.aborted) return; done = true; cancelAnimationFrame(raf); if (paused) { paused = false; G.modal--; }
      removeEventListener('keydown', onKey, true); removeEventListener('keyup', onKeyUp, true); open = null; MG.cur = null; sheet.classList.add('out'); setTimeout(() => sheet.remove(), 160);
      resolve(Object.assign({ score: 0, stars: 0, auto: false, quit: false, stats: {} }, res));
    }
    const me = open = { sheet, finish };
    MG.cur = { def, kind: def.kind, canvas: cv, bins: binsEl, auto: () => finish({ score: -1, auto: true }), quit: () => finish({ score: 0, quit: true }), pause: setPause,
      state: () => ({ t, counting: count > 0, done: done || !!game.done, score: game.score || 0, paused, want: !paused && count <= 0 && game.want ? game.want() : { ready: false }, stats: game.stats ? game.stats() : {} }),
      toClient: (x, y) => { const r = cv.getBoundingClientRect(); return { x: r.left + x / W * r.width, y: r.top + y / H * r.height }; } };
    raf = requestAnimationFrame(frame);
  });
}
export function init() { injectCss(); G.minigame = { play, abort, isOpen, sheetRect, stars, MG, kinds: Object.keys(KINDS) }; }
