// Nana Bea's attic (room `home:grandma:attic`, 8 x 6): reached by the ladder on her landing (sim/_chapters_world.js adds it to `home:grandma`).
// A low boarded room under the rafters: a trunk, three boxes (KETTLE · FRAGILE, GIRLS, and one nobody labelled), a dust-sheeted armchair with something
// down its side, a round window. Chapter 6 opens the boxes (the `play` adapter `activity:unpack_box` finds them by label); afterwards the room stays
// visitable and the boxes stand open.
// scene.attic = { open(which: 'kettle' | 'girls' | 'tin') }   marks a box opened (state G.state.chapters.flags['attic_<which>']).
import { defineRoom } from '../interior.js';
import { GT } from '../../engine/world.js';
import { G } from '../../core/game.js';
import { asset } from '../../art/registry.js';
import { toast } from '../../ui/kit.js';

const FL = () => (G.state.chapters && G.state.chapters.flags) || {};
const NOTE = {
  kettle: 'Tea towels, a cake stand, forty-one saucers and the copper teapot, wrapped in a 2016 newspaper. LEAVE the teapot.',
  girls: 'School reports, swimming badges, a 1979 report: "Eleanor would do well to finish what she starts."',
  tin: 'A biscuit tin. In it, a school exercise book, soft at the corners.',
};
defineRoom({
  id: 'home:grandma:attic', name: "Nana Bea's attic", owner: 'nana', story: true, noCrowd: true, w: 8, d: 6, floor: GT.f_darkwood, zoom: 1,
  wall: { color: '#b08a62', pattern: 'planks', trim: '#5e4028', h: 2.2 },
  items: [
    { id: 'furn.story.rafters', wall: 'y', at: 0, p: { w: 8 } },
    { id: 'furn.story.roundwindow', wall: 'y', at: 3.4 },
    { id: 'furn.home.rug', x: 2.6, y: 2.2, p: { w: 2.6, d: 2, pat: 'persian', tier: 0 } },
    { id: 'furn.story.trunk', x: .3, y: .3 },
    { id: 'furn.story.atticbox', x: 2.4, y: .4, p: { t: 'KETTLE' }, tags: ['box_kettle'] },
    { id: 'furn.story.atticbox', x: 5.1, y: .5, p: { t: 'GIRLS', c: '#c2a878' }, tags: ['box_girls'] },
    { id: 'furn.story.atticbox', x: .4, y: 3.9, p: { t: '', c: '#b89a6a' } },
    { id: 'furn.story.sheetchair', x: 6.2, y: 2.3, tags: ['box_tin'] },
    { id: 'furn.home.lamp.floor', x: 7.3, y: .3 },
    { id: 'furn.home.boxes', x: 6.6, y: 4.6, p: { seed: 5 } },
    { id: 'furn.story.hatch', x: 3.4, y: 4.7, solid: false },
  ],
  exits: [{ x: 4, y: 5.2, label: 'Down the ladder', use: () => G.go('int:home:grandma', { x: 10.2, y: 5.6 }) }],
  spawn: { x: 4, y: 4.2, dir: 3 },
  setup(sc) {
    const mk = (tag, label, which) => {
      const fx = sc.byTag(tag)[0]; if (!fx) return;
      sc.interactables.push({ x: fx.x, y: fx.y, h: 1, hit: 16, range: 1.7, spot: fx.use || undefined, which, get label() { return FL()['attic_' + which] ? label + ' (opened)' : label; },
        use: () => toast(FL()['attic_' + which] ? NOTE[which] : 'It has been shut a long time. Better to open it with Nana\'s say-so.', 'info', 4600) });
    };
    mk('box_kettle', 'The box marked KETTLE · FRAGILE', 'kettle'); mk('box_girls', 'The box marked GIRLS', 'girls'); mk('box_tin', 'The armchair under the dust sheet', 'tin');
    sc.attic = { open(which) { FL()['attic_' + which] = 1; } };
  },
});
export const ATTIC_ROOM = 'home:grandma:attic';
