// first_evening.js — THE GUIDED FIRST EVENING + "tap a to-do, the arrow points at it" (owner playtest list, 2026-11-18; docs/reports/first_evening.md).
//
// 1. G.todoNav: which to-do item the guide arrow (ui/navarrow.js through sim/navgoals.js) points at inside your home.
//      has(goalId) -> bool        this open to-do has a thing in your home the arrow can point at (and you are at home)
//      pick(goalId)               select it (same as tapping its row: navgoals reads the tap from [data-g] by itself)
//      selected() -> goalId|null  the to-do the arrow is following now (the tapped one, else the lesson's own)
//    A navgoals resolver 'todo' (kind 'strong', low priority) returns the step: WHERE[goalId](homeRoomId) -> { room, find, label }.
//    It never completes by itself: it simply stops returning a step when the goal is done, so there is no "You have arrived" toast.
//
// 2. The lesson, started by 'intro:done' (a NEW arrival only; saves from older builds that are past the intro keep step null and are left alone):
//      unpack  arrow on a moving box, then on the suitcase         bubble: FIRST_EVENING.unpack_box / unpack_case
//      menu    the To do chip is highlighted; opening it runs the menu's own walk-through (ui/myday.js TUT), which names the phone app
//      bath    the needs lesson: toilet, then wash your hands     (to-do 'bathroom')
//      food    fridge -> make a sandwich -> eat                   (to-dos 'fridge', 'find_food')
//      free    cards: the evening is yours + ideas, then tomorrow: Nana Bea in the morning, perhaps a job. Adds the to-dos 'nana_breakfast' and
//              'library_job' (story/intro.js GOAL_LISTS.settling_in; the day-1 nudges would add the same rows later, so nothing doubles).
//      done
//    Every step skips itself when its to-do is already done, so doing things out of order is fine. Leaving home hides the bubble; sleeping into
//    the next day ends the lesson quietly. "Skip tips" on the bubble ends it at once (tomorrow's to-dos are still added).
//    State G.state.fe = { v, step, day0, toilet, said }.   G.firstEvening = { step, skip(), start() (debug) }.
import { G } from '../core/game.js';
import { say, toast } from '../ui/kit.js';
import { hint as uiHint, caption } from '../ui/goals.js';
import { FIRST_EVENING as T } from '../story/intro.js';

export const order = 137;   /* after sim/navgoals.js (136) */
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const S = () => { let s = G.state.fe; if (!s || typeof s !== 'object') s = G.state.fe = { v: 1, step: null }; return s; };
const homeRoom = () => safe(() => G.housing.current().roomId, null);
const inHome = () => { const h = homeRoom(), id = G.scene && G.scene.id; return !!h && (id === 'int:' + h || id === 'int:' + h + ':bath'); };
const goalOpen = id => { const g = safe(() => G.goals.get(id), null); return !!g && !g.done; };
const boxes = () => safe(() => G.housing.boxes().filter(b => b.intro), []);
const hasMeal = () => safe(() => G.inv.fridge.items().some(i => /^meal_/.test(i.id)), false) || safe(() => G.inv.items().some(i => /^meal_/.test(i.id)), false);
const today = () => Math.floor(G.state.t / 1440);

/* ---------- where each to-do is ---------- */
/* a low arrow for small things on the floor (navgoals' own label lookup floats it a head higher, over whatever stands behind) */
const thing = (re, h) => () => { const p = G.player, it = safe(() => G.interactables().filter(i => isFinite(i.x) && re.test(i.label || '')).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0], null); return it ? { x: it.x, y: it.y, h } : null; };
const WHERE = {
  unpack: h => (boxes().some(b => !b.lug) ? { room: h, find: thing(/^Unpack a Moving Box/, 1.05), label: 'Unpack this box' } : boxes().length ? { room: h, find: thing(/^Unpack your suitcase/, .75), label: 'Unpack your suitcase' } : null),
  bathroom: h => (S().toilet ? { room: h + ':bath', find: [{ label: /^(Sink|Wash hands)/ }, { tag: 'sink' }], label: 'Wash your hands' } : { room: h + ':bath', find: [{ label: /^Toilet/ }, { tag: 'toilet' }], label: 'Use the toilet' }),
  fridge: h => ({ room: h, find: [{ label: /fridge/i }, { tag: 'fridge' }], label: 'Check the fridge' }),
  find_food: h => ({ room: h, find: [{ label: /fridge/i }, { tag: 'fridge' }], label: hasMeal() ? 'Eat your dinner' : 'Make something to eat' }),
  sleep: h => ({ room: h, find: [{ label: /^Bed/ }, { tag: 'bed' }], label: 'Your bed' }),
  cook: h => ({ room: h, find: [{ label: /^Cook/ }, { tag: 'stove' }], label: 'Cook a meal' }),
};
const STEP_GOAL = { unpack: () => 'unpack', bath: () => 'bathroom', food: () => (goalOpen('fridge') ? 'fridge' : 'find_food') };
function selected() {
  const sel = safe(() => G.state.navgoals.sel, null);
  if (sel && sel.goal && WHERE[sel.goal] && goalOpen(sel.goal)) return sel.goal;
  const f = STEP_GOAL[S().step], id = f ? f() : null; return id && goalOpen(id) ? id : null;
}
const has = id => !!WHERE[id] && goalOpen(id) && inHome() && !!safe(() => WHERE[id](homeRoom()), null);
function pick(id) { safe(() => G.navGoals.select({ goal: id })); }

/* ---------- the lesson ---------- */
let key = null, running = false, wait = 0;
function bubble(text, target, opts) {
  const k = text ? text + '|' + (typeof target === 'string' ? target : '') : null; if (k === key) return; key = k;
  if (!text) { uiHint(null); return; }
  uiHint(text, target || null, Object.assign({ under: true, skip, skipLabel: T.skip }, opts));
}
function go(step) { const s = S(), from = s.step; s.step = step; wait = 0; if (from !== 'menu') safe(() => { const q = G.state.navgoals.sel; if (q && q.goal) G.navGoals.select(null); }); }   /* a new lesson step takes the arrow back from a to-do tapped earlier */
function addTomorrow() {
  safe(() => G.goals.addFromList('settling_in', 'nana_breakfast'));
  if (!safe(() => G.jobs.current(), null)) safe(() => G.goals.addFromList('settling_in', 'library_job'));
}
function finish() { addTomorrow(); go('done'); bubble(null); setTimeout(() => safe(() => G.save()), 600); }
function skip() { const s = S(); if (!s.step || s.step === 'done') return; finish(); toast('Tips off. Your To do list still has it all.', 'info', 3200); }
async function cards() {
  if (running) return; running = true; bubble(null);
  try {
    const when = safe(() => G.now().hour, 18) < 17 ? 'day' : 'evening';
    await say(T.free.map(text => ({ who: '', text: text.replace('{when}', when) })));
    await say(T.tomorrow.map(text => ({ who: '', text })));
    if (S().step === 'free') finish();
  } catch (e) { console.warn('first evening cards', e); if (S().step === 'free') finish(); }
  running = false;
}
function tick() {
  const s = S(); if (!s.step || s.step === 'done') { if (key) bubble(null); return; }
  if (!G.scene || !G.state.flags || !G.state.flags.introDone || safe(() => G.intro.active, false)) return;
  if (s.day0 !== undefined && today() > s.day0) { finish(); return; }   /* slept through it: the morning takes over */
  if (running) return;
  const quiet = !!G.cutscene || !!G.busy || !inHome() || safe(() => G.myDay.isOpen, false) || safe(() => G.phone.isOpen, false);
  if (s.step === 'unpack') {
    if (!goalOpen('unpack')) return go('menu');
    if (quiet) return bubble(null);
    return bubble(boxes().some(b => !b.lug) ? T.unpack_box : T.unpack_case);
  }
  if (s.step === 'menu') {
    if (safe(() => G.myDay.state().seen, 1)) { if (!safe(() => G.myDay.isOpen, false)) go('bath'); return bubble(null); }
    if (quiet || G.modal) return bubble(null);
    return bubble(T.menu, '#goalsw .gw-head', { onTap: () => safe(() => G.myDay.open()) });
  }
  if (s.step === 'bath') {
    if (!goalOpen('bathroom')) return go('food');
    if (quiet) return bubble(null);
    if (!s.said && !G.modal) { s.said = 1; caption(null, T.needs, 6000); }
    return bubble(s.toilet ? T.wash : /:bath$/.test(G.scene.id) ? T.toilet_here : T.toilet);
  }
  if (s.step === 'food') {
    if (!goalOpen('find_food')) return go('free');
    if (quiet) return bubble(null);
    return bubble(goalOpen('fridge') ? T.fridge : hasMeal() ? T.eat : T.make);
  }
  if (s.step === 'free') {
    bubble(null);
    if (G.modal || G.busy || G.cutscene || safe(() => G.phone.isOpen, false)) { wait = 0; return; }
    if (++wait >= 8) cards();   /* ~2 s of calm first, so the "first dinner" line can be read */
  }
}
function start() { const s = S(); s.v = 1; s.step = 'unpack'; s.day0 = today(); s.toilet = 0; s.said = 0; key = null; running = false; }
function freshened() { const s = S(); s.toilet = 1; safe(() => { G.state.ach.c.freshened_up = 1; }); if (goalOpen('bathroom')) safe(() => G.goals.complete('bathroom')); }

export function init() {
  G.defineState('fe', () => ({ v: 1, step: null }));
  G.todoNav = { has, pick, selected, WHERE };
  G.firstEvening = { get step() { return S().step; }, skip, start, tick };
  safe(() => G.navGoals.define('todo', 'strong', 40, () => { const h = homeRoom(); if (!h || !inHome() || G.busy) return null; const id = selected(); return id ? safe(() => WHERE[id](h), null) : null; },
    (ctx, sel) => !!(sel && sel.goal && WHERE[sel.goal] && goalOpen(sel.goal) && inHome())));
  G.on('intro:done', () => start());
  G.on('load', () => { key = null; running = false; wait = 0; });
  G.on('bladder:relief', o => { if (!goalOpen('bathroom')) return; if (o && o.kind === 'restroom') freshened(); else S().toilet = 1; });
  G.on('activity:done', (id, r) => { if (id === 'wash_hands' && (!r || r.completed !== false) && S().toilet && goalOpen('bathroom')) freshened(); });
  if (typeof document !== 'undefined') setInterval(() => safe(tick), 250);
}
