// The phone: shell (frame, status bar, home grid, navigation), notification banners + history, app registry.
// Apps live in src/ui/phone_<app>.js; the app list / unlock rules / notification types come from src/data/phone.js. Styles: phone.css.
//
// G.phone
//   open(appId?, arg?)      slide the phone up (pauses the sim: G.modal++); with an id go straight into that app. Locked apps open the home screen.
//   close()                 put it away (G.modal--).          toggle()          isOpen (bool getter)
//   notify({ app, title, text, icon?, type?, priority?, data?, face? }) -> entry | null
//        Lock-screen style banner at the top of the game screen (never pauses) + an entry in the notification history + a badge on the app.
//        type      optional id from data/phone.js NOTIFICATIONS: supplies default app / priority / cooldownMinutes (null is returned while cooling down).
//        priority  'low' = history + badge only, 'normal' = banner for ~5 s, 'high' = banner stays until tapped or dismissed.
//        data      passed to the app as `ctx.arg` when the banner / history entry is tapped (e.g. { thread: 'jules' }).
//   unlock(appId, silent?)  make an app available (banner "New app" unless silent).    lock(appId)    isUnlocked(appId)
//   registerApp({ id, name, question?, iconId? ('ui.star'), color?, slot?, render(body, ctx), badge?(), setup?() })   add or replace an app
//        ctx = { arg, body, foot (fixed area under the scrolling body), push(title, fn(body, ctx), key?), back(), refresh(), open(appId, arg), close(), tip(text) }
//   badge(appId?) -> number (all apps when omitted)      refresh()  re-render the current view      viewing(appId, key?) -> bool
//   log() -> newest-first notification history [{ id, app, title, text, icon, t, read, data }]      clearLog()
//   routeTo(placeOrId | {x,y,name}) -> bool   open the Map on the 'How will you get there?' card (foot / bus / train / cab); every 'Take me there' uses it
//   setWaypoint(placeOrId | null) / waypoint()   the on-screen guide arrow (phone_map.js); emits 'waypoint'(place | null)
//   part -> null | 'video' | 'read'   PART-SCREEN (owner msg 173, BIBLE update 37): a view that watches or reads calls ctx.partScreen('video' | 'read', { start?: 'full' })
//        while it renders; the phone then shrinks to a sheet docked at the bottom (video ~43% of the height, reading ~60%), G.modal drops back (the world,
//        the clock at 1x / 2x / 4x and the HUD run; o.rate = a slower pace for text you read yourself), the player holds the phone (a hold activity 'On your phone', or the seat they are already on keeps them
//        seated with its clock taken over), world taps are ignored (G.busy). Header buttons: Bigger (back to the full, paused phone) / Smaller, Stop.
//        Ends by itself when the view goes, the phone closes, the scene changes, or something else ends the hold (a need at its floor, a Chapter, HUD Stop).
//        setPart(kind | null) -> bool.     Every other view opens full and pauses time as before.
// Events: 'phone:open'(appId | null), 'phone:close', 'phone:notify'(entry), 'phone:unlock'(appId), 'phone:app'(appId), 'phone:part'(kind | null)
// State slice G.state.phone = { unlocked: {id:1}, locked: {id:1}, log: [...], cool: { type: t }, seq, settings: { banners, text }, waypoint, cityPos, ride, orders, seen }
// Keys: M / Q (and P / Tab when there is no HUD) toggle, Esc = back. A floating phone button appears only while G.hud does not exist.
import { G } from '../core/game.js';
import { el, root, toast } from './kit.js';
import { APPS, APP_BY_ID, NOTIFICATIONS, PHONE } from '../data/phone.js';
import { VENUE_BY_ID } from '../data/venues.js';
import { BILLS } from '../data/economy.js';
import { iconEl, appIcon, portrait, money, balance, weatherNow, weatherIcon, isNight, when, safe, timeInfo, empty, row, section, cap } from './phone_util.js';
import messagesApp from './phone_messages.js';
import plannerApp from './phone_planner.js';
import mapApp, { setWaypoint, getWaypoint, routeTo } from './phone_map.js';
import taxiApp from './phone_taxi.js';
import bankApp from './phone_bank.js';
import jobsApp from './phone_jobs.js';
import wellnessApp from './phone_wellness.js';
import deliveryApp from './phone_delivery.js';
import settingsApp from './phone_settings.js';

export const order = 70;
const NOTE = Object.fromEntries(NOTIFICATIONS.map(n => [n.id, n]));
const impl = new Map(); // app id -> { render, badge, setup, ...def }
const defs = () => { const out = APPS.map(a => Object.assign({}, a, impl.get(a.id))); for (const [id, a] of impl) if (!APP_BY_ID[id]) out.push(Object.assign({ slot: 99, unlock: { at: 'start' } }, a)); return out.sort((a, b) => a.slot - b.slot); };
const defOf = id => defs().find(a => a.id === id) || null;

let S = null, layer = null, body = null, statusEl = null, viewEl = null, tipEl = null, fab = null, bannerBox = null;
let isOpen = false, depth = 0, stack = [], posed = false, tipTimer = 0, part = null;
const fresh = () => ({ unlocked: {}, locked: {}, log: [], cool: {}, seq: 0, settings: { banners: true, text: 15 }, waypoint: null, cityPos: null, ride: null, orders: [], seen: {} });

/* ---------- unlocks & badges ---------- */
function isUnlocked(id) {
  const d = defOf(id); if (!d) return false; if (G.apps && G.apps.hides(id)) return false; /* not installed (app store, sim/apps.js) */ if (S.locked[id]) return false; if (S.unlocked[id]) return true;
  const u = d.unlock || { at: 'start' }; if (u.at === 'condition') return !!(u.flag && G.state.flags && G.state.flags[u.flag]);
  return true; // 'start' and 'tutorial' apps: there from the first minute (the intro may lock('taxi') and unlock it at its tutorial step)
}
function unlock(id, silent) {
  const d = defOf(id); if (!d) return false; const was = isUnlocked(id); delete S.locked[id]; S.unlocked[id] = 1; const u = d.unlock; if (u && u.flag) (G.state.flags || (G.state.flags = {}))[u.flag] = true;
  if (!was) { G.emit('phone:unlock', id); if (!silent) notify({ app: id, title: 'New app: ' + d.name, text: d.question || 'Tap to open.', icon: null, appIcon: id }); if (isOpen) refresh(); }
  return !was;
}
function lock(id) { if (defOf(id)) { S.locked[id] = 1; delete S.unlocked[id]; if (isOpen) refresh(); } }
function badge(id) {
  if (!id) { let n = 0; for (const a of defs()) if (isUnlocked(a.id)) n += badge(a.id); return n; }
  const a = impl.get(id); if (a && a.noBadge) return 0;   /* an app that never shows a counter, not even for its notifications (Wander, owner msg 87) */
  const own = a && a.badge ? safe(() => a.badge(), 0) | 0 : 0;
  return own + S.log.reduce((n, e) => n + (e.app === id && !e.read && !(a && a.ownsLog) ? 1 : 0), 0);
}
function syncBadge() { const n = badge(); if (G.hud && G.hud.setBadge) safe(() => G.hud.setBadge('phone', n || ''), 0); if (fab) { fab.lastChild.textContent = n || ''; fab.lastChild.classList.toggle('on', !!n); } }
function markRead(app) { let ch = false; for (const e of S.log) if (!e.read && (!app || e.app === app)) { e.read = 1; ch = true; } if (ch) syncBadge(); }

/* ---------- notifications ---------- */
const queue = []; let showing = null, held = 0;
function notify(o) {
  if (!S || !o) return null; const T = (o.type && NOTE[o.type]) || null, t = G.state.t;
  if (T && T.cooldownMinutes && S.cool[o.type] !== undefined && t - S.cool[o.type] < T.cooldownMinutes && t >= S.cool[o.type]) return null;
  if (T) S.cool[o.type] = t;
  const app = o.app || (T && T.app) || null, e = { id: ++S.seq, app, type: o.type || null, title: String(o.title || (defOf(app) || {}).name || 'Maple Bay'), text: String(o.text || ''), icon: o.icon || null, t, read: 0, pri: o.priority || (T && T.priority) || 'normal' };
  if (o.data) e.data = o.data; if (o.face) e.face = o.face; if (o.appIcon) e.appIcon = o.appIcon;
  if (typeof o.onTap === 'function') Object.defineProperty(e, 'onTap', { value: o.onTap });   /* wish-list reminder (sim/wishnudge.js): the banner's tap runs this instead of opening the app; not saved, so the history entry opens the app */
  /* QA9: the same news twice within half an hour ('New app: Circle' from the store AND the unlock) is logged once; in the first three days at most ONE 'New app' banner a day, the rest arrive quietly in the phone */
  if (S.log.some(q => q.title === e.title && q.text === e.text && t - q.t < 30 && t >= q.t)) return null;
  if (/^New app: /.test(e.title) && e.pri !== 'high') { const d0 = safe(() => G.state.intro.day0, null), dd = Math.floor(t / 1440); if (d0 != null && dd - d0 < 3) { if (S.appBanner === dd) e.pri = 'low'; else S.appBanner = dd; } }
  if (isOpen && current() && current().app === app && app !== 'messages') e.read = 1;
  S.log.unshift(e); if (S.log.length > 40) S.log.length = 40;
  G.emit('phone:notify', e); syncBadge();
  if (e.pri !== 'low' && S.settings.banners !== false && !e.read && !G.onTitle) { if (isOpen && !part && e.pri !== 'high') tip(`${e.title}: ${e.text}`); else { queue.push(e); pump(); } safe(() => G.audio.sfx('notify'), 0); }
  if (isOpen && !stack.length) refresh();
  return e;
}
/* QA11: a My Day banner that is no longer true goes (round 10: "Starting now" stayed 21 min, "Leave now" 33 min after leaving, "In 30 min: Shift at 07:00" shown at 07:07 after clocking in):
   the entry is kept / you are there / it is over; "In N min" once it has started; "Leave now" once you are on your way; any sticky one after 20 game minutes */
/* QA11: banners wait while a Chapter, a job story beat or a relationship scene is on screen (Nora's gift text slid over her costumes scene); they drop in after */
const sceneOn = () => !!(safe(() => G.chapters.active(), false) || safe(() => G.jobStory.active(), false) || safe(() => G.rel.active(), false));
function stale(e) {
  const id = e && e.data && e.data.appt; if (id === undefined || id === null || e.app !== 'planner') return false;
  const a = safe(() => G.planner.get(id), null), t = G.state.t; if (!a) return true;
  if (a.here || a.s >= 3 || t >= a.t + a.dur) return true;
  if (/· In \d+ min/.test(e.title) && t >= a.t) return true;
  if (/· Leave now/.test(e.title) && (safe(() => !!G.nav.trip(), false) || t >= a.t)) return true;
  return e.pri === 'high' && t - (e.t || t) > 20;
}
function pump() {
  if (showing || !queue.length || !bannerBox) return;
  /* QA round 5: banners expire; a stale 'Leave now' came back for six hours and a spring banner showed in autumn */
  while (queue.length && queue[0].pri !== 'high' && G.state.t - (queue[0].t || G.state.t) > 90) queue.shift();
  while (queue.length && queue[0].pri === 'high' && G.state.t - (queue[0].t || G.state.t) > 60) queue.shift();
  while (queue.length && queue[0].data && queue[0].data.opp && !safe(() => { const v = G.opps.get(queue[0].data.opp); return !!v && !/done|end|gone/.test(String(v.st || '')); }, true)) queue.shift();   /* QA9: an Opportunity banner held behind the cook menu showed after it was already done */
  while (queue.length && queue[0].app === 'taxi' && /is here/.test(queue[0].text) && !safe(() => G.transit.pending, null)) queue.shift();   /* QA9: 'Your MapleCab is here' held during the ride showed 40 min later at the destination */
  while (queue.length && stale(queue[0])) queue.shift();
  if (!queue.length) return;
  /* QA round 4: hold banners while a menu / dialog is open over the game (it covered the cook menu's tabs after a new game); they drop in once it closes */
  if (G.modal > (isOpen ? depth : 0) || sceneOn()) { if (!held) held = setTimeout(() => { held = 0; pump(); }, 500); return; }
  const e = queue.shift(), sticky = e.pri === 'high';
  const ic = e.face ? portrait(e.face, 40) : e.icon ? el('span.ph-ico', { style: { width: '40px', height: '40px', background: '#fff4dc' } }, iconEl(e.icon, 2)) : appIcon(e.appIcon || e.app || 'notifications', 40, defOf(e.app));
  const done = () => { if (showing !== b) return; showing = null; b.classList.remove('in'); setTimeout(() => { b.remove(); pump(); }, 220); };
  const b = el('div.ph-banner' + (sticky ? '.sticky' : ''), { role: 'status' },
    el('button.ph-banner-main', { 'aria-label': `${e.title}: ${e.text}. Open`, onclick: () => { done(); e.read = 1; syncBadge(); if (e.onTap && safe(() => e.onTap(), false)) return; open(e.app, e.data); } }, ic, el('span.ph-banner-t', null, el('b', { text: e.title }), el('span', { text: e.text }))),
    el('button.ph-banner-x', { 'aria-label': 'Dismiss', text: 'x', onclick: done }));
  showing = b; const shownAt = performance.now(); bannerBox.append(b); placeBanners(); const pl = setInterval(() => { if (showing !== b) clearInterval(pl); else if (sticky && stale(e)) done(); else if (G.modal > (isOpen ? depth : 0)) { if (performance.now() - shownAt < 3000 && (e.back = (e.back || 0) + 1) <= 2 && G.state.t - (e.t || 0) < 30) queue.unshift(e); done(); }   /* QA9: only a banner that was barely seen comes back (seen ones were shown twice) */ /* a menu opened over it: take it back, show it again after */ else if (sticky && G.state.t - (e.t || G.state.t) > 45 && performance.now() - shownAt > 20000) done(); /* QA8: a sticky banner does not outlive its news */ else placeBanners(); }, 400);   // the trip strip / stop banner may appear while it shows
  requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add('in')));
  if (!sticky) setTimeout(done, queue.length > 2 || (isOpen && !part) ? 2600 : 5200);
}

/** banners drop in just below the HUD's clock + needs bar, the trip strip and the "This is your stop" banner instead of covering them (portrait phones) */
function placeBanners() {
  if (!bannerBox) return; bannerBox.style.top = ''; const r = bannerBox.getBoundingClientRect(), up = (bannerBox.offsetParent || document.body).getBoundingClientRect().top;
  let b = safe(() => G.nav.clearTop(r.left, r.right), 0) || 0; const ns = document.getElementById('nav-stop');
  if (ns && ns.classList.contains('on')) { const q = ns.getBoundingClientRect(); if (q.height && q.right > r.left && q.left < r.right) b = Math.max(b, q.bottom); }
  if (b > 0) bannerBox.style.top = Math.round(b - up + 6) + 'px';
}
/* QA round 4: toasts (#toasts, z 6, top 104px in portrait) slid under a banner (z 60) at the same height and could not be read. While a banner shows, the toast
   column gets a padding-top that starts it below the banner (padding, because navigator.js owns #toasts' top and hud.js its margin-top). */
let toastPad = 0, toastPadT = 0;
function clearToasts(dt) {
  if ((toastPadT -= dt || 0) > 0) return; toastPadT = .1; const ts = document.getElementById('toasts'); if (!ts) return; let p = 0;
  if (showing && bannerBox && ts.children.length) { const q = ts.getBoundingClientRect(), bb = bannerBox.getBoundingClientRect(), bot = bb.top + showing.offsetTop + showing.offsetHeight;
    if (q.width && bb.left < q.right && bb.right > q.left && q.top < bot + 6 && q.top > bb.top - 200) p = Math.ceil(bot + 6 - q.top); }
  if (p !== toastPad) { toastPad = p; ts.style.paddingTop = p ? p + 'px' : ''; }
}
/* ---------- views ---------- */
const current = () => stack[stack.length - 1] || null;
function ctxFor(v) {
  return { arg: v.arg, app: v.app, push: (title, fn, key) => { stack.push({ app: v.app, title, fn, key, arg: v.arg }); render(true); }, back, refresh, open, close, tip, home: () => { stack = []; render(true); },
    /* part-screen (see the header): call while rendering; o.start 'full' = the view opens full with a Smaller button (the guide's entries) */
    partScreen: (kind, o) => { if (v.big === undefined) v.big = !!(o && o.start === 'full'); v.part = kind; v.refit = (o && o.refit) || null; v.rate = (o && o.rate) || null; if (!v.big) setPart(kind); return part === kind; }, get part() { return part; } };
}
/* QA15: the faded tip kept its text (opacity 0) in a role=status region, so text readers saw the last tip in every app for days; empty it once it has faded */
function tip(text) { if (!tipEl) return; tipEl.textContent = text; tipEl.classList.add('on'); clearTimeout(tipTimer); tipTimer = setTimeout(() => { tipEl.classList.remove('on'); tipTimer = setTimeout(() => { if (!tipEl.classList.contains('on')) tipEl.textContent = ''; }, 250); }, 2600); }
function statusBar() {
  if (!statusEl) return; const n = G.now(), w = weatherNow(), en = safe(() => G.needs.get('energy'), 80), indoor = G.scene && G.scene.indoor;
  statusEl.replaceChildren(el('span.ph-st-clock', { text: `${n.clock} ${n.weekdayName}` }),
    el('span.ph-st-mid', null, w ? iconEl(weatherIcon(w.kind, isNight()), 1) : null, w ? el('span', { text: `${w.tempC}°` }) : null),
    el('span.ph-st-r', null, el('span.ph-st-money', { text: money(balance()) }),
      el('span.ph-sig', { title: 'Signal', 'aria-label': 'Signal' }, [1, 2, 3, 4].map(i => el('i' + (i <= (indoor ? 3 : 4) ? '.on' : ''), { style: { height: 2 + i * 3 + 'px' } }))),
      el('span.ph-bat' + (en < 25 ? '.low' : ''), { title: 'Battery: same as yours', 'aria-label': `Battery ${Math.round(en)} percent, same as yours` }, el('i', { style: { width: Math.max(8, Math.round(en)) + '%' } }))));
}
function render(anim) {
  if (!isOpen) return; statusBar(); const v = current(), old = viewEl.firstChild, keep = !anim && old ? (old.querySelector('.ph-body') || old).scrollTop : 0;
  let node;
  if (!v) node = homeView();
  else {
    const d = v.app === 'notifications' ? { id: 'notifications', name: 'Notifications', question: 'What did I miss?' } : defOf(v.app), root0 = stack.length === 1 || stack[stack.length - 2].app !== v.app;
    const b = el('div.ph-body'), foot = el('div.ph-foot'), c = ctxFor(v), sz = el('span.ph-sz'); c.body = b; c.foot = foot; v.part = null;
    node = el('div.ph-app.ph-app-' + v.app, null,
      el('div.ph-head', null, el('button.ph-hback', { 'aria-label': 'Back', onclick: back }, iconEl('ui.arrow_left', 1)), appIcon(d.id, 32, d),
        el('span.ph-head-t', null, el('b', { text: v.title || d.name }), root0 && d.question ? el('small', { text: d.question }) : null), sz), b, foot);
    try { if (v.fn) v.fn(b, c); else if (v.app === 'notifications') logView(b, c); else impl.get(v.app).render(b, c); }
    catch (e) { console.error('phone app', v.app, e); b.replaceChildren(empty('ui.warning', 'This app hit a snag', 'Try again in a moment.')); }
    if (v.part) sz.append(el('button.ph-szb', { 'data-ps': 'size', 'aria-label': 'Bigger or smaller', onclick: () => sizeTo(v, !!part) }, el('span', { text: part ? 'Bigger' : 'Smaller' })),
      el('button.ph-szb.x', { 'data-ps': 'stop', 'aria-label': 'Stop and put the phone away', onclick: () => close() }, el('span', { text: 'Stop' })));
    else if (part) setPart(null);
  }
  if (!v && part) setPart(null);
  if (anim) node.classList.add('ph-anim'); viewEl.replaceChildren(node);
  if (keep) { const sb = node.querySelector('.ph-body') || node; sb.scrollTop = keep; }
  layer.classList.toggle('at-home', !v); syncBadge();
}
function refresh() { if (isOpen) render(false); }
function back() { if (!isOpen) return; if (stack.length) { stack.pop(); render(true); } else close(); }

function homeView() {
  const n = G.now(), w = weatherNow(), nx = safe(() => G.planner.next(), null), unread = S.log.filter(e => !e.read).length;
  const grid = el('div.ph-grid');
  for (const a of defs()) {
    if (G.apps && G.apps.hides(a.id)) continue; // the home screen shows installed apps only
    const ok = isUnlocked(a.id), b = ok ? badge(a.id) : 0;
    grid.append(el('button.ph-appbtn' + (ok ? '' : '.locked'), { 'aria-label': a.name + (ok ? (b ? `, ${b} new` : '') : ', locked'), onclick: () => (ok ? openApp(a.id) : tip(`${a.name} is not installed yet. ${(a.unlock && a.unlock.desc) || 'It unlocks a little later.'}`)) },
      el('span.ph-appico', null, appIcon(a.id, 48, a), !ok ? el('span.ph-lock', null, iconEl('ui.lock', 1)) : null, b ? el('em.ph-badge', { text: b > 9 ? '9+' : b }) : null), el('span.ph-applabel', { text: a.name })));
  }
  const quick = el('div.ph-quick', null,
    isUnlocked('taxi') ? el('button', { onclick: () => openApp('taxi') }, iconEl('transport.taxi', 1), el('span', { text: 'Call a cab' })) : null,
    el('button', { onclick: () => openApp('planner', nx ? { appt: nx.id } : { myday: 1 }) }, iconEl('ui.calendar', 1), el('span', { text: nx ? `${nx.title} · ${when(nx.t)}` : 'Nothing planned' })));
  return el('div.ph-home', null,
    el('button.ph-widget', { 'aria-label': 'Notifications', onclick: () => openApp('notifications') },
      el('span.ph-w-l', null, el('b.ph-w-clock', { text: n.clock }), el('span', { text: `${n.weekdayName} ${n.dayOfMonth} ${n.seasonName}` })),
      el('span.ph-w-r', null, w ? iconEl(weatherIcon(w.kind, isNight()), 2) : iconEl('ui.sparkle', 2), el('span', { text: w ? `${w.name} ${w.tempC}°C` : 'Maple Bay' }), el('small', { text: unread ? `${unread} new notification${unread > 1 ? 's' : ''}` : 'No new notifications' }))),
    grid, quick);
}
function logView(b) {
  markRead();
  if (!S.log.length) return b.append(empty('ui.check', 'All caught up', 'Messages, reminders and alerts will collect here.'));
  b.append(section('Recent', el('button.ph-link', { text: 'Clear', onclick: () => { S.log = []; refresh(); } })));
  for (const e of S.log) b.append(row({ icon: e.face ? portrait(e.face, 36) : e.icon ? e.icon : appIcon(e.appIcon || e.app || 'notifications', 32, defOf(e.app)), title: e.title, sub: e.text, right: when(e.t), cls: 'note', onclick: e.app && defOf(e.app) ? () => openApp(e.app, e.data) : null }));
}

/* ---------- open / close ---------- */
function openApp(id, arg) {
  if (id !== 'notifications' && (!defOf(id) || !impl.get(id) || !isUnlocked(id))) { stack = []; render(true); if (defOf(id) && !isUnlocked(id)) tip(`${defOf(id).name} is not installed yet.`); return; }
  stack = [{ app: id, arg: arg || null }]; if (id !== 'messages') markRead(id); G.emit('phone:app', id); render(true);
}
function open(appId, arg) {
  if (!layer || G.onTitle) return false;
  if (isOpen && part && !appId) { const v = current(); if (v) sizeTo(v, true); else setPart(null); return true; }   /* part-screen: the HUD phone button / M makes the player bigger instead of leaving it */
  if (!isOpen) {
    isOpen = true; G.modal++; depth = G.modal; layer.classList.add('open'); layer.setAttribute('aria-hidden', 'false'); stack = [];
    const p = G.player; if (p && !p.pose && !G.busy && !G.cutscene) { p.pose = PHONE.openAnim || 'phone'; posed = true; }
    body.style.fontSize = (S.settings.text || 15) + 'px';
    queue.length = 0; if (showing && !showing.classList.contains('sticky')) showing.lastChild.click();
    G.emit('phone:open', appId || null);
  }
  if (appId) openApp(appId, arg); else { stack = []; render(true); }
  return true;
}
function close() {
  if (!isOpen) return; const wasPart = !!part; if (part) partOff(); isOpen = false; if (!wasPart) G.modal = Math.max(0, G.modal - 1); layer.classList.remove('open'); layer.setAttribute('aria-hidden', 'true'); stack = [];
  if (posed && G.player && G.player.pose === (PHONE.openAnim || 'phone')) G.player.pose = null; posed = false;
  setTimeout(() => { if (!isOpen && viewEl) viewEl.replaceChildren(); }, 260);
  G.emit('phone:close'); syncBadge();
}
const toggle = () => (isOpen && !part ? close() : open());
const viewing = (app, key) => { const v = current(); return !!(isOpen && v && v.app === app && (key === undefined || v.key === key)); };

/* ---------- part-screen (owner msg 173, BIBLE update 37): watching / reading with the world, the HUD and the clock going on above the phone ---------- */
/* allowed when the phone is the only thing pausing the game (no sheet under it, not paused from the HUD) and the player is free, seated, or on a ride */
const seatedBusy = b => !!b && b.canCancel !== false && !b.jobTask && !b.jobAuto && b.anim !== 'sleep' && (b.anim === 'sit' || (!!b.at && /sit|bench|sofa|seat|wait/i.test(String(b.label || b.actId || ''))));
const canPart = () => isOpen && depth === 1 && G.modal === 1 && !G.onTitle && !!G.player && (!!G.cutscene || !G.busy || seatedBusy(G.busy));
let hold = null, releasing = false;
/* the clock while docked: the normal rate (game.js: speed x G.CLOCK), or the view's own pace at 1x (o.rate, game minutes per real second: Pages' short reads run at
   reading pace, so a read costs its listed minutes), times the 1x / 2x / 4x speed either way */
const clockRate = () => { const v = current(); return Math.max(0, G.state.speed || 1) * ((v && v.rate) || G.CLOCK || .85); };
const PS_LABEL = { video: 'Watching on your phone', read: 'Reading on your phone' };
function holdOn() {
  if (hold || !part) return; const p = G.player; if (!p) return;
  if (G.cutscene) { hold = { ride: true }; return; }   // a bus / cab ride owns the clock and the player already
  const b = G.busy;
  if (b) { hold = { b, rate: b.rate, left: Math.max(1, b.left), label: b.label }; b.label = (b.label || 'Sitting') + ' · ' + (part === 'video' ? 'watching' : 'reading'); return; }   // seated: stay seated, the seat's clock runs at the normal rate
  hold = { own: G.startActivity({ label: PS_LABEL[part] || 'On your phone', anim: 'phone', minutes: 99999, rate: clockRate(), canCancel: true, phonePart: true, done: lost, cancel: lost }) };
}
function holdOff() {
  const h = hold; hold = null; if (!h) return;
  if (h.own && G.busy === h.own) { releasing = true; try { G.endActivity(false); } finally { releasing = false; } if (isOpen && posed && G.player && !G.player.pose) G.player.pose = PHONE.openAnim || 'phone'; }
  if (h.b && G.busy === h.b) { h.b.rate = h.rate; h.b.left = h.left; h.b.label = h.label; }
}
/* something else ended the hold (Stop on the HUD, a need at its floor, a Chapter, the pad's Back in the world): put the phone away, as the TV stops */
function lost() { if (releasing) return; hold = null; if (isOpen) setTimeout(() => { if (isOpen && part && !hold) close(); }, 0); }
function holdTick() {
  if (!part || !hold) return;
  if (hold.ride) { if (!G.cutscene) { hold = null; if (!G.busy || seatedBusy(G.busy)) holdOn(); else close(); } return; }   // the ride ended with the film still on: hold the phone where you stand
  if (hold.own) { if (G.busy !== hold.own) return lost(); hold.own.rate = clockRate(); hold.own.left = 99999; return; }
  if (hold.b) { if (G.busy !== hold.b) { hold = null; return lost(); } hold.b.rate = clockRate(); hold.b.left = hold.left; }   // the seat does not run out while you watch
}
/* the Bigger / Smaller button. A view that lays itself out for the space it has (Pages' pagination) is drawn again (v.refit runs first) */
function sizeTo(v, big) {
  const was = part; if (v.refit && big === !!was) safe(() => v.refit(), 0); v.big = big;   // only when the size really changes
  if (!setPart(big ? null : v.part)) { v.big = true; tip('Part-screen works when you are free, sitting down or on a ride.'); return; }
  if (v.refit && !part !== !was) refresh();
}
function sizeLabel() { if (viewEl) for (const q of viewEl.querySelectorAll('.ph-szb[data-ps=size] span')) q.textContent = part ? 'Bigger' : 'Smaller'; }
function dock() {
  const ui = root(); if (!part) { ui.classList.remove('ph-part'); ui.style.removeProperty('--phh'); G.camDY = 0; return; }
  const h = body.getBoundingClientRect().height || 0, u = ui.getBoundingClientRect(); ui.classList.add('ph-part'); ui.style.setProperty('--phh', Math.round(h) + 'px');
  /* the camera centres the player in the part of the screen that is still world (PART-SCREEN HOOK in core/game.js) */
  G.camDY = u.width > 560 ? 0 : Math.round(h / 2) / (G.cssScale || 1);
}
function partOff() {
  if (!part) return; part = null; holdOff(); layer.classList.remove('part', 'part-video', 'part-read'); dock(); sizeLabel(); G.emit('phone:part', null);
}
/** shrink to / grow from part-screen. Returns true when the phone is now in the asked state. */
function setPart(kind) {
  if (!kind) { if (!part) return true; partOff(); G.modal++; depth++; return true; }
  if (!part) { if (!canPart()) return false; part = kind; G.modal = Math.max(0, G.modal - 1); depth--; layer.classList.add('part'); }
  else if (part === kind) return true;
  part = kind; layer.classList.remove('part-video', 'part-read'); layer.classList.add('part-' + kind);
  if (hold && hold.own) hold.own.label = PS_LABEL[kind]; holdOn(); dock(); sizeLabel(); G.emit('phone:part', kind); return true;
}

/* ---------- boot ---------- */
function wallpaper() {
  const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); g.fillStyle = '#2f5d7c'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#3a6c8c'; for (let y = 0; y < 16; y += 4) for (let x = (y % 8 ? 2 : 0); x < 16; x += 4) g.fillRect(x, y, 2, 2);
  g.fillStyle = '#28506c'; g.fillRect(7, 7, 2, 2); g.fillRect(15, 15, 1, 1); return c.toDataURL();
}
function injectCss() { if (document.querySelector('link[href="src/ui/style.css"]') && !document.querySelector('link[href="src/ui/phone.css"]')) document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/phone.css' })); }
function build() {
  statusEl = el('div.ph-status'); viewEl = el('div.ph-view'); tipEl = el('div.ph-tip', { role: 'status' });
  const nav = el('div.ph-nav', null,
    el('button', { 'aria-label': 'Back', onclick: back }, iconEl('ui.arrow_left', 1)),
    el('button.ph-nav-home', { 'aria-label': 'Home screen', onclick: () => { if (stack.length) { stack = []; render(true); } else close(); } }, el('i')),
    el('button', { 'aria-label': 'Put phone away', onclick: close }, iconEl('ui.arrow_down', 1)));
  body = el('div.ph', { role: 'dialog', 'aria-label': 'Phone' }, el('div.ph-ear'), el('div.ph-screen', { style: { backgroundImage: `url(${wallpaper()})` } }, statusEl, viewEl, tipEl, nav));
  layer = el('div', { id: 'phone-layer', 'aria-hidden': 'true' }, el('div.ph-scrim', { onpointerdown: close }), body);
  bannerBox = el('div', { id: 'ph-banners' });
  fab = el('button', { id: 'ph-fab', 'aria-label': 'Phone', onclick: toggle }, iconEl('ui.phone', 3), el('span.ph-badge'));
  root().append(layer, bannerBox, fab);
  const fabSync = () => { fab.style.display = G.hud ? 'none' : ''; }; fabSync(); G.on('ready', fabSync); G.on('game:start', fabSync);
}
function keys() {
  addEventListener('keydown', e => {
    if (!isOpen || G.modal > depth) return; const k = e.key.toLowerCase(), typing = /^(input|textarea|select)$/i.test((e.target && e.target.tagName) || '');
    if (k === 'escape') { e.preventDefault(); e.stopPropagation(); back(); }
    else if (!typing && part && (k === 'm' || k === 'q')) { e.preventDefault(); e.stopPropagation(); open(); }   /* docked: the phone key makes it bigger, as the HUD's phone button */
    else if (!typing && (k === 'm' || k === 'q' || (!part && (k === 'p' || k === 'tab')))) { e.preventDefault(); e.stopPropagation(); close(); }   /* part-screen: P / 1 2 4 / Tab reach the HUD (pause, speed, needs) */
  }, true);
  G.on('key', k => { if (!G.hud && (k === 'p' || k === 'tab' || k === 'm' || k === 'q')) open(); });
}
function wire() {
  G.on('load', () => { S = G.state.phone || (G.state.phone = fresh()); const f = fresh(); for (const k in f) if (S[k] === undefined) S[k] = f[k]; if (isOpen) render(false); syncBadge(); });
  G.on('title:show', () => { close(); queue.length = 0; });
  G.on('minutes', () => { if (G.scene && G.scene.id === 'city' && G.player) S.cityPos = { x: Math.round(G.player.x), y: Math.round(G.player.y) }; });
  for (const ev of ['msg:new', 'msg:read', 'appt:add', 'appt:remove', 'money']) G.on(ev, () => { syncBadge(); if (isOpen && ev !== 'money') refresh(); });
  // notification types fed by other systems' events (data/phone.js NOTIFICATIONS)
  G.on('bills:soon', b => notify({ type: 'bill_reminder', title: 'Bay Bank', text: `Rent & bills tomorrow at ${BILLS.due.hour % 12 || 12} ${BILLS.due.hour < 12 ? 'AM' : 'PM'}: ${money((b && b.total) || 0)}`, icon: 'ui.coin' }));
  G.on('bills:due', b => notify({ type: 'bill_paid', title: 'Bay Bank', text: 'Paid: ' + ((b && b.items) || []).map(i => `${i.label} ${money(i.amount)}`).join(', '), icon: 'ui.coin' }));
  G.on('money', () => { const m = balance(); if (m < 50) notify({ type: 'low_balance', title: 'Bay Bank', text: `Balance is low: ${money(m)}`, icon: 'ui.coin' }); });
  G.on('skill:up', (k, lvl) => notify({ type: 'skill_up', title: 'Wellness', text: `${cap(k)} is now level ${lvl}!`, icon: 'skill.' + k }));
  if (0) G.on('needs:low', k => notify({ type: 'need_low', title: 'Wellness', text: ({ hunger: 'Getting hungry...', energy: 'Running low on energy...', hygiene: 'A shower would be nice.', fun: 'Time for something fun?', social: 'Maybe call someone?' })[k] || `Your ${k} is low.`, icon: 'need.' + k, priority: 'low' }));
  G.on('shop:buy', (item, qty, venueId) => { const v = VENUE_BY_ID[venueId]; if (v && v.delivers) (G.state.flags || (G.state.flags = {})).ate_at_delivery_venue = true; });   /* owner msg 112: the app store releases ZipEats from this flag (sim/apps.js); nothing is 'locked' any more */
}

export function init() {
  S = G.defineState('phone', fresh);
  for (const a of [messagesApp, plannerApp, mapApp, taxiApp, bankApp, jobsApp, wellnessApp, deliveryApp, settingsApp]) impl.set(a.id, a);
  injectCss(); build(); keys(); wire(); G.on('frame', clearToasts);
  G.on('frame', holdTick); G.on('scene', () => { if (part) close(); }); addEventListener('resize', () => { if (part) setTimeout(dock, 50); });
  G.phone = { open, close, toggle, notify, unlock, lock, isUnlocked, badge, refresh, viewing, tip,
    registerApp: a => { if (!a || !a.id || !a.render) return false; impl.set(a.id, a); if (a.setup) safe(() => a.setup(G.phone), 0); if (isOpen) refresh(); return true; },
    log: () => S.log.slice(), clearLog: () => { S.log = []; syncBadge(); }, apps: () => defs().map(a => ({ id: a.id, name: a.name, unlocked: isUnlocked(a.id), badge: isUnlocked(a.id) ? badge(a.id) : 0 })),
    syncBadge,   // recount the app badges (apps call it after they clear their own counter)
    setWaypoint, waypoint: getWaypoint, routeTo, placeBanners, get isOpen() { return isOpen; }, get settings() { return S.settings; }, get part() { return part; }, setPart };
  for (const a of impl.values()) if (a.setup) safe(() => a.setup(G.phone), 0);
  syncBadge();
}
