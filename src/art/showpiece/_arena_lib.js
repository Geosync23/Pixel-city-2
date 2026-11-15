// Shared helpers for Maple Bay Arena: art (arena.js, arena_bowl.js), the room canvases (scenes/rooms/arena2.js) and the rooms. Pure: no DOM.
//   palette   RED CREAM RED_D CONC CONC_D STEEL DARK NIGHT WOOD GOLD LED
//   COURT { x0, x1, y0, y1, cx, cy, rim (distance of the rim centre from the baseline), rimZ }   (bowl room coordinates)
//   BOWL { W, D }   STANDS [{ id, axis: 'x' | 'y', rows, x0 / y0 ..., len, rise, z0, rev, aisles }]  seatXs(len, aisles) -> [offset along the row]
//   floorPx(mode) -> (x, y) => hex   the event floor of the bowl: 'court' | 'concert' | 'ice' | 'trucks'
//   mascot(put, frame, o)   Ollie the Otter, drawn with put(dx, dy, hex) around his feet (dy up = negative). frames 0-1 stand, 2-3 wave, 4-7 dance, 8-9 walk
//   FONT3 / textPx(put, str, x, y, hex, scale)   the 3x5 pixel font for 2D canvases       tw(str, scale)
import { mix, hash2, dk, lt } from '../../engine/raster.js';

export const RED = '#d2392f', RED_D = '#a82a26', RED_L = '#e8584a', CREAM = '#f4f0e8', CONC = '#9a9ea8', CONC_D = '#6a6e7a', CONC_L = '#b8bcc4', STEEL = '#c2cad4', DARK = '#2a2f3d', NIGHT = '#1a1d2a',
  WOOD = '#d9a45c', WOOD_D = '#b8813f', WOOD_L = '#e8bc7a', GOLD = '#f2c230', LED = '#ffb23a', BLUE = '#2f6fd0', INK = '#262a3a', BROWN = '#8a5a34', BROWN_D = '#6a4226', FUR = '#9a6a3c';

export const BOWL = { W: 31, D: 23 };
export const COURT = { x0: 8.6, x1: 23.6, y0: 8.5, y1: 16.5, cx: 16.1, cy: 12.5, rim: .85, rimZ: 2.35 };
export const PITCH = .6;
/** seat offsets along a row of length len, skipping the aisles ([[from, to]]) */
export function seatXs(len, aisles = []) { const out = []; for (let x = .4; x <= len - .3; x += PITCH) if (!aisles.some(a => x > a[0] - .25 && x < a[1] + .25)) out.push(Math.round(x * 100) / 100); return out; }
// The stands. North + west rise toward the back walls (rows 0 = front); south is a low riser with its back to the viewer.
// row k of a stand: front edge offset k * .75 from the stand's front, top at z0 + k * rise.
export const STANDS = [
  { id: 'N', axis: 'x', rows: 8, x0: 1, len: 23.4, front: 7, dirOut: -1, rise: .5, z0: .5, face: 1, aisles: [[7.4, 8.4], [15.4, 16.4]], sec: '10' },
  { id: 'W', axis: 'y', rows: 8, y0: 7.2, len: 11.4, front: 7, dirOut: -1, rise: .5, z0: .5, face: 0, aisles: [[5.2, 6.2]], sec: '11' },
  { id: 'S', axis: 'x', rows: 3, x0: 3, len: 10.8, front: 18.6, dirOut: 1, rise: .4, z0: .4, face: 3, aisles: [], sec: '12' },
  { id: 'S2', axis: 'x', rows: 3, x0: 17.4, len: 10.8, front: 18.6, dirOut: 1, rise: .4, z0: .4, face: 3, aisles: [], sec: '12' },
];
/** geometry of row k: { o (world coordinate of the row's far/back edge on the cross axis for N/W, near edge for S), z } */
export function rowGeo(st, k) { const o = st.dirOut < 0 ? st.front - (k + 1) * .75 : st.front + k * .75; return { o, z: st.z0 + k * st.rise }; }

/* ---------- the event floor ---------- */
const inC = (x, y) => x >= COURT.x0 && x <= COURT.x1 && y >= COURT.y0 && y <= COURT.y1;
export function floorPx(mode) {
  const C = COURT, L = .07, hw = C.x0 + C.rim, he = C.x1 - C.rim, R3 = 3.55, key = 3.0, kw = 1.3;
  const apron = (x, y) => { const k = hash2(Math.floor(x * 16), Math.floor(y * 16), 5); const fx = x % 2, fy = y % 2; if (fx < .06 || fy < .06) return '#3c4150'; return k < .05 ? '#4e5464' : k > .96 ? '#424756' : '#474c5a'; };
  if (mode === 'concert') return (x, y) => { if (!inC(x, y)) return apron(x, y); const k = hash2(Math.floor(x * 16), Math.floor(y * 16), 9); if (Math.abs((x - C.x0) % 2.5) < .05) return '#3a3e4c'; return k < .04 ? '#2c303c' : k > .97 ? '#262a36' : '#22252f'; };
  if (mode === 'ice') return (x, y) => { if (!inC(x, y)) return apron(x, y); const d = Math.hypot(x - C.cx, y - C.cy), k = hash2(Math.floor(x * 16), Math.floor(y * 16), 4); if (x < C.x0 + .12 || x > C.x1 - .12 || y < C.y0 + .12 || y > C.y1 - .12) return '#f4f0e8';
    if (Math.abs(x - C.cx) < .06) return '#d2392f'; if (Math.abs(d - 1.3) < .06) return '#3b6fd0'; if (Math.abs(x - (C.x0 + 4.6)) < .05 || Math.abs(x - (C.x1 - 4.6)) < .05) return '#3b6fd0';
    const sc = Math.abs(Math.sin(x * 3.1 + y * 1.7) + Math.sin(x * .9 - y * 2.3)); return sc < .06 ? '#c4dcec' : k < .03 ? '#f8fcff' : (Math.floor(x * 16) + Math.floor(y * 16)) & 1 ? '#e2f0f8' : '#dcecf6'; };
  if (mode === 'trucks') return (x, y) => { if (!inC(x, y)) return apron(x, y); const k = hash2(Math.floor(x * 16), Math.floor(y * 16), 6), tr = Math.abs(((y - C.y0) % 2.6) - 1.3); if (x < C.x0 + .1 || x > C.x1 - .1 || y < C.y0 + .1 || y > C.y1 - .1) return '#f2c230';
    if (tr < .09 || Math.abs(tr - .5) < .07) return '#6a4a30'; return k < .1 ? '#8a6444' : k > .9 ? '#a47a54' : '#96704c'; };
  return (x, y) => {
    if (!inC(x, y)) { if (x > C.x0 - .5 && x < C.x1 + .5 && y > C.y0 - .5 && y < C.y1 + .5) return RED; return apron(x, y); }
    const ln = CREAM, dw = Math.hypot(x - hw, y - C.cy), de = Math.hypot(x - he, y - C.cy), dc = Math.hypot(x - C.cx, y - C.cy);
    if (x < C.x0 + L || x > C.x1 - L || y < C.y0 + L || y > C.y1 - L) return ln;
    if (Math.abs(x - C.cx) < L / 2) return ln;
    if (dc < 1.25) { if (dc > 1.25 - L) return ln; const a = x - C.cx, b = y - C.cy; if (dc < .95) { if (Math.abs(b + .1) < .34 && Math.abs(a) < .5) return BROWN; if (Math.hypot(a - .42, b + .32) < .2 || Math.hypot(a + .42, b + .32) < .2) return BROWN; if (Math.abs(b - .3) < .16 && Math.abs(a) < .34) return CREAM; return RED; } return RED_D; }
    for (const [h, d, s] of [[hw, dw, 1], [he, de, -1]]) { const ux = (x - (s > 0 ? C.x0 : C.x1)) * s; // ux = distance in from that baseline
      if (ux < key && Math.abs(y - C.cy) < kw) { if (ux > key - L || Math.abs(Math.abs(y - C.cy) - kw) < L) return ln; return RED; }
      const fd = Math.hypot(ux - key, y - C.cy); if (ux >= key && Math.abs(fd - kw) < L / 2 + .01) return ln;
      if (ux < 1.4 ? Math.abs(Math.abs(y - C.cy) - R3 * .97) < L / 2 + .005 : Math.abs(d - R3) < L / 2 + .012 && ux >= 1.4) return ln; }
    const r = Math.floor(y * 3), xx = x + (r & 1) * .9, fy = y * 3 - r; if (fy < .09 || (xx % 1.8) < .05) return WOOD_D; return hash2(Math.floor(xx / 1.8), r, 9) > .62 ? WOOD_L : WOOD;
  };
}

/* ---------- 3x5 font for 2D canvases ---------- */
export const FONT3 = { A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57555', N: '65555', O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55575', X: '55255', Y: '55222', Z: '71247',
  0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71222', 8: '75757', 9: '75716', ' ': '00000', '.': '00002', ',': '00024', '!': '22202', '?': '61202', '-': '00700', '+': '02720', ':': '02020', "'": '22000', '/': '11244', '&': '25256', '#': '57575', '>': '42124', '<': '12421', '*': '05250' };
export const tw = (s, sc = 1) => (String(s).length * 4 - 1) * sc;
/** put(x, y, hex) painter text; (x, y) = top-left */
export function textPx(put, str, x, y, hex, sc = 1) { str = String(str).toUpperCase(); for (let i = 0; i < str.length; i++) { const g = FONT3[str[i]] || FONT3['?']; for (let r = 0; r < 5; r++) { const bits = +g[r]; for (let b = 0; b < 3; b++) if (bits & (4 >> b)) for (let a = 0; a < sc; a++) for (let c = 0; c < sc; c++) put(x + (i * 4 + b) * sc + a, y + r * sc + c, hex); } } }

/* ---------- Ollie the Otter ---------- */
// 19 px wide, 27 px tall. put(dx, dy, hex): dx right, dy down, (0, 0) = between the feet on the ground.
const OLLIE = [
  '....eE.......Ee....', '...eFFe.....eFFe...', '...FFFFFFFFFFFFF...', '..FFFFFFFFFFFFFFF..', '..FFwkFFFFFFFwkFF..', '..FFkkFFFFFFFkkFF..', '..FFFFFmmmmmFFFFF..', '..FFFFmmmnnmmmFFF..', '...FFFmmwmwmmFFF...', '....FFFmmmmmFFF....',
];
export function mascot(put, f = 0, o = {}) {
  const F = o.fur || FUR, Fd = dk(F, .22), J = o.c || RED, Jd = dk(J, .2), M = '#f0dcb8', bob = f === 1 || f === 5 || f === 7 || f === 9 ? 1 : 0, lean = f === 4 ? -1 : f === 6 ? 1 : 0;
  const col = { F, e: Fd, E: Fd, m: M, n: '#3a2a22', w: '#ffffff', k: '#2a2230' };
  // shadow
  for (let x = -7; x <= 7; x++) for (let y = -1; y <= 1; y++) if (Math.abs(x) + Math.abs(y) * 3 < 9) put(x, y + 1, '#2a1f4560');
  // tail
  for (let i = 0; i < 6; i++) { put(-8 - (i >> 1), -6 + i - bob, Fd); put(-7 - (i >> 1), -6 + i - bob, F); }
  // feet + legs
  const step = f === 8 ? 1 : f === 9 ? -1 : 0; for (const s of [-1, 1]) { const x0 = s < 0 ? -5 : 2, up = s * step > 0 ? 1 : 0; for (let x = 0; x < 4; x++) { put(x0 + x, -1 - up, Fd); put(x0 + x, -2 - up, F); put(x0 + x, -3 - up, F); } put(x0 + (s < 0 ? -1 : 4), -1 - up, Fd); }
  // body (jersey)
  for (let y = -15; y <= -4; y++) for (let x = -6; x <= 6; x++) { const yy = y + bob; if (Math.abs(x) === 6 && (y < -13 || y > -6)) continue; put(x + lean, yy, y > -6 ? F : Math.abs(x) >= 5 ? Jd : J); }
  for (let x = -2; x <= 2; x++) put(x + lean, -15 + bob, CREAM); put(-1 + lean, -11 + bob, CREAM); put(0 + lean, -12 + bob, CREAM); put(0 + lean, -11 + bob, CREAM); put(0 + lean, -10 + bob, CREAM); put(0 + lean, -9 + bob, CREAM); put(-1 + lean, -8 + bob, CREAM); put(0 + lean, -8 + bob, CREAM); put(1 + lean, -8 + bob, CREAM);
  // arms: 0 down, 1 up, 2 out
  const arm = (s, mode) => { const x0 = s * 7 + lean; if (mode === 1) { for (let i = 0; i < 6; i++) { put(x0 + s * (i > 3 ? 1 : 0), -14 - i + bob, F); put(x0 + s + s * (i > 3 ? 1 : 0), -14 - i + bob, Fd); } put(x0 + s, -20 + bob, M); } else if (mode === 2) { for (let i = 0; i < 5; i++) { put(x0 + s * i, -13 + bob, F); put(x0 + s * i, -12 + bob, Fd); } put(x0 + s * 5, -13 + bob, M); } else { for (let i = 0; i < 6; i++) { put(x0, -13 + i + bob, F); put(x0 + s, -13 + i + bob, Fd); } put(x0, -7 + bob, M); } };
  const AM = [[0, 0], [0, 0], [0, 1], [0, 1], [1, 2], [1, 1], [2, 1], [1, 1], [0, 0], [0, 0]][f] || [0, 0]; if (f === 3) { arm(-1, 0); arm(1, 2); } else { arm(-1, AM[0]); arm(1, AM[1]); }
  // head
  OLLIE.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch !== '.') put(i - 9 + lean, -25 + j + bob, col[ch]); } });
  if (o.cap) for (let x = -5; x <= 5; x++) { put(x + lean, -24 + bob, J); put(x + lean, -23 + bob, J); }
}
export { mix, dk, lt };
