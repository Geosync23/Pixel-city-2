// Maple Bay Natatorium (showpiece S9) — gameplay for the converted public pool: the existing city building `bld.civic.pool` (308,279) on Harbor Boulevard in Maplewood. Nothing in the city layout is touched.
// Rooms: scenes/rooms/natatorium.js (`natatorium` entrance hall, `natatorium:change` changing village), natatorium_pool.js (`natatorium:pool` competition pool + diving well + stand),
//   natatorium_leisure.js (`natatorium:leisure` lazy river, wave pool, slides, toddler zone, wellness, cafe), natatorium_lido.js (`natatorium:lido` outdoor deck); effects: natatorium_fx.js.
// Data + the deterministic gala simulator: data/natatorium.js. Art: art/showpiece/natatorium.js, natatorium_leisure.js, _nat_lib.js, _nat_icons.js.
//
// City (once per city world, order 57.6 = before places / addresses): the building's sign is re-lettered NATATORIUM in teal (its params only; same object, same footprint), it gets a door poi
//   `door:natatorium` (room 'natatorium') + interactable, and four small props on its own lawn strip (a sign totem, two flags, a session board). Three chain pois `nat:clue:0..2` (Library steps,
//   Gull Point Beach, Duck Pond). G.places id 'natatorium'. Open daily 06:00-22:00 (leisure pool 09:00-21:00, Fridays to 22:00; lido 09:00-19:00 outside winter).
// G.natatorium = {
//   isOpen(), enter() (city door), leave(), go(dest: 'hall' | 'stand' | 'change' | 'pool' | 'leisure' | 'lido', from?), entryOk(), member(), buy(kind: 'swim' | 'card' | 'member' | 'active' | 'wellness') -> bool,
//   desk(), shop(), vending(), cafe(), kiosk(), records(), timetable(), honours(), lookMural(), lookWindow(), lookBoard(), lookSlideBoard(), lookCover(), whiteboard(), turnstile(), cubicle(),
//   locker(fx?) (swimwear on / off; the forgotten-towel moment), swimwear(on), shower(i), dryer(), towel() (hire),
//   level() -> 1..5, lesson() -> Promise<bool>, lane(n) (menu), swim({ lane, dist (metres, 0 = free swim), stroke, auto }) -> bool, swimming() -> state | null, pb() -> { 25, 50, 100, 400 },
//   dive(boardId, diveId?, auto?) -> Promise<{ scores, total } | null>, slides(which?, auto?) -> Promise<time | null>, river(), waves(), bucket(), hotTub(), sauna(fx, kind), plunge(fx), lounger(fx),
//   aqua(auto?) -> Promise<score | null>, party(auto?), inflatable(auto?) -> Promise<time | null>, openWater(), drill(), sitStand(), enterRace() -> bool, race(auto?) -> bool, myRace(meet) -> { time, place, name } | null,
//   talkWalt(c), talkCoach(c), talkRosa(c), chain() -> { st: 0 none | 1 looking for clues | 2 knows who | 3 Rosa agreed | 4 swam her 100 back | 5 done, clues: { i: 1 } }, clue(i), clues() -> [{ i, x, y, got }],
//   mini: { state(), tap(), lean(dir -1 | 1), pace(id), auto(on) } (the open rhythm / timing game: for keys, buttons and tests), meet() -> meetAt(now), sessions(day?), playerName(), stats(), arrived / left (room hooks), door() }
// State: G.state.natatorium = { visits, lastDay, ticketDay, card, memberUntil, wellDay, through, swim, suit, rinsed, locker, wet, towelDay, level, lessons, lessonDay, metres, lengths, pb: { d: s }, stroke,
//   dives, diveBest: { board: total }, slides: { flume, drop, n }, river, waves, buckets, tubs, saunas, plunges, saunaT, contrast, aqua, parties, infl, watch, watchKey, entry (week), race: { week: { time, place } },
//   medals: [g, s, b], drills, ow, chain: { st, clues } }.   Flag G.state.flags.nat_pass = free entry for life (the chain reward).
// Events: 'natatorium:visit'(first), ':entry'(kind), ':swimwear'(on), ':length'(n, lane), ':swim'({ dist, time, pb, stroke }), ':level'(n), ':dive'({ board, dive, scores, total }), ':slide'(id, time), ':river'(laps),
//   ':waves'(on) (room), ':bucket' (room), ':whistle' (room), ':contrast', ':race'({ time, place }), ':chain'(st), ':clue'(i).
// Guide stamps: x:nat_visit, x:nat_swim, x:nat_400, x:nat_badge, x:nat_dive, x:nat_slides, x:nat_river, x:nat_waves, x:nat_contrast, x:nat_meet, x:nat_race, x:nat_party.
// Tuning: data/natatorium.js SWIM (speeds by level, rhythm floor / gain, stamina, gear bonuses), PRICE, LEVELS, DIVES, SLIDES, WAVES, BUCKET, MEET; here RINSE_MIN 2, SHOWER_MIN 8, SAUNA_MIN 12, PLUNGE_MIN 2, TUB_MIN 20, WATCH_STAMP 20.
import { G } from '../core/game.js';
import { el, root, toast, bubble, say, choose, modal } from '../ui/kit.js';
import { enterRoom, exitRoom } from '../scenes/interior.js';
import { nearestFree } from '../engine/nav.js';
import { CORE, CORE_BLURB, EXPERIENCES } from './_guide_data.js';
import { getCity } from '../world/_city.js';
import { LOOKS } from './wardrobe.js';
import { NR, NV, NAME, SHOP_NAME, CAFE_NAME, HOURS, PRICE, STAFF, LEVELS, STROKES, DISTS, LANES, BAND_NAME, SWIM, BOARDS, DIVES, SLIDES, RECORDS, GAP_NAME, MEET, NOVICES, CLUES, NAT_LOOKS, sessionsOn, sessionNow, meetAt, meet, racePos, fmtTime, lidoState, waveOn, inH } from '../data/natatorium.js';
import { POOL, STAND, LEIS, BOARD_AT, laneY } from '../art/showpiece/_nat_lib.js';
import '../art/showpiece/_nat_icons.js';
import { look, splash, cardSpr, ent } from '../scenes/rooms/natatorium_fx.js';
import { wader } from '../scenes/rooms/natatorium_pool.js';

export const order = 57.6;
Object.assign(LOOKS, NAT_LOOKS);
const DOOR = 'door:natatorium', DAY = 1440, O = 1, GOAL = 'nat_record', RINSE_MIN = 2, SHOWER_MIN = 8, SAUNA_MIN = 12, PLUNGE_MIN = 2, TUB_MIN = 20, WATCH_STAMP = 20;
CORE.natatorium = ['fitness', 'Swimming pool', 'bell', ['sights', 'outdoors', 'eat']];
CORE_BLURB.natatorium = 'The glass vault on Harbor Boulevard, beside Railyard station. An eight-lane competition pool with a diving well and a five-metre platform; a leisure pool with a lazy river, a wave machine on the hour and the half, two slides and a tipping bucket; a sauna and a cold plunge; chips and slushies at The Deep End; a lido in summer. Lessons with Coach Okafor, and the Marlins swim a meet every Saturday at two.';
for (const x of [
  { id: 'x:nat_visit', title: 'Through the Turnstiles', glyph: 'bell', blurb: 'Buy a swim at the Natatorium on Harbor Boulevard, change at a locker and rinse off.' },
  { id: 'x:nat_swim', title: 'A Hundred Metres on the Clock', glyph: 'bell', blurb: 'Swim a timed 100 m in the competition pool. Tap in time with the stroke; watch the pace clock.' },
  { id: 'x:nat_400', title: 'The Four Hundred', glyph: 'bell', blurb: 'Sixteen lengths without stopping. Pace it: easy, steady, and sprint the last two.' },
  { id: 'x:nat_badge', title: 'Earn a Swim Badge', glyph: 'stamp', blurb: 'Take a lesson with Coach Okafor on the pool deck. Each badge opens more of the building.' },
  { id: 'x:nat_dive', title: 'Off the Three-Metre Board', glyph: 'bell', blurb: 'Dive from the three-metre springboard at the Natatorium and see what the judges hold up.' },
  { id: 'x:nat_slides', title: 'The Twister and The Plunge', glyph: 'stamp', blurb: 'Climb the tower in the leisure pool and ride both slides. Lean into the bends.' },
  { id: 'x:nat_river', title: 'Once Round the River', glyph: 'tree', blurb: 'Take a ring and float one whole lap of the lazy river.' },
  { id: 'x:nat_waves', title: 'When the Siren Goes', glyph: 'stamp', blurb: 'Be in the wave pool when the machine starts: on the hour and the half hour.' },
  { id: 'x:nat_contrast', title: 'Hot, Then Cold', glyph: 'stamp', blurb: 'Ten minutes in the sauna, then straight into the cold-plunge barrel.' },
  { id: 'x:nat_meet', title: 'Saturday at the Meet', glyph: 'mask', blurb: 'Sit in the stand for the Marlins\' Saturday swim meet. Two o\'clock; free.' },
  { id: 'x:nat_race', title: 'Lane Four, Novice Fifty', glyph: 'bell', blurb: 'Reach club standard, enter the Novice 50 m at the Saturday meet and swim it.' },
  { id: 'x:nat_party', title: 'Friday Pool Party', glyph: 'mask', blurb: 'Dance on the deck at the Natatorium\'s Friday pool party night.' },
]) if (!EXPERIENCES.some(e => e.id === x.id)) EXPERIENCES.push(Object.assign({ group: 'Big days out', place: 'place:natatorium', need: 'natatorium' }, x));

let S = null, built = null, door = null, bannerOb = null; const cluePois = [];
const DEF = () => ({ visits: 0, lastDay: -1, ticketDay: -1, card: 0, memberUntil: -1, wellDay: -1, through: -1, swim: 0, suit: '', rinsed: -1, locker: 0, wet: 0, towelDay: -1, level: 1, lessons: 0, lessonDay: -1, metres: 0, lengths: 0, pb: {}, stroke: 'free',
  dives: 0, diveBest: {}, slides: { flume: 0, drop: 0, n: 0 }, river: 0, waves: 0, buckets: 0, tubs: 0, saunas: 0, plunges: 0, saunaT: -9999, contrast: 0, aqua: 0, parties: 0, infl: 0, watch: 0, watchKey: -1, entry: -1, race: {}, medals: [0, 0, 0], drills: 0, ow: 0, chain: { st: 0, clues: {} } });
const st = () => { S = G.state.natatorium || (G.state.natatorium = {}); const d = DEF(); for (const k in d) if (S[k] === undefined) S[k] = d[k]; if (!S.chain.clues) S.chain.clues = {}; if (!S.slides) S.slides = d.slides; return S; };
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
const safe = fn => { try { return fn(); } catch (e) { return undefined; } };
const stamp = id => safe(() => G.guide && G.guide.stamp && G.guide.stamp(id));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clock = h => String(Math.floor(h) % 24).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
const add = (k, v) => safe(() => G.needs.add(k, v)), xp = (k, v) => safe(() => G.skills.addXp(k, v)), fit = v => safe(() => G.needs.addFitness(v)), moodlet = (id, h) => safe(() => G.needs.addMoodlet(id, h));
const pay = (n, why) => !n || !G.money || G.money.pay(n, why, { category: 'fun', venue: NV.place });
const has = id => !!safe(() => G.inv.count(id) > 0), owns = id => !!safe(() => G.wardrobe.owns(id));
const playerName = () => (G.state.player && G.state.player.name) || 'Friend';
const inside = sc => !!((sc || G.scene) && (sc || G.scene).def && (sc || G.scene).def.showpiece === 'nat');
const scn = id => (G.scene && G.scene.roomId === id ? G.scene : null);
const isOpen = () => inH(G.now().hf, [HOURS.open, HOURS.close]);
const member = () => !!(G.state.flags && G.state.flags.nat_pass) || st().memberUntil > G.now().day;
const entryOk = () => member() || st().ticketDay === G.now().day || st().card > 0;
const wellOk = () => member() || st().wellDay === G.now().day;
const inStand = () => { const p = G.player; return !!scn(NR.pool) && p.y - O < STAND.rail && p.x - O < 27.5; };
const gear = () => (has('nat_goggles') ? SWIM.GOGGLES : 0) + (has('nat_cap') ? SWIM.CAP : 0) + (owns('outfit_nat_marlins') ? SWIM.SUIT : 0);
const AT = { hall: { x: O + 13, y: O + 11.4, dir: 3 }, hallStand: { x: O + 20.5, y: O + 2, dir: 1 }, hallChange: { x: O + 24.3, y: O + 2, dir: 1 }, stand: { x: O + 2.2, y: O + 2.7, dir: 1 }, change: { x: O + 18.2, y: O + 6, dir: 2 }, changeP: { x: O + 10.2, y: O + 9.5, dir: 3 }, changeL: { x: O + 3.2, y: O + 9.5, dir: 3 },
  pool: { x: O + 6, y: O + 20.3, dir: 3 }, poolL: { x: O + 20, y: O + 20.3, dir: 3 }, leisure: { x: O + 18, y: O + 24.3, dir: 3 }, leisureP: { x: O + 25, y: O + 24.3, dir: 3 }, leisureD: { x: O + 44.3, y: O + 14.4, dir: 2 }, lido: { x: O + 2, y: O + 5.9, dir: 0 } };

/* ---------- the little control panel for the rhythm / timing games ---------- */
let H = null, mini = null;
const css = (e, o) => { Object.assign(e.style, o); return e; };
function hud(title) {
  hudClose(); const d = css(el('div'), { position: 'fixed', left: '50%', bottom: '58px', transform: 'translateX(-50%)', zIndex: 40, width: 'min(94vw, 380px)', background: '#f4ead0', border: '2px solid #2a2733', boxShadow: '3px 3px 0 #0006', padding: '6px 8px', font: 'inherit', color: '#2a2733', pointerEvents: 'auto', boxSizing: 'border-box' }); d.id = 'nat-hud';
  const tt = css(el('div', { text: title }), { fontWeight: 'bold', fontSize: '14px' }), info = css(el('div'), { fontSize: '13px', minHeight: '17px', margin: '2px 0' });
  const zone = css(el('div'), { position: 'absolute', top: 0, bottom: 0, background: '#58c06a' }), mark = css(el('div'), { position: 'absolute', top: '-3px', bottom: '-3px', width: '6px', marginLeft: '-3px', background: '#d8402e', border: '1px solid #2a2733' });
  const track = css(el('div', null, zone, mark), { position: 'relative', height: '14px', background: '#cfe4e6', border: '2px solid #2a2733', margin: '4px 2px', display: 'none' });
  const fill = css(el('div'), { height: '100%', background: '#1fa3b8', width: '100%' }), bar = css(el('div', null, fill), { height: '6px', background: '#d8cfb8', border: '2px solid #2a2733', margin: '3px 2px', display: 'none' });
  const btns = css(el('div'), { display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }); d.append(tt, info, track, bar, btns); root().append(d);
  H = { el: d, tt, info, track, zone, mark, bar, fill, btns }; return H;
}
function hudClose() { if (H) { H.el.remove(); H = null; } }
const hudInfo = t => { if (H && H.info.textContent !== t) H.info.textContent = t; };
const hudMeter = (pos, z0, z1) => { if (!H) return; if (pos === null) { H.track.style.display = 'none'; return; } H.track.style.display = ''; H.mark.style.left = Math.round(Math.max(0, Math.min(1, pos)) * 100) + '%'; H.zone.style.left = Math.round(z0 * 100) + '%'; H.zone.style.width = Math.round((z1 - z0) * 100) + '%'; };
const hudBar = f => { if (!H) return; H.bar.style.display = f === null ? 'none' : ''; if (f !== null) { H.fill.style.width = Math.round(Math.max(0, Math.min(1, f)) * 100) + '%'; H.fill.style.background = f < .18 ? '#d8402e' : f < .4 ? '#f2c230' : '#1fa3b8'; } };
function hudBtns(list) { if (!H) return; H.btns.textContent = ''; for (const [label, fn, cls] of list) { const b = el('button', { text: label, onclick: e => { e.stopPropagation(); fn(b); } }); css(b, { font: 'inherit', fontSize: '14px', padding: '8px 11px', border: '2px solid #2a2733', background: cls === 'go' ? '#f2c230' : cls === 'red' ? '#d8402e' : '#fbf7ee', color: cls === 'red' ? '#fff' : '#2a2733', boxShadow: '2px 2px 0 #0006', cursor: 'pointer', touchAction: 'manipulation', flex: cls === 'go' ? '1 1 120px' : '0 0 auto' }); H.btns.append(b); } }
const camTo = e => { G.camTarget = e || null; };
/** wait real seconds while the game runs (not while a window is open) */
const waitS = s => new Promise(res => { let t = 0; const f = dt => { if (G.modal) return; t += dt; if (t >= s) { G.off('frame', f); res(); } }; G.on('frame', f); });

/* ---------- swimwear, lockers, showers ---------- */
function suitKey() { return owns('outfit_nat_marlins') ? 'outfit_nat_marlins' : owns('outfit_nat_retro') ? 'outfit_nat_retro' : 'swim'; }
function swimwear(on, quiet) { const S = st(); if (!!S.swim === !!on) return; S.swim = on ? 1 : 0; if (on) safe(() => G.wardrobe.wearTemp(suitKey())); else { safe(() => G.wardrobe.restore()); S.rinsed = -1; S.through = S.through; } G.emit('natatorium:swimwear', !!on); if (!quiet && on) toast('Swimwear on. Your clothes are in locker ' + (S.locker || 114) + '; the key goes round your wrist.', 'good', 3600); }
async function locker(fx) {
  const S = st(); if (G.busy) return;
  if (!S.swim) { S.locker = ((fx && fx.item && fx.item.no) || 114) + Math.floor(Math.random() * 12); swimwear(true); if (S.rinsed !== G.now().day) toast('Now a quick rinse: the showers are along the left wall.', 'info', 3600); return; }
  if (S.wet && !has('nat_towel') && S.towelDay !== G.now().day) {
    const v = await choose('Locker ' + (S.locker || 114), [{ label: `Hire a towel · ${fmt(PRICE.towelHire)}`, sub: 'The attendant has a cart of warm ones', value: 'h' }, { label: 'Drip-dry under the hairdryer', sub: 'Free. Takes a while. People will look.', value: 'd' }, { label: 'Get dressed damp', sub: 'Your collar will know all day', value: 'w' }, { label: 'Not yet', value: null }], { text: 'You open the locker. Clothes, shoes, phone... and no towel. You are standing in a puddle of your own making.' });
    if (!v) return; if (v === 'h') { if (!pay(PRICE.towelHire, 'Towel hire')) return; S.towelDay = G.now().day; toast('A warm towel off the cart. Civilisation.', 'good'); } else if (v === 'd') return dryer(true); else { moodlet('nat_damp'); toast('Socks on wet feet. A sensation you had forgotten on purpose.', 'info', 3600); }
  } else if (S.wet) toast('Towel, clothes, shoes. Your hair will do what it likes for the rest of the day.', 'good', 3400); else toast('Back into your clothes. Bone dry: did you even go in?', 'info', 3000);
  S.wet = 0; swimwear(false);
}
function dryer(dress) {
  if (G.busy) return false; const S = st(), sc = scn(NR.change);
  G.startActivity({ label: 'Under the hairdryer', anim: 'stand', minutes: dress ? 8 : 4, rate: 1.6, at: sc ? { x: O + 15.9, y: O + .9, dir: 3 } : undefined, tick: gm => add('hygiene', gm * .2), done: () => { safe(() => G.needs.removeMoodlet('nat_damp')); if (dress) { S.wet = 0; swimwear(false); toast('Eight minutes turning slowly under a wall hairdryer like a rotisserie chicken. Dry, though.', 'good', 4200); } else toast('Warm ears. Hair roughly where it started.', 'good', 3000); } }); return true;
}
function towel() { const S = st(); if (has('nat_towel') || S.towelDay === G.now().day) return toast('"You have one already. One towel per swimmer; I am not made of towels."', 'info', 3200); if (!pay(PRICE.towelHire, 'Towel hire')) return false; S.towelDay = G.now().day; toast('A warm white towel, folded in three. Hand it back on your way out.', 'good', 3200); return true; }
function shower(i) {
  if (G.busy) return false; const S = st(), sc = G.scene, out = i < 0, rinse = S.rinsed !== G.now().day || out; if (!S.swim) { toast('Not in your clothes. Lockers first.', 'info'); return false; }
  const j = !out && sc.nat && sc.nat.jets ? sc.nat.jets[i] : null, sp = j ? sc.nat.showerSpot(i) : null; if (j) { j.on = true; j.mine = true; }
  const end = () => { if (j) { j.on = false; j.mine = false; } };
  G.startActivity({ label: rinse ? 'A quick rinse' : 'Showering', anim: 'shower', minutes: rinse ? RINSE_MIN : SHOWER_MIN, rate: rinse ? 1 : 2.4, at: sp ? { x: sp.x, y: sp.y, dir: 0 } : undefined, tick: gm => add('hygiene', gm * (rinse ? 3 : has('nat_shampoo') ? 11 : 8.5)), cancel: end,
    done: () => { end(); if (rinse) { S.rinsed = G.now().day; toast(out ? 'Cold. Bracing. Character-building.' : 'Rinsed. The pool doors are across the footbath.', 'good', 3000); } else { moodlet('squeaky_clean'); toast(has('nat_shampoo') ? 'Apple shampoo. The chlorine gives up without a fight.' : 'Hot water, communal soap. You smell faintly of pool anyway.', 'good', 3600); } } });
  return true;
}
function cubicle() { toast(pick(['Occupied. A sock appears under the door, then retreats.', 'Someone inside is hopping on one leg. You know the dance.', 'The lockers have more elbow room.']), 'info', 2800); }

/* ---------- getting in and around ---------- */
function buy(kind) {
  const S = st(), n = G.now();
  if (kind === 'swim') { if (S.ticketDay === n.day) return false; const p = n.hf < 8 ? PRICE.early : PRICE.swim; if (!pay(p, 'Swim at the Natatorium')) return false; S.ticketDay = n.day; }
  else if (kind === 'card') { if (!pay(PRICE.card, 'Ten-swim card')) return false; S.card += 10; }
  else if (kind === 'member' || kind === 'active') { if (!pay(kind === 'active' ? PRICE.active : PRICE.member, kind === 'active' ? 'Active Maple Bay pass' : 'Natatorium membership')) return false; S.memberUntil = Math.max(S.memberUntil, n.day) + PRICE.memberDays; if (kind === 'active') safe(() => G.inv.grant('gym', PRICE.memberDays)); }
  else if (kind === 'wellness') { if (wellOk()) return false; if (!pay(PRICE.wellness, 'Wellness add-on')) return false; S.wellDay = n.day; }
  else return false;
  G.emit('natatorium:entry', kind); const sc = scn(NR.hall); if (sc && sc.nat) sc.nat.sync(); return true;
}
async function desk(c) {
  const S = st(), n = G.now(), early = n.hf < 8, w = STAFF.desk, mem = member(), lv = LEVELS[S.level - 1], sat = n.weekday === MEET.weekday, wk = Math.floor(n.day / 7);
  const v = await choose(NAME, [
    { label: S.ticketDay === n.day ? 'Swim (paid for today)' : `Swim · ${fmt(early ? PRICE.early : PRICE.swim)}`, sub: mem ? 'Members walk straight through' : early ? 'Early-bird price before eight' : 'All pools, all day. Slides included.', value: 'swim', disabled: mem || S.ticketDay === n.day },
    { label: `Ten-swim card · ${fmt(PRICE.card)}`, sub: S.card ? `${S.card} swims left on yours` : 'Two swims free. Never expires.', value: 'card' },
    { label: `Membership, ${PRICE.memberDays} days · ${fmt(PRICE.member)}`, sub: mem ? (G.state.flags.nat_pass ? 'Friend of the Marlins: free for life' : `Yours runs ${S.memberUntil - n.day} more days`) : 'Unlimited swims, sauna and steam included', value: 'member', disabled: !!G.state.flags.nat_pass },
    { label: `Active Maple Bay pass · ${fmt(PRICE.active)}`, sub: 'Natatorium membership plus the gym downtown, ' + PRICE.memberDays + ' days', value: 'active', disabled: !!G.state.flags.nat_pass && false },
    { label: wellOk() ? 'Wellness (you are all set)' : `Wellness add-on · ${fmt(PRICE.wellness)}`, sub: 'Sauna, steam room and the cold plunge, today', value: 'wellness', disabled: wellOk() },
    { label: 'Swim lessons', sub: `You are level ${S.level}: ${lv.name}. Coach Okafor teaches on the pool deck.`, value: 'les' },
    { label: 'Saturday meet: enter the Novice 50 m', sub: S.level < 4 ? 'For club-standard swimmers (level 4)' : S.entry === wk ? 'You are entered. Lane 4.' : `Entry ${fmt(PRICE.meetEntry)}. Race five, about three o'clock.`, value: 'race', disabled: S.level < 4 || S.entry === wk },
    { label: 'What is on today?', value: 'tt' }, { label: 'Nothing, thanks', value: null }], { text: `"Welcome to the Natatorium. Open ${clock(HOURS.open)} to ${clock(HOURS.close)}. Swimwear and a rinse before you go through, please."` });
  if (!v) return; if (v === 'tt') return timetable(); if (v === 'race') return enterRace();
  if (v === 'les') return say([{ who: w, text: `Lessons are ${fmt(PRICE.lesson)} each, paid to the coach. She is on the competition-pool deck ${HOURS.coach.map(q => clock(q[0]) + ' to ' + clock(q[1])).join(' and ')}, and at squad training.` }, { who: w, text: `Each level opens more: next for you is ${S.level < 5 ? LEVELS[S.level].name + ' (' + LEVELS[S.level].unlock + ')' : 'nothing. You have every badge we give out'}.` }]);
  if (buy(v)) toast(v === 'swim' ? '"One swim. The turnstiles are on your right; they will go green for you."' : v === 'card' ? '"Ten swims. Just walk up to the turnstile; it takes one off."' : v === 'wellness' ? '"Sauna is at the back of the leisure pool. Cold plunge next to it. In that order."' : '"Welcome to the club. The turnstiles know you now."', 'good', 4200);
}
function turnstile() { if (entryOk()) toast('Green light. Walk straight through.', 'good', 2400); else { toast('Red light. You need a swim from the front desk first.', 'info', 3200); } }
function enter() { if (!isOpen()) { toast(`${NAME}: closed. Open daily ${clock(HOURS.open)} to ${clock(HOURS.close)}.`, 'info', 3800); return false; } enterRoom(NR.hall, DOOR); return true; }
function leave() { if (G.busy) return; swimwear(false, true); return exitRoom({ poi: DOOR }); }
function go(dest, from) {
  const S = st(), n = G.now(), day = n.day; if (G.busy) return false;
  const need = () => { if (!S.swim) { toast('"Swimwear only beyond this point." The lockers are behind you.', 'info', 3400); return false; } if (S.rinsed !== day) { toast('"Shower first, please!" The rinse showers are along the left wall of the changing village.', 'info', 3800); return false; } return true; };
  if (dest === 'stand') return G.go('int:' + NR.pool, AT.stand);
  if (dest === 'hall') { if (from === 'stand') return G.go('int:' + NR.hall, AT.hallStand); if (S.swim) { toast('You are still in your swimwear. Your clothes are in locker ' + (S.locker || 114) + '.', 'info', 3400); return false; } return G.go('int:' + NR.hall, AT.hallChange); }
  if (dest === 'change') return G.go('int:' + NR.change, from === 'pool' ? AT.changeP : from === 'leisure' ? AT.changeL : AT.change);
  if (dest === 'pool') { if (from !== 'leisure' && !need()) return false; return G.go('int:' + NR.pool, from === 'leisure' ? AT.poolL : AT.pool); }
  if (dest === 'leisure') { if (!from && !need()) return false; const hrs = n.weekday === 4 ? HOURS.leisureFri : HOURS.leisure; if (from !== 'lido' && !inH(n.hf, hrs)) { toast(`The leisure pool opens ${clock(hrs[0])} to ${clock(hrs[1])}. The competition pool is open now.`, 'info', 3800); return false; } return G.go('int:' + NR.leisure, from === 'pool' ? AT.leisureP : from === 'lido' ? AT.leisureD : AT.leisure); }
  if (dest === 'lido') { const s = lidoState(n); if (s === 'winter') toast('The lido is closed for the winter. You step out for a look anyway, in a swimsuit, like a hero.', 'info', 4200); else if (!inH(n.hf, HOURS.lido)) { toast(`The lido is open ${clock(HOURS.lido[0])} to ${clock(HOURS.lido[1])}.`, 'info', 3200); return false; } return G.go('int:' + NR.lido, AT.lido); }
  return false;
}
function arrived(key, sc, pv) {
  const S = st(), n = G.now();
  if ((key === 'leisure' || key === 'lido' || (key === 'pool' && !inStand())) && !S.swim) { swimwear(true, true); S.rinsed = n.day; }
  if (key === 'change' && S.through !== n.day) passGate(true);
  if (inside(pv)) return; const first = !S.visits; if (S.lastDay !== n.day || first) { S.visits++; S.lastDay = n.day; } safe(() => G.places.discover('natatorium', true)); G.emit('natatorium:visit', first);
  if (key !== 'hall') return; const ses = sessionNow(n), m = meetAt(G.state.t);
  if (first) toast('Chlorine, warm air and the echo of a whistle. Through the big window, somebody is doing a very determined breaststroke.', 'good', 5200);
  else if (m) toast(m.ph === 'warm' ? `Meet day: the Marlins swim ${m.M.opp.name} at ${MEET.T0}:00. The stand is free: the blue door.` : `The meet is on: Marlins against ${m.M.opp.name}. The stand is through the blue door.`, 'info', 4800);
  else if (ses) toast(`On now: ${ses.name}.`, 'info', 3600);
}
function left() { stopAll(); }
function passGate(quiet) { const S = st(), day = G.now().day; if (S.through === day) return; S.through = day; if (!member() && S.ticketDay !== day && S.card > 0) { S.card--; S.ticketDay = day; if (!quiet) toast(`Beep. One swim off your card: ${S.card} left.`, 'info', 2800); } else if (!quiet) toast(member() ? 'Beep. "Morning, member."' : 'Beep. Green light.', 'info', 2000); stamp('x:nat_visit'); }

/* ---------- windows: records, timetable, shops ---------- */
const shop = () => safe(() => G.shop.open(NV.shop)), vending = () => safe(() => G.shop.open(NV.vend));
const cafe = () => { if (!inH(G.now().hf, HOURS.cafe)) return toast(`${CAFE_NAME} serves ${clock(HOURS.cafe[0])} to ${clock(HOURS.cafe[1])}.`, 'info'); return safe(() => G.shop.open(NV.cafe)); };
const kiosk = () => { const sc = scn(NR.lido); if (sc && sc.nat.state !== 'summer') return toast('The shutter is down. A sign: "ICES: SEE YOU IN SUMMER".', 'info'); return safe(() => G.shop.open(NV.cafe)); };
const row = (a, b, c, hi) => css(el('div', null, css(el('span', { text: a }), { flex: '0 0 96px', fontWeight: 'bold' }), css(el('span', { text: b }), { flex: '0 0 58px' }), css(el('span', { text: c }), { flex: '1 1 auto', opacity: .85 })), { display: 'flex', gap: '6px', fontSize: '13px', padding: '2px 4px', background: hi ? '#f6e3a0' : 'transparent' });
function records() {
  const S = st(), m = modal({ title: 'Club Records · Maple Bay Marlins' }), done = S.chain.st >= 5;
  for (const r of RECORDS) m.body.append(row(r.ev, r.time, r.gap ? (done ? GAP_NAME + ', 1974' : '________  1974  (name plate missing)') : r.name + ', ' + r.year, r.gap));
  m.body.append(css(el('p', { text: done ? 'The 1974 plate is back: Rosa Castellanos, aged sixteen. Still the record.' : 'One brass plate has been missing for as long as anyone remembers: the women\'s 100 m backstroke, 1974. The time has never been beaten.' }), { fontSize: '13px', margin: '8px 4px 4px' }));
  m.body.append(css(el('b', { text: 'Your personal bests' }), { display: 'block', margin: '6px 4px 2px' })); for (const d of DISTS) m.body.append(row(d + ' m', S.pb[d] ? fmtTime(S.pb[d]) : '-', S.pb[d] ? '' : 'not swum yet'));
  m.body.append(row('Swim level', String(S.level), LEVELS[S.level - 1].name + ' · ' + S.metres + ' m swum here'));
}
function timetable() {
  const n = G.now(), m = modal({ title: 'Timetable · ' + n.weekdayName }), f = h => clock(h), w = waveOn(G.state.t);
  for (const s of sessionsOn(n)) { m.body.append(row(f(s.from) + '-' + f(s.to), s.where === 'leisure' ? 'Leisure' : s.where === 'dive' ? 'Diving' : 'Pool', s.name, n.hf >= s.from && n.hf < s.to)); m.body.append(css(el('div', { text: s.blurb }), { fontSize: '12px', opacity: .8, margin: '0 4px 5px 102px' })); }
  m.body.append(row('All day', 'Pool', 'Public lane swimming in every lane not listed above: 1-2 slow, 3-5 medium, 6-8 fast')); m.body.append(row(f(HOURS.leisure[0]) + '-' + f(n.weekday === 4 ? 22 : HOURS.leisure[1]), 'Leisure', 'Lazy river, slides, toddler zone. Waves on the hour and the half hour' + (w.on ? ' (running now)' : ` (next in ${Math.ceil(w.next)} min)`)));
  const ls = lidoState(n); m.body.append(row(ls === 'winter' ? 'Closed' : f(HOURS.lido[0]) + '-' + f(HOURS.lido[1]), 'Lido', ls === 'winter' ? 'Under its cover for the cold months. Opens from mid-spring.' : ls === 'summer' ? 'Loungers out, kiosk open' : 'Open on dry days'));
  const tm = sessionsOn({ weekday: (n.weekday + 1) % 7, dayOfMonth: n.dayOfMonth % 14 + 1, season: n.season }).filter(s => s.id !== 'early'); if (tm.length) m.body.append(css(el('p', { text: 'Tomorrow: ' + tm.map(s => s.name + ' ' + f(s.from)).join(' · ') }), { fontSize: '12px', margin: '8px 4px 2px' }));
}
function honours() { const S = st(); if (S.chain.st >= 5) return toast(`FRIENDS OF THE MARLINS. The newest brass line reads "${playerName()}". Walt polished it himself.`, 'good', 4600); toast('FRIENDS OF THE MARLINS: forty years of names in gold paint. Timekeepers, tea-urn fillers, a man who mended the pace clock in 1988.', 'info', 4600); }
function lookMural() { const S = st(); toast(S.chain.st >= 5 ? '"The Dawn Swimmer": a girl on her back in pink water, one arm up, the sun coming through the roof. Painted by the Saturday Starfish class. Rosa pretends not to look at it.' : 'A blank white panel: "COMMUNITY WALL: your art here." Five dots of paint where somebody tested colours and lost heart.', S.chain.st >= 5 ? 'good' : 'info', 5200); }
function lookWindow() { const n = G.now(), s = sessionNow(n, 'pool'); add('fun', 1); toast(s ? `Through the glass: ${s.name.toLowerCase()}. ${s.id === 'school' ? 'A line of armbands along the wall, a teacher counting heads.' : s.id === 'meet' ? 'The stand is full and somebody has just touched the wall.' : s.id === 'aqua' ? 'Twelve people jogging on the spot, chest deep, to disco you can feel in the glass.' : 'Arms going over like paddle wheels.'}` : 'Through the glass: eight lanes, red and blue ropes, the slow lane very slow and the fast lane very cross about it.', 'info', 4600); }
function lookBoard() { const m = meetAt(G.state.t); if (m && m.ev) return toast(`Race ${m.i + 1} of 10: ${m.ev.name}. ${m.ph === 'marshal' ? 'Swimmers to the blocks.' : m.ph === 'race' ? 'In the water now.' : 'Result: ' + m.ev.res.slice(0, 3).map((r, i) => (i + 1) + '. ' + r.name).join('  ')}`, 'info', 5200); const S = st(); toast(`The big board. Your bests: ${DISTS.map(d => d + ' m ' + (S.pb[d] ? fmtTime(S.pb[d]) : '-')).join(' · ')}.`, 'info', 4600); }
function lookSlideBoard() { const S = st(); toast(`SPLASHDOWN. The Twister: pool best ${SLIDES.flume.best.toFixed(1)} s, yours ${S.slides.flume ? S.slides.flume.toFixed(1) : '-'}. The Plunge: pool best ${SLIDES.drop.best.toFixed(1)} s, yours ${S.slides.drop ? S.slides.drop.toFixed(1) : '-'}.`, 'info', 4600); }
function lookCover() { toast('The winter cover: blue tarpaulin strapped down over eighteen thousand gallons, a drift of snow in each fold. Somebody has written BACK IN SPRING in the frost.', 'info', 4800); }
function whiteboard() { toast('Coach\'s whiteboard: "WARM UP 400 EASY · 8 x 50 ON 1:10 · KICK 200 · NO TALKING ON THE WALL (THEO)". Underneath, smaller: "novice 50 Saturday: who\'s brave?"', 'info', 5200); }

/* ---------- lane swimming: your own swimmer, the rhythm, the stamina ---------- */
let W = null, tapQ = 0;
const swimSay = { stuck: ['Stuck behind a slower swimmer. A faster lane would fix that.', 'Feet. All you can see is feet.'], tired: ['Arms like wet rope. Ease off or you will be walking the last length.'] };
function laneCheck(n, sc) {
  const S = st(), N = sc.nat, use = N.use[n - 1], m = N.meet;
  if (N.open === false) { toast('The pool is closed.', 'info'); return null; }
  if (sc.roomId === NR.lido) { if (N.state === 'winter') { toast('Under the cover. Come back in spring.', 'info'); return null; } return 'lido'; }
  if (m && m.ph !== 'after' && m.ph !== 'warm') { if (m.ev && m.ev.open && n === 4) return 'race'; toast(m.ph === 'race' ? 'There is a race in that lane. The marshal gives you a look.' : 'Meet in progress: the pool is closed to the public until five. The leisure pool is open.', 'info', 3800); return null; }
  if (m && m.ph === 'warm') { toast('The teams are warming up. The pool reopens to the public at 17:00.', 'info', 3400); return null; }
  if (use !== 'slow' && use !== 'med' && use !== 'fast') { toast(`Lane ${n} is taken: ${BAND_NAME[use] || use}. ${use === 'aqua' ? 'Ask Dolores if you want to join in.' : use === 'fun' ? 'The inflatable starts at the far end.' : 'Pick a public lane.'}`, 'info', 3800); return null; }
  if (use === 'med' && S.level < 2) { toast('"Medium lanes are deep water. Get your Seahorse badge first." Lanes 1 and 2 are yours.', 'info', 4200); return null; }
  if (use === 'fast' && S.level < 4) { toast('"Fast lanes are for club-standard swimmers." You get a kind smile and a firm point towards lane ' + (S.level < 2 ? 2 : 5) + '.', 'info', 4200); return null; }
  return use;
}
async function lane(n) {
  const sc = G.scene, S = st(); if (G.busy || !sc || !sc.nat || !sc.nat.me) return; const k = laneCheck(n, sc); if (!k) return; if (k === 'race') return race();
  for (; ;) {
    const opts = [{ label: 'Just swim', sub: 'No clock. Climb out when you like.', value: 0 }]; if (k !== 'lido') for (const d of DISTS) opts.push({ label: d + ' m against the clock', sub: (d / 25) + (d === 25 ? ' length' : ' lengths') + ' · your best: ' + (S.pb[d] ? fmtTime(S.pb[d]) : 'none yet'), value: d });
    opts.push({ label: 'Stroke: ' + STROKES[S.stroke].name, sub: 'Tap to change', value: 's' }, { label: 'Not now', value: null });
    const v = await choose(k === 'lido' ? 'Outdoor lane ' + n : `Lane ${n} · ${BAND_NAME[k]}`, opts, { text: 'Tap "Stroke" (or Space, or the pool) in time with the marker. Good rhythm is speed; pace is stamina.' });
    if (v === null) return; if (v === 's') { const ks = Object.keys(STROKES); S.stroke = ks[(ks.indexOf(S.stroke) + 1) % ks.length]; continue; } return swim({ lane: n, dist: v });
  }
}
function swim(o) {
  const sc = G.scene, S = st(); if (G.busy || !sc || !sc.nat || !sc.nat.me) return false; const N = sc.nat, me = N.me, stroke = o.stroke || S.stroke, L = look(G.state.player.spec), p = G.player;
  if (!S.swim) swimwear(true, true);
  me.L = L; me.cap = has('nat_cap') ? '#1f6fb8' : null; me.gog = has('nat_goggles'); me.stroke = stroke; me.lane = o.lane; me.dir = -1; me.x = N.X1; me.y = N.laneY(o.lane, -1); me.hidden = false; me.v = 0; me.moving = true;
  W = { sc, N, me, lane: o.lane, dist: o.dist ? Math.round(o.dist / 25) : 0, stroke, len: 0, clock: 0, rhythm: .5, stam: 100, pace: 'steady', ph: 0, beat: 0, auto: !!o.auto, boost: 0, stuck: 0, said: {}, lesson: o.lesson || null, race: o.race || null, rsum: 0, rn: 0, t: 0, startT: G.state.t, ended: false, go: o.race ? -2.2 : 0 };
  splash(sc, me.x - .4, me.y, 1); S.wet = 1;
  const act = G.startActivity({ label: o.race ? 'Racing: Novice 50 m' : o.lesson ? 'Swimming lesson' : 'Swimming', anim: 'stand', hide: true, minutes: 120, rate: o.race ? .12 : SWIM.RATE, cancel: () => endSwim(false, true), done: () => endSwim(true, true) }); act._nat = true; W.act = act; camTo(me);
  hud(o.race ? 'Novice 50 m Freestyle · lane 4' : o.lesson ? 'Lesson: ' + o.lesson.name : (W.dist ? W.dist * 25 + ' m ' : 'Lane ' + o.lane + ' · ') + STROKES[stroke].name);
  const paceBtn = b => { const ks = ['easy', 'steady', 'sprint']; W.pace = ks[(ks.indexOf(W.pace) + 1) % 3]; b.textContent = 'Pace: ' + W.pace; };
  hudBtns([['Stroke!', () => swimTap(), 'go'], ['Pace: steady', paceBtn], [W.auto ? 'Auto: on' : 'Auto: off', b => { W.auto = !W.auto; b.textContent = W.auto ? 'Auto: on' : 'Auto: off'; }], ['Climb out', () => { if (W) G.endActivity(false); }, 'red']]);
  mini = { kind: 'swim', tap: swimTap, pace: id => { if (W && SWIM.PACE[id]) W.pace = id; }, auto: on => { if (W) W.auto = on !== false; }, state: () => (W ? { kind: 'swim', lane: W.lane, len: W.len, of: W.dist, clock: W.clock, rhythm: W.rhythm, stam: W.stam, pace: W.pace, v: W.me.v, x: W.me.x, auto: W.auto } : null) };
  return true;
}
function swimTap() { if (!W || W.go < 0) return; const T = STROKES[W.stroke].beat * SWIM.PACE[W.pace][0], f = W.ph - Math.round(W.ph), e = Math.abs(f), q = Math.max(0, 1 - e / .24), b = Math.round(W.ph); if (b <= W.beat && q > 0) { W.stam -= .6; return; } W.beat = Math.max(W.beat, b); W.rhythm = W.rhythm * .55 + q * .45; W.stam -= SWIM.STAM_TAP * STROKES[W.stroke].cost * SWIM.PACE[W.pace][1] * (q < .3 ? 1.4 : 1); tapQ = q; W.rsum += q; W.rn++; }
function swimFrame(dt) {
  if (!W || W.ended || G.modal) return; const S = st(), N = W.N, me = W.me, T = STROKES[W.stroke].beat * SWIM.PACE[W.pace][0], PC = SWIM.PACE[W.pace];
  if (W.go < 0) { W.go += dt; hudInfo(W.go < -1.2 ? 'Take your marks...' : W.go < -.2 ? 'Set...' : 'GO!'); hudMeter(null); if (W.go >= 0) { splash(W.sc, me.x - .5, me.y, 1); N.cheer && N.cheer(20); } else { me.moving = false; raceGhosts(0); return; } }
  W.t += dt; W.ph += dt / T; W.clock += dt * SWIM.CLOCK;
  if (W.auto) { if (W.ph - W.beat >= 1) { W.beat = Math.round(W.ph); W.rhythm = W.rhythm * .55 + SWIM.AUTO * .45; W.stam -= SWIM.STAM_TAP * STROKES[W.stroke].cost * PC[1]; W.rsum += SWIM.AUTO; W.rn++; if (W.stam < 30 && W.pace !== 'easy') W.pace = 'easy'; else if (W.stam > 85 && W.pace === 'easy') W.pace = 'steady'; } }
  else if (W.ph - W.beat > 1.5) { W.beat++; W.rhythm = Math.max(0, W.rhythm - .22); }
  W.stam = Math.max(0, Math.min(100, W.stam + SWIM.STAM_REGEN * dt * (W.pace === 'easy' ? 1.5 : 1) * (has('nat_kickboard') ? 1.2 : 1)));
  let v = SWIM.V[S.level] * STROKES[W.stroke].v * PC[2] * (1 + gear()) * (SWIM.FLOOR + SWIM.GAIN * W.rhythm) * (W.lesson ? .9 : 1); if (W.stam < SWIM.STAM_LOW) { v *= SWIM.LOW_CAP; if (!W.said.tired) { W.said.tired = 1; toast(pick(swimSay.tired), 'info', 3200); } }
  if (W.boost > 0) { W.boost -= dt; v *= 1 + SWIM.TURN_BONUS; }
  const a = N.ahead ? N.ahead(me) : null; if (a && a.d < 1.15 && !W.race) { const av = a.s.base || a.s.v || 1; if (av < v) { v = av; W.stuck += dt; if (W.stuck > 2.5 && !W.said.stuck) { W.said.stuck = 1; toast(pick(swimSay.stuck), 'info', 3400); } } }
  me.v = v; me.rate = 3 + v * 1.6; me.moving = true; me.x += me.dir * v * dt;
  const wall = me.dir < 0 ? me.x <= N.X0 : me.x >= N.X1; if (wall) { me.x = me.dir < 0 ? N.X0 : N.X1; me.dir = -me.dir; me.y = N.laneY(W.lane, me.dir); W.len++; onLength(); if (W && S.level >= 3 && !(W.dist && W.len >= W.dist)) W.boost = .7; }
  if (!W || W.ended) return;
  if (W.race) raceGhosts(W.clock);
  const pb = W.dist ? S.pb[W.dist * 25] : 0; hudInfo((W.dist ? `Length ${Math.min(W.len + 1, W.dist)} of ${W.dist}` : `Length ${W.len + 1}`) + ' · ' + fmtTime(W.clock) + (pb ? ' (best ' + fmtTime(pb) + ')' : '') + (W.rhythm > .75 ? ' · smooth' : W.rhythm < .3 ? ' · ragged' : ''));
  hudMeter((W.ph + .5) % 1, .5 - .12, .5 + .12); hudBar(W.stam / 100);
  N.myBoard = W.race ? null : { lines: ['LANE ' + W.lane + '  ' + playerName().toUpperCase().slice(0, 10), W.dist ? W.dist * 25 + ' M ' + STROKES[W.stroke].name.toUpperCase() : 'FREE SWIM ' + STROKES[W.stroke].name.toUpperCase(), fmtTime(W.clock), 'LENGTH ' + (W.len + (W.dist && W.len >= W.dist ? 0 : 1)) + (W.dist ? ' OF ' + W.dist : ''), pb ? 'BEST ' + fmtTime(pb) : ''] };
}
function onLength() {
  const S = st(); S.lengths++; S.metres += 25; add('energy', -SWIM.ENERGY_PER_25 * STROKES[W.stroke].cost * (W.pace === 'sprint' ? 1.3 : 1)); add('hygiene', .5); add('fun', .6); fit(SWIM.FIT_PER_100 / 4); xp('fitness', SWIM.XP_PER_25); G.emit('natatorium:length', W.len, W.lane);
  if (W.dist && W.len >= W.dist) finishSwim();
}
function finishSwim() {
  const S = st(), w = W, d = w.dist * 25, time = Math.round(w.clock * 10) / 10, old = S.pb[d], avg = w.rn ? w.rsum / w.rn : 0; w.finished = true; w.time = time; w.avg = avg;
  if (w.race) return endRace(time);
  if (w.lesson) { endSwim(true); return lessonDone(avg, time); }
  const isPb = !old || time < old; if (isPb) S.pb[d] = time; G.emit('natatorium:swim', { dist: d, time, pb: isPb, stroke: w.stroke });
  if (d >= 100) { stamp('x:nat_swim'); moodlet('nat_swim'); } if (d >= 400) { stamp('x:nat_400'); moodlet('pumped'); } if (isPb && old) moodlet('nat_pb');
  if (S.chain.st === 3 && d >= 100 && w.stroke === 'back') { S.chain.st = 4; setGoal(); G.emit('natatorium:chain', 4); setTimeout(() => toast('A hundred metres on your back, counting the roof beams the way she must have. Rosa is at the wall when you touch. "Not bad. Go and tell Walt."', 'good', 6400), 900); }
  const sc = w.sc; endSwim(true); sc.nat.myBoard = { lines: ['LANE ' + w.lane + '  ' + playerName().toUpperCase().slice(0, 10), d + ' M ' + STROKES[w.stroke].name.toUpperCase(), fmtTime(time), isPb ? (old ? 'NEW PERSONAL BEST' : 'FIRST TIME ON THE BOARD') : 'BEST ' + fmtTime(old), ''] }; setTimeout(() => { if (sc.nat.myBoard && !W) sc.nat.myBoard = null; }, 9000);
  toast(`${d} m ${STROKES[w.stroke].name.toLowerCase()}: ${fmtTime(time)}. ${isPb ? (old ? `A personal best, by ${(old - time).toFixed(1)} s!` : 'Your first time on the board.') : `Your best is ${fmtTime(old)}.`} ${avg > .75 ? 'Smooth all the way.' : avg < .35 ? 'Ragged. Find the beat.' : ''}`, isPb ? 'good' : 'info', 5200);
}
function endSwim(completed, fromAct) {
  const w = W; if (!w || w.ended) return; w.ended = true; W = null; mini = null; hudClose(); camTo(null); w.me.hidden = true; if (!w.finished) { w.N.myBoard = null; const n = w.len; if (n >= 4 && !w.lesson && !w.race) moodlet('nat_swim'); if (!w.lesson && !w.race) toast(n ? `${n} length${n > 1 ? 's' : ''}: ${n * 25} m. You hang on the rail for a second, then haul out.` : 'You climb straight back out. The water was wet.', 'info', 3600); if (w.lesson) toast('"We will pick it up next time." No charge for half a lesson.', 'info', 3200); }
  if (w.race) { raceEndGhosts(w); }
  if (!fromAct && G.busy === w.act) G.endActivity(!!completed);
}
function stopAll() { if (W) { const w = W; endSwim(false); if (G.busy === w.act) G.endActivity(false); } if (mini && mini.stop) mini.stop(); hudClose(); camTo(null); if (G.cutscene && G.cutscene._nat) { G.cutscene = null; G.player.hidden = false; G.player.zoff = 0; G.player.pose = null; } }

/* ---------- lessons ---------- */
const LESSON = [null, { name: 'Float and kick', stroke: 'free', pass: .34 }, { name: 'Backstroke', stroke: 'back', pass: .4 }, { name: 'Breaststroke timing', stroke: 'breast', pass: .46 }, { name: 'Racing pace', stroke: 'free', pass: .52 }];
async function lesson(auto) {
  const S = st(), sc = scn(NR.pool), n = G.now(), w = STAFF.coach; if (!sc || G.busy) return false;
  if (S.level >= 5) { await say([{ who: w, text: 'You have every badge I can give you. Now it is just lengths. It is always just lengths.' }]); return false; }
  const nx = LEVELS[S.level], L = LESSON[S.level];
  if (S.metres < nx.need) { await say([{ who: w, text: `${nx.name} needs ${nx.need} metres in the bank before I teach it, and you have ${S.metres}. Swim some lengths in the public lanes and come back.` }]); return false; }
  if (sc.nat.meet) { await say([{ who: w, text: 'Not on a meet day. Ask me on Monday.' }]); return false; }
  if (S.lessonDay === n.day) { await say([{ who: w, text: 'One lesson a day. It has to sink in. So to speak.' }]); return false; }
  if (!auto) { const v = await choose(w, [{ label: `Take the lesson · ${fmt(PRICE.lesson)}`, sub: `${L.name}: two lengths in lane 1 with me on the deck`, value: 1 }, { label: 'Another day', value: 0 }], { text: `"Level ${nx.n}, ${nx.name}: the ${nx.badge} badge. It opens ${nx.unlock}. Keep the rhythm and I will pass you."` }); if (!v) return false; }
  if (!pay(PRICE.lesson, 'Swimming lesson')) return false; S.lessonDay = n.day;
  bubble(sc.nat.coach, pick(['Long arms. Loooong arms.', 'In time with me. And... pull.', 'Chin down, hips up.']), 3200);
  return swim({ lane: sc.nat.use[0] === 'slow' ? 1 : 2, dist: 50, stroke: L.stroke, lesson: L, auto });
}
function lessonDone(avg, time) {
  const S = st(), L = LESSON[S.level], sc = scn(NR.pool), ok = avg + (has('nat_kickboard') ? .05 : 0) >= L.pass, c = sc && sc.nat.coach;
  if (!ok) { S.lessons++; if (c) bubble(c, 'Nearly. The rhythm came and went. Again tomorrow.', 4000); toast(`${STAFF.coach}: "Not quite a pass. Tap with the marker, not after it. Come back tomorrow: second go is on the house."`, 'info', 5600); safe(() => G.money.add(PRICE.lesson, 'Lesson credit')); return false; }
  S.level++; S.lessons++; const nx = LEVELS[S.level - 1]; safe(() => G.inv.add('nat_badge', 1, { silent: true })); stamp('x:nat_badge'); moodlet('pumped'); G.emit('natatorium:level', S.level);
  if (c) bubble(c, 'That is a pass. Badge!', 3600); toast(`Level ${nx.n}: ${nx.name}. Coach Okafor presses the ${nx.badge} badge into your wet hand. Now open to you: ${nx.unlock}.`, 'good', 7000); return true;
}
async function talkCoach(c) {
  const S = st(), w = STAFF.coach, n = G.now(), wk = Math.floor(n.day / 7), m = meetAt(G.state.t);
  if (inStand()) return bubble(c, 'Shout louder! They can hear you underwater. Probably.', 3000);
  if (m && m.ph !== 'after') return bubble(c, pick(['Not now. Race.', 'Streamline off the wall! STREAMLINE!', m.M.opp.name + '. They always bring a good breaststroker.']), 3000);
  const v = await choose(w, [{ label: S.level >= 5 ? 'Swim lessons (you have every badge)' : `Swim lesson: ${LEVELS[S.level].name}`, sub: S.level >= 5 ? '' : `${fmt(PRICE.lesson)} · needs ${LEVELS[S.level].need} m swum (you: ${S.metres} m)`, value: 'l', disabled: S.level >= 5 }, { label: 'The Novice 50 m on Saturday', sub: S.level < 4 ? 'Club standard (level 4) to enter' : S.entry === wk ? 'You are down for lane 4' : `Enter · ${fmt(PRICE.meetEntry)}`, value: 'r', disabled: S.level < 4 || S.entry === wk }, { label: 'Any tips?', value: 't' }, { label: 'Just watching', value: null }], { text: `"You are level ${S.level}, ${LEVELS[S.level - 1].name}. ${S.metres} metres in my pool so far."` });
  if (v === 'l') return lesson(); if (v === 'r') return enterRace();
  if (v === 't') return say([{ who: w, text: pick(['Rhythm before effort. A ragged sprint is slower than a smooth cruise. Tap on the marker, every stroke.', 'Four hundred metres is three hundred of patience and a hundred of nerve. Easy pace out, sprint home.', 'Pick the lane that matches your speed. Stuck behind a breaststroker is nobody\'s personal best.', 'Goggles are four per cent. A cap is two. The suit is three. The rest is you.']) }]);
}
function enterRace() { const S = st(), n = G.now(), wk = Math.floor(n.day / 7); if (S.level < 4) { toast('"Novice means new to racing, not new to swimming. Club standard first: level 4."', 'info', 4200); return false; } if (S.entry === wk) return false; if (!pay(PRICE.meetEntry, 'Novice 50 m entry')) return false; S.entry = wk;
  const d = n.day + ((MEET.weekday - n.weekday + 7) % 7); safe(() => G.planner.add({ title: 'Novice 50 m at the Saturday Swim Meet', placeId: 'natatorium', t: d * DAY + MEET.T0 * 60 + 4 * MEET.SLOT, dur: MEET.SLOT, kind: 'personal', data: { nat: 'race' } }));
  toast('You are entered: Novice 50 m Freestyle, race five, lane 4, this Saturday about three o\'clock. Be on the deck in your swimwear when they call it.', 'good', 6200); return true; }

/* ---------- the Novice race ---------- */
const myRace = m => { const S = st(); if (!m) return null; const r = S.race[m.week]; return r ? { name: playerName().toUpperCase().slice(0, 11), time: r.time, place: r.place } : S.entry === m.week ? { name: playerName().toUpperCase().slice(0, 11) } : null; };
function race(auto) {
  const sc = scn(NR.pool), S = st(), m = sc && sc.nat.meet; if (!sc || G.busy) return false;
  if (!m || !m.ev || !m.ev.open || m.ph === 'podium') { toast('The Novice 50 m is race five on Saturday. Listen for the call.', 'info'); return false; }
  if (S.entry !== m.week) { toast('"Name? ... Not on my sheet." Entries are at the front desk or with Coach Okafor before the race.', 'info', 4200); return false; } if (S.race[m.week]) { toast('You have swum your race. Enjoy the rest of the meet.', 'info'); return false; }
  sc.nat.raceHold = true; for (const q of sc.nat.racers) { if (!q.ln) continue; q.ch.hidden = true; q.wd.hidden = true; q.sw.hidden = false; q.sw.x = sc.nat.X1; q.sw.dir = -1; q.sw.y = O + laneY(q.ln.lane); q.sw.moving = false; }
  toast('Lane 4. The block is higher than it looks. Seven strangers shake their arms out on either side of you.', 'info', 3600);
  return swim({ lane: 4, dist: 50, stroke: 'free', race: { m, ev: m.ev }, auto });
}
const out = {};
function raceGhosts(tau) { const sc = W.sc; for (const q of sc.nat.racers) { if (!q.ln) continue; const p = racePos(q.ln, tau, out); q.sw.hidden = false; q.sw.x = sc.nat.X0 + p * (sc.nat.X1 - sc.nat.X0); q.sw.dir = out.dir; q.sw.moving = tau > 0 && !out.done; } W.me.y = O + laneY(4); if (Math.random() < .1) sc.nat.cheer(3); }
function raceEndGhosts(w) { w.sc.nat.raceHold = false; }
function endRace(time) {
  const w = W, S = st(), ev = w.race.ev, place = 1 + ev.lanes.filter(l => l.time < time).length, sc = w.sc; S.race[w.race.m.week] = { time, place }; if (!S.pb[50] || time < S.pb[50]) S.pb[50] = time; G.emit('natatorium:race', { time, place }); stamp('x:nat_race');
  endSwim(true); sc.nat.cheer(40);
  const med = place <= 3 ? ['nat_medal_gold', 'nat_medal_silver', 'nat_medal_bronze'][place - 1] : null; if (med) { S.medals[place - 1]++; safe(() => G.inv.add(med, 1, { silent: true })); moodlet('nat_medal'); } else moodlet('nat_swim');
  toast(`Novice 50 m: ${fmtTime(time)}, ${['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'][place - 1]} of eight. ${place === 1 ? 'You touched first. The stand is on its feet.' : place <= 3 ? 'A medal! Coach Okafor is pretending not to grin.' : 'You raced. That is more than the stand did.'}`, place <= 3 ? 'good' : 'info', 6400);
  if (med) setTimeout(() => { if (!scn(NR.pool) || G.busy) return; const s = sc.nat.podSpots[place - 1], p = G.player; G.startActivity({ label: 'On the podium', anim: 'cheer', minutes: 3, rate: .5, at: { x: s.x, y: s.y + .02, z: s.z, dir: 1 }, done: () => toast('The medal is heavier than it looks, and cold.', 'good', 3200) }); }, 1800);
}

/* ---------- diving ---------- */
async function dive(boardId, diveId, auto) {
  const sc = scn(NR.pool), S = st(), B = BOARDS.find(b => b.id === boardId); if (!sc || !B || G.busy) return null; const m = sc.nat.meet;
  if (sc.nat.drill.on) { toast('The lifeguards have the diving well for their rescue drill.', 'info'); return null; } if (m && m.ph !== 'after') { toast('Diving is closed during the meet.', 'info'); return null; }
  if (S.level < B.lvl) { toast(S.level < 2 ? '"Deep water. Seahorse badge first, please." (Swim level 2.)' : `"The ${B.name.toLowerCase()} needs swim level ${B.lvl}." Walt taps the sign with his whistle.`, 'info', 4200); return null; }
  const list = DIVES.filter(d => d.lvl <= Math.max(2, S.level)); let dv = diveId ? DIVES.find(d => d.id === diveId) : null;
  if (!dv) { const v = await choose(B.name, list.map(d => ({ label: d.name, sub: 'Difficulty ' + d.dd.toFixed(1), value: d.id })).concat([{ label: 'Climb back down', value: null }]), { text: 'Two taps: one for the take-off, one to open out for the entry.' + (S.diveBest[B.id] ? ' Your best here: ' + S.diveBest[B.id].toFixed(1) + '.' : '') }); if (!v) return null; dv = DIVES.find(d => d.id === v); }
  const P = BOARD_AT[B.id], p = G.player; sc.nat.npcDiveHold(14); sc.nat.cards(null); if (!S.swim) swimwear(true, true); S.wet = 1;
  return new Promise(res => {
    let ph = 0, t = 0, q1 = 0, ctl = null, fin = false, tapped = false; const L = look(G.state.player.spec);
    const act = G.startActivity({ label: 'On the ' + B.short.toLowerCase() + ' board', anim: 'stand', hide: true, minutes: 30, rate: .2, cancel: () => stop(null), done: () => stop(null) });
    hud(dv.name + ' · ' + B.short); hudInfo('Tap when the marker is in the green: that is your take-off.'); hudBtns([['Jump!', () => tap(), 'go'], ['Climb down', () => { if (G.busy === act) G.endActivity(false); }, 'red']]);
    let held = true; const mkCtl = q => { const c = sc.nat.dive({ board: B.id, dive: dv, look: L, q, onEnd: r => land(r) }), upd = c.ent.update; c.ent.update = dt => { if (held) { c.ent.z = P.z + .08; return; } upd(dt); }; camTo(c.ent); return c; }; ctl = mkCtl(1);
    function tap() { if (fin) return; if (ph === 0) { const pos = (Math.sin(t * 5.2) + 1) / 2; q1 = Math.max(0, 1 - Math.abs(pos - .5) / .5); ph = 1; t = 0; ctl.cancel(); ctl = mkCtl(q1); hudInfo('In the air: tap to open out as the marker reaches the green.'); H && (H.btns.firstChild.textContent = 'Open out!'); } else if (ph === 1 && !tapped) { tapped = true; ctl.open(); } }
    function land(r) { if (fin) return; ph = 2; const base = 3.6 + 3 * q1 + 3.2 * r.rot + (has('nat_noseclip') ? .4 : 0), sc3 = [0, 1, 2].map(i => Math.max(0, Math.min(10, Math.round((base + (Math.random() - .5) * 1.1 + (i - 1) * .2) * 2) / 2))), total = Math.round(sc3.reduce((a, b) => a + b, 0) * dv.dd * 10) / 10;
      sc.nat.cards(sc3); hudMeter(null); hudInfo(`Judges: ${sc3.map(v => v.toFixed(1)).join('  ')}  x ${dv.dd.toFixed(1)}  =  ${total.toFixed(1)}`); hudBtns([]); S.dives++; const old = S.diveBest[B.id] || 0, best = total > old; if (best) S.diveBest[B.id] = total; add('fun', 6 + dv.dd * 2); add('energy', -2); add('hygiene', 1); xp('fitness', 4); fit(.03); if (B.id !== 'b1') stamp('x:nat_dive'); G.emit('natatorium:dive', { board: B.id, dive: dv.id, scores: sc3, total });
      sc.nat.cheer && sc.nat.cheer(r.rot > .7 ? 8 : 2); toast(`${dv.name}: ${sc3.map(v => v.toFixed(1)).join(', ')}. ${total.toFixed(1)} points${best && old ? ', your best off this board' : ''}. ${r.rot > .8 ? 'Barely a ripple.' : r.rot < .4 ? 'That one slapped. The whole hall heard it.' : 'A respectable splash.'}`, r.rot > .6 ? 'good' : 'info', 5200);
      camTo(null); setTimeout(() => { sc.nat.cards(null); }, 4200); waitS(2.6).then(() => stop({ scores: sc3, total })); }
    function frame(dt) { if (fin || G.modal) return; t += dt; const pos = (Math.sin(t * 5.2) + 1) / 2, aq = typeof auto === 'number' ? auto : auto ? .9 : null;
      if (ph === 0) { hudMeter(pos, .4, .6); if (aq !== null && t > .4 && Math.abs(Math.abs(pos - .5) - (1 - aq) * .5) < .05) tap(); }
      else if (ph === 1) { if (held && t > .15) held = false; hudMeter(ctl.prog(), .7, .86); if (aq !== null && !tapped && ctl.prog() >= .78 + (1 - aq) * .3) tap(); } }
    function stop(v) { if (fin) return; fin = true; G.off('frame', frame); mini = null; hudClose(); camTo(null); if (ctl && !ctl.done()) ctl.cancel(); if (G.busy === act) G.endActivity(!!v); if (v) { p.x = O + 36; p.y = O + 16.3; p.dir = 3; } res(v); }
    mini = { kind: 'dive', tap, stop: () => stop(null), state: () => ({ kind: 'dive', ph, q1, prog: ctl ? ctl.prog() : 0 }) }; G.on('frame', frame);
  });
}

/* ---------- slides ---------- */
function slides(which, auto) {
  const sc = scn(NR.leisure), S = st(), p = G.player; if (!sc || G.busy || G.cutscene) return Promise.resolve(null); if (sc.nat.party) { toast('The slides are roped off for the pool party. The DJ has the tower lights.', 'info'); return Promise.resolve(null); }
  return new Promise(res => {
    const pts = sc.nat.climb.map(q => [O + q[0], O + q[1], q[2]]); let i = 1, mode = 'climb', R0 = null, t = 0, v = 0, id = null, bends = [], bi = 0, lean = 0, leanT = 0, msg = '', fin = false; p.x = pts[0][0]; p.y = pts[0][1]; S.wet = 1;
    const finish = val => { if (fin) return; fin = true; G.cutscene = null; mini = null; hudClose(); camTo(null); p.hidden = false; p.zoff = 0; p.pose = null; p.moving = false; res(val); };
    const pickSlide = async () => { mode = 'menu'; let w = which; if (!w) w = await choose('Top of the tower', [{ label: SLIDES.flume.name + ' (the blue and yellow flume)', sub: 'Six bends. Lean into each one.' + (S.slides.flume ? ' Your best: ' + S.slides.flume.toFixed(1) + ' s' : ''), value: 'flume' }, { label: SLIDES.drop.name + ' (the red drop)', sub: S.level < 2 ? 'Needs swim level 2: the run-out is deep' : 'Push off, then lie back.' + (S.slides.drop ? ' Your best: ' + S.slides.drop.toFixed(1) + ' s' : ''), value: 'drop', disabled: S.level < 2 }, { label: 'Walk back down', value: null }], { text: 'Four metres up. The whole leisure pool is below you: the river going round, the bucket filling.' });
      if (!w || (w === 'drop' && S.level < 2)) { p.x = pts[0][0]; p.y = pts[0][1]; return finish(null); }
      id = w; R0 = sc.nat.rider(id, look(G.state.player.spec)); sc.nat.npcHold(20); p.hidden = true; camTo(R0.ent); mode = 'ride'; t = 0; v = id === 'drop' ? 1.6 : 1.2;
      if (id === 'flume') { for (const f of [.13, .27, .42, .56, .7, .84]) { const a = sc.nat.pathAt(id, R0.L * f - .6), b = sc.nat.pathAt(id, R0.L * f), c = sc.nat.pathAt(id, R0.L * f + .6), cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]); bends.push({ s: R0.L * f, dir: cr > 0 ? 1 : -1, done: 0 }); } } else bends = [{ s: R0.L * .1, dir: 0, done: 0 }, { s: R0.L * .36, dir: 0, done: 0 }];
      hud(SLIDES[id].name); hudBtns(id === 'flume' ? [['< Lean left', () => doLean(-1), 'go'], ['Lean right >', () => doLean(1), 'go']] : [['Push off / lie back!', () => doLean(0), 'go']]); };
    function doLean(d) { if (mode !== 'ride' || !R0) return; const b = bends[bi]; if (!b || b.done) return; const ds = b.s - R0.s; if (ds > 1.5) { v *= .93; msg = 'Too early!'; return; } if (id === 'flume' && d !== b.dir) { b.done = -1; v *= .8; msg = 'Wrong way! You slosh up the wall.'; } else { b.done = 1; v += id === 'flume' ? .8 : 1.1; msg = id === 'flume' ? 'Whoosh!' : (bi ? 'Flat as a board!' : 'Good push!'); } bi++; }
    mini = { kind: 'slide', lean: doLean, tap: () => doLean(0), stop: () => finish(null), state: () => ({ kind: 'slide', mode, id, s: R0 ? R0.s : 0, L: R0 ? R0.L : 0, v, next: bends[bi] ? { ds: bends[bi].s - (R0 ? R0.s : 0), dir: bends[bi].dir } : null }) };
    G.cutscene = { _nat: true, update(dt) {
      if (fin) return;
      if (mode === 'climb') { const q = pts[i], dx = q[0] - p.x, dy = q[1] - p.y, dz = q[2] - p.zoff, d = Math.hypot(dx, dy), stp = 2.6 * dt; p.moving = true; p.pose = 'walk'; if (d <= stp) { p.x = q[0]; p.y = q[1]; p.zoff = q[2]; i++; if (i >= pts.length) { p.moving = false; p.pose = null; pickSlide(); } } else { p.x += dx / d * stp; p.y += dy / d * stp; p.zoff += dz * stp / d; p.face(dx, dy); } p.z = p.zoff; return; }
      if (mode !== 'ride') return; t += dt; const vmax = id === 'drop' ? 3.4 : 2; v = Math.max(.8, v + (vmax - v) * dt * 1.4); const b = bends[bi];
      if (b && !b.done) { const ds = b.s - R0.s; if (ds < -.5) { b.done = -1; bi++; v *= .9; msg = id === 'flume' ? 'You bounce off the bend.' : 'Sat up: slower.'; } else if (auto && ds < .6) doLean(b.dir); hudInfo(ds < 1.5 ? (id === 'flume' ? (b.dir < 0 ? '<<  LEAN LEFT  <<' : '>>  LEAN RIGHT  >>') : (bi ? 'LIE BACK!' : 'PUSH OFF!')) : msg || 'Here it comes...'); hudMeter(Math.max(0, 1 - Math.max(0, ds) / 4), .62, 1); } else { hudInfo(msg || 'Wheee!'); hudMeter(null); }
      R0.at(R0.s + v * dt); if (R0.s >= R0.L) { R0.end(id === 'drop'); const time = Math.round(t * 10) / 10, old = S.slides[id], best = !old || time < old; if (best) S.slides[id] = time; S.slides.n++; add('fun', 12); add('hygiene', 1); moodlet('nat_slide'); if (S.slides.flume && S.slides.drop) stamp('x:nat_slides'); G.emit('natatorium:slide', id, time);
        sc.nat.slideBoard([SLIDES[id].name.replace('The ', '').toUpperCase(), 'YOU ' + time.toFixed(1), 'BEST ' + (S.slides[id]).toFixed(1), 'POOL ' + SLIDES[id].best.toFixed(1)]); toast(`${SLIDES[id].name}: ${time.toFixed(1)} seconds${best && old ? ', a new best' : ''}. ${time < SLIDES[id].par ? 'Fast! The lifeguard actually nods.' : 'Lean harder into the bends next time.'} You surface with your hair over your face.`, 'good', 5200);
        mode = 'out'; p.x = O + 9.3; p.y = O + 11.9; p.dir = 0; waitS(.9).then(() => finish(time)); } } };
  });
}

/* ---------- lazy river, waves, bucket, hot tub, wellness, loungers ---------- */
function river() {
  const sc = scn(NR.leisure), S = st(); if (!sc || G.busy) return false; const R0 = sc.nat.river; let laps = 0; R0.ride(true); camTo(R0.mine); S.wet = 1;
  const end = () => { R0.ride(false); camTo(null); hudClose(); mini = null; }, noodle = has('nat_noodle');
  const act = G.startActivity({ label: 'Floating round the lazy river', anim: 'stand', hide: true, minutes: 240, rate: .5, tick: gm => { add('fun', gm * (noodle ? .5 : .4)); add('energy', gm * .25); const l = R0.laps(); if (l > laps) { laps = l; S.river++; moodlet('nat_drift'); stamp('x:nat_river'); G.emit('natatorium:river', laps); toast(laps === 1 ? 'Once round. Under the bridge, past the palms, past a child who splashed you on purpose. You could go again. You are going again.' : `Lap ${laps}. Time has stopped meaning anything.`, 'good', 4600); } hudInfo(laps ? `Laps: ${laps}. The current does the work.` : 'Lie back. The current does the work.'); }, cancel: end, done: end });
  hud('Lazy river'); hudBtns([['Climb out', () => { if (G.busy === act) G.endActivity(false); }, 'red']]); mini = { kind: 'river', state: () => ({ kind: 'river', laps, turned: R0.turned }), stop: () => { if (G.busy === act) G.endActivity(false); } }; return true;
}
function waves() {
  const sc = scn(NR.leisure), S = st(); if (!sc || G.busy) return false; const Wv = sc.nat.wave; let inWave = 0, got = false; Wv.wade(true); camTo(Wv.me); S.wet = 1; const w0 = waveOn(G.state.t);
  if (!w0.on) toast(`Flat calm, chest deep. The wave machine starts in ${Math.ceil(w0.next)} minutes: stay for the siren.`, 'info', 3800);
  const end = () => { Wv.wade(false); camTo(null); hudClose(); mini = null; };
  const act = G.startActivity({ label: 'In the wave pool', anim: 'stand', hide: true, minutes: 120, rate: .5, tick: gm => { const on = Wv.on; add('fun', gm * (on ? 1.1 : .3)); add('hygiene', gm * .2); if (on) { inWave += gm; fit(gm * .004); if (!got && inWave >= 2) { got = true; S.waves++; moodlet('nat_waves'); stamp('x:nat_waves'); toast('The siren, a cheer, and the far wall starts throwing the sea at you. You go up, you go down, you swallow about a pint.', 'good', 5200); } } const w = waveOn(G.state.t); hudInfo(on ? `WAVES! ${Math.ceil(w.left)} minutes left. Jump as each one lifts you.` : `Calm water. Waves in ${Math.ceil(w.next)} min.`); }, cancel: end, done: end });
  hud('Wave pool'); hudBtns([['Wade out', () => { if (G.busy === act) G.endActivity(false); }, 'red']]); mini = { kind: 'waves', state: () => ({ kind: 'waves', on: Wv.on, inWave }), stop: () => { if (G.busy === act) G.endActivity(false); } }; return true;
}
function bucket() {
  const sc = scn(NR.leisure), S = st(), p = G.player; if (!sc || G.busy) return false; const B = sc.nat.bucket; S.wet = 1;
  const act = G.startActivity({ label: 'Under the tipping bucket', anim: 'stand', minutes: 60, rate: .25, at: { x: B.spot.x, y: B.spot.y, dir: 1 }, tick: () => { const l = B.left(); p.pose = l < 3 ? 'cheer' : 'stand'; if (G.busy) G.busy.label = l < 1 ? 'Here it comes!' : `Under the bucket: about ${Math.ceil(l)} s`; }, cancel: () => { B.onTip = null; }, done: () => { B.onTip = null; } });
  B.onTip = () => { B.onTip = null; S.buckets++; add('fun', 14); add('hygiene', 3); moodlet('nat_soaked'); toast('Four hundred litres, straight on the head. Three toddlers applaud. You have never felt more alive or less dignified.', 'good', 5000); waitS(1.2).then(() => { if (G.busy === act) G.endActivity(true); }); };
  return true;
}
function hotTub() {
  const sc = scn(NR.leisure), S = st(); if (!sc || G.busy) return false; const e = sc.nat.tubMe; e.ch.setSpec(G.state.player.spec); e.hidden = false; S.wet = 1;
  G.startActivity({ label: 'In the island hot tub', anim: 'stand', hide: true, minutes: TUB_MIN, rate: 1.6, tick: gm => { add('energy', gm * .35); add('fun', gm * .3); add('social', gm * .25); add('hygiene', gm * .2); }, cancel: () => { e.hidden = true; }, done: () => { e.hidden = true; S.tubs++; moodlet('poolside'); toast('Bubbles to the chin under a plastic palm tree, the lazy river going round you like a slow clock. Somebody\'s granddad tells you about 1986.', 'good', 5000); } }); return true;
}
function sauna(fx, kind) {
  const sc = scn(NR.leisure), S = st(), p = G.player; if (!sc || G.busy) return false; if (!inH(G.now().hf, HOURS.wellness)) { toast('The heat is off. Wellness is open ' + clock(HOURS.wellness[0]) + ' to ' + clock(HOURS.wellness[1]) + '.', 'info'); return false; }
  if (!wellOk()) { if (!G.money || !G.money.canAfford(PRICE.wellness)) { toast(`The wellness corner is ${fmt(PRICE.wellness)} a day (free for members). Ask at the front desk.`, 'info', 3600); return false; } if (!buy('wellness')) return false; toast(`Wellness add-on: ${fmt(PRICE.wellness)}. Sauna, steam and plunge are yours for the day.`, 'info', 3200); }
  const s = (fx.seats || []).slice().reverse().find(q => !sc.ents.some(e => e !== p && !e.hidden && e.x !== undefined && Math.hypot(e.x - q.x, e.y - q.y) < .4)); if (!s) { toast('Full. Somebody ladles water on the stones and everyone groans happily.', 'info'); return false; }
  const st0 = kind === 'steam';
  G.startActivity({ label: st0 ? 'In the steam room' : 'In the sauna', anim: 'sit', minutes: SAUNA_MIN, rate: 1.5, at: { x: s.x, y: s.y, z: s.z || .5, dir: 1 }, tick: gm => { add('hygiene', gm * .6); add('energy', gm * .12); add('fun', gm * .2); }, cancel: () => { p.poseOpts = null; },
    done: () => { p.poseOpts = null; S.saunas++; S.saunaT = G.state.t; moodlet('zen'); toast(st0 ? 'Eucalyptus fog so thick you lose your own knees. You come out pink and very relaxed.' : 'Eighty-five degrees of cedar and silence. Now the barrel, before you lose your nerve.', 'good', 4400); } }); p.poseOpts = { seated: true }; return true;
}
function plunge(fx) {
  const sc = scn(NR.leisure), S = st(); if (!sc || G.busy) return false; if (!wellOk()) { toast(`The cold plunge is part of the wellness corner: ${fmt(PRICE.wellness)} a day at the sauna door, free for members.`, 'info', 3600); return false; }
  const e = wader(sc, G.state.player.spec, fx.x, fx.y, 19, 'cheer'); e.z = .78; const hot = G.state.t - S.saunaT < 25; splash(sc, fx.x, fx.y, 1, .8); S.wet = 1;
  const rm = () => { e.hidden = true; e.dead = true; sc._fxn = 99; };
  G.startActivity({ label: 'In the cold plunge', anim: 'stand', hide: true, minutes: PLUNGE_MIN, rate: .4, tick: gm => { add('energy', gm * 3); add('hygiene', gm * .5); }, cancel: rm, done: () => { rm(); S.plunges++; if (hot) { S.contrast++; moodlet('nat_contrast'); stamp('x:nat_contrast'); G.emit('natatorium:contrast'); toast('Eight degrees. Your whole body says a word your mother would not like. Then: the glow. Every nerve awake and delighted.', 'good', 5400); } else toast('Eight degrees with no sauna first. That was just cold. Do it in the right order next time.', 'info', 4200); } }); return true;
}
function lounger(fx) {
  const sc = G.scene, p = G.player; if (!sc || G.busy) return false; const s = fx.seats[0]; if (sc.ents.some(e => e !== p && !e.hidden && e.x !== undefined && Math.hypot(e.x - s.x, e.y - s.y) < .4)) { toast('Somebody has left a towel on it. The oldest claim in the world.', 'info'); return false; }
  const sun = sc.roomId === NR.lido && sc.nat.state === 'summer' && !safe(() => G.weather.isWet());
  G.startActivity({ label: sun ? 'Sunbathing' : 'On a lounger', anim: 'sit', minutes: 30, rate: 3, at: { x: s.x, y: s.y, z: s.z || .38, dir: 1 }, tick: gm => { add('energy', gm * .3); add('fun', gm * (sun ? .25 : .12)); }, cancel: () => { p.poseOpts = null; }, done: () => { p.poseOpts = null; moodlet('poolside'); toast(sun ? 'Half an hour of sun on your shoulders and shrieks from the pool. Summer, bottled.' : 'Half an hour of warm echo and ceiling. You could not say what you thought about.', 'good', 3800); } }); p.poseOpts = { seated: true }; return true;
}

/* ---------- beat games: aqua-aerobics, the pool party ---------- */
function beats(title, n, bpm, onEnd, auto, onBeat) {
  return new Promise(res => { let t = -1.2, hits = 0, last = -1, fin = false; const T = 60 / bpm; hud(title); hudBtns([['Move!', () => tap(), 'go'], ['Stop', () => stop(null), 'red']]);
    function tap() { if (fin || t < 0) return; const b = Math.round(t / T), e = Math.abs(t / T - b); if (b === last || b >= n) return; last = b; if (e < .22) { hits++; add('fun', .3); } }
    function frame(dt) { if (fin || G.modal) return; t += dt; const b = Math.floor(t / T); if (t < 0) { hudInfo('Ready... on the beat.'); hudMeter(null); return; } if (auto && Math.abs(t / T - Math.round(t / T)) < .08 && Math.round(t / T) !== last && Math.round(t / T) < n && Math.random() < (auto === true ? .85 : auto)) tap(); if (onBeat && b !== frame.b) { frame.b = b; onBeat(b); } hudInfo(`Beat ${Math.min(n, b + 1)} of ${n} · on the beat: ${hits}`); hudMeter(((t / T) + .5) % 1, .5 - .2, .5 + .2); if (t >= n * T) stop(hits / n); }
    function stop(v) { if (fin) return; fin = true; G.off('frame', frame); hudClose(); mini = null; onEnd && onEnd(v); res(v); }
    mini = { kind: 'beat', tap, stop: () => stop(null), state: () => ({ kind: 'beat', beat: Math.floor(t / T), of: n, hits }) }; G.on('frame', frame); });
}
function aqua(auto) {
  const sc = scn(NR.pool), S = st(); if (!sc || G.busy) return Promise.resolve(null); if (!sc.nat.session || sc.nat.session.id !== 'aqua') { toast('Aqua-aerobics is Monday, Wednesday and Friday at noon.', 'info'); return Promise.resolve(null); }
  const e = wader(sc, G.state.player.spec, O + 9.4, O + POOL.y0 + 2.95, 11, 'dance'); e.ch.dir = 3; S.wet = 1; const rm = () => { e.hidden = true; e.dead = true; sc._fxn = 99; };
  const act = G.startActivity({ label: 'Aqua-aerobics', anim: 'stand', hide: true, minutes: 30, rate: .45, cancel: () => { rm(); if (mini && mini.stop) mini.stop(); }, done: rm }); camTo(e);
  return beats('Aqua-aerobics with Dolores', 24, 112, v => { camTo(null); if (G.busy === act) G.endActivity(v !== null); if (v === null) return; S.aqua++; fit(.12 + v * .1); xp('fitness', 8 + v * 8); add('energy', -5); add('fun', 8); moodlet('pumped'); toast(`${Math.round(v * 24)} of 24 on the beat. ${v > .7 ? 'Dolores points at you: "THAT one has rhythm!"' : 'Dolores shouts "LOVELY EFFORT" at you specifically.'} Your legs feel like they ran a mile, underwater, to disco.`, 'good', 5400); }, auto, b => { e.ch.pose = b % 4 < 2 ? 'dance' : 'cheer'; if (b % 8 === 0 && sc.nat) bubble(sc.nat.coach && !sc.nat.coach.hidden ? sc.nat.coach : e, pick(['And JOG! And JOG!', 'Arms UP! Arms OUT!', 'Rocking horse! Lovely!', 'Cross-country ski! Go!']), 1800); });
}
function party(auto) {
  const sc = scn(NR.leisure), S = st(), p = G.player; if (!sc || G.busy || !sc.nat.party) return Promise.resolve(null);
  const act = G.startActivity({ label: 'Dancing at the pool party', anim: 'dance', minutes: 30, rate: .5, cancel: () => { if (mini && mini.stop) mini.stop(); } });
  return beats('Friday Pool Party · ' + STAFF.dj, 24, 126, v => { if (G.busy === act) G.endActivity(v !== null); if (v === null) return; S.parties++; add('fun', 14 + v * 8); add('social', 8); add('energy', -4); moodlet('great_night_out'); stamp('x:nat_party'); toast(`${Math.round(v * 24)} of 24 on the beat. Disco lights on wet tiles, glow rings going round the river, and a fifteen-year-old tells you your moves are "actually fine".`, 'good', 5600); }, auto);
}

/* ---------- inflatable course, open-water night, rescue drill, the stand ---------- */
function inflatable(auto) {
  const sc = scn(NR.pool), S = st(), p = G.player; if (!sc || G.busy || G.cutscene || !sc.nat.inflatableOn()) return Promise.resolve(null);
  return new Promise(res => { const x0 = O + 6.3, x1 = O + 23.6, y = O + 13.9, OB = [3.6, 5.9, 8.2, 10.8, 13.2, 15.6].map(d => ({ x: x0 + d, done: 0 })); let oi = 0, t = 0, hop = 0, down = 0, fin = false, v = 0; p.x = x0; p.y = y; p.dir = 0; S.wet = 1;
    hud('The Inflatable'); hudBtns([['Jump!', () => jump(), 'go']]);
    const finish = val => { if (fin) return; fin = true; G.cutscene = null; mini = null; hudClose(); p.hidden = false; p.zoff = 0; p.pose = null; p.moving = false; res(val); };
    function jump() { if (down > 0 || hop > 0) return; const o = OB[oi], d = o ? o.x - p.x : 9; if (o && d < 1.25 && d > -.2) { o.done = 1; oi++; hop = .55; } else { hop = .4; v *= .7; } }
    mini = { kind: 'infl', tap: jump, stop: () => finish(null), state: () => ({ kind: 'infl', x: p.x - x0, next: OB[oi] ? OB[oi].x - p.x : null, t }) };
    G.cutscene = { _nat: true, update(dt) { if (fin) return; t += dt; if (down > 0) { down -= dt; if (down <= 0) { p.hidden = false; v = 0; } return; } v = Math.min(3.4, v + dt * 5); p.x += v * dt; p.moving = true; p.pose = 'run'; p.dir = 0; if (hop > 0) hop -= dt; p.zoff = .28 + (hop > 0 ? Math.sin(hop / .55 * 3.1416) * .9 : Math.abs(Math.sin(t * 9)) * .06); p.z = p.zoff;
      const o = OB[oi]; if (o) { const d = o.x - p.x; hudInfo(d < 1.25 ? 'JUMP!' : 'Run...'); hudMeter(Math.max(0, 1 - Math.max(0, d) / 4), .69, 1); if (auto && d < .7) jump(); if (d < -.25 && !o.done) { o.done = -1; oi++; splash(sc, p.x, p.y + 1.9, 2); p.hidden = true; down = 1.5; hudInfo('SPLASH. You haul yourself back on.'); } } else { hudInfo('Sprint for the end!'); hudMeter(null); }
      if (p.x >= x1) { splash(sc, x1 + .6, y, 2); const time = Math.round(t * 10) / 10, old = S.infl, best = !old || time < old; if (best) S.infl = time; add('fun', 14); add('energy', -3); xp('fitness', 5); toast(`The Inflatable: ${time.toFixed(1)} seconds${best && old ? ', a new best' : ''}. You go off the end like a dropped piano and a lifeguard gives you a seven.`, 'good', 5000); p.x = O + 27.4; p.y = O + 17.6; finish(time); } } }; });
}
function openWater() {
  const sc = scn(NR.pool), S = st(); if (!sc || G.busy) return false; if (S.level < 5) { toast('"Pack swimming is for Honorary Marlins: swim level 5. Watch tonight; join next season."', 'info', 4200); return false; }
  const me = sc.nat.me; me.L = look(G.state.player.spec); me.cap = '#f2c230'; me.stroke = 'free'; me.hidden = false; me.moving = true; me.rate = 6; let s = 2.6; camTo(me); S.wet = 1;
  const per = 2 * (17 + 6.4), at = q => { q = ((q % per) + per) % per; return q < 17 ? [6.5 + q, 7.7, 'x', 1] : q < 23.4 ? [24, 8.2 + (q - 17), 'y', 1] : q < 40.4 ? [23.5 - (q - 23.4), 15.1, 'x', -1] : [6, 14.6 - (q - 40.4), 'y', -1]; };
  const fr = dt => { if (G.modal) return; s += 2 * dt; const q = at(s); me.x = O + q[0]; me.y = O + q[1]; me.axis = q[2]; me.dir = q[3]; }, end = () => { G.off('frame', fr); me.hidden = true; me.axis = 'x'; camTo(null); };
  G.on('frame', fr); G.startActivity({ label: 'Pack swimming round the buoys', anim: 'stand', hide: true, minutes: 25, rate: .6, tick: gm => { add('energy', -gm * .5); fit(gm * .012); xp('fitness', gm * .8); add('fun', gm * .3); }, cancel: end, done: () => { end(); S.ow++; S.metres += 600; moodlet('nat_swim'); moodlet('pumped'); toast('Six hundred metres in a pack with no lane ropes: elbows, feet, sighting on an orange buoy in the half dark. The bay will feel easy after this.', 'good', 5400); } }); return true;
}
function drill() {
  const sc = scn(NR.pool), S = st(); if (!sc || G.busy) return false; const D = sc.nat.drill; if (!D.on) { toast('The rescue drill is Wednesday at four.', 'info'); return false; }
  const e = wader(sc, G.state.player.spec, D.spot.x, D.spot.y, 15, 'wave'); S.wet = 1; const rm = () => { e.hidden = true; e.dead = true; sc._fxn = 99; };
  const act = G.startActivity({ label: 'Being rescued (drill)', anim: 'stand', hide: true, minutes: 20, rate: .3, cancel: () => { rm(); D.vol = null; }, done: rm });
  if (!D.volunteer({ at: (x, y) => { e.x = x; e.y = y; }, done: () => { S.drills++; add('fun', 10); add('social', 4); if (G.busy === act) G.endActivity(true); toast('Towed to the side by the chin, backwards, by a nineteen-year-old who did not even breathe hard. Walt: "Textbook. The casualty wriggled a bit."', 'good', 5400); } })) { G.endActivity(false); return false; }
  toast('You tread water in the middle of the diving well and wave an arm. "HELP," you say, feeling silly. A whistle goes.', 'info', 3800); return true;
}
function sitStand() {
  const sc = scn(NR.pool), S = st(), p = G.player; if (!sc || G.busy) return false; const s = sc.nat.seat(); if (!s) { toast('Standing room only.', 'info'); return false; }
  s.c.hidden = true; let said = false;
  G.startActivity({ label: 'Watching from the stand', anim: 'sit', minutes: 240, rate: MEET.WATCH, at: { x: s.x, y: s.y, z: s.z, dir: 1 }, tick: gm => { const m = sc.nat.meet; add('fun', gm * (m ? .5 : .15)); add('energy', gm * .05); if (m && m.ph !== 'warm') { if (S.watchKey !== m.week) { S.watchKey = m.week; S.watch = 0; } S.watch += gm; if (S.watch >= WATCH_STAMP && !said) { said = true; stamp('x:nat_meet'); moodlet('great_night_out'); } if (m.ph === 'race') p.pose = m.tau > m.ev.dur - 8 ? 'cheer' : 'sit'; else p.pose = 'sit'; if (G.busy) G.busy.label = m.ph === 'after' ? 'Final score' : `Race ${m.i + 1}: ${m.ev.short.toLowerCase()}`; } },
    cancel: () => { p.poseOpts = null; }, done: () => { p.poseOpts = null; } }); p.poseOpts = { seated: true };
  const m = sc.nat.meet; toast(m ? (m.ph === 'warm' ? 'A plastic seat, warm air, the teams warming up below. First race at two.' : `You take a seat. Marlins in blue caps, ${m.M.opp.name} in the next lanes. Time runs slow up here: watch the board.`) : 'A plastic seat above the pool. Lengths going up and down like a slow loom.', 'info', 4600); return true;
}

/* ---------- the chain: the gap on the record board ---------- */
const goalText = () => { const c = st().chain, n = Object.keys(c.clues).length; return c.st === 1 ? `The 1974 record: find who swam it (${n} of 3 clues)` : c.st === 2 ? 'The dawn swimmer: find her at the early-bird lanes (lane 2, 6 to 8 am)' : c.st === 3 ? 'For Rosa: swim a timed 100 m backstroke at the Natatorium' : c.st === 4 ? 'Tell Walt the lifeguard: it is time for the plate' : ''; };
function setGoal() { const c = st().chain; if (!G.goals) return; if (c.st >= 1 && c.st <= 4) { const g = G.goals.get(GOAL); if (g) { g.text = goalText(); G.emit('goals:change'); } else safe(() => G.goals.add({ id: GOAL, text: goalText(), group: 'opportunity', placeId: 'natatorium', hint: 'The club record board at the Natatorium has one brass plate missing: women\'s 100 m backstroke, 1974, 1:09.8. Walt the old lifeguard says three places might remember her: the Courier archive on the Library steps, the sea-swimmers\' board at Gull Point Beach, and a bench by the Duck Pond. Each one glows softly.' })); } else if (c.st >= 5) safe(() => { if (G.goals.get(GOAL) && !G.goals.isDone(GOAL)) G.goals.complete(GOAL); }); }
async function talkWalt(c) {
  const S = st(), ch = S.chain, w = STAFF.guard, sc = scn(NR.pool); if (c) { c._hold = 5; }
  if (ch.st === 0) { await say([{ who: w, text: 'Fifty-three years on this chair. Started the summer of seventy-one. You want to know the only thing in this building I cannot tell you?' }, { who: w, text: 'The record board in the hall. Women\'s hundred backstroke, 1974. One-oh-nine-eight. Never been beaten. And the name plate fell off in a refit before anybody wrote it down.' }, { who: w, text: 'I SAW that swim. Skinny kid, trained at dawn before I was even on shift. Coach Stern let her in with his own key. I never got her name and it has itched me for fifty years.' }, { who: w, text: 'The Courier would have printed it: the Library has the old papers. The sea swimmers at Gull Point kept a roll. And Stern has a bench by the Duck Pond; somebody paid for that plaque. Go and look, would you? My knees are not what they were.' }]); ch.st = 1; setGoal(); G.emit('natatorium:chain', 1); syncCity(); return; }
  if (ch.st === 1) return say([{ who: w, text: `${Object.keys(ch.clues).length} of three so far? The Library steps for the newspaper, Gull Point Beach for the swimmers' roll, the Duck Pond for Stern's bench.` }]);
  if (ch.st === 2) return say([{ who: w, text: 'Castellanos. ROSA Castellanos. And she is lane two?! The lady with the red costume who tells me my whistle is flat? She is in at six every morning. Go and ask her. I cannot. I would cry.' }]);
  if (ch.st === 3) return say([{ who: w, text: 'She said yes if you swim her event? That is Rosa all over. Hundred backstroke, on the clock. Any lane you like. Off you go.' }]);
  if (ch.st === 4) {
    await say([{ who: w, text: 'You swam it. And she is coming Saturday. Right. I have had this in my locker since nineteen ninety-one, in case.' }, { who: null, text: 'He takes a small brass plate out of his shirt pocket. It is blank. He has a punch set in the other hand.' }, { who: w, text: 'R. CASTELLANOS. There. Fifty years late.' }, { who: STAFF.rosa, text: 'You spelled it right. I am astonished. ...Put it up straight, Walter.' }, { who: STAFF.coach, text: 'And since somebody finally did what this club should have done decades ago: the Starfish class is painting the community wall, lane two gets gold floats, and YOUR name goes on the Friends board. No arguing.' }, { who: w, text: 'And you swim free in this building for as long as it stands. Here. My old whistle. I have a new one. It is not flat.' }]);
    ch.st = 5; G.state.flags.nat_pass = true; safe(() => G.money.add(75, 'Friends of the Marlins')); safe(() => G.inv.add('nat_whistle', 1, { silent: true })); moodlet('great_night_out'); setGoal(); G.emit('natatorium:chain', 5); const h = G.sceneCache.get('int:' + NR.hall); if (h && h.nat) h.nat.setBoards(); if (!(G.scene && G.scene.id === 'int:' + NR.pool)) G.sceneCache.delete('int:' + NR.pool);
    toast('The plate is on the board: W 100 BACK · 1974 · R. CASTELLANOS. Free swimming for life, $75 from the club, Walt\'s whistle, a mural on the way and your name in gold in the entrance hall.', 'good', 8000); return; }
  return bubble(c || G.player, pick(['Rosa says my new whistle is sharp. There is no pleasing her.', 'WALK, please. ...Not you. Him.', 'Have you seen the mural? She pretends not to look at it.', 'Fifty-three years. Best seat in the building.']), 3600);
}
async function talkRosa(c) {
  const S = st(), ch = S.chain, w = ch.st >= 2 ? STAFF.rosa : 'A swimmer resting at lane two';
  if (ch.st < 2) return bubble(c, pick(['Forty lengths before breakfast. Then I can face the day.', 'Your catch is late. Reach further.', 'I have had this lane since before you were born.']), 3600);
  if (ch.st === 2) { await say([{ who: w, text: 'Castellanos. Nobody has called me that at a poolside since... You found the Courier. And Abel\'s bench. Goodness.' }, { who: w, text: 'One-oh-nine-eight. I was sixteen. We moved to Port Alder that autumn and when I came back the plate was gone and I thought: well, Rosa, that is that. It did not seem polite to mention it.' }, { who: w, text: 'So I have just swum under my own record every morning for forty years. It is quite good company.' }, { who: w, text: 'Walt wants to put it back? Hm. Tell you what. You swim my event first: a hundred metres backstroke, on the clock, all four lengths. Then I will come on Saturday and let him make a fuss.' }]); ch.st = 3; setGoal(); G.emit('natatorium:chain', 3); return; }
  if (ch.st === 3) return say([{ who: w, text: 'A hundred backstroke, timed. Count the roof beams: five from the flags to the wall. I am not in a hurry. I have waited since 1974.' }]);
  if (ch.st === 4) return say([{ who: w, text: 'I watched. Your left arm crosses over. But you finished, and that is the event. Go and tell Walt before he bursts.' }]);
  return bubble(c, pick(['Gold floats on my lane. Ridiculous. ...I like them.', 'Somebody will beat it one day. I hope I am here to shake her hand.', 'Your left arm still crosses over.']), 3600);
}
function clue(i) {
  const S = st(), ch = S.chain, d = CLUES[i]; if (G.busy || !d || ch.clues[i]) return false; if (ch.st !== 1) { toast('Old paper and brass. It means nothing to you yet.', 'info'); return false; }
  ch.clues[i] = 1; G.emit('natatorium:clue', i); const n = Object.keys(ch.clues).length; if (cluePois[i] && cluePois[i].ob) cluePois[i].ob.hidden = true;
  say([{ who: null, text: d.found }].concat(n >= 3 ? [{ who: null, text: 'R. Castellanos. Rosa. Moved away, came back, and has been swimming in lane two at six every morning ever since. She has been under her own record for forty years and nobody asked.' }] : [])).then(() => { if (n >= 3) { ch.st = 2; G.emit('natatorium:chain', 2); } setGoal(); toast(n >= 3 ? 'Three clues: it is Rosa Castellanos, the early-bird in lane two. Catch her between six and eight in the morning.' : `${n} of 3 clues about the 1974 record.`, 'good', 4600); });
  return true;
}

/* ---------- city: the door, the sign, the lawn props, the three clue spots ---------- */
function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w; const ob = w.objs.find(o => o.id === 'bld.civic.pool'); if (!ob) return;
  if (ob.p.name !== 'NATATORIUM') { ob.p = Object.assign({}, ob.p, { name: 'NATATORIUM', kind: undefined, accent: '#1fa3b8', roof: '#b8d4dc' }); ob._key = null; }
  door = w.pois.find(p => p.id === DOOR);
  if (!door) { const B = ob.B, dr = ob.a.door || { at: 2.4 }, free = (x, y) => x > 1 && y > 1 && x < w.w - 1 && y < w.h - 1 && !w.isBlocked(x, y); let sp = null;
    for (const outd of [.75, 1.25, 1.75]) { for (const off of [0, .5, -.5, 1, -1]) { const a = ob.flip ? { x: B[3] + outd, y: B[1] + dr.at + off, dir: 0 } : { x: B[0] + dr.at + off, y: B[4] + outd, dir: 1 }; if (free(a.x, a.y)) { sp = a; break; } } if (sp) break; } if (!sp) return;
    door = w.poi({ type: 'door', id: DOOR, room: NR.hall, name: NAME, x: Math.round(sp.x * 2) / 2, y: Math.round(sp.y * 4) / 4, dir: sp.dir, district: (w.districtAt && w.districtAt(sp.x, sp.y)) || 'maplewood', showpiece: true }); }
  if (!ob.flip && !w.objs.some(o => o.id === 'prop.nat.totem')) { const x0 = ob.B[0], y1 = ob.B[4], fr = (xa, ya, xb, yb) => { for (let x = xa; x <= xb; x += .5) for (let y = ya; y <= yb; y += .5) if (w.isBlocked(x, y)) return false; return true; };
    safe(() => { if (fr(x0 + 13.5, y1 + .25, x0 + 14, y1 + .5)) w.place('prop.nat.totem', x0 + 13.4, y1 + .2, {}); });
    safe(() => { if (fr(x0 + 10, y1 + .25, x0 + 13, y1 + .5)) bannerOb = w.place('prop.nat.banner', x0 + 10.2, y1 + .3, { p: { a: 'NATATORIUM', b: '', c: '' } }); });
    for (const [dx, c, c2] of [[5.6, '#1f6fb8', '#f2c230'], [7.2, '#f4f8f8', '#1fa3b8']]) safe(() => { if (!w.isBlocked(x0 + dx, y1 + .4)) w.place('prop.nat.flag', x0 + dx, y1 + .3, { solid: false, p: { c, c2 } }); }); }
  else bannerOb = w.objs.find(o => o.id === 'prop.nat.banner') || null;
  CLUES.forEach((c, i) => { let poi = w.pois.find(p => p.id === 'nat:clue:' + i); if (!poi) { const a = w.pois.find(p => p.id === c.anchor) || w.pois.find(p => c.name && p.name === c.name) || { x: door.x - 30 - i * 20, y: door.y + 6 }, at = c.name && w.pois.find(p => p.name === c.name) ? { x: w.pois.find(p => p.name === c.name).x, y: w.pois.find(p => p.name === c.name).y } : { x: a.x + c.dx, y: a.y + c.dy }, f = nearestFree(w, Math.round(at.x * 2), Math.round(at.y * 2), 16); if (!f) return; poi = w.poi({ type: 'spot', id: 'nat:clue:' + i, x: f[0] / 2 + .25, y: f[1] / 2 + .25, where: c.where, quest: true }); } cluePois[i] = poi; });
}
let sprk = null;
function sparkle(f) { if (!sprk) sprk = []; if (sprk[f]) return sprk[f]; const c = document.createElement('canvas'); c.width = c.height = 9; const x = c.getContext('2d'); x.fillStyle = '#bff0ff'; const r = [1, 2, 3, 2][f]; x.fillRect(4, 4 - r, 1, r * 2 + 1); x.fillRect(4 - r, 4, r * 2 + 1, 1); x.fillStyle = '#ffffff'; x.fillRect(4, 4, 1, 1); return sprk[f] = { c, l: c, x: -4, y: -4, w: 9, h: 9 }; }
function wire(s) {
  ensure(s.world); if (!door) return; const w = s.world;
  if (!s.interactables.some(it => it.poi === door)) s.interactables.push({ x: door.x, y: door.y, label: NAME, h: 1.2, range: 1.3, poi: door, use: () => enter() });
  cluePois.forEach((p, i) => { if (!p || s.interactables.some(it => it.poi === p)) return; s.interactables.push({ x: p.x, y: p.y, label: CLUES[i].short, h: .8, hit: 14, range: 1.5, poi: p, visible: () => st().chain.st === 1 && !st().chain.clues[i], use: () => clue(i) });
    s.ents.push({ x: p.x, y: p.y, z: w.heightAt(p.x, p.y) + .5, bb: [-.1, -.1, .1, .1, .3], get hidden() { return !(S && S.chain.st === 1 && !S.chain.clues[i]); }, set hidden(v) { }, sprite: () => sparkle(Math.floor(G.time * 4) % 4) }); });
  syncCity();
}
function syncCity() { if (!bannerOb) return; const n = G.now(), ses = sessionsOn(n).filter(s => s.id !== 'early' && s.to > n.hf)[0], b = !isOpen() ? 'CLOSED' : ses ? (ses.id === 'meet' ? 'SWIM MEET' : ses.id === 'teen' ? 'POOL PARTY' : ses.id === 'family' ? 'FAMILY FUN' : ses.id === 'aqua' ? 'AQUA FIT' : ses.id === 'school' ? 'LANES OPEN' : ses.id === 'club' ? 'LANES OPEN' : ses.id === 'drill' ? 'RESCUE DRILL' : 'OPEN WATER') : 'SWIM TODAY', c = !isOpen() ? 'OPENS 06:00' : ses && ['meet', 'teen', 'family', 'aqua', 'drill', 'ow'].includes(ses.id) ? 'TODAY ' + clock(ses.from) : 'OPEN 6-22'; if (bannerOb.p.b !== b || bannerOb.p.c !== c) { bannerOb.p = { a: 'NATATORIUM', b, c }; bannerOb._key = null; } }

/* ---------- guide ---------- */
function patchGuide() {
  const e = safe(() => G.guide.get('place:natatorium')); if (!e) return; const n = G.now();
  e.blurb = CORE_BLURB.natatorium; e.type = 'Swimming pool'; e.chapter = 'fitness'; e.also = ['sights', 'outdoors', 'eat']; e.price = `Swim ${fmt(PRICE.swim)} (${fmt(PRICE.early)} before 8) · 10 swims ${fmt(PRICE.card)} · ${PRICE.memberDays}-day membership ${fmt(PRICE.member)} · lessons ${fmt(PRICE.lesson)} · the stand is free`;
  const T = ['pool', 'swimming', 'diving', 'slides', 'lazy river', 'wave machine', 'sauna', 'lessons', 'swim meet', 'lido', 'kids', 'cafe']; e.tags = (e.tags || []).filter(t => !T.includes(t)).concat(T);
  e.tryThis = ['Change at a locker and rinse before you swim (bring a towel!)', 'Swim a timed 100 m: tap in time with the stroke', 'Take a lesson with Coach Okafor: each badge opens more of the building', 'Dive from the three-metre board for the judges', 'Lean into the bends on The Twister; lie back on The Plunge', 'Float once round the lazy river', 'Be in the wave pool at :00 or :30', 'Stand under the tipping bucket', 'Sauna, then the cold plunge', 'Aqua-aerobics Mon / Wed / Fri at noon', 'Friday pool party from 19:00', 'Saturday swim meet at 14:00 from the stand, or enter the Novice 50 m', 'Sunday: run the inflatable course', 'Ask Walt the lifeguard about the gap on the record board'];
  const ses = sessionsOn(n).find(s => s.to > n.hf && s.id !== 'early'); e.when = ses ? `Today: ${ses.name}, ${clock(ses.from)}` : 'Lane swimming all day; waves on the hour and the half';
}

export function init() {
  S = G.defineState('natatorium', DEF); st();
  G.natatorium = { isOpen, enter, leave, go, entryOk, member, buy, desk, shop, vending, cafe, kiosk, records, timetable, honours, lookMural, lookWindow, lookBoard, lookSlideBoard, lookCover, whiteboard, turnstile, cubicle, locker, swimwear, shower, dryer, towel,
    level: () => st().level, lesson, lane, swim, swimming: () => (mini && mini.kind === 'swim' ? mini.state() : null), pb: () => Object.assign({}, st().pb), dive, slides, river, waves, bucket, hotTub, sauna, plunge, lounger, aqua, party, inflatable, openWater, drill, sitStand, enterRace, race, myRace,
    talkWalt, talkCoach, talkRosa, chain: () => st().chain, clue, clues: () => cluePois.map((p, i) => p && { i, x: p.x, y: p.y, got: !!st().chain.clues[i] }).filter(Boolean),
    mini: { state: () => (mini ? mini.state() : null), tap: () => { if (mini && mini.tap) mini.tap(); }, lean: d => { if (mini && mini.lean) mini.lean(d); }, pace: id => { if (mini && mini.pace) mini.pace(id); }, auto: on => { if (mini && mini.auto) mini.auto(on); }, stop: () => { if (mini && mini.stop) mini.stop(); } },
    meet: () => meetAt(G.state.t), sessions: d => sessionsOn(d || G.now()), playerName, arrived, left, door: () => door, passGate,
    stats: () => { const S = st(); return { visits: S.visits, level: S.level, metres: S.metres, lengths: S.lengths, pb: Object.assign({}, S.pb), dives: S.dives, diveBest: Object.assign({}, S.diveBest), slides: Object.assign({}, S.slides), river: S.river, waves: S.waves, buckets: S.buckets, tubs: S.tubs, saunas: S.saunas, plunges: S.plunges, contrast: S.contrast, aqua: S.aqua, parties: S.parties, infl: S.infl, medals: S.medals.slice(), drills: S.drills, ow: S.ow, card: S.card, member: member(), swim: !!S.swim, chain: S.chain.st }; } };
  G.on('load', () => { st(); stopAll(); setGoal(); if (S.swim && !/^int:natatorium/.test((G.state.player && G.state.player.scene) || '')) swimwear(false, true); });
  G.on('room:build', sc => { if (inside(sc) && !built) safe(() => ensure(getCity())); });
  G.on('scene', (s, prev) => {
    if (s && s.id === 'city' && !s._nat && s.world) { s._nat = true; try { wire(s); } catch (e) { console.warn('natatorium', e); } setGoal(); }
    const now = inside(s), was = inside(prev); if (was) stopAll();
    if (was || now) { const L = G.state.nav && G.state.nav.edges; if (L) for (const k of Object.values(NR)) delete L['int:' + k]; }
    if (!now && st().swim) { swimwear(false, true); S.wet = 0; }
  });
  G.on('guide:rebuilt', patchGuide);
  G.on('frame', dt => { if (W) swimFrame(dt); });
  G.on('key', k => { if (!mini || G.modal) return; if (k === ' ' || k === 'e' || k === 'enter') { if (mini.tap) mini.tap(); } else if (k === 'arrowleft' || k === 'a') { if (mini.lean) mini.lean(-1); } else if (k === 'arrowright' || k === 'd') { if (mini.lean) mini.lean(1); } else if (k === 'p' && W) { const ks = ['easy', 'steady', 'sprint']; W.pace = ks[(ks.indexOf(W.pace) + 1) % 3]; } });
  if (typeof window !== 'undefined') window.addEventListener('pointerdown', e => { if (mini && mini.tap && !G.modal && e.target === G.cv && (mini.kind === 'swim' || mini.kind === 'beat' || mini.kind === 'dive' || mini.kind === 'infl')) mini.tap(); }, { passive: true });
  let acc = 0; G.addSystem({ name: 'natatorium', update(dt) { const sc = G.scene; if (!sc) return; if (sc.id === 'city') { if ((acc += dt) > 2) { acc = 0; safe(syncCity); } return; } if (sc.roomId === NR.hall && G.player.x > O + 22.6 && st().through !== G.now().day && !G.busy) passGate(); } });
  // closing time: everybody out at ten (dressed)
  G.on('minutes', () => { const sc = G.scene; if (!inside(sc) || G.modal || G.cutscene || sc._closing) return; const h = G.now().hf; if (h >= HOURS.close + .08 || h < HOURS.open - .02) { sc._closing = true; if (G.busy) G.endActivity(false); stopAll(); toast('"Pool is closing!" The lights over the lanes go off in rows. You are dried, dressed and on the pavement in ten minutes flat.', 'info', 4800); swimwear(false, true); G.advance(8); exitRoom({ poi: DOOR }).then(() => { sc._closing = false; }, () => { sc._closing = false; }); }
    else if (sc.roomId === NR.leisure && !G.busy) { const hrs = G.now().weekday === 4 ? HOURS.leisureFri : HOURS.leisure; if (!inH(h, hrs) && h > hrs[1]) { sc._closing = true; toast('The leisure pool is closing. The river stops, which is somehow sad.', 'info', 3600); G.go('int:' + NR.change, AT.changeL).then(() => { sc._closing = false; }, () => { sc._closing = false; }); } } });
}
