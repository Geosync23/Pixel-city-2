// Street food stands & market stalls: every stand/cart/stall/kiosk prop placed in the city sells things (opens its venue's shop),
// and "welcome glow" markers: a softly pulsing warm mat of light on the ground in front of every door you can enter and every stall you can buy from.
// (The glow is the game's visual language for "you can go in / interact here" — no arrows.)
import { G } from '../core/game.js';
import { WS } from '../engine/raster.js';
import { VENUE_BY_ID } from '../data/venues.js';
import { ROOMS } from '../scenes/interior.js';
import { Char, charArt } from '../core/char.js';
import { rng } from '../engine/raster.js';
export const order = 60;
// prop id (prefix) [+ '/' + p.kind] -> street venue id
const MAP = [
  ['prop.street.cart.hotdog', 'stand_hotdog'], ['prop.street.cart.coffee', 'stand_coffee'], ['prop.street.cart.icecream', 'stand_icecream'], ['prop.street.foodtruck', 'stand_taco'],
  ['prop.harbor.foodshack/icecream', 'stand_icecream'], ['prop.harbor.foodshack/chips', 'stand_hotdog'], ['prop.harbor.foodshack', 'market_stalls'],
  ['prop.street.stall', 'market_stalls'], ['bld.oldtown.lantern.stall', 'stand_taco'], ['bld.arts.kiosk', 'stand_coffee'], ['bld.harbor.fishmarket', 'market_stalls'], ['prop.park.cafe', 'stand_coffee'],
];
// friendlier hours than the original data: stands are there every day
const HOURS = { stand_hotdog: [10, 22], stand_coffee: [6, 18], stand_icecream: [10, 22], stand_taco: [11, 26], market_stalls: [8, 19] };
// owner msg 241: a worker behind every cart / stand, there during the stand's hours (buildings like the fish market are left alone)
const UNI = { stand_coffee: 'barista', stand_hotdog: 'cook', stand_taco: 'cook', stand_icecream: 'barista', market_stalls: 'grocer' };
const vendors = []; // {c, h:[open, close]}
const openAt = (hr, h) => (hr >= h[0] && hr < h[1]) || (hr + 24 >= h[0] && hr + 24 < h[1]);
function vendorTick() { const hr = (G.now && G.now().hf) || 12; for (const v of vendors) v.c.hidden = !openAt(hr, v.h); }
function addVendor(s, w, ob, f, vid, i) {
  if (!ob.id.startsWith('prop.')) return; const cx = (ob.B[0] + ob.B[3]) / 2, cy = (ob.B[1] + ob.B[4]) / 2, hx = (ob.B[3] - ob.B[0]) / 2, hy = (ob.B[4] - ob.B[1]) / 2;
  let dx = cx - f.x, dy = cy - f.y; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
  // gelato / coffee carts: behind the counter. Grill carts (low umbrella), trucks, shacks and market stalls hide anyone behind them,
  // so there the worker stands at the near end of the counter, on the serving side, facing the queue.
  const ax = Math.abs(dx) > Math.abs(dy), behind = /cart\.(icecream|coffee)/.test(ob.id);
  const back = ax ? [cx + Math.sign(dx) * (hx + .45), cy] : [cx, cy + Math.sign(dy) * (hy + .45)];
  const fe = ax ? -Math.sign(dx) : -Math.sign(dy), end = ax ? [cx + fe * (hx - .5), cy + hy + .5] : [cx + hx + .5, cy + fe * (hy - .5)];
  const end2 = ax ? [cx + fe * (hx - .5), cy - hy - .5] : [cx - hx - .5, cy + fe * (hy - .5)];
  const at = (behind ? [back, end, end2] : [end, end2, back]).find(q => !w.isBlocked(q[0], q[1])); if (!at) return;
  if (s.ents.some(e => e instanceof Char && e._coach && Math.hypot(e.x - at[0], e.y - at[1]) < 2)) return; // the market trader already stands here
  const A = charArt(), spec = Object.assign({}, A.randomSpec(rng(9100 + i * 17), { age: 'adult', season: 1 }), { bag: null, outfit: UNI[vid] || 'grocer' });
  const c = new Char(spec, at[0], at[1]); c.z = w.heightAt(at[0], at[1]); if (ax) c.face(-dx, 0); else c.face(0, -dy); c._vendor = true; c.label = 'Vendor'; s.ents.push(c); vendors.push({ c, h: HOURS[vid] || [8, 20] });
}
const spots = []; // glow markers: {x, y, z, on()}
let mat = null;
function matSprite() { if (mat) return mat; const c = document.createElement('canvas'); c.width = 41; c.height = 21; const x = c.getContext('2d'), id = x.createImageData(41, 21), d = id.data; for (let j = 0; j < 21; j++) for (let i = 0; i < 41; i++) { const q = Math.abs(i - 20) / 20 + Math.abs(j - 10) / 10; if (q > 1) continue; const edge = q > .8, dith = (i + j) & 1; if (!edge && q > .45 && dith) continue; const o = (j * 41 + i) * 4; d[o] = 255; d[o + 1] = edge ? 236 : 214; d[o + 2] = edge ? 170 : 122; d[o + 3] = edge ? 255 : 210; } x.putImageData(id, 0, 0); return mat = c; }
function frontOf(ob) { const a = ob.a, u = typeof a.use === 'function' ? a.use(ob.p) : a.use; if (u) return { x: ob.x + (ob.flip ? u.y : u.x), y: ob.y + (ob.flip ? u.x : u.y) }; return ob.flip ? { x: ob.B[3] + .6, y: (ob.B[1] + ob.B[4]) / 2 } : { x: (ob.B[0] + ob.B[3]) / 2, y: ob.B[4] + .6 }; }
export function init() {
  for (const k in HOURS) { const v = VENUE_BY_ID[k]; if (v) v.hours = [0, 1, 2, 3, 4, 5, 6].map(() => HOURS[k]); }
  G.on('scene', s => {
    if (s.id !== 'city' || s._stalls) return; s._stalls = true; const w = s.world; spots.length = 0; vendors.length = 0; let vi = 0;
    const taken = w.pois.filter(p => p.type === 'stall');
    for (const ob of w.objs) {
      const key = ob.id + (ob.p && ob.p.kind ? '/' + ob.p.kind : ''); const m = MAP.find(e => key === e[0] || key.startsWith(e[0] + '.') || (e[0].indexOf('/') < 0 && ob.id.startsWith(e[0]))); if (!m) continue; const v = VENUE_BY_ID[m[1]]; if (!v) continue;
      let f = frontOf(ob); if (w.isBlocked(f.x, f.y)) { const alt = [[(ob.B[0] + ob.B[3]) / 2, ob.B[4] + .7], [ob.B[3] + .7, (ob.B[1] + ob.B[4]) / 2], [(ob.B[0] + ob.B[3]) / 2, ob.B[1] - .7], [ob.B[0] - .7, (ob.B[1] + ob.B[4]) / 2]].find(q => !w.isBlocked(q[0], q[1])); if (!alt) continue; f = { x: alt[0], y: alt[1] }; }
      const z = w.heightAt(f.x, f.y);
      if (!taken.some(p => Math.hypot(p.x - f.x, p.y - f.y) < 2.5)) s.interactables.push({ x: (ob.B[0] + ob.B[3]) / 2, y: (ob.B[1] + ob.B[4]) / 2, h: 1.4, hit: 16, spot: f, label: v.name, use: () => G.shop && G.shop.open(v.id) });
      spots.push({ x: f.x, y: f.y, z }); addVendor(s, w, ob, f, m[1], vi++);
    }
    for (const p of taken) spots.push({ x: p.x, y: p.y, z: w.heightAt(p.x, p.y) });
    for (const p of w.pois) if (p.type === 'door' || p.type === 'station' || p.glow) { const sp = { x: p.x, y: p.y, z: w.heightAt(p.x, p.y), poi: p, ok: true }; spots.push(sp); w.lights.push({ x: p.x, y: p.y, z: sp.z, r: 2, c: '#ffcf80' }); }
    refresh(); vendorTick();
  });
  G.on('hour', vendorTick); G.on('hour', refresh); G.on('home:move', refresh); G.on('scene', refresh);
  G.underlays.push((ctx, cam) => {
    if (!G.scene || G.scene.id !== 'city' || !spots.length) return; const m = matSprite(), t = G.time, W = G.W, H = G.H;
    for (let i = 0; i < spots.length; i++) { const sp = spots[i]; if (sp.ok === false) continue; const s = WS(sp.x, sp.y, sp.z), x = Math.round(s[0]) - cam.x - 20, y = Math.round(s[1]) - cam.y - 10; if (x > W || y > H || x < -41 || y < -21) continue; ctx.globalAlpha = .42 + .3 * Math.sin(t * 2.6 + sp.x * .7 + sp.y * .3); ctx.drawImage(m, x, y); }
    ctx.globalAlpha = 1;
  });
}
// which doors can be entered right now (room exists; homes: yours, or story homes you may visit)
function refresh() { for (const sp of spots) { const p = sp.poi; if (!p) continue; if (p.type === 'station' || p.glow) { sp.ok = true; continue; } let ok = ROOMS.has(p.room); if (ok && String(p.room).startsWith('home:') && G.housing) { const cur = G.housing.current && G.housing.current(); ok = !!(cur && cur.roomId === p.room) || (/sibling|grandma|friend/.test(p.room) && (!G.housing.canEnter || G.housing.canEnter(p.room))); }
    // places with real opening hours that turn you away at the door: office lobbies (07-20) and the conservatory (09-19) — no welcome glow while closed
    if (ok && p.lobby && G.lobbies && G.lobbies.isOpen) ok = G.lobbies.isOpen(p.room);
    else if (ok && p.room === 'conservatory' && G.conservatory && G.conservatory.isOpen) ok = !!G.conservatory.isOpen();
    sp.ok = ok; } }
