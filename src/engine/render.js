// Frame renderer: ground chunks -> depth-sorted sprites -> ambient light map -> night lights.
import { WS, U } from './raster.js';
import { renderChunk, CH } from './ground.js';
import { toSprite, objSprite } from './sprites.js';
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

function behind(A, B) {
  if (A[3] <= B[0] + 1e-6) return true; if (B[3] <= A[0] + 1e-6) return false;
  if (A[4] <= B[1] + 1e-6) return true; if (B[4] <= A[1] + 1e-6) return false;
  if (A[5] <= B[2] + 1e-6) return true; if (B[5] <= A[2] + 1e-6) return false;
  return A[0] + A[3] + A[1] + A[4] + (A[2] + A[5]) * .01 < B[0] + B[3] + B[1] + B[4] + (B[2] + B[5]) * .01;
}
/** topological depth sort of items {B: world AABB, r: screen rect, k: sort hint} */
export function sortItems(L) {
  const n = L.length, deps = new Array(n);
  for (let i = 0; i < n; i++) deps[i] = null;
  for (let i = 0; i < n; i++) { const a = L[i].r; for (let j = i + 1; j < n; j++) { const b = L[j].r; if (a[0] >= b[2] || b[0] >= a[2] || a[1] >= b[3] || b[1] >= a[3]) continue; if (behind(L[i].B, L[j].B)) (deps[j] || (deps[j] = [])).push(i); else (deps[i] || (deps[i] = [])).push(j); } }
  const out = [], st = new Uint8Array(n), order = new Array(n); for (let i = 0; i < n; i++) order[i] = i; order.sort((p, q) => L[p].k - L[q].k);
  const stack = [];
  for (const root of order) { if (st[root]) continue; stack.push(root, 0); st[root] = 1; while (stack.length) { const idx = stack[stack.length - 1], i = stack[stack.length - 2], d = deps[i]; if (d && idx < d.length) { stack[stack.length - 1]++; const c = d[idx]; if (!st[c]) { st[c] = 1; stack.push(c, 0); } } else { stack.length -= 2; out.push(L[i]); } } }
  return out;
}

const pools = new Map();
function poolSprite(r, col) { // banded, dithered ellipse of light
  const key = r + col; let c = pools.get(key); if (c) return c;
  const rx = Math.round(r * U * 1.2), ry = Math.round(rx / 2); c = mk(rx * 2 + 1, ry * 2 + 1); const x = c.getContext('2d'), id = x.createImageData(c.width, c.height), d = id.data;
  const n = parseInt(col.slice(1), 16), R0 = n >> 16, G0 = n >> 8 & 255, B0 = n & 255;
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) { const a = (i - rx) / rx, b = (j - ry) / ry, q = Math.sqrt(a * a + b * b); if (q >= 1) continue; const odd = (i + j) & 1; let k = q < .35 ? 1 : q < .55 ? (odd ? 1 : .7) : q < .75 ? .7 : q < .9 ? (odd ? .7 : .35) : (odd ? .35 : 0); const o = (j * c.width + i) * 4; d[o] = R0 * k; d[o + 1] = G0 * k; d[o + 2] = B0 * k; d[o + 3] = 255; }
  x.putImageData(id, 0, 0); pools.set(key, c); return c;
}

export class Renderer {
  constructor(canvas) { this.cv = canvas; this.ctx = canvas.getContext('2d'); this.B = mk(8, 8); this.M = mk(8, 8); this.W = 8; this.H = 8; this.stats = { items: 0, chunks: 0 }; this.maxNewChunks = 2; }
  resize(W, H) { this.W = W; this.H = H; this.cv.width = W; this.cv.height = H; this.B.width = W; this.B.height = H; this.M.width = W; this.M.height = H; this.ctx.imageSmoothingEnabled = false; }
  _chunk(world, cx, cy, budget) {
    const cache = world._chunks || (world._chunks = new Map()); const key = cx * 4096 + cy; let e = cache.get(key);
    if (e && e.ver === world.version) return e.spr;
    if (budget.n <= 0) return e ? e.spr : undefined; budget.n--;
    const spr = toSprite(renderChunk(world, cx, cy)); cache.delete(key); cache.set(key, { spr, ver: world.version });
    if (cache.size > 140) { const k = cache.keys().next().value; cache.delete(k); }
    return spr;
  }
  /** make sure all chunks around the camera exist (call after teleports to avoid pop-in) */
  warm(world, cam) { const m = this.maxNewChunks; this.maxNewChunks = 1e9; this._ground(world, cam, null); this.maxNewChunks = m; }
  _ground(world, cam, ctx) {
    const W = this.W, H = this.H, zr = (world.zmax || 14) * U, corners = [[cam.x, cam.y - 64], [cam.x + W, cam.y - 64], [cam.x, cam.y + H + zr], [cam.x + W, cam.y + H + zr]];
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [sx, sy] of corners) { const a = sx / U, b = sy / (U / 2), x = (a + b) / 2, y = (b - a) / 2; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const c0x = Math.max(0, Math.floor(x0 / CH)), c0y = Math.max(0, Math.floor(y0 / CH)), c1x = Math.min(Math.ceil(world.w / CH) - 1, Math.floor(x1 / CH)), c1y = Math.min(Math.ceil(world.h / CH) - 1, Math.floor(y1 / CH));
    const budget = { n: this.maxNewChunks }; let n = 0;
    for (let s = c0x + c0y; s <= c1x + c1y; s++) for (let cx = Math.max(c0x, s - c1y); cx <= Math.min(c1x, s - c0y); cx++) {
      const cy = s - cx;
      // quick reject: chunk diamond centre vs screen
      const cs = WS(cx * CH + CH / 2, cy * CH + CH / 2, 0); if (cs[0] < cam.x - CH * U - 8 || cs[0] > cam.x + W + CH * U + 8 || cs[1] < cam.y - CH * U / 2 - 8 - 64 || cs[1] > cam.y + H + CH * U / 2 + zr + 8) continue;
      const spr = this._chunk(world, cx, cy, budget); if (!spr) continue; n++;
      if (ctx) ctx.drawImage(spr.c, spr.x - cam.x, spr.y - cam.y);
    }
    this.stats.chunks = n;
  }
  /**
   * world: World. cam: {x,y} top-left in world px (integers). ents: dynamic entities, each
   *   { x,y,z, bb:[dx0,dy0,dx1,dy1,h] (sort box rel. to position), sprite(): {c,l,x,y,w,h}, hidden?, ghost? }
   * env: { amb: '#rrggbb' multiply colour, dark: 0..1 strength of night lights, bg: '#hex' }
   * hooks: { under(ctx,cam) after ground, over(ctx,cam) after lighting (markers, bubbles, weather) }
   */
  draw(world, cam, ents, env, hooks = {}) {
    const ctx = this.ctx, W = this.W, H = this.H;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = world.bg || env.bg || '#9fd6e8'; ctx.fillRect(0, 0, W, H);
    this._ground(world, cam, ctx);
    if (hooks.under) hooks.under(ctx, cam);
    const L = [], vx0 = cam.x - 4, vy0 = cam.y - 4, vx1 = cam.x + W + 4, vy1 = cam.y + H + 4;
    for (const ob of world.query(vx0, vy0, vx1, vy1)) { if (ob.hidden) continue; const spr = objSprite(ob); if (!spr) continue; const w = WS(ob.x, ob.y, ob.z); L.push({ B: ob.B, spr, ax: w[0], ay: w[1], r: ob.sb, k: ob.k }); }
    for (const e of ents) {
      if (e.hidden) continue; const spr = e.sprite(); if (!spr) continue; const w = WS(e.x, e.y, e.z), ax = Math.round(w[0]), ay = Math.round(w[1]);
      const r = [spr.x + ax, spr.y + ay, spr.x + ax + spr.w, spr.y + ay + spr.h]; if (r[2] < vx0 || r[0] > vx1 || r[3] < vy0 || r[1] > vy1) continue;
      const b = e.bb || BB, B = [e.x + b[0], e.y + b[1], e.z, e.x + b[2], e.y + b[3], e.z + b[4]];
      L.push({ B, spr, ax, ay, r, k: B[0] + B[3] + B[1] + B[4], e });
    }
    const S = sortItems(L); this.stats.items = S.length;
    for (const it of S) { const sp = it.spr; if (it.e && it.e.alpha !== undefined) { ctx.globalAlpha = it.e.alpha; ctx.drawImage(sp.c, sp.x + it.ax - cam.x, sp.y + it.ay - cam.y); ctx.globalAlpha = 1; } else ctx.drawImage(sp.c, sp.x + it.ax - cam.x, sp.y + it.ay - cam.y); }
    for (const it of S) if (it.e && it.e.ghost) { ctx.globalAlpha = .3; ctx.drawImage(it.spr.c, it.spr.x + it.ax - cam.x, it.spr.y + it.ay - cam.y); ctx.globalAlpha = 1; }
    const dark = env.dark || 0;
    if (env.amb && env.amb !== '#ffffff') {
      const m = this.M.getContext('2d'); m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.fillStyle = env.amb; m.fillRect(0, 0, W, H);
      if (dark > .05) { m.globalCompositeOperation = 'lighter'; m.globalAlpha = Math.min(1, dark * .5); for (const l of world.lights) { const s = WS(l.x, l.y, l.z), ps = poolSprite(l.r, l.c || '#ffd9a0'), x = Math.round(s[0]) - cam.x - (ps.width >> 1), y = Math.round(s[1]) - cam.y - (ps.height >> 1); if (x > W || y > H || x + ps.width < 0 || y + ps.height < 0) continue; m.drawImage(ps, x, y); } if (hooks.lights) hooks.lights(m, cam, poolSprite); }
      ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(this.M, 0, 0); ctx.globalCompositeOperation = 'source-over';
    }
    if (dark > .02) {
      const b = this.B.getContext('2d'); b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, W, H); let any = false;
      for (const it of S) { const sp = it.spr, x = sp.x + it.ax - cam.x, y = sp.y + it.ay - cam.y; if (any) { b.globalCompositeOperation = 'destination-out'; b.drawImage(sp.c, x, y); } if (sp.l) { b.globalCompositeOperation = 'source-over'; b.drawImage(sp.l, x, y); any = true; } }
      if (any) { ctx.globalCompositeOperation = 'lighten'; ctx.globalAlpha = Math.min(1, dark); ctx.drawImage(this.B, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    }
    if (hooks.over) hooks.over(ctx, cam);
    return S;
  }
}
const BB = [-.2, -.2, .2, .2, 1.4];
