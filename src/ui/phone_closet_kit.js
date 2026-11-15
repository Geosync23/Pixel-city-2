// Shared wardrobe UI pieces (dresser, fitting room, shop racks, the Closet app): cached piece thumbnails, a lazily filled grid that stays fast with
// 1,300+ pieces, the filter bar, the big "mirror" preview. No init; styles are injected on first use.
//   thumb(piece, scale = 2) -> <canvas>      the piece on the mannequin, cropped to the part of the body it covers (cached per piece)
//   big(spec, { scale, dir }) -> <canvas>    large crisp render of any character spec
//   grid(list, { cell(piece) -> { sub?, tag?, tagCls?, cls? }, onPick(piece, cellEl), page = 36, empty }) -> element   (fills page by page as you scroll)
//   filterBar(state, onChange, { slots?, styles?, brands?, extra? }) -> element     state = { slot, style, brand, q, sort, fav }
//   applyFilter(list, state, { isFav, order }) -> list
import { charArt } from '../core/char.js';
import { render } from '../engine/raster.js';
import { toSprite } from '../engine/sprites.js';
import { el } from './kit.js';
import { previewSpec, BRANDS, STYLES, SLOT_NAME } from '../data/clothes.js';

const CSS = `
.cw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:6px}
.cw-cell{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 2px;background:#fffdf4;border:2px solid #2a2733;font:inherit;font-size:10px;line-height:1.15;min-height:96px;cursor:pointer;color:#2a2733;box-shadow:0 2px 0 #2a273340}
.cw-cell.on{background:#ffe9a8}.cw-cell.off{opacity:.5}.cw-cell:active{transform:translateY(1px)}
.cw-cell b{font-weight:normal;text-align:center;max-height:23px;overflow:hidden;word-break:break-word}.cw-cell small{opacity:.7;text-align:center}
.cw-tag{position:absolute;top:2px;right:2px;font-size:9px;padding:0 3px;border:1px solid #2a2733;background:#fff}
.cw-tag.s1{background:#ffe9a8}.cw-tag.s2{background:#f0a090}.cw-tag.s3{background:#d8c8a8}.cw-tag.s4,.cw-tag.s5{background:#a8d8f0}.cw-tag.new{background:#b8e8a0}.cw-tag.own{background:#d8d0f0}
.cw-fav{position:absolute;top:1px;left:3px;font-size:11px;color:#d9483b}
.cw-bar{display:flex;gap:4px;flex-wrap:wrap;margin:6px 0}.cw-bar input,.cw-bar select{font:inherit;font-size:12px;border:2px solid #2a2733;padding:4px;min-width:0;flex:1 1 84px;background:#fff;color:#2a2733;border-radius:0}
.cw-chips{display:flex;gap:4px;overflow-x:auto;padding:2px 0 6px;scrollbar-width:none}.cw-chips button{flex:none;font:inherit;font-size:11px;padding:3px 7px;border:2px solid #2a2733;background:#fffdf4;color:#2a2733;cursor:pointer}.cw-chips button.on{background:#2a2733;color:#fffdf4}
.cw-top{display:flex;gap:10px;align-items:center;margin-bottom:6px}.cw-top>div{min-width:0;font-size:12px}.cw-top b{font-size:14px}
.cw-more{grid-column:1/-1;font:inherit;font-size:12px;padding:8px;border:2px dashed #2a2733;background:none;color:#2a2733}
.cw-stage{display:flex;flex-direction:column;align-items:center;cursor:pointer;background:#e9e2d2;border:2px solid #2a2733;padding:4px 10px}
.cw-row{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.cw-row button{flex:1 1 auto}
.cw-note{font-size:12px;opacity:.78;margin:6px 0}
.cw-line{display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px dashed #2a273340;font-size:12px}.cw-line span{flex:1;min-width:0}.cw-line button{flex:none}
`;
let cssDone = false;
export function injectCss() { if (cssDone || typeof document === 'undefined') return; cssDone = true; document.head.append(el('style', { text: CSS })); }

// crop [x0, y0, w, h] around the feet anchor
const CROP = { top: [-9, -25, 18, 18], outer: [-9, -25, 18, 22], dress: [-9, -25, 18, 26], bottom: [-9, -13, 18, 16], shoes: [-8, -8, 16, 11], hat: [-9, -36, 18, 18], neck: [-9, -25, 18, 16], glasses: [-8, -32, 16, 14], earring: [-8, -32, 16, 14],
  bag: [-10, -22, 20, 22], belt: [-9, -19, 18, 14], gloves: [-10, -19, 20, 16], socks: [-8, -8, 16, 11], tights: [-9, -13, 18, 16], watch: [-10, -19, 20, 16], full: [-11, -35, 22, 38] };
const cache = new Map();
function sprite(spec, pose) { const A = charArt(); return toSprite(render(A.CHAR_SB, () => A.drawChar(spec, pose || { dir: 0 }), null, 1)); }
function cut(s, crop) { const [x0, y0, w, h] = crop, c = document.createElement('canvas'); c.width = w; c.height = h; if (s) c.getContext('2d').drawImage(s.c, -(x0 - s.x), -(y0 - s.y)); return c; }
/** cached source canvas of a piece */
export function thumbSrc(it) {
  let c = cache.get(it.id); if (c) return c;
  try { c = cut(sprite(previewSpec(it)), CROP[it.slot === 'acc' ? it.kind : it.slot] || CROP.full); } catch (e) { c = document.createElement('canvas'); c.width = c.height = 16; }
  cache.set(it.id, c); return c;
}
export function thumb(it, scale = 3) {
  const src = thumbSrc(it), c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); c.className = 'pix';
  c.style.cssText = `width:${src.width * scale}px;height:${src.height * scale}px;image-rendering:pixelated;flex:none`; return c;
}
/** thumbnail of any spec (sets, looks, hairstyles): region 'full' | 'head' */
export function specThumb(spec, region = 'full', scale = 2) {
  const src = cut(sprite(spec), region === 'head' ? [-8, -34, 16, 17] : CROP.full); src.className = 'pix'; src.style.cssText = `width:${src.width * scale}px;height:${src.height * scale}px;image-rendering:pixelated;flex:none`; return src;
}
export function big(spec, o = {}) {
  const scale = o.scale || 6, c = cut(sprite(spec, { anim: o.anim || 'stand', frame: o.frame || 0, dir: o.dir || 0 }), [-13, -35, 26, 39]); c.className = 'pix';
  c.style.cssText = `width:${26 * scale}px;height:${39 * scale}px;image-rendering:pixelated;flex:none`; return c;
}
/** a tap-to-turn mirror element; mirror.set(spec) redraws */
export function stage(spec, scale = 6) {
  injectCss(); let dir = 0, cur = spec; const box = el('div.cw-stage', { title: 'Tap to turn', onclick: () => { dir = (dir + 1) % 4; draw(); } });
  const draw = () => { box.textContent = ''; box.append(big(cur, { scale, dir })); };
  draw(); box.set = s => { cur = s; draw(); }; return box;
}

export function grid(list, o = {}) {
  injectCss(); const g = el('div.cw-grid'), page = o.page || 36; let n = 0, more = null, io = null;
  if (!list.length) { g.append(el('p.cw-note', { style: { gridColumn: '1/-1' }, text: o.empty || 'Nothing here.' })); return g; }
  const add = () => {
    if (more) more.remove(); const end = Math.min(list.length, n + page), frag = document.createDocumentFragment();
    for (; n < end; n++) {
      const it = list[n], d = (o.cell && o.cell(it)) || {}, c = el('button.cw-cell' + (d.cls ? '.' + d.cls : ''), { 'aria-label': it.name });
      c.append(thumb(it, 3), el('b', { text: it.name })); if (d.sub) c.append(el('small', { text: d.sub })); if (d.tag) c.append(el('span.cw-tag' + (d.tagCls ? '.' + d.tagCls : ''), { text: d.tag })); if (d.fav) c.append(el('span.cw-fav', { text: '♥' }));
      c.addEventListener('click', () => o.onPick && o.onPick(it, c)); frag.append(c);
    }
    g.append(frag);
    if (n < list.length) { more = el('button.cw-more', { text: `Show more (${list.length - n} left)`, onclick: add }); g.append(more); if (io) io.observe(more); }
  };
  if (typeof IntersectionObserver !== 'undefined') io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.unobserve(more); add(); } }, { rootMargin: '300px' });
  add(); return g;
}

const SLOT_CHIPS = [['', 'All'], ['top', 'Tops'], ['bottom', 'Bottoms'], ['dress', 'Dresses'], ['outer', 'Outerwear'], ['shoes', 'Shoes'], ['hat', 'Hats'], ['acc', 'Accessories']];
export function filterBar(st, onChange, o = {}) {
  injectCss(); const wrap = el('div'), chips = el('div.cw-chips');
  const slots = o.slots || SLOT_CHIPS, drawChips = () => { chips.textContent = ''; for (const [k, name] of slots) chips.append(el('button' + ((st.slot || '') === k ? '.on' : ''), { text: name, onclick: () => { st.slot = k; drawChips(); onChange(); } })); if (o.fav !== false) chips.append(el('button' + (st.fav ? '.on' : ''), { text: '♥ Favourites', onclick: () => { st.fav = !st.fav; drawChips(); onChange(); } })); };
  drawChips();
  const q = el('input', { type: 'search', placeholder: 'Search name, brand, colour...', value: st.q || '', 'aria-label': 'Search clothes' }); let tm = 0;
  q.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { st.q = q.value; onChange(); }, 220); }); q.addEventListener('keydown', e => e.stopPropagation());
  const sel = (key, opts, label) => { const s = el('select', { 'aria-label': label }); for (const [v, t] of opts) s.append(el('option', { value: v, text: t, selected: (st[key] || '') === v ? '' : undefined })); s.addEventListener('change', () => { st[key] = s.value; onChange(); }); return s; };
  const bar = el('div.cw-bar', null, q, sel('style', [['', 'Any style']].concat((o.styles || STYLES).map(s => [s, s[0].toUpperCase() + s.slice(1)])), 'Style'));
  if (o.brands !== false) bar.append(sel('brand', [['', 'Any brand']].concat(Object.keys(BRANDS).map(b => [b, BRANDS[b].name])), 'Brand'));
  bar.append(sel('sort', o.sorts || [['', 'Sort: default'], ['price', 'Price: low first'], ['price-', 'Price: high first'], ['warm', 'Warmest first'], ['name', 'Name']], 'Sort'));
  wrap.append(chips, bar); return wrap;
}
const COLOR_WORDS = [['red', 0], ['orange', 30], ['yellow', 52], ['green', 120], ['teal', 172], ['blue', 215], ['purple', 270], ['pink', 330]];
function colorWord(hex) { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 28) return mx > 200 ? 'white' : mx < 80 ? 'black' : 'grey'; if (mx < 130 && r > b) return 'brown';
  let h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; h = (h * 60 + 360) % 360; let best = 'red', bd = 999; for (const [w, a] of COLOR_WORDS) { const d = Math.min(Math.abs(h - a), 360 - Math.abs(h - a)); if (d < bd) { bd = d; best = w; } } return best; }
const hay = new Map();
const text = it => { let t = hay.get(it.id); if (!t) { t = (it.name + ' ' + ((BRANDS[it.brand] || {}).name || '') + ' ' + it.styles.join(' ') + ' ' + (it.shape || '') + ' ' + (it.kind || '') + ' ' + (SLOT_NAME[it.slot] || '') + ' ' + (it.pat || '') + ' ' + colorWord(it.c)).toLowerCase(); hay.set(it.id, t); } return t; };
export function applyFilter(list, st, o = {}) {
  const words = String(st.q || '').toLowerCase().split(/\s+/).filter(Boolean);
  let out = list.filter(it => (!st.slot || it.slot === st.slot) && (!st.style || it.styles.includes(st.style)) && (!st.brand || it.brand === st.brand) && (!st.fav || (o.isFav && o.isFav(it.id))) && (!words.length || words.every(w => text(it).includes(w))));
  const s = st.sort; if (s === 'price') out = out.slice().sort((a, b) => a.price - b.price); else if (s === 'price-') out = out.slice().sort((a, b) => b.price - a.price); else if (s === 'warm') out = out.slice().sort((a, b) => b.warmth - a.warmth); else if (s === 'name') out = out.slice().sort((a, b) => a.name.localeCompare(b.name)); else if (o.order) out = out.slice().sort(o.order);
  return out;
}
