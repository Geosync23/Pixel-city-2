// Interior rooms: cutaway isometric rooms built from a declarative room definition.
//
// Define rooms (usually in src/scenes/rooms/*.js, at import time or in init):
//   defineRoom({
//     id: 'cafe', name: 'Bean & Gone', w: 10, d: 8,              // floor size in tiles; (0,0) is the back corner
//     floor: GT.f_wood,  floors: [{x0,y0,x1,y1, floor: GT.f_tile}],   // base floor + optional patches
//     wall: { color: '#e9dcc0', pattern: 'plain'|'brick'|'planks'|'tile'|'stripes', color2, trim: '#7a4e2d', h: 2.8 },
//     items: [ { id: 'furn.cafe.counter', x: 2, y: 1, flip: false, p: {...} },      // furniture on the floor (room coords of its min corner)
//              { id: 'furn.cafe.menuboard', wall: 'y', at: 3, mount: 1.4 },         // wall-mounted: wall 'y' = the back wall along x (item faces +y), 'x' = the back wall along y (auto-flipped)
//            ],
//     exits: [ { x: 5, y: 7.5, label: 'Exit' } ],                 // doormat on the floor; leaving returns to the city door you came in by
//     zoom: 1,                                                     // extra zoom steps while inside (default 1)
//     music, tags...                                               // anything else is kept on scene.def
//   })
//   A room may instead be dynamic: defineRoom({ id: 'home', build: (arg) => def }) -> rebuilt on every visit (player homes).
//
// Gameplay hooks into furniture by function tag:
//   registerFixture('fridge', (fx, scene) => ({ label: 'Fridge', use(G) {...} }))   // return an interactable (x,y,spot filled in for you) or null
//   A fixture fx = { ob, asset, tags, x, y (centre), use: {x,y} world spot or null, seats: [{x,y,z,dir,lie,stand,staff}], staff: {x,y,dir}|null,
//     pose: {x,y,z,dir,anim}|null (body position while using a machine/booth/stage), bed: {x,y,z,dir}|null (lying spot), uses: [{x,y}]|null, item (the def entry) }
//   scene.fixtures lists them all; scene.byTag(tag) filters.
// Travel: enterRoom(roomId, doorPoiId?) from the city; exitRoom() to go back out.
import { G } from '../core/game.js';
import { World, GT } from '../engine/world.js';
import * as R from '../engine/raster.js';
import { asset, assetSize } from '../art/registry.js';

export const ROOMS = new Map();
export function defineRoom(def) { ROOMS.set(def.id, def); return def; }
const handlers = new Map();
/** fn(fixture, scene) -> interactable-ish object {label, use, range?} | null. Several handlers per tag are allowed. */
export function registerFixture(tag, fn) { let a = handlers.get(tag); if (!a) handlers.set(tag, a = []); a.push(fn); }

const O = 1; // floor origin offset inside the room's World (leaves space for the back walls)
const PATS = {
  plain: (c) => R.PAT.stucco(c), brick: c => R.PAT.brick(c), planks: c => R.PAT.planks(c, 5), tile: (c, c2) => (u, v) => (u % 8 === 0 || v % 8 === 0) ? R.dk(c, .2) : c,
  stripes: (c, c2) => R.PAT.vstripes(c, c2 || R.lt(c, .15), 6), siding: c => R.PAT.siding(c, 4),
};
function wallPat(wall, shade) { const c = R.dk(wall.color || '#e9dcc0', shade), f = PATS[wall.pattern || 'plain'] || PATS.plain; return f(c, wall.color2 ? R.dk(wall.color2, shade) : undefined); }

export function buildRoom(def, id) {
  const w = def.w, d = def.d, H = (def.wall && def.wall.h) || 2.8, wall = def.wall || {}, trim = wall.trim || '#7a5a44';
  const W = new World(w + O + 1, d + O + 1, { name: id, bg: def.bg || '#1b1a24', edge: def.edge || '#3a3440' }); W.skirt = .35; W.zmax = 4;
  W.ground(O, O, O + w, O + d, def.floor || GT.f_wood);
  for (const f of def.floors || []) W.ground(O + f.x0, O + f.y0, O + f.x1, O + f.y1, f.floor);
  W.bakeTerrainNav();
  // back walls
  W.placeCustom({ key: id + ':wy', size: [w, .5, H], vb: [0, 0, 0, w, .5, H + .1], draw() { R.box(0, .25, 0, w, .25, H, wall.color || '#e9dcc0', { l: wallPat(wall, .1), t: '#2a2733', ol: false }); R.qy(0, w, .5, 0, .22, trim); R.lw([0, .5, H], [w, .5, H], R.dk(trim, .3)); if (wall.rail) R.qy(0, w, .5, wall.rail, wall.rail + .1, trim); } }, O, O - .5, { z: 0 });
  W.placeCustom({ key: id + ':wx', size: [.5, d + .5, H], vb: [0, 0, 0, .5, d + .5, H + .1], draw() { R.box(.25, 0, 0, .25, d + .5, H, wall.color || '#e9dcc0', { r: wallPat(wall, .26), t: '#2a2733', ol: false }); R.qx(.5, .5, d + .5, 0, .22, R.dk(trim, .15)); R.lw([.5, .5, H], [.5, d + .5, H], R.dk(trim, .4)); if (wall.rail) R.qx(.5, .5, d + .5, wall.rail, wall.rail + .1, R.dk(trim, .15)); } }, O - .5, O - .5, { z: 0 });
  const scene = { world: W, def, indoor: true, ents: [], interactables: [], fixtures: [], roomId: def.id, zoom: def.zoom === undefined ? 1 : def.zoom };
  scene.byTag = t => scene.fixtures.filter(f => f.tags.includes(t));
  scene.toWorld = (x, y) => ({ x: x + O, y: y + O });
  for (const it of def.items || []) {
    let a; try { a = asset(it.id); } catch (e) { console.warn('room', id, 'missing asset', it.id); continue; }
    let ob, flip = !!it.flip;
    if (it.wall) { const s = assetSize(a, it.p || {}), mount = it.mount !== undefined ? it.mount : (a.mount || 0); if (it.wall === 'y') ob = W.place(a, O + it.at, O, { p: it.p || {}, z: mount, solid: false }); else { flip = true; ob = W.place(a, O, O + it.at, { p: it.p || {}, z: mount, flip: true, solid: false }); } }
    else ob = W.place(a, O + it.x, O + it.y, { p: it.p || {}, flip, z: it.z, solid: it.solid });
    ob.data = it;
    const L = q => { if (!q) return null; const lx = flip ? q.y : q.x, ly = flip ? q.x : q.y; const o = { x: ob.x + lx, y: ob.y + ly, z: q.z || 0 }; if (q.dir !== undefined) o.dir = flip ? [1, 0, 3, 2][q.dir] : q.dir; if (q.lie) o.lie = true; return o; };
    const P = it.p || {}, fnv = v => typeof v === 'function' ? v(P) : v; let st = a.seatsFor ? a.seatsFor(P) : fnv(a.seats); if (!Array.isArray(st)) st = [];
    const LL = q => { const o = L(q); if (o && q) { if (q.stand) o.stand = true; if (q.staff) o.staff = true; if (q.anim) o.anim = q.anim; } return o; };
    const fx = { ob, asset: a, item: it, tags: (a.tags || []).concat(it.tags || []), x: (ob.B[0] + ob.B[3]) / 2, y: (ob.B[1] + ob.B[4]) / 2, use: L(fnv(a.use)), seats: st.map(LL), staff: LL(fnv(a.staff)), pose: LL(fnv(a.pose)), bed: LL(fnv(a.bed)), uses: a.uses ? a.uses(P).map(L) : null };
    if (!fx.use && !it.wall) { // default use spot: in front (+y, or +x when flipped), else any free neighbour
      const c = flip ? [[ob.B[3] + .4, fx.y], [fx.x, ob.B[4] + .4]] : [[fx.x, ob.B[4] + .4], [ob.B[3] + .4, fx.y]]; c.push([fx.x, ob.B[1] - .4], [ob.B[0] - .4, fx.y]); fx._auto = c;
    } else if (!fx.use && it.wall) fx.use = it.wall === 'y' ? { x: fx.x, y: O + .6 } : { x: O + .6, y: fx.y };
    scene.fixtures.push(fx);
  }
  for (const fx of scene.fixtures) if (fx._auto) { const s = fx._auto.find(c => !W.isBlocked(c[0], c[1])); fx.use = s ? { x: s[0], y: s[1] } : null; }
  // exits
  for (const ex of def.exits || [{ x: w / 2, y: d - .5 }]) {
    const x = O + ex.x, y = O + ex.y;
    W.placeCustom({ key: 'doormat', size: [1.4, .8, .05], vb: [-.1, -.1, 0, 1.5, .9, .1], solid: false, draw() { R.qz(0, 1.4, 0, .8, .02, '#8a5a3a', '#7a4e2d'); R.qz(.15, 1.25, .12, .68, .03, '#a56b45'); R.lw([0, .8, .02], [1.4, .8, .02], '#5a3a26'); R.lw([1.4, 0, .02], [1.4, .8, .02], '#5a3a26'); } }, x - .7, y - .4, { z: 0 });
    scene.interactables.push({ x, y, label: ex.label || 'Exit', h: .3, hit: 14, range: 1.1, exit: true, use: () => ex.use ? ex.use(G) : exitRoom(ex) });
    if (!scene.spawn) scene.spawn = { x, y: y - .2, dir: 3 };
  }
  if (def.spawn) scene.spawn = { x: O + def.spawn.x, y: O + def.spawn.y, dir: def.spawn.dir };
  // fixtures -> interactables
  for (const fx of scene.fixtures) for (const t of fx.tags) for (const fn of handlers.get(t) || []) { const it = fn(fx, scene); if (!it) continue; scene.interactables.push(Object.assign({ x: fx.x, y: fx.y, h: Math.min(1.6, fx.ob.size[2]), spot: fx.use || undefined, fx }, it)); }
  let z0 = 0;
  scene.onEnter = (opts, prev) => { z0 = G.zoom; if (scene.zoom) G.setZoom(G.zoom + scene.zoom); G.emit('room:enter', scene, opts); };
  scene.onExit = () => { if (scene.zoom && z0) G.setZoom(z0); G.emit('room:exit', scene); };
  scene.update = (dt, gm) => { for (const e of scene.ents) if (e.update) e.update(dt, gm, scene); };
  if (def.setup) def.setup(scene, G);
  G.emit('room:build', scene);
  return scene;
}

/** go inside a room. doorPoi = id of the city poi to return to on exit (defaults to the last one used) */
export function enterRoom(roomId, doorPoi, arg) {
  if (doorPoi) G.state.flags.lastDoor = doorPoi;
  const def = ROOMS.get(roomId); if (!def) { console.warn('no room', roomId); return Promise.resolve(null); }
  return G.go('int:' + roomId, { arg, fresh: !!def.build });
}
/** leave the current room back to the city (or ex.to scene / ex.poi) */
export function exitRoom(ex = {}) { const to = ex.to || 'city'; const poi = ex.poi || G.state.flags.lastDoor; return G.go(to, poi ? { poi } : {}); }

export const order = 20;
export function init() {
  G.registerScene('int:', (id, arg) => { const rid = id.slice(4), def = ROOMS.get(rid); if (!def) throw new Error('unknown room ' + rid); return buildRoom(def.build ? Object.assign({ id: rid }, def, def.build(arg, G)) : def, id); });
}
