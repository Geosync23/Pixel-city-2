// A partner's flat (rooms `rel_flat:marlow`, `rel_flat:tasha`, `rel_flat:noor`, `rel_flat:tav`): ONE small template (7 x 6: a kitchen corner, a sofa, a
// table, a bed behind, one window), dressed per person with a few props (src/art/rel/flat.js). Four heart scenes are set inside a flat the city does not
// have (RELATIONSHIPS.md section 10, item 18): Marlow ill upstairs over the cafe (a blanket, plants, a window on the queue), Tasha's ninth floor (the crew
// photograph, a kettlebell), Noor's one kitchen chair and a music stand, Tav's cork tile with a race number and too many running shoes.
// sim/rel.js takes the player in when one of those scenes begins at the person's door (their `home.anchor`) and back out to that door afterwards; the
// room is also where "theirs" resolves for those four. Nobody lives in it between scenes: it is a stage, not a home system.
import { defineRoom } from '../interior.js';
import { GT } from '../../engine/world.js';
import { G } from '../../core/game.js';

const F = (a, x, y, o) => Object.assign({ id: 'furn.home.' + a, x, y }, o), WY = (a, at, o) => Object.assign({ id: 'furn.home.' + a, wall: 'y', at }, o), WX = (a, at, o) => Object.assign({ id: 'furn.home.' + a, wall: 'x', at }, o);
const R = (a, x, y, o) => Object.assign({ id: 'furn.rel.' + a, x, y }, o), RY = (a, at, o) => Object.assign({ id: 'furn.rel.' + a, wall: 'y', at }, o);
const T = t => ({ p: { tier: t } });
const BASE = () => [F('kitchen.fridge', 0, 0, T(1)), F('kitchen.counter', 1, 0, { p: { tier: 1, len: 1 } }), F('kitchen.stove', 2, 0, T(1)), F('rug', 2.4, 2.6, { p: { w: 2.6, d: 1.8, pat: 'plain', tier: 1 } }), F('lamp.floor', 6.2, .2)];
export const FLATS = {
  marlow: { name: "Marlow's flat, over Bean & Gone", wall: { color: '#e8dcc0', trim: '#6b4428', h: 3 }, floor: GT.f_wood,
    items: () => BASE().concat([RY('queuewindow', 3.6), F('sofa.2', 2.6, 3.2, { p: { tier: 1, c: '#84a98c' } }), R('blanket', 3, 3.3), F('coffeetable', 3, 4.5), F('bed.double', 4.6, .3, T(1)), F('plant.monstera', .3, 2.2), F('plant.snake', .3, 3.4), F('plant.cactus', .3, 4.6), F('plant.monstera', 6.2, 4.4), F('stereo', 6.1, 2.6, { flip: true, p: { tier: 1 } }), F('kitchen.coffee', 1, 0)]) },
  tasha: { name: "Tasha's flat, Meridian Tower", wall: { color: '#dfe6ea', trim: '#3a4a5a', h: 3 }, floor: GT.f_wood,
    items: () => BASE().concat([WY('wall.window', 3.4, { p: { w: 1.8, h: 1.5, tier: 2 } }), RY('crewphoto', 5.4), F('sofa.2', 2.6, 3.2, { p: { tier: 2, c: '#3d5a80' } }), F('coffeetable', 3, 4.5), F('bed.double', 4.6, .3, T(2)), F('dresser', .2, 2.6, { flip: true, p: { tier: 2 } }), F('stool', .5, 4.4), F('plant.snake', 6.3, 4.6)]) },
  noor: { name: "Noor's flat, Juniper Court", wall: { color: '#f2e2d0', trim: '#7a4a3a', h: 3 }, floor: GT.f_wood,
    items: () => BASE().concat([WY('wall.window', 3.6, { p: { w: 1.4, h: 1.3, tier: 1 } }), F('chair', 3.2, 3.2, { p: { face: 3 } }), R('musicstand', 3.3, 2.3), R('cello', 4.3, 2.6), F('bed.futon', 5, .2), F('bookshelf', 0, 2.4, { flip: true, p: { tier: 1 } }), F('plant.snake', .3, 4.6), WY('wall.poster', 5.6, T(1))]) },
  tav: { name: "Tav's flat, Meridian Tower 611", wall: { color: '#e6ecf2', trim: '#2f4858', h: 3 }, floor: GT.f_wood,
    items: () => BASE().concat([WY('wall.window', 3.4, { p: { w: 1.8, h: 1.5, tier: 2 } }), RY('corktile', 5.6), F('sofa.2', 2.6, 3.2, { p: { tier: 1, c: '#2a9d8f' } }), F('coffeetable', 3, 4.5), F('bed.double', 4.6, .3, T(1)), F('shoerack', .2, 3.4, { flip: true }), F('shoerack', .2, 4.4, { flip: true }), F('plant.cactus', 6.3, 4.6)]) },
};
export const flatRoom = id => (FLATS[id] ? 'rel_flat:' + id : null);
for (const id in FLATS) {
  const f = FLATS[id];
  defineRoom({ id: 'rel_flat:' + id, name: f.name, owner: id, story: true, noCrowd: true, w: 7, d: 6, floor: f.floor, wall: f.wall, items: f.items(),
    exits: [{ x: 3.5, y: 5.4, label: 'Leave', use: () => { const b = G.state.rel && G.state.rel.flatBack; return G.go('city', b ? { x: b.x, y: b.y } : {}); } }], spawn: { x: 3.5, y: 4.6, dir: 3 } });
}
