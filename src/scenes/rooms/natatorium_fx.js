// Maple Bay Natatorium — live water, swimmers, splashes, fountains, LED boards and the pace clock (browser only; no game state; no init: a helper for the natatorium*.js rooms and sim/natatorium.js).
//   waterLayer(o)   animated water drawn as a ground underlay: o = { x0, y0, x1, y1 (world), depth(x, y) -> -1 outside | 0..1, top?(x, y, d, f) -> hex | null (things floating on the surface: lane ropes),
//                   floor?(x, y, d) -> hex | null (markings on the pool floor, seen through ripples), pal?, frames?, dz?, wall?, wave? (extra frame set with rolling crests) } -> { draw(ctx, cam, t), mode: 'calm' | 'wave', bounds }
//   swimSpr({ stroke, f, h, skin, hair, suit, cap, one, kid })  swimmer seen from above, heading h (0 +x, 1 +y, 2 -x, 3 -y)        wade(sprite, cutPx, f) -> a character sprite standing in water up to cutPx
//   tubeSpr(c, look, f)   ring float with a rider        diverSpr(shape, a16, look, arms)        cardSpr(text, c)        splash(sc, x, y, size)        jet(sc, x, y, z, kind) -> ent (fountain / shower / bucket curtain)
//   board(sc, o) -> LED / notice board on a back wall: { ent, clear(c), rect(u, v, w, h, c), text(s, u, v, c), w, h }      paceClock(sc, x, y, z, axis)      look(spec) -> { skin, hair, suit, one }      swimSpec(r, age)
//   person(sc, spec, x, y, dir, o)   a Char in the room (world coords)      sweep(sc)   remove finished effects
import { G } from '../../core/game.js';
import { WS, U, rng } from '../../engine/raster.js';
import { Char, charArt } from '../../core/char.js';

export const mkC = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const paint = (w, h, fn) => { const c = mkC(w, h), x = c.getContext('2d'); fn((px, py, col, ww = 1, hh = 1) => { x.fillStyle = col; x.fillRect(Math.round(px), Math.round(py), ww, hh); }, x); return c; };
const flipC = c => { const o = mkC(c.width, c.height), x = o.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return o; };
const shearC = (c, sg) => { const W = c.width, o = mkC(W, c.height + Math.ceil(W / 2)), x = o.getContext('2d'); x.imageSmoothingEnabled = false; for (let i = 0; i < W; i++) x.drawImage(c, i, 0, 1, c.height, i, sg > 0 ? (i >> 1) : ((W - 1 - i) >> 1), 1, c.height); return o; };
export const spr = (c, lit) => ({ c, l: lit ? c : null, x: -(c.width >> 1), y: -(c.height >> 1), w: c.width, h: c.height });
const FONT = { A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57555', N: '65555', O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55575', X: '55255', Y: '55222', Z: '71247',
  0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71222', 8: '75757', 9: '75716', ' ': '00000', '.': '00002', ',': '00024', '!': '22202', '?': '61202', '-': '00700', '+': '02720', ':': '02020', "'": '22000', '/': '11244', '&': '25256', '>': '42124', '<': '12421', '=': '07070', '*': '05250' };
/** 3x5 text into a 2D context. slope: 0 flat, 1 = +y wall (falls to the right), -1 = +x wall (rises to the right); ox = the wall's left edge for the slope */
export function txt(x, str, u, v, col, slope = 0, ox = 0) { str = String(str).toUpperCase(); x.fillStyle = col; for (let i = 0; i < str.length; i++) { const g = FONT[str[i]] || FONT['?']; for (let r = 0; r < 5; r++) { const b = +g[r]; for (let k = 0; k < 3; k++) if (b & (4 >> k)) { const X = u + i * 4 + k; x.fillRect(X, v + r + (slope > 0 ? ((X - ox) >> 1) : slope < 0 ? -((X - ox) >> 1) : 0), 1, 1); } } } }
export const txtW = s => String(s).length * 4 - 1;

/* ---------------- water ---------------- */
const hexU = new Map(), u32 = h => { let v = hexU.get(h); if (v === undefined) { const n = parseInt(h.slice(1, 7), 16); v = (0xff000000 | (n & 255) << 16 | (n >> 8 & 255) << 8 | (n >> 16)) >>> 0; hexU.set(h, v); } return v; };
export const PALS = {
  lane: { a: '#8fe2ee', b: '#5cc6e2', c: '#3ea6d6', hi: '#c6f4fa', lo: '#2f8cc0', gl: '#ffffff', wall: '#bfe0e8', wall2: '#1f8fb0' },
  leisure: { a: '#9aeee4', b: '#5ed6d2', c: '#34b4c4', hi: '#d2faf4', lo: '#2a98b0', gl: '#ffffff', wall: '#cfeae6', wall2: '#2f9a94' },
  hot: { a: '#b4f0ea', b: '#8ee0e0', c: '#6ccad2', hi: '#f0fffc', lo: '#58b4c0', gl: '#ffffff', wall: '#e4d8c0', wall2: '#b8a888' },
  out: { a: '#8fdcf2', b: '#58bcea', c: '#3a98dc', hi: '#d0f2fc', lo: '#2c7cc4', gl: '#ffffff', wall: '#c8dce8', wall2: '#2f7ab0' },
};
export function waterLayer(o) {
  const N = o.frames || 6, dz = o.dz === undefined ? .16 : o.dz, P = o.pal || PALS.lane;
  const cs = [WS(o.x0, o.y0, 0), WS(o.x1, o.y0, 0), WS(o.x0, o.y1, 0), WS(o.x1, o.y1, 0)], sx0 = Math.floor(Math.min(...cs.map(c => c[0]))) - 1, sy0 = Math.floor(Math.min(...cs.map(c => c[1]))) - 1, W = Math.ceil(Math.max(...cs.map(c => c[0]))) + 2 - sx0, H = Math.ceil(Math.max(...cs.map(c => c[1]))) + 2 + Math.ceil(dz * U) - sy0;
  // classify every pixel once: 0 nothing, 1 pool wall, 2 water (with its world position on the water plane and depth)
  const kind = new Uint8Array(W * H), wx = new Float32Array(W * H), wy = new Float32Array(W * H), wd = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const sx = sx0 + i + .5, sy = sy0 + j + .5, a = sx / U, b0 = sy / (U / 2), x0 = (a + b0) / 2, y0 = (b0 - a) / 2; if (o.depth(x0, y0) < 0) continue; const b = (sy - dz * U) / (U / 2), x = (a + b) / 2, y = (b - a) / 2, d = o.depth(x, y), k = j * W + i; if (d < 0) { kind[k] = 1; wd[k] = (dz * U - (sy - (WS(x0, y0, 0)[1]))) ; continue; } kind[k] = 2; wx[k] = x; wy[k] = y; wd[k] = d; }
  const sets = {}, C = { a: u32(P.a), b: u32(P.b), c: u32(P.c), hi: u32(P.hi), lo: u32(P.lo), gl: u32(P.gl), wall: u32(P.wall), wall2: u32(P.wall2) };
  function frame(mode, f) {
    const S = sets[mode] || (sets[mode] = []); if (S[f]) return S[f]; const c = mkC(W, H), g = c.getContext('2d'), id = g.createImageData(W, H), D = new Uint32Array(id.data.buffer), ph = 6.2832 * f / N, wv = mode === 'wave';
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i, t = kind[k]; if (!t) continue; if (t === 1) { D[k] = ((i + (j >> 1)) % 6 === 0) ? C.wall2 : (j & 3) === 0 ? C.wall2 : C.wall; continue; }
      const x = wx[k], y = wy[k], d = wd[k]; let col = 0; const tp = o.top && o.top(x, y, d, f, mode); if (tp) { D[k] = u32(tp); continue; }
      const rx = x + Math.sin(y * 4.6 + ph) * .045, ry = y + Math.sin(x * 4.1 - ph) * .045, fl = o.floor && o.floor(rx, ry, d);
      const v = Math.sin(x * 2.1 + Math.sin(y * 1.6 + ph) * 1.3 + ph) + Math.sin(y * 2.7 - Math.sin(x * 1.4 - ph) * 1.2 - 2 * ph), av = v < 0 ? -v : v, odd = (i + j) & 1;
      if (wv) { const w = Math.sin(y * 1.25 + Math.sin(x * .7) * .35 - ph), w2 = Math.sin(y * 1.25 + Math.sin(x * .7) * .35 - ph - .5); if (w > .93 && d > .08) col = C.gl; else if (w > .78) col = C.hi; else if (w2 < -.75) col = C.lo; }
      if (!col) { if (fl) col = u32(fl); else if (av < .085) col = C.hi; else if (v > 1.86) col = C.gl; else if (v < -1.8) col = C.lo; else col = d < .22 ? (d < .1 && odd ? C.hi : C.a) : d < .3 ? (odd ? C.a : C.b) : d < .58 ? C.b : d < .68 ? (odd ? C.b : C.c) : C.c; }
      D[k] = col; }
    g.putImageData(id, 0, 0); S[f] = c; return c;
  }
  const L = { mode: 'calm', bounds: { x: sx0, y: sy0, w: W, h: H }, fps: o.fps || 5,
    draw(ctx, cam, t) { if (sx0 - cam.x > G.W || sy0 - cam.y > G.H || sx0 + W < cam.x || sy0 + H < cam.y) return; const f = Math.floor(t * L.fps) % N; ctx.drawImage(frame(L.mode === 'wave' && o.wave ? 'wave' : 'calm', f), sx0 - cam.x, sy0 - cam.y); },
    warm() { for (let f = 0; f < N; f++) frame('calm', f); } };
  return L;
}

/* ---------------- people in the water ---------------- */
export const look = s => { s = s || {}; const one = s.top === 'dress' || s.bottom === 'skirt' || s.bottom === 'longskirt'; return { skin: s.skin || '#ecba90', hair: s.hair === 'bald' ? (s.skin || '#ecba90') : s.hairColor || '#4a3022', suit: s.topColor || '#3b6fd0', one, kid: s.age === 'kid' }; };
let POOLP = null;
/** swimwear specs: { adult[], kid[], elder[], guard[], teen[] } */
export function swimPeople() {
  if (POOLP) return POOLP; const A = charArt(), r = rng(8128), SUITS = ['#d8402e', '#1f6fb8', '#22304e', '#f2c230', '#2f9a94', '#8a5cc2', '#f28fb0', '#33303f', '#4fa860', '#f08a2c'];
  const mk = (n, o, x) => Array.from({ length: n }, () => { const s = Object.assign({}, A.randomSpec(r, Object.assign({ season: 1 }, o)), { outfit: 'swim', bag: null, scarf: null, hat: null }, x); if (!x || !x.topColor) s.topColor = SUITS[Math.floor(r() * SUITS.length)]; return s; });
  POOLP = { adult: mk(26, { age: 'adult' }), kid: mk(10, { age: 'kid' }), elder: mk(6, { age: 'elder' }), club: mk(8, { age: 'adult' }, { topColor: '#22304e' }), guard: Array.from({ length: 5 }, () => Object.assign({}, A.randomSpec(r, { age: 'adult', season: 1 }), { outfit: null, top: 'tee', topColor: '#f2c230', bottom: 'shorts', bottomColor: '#d8402e', shoes: '#f4f0e8', hat: null, bag: null, scarf: null })),
    staff: Array.from({ length: 6 }, () => Object.assign({}, A.randomSpec(r, { age: 'adult', season: 1 }), { outfit: null, top: 'polo', topColor: '#1fa3b8', bottom: 'slacks', bottomColor: '#22304e', shoes: '#f4f0e8', hat: null, bag: null, scarf: null })),
    street: Array.from({ length: 24 }, (_, i) => { const s = Object.assign({}, A.randomSpec(r, { season: G.now().season, age: i % 7 === 3 ? 'kid' : i % 9 === 5 ? 'elder' : 'adult' })); s.scarf = null; return s; }) };
  return POOLP;
}
const SW = new Map();
/** swimmer seen from above. o = { stroke: 'free' | 'back' | 'breast' | 'fly', f: 0..3, h: heading, skin, hair, suit, cap, one, kid } */
export function swimSpr(o) {
  const key = [o.stroke, o.f, o.h, o.skin, o.hair, o.suit, o.cap || '', o.one ? 1 : 0, o.kid ? 1 : 0].join('|'); let s = SW.get(key); if (s) return s;
  const kid = o.kid, LL = kid ? 4 : 6, TL = kid ? 5 : 7, x0 = 4, hx = x0 + LL + TL, f = o.f & 3, st = o.stroke || 'free', sk = o.skin, dkS = '#00000030';
  const base = paint(hx + 12, 13, set => {
    const cy = 6, A = (x, y, c = sk) => set(x, y, c), foam = '#f4feff', fm2 = '#c8f4fa';
    // wake + kick
    for (let i = 0; i < 4; i++) set(x0 - 3 + i - (f & 1), cy - 2 + ((i + f) % 3) * 2, i % 2 ? foam : fm2); set(x0 - 4, cy + (f % 2 ? 2 : -2), fm2); set(hx + 6, cy - 4, fm2); set(hx + 6, cy + 4, fm2);
    const frog = st === 'breast', sp = frog ? (f === 1 || f === 2 ? 2 : 1) : 1;
    for (let i = 0; i < LL; i++) { const k = frog ? (f === 2 ? (i < LL / 2 ? i : LL - i) : 0) : ((i + f) % 4 < 2 ? 0 : (i > LL / 2 ? 1 : 0)); A(x0 + i, cy - sp - (frog ? k : 0), sk); A(x0 + i, cy + sp + (frog ? k : 0), sk); if (!frog && k) set(x0 + i, cy + (f & 1 ? -2 : 2), fm2); }
    // trunk
    for (let i = 0; i < TL; i++) for (let y = -2; y <= 2; y++) { const edge = y === -2 || y === 2, suit = o.one ? true : i < 3; if (edge && (i === 0 || i === TL - 1)) continue; set(x0 + LL + i, cy + y, suit ? (y === 2 ? shade(o.suit) : o.suit) : (y === 2 ? shade(sk) : sk)); }
    // head
    const hc = o.cap || o.hair; for (let i = 0; i < 4; i++) for (let y = -2; y <= 1; y++) { if ((i === 0 || i === 3) && (y === -2 || y === 1)) continue; set(hx + i, cy + y, st === 'back' ? (i < 1 ? hc : sk) : (i === 3 ? sk : hc)); }
    if (st === 'back') { set(hx + 2, cy - 1, '#3a2a30'); set(hx + 2, cy, '#3a2a30'); } else if (o.cap || o.gog) set(hx + 3, cy - 1, '#2a2733');
    // arms
    const arm = (pts, c = sk) => { for (const [x, y] of pts) set(hx + x, cy + y, c); };
    if (st === 'free' || st === 'back') { const up = f < 2 ? -1 : 1, e = f & 1; arm([[1, up * 3], [2, up * 3], [3, up * 3], [4, up * 3 - (e ? 0 : up)], [5, up * 3 - (e ? 0 : up)]]); if (e) { set(hx + 6, cy + up * 3, foam); set(hx + 7, cy + up * 2, foam); set(hx + 6, cy + up * 4, fm2); } arm([[-1, -up * 3], [-2, -up * 3], [-3, -up * 3], [-4, -up * 3], [-5, -up * 2]]); set(hx - 6, cy - up * 3, fm2); }
    else if (st === 'breast') { if (f === 0 || f === 3) arm([[3, -1], [4, -1], [5, -1], [6, -1], [3, 1], [4, 1], [5, 1], [6, 1]]); else if (f === 1) { arm([[2, -3], [3, -4], [4, -5], [2, 3], [3, 4], [4, 5]]); set(hx + 5, cy - 5, fm2); set(hx + 5, cy + 5, fm2); } else arm([[0, -3], [1, -4], [0, 3], [1, 4], [-1, -3], [-1, 3]]); }
    else { if (f < 2) { arm([[1, -3], [2, -4], [3, -5], [4, -5], [1, 3], [2, 4], [3, 5], [4, 5]]); for (const y of [-6, 6]) { set(hx + 5, cy + y, foam); set(hx + 3, cy + y, fm2); } } else arm([[-1, -3], [-2, -4], [-3, -4], [-1, 3], [-2, 4], [-3, 4]]); set(hx + 5, cy, foam); }
    // waterline shadow
    for (let i = 1; i < LL + TL + 3; i += 2) set(x0 + i, cy + 4, dkS);
  });
  const h = o.h & 3, c = h === 0 ? shearC(base, 1) : h === 2 ? shearC(flipC(base), 1) : h === 1 ? shearC(flipC(base), -1) : shearC(base, -1);
  s = spr(c); SW.set(key, s); if (SW.size > 900) SW.delete(SW.keys().next().value); return s;
}
const shade = h => { const n = parseInt(h.slice(1, 7), 16), f = v => Math.round(v * .78).toString(16).padStart(2, '0'); return '#' + f(n >> 16) + f(n >> 8 & 255) + f(n & 255); };
const WD = new WeakMap();
/** a character sprite standing in water: everything below `cut` px above the feet is under the surface. f = ripple frame */
export function wade(src, cut, f = 0) {
  if (!src || !src.c) return src; let M = WD.get(src.c); if (!M) WD.set(src.c, M = new Map()); const k = cut * 4 + (f & 3); let s = M.get(k); if (s) return s;
  const keep = Math.max(4, -src.y - cut), c = mkC(src.w, keep + 3), x = c.getContext('2d'); x.drawImage(src.c, 0, 0, src.w, keep, 0, 0, src.w, keep);
  const cx = -src.x, ph = f & 3; x.fillStyle = '#e4fbfd'; for (let i = -6; i <= 6; i++) if ((i + ph) % 3) x.fillRect(cx + i, keep - 1 + (Math.abs(i) > 4 ? 0 : 1), 1, 1); x.fillStyle = '#bfeef6'; x.fillRect(cx - 7 - (ph & 1), keep, 3, 1); x.fillRect(cx + 5 + (ph & 1), keep, 3, 1); x.fillRect(cx - 3, keep + 2, 6, 1);
  s = { c, l: null, x: src.x, y: -keep, w: src.w, h: keep + 3 }; M.set(k, s); return s;
}
const TB = new Map();
export function tubeSpr(col, L, f, glow) {
  const key = col + L.skin + L.hair + L.suit + (f & 1) + (glow ? 1 : 0); let s = TB.get(key); if (s) return s;
  const c = paint(21, 15, set => { const cx = 10, cy = 8 + (f & 1); for (let y = -5; y <= 5; y++) { const hw = Math.round(9 * Math.sqrt(Math.max(0, 1 - (y / 5.4) ** 2))); set(cx - hw, cy + y, y > 2 ? shade(col) : col, hw * 2 + 1, 1); } for (let y = -2; y <= 2; y++) { const hw = Math.round(4 * Math.sqrt(Math.max(0, 1 - (y / 2.6) ** 2))); set(cx - hw, cy + y, '#2f98b8', hw * 2 + 1, 1); }
    set(cx - 5, cy - 4, '#ffffff', 3, 1); set(cx - 3, cy - 2, L.suit, 6, 4); set(cx - 2, cy - 6, L.skin, 4, 4); set(cx - 2, cy - 7, L.hair, 4, 2); set(cx - 6, cy - 1, L.skin, 3, 1); set(cx + 3, cy - 1, L.skin, 3, 1); set(cx + 1, cy + 2, L.skin, 2, 4); set(cx - 3, cy + 2, L.skin, 2, 3); set(cx - 9, cy + 6, '#dff8fc', 5, 1); set(cx + 4, cy + 6, '#dff8fc', 5, 1); });
  s = spr(c, glow); TB.set(key, s); return s;
}
const DV = new Map();
/** a diver in the air: shape 'straight' | 'tuck' | 'pike' | 'stand', a16 = rotation step 0..15 (0 = upright, head up; positive turns forward), arms: 0 down, 1 up */
export function diverSpr(shape, a16, L, arms) {
  const key = shape + (a16 & 15) + L.skin + L.hair + L.suit + (arms ? 1 : 0) + (L.one ? 1 : 0); let s = DV.get(key); if (s) return s;
  const c = paint(29, 29, (set, x) => { const a = (a16 & 15) / 16 * 6.2832, ax = Math.sin(a), ay = -Math.cos(a), px = Math.cos(a), py = Math.sin(a), O = [14, 14];
    const seg = (p, q, col, w = 2) => { const n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1])) + 1; for (let i = 0; i <= n; i++) set(p[0] + (q[0] - p[0]) * i / n - w / 2 + .5, p[1] + (q[1] - p[1]) * i / n - w / 2 + .5, col, w, w); }, P = (u, v) => [O[0] + ax * u + px * v, O[1] + ay * u + py * v];
    const TL = shape === 'tuck' ? 5 : 7;
    if (shape === 'tuck') { seg(P(0, 0), P(3, 4), L.skin); seg(P(3, 4), P(-1, 5), L.skin); } else if (shape === 'pike') { seg(P(0, 0), P(2, 8), L.skin); seg(P(0, 1), P(2, 9), L.skin, 1); } else seg(P(0, 0), P(-9, 0), L.skin, 3);
    seg(P(0, 0), P(TL, 0), L.one ? L.suit : L.skin, 3); seg(P(-1, 0), P(1, 0), L.suit, 3);
    if (shape === 'tuck') seg(P(TL - 1, 0), P(2, 4), L.skin, 1); else if (shape === 'pike') seg(P(TL - 1, 0), P(3, 7), L.skin, 1); else if (arms) { seg(P(TL, -1), P(TL + 6, -1), L.skin, 1); seg(P(TL, 1), P(TL + 6, 1), L.skin, 1); } else { seg(P(TL - 1, -2), P(1, -2), L.skin, 1); seg(P(TL - 1, 2), P(1, 2), L.skin, 1); }
    const hd = P(TL + 2, 0); set(hd[0] - 1, hd[1] - 1, L.skin, 3, 3); const hh = P(TL + 3, -.6); set(hh[0] - 1, hh[1] - 1, L.hair, 2, 2); });
  s = spr(c); DV.set(key, s); return s;
}
const CD = new Map();
export function cardSpr(text, col = '#fbfbf4', fg = '#2a2733') { const key = text + col; let s = CD.get(key); if (s) return s; const w = txtW(text) + 4, c = paint(w, 9, (set, x) => { set(0, 0, '#2a2733', w, 9); set(1, 1, col, w - 2, 7); txt(x, text, 2, 2, fg); }); s = spr(c, true); s.y = -9; CD.set(key, s); return s; }

/* ---------------- effects ---------------- */
const SPL = new Map();
function splashSpr(size, f) { const key = size * 10 + f; let s = SPL.get(key); if (s) return s; const R0 = 5 + size * 4, W = R0 * 4 + 6, H = R0 * 3 + 8, r = rng(size * 31 + 7);
  const c = paint(W, H, set => { const cx = W >> 1, by = H - R0 - 2, t = f / 5; for (let a = 0; a < 20; a++) { const an = a / 20 * 6.283, rr = R0 * (.4 + t * 1.1); if ((a + f) % 3) set(cx + Math.cos(an) * rr * 1.5, by + Math.sin(an) * rr * .75, t > .6 ? '#bfeef6' : '#ffffff'); }
    const n = 8 + size * 7; for (let i = 0; i < n; i++) { const an = r() * 6.283, v = .5 + r() * 1, hx = Math.cos(an) * v * R0 * 1.3 * t, up = (2.6 * t - 2.9 * t * t) * (H - R0 - 4) * (.5 + r() * .7); if (t < .95) set(cx + hx, by - up, i % 3 ? '#e4fbfd' : '#ffffff', size > 1 && i % 4 === 0 ? 2 : 1, size > 1 && i % 4 === 0 ? 2 : 1); }
    if (f < 3) for (let y = 0; y < (3 - f) * (2 + size * 2); y++) set(cx - 1 - (size > 1 ? 1 : 0), by - y, '#ffffff', 2 + (size > 1 ? 2 : 0), 1); });
  s = { c, l: null, x: -(W >> 1), y: -(H - R0 - 2), w: W, h: H }; SPL.set(key, s); return s; }
/** a splash at world (x, y) on the water. size 0 small (hand entry), 1 medium (dive), 2 big (bomb / bucket) */
export function splash(sc, x, y, size = 1, z = -.1) { const e = { x, y, z, t: 0, bb: [-.2, -.2, .2, .2, .6], fx: true, sprite() { return splashSpr(size, Math.min(5, Math.floor(this.t * 11))); }, update(dt) { this.t += dt; if (this.t > .55) { this.hidden = true; this.dead = true; } } }; sc.ents.push(e); sc._fxn = (sc._fxn || 0) + 1; return e; }
export function sweep(sc) { if (!(sc._fxn > 12)) return; for (let i = sc.ents.length - 1; i >= 0; i--) if (sc.ents[i].dead) sc.ents.splice(i, 1); sc._fxn = 0; }
const JT = new Map();
function jetSpr(kind, f, pw) { const key = kind + f + '|' + pw; let s = JT.get(key); if (s) return s; let c, ay;
  if (kind === 'up') { const h = Math.round((18 + (f % 2) * 3) * pw) + 3; c = paint(11, h + 4, set => { for (let y = 0; y < h; y++) { const w = y < 4 ? 3 : 1 + ((y + f) % 3 === 0 ? 1 : 0); set(5 - (w >> 1), 3 + y, (y + f) % 4 ? '#dff8fc' : '#ffffff', w, 1); } for (let i = 0; i < 6; i++) set(1 + ((i * 5 + f * 3) % 9), (i * 3 + f) % 6, '#ffffff'); set(2, h + 2, '#bfeef6', 7, 1); }); ay = h + 3; }
  else if (kind === 'arc') { c = paint(34, 30, set => { for (let i = 0; i < 30; i++) { const t = i / 29, x = 32 - t * 30, y = 26 + t * 15 - Math.sin(t * 3.1416) * 30 * pw; if ((i + f) % 4) set(x, y, (i + f) % 3 ? '#dff8fc' : '#ffffff'); } for (let i = 0; i < 4; i++) set(1 + ((i * 3 + f) % 5), 27 + (i % 2), '#ffffff'); }); ay = 26; }
  else if (kind === 'spray') { c = paint(13, 30, set => { for (let i = 0; i < 26; i++) { const y = (i * 7 + f * 5) % 28, w = y / 28; set(6 + ((i % 5) - 2) * (1 + w * 1.2), y, i % 3 ? '#cfeffa' : '#ffffff'); } set(2, 29, '#bfeef6', 9, 1); }); ay = 29; }
  else { c = paint(60, 34, set => { for (let a = 0; a < 40; a++) { const an = a / 40 * 6.283, x = 30 + Math.cos(an) * 20, y0 = 8 + Math.sin(an) * 10; for (let k = 0; k < 5; k++) { const y = y0 + ((k * 5 + f * 3 + a) % 22); if (Math.sin(an) > -.3) set(x, y, k % 2 ? '#dff8fc' : '#ffffff'); } } }); ay = 28; }
  s = { c, l: null, x: -(c.width >> 1), y: -ay, w: c.width, h: c.height }; if (kind === 'arc') s.x = -32; JT.set(key, s); return s; }
/** a fountain jet / shower spray. kind 'up' | 'arc' | 'spray' | 'mush'. ent.on toggles it, ent.pw = power 0..1 */
export function jet(sc, x, y, z, kind) { const e = { x, y, z, on: true, pw: 1, kind, t: Math.random() * 3, bb: [-.15, -.15, .15, .15, kind === 'spray' ? 1.8 : 1.2], get hidden() { return !this.on || this.pw < .15; }, set hidden(v) { }, sprite() { return jetSpr(kind, Math.floor(this.t * 9) % 4, Math.round(Math.max(.2, this.pw) * 4) / 4); }, update(dt) { this.t += dt; } }; sc.ents.push(e); return e; }
/** generic sprite entity */
export function ent(sc, x, y, z, sprite, bb) { const e = { x, y, z, bb: bb || [-.2, -.2, .2, .2, .5], hidden: false, sprite }; sc.ents.push(e); return e; }

/* ---------------- boards and the pace clock ---------------- */
/** an LED / paper board on a back wall. o = { axis: 'y' (the wall along x) | 'x', x, y (world: the wall face; for axis 'x' y = the low-y end), z, w (units), h (px), bg, lit } */
export function board(sc, o) {
  const Wp = Math.round(o.w * U), Hp = o.h, sh = Wp >> 1, c = mkC(Wp, Hp + sh + 1), g = c.getContext('2d'), isY = o.axis !== 'x';
  const off = u => (isY ? (u >> 1) : ((Wp - 1 - u) >> 1));
  const B = { w: Wp, h: Hp, c, g, clear(col) { g.clearRect(0, 0, c.width, c.height); g.fillStyle = col || o.bg || '#141a22'; for (let u = 0; u < Wp; u++) g.fillRect(u, off(u), 1, Hp); },
    rect(u, v, w, h, col) { g.fillStyle = col; for (let i = Math.max(0, u); i < Math.min(Wp, u + w); i++) g.fillRect(i, v + off(i), 1, h); },
    text(s, u, v, col) { s = String(s).toUpperCase(); g.fillStyle = col; for (let i = 0; i < s.length; i++) { const gl = FONT[s[i]] || FONT['?']; for (let r = 0; r < 5; r++) { const b = +gl[r]; for (let k = 0; k < 3; k++) if (b & (4 >> k)) { const X = u + i * 4 + k; if (X >= 0 && X < Wp) g.fillRect(X, v + r + off(X), 1, 1); } } } },
    textR(s, uRight, v, col) { B.text(s, uRight - txtW(s), v, col); } };
  const S = { c, l: o.lit === false ? null : c, x: 0, y: isY ? -Hp : -(Hp + sh), w: Wp, h: Hp + sh + 1 };
  B.ent = isY ? { x: o.x, y: o.y, z: o.z, bb: [0, 0, o.w, .06, Hp / U], sprite: () => S } : { x: o.x, y: o.y + o.w, z: o.z, bb: [0, -o.w, .06, 0, Hp / U], sprite: () => S };
  B.clear(); sc.ents.push(B.ent); return B;
}
/** the pace clock: a big white dial with a red and a black sweep hand, one lap a minute (real seconds) */
export function paceClock(sc, x, y, z) {
  const c = mkC(23, 23), g = c.getContext('2d'); let last = -1; const S = { c, l: null, x: -11, y: -22, w: 23, h: 23 };
  const draw = k => { g.clearRect(0, 0, 23, 23); for (let j = -11; j <= 11; j++) { const hw = Math.round(Math.sqrt(Math.max(0, 121 - j * j))); g.fillStyle = '#2a2733'; g.fillRect(11 - hw, 11 + j, hw * 2 + 1, 1); if (Math.abs(j) < 10) { const h2 = Math.round(Math.sqrt(Math.max(0, 100 - j * j))); g.fillStyle = '#fbfdfd'; g.fillRect(11 - h2, 11 + j, h2 * 2 + 1, 1); } }
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillStyle = i % 3 ? '#8a94a2' : '#2a2733'; g.fillRect(Math.round(11 + Math.sin(a) * 8.5), Math.round(11 - Math.cos(a) * 8.5), 1, 1); }
    const hand = (a, col) => { g.fillStyle = col; for (let r = 0; r <= 8; r++) g.fillRect(Math.round(11 + Math.sin(a) * r), Math.round(11 - Math.cos(a) * r), 1, 1); }; hand((k + 30) / 60 * 6.283, '#2a2733'); hand(k / 60 * 6.283, '#e8483a'); g.fillStyle = '#2a2733'; g.fillRect(10, 10, 3, 3); };
  const e = { x, y, z, bb: [-.4, -.02, .4, .04, 1.4], sprite() { const k = Math.floor(G.time) % 60; if (k !== last) { last = k; draw(k); } return S; } }; sc.ents.push(e); return e;
}
/** a character standing / sitting in the room (world coords) */
export function person(sc, spec, x, y, dir, o) { const c = new Char(spec, x, y); c.dir = dir === undefined ? 1 : dir; c.speed = 1.6; Object.assign(c, o || {}); sc.ents.push(c); return c; }
