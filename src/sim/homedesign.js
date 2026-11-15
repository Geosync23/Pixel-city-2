// Home design (Wave C), the part that happens in the room: delivery boxes you open, flat-packs you build, pieces that appear where you planned them, cardboard to recycle.
// Design mode itself is src/ui/furnish.js; ordering is src/sim/orders.js; the phone app is src/ui/phone_home.js; box art src/art/homedesign/boxes.js.
//
// A delivery box (fixture tag `hd_box`): tap -> "Unpack" (a few minutes) or, for a flat-pack, "Build it" (the Tighten-the-bolts game: 4 bolts, optional; or the slow way
//   with no game). When it is done the box bursts open, the cardboard flies, and every piece DROPS INTO THE ROOM: at the place you planned in design mode when it is
//   still free, on a table top for small things, else the nearest free spot to the box (storage only when the home is full). A flattened pile of cardboard is left
//   by the boxes (`hd_card`): each pile costs 1 ambience (3 at most) until you take it out ("Take out the cardboard", +cleanliness).
// G.homeDesign = { unpack(boxUid, { walk? }) -> Promise<result | null>, building(boxUid) -> bool (flat-pack that needs building), recycle(), shop(arg) (opens the Roomy app),
//   design(arg) (opens design mode), fx: { burst(x, y, z?), drop([{ uid }]) } }
// Events: 'homedesign:unpacked'(box, { placed, stored }), 'homedesign:built'(box, score 0..1), 'homedesign:recycled'(n)
import { G } from '../core/game.js';
import { ITEM_BY_ID } from '../data/items.js';
import { registerFixture } from '../scenes/interior.js';
import { toast, choose } from '../ui/kit.js';
import { play } from '../ui/minigame.js';

export const order = 63;
const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const H = () => G.housing;
const boxOf = uid => H().boxes().find(b => b.uid === uid) || null;
const needsBuild = b => !!b && b.sz === 'f' && !b.asm;
const short = n => String(n || '').split(',')[0];

/* ---------- effects (drawn in the low-res canvas, in world space, so they survive the room rebuild) ---------- */
const parts = [], drops = [], notes = []; let hooked = false;
const CARD = ['#c9a36a', '#b8925a', '#d2ad74', '#f1eee6', '#e9d9a8'], SPARK = ['#fff8e0', '#f2c230', '#ffe9a8'];
function hook() {
  if (hooked) return; hooked = true;
  G.overlays.push((ctx, cam, dt) => {
    if (!parts.length && !drops.length && !notes.length) return; dt = Math.min(.05, dt || .016); const k = 1 / G.cssScale;
    for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.t += dt / d.dur; const e = Math.min(1, d.t), q = 1 - Math.pow(1 - e, 3), ob = d.ob;
      if (!ob || !G.world || !G.world.objs.includes(ob)) { drops.splice(i, 1); continue; }
      ob.z = d.z + (1 - q) * 1.1 + (e > .8 ? Math.sin((e - .8) * 15.7) * .04 : 0); ob._a = Math.min(1, e * 2.2);
      if (e >= 1) { ob.z = d.z; ob._a = undefined; drops.splice(i, 1); sparkle((ob.B[0] + ob.B[3]) / 2, (ob.B[1] + ob.B[4]) / 2, d.z + Math.min(1.2, ob.size[2]) * .6, 10); safe(() => G.audio.sfx('clack')); } }
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.t -= dt; if (p.t <= 0) { parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= p.g * dt; if (p.z < 0) { p.z = 0; p.vz *= -.3; p.vx *= .5; p.vy *= .5; }
      const s = G.toScreen(p.x, p.y, p.z); ctx.globalAlpha = Math.min(1, p.t * 3); ctx.fillStyle = p.c; ctx.fillRect(Math.round(s.x * k), Math.round(s.y * k), p.s, p.s); }
    ctx.globalAlpha = 1;
    for (let i = notes.length - 1; i >= 0; i--) { const n = notes[i]; n.t += dt; if (n.t > 1.6) { n.el.remove(); notes.splice(i, 1); continue; } const s = G.toScreen(n.x, n.y, n.z + n.t * .5); n.el.style.left = s.x + 'px'; n.el.style.top = s.y + 'px'; n.el.style.opacity = String(Math.min(1, (1.6 - n.t) * 2)); }
  });
}
function burst(x, y, z = .3, n = 26) { hook(); for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = .6 + Math.random() * 1.6; parts.push({ x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 1.6 + Math.random() * 2.2, g: 7, t: .7 + Math.random() * .5, c: CARD[i % CARD.length], s: i % 3 ? 2 : 3 }); } }
function sparkle(x, y, z, n = 8) { hook(); for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = .3 + Math.random() * .9; parts.push({ x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: .6 + Math.random() * 1.2, g: 2.5, t: .5 + Math.random() * .4, c: SPARK[i % 3], s: 1 + (i % 2) }); } }
function note(x, y, z, text) { hook(); const ui = document.getElementById('ui'); if (!ui) return; const e = document.createElement('div'); e.className = 'hd-float'; e.textContent = text; e.style.cssText = 'position:absolute;transform:translate(-50%,-100%);pointer-events:none;z-index:25;font-weight:700;font-size:14px;color:#fff;text-shadow:0 2px 0 #2a2733,2px 0 0 #2a2733,-2px 0 0 #2a2733,0 -2px 0 #2a2733;white-space:nowrap'; ui.append(e); notes.push({ x, y, z, t: 0, el: e }); }
/** the pieces that were just put into the room fall into place one after the other */
function drop(placed) {
  hook(); const sc = G.scene; if (!sc || !sc.fixtures) return; let i = 0;
  for (const p of placed) { const fx = sc.fixtures.find(f => f.item && f.item.uid === p.uid); if (!fx || !fx.ob) continue; const ob = fx.ob; drops.push({ ob, z: ob.z || 0, t: -i * .28, dur: .5 }); ob._a = 0;
    const amb = ((ITEM_BY_ID[p.itemId] || {}).bonus || {}).ambience; if (amb) { const d = i; setTimeout(() => { if (G.scene === sc) note(fx.x, fx.y, (ob.z || 0) + Math.min(1.4, ob.size[2]) + .3, `+${amb} cosy`); }, 500 + d * 280); } i++; }
}

/* ---------- unpacking ---------- */
const comfort = () => safe(() => G.needsExtra.homeComfort(), null);
async function reveal(b, at) {
  const c0 = comfort(); if (at) burst(at.x, at.y, .35); safe(() => G.audio.sfx('whoosh'));
  const r = H().unpack(b.uid, { place: true, quiet: true }); if (!r) return null;
  await new Promise(res => setTimeout(res, 80)); await safe(() => H().refresh(), null);
  drop(r.placed);
  const names = r.placed.map(p => short((ITEM_BY_ID[p.itemId] || {}).name)), c1 = comfort();
  let msg = names.length ? `${names.join(', ')}: unpacked and in ${names.length > 1 ? 'their places' : 'its place'}.` : '';
  if (r.stored.length) msg += `${msg ? ' ' : ''}No free spot for ${r.stored.map(id => short((ITEM_BY_ID[id] || {}).name)).join(', ')}: ${r.stored.length > 1 ? 'they are' : 'it is'} in storage.`;
  if (c0 !== null && c1 !== null && c1 > c0) msg += ` Home comfort ${c0} -> ${c1}.`; else if (names.length) msg += ' Tap Decorate to move it.';
  toast(msg, 'good', 5200);
  G.emit('homedesign:unpacked', b, r); return r;
}
const spotOf = fx => (fx && fx.use ? { x: fx.use.x, y: fx.use.y, dir: fx.y < fx.use.y ? 1 : 3 } : undefined);
function act(label, minutes, fx, done) { return new Promise(res => { const o = { label, anim: 'work', minutes, done: () => { res(true); }, cancel: () => res(false) }; const at = spotOf(fx); if (at) o.at = { x: at.x, y: at.y, z: 0, dir: at.dir }; if (!G.startActivity(o) && !G.busy) res(false); }).then(ok => (ok ? done() : null)); }
/** open one delivery box. `fx` = its fixture when you tapped it in the room (the character does the work); without it the box is opened where it stands. */
async function unpack(boxUid, fx) {
  const b = boxOf(boxUid); if (!b || !H().isHome() || G.busy) return null;
  const at = fx ? { x: fx.x, y: fx.y } : safe(() => { const f = G.scene.fixtures.find(q => q.item && q.item.box === boxUid); return f ? { x: f.x, y: f.y } : null; }, null);
  const name = short(b.label);
  if (!needsBuild(b)) return act(`Unpacking: ${name}`, b.sz === 's' ? 4 : 8, fx, () => reveal(b, at));
  const how = await choose(`${name}: flat-pack`, [
    { label: 'Build it', sub: 'Tighten four bolts · about 15 min', value: 'game' },
    { label: 'Take it slowly', sub: 'No game · about 45 min', value: 'slow' },
    { label: 'Not now', value: null }], { text: 'A bag of bolts, one tiny hex key and a drawing of a very calm person.' });
  if (!how) return null;
  if (how === 'slow') return act(`Building: ${name}`, 45, fx, () => { safe(() => G.skills.addXp('handiness', 8)); return reveal(b, at); });
  if (G.player) G.player.pose = 'work';
  let res = null; try { res = await play({ kind: 'timing', title: 'Tighten the bolts', icon: 'skill.handiness', hint: 'Tap when the marker is in the green', level: safe(() => G.skills.level('handiness'), 1), o: { style: 'ring', rounds: 4 }, autoLabel: 'Just build it' }); } catch (e) { res = null; }
  if (G.player && G.player.pose === 'work') G.player.pose = null;
  if (!res || res.quit) return null;
  const q = res.auto ? .5 : res.score || 0;
  return act(`Building: ${name}`, Math.round(10 + (1 - q) * 14), fx, () => { safe(() => G.skills.addXp('handiness', 6 + q * 10)); safe(() => G.needs.add('fun', 2 + q * 3)); if (q >= .85) toast('Square, solid, and no bolts left over.', 'good', 2600); G.emit('homedesign:built', b, q); return reveal(b, at); });
}
function recycle(fx) {
  const n = H().cardboard(); if (!n || G.busy) return null;
  return act('Flattening the cardboard', 3, fx, () => { const k = H().recycle(); safe(() => G.supplies.addClean(3 * k)); toast('Cardboard out for recycling. The floor is yours again.', 'good', 3200); G.emit('homedesign:recycled', k); setTimeout(() => safe(() => H().refresh()), 60); return k; });
}

export function init() {
  if (!G.housing) return;
  G.homeDesign = {
    unpack: (uid, o) => unpack(uid, o && o.fx), building: uid => needsBuild(boxOf(uid)), recycle: () => recycle(safe(() => G.scene.fixtures.find(f => f.item && f.item.card), null)),
    shop: arg => safe(() => G.phone.open((G.orders && G.orders.APP) || 'roomy', arg)), design: arg => safe(() => G.furnish.open(arg)), fx: { burst, sparkle, drop, note },
  };
  registerFixture('hd_box', (fx, scene) => {
    const uid = fx.item && fx.item.box; if (!uid || !(scene.def && scene.def.home)) return null; const b = boxOf(uid); if (!b) return null;
    return { label: (needsBuild(b) ? 'Build: ' : 'Unpack: ') + short(b.label), range: 1.6, hit: 16, use: () => unpack(uid, fx) };
  });
  registerFixture('hd_card', (fx, scene) => { if (!(scene.def && scene.def.home) || !(fx.item && fx.item.card)) return null; return { label: 'Take out the cardboard', range: 1.6, hit: 14, use: () => recycle(fx) }; });
}
