// VIEWING A HOME (more homes, owner msg 107): while you walk around a home that is not yours (G.housing.view(id) from its door card or its Nestly listing)
// a small bar sits above the bottom edge (clear of the HUD and of notification banners): the name, "Furnished / Empty" (see it both ways), "Listing" (the Nestly page with the prices) and "Leave".
// Nothing in a show home can be used except its doors, stairs and seats (housing.js `guard`). The bar is plain DOM; its style lives in a <style> made here.
import { G } from '../core/game.js';
import { el } from './kit.js';
export const order = 126;
let bar = null;
const CSS = `.hv-bar{position:fixed;left:8px;right:64px;bottom:58px;z-index:40;display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:6px 8px;background:#fff3dc;border:2px solid #2a2733;box-shadow:3px 3px 0 #2a2733;font-size:12px;line-height:1.2;color:#2a2733}
.hv-bar b{flex:1 1 100%;font-size:13px}.hv-bar small{flex:1 1 100%;opacity:.8}
.hv-bar button{flex:1 1 0;min-height:34px;padding:4px 6px;border:2px solid #2a2733;background:#f6e8c0;color:#2a2733;font:inherit;box-shadow:2px 2px 0 #2a2733}
.hv-bar button.on{background:#3f8f8a;color:#fff}.hv-bar button.go{background:#d9a23a}`;
function draw() {
  const v = G.housing && G.housing.viewing && G.housing.viewing(); if (!v || (G.furnish && G.furnish.active) || (G.phone && G.phone.isOpen)) { if (bar) { bar.remove(); bar = null; } return; }
  const L = G.housing.homes().find(x => x.id === v.id); if (!L) return; const money = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
  if (bar) bar.remove();
  const price = [L.rent && `${money(L.rent)} a week`, L.price && `${money(L.price)} to buy`].filter(Boolean).join(' or ');
  bar = el('div.hv-bar', null, el('b', { text: 'Viewing: ' + L.home.name }),
    el('small', { text: L.pieces ? (v.furnished ? `Furnished: ${price}, plus ${money(L.pkg)} once for the ${L.pieces} pieces. They would be yours.` : `Empty: ${price}. Fitted kitchen and bathroom, the rest is up to you.`) : price }),
    L.pieces ? el('button' + (v.furnished ? '.on' : ''), { text: 'Furnished', onclick: () => G.housing.viewFurnished(true) }) : null,
    L.pieces ? el('button' + (v.furnished ? '' : '.on'), { text: 'Empty', onclick: () => G.housing.viewFurnished(false) }) : null,
    el('button.go', { text: L.available ? 'Listing' : 'Details', onclick: () => { if (G.phone && G.phone.open) G.phone.open('homes', { home: v.id }); } }),
    el('button', { text: 'Leave', onclick: () => { const it = (G.scene.interactables || []).find(i => i.exit && /Leave/.test(i.label || '')); if (it && it.use) it.use(G); else G.go('city', { poi: 'door:home:' + v.id }); } }));
  document.body.append(bar);
}
export function init() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
  G.on('scene', () => setTimeout(draw, 0)); G.on('home:view', () => setTimeout(draw, 0)); G.on('home:move', () => setTimeout(draw, 0)); G.on('phone:open', () => setTimeout(draw, 0)); G.on('phone:close', () => setTimeout(draw, 0));
}
