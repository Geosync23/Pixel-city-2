// TEST
import { GT } from '../../engine/world.js';
import { V, WY, WX, S } from './venues_lib.js';
import { registerUnique, registerInfo } from './unique_rooms.js';
const P = (a, x, y, p, o) => V('pshop.' + a, x, y, p, o), PY = (a, at, p, m) => WY('pshop.' + a, at, p, m), PX = (a, at, p, m) => WX('pshop.' + a, at, p, m);
registerUnique(pl => pl.name !== 'Otis & Sons Barbershop' ? null : ({ name: pl.name, w: 10, d: 7, music: 'shop', floor: GT.f_check, wall: { color: '#e8dcc0', trim: '#7a2a2a', rail: 1.1 },
  items: [WX('generic.window', 4.5), WY('generic.clock', 9.2), WY('generic.clock', 8.4, null, 0), WX('home.wall.photos', 2), PX('sign', .5, { text: 'OTIS & SONS' }), WY('bar.neon', 6, { kind: 'text', text: 'OPEN' }), WY('bar.neon', 4.5, { kind: 'text', text: 'OPEN' }, 0), WY('generic.picture', 3), WY('generic.picture', 1.5, null, 0), PY('flash', 0, null), WX('generic.window', 0.2, null, 0),
    P('barber.armchair', 3, 3, null, { n: 'seats' }), P('barber.pole', 8, 5)], exits: [{ x: 5, y: 6.5 }] }));
