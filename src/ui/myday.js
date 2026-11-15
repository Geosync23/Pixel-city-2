// MY DAY — the HUD button's compact sheet, the "what is next" chip, and the first-time walk-through. Data: src/sim/myday.js (G.myDay) + src/sim/planner.js.
// The button itself is built by ui/hud.js (top-left, first in the row); the chip under the needs bar is the old Goals widget's head (ui/goals.js asks chip()).
//
// The sheet answers "what do I do next?" in one look:
//   NEXT (what, when, how far, "Take me there")  ·  the open Chapter in gold  ·  the rest of today (+ "any time today")  ·  3-5 IDEAS for the free time ahead,
//   each with a one-line why, [Add] and a small x ("Not interested")  ·  To do (the Goals list)  ·  Opportunities you took up  ·  a peek at tomorrow.
//   When nothing is planned the sheet leads with the ideas. The simulation is paused while it is open (like the phone).
//
// Fills in G.myDay:
//   open(opts?) -> Promise<bool added>   resolves when the sheet closes. opts: { teach: true (ask for one idea to be added), explain: true (replay the walk-through),
//                                        gap: { from, to } (ideas for that stretch) }
//   close()      addIdea(opts?) -> Promise<bool>   = open({ teach: true }): resolves true as soon as the player has added an idea (the Chapter engine's `myday_add`)
//   explain()    replay the 3-step walk-through (opens the sheet if needed)        isOpen -> bool
// G.myDayUI = { chip() -> { label, text, gold? } | null (for ui/goals.js), refresh() }
// The walk-through runs by itself the first time the sheet opens (G.state.myday.seen).
import { G } from '../core/game.js';
import { el, root, toast } from './kit.js';
import { iconEl } from './_icons.js';
import { defaultTime } from '../sim/myday.js';

export const order = 133;
const DAY = 1440;
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const hh = t => { const m = ((Math.round(t) % DAY) + DAY) % DAY; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const now = () => G.state.t;
const pName = id => safe(() => G.places.get(id).name, '');
const dur = m => (m >= 60 ? (m % 60 ? `${Math.floor(m / 60)} h ${Math.round(m % 60)} min` : `${Math.round(m / 60)} h`) : `${Math.max(1, Math.round(m))} min`);
const SRC_ICON = { work: 'ui.clock', story: 'ui.heart', family: 'rel.family', friend: 'rel.friend', class: 'myday.class', delivery: 'ui.bag', ticket: 'ui.star', mine: 'ui.check' };
let M = null, flashT = 0, lastChip = '';

function injectCss() { if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/myday.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/myday.css' })); }
const srcOf = a => safe(() => G.planner.srcOf(a), 'mine'), srcLabel = a => safe(() => G.planner.SRC_LABEL[srcOf(a)], '');
const whereOf = a => (a.placeId ? pName(a.placeId) : a.data && a.data.pos ? a.data.pos.name : '');
const destOf = a => (a.placeId ? a.placeId : a.data && a.data.pos ? a.data.pos : null);
export function whenText(a) {
  const t = now(); if (a.flex) return 'Any time today'; if (a.t <= t) return `Now, until ${hh(a.t + a.dur)}`;
  const m = Math.round(a.t - t), d = Math.floor(a.t / DAY) - Math.floor(t / DAY);
  return d > 0 ? `${d === 1 ? 'Tomorrow' : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][Math.floor(a.t / DAY) % 7]} ${hh(a.t)}` : m < 60 ? `In ${m} min · ${hh(a.t)}` : `${hh(a.t)} to ${hh(a.t + a.dur)}`;
}
export function travelText(a) {
  const tr = safe(() => G.planner.travelTo(a), null); if (!tr) return destOf(a) ? 'You are here' : '';
  const left = a.t - now(), how = tr.best < tr.walk ? `${tr.walk} min walk, ${tr.best} by ${tr.mode}` : `${tr.walk} min walk`;
  return how + (!a.flex && left > 0 && left < 300 ? (left >= tr.walk + 10 ? ` · leave by ${hh(a.t - tr.walk - 10)}` : ' · time to go') : '');
}
function go(dest) {
  close(); if (!dest) return;
  try { if (!(G.phone.routeTo && G.phone.routeTo(dest))) { G.phone.setWaypoint(dest); toast('Follow the arrow.', 'good', 2400); } } catch (e) { toast('No route there yet.', 'info'); }
}

/* ---------- the chip under the needs bar + the button's pulse ---------- */
function chip() {
  if (!G.myDay) return null; const sc = safe(() => G.myDay.schedule(), null); if (!sc) return null;
  const n = sc.next; if (n) return { label: n.flex || n.t > now() ? 'Next' : 'Now', text: (n.flex ? '' : hh(n.t) + ' ') + n.title };
  const g = sc.goals.find(x => !x.done); if (g) return { label: 'To do', text: g.shown || g.text };
  if (sc.chapter) return { label: 'Story', text: sc.chapter.text, gold: true };
  const o = sc.opps.find(x => !x.done); if (o) return { label: 'To do', text: o.text };
  const k = safe(() => G.myDay.ideas({ n: 5 }).length, 0); return k ? { label: 'Free', text: `${k} idea${k === 1 ? '' : 's'} for right now` } : null;
}
function syncHud() {
  const n = safe(() => G.planner.next(), null); let soon = false;
  if (n && !n.flex && n.s < 2 && n.t > now()) { const tr = safe(() => G.planner.travelTo(n), null); soon = !!tr && n.t - now() <= Math.max(20, tr.walk + 12); }
  safe(() => G.hud.setMyDay({ soon }));
  const c = safe(() => chip(), null), key = c ? c.label + c.text : ''; if (key !== lastChip) { lastChip = key; safe(() => G.goalsUI.refresh()); }
}

/* ---------- sheet ---------- */
function flash(text, undo) {
  if (!M) return; M.flash.replaceChildren(...[el('span', { text }), undo ? el('button.md-link', { text: 'Undo', onclick: () => { undo(); M.flash.classList.remove('on'); render(); } }) : null].filter(Boolean)); M.flash.classList.add('on');
  clearTimeout(flashT); flashT = setTimeout(() => { if (M) M.flash.classList.remove('on'); }, 4200);
}
function schedRow(a, isNext) {
  const src = srcOf(a), sub = [whereOf(a) && !String(a.title).includes(whereOf(a)) ? whereOf(a) : '', a.withNpc ? 'with ' + safe(() => G.planner.npcShort(a.withNpc), a.withNpc) : '', srcLabel(a)].filter(Boolean).join(' · ');
  const open = M.openRow === a.id, r = el('div.md-item.' + src + (a.t <= now() && !a.flex ? '.now' : '') + (M.pop === a.id ? '.pop' : '') + (open ? '.open' : ''), { 'data-a': a.id });
  r.append(el('button.md-row', { onclick: () => { M.openRow = open ? null : a.id; render(); } },
    el('span.md-time', null, a.flex ? el('small', { text: 'any time' }) : hh(a.t), !a.flex ? el('small', { text: dur(a.dur) }) : null),
    el('span.md-main', null, el('b', { text: a.title }), el('small', { text: sub })), iconEl(SRC_ICON[src] || 'ui.calendar', 1)));
  if (open || isNext) {
    const d = destOf(a), tt = travelText(a), acts = el('div.md-acts');
    if (tt) acts.append(el('span.md-travel', { text: tt }));
    if (d && tt !== 'You are here') acts.append(el('button.md-go', { 'data-go': a.id, onclick: () => go(d) }, iconEl('ui.pin', 1), 'Take me there'));
    if (open) { acts.append(el('button.md-sm', { text: 'Details', onclick: () => { close(); safe(() => G.phone.open('planner', { appt: a.id })); } }));
      if (src === 'mine') acts.append(el('button.md-sm', { 'data-rm': a.id, text: 'Remove', onclick: () => { const keep = Object.assign({}, a); safe(() => G.planner.remove(a.id)); M.openRow = null; render(); flash(`Taken off your day: ${a.title}.`, () => safe(() => G.planner.add(Object.assign({}, keep, keep.flex ? { flex: true } : null, { chosen: true })))); } })); }
    r.append(acts);
  }
  return r;
}
function ideaRow(i, gap) {
  const r = el('div.md-idea' + (i.poor ? '.poor' : ''), { 'data-idea': i.id });
  const doAdd = force => {
    const t = gap && !i.fixed ? (defaultTime(i, gap.from) || Math.max(gap.from, Math.ceil(now() / 5) * 5)) : i.fixed || i.window ? defaultTime(i) : undefined;
    const C = t !== undefined && t !== null && !force ? safe(() => G.planner.conflicts(t, Math.min(i.dur || 60, 90)), []) : [];
    if (C.length) { r.querySelector('.md-conf') && r.querySelector('.md-conf').remove();
      r.append(el('div.md-conf', null, el('span', { text: `That is at the same time as ${C[0].title} (${hh(C[0].t)} to ${hh(C[0].t + C[0].dur)}).` }), el('button.md-sm', { 'data-anyway': 1, text: 'Add it anyway', onclick: () => doAdd(true) }), el('button.md-sm', { text: 'Leave it', onclick: () => r.querySelector('.md-conf').remove() }))); return; }
    const id = safe(() => G.myDay.add(i, t === null ? undefined : t), null); if (!id) return flash('That one cannot be added just now.');
    M.added = true; M.pop = typeof id === 'string' ? id : null; M.openRow = null; render();
    flash(i.kind === 'opp' ? `You took it up: ${i.title}.` : `On your day: ${i.title}${t ? ' at ' + hh(t) : ''}.`);
    safe(() => G.audio.sfx('success'));
    if (M.teach) setTimeout(() => { if (M && M.teach) close(); }, 1500);
  };
  r.append(el('button.md-imain', { onclick: () => { M.openIdea = M.openIdea === i.id ? null : i.id; render(); } }, iconEl(i.icon || 'myday.idea', 2), el('span.md-main', null, el('b', { text: i.title }), el('small', { text: i.why || '' }))),
    el('button.md-add', { 'data-add': i.id, 'aria-label': 'Add to my day: ' + i.title, onclick: () => doAdd(false) }, i.kind === 'opp' ? 'Take' : 'Add'),
    el('button.md-no', { 'data-no': i.id, 'aria-label': 'Not interested', title: 'Not interested', onclick: () => { safe(() => G.myDay.dismiss(i)); render(); flash('Not for you. Fewer like that from now on.', () => safe(() => G.myDay.undismiss(i))); } }, 'x'));
  if (M.openIdea === i.id) { const more = el('div.md-more'); if (i.blurb || i.text) more.append(el('p', { text: i.blurb || i.text }));
    more.append(el('div.md-acts', null, i.placeId || i.pos ? el('button.md-sm', { text: 'Show me the way', onclick: () => go(i.placeId || i.pos) }) : null,
      i.kind !== 'opp' && !i.fixed ? el('button.md-sm', { text: 'Pick a time', onclick: () => { close(); safe(() => G.phone.open('planner', { idea: i.id })); } }) : null,
      i.kind === 'opp' ? el('button.md-sm', { text: 'See it in Opportunities', onclick: () => { close(); safe(() => G.phone.open('opps')); } }) : null));
    r.append(more); }
  return r;
}
const sec = (title, right) => el('div.md-sec', null, el('span', { text: title }), right || null);
function render() {
  if (!M) return; const sc = G.myDay.schedule(), B = M.body, y = B.scrollTop, t = now(), n = G.now(); B.replaceChildren();
  M.date.textContent = `${n.weekdayName} · ${n.seasonName} ${n.dayOfMonth} · ${n.clock}`;
  const rest = sc.today.filter(a => a !== sc.next), flex = sc.flex.filter(a => a !== sc.next), empty = !sc.next && !rest.length && !flex.length;
  /* which stretch the ideas are for: right now when free, otherwise the next free gap (or the one the player tapped) */
  let gap = M.gap || null; if (!gap) { const busy = sc.today.find(a => a.t <= t + 20 && a.t + a.dur > t + 20), g = sc.free.find(x => x.to > t + 30); if (busy && g && g.from > t + 20) gap = g; }
  const L = safe(() => G.myDay.ideas(gap ? { n: 5, at: gap.from, until: gap.to } : { n: empty ? 5 : 4 }), []);
  const ideasBox = el('div.md-ideas');
  ideasBox.append(sec(gap ? `Ideas for ${hh(gap.from)} to ${hh(gap.to)}` : empty ? 'Ideas for today' : 'Ideas for right now', el('button.md-link', { text: 'More ideas', onclick: () => { close(); safe(() => G.phone.open('planner', { tab: 'ideas' })); } })));
  if (!L.length) ideasBox.append(el('p.md-note', { text: gap ? 'Nothing special then. A free hour is a fine thing too.' : 'Nothing just now. Have a wander.' }));
  for (const i of L) ideasBox.append(ideaRow(i, gap));
  ideasBox.append(el('p.md-hint', { text: 'Ideas are not on your day until you add them.' }));
  /* the schedule */
  const sched = el('div.md-sched');
  if (sc.next) { sched.append(sec(sc.next.flex || sc.next.t > t ? 'Next' : 'Now')); const c = schedRow(sc.next, true); c.classList.add('md-next'); c.querySelector('.md-time').replaceChildren(el('small', { text: whenText(sc.next) })); sched.append(c); }
  else sched.append(sec('My schedule'), el('p.md-note.md-none', { text: empty ? 'Nothing on your day yet. Pick an idea and add it, or just wander.' : 'Nothing else for now.' }));
  if (sc.chapter) { const c = sc.chapter, ready = /open|paused/.test(c.state || '') || c.stub;
    sched.append(el('button.md-chap', { 'data-g': 'chapter', onclick: () => { const mk = safe(() => G.chapters.marker(), null), pl = c.place || (mk ? { x: mk.x, y: mk.y, name: mk.label } : null); if (pl && ready) { safe(() => G.phone.setWaypoint({ id: null, name: pl.name || c.title, x: pl.x, y: pl.y })); close(); toast('Follow the gold marker. No rush.', 'good', 2600); } else flash(c.state === 'waiting' ? 'No hurry. It will come.' : c.hook || c.ready || "Whenever you're ready."); } },
      el('span.md-chdia'), el('span.md-main', null, el('b', { text: c.text }), el('small', { text: c.state === 'waiting' ? 'No hurry.' : c.state === 'running' ? 'You are in it.' : c.state === 'paused' ? "Your place is kept. It'll keep." : "Whenever you're ready." + (c.hook ? ' ' + c.hook : '') })), ready && c.place ? iconEl('ui.pin', 1) : null)); }
  if (rest.length) { sched.append(sec(sc.next ? 'Later today' : 'Today')); const cut = !M.allToday && rest.length > 5 ? 4 : rest.length; for (const a of rest.slice(0, cut)) sched.append(schedRow(a));
    if (cut < rest.length) sched.append(el('button.md-tom', { 'data-more': 1, onclick: () => { M.allToday = true; render(); } }, el('b', { text: `${rest.length - cut} more today` }), el('span', { text: rest.slice(cut, cut + 3).map(a => `${hh(a.t)} ${a.title}`).join(' · ') }))); }
  if (flex.length) { sched.append(sec('Any time today')); for (const a of flex) sched.append(schedRow(a)); }
  if (empty) B.append(ideasBox, sched); else B.append(sched, ideasBox);
  /* to do + opportunities taken up (the old Goals widget) */
  const goals = sc.goals, opps = sc.opps;
  if (goals.length || opps.length) {
    const openN = goals.filter(g => !g.done).length, S = G.myDay.state(), shut = S.todoShut === undefined ? goals.length > 6 : !!S.todoShut, box = el('div.md-todo' + (shut ? '.shut' : ''));
    box.append(el('button.md-sec.md-fold', { onclick: () => { S.todoShut = !shut; render(); } }, el('span', { text: `To do${goals.length ? ` · ${goals.length - openN} of ${goals.length} done` : ''}` }), el('i', { text: shut ? '+' : '-' })));
    if (!shut) { let last = null;
      for (const g of goals) { if (g.listTitle && g.listTitle !== last) { last = g.listTitle; box.append(el('div.md-list', { text: last })); }
        box.append(el('button.md-goal' + (g.done ? '.done' : ''), { 'data-g': g.id, onclick: () => { if (g.done) return; if (g.placeId) go(g.placeId); else if (g.hint) flash(g.hint); } }, el('span.md-box'), el('span', { text: g.shown || g.text }), g.placeId && !g.done ? iconEl('ui.pin', 1) : null)); }
      if (opps.length) { box.append(el('div.md-list', { text: 'Opportunities you took up' })); for (const g of opps) box.append(el('button.md-goal.opp' + (g.done ? '.done' : ''), { 'data-g': g.id, onclick: () => { if (g.done) return; if (g.placeId) go(g.placeId); else if (g.hint) flash(g.hint); } }, el('span.md-box'), el('span', { text: g.text }), g.placeId && !g.done ? iconEl('ui.pin', 1) : null)); } }
    B.append(box);
  }
  if (sc.tomorrow.length) B.append(el('button.md-tom', { onclick: () => { close(); safe(() => G.phone.open('planner', { day: Math.floor(t / DAY) + 1 })); } }, el('b', { text: 'Tomorrow' }), el('span', { text: sc.tomorrow.slice(0, 2).map(a => `${hh(a.t)} ${a.title}`).join(' · ') + (sc.tomorrow.length > 2 ? ` · ${sc.tomorrow.length - 2} more` : '') })));
  /* findability (owner msg 107): the Systems shelf and Wander's quick tools are one tap from here */
  if (!M.teach) B.append(el('div.md-acts', { style: 'margin-top:10px;justify-content:space-between' }, el('button.md-sm', { 'data-shelf': 1, onclick: () => { close(); safe(() => G.phone.open('guide', { tab: 'systems' })); } }, 'How things work here'),
    el('button.md-sm', { 'data-quick': 1, onclick: () => { close(); safe(() => G.phone.open('guide', { tool: 'fun' })); } }, 'Fun right now')));
  B.scrollTop = y; M.pop = null; M.teachBar.style.display = M.teach && !M.tut ? '' : 'none';
  if (M.tut) tutStep();
}

/* ---------- the walk-through (3 steps on the real sheet) ---------- */
const TUT = [
  { sel: '.md-sched', text: 'This is your schedule. Only what you choose goes on it, plus the things life puts there: work, family, a Chapter of the story.' },
  { sel: '.md-ideas', text: 'These are ideas, picked for right now from all over town. They are not on your day. They are only ideas.' },
  { sel: '.md-ideas .md-add', text: 'Like one? Tap Add and it is on your day. "Take me there" shows the way. That is all there is to it.' },
];
function tutStep() {
  if (!M || !M.tut) return; const k = M.tut.k, s = TUT[k]; for (const e of M.el.querySelectorAll('.md-hl')) e.classList.remove('md-hl');
  const tg = M.body.querySelector(s.sel); if (tg) { tg.classList.add('md-hl'); if (M.tut.shown !== k) { M.tut.shown = k; try { tg.scrollIntoView({ block: k === 2 ? 'center' : 'nearest' }); } catch (e) { /* old browser */ } } }
  M.tutBox.replaceChildren(el('small', { text: `How My Day works · ${k + 1} of ${TUT.length}` }), el('p', { text: s.text }),
    el('div.md-tutb', null, el('button.md-link', { 'data-tut': 'skip', text: 'Skip', onclick: () => tutEnd() }), el('button.md-tnext', { 'data-tut': 'next', text: k === TUT.length - 1 ? 'Got it' : 'Next', onclick: () => { if (k === TUT.length - 1) tutEnd(); else { M.tut.k++; tutStep(); } } })));
  M.tutBox.classList.add('on');
}
function tutEnd() { if (!M) return; M.tut = null; safe(() => { G.myDay.state().seen = 1; }); M.tutBox.classList.remove('on'); for (const e of M.el.querySelectorAll('.md-hl')) e.classList.remove('md-hl'); M.teachBar.style.display = M.teach ? '' : 'none'; }

/* ---------- open / close ---------- */
export function open(opts = {}) {
  if (M) { if (opts.teach) { M.teach = true; } if (opts.explain) { M.tut = { k: 0 }; } if (opts.gap) M.gap = opts.gap; render(); return M.promise; }
  injectCss(); if (safe(() => G.phone.isOpen, false)) safe(() => G.phone.close());
  const S = G.myDay.state(); S.n.open++;
  const body = el('div.md-body'), date = el('small'), flashEl = el('div.md-flash'), tutBox = el('div.md-tut'), teachBar = el('div.md-teach', { text: 'Pick an idea you like the look of and tap Add.' });
  const sheet = el('div.md-sheet', { role: 'dialog', 'aria-label': 'My Day' },
    el('div.md-head', null, iconEl('myday.btn', 2), el('div.md-title', null, el('b', { text: 'My Day' }), date),
      el('button.md-full', { 'aria-label': 'Open the full view on the phone', onclick: () => { close(); safe(() => G.phone.open('planner', { tab: 'week' })); } }, 'Week'), el('button.x', { 'aria-label': 'Close', onclick: () => close() }, 'x')),
    teachBar, body, tutBox, flashEl);
  const wrap = el('div', { id: 'myday', onpointerdown: e => { if (e.target === wrap) close(); } }, sheet);
  let res = null; const promise = new Promise(r => { res = r; });
  M = { el: wrap, body, date, flash: flashEl, tutBox, teachBar, teach: !!opts.teach, gap: opts.gap || null, added: false, res, promise, openRow: null, openIdea: null, pop: null, tut: (!S.seen || opts.explain) ? { k: 0 } : null };
  root().append(wrap); G.modal++; render(); G.emit('myday:open', opts);
  return promise;
}
export function close() {
  if (!M) return; const m = M; M = null; clearTimeout(flashT); if (m.tut) safe(() => { G.myDay.state().seen = 1; });
  m.el.remove(); G.modal = Math.max(0, G.modal - 1); G.emit('myday:close', m.added); m.res(m.added); syncHud();
}
export const addIdea = (opts = {}) => open(Object.assign({ teach: true }, opts));
export function explain() { if (M) { M.tut = { k: 0 }; render(); return M.promise; } return open({ explain: true }); }

export function init() {
  injectCss();
  Object.assign(G.myDay, { open, close, addIdea, explain });
  Object.defineProperty(G.myDay, 'isOpen', { get: () => !!M, configurable: true });
  G.myDayUI = { chip, refresh: () => { if (M) render(); syncHud(); } };
  G.on('myday:change', () => { if (M) render(); syncHud(); });
  for (const ev of ['appt:leave', 'appt:soon', 'appt:start', 'hour', 'scene', 'game:start', 'ready', 'load']) G.on(ev, () => setTimeout(syncHud, 0));
  let acc = 0; G.on('minutes', d => { acc += d; if (acc >= 5) { acc = 0; syncHud(); } });
  G.on('appt:done', a => { if (a && a.arr) { toast(`Done: ${a.title}`, 'good', 3000); safe(() => G.audio.sfx('success')); } });
  G.on('title:open', () => close());
  addEventListener('keydown', e => { if (M && e.key === 'Escape') { e.preventDefault(); close(); } });
}
