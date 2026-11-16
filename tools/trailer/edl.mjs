// Edit decision lists of both trailers: which recorded clip plays when (on the music's beat grid) + the motion-graphics items (overlay.mjs).
// Music: 104 bpm, the first downbeat at T0 = 0.1 s; beat .5769 s, bar 2.3077 s; 18 bars, the final chord at bar 19 = 41.64 s; 45.0 s in all.
import fs from 'node:fs'; import path from 'node:path'; import { SCRATCH } from './lib.mjs';
export const BEAT = 60 / 104, BAR = BEAT * 4, T0 = 0.1, LEN = 45;
export const bar = (n, beats = 0) => n <= 1 && !beats ? 0 : T0 + (n - 1) * BAR + beats * BEAT;   // bar 1 starts the film at 0
const meta = id => { try { return JSON.parse(fs.readFileSync(path.join(SCRATCH, 'meta', id + '.json'), 'utf8')); } catch (e) { return {}; } };
export const N = 190;          // street doors in the Stage 99 build (see docs/trailer/REPORT.md "The building count")
const END = bar(19);

/* ---------------- A: The City Wakes Up ---------------- */
const td = (meta('a08_plane').touchdown || 180) / 30, grab = (meta('a11_bag').grab || 60) / 30, ride = (meta('a12_kerbcab').ride || 200) / 30, rend = (meta('a13_cabtown').end || 400) / 30;
const A = {
  len: LEN, music: 'music_a.wav',
  video: [
    { clip: 'a01_light', t0: 0, t1: bar(4), note: 'Lighthouse and beach, night to first light (time-lapse 04:36 to 06:20), beam turning' },
    { clip: 'a02_harbor', t0: bar(4), t1: bar(5), note: 'Harbour boardwalk at 06:00: fish hall, stalls, lamps still on' },
    { clip: 'a03_train', t0: bar(5), t1: bar(6), note: 'The first train pulls out of Central Station on the viaduct' },
    { clip: 'a04_lamps', t0: bar(6), t1: bar(7), note: 'Downtown: street lamps and shop lights give way to daylight (time-lapse 05:54 to 07:20)' },
    { clip: 'a05_bus', t0: bar(7), t1: bar(8), note: 'A city bus on its morning round (drums come in)' },
    { clip: 'a06_folk', t0: bar(8), t1: bar(9), note: 'City folk fill the plaza in front of City Hall, 08:10' },
    { clip: 'a07_vista', t0: bar(9), t1: bar(10), note: 'Wide downtown: towers, traffic, the viaduct' },
    { clip: 'a08_plane', in: td - (bar(11) - bar(10)), t0: bar(10), t1: bar(12), note: 'The plane comes in over the airfield and touches down on the downbeat of bar 11 (23.2 s)' },
    { clip: 'a09_kerb', t0: bar(12), t1: bar(13), note: 'Airport kerb: cabs, travellers' },
    { clip: 'a10_hall', t0: bar(13), t1: bar(14), note: 'Baggage hall, carousels turning' },
    { clip: 'a11_bag', in: Math.max(0, grab - 1.5), t0: bar(14), t1: bar(15), note: 'THE PLAYER: takes the yellow suitcase off carousel 2 and tows it away' },
    { clip: 'a12_kerbcab', in: Math.max(0, ride - 1.6), t0: bar(15), t1: bar(16), note: 'Out at the kerb the cab pulls up, player gets in, cab pulls away' },
    { clip: 'a13_cabtown', in: .5, t0: bar(16), t1: bar(18), note: 'Cab ride through downtown to the diner' },
    { clip: 'a15_door', in: .2, t0: bar(18), t1: bar(18, 2), note: 'Player walks up to the diner door (welcome glow), suitcase in tow' },
    { clip: 'room_diner', in: .1, t0: bar(18, 2), t1: END, note: 'Cut inside: the diner' },
    { clip: 'a16_end', t0: END, t1: LEN, note: 'End card over downtown at night' },
  ],
  gfx: [
    { kind: 'fadein', t0: 0, t1: 1.6 },
    { kind: 'title', t0: bar(2), t1: bar(4) - .25, y: 230 },
    { kind: 'cap', t0: bar(17), t1: END - .12, text: `over ${N} buildings to walk into`, size: 70 },
    { kind: 'wipe', t: bar(18, 2), d: .23 },
    { kind: 'dim', t0: END, t1: LEN, a: .5 },
    { kind: 'title', t0: END, t1: LEN, y: 215, tag: 'The city’s awake. Come on in.', tagAt: .58 },
    { kind: 'fadeout', t0: LEN - .5, t1: LEN + .1 },
  ],
};

/* ---------------- B: the mix (Open Every Door x A Week in Maple Bay) ---------------- */
// the door montage: 16 interiors one per beat (bars 5-8), 24 one per half beat (bars 13-15); [room clip, name shown nowhere, just for the storyboard]
export const DOORS1 = ['diner', 'cs_hollowell', 'aquarium', 'lighthouse', 'central_station-platforms', 'cityhall', 'natatorium-pool', 'museum', 'observatory', 'skydeck', 'home-villa_belvedere', 'cafe', 'fishmarket', 'conservatory', 'cs_nightjar', 'bookstore'];
export const DOORS2 = ['bakery', 'cs_juniper', 'library', 'aquarium-deep', 'ramen', 'bar', 'arena-bowl', 'cs_secondwind', 'hotel', 'gym', 'pizza', 'university', 'cs_tidepool', 'fire_station', 'university-library', 'concerthall', 'cs_sole', 'home-beacon_penthouse', 'radio_studio', 'cs_brim', 'cinema', 'grocery', 'central_station', 'lighthouse_lantern'];
const WEEK = [['MON', 'b_job', 2, 'A job shift: trainee barista at the cafe (the shift panel is the game’s own)'], ['TUE', 'b_gym', 2, 'The gym: treadmill mini-game'], ['WED', 'b_cook', 2, 'Cooking mini-game at home ("Chop it")'], ['THU', 'b_rain', 2, 'A rainy evening walk downtown'],
  ['FRI', 'b_date', 2, 'A first date on the River Walk (the date scene’s own text sheet)'], ['SAT', 'b_fest', 4, 'Lantern Night festival in Old Town'], ['SUN', 'b_fish', 2, 'Fishing off the river rail']];
// round 3 (owner msg 212): four more bars. round 4 (owner msg 213): the four travel shots hold one bar each (bars 4-7), so everything from the doors on is three bars later: bb(n) = the old bar n.
const LEN_B = 45 + 7 * BAR, END_B = bar(26), bb = (n, beats = 0) => bar(n >= 5 ? n + 3 : n, beats);   // final chord at bar 26 = 57.79 s, 61.15 s in all
const B = { len: LEN_B, music: 'music_b.wav', video: [], gfx: [] };
{
  const v = B.video, g = B.gfx, tdB = td, END = END_B, LEN = LEN_B;
  // revision (owner msg 211): opens on a dense, close downtown corner under the title card (2 bars so the title can be read); the plane follows; the on-foot / bus / train / cab run is trimmed from 2 beats each to 1 beat each (one bar) to pay for it
  v.push({ clip: 'b00_c3', t0: 0, t1: bb(3), note: 'OPENING: a busy downtown street corner, close (zoom 3): shopfronts, traffic lights, cab, bus, people, trees; title card over it' });
  v.push({ clip: 'a08_plane', in: tdB - 1.2, t0: bb(3), t1: bb(4), note: 'The airport: a plane touches down' });
  const ways = [['b03_foot', .5, 'On foot across the plaza'], ['b04_bus', 0, 'Bus'], ['b05_train', .2, 'Train on the viaduct, a second train passing'], ['a13_cabtown', 12.47, 'Cab at the crossing']];
  ways.forEach((w, i) => v.push({ clip: w[0], in: w[1], t0: bar(4 + i), t1: bar(5 + i), note: 'Fully explorable: ' + w[2] }));
  const steps = []; let k = 0; const total = DOORS1.length + DOORS2.length, num = i => Math.max(1, Math.round(N * Math.pow((i + 1) / total, 1.35)));
  DOORS1.forEach((r, i) => { const t = bb(5, i); v.push({ clip: 'room_' + r, in: 0, t0: t, t1: bb(5, i + 1), note: 'Door ' + (i + 1) + ': ' + r }); g.push({ kind: 'wipe', t, d: .1 }); steps.push([t, num(k++)]); });
  let b = 0; WEEK.forEach(w => { const t = bb(9, b); v.push({ clip: w[1], in: w[1] === 'b_fest' ? 0 : .4, t0: t, t1: bb(9, b + w[2]), note: w[0] + ': ' + w[3] }); g.push({ kind: 'day', t0: t, t1: bb(9, b + w[2]) - .04, text: w[0] }); b += w[2]; });
  DOORS2.forEach((r, i) => { const t = bb(13, i / 2); v.push({ clip: 'room_' + r, in: .1, t0: t, t1: bb(13, (i + 1) / 2), note: 'Door ' + (DOORS1.length + i + 1) + ': ' + r }); g.push({ kind: 'wipe', t, d: .067 }); steps.push([t, num(k++)]); });
  v.push({ clip: 'room_aquarium', in: .15, t0: bb(16), t1: bb(17), note: 'Hold on the aquarium for the count caption' });
  // round 3: close views of the character at work (bars 17-18) and at play (bars 19-20), two beats each; then home (kept), then a city shot in place of the lighthouse
  const JOBS = [['x_barista', 4.27, 'Barista at Bean & Gone: makes a drink at the machine'], ['x_station', 1.67, 'Station agent at Central: sees a train off'], ['x_cook', 5.0, 'Prep cook in the diner kitchen'], ['x_fire', 3.07, 'Firefighter rolling a hose at the station']];
  JOBS.forEach((j, i) => v.push({ clip: j[0], crop: 2, cy: 30, in: j[1], t0: bb(17, i * 2), t1: bb(17, i * 2 + 2), note: 'AT WORK: ' + j[2] }));
  const PLAY = [['x_tread', .5, 'Running on the treadmill at the gym'], ['x_dance', .5, 'On the dance floor at the Blue Heron'], ['x_fish', .5, 'Fishing from the river rail'], ['x_paint', .5, 'Painting at the easel']];
  PLAY.forEach((j, i) => v.push({ clip: j[0], crop: 2, cy: 30, in: j[1], t0: bb(19, i * 2), t1: bb(19, i * 2 + 2), note: 'AT PLAY: ' + j[2] }));
  v.push({ clip: 'b_home', t0: bb(21), t1: bb(22), note: 'Evening at home by the fire' });
  v.push({ clip: 'b_city2', t0: bb(22), t1: END, note: 'The harbour boardwalk in the evening light: fish hall, stalls, boats, strollers (replaces the lighthouse)' });
  v.push({ clip: 'a16_end', t0: END, t1: LEN, note: 'End card over downtown at night' });
  g.push({ kind: 'fadein', t0: 0, t1: .5 });
  g.push({ kind: 'dim', t0: .3, t1: bb(3), a: .28 });
  g.push({ kind: 'title', t0: .4, t1: bb(3) - .15, y: 270, leaf: 1, tag: 'an open-world life sim', tagAt: .45 });
  g.push({ kind: 'cap', t0: bb(3) + .1, t1: bb(4) - .15, text: '1 city', size: 104 });
  g.push({ kind: 'cap', t0: bar(4), t1: bar(8) - .8, text: 'fully explorable', size: 96 });   // owner msg 211: replaces '4 ways to get around'
  g.push({ kind: 'count', t0: bb(5), t1: bb(9) - .05, steps, label: 'enterable buildings' });
  g.push({ kind: 'count', t0: bb(13), t1: bb(16), steps, label: 'enterable buildings' });
  g.push({ kind: 'cap', t0: bb(16), t1: bb(17) - .12, text: 'nearly 200 enterable buildings', size: 68 });   // owner msg 206-207: replaces 'over 190 buildings to walk into'; at the bottom, clear of the tank
  g.push({ kind: 'cap', t0: bb(9, .5), t1: bb(11) - .15, text: 'your life, your pace', size: 88 });   // round 3: moved to the start of the week
  g.push({ kind: 'cap', t0: bb(17), t1: bb(19) - .15, text: '25 jobs to work', size: 92 });
  g.push({ kind: 'cap', t0: bb(19), t1: bb(21) - .15, text: 'over 90 things to do', size: 92 });
  g.push({ kind: 'cap', t0: bb(21), t1: END - .12, text: 'so much to see', size: 92 });
  g.push({ kind: 'dim', t0: END, t1: LEN, a: .5 });
  g.push({ kind: 'title', t0: END, t1: LEN, y: 270, leaf: 1, tag: 'an open-world life sim', tagAt: .58 });
  g.push({ kind: 'fadeout', t0: LEN - .5, t1: LEN + .1 });
}
export const EDL = { a: A, b: B };
