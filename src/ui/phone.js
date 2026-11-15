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
// Events: 'phone:open'(appId | null), 'phone:close', 'phone:notify'(entry), 'phone:unlock'(appId), 'phone:app'(appId)
// State slice G.state.phone = { unlocked: {id:1}, locked: {id:1}, log: [...], cool: { type: t }, seq, settings: { banners, text }, waypoint, cityPos, ride, orders, seen }
// Keys: M / Q (and P / Tab when there is no HUD) toggle, Esc = back. A floating phone button appears only while G.hud does not exist.
import { G } from '../core/game.js';
import { el, root, toast } from './kit.js';
import { APPS, APP_BY_ID, NOTIFICATIONS, PHONE } from '../data/phone.js';
import { VENUE_BY_ID } from '../data/venues.js';
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
let isOpen = false, depth = 0, stack = [], posed = false, tipTimer = 0;
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
  const a = impl.get(id), own = a && a.badge ? safe(() => a.badge(), 0) | 0 : 0;
  return own + S.log.reduce((n, e) => n + (e.app === id && !e.read && !(a && a.ownsLog) ? 1 : 0), 0);
}
function syncBadge() { const n = badge(); if (G.hud && G.hud.setBadge) safe(() => G.hud.setBadge('phone', n || ''), 0); if (fab) { fab.lastChild.textContent = n || ''; fab.lastChild.classList.toggle('on', !!n); } }
function markRead(app) { let ch = false; for (const e of S.log) if (!e.read && (!app || e.app === app)) { e.read = 1; ch = true; } if (ch) syncBadge(); }

/* ---------- notifications ---------- */
const queue = []; let showing = null;
function notify(o) {
  if (!S || !o) return null; const T = (o.type && NOTE[o.type]) || null, t = G.state.t;
  if (T && T.cooldownMinutes && S.cool[o.type] !== undefined && t - S.cool[o.type] < T.cooldownMinutes && t >= S.cool[o.type]) return null;
  if (T) S.cool[o.type] = t;
  const app = o.app || (T && T.app) || null, e = { id: ++S.seq, app, type: o.type || null, title: String(o.title || (defOf(app) || {}).name || 'Maple Bay'), text: String(o.text || ''), icon: o.icon || null, t, read: 0, pri: o.priority || (T && T.priority) || 'normal' };
  if (o.data) e.data = o.data; if (o.face) e.face = o.face; if (o.appIcon) e.appIcon = o.appIcon;
  if (isOpen && current() && current().app === app && app !== 'messages') e.read = 1;
  S.log.unshift(e); if (S.log.length > 40) S.log.length = 40;
  G.emit('phone:notify', e); syncBadge();
  if (e.pri !== 'low' && S.settings.banners !== false && !e.read && !G.onTitle) { if (isOpen && e.pri !== 'high') tip(`${e.title}: ${e.text}`); else { queue.push(e); pump(); } safe(() => G.audio.sfx('notify'), 0); }
  if (isOpen && !stack.length) refresh();
  return e;
}
function pump() {
  if (showing || !queue.length || !bannerBox) return; const e = queue.shift(), sticky = e.pri === 'high';
  const ic = e.face ? portrait(e.face, 40) : e.icon ? el('span.ph-ico', { style: { width: '40px', height: '40px', background: '#fff4dc' } }, iconEl(e.icon, 2)) : appIcon(e.appIcon || e.app || 'notifications', 40, defOf(e.app));
  const done = () => { if (showing !== b) return; showing = null; b.classList.remove('in'); setTimeout(() => { b.remove(); pump(); }, 220); };
  const b = el('div.ph-banner' + (sticky ? '.sticky' : ''), { role: 'status' },
    el('button.ph-banner-main', { 'aria-label': `${e.title}: ${e.text}. Open`, onclick: () => { done(); e.read = 1; syncBadge(); open(e.app, e.data); } }, ic, el('span.ph-banner-t', null, el('b', { text: e.title }), el('span', { text: e.text }))),
    el('button.ph-banner-x', { 'aria-label': 'Dismiss', text: 'x', onclick: done }));
  showing = b; bannerBox.append(b); requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add('in')));
  if (!sticky) setTimeout(done, queue.length > 2 || isOpen ? 2600 : 5200);
}

/* ---------- views ---------- */
const current = () => stack[stack.length - 1] || null;
function ctxFor(v) {
  return { arg: v.arg, app: v.app, push: (title, fn, key) => { stack.push({ app: v.app, title, fn, key, arg: v.arg }); render(true); }, back, refresh, open, close, tip, home: () => { stack = []; render(true); } };
}
function tip(text) { if (!tipEl) return; tipEl.textContent = text; tipEl.classList.add('on'); clearTimeout(tipTimer); tipTimer = setTimeout(() => tipEl.classList.remove('on'), 2600); }
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
    const b = el('div.ph-body'), foot = el('div.ph-foot'), c = ctxFor(v); c.body = b; c.foot = foot;
    node = el('div.ph-app.ph-app-' + v.app, null,
      el('div.ph-head', null, el('button.ph-hback', { 'aria-label': 'Back', onclick: back }, iconEl('ui.arrow_left', 1)), appIcon(d.id, 32, d),
        el('span.ph-head-t', null, el('b', { text: v.title || d.name }), root0 && d.question ? el('small', { text: d.question }) : null)), b, foot);
    try { if (v.fn) v.fn(b, c); else if (v.app === 'notifications') logView(b, c); else impl.get(v.app).render(b, c); }
    catch (e) { console.error('phone app', v.app, e); b.replaceChildren(empty('ui.warning', 'This app hit a snag', 'Try again in a moment.')); }
  }
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
    el('button', { onclick: () => openApp('planner', nx ? { appt: nx.id } : null) }, iconEl('ui.calendar', 1), el('span', { text: nx ? `${nx.title} · ${when(nx.t)}` : 'Nothing planned' })));
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
  if (!isOpen) return; isOpen = false; G.modal = Math.max(0, G.modal - 1); layer.classList.remove('open'); layer.setAttribute('aria-hidden', 'true'); stack = [];
  if (posed && G.player && G.player.pose === (PHONE.openAnim || 'phone')) G.player.pose = null; posed = false;
  setTimeout(() => { if (!isOpen && viewEl) viewEl.replaceChildren(); }, 260);
  G.emit('phone:close'); syncBadge();
}
const toggle = () => (isOpen ? close() : open());
const viewing = (app, key) => { const v = current(); return !!(isOpen && v && v.app === app && (key === undefined || v.key === key)); };

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
    else if (!typing && (k === 'm' || k === 'q' || k === 'p' || k === 'tab')) { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
  G.on('key', k => { if (!G.hud && (k === 'p' || k === 'tab' || k === 'm' || k === 'q')) open(); });
}
function wire() {
  G.on('load', () => { S = G.state.phone || (G.state.phone = fresh()); const f = fresh(); for (const k in f) if (S[k] === undefined) S[k] = f[k]; if (isOpen) render(false); syncBadge(); });
  G.on('title:show', () => { close(); queue.length = 0; });
  G.on('minutes', () => { if (G.scene && G.scene.id === 'city' && G.player) S.cityPos = { x: Math.round(G.player.x), y: Math.round(G.player.y) }; });
  for (const ev of ['msg:new', 'msg:read', 'appt:add', 'appt:remove', 'money']) G.on(ev, () => { syncBadge(); if (isOpen && ev !== 'money') refresh(); });
  // notification types fed by other systems' events (data/phone.js NOTIFICATIONS)
  G.on('bills:soon', b => notify({ type: 'bill_reminder', title: 'Bay Bank', text: `Rent & bills tomorrow: ${money((b && b.total) || 0)}`, icon: 'ui.coin' }));
  G.on('bills:due', b => notify({ type: 'bill_paid', title: 'Bay Bank', text: 'Paid: ' + ((b && b.items) || []).map(i => `${i.label} ${money(i.amount)}`).join(', '), icon: 'ui.coin' }));
  G.on('money', () => { const m = balance(); if (m < 50) notify({ type: 'low_balance', title: 'Bay Bank', text: `Balance is low: ${money(m)}`, icon: 'ui.coin' }); });
  G.on('skill:up', (k, lvl) => notify({ type: 'skill_up', title: 'Wellness', text: `${cap(k)} is now level ${lvl}!`, icon: 'skill.' + k }));
  G.on('needs:low', k => notify({ type: 'need_low', title: 'Wellness', text: ({ hunger: 'Getting hungry...', energy: 'Running low on energy...', hygiene: 'A shower would be nice.', fun: 'Time for something fun?', social: 'Maybe call someone?' })[k] || `Your ${k} is low.`, icon: 'need.' + k, priority: 'low' }));
  G.on('shop:buy', (item, qty, venueId) => { const v = VENUE_BY_ID[venueId]; if (v && v.delivers && !isUnlocked('delivery')) unlock('delivery'); });
}

export function init() {
  S = G.defineState('phone', fresh);
  for (const a of [messagesApp, plannerApp, mapApp, taxiApp, bankApp, jobsApp, wellnessApp, deliveryApp, settingsApp]) impl.set(a.id, a);
  injectCss(); build(); keys(); wire();
  G.phone = { open, close, toggle, notify, unlock, lock, isUnlocked, badge, refresh, viewing, tip,
    registerApp: a => { if (!a || !a.id || !a.render) return false; impl.set(a.id, a); if (a.setup) safe(() => a.setup(G.phone), 0); if (isOpen) refresh(); return true; },
    log: () => S.log.slice(), clearLog: () => { S.log = []; syncBadge(); }, apps: () => defs().map(a => ({ id: a.id, name: a.name, unlocked: isUnlocked(a.id), badge: isUnlocked(a.id) ? badge(a.id) : 0 })),
    setWaypoint, waypoint: getWaypoint, routeTo, get isOpen() { return isOpen; }, get settings() { return S.settings; } };
  for (const a of impl.values()) if (a.setup) safe(() => a.setup(G.phone), 0);
  syncBadge();
}
