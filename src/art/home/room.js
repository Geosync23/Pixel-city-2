// Composed test rooms for the gallery (not assets): check pieces together next to 1.4-unit people.
import { at, qy, qx, qz, lw, PAT, dk } from '../../engine/raster.js';
import { dummy } from './_lib.js';
import beds from './beds.js'; import kitchen from './kitchen.js'; import seating from './seating.js'; import tables from './tables.js'; import media from './media.js';
import hobby from './hobby.js'; import bath from './bath.js'; import storage from './storage.js'; import plants from './plants.js'; import wall from './wall.js'; import rugs from './rugs.js';

const ALL = new Map([beds, kitchen, seating, tables, media, hobby, bath, storage, plants, wall, rugs].flat().map(a => [a.id.replace('furn.home.', ''), a]));
const D = (id, p, x, y, z) => { const a = ALL.get(id); at(x, y, z == null ? (a.wall || a.ceiling ? a.mount : 0) : z, () => a.draw(p || {})); };
const shell = (W, Dp, wallc, floor) => { qz(0, W, 0, Dp, 0, floor); qy(0, W, 0, 0, 2.6, wallc); qx(0, 0, Dp, 0, 2.6, dk(wallc, .12)); qy(0, W, .001, 0, .12, '#f1eee6'); qx(.001, 0, Dp, 0, .12, '#d9d5cb'); lw([0, 0, 0], [0, 0, 2.6], dk(wallc, .3)); };
const studio = () => {
  shell(9.5, 6, '#e9d9c0', PAT.fboards('#c79a63', .5));
  D('wall.door.front', { tier: 1 }, .2, 0); D('wall.window', { tier: 1, c: '#c8574d' }, 7.75, 0, 1.1); D('wall.art', { tier: 1, art: 'sea', w: 1.5, h: 1 }, 5.3, 0, 1.45); D('wall.clock', { tier: 1 }, 1.5, 0); D('wall.fairylights', { len: 2 }, 7.5, 0, 2.15);
  D('rug', { tier: 2, w: 3, d: 2 }, 4.3, 1.3); D('rug', { pat: 'round', c: '#d98a9c', c2: '#eadfc8', w: 2, d: 2 }, .6, 2.2);
  D('kitchen.fridge', { tier: 1, c: '#9fd0c0' }, 1.5, 0); D('kitchen.stove', { tier: 1, on: true }, 2.5, 0); D('kitchen.sink', { tier: 1 }, 3.5, 0); D('kitchen.cabinet', { tier: 1, len: 1 }, 3.5, 0);
  D('bookshelf', { tier: 1, seed: 2 }, 4.6, 0); D('tv.medium', { tier: 1, on: true }, 5.3, .0 + 1.0 - 1.0); 
  D('plant.fiddle', { tier: 1 }, 6.9, .1); D('bed.double', { tier: 1, c: '#4f74b8' }, 7.7, 0); D('nightstand', { tier: 1 }, 7.1, .9 - .9 + .7);
  D('chair', { tier: 1 }, 1.35, 2.2); D('table.2', { tier: 1, set: true }, 1.1, 2.75); dummy(3.2, 1.6, 0); D('chair', { tier: 1, face: 3 }, 1.35, 3.8);
  D('coffeetable', { tier: 1 }, 5.05, 1.9); D('sofa.3', { tier: 1, c: '#3f8f8a', face: 3 }, 4.3, 3); D('lamp.floor', { tier: 1 }, 7.4, 3.2); dummy(8.3, 2.9, 0, { sh: '#7048e8' });
  D('boxes', { n: 3 }, 8.2, 4.4); D('cattree', { tier: 1, cat: true }, .2, 4.6); D('plant.monstera', { tier: 1 }, 3.4, 4.6);
};
const bathgym = () => {
  shell(8, 5, '#cfe3e0', PAT.ftile('#e9e4d8', '#d9d2c2', .5));
  D('wall.window', { tier: 0, w: 1 }, 4.3, 0, 1.2); D('bath.towelrack', { tier: 1 }, 5.6, 0); D('wall.mirror', { tier: 1, tall: true }, 6.9, 0, .3);
  D('bath.shower', { tier: 1 }, 0, 0); D('bath.toilet', { tier: 1 }, 1.3, 0); D('bath.sink', { tier: 1 }, 2.1, 0); D('bath.washer', { tier: 1 }, 3.2, 0);
  D('bath.mat', { tier: 1 }, 2.1, 1); dummy(1.6, 1.6, 0); D('dumbbells', { tier: 1 }, 5.6, 0 + .3); D('bath.bathtub', { tier: 2 }, 0, 2.6);
  D('yogamat', { tier: 1 }, 4.2, 1.6); D('treadmill', { tier: 1, on: true }, 6.6, 1.2); dummy(5.8, 3.4, 0, { sh: '#2f9e44' });
};
export default [];
export const galleryItems = [
  { id: 'furn.home.room.studio', vb: [0, 0, 0, 9.5, 6, 2.7], draw: studio },
  { id: 'furn.home.room.bathgym', vb: [0, 0, 0, 8, 5, 2.7], draw: bathgym },
];
