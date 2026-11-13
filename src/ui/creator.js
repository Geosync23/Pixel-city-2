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
const CROPS = { head: [-6, -24, 12, 11], torso: [-7, -17, 14, 12], legs: [-6, -10, 12, 11], body: [-8, -25, 16, 27], stage: [-12, -27, 24, 30] };
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

  return new Promise(resolve => {
    if (pause) G.modal++;
    let done = false;
    const finish = v => { if (done) return; done = true; if (pause) G.modal--; G.off('frame', tick); removeEventListener('resize', fit); removeEventListener('keydown', onKey, true); wrap.classList.add('out'); setTimeout(() => wrap.remove(), 180); resolve(v); };

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
      const g = cv.getContext('2d'); g.clearRect(0, 0, w, h); g.drawImage(s.c, -(x0 - s.x), -(y0 - s.y));
    }
    function fit() {
      if (!cv.width) return; const r = stage.getBoundingClientRect(); if (!r.height) return;
      scale = Math.max(2, Math.min(10, Math.floor(Math.min((r.height - 6) / cv.height, (r.width - 60) / cv.width))));
      cv.style.width = cv.width * scale + 'px'; cv.style.height = cv.height * scale + 'px';
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
        { type: 'cy', label: 'Style', key: 'hair', list: list(A, 'HAIRS'), crop: 'head' },
        { type: 'sw', label: 'Colour', key: 'hairColor', list: list(A, 'HAIR_COLORS') },
        { type: 'cy', label: 'Beard', key: 'beard', list: [false, true], crop: 'head', names: ['None', 'Beard'] },
      ] },
      { id: 'clothes', label: 'Clothes', rows: [
        { type: 'cy', label: 'Top', key: 'top', list: list(A, 'TOPS'), crop: 'torso' },
        { type: 'sw', label: 'Top colour', key: 'topColor', list: list(A, 'CLOTH_COLORS') },
        { type: 'cy', label: 'Bottom', key: 'bottom', list: list(A, 'BOTTOMS'), crop: 'legs', hide: () => spec.top === 'dress' },
        { type: 'sw', label: 'Bottom colour', key: 'bottomColor', list: uniq(list(A, 'PANTS_COLORS').concat(list(A, 'CLOTH_COLORS'))), hide: () => spec.top === 'dress' },
        { type: 'sw', label: 'Shoes', key: 'shoes', list: list(A, 'SHOE_COLORS') },
      ] },
      { id: 'extras', label: 'Extras', rows: [
        { type: 'cy', label: 'Hat', key: 'hat', list: list(A, 'HATS'), crop: 'head', onset: v => { if (v && !spec.hatColor) spec.hatColor = list(A, 'CLOTH_COLORS')[9] || '#2f3f72'; } },
        { type: 'sw', label: 'Hat colour', key: 'hatColor', list: list(A, 'CLOTH_COLORS'), hide: () => !spec.hat || spec.hat === 'sunhat' || spec.hat === 'hardhat' },
        { type: 'cy', label: 'Glasses', key: 'glasses', list: [false, true, 'sun'], crop: 'head', names: ['None', 'Specs', 'Shades'] },
        { type: 'cy', label: 'Bag', key: 'bag', list: list(A, 'BAGS'), crop: 'body' },
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
      for (const row of t.rows) { const r = row.type === 'sw' ? swatchRow(row) : cyclerRow(row); rowEls.push(r); opts_.append(r.el); }
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
      const n = row.list.length, ix = () => Math.max(0, row.list.findIndex(v => eq(v, spec[row.key])));
      const go = d => { const v = row.list[(ix() + d + n) % n]; if (row.onset) row.onset(v); set(row.key, v); };
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
      el('div.cc-head', null, el('span.cc-title', { text: title }), mode === 'new' ? el('span.cc-step', { text: 'Step 1 of 2' }) : null),
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
