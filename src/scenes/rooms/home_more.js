// MORE HOMES (owner msg 107, BIBLE 21.4): the interiors of nine houses and five apartments that already stood in the city, and the DESIGNER'S FURNISHED SET
// of every home, old and new ("pre-furnished or furnish it yourself"). Data only + room registration; the housing system (src/sim/housing.js) builds the rooms.
//
// Shells use the same format as src/scenes/rooms/homes.js (SHELLS) and are added to that table, plus two things:
//   rooms: { <key>: { name, w, d, floor, floors, wall, fixed, slots?, exit?: { x, y, label, to? } } }
//       EXTRA ROOMS of a home (upstairs, a bedroom, a den). Scene / room id `home:<id>:<key>`. Furniture placed there carries `r: '<key>'` (like 'bath').
//   link pieces: any `fixed` item with { to: '<room key>' | 'main' | 'bath', label, spot: [x, y, dir] } is a way into another room (stairs, a door, a hatch):
//       tapping it walks you there; `spot` is where you stand in THIS room when you come back through it (kept clear by housing.check).
//       A room without an `exit` mat is left through its link pieces. `bath.from: '<room key>'` = the bathroom opens off that room instead of the main room
//       (then the main shell has no `bathDoor`; the door is a link piece in that room).
// SETS[homeId] = [{ itemId, x, y, flip } | { itemId, wall, at }, each with `r` for a room other than the main one]: where the designer put every piece.
//   Checked by tools: every piece passes G.housing.check() in an empty home (see docs/reports/homes_more.md "Verify").
// Room ids added: home:<id> and home:<id>:bath for the 14 homes in src/data/homes_more.js, and home:<id>:<key> for every extra room of any home.
import { G } from '../../core/game.js';
import { defineRoom, registerFixture } from '../interior.js';
import { GT } from '../../engine/world.js';
import { SHELLS } from './homes.js';

const F = (a, x, y, o) => Object.assign({ id: 'furn.home.' + a, x, y }, o);
const WY = (a, at, o) => Object.assign({ id: 'furn.home.' + a, wall: 'y', at }, o);
const WX = (a, at, o) => Object.assign({ id: 'furn.home.' + a, wall: 'x', at }, o);
const T = t => ({ p: { tier: t } }), FL = (t, p) => ({ flip: true, p: Object.assign({ tier: t === undefined ? 1 : t }, p) });
const win = (w, h, t = 1) => ({ p: { w, h, tier: t } });
const back = (p) => ({ p: Object.assign({ face: 3 }, p) });
const B = (a, x, y, p, o) => Object.assign({ id: 'furn.home.build.' + a, x, y, p: p || {} }, o);
const BY = (a, x, y, p, o) => B(a, x, y, p, Object.assign({ flip: true }, o));
const M = (a, x, y, p, o) => Object.assign({ id: 'furn.home.more.' + a, x, y, p: p || {} }, o);
const VW = (view, w, h, o, mount) => ({ p: Object.assign({ view, w, h }, o), mount: mount === undefined ? .8 : mount });
/** make a piece a way into another room */
const LK = (item, to, label, spot) => Object.assign(item, { to, label, spot });
const door = (wall, at, to, label, spot, p) => LK({ id: 'furn.home.wall.door.room', wall, at, p: p || { tier: 1 } }, to, label, spot);
/* bathrooms: toilet + basin are the building's, the shower / tub stand on the slots */
const bath = (w, d, floor, wall, o) => Object.assign({ w, d, floor, wall, exit: { x: w / 2, y: d - .5 } }, o);
/* furnished sets */
const P = (itemId, x, y, flip, r) => Object.assign({ itemId, x, y, flip: !!flip }, r ? { r } : null);
const PW = (itemId, wall, at, r) => Object.assign({ itemId, wall, at }, r ? { r } : null);

export const MORE_SHELLS = {
  /* ================================================================ APARTMENTS */
  // The Garret, Lantern Row: 6 x 5 under the roof of the tall gabled rowhouse. Low walls, two tie beams, a dormer on the rooftops.
  lantern_garret: { v: 1, w: 6, d: 5, floor: GT.f_wood, wall: { color: '#eadfc8', pattern: 'planks', trim: '#5e3f30', h: 2.3 },
    floors: [{ x0: 3, y0: 0, x1: 6, y1: 1.5, floor: GT.f_lino }],
    exit: { x: 4, y: 4.5 }, bathDoor: { wall: 'x', at: 3.5, p: { tier: 0 } },
    fixed: [WY('build.window', 1.5, VW('sky', 1.5, 1.1, { nx: 2, frame: '#5e3f30' }, .8)), F('kitchen.sink', 4, 0, T(0)), WY('kitchen.cabinet', 4, Object.assign(T(0), { mount: 1.45 })), WX('wall.coathooks', 2.2)],
    slots: { bed: [0, 0], stove: [3, 0], fridge: [5, 0] },
    bath: bath(3, 3, GT.f_tile, { color: '#e6ecea', pattern: 'tile', trim: '#5e3f30', h: 2.3 }, { fixed: [F('bath.toilet', 0, 0, T(0)), F('bath.sink', 1, 0, T(0)), F('bath.mat', 2, 1)], slots: { shower: [2, 0] } }),
    boxes: [[3, 2.5], [2, 3], [4.5, 2.5], [1.5, 2]] },
  // Sunny Court, Garden Flat: 9 x 7 on the ground floor, with its own patch of garden behind a picket fence.
  sunny_court_flat: { v: 1, w: 9, d: 7, floor: GT.f_wood, wall: { color: '#f6e7b4', trim: '#34506a', rail: 1 },
    floors: [{ x0: 6, y0: 0, x1: 9, y1: 2, floor: GT.f_lino }, { x0: 0, y0: 5, x1: 4, y1: 7, floor: GT.grass }],
    exit: { x: 6.5, y: 6.5 }, bathDoor: { wall: 'y', at: 4.5 },
    fixed: [F('wardrobe', 1.5, 0, T(1)), WY('build.window', 3, VW('garden', 1.5, 1.2, { nx: 2, curtain: '#d9a23a', seed: 3 }, 1)), F('kitchen.sink', 6, 0), WY('kitchen.cabinet', 6), WY('kitchen.cabinet', 7),
      WX('build.window', 1.5, VW('garden', 2, 1.4, { nx: 3, shelf: true, frame: '#f8f5ee', seed: 6 }, .8)),
      B('railing', 0, 4.5, { len: 3, style: 'picket' }), B('lemontree', .5, 6.25), F('plant.monstera', 3.5, 6.5)],
    slots: { bed: [0, 0], stove: [7, 0], fridge: [8, 0] },
    bath: bath(4, 3, GT.f_tile, { color: '#fbf1cc', pattern: 'tile', trim: '#34506a' }, { fixed: [F('bath.toilet', .5, 0), F('bath.sink', 1.5, 0), F('bath.mat', 3, 1, { p: { tier: 1, c: '#3b6fd0' } }), WX('bath.towelrack', 1)], slots: { shower: [3, 0] } }),
    boxes: [[4, 3], [5, 3.5], [6, 4], [5, 2]] },
  // The Inkwell Walk-Up: 10 x 7 on top of the old thread warehouse. A window wall of north light, a half wall round the bed, paint on the boards.
  inkwell_walkup: { v: 1, w: 10, d: 7, floor: GT.f_wood, wall: { color: '#e8e2d6', trim: '#3d4a5c', h: 3.2 },
    floors: [{ x0: 0, y0: 0, x1: 3, y1: 2.5, floor: GT.f_carpet }],
    door: { wall: 'x', at: 5.5 }, bathDoor: { wall: 'x', at: 3, p: { tier: 0, c: '#f1eee6' } },
    fixed: [BY('wall', 3, 0, { len: 2.5, h: 1.3, c: '#e8e2d6', trim: '#3d4a5c' }), F('wardrobe', 1.5, 0, T(0)), F('doormat', .5, 5.5, { flip: true }), WX('wall.door.front', 5.5, { p: { tier: 1, c: '#c8574d' } }),
      F('kitchen.sink', 5.5, 0, T(0)), WY('kitchen.cabinet', 3.5, T(0)), WY('kitchen.cabinet', 4.5, T(0)),
      WY('build.window', 6.5, VW('sky', 3, 2.1, { nx: 4, ny: 3, frame: '#3d4a5c', sill: false }, .9)),
      B('paint', 6, 3, { w: 4, d: 3.5, seed: 5 }), B('lightpool', 6.5, 1, { w: 3, d: 2.5, nx: 4, ny: 3 })],
    slots: { bed: [0, 0], fridge: [3.5, 0], stove: [4.5, 0] },
    bath: bath(4, 3, GT.f_concrete, { color: '#f0c9b0', pattern: 'tile', trim: '#3d4a5c' }, { fixed: [B('paint', .5, 1, { w: 2, d: 1.5, seed: 2 }), F('bath.toilet', .5, 0, T(0)), F('bath.sink', 1.5, 0, T(0)), F('bath.mat', 3, 1), WX('wall.poster', 1, { p: { tier: 0, art: 'night' }, mount: 1.4 })], slots: { shower: [3, 0] } }),
    boxes: [[5, 3], [6, 2.5], [4.5, 4], [6, 4.5]] },
  // Net Loft No. 3: a 12 x 8 timber hall on the quay, loading doors turned into a window; the bedroom is a gallery up the open stair.
  netloft_3: { v: 1, w: 12, d: 8, floor: GT.f_wood, wall: { color: '#e9e4d8', pattern: 'planks', trim: '#7a3a2e', h: 3.6 },
    floors: [{ x0: 0, y0: 0, x1: 4, y1: 3.5, floor: GT.f_check }],
    exit: { x: 6, y: 7.5 }, bathDoor: { wall: 'y', at: 10 },
    fixed: [B('column', 4, 3.5, { style: 'wood', h: 3.6, c: '#8a6240' }), B('column', 8, 3.5, { style: 'wood', h: 3.6, c: '#8a6240' }), BY('beam', 4, 0, { len: 8, style: 'wood' }, { z: 3.3 }), BY('beam', 8, 0, { len: 8, style: 'wood' }, { z: 3.3 }),
      F('kitchen.sink', 2, 0), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), F('kitchen.island', .5, 2), F('stool', 1, 3, back()), F('stool', 2, 3, back()),
      WY('build.window', 4.5, VW('sea', 3, 2.6, { nx: 4, ny: 3, frame: '#3a3440', sill: false, seed: 4 }, .3)), WY('build.lifebuoy', 8.2, { mount: 1.5 }),
      WX('build.window', 4.5, VW('sea', 2, 2, { nx: 3, ny: 3, frame: '#3a3440', sill: false, seed: 8 }, .6)),
      LK(BY('stairs', 11, 0, { len: 3, h: 2.8, c: '#8a6240' }), 'up', 'Stairs to the gallery', [11.5, 3.5, 1])],
    slots: { fridge: [0, 0], stove: [1, 0] },
    rooms: { up: { name: 'Gallery Bedroom', w: 8, d: 5, floor: GT.f_wood, wall: { color: '#e9e4d8', pattern: 'planks', trim: '#7a3a2e', h: 2.6 },
      fixed: [LK(M('stairwell', 7, 0, { len: 2, c: '#8a6240' }, { flip: true }), 'main', 'Stairs down', [7.5, 2.5, 1]), B('railing', 0, 4.5, { len: 8, style: 'wood' }),
        F('wardrobe', 4.5, 0, T(1)), WY('build.window.porthole', 2.5, { mount: 1.2 }), WX('build.window', 2.5, VW('sea', 1.5, 1.4, { nx: 2, ny: 2, frame: '#3a3440', seed: 2 }, .8))],
      slots: { bed: [0, 0] } } },
    bath: bath(5, 4, GT.f_check, { color: '#d6e6ee', pattern: 'planks', trim: '#7a3a2e' }, { fixed: [F('bath.toilet', .5, 0), F('bath.sink', 1.5, 0, { p: { tier: 1, len: 1.5 } }), F('bath.mat', 4, 1), F('bath.washer', 0, 2, FL(1)), WY('build.window.porthole', 3, { mount: 1.3 })], slots: { shower: [4, 0] } }),
    boxes: [[6, 4.5], [7, 5], [5, 5.5], [6.5, 3], [9.5, 4.5]] },
  // Meridian Tower 1407: a one-bedroom on the fourteenth floor. Glass from floor to ceiling, a slim kitchen, the bathroom off the bedroom.
  meridian_1407: { v: 1, w: 10, d: 7, floor: GT.f_darkwood, wall: { color: '#dfe3ea', trim: '#2a2733', h: 3 },
    floors: [{ x0: 0, y0: 0, x1: 4, y1: 3, floor: GT.f_tile }],
    door: { wall: 'x', at: 5.5 },
    fixed: [F('doormat', .5, 5.5, { flip: true }), WX('wall.door.front', 5.5, T(2)), F('kitchen.sink', 2, 0, T(2)), WY('kitchen.cabinet', 1, T(2)), WY('kitchen.cabinet', 2, T(2)),
      F('kitchen.counter', 3.5, 1, { flip: true, p: { tier: 2, len: 2 } }), F('stool', 4, 1.5, FL(2)), F('stool', 4, 2.5, FL(2)),
      WY('build.window', 4, VW('city', 3, 2.8, { nx: 3, frame: '#2a2733', sill: false, seed: 11 }, .1)), WY('build.window', 7, VW('city', 3, 2.8, { nx: 3, frame: '#2a2733', sill: false, seed: 12 }, .1)),
      door('x', 2, 'bed', 'Bedroom', [.9, 2.5, 0], { tier: 2 })],
    slots: { fridge: [0, 0], stove: [1, 0] },
    rooms: { bed: { name: 'Bedroom', w: 7, d: 6, floor: GT.f_carpet, wall: { color: '#d3d8e2', trim: '#2a2733', h: 3 },
      fixed: [F('wardrobe', 0, 0, T(2)), WY('build.window', 2.5, VW('city', 3, 2.8, { nx: 3, frame: '#2a2733', sill: false, seed: 13 }, .1)),
        door('x', 2, 'bath', 'Bathroom', [.9, 2.5, 0], { tier: 2 }), door('x', 4, 'main', 'Living room', [.9, 4.5, 0], { tier: 2 })],
      slots: { bed: [4.5, 0] } } },
    bath: bath(5, 4, GT.f_stone, { color: '#3d4560', pattern: 'tile', trim: '#c9a24a', h: 3 }, { from: 'bed', exit: { x: 2.5, y: 3.5, label: 'Back to the bedroom' },
      fixed: [F('bath.toilet', .5, 0, T(2)), F('bath.sink', 1.5, 0, { p: { tier: 2, len: 1.5, wood: '#5e3f30' } }), F('bath.mat', 4, 1, T(2)), WX('bath.towelrack', 1.5, T(2))], slots: { shower: [4, 0] } }),
    boxes: [[6, 3.5], [7, 4], [5, 4.5], [8, 3]] },

  /* ================================================================ HOUSES */
  // Wren Cottage: 8 x 7 front room with the kitchen in a corner and a fireplace, a bedroom through its own door, a herb bed outside the back step.
  wren_cottage: { v: 1, w: 8, d: 7, floor: GT.f_wood, wall: { color: '#f4ead2', trim: '#4f7560', rail: 1 },
    floors: [{ x0: 0, y0: 0, x1: 3, y1: 2, floor: GT.f_check }, { x0: 5, y0: 5, x1: 8, y1: 7, floor: GT.grass }],
    exit: { x: 3, y: 6.5 }, bathDoor: { wall: 'y', at: 3 },
    fixed: [F('kitchen.sink', 2, 0), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('wall.window', 4.5, win(1, 1.2)), F('fireplace', 6, 0),
      WX('wall.window', 2, win(1.5, 1.2)), door('x', 5, 'bed', 'Bedroom', [.9, 5.5, 0]),
      B('railing', 5, 4.5, { len: 2, style: 'picket' }), B('gardenbed', 5.5, 5, { len: 2, seed: 3 })],
    slots: { fridge: [0, 0], stove: [1, 0] },
    rooms: { bed: { name: 'Bedroom', w: 5, d: 5, floor: GT.f_carpet, wall: { color: '#e3ecd8', trim: '#4f7560', rail: 1 },
      fixed: [F('wardrobe', 0, 0, T(1)), WY('wall.window', 2, win(1.2, 1.2)), door('x', 3.5, 'main', 'Front room', [.9, 4, 0])], slots: { bed: [3, 0] } } },
    bath: bath(3, 4, GT.f_tile, { color: '#eef3e6', pattern: 'tile', trim: '#4f7560', rail: 1 }, { fixed: [F('bath.toilet', 0, 0), F('bath.sink', 1, 0), F('bath.mat', 2, 1), WX('bath.towelrack', 1.5)], slots: { shower: [2, 0] } }),
    boxes: [[3.5, 3], [4.5, 3.5], [2.5, 4], [4, 2]] },
  // Rosebank Bungalow: 10 x 8, everything on one floor. Open living room and kitchen, a covered front porch behind two half walls, the bedroom at the back.
  rosebank_bungalow: { v: 1, w: 10, d: 8, floor: GT.f_wood, wall: { color: '#f6e3dc', trim: '#6a4a4a' },
    floors: [{ x0: 0, y0: 0, x1: 4, y1: 2.5, floor: GT.f_check }, { x0: 0, y0: 6, x1: 10, y1: 8, floor: GT.f_darkwood }],
    exit: { x: 5, y: 7.5 }, bathDoor: { wall: 'y', at: 8.5 },
    fixed: [F('kitchen.sink', 2, 0), F('kitchen.counter', 3, 0, { p: { tier: 1, len: 1, drawers: true } }), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('kitchen.cabinet', 3), WY('wall.window', 4.5, win(1.5, 1.3)), WY('wall.window', 6.5, win(1.5, 1.3)),
      door('x', 3.5, 'bed', 'Bedroom', [.9, 4, 0]),
      B('wall', 0, 5.5, { len: 3.5, c: '#f6e3dc', trim: '#6a4a4a' }), B('wall', 6.5, 5.5, { len: 3.5, c: '#f6e3dc', trim: '#6a4a4a' }),
      B('railing', 0, 7.5, { len: 4, style: 'wood' }), B('railing', 6, 7.5, { len: 4, style: 'wood' })],
    slots: { fridge: [0, 0], stove: [1, 0] },
    rooms: { bed: { name: 'Bedroom', w: 7, d: 5, floor: GT.f_carpet, wall: { color: '#f3d6d0', trim: '#6a4a4a', rail: 1 },
      fixed: [WY('wall.window', .5, win(1.5, 1.2)), F('wardrobe', 5, 0, T(1)), door('x', 3, 'main', 'Living room', [.9, 3.5, 0])], slots: { bed: [2.5, 0] } } },
    bath: bath(4, 4, GT.f_check, { color: '#f6dfe0', pattern: 'tile', trim: '#6a4a4a' }, { fixed: [F('bath.toilet', 0, 0), F('bath.sink', 1, 0), F('bath.mat', 3, 1, { p: { tier: 1, c: '#d98a9c' } }), WX('wall.window', 1.5, win(1, 1)), F('plant.snake', 0, 3.5)], slots: { shower: [3, 0] } }),
    boxes: [[5, 3], [6, 3.5], [4, 3.5], [5, 2]] },
  // The Crooked House: three 6-wide rooms stacked on a steep stair. Kitchen-parlour at street level, a sitting room, a bedroom under the roof beams.
  crooked_house: { v: 1, w: 6, d: 7, floor: GT.f_check, wall: { color: '#f4e8d0', trim: '#3a3a44', rail: 1.9 },
    door: { wall: 'y', at: 4.5 },
    fixed: [BY('beam', 2, 0, { len: 7, style: 'wood' }, { z: 2.5 }), BY('beam', 4, 0, { len: 7, style: 'wood' }, { z: 2.5 }),
      F('kitchen.sink', 0, 2, FL(0)), WX('kitchen.cabinet', 1, T(0)), WX('kitchen.cabinet', 2, T(0)), WY('wall.window', 1, win(1.2, 1.2)),
      LK(BY('stairs', 2.5, 0, { len: 3, h: 2.8, c: '#5e3f30', runner: '#8a3848' }), 'up', 'Stairs up', [3, 3.5, 1]),
      F('doormat', 4.5, .5), WY('wall.door.front', 4.5, { p: { tier: 1, c: '#3a3a44' } })],
    slots: { fridge: [0, 0, 1], stove: [0, 1, 1] },
    rooms: {
      up: { name: 'Sitting Room', w: 6, d: 7, floor: GT.f_wood, wall: { color: '#f4e8d0', trim: '#3a3a44', rail: 1.9 },
        fixed: [BY('beam', 2, 0, { len: 7, style: 'wood' }, { z: 2.5 }), BY('beam', 4, 0, { len: 7, style: 'wood' }, { z: 2.5 }), WY('wall.window', .5, win(1.5, 1.3)),
          LK(M('stairwell', 2.5, 0, { len: 2, c: '#5e3f30', runner: '#8a3848' }, { flip: true }), 'main', 'Stairs down', [3, 2.5, 1]),
          LK(WY('more.trapdoor', 4.5, { p: { c: '#5e3f30' } }), 'attic', 'Ladder to the attic', [5, .9, 1]),
          F('fireplace', 0, 1.5, FL(1)), door('x', 4.5, 'bath', 'Bathroom', [.9, 5, 0], { tier: 0 })] },
      attic: { name: 'Attic Bedroom', w: 6, d: 6, floor: GT.f_wood, wall: { color: '#efe2c6', pattern: 'planks', trim: '#3a3a44', h: 2.2 },
        fixed: [BY('beam', 2, 0, { len: 6, style: 'wood' }, { z: 1.95 }), BY('beam', 4, 0, { len: 6, style: 'wood' }, { z: 1.95 }),
          LK(M('stairwell', 4.5, 0, { len: 2, c: '#5e3f30' }, { flip: true }), 'up', 'Down the ladder', [5, 2.5, 1]), WX('build.window.porthole', 3, { mount: 1 })],
        slots: { bed: [0, 0] } } },
    bath: bath(4, 3, GT.f_check, { color: '#e8dcc4', pattern: 'tile', trim: '#3a3a44' }, { from: 'up', exit: { x: 2, y: 2.5, label: 'Back to the sitting room' },
      fixed: [F('bath.toilet', .5, 0), F('bath.sink', 1.5, 0), F('bath.mat', 3, 1), WX('bath.towelrack', 1)], slots: { shower: [3, 0] } }),
    boxes: [[3.5, 4], [2.5, 4.5], [4, 5], [1.5, 5.5]] },
  // Bluebird House (Cape Cod): lounge and kitchen-diner downstairs, one bedroom under the sloping roof with two dormers, the bathroom up there with it.
  bluebird_house: { v: 1, w: 10, d: 8, floor: GT.f_wood, wall: { color: '#e8ecf0', trim: '#3f3d4a', rail: 1 },
    floors: [{ x0: 0, y0: 0, x1: 4, y1: 3, floor: GT.f_check }],
    exit: { x: 5.5, y: 7.5 },
    fixed: [F('kitchen.sink', 2, 0), F('kitchen.counter', 3, 0, { p: { tier: 1, len: 1, drawers: true } }), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('kitchen.cabinet', 3),
      F('fireplace', 6.5, 0), WX('wall.window', 1.5, win(1.5, 1.2)), WX('wall.coathooks', 7), F('shoerack', 0, 6.5, FL(1)),
      LK(BY('stairs', 9, 0, { len: 3, h: 2.8, runner: '#4f74b8' }), 'up', 'Upstairs', [9.5, 3.5, 1])],
    slots: { fridge: [0, 0], stove: [1, 0] },
    rooms: { up: { name: 'Dormer Bedroom', w: 9, d: 6, floor: GT.f_carpet, wall: { color: '#eef0e6', trim: '#3f3d4a', h: 2.3 },
      fixed: [LK(M('stairwell', 8, 0, { len: 2, runner: '#4f74b8' }, { flip: true }), 'main', 'Downstairs', [8.5, 2.5, 1]), F('wardrobe', 0, 0, FL(1)),
        WY('build.window', 1.5, VW('sky', 1.2, 1.1, { nx: 2, frame: '#f8f5ee' }, .8)), WY('build.window', 5.5, VW('sky', 1.2, 1.1, { nx: 2, frame: '#f8f5ee', seed: 4 }, .8)),
        door('x', 3.5, 'bath', 'Bathroom', [.9, 4, 0])],
      slots: { bed: [3, 0] } } },
    bath: bath(5, 4, GT.f_tile, { color: '#dfe8f0', pattern: 'tile', trim: '#3f3d4a', h: 2.3 }, { from: 'up', exit: { x: 2.5, y: 3.5, label: 'Back to the bedroom' },
      fixed: [F('bath.toilet', .5, 0), F('bath.sink', 1.5, 0), F('bath.mat', 4, 1, { p: { tier: 1, c: '#3b6fd0' } }), WY('build.window', 2.7, VW('sky', 1, .9, { nx: 2, frame: '#f8f5ee' }, 1))], slots: { shower: [4, 0] } }),
    boxes: [[5, 4], [6, 4.5], [4, 5], [6.5, 3.5]] },
  // Thistle House (craftsman): a deep porch, a lounge with a brick fireplace between built-in bookshelves, dining by the kitchen; a bedroom and a study upstairs.
  thistle_house: { v: 1, w: 11, d: 8, floor: GT.f_darkwood, wall: { color: '#e3cfa0', trim: '#5e3f30', rail: 1.1 },
    floors: [{ x0: 0, y0: 0, x1: 4, y1: 3, floor: GT.f_check }, { x0: 0, y0: 6, x1: 11, y1: 8, floor: GT.f_wood }],
    exit: { x: 5.5, y: 7.5 },
    fixed: [F('kitchen.sink', 2, 0), F('kitchen.counter', 3, 0, { p: { tier: 1, len: 1 } }), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('kitchen.cabinet', 3),
      F('bookshelf', 5.5, 0, T(2)), F('fireplace', 6.5, 0, T(1)), F('bookshelf', 8.5, 0, T(2)), WX('wall.window', 1, win(1.5, 1.2)), WX('wall.window', 4, win(1.5, 1.3)),
      LK(BY('stairs', 10, 0, { len: 3, h: 2.8, c: '#5e3f30', runner: '#8a3848' }), 'up', 'Upstairs', [10.5, 3.5, 1]),
      B('wall', 0, 5.5, { len: 4.5, c: '#e3cfa0', trim: '#5e3f30' }), B('wall', 6.5, 5.5, { len: 4.5, c: '#e3cfa0', trim: '#5e3f30' }),
      B('railing', 0, 7.5, { len: 4.5, style: 'wood' }), B('railing', 6.5, 7.5, { len: 4.5, style: 'wood' })],
    slots: { fridge: [0, 0], stove: [1, 0] },
    rooms: { up: { name: 'Bedroom & Study', w: 10, d: 6, floor: GT.f_carpet, wall: { color: '#e9dcb8', trim: '#5e3f30', rail: 1.1 },
      floors: [{ x0: 6.5, y0: 0, x1: 10, y1: 6, floor: GT.f_darkwood }],
      fixed: [LK(M('stairwell', 9, 0, { len: 2, c: '#5e3f30', runner: '#8a3848' }, { flip: true }), 'main', 'Downstairs', [9.5, 2.5, 1]), BY('wall', 6, 0, { len: 3, c: '#e9dcb8', trim: '#5e3f30' }),
        F('wardrobe', 3, 0, T(1)), WY('wall.window', 7, win(1.2, 1.2)), WX('wall.window', 1, win(1.5, 1.2)), door('x', 3.5, 'bath', 'Bathroom', [.9, 4, 0])],
      slots: { bed: [1, 0] } } },
    bath: bath(6, 4, GT.f_check, { color: '#eadfc0', pattern: 'tile', trim: '#5e3f30', rail: 1.1 }, { from: 'up', exit: { x: 3, y: 3.5, label: 'Back to the bedroom' },
      fixed: [F('bath.toilet', 2.5, 0), F('bath.sink', 3.5, 0), F('bath.mat', .5, 1), WX('bath.towelrack', 1.5, { mount: 1.2 })], slots: { bath: [0, 0], shower: [5, 0] } }),
    boxes: [[5, 4], [6, 4.5], [4.5, 3], [7, 4]] },
  // Larkspur House: two full floors on the hill. Hall, lounge and kitchen-diner with bay windows over the town; two bedrooms and the bathroom upstairs.
  larkspur_house: { v: 1, w: 12, d: 8, floor: GT.f_wood, wall: { color: '#eef2f4', trim: '#3f4658' },
    floors: [{ x0: 0, y0: 0, x1: 4.5, y1: 3.5, floor: GT.f_tile }],
    door: { wall: 'x', at: 5.5 },
    fixed: [F('doormat', .5, 5.5, { flip: true }), WX('wall.door.front', 5.5, { p: { tier: 2, c: '#3f4658' } }),
      F('kitchen.sink', 2, 0), F('kitchen.counter', 3, 0, { p: { tier: 1, len: 1.5 } }), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('kitchen.cabinet', 3),
      F('kitchen.island', 1, 2), F('stool', 1.5, 3, back()), F('stool', 2.5, 3, back()),
      WY('build.window', 5, VW('hills', 2, 1.5, { nx: 3, seed: 5 }, .8)), WY('build.window', 8, VW('hills', 2, 1.5, { nx: 3, seed: 7 }, .8)), WX('build.window', 1.5, VW('hills', 2, 1.4, { nx: 3, seed: 2 }, .9)),
      LK(BY('stairs', 11, 0, { len: 3, h: 2.8, runner: '#3f4658' }), 'up', 'Upstairs', [11.5, 3.5, 1])],
    slots: { fridge: [0, 0], stove: [1, 0] },
    rooms: {
      up: { name: 'Main Bedroom', w: 8, d: 6, floor: GT.f_carpet, wall: { color: '#e6edf2', trim: '#3f4658' },
        fixed: [LK(M('stairwell', 7, 0, { len: 2, runner: '#3f4658' }, { flip: true }), 'main', 'Downstairs', [7.5, 2.5, 1]), F('wardrobe', 5, 0, T(1)),
          WY('build.window', .5, VW('hills', 1.5, 1.4, { nx: 2, seed: 9 }, .8)), door('x', 1, 'up2', 'Second bedroom', [.9, 1.5, 0]), door('x', 4, 'bath', 'Bathroom', [.9, 4.5, 0])],
        slots: { bed: [2.5, 0] } },
      up2: { name: 'Second Bedroom', w: 6, d: 5, floor: GT.f_wood, wall: { color: '#f2eedc', trim: '#3f4658' }, exit: { x: 3, y: 4.5, label: 'Back to the landing', to: 'up' },
        fixed: [WY('build.window', 2, VW('hills', 1.5, 1.3, { nx: 2, seed: 3 }, .9)), WX('radiator', 2.5)] } },
    bath: bath(6, 5, GT.f_tile, { color: '#dfe9ee', pattern: 'tile', trim: '#3f4658' }, { from: 'up', exit: { x: 3, y: 4.5, label: 'Back to the bedroom' },
      fixed: [F('bath.toilet', 2.5, 0), F('bath.sink', 3.5, 0), F('bath.mat', .5, 1), WX('bath.towelrack', 1.5, { mount: 1.2 }), WX('build.window', 3, VW('hills', 1.2, 1, { nx: 2 }, 1)), F('plant.monstera', 0, 4.5)], slots: { bath: [0, 0], shower: [5, 0] } }),
    boxes: [[6, 4], [7, 4.5], [5, 5], [8, 4], [6.5, 5.5]] },
  // The Stepdown (split-level): living room and kitchen in the middle, half a flight up to the bedroom and bathroom, half a flight down to the den and garage.
  stepdown_house: { v: 1, w: 11, d: 7, floor: GT.f_wood, wall: { color: '#e6eef2', trim: '#3f4658' },
    floors: [{ x0: 0, y0: 0, x1: 4, y1: 3, floor: GT.f_lino }],
    exit: { x: 5.5, y: 6.5 },
    fixed: [F('kitchen.sink', 2, 0), F('kitchen.counter', 3, 0, { p: { tier: 1, len: 1 } }), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('kitchen.cabinet', 3),
      F('kitchen.counter', 4, 1, { flip: true, p: { tier: 1, len: 2, c: '#5f86a8' } }), F('stool', 4.5, 1.5, FL(1)), F('stool', 4.5, 2.5, FL(1)),
      WY('build.window', 5.5, VW('hills', 3, 1.6, { nx: 4, seed: 6 }, .8)),
      LK(BY('stairs', 10, 0, { len: 2, h: 1.4, runner: '#c8683f' }), 'up', 'Up to the bedroom', [10.5, 2.5, 1]),
      LK(M('stairwell', 0, 6, { len: 2, runner: '#c8683f' }), 'den', 'Down to the den', [2.5, 6.5, 0])],
    slots: { fridge: [0, 0], stove: [1, 0] },
    rooms: {
      up: { name: 'Bedroom Level', w: 9, d: 6, floor: GT.f_carpet, wall: { color: '#e9e4d6', trim: '#3f4658' },
        fixed: [LK(M('stairwell', 8, 0, { len: 2, runner: '#c8683f' }, { flip: true }), 'main', 'Down to the living room', [8.5, 2.5, 1]), F('wardrobe', 4, 0, T(1)),
          WY('build.window', 6, VW('hills', 1.5, 1.3, { nx: 2, seed: 4 }, .9)), door('x', 3, 'bath', 'Bathroom', [.9, 3.5, 0])],
        slots: { bed: [1.5, 0] } },
      den: { name: 'Den & Garage', w: 10, d: 6, floor: GT.f_carpet, wall: { color: '#d9c9a8', pattern: 'planks', trim: '#5e3f30' },
        floors: [{ x0: 6.5, y0: 0, x1: 10, y1: 6, floor: GT.f_concrete }],
        fixed: [LK(B('stairs', 0, 0, { len: 2, h: 1.4, runner: '#c8683f' }), 'main', 'Up to the living room', [2.5, .5, 0]), WY('more.garagedoor', 7, { p: { w: 3 } }), WX('wall.window', 2.5, win(1.5, .8))] } },
    bath: bath(6, 4, GT.f_tile, { color: '#dbe9e4', pattern: 'tile', trim: '#3f4658' }, { from: 'up', exit: { x: 3, y: 3.5, label: 'Back to the bedroom' },
      fixed: [F('bath.toilet', 2.5, 0), F('bath.sink', 3.5, 0), F('bath.mat', .5, 1), WX('bath.towelrack', 1.5, { mount: 1.2 })], slots: { bath: [0, 0], shower: [5, 0] } }),
    boxes: [[6, 3.5], [7, 4], [5.5, 4.5], [8, 3.5]] },
  // Orchard End: the L-shaped family house. Kitchen with an island, a lounge with a fireplace, and the L wraps a back garden with fruit trees and a vegetable bed.
  orchard_end: { v: 1, w: 13, d: 10, floor: GT.f_wood, wall: { color: '#f6efe0', trim: '#a8503c', rail: 1 },
    floors: [{ x0: 0, y0: 0, x1: 5, y1: 4, floor: GT.f_check }, { x0: 7.5, y0: 6, x1: 13, y1: 10, floor: GT.grass }],
    exit: { x: 3.5, y: 9.5 },
    fixed: [F('kitchen.sink', 2, 0), F('kitchen.counter', 3, 0, { p: { tier: 1, len: 2 } }), WY('kitchen.cabinet', 1), WY('kitchen.cabinet', 2), WY('kitchen.cabinet', 3), WY('kitchen.cabinet', 4),
      F('kitchen.island', 1.5, 2), F('stool', 2, 3, back()), F('stool', 3, 3, back()),
      F('fireplace', 8, 0), WY('wall.window', 10.5, win(1.2, 1.4)), WX('wall.window', 1.5, win(1.6, 1.3)), WX('wall.window', 6, win(1.6, 1.3)),
      LK(BY('stairs', 12, 0, { len: 3, h: 2.8, runner: '#a8503c' }), 'up', 'Upstairs', [12.5, 3.5, 1]),
      B('wall', 8.5, 5.5, { len: 4.5, c: '#f6efe0', trim: '#a8503c' }), BY('wall', 7, 7.5, { len: 2.5, c: '#f6efe0', trim: '#a8503c' }),
      B('gardenbed', 9.5, 8.5, { len: 3, seed: 5 }), B('lemontree', 12.5, 6.5), B('lemontree', 8, 9.25, { seed: 9 })],
    slots: { fridge: [0, 0], stove: [1, 0] },
    rooms: {
      up: { name: 'Main Bedroom', w: 9, d: 7, floor: GT.f_carpet, wall: { color: '#f3e6d0', trim: '#a8503c', rail: 1 },
        fixed: [LK(M('stairwell', 8, 0, { len: 2, runner: '#a8503c' }, { flip: true }), 'main', 'Downstairs', [8.5, 2.5, 1]), F('wardrobe', 5.5, 0, T(1)), WY('wall.window', 1, win(1.5, 1.3)),
          door('x', 1.5, 'up2', 'Second bedroom', [.9, 2, 0]), door('x', 4.5, 'bath', 'Bathroom', [.9, 5, 0])],
        slots: { bed: [3, 0] } },
      up2: { name: 'Bedroom Two & Playroom', w: 8, d: 6, floor: GT.f_wood, wall: { color: '#e4eed8', trim: '#a8503c', rail: 1 }, exit: { x: 4, y: 5.5, label: 'Back to the landing', to: 'up' },
        fixed: [WY('wall.window', 2.5, win(1.5, 1.3)), WX('wall.window', 2, win(1.5, 1.2))] } },
    bath: bath(6, 5, GT.f_check, { color: '#f6ead0', pattern: 'tile', trim: '#a8503c', rail: 1 }, { from: 'up', exit: { x: 3, y: 4.5, label: 'Back to the bedroom' },
      fixed: [F('bath.toilet', 2.5, 0), F('bath.sink', 3.5, 0), F('bath.mat', .5, 1), WX('bath.towelrack', 1.5, { mount: 1.2 }), WX('wall.window', 3, win(1.2, 1)), F('plant.monstera', 0, 4.5)], slots: { bath: [0, 0], shower: [5, 0] } }),
    boxes: [[6, 5], [7, 5.5], [5, 6], [6.5, 6.5], [5.5, 7.5]] },
  // Gull's Rest (cliff house): one long living room behind a wall of sea glass, a deck over the drop, the bedroom suite on the lower level.
  gulls_rest: { v: 1, w: 12, d: 8, floor: GT.f_wood, wall: { color: '#eef0ea', trim: '#56708a', h: 3 },
    floors: [{ x0: 0, y0: 0, x1: 4, y1: 3.5, floor: GT.f_tile }, { x0: 0, y0: 6, x1: 12, y1: 8, floor: GT.f_darkwood }],
    exit: { x: 6, y: 7.5 },
    fixed: [F('kitchen.sink', 2, 0, T(2)), F('kitchen.counter', 3, 0, { p: { tier: 2, len: 1 } }), WY('kitchen.cabinet', 1, T(2)), WY('kitchen.cabinet', 2, T(2)), WY('kitchen.cabinet', 3, T(2)),
      F('kitchen.island', 1, 2, T(2)), F('stool', 1.5, 3, back({ tier: 2 })), F('stool', 2.5, 3, back({ tier: 2 })),
      WY('build.window', 4.5, VW('sea', 3, 2.6, { nx: 4, ny: 3, frame: '#56708a', sill: false, seed: 21 }, .2)), WY('build.window', 7.8, VW('sea', 3, 2.6, { nx: 4, ny: 3, frame: '#56708a', sill: false, seed: 22 }, .2)),
      WX('build.window', 3.5, VW('sea', 2, 2.2, { nx: 3, ny: 3, frame: '#56708a', sill: false, seed: 23 }, .4)),
      LK(M('stairwell', 11, 0, { len: 2, c: '#b89668' }, { flip: true }), 'low', 'Down to the bedroom', [11.5, 2.5, 1]),
      B('railing', 0, 7.5, { len: 5, style: 'glass' }), B('railing', 7, 7.5, { len: 5, style: 'glass' })],
    slots: { fridge: [0, 0], stove: [1, 0] },
    rooms: { low: { name: 'Bedroom Suite', w: 10, d: 6, floor: GT.f_carpet, wall: { color: '#e6ece8', trim: '#56708a', h: 3 },
      fixed: [LK(BY('stairs', 9, 0, { len: 3, h: 2.8, c: '#b89668' }), 'main', 'Up to the living room', [9.5, 3.5, 1]), F('wardrobe', 0, 0, T(2)),
        WY('build.window', 3, VW('sea', 3, 2.6, { nx: 4, ny: 3, frame: '#56708a', sill: false, seed: 24 }, .2)), door('x', 3, 'bath', 'Bathroom', [.9, 3.5, 0], { tier: 2 })],
      slots: { bed: [3.5, 0] } } },
    bath: bath(6, 5, GT.f_stone, { color: '#e2ece8', pattern: 'tile', trim: '#56708a', h: 3 }, { from: 'low', exit: { x: 3, y: 4.5, label: 'Back to the bedroom' },
      fixed: [F('bath.toilet', 2.5, 0, T(2)), F('bath.sink', 3.5, 0, { p: { tier: 2, len: 1.5, wood: '#5e3f30' } }), F('bath.mat', .5, 1, T(2)), WX('bath.towelrack', 1.5, T(2)),
        WX('build.window', 3, VW('sea', 1.3, 1.6, { nx: 2, ny: 2, frame: '#56708a', seed: 25 }, .8)), F('plant.fiddle', 0, 4.5, T(2))], slots: { bath: [0, 0], shower: [5, 0] } }),
    boxes: [[6, 4], [7, 4.5], [5, 5], [8, 4]] },
};
Object.assign(SHELLS, MORE_SHELLS);

/* ------------------------------------------------------------------ the designer's furnished sets (PRE-FURNISHED) */
export const SETS = {
  /* ---- the nine homes that were already there (their shells are in homes.js) ---- */
  juniper_court: [P('g_arm_mustard', 5.5, 2.5), P('g_dine2_basic', 2.5, 2.5), P('g_dine_teal', 2.5, 2), P('g_dine_teal', 3, 2), P('g_rug_kilim', 2, 2), P('g_lamp_paper', 1, 6.5), P('g_nightst_oak', 0, 6.5), P('g_tl_classic', 0, 6.5),
    P('g_rug_stripes', 1.5, 7), PW('g_w_botanical', 'x', 7.5), P('g_plant_fern', 6.5, 4.5)],
  saltbox_lofts: [P('g_futons_navy', 3.5, 0), P('g_coffee_pine', 4, 2), P('g_arm_mustard', 5.5, 0), P('g_lamp_drum', 6.5, 0), P('g_dine2_basic', 8, 2.5), P('g_dine_teal', 8, 2), P('g_dine_teal', 8.5, 2), P('g_plant_palm', 9.5, 4),
    P('g_nightst_oak', 1, 0), P('g_tl_classic', 1, 0), PW('g_w_roundmirror', 'x', 1.5)],
  easel_house: [P('g_nightst_oak', 4, 0), P('g_tl_classic', 4, 0), P('g_love_rose', 0, 6.5, 1), P('g_coffee_pine', 2, 6.5, 1), P('g_rug_patch', 1, 6), P('g_lamp_studio', 7.5, 5), P('g_plant_rubber', 7.5, 2.5),
    P('g_bistro_marble', 5, 2.5), P('g_dine_teal', 5, 2), P('g_dine_teal', 5.5, 2)],
  birch_lane_flats: [P('g_love_rose', 0, 4.5, 1), P('g_hairpin_oak', 2, 5), P('g_rug_jute', 1, 4.5), P('g_tv_crt', 5, 0), P('g_dine2_basic', 6.5, 3.5), P('g_dine_teal', 6.5, 3), P('g_dine_teal', 7, 3), P('g_lamp_paper', 0, 4),
    P('g_plant_fern', 8.5, 5), PW('g_w_botanical', 'x', .5)],
  marlowe_1br: [P('g_bed_uphol_d', 0, 0), P('g_nightst_oak', 1.5, 0), P('g_tl_classic', 1.5, 0), P('g_rug_shag', 1, 2), P('g_mid_mustard', 0, 7, 1), P('g_coffee_pine', 2, 7, 1), P('g_rug_trellis', 1, 7), P('g_arm_mustard', 3, 7.5),
    P('g_dine4_pine', 5, 5), P('g_dine_teal', 5, 4.5), P('g_dine_teal', 6.5, 4.5), P('g_plant_palm', 10.5, 4), PW('g_clock_gold', 'y', 6)],
  cannery_loft: [P('g_bed_storage_d', 0, 7.5), P('g_nightst_oak', 1.5, 7.5), P('g_tl_banker', 1.5, 7.5), P('g_rug_jute', 2, 7), P('g_mid3_teal', 5, 0), P('g_glass_coffee', 5.5, 2), P('g_rug_kilim', 5.5, 2), P('g_club_tan', 8.5, 0),
    P('g_tv_medium_game', 0, 4.5, 1), P('g_h_easel_studio', 11, 6.5), P('g_stool3_pine', 12.5, 7), P('g_plant_bird', 13.5, 6), P('g_trestle_oak', 6, 5.5), P('g_windsor_black', 6, 5), P('g_windsor_black', 7.5, 5), P('g_books_wave', 9.5, 0)],
  sycamore_house: [P('g_bed_sleigh_d', 15, 0), P('g_rug_border', 14, 2.5), P('g_club_tan', 12.5, 3), P('g_chester_oxblood', 6, 0), P('g_wing_forest', 10.5, 0), P('g_trunk_table', 8, 2), P('g_farm_table', 6.5, 5.5), P('g_windsor_black', 6.5, 5),
    P('g_windsor_black', 9, 5), P('g_bench_oak', 7.5, 6.5), P('g_plant_palm', 11, 4), P('g_books_tall', 3, 8), P('g_lamp_tripod', 2, 8)],
  villa_belvedere: [P('g_bed_canopy_d', 16, .5), P('g_rug_border', 15, 3), P('g_wing_forest', 7, 2), P('g_wing_forest', 11, 2), P('g_marble_coffee', 9, 3), P('g_pedestal_walnut', 8, 7), P('g_windsor_black', 8, 6.5), P('g_windsor_black', 9, 6.5),
    P('g_f_spinbike', 14, 7), P('g_yogamat_rose', 16, 7), P('g_plant_palm', 12.5, 0), P('g_lamp_arc', 13.5, 4)],
  beacon_penthouse: [P('g_king_royal', 16.5, .5), P('g_rug_border', 16, 3), P('g_pedestal_walnut', 3, 6), P('g_windsor_black', 3, 5.5), P('g_windsor_black', 4, 5.5), P('g_egg_orange', 13, 2), P('g_d_globe', 12, 4), P('g_plant_bird', 6, 4)],
  /* ---- more homes ---- */
  lantern_garret: [P('g_bed_iron_s', 0, 0), P('g_nightst_oak', 1, 0), P('g_tl_classic', 1, 0), P('g_rug_stripes', 1.5, 1.5), P('g_dine2_basic', 4.5, 2), P('g_dine_teal', 4, 2), P('g_ladder_oak', 0, 2, 1),
    P('g_plant_fern', 5.5, 3.5), PW('g_photos_family', 'x', .5)],
  sunny_court_flat: [P('g_bed_storage_d', 0, 0), PW('g_w_botanical', 'y', 0), P('g_love_rose', 0, 2.5, 1), P('g_rug_sun', 1, 2.5), P('g_hairpin_oak', 2, 3), P('g_tv_crt', 3, 0), P('g_lamp_paper', 0, 4),
    P('g_dine2_basic', 6.5, 3), P('g_dine_teal', 6.5, 2.5), P('g_dine_teal', 7, 2.5), P('g_plant_fern', 8.5, 2.5), P('g_o_bistro', 1, 5.5), P('g_plant_olive', 3, 5.5)],
  inkwell_walkup: [P('g_bed_pallet_d', 0, 0), PW('g_w_tapestry', 'x', 1), P('g_futons_navy', 3.5, 3), P('g_rug_patch', 3.5, 4), P('g_coffee_pine', 3.5, 5), P('g_books_low', 6.5, 0), P('g_drafting', 8.5, 0), P('g_stool3_pine', 8.5, 1),
    P('g_h_easel_studio', 7, 3.5), P('g_lamp_studio', 6, 3.5), P('g_guitar_teal', 9.5, 2), P('g_plant_rubber', 9.5, 5), P('g_bistro_marble', 4.5, 1.5), P('g_stool3_pine', 5.5, 2)],
  netloft_3: [P('g_chester_oxblood', 0, 4.5, 1), P('g_rug_kilim', 1, 4.5), P('g_trunk_table', 2, 4.5, 1), P('g_wing_forest', 3, 6), P('g_lamp_arc', 0, 4), P('g_books_wave', 0, 6.5, 1), P('g_au_record', 8, 0), P('g_h_surf', 9, 0),
    P('g_farm_table', 5, 4), P('g_windsor_black', 5, 3.5), P('g_windsor_black', 7.5, 3.5), P('g_bench_oak', 5.5, 5), P('g_plant_palm', 3.5, 0), PW('g_w_worldmap', 'x', 2),
    P('g_bed_sleigh_d', 0, 0, 0, 'up'), P('g_nightst_oak', 1.5, 0, 0, 'up'), P('g_tl_banker', 1.5, 0, 0, 'up'), P('g_rug_shag', .5, 2, 0, 'up'), P('g_dresser_long', 2.5, 0, 0, 'up'), P('g_accent_teal', 4, 3, 0, 'up'), P('g_plant_fern', 6.5, 0, 0, 'up'), PW('g_w_sunmirror', 'x', 1, 'up')],
  meridian_1407: [P('g_mid3_teal', 5, 0), P('g_glass_coffee', 5.5, 2), P('g_rug_terrazzo', 5.5, 2), P('g_egg_orange', 8.5, 1.5), P('g_lamp_arc', 8, 0), P('g_plant_bird', 9.5, 0), P('g_tv_medium_game', 0, 3.5, 1), PW('g_clock_gold', 'x', 4),
    P('g_bistro_marble', 6, 4.5), P('g_windsor_black', 6, 4), P('g_windsor_black', 6.5, 4),
    P('g_bed_uphol_d', 4.5, 0, 0, 'bed'), P('g_night_lamp', 4, 0, 0, 'bed'), P('g_nightst_oak', 6, 0, 0, 'bed'), P('g_rug_shag', 4, 2, 0, 'bed'), P('g_vanity_white', 2, 0, 0, 'bed'), P('g_accent_teal', 2, 3.5, 0, 'bed'), PW('g_w_archmirror', 'x', .5, 'bed'), P('g_plant_rubber', 6.5, 4, 0, 'bed')],
  wren_cottage: [P('g_love_rose', 0, 2.5, 1), P('g_rug_kilim', 1, 2.5), P('g_coffee_pine', 2, 2.5, 1), P('g_rocker_oak', 5, 1), P('g_dine2_basic', 3.5, 3.5), P('g_dine_teal', 3.5, 3), P('g_dine_teal', 4, 3), P('g_plant_fern', 7.5, 1), P('g_lamp_drum', 0, 4),
    PW('g_w_roundmirror', 'y', 6.5), P('g_o_birdbath', 5, 6.5),
    P('g_bed_rattan_d', 3, 0, 0, 'bed'), P('g_nightst_oak', 2.5, 0, 0, 'bed'), P('g_tl_classic', 2.5, 0, 0, 'bed'), P('g_rug_jute', 2, 2, 0, 'bed'), P('g_plant_fern', 4.5, 3.5, 0, 'bed'), PW('g_w_botanical', 'x', 1, 'bed')],
  rosebank_bungalow: [P('g_mid_mustard', 4.5, 0), P('g_coffee_pine', 5, 2), P('g_rug_trellis', 4.5, 1.5), P('g_lamp_tripod', 6.5, 0), P('g_arm_mustard', 7, 0), P('g_dine4_pine', 2, 3.5), P('g_dine_teal', 2, 3), P('g_dine_teal', 3, 3), P('g_plant_rubber', 9.5, 5),
    P('g_o_swing', 1, 6), P('g_o_adirondack', 8, 6), P('g_plant_planter_grass', 7, 6), PW('g_w_botanical', 'x', 1.5),
    P('g_bed_sleigh_d', 2.5, 0, 0, 'bed'), P('g_nightst_oak', 2, 0, 0, 'bed'), P('g_tl_classic', 2, 0, 0, 'bed'), P('g_nightst_oak', 4, 0, 0, 'bed'), P('g_rug_border', 2, 2, 0, 'bed'), P('g_vanity_white', .5, 0, 0, 'bed'), P('g_club_tan', 5.5, 3.5, 0, 'bed'), PW('g_w_tallart_portrait', 'x', 1, 'bed')],
  crooked_house: [P('g_round_cloth', 3, 4.5), P('g_windsor_black', 3.5, 4), P('g_windsor_black', 4, 4), P('g_kt_hutch', 0, 3.5, 1), P('g_plant_fern', 5.5, 2), PW('g_w_plates', 'x', 5.5), PW('g_w_cuckoo', 'y', 4), P('g_coatrack', 5.5, 1.5),
    P('g_chester_oxblood', .5, 0, 0, 'up'), P('g_rug_border', 1, 1.5, 0, 'up'), P('g_trunk_table', 1, 2, 0, 'up'), P('g_wing_forest', 2, 3.5, 0, 'up'), P('g_books_tall', 3.5, 0, 0, 'up'), P('g_lamp_lantern', 5.5, 2, 0, 'up'), P('g_gm_chess', 4, 4, 0, 'up'), PW('g_w_pendulum', 'x', .5, 'up'),
    P('g_bed_canopy_d', 0, 0, 0, 'attic'), P('g_nightst_oak', 1.5, 0, 0, 'attic'), P('g_tl_tiffany', 1.5, 0, 0, 'attic'), P('g_chest_pine', 0, 2, 0, 'attic'), P('g_rug_mandala', 2, 2, 0, 'attic'), P('g_armoire', 2.5, 0, 0, 'attic'), P('g_plant_fern', 5.5, 4, 0, 'attic')],
  bluebird_house: [P('g_mid3_teal', 0, 3.5, 1), P('g_glass_coffee', 2, 4.5, 1), P('g_rug_stripes', 1, 4), P('g_tv_medium_game', 4.5, 0), P('g_wing_forest', 3, 3), P('g_dine4_pine', 5.5, 3.5), P('g_dine_teal', 6, 3), P('g_dine_teal', 7, 3), P('g_plant_palm', 8.5, 0), P('g_lamp_drum', 0, 3),
    PW('g_w_gallery', 'x', 3.5), PW('g_clock_gold', 'y', 7),
    P('g_bed_uphol_d', 3, 0, 0, 'up'), P('g_nightst_oak', 2.5, 0, 0, 'up'), P('g_tl_classic', 2.5, 0, 0, 'up'), P('g_nightst_oak', 4.5, 0, 0, 'up'), P('g_tl_classic', 4.5, 0, 0, 'up'), P('g_rug_shag', 3, 2, 0, 'up'), P('g_writing_oak', 5.5, 0, 0, 'up'), P('g_office_basic', 6, .5, 0, 'up'),
    P('g_books_low', .5, 0, 0, 'up'), P('g_plant_fern', 7.5, 0, 0, 'up'), PW('g_w_botanical', 'x', 2, 'up')],
  thistle_house: [P('g_chester_oxblood', 0, 3.5, 1), P('g_club_tan', 6, 1.5), P('g_club_tan', 8.5, 1.5), P('g_trunk_table', 7, 2), P('g_rug_persian_big', 6.5, 1), P('g_trestle_oak', 2, 4), P('g_windsor_black', 2, 3.5), P('g_windsor_black', 3, 3.5),
    P('g_lamp_globes', 0, 3), P('g_plant_olive', 9.5, 4), P('g_o_swing', 1, 6), P('g_o_adirondack', 9.5, 6), P('g_plant_planter_grass', 7, 6), PW('g_clock_gold', 'y', 7),
    P('g_bed_sleigh_d', 1, 0, 0, 'up'), P('g_nightst_oak', .5, 0, 0, 'up'), P('g_tl_banker', .5, 0, 0, 'up'), P('g_nightst_oak', 2.5, 0, 0, 'up'), P('g_rug_kilim', 1, 2, 0, 'up'), P('g_vanity_white', 4.5, 0, 0, 'up'),
    P('g_secretary', 7, 0, 0, 'up'), P('g_office_basic', 7, .5, 0, 'up'), P('g_books_tall', 8, 0, 0, 'up'), P('g_d_globe', 6.5, 2, 0, 'up'), P('g_rocker_oak', 7, 3.5, 0, 'up'), PW('g_w_tallart_portrait', 'x', 2.5, 'up')],
  larkspur_house: [P('g_mid3_teal', 5, 0), P('g_accent_teal', 8.5, 0), P('g_lamp_arc', 10, 0), P('g_marble_coffee', 6, 2), P('g_rug_trellis', 5.5, 1.5), P('g_tv_medium_game', 0, 3.5, 1), P('g_pedestal_walnut', 5, 4), P('g_windsor_black', 5, 3.5), P('g_windsor_black', 6, 3.5),
    P('g_plant_bird', 10.5, 5), PW('g_clock_gold', 'y', 7.5),
    P('g_bed_canopy_d', 2.5, 0, 0, 'up'), P('g_nightst_oak', 2, 0, 0, 'up'), P('g_tl_tiffany', 2, 0, 0, 'up'), P('g_nightst_oak', 4, 0, 0, 'up'), P('g_rug_border', 2.5, 2, 0, 'up'), P('g_chaise_plum', 4.5, 3.5, 0, 'up'), P('g_vanity_white', 0, 2.5, 1, 'up'), P('g_plant_palm', 6.5, 0, 0, 'up'),
    P('g_bed_platform_s', 0, 0, 0, 'up2'), P('g_writing_oak', 2, 0, 0, 'up2'), P('g_office_basic', 2.5, .5, 0, 'up2'), P('g_pc_retro', 3.5, 0, 0, 'up2'), P('g_books_tall', 5, 0, 0, 'up2'), P('g_rug_checker', 1.5, 1.5, 0, 'up2'), P('g_bean_mustard', 4.5, 2.5, 0, 'up2')],
  stepdown_house: [P('g_corner_grey', 5.5, 0), P('g_glass_coffee', 6, 2.5), P('g_rug_terrazzo', 6, 2.5), P('g_tv_medium_game', 0, 3.5, 1), P('g_dine4_pine', 7, 4.5), P('g_dine_teal', 7.5, 4), P('g_dine_teal', 8, 4), P('g_plant_rubber', 9.5, 3), P('g_lamp_globes', 9, 0), PW('g_w_triptych', 'x', 1),
    P('g_bed_uphol_d', 1.5, 0, 0, 'up'), P('g_night_lamp', 1, 0, 0, 'up'), P('g_night_lamp', 3, 0, 0, 'up'), P('g_rug_shag', 1.5, 2, 0, 'up'), P('g_dresser_long', 6, 0, 0, 'up'), P('g_accent_teal', 5, 3, 0, 'up'), PW('g_w_roundmirror', 'x', 1, 'up'), P('g_plant_fern', 7.5, 0, 0, 'up'),
    P('g_box3_grey', 3, 0, 0, 'den'), P('g_coffee_pine', 3.5, 2, 0, 'den'), P('g_rug_checker', 3, 1.5, 0, 'den'), P('g_tv_crt', 0, 2, 1, 'den'), P('g_gm_foosball', 3, 3.5, 0, 'den'), P('g_h_citybike', 7.5, 2, 0, 'den'), P('g_f_bag', 9, 4, 0, 'den'), P('g_f_spinbike', 7, 4, 0, 'den')],
  orchard_end: [P('g_mid3_teal', 0, 5.5, 1), P('g_liveedge', 2, 6.5, 1), P('g_rug_persian_big', 1, 6), P('g_wing_forest', 10, 1), P('g_club_tan', 7, 1), P('g_tv_medium_game', 5.5, 0), P('g_farm_table', 5.5, 3.5), P('g_windsor_black', 5.5, 3), P('g_windsor_black', 8, 3), P('g_bench_oak', 6.5, 4.5),
    P('g_plant_palm', 11.5, 0), P('g_lamp_tripod', 0, 5), P('g_o_picnic', 9.5, 6.5), P('g_o_bbq', 12, 7.5), PW('g_w_gallery', 'x', 8),
    P('g_bed_canopy_d', 3, 0, 0, 'up'), P('g_nightst_oak', 2.5, 0, 0, 'up'), P('g_tl_tiffany', 2.5, 0, 0, 'up'), P('g_nightst_oak', 4.5, 0, 0, 'up'), P('g_rug_mandala', 3, 2.5, 0, 'up'), P('g_vanity_white', 1, 0, 0, 'up'), P('g_rocker_oak', 6, 4, 0, 'up'), PW('g_w_sunmirror', 'x', 3, 'up'),
    P('g_bunk_pine', 0, 0, 0, 'up2'), P('g_rug_checker', 2, 2, 0, 'up2'), P('g_gm_boardgames', 1.5, 0, 0, 'up2'), P('g_books_low', 4.5, 0, 0, 'up2'), P('g_bean_mustard', 5, 2.5, 0, 'up2'), P('g_bean_mustard', 6.5, 1.5, 0, 'up2'), P('g_tv_crt', 6.5, 0, 0, 'up2')],
  gulls_rest: [P('g_mid3_teal', 4.5, 0), P('g_egg_orange', 8, 0), P('g_lamp_arc', 9, 0), P('g_marble_coffee', 5.5, 2), P('g_rug_terrazzo', 5, 1.5), P('g_pedestal_walnut', 6, 3.5), P('g_windsor_black', 6, 3), P('g_windsor_black', 7, 3), P('g_console_walnut', 0, 3.5, 1), P('g_tl_mush', 0, 4, 0),
    P('g_o_adirondack', 1, 6), P('g_o_adirondack', 2.5, 6), P('g_o_firepit', 3.5, 6), P('g_o_bistro', 8, 6), P('g_h_telescope', 10.5, 6.5), P('g_plant_olive', 11.5, 6.5),
    P('g_king_royal', 3.5, 0, 0, 'low'), P('g_night_lamp', 3, 0, 0, 'low'), P('g_night_lamp', 5.5, 0, 0, 'low'), P('g_rug_border', 3.5, 2.5, 0, 'low'), P('g_chaise_plum', 6, 3.5, 0, 'low'), P('g_dresser_long', 6.5, 0, 0, 'low'), P('g_plant_bird', 8.5, 0, 0, 'low'), PW('g_w_archmirror', 'x', 1.5, 'low')],
};

/* ------------------------------------------------------------------ rooms */
const NEW = Object.keys(MORE_SHELLS);
for (const id of NEW) {
  defineRoom({ id: 'home:' + id, name: id, home: true, build: () => G.housing.roomDef(id, 'main') });
  defineRoom({ id: 'home:' + id + ':bath', name: id + ' (bathroom)', home: true, build: () => G.housing.roomDef(id, 'bath') });
}
for (const id in SHELLS) for (const r in SHELLS[id].rooms || {}) defineRoom({ id: 'home:' + id + ':' + r, name: id + ' ' + r, home: true, build: () => G.housing.roomDef(id, r) });
/* stairs, room doors, hatches: a link piece takes you to another room of the same home */
registerFixture('homelink', (fx, scene) => { const i = fx.item; if (!i || !i.to || !i.home || !G.housing) return null;
  return { label: i.label || 'Door', h: 1.5, hit: 6, homelink: true,   /* QA7: was 16: upstairs, "Stairs down" caught the taps meant for the attic ladder (see core/game.js pick patch in docs/reports/qa_round7.md) */ navTo: 'int:home:' + i.home + (i.to === 'main' ? '' : ':' + i.to), spot: i.spot ? scene.toWorld(i.spot[0], i.spot[1]) : undefined, use: () => G.housing.goRoom(i.home, i.to, i.from) }; });
