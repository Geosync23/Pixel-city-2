// Throwaway dev room for testing home fixtures (life-sim core). Open with ?scene=int:devhome. Not part of the game.
import { defineRoom } from '../interior.js';
import { GT } from '../../engine/world.js';
defineRoom({ id: 'devhome', name: 'Dev Home', home: true, w: 11, d: 8, floor: GT.f_wood, floors: [{ x0: 0, y0: 0, x1: 4, y1: 3, floor: GT.f_tile }], wall: { color: '#e9dcc0', pattern: 'plain', trim: '#7a4e2d' },
  items: [
    { id: 'furn.home.kitchen.fridge', x: 0, y: 0, p: { tier: 0 } }, { id: 'furn.home.kitchen.stove', x: 1, y: 0 }, { id: 'furn.home.kitchen.counter', x: 2, y: 0 }, { id: 'furn.home.kitchen.microwave', x: 3, y: 0 },
    { id: 'furn.home.bed.single', x: 9, y: 0 }, { id: 'furn.home.bath.shower', x: 5, y: 0 }, { id: 'furn.home.bookshelf', x: 6.5, y: 0 },
    { id: 'furn.home.tv.small', x: 0, y: 4, flip: true }, { id: 'furn.home.sofa.2', x: 3, y: 4, flip: true }, { id: 'furn.home.table.2', x: 5, y: 3 }, { id: 'furn.home.chair', x: 5.2, y: 4.2 },
    { id: 'furn.home.desk', x: 8, y: 5 }, { id: 'furn.home.dumbbells', x: 9.5, y: 3 }, { id: 'furn.home.easel', x: 7, y: 2.5 }, { id: 'furn.home.wardrobe', x: 8, y: 0 }, { id: 'furn.home.stereo', x: 0, y: 6 },
  ],
  exits: [{ x: 5.5, y: 7.5 }] });
