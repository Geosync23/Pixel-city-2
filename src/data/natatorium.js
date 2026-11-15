// natatorium.js — data for the Maple Bay Natatorium (showpiece S9; the existing city building `bld.civic.pool`, door poi `door:natatorium` added at runtime by sim/natatorium.js).
// Registered additively at import time (same pattern as hotel.js / arena.js): VENUE_BY_ID gets 'natatorium' (the place), 'natatorium:shop' (Splash & Dash), 'natatorium:cafe'
// (The Deep End Cafe), 'natatorium:vending'; ITEMS / ITEM_BY_ID get the `nat_*` items (+ three outfits); MOODLETS gets nat_*; calendar EVENTS gets nat_* (nine entries).
//   NR room ids   NV venue ids   NAME   HOURS { open, close, leisure, lido, cafe, shop }   PRICE { ... }   LEVELS [{ n, name, badge, lanes, unlock, need (metres swum before the lesson) }]
//   STROKES { id: { name, beat (s), v (speed mult), cost } }   DISTS [25, 50, 100, 400]   LANES [{ n, band: 'slow' | 'med' | 'fast', v: [min, max] }]   SWIM { ... tuning ... }
//   DIVES [{ id, name, dd, boards, lvl, rot, shape }]   BOARDS [{ id, name, h, lvl }]   SLIDES { flume, drop }   WAVES { every, len }   BUCKET (s)   RECORDS [{ ev, time, name, year, gap? }]
//   sessionsOn(dayInfo) -> [{ id, name, from, to, where, blurb, lanes? }]   sessionNow(now, where?) -> session | null   laneUse(now) -> ['slow' | 'med' | 'fast' | 'school' | 'aqua' | 'club' | 'meet' | 'fun' | 'ow'] x 8
//   lidoState(now, weather) -> 'summer' | 'mild' | 'winter'   waveOn(t) -> { on, left (min), next (min) }
//   CLUB, VISITORS, MEET_EVENTS, MEET { T0, SLOT, ... }, meet(week) -> the whole simulated gala (deterministic), meetAt(t) -> { ph, i, ev, tau, ... } | null, racePos(lane, tau) -> 0..1 (1 = block end), NOVICES
//   NAT_LOOKS (merge into wardrobe LOOKS)   NEW_ITEM_IDS   CLUES (the chain's three places)   STAFF names
import './venues_extra.js';
import { VENUE_BY_ID } from './venues.js';
import { ITEMS, ITEM_BY_ID, DISHES, GIFTS, MISC, OUTFITS } from './items.js';
import { MOODLETS } from './needs.js';
import { EVENTS } from './calendar.js';

export const NAME = 'Maple Bay Natatorium', SHOP_NAME = 'Splash & Dash', CAFE_NAME = 'The Deep End Cafe';
export const NR = { hall: 'natatorium', change: 'natatorium:change', pool: 'natatorium:pool', leisure: 'natatorium:leisure', lido: 'natatorium:lido' };
export const NV = { place: 'natatorium', shop: 'natatorium:shop', cafe: 'natatorium:cafe', vend: 'natatorium:vending' };
export const HOURS = { open: 6, close: 22, leisure: [9, 21], leisureFri: [9, 22], lido: [9, 19], cafe: [8, 21], shop: [7, 21], coach: [[9, 12], [15, 19]], wellness: [9, 21] };
export const PRICE = { swim: 6, early: 4, card: 48, member: 45, active: 60, lesson: 15, wellness: 5, towelHire: 2, meetEntry: 5, memberDays: 14 };
export const STAFF = { coach: 'Coach Midge Okafor', guard: 'Walt Brennan', rosa: 'Rosa Castellanos-Whitby', desk: 'Priti at the front desk', aqua: 'Dolores, the aqua instructor', dj: 'DJ Riptide' };

/* ---------- swim levels (lessons with the coach) ---------- */
export const LEVELS = [
  { n: 1, name: 'Beginner', badge: 'Starfish', lanes: 2, need: 0, unlock: 'the slow lanes, the leisure pools, the Twister flume' },
  { n: 2, name: 'Improver', badge: 'Seahorse', lanes: 5, need: 100, unlock: 'deep water: the medium lanes, the diving well and the one-metre board, The Plunge drop slide' },
  { n: 3, name: 'Swimmer', badge: 'Dolphin', lanes: 5, need: 300, unlock: 'the three-metre springboard and tumble turns' },
  { n: 4, name: 'Club Standard', badge: 'Marlin', lanes: 8, need: 600, unlock: 'the fast lanes, the five-metre platform and the Novice race at the Saturday meet' },
  { n: 5, name: 'Honorary Marlin', badge: 'Gold Marlin', lanes: 8, need: 1200, unlock: 'the open-water prep night and a racing start' },
];
export const STROKES = {
  free: { name: 'Freestyle', beat: .62, v: 1, cost: 1 },
  back: { name: 'Backstroke', beat: .7, v: .9, cost: .95 },
  breast: { name: 'Breaststroke', beat: .95, v: .78, cost: .8 },
};
export const DISTS = [25, 50, 100, 400];
export const LANES = [
  { n: 1, band: 'slow', v: [.95, 1.15] }, { n: 2, band: 'slow', v: [1.1, 1.3] }, { n: 3, band: 'med', v: [1.45, 1.65] }, { n: 4, band: 'med', v: [1.6, 1.8] },
  { n: 5, band: 'med', v: [1.75, 1.95] }, { n: 6, band: 'fast', v: [2.15, 2.35] }, { n: 7, band: 'fast', v: [2.3, 2.5] }, { n: 8, band: 'fast', v: [2.45, 2.65] },
];
export const BAND_NAME = { slow: 'Slow lane', med: 'Medium lane', fast: 'Fast lane', school: 'School lessons', aqua: 'Aqua-aerobics', club: 'Marlins training', meet: 'Swim meet', fun: 'Inflatable course', ow: 'Open-water pack' };
// SWIM tuning: V = units / real second by level (pool length 22 units = 25 m); CLOCK = stopwatch seconds per real second; RHYTHM floor + gain; stamina.
export const SWIM = { V: [0, 1.5, 1.8, 2.1, 2.4, 2.6], CLOCK: 2, FLOOR: .55, GAIN: .45, AUTO: .62, STAM_TAP: 2.1, STAM_REGEN: 3.2, STAM_LOW: 15, LOW_CAP: .7, PACE: { easy: [1.18, .55, .86], steady: [1, 1, 1], sprint: [.84, 1.9, 1.12] },
  GOGGLES: .04, CAP: .02, SUIT: .03, RATE: .22, FIT_PER_100: .22, XP_PER_25: 3, ENERGY_PER_25: 1.5, HYGIENE_PER_MIN: .5, TURN_BONUS: .25 };

/* ---------- diving ---------- */
export const BOARDS = [{ id: 'b1', name: 'One-metre springboard', short: '1 M', h: .85, lvl: 2 }, { id: 'b3', name: 'Three-metre springboard', short: '3 M', h: 2.3, lvl: 3 }, { id: 'p5', name: 'Five-metre platform', short: '5 M', h: 3.7, lvl: 4 }];
export const DIVES = [
  { id: 'pencil', name: 'Pencil jump', dd: 1.0, rot: 0, shape: 'straight', lvl: 2, feet: true },
  { id: 'fwd', name: 'Forward dive, straight', dd: 1.3, rot: .5, shape: 'straight', lvl: 2 },
  { id: 'tuck1', name: 'Forward somersault, tuck', dd: 1.6, rot: 1, shape: 'tuck', lvl: 3, feet: true },
  { id: 'back', name: 'Back dive, straight', dd: 1.6, rot: -.5, shape: 'straight', lvl: 3 },
  { id: 'pike15', name: 'Forward 1 1/2, pike', dd: 2.0, rot: 1.5, shape: 'pike', lvl: 4 },
  { id: 'inward', name: 'Inward 1 1/2, tuck', dd: 2.3, rot: -1.5, shape: 'tuck', lvl: 4 },
];
export const DIVE = { MIN: 6, hygiene: 1 };
export const SLIDES = { flume: { id: 'flume', name: 'The Twister', lvl: 1, par: 8.4, best: 6.4 }, drop: { id: 'drop', name: 'The Plunge', lvl: 2, par: 3.2, best: 2.4 } };
export const WAVES = { every: 30, len: 8 };          // game minutes: the wave machine runs for `len` minutes at :00 and :30
export const BUCKET = 38;                            // real seconds between tips of the big bucket
export const waveOn = t => { const m = ((t % WAVES.every) + WAVES.every) % WAVES.every; return { on: m < WAVES.len, left: Math.max(0, WAVES.len - m), next: m < WAVES.len ? 0 : WAVES.every - m }; };

/* ---------- the club and its record board ---------- */
export const CLUB = { id: 'marlins', name: 'Maple Bay Marlins', short: 'MBM', c: '#1f6fb8', c2: '#f2c230' };
export const VISITORS = [
  { id: 'gannets', name: 'Gull Point Gannets', short: 'GPG', c: '#f4f0e8', c2: '#2a2733' }, { id: 'herons', name: 'Harbor City Herons', short: 'HCH', c: '#2f8a5a', c2: '#f4f0e8' },
  { id: 'pike', name: 'Pinecrest Pike', short: 'PCP', c: '#c8402e', c2: '#f4f0e8' }, { id: 'seals', name: 'Saltmarsh Seals', short: 'SMS', c: '#7a55c8', c2: '#e8c06a' }, { id: 'eels', name: 'Ironbridge Eels', short: 'IBE', c: '#33303f', c2: '#e8843a' },
];
export const RECORDS = [
  { ev: 'W 50 FREE', time: '27.9', name: 'J. OYELARAN', year: 2019 }, { ev: 'M 50 FREE', time: '24.6', name: 'T. WHITLOCK', year: 2021 }, { ev: 'W 100 FREE', time: '1:00.2', name: 'S. NAKASHIMA', year: 2016 },
  { ev: 'M 100 FREE', time: '53.8', name: 'D. ABELARD', year: 2008 }, { ev: 'W 100 BACK', time: '1:09.8', name: '', year: 1974, gap: true }, { ev: 'M 100 BACK', time: '1:01.4', name: 'K. ROSEN', year: 1998 },
  { ev: 'W 100 BREAST', time: '1:16.0', name: 'M. OKAFOR', year: 1991 }, { ev: 'M 100 BREAST', time: '1:08.3', name: 'P. LINDQVIST', year: 2012 }, { ev: 'W 200 IM', time: '2:31.5', name: 'A. DESROCHERS', year: 2003 },
  { ev: 'M 200 FREE', time: '1:58.7', name: 'D. ABELARD', year: 2009 }, { ev: 'W 400 FREE', time: '4:44.1', name: 'S. NAKASHIMA', year: 2017 }, { ev: 'M 400 FREE', time: '4:21.9', name: 'B. FONTAINE', year: 1986 },
];
export const GAP_NAME = 'R. CASTELLANOS';
const MF = ['Imani Oyelaran', 'Sora Nakashima', 'Lucia Ferreira', 'Hattie Brennan', 'Noor Haddad', 'Greta Lindqvist', 'Poppy Adeyemi', 'Wren Castillo'], MM = ['Theo Whitlock', 'Dario Abelard', 'Kofi Mensah', 'Jonah Rosen', 'Mateo Fontaine', 'Ravi Bhatt', 'Finn Kowalski', 'Eli Park'];
const VF = ['Ada', 'Bea', 'Cleo', 'Dina', 'Esme', 'Faye', 'Gwen', 'Ines', 'June', 'Kira', 'Lena', 'Mara', 'Nell', 'Orla', 'Remy', 'Tess'], VM = ['Abe', 'Ben', 'Cal', 'Dev', 'Ezra', 'Gus', 'Hugo', 'Ian', 'Jude', 'Kai', 'Leo', 'Max', 'Nico', 'Omar', 'Ross', 'Sam'];
const VL = ['Aldous', 'Birch', 'Carrow', 'Dunmore', 'Estrada', 'Fairley', 'Galvan', 'Holt', 'Ibarra', 'Jessop', 'Kader', 'Lowry', 'Marsh', 'Nakai', 'Orde', 'Pryce', 'Quill', 'Rowe', 'Sato', 'Tully'];
// g: 'F' | 'M' | 'X' (mixed), n: lengths of 25 m, base: [fastest, slowest] seconds, relay: four teams instead of eight swimmers, open: the player may enter
export const MEET_EVENTS = [
  { id: 'g50', name: 'Girls 50 m Freestyle', short: 'GIRLS 50 FREE', g: 'F', n: 2, stroke: 'free', base: [29.5, 35.5], kid: true },
  { id: 'b50', name: 'Boys 50 m Freestyle', short: 'BOYS 50 FREE', g: 'M', n: 2, stroke: 'free', base: [28.2, 34.5], kid: true },
  { id: 'w100b', name: 'Women 100 m Backstroke', short: 'WOMEN 100 BACK', g: 'F', n: 4, stroke: 'back', base: [71.5, 82] },
  { id: 'm100br', name: 'Men 100 m Breaststroke', short: 'MEN 100 BREAST', g: 'M', n: 4, stroke: 'breast', base: [70.5, 81] },
  { id: 'nov', name: 'Novice 50 m Freestyle (open race)', short: 'NOVICE 50 FREE', g: 'X', n: 2, stroke: 'free', base: [38, 54], open: true },
  { id: 'w100', name: 'Women 100 m Freestyle', short: 'WOMEN 100 FREE', g: 'F', n: 4, stroke: 'free', base: [61.5, 70] },
  { id: 'm100', name: 'Men 100 m Freestyle', short: 'MEN 100 FREE', g: 'M', n: 4, stroke: 'free', base: [55, 63] },
  { id: 'g100im', name: 'Girls 100 m Individual Medley', short: 'GIRLS 100 IM', g: 'F', n: 4, stroke: 'im', base: [74, 86], kid: true },
  { id: 'm200', name: 'Men 200 m Freestyle', short: 'MEN 200 FREE', g: 'M', n: 8, stroke: 'free', base: [121, 136] },
  { id: 'relay', name: 'Mixed 4 x 50 m Freestyle Relay', short: 'MIXED 4X50 RELAY', g: 'X', n: 8, stroke: 'free', base: [112, 124], relay: true },
];
// MEET: Saturday. T0 start hour, SLOT game minutes per event, MARSHAL minutes before the gun, SEC = stopwatch seconds per game minute while a race runs, POD = minute of the slot the podium starts.
export const MEET = { weekday: 5, T0: 14, SLOT: 15, MARSHAL: 3, SEC: 20, POD: 11, WARM: 30, AFTER: 30, PTS: [9, 7, 6, 5, 4, 3, 2, 1], RPTS: [14, 10, 8, 6], WATCH: .3, ORDER: [4, 5, 3, 6, 2, 7, 1, 8] };
export const NOVICES = [['Barnaby Ostrander', 38.6], ['Yusuf Kader', 41.2], ['Prudence Hale', 43.4], ['Dot Fairweather', 45.1], ['Milo Santangelo', 47.3], ['Agnes Thwaite', 50.2], ['Gil Navarro', 54]];
const hsh = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const fmtTime = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return m ? m + ':' + (r < 10 ? '0' : '') + r.toFixed(1) : r.toFixed(1); };
const splitsFor = (time, n, seed) => { const w = []; let tot = 0; for (let k = 0; k < n; k++) { const v = (k === 0 ? .92 : 1) + .06 * (n > 1 ? k / (n - 1) : 0) + (hsh(seed, k, 5) - .5) * .03; w.push(v); tot += v; } let c = 0; return w.map(v => (c += v / tot * time)); };
const MEETS = new Map();
/** the whole gala of week w, simulated once: { week, opp, events: [{ ...MEET_EVENTS[i], lanes: [{ lane, name, club: 'M' | 'V', time, splits, place, pts }], res (sorted by place) }], after: [{ m, v }] (running score), final: { m, v, won } } */
export function meet(week) {
  week = Math.max(0, Math.floor(week)); let M = MEETS.get(week); if (M) return M;
  const opp = VISITORS[week % VISITORS.length], events = [], after = []; let sm = 0, sv = 0;
  MEET_EVENTS.forEach((E, i) => {
    const sw = [], n = E.relay ? 4 : 8;
    for (let k = 0; k < n; k++) {
      const home = k % 2 === 0, r = hsh(week, i * 16 + k, 1), r2 = hsh(week, i * 16 + k, 2), r3 = hsh(week, i * 16 + k, 3);
      let name; if (E.open) name = NOVICES[k % NOVICES.length][0]; else if (E.relay) name = (home ? 'MARLINS ' : opp.short + ' ') + (k < 2 ? 'A' : 'B');
      else { const fem = E.g === 'F' || (E.g === 'X' && k % 4 < 2), pool = home ? (fem ? MF : MM) : null; name = pool ? pool[(Math.floor(k / 2) + i * 3 + week) % pool.length] : (fem ? VF : VM)[Math.floor(r2 * 16)] + ' ' + VL[Math.floor(r3 * 20)]; }
      const time = E.open ? NOVICES[k % NOVICES.length][1] * (1 + (r - .5) * .03) : E.base[0] + (E.base[1] - E.base[0]) * Math.pow(r, 1.25) + (home ? -.25 : .25) + (r2 - .5) * .8;
      sw.push({ name, club: E.open ? 'N' : home ? 'M' : 'V', time: Math.round(time * 10) / 10 });
    }
    if (E.open) sw.pop();                                   // seven novices: lane 4 is kept for you
    const seeded = sw.slice().sort((a, b) => a.time - b.time), order = E.relay ? [4, 5, 3, 6] : E.open ? [5, 3, 6, 2, 7, 1, 8] : MEET.ORDER;
    seeded.forEach((s, k) => { s.lane = order[k]; s.splits = splitsFor(s.time, E.n, week * 100 + i * 10 + k); s.place = k + 1; });
    for (let k = 1; k < seeded.length; k++) if (seeded[k].time === seeded[k - 1].time) seeded[k].time = Math.round((seeded[k].time + .1) * 10) / 10;
    const pts = E.relay ? MEET.RPTS : MEET.PTS; seeded.forEach((s, k) => { s.pts = E.open ? 0 : pts[k] || 0; if (s.club === 'M') sm += s.pts; else if (s.club === 'V') sv += s.pts; });
    events.push(Object.assign({}, E, { i, lanes: seeded.slice().sort((a, b) => a.lane - b.lane), res: seeded, dur: seeded[seeded.length - 1].time })); after.push({ m: sm, v: sv });
  });
  M = { week, opp, events, after, final: { m: sm, v: sv, won: sm >= sv } }; MEETS.set(week, M); if (MEETS.size > 6) MEETS.delete(MEETS.keys().next().value); return M;
}
/** where the Saturday gala is at absolute game minute t: null on other days / hours. ph: 'warm' | 'marshal' | 'race' | 'result' | 'podium' | 'after' */
export function meetAt(t) {
  const day = Math.floor(t / 1440), wd = ((day % 7) + 7) % 7; if (wd !== MEET.weekday) return null; const min = t - day * 1440, m0 = MEET.T0 * 60, week = Math.floor(day / 7), M = meet(week), end = m0 + MEET_EVENTS.length * MEET.SLOT;
  if (min < m0 - MEET.WARM || min >= end + MEET.AFTER) return null; if (min < m0) return { ph: 'warm', M, i: -1, ev: null, left: m0 - min, day, week }; if (min >= end) return { ph: 'after', M, i: MEET_EVENTS.length, ev: null, day, week };
  const i = Math.floor((min - m0) / MEET.SLOT), w = min - m0 - i * MEET.SLOT, ev = M.events[i], tau = (w - MEET.MARSHAL) * MEET.SEC;
  const ph = w < MEET.MARSHAL ? 'marshal' : tau < ev.dur + 1.5 ? 'race' : w < MEET.POD ? 'result' : 'podium';
  return { ph, M, i, ev, w, tau, day, week, T0: day * 1440 + m0 + i * MEET.SLOT };
}
/** position of a swimmer along the pool at stopwatch second tau: 1 = the starting-block end, 0 = the far wall. Also returns { k (length index), done } via the out object. */
export function racePos(lane, tau, out) {
  const sp = lane.splits; if (tau <= 0) { if (out) { out.k = 0; out.done = false; out.dir = -1; } return 1; }
  for (let k = 0; k < sp.length; k++) if (tau < sp[k]) { const a = k ? sp[k - 1] : 0, f = (tau - a) / (sp[k] - a); if (out) { out.k = k; out.done = false; out.dir = k % 2 ? 1 : -1; } return k % 2 ? f : 1 - f; }
  if (out) { out.k = sp.length - 1; out.done = true; out.dir = 1; } return sp.length % 2 ? 0 : 1;
}

/* ---------- the timetable ---------- */
const S = (id, name, from, to, where, blurb, x) => Object.assign({ id, name, from, to, where, blurb }, x);
/** sessions of one day ({ weekday, dayOfMonth, season }), sorted by start */
export function sessionsOn(n) {
  const wd = n.weekday, out = [S('early', 'Early-Bird Lanes', 6, 8, 'pool', 'All eight lanes roped for lane swimming. Quiet, serious, and $' + PRICE.early + ' before eight.')];
  if (wd < 5) out.push(S('school', 'School Swimming Lessons', 9.5, 11.5, 'pool', 'Lanes 1 to 3 belong to Maplewood Elementary: a line of armbands along the wall. Lanes 4 to 8 stay public.', { lanes: [1, 2, 3] }));
  if (wd === 0 || wd === 2 || wd === 4) out.push(S('aqua', 'Aqua-Aerobics with Dolores', 12, 13, 'pool', 'An hour of jogging on the spot in the shallow end to very loud disco. Included with your swim. Lanes 1 to 3.', { lanes: [1, 2, 3], join: true }));
  if (wd < 4) out.push(S('club', 'Marlins Squad Training', 17, 19, 'pool', 'The swim club takes lanes 4 to 8. Coach Okafor walks the deck with a stopwatch. Lanes 1 to 3 stay public.', { lanes: [4, 5, 6, 7, 8] }));
  if (wd === 2) out.push(S('drill', 'Lifeguard Rescue Drill', 16, 16.5, 'dive', 'The lifeguards practise a deep-water rescue in the diving well: a casualty, a torpedo buoy and a lot of whistle. Volunteers welcome.', { join: true }));
  if (wd === 4) out.push(S('teen', 'Friday Pool Party Night', 19, 22, 'leisure', 'Lights down, disco lights on, DJ Riptide on the deck and glow rings in the lazy river. Aimed at teenagers; nobody checks.', { join: true }));
  if (wd === 5) out.push(S('meet', 'Saturday Swim Meet', MEET.T0, MEET.T0 + MEET_EVENTS.length * MEET.SLOT / 60, 'pool', 'The Maple Bay Marlins against a visiting club: ten races, heats by lane, splits on the scoreboard. Free to watch from the stand. Warm-up from 13:30; the pool is closed to the public until 17:00.', { lanes: [1, 2, 3, 4, 5, 6, 7, 8] }));
  if (wd === 6) out.push(S('family', 'Family Fun Session', 10, 13, 'pool', 'The big inflatable obstacle course goes out on lanes 5 to 8. Run it, fall off it, run it again. Floats and noodles everywhere.', { lanes: [5, 6, 7, 8], join: true }));
  if (n.dayOfMonth === 9) out.push(S('ow', 'Open-Water Prep Night', 19.5, 21, 'pool', 'Lane ropes out, lights low, four orange buoys: pack swimming and sighting practice for the summer bay swims. Honorary Marlins only (swim level 5).', { lanes: [1, 2, 3, 4, 5, 6, 7, 8], join: true }));
  return out.sort((a, b) => a.from - b.from);
}
export function sessionNow(n, where) { const h = n.hf; return sessionsOn(n).find(s => h >= s.from - (s.id === 'meet' ? .5 : 0) && h < s.to + (s.id === 'meet' ? .5 : 0) && (!where || s.where === where)) || null; }
/** what each of the eight lanes is used for right now */
export function laneUse(n) { const s = sessionNow(n, 'pool'), out = LANES.map(l => l.band); if (s && s.lanes) for (const l of s.lanes) out[l - 1] = s.id === 'meet' ? 'meet' : s.id === 'family' ? 'fun' : s.id; return out; }
/** the outdoor deck: open-air season. 'summer' = loungers out; 'mild' = open but quiet (spring from day 8, autumn to day 7); 'winter' = covered */
export const lidoState = n => (n.season === 1 ? 'summer' : (n.season === 0 && n.dayOfMonth >= 8) || (n.season === 2 && n.dayOfMonth <= 7) ? 'mild' : 'winter');
export const inH = (h, r) => h >= r[0] && h < r[1];

/* ---------- the chain: the gap on the record board ---------- */
export const CLUES = [
  { short: 'The Courier archive at the Library', where: 'on the steps of the Public Library in the Arts District: the Courier is on microfilm there', anchor: 'door:library', dx: 2.5, dy: 1.5,
    found: 'The Maple Bay Courier, 14 August 1974, page 11: "DAWN SWIMMER SHATTERS CLUB MARK. R. Castellanos, 16, of Linden Street, took two full seconds off the 100 metres backstroke on Saturday. Coach Stern: \'She trains before the lifeguards are awake.\'" The photograph is a splash and half an elbow.' },
  { short: 'The sea-swimmers\' board at Gull Point Beach', where: 'out at Gull Point Beach, where the old sea-swimming club kept its roll', anchor: 'poi_lighthouse', dx: 16, dy: -10, name: 'Gull Point Beach',
    found: 'A weathered roll of the Gull Point Sea Swimmers, summer 1974, under cracked varnish. Halfway down: "Rosa Castellanos (jnr) - bay crossing, 41 min". Beside it, in different ink: "Moved to Port Alder, Sept. 75." Then, in ballpoint, much later: "Back!! 1983".' },
  { short: 'A bench by the Duck Pond', where: 'on a bench at the Duck Pond in the park: Walt says there is a plaque', anchor: 'poi_duck_pond', dx: 2, dy: 2,
    found: 'A brass plate on the back rail of a bench: "For Coach Abel Stern, who unlocked the door at half past five. From Rosa C.-W., lane two." Lane two. You have seen a woman in lane two. Everybody has. She is there at six every single morning.' },
];

/* ---------- venues ---------- */
const DAILY = (o, c) => [0, 1, 2, 3, 4, 5, 6].map(() => [o, c]);
const venue = (id, name, type, offers, hours, blurb) => (VENUE_BY_ID[id] = VENUE_BY_ID[id] || { id, name, type, district: 'maplewood', where: 'on Harbor Boulevard in Maplewood, the glass vault beside Railyard station', station: null, interior: true, hours, offers, priceMult: 1, jobId: null, delivers: false, blurb, showpiece: true });
venue(NV.place, NAME, 'leisure', { functions: [] }, DAILY(HOURS.open, HOURS.close), 'The public pool under the glass vault: an eight-lane competition pool, a diving well, a leisure pool with a lazy river, a wave machine and two slides, a sauna, a cafe and a summer lido. Home of the Maple Bay Marlins.');
venue(NV.shop, SHOP_NAME, 'shop', { shop: ['gift', 'misc', 'outfit'], functions: [] }, DAILY(HOURS.shop[0], HOURS.shop[1]), 'The swim shop in the entrance hall: goggles, caps, suits, towels, floats and noodles.');
venue(NV.cafe, CAFE_NAME, 'food', { menu: true, functions: [] }, DAILY(HOURS.cafe[0], HOURS.cafe[1]), 'Poolside chips, slushies in two colours and hot chocolate for blue lips. Wet customers welcome.');
venue(NV.vend, 'Natatorium Vending', 'food', { menu: true, functions: [] }, DAILY(HOURS.open, HOURS.close), 'Two machines by the turnstiles: water, flapjacks and emergency towels.');

/* ---------- moodlets ---------- */
const mood = (id, o) => { if (!MOODLETS[id]) MOODLETS[id] = Object.assign({ workPerf: 1, walkSpeed: 1, source: 'activity' }, o); };
mood('nat_swim', { name: 'A Good Swim', desc: 'Loose shoulders, red goggle rings, the smell of chlorine. You earned your dinner.', mood: 6, workPerf: 2, minutes: 300 });
mood('nat_pb', { name: 'Personal Best!', desc: 'Faster than you have ever swum it. The pace clock saw.', mood: 8, workPerf: 2, minutes: 360 });
mood('nat_drift', { name: 'Lazy River Calm', desc: 'Once round on a ring with your eyes shut. Nothing was required of you.', mood: 6, minutes: 240 });
mood('nat_waves', { name: 'Wave Machine!', desc: 'The siren went and the whole pool turned into the sea.', mood: 5, minutes: 180 });
mood('nat_soaked', { name: 'Got the Bucket', desc: 'Four hundred litres, straight on the head. You stood there on purpose.', mood: 4, minutes: 120 });
mood('nat_slide', { name: 'Flume Grin', desc: 'You came out of the tube backwards and laughing.', mood: 6, minutes: 180 });
mood('nat_contrast', { name: 'Hot-Cold Glow', desc: 'Sauna, then the cold plunge. Every nerve is awake and pleased about it.', mood: 8, workPerf: 3, minutes: 360 });
mood('nat_medal', { name: 'Medal Round Your Neck', desc: 'You stood on the podium at the Saturday meet. It clinks when you walk.', mood: 10, workPerf: 2, minutes: 600 });
mood('nat_damp', { name: 'Damp Hair, No Towel', desc: 'You got dressed wet. Your collar knows.', mood: -3, minutes: 90 });

/* ---------- items ---------- */
const SH = [NV.shop], CF = [NV.cafe], VD = [NV.vend];
const dish = (id, name, price, effects, eatMinutes, course, icon, at) => ({ id, name, category: 'dish', price, icon, effects, stack: 1, soldAt: at, venue: at[0], eatMinutes, course, takeaway: true });
const gift = (id, name, price, icon, relationship, giftTags, sold = SH) => ({ id, name, category: 'gift', price, icon, effects: {}, stack: 3, soldAt: sold, relationship, giftTags });
const misc = (id, name, price, icon, note, sold = SH, x) => Object.assign({ id, name, category: 'misc', price, icon, effects: {}, stack: 1, soldAt: sold, note }, x);
const outfit = (id, name, price, icon, key, note, styles) => ({ id, name, category: 'outfit', price, icon, effects: {}, stack: 1, soldAt: SH, outfit: key, styles: styles || ['sport'], perk: {}, note });
const NEW = [
  misc('nat_goggles', 'Racing Goggles', 12, 'blue swim goggles, black strap', 'Mirrored lenses. Keep them in your bag: you swim about four per cent faster when you can see the wall coming.'),
  misc('nat_cap', 'Marlins Swim Cap', 6, 'blue silicone cap, yellow marlin', 'Club blue with the yellow marlin. Worth a couple of per cent and keeps your hair out of the filters.'),
  misc('nat_towel', 'Maple Bay Beach Towel', 9, 'rolled striped towel, blue and white', 'Big, striped and yours. Keep it in your bag and you will never stand dripping at a locker again.', [NV.shop, NV.vend]),
  misc('nat_kickboard', 'Kickboard', 8, 'yellow foam kickboard', 'A slab of yellow foam. Your stamina comes back faster between efforts and lessons go easier.'),
  misc('nat_noseclip', 'Nose Clip', 3, 'small wire nose clip, pink pads', 'For divers and backstrokers. Judges like a clean entry: half a point, near enough.'),
  misc('nat_shampoo', 'Chlorine-Out Shampoo', 5, 'green bottle, wave label', 'Smells of apples. The showers in the changing village get you properly clean with it.'),
  gift('nat_noodle', 'Pool Noodle', 5, 'long pink foam noodle, bent', 5, ['fun', 'cute']),
  gift('nat_armbands', 'Orange Armbands', 4, 'pair of orange inflatable armbands', 4, ['cute', 'fun']),
  gift('nat_plush_marlin', 'Finley the Plush Marlin', 13, 'soft blue marlin, yellow bill', 8, ['cute', 'sporty']),
  gift('nat_ring', 'Flamingo Swim Ring', 11, 'pink inflatable ring, flamingo head', 6, ['fun', 'cute']),
  outfit('outfit_nat_marlins', 'Marlins Training Suit', 28, 'navy swimsuit, yellow side stripe', 'nat_marlins', 'The club suit: navy with the yellow stripe. Worn in the pool it is worth three per cent; worn in the street it is a choice.'),
  outfit('outfit_nat_retro', 'Retro Stripe Swimsuit', 22, 'red and white striped swimsuit', 'nat_retro', 'Candy stripes, 1974 cut. The lifeguards approve.'),
  outfit('outfit_nat_robe', 'Hooded Changing Robe', 38, 'long teal hooded robe, fleece lining', 'nat_robe', 'What the squad wears on the deck between races. Warm as a sleeping bag.', ['cozy', 'sport']),
  dish('nat_chips', 'Poolside Chips', 3.5, { hunger: 24, fun: 5 }, 7, 'snack', 'paper cone of thick chips, salt', CF),
  dish('nat_slush_blue', 'Blue Raspberry Slushie', 3, { fun: 9, energy: 4, hunger: 3 }, 5, 'drink', 'clear cup, bright blue slush, straw', CF),
  dish('nat_slush_red', 'Cherry Slushie', 3, { fun: 9, energy: 4, hunger: 3 }, 5, 'drink', 'clear cup, bright red slush, straw', CF),
  dish('nat_hotchoc', 'Blue-Lips Hot Chocolate', 3, { fun: 7, energy: 5, hunger: 6 }, 6, 'drink', 'white mug, cocoa, marshmallows', CF),
  dish('nat_toastie', 'Cheese Toastie', 5, { hunger: 38, fun: 4 }, 9, 'main', 'golden toasted sandwich, melted cheese', CF),
  dish('nat_lolly', 'Rocket Ice Lolly', 2, { fun: 8, hunger: 4 }, 4, 'dessert', 'red white blue rocket lolly on a stick', CF),
  dish('nat_flapjack', 'Vending Flapjack', 2, { hunger: 16, energy: 6 }, 3, 'snack', 'oat bar in a clear wrapper', VD),
  dish('nat_water', 'Bottle of Water', 1.5, { energy: 3, hunger: 1 }, 2, 'drink', 'clear bottle, blue cap', VD),
  misc('nat_badge', 'Swim Badge', 0, 'round sew-on badge, blue wave', 'A sew-on badge from Coach Okafor. One for every level you pass.', [], { stack: 5 }),
  misc('nat_medal_gold', 'Gold Medal: Novice 50 m', 0, 'gold medal, blue ribbon', 'First place, Saturday Swim Meet, Maple Bay Natatorium. Not for sale.', []),
  misc('nat_medal_silver', 'Silver Medal: Novice 50 m', 0, 'silver medal, blue ribbon', 'Second place, Saturday Swim Meet. Not for sale.', []),
  misc('nat_medal_bronze', 'Bronze Medal: Novice 50 m', 0, 'bronze medal, blue ribbon', 'Third place, Saturday Swim Meet. Not for sale.', []),
  misc('nat_whistle', 'Walt\'s Old Whistle', 0, 'brass whistle on a red lanyard', 'Fifty-odd years of "WALK, please." He gave it to you when Rosa\'s name went up on the board. Not for sale.', []),
];
export const NEW_ITEM_IDS = NEW.map(i => i.id);
const LISTS = { gift: GIFTS, misc: MISC, dish: DISHES, outfit: OUTFITS };
for (const it of NEW) { if (ITEM_BY_ID[it.id]) continue; ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (Array.isArray(LISTS[it.category])) LISTS[it.category].push(it); }
/** character spec overrides for the outfits (merged into wardrobe LOOKS by the sim). The swim looks use the art outfit 'swim' (trunks or a one-piece in topColor). */
export const NAT_LOOKS = {
  nat_marlins: { outfit: 'swim', topColor: '#22304e', accent: '#f2c230', hat: null, scarf: null }, nat_retro: { outfit: 'swim', topColor: '#d8402e', accent: '#f4f0e8', hat: null, scarf: null },
  nat_robe: { top: 'coat', topColor: '#2f8a8a', bottom: 'sweats', bottomColor: '#2f8a8a', shoes: '#f0ece4', hat: null, scarf: null, accent: '#f2c230' },
  nat_plain: { outfit: 'swim', hat: null, scarf: null },
};

/* ---------- calendar ---------- */
const EV = (id, name, when, hours, blurb, x) => { if (!EVENTS.some(e => e.id === id)) EVENTS.push(Object.assign({ id, name, kind: when.weekday !== undefined ? 'weekly' : 'seasonal', when, hours, place: { venue: NV.place }, blurb, special: { crowdMult: 1.2 }, notify: 2 }, x)); };
EV('nat_meet', 'Saturday Swim Meet at the Natatorium', { weekday: 5 }, [MEET.T0, MEET.T0 + MEET_EVENTS.length * MEET.SLOT / 60], 'The Maple Bay Marlins swim against a visiting club every Saturday at two: ten races, a live scoreboard, medals on the podium. Free from the spectator stand. Club-standard swimmers can enter the Novice 50 m.', { notify: 3, special: { crowdMult: 1.4 } });
EV('nat_teen_night', 'Friday Pool Party Night', { weekday: 4 }, [19, 22], 'Lights down in the leisure pool, a DJ on the deck, glow rings in the lazy river and the wave machine every half hour. Aimed at teenagers; nobody checks.', { special: { crowdMult: 1.3, moodlet: 'great_night_out' } });
EV('nat_family', 'Family Fun Session: the Inflatable', { weekday: 6 }, [10, 13], 'Sunday mornings the Natatorium puts a twenty-metre inflatable obstacle course on the competition pool. Run it against the clock.');
for (const [k, wd] of [['mon', 0], ['wed', 2], ['fri', 4]]) EV('nat_aqua_' + k, 'Aqua-Aerobics with Dolores', { weekday: wd }, [12, 13], 'Mondays, Wednesdays and Fridays at noon in the shallow end of the Natatorium. Loud disco, gentle on the knees, included with your swim.', { notify: 1 });
EV('nat_drill', 'Lifeguard Rescue Drill', { weekday: 2 }, [16, 16.5], 'Wednesdays at four the Natatorium lifeguards practise a deep-water rescue in the diving well. Stand and watch, or volunteer to be rescued.', { notify: 1 });
EV('nat_earlybird', 'Early-Bird Lanes', { weekday: 0 }, [6, 8], 'Every morning from six the competition pool is all lanes, all quiet. Cheaper before eight. The same faces in the same lanes for forty years.', { notify: 0 });
EV('nat_openwater', 'Open-Water Prep Night', { season: 'any', days: [9] }, [19.5, 21], 'Once a season the lane ropes come out of the competition pool: pack swimming round four orange buoys with the lights low. For Honorary Marlins (swim level 5).');
