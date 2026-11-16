// The clothing stores in the city (owner msgs 177-178, BIBLE "Direction update 39"). Runtime only, nothing saved, no world file touched.
//   1. TEN NEW STORES (data/clothing_stores.js STORES) move into EXISTING buildings that had no door of their own, or onto a free stretch of shopfront: a door poi
//      `door:cs_<key>` (room `cs_<key>`, scenes/rooms/clothing_stores.js), a lit sign board over the door, a venue record with its own hours (so the Map, addresses,
//      the navigator, "Take me there" and the Closet's "Only available in store" box all pick it up). Closed stores refuse entry with their hours.
//   2. PRESET OUTFITS in every clothing shop, old and new (data/clothing_outfits.js): the Outfits window, the look sheet (the look on YOUR character, buy the look in one
//      tap, pieces you own are not charged, or buy single pieces).
//   3. MANNEQUINS: every `furn.cs.manq` fixture (new stores) and every old `furn.clothing.mannequin` in a clothes shop (Thread & Co., Marigold & Main, Ink & Ivy Vintage,
//      the Galleria bays) is dressed in one of the shop's looks with the real character renderer; which look changes every Monday. Tap one -> the look sheet.
// G.clothingStores
//   stores() -> [{ id, name, district, x, y, poi, building, open }]     isOpen(id)   hoursText(id)   enter(id) -> bool
//   looks(shopId) -> looks offered this season      lookPrice(shopId, look) -> { sum (what you would pay), full, owned: n, left: [ids] }
//   outfits(shopId)  the Outfits window     lookSheet(shopId, lookId)     buyLook(shopId, lookId) -> bool     mannequinLook(shopId, i) -> look
// Events: 'cs:look'(shopId, lookId) sheet opened, 'cs:buylook'(shopId, lookId, ids, sum), 'cs:talk'(storeId).
import { G } from '../core/game.js';
import { modal, el, toast } from '../ui/kit.js';
import { ROOMS, enterRoom, registerFixture } from '../scenes/interior.js';
import { asset } from '../art/registry.js';
import { VENUE_BY_ID, isOpen as venueOpen } from '../data/venues.js';
import { registerInstance } from '../data/venues_extra.js';
import { STORES, STORE_BY_ID } from '../data/clothing_stores.js';
import { OUTFITS, LOOK_BY_ID, looksFor } from '../data/clothing_outfits.js';
import { PIECE_BY_ID, BRANDS, specWith } from '../data/clothes.js';
import { stage, thumb, specThumb, injectCss, put } from '../ui/phone_closet_kit.js';

export const order = 57.75;   // after goods_city (57.7), before homes_city / places (58): the doors must exist when the Map, addresses and navigator scan the city
for (const s of STORES) registerInstance('gen_boutique', s.id, s.name, s.district, { hours: s.hours, blurb: s.blurb, priceMult: s.level, where: 'clothing store (sim/clothing_stores.js)', cs: true });

const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n), CS = () => G.clothesShop, W = () => G.wardrobe;
const week = () => Math.floor((G.state.t || 0) / 10080), season = () => safe(() => G.now().season, 0);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], hh = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
let built = null; const DOOR = {};

/* ---------- the city side ---------- */
const near = (o, at) => Math.abs(o.B[0] - at[0]) < 1.6 && Math.abs(o.B[1] - at[1]) < 1.6;
function doorSpot(w, ob, site) {
  const ok = (x, y) => x > 1 && y > 1 && x < w.w - 1 && y < w.h - 1 && !w.isBlocked(x, y) && !w.isBlocked(x + .3, y) && !w.isBlocked(x - .3, y);
  const B = ob.B, px = site.face === 'x', len = px ? B[4] - B[1] : B[3] - B[0], pv = v => (typeof v === 'function' ? v(ob.p || {}) : v), dr = pv(ob.a.door);
  const at = site.off !== undefined ? site.off : dr && dr.at !== undefined ? Math.min(len - .5, Math.max(.5, dr.at)) : len / 2;
  for (const out of [.75, 1.25, 1.75, 2.25]) for (const off of [0, .5, -.5, 1, -1, 1.5, -1.5]) { const p = px ? { x: B[3] + out, y: B[1] + at + off, dir: 0 } : { x: B[0] + at + off, y: B[4] + out, dir: 1 }; if (ok(p.x, p.y)) return p; }
  return null;
}
export function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w;
  for (const st of STORES) {
    const s = st.site, ob = w.objs.find(o => o.id === s.bld && o.B && near(o, s.at)); if (!ob) { console.warn('clothing stores: no building for', st.id); continue; }
    if (s.rename && ob.p && ob.p.name !== s.rename) { ob.p = Object.assign({}, ob.p, { name: s.rename }); delete ob._key; }
    const id = 'door:' + st.id; let poi = w.pois.find(p => p.id === id);
    if (!poi) {
      const sp = doorSpot(w, ob, s); if (!sp) { console.warn('clothing stores: no doorstep for', st.id); continue; }
      poi = w.poi({ type: 'door', id, room: st.id, name: st.name, x: sp.x, y: sp.y, dir: sp.dir, district: w.districtAt(sp.x, sp.y) || st.district, cs: st.id, blurb: st.blurb });
      const text = st.sign, sw = Math.max(1, Math.ceil((text.length * 4 + 8) / 8) / 2), B = ob.B;
      try { const so = s.face === 'x' ? w.place('furn.pshop.sign', B[3] + .02, Math.max(B[1], Math.min(B[4] - sw, sp.y - sw / 2)), { p: { text, bg: st.tone[0], fg: st.tone[1], lit: true }, z: B[2] + 2.25, flip: true, solid: false })
        : w.place('furn.pshop.sign', Math.max(B[0], Math.min(B[3] - sw, sp.x - sw / 2)), B[4] - .06, { p: { text, bg: st.tone[0], fg: st.tone[1], lit: true }, z: B[2] + 2.25, solid: false }); so.csSign = st.id; } catch (e) { console.warn('clothing stores: sign', e); }
    }
    DOOR[st.id] = { poi, ob };
  }
}
const isOpen = id => { const v = VENUE_BY_ID[id]; if (!v) return true; const n = G.now(); return venueOpen(v, n.weekday, n.hf); };
function hoursText(id) {
  const h = (STORE_BY_ID[id] || {}).hours; if (!h) return ''; const out = []; let i = 0;
  while (i < 7) { let j = i; while (j < 6 && JSON.stringify(h[j + 1]) === JSON.stringify(h[i])) j++; out.push((i === j ? DAYS[i] : DAYS[i] + '-' + DAYS[j]) + ' ' + (h[i] ? hh(h[i][0]) + '-' + hh(h[i][1]) : 'closed')); i = j + 1; }
  return 'Open ' + out.join(', ');
}
function enter(id) {
  const d = DOOR[id], st = STORE_BY_ID[id]; if (!d || !st) return false;
  if (!isOpen(id) && !(G.dev && G.dev.on && G.dev.on())) { toast(`${st.name} is closed. ${hoursText(id)}.`, 'info', 3800); return false; }
  if (!ROOMS.has(id)) { toast('Closed for refitting.', 'info'); return false; }
  enterRoom(id, d.poi.id); return true;
}

/* ---------- looks ---------- */
const looks = shop => looksFor(shop, season());
function lookPrice(shop, look) {
  let full = 0, sum = 0, owned = 0; const left = [];
  for (const id of look.pieces) { const p = PIECE_BY_ID[id]; if (!p) continue; const pr = CS().priceAt(p, shop); full += pr; if (W().owns(id)) owned++; else { sum += pr; left.push(id); } }
  return { full, sum, owned, left };
}
/** the look on the player's own body: their face, hair and build, nothing of what they wear now */
function lookSpec(look) {
  const s = Object.assign({}, safe(() => W().currentSpec(), null) || safe(() => G.state.player.spec, {}));
  for (const k of ['outfit', '_v', 'outer', 'outerColor', 'outerPat', 'outerColor2', 'hat', 'hatColor', 'hatBand', 'neck', 'neckColor', 'scarf', 'bag', 'gloves', 'belt', 'socks', 'tights', 'watch', 'earring', 'onepiece', 'topPat', 'topColor2', 'botPat', 'bottomColor2', 'shoeColor2', 'shoeType', 'innerColor']) delete s[k];
  return specWith(s, look.pieces);
}
function buyLook(shop, lookId) {
  const look = LOOK_BY_ID[lookId]; if (!look) return false; const pr = lookPrice(shop, look); if (!pr.left.length) { toast('You own every piece of this look already.', 'info'); return false; }
  if (!CS().buyMany(pr.left, shop, look.name)) return false;
  G.emit('cs:buylook', shop, lookId, pr.left, pr.sum); return true;
}
const CSS = `.csl-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px dashed #2a273340;font-size:12px}.csl-row>span{flex:1;min-width:0}.csl-row small{display:block;opacity:.7}.csl-row button{flex:none;min-height:36px}
.csl-card{display:flex;align-items:center;gap:10px;width:100%;text-align:left;margin:0 0 6px;padding:6px 8px;background:#fffdf4;border:2px solid #2a2733;box-shadow:0 2px 0 #2a273340;font:inherit;color:#2a2733;cursor:pointer}.csl-card b{display:block;font-size:14px}.csl-card small{display:block;opacity:.75;font-size:11px;line-height:1.25}.csl-card .csl-pr{margin-left:auto;font-size:13px;white-space:nowrap;text-align:right}
.csl-top{display:flex;gap:10px;align-items:flex-start;margin-bottom:6px}.csl-top>div:last-child{min-width:0;font-size:12px;flex:1}.csl-sig{display:inline-block;font-size:10px;padding:0 4px;border:1px solid #2a2733;background:#ffe9a8;margin-left:4px}`;
let cssDone = false; const css = () => { injectCss(); if (cssDone) return; cssDone = true; document.head.append(el('style', { text: CSS })); };
const SLOT = { top: 'Top', outer: 'Outerwear', dress: 'One-piece', bottom: 'Bottom', shoes: 'Shoes', hat: 'Hat' }, KIND = { neck: 'Neckwear', glasses: 'Glasses', bag: 'Bag', belt: 'Belt', gloves: 'Gloves', socks: 'Socks', tights: 'Tights', watch: 'Watch', earring: 'Earrings' };
/** one look: the mirror, the pieces, buy the look / buy single pieces */
function lookSheet(shop, lookId, o = {}) {
  const look = LOOK_BY_ID[lookId]; if (!look || !CS()) return null; css();
  const m = modal({ title: look.name, cls: 'wardrobe' }), st = stage(lookSpec(look), 6), info = el('div'), list = el('div'), foot = el('div.cw-row');
  const draw = () => {
    const pr = lookPrice(shop, look); info.textContent = ''; list.textContent = ''; foot.textContent = '';
    put(info, el('b', { text: pr.left.length ? fmt(pr.sum) : 'All yours' }), look.sig ? el('span.csl-sig', { text: 'New' }) : null,
      el('div', { text: `${look.pieces.length} pieces · ${CS().shopName(shop)}` }), pr.owned && pr.left.length ? el('div', { text: `You own ${pr.owned}: ${fmt(pr.full)} in full, ${fmt(pr.sum)} for you.` }) : null,
      look.note ? el('div', { style: { marginTop: '4px', opacity: .8 }, text: look.note }) : null);
    for (const id of look.pieces) { const p = PIECE_BY_ID[id]; if (!p) continue; const own = W().owns(id), price = CS().priceAt(p, shop);
      put(list, el('div.csl-row', null, thumb(p, 2), el('span', null, el('div', { text: p.name }), el('small', { text: `${p.slot === 'acc' ? KIND[p.kind] : SLOT[p.slot]} · ${(BRANDS[p.brand] || { name: '' }).name}` })),
        el('button.ph-btn', { disabled: own, 'aria-label': own ? `${p.name}: owned` : `Buy ${p.name} for ${fmt(price)}`, onclick: () => { if (CS().buy(id, shop)) draw(); } }, el('span', { text: own ? 'Owned' : fmt(price) })))); }
    put(foot, el('button.opt', { disabled: !pr.left.length, onclick: () => { if (buyLook(shop, lookId)) { draw(); o.after && o.after(); } } }, el('span.opt-l', { text: pr.left.length ? `Buy the look · ${fmt(pr.sum)}` : 'You own the whole look' }), pr.left.length && pr.owned ? el('span.opt-s', { text: `${pr.left.length} of ${look.pieces.length} pieces` }) : null));
    if (!pr.left.length) put(foot, el('button.opt', { onclick: () => { safe(() => { for (const id of look.pieces) W().wearPiece(id); }); toast(`You change into ${look.name}.`, 'good'); m.close(); } }, el('span.opt-l', { text: 'Wear it now' })));
  };
  put(m.body, el('div.csl-top', null, st, info), el('p.cw-note', { text: 'The mirror shows the look on you. Tap it to turn round.' }), list, foot); draw();
  G.emit('cs:look', shop, lookId); return m;
}
/** the shop's Outfits window */
function outfits(shop) {
  if (!CS()) return null; css(); const ls = looks(shop), m = modal({ title: `${CS().shopName(shop)}: outfits`, cls: 'wardrobe' }), holder = el('div');
  const draw = () => { holder.textContent = '';
    if (!ls.length) put(holder, el('p.cw-note', { text: 'No ready-made looks here this season.' }));
    for (const l of ls) { const pr = lookPrice(shop, l);
      put(holder, el('button.csl-card', { 'aria-label': l.name, onclick: () => lookSheet(shop, l.id, { after: draw }) }, specThumb(lookSpec(l), 'full', 2),
        el('span', null, el('b', { text: l.name }), el('small', { text: l.pieces.map(id => (PIECE_BY_ID[id] || { name: '' }).name).join(' · ') })),
        el('span.csl-pr', null, el('b', { text: pr.left.length ? fmt(pr.sum) : 'Owned' }), l.sig ? el('small', { text: 'new pieces' }) : pr.owned && pr.left.length ? el('small', { text: `${pr.owned} owned` }) : null))); } };
  put(m.body, el('p.cw-note', { text: 'Ready-made looks from this shop\'s own rails. Buy the whole look in one go (what you already own is not charged) or pick single pieces.' }), holder); draw(); return m;
}

/* ---------- mannequins ---------- */
/** which look mannequin i of a shop wears this week (different looks side by side while there are enough) */
function mannequinLook(shop, i) { const ls = looks(shop); return ls.length ? ls[(week() + i) % ls.length] : null; }
function dress(scene) {
  if (!scene || !scene.fixtures || !CS()) return; const wk = week() + ':' + season(); if (scene._csWeek === wk) return; scene._csWeek = wk; const n = {};
  for (const fx of scene._csManq || []) { const shop = fx._csShop, i = n[shop] = (n[shop] || 0), look = mannequinLook(shop, i); n[shop]++; fx._csLook = look ? look.id : null;
    const ob = fx._csOb || fx.ob; ob.p = Object.assign({}, ob.p, { ids: look ? look.pieces.slice() : [] }); delete ob._key; if (fx._csIt) fx._csIt.label = look ? `Mannequin: ${look.name}` : 'Mannequin'; }
}
function onRoom(scene) {
  if (!scene || !scene.fixtures || !CS()) return; const list = [];
  for (const fx of scene.fixtures) {
    const a = fx.asset.id; if (a !== 'furn.cs.manq' && a !== 'furn.clothing.mannequin') continue; const shop = CS().roomShop(scene, fx); if (!shop || !(OUTFITS[shop] || []).length) continue;
    fx._csShop = shop;
    if (a === 'furn.clothing.mannequin') {   /* an old painted dummy: the same spot, now dressed by the character renderer */
      const ob = fx.ob; ob.hidden = true; const k = list.filter(f => f._csShop === shop).length;
      try { fx._csOb = scene.world.place(asset('furn.cs.manq'), ob.x - .05, ob.y - .05, { p: { ids: [], dir: ob.flip ? 0 : 1, tone: k % 2 }, z: ob.z ? ob.z + .0625 : 0 /* a step above the display platform it stands on, so the platform never sorts over it */, solid: false }); } catch (e) { ob.hidden = false; continue; }
      const it = { x: fx.x, y: fx.y, h: 1.5, hit: 12, fx, spot: fx.use || undefined, label: 'Mannequin', use: () => fx._csLook && lookSheet(shop, fx._csLook) }; scene.interactables.push(it); fx._csIt = it;
    } else fx._csIt = scene.interactables.find(it => it.fx === fx && it.csManq) || null;
    list.push(fx);
  }
  scene._csManq = list; scene._csWeek = null; dress(scene);
}

export function init() {
  G.clothingStores = { stores: () => STORES.map(s => { const d = DOOR[s.id]; return { id: s.id, name: s.name, district: s.district, x: d ? d.poi.x : null, y: d ? d.poi.y : null, poi: d ? d.poi.id : null, building: d ? d.ob.id : null, open: isOpen(s.id) }; }),
    isOpen, hoursText, enter, looks, lookPrice, outfits, lookSheet, buyLook, mannequinLook, ensure };
  registerFixture('csmanq', fx => ({ label: 'Mannequin', hit: 12, h: 1.5, csManq: true, use: () => fx._csLook && fx._csShop && lookSheet(fx._csShop, fx._csLook) }));
  registerFixture('csmirror', () => ({ label: 'Three-way mirror', hit: 12, use: () => { if (!safe(() => CS().fitting(), false)) toast('A mirror. You look like you.', 'info'); } }));
  G.on('room:build', onRoom); G.on('room:enter', dress);
  G.on('scene', s => {
    if (!s || s.id !== 'city' || !s.world) return; ensure(s.world); if (s._cs) return; s._cs = true;
    for (const id in DOOR) { const p = DOOR[id].poi; if (!s.interactables.some(it => it.poi === p)) s.interactables.push({ x: p.x, y: p.y, label: STORE_BY_ID[id].name, h: 1.2, hit: 16, range: 1.3, poi: p, use: () => enter(id) }); }
  });
}
