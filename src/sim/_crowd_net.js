// Walkway network for pedestrians: walkway rects + links (joins where rects touch/overlap, crossings over a road, short gaps).
import { GT } from '../engine/world.js';

/** -> { W: [{i,x0,y0,x1,y1,axis,district,kind,links:[{to,cross,ax,ay,bx,by,x0,y0,x1,y1}],len}], nearest(x,y,maxD) } */
export function buildNet(world) {
  const W = world.walkways.map((k, i) => ({ i, x0: k.x0, y0: k.y0, x1: k.x1, y1: k.y1, axis: k.axis, district: k.district === 'harborside' ? 'harbor' : k.district, kind: k.kind, links: [], len: Math.max(k.x1 - k.x0, k.y1 - k.y0), wid: Math.min(k.x1 - k.x0, k.y1 - k.y0) }));
  const blocked = (x, y) => world.isBlocked(x, y), tt = (x, y) => world.tileType(x, y);
  // sample a straight line: -1 blocked/water, else number of asphalt samples
  const probe = (ax, ay, bx, by) => { const d = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.ceil(d / .4)); let road = 0; for (let k = 0; k <= n; k++) { const x = ax + (bx - ax) * k / n, y = ay + (by - ay) * k / n; if (blocked(x, y)) return -1; const t = tt(x, y); if (t === GT.asphalt) road++; else if (t === GT.water || t === GT.deepwater || t === GT.void || t === GT.tarmac || t === GT.ballast) return -1; } return road; };
  const gapLink = (A, B, ax, ay, bx, by) => { const r = probe(ax, ay, bx, by); if (r < 0) return; const d = Math.hypot(bx - ax, by - ay); if (!r && d > 4.5) return; A.links.push({ to: B.i, cross: r > 0, ax, ay, bx, by, x0: ax, y0: ay, x1: ax, y1: ay }); B.links.push({ to: A.i, cross: r > 0, ax: bx, ay: by, bx: ax, by: ay, x0: bx, y0: by, x1: bx, y1: by }); };
  const inset = (lo, hi, m) => hi - lo > 2 * m ? [lo + m, hi - m] : [(lo + hi) / 2, (lo + hi) / 2];
  for (let i = 0; i < W.length; i++) for (let j = i + 1; j < W.length; j++) {
    const A = W[i], B = W[j], gx = Math.max(A.x0 - B.x1, B.x0 - A.x1), gy = Math.max(A.y0 - B.y1, B.y0 - A.y1); if (gx > 10.5 || gy > 10.5) continue;
    if (gx <= .3 && gy <= .3) { // touching / overlapping: walk through the shared area
      let [x0, x1] = inset(Math.max(A.x0, B.x0), Math.min(A.x1, B.x1), .45), [y0, y1] = inset(Math.max(A.y0, B.y0), Math.min(A.y1, B.y1), .45); if (x0 > x1) x0 = x1 = (x0 + x1) / 2; if (y0 > y1) y0 = y1 = (y0 + y1) / 2;
      let cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ok = !blocked(cx, cy) && tt(cx, cy) !== GT.asphalt;
      if (!ok) for (let k = 0; k < 12 && !ok; k++) { cx = x0 + (x1 - x0) * ((k * .37) % 1); cy = y0 + (y1 - y0) * ((k * .61) % 1); ok = !blocked(cx, cy) && tt(cx, cy) !== GT.asphalt; }
      if (!ok) continue; if (x1 - x0 > 12) { x0 = cx - 6; x1 = cx + 6; } if (y1 - y0 > 12) { y0 = cy - 6; y1 = cy + 6; }
      A.links.push({ to: j, cross: false, ax: cx, ay: cy, bx: NaN, by: NaN, x0, y0, x1, y1 }); B.links.push({ to: i, cross: false, ax: cx, ay: cy, bx: NaN, by: NaN, x0, y0, x1, y1 }); continue;
    }
    const mA = Math.min(.7, A.wid / 2), mB = Math.min(.7, B.wid / 2);
    if (gx > .3 && gy <= .3) { // separated along x
      const o0 = Math.max(A.y0, B.y0), o1 = Math.min(A.y1, B.y1), ov = o1 - o0; if (ov < 1.2) continue; const left = A.x1 < B.x0, ax = left ? A.x1 - mA : A.x0 + mA, bx = left ? B.x0 + mB : B.x1 - mB;
      for (const y of ov <= 5 ? [(o0 + o1) / 2] : [o0 + 1.1, o1 - 1.1]) gapLink(A, B, ax, y, bx, y);
    } else if (gy > .3 && gx <= .3) {
      const o0 = Math.max(A.x0, B.x0), o1 = Math.min(A.x1, B.x1), ov = o1 - o0; if (ov < 1.2) continue; const up = A.y1 < B.y0, ay = up ? A.y1 - mA : A.y0 + mA, by = up ? B.y0 + mB : B.y1 - mB;
      for (const x of ov <= 5 ? [(o0 + o1) / 2] : [o0 + 1.1, o1 - 1.1]) gapLink(A, B, x, ay, x, by);
    } else if (gx <= 3.5 && gy <= 3.5) { // diagonal corner gap
      const ax = A.x1 < B.x0 ? A.x1 - mA : A.x0 + mA, bx = A.x1 < B.x0 ? B.x0 + mB : B.x1 - mB, ay = A.y1 < B.y0 ? A.y1 - mA : A.y0 + mA, by = A.y1 < B.y0 ? B.y0 + mB : B.y1 - mB;
      if (probe(ax, ay, bx, by) === 0) gapLink(A, B, ax, ay, bx, by);
    }
  }
  const res = { i: -1, x: 0, y: 0, d: 0 };
  /** nearest walkway to a point (reuses one result object) or null */
  const nearest = (x, y, maxD = 12) => { let bd = maxD, bi = -1; for (let i = 0; i < W.length; i++) { const k = W[i], dx = x < k.x0 ? k.x0 - x : x > k.x1 ? x - k.x1 : 0, dy = y < k.y0 ? k.y0 - y : y > k.y1 ? y - k.y1 : 0, d = Math.hypot(dx, dy); if (d < bd) { bd = d; bi = i; } } if (bi < 0) return null; const k = W[bi], m = Math.min(.6, k.wid / 2); res.i = bi; res.x = Math.max(k.x0 + m, Math.min(k.x1 - m, x)); res.y = Math.max(k.y0 + m, Math.min(k.y1 - m, y)); res.d = bd; return res; };
  return { W, nearest };
}
