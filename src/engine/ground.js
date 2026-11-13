// Terrain chunk painter: turns World terrain (heights + ground types + decals) into cached pixel sprites.
import * as R from './raster.js';
import { GT } from './world.js';
const { hash2, dk, lt, mix, ENV } = R;
export const CH = 16; // tiles per chunk side

const speck = (a, b, c, s) => (x, y) => { const k = hash2(Math.floor(x * 16), Math.floor(y * 16), s); return k < .08 ? b : k > .94 ? c : a; };
const slabs = (a, b, j, s) => (x, y) => { const fx = x / s - Math.floor(x / s), fy = y / s - Math.floor(y / s); if (fx < .07 || fy < .07) return j; return hash2(Math.floor(x / s), Math.floor(y / s), 2) > .5 ? a : b; };
const boards = (c, wd) => { const s = dk(c, .25), c2 = lt(c, .1); return (x, y) => { const r = Math.floor(y / wd), fy = y / wd - r; if (fy < .14) return s; const xx = x + (r & 1) * 1.3; return (xx % 2.6) < .08 ? s : hash2(Math.floor(xx / 2.6), r, 9) > .6 ? c2 : c; }; };
const cobble = (a, b, j) => (x, y) => { const r = Math.floor(y * 3), xx = x * 3 + (r & 1) * .5, fx = xx - Math.floor(xx), fy = y * 3 - r; if (fx < .18 || fy < .2) return j; return hash2(Math.floor(xx), r, 4) > .5 ? a : b; };
const water = (a, b, c) => (x, y) => { const w = Math.sin(x * 2.1 + y * 1.3) + Math.sin(x * .7 - y * 2.3); const k = hash2(Math.floor(x * 16), Math.floor(y * 8), 6); return w > 1.25 && k > .4 ? c : (Math.floor(x * 8 + y * 8) & 1) ? a : b; };

/** painters per ground type: () => fn(wx, wy) -> hex. Called once per chunk render (so they can read the season). */
export const GROUND_PAINT = {
  [GT.grass]: () => { const g = R.grassC(); return speck(g[0], g[1], dk(g[0], .12), 1); },
  [GT.lawn]: () => { const g = R.grassC(); return (x, y) => (Math.floor((x + y) * 2) & 1) ? g[0] : g[1]; },
  [GT.park]: () => { const g = R.grassC(), f = ENV.season === 0 ? '#f4d35e' : ENV.season === 1 ? '#f2f2f2' : null; return (x, y) => { const k = hash2(Math.floor(x * 16), Math.floor(y * 16), 11); return f && k > .992 ? f : k < .1 ? g[1] : k > .93 ? dk(g[0], .1) : g[0]; }; },
  [GT.sidewalk]: () => slabs('#bab5a7', '#b2ad9f', '#9d988a', 1),
  [GT.plaza]: () => slabs('#d3ccba', '#c9c2b0', '#b0a995', 2),
  [GT.brickpave]: () => cobble('#b9705a', '#ad6650', '#8f5443'),
  [GT.cobble]: () => cobble('#9c9a98', '#8f8d8b', '#6f6d70'),
  [GT.asphalt]: () => speck('#4b4a52', '#46454d', '#514f58', 3),
  [GT.tarmac]: () => speck('#5a5b62', '#55565d', '#606168', 5),
  [GT.concrete]: () => slabs('#b9b9b4', '#b3b3ae', '#9c9c98', 4),
  [GT.water]: () => ENV.season === 3 ? water('#5d9cc0', '#66a5c8', '#cfe6f2') : water('#4f9fcf', '#57a8d8', '#a6d8f0'),
  [GT.deepwater]: () => water('#3d86b8', '#448dc0', '#7fc0e0'),
  [GT.sand]: () => speck('#e6d6a8', '#dccb9a', '#f0e2ba', 7),
  [GT.dirt]: () => speck('#a07850', '#946d46', '#ab8459', 8),
  [GT.soil]: () => (x, y) => (Math.floor(y * 4) & 1) ? '#6f4e37' : '#7b583f',
  [GT.gravel]: () => speck('#d6cbb0', '#c7bc9f', '#e2d8c0', 9),
  [GT.ballast]: () => speck('#8b857a', '#7e786d', '#979186', 10),
  [GT.boardwalk]: () => boards('#b08a5a', .5),
  [GT.rock]: () => speck('#8d8a86', '#7f7c78', '#9b9894', 12),
  [GT.stairs]: () => () => '#c4bfb2',
  [GT.f_wood]: () => boards('#c89b6a', .5),
  [GT.f_darkwood]: () => boards('#8a5f3f', .5),
  [GT.f_tile]: () => slabs('#e9e6dc', '#dfdcd2', '#c2beb2', .5),
  [GT.f_check]: () => (x, y) => ((Math.floor(x * 2) + Math.floor(y * 2)) & 1) ? '#f2efe6' : '#3c3a44',
  [GT.f_carpet]: () => speck('#7d6f9c', '#766894', '#857aa4', 13),
  [GT.f_concrete]: () => speck('#a9a9a6', '#a2a29f', '#b0b0ad', 14),
  [GT.f_lino]: () => slabs('#cfe0d8', '#c6d8cf', '#aebfb6', 1),
  [GT.f_mat]: () => speck('#4a6fa5', '#44679a', '#5177ad', 15),
  [GT.f_stone]: () => slabs('#b7b0a6', '#aaa399', '#8f887e', 1),
  [GT.f_dance]: () => (x, y) => ['#3b2f5c', '#4a3a70', '#35294f'][(Math.floor(x) + Math.floor(y) * 2) % 3],
};
const SOFT = new Set([GT.grass, GT.lawn, GT.park, GT.sand, GT.dirt, GT.soil]);
const PAVED = new Set([GT.sidewalk, GT.plaza, GT.brickpave, GT.cobble, GT.concrete, GT.boardwalk]);
const ROAD = new Set([GT.asphalt]);
const WET = new Set([GT.water, GT.deepwater]);
function edgeColor(a, b) { // colour of the border line drawn on tile type a where it meets b (or null)
  if (PAVED.has(a) && ROAD.has(b)) return '#dedacd';
  if (PAVED.has(a) && SOFT.has(b)) return '#8f8a7c';
  if (!WET.has(a) && WET.has(b)) return SOFT.has(a) ? '#c9b98a' : '#8a8578';
  if (a >= 32 && b === 0) return null;
  return null;
}

/** Render one chunk. Returns raster result {w,h,x,y,buf,lb} (see raster.render) or null if empty. */
export function renderChunk(world, cx, cy) {
  const x0 = cx * CH, y0 = cy * CH, x1 = Math.min(world.w, x0 + CH), y1 = Math.min(world.h, y0 + CH);
  if (x0 >= world.w || y0 >= world.h || x1 <= 0 || y1 <= 0) return null;
  let zmin = 1e9, zmax = -1e9, any = false;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const z = world.H(x, y); if (z < zmin) zmin = z; if (z > zmax) zmax = z; }
  for (let y = y0; y < y1 && !any; y++) for (let x = x0; x < x1; x++) if (world.gt[y * world.w + x]) { any = true; break; }
  if (!any) return null;
  const skirt = world.skirt === undefined ? 3 : world.skirt;
  const sb = R.screenBox([x0, y0, zmin - skirt, x1, y1, zmax]);
  const paint = {}; const P = t => paint[t] || (paint[t] = (GROUND_PAINT[t] || GROUND_PAINT[GT.concrete])());
  const winter = ENV.season === 3;
  const T = (x, y) => (x < 0 || y < 0 || x >= world.w || y >= world.h) ? 0 : world.gt[y * world.w + x];
  return R.render(sb, () => {
    for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) {
      const t = world.gt[ty * world.w + tx]; if (!t) continue;
      const a = world.H(tx, ty), b = world.H(tx + 1, ty), c = world.H(tx + 1, ty + 1), d = world.H(tx, ty + 1);
      const hi = Math.max(a, b, c, d), lo = Math.min(a, b, c, d);
      let fn = P(t);
      if (winter && (PAVED.has(t) || t === GT.dirt || t === GT.sand || t === GT.gravel || t === GT.soil)) { const f0 = fn; fn = (x, y) => hash2(Math.floor(x * 8), Math.floor(y * 8), 21) > .62 ? '#eef3f6' : f0(x, y); }
      if (hi - lo < 1e-4) R.qz(tx, tx + 1, ty, ty + 1, a, fn);
      else if (t === GT.stairs) {
        // steps: bands perpendicular to the slope direction
        const alongY = Math.abs(d - a) >= Math.abs(b - a), n = Math.max(2, Math.round((hi - lo) * 4));
        for (let i = 0; i < n; i++) {
          const t0 = i / n, t1 = (i + 1) / n;
          if (alongY) { const up = d < a, z = a + (d - a) * (up ? t0 : t1); R.qz(tx, tx + 1, ty + t0, ty + t1, z, i & 1 ? '#c9c4b7' : '#bdb8ab'); if (d < a) R.qy(tx, tx + 1, ty + t1, a + (d - a) * t1, z, '#9d988a'); }
          else { const up = b < a, z = a + (b - a) * (up ? t0 : t1); R.qz(tx + t0, tx + t1, ty, ty + 1, z, i & 1 ? '#c9c4b7' : '#bdb8ab'); if (b < a) R.qx(tx + t1, ty, ty + 1, a + (b - a) * t1, z, '#8d887a'); }
        }
      } else {
        const steep = hi - lo > .7;
        // facing: slopes descending toward +y are lighter (face the viewer's left light), toward +x darker
        const gy = ((c + d) - (a + b)) / 2, gx = ((b + c) - (a + d)) / 2;
        let f2;
        if (steep) { const base = world.cliff || '#8f8a80', c1 = gx < gy ? dk(base, .1) : dk(base, .3), c2 = dk(c1, .18), c3 = lt(c1, .12); f2 = (X, Y) => { const k = hash2(X >> 2, Y >> 1, 31); return (Y % 5 === 0) ? c2 : k > .85 ? c3 : c1; }; }
        else { const sh = Math.max(-.25, Math.min(.25, gx * .25 - gy * .12)); f2 = (X, Y) => { const s = PWinv(X, Y, (a + b + c + d) / 4); const h = fn(s[0], s[1]); return sh > 0 ? dk(h, sh) : lt(h, -sh); }; }
        const pa = R.PW(tx, ty, a), pb = R.PW(tx + 1, ty, b), pc = R.PW(tx + 1, ty + 1, c), pd = R.PW(tx, ty + 1, d);
        R.fill([pa, pb, pc], f2); R.fill([pa, pc, pd], f2);
      }
      // border lines against other ground types
      const e1 = edgeColor(t, T(tx, ty + 1)), e2 = edgeColor(t, T(tx + 1, ty)), e3 = edgeColor(t, T(tx, ty - 1)), e4 = edgeColor(t, T(tx - 1, ty));
      if (e1) R.lw([tx, ty + 1, d], [tx + 1, ty + 1, c], e1); if (e2) R.lw([tx + 1, ty, b], [tx + 1, ty + 1, c], e2);
      if (e3) R.lw([tx, ty, a], [tx + 1, ty, b], e3); if (e4) R.lw([tx, ty, a], [tx, ty + 1, d], e4);
      // skirts where the world ends / floor meets void
      if (!T(tx, ty + 1)) R.fq([[tx, ty + 1, d], [tx + 1, ty + 1, c], [tx + 1, ty + 1, c - skirt], [tx, ty + 1, d - skirt]], dk(world.edge, .1));
      if (!T(tx + 1, ty)) R.fq([[tx + 1, ty, b], [tx + 1, ty + 1, c], [tx + 1, ty + 1, c - skirt], [tx + 1, ty, b - skirt]], dk(world.edge, .3));
    }
    const dl = world.decals.get(cx + ',' + cy); if (dl) { const zAt = (x, y) => world.heightAt(x, y); for (const d of dl) d.draw(R, zAt); }
  }, null, 2);
}
let _ox = 0, _oy = 0;
// inverse projection helper for sloped tiles; needs the current target origin which raster does not expose -> derive from PW(0,0,0)
function PWinv(X, Y, z) { const o = R.PW(0, 0, 0); const sx = X + .5 - o[0], sy = Y + .5 - o[1] + z * R.U; const A = sx / R.U, B = sy / (R.U / 2); return [(A + B) / 2, (B - A) / 2]; }
