// Bladder need + toilets + restrooms. Numbers: src/data/needs.js (NEEDS 'bladder', BLADDER, moodlets need_to_go / bursting / relieved).
//
// What it does
//   - DRINKS: every drink you finish ('inv:use' of an item with category/course 'drink', or a soup) takes BLADDER.drink points off the need.
//   - TOILETS: any fixture tagged `toilet` (home art `furn.home.bath.toilet`, office-lobby restrooms, ...) gets a "Toilet" interaction ->
//     activity `use_toilet` (sit, 4 game minutes, +100 bladder, -3 hygiene). Any fixture tagged `sink` gets "Wash hands" (`wash_hands`, +6 hygiene,
//     +3 more right after a toilet visit).
//   - PUBLIC RESTROOMS: every non-home room that has a counter fixture (COUNTER_TAGS) and no toilet of its own gets a "Restroom" door on a free
//     piece of back wall (or a small sign stand when no wall is free). Using it is a short fade-out / fade-in (5 game minutes, bladder -> 100,
//     hands washed). Added on 'room:build', no room file is edited. Buildings `bld.civic.restroom` in the city get a "Public restroom" interaction.
//   - NAVIGATION: G.nav.find('bladder') (the HUD "tap a need" chooser) lists venues with a restroom, stations, the nearest park pavilion and Home.
//   - TIP: Bay Basics tip `bladder` (shown once, the first time the need runs low).
//
// G.bladder = {
//   useRestroom({ where?, text? }) -> Promise<bool>     the fade-out visit (also usable by other systems: trains, planes, events)
//   useToilet(fx) / washHands(fx)                       start the fixture activities
//   hasRestroom(roomId) -> true | false | null          does that room have a counter or a toilet (null = unknown / dynamic room)
//   drinkAmount(item) -> points a drink costs           parkRestrooms() -> [{ x, y, name }] (city coords of the pavilion doors)
//   COUNTER_TAGS
// }
// State G.state.bladder = { unwashed: abs minute of the last toilet visit without washing (0 = clean), visits: count }
// Events: 'bladder:relief'({ kind: 'toilet' | 'restroom', where }), 'bladder:drink'(itemId, points)
import { G } from '../core/game.js';
import { registerFixture, ROOMS } from '../scenes/interior.js';
import { ITEM_BY_ID } from '../data/items.js';
import { BLADDER } from '../data/needs.js';
import { asset } from '../art/registry.js';
import * as R from '../engine/raster.js';
import { toast, bubble } from '../ui/kit.js';
import { ICONS } from '../art/icons/icons.js';
import { icon, OV, ov, R as RECT, r, ps, P } from '../art/icons/_lib.js';

export const order = 135;   // after activities (55), the tips app (123) and the navigator (130)

// HUD / wellness icon: a toilet roll
ICONS['need.bladder'] = icon(() => { RECT(8, 6, 6, 9, P.white); OV(1, 2, 11, 10, P.white); ov(4, 5, 4, 4, P.tan); r(5, 6, 2, 2, P.brown); ps([[9, 12], [11, 12], [13, 12]], P.steel); r(9, 14, 5, 1, P.ice); });
ICONS['moodlet.need_to_go'] = ICONS['moodlet.bursting'] = ICONS['moodlet.relieved'] = ICONS['need.bladder'];

export const COUNTER_TAGS = ['checkout', 'till', 'host_stand', 'host', 'reception', 'ticket', 'tickets', 'ticketdesk', 'counter', 'mallcounter', 'boxoffice', 'perfbar', 'bar', 'frontdesk', 'desk', 'checkin', 'info', 'skyticket',
  'front_desk', 'bar_counter', 'pickup_counter', 'shop_counter', 'info_desk', 'exchange_desk', 'rental_desk', 'gate_desk', 'oversize_desk', 'lost_found'];
const O = 1;   // interior floor origin (see interior.js)
let S = null, going = false;
const wait = ms => new Promise(res => setTimeout(res, ms));
const isHomeRoom = id => /^home|^devhome/.test(id || '');

/* ---------- drinks ---------- */
export function drinkAmount(it) {
  if (!it) return 0; const D = BLADDER.drink, e = it.effects || {}, s = (it.id + ' ' + (it.name || '')).toLowerCase();
  const drink = it.category === 'drink' || it.course === 'drink';
  if (!drink) return /soup|chowder|ramen|broth|stew|pho\b/.test(s) ? D.soup : 0;
  if (e.alcohol) return D.alcohol; if (e.caffeine || /coffee|latte|espresso|tea\b|energy|cola/.test(s)) return D.caffeine; if (/water|hydro/.test(s)) return D.water;
  return D.default;
}

/* ---------- toilets & sinks ---------- */
function useToilet(fx) {
  if (!G.activities || !G.needs) return null; const before = G.needs.get('bladder'), seat = fx && fx.seats && fx.seats[0];
  return G.activities.start('use_toilet', { fx, at: seat || undefined, seated: !!seat, rate: 2, noSummary: true, onDone: () => {
    S.unwashed = Math.floor(G.state.t) || 1; S.visits++; G.needs.add('hygiene', BLADDER.unwashedHygiene);
    if (before < BLADDER.relievedBelow) G.needs.addMoodlet('relieved');
    toast(before < BLADDER.relievedBelow ? 'Ahh. Much better. (Wash your hands!)' : 'All done. Wash your hands at a sink.', 'good', 2600);
    G.emit('bladder:relief', { kind: 'toilet', where: G.scene && G.scene.roomId });
  } });
}
function washHands(fx) {
  if (!G.activities) return null;
  return G.activities.start('wash_hands', { fx, rate: 1, noSummary: true, onDone: () => {
    const fresh = S.unwashed && G.state.t - S.unwashed < 30; S.unwashed = 0; if (fresh) G.needs.add('hygiene', 3);
    toast(fresh ? 'Clean hands. Gold star.' : 'Hands washed.', 'good', 2000);
  } });
}

/* ---------- public restrooms ---------- */
async function useRestroom(o = {}) {
  if (going || G.busy || !G.needs) return false; going = true;
  const before = G.needs.get('bladder');
  try {
    if (G.fadeEl) { G.modal++; G.fadeEl.classList.add('on'); try { await wait(380); } finally { G.modal--; } }
    G.advance(BLADDER.restroomMinutes);
    G.needs.set('bladder', 100); G.needs.add('hygiene', BLADDER.restroomHygiene); S.unwashed = 0; S.visits++;
    if (before < BLADDER.relievedBelow) G.needs.addMoodlet('relieved');
    if (G.fadeEl) { G.modal++; try { await wait(260); } finally { G.modal--; G.fadeEl.classList.remove('on'); } }
    toast(o.text || (before < BLADDER.relievedBelow ? 'You use the restroom and wash your hands. What a relief.' : 'You use the restroom and wash your hands.'), 'good', 2800);
    if (G.player && before < BLADDER.relievedBelow) bubble(G.player, 'Phew!', 1600);
    G.emit('bladder:relief', { kind: 'restroom', where: o.where || (G.scene && (G.scene.roomId || G.scene.id)) });
    return true;
  } finally { going = false; }
}

const known = new Map();
/** does a room have a counter (-> a customer restroom) or its own toilet? null when it cannot be told without building the room */
function hasRestroom(roomId) {
  if (!roomId || isHomeRoom(roomId)) return false; if (known.has(roomId)) return known.get(roomId);
  const def = ROOMS.get(roomId); if (!def) return null; if (!def.items) return null;
  let v = false;
  for (const it of def.items) { let tags = it.tags || []; try { tags = tags.concat(asset(it.id).tags || []); } catch (e) { /* missing art */ } if (tags.some(t => COUNTER_TAGS.includes(t) || t === 'toilet' || t === 'restroom')) { v = true; break; } }
  known.set(roomId, v); return v;
}

const signDraw = () => { R.qy(0, .5, .06, 0, .34, '#2f6fd0'); R.qy(.04, .46, .07, .03, .31, '#3b82d6'); R.qy(.21, .29, .08, .22, .29, '#ffffff'); R.qy(.17, .33, .08, .07, .2, '#ffffff'); };
/** add the "Restroom" door (or sign stand) to a freshly built venue room */
function addRestroom(scene) {
  const def = scene.def, rid = scene.roomId; if (!def || !rid || isHomeRoom(rid) || scene._wc) return;
  const tagged = t => scene.fixtures.some(f => f.tags.includes(t));
  if (tagged('toilet') || tagged('restroom')) { scene._wc = 'own'; known.set(rid, true); return; }
  if (!scene.fixtures.some(f => f.tags.some(t => COUNTER_TAGS.includes(t)))) { known.set(rid, false); return; }
  const W = scene.world, w = def.w, d = def.d, H = (def.wall && def.wall.h) || 2.8;
  const solidAt = (x0, y0, x1, y1) => scene.fixtures.some(f => !f.item.wall && f.ob.size[2] > .12 && (f.ob.solid || f.ob.size[0] * f.ob.size[1] <= 9) && f.ob.B[0] < x1 - .01 && f.ob.B[3] > x0 + .01 && f.ob.B[1] < y1 - .01 && f.ob.B[4] > y0 + .01);
  const wallBusy = (wall, a0, a1) => scene.fixtures.some(f => { if (f.item.wall !== wall) return false; const s = wall === 'y' ? f.ob.B[0] - O : f.ob.B[1] - O, e = wall === 'y' ? f.ob.B[3] - O : f.ob.B[4] - O; return s < a1 && e > a0; });
  const nearExit = (x, y) => scene.interactables.some(i => i.exit && Math.hypot(i.x - x, i.y - y) < 1.6);
  // only spots a customer can walk to from the entrance, and never in the staff area behind a counter
  const sp = typeof scene.spawn === 'function' ? null : scene.spawn, seen = new Set(), key = (x, y) => Math.round(x * 2) + ',' + Math.round(y * 2);
  if (sp) { const q = [[Math.round(sp.x * 2) / 2, Math.round(sp.y * 2) / 2]]; seen.add(key(q[0][0], q[0][1])); while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[.5, 0], [-.5, 0], [0, .5], [0, -.5]]) { const nx = x + dx, ny = y + dy, k = key(nx, ny); if (seen.has(k) || nx < O || ny < O || nx > O + w || ny > O + d || W.isBlocked(nx, ny)) continue; seen.add(k); q.push([nx, ny]); } } }
  const staff = scene.fixtures.map(f => f.staff).filter(Boolean), counters = scene.fixtures.filter(f => f.tags.some(t => COUNTER_TAGS.includes(t)));
  // QA fix: the staff aisle between a counter and the wall its staff stand against (customers walked round the counter end to reach the door)
  const behind = (x, y) => counters.some(f => { const B = f.ob.B, q = f.staff; if (!q) return false; const m = .75;
    if (q.y < B[1]) return y < B[1] && x > B[0] - m && x < B[3] + m; if (q.x < B[0]) return x < B[0] && y > B[1] - m && y < B[4] + m; return false; });
  const okSpot = (x, y) => (!sp || seen.has(key(x, y)) || seen.has(key(x, y + .5)) || seen.has(key(x + .5, y))) && !W.isBlocked(x, y) && !nearExit(x, y) && !staff.some(q => Math.hypot(q.x - x, q.y - y) < 1.7) && !behind(x, y);
  let spot = null;
  const tryWall = wall => {
    const L = wall === 'y' ? w : d;
    for (let at = L - 1.5; at >= .5 && !spot; at -= .5) {
      if (wallBusy(wall, at - .25, at + 1.25)) continue;
      const fx = wall === 'y' ? O + at + .5 : O + .6, fy = wall === 'y' ? O + .6 : O + at + .5;
      if (wall === 'y' ? solidAt(O + at, O, O + at + 1, O + 1.1) : solidAt(O, O + at, O + 1.1, O + at + 1)) continue;
      if (!okSpot(fx, fy)) continue;
      spot = { wall, at, x: fx, y: fy };
    }
  };
  if (H >= 2.2) { tryWall('y'); if (!spot) tryWall('x'); }
  let it;
  if (spot) {
    let a = null; try { a = asset('furn.home.wall.door.room'); } catch (e) { a = null; }
    const flip = spot.wall === 'x', px = flip ? O : O + spot.at, py = flip ? O + spot.at : O;
    if (a) W.place(a, px, py, { p: { tier: 1 }, z: 0, flip, solid: false });
    W.placeCustom({ key: 'wcsign', size: [.5, .1, .36], vb: [0, 0, 0, .5, .12, .36], solid: false, draw: signDraw }, flip ? O : O + spot.at + .25, flip ? O + spot.at + .25 : O, { z: 1.82, flip });
    it = { x: flip ? O + .1 : spot.x, y: flip ? spot.y : O + .1, h: 1.6, hit: 16, spot: { x: spot.x, y: spot.y } };
    scene._wc = 'door';
  } else {
    // no free wall: a sign stand on the customer side, a few steps from the counter
    const cs = counters.map(f => f.use || { x: f.x, y: f.y }), cand = [];
    for (let y = .5; y < d - .5; y += .5) for (let x = .5; x < w; x += .5) { const X = O + x, Y = O + y, dc = Math.min(...cs.map(q => Math.hypot(q.x - X, q.y - Y))); if (dc < 1.6) continue; if (!okSpot(X, Y) || !okSpot(X, Y + .5) || W.isBlocked(X, Y + .5) || solidAt(X - .3, Y - .3, X + .3, Y + .3)) continue; if (scene.interactables.some(i => Math.hypot((i.spot || i).x - X, (i.spot || i).y - Y) < 1.1)) continue; cand.push([dc + (x <= 1 || y <= 1 ? 0 : 6), X, Y]); }   // prefer a spot against a back wall
    cand.sort((a, b) => a[0] - b[0]); const c = cand.length ? { x: cand[0][1], y: cand[0][2] } : null;
    if (!c) { known.set(rid, false); return; }
    W.placeCustom({ key: 'wcstand', size: [.5, .2, 1.5], vb: [-.1, -.1, 0, .6, .3, 1.6], solid: false, draw() { R.box(.2, .06, 0, .1, .08, 1.1, '#5e6676'); R.box(.08, .04, 0, .34, .12, .06, '#3a3644'); R.qy(0, .5, .16, 1.08, 1.46, '#2f6fd0'); R.qy(.04, .46, .17, 1.11, 1.43, '#3b82d6'); R.qy(.21, .29, .18, 1.32, 1.39, '#ffffff'); R.qy(.17, .33, .18, 1.16, 1.3, '#ffffff'); } }, c.x - .25, c.y - .1, { z: 0 });
    it = { x: c.x, y: c.y, h: 1.4, hit: 14, spot: { x: c.x, y: c.y + .6 } };
    scene._wc = 'sign';
  }
  known.set(rid, true);
  scene.interactables.push(Object.assign(it, { label: 'Restroom', restroom: true, use: () => useRestroom({ where: rid }) }));
}

/* ---------- park pavilions ---------- */
function parkRestrooms() {
  const c = G.sceneCache && G.sceneCache.get('city'); if (!c) return [];
  if (!c._wcList) c._wcList = c.world.objs.filter(o => o.id === 'bld.civic.restroom').map(o => { const dr = (o.a.door && o.a.door.at) || o.size[0] / 2; return o.flip ? { x: o.B[3] + .7, y: o.y + dr + .5, ix: o.B[3], iy: o.y + dr + .5, name: 'Public restroom' } : { x: o.x + dr + .5, y: o.B[4] + .7, ix: o.x + dr + .5, iy: o.B[4], name: 'Public restroom' }; });
  return c._wcList;
}
function wireCity(s) {
  if (!s || s.id !== 'city' || s._wcDone) return; s._wcDone = true;
  for (const p of parkRestrooms()) s.interactables.push({ x: p.ix, y: p.iy, h: 1.6, hit: 18, range: 1.6, spot: { x: p.x, y: p.y }, label: 'Public restroom', restroom: true, use: () => useRestroom({ where: 'park', text: 'The park pavilion is clean and smells of pine soap. Much better.' }) });
}

export function init() {
  S = G.defineState('bladder', () => ({ unwashed: 0, visits: 0 }));
  G.on('load', () => { S = G.state.bladder && typeof G.state.bladder === 'object' ? G.state.bladder : (G.state.bladder = { unwashed: 0, visits: 0 }); if (!S.visits) S.visits = 0; if (!S.unwashed) S.unwashed = 0; });
  G.bladder = { useRestroom, useToilet, washHands, hasRestroom, drinkAmount, parkRestrooms, COUNTER_TAGS };

  G.on('inv:use', id => { const n = drinkAmount(ITEM_BY_ID[id]); if (n && G.needs) { G.needs.add('bladder', -n); G.emit('bladder:drink', id, n); } });

  registerFixture('toilet', (fx, sc) => fx.tags.includes('lobby_restroom') || fx.tags.includes('restroom') && !fx.seats   // a restroom DOOR (office lobbies): the fade-out visit, not a seat at the wall
    ? { label: 'Restroom', restroom: true, guestOk: true, use: () => useRestroom({ where: sc && sc.roomId }) }
    : { label: 'Toilet', toilet: true, guestOk: true, use: () => useToilet(fx) });   // guestOk: story homes let visitors use these
  registerFixture('sink', fx => ({ label: 'Wash hands', guestOk: true, use: () => washHands(fx) }));
  G.on('room:build', scene => { try { addRestroom(scene); } catch (e) { console.warn('restroom: ' + e.message); } });
  G.on('scene', wireCity); wireCity(G.sceneCache && G.sceneCache.get('city'));

  let navDone = false; const nav = () => { if (navDone || !G.nav || !G.nav.addSource) return; navDone = true; G.nav.addSource('bladder', from => parkRestrooms().map(p => ({ id: { x: p.x, y: p.y, name: p.name }, name: 'Public restroom (park)', x: p.x, y: p.y, d: Math.abs(p.x - from.x) + Math.abs(p.y - from.y) })).sort((a, b) => a.d - b.d).slice(0, 1)); }; nav(); G.on('ready', nav);

  const tip = { id: 'bladder', topic: 'well', title: 'When nature calls', sys: 'needs', text: 'The Bladder bar empties through the day, faster after coffee or a beer. Use your own bathroom, or ask for the Restroom in any cafe, shop or station. Tap the Bladder bar for the nearest one.', go: { find: 'bladder' }, goLabel: 'Nearest restroom' };
  const reg = () => { if (G.tips && G.tips.register) G.tips.register(tip); }; reg(); G.on('ready', reg);
  G.on('needs:low', k => { if (k === 'bladder' && G.tips && G.tips.show) G.tips.show('bladder'); });
}
