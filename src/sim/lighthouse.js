// Gull Point Lighthouse — gameplay for the lighthouse you can climb, converted in place from the existing landmark `bld.harbor.lighthouse` at the end of the beach (nothing in the city layout is touched).
// Rooms: scenes/rooms/lighthouse.js (`lighthouse` cottage, `lighthouse_stair`, `lighthouse_stair2`, `lighthouse_watch`), lighthouse_top.js (`lighthouse_lantern`). Data: data/lighthouse.js.
// Art: art/showpiece/lighthouse.js, _lh_lib.js, _lh_icons.js. Mini-games: scenes/rooms/fishmarket_mini.js.
//
// City (once per city world, order 57): a door poi `door:lighthouse` (type door, room 'lighthouse', showpiece) at the keeper's cottage door + its interactable; at night (and in fog) two beams sweep from the top of the
//   real tower (canvas overlay in lighthouse_top.js, no world object). G.places id 'lighthouse'. Hours 08:00-23:00 daily (walk-out 23:15). The lamp is lit at dusk (LAMP[season]) and burns until 06:30.
// G.lighthouse = {
//   isOpen(), enter(), door(), lampOn(), lampTime() -> hour, light(quality?) -> Promise<bool> (help light the lamp: lantern room, half an hour either side of lampTime), beamColour(turn), towerTop(),
//   keeperAt() -> 'cottage' | 'watch' | 'lantern' | 'bed', talkKeeper(char, where), keeperName() -> your name once you are in the log, wound() 0..1, wind(quality?) -> Promise, shine() 0..1, polish(quality?) -> Promise,
//   lens() (menu), word() -> hoisted word | null, flags() (the flag window), hoist(word) -> reply text | null, ships() -> ships on the horizon now, shipLines(), scope(quality?) -> Promise<shipId | null>, shipBoard(),
//   shipLog() -> { id: day }, radio(), barometer(), baroK(), log() (read the keeper's log), logCount(), frame(k), bench(fx, scene), stove(), tea(scene, what?), charts(), shelf(), plaque(), pet(cat), weightInfo(), mastInfo(),
//   lookout(kind?) -> 'storm' | 'sunset' | 'stars' | 'view' | null, ladder(up), climbed(steps, up, idx), foghorn(), arrived(scene, prev),
//   chain() -> { st: 0 none | 1 see Halvorsen | 2 win a lot / find Brandt | 3 herring in hand | 4 mantle box in hand | 5 light the lamp with Silas | 6 done }, chainTalk(who, char, flag) -> handled, chainEvent(ev),
//   mini: { state(), act(), auto(q) }, stats() }
// State: G.state.lighthouse = { visits, tops, steps, lit, litDay, wound, shine, shineDay, word, wordDay, hoists, ships: { id: day }, shipsDone, wrecks: { k: 1 }, log: [{ day, text }], logDay, wxWorst, notes: [text], teas, polishes, winds,
//   watchDay: { storm, sunset, stars }, radioT, chain: { st } }
// Events: 'lighthouse:visit'(first), ':top'(n), ':steps'(n, total), ':lamp'(byPlayer), ':hoist'(word), ':ship'(id, n), ':polish'(q), ':wind'(q), ':watch'(kind), ':wreck'(k), ':chain'(st).
// Guide stamps: x:lh_visit, x:lh_top, x:lh_lamp, x:lh_flags, x:lh_ships.
// Tuning: data/lighthouse.js HOURS / LAMP / SUNSET / STEPS; lamp window +-0.5 h; wound drains 0.05 / h while lit (the keeper keeps it >= 0.5); shine fades 0.08 / day; WATCH_MIN 20; telescope needs score >= 0.5.
import { G } from '../core/game.js';
import { el, toast, bubble, say, choose, modal, pixCanvas } from '../ui/kit.js';
import { LR, LV, NAME, KEEPER, HOURS, LAMP, SUNSET, DAWN_OFF, STEPS, SHIPS, WORDS, WRECKS, LOG_LINES, shipsNow, shipsToday, beaufort, seaState, visib } from '../data/lighthouse.js';
import { LH_ICONS } from '../art/showpiece/_lh_icons.js';
import { flagAt } from '../art/showpiece/_lh_lib.js';
import { ICONS } from '../art/icons/icons.js';
import { CORE, CORE_BLURB, EXPERIENCES } from './_guide_data.js';
import { getCity } from '../world/_city.js';
import { enterRoom, exitRoom } from '../scenes/interior.js';
import { pixSprite } from '../engine/sprites.js';
import { PW } from '../engine/raster.js';
import { AU, unlock, note } from './_shows_audio.js';
import { MINI, sweepGame, tapGame } from '../scenes/rooms/fishmarket_mini.js';

export const order = 57;
for (const k in LH_ICONS) if (!ICONS[k]) ICONS[k] = LH_ICONS[k];
const DOOR = 'door:lighthouse', BLD = 'bld.harbor.lighthouse', GOAL = 'lh_lamp', WATCH_MIN = 20, O = 1;
CORE.lighthouse = ['sights', 'Lighthouse', 'tower', ['outdoors']];
CORE_BLURB.lighthouse = 'The striped light at the end of Gull Point, and you can climb it: the keeper\'s cottage, ninety-seven stone steps, a watch room with a radio, signal flags and a telescope, and at the top the great lens turning over the whole bay. The keeper lights the lamp at dusk and will let you help.';
for (const x of [
  { id: 'x:lh_visit', title: 'The Keeper\'s Door', group: 'Around town', glyph: 'tower', place: 'place:lighthouse', need: 'lighthouse', blurb: 'Walk out to Gull Point and knock at the cottage under the lighthouse.' },
  { id: 'x:lh_top', title: 'Ninety-Seven Steps', group: 'Big days out', glyph: 'tower', place: 'place:lighthouse', need: 'lighthouse', blurb: 'Climb Gull Point Lighthouse all the way to the gallery around the lantern.' },
  { id: 'x:lh_lamp', title: 'Light the Lamp', group: 'Big days out', glyph: 'tower', place: 'place:lighthouse', need: 'lighthouse', blurb: 'Be in the lantern room at dusk and help the keeper light the lamp.' },
  { id: 'x:lh_flags', title: 'Run It Up the Mast', group: 'Around town', glyph: 'tower', place: 'place:lighthouse', need: 'lighthouse', blurb: 'Spell a word in signal flags in the watch room and hoist it over the bay.' },
  { id: 'x:lh_ships', title: 'Ship Spotter', group: 'Big days out', glyph: 'tower', place: 'place:lighthouse', need: 'lighthouse', blurb: 'Log all eleven named ships through the watch-room telescope. They keep a timetable.' },
]) if (!EXPERIENCES.some(e => e.id === x.id)) EXPERIENCES.push(x);

let S = null, built = null, door = null, tower = null;
const st = () => { S = G.state.lighthouse || (G.state.lighthouse = {}); for (const [k, v] of [['ships', {}], ['wrecks', {}], ['log', []], ['notes', []], ['watchDay', {}], ['chain', { st: 0 }]]) if (!S[k]) S[k] = v; for (const k of ['visits', 'tops', 'steps', 'lit', 'hoists', 'teas', 'polishes', 'winds']) S[k] = S[k] || 0; for (const k of ['litDay', 'wordDay', 'logDay', 'shineDay']) if (S[k] === undefined) S[k] = -1; if (S.wound === undefined) S.wound = .7; if (S.shine === undefined) S.shine = .45; return S; };
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
const safe = fn => { try { return fn(); } catch (e) { return undefined; } };
const gstamp = id => safe(() => G.guide && G.guide.stamp && G.guide.stamp(id));
const pick = a => a[Math.floor(Math.random() * a.length)];
const add = (k, v) => safe(() => G.needs.add(k, v)), xp = (k, v) => safe(() => G.skills.addXp(k, v)), moodlet = (id, h) => safe(() => G.needs.addMoodlet(id, h));
const sfx = n => safe(() => G.audio && G.audio.sfx && G.audio.sfx(n));
const inH = (h, r) => h >= r[0] && h < r[1], clock = h => String(Math.floor(h) % 24).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60) % 60).padStart(2, '0');
const who = () => (G.state.player && G.state.player.name) || 'the new hand';
const inLH = sc => !!(sc && sc.def && sc.def.showpiece === 'lighthouse'), room = id => (G.scene && G.scene.roomId === id ? G.scene : null);
const isOpen = () => inH(G.now().hf, HOURS);
const wxKind = () => { const k = String(G.state.weather || 'clear'); return /storm/.test(k) ? 'storm' : /fog/.test(k) ? 'fog' : /snow/.test(k) ? 'snow' : /rain/.test(k) ? 'rain' : /cloud/.test(k) ? 'cloudy' : 'clear'; };
const note_ = t => { const S = st(); if (S.notes.length < 6 && !S.notes.includes(t)) S.notes.push(t); };
const resync = () => { const sc = G.scene; if (inLH(sc) && sc.lh) sc.lh.sync(); };

/* ---------- the lamp ---------- */
const lampTime = () => LAMP[G.now().season] || 18.5;
const lampOn = () => { const n = G.now(), S = st(); return n.hf >= lampTime() || n.hf < DAWN_OFF || (S.litDay === n.day && n.hf >= lampTime() - .55) || wxKind() === 'fog'; };
const festNight = () => G.now().dayOfMonth === 8;
const beamColour = t => (festNight() ? ['#ff9ad0', '#9ad0ff', '#a8ffb0', '#fff2a8'][Math.floor((t || 0) / (Math.PI / 2)) % 4] : '#fff2a8');
const keeperAt = () => { const h = G.now().hf, L = lampTime(); if (h < HOURS[0] || h >= 22.5) return 'bed'; if (h >= L - .6 && h < L + .9) return 'lantern'; if ((h >= 10 && h < 12) || (h >= 14 && h < 16)) return 'watch'; return 'cottage'; };
const keeperName = () => (st().chain.st >= 6 ? String(who()).toUpperCase() : null);
function towerTop() { if (!tower) { const w = safe(() => G.sceneCache.get('city').world); const ob = w && w.objs.find(o => o.id === BLD); if (!ob) return null; tower = { x: ob.B[0] + 2.5, y: ob.B[1] + 2.5, z: ob.z + .6 + ((ob.p && ob.p.h) || 8) + 1.1 }; } return tower; }
function foghorn() { safe(() => { unlock(); const c = AU.dead ? null : AU.ctx; if (c && c.state === 'running') { note('brass', 34, c.currentTime, 2.4, .8); note('brass', 41, c.currentTime + .05, 2.2, .4); } }); }
async function light(quality) {
  const sc = room(LR.lantern), n = G.now(), L = lampTime(), S = st(); if (!sc || G.busy) return false;
  if (lampOn() && !(S.litDay !== n.day && n.hf < L)) { toast('The lamp is lit and turning. Nothing to do but mind the beam.', 'info'); return false; }
  if (!inH(n.hf, [L - .5, L + .5])) { toast(`The lamp is lit at dusk: ${clock(L)} this season. Be here in the lantern from half an hour before and Silas will let you help.`, 'info', 4600); return false; }
  const q = quality !== undefined ? quality : await tapGame({ title: 'Lighting the lamp', text: 'Pump the vapour up to pressure', n: 14, secs: 8, label: 'Pump' }); if (q === null) return false;
  if (q < .5) { toast('"More pressure than that or she will only cough." Silas takes over the pump and nods at the matches. Next evening, then.', 'info', 4400); if (S.litDay !== n.day) { S.litDay = n.day; } resync(); G.emit('lighthouse:lamp', false); return false; }
  S.litDay = n.day; S.lit++; S.wound = Math.max(S.wound, .9); moodlet('lamp_lit'); add('fun', 14); xp('handiness', 10); gstamp('x:lh_lamp'); sfx('achievement'); note_(`Lamp lit ${clock(n.hf)} by ${who()}.`); G.emit('lighthouse:lamp', true); resync();
  await say([{ who: KEEPER, text: 'Pressure is up. Now the match. Steady... there.' }, { text: 'The mantle catches with a soft WHUMP and goes from blue to white. Silas drops the clutch, the clockwork ticks, and the great lens begins to turn. Two beams walk out over the water.' }, { who: KEEPER, text: `One hundred and thirty years, every night. Tonight it was ${who()}. I will put it in the log.` }]);
  if (S.chain.st === 5) chainDone(); return true;
}

/* ---------- city ---------- */
function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w; const ob = w.objs.find(o => o.id === BLD); if (!ob) return; tower = null;
  door = w.pois.find(p => p.id === DOOR);
  if (!door) { const B = ob.B; let sp = null; for (const out of [.5, 1, 1.5, 2]) { for (const off of [0, .5, -.5, 1, 1.5]) { const x = B[0] + 5 + off, y = B[4] + out; if (!w.isBlocked(x, y)) { sp = { x, y }; break; } } if (sp) break; }
    if (!sp) return; door = w.poi({ type: 'door', id: DOOR, room: LR.cottage, name: NAME, x: Math.round(sp.x * 2) / 2, y: Math.round(sp.y * 4) / 4, dir: 1, district: (w.districtAt && w.districtAt(sp.x, sp.y)) || 'harbor', showpiece: true }); }
}
function wire(s) { ensure(s.world); if (!door) return; if (!s.interactables.some(it => it.poi === door)) s.interactables.push({ x: door.x, y: door.y, label: NAME, h: 1.2, range: 1.3, poi: door, use: () => enter() }); }
function enter() { if (!isOpen()) { toast(`${NAME}: the cottage door is shut. Visitors ${clock(HOURS[0])} to ${clock(HOURS[1])}. ${lampOn() ? 'High above you the beam goes round.' : ''}`, 'info', 4200); return false; } enterRoom(LR.cottage, DOOR); return true; }
function arrived(sc, prev) {
  const S = st(), n = G.now(); seedLog();
  if (sc.roomId === LR.cottage && !inLH(prev)) { const first = !S.visits; S.visits++; safe(() => G.places.discover(LV.place, true)); G.emit('lighthouse:visit', first); gstamp('x:lh_visit'); if (first) toast('A kettle ticking on the stove, charts on the table, and somewhere above you ninety-seven steps of cold stone. A cat opens one eye.', 'good', 5600); else if (keeperAt() === 'lantern') toast('A note on the table: "Gone up to light her. Kettle is hot. S.M."', 'info', 4200); }
  if (sc.roomId === LR.lantern && !(prev && prev.roomId === LR.lantern)) { S.tops++; moodlet('top_of_the_light'); gstamp('x:lh_top'); G.emit('lighthouse:top', S.tops); const wx = wxKind();
    toast(S.tops === 1 ? 'The top. Wind, gulls, and Maple Bay laid out like a map: the Bay Wheel, the cranes, the towers downtown, and on the other side nothing but sea.' : wx === 'storm' ? 'The gale hits you at the hatch. Hold the rail.' : wx === 'fog' ? 'Nothing but white, and the horn.' : 'The gallery. It never gets old.', 'good', 5200); }
}
function climbed(n, up, idx) { const S = st(); S.steps += n; xp('fitness', up ? 4 : 1); if (up) add('energy', -2); G.emit('lighthouse:steps', n, S.steps); if (up && idx === 0) toast(`Forty-four. ${STEPS.total - STEPS.stair1} to go. There is a bench on the next landing.`, 'info', 3200); }
async function ladder(up) { if (G.busy) return; st().steps += STEPS.ladder; sfx('step_in'); if (up) { await G.go('int:' + LR.lantern); } else await G.go('int:' + LR.watch, { x: O + 1.6, y: O + 6.2 }); }

/* ---------- the keeper's log, barometer, radio ---------- */
function seedLog() { const S = st(), d = G.now().day; if (!S.log.length) { S.log.push({ day: d - 3, text: 'Fair. Glass steady. Petrel on time, for once.' }, { day: d - 2, text: 'Wind backing south-west. Trimmed the mantle. Wickie caught nothing, again.' }, { day: d - 1, text: 'Lamp lit at dusk, out at half past six. All vessels accounted for.' }); S.logDay = d; } }
function closeDay(d) { const S = st(); if (!S.log.length) return; const k = S.wxWorst || 'clear', L = LOG_LINES[k] || LOG_LINES.clear, text = L[d % L.length] + (S.notes.length ? ' ' + S.notes.join(' ') : S.litDay === d ? '' : ' Lamp lit at dusk, out at half past six.'); S.log.push({ day: d, text }); while (S.log.length > 30) S.log.shift(); S.notes = []; S.wxWorst = null; S.logDay = d + 1; }
const RANK = { clear: 0, cloudy: 1, fog: 2, rain: 3, snow: 3, storm: 5 };
function log() { seedLog(); const S = st(), dn = d => safe(() => { const n = Object.assign({}, G.now()); return 'Day ' + (d + 1); }) || 'Day ' + (d + 1); const rows = S.log.slice(-5).map(e => ({ who: `The log · ${dn(e.day)}`, text: e.text })); xp('logic', 2); return say(rows.concat([{ who: 'The log · today', text: (S.notes.length ? S.notes.join(' ') + ' ' : '') + 'The page is still open, the pen across it.' }])); }
const logCount = () => st().log.length + st().notes.length;
function ahead(hours = 6) { const f = safe(() => G.weather.forecast(0)) || [], f2 = safe(() => G.weather.forecast(1)) || [], h = Math.floor(G.now().hf), out = []; for (let i = 1; i <= hours; i++) { const e = h + i < 24 ? f[h + i] : f2[h + i - 24]; if (e) out.push(e.kind); } return out.map(k => (/storm/.test(k) ? 'storm' : /fog/.test(k) ? 'fog' : /snow/.test(k) ? 'snow' : /rain/.test(k) ? 'rain' : /cloud/.test(k) ? 'cloudy' : 'clear')); }
const worst = l => l.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), 'clear');
const baroK = () => ({ storm: .05, rain: .28, snow: .3, fog: .45, cloudy: .62, clear: .9 }[worst(ahead(6).concat([wxKind()]))] || .6);
function barometer() { const now = wxKind(), w = worst(ahead(6)), k = baroK(), mb = Math.round(980 + k * 45); sfx('click'); toast(`You tap the glass. ${mb} millibars${RANK[w] > RANK[now] ? ' and FALLING' : RANK[w] < RANK[now] ? ' and rising' : ', steady'}: ${w === 'storm' ? 'a gale inside six hours. The fleet should be told' : w === 'rain' ? 'rain on the way' : w === 'fog' ? 'fog likely. The horn will sound' : w === 'snow' ? 'snow coming' : w === 'cloudy' ? 'cloud, nothing worse' : 'set fair'}.`, 'info', 4600); }
function radio() {
  const n = G.now(), now = wxKind(), nx = worst(ahead(8)), sum = safe(() => G.weather.daySummary(1)), tk = sum && sum.kind ? String(sum.kind) : 'clear', S = st(); add('fun', 3); if (S.radioT === undefined || G.state.t - S.radioT > 120) { S.radioT = G.state.t; xp('logic', 3); }
  return say([{ who: 'The radio', text: `...kssh... and now the shipping bulletin for Maple Bay waters, issued at ${String(Math.floor(n.hf)).padStart(2, '0')}00.` }, { who: 'The radio', text: `Gull Point: ${beaufort(now)}. Sea ${seaState(now)}. Visibility ${visib(now)}.` }, { who: 'The radio', text: `Outlook, next eight hours: ${nx === now ? 'little change' : beaufort(nx) + ', ' + (nx === 'storm' ? 'all small craft return to harbour' : nx === 'fog' ? 'fog banks, sound signals' : nx === 'rain' ? 'rain at times' : nx === 'snow' ? 'snow showers' : 'becoming fair')}. Tomorrow: ${/storm/.test(tk) ? 'gales' : /rain/.test(tk) ? 'rain' : /fog/.test(tk) ? 'fog patches' : /snow/.test(tk) ? 'snow' : /cloud/.test(tk) ? 'cloudy' : 'fair'}.` },
    { who: 'The radio', text: pick(['Bay Wheel, Bay Wheel, this is harbour control: your lights are confusing the ferry again. ...kssh...', 'Notice to mariners: a quantity of pianos, adrift since 1926, is no longer considered a hazard. ...kssh...', 'Fishing vessel Margo reports good cod on the north ground and asks who has her thermos. ...kssh...', 'And finally: the keeper at Gull Point is reminded that "cat" is not a rank. Bulletin ends. ...kssh...']) }]);
}

/* ---------- signal flags ---------- */
const word = () => { const S = st(); return S.word && S.wordDay === G.now().day ? S.word : null; };
function hoist(w) {
  w = String(w || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6); const S = st(); if (!w) { S.word = null; resync(); return null; } S.word = w; S.wordDay = G.now().day; S.hoists++; gstamp('x:lh_flags'); add('fun', 6); xp('logic', 4); sfx('whoosh'); G.emit('lighthouse:hoist', w); resync(); note_(`Hoisted "${w}".`);
  const mine = String(who()).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6), reply = WORDS[w] || (w === mine ? 'Your own name, flying over the bay. The Petrel dips her ensign to it.' : `Six flags snap in the wind: ${w.split('').join(' - ')}. Out on the water somebody reaches for a code book.`); toast(reply, 'good', 5600); return reply;
}
const flagCanvas = L => pixCanvas(pixSprite('lhflag' + L, [-6, -5, 6, 5], () => { const q = PW(0, 0, 0); flagAt(L, Math.round(q[0]) - 4, Math.round(q[1]) - 3, 9, 7); }).c, 3);
function flags() {
  let cur = word() || ''; const m = modal({ title: 'The signal flag locker', cls: 'lh-flags' }), disp = el('div', { style: 'display:flex;gap:4px;min-height:36px;justify-content:center;margin:4px 0 8px' }), cap = el('p', { style: 'margin:2px 6px 6px;text-align:center;line-height:1.3', text: 'One flag for every letter. Spell a word of up to six and run it up the mast.' });
  const show = () => { disp.textContent = ''; for (const ch of cur) disp.append(safe(() => flagCanvas(ch)) || el('b', { text: ch })); if (!cur) disp.append(el('span', { text: '(no flags bent on)', style: 'opacity:.7' })); };
  const grid = el('div', { style: 'display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin:0 4px 8px' });
  for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') grid.append(el('button', { style: 'padding:3px 2px;border:2px solid #2a2733;background:#f4ecd8;font:inherit;font-size:11px;cursor:pointer', onclick: () => { if (cur.length < 6) { cur += L; show(); } } }, safe(() => flagCanvas(L)), el('div', { text: L })));
  m.body.append(cap, disp, grid, el('button.opt', { onclick: () => { cur = cur.slice(0, -1); show(); } }, el('span.opt-l', { text: 'Take the last flag off' })), el('button.opt', { onclick: () => { m.close(); if (cur) hoist(cur); else { hoist(''); toast('You haul the halyard down bare.', 'info'); } } }, el('span.opt-l', { text: 'Hoist!' }))); show(); return m;
}
const mastInfo = () => toast(word() ? `The hoist reads ${word().split('').join(' - ')}. It will fly until midnight.` : 'The signal mast. Flags are bent on in the watch room below and run up here on the halyard.', 'info', 3800);

/* ---------- ships ---------- */
const ships = () => shipsNow(G.now(), wxKind());
const tStr = s => clock(s.from).replace(':00', '');
function shipLines() { const n = G.now(), L = shipsToday(n, wxKind()), up = L.filter(s => s.every || s.to > n.hf); return (up.length ? up : L).slice(0, 5).map(s => (s.name.match(/"([^"]+)"/) || [0, 'Pilot 3'])[1].toUpperCase().slice(0, 7).trim() + ' ' + tStr(s)); }
function shipBoard() { const n = G.now(), S = st(), L = shipsToday(n, wxKind()); return say([{ who: 'Ships today', text: L.map(s => `${S.ships[s.id] !== undefined ? '[logged] ' : ''}${s.name}, ${s.every ? 'every two hours from ' + clock(s.from) : clock(s.from) + ' to ' + clock(s.to)}`).join(' · ') }, { who: 'Ships today', text: `${Object.keys(S.ships).length} of ${SHIPS.length} in your log. Some only sail on certain days, or in fair weather. Use the telescope while one is on the horizon.` }]); }
async function scope(quality) {
  if (G.busy) return null; const L = ships(), S = st(), n = G.now(); if (wxKind() === 'fog') { toast('The telescope shows you the inside of a cloud.', 'info'); return null; }
  if (!L.length) { const nx = shipsToday(n, wxKind()).filter(s => !s.every && s.from > n.hf).sort((a, b) => a.from - b.from)[0]; toast(`You sweep the horizon: gulls, a buoy, the long empty line. ${nx ? `The board says the ${nx.name} is due at ${clock(nx.from)}.` : 'The ferry Petrel passes on every even hour.'}`, 'info', 4600); add('fun', 2); return null; }
  const s = L.find(q => S.ships[q.id] === undefined) || L[0], spy = safe(() => G.inv.count('lh_spyglass')) > 0;
  const q = quality !== undefined ? quality : await sweepGame({ title: 'The telescope', text: 'Hold her in the glass', rounds: 3, speed: .95, zone: spy ? .3 : .22, label: 'Steady' }); if (q === null) return null;
  if (q < .5) { toast('Something with a funnel slides out of the circle before you can read the name. Try again while she is still on the horizon.', 'info', 4200); return null; }
  const isNew = S.ships[s.id] === undefined; S.ships[s.id] = n.day; const c = Object.keys(S.ships).length; add('fun', isNew ? 9 : 3); xp('logic', isNew ? 8 : 2); G.emit('lighthouse:ship', s.id, c); note_(`${(s.name.match(/"([^"]+)"/) || [0, s.name])[1]} sighted ${clock(n.hf)}.`); resync();
  toast(`${s.name}. ${s.note} ${isNew ? `Logged: ${c} of ${SHIPS.length}.` : 'Already in your log.'}`, 'good', 6200);
  if (c >= SHIPS.length && !S.shipsDone) { S.shipsDone = n.day; gstamp('x:lh_ships'); safe(() => G.money.add(50, 'Ship spotter: the harbour master\'s thanks')); safe(() => G.inv.add('lh_bell', 1)); toast('That is all eleven. Silas shakes your hand, the harbour master sends $50 and a brass ship\'s bell, and your list goes up beside the telescope.', 'good', 8000); }
  return s.id;
}

/* ---------- lens, clockwork ---------- */
const wound = () => st().wound, shine = () => st().shine;
async function wind(quality) { if (G.busy) return null; const S = st(); if (S.wound > .92) { toast('The weight is at the top of the tower. She is wound for the night.', 'info'); return null; } const q = quality !== undefined ? quality : await tapGame({ title: 'Winding the clockwork', text: 'Crank the weight up the tower', n: 18, secs: 9, label: 'Crank' }); if (q === null) return null;
  S.wound = Math.min(1, S.wound + .15 + q * .7); S.winds++; xp('fitness', 5 + Math.round(q * 6)); add('energy', -3); G.advance(6); sfx('clank'); const sc = room(LR.watch); if (sc && sc.lh && sc.lh.spin) sc.lh.spin(3); note_('Clock wound by a visitor.'); G.emit('lighthouse:wind', q); resync();
  toast(q >= .9 ? 'Click, click, click: eighty kilos of iron climb the middle of the tower and the governor settles to a purr. Wound for the night.' : `The weight is ${Math.round(S.wound * 100)} percent of the way up the tower. You can see it from the stair. Your arm can feel it.`, 'good', 4600); return q; }
async function polish(quality) { if (G.busy) return null; const S = st(), own = safe(() => G.inv.count('lh_brasso')) > 0; const q = quality !== undefined ? quality : await sweepGame({ title: 'Polishing the lens', text: 'Wipe each prism in one clean stroke', rounds: 5, speed: 1.05, zone: own ? .28 : .22, label: 'Wipe' }); if (q === null) return null;
  S.shine = Math.max(S.shine, Math.min(1, q + (own ? .15 : 0))); S.shineDay = G.now().day; S.polishes++; xp('handiness', 8 + Math.round(q * 10)); add('fun', 4); G.advance(20); if (q >= .7) moodlet('brass_shine'); note_('Lens polished by a visitor.'); G.emit('lighthouse:polish', q); resync();
  toast(q >= .85 ? 'Every prism throws a little rainbow on the lantern wall. Silas looks at it for a long time and says "Hm." From Silas, that is a medal.' : q >= .5 ? 'Brighter. A few smears where the cloth skipped, but the beam will carry further tonight.' : 'You have mostly moved the salt around. Still: it is the thought, and the elbow.', q >= .5 ? 'good' : 'info', 5200); return q; }
async function lens() {
  const n = G.now(), L = lampTime(), can = inH(n.hf, [L - .5, L + .5]) && !lampOn(); const v = await choose('The great lens', [{ label: 'Polish it', sub: `Shine ${Math.round(shine() * 100)} percent · 20 minutes`, value: 'p' }, { label: 'Light the lamp', sub: can ? 'Silas hands you the matches' : lampOn() ? 'Burning' : `At dusk: ${clock(L)}`, value: 'l', disabled: !can }, { label: 'Just look', value: 'x' }], { text: 'Two metres of brass and hand-ground glass, floating on a bath of mercury. A candle\'s worth of flame, thrown twenty miles.' });
  if (v === 'p') return polish(); if (v === 'l') return light(); if (v === 'x') { add('fun', 3); toast(lampOn() ? 'Do not look INTO it. Look past it: your own shadow is crossing the bay.' : 'Four bullseyes, each one a stack of prisms. Your face goes by upside down in all of them.', 'info', 4200); }
}
const weightInfo = () => toast(`The clock weight: eighty kilos of iron on a chain, falling the height of the tower to turn the lens. It is ${Math.round(wound() * 100)} percent wound. The crank is in the watch room.`, 'info', 4600);

/* ---------- the gallery ---------- */
function lookout(kind) {
  if (G.busy) return null; const n = G.now(), wx = wxKind(), S = st(), d = n.day, ss = SUNSET[n.season] || SUNSET[0], night = n.hf >= ss[1] + .4 || n.hf < 5;
  const k = kind || (wx === 'storm' ? 'storm' : inH(n.hf, ss) && wx !== 'fog' ? 'sunset' : night && (wx === 'clear' || wx === 'cloudy') ? 'stars' : 'view');
  G.startActivity({ label: k === 'storm' ? 'Storm watch' : k === 'sunset' ? 'Watching the sun go down' : k === 'stars' ? 'Stargazing from the gallery' : 'Looking out over the bay', anim: 'stand', minutes: k === 'view' ? 8 : WATCH_MIN, rate: 3, done: () => {
    G.emit('lighthouse:watch', k); const firstToday = S.watchDay[k] !== d; S.watchDay[k] = d;
    if (k === 'storm') { if (firstToday) moodlet('storm_watch'); add('fun', 12); note_('Stood storm watch with a visitor.'); toast('The gale leans on the lantern glass and the whole tower hums. Below, the sea is white to the horizon; behind you the beam goes round, steady as a heartbeat.', 'good', 6000); }
    else if (k === 'sunset') { if (firstToday) moodlet('bay_sunset'); add('fun', 12); toast('The sun goes into the sea beyond the islands. The city turns gold, then pink, then to lights, one window at a time.', 'good', 5600); }
    else if (k === 'stars') { add('fun', 9); xp('logic', 6); const cs = safe(() => G.observatory.constellations()) || [], c = cs.length ? cs[(d + Math.floor(n.hf)) % cs.length] : null; toast(`No street lamps out here: the stars come right down to the water. ${c && c.name ? `You pick out ${c.name}${c.got ? ', the one you traced at the Observatory' : '. The Observatory on Hillcrest has a chart of it'}.` : 'The beam goes round underneath them.'}`, 'good', 5600); }
    else { add('fun', 6); const L = ships(); toast(L.length ? `Wind in your ears and the whole bay below. Out on the water: ${L.map(s => s.name).join(', ')}.` : 'Wind in your ears and the whole bay below: the Bay Wheel, the cranes, the towers, the long white line of the beach.', 'good', 5200); }
  } }); return k;
}

/* ---------- the cottage ---------- */
function stove() { add('fun', 2); if (G.now().season === 3 || /rain|storm|snow/.test(wxKind())) add('energy', 3); toast('You warm your hands at the range. The kettle has been about to boil since 1954.', 'info', 3400); }
async function tea(sc, what) {
  if (G.busy) return false; const free = !!(G.state.flags && G.state.flags.lh_keeper), v = what || await choose("The keeper's table", [{ label: "A mug of keeper's tea", sub: free ? 'Free for the assistant keeper' : fmt(1) + ' in the tin', value: 'lh_mug' }, { label: "A bowl of the keeper's fish stew", sub: fmt(4) + ' in the tin', value: 'lh_stew' }, { label: 'Nothing, thanks', value: null }], { text: 'A teapot under a knitted cosy, and a pan of something red and fishy keeping warm on the range.' }); if (!v) return false;
  const it = safe(() => G.inv.item(v)); if (!it) return false; const p = v === 'lh_mug' && free ? 0 : it.price; if (p && G.money && !G.money.pay(p, it.name, { category: 'dish', venue: LV.shelf })) return false; st().teas++;
  let seat = null; if (sc) for (const f of sc.byTag('seating')) for (const s of f.seats || []) if (!seat) seat = s; const fin = () => { safe(() => G.inv.applyEffects(it.effects)); G.emit('inv:use', v); };
  G.startActivity({ label: it.name, anim: v === 'lh_mug' ? 'drink' : 'eat', minutes: it.eatMinutes, rate: 2.5, at: seat ? { x: seat.x, y: seat.y, z: seat.z, dir: seat.dir } : undefined, done: () => { G.player.poseOpts = null; fin(); toast(`${it.name}: ${safe(() => G.inv.effectText(it)) || 'just the thing'}.`, 'good', 3000); }, cancel: () => { G.player.poseOpts = null; fin(); } }); if (seat) G.player.poseOpts = { seated: true }; return true;
}
function charts() { xp('logic', 3); toast(pick(['The chart of Maple Bay: soundings in fathoms, Gull Rock marked with a cross, and in pencil beside it: "Calliope, 1871. Cork still washes up."', 'Silas has drawn a small fish on the north ground and written "MARGO, most mornings".', 'A brass pair of dividers walks from the harbour mouth to the light: exactly one sea mile.']), 'info', 4800); }
const shelf = () => safe(() => G.shop.open(LV.shelf));
const plaque = () => toast(`KEEPERS OF THE LIGHT. A. Tidy 1872 · R. Tidy 1891 · E. Marrow 1949 · S. Marrow 1977 · and, freshly engraved, ${String(who()).toUpperCase()}, Assistant Keeper.`, 'good', 5600);
function pet(cat) { add('fun', 4); sfx('meow'); toast(pick(['Wickie accepts one stroke, then looks pointedly at the stove.', 'Wickie purrs like the clockwork upstairs.', 'Wickie has never caught a fish. Wickie has never needed to.']), 'good', 3400); }
function frame(k) { const w = WRECKS[k] || WRECKS[0], S = st(), isNew = !S.wrecks[k]; S.wrecks[k] = 1; G.emit('lighthouse:wreck', k); return say([{ who: `${w.name}, ${w.year}`, text: w.text }]).then(() => { if (isNew) { xp('logic', 4); if (Object.keys(S.wrecks).length >= WRECKS.length) { moodlet('inspired'); toast('You have read all five wrecks of Gull Point. The stair feels less empty for it.', 'good', 4200); } } }); }
function bench(fx, sc) { if (G.busy) return; const s = fx && fx.seats && fx.seats[0]; G.startActivity({ label: 'Catching your breath', anim: 'sit', minutes: 6, rate: 3, at: s ? { x: s.x, y: s.y, z: s.z, dir: 1 } : undefined, done: () => { add('energy', 6); toast('Halfway. Through the window the beach is already a long way down.', 'info', 3400); } }); }

/* ---------- Silas, and the opportunity: The Keeper's Last Mantle ---------- */
const goalText = () => ['', 'Ask Old Halvorsen at the Bay Fish Hall smokery about the mantle box', 'Win a lot at the dawn auction (05:30), or find Captain Brandt at Quay 1', 'Take the barrel of herring to Old Halvorsen', 'Bring the mantle box to Silas at the lighthouse', 'Be in the lantern at dusk and light the lamp with Silas'][st().chain.st] || '';
function setGoal() { const c = st().chain; if (!G.goals) return; if (c.st >= 1 && c.st <= 5) { const g = safe(() => G.goals.get(GOAL)); if (g) { g.text = goalText(); g.placeId = c.st <= 3 ? 'fishmarket' : 'lighthouse'; G.emit('goals:change'); } else safe(() => G.goals.add({ id: GOAL, text: goalText(), group: 'opportunity', placeId: c.st <= 3 ? 'fishmarket' : 'lighthouse', hint: 'Silas Marrow\'s last box of lamp mantles was lent to the smokery in the Bay Fish Hall in 1994. Old Halvorsen will give it back for the barrel of herring Captain Brandt owes him: she only lands at the dawn auction (05:30 to 07:30), and she only deals with people who have stopped the auction clock. Then take the box up to Silas and be in the lantern at dusk.' })); } else if (c.st >= 6) safe(() => { if (G.goals.get(GOAL) && !G.goals.isDone(GOAL)) G.goals.complete(GOAL); }); }
const setSt = n => { st().chain.st = n; setGoal(); G.emit('lighthouse:chain', n); resync(); };
function chainDone() { const S = st(); setSt(6); G.state.flags.lh_keeper = true; safe(() => G.money.add(80, 'From the Gull Point Light Trust')); safe(() => G.inv.add('lh_badge', 1)); note_(`${who()} entered as Assistant Keeper.`); safe(() => { const sc = G.sceneCache.get('int:fishmarket'); if (sc && sc.fm) sc.fm.sync(); });
  toast(`Assistant Keeper of Gull Point. Your name is engraved on the brass plate in the cottage, Old Halvorsen flies your pennant over the smokery, tea is free for life, and on festival nights (the 8th) the beam turns in colour. $80 from the Light Trust and a brass badge.`, 'good', 10000); }
function chainTalk(whoIs, c, flag) {
  const S = st(), ch = S.chain, K = KEEPER, H = 'Old Halvorsen';
  if (whoIs === 'halvorsen') {
    if (ch.st === 1) { say([{ who: H, text: 'Silas wants his mantle box. Ha! Thirty years it has sat on my kippers. Best weight I ever had.' }, { who: H, text: 'He can have it. But Ilse Brandt of the Margo owes me a barrel of her oak-barrel herring, since the winter of the big freeze, and I am not getting younger.' }, { who: H, text: 'She lands at the dawn auction, half past five, Quay 1, and she will not give the time of day to anyone who has not stopped the clock. Win a lot. Then she will know you.' }]).then(() => setSt(2)); return true; }
    if (ch.st === 2) { if (c) bubble(c, 'Half past five, Quay 1. Stop the clock, then find Ilse. I will keep the box warm.', 4200); return true; }
    if (ch.st === 3) { say([{ who: H, text: 'Is that...? Oak-barrel herring. Smell that. SMELL that. Thirty years.' }, { who: H, text: 'A bargain is a bargain. Here: Gull Point Light, spare mantles, one box. Slightly kippered. Tell Silas the smell comes free.' }]).then(() => { safe(() => G.inv.remove('lh_herring', 1)); safe(() => G.inv.add('lh_mantle', 1)); setSt(4); toast('You have the Lamp Mantle Box. It smells magnificently of smoke. Take it out to Gull Point.', 'good', 5200); }); return true; }
    return false;
  }
  if (whoIs === 'brandt') {
    if (ch.st !== 2) return false; const won = safe(() => Object.values(G.state.fishmarket.sold).some(q => q.who === 'you') && G.state.fishmarket.lotDay === G.now().day);
    if (!flag) { toast('Quay 1 is empty water. The Margo lands for the dawn auction, half past five, when the weather lets her.', 'info', 4200); return true; }
    if (!won) { say([{ who: 'Captain Ilse Brandt', text: 'Halvorsen\'s herring? I have had that barrel aboard for a month. But I do not hand my fish to strangers. Stop the clock on a lot this morning and we will talk.' }]); return true; }
    brandtGives(); return true;
  }
  if (whoIs === 'silas') {
    if (ch.st === 0) { say([{ who: K, text: 'You have come up for the view. They all do. Stay for the tea.' }, { who: K, text: 'I will tell you a thing. I retire at the end of the year, and the lamp is on her last mantle. The spare box went to Halvorsen\'s smokery in ninety-four, "for a week". Proud man. So am I. We have not discussed it since.' }, { who: K, text: 'If the box came home, I could hand this light on properly. To someone who had earned it.' }])
      .then(() => choose('Fetch the mantle box from the smokery?', [{ label: 'I will ask Halvorsen', value: 1 }, { label: 'Not just now', value: 0 }])).then(v => { if (v === 1) { setSt(1); toast('New opportunity: The Keeper\'s Last Mantle. Old Halvorsen keeps the smokery in the Bay Fish Hall on the boardwalk.', 'good', 5600); } }); return true; }
    if (ch.st === 4) { say([{ who: K, text: 'That is it. That is the very tin. ...It smells of kippers.' }, { who: K, text: 'Thirty years of Halvorsen, in a box. Well. He kept it dry, I will give him that.' }, { who: K, text: `Come up to the lantern at dusk, ${clock(lampTime())} this season. A new mantle wants lighting, and I think you should be the one holding the match.` }]).then(() => { safe(() => G.inv.remove('lh_mantle', 1)); setSt(5); }); return true; }
    if (ch.st === 5 && flag === 'lantern') { light(); return true; }
    return false;
  }
  return false;
}
function brandtGives() { say([{ who: 'Captain Ilse Brandt', text: 'I saw that. You held your nerve to the last second. Marlowe went purple.' }, { who: 'Captain Ilse Brandt', text: 'Here: one barrel, oak-barrel herring, for that old smoke-goblin. And take this: my grandfather\'s auction tally. Number forty-one. It has been lucky for three generations.' }]).then(() => { safe(() => G.inv.add('lh_herring', 1)); safe(() => G.inv.add('fm_tally', 1)); setSt(3); toast('You have the barrel of herring (and a brass auction tally). Old Halvorsen is at the smokery, a few stalls down.', 'good', 5200); }); }
function chainEvent(ev) { const ch = st().chain; if (ev === 'won' && ch.st === 2) { const n = G.now().hf; if (n >= 4.8 && n < 9.5) setTimeout(brandtGives, 1200); } }
function talkKeeper(c, where) {
  if (G.busy) return; if (chainTalk('silas', c, where)) return; const n = G.now(), L = lampTime(), S = st();
  if (where === 'lantern') { if (!lampOn() && inH(n.hf, [L - .5, L + .5])) { choose(KEEPER, [{ label: 'Help light the lamp', value: 1 }, { label: 'Just watch', value: 0 }], { text: '"Dusk. You can hold the match, if your hands are steady."' }).then(v => { if (v) light(); }); return; } bubble(c, lampOn() ? pick(['Twenty miles, on a clear night. Twenty-two if the lens is clean.', 'Mind the beam. It will not hurt you, but you will see green for an hour.', 'There goes the Halcyon. Always the last.']) : pick(['Not long now. I light her when the first star shows.', 'Check the mantle, check the pressure, check the cat is not in the lantern.']), 4200); return; }
  if (where === 'watch') { bubble(c, pick(['The Petrel, every even hour. You could set the clock by her, if the clock were not already right.', 'Run a word up the mast if you like. Keep it clean; the harbour master reads everything.', 'Wind her before dusk and she turns all night. Forget, and I am up those stairs at three.', 'The glass downstairs is falling. Listen to the bulletin.']), 4200); add('social', 1); return; }
  bubble(c, pick(['Ninety-seven steps. I have counted them forty thousand times. They do not get fewer.', 'Tea is in the pot. A coin in the tin, if you have one.', 'Tap the barometer. Everyone does. It likes the attention.', S.chain.st >= 6 ? `The plate looks well with your name on it, ${who()}.` : 'Read the log, if you want to know how a quiet life sounds.', keeperAt() === 'cottage' && n.hf > L - 1.5 && n.hf < L ? `I go up at ${clock(L - .5)}. Come along.` : 'My mother kept this light. Talked a yacht in by radio, in fifty-four.']), 4400); add('social', 1);
}

function patchGuide() {
  const e = safe(() => G.guide.get('place:lighthouse')); if (!e) return;
  e.blurb = CORE_BLURB.lighthouse; e.type = 'Lighthouse'; e.chapter = 'sights'; e.also = ['outdoors']; e.price = 'Free · tea $1';
  const T = ['lighthouse', 'view', 'climb', 'sunset', 'stargazing', 'storm', 'ships', 'flags', 'harbor', 'landmark']; e.tags = (e.tags || []).filter(t => !T.includes(t)).concat(T);
  e.tryThis = ['Climb the ninety-seven steps to the gallery', `Help Silas light the lamp at dusk (${clock(lampTime())} this season)`, 'Spell a word in signal flags and hoist it', 'Log all eleven named ships in the telescope', 'Wind the clockwork and watch the weight climb the tower', 'Polish the lens', 'Listen to the shipping bulletin', 'Read the shipwreck pictures on the stair', 'Storm watch, sunset or stargazing from the gallery', 'Tea and fish stew at the keeper\'s table', 'Bring home the keeper\'s last box of mantles'];
  e.when = `Lamp lit daily at ${clock(lampTime())}`;
}

export function init() {
  S = G.defineState('lighthouse', () => ({ visits: 0, tops: 0, steps: 0, lit: 0, litDay: -1, wound: .7, shine: .45, shineDay: -1, word: null, wordDay: -1, hoists: 0, ships: {}, shipsDone: 0, wrecks: {}, log: [], logDay: -1, wxWorst: null, notes: [], teas: 0, polishes: 0, winds: 0, watchDay: {}, chain: { st: 0 } }));
  G.on('load', () => { st(); setGoal(); });
  G.lighthouse = { isOpen, enter, door: () => door, lampOn, lampTime, light, beamColour, towerTop, keeperAt, talkKeeper, keeperName, wound, wind, shine, polish, lens, word, flags, hoist, ships, shipLines, scope, shipBoard, shipLog: () => Object.assign({}, st().ships), radio, barometer, baroK, log, logCount,
    frame, bench, stove, tea, charts, shelf, plaque, pet, weightInfo, mastInfo, lookout, ladder, climbed, foghorn, arrived, chain: () => st().chain, chainTalk, chainEvent,
    mini: { state: () => (MINI.cur ? MINI.cur.state() : null), act: () => MINI.cur && MINI.cur.act(), auto: q => MINI.cur && MINI.cur.auto(q) },
    stats: () => { const S = st(); return { visits: S.visits, tops: S.tops, steps: S.steps, lit: S.lit, hoists: S.hoists, ships: Object.keys(S.ships).length, of: SHIPS.length, wrecks: Object.keys(S.wrecks).length, wound: S.wound, shine: S.shine, chain: S.chain.st, log: S.log.length }; } };
  G.on('room:build', sc => { if (inLH(sc) && !built) safe(() => ensure(getCity())); });
  G.on('scene', s => { if (s && s.id === 'city' && !s._lighthouse && s.world) { s._lighthouse = true; try { wire(s); } catch (e) { console.warn('lighthouse', e); } setGoal(); } });
  G.on('guide:rebuilt', patchGuide);
  G.on('day', d => { const S = st(); safe(() => closeDay(d - 1)); if (S.shine > .15) S.shine = Math.max(.15, S.shine - .08); });
  G.on('hour', () => { const S = st(), k = wxKind(); if (!S.wxWorst || RANK[k] > RANK[S.wxWorst]) S.wxWorst = k; if (lampOn()) S.wound = Math.max(0, S.wound - .05); const h = G.now().hf; if (S.wound < .5 && (Math.abs(h - lampTime()) < 1 || h < DAWN_OFF)) S.wound = .75; });
  G.on('minutes', () => { const sc = G.scene; if (!inLH(sc) || G.busy || G.modal || G.cutscene) return; const h = G.now().hf; if (h >= HOURS[1] + .25 || h < HOURS[0] - .25) { if (sc._closing) return; sc._closing = true; toast('"Time, I am afraid. The light and I have work to do." Silas sees you down the stair and out into the dark.', 'info', 4600); exitRoom({ poi: DOOR }).then(() => { sc._closing = false; }, () => { sc._closing = false; }); } });
  if (typeof window !== 'undefined') window.addEventListener('pointerdown', () => { if (inLH(G.scene)) safe(() => unlock()); }, { passive: true });
}
