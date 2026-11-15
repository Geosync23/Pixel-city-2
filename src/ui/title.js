// Title screen -> character creator -> home picker -> game start. Styles: src/ui/title.css.
//
// Shown at boot unless the URL has ?scene=... or ?skip (developers/tests drop straight into the game).
//   ?title=creator | ?title=homes   jump straight to that step (testing)
//
// EXPORTS
//   showTitle()            show the title screen (e.g. from the phone's menu). Resolves when the player leaves it.
//   isTitleOpen()          true while the title / creator / home picker is up (also G.onTitle).
//   (creator.js) openCreator({ mode: 'edit' }) -> Promise<spec|null>  for the wardrobe/mirror.
//
// EVENTS (emitted)
//   'title:show' / 'title:hide'     HUD modules may hide themselves while the title is up (also #wrap.on-title).
//   'game:new' ({ name, spec, homeId })   a new game was committed. An intro listener that takes over sets
//                                         G.introHandled = true synchronously; otherwise the player is dropped
//                                         at the city poi 'spawn:airport' (or the city spawn).
//   'game:start' ({ isNew })        the player is in control of a new or continued game.
//
// STATE written on New Game: the whole G.state is reset to fresh defaults (time 14:00 day 0, every G.stateDefaults
//   slice re-created, then 'load' is emitted so systems re-read their slices), then G.state.player.name / .spec and
//   G.state.home.id (defining the 'home' slice as { id } only if no other module owns it).
// While the title is open G.save() is a no-op, so the live city running behind it never overwrites the real save.
import { traitStep } from '../sim/traits.js';
import { G } from '../core/game.js';
import { ENV } from '../engine/raster.js';
import { el, root, modal } from './kit.js';
import { openCreator } from './creator.js';
import { charArt } from '../core/char.js';
import * as HOMES_MOD from '../data/homes.js';

export const order = 950;

const DISTRICTS = { oldtown: 'Old Town', harbor: 'Harborside', harborside: 'Harborside', arts: 'Arts Quarter', maplewood: 'Maplewood', downtown: 'Downtown', hillcrest: 'Hillcrest', railyard: 'Railyard', park: 'Central Park' };
const FALLBACK_HOMES = [
  { id: 'juniper', name: 'Juniper Court', district: 'oldtown', rentPerWeek: 160, blurb: 'Cobbles, brick and the best croissant in town downstairs.', pros: ['Cafes and shops a minute away', 'Grandma lives around the corner'], cons: ['Small windows'] },
  { id: 'saltbox', name: 'Saltbox Lofts', district: 'harbor', rentPerWeek: 150, blurb: 'Gulls for neighbours, sunrise for an alarm clock.', pros: ['Sea view', 'High ceilings'], cons: ['Groceries are a train ride away'] },
  { id: 'easel', name: 'The Easel House', district: 'arts', rentPerWeek: 170, blurb: 'Paint on the stairs, music through the floor.', pros: ['Cinema and library on your street', 'Your old friend works nearby'], cons: ['Highest starter rent'] },
  { id: 'birch', name: 'Birch Lane Flats', district: 'maplewood', rentPerWeek: 130, blurb: 'Leafy, quiet, friendly.', pros: ['Cheapest rent', 'Your sibling lives nearby'], cons: ['Long commute'] },
];
function starterHomes() {
  const H = Array.isArray(HOMES_MOD.HOMES) ? HOMES_MOD.HOMES.filter(h => h && h.id && h.kind === 'starter_studio') : [];
  return H.length ? H : FALLBACK_HOMES;
}

let BASE = null, open = false, wrap = null, realSave = null, myCut = null, myCam = null;
export const isTitleOpen = () => open;

export async function init(G_) {
  const q = G.query || new URLSearchParams(location.search);
  // core fields of a fresh game, captured before anything ticks
  BASE = JSON.parse(JSON.stringify({ t: G.state.t, speed: G.state.speed, weather: G.state.weather, player: G.state.player, flags: G.state.flags }));
  realSave = G.save; G.save = (...a) => (open ? null : realSave(...a));
  await injectCss();
  if (q.has('scene') || q.has('skip')) return;
  G.started = true;
  G.on('ready', () => {
    const step = q.get('title');
    showTitle().catch(e => console.error(e));
    if (step === 'creator' || step === 'homes') setTimeout(() => newGame(step), 0);
  });
}

function injectCss() {
  if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/title.css"]')) return Promise.resolve();
  return new Promise(res => { const l = el('link', { rel: 'stylesheet', href: 'src/ui/title.css' }); l.onload = l.onerror = () => res(); document.head.append(l); setTimeout(res, 1500); });
}

/* ---------- title camera ---------- */
function startPan() {
  const w = G.world, p = G.player; p.hidden = true; p.stop && p.stop();
  const pts = [];
  const pois = (w.pois || []).filter(o => o && isFinite(o.x) && isFinite(o.y));
  const nice = pois.filter(o => /landmark|view|park|plaza|station|square|lookout/i.test(String(o.type) + ' ' + String(o.id)));
  for (const o of (nice.length >= 2 ? nice : pois).slice(0, 5)) pts.push([o.x, o.y]);
  if (pts.length < 2) { const cx = p.x, cy = p.y; pts.length = 0; for (const [dx, dy] of [[-10, -6], [8, -8], [12, 6], [-6, 10]]) pts.push([cx + dx, cy + dy]); }
  const cl = (v, m) => Math.max(4, Math.min(m - 4, v)); for (const q of pts) { q[0] = cl(q[0], w.w); q[1] = cl(q[1], w.h); }
  // ordered loop; travel at ~1.1 units/s with eased segments
  let seg = 0, s = 0; const cam = { x: pts[0][0], y: pts[0][1], z: w.heightAt(pts[0][0], pts[0][1]) };
  const segLen = i => { const a = pts[i % pts.length], b = pts[(i + 1) % pts.length]; return Math.max(1, Math.hypot(b[0] - a[0], b[1] - a[1])); };
  const cut = { title: true, update(dt) {
    p.hidden = true; s += dt * 1.1 / segLen(seg); if (s >= 1) { s = 0; seg = (seg + 1) % pts.length; }
    const a = pts[seg], b = pts[(seg + 1) % pts.length], e = s * s * (3 - 2 * s);
    cam.x = a[0] + (b[0] - a[0]) * e; cam.y = a[1] + (b[1] - a[1]) * e; cam.z = G.world.heightAt(cam.x, cam.y);
  } };
  myCut = cut; myCam = cam; G.cutscene = cut; G.camTarget = cam; G.snapCam && G.snapCam();
}
function stopPan(unhide = true) {
  if (G.cutscene === myCut) G.cutscene = null; if (G.camTarget === myCam) G.camTarget = null; myCut = myCam = null;
  if (unhide && G.player) G.player.hidden = false;
}

/* ---------- title screen ---------- */
/** Show the title screen (resolves once the player has left it via Continue / New Game). */
export async function showTitle() {
  if (open) return; open = true; G.onTitle = true; G.emit('title:show');
  const wr = document.getElementById('wrap'); if (wr) wr.classList.add('on-title');
  if (!G.scene || G.scene.id !== 'city') await G.go('city', { fade: !!G.scene });
  startPan();
  return new Promise(res => { titleDone = res; buildTitle(); });
}
let titleDone = null;

function leafIcon(scale = 4) {
  // 15x14 pixel maple leaf: # outline, o leaf, v vein
  const M = ['.......#.......', '......#o#......', '..#..#ooo#..#..', '..##.#ovo#.##..', '..#o##ovo##o#..', '#.#oooovoooo#.#', '##oooovvvoooo##', '.#oovoovoovoo#.', '..#oooovoooo#..', '...##oovoo##...', '.....#ovo#.....', '......#v#......', '.......#.......', '.......#.......'];
  const c = document.createElement('canvas'); c.width = 15; c.height = 14; c.className = 'pix tt-leaf'; const g = c.getContext('2d');
  M.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = ch === '#' ? '#5a1e1a' : ch === 'v' ? '#a8321f' : (y < 5 || (x + y) % 7 === 0) ? '#f2803a' : '#e0502f'; g.fillRect(x, y, 1, 1); }));
  c.style.width = 15 * scale + 'px'; c.style.height = 14 * scale + 'px'; return c;
}

function buildTitle() {
  if (wrap) wrap.remove();
  const has = G.hasSave();
  const btns = el('div.tt-btns', null,
    has && el('button.tt-btn.tt-primary', { onclick: cont }, 'Continue'),
    el('button.tt-btn' + (has ? '' : '.tt-primary'), { onclick: () => newGame() }, 'New Game'),
    el('button.tt-btn.tt-quiet', { onclick: settings }, 'Settings'));
  [...btns.children].forEach((b, i) => b.style.setProperty('--d', (0.35 + i * 0.08) + 's'));
  wrap = el('div.tt-wrap', null,
    el('div.tt-center', null,
      el('div.tt-logo', null, leafIcon(5), el('h1.tt-word', null, el('span.tt-maple', { text: 'MAPLE' }), el('span.tt-bay', { text: 'BAY' }))),
      el('p.tt-tag', { text: 'A new city. A new key. A whole new life.' }),
      btns),
    el('div.tt-credits', { text: 'Maple Bay · a tiny city life sim · pixels drawn in code' }));
  root().append(wrap);
  const first = btns.querySelector('button'); if (first && matchMedia('(pointer:fine)').matches) first.focus({ preventScroll: true });
}

function hideTitleDom() { if (!wrap) return; const w = wrap; wrap = null; w.classList.add('out'); setTimeout(() => w.remove(), 220); }
function closeTitle() {
  open = false; G.onTitle = false; const wr = document.getElementById('wrap'); if (wr) wr.classList.remove('on-title');
  hideTitleDom(); G.emit('title:hide'); const d = titleDone; titleDone = null; if (d) d();
}

/* ---------- settings ---------- */
function settings() {
  const m = modal({ title: 'Settings', cls: 'tt-settings', pause: false });
  const area = el('div.tt-set-row');
  const draw = () => {
    area.textContent = '';
    if (!G.hasSave()) { area.append(el('p.tt-set-note', { text: 'No saved game on this device.' })); return; }
    area.append(el('p.tt-set-note', { text: 'Your progress is saved in this browser.' }), el('button.tt-danger', { onclick: ask }, 'Reset save'));
  };
  const ask = () => {
    area.textContent = '';
    area.append(el('p.tt-set-warn', { text: 'Delete your saved game? This cannot be undone.' }), el('div.tt-confirm', null,
      el('button', { onclick: draw }, 'Keep it'),
      el('button.tt-danger', { onclick: () => { G.wipeSave(); draw(); buildTitle(); } }, 'Yes, delete')));
  };
  draw(); m.body.append(area, el('p.tt-set-note.tt-dim', { text: 'More options (sound, controls) coming soon.' }));
}

/* ---------- continue ---------- */
async function cont() {
  if (!G.load()) { buildTitle(); return; }
  if (ENV.season !== G.now().season && G.setSeason) G.setSeason(G.now().season);
  const P = G.state.player; hideTitleDom(); stopPan(false);
  if (P.spec) G.player.setSpec(P.spec);
  try {
    if (P.scene === 'city' || !P.scene) await G.go('city', { x: P.x, y: P.y });
    else await G.go('city', { poi: (G.state.flags && G.state.flags.lastDoor) || undefined });
  } catch (e) { console.error(e); await G.go('city'); }
  G.player.hidden = false;
  closeTitle(); G.emit('game:start', { isNew: false });
}

/* ---------- new game ---------- */
async function newGame(step) {
  hideTitleDom();
  let who = null, homeId = null;
  for (;;) {
    if (step === 'homes') { const A = charArt(); who = { name: 'Alex', spec: (A.PLAYER_PRESETS || [])[0] || G.state.player.spec }; }
    else {
      who = await openCreator({ mode: 'new', spec: who && who.spec, name: who && who.name });
      if (!who) { buildTitle(); return; }
      if (!(await traitStep())) continue;   /* pick 3 traits (src/sim/traits.js); Back returns to the creator */
    }
    step = null;
    homeId = await pickHome();
    if (homeId) break;
  }
  commitNewGame(who.name, who.spec, homeId);
}

function homeArt(h, i) {
  // little pixel building per district (24x20 at 1x)
  const c = document.createElement('canvas'); c.width = 24; c.height = 20; c.className = 'pix hp-art'; const g = c.getContext('2d');
  const pal = { oldtown: ['#b8553a', '#8f3a28', '#f2c230'], harbor: ['#5a8ab8', '#3a5f88', '#f4f0e8'], arts: ['#e8b83a', '#7a55c8', '#f07aa8'], maplewood: ['#e8d8b0', '#4fa860', '#7a5238'] }[h.district] || [['#b8553a', '#5a8ab8', '#e8b83a', '#e8d8b0'][i % 4], '#4a4a58', '#f2c230'];
  const R = (x, y, w, hh, col) => { g.fillStyle = col; g.fillRect(x, y, w, hh); };
  R(0, 0, 24, 20, '#9fd0e8'); R(0, 15, 24, 5, '#7fbf62'); R(3, 1, 18, 2, '#fffdf4');
  R(4, 5, 16, 13, '#2a2733'); R(5, 6, 14, 12, pal[0]);
  R(3, 3, 18, 3, '#2a2733'); R(4, 4, 16, 1, pal[1]);
  for (const [x, y] of [[6, 8], [11, 8], [15, 8], [6, 12], [15, 12]]) { R(x, y, 3, 3, '#2a2733'); R(x + 1, y + 1, 1, 1, pal[2]); }
  R(11, 13, 3, 5, '#2a2733'); R(12, 14, 1, 4, '#7a5238');
  if (h.district === 'maplewood') { R(0, 10, 4, 6, '#3d8a4a'); R(20, 9, 4, 7, '#3d8a4a'); }
  if (h.district === 'harbor') { R(0, 17, 24, 3, '#3b6fd0'); R(2, 18, 4, 1, '#9fd0e8'); }
  if (h.district === 'arts') { R(6, 12, 3, 3, '#4fa860'); }
  c.style.width = '72px'; c.style.height = '60px'; return c;
}

function pickHome() {
  return new Promise(res => {
    const homes = starterHomes(); let sel = null;
    const ok = el('button.cc-ok', { disabled: true, onclick: () => fin(sel) }, 'Move in ▶');
    const cards = el('div.hp-cards');
    const fin = v => { w.classList.add('out'); setTimeout(() => w.remove(), 180); removeEventListener('keydown', key, true); res(v); };
    const key = e => { if (e.key === 'Escape') { e.stopPropagation(); fin(null); } };
    homes.forEach((h, i) => {
      const card = el('button.hp-card', { 'aria-pressed': 'false', onclick: () => { sel = h.id; ok.disabled = false; ok.textContent = 'Move in ▶'; for (const c of cards.children) { c.classList.toggle('on', c === card); c.setAttribute('aria-pressed', c === card ? 'true' : 'false'); } } },
        el('div.hp-top', null, homeArt(h, i), el('div.hp-id', null, el('div.hp-name', { text: h.name }), el('div.hp-dist', { text: DISTRICTS[h.district] || h.district || '' }),
          el('div.hp-rent', null, el('b', { text: '$' + (h.rentPerWeek || h.rent || '?') }), ' / week'))),
        h.blurb && el('div.hp-blurb', { text: h.blurb }),
        el('ul.hp-list', null, (h.pros || []).slice(0, 3).map(t => el('li.hp-pro', { text: t })), (h.cons || []).slice(0, 2).map(t => el('li.hp-con', { text: t }))),
        h.perk && h.perk.desc && el('div.hp-perk', { text: '★ ' + h.perk.desc }));
      card.style.setProperty('--d', (0.05 + i * 0.06) + 's'); cards.append(card);
    });
    const w = el('div.cc-wrap', null, el('div.cc-panel.hp-panel.tt-pop', { role: 'dialog', 'aria-label': 'Choose your first home' },
      el('div.cc-head', null, el('span.cc-title', { text: 'Pick your first place' }), el('span.cc-step', { text: 'Step 3 of 3' })),
      el('div.hp-body', null, el('p.hp-intro', { text: 'Four little studios are up for rent. You can always move later.' }), cards),
      el('div.cc-foot', null, el('button.cc-back', { onclick: () => fin(null) }, '◀ Back'), el('div.cc-spacer'), ok)));
    addEventListener('keydown', key, true); root().append(w);
  });
}

function freshState() {
  const s = JSON.parse(JSON.stringify(BASE)); for (const k in G.stateDefaults) s[k] = G.stateDefaults[k](); return s;
}

async function commitNewGame(name, spec, homeId) {
  G.state = freshState(); G.emit('load', G.state);
  if (ENV.season !== G.now().season && G.setSeason) G.setSeason(G.now().season);
  G.state.player.name = name; G.state.player.spec = spec; G.player.setSpec(spec);
  if (!G.stateDefaults.home) G.defineState('home', () => ({ id: null }));
  if (!G.state.home || typeof G.state.home !== 'object') G.state.home = {};
  G.state.home.id = homeId;
  stopPan(false); closeTitle();
  G.introHandled = false; G.player.hidden = false;
  G.emit('game:new', { name, spec, homeId });
  if (!G.introHandled) await G.go('city', { poi: 'spawn:airport' });
  G.emit('game:start', { isNew: true });
}
