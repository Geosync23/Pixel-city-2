// The home-goods stores in the city: which building each one lives in, its door, its sign. Runtime only, nothing saved, no world file touched.
//   - 12 stores take over EXISTING buildings that had no door (old town 2-floor rows, a harbor warehouse, Maplewood / Hillcrest houses): a door poi
//     `door:goods:<key>` (room `goods:<key>`) on the street side + a lit sign board over the door. The harbor warehouse is repainted blue and yellow
//     with the Fjord & Fold name (its own `name` / `wall` / `accent` params; same building, same footprint).
//   - Timber & Trowel, the big-box home centre, is the ONE new building: a large corrugated warehouse (existing art, bigger params) on the empty
//     grass at the west edge of Old Town, beside Old Town station (lot x 8-26, y 254-266). Only the trees standing on the lot are taken out.
// Runs on the first 'scene' event for the city, after lobbies (57) and before places (58), so G.places / map / addresses / nav pick the doors up.
// Closed stores refuse entry with a toast (hours in data/goods.js STORES).
// Exports SITES (store id -> building) for the docs / tests. API on G.goods (set by sim/goods.js): sites() -> [{ store, x, y, poi, ob }].
import { G } from '../core/game.js';
import { STORES, STORE_BY_ID } from '../data/goods.js';
import { ROOMS, enterRoom } from '../scenes/interior.js';
import { toast } from '../ui/kit.js';
import { setSiteLookup } from './goods.js';

export const order = 57.7;
export const SITES = [
  { store: 'goods:timber', build: { id: 'bld.ind.warehouse.corrugated', x: 8, y: 254, p: { w: 18, d: 12, h: 5, rh: 1.4, seed: 31, wall: '#d8752e', accent: '#2f5a48', name: 'TIMBER & TROWEL HOME CENTRE', code: 'T&T' } } },
  { store: 'goods:fjord', bld: 'bld.ind.warehouse.corrugated', at: [219, 331], repaint: { wall: '#3f6fb0', accent: '#f2c230', name: 'FJORD & FOLD', code: 'FF' } },
  { store: 'goods:bellwether', bld: 'bld.oldtown.rowhouse.bay', at: [70, 214] },
  { store: 'goods:lumen', bld: 'bld.oldtown.rowhouse.stucco', at: [126, 215] },
  { store: 'goods:copper', bld: 'bld.res.gablehouse', at: [273, 158] },
  { store: 'goods:attic', bld: 'bld.oldtown.rowhouse.timber', at: [74, 253] },
  { store: 'goods:warp', bld: 'bld.oldtown.rowhouse.stucco', at: [72, 246] },
  { store: 'goods:loam', bld: 'bld.oldtown.rowhouse.mansard', at: [33, 230] },
  { store: 'goods:voltaic', bld: 'bld.res.duplex', at: [274, 145] },
  { store: 'goods:spoke', bld: 'bld.res.bungalow', at: [283, 158] },
  { store: 'goods:kestrel', bld: 'bld.res.craftsman', at: [273, 281] },
  { store: 'goods:sleepy', bld: 'bld.res.splitlevel', at: [343, 220] },
  { store: 'goods:nord', bld: 'bld.res.cliffhouse', at: [96, 100] },
];
const SIGN = { 'goods:timber': ['#2f5a48', '#fff8e0'], 'goods:fjord': ['#3f6fb0', '#f2c230'], 'goods:bellwether': ['#39456f', '#f2d27a'], 'goods:lumen': ['#2c2738', '#ffe6a0'], 'goods:copper': ['#b9653a', '#fff3dc'],
  'goods:attic': ['#5a3f3a', '#e8c878'], 'goods:warp': ['#7a3a4a', '#f4e4c8'], 'goods:loam': ['#2f6a48', '#e8f4d8'], 'goods:voltaic': ['#1f2a44', '#58d8f8'], 'goods:spoke': ['#c8574d', '#fff8e0'],
  'goods:kestrel': ['#9c6a3e', '#f2e2b8'], 'goods:sleepy': ['#6a7ab8', '#f4f0ff'], 'goods:nord': ['#f1eee6', '#2c2738'] };
let built = null; const DOOR = {};

const near = (o, at) => Math.abs(o.x - at[0]) < 1.6 && Math.abs(o.y - at[1]) < 1.6;
/* the walkable spot in front of the building's door (asset `door` {side, at}, flip-aware) or of its facade midpoint (same rules as sim/public_places.js) */
function doorSpot(w, ob) {
  const ok = (x, y) => x > 1 && y > 1 && x < w.w - 1 && y < w.h - 1 && !w.isBlocked(x, y) && !w.isBlocked(x + .3, y) && !w.isBlocked(x - .3, y);
  const a = ob.a, B = ob.B, pv = v => (typeof v === 'function' ? v(ob.p || {}) : v), dr = pv(a.door);
  const px = (dr && dr.side === 'x') !== !!ob.flip, len = px ? B[4] - B[1] : B[3] - B[0], at = !dr || dr.at === undefined ? len / 2 : Math.min(len - .5, Math.max(.5, dr.at));
  for (const out of [.75, 1.25, 1.75, 2.25]) for (const off of [0, .5, -.5, 1, -1, 1.5, -1.5, 2, -2]) { const p = px ? { x: B[3] + out, y: B[1] + at + off, dir: 0 } : { x: B[0] + at + off, y: B[4] + out, dir: 1 }; if (ok(p.x, p.y)) return Object.assign(p, { face: px ? 'x' : 'y' }); }
  for (const out of [.75, 1.5]) for (const p of [{ x: B[3] + out, y: (B[1] + B[4]) / 2, dir: 0, face: 'x' }, { x: (B[0] + B[3]) / 2, y: B[4] + out, dir: 1, face: 'y' }]) if (ok(p.x, p.y)) return p;
  return null;
}
function newBuilding(w, b) {
  const a = (() => { try { return w.place(b.id, b.x, b.y, { p: b.p }); } catch (e) { console.warn('goods: big-box', e); return null; } })(); if (!a) return null;
  w.remove(a); const B = a.B, pad = 1;
  for (const o of w.objs.slice()) if (o !== a && /^prop\.nature\./.test(o.id) && o.B[3] > B[0] - pad && o.B[0] < B[3] + pad && o.B[4] > B[1] - pad && o.B[1] < B[4] + pad + 1.5) w.remove(o);
  const ob = w.place(b.id, b.x, b.y, { p: b.p }); w.version = (w.version || 0) + 1; return ob;
}
export function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w;
  for (const s of SITES) {
    const st = STORE_BY_ID[s.store]; if (!st) continue; let ob = null;
    if (s.build) ob = w.objs.find(o => o.id === s.build.id && o.x === s.build.x && o.y === s.build.y) || newBuilding(w, s.build);
    else ob = w.objs.find(o => o.id === s.bld && near(o, s.at));
    if (!ob || !ob.B) { console.warn('goods: no building for', s.store); continue; }
    if (s.repaint) { ob.p = Object.assign({}, ob.p, s.repaint); delete ob._key; }
    const id = 'door:' + s.store; let poi = w.pois.find(p => p.id === id);
    if (!poi) {
      let sp = doorSpot(w, ob); if (!sp) { console.warn('goods: no doorstep for', s.store); continue; }
      const district = w.districtAt(sp.x, sp.y) || st.district;
      poi = w.poi({ type: 'door', id, room: s.store, name: st.name, x: sp.x, y: sp.y, dir: sp.dir, district, goods: s.store, blurb: st.blurb });
      if (!s.build && !s.repaint) { const [bg, fg] = SIGN[s.store] || ['#2c2738', '#f6e8c0'], text = st.sign, sw = Math.max(1, Math.ceil((text.length * 4 + 8) / 8) / 2);
        try { const so = sp.face === 'x' ? w.place('furn.pshop.sign', ob.B[3] + .02, Math.max(ob.B[1], Math.min(ob.B[4] - sw, sp.y - sw / 2)), { p: { text, bg, fg, lit: true }, z: ob.B[2] + 2.25, flip: true, solid: false })
          : w.place('furn.pshop.sign', Math.max(ob.B[0], Math.min(ob.B[3] - sw, sp.x - sw / 2)), ob.B[4] - .06, { p: { text, bg, fg, lit: true }, z: ob.B[2] + 2.25, solid: false }); so.goodsSign = s.store; } catch (e) { console.warn('goods sign', e); } }
    }
    DOOR[s.store] = { poi, ob };
  }
}
function enter(sid) {
  const d = DOOR[sid]; if (!d) return false; const ok = G.goods ? G.goods.isOpen(sid) : true, st = STORE_BY_ID[sid];
  if (!ok && !(G.dev && G.dev.on && G.dev.on())) { toast(`${st.name} is closed. ${G.goods.hoursText(sid)}.`, 'info', 3600); return false; }
  if (!ROOMS.has(sid)) { toast('Closed for refitting.', 'info'); return false; }
  enterRoom(sid, d.poi.id); return true;
}
export function init() {
  setSiteLookup(id => { const d = DOOR[id]; return d ? { x: d.poi.x, y: d.poi.y, poi: d.poi.id } : null; });
  G.on('scene', s => {
    if (!s || s.id !== 'city' || !s.world) return; ensure(s.world); if (s._goods) return; s._goods = true;
    for (const sid in DOOR) { const p = DOOR[sid].poi; if (!s.interactables.some(it => it.poi === p)) s.interactables.push({ x: p.x, y: p.y, label: STORE_BY_ID[sid].name, h: 1.2, range: 1.3, poi: p, use: () => enter(sid) }); }
  });
  if (G.goods) G.goods.sites = () => Object.keys(DOOR).map(k => ({ store: k, x: DOOR[k].poi.x, y: DOOR[k].poi.y, poi: DOOR[k].poi.id, ob: DOOR[k].ob.id }));
}
export { STORES };
