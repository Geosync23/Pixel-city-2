// _jobstory_stations.js — where the NEW jobs work (helper of sim/_jobs_work.js; rows: story/jobs_new.js NEW_JOBS).
//
// The new jobs' station tags (gate_desk, florist_bench, barber_chair ...) are not on any fixture: the rooms were built before the jobs were written, and room
// files belong to other owners. So nothing in a room file is touched: STATIONS names, for every station of every new job, an EXISTING fixture of the job's room
// (by function tag or by asset id, the nearest one to a point when several exist) or, where the room has nothing suitable, a spot on the floor. At the start of a
// shift stationsFor(job, scene) adds the private tag 'js:<job>:<station>' to those fixtures (in memory, on the live scene only) and the work engine looks
// stations up by that tag. A spot becomes a small invisible fixture that only the work engine sees.
//
//   STATIONS[jobId][station] = [selector, x?, y?] | [[selector, x?, y?], ...] | { first: [[selector, x?, y?], ...] }  (first = the first selector that matches: a real
//       fixture added by scenes/rooms/job_fixtures.js, else the older stand-in)
//       selector  'tag'            fixtures carrying that function tag            /regex/  fixtures whose asset id matches            '@' a floor spot at (x, y)
//       x, y      world coordinates (room coordinates + 1). With a point: the ONE nearest match. Without: every match (the work engine picks among them).
//   stationsFor(job, scene) -> { [station]: n fixtures }          (also used by G.jobStory.debug.stations())
//   newScripts(h) -> { [jobId]: level => templates }              ticket scripts in the shape of _jobs_work.js SCRIPTS (h = its small builders)
//
// Adding a job: a row in STATIONS (every station of its workLoop.stations) and a script below. Run G.jobStory.debug.stations(jobId) inside the room to see what resolved.
import { G } from '../core/game.js';
import { mini as uiMini } from '../ui/jobs.js';

export const STATIONS = {
  gate_agent: {            /* int:airport:concourse — gate B3 */
    gate_desk: ['gate_desk', 21, 2.3], boarding_door: [/airport\.gatedoor/, 23.5, 1.1], info_desk: ['flight_board', 19.5, 12.7] },
  baggage_handler: {       /* int:airport:terminal — baggage claim */
    bag_cart: ['bag_cart'], baggage_carousel: ['carousel_island'], oversize_desk: ['oversize_desk'], lost_found: ['lost_found'] },
  station_agent: {         /* int:central_station:platforms (scenes/rooms/station_platforms.js): every station is a real fixture on Platforms 1-2 */
    platform_edge: ['platform_edge'] /* the dispatch point on Platform 1 */, station_info: ['station_info'] /* the help point on the concourse */, ticket_gate: ['ticket_gate'] /* the validators at the stair head */,
    lost_property: ['lost_property'] /* the hatch of the stationmaster's office */, announcer_booth: ['announcer_booth'] /* the PA box (Gladys) by the office */ },
  retail_associate: {      /* int:deptstore — the Thread & Co. Outlet bay */
    folding_table: [/clothing\.foldtable/], clothes_rack: [/clothing\.(round)?rack/], fitting_room: [/clothing\.mirror/, 27.8, 1.8], mallcounter: ['mallcounter', 29.5, 2.3], shop_window: [[/clothing\.mannequin/, 25.8, 5.3], [/clothing\.mannequin/, 27.3, 5.8]] },
  museum_guide: {          /* int:museum */
    mus_info_desk: ['mus_ticket'], mus_gallery_post: ['mus_audio'], mus_exhibit: ['mus_ex'], mus_dig_pit: ['mus_dig'] },
  florist: {               /* int:conservatory — Garden Gifts, by the seedling tables */
    flower_buckets: ['cons_seedling'], florist_bench: { first: [['florist_bench'], ['cons_shop', 8, 22.8]] }, conservatory_shop_till: ['cons_shop', 3, 22.8], flower_cooler: { first: [['flower_cooler'], [/cons\.shelf/, 8, 21.7]] }, delivery_door: ['cons_gate', 15.8, 21.1] },
  aquarist: {              /* int:aquarium */
    aq_penguin_cove: ['aqua_penguins'], aq_touch_pool: ['aqua_touchpool'], aq_octopus_den: ['aqua_coltank'], aq_fish_kitchen: { first: [['aq_fish_kitchen'], ['aqua_feeder']] }, aq_water_lab: { first: [['aq_water_lab'], ['aqua_bigtank']] } },
  gull_cook: {             /* int:restaurant — the pass is the kitchen's window; the kitchen itself is behind it */
    gull_pass: ['pass_window'], gull_stove: { first: [['gull_stove'], ['pass_window']] }, gull_prep: { first: [['gull_prep'], [/restaurant\.winerack/, 3.8, 1.3]] }, gull_walk_in: { first: [['gull_walk_in'], [/generic\.door/, 6, 1.1]] }, gull_back_door: { first: [['gull_back_door'], ['host']] } },
  hotel_bell: {            /* int:hotel — the Grand Lobby */
    hotel_luggage_cart: ['hotel_cart'], hotel_reception: ['hotel_reception'], hotel_concierge: ['hotel_desk', 9.3, 11.4], hotel_lift: ['hotel_lift'], hotel_bell_710: ['hotel_bell'] },
  observatory_guide: {     /* int:observatory — the gallery floor */
    obs_small_scope: [/obs\.scopecase/], obs_great_scope: ['obs_stairs'], obs_planetarium_desk: ['obs_lectern'], obs_ticket_desk: ['obs_ticket'], obs_terrace: { first: [['obs_terrace'], ['obs_pendulum']] } },
  /* the four job rooms (scenes/rooms/job_rooms.js): every fixture carries its station tag */
  radio_dj: { radio_board: ['radio_board'], radio_phone: ['radio_phone'], record_shelf: ['record_shelf'], radio_kettle: ['radio_kettle'] },
  teacher: { class_board: ['class_board'], class_carpet: ['class_carpet'], class_desks: ['class_desks'], class_reading_corner: ['class_reading_corner'], class_nature_table: ['class_nature_table'] },
  reporter: { news_assign_board: ['news_assign_board'], news_own_desk: ['news_own_desk'], news_editor_desk: ['news_editor_desk'], news_morgue: ['news_morgue'], assignment_place: ['assignment_place'] },
  firefighter: { fire_gear_hooks: ['fire_gear_hooks'], fire_engine: ['fire_engine'], fire_kitchen: ['fire_kitchen'], fire_bunk: ['fire_bunk'], fire_hose_rack: ['fire_hose_rack'], call_scene: ['call_scene'] },
  hair_stylist: {          /* int:pub:22 — Otis & Sons Barbershop */
    barber_chair: [/barber\.armchair/], barber_station: [/barber\.station/], barber_sink: { first: [['barber_sink'], ['browse']] }, barber_floor: [/generic\.rug/], barber_till: ['till'] },
};

function virtual(scene, x, y) {
  const w = scene.world; let ux = x, uy = y;
  if (w.isBlocked(x, y)) { let best = 1e9; for (let dx = -2; dx <= 2; dx += .5) for (let dy = -2; dy <= 2; dy += .5) { const d = dx * dx + dy * dy; if (d < best && !w.isBlocked(x + dx, y + dy)) { best = d; ux = x + dx; uy = y + dy; } } }
  const fx = { ob: { size: [.6, .6, .9], z: 0, B: [x - .3, y - .3, 0, x + .3, y + .3, .9], data: {} }, asset: { id: 'job.spot', tags: [] }, tags: [], x, y, use: { x: ux, y: uy }, seats: [], staff: null, pose: null, bed: null, uses: null, item: {}, virtual: true };
  scene.fixtures.push(fx); return fx;
}
function matchOne(scene, sel) {
  const [what, x, y] = sel;
  if (what === '@') return [virtual(scene, x, y)];
  const list = scene.fixtures.filter(f => !f.virtual && (typeof what === 'string' ? f.tags.includes(what) : what.test((f.asset && f.asset.id) || '')));
  if (x === undefined || !list.length) return list;
  return [list.reduce((a, b) => (Math.hypot(a.x - x, a.y - y) <= Math.hypot(b.x - x, b.y - y) ? a : b))];
}
export function stationsFor(job, scene) {
  const M = STATIONS[job.id], out = {}; if (!M || !scene || !scene.fixtures) return out;
  for (const st in M) {
    const tag = 'js:' + job.id + ':' + st, row = M[st]; let n = 0;
    /* { first: [selA, selB] }: the first selector that finds anything (the real fixture, else the old stand-in) */
    const sels = row && row.first ? [row.first.find(sel => sel[0] !== '@' && matchOne(scene, sel).length) || row.first[row.first.length - 1]] : Array.isArray(row[0]) && !(row[0] instanceof RegExp) ? row : [row];
    for (const sel of sels) for (const fx of matchOne(scene, sel)) { if (!fx.tags.includes(tag)) fx.tags.push(tag); n++; }
    out[st] = n;
  }
  return out;
}

/* ---------- ticket scripts for the new jobs (same shape as _jobs_work.js SCRIPTS; all names / minutes / bonuses come from the job rows) ---------- */
const CITIES = ['Port Ansel', 'Lakehead', 'Saint-Remy', 'Carrow', 'Pinehollow Field', 'Nine Mile Key'];
const ASK_GATE = [['Where is gate B2?', 'Two gates back, past the koi pond.', ['No idea, sorry.', 'B2 moved to another airport.']], ['Is there coffee past here?', 'Bay Brew, by the green wall. They open at five.', ['Coffee is not allowed.', 'Try the vending machine. Good luck.']], ['Has my flight boarded?', 'Not yet. I will call your row. Sit, you have time.', ['Probably.', 'Hard to say with planes.']]];
const ASK_STN = [['Which platform for Harborside?', 'Platform 1. Loop A, the red one.', ['Platform nine and a half.', 'Any of them, eventually.']], ['Is the 6:42 on time?', 'To the minute. It is the clock that is fast.', ['It has never been on time.', 'Which 6:42?']], ['Where do I change for the airport?', 'Stay on. The Loop runs through to the Airport stop.', ['You cannot get there from here.', 'Take a cab, honestly.']]];
const ASK_MUS = [['Is the big skeleton real?', 'Marge is real bone from the neck back. Come and see the join.', ['It is plastic.', 'Please do not ask about Marge.']], ['Where do the children dig?', 'The dig pit, left of the Hall. Brushes are in the tray.', ['Nowhere. No digging.', 'Outside, probably.']], ['What should I not miss?', 'The harbor model. It lights up at the hour.', ['The exit.', 'Everything is roughly the same.']]];
const ASK_HOTEL = [['Somewhere quiet to read?', 'The lounge by the piano, before four.', ['The lift.', 'We do not do quiet.']], ['Breakfast before six?', 'Dot\'s Diner opens at five. Two blocks, pink sign.', ['Nothing opens before six.', 'Room service, at noon.']], ['A present for a nine-year-old?', 'Toy Galaxy, in the Galleria. Ask for the rocket kits.', ['The minibar.', 'Cash is traditional.']]];
const FLOWERS = ['Tulips', 'Ranunculus', 'Eucalyptus', 'Stock', 'Ferns', 'Peonies', 'Wax flower', 'Roses'];
const DIETS = [['the penguins', ['Herring', 'Sprats', 'Vitamins']], ['the sea turtle', ['Lettuce', 'Squid', 'Shrimp']], ['the touch pool', ['Mussels', 'Kelp', 'Shrimp']]];
const FOODS = ['Herring', 'Sprats', 'Vitamins', 'Lettuce', 'Squid', 'Shrimp', 'Mussels', 'Kelp'];
const TABLES = [['Table four', ['Sea bass', 'Lamb', 'Risotto']], ['Table seven', ['Scallops', 'Duck', 'Greens']], ['Table two', ['Mussels', 'Sea bass', 'Fennel']]];
const DISHES = ['Sea bass', 'Lamb', 'Risotto', 'Scallops', 'Duck', 'Greens', 'Mussels', 'Fennel'];
const TARGETS = ['Saturn', 'the Moon', 'the Pleiades', 'Jupiter', 'the Ring Nebula'];
const wxKind = () => { try { return G.weather.current().kind; } catch (e) { return 'clear'; } };
const TAGS = [['a red tag', 'Carousel 1'], ['a blue tag', 'Carousel 2'], ['a yellow tag', 'Carousel 3'], ['a pair of skis', 'Oversize']];

/* the four room jobs */
const CALLS_IN = [['Something for the night shift at the bakery?', 'Bright and quick. Brass, if you have it.', ['A lullaby.', 'The shipping forecast, twice.']], ['My husband says you never play the old ones.', 'An old one, then. With his name on it.', ['Tell him to buy a record player.', 'The newest thing in the box.']], ['I am driving cab 22 and I am half asleep.', 'Something with a beat, and the window down.', ['The slowest song on the shelf.', 'Eleven minutes of rain noises.']], ['Is the ferry running in this?', 'Read the harbor bulletin, slowly, twice.', ['Guess.', 'Play a song about boats instead.']], ['(Line three. Nobody speaks. Somewhere, a cello.)', 'Say nothing. Let it go out on the air.', ['Hang up.', 'Ask them to speak up.']]];
const ASK_CLASS = [['I can not do number four.', 'Show me number three first. You did that one.', ['Then skip it.', 'It is easy. Look.']], ['He took my blue.', 'Blue comes back when you are finished. Two minutes each.', ['Stop it, both of you.', 'There are other colors.']], ['My tooth came out.', 'An envelope, your name on it, and a great deal of ceremony.', ['Put it in the bin.', 'Show me later.']], ['Is a tomato a fruit?', 'Good question. What do YOU think, and why?', ['Yes.', 'We are doing sums.']], ['I finished.', 'Then turn it over and draw me what seven looks like.', ['Sit quietly.', 'Do it again.']]];
const LESSONS = [['sums to ten', 'Hands are up for "three plus four".', 'Somebody who has not answered yet.', ['Juniper. Again.', 'Answer it yourself.']], ['the months', 'Which month comes after May?', 'The back table: they have been waiting.', ['Juniper.', 'Nobody. Move on.']], ['floating and sinking', 'Will the cork float?', 'Let three of them guess before you drop it.', ['Tell them at once.', 'Drop it without asking.']], ['our town', 'Where is the lighthouse on the map?', 'Ask the child who drew it.', ['Point to it yourself.', 'Juniper knows.']]];
const ASSIGN = [['pigeons at City Hall', 'The man who counts them, every noon.', ['"Pigeons: a nuisance?"', 'A council press release.'], 'the City Hall steps'], ['a crosswalk', 'Go and stand in the street at ten to three.', ['Read the agenda.', 'Telephone the mayor\'s office.'], 'Main and Third'], ['the last ice machine', 'The engineer who has drawn the missing part, twice.', ['The price of ice.', '"Harbor in meltdown!"'], 'the Bay Fish Hall'], ['the library on Saturdays', 'A man who is learning to read at seventy-nine.', ['Opening hours, in a table.', 'A quote from the budget.'], 'the Public Library'], ['the Arena, sports desk sick', 'The kid who sweeps the ice and knows every score.', ['The final score only.', 'The price of a hot dog.'], 'the Arena'], ['the Lighthouse Fund', 'The keeper, and what the light costs a night.', ['A list of donors.', '"Light fantastic!"'], 'Gull Point Light']];
const VOICES = [['A first voice. One question.', 'What happened, and when exactly?', ['Any comment?', 'Lovely day, is it not?']], ['A second voice.', 'How long have you been coming here?', ['Can I quote you on anything?', 'Is it always like this?']], ['A third voice.', 'What will you miss, if it goes?', ['Thoughts?', 'Spell your name. That will do.']]];
const CALLDECK = [['Smoke alarm, Sycamore Lane', 'Roll: Sycamore Lane', 'The caller says it is probably toast. At the door:', 'Check behind the toaster and the stove. Then the windows.', ['Hose line through the hall.', 'Reset the alarm and leave.']], ['A cat up the big maple', 'Roll: Birch Lane', 'Third branch from the top. It has been there since lunch.', 'Foot the ladder. Let the cat come to you.', ['Climb fast and grab.', 'Shake the branch.']], ['A stuck lift, Hartwell Tower', 'Roll: Hartwell Tower', 'Four people and a fern, between nine and ten.', 'Talk to them first. Then key it down by hand.', ['Force the doors.', 'Wait outside.']], ['A trash can, behind the diner', 'Roll: Dot\'s back door', 'Small, smoky, next to a stack of crates.', 'Move the crates. A short burst at the base. Soak it.', ['A long blast from the door.', 'Put the lid on and go.']], ['A smell of gas at the market', 'Roll: Old Town Market', 'The meter says nothing. The smell says a lot.', 'Follow your nose: check the fruit stalls.', ['Clear the whole market.', 'Tell them it is nothing.']]];
/* "out on a story" / "out on a call": the player (and Engine 2) are away for the length of the task */
let away = null, hooked = false;
function back() { if (!away) return; const a = away; away = null; try { G.player.hidden = false; if (a.ob) a.ob.hidden = false; } catch (e) { /* gone */ } }
function out(withEngine) { if (!hooked) { hooked = true; G.on('activityEnd', back); G.on('scene', back); G.on('job:shift:end', back); } back(); const ob = withEngine && G.scene && G.scene.world ? G.scene.world.objs.find(o => o.id === 'furn.job.fire.engine') : null; away = { ob }; G.player.hidden = true; if (ob) ob.hidden = true; }
/** a micro-interaction, after which the player is out of the room until the task ends. def = a mini def, or null (no question: just go) */
const gone = (def, withEngine) => () => (def ? uiMini(def) : Promise.resolve(.9)).then(q => { if (q !== null && q !== undefined) setTimeout(() => { if (G.busy && G.busy.jobTask) out(withEngine); }, 60); return q; });

export function newScripts(h) {
  const { s, pick, shuffle, pickMini, choiceMini, mash, meter } = h, q = (title, a) => choiceMini(title, '"' + a[0] + '"', a[1], a[2]);
  return {
    gate_agent: l => [
      { id: 'flight', every: [70, 95], first: 3, make() { const c = pick(CITIES);
        return { title: 'Boarding: ' + c, steps: [s('boarding_call', { mini: pickMini('Boarding call', 'Call the rows from the back of the plane forward', ['Rows 20 to 30', 'Rows 10 to 19', 'Rows 1 to 9'], ['Everybody at once', 'Row 99'], true) }),
          s('check_passes', { mini: { kind: 'taps', mode: 'belt', title: 'Name, flight, gate', prompt: 'Tap each pass as it comes to the scanner', labels: shuffle(['Okafor 14C', 'Lim 22A', 'Beaumont 4A', 'Reyes 9F', 'Tran 31D']) } }), s('work_the_door'),
          s('check_passes', { name: 'Check the Last Passes', mini: mash('The last passes', 'Scan', 6) }), s('close_flight')] }; } },
      { id: 'ask', every: [14, 22], first: 1, max: 2, patience: 45, make: () => ({ title: 'A passenger has a question', custAt: { tag: 'info_desk' }, steps: [s('answer_question', { mini: q('At the board', pick(ASK_GATE)) })] }) },
      { id: 'quiet', filler: 1, make: () => ({ title: 'Quiet gate', steps: [s('answer_question', { name: 'Check the Departures Board' })] }) },
    ],
    baggage_handler: l => [
      { id: 'cart', every: [16, 24], first: 1, make() { const t = pick(TAGS);
        return { title: 'A cart from the ramp', steps: [s('unload_cart', { carry: 'box' }), s('sort_belt', { any: 1, mini: choiceMini('Read the tag, not the bag', 'This one has ' + t[0] + '.', t[1], TAGS.filter(x => x !== t).map(x => x[1]).slice(0, 2)) })] }; } },
      { id: 'odd', every: [50, 70], first: 14, make: () => ({ title: 'Something long and awkward', steps: [s('unload_cart', { carry: 'box', name: 'Lift It Off the Cart' }), s('oversize')] }) },
      { id: 'lost', every: [80, 110], first: 40, patience: 70, make: () => ({ title: 'One bag left on the belt', custAt: { tag: 'lost_found' }, steps: [s('sort_belt', { any: 1, name: 'Fetch the Last Bag', carry: 'box' }), s('last_bag')] }) },
      { id: 'tug', every: [90, 120], first: 60, lvl: 2, make: () => ({ title: 'Cart train to stand 4', steps: [s('drive_tug')] }) },
      { id: 'walk', filler: 1, make: () => ({ title: 'Between flights', steps: [s('sort_belt', { any: 1, name: 'Walk the Belt' })] }) },
    ],
    station_agent: l => [
      /* the REAL timetable: the ticket appears when a Loop A train is about to stand at Platform 1 (G.rail.nextTrains), about one train in three (20-28 game minutes apart) */
      { id: 'train', max: 1, when: W => { const now = G.state.t; if (W._trainAt && now < W._trainAt) return false; let ok = true; try { const nt = G.rail.nextTrains('central').find(q => q.dir === 0); ok = !!nt && (nt.boarding || nt.minutes < 2.5); } catch (e) { ok = true; } if (ok) W._trainAt = now + 20 + Math.random() * 8; return ok; },
        make: () => ({ title: 'Loop A is in on Platform 1', steps: [l >= 2 && s('announce', { mini: mash('The announcement', 'Speak', 6) }), s('dispatch', { mini: meter('timing', 'Along the train', 'Raise the flag when the last door is shut: in the green', 'Flag up') })] }) },
      { id: 'ask', every: [12, 18], first: 1, max: 2, patience: 40, make: () => ({ title: 'Somebody is lost', custAt: { tag: 'station_info' }, steps: [s('which_platform', { mini: q('At the help point', pick(ASK_STN)) })] }) },
      { id: 'gate', every: [35, 50], first: 12, patience: 45, make: () => ({ title: 'A ticket is stuck in the validator', custAt: { tag: 'ticket_gate' }, steps: [s('stuck_ticket', { mini: mash('The validator', 'Jiggle', 5) })] }) },
      { id: 'lost', every: [70, 95], first: 30, make: () => ({ title: 'Handed in on platform 1', steps: [s('log_lost')] }) },
      { id: 'clock', filler: 1, make: () => ({ title: 'A lull', steps: [s('which_platform', { name: 'Stand by the Board' })] }) },
    ],
    retail_associate: l => [
      { id: 'rail', every: [14, 20], first: 1, make: () => (Math.random() < .5 ? { title: 'The table is a heap again', steps: [s('fold', { any: 1, mini: mash('Fold', 'Fold', 6) })] } : { title: 'Wrong hangers, wrong rail', steps: [s('rehang', { any: 1 })] }) },
      { id: 'cust', every: [18, 26], first: 4, max: 2, patience: 50, make: () => (l >= 2 && Math.random() < .55 ? { title: 'A customer needs an outfit', custAt: { tag: 'fitting_room' }, steps: [s('dress_customer'), s('ring_up', { mini: mash('Ring it up', 'Scan', 5) })] }
        : { title: 'A customer at the till', custAt: { tag: 'mallcounter' }, steps: [s('ring_up', { mini: { kind: 'taps', mode: 'belt', title: 'Ring it up', prompt: 'Tap each tag as it slides past', labels: shuffle(['Jacket', 'Scarf', 'Socks', 'Jeans', 'Belt']).slice(0, 4) } })] }) },
      { id: 'window', every: [999, 999], first: 90, limit: 1, make: () => ({ title: 'The window wants changing', steps: [s('window', { any: 1 })] }) },
      { id: 'tidy', filler: 1, make: () => ({ title: 'Quiet floor', steps: [s('rehang', { any: 1, name: 'Straighten the Rail' })] }) },
    ],
    museum_guide: l => [
      { id: 'round', every: [20, 28], first: 1, make: () => ({ title: 'Gallery round', steps: [s('gallery_round', { any: 1 }), s('gallery_round', { any: 1, name: 'And the Next Room' })] }) },
      { id: 'ask', every: [12, 18], first: 3, max: 2, patience: 45, make: () => ({ title: 'A visitor has a question', custAt: { tag: 'mus_exhibit' }, steps: [s('answer_visitor', { mini: q('At the case', pick(ASK_MUS)) })] }) },
      { id: 'tour', at: [11, 14], lvl: 2, make: () => ({ title: 'The tour is gathering', steps: [s('lead_tour'), s('answer_visitor', { any: 1, name: 'Stop at the Whale' }), s('answer_visitor', { any: 1, name: 'Stop at the Cases' })] }) },
      { id: 'dig', every: [80, 110], first: 45, make: () => ({ title: 'The dig pit is full of children', steps: [s('dig_pit')] }) },
      { id: 'stand', filler: 1, make: () => ({ title: 'A quiet gallery', steps: [s('gallery_round', { any: 1, name: 'Stand Where You Can Be Asked' })] }) },
    ],
    florist: l => [
      { id: 'order', every: [16, 24], first: 2, max: 2, patience: 60, make() { const need = shuffle(FLOWERS).slice(0, 3);
        return { title: 'An order: ' + need[0].toLowerCase(), custAt: { tag: 'conservatory_shop_till' }, steps: [s('arrange', { mini: pickMini('Three kinds and no more', 'Take the three stems on the card', need, FLOWERS) }), s('wrap', { mini: meter('timing', 'Paper, twist, ribbon', 'Tie it off in the green', 'Tie') })] }; } },
      { id: 'buckets', every: [28, 40], first: 1, make: () => ({ title: 'The morning boxes', steps: [s('condition', { any: 1, mini: mash('Strip and cut', 'Snip', 6) }), s('cooler', { carry: 'box' })] }) },
      { id: 'van', every: [999, 999], first: 150, limit: 1, make: () => ({ title: 'Hank is at the gate', steps: [s('cooler', { name: 'Fetch the Orders', carry: 'box' }), s('load_van')] }) },
      { id: 'water', filler: 1, make: () => ({ title: 'A quiet bench', steps: [s('condition', { any: 1, name: 'Change the Water' })] }) },
    ],
    aquarist: l => [
      { id: 'count', at: [7], make: () => ({ title: 'The morning count', steps: [s('count', { mini: mash('Count them', 'One more', 6) })] }) },
      { id: 'diet', every: [26, 36], first: 6, make() { const d = pick(DIETS);
        return { title: 'Diets for ' + d[0], steps: [s('prep_diets', { carry: 'box', mini: pickMini('The diet card', 'Fill the tray for ' + d[0], d[1], FOODS) }), s('feed')] }; } },
      { id: 'water', every: [45, 60], first: 20, make: () => ({ title: 'Water tests', steps: [s('water_test', { mini: meter('timing', 'Read the vial', 'Stop on the color that matches', 'Read') })] }) },
      { id: 'pool', every: [30, 45], first: 12, patience: 55, make: () => ({ title: 'Small hands at the touch pool', custAt: { tag: 'aq_touch_pool' }, steps: [s('touch_pool')] }) },
      { id: 'jar', every: [999, 999], first: 200, limit: 1, lvl: 2, make: () => ({ title: 'The octopus wants her puzzle', steps: [s('octopus_jar')] }) },
      { id: 'look', filler: 1, make: () => ({ title: 'Quiet water', steps: [s('touch_pool', { name: 'Check the Pool' })] }) },
    ],
    gull_cook: l => [
      { id: 'mise', every: [999, 999], first: 0, limit: 1, make: () => ({ title: 'Mise en place', steps: [s('walk_in', { carry: 'box' }), s('mise', { mini: mash('Mise', 'Chop', 8) })] }) },
      { id: 'table', every: () => (h.now().hf >= 18.5 ? [9, 13] : [14, 20]), first: 25, max: 2, patience: 60, make() { const t = pick(TABLES);
        return { title: t[0], steps: [s('fire_table', { mini: pickMini('Fire ' + t[0].toLowerCase(), 'Longest cooking first, so they land together', t[1], DISHES, true) }), s('plate', { item: 'box', mini: meter('timing', 'At the pass', 'Wipe the rim and call it: in the green', 'Service') })] }; } },
      { id: 'cold', every: [60, 80], first: 40, make: () => ({ title: 'The walk-in', steps: [s('walk_in', { carry: 'box' }), s('mise', { name: 'Restock the Station' })] }) },
      { id: 'gull', every: [999, 999], first: 300, limit: 1, make: () => ({ title: 'Somebody is at the door', steps: [s('sardine')] }) },
      { id: 'wipe', filler: 1, make: () => ({ title: 'Between tables', steps: [s('mise', { name: 'Wipe Down' })] }) },
    ],
    hotel_bell: l => [
      { id: 'arrival', every: [16, 24], first: 1, max: 2, patience: 55, make: () => ({ title: 'An arrival', custAt: { tag: 'hotel_reception' }, steps: [l >= 2 && Math.random() < .5 && s('check_in', { mini: mash('Check in', 'Type', 6) }), s('bags_up', { carry: 'box' }), s('call_lift', { any: 1 })] }) },
      { id: 'ask', every: [20, 30], first: 6, patience: 50, make: () => ({ title: 'A guest at the desk', custAt: { tag: 'hotel_concierge' }, steps: [s('where_can_i', { mini: q('"Where can I...?"', pick(ASK_HOTEL)) })] }) },
      { id: 'bell', every: [70, 100], first: 35, make: () => ({ title: 'The brass bell: 710', steps: [s('bell_710'), s('call_lift', { any: 1, name: 'Up to 710' })] }) },
      { id: 'door', filler: 1, make: () => ({ title: 'A quiet lobby', steps: [s('bags_up', { name: 'Straighten the Cart' })] }) },
    ],
    observatory_guide: l => [
      { id: 'visitor', every: [14, 22], first: 2, max: 2, patience: 55, make() { const t = pick(TARGETS);
        return { title: 'A visitor wants ' + t, custAt: { tag: 'obs_ticket_desk' }, steps: [s('tickets'), s('eyes_arrive'), s('find_target', { mini: meter('timing', 'Find ' + t, 'Stop the finder on the mark', 'There') })] }; } },
      { id: 'show', at: [19, 21], make: () => ({ title: 'The planetarium show', steps: [s('run_cues', { mini: mash('Show cues', 'Cue', 7) })] }) },
      { id: 'great', every: [999, 999], first: 150, limit: 1, lvl: 2, make: () => ({ title: 'The Great Telescope', steps: [s('great_scope', { mini: meter('hold', 'Slew the dome', 'Hold to turn it. Let go on the green line.', 'Hold to slew') })] }) },
      { id: 'dark', filler: 1, make: () => ({ title: 'A quiet gallery', steps: [s('eyes_arrive', { name: 'Check the Red Lamps' })] }) },
    ],
    radio_dj: l => [
      { id: 'hour', every: [52, 62], first: 0, make: () => ({ title: 'The next hour', steps: [s('pull_records', { carry: 'box', mini: pickMini('Pull the next hour', 'Three records, in an order that makes sense', ['A slow one to start', 'A warm one', 'A bright one to finish'], ['A jingle', 'The news, again', 'A test tone'], true) }), s('link', { mini: meter('hold', 'Talk up the record', 'Hold to talk over the intro. Let go just before the singing: on the green line.', 'Hold to talk') })] }) },
      { id: 'link', every: [16, 22], first: 10, make: () => ({ title: 'The record is ending', steps: [s('link', { name: 'Back-Announce It', mini: meter('timing', 'Three seconds is a pause', 'Come in on the last note: in the green', 'Speak') })] }) },
      { id: 'call', every: () => (/storm|rain/.test(String(wxKind())) ? [6, 9] : [11, 16]), first: 5, max: 2, patience: 45, make: () => ({ title: 'A line is lit', steps: [s('take_call', { mini: q('On the line', pick(CALLS_IN)) })] }) },
      { id: 'wx', at: [21.17, 22.17, 23.17, 0.17], make: () => ({ title: 'Ten past: the weather', steps: [s('weather', { mini: mash('From the lighthouse', 'Read', 5) })] }) },
      { id: 'tea', every: [999, 999], first: 95, limit: 1, make: () => ({ title: 'Hattie has not had a tea', steps: [s('tea', { mini: mash('Two bags', 'Dunk', 5) })] }) },
      { id: 'quiet', filler: 1, make: () => ({ title: 'A long record', steps: [s('pull_records', { name: 'Put the Sleeves Back' })] }) },
    ],
    teacher: l => [
      { id: 'circle', at: [8.4, 14.2], make: () => ({ title: 'Circle time', steps: [s('carpet')] }) },
      { id: 'lesson', every: [75, 95], first: 22, make() { const L = pick(LESSONS); return { title: 'A lesson: ' + L[0], steps: [s('lesson', { mini: choiceMini('Who can show me?', L[1], L[2], L[3]) }), s('mark', { any: 1, mini: mash('Mark the worksheets', 'Stamp', 6) })] }; } },
      { id: 'hand', every: [15, 22], first: 5, max: 2, patience: 55, make: () => ({ title: pick(['A hand is up', 'Somebody is stuck', 'A small emergency']), steps: [s('mark', { any: 1, name: 'Go and See', mini: q('At the table', pick(ASK_CLASS)) })] }) },
      { id: 'reader', every: [55, 75], first: 40, lvl: 2, make: () => ({ title: 'A reader is waiting', steps: [s('reading')] }) },
      { id: 'twig', every: [999, 999], first: 180, limit: 1, make: () => ({ title: 'Twiglet wants his leaves', steps: [s('nature', { mini: choiceMini('The tank', 'Check that he is in the tank. Check again.', 'There: the twig that is breathing.', ['He has gone. Raise the alarm.', 'That one. No. That is a twig.']) })] }) },
      { id: 'tidy', filler: 1, make: () => ({ title: 'A quiet minute', steps: [s('mark', { any: 1, name: 'Sharpen the Pencils' })] }) },
    ],
    reporter: l => [
      { id: 'story', every: [170, 200], first: 1, make() { const a = pick(ASSIGN);
        return { title: 'Assignment: ' + a[0], steps: [s('take_assignment', { mini: choiceMini('Three slips', 'Max: "Who cares?" Which slip has a person in it?', a[1], a[2]) }), s('go_and_look', { name: 'Go to ' + a[3], mini: gone(null) }),
          s('get_quotes', { name: 'Three Voices at ' + a[3], mini: (v => gone(choiceMini('At ' + a[3], v[0], v[1], v[2])))(pick(VOICES)) }), s('morgue'), s('write_it', { mini: mash('Write it', 'Type', 8) }), s('file')] }; } },
      { id: 'phone', every: [70, 90], first: 80, make: () => ({ title: '150 words from the telephone', steps: [s('write_it', { name: 'Take It Down', mini: mash('Shorthand', 'Write', 6) }), s('file', { name: 'Hand It to Max' })] }) },
      { id: 'tidy', filler: 1, make: () => ({ title: 'Between stories', steps: [s('write_it', { name: 'Check Every Name' })] }) },
    ],
    firefighter: l => [
      { id: 'chores', every: [26, 38], first: 1, make: () => pick([{ title: 'The air bottles', steps: [s('check_gear', { mini: choiceMini('Six gauges', 'One is always low. Which?', 'The fourth: a hair under the line.', ['All of them are fine.', 'The first. It looks at me funny.']) })] }, { title: 'A hose wants rolling', steps: [s('roll_hose', { mini: mash('Roll it tight', 'Roll', 7) })] }, { title: 'Engine 2 shows every fingerprint', steps: [s('wash_engine', { mini: mash('Wash her down', 'Wipe', 7) })] }]) },
      { id: 'cook', at: [20.6], make: () => ({ title: h.now().weekday === 6 ? 'Chili night: you stir' : 'Kitchen duty', steps: [s('cook', { mini: meter('timing', 'The pot', 'Stir before it catches: in the green', 'Stir') })] }) },
      { id: 'bell', every: [140, 210], first: 70, limit: 2, make() { const c = pick(CALLDECK);
        return { title: 'THE BELL: ' + c[0], steps: [s('turnout', { mini: pickMini('Turn out', 'In order: boots, pants, coat, helmet', ['Boots', 'Pants', 'Coat', 'Helmet'], ['Gloves first', 'A hat'], true) }), s('the_call', { name: c[1], mini: gone(choiceMini(c[0], c[2], c[3], c[4]), true) })] }; } },
      { id: 'bunk', when: w => !w.cnt.bunk && (h.now().hf >= 23 || h.now().hf < 3.4), make(w) { w.cnt.bunk = 1; return { title: 'Get your head down', steps: [s('bunk', { pose: 1, onDone: () => { try { G.needs.add('energy', 24); } catch (e) { /* optional */ } } })] }; } },
      { id: 'watch', filler: 1, make: () => ({ title: 'A quiet watch', steps: [s('check_gear', { name: 'Walk the Bay' })] }) },
    ],
    hair_stylist: l => [
      { id: 'cust', every: [18, 26], first: 2, max: 2, patience: 70, make: () => ({ title: l >= 2 ? 'A customer for a cut' : 'A customer for Pops', custAt: { tag: 'barber_chair', mode: 'seat', anim: 'sit' }, steps: [s('shampoo'), l >= 2 ? s('the_cut', { mini: meter('timing', 'The line', 'Lift the clippers on the guide', 'Lift') }) : s('hot_towel', { name: 'Hand Pops the Towel' }), s('hot_towel'), s('ring_up', { custLeave: 1 })] }) },
      { id: 'sweep', every: [22, 30], first: 10, make: () => ({ title: 'Hair on the floor', steps: [s('sweep', { mini: mash('Sweep', 'Sweep', 6) })] }) },
      { id: 'towels', filler: 1, make: () => ({ title: 'An empty chair', steps: [s('hot_towel', { any: 1, name: 'Fold the Towels' })] }) },
    ],
  };
}

/** debug: every station of a job in the CURRENT scene */
export function debugStations(job) { return G.scene && G.scene.fixtures ? stationsFor(job, G.scene) : null; }
