// Goals widget + tutorial hint bubble + captions. Styles: goals.css.
//
// Widget (#goalsw, top-left under the HUD chips, collapsible; state G.state.goals.collapsed): three sections, always named
//   "Goals" (G.goals items with group 'goal', grouped by their list title), "Opportunities" (group 'opportunity') and
//   "Appointments" (the next planner entries of the coming 3 days, story beats included). Never "missions/quests".
//   Tap a goal -> its hint as a toast (and a map waypoint when it has a placeId); tap an appointment -> planner app.
//   Re-renders on 'goals:change', 'goal:done', 'story:offer', 'story:beat', 'appt:*', 'day', 'load', 'game:start'.
//   MY DAY (owner msg 107): when ui/myday.js is there (G.myDayUI.chip()), the widget is only its one-line chip ("Next · 09:00 Shift at ..." / "To do · ..." /
//   the gold Chapter line): a tap opens the My Day sheet, where the Goals, Opportunities and the schedule now live as sections. The list body is not drawn.
//   G.goals, the "done" toast, the hint bubble and the captions work exactly as before.
//
// Exports (also reachable as G.intro.hint / G.goalsUI):
//   hint(text | null, target?, opts?)   one small tutorial bubble at the top of the screen. target = CSS selector | DOM element |
//        world position / entity {x, y, z?, h?} | function returning one of those (re-evaluated ~4x per second, so it survives
//        re-rendered UIs). DOM targets get a pulsing outline (.tut-hl), world targets a bouncing arrow.
//        opts: { skip: fn (adds a small button), skipLabel, onTap: fn }
//   caption(who | null, text, ms = 3600)   non-modal speech caption (who null = narrator style);  caption() clears it
//   skipButton(label, fn) -> remove()      a lone "Skip" button bottom-right (cutscenes)
//   refresh()                              re-render the widget
import { G } from '../core/game.js';
import { el, root, toast } from './kit.js';

export const order = 130;
const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
let W = null, H = null, cap = null, capT = 0, dirty = true, liveUI = false;

function injectCss() { if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/goals.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/goals.css' })); }
const gs = () => G.state.goals || {};
export const fmtWhen = t => { const d = Math.floor(t / 1440), d0 = Math.floor(G.state.t / 1440), m = Math.floor(t % 1440), hh = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); return (d === d0 ? 'Today' : d === d0 + 1 ? 'Tomorrow' : WD[d % 7]) + ' ' + hh; };

function build() {
  W = el('div', { id: 'goalsw' });
  W.head = el('button.gw-head', { onclick: () => { if (G.myDayUI && G.myDayUI.chip) { G.myDay.open(); return; } const s = gs(); s.collapsed = !W.classList.contains('shut'); render(); } });
  W.body = el('div.gw-body'); W.append(W.head, W.body);
  const hud = document.getElementById('hud'); if (hud && hud.parentNode === root()) root().insertBefore(W, hud); else root().append(W);
}
function goalRow(g, cls) {
  return el('button.gw-item' + (g.done ? '.done' : '') + (cls ? '.' + cls : ''), { 'data-g': g.id, onclick: () => { if (g.hint && !g.done) toast(tapWords(g.hint), 'info', 3400); if (g.placeId && !g.done) wayTo(g.placeId, !g.hint); } },
    el('span.gw-box'), el('span', null, g.shown || g.text, g.placeId && !g.done ? pin() : null));
}
const pName = id => { try { const p = G.places && G.places.get && G.places.get(id); return p && p.name ? p.name : ''; } catch (e) { return ''; } };
const pin = () => el('span.gw-pin', { title: 'Tap to set a waypoint', style: 'display:inline-block;width:6px;height:6px;margin:0 2px 1px 6px;background:#e0453a;border:1px solid #2a2733;border-radius:50% 50% 50% 0;transform:rotate(-45deg)' });
function wayTo(placeId, say = true) { if (!G.phone || !G.phone.setWaypoint) return false; try { G.phone.setWaypoint(placeId); } catch (e) { return false; } if (say) toast('Waypoint set: ' + (pName(placeId) || 'follow the arrow') + '.', 'good', 2600); return true; }
function appts() {
  const P = G.planner; if (!P || !P.list) return []; let L = [];
  try { L = P.list(G.state.t - 240, G.state.t + 3 * 1440, { events: false }).filter(a => !a.event && a.s !== 3 && a.s !== 4 && a.t + (a.dur || 60) > G.state.t && !(a.data && a.data.beat && G.story && G.story.beat(a.data.beat) && G.story.beat(a.data.beat).st === 'done')); } catch (e) { L = []; }
  // the planner dictates this list: ALL of today's entries (any kind) in time order, then a peek at the next days
  const d0 = Math.floor(G.state.t / 1440), today = L.filter(a => Math.floor(a.t / 1440) === d0).slice(0, 8), later = L.filter(a => Math.floor(a.t / 1440) !== d0).slice(0, Math.max(1, 3 - today.length));
  L = today.concat(later); L.today = today.length; return L;
}
function render() {
  dirty = false; if (!W) return;
  if (G.myDayUI && G.myDayUI.chip) {   /* My Day owns the lists; this is its "what is next" line */
    let c = null; try { c = G.myDayUI.chip(); } catch (e) { c = null; }
    W.classList.add('md'); W.classList.toggle('empty', !c || !c.text); W.classList.toggle('gold', !!(c && c.gold)); W.classList.add('shut'); W.body.replaceChildren();
    if (c && c.text) W.head.replaceChildren(el('i', { text: c.label || 'Next' }), el('span', { text: c.text }));
    return;
  }
  const all = G.goals ? G.goals.list() : [], goals = all.filter(g => g.group !== 'opportunity'), opps = all.filter(g => g.group === 'opportunity'), ap = appts();
  const open = goals.filter(g => !g.done).length;
  W.classList.toggle('empty', !all.length && !ap.length);
  if (gs().collapsed === undefined && innerWidth < 500) gs().collapsed = true;
  W.classList.toggle('shut', !!gs().collapsed);
  W.head.replaceChildren(...[el('span', { text: gs().collapsed ? '+' : '-' }), el('span', { text: 'Goals' }), el('i', { text: goals.length ? `${goals.length - open}/${goals.length}` : '' }), ap.today ? el('i', { text: '· ' + ap.today + ' today' }) : null, opps.length || ap.length > (ap.today || 0) ? el('i', { text: '· ' + (opps.filter(o => !o.done).length + ap.length - (ap.today || 0)) + ' more' }) : null].filter(Boolean));   // replaceChildren(null) would print the word 'null' (QA wave A)
  const B = W.body; B.replaceChildren();
  if (goals.length) { B.append(el('div.gw-sec', { text: 'Goals' })); let last = null; for (const g of goals) { if (g.listTitle && g.listTitle !== last) { last = g.listTitle; B.append(el('div.gw-list', { text: last })); } B.append(goalRow(g)); } }
  if (opps.length) { B.append(el('div.gw-sec', { text: 'Opportunities' })); for (const g of opps) B.append(goalRow(g, 'opp')); }
  if (ap.length) { B.append(el('div.gw-sec', { text: 'Appointments' })); for (const a of ap) B.append(el('button.gw-item.appt', { 'data-a': a.id, onclick: () => { if (!(a.placeId && wayTo(a.placeId)) && G.phone && G.phone.open) G.phone.open('planner', { appt: a.id }); } }, el('span.gw-box'), el('span', null, a.title, a.placeId ? pin() : null, el('span.gw-when', { text: fmtWhen(a.t) + (a.placeId && pName(a.placeId) && !a.title.includes(pName(a.placeId)) ? ' · ' + pName(a.placeId) : '') + (a.s === 2 ? ' · now' : '') })))); }
}
export function refresh() { dirty = true; }

/* ---------- hint bubble ---------- */
function clearHl() { if (H && H.hl) { H.hl.classList.remove('tut-hl'); H.hl = null; } }
/* QA6: hints read right for the device: on a touch screen "Click" becomes "Tap" */
const touchy = () => typeof window !== 'undefined' && ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);
export const tapWords = t => (t && touchy() ? String(t).replace(/\bClick(ing)?\b/g, (m, g) => g ? 'Tapping' : 'Tap').replace(/\bclick(ing)?\b/g, (m, g) => g ? 'tapping' : 'tap') : t);
export function hint(text, target, opts = {}) {
  if (H) { clearHl(); H.box.remove(); H.arrow.remove(); H = null; }
  if (!text) return;
  text = tapWords(text);
  injectCss();
  const box = el('div.tut', { onclick: () => opts.onTap && opts.onTap() }, el('span', { text }), opts.skip ? el('button.tut-skip', { text: opts.skipLabel || 'Skip intro', onclick: e => { e.stopPropagation(); opts.skip(); } }) : null);
  const arrow = el('div.tut-arrow', { style: { display: 'none' } });
  root().append(arrow, box); H = { box, arrow, target, hl: null, world: null, k: 0, low: false }; tickHint();
}
function tickHint() {
  if (!H) return; let t = H.target; try { if (typeof t === 'function') t = t(); if (typeof t === 'string') t = document.querySelector(t); } catch (e) { t = null; }
  if (t && t.nodeType) { H.world = null; if (H.hl !== t) { clearHl(); H.hl = t; t.classList.add('tut-hl'); } }
  else { clearHl(); H.world = t && typeof t.x === 'number' ? t : null; }
}
function frame() {
  if (cap && performance.now() > capT) { cap.remove(); cap = null; }
  if (!H) return; const w = H.world;
  /* QA8: with the phone up, the bubble sat on the app's own header (the ride's destination, the Chats tabs); it moves to the bottom unless what it points at is down there */
  if (++H.k % 10 === 1) { let low = false; try { if (G.phone && G.phone.isOpen) { const hl = H.hl && H.hl.getBoundingClientRect(); low = !hl || !hl.height || hl.top < innerHeight * .55;
      /* owner msg 110: down there it covered the reply buttons in Messages; if any phone button sits in the band the bubble would take, it stays at the top */
      if (low) { const bh = (H.box.offsetHeight || 60) + 10, y1 = innerHeight - 62, y0 = y1 - bh; for (const b of document.querySelectorAll('button, [role=button], input, textarea')) { if (H.box.contains(b) || !b.offsetParent) continue; const r = b.getBoundingClientRect(); if (r.height && r.bottom > y0 && r.top < y1 && r.width > 30) { low = false; break; } } } } } catch (e) { low = false; } if (low !== H.low) { H.low = low; H.box.classList.toggle('low', low); } }
  if (!w || G.modal) { H.arrow.style.display = 'none'; return; }
  /* QA8: 2.7 (a head / door height) left the arrow floating over the player for a floor spot or a bag on the belt; plain points and props get a low arrow */
  const s = G.toScreen(w.x, w.y, (w.z === undefined ? (G.world ? G.world.heightAt(w.x, w.y) : 0) : w.z) + (w.h || (w.sprite || w.bb || !('label' in w || 'ent' in w || 'name' in w) ? 1.3 : 2.7)));
  H.arrow.style.display = ''; H.arrow.style.transform = `translate(${Math.round(Math.max(14, Math.min(innerWidth - 14, s.x)))}px,${Math.round(Math.max(30, Math.min(innerHeight - 20, s.y)))}px)`;
}
export function caption(who, text, ms = 3600) {
  if (cap) { cap.remove(); cap = null; } if (!text) return; injectCss();
  cap = el('div.tut-cap' + (who ? '' : '.narr'), null, who ? el('b', { text: who }) : null, el('span', { text })); root().append(cap); capT = performance.now() + ms;
}
export function skipButton(label, fn) { injectCss(); const b = el('button.tut-skipcut', { text: label, onclick: () => fn() }); root().append(b); return () => b.remove(); }

/* QA9: a done line that must match what is really there (the first-evening fridge: the starter pantry, or truly empty) */
function liveDone(id, g) {
  try {
    if (id === 'fridge' && (!g || !g.list || g.list === 'first_evening') && G.inv && G.inv.fridge) {
      const a = G.inv.fridge.items(); if (!a.length) return 'Empty. One lonely ketchup packet. Not even yours.';
      const nm = s => { const it = G.inv.item(s.id); return it ? it.name.toLowerCase() : s.id; };
      return 'A starter cupboard: ' + a.slice(0, 3).map(nm).join(', ') + (a.length > 3 ? ' and more' : '') + '. Enough to cook tonight.';
    }
  } catch (e) { /* fall back to the written line */ }
  return null;
}
export function init() {
  injectCss(); build();
  G.goalsUI = { hint, caption, skipButton, refresh, fmtWhen };
  for (const ev of ['goals:change', 'story:offer', 'story:beat', 'appt:add', 'appt:remove', 'appt:done', 'appt:missed', 'appt:start', 'day', 'load', 'game:start', 'ready', 'myday:change']) G.on(ev, refresh);
  G.on('goal:done', (id, g) => {
    render(); const r = W.querySelector(`[data-g="${id}"]`); if (r) r.classList.add('pop');
    toast(liveDone(id, g) || (g && g.doneText) || 'Done: ' + ((g && g.text) || id), 'good', 3600); try { G.audio && G.audio.sfx && G.audio.sfx('success'); } catch (e) { /* no audio */ }
  });
  G.on('frame', frame); G.on('game:start', () => { liveUI = true; }); G.on('ready', () => { if (!G.started) liveUI = true; });
  setInterval(() => {
    tickHint(); if (!W) return;
    const off = !!G.cutscene || !!H || !liveUI;
    W.classList.toggle('off', off); if (dirty && !off) render();
  }, 250);
}
