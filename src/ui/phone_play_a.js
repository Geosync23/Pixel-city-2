// PlayBox games, part A: Market Match (match-3), Rooftop Pidge (endless runner), One More Cast (fishing), Stack & Ship (block drop).
// Self-contained: each `create(api)` returns { update(dt), draw(g), down(x, y), move(x, y), up(x, y), score, over, status() } for the host in
// phone_play.js. The play field is api.W x api.H logical pixels (120 x 160), touch-first. api: { W, H, rnd(), text(g, s, x, y, c, left), blip(midi, dur), skin }.
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const disc = (g, x, y, r, c) => { x = Math.round(x); y = Math.round(y); for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); R(g, x - w, y + j, w * 2 + 1, 1, c); } };
const INK = '#2a2733';

/* ============================================================ Market Match */
const FOODS = [
  (g, x, y) => { disc(g, x + 6, y + 7, 5, '#e0483a'); R(g, x + 6, y, 1, 3, '#6a4a2a'); R(g, x + 7, y + 1, 3, 2, '#5fb84f'); R(g, x + 3, y + 4, 2, 2, '#f48a7a'); },                                  // apple
  (g, x, y) => { R(g, x + 3, y + 1, 7, 11, '#f6d24a'); for (let i = 0; i < 4; i++) R(g, x + 4 + (i % 2) * 3, y + 2 + i * 2, 2, 1, '#e0a020'); R(g, x + 1, y + 6, 3, 6, '#5fb84f'); R(g, x + 9, y + 6, 3, 6, '#5fb84f'); },   // corn
  (g, x, y) => { R(g, x + 2, y + 4, 8, 5, '#5a9ad8'); R(g, x + 3, y + 3, 6, 7, '#5a9ad8'); R(g, x + 10, y + 3, 2, 7, '#3b6ab0'); R(g, x + 4, y + 5, 1, 1, INK); R(g, x + 3, y + 8, 5, 1, '#a8d0f0'); },         // fish
  (g, x, y) => { disc(g, x + 6, y + 6, 5, '#f28fb0'); disc(g, x + 6, y + 6, 2, '#fff4dc'); R(g, x + 3, y + 3, 1, 1, '#fff'); R(g, x + 8, y + 4, 1, 1, '#f6d24a'); R(g, x + 4, y + 9, 1, 1, '#6fb3e0'); },   // donut
  (g, x, y) => { R(g, x + 5, y + 6, 2, 6, '#8a5a3a'); disc(g, x + 6, y + 4, 4, '#3fae5a'); R(g, x + 2, y + 5, 9, 2, '#3fae5a'); R(g, x + 4, y + 2, 2, 1, '#8ad88a'); },                                   // broccoli
  (g, x, y) => { R(g, x + 1, y + 3, 10, 7, '#b8743a'); R(g, x + 3, y + 5, 2, 3, '#fff4dc'); R(g, x + 7, y + 5, 2, 3, '#fff4dc'); R(g, x + 5, y + 2, 2, 9, '#b8743a'); R(g, x + 2, y + 3, 1, 1, '#f4f0e8'); R(g, x + 9, y + 9, 1, 1, '#f4f0e8'); },  // pretzel
];
export function match(api) {
  const COLS = 6, ROWS = 7, C = 18, X0 = 6, Y0 = 30, K = FOODS.length, rnd = api.rnd;
  const cell = () => ({ k: Math.floor(rnd() * K), oy: 0, ox: 0, dead: 0 });
  let grid, moves = 20, score = 0, state = 'idle', timer = 0, combo = 0, sel = null, drag = null, over = false, pop = [], shake = 0;
  const at = (c, r) => (c >= 0 && r >= 0 && c < COLS && r < ROWS ? grid[r][c] : null);
  function matches() {
    const hit = new Set();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const k = grid[r][c].k; if (c + 2 < COLS && grid[r][c + 1].k === k && grid[r][c + 2].k === k) { let e = c; while (e < COLS && grid[r][e].k === k) hit.add(r * COLS + e++); } if (r + 2 < ROWS && grid[r + 1][c].k === k && grid[r + 2][c].k === k) { let e = r; while (e < ROWS && grid[e][c].k === k) hit.add(e++ * COLS + c); } }
    return hit;
  }
  const swap = (a, b) => { const t = grid[a[1]][a[0]]; grid[a[1]][a[0]] = grid[b[1]][b[0]]; grid[b[1]][b[0]] = t; };
  function hasMove() { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) for (const [dc, dr] of [[1, 0], [0, 1]]) { if (c + dc >= COLS || r + dr >= ROWS) continue; swap([c, r], [c + dc, r + dr]); const ok = matches().size > 0; swap([c, r], [c + dc, r + dr]); if (ok) return true; } return false; }
  function fill() { do { grid = []; for (let r = 0; r < ROWS; r++) { grid.push([]); for (let c = 0; c < COLS; c++) { let q; do { q = cell(); } while ((c > 1 && grid[r][c - 1].k === q.k && grid[r][c - 2].k === q.k) || (r > 1 && grid[r - 1][c].k === q.k && grid[r - 2][c].k === q.k)); grid[r].push(q); } } } while (!hasMove()); }
  fill();
  function trySwap(a, b) {
    if (state !== 'idle' || over || !at(...b)) return; swap(a, b);
    if (!matches().size) { swap(a, b); shake = .25; api.blip(48, .08); return; }
    const A = grid[a[1]][a[0]], B = grid[b[1]][b[0]]; A.ox = (b[0] - a[0]) * C; A.oy = (b[1] - a[1]) * C; B.ox = -A.ox; B.oy = -A.oy;
    moves--; combo = 0; state = 'settle'; sel = null;
  }
  function resolve() {
    const hit = matches();
    if (!hit.size) { state = 'idle'; if (moves <= 0) over = true; else if (!hasMove()) { fill(); for (const row of grid) for (const q of row) q.oy = -40; state = 'settle'; } return; }
    combo++; const pts = hit.size * 10 * combo; score += pts; api.blip(60 + combo * 4, .12);
    let sx = 0, sy = 0; for (const i of hit) { const q = grid[Math.floor(i / COLS)][i % COLS]; q.dead = 1; sx += i % COLS; sy += Math.floor(i / COLS); }
    pop.push({ x: X0 + sx / hit.size * C + 9, y: Y0 + sy / hit.size * C + 4, t: 0, s: '+' + pts }); state = 'clear'; timer = .22;
  }
  function drop() {
    for (let c = 0; c < COLS; c++) { let w = ROWS - 1; for (let r = ROWS - 1; r >= 0; r--) { const q = grid[r][c]; if (q.dead) continue; if (w !== r) { grid[w][c] = q; q.oy -= (w - r) * C; } w--; } let n = 0; for (let r = w; r >= 0; r--) { const q = cell(); n++; q.oy = -(w + 1) * C - n * 4; grid[r][c] = q; } }
    state = 'settle';
  }
  const cellAt = (x, y) => { const c = Math.floor((x - X0) / C), r = Math.floor((y - Y0) / C); return c >= 0 && r >= 0 && c < COLS && r < ROWS ? [c, r] : null; };
  return {
    get score() { return score; }, get over() { return over; }, status: () => `${moves} moves`,
    update(dt) {
      shake = Math.max(0, shake - dt); for (const p of pop) p.t += dt; pop = pop.filter(p => p.t < .8);
      if (state === 'clear') { timer -= dt; if (timer <= 0) drop(); }
      else if (state === 'settle') { let moving = false; for (const row of grid) for (const q of row) { for (const k of ['ox', 'oy']) if (q[k]) { const s = Math.sign(q[k]), v = Math.max(90, Math.abs(q[k]) * 9) * dt; q[k] = Math.abs(q[k]) <= v ? 0 : q[k] - s * v; if (q[k]) moving = true; } } if (!moving) resolve(); }
    },
    draw(g) {
      R(g, 0, 0, api.W, api.H, '#f4e0c0'); R(g, 0, 0, api.W, 26, '#e0703a'); for (let i = 0; i < 8; i++) R(g, i * 16, 22, 8, 4, '#fff4dc'); api.text(g, 'MARKET MATCH', 60, 5, '#fff4dc'); api.text(g, `MOVES ${moves}`, 60, 14, '#ffe0b0');
      R(g, X0 - 2, Y0 - 2, COLS * C + 4, ROWS * C + 4, '#b8864a'); R(g, X0 - 1, Y0 - 1, COLS * C + 2, ROWS * C + 2, '#fff4dc');
      g.save(); g.beginPath(); g.rect(X0 - 1, Y0 - 1, COLS * C + 2, ROWS * C + 2); g.clip();
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const q = grid[r][c], x = X0 + c * C + q.ox + (shake && sel && sel[0] === c && sel[1] === r ? Math.sin(shake * 60) * 2 : 0), y = Y0 + r * C + q.oy;
        if ((c + r) % 2) R(g, X0 + c * C, Y0 + r * C, C, C, '#f8ead0');
        if (sel && sel[0] === c && sel[1] === r) R(g, x, y, C, C, '#f6d24a');
        if (q.dead && state === 'clear') { g.globalAlpha = Math.max(0, timer / .22); R(g, x + 1, y + 1, C - 2, C - 2, '#fff'); FOODS[q.k](g, x + 3, y + 3); g.globalAlpha = 1; } else FOODS[q.k](g, x + 3, y + 3);
      }
      g.restore(); for (const p of pop) api.text(g, p.s, p.x, p.y - p.t * 14, p.t < .5 ? INK : '#8a7a6a');
      if (combo > 1 && state !== 'idle') api.text(g, `COMBO X${combo}`, 60, Y0 + ROWS * C + 3, '#e0703a');
    },
    down(x, y) { if (state !== 'idle' || over) return; const c = cellAt(x, y); if (!c) { sel = null; return; } if (sel && Math.abs(sel[0] - c[0]) + Math.abs(sel[1] - c[1]) === 1) { const a = sel; sel = c; trySwap(a, c); drag = null; return; } sel = c; drag = { x, y, c }; },
    move(x, y) { if (!drag || state !== 'idle') return; const dx = x - drag.x, dy = y - drag.y; if (Math.max(Math.abs(dx), Math.abs(dy)) < 7) return; const d = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)], a = drag.c; drag = null; trySwap(a, [a[0] + d[0], a[1] + d[1]]); },
    up() { drag = null; },
  };
}
export const matchArt = (g) => { R(g, 0, 0, 16, 16, '#fff4dc'); g.save(); g.translate(2, 1); FOODS[0](g, 0, 0); g.restore(); };

/* ============================================================ Rooftop Pidge */
export function pidge(api) {
  const W = api.W, H = api.H, rnd = api.rnd, PX = 26, skin = api.skin;
  const body = skin === 'gold' ? ['#f2c230', '#c79a2a', '#fff2a0'] : skin === 'gull' ? ['#f4f4f0', '#c8ccd4', '#ffffff'] : ['#8a94a4', '#6a7484', '#a4aebc'];
  let roofs = [{ x: 0, w: 80, y: 112 }], y = 100, vy = 0, ground = true, flaps = 1, dist = 0, bonus = 0, over = false, t = 0, speed = 46, crumbs = [], dead = 0, puff = [];
  function grow() { let last = roofs[roofs.length - 1]; while (last.x + last.w < W + 60) { const gap = 12 + rnd() * (10 + Math.min(16, dist / 60)), ny = Math.max(70, Math.min(134, last.y + (rnd() * 40 - 22))), w = 34 + rnd() * 40, r = { x: last.x + last.w + gap, w, y: ny, seed: rnd() }; roofs.push(r); if (rnd() < .6) crumbs.push({ x: r.x + 8 + rnd() * (w - 16), y: ny - 12 - rnd() * 16, got: false }); last = r; } }
  grow();
  const under = () => roofs.find(r => PX + 3 >= r.x && PX - 3 <= r.x + r.w);
  return {
    get score() { return Math.floor(dist / 6) + bonus; }, get over() { return over; }, status: () => `${Math.floor(dist / 6)} m`,
    update(dt) {
      t += dt; if (dead) { dead += dt; y += vy * dt; vy += 500 * dt; if (dead > .9) over = true; return; }
      speed = Math.min(96, 46 + dist / 40); const dx = speed * dt; dist += dx; for (const r of roofs) r.x -= dx; for (const c of crumbs) c.x -= dx; for (const p of puff) { p.x -= dx; p.t += dt; } puff = puff.filter(p => p.t < .4);
      roofs = roofs.filter(r => r.x + r.w > -20); crumbs = crumbs.filter(c => c.x > -10 && !c.got); grow();
      const prev = y; vy += 520 * dt; y += vy * dt; const r = under();
      if (r && vy >= 0 && prev <= r.y + 1 && y >= r.y) { y = r.y; vy = 0; if (!ground) puff.push({ x: PX, y, t: 0 }); ground = true; flaps = 1; }
      else if (r && y > r.y + 3 && prev > r.y + 1) { dead = .01; vy = -60; api.blip(40, .2); }   // hit the wall of a building
      else if (!r || y < r.y) ground = false;
      if (y > H + 10 && !dead) { dead = .5; api.blip(40, .2); }
      for (const c of crumbs) if (!c.got && Math.abs(c.x - PX) < 7 && Math.abs(c.y - (y - 4)) < 8) { c.got = true; bonus += 10; api.blip(76, .08); }
    },
    draw(g) {
      R(g, 0, 0, W, H, '#8ad0f0'); R(g, 0, 90, W, 70, '#b8e0f4'); disc(g, 96, 22, 8, '#fff0a0');
      for (let i = 0; i < 9; i++) { const bx = ((i * 22 - dist * .25) % 198 + 198) % 198 - 30, bh = 30 + ((i * 37) % 40); R(g, bx, H - bh, 18, bh, '#9ec4dc'); }
      for (let i = 0; i < 3; i++) { const cx = ((i * 70 - dist * .1) % 210 + 210) % 210 - 40; R(g, cx, 14 + i * 12, 22, 5, '#f4fbfc'); R(g, cx + 5, 10 + i * 12, 12, 5, '#f4fbfc'); }
      for (const r of roofs) { const c = ['#c8785a', '#8a7a98', '#7a9a8a', '#b89a6a'][Math.floor((r.seed || 0) * 4)]; R(g, r.x, r.y, r.w, H - r.y, c); R(g, r.x - 1, r.y, r.w + 2, 3, '#4a3a44'); for (let wy = r.y + 8; wy < H; wy += 10) for (let wx = r.x + 4; wx < r.x + r.w - 5; wx += 8) R(g, wx, wy, 4, 5, ((wx + wy) | 0) % 3 ? '#f8e8b0' : '#5a6a84'); if ((r.seed || 0) > .5) { R(g, r.x + r.w - 10, r.y - 9, 1, 9, '#4a3a44'); R(g, r.x + r.w - 13, r.y - 9, 7, 1, '#4a3a44'); } else if (r.w > 44) { R(g, r.x + 6, r.y - 7, 8, 7, '#6a5a64'); R(g, r.x + 5, r.y - 8, 10, 2, '#4a3a44'); } }
      for (const c of crumbs) { const b = Math.sin(t * 5 + c.x) * 1.5; R(g, c.x - 3, c.y - 2 + b, 7, 5, '#b8743a'); R(g, c.x - 1, c.y + b, 1, 1, '#fff4dc'); R(g, c.x + 1, c.y + b, 1, 1, '#fff4dc'); }
      for (const p of puff) { g.globalAlpha = 1 - p.t / .4; R(g, p.x - 6 - p.t * 10, p.y - 2, 3, 2, '#fff'); R(g, p.x + 3 + p.t * 10, p.y - 2, 3, 2, '#fff'); g.globalAlpha = 1; }
      const py = Math.round(y), f = Math.floor(t * (ground ? 10 : 16)) % 2;
      R(g, PX - 5, py - 6, 9, 6, body[0]); R(g, PX + 2, py - 10, 5, 5, body[1]); R(g, PX + 7, py - 8, 2, 1, '#f2a040'); R(g, PX + 4, py - 9, 1, 1, dead ? '#d63a3a' : '#fff'); R(g, PX - 7, py - 5, 2, 2, body[1]);
      if (ground) { R(g, PX - 3, py, 1, 1 + f, '#f2a040'); R(g, PX + 1, py, 1, 2 - f, '#f2a040'); R(g, PX - 3, py - 5, 5, 3, body[2]); } else if (f) R(g, PX - 4, py - 11, 6, 5, body[2]); else R(g, PX - 4, py - 4, 6, 5, body[2]);
      api.text(g, `${Math.floor(dist / 6)} M`, 4, 4, INK, true); if (bonus) api.text(g, `+${bonus}`, 4, 12, '#8a4a1a', true); if (dist < 60) api.text(g, 'TAP TO HOP', 60, 40, INK);
    },
    down() { if (dead || over) return; if (ground) { vy = -205; ground = false; api.blip(64, .06); } else if (flaps > 0) { flaps--; vy = -175; api.blip(69, .06); } },
    move() { }, up() { if (vy < -70 && !ground) vy *= .55; },
  };
}
export const pidgeArt = (g) => { R(g, 0, 0, 16, 16, '#8ad0f0'); R(g, 0, 11, 16, 5, '#c8785a'); R(g, 0, 11, 16, 1, '#4a3a44'); R(g, 3, 5, 8, 6, '#8a94a4'); R(g, 9, 2, 4, 4, '#6a7484'); R(g, 13, 4, 2, 1, '#f2a040'); R(g, 11, 3, 1, 1, '#fff'); R(g, 4, 6, 4, 3, '#a4aebc'); };

/* ============================================================ One More Cast */
export function cast(api) {
  const W = api.W, H = api.H, rnd = api.rnd, SURF = 36, HX = 60;
  let depth = 0, hold = false, score = 0, time = 60, over = false, t = 0, fish = [], caught = null, pop = [], spawn = 0;
  const KINDS = [{ k: 'small', c: '#f08a2c', pts: 10, w: 8, y0: 46, y1: 84, v: 20 }, { k: 'mid', c: '#5a9ad8', pts: 25, w: 11, y0: 78, y1: 118, v: 28 }, { k: 'gold', c: '#f6d24a', pts: 60, w: 13, y0: 116, y1: 148, v: 40 }, { k: 'boot', c: '#6a5a4a', pts: -15, w: 9, y0: 60, y1: 140, v: 12 }];
  function add() { const r = rnd(), K = KINDS[r < .42 ? 0 : r < .74 ? 1 : r < .86 ? 2 : 3], dir = rnd() < .5 ? 1 : -1; fish.push({ K, x: dir > 0 ? -16 : W + 16, y: K.y0 + rnd() * (K.y1 - K.y0), dir, v: K.v * (.8 + rnd() * .5), ph: rnd() * 6 }); }
  for (let i = 0; i < 5; i++) { add(); fish[i].x = rnd() * W; }
  return {
    get score() { return Math.max(0, score); }, get over() { return over; }, status: () => `${Math.ceil(time)} s`,
    update(dt) {
      t += dt; time -= dt; if (time <= 0) { time = 0; over = true; return; }
      depth = Math.max(0, Math.min(H - SURF - 8, depth + (hold ? 52 : -78) * dt)); const hy = SURF + depth;
      spawn -= dt; if (spawn <= 0 && fish.length < 9) { add(); spawn = .7 + rnd() * .8; }
      for (const f of fish) { if (f === caught) { f.x = HX - f.K.w / 2; f.y = hy + 2; continue; } f.x += f.dir * f.v * dt; f.yy = f.y + Math.sin(t * 2 + f.ph) * 2; if (!caught && depth > 4 && Math.abs(f.x + f.K.w / 2 - HX) < f.K.w / 2 + 2 && Math.abs(f.yy + 3 - hy) < 6) { caught = f; api.blip(f.K.pts < 0 ? 44 : 67, .08); } }
      fish = fish.filter(f => f === caught || (f.x > -30 && f.x < W + 30));
      if (caught && depth <= 0.5) { score += caught.K.pts; pop.push({ s: (caught.K.pts > 0 ? '+' : '') + caught.K.pts, t: 0, bad: caught.K.pts < 0 }); api.blip(caught.K.pts < 0 ? 40 : 79, .14); fish = fish.filter(f => f !== caught); caught = null; }
      for (const p of pop) p.t += dt; pop = pop.filter(p => p.t < 1);
    },
    draw(g) {
      R(g, 0, 0, W, SURF, '#f4b890'); R(g, 0, 0, W, 12, '#f08a6a'); disc(g, 96, 20, 7, '#fff4d0'); R(g, 0, SURF, W, H - SURF, '#2f8fa8'); R(g, 0, SURF + 40, W, H, '#28809a'); R(g, 0, SURF + 80, W, H, '#1e6a84'); R(g, 0, H - 8, W, 8, '#c8b078');
      for (let i = 0; i < 8; i++) R(g, (i * 17 + Math.sin(t + i) * 3) % W, SURF + (i % 2), 9, 1, '#bfe6f0'); for (let i = 0; i < 5; i++) { const x = 10 + i * 25; R(g, x, H - 8 - 8 - (i % 3) * 4 + Math.sin(t * 1.5 + i) * 1, 2, 10 + (i % 3) * 4, '#3fae5a'); }
      R(g, 0, SURF - 8, 46, 4, '#8a5a3a'); for (let x = 4; x < 46; x += 12) R(g, x, SURF - 4, 2, 20, '#6a4a2a');
      R(g, 30, SURF - 19, 3, 5, '#3c64ad'); R(g, 30, SURF - 22, 3, 3, '#e8c0a0'); R(g, 29, SURF - 23, 5, 1, '#e0703a'); R(g, 30, SURF - 14, 1, 6, INK); R(g, 32, SURF - 14, 1, 6, INK);
      g.strokeStyle = '#6a4a2a'; g.beginPath(); g.moveTo(33, SURF - 17); g.lineTo(HX, SURF - 30); g.stroke(); const hy = SURF + depth; R(g, HX, SURF - 30, 1, hy - SURF + 30, '#f4fbfc'); R(g, HX - 1, hy, 3, 2, '#c8c8d0'); R(g, HX - 2, hy + 2, 1, 2, '#c8c8d0'); R(g, HX - 1, hy + 4, 2, 1, '#c8c8d0');
      for (const f of fish) { const y = f === caught ? f.y : f.yy || f.y, K = f.K, x = f.x; if (K.k === 'boot') { R(g, x, y, 4, 7, K.c); R(g, x, y + 5, 9, 3, K.c); R(g, x, y, 4, 1, '#3a2a20'); continue; } R(g, x, y, K.w, 5 + (K.k === 'gold' ? 2 : 0), K.c); R(g, f.dir > 0 ? x - 3 : x + K.w, y + 1, 3, 4, K.c); R(g, f.dir > 0 ? x + K.w - 3 : x + 2, y + 1, 1, 1, INK); R(g, x + 2, y + 4, K.w - 4, 1, '#ffffff60'); if (K.k === 'gold' && Math.floor(t * 6) % 2) R(g, x + 4, y - 2, 1, 1, '#fff'); }
      api.text(g, `${Math.ceil(time)} S`, W - 4 - 16, 4, time < 10 ? '#c92a2a' : INK, true); api.text(g, String(Math.max(0, score)), 4, 4, INK, true); for (const p of pop) api.text(g, p.s, HX + 12, SURF - 14 - p.t * 12, p.bad ? '#c92a2a' : '#2a6a2a');
      if (t < 4) api.text(g, 'HOLD TO SINK', 60, 60, '#fff4dc');
    },
    down() { hold = true; }, move() { }, up() { hold = false; },
  };
}
export const castArt = (g) => { R(g, 0, 0, 16, 5, '#f4b890'); R(g, 0, 5, 16, 11, '#2f8fa8'); R(g, 8, 0, 1, 10, '#fff'); R(g, 7, 10, 3, 2, '#c8c8d0'); R(g, 2, 8, 6, 4, '#f08a2c'); R(g, 0, 9, 2, 3, '#f08a2c'); R(g, 6, 9, 1, 1, INK); R(g, 10, 12, 5, 3, '#f6d24a'); };

/* ============================================================ Stack & Ship */
export function stack(api) {
  const W = api.W, H = api.H, CH = 12, gift = api.skin === 'gift';
  let crates = [{ x: 36, w: 48 }], cur = null, falling = null, cut = [], t = 0, over = false, cam = 0, perfect = 0, flash = 0, sway = 0;
  const topY = n => H - 22 - n * CH;
  const next = () => { const top = crates[crates.length - 1]; cur = { w: top.w, ph: Math.random() * 6.28, sp: 1.4 + crates.length * .09 }; };
  next();
  const curX = () => (W - cur.w) / 2 + Math.sin(t * cur.sp + cur.ph) * (W - cur.w) / 2 * .92;
  const col = i => (gift ? ['#e0527a', '#3fae5a', '#3b82d6', '#f2c230'][i % 4] : ['#b8794a', '#a86a3a', '#c78a52'][i % 3]);
  const box = (g, x, y, w, i) => { R(g, x, y, w, CH, col(i)); R(g, x, y, w, 1, '#ffffff50'); R(g, x, y + CH - 1, w, 1, '#00000040'); if (gift) { R(g, x + w / 2 - 1, y, 2, CH, '#fff4dc'); R(g, x, y + 5, w, 2, '#fff4dc'); } else { R(g, x + 2, y + 2, 1, CH - 4, '#00000030'); R(g, x + w - 3, y + 2, 1, CH - 4, '#00000030'); if (w > 14) R(g, x + w / 2 - 3, y + 4, 6, 4, '#f4e0c0'); } };
  return {
    get score() { return crates.length - 1; }, get over() { return over; }, status: () => `${crates.length - 1} crates`,
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt); const want = Math.max(0, (crates.length - 6) * CH); cam += (want - cam) * Math.min(1, dt * 5);
      for (const c of cut) { c.vy += 400 * dt; c.y += c.vy * dt; c.x += c.vx * dt; } cut = cut.filter(c => c.y < H + cam + 30);
      if (falling) {
        falling.y += 260 * dt; const ty = topY(crates.length);
        if (falling.y >= ty) {
          const top = crates[crates.length - 1], x0 = Math.max(falling.x, top.x), x1 = Math.min(falling.x + falling.w, top.x + top.w), ov = x1 - x0;
          if (ov <= 1) { cut.push({ x: falling.x, y: ty, w: falling.w, vy: 0, vx: falling.x < top.x ? -30 : 30, i: crates.length }); falling = null; over = true; api.blip(40, .25); return; }
          if (Math.abs(falling.x - top.x) < 2.2) { crates.push({ x: top.x, w: top.w }); perfect++; flash = .3; api.blip(72 + Math.min(12, perfect * 2), .1); }
          else { perfect = 0; crates.push({ x: x0, w: ov }); if (falling.x < top.x) cut.push({ x: falling.x, y: ty, w: top.x - falling.x, vy: 0, vx: -24, i: crates.length }); else cut.push({ x: x1, y: ty, w: falling.x + falling.w - x1, vy: 0, vx: 24, i: crates.length }); api.blip(57, .08); }
          falling = null; sway = .2; next();
        }
      }
    },
    draw(g) {
      R(g, 0, 0, W, H, '#bfe0f0'); R(g, 0, 0, W, 50, '#a8d4ec'); for (let i = 0; i < 3; i++) R(g, 10 + i * 40, 20 + i * 8 + cam * .1, 20, 4, '#f4fbfc');
      g.save(); g.translate(0, Math.round(cam));
      R(g, 0, H - 10, W, 40, '#3a7aa8'); R(g, 0, H - 22, W, 12, '#6a6a74'); R(g, 0, H - 22, W, 2, '#8a8a94'); R(g, 6, H - 40, 18, 18, '#d63a3a'); R(g, 8, H - 46, 14, 6, '#f4f0e8'); R(g, 96, H - 32, 20, 10, '#3c64ad');
      crates.forEach((c, i) => box(g, c.x, topY(i) , c.w, i)); for (const c of cut) box(g, c.x, c.y, c.w, c.i);
      if (flash > 0) { const c = crates[crates.length - 1]; g.globalAlpha = flash / .3; R(g, c.x - 2, topY(crates.length - 1) - 2, c.w + 4, CH + 4, '#fff'); g.globalAlpha = 1; }
      const hy = topY(crates.length) - 34;
      if (cur && !falling && !over) { const x = curX(); R(g, 0, hy - 8, W, 2, '#4a4a54'); R(g, x + cur.w / 2 - 3, hy - 8, 6, 4, '#f2c230'); R(g, x + cur.w / 2, hy - 4, 1, 4, INK); box(g, x, hy, cur.w, crates.length); }
      if (falling) box(g, falling.x, falling.y, falling.w, crates.length);
      g.restore();
      api.text(g, `${crates.length - 1}`, 60, 6, INK); if (perfect > 1) api.text(g, `PERFECT X${perfect}`, 60, 16, '#e0703a'); if (crates.length === 1 && !falling) api.text(g, 'TAP TO DROP', 60, 30, INK);
    },
    down() { if (over || falling || !cur) return; falling = { x: curX(), y: topY(crates.length) - 34, w: cur.w }; cur = null; },
    move() { }, up() { },
  };
}
export const stackArt = (g) => { R(g, 0, 0, 16, 16, '#bfe0f0'); R(g, 0, 14, 16, 2, '#6a6a74'); R(g, 3, 9, 10, 5, '#b8794a'); R(g, 4, 4, 9, 5, '#a86a3a'); R(g, 6, 0, 6, 4, '#c78a52'); R(g, 3, 9, 10, 1, '#ffffff50'); R(g, 4, 4, 9, 1, '#ffffff50'); };
