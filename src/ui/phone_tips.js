// Phone app: BAY BASICS — the living-tips handbook (app id 'tips') + the gentle in-game tutorial layer G.tips. Styles in phone_apps.css.
// State G.state.tips = { seen: {tipId: 1}, read: {tipId: 1}, last: t of the last tip notification }
// G.tips = { register(tip) (add a tip from another system), all() -> [tip], get(id), show(id) -> bool (one-time "Tip: ..." notification, max one per game hour), seen(id), go(tip) }
// Deep link: G.phone.open('tips', { tip: id } | { topic: id }).
// A tip: { id, topic, title, text, go?: { app, arg } | { find: navigator query } | { place: id }, goLabel? }
import { G } from '../core/game.js';
import { el, iconEl, btn, section, chip, empty, safe, balance } from './phone_util.js';
import { toast } from './kit.js';
import { regDef, goTo, pickIcon, injectCss } from './phone_store.js';
export const order = 123;

export const TOPICS = [
  ['around', 'Getting around', ['transport.taxi', 'ui.pin'], '#3b82d6'], ['food', 'Food & cooking', ['need.hunger'], '#e0703a'], ['home', 'Home & decorating', ['ui.home', 'mood.cosy'], '#b8794a'],
  ['work', 'Work & money', ['ui.coin'], '#c79a2a'], ['people', 'People', ['need.social', 'ui.heart'], '#e0527a'], ['well', 'Wellbeing', ['need.energy'], '#58a84a'],
  ['out', 'Going out', ['need.fun', 'ui.star'], '#a23b72'], ['phone', 'Phone & apps', ['ui.phone'], '#5b6b8a'],
];
export const TIPS = [
  // getting around
  { id: 'walk', topic: 'around', title: 'Walking', text: 'Tap anywhere on the street and you walk there. Tap a door, a bench or a person and you walk over and use it. Pinch or scroll to zoom the city in and out.' },
  { id: 'navigator', topic: 'around', title: 'Ask the Map "Where to?"', text: 'Open Map and use the Where to? bar: Food, Groceries, Coffee, Home, Work. Pick a place and you get a route card comparing walk, bus, train and cab with times and fares.', go: { app: 'map' } },
  { id: 'waypoint', topic: 'around', title: 'Follow the arrow', text: 'Any "Take me there" button sets a waypoint. An arrow on screen points the way and it clears itself when you arrive.' },
  { id: 'taxi', topic: 'around', title: 'Calling a cab', text: 'Open MapleCab, pick a place you know and confirm the fare. The cab drives to the kerb next to you; tap it to get in. Cabs are the quickest way across town and the dearest.', go: { app: 'taxi' } },
  { id: 'bus', topic: 'around', title: 'Riding the bus', text: 'Walk to a bus stop sign and tap it to see the next buses and board. Buses are cheap but can be a long wait, so check the departures first.', go: { find: 'transit' }, goLabel: 'Nearest stop or station' },
  { id: 'train', topic: 'around', title: 'The light-rail loop', text: 'Eight stations ring the town. Tap the station stairs or lift, choose a destination on the line map and wait on the platform. A single ticket costs the same for any distance.', go: { find: 'transit' }, goLabel: 'Nearest station' },
  { id: 'pass', topic: 'around', title: 'Tickets and passes', text: 'Riding more than twice a day? A day pass or weekly pass covers every train and bus. Buy one at a station panel or in the Bay Transit app.', go: { app: 'transit' } },
  { id: 'wander', topic: 'around', title: 'Wander, the guidebook', text: 'Wander lists every place in town, found or not, with opening hours and what you can do there. Its Stamp Book is a list of things to try.', go: { app: 'guide' } },
  // food
  { id: 'doors', topic: 'food', title: 'Glowing doors and stalls', text: 'A soft glow marks doors you can enter and stalls you can buy from. Tap a market stall or kiosk to shop on the spot without going inside.' },
  { id: 'groceries', topic: 'food', title: 'Buying groceries', text: 'Grocers and corner stores sell ingredients and ready food. Tap the till inside to open the shop. What you buy goes into your bag.', go: { find: 'groceries' }, goLabel: 'Nearest groceries' },
  { id: 'fridge', topic: 'food', title: 'Fill the fridge', text: 'Back home, tap your fridge to put groceries away. Fresh food keeps for a few days in the fridge and spoils faster in your bag.' },
  { id: 'cooking', topic: 'food', title: 'Cooking at home', text: 'Tap the stove to cook from what is in the fridge. Cooking is far cheaper than eating out and each meal raises your Cooking skill, which unlocks better recipes.' },
  { id: 'eatout', topic: 'food', title: 'Eating out', text: 'In a cafe or restaurant, tap the counter or host stand to order, then eat at a table. Good for a quick fill, a treat or meeting a friend.', go: { find: 'food' }, goLabel: 'Nearest food' },
  { id: 'deliveryfood', topic: 'food', title: 'Dinner to your door', text: 'After your first meal at a place that delivers, ZipEats unlocks. Order from home and a courier rings your bell a little later.', go: { app: 'delivery' } },
  { id: 'snacks', topic: 'food', title: 'Snacks on the go', text: 'Carry a granola bar or a drink in your bag. Open the bag and tap it to eat anywhere, handy on a long shift or a long walk.' },
  // home
  { id: 'sleep', topic: 'home', title: 'Sleeping', text: 'Tap your bed to sleep and choose when to wake. A full night restores Energy and a better bed does it faster. Staying up past midnight makes the next day harder.' },
  { id: 'boxes', topic: 'home', title: 'Moving boxes', text: 'New homes and deliveries arrive as boxes on the floor. Tap a box to unpack it and its contents are ready to place.' },
  { id: 'decorate', topic: 'home', title: 'Decorate mode', text: 'At home, open Decorate to move, rotate, store or sell furniture. Cosy rooms give a mood boost every time you are home.', go: { app: 'homes' }, goLabel: 'Open Nestly' },
  { id: 'deliveries', topic: 'home', title: 'Furniture deliveries', text: 'Furniture you buy in a shop is delivered to your home as a box, usually the same day. You get a notification when it lands.' },
  { id: 'moving', topic: 'home', title: 'A better apartment', text: 'Nestly lists every home in town with rent, price and walk times. Rent or buy from the app; a van brings all your furniture over in boxes.', go: { app: 'homes' } },
  { id: 'buying', topic: 'home', title: 'Renting or buying', text: 'Renting is a weekly bill you can leave any time. Buying takes 20% down and a weekly mortgage, then only a small upkeep. Missing a payment just makes the term longer.', go: { app: 'homes' } },
  { id: 'wardrobe', topic: 'home', title: 'Outfits', text: 'Clothes shops sell outfits. Change at your wardrobe or in the Closet app. Work uniforms go on by themselves when a shift starts.', go: { app: 'closet' } },
  // work & money
  { id: 'jobsboard', topic: 'work', title: 'Finding a job', text: 'The Jobs app shows a short list of entry jobs. The full board with every job in town is on the free computers at the library, or on a computer at home.', go: { find: 'library' }, goLabel: 'To the library' },
  { id: 'shift', topic: 'work', title: 'Working a shift', text: 'Be at your workplace when the shift starts and you clock in by walking through the door. Do the tasks that light up; good shifts earn tips and promotion progress.', go: { app: 'jobs' } },
  { id: 'autowork', topic: 'work', title: 'Auto-work', text: 'Not in the mood for the tasks? Tap Auto-work during a shift and the day is worked for you at a steady quality. You are paid the same hourly rate.' },
  { id: 'gigs', topic: 'work', title: 'Gigs for quick cash', text: 'One-off gigs like dog walking pay the same day. Accept one in Jobs and it lands in your Planner.', go: { app: 'jobs' } },
  { id: 'bills', topic: 'work', title: 'Monday bills', text: 'Rent, utilities and your phone plan come out every Monday morning. Bay Bank shows the total in advance. If you are short the balance goes below zero for a while; nobody gets evicted.', go: { app: 'bank' } },
  { id: 'money_low', topic: 'work', title: 'When money is tight', text: 'Cook at home, walk or take the bus, and pick up a gig. Receipts shows where the week\'s money went.', go: { app: 'wallet' } },
  { id: 'saving', topic: 'work', title: 'Saving the game', text: 'The game saves by itself every morning and when you come home. You can also save by hand in Settings.', go: { app: 'settings' } },
  // people
  { id: 'talk', topic: 'people', title: 'Talking to people', text: 'Tap someone and press Talk. Pick what to say: chat, joke, ask about them. What works depends on the person, and the things you learn are remembered.' },
  { id: 'messages', topic: 'people', title: 'Messages', text: 'Friends and family text you with news and invitations. Answer with a tap. The People tab shows hearts, birthdays and where a friend usually is.', go: { app: 'messages' } },
  { id: 'gifts', topic: 'people', title: 'Gifts', text: 'Carry a gift in your bag and choose Give while talking. People have favourites; ask about them to find out. Birthdays count double.' },
  { id: 'invites', topic: 'people', title: 'Invitations', text: 'Invite a friend out from Messages or from the Planner. Accepting an invitation adds it to your Planner; turning up on time is good for the friendship.', go: { app: 'planner' } },
  { id: 'circle', topic: 'people', title: 'Keeping in touch', text: 'Friendships fade slowly if you never see someone. The Circle app shows everyone you know and where they are right now.', go: { app: 'friends' } },
  // wellbeing
  { id: 'needs', topic: 'well', title: 'Your five needs', text: 'Hunger, Energy, Hygiene, Fun and Social drift down through the day. The mood face on screen shows how you feel overall; Wellness has the full picture.', go: { app: 'wellness' } },
  { id: 'needs_tap', topic: 'well', title: 'Tap a low need', text: 'When a need icon shows up on screen, tap it. You get the nearest places that fix it and one tap sets the route.' },
  { id: 'hygiene', topic: 'well', title: 'Staying fresh', text: 'A shower at home takes a few minutes and resets Hygiene. Gyms have showers too.' },
  { id: 'weather', topic: 'well', title: 'Weather', text: 'Rain makes walks slower and soggier, sunny days make parks more fun. Check Skies in the morning and carry an umbrella when rain is due.', go: { app: 'weather' } },
  { id: 'skills', topic: 'well', title: 'Skills', text: 'Doing things makes you better at them: cooking, fitness, charm and more. Higher skills unlock recipes, job levels and gigs.', go: { app: 'wellness' } },
  // going out
  { id: 'shows', topic: 'out', title: 'Films, concerts and plays', text: 'Buy a ticket at the box office of The Orpheum, Symphony Hall or the Lantern Playhouse, wait in the lobby and take a seat when the doors open. Showtime lists what is on.', go: { app: 'showtime' } },
  { id: 'skydeck', topic: 'out', title: 'The SkyDeck', text: 'Ride the lift to the top of the tower for the best view in town. Go at sunset.', go: { find: 'skydeck' }, goLabel: 'To the SkyDeck' },
  { id: 'mall', topic: 'out', title: 'The mall', text: 'Several shops under one roof: clothes, furniture, food court. Handy on a rainy day.', go: { find: 'mall' }, goLabel: 'To the mall' },
  { id: 'events', topic: 'out', title: 'Town events', text: 'Markets, festivals and fireworks are in the Planner calendar and in Wander under What\'s On. Add one to your day so you get a reminder.', go: { app: 'guide', arg: { tab: 'whatson' } } },
  { id: 'parks', topic: 'out', title: 'Benches and parks', text: 'Tap a bench to sit down and rest. Sitting somewhere nice tops up Fun and Energy a little and costs nothing.' },
  // phone
  { id: 'planner', topic: 'phone', title: 'Planner', text: 'Shifts, invitations and events all land in the Planner. Tap an entry to get a route there. Add your own appointments with a reminder.', go: { app: 'planner' } },
  { id: 'store', topic: 'phone', title: 'New apps', text: 'New apps come out on Appy as the days pass and as you try new things. You get a notification; install them for free from the store.', go: { app: 'store' } },
  { id: 'notifications', topic: 'phone', title: 'Notifications', text: 'Tap the clock card at the top of the phone to see everything you missed. Tapping a banner opens the right app.' },
];
const BY_ID = Object.fromEntries(TIPS.map(t => [t.id, t]));
function S() { let s = G.state.tips; if (!s) s = G.state.tips = { seen: {}, read: {}, last: -999 }; s.seen = s.seen || {}; s.read = s.read || {}; return s; }

function go(t, ctx) {
  const g = t && t.go; if (!g) return false;
  if (g.app) {
    if (G.apps && G.apps.hides(g.app)) { const a = G.apps.get(g.app); if (a && a.released) return G.phone.open('store', { app: g.app }); toast(`${(a && a.name) || 'That app'} is not out yet. Keep an eye on Appy.`); return false; }
    if (!G.phone.isUnlocked(g.app)) { toast('That app is not on your phone yet.'); return false; }
    return G.phone.open(g.app, g.arg);
  }
  if (g.place) return goTo(g.place, ctx);
  if (g.find) { const r = safe(() => G.nav.find(g.find, 1), [])[0] || safe(() => G.guide.search(g.find)[0], null), p = r && (typeof r.x === 'number' ? r : safe(() => G.guide.pos(r), null)); if (p) return goTo({ x: p.x, y: p.y, name: r.name || r.title, id: r.placeId }, ctx, r.name || r.title); toast('Could not find one nearby. Try the Map.'); }
  return false;
}
// Pacing of the first hour (owner msg 78): nothing about homes / Nestly while you are still inside the airport; those tips wait in `held` until you step out to the curb.
const AIRPORT_STEPS = ['arrival_plane_cinematic', 'cabin', 'concourse', 'tramride', 'baggage'];
export const inAirportIntro = () => !!(G.intro && G.intro.active && AIRPORT_STEPS.includes(G.intro.at));
const held = [];
function show(id) {
  const t = BY_ID[id], s = S(); if (!t || s.seen[id] || G.onTitle) return false; const now = G.state.t || 0;
  if (inAirportIntro() && (t.topic === 'home' || (t.go && t.go.app === 'homes'))) { if (!held.includes(id)) held.push(id); return false; }
  if (now - (s.last === undefined ? -999 : s.last) < 60 && now >= s.last) return false;
  s.seen[id] = 1; s.last = now;
  safe(() => G.phone.notify({ app: 'tips', title: 'Tip: ' + t.title, text: t.text.split('. ')[0].replace(/\.$/, '') + '.', data: { tip: id }, priority: 'normal' }), 0);
  G.emit('tip', id); return true;
}

/* ---------- app ---------- */
let topic = '';
function tipCard(t, ctx, open) {
  const s = S(), fresh = s.seen[t.id] && !s.read[t.id]; if (open) s.read[t.id] = 1;
  return el('div.tp-card' + (open ? '.hl' : ''), { id: 'tp-' + t.id }, el('b', null, t.title, fresh ? el('em.as-new', { text: 'NEW' }) : null), el('p', { text: t.text }),
    t.go ? btn(t.goLabel || (t.go.app ? 'Show me' : 'Take me there'), () => { s.read[t.id] = 1; go(t, ctx); }, 'tp-go', t.go.app ? 'ui.phone' : 'ui.pin') : null);
}
function render(b, ctx) {
  b.classList.add('as-body'); const s = S(); let focus = null;
  if (ctx.arg && ctx.arg.tip && BY_ID[ctx.arg.tip]) { focus = ctx.arg.tip; topic = BY_ID[focus].topic; ctx.arg.tip = null; }
  if (ctx.arg && ctx.arg.topic) { topic = ctx.arg.topic; ctx.arg.topic = null; }
  if (!topic) {
    b.append(el('div.tp-cover', null, el('b', { text: 'Bay Basics' }), el('span', { text: `${TIPS.length} short tips for life in Maple Bay. Tap a topic, or "Show me" to jump straight there.` })));
    const fresh = TIPS.filter(t => s.seen[t.id] && !s.read[t.id]);
    if (fresh.length) { b.append(section('For you, right now')); for (const t of fresh.slice(-3).reverse()) b.append(tipCard(t, ctx, true)); }
    b.append(section('Topics'));
    const grid = el('div.tp-topics');
    for (const [id, name, icons, col] of TOPICS) grid.append(el('button.tp-topic', { onclick: () => { topic = id; ctx.refresh(); b.scrollTop = 0; } }, el('span.tp-tico', { style: { background: col } }, iconEl(pickIcon(icons), 2)), el('b', { text: name }), el('small', { text: TIPS.filter(t => t.topic === id).length + ' tips' })));
    b.append(grid, el('p.as-note', { text: 'Nobody goes hungry for long, nobody gets evicted. Take the town at your own pace.' }));
    return;
  }
  const T = TOPICS.find(x => x[0] === topic) || TOPICS[0];
  b.append(el('div.nl-filters', null, chip('All topics', '', () => { topic = ''; ctx.refresh(); }), TOPICS.map(x => chip(x[1], x[0] === topic ? 'on' : '', () => { topic = x[0]; ctx.refresh(); }))), section(T[1]));
  for (const t of TIPS.filter(x => x.topic === T[0])) b.append(tipCard(t, ctx, t.id === focus));
  if (focus) requestAnimationFrame(() => { const n = b.querySelector('#tp-' + focus); if (n) b.scrollTop = Math.max(0, n.offsetTop - 60); });
}

function wire() {
  const on = (ev, id, test) => G.on(ev, (...a) => { if (!test || safe(() => test(...a), false)) show(typeof id === 'function' ? id(...a) : id); });
  on('needs:low', 'needs_tap'); on('job:hired', 'shift'); on('job:shift:start', 'autowork'); on('home:delivery', 'boxes'); on('home:move', 'decorate');
  on('money', 'money_low', () => balance() < 50); on('ride:end', 'pass'); on('friend:up', 'gifts');
  /* QA6: tips arrive when they are first useful, not after the thing they explain (QA5: cooking / talking tips came after the first cook / chat).
     cooking: when groceries go into the kitchen, or on coming home at dinner time.  talk: the first time you are inside a place with people
     (not home, not the airport intro), or when Social first runs low. */
  on('fridge:stored', 'cooking');
  G.on('scene', sc => { if (!sc || !G.state.flags || !G.state.flags.introDone || (G.intro && G.intro.active)) return; let home = false; try { home = !!(G.housing && G.housing.isHome && G.housing.isHome(sc.id)); } catch (e) { /* optional */ }
    if (home) { const h = G.now().hf; if (h >= 16.5 && h < 22) setTimeout(() => show('cooking'), 2500); }
    else if (/^int:/.test(sc.id || '') && !/^int:airport/.test(sc.id)) setTimeout(() => show('talk'), 2500); });
  on('needs:low', 'talk', k => k === 'social');
  on('shop:buy', 'fridge', item => { const it = item && (item.id ? item : null); return !it || /ingredient/.test(it.category || it.cat || it.type || 'ingredient'); });
  on('show:ticket', 'shows'); on('bills:soon', 'bills'); on('app:released', 'store'); on('appt:missed', 'planner');
  // Wander is introduced right after Nora's first text (once you have answered her), not at the first "Discovered" toast
  const wander = () => setTimeout(() => { S().last = -999; show('wander'); }, 3500);
  G.on('msg:reply', th => { if (th === 'jules') wander(); }); G.on('intro:done', wander);
  G.on('intro:step', () => { if (!inAirportIntro() && held.length) setTimeout(() => { const id = held.shift(); if (id) { S().last = -999; show(id); } }, 6000); });
  on('weather', 'weather', k => /rain|storm|snow/.test(k)); on('hour', 'sleep', h => h >= 0 && h < 4 && !G.busy);
  on('game:start', 'navigator');
}
export function init() {
  injectCss(); G.defineState('tips', () => ({ seen: {}, read: {}, last: -999 }));
  G.tips = { register: t => { if (t && t.id && !BY_ID[t.id]) { TIPS.push(t); BY_ID[t.id] = t; } return t; }, all: () => TIPS.slice(), get: id => BY_ID[id] || null, show, seen: id => !!S().seen[id], go, topics: () => TOPICS.map(t => ({ id: t[0], name: t[1] })) };
  if (!G.phone || !G.phone.registerApp) return;
  G.phone.registerApp(Object.assign(regDef('tips'), { render, ownsLog: false })); wire();
}
