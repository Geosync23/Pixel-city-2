// Venue interiors, leisure: gym, library, bar, cinema (+ cinema:hall). Format + metadata: see venues_lib.js.
import { GT } from '../../engine/world.js';
import { room, V, WY, WX, S } from './venues_lib.js';

// ---------------------------------------------------------------- Iron Maple Gym (cardio / weights / yoga corner) 16 x 12
room({ id: 'gym', name: 'Iron Maple Gym', w: 16, d: 12, music: 'gym', floor: GT.f_concrete,
  floors: [{ x0: 10.5, y0: 1, x1: 16, y1: 7.5, floor: GT.f_mat }, { x0: 0, y0: 7, x1: 6, y1: 12, floor: GT.f_wood }],
  wall: { color: '#d8d4c8', trim: '#c0392b', rail: .5, h: 3 },
  items: [V('gym.mat', 1, 8, { c: '#2f8f8a' }, { n: 'pose' }), V('gym.mat', 1, 9.5, { c: '#e87aa0' }), V('gym.mat', 3.5, 8, { c: '#7a55b0' }), V('gym.mat', 3.5, 9.5, { c: '#f2c230' }, { n: 'pose' }),
    WY('gym.mirror', .5, { w: 3 }), WY('gym.mirror', 4, { w: 3 }), WY('generic.clock', 7.3), WY('generic.door', 13, { kind: 'staff' }),
    WX('generic.window', 1.5), WX('generic.window', 4), WX('gym.mirror', 8, { w: 3 }),
    V('gym.towels', 8, 0), V('generic.cooler', 9.5, 0), V('generic.lockers', 10.5, 0, { w: 2 }), V('gym.cable', 14.5, 0),
    V('gym.treadmill', 1, 1.5, null, { n: 'pose' }), V('gym.treadmill', 1, 3.5, { c: '#c0392b' }, { n: 'pose' }),
    V('gym.bike', 4.5, 1.5, null, { n: 'pose' }), V('gym.bike', 4.5, 3, { c: '#f2c230' }), V('gym.rower', 7, 1.5), V('gym.rower', 7, 3, null, { n: 'pose' }),
    V('gym.bench', 11, 2, null, { n: 'pose' }), V('gym.squatrack', 14, 2, null, { n: 'pose' }), V('gym.dumbbells', 11, 5, null, { n: 'pose' }), V('gym.kettlebells', 13.5, 5), V('gym.bag', 15, 5, null, { n: 'pose' }),
    V('gym.whiteboard', 6.5, 6, null, { n: 'use', nk: 'staff' }), V('gym.balls', 0, 11), V('home.plant.fiddle', 5.5, 11.5),
    V('gym.reception', 9.5, 9.5, null, { n: 'staff use' }), V('generic.vending', 13, 9), V('generic.bench', 13, 10.5, null, { n: 'seats', ns: 1 }), V('generic.plant', 15.5, 11.5),
  ],
  npc: [S(8.5, 1.2, 3), S(2.5, 7.4, 1, 'stand', 'staff')],
  exits: [{ x: 8, y: 11.5 }] });

// ---------------------------------------------------------------- Maple Bay Public Library (grand; reading tables, story corner) 14 x 11
room({ id: 'library', name: 'Maple Bay Public Library', w: 14, d: 11, music: 'quiet', floor: GT.f_wood, floors: [{ x0: 0, y0: 6.5, x1: 4.5, y1: 11, floor: GT.f_carpet }],
  wall: { color: '#d8c8a8', trim: '#5a4030', rail: 1, h: 3.3 },
  items: [V('generic.rug', 7.5, 8, { w: 2, d: 2.5, c: '#3f6a5a', c2: '#e8c878' }),
    WX('generic.window', 6.6, { w: 1.5 }), WX('generic.picture', 8.6, { kind: 0 }), WY('generic.clock', 12.9),
    V('books.shelf', .5, 0, null, { n: 'use' }), V('books.shelf', 2.5, 0, { seed: 4, face: true }), V('books.shelf', 4.5, 0, { seed: 7, c: '#5a3a28' }, { n: 'use' }), V('books.shelf', 6.5, 0, { seed: 12 }),
    V('books.shelf', 8.5, 0, { seed: 18, face: true }), V('books.shelf', 10.5, 0, { seed: 23, c: '#5a3a28' }, { n: 'use' }), V('books.ladder', 12.5, 0),
    V('books.shelf', 0, 2, { seed: 30 }, { flip: true }), V('books.shelf', 0, 4, { seed: 33, face: true }, { flip: true }),
    V('library.table', 2.5, 2.5, null, { n: 'seats', ns: 2 }), V('library.table', 6, 2.5, { c: '#5a3a28', cc: '#3f6a5a' }, { n: 'seats', ns: 2 }),
    V('library.computer', 9.5, 2.5, null, { n: 'seats' }), V('library.computer', 11, 2.5, { scr: '#2a8a6a', cc: '#c0563a' }), V('library.computer', 12.5, 2.5),
    V('books.shelf', 9.5, 5, { seed: 41 }, { n: 'use' }), V('books.shelf', 11.5, 5, { seed: 44, c: '#5a3a28' }),
    V('books.lowshelf', 3, 5.5, { seed: 5 }), V('books.lowshelf', 5, 5.5, { seed: 6, plant: true }),
    V('library.storycorner', .5, 7.5, null, { n: 'seats staff', ns: 2 }),
    V('library.desk', 5, 7.5, null, { n: 'staff use' }), V('library.cart', 8.5, 7), V('library.catalog', 10.5, 7.5), V('library.globe', 13, 7.5),
    V('cafe.armchair', 12.5, 8.5, { c: '#4a7a6a' }, { n: 'seats' }), V('library.returns', 11, 9.5), V('generic.plant', 13.5, 10.5), V('generic.floorlamp', 12.5, 8),   /* QA r15 B1: was (13.5, 9.5), camera-side of the armchair: its shade covered the sitter's face; now behind the chair, by the globe */
  ],
  npc: [S(8, 1.2, 3)],
  exits: [{ x: 8.5, y: 10.5 }] });

// ---------------------------------------------------------------- The Blue Heron (moody basement music club) 14 x 11
room({ id: 'bar', name: 'The Blue Heron', w: 14, d: 11, music: 'bar', floor: GT.f_darkwood, floors: [{ x0: 8.5, y0: 4, x1: 12.5, y1: 8, floor: GT.f_dance }],
  wall: { color: '#3a2a48', pattern: 'brick', trim: '#2a1f38', rail: 1, h: 3 },
  items: [V('bar.dancetile', 8.5, 4), V('bar.dancetile', 10.5, 4, { frame: 1 }), V('bar.dancetile', 8.5, 6, { frame: 1 }), V('bar.dancetile', 10.5, 6),
    WY('bar.neon', 6.8), WY('bar.neon', 9.2, { kind: 'text', text: 'LIVE MUSIC', c: '#f6e04a', c2: '#b07af8' }, 1.1),
    WX('bar.dartboard', 3), WX('bar.neon', 5.5, { kind: 'text', text: 'BLUE HERON', c: '#4ad8f0', c2: '#ff4a8a' }, 1.1), WX('generic.exit', 9.6),
    V('bar.backbar', .5, 0), V('bar.backbar', 3.5, 0, { seed: 5 }),
    V('bar.counter', .5, 1.5, null, { n: 'staff use' }), V('bar.counter', 3.5, 1.5, null, { n: 'staff' }), V('bar.glasswasher', 6.5, 1.5),
    V('bar.stool', 1, 2.5, null, { n: 'seats' }), V('bar.stool', 3, 2.5, null, { n: 'seats' }), V('bar.stool', 4, 2.5), V('bar.stool', 6, 2.5),
    V('bar.stage', 8.5, .5, null, { n: 'pose', nk: 'staff' }), V('bar.speaker', 13, .5), V('bar.speaker', 13, 2), V('bar.dj', 12, 3),
    V('bar.booth', 0, 4.5, null, { n: 'seats', ns: 2 }), V('bar.booth', 0, 7, null, { n: 'seats', ns: 2 }),
    V('bar.hightable', 4, 4.5, null, { n: 'seats', ns: 1 }), V('bar.hightable', 4, 6.5, null, { n: 'seats', ns: 1 }), V('bar.pool', 3, 8.5),
    V('bar.discoball', 10.25, 5.75), V('diner.jukebox', 12.5, 9.5), V('cinema.arcade', 13, 7),
  ],
  npc: [S(9.5, 5, 0, 'dance'), S(11.3, 5.5, 2, 'dance'), S(10.2, 7, 3, 'dance'), S(9.2, 3.2, 3)],
  exits: [{ x: 7.5, y: 10.5 }] });

// ---------------------------------------------------------------- The Orpheum: lobby 11 x 8 + screening hall (cinema:hall) 10 x 10
room({ id: 'cinema', name: 'The Orpheum', w: 11, d: 8, music: 'quiet', floor: GT.f_carpet, floors: [{ x0: 0, y0: 0, x1: 5, y1: 2, floor: GT.f_check }],
  wall: { color: '#3a2a40', trim: '#d8a848', rail: 1, h: 3 },
  items: [V('generic.rug', 6, 1.5, { w: 2, d: 2, c: '#8a2a3a', c2: '#d8a848' }),
    WY('cinema.poster', .5), WY('cinema.poster', 1.7, { frame: 1 }), WY('cinema.poster', 2.9, { frame: 2 }), WY('cinema.poster', 4.1, { frame: 3 }), WY('cinema.curtain', 6, { w: 2 }),
    WX('cinema.poster', 3, { frame: 2 }), WX('cinema.poster', 4.2, { frame: 1 }), WX('generic.exit', 6.5),
    V('cinema.arcade', 9, 0, null, { n: 'use' }), V('cinema.arcade', 10, 0, { c: '#a8242a', a: '#4ad8f0', name: 'RUN' }),
    V('cinema.concession', .5, 2, null, { n: 'staff use' }), V('cinema.popcorn', 4, 2),
    V('cinema.ticket', 8, 3.5, null, { n: 'staff use' }), V('generic.queuepost', 8, 6, { n: 2 }),
    V('cinema.standee', .5, 4.5), V('generic.sofa', .5, 6.5, { c: '#8a2a3a' }, { n: 'seats' }), V('generic.plant', 10.5, 7.5),
  ],
  npc: [S(2, 3.2, 3), S(7, 2.4, 3), S(1.6, 5.6, 2), S(8.5, 5.6, 3)],
  exits: [{ x: 5, y: 7.5 }, { x: 7, y: .7, label: 'Screen 1', use: G => G.go('int:cinema:hall') }] });

room({ id: 'cinema:hall', venue: 'cinema', name: 'The Orpheum — Screen 1', w: 10, d: 10, music: 'quiet', floor: GT.f_carpet,
  wall: { color: '#2a2030', trim: '#8a2a3a', h: 3.6 },
  items: [WY('cinema.screen', 2), WY('cinema.curtain', .7), WY('cinema.curtain', 8.3), WX('generic.exit', 8.3),
    V('bar.speaker', .5, .5), V('bar.speaker', 9, .5),
    V('cinema.seats', 1.5, 3.5, { n: 6 }, { n: 'seats', ns: 2 }), V('cinema.seats', 5.5, 3.5, { n: 6 }, { n: 'seats', ns: 3 }),
    V('cinema.seats', 1.5, 5, { n: 6 }, { n: 'seats', ns: 4 }), V('cinema.seats', 5.5, 5, { n: 6 }, { n: 'seats', ns: 2 }),
    V('cinema.seats', 1.5, 6.5, { n: 6 }, { n: 'seats', ns: 1 }), V('cinema.seats', 5.5, 6.5, { n: 6 }, { n: 'seats', ns: 3 }),
    V('cinema.projector', 4.5, 8.5),
  ],
  exits: [{ x: 8, y: 9.5, label: 'Lobby', use: G => G.go('int:cinema') }] });
