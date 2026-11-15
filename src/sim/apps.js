// Apps: the app catalogue, install state and the release calendar behind the phone's app store ("Appy", app id 'store').
// State G.state.apps = { installed: {id: day}, released: {id: day}, seen: {id: 1} }
//   installed  apps on the phone's home screen.   released  apps that have come out on the store.   seen  store pages the player has opened.
// G.apps = { catalog() -> [{...def, released, installed, pending, isNew}], get(id), release(id, quiet?) -> bool, install(id) -> bool, uninstall(id) -> bool,
//            isInstalled(id), isReleased(id), pending() -> [id] released but not installed, hides(id) (phone.js hook: app is in the catalogue but not installed),
//            markSeen(id), check() (run the release calendar now), STORE_NAME }
// Events: 'app:released'(id), 'app:installed'(id), 'app:uninstalled'(id).
// Release rules live in CATALOG[].release = { day (1-based game day), on: event name, when(...eventArgs) -> bool, poll() -> bool, text }.
// Calendar releases are paced (one per game hour) so an old save does not get six banners at once; event releases fire at once.
import { G } from '../core/game.js';

export const order = 118;
export const STORE_NAME = 'Appy';
const VENUES = ['cinema', 'concerthall', 'playhouse'];
const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
// Circle counts people you have met who are NOT family (the family is "known" from the first minute)
const friendsMet = () => safe(() => G.social.known().filter(id => !G.social.isFamily(id)).length, 0);

// cat: essentials | home | town | money | people | life.   core = cannot be removed.   pre = on the phone from the start.   soon = teaser only.
export const CATALOG = [
  { id: 'messages', name: 'Messages', cat: 'essentials', core: 1, pre: 1, tagline: 'Who wants me?', size: '12 MB', rating: 4.8, desc: 'Texts, invitations and your People list. Reply with a tap, accept a plan and it lands on My Day.', does: ['Chat threads and quick replies', 'People: hearts, birthdays, where they are', 'Invite a friend out or over'] },
  { id: 'planner', name: 'My Day', cat: 'essentials', core: 1, pre: 1, tagline: 'What is on my day, and what could be?', size: '9 MB', rating: 4.6, desc: 'Your schedule holds what you chose to do. Ideas shows everything you could add, picked for you right now. One tap puts an idea on your day.', does: ['My Schedule: today, tomorrow, this week', 'Ideas from all over town, one tap to add', 'Take me there'] },
  { id: 'map', name: 'Map', cat: 'essentials', core: 1, pre: 1, tagline: 'Where is it, and is it open?', size: '31 MB', rating: 4.7, desc: 'The whole of Maple Bay with a "Where to?" bar that compares walking, bus, train and cab.', does: ['Find the nearest food, shop or station', 'Route cards with fares and times', 'Set a waypoint and follow the arrow'] },
  { id: 'guide', name: 'Wander', cat: 'town', core: 1, pre: 1, tagline: 'Where shall we go?', size: '48 MB', rating: 4.9, desc: 'The Maple Bay guidebook: every cafe, park, hall and hidden corner, with a stamp book of things to try.', does: ['Chapters by kind of place and by district', "What's On agenda", 'Stamp Book'] },
  { id: 'store', name: STORE_NAME, cat: 'essentials', core: 1, pre: 1, tagline: 'What is new?', size: '6 MB', rating: 4.4, iconIds: ['ui.bag', 'ui.sparkle', 'ui.star'], color: '#3b82d6', desc: 'The app store. New apps come out as the weeks go by and as you try new things around town.', does: ['New releases', 'Install and remove apps', 'Coming soon'] },
  { id: 'settings', name: 'Settings', cat: 'essentials', core: 1, pre: 1, tagline: 'Game stuff.', size: '4 MB', rating: 4.1, desc: 'Save and load, sound, text size and photo mode.', does: ['Save slots', 'Options', 'Photo mode'] },
  { id: 'tips', name: 'Bay Basics', cat: 'essentials', pre: 1, tagline: 'How does this town work?', size: '7 MB', rating: 4.8, iconIds: ['ui.info', 'ui.book', 'skill.knowledge', 'ui.sparkle'], color: '#2f9e8f', desc: 'A friendly how-to handbook for life in Maple Bay, with "Show me" links that open the right app or point you to the right door.', does: ['Short tips for every part of town life', 'Show me: jumps straight to the place or app', 'Gentle hints when something new happens'] },
  { id: 'taxi', name: 'MapleCab', cat: 'town', pre: 1, tagline: 'Can someone just drive me?', size: '18 MB', rating: 4.5, desc: 'Call a cab to where you stand and ride anywhere you know.', does: ['Fare quote before you confirm', 'Cab drives to you in the street'] },
  { id: 'bank', name: 'Bay Bank', cat: 'money', pre: 1, tagline: 'How much do I have?', size: '14 MB', rating: 4.3, desc: 'Balance, bills, activity, lease and loans.', does: ['Next Monday\'s bill itemised', 'Last transactions', 'Home and loans'] },
  { id: 'jobs', name: 'Jobs', cat: 'money', pre: 1, tagline: 'How do I earn?', size: '11 MB', rating: 4.2, desc: 'Your job, next shift and the lite jobs board.', does: ['Shift times and promotion progress', 'Apply for entry jobs', 'Gigs'] },
  { id: 'wellness', name: 'Wellness', cat: 'life', pre: 1, tagline: 'How am I doing?', size: '10 MB', rating: 4.6, desc: 'Mood, needs, skills and your journal of firsts.', does: ['Need bars with suggestions', 'Skills', 'Journal'] },
  { id: 'delivery', name: 'ZipEats', cat: 'life', tagline: 'Can dinner come to me?', size: '16 MB', rating: 4.0, desc: 'Dinner to your door, from the places in town that deliver.',
    /* owner msg 112: no more locked apps on the home screen; ZipEats simply appears in the store after your first meal at a place that delivers */
    release: { poll: () => !!(G.state.flags && G.state.flags.ate_at_delivery_venue), text: 'your first meal at a place that delivers' }, does: ['Menus of places that deliver', 'Order to home'] },
  // ---- new apps, released through the store ----
  { id: 'homes', name: 'Nestly', cat: 'home', tagline: 'Where could I live?', size: '22 MB', rating: 4.7, iconIds: ['ui.home', 'ui.house', 'ui.key', 'ui.pin'], color: '#e0703a', release: { day: 1, text: 'day 1' },
    desc: 'Every home in Maple Bay on one list: studios, apartments, lofts, houses and the penthouse. Compare rent, price, size and the walk to work, then rent or buy from the sofa.',
    does: ['Browse and filter all listings', 'Walk times to work, station and groceries', 'Rent or buy with a clear cost sheet', 'My home: rent, upkeep and next bill'] },
  { id: 'weather', name: 'Skies', cat: 'life', tagline: 'Umbrella or sunglasses?', size: '5 MB', rating: 4.5, iconIds: ['weather.partly', 'weather.sun'], color: '#5aa7dd', release: { day: 2, text: 'day 2' },
    desc: 'Today hour by hour and the next three days, with a plain hint about what to wear and what the day is good for.', does: ['Hourly forecast', '3-day outlook', 'What to wear, what to do'] },
  { id: 'transit', name: 'Bay Transit', cat: 'town', tagline: 'When is the next one?', size: '13 MB', rating: 4.4, iconIds: ['transport.train', 'transport.bus', 'ui.ticket', 'ui.pin'], color: '#2f8f5b',
    release: { day: 2, on: 'ride:end', when: kind => kind === 'train' || kind === 'bus', text: 'your first train or bus ride, or day 2' },
    desc: 'Live departures from the nearest station and bus stop, tickets and passes, and the loop line at a glance.', does: ['Next trains and buses near you', 'Buy a ticket, day pass or weekly pass', 'Loop line diagram'] },
  { id: 'showtime', name: 'Showtime', cat: 'town', tagline: 'What is on tonight?', size: '19 MB', rating: 4.6, iconIds: ['ui.ticket', 'ui.mask', 'ui.star'], color: '#a23b72',
    release: { day: 3, on: 'place:discover', when: id => VENUES.some(v => String((id && id.id) || id || '').indexOf(v) >= 0), text: 'finding a cinema or hall, or day 3' },
    desc: 'Films at The Orpheum, concerts at Symphony Hall and plays at the Lantern Playhouse, all on one evening list.', does: ["Tonight's and tomorrow's showings", 'Add to my day', 'Take me there'] },
  { id: 'closet', name: 'Closet', cat: 'life', tagline: 'What shall I wear?', size: '8 MB', rating: 4.3, iconIds: ['outfit_casual', 'ui.shirt', 'ui.hanger', 'ui.heart'], color: '#8a5cc2',
    release: { day: 2, on: 'shop:buy', when: () => safe(() => G.wardrobe.owned().length, 0) >= 2, poll: () => safe(() => G.wardrobe.owned().length, 0) >= 2, text: 'your first clothes, or day 2' },
    desc: 'Every outfit you own in one grid. Change in a tap, wherever you are.', does: ['Outfit grid', 'Wear now', "Today's outfit"] },
  { id: 'friends', name: 'Circle', cat: 'people', tagline: 'How are my people?', size: '15 MB', rating: 4.7, iconIds: ['need.social', 'ui.heart'], color: '#e0527a',
    release: { poll: () => friendsMet() >= 3, on: 'npc:met', when: () => friendsMet() >= 3, text: 'meeting three people' },
    desc: 'Everyone you have met, how close you are, where they are right now and whose birthday is coming up.', does: ['Relationship meters', 'Where are they now', 'Birthdays and quick message'] },
  { id: 'wallet', name: 'Receipts', cat: 'money', tagline: 'Where did it all go?', size: '6 MB', rating: 4.2, iconIds: ['ui.coin'], color: '#c79a2a',
    release: { day: 6, on: 'bills:due', text: 'your first weekly bill, or day 6' },
    desc: 'This week\'s spending sorted into food, transport, home, fun and shopping, with the bills that are due next.', does: ['Spending by category', 'In and out this week', 'Bills due'] },
  { id: 'pages', name: 'Pages', cat: 'life', tagline: 'Something to read?', size: '24 MB', rating: 4.8, iconIds: ['app.pages'], color: '#f4d9a0', release: { day: 1, text: 'day 1' },
    desc: 'A pocket library. Short reads from Maple Bay writers, a harbor mystery in six parts, and every book in your bag, to read on the bus or in a queue. A little Fun; an armchair at home is still better.', does: ['Short reads, page by page', 'Your own novels and skill books', 'Bookmarks, night mode, text size', 'New instalments through the week'] },
  { id: 'reel', name: 'Reel', cat: 'life', tagline: 'What shall we watch?', size: '86 MB', rating: 4.5, iconIds: ['app.reel'], color: '#2a2733', release: { day: 2, text: 'day 2' },
    desc: 'Small-screen shows to watch anywhere, and on your TV at home: a cooking show, a serial, cartoons, nature. Cinema films are different: see one at the Orpheum, and about two days later it turns up here to own.', does: ['Free shows made for the small screen', 'Buy films you have seen at the cinema', 'Play, pause, scrub, fullscreen', 'Stream on your TV at home'] },
  { id: 'playbox', name: 'PlayBox', cat: 'life', tagline: 'Five minutes to spare?', size: '52 MB', rating: 4.4, iconIds: ['app.playbox'], color: '#d9c8f0', release: { day: 3, text: 'day 3' },
    desc: 'Seven small games for one thumb: match three at the market, hop the rooftops as a pigeon, fish off the pier, stack harbor crates. One daily challenge. Good for a ride or a queue; the arcade is the real thing.', does: ['Seven touch games', 'Daily challenge', 'High scores against friends', 'A few cheap extras to unlock'] },
  { id: 'opps', name: 'Opportunities', cat: 'life', core: 1, pre: 1, tagline: 'What could I do today?', size: '7 MB', rating: 4.7, iconIds: ['app.opps', 'ui.opp'], color: '#2fa3a0',
    desc: 'Small things the city puts in your way: a nice evening, a friend short of lemons, something on in town. Say yes to the ones you fancy; nothing is lost by letting one pass.',
    does: ['A few new ones a day', 'Take me there, or a time on My Day', 'Looking back, with stamps'] },
  { id: 'roomy', name: 'Roomy', cat: 'home', tagline: 'What would make it home?', size: '34 MB', rating: 4.8, iconIds: ['app.roomy', 'sofa_t1', 'ui.home'], color: '#d9703a', release: { day: 1, on: 'home:unpack', text: 'your first unpacked box, or day 1' },
    desc: 'Furnish your home from the sofa. Every piece in town, tried in your own room before you buy, delivered in 1 to 4 days.', does: ['Browse by room, kind, style or shop', 'See it in my room', 'Wish list, cart and Express', 'Track every parcel to your door'] },
  { id: 'post', name: 'Maple Post', cat: 'town', tagline: 'Anything for me?', size: '9 MB', rating: 4.7, iconIds: ['app.post', 'post_letter', 'ui.star'], color: '#2756a8', release: { day: 2, on: 'post:mail', text: 'your first post, or day 2' }, desc: 'The post office in your pocket: every letter you have been sent, to read again on paper; tracking for what you post; your stamp album; and the way to the nearest counter.', does: ['Inbox of letters from home', 'Track letters and parcels', 'Stamp album and postcards', 'Take me to the nearest post office'] },
  // ---- teasers ----
  /* REL (add-only, relationships worker): Porchlight, the dating app (ui/phone_porchlight.js; RELATIONSHIPS.md section 9). In the store from day 4, free. */
  { id: 'porchlight', name: 'Porchlight', cat: 'people', tagline: 'Leave a light on.', size: '19 MB', rating: 4.6, iconIds: ['ui.heart'], color: '#2e3a5c', release: { day: 4, text: 'day 4' },
    desc: "Maple Bay's own. Ten or so cards at a time, no swiping, no countdowns. People answer when they have a minute.", does: ['A short stack of real people from town', 'Chat, then suggest meeting: it lands on My Day', 'Who you are open to, in one tap'] },
  { id: 'spark', name: 'Spark', cat: 'people', soon: 1, tagline: 'Somebody out there likes long walks.', iconIds: ['ui.heart'], color: '#e0527a', desc: 'A dating app for Maple Bay. Profiles, first dates at real places, and a town small enough that you will bump into them at the market.' },
  { id: 'campus', name: 'Campus', cat: 'life', tagline: 'What is my next class?', size: '8 MB', rating: 4.6, iconIds: ['skill.logic', 'ui.book', 'ui.star'], color: '#3b5bdb', release: { on: 'university:visit', text: 'your first visit to the university' }, desc: 'Maple Bay University in your pocket: your courses and what is left to do in each, this week\'s timetable, your certificates. Enrol in person at the Registrar.', does: ['Courses, units and coursework', 'This week\'s timetable', 'Certificates and grades', 'Take me to my class'] },
  { id: 'freshfold', name: 'FreshFold', cat: 'home', soon: 1, tagline: 'Laundry, picked up and folded.', iconIds: ['need.hygiene'], color: '#4fb6c2', desc: 'Book a wash at the laundrette or a pick-up from your door. Clean outfits feel better.' },
  { id: 'stride', name: 'Stride', cat: 'life', soon: 1, tagline: 'Every step counts.', iconIds: ['skill.fitness', 'need.energy'], color: '#58a84a', desc: 'A fitness tracker: steps, runs along the River Walk, gym sessions and weekly goals.' },
  { id: 'crumbs', name: 'Crumbs', cat: 'town', soon: 1, tagline: 'Rate every bite in town.', iconIds: ['need.hunger'], color: '#d98a2b', desc: 'Become the food critic. Review the places you eat at and watch the town react.' },
];
export const CATEGORIES = [['essentials', 'Essentials'], ['home', 'Home'], ['town', 'Out & about'], ['money', 'Money & work'], ['people', 'People'], ['life', 'Everyday life']];
const BY_ID = Object.fromEntries(CATALOG.map(a => [a.id, a]));

const fresh = () => ({ installed: Object.fromEntries(CATALOG.filter(a => a.pre).map(a => [a.id, 0])), released: Object.fromEntries(CATALOG.filter(a => a.pre).map(a => [a.id, 0])), seen: {}, lastRel: -9999 });
function S() {
  let s = G.state.apps; if (!s) s = G.state.apps = fresh();
  s.installed = s.installed || {}; s.released = s.released || {}; s.seen = s.seen || {};
  for (const a of CATALOG) if (a.core && s.installed[a.id] === undefined) { s.installed[a.id] = 0; s.released[a.id] = 0; }
  return s;
}
const day = () => safe(() => G.now().day, 0);
const isInstalled = id => S().installed[id] !== undefined;
const isReleased = id => S().released[id] !== undefined;
const hides = id => !!BY_ID[id] && !isInstalled(id);
const pending = () => CATALOG.filter(a => !a.soon && isReleased(a.id) && !isInstalled(a.id)).map(a => a.id);
const refresh = () => safe(() => G.phone.refresh(), 0);

function release(id, quiet) {
  const a = BY_ID[id]; if (!a || a.soon || isReleased(id)) return false;
  const s = S(); s.released[id] = day(); s.lastRel = G.state.t || 0; s.perDay = s.perDay || {}; s.perDay[day()] = (s.perDay[day()] || 0) + 1; G.emit('app:released', id);   /* QA6: every release counts toward the first week's 2-a-day */
  if (!quiet) safe(() => G.phone.notify({ app: 'store', title: 'New app: ' + a.name, text: `${a.name} is now on ${STORE_NAME}. Tap to install it.`, data: { app: id }, priority: 'normal' }), 0);
  refresh(); return true;
}
function install(id) {
  const a = BY_ID[id]; if (!a || a.soon || !isReleased(id) || isInstalled(id)) return false;
  S().installed[id] = day(); S().seen[id] = 1; G.emit('app:installed', id); refresh(); return true;
}
function uninstall(id) {
  const a = BY_ID[id]; if (!a || a.core || !isInstalled(id)) return false;
  delete S().installed[id]; G.emit('app:uninstalled', id); refresh(); return true;
}
function catalog() {
  const s = S(), d = day();
  return CATALOG.map(a => Object.assign({}, a, { released: s.released[a.id] !== undefined, releasedDay: s.released[a.id], installed: s.installed[a.id] !== undefined, pending: !a.soon && s.released[a.id] !== undefined && s.installed[a.id] === undefined,
    isNew: !a.pre && s.released[a.id] !== undefined && d - s.released[a.id] < 7 }));
}
// the calendar + polled conditions; at most one release per game hour
function check() {
  if (G.onTitle) return;
  if (G.intro && G.intro.active && ['arrival_plane_cinematic', 'cabin', 'concourse', 'tramride', 'baggage'].includes(G.intro.at)) return;   // no app releases (Nestly, Circle...) while you are still in the airport (owner msg 78)
  const s = S(), t = G.state.t || 0, h = safe(() => G.now().hour, 12), early = day() < 7;
  /* QA6 (calm first week): calendar / polled releases only while you are up and about (08:00-21:00, never asleep, so nothing piles up overnight),
     at least 5 game hours apart and at most 2 a day (event releases included) during the first week; afterwards one an hour as before. Event releases still fire at once. */
  if (h < 8 || h >= 21 || safe(() => G.needs.sleeping, false)) return;
  if (t - (s.lastRel || -9999) < (early ? 300 : 60) && t >= (s.lastRel || 0)) return;
  s.perDay = s.perDay || {}; if (early && (s.perDay[day()] || 0) >= 2) return;
  for (const a of CATALOG) {
    const r = a.release; if (!r || isReleased(a.id)) continue;
    if ((r.day && day() + 1 >= r.day) || (r.poll && safe(r.poll, false))) { release(a.id); return; }
  }
}

export function init() {
  G.defineState('apps', fresh);
  G.apps = { catalog, get: id => catalog().find(a => a.id === id) || null, release, install, uninstall, isInstalled, isReleased, pending, hides, check, markSeen: id => { S().seen[id] = 1; }, STORE_NAME, CATEGORIES };
  const evs = {};
  for (const a of CATALOG) if (a.release && a.release.on) (evs[a.release.on] = evs[a.release.on] || []).push(a);
  for (const ev of Object.keys(evs)) G.on(ev, (...args) => { for (const a of evs[ev]) if (!isReleased(a.id) && (!a.release.when || safe(() => a.release.when(...args), false))) release(a.id); });
  G.on('hour', () => check()); G.on('intro:step', () => setTimeout(check, 5000));
  for (const ev of ['game:start', 'load', 'game:load']) G.on(ev, () => setTimeout(check, 4000));
  setTimeout(check, 6000);
}
