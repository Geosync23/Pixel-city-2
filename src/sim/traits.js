// Traits: who the character is. Data: src/data/traits.js (30+ traits in families, conflicts, habits, moodlets). UI: the picker below + the Me app (src/ui/phone_me.js).
//
// G.traits
//   has(id) -> bool (picked or earned-and-on)      list() -> active trait defs      picked() -> [ids]      earned() -> [ids]      defs / families / habitsDef
//   set(ids) -> bool            choose the picked traits (max TRAIT_PICKS, no opposites); stamps the change day
//   canChange() -> bool         nothing picked yet, or TRAIT_CHANGE_DAYS game days since the last change        changeIn() -> days left
//   open({ mode: 'new' | 'prompt' | 'change' }) -> Promise<[ids] | null>   the picker (applies the choice itself in 'prompt' / 'change' mode)
//   earn(id) / toggle(id)       earn an earned trait (habit tracker does this) / switch an earned trait off or on
//   habits() -> [{ id, label, n, need, trait, done }]          regularAt() -> venue id | null
//   xpMult(skillId, source?) -> multiplier from traits (per-skill, per-family 'fam:x', '*', time-of-day window, 'src:book')
//   val(key, base = 1) -> the largest numeric trait field `key` among active traits (tips, sell, mini, coach, firstMult, fish, sharp...), or base
//   get(key) -> first truthy trait field `key` among active traits (record, flop, floor, levelUp, collect, grow, tuneDays...) | null
//   thought() -> a thought line for right now | null     (also used by the idle flavour below)
// traitStep() (export) -> Promise<[ids] | null>   the creation step: opens the picker in 'new' mode and keeps the choice until the new game starts ('game:new').
// Events: 'trait:set'([ids]), 'trait:earned'(id), 'trait:toggle'(id, on), 'trait:habit'(habitId, n)
// State G.state.traits = { v: 1, picked: [ids], earned: [ids], off: { id: 1 }, habits: { habitId: n }, days: { key: absDay } (once-a-day guards), visits: { venueId: n }, regularAt,
//   changed (abs day of the last pick; -99 = never), asked (the one-time prompt went out), saved ($ set aside today by thrifty traits / Bartering), tT / sT (real seconds: last thought / remark) }
// Old saves: no slice -> defaults (nothing picked) -> ONE friendly phone notification "Who are you, really?" opening the Me app; never forced, the badge stays until three are picked.
import { G } from '../core/game.js';
import { TRAITS, TRAIT_BY_ID, FAMILIES, CONFLICTS, HABITS, TRAIT_PICKS, TRAIT_CHANGE_DAYS } from '../data/traits.js';
import { NEEDS } from '../data/needs.js';
import { FAMILY_OF, TUNE } from '../data/skills_extra.js';
import { el, root, toast, bubble } from '../ui/kit.js';
import { iconEl } from '../ui/_icons.js';

export const order = 52;
const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const fresh = () => ({ v: 1, picked: [], earned: [], off: {}, habits: {}, days: {}, visits: {}, regularAt: null, changed: -99, asked: 0, saved: 0 });
const st = () => { let s = G.state.traits; if (!s || typeof s !== 'object') s = G.state.traits = fresh(); const f = fresh(); for (const k in f) if (s[k] === undefined) s[k] = f[k]; return s; };
const DECAY = Object.fromEntries(NEEDS.map(n => [n.id, n.decayAwake]));
const day = () => Math.floor((G.state.t || 0) / 1440);
const hf = () => safe(() => G.now().hf, 12);
let pending = null, acc = {}, idle = 0, emoteT = 0, thinkT = 40, saidT = 90;

const activeIds = () => { const s = st(); return s.picked.concat(s.earned.filter(id => !s.off[id])).filter(id => TRAIT_BY_ID[id]); };
const list = () => activeIds().map(id => TRAIT_BY_ID[id]);
const has = id => activeIds().includes(id);
const isHome = () => { const r = safe(() => G.scene.roomId, '') || ''; return r.startsWith('home'); };
const when = w => { const h = hf(); return !w || w === 'always' ? true : w === 'home' ? isHome() : w === 'out' ? !!(G.scene && !G.scene.indoor) : w === 'night' ? (h >= 21 || h < 4) : w === 'morning' ? (h >= 5 && h < 11) : w === 'bright' ? (h >= 5 && h < 9) : w === 'poor' ? safe(() => G.money.get(), 999) < 60 : w === 'clean' ? safe(() => G.needs.get('hygiene'), 0) >= 70 : false; };

function xpMult(skill, src) {
  let m = 1; const h = hf(), fam = FAMILY_OF[skill];
  for (const t of list()) {
    if (t.xp) { if (t.xp[skill]) m *= t.xp[skill]; if (fam && t.xp['fam:' + fam]) m *= t.xp['fam:' + fam]; if (t.xp['*']) m *= t.xp['*']; if (src && t.xp['src:' + src]) m *= t.xp['src:' + src]; }
    if (t.xpHours) { const a = t.xpHours.from, b = t.xpHours.to; if ((h >= a && h < b) || (h + 24 >= a && h + 24 < b)) m *= t.xpHours.mult; }
  }
  return m;
}
const val = (key, base = 1) => { let v = base; for (const t of list()) if (typeof t[key] === 'number' && t[key] > v) v = t[key]; return v; };
const get = key => { for (const t of list()) if (t[key]) return t[key]; return null; };

function conflict(id, ids) { for (const [a, b] of CONFLICTS) { if (id === a && ids.includes(b)) return b; if (id === b && ids.includes(a)) return a; } return null; }
function set(ids) {
  ids = [...new Set(ids || [])].filter(id => TRAIT_BY_ID[id] && !TRAIT_BY_ID[id].earned).slice(0, TRAIT_PICKS);
  for (const id of ids) if (conflict(id, ids)) return false;
  const s = st(); s.picked = ids; s.changed = day(); s.asked = 1; sync(); G.emit('trait:set', ids.slice()); safe(() => G.phone.syncBadge(), 0); return true;
}
const canChange = () => { const s = st(); return s.picked.length < TRAIT_PICKS || day() - s.changed >= TRAIT_CHANGE_DAYS; };
const changeIn = () => Math.max(0, TRAIT_CHANGE_DAYS - (day() - st().changed));
function earn(id, quiet) {
  const t = TRAIT_BY_ID[id], s = st(); if (!t || !t.earned || s.earned.includes(id)) return false; s.earned.push(id); sync(); G.emit('trait:earned', id);
  if (!quiet) { const where = id === 'regular' && s.regularAt ? ' at ' + placeName(s.regularAt) : ''; safe(() => G.phone.notify({ app: 'me', title: 'New trait: ' + t.name + where, text: t.plus[0] + '. Habits shape you.', icon: t.icon, priority: 'normal', data: { tab: 'traits' } }), 0); toast(`You have become a ${t.name}${where}!`, 'good', 4200); }
  return true;
}
function toggle(id) { const s = st(); if (!s.earned.includes(id)) return; if (s.off[id]) delete s.off[id]; else s.off[id] = 1; sync(); G.emit('trait:toggle', id, !s.off[id]); }
const placeName = id => safe(() => G.places.get(id).name, null) || safe(() => G.scene.def.name, null) || String(id).replace(/^pub:/, 'place ').replace(/_/g, ' ');
function bump(habitId, n = 1) {
  const s = st(), h = HABITS.find(x => x.id === habitId); if (!h) return; s.habits[habitId] = (s.habits[habitId] || 0) + n; G.emit('trait:habit', habitId, s.habits[habitId]);
  if (s.habits[habitId] >= h.need) earn(h.trait);
}
const once = key => { const s = st(), d = day(); if (s.days[key] === d) return false; s.days[key] = d; return true; };
const habits = () => { const s = st(); return HABITS.map(h => ({ id: h.id, label: h.label, trait: h.trait, need: h.need, n: Math.min(h.need, s.habits[h.id] || 0), done: s.earned.includes(h.trait) })); };

/* ---------- conditional moodlets ---------- */
function sync() {
  const N = G.needs; if (!N || !N.addMoodlet) return; const act = activeIds();
  for (const t of TRAITS) { if (!t.mood) continue; const want = act.includes(t.id) && when(t.moodWhen === 'morning' ? 'bright' : t.moodWhen), on = !!safe(() => G.state.needs.ml[t.mood], 0);
    if (want && !on) N.addMoodlet(t.mood); else if (!want && on) N.removeMoodlet(t.mood); }
}
// moodWhen 'morning' uses the narrower 'bright' window (up before 9) — the decay 'morning' runs to 11

/* ---------- need rates ---------- */
function minutes(dm) {
  const N = G.needs; if (!N || !G.started && !G.scene) return; const s = st(), asleep = !!N.sleeping;
  for (const t of list()) {
    if (!asleep && t.decay) for (const d of t.decay) if (when(d.when) && DECAY[d.need]) acc[d.need] = (acc[d.need] || 0) + DECAY[d.need] * (d.mult - 1) * dm / 60;
    if (asleep && t.sleep) acc.energy = (acc.energy || 0) + 11 * (t.sleep - 1) * dm / 60;
  }
  for (const k in acc) if (Math.abs(acc[k]) >= .25) { N.add(k, acc[k]); acc[k] = 0; }
  // conditional moodlets (cheap: a handful of traits)
  const act = activeIds();
  for (const t of TRAITS) { if (!t.mood) continue; const want = act.includes(t.id) && when(t.moodWhen === 'morning' ? 'bright' : t.moodWhen), on = !!safe(() => G.state.needs.ml[t.mood], 0); if (want && !on) N.addMoodlet(t.mood); else if (!want && on) N.removeMoodlet(t.mood); }
  if (s.saved >= 1 && once('paid')) { const amt = Math.floor(s.saved * 4) / 4; s.saved -= amt; if (amt > 0 && G.money) { G.money.add(amt, 'Set aside (careful spending)'); toast(`Careful spending: you set aside ${G.money.fmt(amt)} since yesterday.`, 'money', 3800); } }
}

/* ---------- event-driven perks + the habit tracker ---------- */
function wire() {
  const on = (ev, fn) => G.on(ev, (...a) => { try { fn(...a); } catch (e) { console.warn('traits: ' + e.message); } });
  on('activity:done', (id, info) => {
    const okk = info && (info.completed || (info.minutes || 0) >= 5); if (!okk) return; const N = G.needs;
    for (const t of list()) for (const a of t.acts || []) if (a.ids && a.ids.includes(id)) { if (a.moodlet) N.addMoodlet(a.moodlet); if (a.fun) N.add('fun', a.fun); if (a.social) N.add('social', a.social); }
    if (id === 'sleep' && info.completed !== false) { const h = hf(); if (h >= 4.5 && h < 7 && once('early')) bump('early'); }
    if (['gym_weights', 'gym_treadmill', 'gym_bike', 'gym_row', 'gym_bag', 'gym_stretch', 'gym_yoga_class', 'exercise_home', 'jog', 'sk_hoops', 'sk_bay_swim'].includes(id) && (info.minutes || 0) >= 10) bump('gym');
    if (id === 'nap' && has('heavy_sleeper')) N.addMoodlet('power_nap', 4);
  });
  on('money', (delta, reason) => {
    if (!(delta < 0) || /rent|bill|loan|mortgage|arrears|clinic|fine|tax|upkeep/i.test(String(reason || ''))) return; const s = st(), amt = -delta;
    let frac = 0; for (const t of list()) { if (t.cash) frac += t.cash; if (t.regular && s.regularAt && safe(() => G.scene.roomId, null) === s.regularAt) frac += t.regular.cash; }
    frac += TUNE.cashPerLevel * (safe(() => G.skills.level('bartering'), 1) - 1); if (frac > 0) s.saved += amt * Math.min(.15, frac);
    const tr = get('treat'); if (tr && amt >= tr.over) G.needs.addMoodlet(tr.moodlet);
  });
  on('place:discover', () => { const d = get('discover'); if (d && G.started) { G.needs.addMoodlet(d.moodlet); G.needs.add('fun', d.fun); } bump('places'); });
  on('skill:up', () => { const m = get('levelUp'); if (m) G.needs.addMoodlet(m); });
  on('cooked', () => bump('cooked'));
  on('minigame:done', info => { if (info && !info.auto && info.stars >= 2) bump('minis'); });
  on('inv:use', id => { const it = safe(() => G.inv.item(id), null); if (!it) return; const meal = it.category === 'meal', dish = it.category === 'dish'; const sv = get('savour'); if (sv && (meal || dish)) G.needs.addMoodlet(sv); const eo = get('eatOut'); if (eo && dish) G.needs.add('fun', eo.fun); });
  on('hour', h => {
    if (h >= 0 && h < 4 && G.scene && !G.scene.indoor && !safe(() => G.needs.sleeping, false) && once('late')) bump('late');
    const luck = val('luck', 0); if (luck > 0 && G.scene && !G.scene.indoor && !G.busy && Math.random() < luck) { const amt = [1, 1, 2, 2, 5][Math.floor(Math.random() * 5)]; safe(() => G.money.add(amt, 'Found in the street'), 0); G.needs.addMoodlet('lucky_find'); toast(`Lucky! You spot ${safe(() => G.money.fmt(amt), '$' + amt)} on the pavement.`, 'money', 3600); }
    prompt();
  });
  on('scene', sc => {
    sync(); if (!sc || !sc.indoor || !sc.roomId || isHome() || /^(home|lobby|natatorium:|airport|train)/.test(sc.roomId)) return; const s = st(), id = sc.roomId;
    if (once('v:' + id)) { s.visits[id] = (s.visits[id] || 0) + 1; const top = Object.keys(s.visits).reduce((a, b) => (s.visits[b] > (s.visits[a] || 0) ? b : a), id); if (s.visits[top] > (s.habits.regular || 0)) { s.habits.regular = s.visits[top]; G.emit('trait:habit', 'regular', s.habits.regular); } if (s.visits[top] >= 8) { s.regularAt = top; earn('regular'); }
      const keys = Object.keys(s.days); if (keys.length > 60) for (const k of keys) if (s.days[k] < day() - 2) delete s.days[k]; }
    if (has('regular') && s.regularAt === id && once('usual')) { G.needs.addMoodlet('the_usual'); setTimeout(() => toast('"The usual?" They know you here.', 'good', 3200), 900); }
  });
  on('game:new', () => { if (pending) { const p = pending; pending = null; set(p); } });
  on('game:start', () => setTimeout(prompt, 6000)); on('ready', () => { if (!G.started) setTimeout(prompt, 6000); });
  on('load', () => { acc = {}; st(); setTimeout(sync, 0); });
}
/** the one-time friendly nudge (never a forced window) */
function prompt() {
  const s = st(); if (s.asked || s.picked.length >= TRAIT_PICKS) return; if (safe(() => G.intro.active, false) || G.cutscene) return;
  if (!safe(() => G.phone.notify, null)) return; s.asked = 1;
  G.phone.notify({ app: 'me', title: 'Who are you, really?', text: 'Pick three traits that fit you. Small perks, lots of character. Tap to choose.', icon: 'ui.sparkle', priority: 'normal', data: { tab: 'traits', pick: true } });
}

/* ---------- flavour: thought bubbles, an idle flourish, what passers-by say ---------- */
function thought() { const l = list().filter(t => t.thoughts && t.thoughts.length); if (!l.length) return null; const t = l[Math.floor(Math.random() * l.length)]; return t.thoughts[Math.floor(Math.random() * t.thoughts.length)]; }
function flavour(dt) {
  const p = G.player; if (!p || !G.scene || G.modal || G.cutscene || p.hidden || safe(() => G.intro.active, false)) return;
  const moving = p.moving || (p.path && p.path.length);
  if (emoteT > 0) { emoteT -= dt; if (emoteT <= 0 || moving || G.busy) { emoteT = 0; if (!G.busy && p.pose === p._traitPose) p.pose = null; p._traitPose = null; } }
  if (G.busy || moving) { idle = 0; return; } idle += dt; thinkT -= dt; saidT -= dt;
  if (thinkT <= 0) { thinkT = 75 + Math.random() * 70; const s = thought(); if (s) bubble(p, s, 3400, 'think'); }
  if (idle > 22 && emoteT <= 0) { idle = -40; const l = list().filter(t => t.emote); if (l.length) { const t = l[Math.floor(Math.random() * l.length)]; p.pose = p._traitPose = t.emote; emoteT = 1.7; } }
  if (saidT <= 0) { saidT = (has('local') ? 100 : 170) + Math.random() * 90; const l = list().filter(t => t.said && t.said.length); if (!l.length) return;
    let best = null, bd = 4.6; for (const e of G.scene.ents) { if (e === p || e.hidden || !e.spec || e.isAnimal || e.npcId) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; best = e; } }
    if (best) { const t = l[Math.floor(Math.random() * l.length)]; bubble(best, t.said[Math.floor(Math.random() * t.said.length)], 3400); } else saidT = 20; }
}

/* ---------- the picker ---------- */
let pickerOpen = false;
function open(opts = {}) {
  if (pickerOpen) return Promise.resolve(null); pickerOpen = true; const mode = opts.mode || 'change', s = st();
  let sel = (opts.picked || (mode === 'new' && pending) || s.picked).slice(0, TRAIT_PICKS), focus = sel[0] || null;
  return new Promise(res => {
    G.modal++;
    const body = el('div.tp-body'), info = el('div.tp-info'), slots = el('div.tp-slots'), ok = el('button.go', { onclick: () => close(sel.slice()) }, mode === 'new' ? 'Next ▶' : 'That is me');
    const chips = new Map();
    for (const f of FAMILIES) { if (f.id === 'earned') continue; body.append(el('div.tp-fam', { text: f.name }));
      body.append(el('div.tp-chips', null, TRAITS.filter(t => t.family === f.id && !t.earned).map(t => { const b = el('button.tp-chip', { 'data-id': t.id, onclick: () => tap(t.id) }, iconEl(t.icon, 1.5), el('span', { text: t.name })); chips.set(t.id, b); return b; }))); }
    body.append(el('div.tp-fam', { text: 'Earned through habits (not picked)' }), el('p.ph-note', { text: HABITS.map(h => TRAIT_BY_ID[h.trait].name).join(' · ') }));
    function tap(id) { focus = id; if (sel.includes(id)) sel = sel.filter(x => x !== id); else if (sel.length < TRAIT_PICKS && !conflict(id, sel)) sel.push(id); render(); }
    function render() {
      for (const [id, b] of chips) { b.classList.toggle('on', sel.includes(id)); b.classList.toggle('off', !sel.includes(id) && (sel.length >= TRAIT_PICKS || !!conflict(id, sel))); }
      slots.textContent = `${sel.length} / ${TRAIT_PICKS}`; ok.disabled = sel.length !== TRAIT_PICKS; info.textContent = '';
      const t = TRAIT_BY_ID[focus];
      if (!t) info.append(el('b', { text: 'Tap a trait to read about it.' }), el('div', { text: 'Each one has a few small perks and at most one gentle downside. You can change them once a week, and habits earn you more.' }));
      else { const c = conflict(t.id, sel); info.append(...[el('b', { text: t.name }), el('div', null, el('i', { text: t.blurb })), ...t.plus.map(p => el('div.pl', { text: '+ ' + p })), t.down ? el('div.dn', { text: '− ' + t.down }) : null, c && !sel.includes(t.id) ? el('div.dn', { text: `Does not go with ${TRAIT_BY_ID[c].name}.` }) : null].filter(Boolean)); }
    }
    const rnd = () => { sel = []; const pool = TRAITS.filter(t => !t.earned).map(t => t.id).sort(() => Math.random() - .5); for (const id of pool) { if (sel.length >= TRAIT_PICKS) break; if (!conflict(id, sel)) sel.push(id); } focus = sel[0]; render(); };
    const wrap = el('div.tp-wrap', null, el('div.tp', { role: 'dialog', 'aria-label': 'Pick your traits' },
      el('div.tp-head', null, el('b', { text: mode === 'change' ? 'Change your traits' : 'What are you like?' }), el('small', { text: mode === 'new' ? `Step 2: pick ${TRAIT_PICKS} traits. Small perks, lots of character.` : `Pick ${TRAIT_PICKS} traits. Small perks, lots of character.` })),
      body, info, el('div.tp-foot', null, el('button', { onclick: () => close(null) }, mode === 'new' ? '◀ Back' : mode === 'prompt' ? 'Later' : 'Cancel'), el('button', { onclick: rnd }, 'Surprise me'), slots, ok)));
    function close(v) { pickerOpen = false; G.modal--; wrap.remove(); if (v && mode !== 'new') { set(v); toast('That is you all over.', 'good'); } res(v); }
    (opts.parent || root()).append(wrap); render();
  });
}
/** creation step for the title screen: resolves the three ids (kept until 'game:new') or null for Back */
export async function traitStep() { const v = await open({ mode: 'new' }); if (v) pending = v; return v; }

export function init() {
  G.defineState('traits', fresh); st();
  G.traits = { has, list, picked: () => st().picked.slice(), earned: () => st().earned.slice(), isOff: id => !!st().off[id], defs: TRAITS, byId: TRAIT_BY_ID, families: FAMILIES, habitsDef: HABITS, picks: TRAIT_PICKS,
    set, canChange, changeIn, open, earn, toggle, habits, regularAt: () => st().regularAt, xpMult, val, get, thought, traitStep, conflict, bump };
  wire(); G.on('minutes', dm => { try { minutes(dm); } catch (e) { console.warn('traits: ' + e.message); } });
  G.addSystem({ name: 'traits', update: dt => { try { flavour(dt); } catch (e) { /* cosmetic */ } } });
}
