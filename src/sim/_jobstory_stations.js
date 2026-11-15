// _jobstory_stations.js — where the NEW jobs work (helper of sim/_jobs_work.js; rows: story/jobs_new.js NEW_JOBS).
//
// The new jobs' station tags (gate_desk, florist_bench, barber_chair ...) are not on any fixture: the rooms were built before the jobs were written, and room
// files belong to other owners. So nothing in a room file is touched: STATIONS names, for every station of every new job, an EXISTING fixture of the job's room
// (by function tag or by asset id, the nearest one to a point when several exist) or, where the room has nothing suitable, a spot on the floor. At the start of a
// shift stationsFor(job, scene) adds the private tag 'js:<job>:<station>' to those fixtures (in memory, on the live scene only) and the work engine looks
// stations up by that tag. A spot becomes a small invisible fixture that only the work engine sees.
//
//   STATIONS[jobId][station] = [selector, x?, y?] | [[selector, x?, y?], ...]
//       selector  'tag'            fixtures carrying that function tag            /regex/  fixtures whose asset id matches            '@' a floor spot at (x, y)
//       x, y      world coordinates (room coordinates + 1). With a point: the ONE nearest match. Without: every match (the work engine picks among them).
//   stationsFor(job, scene) -> { [station]: n fixtures }          (also used by G.jobStory.debug.stations())
//   newScripts(h) -> { [jobId]: level => templates }              ticket scripts in the shape of _jobs_work.js SCRIPTS (h = its small builders)
//
// Adding a job: a row in STATIONS (every station of its workLoop.stations) and a script below. Run G.jobStory.debug.stations(jobId) inside the room to see what resolved.
import { G } from '../core/game.js';

export const STATIONS = {
  gate_agent: {            /* int:airport:concourse — gate B3 */
    gate_desk: ['gate_desk', 21, 2.3], boarding_door: [/airport\.gatedoor/, 23.5, 1.1], info_desk: ['flight_board', 19.5, 12.7] },
  baggage_handler: {       /* int:airport:terminal — baggage claim */
    bag_cart: ['bag_cart'], baggage_carousel: ['carousel_island'], oversize_desk: ['oversize_desk'], lost_found: ['lost_found'] },
  station_agent: {         /* int:central_station */
    platform_edge: ['@', 17.2, 3.8],        /* a spot by the gates, looking down at the platforms (the departures portal on the wall cannot be reached) */ station_info: ['info', 14.8, 18], ticket_gate: ['gates', 15, 2.4], lost_property: ['lockers', 22.5, 1.8], announcer_booth: ['tickets', 2.1, 7.5] },
  retail_associate: {      /* int:deptstore — the Thread & Co. Outlet bay */
    folding_table: [/clothing\.foldtable/], clothes_rack: [/clothing\.(round)?rack/], fitting_room: [/clothing\.mirror/, 27.8, 1.8], mallcounter: ['mallcounter', 29.5, 2.3], shop_window: [[/clothing\.mannequin/, 25.8, 5.3], [/clothing\.mannequin/, 27.3, 5.8]] },
  museum_guide: {          /* int:museum */
    mus_info_desk: ['mus_ticket'], mus_gallery_post: ['mus_audio'], mus_exhibit: ['mus_ex'], mus_dig_pit: ['mus_dig'] },
  florist: {               /* int:conservatory — Garden Gifts, by the seedling tables */
    flower_buckets: ['cons_seedling'], florist_bench: ['cons_shop', 8, 22.8], conservatory_shop_till: ['cons_shop', 3, 22.8], flower_cooler: [/cons\.shelf/, 8, 21.7], delivery_door: ['cons_gate', 15.8, 21.1] },
  aquarist: {              /* int:aquarium */
    aq_penguin_cove: ['aqua_penguins'], aq_touch_pool: ['aqua_touchpool'], aq_octopus_den: ['aqua_coltank'], aq_fish_kitchen: ['aqua_feeder'], aq_water_lab: ['aqua_bigtank'] },
  gull_cook: {             /* int:restaurant — the pass is the kitchen's window; the kitchen itself is behind it */
    gull_pass: ['pass_window'], gull_stove: ['pass_window'], gull_prep: [/restaurant\.winerack/, 3.8, 1.3], gull_walk_in: [/generic\.door/, 6, 1.1], gull_back_door: ['host'] },
  hotel_bell: {            /* int:hotel — the Grand Lobby */
    hotel_luggage_cart: ['hotel_cart'], hotel_reception: ['hotel_reception'], hotel_concierge: ['hotel_desk', 9.3, 11.4], hotel_lift: ['hotel_lift'], hotel_bell_710: ['hotel_bell'] },
  observatory_guide: {     /* int:observatory — the gallery floor */
    obs_small_scope: [/obs\.scopecase/], obs_great_scope: ['obs_stairs'], obs_planetarium_desk: ['obs_lectern'], obs_ticket_desk: ['obs_ticket'], obs_terrace: ['obs_pendulum'] },
  hair_stylist: {          /* int:pub:22 — Otis & Sons Barbershop */
    barber_chair: [/barber\.armchair/], barber_station: [/barber\.station/], barber_sink: ['browse'], barber_floor: [/generic\.rug/], barber_till: ['till'] },
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
    const tag = 'js:' + job.id + ':' + st, sels = Array.isArray(M[st][0]) && !(M[st][0] instanceof RegExp) ? M[st] : [M[st]]; let n = 0;
    for (const sel of sels) for (const fx of matchOne(scene, sel)) { if (!fx.tags.includes(tag)) fx.tags.push(tag); n++; }
    out[st] = n;
  }
  return out;
}

/* ---------- ticket scripts for the new jobs (same shape as _jobs_work.js SCRIPTS; all names / minutes / bonuses come from the job rows) ---------- */
const CITIES = ['Port Ansel', 'Lakehead', 'Saint-Remy', 'Carrow', 'Pinehollow Field', 'Nine Mile Key'];
const ASK_GATE = [['Where is gate B2?', 'Two gates back, past the koi pond.', ['No idea, sorry.', 'B2 moved to another airport.']], ['Is there coffee past here?', 'Bay Brew, by the green wall. They open at five.', ['Coffee is not allowed.', 'Try the vending machine. Good luck.']], ['Has my flight boarded?', 'Not yet. I will call your row. Sit, you have time.', ['Probably.', 'Hard to say with planes.']]];
const ASK_STN = [['Which platform for the Harbor line?', 'Platform 2, down the left stair.', ['Platform nine and a half.', 'Any of them, eventually.']], ['Is the 6:42 on time?', 'To the minute. It is the clock that is fast.', ['It has never been on time.', 'Which 6:42?']], ['Where do I change for the airport?', 'Stay on. The Loop runs through to the Airport stop.', ['You cannot get there from here.', 'Take a cab, honestly.']]];
const ASK_MUS = [['Is the big skeleton real?', 'Marge is real bone from the neck back. Come and see the join.', ['It is plastic.', 'Please do not ask about Marge.']], ['Where do the children dig?', 'The dig pit, left of the Hall. Brushes are in the tray.', ['Nowhere. No digging.', 'Outside, probably.']], ['What should I not miss?', 'The harbor model. It lights up at the hour.', ['The exit.', 'Everything is roughly the same.']]];
const ASK_HOTEL = [['Somewhere quiet to read?', 'The lounge by the piano, before four.', ['The lift.', 'We do not do quiet.']], ['Breakfast before six?', 'Dot\'s Diner opens at five. Two blocks, pink sign.', ['Nothing opens before six.', 'Room service, at noon.']], ['A present for a nine-year-old?', 'Toy Galaxy, in the Galleria. Ask for the rocket kits.', ['The minibar.', 'Cash is traditional.']]];
const FLOWERS = ['Tulips', 'Ranunculus', 'Eucalyptus', 'Stock', 'Ferns', 'Peonies', 'Wax flower', 'Roses'];
const DIETS = [['the penguins', ['Herring', 'Sprats', 'Vitamins']], ['the sea turtle', ['Lettuce', 'Squid', 'Shrimp']], ['the touch pool', ['Mussels', 'Kelp', 'Shrimp']]];
const FOODS = ['Herring', 'Sprats', 'Vitamins', 'Lettuce', 'Squid', 'Shrimp', 'Mussels', 'Kelp'];
const TABLES = [['Table four', ['Sea bass', 'Lamb', 'Risotto']], ['Table seven', ['Scallops', 'Duck', 'Greens']], ['Table two', ['Mussels', 'Sea bass', 'Fennel']]];
const DISHES = ['Sea bass', 'Lamb', 'Risotto', 'Scallops', 'Duck', 'Greens', 'Mussels', 'Fennel'];
const TARGETS = ['Saturn', 'the Moon', 'the Pleiades', 'Jupiter', 'the Ring Nebula'];
const TAGS = [['a red tag', 'Carousel 1'], ['a blue tag', 'Carousel 2'], ['a yellow tag', 'Carousel 3'], ['a pair of skis', 'Oversize']];

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
      { id: 'train', every: [22, 30], first: 2, make: () => ({ title: 'A train is in', steps: [l >= 2 && s('announce', { mini: mash('The announcement', 'Speak', 6) }), s('dispatch', { mini: meter('timing', 'Along the train', 'Raise the flag when the last door is shut: in the green', 'Flag up') })] }) },
      { id: 'ask', every: [12, 18], first: 1, max: 2, patience: 40, make: () => ({ title: 'Somebody is lost', custAt: { tag: 'station_info' }, steps: [s('which_platform', { mini: q('At the information desk', pick(ASK_STN)) })] }) },
      { id: 'gate', every: [35, 50], first: 12, patience: 45, make: () => ({ title: 'A ticket is stuck in the gate', custAt: { tag: 'ticket_gate' }, steps: [s('stuck_ticket', { mini: mash('The gate', 'Jiggle', 5) })] }) },
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
    hair_stylist: l => [
      { id: 'cust', every: [18, 26], first: 2, max: 2, patience: 70, make: () => ({ title: l >= 2 ? 'A customer for a cut' : 'A customer for Pops', custAt: { tag: 'barber_chair', mode: 'seat', anim: 'sit' }, steps: [s('shampoo'), l >= 2 ? s('the_cut', { mini: meter('timing', 'The line', 'Lift the clippers on the guide', 'Lift') }) : s('hot_towel', { name: 'Hand Pops the Towel' }), s('hot_towel'), s('ring_up', { custLeave: 1 })] }) },
      { id: 'sweep', every: [22, 30], first: 10, make: () => ({ title: 'Hair on the floor', steps: [s('sweep', { mini: mash('Sweep', 'Sweep', 6) })] }) },
      { id: 'towels', filler: 1, make: () => ({ title: 'An empty chair', steps: [s('hot_towel', { any: 1, name: 'Fold the Towels' })] }) },
    ],
  };
}

/** debug: every station of a job in the CURRENT scene */
export function debugStations(job) { return G.scene && G.scene.fixtures ? stationsFor(job, G.scene) : null; }
