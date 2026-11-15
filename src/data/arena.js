// arena.js — Maple Bay Arena (rooms 'arena', 'arena:bowl', 'arena:backstage'): venue records, stock, the Bay Coast League, the Otters, the season
// schedule, the deterministic game simulator, the concert acts and the family shows. Pure data + pure functions (no DOM, no G): the same
// functions run in node. Registered additively at import time (same pattern as observatory.js / museum.js): VENUE_BY_ID gets 'arena' (the place),
// 'arena:grill' (Dockside Dogs), 'arena:snacks' (Twist & Pop), 'arena:store' (The Otter Den); ITEMS / ITEM_BY_ID get the `arena_*` items;
// MOODLETS gets arena_buzz / arena_loss / arena_encore; calendar EVENTS gets the four weekly arena nights.
//
//   ARENA_HOURS [open, close]   ARENA_VENUES { place, grill, snacks, store }   TEAM   LEAGUE [8 teams]   TEAM_BY_ID   ROSTER [10 players]   STAFF
//   TIERS { nose, lower, court, floor }  (ticket tiers: name, price by event kind)      TUNE (all timing constants, world minutes)
//   ACTS [3 concert acts: { id, name, genre, c, c2, songs: [5 titles], encore, blurb }]      FAMILY [{ id: 'ice' | 'trucks', name, scenes, blurb }]
//   Time: a year = 56 days = 8 weeks. Matchdays Mon / Wed / Fri / Sat (32 rounds). The Otters are at home on Wednesdays and Saturdays (tip-off 19:00),
//   away on Mondays and Fridays. Friday night 20:00 = concert (acts rotate weekly). Sunday 14:00 = family show (ice show / mini monster trucks alternate).
//   eventOn(day) -> { kind: 'game' | 'concert' | 'ice' | 'trucks', key, day, T0 (abs world minute of the start), doors, end, out (everybody gone), title, sub, big, ... } | null
//   fixture(day) -> { year, r, opp, home (bool), T0 } | null (the Otters' game that day, home or away)        nextEvents(fromDay, n) -> [event]
//   game(year, r) -> the whole Otters game, simulated possession by possession from a seed (cached): { h, a (teams), final [h, a], qs, poss: [...], segs: [...],
//        len (world minutes tip to buzzer), buzzer (bool), top: { name, num, pts }, stats } — identical whether anybody watches or not, so saves made mid-game resume.
//   gameAt(g, w) -> { ph: 'pre' | 'q' | 'to' | 'break' | 'half' | 'final', q (1-4), clock (seconds left), score [h, a], p (possession | null), f (0..1 through it), i }
//   standings(t) -> [{ id, name, abbr, w, l, pf, pa }] sorted (every result decided before world minute t)      results(t, n) -> the Otters' last n results
//   CARDS [12 collector cards: the ten players + the coach + Ollie]      NEW_ITEM_IDS
import './venues_extra.js';
import { VENUE_BY_ID } from './venues.js';
import { ITEMS, ITEM_BY_ID, DISHES, GIFTS, MISC, OUTFITS } from './items.js';
import { MOODLETS } from './needs.js';
import { EVENTS } from './calendar.js';

export const ARENA_HOURS = [10, 23];
export const ARENA_VENUES = { place: 'arena', grill: 'arena:grill', snacks: 'arena:snacks', store: 'arena:store' };
const DAILY = (o, c) => [0, 1, 2, 3, 4, 5, 6].map(() => [o, c]);
const venue = (id, name, type, offers, blurb) => (VENUE_BY_ID[id] = VENUE_BY_ID[id] || { id, name, type, district: 'arts', where: 'on Arena Plaza, at the top of the Arts District', station: null, interior: true, hours: DAILY(ARENA_HOURS[0], ARENA_HOURS[1]), offers, priceMult: 1, jobId: null, delivers: false, blurb, showpiece: true });
venue(ARENA_VENUES.place, 'Maple Bay Arena', 'leisure', { functions: [] }, 'Home of the Maple Bay Otters. Basketball on Wednesdays and Saturdays, concerts on Fridays, a family show on Sunday afternoons, and the loudest eight thousand people in the bay.');
venue(ARENA_VENUES.grill, 'Dockside Dogs', 'food', { menu: true, functions: ['till'] }, 'Hot dogs, chili dogs and nachos on the arena concourse. The onions are free and so is the advice.');
venue(ARENA_VENUES.snacks, 'Twist & Pop', 'food', { menu: true, functions: ['till'] }, 'Warm pretzels, popcorn by the bucket and Otter Pop soda in a souvenir cup.');
venue(ARENA_VENUES.store, 'The Otter Den', 'shop', { shop: ['gift', 'misc', 'outfit'], functions: ['till'] }, 'The team store: jerseys, foam fingers, player cards and a plush Ollie with removable jersey.');

/* ---------- the club, the league ---------- */
export const TEAM = { id: 'otters', name: 'Maple Bay Otters', nick: 'Otters', abbr: 'MBO', c: '#d2392f', c2: '#f4f0e8', mascot: 'Ollie the Otter', founded: 1961, title: 1998, chant: 'LET\'S GO OT-TERS!' };
const T = (id, city, nick, abbr, c, c2, str, x) => Object.assign({ id, city, nick, name: city + ' ' + nick, abbr, c, c2, str }, x);
export const LEAGUE = [
  T('otters', 'Maple Bay', 'Otters', 'MBO', '#d2392f', '#f4f0e8', 74),
  T('herons', 'Harbor City', 'Herons', 'HCH', '#2f6fd0', '#f2c230', 77, { rival: true }),
  T('anchors', 'Port Alder', 'Anchors', 'PAA', '#2f3f72', '#c2cad4', 72),
  T('jacks', 'Cedar Falls', 'Lumberjacks', 'CFL', '#2f7a48', '#f0c040', 70),
  T('gulls', 'Saltmarsh', 'Gulls', 'SMG', '#7f8fa0', '#f08a2c', 63),
  T('foxes', 'Redcliff', 'Foxes', 'RCF', '#e0762c', '#33303f', 76),
  T('comets', 'Northpoint', 'Comets', 'NPC', '#7a55c8', '#e8e8ee', 68),
  T('pikes', 'Glasswater', 'Pikes', 'GWP', '#2f9a94', '#ead9b8', 66),
];
export const TEAM_BY_ID = Object.fromEntries(LEAGUE.map(t => [t.id, t]));
// slot = usual position on the floor (0 PG, 1 SG, 2 SF, 3 PF, 4 C); three / drive = shot taste; skin, hair = the look on court and on the cards
const P = (num, name, pos, slot, rate, three, bio, look) => ({ id: 'p' + num, num, name, last: name.split(' ').pop(), pos, slot, rate, three, bio, look });
export const ROSTER = [
  P(3, 'Dre Okafor', 'PG', 0, 80, .3, 'Point guard. Sees a pass two seconds before it exists. Grew up three blocks from the arena.', { skin: 7, hair: 'cornrows', hairColor: '#2b2433', height: 'avg', build: 'slim' }),
  P(11, 'Mateo Rivas', 'SG', 1, 78, .62, 'Shooting guard. Forty-one percent from the corner and he will tell you so.', { skin: 3, hair: 'short', hairColor: '#2b2433', height: 'avg', build: 'avg', beard: true }),
  P(24, 'Jalen Whitlock', 'SF', 2, 88, .38, 'Small forward and captain. The banner in the rafters is his retirement plan.', { skin: 6, hair: 'hightop', hairColor: '#2b2433', height: 'tall', build: 'avg' }),
  P(32, 'Tobias Lindqvist', 'PF', 3, 75, .15, 'Power forward. "Tree". Leads the league in rebounds and apologies.', { skin: 0, hair: 'sidepart', hairColor: '#e6c36a', height: 'tall', build: 'broad' }),
  P(50, 'Kwame Stone', 'C', 4, 79, .02, 'Centre. Seven foot one in socks. Has never knowingly missed a dunk.', { skin: 8, hair: 'buzz', hairColor: '#2b2433', height: 'tall', build: 'broad' }),
  P(7, 'Sam Nakamura', 'PG', 0, 72, .4, 'Sixth man. Comes off the bench like the kettle just boiled.', { skin: 2, hair: 'spiky', hairColor: '#2b2433', height: 'short', build: 'slim' }),
  P(15, 'Luca Benedetti', 'SG', 1, 70, .5, 'Guard. Headband, floater, sandwich shop on Lantern Row.', { skin: 2, hair: 'wavy', hairColor: '#4a3022', height: 'avg', build: 'avg', hat: 'headband', hatColor: '#f4f0e8' }),
  P(21, 'Eli Thunderbird', 'SF', 2, 73, .33, 'Rookie forward. Signed every autograph at the open day and then asked for more pens.', { skin: 4, hair: 'ponytail', hairColor: '#2b2433', height: 'tall', build: 'slim' }),
  P(44, 'Marcus Dufresne', 'PF', 3, 69, .1, 'Forward. "Moose". Sets screens you can hear from the car park.', { skin: 5, hair: 'bald', hairColor: '#2b2433', height: 'tall', build: 'broad', beard: true }),
  P(9, 'Andre Baptiste', 'C', 4, 68, .05, 'Veteran centre. Sixteenth season. Knows where every draught in the building comes from.', { skin: 6, hair: 'balding', hairColor: '#a9a9b4', height: 'tall', build: 'avg', beard: true }),
];
export const STAFF = { coach: 'Coach Wren Delacroix', equip: 'Benny Castellano, equipment manager', mascot: 'Priya, who is usually Ollie', mc: 'Big Stan, arena announcer', usher: 'Usher' };
export const CARDS = ROSTER.map(p => ({ id: p.id, name: p.name, num: p.num, pos: p.pos, bio: p.bio, rare: p.num === 24 ? 2 : p.rate >= 78 ? 1 : 0 }))
  .concat([{ id: 'coach', name: 'Coach Delacroix', num: 0, pos: 'HC', bio: 'Head coach. Played for the \'98 team. Chews one pencil per quarter.', rare: 1 }, { id: 'ollie', name: 'Ollie the Otter', num: 0, pos: 'MASCOT', bio: 'Mascot. Has never lost a dance-off. Refuses to discuss the fish incident.', rare: 2 }]);
const SUR = ['Abara', 'Lund', 'Castro', 'Ito', 'Mbeki', 'Novak', 'Reyes', 'Haas', 'Diallo', 'Oyelaran', 'Park', 'Santos', 'Voss', 'Greer', 'Tanaka', 'Bello', 'Quinn', 'Marsh', 'Osei', 'Ferro', 'Kader', 'Lowe', 'Vance', 'Pruitt'];

/* ---------- tickets + tuning ---------- */
export const TIERS = {
  nose: { id: 'nose', name: 'Upper bowl', sub: 'The nosebleeds: rows F to J. You can see the whole play develop, and Hillcrest.', price: { game: 8, concert: 14, ice: 8, trucks: 8 } },
  lower: { id: 'lower', name: 'Lower bowl', sub: 'Rows A to E, close enough to hear the sneakers.', price: { game: 16, concert: 22, ice: 12, trucks: 12 } },
  court: { id: 'court', name: 'Courtside', sub: 'A folding chair with your feet on the hardwood. Mind the loose balls.', price: { game: 45, ice: 20, trucks: 20 } },
  floor: { id: 'floor', name: 'Standing floor', sub: 'General admission in front of the stage. Dancing is not optional.', price: { concert: 28 } },
};
export const TUNE = {
  DOORS: 60, INTRO: 8,                       // doors open / lights-down player intros, world minutes before the start
  Q: 22, TO: 1.6, BRK: 2.5, HALF: 15,        // one quarter, one time-out, quarter break, half-time (world minutes)
  FINAL: 5, OUT: 32,                         // celebration after the buzzer; the building is empty this long after the end (autograph window = FINAL .. OUT)
  WATCH: .25, WATCH_FF: 3,                   // world minutes per real second while you sit and watch / fast-forward
  CONCERT: { len: 92, song: 15, gap: 1, encoreAt: 80, encoreLen: 12, watch: .3 },
  FAMILY: { len: 62, watch: .3 },
  CONTEST_PRIZE: 60, CONTEST_TRIES: 2, CATCH_WINDOW: .19, PACK: 3, AUTOS_PER_GAME: 3, SELL: { court: 46, lower: 9, nose: 1.2 }, // hours before the start at which a BIG night sells out
  MIN_WATCH: .4,                             // fraction of the event you must watch for the moodlet + stamp
};

/* ---------- schedule ---------- */
const DAY = 1440, YEAR = 56, MATCH_WD = [0, 2, 4, 5];
const h32 = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const rng = s => { s = (Math.abs(s | 0) % 2147483646) + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
/** the four pairings of round r: [[homeIdx, awayIdx], ...]; pair 0 is always the Otters' game */
export function pairs(r) {
  const wdSlot = r % 4, rot = r % 7, arr = []; for (let i = 0; i < 7; i++) arr.push(1 + (i + rot) % 7);
  const ottHome = wdSlot === 1 || wdSlot === 3, out = [ottHome ? [0, arr[0]] : [arr[0], 0]];
  for (let i = 1; i <= 3; i++) out.push((r + i) & 1 ? [arr[i], arr[7 - i]] : [arr[7 - i], arr[i]]);
  return out;
}
export const roundDay = (year, r) => year * YEAR + Math.floor(r / 4) * 7 + MATCH_WD[r % 4];
export function fixture(day) {
  if (day < 0) return null; const year = Math.floor(day / YEAR), d = day % YEAR, wd = d % 7, k = MATCH_WD.indexOf(wd); if (k < 0) return null;
  const r = Math.floor(d / 7) * 4 + k, pr = pairs(r)[0], home = pr[0] === 0, opp = LEAGUE[home ? pr[1] : pr[0]];
  return { year, r, opp, home, T0: day * DAY + 19 * 60, day };
}
export const ACTS = [
  { id: 'neontide', name: 'Neon Tide', genre: 'synth-pop', c: '#e84aa8', c2: '#3fd0e0', band: ['keys', 'singer', 'guitar', 'drums'], songs: ['Low Tide, High Hopes', 'Ferry Lights', 'Static Summer', 'Glass Harbour', 'Run to the Pier'], encore: 'Maple Bay Nights', scale: [0, 3, 5, 7, 10], root: 57, bpm: 124,
    blurb: 'Three synthesisers, one drum machine and a singer in a silver jacket. Their second album went gold on the strength of a song about the last ferry.' },
  { id: 'gullwings', name: 'The Gullwings', genre: 'indie rock', c: '#f09a3a', c2: '#d9483b', band: ['guitar', 'singer', 'bass', 'drums'], songs: ['Boardwalk Blues', 'Paper Lanterns', 'Last Tram Home', 'Salt & Vinegar', 'Seventeen Bus'], encore: 'Hey, Lighthouse', scale: [0, 2, 4, 7, 9], root: 52, bpm: 138,
    blurb: 'Four friends from the Railyard who still rehearse above a tyre shop. Loud, fast and home by eleven.' },
  { id: 'juniper', name: 'Mama Juniper & the Brass Parade', genre: 'funk & soul', c: '#f2c230', c2: '#8a55c8', band: ['bass', 'singer', 'horn', 'drums'], songs: ['Sunday Shoes', 'Hillcrest Shuffle', 'Sugar on the Docks', 'Second Line Down Main', 'Good Gravy'], encore: 'Everybody on the Ferry', scale: [0, 3, 5, 6, 7, 10], root: 50, bpm: 104,
    blurb: 'A nine-piece soul revue led by a woman who has never once started a show sitting down. Bring comfortable shoes.' },
];
export const FAMILY = [
  { id: 'ice', name: 'Maple Bay on Ice', sub: 'The Lighthouse Keeper\'s Winter', blurb: 'The court freezes over for one afternoon: eight skaters, a snowstorm of spotlights and a lighthouse keeper who has lost his lamp. Ollie skates. Badly.',
    scenes: [[0, 'Overture', 'The harbour freezes. One by one the skaters glide out of the dark.'], [11, 'The Keeper\'s Lamp', 'The lighthouse keeper wakes to find his lamp has gone out. He skates the long shore, looking.'], [23, 'The Snow Sisters', 'Two sisters made of snowflakes spin faster and faster. Do not blink.'], [35, 'Ollie on Ice', 'A certain otter has borrowed some skates. This was not in the programme.'], [45, 'The Great Thaw', 'Everybody on the ice. The lamp is lit. Spring is coming.'], [57, 'Curtain Call', 'One more lap, and a wave for the back row.']] },
  { id: 'trucks', name: 'Mini Monster Truck Mayhem', sub: 'Small trucks. Big noise.', blurb: 'Half-size monster trucks with full-size attitude: ramp jumps, a pyramid of scrap cars and a freestyle final judged entirely by how loud you shout.',
    scenes: [[0, 'Parade Lap', 'Engines! Four trucks roll out: Lil\' Crusher, Maple Mauler, Tidal Wave and The Gullet.'], [10, 'The Long Jump', 'One ramp, three scrap cars. Clear them all, or do not. Both are popular.'], [24, 'Donut Derby', 'Round and round and round. The dirt is supposed to do that.'], [36, 'Head to Head', 'Two lanes, two trucks, one very small finish line.'], [47, 'Freestyle Final', 'Anything goes. Make some noise for your favourite!'], [58, 'Victory Lap', 'Wave to the drivers. They are waving at you.']] },
];
const big = (fx) => !!(fx.opp.rival || fx.r >= 28 || (fx.opp.str >= 76 && fx.r % 4 === 3));
/** the arena's event on an absolute day (at most one a day) */
export function eventOn(day) {
  if (day < 0) return null; const year = Math.floor(day / YEAR), d = day % YEAR, wd = d % 7, week = Math.floor(d / 7), mk = (o, len) => Object.assign(o, { day, doors: o.T0 - TUNE.DOORS, len, end: o.T0 + len, out: o.T0 + len + TUNE.OUT });
  if (wd === 2 || wd === 5) { const fx = fixture(day); if (!fx || !fx.home) return null;
    return mk({ kind: 'game', key: 'g' + year + '_' + fx.r, T0: fx.T0, title: 'Otters vs ' + fx.opp.nick, sub: 'Bay Coast League · ' + fx.opp.name + (fx.opp.rival ? ' · the Ferry Derby' : ''), big: big(fx), year, r: fx.r, opp: fx.opp }, gameLen()); }
  if (wd === 4) { const act = ACTS[(year * 8 + week) % ACTS.length]; return mk({ kind: 'concert', key: 'c' + day, T0: day * DAY + 20 * 60, title: act.name, sub: 'Friday Night Live · ' + act.genre, big: act.id === 'neontide', act }, TUNE.CONCERT.len); }
  if (wd === 6) { const sh = FAMILY[week % 2]; return mk({ kind: sh.id, key: 'f' + day, T0: day * DAY + 14 * 60, title: sh.name, sub: 'Sunday Family Show · ' + sh.sub, big: false, show: sh }, TUNE.FAMILY.len); }
  return null;
}
export function nextEvents(fromDay, n = 6, fromT = -1) { const out = []; for (let d = Math.max(0, fromDay); out.length < n && d < fromDay + 40; d++) { const e = eventOn(d); if (e && e.out > fromT) out.push(e); } return out; }

/* ---------- the game simulator ---------- */
export const gameLen = () => 4 * (TUNE.Q + TUNE.TO) + 2 * TUNE.BRK + TUNE.HALF;
const GAMES = new Map();
const oppRoster = (t, year) => { const r = rng(t.id.charCodeAt(0) * 131 + t.id.charCodeAt(1) * 17 + year * 7), nums = [1, 4, 5, 8, 10, 12, 13, 20, 22, 23, 30, 33, 34, 41, 55], used = new Set(), out = [];
  for (let i = 0; i < 8; i++) { let s, n; do { s = SUR[Math.floor(r() * SUR.length)]; } while (used.has(s)); used.add(s); do { n = nums[Math.floor(r() * nums.length)]; } while (used.has(n)); used.add(n); out.push({ id: t.id + i, num: n, name: s, last: s, slot: i % 5, rate: 66 + Math.floor(r() * 18), three: [.35, .55, .35, .15, .04][i % 5], look: { skin: Math.floor(r() * 9), hair: ['short', 'buzz', 'cornrows', 'hightop', 'locs', 'bald', 'spiky', 'curly'][Math.floor(r() * 8)], hairColor: '#2b2433', height: i % 5 > 1 ? 'tall' : 'avg', build: i % 5 > 2 ? 'broad' : 'avg' } }); }
  return out; };
/** simulate one Otters game (home or away). Deterministic in (year, r). */
export function game(year, r) {
  const key = year + ':' + r; let g = GAMES.get(key); if (g) return g;
  const pr = pairs(r)[0], H = LEAGUE[pr[0]], A = LEAGUE[pr[1]], seed = (year * 977 + r * 131 + 7) | 0, R = rng(seed * 2654435 + 99), rosters = [pr[0] === 0 ? ROSTER : oppRoster(H, year), pr[1] === 0 ? ROSTER : oppRoster(A, year)];
  const thr = h32(year, r, 5) < ((H.rival || A.rival) ? .3 : .13), thrTeam = h32(year, r, 6) < .66 ? 0 : 1, edge = (H.str - A.str) * .0042 + .014;
  const lineup = q => [0, 1].map(tm => { const n = rosters[tm].length, base = [0, 1, 2, 3, 4]; if (q === 1 || q === 2) { const k = Math.floor(h32(seed, q, tm) * 5), k2 = (k + 2) % 5; base[k] = 5 + k % (n - 5); base[k2] = 5 + (k2 % (n - 5)); if (base[k] === base[k2]) base[k2] = k2; } return base; });
  const poss = [], segs = [], sc = [0, 0], qs = [], QS = 720; let w = 0, ball = h32(seed, 1, 1) < .5 ? 0 : 1;
  for (let q = 0; q < 4; q++) {
    const L = lineup(q), s0 = sc.slice(); let c = 0, toDone = false; segs.push({ k: 'q', q, w0: w, w1: w + TUNE.Q + TUNE.TO });
    while (c < QS) {
      if (!toDone && c >= 340) { toDone = true; segs.push({ k: 'to', q, w0: w, w1: w + TUNE.TO, c }); w += TUNE.TO; }
      let dur = 13 + R() * 12; if (c + dur > QS - 6) dur = QS - c; const tm = ball, off = tm === 0 ? .5 + edge : .5 - edge, k = R(); let kind, pts = 0, made = false, slot;
      const lu = L[tm], ro = rosters[tm], wts = lu.map(i => ro[i].rate - 55), tot = wts.reduce((a, b) => a + b, 0); let pk = R() * tot; slot = 0; for (let i = 0; i < 5; i++) { pk -= wts[i]; if (pk <= 0) { slot = i; break; } }
      const pl = ro[lu[slot]], p3 = .16 + pl.three * .38;
      if (k < .09) kind = 'to'; else if (k < .19) { kind = 'ft'; pts = (R() < .76 ? 1 : 0) + (R() < .76 ? 1 : 0); made = pts > 0; }
      else if (k < .19 + p3) { kind = 'three'; made = R() < off * .72; pts = made ? 3 : 0; }
      else { made = R() < off * 1.04 + (pl.rate - 74) * .003; kind = made && (pl.slot >= 3 ? R() < .45 : R() < .12) ? 'dunk' : 'two'; pts = made ? 2 : 0; }
      const ast = (slot + 1 + Math.floor(R() * 4)) % 5, oreb = !made && kind !== 'to' && kind !== 'ft' && R() < .2;
      sc[tm] += pts; poss.push({ q, c0: c, c1: c + dur, w0: w, w1: w + dur / QS * TUNE.Q, tm, kind, pts, made, slot, pi: lu[slot], ast, oreb, sc: sc.slice(), lu: L });
      w += dur / QS * TUNE.Q; c += dur; if (!oreb) ball = 1 - ball;
    }
    if (!toDone) { segs.push({ k: 'to', q, w0: w, w1: w + TUNE.TO, c: QS }); w += TUNE.TO; }
    segs[segs.findIndex(s => s.k === 'q' && s.q === q)].w1 = w; qs.push([sc[0] - s0[0], sc[1] - s0[1]]);
    if (q === 0 || q === 2) { segs.push({ k: 'break', q, w0: w, w1: w + TUNE.BRK }); w += TUNE.BRK; } else if (q === 1) { segs.push({ k: 'half', q, w0: w, w1: w + TUNE.HALF }); w += TUNE.HALF; }
  }
  // the ending: thrillers are steered to a last-second shot; nobody goes home with a draw
  const last = poss[poss.length - 1], rescore = () => { const s = [0, 0]; for (const p of poss) { s[p.tm] += p.pts; p.sc = s.slice(); } sc[0] = s[0]; sc[1] = s[1]; };
  const setRes = (p, on) => { if (p.kind === 'to' || p.kind === 'ft') { p.kind = 'two'; } p.made = on; p.pts = on ? (p.kind === 'three' ? 3 : 2) : 0; if (!on && p.kind === 'dunk') p.kind = 'two'; };
  let buzzer = false;
  if (thr) { const X = thrTeam; last.tm = X; last.pts = 0; last.made = false; rescore(); let m = sc[X] - sc[1 - X], guard = 0;
    for (let i = poss.length - 2; i > poss.length - 40 && guard < 60 && (m > 0 || m < -2); i--, guard++) { const p = poss[i]; if (m > 0) { if (p.tm === X && p.made) { m -= p.pts; setRes(p, false); } else if (p.tm !== X && !p.made) { setRes(p, true); m -= p.pts; } } else { if (p.tm === X && !p.made) { setRes(p, true); m += p.pts; } else if (p.tm !== X && p.made) { m += p.pts; setRes(p, false); } } }
    rescore(); m = sc[X] - sc[1 - X]; if (m <= 0 && m >= -2) { last.kind = m === -2 ? 'three' : h32(seed, 9, 9) < .5 ? 'three' : 'two'; last.made = true; last.pts = last.kind === 'three' ? 3 : 2; last.slot = X === 0 && pr[0] === 0 || X === 1 && pr[1] === 0 ? 2 : last.slot; last.pi = last.lu[X][last.slot]; buzzer = true; } rescore(); }
  if (sc[0] === sc[1]) { last.tm = h32(seed, 3, 3) < .6 ? 0 : 1; last.kind = 'two'; last.made = true; last.pts = 2; last.pi = last.lu[last.tm][last.slot]; buzzer = true; rescore(); }
  { let a = [0, 0], qi = 0; qs.length = 0; for (let q = 0; q < 4; q++) { const s = [0, 0]; for (const p of poss) if (p.q === q) s[p.tm] += p.pts; qs.push(s); } }
  const stats = [{}, {}]; for (const p of poss) if (p.pts) { const id = rosters[p.tm][p.pi].id; stats[p.tm][id] = (stats[p.tm][id] || 0) + p.pts; }
  const ot = pr[0] === 0 ? 0 : 1, best = Object.entries(stats[ot]).sort((a, b) => b[1] - a[1])[0] || [ROSTER[2].id, 0], bp = ROSTER.find(p => p.id === best[0]) || ROSTER[2];
  g = { key, year, r, h: H, a: A, ot, home: ot === 0, rosters, final: sc.slice(), qs, poss, segs, len: w, buzzer, buzzTeam: buzzer ? last.tm : -1, won: sc[ot] > sc[1 - ot], top: { id: bp.id, name: bp.name, num: bp.num, pts: best[1] }, stats };
  GAMES.set(key, g); if (GAMES.size > 80) GAMES.delete(GAMES.keys().next().value); return g;
}
/** where the game is, w world minutes after the tip */
export function gameAt(g, w) {
  if (w < 0) return { ph: 'pre', q: 1, clock: 720, score: [0, 0], p: null, f: 0, i: -1 };
  if (w >= g.len) return { ph: 'final', q: 4, clock: 0, score: g.final, p: null, f: 1, i: g.poss.length };
  let lo = 0, hi = g.poss.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (g.poss[m].w0 <= w) lo = m; else hi = m - 1; }
  const p = g.poss[lo], prev = p.w0 <= w ? p : null, done = prev && w >= p.w1, score = !prev ? [0, 0] : done ? p.sc : lo > 0 ? g.poss[lo - 1].sc : [0, 0];
  for (const s of g.segs) if (s.k !== 'q' && w >= s.w0 && w < s.w1) return { ph: s.k, q: s.q + 1, clock: s.k === 'to' ? 720 - s.c : s.k === 'half' || s.k === 'break' ? 0 : 0, score: prev ? (done ? p.sc : score) : [0, 0], p: null, f: (w - s.w0) / (s.w1 - s.w0), i: lo, seg: s };
  if (prev && !done) { const f = (w - p.w0) / (p.w1 - p.w0); return { ph: 'q', q: p.q + 1, clock: Math.max(0, 720 - (p.c0 + (p.c1 - p.c0) * f)), score: f > .86 ? p.sc : score, p, f, i: lo }; }
  return { ph: 'q', q: p.q + 1, clock: Math.max(0, 720 - p.c1), score: p.sc, p: null, f: 1, i: lo };
}
const quick = (year, r, i, hi, ai) => { const H = LEAGUE[hi], A = LEAGUE[ai], d = (H.str - A.str) * .55 + 2.5, n1 = h32(year * 31 + r, i, 11), n2 = h32(year * 31 + r, i, 12), m = Math.round(d + (n1 + n2 - 1) * 22), base = 62 + Math.floor(h32(year * 31 + r, i, 13) * 22); let h = base + Math.max(0, m), a = base + Math.max(0, -m); if (h === a) h += 1; return [h, a]; };
/** league table from every game finished before world minute t (this year) */
export function standings(t) {
  const day = Math.floor(t / DAY), year = Math.floor(day / YEAR), tb = LEAGUE.map(x => ({ id: x.id, name: x.name, nick: x.nick, abbr: x.abbr, c: x.c, w: 0, l: 0, pf: 0, pa: 0 }));
  for (let r = 0; r < 32; r++) { const T0 = roundDay(year, r) * DAY + 19 * 60; if (T0 + gameLen() > t) break; const pr = pairs(r);
    pr.forEach((p, i) => { const s = i === 0 ? game(year, r).final : quick(year, r, i, p[0], p[1]), h = tb[p[0]], a = tb[p[1]]; h.pf += s[0]; h.pa += s[1]; a.pf += s[1]; a.pa += s[0]; if (s[0] > s[1]) { h.w++; a.l++; } else { a.w++; h.l++; } }); }
  return tb.sort((a, b) => b.w - a.w || (b.pf - b.pa) - (a.pf - a.pa) || a.name.localeCompare(b.name));
}
/** the Otters' last n finished games, newest first */
export function results(t, n = 5) {
  const day = Math.floor(t / DAY), year = Math.floor(day / YEAR), out = [];
  for (let r = 31; r >= 0 && out.length < n; r--) { const d = roundDay(year, r), T0 = d * DAY + 19 * 60; if (T0 + gameLen() > t) continue; const g = game(year, r); out.push({ day: d, r, opp: g.home ? g.a : g.h, home: g.home, us: g.final[g.ot], them: g.final[1 - g.ot], won: g.won, buzzer: g.buzzer }); }
  return out;
}

/* ---------- moodlets + calendar ---------- */
const ML = (id, name, desc, mood, minutes) => { if (!MOODLETS[id]) MOODLETS[id] = { name, desc, mood, workPerf: 0, walkSpeed: 1, minutes, source: 'activity' }; };
ML('arena_buzz', 'What a Game!', 'The Otters won and you were there. Your voice may come back by Thursday.', 8, 360);
ML('arena_loss', 'We Go Again', 'A tough loss. But you stayed to the end, and that is what counts.', 2, 180);
ML('arena_encore', 'Ears Still Ringing', 'You stayed for the encore. Everything sounds slightly far away and wonderful.', 8, 360);
ML('arena_star', 'Fifteen Seconds of Fame', 'Eight thousand people saw you on the big screen.', 6, 240);
const EV = (id, name, weekday, hours, blurb, x) => { if (!EVENTS.some(e => e.id === id)) EVENTS.push(Object.assign({ id, name, kind: 'weekly', when: { weekday }, hours, place: { venue: ARENA_VENUES.place }, blurb, special: { crowdMult: 1.3 }, notify: 3 }, x)); };
EV('arena_game_wed', 'Otters Basketball: Wednesday Home Game', 2, [19, 21], 'The Maple Bay Otters at home in the Bay Coast League. Doors 18:00, tip-off 19:00. Upper bowl from $8; the box office on Arena Plaza has this week\'s opponent.');
EV('arena_game_sat', 'Otters Basketball: Saturday Home Game', 5, [19, 21], 'Saturday night basketball at Maple Bay Arena: half-time shot contest, T-shirt cannon and Ollie the Otter. Doors 18:00, tip-off 19:00. Big games sell out: buy ahead.');
EV('arena_live_fri', 'Friday Night Live at the Arena', 4, [20, 21.6], 'A concert every Friday: Neon Tide, The Gullwings and Mama Juniper & the Brass Parade take turns. Doors 19:00. Standing floor or a seat in the bowl. Stay for the encore.');
EV('arena_family_sun', 'Sunday Family Show at the Arena', 6, [14, 15.1], 'Sunday afternoon at the arena: "Maple Bay on Ice" one week, Mini Monster Truck Mayhem the next. Doors 13:00. Any seat from $8.');

/* ---------- items ---------- */
const G_ = [ARENA_VENUES.grill], S_ = [ARENA_VENUES.snacks], D_ = [ARENA_VENUES.store];
const dish = (id, name, price, effects, eatMinutes, course, icon, at) => ({ id, name, category: 'dish', price, icon, effects, stack: 1, soldAt: at, venue: at[0], eatMinutes, course, takeaway: true });
const gift = (id, name, price, icon, relationship, giftTags, sold = D_) => ({ id, name, category: 'gift', price, icon, effects: {}, stack: 3, soldAt: sold, relationship, giftTags });
const misc = (id, name, price, icon, note, sold = D_, stack = 1) => ({ id, name, category: 'misc', price, icon, effects: {}, stack, soldAt: sold, note });
const outfit = (id, name, price, icon, key, sold, note) => ({ id, name, category: 'outfit', price, icon, effects: {}, stack: 1, soldAt: sold, outfit: key, styles: ['casual', 'sporty'], perk: {}, note });
const NEW = [
  dish('arena_hotdog', 'Dockside Dog', 5, { hunger: 30, fun: 4 }, 6, 'main', 'hot dog in a bun, mustard zigzag', G_),
  dish('arena_chili_dog', 'Full-Court Chili Dog', 6.5, { hunger: 40, fun: 5 }, 8, 'main', 'hot dog under chili and cheese', G_),
  dish('arena_nachos', 'Buzzer-Beater Nachos', 6, { hunger: 28, fun: 7 }, 8, 'snack', 'tray of chips, yellow cheese, jalapenos', G_),
  dish('arena_corn_dog', 'Corn Dog', 4, { hunger: 20, fun: 4 }, 5, 'snack', 'golden corn dog on a stick', G_),
  dish('arena_pretzel', 'Warm Salted Pretzel', 4, { hunger: 22, fun: 5 }, 6, 'snack', 'big brown pretzel, white salt', S_),
  dish('arena_popcorn', 'Bucket of Popcorn', 4.5, { hunger: 16, fun: 8 }, 8, 'snack', 'red and white striped bucket, popcorn', S_),
  dish('arena_soda', 'Otter Pop Soda', 3, { energy: 6, fun: 5, hunger: 3 }, 4, 'drink', 'red souvenir cup, straw, otter logo', S_),
  dish('arena_lemonade', 'Half-Time Lemonade', 3.5, { energy: 5, fun: 6, hunger: 3 }, 4, 'drink', 'clear cup, yellow lemonade, lemon slice', S_),
  dish('arena_cotton_candy', 'Cotton Candy', 4, { hunger: 8, fun: 11, moodlet: 'sweet_treat' }, 5, 'dessert', 'pink cloud on a paper cone', S_),
  misc('arena_foam_finger', 'Foam Finger', 9, 'big red foam hand, one finger up', 'OTTERS #1. Wave it from your seat: the people behind you will love it.'),
  misc('arena_card_pack', 'Otters Card Pack', 4, 'red foil packet, otter logo', 'Three player cards, sealed. Opens the moment you buy it. Twelve cards to collect.', D_, 9),
  misc('arena_program', 'Game Night Programme', 3, 'glossy red booklet, player on the cover', 'Rosters, league table and somewhere to collect autographs by the tunnel after the game.'),
  gift('arena_pennant', 'Otters Pennant', 7, 'red felt triangle flag, cream letters', 5, ['fun', 'sporty']),
  gift('arena_plush_ollie', 'Plush Ollie', 14, 'soft brown otter in a red jersey', 8, ['cute']),
  gift('arena_mini_ball', 'Mini Basketball', 10, 'small orange basketball, black seams', 6, ['fun', 'sporty']),
  gift('arena_scarf', 'Supporters Scarf', 12, 'red and cream striped scarf', 6, ['cozy', 'sporty']),
  outfit('arena_jersey', 'Otters Home Jersey', 48, 'red basketball jersey, cream number', 'arena_jersey', D_, 'The red home jersey. The crowd counts you as one of their own.'),
  outfit('arena_tshirt', 'Cannon T-Shirt', 0, 'cream t-shirt, red otter print', 'arena_tshirt', [], 'Fired out of a cannon by an otter and caught by you. Not for sale.'),
  gift('arena_signed_ball', 'Signed Game Ball', 0, 'basketball covered in black signatures', 14, ['rare', 'sporty', 'fancy'], []),
  misc('arena_gold_card', 'Gold Otter Card', 0, 'shining gold card, otter silhouette', 'For completing the Otters album. One of one hundred. Not for sale.', []),
  misc('arena_lucky_ball', 'The Lucky Game Ball', 0, 'old worn basketball, faded signatures', 'The 1998 championship ball. Every Otter touches it before tip-off. Benny wants it back.', []),
];
export const NEW_ITEM_IDS = NEW.map(i => i.id);
const LISTS = { gift: GIFTS, misc: MISC, dish: DISHES, outfit: OUTFITS };
for (const it of NEW) { if (ITEM_BY_ID[it.id]) continue; if (it.effects && it.effects.moodlet && !MOODLETS[it.effects.moodlet]) delete it.effects.moodlet; ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (Array.isArray(LISTS[it.category])) LISTS[it.category].push(it); }
/** character spec overrides for the two outfits (merged into wardrobe LOOKS by the sim) */
export const ARENA_LOOKS = { arena_jersey: { top: 'tank', topColor: TEAM.c, accent: TEAM.c2, innerColor: TEAM.c2 }, arena_tshirt: { top: 'graphic', topColor: TEAM.c2, accent: TEAM.c } };

/* ---------- words ---------- */
export const LINES = {
  fan: ['LET\'S GO OTTERS!', 'Whitlock is having a season. A SEASON.', 'I have had the same seat since ninety-eight. Row C. Do not ask what I paid.', 'If Tree gets one more rebound I am naming my dog after him.', 'The nachos are a meal. Do not let anyone tell you otherwise.', 'My voice goes every Saturday. Worth it.', 'Did you see Ollie do the worm? Mascot of the year.', 'Herons fans are fine. Individually. In small numbers.', 'Rivas from the corner. Just give him the ball.', 'I come for the T-shirt cannon. The basketball is a bonus.'],
  kid: ['OLLIE! OLLIE! OVER HERE!', 'I am going to catch a T-shirt. I have been practising.', 'Kwame Stone is SEVEN FEET TALL.', 'Can I have a foam finger? Pleeease?', 'I got Whitlock in my card pack! He is SHINY!'],
  away: ['Somebody has to cheer for the visitors.', 'Three hours on the coach for this. Come on, lads.', 'Lovely arena. Shame about the home team.', 'We will see who is singing at the end.'],
  quiet: ['The court looks bigger when it is empty.', 'I am on the tour. They let you stand at centre court.', 'Box office is by the door. Saturday is selling fast.', 'You can smell the popcorn even when it is shut.'],
  grill: ['Onions? Mustard? Both. Good answer.', 'Chili dog is the special. It is always the special.', 'Half-time rush in four minutes. Order now, thank me later.'],
  snacks: ['Pretzels are warm. Popcorn is warmer.', 'Souvenir cup is yours to keep. Refills at the next game.', 'Cotton candy: pink or pink.'],
  store: ['Card packs are behind the counter. Three cards a pack, twelve to find.', 'The foam finger is our bestseller. The scarf is for people with dignity.', 'Home jersey, Whitlock twenty-four on the back. Everybody wants the twenty-four.'],
  usher: ['Ticket, please. Enjoy the game!', 'Section one-oh-four, straight through.', 'No ticket, no bowl. Box office is by the main doors.'],
  concert: ['I have seen them four times. This is the fifth. I regret nothing.', 'If they do not play the ferry song I am asking for my money back.', 'Earplugs? In MY generation?', 'The floor is where it is at. Come down the front!'],
  family: ['My daughter has been wearing her skates since Thursday.', 'Is the loud bit soon? He likes the loud bit.', 'We come every other Sunday. It is cheaper than a babysitter.'],
  post_w: ['WHAT A GAME!', 'Did you SEE that?', 'Otters! Otters! Otters!', 'I am never washing this foam finger.', 'Best night of the season.'],
  post_l: ['We go again Saturday.', 'The referee needs glasses. And a map.', 'Next time. Next time.', 'Still love them. Unfortunately.'],
  player: ['Thanks for coming out tonight.', 'Loud in there tonight. We heard you.', 'You want it made out to anybody?', 'Good crowd. Great crowd.'],
};
export const CHANTS = { home: ['LET\'S GO OT-TERS!', 'DE-FENSE!', 'OT-TERS! OT-TERS!', 'MAKE SOME NOISE!'], run: ['HERE WE GO!', 'ONE MORE! ONE MORE!'], away: ['...'], ft: ['MISS IT! MISS IT!'], to: ['TIME OUT'] };
export const ADS = ['OTTER POP SODA', 'DOCKSIDE DOGS', 'RIDE THE LIGHT RAIL', 'MAPLECAB', 'WANDER GUIDE', 'TWIST & POP', 'THE OTTER DEN', 'HARBOR FM 98.1'];
