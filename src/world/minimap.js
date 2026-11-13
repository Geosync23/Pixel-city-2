// Top-down stylised map of the city for the phone's Map app (pure; no DOM).
//   renderMinimap(world, pxPerUnit = 1) -> { w, h, data: Uint8ClampedArray RGBA }
import { GT } from '../engine/world.js';
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const GC = { [GT.grass]: '#a9d18a', [GT.lawn]: '#9fd086', [GT.park]: '#8fc97a', [GT.sidewalk]: '#d9d5c8', [GT.asphalt]: '#f6f3ea', [GT.plaza]: '#e4dcc6', [GT.cobble]: '#cfcac4', [GT.brickpave]: '#dcc0b0',
  [GT.water]: '#7fbfe6', [GT.deepwater]: '#6aaedb', [GT.sand]: '#eee0b0', [GT.dirt]: '#c9b08c', [GT.ballast]: '#b9b2a6', [GT.boardwalk]: '#d2b48a', [GT.concrete]: '#cfcfca', [GT.tarmac]: '#b7b9c2', [GT.soil]: '#b89878',
  [GT.gravel]: '#e3dcc6', [GT.stairs]: '#c9c4b6', [GT.rock]: '#a9a6a0' };
export const DISTRICT_COLORS = { downtown: '#6f8fd8', oldtown: '#c9785c', harbor: '#4fa3a0', hillcrest: '#b98fd0', maplewood: '#e0a84e', arts: '#e06f9a', railyard: '#8a8f99', park: '#5fae6a', airport: '#7f8fb0' };
export function renderMinimap(world, s = 1) {
  s = Math.max(1, Math.round(s)); const w = world.w * s, h = world.h * s, d = new Uint8ClampedArray(w * h * 4);
  const set = (x, y, c) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const o = (y * w + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; };
  const rect = (x0, y0, x1, y1, c) => { for (let y = Math.round(y0 * s); y < Math.round(y1 * s); y++) for (let x = Math.round(x0 * s); x < Math.round(x1 * s); x++) set(x, y, c); };
  const cols = {}; for (const k in GC) cols[k] = hex(GC[k]);
  for (let ty = 0; ty < world.h; ty++) for (let tx = 0; tx < world.w; tx++) { const t = world.gt[ty * world.w + tx]; let c = cols[t] || cols[GT.grass]; const hh = world.H(tx, ty); if (t === GT.grass || t === GT.park || t === GT.lawn) { const k = Math.min(.25, Math.max(0, hh) * .022); c = [c[0] * (1 - k) + 250 * k, c[1] * (1 - k) + 240 * k, c[2] * (1 - k) + 200 * k]; } if (world.steep(tx, ty) > .7 && t !== GT.water && t !== GT.deepwater) c = [150, 140, 130]; rect(tx, ty, tx + 1, ty + 1, c); }
  const dk = {}; for (const D of world.districts || []) dk[D.id] = hex(DISTRICT_COLORS[D.key] || '#999999');
  for (const ob of world.objs) { if (!ob.a || ob.a.kind !== 'building') continue; const c = dk[world.zoneAt((ob.B[0] + ob.B[3]) / 2, (ob.B[1] + ob.B[4]) / 2)] || [140, 140, 140]; rect(ob.B[0], ob.B[1], ob.B[3], ob.B[4], [c[0] * .6, c[1] * .6, c[2] * .6]); rect(ob.B[0] + .5 / s, ob.B[1] + .5 / s, ob.B[3] - 1 / s, ob.B[4] - 1 / s, c); }
  const R = world.rail; if (R && R.path) { const P = R.path, cc = [224, 68, 58]; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; rect(Math.min(a[0], b[0]) - .7, Math.min(a[1], b[1]) - .7, Math.max(a[0], b[0]) + .7, Math.max(a[1], b[1]) + .7, cc); } for (const st of R.stations) { rect(st.x - 2.5, st.y - 2.5, st.x + 2.5, st.y + 2.5, [40, 36, 51]); rect(st.x - 1.5, st.y - 1.5, st.x + 1.5, st.y + 1.5, [255, 255, 255]); } }
  return { w, h, data: d };
}
