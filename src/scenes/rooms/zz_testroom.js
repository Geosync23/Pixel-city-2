// Engine smoke-test room (not part of the game). Open with ?scene=int:testroom
import { defineRoom } from '../interior.js';
import { GT } from '../../engine/world.js';
defineRoom({ id: 'testroom', name: 'Test', w: 9, d: 7, floor: GT.f_wood, floors: [{ x0: 0, y0: 0, x1: 9, y1: 2, floor: GT.f_check }], wall: { color: '#cfe0d8', pattern: 'plain', trim: '#7a4e2d', rail: 1.1 },
  items: [{ id: 'furn.cafe.bar', x: 1, y: 1 }, { id: 'furn.cafe.till', x: 4, y: 1 }, { id: 'furn.cafe.pastrycase', x: 6, y: 1 }, { id: 'furn.cafe.menu', wall: 'y', at: 2, mount: .3 }, { id: 'furn.cafe.menu', wall: 'x', at: 3, mount: .3 },
    { id: 'furn.cafe.tableset', x: 1.5, y: 4 }, { id: 'furn.cafe.tableset', x: 5, y: 4.5, flip: true }, { id: 'furn.cafe.armchair', x: 7.5, y: 3 }, { id: 'furn.bakery.shelves', x: 0, y: 2.5, flip: true }],
  exits: [{ x: 4.5, y: 6.5 }] });
