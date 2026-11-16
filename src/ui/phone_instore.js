// "Only in store" pieces in the shopping apps (Roomy, the Closet catalogue, design mode, the home computer's online shop): the shared tag, store list and button.
// Rule + data: src/data/instore.js; runtime (where, take, plan): src/sim/instore.js (G.instore).
//   storeTag(short?) -> <span class="is-tag">Only in store</span>
//   storePanel(id, { close?, price?(row) }) -> element: "Only available in store" + up to three shops, nearest first, each with district, distance, open / opens-at, Take me there,
//                                              and "Add to My Day" when it is closed now. close() runs before the route card opens (a modal closes itself; the phone swaps to the Map).
//   storeButton(id, { close?, cls? }) -> the button that takes the place of Buy / Order / Add to cart: "Only in store · Take me there" (nearest shop that has it)
import { G } from '../core/game.js';
import { el } from './kit.js';

let CSS = false;
export function css() {
  if (CSS || typeof document === 'undefined') return; CSS = true;
  document.head.append(el('style', { text: `.is-tag{display:inline-block;background:#3a3644;color:#fff4dc;font-size:10px;font-weight:700;line-height:1;padding:3px 4px 2px;letter-spacing:.02em;white-space:nowrap;vertical-align:middle}
.is-tag.on{background:#2f7a3a}.is-r{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex:none}
.is-panel{border:2px solid #2a2733;background:#fff4dc;box-shadow:2px 2px 0 #2a2733;padding:6px 8px;margin:4px 0 8px}
.is-panel>b{display:block;font-size:14px;margin-bottom:2px}.is-panel>p{margin:0 0 4px;font-size:12px;opacity:.85}
.is-shop{border-top:2px dashed rgba(42,39,51,.25);padding:6px 0 2px}.is-shop:first-of-type{border-top:0}
.is-shop .is-n{font-weight:700;font-size:13px}.is-shop small{display:block;font-size:12px;opacity:.85}.is-shop .is-open{color:#2f7a3a;font-weight:700}.is-shop .is-shut{color:#a33a2a;font-weight:700}
.is-acts{display:flex;gap:6px;margin-top:4px}.is-acts button{flex:1;min-height:40px;font-size:13px;padding:2px 6px}
.is-go{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:44px;font-weight:700}
.is-avail{display:flex;gap:6px;margin:0 0 6px}.is-avail button{flex:1;min-height:36px;font-size:12px;padding:2px}.is-avail button.on{background:var(--gold,#f2c230)}.cw-tag.store{background:#3a3644;color:#fff4dc;border-color:#3a3644}` }));
}
const I = () => G.instore;
export const isOnline = id => !I() || I().online(id);
export function storeTag(short) { css(); return el('span.is-tag', { text: short ? 'In store' : 'Only in store' }); }
function go(r, o) { if (o.close) { try { o.close(); } catch (e) { /* closing is best effort */ } } setTimeout(() => I().take(r.place, r.name), o.close ? 60 : 0); }
export function storePanel(id, o = {}) {
  css(); const rows = I() ? I().where(id, 3) : [];
  const box = el('div.is-panel', null, el('b', { text: 'Only available in store' }), el('p', { text: rows.length ? 'Not sold online. Go and see it in person:' : 'Not sold online.' }));
  for (const r of rows) {
    const state = r.season ? el('span.is-shut', { text: `On the rails in ${r.season}` }) : !r.inStock ? el('span.is-shut', { text: 'Sold out this week, back on Monday' }) : r.open ? el('span.is-open', { text: 'Open now' }) : el('span.is-shut', { text: r.opens });
    const acts = el('div.is-acts', null, el('button.ph-btn' + (rows[0] === r ? '.pri' : ''), { 'data-instore-go': r.place, onclick: () => go(r, o) }, el('span', { text: 'Take me there' })));
    if (!r.open && r.opensT && G.planner) acts.append(el('button.ph-btn', { onclick: e => { if (I().plan(r)) { e.currentTarget.disabled = true; e.currentTarget.lastChild.textContent = 'On My Day'; } } }, el('span', { text: 'Add to My Day' })));
    box.append(el('div.is-shop', null, el('div.is-n', { text: r.name + (r.districtName ? ` (${r.districtName})` : '') + (o.price ? ' · ' + o.price(r) : '') }), el('small', null, state, ` · ${r.dist} away`), acts));
  }
  return box;
}
export function storeButton(id, o = {}) {
  css(); const r = I() ? I().where(id, 1)[0] : null;
  return el('button.ph-btn.is-go' + (o.cls ? '.' + o.cls.split(' ').join('.') : ''), { 'data-instore-btn': id, onclick: () => { if (r) go(r, o); } }, el('span', { text: r ? `Only in store · Take me there` : 'Only in store' }));
}
/** All / Order online / In store: a row of three toggle buttons; value in st.avail ('' | 'online' | 'store') */
export function availBar(st, redraw) {
  css(); return el('div.is-avail', null, ...[['', 'All'], ['online', 'Order online'], ['store', 'In store']].map(([k, n]) => el('button' + ((st.avail || '') === k ? '.on' : ''), { text: n, 'data-avail': k || 'all', onclick: () => { st.avail = k; redraw(); } })));
}
export const availOk = (st, id) => !st.avail || (st.avail === 'online') === isOnline(id);
export function init() {}
