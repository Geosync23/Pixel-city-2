// Building queue (pads are flattened before the nav bake, objects placed after), row fillers, named venues/homes.
import { ASSETS, assetSize, byTag } from '../art/registry.js';
import { W, H, GT } from './_ctx.js';

const SPECIAL = new Set(['venue', 'landmark', 'story', 'grandma', 'sibling', 'site', 'hartwell', 'cityhall', 'hotel', 'bank', 'store', 'gym', 'clothing', 'homegoods', 'pizza', 'bar', 'cinema', 'restaurant', 'fishmarket', 'courier', 'diner', 'gasstation', 'warehousejob', 'riverwalk', 'parking', 'kiosk', 'pavilion', 'factory', 'silo', 'grocery', 'clinic', 'station', 'viaduct', 'terminal', 'airside', 'lighthouse', 'harbormaster', 'boathouse', 'ramen', 'cafe', 'bakery', 'bookstore', 'cornerstore', 'library', 'school', 'tanks', 'substation', 'busdepot', 'brewery', 'villa']);
export function install(c) {
  const w = c.world; c.queue = []; c.lots = [];
  /** queue a building: flattens its pad to the street height, reserves the footprint. Returns a lot record. */
  c.bld = (id, x, y, o = {}) => {
    const a = typeof id === 'string' ? ASSETS.get(id) : id; if (!a) return null; const p = o.p || {}; let s = assetSize(a, p); if (o.flip) s = [s[1], s[0], s[2]];
    x = Math.round(x * 2) / 2; y = Math.round(y * 2) / 2; const x1 = x + s[0], y1 = y + s[1];
    let z = o.z; if (z === undefined) z = o.flip ? w.heightAt(Math.min(W - 1, x1 + 1), y + s[1] / 2) : w.heightAt(x + s[0] / 2, Math.min(H - 1, y1 + 1)); z = Math.round(z * 4) / 4;
    if (!o.noPad) w.flat(Math.floor(x), Math.floor(y), Math.ceil(x1), Math.ceil(y1), z);
    c.occSet(x, y, x1, y1, 3);
    const lot = { a, x, y, w: s[0], d: s[1], h: s[2], z, p, flip: !!o.flip, o }; c.queue.push(lot); c.lots.push(lot); return lot;
  };
  c.flushBuildings = () => { for (const l of c.queue) { l.ob = w.place(c.safe(l.a), l.x, l.y, { p: l.p, flip: l.flip, z: l.z, solid: l.o.solid }); c.stats[l.a.kind] = (c.stats[l.a.kind] || 0) + 1; } c.queue = []; };
  /** world position just outside a lot's door */
  c.door = (l, off = .75) => { const at = l.a.door && l.a.door.at !== undefined ? l.a.door.at : (l.flip ? l.d : l.w) / 2, side = (l.a.door && l.a.door.side) || 'y'; const fy = (side === 'y') !== l.flip; return fy ? { x: l.x + Math.min(at, l.w - .5), y: l.y + l.d + off, dir: 3 } : { x: l.x + l.w + off, y: l.y + Math.min(at, l.d - .5), dir: 2 }; };
  /** generic pool: buildings carrying any of `tags`, minus special-purpose ones (unless allow has their tag) */
  c.pool = (tags, o = {}) => { const out = []; for (const a of ASSETS.values()) { if (a.kind !== 'building') continue; const t = a.tags || []; if (!tags.some(k => t.includes(k))) continue; if (o.need && !o.need.every(k => t.includes(k))) continue; if (o.not && o.not.some(k => t.includes(k))) continue; if (t.some(k => SPECIAL.has(k) && !(o.allow || []).includes(k))) continue; for (const v of (a.variants && a.variants.length ? a.variants : [{}])) { const s = assetSize(a, v); out.push({ a, v, w: s[0], d: s[1], h: s[2] }); } } return out; };
  /**
   * Fill a frontage with buildings. axis 'y': facades face +y along the line y = front, from x = a to b. axis 'x': facades face +x (flipped) on x = front, from y = a to b.
   * o: { pool, r, maxD, minD, maxH, gap: [min,max], setback, ok (occ values allowed), each(lot) }
   */
  c.row = (axis, front, a, b, o) => {
    const r = o.r, pool = o.pool; if (!pool || !pool.length) return []; let t = a, last = null, last2 = null, lastV = null; const out = [], gap = o.gap || [0, 0], sb = o.setback || 0;
    while (t < b - 2.5) {
      const rem = b - t, fit = pool.filter(q => q.w <= rem && q.d <= (o.maxD || 12) && q.d >= (o.minD || 0) && q.h <= (o.maxH || 99) && q.h >= (o.minH || 0)); let cand = fit.filter(q => q.a !== last && q.a !== last2); if (!cand.length) cand = fit.filter(q => q.a !== last); if (!cand.length) cand = fit.filter(q => q.v !== lastV);
      let done = false;
      for (let k = 0; k < 6 && cand.length && !done; k++) {
        const q = cand[Math.floor(r() * cand.length)], x0 = axis === 'y' ? t : front - sb - q.d, y0 = axis === 'y' ? front - sb - q.d : t, x1 = axis === 'y' ? t + q.w : front - sb, y1 = axis === 'y' ? front - sb : t + q.w;
        if (!c.occFree(x0, y0, x1, y1, o.ok)) continue;
        const lot = c.bld(q.a, x0, y0, { p: Object.assign({}, q.v, { seed: 1 + Math.floor(r() * 9999) }, o.p || {}), flip: axis === 'x' }); out.push(lot); if (o.each) o.each(lot);
        last2 = last; last = q.a; lastV = q.v; t += q.w + gap[0] + Math.floor(r() * (gap[1] - gap[0] + 1)); done = true;
      }
      if (!done) t += 1;
    }
    return out;
  };
  /** a named, enterable place. cands: asset ids or [tag,...] arrays tried in order. Adds the door poi. */
  c.venue = (room, name, cands, x, front, o = {}) => {
    let a = null; for (const k of cands) { if (Array.isArray(k)) { const l = byTag(...k).filter(q => q.kind === 'building'); if (l.length) { a = l[0]; break; } } else if (ASSETS.has(k)) { a = ASSETS.get(k); break; } } if (!a) return null;
    const vs = a.variants && a.variants.length ? a.variants : [{}], p = Object.assign({}, vs[(o.variant || 0) % vs.length], { seed: o.seed || 7 }, o.p || {}); let s = assetSize(a, p);
    const lot = o.flip ? c.bld(a, front - s[1], x, { p, flip: true }) : c.bld(a, x, front - s[1], { p });
    const d = c.door(lot); lot.room = room; lot.name = name;
    w.poi({ type: 'door', id: 'door:' + room, room, name, x: d.x, y: d.y, dir: d.dir, district: w.districtAt(lot.x + lot.w / 2, lot.y + lot.d / 2) }); c.named[room] = lot;
    w.poi({ type: 'landmark', id: 'lm:' + room, name, x: lot.x + lot.w / 2, y: lot.y + lot.d / 2 });
    return lot;
  };
  /** paint + reserve a ground rect */
  c.paint = (x0, y0, x1, y1, t, occ) => { w.ground(x0, y0, x1, y1, t); if (occ !== undefined) c.occSet(x0, y0, x1, y1, occ); };
  /** scatter props in a rect on free cells. list: [[id, weight]] */
  c.scatter = (x0, y0, x1, y1, n, ids, r, o = {}) => { ids = ids.filter(i => ASSETS.has(i)); if (!ids.length) return; for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0 - 1), y = y0 + r() * (y1 - y0 - 1); if (o.occ && !o.occ.includes(c.occAt(x, y))) continue; if (o.flatOnly && w.steep(Math.floor(x), Math.floor(y)) > .3) continue; c.putv(c.pick(ids, r), x, y, r, { free: true }); } };
}
