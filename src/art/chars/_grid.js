// Tiny local pixel grid for hand-placed sprites (characters, animals).
// Draw in "facing screen-right" canonical space relative to the feet anchor (0,0) (y grows downward, y=-1 is the row
// that touches the ground), then flush() adds a 1px tinted outline and blits it (optionally mirrored) to the raster target.
import { px, C, dk, lit } from '../../engine/raster.js';

const W = 72, H = 72, OX = 36, OY = 50;
const G = new Array(W * H).fill(null), LT = new Uint8Array(W * H);
let LITM = 0;
export function gclear() { G.fill(null); LT.fill(0); LITM = 0; }
/** plot a pixel (hex) at offset (x,y) from the anchor */
export function p(x, y, c) { x += OX; y += OY; if (!c || x < 0 || y < 0 || x >= W || y >= H) return; G[y * W + x] = c; LT[y * W + x] = LITM; }
/** erase a pixel */
export function e(x, y) { x += OX; y += OY; if (x < 0 || y < 0 || x >= W || y >= H) return; G[y * W + x] = null; }
export function get(x, y) { x += OX; y += OY; return (x < 0 || y < 0 || x >= W || y >= H) ? null : G[y * W + x]; }
/** filled rect */
export function r(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p(x + i, y + j, c); }
/** list of integer points on a line (inclusive) */
export function pts(x0, y0, x1, y1) {
  const o = []; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let er = dx + dy;
  for (let k = 0; k < 200; k++) { o.push([x0, y0]); if (x0 === x1 && y0 === y1) break; const e2 = 2 * er; if (e2 >= dy) { er += dy; x0 += sx; } if (e2 <= dx) { er += dx; y0 += sy; } }
  return o;
}
export function ln(x0, y0, x1, y1, c) { for (const q of pts(x0, y0, x1, y1)) p(q[0], q[1], c); }
/** pixels plotted inside stay bright at night (phone screens) */
export function glit(fn) { const m = LITM; LITM = 1; try { fn(); } finally { LITM = m; } }
/** draw an ascii sprite: rows of chars, map {char: hex}; (x,y) = top-left */
export function ascii(rows, map, x, y) { for (let j = 0; j < rows.length; j++) { const s = rows[j]; for (let i = 0; i < s.length; i++) { const c = map[s[i]]; if (c) p(x + i, y + j, c); } } }

const OC = new Map();
const olc = (c, k) => { const key = c + k; let v = OC.get(key); if (!v) { v = dk(c.slice(0, 7), k); OC.set(key, v); } return v; };
/** outline + blit to the raster target at pixel (ax, ay). mirror flips horizontally around the anchor column. */
export function flush(ax, ay, mirror, k = .62) {
  const out = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x; if (G[i]) continue;
    const n = G[i - W] || G[i - 1] || G[i + 1] || G[i + W]; if (n) out.push(x, y, olc(n, k));
  }
  for (let i = 0; i < out.length; i += 3) px(ax + (mirror ? -(out[i] - OX) : out[i] - OX), ay + out[i + 1] - OY, C(out[i + 2]));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, c = G[i]; if (!c) continue;
    const X = ax + (mirror ? -(x - OX) : x - OX), Y = ay + y - OY;
    if (LT[i]) lit(() => px(X, Y, C(c))); else px(X, Y, C(c));
  }
}
/** soft ground shadow straight to the target (not outlined) */
export function shadow(ax, ay, cx, cy, rx, mirror) {
  const c = C('#2a1f4560'); if (mirror) cx = -cx;
  for (let x = -rx; x <= rx; x++) px(ax + cx + x, ay + cy, c);
  for (let x = -rx + 2; x <= rx - 2; x++) { px(ax + cx + x, ay + cy - 1, c); px(ax + cx + x, ay + cy + 1, c); }
}
