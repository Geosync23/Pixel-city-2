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
// MORE KINDS (cooking + gym, 2026-11-16): 'hold' (hold to run it, let go before it overflows: the blender), 'cadence' (tap to keep a speed in the band while hills come and go: the bike),
//   'stir' (draw circles at a steady speed; keys / pad: hold and release), 'targets' (tap the spot that lights: the punching bag; o.spots), 'sequence' (place the pieces in the order on the
//   card; o.pieces [[label, colour, icon?]]), 'sweep' (tap as the blade crosses each mark: chopping), 'golden' (take it out in the golden window: oven, o.style 'fry' = fryer),
//   'stroke' (press at the catch, hold, let go at the finish: rowing). Filling to a line is the old 'aim' kind with o.mode 'pour'.
// ADDING A KIND FROM ANOTHER FILE (mini-games worker B: src/ui/minigame_b.js):
//   import { registerKind, draw, W, H } from './minigame.js';     registerKind('scrub', E => ({ update(dt) {}, draw(g) {}, down(x, y) {}, done: false, score: 0, want: () => ({ type: 'tap', ready: false }) }));
//   (or at run time: G.minigame.registerKind(name, impl) -> false when the name is taken; G.minigame.kinds lists them; G.minigame.draw = the pixel helpers R, box, disc, ring, line, icon, spark ...)
//   E is the env described above. Then play({ kind: 'scrub', ... }) works everywhere (skillplay GAMES, job plays, festivals). A game object may set `snap: true`: a gamepad Confirm press then
//   lands on want().x / y (for games where you tap a particular spot). want().type 'hold' makes Space / Enter a held key; 'tap' a tap at want().x / y; 'bin' presses the i-th bin button.
// THE "TURN THEM OFF" HINT: play() itself shows "You can turn mini-games off in Settings" the 2nd, 3rd and 4th time any kit game opens in a save (see offTip), so every caller gets it for free.
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
  const end = tt + .5, hits = [], look = LOOK[o.look] || null;   /* o.look: an own picture over the same rules (LOOK below); hits = the last taps / misses it animates */
  const g = { done: false, score: 0,
    update(dt) {
      now += dt; stepParts(parts, dt); for (let k = 0; k < L; k++) padFlash[k] = Math.max(0, padFlash[k] - dt);
      for (const nt of notes) if (nt.q < 0 && now - nt.t > .2) { nt.q = 0; judged++; combo = 0; E.prog(judged, n); E.beat(0, 'miss'); hits.push({ lane: nt.lane, q: 0, t: now, late: 1 }); }
      while (hits.length > 6) hits.shift();
      if (now >= end) { g.done = true; g.score = clamp(sum / n); }
    },
    down(x) {
      const lane = clamp(Math.floor((x - x0) / lw), 0, L - 1); let bestN = null, bd = .22;
      for (const nt of notes) if (nt.q < 0 && nt.lane === lane) { const dd = Math.abs(nt.t - now); if (dd < bd) { bd = dd; bestN = nt; } }
      padFlash[lane] = .18;
      if (!bestN) { padQ[lane] = 0; sum = Math.max(0, sum - .15); combo = 0; E.beat(0, 'miss'); hits.push({ lane, q: 0, t: now }); return; }
      const q = bd < .075 ? 1 : bd < .14 ? .75 : .45; bestN.q = q; sum += q; judged++; combo++; best = Math.max(best, combo); padQ[lane] = q; E.prog(judged, n);
      hits.push({ lane, q, t: now }); if (look) spark(parts, look.at ? look.at(lane, x0, lw) : x0 + lane * lw + lw / 2, hitY - 6, q >= 1 ? GOLD : '#fffaf0', q >= 1 ? 8 : 4);
      else spark(parts, x0 + lane * lw + lw / 2, hitY, q >= 1 ? GOLD : LANE_COL[lane], q >= 1 ? 8 : 4); E.beat(q, 'note'); if (combo > 2 && combo % 4 === 0) E.cap('Combo x' + combo);
    },
    draw(c) {
      if (look) { look.draw(c, { notes, now, T, L, x0, lw, hitY, topY, padFlash, padQ, hits, judged, n, combo, E }); drawParts(c, parts); return; }
      for (let k = 0; k < L; k++) { box(c, x0 + k * lw, topY, lw, H - topY - 4, k % 2 ? '#3a3644' : '#454050'); R(c, x0 + k * lw + 1, hitY - 6, lw - 2, 12, padFlash[k] > 0 ? (padQ[k] > 0 ? '#ffffff' : BAD) : LANE_COL[k] + '99'); R(c, x0 + k * lw + 1, hitY - 1, lw - 2, 2, '#fff8e0'); if (E.theme.icons && E.theme.icons[k]) drawIcon(c, E.theme.icons[k], x0 + k * lw + lw / 2 - 8, hitY - 8, 1, .9); }
      for (const nt of notes) { if (nt.q >= 0 && nt.q > 0) continue; const y = hitY - (nt.t - now) / T * (hitY - topY); if (y < topY - 8 || y > H) continue; const x = x0 + nt.lane * lw + 4, w = lw - 8; R(c, x, y - 5, w, 10, INK); R(c, x + 1, y - 4, w - 2, 8, nt.q === 0 ? '#77707f' : LANE_COL[nt.lane]); R(c, x + 2, y - 3, w - 4, 2, '#ffffff66'); }
      drawParts(c, parts);
    },
    want() { const nt = notes.find(q => q.q < 0); if (!nt) return { type: 'tap', ready: false }; return { type: 'tap', x: x0 + nt.lane * lw + lw / 2, y: hitY, ready: Math.abs(nt.t - now) < .04 }; },
    stats: () => ({ combo: best, notes: n }),
  };
  return g;
};

/* ---- rhythm LOOKS (owner msg 198): the same falling-note rules (lanes = the left / right half of the picture, a note = a cue that reaches the line at its beat),
   drawn as the thing you are doing. o.look 'knead' (ck_knead): hands come down to a ball of dough on a floured board; it squashes on a push (left), folds on a
   fold (right), slumps on a miss. o.look 'pingpong' (the rally): the table from your end, the net, a ball served from the far side to your backhand (left, the
   black rubber) or forehand (right, red); your paddle swings and the ball flies back. Nothing here changes timing or scoring. ---- */
function ell(g, cx, cy, rx, ry, c) { g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy); const n = Math.max(1, Math.round(ry)); for (let y = -n; y <= n; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); g.fillRect(cx - w, cy + y, w * 2 + 1, 1); } }
const lastHit = (S, lane) => { for (let i = S.hits.length - 1; i >= 0; i--) if (lane === undefined || S.hits[i].lane === lane) return S.hits[i]; return null; };
const easeBack = a => (a >= 1 ? 0 : Math.sin(a * Math.PI) * (1 - a * .6));                     // 0 -> 1 -> 0 with a soft tail
let FLOUR = null; const flour = () => FLOUR || (FLOUR = Array.from({ length: 70 }, (_, i) => { const r = Math.sin(i * 91.7) * 43758.5; const f = r - Math.floor(r), h = Math.sin(i * 12.9 + 4) * 9871.3; return [f, h - Math.floor(h), i % 3]; }));
const LOOK = {};
LOOK.knead = {
  at: lane => (lane ? 108 : 72),                                                                 // where the hand meets the dough
  draw(c, S) {
    const { now, T, hitY, topY } = S, cx = 90, cy = 84;
    R(c, 0, 0, W, H, '#8a5a2c'); for (let y = 0; y < H; y += 14) { R(c, 0, y, W, 1, '#6f4522'); R(c, 0, y + 1, W, 1, '#9a6a38'); }        // the worktop
    box(c, 6, 3, W - 12, H - 6, '#d9b27a'); R(c, 7, 4, W - 14, 2, '#e8c690'); for (let y = 12; y < H - 6; y += 9) R(c, 9 + (y * 7) % 20, y, 40 + (y * 13) % 50, 1, '#c99d62');   // the board
    for (const [fx, fy, k] of flour()) { const x = 10 + fx * (W - 20), y = 6 + fy * (H - 12), near = Math.hypot((x - cx) / 70, (y - cy) / 30) < 1; if (near || k === 0) R(c, x, y, k === 1 ? 2 : 1, 1, near ? '#fffaf0' : '#f6efdc'); }
    ell(c, cx, cy + 3, 46, 13, '#efe3c6'); ell(c, cx, cy + 3, 40, 10, '#f6efdc');                   // the floured patch the dough sits on
    for (let lane = 0; lane < 2; lane++) {                                                      // the two "lanes": faint flour trails down to a hand-print at the line
      const lx = S.x0 + lane * S.lw + S.lw / 2; for (let y = topY + 4; y < hitY - 10; y += 6) R(c, lx - 1, y, 2, 2, '#f6efdc88');
      const px = this.at(lane), f = S.padFlash[lane], col = f > 0 ? (S.padQ[lane] > 0 ? '#ffffff' : BAD) : '#fffaf0';
      ell(c, px + (lane ? 10 : -10), hitY - 1, 9, 4, f > 0 ? col : '#f6efdcaa'); R(c, px + (lane ? 6 : -14), hitY - 1, 8, 1, f > 0 ? col : '#c99d62');
    }
    /* the dough: a push (left) squashes it flat and long, a fold (right) rolls it up taller with a crease, a miss leaves it slumped and sticky */
    const h = lastHit(S), a = h ? (now - h.t) / .42 : 1, e = h ? easeBack(a) : 0, smooth = Math.min(1, S.judged / Math.max(1, S.n));
    let rx = 25, ry = 14, dx = 0, crease = 0;
    if (h && a < 1) { if (h.q <= 0) { rx += 5 * e; ry -= 3 * e; } else if (h.lane === 0) { rx += 9 * e; ry -= 5 * e; dx = 4 * e; } else { rx -= 4 * e; ry += 3 * e; crease = e; } }
    const bob = Math.sin(now * 3) * .4, y0 = cy - ry * .35 + bob;
    ell(c, cx + dx, cy + 4, rx + 2, 4, '#b8925c');                                              // shadow on the board
    ell(c, cx + dx, y0, rx + 1, ry + 1, INK); ell(c, cx + dx, y0, rx, ry, h && a < 1 && h.q <= 0 ? '#e9cf9c' : '#f3dcae');
    ell(c, cx + dx, y0 + ry * .35, rx - 2, ry * .55, '#e2c38e'); ell(c, cx + dx - rx * .25, y0 - ry * .35, rx * .45, ry * .35, '#fff1cf');   // shade + highlight
    if (smooth < .8) for (let k = 0; k < 4; k++) { const lx = cx + dx + Math.cos(k * 2.1 + 1) * rx * .55, ly = y0 + Math.sin(k * 2.1 + 1) * ry * .45; R(c, lx, ly, 2, 1, '#d4b07a'); }   // lumps: gone as it comes together
    if (crease > .05) { line(c, cx - rx * .6, y0 - 1, cx + rx * .6, y0 - 1 - 3 * crease, '#c9a46e'); ell(c, cx + rx * .15, y0 - ry * .5, rx * .5, ry * .3 * crease + 1, '#fbe6bc'); }   // the folded flap
    if (h && h.q > 0 && h.lane === 0 && a < .6) for (let k = 0; k < 3; k++) R(c, cx + dx + rx - 2 + k * 3, y0 - 2 + k * 2, 2, 1, '#ffffff');   // pushed: a little flour flies off the end
    if (h && h.q <= 0 && a < .8) { c.globalAlpha = .7 * (1 - a); ell(c, cx, y0 - ry - 3, 10 + a * 10, 4 + a * 3, '#ffffff'); c.globalAlpha = 1; }                  // a miss: a puff of flour
    /* the hands: each cue is a floury hand coming down its side; at the line it is on the dough */
    c.save(); c.beginPath(); c.rect(7, 4, W - 14, H - 8); c.clip();                                       // hands only on the board
    for (const nt of S.notes) {
      if (nt.q > 0) continue; const u = (nt.t - now) / T; if (u > 1.05 || u < -.25) continue; const y = hitY - u * (hitY - topY);
      const lx = S.x0 + nt.lane * S.lw + S.lw / 2, tx = this.at(nt.lane) + (nt.lane ? 10 : -10), x = lx + (tx - lx) * Math.max(0, Math.min(1, 1 - u * 1.4));
      hand(c, x, y - 4, nt.lane, nt.q === 0);
    }
    const hh = lastHit(S); if (hh && hh.q > 0 && now - hh.t < .22) hand(c, this.at(hh.lane) + (hh.lane ? 10 : -10) + (hh.lane ? -3 : 3), hitY - 6, hh.lane, false, true);   // the hand at work
    c.restore();
  },
};
/** a hand seen from above, fingers pointing down the board: lane 0 = the left hand (pink sleeve, flat: push), lane 1 = the right (blue sleeve, curled: fold) */
function hand(c, x, y, lane, grey, press) {
  x = Math.round(x); y = Math.round(y); const skin = grey ? '#a8a2ad' : '#f0c39a', lit = grey ? '#bdb7c2' : '#f8d6b4', dark = grey ? '#77707f' : '#d39a6e', cuff = grey ? '#77707f' : LANE_COL[lane], inner = lane ? -1 : 1;
  const rr = (x0, y0, w, h, col) => { R(c, x0 + 1, y0, w - 2, h, INK); R(c, x0, y0 + 1, w, h - 2, INK); R(c, x0 + 1, y0 + 1, w - 2, h - 2, col); };   // a rounded block with an ink edge
  rr(x - 8, y - 13, 16, 6, cuff); R(c, x - 7, y - 12, 14, 1, '#ffffff66'); R(c, x - 7, y - 9, 14, 1, '#00000022');                                    // sleeve cuff
  const fl = press ? 3 : lane ? 3 : 6;                                                                                                                  // finger length: flat (push) or curled under (fold)
  for (let k = 0; k < 4; k++) { const fx = x - 7 + k * 3 + (k > 1 ? 1 : 0); rr(fx, y + 1, 4, fl + 2, lane && !press ? dark : skin); if (!grey) R(c, fx + 1, y + fl + 1, 2, 1, '#fffaf0'); }   // fingers, floury tips
  rr(x - 8, y - 8, 16, 11, skin); R(c, x - 6, y - 7, 9, 2, lit); R(c, x - 7, y + 1, 14, 1, dark);                                                    // the back of the hand
  if (lane && !press) for (let k = 0; k < 4; k++) R(c, x - 6 + k * 3 + (k > 1 ? 1 : 0), y + 1, 2, 1, lit);                                            // knuckles of the curled hand
  rr(x + inner * 7 - 2, y - 6, 5, 7, skin); R(c, x + inner * 7 - 1, y - 5, 2, 2, lit);                                                                  // thumb on the side towards the dough
  if (!grey) { R(c, x - 4, y - 4, 1, 1, '#fffaf0'); R(c, x + 3, y - 2, 1, 1, '#fffaf0'); }                                                            // flour on the back of the hand
}
LOOK.pingpong = {
  at: lane => (lane ? 132 : 48),
  draw(c, S) {
    const { now, T, hitY } = S, FY = 12, NY = 96, half = y => 38 + (y - FY) / (NY - FY) * 44, tx = (y, u) => 90 + (u - .5) * 2 * half(y);   // table: far edge y 12, near edge y 96
    R(c, 0, 0, W, H, '#4a4660'); R(c, 0, 0, W, 22, '#3b3850'); R(c, 0, 22, W, 1, '#2a2733');                                   // the room behind
    R(c, 0, 58, W, H - 58, '#6b5a4a'); for (let y = 62; y < H; y += 8) R(c, 0, y, W, 1, '#5d4e40');                                           // floor
    for (let y = FY; y <= NY; y++) { const hw = half(y); R(c, 90 - hw - 1, y, hw * 2 + 2, 1, INK); R(c, 90 - hw, y, hw * 2, 1, y === FY || y === NY ? '#ffffff' : '#2f7f5f'); R(c, 90 - hw, y, 1, 1, '#ffffff'); R(c, 90 + hw - 1, y, 1, 1, '#ffffff'); }
    R(c, 90, FY, 1, NY - FY, '#ffffffaa'); R(c, 6, NY + 1, W - 12, 3, INK); R(c, 7, NY + 1, W - 14, 2, '#245f47');                         // centre line, front edge
    R(c, 14, NY + 4, 4, 8, INK); R(c, W - 18, NY + 4, 4, 8, INK);                                                                         // legs
    const NETY = 42, nhw = half(NETY);                                                                                                    // the net
    R(c, 90 - nhw - 3, NETY - 8, 2, 9, INK); R(c, 90 + nhw + 1, NETY - 8, 2, 9, INK); R(c, 90 - nhw - 1, NETY - 7, nhw * 2 + 2, 7, '#2a273399');
    for (let x = 90 - nhw; x < 90 + nhw; x += 3) R(c, x, NETY - 7, 1, 7, '#d9d9e055'); for (let y = NETY - 6; y < NETY; y += 2) R(c, 90 - nhw, y, nhw * 2, 1, '#d9d9e033'); R(c, 90 - nhw - 1, NETY - 8, nhw * 2 + 2, 1, '#ffffff');
    /* the balls: the next one is served when your return of the one before has crossed (never shown for less than .38 s), lands on your half, comes up to the line */
    let prevT = -9, opp = 90, served = 0;
    for (let i = 0; i < S.notes.length; i++) {
      const nt = S.notes[i], start = Math.min(nt.t - .38, Math.max(nt.t - T, prevT + .22)); prevT = nt.t;   // served once your return has reached the far end
      if (nt.q > 0 || now < start || now > nt.t + .25) continue; const u = Math.max(0, (now - start) / (nt.t - start)), side = nt.lane ? .78 : .22;
      if (u <= 1 && !served) { opp = tx(FY, .5 + (side - .5) * .3); served = 1; }
      const gy = FY + 4 + (hitY - FY - 4) * Math.min(1.3, u), gx = tx(Math.min(NY, gy), .5 + (side - .5) * Math.min(1.3, u));
      const B = .62, z = u < B ? Math.sin(u / B * Math.PI) * 14 + (1 - u / B) * 4 : Math.sin((u - B) / (1 - B) * Math.PI / 2) * 9;   // over the net, one bounce on your side, up to the bat
      if (u < 1.05) ell(c, gx, gy, 3, 1, '#1e4a38'); const r = u > .55 ? 3 : u > .2 ? 2 : 1.5;
      if (u > .45 && u < 1) { c.globalAlpha = .35; ring(c, tx(Math.min(NY, FY + 4 + (hitY - FY - 4) * B), .5 + (side - .5) * B), FY + 4 + (hitY - FY - 4) * B, 3, '#ffffff'); c.globalAlpha = 1; }
      disc(c, gx, gy - z, Math.ceil(r) + 1, INK); disc(c, gx, gy - z, Math.ceil(r), nt.q === 0 ? '#c9c2b8' : '#fff4dc'); R(c, gx - 1, gy - z - 1, 1, 1, '#ffffff');
    }
    R(c, opp - 3, FY - 9, 7, 6, INK); R(c, opp - 2, FY - 8, 5, 4, '#d8342e'); R(c, opp, FY - 3, 1, 3, '#b8794a');                     // the other player's bat at the far end
    /* the return: a good hit flies back over the net */
    const h = lastHit(S);
    if (h && h.q > 0 && now - h.t < .22) { const u = (now - h.t) / .22, sx = this.at(h.lane), gy = hitY - (hitY - FY - 4) * u, gx = sx + (90 + (h.lane ? -14 : 14) - sx) * u, z = Math.sin(u * Math.PI) * 12 + 6 * (1 - u);
      disc(c, gx, gy - z, 3, INK); disc(c, gx, gy - z, 2, '#fff4dc'); }
    /* the hit line at your end and your bat: it swings to the side you tap (black rubber = backhand on the left, red = forehand on the right) */
    for (let lane = 0; lane < 2; lane++) { const f = S.padFlash[lane]; R(c, S.x0 + lane * S.lw + 4, hitY + 2, S.lw - 8, 1, f > 0 ? (S.padQ[lane] > 0 ? '#ffffff' : BAD) : '#ffffff44'); }
    const nx = S.notes.find(q => q.q < 0), want = nx ? nx.lane : null, idle = h && now - h.t < .5 ? h.lane : want;
    const bx = idle === null ? 90 : this.at(idle), sw = h && now - h.t < .16 ? 1 - (now - h.t) / .16 : 0, by = hitY + 6 - sw * 6, lane = idle === null ? 1 : idle;
    const dir = lane ? 1 : -1, rub = lane ? '#d8342e' : '#2a2733';
    line(c, bx - dir * 2, by + 3, bx - dir * 7, by + 12, INK, 4); line(c, bx - dir * 2, by + 3, bx - dir * 7, by + 12, '#b8794a', 2);  // handle
    disc(c, bx, by - 1, 7, INK); disc(c, bx, by - 1, 6, rub); R(c, bx - 3, by - 5, 3, 2, lane ? '#ff8a7a' : '#57527a');               // rubber
    if (sw > 0) { c.globalAlpha = .5 * sw; line(c, bx + dir * 9, by + 8, bx + dir * 2, by - 10, '#ffffff', 1); c.globalAlpha = 1; }
  },
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

/* ====================================================================== kinds added for cooking + the gym (owner msgs 158, 162-164) ======================================================================
   All are one-thumb. Pad / keys: 'hold', 'stroke', 'stir' = Confirm / Space HELD (stir also follows the stick or a finger drawn in circles); 'cadence', 'sweep', 'golden' = Confirm / Space pressed;
   'targets', 'sequence' = Confirm / Space hits the lit one (game.snap), or point at it. */

/* ---- hold: hold to run the machine, let go before the froth reaches the lid; done when the bar is full (o.need secs of holding, o.rise) ---- */
KINDS.hold = E => {
  const o = E.def.o || {}, need = o.need || 6.5, rise = (o.rise || .62) + .4 * E.d, T = o.secs || 24, parts = [], col = E.theme.color || '#e0527a', col2 = E.theme.color2 || '#fff0f4', bits = Array.from({ length: 9 }, (_, i) => ({ a: i * 2.3, r: 4 + (i * 7) % 11, s: 2 + i % 3 }));
  let sm = 0, fr = .15, hold = false, t = 0, spills = 0, cool = 0, spin = 0, lastBeat = 0;
  const g = { done: false, score: 0,
    update(dt) {
      t += dt; stepParts(parts, dt); if (cool > 0) { cool -= dt; hold = false; }
      if (hold) { sm = clamp(sm + dt / need); fr += rise * dt; spin += dt * 14; if (t - lastBeat > .5) { lastBeat = t; E.beat(.6, 'whirr'); } } else fr = Math.max(.12, fr - 1.1 * dt);
      if (fr >= 1) { spills++; fr = .35; sm = Math.max(0, sm - .1); cool = .8; spark(parts, 90, 14, col, 14); E.beat(0, 'spill'); E.cap('Over the top! Let go sooner.'); }
      E.prog(Math.round(sm * 10), 10);
      if (sm >= 1) { g.done = true; g.score = clamp(1.02 - .2 * spills - Math.max(0, t - need * 2.1) * .05); spark(parts, 90, 50, GOLD, 12); E.beat(1, 'done'); } else if (t >= T) { g.done = true; g.score = sm * .6; }
    },
    down() { if (cool <= 0) hold = true; }, up() { hold = false; },
    draw(c) {
      const jx = 66, jy = 12, jw = 48, jh = 70; box(c, 8, 4, W - 16, H - 10, E.theme.paper || '#dfeef5');
      R(c, jx - 8, jy + jh, jw + 16, 14, INK); R(c, jx - 7, jy + jh + 1, jw + 14, 12, '#55505f'); disc(c, jx + jw / 2, jy + jh + 7, 3, hold ? GOOD : '#d9d9e0');   // base + button
      R(c, jx - 2, jy, 2, jh, INK); R(c, jx + jw, jy, 2, jh, INK); R(c, jx, jy, jw, jh, '#ffffff'); R(c, jx + jw + 2, jy + 16, 8, 3, INK); R(c, jx + jw + 8, jy + 16, 3, 30, INK);                    // jar + handle
      const top = jy + jh - fr * (jh - 6), lq = jy + jh - Math.min(fr, .55 + .1 * Math.sin(spin)) * (jh - 6); R(c, jx, top, jw, jy + jh - top, col2); R(c, jx, lq, jw, jy + jh - lq, col);
      for (const b of bits) { if (b.s / 4 < sm * 1.1) continue; const a = b.a + spin * (hold ? 1 : .15), x = jx + jw / 2 + Math.cos(a) * b.r * 1.6, y = Math.min(jy + jh - 4, lq + 6 + b.r * 1.4 + Math.sin(a) * 4); R(c, x - 2, y - 2, b.s + 2, b.s + 2, E.theme.bit || mixCol(col)); }
      R(c, jx, jy, jw, 6, fr > .8 ? BAD : '#f2c23066'); R(c, jx - 4, jy - 4, jw + 8, 4, INK);                                                                                                       // danger band + lid
      if (cool > 0) for (let k = 0; k < 5; k++) R(c, jx - 6 + k * 14, jy - 8 - (k % 2) * 4, 4, 4, col);
      drawIcon(c, E.theme.icon, 18, 18, 2); box(c, 136, 12, 12, 70, SKY); R(c, 137, 13 + 68 * (1 - sm), 10, 68 * sm, GOLD); drawIcon(c, 'ui.star', 134, 84, 1, sm >= 1 ? 1 : .4);
      drawParts(c, parts);
    },
    want: () => ({ type: 'hold', on: cool <= 0 && fr < (hold ? .74 : .3), ready: true }),
    stats: () => ({ spills, secs: Math.round(t) }),
  };
  return g;
};
const mixCol = c => { const n = parseInt(c.slice(1, 7), 16), f = v => Math.max(0, Math.round(v * .72)); return '#' + [n >> 16, n >> 8 & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join(''); };

/* ---- cadence: every tap is a push; keep the speed in the green band while the hills come and go ---- */
KINDS.cadence = E => {
  const o = E.def.o || {}, hw = (o.zone || .16) - .06 * E.d, T = o.secs || 26, need = o.need || 11, parts = [], ph = Math.random() * 6;
  let v = .2, t = 0, prog = 0, inz = false, c0 = .5, hill = 0, crank = 0, lastBeat = 0;
  const g = { done: false, score: 0,
    update(dt) {
      t += dt; stepParts(parts, dt); hill = .5 + .5 * Math.sin(t * (.5 + .25 * E.d) + ph); v = clamp(v - (.16 + .16 * hill + .08 * E.d) * dt * (.4 + v)); crank += v * dt * 16;
      c0 = clamp(.52 + .16 * Math.sin(t * .8 + ph * 2), hw + .04, 1 - hw - .04); inz = Math.abs(v - c0) <= hw;
      prog = clamp(prog + (inz ? dt / need : -dt / 30)); if (inz && t - lastBeat > .9) { lastBeat = t; E.beat(.7, 'hold'); } E.prog(Math.round(prog * 10), 10);
      if (prog >= 1) { g.done = true; g.score = clamp(.8 + .5 * (1 - t / T)); spark(parts, W / 2, 40, GOLD, 14); E.beat(1, 'land'); } else if (t >= T) { g.done = true; g.score = prog * .75; }
    },
    down() { v = clamp(v + .1); },
    draw(c) {
      const gx = 12, gy = 8, gh = 92; box(c, gx - 2, gy - 2, 18, gh + 4, SKY); R(c, gx, gy + (1 - c0 - hw) * gh, 14, hw * 2 * gh, inz ? '#8fe07a' : GOOD); R(c, gx - 4, gy + (1 - v) * gh - 2, 22, 5, INK); R(c, gx - 3, gy + (1 - v) * gh - 1, 20, 3, inz ? GOLD : BAD);
      box(c, 40, 6, W - 48, 80, E.theme.paper || '#bfe3f2');
      if (E.def.scene) E.def.scene(c, 41, 7, W - 50, 78, { v, c0, inz, prog, t, hill, crank });
      else { for (let x = 0; x < W - 50; x += 2) { const hh = 14 + 16 * (.5 + .5 * Math.sin((t * (.5 + .25 * E.d) + ph) + (x - 60) * .05)); R(c, 41 + x, 85 - hh, 2, hh, x % 12 < 6 ? '#6fae7a' : '#62a06e'); }
        const bx = 41 + 60, by = 85 - (14 + 16 * hill) - 9; ring(c, bx - 9, by + 3, 6, INK, 2); ring(c, bx + 9, by + 3, 6, INK, 2); line(c, bx - 9, by + 3, bx, by - 4, col1(E), 2); line(c, bx, by - 4, bx + 9, by + 3, col1(E), 2); line(c, bx, by + 3, bx + Math.cos(crank) * 4, by + 3 + Math.sin(crank) * 4, INK, 2); disc(c, bx - 1, by - 12, 3, INK); R(c, bx - 3, by - 9, 5, 6, col1(E)); }
      box(c, 40, 90, W - 48, 10, '#e9dcc0'); R(c, 41, 91, (W - 50) * prog, 8, GOLD); R(c, 41 + (W - 50) * clamp(t / T), 89, 1, 12, BAD);
      drawParts(c, parts);
    },
    want: () => ({ type: 'tap', x: W / 2, y: 50, ready: v < c0 - hw * .1 }),
    stats: () => ({ secs: Math.round(t), prog }),
  };
  return g;
};
const col1 = E => E.theme.color || '#e0527a';

/* ---- stir: draw circles round the pot (or hold Space / Confirm) to keep the spoon speed in the band: too slow sticks, too fast splashes ---- */
KINDS.stir = E => {
  const o = E.def.o || {}, hw = (o.zone || .17) - .06 * E.d, c0 = .52, T = o.secs || 26, need = o.need || 10, parts = [], cx = W / 2, cy = 50, rad = 32, col = E.theme.color || '#d9a441';
  let w = 0, ang = 0, t = 0, prog = 0, stuck = 0, splash = 0, inz = false, down = false, auto = false, la = null, moved = 0, lastBeat = 0, splT = 0;
  const g = { done: false, score: 0, snap: true /* a pad's Confirm lands on the middle of the pot = hold-to-stir */,
    update(dt) {
      t += dt; stepParts(parts, dt); splT = Math.max(0, splT - dt);
      if (auto) w = clamp(w + (down ? .62 : -.5) * dt, 0, 1.2); else { const inst = clamp(moved / dt / 9.5, 0, 1.3); w += (inst - w) * Math.min(1, dt * 5); moved = 0; }
      ang += w * dt * 9; inz = Math.abs(w - c0) <= hw;
      if (w < c0 - hw) { if (t > 1.6) stuck = clamp(stuck + dt * .11 * (1 + E.d)); } else if (w > c0 + hw + .08 && splT <= 0) { splash++; splT = .7; spark(parts, cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad * .6, col, 8); E.beat(0, 'splash'); E.cap('Easy! It is splashing.'); }
      prog = clamp(prog + (inz ? dt / need : 0)); if (inz && t - lastBeat > .8) { lastBeat = t; E.beat(.7, 'stir'); E.cap(''); } E.prog(Math.round(prog * 10), 10);
      if (prog >= 1) { g.done = true; g.score = clamp(1.04 - stuck * .9 - splash * .07 - Math.max(0, t - need * 1.7) * .03); spark(parts, cx, cy, GOLD, 12); E.beat(1, 'done'); } else if (t >= T) { g.done = true; g.score = clamp(prog * .7 - stuck * .3); }
    },
    down(x, y) { down = true; auto = Math.hypot(x - cx, y - cy) < 7; la = auto ? null : Math.atan2(y - cy, x - cx); },
    move(x, y) { if (!down || auto || Math.hypot(x - cx, y - cy) < 6) return; const a = Math.atan2(y - cy, x - cx); if (la !== null) { let d = a - la; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; moved += Math.abs(d); } la = a; },
    up() { down = false; la = null; },
    draw(c) {
      const gx = 12, gy = 8, gh = 92; box(c, gx - 2, gy - 2, 18, gh + 4, SKY); R(c, gx, gy + (1 - (c0 + hw) / 1.2) * gh, 14, hw * 2 / 1.2 * gh, inz ? '#8fe07a' : GOOD); const my = gy + (1 - Math.min(1.2, w) / 1.2) * gh; R(c, gx - 4, my - 2, 22, 5, INK); R(c, gx - 3, my - 1, 20, 3, inz ? GOLD : BAD);
      box(c, 36, 4, W - 44, 92, E.theme.paper || '#e9dcc0'); R(c, cx - rad - 16, cy - 3, 12, 6, INK); R(c, cx + rad + 4, cy - 3, 12, 6, INK);                                                           // pot handles
      disc(c, cx, cy, rad + 4, INK); disc(c, cx, cy, rad + 3, '#77707f'); disc(c, cx, cy, rad, mixCol(col)); disc(c, cx, cy, rad - Math.round(stuck * 10) - 1, col);
      for (let k = 0; k < 3; k++) { const a = ang - k * .5 - .4, r = rad * (.45 + k * .14); R(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3, 2, '#ffffff77'); }
      if (E.theme.icon) drawIcon(c, E.theme.icon, cx - 8 + Math.cos(ang + 2) * 9, cy - 8 + Math.sin(ang + 2) * 9, 1, .9);
      const sx = cx + Math.cos(ang) * (rad - 8), sy = cy + Math.sin(ang) * (rad - 8); line(c, sx, sy, sx + 16, sy - 22, INK, 4); line(c, sx, sy, sx + 16, sy - 22, '#b8794a', 2); disc(c, sx, sy, 4, INK); disc(c, sx, sy, 3, '#b8794a');
      if (!down && w < .1 && t % 1 < .6) { ring(c, cx, cy, rad - 12, '#ffffff', 2); R(c, cx + rad - 12, cy - 5, 5, 5, '#ffffff'); }                                                                 // "circle here"
      box(c, 150, 12, 12, 70, SKY); R(c, 151, 13 + 68 * (1 - prog), 10, 68 * prog, GOLD); drawIcon(c, 'ui.star', 148, 84, 1, prog >= 1 ? 1 : .4);
      drawParts(c, parts);
    },
    want: () => ({ type: 'hold', on: w < c0 - .02, ready: true, x: cx, y: cy }),
    stats: () => ({ stuck: +stuck.toFixed(2), splash, secs: Math.round(t) }),
  };
  return g;
};

/* ---- targets: spots light up one at a time; tap each before it fades (o.spots [[x, y]], o.n, o.life) ---- */
KINDS.targets = E => {
  const o = E.def.o || {}, spots = o.spots || [[90, 22], [74, 42], [106, 42], [82, 64], [100, 66]], n = Math.round((o.n || 12) + 6 * E.d), life = (o.life || 1.25) - .5 * E.d, parts = [], got = [], rr = o.r || 11;
  let i = 0, cur = -1, age = 0, gap = .5, hitT = 0, hitAt = -1, combo = 0, best = 0; E.prog(0, n);
  const g = { done: false, score: 0, snap: true,
    update(dt) {
      stepParts(parts, dt); hitT = Math.max(0, hitT - dt);
      if (cur < 0) { gap -= dt; if (gap <= 0) { if (i >= n) { g.done = true; g.score = got.reduce((a, b) => a + b, 0) / n; return; } let k = Math.floor(Math.random() * spots.length); if (k === hitAt) k = (k + 1) % spots.length; cur = k; age = 0; } return; }
      age += dt; if (age >= life) { got.push(0); i++; E.prog(i, n); cur = -1; gap = .25; combo = 0; E.beat(0, 'miss'); }
    },
    down(x, y) {
      if (cur < 0 || g.done) return; const s = spots[cur]; if (Math.hypot(x - s[0], y - s[1]) > rr + 5) { combo = 0; return; }
      const q = age < life * .45 ? 1 : age < life * .75 ? .8 : .55; got.push(q); i++; E.prog(i, n); hitAt = cur; hitT = .22; cur = -1; gap = .22 + Math.random() * .3 * (1 - E.d); combo++; best = Math.max(best, combo);
      spark(parts, s[0], s[1], q >= 1 ? GOLD : '#ffffff', q >= 1 ? 9 : 5); E.beat(q, 'hit'); if (combo > 2 && combo % 4 === 0) E.cap('Combo x' + combo);
    },
    draw(c) {
      box(c, 8, 4, W - 16, H - 10, E.theme.paper || '#d8d4c8'); const sw = hitT > 0 ? Math.round(Math.sin(hitT * 40) * 2) : 0;
      if (E.def.scene) E.def.scene(c, 9, 5, W - 18, H - 12, { hitT, hitAt, cur, spots });
      else { R(c, 89, 5, 2, 8, INK); R(c, 70 + sw, 12, 40, 70, INK); R(c, 71 + sw, 13, 38, 68, E.theme.color || '#c0392b'); R(c, 71 + sw, 13, 6, 68, '#ffffff33'); R(c, 71 + sw, 30, 38, 2, '#2a273355'); R(c, 71 + sw, 60, 38, 2, '#2a273355'); R(c, 60, 96, 60, 3, '#2a273333'); }
      spots.forEach((s, k) => { const on = k === cur, x = s[0] + (E.def.scene ? 0 : sw), y = s[1]; if (on) { const u = clamp(1 - age / life); disc(c, x, y, rr, INK); disc(c, x, y, rr - 1, GOLD); disc(c, x, y, Math.max(1, Math.round((rr - 3) * u)), '#fff8b0'); ring(c, x, y, rr + 2 + Math.round((1 - u) * 3), '#ffffff', 1); } else if (k === hitAt && hitT > 0) { disc(c, x, y, rr, '#ffffff'); } else ring(c, x, y, rr - 3, '#2a273344', 1); });
      drawParts(c, parts);
    },
    want: () => (cur >= 0 ? { type: 'tap', x: spots[cur][0], y: spots[cur][1], ready: age > .1 } : { type: 'tap', ready: false }),
    stats: () => ({ hits: got.filter(v => v > 0).length, of: n, combo: best }),
  };
  return g;
};

/* ---- sequence: the card shows the stack; tap the pieces on the tray in that order, bottom first (o.pieces [[label, colour, icon?]], o.rounds) ---- */
KINDS.sequence = E => {
  const o = E.def.o || {}, pool = o.pieces || [['Bread', '#e0b46a'], ['Lettuce', '#5fb84f'], ['Tomato', '#d8342e'], ['Cheese', '#f2c230'], ['Ham', '#e89aa0'], ['Bread', '#e0b46a']], rounds = o.rounds || 2, k = Math.min(pool.length, (o.len || 4) + (E.lvl >= 5 ? 1 : 0)), tl = (o.secs || 11) - 4 * E.d, parts = [], got = [];
  let r = 0, want = [], tray = [], placed = 0, wrong = 0, t = 0, wait = .2, shake = 0, shakeI = -1;
  const tw = Math.min(30, Math.floor((W - 20) / k)), tx = j => (W - k * tw) / 2 + j * tw;
  function deal() { const mid = pool.slice(1, -1).sort(() => Math.random() - .5).slice(0, k - 2); want = [pool[0], ...mid, pool[pool.length - 1]].slice(0, k); tray = want.map((p, j) => ({ p, j, used: false })).sort(() => Math.random() - .5); placed = 0; wrong = 0; t = 0; E.cap('Next: ' + want[0][0]); }
  deal(); E.prog(0, rounds);
  const g = { done: false, score: 0, snap: true,
    update(dt) {
      stepParts(parts, dt); shake = Math.max(0, shake - dt);
      if (wait > 0) { wait -= dt; if (wait <= 0 && placed >= k) { r++; E.prog(r, rounds); if (r >= rounds) { g.done = true; g.score = got.reduce((a, b) => a + b, 0) / rounds; E.cap(''); } else deal(); } return; }
      t += dt; if (t >= tl) { got.push(placed / k * .5); placed = k; wait = .6; E.beat(0, 'miss'); E.cap('Too slow'); }
    },
    down(x, y) {
      if (wait > 0 || g.done || y < 78) return; const j = Math.floor((x - tx(0)) / tw); if (j < 0 || j >= k) return; const it = tray[j]; if (it.used) return;
      if (it.p[0] === want[placed][0] && it.p[1] === want[placed][1]) { it.used = true; placed++; spark(parts, 100, 70 - placed * 8, it.p[1], 5); E.beat(.8, 'place'); if (placed >= k) { got.push(clamp((1 - wrong * .22) * (.75 + .25 * clamp(1 - t / tl)))); wait = .7; E.cap('Done!'); E.beat(1, 'round'); } else E.cap('Next: ' + want[placed][0]); }
      else { wrong++; shake = .3; shakeI = j; E.beat(0, 'miss'); }
    },
    draw(c) {
      box(c, 8, 4, W - 16, 70, E.theme.paper || '#fffdf4'); box(c, 14, 8, 44, 62, '#fff4dc'); R(c, 18, 11, 36, 2, '#2a273355');                               // the order card
      for (let j = 0; j < k; j++) { const y = 62 - j * 9, p = want[j]; R(c, 20, y, 32, 7, INK); R(c, 21, y + 1, 30, 5, j < placed ? '#cfc6b4' : p[1]); if (j === placed && wait <= 0 && Math.floor(t * 4) % 2 === 0) { R(c, 16, y + 2, 3, 3, BAD); R(c, 53, y + 2, 3, 3, BAD); } }
      R(c, 76, 66, 56, 4, INK); R(c, 78, 64, 52, 3, '#dfeef5');                                                                                         // the plate, and what is on it
      for (let j = 0; j < placed && j < k; j++) { const y = 56 - j * 8, p = want[j]; R(c, 82, y, 44, 8, INK); R(c, 83, y + 1, 42, 6, p[1]); R(c, 84, y + 1, 40, 1, '#ffffff66'); if (p[2]) drawIcon(c, p[2], 96, y - 5, 1); }
      if (E.theme.icon) drawIcon(c, E.theme.icon, 140, 12, 2, placed >= k ? 1 : .35);
      box(c, 136, 52, 30, 8, '#e9dcc0'); if (wait <= 0) R(c, 137, 53, 28 * clamp(1 - t / tl), 6, t / tl > .7 ? BAD : GOLD);
      for (let j = 0; j < k; j++) { const it = tray[j], x = tx(j) + (shake > 0 && shakeI === j ? Math.round(Math.sin(shake * 60) * 2) : 0); box(c, x + 1, 80, tw - 2, 26, it.used ? '#cfc6b4' : '#fffdf4'); if (it.used) continue; R(c, x + 4, 86, tw - 8, 14, INK); R(c, x + 5, 87, tw - 10, 12, it.p[1]); R(c, x + 5, 87, tw - 10, 2, '#ffffff66'); if (it.p[2]) drawIcon(c, it.p[2], x + tw / 2 - 8, 85, 1); }
      drawParts(c, parts);
    },
    want() { if (wait > 0 || g.done || placed >= k) return { type: 'tap', ready: false }; const j = tray.findIndex(it => !it.used && it.p[0] === want[placed][0] && it.p[1] === want[placed][1]); return { type: 'tap', x: tx(j) + tw / 2, y: 93, ready: true }; },
    stats: () => ({ rounds, wrong }),
  };
  return g;
};

/* ---- sweep: the blade runs along the thing at an even pace; tap as it crosses each mark (o.rounds, o.marks) ---- */
KINDS.sweep = E => {
  const o = E.def.o || {}, rounds = o.rounds || 3, parts = [], got = [], x0 = 26, x1 = 154, cols = E.theme.pal || [E.theme.color || '#f08a2c', '#5fb84f', '#d8342e'];
  let r = 0, marks = [], x = 0, spd = 0, wait = .3, chop = 0, bad = 0, sum = 0, perfect = 0;
  function gen() { const m = (o.marks || 5) + Math.min(3, r) + (E.lvl >= 6 ? 1 : 0); marks = []; for (let j = 1; j <= m; j++) marks.push({ x: x0 + (x1 - x0) * j / (m + 1), q: -1 }); x = x0 - 14; spd = (o.speed || 40) * (1 + .5 * E.d) * (1 + .12 * r); sum = 0; }
  gen(); E.prog(0, rounds);
  const g = { done: false, score: 0,
    update(dt) {
      stepParts(parts, dt); chop = Math.max(0, chop - dt); if (wait > 0) { wait -= dt; return; }
      x += spd * dt; for (const m of marks) if (m.q < 0 && x - m.x > 9) { m.q = 0; E.beat(0, 'miss'); }
      if (x > x1 + 10) { got.push(clamp((sum - bad * .3) / marks.length)); bad = 0; r++; E.prog(r, rounds); wait = .5; if (r >= rounds) { g.done = true; g.score = got.reduce((a, b) => a + b, 0) / rounds; } else gen(); }
    },
    down() {
      if (wait > 0 || g.done) return; chop = .14; let m = null, bd = 9; for (const k of marks) if (k.q < 0 && Math.abs(k.x - x) < bd) { bd = Math.abs(k.x - x); m = k; }
      if (!m) { if (x > x0 && x < x1) { bad++; E.beat(0, 'miss'); } return; } const q = bd < 2.6 ? 1 : bd < 5.5 ? .75 : .45; m.q = q; m.at = x; sum += q; if (q >= 1) perfect++; spark(parts, x, 58, q >= 1 ? GOLD : '#ffffff', q >= 1 ? 7 : 3); E.beat(q, 'chop');
    },
    draw(c) {
      box(c, 8, 4, W - 16, H - 10, E.theme.paper || '#e9dcc0'); box(c, 16, 40, W - 32, 46, '#b8794a'); R(c, 18, 42, W - 36, 3, '#ffffff33'); R(c, 20, 80, W - 40, 3, '#2a273333');   // the board
      const col = cols[r % cols.length], cuts = marks.filter(m => m.q > 0).map(m => m.at).sort((a, b) => a - b); let px = x0, n = 0;
      for (const e of cuts.concat([x1])) { const off = n * 2 - cuts.length; R(c, px + off, 52, e - px - 1, 18, INK); R(c, px + off + 1, 53, e - px - 3, 16, col); R(c, px + off + 1, 53, e - px - 3, 3, '#ffffff55'); px = e; n++; }
      for (const m of marks) if (m.q < 0) { for (let y = 48; y < 74; y += 4) R(c, m.x, y, 1, 2, '#ffffff'); R(c, m.x - 1, 45, 3, 3, INK); } else if (m.q === 0) R(c, m.x - 1, 45, 3, 3, BAD);
      if (E.theme.icons && E.theme.icons[r % E.theme.icons.length]) drawIcon(c, E.theme.icons[r % E.theme.icons.length], 12, 8, 2); else if (E.theme.icon) drawIcon(c, E.theme.icon, 12, 8, 2);
      const ky = chop > 0 ? 44 : 26; R(c, x - 1, ky, 3, 30, INK); R(c, x, ky, 1, 29, '#d9d9e0'); R(c, x - 3, ky - 12, 7, 13, INK); R(c, x - 2, ky - 11, 5, 11, '#8a5a2c'); if (wait <= 0) R(c, x, 76, 1, 6, BAD);
      drawParts(c, parts);
    },
    want() { const m = marks.find(k => k.q < 0); return { type: 'tap', x: W / 2, y: 60, ready: wait <= 0 && !!m && Math.abs(m.x - x) < 2.2 }; },
    stats: () => ({ perfect, rounds }),
  };
  return g;
};

/* ---- golden: it colours as it cooks; tap to take it out in the golden window (o.rounds, o.style 'oven' | 'fry') ---- */
KINDS.golden = E => {
  const o = E.def.o || {}, n = o.rounds || 3, fry = o.style === 'fry', parts = [], got = [], zw = (o.zone || .2) - .08 * E.d;
  let i = 0, h = 0, spd = 0, z0 = .7, wait = .3, q = 0, out = 0, surge = 0, perfect = 0;
  function next() { h = 0; spd = (.2 + Math.random() * .12) * (1 + .5 * E.d); z0 = .6 + Math.random() * .2; surge = 1.5 + Math.random() * 2; out = 0; }
  next(); E.prog(0, n);
  function judge(v) { q = v; got.push(v); i++; E.prog(i, n); out = 1; wait = .9; if (v >= 1) perfect++; if (v > .5) spark(parts, 90, 40, GOLD, v >= 1 ? 10 : 5); E.beat(v, 'out'); E.cap(v >= 1 ? 'Golden!' : v > .5 ? 'Good' : h < z0 ? 'Still pale' : 'Burnt'); }
  const tone = v => (v < z0 - zw / 2 ? 0 : v <= z0 + zw / 2 ? 1 : 2), tint = document.createElement('canvas'); tint.height = 48;
  const g = { done: false, score: 0,
    update(dt) {
      stepParts(parts, dt); if (wait > 0) { wait -= dt; if (wait <= 0 && out) { if (i >= n) { g.done = true; g.score = got.reduce((a, b) => a + b, 0) / n; E.cap(''); } else { next(); E.cap(''); } } return; }
      surge -= dt; h += spd * dt * (surge < 0 && surge > -.8 ? 2.1 : 1); if (h >= 1.15) judge(0);
    },
    down() { if (wait > 0 || g.done) return; const dz = h - z0; judge(Math.abs(dz) <= zw * .2 ? 1 : Math.abs(dz) <= zw / 2 ? .8 : dz < 0 ? Math.max(0, .55 + (dz + zw / 2) * 2.2) : Math.max(0, .45 - (dz - zw / 2) * 5)); },
    draw(c) {
      box(c, 8, 4, W - 16, H - 10, E.theme.paper || '#55505f'); const t3 = tone(h), ox = 46, oy = 8, ow = 88, oh = 62, lift = out ? Math.min(14, (.9 - wait) * 40) : 0;
      if (fry) { box(c, ox, oy + 16, ow, oh - 16, '#8a8f9a'); R(c, ox + 2, oy + 26, ow - 4, oh - 28, E.theme.color2 || '#e8b63a'); for (let k = 0; k < 7; k++) R(c, ox + 6 + k * 12, oy + 28 + Math.floor((h * 30 + k * 3) % 6), 2, 2, '#fff8b0'); R(c, ox + 10, oy + 20 - lift, ow - 20, 2, INK); R(c, ox + ow - 12, oy + 4 - lift, 2, 18, INK); }
      else { box(c, ox, oy, ow, oh, '#3a3644'); box(c, ox + 6, oy + 6, ow - 12, oh - 14, t3 === 2 ? '#5a2a1c' : '#f0a04a'); R(c, ox + 8, oy + oh - 20 + 0, ow - 16, 2, '#2a2733'); for (let k = 0; k < 3; k++) disc(c, ox + 14 + k * 30, oy + oh - 4, 2, '#d9d9e0'); }
      const dx = ox + ow / 2 - 24, dy = oy + (fry ? 14 : 8) - lift, al = h < z0 - zw / 2 ? clamp(.6 * (1 - h / (z0 - zw / 2))) : clamp((h - z0 - zw / 2) * 2.4, 0, .85);
      tint.width = 48; const tc = tint.getContext('2d'); drawIcon(tc, E.theme.icon || 'skill.cooking', 0, 0, 3); if (al > .02) { tc.globalCompositeOperation = 'source-atop'; tc.globalAlpha = al; tc.fillStyle = h < z0 ? '#fff4dc' : '#1e1410'; tc.fillRect(0, 0, 48, 48); } c.drawImage(tint, Math.round(dx), Math.round(dy));
      if (t3 === 2 && !out) for (let k = 0; k < 3; k++) R(c, ox + 20 + k * 22, oy - 2 - Math.floor((h * 40 + k * 5) % 8), 3, 3, '#77707f');
      const bx = 16, bw = 148, by = 80; box(c, bx - 2, by - 2, bw + 4, 14, '#fff4dc'); R(c, bx, by, bw * clamp(z0 - zw / 2) / 1.15, 10, '#f6e7c0'); R(c, bx + bw * (z0 - zw / 2) / 1.15, by, bw * zw / 1.15, 10, GOLD); R(c, bx + bw * (z0 - zw * .2) / 1.15, by, bw * zw * .4 / 1.15, 10, '#ffd95a'); R(c, bx + bw * (z0 + zw / 2) / 1.15, by, bw * (1.15 - z0 - zw / 2) / 1.15, 10, '#5a2a1c');
      const mx = bx + bw * clamp(h / 1.15); R(c, mx - 2, by - 5, 5, 20, INK); R(c, mx - 1, by - 4, 3, 18, out ? (q > .5 ? GOOD : BAD) : '#ffffff');
      drawParts(c, parts);
    },
    want: () => ({ type: 'tap', x: W / 2, y: 50, ready: wait <= 0 && Math.abs(h - z0) < zw * .18 }),
    stats: () => ({ perfect, rounds: n }),
  };
  return g;
};

/* ---- stroke: press as the handle reaches the left green (the catch), hold through the pull, let go in the right green (the finish) ---- */
KINDS.stroke = E => {
  const o = E.def.o || {}, n = o.strokes || 8, per = (o.period || 2.3) - .7 * E.d, zw = (o.zone || .17) - .06 * E.d, parts = [], got = [], fin = .55;
  let p = .8, i = 0, hold = false, qa = -1, t = 0, dist = 0, flash = 0, flashQ = 0, perfect = 0, did = true, early = false; E.prog(0, n);
  const pos = () => (p < fin ? p / fin : 1 - (p - fin) / (1 - fin));                    // 0 = at the catch (left), 1 = at the finish (right)
  const qOf = d => (d <= zw * .35 ? 1 : d <= zw ? .75 : d <= zw * 1.8 ? .4 : 0);
  function score(v) { got.push(v); i++; E.prog(i, n); flash = .4; flashQ = v; if (v >= .9) perfect++; dist += 6 + 10 * v; if (v > .5) spark(parts, 150, 70, v >= .9 ? GOLD : '#ffffff', 6); E.beat(v, 'stroke'); qa = -1; if (i >= n) { g.done = true; g.score = got.reduce((a, b) => a + b, 0) / n; } }
  const g = { done: false, score: 0,
    update(dt) {
      t += dt; stepParts(parts, dt); flash = Math.max(0, flash - dt); const p0 = p; p += dt / per;
      if (p >= 1) { p -= 1; if (!did) score(0); did = early; early = false; }                                   // a whole cycle with no pull
      if (hold && p0 < fin + zw * 1.8 * (1 - fin) && p >= fin + zw * 1.8 * (1 - fin) && qa >= 0) { hold = false; score(qa * .5); }   // held on far too long
    },
    down() { if (hold || g.done || qa >= 0) return; const d = p > .5 ? (1 - p) / (1 - fin) : p / fin; hold = true; qa = qOf(d); if (qa <= 0) { hold = false; qa = -1; E.beat(0, 'miss'); flash = .3; flashQ = 0; } else if (p > .5) early = true; else did = true; },
    up() { if (!hold) return; hold = false; const d = Math.abs(p - fin) / (p < fin ? fin : 1 - fin); score((qa + qOf(d)) / 2); },
    draw(c) {
      box(c, 8, 4, W - 16, H - 10, E.theme.paper || '#bfe3f2'); const u = pos();
      if (E.def.scene) E.def.scene(c, 9, 5, W - 18, 62, { u, hold, t, dist });
      else { R(c, 9, 46, W - 18, 22, '#3b82d6'); for (let k = 0; k < 7; k++) R(c, 9 + ((k * 27 + 200 - dist * 2) % (W - 26) + (W - 26)) % (W - 26), 50 + (k % 3) * 6, 9, 1, '#9fd0f0');
        const sx = 70 + u * 22; R(c, 40, 40, 100, 6, INK); R(c, 41, 41, 98, 4, '#b8794a'); R(c, 36, 38, 8, 6, INK);                                 // the boat / rail
        disc(c, sx, 24, 5, INK); disc(c, sx, 24, 4, '#e8b890'); R(c, sx - 4, 29, 9, 11, INK); R(c, sx - 3, 30, 7, 9, col1(E)); line(c, sx + 3, 32, 118 - u * 26, 34, INK, 2);   // rower + arms
        const a = -.9 + u * 1.5; line(c, 120, 38, 120 + Math.cos(a) * 26, 38 + Math.sin(a) * 26 + 8, INK, 3); line(c, 120, 38, 120 - Math.cos(a) * 12, 38 - Math.sin(a) * 12 - 3, INK, 3); if (hold) R(c, 118 + Math.cos(a) * 26, 52 + Math.sin(a) * 20, 6, 2, '#ffffff'); }
      const bx = 20, bw = 140, by = 78; box(c, bx - 2, by - 2, bw + 4, 16, SKY); R(c, bx, by, bw * zw * .9, 12, GOOD); R(c, bx + bw * (1 - zw * .9), by, bw * zw * .9, 12, GOOD);
      R(c, bx + 2, by + 14, 3, 5, INK); R(c, bx + bw - 5, by + 14, 3, 5, INK); if (hold) R(c, bx, by + 4, bw * u, 4, GOLD);
      const mx = bx + u * (bw - 1); R(c, mx - 2, by - 5, 5, 22, INK); R(c, mx - 1, by - 4, 3, 20, flash > 0 ? (flashQ > .5 ? GOLD : BAD) : hold ? GOLD : '#ffffff');
      drawParts(c, parts);
    },
    want: () => ({ type: 'hold', on: hold ? p < fin - .01 : (p < .02 || p > 1 - .012) && qa < 0, ready: true }),
    stats: () => ({ perfect, strokes: n }),
  };
  return g;
};

/* ====================================================================== the shell ====================================================================== */
let open = null;
function injectCss() { if (typeof document === 'undefined' || !document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/minigame.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/minigame.css' })); }
export function sheetRect() { return open ? open.sheet.getBoundingClientRect() : null; }
export function abort() { if (open) open.finish({ score: 0, stars: 0, quit: true, aborted: true }); }
export const isOpen = () => !!open;

/* "You can turn mini-games off in Settings": when a game comes up for the 2nd, 3rd and 4th time in a save, then never again (owner msg 164). It sits above the sheet and blocks nothing.
   Counters live in the save: G.state.skillplay.n.mgSeen (games opened) / mgTip (hints shown). */
function offTip(sheet) {
  let n = null; try { const s = G.state && G.state.skillplay; n = s && (s.n || (s.n = {})); } catch (e) { n = null; } if (!n) return;
  n.mgSeen = (n.mgSeen || 0) + 1; if (n.mgSeen < 2 || (n.mgTip || 0) >= 3) return; n.mgTip = (n.mgTip || 0) + 1;
  const tip = el('button.mg-tip', { 'data-pad': 'aside', title: 'Hide this tip', onclick: () => tip.remove() }, iconEl('ui.settings', 1), el('span', { text: 'Tip: you can turn mini-games off in Settings.' })); sheet.prepend(tip); setTimeout(() => tip.classList.add('out'), 7000); setTimeout(() => tip.remove(), 7400);
}
export function play(def) {
  injectCss(); if (open) abort();
  return new Promise(resolve => {
    const lvl = Math.max(1, Math.min(10, def.level || 1)), d = (lvl - 1) / 9, theme = def.theme || {};
    const cv = el('canvas.mg-cv.pix', { width: W, height: H }), g2 = cv.getContext('2d'), cap = el('div.mg-cap'), binsEl = el('div.mg-bins'), pips = el('div.mg-pips'), hint = el('div.mg-hint', { text: def.hint || '' });
    const pauseBtn = el('button.mg-b', { 'data-pad': 'aside', 'aria-label': 'Pause', title: 'Pause', onclick: () => setPause(!paused) }, el('span', { text: 'II' })), autoBtn = def.noAuto ? null : el('button.mg-b.mg-auto', { 'data-pad': 'aside' /* PAD HOOK (ui/padnav.js) */, title: 'Skip the game and take the usual result', onclick: () => finish({ score: -1, auto: true }) }, el('span', { text: def.autoLabel || 'Auto' })), quitBtn = el('button.mg-b.mg-x', { 'data-pad': 'aside', 'aria-label': 'Stop', title: 'Stop', onclick: () => finish({ score: 0, quit: true }) }, el('span', { text: 'x' }));
    const veil = el('div.mg-veil'), stage = el('div.mg-stage', null, cv, veil);
    const sheet = el('div.mg' + (innerWidth > innerHeight * 1.15 ? '.side' : ''), { role: 'dialog', 'aria-label': def.title || 'Mini-game' },
      el('div.mg-head', null, def.icon ? iconEl(def.icon, 2) : null, el('div.mg-tt', null, el('b', { text: def.title || '' }), el('small', { text: def.sub || `Level ${lvl}` })), autoBtn, pauseBtn, quitBtn), hint, stage, cap, binsEl, pips);
    root().append(sheet); offTip(sheet);
    let paused = false, done = false, raf = 0, last = performance.now(), t = 0, count = def.count === 0 ? 0 : .9, pipN = 0, held = false;
    const env = { W, H, lvl, d, def, theme, rnd: Math.random, icon: drawIcon,
      beat: (q, tag) => { try { def.onBeat && def.onBeat(q, tag); } catch (e) { /* cosmetic */ } },
      cap: s => { cap.textContent = s || ''; },
      prog: (i, n) => { if (n !== pipN) { pipN = n; pips.textContent = ''; for (let k = 0; k < Math.min(n, 24); k++) pips.append(el('i')); } const m = Math.min(n, 24), on = Math.round(i / n * m); [...pips.children].forEach((e, k) => e.classList.toggle('on', k < on)); },
      bins: (labels, onPick) => { binsEl.textContent = ''; const bs = labels.map((l, i) => el('button.mg-bin', { 'data-i': i, onclick: () => { if (!paused && count <= 0) onPick(i); } }, l)); binsEl.append(...bs); return (i, ok) => { const b = bs[i]; if (!b) return; b.classList.add(ok ? 'ok' : 'no'); setTimeout(() => b.classList.remove('ok', 'no'), 260); }; },
    };
    let game; try { game = def.kind === 'custom' ? def.custom(env) : (KINDS[def.kind] || KINDS.timing)(env); } catch (e) { console.error(e); sheet.remove(); return resolve({ score: -1, auto: true, stars: 0, error: true }); }
    const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); if (paused || done || count > 0) return; held = true; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ } let [x, y] = pt(e); if (!e.isTrusted && game.snap) { const w = game.want && game.want(); if (w && w.ready && w.x !== undefined) { x = w.x; y = w.y; } }   /* PAD HOOK: a Confirm press (ui/padnav.js sends an untrusted pointer) hits the lit spot */ game.down && game.down(x, y); });
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
/** add a kind from another file (see the header): impl = env => game object. Returns false when the name is taken. */
export function registerKind(name, impl) { if (!name || typeof impl !== 'function' || KINDS[name]) return false; KINDS[name] = impl; return true; }
export const hasKind = name => !!KINDS[name];
export function init() { injectCss(); G.minigame = { play, abort, isOpen, sheetRect, stars, MG, registerKind, hasKind, draw, W, H, get kinds() { return Object.keys(KINDS); } }; }
