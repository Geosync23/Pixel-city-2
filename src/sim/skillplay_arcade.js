// Four tiny, really playable arcade games + the chess-tactics board for the shared mini-game kit (src/ui/minigame.js, kind 'custom').
// Each factory takes the kit env E ({ W, H, lvl, d, beat, cap, prog }) and returns a kit game object { update, draw, down, move, up, done, score, want, stats }.
//   ARCADE_GAMES[id](E, o) — o = { par (points for a full score at this level), hi (the player's best so far) };  stats() -> { points }
//     gull  "Gull Run"     tap to flap between the pier posts (3 lives, 40 s)
//     brick "Brick Bay"    drag the paddle, break the bricks (3 balls, 50 s)
//     ferry "Star Ferry"   drag to steer, the ferry fires by itself; shoot or dodge the rocks (3 hulls, 40 s)
//     snake "Snack Snake"  tap a side (or swipe) to turn; eat snacks, do not bite your tail (45 s; the edges wrap)
//   chessGame(E, o) — o = { blitz }: five "find the fork" puzzles on a real 8x8 board: move your piece to the one square from which it attacks two enemy pieces.
//     Pieces: knight; rook from level 2, bishop from 3, queen from 5. stats() -> { solved, of }
// No module init: imported by src/sim/skillplay.js.
import { draw } from '../ui/minigame.js';
const { R, box, disc, line, spark, stepParts, drawParts, INK, GOLD, GOOD, BAD } = draw;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const capText = (E, pts, o) => E.cap(`Score ${pts}${o.hi ? ' · Best ' + o.hi : ''} · Par ${o.par}`);

function gull(E, o) {
  const W = E.W, H = E.H, parts = [], posts = [], gap = 46 - 9 * E.d, spd = 46 + 18 * E.d, T = 40;
  let y = H / 2, vy = 0, t = 0, lives = 3, pts = 0, inv = 0, nextX = W + 20, flap = 0;
  const g = { done: false, score: 0,
    update(dt) {
      t += dt; stepParts(parts, dt); inv = Math.max(0, inv - dt); flap = Math.max(0, flap - dt); vy += 210 * dt; y += vy * dt; if (y > H - 14) { y = H - 14; vy = -40; } if (y < 6) { y = 6; vy = 0; }
      nextX -= spd * dt; if (nextX < W) { posts.push({ x: W + 8, c: 22 + Math.random() * (H - 60), ok: false }); nextX += 78 - 14 * E.d; }
      for (const p of posts) { p.x -= spd * dt; if (!p.ok && p.x < 34) { p.ok = true; pts += 5; spark(parts, 40, y, GOLD, 5); E.beat(1, 'gap'); capText(E, pts, o); }
        if (inv <= 0 && p.x < 48 && p.x + 10 > 34 && (y - 4 < p.c - gap / 2 || y + 4 > p.c + gap / 2)) { lives--; inv = 1.2; vy = -70; E.beat(0, 'hit'); } }
      while (posts.length && posts[0].x < -14) posts.shift();
      E.prog(Math.round(clamp(t / T) * 10), 10);
      if (lives <= 0 || t >= T) { g.done = true; g.score = clamp(pts / o.par); }
    },
    down() { vy = -92; flap = .15; },
    draw(c) {
      R(c, 0, 0, W, H, '#9fd0e8'); R(c, 0, H - 10, W, 10, '#3b82d6'); for (let x = -((t * 20) % 16); x < W; x += 16) R(c, x, H - 11, 8, 1, '#dff1fa'); for (let k = 0; k < 3; k++) { const cx = ((k * 70 - t * 8) % (W + 40) + W + 40) % (W + 40) - 20; R(c, cx, 10 + k * 9, 18, 5, '#ffffffcc'); R(c, cx + 4, 7 + k * 9, 9, 4, '#ffffffcc'); }
      for (const p of posts) { box(c, p.x, 0, 10, p.c - gap / 2, '#8a5a2c'); box(c, p.x - 2, p.c - gap / 2 - 5, 14, 5, '#a8733a'); box(c, p.x, p.c + gap / 2, 10, H - p.c - gap / 2, '#8a5a2c'); box(c, p.x - 2, p.c + gap / 2, 14, 5, '#a8733a'); }
      if (inv <= 0 || Math.floor(inv * 12) % 2) { const bx = 36, by = Math.round(y); R(c, bx, by - 3, 10, 7, INK); R(c, bx + 1, by - 2, 8, 5, '#fffdf4'); R(c, bx + 9, by - 1, 3, 2, '#f08a2c'); R(c, bx + 7, by - 2, 1, 1, INK); R(c, bx + 1, by + (flap > 0 ? 1 : -4), 5, 3, '#9aa4b0'); }
      for (let k = 0; k < lives; k++) R(c, 4 + k * 7, 4, 5, 4, BAD); drawParts(c, parts);
    },
    want() { const p = posts.find(q => q.x + 10 > 34) || { c: H / 2 }; return { type: 'tap', x: W / 2, y: H / 2, ready: y > p.c + 3 && vy > -20 }; },
    stats: () => ({ points: pts }),
  };
  capText(E, 0, o); return g;
}

function brick(E, o) {
  const W = E.W, H = E.H, parts = [], cols = 8, rows = 4, bw = 20, bh = 7, x0 = (W - cols * bw) / 2, y0 = 10, bricks = [], T = 50, pw = 34 - 10 * E.d, cl = ['#e0527a', '#f08a2c', '#f2c230', '#5fb84f'];
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) bricks.push({ x: x0 + k * bw, y: y0 + r * bh, r, on: true });
  let px = W / 2, bx = W / 2, by = H - 24, vx = 40, vy = -80 - 26 * E.d, t = 0, lives = 3, pts = 0, held = 0;
  const g = { done: false, score: 0,
    update(dt) {
      t += dt; stepParts(parts, dt); if (held > 0) { held -= dt; bx = px; by = H - 16; E.prog(Math.round(clamp(t / T) * 10), 10); return; }
      bx += vx * dt; by += vy * dt; if (bx < 4) { bx = 4; vx = Math.abs(vx); } if (bx > W - 4) { bx = W - 4; vx = -Math.abs(vx); } if (by < 4) { by = 4; vy = Math.abs(vy); }
      if (vy > 0 && by >= H - 14 && by <= H - 8 && Math.abs(bx - px) <= pw / 2 + 3) { vy = -Math.abs(vy); vx = (bx - px) / (pw / 2) * 70; by = H - 14; E.beat(.6, 'pad'); }
      for (const b of bricks) if (b.on && bx >= b.x && bx <= b.x + bw && by >= b.y && by <= b.y + bh) { b.on = false; vy = -vy; pts += 2; spark(parts, b.x + bw / 2, b.y + 3, cl[b.r], 5); E.beat(1, 'brick'); capText(E, pts, o); break; }
      if (by > H + 4) { lives--; held = .7; vy = -Math.abs(vy); vx = 30 * (Math.random() < .5 ? -1 : 1); E.beat(0, 'drop'); }
      E.prog(Math.round(clamp(t / T) * 10), 10);
      const left = bricks.some(b => b.on); if (!left) pts += 10;
      if (lives <= 0 || t >= T || !left) { g.done = true; g.score = clamp(pts / o.par); }
    },
    down(x) { px = clamp(x, pw / 2, W - pw / 2); }, move(x) { px = clamp(x, pw / 2, W - pw / 2); },
    draw(c) {
      R(c, 0, 0, W, H, '#221f2e'); for (const b of bricks) if (b.on) { R(c, b.x, b.y, bw, bh, INK); R(c, b.x + 1, b.y + 1, bw - 2, bh - 2, cl[b.r]); R(c, b.x + 1, b.y + 1, bw - 2, 1, '#ffffff66'); }
      box(c, px - pw / 2, H - 13, pw, 6, '#8fd8f0'); disc(c, bx, by, 2, '#fffdf4'); for (let k = 0; k < lives; k++) disc(c, 6 + k * 7, H - 4, 2, '#fffdf4'); drawParts(c, parts);
    },
    want: () => ({ type: 'move', x: clamp(bx + vx * .05 + Math.sin(t * 1.7) * pw * .32, 6, W - 6), y: H - 12, ready: true }),
    stats: () => ({ points: pts }),
  };
  capText(E, 0, o); return g;
}

function ferry(E, o) {
  const W = E.W, H = E.H, parts = [], rocks = [], shots = [], stars = [], T = 40; for (let k = 0; k < 24; k++) stars.push([Math.random() * W, Math.random() * H, 10 + Math.random() * 30]);
  let px = W / 2, t = 0, lives = 3, pts = 0, fire = 0, spawn = .6, inv = 0;
  const g = { done: false, score: 0,
    update(dt) {
      t += dt; stepParts(parts, dt); inv = Math.max(0, inv - dt); fire -= dt; spawn -= dt;
      if (fire <= 0) { fire = .28; shots.push({ x: px, y: H - 20 }); } if (spawn <= 0) { spawn = (.85 - .35 * E.d) * (.7 + Math.random() * .6); rocks.push({ x: 10 + Math.random() * (W - 20), y: -8, v: 30 + 22 * E.d + Math.random() * 14, r: 4 + Math.floor(Math.random() * 3) }); }
      for (const s of shots) s.y -= 150 * dt; for (const r of rocks) r.y += r.v * dt; for (const s of stars) { s[1] += s[2] * dt; if (s[1] > H) { s[1] = 0; s[0] = Math.random() * W; } }
      for (const r of rocks) { if (r.dead) continue; for (const s of shots) if (!s.dead && Math.abs(s.x - r.x) <= r.r + 1 && Math.abs(s.y - r.y) <= r.r + 2) { s.dead = r.dead = true; pts += 3; spark(parts, r.x, r.y, '#f08a2c', 6); E.beat(1, 'rock'); capText(E, pts, o); }
        if (!r.dead && inv <= 0 && Math.abs(r.x - px) < r.r + 6 && Math.abs(r.y - (H - 14)) < r.r + 5) { r.dead = true; lives--; inv = 1.2; spark(parts, px, H - 14, BAD, 10); E.beat(0, 'hit'); } }
      for (let k = rocks.length - 1; k >= 0; k--) if (rocks[k].dead || rocks[k].y > H + 10) rocks.splice(k, 1); for (let k = shots.length - 1; k >= 0; k--) if (shots[k].dead || shots[k].y < -4) shots.splice(k, 1);
      E.prog(Math.round(clamp(t / T) * 10), 10); if (lives <= 0 || t >= T) { g.done = true; g.score = clamp(pts / o.par); }
    },
    down(x) { px = clamp(x, 8, W - 8); }, move(x) { px = clamp(x, 8, W - 8); },
    draw(c) {
      R(c, 0, 0, W, H, '#161427'); for (const s of stars) R(c, s[0], s[1], 1, 1, s[2] > 25 ? '#ffffff' : '#8a86a8');
      for (const r of rocks) { disc(c, r.x, r.y, r.r, INK); disc(c, r.x, r.y, r.r - 1, '#9a8f86'); R(c, r.x - 1, r.y - 1, 2, 2, '#6f665e'); } for (const s of shots) R(c, s.x - 1, s.y - 3, 2, 5, GOLD);
      if (inv <= 0 || Math.floor(inv * 12) % 2) { const x = Math.round(px), y = H - 14; R(c, x - 7, y, 15, 6, INK); R(c, x - 6, y + 1, 13, 4, '#fffdf4'); R(c, x - 3, y - 4, 7, 4, INK); R(c, x - 2, y - 3, 5, 3, '#3b82d6'); R(c, x - 6, y + 3, 13, 1, BAD); R(c, x, y - 7, 1, 3, INK); }
      for (let k = 0; k < lives; k++) R(c, 4 + k * 7, 4, 5, 4, '#8fd8f0'); drawParts(c, parts);
    },
    want() { let best = null; for (const r of rocks) if (!r.dead && (!best || r.y > best.y)) best = r; return { type: 'move', x: best ? best.x : W / 2, y: H - 12, ready: true }; },
    stats: () => ({ points: pts }),
  };
  capText(E, 0, o); return g;
}

function snake(E, o) {
  const W = E.W, H = E.H, cs = 10, cols = W / cs, rows = H / cs, parts = [], T = 45, step = .2 - .08 * E.d;
  let body = [[5, 5], [4, 5], [3, 5]], dir = [1, 0], nd = dir, food = [12, 5], t = 0, acc = 0, pts = 0, dead = false, sx = 0, sy = 0;
  const place = () => { for (let k = 0; k < 80; k++) { const f = [Math.floor(Math.random() * cols), Math.floor(Math.random() * rows)]; if (!body.some(b => b[0] === f[0] && b[1] === f[1])) { food = f; return; } } };
  const turn = (dx, dy) => { const d = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]; if ((d[0] || d[1]) && !(d[0] === -dir[0] && d[1] === -dir[1])) nd = d; };
  const g = { done: false, score: 0,
    update(dt) {
      t += dt; stepParts(parts, dt); acc += dt;
      while (acc >= step && !dead) { acc -= step; dir = nd; const h = [(body[0][0] + dir[0] + cols) % cols, (body[0][1] + dir[1] + rows) % rows];
        if (body.some((b, i) => i < body.length - 1 && b[0] === h[0] && b[1] === h[1])) { dead = true; E.beat(0, 'bite'); break; }
        body.unshift(h); if (h[0] === food[0] && h[1] === food[1]) { pts += 3; spark(parts, h[0] * cs + 5, h[1] * cs + 5, GOLD, 6); E.beat(1, 'snack'); capText(E, pts, o); place(); } else body.pop(); }
      E.prog(Math.round(clamp(t / T) * 10), 10); if (dead || t >= T) { g.done = true; g.score = clamp(pts / o.par); }
    },
    down(x, y) { sx = x; sy = y; turn(x - (body[0][0] * cs + 5), y - (body[0][1] * cs + 5)); },
    move(x, y) { if (Math.hypot(x - sx, y - sy) > 14) { turn(x - sx, y - sy); sx = x; sy = y; } },
    draw(c) {
      R(c, 0, 0, W, H, '#1f3a2a'); for (let y = 0; y < rows; y++) for (let x = (y % 2); x < cols; x += 2) R(c, x * cs, y * cs, cs, cs, '#24422f');
      body.forEach((b, i) => { R(c, b[0] * cs, b[1] * cs, cs, cs, INK); R(c, b[0] * cs + 1, b[1] * cs + 1, cs - 2, cs - 2, i ? '#8fe07a' : '#d8f5a0'); }); const hd = body[0]; R(c, hd[0] * cs + 3 + dir[0] * 2, hd[1] * cs + 3 + dir[1] * 2, 2, 2, INK);
      disc(c, food[0] * cs + 5, food[1] * cs + 5, 4, INK); disc(c, food[0] * cs + 5, food[1] * cs + 5, 3, '#e0527a'); R(c, food[0] * cs + 5, food[1] * cs, 1, 2, '#5fb84f'); drawParts(c, parts);
    },
    want() { const h = body[0]; let dx = food[0] - h[0], dy = food[1] - h[1]; if (Math.abs(dx) > cols / 2) dx = -dx; if (Math.abs(dy) > rows / 2) dy = -dy; let d = dx && dir[0] !== -Math.sign(dx) ? [Math.sign(dx), 0] : dy && dir[1] !== -Math.sign(dy) ? [0, Math.sign(dy)] : dx ? [0, dir[1] || 1] : [dir[0] || 1, 0];
      const nx = (h[0] + d[0] + cols) % cols, ny = (h[1] + d[1] + rows) % rows; if (body.some(b => b[0] === nx && b[1] === ny)) d = dir;
      return { type: 'tap', x: clamp(h[0] * cs + 5 + d[0] * 30, 2, W - 2), y: clamp(h[1] * cs + 5 + d[1] * 30, 2, H - 2), ready: d[0] !== nd[0] || d[1] !== nd[1] }; },
    stats: () => ({ points: pts }),
  };
  capText(E, 0, o); return g;
}
export const ARCADE_GAMES = { gull, brick, ferry, snake };

/* ------------------------------------------------------------------ chess tactics ("find the fork") */
const SPR = {
  n: ['..##....', '.####...', '######..', '##.###..', '...###..', '..####..', '.######.', '########'], r: ['#.##.#..', '######..', '.####...', '.####...', '.####...', '.####...', '######..', '######..'],
  b: ['..##....', '.####...', '.#.##...', '.####...', '..##....', '..##....', '.####...', '######..'], q: ['#.##.#..', '#.##.#..', '######..', '.####...', '.####...', '.####...', '######..', '######..'],
  p: ['........', '..##....', '.####...', '..##....', '..##....', '.####...', '.####...', '######..'], k: ['..##....', '.####...', '..##....', '######..', '.####...', '.####...', '######..', '######..'],
};
function piece(c, kind, x, y, fill, edge) { const rows = SPR[kind]; for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) if (rows[j][i] === '#') { R(c, x + i - 1, y + j, 3, 1, edge); R(c, x + i, y + j - 1, 1, 3, edge); } for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) if (rows[j][i] === '#') R(c, x + i, y + j, 1, 1, fill); }
const KN = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]], RK = [[1, 0], [-1, 0], [0, 1], [0, -1]], BS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const inb = (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8;
/** squares a piece of `kind` on (x, y) reaches / attacks; occupied(x, y) blocks sliders (the blocker square itself is included: it is attacked) */
function reach(kind, x, y, occupied) {
  const out = []; if (kind === 'n') { for (const [dx, dy] of KN) if (inb(x + dx, y + dy)) out.push([x + dx, y + dy]); return out; }
  for (const [dx, dy] of kind === 'r' ? RK : kind === 'b' ? BS : RK.concat(BS)) { let cx = x + dx, cy = y + dy; while (inb(cx, cy)) { out.push([cx, cy]); if (occupied(cx, cy)) break; cx += dx; cy += dy; } }
  return out;
}
function makePuzzle(kinds) {
  for (let tries = 0; tries < 400; tries++) {
    const kind = kinds[Math.floor(Math.random() * kinds.length)], px = Math.floor(Math.random() * 8), py = Math.floor(Math.random() * 8), en = [];
    const occ = (x, y) => en.some(e => e.x === x && e.y === y), free0 = reach(kind, px, py, () => false); if (!free0.length) continue;
    const [tx, ty] = free0[Math.floor(Math.random() * free0.length)], att = reach(kind, tx, ty, () => false).filter(([x, y]) => !(x === px && y === py)).sort(() => Math.random() - .5);
    for (const [x, y] of att) { if (en.length >= 2) break; if (x === tx && y === ty) continue; const e = { x, y }; en.push(e); const now = reach(kind, tx, ty, occ); if (en.some(q => !now.some(([a, b]) => a === q.x && b === q.y))) en.pop(); }
    if (en.length < 2) continue;
    const nDecoy = 1 + Math.floor(Math.random() * 2); for (let k = 0; k < nDecoy; k++) { const x = Math.floor(Math.random() * 8), y = Math.floor(Math.random() * 8); if (!occ(x, y) && !(x === px && y === py) && !(x === tx && y === ty)) en.push({ x, y }); }
    const moves = reach(kind, px, py, occ).filter(([x, y]) => !occ(x, y)); if (!moves.some(([x, y]) => x === tx && y === ty)) continue;
    const hits = (x, y) => reach(kind, x, y, (a, b) => occ(a, b)).filter(([a, b]) => occ(a, b)).length;
    if (hits(tx, ty) < 2 || moves.some(([x, y]) => !(x === tx && y === ty) && hits(x, y) >= 2)) continue;
    const EK = ['p', 'p', 'r', 'b', 'n', 'q', 'k']; en.forEach((e, i) => { e.k = i === 0 ? ['r', 'q', 'k'][Math.floor(Math.random() * 3)] : EK[Math.floor(Math.random() * EK.length)]; });
    return { kind, px, py, tx, ty, en, moves };
  }
  return { kind: 'n', px: 3, py: 4, tx: 4, ty: 2, en: [{ x: 2, y: 1, k: 'r' }, { x: 6, y: 3, k: 'q' }, { x: 0, y: 7, k: 'p' }], moves: reach('n', 3, 4, () => false) };
}
export function chessGame(E, o = {}) {
  const sq = 12, bx = 8, by = 7, n = 5, kinds = ['n'].concat(E.lvl >= 2 ? ['r'] : [], E.lvl >= 3 ? ['b'] : [], E.lvl >= 5 ? ['q'] : []), tl = (13 - 6 * E.d) * (o.blitz ? .75 : 1), parts = [], got = [], NAME = { n: 'knight', r: 'rook', b: 'bishop', q: 'queen' };
  let i = 0, pz = makePuzzle(kinds), t = 0, wait = 0, res = 0, moved = null; E.prog(0, n); E.cap(`Move your ${NAME[pz.kind]} to attack two pieces at once`);
  const g = { done: false, score: 0,
    update(dt) {
      stepParts(parts, dt); if (wait > 0) { wait -= dt; if (wait <= 0) { i++; E.prog(i, n); if (i >= n) { g.done = true; g.score = got.reduce((a, b) => a + b, 0) / n; return; } pz = makePuzzle(kinds); t = 0; moved = null; E.cap(`Move your ${NAME[pz.kind]} to attack two pieces at once`); } return; }
      t += dt; if (t >= tl) { got.push(0); res = 0; wait = 1; moved = [pz.tx, pz.ty]; E.cap('Time! It was there.'); E.beat(0, 'miss'); }
    },
    down(x, y) {
      if (wait > 0 || g.done) return; const cx = Math.floor((x - bx) / sq), cy = Math.floor((y - by) / sq); if (!pz.moves.some(([a, b]) => a === cx && b === cy)) return;
      moved = [cx, cy]; if (cx === pz.tx && cy === pz.ty) { got.push(.6 + .4 * clamp(1 - t / tl)); res = 1; wait = .8; E.cap('Fork!'); E.beat(1, 'fork'); spark(parts, bx + cx * sq + 6, by + cy * sq + 6, GOLD, 10); } else { got.push(0); res = 0; wait = 1.1; E.cap('Only one piece attacked from there.'); E.beat(0, 'miss'); }
    },
    draw(c) {
      R(c, bx - 2, by - 2, 8 * sq + 4, 8 * sq + 4, INK); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) R(c, bx + x * sq, by + y * sq, sq, sq, (x + y) % 2 ? '#b98a5a' : '#f2dfb8');
      if (wait <= 0) for (const [x, y] of pz.moves) R(c, bx + x * sq + 5, by + y * sq + 5, 2, 2, '#2a273388');
      if (wait > 0) { R(c, bx + pz.tx * sq, by + pz.ty * sq, sq, sq, res ? '#8fe07a' : '#f2c23099'); if (!res && moved && !(moved[0] === pz.tx && moved[1] === pz.ty)) R(c, bx + moved[0] * sq, by + moved[1] * sq, sq, sq, '#d8342e88'); const occ = (a, b) => pz.en.some(e => e.x === a && e.y === b); for (const [a, b] of reach(pz.kind, pz.tx, pz.ty, occ)) if (occ(a, b)) line(c, bx + pz.tx * sq + 6, by + pz.ty * sq + 6, bx + a * sq + 6, by + b * sq + 6, res ? GOOD : GOLD, 1); }
      for (const e of pz.en) piece(c, e.k, bx + e.x * sq + 2, by + e.y * sq + 2, '#3a3644', '#15131c');
      const mp = wait > 0 && res && moved ? moved : [pz.px, pz.py]; piece(c, pz.kind, bx + mp[0] * sq + 2, by + mp[1] * sq + 2 - (wait <= 0 ? Math.round(Math.abs(Math.sin(t * 4))) : 0), '#fffdf4', INK);
      const ix = bx + 8 * sq + 10; box(c, ix, by, W_ - ix - 6, 34, '#fffdf4'); piece(c, pz.kind, ix + 6, by + 5, '#fffdf4', INK); piece(c, pz.kind, ix + 20, by + 13, '#fffdf4', INK); piece(c, 'q', ix + 34, by + 5, '#3a3644', '#15131c'); piece(c, 'r', ix + 34, by + 20, '#3a3644', '#15131c'); line(c, ix + 28, by + 16, ix + 34, by + 10, GOLD); line(c, ix + 28, by + 18, ix + 34, by + 24, GOLD);
      box(c, ix, by + 40, W_ - ix - 6, 10, '#e9dcc0'); if (wait <= 0) R(c, ix + 1, by + 41, (W_ - ix - 8) * clamp(1 - t / tl), 8, t / tl > .7 ? BAD : GOLD);
      for (let k = 0; k < n; k++) { box(c, ix + k * 11, by + 58, 9, 9, k < got.length ? (got[k] > 0 ? GOOD : BAD) : '#e9dcc0'); }
      drawParts(c, parts);
    },
    want: () => (wait > 0 || g.done ? { type: 'tap', ready: false } : { type: 'tap', x: bx + pz.tx * sq + 6, y: by + pz.ty * sq + 6, ready: t > .25 }),
    stats: () => ({ solved: got.filter(v => v > 0).length, of: n }),
  };
  const W_ = E.W; return g;
}
