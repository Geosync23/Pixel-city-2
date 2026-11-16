// minigame_b.js — MINI-GAMES B (owner msgs 163-164): the kit kinds for chores and everyday things. Registered into the shared kit (src/ui/minigame.js registerKind), so
// play({ kind: 'unbox' | 'laundry' | 'scrub' | 'water' | 'wires' | 'cast' | 'mix', ... }) works everywhere. Game definitions + where each attaches: src/sim/_mg_games.js. Data: src/data/minigames_b.js.
//   'unbox'   o.items [[name, iconId]]: tap the tape three times, then tap each thing as it comes up out of the box (nothing can go wrong: the first mini-game of a new game)
//   'laundry' o.mode 'sort': each garment goes in the Lights or the Darks basket (the two buttons, or tap that half of the picture);  o.mode 'fold': tap the flap that glows, three folds a garment
//   'scrub'   o.scenes ['plate' | 'window' | 'counter' | 'pet']: rub each spot away with a finger (a tap also scrubs a little: keys / pad)
//   'water'   o.pots: hold to pour, let go when the water is in the green: each pot wants a different amount
//   'wires'   tap a plug, then the socket with the same colour and mark
//   'cast'    fishing in three beats: tap to cast in the green, tap when the float dips, then hold / let go to keep the line tension in the green
//   'mix'     o.mixes [[name, [r, y, b]]]: tap the tubes to add drops until your colour matches the swatch
// All one thumb; every kind gives want() (tests, Space / Enter, a gamepad's Confirm) and sets `snap` where a particular spot must be hit.
import { registerKind, draw as D, W, H } from './minigame.js';
import { TUNE_B, GARMENTS, FOLDABLES, WIRE_COLS, MIXES } from '../data/minigames_b.js';
import { initGames } from '../sim/_mg_games.js';

export const order = 58;   // after skillplay (54): its GAMES / GAME_FOR are extended in initGames
const { R, box, disc, ring, line, icon, spark, stepParts, drawParts, INK, GOOD, BAD, GOLD } = D;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), SKY = '#eaf6fb', avg = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const dark = (c, f = .72) => { const n = parseInt(c.slice(1, 7), 16); return '#' + [n >> 16, n >> 8 & 255, n & 255].map(v => Math.round(v * f).toString(16).padStart(2, '0')).join(''); };

/** a garment, centred on x, y (about 40 x 30 at s = 1) */
export function garment(c, x, y, type, col, s = 1) {
  const b = (dx, dy, w, h, cc = col) => box(c, x + dx * s, y + dy * s, w * s, h * s, cc), f = (dx, dy, w, h, cc) => R(c, x + dx * s, y + dy * s, w * s, h * s, cc), sh = dark(col, .82);
  if (type === 'tee' || type === 'jumper') { const sl = type === 'tee' ? 10 : 22; b(-19, -13, 9, sl); b(10, -13, 9, sl); b(-11, -14, 22, 28); f(-11, -12, 1, sl - 2, col); f(10, -12, 1, sl - 2, col); f(-4, -14, 8, 3, INK); f(-3, -14, 6, 2, sh); f(-10, 10, 20, 3, sh); if (type === 'jumper') { f(-18, 6, 7, 2, sh); f(11, 6, 7, 2, sh); } }
  else if (type === 'trousers') { b(-11, -14, 22, 9); b(-11, -6, 10, 21); b(1, -6, 10, 21); f(-10, -6, 8, 1, col); f(2, -6, 8, 1, col); f(-10, -13, 20, 2, sh); f(-1, -9, 2, 3, sh); }
  else if (type === 'sock') { b(-12, -13, 9, 20); b(-12, 4, 16, 9); f(-11, 4, 7, 1, col); f(-11, -12, 7, 3, sh); b(3, -13, 9, 20); b(3, 4, 16, 9); f(4, 4, 7, 1, col); f(4, -12, 7, 3, sh); }
  else { b(-17, -11, 34, 22); f(-16, -6, 32, 2, sh); f(-16, 4, 32, 2, sh); f(-16, -10, 32, 1, '#ffffff55'); }
}

/* ---- unbox: three taps on the tape, then lift each thing out as it comes up ---- */
registerKind('unbox', E => {
  const o = E.def.o || {}, items = (o.items && o.items.length ? o.items : [['Your things', 'ui.star']]).slice(0, 5), n = items.length, parts = [], T = TUNE_B.unbox, sc = n > 4 ? 1 : 2, sw = n > 4 ? 30 : 36;
  let tape = 3, cur = -1, pop = 0, t = 0, fly = null, wait = 0, flap = 0; const out = [];
  const slot = k => ({ x: W / 2 - n * sw / 2 + k * sw + (sw - 16 * sc) / 2, y: 38 - 16 * sc });
  const next = () => { cur = out.length; pop = 0; E.cap(items[cur][0]); };
  E.prog(0, n + 1); E.cap('Tap the tape');
  const g = { done: false, score: 0, snap: true,
    update(dt) {
      t += dt; stepParts(parts, dt); if (tape <= 0) flap = Math.min(1, flap + dt * 5);
      if (fly) { fly.u += dt * 3.2; if (fly.u >= 1) { out.push(fly.k); const s = slot(fly.k); spark(parts, s.x + 8 * sc, s.y + 8 * sc, GOLD, 7); fly = null; E.prog(out.length + 1, n + 1); if (out.length >= n) { wait = .8; E.cap('All unpacked!'); E.beat(1, 'done'); } else next(); } return; }
      if (wait > 0) { wait -= dt; if (wait <= 0) { g.done = true; g.score = clamp(1.12 - Math.max(0, t - T.par - n * T.per) * .04, T.floor, 1); } return; }
      if (cur >= 0) pop = Math.min(1, pop + dt * 3.5);
    },
    down(x, y) {
      if (g.done || fly || wait > 0) return;
      if (tape > 0) { if (x > 40 && x < 140 && y > 40) { tape--; spark(parts, 90, 52 + (3 - tape) * 9, '#f1eee6', 6); E.beat(.6, 'rip'); if (tape <= 0) { E.prog(1, n + 1); next(); } } return; }
      if (cur >= 0 && pop > .45 && Math.abs(x - W / 2) < 30 && y > 8 && y < 84) { fly = { k: cur, u: 0 }; cur = -1; E.beat(.9, 'out'); }
    },
    draw(c) {
      box(c, 8, 4, W - 16, H - 10, E.theme.paper || '#efe3c8'); R(c, 9, 86, W - 18, 13, '#c9a878'); R(c, 9, 86, W - 18, 1, '#a8885c'); R(c, 16, 38, W - 32, 3, '#8a5a2c'); R(c, 16, 41, W - 32, 1, '#2a273333');   // wall, floor, shelf
      for (const k of out) { const s = slot(k); icon(c, items[k][1], s.x, s.y, sc); }
      const bx = 52, bw = 76, by = 58, open = tape <= 0;
      if (open) { R(c, bx - 14 * flap, by - 5, 16, 6, INK); R(c, bx - 14 * flap + 1, by - 4, 14, 4, '#d2ad74'); R(c, bx + bw - 2 + 14 * flap, by - 5, 16, 6, INK); R(c, bx + bw - 1 + 14 * flap, by - 4, 14, 4, '#d2ad74'); R(c, bx + 2, by - 4, bw - 4, 8, '#6b4a2a'); }
      if (cur >= 0) icon(c, items[cur][1], W / 2 - 16, by + 4 - pop * 34 + (pop >= 1 ? Math.sin(t * 6) * 1.5 : 0), 2);
      if (fly) { const s = slot(fly.k), u = fly.u, x0 = W / 2 - 16, y0 = by - 30; icon(c, items[fly.k][1], x0 + (s.x - x0) * u, y0 + (s.y - y0) * u - Math.sin(u * Math.PI) * 10, sc === 2 ? 2 : 2 - u); }
      box(c, bx, by, bw, 40, '#c9a36a'); R(c, bx + 1, by + 1, bw - 2, 3, '#d9b987'); R(c, bx + 8, by + 22, 26, 2, '#7a5a3a'); R(c, bx + 8, by + 27, 18, 2, '#7a5a3a'); R(c, bx + bw - 20, by + 20, 12, 12, '#b8925a'); R(c, bx + bw - 17, by + 23, 6, 6, '#d2ad74');   // the box front: marker scribble, a label
      if (!open) { box(c, bx - 2, by - 8, bw + 4, 10, '#d2ad74'); for (let k = 0; k < tape; k++) { R(c, W / 2 - 5, by - 8 + (2 - k) * 13 + (k === tape - 1 ? Math.sin(t * 9) * 1 : 0), 10, 13, '#f1eee6'); R(c, W / 2 - 5, by - 8 + (2 - k) * 13, 1, 13, '#2a273333'); } if (Math.floor(t * 3) % 2 === 0) ring(c, W / 2, by + 12, 12, GOLD, 2); }
      else if (cur >= 0 && pop >= 1 && Math.floor(t * 3) % 2 === 0) ring(c, W / 2, by - 14, 20, GOLD, 2);
      drawParts(c, parts);
    },
    want: () => (g.done || fly || wait > 0 ? { type: 'tap', ready: false } : tape > 0 ? { type: 'tap', x: W / 2, y: 70, ready: true } : { type: 'tap', x: W / 2, y: 44, ready: cur >= 0 && pop > .6 }),
    stats: () => ({ items: n, secs: Math.round(t) }),
  };
  return g;
});

/* ---- laundry: sort lights from darks, or fold ---- */
registerKind('laundry', E => {
  const o = E.def.o || {}, parts = [], got = [];
  if (o.mode === 'fold') {
    const n = TUNE_B.fold.n, pool = shuffle(FOLDABLES).slice(0, n), cx = 76, cy = 54; let i = 0, steps = [], k = 0, x0 = 0, x1 = 0, y0 = 0, y1 = 0, t = 0, wrong = 0, wait = .2, shake = 0, tuck = 0;
    const gen = () => { steps = (Math.random() < .5 ? ['L', 'R'] : ['R', 'L']).concat('B'); k = 0; x0 = cx - 30; x1 = cx + 30; y0 = cy - 26; y1 = cy + 26; t = 0; wrong = 0; E.cap(['First: one side in', 'Now the other side', 'Then fold it up'][0]); };
    const flapOf = s => (s === 'L' ? [x0, y0, (x1 - x0) / 3, y1 - y0] : s === 'R' ? [x1 - (x1 - x0) / 3, y0, (x1 - x0) / 3, y1 - y0] : [x0, (y0 + y1) / 2, x1 - x0, (y1 - y0) / 2]);
    gen(); E.prog(0, n);
    const g = { done: false, score: 0, snap: true,
      update(dt) { stepParts(parts, dt); shake = Math.max(0, shake - dt); tuck = Math.max(0, tuck - dt); if (wait > 0) { wait -= dt; if (wait <= 0 && k >= 3) { i++; E.prog(i, n); if (i >= n) { g.done = true; g.score = avg(got); E.cap(''); } else gen(); } return; } t += dt; },
      down(x, y) {
        if (wait > 0 || g.done || k >= 3) return; const s = steps[k], hit = s === 'B' ? y > (y0 + y1) / 2 - 4 ? 'B' : '' : y > y1 + 6 ? '' : x < (x0 + x1) / 2 ? 'L' : 'R';
        if (hit !== s) { wrong++; shake = .3; E.beat(0, 'miss'); return; }
        if (s === 'L') x0 += (x1 - x0) / 3; else if (s === 'R') x1 -= (x1 - x0) / 3; else y1 = (y0 + y1) / 2; k++; tuck = .18; E.beat(.8, 'fold'); spark(parts, (x0 + x1) / 2, (y0 + y1) / 2, '#ffffff', 4);
        if (k >= 3) { got.push(clamp(1 - wrong * .2) * (.75 + .25 * clamp(1.6 - t / TUNE_B.fold.secs))); wait = .55; E.cap('Neat!'); E.beat(1, 'round'); spark(parts, 144, 70, GOLD, 6); } else E.cap(k === 1 ? 'Now the other side' : 'Then fold it up');
      },
      draw(c) {
        box(c, 8, 4, W - 16, H - 10, '#e9dcc0'); box(c, 14, 14, 124, 84, '#f6efdc'); R(c, 15, 15, 122, 2, '#ffffff88');                                    // the folding table
        box(c, 142, 78, 26, 6, '#b8794a'); for (let j = 0; j < i; j++) { box(c, 144, 72 - j * 7, 22, 8, pool[j][1]); R(c, 145, 73 - j * 7, 20, 1, '#ffffff66'); }   // the folded stack
        if (i < n && !(k >= 3 && wait < .3)) { const p = pool[i], sx = shake > 0 ? Math.round(Math.sin(shake * 60) * 2) : 0, w = x1 - x0, h = y1 - y0;
          if (k === 0 && (p[0] === 'tee' || p[0] === 'jumper')) { box(c, x0 - 9 + sx, y0 + 2, 10, p[0] === 'tee' ? 14 : 30, p[1]); box(c, x1 - 1 + sx, y0 + 2, 10, p[0] === 'tee' ? 14 : 30, p[1]); }
          box(c, x0 + sx, y0 + (tuck > 0 ? 1 : 0), w, h, p[1]); R(c, x0 + sx + 1, y0 + 1, w - 2, 2, '#ffffff66');
          if (p[0] === 'towel') { R(c, x0 + sx + 1, y0 + 8, w - 2, 3, dark(p[1], .8)); if (h > 30) R(c, x0 + sx + 1, y1 - 11, w - 2, 3, dark(p[1], .8)); } else if (p[0] === 'trousers') { if (k < 2) R(c, (x0 + x1) / 2 + sx, y0 + 12, 1, h - 13, INK); R(c, x0 + sx + 1, y0 + 3, w - 2, 3, dark(p[1], .8)); } else { R(c, (x0 + x1) / 2 - 5 + sx, y0, 10, 3, INK); R(c, (x0 + x1) / 2 - 4 + sx, y0, 8, 2, dark(p[1], .7)); }
          if (k > 0) R(c, x0 + sx + 1, y0 + 1, 2, h - 2, dark(p[1], .86)); if (k > 1) R(c, x1 + sx - 3, y0 + 1, 2, h - 2, dark(p[1], .86));
          if (k < 3 && wait <= 0) { const f = flapOf(steps[k]), on = Math.floor(t * 4) % 2 === 0; for (let q = 0; q < f[2]; q += 4) { R(c, f[0] + q, f[1], 2, 1, on ? GOLD : INK); R(c, f[0] + q, f[1] + f[3] - 1, 2, 1, on ? GOLD : INK); } for (let q = 0; q < f[3]; q += 4) { R(c, f[0], f[1] + q, 1, 2, on ? GOLD : INK); R(c, f[0] + f[2] - 1, f[1] + q, 1, 2, on ? GOLD : INK); }
            const ax = f[0] + f[2] / 2, ay = f[1] + f[3] / 2, d = steps[k] === 'L' ? [1, 0] : steps[k] === 'R' ? [-1, 0] : [0, -1], pu = (t * 12) % 6; for (let q = 0; q < 3; q++) R(c, ax + d[0] * (q * 3 + pu) - 2 - Math.abs(d[1]) * (2 - q) * 2, ay + d[1] * (q * 3 + pu) - 2 - Math.abs(d[0]) * (2 - q) * 2, 4 + Math.abs(d[1]) * (2 - q) * 4, 4 + Math.abs(d[0]) * (2 - q) * 4, q === 2 ? GOLD : '#fff8b0'); } }
        drawParts(c, parts);
      },
      want() { if (wait > 0 || g.done || k >= 3) return { type: 'tap', ready: false }; const f = flapOf(steps[k]); return { type: 'tap', x: f[0] + f[2] / 2, y: f[1] + f[3] / 2 + (steps[k] === 'B' ? 3 : 0), ready: true }; },
      stats: () => ({ folded: i, of: n }),
    };
    return g;
  }
  const n = TUNE_B.sort.n, items = shuffle(GARMENTS).slice(0, n), tl = TUNE_B.sort.secs - 1.4 * E.d, heap = [[], []]; let i = 0, t = 0, anim = 0, res = 0, toBin = 0, wait = .25;
  const setActive = E.bins(['Lights', 'Darks'], pick); E.prog(0, n); E.cap(items[0][0]);
  function pick(b) { if (anim > 0 || wait > 0 || g.done) return; const it = items[i], ok = b === it[3]; res = ok ? 1 : 0; toBin = b; got.push(ok ? .72 + .28 * clamp(1.5 - t / tl * 1.5) : 0); anim = .34; E.beat(ok ? .9 : 0, ok ? 'sort' : 'miss'); if (ok) { spark(parts, b ? 136 : 44, 76, GOLD, 5); heap[b].push(it[2]); } setActive(b, ok); }
  const g = { done: false, score: 0,
    update(dt) {
      stepParts(parts, dt); if (wait > 0) { wait -= dt; return; }
      if (anim > 0) { anim -= dt; if (anim <= 0) { i++; E.prog(i, n); t = 0; if (i >= n) { g.done = true; g.score = avg(got); E.cap(''); } else E.cap(items[i][0]); } return; }
      t += dt; if (t >= tl) { res = 0; toBin = -1; got.push(0); anim = .3; E.beat(0, 'miss'); }
    },
    down(x) { pick(x < W / 2 ? 0 : 1); },
    draw(c) {
      box(c, 8, 4, W - 16, H - 10, '#dfeef5'); R(c, 9, 88, W - 18, 11, '#b9c2cc');
      for (let b = 0; b < 2; b++) { const bx = b ? 104 : 14, col = b ? '#55505f' : '#fffdf4'; for (let j = 0; j < heap[b].length; j++) { R(c, bx + 6 + (j % 3) * 14, 66 - Math.floor(j / 3) * 5, 18, 8, INK); R(c, bx + 7 + (j % 3) * 14, 67 - Math.floor(j / 3) * 5, 16, 7, heap[b][j]); }
        box(c, bx, 70, 62, 24, col); for (let q = 0; q < 5; q++) R(c, bx + 6 + q * 11, 74, 6, 16, b ? '#3a3644' : '#e9dcc0'); R(c, bx - 2, 68, 66, 4, INK); R(c, bx - 1, 69, 64, 2, b ? '#77707f' : '#ffffff'); disc(c, bx + 31, 82, 7, INK); disc(c, bx + 31, 82, 6, b ? '#2f3142' : '#fffdf4'); if (!b) { R(c, bx + 30, 77, 3, 11, GOLD); R(c, bx + 26, 81, 11, 3, GOLD); } else disc(c, bx + 33, 80, 4, '#55505f'); }
      if (i < n) { const it = items[i]; let x = W / 2, y = 22 + clamp(t / tl) * 26; if (anim > 0) { const u = 1 - anim / .34; if (res && toBin >= 0) { x += ((toBin ? 135 : 45) - x) * u; y += (66 - y) * u * u; } else x += Math.sin(u * 30) * 4; } garment(c, x, y, it[1], it[2], anim > 0 && res ? 1 : 1.3); if (anim <= 0) { box(c, 60, 6, 60, 6, '#fffdf4'); R(c, 61, 7, 58 * clamp(1 - t / tl), 4, t / tl > .7 ? BAD : GOLD); } }
      drawParts(c, parts);
    },
    want: () => (i < n && anim <= 0 && wait <= 0 ? { type: 'bin', i: items[i][3], ready: true } : { type: 'bin', ready: false }),
    stats: () => ({ right: got.filter(v => v > 0).length, of: n }),
  };
  return g;
});

/* ---- scrub: rub the spots away (plates in the sink, a window, the counter, a dog's coat) ---- */
const SPOT_COL = { plate: ['#8a5a2c', '#d8342e', '#e8b63a', '#6b8f3a'], window: ['#ffffff', '#e4e8ec'], counter: ['#8a5a2c', '#c05a3a', '#55505f'], pet: ['#6b4a2a'] };
const spotAt = { plate: (k, n) => { const a = k / n * 6.283 + Math.random() * .5, r = 7 + Math.random() * 15; return [84 + Math.cos(a) * r, 52 + Math.sin(a) * r]; }, window: (k, n) => [44 + (k % 3) * 34 + Math.random() * 8, 26 + Math.floor(k / 3) * 34 + Math.random() * 10 - (k % 3 === 1 ? 8 : 0)],
  counter: (k, n) => [32 + k * (116 / Math.max(1, n - 1)), 44 + (k % 2) * 24 + Math.random() * 6], pet: (k, n) => [58 + k * (50 / Math.max(1, n - 1)), 54 + (k % 2) * 9] };
registerKind('scrub', E => {
  const o = E.def.o || {}, scenes = o.scenes && o.scenes.length ? o.scenes : ['plate'], per = (o.n || 5) + (E.lvl >= 6 ? 1 : 0), all = per * scenes.length, T = TUNE_B.scrub, parts = [];
  let r = 0, spots = [], t = 0, wait = .2, px = 150, py = 20, lx = null, ly = null, cleaned = 0, wag = 0, bub = 0;
  const gen = () => { const sc = scenes[r]; spots = []; for (let k = 0; k < per; k++) { const p = spotAt[sc](k, per); spots.push({ x: clamp(p[0], 20, 160), y: clamp(p[1], 16, 90), a: 1, c: SPOT_COL[sc][k % SPOT_COL[sc].length], s: Math.random() * 6 }); } };
  const rub = (x, y, amt) => { let best = null, bd = 14; for (const s of spots) { const d = Math.hypot(s.x - x, s.y - y); if (s.a > 0 && d < bd) { bd = d; best = s; } } if (!best) return; best.a -= amt; wag = .4; bub += amt; if (bub > .12) { bub = 0; parts.push({ x: x + Math.random() * 8 - 4, y: y - 2, vx: Math.random() * 20 - 10, vy: -18, t: .35, c: scenes[r] === 'pet' ? '#e9d2a8' : '#ffffff' }); }
    if (best.a <= 0) { cleaned++; E.prog(cleaned, all); spark(parts, best.x, best.y, GOLD, 6); E.beat(.9, 'clean'); if (spots.every(s => s.a <= 0)) { wait = .7; E.beat(1, 'round'); E.cap(['Squeaky clean', 'Spotless', 'Gleaming'][r % 3]); } } };
  gen(); E.prog(0, all);
  const g = { done: false, score: 0, snap: true,
    update(dt) {
      stepParts(parts, dt); wag = Math.max(0, wag - dt);
      if (wait > 0) { wait -= dt; if (wait <= 0 && spots.every(s => s.a <= 0)) { r++; if (r >= scenes.length) { g.done = true; g.score = clamp(1.1 - Math.max(0, t - all * T.par) * .035, .5, 1); E.cap(''); } else { gen(); E.cap(''); } } return; }
      t += dt; if (t >= T.secs) { g.done = true; g.score = cleaned / all * .7; }
    },
    down(x, y) { px = x; py = y; lx = x; ly = y; if (wait <= 0 && !g.done) rub(x, y, T.tap); },
    move(x, y) { px = x; py = y; if (lx !== null && wait <= 0 && !g.done) rub(x, y, Math.hypot(x - lx, y - ly) / T.work); lx = x; ly = y; },
    up() { lx = null; },
    draw(c) {
      const sc = scenes[Math.min(r, scenes.length - 1)], out = wait > 0 && spots.every(s => s.a <= 0) ? (1 - wait / .7) : 0;
      if (sc === 'plate') { box(c, 8, 4, W - 16, H - 10, '#8a8f9a'); R(c, 14, 10, 126, H - 24, '#b9c2cc'); R(c, 14, 10, 126, 3, '#d9e2ea'); R(c, 14, 70, 126, 26, '#bfe3f2'); for (let k = 0; k < 6; k++) disc(c, 22 + k * 22 + Math.sin(t * 2 + k) * 2, 72, 3, '#ffffff');
        R(c, 30, 4, 6, 12, '#d9d9e0'); R(c, 30, 14, 14, 4, '#d9d9e0'); box(c, 144, 22, 24, 70, '#77707f'); for (let k = 0; k < r + (out > .6 ? 1 : 0); k++) box(c, 147 + k * 6, 30, 5, 54, '#fffdf4');
        const ox = out * 70; disc(c, 84 + ox, 52, 34, INK); disc(c, 84 + ox, 52, 33, '#fffdf4'); ring(c, 84 + ox, 52, 25, '#d9e2ea'); ring(c, 84 + ox, 52, 24, '#d9e2ea'); R(c, 64 + ox, 30, 10, 3, '#ffffffcc'); }
      else if (sc === 'window') { box(c, 8, 4, W - 16, H - 10, '#efe3c8'); box(c, 22, 8, 136, 84, '#8a5a2c'); R(c, 26, 12, 128, 76, '#9fd0f0'); R(c, 26, 60, 128, 28, '#bfe3f2'); for (let k = 0; k < 7; k++) { const h = 14 + (k * 13) % 22; R(c, 28 + k * 18, 88 - h, 15, h, k % 2 ? '#7f93a8' : '#93a6b8'); R(c, 31 + k * 18, 92 - h, 3, 3, '#f2e2a0'); } disc(c, 132, 26, 7, '#fff4c0');
        R(c, 88, 12, 4, 76, '#8a5a2c'); R(c, 26, 48, 128, 4, '#8a5a2c'); R(c, 18, 92, 144, 5, '#a8713a'); }
      else if (sc === 'counter') { box(c, 8, 4, W - 16, H - 10, '#efe3c8'); for (let k = 0; k < 9; k++) box(c, 10 + k * 18, 6, 18, 18, k % 2 ? '#dfeef5' : '#cfe3ef', '#b9c2cc'); box(c, 12, 26, W - 24, 68, '#d8c3a0'); R(c, 13, 27, W - 26, 3, '#efe0c0'); R(c, 13, 88, W - 26, 5, '#a8885c'); box(c, 140, 30, 22, 14, '#fffdf4'); disc(c, 151, 37, 4, '#d8342e'); }
      else { box(c, 8, 4, W - 16, H - 10, '#cfe9c8'); R(c, 9, 78, W - 18, 21, '#b8d8a8'); const tan = '#c98a4a', w2 = wag > 0 ? Math.sin(t * 30) * 4 : Math.sin(t * 3) * 2;
        line(c, 50, 50, 38 + w2, 34, INK, 5); line(c, 50, 50, 38 + w2, 34, tan, 3); for (const lx2 of [58, 70, 104, 116]) { box(c, lx2, 68, 8, 18, tan); }
        disc(c, 62, 58, 15, INK); disc(c, 114, 58, 15, INK); R(c, 62, 43, 52, 31, INK); disc(c, 62, 58, 14, tan); disc(c, 114, 58, 14, tan); R(c, 62, 44, 52, 29, tan); R(c, 64, 45, 48, 3, '#dda05c');
        disc(c, 134, 40, 13, INK); disc(c, 134, 40, 12, tan); box(c, 142, 42, 16, 9, '#e0b07a'); R(c, 155, 43, 3, 3, INK); R(c, 136, 35, 3, 3, INK); R(c, 137, 35, 1, 1, '#ffffff'); box(c, 122, 28, 8, 16, '#8a5a2c'); if (wag > 0) R(c, 146, 50, 6, 4, '#e0527a'); }
      for (const s of spots) { if (s.a <= 0) continue; const rr = 2 + s.a * 5; if (sc === 'pet') { for (let k = 0; k < 4; k++) { const a = s.s + k * 1.6; line(c, s.x - Math.cos(a) * rr, s.y - Math.sin(a) * rr, s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr, s.c, 2); } } else { c.globalAlpha = sc === 'window' ? .5 + .4 * s.a : 1; disc(c, s.x, s.y, rr, s.c); disc(c, s.x + 4 * Math.cos(s.s), s.y + 3 * Math.sin(s.s), rr * .6, s.c); disc(c, s.x - 3 * Math.sin(s.s), s.y + 4, rr * .5, s.c); c.globalAlpha = 1; } }
      const s0 = spots.find(s => s.a > 0); if (s0 && lx === null && Math.floor(t * 3) % 2 === 0) ring(c, s0.x, s0.y, 11, GOLD, 2);
      if (sc === 'pet') { box(c, px - 9, py - 4, 18, 7, '#8a5a2c'); for (let k = 0; k < 5; k++) R(c, px - 7 + k * 3, py + 3, 2, 4, '#e9dcc0'); } else if (sc === 'window') { box(c, px - 8, py - 6, 16, 12, '#fffdf4'); R(c, px - 6, py - 4, 12, 2, '#8fd8f0'); } else { box(c, px - 8, py - 5, 16, 11, '#f2c230'); R(c, px - 7, py - 4, 14, 3, '#5fb84f'); }
      box(c, 150, 6, 20, 6, '#fffdf4'); R(c, 151, 7, 18 * clamp(1 - t / T.secs), 4, t / T.secs > .75 ? BAD : GOLD);
      drawParts(c, parts);
    },
    want() { const s = spots.find(q => q.a > 0); if (!s || wait > 0 || g.done) return { type: 'drag', ready: false }; const pts = []; for (let k = 0; k < 9; k++) pts.push([s.x + (k % 2 ? 7 : -7), s.y - 4 + k]); return { type: 'drag', ready: true, x: s.x, y: s.y, pts }; },
    stats: () => ({ cleaned, of: all, secs: Math.round(t) }),
  };
  return g;
});

/* ---- water: hold to pour, let go in the green: each pot wants its own amount ---- */
registerKind('water', E => {
  const o = E.def.o || {}, n = o.pots || TUNE_B.water.pots, band = TUNE_B.water.band - .035 * E.d, parts = [], got = [], leaf = E.theme.color || '#5fb84f';
  let i = 0, fill = 0, hold = false, rate = .5, target = .7, wait = 0, q = 0, t = 0, judged = false, kind = 0;
  const next = () => { fill = 0; hold = false; judged = false; rate = (.36 + Math.random() * .26) * (1 + .6 * E.d); target = .42 + Math.random() * .45; kind = (kind + 1 + Math.floor(Math.random() * 2)) % 3; };
  const judge = v => { q = v; got.push(v); i++; E.prog(i, n); judged = true; wait = .9; hold = false; E.beat(v, 'pour'); E.cap(v >= 1 ? 'Just right' : v > .5 ? 'Good' : fill > target ? 'A puddle' : 'Still thirsty'); if (v > .6) spark(parts, 90, 40, GOLD, 8); };
  next(); E.prog(0, n);
  const g = { done: false, score: 0,
    update(dt) { t += dt; stepParts(parts, dt); if (wait > 0) { wait -= dt; if (wait <= 0) { if (i >= n) { g.done = true; g.score = avg(got); E.cap(''); } else { next(); E.cap(''); } } return; } if (hold) { fill += rate * dt; if (fill >= 1.04) judge(.15); } },
    down() { if (!judged && !g.done) hold = true; },
    up() { if (!hold || judged) return; hold = false; if (fill < .06) return; const dd = Math.abs(fill - target); judge(dd <= band ? 1 : Math.max(.1, .8 - (dd - band) * 4)); },
    draw(c) {
      box(c, 8, 4, W - 16, H - 10, E.theme.paper || '#eaf6fb'); R(c, 9, 5, W - 18, 40, '#cfe8f4'); R(c, 88, 5, 3, 40, '#fffdf4'); R(c, 9, 44, W - 18, 3, '#fffdf4'); box(c, 8, 90, W - 16, 10, '#d8c3a0');           // window + sill
      const perk = clamp(fill / target), over = fill > target + band, px = 90, py = 64, dr = judged && q < .5 && !over ? 1 : (1 - perk) * (judged ? 0 : 1);
      line(c, px, py, px, py - 30 + dr * 6, '#3f8f3a', 3);
      if (kind === 0) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { const ex = px + s * (14 + k * 5), ey = py - 26 + k * 10 + dr * 12; line(c, px, py - 18 + k * 8, ex, ey, '#3f8f3a', 2); disc(c, ex, ey, 5, INK); disc(c, ex, ey, 4, leaf); }
      else if (kind === 1) { for (let k = -2; k <= 2; k++) { const ex = px + k * 9, ey = py - 34 + Math.abs(k) * 5 + dr * 12; line(c, px, py - 6, ex, ey, INK, 4); line(c, px, py - 6, ex, ey, leaf, 2); } }
      else { disc(c, px, py - 30 + dr * 8, 7, INK); disc(c, px, py - 30 + dr * 8, 6, '#e0527a'); disc(c, px, py - 30 + dr * 8, 2, GOLD); for (const s of [-1, 1]) { const ex = px + s * 13, ey = py - 12 + dr * 8; disc(c, ex, ey, 5, INK); disc(c, ex, ey, 4, leaf); } }
      box(c, 66, 62, 48, 8, '#c8643a'); box(c, 70, 69, 40, 20, '#b85a32'); R(c, 71, 70, 4, 18, '#ffffff33'); R(c, 68, 63, 44, 3, fill > .25 ? '#4a3220' : '#7a5a3a'); R(c, 62, 88, 56, 3, INK); R(c, 63, 89, 54, 1, '#d9d9e0'); if (over) R(c, 58, 91, 64, 2, '#8fd8f0');
      const tilt = hold ? 5 : 0; box(c, 22, 20 + tilt, 26, 18, '#8fa8d8'); R(c, 16, 24 + tilt, 7, 3, INK); R(c, 14, 24 + tilt, 3, 10, INK); line(c, 48, 30 + tilt, 62, 22 + tilt * 2, INK, 4); line(c, 48, 30 + tilt, 62, 22 + tilt * 2, '#8fa8d8', 2);
      if (hold) for (let k = 0; k < 6; k++) R(c, 64 + k * 4, 26 + tilt * 2 + k * k * .9 + (t * 60 + k * 3) % 4, 2, 3, '#8fd8f0');
      const gx = 138, gy = 12, gh = 76; box(c, gx - 2, gy - 2, 16, gh + 4, SKY); R(c, gx, gy + (1 - target - band) * gh, 12, band * 2 * gh, GOOD); const fh = Math.min(1, fill) * gh; R(c, gx + 2, gy + gh - fh, 8, fh, '#3b82d6'); R(c, gx - 3, gy + gh - fh - 1, 18, 2, INK);
      if (judged) icon(c, q >= 1 ? 'ui.star' : q > .4 ? 'ui.check' : 'ui.cross', 118, 14, 1);
      drawParts(c, parts);
    },
    want: () => (judged || g.done ? { type: 'tap', ready: false } : { type: 'hold', on: fill < target - rate * .03, ready: true }),
    stats: () => ({ made: got.filter(v => v >= 1).length, shots: n }),
  };
  return g;
});

/* ---- wires: tap a plug, then the socket with the same colour and mark ---- */
function mark(c, k, x, y, col) { if (k === 0) disc(c, x, y, 2, col); else if (k === 1) R(c, x - 4, y - 1, 9, 3, col); else if (k === 2) R(c, x - 1, y - 4, 3, 9, col); else if (k === 3) { R(c, x - 3, y - 3, 7, 7, col); R(c, x - 1, y - 1, 3, 3, INK); } else { line(c, x - 3, y - 3, x + 3, y + 3, col, 2); line(c, x + 3, y - 3, x - 3, y + 3, col, 2); } }
registerKind('wires', E => {
  const o = E.def.o || {}, N = E.lvl >= 6 ? 5 : 4, rounds = o.rounds || TUNE_B.wires.rounds, tl = TUNE_B.wires.secs - 4 * E.d, parts = [], got = [], ys = Array.from({ length: N }, (_, i) => 16 + i * (N === 4 ? 24 : 18));
  let r = 0, L = [], Rt = [], done = {}, sel = -1, wrong = 0, t = 0, wait = .2, zap = 0, nDone = 0;
  const gen = () => { const ids = Array.from({ length: N }, (_, i) => i); L = shuffle(ids); Rt = shuffle(ids); if (L.every((v, i) => v === Rt[i])) Rt.reverse(); done = {}; sel = -1; wrong = 0; t = 0; nDone = 0; E.cap('Tap a plug'); };
  gen(); E.prog(0, rounds);
  const g = { done: false, score: 0, snap: true,
    update(dt) { stepParts(parts, dt); zap = Math.max(0, zap - dt); if (wait > 0) { wait -= dt; if (wait <= 0 && (nDone >= N || t >= tl * 1.6)) { r++; E.prog(r, rounds); if (r >= rounds) { g.done = true; g.score = avg(got); E.cap(''); } else gen(); } return; } t += dt; if (t >= tl * 1.6) { got.push(nDone / N * .5); wait = .6; E.cap('Out of time'); E.beat(0, 'miss'); } },
    down(x, y) {
      if (wait > 0 || g.done) return; let k = 0; for (let j = 1; j < N; j++) if (Math.abs(ys[j] - y) < Math.abs(ys[k] - y)) k = j;
      if (x < 70) { if (!done[L[k]]) { sel = L[k]; E.beat(.5, 'pick'); E.cap('Now its socket'); } return; } if (x < 110 || sel < 0) return;
      if (Rt[k] === sel) { done[sel] = 1; nDone++; sel = -1; spark(parts, 146, ys[k], GOLD, 6); E.beat(.9, 'wire'); if (nDone >= N) { got.push(clamp(1 - wrong * .2) * (.7 + .3 * clamp(1.5 - t / tl))); wait = .7; E.cap('It hums!'); E.beat(1, 'round'); } else E.cap('Tap a plug'); }
      else if (!done[Rt[k]]) { wrong++; zap = .3; spark(parts, 146, ys[k], BAD, 6); E.beat(0, 'miss'); }
    },
    draw(c) {
      box(c, 8, 4, W - 16, H - 10, zap > 0 ? '#5a3440' : E.theme.paper || '#3a3644'); for (const p of [[12, 8], [164, 8], [12, 94], [164, 94]]) { disc(c, p[0] + 1, p[1] + 1, 2, '#9aa4b0'); R(c, p[0], p[1] + 1, 3, 1, INK); } R(c, 60, 8, 60, 3, '#2a2733'); if (E.theme.icon) icon(c, E.theme.icon, W / 2 - 8, 42, 1, .5);
      for (let j = 0; j < N; j++) if (done[L[j]]) { const k = Rt.indexOf(L[j]); line(c, 42, ys[j], 140, ys[k], INK, 5); line(c, 42, ys[j], 140, ys[k], WIRE_COLS[L[j]], 3); }
      for (let j = 0; j < N; j++) { const a = L[j], b = Rt[j]; box(c, 18, ys[j] - 8, 26, 16, WIRE_COLS[a]); mark(c, a, 30, ys[j], INK); R(c, 44, ys[j] - 2, 5, 4, '#d9d9e0'); if (sel === a) { ring(c, 31, ys[j], 15, GOLD, 2); line(c, 48, ys[j], 62, ys[j] + Math.sin(G_t() * 8) * 3, WIRE_COLS[a], 3); }
        box(c, 136, ys[j] - 8, 26, 16, '#55505f'); R(c, 140, ys[j] - 5, 18, 10, done[b] ? WIRE_COLS[b] : dark(WIRE_COLS[b], .8)); mark(c, b, 149, ys[j], done[b] ? INK : '#fffdf4'); R(c, 131, ys[j] - 2, 5, 4, INK); }
      box(c, 60, 96, 60, 6, '#2a2733', '#77707f'); if (wait <= 0) R(c, 61, 97, 58 * clamp(1 - t / (tl * 1.6)), 4, t / tl > 1.2 ? BAD : GOLD);
      drawParts(c, parts);
    },
    want() { if (wait > 0 || g.done) return { type: 'tap', ready: false }; if (sel < 0) { const j = L.findIndex(a => !done[a]); return { type: 'tap', x: 30, y: ys[j], ready: true }; } return { type: 'tap', x: 149, y: ys[Rt.indexOf(sel)], ready: true }; },
    stats: () => ({ rounds, wrong }),
  };
  return g;
});
const G_t = () => performance.now() / 1000;

/* ---- cast: cast in the green, strike when the float dips, then reel against the pull ---- */
registerKind('cast', E => {
  const o = E.def.o || {}, T = TUNE_B.cast, parts = [], hw = .17 - .07 * E.d, zw = .3 - .1 * E.d;
  let ph = 0, pos = Math.random(), dir = 1, z0 = .55 + Math.random() * .3, castQ = 0, biteQ = 0, pen = 0, dist = .5, fly = 0, biteT = 0, bite = 0, early = 0, t = 0, v = .3, vel = 0, hold = false, c0 = .5, prog = 0, tr = 0, inz = false, tug = 0, tugT = 2, lastBeat = 0; const w1 = .9 + .8 * E.d, phs = Math.random() * 6;
  E.prog(0, 10); E.cap('Tap to cast');
  const g = { done: false, score: 0,
    update(dt) {
      t += dt; stepParts(parts, dt); early = Math.max(0, early - dt);
      if (ph === 0) { pos += dir * (.9 + .6 * E.d) * dt; if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; } }
      else if (ph === 1) { fly += dt * 1.6; if (fly >= 1) { ph = 2; biteT = 1.3 + Math.random() * 2.2; spark(parts, fx(), 62, '#dff1fa', 6); E.cap('Wait for the bite...'); } }
      else if (ph === 2) { if (bite > 0) { bite -= dt; if (bite <= 0) { pen += .15; biteT = 1 + Math.random() * 1.6; E.cap('It let go. Wait...'); E.beat(0, 'miss'); if (pen >= .44) strike(.3); } } else { biteT -= dt; if (biteT <= 0) { bite = T.bite; E.cap('A bite! Tap!'); E.beat(.6, 'bite'); } } }
      else if (ph === 3) { tr += dt; vel += (hold ? 2.3 : -1.9) * dt; vel *= Math.pow(.12, dt); v = clamp(v + vel * dt); if (v <= 0 || v >= 1) vel = 0;
        tugT -= dt; if (tugT <= 0) { tug = (Math.random() - .5) * (.3 + .3 * E.d); tugT = 1.4 + Math.random() * 2.4; } tug *= Math.pow(.3, dt);
        c0 = clamp(.5 + .24 * Math.sin(tr * w1 + phs) + .09 * Math.sin(tr * 2.3) + tug, hw + .03, 1 - hw - .03); inz = Math.abs(v - c0) <= hw; prog = clamp(prog + (inz ? dt / T.need : -dt / 30)); if (inz && tr - lastBeat > .9) { lastBeat = tr; E.beat(.7, 'reel'); } E.prog(Math.round(prog * 10), 10);
        if (prog >= 1 || tr >= T.secs) { const reel = prog >= 1 ? clamp(.8 + .5 * (1 - tr / T.secs)) : prog * .7; g.done = true; g.score = clamp(.18 * castQ + .17 * biteQ + .65 * reel - pen * .3 + (prog >= 1 ? .04 : 0)); if (prog >= 1) { spark(parts, 40, 50, GOLD, 14); E.beat(1, 'land'); } } }
    },
    down() {
      if (g.done) return;
      if (ph === 0) { const dz = Math.abs(pos - z0); castQ = dz <= zw * .2 ? 1 : dz <= zw / 2 ? .8 : Math.max(.2, .6 - (dz - zw / 2) * 2); dist = .35 + .65 * pos; ph = 1; fly = 0; E.beat(castQ, 'cast'); E.cap(castQ >= 1 ? 'A lovely cast' : ''); }
      else if (ph === 2) { if (bite > 0) strike(bite > T.bite * .6 ? 1 : bite > T.bite * .3 ? .8 : .55); else if (early <= 0) { early = .6; pen += .08; biteT += .8; E.cap('Too soon: wait for the dip'); E.beat(0, 'miss'); } }
      else if (ph === 3) hold = true;
    },
    up() { hold = false; },
    draw(c) {
      box(c, 8, 4, W - 16, H - 10, '#bfe3f2'); R(c, 9, 5, W - 18, 40, E.theme.paper || '#eaf6fb'); R(c, 9, 60, W - 18, 39, '#3b82d6'); for (let k = 0; k < 8; k++) R(c, 12 + ((k * 23 + t * 6) % (W - 30)), 66 + (k % 4) * 8, 8, 1, '#9fd0f0'); disc(c, 150, 18, 7, '#fff4c0');
      box(c, 8, 52, 44, 8, '#b8794a'); for (const x of [14, 30, 44]) R(c, x, 60, 4, 39, '#8a5a2c');                                                                                    // the pier
      disc(c, 26, 28, 5, INK); disc(c, 26, 28, 4, '#e8b890'); box(c, 21, 33, 11, 14, E.theme.color || '#e0527a'); R(c, 22, 46, 4, 7, INK); R(c, 27, 46, 4, 7, INK);                           // you
      const bend = ph === 3 ? (v - .3) * 10 : 0, tipx = 62, tipy = 14 + bend; line(c, 30, 38, tipx, tipy, INK, 2);
      const X = fx(), u = ph === 1 ? fly : 1, flx = ph === 0 ? tipx : tipx + (X - tipx) * u - (ph === 3 ? prog * (X - 56) : 0), fly2 = ph === 0 ? tipy + 10 : ph === 1 ? tipy + (62 - tipy) * u - Math.sin(u * Math.PI) * 22 : 61 + (bite > 0 ? 4 : Math.sin(t * 3) * 1);
      line(c, tipx, tipy, flx, fly2, '#fffdf4', 1);
      if (ph === 3) { const fy = 76 + Math.sin(tr * 5) * 3 * (inz ? .4 : 1.2), fxx = flx + 4; R(c, fxx - 9, fy - 4, 18, 8, INK); R(c, fxx - 8, fy - 3, 16, 6, '#f08a2c'); R(c, fxx + 8, fy - 5, 5, 10, INK); R(c, fxx + 9, fy - 4, 3, 8, '#f08a2c'); R(c, fxx - 6, fy - 2, 2, 2, INK); line(c, flx, 62, fxx - 8, fy, '#fffdf4', 1); }
      else { R(c, flx - 2, fly2 - 4, 5, 4, BAD); R(c, flx - 2, fly2, 5, 3, '#fffdf4'); if (bite > 0) { ring(c, flx, 62, 6 + (T.bite - bite) * 8, '#ffffff', 1); R(c, flx - 1, fly2 - 18, 3, 8, GOLD); R(c, flx - 1, fly2 - 8, 3, 3, GOLD); } }
      const gx = 160, gy = 8, gh = 88; box(c, gx - 2, gy - 2, 14, gh + 4, SKY);
      if (ph === 0) { R(c, gx, gy + (1 - z0 - zw / 2) * gh, 10, zw * gh, GOOD); R(c, gx - 3, gy + (1 - pos) * gh - 1, 16, 3, BAD); } else if (ph === 3) { R(c, gx, gy + (1 - c0 - hw) * gh, 10, hw * 2 * gh, inz ? '#8fe07a' : GOOD); R(c, gx - 3, gy + (1 - v) * gh - 2, 16, 5, INK); R(c, gx - 2, gy + (1 - v) * gh - 1, 14, 3, inz ? GOLD : BAD); box(c, 60, 92, 92, 7, '#e9dcc0'); R(c, 61, 93, 90 * prog, 5, GOLD); R(c, 61 + 90 * clamp(tr / T.secs), 91, 1, 9, BAD); }
      drawParts(c, parts);
    },
    want: () => (g.done ? { type: 'tap', ready: false } : ph === 0 ? { type: 'tap', x: W / 2, y: 50, ready: Math.abs(pos - z0) < zw * .18 } : ph === 2 ? { type: 'tap', x: W / 2, y: 50, ready: bite > 0 && bite < T.bite - .12 } : ph === 3 ? { type: 'hold', on: v < c0 + (vel > 0 ? -.03 : .03), ready: true } : { type: 'tap', ready: false }),
    stats: () => ({ cast: castQ, bite: biteQ, secs: Math.round(tr), prog }),
  };
  function fx() { return 70 + dist * 78; }
  function strike(q) { biteQ = q; bite = 0; ph = 3; v = .35; E.cap('Fish on! Hold to reel, let go to give line'); E.beat(q, 'strike'); spark(parts, fx(), 60, '#ffffff', 8); }
  return g;
});

/* ---- mix: add drops of red, yellow and blue until your colour is the colour on the card ---- */
const PIG = [[0, 1, 1], [0, 0, 1], [1, .5, 0]], TUBE = ['#d8342e', '#f2c230', '#3b82d6'], TUBE_N = ['Red', 'Yellow', 'Blue'];
export function mixCol(d) { const n = d[0] + d[1] + d[2]; if (!n) return '#fffdf4'; const cmy = [0, 1, 2].map(k => clamp((d[0] * PIG[0][k] + d[1] * PIG[1][k] + d[2] * PIG[2][k]) / n * 1.4)); return '#' + cmy.map(v => Math.round(235 * (1 - v) + 14).toString(16).padStart(2, '0')).join(''); }
registerKind('mix', E => {
  const o = E.def.o || {}, rounds = o.rounds || TUNE_B.mix.rounds, pool = shuffle((o.mixes || MIXES).filter(m => m[1][0] + m[1][1] + m[1][2] <= (E.lvl >= 4 ? 4 : E.lvl >= 2 ? 3 : 2))).slice(0, rounds), parts = [], got = [];
  let r = 0, have = [0, 0, 0], t = 0, wait = .2, ok = false, drip = -1, dripT = 0, tries = 0; const need = () => pool[r][1], tot = d => d[0] + d[1] + d[2];
  E.prog(0, rounds); E.cap('Mix: ' + pool[0][0]);
  const g = { done: false, score: 0, snap: true,
    update(dt) { stepParts(parts, dt); dripT = Math.max(0, dripT - dt); if (wait > 0) { wait -= dt; if (wait <= 0 && tot(have) >= tot(need())) { if (ok || tries >= 2) { got.push(ok ? (tries ? .6 : 1) * (.8 + .2 * clamp(1.6 - t / TUNE_B.mix.secs)) : .15); r++; E.prog(r, rounds); tries = 0; t = 0; if (r >= rounds) { g.done = true; g.score = avg(got); E.cap(''); return; } E.cap('Mix: ' + pool[r][0]); } else { tries++; E.cap('Not quite. Rinse and try again'); } have = [0, 0, 0]; } return; } t += dt; },
    down(x, y) {
      if (wait > 0 || g.done || y < 66) return; const k = clamp(Math.floor((x - 18) / 48), 0, 2); have[k]++; drip = k; dripT = .25; E.beat(.6, 'drop'); spark(parts, 126, 40, TUBE[k], 4);
      if (tot(have) >= tot(need())) { ok = have.every((v, j) => v === need()[j]); wait = .8; E.beat(ok ? 1 : 0, ok ? 'match' : 'miss'); E.cap(ok ? 'A perfect ' + pool[r][0].toLowerCase() : 'Hmm, that is not it'); if (ok) spark(parts, 126, 36, GOLD, 10); }
    },
    draw(c) {
      box(c, 8, 4, W - 16, H - 10, E.theme.paper || '#fffdf4'); const nd = need(), n = tot(nd);
      box(c, 18, 10, 56, 46, '#f6efdc'); box(c, 24, 15, 44, 26, mixCol(nd)); for (let k = 0; k < n; k++) { disc(c, 46 - n * 4 + k * 8 + 4, 49, 3, INK); disc(c, 46 - n * 4 + k * 8 + 4, 49, 2, k < tot(have) ? '#77707f' : '#fffdf4'); }      // the card: the colour wanted + how many drops
      disc(c, 126, 34, 27, INK); disc(c, 126, 34, 26, '#e9dcc0'); disc(c, 126, 34, 18, INK); disc(c, 126, 34, 17, mixCol(have)); R(c, 114, 24, 8, 2, '#ffffff66'); if (wait > 0 && tot(have) >= n) icon(c, ok ? 'ui.check' : 'ui.cross', 146, 8, 1);   // your palette
      R(c, 82, 30, 12, 3, INK); R(c, 90, 26, 3, 11, INK); R(c, 91, 23, 1, 3, INK); R(c, 91, 37, 1, 3, INK);
      for (let k = 0; k < 3; k++) { const x = 18 + k * 48, dn = drip === k && dripT > 0 ? 2 : 0; box(c, x + 6, 70 + dn, 36, 26, TUBE[k]); R(c, x + 8, 72 + dn, 4, 22, '#ffffff55'); box(c, x + 18, 64 + dn, 12, 8, '#d9d9e0'); R(c, x + 8, 86 + dn, 32, 1, '#2a273355'); for (let q = 0; q < have[k]; q++) { disc(c, x + 13 + q * 8, 80 + dn, 3, INK); disc(c, x + 13 + q * 8, 80 + dn, 2, '#fffdf4'); } }
      drawParts(c, parts);
    },
    want() { if (wait > 0 || g.done) return { type: 'tap', ready: false }; const nd = need(), k = [0, 1, 2].find(j => have[j] < nd[j]); return { type: 'tap', x: 18 + (k === undefined ? 0 : k) * 48 + 24, y: 84, ready: k !== undefined }; },
    stats: () => ({ matched: got.filter(v => v > .5).length, rounds }),
  };
  return g;
});
export const TUBE_NAMES = TUBE_N;

export function init() { initGames(); }
