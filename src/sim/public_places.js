// Public places: converts existing, non-enterable city buildings that read as cafes / restaurants / shops into real places.
//   - ENTERABLE: a door poi `door:pub:<n>` (room `pub:<n>`, district, address) + a generated interior (scenes/rooms/generic_venues.js) that is its
//     own venue record (data/venues_extra.js registerInstance) -> the normal shop window, crowds, map pins and the welcome glow all just work.
//   - WALK-UP WINDOWS: a `stall` poi `stall:pubw:<n>` (venue `pubw:<n>`) in front of kiosks / lantern-row stalls / pavilions; "<Name> — walk-up window".
// Nothing is moved or removed; nothing is saved (generation is deterministic from the city: ids are stable across saves).
// The scan runs once, before places/stalls/addresses build (order 55), or lazily when a `pub:` room is asked for before the city scene exists.
//
// G.publicPlaces
//   list() -> [{ id ('pub:3' | 'pubw:4'), n, name, type (generic venue type id, e.g. 'gen_eatery_pho'), tpl (room template), kind, cat ('food'|'shop'|'service'),
//               walkup (bool), x, y, district, poi, venue, address (getter) }]
//   get(id)   byDistrict() -> { districtKey: [place] }   nearest(type, x, y) -> place | null   (type: generic type id, template id, cat, or 'grocery')
//   groceries() -> every grocery option incl. FreshWay + Lucky Corner [{ id, name, x, y, size: 'large'|'medium'|'small' }]      census() -> counts
// Also: a place and its same-named landmark poi are discovered together (fixes the double "Discovered: X" toast).
import { G } from '../core/game.js';
import { toast, choose } from '../ui/kit.js';
import { ROOMS, enterRoom, registerFixture } from '../scenes/interior.js';
import { room } from '../scenes/rooms/venues_lib.js';
import { genericRoom } from '../scenes/rooms/generic_venues.js';
import { uniqueRoom } from '../scenes/rooms/unique_rooms.js';
import { GEN_TYPES, registerInstance } from '../data/venues_extra.js';
import { VENUE_BY_ID } from '../data/venues.js';
import { getCity } from '../world/_city.js';

export const order = 55;
const PL = [], BY = new Map(); let built = null, skipped = [];
const E = k => 'gen_eatery_' + k, R = k => 'gen_retail_' + k, SV = k => 'gen_service_' + k;
// sign text on the building -> [[type, name, walkUp?], ...] (one entry per building that carries the sign, in scan order)
const SIGN = {
  'TEA GARDEN': [['gen_tea', 'The Tea Garden']], 'PADDLE CO': [[E('snack'), 'Paddle Co. Snack Window', 1]], 'JUICE BAR': [[E('juice'), 'Sunny Squeeze Juice Bar', 1]],
  'BLOOM & PAPER': [[R('florist'), 'Bloom & Paper'], [R('florist'), 'Bloom & Paper Riverside']], 'TEA & SPICE': [['gen_tea', 'Harbor Tea & Spice']],
  'ROPE WORKS': [[E('seafood'), 'Rope Works Fish & Chips'], [E('soul'), 'Rope Works Smokehouse']], 'COLD STORAGE': [[E('boba'), 'Cold Storage Boba & Ice']], 'CANNERY LOFTS': [['gen_cafe', 'Cannery Coffee Roasters']],
  CURRY: [[E('curry'), 'Golden Curry Stand', 1], [E('curry'), 'Lantern Row Curry House', 1]], NOODLE: [[E('pho'), 'Pho Lantern Noodle Stand', 1]], GYOZA: [[E('dimsum'), 'Lucky Gyoza', 1]], BAO: [[E('dimsum'), 'Bao Bao', 1], [E('dimsum'), "Auntie Mei's Bao", 1]],
  'HOT POT': [[E('hotpot'), 'Bubbling Lantern Hot Pot']], DELICATESSEN: [['gen_grocery_m', "Marchetti's Delicatessen & Grocery"]], CAFE: [['gen_cafe', 'Kettle & Crumb']],
  POST: [[R('stationery'), 'Old Post Stationers'], [R('pharmacy'), 'Post Corner Pharmacy']], 'WAX & WANE': [['gen_records', 'Wax & Wane Records']], 'B-SIDE': [['gen_records', 'B-Side Records']], 'SPIN CITY': [['gen_records', 'Spin City Vinyl']],
  'BLACK CAT INK': [[SV('tattoo'), 'Black Cat Ink']], 'INK & IVY': [[SV('tattoo'), 'Ink & Ivy Tattoo'], ['gen_thrift', 'Ink & Ivy Vintage'], ['gen_comics', 'Ink & Ivy Comics & Zines']],
  'STUDIO 11': [[R('art'), 'Studio 11 Art Supply']], 'CLAY & CO': [[R('art'), 'Clay & Co. Pottery Supply']], GALLERY: [[R('gallery'), 'Tidewater Gallery']],
  SUNNYSIDE: [['gen_cafe', 'Sunnyside Cafe']], 'ELM HOUSE': [['gen_bakery', 'Elm House Bakery']], 'BAKER HOUSE': [[E('bagels'), 'Baker House Bagels']],
  'COAST GAS': [['gen_bodega', 'Coast Gas Mini Mart']], 'MAPLE BREWING CO': [['gen_bar', 'Maple Brewing Co. Taproom']],
};
// ground-floor shopfronts of the downtown office blocks, in scan order
const DOWNTOWN = [['gen_cafe', 'Night Owl Coffee'], [E('taqueria'), 'Taqueria El Farolito'], [E('pho'), 'Little Hanoi Pho'], ['gen_bakery', 'Flour & Fig Bakery'], ['gen_boutique', 'Marigold & Main'], [E('falafel'), 'Cedar & Olive Falafel'],
  ['gen_diner', 'Silver Spoon Diner'], [E('ethiopian'), 'Addis Table'], [E('donut'), 'Halo Donuts'], [SV('nails'), 'Lacquer Lounge Nail Bar'], [R('cheese'), 'The Rind & The Wheel'], ['gen_books', 'Paper Lantern Books'],
  [E('deli'), "Abe's Deli"], [SV('salon'), 'Velvet Comb Salon'], [R('hardware'), 'Hammer & Hinge Hardware'], [E('kbbq'), 'Han River Grill']];
const TEAHOUSE = [['gen_tea', 'Jade Rabbit Tea House'], [E('dimsum'), 'Nine Dragons Dim Sum'], [E('kbbq'), 'Seoul Ember BBQ'], ['gen_bar', 'Paper Crane Izakaya']];
const LOFT = [[SV('laundry'), 'Suds & Bubbles Laundromat'], [SV('barber'), 'Otis & Sons Barbershop']];
const SKIP = /airport|civic\.|fishmarket|arts\.kiosk|deptstore|hotel|pavilion|rail\.|ind\.|harbor\.(master|warehouse|boathouse|pier|lighthouse)|res\.|apartment|rowhouse|townhouses|lantern\.stall|grandma|river\.(amph|boat)|cityhall|tower|parking|construction|unihall|theatre|library/;
const TAGS = [['cafe', 'gen_cafe'], ['bakery', 'gen_bakery'], ['bar', 'gen_bar'], ['restaurant', 'gen_restaurant'], ['diner', 'gen_diner'], ['records', 'gen_records'], ['bookstore', 'gen_books'], ['clothing', 'gen_boutique'], ['vintage', 'gen_thrift'], ['grocery', 'gen_bodega'], ['gallery', R('gallery')], ['food', E('deli')], ['shop', R('stationery')], ['store', R('hardware')], ['market', 'gen_bodega']];

function classify(ob, w, st, forced) {
  if (forced) return forced;
  const id = ob.id, sign = String((ob.p && ob.p.name) || '').toUpperCase(), seq = (key, list) => { const i = st[key] = (st[key] || 0) + 1; return list[i - 1] || null; };
  if (sign === 'SALT & CO' && /warehouse/.test(id)) return ob.x < 100 ? ['gen_bodega', 'Salt & Co. Provisions'] : [R('hardware'), 'Salt & Co. Chandlery & Hardware'];
  if (SIGN[sign]) return seq('s:' + sign, SIGN[sign]);
  if (/downtown\.office\.(brick|grid)/.test(id)) return seq('dt', DOWNTOWN);
  if (/lantern\.teahouse/.test(id)) return seq('tea', TEAHOUSE);
  if (/downtown\.river\.restaurant/.test(id)) return ['gen_restaurant', "The Heron's Table"];
  if (/arts\.lofts/.test(id)) return seq('al', [['gen_grocery_m', 'Bay Thread Co-op Market']]);
  if (/res\.loft/.test(id)) return w.districtAt(ob.x, ob.y) === 'railyard' ? seq('rl', [[E('soul'), "Mama Opal's Soul Kitchen"]]) : seq('loft', LOFT);
  if (!sign && /oldtown\.apartment\.walkup/.test(id)) return seq('aw', [[R('pets'), 'Paws & Whiskers Pet Supply']]);
  if (!sign && /oldtown\.apartment\.garden/.test(id)) return seq('ag', [[R('toys'), 'Tin Robot Toys']]);
  if (SKIP.test(id)) return null;
  const tags = ob.a.tags || []; for (const [t, type] of TAGS) if (tags.includes(t)) return [type, null];
  return null;
}
function flood(w, sx, sy) {
  const nw = w.nw, nh = w.nh, nav = w.nav, seen = new Uint8Array(nw * nh), q = new Int32Array(nw * nh); let h = 0, t = 0; const s = Math.floor(sy * 2) * nw + Math.floor(sx * 2); seen[s] = 1; q[t++] = s;
  while (h < t) { const c = q[h++], x = c % nw, y = (c - x) / nw; if (x > 0 && !seen[c - 1] && nav[c - 1] !== 1) { seen[c - 1] = 1; q[t++] = c - 1; } if (x < nw - 1 && !seen[c + 1] && nav[c + 1] !== 1) { seen[c + 1] = 1; q[t++] = c + 1; } if (y > 0 && !seen[c - nw] && nav[c - nw] !== 1) { seen[c - nw] = 1; q[t++] = c - nw; } if (y < nh - 1 && !seen[c + nw] && nav[c + nw] !== 1) { seen[c + nw] = 1; q[t++] = c + nw; } }
  return (x, y) => x > .25 && y > .25 && x < w.w - .25 && y < w.h - .25 && seen[Math.floor(y * 2) * nw + Math.floor(x * 2)] === 1;
}
// the walkable, street-connected spot in front of the building's door (asset `door` {side, at}, flip-aware) or of its facade midpoint
function doorSpot(ob, ok, stallLike) {
  const a = ob.a, B = ob.B, pv = v => (typeof v === 'function' ? v(ob.p || {}) : v), dr = pv(a.door), u = stallLike ? pv(a.use) : null;
  if (u) { const p = { x: ob.x + (ob.flip ? u.y : u.x), y: ob.y + (ob.flip ? u.x : u.y) }; if (ok(p.x, p.y)) return p; }
  const px = (dr && dr.side === 'x') !== !!ob.flip, len = px ? B[4] - B[1] : B[3] - B[0], at = stallLike || !dr || dr.at === undefined ? len / 2 : Math.min(len - .5, Math.max(.5, dr.at)), o0 = stallLike ? .6 : .75;
  for (const out of [o0, 1.25, 1.75, 2.25, 2.75]) for (const off of [0, .5, -.5, 1, -1, 1.5, -1.5, 2, -2, 3, -3]) { const p = px ? { x: B[3] + out, y: B[1] + at + off } : { x: B[0] + at + off, y: B[4] + out }; if (ok(p.x, p.y)) return { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 100) / 100, dir: px ? 0 : 1 }; }
  for (const out of [.75, 1.5]) for (const p of [{ x: (B[0] + B[3]) / 2, y: B[1] - out, dir: 3 }, { x: B[0] - out, y: (B[1] + B[4]) / 2, dir: 2 }, { x: B[3] + out, y: (B[1] + B[4]) / 2, dir: 0 }, { x: (B[0] + B[3]) / 2, y: B[4] + out, dir: 1 }]) if (ok(p.x, p.y)) return p;
  return null;
}
const has = Map.prototype.has.bind(ROOMS);
// keep rooms pleasantly busy, not packed: all staff + an even pick of customer spots, 12 at most
function capSpots(def) { let all; try { all = def.npcSpots; } catch (e) { return; } if (!all || all.length <= 12) return; const staff = all.filter(s => s.kind === 'staff'), cust = all.filter(s => s.kind !== 'staff'), keep = Math.max(1, 12 - staff.length), pick = cust.filter((s, i) => Math.floor(i * keep / cust.length) !== Math.floor((i - 1) * keep / cust.length)); Object.defineProperty(def, 'npcSpots', { value: staff.concat(pick), enumerable: true, configurable: true }); }
function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w; PL.length = 0; BY.clear(); skipped = [];
  const doors = w.pois.filter(p => p.type === 'door' && !p.pub), start = doors.find(p => /^door:(cafe|bakery|grocery)/.test(p.id) && !w.isBlocked(p.x, p.y)) || doors.find(p => !w.isBlocked(p.x, p.y));
  const ok = start ? flood(w, start.x, start.y) : (x, y) => !w.isBlocked(x, y), hasDoor = ob => doors.some(p => p.x > ob.B[0] - 2.5 && p.x < ob.B[3] + 2.5 && p.y > ob.B[1] - 2.5 && p.y < ob.B[4] + 2.5);
  // a pantry near Birch Lane Flats (Maplewood has no shopfront buildings): the nearest plain house becomes a front-room shop
  const birch = w.pois.find(p => p.id === 'door:home:birch_lane_flats'); let pantry = null;
  if (birch) { let bd = 40; for (const ob of w.objs) { if (!ob.a || ob.a.kind !== 'building' || !/^bld\.res\.(gablehouse|cottage|bungalow|capecod|craftsman)/.test(ob.id) || hasDoor(ob)) continue; const d = Math.hypot((ob.B[0] + ob.B[3]) / 2 - birch.x, (ob.B[1] + ob.B[4]) / 2 - birch.y); if (d < bd) { bd = d; pantry = ob; } } }
  const st = {}, used = new Set(); let n = 0;
  for (const ob of w.objs) {
    if (!ob.a || ob.a.kind !== 'building' || !ob.B) continue; const stall = /lantern\.stall/.test(ob.id);
    if (hasDoor(ob)) continue; const spec = classify(ob, w, st, ob === pantry ? ['gen_bodega', 'Birch Lane Pantry'] : null); if (!spec) continue;
    const T = GEN_TYPES[spec[0]]; if (!T) continue; n++; // n counts every candidate, so ids stay stable even if one cannot be placed
    const win = !!spec[2], sp = doorSpot(ob, ok, stall); if (!sp) { skipped.push(ob.id + '@' + Math.round(ob.x) + ',' + Math.round(ob.y)); continue; }
    let name = spec[1] || T.names.find(x => !used.has(x)) || T.name; const district = w.districtAt(sp.x, sp.y) || w.districtAt(ob.x, ob.y) || 'downtown';
    if (used.has(name)) name += ' ' + (district[0].toUpperCase() + district.slice(1)); used.add(name);
    const id = (win ? 'pubw:' : 'pub:') + n, v = registerInstance(T.id, id, name, district, win ? { walkup: true } : null);
    const poi = w.poi(win ? { type: 'stall', id: 'stall:' + id, venue: id, name, x: sp.x, y: sp.y, district, pub: true } : { type: 'door', id: 'door:' + id, room: id, name, x: sp.x, y: sp.y, dir: sp.dir === undefined ? 1 : sp.dir, district, pub: true });
    if (!win && !has(id)) capSpots(room(Object.assign(uniqueRoom({ id, n, name, type: T.id, tpl: T.tpl, kind: T.kind || '', district }) || genericRoom(T.tpl, n, { name, sign: T.sign, kind: T.kind }), { id, venue: id })));
    const pl = { id, n, name, type: T.id, tpl: T.tpl, kind: T.kind || '', cat: T.type, walkup: win, x: sp.x, y: sp.y, district, poi, venue: v, ob, get address() { return poi.address || (G.address && G.address.of(poi) || {}).text || ''; } };
    PL.push(pl); BY.set(id, pl);
  }
}
const isGrocery = p => p.tpl === 'bodega' || p.tpl === 'grocery_m';
const matches = (p, type) => !type || p.type === type || p.tpl === type || p.cat === type || p.kind === type || (type === 'grocery' && isGrocery(p));
const api = {
  list: () => PL.slice(), get: id => BY.get(String(id).replace(/^(door|stall):/, '')) || null,
  byDistrict() { const o = {}; for (const p of PL) (o[p.district] = o[p.district] || []).push(p); return o; },
  nearest(type, x, y) { let b = null, bd = 1e9; for (const p of PL) { if (!matches(p, type)) continue; const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; b = p; } } return b; },
  groceries() { const o = PL.filter(isGrocery).map(p => ({ id: p.id, name: p.name, x: p.x, y: p.y, size: p.tpl === 'bodega' ? 'small' : 'medium' })), w = built; for (const [rid, size] of [['grocery', 'large'], ['cornerstore', 'small']]) { const d = w && w.pois.find(p => p.id === 'door:' + rid); if (d) o.push({ id: rid, name: (VENUE_BY_ID[rid] || {}).name || rid, x: d.x, y: d.y, size }); } return o; },
  census() { const c = { total: PL.length, enterable: 0, walkup: 0, district: {}, template: {}, skipped }; for (const p of PL) { if (p.walkup) c.walkup++; else { c.enterable++; c.template[p.tpl] = (c.template[p.tpl] || 0) + 1; } c.district[p.district] = (c.district[p.district] || 0) + 1; } return c; },
  // debug: build + enter any template/layout: debugRoom('gen_restaurant', 3) (seed parity picks the layout)
  debugRoom(typeId, seed = 1) { const T = GEN_TYPES[typeId]; if (!T) return null; const id = 'pub:dbg_' + typeId + '_' + seed; registerInstance(typeId, id, T.name + ' (test)', 'downtown'); if (!has(id)) room(Object.assign(uniqueRoom({ id, n: seed, name: T.name, type: T.id, tpl: T.tpl, kind: T.kind || '', district: 'downtown' }) || genericRoom(T.tpl, seed, { name: T.name, sign: T.sign, kind: T.kind }), { id, venue: id })); return enterRoom(id); },
};
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
async function serviceMenu(v, scene) {
  const pick = await choose(v.name, v.pubServices.map((s, i) => ({ label: s[0], sub: (s[1] ? fmt(s[1]) : 'Free') + ' · ' + s[2] + ' min', value: i, disabled: !!(s[1] && G.money && !G.money.canAfford(s[1], { category: 'service', venue: v.id })) })).concat([{ label: 'Never mind', value: -1 }]), { text: v.blurb });
  const s = pick !== null && pick >= 0 && v.pubServices[pick]; if (!s) return; if (s[1] && G.money && !G.money.pay(s[1], s[0] + ' — ' + v.name, { category: 'service', venue: v.id })) return;
  let at; for (const f of scene.fixtures || []) { if (!f.seats || !f.seats.length || !/armchair|tableset|bench/.test(f.asset.id || '')) continue; const q = f.seats.find(q => !scene.ents.some(e => e !== G.player && Math.hypot(e.x - q.x, e.y - q.y) < .45)); if (q) { at = { x: q.x, y: q.y, z: q.z || 0, dir: q.dir }; break; } }
  G.emit('service', 'pub:' + s[0], v.id);
  G.startActivity({ label: s[0], anim: at ? 'sit' : 'stand', minutes: s[2], at, done: () => { if (G.needs) for (const k in s[3]) G.needs.add(k, s[3][k]); toast(`${s[0]} at ${v.name}: done. You feel looked after.`, 'good', 3200); } });
}
export function init() {
  G.publicPlaces = api;
  // rooms may be asked for before the city scene was ever built (loading a save made inside one)
  const get = Map.prototype.get.bind(ROOMS), lazy = k => { if (!built && typeof k === 'string' && k.startsWith('pub:')) { try { ensure(getCity()); } catch (e) { console.warn('public places', e); } } };
  ROOMS.get = k => { lazy(k); return get(k); }; ROOMS.has = k => { lazy(k); return has(k); };
  registerFixture('checkout', (fx, scene) => { const v = VENUE_BY_ID[scene.roomId]; if (!v || !v.pubServices || scene._pubSvc) return null; scene._pubSvc = true; return { label: 'Front desk', use: () => serviceMenu(v, scene) }; });
  G.on('scene', s => {
    if (!s || s.id !== 'city' || s._pub || !s.world) return; s._pub = true; ensure(s.world);
    for (const pl of PL) {
      const p = pl.poi, B = pl.ob.B;
      if (pl.walkup) s.interactables.push({ x: (B[0] + B[3]) / 2, y: (B[1] + B[4]) / 2, h: 1.4, hit: 16, spot: { x: p.x, y: p.y }, label: pl.name + ' — walk-up window', poi: p, use: () => { if (G.shop) G.shop.open(pl.id, { checkHours: true }); } });
      else if (!s.interactables.some(it => it.poi === p)) s.interactables.push({ x: p.x, y: p.y, label: pl.name, h: 1.2, range: 1.3, poi: p, use: () => { if (ROOMS.has(p.room)) enterRoom(p.room, p.id); else toast("It's closed right now."); } });
    }
  });
  // one toast per place: the door and its same-named landmark / station twin are discovered together
  let busy = false;
  G.on('place:discover', id => { if (busy || !G.places) return; const p = G.places.get(id); if (!p || !p.name) return; busy = true; try { for (const q of G.places.list()) if (q !== p && q.name === p.name && Math.hypot(q.x - p.x, q.y - p.y) < 30 && !G.places.known(q.id)) G.places.discover(q.id, true); } finally { busy = false; } });
}
