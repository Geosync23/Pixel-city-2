// Wardrobe: owned outfits (items.js OUTFITS), what you are wearing, job uniforms, and the wardrobe window.
//
// State G.state.wardrobe = { owned: [outfit item ids], wearing: itemId, base: spec as made in the character creator (the 'outfit_travel' look), temp: art outfit key | null }
// G.wardrobe
//   owned() -> [itemId]     owns(itemId)     add(itemId, quiet?) -> bool (new)       wearing() -> itemId
//   wear(itemId) -> bool    change outfit (free, instant)                            styles() -> ['casual', ...] of the current outfit (['uniform'] on shift)
//   perk() -> items.js perk object of the current outfit ({} in uniform)
//   wearTemp(outfitKey)     put on a job uniform (art outfit key from jobs.js, e.g. 'barista') without changing `wearing`;  restore() takes it off
//   setLook(spec)           new base look (from the creator); the current outfit is re-applied on top
//   open({ preview? })      the wardrobe window: change outfit, "Change your look" (character creator in edit mode)
// Events: 'wardrobe:change'(itemId), 'wardrobe:add'(itemId)
// The sim core opens it from wardrobe fixtures / fitting rooms through data activity `change_outfit` (onComplete.opens 'wardrobe').
import { G } from '../core/game.js';
import { OUTFITS, ITEM_BY_ID } from '../data/items.js';
import { START } from '../data/economy.js';
import { charArt } from '../core/char.js';
import { modal, el, toast } from '../ui/kit.js';
import { iconEl } from '../ui/_icons.js';
import { openCreator } from '../ui/creator.js';

export const order = 61;
const CLOTH = ['top', 'topColor', 'bottom', 'bottomColor', 'shoes', 'hat', 'hatColor', 'scarf', 'innerColor', 'accent', 'outfit'];
/** items.js outfit key -> character spec overrides (null = your own clothes from the creator) */
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
let S = null, ver = 1;
const blank = () => ({ owned: (START.ownedItems || []).filter(i => ITEM_BY_ID[i] && ITEM_BY_ID[i].category === 'outfit'), wearing: 'outfit_travel', base: null, temp: null });
function norm() { S = G.state.wardrobe; if (!S || typeof S !== 'object') S = G.state.wardrobe = blank(); const b = blank(); for (const k in b) if (S[k] === undefined) S[k] = b[k]; if (!S.owned.includes('outfit_travel')) S.owned.unshift('outfit_travel'); drain(); return S; }
function drain() { const o = G.state.owned; if (o && Array.isArray(o.outfits)) for (const id of o.outfits.splice(0)) if (!S.owned.includes(id)) S.owned.push(id); }
const strip = spec => { const s = Object.assign({}, spec); delete s._v; return s; };
function base() { if (!S.base) { S.base = strip(G.state.player.spec || G.player.spec || {}); delete S.base.outfit; } return S.base; }
/** the spec for a given outfit item on top of the base look */
function specFor(itemId, temp) {
  const b = base(), it = ITEM_BY_ID[itemId], look = it ? LOOKS[it.outfit] : null, s = Object.assign({}, b, look || {});
  if (temp) { const A = charArt(), key = (A.OUTFITS || []).includes(temp) ? temp : null; if (key) s.outfit = key; else { const t = OUTFITS.find(o => o.outfit === temp || o.id === temp); if (t && LOOKS[t.outfit]) Object.assign(s, LOOKS[t.outfit]); } }
  return s;
}
function apply() {
  const s = specFor(S.wearing, S.temp); s._v = (((G.state.player.spec && G.state.player.spec._v) || 0) + ver++) % 1e6;
  G.state.player.spec = s; if (G.player) { if (G.player.setSpec) G.player.setSpec(s); else G.player.spec = s; }
}
function add(itemId, quiet) { const it = ITEM_BY_ID[itemId]; if (!it || it.category !== 'outfit') return false; if (S.owned.includes(itemId)) return false; S.owned.push(itemId); G.emit('wardrobe:add', itemId); if (quiet !== true && quiet !== undefined) toast(it.name + ' added to your wardrobe.', 'good'); return true; }
function wear(itemId) { if (!S.owned.includes(itemId)) return false; base(); S.wearing = itemId; apply(); G.emit('wardrobe:change', itemId); return true; }
function styles() { if (S.temp) return ['uniform']; const it = ITEM_BY_ID[S.wearing]; return it && it.styles ? it.styles.slice() : ['casual']; }
function setLook(spec) { const keep = S.base || {}; S.base = strip(spec); delete S.base.outfit; if (S.base.name === undefined && keep.name !== undefined) S.base.name = keep.name; apply(); G.emit('wardrobe:change', S.wearing); }

function preview(itemId, scale = 3) {
  const A = charArt(), c = document.createElement('canvas'), sb = A.CHAR_SB, w = sb[2] - sb[0], h = sb[3] - sb[1]; c.width = w; c.height = h; c.className = 'pix'; c.style.cssText = `width:${w * scale}px;height:${h * scale}px;image-rendering:pixelated;flex:none`;
  try { const ch = new (G.player.constructor)(specFor(itemId), 0, 0); ch.dir = 1; const sp = ch.sprite(); if (sp && sp.c) c.getContext('2d').drawImage(sp.c, 0, 0, sp.c.width, sp.c.height, Math.round((w - sp.c.width) / 2), h - sp.c.height, sp.c.width, sp.c.height); } catch (e) { /* preview is optional */ }
  return c;
}
let win = null;
function open(o = {}) {
  if (win) win.close();
  const m = win = modal({ title: o.preview ? 'Fitting room' : 'Wardrobe', cls: 'wardrobe', onClose: () => { win = null; } });
  const draw = () => {
    m.body.textContent = '';
    const cur = ITEM_BY_ID[S.wearing];
    m.body.append(el('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' } }, preview(S.wearing, 3),
      el('div', null, el('b', { text: cur ? cur.name : 'Your clothes' }), el('div', { style: { fontSize: '12px', opacity: .8 }, text: 'Style: ' + styles().join(', ') }), cur && cur.note && el('div', { style: { fontSize: '12px', opacity: .7 }, text: cur.note }),
        S.temp && el('div', { style: { fontSize: '12px' }, text: 'You are in uniform until your shift ends.' }))));
    const list = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } });
    for (const id of S.owned) { const it = ITEM_BY_ID[id]; if (!it) continue; const on = id === S.wearing;
      list.append(el('button.opt', { disabled: on || !!S.temp, onclick: () => { wear(id); draw(); } }, iconEl(id, 2, 'outfit'), el('span.opt-l', { text: it.name }), el('span.opt-s', { text: on ? 'wearing' : it.styles.join(', ') }))); }
    m.body.append(list);
    if (S.owned.length < 3) m.body.append(el('p', { style: { fontSize: '12px', opacity: .75, margin: '8px 0 0' }, text: 'More outfits are sold at Thread & Co.' }));
    m.body.append(el('button.opt', { style: { marginTop: '8px' }, onclick: async () => { m.close(); const spec = await openCreator({ mode: 'edit', spec: Object.assign({}, base()) }); if (spec) { setLook(spec); toast('Looking good.', 'good'); } } }, iconEl('ui.sparkle', 2), el('span.opt-l', { text: 'Change your look...' }), el('span.opt-s', { text: 'hair, face, colours' })));
  };
  draw(); return true;
}

export function init() {
  G.defineState('wardrobe', blank); norm();
  G.wardrobe = { owned: () => S.owned.slice(), owns: id => S.owned.includes(id), add, wear, wearing: () => S.wearing, styles, perk: () => (S.temp ? {} : (ITEM_BY_ID[S.wearing] || {}).perk || {}),
    wearTemp(key) { base(); S.temp = key || null; apply(); G.emit('wardrobe:change', S.wearing); }, restore() { if (!S.temp) return; S.temp = null; apply(); G.emit('wardrobe:change', S.wearing); }, setLook, open, specFor };
  G.on('load', () => { norm(); });
  G.on('game:new', o => { G.state.wardrobe = blank(); norm(); S.base = strip((o && o.spec) || G.state.player.spec || {}); delete S.base.outfit; });
  G.on('shop:buy', drain);
}
