// FIRST-TIME WINDOWS — the engine (owner msg 107, BIBLE 21.3). Texts: src/data/firsttime.js. They are the Bay Basics tips (src/ui/phone_tips.js, G.tips), shown
// as ONE short window at the moment the player first touches a system, instead of a "Tip: ..." banner. G.tips.show(id) (used by a few other systems) lands here too.
//
// RULES
//   once each (G.state.tips.seen, the same record the old banners used: tips an old save has seen stay seen);
//   never two in a row: after one closes, the next waits at least GAP_REAL real seconds (a "now" one looks again for a little while, as long as you are still
//   in the same place), and a "soon" one at least GAP_SOON_REAL real seconds and GAP_GAME game minutes;
//   at most CAP_SOON waiting ones a game day (CAP_ALL counting the "now" ones), so the first day stays calm;
//   never during the arrival (the intro has its own hints), a Chapter scene, a dialogue, a mini-game, a cutscene or ride, sleep, or the title screen;
//   on shift only the windows about the job itself, and never while a task game is up;
//   a "soon" window also waits until no other window, phone or banner is on screen and nothing is being done;
//   "First-time tips: off" in Settings (G.state.tips.off) switches all of it off; everything stays readable in Bay Basics and on each Systems card.
// TWO KINDS OF TRIGGER
//   A waiting window is shown only where it makes sense (WHERE: "Cooking at home" at home, "Talking to people" out among people), the ones about something that just
//   happened go first (FIRST), and one that has waited too long is dropped unseen (TTL) so it can come back at its next moment.
//   now   the player has just opened / tapped the thing (Decorate, a till, the stove, a bus stop). Shown at once, on top. If it cannot be shown right now it is
//         simply dropped and comes back the next time they touch that thing.
//   soon  something happened (hired, a parcel landed, a need went low). Queued (saved) until a calm moment.
//
// G.firstTime = { offer(id, { now?: bool, delay?: ms }) -> bool (shown or queued), show(id) (force: tests / "read it again as a window"), close(), isOpen, queue() -> [ids],
//                 enabled() / setEnabled(bool), rush(bool) (tests: no gaps, no cap), windows() -> [defs], shown() -> [{ id, t }] newest first, calm(now?) -> reason string | '' (debug) }
// Events: 'firsttime:show'(id), 'firsttime:close'(id, how: 'ok' | 'go'), and the old 'tip'(id) for anything that listened to it.
// State (inside G.state.tips, owned by phone_tips.js): { seen, read, last, off: 0|1, v: 2, q: [ids waiting], qt: { id: t queued }, day, n, nn (shown today: soon / now), nw, rides, at: { id: t shown } }
import { G } from '../core/game.js';
import { el, root } from '../ui/kit.js';
import { iconEl } from '../ui/_icons.js';
import { WINDOWS, WINDOW_BY_ID } from '../data/firsttime.js';
import { SYSTEM_BY_ID, BIG_PLACES } from '../data/systems.js';
import '../art/icons/systems.js';

export const order = 135;
const DAY = 1440, GAP_REAL = 15, GAP_SOON_REAL = 75, GAP_GAME = 45, CAP_SOON = 6, CAP_ALL = 9, BANNER_QUIET = 9;
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const S = () => { let s = G.state.tips; if (!s || typeof s !== 'object') s = G.state.tips = { seen: {}, read: {}, last: -999 }; s.seen = s.seen || {}; s.read = s.read || {}; s.q = s.q || []; s.at = s.at || {}; return s; };
const tip = id => safe(() => G.tips.get(id), null) || WINDOW_BY_ID[id] || null;
const DEBUG_URL = /[?&]scene=/.test(safe(() => location.search, ''));   /* tools/shot.mjs sessions have no arrival */
const introDone = () => (DEBUG_URL || !!safe(() => G.state.flags.introDone, false)) && !safe(() => G.intro.active, false);
const started = () => !!G.started || DEBUG_URL;
const real = () => performance.now() / 1000;
let M = null, lastClose = -999, lastBanner = -999, tickT = 0, rush = false;   /* rush: tests only (no gaps, no daily cap) */

/* ---------- when is it all right to put a window up ---------- */
export function calm(now, t) {
  const s = S();
  if (s.off) return 'off'; if (G.onTitle || !started()) return 'title'; if (M) return 'open';
  if (!introDone()) return 'intro'; if (G.cutscene) return 'cutscene'; if (safe(() => G.needs.sleeping, false)) return 'asleep';
  if (safe(() => G.chapters.active(), false)) return 'chapter';
  if (document.querySelector('.mg, .tp-wrap, .chd-wrap, .chc-wrap, .say, .jm-res, .mg-res')) return 'scene';
  if (safe(() => G.jobs.onShift(), false) && !(t && t.sys === 'jobs')) return 'shift';
  const d = Math.floor(G.state.t / DAY); if (s.day !== d) { s.day = d; s.n = 0; s.nn = 0; }
  if (!rush && (s.n || 0) + (s.nn || 0) >= CAP_ALL) return 'cap';
  if (!rush && real() - lastClose < GAP_REAL) return 'gap';
  if (now) return '';
  if (!rush && (s.n || 0) >= CAP_SOON) return 'cap';
  if (!rush && (real() - lastClose < GAP_SOON_REAL || (G.state.t - (s.last === undefined ? -999 : s.last) < GAP_GAME && G.state.t >= s.last))) return 'gap';
  if (G.modal > 0 || safe(() => G.phone.isOpen, false) || safe(() => G.furnish.active, false)) return 'window';
  if (G.busy) return 'busy';
  if (real() - lastBanner < BANNER_QUIET || document.querySelector('#ph-banners > *')) return 'banner';
  return '';
}

/* ---------- the window ---------- */
function injectCss() { if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/firsttime.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/firsttime.css' })); }
function present(id, now) {
  const t = tip(id), s = S(); if (!t || M) return false;
  s.seen[id] = 1; s.read[id] = 1; s.last = G.state.t; s.at[id] = Math.floor(G.state.t); if (now) s.nn = (s.nn || 0) + 1; else s.n = (s.n || 0) + 1; s.q = s.q.filter(x => x !== id);
  const sys = SYSTEM_BY_ID[t.sys], first = (s.nw = (s.nw || 0) + 1) <= 2;
  const done = how => { if (!M || M.id !== id) return; const m = M; M = null; m.el.remove(); G.modal = Math.max(0, G.modal - 1); lastClose = real(); removeEventListener('keydown', key, true); G.emit('firsttime:close', id, how);
    if (how === 'go') setTimeout(() => safe(() => G.tips.go(t)), 60); };
  const key = e => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); done('ok'); } };
  const card = el('div.ftw-card', { role: 'dialog', 'aria-label': t.title },
    el('div.ftw-head', null, iconEl(t.icon || (sys && sys.icon) || 'sys.first', 2), el('small', { text: sys ? `First time · ${sys.name}` : 'First time' })),
    el('b.ftw-title', { text: t.title }), el('p', { text: t.text }),
    el('div.ftw-btns', null, t.go ? el('button.ftw-go', { 'data-ftw': 'go', onclick: () => done('go') }, t.goLabel || 'Show me') : null, el('button.ftw-ok', { 'data-ftw': 'ok', onclick: () => done('ok') }, 'Got it')),
    first ? el('small.ftw-foot', { text: 'Each of these comes once. They are all in Bay Basics to read again, and Settings can switch them off.' }) : null);
  const wrap = el('div', { id: 'ftw', onpointerdown: e => { if (e.target === wrap) { e.stopPropagation(); } } }, card);
  injectCss(); root().append(wrap); G.modal++; M = { id, el: wrap, done }; addEventListener('keydown', key, true);
  safe(() => G.audio.sfx('notify')); G.emit('firsttime:show', id); G.emit('tip', id);
  return true;
}
export function offer(id, o = {}) {
  const t = tip(id), s = S(); if (!t || s.seen[id] || s.off) return false;
  if (o.delay) { setTimeout(() => offer(id, Object.assign({}, o, { delay: 0 })), o.delay); return true; }
  if (o.now) { const why = calm(true, t);
    /* too soon after the last window: look again a few times while the player is still in the same place, then let it go until the next time they touch this */
    if (why === 'gap' && (o.tries || 0) < 6) { const sc = G.scene && G.scene.id, inWin = o.inWin !== undefined ? o.inWin : G.modal > 0 || safe(() => G.furnish.active, false);
      setTimeout(() => { if (G.scene && G.scene.id === sc && (!inWin || G.modal > 0 || safe(() => G.furnish.active, false))) offer(id, { now: true, tries: (o.tries || 0) + 1, inWin }); }, 3000); return true; }
    if (why) return false; return present(id, true); }
  if (!s.q.includes(id)) { s.q.push(id); (s.qt = s.qt || {})[id] = G.state.t; if (s.q.length > 12) s.q.shift(); }
  return true;
}
/* A waiting window is only shown where it makes sense, the ones tied to something that just happened go first, and one that has waited too long is let go
   (not marked seen: it comes back the next time its moment does). */
const atHome = () => safe(() => G.housing.isHome(G.scene.id), false), outAndAbout = () => !atHome() && !/^int:(clinic|airport)/.test(String(G.scene && G.scene.id));
const WHERE = { talk: outAndAbout, cooking: atHome, boxes: atHome, sleep: atHome, mail: atHome, recipe_new: atHome, cleaning: atHome, laundry: atHome, autowork: () => safe(() => G.jobs.onShift(), false), weather: () => safe(() => G.weather.isWet(), false),
  events: () => !!safe(() => G.cityEvents.live(), null), chapter_after: () => !safe(() => G.chapters.active(), false) };
const FIRST = { shift: 1, autowork: 1, promoted: 1, gigs: 1, deliveries: 1, boxes: 1, shows: 1, events: 1, bills: 1, mail: 1, opps: 1, invites: 1, uniclass: 1, chapter_after: 1, needs_tap: 1, passout: 1, wander: 1 };
const TTL = { sleep: 180, passout: 180, weather: 360, autowork: 240, events: 600, store: 720, recipe_new: 720, spoiled: 720, money_low: 720 }, TTL_DEFAULT = 2 * DAY;
function tick() {
  const s = S(); if (!s.q || !s.q.length || M) return; s.qt = s.qt || {};
  for (const id of s.q.slice()) { const t = tip(id); if (s.qt[id] === undefined) s.qt[id] = G.state.t; if (!t || s.seen[id] || G.state.t - s.qt[id] > (TTL[id] || TTL_DEFAULT) || G.state.t < s.qt[id]) { s.q = s.q.filter(x => x !== id); delete s.qt[id]; } }
  for (const k in s.qt) if (!s.q.includes(k)) delete s.qt[k];
  const order = s.q.filter(id => FIRST[id]).concat(s.q.filter(id => !FIRST[id]));
  for (const id of order) { const t = tip(id); if (WHERE[id] && !safe(() => WHERE[id](), true)) continue;
    const why = calm(false, t); if (!why) { present(id, false); return; } if (why !== 'shift') return; }   /* on shift, a job window may go ahead of the others */
}
export const show = id => { if (M) M.done('ok'); const s = S(), was = s.off; s.off = 0; const r = present(id, true); s.off = was; return r; };

/* ---------- triggers ---------- */
const soon = id => offer(id), now = (id, delay) => offer(id, { now: true, delay: delay || 0 });
const guideOf = placeId => safe(() => G.guide.all().find(e => e.placeId === placeId && !e.parent), null);
const roomOf = sc => String((sc && sc.id) || sc || '').replace(/^int:/, '');
function wire() {
  const on = (ev, fn) => G.on(ev, (...a) => { if (S().off || !started()) return; safe(() => fn(...a)); });
  /* getting around */
  on('phone:app', id => { if (!introDone()) return; if (id === 'map') now('navigator', 400); else if (id === 'jobs') now('jobsboard', 400); else if (id === 'homes') now('moving', 400); });
  on('use', it => { const l = String((it && it.label) || ''); if (!introDone()) return;
    if (/^Bus stop/.test(l)) now('bus', 500); else if (/ Station$/.test(l) && G.scene && G.scene.id === 'city') now('train', 500);
    else if (/^cook\b|stove|cooker|\bhob\b|\boven\b/i.test(l) && safe(() => G.housing.isHome(G.scene.id), false)) now('cooking', 300);
    else if (/dresser|wardrobe/i.test(l) && safe(() => G.housing.isHome(G.scene.id), false)) now('dresser', 500); });
  on('ride:end', k => { if (!/bus|train|rail/.test(String(k))) return; const s = S(); s.rides = (s.rides || 0) + 1; if (s.rides >= 2 && !safe(() => G.transit.hasPass(), false)) soon('pass'); });
  const wander = () => setTimeout(() => soon('wander'), 3500);
  G.on('msg:reply', th => { if (th === 'jules') wander(); }); G.on('intro:done', wander);
  /* food */
  on('shop:open', v => { if (!introDone()) return; const e = guideOf(v), ty = e ? e.type + ' ' + e.title : String(v);
    if (/Supermarket|Grocery|Corner shop|market|Cheese|Deli/i.test(ty)) now('groceries', 500); else if (e && e.chapter === 'eat') now('eatout', 500); });
  on('fridge:stored', () => soon('cooking'));
  on('inv:spoiled', () => soon('spoiled'));
  on('recipe:learned', () => { if (introDone() && G.state.t - safe(() => G.state.chapters.introT, 0) > 120) soon('recipe_new'); });
  /* home */
  on('goods:visit', () => now('furnshop', 900));
  on('order:placed', () => soon('deliveries')); on('home:delivery', () => soon('boxes'));
  on('home:view', () => now('viewing', 1500));
  on('supplies:low', () => soon('cleaning'));
  on('hour', h => { if (h >= 0 && h < 4 && !G.busy) soon('sleep'); });
  on('wardrobe:open', () => now('dresser', 300)); on('wardrobe:dirty', () => soon('laundry'));
  on('room:enter', sc => { const r = roomOf(sc); if (!introDone() || !r) return;
    if (safe(() => G.hair.bookFor(r), null)) return now('haircut', 1400);
    if (safe(() => G.clothesShop.shops().some(s => s.venue === r || s.id === r || (s.place && (s.place.id || s.place) === r)), false) && !/^(gym|arena|hotel|market|deptstore)/.test(r)) return now('clothesshop', 1400);
    if (/^post_/.test(r)) return; });
  /* work & money */
  on('job:hired', () => soon('shift')); on('job:shift:start', () => soon('autowork')); on('job:promoted', () => soon('promoted')); on('job:gig:start', () => soon('gigs'));
  on('bills:soon', () => soon('bills'));
  on('money', () => { if (introDone() && safe(() => G.money.get(), 999) < 50) soon('money_low'); });
  on('opp:offer', () => soon('opps'));
  on('university:visit', () => now('uni', 1500)); on('university:enrol', () => soon('uniclass'));
  /* people */
  on('scene', sc => { if (!sc || !introDone()) return; const home = safe(() => G.housing.isHome(sc.id), false);
    if (home) { const h = G.now().hf; if (h >= 16.5 && h < 22 && safe(() => G.inv.fridge.items().length, 0)) soon('cooking'); }
    else if (/^int:/.test(sc.id || '') && !/^int:airport/.test(sc.id)) soon('talk'); });
  on('friend:up', () => soon('gifts'));
  on('msg:appt', (th, ok) => { if (ok) soon('invites'); });
  on('post:mail', () => soon('mail')); on('post:visit', () => now('postoffice', 1500));
  on('chapter:done', () => soon('chapter_after'));
  /* wellbeing */
  on('needs:low', k => { const soft = /comfort|outdoors|inspiration/.test(k); if (k === 'bladder') return; if (soft) return soon('needs_soft'); soon('needs_tap'); if (k === 'fun') soon('fun_ways'); if (k === 'social') soon('talk'); });
  on('day', () => { if (introDone() && Math.floor(G.state.t / DAY) >= 1 && !safe(() => G.skills.interests().length, 0)) soon('interests'); });
  on('skill:up', () => { if (introDone()) soon('skills'); });
  on('minigame:done', r => { if (r && r.played && !r.auto) soon('sk_minis'); });
  on('trait:earned', () => soon('trait_earned'));
  on('weather', k => { if (/rain|storm/.test(String(k)) && introDone()) soon('weather'); });
  on('passout', () => soon('passout'));
  on('guide:stamp', () => { if (introDone() && S().seen.wander) soon('stamp'); });   /* Wander is introduced first; the stamp window comes with a later stamp */
  /* going out */
  on('show:ticket', () => soon('shows'));
  on('cityevent:level', (id, lvl) => { if (lvl >= 3) soon('events'); });
  for (const [id] of BIG_PLACES) on(id + ':visit', () => now('sight', 1600));
  on('mall:visit', () => now('mall', 1500)); on('skydeck:visit', () => now('skydeck', 1500));
  /* phone */
  on('media:session', () => soon('phonefun'));
  on('app:released', () => { if (introDone() && G.state.t > DAY + 480) soon('store'); });
  /* banners: remember when one went up, so a waiting window never lands on top of it */
  G.on('phone:notify', e => { if (!e || e.priority !== 'low') lastBanner = real(); });
}

/* ---------- old saves ---------- */
function migrate() {
  const s = S(); if (s.v === 2) return; s.v = 2;
  if (G.state.t < 2 * DAY) return;   /* a save from before the windows: do not explain what the player has plainly been doing for days */
  for (const w of WINDOWS) if (!s.seen[w.id] && w.sys && safe(() => G.shelf.touched(w.sys), false)) { s.seen[w.id] = 1; s.read[w.id] = 1; }
}

export function init() {
  injectCss(); S();
  G.firstTime = { offer, show, close: () => { if (M) M.done('ok'); }, calm, queue: () => S().q.slice(), enabled: () => !S().off, setEnabled: on => { const s = S(); s.off = on ? 0 : 1; if (!on) { s.q = []; if (M) M.done('ok'); } return !s.off; },
    rush: on => { rush = !!on; if (rush) lastBanner = -999; return rush; }, windows: () => WINDOWS.slice(), shown: () => Object.entries(S().at).map(([id, t]) => ({ id, t })).sort((a, b) => b.t - a.t) };
  Object.defineProperty(G.firstTime, 'isOpen', { get: () => !!M, configurable: true });
  wire();
  G.on('load', () => { if (M) M.done('ok'); S(); setTimeout(migrate, 0); });
  G.on('game:start', o => { const s = S(); if (o && o.isNew) s.v = 2; else migrate(); });
  G.on('title:show', () => { if (M) M.done('ok'); });
  void tickT; setInterval(() => { if (!started() || G.onTitle) return;
    if (safe(() => G.furnish.active, false) && introDone()) { safe(() => G.shelf.touch('decor')); if (!S().seen.decorate && !S().off) offer('decorate', { now: true }); }
    tick(); }, 500);
}
