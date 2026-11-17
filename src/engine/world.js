// World = one walkable isometric space: the city, or a single interior room. Pure data + queries (no DOM).
//  - terrain: vertex height grid (continuous; steep tiles become cliffs), ground type per tile
//  - static objects (asset instances) with a screen-space spatial hash for culling
//  - nav grid at 0.5-unit resolution
import { WS, screenBox } from './raster.js';
import { asset, assetSize, assetVB } from '../art/registry.js';

/** Ground types. walk: can walk on it. Painters live in engine/ground.js (GROUND_PAINT). */
export const GT = {
  void: 0, grass: 1, sidewalk: 2, asphalt: 3, plaza: 4, cobble: 5, water: 6, sand: 7, dirt: 8, ballast: 9, boardwalk: 10,
  concrete: 11, tarmac: 12, soil: 13, gravel: 14, stairs: 15, park: 16, deepwater: 17, rock: 18, brickpave: 19, lawn: 20,
  // interior floors
  f_wood: 32, f_tile: 33, f_carpet: 34, f_concrete: 35, f_check: 36, f_darkwood: 37, f_lino: 38, f_mat: 39, f_stone: 40, f_dance: 41,
};
export const GT_NAME = Object.fromEntries(Object.entries(GT).map(([k, v]) => [v, k]));
const NOWALK = new Set([GT.void, GT.water, GT.deepwater]);
export const STEEP = 0.7;   // max height difference across a tile that is still walkable (unless stairs)
export const CELL = 256;    // spatial hash cell in screen px

const sw = b => [b[1], b[0], b[2], b[4], b[3], b[5]];

export class World {
  /** w,h in tiles (world units). */
  constructor(w, h, opts = {}) {
    this.w = w; this.h = h; this.name = opts.name || 'world';
    this.hv = new Float32Array((w + 1) * (h + 1));
    this.gt = new Uint8Array(w * h);
    this.zone = new Uint8Array(w * h);        // district / room id per tile (meaning defined by the generator)
    this.nw = w * 2; this.nh = h * 2; this.nav = new Uint8Array(this.nw * this.nh); // 1 = blocked
    this.objs = []; this.lights = []; this.pois = []; this.decals = new Map();
    this.hash = new Map(); this.stamp = 0;
    this.edge = opts.edge || '#7a5a3e';       // colour of the world's cut-away skirt
    this.bg = opts.bg || null;                // background colour override (interiors)
    this.version = 0;                         // bump to invalidate ground chunks
  }
  /* ----- terrain ----- */
  H(ix, iy) { ix = ix < 0 ? 0 : ix > this.w ? this.w : ix; iy = iy < 0 ? 0 : iy > this.h ? this.h : iy; return this.hv[iy * (this.w + 1) + ix]; }
  setH(ix, iy, z) { if (ix >= 0 && iy >= 0 && ix <= this.w && iy <= this.h) this.hv[iy * (this.w + 1) + ix] = z; }
  /** bilinear terrain height at world position */
  heightAt(x, y) {
    const ix = Math.max(0, Math.min(this.w - 1, Math.floor(x))), iy = Math.max(0, Math.min(this.h - 1, Math.floor(y)));
    const fx = Math.max(0, Math.min(1, x - ix)), fy = Math.max(0, Math.min(1, y - iy)), W = this.w + 1, i = iy * W + ix, v = this.hv;
    return (v[i] * (1 - fx) + v[i + 1] * fx) * (1 - fy) + (v[i + W] * (1 - fx) + v[i + W + 1] * fx) * fy;
  }
  /** set all vertices in the tile rect [x0,x1]x[y0,y1] to height z (makes a flat pad / terrace) */
  flat(x0, y0, x1, y1, z) { for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) this.setH(x, y, z); }
  /** linear ramp across the rect: axis 'x' -> height goes zA at x0 to zB at x1; axis 'y' likewise along y */
  ramp(x0, y0, x1, y1, axis, zA, zB) {
    x0 = Math.round(x0); x1 = Math.round(x1); y0 = Math.round(y0); y1 = Math.round(y1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = axis === 'x' ? (x - x0) / Math.max(1, x1 - x0) : (y - y0) / Math.max(1, y1 - y0); this.setH(x, y, zA + (zB - zA) * t); }
  }
  /** raise/lower vertices by fn(x,y,current) -> new height */
  sculpt(x0, y0, x1, y1, fn) { for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) this.setH(x, y, fn(x, y, this.H(x, y))); }
  tileType(x, y) { x = Math.floor(x); y = Math.floor(y); return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.gt[y * this.w + x]; }
  /** paint ground type over tile rect [x0,x1) x [y0,y1) */
  ground(x0, y0, x1, y1, type) { x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(this.w, Math.ceil(x1)); y1 = Math.min(this.h, Math.ceil(y1)); for (let y = y0; y < y1; y++) this.gt.fill(type, y * this.w + x0, y * this.w + x1); }
  setZone(x0, y0, x1, y1, id) { x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(this.w, Math.ceil(x1)); y1 = Math.min(this.h, Math.ceil(y1)); for (let y = y0; y < y1; y++) this.zone.fill(id, y * this.w + x0, y * this.w + x1); }
  zoneAt(x, y) { x = Math.floor(x); y = Math.floor(y); return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.zone[y * this.w + x]; }
  /** max corner height difference of a tile */
  steep(tx, ty) { const a = this.H(tx, ty), b = this.H(tx + 1, ty), c = this.H(tx, ty + 1), d = this.H(tx + 1, ty + 1); return Math.max(a, b, c, d) - Math.min(a, b, c, d); }
  /**
   * Ground decal drawn on top of the terrain in the chunk layer (road markings, crosswalks, parking lines, manholes).
   * d = { x0,y0,x1,y1 (bounds), draw(R, zAt) } where R is the raster module and zAt(x,y) gives terrain height.
   */
  decal(d) { const cx0 = Math.floor(d.x0 / 16), cy0 = Math.floor(d.y0 / 16), cx1 = Math.floor((d.x1 - 1e-6) / 16), cy1 = Math.floor((d.y1 - 1e-6) / 16); for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) { const k = cx + ',' + cy; let a = this.decals.get(k); if (!a) this.decals.set(k, a = []); a.push(d); } }

  /* ----- nav ----- */
  setNav(x0, y0, x1, y1, v) { const gx0 = Math.max(0, Math.floor(x0 * 2 + 1e-6)), gy0 = Math.max(0, Math.floor(y0 * 2 + 1e-6)), gx1 = Math.min(this.nw, Math.ceil(x1 * 2 - 1e-6)), gy1 = Math.min(this.nh, Math.ceil(y1 * 2 - 1e-6)); for (let gy = gy0; gy < gy1; gy++) this.nav.fill(v, gy * this.nw + gx0, gy * this.nw + gx1); }
  block(x0, y0, x1, y1) { this.setNav(x0, y0, x1, y1, 1); }
  free(x0, y0, x1, y1) { this.setNav(x0, y0, x1, y1, 0); }
  isBlocked(x, y) { if (x < .25 || y < .25 || x > this.w - .25 || y > this.h - .25) return true; return this.nav[Math.floor(y * 2) * this.nw + Math.floor(x * 2)] === 1; }
  /** Recompute terrain-derived blocking (water, void, cliffs). Call after terrain edits and before placing objects. */
  bakeTerrainNav() {
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      const t = this.gt[ty * this.w + tx]; const bad = NOWALK.has(t) || (t !== GT.stairs && this.steep(tx, ty) > STEEP);
      if (bad) this.block(tx, ty, tx + 1, ty + 1);
    }
  }

  /* ----- objects ----- */
  /**
   * Place an asset instance. x,y = world position of the asset's local origin (snapped to 0.5).
   * o: { p: params, flip: bool, z: base height (default terrain height at footprint centre), solid: override, data: anything }
   * Returns the object {id, a, x,y,z, p, flip, B, sb, size, data}.
   */
  place(id, x, y, o = {}) {
    const a = typeof id === 'string' ? asset(id) : id, p = o.p || {}, flip = !!o.flip;
    x = Math.round(x * 2) / 2; y = Math.round(y * 2) / 2;
    let size = assetSize(a, p), vb = assetVB(a, p); if (flip) { size = [size[1], size[0], size[2]]; vb = sw(vb); }
    let z = o.z; if (z === undefined) z = this.heightAt(x + size[0] / 2, y + size[1] / 2); z = Math.round(z * 16) / 16;
    const ob = { id: a.id, a, x, y, z, p, flip, size, data: o.data, B: [x, y, z, x + size[0], y + size[1], z + size[2]] };
    const s = screenBox(vb), w = WS(x, y, z); ob.vbl = vb; ob.sb = [s[0] + w[0] - 3, s[1] + w[1] - 3, s[2] + w[0] + 3, s[3] + w[1] + 3];
    ob.k = ob.B[0] + ob.B[3] + ob.B[1] + ob.B[4];
    const solid = o.solid !== undefined ? o.solid : (a.solid !== undefined ? a.solid : a.kind !== 'vehicle');
    ob.solid = solid; if (solid) this.block(ob.B[0], ob.B[1], ob.B[3], ob.B[4]);
    if (a.light) { const L = a.light, lx = flip ? L.y : L.x, ly = flip ? L.x : L.y; this.lights.push({ x: x + lx, y: y + ly, z: z + (L.z || 0), r: L.r || 3, c: L.c, ob }); }
    this.objs.push(ob); this._hashAdd(ob); this.orev = (this.orev | 0) + 1;   /* orev: counts placed / removed objects (the renderer's light mask tiles hold the shapes of the objects in them, see render.js _occBake) */ return ob;
  }
  /** Place a custom drawable (not from the registry). spec = { key (unique sprite cache key), size:[w,d,h], vb?, draw(), solid? } */
  placeCustom(spec, x, y, o = {}) { const a = { id: 'custom:' + spec.key, kind: 'custom', size: spec.size, vb: spec.vb, draw: spec.draw, solid: spec.solid !== undefined ? spec.solid : true, light: spec.light }; return this.place(a, x, y, o); }
  remove(ob) { const i = this.objs.indexOf(ob); if (i >= 0) this.objs.splice(i, 1); this.orev = (this.orev | 0) + 1; for (const k of ob._cells || []) { const a = this.hash.get(k), j = a.indexOf(ob); if (j >= 0) a.splice(j, 1); } if (ob.solid) this.free(ob.B[0], ob.B[1], ob.B[3], ob.B[4]); this.lights = this.lights.filter(l => l.ob !== ob); }
  _hashAdd(ob) { const s = ob.sb, x0 = Math.floor(s[0] / CELL), y0 = Math.floor(s[1] / CELL), x1 = Math.floor(s[2] / CELL), y1 = Math.floor(s[3] / CELL); ob._cells = []; for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) { const k = cx * 100003 + cy; let a = this.hash.get(k); if (!a) this.hash.set(k, a = []); a.push(ob); ob._cells.push(k); } }
  /** all static objects whose sprite bounds intersect the screen-space rect (world px) */
  query(x0, y0, x1, y1, out = []) {
    const st = ++this.stamp; for (let cy = Math.floor(y0 / CELL); cy <= Math.floor(y1 / CELL); cy++) for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++) { const a = this.hash.get(cx * 100003 + cy); if (!a) continue; for (const ob of a) { if (ob._st === st) continue; ob._st = st; const s = ob.sb; if (s[2] < x0 || s[0] > x1 || s[3] < y0 || s[1] > y1) continue; out.push(ob); } }
    return out;
  }
  /** point of interest: { type, id, x, y, ...}  (doors, stops, stations, spawn points) */
  poi(p) { this.pois.push(p); return p; }
  findPois(type) { return this.pois.filter(p => p.type === type); }
}
