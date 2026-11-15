// Character creator (new game + wardrobe/mirror reuse). Styles: src/ui/title.css.
//
// API
//   openCreator({ mode: 'new'|'edit', spec?, name?, pause? }) -> Promise<{ name, spec } | null>  (mode 'new')
//                                                             -> Promise<spec | null>             (mode 'edit')
//     'new'  : full-screen panel used by the title flow (no pause; the city keeps animating behind). Shows name + presets.
//     'edit' : modal over the running game (pauses with G.modal while open); no name field. Resolves to the new spec
//              (a fresh object) or null when cancelled. The caller applies it: G.player.setSpec(spec); G.state.player.spec = spec.
//   NAMES    : the default-name pool;  randomName()
import { G } from '../core/game.js';
import { charArt } from '../core/char.js';
import { render } from '../engine/raster.js';
import { toSprite } from '../engine/sprites.js';
import { el, root } from './kit.js';
import { HAIR_STYLES, HAIR_DYES } from '../data/clothes.js';

/* ---------- the STARTER SET: what a newcomer can arrive in. Everything else is bought in town (clothes shops, barbers, salons). ---------- */
const O = (name, o) => Object.assign({ name }, o);
/** 16 starting outfits (the first eight are what the presets wear) */
export const STARTER_OUTFITS = [
  O('Red hoodie & jeans', { top: 'hoodie', topColor: '#d9483b', bottom: 'jeans', bottomColor: '#4a6fa8', shoes: '#f0ece4' }),
  O('Mustard jacket & skirt', { top: 'jacket', topColor: '#e8b83a', bottom: 'skirt', bottomColor: '#33303f', shoes: '#2f2c3a' }),
  O('Teal varsity & cargos', { top: 'varsity', topColor: '#2f9a94', bottom: 'cargo', bottomColor: '#c8ad7a', shoes: '#f0ece4' }),
  O('Purple sweater & leggings', { top: 'sweater', topColor: '#7a55c8', bottom: 'leggings', bottomColor: '#33303f', shoes: '#d04a3a' }),
  O('Green flannel & jeans', { top: 'flannel', topColor: '#4fa860', bottom: 'jeans', bottomColor: '#34507f', shoes: '#6a4428' }),
  O('Coral sundress', { top: 'dress', topColor: '#f07a5a', bottom: 'skirt', bottomColor: '#f07a5a', shoes: '#f0ece4' }),
  O('Navy suit', { top: 'suit', topColor: '#2f3f72', bottom: 'slacks', bottomColor: '#2b3a68', shoes: '#2f2c3a' }),
  O('Cream cardigan & long skirt', { top: 'cardigan', topColor: '#ead9b8', bottom: 'longskirt', bottomColor: '#34507f', shoes: '#c8a070' }),
  O('White tee & jeans', { top: 'tee', topColor: '#f4f0e8', bottom: 'jeans', bottomColor: '#4a6fa8', shoes: '#f0ece4' }),
  O('Striped tee & shorts', { top: 'stripe', topColor: '#3b6fd0', bottom: 'shorts', bottomColor: '#c8ad7a', shoes: '#f0ece4' }),
  O('Blue polo & slacks', { top: 'polo', topColor: '#5ab0e0', bottom: 'slacks', bottomColor: '#4a4a58', shoes: '#6a4428' }),
  O('Graphic tee & sweats', { top: 'graphic', topColor: '#33303f', bottom: 'sweats', bottomColor: '#9aa0a8', shoes: '#d04a3a', accent: '#f0c040' }),
  O('Long sleeve & overalls', { top: 'long', topColor: '#f09a3a', bottom: 'overalls', bottomColor: '#4a6fa8', shoes: '#6a4428' }),
  O('Tank top & leggings', { top: 'tank', topColor: '#f08ab0', bottom: 'leggings', bottomColor: '#2f3f72', shoes: '#f0ece4' }),
  O('Olive coat & jeans', { top: 'coat', topColor: '#6f7a48', bottom: 'jeans', bottomColor: '#34507f', shoes: '#6a4428' }),
  O('Pink sweater & skirt', { top: 'sweater', topColor: '#f08ab0', bottom: 'skirt', bottomColor: '#4a4a58', shoes: '#2f2c3a' }),
];
const WEAR_FIELDS = ['top', 'topColor', 'bottom', 'bottomColor', 'shoes', 'accent', 'topPat', 'topColor2', 'onepiece', 'outer', 'outerColor', 'outerPat', 'outerColor2', 'botPat', 'bottomColor2', 'shoeType', 'shoeColor2', 'innerColor'];
const PRESET_HAIR = ['sidepart', 'wavy', 'locs', 'bob', 'curly', 'bun', 'hightop', 'hijab'];
/** hairstyles offered at the start: the catalogue's `starter` rows plus what the presets wear */
export const starterHairs = () => [...new Set(HAIR_STYLES.filter(h => h.starter).map(h => h.id).concat(PRESET_HAIR))];
export const STARTER_HAIR_COLORS = HAIR_DYES.filter(d => d[2]).map(d => d[0]).concat(['#f07aa8', '#3fb8a8']);
const STARTER_HATS = [null, 'cap', 'beanie'], STARTER_BAGS = [null, 'backpack', 'tote', 'messenger'];
function wearOutfit(spec, o) { for (const k of WEAR_FIELDS) delete spec[k]; for (const k in o) if (k !== 'name') spec[k] = o[k]; return spec; }
const outfitIx = spec => STARTER_OUTFITS.findIndex(o => o.top === spec.top && o.bottom === spec.bottom && String(o.topColor).toLowerCase() === String(spec.topColor).toLowerCase() && String(o.bottomColor).toLowerCase() === String(spec.bottomColor).toLowerCase());

export const NAMES = ['Alex', 'Sam', 'Maya', 'Theo', 'Juno', 'Aiko', 'Dev', 'Noor', 'Priya', 'Mateo', 'Amara', 'Kenji', 'Lucía', 'Omar',
  'Zoe', 'Malik', 'Inés', 'Hana', 'Kofi', 'Rosa', 'Eli', 'Yara', 'Diego', 'Mei', 'Tariq', 'Freya', 'Leon', 'Ada', 'Nia', 'Ravi', 'Sofia',
  'Jin', 'Kai', 'Ana', 'Ezra', 'Lila', 'Marcus', 'Imani', 'Quinn', 'Rafael', 'Siobhan', 'Tomás', 'Wren', 'Yusuf', 'Bao', 'Dakota'];
export const randomName = () => NAMES[Math.floor(Math.random() * NAMES.length)];

const PRETTY = {
  null: 'None', avg: 'Average', tee: 'T-shirt', stripe: 'Striped tee', long: 'Long sleeve', tank: 'Tank top', sidepart: 'Side part',
  longskirt: 'Long skirt', sweats: 'Sweatpants', hardhat: 'Hard hat', flatcap: 'Flat cap', sunhat: 'Sun hat', balding: 'Thinning',
  grocery: 'Grocery bag', ponytail: 'Ponytail', pigtails: 'Pigtails', puffer: 'Puffer', sun: 'Shades', true: 'Specs', false: 'None',
};
const pretty = v => PRETTY[String(v)] || (String(v).charAt(0).toUpperCase() + String(v).slice(1));
const FALLBACK = {
  SKINS: ['#ffe0c4', '#f7cfa8', '#eab98f', '#d9a074', '#c08457', '#a56a43', '#84502f', '#5f3a22'],
  HAIR_COLORS: ['#2b2433', '#4a3022', '#6e4428', '#a8452a', '#e6c36a', '#a9a9b4'],
  CLOTH_COLORS: ['#d9483b', '#f09a3a', '#e8b83a', '#4fa860', '#5ab0e0', '#3b6fd0', '#7a55c8', '#f4f0e8', '#33303f'],
  PANTS_COLORS: ['#4a6fa8', '#34507f', '#33303f', '#c8ad7a', '#7a5238'],
  SHOE_COLORS: ['#f0ece4', '#2f2c3a', '#6a4428', '#d04a3a'], BAG_COLORS: ['#7a5238', '#d9483b', '#3b6fd0', '#33303f'],
  HAIRS: ['short'], TOPS: ['tee'], BOTTOMS: ['jeans'], HATS: [null], BAGS: [null], BUILDS: ['slim', 'avg', 'broad'], HEIGHTS: ['short', 'avg', 'tall'],
};
const list = (A, k) => (Array.isArray(A[k]) && A[k].length ? A[k] : FALLBACK[k]);

/* ---------- sprite helpers ---------- */
function charCanvas(spec, pose) {
  const A = charArt(), sb = A.CHAR_SB || [-16, -36, 16, 12];
  try { const r = render(sb, () => A.drawChar(spec, pose), null, 1); const s = toSprite(r); return s; } catch (e) { console.error(e); return null; }
}
// crop regions relative to the feet anchor: [x0, y0, w, h]
const CROPS = { head: [-6, -24, 12, 11], torso: [-7, -17, 14, 12], legs: [-6, -10, 12, 11], body: [-8, -25, 16, 27], stage: [-12, -26, 24, 29] };
function thumb(spec, region, scale = 3) {
  const s = charCanvas(spec, { anim: 'stand', frame: 0, dir: 0 }); const [x0, y0, w, h] = CROPS[region] || CROPS.body;
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.className = 'pix';
  if (s) c.getContext('2d').drawImage(s.c, -(x0 - s.x), -(y0 - s.y));
  c.style.width = w * scale + 'px'; c.style.height = h * scale + 'px'; return c;
}
const clone = s => JSON.parse(JSON.stringify(s || {}));

function cleanRandom() {
  const A = charArt(); const s = A.randomSpec(Math.random, { age: 'adult', season: 1 }); delete s.outfit; delete s.scarf; s.age = 'adult';
  if (s.hat && !s.hatColor) s.hatColor = list(A, 'CLOTH_COLORS')[0];
  const R = a => a[Math.floor(Math.random() * a.length)]; wearOutfit(s, R(STARTER_OUTFITS)); const hs = starterHairs(); if (!hs.includes(s.hair)) s.hair = R(hs.filter(h => h !== 'hijab')); if (!STARTER_HATS.includes(s.hat || null)) s.hat = null; if (!STARTER_BAGS.includes(s.bag || null)) s.bag = null; if (!STARTER_HAIR_COLORS.includes(s.hairColor)) s.hairColor = R(STARTER_HAIR_COLORS.slice(0, 8)); if (s.beard && s.beard !== true) s.beard = true;
  return s;
}

/* ---------- the creator ---------- */
export function openCreator(opts = {}) {
  const A = charArt(), mode = opts.mode === 'edit' ? 'edit' : 'new';
  const presets = (A.PLAYER_PRESETS || []).filter(Boolean);
  let spec = clone(opts.spec || (mode === 'edit' ? G.state.player.spec : null) || presets[0] || cleanRandom());
  delete spec.name;
  let name = opts.name || randomName(), nameTyped = !!opts.name, dir = 0, presetIx = -1, flourish = 0;
  const pause = mode === 'edit' && opts.pause !== false;

  const hairList = () => { const k = mode === 'edit' && G.hair && G.hair.known ? G.hair.known() : starterHairs(); return k.includes(spec.hair) ? k : k.concat([spec.hair]); };
  G.emit('creator:open', { mode, spec });
  return new Promise(resolve => {
    if (pause) G.modal++;
    let done = false;
    const finish = v => { if (done) return; done = true; if (pause) G.modal--; G.off('frame', tick); removeEventListener('resize', fit); removeEventListener('keydown', onKey, true); wrap.classList.add('out'); setTimeout(() => wrap.remove(), 180); G.emit('creator:done', { mode, result: v }); resolve(v); };

    /* preview */
    const stage = el('div.cc-stage', { onclick: () => rotate(1), title: 'Tap to turn' });
    const cv = el('canvas.cc-cv.pix'); stage.append(el('div.cc-floor'), cv);
    const rotBtn = el('button.cc-round', { 'aria-label': 'Turn around', title: 'Turn around', onclick: e => { e.stopPropagation(); rotate(1); } }, el('span', { text: '↻' }));
    const diceBtn = el('button.cc-round.cc-dice', { 'aria-label': 'Randomise', title: 'Randomise', onclick: e => { e.stopPropagation(); randomise(); } }, dieIcon());
    stage.append(el('div.cc-stage-btns', null, rotBtn, diceBtn));
    let cache = new Map(), lastKey = '', anim = 'stand', animT = 0, scale = 6;
    function rotate(d) { dir = (dir + d + 4) % 4; flourish = 0; draw(true); }
    function frameFor() {
      const AN = A.ANIMS || { stand: 1 };
      if (flourish > 0 && AN.wave) return ['wave', Math.floor((1.6 - flourish) * 6) % AN.wave];
      const cyc = animT % 7; // 3s idle, 4s walking on the spot
      if (cyc < 3 || !AN.walk) return ['stand', Math.floor(animT * 1.2) % (AN.stand || 1)];
      return ['walk', Math.floor(animT * 7) % AN.walk];
    }
    function draw(force) {
      const [a, f] = frameFor(), key = a + f + dir;
      if (!force && key === lastKey) return; lastKey = key;
      let s = cache.get(key); if (!s) { s = charCanvas(spec, { anim: a, frame: f, dir }); cache.set(key, s); }
      if (!s) return;
      const [x0, y0, w, h] = CROPS.stage;
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; fit(); }
      const g = cv.getContext('2d'); g.clearRect(0, 0, w, h);
      /* soft pixel shadow on the floor under the feet (the sprite anchor is at -y0 rows from the top) */
      g.fillStyle = '#5f9a50'; g.fillRect(-x0 - 6, -y0 - 1, 12, 3); g.fillRect(-x0 - 4, -y0 - 2, 8, 5); g.fillStyle = '#6aa85a'; g.fillRect(-x0 - 7, -y0, 14, 1);
      g.drawImage(s.c, -(x0 - s.x), -(y0 - s.y));
    }
    function fit() {
      if (!cv.width) return; const r = stage.getBoundingClientRect(); if (!r.height) return;
      /* whole number of CSS px per art px (so it is a whole number of device px too: crisp), as large as the box allows */
      scale = Math.max(2, Math.min(12, Math.floor(Math.min((r.height - 4) / cv.height, (r.width - 110) / cv.width))));
      cv.style.width = cv.width * scale + 'px'; cv.style.height = cv.height * scale + 'px';
      /* stand on the floor band (bottom 20% of the stage): feet about a third of the way down the band */
      const below = (cv.height + CROPS.stage[1]) * scale, feet = Math.round(r.height * .2 * .62);
      cv.style.position = 'absolute'; cv.style.left = Math.round((r.width - cv.width * scale) / 2) + 'px'; cv.style.bottom = Math.round(feet - below) + 'px'; cv.style.margin = '0';
    }
    const tick = dt => { animT += dt; if (flourish > 0) flourish -= dt; draw(false); };
    const changed = (wave) => { cache = new Map(); lastKey = ''; if (wave) flourish = 1.6; draw(true); refreshRows(); };

    /* name + presets */
    const nameIn = el('input.cc-name', { type: 'text', maxlength: 14, value: name, 'aria-label': 'Name', spellcheck: 'false', autocomplete: 'off' });
    nameIn.addEventListener('input', () => { name = nameIn.value.slice(0, 14); nameTyped = true; });
    nameIn.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') nameIn.blur(); });
    const nameRow = mode === 'new' && el('div.cc-namerow', null, el('label.cc-lab', { text: 'Name' }), nameIn,
      el('button.cc-mini', { 'aria-label': 'Random name', title: 'Random name', onclick: () => { name = randomName(); nameIn.value = name; nameTyped = true; } }, dieIcon(true)));
    const presetBox = el('div.cc-presets');
    function buildPresets() {
      presetBox.textContent = '';
      presets.forEach((p, i) => presetBox.append(el('button.cc-preset' + (i === presetIx ? '.on' : ''), {
        'aria-label': 'Preset ' + (p.name || i + 1), title: p.name || '',
        onclick: () => { presetIx = i; spec = clone(p); delete spec.name; if (!nameTyped && p.name && mode === 'new') { name = p.name; nameIn.value = name; } buildPresets(); changed(true); },
      }, thumb(p, 'head', 3), el('span', { text: p.name || '#' + (i + 1) }))));
    }
    buildPresets();

    function randomise() { spec = cleanRandom(); presetIx = -1; buildPresets(); diceBtn.classList.remove('roll'); void diceBtn.offsetWidth; diceBtn.classList.add('roll'); changed(true); }

    /* option rows */
    const set = (k, v) => { spec[k] = v; presetIx = -1; buildPresets(); changed(false); };
    const TABS = [
      { id: 'body', label: 'Body', rows: [
        { type: 'sw', label: 'Skin', key: 'skin', list: list(A, 'SKINS') },
        { type: 'cy', label: 'Build', key: 'build', list: list(A, 'BUILDS'), crop: 'body' },
        { type: 'cy', label: 'Height', key: 'height', list: list(A, 'HEIGHTS'), crop: 'body' },
      ] },
      { id: 'hair', label: 'Hair', rows: [
        { type: 'cy', label: 'Style', key: 'hair', list: hairList(), crop: 'head', names: hairList().map(id => (HAIR_STYLES.find(h => h.id === id) || { name: pretty(id) }).name) },
        { type: 'sw', label: 'Colour', key: 'hairColor', list: STARTER_HAIR_COLORS.includes(spec.hairColor) ? STARTER_HAIR_COLORS : STARTER_HAIR_COLORS.concat([spec.hairColor]), hide: () => mode === 'edit' },
        { type: 'cy', label: 'Beard', key: 'beard', list: [false, true, 'stubble'], crop: 'head', names: ['None', 'Beard', 'Stubble'], hide: () => mode === 'edit' },
        { type: 'note', text: mode === 'edit' ? 'Styles you have worn before. New cuts, colours and beards: barbers, salons and the colour bar.' : 'A starter set. Barbers and salons in town do dozens more, and every colour.' },
      ] },
      { id: 'clothes', label: 'Clothes', rows: [
        { type: 'cy', label: mode === 'edit' ? 'Travel clothes' : 'Outfit', key: 'top', list: STARTER_OUTFITS, crop: 'body', names: STARTER_OUTFITS.map(o => o.name), cur: () => Math.max(0, outfitIx(spec)), apply: o => wearOutfit(spec, o) },
        { type: 'note', text: 'Sixteen outfits to arrive in. The shops in town sell more than a thousand pieces: tops, coats, shoes, hats, the lot.' },
      ] },
      { id: 'extras', label: 'Extras', rows: [
        { type: 'cy', label: 'Hat', key: 'hat', list: STARTER_HATS.includes(spec.hat || null) ? STARTER_HATS : STARTER_HATS.concat([spec.hat]), crop: 'head', onset: v => { if (v && !spec.hatColor) spec.hatColor = list(A, 'CLOTH_COLORS')[9] || '#2f3f72'; } },
        { type: 'sw', label: 'Hat colour', key: 'hatColor', list: list(A, 'CLOTH_COLORS'), hide: () => !spec.hat || spec.hat === 'sunhat' || spec.hat === 'hardhat' },
        { type: 'cy', label: 'Glasses', key: 'glasses', list: [false, true], crop: 'head', names: ['None', 'Specs'] },
        { type: 'cy', label: 'Bag', key: 'bag', list: STARTER_BAGS.includes(spec.bag || null) ? STARTER_BAGS : STARTER_BAGS.concat([spec.bag]), crop: 'body' },
        { type: 'sw', label: 'Bag colour', key: 'bagColor', list: list(A, 'BAG_COLORS'), hide: () => !spec.bag },
      ] },
    ];
    let tab = 'body';
    const tabBar = el('div.cc-tabs', { role: 'tablist' }), opts_ = el('div.cc-opts');
    const rowEls = [];
    function buildTab() {
      tabBar.textContent = ''; opts_.textContent = ''; rowEls.length = 0;
      for (const t of TABS) tabBar.append(el('button.cc-tab' + (t.id === tab ? '.on' : ''), { role: 'tab', 'aria-selected': t.id === tab ? 'true' : 'false', text: t.label, onclick: () => { tab = t.id; buildTab(); opts_.scrollTop = 0; } }));
      const t = TABS.find(q => q.id === tab);
      for (const row of t.rows) { if (row.type === 'note') { opts_.append(el('p', { style: { fontSize: '12px', opacity: .75, margin: '6px 4px' }, text: row.text })); continue; } const r = row.type === 'sw' ? swatchRow(row) : cyclerRow(row); rowEls.push(r); opts_.append(r.el); }
      refreshRows();
    }
    function refreshRows() { for (const r of rowEls) r.refresh(); }
    const eq = (a, b) => (a === b) || (a == null && b == null) || (a === false && !b) || (String(a).toLowerCase() === String(b).toLowerCase());
    function swatchRow(row) {
      const box = el('div.cc-sws'), btns = row.list.map(c => {
        const b = el('button.cc-sw', { 'aria-label': row.label + ' ' + c, style: { background: c }, onclick: () => set(row.key, c) }); box.append(b); return b;
      });
      const e = el('div.cc-row', null, el('div.cc-lab', { text: row.label }), box);
      return { el: e, refresh() { e.style.display = row.hide && row.hide() ? 'none' : ''; btns.forEach((b, i) => b.classList.toggle('on', eq(row.list[i], spec[row.key]))); } };
    }
    function cyclerRow(row) {
      const n = row.list.length, ix = () => (row.cur ? row.cur() : Math.max(0, row.list.findIndex(v => eq(v, spec[row.key]))));
      const go = d => { const v = row.list[(ix() + d + n) % n]; if (row.apply) { row.apply(v); presetIx = -1; buildPresets(); changed(false); return; } if (row.onset) row.onset(v); set(row.key, v); };
      const pic = el('div.cc-cy-pic'), lab = el('span.cc-cy-name'), cnt = el('span.cc-cy-n');
      const e = el('div.cc-row', null, el('div.cc-lab', { text: row.label }), el('div.cc-cy',
        null, el('button.cc-arrow', { 'aria-label': 'Previous ' + row.label, text: '◀', onclick: () => go(-1) }),
        el('div.cc-cy-mid', null, pic, el('div.cc-cy-txt', null, lab, cnt)),
        el('button.cc-arrow', { 'aria-label': 'Next ' + row.label, text: '▶', onclick: () => go(1) })));
      return { el: e, refresh() {
        e.style.display = row.hide && row.hide() ? 'none' : ''; const i = ix(), v = row.list[i];
        lab.textContent = row.names ? row.names[i] : pretty(v); cnt.textContent = (i + 1) + '/' + n;
        pic.textContent = ''; pic.append(thumb(spec, row.crop || 'body', row.crop === 'body' ? 2 : 3));
      } };
    }
    buildTab();

    /* layout */
    const title = mode === 'new' ? 'Who are you?' : 'Change your look';
    const backBtn = el('button.cc-back', { onclick: () => finish(null) }, mode === 'new' ? '◀ Back' : 'Cancel');
    const okBtn = el('button.cc-ok', { onclick: () => {
      const out = clone(spec); out._v = ((G.state.player.spec && G.state.player.spec._v) || 0) + 1;
      if (mode === 'new') { const nm = (name || '').trim() || randomName(); finish({ name: nm, spec: out }); } else finish(out);
    } }, mode === 'new' ? 'Next ▶' : 'Done');
    const left = el('div.cc-left', null, stage, nameRow, presets.length ? el('div.cc-presets-wrap', null, el('div.cc-lab', { text: 'Presets' }), presetBox) : null);
    const right = el('div.cc-right', null, tabBar, opts_);
    const panel = el('div.cc-panel.tt-pop', { role: 'dialog', 'aria-label': title },
      el('div.cc-head', null, el('span.cc-title', { text: title }), mode === 'new' ? el('span.cc-step', { text: 'Step 1 of 3' }) : null),
      el('div.cc-body', null, left, right), el('div.cc-foot', null, backBtn, el('div.cc-spacer'), okBtn));
    const wrap = el('div.cc-wrap' + (mode === 'edit' ? '.cc-modal' : ''), null, panel);
    (opts.parent || root()).append(wrap);
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); finish(null); } }
    addEventListener('keydown', onKey, true);
    addEventListener('resize', fit);
    G.on('frame', tick);
    draw(true); requestAnimationFrame(() => { fit(); draw(true); });
  });
}
function uniq(a) { return a.filter((v, i) => a.indexOf(v) === i); }

/** tiny pixel die (DOM canvas) */
export function dieIcon(small) {
  const c = document.createElement('canvas'); c.width = 9; c.height = 9; c.className = 'pix cc-die'; const g = c.getContext('2d');
  g.fillStyle = '#2a2733'; g.fillRect(1, 0, 7, 9); g.fillRect(0, 1, 9, 7); g.fillStyle = '#fffdf4'; g.fillRect(1, 1, 7, 7);
  g.fillStyle = '#e05a3a'; for (const [x, y] of [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]]) g.fillRect(x, y, 1, 1);
  const s = small ? 2 : 3; c.style.width = 9 * s + 'px'; c.style.height = 9 * s + 'px'; return c;
}
