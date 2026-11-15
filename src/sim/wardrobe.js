// Wardrobe: everything you own to wear (ready-made outfit SETS from items.js + catalogue PIECES from data/clothes.js), what you have on, how fresh it is,
// job uniforms, the dresser window. Shops: sim/clothes_shop.js. Washing: sim/laundry.js. Hair: sim/hair.js. Phone app: ui/phone_closet.js.
//
// State G.state.wardrobe = {
//   v: 2,
//   owned: [outfit item ids]            ready-made sets (the 13 classic outfits, mall / hotel / arena / pool outfits). Unchanged from v1.
//   wearing: set id | 'look' | 'robe'   'look' = dressed from pieces (`on`); 'robe' = the last-resort bathrobe when nothing is clean
//   on: { top, bottom, dress, outer, shoes, hat, neck, glasses, bag, belt, gloves, socks, tights, watch, earring: piece id }   accessories also go over a set
//   pc: { id: [state, wears] }          every owned piece AND set: state 0 clean | 1 worn | 2 dirty | 3 in the hamper / laundry bag | 4 in a machine | 5 at the cleaner
//   base: spec from the character creator (your body, hair and travel clothes), temp: uniform art key | null,
//   looks: [{ n: name, on: {...} }]     outfits you saved          fav: [ids]   wish: [ids]
//   same: days running in the same body clothes, sig: signature of yesterday's clothes, li: line counter }
// MIGRATION (v1 -> v2, on load): owned / wearing / base / temp are kept as they are; every owned set gets a clean `pc` record; nothing is removed.
//
// G.wardrobe (old API unchanged)
//   owned() -> [set ids]   owns(id) (set or piece)   add(id, quiet?) (set or piece)   wear(setId)   wearing() -> set id, or for pieces an equivalent classic id
//   ('outfit_evening' dressed up, 'outfit_sport', 'outfit_pajamas' robe / sleepwear, 'outfit_raincoat', 'outfit_artist', else 'outfit_look') so older systems keep reacting
//   styles() -> ['casual', ...] (['uniform'] on shift)   perk()   wearTemp(key) / restore()   setLook(spec)   open({ preview? })   specFor(setId)
// New
//   pieces() -> [piece ids]   piece(id)   state(id) 0..5   wears(id)   on() -> { slot: id }   wearPiece(id) -> bool   takeOff(slot)   wearRobe()
//   looks() / saveLook(name) / wearLook(i) / deleteLook(i)   fav(id) toggle / isFav   wish(id) toggle / isWish / wishes()
//   suggest() -> { ids, set, robe, why }   wearSuggestion()   warmth() 0..12   sameDays()   wornIds()   byState(n) -> [ids]   setState(ids, state, fresh?)
//   washable(id) -> days until dirty | 0   delicate(id)   nameOf(id)   playerStates() -> ['same_outfit_days', 'dressed_up', 'sporty', 'pajamas', ...]
//   previewCanvas(spec, opts)   specWithPieces(ids)   mirror(ids, { title })   panel(kind, host, redraw)  ('today' | 'drawers' | 'outfits')   PIECES: true
// Events: 'wardrobe:change'(wearing), 'wardrobe:add'(id), 'wardrobe:day'({ same, dirty }), 'wardrobe:dirty'([ids]), 'laundry:hamper'(id)
// Tuning: DIRTY_AFTER (days of wear), MUSTY (hygiene per day in dirty clothes), SAME_DAYS (when strangers start to notice).
import { G } from '../core/game.js';
import { OUTFITS, ITEM_BY_ID } from '../data/items.js';
import { START } from '../data/economy.js';
import { MOODLETS } from '../data/needs.js';
import { charArt, Char } from '../core/char.js';
import { modal, el, toast, bubble } from '../ui/kit.js';
import { iconEl } from '../ui/_icons.js';
import { openCreator } from '../ui/creator.js';
import { specWith, PIECE_BY_ID, BRANDS } from '../data/clothes.js';
import { big, stage, grid, filterBar, applyFilter, thumb, specThumb, injectCss } from '../ui/phone_closet_kit.js';
import { LINES } from '../story/ambient_lines.js';

export const order = 61;
export const DIRTY_AFTER = { top: 3, bottom: 3, dress: 3, set: 3, socks: 2, tights: 2, outer: 7, hat: 8, neck: 8, gloves: 8 }, MUSTY = 6, SAME_DAYS = 3;
export const CLEAN = 0, WORN = 1, DIRTY = 2, HAMPER = 3, WASH = 4, CLEANER = 5;
export const STATE_NAME = ['Clean', 'Worn', 'Dirty', 'In the hamper', 'In the wash', 'At the cleaner'], STATE_TAG = ['', 'worn', 'dirty', 'hamper', 'washing', 'cleaner'];
const BODY = ['top', 'bottom', 'dress', 'outer', 'shoes'], SLOTS = BODY.concat(['hat', 'neck', 'glasses', 'bag', 'belt', 'gloves', 'socks', 'tights', 'watch', 'earring']);
const SLOT_LABEL = { top: 'Top', bottom: 'Bottom', dress: 'One-piece', outer: 'Outerwear', shoes: 'Shoes', hat: 'Hat', neck: 'Neck', glasses: 'Glasses', bag: 'Bag', belt: 'Belt', gloves: 'Gloves', socks: 'Socks', tights: 'Tights', watch: 'Watch', earring: 'Earrings' };
const ROBE = { top: 'robe', topColor: '#f6f2ea', bottom: 'sweats', bottomColor: '#f6f2ea', shoes: '#e8b0c0', shoeType: 'slipper', hat: null, scarf: null, accent: '#8fb8d8' };
MOODLETS.musty_clothes = MOODLETS.musty_clothes || { name: 'Musty Clothes', desc: 'These have been worn a few days too many. A change and a wash would help.', mood: -3, minutes: 240, source: 'clothes' };
MOODLETS.underdressed = MOODLETS.underdressed || { name: 'Underdressed', desc: 'Not enough layers for this weather. A coat, a hat, anything.', mood: -3, walkSpeed: 0.97, minutes: 60, source: 'weather' };
MOODLETS.overdressed = MOODLETS.overdressed || { name: 'Overdressed', desc: 'Far too many layers for this heat.', mood: -2, minutes: 60, source: 'weather' };
MOODLETS.fresh_clothes = MOODLETS.fresh_clothes || { name: 'Fresh Clothes', desc: 'Clean, warm from the dryer, smelling faintly of soap.', mood: 3, minutes: 180, source: 'clothes' };

/** items.js outfit key -> character spec overrides (null = your own clothes from the creator). Other modules merge their outfits in at import. */
export const LOOKS = {
  travel: null,
  tee_jeans: { top: 'tee', topColor: '#f4f0e8', bottom: 'jeans', bottomColor: '#4a6fa8', hat: null, scarf: null },
  summer: { top: 'polo', topColor: '#e8b83a', bottom: 'shorts', bottomColor: '#e8e2d4', shoes: '#c8a070', hat: null, scarf: null },
  knit: { top: 'sweater', topColor: '#b8563a', bottom: 'jeans', bottomColor: '#34507f', scarf: '#ead9b8' },
  smart_casual: { top: 'jacket', topColor: '#2f3f72', innerColor: '#f4f0e8', bottom: 'slacks', bottomColor: '#4a4a58', shoes: '#6a4428', hat: null, scarf: null },
  business: { top: 'suit', topColor: '#8a8f98', innerColor: '#f4f0e8', accent: '#b83a6a', bottom: 'slacks', bottomColor: '#8a8f98', shoes: '#2f2c3a', hat: null, scarf: null },
  evening: { top: 'suit', topColor: '#33303f', innerColor: '#f4f0e8', accent: '#e8b83a', bottom: 'slacks', bottomColor: '#33303f', shoes: '#2f2c3a', hat: null, scarf: null },
  party: { top: 'graphic', topColor: '#7a55c8', accent: '#e8b83a', bottom: 'slacks', bottomColor: '#33303f', shoes: '#2f2c3a', hat: null },
  sport: { outfit: 'gymwear', hat: null, scarf: null },
  pajamas: { outfit: 'pajamas', hat: null, scarf: null },
  raincoat: { top: 'coat', topColor: '#e8b83a', shoes: '#d04a3a', scarf: null },
  winter: { top: 'puffer', topColor: '#d9483b', hat: 'beanie', hatColor: '#d9483b', scarf: '#f4f0e8' },
  artist: { top: 'tee', topColor: '#f4f0e8', bottom: 'overalls', bottomColor: '#4a6fa8', hat: null },
};
// clothing fields a set / piece look replaces (so a patterned starter top does not leak its pattern into a bought outfit)
const WEAR_KEYS = ['topPat', 'topColor2', 'onepiece', 'outer', 'outerColor', 'outerPat', 'outerColor2', 'botPat', 'bottomColor2', 'shoeType', 'shoeColor2', 'hatBand', 'neck', 'neckColor', 'belt', 'gloves', 'socks', 'tights', 'watch', 'earring', 'earringColor', 'glassesColor'];
let S = null, ver = 1;
const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const P = id => PIECE_BY_ID[id] || null, isSet = id => !!(ITEM_BY_ID[id] && ITEM_BY_ID[id].category === 'outfit');
const slotOf = it => (it.slot === 'acc' ? it.kind : it.slot);
const rec = id => S.pc[id] || (S.pc[id] = [0, 0]), st = id => (S.pc[id] ? S.pc[id][0] : 0);
const today = () => Math.floor((G.state.t || 0) / 1440);
const hashStr = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const blank = () => ({ v: 2, owned: (START.ownedItems || []).filter(i => ITEM_BY_ID[i] && ITEM_BY_ID[i].category === 'outfit'), wearing: 'outfit_travel', base: null, temp: null, on: {}, pc: {}, looks: [], fav: [], wish: [], same: 1, sig: '', li: 0 });
function norm() {
  S = G.state.wardrobe; if (!S || typeof S !== 'object') S = G.state.wardrobe = blank();
  const b = blank(); for (const k in b) if (S[k] === undefined) S[k] = b[k];
  if (!S.owned.includes('outfit_travel')) S.owned.unshift('outfit_travel'); drain();
  for (const id of S.owned) rec(id);                                         // v1 -> v2: every set you own gets a (clean) record; nothing is dropped
  for (const k in S.on) if (!P(S.on[k]) || !S.pc[S.on[k]]) delete S.on[k];     // a piece id that left the catalogue
  if (S.wearing !== 'look' && S.wearing !== 'robe' && !S.owned.includes(S.wearing)) S.wearing = 'outfit_travel';
  S.v = 2; return S;
}
function drain() { const o = G.state.owned; if (o && Array.isArray(o.outfits)) for (const id of o.outfits.splice(0)) if (!S.owned.includes(id)) { S.owned.push(id); rec(id); } }
const strip = spec => { const s = Object.assign({}, spec); delete s._v; return s; };
function base() { if (!S.base) { S.base = strip(G.state.player.spec || G.player.spec || {}); delete S.base.outfit; } return S.base; }

/* ---------- what you are wearing -> the character spec ---------- */
const accIds = () => SLOTS.filter(s => !BODY.includes(s)).map(s => S.on[s]).filter(Boolean);
/** spec for a set id (old API), or for the current state when called without one */
function specFor(itemId, temp) {
  const b = base(), it = ITEM_BY_ID[itemId], look = it ? LOOKS[it.outfit] : null, s = Object.assign({}, b);
  if (look) { for (const k of WEAR_KEYS) delete s[k]; Object.assign(s, look); }
  if (temp) { const A = charArt(), key = (A.OUTFITS || []).includes(temp) ? temp : null; if (key) s.outfit = key; else { const t = OUTFITS.find(o => o.outfit === temp || o.id === temp) || ITEM_BY_ID['outfit_' + temp] || ITEM_BY_ID[temp]; const lk = (t && LOOKS[t.outfit]) || LOOKS[temp]; if (lk) { for (const k of WEAR_KEYS) delete s[k]; Object.assign(s, lk); } } }
  return s;
}
function currentSpec() {
  let s;
  if (S.wearing === 'robe') { s = Object.assign({}, base()); for (const k of WEAR_KEYS) delete s[k]; Object.assign(s, ROBE); }
  else if (S.wearing === 'look') s = specWith(base(), BODY.map(k => S.on[k]).filter(Boolean));
  else s = specFor(S.wearing);
  if (S.wearing !== 'robe') s = specWith(s, accIds());
  if (S.temp) { const t = specFor(S.wearing === 'look' || S.wearing === 'robe' ? 'outfit_travel' : S.wearing, S.temp); if (t.outfit) s.outfit = t.outfit; else s = t; }
  if (safe(() => G.hair.shaggy(), false)) s.shag = true;
  return s;
}
function apply() {
  const s = currentSpec(); s._v = (((G.state.player.spec && G.state.player.spec._v) || 0) + ver++) % 1e6;
  G.state.player.spec = s; if (G.player) { if (G.player.setSpec) G.player.setSpec(s); else G.player.spec = s; }
}
function changed() { apply(); G.emit('wardrobe:change', wearing()); }

/* ---------- owning ---------- */
const pieces = () => Object.keys(S.pc).filter(P);
function add(id, quiet) {
  const it = ITEM_BY_ID[id];
  if (it && it.category === 'outfit') { if (S.owned.includes(id)) return false; S.owned.push(id); rec(id); G.emit('wardrobe:add', id); if (quiet !== true && quiet !== undefined) toast(it.name + ' added to your wardrobe.', 'good'); return true; }
  const p = P(id); if (!p || S.pc[id]) return false;
  S.pc[id] = [0, 0]; const w = S.wish.indexOf(id); if (w >= 0) S.wish.splice(w, 1); G.emit('wardrobe:add', id); if (quiet === false) toast(p.name + ' is in your dresser.', 'good'); return true;
}
const owns = id => S.owned.includes(id) || (!!P(id) && !!S.pc[id]);
const nameOf = id => (P(id) || ITEM_BY_ID[id] || { name: id === 'robe' ? 'Bathrobe' : 'Your clothes' }).name;
/** days of wear before it is dirty (0 = never needs washing) */
const washable = id => (isSet(id) ? DIRTY_AFTER.set : P(id) ? DIRTY_AFTER[slotOf(P(id))] || 0 : 0);
const delicate = id => { const p = P(id); if (p) return p.styles[0] === 'formal' || (p.pat === 'sparkle') || (p.slot === 'outer' && p.warmth >= 3 && BRANDS[p.brand] && BRANDS[p.brand].tier >= 2); const it = ITEM_BY_ID[id]; return !!(it && it.styles && it.styles.includes('formal')); };

/* ---------- putting on / taking off ---------- */
function shed(id) { if (!id || (!isSet(id) && !P(id))) return; const r = rec(id); if (r[0] === DIRTY) { r[0] = HAMPER; G.emit('laundry:hamper', id); } }
function drop(sl) { const id = S.on[sl]; if (id) { delete S.on[sl]; shed(id); } }
function blocked(id, quiet) {
  if (S.temp) { if (!quiet) toast('You are in uniform until your shift ends.'); return true; }
  const s = st(id); if (s < DIRTY) return false;
  if (!quiet) toast(s === WASH ? `${nameOf(id)} is in the wash.` : s === CLEANER ? `${nameOf(id)} is at the cleaner.` : `${nameOf(id)} needs a wash first.`, 'bad'); return true;
}
function wearPiece(id, o = {}) {
  const it = P(id); if (!it || !S.pc[id] || blocked(id, o.quiet)) return false; base();
  const sl = slotOf(it);
  if (BODY.includes(sl) && S.wearing !== 'look') { shed(S.wearing); S.wearing = 'look'; }
  if (sl === 'dress') { drop('top'); drop('bottom'); } else if (sl === 'top' || sl === 'bottom') drop('dress');
  if (S.on[sl] !== id) drop(sl); S.on[sl] = id; if (!o.batch) changed(); return true;
}
function takeOff(sl) { if (S.temp || !S.on[sl]) return false; drop(sl); changed(); return true; }
function wear(itemId) {
  if (!S.owned.includes(itemId) || blocked(itemId)) return false; base();
  if (S.wearing !== itemId) shed(S.wearing); for (const k of BODY) drop(k);
  S.wearing = itemId; changed(); return true;
}
function wearRobe() { if (S.temp) return false; base(); shed(S.wearing); for (const k of SLOTS) drop(k); S.wearing = 'robe'; changed(); return true; }
/** every id that is on your body right now (the travel clothes count when pieces leave a gap) */
function wornIds() {
  const out = SLOTS.map(k => S.on[k]).filter(Boolean);
  if (S.wearing === 'look') { if ((!S.on.dress && (!S.on.top || !S.on.bottom)) || !S.on.shoes) out.push('outfit_travel'); } else if (S.wearing !== 'robe') out.push(S.wearing);
  return out;
}
function setLook(spec) { const keep = S.base || {}; S.base = strip(spec); delete S.base.outfit; if (S.base.name === undefined && keep.name !== undefined) S.base.name = keep.name; changed(); }

/* ---------- style, perks, warmth ---------- */
const bodyPieces = () => BODY.map(k => P(S.on[k])).filter(Boolean);
function lookStyles() {
  const cnt = {}, out = new Set();
  for (const it of bodyPieces()) { for (const s of it.styles) cnt[s] = (cnt[s] || 0) + 1; if (it.slot !== 'bottom' && it.slot !== 'shoes') out.add(it.styles[0]); }
  for (const s in cnt) if (cnt[s] >= 2) out.add(s);
  if (!out.size) out.add('casual');
  if (out.has('sporty')) out.add('sport'); const o = P(S.on.outer); if (o && o.styles.includes('rain')) out.add('rain'); if (warmth() >= 8 || (o && o.warmth >= 3)) out.add('winter');
  return [...out];
}
function styles() {
  if (S.temp) return ['uniform']; if (S.wearing === 'robe') return ['cozy']; if (S.wearing === 'look') return lookStyles();
  const it = ITEM_BY_ID[S.wearing]; return it && it.styles ? it.styles.slice() : ['casual'];
}
function warmth() {
  if (S.wearing === 'robe') return 3; let w = 0; const add = sl => { const p = P(S.on[sl]); if (p && p.warmth >= 3) w += 1; };
  if (S.wearing === 'look') { const t = P(S.on.dress) || P(S.on.top), b = P(S.on.bottom), o = P(S.on.outer); w = (t ? t.warmth : 2) + (S.on.dress ? (t.warmth > 1 ? 1 : 0) : b ? Math.min(2, b.warmth) : 2) + (o ? o.warmth * 1.5 : 0) + (P(S.on.shoes) && P(S.on.shoes).warmth >= 2 ? 1 : 0); }
  else { const stl = (ITEM_BY_ID[S.wearing] || {}).styles || []; w = stl.includes('winter') ? 9 : stl.includes('cozy') ? 6 : /summer|swim|sport/.test(S.wearing) ? 2 : 4; }
  add('hat'); add('neck'); add('gloves'); return Math.round(w);
}
const PERKS = { sport: { xpMult: { fitness: 1.1 } }, smart: { xpMult: { charisma: 1.05 } }, formal: { xpMult: { charisma: 1.05, logic: 1.05 }, relationshipGainMult: 1.05 }, party: { funMult: 1.1 }, cozy: { sleepMult: 1.05 }, rain: { blocksMoodlets: ['soaked'] }, winter: { blocksMoodlets: ['chilly'] }, artsy: { xpMult: { creativity: 1.1 } }, work: { xpMult: { handiness: 1.05 } } };
function perk() {
  if (S.temp) return {}; if (S.wearing !== 'look') return (ITEM_BY_ID[S.wearing] || {}).perk || (S.wearing === 'robe' ? PERKS.cozy : {});
  const out = { xpMult: {}, blocksMoodlets: [] };
  for (const s of lookStyles()) { const p = PERKS[s]; if (!p) continue; Object.assign(out.xpMult, p.xpMult || {}); out.blocksMoodlets.push(...(p.blocksMoodlets || [])); for (const k of ['funMult', 'sleepMult', 'relationshipGainMult']) if (p[k]) out[k] = p[k]; }
  return out;
}
/** the classic outfit id the current clothes are equivalent to (older systems compare against these) */
function wearing() {
  if (S.wearing === 'robe') return 'outfit_pajamas'; if (S.wearing !== 'look') return S.wearing;
  const s = lookStyles(), t = P(S.on.dress) || P(S.on.top);
  if (t && t.styles[0] === 'cozy' && /pajama|pyjama|nightie|sleep|lounge/i.test(t.name)) return 'outfit_pajamas';
  if (s.includes('formal') || s.includes('party')) return 'outfit_evening'; if (s.includes('sport')) return 'outfit_sport'; if (s.includes('rain')) return 'outfit_raincoat'; if (s.includes('artsy')) return 'outfit_artist';
  if (s.includes('winter')) return 'outfit_winter'; return 'outfit_look';
}
function playerStates() {
  const out = [], s = styles(), w = wearing(), indoor = !!(G.scene && G.scene.indoor);
  if ((S.same || 1) >= SAME_DAYS || wornIds().some(id => st(id) === DIRTY)) out.push('same_outfit_days');
  if (w === 'outfit_pajamas') out.push('pajamas'); if (s.includes('formal') || s.includes('party')) out.push('dressed_up'); if (s.includes('sport')) out.push('sporty'); if (s.includes('artsy')) out.push('artist_outfit');
  if (!indoor && G.now().season === 3 && warmth() < 5) out.push('underdressed_cold');
  return out;
}

/* ---------- a day of wear ---------- */
const bodySig = () => (S.wearing === 'look' ? BODY.map(k => S.on[k] || '').join('|') : S.wearing);
function onDay() {
  if (!S) return; const fresh = [];
  for (const id of new Set(wornIds())) { const lim = washable(id); if (!lim) continue; const r = rec(id); r[1]++; if (r[0] < DIRTY) { r[0] = r[1] >= lim ? DIRTY : WORN; if (r[0] === DIRTY) fresh.push(id); } }
  const sig = bodySig(); S.same = sig === S.sig ? (S.same || 1) + 1 : 1; S.sig = sig;
  const dirty = wornIds().filter(id => st(id) === DIRTY);
  if (dirty.length) { safe(() => G.needs.add('hygiene', -MUSTY)); safe(() => G.needs.addMoodlet('musty_clothes')); }
  if (fresh.length) { toast(fresh.length === 1 ? `${nameOf(fresh[0])} has had its ${washable(fresh[0])} days. Change at your dresser; it goes in the hamper.` : `${fresh.length} things you are wearing need a wash. Change at your dresser; they go in the hamper.`, 'info', 5200); G.emit('wardrobe:dirty', fresh); safe(() => G.tips.show('laundry')); }
  G.emit('wardrobe:day', { same: S.same, dirty });
}
function onHour() {
  if (!S || S.temp || !G.scene || G.scene.indoor) return; const wx = safe(() => G.weather.current(), null), t = wx && isFinite(wx.tempC) ? wx.tempC : (G.now().season === 3 ? 0 : 16), w = warmth();
  if (t <= 5 && w < 6) { if (safe(() => G.needs.addMoodlet('underdressed'), false) && !G.state.flags.cold_hint) { G.state.flags.cold_hint = 1; toast('Brr. You are not dressed for this. A coat, a hat and a scarf would fix it.', 'info', 4200); } }
  else if (t >= 27 && w >= 8) safe(() => G.needs.addMoodlet('overdressed'));
}
// strangers notice the same clothes several days running (the written pool LINES.player.same_outfit_days)
let chat = 20;
function react(dt) {
  if ((chat -= dt) > 0) return; chat = 26 + Math.random() * 20;
  if (!S || G.modal || !G.scene || G.scene.id !== 'city' || !G.player || S.temp || (S.same || 1) < SAME_DAYS) return;
  const pool = safe(() => LINES.player.same_outfit_days, null); if (!pool || !pool.length || Math.random() < .4) return;
  let best = null, bd = 25; for (const e of G.scene.ents) { if (e === G.player || !(e instanceof Char) || e.hidden) continue; const d = (e.x - G.player.x) ** 2 + (e.y - G.player.y) ** 2; if (d < bd) { bd = d; best = e; } }
  if (best) bubble(best, pool[(S.li = (S.li || 0) + 1) % pool.length], 3200);
}

/* ---------- saved outfits, favourites, wish list ---------- */
function saveLook(name) { const on = {}; for (const k of SLOTS) if (S.on[k]) on[k] = S.on[k]; if (S.wearing !== 'look' || !Object.keys(on).length) return false; S.looks.push({ n: String(name || 'Outfit ' + (S.looks.length + 1)).slice(0, 24), on }); return true; }
function wearLook(i) {
  const L = S.looks[i]; if (!L || S.temp) return false; const ids = Object.values(L.on).filter(id => S.pc[id]), bad = ids.filter(id => st(id) >= DIRTY);
  if (bad.length) { toast(`${nameOf(bad[0])}${bad.length > 1 ? ' and ' + (bad.length - 1) + ' more' : ''} need a wash first.`, 'bad'); return false; }
  for (const k of SLOTS) if (S.on[k] && !ids.includes(S.on[k])) drop(k); for (const id of ids) wearPiece(id, { batch: true, quiet: true }); changed(); return true;
}
const toggle = (arr, id) => { const i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); else arr.push(id); return i < 0; };

/* ---------- today's suggestion ---------- */
function suggest() {
  const day = today(), season = G.now().season, wx = safe(() => G.weather.current(), null), wet = !!(wx && /rain|storm/.test(wx.kind)), cold = season === 3 || !!(wx && wx.tempC < 8), hot = !cold && (season === 1 || !!(wx && wx.tempC > 24));
  const want = wet ? 'rain' : cold ? 'winter' : hot ? 'summer' : null, target = cold ? 3 : hot ? .5 : 1.5;
  const own = sl => pieces().map(P).filter(p => slotOf(p) === sl && st(p.id) < DIRTY);
  const score = p => -Math.abs(p.warmth - target) * 2 + (want && p.styles.includes(want) ? 3 : 0) + (st(p.id) === CLEAN ? 1 : 0) + ((hashStr(p.id) + day) % 7) / 7 + (S.fav.includes(p.id) ? .5 : 0) - (S.on[slotOf(p)] === p.id && (S.same || 1) >= 2 ? 3 : 0);
  const best = sl => own(sl).sort((a, b) => score(b) - score(a))[0] || null;
  const top = best('top'), bot = best('bottom'), dr = best('dress'), ids = [];
  if (top && bot && !(dr && score(dr) > (score(top) + score(bot)) / 2 + 1)) ids.push(top.id, bot.id); else if (dr) ids.push(dr.id); else if (top || bot) ids.push((top || bot).id);
  const why = wet ? 'Rain today' : cold ? 'Cold out' : hot ? 'A warm one' : 'Mild today';
  if (!ids.length) {
    const sets = S.owned.filter(id => st(id) < DIRTY), pickSet = sets.find(id => (ITEM_BY_ID[id].styles || []).includes(want)) || sets.find(id => id !== S.wearing && !/pajama|robe|swim/.test(id)) || sets[0];
    if (pickSet) return { ids: [], set: pickSet, robe: false, why };
    return { ids: [], set: null, robe: true, why: 'Nothing clean' };
  }
  for (const sl of ['outer', 'shoes', 'hat', 'neck', 'gloves']) { if ((sl === 'outer' && !cold && !wet) || ((sl === 'hat' || sl === 'neck' || sl === 'gloves') && !cold)) continue; const p = best(sl); if (p && (sl === 'shoes' || sl === 'outer' || p.warmth >= 2)) ids.push(p.id); }
  return { ids, set: null, robe: false, why };
}
function wearSuggestion(sg) {
  sg = sg || suggest(); if (sg.robe) return wearRobe(); if (sg.set) return wear(sg.set);
  for (const sl of ['outer', 'hat', 'neck', 'gloves']) if (S.on[sl] && !sg.ids.includes(S.on[sl])) drop(sl);
  let ok = false; for (const id of sg.ids) ok = wearPiece(id, { batch: true, quiet: true }) || ok; changed(); return ok;
}

/* ---------- UI: panels shared by the dresser and the Closet app ---------- */
const WARM_WORD = w => (w <= 2 ? 'beach weather only' : w <= 4 ? 'light' : w <= 6 ? 'comfortable' : w <= 8 ? 'warm' : 'toasty');
const stateSub = id => { const s = st(id), lim = washable(id); return s === CLEAN ? '' : s === WORN ? `worn ${S.pc[id][1]}/${lim}` : STATE_TAG[s]; };
export function summaryEl() {
  const cur = S.wearing === 'look' ? 'Your own outfit' : nameOf(S.wearing), dirty = wornIds().filter(id => st(id) === DIRTY).length;
  return el('div', null, el('b', { text: cur }), el('div', { text: 'Style: ' + styles().join(', ') }), el('div', { text: 'Warmth: ' + WARM_WORD(warmth()) }),
    (S.same || 1) >= 2 ? el('div', { text: `Day ${S.same} in these clothes` + (S.same >= SAME_DAYS ? ' (people notice)' : '') }) : null, dirty ? el('div', { style: { color: '#b83a3a' }, text: `${dirty} dirty piece${dirty > 1 ? 's' : ''} on you` }) : null,
    S.temp ? el('div', { text: 'In uniform until your shift ends.' }) : null);
}
function todayPanel(host, redraw) {
  const sg = suggest(), box = el('div.ph-card', { style: { padding: '8px', border: '2px solid #2a2733', background: '#fffdf4', marginBottom: '8px' } });
  box.append(el('b', { text: `Today's suggestion · ${sg.why}` }));
  if (sg.robe) box.append(el('p.cw-note', { text: 'Every stitch you own is dirty or in the wash. The bathrobe it is. Take the hamper to a washer.' }));
  else if (sg.set) box.append(el('div.cw-line', null, iconEl(sg.set, 2, 'outfit'), el('span', { text: nameOf(sg.set) })));
  else box.append(el('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap', margin: '6px 0' } }, sg.ids.map(id => thumb(P(id), 2))), el('p.cw-note', { text: sg.ids.map(nameOf).join(' · ') }));
  box.append(el('button.opt', { disabled: !!S.temp, onclick: () => { wearSuggestion(sg); redraw(); } }, el('span.opt-l', { text: sg.robe ? 'Put on the bathrobe' : 'Wear this' })));
  host.append(box, el('b', { text: 'What you have on' }));
  const ids = wornIds(); if (S.wearing === 'robe') host.append(el('div.cw-line', null, el('span', { text: 'Bathrobe and slippers' })));
  for (const id of ids) { const p = P(id), sl = p ? slotOf(p) : null;
    host.append(el('div.cw-line', null, p ? thumb(p, 2) : iconEl(id, 2, 'outfit'), el('span', null, el('div', { text: nameOf(id) }), el('small', { style: { opacity: .7 }, text: (p ? SLOT_LABEL[sl] : 'Outfit') + (stateSub(id) ? ' · ' + stateSub(id) : '') })),
      p ? el('button.ph-btn', { disabled: !!S.temp, onclick: () => { takeOff(sl); redraw(); } }, el('span', { text: 'Take off' })) : null)); }
  const ham = byState(HAMPER).length, dirty = byState(DIRTY).length, wash = byState(WASH).length + byState(CLEANER).length;
  host.append(el('p.cw-note', { text: `Laundry: ${ham} in the hamper, ${dirty} dirty and still out, ${wash} being washed.` + (ham + dirty ? ' Take the hamper to a laundromat or your own washer.' : '') }));
}
const fst = { slot: '', style: '', brand: '', q: '', sort: '', fav: false };
function drawersPanel(host, redraw) {
  const list = pieces().map(P), holder = el('div');
  const draw = () => { holder.textContent = ''; const out = applyFilter(list, fst, { isFav: id => S.fav.includes(id), order: (a, b) => st(a.id) - st(b.id) });
    holder.append(el('p.cw-note', { text: `${out.length} of ${list.length} pieces. Tap to put on or take off; hold the heart in the app to favourite.` }), grid(out, { empty: list.length ? 'Nothing matches.' : 'Your drawers are empty. Clothes shops, the Galleria and the market sell pieces.',
      cell: it => ({ sub: stateSub(it.id) || SLOT_LABEL[slotOf(it)], tag: STATE_TAG[st(it.id)] || (S.on[slotOf(it)] === it.id ? 'on' : ''), tagCls: 's' + st(it.id), cls: S.on[slotOf(it)] === it.id ? 'on' : st(it.id) >= DIRTY ? 'off' : '', fav: S.fav.includes(it.id) }),
      onPick: it => { const sl = slotOf(it); if (S.on[sl] === it.id) takeOff(sl); else wearPiece(it.id); redraw(); } })); };
  host.append(filterBar(fst, draw), holder); draw();
}
function outfitsPanel(host, redraw) {
  host.append(el('b', { text: 'Ready-made outfits' })); const g = el('div.cw-grid');
  for (const id of S.owned) { const it = ITEM_BY_ID[id]; if (!it) continue; const s = st(id), on = S.wearing === id;
    const c = el('button.cw-cell' + (on ? '.on' : s >= DIRTY ? '.off' : ''), { onclick: () => { if (!on) { wear(id); redraw(); } } }, specThumb(specWith(specFor(id), []), 'full', 2), el('b', { text: it.name }), el('small', { text: on ? 'wearing' : stateSub(id) || (it.styles || []).join(', ') }));
    if (STATE_TAG[s]) c.append(el('span.cw-tag.s' + s, { text: STATE_TAG[s] })); g.append(c); }
  host.append(g, el('b', { style: { display: 'block', marginTop: '10px' }, text: 'Outfits you put together' }));
  if (!S.looks.length) host.append(el('p.cw-note', { text: 'Dress from your drawers, then save the combination here under a name.' }));
  S.looks.forEach((L, i) => host.append(el('div.cw-line', null, specThumb(specWith(base(), Object.values(L.on)), 'full', 1), el('span', null, el('div', { text: L.n }), el('small', { style: { opacity: .7 }, text: Object.values(L.on).length + ' pieces' })),
    el('button.ph-btn', { onclick: () => { if (wearLook(i)) redraw(); } }, el('span', { text: 'Wear' })), el('button.ph-btn', { 'aria-label': 'Delete outfit', onclick: () => { S.looks.splice(i, 1); redraw(); } }, el('span', { text: '✕' })))));
  if (S.wearing === 'look') { const inp = el('input', { type: 'text', maxlength: 24, placeholder: 'Name this outfit', 'aria-label': 'Outfit name', style: { flex: '1 1 120px', font: 'inherit', fontSize: '12px', border: '2px solid #2a2733', padding: '4px', minWidth: '0' } }); inp.addEventListener('keydown', e => e.stopPropagation());
    host.append(el('div.cw-row', null, inp, el('button.ph-btn', { onclick: () => { if (saveLook(inp.value.trim() || undefined)) { toast('Outfit saved.', 'good'); redraw(); } } }, el('span', { text: 'Save what I am wearing' })))); }
}
/** fill `host` with one of the wardrobe panels; redraw() is called after anything changes */
export function panel(kind, host, redraw) { injectCss(); (kind === 'drawers' ? drawersPanel : kind === 'outfits' ? outfitsPanel : todayPanel)(host, redraw); }

/** crisp large render of a character spec */
export function previewCanvas(spec, o = {}) { return big(spec, o); }
const specWithPieces = list => specWith(S.wearing === 'look' || S.wearing === 'robe' ? specWith(base(), BODY.map(k => S.on[k]).filter(Boolean).concat(accIds())) : specWith(specFor(S.wearing), accIds()), (list || []).map(x => (typeof x === 'string' ? P(x) : x)).filter(Boolean));
function mirror(list, o = {}) {
  const m = modal({ title: o.title || 'Mirror', cls: 'wardrobe' }), names = (list || []).map(p => (typeof p === 'string' ? P(p) : p)).filter(Boolean).map(p => p.name);
  m.body.append(el('div', { style: { display: 'flex', justifyContent: 'center' } }, stage(specWithPieces(list), 7)), el('p.cw-note', { style: { textAlign: 'center' }, text: 'Tap to turn round' })); if (names.length) m.body.append(el('p', { style: { fontSize: '13px', margin: '8px 0 0' }, text: names.join(' · ') }));
  return m;
}
let win = null, tab = 'today';
function open(o = {}) {
  if (o.preview && G.clothesShop && G.clothesShop.fitting && G.clothesShop.fitting()) return true;
  if (win) win.close(); injectCss();
  const m = win = modal({ title: 'Dresser', cls: 'wardrobe', onClose: () => { win = null; } });
  const draw = () => {
    m.body.textContent = '';
    m.body.append(el('div.cw-top', null, stage(G.state.player.spec, 4), summaryEl()));
    const tabs = el('div.cw-chips'); for (const [k, n] of [['today', 'Today'], ['drawers', `Drawers (${pieces().length})`], ['outfits', `Outfits (${S.owned.length + S.looks.length})`]]) tabs.append(el('button' + (tab === k ? '.on' : ''), { text: n, onclick: () => { tab = k; draw(); } }));
    const host = el('div'); m.body.append(tabs, host); panel(tab, host, draw);
    m.body.append(el('button.opt', { style: { marginTop: '10px' }, onclick: async () => { m.close(); const spec = await openCreator({ mode: 'edit', spec: Object.assign({}, base()) }); if (spec) { setLook(spec); toast('Looking good.', 'good'); } } }, iconEl('ui.sparkle', 2), el('span.opt-l', { text: 'Change your look...' }), el('span.opt-s', { text: 'face, build, travel clothes' })));
  };
  draw(); G.emit('wardrobe:open'); return true;
}
const byState = n => Object.keys(S.pc).filter(id => S.pc[id][0] === n && (P(id) || isSet(id)));
function setState(ids, state, fresh) { for (const id of ids) { const r = rec(id); r[0] = state; if (fresh) r[1] = 0; } if (state >= DIRTY) { let ch = false; for (const k of SLOTS) if (ids.includes(S.on[k])) { delete S.on[k]; ch = true; } if (ids.includes(S.wearing)) { S.wearing = 'robe'; ch = true; } if (ch) changed(); } }

export function init() {
  G.defineState('wardrobe', blank); norm();
  G.wardrobe = { owned: () => S.owned.slice(), owns, add, wear, wearing, styles, perk,
    wearTemp(key) { base(); S.temp = key || null; apply(); G.emit('wardrobe:change', wearing()); }, restore() { if (!S.temp) return; S.temp = null; apply(); G.emit('wardrobe:change', wearing()); }, setLook, open, specFor,
    PIECES: true, pieces, piece: P, state: st, wears: id => (S.pc[id] ? S.pc[id][1] : 0), on: () => Object.assign({}, S.on), raw: () => S.wearing, wearPiece, takeOff, wearRobe,
    looks: () => S.looks.slice(), saveLook, wearLook, deleteLook: i => !!S.looks.splice(i, 1).length, fav: id => toggle(S.fav, id), isFav: id => S.fav.includes(id), wish: id => toggle(S.wish, id), isWish: id => S.wish.includes(id), wishes: () => S.wish.slice(),
    suggest, wearSuggestion, warmth, sameDays: () => S.same || 1, wornIds, byState, setState, washable, delicate, nameOf, playerStates, refresh: apply, previewCanvas, specWithPieces, mirror, panel, summaryEl, currentSpec };
  G.on('load', () => { norm(); apply(); });
  G.on('game:new', o => { G.state.wardrobe = blank(); norm(); S.base = strip((o && o.spec) || G.state.player.spec || {}); delete S.base.outfit; });
  G.on('shop:buy', drain); G.on('day', onDay); G.on('hour', onHour); G.on('hair:change', () => apply());
  G.addSystem({ name: 'wardrobe-react', update: react });
}
