// The inspect sheet for a displayed home good (tap a sofa / lamp / plant in a home-goods store). Used by src/sim/goods.js; no init.
//   openSheet(goodId, storeId, fx?) -> modal   big pixel picture, the colourways THIS shop has (tap to switch), price, what it does, how it gets home,
//   Buy (bag or delivery) and, for seats and beds, "Try it" (sit / lie on the display piece for a few minutes).
import { G } from '../core/game.js';
import { GOOD_BY_ID, STORE_BY_ID, CATS, familyOf } from '../data/goods.js';
import { asset } from '../art/registry.js';
import { assetSprite } from '../engine/sprites.js';
import { modal, el, toast } from '../ui/kit.js';

const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const DOES = {
  sofa: 'Sit on it, read on it, watch TV from it.', bed: 'Sleep in it. Better beds rest you faster.', tv: 'Watch it from the nearest seat.', music: 'Put a record on.', game: 'Play on it.',
  computer: 'Browse, work and play on it.', bookshelf: 'Holds your books; read from it.', exercise: 'Work out at home.', instrument: 'Play it and practise.', easel: 'Paint on it.',
  plant: 'A living plant: water it and it brightens the room.', rug: 'Lies under the furniture and warms up the floor.', bath: 'A proper soak (it goes in the bathroom).', shower: 'Fitted in your bathroom.',
};
const STYLE = { modern: 'Modern', classic: 'Classic', midcentury: 'Mid-century', cottage: 'Cottage', glam: 'Glam', rustic: 'Rustic', japandi: 'Japandi', boho: 'Boho', retro: 'Retro', kids: 'Playful', coastal: 'Coastal', industrial: 'Industrial', scandi: 'Scandi' };
const swatchOf = g => { const p = g.p || {}; return p.c || p.wood || p.metal || p.c2 || p.pot || '#b8794a'; };
const colourName = g => g.colour || (g.name.includes(', ') ? g.name.split(', ').pop() : 'Standard');

let CSS = false;
function css() {
  if (CSS || typeof document === 'undefined') return; CSS = true;
  document.head.append(el('style', { text: `.gd-win{max-width:360px}.gd-pic{display:flex;align-items:flex-end;justify-content:center;height:156px;background:var(--paper2,#efe6d2);border:2px solid #2a2733;margin:4px 0 6px;position:relative}
.gd-pic canvas{image-rendering:pixelated}.gd-store{position:absolute;left:4px;top:3px;font-size:11px;opacity:.75}.gd-price{display:flex;justify-content:space-between;align-items:baseline;margin:2px 2px 4px}
.gd-price b{font-size:20px}.gd-sw{display:flex;flex-wrap:wrap;gap:5px;margin:2px 0 6px}.gd-sw button{width:28px;height:28px;border:2px solid #2a2733;padding:0;cursor:pointer;box-shadow:2px 2px 0 #2a2733}
.gd-sw button.on{outline:3px solid #f2c230;outline-offset:1px}.gd-facts{margin:0 2px 6px;padding:0;list-style:none;font-size:13px;line-height:1.35}.gd-facts li{margin:2px 0}
.gd-btns{display:flex;gap:6px;flex-wrap:wrap}.gd-btns button{flex:1 1 30%;min-height:40px}` }));
}
function picture(g) {
  const a = asset('furn.home.' + g.art), sp = assetSprite(a, Object.assign({}, g.p, { on: true }), false), k = Math.max(1, Math.min(7, Math.floor(Math.min(300 / sp.c.width, 140 / sp.c.height))));
  const c = document.createElement('canvas'); c.width = sp.c.width * k; c.height = sp.c.height * k; c.style.width = c.width + 'px'; c.style.height = c.height + 'px';
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(sp.c, 0, 0, c.width, c.height); return c;
}
function facts(g, storeId) {
  const L = [], it = safe(() => G.housing.visual(g.id), null), sz = it && it.size;
  L.push(`${CATS[g.cat] || g.cat} · ${STYLE[g.style] || g.style}`);
  L.push(g.lamp ? 'A lamp: switch it on and off at home.' : DOES[g.tag] || 'Decoration: it makes the room nicer to be in.');
  if (g.place === 'wall') L.push('Hangs on a wall.'); else if (sz) L.push(`Takes ${Math.round(sz[0] * 10) / 10} x ${Math.round(sz[1] * 10) / 10} tiles of floor.`);
  if (g.ambience) L.push(`Ambience +${g.ambience}`);
  L.push(g.carry ? 'Small enough to carry: it goes in your shopping bag.' : 'Too big to carry: delivered to your home.');
  const own = safe(() => G.housing.storage().concat(G.housing.items().map(i => i.itemId)).filter(id => id === g.id).length, 0); if (own) L.push(`You own ${own}.`);
  return L;
}
export function openSheet(goodId, storeId, fx) {
  css(); let g = GOOD_BY_ID[goodId]; if (!g) return null; const st = STORE_BY_ID[storeId] || {};
  const fam = familyOf(goodId).filter(q => !storeId || q.stores.includes(storeId));
  const m = modal({ title: g.name, cls: 'gd-win' });
  const draw = () => {
    m.body.textContent = ''; const title = m.el.querySelector('.win-title'); if (title) title.textContent = g.name;
    const p = G.goods.price(g.id, storeId), can = !G.money || safe(() => G.money.canAfford(p, { category: 'homegood', venue: storeId }), true), bagFull = g.carry && G.goods.bag().length >= G.goods.BAG_MAX;
    m.body.append(el('div.gd-pic', null, el('span.gd-store', { text: st.short || '' }), picture(g)));
    m.body.append(el('div.gd-price', null, el('b', { text: fmt(p) }), el('span', { text: fam.length > 1 ? `${colourName(g)} · ${fam.length} colours here` : colourName(g) })));
    if (fam.length > 1) m.body.append(el('div.gd-sw', null, ...fam.map(q => el('button' + (q.id === g.id ? '.on' : ''), { title: colourName(q), style: 'background:' + swatchOf(q), onclick: () => { g = q; draw(); } }))));
    m.body.append(el('ul.gd-facts', null, ...facts(g, storeId).map(t => el('li', { text: t }))));
    const tryable = fx && fx.seats && fx.seats.length && fx.item && GOOD_BY_ID[fx.item.gd] && GOOD_BY_ID[fx.item.gd].family === g.family;
    m.body.append(el('div.gd-btns', null,
      el('button.go', { text: bagFull ? 'Bag is full' : can ? `Buy · ${fmt(p)}` : 'Not enough money', disabled: !can || bagFull, onclick: () => { const how = G.goods.buy(g.id, storeId); if (how) m.close(); } }),
      tryable ? el('button', { text: fx.seats[0].lie ? 'Lie down on it' : 'Try it', onclick: () => { m.close(); tryIt(fx, g); } }) : null,
      el('button', { text: 'Not now', onclick: () => m.close() })));
  };
  draw(); return m;
}
function tryIt(fx, g) {
  const s = fx.seats.find(q => !G.scene.ents.some(e => e !== G.player && !e.hidden && Math.hypot(e.x - q.x, e.y - q.y) < .4)) || fx.seats[0];
  G.startActivity({ label: s.lie ? 'Testing the mattress' : 'Trying it out', anim: s.lie ? 'sleep' : 'sit', minutes: 4, at: { x: s.x, y: s.y, z: s.z || 0, dir: s.dir },
    done: () => { safe(() => G.needs.add('fun', 2)); toast(s.lie ? `The ${g.name.split(',')[0]}: firm in the right places. A staff member pretends not to see you.` : `You sink into the ${g.name.split(',')[0]}. Comfortable.`, 'info', 3200); } });
}
