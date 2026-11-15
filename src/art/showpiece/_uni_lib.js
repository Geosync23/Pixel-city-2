// Shared palette + helpers for the Maple Bay University art (university.js, university_ext.js, _uni_icons.js), the room canvases and the campus UI. Not an asset module.
// Pure: no DOM. Bitmap painters take a `put(x, y, hex)` callback (y DOWN) so the same picture works on a raster wall, on a live room canvas and in the phone app.
//   NAVY / GOLD = the school colours.   S2(x, y, z) -> [px, py]   dot(x, y, z, c, dx, dy)   wallPut(w, y, z0) -> put(u, vUp, hex, lit)
//   crest(put, x, y, s?)          the shield: navy, gold maple leaf over an open book (11 x 13 px at s = 1)
//   glyphs(put, str, x, y, c)     3x5 text through a put callback;  textW(str)
//   ctext(str, x0, x1, y, z, c)   text centred between x0..x1 on a +y wall
//   books(x0, x1, y, z, h, seed)  a row of book spines on a +y plane
import * as R from '../../engine/raster.js';
const { qy, qx, qz, lw, dk, lt, px, C, PW, rng, textY, textW: TW } = R;

export const NAVY = '#2f3f72', NAVY_D = '#22304e', NAVY_L = '#4a5f9a', GOLD = '#e8b83a', GOLD_D = '#b8862e', GOLD_L = '#f6d878';
export const BRICK = '#a9604a', BRICK_D = '#8a4a3a', STONE = '#e6dcc6', STONE_D = '#c4b89c', SLATE = '#56627a', OAK = '#8a5a34', OAK_D = '#6a4428', OAK_L = '#a8743e', WALNUT = '#5a3626';
export const CREAM = '#f4ead0', PAPER = '#fffdf4', INK = '#2a2733', CHALK = '#2f4a40', CHALK_D = '#243a32', CHALKW = '#e8f0e4', GREEN = '#3f7a54', GREEN_L = '#5aa870', LAMP = '#3f8a5a', RED = '#c8402f', IRON = '#3a3a48', BRONZE = '#6a7a5a', BRONZE_L = '#8a9a72', STEEL = '#9aa4b0', STEEL_D = '#6a7482';
export const POSTER = ['#d9483b', '#3b6fd0', '#e8b83a', '#4fa860', '#8a5aa8', '#f08ab0', '#2f9a94', '#f09a3a', '#f4f0e8'];

export const S2 = (x, y, z) => { const s = PW(x, y, z); return [Math.round(s[0]), Math.round(s[1])]; };
export const dot = (x, y, z, c, dx = 0, dy = 0) => { const s = S2(x, y, z); px(s[0] + (R.isFlipped() ? -dx : dx), s[1] + dy, C(c)); };
/** put(u, vUp, hex, lit) painter over a wall plane y: column u (px along the wall from x = 0), v px above z0 */
export function wallPut(w, y, z0, x0 = 0) {
  const n = Math.round(w * 16), X = new Int32Array(n), Y = new Int32Array(n); for (let i = 0; i < n; i++) { const q = PW(x0 + (i + .5) / 16, y, z0); X[i] = Math.floor(q[0]); Y[i] = Math.round(q[1]); }
  return (u, v, c, li) => { if (u < 0 || u >= n || !c) return; if (li) R.lit(() => px(X[u], Y[u] - 1 - v, C(c))); else px(X[u], Y[u] - 1 - v, C(c)); };
}
export const ctext = (s, x0, x1, y, z, c) => textY(s, (x0 + x1) / 2 - TW(s) / 32, y, z, c);

const FONT = {
  A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57555', N: '65555', O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55575', X: '55255', Y: '55222', Z: '71247',
  0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71222', 8: '75757', 9: '75716',
  ' ': '00000', '.': '00002', ',': '00024', '!': '22202', '?': '61202', '-': '00700', '+': '02720', ':': '02020', "'": '22000', '/': '11244', '&': '25256', '%': '51245', '*': '05250', '=': '07070', '>': '42124', '<': '12421',
};
export const textW = s => String(s).length * 4 - 1;
/** 3x5 text through put(x, y, hex); (x, y) = top-left */
export function glyphs(put, str, x, y, c) { str = String(str).toUpperCase(); for (let i = 0; i < str.length; i++) { const g = FONT[str[i]] || FONT['?']; for (let r = 0; r < 5; r++) { const bits = +g[r]; for (let b = 0; b < 3; b++) if (bits & (4 >> b)) put(x + i * 4 + b, y + r, c); } } }

const CREST = ['nnnnnnnnnnn', 'nnnnngnnnnn', 'nnngngngnnn', 'nngggggggnn', 'ngggggggggn', 'nnngggggnnn', 'nnnnngnnnnn', 'nppppnppppn', 'nppppnppppn', 'nnnnnnnnnnn', '.nnnnnnnnn.', '..nnnnnnn..', '....nnn....'];
/** the university shield at (x, y) = top-left, pixel size s */
export function crest(put, x, y, s = 1, c = {}) {
  const col = { n: c.n || NAVY, g: c.g || GOLD, p: c.p || CREAM };
  for (let r = 0; r < CREST.length; r++) for (let i = 0; i < 11; i++) { const k = CREST[r][i]; if (k === '.' || !k) continue; for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) put(x + i * s + a, y + r * s + b, col[k]); }
}
/** crest on a +y wall, centred at world x, top at z */
export function crestY(x, y, z, s = 1, c) { const q = S2(x, y, z), w = 11 * s; crest((u, v, col) => px(q[0] - (w >> 1) + u, q[1] + v + ((u - (w >> 1)) >> 1), C(col)), 0, 0, s, c); }
/** a row of book spines on a +y plane */
export function books(x0, x1, y, z, h, seed = 1, cols) {
  const r = rng(seed * 31 + 7), P = cols || ['#8a3848', '#2f3f72', '#3f6a48', '#b8862e', '#5a3626', '#7a55c8', '#c8683f', '#2f6a7a', '#e4d8b8', '#4a4a58'];
  let x = x0; while (x < x1 - .05) { const w = Math.min(x1 - x, .09 + r() * .1), hh = h * (.72 + r() * .28), c = P[Math.floor(r() * P.length)]; if (r() < .08) { x += w; continue; } qy(x, x + w, y, z, z + hh, c); lw([x, y, z], [x, y, z + hh], dk(c, .35)); if (r() < .5) lw([x + .02, y, z + hh * .7], [x + w - .02, y, z + hh * .7], lt(c, .4)); x += w; }
}
/** a simple turned leg / post */
export const post = (x, y, z, h, c = OAK_D, t = .1) => R.box(x - t / 2, y - t / 2, z, t, t, h, c, { ol: false });
/** framed panel on a +y wall */
export function frameY(x0, x1, y, z0, z1, c, fr = OAK_D) { qy(x0, x1, y, z0, z1, fr); qy(x0 + .08, x1 - .08, y + .005, z0 + .08, z1 - .08, c); }
/** poster / sheet pinned on a +y plane */
export function sheet(x, y, z, w, h, c, seed = 0) { qy(x, x + w, y, z, z + h, c); const n = Math.max(1, Math.round(h * 16 / 3) - 1); for (let i = 1; i <= n; i++) { const zz = z + h - i * 3 / 16; if (zz > z + .03) lw([x + .04, y, zz], [x + w - .04 - ((i * 7 + seed) % 3) * .04, y, zz], dk(c, .35)); } dot(x + w / 2, y, z + h - .02, RED); }
export { R };
