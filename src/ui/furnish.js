// Home UI: furnish ("Decorate") mode, the Bay Realty & Trust listings window, and the info card on other homes' doors.
//
// G.furnish = { open(), close(), active }           decorate mode (only inside your own home; pauses the simulation)
//   - a "Decorate" chip sits in the HUD while you are at home
//   - tray (bottom): tap a stored item, then tap the floor / a back wall. Mouse: the ghost follows the pointer and a click places it.
//     Touch: the first tap moves the ghost, tap it again (or the Place button) to confirm. Green = fine, red = not allowed (reason shown).
//   - tap placed furniture to select it: Move / Rotate / Store / Sell. Fittings of the building cannot be moved.
//   - Done rebuilds the room so the new furniture is usable.
// G.housing.openListings() / showCard(homeId) / decorate() are attached here.
// Services: G.shop.onService('view_property' | 'rent_property' | 'buy_property') and fixtures tagged `realtor` open the listings.
import { G } from '../core/game.js';
import { ITEM_BY_ID } from '../data/items.js';
import { SIZE_CLASSES, HOME_BY_ID } from '../data/homes.js';
import { MORTGAGE } from '../data/economy.js';
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
function injectCss() { if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/furnish.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/furnish.css' })); }

/* ---------- world sync (live preview while decorating) ---------- */
function placeDef(d, alpha) {
  const W = G.world, O = M.O; let ob;
  try {
    if (d.wall === 'y') ob = W.place(d.id, O + d.at, O, { p: d.p || {}, z: d.mount !== undefined ? d.mount : (asset(d.id).mount || 0), solid: false });
    else if (d.wall === 'x') ob = W.place(d.id, O, O + d.at, { p: d.p || {}, z: d.mount !== undefined ? d.mount : (asset(d.id).mount || 0), flip: true, solid: false });
    else ob = W.place(d.id, O + d.x, O + d.y, { p: d.p || {}, flip: !!d.flip, z: d.z, solid: false });
  } catch (e) { return null; }
  if (ob && alpha) ob._a = alpha; return ob;
}
function sync() {
  const W = G.world; for (const ob of M.obs) W.remove(ob); M.obs = [];
  for (const d of H().roomDef(H().current().id).items) { if (!d.uid || (M.hand && M.hand.uid === d.uid)) continue; const ob = placeDef(d); if (ob) { ob._uid = d.uid; M.obs.push(ob); } }
  ghost();
}
function ghost() {
  if (M.gob) { G.world.remove(M.gob); M.gob = null; }
  const h = M.hand; if (!h || !h.pos) return; const v = H().visual(h.itemId);
  M.gob = placeDef(Object.assign({ id: v.id, p: v.p, z: v.z, mount: v.mount }, h.pos), .7);
  h.why = H().check(Object.assign({ itemId: h.itemId }, h.pos), h.uid);
}

/* ---------- pointer -> room position ---------- */
function roomPos(e) { const w = G.toWorld(e.clientX, e.clientY); return { x: w.x - M.O, y: w.y - M.O }; }
function posFor(itemId, rp, flip) {
  const v = H().visual(itemId), sh = H().shell();
  if (v.wall) { // behind a back wall the ground position maps onto the wall: along = x - y
    let wall, along; if (rp.y < 0 || rp.x < 0) { wall = rp.y < rp.x ? 'y' : 'x'; along = Math.abs(rp.x - rp.y); } else { wall = rp.y < rp.x ? 'y' : 'x'; along = wall === 'y' ? rp.x : rp.y; }
    const L = wall === 'y' ? sh.w : sh.d; return { wall, at: Math.max(0, Math.min(L - v.size[0], snap(along - v.size[0] / 2))) };
  }
  const s = flip ? [v.size[1], v.size[0]] : v.size;
  return { x: Math.max(0, Math.min(sh.w - s[0], snap(rp.x - s[0] / 2))), y: Math.max(0, Math.min(sh.d - s[1], snap(rp.y - s[1] / 2))), flip: !!flip };
}
const samePos = (a, b) => a && b && a.x === b.x && a.y === b.y && a.wall === b.wall && a.at === b.at && !!a.flip === !!b.flip;
function boxOf(d) { // [x0,y0,x1,y1,z0,z1] in room coords
  const v = d.itemId ? H().visual(d.itemId) : null, s = v.size;
  if (d.wall === 'y') return [d.at, 0, d.at + s[0], .1, v.mount !== undefined ? v.mount : (v.a.mount || 0), (v.a.mount || 0) + s[2]];
  if (d.wall === 'x') return [0, d.at, .1, d.at + s[0], v.a.mount || 0, (v.a.mount || 0) + s[2]];
  const f = d.flip ? [s[1], s[0]] : s; return [d.x, d.y, d.x + f[0], d.y + f[1], v.z || 0, (v.z || 0) + s[2]];
}
function pickAt(e) {
  const r = G.cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, O = M.O; let best = null, bd = 1e9;
  for (const it of H().items()) { const b = boxOf(it), s = G.toScreen(O + (b[0] + b[2]) / 2, O + (b[1] + b[3]) / 2, (b[4] + b[5]) / 2), flat = b[5] - b[4] < .1;
    const rad = (10 + 7 * Math.max(b[2] - b[0], b[3] - b[1], b[5] - b[4])) * G.cssScale, d = Math.hypot(px - s.x, py - s.y) + (flat ? rad * .5 : 0); if (d < rad * (flat ? 1.5 : 1) && d < bd) { bd = d; best = it; } }
  return best;
}

/* ---------- actions ---------- */
function setHand(h) { M.hand = h; M.sel = null; sync(); bar(); }
function confirm() {
  const h = M.hand; if (!h || !h.pos) return; if (h.why) { toast(h.why, 'bad', 1800); return; }
  if (h.uid) { if (!H().move(h.uid, h.pos, { quiet: true })) return; M.hand = null; M.sel = h.uid; }
  else { const id = H().place(h.itemId, h.pos, { quiet: true }); if (!id) { const sl = H().slots(); toast(sl.used >= sl.max ? 'This home is full: store something first.' : 'It does not fit there.', 'bad'); return; }
    M.hand = H().storage().includes(h.itemId) && ['plant', 'decor'].includes((ITEM_BY_ID[h.itemId] || {}).tag) ? { itemId: h.itemId, flip: h.flip } : null; if (!M.hand) M.sel = id; }
  if (G.audio && G.audio.sfx) try { G.audio.sfx('place'); } catch (e) { /* no sound */ }
  sync(); tray(); bar();
}
function onTap(e) {
  if (M.hand) { const p = posFor(M.hand.itemId, roomPos(e), M.hand.flip || (M.hand.pos && M.hand.pos.flip)); if (e.pointerType === 'mouse' || samePos(p, M.hand.pos)) { M.hand.pos = p; ghost(); confirm(); } else { M.hand.pos = p; ghost(); bar(); } return; }
  const it = pickAt(e); M.sel = it ? it.uid : null; bar();
}
function onMove(e) { if (!M) return; if (down && pan(e)) return; if (!M.hand || e.pointerType !== 'mouse') return; const p = posFor(M.hand.itemId, roomPos(e), M.hand.flip || (M.hand.pos && M.hand.pos.flip)); if (!samePos(p, M.hand.pos)) { M.hand.pos = p; ghost(); bar(true); } }
let down = null;
const onDown = e => { if (M) down = { x: e.clientX, y: e.clientY }; };
const onUp = e => { if (!M || !down) return; const d = Math.hypot(e.clientX - down.x, e.clientY - down.y), pan = down.pan; down = null; if (d < 12 && !pan) onTap(e); };
function pan(e) { // drag = move the camera
  if (!down || (!down.pan && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 12)) return false;
  const a = G.toWorld(down.x, down.y), b = G.toWorld(e.clientX, e.clientY), sh = H().shell(); down.pan = true; down.x = e.clientX; down.y = e.clientY;
  M.cam.x = Math.max(M.O, Math.min(M.O + sh.w, M.cam.x - (b.x - a.x))); M.cam.y = Math.max(M.O, Math.min(M.O + sh.d, M.cam.y - (b.y - a.y))); return true;
}
function rotateHand() { const h = M.hand; if (!h) return; const v = H().visual(h.itemId); if (v.wall) { if (h.pos) { h.pos = { wall: h.pos.wall === 'y' ? 'x' : 'y', at: h.pos.at }; const L = h.pos.wall === 'y' ? H().shell().w : H().shell().d; h.pos.at = Math.min(h.pos.at, L - v.size[0]); } } else { h.flip = !(h.flip || (h.pos && h.pos.flip)); if (h.pos) h.pos = Object.assign({}, h.pos, { flip: h.flip }); } ghost(); bar(); }

/* ---------- DOM ---------- */
/** item picture: real icon art when it exists, else the furniture sprite scaled into a 32px box */
function thumb(id) {
  if (hasIcon(id)) return iconEl(id, 2, 'homegood');
  try { const v = H().visual(id), sp = assetSprite(v.a, v.p, false), c = document.createElement('canvas'), k = Math.min(1, 32 / sp.c.width, 32 / sp.c.height); c.width = c.height = 32; c.className = 'pix ico'; c.style.cssText = 'width:32px;height:32px;image-rendering:pixelated;flex:none';
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; const w = Math.round(sp.c.width * k), h = Math.round(sp.c.height * k); g.drawImage(sp.c, 0, 0, sp.c.width, sp.c.height, (32 - w) >> 1, (32 - h) >> 1, w, h); return c; } catch (e) { return iconEl(id, 2, 'homegood'); }
}
function tray() {
  const t = M.tray; t.textContent = ''; const st = H().storage(), count = {}; for (const id of st) count[id] = (count[id] || 0) + 1;
  const ids = Object.keys(count); if (!ids.length) t.append(el('div.fz-empty', { text: 'Storage is empty. Nest & Wire delivers; boxes need unpacking first.' }));
  for (const id of ids) { const it = ITEM_BY_ID[id] || { name: id };
    t.append(el('button.fz-item' + (M.hand && !M.hand.uid && M.hand.itemId === id ? '.on' : ''), { onclick: () => setHand(M.hand && !M.hand.uid && M.hand.itemId === id ? null : { itemId: id, flip: false }), title: it.name }, thumb(id), el('span.fz-n', { text: it.name }), count[id] > 1 && el('span.fz-c', { text: 'x' + count[id] }))); }
  const sl = H().slots(); M.slots.textContent = `${sl.used}/${sl.max} pieces`;
}
function bar(light) {
  const a = M.act, h = M.hand; if (light && M._why === (h && h.why)) return; M._why = h && h.why; a.textContent = '';
  const B = (text, fn, cls, dis) => el('button' + (cls ? '.' + cls : ''), { text, onclick: fn, disabled: dis });
  if (h) {
    const v = H().visual(h.itemId), n = (ITEM_BY_ID[h.itemId] || {}).name || '';
    a.append(el('span.fz-hint' + (h.why ? '.bad' : ''), { text: !h.pos ? `${n}: tap ${v.wall ? 'a back wall' : 'the floor'}` : h.why || `${n}: tap again to place` }),
      B('Place', confirm, 'go', !h.pos || !!h.why), B('Rotate', rotateHand), B('Cancel', () => setHand(null)));
  } else if (M.sel) {
    const it = H().items().find(i => i.uid === M.sel); if (!it) { M.sel = null; return bar(); } const d = ITEM_BY_ID[it.itemId] || { name: it.itemId };
    a.append(el('span.fz-hint', { text: d.name + (it.inc ? ' (came with the home)' : '') }), B('Move', () => setHand({ itemId: it.itemId, uid: it.uid, flip: !!it.flip })),
      B('Rotate', () => { if (!H().rotate(it.uid, { quiet: true })) toast('No room to turn it here.', 'bad', 1600); sync(); }),
      B('Store', () => { H().store(it.uid, { quiet: true }); M.sel = null; sync(); tray(); bar(); }),
      !it.inc && B('Sell ' + fmt(H().sellPrice(it.itemId)), async () => { G.modal++; const ok = await choose('Sell ' + d.name + '?', [{ label: 'Sell for ' + fmt(H().sellPrice(it.itemId)), value: 1 }, { label: 'Keep it', value: 0 }]); G.modal--; if (ok) { H().sell(it.uid, { quiet: true }); M.sel = null; sync(); tray(); bar(); } }));
  } else a.append(el('span.fz-hint', { text: 'Pick something from the tray, or tap furniture to move it.' }));
}
function overlay(ctx) {
  if (!M) return; const O = M.O, k = 1 / G.cssScale, P = (x, y, z) => { const s = G.toScreen(O + x, O + y, z); return [s.x * k, s.y * k]; };
  const quad = (b, col) => { const z = b[4], pts = b[3] - b[1] <= .11 && b[5] - b[4] > .11 ? [P(b[0], b[1], b[4]), P(b[2], b[1], b[4]), P(b[2], b[1], b[5]), P(b[0], b[1], b[5])] : b[2] - b[0] <= .11 && b[5] - b[4] > .11 ? [P(b[0], b[1], b[4]), P(b[0], b[3], b[4]), P(b[0], b[3], b[5]), P(b[0], b[1], b[5])] : [P(b[0], b[1], z), P(b[2], b[1], z), P(b[2], b[3], z), P(b[0], b[3], z)];
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.globalAlpha = .28; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = .95; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1; };
  const h = M.hand; if (h && h.pos) { const b = boxOf(Object.assign({ itemId: h.itemId }, h.pos)); b[4] = h.pos.wall ? b[4] : 0; quad(b, h.why ? '#e03131' : '#37b24d'); }
  else if (M.sel) { const it = H().items().find(i => i.uid === M.sel); if (it) { const b = boxOf(it); if (!it.wall) b[4] = 0; quad(b, '#f2c230'); } }
}

function open() {
  if (M || !H() || !H().isHome() || G.busy || G.modal > 0) return false; injectCss();
  const sc = G.scene; G.modal++;
  M = { O: sc.toWorld(0, 0).x, obs: sc.fixtures.filter(f => f.item && f.item.uid).map(f => f.ob), hand: null, sel: null, gob: null };
  const sh = H().shell(); M.cam = { x: M.O + sh.w / 2 + .8, y: M.O + sh.d / 2 + .8, z: 0 }; M.prevCam = G.camTarget; G.camTarget = M.cam; for (let k = 0; k < 4 && G.zoom > 1; k++) { const a = G.toScreen(M.O + sh.w, M.O, 0), b = G.toScreen(M.O, M.O + sh.d, 0), c = G.toScreen(M.O, M.O, 0), d = G.toScreen(M.O + sh.w, M.O + sh.d, 0); if (a.x - b.x > innerWidth * 1.25 || d.y - c.y > (innerHeight - 190) * 1.25) G.setZoom(G.zoom - 1); else break; }
  M.slots = el('span.fz-slots'); M.tray = el('div.fz-tray'); M.act = el('div.fz-act');
  M.top = el('div', { id: 'fz-top' }, el('b', { text: 'Decorating' }), M.slots, el('button.go', { text: 'Done', onclick: close }));
  M.bot = el('div', { id: 'fz-bot' }, M.act, M.tray);
  root().append(M.top, M.bot); if (G.hud && G.hud.el) G.hud.el.classList.add('fz-hide');
  G.cv.addEventListener('pointerdown', onDown); G.cv.addEventListener('pointerup', onUp); G.cv.addEventListener('pointermove', onMove);
  M.ov = (ctx, cam, dt) => overlay(ctx); G.overlays.push(M.ov);
  M.key = e => { if (e.key === 'Escape') { e.stopPropagation(); if (M.hand) setHand(null); else close(); } else if (e.key === 'r' || e.key === 'R') { if (M.hand) rotateHand(); } }; addEventListener('keydown', M.key, true);
  tray(); bar(); return true;
}
function teardown() {
  const m = M; if (!m) return; M = null; G.camTarget = m.prevCam || null;
  m.top.remove(); m.bot.remove(); if (G.hud && G.hud.el) G.hud.el.classList.remove('fz-hide');
  G.cv.removeEventListener('pointerdown', onDown); G.cv.removeEventListener('pointerup', onUp); G.cv.removeEventListener('pointermove', onMove); removeEventListener('keydown', m.key, true);
  const i = G.overlays.indexOf(m.ov); if (i >= 0) G.overlays.splice(i, 1);
  G.modal--;
}
function close() { if (!M) return; if (M.gob) G.world.remove(M.gob); teardown(); return H().refresh(); }

/* ---------- listings ---------- */
const FCOL = { f_wood: '#c89a5e', f_darkwood: '#7a5238', f_tile: '#cfe0e6', f_check: '#e8e2d4', f_lino: '#d9cfa8', f_carpet: '#b8a0c8', f_concrete: '#a8a8b0', f_stone: '#c8b8a0', f_mat: '#5a6a8a', f_dance: '#8a5cc2' };
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
const sizeCache = {};
function M_size(d) { const k = d.id + JSON.stringify(d.p || {}); let sc = sizeCache[k]; if (!sc) { try { sc = assetSize(asset(d.id), d.p || {}); } catch (e) { sc = [1, 1, 1]; } sizeCache[k] = sc; } return d.flip ? [sc[1], sc[0], sc[2]] : sc; }

function homeBody(L, full) {
  const h = L.home, sc = SIZE_CLASSES[h.sizeClass], b = el('div.fz-home' + (L.available ? '' : '.locked'));
  const price = [L.rent && `${fmt(L.rent)} / week`, L.price && `${fmt(L.price)} to buy`].filter(Boolean).join('  ·  ');
  b.append(el('div.fz-hrow', null, plan(h.id), el('div.fz-hinfo', null, el('b', { text: h.name }), el('div.fz-sub', { text: `${sc.label} · ${h.rooms.length} rooms · ${sc.furnitureSlots} pieces · up to ${h.maxGuests} guests` }), el('div.fz-price', { text: price }),
    el('div.fz-sub', { text: `+ ${fmt(sc.utilitiesPerWeek)} utilities` + (h.upkeepPerWeekOwned ? ` · upkeep ${fmt(h.upkeepPerWeekOwned)}/wk when owned` : '') }))));
  b.append(el('p.fz-blurb', { text: h.blurb }));
  if (full) { b.append(el('ul.fz-pros', null, h.pros.map(t => el('li.pro', { text: t })), h.cons.map(t => el('li.con', { text: t })))); if (h.perk) b.append(el('p.fz-sub', { text: 'Perk: ' + h.perk.desc })); }
  return b;
}
async function buyFlow(L, done) {
  const h = L.home, eq = H().equity ? H().equity() : 0;
  const t = await choose('Buy ' + h.name, MORTGAGE.terms.map((m, i) => { const total = Math.round((L.price - L.down) * (1 + m.fee)); return { label: `${m.weeks} weeks at ${fmt(Math.ceil(total / m.weeks))} / week`, sub: m.fee ? `${Math.round(m.fee * 100)}% fee` : 'no fee', value: i }; }),
    { text: `Down payment ${fmt(L.down)} today` + (eq ? ` (your current home sells for ${fmt(eq)})` : '') + '. The rest is a weekly mortgage on your Monday bill. No repossession, ever.' });
  if (t === null || t === undefined) return; if (H().buy(h.id, t)) done();
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
      if (L.canRent) row.append(el('button', { text: `Rent · ${fmt(L.rent)}/wk`, onclick: async () => { const ok = await choose('Sign the lease?', [{ label: 'Sign', sub: `${fmt(L.rent + (cur ? 40 : 0))} today`, value: 1 }, { label: 'Not yet', value: 0 }], { text: `First week ${fmt(L.rent)}` + (cur ? ' + $40 moving van. Your furniture comes along in boxes; fittings stay.' : '.') }); if (ok && H().rent(L.id)) m.close(); } }));
      if (L.canBuy) row.append(el('button', { text: `Buy · ${fmt(L.down)} down`, onclick: () => buyFlow(L, () => m.close()) }));
      b.append(row); m.body.append(b);
    }
  };
  draw(); return m;
}
function showCard(homeId) {
  injectCss(); const L = H().homes().find(x => x.id === homeId); if (!L) return; const m = modal({ title: L.available ? (L.rent ? 'For rent' : 'For sale') : 'Not on the market yet', cls: 'fz-list' });
  m.body.append(homeBody(L, false), el('p.fz-sub', { text: 'Viewings and paperwork at Bay Realty & Trust, Downtown.' }), el('div.fz-btns', null, el('button', { text: 'OK', onclick: m.close })));
}

export function init() {
  injectCss();
  if (!G.housing) return;
  G.furnish = { open, close, get active() { return !!M; } };
  Object.assign(G.housing, { openListings, showCard, decorate: open });
  const upd = () => { const on = G.housing.isHome() && G.hud && G.hud.addIndicator; if (on && !chip) chip = G.hud.addIndicator({ id: 'decorate', icon: 'sofa_t1', text: 'Decorate', title: 'Arrange your furniture', onclick: () => open() }); else if (!on && chip) { chip.remove(); chip = null; } };
  G.on('scene', () => { teardown(); upd(); }); G.on('home:move', upd); G.on('game:start', upd); G.on('ready', upd);
  const reg = () => { if (G.shop && G.shop.onService) for (const s of ['view_property', 'rent_property', 'buy_property']) G.shop.onService(s, () => openListings()); };
  reg(); G.on('ready', reg);
  registerFixture('realtor', () => ({ label: 'Listings', use: () => openListings() }));
}
