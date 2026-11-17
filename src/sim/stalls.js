// Street food stands & market stalls: every stand/cart/stall/kiosk prop placed in the city sells things (opens its venue's shop),
// and "welcome glow" markers: a softly pulsing warm mat of light on the ground in front of every door you can enter and every stall you can buy from.
// (The glow is the game's visual language for "you can go in / interact here" — no arrows.)
import { G } from '../core/game.js';
import { WS } from '../engine/raster.js';
import { VENUE_BY_ID } from '../data/venues.js';
import { ROOMS } from '../scenes/interior.js';
import { Char, charArt } from '../core/char.js';
import { rng } from '../engine/raster.js';
import { objSprite } from '../engine/sprites.js';
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
function vendorTick() { const hr = (G.now && G.now().hf) || 12; for (const v of vendors) v.c.hidden = v.c._gone || !openAt(hr, v.h); }
// owner msg 242: directly BEHIND the counter. Gelato / coffee carts: a plain worker behind the cart (the cart covers the legs).
// Grill carts, food trucks, harbor shacks, market stalls: the worker stands inside / behind and only the part seen through the serving
// window (or above the counter) is drawn, sorted just in front of the prop. Local frame of the unflipped prop: +y is the customer side.
// v: where the worker stands, vz: floor height, f: the face the window is on (local y), a: window span along x, z: window bottom/top (null = open above)
// owner msg 243: no head drawn over an awning / parasol. Carts: a plain worker behind the cart, slid along it to the spot where the
// cart's own pixels (parasol, awning, pole) cover the least of the head; none at all where no spot shows it. The market stall's awning
// hangs lower than a head anywhere behind its counter, so stalls get no worker.
// owner msg 244: only the open carts (gelato / grill: a parasol, no awning) keep a worker; everything with an awning
// (coffee cart, food trucks, harbor shacks, market stalls) has none. (The window-clipped Vendor class below is kept, unused.)
const SPOT = [
  ['prop.street.cart.icecream', { slide: true, ly: -.38 }], ['prop.street.cart.hotdog', { slide: true, ly: -.38 }],
];
function pixels(c) { try { let x = c.getContext && c.getContext('2d'); if (!x) { const t = document.createElement('canvas'); t.width = c.width; t.height = c.height; x = t.getContext('2d'); x.drawImage(c, 0, 0); } return x.getImageData(0, 0, c.width, c.height).data; } catch (e) { return null; } }
class Slider extends Char {
  sprite() { if (this._gone) return null; if (!this._placed && !this._place()) return null; return super.sprite(); }
  _place() {
    const ob = this._ob, w = this._w, ps = objSprite(ob), s = super.sprite(); if (!ps || !s || !ps.c || !s.c) return false; const pp = pixels(ps.c), cp = pixels(s.c); if (!pp || !cp) { this._placed = true; return true; }
    const U = 16, pw = ps.c.width, cw = s.c.width, ch = s.c.height, px0 = ps.x + (ob.x - ob.y) * U, py0 = ps.y + (ob.x + ob.y) * U / 2 - ob.z * U;
    let top = -1; for (let j = 0; j < ch && top < 0; j++) for (let i = 0; i < cw; i++) if (cp[(j * cw + i) * 4 + 3] > 0) { top = j; break; } if (top < 0) { this._placed = true; return true; }
    const head = []; for (let j = top; j < Math.min(ch, top + 11); j++) for (let i = 0; i < cw; i++) if (cp[(j * cw + i) * 4 + 3] > 0) head.push(i, j);
    const sx = ob.a.size[0], L = []; for (let lx = .2; lx <= sx - .2 + 1e-6; lx += .2) L.push(lx); L.sort((p, q) => Math.abs(p - sx / 2) - Math.abs(q - sx / 2));
    let best = null, bc = 1e9;
    for (const lx of L) { const q = this._W(lx, this._ly); if (w.isBlocked(q[0], q[1])) continue; const z = w.heightAt(q[0], q[1]), ax = Math.round((q[0] - q[1]) * U), ay = Math.round((q[0] + q[1]) * U / 2 - z * U);
      let cov = 0; for (let k = 0; k < head.length; k += 2) { const X = Math.round(s.x + ax + head[k] - px0), Y = Math.round(s.y + ay + head[k + 1] - py0); if (X >= 0 && Y >= 0 && X < pw && Y < ps.c.height && pp[(Y * pw + X) * 4 + 3] > 0) cov++; }
      if (cov < bc) { bc = cov; best = [q[0], q[1], z]; } if (cov <= head.length * .12) break; }   // nearest the middle that shows the head
    this._placed = true; if (!best || bc > head.length * .2) { this._gone = true; this.hidden = true; return false; }
    this.x = best[0]; this.y = best[1]; this.z = best[2]; return true;
  }
}
class Vendor extends Char {
  sprite() {
    const s = super.sprite(); if (!s || !this._poly) return s; const U = 16, ax = Math.round((this.x - this.y) * U), ay = Math.round((this.x + this.y) * U / 2 - this.z * U), ox = s.x + ax, oy = s.y + ay;
    const c = this._cv || (this._cv = document.createElement('canvas')); if (c.width !== s.w || c.height !== s.h) { c.width = s.w; c.height = s.h; } const x = c.getContext('2d');
    x.clearRect(0, 0, s.w, s.h); x.save(); x.beginPath(); this._poly.forEach((q, i) => (i ? x.lineTo : x.moveTo).call(x, q[0] - ox, q[1] - oy)); x.closePath(); x.clip(); x.drawImage(s.c, 0, 0); x.restore();
    const o = this._so || (this._so = {}); o.c = c; o.x = s.x; o.y = s.y; o.w = s.w; o.h = s.h; return o;
  }
}
function addVendor(s, w, ob, f, vid, i) {
  const sp = SPOT.find(e => ob.id.startsWith(e[0])); if (!sp) return; const d = sp[1], fl = !!ob.flip;
  const W = (lx, ly) => fl ? [ob.x + ly, ob.y + lx] : [ob.x + lx, ob.y + ly]; const at = d.slide ? W(ob.a.size[0] / 2, d.ly) : W(d.v[0], d.v[1]);
  if (s.ents.some(e => e instanceof Char && e._coach && Math.hypot(e.x - at[0], e.y - at[1]) < 2.5)) return; // the market trader already stands here
  const A = charArt(), spec = Object.assign({}, A.randomSpec(rng(9100 + i * 17), { age: 'adult', season: 1 }), { bag: null, outfit: UNI[vid] || 'grocer' });
  const c = d.slide ? new Slider(spec, at[0], at[1]) : new Vendor(spec, at[0], at[1]); c.z = d.slide ? w.heightAt(at[0], at[1]) : ob.z + (d.vz || 0);
  if (d.slide) { c._ob = ob; c._w = w; c._W = W; c._ly = d.ly; }
  if (fl) c.face(1, 0); else c.face(0, 1); c._vendor = true; c.label = 'Vendor';
  if (!d.slide) {
    const U = 16, P = (lx, ly, z) => { const q = W(lx, ly); return [(q[0] - q[1]) * U, (q[0] + q[1]) * U / 2 - (ob.z + z) * U]; }, z1 = d.z[1] == null ? 40 : d.z[1];
    c._poly = [P(d.a[0], d.f, d.z[0]), P(d.a[1], d.f, d.z[0]), P(d.a[1], d.f, z1), P(d.a[0], d.f, z1)];
    const sy = ob.a.size[1], b0 = W(d.v[0] - .3, sy + .05), b1 = W(d.v[0] + .3, sy + .15); // sorted just in front of the prop's footprint
    c.bb = [Math.min(b0[0], b1[0]) - at[0], Math.min(b0[1], b1[1]) - at[1], Math.max(b0[0], b1[0]) - at[0], Math.max(b0[1], b1[1]) - at[1], 2];
  }
  s.ents.push(c); vendors.push({ c, h: HOURS[vid] || [8, 20] });
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
