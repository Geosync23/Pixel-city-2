// HUD: clock/date/weather, money, the nine need meters in one row (six body needs | three gentle needs) (tap -> wellness panel with mood, moodlets, fitness, skills), interaction prompt,
// activity progress + cancel, phone + backpack buttons, time-speed / pause, autosave + "saved" indicator.
//
// G.hud
//   show() / hide()            the HUD is hidden behind the title screen until 'game:start' (shown at once on dev URL launches)
//   refresh()                  redraw now
//   addIndicator({ id, icon, text?, title?, onclick?, cls? }) -> { set({ icon?, text?, cls?, hidden? }), remove() }
//                              a small chip in the status row under the money (pass, job timer, "raining" ...). Same id replaces.
//   setBadge('phone' | 'bag', n | '')    force a button badge (the phone badge follows G.messages.unread() by itself)
//   setMyDay({ soon?: bool, badge?: n | '' })   the My Day button (top-left, first in the row; opens G.myDay.open()): pulse it / show a count. Driven by ui/myday.js.
//   togglePanel(open?)         the wellness panel         pause(on?)          saved()  flash the save indicator
// Autosave (only in a started game, never on dev ?scene= launches): after sleeping, on every scene change, every 2 game hours.
// Keys: P pause, 1/2/3 speed, I/B backpack (inventory.js), Tab/N wellness panel, M/Q phone.
import { G } from '../core/game.js';
import { el, root, toast, modal } from './kit.js';
import { iconEl, weatherIcon } from './_icons.js';
import { NEEDS, FITNESS, SKILLS, SKILL_MAX_LEVEL } from '../data/needs.js';
import '../art/icons/myday.js';

export const order = 90;
const pk = { s: '', x: 0, y: 0, n: 0 };   /* QA8: when the prompt's nearest-interactable scan last ran */
let H = null, shown = false, dirty = true, acc = 0, lastHours = 0, pauseOn = false, panelOpen = false, lastPrompt = null, lastSaveT = -1e9;
const meters = {}, indicators = new Map(), badges = {};
const fmt = n => (G.money ? G.money.fmt(n) : '$' + Math.round(n));
const hm = m => (m >= 60 ? `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, '0')}m` : `${Math.max(1, Math.round(m))}m`);
const canSave = () => !!G.started && shown && !(G.query && G.query.has('scene')) && !G.cutscene;

function injectCss() { if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/hud.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/hud.css' })); }
function swapIcon(holder, id, scale) { if (holder._ic === id) return; holder._ic = id; holder.textContent = ''; holder.append(iconEl(id, scale)); }

function build() {
  H = { root: el('div', { id: 'hud', class: 'off' }) };
  // top-left: time + needs
  H.wx = el('span.hud-wx'); H.clock = el('b.hud-clock'); H.date = el('span.hud-date');
  H.time = el('div.hud-chip.hud-time', { title: 'Time' }, H.wx, el('div.hud-tcol', null, H.clock, H.date));
  /* My Day: the one phone feature with its own HUD button (owner msg 107). The sheet lives in ui/myday.js. */
  H.dayBadge = el('span.hud-badge');
  H.day = el('button.hud-chip.hud-myday', { 'aria-label': 'My Day: your schedule and ideas', onclick: () => { togglePanel(false); if (G.myDay && G.myDay.open) G.myDay.open(); else if (G.phone && G.phone.open) G.phone.open('planner'); } }, iconEl('myday.btn', 2), el('b', null, 'My', el('br'), 'Day'), H.dayBadge);
  H.face = el('span.hud-face');
  H.needs = el('button.hud-needs', { 'aria-label': 'Needs and mood', onclick: e => {   /* QA8: a low / critical meter opens "where can I fix this?" at once, as the toasts and the first-time window promise */
    const mt = e && e.target && e.target.closest && e.target.closest('.hud-need'), n = mt && NEEDS.find(q => meters[q.id] && meters[q.id].m === mt);
    if (n && !panelOpen && G.needs && /low|critical/.test(G.needs.band(n.id).id)) return fixNeed(n); togglePanel(); } }, H.face);
  /* nine meters in one row: the six body needs, a hairline, then the three gentle ones (Comfort, Outdoors, Inspiration: data `soft`) with calmer teal bars */
  let sep = false;
  for (const n of NEEDS) { if (n.soft && !sep) { sep = true; H.needs.append(el('span.hud-nsep')); } const fill = el('i'), m = el('span.hud-need' + (n.soft ? '.soft' : ''), { title: n.name }, iconEl('need.' + n.id, 1), el('span.hud-bar', null, fill)); meters[n.id] = { m, fill, soft: !!n.soft }; H.needs.append(m); }
  // top-right: money, speed, indicators
  H.moneyT = el('b'); H.money = el('button.hud-chip.hud-money', { 'aria-label': 'Money', onclick: () => (G.phone && G.phone.open ? G.phone.open('bank') : togglePanel(true)) }, iconEl('ui.coin', 1), H.moneyT);
  H.delta = el('div.hud-deltas');
  H.speed = el('div.hud-speed');
  H.pauseB = el('button', { 'aria-label': 'Pause', onclick: () => pause() }, '❚❚'); H.speed.append(H.pauseB); H.sp = {};
  for (const s of [1, 2, 4]) { H.sp[s] = el('button', { 'aria-label': `Speed ${s}x`, onclick: () => { G.state.speed = s; dirty = true; } }, s + 'x'); H.speed.append(H.sp[s]); }
  H.saved = el('span.hud-saved', { text: 'Saved' });
  H.ind = el('div.hud-ind');
  // bottom
  H.prompt = el('button.hud-prompt', { onclick: () => { const it = !G.busy && !G.cutscene && !G.modal && G.nearestInteractable(); if (it) G.useInteractable(it); } }, el('kbd', { text: 'E' }), H.promptT = el('span'));
  H.actL = el('span.hud-act-l'); H.actT = el('span.hud-act-t'); H.actFill = el('i');
  H.actX = el('button.hud-act-x', { 'aria-label': 'Stop', onclick: () => { if (G.busy && G.busy.canCancel !== false) G.endActivity(false); } }, 'Stop');
  H.act = el('div.hud-act', null, el('div.hud-act-top', null, H.actL, H.actT), el('div.hud-act-bar', null, H.actFill), H.actX);
  H.bagBadge = el('span.hud-badge'); H.phoneBadge = el('span.hud-badge');
  H.bag = el('button.hud-btn.hud-bag', { 'aria-label': 'Backpack', onclick: () => G.inv && G.inv.open() }, iconEl('ui.backpack', 2), H.bagBadge);
  H.phone = el('button.hud-btn.hud-phone', { 'aria-label': 'Phone', onclick: () => (G.phone && G.phone.open ? G.phone.open() : toast('No signal yet.', 'info')) }, iconEl('ui.phone', 3), H.phoneBadge);
  H.panel = el('div.hud-panel');
  H.paused = el('button.hud-paused', { onclick: () => pause(false) }, el('b', { text: 'Paused' }), el('span', { text: 'tap to continue' }));
  H.root.append(el('div.hud-tl', null, el('div.hud-tlrow', null, H.day, H.time), H.needs), el('div.hud-tr', null, el('div.hud-trrow', null, H.saved, H.money), H.delta, H.speed, H.ind), el('div.hud-bc', null, H.prompt, H.act), el('div.hud-br', null, H.bag, H.phone), H.panel, H.paused);
  root().prepend(H.root);
}

/* ---------- wellness panel ---------- */
function bar(v, cls) { return el('span.hp-bar' + (cls ? '.' + cls : ''), null, el('i', { style: { width: Math.max(0, Math.min(100, v)) + '%' } })); }
function renderPanel() {
  const N = G.needs, P = H.panel; if (!N) return; const y = P.scrollTop; P.textContent = '';
  const tier = N.moodTier(), mood = N.mood();
  P.append(el('div.hp-head', null, iconEl('mood.' + tier.id, 3), el('div.hp-mood', null, el('b', { text: `Feeling ${tier.label.toLowerCase()}` }), el('span', { text: `Mood ${mood}` + (tier.xpMult !== 1 ? ` · skill xp x${tier.xpMult}` : '') })), el('button.x', { 'aria-label': 'Close', onclick: () => togglePanel(false) }, 'x')));
  const g = el('div.hp-needs');
  const f = N.fitness(), fitCell = () => el('div.hp-need.fit', null, iconEl('need.fitness', 2), el('div.hp-ncol', null, el('div.hp-nrow', null, el('b', { text: FITNESS.name }), el('span', { text: N.fitnessLabel() }), el('em', { text: Math.round(f) })), bar(f, 'fit')));
  let gentle = false;
  for (const n of NEEDS) { const v = N.get(n.id), b = N.band(n.id); if (n.soft && !gentle) { gentle = true; g.append(fitCell(), el('div.hp-gentle', { text: 'Gentle needs' })); } g.append(el('div.hp-need.' + b.id + (n.soft ? '.soft' : ''), { 'data-need': n.id, title: 'Where can I fix this?', style: 'cursor:pointer', onclick: () => fixNeed(n) }, iconEl('need.' + n.id, 2), el('div.hp-ncol', null, el('div.hp-nrow', null, el('b', { text: n.name }), el('span', { text: b.label }), el('em', { text: Math.round(v) })), bar(v, b.id)))); }
  if (!gentle) g.append(fitCell());
  P.append(g);
  const ml = N.moodlets();
  if (ml.length) { const box = el('div.hp-mls'); for (const m of ml) box.append(el('div.hp-ml' + (m.mood < 0 ? '.neg' : ''), { title: m.desc }, iconEl(m.icon, 1), el('span', { text: m.name }), el('em', { text: (m.mood > 0 ? '+' : '') + m.mood }), m.left !== null && el('i', { text: hm(m.left) }))); P.append(el('div.hp-sub', { text: 'How you feel' }), box); }
  if (G.skills) { const sk = el('div.hp-skills'); for (const s of SKILLS) { const l = G.skills.level(s.id), nx = G.skills.next(s.id); sk.append(el('div.hp-skill', { title: s.desc }, iconEl('skill.' + s.id, 1), el('span', { text: s.name }), el('b', { text: l >= SKILL_MAX_LEVEL ? 'MAX' : 'Lv ' + l }), bar(nx ? nx.into / nx.need * 100 : 100, 'xp'))); } P.append(el('div.hp-sub', { text: 'Skills' }), sk); }
  if (G.money && G.money.bills && !G.phone) { const b = G.money.bills(); P.append(el('div.hp-sub', { text: `Bills due Monday 08:00: ${fmt(b.total)}` })); }
  P.scrollTop = y;
}
// tap a need -> "Where can I fix this?": the nearest suitable places, each row sets a waypoint
const FIX = { hunger: /food|restaurant|cafe|diner|noodle|pizza|bakery|grocer|market|stall|deli|ramen|burger|taco/, energy: /cafe|coffee|tea/, hygiene: /gym|bath|pool|\bspa\b/, fun: /cinema|arcade|theat|museum|club|bowling|music|karaoke|gallery|\bpark\b|show/, social: /cafe|\bbar\b|\bpub\b|club|plaza|\bpark\b/ };
const SOFT_IDS = Object.fromEntries(NEEDS.filter(n => n.soft).map(n => [n.id, 1]));   /* the gentle needs have their own place finder (src/sim/needs_extra.js) */
const HOME_TIP = { hunger: 'Home (cook)', energy: 'Home (sleep)', hygiene: 'Home (shower)', fun: 'Home (TV, games)' };
// data-driven matching lives in src/sim/navigator.js (G.nav.find: venue offers / guide types / home / friends, open-closed, closed last); the regex below is only a fallback
const hereAlready = id => { try { if (typeof id !== 'string' || !G.scene || !G.scene.roomId || !G.navGoals) return false; const p = G.places.get(id), r = p && (p.roomId || p.id); return !!r && G.navGoals.rootOf(r) === G.navGoals.rootOf(G.scene.roomId); } catch (e) { return false; } };
function fixPlaces(id) { if (SOFT_IDS[id]) { try { return (G.needsExtra && G.needsExtra.fix(id, 3)) || []; } catch (e) { return []; } } try { if (G.nav && G.nav.find) return G.nav.find(id, 3).map(q => ({ id: q.id, name: q.name + (q.note && !q.friend ? ' (' + q.note + ')' : ''), d: q.d, open: q.open })); } catch (e) { } return fixPlacesOld(id); }
function fixPlacesOld(id) {
  const re = FIX[id] || FIX.fun, P = G.places, p = G.player; let x = p.x, y = p.y, out = [];
  try { if (G.scene && G.scene.id !== 'city') { const d = String(G.state.flags.lastDoor || '').replace(/^door:/, ''), q = P.get(d) || P.get('door:' + d); if (q) { x = q.x; y = q.y; } } } catch (e) { }
  try { out = P.list().filter((q, i, A) => q && isFinite(q.x) && ['venue', 'stall', 'spot'].includes(q.kind) && A.findIndex(o => o.name === q.name) === i && re.test(((q.kind || '') + ' ' + (q.type || '') + ' ' + (q.cat || '') + ' ' + (q.tags || []).join(' ') + ' ' + (q.name || '')).toLowerCase()) && !/^home/.test(q.id)).map(q => [Math.hypot(q.x - x, q.y - y), q]).sort((a, b) => a[0] - b[0]).slice(0, 3).map(a => ({ id: a[1].id, name: a[1].name, d: a[0] })); } catch (e) { out = []; }
  if (id === 'fun' && G.guide && G.guide.near) try { for (const e of G.guide.near(x, y, 2, e => /show|venue|fun|try|event|music|art/.test(((e.chapter || '') + ' ' + (e.cat || '') + ' ' + (e.tags || []).join(' ')).toLowerCase()))) if (e.placeId && !out.some(o => o.id === e.placeId)) out.push({ id: e.placeId, name: e.title, d: Math.hypot(e.x - x, e.y - y) }); out = out.sort((a, b) => a.d - b.d).slice(0, 3); } catch (e) { }
  if (id === 'social' && G.social && G.social.whereIs && G.social.friends) try { for (const f of G.social.friends()) { const w = G.social.whereIs(f.id || f); if (w && isFinite(w.x)) { out.unshift({ id: w.placeId || { x: w.x, y: w.y, name: f.name || 'Friend' }, name: (f.name || 'A friend') + (w.name ? ' at ' + w.name : ''), d: Math.hypot(w.x - x, w.y - y) }); break; } } out = out.slice(0, 3); } catch (e) { }
  if (HOME_TIP[id]) try { const h = G.housing && G.housing.current && G.housing.current(), hp = h && (P.get('home:' + h.id) || P.get(h.placeId) || P.get(h.id)); if (hp) out.push({ id: hp.id, name: HOME_TIP[id], d: Math.hypot(hp.x - x, hp.y - y) }); } catch (e) { }
  return out;
}
const SOFT_NOTE = { comfort: 'Comfort follows your home: keep it clean and make it cosy. It fades slowly while you are out.', outdoors: 'Fresh air fills this up: any street does a little, parks, the pier and the lookout do a lot. It drains indoors.', inspiration: 'Culture and novelty: museums, films, shows, books, music, views, and anywhere or anything you have not tried before.' };
function fixNeed(n) {
  togglePanel(false);   /* the panel sat on top of this window on phones; the chooser replaces it */
  const L = fixPlaces(n.id), m = modal({ title: n.name + ': where can I fix this?', cls: 'need-fix' });
  if (SOFT_NOTE[n.id]) m.body.append(el('p.nf-note', { text: SOFT_NOTE[n.id] }));
  if (!L.length) m.body.append(el('div', { text: 'Nothing suitable on the map yet - explore a little.' }));
  for (const q of L) m.body.append(el('button', { style: 'display:flex;gap:8px;align-items:center;width:100%;margin:4px 0;text-align:left', 'data-fix': typeof q.id === 'string' ? q.id : 'pos', onclick: () => { m.close(); togglePanel(false); try { if (hereAlready(q.id)) { G.phone.setWaypoint(q.id); toast('It is right here: follow the arrow.', 'info', 3000); return; }   /* QA9: not a 'WALK 1 min, 10 m' Map card for the building you stand in */
      if (!(G.phone.routeTo && G.phone.routeTo(q.id))) { G.phone.setWaypoint(q.id); toast('Waypoint set: ' + q.name + '.', 'good', 2600); } } catch (e) { toast('No route there yet.'); } } },
    el('span', { style: 'flex:1', text: q.name }), el('small', { text: G.nav && G.nav.fmtDist ? G.nav.fmtDist(q.d) : Math.max(1, Math.round(q.d / 10)) * 10 + ' m' }), q.open == null ? null : el('small', { style: 'padding:0 4px;border:2px solid #2a2733;background:' + (q.open ? '#bfe3a1' : '#f0b0a0'), text: q.open ? 'OPEN' : 'CLOSED' })));
  return m;
}
function togglePanel(on) { panelOpen = on === undefined ? !panelOpen : !!on; H.panel.classList.toggle('on', panelOpen); H.needs.classList.toggle('on', panelOpen); if (panelOpen) renderPanel(); }
function pause(on) { on = on === undefined ? !pauseOn : !!on; if (on === pauseOn) return; pauseOn = on; G.modal += on ? 1 : -1; H.paused.classList.toggle('on', on); H.pauseB.classList.toggle('on', on); }

/* ---------- updates ---------- */
function refresh() {
  if (!H || !shown) return; dirty = false;
  const n = G.now(), night = !!(G.env && G.env.night), wk = (G.weather && G.weather.current && (G.weather.current() || {}).kind) || G.state.weather;
  H.clock.textContent = n.clock; H.date.textContent = `${n.weekdayName} · ${n.seasonName} ${n.dayOfMonth}`; swapIcon(H.wx, weatherIcon(wk, night), 2);
  const bal = G.state.player.money; H.moneyT.textContent = fmt(bal); H.money.classList.toggle('neg', bal < 0);
  if (G.needs) { for (const d of NEEDS) { const v = G.needs.get(d.id), b = G.needs.band(d.id).id, m = meters[d.id]; m.fill.style.width = Math.round(v) + '%'; if (m.b !== b) { m.b = b; m.m.className = 'hud-need ' + (m.soft ? 'soft ' : '') + b; } } swapIcon(H.face, 'mood.' + G.needs.moodTier().id, 1); }
  for (const s of [1, 2, 4]) H.sp[s].classList.toggle('on', G.state.speed === s && !pauseOn);
  const un = badges.phone !== undefined ? badges.phone : (G.messages && G.messages.unread ? G.messages.unread() : 0); H.phoneBadge.textContent = un || ''; H.phoneBadge.classList.toggle('on', !!un);
  const bb = badges.bag !== undefined ? badges.bag : ''; H.bagBadge.textContent = bb || ''; H.bagBadge.classList.toggle('on', !!bb);
  if (G.inv) H.bag.classList.toggle('full', G.inv.free() === 0);
  if (panelOpen) renderPanel();
}
function fast() {
  const busy = G.busy, cut = !!G.cutscene; H.root.classList.toggle('cut', cut);
  if (busy && !cut) {
    if (!H.act.classList.contains('on')) { H.act.classList.add('on'); H.actL.textContent = busy.label || 'Busy'; H.actX.style.display = busy.canCancel === false ? 'none' : ''; }
    else if (H.actL.textContent !== (busy.label || 'Busy')) { H.actL.textContent = busy.label || 'Busy'; H.actX.style.display = busy.canCancel === false ? 'none' : ''; }
    const open = busy.minutes >= 5000;   /* QA9: an open-ended activity (a class: minutes 9999) said '166h 39m left' */
    H.actFill.style.width = open ? '100%' : (100 - busy.left / Math.max(1, busy.minutes) * 100).toFixed(1) + '%'; H.actT.textContent = open ? '' : hm(busy.left) + ' left';
  } else H.act.classList.remove('on');
  /* QA8 (perf): the nearest-thing scan walks every interactable of the scene; it runs again only when the player has moved, the scene / state changed, or every 6th frame (people walking into range) */
  const on = !busy && !cut && !G.modal && !!G.scene, p = G.player, key = on ? G.scene.id : '';
  let it = lastPrompt; if (!on) it = null; else if (key !== pk.s || !p || Math.abs(p.x - pk.x) > .2 || Math.abs(p.y - pk.y) > .2 || ++pk.n >= 6) { pk.s = key; pk.n = 0; if (p) { pk.x = p.x; pk.y = p.y; } it = G.nearestInteractable(); }
  if (!on) pk.s = '';
  if (it !== lastPrompt) { lastPrompt = it; H.prompt.classList.toggle('on', !!it); if (it) H.promptT.textContent = it.label || 'Use'; }
}
function onFrame(dt) {
  if (!shown) return; acc += dt; fast();
  if (acc > .25 || (dirty && acc > .08)) { acc = 0; refresh(); }
}
function moneyDelta(d) { if (!shown || !d) return; const e = el('span.hud-delta' + (d < 0 ? '.neg' : ''), { text: (d > 0 ? '+' : '-') + fmt(Math.abs(d)) }); H.delta.append(e); setTimeout(() => e.remove(), 1900); while (H.delta.children.length > 3) H.delta.firstChild.remove(); dirty = true; }
function saved() { H.saved.classList.add('on'); clearTimeout(H._st); H._st = setTimeout(() => H.saved.classList.remove('on'), 1600); }
function autosave() { if (!canSave()) return; if (performance.now() - lastSaveT < 1500) return; lastSaveT = performance.now(); try { if (G.save()) saved(); } catch (e) { console.error(e); } }
function show() { shown = true; H.root.classList.remove('off'); dirty = true; refresh(); }
function hide() { shown = false; H.root.classList.add('off'); if (pauseOn) pause(false); togglePanel(false); }
function addIndicator(o) {
  if (indicators.has(o.id)) indicators.get(o.id).remove();
  const ic = el('span.hud-ind-ic'), tx = el('span'), e = el(o.onclick ? 'button.hud-chip.hud-indic' : 'div.hud-chip.hud-indic', { title: o.title, onclick: o.onclick }, ic, tx);
  const h = { el: e, set(p) { if (p.icon) swapIcon(ic, p.icon, 1); if (p.text !== undefined) tx.textContent = p.text; if (p.cls !== undefined) e.className = 'hud-chip hud-indic ' + p.cls; if (p.hidden !== undefined) e.style.display = p.hidden ? 'none' : ''; return h; }, remove() { e.remove(); indicators.delete(o.id); } };
  h.set({ icon: o.icon, text: o.text || '', cls: o.cls || '' }); H.ind.append(e); indicators.set(o.id, h); return h;
}

/* QA round 3: the guide arrow (z 20), clamped to the top edge, used to sit on top of toasts (z 6). While they would overlap, the toast column slides down under
   the arrow (margin-top, so navigator.js can keep moving #toasts' own top under the trip strip). */
let toastT = 0, toastM = 0;
function toastsClear(dt) {
  if ((toastT -= dt) > 0) return; toastT = .15; const ts = document.getElementById('toasts'), ar = document.getElementById('nav-arrow'); if (!ts) return;
  let m = 0; const r = ts.getBoundingClientRect();
  if (ar && r.height > 0 && getComputedStyle(ar).display !== 'none') { const a = ar.getBoundingClientRect(), top = r.top - toastM, bot = r.bottom - toastM; if (a.width && a.left < r.right && a.right > r.left && a.top < bot && a.bottom > top && a.top < innerHeight / 2) m = Math.ceil(a.bottom + 6 - top); }
  if (m !== toastM) { toastM = m; ts.style.marginTop = m ? m + 'px' : ''; }
}
export function init() {
  injectCss(); build();
  G.hud = { show, hide, refresh, addIndicator, togglePanel, pause, saved, setBadge: (k, v) => { badges[k] = v; dirty = true; }, setMyDay: o => { if (o.soon !== undefined) H.day.classList.toggle('soon', !!o.soon); if (o.badge !== undefined) { H.dayBadge.textContent = o.badge || ''; H.dayBadge.classList.toggle('on', !!o.badge); } }, get visible() { return shown; }, get el() { return H.root; } };
  G.on('frame', onFrame); G.on('frame', toastsClear);
  for (const ev of ['needs:change', 'inv:change', 'hour', 'weather', 'load', 'msg:new', 'moodlet', 'skill:up']) G.on(ev, () => { dirty = true; });
  G.on('money', moneyDelta);
  G.on('game:start', show); G.on('ready', () => { if (!G.started) show(); });
  G.on('title:open', hide);
  G.on('scene', () => { togglePanel(false); setTimeout(autosave, 700); });
  G.on('hour', (h, abs) => { if (abs - lastHours >= 2) { lastHours = abs; autosave(); } });
  G.on('activity:done', (id, r) => { if (id === 'sleep' && r && r.minutes > 60) setTimeout(autosave, 50); });
  G.on('use', () => togglePanel(false));
  G.on('key', k => { if (!shown) return; if (k === 'p') pause(); else if (k === '1') G.state.speed = 1; else if (k === '2') G.state.speed = 2; else if (k === '3' || k === '4') G.state.speed = 4; else if (k === 'tab' || k === 'n') togglePanel(); else if (k === 'm' || k === 'q') G.phone && G.phone.open && G.phone.open(); else return; dirty = true; });
  addEventListener('keydown', e => { if (pauseOn && (e.key === 'p' || e.key === 'P' || e.key === 'Escape' || e.key === ' ')) { e.preventDefault(); pause(false); } else if (panelOpen && e.key === 'Escape') togglePanel(false); });
  G.cv && G.cv.addEventListener('pointerdown', () => { if (panelOpen) togglePanel(false); });
  // debug helpers
  G.debugSim = {
    fillNeeds() { for (const n of NEEDS) G.needs.set(n.id, 100); }, setNeed: (k, v) => G.needs.set(k, v),
    give: (id, n = 1) => G.inv.add(id, n), cash: (n = 1000) => G.money.add(n, 'Debug'),
  };
}
