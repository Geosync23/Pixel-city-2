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
// }
// Room ids: home:juniper_court, home:saltbox_lofts, home:easel_house, home:birch_lane_flats, home:marlowe_1br, home:cannery_loft,
//           home:sycamore_house, home:villa_belvedere, home:beacon_penthouse, home:sibling, home:grandma, home:friend
import { G } from '../../core/game.js';
import { defineRoom, exitRoom } from '../interior.js';
import { GT } from '../../engine/world.js';
import { HOMES } from '../../data/homes.js';

const F = (a, x, y, o) => Object.assign({ id: 'furn.home.' + a, x, y }, o);
const WY = (a, at, o) => Object.assign({ id: 'furn.home.' + a, wall: 'y', at }, o);
const WX = (a, at, o) => Object.assign({ id: 'furn.home.' + a, wall: 'x', at }, o);
const T = t => ({ p: { tier: t } }), FL = (t, p) => ({ flip: true, p: Object.assign({ tier: t === undefined ? 1 : t }, p) });
const win = (w, h, t = 1) => ({ p: { w, h, tier: t } });
const back = (p) => ({ p: Object.assign({ face: 3 }, p) });

export const SHELLS = {
  // ---------------------------------------------------------------- starter studios (8 x 7)
  juniper_court: { w: 8, d: 7, floor: GT.f_wood, wall: { color: '#ead9b8', trim: '#7a4e2d', rail: 1 },
    floors: [{ x0: 0, y0: 0, x1: 4, y1: 1.5, floor: GT.f_check }, { x0: 5.5, y0: 0, x1: 8, y1: 2.5, floor: GT.f_tile }],
    door: { wall: 'y', at: 4.4 },
    fixed: [F('doormat', 4.4, .6), F('bath.mat', 6.9, 1.2), F('kitchen.sink', 2, 0, T(0)), WY('kitchen.cabinet', 1, T(0)), WY('kitchen.cabinet', 2, T(0)), WY('wall.door.front', 4.4, T(0)),
      F('bath.toilet', 5.9, 0), WY('bath.towelrack', 6.6), WX('wall.window', 3, win(1.5, 1, 0)), WX('radiator', 3.25), F('wardrobe', 0, 1.3, FL(0))],
    slots: { fridge: [0, 0], stove: [1, 0], extra: [3, 0], shower: [7, 0], bed: [0, 4.8] }, boxes: [[5, 4.4], [6.2, 5.1], [4.2, 5.5], [3, 4], [5.4, 3]] },
  saltbox_lofts: { w: 8, d: 7, floor: GT.f_wood, wall: { color: '#cfdde2', pattern: 'planks', trim: '#4f6f86', h: 3.2 },
    floors: [{ x0: 0, y0: 0, x1: 1.6, y1: 3.2, floor: GT.f_lino }, { x0: 5.5, y0: 0, x1: 8, y1: 2.5, floor: GT.f_tile }],
    exit: { x: 4.2, y: 6.5 },
    fixed: [F('bath.mat', 6.9, 1.2), F('kitchen.sink', 0, 2, FL(1)), WX('kitchen.cabinet', 1, T(1)), WX('kitchen.cabinet', 2, T(1)), WY('wall.window', 1.4, win(1.8, 1.5)), WY('wall.window', 3.5, win(1.8, 1.5)),
      F('bath.toilet', 5.9, 0), WY('bath.towelrack', 6.6), F('wardrobe', 0, 4.3, FL(1, { wood: '#e9e2d2' })), WX('wall.coathooks', 6), WX('wall.art', 3.2, { p: { tier: 1, art: 'sea', w: 1 } })],
    slots: { fridge: [0, 0, 1], stove: [0, 1, 1], extra: [2.5, 2.6], shower: [7, 0], bed: [1.6, 0, 1] }, boxes: [[5.4, 3.6], [6.5, 4.3], [5.8, 5.2], [3, 4.6], [2, 5]] },
  easel_house: { w: 8, d: 7, floor: GT.f_wood, wall: { color: '#8fc2b8', trim: '#3d4a5c' },
    floors: [{ x0: 1.8, y0: 0, x1: 6, y1: 1.5, floor: GT.f_check }, { x0: 6, y0: 0, x1: 8, y1: 2.5, floor: GT.f_tile }, { x0: 5, y0: 2.8, x1: 8, y1: 5.6, floor: GT.f_concrete }],
    door: { wall: 'y', at: .5 },
    fixed: [F('doormat', .5, .6), F('bath.mat', 6.9, 1.2), WY('wall.door.front', .5, { p: { tier: 1, c: '#d9483b' } }), F('kitchen.sink', 4, 0, T(0)), F('kitchen.counter', 5, 0, { p: { tier: 0, len: 1 } }), WY('kitchen.cabinet', 3, T(0)), WY('kitchen.cabinet', 4, T(0)),
      F('bath.toilet', 6.25, 0), WX('wall.window', 1.5, win(1.5, 1.3)), F('wardrobe', 0, 3.3, FL(0)), WX('wall.poster', 5.6, { p: { tier: 0, art: 'night', seed: 4 } }), WY('wall.poster', 1.7, { p: { tier: 0, art: 'cat' }, mount: 1.5 })],
    slots: { fridge: [2, 0], stove: [3, 0], extra: [6.4, 3.4], shower: [7, 0], bed: [0, 5] }, boxes: [[3, 4.4], [4.1, 5.2], [2.8, 5.7], [2.2, 3], [4, 3]] },
  birch_lane_flats: { w: 8, d: 7, floor: GT.f_wood, wall: { color: '#dfe8c8', trim: '#6f7a48', rail: 1 },
    floors: [{ x0: 0, y0: 0, x1: 2.4, y1: 2.5, floor: GT.f_tile }, { x0: 4.8, y0: 0, x1: 8, y1: 1.5, floor: GT.f_lino }, { x0: 0, y0: 4.2, x1: 2.6, y1: 7, floor: GT.f_carpet }],
    exit: { x: 5.5, y: 6.5 },
    fixed: [F('bath.mat', 1.2, 1.2), F('bath.toilet', 1.5, 0), WY('wall.window', 2.9, win(1.5, 1.2)), F('kitchen.sink', 7, 0, T(0)), WY('kitchen.cabinet', 5, T(0)), WY('kitchen.cabinet', 6, T(0)), WY('kitchen.cabinet', 7, T(0)),
      F('wardrobe', 0, 2.7, FL(0)), WX('wall.art', 4.9, T(0)), WX('radiator', 6.7)],
    slots: { shower: [0, 0], stove: [5, 0], fridge: [6, 0], extra: [3.2, .1], bed: [0, 4.6] }, boxes: [[4, 3.8], [5.2, 4.4], [6.3, 3.6], [3.4, 5], [6.5, 5]] },

  // ---------------------------------------------------------------- moving up
  marlowe_1br: { w: 10, d: 8, floor: GT.f_wood, wall: { color: '#d8dce6', trim: '#4a4a58' },
    floors: [{ x0: 0, y0: 0, x1: 4.4, y1: 1.6, floor: GT.f_lino }, { x0: 7, y0: 0, x1: 10, y1: 3, floor: GT.f_tile }, { x0: 0, y0: 4, x1: 4, y1: 8, floor: GT.f_carpet }],
    door: { wall: 'y', at: 5.2 },
    fixed: [F('doormat', 5.2, .6), F('bath.mat', 8.8, 1.2), F('kitchen.sink', 2, 0), F('kitchen.counter', 3, 0, { p: { tier: 1, len: 1, drawers: true, c: '#e9e2d2' } }), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('kitchen.cabinet', 3),
      WY('wall.door.front', 5.2, { p: { tier: 1, c: '#3b6fd0' } }), WY('wall.coathooks', 4.1), F('bath.sink', 7.1, 0), F('bath.toilet', 8.3, 0), WX('wall.window', 1.8, win(1.5, 1.3)), F('wardrobe', 0, 3.7, FL(1)), WX('radiator', 2.05),
      F('kitchen.counter', 4, 2, { flip: true, p: { tier: 1, len: 2, c: '#5f86a8', top: '#e9e2d2' } }), F('stool', 4.6, 2.2), F('stool', 4.6, 3.2), WX('wall.window', 5.6, win(1.5, 1.3))],
    slots: { fridge: [0, 0], stove: [1, 0], shower: [9, 0], bed: [0, 5.6] }, boxes: [[6, 4.6], [7.2, 5.2], [6.4, 6], [8.2, 4.4], [5.2, 5.6], [7.6, 6.4]] },
  cannery_loft: { w: 13, d: 10, floor: GT.f_concrete, wall: { color: '#a8563c', pattern: 'brick', trim: '#3a3440', h: 3.4 },
    floors: [{ x0: 0, y0: 0, x1: 4.6, y1: 3.6, floor: GT.f_check }, { x0: 10.2, y0: 0, x1: 13, y1: 3, floor: GT.f_tile }, { x0: 0, y0: 5.4, x1: 4.4, y1: 10, floor: GT.f_darkwood }, { x0: 9.4, y0: 6, x1: 13, y1: 10, floor: GT.f_wood }],
    exit: { x: 7.5, y: 9.5 },
    fixed: [F('bath.mat', 11.9, 1.2), F('kitchen.counter', 2, 0, { p: { tier: 1, len: 1 } }), F('kitchen.sink', 3, 0), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('wall.shelf', 3, { p: { tier: 1, seed: 2 } }),
      F('kitchen.island', 1.2, 2), F('stool', 1.5, 3.1, back()), F('stool', 2.4, 3.1, back()), WY('wall.window', 4.7, win(2.2, 1.9, 2)), WY('wall.window', 7.3, win(2.2, 1.9, 2)),
      F('bath.sink', 10.3, 0), F('bath.toilet', 11.35, 0), F('bath.washer', 12, 2.4, FL(1)), WX('wall.window', 2.4, win(2, 1.8, 2)), F('wardrobe', 0, 5.6, FL(1, { wood: '#5e3f30' })), WX('radiator', 4.5),
      F('plant.fiddle', 9.6, .1), F('lamp.floor', 4.6, .1)],
    slots: { fridge: [0, 0], stove: [1, 0], shower: [12, 0], bed: [0, 7.5] }, boxes: [[6, 4], [7.2, 4.6], [5, 5.2], [8.2, 5.4], [6.3, 6], [7.4, 6.8]] },
  sycamore_house: { w: 16, d: 12, floor: GT.f_wood, wall: { color: '#f0dca0', trim: '#8a5a3a', rail: 1 },
    floors: [{ x0: 0, y0: 0, x1: 6, y1: 4.4, floor: GT.f_check }, { x0: 11.4, y0: 0, x1: 16, y1: 4.6, floor: GT.f_carpet }, { x0: 0, y0: 7.4, x1: 2.8, y1: 12, floor: GT.f_tile }, { x0: 11, y0: 8.4, x1: 16, y1: 12, floor: GT.f_stone }],
    exit: { x: 7.5, y: 11.5 },
    fixed: [F('bath.mat', 1.2, 9.4, { flip: true }), F('rug', 7.4, 1, { p: { w: 3.5, d: 2.5, pat: 'check', tier: 1 } }),
      F('kitchen.counter', 2, 0, { p: { tier: 1, len: 2 } }), F('kitchen.sink', 4, 0), F('kitchen.counter', 5, 0, { p: { tier: 1, len: 1, drawers: true } }), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('kitchen.cabinet', 5), WY('wall.window', 3.3, win(1.4, 1)),
      F('kitchen.counter', 5.5, 2, { flip: true, p: { tier: 1, len: 2 } }), F('fireplace', 8.2, 0), WY('wall.window', 6.4, win(1.5, 1.4)), WY('wall.mirror', 8.7, { p: { tier: 2 }, mount: 1.45 }), WY('wall.window', 10.4, { p: { w: 1, h: 1.4, tier: 1 } }),
      F('wardrobe', 11.6, 0), F('nightstand', 13.4, 0), WY('wall.window', 14.4, win(1.4, 1.2)), WX('wall.window', 1.6, win(1.6, 1.3)), WX('wall.coathooks', 5), F('shoerack', 0, 6.1, FL(1)),
      F('bath.toilet', 0, 7.7, { flip: true }), WX('bath.towelrack', 8.6, { mount: 1.2 }), F('plant.fiddle', 15.3, 11.2), F('plant.monstera', 11.2, 11.3), F('plant.snake', 15.4, 8.6), F('plant.cactus', 13.4, 11.4), F('chair', 12.6, 9.6), F('chair', 14, 9.6, { flip: true })],
    slots: { fridge: [0, 0], stove: [1, 0], bath: [0, 8.5, 1], shower: [0, 10.8], bed: [14.6, 0] }, boxes: [[7, 5], [8.2, 5.6], [6.4, 6.4], [9, 6.6], [7.6, 7.2], [5.5, 7.6]] },
  villa_belvedere: { w: 16, d: 13, floor: GT.f_wood, wall: { color: '#f4efe4', trim: '#b8683c' },
    floors: [{ x0: 0, y0: 0, x1: 6.6, y1: 4.2, floor: GT.f_tile }, { x0: 11.6, y0: 0, x1: 16, y1: 5.2, floor: GT.f_carpet }, { x0: 0, y0: 8.2, x1: 3, y1: 13, floor: GT.f_tile }, { x0: 10.4, y0: 8.4, x1: 16, y1: 13, floor: GT.f_stone }, { x0: 4.2, y0: 9.4, x1: 8, y1: 13, floor: GT.f_mat }],
    exit: { x: 9.2, y: 12.5 },
    fixed: [F('bath.mat', 1.2, 10.2, { flip: true }), F('rug', 7.4, 1, { p: { w: 3.5, d: 2.5, pat: 'persian', tier: 2 } }),
      F('kitchen.counter', 3, 0, { p: { tier: 2, len: 2 } }), F('kitchen.sink', 5, 0, T(2)), WY('kitchen.cabinet', 3, T(2)), WY('kitchen.cabinet', 4, T(2)), WY('kitchen.cabinet', 5, T(2)), F('kitchen.island', 2, 2.2, T(2)), F('stool', 2.3, 3.3, back({ tier: 2 })), F('stool', 3.3, 3.3, back({ tier: 2 })),
      F('fireplace', 8.2, 0, T(2)), WY('wall.window', 6.7, win(1.3, 1.6, 2)), WY('wall.art', 8.6, { p: { tier: 1, art: 'sea', w: 1.5, h: 1 }, mount: 1.5 }), WY('wall.window', 10.4, win(1.2, 1.6, 2)),
      F('wardrobe', 11.8, 0, T(2)), F('nightstand', 13.95, 0, T(2)), WY('wall.window', 14.3, win(1.5, 1.4, 2)), WX('wall.window', 1.4, win(1.8, 1.6, 2)),
      F('bookshelf', 0, 4.5, FL(2)), F('bookshelf', 0, 5.5, FL(2)), F('bookshelf', 0, 6.5, FL(2)), F('armchair', 1.4, 5.4, FL(2)), F('lamp.floor', .1, 7.6, T(2)),
      F('bath.toilet', 0, 8.5, { flip: true }), WX('wall.mirror', 9.8, T(2)), F('plant.fiddle', 15.3, 12.2, T(2)), F('plant.fiddle', 10.6, 12.2, T(2)), F('plant.cactus', 15.4, 8.6), F('plant.monstera', 12.8, 12.3), F('table.round', 12.4, 9.6, T(2)), F('chair', 12.9, 9.05, T(2)), F('chair', 14, 10.1, FL(2, { face: 3 }))],
    slots: { fridge: [0, 0], stove: [1, 0], bath: [0, 9.3, 1], shower: [0, 11.8], bed: [14.7, 0] }, boxes: [[7, 5.4], [8.2, 6], [6.4, 6.8], [9.2, 7], [7.6, 7.6], [5.6, 6]] },
  beacon_penthouse: { w: 17, d: 13, floor: GT.f_darkwood, wall: { color: '#3d4560', trim: '#c9a24a', h: 3.4 },
    floors: [{ x0: 0, y0: 0, x1: 5.6, y1: 4, floor: GT.f_tile }, { x0: 12.4, y0: 0, x1: 17, y1: 5.2, floor: GT.f_carpet }, { x0: 0, y0: 9, x1: 3, y1: 13, floor: GT.f_tile }, { x0: 11, y0: 8.6, x1: 17, y1: 13, floor: GT.f_stone }],
    door: { wall: 'x', at: 5.6 },
    fixed: [F('doormat', .6, 5.6, { flip: true }), F('bath.mat', 1.2, 10.6, { flip: true }), F('rug', 7, 1.4, { p: { w: 4, d: 2.5, pat: 'diamond', tier: 2 } }),
      F('kitchen.counter', 2, 0, { p: { tier: 2, len: 2 } }), F('kitchen.sink', 4, 0, T(2)), WY('kitchen.cabinet', 1, T(2)), WY('kitchen.cabinet', 2, T(2)), WY('kitchen.cabinet', 3, T(2)), F('kitchen.island', 1.6, 2.1, T(2)), F('stool', 1.9, 3.2, back({ tier: 2 })), F('stool', 2.9, 3.2, back({ tier: 2 })),
      WY('wall.window', 5.8, win(2.4, 2.1, 2)), WY('wall.window', 8.5, win(2.4, 2.1, 2)), WY('wall.window', 11.2, win(2.4, 2.1, 2)), WY('wall.window', 14.6, win(2, 1.6, 2)), F('nightstand', 13.9, 0, T(2)),
      WX('wall.door.front', 5.6, T(2)), WX('wall.art', 4.2, { p: { tier: 2, seed: 1 } }), F('wardrobe', 0, 7.2, FL(2)), WX('wall.mirror', 6.9, T(2)), F('bath.toilet', 0, 9.2, { flip: true }),
      F('plant.fiddle', 16.3, 12.2, T(2)), F('plant.fiddle', 11.2, 12.2, T(2)), F('plant.snake', 16.4, 8.8, T(2)), F('sofa.2', 13, 11.6, back({ tier: 2 })), F('coffeetable', 13.2, 10.6, T(2)), F('lamp.floor', 5.7, .1, T(2))],
    slots: { fridge: [0, 0], stove: [1, 0], bath: [0, 9.9, 1], shower: [0, 12], bed: [15, 0] }, boxes: [[7, 5.4], [8.2, 6], [6.4, 6.8], [9.2, 7], [7.6, 7.6], [5.6, 7.4]] },
};

/* ------------------------------------------------------------------ story homes (static, not the player's) */
const table4 = (x, y, t = 1) => [F('table.4', x, y, T(t)), F('chair', x + .25, y - .55, T(t)), F('chair', x + 1.25, y - .55, T(t)), F('chair', x + .25, y + 1.05, back({ tier: t })), F('chair', x + 1.25, y + 1.05, back({ tier: t }))];
const STORY = [
  { id: 'home:sibling', name: "Nora & Theo's House", owner: 'jules', w: 12, d: 9, floor: GT.f_wood, wall: { color: '#f2d6a2', trim: '#8a5a3a', rail: 1 },
    floors: [{ x0: 0, y0: 0, x1: 5.2, y1: 2, floor: GT.f_check }], exits: [{ x: 6, y: 8.5, label: 'Leave' }],
    items: [F('rug', 8, 1.1, { p: { w: 3.5, d: 2.5, pat: 'stripe', tier: 1 } }), F('rug', .2, 5.6, { p: { w: 2.5, d: 2.5, pat: 'round', tier: 1 } }),
      F('kitchen.fridge', 0, 0), F('kitchen.stove', 1, 0), F('kitchen.counter', 2, 0, { p: { tier: 1, len: 2 } }), F('kitchen.sink', 4, 0), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('kitchen.cabinet', 3),
      WY('wall.window', 5.3, win(1.5, 1.2)), WY('wall.photos', 7.2, { p: { tier: 1, seed: 4 }, mount: 1.3 }), F('tv.medium', 9, 0), F('bookshelf', 10.8, 0), WY('wall.fairylights', 8.8, { p: { len: 3, warm: true } }),
      F('sofa.3', 8.2, 3.4, back({ tier: 1 })), F('coffeetable', 9, 2.1), F('lamp.floor', 11.4, 3.2), F('plant.monstera', 11.4, 4.6),
      ...table4(3.4, 4.3), ...table4(5.4, 4.3),
      WX('wall.window', 2.3, win(1.5, 1.2)), WX('wall.poster', 4.3, { p: { tier: 0, art: 'cat' } }), WX('wall.photos', 6.4, { p: { tier: 0, seed: 1 } }), F('dresser', 0, 4.2, FL(1)),
      F('beanbag', .4, 5.9, { p: { tier: 1, c: '#f08ab0' } }), F('console', 1.7, 6.6), F('beanbag', 1.2, 7.4, { p: { tier: 1, c: '#5ab0e0' } }), F('petbed', 3.2, 7.8), F('boxes', 0, 8, { p: { seed: 3 }, tags: ['toys'] }), F('shoerack', 7.4, 8.3), F('plant.snake', 4.6, 2.2)] },
  { id: 'home:grandma', name: "Nana Bea's", owner: 'nana', w: 10, d: 8, floor: GT.f_carpet, wall: { color: '#e6cfc0', color2: '#d9b8ac', pattern: 'stripes', trim: '#6a4428', rail: 1 },
    floors: [{ x0: 0, y0: 0, x1: 4.3, y1: 2, floor: GT.f_check }], exits: [], door: { wall: 'y', at: 4.6 },
    items: [F('rug', .7, 3.5, { p: { w: 2.5, d: 3, pat: 'persian', tier: 2 } }), F('doormat', 4.6, .6),
      F('kitchen.fridge', 0, 0, { p: { tier: 1 } }), F('kitchen.stove', 1, 0, T(1)), F('kitchen.counter', 2, 0, { p: { tier: 1, len: 1, drawers: true } }), F('kitchen.clutter', 3, 0), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('wall.shelf', 3, { p: { tier: 1, seed: 2 }, mount: 1.5 }),
      WY('wall.door.front', 4.6, T(1)), F('piano', 6, 0, T(2)), WY('wall.photos', 6, { p: { tier: 2, seed: 7 }, mount: 1.5 }), F('stereo', 7.7, 0, T(0)), WY('wall.clock', 7.9, T(1)), F('bookshelf', 8.9, 0, T(1)),
      WX('wall.window', 2.2, win(1.5, 1.2)), F('fireplace', 0, 4, FL(1)), WX('wall.art', 4.5, { p: { tier: 2, seed: 1 }, mount: 1.5 }), F('armchair', 1.7, 3.5, FL(1, { face: 3 })), F('armchair', 1.7, 5.3, FL(1, { face: 3 })), F('lamp.floor', .1, 3.3), F('plant.snake', .1, 6.3), F('petbed', .4, 7.2),
      F('table.round', 5.4, 3.8), F('chair', 5.9, 3.2), F('chair', 5.9, 5.4, back()), F('chair', 7, 4.3, FL(1, { face: 3 })),
      F('plant.fiddle', 9.4, 2.4), F('plant.monstera', 9.4, 5.6), F('plant.cactus', 3.6, 2.2), F('dresser', 8.6, 7.2, back()), F('plant.hanging', 4, .2, { z: 1.5 })] },
  { id: 'home:friend', name: "Kit's Studio Flat", owner: 'kit', w: 9, d: 7, floor: GT.f_concrete, wall: { color: '#b0624a', pattern: 'brick', trim: '#33303f', h: 3 },
    floors: [{ x0: 5.6, y0: 2.6, x1: 9, y1: 5.4, floor: GT.f_wood }], exits: [{ x: 4.5, y: 6.5, label: 'Leave' }],
    items: [F('rug', 2.2, 2.4, { p: { w: 3, d: 2, pat: 'zig', tier: 1 } }),
      F('kitchen.fridge', 0, 0, T(0)), F('kitchen.counter', 1, 0, { p: { tier: 0, len: 1 } }), F('kitchen.coffee', 2, 0), WY('wall.shelf', 1, { p: { tier: 0, seed: 1 } }),
      WY('wall.poster', 3.2, { p: { tier: 0, art: 'night', seed: 4 } }), WY('wall.poster', 4.2, T(2)), WY('wall.fairylights', 3, { p: { len: 3, warm: true }, mount: 2.4 }), WY('wall.window', 5.3, win(1.5, 1.4)), F('bed.futon', 7, 0),
      F('guitar', 0, 2), F('stereo', 0, 2.8, FL(2)), WX('wall.poster', 3, { p: { tier: 1 }, mount: 1.5 }), F('bookshelf', 0, 4, FL(0)), F('keyboard', 0, 5.2, FL(1)), WX('wall.art', 5.4, { p: { tier: 0, seed: 2 }, mount: 1.5 }),
      F('beanbag', 2.5, 2.6, { p: { tier: 1, c: '#7a55c8' } }), F('coffeetable', 3.6, 3.6), F('easel', 6.4, 3.3, T(2)), F('stool', 6.6, 4.1, back()), F('plant.monstera', 8.4, 2.2), F('lamp.floor', 6.3, .1), F('plant.cactus', 8.4, 5)] },
];

const PRIVATE = ['bed', 'fridge', 'stove', 'shower', 'bath', 'wardrobe', 'pantry', 'microwave', 'computer', 'laundry', 'moving_box', 'delivery_box', 'toys', 'coffee'];
export function leaveHome(homeId) {
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
  def.setup = scene => { scene.interactables = scene.interactables.filter(it => !it.fx || !it.fx.tags.some(t => PRIVATE.includes(t))); };
  if (s.door) withExit(def, s, s.id); else def.exits = s.exits.map(e => Object.assign({}, e, { use: () => leaveHome(s.id) }));
  defineRoom(def);
}
export const STORY_HOMES = Object.fromEntries(STORY.map(s => [s.id, s]));
for (const h of HOMES) if (SHELLS[h.id]) defineRoom({ id: 'home:' + h.id, name: h.name, home: true,
  build: () => (G.housing ? G.housing.roomDef(h.id) : withExit(Object.assign({ name: h.name, home: true, items: SHELLS[h.id].fixed }, SHELLS[h.id]), SHELLS[h.id], 'home:' + h.id)) });
