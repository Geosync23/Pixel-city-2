// PlayBox games, part B: Bay Pairs (memory), Cab Connect (turn the street tiles), Tap the Beat (rhythm). Same contract as phone_play_a.js.
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const disc = (g, x, y, r, c) => { x = Math.round(x); y = Math.round(y); for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); R(g, x - w, y + j, w * 2 + 1, 1, c); } };
const INK = '#2a2733';

/* ============================================================ Bay Pairs */
const LAND = [
  ['LIGHT', (g, x, y) => { R(g, x + 7, y + 4, 6, 16, '#f4f0e8'); R(g, x + 7, y + 10, 6, 3, '#c0392b'); R(g, x + 6, y + 2, 8, 3, INK); R(g, x + 8, y + 3, 4, 1, '#fff2a0'); R(g, x + 3, y + 20, 14, 2, '#6a8a5a'); R(g, x + 14, y + 3, 5, 1, '#fff2a0'); }],
  ['FERRY', (g, x, y) => { R(g, x + 1, y + 13, 18, 5, '#f4f0e8'); R(g, x + 2, y + 17, 16, 1, '#c0392b'); R(g, x + 5, y + 8, 10, 5, '#d8d4cc'); R(g, x + 9, y + 3, 3, 5, INK); for (let i = 0; i < 3; i++) R(g, x + 6 + i * 3, y + 10, 2, 2, '#5a9ad8'); R(g, x, y + 19, 20, 3, '#3a8ab8'); }],
  ['WHEEL', (g, x, y) => { for (let a = 0; a < 6.28; a += .2) R(g, x + 10 + Math.cos(a) * 8, y + 10 + Math.sin(a) * 8, 1, 1, '#8a90a4'); for (let i = 0; i < 6; i++) R(g, x + 9 + Math.cos(i * 1.05) * 8, y + 9 + Math.sin(i * 1.05) * 8, 3, 3, ['#d63a3a', '#f6e04a', '#3c64ad'][i % 3]); R(g, x + 9, y + 9, 2, 2, INK); R(g, x + 6, y + 20, 9, 2, '#6a7084'); }],
  ['MAPLE', (g, x, y) => { disc(g, x + 10, y + 9, 7, '#e0703a'); disc(g, x + 6, y + 11, 4, '#e8843a'); disc(g, x + 14, y + 11, 4, '#d85a2a'); R(g, x + 9, y + 14, 2, 8, '#6a4a2a'); R(g, x + 8, y + 5, 2, 2, '#f6b04a'); }],
  ['TRAIN', (g, x, y) => { R(g, x + 1, y + 7, 18, 10, '#e8eef0'); R(g, x + 1, y + 13, 18, 2, '#2fb0a0'); for (let i = 0; i < 3; i++) R(g, x + 3 + i * 5, y + 9, 4, 3, '#3a4a5a'); R(g, x + 3, y + 17, 3, 2, INK); R(g, x + 14, y + 17, 3, 2, INK); R(g, x, y + 20, 20, 1, '#6a6a74'); }],
  ['PIGEON', (g, x, y) => { R(g, x + 4, y + 9, 10, 7, '#8a94a4'); R(g, x + 11, y + 4, 5, 6, '#6a7484'); R(g, x + 11, y + 8, 5, 1, '#5aa890'); R(g, x + 16, y + 6, 2, 1, '#f2a040'); R(g, x + 13, y + 5, 1, 1, '#fff'); R(g, x + 6, y + 10, 5, 4, '#a4aebc'); R(g, x + 6, y + 16, 1, 3, '#f2a040'); R(g, x + 10, y + 16, 1, 3, '#f2a040'); }],
  ['OTTER', (g, x, y) => { R(g, x + 6, y + 8, 8, 12, '#7a5234'); R(g, x + 8, y + 12, 4, 7, '#c8a078'); R(g, x + 6, y + 3, 8, 6, '#7a5234'); R(g, x + 8, y + 6, 4, 2, '#c8a078'); R(g, x + 7, y + 5, 1, 1, INK); R(g, x + 12, y + 5, 1, 1, INK); R(g, x + 5, y + 3, 1, 1, '#7a5234'); R(g, x + 14, y + 3, 1, 1, '#7a5234'); R(g, x + 14, y + 18, 4, 2, '#5a3a24'); }],
  ['CLOCK', (g, x, y) => { R(g, x + 6, y + 2, 8, 20, '#c8a888'); R(g, x + 5, y + 1, 10, 2, '#8a6a58'); disc(g, x + 10, y + 8, 3, '#fff4dc'); R(g, x + 10, y + 6, 1, 3, INK); R(g, x + 10, y + 8, 2, 1, INK); R(g, x + 8, y + 16, 4, 6, '#6a4a3a'); }],
];
export function pairs(api) {
  const W = api.W, rnd = api.rnd, CW = 26, CHh = 31, X0 = 4, Y0 = 26, GAP = 2;
  const deck = []; for (let i = 0; i < 8; i++) deck.push(i, i); for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const cards = deck.map((k, i) => ({ k, up: 0, done: false, flip: 0, c: i % 4, r: Math.floor(i / 4) }));
  let open = [], turns = 0, found = 0, time = 0, wait = 0, over = false, final = 0, streak = 0;
  const calc = () => Math.max(50, Math.round(1000 - Math.max(0, turns - 8) * 35 - time * 2));
  return {
    get score() { return over ? final : found * 40; }, get over() { return over; }, status: () => `${turns} turns`, dbg: () => ({ wait, open: open.length, X0, Y0, CW, CHh, GAP, cards: cards.map(c => ({ k: c.k, up: c.up, done: c.done, c: c.c, r: c.r })) }),
    update(dt) {
      if (found < 8) time += dt; for (const c of cards) { const tgt = c.up || c.done ? 1 : 0; c.flip += Math.sign(tgt - c.flip) * Math.min(Math.abs(tgt - c.flip), dt * 7); }
      if (wait > 0) { wait -= dt; if (wait <= 0) { if (open.length === 2) { const [a, b] = open; if (a.k === b.k) { a.done = b.done = true; found++; streak++; api.blip(72 + streak * 2, .12); } else { a.up = b.up = 0; streak = 0; } open = []; } if (found === 8 && !over) { final = calc(); wait = .9; found = 9; } else if (found === 9) over = true; } }
    },
    draw(g) {
      R(g, 0, 0, W, api.H, '#3a2c5a'); api.text(g, 'BAY PAIRS', 60, 5, '#fff4dc'); api.text(g, found >= 8 ? 'ALL EIGHT FOUND!' : `TURNS ${turns}   ${Math.floor(time)} S`, 60, 14, found >= 8 ? '#f2c230' : '#c8b8e8');
      for (const c of cards) {
        const x = X0 + c.c * (CW + GAP + 1), y = Y0 + c.r * (CHh + GAP), k = Math.abs(c.flip * 2 - 1), w = Math.max(2, CW * k), fx = x + (CW - w) / 2, face = c.flip > .5;
        R(g, fx, y, w, CHh, INK);
        if (face) { R(g, fx + 1, y + 1, w - 2, CHh - 2, c.done ? '#dff5d8' : '#fff4dc'); if (k > .7) { LAND[c.k][1](g, x + 3, y + 1); api.text(g, LAND[c.k][0], x + CW / 2, y + CHh - 7, '#6a5a7a'); } }
        else { R(g, fx + 1, y + 1, w - 2, CHh - 2, '#8a5cc2'); if (k > .7) { R(g, x + 4, y + 4, CW - 8, CHh - 8, '#7a4cb2'); R(g, x + 11, y + 12, 4, 7, '#f2c230'); R(g, x + 9, y + 14, 8, 3, '#f2c230'); } }
      }
    },
    down(x, y) {
      if (over || wait > 0 || open.length >= 2) return; const c = cards.find(q => x >= X0 + q.c * (CW + GAP + 1) && x < X0 + q.c * (CW + GAP + 1) + CW && y >= Y0 + q.r * (CHh + GAP) && y < Y0 + q.r * (CHh + GAP) + CHh);
      if (!c || c.up || c.done) return; c.up = 1; open.push(c); api.blip(64, .05); if (open.length === 2) { turns++; wait = open[0].k === open[1].k ? .35 : .8; }
    },
    move() { }, up() { },
  };
}
export const pairsArt = (g) => { R(g, 0, 0, 16, 16, '#3a2c5a'); R(g, 1, 2, 6, 9, '#8a5cc2'); R(g, 8, 5, 7, 10, '#fff4dc'); R(g, 10, 7, 3, 6, '#f4f0e8'); R(g, 10, 9, 3, 1, '#c0392b'); R(g, 9, 6, 5, 1, INK); R(g, 3, 5, 2, 3, '#f2c230'); };

/* ============================================================ Cab Connect */
// tile openings as bits N=1, E=2, S=4, W=8; rot() turns a tile clockwise
const rot = m => ((m << 1) & 15) | (m >> 3);
const DIRS = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];   // dx, dy, my bit, their bit
export function cab(api) {
  const W = api.W, rnd = api.rnd, N = 4, C = 26, X0 = 8, Y0 = 36;
  let grid, src, dst, time = 90, score = 0, fares = 0, over = false, win = 0, lit = new Set(), t = 0, spin = [];
  function gen() {
    src = Math.floor(rnd() * N); dst = Math.floor(rnd() * N); grid = Array.from({ length: N * N }, () => 0);
    // random self-avoiding path from the left column (row src) to the right column (row dst)
    let path = null; for (let tries = 0; tries < 200 && !path; tries++) { const seen = new Set([src * N]), p = [[0, src]]; let x = 0, y = src; for (let s = 0; s < 40; s++) { if (x === N - 1 && y === dst) { path = p; break; } const opts = DIRS.map(d => [x + d[0], y + d[1]]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !seen.has(b * N + a)); if (!opts.length) break; const nx = opts[Math.floor(rnd() * opts.length)]; x = nx[0]; y = nx[1]; seen.add(y * N + x); p.push(nx); } }
    if (!path) { path = []; for (let x = 0; x < N; x++) path.push([x, src]); dst = src; }
    path.forEach(([x, y], i) => { let m = 0; const pv = i ? path[i - 1] : [-1, y], nx = i < path.length - 1 ? path[i + 1] : [N, y]; for (const q of [pv, nx]) { const d = DIRS.find(k => k[0] === q[0] - x && k[1] === q[1] - y); m |= d[2]; } grid[y * N + x] = m; });
    for (let i = 0; i < N * N; i++) { if (!grid[i]) grid[i] = [5, 3, 3, 7, 5, 3][Math.floor(rnd() * 6)]; const k = Math.floor(rnd() * 4); for (let j = 0; j < k; j++) grid[i] = rot(grid[i]); }
    spin = grid.map(() => 0); if (check()) { grid[src * N] = rot(grid[src * N]); check(); }
  }
  function check() {
    lit = new Set(); if (!(grid[src * N] & 8)) return; const st = [[0, src]]; lit.add(src * N);
    while (st.length) { const [x, y] = st.pop(), m = grid[y * N + x]; for (const d of DIRS) { if (!(m & d[2])) continue; const a = x + d[0], b = y + d[1]; if (a < 0 || b < 0 || a >= N || b >= N) continue; if (!(grid[b * N + a] & d[3]) || lit.has(b * N + a)) continue; lit.add(b * N + a); st.push([a, b]); } }
    return lit.has(dst * N + N - 1) && !!(grid[dst * N + N - 1] & 2);
  }
  gen();
  return {
    get score() { return score; }, get over() { return over; }, status: () => `${Math.ceil(time)} s`, dbg: () => ({ grid: grid.slice(), src, dst, N, C, X0, Y0, win, fares, time }),
    update(dt) { t += dt; time -= dt; for (let i = 0; i < spin.length; i++) spin[i] = Math.max(0, spin[i] - dt * 6); if (time <= 0) { time = 0; over = true; return; } if (win > 0) { win -= dt; if (win <= 0) { win = 0; gen(); } } },
    draw(g) {
      R(g, 0, 0, W, api.H, '#5a8a5a'); R(g, 0, 0, W, 30, '#3a3644'); api.text(g, 'CAB CONNECT', 60, 5, '#f2c230'); api.text(g, `FARES ${fares}   ${Math.ceil(time)} S`, 60, 15, time < 15 ? '#ff8a7a' : '#fff4dc');
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = y * N + x, m = grid[i], px = X0 + x * C, py = Y0 + y * C, on = lit.has(i), road = on ? (win > 0 ? '#f6d24a' : '#f2c230') : '#6a6a74', s = spin[i];
        R(g, px, py, C - 1, C - 1, '#7ab070'); R(g, px + 1 + s * 4, py + 1 + s * 4, C - 3 - s * 8, C - 3 - s * 8, '#8ac080');
        const cx = px + 9, cy = py + 9; R(g, cx, cy, 7, 7, road); if (m & 1) R(g, cx, py, 7, 9, road); if (m & 4) R(g, cx, cy + 7, 7, 9, road); if (m & 8) R(g, px, cy, 9, 7, road); if (m & 2) R(g, cx + 7, cy, 9, 7, road);
        R(g, cx + 3, cy + 3, 1, 1, '#fff4dc');
      }
      const sy = Y0 + src * C + 9, dy = Y0 + dst * C + 9; R(g, 0, sy, X0, 7, lit.size ? '#f2c230' : '#6a6a74'); R(g, X0 + N * C - 1, dy, W, 7, win > 0 ? '#f6d24a' : '#6a6a74');
      R(g, 0, sy - 3, 8, 6, '#f2c230'); R(g, 1, sy - 5, 5, 3, '#f2c230'); R(g, 2, sy - 4, 3, 2, '#6fb3e0'); R(g, 1, sy + 3, 2, 2, INK); R(g, 5, sy + 3, 2, 2, INK);
      R(g, W - 6, dy - 10, 1, 12, INK); R(g, W - 5, dy - 10, 5, 4, '#e05a3a');
      api.text(g, win > 0 ? 'FARE DELIVERED!' : 'TAP A TILE TO TURN IT', 60, 146, win > 0 ? '#f6d24a' : '#dff0d8');
    },
    down(x, y) { if (over || win > 0) return; const cx = Math.floor((x - X0) / C), cy = Math.floor((y - Y0) / C); if (cx < 0 || cy < 0 || cx >= N || cy >= N) return; const i = cy * N + cx; grid[i] = rot(grid[i]); spin[i] = 1; api.blip(62, .04); if (check()) { win = .7; fares++; score += 100 + Math.round(time / 3); api.blip(79, .2); } },
    move() { }, up() { },
  };
}
export const cabArt = (g) => { R(g, 0, 0, 16, 16, '#7ab070'); R(g, 0, 6, 9, 4, '#6a6a74'); R(g, 6, 6, 4, 10, '#6a6a74'); R(g, 1, 4, 7, 4, '#f2c230'); R(g, 2, 2, 4, 3, '#f2c230'); R(g, 3, 3, 2, 1, '#6fb3e0'); R(g, 2, 8, 2, 2, INK); R(g, 5, 8, 2, 2, INK); R(g, 13, 1, 1, 8, INK); R(g, 10, 1, 3, 3, '#e05a3a'); };

/* ============================================================ Tap the Beat */
// a 16-bar tune in C: lanes follow the melody's height (low / mid / high)
const TUNE_NOTES = [60, 64, 67, 64, 65, 69, 72, 69, 67, 64, 60, 64, 62, 65, 67, 0, 60, 64, 67, 72, 71, 67, 64, 67, 69, 65, 62, 65, 64, 60, 62, 0,
  72, 71, 69, 67, 65, 67, 69, 0, 67, 65, 64, 62, 60, 62, 64, 0, 60, 64, 67, 64, 65, 69, 72, 76, 74, 72, 69, 67, 72, 0, 72, 0];
export function beat(api) {
  const W = api.W, H = api.H, LINE = 134, SPB = .42, LEAD = 2.2, FALL = 1.5, LW = 40;
  const notes = []; TUNE_NOTES.forEach((m, i) => { if (m) notes.push({ t: LEAD + i * SPB, m, lane: m < 64 ? 0 : m < 69 ? 1 : 2, hit: 0 }); });
  const END = LEAD + TUNE_NOTES.length * SPB + 1.2;
  let t = 0, score = 0, streak = 0, best = 0, over = false, fx = [], press = [0, 0, 0], miss = 0, bassI = 0;
  const COL = ['#6ad8f0', '#f6d24a', '#f28fb0'];
  return {
    get score() { return score; }, get over() { return over; }, status: () => `streak ${streak}`, dbg: () => ({ t, LW, END, miss, best, notes: notes.map(n => ({ t: n.t, lane: n.lane, hit: n.hit })) }),
    update(dt) {
      t += dt; for (let i = 0; i < 3; i++) press[i] = Math.max(0, press[i] - dt * 5); for (const f of fx) f.t += dt; fx = fx.filter(f => f.t < .5);
      while (LEAD + bassI * SPB * 2 <= t && bassI * 2 < TUNE_NOTES.length) { api.blip([36, 41, 43, 36][Math.floor(bassI / 4) % 4], .22, 'bass'); bassI++; }
      for (const n of notes) if (!n.hit && t > n.t + .2) { n.hit = -1; streak = 0; miss++; }
      if (t >= END) over = true;
    },
    draw(g) {
      R(g, 0, 0, W, H, '#1a1030'); for (let i = 0; i < 3; i++) { R(g, i * LW, 0, LW, H, i % 2 ? '#221640' : '#1e1338'); R(g, i * LW, 0, 1, H, '#3a2a60'); if (press[i] > 0) { g.globalAlpha = press[i] * .5; R(g, i * LW, 0, LW, H, COL[i]); g.globalAlpha = 1; } }
      const pulse = Math.max(0, 1 - ((t - LEAD) / SPB % 1 + 1) % 1 * 2.5); R(g, 0, LINE - 1, W, 3, '#fff4dc'); g.globalAlpha = .25 + pulse * .3; R(g, 0, LINE - 4, W, 9, '#fff4dc'); g.globalAlpha = 1;
      for (let i = 0; i < 3; i++) { R(g, i * LW + 8, LINE + 8, LW - 16, 14, press[i] > 0 ? COL[i] : '#3a2a60'); R(g, i * LW + 8, LINE + 8, LW - 16, 2, COL[i]); }
      for (const n of notes) { if (n.hit) continue; const y = LINE - (n.t - t) / FALL * LINE; if (y < -8 || y > H) continue; R(g, n.lane * LW + 6, y - 4, LW - 12, 8, COL[n.lane]); R(g, n.lane * LW + 6, y - 4, LW - 12, 2, '#ffffff90'); R(g, n.lane * LW + 6, y + 3, LW - 12, 1, '#00000050'); }
      for (const f of fx) api.text(g, f.s, f.lane * LW + LW / 2, LINE - 14 - f.t * 16, f.c);
      api.text(g, String(score), 4, 4, '#fff4dc', true); if (streak > 2) api.text(g, `STREAK ${streak}`, W - 4 - (7 + String(streak).length) * 4, 4, '#f6d24a', true);
      if (t < LEAD) api.text(g, t < LEAD - .9 ? 'GET READY' : 'GO!', 60, 60, '#fff4dc'); if (t > END - 1) api.text(g, `BEST STREAK ${best}`, 60, 60, '#f6d24a');
    },
    down(x) {
      if (over) return; const lane = Math.max(0, Math.min(2, Math.floor(x / LW))); press[lane] = 1;
      let bn = null, bd = 9; for (const n of notes) { if (n.hit || n.lane !== lane) continue; const d = Math.abs(n.t - t); if (d < bd) { bd = d; bn = n; } }
      if (bn && bd <= .24) { bn.hit = 1; streak++; best = Math.max(best, streak); const perfect = bd <= .1, pts = Math.round((perfect ? 30 : 15) * (1 + Math.min(20, streak) / 10)); score += pts; fx.push({ lane, t: 0, s: perfect ? 'PERFECT' : 'GOOD', c: perfect ? '#f6d24a' : '#bfe6f0' }); api.blip(bn.m + 12, .25, 'piano'); }
      else { streak = 0; fx.push({ lane, t: 0, s: 'MISS', c: '#ff8a7a' }); api.blip(34, .08, 'bass'); }
    },
    move() { }, up() { },
  };
}
export const beatArt = (g) => { R(g, 0, 0, 16, 16, '#1a1030'); R(g, 5, 0, 1, 16, '#3a2a60'); R(g, 10, 0, 1, 16, '#3a2a60'); R(g, 0, 12, 16, 1, '#fff4dc'); R(g, 1, 3, 3, 2, '#6ad8f0'); R(g, 6, 8, 4, 2, '#f6d24a'); R(g, 12, 5, 3, 2, '#f28fb0'); R(g, 6, 13, 4, 2, '#f6d24a'); };
