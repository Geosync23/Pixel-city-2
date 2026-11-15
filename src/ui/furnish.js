// Home UI: HOME DESIGN MODE ("Decorate"), the Bay Realty & Trust listings window, and the info card on other homes' doors.
//
// G.furnish = { open({ tryId?, tab? }), close(), active, state() (for tests) }     design mode (only inside your own home; pauses the simulation)
//   - a "Decorate" chip sits in the HUD while you are at home; the Roomy phone app opens it too ("See it in my room").
//   - TOUCH FIRST: put a finger on a piece and DRAG it. The piece hops up above the fingertip so it is never hidden, snaps to half tiles, and its footprint
//     is green where it may stand and red where it may not (the reason shows in a label over it). Let go on red and it springs back.
//     Wall pieces slide along both back walls (left of the corner = the left wall). Small 'surface' pieces stand on the table / shelf / counter under them
//     (the label says which); move the table and what stands on it comes along. Rugs lie under furniture.
//   - TAP a piece to select it: Turn, Colour (other colourways of the same piece: free at the same price, else you pay the difference), Store, Sell.
//   - UNDO (top left) takes back any move, turn, store, sell, colour or placement, as many steps as you like while the mode is open.
//   - TRAY, two tabs. "My things": what is in storage, tap one and it is put down at the nearest free spot to the middle of the view (then drag it).
//     "Shop": the whole goods catalogue (one tile per piece, colours inside), category chips + a search box. Tap a tile and the piece appears IN YOUR ROOM
//     as a see-through TRY piece with a price tag: drag it, turn it, change its colour, "Add to cart" (the place is remembered: after delivery and unpacking
//     it lands right there) or "Take away". Nothing is paid here: ordering is done in the Roomy app (cart -> order -> shipping -> boxes -> unpack).
//   - TOP: Undo, your money, the home's Comfort (what the Comfort need settles at here: it moves as you decorate), furniture / decor counts, Done.
//   - Mouse + keys: drag works the same; R turns the selection, Ctrl+Z / U undo, Esc closes.
//   - Done rebuilds the room so the new furniture is usable.
// G.housing.openListings() / showCard(homeId) / decorate() are attached here.
// Services: G.shop.onService('view_property' | 'rent_property' | 'buy_property') and fixtures tagged `realtor` open the listings.
import { G } from '../core/game.js';
import { ITEM_BY_ID } from '../data/items.js';
import { SIZE_CLASSES, HOME_BY_ID } from '../data/homes.js';
import { MORTGAGE } from '../data/economy.js';
import { GOODS, GOOD_BY_ID, CATS, STORE_BY_ID, familyOf } from '../data/goods.js';
import { searchText, dayText } from '../data/shipping.js';
import { GT } from '../engine/world.js';
import { asset, assetSize } from '../art/registry.js';
import { registerFixture } from '../scenes/interior.js';
import { SHELLS } from '../scenes/rooms/homes.js';
import { el, toast, modal, choose, root } from './kit.js';
import { iconEl, hasIcon } from './_icons.js';
import { assetSprite } from '../engine/sprites.js';

export const order = 70;
let M = null, chip = null;
const H = () => G.housing, fmt = n => (G.money ? G.money.fmt(n) : '$' + n);
const snap = v => Math.round(v * 2) / 2;
const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const LIFT = 58;                                   /* px a dragged piece floats above the fingertip (touch) */
function injectCss() { if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/furnish.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/furnish.css' })); }
const nameOf = id => (ITEM_BY_ID[id] || { name: id }).name;
const short = id => nameOf(id).split(',')[0];
const swatchOf = g => { const p = g.p || {}; return p.c || p.wood || p.metal || p.c2 || p.pot || '#b8794a'; };
const colourName = g => g.colour || (g.name.includes(', ') ? g.name.split(', ').pop() : 'Standard');

/* ---------- the room as it stands (cached between changes) ---------- */
function defs() { return M.defs || (M.defs = H().roomDef(H().current().id).items); }
/** height a small 'surface' piece would stand at (0 = the floor) + the name of what it stands on */
function topAt(itemId, pos, ignore) {
  const g = GOOD_BY_ID[itemId]; if (!g || g.place !== 'surface' || !pos || pos.wall || !G.goods || !G.goods.surfaceZ) return { z: 0, on: null };
  const v = H().visual(itemId), list = defs().filter(d => d.uid !== ignore), probe = { id: v.id, p: v.p, good: itemId, x: pos.x, y: pos.y, flip: !!pos.flip };
  G.goods.surfaceZ(list.concat([probe])); if (!probe.z) return { z: 0, on: null };
  const cx = pos.x + v.size[0] / 2, cy = pos.y + v.size[1] / 2; let on = null;
  for (const d of list) { if (d.wall || d.x === undefined || d.box) continue; const s = sizeD(d); if (cx > d.x && cx < d.x + s[0] && cy > d.y && cy < d.y + s[1] && Math.abs((d.z || 0) + s[2] - probe.z) < .02) on = d; }
  return { z: probe.z, on: on && on.good ? short(on.good) : on ? 'the counter' : null };
}
const sizeCache = {};
function sizeD(d) { const k = d.id + JSON.stringify(d.p || {}); let sc = sizeCache[k]; if (!sc) { try { sc = assetSize(asset(d.id), d.p || {}); } catch (e) { sc = [1, 1, 1]; } sizeCache[k] = sc; } return d.flip ? [sc[1], sc[0], sc[2]] : sc; }
const M_size = sizeD;

/* ---------- world sync (live preview while decorating) ---------- */
function placeDef(d, alpha) {
  const W = G.world, O = M.O; let ob;
  try {
    if (d.wall === 'y') ob = W.place(d.id, O + d.at, O, { p: d.p || {}, z: d.mount !== undefined ? d.mount : (asset(d.id).mount || 0), solid: false });
    else if (d.wall === 'x') ob = W.place(d.id, O, O + d.at, { p: d.p || {}, z: d.mount !== undefined ? d.mount : (asset(d.id).mount || 0), flip: true, solid: false });
    else ob = W.place(d.id, O + d.x, O + d.y, { p: d.p || {}, flip: !!d.flip, z: d.z, solid: false });
  } catch (e) { return null; }
  if (ob && alpha) { ob._a = alpha; ob.noFade = true; } return ob;
}
const defFor = (itemId, pos, z) => { const v = H().visual(itemId); return Object.assign({ id: v.id, p: v.p, z: z !== undefined && z ? z : v.z, mount: v.mount }, pos); };
function sync() {
  const W = G.world; for (const ob of M.obs) W.remove(ob); M.obs = []; M.defs = null; M.zs = {};
  const dr = M.drag;
  for (const d of defs()) { if (!d.uid) continue; M.zs[d.uid] = d.z || 0; if (dr && dr.uid === d.uid) continue; const ob = placeDef(d); if (ob) { ob._uid = d.uid; M.obs.push(ob); } }
  for (const t of M.tries) { if (dr && dr.tid === t.tid) continue; t.z = topAt(t.itemId, t.pos).z; const ob = placeDef(defFor(t.itemId, t.pos, t.z), .78); if (ob) { ob._tid = t.tid; M.obs.push(ob); } }
  ghost(true); tags();
}
function ghost(force) {
  const d = M.drag; if (!d) { if (M.gob) { G.world.remove(M.gob); M.gob = null; } pill(); return; }
  if (!force && M.gob && samePos(M.gpos, d.pos)) return;
  if (M.gob) { G.world.remove(M.gob); M.gob = null; }
  const top = topAt(d.itemId, d.pos, d.uid); d.z = top.z; d.on = top.on;
  d.why = H().check(Object.assign({ itemId: d.itemId }, d.pos), d.uid);
  M.gob = placeDef(defFor(d.itemId, d.pos, d.z), .86); M.gpos = d.pos; pill();
}

/* ---------- pointer -> room position ---------- */
function roomPt(cx, cy) { const w = G.toWorld(cx, cy); return { x: w.x - M.O, y: w.y - M.O }; }
function posFor(itemId, rp, flip) {
  const v = H().visual(itemId), sh = H().shell();
  if (v.wall) { /* a point on the screen lies on the left wall when it is left of the room's back corner, else on the right wall; how far along = |x - y| */
    const d = rp.x - rp.y, wall = d >= 0 ? 'y' : 'x', L = wall === 'y' ? sh.w : sh.d; return { wall, at: Math.max(0, Math.min(L - v.size[0], snap(Math.abs(d) - v.size[0] / 2))) };
  }
  const s = flip ? [v.size[1], v.size[0]] : v.size;
  return { x: Math.max(0, Math.min(sh.w - s[0], snap(rp.x - s[0] / 2))), y: Math.max(0, Math.min(sh.d - s[1], snap(rp.y - s[1] / 2))), flip: !!flip };
}
const samePos = (a, b) => !!a && !!b && a.x === b.x && a.y === b.y && a.wall === b.wall && a.at === b.at && !!a.flip === !!b.flip;
const posOfIt = it => (it.wall ? { wall: it.wall, at: it.at } : { x: it.x, y: it.y, flip: !!it.flip });
function boxOf(itemId, pos, z) { /* [x0,y0,x1,y1,z0,z1] in room coords */
  const v = H().visual(itemId), s = v.size, m = v.mount !== undefined ? v.mount : (v.a.mount || 0);
  if (pos.wall === 'y') return [pos.at, 0, pos.at + s[0], .1, m, m + s[2]];
  if (pos.wall === 'x') return [0, pos.at, .1, pos.at + s[0], m, m + s[2]];
  const f = pos.flip ? [s[1], s[0]] : s, z0 = z || v.z || 0; return [pos.x, pos.y, pos.x + f[0], pos.y + f[1], z0, z0 + s[2]];
}
const centre = b => G.toScreen(M.O + (b[0] + b[2]) / 2, M.O + (b[1] + b[3]) / 2, (b[4] + b[5]) / 2);
/** everything you can grab: placed pieces and try pieces */
function pieces() { const out = []; for (const it of H().items()) { if (!inThisRoom(it)) continue; out.push({ uid: it.uid, itemId: it.itemId, pos: posOfIt(it), z: M.zs[it.uid] || 0, inc: it.inc }); } for (const t of M.tries) out.push({ tid: t.tid, itemId: t.itemId, pos: t.pos, z: t.z || 0, t }); return out; }
const inThisRoom = it => { const r = H().room(); return r === 'main' ? !it.r : it.r === r; };   /* any room of the home: main, bath, upstairs ... */
function pickAt(e) {
  const r = G.cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, touch = e.pointerType !== 'mouse'; let best = null, bd = 1e9;
  for (const p of pieces()) { const b = boxOf(p.itemId, p.pos, p.z), s = centre(b), flat = b[5] - b[4] < .1;
    const rad = (12 + 7 * Math.max(b[2] - b[0], b[3] - b[1], b[5] - b[4])) * G.cssScale * (touch ? 1.25 : 1), d = Math.hypot(px - s.x, py - s.y) + (flat ? rad * .5 : 0) - (p.z ? 6 : 0); if (d < rad * (flat ? 1.5 : 1) && d < bd) { bd = d; best = p; } }
  return best;
}
const pieceOf = ref => pieces().find(p => (ref.uid && p.uid === ref.uid) || (ref.tid && p.tid === ref.tid)) || null;

/* ---------- undo ---------- */
const cash = () => safe(() => G.state.player.money, 0);
function mark() { M.undo.push({ snap: H().snapshot(), money: cash(), tries: JSON.stringify(M.tries.map(t => ({ tid: t.tid, itemId: t.itemId, pos: t.pos, store: t.store, cart: !!t.line }))) }); if (M.undo.length > 60) M.undo.shift(); }
function undo() {
  const u = M && M.undo.pop(); if (!u) return; H().restore(u.snap, { quiet: true });
  const d = Math.round((u.money - cash()) * 100) / 100; if (d > 0) G.money.add(d, 'Undo'); else if (d < 0) G.money.pay(-d, 'Undo', { force: true, silent: true });
  const was = JSON.parse(u.tries); for (const t of M.tries.slice()) if (!was.some(w => w.tid === t.tid)) dropTry(t, true);
  for (const w of was) { let t = M.tries.find(q => q.tid === w.tid); if (!t) { t = { tid: w.tid, itemId: w.itemId, pos: w.pos, store: w.store }; M.tries.push(t); } t.itemId = w.itemId; t.pos = w.pos; t.store = w.store; if (w.cart && !t.line) cartTry(t, true); else if (!w.cart && t.line) uncartTry(t); else if (t.line) { t.line.pos = t.pos; t.line.id = t.itemId; t.line.store = t.store; } }
  M.sel = null; M.drag = null; sync(); tray(); bar(); top(); sfx('click');
}
const sfx = k => safe(() => G.audio.sfx(k));

/* ---------- try pieces (not owned: "see it in my room") ---------- */
function viewCentre() { const sh = H().shell(), r = G.cv.getBoundingClientRect(), bot = M.bot ? M.bot.getBoundingClientRect().top : r.bottom, t0 = M.top ? M.top.getBoundingClientRect().bottom : r.top, rp = roomPt(r.left + r.width / 2, (t0 + bot) / 2 + 20); return { x: Math.max(.5, Math.min(sh.w - .5, rp.x)), y: Math.max(.5, Math.min(sh.d - .5, rp.y)) }; }
function addTry(itemId, store) {
  const g = GOOD_BY_ID[itemId]; if (!g) return null; const c = viewCentre(), pos = H().freeSpot(itemId, c.x, c.y); if (!pos) { toast('No free spot for it right now. Move or store something first.', 'bad', 2600); return null; }
  mark(); const t = { tid: 't' + (++M.n), itemId, pos, store: store || (safe(() => G.orders.best(itemId), null) || {}).store || g.stores[0] }; M.tries.push(t); M.sel = { tid: t.tid }; sync(); bar(); top(); sfx('click'); return t;
}
function cartTry(t, quiet) { if (t.line || !G.orders) return; if (!G.orders.add(t.itemId, { store: t.store, pos: t.pos })) return; const c = G.orders.cart(); t.line = c[c.length - 1]; if (!quiet) { toast(`${short(t.itemId)} is in your cart. Order it in the Roomy app.`, 'good', 2600); sfx('click'); } }
function uncartTry(t) { if (!t.line || !G.orders) return; const ix = G.orders.cart().indexOf(t.line); if (ix >= 0) G.orders.remove(ix); t.line = null; }
function dropTry(t, keepCart) { if (!keepCart) uncartTry(t); else if (t.line) uncartTry(t); const i = M.tries.indexOf(t); if (i >= 0) M.tries.splice(i, 1); }

/* ---------- actions ---------- */
function select(ref) { M.sel = ref; M.colours = false; bar(); tags(); }
function addOwned(itemId) {
  const c = viewCentre(), sl = H().slots(), dec = H().isDecor(itemId), stay = !safe(() => G.state.home.storage.includes(itemId), true);
  if (!stay && (dec ? sl.decor >= sl.decorMax : sl.used >= sl.max)) { toast(dec ? 'That is a lot of decoration: store a piece first.' : 'This home is full of furniture: store a piece first.', 'bad', 2600); return; }
  const pos = H().freeSpot(itemId, c.x, c.y); if (!pos) { toast('No free spot for it right now. Move or store something first.', 'bad', 2600); return; }
  mark(); const uid = H().place(itemId, pos, { quiet: true }); if (!uid) { M.undo.pop(); toast('It does not fit there.', 'bad'); return; }
  M.sel = { uid }; sfx('place'); sync(); tray(); bar(); top(); flash(uid);
}
/** small things standing on a piece: they travel with it */
function riders(uid) {
  const it = H().items().find(i => i.uid === uid); if (!it || it.wall) return []; const v = H().visual(it.itemId); if (!v.solid) return []; const s = it.flip ? [v.size[1], v.size[0]] : v.size, out = [];
  for (const o of H().items()) { if (o === it || o.wall || !inThisRoom(o) || !(M.zs[o.uid] > 0)) continue; const g = GOOD_BY_ID[o.itemId]; if (!g || g.place !== 'surface') continue; const w = H().visual(o.itemId).size, cx = o.x + w[0] / 2, cy = o.y + w[1] / 2; if (cx > it.x && cx < it.x + s[0] && cy > it.y && cy < it.y + s[1]) out.push({ uid: o.uid, dx: o.x - it.x, dy: o.y - it.y }); }
  return out;
}
function moveOwned(uid, pos) {
  const rd = riders(uid); mark(); if (!H().move(uid, pos, { quiet: true })) { M.undo.pop(); return false; }
  const sh = H().shell(); for (const r of rd) H().move(r.uid, { x: Math.max(0, Math.min(sh.w - .5, pos.x + r.dx)), y: Math.max(0, Math.min(sh.d - .5, pos.y + r.dy)), flip: false }, { quiet: true });
  return true;
}
function turn() {
  const p = M.sel && pieceOf(M.sel); if (!p) return;
  if (p.uid) { mark(); if (!H().rotate(p.uid, { quiet: true })) { M.undo.pop(); toast('No room to turn it here.', 'bad', 1600); return; } }
  else { const v = H().visual(p.itemId); let np; if (v.wall) { const w = p.pos.wall === 'y' ? 'x' : 'y', L = w === 'y' ? H().shell().w : H().shell().d; np = { wall: w, at: Math.max(0, Math.min(p.pos.at, L - v.size[0])) }; } else np = { x: p.pos.x, y: p.pos.y, flip: !p.pos.flip };
    if (!v.wall) { const sh = H().shell(), s = np.flip ? [v.size[1], v.size[0]] : v.size; np.x = Math.max(0, Math.min(sh.w - s[0], np.x)); np.y = Math.max(0, Math.min(sh.d - s[1], np.y)); }
    const why = H().check(Object.assign({ itemId: p.itemId }, np)); if (why) { toast('No room to turn it here.', 'bad', 1600); return; } mark(); p.t.pos = np; if (p.t.line) p.t.line.pos = np; }
  sfx('click'); sync(); bar();
}
function storeSel() { const p = M.sel && pieceOf(M.sel); if (!p || !p.uid) return; mark(); H().store(p.uid, { quiet: true }); M.sel = null; sync(); tray(); bar(); top(); sfx('click'); }
function sellSel() { const p = M.sel && pieceOf(M.sel); if (!p || !p.uid || p.inc) return; mark(); const got = H().sell(p.uid, { quiet: true }); M.sel = null; sync(); tray(); bar(); top(); toast(`Sold: ${short(p.itemId)} for ${fmt(got)}. Undo brings it back.`, 'money', 2600); sfx('coin'); }
function recolour(newId) {
  const p = M.sel && pieceOf(M.sel); if (!p || p.itemId === newId) return; const g = GOOD_BY_ID[newId];
  if (p.uid) { mark(); const paid = H().recolour(p.uid, newId, { quiet: true }); if (paid === false) { M.undo.pop(); toast('Not enough money for that one.', 'bad', 2000); return; } if (paid) toast(`${colourName(g)}: ${fmt(paid)} for the dearer finish.`, 'money', 2400); }
  else { mark(); p.t.itemId = newId; const b = safe(() => G.orders.sellers(newId), []); if (!b.some(s => s.store === p.t.store)) p.t.store = (b[0] || {}).store || g.stores[0]; if (p.t.line) { p.t.line.id = newId; p.t.line.store = p.t.store; } }
  sfx('click'); sync(); bar(); top();
}
function flash(uid) { const ob = M.obs.find(o => o._uid === uid); if (!ob) return; M.pulse = { ob, t: 0 }; }

/* ---------- dragging ---------- */
let down = null;
function onDown(e) { if (!M || (down && down.id !== e.pointerId)) return; down = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, pick: pickAt(e), touch: e.pointerType !== 'mouse' }; safe(() => G.cv.setPointerCapture(e.pointerId)); }
function startDrag(e) {
  const p = down.pick, b = boxOf(p.itemId, p.pos, p.z), c = centre(b), r = G.cv.getBoundingClientRect(), v = H().visual(p.itemId);
  const base = v.wall ? c : G.toScreen(M.O + (b[0] + b[2]) / 2, M.O + (b[1] + b[3]) / 2, 0);   /* floor pieces are steered by the middle of their footprint */
  /* touch: the piece hops up so the fingertip does not cover it (small pieces further than big ones, which show around the finger anyway) */
  const rad = (12 + 7 * Math.max(b[2] - b[0], b[3] - b[1], b[5] - b[4])) * G.cssScale, lift = Math.max(10, Math.min(LIFT, 78 - rad));
  let ox = base.x + r.left - down.x0, oy = base.y + r.top - down.y0; if (down.touch) { ox = Math.max(-40, Math.min(40, ox)); oy = Math.min(oy, -lift); }
  M.drag = { uid: p.uid, tid: p.tid, itemId: p.itemId, orig: p.pos, pos: p.pos, flip: !!p.pos.flip, ox, oy, why: null }; M.sel = p.uid ? { uid: p.uid } : { tid: p.tid }; M.colours = false;
  sync(); bar(); sfx('click');
}
function onMove(e) {
  if (!M || !down || down.id !== e.pointerId) return; const far = Math.hypot(e.clientX - down.x0, e.clientY - down.y0) >= 10;
  if (M.drag) { const d = M.drag, np = posFor(d.itemId, roomPt(e.clientX + d.ox, e.clientY + d.oy), d.flip); if (!samePos(np, d.pos)) { d.pos = np; ghost(); } else pill(); return; }
  if (!far && !down.pan) return;
  if (down.pick && !down.pan) { startDrag(e); onMove(e); return; }
  const a = G.toWorld(down.x, down.y), b = G.toWorld(e.clientX, e.clientY), sh = H().shell(); down.pan = true; down.x = e.clientX; down.y = e.clientY;       /* empty floor: drag = move the camera */
  const s = M.shift || 0; M.cam.x = Math.max(M.O + s, Math.min(M.O + sh.w + s, M.cam.x - (b.x - a.x))); M.cam.y = Math.max(M.O + s, Math.min(M.O + sh.d + s, M.cam.y - (b.y - a.y)));
}
function onUp(e) {
  if (!M || !down || down.id !== e.pointerId) return; const dn = down; down = null; safe(() => G.cv.releasePointerCapture(e.pointerId));
  if (M.drag) { const d = M.drag; M.drag = null;
    if (e.type === 'pointercancel' || samePos(d.pos, d.orig)) { /* nothing changed */ }
    else if (d.why) { toast(d.why + '. It went back.', 'bad', 1800); sfx('error'); }
    else if (d.uid) { if (moveOwned(d.uid, d.pos)) sfx('place'); }
    else { const t = M.tries.find(q => q.tid === d.tid); if (t) { mark(); t.pos = d.pos; if (t.line) t.line.pos = d.pos; sfx('place'); } }
    sync(); bar(); top(); return; }
  if (dn.pan || e.type === 'pointercancel') return;
  const p = dn.pick; select(p ? (p.uid ? { uid: p.uid } : { tid: p.tid }) : null); if (p) sfx('click');
}

/* ---------- DOM ---------- */
/** item picture: real icon art when it exists, else the furniture sprite scaled into a 32px box */
function thumb(id) {
  if (hasIcon(id)) return iconEl(id, 2, 'homegood');
  try { const v = H().visual(id), sp = assetSprite(v.a, v.p, false), c = document.createElement('canvas'), k = Math.min(1, 32 / sp.c.width, 32 / sp.c.height); c.width = c.height = 32; c.className = 'pix ico'; c.style.cssText = 'width:32px;height:32px;image-rendering:pixelated;flex:none';
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; const w = Math.round(sp.c.width * k), h = Math.round(sp.c.height * k); g.drawImage(sp.c, 0, 0, sp.c.width, sp.c.height, (32 - w) >> 1, (32 - h) >> 1, w, h); return c; } catch (e) { return iconEl(id, 2, 'homegood'); }
}
const catOf = id => { const it = ITEM_BY_ID[id] || {}; return it.cat || ({ sofa: 'seating', bed: 'beds', plant: 'plants', rug: 'rugs', tv: 'electronics', computer: 'electronics', game: 'electronics', music: 'electronics', bookshelf: 'storage', decor: 'decor', fridge: 'kitchen', stove: 'kitchen', microwave: 'kitchen', shower: 'bath', bath: 'bath', exercise: 'fitness', instrument: 'music', easel: 'hobby' }[it.tag] || 'decor'); };
let FAMS = null;
/** the catalogue as one row per piece (its colourways inside), cheapest first inside each category */
function families() { if (FAMS) return FAMS; const by = new Map(); for (const g of GOODS) { let f = by.get(g.family); if (!f) by.set(g.family, f = { g, n: 0, text: '', price: g.price }); f.n++; f.text += ' ' + searchText(g); if (g.price < f.price) { f.price = g.price; f.g = g; } } return FAMS = [...by.values()].sort((a, b) => a.price - b.price); }
function trayList() {
  const q = M.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (M.tab === 'mine') { const st = H().storage(), count = {}; for (const id of st) count[id] = (count[id] || 0) + 1; return Object.keys(count).filter(id => (M.cat === 'all' || catOf(id) === M.cat) && q.every(w => nameOf(id).toLowerCase().includes(w))).map(id => ({ id, n: count[id] })); }
  return families().filter(f => (M.cat === 'all' || f.g.cat === M.cat) && q.every(w => f.text.includes(w))).map(f => ({ id: f.g.id, price: safe(() => G.orders.best(f.g.id).price, f.price), colours: f.n }));
}
const PAGE = 36;
function tray() {
  const t = M.tray; t.textContent = ''; t.scrollLeft = 0; const list = M.list = trayList(); M.shown = 0;
  for (const b of M.tabs.children) b.classList.toggle('on', b.dataset.tab === M.tab);
  M.tabs.children[0].lastChild.textContent = ` ${H().storage().length}`;
  chips();
  if (!list.length) t.append(el('div.fz-empty', { text: M.tab === 'mine' ? (M.q || M.cat !== 'all' ? 'Nothing like that in storage.' : 'Storage is empty. Tap Shop to try new pieces in your room.') : 'Nothing matches. Try another word.' }));
  more();
}
function more() {
  const t = M.tray, list = M.list || []; const end = Math.min(list.length, M.shown + PAGE);
  for (let i = M.shown; i < end; i++) { const r = list[i], it = ITEM_BY_ID[r.id] || { name: r.id };
    t.append(el('button.fz-item', { onclick: () => (M.tab === 'mine' ? addOwned(r.id) : addTry(r.id)), title: it.name }, thumb(r.id), el('span.fz-n', { text: r.colours ? short(r.id) : it.name }),
      r.price !== undefined ? el('span.fz-p', { text: fmt(r.price) }) : null, r.n > 1 ? el('span.fz-c', { text: 'x' + r.n }) : null, r.colours > 1 ? el('span.fz-c.col', { text: r.colours + ' col.' }) : null)); }
  M.shown = end;
}
function chips() {
  const c = M.chips; if (c._tab === M.tab && c._cat === M.cat && c._n === (M.tab === 'mine' ? H().storage().length : -1)) return; c._tab = M.tab; c._cat = M.cat; c._n = M.tab === 'mine' ? H().storage().length : -1;
  const keep = M.search; c.textContent = ''; c.append(keep);
  const cats = M.tab === 'mine' ? [...new Set(H().storage().map(catOf))] : Object.keys(CATS);
  const mk = (id, label) => el('button.fz-chip' + (M.cat === id ? '.on' : ''), { text: label, onclick: () => { M.cat = id; tray(); } });
  c.append(mk('all', 'All')); for (const k of cats) c.append(mk(k, (CATS[k] || k).split(' ')[0].replace(/[&,]/g, '')));
  keep.placeholder = M.tab === 'mine' ? 'Search' : `Search ${GOODS.length}`;
}
function comfortNow() { return { c: safe(() => G.needsExtra.homeComfort(), null), a: safe(() => H().ambience(), 0) }; }
function top() {
  const sl = H().slots(), k = comfortNow(), cart = safe(() => G.orders.cart().length, 0);
  M.money.textContent = fmt(safe(() => G.money.get(), 0));
  M.undoB.disabled = !M.undo.length;
  if (k.c !== null) { const d = k.c - M.c0; M.comfort.firstChild.textContent = `Comfort ${k.c}`; M.comfort.lastChild.textContent = d ? (d > 0 ? ' +' : ' ') + d : ''; M.comfort.lastChild.className = d > 0 ? 'up' : 'dn'; M.meter.style.width = Math.max(4, Math.min(100, k.c)) + '%'; if (M.cLast !== undefined && k.c !== M.cLast) { M.comfort.classList.remove('bump'); void M.comfort.offsetWidth; M.comfort.classList.add('bump'); } M.cLast = k.c; }
  else { M.comfort.firstChild.textContent = `Cosy ${k.a}`; M.comfort.lastChild.textContent = ''; }
  M.slots.textContent = `Furniture ${sl.used}/${sl.max} · Decor ${sl.decor}/${sl.decorMax}`;
  const priceT = t => safe(() => G.orders.sellers(t.itemId).find(q => q.store === t.store).price, (GOOD_BY_ID[t.itemId] || {}).price || 0), loose = M.tries.filter(t => !t.line);
  M.cart.style.display = cart || loose.length ? '' : 'none'; M.cart.textContent = loose.length ? `Trying ${fmt(loose.reduce((a, t) => a + priceT(t), 0))}` + (cart ? ` · cart ${cart}` : '') : `Cart ${cart} · ${fmt(safe(() => G.orders.quote().total, 0))}`;
}
function bar() {
  const a = M.act; a.textContent = '';
  const B = (text, fn, cls, dis) => el('button' + (cls ? '.' + cls : ''), { text, onclick: fn, disabled: dis });
  const p = M.sel && pieceOf(M.sel); if (M.sel && !p) M.sel = null;
  if (!p) { a.append(el('span.fz-hint', { text: M.tries.length || H().items().length ? 'Drag a piece to move it. Tap one to turn, recolour, store or sell it.' : 'Tap something in the tray to put it in the room.' })); return; }
  const g = GOOD_BY_ID[p.itemId], fam = g ? familyOf(p.itemId).filter(q => { const va = H().visual(q.id).size, vb = H().visual(p.itemId).size; return va[0] === vb[0] && va[1] === vb[1]; }) : [];
  if (p.uid) {
    a.append(el('span.fz-hint', { text: nameOf(p.itemId) + (p.inc ? ' (came with the home)' : '') }),
      el('div.fz-btns2', null, B('Turn', turn), fam.length > 1 && !p.inc ? B('Colour', () => { M.colours = !M.colours; bar(); }, M.colours ? 'on' : '') : null, B('Store', storeSel), !p.inc ? B('Sell ' + fmt(H().sellPrice(p.itemId)), sellSel) : null));
  } else {
    const t = p.t, s = safe(() => G.orders.sellers(p.itemId).find(q => q.store === t.store), null), price = s ? s.price : (g || {}).price;
    a.append(el('span.fz-hint', null, el('b', { text: nameOf(p.itemId) }), el('small', { text: ` ${fmt(price)}` + (s ? ` · ${s.short} · ${dayText(s.days).toLowerCase()}` : '') + (g && g.ambience ? ` · cosy +${g.ambience}` : '') })),
      el('div.fz-btns2', null, B('Turn', turn), fam.length > 1 ? B('Colour', () => { M.colours = !M.colours; bar(); }, M.colours ? 'on' : '') : null,
        t.line ? B('In cart: remove', () => { mark(); uncartTry(t); bar(); top(); tags(); }) : B('Add to cart', () => { mark(); cartTry(t); bar(); top(); tags(); }, 'go'), B('Remove', () => { mark(); dropTry(t); M.sel = null; sync(); bar(); top(); })));
  }
  if (M.colours && fam.length > 1) a.append(el('div.fz-sw', null, ...fam.map(q => { const extra = p.uid ? Math.max(0, q.price - g.price) : 0; return el('button' + (q.id === p.itemId ? '.on' : ''), { title: colourName(q), onclick: () => recolour(q.id) }, el('i', { style: 'background:' + swatchOf(q) }), el('span', { text: colourName(q) + (extra ? ` +${fmt(extra)}` : '') })); })));
}
/** the label over a dragged piece: why not / what it stands on */
function pill() {
  const d = M.drag, e = M.pill; if (!d) { e.style.display = 'none'; return; }
  const b = boxOf(d.itemId, d.pos, d.z), s = G.toScreen(M.O + (b[0] + b[2]) / 2, M.O + (b[1] + b[3]) / 2, b[5] + .25), text = d.why || (d.on ? 'On ' + (d.on.startsWith('the ') ? d.on : 'the ' + d.on) : samePos(d.pos, d.orig) ? '' : 'Fits here');
  e.style.display = text ? '' : 'none'; e.textContent = text; e.className = d.why ? 'bad' : ''; const hw = (e.offsetWidth || 120) / 2 + 4; e.style.left = Math.max(hw, Math.min(innerWidth - hw, s.x)) + 'px'; e.style.top = Math.max(96, s.y) + 'px';
}
/** price tags over the try pieces */
function tags() {
  const box = M.tags; box.textContent = ''; M.tagEls = [];
  for (const t of M.tries) { const s = safe(() => G.orders.sellers(t.itemId).find(q => q.store === t.store), null), e = el('span.fz-tag2' + (t.line ? '.cart' : '') + (M.sel && M.sel.tid === t.tid ? '.sel' : ''), { text: (t.line ? 'In cart ' : '') + fmt(s ? s.price : (GOOD_BY_ID[t.itemId] || {}).price) }); box.append(e); M.tagEls.push({ t, e }); }
  place_tags();
}
function place_tags() { for (const q of M.tagEls || []) { const d = M.drag && M.drag.tid === q.t.tid ? M.drag : null, pos = d ? d.pos : q.t.pos, b = boxOf(q.t.itemId, pos, d ? d.z : q.t.z), s = G.toScreen(M.O + (b[0] + b[2]) / 2, M.O + (b[1] + b[3]) / 2, b[5] + .12); q.e.style.left = s.x + 'px'; q.e.style.top = s.y + 'px'; } }
function overlay(ctx, cam, dt) {
  if (!M) return; const O = M.O, k = 1 / G.cssScale, P = (x, y, z) => { const s = G.toScreen(O + x, O + y, z); return [s.x * k, s.y * k]; };
  const quad = (b, col, fill = .28) => { const z = b[4], pts = b[3] - b[1] <= .11 && b[5] - b[4] > .11 ? [P(b[0], b[1], b[4]), P(b[2], b[1], b[4]), P(b[2], b[1], b[5]), P(b[0], b[1], b[5])] : b[2] - b[0] <= .11 && b[5] - b[4] > .11 ? [P(b[0], b[1], b[4]), P(b[0], b[3], b[4]), P(b[0], b[3], b[5]), P(b[0], b[1], b[5])] : [P(b[0], b[1], z), P(b[2], b[1], z), P(b[2], b[3], z), P(b[0], b[3], z)];
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.globalAlpha = fill; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = .95; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1; };
  const foot = (itemId, pos, z, col, fill) => { const b = boxOf(itemId, pos, z); if (!pos.wall) b[4] = z || 0; quad(b, col, fill); };
  for (const t of M.tries) if (!(M.drag && M.drag.tid === t.tid)) foot(t.itemId, t.pos, t.z, t.line ? '#3b82d6' : '#8a7fd6', .12);
  const d = M.drag;
  if (d) { foot(d.itemId, d.orig, 0, '#ffffff', .08); foot(d.itemId, d.pos, d.z, d.why ? '#e03131' : '#37b24d', .34); }
  else if (M.sel) { const p = pieceOf(M.sel); if (p) foot(p.itemId, p.pos, p.z, '#f2c230', .12 + .06 * Math.sin(performance.now() / 180)); }
  if (M.pulse) { const q = M.pulse; q.t += Math.min(.05, dt || .016); q.ob._a = q.t < .5 ? .55 + .45 * Math.abs(Math.sin(q.t * 12.5)) : undefined; if (q.t >= .5) M.pulse = null; }
  place_tags(); if (M.drag) pill();
}

function open(o = {}) {
  if (M || !H() || !H().isHome() || G.busy || G.modal > 0) return false; injectCss();
  const sc = G.scene; G.modal++;
  M = { O: sc.toWorld(0, 0).x, obs: sc.fixtures.filter(f => f.item && f.item.uid).map(f => f.ob), sel: null, drag: null, gob: null, tries: [], undo: [], n: 0, tab: o.tab || 'mine', cat: 'all', q: '', zs: {}, colours: false, c0: safe(() => G.needsExtra.homeComfort(), 0) };
  const sh = H().shell(); M.cam = { x: M.O + sh.w / 2 + .8, y: M.O + sh.d / 2 + .8, z: 0 }; M.prevCam = G.camTarget; G.camTarget = M.cam; for (let k = 0; k < 4 && G.zoom > 1; k++) { const a = G.toScreen(M.O + sh.w, M.O, 0), b = G.toScreen(M.O, M.O + sh.d, 0), c = G.toScreen(M.O, M.O, 0), d = G.toScreen(M.O + sh.w, M.O + sh.d, 0); if (a.x - b.x > innerWidth * 1.25 || d.y - c.y > (innerHeight - 300) * 1.25) G.setZoom(G.zoom - 1); else break; }
  M.slots = el('span.fz-slots'); M.tray = el('div.fz-tray', { onscroll: () => { const t = M.tray; if (t.scrollLeft + t.clientWidth > t.scrollWidth - 240 && M.shown < (M.list || []).length) more(); } }); M.act = el('div.fz-act');
  M.money = el('b.fz-money'); M.meter = el('i'); M.comfort = el('span.fz-comfort', { title: 'What your Comfort settles at in this home' }, el('span'), el('em'));
  M.undoB = el('button.fz-undo', { text: 'Undo', onclick: undo, 'aria-label': 'Undo' });
  M.cart = el('button.fz-cart', { title: 'Your cart (opens Roomy)', onclick: () => { if (M.tries.some(t => !t.line)) { close(); return; } const done = close(); Promise.resolve(done).then(() => setTimeout(() => safe(() => G.phone.open(G.orders.APP, { tab: 'cart' })), 200)); } });
  M.top = el('div', { id: 'fz-top' }, el('div.fz-row', null, M.undoB, M.money, el('span.fz-cwrap', null, M.comfort, el('span.fz-meter', null, M.meter)), el('button.go', { text: 'Done', onclick: () => close() })), el('div.fz-row.sub', null, M.slots, M.cart));
  M.search = el('input.fz-search', { type: 'search', placeholder: 'Search', 'aria-label': 'Search', oninput: e => { M.q = e.target.value; clearTimeout(M.qt); M.qt = setTimeout(() => { if (M) tray(); }, 140); } });
  M.chips = el('div.fz-chips', null, M.search);
  M.tabs = el('div.fz-tabs', null, el('button', { 'data-tab': 'mine', onclick: () => { M.tab = 'mine'; M.cat = 'all'; tray(); } }, 'My things', el('em')), el('button', { 'data-tab': 'shop', onclick: () => { M.tab = 'shop'; M.cat = 'all'; tray(); } }, 'Shop', el('em')),
    el('span.fz-zoom', null, el('button', { text: '-', 'aria-label': 'Zoom out', onclick: () => G.setZoom(G.zoom - 1) }), el('button', { text: '+', 'aria-label': 'Zoom in', onclick: () => G.setZoom(G.zoom + 1) })));
  M.bot = el('div', { id: 'fz-bot' }, M.act, M.tabs, M.chips, M.tray);
  M.pill = el('div', { id: 'fz-pill', style: 'display:none' }); M.tags = el('div', { id: 'fz-tags' });
  root().append(M.tags, M.pill, M.top, M.bot); if (G.hud && G.hud.el) G.hud.el.classList.add('fz-hide');
  const cv = G.cv; cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp); cv.addEventListener('pointermove', onMove);
  M.ov = (ctx, cam, dt) => overlay(ctx, cam, dt); G.overlays.push(M.ov);
  M.key = e => { if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) { if (e.key === 'Escape') e.target.blur(); e.stopPropagation(); return; } if (e.key === 'Escape') { e.stopPropagation(); if (M.sel) select(null); else close(); } else if (e.key === 'r' || e.key === 'R') turn(); else if (e.key === 'u' || e.key === 'U' || ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z'))) { e.preventDefault(); undo(); } }; addEventListener('keydown', M.key, true);
  /* pieces already in the cart with a planned place come back as try pieces */
  for (const l of safe(() => G.orders.cart(), [])) if (l.pos && !H().check(Object.assign({ itemId: l.id }, l.pos))) M.tries.push({ tid: 't' + (++M.n), itemId: l.id, pos: l.pos, store: l.store, line: l });
  sync(); tray(); bar(); top();
  { /* centre the room in the part of the screen that is not covered by the two panels */
    const r = G.cv.getBoundingClientRect(), t0 = M.top.getBoundingClientRect().bottom, b0 = M.bot.getBoundingClientRect().top, k = G.toScreen(1, 1, 0).y - G.toScreen(0, 0, 0).y;
    if (k > 0 && b0 > t0) { const dl = ((r.top + r.height / 2) - (t0 + b0) / 2) / k; M.cam.x += dl; M.cam.y += dl; M.shift = dl; } }
  if (o.tryId && GOOD_BY_ID[o.tryId]) { M.tab = 'shop'; tray(); addTry(o.tryId, o.store); M.undo = []; top(); }
  return true;
}
function teardown() {
  const m = M; if (!m) return; M = null; down = null; G.camTarget = m.prevCam || null;
  m.top.remove(); m.bot.remove(); m.pill.remove(); m.tags.remove(); if (G.hud && G.hud.el) G.hud.el.classList.remove('fz-hide');
  const cv = G.cv; cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onUp); cv.removeEventListener('pointermove', onMove); removeEventListener('keydown', m.key, true);
  const i = G.overlays.indexOf(m.ov); if (i >= 0) G.overlays.splice(i, 1);
  G.modal--;
}
function close() {
  if (!M) return null; if (M.gob) G.world.remove(M.gob);
  const loose = M.tries.filter(t => !t.line), carted = M.tries.filter(t => t.line).length; teardown(); const done = H().refresh();
  if (loose.length) Promise.resolve(done).then(async () => {
    const total = loose.reduce((a, t) => a + safe(() => G.orders.sellers(t.itemId).find(q => q.store === t.store).price, (GOOD_BY_ID[t.itemId] || {}).price || 0), 0);
    const v = await choose(loose.length === 1 ? `Keep the ${short(loose[0].itemId)} in mind?` : `Keep the ${loose.length} pieces you tried?`, [{ label: 'Add to my cart', sub: `${fmt(total)} · order in the Roomy app`, value: 1 }, { label: 'No, leave ' + (loose.length === 1 ? 'it' : 'them'), value: 0 }], { text: loose.length === 1 ? 'Its place in the room is remembered: after delivery it is unpacked right there.' : 'Their places in the room are remembered: after delivery they are unpacked right there.' });
    if (v) { for (const t of loose) safe(() => G.orders.add(t.itemId, { store: t.store, pos: t.pos })); toast(`${loose.length + carted} ${loose.length + carted === 1 ? 'piece' : 'pieces'} in your cart. Open Roomy on your phone to order.`, 'good', 4200); }
  });
  else if (carted) toast(`${carted} ${carted === 1 ? 'piece' : 'pieces'} in your cart. Open Roomy on your phone to order.`, 'good', 4200);
  return done;
}
/* ---------- listings ---------- */
const FCOL = { f_wood: '#c89a5e', f_darkwood: '#7a5238', f_tile: '#cfe0e6', f_check: '#e8e2d4', f_lino: '#d9cfa8', f_carpet: '#b8a0c8', f_concrete: '#a8a8b0', f_stone: '#c8b8a0', f_mat: '#5a6a8a', f_dance: '#8a5cc2', void: '#2a2733', grass: '#7cc068' };   // void = a cut-out of an L-shaped home, grass = a garden
const GTN = new Map(Object.keys(GT).map(k => [GT[k], k]));
/** tiny floor-plan thumbnail of a home (back walls at the top / left) */
function plan(id, s = 5) {
  const sh = SHELLS[id], c = document.createElement('canvas'), def = H().roomDef(id); c.width = sh.w * s + 6; c.height = sh.d * s + 6; c.className = 'pix fz-plan'; c.style.width = c.width * 2 + 'px'; c.style.height = c.height * 2 + 'px';
  const g = c.getContext('2d'), R = (x0, y0, x1, y1, col) => { g.fillStyle = col; g.fillRect(4 + Math.round(x0 * s), 4 + Math.round(y0 * s), Math.max(1, Math.round((x1 - x0) * s)), Math.max(1, Math.round((y1 - y0) * s))); };
  g.fillStyle = '#2a2733'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = (sh.wall && sh.wall.color) || '#e9dcc0'; g.fillRect(1, 1, c.width - 2, 3); g.fillRect(1, 1, 3, c.height - 2);
  R(0, 0, sh.w, sh.d, FCOL[GTN.get(sh.floor)] || '#c89a5e'); for (const f of sh.floors || []) R(f.x0, f.y0, f.x1, f.y1, FCOL[GTN.get(f.floor)] || '#ccc');
  for (const d of def.items) { if (d.wall) { if (d.id.includes('window')) { const w = (d.p && d.p.w) || 1.5; g.fillStyle = '#8fd0f0'; if (d.wall === 'y') g.fillRect(4 + d.at * s, 1, w * s, 3); else g.fillRect(1, 4 + d.at * s, 3, w * s); } continue; }
    const fx = M_size(d); if (fx[2] < .1) { R(d.x, d.y, d.x + fx[0], d.y + fx[1], '#00000022'); continue; } R(d.x, d.y, d.x + fx[0], d.y + fx[1], d.fixed ? '#5a4a3e' : '#b8683c'); }
  return c;
}

function homeBody(L, full) {
  const h = L.home, sc = SIZE_CLASSES[h.sizeClass], b = el('div.fz-home' + (L.available ? '' : '.locked'));
  const price = [L.rent && `${fmt(L.rent)} / week`, L.price && `${fmt(L.price)} to buy`].filter(Boolean).join('  ·  ');
  b.append(el('div.fz-hrow', null, plan(h.id), el('div.fz-hinfo', null, el('b', { text: h.name }), el('div.fz-sub', { text: `${sc.label} · ${h.rooms.length} rooms · ${sc.furnitureSlots} pieces · up to ${h.maxGuests} guests` }), el('div.fz-price', { text: price }),
    el('div.fz-sub', { text: `+ ${fmt(sc.utilitiesPerWeek)} utilities` + (h.upkeepPerWeekOwned ? ` · upkeep ${fmt(h.upkeepPerWeekOwned)}/wk when owned` : '') }))));
  if (L.pieces) b.append(el('div.fz-sub', { text: `Pre-furnished: + ${fmt(L.pkg)} once for ${L.pieces} pieces (yours to keep). Or furnish it yourself: no extra.` }));
  b.append(el('p.fz-blurb', { text: h.blurb }));
  if (full) { b.append(el('ul.fz-pros', null, h.pros.map(t => el('li.pro', { text: t })), h.cons.map(t => el('li.con', { text: t })))); if (h.perk) b.append(el('p.fz-sub', { text: 'Perk: ' + h.perk.desc })); }
  return b;
}
/** pre-furnished or furnish it yourself? -> true | false | null (cancelled). Homes without a designer's set skip the question. */
async function askFurnished(L) {
  if (!L.pieces) return false;
  const v = await choose('How do you want it?', [{ label: 'Pre-furnished', sub: `+ ${fmt(L.pkg)} once: ${L.pieces} pieces, yours to keep`, value: 1 }, { label: 'Furnish it yourself', sub: 'Empty rooms, fitted kitchen and bathroom, a starter kit', value: 0 }],
    { text: 'Furnished, the designer\'s pieces stand in the rooms when you arrive. Empty, you get a camp mattress if you have no bed and a welcome box of food, and the furniture shops and the Roomy app do the rest.' });
  return v === null || v === undefined ? null : !!v;
}
async function buyFlow(L, done) {
  const h = L.home, eq = H().equity ? H().equity() : 0, furn = await askFurnished(L); if (furn === null) return;
  const t = await choose('Buy ' + h.name, MORTGAGE.terms.map((m, i) => { const total = Math.round((L.price - L.down) * (1 + m.fee)); return { label: `${m.weeks} weeks at ${fmt(Math.ceil(total / m.weeks))} / week`, sub: m.fee ? `${Math.round(m.fee * 100)}% fee` : 'no fee', value: i }; }),
    { text: `Down payment ${fmt(L.down)} today` + (eq ? ` (your current home sells for ${fmt(eq)})` : '') + '. The rest is a weekly mortgage on your Monday bill. No repossession, ever.' });
  if (t === null || t === undefined) return; if (H().buy(h.id, t, { furnished: furn })) done();
}
function openListings() {
  injectCss(); const m = modal({ title: 'Bay Realty & Trust — Listings', cls: 'fz-list' });
  const draw = () => {
    m.body.textContent = ''; const cur = H().current(), mg = H().mortgage();
    m.body.append(el('p.fz-sub', { text: cur ? `You live at ${cur.home.name} (${cur.owned ? 'owned' : 'rented'}).` + (mg ? ` Mortgage left: ${fmt(mg.left)}.` : '') : 'You have no address yet.' }));
    if (mg) m.body.append(el('button', { text: 'Pay off the mortgage (' + fmt(mg.left) + ')', onclick: () => { if (H().payOff()) draw(); } }));
    for (const L of H().homes()) {
      const b = homeBody(L, true), row = el('div.fz-btns');
      if (L.current) row.append(el('span.fz-tag', { text: L.owned ? 'Your home' : 'You live here' }));
      if (!L.available) row.append(el('span.fz-tag', { text: `On the market in ${Math.max(1, L.unlockDay - G.now().day)} days` }));
      if (L.canRent) row.append(el('button', { text: `Rent · ${fmt(L.rent)}/wk`, onclick: async () => { const furn = await askFurnished(L); if (furn === null) return; const eq = cur && cur.owned && H().equity ? H().equity() : 0, ok = await choose('Sign the lease?', [{ label: 'Sign', sub: `${fmt(L.rent + (cur ? 40 : 0) + (furn ? L.pkg : 0))} today` + (eq ? `, ${fmt(eq)} back` : ''), value: 1 }, { label: 'Not yet', value: 0 }], { text: `First week ${fmt(L.rent)}` + (furn ? ` + ${fmt(L.pkg)} furniture package` : '') + (cur ? ' + $40 moving van. Your furniture comes along in boxes; fittings stay.' : '.') + (eq ? ` You own ${cur.home.name}: moving out sells it back to the bank, and you get ${fmt(eq)} (the mortgage is settled from the sale).` : '') });   /* QA7: the sale of a home you own was silent here (Nestly showed it) */ if (ok && H().rent(L.id, { furnished: furn })) m.close(); } }));
      if (L.canBuy) row.append(el('button', { text: `Buy · ${fmt(L.down)} down`, onclick: () => buyFlow(L, () => m.close()) }));
      b.append(row); m.body.append(b);
    }
  };
  draw(); return m;
}
function showCard(homeId) {
  injectCss(); const L = H().homes().find(x => x.id === homeId); if (!L) return; const m = modal({ title: L.available ? (L.rent ? 'For rent' : 'For sale') : 'Not on the market yet', cls: 'fz-list' });
  /* QA13 (lead decision): the nine new apartment lobbies are for residents only; say so plainly at the street door */
  const MB = G.mailboxes, AP = MB && MB.boxes && MB.boxes.APARTMENTS && MB.boxes.APARTMENTS[homeId];
  if (AP && AP.lobby && !AP.share && MB.route && MB.route() === 'lobby') m.body.append(el('p.fz-sub', { style: 'font-weight:700;margin:0 0 6px', text: `Residents only: the lobby of ${AP.lobby.name} is for the people who live here. ${AP.unit || 'The flat'} ${L.available ? (L.rent ? 'is to let' : 'is for sale') + ': here is its listing.' : 'is not on the market yet.'}` }));
  m.body.append(homeBody(L, false), el('p.fz-sub', { text: 'Step in and look round. The paperwork is in the Nestly app, or at Bay Realty & Trust, Downtown.' }), el('div.fz-btns', null,
    H().view ? el('button', { text: 'Look inside', onclick: () => { m.close(); H().view(homeId); } }) : null,
    G.phone && G.phone.open ? el('button', { text: 'Listing', onclick: () => { m.close(); G.phone.open('homes', { home: homeId }); } }) : null, el('button', { text: 'Not now', onclick: m.close })));
}

export function init() {
  injectCss();
  if (!G.housing) return;
  G.furnish = { open, close, get active() { return !!M; }, undo, state: () => (M ? { sel: M.sel, drag: M.drag && { pos: M.drag.pos, why: M.drag.why, on: M.drag.on }, tries: M.tries.map(t => ({ tid: t.tid, itemId: t.itemId, pos: t.pos, cart: !!t.line })), undo: M.undo.length, tab: M.tab, vc: viewCentre(), shown: M.shown, list: (M.list || []).length, pieces: pieces().map(p => { const b = boxOf(p.itemId, p.pos, p.z), s = centre(b), r = G.cv.getBoundingClientRect(); return { uid: p.uid, tid: p.tid, itemId: p.itemId, pos: p.pos, z: p.z, sx: s.x + r.left, sy: s.y + r.top }; }) } : null) };
  Object.assign(G.housing, { openListings, showCard, decorate: open });
  const upd = () => { const on = G.housing.isHome() && G.hud && G.hud.addIndicator; if (on && !chip) chip = G.hud.addIndicator({ id: 'decorate', icon: 'sofa_t1', text: 'Decorate', title: 'Arrange your furniture', onclick: () => open() }); else if (!on && chip) { chip.remove(); chip = null; } };
  G.on('scene', () => { teardown(); upd(); }); G.on('home:move', upd); G.on('game:start', upd); G.on('ready', upd);
  const reg = () => { if (G.shop && G.shop.onService) for (const s of ['view_property', 'rent_property', 'buy_property']) G.shop.onService(s, () => openListings()); };
  reg(); G.on('ready', reg);
  registerFixture('realtor', () => ({ label: 'Listings', use: () => openListings() }));
}
