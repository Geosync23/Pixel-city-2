// Private: which tunes may play where (the POOLS of the background music) and the shuffle bag that picks from them. No game imports.
// A tune names its pools itself: pl: 'cafe date' (named pools), out: 'morning midday|oldtown market' (outdoors: times of day | district flavours, * = all),
// sea: 0-3 (an outdoor tune of that season only). Pool keys: a named pool ('cafe'), or 'out:<time>:<district>:<season>'.
import { SONGS, SONG } from './_music_songs.js';

export const TIMES = ['dawn', 'morning', 'midday', 'afternoon', 'golden', 'evening', 'late'];
export const DISTRICTS = ['downtown', 'oldtown', 'harbor', 'park', 'suburb', 'arts', 'market', 'airport'];
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
/** hour of the day (0-24, fractional) -> time-of-day pool */
export const timeOf = h => h < 4.5 ? 'late' : h < 7 ? 'dawn' : h < 11 ? 'morning' : h < 14 ? 'midday' : h < 17 ? 'afternoon' : h < 19.5 ? 'golden' : h < 23 ? 'evening' : 'late';
/** what each named pool is for (the jukebox page and the dev chooser show this) */
export const POOL_INFO = {
  title: 'Title screen', rain: 'Outdoors in the rain', storm: 'Outdoors in a storm', snow: 'Outdoors in the snow', fog: 'Outdoors in fog', heat: 'Outdoors on a hot afternoon',
  cafe: 'Cafes and bakeries', diner: 'Diners and quick food', bar: 'Bars and clubs', shop: 'Shops and the mall', gym: 'Gym, pool and arena', library: 'Library, bookshop and classrooms',
  hotel: 'Hotel, fine dining and foyers', museum: 'Museum, aquarium, observatory, conservatory', home: 'At home', home_am: 'At home, morning routine', home_late: 'At home, late at night', home_rain: 'At home while it rains',
  office: 'Offices, bank, City Hall, clinic', cab: 'Cab radio', bus: 'On the bus', train: 'On the train and the air tram', plane: 'On the plane', work: 'During a work shift',
  date: 'Date night', family: 'With the family', festival: 'Festival days', room: 'Lobbies and other rooms',
};
const named = {}, outs = [];
for (const s of SONGS) {
  for (const p of (s.pl || '').split(/\s+/).filter(Boolean)) (named[p] = named[p] || []).push(s.id);
  if (s.out) { const [t, d] = s.out.split('|'); outs.push({ id: s.id, t: t === '*' ? TIMES : t.split(/\s+/), d: d === '*' ? DISTRICTS : d.split(/\s+/), sea: s.sea }); }
}
/** when a pool has fewer than two tunes, borrow from the next one in this chain */
const BORROW = { storm: 'rain', home_am: 'home', home_late: 'home', home_rain: 'home', office: 'work', work: 'room', bus: 'cab', plane: 'train', family: 'home', date: 'hotel', festival: 'out:midday:market:1', museum: 'library', library: 'museum', hotel: 'cafe', room: 'home', heat: 'out:afternoon:park:1', fog: 'out:dawn:harbor:0', snow: 'out:dawn:suburb:3' };
const cache = {};
/** pool key -> ids (never empty while the songbook has outdoor tunes) */
export function pool(key) {
  if (cache[key]) return cache[key]; let ids;
  if (key.startsWith('out:')) { const [, t, d, se] = key.split(':'), sea = +se || 0, ok = o => o.sea === undefined || o.sea === sea;
    ids = outs.filter(o => ok(o) && o.t.includes(t) && o.d.includes(d)).map(o => o.id);
    if (ids.length < 3) ids = [...new Set(ids.concat(outs.filter(o => ok(o) && o.t.includes(t)).map(o => o.id)))];
    if (ids.length < 3) ids = [...new Set(ids.concat(outs.filter(ok).map(o => o.id)))]; }
  else { ids = (named[key] || []).slice(); let k = key, n = 0; while (ids.length < 2 && BORROW[k] && n++ < 4) { k = BORROW[k]; ids = [...new Set(ids.concat(pool(k)))]; } if (!ids.length) ids = pool('out:midday:downtown:0'); }
  return cache[key] = ids;
}
export const namedPools = () => Object.keys(POOL_INFO);
/** every place a tune plays, as text */
export function whereOf(id) { const s = SONG[id], o = []; if (!s) return ''; for (const p of (s.pl || '').split(/\s+/).filter(Boolean)) o.push(POOL_INFO[p] || p);
  if (s.out) { const [t, d] = s.out.split('|'); const nm = { golden: 'golden hour', late: 'late night', oldtown: 'old town', arts: 'arts quarter' }, list = x => x.split(/\s+/).map(w => nm[w] || w).join(', ');
    o.push('Outdoors' + (s.sea !== undefined ? ' in ' + SEASONS[s.sea] : '') + ': ' + (t === '*' ? 'any time' : list(t)) + (d === '*' ? '' : ' (' + list(d) + ')')); }
  return o.join('; '); }

/** The shuffle bag. st (saved): { bags: { key: [ids not played yet in this round] }, last, recent: [ids], n }.
 *  draw(st, key): never the tune played last, no tune of a pool again before the others of that pool have played, and it avoids the few most recent tunes of other pools. */
export function draw(st, key, rnd = Math.random) {
  const ids = pool(key); st.bags = st.bags || {}; st.recent = st.recent || [];
  let bag = (st.bags[key] || []).filter(id => ids.includes(id));
  if (!bag.length) { bag = ids.filter(id => id !== st.last); if (!bag.length) bag = ids.slice(); }
  let c = bag.filter(id => id !== st.last); if (!c.length) c = bag; const fresh = c.filter(id => !st.recent.includes(id)); if (fresh.length) c = fresh;
  const id = c[(rnd() * c.length) | 0]; st.bags[key] = bag.filter(x => x !== id); const keys = Object.keys(st.bags); if (keys.length > 40) delete st.bags[keys[0]];
  return id;
}
/** record that a tune really played */
export function played(st, id) { st.last = id; st.recent = (st.recent || []).filter(x => x !== id); st.recent.push(id); while (st.recent.length > 5) st.recent.shift(); st.n = (st.n || 0) + 1; }
/** put a tune back (it was cut off almost at once) */
export function putBack(st, key, id) { st.bags = st.bags || {}; const b = st.bags[key] || (st.bags[key] = []); if (!b.includes(id)) b.push(id); }
