// Street food stands & market stalls: every stand/cart/stall/kiosk prop placed in the city sells things (opens its venue's shop),
// and "welcome glow" markers: a softly pulsing warm mat of light on the ground in front of every door you can enter and every stall you can buy from.
// (The glow is the game's visual language for "you can go in / interact here" — no arrows.)
import { G } from '../core/game.js';
import { WS } from '../engine/raster.js';
import { VENUE_BY_ID } from '../data/venues.js';
import { ROOMS } from '../scenes/interior.js';
export const order = 60;
// prop id (prefix) [+ '/' + p.kind] -> street venue id
const MAP = [
  ['prop.street.cart.hotdog', 'stand_hotdog'], ['prop.street.cart.coffee', 'stand_coffee'], ['prop.street.cart.icecream', 'stand_icecream'], ['prop.street.foodtruck', 'stand_taco'],
  ['prop.harbor.foodshack/icecream', 'stand_icecream'], ['prop.harbor.foodshack/chips', 'stand_hotdog'], ['prop.harbor.foodshack', 'market_stalls'],
  ['prop.street.stall', 'market_stalls'], ['bld.oldtown.lantern.stall', 'stand_taco'], ['bld.arts.kiosk', 'stand_coffee'], ['bld.harbor.fishmarket', 'market_stalls'], ['prop.park.cafe', 'stand_coffee'],
];
// friendlier hours than the original data: stands are there every day
const HOURS = { stand_hotdog: [10, 22], stand_coffee: [6, 18], stand_icecream: [10, 22], stand_taco: [11, 26], market_stalls: [8, 19] };
const spots = []; // glow markers: {x, y, z, on()}
let mat = null;
function matSprite() { if (mat) return mat; const c = document.createElement('canvas'); c.width = 41; c.height = 21; const x = c.getContext('2d'), id = x.createImageData(41, 21), d = id.data; for (let j = 0; j < 21; j++) for (let i = 0; i < 41; i++) { const q = Math.abs(i - 20) / 20 + Math.abs(j - 10) / 10; if (q > 1) continue; const edge = q > .8, dith = (i + j) & 1; if (!edge && q > .45 && dith) continue; const o = (j * 41 + i) * 4; d[o] = 255; d[o + 1] = edge ? 236 : 214; d[o + 2] = edge ? 170 : 122; d[o + 3] = edge ? 255 : 210; } x.putImageData(id, 0, 0); return mat = c; }
function frontOf(ob) { const a = ob.a, u = typeof a.use === 'function' ? a.use(ob.p) : a.use; if (u) return { x: ob.x + (ob.flip ? u.y : u.x), y: ob.y + (ob.flip ? u.x : u.y) }; return ob.flip ? { x: ob.B[3] + .6, y: (ob.B[1] + ob.B[4]) / 2 } : { x: (ob.B[0] + ob.B[3]) / 2, y: ob.B[4] + .6 }; }
export function init() {
  for (const k in HOURS) { const v = VENUE_BY_ID[k]; if (v) v.hours = [0, 1, 2, 3, 4, 5, 6].map(() => HOURS[k]); }
  G.on('scene', s => {
    if (s.id !== 'city' || s._stalls) return; s._stalls = true; const w = s.world; spots.length = 0;
    const taken = w.pois.filter(p => p.type === 'stall');
    for (const ob of w.objs) {
      const key = ob.id + (ob.p && ob.p.kind ? '/' + ob.p.kind : ''); const m = MAP.find(e => key === e[0] || key.startsWith(e[0] + '.') || (e[0].indexOf('/') < 0 && ob.id.startsWith(e[0]))); if (!m) continue; const v = VENUE_BY_ID[m[1]]; if (!v) continue;
      let f = frontOf(ob); if (w.isBlocked(f.x, f.y)) { const alt = [[(ob.B[0] + ob.B[3]) / 2, ob.B[4] + .7], [ob.B[3] + .7, (ob.B[1] + ob.B[4]) / 2], [(ob.B[0] + ob.B[3]) / 2, ob.B[1] - .7], [ob.B[0] - .7, (ob.B[1] + ob.B[4]) / 2]].find(q => !w.isBlocked(q[0], q[1])); if (!alt) continue; f = { x: alt[0], y: alt[1] }; }
      const z = w.heightAt(f.x, f.y);
      if (!taken.some(p => Math.hypot(p.x - f.x, p.y - f.y) < 2.5)) s.interactables.push({ x: (ob.B[0] + ob.B[3]) / 2, y: (ob.B[1] + ob.B[4]) / 2, h: 1.4, hit: 16, spot: f, label: v.name, use: () => G.shop && G.shop.open(v.id) });
      spots.push({ x: f.x, y: f.y, z });
    }
    for (const p of taken) spots.push({ x: p.x, y: p.y, z: w.heightAt(p.x, p.y) });
    for (const p of w.pois) if (p.type === 'door' || p.type === 'station' || p.glow) { const sp = { x: p.x, y: p.y, z: w.heightAt(p.x, p.y), poi: p, ok: true }; spots.push(sp); w.lights.push({ x: p.x, y: p.y, z: sp.z, r: 2, c: '#ffcf80' }); }
    refresh();
  });
  G.on('hour', refresh); G.on('home:move', refresh); G.on('scene', refresh);
  G.underlays.push((ctx, cam) => {
    if (!G.scene || G.scene.id !== 'city' || !spots.length) return; const m = matSprite(), t = G.time, W = G.W, H = G.H;
    for (let i = 0; i < spots.length; i++) { const sp = spots[i]; if (sp.ok === false) continue; const s = WS(sp.x, sp.y, sp.z), x = Math.round(s[0]) - cam.x - 20, y = Math.round(s[1]) - cam.y - 10; if (x > W || y > H || x < -41 || y < -21) continue; ctx.globalAlpha = .42 + .3 * Math.sin(t * 2.6 + sp.x * .7 + sp.y * .3); ctx.drawImage(m, x, y); }
    ctx.globalAlpha = 1;
  });
}
// which doors can be entered right now (room exists; homes: yours, or story homes you may visit)
function refresh() { for (const sp of spots) { const p = sp.poi; if (!p) continue; if (p.type === 'station' || p.glow) { sp.ok = true; continue; } let ok = ROOMS.has(p.room); if (ok && String(p.room).startsWith('home:') && G.housing) { const cur = G.housing.current && G.housing.current(); ok = !!(cur && cur.roomId === p.room) || (/sibling|grandma|friend/.test(p.room) && (!G.housing.canEnter || G.housing.canEnter(p.room))); } sp.ok = ok; } }
