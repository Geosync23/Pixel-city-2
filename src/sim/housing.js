// Housing: which home is yours, what furniture you own and where it stands, deliveries, moving, renting/buying, doors.
//
// State G.state.home = {
//   id, owned,                         current home id (data/homes.js) + whether it is owned (money.js bills rent or upkeep from these)
//   items:   [{ uid, itemId, asset, x, y, flip } | { uid, itemId, asset, wall: 'y'|'x', at }]   placed furniture (room coords of the min corner;
//             `inc: 1` = came with the home: movable, but not sellable and it stays behind when you move). Art params come from VIS[itemId].
//             `r: 'bath'` = the piece stands in the home's BATHROOM (room `home:<id>:bath`, coords are that room's); no `r` = the main room.
//   shellV: n                          version of the home's shell (SHELLS[id].v) the furniture was laid out for. Lower than the shell's -> migrateShell() on load:
//                                      landlord's pieces go to their new slots, everything else stays where it still fits, else moves to the nearest free
//                                      spot, else goes into storage (never lost); the player gets one toast about it.
//   bathV: 1                           bathrooms-as-rooms migration done (old saves: showers/tubs move from the main room to the bathroom slots, see migrateBath)
//   storage: [itemId]                  owned but not placed            stay: [itemId]  stored pieces that belong to the home
//   boxes:   [{ uid, k: 'm' (moving) | 'd' (delivery), label, items: [itemId], gives?: [{ item, qty }], intro? }]   unopened boxes standing in the home
//   pending: [{ id, t }]               bought, arriving at abs minute t
//   mortgage: { home, left, weekly, weeks } | null,   n (uid counter),
//   card: n                            flattened cardboard waiting by the door after unpacking deliveries (recycle() clears it; each costs 1 ambience, 3 at most) }
//   Delivery boxes (k 'd') may also carry: sz 's' small parcel | 'l' big carton | 'f' flat-pack (needs building), pos [planned place per item, from design
//   mode's "try it here"], asm 1 (flat-pack that arrives built), from (seller name). Unpacking a delivery PUTS THE PIECE IN THE ROOM (planned place, else the
//   nearest free spot to the box, else storage): see unpack(uid, { place: true }) and src/sim/homedesign.js.
// MORE HOMES (owner msg 107): a home may have EXTRA ROOMS besides 'main' and 'bath' (SHELLS[id].rooms: upstairs, a bedroom, a den ...; scene `int:home:<id>:<room>`),
//   joined by link pieces (stairs, doors: shell items with `to`); a placed piece's room is `r` (none = main). `furnished: 1` = moved in pre-furnished.
//   PRE-FURNISHED or FURNISH IT YOURSELF: rent(id, { furnished }) / buy(id, term, { furnished }). Furnished = the designer's set (scenes/rooms/home_more.js SETS)
//   stands in the rooms and is YOURS, for a one-off package price pkgPrice(id) (data/homes.js FURNISH.rate x list prices). Empty = the landlord's kitchen and
//   bathroom, a camp mattress on the bed slot when you own no bed, and a WELCOME KIT box of food. Your own furniture always comes along in boxes.
//   More API: rooms(id?) -> ['main', 'bath', ...]   goRoom(id, to, from)   roomWith(tag) -> 'home:<id>[:<room>]' | null   navEdges(sceneId) -> [{ x, y, label, to }] | null
//   view(id, furnished = true) -> a VIEWING: walk round a home that is not yours (nothing private works there)   viewing() -> { id, furnished } | null
//   viewFurnished(bool)   pkgPrice(id)   furnishedSet(id)   seedNav()      homes() rows also carry pkg, pieces, roomsN.      Event 'home:view'(id, furnished).
// SLOT RULE (Wave C): only real furniture counts toward the home's furniture slots (SIZE_CLASSES.furnitureSlots). Wall pieces, rugs, things that stand on a
//   surface and small floor pieces (a footprint of half a tile: plants, floor lamps, baskets) are DECOR with their own allowance: 2 x the slots + 10.
//   slots() -> { used, max, decor, decorMax }; isDecor(itemId).
//
// G.housing
//   current() -> { id, home (data), owned, state, roomId, door (city poi id) } | null       isHome(sceneId = current scene) -> bool
//   homes() -> [{ id, home, available, current, owned, rent, price, down, canRent, canBuy, unlockDay }]
//   rent(homeId) -> bool        buy(homeId, termIx = 1) -> bool (20% down + weekly mortgage bill)      payOff() -> bool      mortgage()
//   start(homeId)               new-game move-in (starter kit, 3 moving boxes, first week's rent). Runs on 'game:new'({ homeId }).
//   goHome() -> Promise         teleport inside your home          refresh() rebuild the home room in place (when standing in it)
//   canEnter(roomId) -> bool    whyNot(roomId) -> string | null    invite(roomId, hours = 3)   (story homes: home:sibling / grandma / friend)
//   addFurniture(itemId, { instant? }) -> bool     bought home good: arrives as a delivery box (next day 09:00), or straight to storage
//   deliverNow()                land all pending deliveries        unpack(boxUid) -> [itemId]   box contents -> storage (+ gifts to bag/wardrobe)
//   storage() -> [itemId] (incl. stay)     items() -> placed     slots() -> { used, max }     ambience() -> number
//   addBox({ label, items: [itemId], pos?, sz?, asm?, from? }) -> box | null (null = no room for another box)      BOX_MAX
//   snapshot() -> string / restore(string)   the furniture layout + storage (design mode's undo)      recolour(uid, itemId) -> $ paid | false (same family)
//   cardboard() -> n      recycle() -> n taken out      freeSpot(itemId, nearX, nearY) -> pos | null   the nearest place the piece fits (table tops for small things)
//   check({ itemId, x, y, flip } | { itemId, wall, at }, ignoreUid?) -> null | reason string
//       Rules: inside the room and off its void cut-outs (L-shaped homes), not on other solids, doorways (front door, exit mat, bathroom door) stay clear,
//       the piece must be reachable from the door and must not wall in another piece or the spot you stand on to use one; wall pieces cannot hang
//       behind a full-height block of the shell (`build.block`). Boxes pile up by the same rules (roomDef).
//   place(itemId, pos, { quiet? }) -> uid | null      move(uid, pos, opts) -> bool      rotate(uid, opts) -> bool
//   store(uid, opts) -> bool    sell(uid | itemId, opts) -> price | 0     sellPrice(itemId)
//   visual(itemId) -> { id (asset id), a (asset), p, wall, solid, z, mount, size: [w, d, h] }      roomDef(homeId, room?) -> room def for interior.js
//   ROOMS OF A HOME: 'main' and 'bath' (SHELLS[id].bath). room() -> the one you are standing in. isHome() is true in both; check/place/move/rotate, shell()
//   and roomDef(yourHomeId) (room omitted) all act on the room you are standing in, so Decorate works in the bathroom too. Showers and bathtubs placed while
//   in the main room are plumbed into the bathroom automatically (they only work there).
//   guestSpots() -> [{ x, y, z, dir, seat: true, fx } | { x, y, stand: true }]  free seats + standing spots in the current home scene (world coords)
//   openListings() / showCard(homeId) / decorate()   provided by src/ui/furnish.js
// Events: 'home:move'(homeId, prevId), 'home:furnish'(), 'home:delivery'(box), 'home:unpack'(box, introBoxesDone), 'home:bought'(homeId)
// Flags: G.state.flags.boxes_unpacked (count of intro moving boxes opened), flags['invited:<roomId>'] = abs minute the invitation ends.
// City doors: on entering the city, door pois of homes get `poi.onUse` (info card for homes that are not yours) / `poi.locked` (story homes).
import { G } from '../core/game.js';
import { HOMES, HOME_BY_ID, SIZE_CLASSES, MOVING_BOXES, MOVING_BOXES_DONE_MOODLET, AMBIENCE_TIERS, MOVING, FURNISH } from '../data/homes.js';
import { ITEM_BY_ID } from '../data/items.js';
import { MORTGAGE, SELL_BACK, DELIVERY } from '../data/economy.js';
import { BOX_MAX, sizeOf as shipSize } from '../data/shipping.js';
import { GOOD_BY_ID } from '../data/goods.js';
import { asset, assetSize } from '../art/registry.js';
import { SHELLS, STORY_HOMES, withExit, bathDoorItems, bathDef } from '../scenes/rooms/homes.js';
import { SETS } from '../scenes/rooms/home_more.js';   /* more homes (adds its shells to SHELLS) + the designer's furnished set of every home */
import { toast } from '../ui/kit.js';
import { GT } from '../engine/world.js';

export const order = 60;

/* ---------- item id -> furniture art (EVERY sellable home good needs a line here) ---------- */
const V = (a, p, o) => Object.assign({ a, p: p || {} }, o);
const T3 = (tag, a, extra) => ({ [tag + '_t0']: V(a, Object.assign({ tier: 0 }, extra)), [tag + '_t1']: V(a, Object.assign({ tier: 1 }, extra)), [tag + '_t2']: V(a, Object.assign({ tier: 2 }, extra)) });
export const VIS = Object.assign({},
  T3('fridge', 'kitchen.fridge'), T3('stove', 'kitchen.stove'), T3('microwave', 'kitchen.microwave'), T3('bookshelf', 'bookshelf'), T3('music', 'stereo'),
  T3('shower', 'bath.shower'), T3('bath', 'bath.bathtub'), T3('easel', 'easel'), {
    bed_t0: V('bed.floor', { tier: 0 }), bed_t1: V('bed.single', { tier: 1 }), bed_t2: V('bed.king', { tier: 2 }),
    sofa_t0: V('sofa.2', { tier: 0, c: '#7a8450' }), sofa_t1: V('sofa.3', { tier: 1, c: '#d9a23a' }), sofa_t2: V('sofa.3', { tier: 2, c: '#2f7a80' }),
    tv_t0: V('tv.small', { tier: 0 }), tv_t1: V('tv.medium', { tier: 1 }), tv_t2: V('tv.wall', { tier: 2 }),
    computer_t0: V('laptop', { tier: 0 }), computer_t1: V('desk', { tier: 1 }), computer_t2: V('desk', { tier: 2 }),
    game_t0: V('console', { tier: 0 }), game_t1: V('console', { tier: 1 }), game_t2: V('arcade', { tier: 2 }),
    exercise_t0: V('yogamat', { tier: 0 }), exercise_t1: V('dumbbells', { tier: 1 }), exercise_t2: V('treadmill', { tier: 2 }),
    instrument_t0: V('guitar', { tier: 0 }), instrument_t1: V('guitar', { tier: 1 }), instrument_t2: V('piano', { tier: 2 }),
    plant_t0: V('plant.cactus', { tier: 0 }), plant_t1: V('plant.monstera', { tier: 1 }), plant_t2: V('plant.fiddle', { tier: 2 }),
    rug_t0: V('rug', { tier: 0, w: 2, d: 1, pat: 'stripe' }), rug_t1: V('rug', { tier: 1, w: 3, d: 2, pat: 'plain' }), rug_t2: V('rug', { tier: 2, w: 3, d: 2, pat: 'persian' }),
    decor_t0: V('wall.poster', { tier: 0 }), decor_t1: V('wall.art', { tier: 1, art: 'sea', w: 1.5, h: 1 }), decor_t2: V('wall.photos', { tier: 2, seed: 7 }),
    decor_string_lights: V('wall.fairylights', { len: 2, warm: true }), decor_floor_lamp: V('lamp.floor', { tier: 1 }), decor_wall_clock: V('wall.clock', { tier: 1 }),
    decor_aquarium: V('aquarium', { tier: 2 }), plant_fern: V('plant.hanging', { tier: 1 }, { z: 1.4 }),
  });
const FALLBACK = { plant: V('plant.snake'), rug: V('rug'), decor: V('wall.art'), sofa: V('sofa.2'), bed: V('bed.single') };
const vcache = {};
export function visual(itemId) {
  if (vcache[itemId]) return vcache[itemId];
  const it = ITEM_BY_ID[itemId], v = VIS[itemId] || (it && FALLBACK[it.tag]) || V('boxes');
  let a; try { a = asset('furn.home.' + v.a); } catch (e) { a = asset('furn.home.boxes'); }
  return vcache[itemId] = { id: a.id, a, p: v.p, wall: !!a.wall, solid: a.solid !== false, z: v.z, mount: v.mount, size: assetSize(a, v.p) };
}

let S = null;
const blank = () => ({ id: null, owned: false, items: [], storage: [], stay: [], boxes: [], pending: [], mortgage: null, n: 1, bathV: 1, shellV: 0, card: 0 });
function norm() { S = G.state.home; if (!S || typeof S !== 'object') S = G.state.home = blank(); const old = S.bathV === undefined; const b = blank(); for (const k in b) if (S[k] === undefined) S[k] = b[k]; if (S.id && !SHELLS[S.id]) S.id = null; if (old) { S.bathV = 0; } if (!S.bathV) migrateBath(); if (S.id && (S.shellV || 1) < shellV(S.id)) migrateShell(); return S; }
/* ---------- rooms of a home: 'main' | 'bath' ---------- */
const BATH_TAGS = ['shower', 'bath'];
const isBathGood = itemId => { const it = ITEM_BY_ID[itemId]; return !!it && BATH_TAGS.includes(it.tag); };
/* ROOMS (more homes): 'main', 'bath' (SHELLS[id].bath) and any extra room in SHELLS[id].rooms (upstairs, a bedroom, a den ...). Scene ids: int:home:<id>[:<room>]. */
const roomOfScene = sid => { if (!S || !S.id || !sid) return null; const base = 'int:home:' + S.id; if (sid === base) return 'main'; if (!String(sid).startsWith(base + ':')) return null; const r = String(sid).slice(base.length + 1); return shOf(S.id, r) ? r : null; };
const curRoom = () => roomOfScene(G.scene && G.scene.id) || 'main';
const shOf = (id, room) => { const sh = SHELLS[id]; if (!sh || !room || room === 'main') return sh; return room === 'bath' ? sh.bath : (sh.rooms && sh.rooms[room]) || undefined; };
const inRoom = (it, room) => (room === 'main' ? !it.r : it.r === room);
const roomKeys = id => { const sh = SHELLS[id]; return sh ? ['main'].concat(sh.bath ? ['bath'] : [], Object.keys(sh.rooms || {})) : []; };
const sceneOf = (id, room) => 'int:home:' + id + (!room || room === 'main' ? '' : ':' + room);
const linkItems = sh => (sh.fixed || []).filter(i => i.to);
/** first free spot for a bathroom piece: its slot, else anywhere it fits (uses check() against the bathroom) */
function bathSpot(itemId, ignore) {
  const b = shOf(S.id, 'bath'); if (!b) return null; const tag = (ITEM_BY_ID[itemId] || {}).tag, sl = b.slots && b.slots[tag], c = [];
  if (sl) c.push({ x: sl[0], y: sl[1], flip: !!sl[2] });
  for (const k in b.slots || {}) if (k !== tag) c.push({ x: b.slots[k][0], y: b.slots[k][1], flip: !!b.slots[k][2] });
  for (let y = 0; y <= b.d - 1; y += .5) for (let x = 0; x <= b.w - 1; x += .5) c.push({ x, y, flip: false }, { x, y, flip: true });
  for (const pos of c) if (!check(Object.assign({ itemId }, pos), ignore, 'bath')) return pos;
  return null;
}
/** old saves kept the shower / bathtub in the main room: move them into the bathroom (or into storage when there is no room for them) */
function migrateBath() {
  S.bathV = 1; if (!S.id || !shOf(S.id, 'bath')) return;
  for (const it of S.items.slice()) {
    if (it.r || it.wall || !isBathGood(it.itemId)) continue;
    const i = S.items.indexOf(it); S.items.splice(i, 1);                 // take it out so it does not collide with itself
    const pos = bathSpot(it.itemId);
    if (pos) { it.x = pos.x; it.y = pos.y; it.flip = pos.flip; it.r = 'bath'; S.items.push(it); } else (it.inc ? S.stay : S.storage).push(it.itemId);
  }
}
const uid = p => p + (S.n++);
const nameOf = id => (ITEM_BY_ID[id] ? ITEM_BY_ID[id].name : id);
const fmt = n => (G.money ? G.money.fmt(n) : '$' + n);
const isHome = sid => { if (!S.id) return false; const s = sid === undefined ? (G.scene && G.scene.id) : sid; return !!roomOfScene(s); };
const changed = quiet => { G.emit('home:furnish'); if (!quiet) refresh(); };

/* ---------- geometry ---------- */
const EPS = .01;
function sizeOfDef(i) { let a; try { a = asset(i.id); } catch (e) { return [1, 1, 1]; } const s = assetSize(a, i.p || {}); return i.flip && !i.wall ? [s[1], s[0], s[2]] : s; }
function rectOfDef(i) { const s = sizeOfDef(i); return [i.x, i.y, i.x + s[0], i.y + s[1]]; }
function solidDef(i) { if (i.wall || i.solid === false) return false; try { return asset(i.id).solid !== false; } catch (e) { return false; } }
const hit = (a, b) => a[0] < b[2] - EPS && b[0] < a[2] - EPS && a[1] < b[3] - EPS && b[1] < a[3] - EPS;
const voidRects = sh => (sh.floors || []).filter(f => f.floor === GT.void).map(f => [Math.floor(f.x0), Math.floor(f.y0), Math.ceil(f.x1), Math.ceil(f.y1)]);   // holes in the floor plan (L-shaped rooms)
/** stretches of a back wall hidden behind a full-height block of the shell (nothing can hang there) */
const wallCover = (sh, wall) => (sh.fixed || []).filter(i => !i.wall && i.id.includes('build.block')).map(rectOfDef).filter(r => (wall === 'y' ? r[1] : r[0]) < EPS).map(r => (wall === 'y' ? [r[0], r[2]] : [r[1], r[3]]));
function keepRects(sh) { const out = [], wr = (b) => { const o = b.off || 0; return b.wall === 'y' ? [b.at - .1, o, b.at + 1.1, o + 1.5] : [o, b.at - .1, o + 1.5, b.at + 1.1]; }; if (sh.door) out.push(wr(sh.door)); else if (sh.exit) out.push([sh.exit.x - 1, sh.exit.y - 1.5, sh.exit.x + 1, sh.exit.y + .5]); if (sh.bathDoor) out.push(wr(sh.bathDoor));
  for (const l of linkItems(sh)) if (l.spot) out.push([l.spot[0] - .5, l.spot[1] - .5, l.spot[0] + .5, l.spot[1] + .5]);   /* stairs and room doors: the spot you arrive on stays clear */
  return out; }
function spawnOf(sh) { if (sh.door) return sh.door.wall === 'y' ? [sh.door.at + .5, .9] : [.9, sh.door.at + .5]; if (sh.exit) return [sh.exit.x, sh.exit.y - .2]; const l = linkItems(sh).find(i => i.spot); return l ? [l.spot[0], l.spot[1]] : [sh.w / 2, sh.d / 2]; }
/** which of the rects can be walked up to from the door (rects = solids; all of them block) */
function floodMap(sh, rects) {
  const W = sh.w * 2, D = sh.d * 2, g = new Uint8Array(W * D);
  for (const r of rects) for (let y = Math.max(0, Math.floor(r[1] * 2 + EPS)); y < Math.min(D, Math.ceil(r[3] * 2 - EPS)); y++) for (let x = Math.max(0, Math.floor(r[0] * 2 + EPS)); x < Math.min(W, Math.ceil(r[2] * 2 - EPS)); x++) g[y * W + x] = 1;
  const sp = spawnOf(sh), q = [Math.min(D - 1, Math.floor(sp[1] * 2)) * W + Math.min(W - 1, Math.floor(sp[0] * 2))]; if (g[q[0]]) return { g, W, D }; g[q[0]] = 2;
  while (q.length) { const c = q.pop(), x = c % W, y = (c - x) / W; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= D) continue; const k = ny * W + nx; if (!g[k]) { g[k] = 2; q.push(k); } } }
  return { g, W, D };
}
function reach(sh, rects, blocked = []) {
  const { g, W, D } = floodMap(sh, rects.concat(blocked));
  return rects.map(r => { for (let y = Math.floor(r[1] * 2 + EPS) - 1; y <= Math.ceil(r[3] * 2 - EPS); y++) for (let x = Math.floor(r[0] * 2 + EPS) - 1; x <= Math.ceil(r[2] * 2 - EPS); x++) if (x >= 0 && y >= 0 && x < W && y < D && g[y * W + x] === 2) return true; return false; });
}
/** which of the floor spots ([x, y] points, e.g. the spot you stand on to use a piece) can be walked to from the door */
function spotsReach(sh, blocked, spots) { const { g, W, D } = floodMap(sh, blocked); return spots.map(s => { const x = Math.floor(s[0] * 2 + EPS), y = Math.floor(s[1] * 2 + EPS); return x >= 0 && y >= 0 && x < W && y < D && g[y * W + x] === 2; }); }
/** the spot a character stands on to use a floor piece (room coords), or null when the engine picks one itself */
function useSpot(i) { if (i.wall) return null; let a; try { a = asset(i.id); } catch (e) { return null; } const u = typeof a.use === 'function' ? a.use(i.p || {}) : a.use; if (!u) return null; return i.flip ? [i.x + u.y, i.y + u.x] : [i.x + u.x, i.y + u.y]; }
const cellOf = s => { const x = Math.floor(s[0] * 2 + EPS) / 2, y = Math.floor(s[1] * 2 + EPS) / 2; return [x, y, x + .5, y + .5]; };
function check(c, ignore, room = curRoom()) {
  const sh = shOf(S.id, room); if (!sh) return 'You have no home yet';
  const v = visual(c.itemId), items = roomDef(S.id, room).items.filter(i => !(ignore && i.uid === ignore));
  if (v.wall) {
    if (!c.wall) return 'This hangs on a wall';
    const L = c.wall === 'y' ? sh.w : sh.d, w = v.size[0]; if (c.at < -EPS || c.at + w > L + EPS) return 'Off the end of the wall';
    for (const s of wallCover(sh, c.wall)) if (c.at < s[1] - EPS && s[0] < c.at + w - EPS) return 'A wall is in the way';
    if (v.a.id.includes('fairylights')) return null;
    const m0 = v.mount !== undefined ? v.mount : (v.a.mount || 0), m1 = m0 + v.size[2];
    for (const i of items) if (i.wall === c.wall && !i.id.includes('fairylights')) { const s = sizeOfDef(i); if (!(c.at < i.at + s[0] - EPS && i.at < c.at + w - EPS)) continue;
      let im = 0; try { im = i.mount !== undefined ? i.mount : (asset(i.id).mount || 0); } catch (e) { im = 0; } if (m0 < im + s[2] - .05 && im < m1 - .05) return i.fixed ? 'A window or door is in the way' : 'Something already hangs there'; }
    return null;
  }
  if (c.wall) return 'This stands on the floor';
  const s = c.flip ? [v.size[1], v.size[0]] : v.size, r = [c.x, c.y, c.x + s[0], c.y + s[1]];
  if (r[0] < -EPS || r[1] < -EPS || r[2] > sh.w + EPS || r[3] > sh.d + EPS) return 'Outside the room';
  const voids = voidRects(sh); for (const k of voids) if (hit(r, k)) return 'Outside the room';
  if (!v.solid) return null;
  const solids = items.filter(solidDef).map(rectOfDef);
  for (const o of solids) if (hit(r, o)) return 'Something is in the way';
  for (const k of keepRects(sh)) if (hit(r, k)) return 'Keep the doorway clear';
  const before = reach(sh, solids, voids), after = reach(sh, solids.concat([r]), voids);
  if (!after[solids.length]) return 'You could not get to it there';
  for (let i = 0; i < solids.length; i++) if (before[i] && !after[i]) return 'That would block the way';
  const fr = items.map(useSpot).filter(u => u && !hit(cellOf(u), r));     // ... nor seal off the spot you use something from (a piece standing ON such a spot is the player's own call)
  if (fr.length) { const b4 = spotsReach(sh, solids.concat(voids), fr), af = spotsReach(sh, solids.concat([r], voids), fr); if (b4.some((ok, i) => ok && !af[i])) return 'That would block the way'; }
  return null;
}

/* ---------- room definition ---------- */
function defOf(it) {
  const v = visual(it.itemId), d = { id: v.id, p: v.p, good: it.itemId, uid: it.uid };
  if (v.wall) { d.wall = it.wall || 'y'; d.at = it.at || 0; if (v.mount !== undefined) d.mount = v.mount; } else { d.x = it.x; d.y = it.y; d.flip = !!it.flip; if (v.z !== undefined) d.z = v.z; }
  return d;
}
const incCache = {};
/** the home's `included` items at their default slots -> { items, rest } */
function included(id) {
  if (incCache[id]) return incCache[id];
  const sh = SHELLS[id], h = HOME_BY_ID[id], used = {}, items = [], rest = [];
  for (const itemId of h.included || []) {
    const it = ITEM_BY_ID[itemId], bs = sh.bath && sh.bath.slots, inBath = !!(it && bs && bs[it.tag] && !used[it.tag]);
    let k = inBath ? it.tag : it && sh.slots[it.tag] && !used[it.tag] ? it.tag : null, rm = inBath ? 'bath' : null;
    if (!k && it && !used[it.tag]) for (const r in sh.rooms || {}) if ((sh.rooms[r].slots || {})[it.tag]) { k = it.tag; rm = r; break; }   /* a slot in another room (the bedroom upstairs) */
    if (!k && !used.extra && sh.slots.extra) k = 'extra';
    if (!k) { rest.push(itemId); continue; } used[k] = 1; const s = rm ? shOf(id, rm).slots[k] : sh.slots[k], v = visual(itemId);
    const o = v.wall ? { itemId, asset: v.id, wall: 'y', at: s[0], inc: 1 } : { itemId, asset: v.id, x: s[0], y: s[1], flip: !!s[2], inc: 1 }; if (rm) o.r = rm; items.push(o);
  }
  return incCache[id] = { items, rest };
}
function roomDef(id, room) {
  const mine = S.id === id; if (!room) room = mine ? curRoom() : 'main'; if (!shOf(id, room)) room = 'main';
  const sh = shOf(id, room), h = HOME_BY_ID[id], bath = room === 'bath', main = room === 'main';
  const list = sh.fixed.map(i => Object.assign({ fixed: true }, i, i.to ? { tags: (i.tags || []).concat('homelink'), home: id, from: room } : null)).concat(main ? bathDoorItems(sh) : []);
  for (const it of mine ? S.items : shown(id)) if (inRoom(it, room)) list.push(defOf(it));
  if (mine && (S.boxes.length || S.card > 0) && main) {
    // boxes stand on the shell's box spots (else anywhere free), never in a doorway, on the spot you use something from, or where they would wall something in
    const real = list.filter(solidDef).map(rectOfDef), voids = voidRects(sh), solids = real.concat(keepRects(sh), voids, list.map(useSpot).filter(Boolean).map(cellOf)), spots = sh.boxes.slice();
    for (let y = sh.d - 2; y >= 1; y -= 1) for (let x = sh.w - 1.5; x >= 1; x -= 1) spots.push([x, y]);
    /* keep the places that were planned for what is in the boxes free, when there is room elsewhere */
    const plans = []; for (const b of S.boxes) (b.pos || []).forEach((q, k) => { if (q && q.x !== undefined && b.items[k]) plans.push(rectAt(visual(b.items[k]), q)); });
    for (const b of S.boxes) {
      const kind = boxKind(b), sz = b.k === 'm' || kind !== 's' ? 1 : .5; let at = null, any = null; const base = reach(sh, real, voids), fr = list.map(useSpot).filter(Boolean), fb = spotsReach(sh, real.concat(voids), fr);
      for (const s of spots.filter(q => !plans.some(o => hit([q[0], q[1], q[0] + sz, q[1] + sz], o))).concat(plans.length ? spots : [])) { if (at) break; const r = [s[0], s[1], s[0] + sz, s[1] + sz]; if (r[2] > sh.w || r[3] > sh.d || solids.some(o => hit(r, o))) continue; if (!any) any = s;
        const front = cellOf(sz === 1 ? [s[0] + .5, s[1] + 1.3] : [s[0] + .25, s[1] + .8]); if (front[3] > sh.d || real.some(o => hit(front, o)) || voids.some(o => hit(front, o))) continue;
        const a = reach(sh, real.concat([r]), voids); if (!a[real.length] || base.some((ok, i) => ok && !a[i])) continue;
        const fa = spotsReach(sh, real.concat([r], voids), fr.concat([[front[0] + .25, front[1] + .25]])); if (fa[fr.length] && !fb.some((ok, i) => ok && !fa[i])) { at = s; break; } }
      at = at || any; if (at) { const r = [at[0], at[1], at[0] + sz, at[1] + sz]; solids.push(r); real.push(r); }
      if (at) list.push({ id: b.k === 'm' ? 'furn.home.boxes' : boxArt()[kind], x: at[0], y: at[1], box: b.uid, bk: b.k === 'm' ? 'm' : kind, p: { seed: (parseInt(String(b.uid).slice(1), 10) || 1) % 7 } });
    }
    if (S.card > 0 && boxArt().card) { const s = spots.find(q => { const r = [q[0], q[1], q[0] + .5, q[1] + .5]; return r[2] <= sh.w && r[3] <= sh.d && !solids.some(o => hit(r, o)); }); if (s) list.push({ id: boxArt().card, x: s[0], y: s[1], card: 1, solid: false, p: { n: Math.min(3, S.card) } }); }
  }
  if (G.goods && G.goods.surfaceZ) G.goods.surfaceZ(list);   /* goods (sim/goods.js): small pieces stand ON the table / counter / dresser they were put on */
  const flat = i => (!i.wall && !solidDef(i) && sizeOfDef(i)[2] < .1 ? 0 : 1);
  list.sort((a, b) => flat(a) - flat(b));
  if (bath) { const d = Object.assign(bathDef(id, list), { home: mine, homeId: id, room }); if (sh.from) { d.exits[0].label = sh.exit.label || 'Back'; d.exits[0].to = sceneOf(id, sh.from); d.exits[0].use = () => goRoom(id, sh.from, 'bath'); } return guard(d, mine); }
  if (!main) {   /* an extra room: upstairs, a bedroom, a den. Its way back is an exit mat (sh.exit) and / or link pieces (stairs, doors: items with `to`) */
    const d = { name: h.name + ': ' + (sh.name || 'room'), home: mine, homeId: id, room, w: sh.w, d: sh.d, floor: sh.floor, floors: sh.floors, wall: sh.wall, items: list,
      exits: sh.exit ? [{ x: sh.exit.x, y: sh.exit.y, label: sh.exit.label || 'Back', to: sceneOf(id, sh.exit.to || 'main'), use: () => goRoom(id, sh.exit.to || 'main', room) }] : [] };
    const sp = spawnOf(sh); if (!sh.exit) d.spawn = { x: sp[0], y: sp[1], dir: 1 };
    return guard(d, mine);
  }
  return guard(withExit({ name: h.name, home: mine, homeId: id, room, w: sh.w, d: sh.d, floor: sh.floor, floors: sh.floors, wall: sh.wall, items: list }, sh, 'home:' + id), mine);
}
/* ---------- more homes: rooms of a home, viewings, the designer's furnished set ---------- */
/** walk from one room of a home into another: you arrive on the `spot` of the link piece that leads back (stairs, a door), else on the room's exit mat */
function goRoom(id, to, from) {
  const sh = shOf(id, to); if (!sh) return Promise.resolve(null); let sp = null; const l = linkItems(sh).find(i => i.to === from && i.spot);
  if (l) sp = { x: 1 + l.spot[0], y: 1 + l.spot[1], dir: l.spot[2] === undefined ? 1 : l.spot[2] }; else if (sh.exit) sp = { x: 1 + sh.exit.x, y: 1 + sh.exit.y - .2, dir: 3 };
  return G.go(sceneOf(id, to), Object.assign({ fresh: true }, sp)).then(r => { if (l) stepOff(sh); return r; });
}
/* QA7: you arrive standing ON the link back (stairs down): its big door-sized tap target then ate the first floor taps and sent you straight back down
   (the arrow to an attic ladder looped between floors). Take one step into the room. */
function stepOff(sh) { try { const p = G.player, cx = 1 + sh.w / 2, cy = 1 + sh.d / 2, d0 = Math.hypot(cx - p.x, cy - p.y), dx = d0 > .3 ? cx - p.x : 0, dy = d0 > .3 ? cy - p.y : 1, d = Math.hypot(dx, dy) || 1; for (const k of [1.3, 1, .7]) { const nx = p.x + dx / d * k, ny = p.y + dy / d * k; if (!G.world.isBlocked(nx, ny)) { p.x = nx; p.y = ny; p.path = null; if (G.snapCam) G.snapCam(); return; } } } catch (e) { } }
/* a home you are only LOOKING AT (a viewing): nothing private works in there (no sleeping in the show bed), you can walk every room and sit down */
function guard(def, mine) {
  if (mine) return def; const prev = def.setup;
  def.setup = (scene, g) => { if (prev) prev(scene, g); scene.interactables = scene.interactables.filter(it => it.exit || it.homelink || it.bathdoor || !it.fx || (it.fx.tags.includes('seat') && !it.fx.tags.includes('bed'))); };
  return def;
}
let viewing = null;                                   /* { id, furnished } while a viewing is on (not saved) */
const setOf = id => SETS[id] || [];
/** what stands in a home that is not yours: the landlord's fittings, plus the designer's set while you view it furnished */
function shown(id) { const inc = included(id).items; return viewing && viewing.id === id && viewing.furnished ? inc.concat(setOf(id).map(p => Object.assign({ asset: visual(p.itemId).id }, p))) : inc; }
/** price of the furniture package of a home (the designer's set, yours to keep): a share of the list prices, rounded to $10 */
const pkgCache = {};
function pkgPrice(id) { if (pkgCache[id] !== undefined) return pkgCache[id]; let n = 0; for (const p of setOf(id)) n += (ITEM_BY_ID[p.itemId] || {}).price || 0; return pkgCache[id] = Math.round(n * FURNISH.rate / 10) * 10; }
function view(id, furnished = true) {
  if (!SHELLS[id] || S.id === id) return Promise.resolve(null); viewing = { id, furnished: !!furnished && setOf(id).length > 0 };
  G.state.flags.lastDoor = 'door:home:' + id; seedNav(); G.emit('home:view', id, viewing.furnished); return G.go('int:home:' + id, { fresh: true });
}
const viewingNow = () => { const s = G.scene && G.scene.id; return viewing && viewing.id !== S.id && s && (s === 'int:home:' + viewing.id || String(s).startsWith('int:home:' + viewing.id + ':')) ? viewing : null; };
function viewFurnished(on) { const v = viewingNow(); if (!v) return false; v.furnished = !!on && setOf(v.id).length > 0; G.emit('home:view', v.id, v.furnished); G.go(G.scene.id, { fresh: true, x: G.player.x, y: G.player.y, dir: G.player.dir, fade: false }); return true; }
/** the room of YOUR home where a piece with this function tag stands ('bed', 'fridge', 'shower' ...) -> room id 'home:<id>[:<room>]' | null (for the guide arrow) */
function roomWith(tag) { if (!S.id) return null; const it = S.items.find(i => (ITEM_BY_ID[i.itemId] || {}).tag === tag); return it ? 'home:' + S.id + (it.r ? ':' + it.r : '') : null; }
/** how the rooms of a multi-room home connect, for the guide arrow (its scene graph cannot read dynamic rooms): sceneId 'int:home:<id>[:<room>]' ->
 *  [{ x, y (world), label, to (scene id) }] | null (not a home, or a plain home whose only inner door is the legacy bathroom door). Works for ANY home, yours or not. */
function navEdges(sid) {
  const m = /^int:home:([^:]+)(?::(.+))?$/.exec(String(sid || '')); if (!m) return null; const id = m[1], r = m[2] || 'main', top = SHELLS[id], sh = shOf(id, r);
  if (!top || !sh || !(top.rooms || (top.bath && top.bath.from))) return null; const out = [];
  for (const l of linkItems(sh)) { const s = sizeOfDef(l), o = { label: l.label || 'Door', to: sceneOf(id, l.to) }; if (l.spot) o.spot = { x: 1 + l.spot[0], y: 1 + l.spot[1] };
    out.push(Object.assign(o, l.wall ? (l.wall === 'y' ? { x: 1 + l.at + s[0] / 2, y: 1 } : { x: 1, y: 1 + l.at + s[0] / 2 }) : { x: 1 + l.x + s[0] / 2, y: 1 + l.y + s[1] / 2 })); }
  if (r !== 'main' && sh.exit && (r !== 'bath' || sh.from)) out.push({ x: 1 + sh.exit.x, y: 1 + sh.exit.y, label: sh.exit.label || 'Back', to: sceneOf(id, r === 'bath' ? sh.from : sh.exit.to || 'main') });
  return out;
}
/** until the arrow asks navEdges itself (hook in sim/navgoals.js, see docs/reports/homes_more.md): write the links of YOUR home and of the home you are viewing
 *  into the arrow's own notebook of learned doors (G.state.nav.edges), exactly as if you had walked through each of them once */
function seedNav() {
  const nav = G.state.nav; if (!nav) return; if (!nav.edges || typeof nav.edges !== 'object') nav.edges = {};
  for (const id of [S.id, viewing && viewing.id]) { if (!id) continue; for (const r of roomKeys(id)) { const sid = sceneOf(id, r), e = navEdges(sid); if (e && e.length) nav.edges[sid] = e.map(q => ({ x: Math.round(q.x * 2) / 2, y: Math.round(q.y * 2) / 2, to: q.to })); } }
}

/* delivery boxes: 's' small parcel, 'l' big carton, 'f' flat-pack (art: src/art/homedesign/boxes.js; the old parcel art when that is missing) */
let BOX_ART_ = null;
const boxArt = () => { if (BOX_ART_) return BOX_ART_; const o = {}; for (const [k, id] of [['s', 'parcel'], ['l', 'carton'], ['f', 'flatpack'], ['card', 'cardboard']]) { try { o[k] = asset('furn.homedesign.' + id).id; } catch (e) { o[k] = k === 'card' ? null : 'furn.home.parcel'; } } return BOX_ART_ = o; };
function boxKind(b) { if (b.sz) return b.sz; const id = b.items && b.items[0], g = id && GOOD_BY_ID[id]; if (g) return g.carry ? 's' : 'l'; const it = id && ITEM_BY_ID[id]; return it && it.footprint && it.footprint[0] * it.footprint[1] >= 1.5 ? 'l' : 's'; }

/* ---------- shell versions: the building was rebuilt (SHELLS[id].v went up) -> re-fit the furniture of an old save ---------- */
function shellV(id) { return (SHELLS[id] && SHELLS[id].v) || 1; }
let note = null;                                     // one toast about the re-fit, shown on the next scene change
const fixedMass = (sh, x, y) => (sh.fixed || []).some(i => { if (i.wall || !i.id.includes('build.') || !solidDef(i)) return false; const r = rectOfDef(i); return x > r[0] && x < r[2] && y > r[1] && y < r[3]; });
function fits(itemId, pos, room) {
  if (check(Object.assign({ itemId }, pos), undefined, room)) return false; const v = visual(itemId);
  if (!v.wall && !v.solid) { const s = pos.flip ? [v.size[1], v.size[0]] : v.size; if (fixedMass(shOf(S.id, room), pos.x + s[0] / 2, pos.y + s[1] / 2)) return false; }   // a rug under a wall
  return true;
}
/* stricter than check(), for when the GAME moves furniture: never park a piece on the spot you stand on to use a fitting / landlord's piece, and keep its own front usable */
const rectAt = (v, pos) => { const s = pos.flip ? [v.size[1], v.size[0]] : v.size; return [pos.x, pos.y, pos.x + s[0], pos.y + s[1]]; };
function clearOfFronts(itemId, pos, room, all) {
  const v = visual(itemId); if (v.wall || !v.solid) return true; const r = rectAt(v, pos), sh = shOf(S.id, room);
  const u = useSpot({ id: v.id, p: v.p, x: pos.x, y: pos.y, flip: pos.flip });           // its own front must not face a wall of the new shell
  if (u && (u[0] < .25 || u[1] < .25 || u[0] > sh.w - .25 || u[1] > sh.d - .25 || voidRects(sh).some(o => hit(cellOf(u), o)) || (sh.fixed || []).some(i => solidDef(i) && hit(cellOf(u), rectOfDef(i))))) return false;
  for (const d of roomDef(S.id, room).items) { if (d.wall || !(all || d.fixed || (d.uid && (S.items.find(x => x.uid === d.uid) || {}).inc))) continue; const u = useSpot(d); if (u && hit(r, cellOf(u))) return false; }
  return true;
}
function ownFrontOk(itemId, pos, room) {
  const v = visual(itemId); if (v.wall || !v.solid) return true; const u = useSpot({ id: v.id, p: v.p, x: pos.x, y: pos.y, flip: pos.flip }); if (!u) return true;
  const sh = shOf(S.id, room); if (u[0] < .25 || u[1] < .25 || u[0] > sh.w - .25 || u[1] > sh.d - .25) return false;
  const c = cellOf(u), solids = roomDef(S.id, room).items.filter(solidDef).map(rectOfDef).concat([rectAt(v, pos)], voidRects(sh)); if (solids.some(o => hit(c, o))) return false;
  return spotsReach(sh, solids, [u])[0];
}
function nearest(it, room) {
  const sh = shOf(S.id, room), v = visual(it.itemId), out = [];
  if (v.wall) { const w0 = it.wall === 'x' ? 'x' : 'y'; for (const w of [w0, w0 === 'y' ? 'x' : 'y']) { const L = (w === 'y' ? sh.w : sh.d) - v.size[0]; for (let at = 0; at <= L + EPS; at += .5) out.push({ pos: { wall: w, at }, d: Math.abs(at - (it.at || 0)) + (w === w0 ? 0 : 100) }); } }
  else { const ox = it.x || 0, oy = it.y || 0; for (const flip of [!!it.flip, !it.flip]) { const s = flip ? [v.size[1], v.size[0]] : v.size; for (let y = 0; y <= sh.d - s[1] + EPS; y += .5) for (let x = 0; x <= sh.w - s[0] + EPS; x += .5) out.push({ pos: { x, y, flip }, d: Math.hypot(x - ox, y - oy) + (flip === !!it.flip ? 0 : .75) }); } }
  out.sort((a, b) => a.d - b.d); let plain = null, tried = 0;
  const solids = v.wall || !v.solid ? null : roomDef(S.id, room).items.filter(solidDef).map(rectOfDef).concat(voidRects(sh), keepRects(sh));
  for (const c of out) {
    if (solids) { const s = c.pos.flip ? [v.size[1], v.size[0]] : v.size, r = [c.pos.x, c.pos.y, c.pos.x + s[0], c.pos.y + s[1]]; if (solids.some(o => hit(r, o))) continue; }   // cheap test first
    if (!fits(it.itemId, c.pos, room)) continue; if (!plain) plain = c.pos;
    if (clearOfFronts(it.itemId, c.pos, room, true) && ownFrontOk(it.itemId, c.pos, room)) return c.pos;
    if (++tried > 400) break;
  }
  return plain;
}
function migrateShell() {
  const id = S.id; S.shellV = shellV(id); if (!id || !S.items.length) return;
  const all = S.items, boxes = S.boxes, slots = included(id).items.slice(), stored = []; let moved = 0; S.items = []; S.boxes = [];
  const rank = it => (it.inc ? 0 : visual(it.itemId).wall ? 3 : visual(it.itemId).solid ? 1 : 2);
  for (const it of all.slice().sort((a, b) => rank(a) - rank(b))) {
    const v = visual(it.itemId); let room = it.r && shOf(id, it.r) ? it.r : 'main', pos = null; const was = JSON.stringify(posOf(v, it)) + room;
    if (it.inc) { const k = slots.findIndex(s => s.itemId === it.itemId); if (k >= 0) { const s = slots.splice(k, 1)[0], rm = s.r || 'main', p = posOf(v, s); if (fits(it.itemId, p, rm)) { pos = p; room = rm; } } }   // landlord's pieces: to their new places
    if (!pos && fits(it.itemId, posOf(v, it), room) && clearOfFronts(it.itemId, posOf(v, it), room)) pos = posOf(v, it);                                                    // still fine where it stands
    if (!pos) pos = nearest(it, room);                                                                                      // nearest free spot
    if (!pos) { (it.inc ? S.stay : S.storage).push(it.itemId); stored.push(nameOf(it.itemId)); continue; }                  // no room at all: into storage
    delete it.x; delete it.y; delete it.flip; delete it.wall; delete it.at; delete it.r; Object.assign(it, pos); if (room !== 'main') it.r = room;
    S.items.push(it); if (JSON.stringify(pos) + room !== was) moved++;
  }
  S.boxes = boxes;
  if (moved || stored.length) note = `${HOME_BY_ID[id].name} has been rebuilt: ` + (moved ? `${moved} of your things ${moved === 1 ? 'was' : 'were'} moved to fit the new layout` : '') + (moved && stored.length ? ', and ' : '') + (stored.length ? `${stored.join(', ')} ${stored.length === 1 ? 'is' : 'are'} in storage (Decorate to place ${stored.length === 1 ? 'it' : 'them'})` : '') + '.';
}

/* ---------- moving in / out ---------- */
function moveIn(id, owned, o = {}) {
  const prev = S.id, carry = prev ? S.items.filter(i => !i.inc).map(i => i.itemId).concat(S.storage) : S.storage.slice();
  const inc = included(id);
  S.id = id; S.owned = !!owned; S.shellV = shellV(id); S.items = inc.items.map(i => Object.assign({ uid: uid('f') }, i)); S.stay = inc.rest.slice(); S.storage = [];
  if (!prev) S.boxes = []; S.card = 0; S.furnished = o.furnished ? 1 : 0;
  if (o.intro) for (const b of MOVING_BOXES) S.boxes.push({ uid: uid('b'), k: 'm', label: b.label, items: [], gives: b.gives, intro: 1 });
  /* PRE-FURNISHED: the designer's set stands where the designer put it, and it is yours (it moves with you, you can sell it) */
  if (o.furnished) for (const p of setOf(id)) S.items.push(Object.assign({ uid: uid('f'), asset: visual(p.itemId).id }, p));
  /* FURNISH IT YOURSELF: the kitchen and bathroom are fitted; if you own no bed there is a camp mattress on the bedroom floor, and a welcome box of food */
  else if (!o.intro) {
    const hasBed = carry.some(i => (ITEM_BY_ID[i] || {}).tag === 'bed') || S.items.some(i => (ITEM_BY_ID[i.itemId] || {}).tag === 'bed');
    if (!hasBed && ITEM_BY_ID[FURNISH.kitBed]) { const sl = bedSlot(id), it = sl && Object.assign({ uid: uid('f'), itemId: FURNISH.kitBed, asset: visual(FURNISH.kitBed).id, x: sl.pos[0], y: sl.pos[1], flip: !!sl.pos[2] }, sl.room === 'main' ? null : { r: sl.room });
      if (it && !check(Object.assign({ itemId: it.itemId }, it), undefined, sl.room)) S.items.push(it); else S.storage.push(FURNISH.kitBed); }
    S.boxes.push({ uid: uid('b'), k: 'm', label: 'WELCOME KIT', items: [], gives: FURNISH.kitGives, kit: 1 });
  }
  while (carry.length && S.boxes.length < 7) S.boxes.push({ uid: uid('b'), k: 'm', label: 'FURNITURE', items: carry.splice(0, 4) });
  S.storage.push(...carry);
  G.state.flags.lastHomeDoor = 'door:home:' + id;
  if (G.places && G.places.discover) try { G.places.discover('home:' + id); } catch (e) { /* not a registered place */ }
  G.emit('home:move', id, prev);
}
/** where a bed stands by default in a home: the `bed` slot of the main room or of any other room */
function bedSlot(id) { const sh = SHELLS[id]; if (sh.slots && sh.slots.bed) return { room: 'main', pos: sh.slots.bed }; for (const r in sh.rooms || {}) if ((sh.rooms[r].slots || {}).bed) return { room: r, pos: sh.rooms[r].slots.bed }; return null; }
const STARTER_PANTRY = [['eggs', 4], ['bread', 4], ['butter', 3], ['cheese', 2], ['milk', 2], ['noodles', 2], ['rice', 2], ['oats', 2], ['carrot', 2], ['tomato', 1], ['lettuce', 1], ['lemon', 1], ['banana', 2], ['sugar', 1], ['tea', 2]]; // day 1: ~15 known recipes cookable (data/recipes_extra.js)
function start(homeId) {
  norm(); if (!SHELLS[homeId]) return false; const keep = S.storage; Object.assign(S, blank(), { storage: keep || [] });
  moveIn(homeId, false, { intro: true }); G.state.flags.boxes_unpacked = 0;
  const h = HOME_BY_ID[homeId]; if (h.rentPerWeek && G.money) G.money.pay(h.rentPerWeek, 'First week rent — ' + h.name, { force: true, silent: true });
  drain();
  // the kitchen is never bare on day 1: enough basics to cook scrambled eggs, grilled cheese or noodle soup straight away (owner msg 77)
  if (G.inv && G.inv.fridge) for (const [id, n] of STARTER_PANTRY) if (ITEM_BY_ID[id] && !G.inv.fridge.count(id)) G.inv.fridge.add(id, n, { silent: true });
  return true;
}
function equity() { const h = HOME_BY_ID[S.id]; return S.owned && h && h.buyPrice ? Math.max(0, Math.round(h.buyPrice * SELL_BACK.home - (S.mortgage ? S.mortgage.left : 0))) : 0; }
const unlocked = h => (G.dev && G.dev.all) || G.now().day >= ((h.unlock && h.unlock.day) || 0);
function homes() {
  return HOMES.filter(h => SHELLS[h.id]).map(h => ({ id: h.id, home: h, available: unlocked(h), unlockDay: (h.unlock && h.unlock.day) || 0, current: S.id === h.id, owned: S.id === h.id && S.owned,
    rent: h.rentPerWeek, price: h.buyPrice, down: h.buyPrice ? Math.round(h.buyPrice * MORTGAGE.downPayment) : null, pkg: pkgPrice(h.id), pieces: setOf(h.id).length, roomsN: roomKeys(h.id).length,
    canRent: !!h.rentPerWeek && S.id !== h.id && unlocked(h), canBuy: !!h.buyPrice && !(S.id === h.id && S.owned) && unlocked(h) }));
}
async function afterMove(id, wasInside) { if (wasInside) { G.state.flags.lastDoor = 'door:home:' + id; await G.go('int:home:' + id, { fresh: true }); } }
function rent(id, o = {}) {
  const h = HOME_BY_ID[id], furn = !!o.furnished && setOf(id).length > 0; if (!h || !SHELLS[id] || !h.rentPerWeek) return false; if (S.id === id) { toast('You already live here.'); return false; }
  if (!unlocked(h)) { toast('That listing is not on the market yet.'); return false; }
  const eq = equity(), cost = h.rentPerWeek + (S.id ? MOVING.moveFee : 0) + (furn ? pkgPrice(id) : 0);
  if (G.money && !G.money.pay(cost, 'Lease — ' + h.name)) return false;
  if (eq && G.money) G.money.add(eq, 'Sold ' + HOME_BY_ID[S.id].name);
  S.mortgage = null; const inside = isHome() || !!viewingNow(); moveIn(id, false, { furnished: furn }); toast(welcome(h, furn), 'good', 5200); afterMove(id, inside); return true;
}
const welcome = (h, furn) => (furn ? `Welcome to ${h.name}! It is furnished and ready, and every piece is yours.` : `Welcome to ${h.name}! The rooms are yours to fill: the furniture shops and the Roomy app will help.`);
function buy(id, termIx = 1, o = {}) {
  const h = HOME_BY_ID[id], furn = !!o.furnished && S.id !== id && setOf(id).length > 0; if (!h || !SHELLS[id] || !h.buyPrice) return false; if (S.id === id && S.owned) { toast('You already own it.'); return false; }
  if (!unlocked(h)) { toast('That listing is not on the market yet.'); return false; }
  const term = MORTGAGE.terms[termIx] || MORTGAGE.terms[0], down = Math.round(h.buyPrice * MORTGAGE.downPayment), same = S.id === id, eq = same ? 0 : equity(), net = down + (S.id && !same ? MOVING.moveFee : 0) + (furn ? pkgPrice(id) : 0) - eq;
  if (net > 0 && G.money && !G.money.pay(net, 'Down payment — ' + h.name)) return false;
  if (net < 0 && G.money) G.money.add(-net, 'Home sale balance');
  const total = Math.round((h.buyPrice - down) * (1 + term.fee));
  S.mortgage = { home: id, left: total, weekly: Math.ceil(total / term.weeks), weeks: term.weeks };
  const inside = isHome() || !!viewingNow(); if (same) S.owned = true; else moveIn(id, true, { furnished: furn });
  toast(`${h.name} is yours. Mortgage: ${fmt(S.mortgage.weekly)} a week for ${term.weeks} weeks.`, 'good', 4500); G.emit('home:bought', id); if (!same) afterMove(id, inside); return true;
}
function payOff() { const m = S.mortgage; if (!m) return false; if (G.money && !G.money.pay(m.left, 'Mortgage paid off')) return false; S.mortgage = null; toast('Mortgage paid off. The place is all yours!', 'good'); return true; }

/* ---------- deliveries & boxes ---------- */
function addFurniture(itemId, o = {}) {
  if (!ITEM_BY_ID[itemId]) return false;
  if (!S.id || o.instant) { S.storage.push(itemId); G.emit('home:furnish'); return true; }
  const h = HOME_BY_ID[S.id], fast = h.perk && h.perk.effect && h.perk.effect.freeSameDayDelivery, t = Math.floor(G.state.t);
  S.pending.push({ id: itemId, t: fast ? t + DELIVERY.sameDayHours * 60 : (Math.floor(t / 1440) + 1) * 1440 + DELIVERY.homegoodsNextMorningHour * 60 });
  if (!o.quiet) toast(`${nameOf(itemId)}: ${fast ? 'the doorman will have it upstairs in a few hours' : 'delivered to your home tomorrow at 09:00'}.`, 'info', 3600);
  return true;
}
function land(all) {
  const t = G.state.t, due = S.pending.filter(p => all || p.t <= t); if (!due.length) return 0;
  S.pending = S.pending.filter(p => !due.includes(p));
  for (const p of due) { if (!addBox({ label: nameOf(p.id), items: [p.id] })) S.storage.push(p.id); }
  const msg = due.length === 1 ? `${nameOf(due[0].id)} has been delivered.` : `${due.length} parcels have been delivered.`;
  if (G.phone && G.phone.notify && !isHome()) G.phone.notify({ app: 'delivery', title: 'Nest & Wire', text: msg + ' Unpack at home.', icon: due[0].id }); else toast(msg, 'good');
  if (isHome()) refresh(); return due.length;
}
/** a delivery box lands in the home: { label, items: [itemId], pos? [planned place per item], sz? 's'|'l'|'f', asm?, from? } -> the box, or null when the home holds BOX_MAX boxes already */
function addBox(o) {
  if (!S.id || S.boxes.length >= BOX_MAX) return null; const items = (o.items || []).filter(id => ITEM_BY_ID[id]); if (!items.length) return null;
  const b = { uid: uid('b'), k: 'd', label: o.label || nameOf(items[0]), items }; if (o.sz) b.sz = o.sz; if (o.pos) b.pos = o.pos; if (o.asm) b.asm = 1; if (o.from) b.from = o.from;
  S.boxes.push(b); G.emit('home:delivery', b); return b;
}
function drain() { const o = G.state.owned; if (o && Array.isArray(o.furniture) && o.furniture.length) { for (const f of o.furniture.splice(0)) addFurniture(f.id || f, { quiet: true, instant: !S.id }); } }
/** a free place for a piece near (nx, ny) in the main room: the planned place when it still works, a table top for small surface pieces, else the nearest free spot */
function spotFor(itemId, plan, nx, ny, room = 'main') {
  const v = visual(itemId), ok = pos => pos && !check(Object.assign({ itemId }, pos), undefined, room);
  if (plan && (v.wall ? plan.wall : plan.x !== undefined) && ok(plan)) return posOf(v, plan);
  const g = GOOD_BY_ID[itemId];
  if (g && g.place === 'surface' && !v.wall && G.goods && G.goods.surfaceZ) {          /* onto the nearest free table / shelf / counter top */
    const defs = roomDef(S.id, room).items, tops = [];
    for (const d of defs) { if (d.wall || d.box || d.x === undefined || !solidDef(d)) continue; const s = sizeOfDef(d), pos = { x: Math.round((d.x + s[0] / 2 - v.size[0] / 2) * 2) / 2, y: Math.round((d.y + s[1] / 2 - v.size[1] / 2) * 2) / 2, flip: false };
      const probe = { id: v.id, p: v.p, good: itemId, x: pos.x, y: pos.y }; G.goods.surfaceZ(defs.concat([probe])); if (!probe.z) continue;
      if (defs.some(o => o.good && o !== d && !o.wall && GOOD_BY_ID[o.good] && GOOD_BY_ID[o.good].place === 'surface' && Math.abs(o.x - pos.x) < .5 && Math.abs(o.y - pos.y) < .5)) continue;
      if (ok(pos)) tops.push({ pos, d: Math.hypot(pos.x - nx, pos.y - ny) }); }
    if (tops.length) return tops.sort((a, b) => a.d - b.d)[0].pos;
  }
  return nearest(v.wall ? { itemId, wall: nx >= ny ? 'y' : 'x', at: Math.max(0, nx >= ny ? nx : ny) } : { itemId, x: nx, y: ny, flip: false }, room);
}
function unpack(boxUid, o = {}) {
  const i = S.boxes.findIndex(b => b.uid === boxUid); if (i < 0) return null; const b = S.boxes[i], got = [], placed = [], stored = [];
  let near = [1, 1]; if (o.place) { const d = roomDef(S.id, 'main').items.find(q => q.box === boxUid); if (d) near = [d.x, d.y]; else { const sh = shOf(S.id, 'main'); near = [sh.w / 2, sh.d / 2]; } }
  S.boxes.splice(i, 1);
  for (let k = 0; k < b.items.length; k++) { const id = b.items[k]; S.storage.push(id); got.push(nameOf(id));
    if (o.place) { const bathy = isBathGood(id) && shOf(S.id, 'bath'), pos = bathy ? { x: 0, y: 0 } : spotFor(id, b.pos && b.pos[k], near[0], near[1]), u = pos ? place(id, pos, { quiet: true, room: 'main' }) : null; if (u) placed.push({ uid: u, itemId: id }); else stored.push(id); } }
  if (b.k === 'd' && o.place) S.card = Math.min(9, (S.card || 0) + 1);
  b.placed = placed; b.stored = stored;
  for (const g of b.gives || []) { const it = ITEM_BY_ID[g.item]; if (!it) continue; got.push(it.name + (g.qty > 1 ? ' x' + g.qty : ''));
    if (it.category === 'homegood') for (let k = 0; k < (g.qty || 1); k++) S.storage.push(g.item);
    else if (it.category === 'outfit') { if (G.wardrobe) G.wardrobe.add(g.item, true); else (G.state.owned.outfits || (G.state.owned.outfits = [])).push(g.item); }
    else if (G.inv) { const kitchen = ['ingredient', 'meal', 'ready_meal'].includes(it.category) && G.inv.fridge;   // food from a box goes straight into the kitchen
      if (!(kitchen && G.inv.fridge.add(g.item, g.qty || 1, { silent: true })) && !G.inv.add(g.item, g.qty || 1) && G.inv.fridge) G.inv.fridge.add(g.item, g.qty || 1); } }
  if (b.intro) { const n = G.state.flags.boxes_unpacked = (G.state.flags.boxes_unpacked || 0) + 1; if (!S.boxes.some(x => x.intro) && G.needs) G.needs.addMoodlet(MOVING_BOXES_DONE_MOODLET); }
  if (got.length && !o.place) toast('Unpacked: ' + got.join(', ') + (b.items.length || (b.gives || []).some(g => (ITEM_BY_ID[g.item] || {}).category === 'homegood') ? '. Tap Decorate to place it.' : '.'), 'good', 4200);
  G.emit('home:unpack', b, G.state.flags.boxes_unpacked || 0); G.emit('home:furnish'); return o.place ? { placed, stored, items: b.items } : b.items;
}

/* ---------- furniture ---------- */
/** decor = wall pieces, rugs and other flat things, pieces that stand on a surface, and small floor pieces (half a tile): they do not use up furniture slots */
const decorCache = {};
function isDecor(itemId) { if (decorCache[itemId] !== undefined) return decorCache[itemId]; const v = visual(itemId), it = ITEM_BY_ID[itemId] || {}; return decorCache[itemId] = !!(v.wall || !v.solid || it.placement === 'surface' || it.placement === 'wall' || v.size[0] * v.size[1] <= .3); }
function slots() {
  const h = HOME_BY_ID[S.id]; if (!h) return { used: 0, max: 0, decor: 0, decorMax: 0 }; const max = SIZE_CLASSES[h.sizeClass].furnitureSlots + ((h.perk && h.perk.effect && h.perk.effect.extraFurnitureSlots) || 0);
  let used = 0, decor = 0; for (const i of S.items) { if (i.inc) continue; if (isDecor(i.itemId)) decor++; else used++; }
  return { used, max, decor, decorMax: max * 2 + 10 };
}
const posOf = (v, pos) => (v.wall ? { wall: pos.wall, at: pos.at } : { x: pos.x, y: pos.y, flip: !!pos.flip });
function place(itemId, pos, o = {}) {
  let from = S.storage, i = from.indexOf(itemId); if (i < 0) { from = S.stay; i = from.indexOf(itemId); } if (i < 0) return null;
  const inc = from === S.stay, sl = slots(), dec = isDecor(itemId); if (!inc && (dec ? sl.decor >= sl.decorMax : sl.used >= sl.max)) { if (!o.quiet) toast(dec ? 'That is a lot of decoration: store a piece first.' : 'This home is full of furniture: store a piece first.', 'bad'); return null; }
  const v = visual(itemId); let room = o.room || curRoom();
  if (room !== 'bath' && isBathGood(itemId) && shOf(S.id, 'bath')) {       // showers and tubs are plumbed into the bathroom wherever you drop them
    const bp = bathSpot(itemId); if (!bp) { if (!o.quiet) toast('The bathroom has no room for it: store something in there first.', 'bad'); return null; }
    pos = bp; room = 'bath'; if (!o.quiet) toast(`${nameOf(itemId)} goes in the bathroom: the plumber has fitted it there.`, 'info', 3600);
  }
  const why = check(Object.assign({ itemId }, pos), undefined, room); if (why) { if (!o.quiet) toast(why, 'bad'); return null; }
  from.splice(i, 1); const it = Object.assign({ uid: uid('f'), itemId, asset: v.id }, posOf(v, pos)); if (inc) it.inc = 1; if (room !== 'main') it.r = room; S.items.push(it); changed(o.quiet); return it.uid;
}
function move(id, pos, o = {}) {
  const it = S.items.find(i => i.uid === id); if (!it) return false; const v = visual(it.itemId), why = check(Object.assign({ itemId: it.itemId }, pos), id, it.r || 'main'); if (why) { if (!o.quiet) toast(why, 'bad'); return false; }
  delete it.x; delete it.y; delete it.flip; delete it.wall; delete it.at; Object.assign(it, posOf(v, pos)); changed(o.quiet); return true;
}
function rotate(id, o = {}) {
  const it = S.items.find(i => i.uid === id); if (!it) return false;
  if (it.wall) { const sh = shOf(S.id, it.r || 'main'), w = it.wall === 'y' ? 'x' : 'y', L = w === 'y' ? sh.w : sh.d, sz = visual(it.itemId).size[0]; for (let at = Math.min(it.at, L - sz); at >= 0; at -= .5) if (move(id, { wall: w, at }, { quiet: true })) { changed(o.quiet); return true; } return false; }
  return move(id, { x: it.x, y: it.y, flip: !it.flip }, o);
}
function store(id, o = {}) { const i = S.items.findIndex(x => x.uid === id); if (i < 0) return false; const it = S.items.splice(i, 1)[0]; (it.inc ? S.stay : S.storage).push(it.itemId); changed(o.quiet); return true; }
const sellPrice = itemId => Math.round(((ITEM_BY_ID[itemId] || {}).price || 0) * SELL_BACK.homegood);
function sell(ref, o = {}) {
  let itemId = null; const i = S.items.findIndex(x => x.uid === ref);
  if (i >= 0) { if (S.items[i].inc) { if (!o.quiet) toast('That belongs to the landlord.', 'bad'); return 0; } itemId = S.items.splice(i, 1)[0].itemId; }
  else { const j = S.storage.indexOf(ref); if (j < 0) return 0; itemId = S.storage.splice(j, 1)[0]; }
  const p = sellPrice(itemId); if (G.money) G.money.add(p, 'Sold ' + nameOf(itemId)); changed(o.quiet); return p;
}
/** swap a placed piece for another colourway of the same family (same art, same footprint). Free when it costs the same or less, else the difference. -> $ paid | false */
function recolour(ref, newId, o = {}) {
  const it = S.items.find(i => i.uid === ref), a = it && GOOD_BY_ID[it.itemId], b = GOOD_BY_ID[newId]; if (!it || !a || !b || a.family !== b.family || it.inc) return false; if (a.id === b.id) return 0;
  const va = visual(a.id), vb = visual(b.id); if (va.size[0] !== vb.size[0] || va.size[1] !== vb.size[1] || va.wall !== vb.wall) return false;
  const cost = Math.max(0, b.price - a.price); if (cost && G.money && !G.money.pay(cost, 'New colour: ' + b.name, { category: 'homegood' })) return false;
  it.itemId = b.id; it.asset = vb.id; changed(o.quiet); return cost;
}
const snapshot = () => JSON.stringify({ items: S.items, storage: S.storage, stay: S.stay });
function restore(str, o = {}) { let q; try { q = JSON.parse(str); } catch (e) { return false; } if (!q || !Array.isArray(q.items)) return false; S.items = q.items; S.storage = q.storage || []; S.stay = q.stay || []; changed(o.quiet); return true; }
function recycle() { const n = S.card || 0; S.card = 0; if (n) G.emit('home:furnish'); return n; }
function ambience() { const h = HOME_BY_ID[S.id]; let a = ((h && h.perk && h.perk.effect && h.perk.effect.ambienceBonus) || 0) - Math.min(3, S.card || 0); for (const it of S.items) { const d = ITEM_BY_ID[it.itemId]; a += (d && d.bonus && d.bonus.ambience) || 0; } return a; }
function homeMood() { if (!isHome() || !G.needs || !G.needs.addMoodlet) return; const a = ambience(), t = AMBIENCE_TIERS.find(x => a >= x.min); if (t) try { G.needs.addMoodlet(t.moodlet, 2); } catch (e) { /* unknown moodlet */ } }

/* ---------- scene helpers ---------- */
function refresh() { if (!isHome() || G.busy) return null; return G.go(G.scene.id, { fresh: true, x: G.player.x, y: G.player.y, dir: G.player.dir, fade: false }); }
function goHome() { if (!S.id) return Promise.resolve(null); G.state.flags.lastDoor = 'door:home:' + S.id; return G.go('int:home:' + S.id, { fresh: true }); }
function guestSpots() {
  const sc = G.scene, out = []; if (!sc || !sc.fixtures) return out; const P = G.player;
  for (const fx of sc.fixtures) if (fx.tags.includes('seat') && !fx.tags.includes('bed')) for (const s of fx.seats) if (s && !s.lie && Math.hypot(s.x - P.x, s.y - P.y) > .4) out.push({ x: s.x, y: s.y, z: s.z, dir: s.dir, seat: true, fx });
  const d = sc.def, W = sc.world; if (d) for (let y = 1.5; y < d.d; y += 1.5) for (let x = 1.5; x < d.w; x += 1.5) { const p = sc.toWorld(x, y); if (!W.isBlocked(p.x, p.y) && Math.hypot(p.x - P.x, p.y - P.y) > 1) out.push({ x: p.x, y: p.y, stand: true }); }
  return out;
}

/* ---------- doors ---------- */
const OWNER_NAME = { 'home:sibling': 'Nora', 'home:grandma': 'Nana Bea', 'home:friend': 'Kit' };
function whyNot(roomId) {
  const hid = roomId.slice(5);
  if (HOME_BY_ID[hid]) return S.id === hid ? null : 'This is not your home.';
  const st = STORY_HOMES[roomId]; if (!st) return null;
  const inv = G.state.flags['invited:' + roomId]; if (inv === true || inv > G.state.t) return null;
  const hr = G.now().hour, who = OWNER_NAME[roomId] || 'them';
  if (hr < 8) return `Too early to knock on ${who}'s door.`; if (hr >= 21) return `It is late. ${who} will be asleep.`;
  const rel = G.social && G.social.rel ? G.social.rel(st.owner) : null, need = roomId === 'home:friend' ? 20 : 0;
  if (rel !== null && rel !== undefined && rel < need) return `You do not know ${who} well enough to drop by unannounced.`;
  return null;
}
function lockDoors(world) {
  for (const p of world.pois || []) {
    if (p.type !== 'door' || !p.room || !String(p.room).startsWith('home:')) continue; const hid = p.room.slice(5);
    if (STORY_HOMES[p.room]) p.locked = () => whyNot(p.room);
    else if (HOME_BY_ID[hid]) p.onUse = () => { if (S.id === hid) return false; if (G.housing.showCard) G.housing.showCard(hid); else toast(`${HOME_BY_ID[hid].name}. Viewings at Bay Realty & Trust.`); return true; };
  }
}

export function init() {
  G.defineState('home', blank); norm();
  G.housing = {
    current: () => (S.id ? { id: S.id, home: HOME_BY_ID[S.id], owned: S.owned, state: S, roomId: 'home:' + S.id, door: 'door:home:' + S.id } : null),
    isHome, homes, rent, buy, payOff, mortgage: () => S.mortgage, start, goHome, refresh, equity,
    canEnter: roomId => !whyNot(roomId), whyNot, invite: (roomId, hours = 3) => { G.state.flags['invited:' + roomId] = G.state.t + hours * 60; },
    addFurniture, deliverNow: () => land(true), unpack: (id, o) => { const r = unpack(id, o); if (r && !(o && o.quiet)) refresh(); return r; }, addBox, BOX_MAX, boxKind,
    isDecor, recolour, snapshot, restore, freeSpot: (itemId, nx, ny) => spotFor(itemId, null, nx, ny, curRoom()), cardboard: () => S.card || 0, recycle,
    storage: () => S.storage.concat(S.stay), items: () => S.items, boxes: () => S.boxes, slots, ambience,
    check, place, move, rotate, store, sell, sellPrice, visual, roomDef, guestSpots, shell: id => (id ? SHELLS[id] : shOf(S.id, curRoom())), room: curRoom,
    rooms: id => roomKeys(id || S.id), goRoom, roomWith, view, viewing: viewingNow, viewFurnished, pkgPrice, furnishedSet: id => setOf(id).slice(), seedNav, navEdges,
  };
  G.on('load', () => { norm(); drain(); seedNav(); });
  G.on('home:move', seedNav); G.on('ready', seedNav);
  G.on('game:new', o => { norm(); start((o && o.homeId) || S.id || 'juniper_court'); });
  G.on('shop:buy', drain);
  G.on('minutes', () => { if (S.pending.length) land(false); });
  G.on('hour', homeMood);
  G.on('scene', s => { if (viewing && !viewingNow()) viewing = null; if (s && s.id === 'city') lockDoors(s.world); else { homeMood(); if (isHome() || viewingNow()) seedNav(); } if (note) { const n = note; note = null; setTimeout(() => toast(n, 'info', 7000), 900); } });
  const city = G.sceneCache.get('city'); if (city) lockDoors(city.world);
  let ctx = null;
  G.on('activity:start', (id, c) => { ctx = id === 'unpack_boxes' || id === 'assemble_furniture' ? c : null; });
  G.on('activity:done', (id, r) => { const it = ctx && ctx.fx && ctx.fx.item; if ((id !== 'unpack_boxes' && id !== 'assemble_furniture') || !it || !it.box) return; ctx = null; if (r && r.completed) { unpack(it.box); setTimeout(refresh, 60); } });
  const bills = () => G.money && G.money.addBillSource && !bills.done && (bills.done = true) && G.money.addBillSource(() => (S.mortgage ? [{ id: 'mortgage', label: 'Mortgage — ' + (HOME_BY_ID[S.mortgage.home] || {}).name, amount: Math.min(S.mortgage.weekly, S.mortgage.left) }] : []));
  bills(); G.on('ready', bills);
  G.on('bills:due', () => { const m = S.mortgage; if (!m) return; m.left -= Math.min(m.weekly, m.left); m.weeks = Math.max(0, m.weeks - 1); if (m.left <= 0) { S.mortgage = null; toast('Final mortgage payment made. The place is all yours!', 'good', 4000); } });
  drain();
}
