// Home interiors: the shell (floor, walls, fixed fittings, default slots) of every player home in data/homes.js, plus three
// fully furnished story homes. Player homes are dynamic rooms `home:<homeId>` built by the housing system
// (src/sim/housing.js -> G.housing.roomDef(homeId): shell + the player's furniture + boxes). Story homes are static.
//
// SHELLS[homeId] = {
//   w, d, floor, floors, wall,                 as in interior.js defineRoom
//   door: { wall: 'y'|'x', at }  |  exit: { x, y }      front door on a back wall, or a mat at the front edge
//   fixed: [def items]                         fittings that belong to the building (cannot be moved in furnish mode)
//   slots: { bed|fridge|stove|shower|bath|extra: [x, y, flip?] }   where the home's `included` items stand on move-in
//   boxes: [[x, y], ...]                       where moving boxes / parcels pile up
//   v: n                                       SHELL VERSION: bump it when the geometry changes (housing.js migrateShell re-fits old saves' furniture)
//   floors: [.., { .., floor: GT.void }]       a void patch (whole tiles, front edges only: the back walls are always full length) cuts the room into an L;
//                                              housing treats voids as blocked. Other shape tools are the `furn.home.build.*` pieces (src/art/home/homes_unique_art.js):
//                                              build.block (full-height mass on a back wall = a jog in the wall / the bathroom volume), build.wall (pony partitions), ...
//   bathDoor: { wall: 'y'|'x', at, off?, p? }  interior door (furn.home.wall.door.room, tag `bathdoor`) to the home's bathroom; keep 1.5 tiles in front of it clear.
//                                              `off` = the door stands `off` tiles out from that wall, on the front face of a build.block (the bathroom volume)
//   bath: { w, d, floor, floors?, wall, fixed, slots: { shower?, bath? }, exit: { x, y } }
//                                              THE BATHROOM IS ITS OWN ROOM `home:<homeId>:bath`: a second, smaller shell written out per home (same keys as the
//                                              main shell; `exit` is the mat that leads back to the living space). Toilet + sink are `fixed`; the home's included
//                                              shower / bathtub stand on bath.slots. Housing stores a placed item's room in `item.r` ('bath' | undefined = main).
// }
// Story homes have `bathDoor` + `bath` too (static rooms `home:sibling:bath`, `home:grandma:bath`, `home:friend:bath`).
// Room ids: home:juniper_court, home:saltbox_lofts, home:easel_house, home:birch_lane_flats, home:marlowe_1br, home:cannery_loft,
//           home:sycamore_house, home:villa_belvedere, home:beacon_penthouse, home:sibling, home:grandma, home:friend   (+ ':bath' for each one's bathroom)
import { G } from '../../core/game.js';
import { defineRoom, exitRoom, registerFixture, ROOMS } from '../interior.js';
import { GT } from '../../engine/world.js';
import { HOMES } from '../../data/homes.js';

const F = (a, x, y, o) => Object.assign({ id: 'furn.home.' + a, x, y }, o);
const WY = (a, at, o) => Object.assign({ id: 'furn.home.' + a, wall: 'y', at }, o);
const WX = (a, at, o) => Object.assign({ id: 'furn.home.' + a, wall: 'x', at }, o);
const T = t => ({ p: { tier: t } }), FL = (t, p) => ({ flip: true, p: Object.assign({ tier: t === undefined ? 1 : t }, p) });
const win = (w, h, t = 1) => ({ p: { w, h, tier: t } });
const back = (p) => ({ p: Object.assign({ face: 3 }, p) });

// Every home is its own place (owner: "the starting apartments should be different ... all different, no repeats"): no two shells share a size, a shape
// or a layout. SHELL VERSIONS: bump `v` whenever a shell's geometry changes; housing.js re-fits the furniture of old saves (migrateShell).
const B = (a, x, y, p, o) => Object.assign({ id: 'furn.home.build.' + a, x, y, p: p || {} }, o);
const BY = (a, x, y, p, o) => B(a, x, y, p, Object.assign({ flip: true }, o));          // the same piece running along y
const VW = (view, w, h, o) => ({ p: Object.assign({ view, w, h }, o) });
export const SHELLS = {
  // ================================================================ starter studios: four different rooms
  // Juniper Court, Old Town — 7 x 9, a narrow brick walk-up above the bakery: the stairwell bites a corner out of the room (L-shape),
  // the bakery's flue runs up the back corner (always warm), a bay window with a window seat looks at the neighbours' bricks.
  juniper_court: { v: 2, w: 7, d: 9, floor: GT.f_wood, wall: { color: '#c07a5a', pattern: 'brick', trim: '#5e3f30' },
    floors: [{ x0: 1, y0: 0, x1: 4, y1: 2, floor: GT.f_check }, { x0: 5, y0: 6, x1: 7, y1: 9, floor: GT.void }],
    door: { wall: 'y', at: 4.5 }, bathDoor: { wall: 'y', at: 6, p: { tier: 0 } },
    fixed: [B('block', 0, 0, { w: 1, d: 1, c: '#efe3c8', trim: '#5e3f30', hatch: true }), F('doormat', 4.5, .5), F('kitchen.sink', 3, 0, T(0)), WY('kitchen.cabinet', 2, T(0)), WY('kitchen.cabinet', 3, T(0)),
      WY('wall.door.front', 4.5, { p: { tier: 0, c: '#3f6f5a' } }), WX('build.window', 2, Object.assign(VW('brick', 2, 1.3, { nx: 3, post: true, frame: '#7a5238', deep: true }), { mount: .65 })),
      BY('windowseat', 0, 2, { len: 2, c: '#b9653a' }), F('wardrobe', 0, 5, FL(0)),
      B('railing', 5, 5.5, { len: 2, style: 'wood' }), BY('railing', 4.5, 6, { len: 3, style: 'wood' })],
    slots: { fridge: [1, 0], stove: [2, 0], extra: [0, 4, 1], bed: [0, 7] },
    bath: { w: 3, d: 4, floor: GT.f_tile, wall: { color: '#f3ead2', pattern: 'tile', trim: '#5e3f30' }, exit: { x: 1.5, y: 3.5 },
      fixed: [F('bath.mat', 2, 1), F('bath.toilet', 0, 0, T(0)), F('bath.sink', 1, 0, T(0)), WY('wall.mirror', 1, { p: { tier: 0 }, mount: 1.2 }), WX('bath.towelrack', 1.5, T(0))], slots: { shower: [2, 0] } },
    boxes: [[4.5, 3], [5.5, 4], [2.5, 4.5], [2, 6], [3, 7]] },
  // Saltbox Lofts, Harborside — 10 x 6, a long low net-loft under a high whitewashed ceiling: tall sea windows, a porthole over the bed in its
  // boarded sleeping nook, the galley at the far end.
  saltbox_lofts: { v: 2, w: 10, d: 6, floor: GT.f_wood, wall: { color: '#e4edf0', pattern: 'planks', trim: '#3f6f8f', h: 3.4 },
    floors: [{ x0: 7, y0: 0, x1: 10, y1: 2, floor: GT.f_lino }],
    exit: { x: 6.5, y: 5.5 }, bathDoor: { wall: 'x', at: 3 },
    fixed: [BY('wall', 2.5, 0, { len: 2, h: 1.3, pat: 'planks', c: '#e4edf0', cap: '#3f6f8f', trim: '#3f6f8f' }), B('column', 2.5, 2, { style: 'wood', h: 3.4, c: '#b89a78' }),
      WX('build.window.porthole', .5, { mount: 1.2 }), WY('build.lifebuoy', 1.5, { mount: 1.5 }),
      WY('build.window', 3.5, Object.assign(VW('sea', 1, 2.3, { ny: 3, nx: 1, seed: 2 }), { mount: .5 })), WY('wall.art', 4.5, { p: { tier: 1, art: 'sea', w: 1 }, mount: 1.4 }), WY('build.window', 5.5, Object.assign(VW('sea', 1, 2.3, { ny: 3, nx: 1, seed: 6 }), { mount: .5 })),
      F('kitchen.sink', 7, 0, T(1)), WY('kitchen.cabinet', 7, T(1)), WY('kitchen.cabinet', 8, T(1)), F('wardrobe', 0, 4.5, FL(1, { wood: '#e9e2d2' }))],
    slots: { bed: [0, 0], stove: [8, 0], fridge: [9, 0], extra: [4, 2.5] },
    bath: { w: 4, d: 3, floor: GT.f_lino, wall: { color: '#d6e6ee', pattern: 'planks', trim: '#3f6f8f', h: 3.4 }, exit: { x: 2, y: 2.5 },
      fixed: [F('bath.mat', 3, 1, { p: { tier: 1, c: '#3b6fd0' } }), F('bath.toilet', .5, 0), F('bath.sink', 1.5, 0), WY('build.window.porthole', 1.5, { mount: 1.3 }), WX('bath.towelrack', 1)], slots: { shower: [3, 0] } },
    boxes: [[3.5, 3.5], [2, 4.5], [8, 3], [8.5, 4.5], [4.5, 4.5]] },
  // The Easel House, Arts Quarter — 8 x 8: the mustard box in the corner is the bathroom, the room wraps around it; sleeping alcove beside it,
  // a studio corner on paint-splattered concrete under the north-light clerestory.
  easel_house: { v: 2, w: 8, d: 8, floor: GT.f_concrete, wall: { color: '#8fc2b8', trim: '#3d4a5c' },
    floors: [{ x0: 5, y0: 0, x1: 8, y1: 2, floor: GT.f_check }, { x0: 3, y0: 0, x1: 5, y1: 3, floor: GT.f_wood }],
    door: { wall: 'x', at: 3.5 }, bathDoor: { wall: 'y', at: 1, off: 2, p: { tier: 0, c: '#f1eee6' } },
    fixed: [B('block', 0, 0, { w: 3, d: 2, c: '#e8b84a', trim: '#3d4a5c' }), F('doormat', .5, 3.5, { flip: true }), WX('wall.door.front', 3.5, { p: { tier: 1, c: '#d9483b' } }),
      F('kitchen.sink', 5, 0, T(0)), WY('kitchen.cabinet', 5, T(0)), WY('kitchen.cabinet', 6, T(0)), WY('wall.poster', 3, { p: { tier: 0, art: 'night', seed: 4 }, mount: 1.3 }), WY('wall.poster', 4, { p: { tier: 0, art: 'cat' }, mount: 1.5 }),
      WX('build.window', 5, Object.assign(VW('sky', 3, .7, { nx: 4, frame: '#3d4a5c', sill: false }), { mount: 2 })), F('wardrobe', 0, 5, FL(0)),
      B('paint', 4, 4, { w: 4, d: 4, seed: 3 }), B('lightpool', 4.5, 4.5, { w: 3, d: 2.5 })],
    slots: { bed: [3, 0], stove: [6, 0], fridge: [7, 0], extra: [6, 5] },
    bath: { w: 5, d: 3, floor: GT.f_concrete, wall: { color: '#f0c9b0', pattern: 'tile', trim: '#3d4a5c' }, exit: { x: 2.5, y: 2.5 },
      fixed: [B('paint', 1, .5, { w: 3, d: 2, seed: 9 }), F('bath.mat', 4, 1, { p: { tier: 1, c: '#d9a23a' } }), F('bath.toilet', .5, 0, T(0)), F('bath.sink', 1.5, 0, T(0)), WY('bath.towelrack', 2.5, T(0)), WX('wall.poster', 1, { p: { tier: 0, art: 'cat' }, mount: 1.4 })], slots: { shower: [4, 0] } },
    boxes: [[2, 5], [3, 6], [1.5, 6.5], [4.5, 2.5], [3.5, 4]] },
  // Birch Lane Flats, Maplewood — 9 x 7 garden-level flat with striped wallpaper: the bathroom juts out of the back wall on the right (dog-leg room),
  // carpeted bed corner, a garden window full of pots over the worktop.
  birch_lane_flats: { v: 2, w: 9, d: 7, floor: GT.f_wood, wall: { color: '#e4ebcf', color2: '#d3dfb8', pattern: 'stripes', trim: '#6f7a48', rail: 1 },
    floors: [{ x0: 2, y0: 0, x1: 5, y1: 2, floor: GT.f_lino }, { x0: 0, y0: 0, x1: 2, y1: 3, floor: GT.f_carpet }],
    exit: { x: 5, y: 6.5 }, bathDoor: { wall: 'y', at: 7, off: 1.5, p: { tier: 0 } },
    fixed: [B('block', 6, 0, { w: 3, d: 1.5, pat: 'stripes', c: '#e4ebcf', c2: '#d3dfb8', trim: '#6f7a48', rail: 1 }),
      WY('build.window', 1, Object.assign(VW('garden', 1, 1.1, { nx: 1, curtain: '#d9a23a', seed: 2 }), { mount: 1 })), F('kitchen.sink', 4, 0, T(0)), WY('kitchen.cabinet', 3, T(0)), WY('kitchen.cabinet', 4, T(0)),
      F('wardrobe', 0, 2.5, FL(0)), WX('build.window', 4.5, Object.assign(VW('garden', 2, 1.3, { nx: 3, shelf: true, frame: '#f8f5ee', seed: 4 }), { mount: .9 })), WX('radiator', 5)],
    slots: { bed: [0, 0], extra: [1.5, 0], fridge: [2, 0], stove: [3, 0] },
    bath: { w: 4, d: 4, floor: GT.f_tile, wall: { color: '#dcebd0', pattern: 'tile', trim: '#6f7a48', rail: 1 }, exit: { x: 2.5, y: 3.5 },
      fixed: [F('bath.mat', 3, 1), F('bath.sink', 0, 1.5, FL(0)), F('bath.toilet', 2, 0, T(0)), WY('build.window', .5, Object.assign(VW('garden', 1.2, .9, { shelf: true, seed: 8 }), { mount: 1.1 })), F('plant.snake', 0, 3.5)], slots: { shower: [3, 0] } },
    boxes: [[6.5, 4], [7.5, 5], [3, 4.5], [4, 3.5], [2, 5]] },

  // ================================================================ moving up
  // The Marlowe 5C, Downtown — 11 x 9 pre-war one-bedroom: picture rail, chequered kitchen behind a breakfast bar, and a REAL bedroom behind its own walls.
  marlowe_1br: { v: 2, w: 11, d: 9, floor: GT.f_wood, wall: { color: '#ddd6c6', trim: '#4a4a58', rail: 2.1 },
    floors: [{ x0: 8, y0: 0, x1: 11, y1: 4, floor: GT.f_check }, { x0: 0, y0: 0, x1: 4, y1: 4, floor: GT.f_carpet }],
    door: { wall: 'y', at: 5 }, bathDoor: { wall: 'x', at: 5.5 },
    fixed: [B('wall', 0, 4, { len: 2.5, c: '#ddd6c6', trim: '#4a4a58' }), B('wall', 3.5, 4, { len: 1, c: '#ddd6c6', trim: '#4a4a58' }), BY('wall', 4, 0, { len: 4, c: '#ddd6c6', trim: '#4a4a58' }),
      F('wardrobe', 2, 0, T(1)), WX('wall.window', 1.5, win(1.5, 1.4)), WX('radiator', 1.5), WY('wall.art', .5, { p: { tier: 1, art: 'land' }, mount: 1.3 }),
      F('doormat', 5, .5), WY('wall.door.front', 5, { p: { tier: 1, c: '#3b6fd0' } }), WY('build.window', 6.5, Object.assign(VW('city', 1.2, 1.7, { ny: 2, seed: 7 }), { mount: .7 })),
      F('kitchen.sink', 8, 0), WY('kitchen.cabinet', 8), WY('kitchen.cabinet', 9), F('kitchen.counter', 7.5, 1.5, { flip: true, p: { tier: 1, len: 2, c: '#5f86a8', top: '#e9e2d2' } }), F('stool', 7, 2), F('stool', 7, 3),
      WX('wall.coathooks', 4.5), WX('wall.window', 7, win(1.5, 1.5)), WX('radiator', 7)],
    slots: { stove: [9, 0], fridge: [10, 0], bed: [0, 0] },
    bath: { w: 5, d: 4, floor: GT.f_check, wall: { color: '#c9d3e6', pattern: 'tile', trim: '#4a4a58' }, exit: { x: 2.5, y: 3.5 },
      fixed: [F('bath.mat', 4, 1, { p: { tier: 1, c: '#3b6fd0' } }), F('bath.sink', 0, 0), F('bath.toilet', 2, 0), WY('bath.towelrack', 3), WX('wall.mirror', 1.5, { p: { tier: 1, tall: true }, mount: .3 }), WX('radiator', 2.5)], slots: { shower: [4, 0] } },
    boxes: [[6, 5], [7, 5.5], [5.5, 6.5], [8, 6], [9, 5], [7, 7]] },
  // Cannery Row Loft, Harborside — 14 x 10 of raw brick: arched factory windows over the bay, cast-iron columns under riveted beams,
  // a sleeping platform of old boards, a sunlit studio nook.
  cannery_loft: { v: 2, w: 14, d: 10, floor: GT.f_concrete, wall: { color: '#9a513b', pattern: 'brick', trim: '#3a3440', h: 3.6 },
    floors: [{ x0: 0, y0: 0, x1: 4, y1: 4, floor: GT.f_check }, { x0: 10, y0: 6, x1: 14, y1: 10, floor: GT.f_wood }],
    exit: { x: 7.5, y: 9.5 }, bathDoor: { wall: 'y', at: 12 },
    fixed: [B('step', 0, 6, { raise: true, w: 4, d: 4, c: '#8a6240', boards: true, edge: '#4a3626' }), B('lightpool', 10.5, 6.5, { w: 3, d: 3, nx: 3, ny: 3 }),
      F('kitchen.counter', 2, 0, { p: { tier: 1, len: 1 } }), F('kitchen.sink', 3, 0), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('wall.shelf', 3, { p: { tier: 1, seed: 2 } }),
      F('kitchen.island', 1, 2), F('stool', 1.5, 3, back()), F('stool', 2.5, 3, back()), F('lamp.floor', 4, 0),
      WY('build.window', 5, Object.assign(VW('sea', 2.5, 2.6, { nx: 4, ny: 4, arch: true, archR: 1.1, frame: '#3a3440', sill: false, seed: 3 }), { mount: .5 })),
      WY('build.window', 8.5, Object.assign(VW('sea', 2.5, 2.6, { nx: 4, ny: 4, arch: true, archR: 1.1, frame: '#3a3440', sill: false, seed: 5 }), { mount: .5 })),
      WX('build.window', 2.5, Object.assign(VW('sea', 2.5, 2.3, { nx: 4, ny: 4, arch: true, archR: 1.1, frame: '#3a3440', sill: false, seed: 9 }), { mount: .6 })),
      B('column', 4.5, 4.5, { style: 'iron', h: 3.6 }), B('column', 9.5, 4.5, { style: 'iron', h: 3.6 }), BY('beam', 4.5, 0, { len: 10 }, { z: 3.3 }), BY('beam', 9.5, 0, { len: 10 }, { z: 3.3 }),
      F('wardrobe', 0, 6, FL(1, { wood: '#5e3f30' })), WX('radiator', 8), F('plant.fiddle', 11, 0)],
    slots: { fridge: [0, 0], stove: [1, 0], bed: [0, 7.5] },
    bath: { w: 5, d: 5, floor: GT.f_concrete, wall: { color: '#8f4a36', pattern: 'brick', trim: '#3a3440', h: 3.6 }, exit: { x: 2.5, y: 4.5 },
      fixed: [F('bath.mat', 4, 1), F('bath.sink', .5, 0), F('bath.toilet', 2, 0), WY('bath.towelrack', 3), F('bath.washer', 0, 2, FL(1)),
        WX('build.window', 3.5, Object.assign(VW('sea', 1.2, 1.5, { nx: 2, ny: 3, frame: '#3a3440', sill: false }), { mount: 1 })), F('plant.snake', 0, 4.5)], slots: { shower: [4, 0] } },
    boxes: [[6, 4], [7, 4.5], [5.5, 5.5], [8, 5.5], [6.5, 6.5], [7.5, 7]] },
  // 38 Sycamore Street, Maplewood — 17 x 12 family house: kitchen-diner, fireplace lounge, a walled main bedroom, the stairs up,
  // and a real back garden behind a picket fence with a vegetable bed.
  sycamore_house: { v: 2, w: 17, d: 12, floor: GT.f_wood, wall: { color: '#f3e3b0', trim: '#8a5a3a', rail: 1 },
    floors: [{ x0: 0, y0: 0, x1: 6, y1: 4, floor: GT.f_check }, { x0: 12, y0: 0, x1: 17, y1: 5, floor: GT.f_carpet }, { x0: 12, y0: 8, x1: 17, y1: 12, floor: GT.grass }],
    exit: { x: 8.5, y: 11.5 }, bathDoor: { wall: 'x', at: 9.5 },
    fixed: [F('rug', 7.5, 1, { p: { w: 3.5, d: 2.5, pat: 'check', tier: 1 } }),
      F('kitchen.counter', 2, 0, { p: { tier: 1, len: 2 } }), F('kitchen.sink', 4, 0), F('kitchen.counter', 5, 0, { p: { tier: 1, len: 1, drawers: true } }), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('kitchen.cabinet', 5), WY('wall.window', 3, win(1.4, 1)),
      F('kitchen.counter', 5.5, 2, { flip: true, p: { tier: 1, len: 2 } }), F('fireplace', 8, 0), WY('wall.window', 6.5, win(1.5, 1.4)), WY('wall.mirror', 8.5, { p: { tier: 2 }, mount: 1.45 }), WY('wall.window', 10, { p: { w: 1, h: 1.4, tier: 1 } }),
      BY('wall', 11.5, 0, { len: 3.5, c: '#f3e3b0', trim: '#8a5a3a' }), B('wall', 11.5, 5, { len: 5.5, c: '#f3e3b0', trim: '#8a5a3a' }),
      F('wardrobe', 12.5, 0), F('nightstand', 14.5, 0), WY('wall.window', 15, win(1.4, 1.2)),
      WX('wall.window', 1.5, win(1.6, 1.3)), BY('stairs', 0, 5, { len: 3, h: 2.8, runner: '#b8433a' }), F('shoerack', 0, 8, FL(1)), WX('wall.coathooks', 8),
      B('railing', 12, 7.5, { len: 3.5, style: 'picket' }), BY('railing', 11.5, 8, { len: 4, style: 'picket' }), B('gardenbed', 12.5, 10.5, { len: 3 }),
      F('plant.fiddle', 16.5, 11), F('plant.monstera', 16.5, 8), F('chair', 13, 8.5), F('chair', 14.5, 8.5, { flip: true })],
    slots: { fridge: [0, 0], stove: [1, 0], bed: [15.5, 0] },
    bath: { w: 6, d: 5, floor: GT.f_tile, wall: { color: '#f6e7b4', pattern: 'tile', trim: '#8a5a3a', rail: 1 }, exit: { x: 3, y: 4.5 },
      fixed: [F('bath.mat', .5, 1), F('bath.toilet', 2.5, 0), F('bath.sink', 3.5, 0), WX('bath.towelrack', 1.5, { mount: 1.2 }), WX('wall.window', 3, win(1.2, 1)), F('plant.monstera', 0, 4.5)], slots: { bath: [0, 0], shower: [5, 0] } },
    boxes: [[7, 5], [8, 5.5], [6.5, 6.5], [9, 6.5], [7.5, 7.5], [5.5, 7.5]] },
  // Villa Belvedere, Hillcrest — 18 x 14 of white stone: arched terrace doors and windows over the bay, an arch into the chef's kitchen,
  // a loggia of columns opening onto the balustraded terrace with its lemon trees.
  villa_belvedere: { v: 2, w: 18, d: 14, floor: GT.f_stone, wall: { color: '#f4efe4', trim: '#b8683c', h: 3.2 },
    floors: [{ x0: 6, y0: 0, x1: 13, y1: 11, floor: GT.f_wood }, { x0: 0, y0: 0, x1: 6, y1: 5, floor: GT.f_tile }, { x0: 13, y0: 0, x1: 18, y1: 5, floor: GT.f_carpet }, { x0: 13, y0: 6, x1: 18, y1: 10, floor: GT.f_mat }],
    door: { wall: 'x', at: 5.5 }, bathDoor: { wall: 'x', at: 7.5, p: { tier: 2 } },
    fixed: [F('rug', 8, 1.5, { p: { w: 3.5, d: 2.5, pat: 'persian', tier: 2 } }), F('doormat', .5, 5.5, { flip: true }), WX('wall.door.front', 5.5, T(2)),
      F('kitchen.counter', 2, 0, { p: { tier: 2, len: 2 } }), F('kitchen.sink', 4, 0, T(2)), F('kitchen.counter', 5, 0, { p: { tier: 2, len: 1 } }), WY('kitchen.cabinet', 2, T(2)), WY('kitchen.cabinet', 3, T(2)), WY('kitchen.cabinet', 4, T(2)),
      F('kitchen.island', 2, 2, T(2)), F('stool', 2.5, 3, back({ tier: 2 })), F('stool', 3.5, 3, back({ tier: 2 })),
      B('column', 6, 4.5, { style: 'classic', h: 3.2 }), BY('arch', 6, 0, { w: 4.5, c: '#e6d8c0', trim: '#b8683c' }, { z: 2.1 }),
      WY('build.door.terrace', 6.5, { p: { w: 1.8, view: 'hills', seed: 2 } }), F('fireplace', 8.5, 0, T(2)), WY('wall.art', 9, { p: { tier: 1, art: 'sea', w: 1.5, h: 1 }, mount: 1.5 }), WY('build.door.terrace', 11, { p: { w: 1.8, view: 'hills', seed: 5 } }),
      BY('wall', 13, 0, { len: 3, c: '#f4efe4', trim: '#b8683c' }), F('wardrobe', 14, 0, T(2)), F('nightstand', 16.5, 0, T(2)), WY('build.window', 16.5, Object.assign(VW('hills', 1.3, 1.7, { arch: true, seed: 8 }), { mount: .8 })),
      WX('build.window', 1.5, Object.assign(VW('hills', 1.8, 1.8, { arch: true, archR: .8, ny: 2, seed: 4 }), { mount: .7 })),
      F('bookshelf', 0, 9, FL(2)), F('bookshelf', 0, 10, FL(2)), F('armchair', 1.5, 9.5, FL(2)),
      B('column', 0, 11, { style: 'classic', h: 3.2 }), B('column', 6, 11, { style: 'classic', h: 3.2 }), B('column', 12, 11, { style: 'classic', h: 3.2 }), B('column', 17.5, 11, { style: 'classic', h: 3.2 }),
      B('railing', 0, 13.5, { len: 18, style: 'stone' }), B('lemontree', .5, 12.5), B('lemontree', 17, 12.5, { seed: 9 }), B('lemontree', 8.5, 12.5, { seed: 6 }),
      F('table.round', 13.5, 11.5, T(2)), F('chair', 14, 10.5, T(2)), F('chair', 15.5, 12, FL(2, { face: 3 }))],
    slots: { fridge: [0, 0], stove: [1, 0], bed: [17, 2] },
    bath: { w: 7, d: 5, floor: GT.f_stone, wall: { color: '#f4efe4', pattern: 'tile', trim: '#b8683c', h: 3.2 }, exit: { x: 3.5, y: 4.5 },
      fixed: [F('bath.mat', .5, 1, T(2)), F('bath.sink', 2.5, 0, { p: { tier: 2, len: 1.5, wood: '#5e3f30' } }), F('bath.toilet', 4.5, 0, T(2)), WX('bath.towelrack', 1.5, T(2)),
        WX('build.window', 3, Object.assign(VW('hills', 1.3, 1.7, { arch: true, seed: 3 }), { mount: .8 })), B('lemontree', 6.5, 4.5, { pot: '#f1eee6' })],
      slots: { bath: [0, 0], shower: [6, 0] } },
    boxes: [[8, 5], [9.5, 5.5], [7.5, 6.5], [10.5, 7], [9, 7.5], [7, 8.5]] },
  // The Beacon Penthouse, Downtown — 19 x 13 above the city: walls of glass on the skyline, a sunken lounge, a glazed master suite, a roof terrace.
  beacon_penthouse: { v: 2, w: 19, d: 13, floor: GT.f_darkwood, wall: { color: '#3d4560', trim: '#c9a24a', h: 3.4 },
    floors: [{ x0: 0, y0: 0, x1: 5, y1: 4, floor: GT.f_tile }, { x0: 15, y0: 0, x1: 19, y1: 5, floor: GT.f_carpet }, { x0: 12, y0: 9, x1: 19, y1: 13, floor: GT.f_stone }],
    door: { wall: 'x', at: 5 }, bathDoor: { wall: 'x', at: 10.5, p: { tier: 2 } },
    fixed: [B('step', 7, 5, { sunk: true, w: 5, d: 4, c: '#5a6a8a', c2: '#52618a', edge: '#c9a24a' }), F('doormat', .5, 5, { flip: true }), WX('wall.door.front', 5, T(2)),
      F('kitchen.counter', 2, 0, { p: { tier: 2, len: 2 } }), F('kitchen.sink', 4, 0, T(2)), WY('kitchen.cabinet', 1, T(2)), WY('kitchen.cabinet', 2, T(2)), WY('kitchen.cabinet', 3, T(2)),
      F('kitchen.island', 1.5, 2, T(2)), F('stool', 2, 3, back({ tier: 2 })), F('stool', 3, 3, back({ tier: 2 })), F('lamp.floor', 5, 0, T(2)),
      WY('build.window', 5.5, Object.assign(VW('city', 3, 3, { nx: 3, frame: '#2a2733', sill: false, seed: 1 }), { mount: .1 })), WY('build.window', 8.5, Object.assign(VW('city', 3, 3, { nx: 3, frame: '#2a2733', sill: false, seed: 2 }), { mount: .1 })),
      WY('build.window', 11.5, Object.assign(VW('city', 3, 3, { nx: 3, frame: '#2a2733', sill: false, seed: 3 }), { mount: .1 })), WY('build.window', 16, Object.assign(VW('city', 3, 3, { nx: 3, frame: '#2a2733', sill: false, seed: 4 }), { mount: .1 })),
      WX('build.window', 6.5, Object.assign(VW('city', 3.5, 3, { nx: 3, frame: '#2a2733', sill: false, seed: 5 }), { mount: .1 })), WX('wall.mirror', 12, T(2)),
      BY('wall', 15, 0, { len: 3.5, glass: true, h: 2.4, c: '#3d4560', trim: '#c9a24a' }), F('wardrobe', 15.5, 0, FL(2)), F('nightstand', 16.5, 0, T(2)),
      F('sofa.3', 8, 5.5, T(2)), F('coffeetable', 8.5, 7.5, T(2)), F('armchair', 7, 7, FL(2)),
      B('railing', 12, 12.5, { len: 7, style: 'glass' }), F('plant.fiddle', 12, 11.5, T(2)), F('plant.snake', 18.5, 9, T(2)), B('lemontree', 18.5, 11.5, { pot: '#3b4560' }), F('sofa.2', 14, 11, back({ tier: 2 })), F('coffeetable', 14, 10, T(2))],
    slots: { fridge: [0, 0], stove: [1, 0], bed: [17, 2] },
    bath: { w: 8, d: 6, floor: GT.f_stone, wall: { color: '#2f3650', pattern: 'tile', trim: '#c9a24a', h: 3.4 }, exit: { x: 4, y: 5.5 },
      fixed: [F('bath.mat', 1, 2, { flip: true, p: { tier: 2 } }), F('bath.sink', 2, 0, { p: { tier: 2, len: 1.5, wood: '#5e3f30' } }), F('bath.toilet', 4, 0, T(2)),
        WY('build.window', 5, Object.assign(VW('city', 2, 2.8, { nx: 2, frame: '#2a2733', sill: false, seed: 6 }), { mount: .2 })), WX('bath.towelrack', 4, T(2)), F('plant.fiddle', 0, 5.5, T(2)), F('plant.snake', 7.5, 5.5, T(2))],
      slots: { bath: [0, 1.5, 1], shower: [7, 0] } },
    boxes: [[5.5, 5], [5.5, 6.5], [6, 8], [13, 4.5], [13.5, 6], [13, 7.5]] },
};

/* ------------------------------------------------------------------ story homes (static, not the player's) */
const table4 = (x, y, t = 1) => [F('table.4', x, y, T(t)), F('chair', x + .25, y - .55, T(t)), F('chair', x + 1.25, y - .55, T(t)), F('chair', x + .25, y + 1.05, back({ tier: t })), F('chair', x + 1.25, y + 1.05, back({ tier: t }))];
const STORY = [
  { id: 'home:sibling', name: "Nora & Theo's House", owner: 'jules', w: 12, d: 9, floor: GT.f_wood, wall: { color: '#f2d6a2', trim: '#8a5a3a', rail: 1 },
    floors: [{ x0: 0, y0: 0, x1: 5.2, y1: 2, floor: GT.f_check }], exits: [{ x: 6, y: 8.5, label: 'Leave' }], bathDoor: { wall: 'y', at: 7.1 },
    bath: { w: 5, d: 4, floor: GT.f_check, wall: { color: '#bfe0e6', pattern: 'tile', trim: '#8a5a3a' }, exit: { x: 2.5, y: 3.5 },
      items: [F('bath.mat', .5, 1.15, { p: { tier: 1, c: '#d9a23a' } }), F('bath.bathtub', 0, 0, T(1)), F('bath.toilet', 2.7, 0), F('bath.sink', 3.7, 0), WX('bath.towelrack', 1.6), WX('wall.poster', 2.8, { p: { tier: 0, art: 'cat' }, mount: 1.4 })] },
    items: [F('rug', 8, 1.1, { p: { w: 3.5, d: 2.5, pat: 'stripe', tier: 1 } }), F('rug', .2, 5.6, { p: { w: 2.5, d: 2.5, pat: 'round', tier: 1 } }),
      F('kitchen.fridge', 0, 0), F('kitchen.stove', 1, 0), F('kitchen.counter', 2, 0, { p: { tier: 1, len: 2 } }), F('kitchen.sink', 4, 0), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('kitchen.cabinet', 3),
      WY('wall.window', 5.3, win(1.5, 1.2)), F('tv.medium', 9, 0), F('bookshelf', 10.8, 0), WY('wall.fairylights', 8.8, { p: { len: 3, warm: true } }),
      F('sofa.3', 8.2, 3.4, back({ tier: 1 })), F('coffeetable', 9, 2.1), F('lamp.floor', 11.4, 3.2), F('plant.monstera', 11.4, 4.6),
      ...table4(3.4, 4.3), ...table4(5.4, 4.3),
      WX('wall.window', 2.3, win(1.5, 1.2)), WX('wall.poster', 4.3, { p: { tier: 0, art: 'cat' } }), WX('wall.photos', 6.4, { p: { tier: 0, seed: 1 } }), F('dresser', 0, 4.2, FL(1)),
      F('beanbag', .4, 5.9, { p: { tier: 1, c: '#f08ab0' } }), F('console', 1.7, 6.6), F('beanbag', 1.2, 7.4, { p: { tier: 1, c: '#5ab0e0' } }), F('petbed', 3.2, 7.8), F('boxes', 0, 8, { p: { seed: 3 }, tags: ['toys'] }), F('shoerack', 7.4, 8.3), F('plant.snake', 4.6, 2.2)] },
  { id: 'home:grandma', name: "Nana Bea's", owner: 'nana', w: 10, d: 8, floor: GT.f_carpet, wall: { color: '#e6cfc0', color2: '#d9b8ac', pattern: 'stripes', trim: '#6a4428', rail: 1 },
    floors: [{ x0: 0, y0: 0, x1: 4.3, y1: 2, floor: GT.f_check }], exits: [], door: { wall: 'y', at: 4.6 }, bathDoor: { wall: 'x', at: 1.1 },
    bath: { w: 4, d: 4, floor: GT.f_lino, wall: { color: '#f0d0d8', color2: '#e6b8c4', pattern: 'stripes', trim: '#6a4428', rail: 1 }, exit: { x: 2.4, y: 3.5 },
      items: [F('bath.mat', .5, 1.15, T(2)), F('bath.bathtub', 0, 0, { p: { tier: 1, c2: '#e9a8b8' } }), F('bath.toilet', 2.3, 0), F('bath.sink', 3, 0), WX('bath.towelrack', 1.6), F('plant.snake', .1, 3.2)] },
    items: [F('rug', .7, 3.5, { p: { w: 2.5, d: 3, pat: 'persian', tier: 2 } }), F('doormat', 4.6, .6),
      F('kitchen.fridge', 0, 0, { p: { tier: 1 } }), F('kitchen.stove', 1, 0, T(1)), F('kitchen.counter', 2, 0, { p: { tier: 1, len: 1, drawers: true } }), F('kitchen.clutter', 3, 0), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('wall.shelf', 3, { p: { tier: 1, seed: 2 }, mount: 1.5 }),
      F('chair', 3, 1, { p: { tier: 1, c: '#b9653a' }, tags: ['rangechair'] }),   /* the chair by the range (Chapter 1: "sit in the chair by the range"); faces into the room */
      WY('wall.door.front', 4.6, T(1)), F('piano', 6, 0, T(2)), WY('wall.photos', 6, { p: { tier: 2, seed: 7 }, mount: 1.5 }), F('stereo', 7.7, 0, T(0)), WY('wall.clock', 7.9, T(1)), F('bookshelf', 8.9, 0, T(1)),
      WX('wall.window', 2.2, win(1.5, 1.2)), F('fireplace', 0, 4, FL(1)), WX('wall.art', 4.5, { p: { tier: 2, seed: 1 }, mount: 1.5 }), F('armchair', 1.7, 3.5, FL(1, { face: 3 })), F('armchair', 1.7, 5.3, FL(1, { face: 3 })), F('lamp.floor', .1, 3.3), F('plant.snake', .1, 6.3), F('petbed', .4, 7.2),
      F('table.round', 5.4, 3.8), F('chair', 5.9, 3.2), F('chair', 5.9, 5.4, back()), F('chair', 7, 4.3, FL(1, { face: 3 })),
      F('plant.fiddle', 9.4, 2.4), F('plant.monstera', 9.4, 5.6), F('plant.cactus', 3.6, 2.2), F('dresser', 8.6, 7.2, back()), F('plant.hanging', 4, .2, { z: 1.5 })] },
  { id: 'home:friend', name: "Kit's Studio Flat", owner: 'kit', w: 9, d: 7, floor: GT.f_concrete, wall: { color: '#b0624a', pattern: 'brick', trim: '#33303f', h: 3 },
    floors: [{ x0: 5.6, y0: 2.6, x1: 9, y1: 5.4, floor: GT.f_wood }], exits: [{ x: 4.5, y: 6.5, label: 'Leave' }], bathDoor: { wall: 'y', at: 3.2, p: { tier: 0 } },
    bath: { w: 3, d: 4, floor: GT.f_concrete, wall: { color: '#8f5a4a', pattern: 'brick', trim: '#33303f', h: 3 }, exit: { x: 1.8, y: 3.5 },
      items: [F('bath.toilet', .2, 0, T(0)), F('bath.shower', 2, 0, { p: { tier: 0, c: '#d9a23a' } }), F('bath.sink', 0, 1.8, FL(0)), WY('wall.poster', .9, { p: { tier: 1 }, mount: 1.5 })] },
    items: [F('rug', 2.2, 2.4, { p: { w: 3, d: 2, pat: 'zig', tier: 1 } }),
      F('kitchen.fridge', 0, 0, T(0)), F('kitchen.counter', 1, 0, { p: { tier: 0, len: 1 } }), F('kitchen.coffee', 2, 0), WY('wall.shelf', 1, { p: { tier: 0, seed: 1 } }),
      WY('wall.poster', 4.2, T(2)), WY('wall.fairylights', 3, { p: { len: 3, warm: true }, mount: 2.4 }), WY('wall.window', 5.3, win(1.5, 1.4)), F('bed.futon', 7, 0),
      F('guitar', 0, 2), F('stereo', 0, 2.8, FL(2)), WX('wall.poster', 3, { p: { tier: 1 }, mount: 1.5 }), F('bookshelf', 0, 4, FL(0)), F('keyboard', 0, 5.2, FL(1)), WX('wall.art', 5.4, { p: { tier: 0, seed: 2 }, mount: 1.5 }),
      F('beanbag', 2.5, 2.6, { p: { tier: 1, c: '#7a55c8' } }), F('coffeetable', 3.6, 3.6), F('easel', 6.4, 3.3, T(2)), F('stool', 6.6, 4.1, back()), F('plant.monstera', 8.4, 2.2), F('lamp.floor', 6.3, .1), F('plant.cactus', 8.4, 5)] },
];

/* ------------------------------------------------------------------ bathrooms (their own rooms) */
/** the interior door item of a shell (goes into the room def's items) */
export const bathDoorItems = sh => { const b = sh.bathDoor; if (!b) return []; const o = { id: 'furn.home.wall.door.room', p: b.p || { tier: 1 }, tags: ['bathdoor'], fixed: true };
  if (b.off) return [Object.assign(o, { solid: false }, b.wall === 'y' ? { x: b.at, y: b.off } : { x: b.off, y: b.at, flip: true })];   // on the face of a block
  return [Object.assign(o, { wall: b.wall, at: b.at })]; };
/** where you stand in the main room when you come back out of the bathroom (world coords) */
export function bathReturn(sh) { const b = sh.bathDoor; if (!b) return {}; const o = b.off || 0; return b.wall === 'y' ? { x: 1 + b.at + .5, y: 1.9 + o, dir: 1 } : { x: 1.9 + o, y: 1 + b.at + .5, dir: 0 }; }
/** enter / leave a home's bathroom. mainId = 'home:<id>' room id */
export function enterBath(mainId) { const rid = mainId + ':bath', def = ROOMS.get(rid); if (!def) return Promise.resolve(null); return G.go('int:' + rid, { fresh: !!def.build }); }
export function leaveBath(mainId) { const def = ROOMS.get(mainId), sh = SHELLS[mainId.slice(5)] || STORY_HOMES[mainId] || {}; return G.go('int:' + mainId, Object.assign({ fresh: !!(def && def.build) }, bathReturn(sh))); }
// 38 Sycamore Street's vegetable bed (perk home_garden): the world's `garden` activity, at home
registerFixture('homegarden', (fx, scene) => (scene.def && scene.def.home && G.activities ? { label: 'Tend the garden bed', act: true, hit: fx.ob && fx.ob.B ? Math.max(12, Math.round(Math.max(fx.ob.B[3] - fx.ob.B[0], fx.ob.B[4] - fx.ob.B[1]) * 8.4 + 1)) : 12, use: () => G.activities.start('garden', { fx }) } : null));   /* QA9: the hit covers the whole long, low bed (41% of it found nothing) */
registerFixture('bathdoor', (fx, scene) => (ROOMS.has(scene.roomId + ':bath') ? { label: 'Bathroom', h: 1.5, hit: 16, bathdoor: true, use: () => enterBath(scene.roomId) } : null));

const PRIVATE = ['bed', 'fridge', 'stove', 'shower', 'bath', 'wardrobe', 'pantry', 'microwave', 'computer', 'laundry', 'moving_box', 'delivery_box', 'toys', 'coffee'];
export function leaveHome(homeId) {
  const viaLobby = G.mailboxes && G.mailboxes.leave ? G.mailboxes.leave(homeId) : null; if (viaLobby) return viaLobby;   /* Direction update 23: YOUR apartment leaves through its lobby (sim/mailboxes.js; tunable MAIL.ROUTE in data/mailboxes.js) */
  const poi = 'door:' + homeId, city = G.sceneCache.get('city'), has = city && city.world.pois.some(p => p.id === poi);
  return exitRoom(has ? { poi } : {});
}
/** exit handling shared by all homes: wall door -> "Leave" interactable + spawn; mat -> exits[] */
export function withExit(def, sh, roomId) {
  const leave = () => leaveHome(roomId);
  if (sh.door) {
    const at = sh.door.at; def.exits = [];
    def.spawn = sh.door.wall === 'y' ? { x: at + .5, y: .9, dir: 1 } : { x: .9, y: at + .5, dir: 0 };
    const prev = def.setup;
    def.setup = (scene, g) => { const fx = scene.byTag('frontdoor')[0], s = scene.toWorld(def.spawn.x, def.spawn.y); if (fx) scene.interactables.push({ x: fx.x, y: fx.y, h: 1.5, hit: 16, label: 'Leave', exit: true, spot: s, use: leave }); if (prev) prev(scene, g); };
  } else def.exits = [{ x: sh.exit.x, y: sh.exit.y, label: 'Leave', use: leave }];
  return def;
}

for (const s of STORY) {
  const def = Object.assign({ home: false, story: true }, s);
  // guests do not raid the fridge or sleep in the host's bed: drop private fixtures' interactables (room ids starting with 'home' count as home for the sim core)
  def.setup = scene => { scene.interactables = scene.interactables.filter(it => !it.fx || it.guestOk || !it.fx.tags.some(t => PRIVATE.includes(t))); }; // guestOk = toilet + wash hands (sim/bladder.js)
  if (s.door) withExit(def, s, s.id); else def.exits = s.exits.map(e => Object.assign({}, e, { use: () => leaveHome(s.id) }));
  def.items = s.items.concat(bathDoorItems(s)); delete def.bath;
  defineRoom(def);
  if (s.bath) defineRoom(Object.assign({ id: s.id + ':bath', name: s.name + ' (bathroom)', owner: s.owner, home: false, story: true, bath: true, setup: def.setup,
    exits: [{ x: s.bath.exit.x, y: s.bath.exit.y, label: 'Back', use: () => leaveBath(s.id) }] }, s.bath));
}
export const STORY_HOMES = Object.fromEntries(STORY.map(s => [s.id, s]));
/** room def of a player home's bathroom from its shell (housing adds the player's furniture: G.housing.roomDef(id, 'bath')) */
export function bathDef(homeId, items) { const b = SHELLS[homeId].bath, h = HOMES.find(x => x.id === homeId);
  return { name: ((h && h.name) || 'Home') + ' (bathroom)', homeId, bath: true, w: b.w, d: b.d, floor: b.floor, floors: b.floors, wall: b.wall, items: items || b.fixed,
    exits: [{ x: b.exit.x, y: b.exit.y, label: 'Back to the living room', use: () => leaveBath('home:' + homeId) }] }; }
for (const h of HOMES) if (SHELLS[h.id]) {
  defineRoom({ id: 'home:' + h.id, name: h.name, home: true,
    build: () => (G.housing ? G.housing.roomDef(h.id, 'main') : withExit(Object.assign({ name: h.name, home: true }, SHELLS[h.id], { items: SHELLS[h.id].fixed.concat(bathDoorItems(SHELLS[h.id])) }), SHELLS[h.id], 'home:' + h.id)) });
  if (SHELLS[h.id].bath) defineRoom({ id: 'home:' + h.id + ':bath', name: h.name + ' (bathroom)', home: true, build: () => (G.housing ? G.housing.roomDef(h.id, 'bath') : bathDef(h.id)) });
}
