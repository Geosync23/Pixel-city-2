// Needs, moodlets, mood, fitness stat and skills. Numbers come from src/data/needs.js.
//
// State slice G.state.needs = { v: {hunger, energy, hygiene, fun, social, bladder}, fitness, exDay (last abs day with exercise),
//   ml: { moodletId: untilT | -1 (until removed) }, xp: { skillId: xp }, sib (abs day of last sibling check-in), wet (outdoor wet minutes) }
//
// G.needs
//   get(k) -> 0..100        add(k, d) -> new value      set(k, v)        all() -> { hunger, energy, hygiene, fun, social, bladder }  (bladder: see src/sim/bladder.js; old saves get its start value on load)
//        + the three gentle needs comfort / outdoors / inspiration (data `soft: true`: no clock decay here, no zero outcome; src/sim/needs_extra.js moves them; old saves get their start values)
//   band(k) -> { id: 'full'|'ok'|'low'|'critical', label, moodlet }       defs -> NEEDS data array
//   mood() -> 0..100        moodTier() -> { id, label, xpMult, workPerf } (data MOOD.tiers)
//   moodlets() -> [{ id, name, desc, icon, mood, left (game minutes | null), source }]   (need bands + timed + conditional)
//   addMoodlet(id, hours?)  hours omitted = the moodlet's data duration; null/0 on a `minutes: null` moodlet = until removeMoodlet
//   removeMoodlet(id)       hasMoodlet(id)
//   fitness() -> 0..100     addFitness(d)     fitnessLabel()
//   walkSpeedMult()         product of moodlets, fitness and weather (applied to G.player.speed automatically)
//   workPerf()              sum of active moodlet workPerf + mood tier workPerf (for the jobs system)
//   sleeping (bool)         set by the activity runner; switches decay to the asleep rates
//   passOut(k)              run the gentle zero outcome for 'hunger' | 'energy' (normally automatic)
// G.skills
//   level(k) 1..10, xp(k), addXp(k, n, raw?) -> xp gained (n is scaled by mood tier + moodlet multipliers unless raw), next(k) -> {into, need} | null, defs
// Events: 'needs:change' (after every decay tick or direct change), 'needs:low'(k) entering the low band, 'needs:zero'(k),
//         'moodlet'(id) when a timed moodlet is applied, 'skill:up'(k, level), 'passout'(k) after a pass-out resolved.
import { G } from '../core/game.js';
import { NEEDS, MOODLETS, MOOD, FITNESS, SKILLS, SKILL_XP, SKILL_MAX_LEVEL, levelForXp, bandFor, SOCIAL, LOW_NOTICE } from '../data/needs.js';
import { toast, say } from '../ui/kit.js';
import { ROOMS, enterRoom } from '../scenes/interior.js';
import { moodletIcon } from '../ui/_icons.js';

export const order = 50;
const BY = Object.fromEntries(NEEDS.map(n => [n.id, n]));
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
let S = null, lastBand = {}, passing = false, speedBase = 0;
const fresh = () => ({ v: Object.fromEntries(NEEDS.map(n => [n.id, n.start])), fitness: FITNESS.start, exDay: -1, ml: { fresh_start: G.state.t + MOODLETS.fresh_start.minutes }, xp: Object.fromEntries(SKILLS.map(s => [s.id, 0])), sib: -1, wet: 0 });

const api = {
  defs: NEEDS, sleeping: false,
  get: k => S.v[k] ?? 0,
  all: () => Object.assign({}, S.v),
  set(k, v) { if (!(k in S.v)) return 0; S.v[k] = clamp(v); check(k); G.emit('needs:change'); return S.v[k]; },
  add(k, d) {
    if (k === 'fitness') return api.addFitness(d); if (!(k in S.v) || !d) return S.v[k] ?? 0;
    if (k === 'social' && d > 0 && api.hasMoodlet('stinky')) d *= MOODLETS.stinky.socialGainMult || 1;
    S.v[k] = clamp(S.v[k] + d); check(k); G.emit('needs:change'); return S.v[k];
  },
  band: k => bandFor(BY[k], S.v[k]),
  mood() { let m = 0; for (const k in MOOD.weights) m += S.v[k] * MOOD.weights[k]; for (const id of activeIds()) m += MOODLETS[id].mood || 0; return Math.round(clamp(m)); },
  moodTier() { const m = api.mood(); return MOOD.tiers.find(t => m >= t.min) || MOOD.tiers[MOOD.tiers.length - 1]; },
  moodlets() { return activeIds().map(id => { const d = MOODLETS[id], u = S.ml[id]; return { id, name: d.name, desc: d.desc, icon: moodletIcon(id, d.mood), mood: d.mood, source: d.source, left: u > 0 ? Math.max(0, Math.ceil(u - G.state.t)) : null }; }); },
  hasMoodlet: id => activeIds().includes(id),
  addMoodlet(id, hours) {
    const d = MOODLETS[id]; if (!d) return false;
    const min = hours ? hours * 60 : d.minutes; const had = S.ml[id];
    S.ml[id] = min ? Math.max(had > 0 ? had : 0, G.state.t + min) : -1;
    if (!had) G.emit('moodlet', id); applySpeed(); G.emit('needs:change'); return true;
  },
  removeMoodlet(id) { if (S.ml[id]) { delete S.ml[id]; applySpeed(); G.emit('needs:change'); } },
  fitness: () => S.fitness,
  addFitness(d) { if (d > 0) { S.exDay = G.now().day; d *= 1 + (SKILLS.find(s => s.id === 'fitness').perLevel.fitnessGainMult || 0) * (skills.level('fitness') - 1); } S.fitness = clamp(S.fitness + d, FITNESS.min, FITNESS.max); return S.fitness; },
  fitnessLabel: () => (FITNESS.labels.find(l => S.fitness >= l.min) || FITNESS.labels[FITNESS.labels.length - 1]).label,
  walkSpeedMult() { let m = 1; for (const id of activeIds()) m *= MOODLETS[id].walkSpeed || 1; m *= 1 + (FITNESS.bonusesAt100.walkSpeedMult - 1) * S.fitness / 100; if (G.weather && G.weather.walkSpeedMult) m *= G.weather.walkSpeedMult() || 1; return m; },
  workPerf() { let p = api.moodTier().workPerf || 0; for (const id of activeIds()) p += MOODLETS[id].workPerf || 0; return p; },
  passOut: k => passOut(k),
};
const skills = {
  defs: SKILLS,
  xp: k => S.xp[k] || 0,
  level: k => levelForXp(S.xp[k] || 0),
  next(k) { const l = skills.level(k); if (l >= SKILL_MAX_LEVEL) return null; return { into: skills.xp(k) - SKILL_XP[l - 1], need: SKILL_XP[l] - SKILL_XP[l - 1] }; },
  addXp(k, n, raw) {
    if (!(k in S.xp) || !(n > 0)) return 0;
    if (!raw) { n *= api.moodTier().xpMult || 1; for (const id of activeIds()) { const d = MOODLETS[id]; n *= d.xpMult || 1; if (d.skillXpMult && d.skillXpMult[k]) n *= d.skillXpMult[k]; } }
    const l0 = skills.level(k); S.xp[k] = Math.min(SKILL_XP[SKILL_XP.length - 1], S.xp[k] + n); const l1 = skills.level(k);
    if (l1 > l0) { const d = SKILLS.find(s => s.id === k); toast(`${d.name} skill is now level ${l1}!`, 'good', 3600); G.emit('skill:up', k, l1); G.audio && G.audio.sfx && G.audio.sfx('levelup'); }
    return n;
  },
};

/** ids of every moodlet active right now: need bands, stored (timed / flagged) and derived conditions */
function activeIds() {
  const out = [];
  for (const n of NEEDS) { const b = bandFor(n, S.v[n.id]); if (b.moodlet && MOODLETS[b.moodlet]) out.push(b.moodlet); }
  for (const id in S.ml) if (MOODLETS[id] && (S.ml[id] === -1 || S.ml[id] > G.state.t) && !out.includes(id)) out.push(id);
  if (G.state.player.money < 0 && !out.includes('money_worries')) out.push('money_worries');
  if (G.scene && !G.scene.indoor && G.state.weather === 'clear' && !G.env?.night && !out.includes('sunny_day')) out.push('sunny_day');
  return out;
}
function check(k) {
  const b = bandFor(BY[k], S.v[k]).id, prev = lastBand[k]; lastBand[k] = b;
  if (prev && prev !== b) {
    applySpeed();
    if ((b === 'low' && prev !== 'critical') || (b === 'critical' && prev !== 'low' && S.v[k] > 0)) { G.emit('needs:low', k); }
    else if (b === 'critical' && prev === 'low' && S.v[k] > 0 && !BY[k].soft) G.emit('needs:critical', k);   /* QA6: low -> critical used to be silent (the step before a pass-out) */
  }
  if (S.v[k] <= 0 && !passing && !BY[k].soft) { const z = BY[k].atZero; if (prev !== 'zero') { lastBand[k] = 'zero'; G.emit('needs:zero', k); zero(k, z); } else lastBand[k] = 'zero'; }
}
/* QA9: bladder notices that know a toilet is right here (they said 'tap the Bladder bar' in your own bathroom, and again while you walked to the toilet) */
const nearLoo = () => { try { if (G.pending && /^(Toilet|Restroom)$/.test(G.pending.it.label || '')) return 'going'; const q = (G.interactables() || []).find(i => /^(Toilet|Restroom)$/.test(i.label || '') && Math.hypot(i.x - G.player.x, i.y - G.player.y) < 8); return q ? (q.label === 'Restroom' ? 'here_r' : 'here') : null; } catch (e) { return null; } };
const noticeText = (k, id) => { const L = LOW_NOTICE[k]; if (!L) return null; if (k === 'bladder') { const n = nearLoo(); if (n === 'going') return null; if (n) { const w = n === 'here_r' ? 'restroom' : 'toilet'; return id === 'critical' ? `Bursting! The ${w} is right here: tap it.` : `Need the loo. The ${w} is right here.`; } } return L[id]; };
function zero(k, z) {
  if (z.type === 'pass_out') { passing = true; setTimeout(() => passOut(k), 0); return; }
  if (z.siblingCheckInCall) { const day = G.now().day; if (S.sib === day) return; S.sib = day; setTimeout(() => { api.add('social', z.siblingCheckInCall.social); if (G.phone && G.phone.notify) G.phone.notify({ app: 'messages', title: 'Missed call', text: z.message, icon: 'need.social' }); toast(z.message, 'info', 5200); }, 0); return; }
  let msg = z.message; if (k === 'bladder') { const n = nearLoo(); if (n === 'going') return; if (n) msg = `You cannot think about anything else. The ${n === 'here_r' ? 'restroom' : 'toilet'} is right here: tap it.`; }   /* QA9: said 'any restroom will do: tap the Bladder bar' standing in your own bathroom */
  if (!api.sleeping) toast(msg, 'bad', 5200);   /* QA6: not in your sleep */
}
async function passOut(k) {
  const z = BY[k].atZero; if (!z || z.type !== 'pass_out') { passing = false; return; }
  passing = true;
  try {
    if (G.busy) G.endActivity(false);
    api.sleeping = false;
    if (G.fadeEl) { G.modal++; G.fadeEl.classList.add('on'); await new Promise(r => setTimeout(r, 320)); G.modal--; }
    const atHome = z.wakeAt === 'home' && !!(G.scene && /^int:home:/.test(G.scene.id || ''));   /* QA14: passed out inside your own home: no cab ride, no $15 'kind cabbie' */
    G.advance(z.skipHours * 60);                                // decay is suspended while `passing`
    for (const n in z.setNeeds) S.v[n] = Math.max(S.v[n], z.setNeeds[n]);
    for (const n in S.v) lastBand[n] = bandFor(BY[n], S.v[n]).id;
    // travel: clinic room, or home (housing system if present, else the home room if one is defined)
    let went = false;
    try {
      if (z.wakeAt === 'clinic' && ROOMS.has('clinic')) { await enterRoom('clinic', poiFor('door:clinic')); went = true; }
      else if (z.wakeAt === 'home') { if (G.housing && G.housing.goHome) { await G.housing.goHome(); went = true; } else { const id = G.state.home && G.state.home.id, rid = ['home:' + id, 'home'].find(r => ROOMS.has(r)); if (id && rid) { await enterRoom(rid, poiFor('door:' + rid)); went = true; } } }
    } catch (e) { console.warn('pass-out travel failed', e); }
    if (!went && G.fadeEl) setTimeout(() => G.fadeEl.classList.remove('on'), 60);
    if (atHome) { applySpeed(); G.emit('needs:change'); G.emit('passout', k); await say([{ text: 'You nodded off on the spot. You wake on your own floor six hours later, stiff, with the bed right there.' }]); return; }
    if (G.money) G.money.pay(z.bill, z.billLabel, { force: true, category: 'clinic' }); else G.state.player.money -= z.bill;
    applySpeed(); G.emit('needs:change'); G.emit('passout', k);
    await say([{ text: z.message }, { text: `${z.billLabel}: $${z.bill}.` }]);
  } finally { passing = false; }
}
function poiFor(id) { const c = G.sceneCache.get('city'); return c && c.world.pois.find(p => p.id === id) ? id : undefined; }

function decay(dm) {
  if (passing || !S || (G.dev && G.dev.frozen)) return;
  const asleep = api.sleeping, h = dm / 60;
  for (const n of NEEDS) {
    let r = asleep ? n.decayAsleep : n.decayAwake;
    if (n.id === 'energy' && !asleep) r *= 1 + (FITNESS.bonusesAt100.energyDecayAwakeMult - 1) * S.fitness / 100;
    if (n.id === 'social' && r < 0 && !asleep && amongPeople()) r *= SOCIAL.amongPeopleMult;
    if (r) S.v[n.id] = clamp(S.v[n.id] + r * h);
  }
  guard();
  for (const id in S.ml) if (S.ml[id] > 0 && S.ml[id] <= G.state.t) delete S.ml[id];
  weatherExposure(dm);
  for (const n of NEEDS) check(n.id);
  applySpeed(); G.emit('needs:change');
}
/* QA6: inside a public venue (a cafe, a shop, the library...) you are among people: the Social drain is halved */
function amongPeople() { const sc = G.scene; if (!sc || !sc.indoor || api.sleeping) return false; try { if (G.housing && G.housing.isHome && G.housing.isHome(sc.id)) return false; } catch (e) { return false; } return /^int:/.test(sc.id || ''); }
/* QA6: a long activity (sleep, feet up, auto-work...) stops before Hunger or Energy reach 0, so a rest never ends at the clinic without a warning you could act on */
let guarded = 0;
function guard() {
  const a = G.busy; if (!a || passing || a.canCancel === false || G.state.t - guarded < 30) return;
  const what = (a.id || '') + ' ' + (a.label || ''), hungry = S.v.hunger <= 5 && !/eat|drink|cook|snack|meal|breakfast|lunch|dinner|order|heat/i.test(what), sleepy = S.v.energy <= 3 && !api.sleeping && !/sleep|nap|bed|rest/i.test(what),   /* QA10: 'You stop (Eating Granola Bar): you are starving' - a starving player could not eat */ loo = S.v.bladder <= 6 && !/toilet|restroom|loo\b|bath|shower/i.test((a.id || '') + ' ' + (a.label || '')); if (!hungry && !sleepy && !loo) return;   /* QA7: bladder too: a kind stop before an accident */
  guarded = G.state.t; const was = a.label || 'that';
  setTimeout(() => { if (G.busy !== a) return; G.endActivity(false); toast(hungry ? (api.sleeping ? 'Your stomach wakes you up. Eat something before anything else!' : `You stop (${was}): you are starving. Eat something now!`) : sleepy ? `You stop (${was}): you can barely keep your eyes open. Find a bed!` : api.sleeping ? 'You wake up needing the loo. Tap the Bladder bar for the nearest toilet.' : `You stop (${was}): you really need the loo. Tap the Bladder bar for the nearest restroom.`, 'bad', 6000); }, 0);
}
function weatherExposure(dm) {
  const out = G.scene && !G.scene.indoor && !api.sleeping, kind = (G.weather && G.weather.current && (G.weather.current() || {}).kind) || G.state.weather;
  const wet = out && (kind === 'rain' || kind === 'storm'), cold = out && (kind === 'snow' || (G.now().season === 3 && kind !== 'fog'));
  if (!wet && !cold) { S.wet = Math.max(0, (S.wet || 0) - dm * 2); return; }
  S.wet = (S.wet || 0) + dm;
  const styles = (G.wardrobe && G.wardrobe.styles && G.wardrobe.styles()) || [], has = id => G.inv && G.inv.count(id) > 0;
  if (wet && S.wet >= (kind === 'storm' ? 5 : 10) && !styles.includes('rain') && !(kind === 'rain' && has('umbrella')) && !api.hasMoodlet('soaked')) { api.addMoodlet('soaked'); toast('You are getting soaked. An umbrella would help!', 'bad'); }
  if (cold && S.wet >= (kind === 'snow' ? 20 : 30) && !styles.includes('winter') && !api.hasMoodlet('chilly')) { api.addMoodlet('chilly'); toast('Brrr. It is chilly without a winter coat.', 'bad'); }
}
function applySpeed() { const p = G.player; if (!p || !S) return; if (!speedBase) speedBase = p.speed || 3.6; p.speed = speedBase * api.walkSpeedMult(); }

export function init() {
  S = G.defineState('needs', fresh);
  const rebind = () => { S = G.state.needs || (G.state.needs = fresh()); const f = fresh(); for (const k in f) if (S[k] === undefined) S[k] = f[k]; for (const k in f.v) if (S.v[k] === undefined) S.v[k] = f.v[k]; for (const k in f.xp) if (S.xp[k] === undefined) S.xp[k] = 0; lastBand = {}; for (const n of NEEDS) lastBand[n.id] = bandFor(n, S.v[n.id]).id; api.sleeping = false; applySpeed(); G.emit('needs:change'); };
  rebind(); G.on('load', rebind);
  G.needs = api; G.skills = skills;
  G.on('minutes', decay);
  G.on('day', () => { if (S.exDay < G.now().day - 1) S.fitness = Math.max(Math.min(S.fitness, FITNESS.floor), S.fitness + FITNESS.decayPerIdleDay); });
  G.on('scene', applySpeed); G.on('weather', applySpeed);
  const softSaid = {};   /* the gentle needs speak at most once a game day each, even if they bob around the band edge */
  /* QA6: everyday Social: a word at the till, and story scenes with family / friends (meals feed you too) */
  let tillT = -999; const lateLow = new Set();
  G.on('activityEnd', () => { if (api.sleeping || !lateLow.size) return; const ks = [...lateLow]; lateLow.clear(); setTimeout(() => { for (const k of ks) { const id = api.band(k).id, tx = (id === 'low' || id === 'critical') ? noticeText(k, id) : null; if (tx) toast(tx, 'bad', 5200); } }, 2500); });
  G.on('shop:buy', () => { if (G.state.t - tillT < SOCIAL.tillEveryMin) return; tillT = G.state.t; api.add('social', SOCIAL.till); });
  G.on('story:beat', id => { const g = SOCIAL.beats[id] || SOCIAL.beatDefault; for (const k in g) api.add(k, g[k]); });
  const saidN = {}, noticeOk = (k, sev) => { const o = saidN[k]; if (o && G.state.t - o.t < 60 && sev <= o.sev && G.state.t >= o.t) return false; saidN[k] = { t: G.state.t, sev }; return true; };   /* QA7: one notice per need per hour (bouncing low <-> critical showed 'Starving' twice in 5 min) unless it got worse */
  G.on('needs:critical', k => { const L = LOW_NOTICE[k]; if (!L) return; if (api.sleeping) { lateLow.add(k); return; } if (!noticeOk(k, 2)) return; let banner = false; if (k === 'hunger' || k === 'energy') { try { banner = !!(G.phone && G.phone.notify && G.phone.notify({ app: 'wellness', title: k === 'hunger' ? 'Starving' : 'Exhausted', text: L.critical, icon: 'need.' + k, priority: 'high' })); } catch (e) { } } if (!banner) { const tx = noticeText(k, 'critical'); if (tx) toast(tx, 'bad', 7000); } });   /* hunger / energy: a high-priority phone banner (one message, not banner + toast) */
  G.on('needs:low', k => { const b = api.band(k); const L = LOW_NOTICE[k]; if (L && !BY[k].soft) { if (G.busy && /^(Eating|Drinking|Cooking|Making|Baking)\b/.test(G.busy.label || '') && (k === 'hunger' || k === 'energy')) return; if (api.sleeping && b.id !== 'critical') { lateLow.add(k); return; }   /* QA6: said when you wake, not while you sleep */   /* QA6: not while you are already eating */ if (!noticeOk(k, b.id === 'critical' ? 2 : 1)) return; { const tx = noticeText(k, b.id === 'critical' ? 'critical' : 'low'); if (tx) toast(tx, 'bad', b.id === 'critical' ? 7000 : 5200); } return; } if (BY[k].soft) { const d = G.now().day; if (softSaid[k] === d) return; softSaid[k] = d; toast(BY[k].lowText || `${BY[k].name}: ${b.label.toLowerCase()}`, 'info', 4200); return; } toast(`${BY[k].name}: ${b.label.toLowerCase()}`, 'bad'); });   /* the gentle needs (data `soft`) speak once, kindly */
}
