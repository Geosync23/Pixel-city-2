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
import { objSprite } from '../engine/sprites.js';
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
// A slow tour of framed landmark views. Each view drifts a few tiles for ~24 s, then the backdrop dips to dark and cuts to the next.
// The logo and buttons sit in the middle of the screen, so every view keeps its landmark in the upper part (camera aims a few tiles "below" it).
// [landmark poi name, fallback x, y, aim offset dx, dy (tiles, +,+ = landmark higher on screen), drift dx, dy]
const VIEWS = [
  ['The Bay Wheel', 100, 369, -2, 7, -3, 3],
  ['Market Square', 97, 252, 5, 5, -4, 2],
  ['City Hall Plaza', 220, 222, -1, -14, 2, 2],
  ['Gull Point Lighthouse', 32, 352, 2, 2, 3, 3],
  ['Duck Pond', 98, 158, 6, 6, 4, -3],
];
function startPan() {
  const w = G.world, p = G.player; p.hidden = true; p.stop && p.stop();
  const q = G.query, cl = (v, m) => Math.max(6, Math.min(m - 6, v));
  const views = VIEWS.map(v => { const o = (w.pois || []).find(o => o && o.name === v[0] && isFinite(o.x) && isFinite(o.y)); const x = (o ? o.x : v[1]) + v[3], y = (o ? o.y : v[2]) + v[4]; return [cl(x - v[5] / 2, w.w), cl(y - v[6] / 2, w.h), cl(x + v[5] / 2, w.w), cl(y + v[6] / 2, w.h)]; });
  let vi = Math.max(0, Math.min(views.length - 1, q && q.has('tview') ? +q.get('tview') | 0 : 0)), s = 0, cutting = false; const DUR = 24;
  const cam = { x: views[vi][0], y: views[vi][1], z: w.heightAt(views[vi][0], views[vi][1]) };
  const cut = { title: true, update(dt) {
    p.hidden = true; const v = views[vi]; s = Math.min(1, s + dt / DUR); const e = s * s * (3 - 2 * s) * .9 + s * .1;
    cam.x = v[0] + (v[2] - v[0]) * e; cam.y = v[1] + (v[3] - v[1]) * e; cam.z = G.world.heightAt(cam.x, cam.y);
    if (s >= 1 && !cutting && views.length > 1) { // dip the backdrop (not the logo), jump, come back up
      cutting = true; const veil = wrap && wrap.querySelector('.tt-veil'); if (veil) veil.classList.add('on');
      setTimeout(() => { if (G.cutscene !== cut) return; vi = (vi + 1) % views.length; s = 0; cutting = false; const n = views[vi]; cam.x = n[0]; cam.y = n[1]; cam.z = G.world.heightAt(cam.x, cam.y); G.snapCam && G.snapCam(); try { G.renderer.warm(G.world, G.cam); } catch (e) { /* not ready */ } setTimeout(() => { const vl = wrap && wrap.querySelector('.tt-veil'); if (vl) vl.classList.remove('on'); }, 120); }, 420);
    }
  } };
  /* pull the camera back as far as the player can, so a whole landmark fits around the logo; the game's zoom comes back when the title closes */
  if (prevZoom === null && G.setZoom && G.zmin) { prevZoom = G.zoom; G.setZoom(G.zmin); }
  myCut = cut; myCam = cam; G.cutscene = cut; G.camTarget = cam; G.snapCam && G.snapCam();
}
let prevZoom = null;
function stopPan(unhide = true) {
  if (prevZoom !== null) { const z = prevZoom; prevZoom = null; G.setZoom(z); }
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
    el('div.tt-veil'),
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
    /* QA9: saved inside your own home (every night's sleep saves there): continue at home, not on the pavement outside */
    if (/^int:home:/.test(P.scene || '') && G.housing && G.housing.current && G.housing.current() && String(P.scene).startsWith('int:home:' + G.housing.current().id) && G.housing.goHome) { try { await G.housing.goHome(); } catch (e) { /* stay outside */ } }
    /* QA13: saved in the lobby of the building you live in: continue in that lobby (where you stood), not on the street */
    else if (/^int:/.test(P.scene || '') && G.mailboxes && G.housing && G.housing.current && G.housing.current() && G.mailboxes.homeOfLobby(P.scene) === G.housing.current().id) { try { const sc = String(P.scene); await G.go(sc, P.x !== undefined ? { x: P.x, y: P.y } : {}); } catch (e) { /* stay outside */ } }
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

/** thumbnail of a starter home: the real building sprite from the city (the one its front door belongs to), on a patch of ground */
function homeArt(h, i) {
  const BOX = 104, dpr = window.devicePixelRatio || 1;
  try {
    const w = G.sceneCache && G.sceneCache.get('city') && G.sceneCache.get('city').world, door = w && w.pois.find(p => p.type === 'door' && p.room === 'home:' + h.id);
    let ob = null, bd = 3; if (door) for (const o of w.objs) { if (o.a.kind !== 'building') continue; const d = Math.hypot(Math.max(o.B[0], Math.min(door.x, o.B[3])) - door.x, Math.max(o.B[1], Math.min(door.y, o.B[4])) - door.y); if (d < bd) { bd = d; ob = o; } }
    const spr = ob && objSprite(ob);
    if (spr) {
      // device pixels per art pixel: a whole number when the screen is dense enough (crisp), otherwise a smooth reduction
      const fit = Math.min((BOX - 8) / spr.w, (BOX - 14) / spr.h) * dpr, k = fit >= 1 ? Math.floor(fit) : fit, px = Math.round(BOX * dpr);
      const c = document.createElement('canvas'); c.width = px; c.height = px; c.className = 'hp-art hp-real' + (fit >= 1 ? ' pix' : ''); const g = c.getContext('2d');
      const sky = { oldtown: '#bfe3ee', harbor: '#b5ddf0', arts: '#cfe6ee', maplewood: '#c4e6e4' }[h.district] || '#bfe3ee', gnd = { oldtown: ['#b9705a', '#8f5443'], harbor: ['#b08a5a', '#84633c'], arts: ['#bab5a7', '#9d988a'], maplewood: ['#79b964', '#5c9a4c'] }[h.district] || ['#bab5a7', '#9d988a'];
      g.fillStyle = sky; g.fillRect(0, 0, px, px);
      const bw = spr.w * k, bh = spr.h * k, bx = Math.round((px - bw) / 2), by = Math.round(px - bh - 5 * dpr);
      // ground diamond under the footprint (the sprite anchor is the footprint's back corner)
      const ax = bx - spr.x * k, ay = by - spr.y * k, U = 16 * k, sx = ob.size[0], sy = ob.size[1], m = 1.2;
      const P = (x, y) => [ax + (x - y) * U, ay + (x + y) * U / 2];
      const poly = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach((q, n) => n ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill(); };
      poly([P(-m, -m), P(sx + m, -m), P(sx + m, sy + m), P(-m, sy + m)], gnd[1]); poly([P(-m, -m), P(sx + m, -m), P(sx + m, sy + m - .35), P(-m, sy + m - .35)], gnd[0]);
      g.imageSmoothingEnabled = fit < 1; if (fit < 1) g.imageSmoothingQuality = 'high';
      g.drawImage(spr.c, bx, by, bw, bh);
      c.style.width = BOX + 'px'; c.style.height = BOX + 'px'; return c;
    }
  } catch (e) { console.warn('home thumbnail: ' + e.message); }
  return homeToy(h, i);
}
function homeToy(h, i) {
  // fallback: little pixel building per district (24x20 at 1x)
  const c = document.createElement('canvas'); c.width = 24; c.height = 20; c.className = 'pix hp-art'; const g = c.getContext('2d');
  const pal = { oldtown: ['#b8553a', '#8f3a28', '#f2c230'], harbor: ['#5a8ab8', '#3a5f88', '#f4f0e8'], arts: ['#e8b83a', '#7a55c8', '#f07aa8'], maplewood: ['#e8d8b0', '#4fa860', '#7a5238'] }[h.district] || [['#b8553a', '#5a8ab8', '#e8b83a', '#e8d8b0'][i % 4], '#4a4a58', '#f2c230'];
  const R = (x, y, w, hh, col) => { g.fillStyle = col; g.fillRect(x, y, w, hh); };
  R(0, 0, 24, 20, '#9fd0e8'); R(0, 15, 24, 5, '#7fbf62'); R(3, 1, 18, 2, '#fffdf4');
  R(4, 5, 16, 13, '#2a2733'); R(5, 6, 14, 12, pal[0]);
  R(3, 3, 18, 3, '#2a2733'); R(4, 4, 16, 1, pal[1]);
  for (const [x, y] of [[6, 8], [11, 8], [15, 8], [6, 12], [15, 12]]) { R(x, y, 3, 3, '#2a2733'); R(x + 1, y + 1, 1, 1, pal[2]); }
  R(11, 13, 3, 5, '#2a2733'); R(12, 14, 1, 4, '#7a5238');
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
