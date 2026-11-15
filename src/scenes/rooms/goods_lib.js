// Layout engine for the home-goods store rooms (goods_stores.js, goods_stores2.js). No init. Every display piece is the REAL catalogue art of a good the store sells
// (item fields gd = good id, gs = store id, fixture tag `gdisp` -> tap to inspect / buy, see sim/goods.js). One piece per family (the colourways are in the sheet).
//
// storeRoom(spec) -> room def (registered via venues_lib room(): crowd spots, venue = store id, goodsStore: true)
//   spec = { id (store id), w, d, floor, floors, wall, music, zoom, exit: { x, y }, counter: { x, y, p, flip }, items: [fixture items], npc: [spots], zones: [zone], lights: n }
//   zone kinds (room coords; every zone takes the store's families that match `take` and have not been shown yet, in catalogue order):
//     { k: 'rows', x, y, w, d, take, aisle = 1, gap = .5, max }        floor pieces packed in rows, fronts lined up on a walkable aisle
//     { k: 'set', x, y, w, d, take, wall: partition params | null, rug: true, floor }   a room set: back partition, a rug, then rows (aisle 1)
//     { k: 'table', x, y, w, d = .5, h, take, asset = 'goods.dtable', p, max }   a display table (or bench / plinth row) with small pieces on it (z = h)
//     { k: 'wall', wall: 'y' | 'x', from, to, take, gap = .5, mount }   wall pieces hung along a back wall
//     { k: 'flat', x, y, w, d, take, gap = .5 }                         rugs laid flat (walkable)
//   take: fn(good) | { cat: [..], place: [..], tag: [..], notCat: [..], carry: bool, lamp: bool, max }
// Diagnostics: def.goodsShown = [good ids on display], def.goodsHidden = [family keys with no room on the floor] (still sold at the counter).
import { GT } from '../../engine/world.js';
import { asset, assetSize } from '../../art/registry.js';
import { room, S as spotAt } from './venues_lib.js';
import { GOODS, STORE_BY_ID } from '../../data/goods.js';

const up = v => Math.ceil(v * 2 - 1e-6) / 2;
const sizeOf = g => { try { return assetSize(asset('furn.home.' + g.art), g.p); } catch (e) { return null; } };
const matches = (g, t) => {
  if (!t) return true; if (typeof t === 'function') return t(g);
  if (t.cat && !t.cat.includes(g.cat)) return false; if (t.notCat && t.notCat.includes(g.cat)) return false; if (t.place && !t.place.includes(g.place)) return false;
  if (t.tag && !t.tag.includes(g.tag)) return false; if (t.carry !== undefined && !!g.carry !== t.carry) return false; if (t.lamp !== undefined && !!g.lamp !== t.lamp) return false;
  if (t.art && !t.art.some(a => g.art === a || (g.p && g.p.k === a))) return false; return true;
};
const isRug = g => g.cat === 'rugs' || g.tag === 'rug';

export function storeRoom(spec) {
  const sid = spec.id, st = STORE_BY_ID[sid] || { name: sid }, items = [], npc = (spec.npc || []).slice(), shown = [];
  const fams = []; const seen = new Set();
  for (const g of GOODS) { if (!g.stores.includes(sid) || seen.has(g.family)) continue; seen.add(g.family); fams.push(g); }
  const left = new Set(fams); let nSpot = 0;
  const pickAll = (t, base) => fams.filter(g => left.has(g) && matches(g, t) && matches(g, base));
  const disp = (g, x, y, o) => { const it = Object.assign({ id: 'furn.home.' + g.art, x, y, p: Object.assign({}, g.p, g.lamp ? { on: true } : null), tags: ['gdisp'], gd: g.id, gs: sid }, o); items.push(it); left.delete(g); shown.push(g.id); return it; };
  const browse = (x, y, dir) => { if (nSpot++ % 2 === 0) npc.push(spotAt(x, y, dir, 'stand', 'customer')); };

  function rows(z, aisle) {
    const max = (z.take && z.take.max) || z.max || 999, gap = z.gap === undefined ? .5 : z.gap; let cy = z.y, n = 0;
    const cand = pickAll(z.take).filter(g => !isRug(g) && g.place !== 'wall' && (z.surface || g.place !== 'surface')).map(g => ({ g, s: sizeOf(g) })).filter(c => c.s);
    while (cy < z.y + z.d && n < max) {
      const row = []; let cx = z.x;
      for (const c of cand) { if (!left.has(c.g) || row.includes(c) || n + row.length >= max) continue; const w = up(c.s[0]), dd = up(c.s[1]); if (cy + dd > z.y + z.d || cx + w > z.x + z.w + 1e-6) continue; row.push(c); c.at = cx; cx += w + gap; }
      if (!row.length) break; const rd = Math.max(...row.map(c => up(c.s[1])));
      for (const c of row) { const y = cy + rd - up(c.s[1]), g = c.g, o = {};
        if (g.place === 'surface') o.solid = true;
        const it = disp(g, c.at, y, o);
        if (c.s[2] > .3 && g.tag === 'sofa' && n % 3 === 1) { it.n = 'seats'; it.ns = 1; } else browse(c.at + c.s[0] / 2, cy + rd + .45, 3); n++; }
      cy += rd + (aisle === undefined ? 1 : aisle);
    }
  }
  for (const z of spec.zones || []) {
    if (z.k === 'rows') rows(z, z.aisle);
    else if (z.k === 'set') {
      if (z.floor) (spec.floors = spec.floors || []).push({ x0: z.x, y0: z.y, x1: z.x + z.w, y1: z.y + z.d, floor: z.floor });
      let y0 = z.y;
      if (z.wall !== null) { items.push({ id: 'furn.goods.partition', x: z.x, y: z.y, p: Object.assign({ w: z.w, h: 1.8 }, z.wall || {}) }); y0 += .5; }
      if (z.rug !== false) { const r = pickAll(z.rugTake || null, { cat: ['rugs'] })[0]; const s = r && sizeOf(r);
        if (r && s && s[0] <= z.w - .5 && s[1] <= z.d - 1) disp(r, z.x + Math.floor((z.w - s[0])) / 2, y0 + Math.floor(z.d - (y0 - z.y) - s[1]) / 2, { solid: false }); }
      rows({ x: z.x + (z.pad === undefined ? .5 : z.pad), y: y0, w: z.w - 1, d: z.d - (y0 - z.y), take: z.take, max: z.max, gap: z.gap, surface: z.surface }, 1);
    } else if (z.k === 'table') {
      const h = z.h === undefined ? .75 : z.h, d = z.d || .5, a = z.asset || 'goods.dtable', tp = Object.assign({ w: z.w, d, h }, z.p || {});
      items.push({ id: 'furn.' + a, x: z.x, y: z.y, p: tp }); let cx = z.x + .0, n = 0; const max = z.max || 99;
      for (const g of pickAll(z.take, { place: ['surface'] })) {
        const s = sizeOf(g); if (!s || n >= max) continue; const w = up(s[0]); if (s[1] > d + .01 || cx + w > z.x + z.w + 1e-6) continue;
        disp(g, cx, z.y + d - up(s[1]), { z: h, solid: false }); browse(cx + s[0] / 2, z.y + d + .45, 3); cx += w; n++;
      }
    } else if (z.k === 'wall') {
      let at = z.from; const gap = z.gap === undefined ? .5 : z.gap;
      for (const g of pickAll(z.take, { place: ['wall'] })) {
        const s = sizeOf(g); if (!s) continue; const w = up(s[0]); if (at + w > z.to + 1e-6) continue;
        let mount = z.mount !== undefined ? z.mount : g.mount; if (mount === undefined) mount = asset('furn.home.' + g.art).mount || 1.2;
        const it = { id: 'furn.home.' + g.art, wall: z.wall, at, mount, p: Object.assign({}, g.p, g.lamp ? { on: true } : null), tags: ['gdisp'], gd: g.id, gs: sid }; items.push(it); left.delete(g); shown.push(g.id); at += w + gap;
      }
    } else if (z.k === 'flat') {
      let cy = z.y; const gap = z.gap === undefined ? .5 : z.gap;
      const cand = pickAll(z.take).filter(isRug).map(g => ({ g, s: sizeOf(g) })).filter(c => c.s);
      while (cy < z.y + z.d) { let cx = z.x, rd = 0, any = false;
        for (const c of cand) { if (!left.has(c.g)) continue; const w = up(c.s[0]), dd = up(c.s[1]); if (cy + dd > z.y + z.d || cx + w > z.x + z.w + 1e-6) continue; disp(c.g, cx, cy, { solid: false }); cx += w + gap; rd = Math.max(rd, dd); any = true; }
        if (!any) break; cy += rd + gap; }
    }
  }
  if (spec.counter) { const c = spec.counter; items.push(Object.assign({ id: 'furn.' + (c.asset || 'homegoods.counter'), x: c.x, y: c.y, flip: !!c.flip, p: c.p || {}, n: 'staff' }, c.o || {})); }
  for (const it of spec.items || []) items.push(it);
  const exit = spec.exit || { x: spec.w / 2, y: spec.d - .5 };
  /* flat things first (rugs, floor arrows) so they never draw over furniture */
  const flat = it => { if (it.wall) return 1; try { const a = asset(it.id); return a.flat || (it.solid === false && assetSize(a, it.p || {})[2] < .1) ? 0 : 1; } catch (e) { return 1; } };
  items.sort((a, b) => flat(a) - flat(b));
  const def = room({ id: sid, name: st.name, w: spec.w, d: spec.d, floor: spec.floor || GT.f_wood, floors: spec.floors || [], wall: spec.wall, music: spec.music || 'shop', zoom: spec.zoom, items, npc,
    exits: [{ x: exit.x, y: exit.y, label: 'Exit to the street' }], venue: sid, goodsStore: true, tags: ['shop', 'goods'] });
  def.goodsShown = shown; def.goodsHidden = fams.filter(g => left.has(g)).map(g => g.id);
  return def;
}
/** quick helpers for fixtures */
export const F = (a, x, y, p, o) => Object.assign({ id: 'furn.' + a, x, y }, p ? { p } : null, o);
export const WY = (a, at, p, mount) => Object.assign({ id: 'furn.' + a, wall: 'y', at }, p ? { p } : null, mount !== undefined ? { mount } : null);
export const WX = (a, at, p, mount) => Object.assign({ id: 'furn.' + a, wall: 'x', at }, p ? { p } : null, mount !== undefined ? { mount } : null);
export const HL = (x, y, kind, c) => F('pshop.hanglight', x, y, { kind: kind || 'bulb', c });
export const SIGNY = (at, text, bg, fg, mount = 2.15) => WY('pshop.sign', at, { text, bg, fg, lit: true }, mount);
export const HANG = (x, y, text, c, fg) => F('goods.hangsign', x, y, { text, c, fg });
