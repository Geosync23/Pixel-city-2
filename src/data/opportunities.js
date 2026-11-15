// opportunities.js — the Opportunity pool: the game's optional "little things that come up" (never called missions or quests).
// Pure design data. The engine is src/sim/opportunities.js (G.opps), the phone app src/ui/phone_opps.js.
//
// A ROW (built with the helpers of opportunities_kit.js; rows live in opportunities_a.js and opportunities_b.js)
//   id        unique.            src   'need' | 'home' | 'people' | 'place' | 'event' | 'job' | 'weather' | 'season' | 'story' (SOURCES below)
//   title     short name for lists and the Goals widget.        text   the warm offer, one to three short sentences.
//   at        where the arrow leads:  a place id ('cafe', 'poi_lookout') | '@Exact Place Name' (generated shops and park spots) | 'home' |
//             'npc:<castId>' (wherever that person is; 'npc:boss' = your boss) | 'green' (nearest park-like spot) | 'new' (nearest place you have
//             never been) | 'near:<kind>' (G.nav.find kind: coffee, food, groceries...) | 'supplies' (nearest shop with what is running low) |
//             'event' (the place of a calendar event that is on today) | null (anywhere).
//   do        what completes it — { type: 'visit', stay (game minutes there), r (radius outdoors) } | { type: 'use', label, minutes?, anim?,
//             bring?: [itemId, qty], pay?, lines?: [text], npc?, find? } a button on the person / counter / spot | { type: 'act', act: id | [ids] |
//             're:<regex>', here?, min? } | { type: 'buy', item: id | 'cat:<category>' | 're:<regex>' | 'any', here? } | { type: 'ev', ev: name |
//             [names], a0? (first event argument), here? } | { type: 'talk', npc }.   `here` = must happen at the opportunity's place.
//   when      all must hold for it to be OFFERED: h [from, to] (hours; may wrap midnight), wd [weekdays 0 = Mon], season [0-3], dom [from, to] (day
//             of the 14-day month), wx / notWx [weather kinds], need { id: [lo, hi] }, clean [lo, hi] (home cleanliness), sup { key: min uses },
//             supLow, has / lacks (item in the backpack), homeTag (a home good with that function tag is placed), job (true | false), ml (moodlet
//             active), minDay (days since arrival), open (the place is open now), npcOut (that person is out where you can reach them),
//             event (calendar event id on today), eventAny, flag.
//   reward    { money, needs: { id: points }, rel: { castId: points }, item: [itemId, qty], xp: { skill: n }, moodlet, stamp }   (always small)
//   extras    ttl (hours the offer stands, default TUNE.ttl) | until (hour of today it closes), appt { wd?, h, dur } (accepting adds a Planner
//             appointment; it can only be done in that window), once (never again), wt (weight), first (the tutorial one), repeat (not part
//             of the no-repeat cycle: the low-supplies errand).
// The same shape (JSON only, no functions) is what a story step passes to G.opps.offer({...}).
import { POOL_A } from './opportunities_a.js';
import { POOL_B } from './opportunities_b.js';

export const TUNE = {
  perDay: 4,            // offers a day at most ...
  lightDayShare: 0.45,  // ... on this share of days one fewer (so it is 3 or 4, never a flood)
  firstDay: 2,          // ... and on your first day in town
  gap: 150, jitter: 90, // game minutes between two offers (+ up to jitter)
  quiet: [21.9, 7.5],   // no new offers at night
  maxOffered: 2,        // unanswered offers waiting at once; more are held back
  maxOpen: 5,           // offered + accepted together
  ttl: 8,               // hours an offer (and then the accepted opportunity) stands when the row gives no deadline
  acceptedDays: 3,      // rows with `ttl: 0` (no deadline) stay accepted this long
  cycleAt: 0.5,         // "no repeats until the pool cycles": when nothing unused fits and at least this share of the pool has been offered, start over
  cooldownDays: 6,      // after a cycle, nothing offered in the last N days comes back yet
  lastSrcMult: 0.3,     // weight of a row whose source was one of the last two offers (variety)
  needBoost: 3,         // weight of a row whose need condition is true right now
  timelyBoost: 1.5,     // weight of a row tied to weather / an event / a weekday
  r: 8,                 // default "you are there" radius for outdoor places (city units)
  rewardScale: 1,
};
export const SOURCES = {
  need: { name: 'How you feel', icon: 'need.mood' }, home: { name: 'Home', icon: 'ui.broom' }, people: { name: 'People', icon: 'need.social' }, place: { name: 'Around town', icon: 'need.outdoors' },
  event: { name: "What's on", icon: 'need.fun' }, job: { name: 'Work', icon: 'need.money' }, weather: { name: 'Weather', icon: 'weather.partly' }, season: { name: 'Time of year', icon: 'need.inspiration' }, story: { name: 'Your story', icon: 'ui.opp' },
};
// Stamps for the Wander stamp book (group "Opportunities"): milestones, one per source, and the special ones some rows give.
export const STAMPS = [
  { id: 'x:opp_first', title: 'Say Yes Once', blurb: 'Take up your first Opportunity.', glyph: 'stamp' },
  { id: 'x:opp_5', title: 'Five Small Yeses', blurb: 'See five Opportunities through.', glyph: 'stamp', count: 5 },
  { id: 'x:opp_15', title: 'In the Habit', blurb: 'See fifteen Opportunities through.', glyph: 'stamp', count: 15 },
  { id: 'x:opp_40', title: 'A Life Full of Small Things', blurb: 'See forty Opportunities through.', glyph: 'stamp', count: 40 },
  { id: 'x:opp_people', title: 'Good Neighbour', blurb: 'Do something for someone, three times.', glyph: 'cup', src: 'people', count: 3 },
  { id: 'x:opp_place', title: 'Out and About', blurb: 'Follow three Opportunities to places around town.', glyph: 'tower', src: 'place', count: 3 },
  { id: 'x:opp_weather', title: 'Whatever the Weather', blurb: 'Take up three Opportunities the weather offered.', glyph: 'tree', src: 'weather', count: 3 },
  { id: 'x:opp_home', title: 'House Proud', blurb: 'Look after your home, three times.', glyph: 'key', src: 'home', count: 3 },
  { id: 'x:opp_dusk', title: 'Golden Hour', blurb: 'Stand at the River Lookout as the lamps come on.', glyph: 'tree' },
  { id: 'x:opp_stars', title: 'A Clear Night', blurb: 'Visit the observatory on a cloudless evening.', glyph: 'tower' },
  { id: 'x:opp_snow', title: 'First Footprints', blurb: 'Cross the meadow in fresh snow.', glyph: 'tree' },
  { id: 'x:opp_falls', title: 'The Orange Tunnel', blurb: 'See Maple Falls in autumn colour.', glyph: 'tree' },
  { id: 'x:opp_dawn', title: 'Pink City', blurb: 'Watch the sun come up from Hillcrest Lookout.', glyph: 'tower' },
  { id: 'x:opp_light', title: 'To the Lamp', blurb: 'Go out to the lighthouse because the day asked you to.', glyph: 'tower' },
  { id: 'x:opp_fair', title: 'Shoeboxes of Stamps', blurb: 'Browse the Saturday stamp fair at the General Post Office.', glyph: 'stamp' },
];
export const POOL = [...POOL_A, ...POOL_B];
export const POOL_BY_ID = Object.fromEntries(POOL.map(o => [o.id, o]));
