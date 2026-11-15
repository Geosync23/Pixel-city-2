// Wander — the Maple Bay guidebook: the CONTENT INDEX behind the phone app (src/ui/phone_guide.js).
// Built at runtime from what really exists (G.places, G.publicPlaces, G.showpieces, G.shows, G.rail, city pois, data/activities, data/calendar),
// so it stays current as content is added. Rebuilt lazily after 'scene' / 'places:built' and on demand.
// Entry: { id, kind: 'place'|'activity'|'event'|'show'|'transit', title, type (label), chapter, also[] (extra chapters), tags[], district, address, blurb,
//          hours? (7 x [open, close]|null), price? ('Free'|'$'|'$$'|'$$$'|text), placeId? (waypoint / taxi target), x?, y?, poi?, room?, venueId?, when? (text),
//          glyph (vignette key), icon, thumb ('bld'|'glyph'), acts? [entry ids you can do there], where? [entry ids where you can do it], parent?,
//          signature? (text), tryThis? [text] }   signature / tryThis / blurb of hand-made rooms come from placeInfo(name) (src/scenes/rooms/unique_rooms.js:
//          the 53 converted public places, the 46 lobbies, the conservatory). Venue activities with venues ['*'] are linked to the places whose info lists
//          the activity id or its fixture tag.
// API G.guide: all(), get(id), byChapter(ch), byDistrict(key), near(x, y, n), search(text), whatsOn(day?), times(entry, days=7), thingsToTry(), stats(), rebuild(),
//   openNow(entry) -> { open: bool|null, text }, pos(entry) -> {x, y}|null, nearestTransit(entry) -> { station, stop }, stamp(id) (debug/manual),
//   fav(id, on?) / isFav(id) / favs(), chapters(), districts().
// State G.state.guide = { stamps: { id: day }, seen: { entryId: 1 }, favs: [entryId] }.  Events: 'guide:stamp'(id, item), 'guide:rebuilt'.
import { G } from '../core/game.js';
import { VENUE_BY_ID, DISTRICTS, isOpen as venueOpen } from '../data/venues.js';
import { ACTIVITIES } from '../data/activities.js';
import { ITEM_BY_ID } from '../data/items.js';
import { EVENTS, eventOnDay } from '../data/calendar.js';
import { CHAPTERS, DISTRICT_INFO, TYPE_INFO, KIND_LABEL, CORE, CORE_BLURB, SPOT, LANDMARK_BLURB, ACT_ALSO, ACT_SKIP, ACT_BLURB, EXPERIENCES, STAMP_GROUPS, pick, hash } from './_guide_data.js';
import { placeInfo } from '../scenes/rooms/unique_rooms.js';
export const order = 96;
const DAY = 1440, safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const DNAME = Object.fromEntries(DISTRICTS.map(d => [d.id, d.name]));
const cap = s => String(s || '').replace(/^./, c => c.toUpperCase());
const hh = h => { const m = Math.round(((h % 24) + 24) % 24 * 60); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
let S = null, list = [], byId = new Map(), dirty = true, sig = '', stampDefs = [], stampById = new Map();
const city = () => safe(() => G.sceneCache.get('city').world, null);
const fillT = (t, e) => String(t).replace('{n}', e.title).replace('{d}', DNAME[e.district] || 'Maple Bay');
const priceOf = v => (!v ? null : v.priceMult <= 0.85 ? '$' : v.priceMult >= 1.15 ? '$$$' : '$$');
const TAILS = ['', '', ' A neighbourhood favourite.', ' Locals swear by it.', ' Easy to miss; do not.', ' Worth the walk.'];

function add(e) {
  if (!e || !e.id || byId.has(e.id)) return null;
  if (e.x == null || e.y == null) { delete e.x; delete e.y; }
  e.also = e.also || []; e.tags = e.tags || []; e.icon = e.icon || 'ui.pin'; e.glyph = e.glyph || 'stamp'; e.blurb = e.blurb || '';
  if (!e.district && e.x !== undefined) e.district = safe(() => city().districtAt(e.x, e.y), null);
  if (!e.address && e.x !== undefined) e.address = (e.poi && e.poi.address) || safe(() => G.address.of(e.poi || { x: e.x, y: e.y }).text, '');
  list.push(e); byId.set(e.id, e); return e;
}
function placeEntry(p, pub) {
  const v = p.venue || VENUE_BY_ID[p.id] || null, core = CORE[p.id];
  let chapter, type, glyph, also = [], blurb = (v && v.blurb) || '', tags = [];
  if (core) { [chapter, type, glyph] = core; also = core[3] || []; blurb = blurb || CORE_BLURB[p.id] || ''; }
  else if (pub || (v && v.tpl)) {
    const tpl = pub ? pub.tpl : v.tpl, k = (pub ? pub.kind : v.kind) || '', ti = TYPE_INFO[k] || TYPE_INFO[pub && pub.walkup ? 'stall' : tpl] || TYPE_INFO.retail;
    type = KIND_LABEL[k] || ti[0]; glyph = ti[1]; tags.push(tpl, k);
    chapter = ['cafe', 'bakery', 'diner', 'eatery', 'restaurant'].includes(tpl) ? 'eat' : tpl === 'bar' ? 'shows' : tpl === 'service' ? 'services' : k === 'gallery' || k === 'art' ? 'arts' : k === 'pharmacy' ? 'services' : 'shop';
    if (tpl === 'bar') also = ['eat']; if (tpl === 'books' || k === 'gallery' || k === 'art') also = ['arts', 'shop']; if (k === 'pharmacy') also = ['shop'];
    if (pub && pub.walkup) { type = (KIND_LABEL[k] || 'Street food') + ' window'; tags.push('street food'); }
    const e0 = { title: p.name, district: p.district }; blurb = blurb ? blurb + fillT(pick(TAILS, p.id), e0) : fillT(pick(ti[2], p.id), e0);
  } else if (p.kind === 'stall') { const food = !v || !v.offers || v.offers.menu || /stand_/.test(p.id); chapter = food ? 'eat' : 'shop'; type = p.id === 'market_stalls' ? 'Open-air market' : 'Street stand'; glyph = food ? 'cup' : 'bag'; tags.push('street food'); if (p.id === 'market_stalls') also = ['shop', 'sights']; }
  else { const t = v && v.type; chapter = { food: 'eat', shop: 'shop', service: 'services', leisure: 'shows', workplace: 'services', transit: 'transit' }[t] || 'sights'; type = cap(t || 'Place'); glyph = { eat: 'cup', shop: 'bag', services: 'key', shows: 'mask', transit: 'train' }[chapter] || 'tower'; }
  if (v && v.type === 'workplace') tags.push('work', 'jobs');
  const e = { id: 'place:' + p.id, kind: 'place', title: p.name, type, chapter, also, tags, district: p.district, blurb, hours: v && v.hours, price: v && (v.type === 'food' || v.type === 'shop' || v.type === 'stall' || pub) ? priceOf(v) : null,
    placeId: p.id, x: p.x, y: p.y, poi: p.poi, room: p.roomId || (p.poi && p.poi.room), venueId: v && v.id, glyph, icon: 'ui.pin', thumb: 'bld' };
  if (p.id === 'library') { e.price = 'Free'; e.tags.push('jobs', 'computers'); e.blurb += ' The public computers upstairs carry the full city job board.'; }
  if (p.id === 'skydeck_lobby') e.price = safe(() => G.money.fmt(8), '$8') + ' day ticket';
  const inf = placeInfo(p.name), lob = p.lobby || (p.poi && p.poi.lobby);
  if (lob) { const off = lob === 'office'; e.type = off ? 'Office lobby' : 'Apartment lobby'; e.chapter = 'sights'; e.also = off ? ['services'] : []; e.glyph = 'tower'; e.price = 'Free'; e.tags.push('lobby', off ? 'office' : 'apartment');
    const hr = (inf && inf.hours) || (off ? [7, 20] : null); e.hours = Array(7).fill(hr || [0, 24]); }
  if (inf) { if (inf.blurb) e.blurb = inf.blurb; if (inf.signature) e.signature = inf.signature; if (inf.tryThis && inf.tryThis.length) e.tryThis = inf.tryThis.slice(); e._inf = inf; if (pub) e._tpl = pub.tpl; }
  if (!e.blurb) e.blurb = fillT(pick(LANDMARK_BLURB, e.id), e);
  return add(e);
}
// converted public places behave like the classic venue they were built as (same table as src/sim/activities.js PUB_ALIAS)
const PUB_ALIAS = { cafe: 'cafe', bakery: 'bakery', diner: 'diner', eatery: 'restaurant', restaurant: 'restaurant', bar: 'bar', books: 'bookstore', boutique: 'clothing' };
const infoHas = (e, a) => !!(e._inf && (e._inf.activities || []).some(x => x === a.id || x === a.tag));
// extra Things To Try for the Botanical Conservatory (stamped from its own events in wire()); the three it registers itself stay as they are
const CONS_X = [
  { id: 'x:cons_sketch', title: 'Sketch the Orchids', glyph: 'leaf', blurb: 'Settle at the sketching spot in the orchid grotto. Your drawing gets pinned to the board for everyone to see.' },
  { id: 'x:cons_tour', title: 'Join the Glasshouse Tour', glyph: 'leaf', blurb: 'Wendell the docent leads a walk through every zone at 10:00, 13:00 and 16:00. Tap him to tag along.' },
  { id: 'x:cons_plaques', title: 'Read All Twelve Plaques', glyph: 'book', blurb: 'Every bed in the Conservatory has a little brass plaque. Collect all twelve facts.' },
  { id: 'x:cons_breathe', title: 'Sit and Breathe', glyph: 'leaf', blurb: 'Find a bench under the palms, close your eyes and listen to the misters hiss.' },
  { id: 'x:cons_seedling', title: 'Take a Seedling Home', glyph: 'leaf', blurb: 'Garden Gifts sells little house plants that grew up in the glasshouse. They come to your door.' },
  { id: 'x:cons_wish', title: 'Make a Wish at the Lily Pool', glyph: 'stamp', blurb: 'Toss a coin into the Victoria lily pool. Once a day; the koi pretend not to notice.' },
  { id: 'x:cons_cuttings', title: 'Help Hattie the Gardener', glyph: 'leaf', blurb: 'The head gardener is looking for three curious plants growing wild around the city. Ask her in the glasshouse.' },
];
const CONS_GROUP = 'The Glasshouse';
function consStamps() {
  for (const x of CONS_X) if (!EXPERIENCES.some(e => e.id === x.id)) EXPERIENCES.push(Object.assign({ group: CONS_GROUP, place: 'place:conservatory', need: 'conservatory' }, x));
  for (const x of EXPERIENCES) if (/^x:cons_/.test(x.id)) x.group = CONS_GROUP;   // the conservatory's own three join the same stamp page
  if (!STAMP_GROUPS.includes(CONS_GROUP)) STAMP_GROUPS.splice(Math.max(0, STAMP_GROUPS.indexOf('Big days out') + 1), 0, CONS_GROUP);
}
function build() {
  list = []; byId = new Map(); dirty = false;
  const places = safe(() => G.places.list(), []), pubs = new Map(safe(() => G.publicPlaces.list(), []).map(p => [p.id, p])), names = new Set();
  sig = places.length + '|' + pubs.size;
  // --- places with doors / stalls / the airport
  for (const p of places) if (p.kind === 'venue' || p.kind === 'stall' || p.kind === 'airport') { if (placeEntry(p, pubs.get(p.id))) names.add(p.name); }
  // --- outdoor spots, then landmarks that are not twins of something already listed
  for (const p of places) if (p.kind === 'spot') {
    const k = (p.poi && p.poi.kind) || 'lookout', s = SPOT[k] || SPOT.lookout, pv = VENUE_BY_ID[p.id];
    add({ id: 'place:' + p.id, kind: 'place', title: p.name, type: s[1], chapter: s[0], also: s[5] || [], tags: [k, 'outdoors', 'free'], district: p.district, blurb: (p.blurb || (pv && pv.blurb)) || safe(() => p.poi.blurb, '') || pick(s[4], p.id), price: k === 'ferriswheel' ? '$' : 'Free',
      placeId: p.id, x: p.x, y: p.y, poi: p.poi, glyph: s[2], thumb: k === 'ferriswheel' ? 'bld' : 'glyph', _fn: (p.functions || []).concat(s[3]) }); names.add(p.name);
  }
  for (const p of places) if (p.kind === 'landmark' && !/^lm:(home|station)/.test(p.id) && !names.has(p.name) && !byId.has('place:' + String(p.id).replace(/^lm:/, ''))) {
    const park = /park|green|walk|falls|garden/i.test(p.name);
    add({ id: 'place:' + p.id, kind: 'place', title: p.name, type: park ? 'Park' : 'Landmark', chapter: park ? 'outdoors' : 'sights', also: park ? ['sights'] : [], tags: ['landmark', 'free'], district: p.district, price: 'Free', placeId: p.id, x: p.x, y: p.y, poi: p.poi,
      blurb: p.blurb || fillT(pick(LANDMARK_BLURB, p.id), { title: p.name, district: p.district || safe(() => city().districtAt(p.x, p.y), null) }), glyph: park ? 'tree' : 'tower', thumb: park ? 'glyph' : 'bld' }); names.add(p.name);
  }
  // --- the Galleria's shops, SkyDeck features
  const mall = byId.get('place:deptstore');
  if (mall) for (const s of safe(() => G.showpieces.mall.shops(), [])) {
    const v = VENUE_BY_ID[s.venueId] || {}, food = v.type === 'food' || /boba|kbbq|taco|pretzel/.test(s.id);
    add({ id: 'mall:' + s.id, kind: 'place', title: s.name, type: food ? 'Food court' : 'Galleria shop', chapter: food ? 'eat' : 'shop', also: s.id === 'toy' ? ['try'] : s.id === 'wheel' || s.id === 'kicks' ? ['fitness'] : s.id === 'bloom' ? ['services'] : s.id === 'paper' ? ['arts'] : [], tags: ['galleria', 'mall', s.id === 'toy' ? 'arcade' : ''],
      district: mall.district, address: 'Inside the Maple Bay Galleria, ' + (mall.address || ''), blurb: v.blurb || (food ? 'A food-court counter in the Galleria. Grab a tray and find a table under the skylight.' : 'One of the open-front bays in the Maple Bay Galleria. Wander in.'),
      hours: v.hours || Array(7).fill([10, 21]), price: priceOf(v.priceMult ? v : { priceMult: 1 }), placeId: 'deptstore', x: mall.x, y: mall.y, room: 'deptstore', venueId: s.venueId, parent: mall.id, glyph: food ? 'cup' : 'bag', thumb: 'glyph' });
  }
  const sky = byId.get('place:skydeck_lobby');
  if (sky) for (const f of [['telescopes', 'The SkyDeck Telescopes', 'Five coin-free telescopes, one for every direction. Sweep the districts and you may discover places you have never walked to.'], ['ledge', 'The Glass Ledge', 'A glass floor jutting out from the top of the tower. Step out and watch the traffic crawl far below your shoes.'],
    ['photo', 'SkyDeck Photo Spot', 'The marked spot where the whole skyline fits behind you. Photos go into your keepsakes.'], ['bar', 'Cloud Nine Bar', 'Drinks with the best view in Maple Bay. Come at dusk and stay for the lights.'], ['gifts', 'SkyDeck Gift Nook', 'Snow globes, postcards and tiny towers. Proof that you went all the way up.']])
    add({ id: 'sky:' + f[0], kind: 'place', title: f[1], type: 'SkyDeck', chapter: f[0] === 'bar' ? 'eat' : f[0] === 'gifts' ? 'shop' : 'sights', also: ['try'], tags: ['skydeck', 'view'], district: sky.district, address: 'Top of Beacon Tower, ' + (sky.address || ''), blurb: f[2], hours: sky.hours, price: f[0] === 'bar' || f[0] === 'gifts' ? '$$' : 'With SkyDeck ticket', placeId: 'skydeck_lobby', x: sky.x, y: sky.y, room: 'skydeck', parent: sky.id, glyph: 'tower', thumb: 'glyph' });
  const cs = byId.get('place:central_station');
  if (cs) add({ id: 'cs:piano', kind: 'place', title: 'The Station Piano', type: 'Public piano', chapter: 'arts', also: ['try'], tags: ['piano', 'music', 'free'], district: cs.district, address: 'Central Station concourse', blurb: 'An upright piano under the glass vault of Central Station, free for anyone to play. Commuters have been known to stop and clap.', price: 'Free', placeId: 'central_station', x: cs.x, y: cs.y, room: 'central_station', parent: cs.id, glyph: 'mask', thumb: 'glyph' });
  const lib = byId.get('place:library');
  if (lib) add({ id: 'svc:jobboard', kind: 'place', title: 'City Job Board', type: 'Job listings', chapter: 'services', tags: ['jobs', 'work', 'computers', 'free'], district: lib.district, address: lib.address, blurb: 'Looking for work? The free public computers at the library list every opening in the city, from barista to baggage handler. (The Jobs app on your phone shows a shorter list.)', hours: lib.hours, price: 'Free', placeId: 'library', x: lib.x, y: lib.y, room: 'library', parent: lib.id, glyph: 'key', thumb: 'glyph' });
  // --- transit
  const railFare = safe(() => G.transit.fare('train'), 2.5), busFare = safe(() => G.transit.fare('bus'), 1.5), fmt = n => safe(() => G.money.fmt(n), '$' + n);
  const sts = safe(() => G.rail.stations(), []);
  sts.forEach((s, i) => { const p = safe(() => G.places.get(s.venueId), null) || { x: s.entrance ? s.entrance.x : s.x, y: s.entrance ? s.entrance.y : s.y }, nx = sts[(i + 1) % sts.length], pv = sts[(i + sts.length - 1) % sts.length];
    add({ id: 'place:' + s.venueId, kind: 'transit', title: (p.name || s.name + ' Station'), type: 'Light rail station', chapter: 'transit', tags: ['train', 'rail', 'station'], district: p.district, blurb: `A stop on the Maple Bay loop line. Next stations: ${nx.name} one way, ${pv.name} the other. Trains run both directions around the loop.`, price: fmt(railFare) + ' flat fare', placeId: s.venueId, x: p.x, y: p.y, poi: p.poi, station: s.id, glyph: 'train', thumb: 'bld' }); });
  if (sts.length) add({ id: 'tr:rail', kind: 'transit', title: 'The Light Rail Loop', type: 'Line diagram', chapter: 'transit', tags: ['train', 'rail', 'map'], blurb: `One loop, ${sts.length} stations, trains in both directions. A flat fare takes you as far as you like; day and week passes are sold at the ticket machines.`, price: fmt(railFare) + ' per ride', line: sts.map(s => ({ id: 'place:' + s.venueId, name: s.name })), glyph: 'train', thumb: 'glyph' });
  const w = city();
  for (const r of (w && w.busRoutes) || []) { const stops = r.stops.map(id => safe(() => G.places.get(id), null)).filter(Boolean), f = stops[0];
    add({ id: 'tr:' + r.id, kind: 'transit', title: 'Bus ' + r.name, type: 'Bus route', chapter: 'transit', tags: ['bus'], blurb: `${stops.length} stops. Wait at any stop on the line and the next bus will pick you up.`, price: fmt(busFare) + ' per ride', color: r.color, stops: stops.map(s => ({ id: s.id, name: s.name, x: s.x, y: s.y })), placeId: f && f.id, x: f && f.x, y: f && f.y, glyph: 'train', thumb: 'glyph' }); }
  const stands = places.filter(p => p.kind === 'taxistand');
  add({ id: 'tr:taxi', kind: 'transit', title: 'MapleCab Taxis', type: 'Taxi', chapter: 'transit', tags: ['taxi', 'cab'], blurb: `Call a cab from the MapleCab app or walk to one of the ${stands.length} stands. Fares run on distance, cost a little more at night, and the airport is a flat rate.`, price: 'From ' + fmt(safe(() => G.transit.fare('taxi'), 5)), stands: stands.map(s => ({ id: s.id, name: s.name, x: s.x, y: s.y })), glyph: 'train', thumb: 'glyph' });
  for (const s of stands) add({ id: 'place:' + s.id, kind: 'transit', title: s.name, type: 'Taxi stand', chapter: 'transit', tags: ['taxi'], blurb: 'A rank where cabs wait. Tap one to hop in, no phone needed.', placeId: s.id, x: s.x, y: s.y, poi: s.poi, glyph: 'train', thumb: 'glyph' });
  add({ id: 'tr:fares', kind: 'transit', title: 'Fares & Passes', type: 'Good to know', chapter: 'transit', tags: ['fares', 'pass', 'ticket'], blurb: `Light rail ${fmt(railFare)} a ride, buses ${fmt(busFare)}, cabs by distance. Rail day and week passes pay for themselves quickly if you commute. Walking is free and the city is prettier at that speed.`, glyph: 'train', thumb: 'glyph' });
  if (byId.get('place:airport') && G.airtram) add({ id: 'tr:airtram', kind: 'transit', title: 'Airport Tram & Walkways', type: 'People mover', chapter: 'transit', also: ['try'], tags: ['airport', 'tram'], district: 'airport', blurb: 'Inside the terminal a driverless tram shuttles between the main hall and the gates, and moving walkways carry you down the concourse. Both are free.', price: 'Free', placeId: 'airport', x: byId.get('place:airport').x, y: byId.get('place:airport').y, parent: 'place:airport', glyph: 'train', thumb: 'glyph' });
  // --- shows (one entry per production) and calendar events
  for (const v of safe(() => G.shows.venues(), [])) { const pe = byId.get('place:' + (v.placeId || v.id));
    for (const pr of v.programme || []) add({ id: 'show:' + v.id + ':' + pr.id, kind: 'show', title: pr.title, type: { film: 'Film', concert: 'Concert', play: 'Play' }[v.kind] || 'Show', chapter: 'shows', also: ['arts'], tags: [v.kind, v.name], district: pe && pe.district, address: pe && pe.address, blurb: pr.blurb, price: fmt(pr.price), minutes: pr.minutes,
      placeId: v.placeId || v.id, x: pe && pe.x, y: pe && pe.y, venueId: v.id, prog: pr.id, when: 'At ' + v.name, parent: pe && pe.id, glyph: 'mask', thumb: 'glyph' }); }
  for (const ev of EVENTS) { const pl = ev.place || {}, pid = pl.venue || pl.poi || null, p = pid && safe(() => G.places.get(pid), null), wd = ev.when.weekday;
    add({ id: 'event:' + ev.id, kind: 'event', title: ev.name, type: ev.kind === 'weekly' ? 'Every week' : 'Seasonal event', chapter: 'shows', also: p && p.kind !== 'venue' ? ['outdoors'] : [], tags: ['event', ev.kind || ''], district: (p && p.district) || pl.district, blurb: ev.blurb || 'A date for the diary.', placeId: p ? p.id : null, x: p ? p.x : undefined, y: p ? p.y : undefined,
      when: wd !== undefined ? `Every ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][wd]}, ${hh(ev.hours[0])} - ${hh(ev.hours[1])}` : `${ev.when.season === 'any' ? 'Every season' : cap(ev.when.season)}, day ${ev.when.days.join(' & ')}, ${ev.hours[0] === 0 && ev.hours[1] >= 24 ? 'all day' : hh(ev.hours[0]) + ' - ' + hh(ev.hours[1])}`, ev, price: 'Free entry', glyph: 'mask', thumb: 'glyph' }); }
  // --- activities
  consStamps(); const infoPlaces = list.filter(e => e._inf);
  for (const a of ACTIVITIES) { if (ACT_SKIP.has(a.id)) continue;
    const where = a.where === 'venue' ? (a.venues || []).map(v => 'place:' + v).filter(id => byId.has(id))
      .concat(infoPlaces.filter(e => infoHas(e, a) && ((a.venues || []).includes('*') || (a.venues || []).includes(PUB_ALIAS[e._tpl]))).map(e => e.id)).filter((id, i, l) => l.indexOf(id) === i) : a.where === 'world' ? list.filter(e => e._fn && (e._fn.includes(a.tag) && (a.id !== 'watch_planes' || e.tags[0] === 'planespotting') && (a.tag !== 'bench' || a.id === 'watch_planes' || e.type !== 'Viewpoint' || e.tags[0] !== 'planespotting'))).map(e => e.id) : [];
    if (a.where === 'venue' && !where.length) continue;
    const first = where.length ? byId.get(where[0]) : null, also = ACT_ALSO[a.id] ? [ACT_ALSO[a.id]] : []; if (a.where === 'world' && !also.includes('outdoors')) also.push('outdoors');
    add({ id: 'act:' + a.id, kind: 'activity', title: a.name.replace(/\.\.\.$/, ''), type: { home: 'At home', venue: 'Around town', world: 'Out & about', anywhere: 'Anywhere' }[a.where], chapter: 'try', also, tags: [a.where, a.tag], blurb: a.flavour || a.note || pick(ACT_BLURB[a.where] || ACT_BLURB.world, a.id), price: a.cost ? '$' : 'Free', where, act: a.id,
      placeId: first && first.placeId, x: first && first.x, y: first && first.y, district: first && where.length === 1 ? first.district : null, address: where.length ? '' : a.where === 'home' ? 'At your place' : 'Anywhere', glyph: { home: 'key', venue: 'cup', world: 'tree', anywhere: 'stamp' }[a.where], thumb: 'glyph' });
    for (const id of where) { const e = byId.get(id); (e.acts = e.acts || []).push('act:' + a.id); } }
  for (const x of EXPERIENCES) { if (x.need && !byId.has('place:' + x.need)) continue; const pe = x.place && byId.get(x.place);
    add({ id: x.id, kind: 'activity', title: x.title, type: x.group, chapter: 'try', also: x.group === 'Getting around' ? ['transit'] : [], tags: ['experience'], blurb: x.blurb, where: pe ? [pe.id] : [], placeId: pe && pe.placeId, x: pe && pe.x, y: pe && pe.y, district: pe && pe.district, address: pe ? pe.address : 'Around Maple Bay', glyph: x.glyph, thumb: 'glyph' });
    if (pe) (pe.acts = pe.acts || []).push(x.id); }
  // --- stamp book definitions
  stampDefs = []; stampById = new Map();
  const sd = (id, title, group, glyph, hint, entry) => { const d = { id, title, group, glyph, hint, entry }; stampDefs.push(d); stampById.set(id, d); };
  for (const e of list) if (e.kind === 'activity') sd(e.id, e.title, e.act ? { home: 'At home', venue: 'Around town', world: 'Out & about', anywhere: 'At home' }[e.tags[0]] : e.type, e.glyph, e.blurb, e.id);
  for (const d of DISTRICTS) sd('d:' + d.id, 'Explore ' + d.name, 'Districts', 'tower', 'Discover any place in ' + d.name + '.', null);
  for (const p of safe(() => G.places.knownList(), [])) districtStamp(p, true);
  G.emit('guide:rebuilt', list.length);
}
const ensure = () => { if (dirty || sig !== safe(() => G.places.list().length, 0) + '|' + safe(() => G.publicPlaces.list().length, 0)) build(); return list; };

/* ---------- stamps ---------- */
function stamp(id, quiet) {
  ensure(); const d = stampById.get(id); if (!d || S.stamps[id] !== undefined) return false;
  S.stamps[id] = Math.floor(G.state.t / DAY); S.fresh = S.fresh || []; S.fresh.push(id); if (S.fresh.length > 12) S.fresh.shift();
  G.emit('guide:stamp', id, d);
  if (!quiet) {
    const grp = stampDefs.filter(x => x.group === d.group), all = stampDefs.every(x => S.stamps[x.id] !== undefined);
    if (grp.every(x => S.stamps[x.id] !== undefined)) safe(() => G.phone.notify({ app: 'guide', title: 'Stamp page complete!', text: all ? 'Every stamp in Wander collected. You know this city by heart.' : `You collected every "${d.group}" stamp in your Wander guide.`, icon: null, priority: 'normal', data: { tab: 'stamps' } }), 0);
    else safe(() => G.phone.notify({ app: 'guide', title: 'New stamp', text: d.title, priority: 'low', data: { tab: 'stamps' } }), 0);
  }
  return true;
}
function districtStamp(p, quiet) { const pl = typeof p === 'string' ? safe(() => G.places.get(p), null) : p; if (!pl || ['station', 'busstop', 'taxistand', 'home', 'airport'].includes(pl.kind)) return; const k = pl.district || safe(() => city().districtAt(pl.x, pl.y), null); if (k && S.stamps['d:' + k] === undefined && stampById.has('d:' + k)) { if (quiet) S.stamps['d:' + k] = Math.floor(G.state.t / DAY); else stamp('d:' + k); } }
const ROOM_STAMP = { central_station: 'x:central', 'airport:terminal': 'x:airport', 'airport:concourse': 'x:airport', deptstore: 'x:mall', skydeck: 'x:skydeck' };
function wire() {
  const on = (ev, fn) => G.on(ev, (...a) => { try { fn(...a); } catch (e) { console.warn('guide stamp', ev, e); } });
  on('activity:done', (id, info) => { if (!info || info.completed !== false || (info.minutes || 0) >= 5) stamp('act:' + id); });
  on('ride:end', kind => stamp('x:ride_' + (kind === 'cab' ? 'taxi' : kind)));
  on('show:end', o => stamp('x:show_' + ((o && o.venue) || o)));
  on('shop:buy', (id, qty, venueId) => { stamp('x:first_buy'); const v = String(venueId || ''); if (/^(mall|skydeck):/.test(v)) stamp('x:mall_shop'); if (v === 'market_stalls') stamp('x:market'); const ve = VENUE_BY_ID[v]; const it = ITEM_BY_ID[id], ready = !!it && !['ingredient', 'homegood', 'outfit', 'book', 'gift'].includes(it.category) && safe(() => G.inv.isFood(it), false); if (ready && (/^(stand_|pubw:)/.test(v) || v === 'market_stalls' || (ve && ve.type === 'stall'))) stamp('x:street_food'); });   /* QA9: something to eat there and then, not an onion from a market stall */
  on('skydeck:visit', () => stamp('x:skydeck')); on('skydeck:ledge', () => stamp('x:ledge')); on('skydeck:scope', () => stamp('x:telescope')); on('skydeck:photo', () => stamp('x:skyphoto'));
  on('mall:arcade', () => stamp('x:arcade')); on('mall:visit', () => stamp('x:mall'));
  on('service', (id, venueId) => { const pp = safe(() => G.publicPlaces.get(venueId), null); stamp(/hair|barber|salon|cut|trim|shave|fade/i.test(String(id)) || (pp && /barber|salon/.test(pp.kind || '')) ? 'x:haircut' : 'x:service'); });
  on('job:shift:end', () => stamp('x:shift')); on('job:hired', () => stamp('x:hired'));
  on('social:hangout', () => stamp('x:hangout')); on('npc:met', () => stamp('x:met')); on('social:gift', () => stamp('x:gift')); on('friend:up', () => stamp('x:hangout'));
  on('cooked', () => stamp('x:cooked')); on('home:furnish', () => { if (safe(() => G.furnish.active, false)) stamp('x:furnish'); });   /* QA9: only when you decorate yourself (unpacking the moving boxes gave it) */ on('photo', v => { if (v) stamp('x:photo'); });
  // Botanical Conservatory (src/sim/conservatory.js events)
  on('conservatory:sketch', () => stamp('x:cons_sketch')); on('conservatory:tour', n => { if ((n || 0) >= 5) stamp('x:cons_tour'); }); on('conservatory:sit', () => stamp('x:cons_breathe'));
  on('conservatory:seedling', () => stamp('x:cons_seedling')); on('conservatory:wish', () => stamp('x:cons_wish')); on('conservatory:chain', st => { if (st >= 3) stamp('x:cons_cuttings'); });
  on('conservatory:fact', () => { if (safe(() => G.conservatory.stats().facts, 0) >= 12) stamp('x:cons_plaques'); });
  on('use', it => { const s = [it && it.id, it && it.tag, it && it.label, it && it.fn].join(' ').toLowerCase(); if (/piano/.test(s)) stamp('x:piano'); });
  on('scene', s => { dirty = dirty || !list.length; const id = String((s && s.id) || '').replace(/^int:/, ''); if (ROOM_STAMP[id]) stamp(ROOM_STAMP[id]); if (id === 'library') S.seen.library = 1; });
  on('places:built', () => { dirty = true; });
  on('place:discover', id => { districtStamp(id); if (G.scene && !G.onTitle && S.tipDay !== Math.floor(G.state.t / DAY) && byId.has('place:' + id)) { S.tipDay = Math.floor(G.state.t / DAY); safe(() => G.phone.notify({ app: 'guide', title: 'Added to your Wander guide', text: byId.get('place:' + id).title, priority: 'low', data: { entry: 'place:' + id } }), 0); } });
  on('load', () => { S = G.state.guide; dirty = true; });
}

/* ---------- queries ---------- */
function times(e, days = 7, from) {
  const now = G.state.t, d0 = from === undefined ? Math.floor(now / DAY) : from, out = [];
  for (let d = d0; d < d0 + days; d++) {
    if (e.kind === 'show') for (const s of safe(() => G.shows.schedule(e.venueId, d), [])) { if (s.prog === e.prog && s.t > now) out.push({ t: s.t, dur: s.minutes || 90, clock: s.clock || hh((s.t % DAY) / 60), day: d, price: s.price, showId: s.id }); }
    else if (e.kind === 'event' && e.ev && eventOnDay(e.ev, d)) { const t = d * DAY + e.ev.hours[0] * 60, dur = (e.ev.hours[1] - e.ev.hours[0]) * 60; if (t + dur > now) out.push({ t, dur, clock: e.ev.hours[0] === 0 && e.ev.hours[1] >= 24 ? 'All day' : hh(e.ev.hours[0]), day: d }); }
  }
  return out;
}
const api = {
  all: () => ensure().slice(), get: id => (ensure(), byId.get(id) || byId.get('place:' + id) || null), rebuild() { dirty = true; ensure(); return list.length; },
  chapters: () => CHAPTERS, districts: () => DISTRICTS.map(d => Object.assign({ id: d.id, name: d.name }, DISTRICT_INFO[d.id])),
  byChapter: ch => ensure().filter(e => e.chapter === ch || e.also.includes(ch)), byDistrict: k => ensure().filter(e => e.district === k),
  pos: e => (e && e.x !== undefined && e.y !== undefined ? { x: e.x, y: e.y } : null),
  near(x, y, n = 6, filter) { return ensure().filter(e => e.x !== undefined && e.kind === 'place' && !e.parent && (!filter || filter(e))).map(e => [Math.abs(e.x - x) + Math.abs(e.y - y), e]).sort((a, b) => a[0] - b[0]).slice(0, n).map(a => a[1]); },
  search(text) { const q = String(text || '').trim().toLowerCase(); if (!q) return []; const out = [];
    for (const e of ensure()) { const t = e.title.toLowerCase(); let s = t.startsWith(q) ? 5 : t.includes(q) ? 4 : (e.type || '').toLowerCase().includes(q) ? 3 : e.tags.some(x => String(x).toLowerCase().includes(q)) ? 2 : (DNAME[e.district] || '').toLowerCase().includes(q) ? 1.5 : (e.blurb + ' ' + (e.signature || '') + ' ' + (e.tryThis || []).join(' ')).toLowerCase().includes(q) ? 1 : 0; if (s) out.push([s, e]); }
    return out.sort((a, b) => b[0] - a[0] || a[1].title.localeCompare(b[1].title)).map(a => a[1]); },
  times,
  whatsOn(day) { const d0 = day === undefined ? Math.floor(G.state.t / DAY) : day, out = [];
    for (const e of ensure()) if (e.kind === 'show' || e.kind === 'event') for (const t of times(e, 7, d0)) out.push({ id: e.id + '@' + t.t, entryId: e.id, kind: e.kind, title: e.title, type: e.type, t: t.t, dur: t.dur, day: t.day, clock: t.clock, placeId: e.placeId, venue: e.kind === 'show' ? e.when.replace(/^At /, '') : safe(() => G.places.get(e.placeId).name, DNAME[e.district] || ''), price: t.price !== undefined ? t.price : null, blurb: e.blurb });
    return out.sort((a, b) => a.t - b.t || a.title.localeCompare(b.title)); },
  thingsToTry() { ensure(); return stampDefs.map(d => Object.assign({}, d, { done: S.stamps[d.id] !== undefined, day: S.stamps[d.id] })); },
  stampGroups: () => STAMP_GROUPS, stamp: (id, quiet) => stamp(id, quiet), fresh() { const f = S.fresh || []; S.fresh = []; return f; },
  openNow(e, t = G.state.t) { if (!e || !e.hours) return { open: null, text: '' }; const day = Math.floor(t / DAY), wd = day % 7, hf = (t % DAY) / 60, o = venueOpen({ hours: e.hours }, wd, hf), h = e.hours[wd];
    return { open: o, hours: h ? (h[0] === 0 && h[1] >= 24 ? 'Open 24 hours' : `${hh(h[0])} - ${hh(h[1])}`) : 'Closed today', text: o ? 'OPEN' : 'CLOSED' }; },
  nearestTransit(e) { if (!e || e.x === undefined) return {}; const ps = safe(() => G.places.list(), []), nr = k => { let b = null, bd = 1e9; for (const p of ps) if (p.kind === k) { const d = Math.abs(p.x - e.x) + Math.abs(p.y - e.y); if (d < bd) { bd = d; b = p; } } return b ? { id: b.id, name: b.name, dist: bd } : null; }; return { station: nr('station'), stop: nr('busstop') }; },
  known: e => !e || !e.placeId || e.kind !== 'place' || e.parent ? true : safe(() => G.places.known(e.placeId), true),
  isFav: id => S.favs.includes(id), favs: () => (ensure(), S.favs.map(id => byId.get(id)).filter(Boolean)), fav(id, on) { const i = S.favs.indexOf(id), want = on === undefined ? i < 0 : on; if (want && i < 0) S.favs.push(id); else if (!want && i >= 0) S.favs.splice(i, 1); return want; },
  hiddenGem(seed) { const c = ensure().filter(e => e.kind === 'place' && !e.parent && e.chapter !== 'transit' && !api.known(e)); const pool = c.length ? c : list.filter(e => e.kind === 'place'); return pool.length ? pool[hash('gem' + (seed === undefined ? Math.floor(G.state.t / DAY) : seed)) % pool.length] : null; },
  stats() { ensure(); const byChapter = {}, byKind = {}; for (const c of CHAPTERS) byChapter[c.id] = api.byChapter(c.id).length; for (const e of list) byKind[e.kind] = (byKind[e.kind] || 0) + 1; return { total: list.length, byChapter, byKind, stamps: stampDefs.length, stamped: Object.keys(S.stamps).length }; },
};
export function init() {
  S = G.defineState('guide', () => ({ stamps: {}, seen: {}, favs: [] }));
  const fix = () => { S = G.state.guide || G.defineState('guide', () => ({ stamps: {}, seen: {}, favs: [] })); S.stamps = S.stamps || {}; S.seen = S.seen || {}; S.favs = S.favs || []; };
  fix(); G.guide = api; wire();
  for (const ev of ['load', 'game:load', 'game:start', 'game:new']) G.on(ev, () => { fix(); dirty = true; });
}
