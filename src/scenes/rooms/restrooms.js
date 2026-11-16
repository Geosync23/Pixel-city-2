// Real venue restrooms (owner msgs 151 + 192, BIBLE Direction update 28): the rooms behind a venue's "Restroom" door. Batch 1 (SkyDeck, diner, City Hall) + batch 2 (eight more) + batch 3 (twelve layouts, sixteen venues).
// Each entry: venue (the room whose Restroom door leads here), id ('<venue>:wc', so navgoals.rootOf() files it under the venue), the room def
// (defineRoom format, see interior.js; exits are added by src/sim/restrooms.js), and where the venue's door goes when the venue has none of its own:
//   door: { x, y, flip, spot: { x, y } }  room coords of the door art (furn.wc.door) in the VENUE and the floor spot in front of it.
//   Venues whose rooms already carry restroom doors (City Hall's lobby.restroom fixtures) leave `door` out: those doors are rerouted.
//   door.kind: (none) a wall door furn.wc.door of door.style | 'existing' (the venue already draws a doorway) | 'stairs' (a floor prop: steps down, Central Station)
//              | 'auto' (keep the door or sign stand bladder.js finds room for, and lead it into the room: small venues with no free wall I could place by hand)
//   also: [room ids]  other rooms of the building whose restroom doors lead here too; leaving returns to the room you came from.   gate: 'arena' (half-time queue)
// Art: src/art/venue/restrooms_art.js (furn.wc.*). Logic + API: src/sim/restrooms.js. Plan for the other venues: docs/reports/bathrooms.md.
import { GT } from '../../engine/world.js';

const I = (id, x, y, p, o) => Object.assign({ id: 'furn.' + id, x, y, p: p || {} }, o);
const WY = (id, at, p, o) => Object.assign({ id: 'furn.' + id, wall: 'y', at, p: p || {} }, o);
const WX = (id, at, p, o) => Object.assign({ id: 'furn.' + id, wall: 'x', at, p: p || {} }, o);

const BRASS = '#c9a35a';
/** the shared small-cafe loo (batch 3): one stall, a bowl on a wooden shelf, a round mirror; walls, wood, stall colour and the story piece are the venue's own */
const nook = (venue, name, v) => ({ venue, id: venue + ':wc', back: 'Back to ' + name, door: { kind: 'auto' },
  def: { name: name + ' Restroom', w: 4, d: 4, music: 'cafe', floor: GT.f_wood, wall: { color: v.wall, pattern: v.pattern, trim: v.trim, rail: 1.0, h: 2.6 },
    items: [
      I('wc.floor3', 0, 0, { style: 'nook', w: 4, d: 4, c: v.floor }),
      I('wc.basin3', .3, 0, { style: 'nook', c: v.shelf, c2: v.bowl }), WY('wc.glass3', .35, { kind: 'round', c: v.frame }, { mount: 1.2 }),
      I('wc.stall', 2.7, 0, { style: 'nook', left: true, c: v.stall, c2: v.wall }), WX('wc.deco3', 1.0, { kind: v.deco, w: v.dw || .8 }, { mount: v.dm || .7 }),
    ].concat(v.prop ? [I('wc.prop3', .2, 2.6, { kind: v.prop })] : []),
    exits: [{ x: 1.6, y: 3.5 }] } });
const NOOKS = [
  nook('pub:8', 'Night Owl Coffee', { wall: '#2a2440', trim: BRASS, floor: '#5a4030', stall: '#3a3060', shelf: '#5a4030', frame: BRASS, deco: 'owl', dm: .8 }),
  nook('pub:45', 'Sunnyside Cafe', { wall: '#f8e8a8', trim: '#e8843a', floor: '#c8a070', stall: '#f2b830', shelf: '#c8a070', frame: '#e8843a', deco: 'sun', prop: 'sunflower' }),
  nook('pub:53', 'Cannery Coffee Roasters', { wall: '#c8ccd0', pattern: 'brick', trim: '#8a5a3a', floor: '#7a6a5a', stall: '#8e979d', shelf: '#6a5040', frame: '#5e666c', deco: 'tins', dw: 1.4, dm: .9 }),
  nook('pub:29', 'Kettle & Crumb', { wall: '#f4e4d8', trim: '#c8574d', floor: '#b08060', stall: '#c8574d', shelf: '#a07050', frame: '#c8574d', deco: 'kettles', dw: 1.4, dm: .9 }),
  nook('pub:24', 'Jade Rabbit Tea House', { wall: '#e4ecd8', trim: '#3f7a5a', floor: '#8a6a4a', stall: '#3f7a5a', shelf: '#5a3e28', frame: '#3f7a5a', deco: 'rabbit', bowl: '#d8e8dc' }),
];

export const WC = [
  /* ---- (a) SkyDeck, level 52: dark slate, walnut stalls to the ceiling, brass, and the whole bay behind the glass ---- */
  { venue: 'skydeck', id: 'skydeck:wc', back: 'Back to the SkyDeck', door: { x: 13.5, y: 10.55, flip: true, style: 'sky', spot: { x: 14.1, y: 11.05 } },
    def: { name: 'SkyDeck Restrooms', w: 9, d: 6, zoom: 1, music: 'quiet', floor: GT.f_stone, wall: { color: '#2e3036', trim: '#b08a4a', h: 4 }, bg: '#101320',
      items: [
        I('wc.floor', 0, 0, { style: 'sky', w: 9, d: 6 }),
        WX('skydeck.pano', 0, { w: 4, u0: 470, rev: 1 }, { sky: 1 }), WX('skydeck.pano', 4, { w: 2, u0: 406, rev: 1 }, { sky: 1 }),
        I('generic.bench', .9, 2.1, { c: '#5a3f2e' }, { flip: true }),
        I('wc.vanity', 1.0, 0, { style: 'sky', w: 2.6 }), WY('wc.mirror', 1.13, { style: 'sky' }, { mount: 1.3 }), WY('wc.mirror', 2.08, { style: 'sky' }, { mount: 1.3 }),
        I('wc.mints', 1.2, .3, {}, { z: .84 }), WY('wc.sign', 1.3, { kind: 'level' }, { mount: 2.7 }),
        I('wc.bin', 3.75, .1, { style: 'sky' }),
        I('wc.stall', 4.6, 0, { style: 'sky', left: true }), I('wc.stall', 6.0, 0, { style: 'sky' }), I('wc.stall', 7.4, 0, { style: 'sky' }),
        I('wc.pendant', 2.4, 2.6, {}, { z: 2.3 }), I('wc.pendant', 4.6, 3.9, {}, { z: 2.3 }),
        I('generic.plant', 8.4, 5.3, { kind: 'snake', s: 1.4, pot: '#2b2d33' }),
      ],
      exits: [{ x: 5.4, y: 5.5 }] } },

  /* ---- (b) Dot's Diner: tiny, pink tile, one teal stall with a carved heart, a chrome dryer that roars, the mop bucket ---- */
  { venue: 'diner', id: 'diner:wc', back: "Back to Dot's Diner", door: { x: 12.0, y: 0, style: 'diner', spot: { x: 12.5, y: .7 } },
    def: { name: "Dot's Diner Restroom", w: 5, d: 4, music: 'cafe', floor: GT.f_tile, wall: { color: '#f2b8c6', pattern: 'tile', trim: '#2a2733', rail: 1.3, h: 2.6 },
      items: [
        I('wc.floor', 0, 0, { style: 'diner', w: 5, d: 4 }),
        I('wc.stall', 0, 0, { style: 'diner', tag: 1 }),
        I('wc.sink', 1.65, 0, { style: 'diner' }), WY('wc.tube', 1.45, {}, { mount: 2.15 }), WY('wc.dryer', 2.7, {}, { mount: 1.0 }), WY('wc.sign', 3.45, { kind: 'wash' }, { mount: 1.25 }),
        I('wc.bin', 3.8, .1, { style: 'diner' }),
        WX('generic.picture', 1.75, { kind: 2, c: '#3f9a94' }), WX('generic.window', 3.0, { w: 1 }),
        I('wc.mop', .1, 2.2, {}, { flip: true }),
      ],
      exits: [{ x: 3.4, y: 3.5 }] } },

  /* ---- (c) City Hall: a grand public washroom of 1891 — marble, oak stalls with high cisterns, a maple-leaf medallion, the first mayor watching ---- */
  { venue: 'cityhall', id: 'cityhall:wc', back: 'Back to the Rotunda', also: ['cityhall_council', 'cityhall_records', 'cityhall_clerk'],
    def: { name: 'City Hall Public Washroom', w: 12, d: 8, music: 'quiet', floor: GT.f_tile, wall: { color: '#ece4d4', trim: '#2f5f4f', rail: 1.2, h: 3.8 },
      items: [
        I('wc.floor', 0, 0, { style: 'hall', w: 12, d: 8 }),
        WY('cityhall.portrait', .7, { k: 0 }, { mount: 1.0 }), WY('wc.sign', 2.15, { kind: 'civic' }, { mount: 1.25 }),
        I('wc.suggest', 3.2, .35),
        I('wc.stall', 5.2, 0, { style: 'hall', left: true }), I('wc.stall', 6.8, 0, { style: 'hall' }), I('wc.stall', 8.4, 0, { style: 'hall' }), I('wc.stall', 10.0, 0, { style: 'hall' }),
        I('wc.vanity', 0, 1.2, { style: 'hall' }, { flip: true }),
        WX('wc.mirror', 1.45, { style: 'hall' }, { mount: 1.2 }), WX('wc.mirror', 2.85, { style: 'hall' }, { mount: 1.2 }), WX('wc.mirror', 4.25, { style: 'hall' }, { mount: 1.2 }),
        I('generic.plant', .1, 6.9, { s: 1.6, leaf: '#3f7a48', pot: '#d8a848' }), I('wc.bin', .15, 5.9, { style: 'hall' }),
        I('hotel.chandelier', 5.0, 3.9, { r: .55 }, { z: 3.05 }),
      ],
      exits: [{ x: 6.5, y: 7.5 }] } },

  /* ================= batch 2 ================= */
  /* ---- SkyDeck lobby, street level: a plain service loo off the corridor: painted block, concrete, steel, pipes, a hard hat on the hook ---- */
  { venue: 'skydeck_lobby', id: 'skydeck_lobby:wc', back: 'Back to the lobby', door: { x: 8.0, y: 0, style: 'service', spot: { x: 8.5, y: .7 } },
    def: { name: 'SkyDeck Lobby Restroom', w: 4, d: 4, music: 'quiet', floor: GT.f_concrete, wall: { color: '#c8ccd0', pattern: 'brick', trim: '#5e666c', h: 2.6 },
      items: [
        I('wc.floor2', 0, 0, { style: 'service', w: 4, d: 4 }),
        WY('wc.deco', 0, { kind: 'pipes', w: 4 }, { mount: 2.2 }),
        I('wc.stall', 0, 0, { style: 'service' }),
        I('wc.basin', 1.65, 0, { style: 'service' }), WY('wc.glass', 2.5, { style: 'service' }, { mount: 1.05 }), I('wc.bin', 3.45, .1, { style: 'service' }),
        WX('wc.deco', 1.85, { kind: 'hivis' }, { mount: .55 }), I('wc.lamp', 2.3, 0, { kind: 'cage' }, { z: 2.05 }),
      ],
      exits: [{ x: 2.6, y: 3.5 }] } },

  /* ---- Central Station: down the railed steps to a tiled station loo: white subway tile, green trim, terrazzo, a steel trough, a mosaic of the old steam train ---- */
  { venue: 'central_station', id: 'central_station:wc', back: 'Up to the station hall', door: { kind: 'stairs', x: 4.0, y: 1.0, spot: { x: 5.0, y: 3.0 } },
    def: { name: 'Central Station Toilets', w: 10, d: 6, music: 'quiet', floor: GT.f_stone, wall: { color: '#eef0ea', pattern: 'tile', trim: '#2f5a46', rail: 1.2, h: 3.2 },
      items: [
        I('wc.floor2', 0, 0, { style: 'station', w: 10, d: 6 }),
        I('wc.basin', .6, 0, { style: 'station', w: 3 }), WY('wc.glass', .8, { style: 'station' }, { mount: 1.35 }), WY('wc.glass', 1.8, { style: 'station' }, { mount: 1.35 }), WY('wc.glass', 2.8, { style: 'station' }, { mount: 1.35 }),
        I('wc.stall', 4.8, 0, { style: 'station', left: true, n: 1 }), I('wc.stall', 6.1, 0, { style: 'station', n: 2 }), I('wc.stall', 7.4, 0, { style: 'station', n: 3 }), I('wc.stall', 8.7, 0, { style: 'station', n: 4 }),
        WX('wc.deco', 1.3, { kind: 'mosaic', w: 2.4 }, { mount: .95 }), I('wc.bin', .15, 4.6, { style: 'station' }),
      ],
      exits: [{ x: 5, y: 5.5 }] } },

  /* ---- the Galleria: lilac stalls to the ceiling, a quartz counter with sensor taps, one long mirror, the baby-change table with a forgotten duck ---- */
  { venue: 'deptstore', id: 'deptstore:wc', back: 'Back to the Galleria', door: { kind: 'existing', x: 0, y: 1.5, flip: true, spot: { x: .6, y: 2.0 } },
    def: { name: 'Galleria Restrooms', w: 9, d: 6, music: 'quiet', floor: GT.f_tile, wall: { color: '#efe6da', trim: '#b8a6d8', rail: 1.0, h: 3.0 },
      items: [
        I('wc.floor2', 0, 0, { style: 'mall', w: 9, d: 6 }),
        I('wc.basin', .5, 0, { style: 'mall', w: 3 }), WY('wc.glass', .5, { style: 'mall', w: 3 }, { mount: 1.2 }), I('wc.bin', 3.7, .1, { style: 'mall' }),
        I('wc.stall', 4.4, 0, { style: 'mall', left: true }), I('wc.stall', 5.9, 0, { style: 'mall' }), I('wc.stall', 7.4, 0, { style: 'mall' }),
        WX('wc.deco', 1.6, { kind: 'duck' }, { mount: 0, tags: ['wcbaby'] }),
        I('generic.plant', 8.4, 5.3, { kind: 'palm', s: 1.4, pot: '#e8e4f0' }),
      ],
      exits: [{ x: 4.5, y: 5.5 }] } },

  /* ---- the library ("the cleanest in the city"): sage and cream stripes, oak herringbone, two green-painted stalls I and II, pedestal basins, a swap shelf ---- */
  { venue: 'library', id: 'library:wc', back: 'Back to the library', door: { x: 0, y: 1.0, flip: true, style: 'library', spot: { x: .6, y: 1.5 } },
    def: { name: 'Library Restrooms', w: 6, d: 5, music: 'quiet', floor: GT.f_wood, wall: { color: '#e9e0cc', pattern: 'stripes', color2: '#e2d8c2', trim: '#3f5a46', rail: 1.1, h: 3.0 },
      items: [
        I('wc.floor2', 0, 0, { style: 'library', w: 6, d: 5 }),
        I('wc.basin', .4, 0, { style: 'library' }), I('wc.basin', 1.4, 0, { style: 'library' }), WY('wc.glass', .4, { style: 'library' }, { mount: 1.15 }), WY('wc.glass', 1.4, { style: 'library' }, { mount: 1.15 }),
        I('wc.lamp', 2.3, 0, { kind: 'sconce' }, { z: 1.55 }), I('wc.bin', 2.65, .1, { style: 'library' }),
        I('wc.stall', 3.4, 0, { style: 'library', left: true, n: 1 }), I('wc.stall', 4.7, 0, { style: 'library', n: 2 }),
        WX('wc.sign', 1.4, { kind: 'quiet' }, { mount: 1.7 }), I('wc.prop', 0, 2.3, { kind: 'books' }, { flip: true, tags: ['wcbooks'] }),
      ],
      exits: [{ x: 3, y: 4.5 }] } },

  /* ---- the museum: a white gallery loo, polished concrete, minimal stalls with black edges, black stone bowls on plinths, a hand dryer exhibited under a spot ---- */
  { venue: 'museum', id: 'museum:wc', back: 'Back to the museum', door: { x: 0, y: 30.0, flip: true, style: 'museum', spot: { x: .6, y: 30.5 } },
    def: { name: 'Museum Restrooms', w: 8, d: 5, music: 'quiet', floor: GT.f_concrete, wall: { color: '#f4f2ee', trim: '#2a2a2e', h: 3.6 },
      items: [
        I('wc.floor2', 0, 0, { style: 'museum', w: 8, d: 5 }),
        I('wc.basin', .3, 0, { style: 'museum' }), WY('wc.glass', .6, { style: 'museum' }, { mount: 1.35 }), WY('wc.glass', 1.8, { style: 'museum' }, { mount: 1.35 }), I('wc.bin', 3.3, .1, { style: 'museum' }),
        I('wc.stall', 4.0, 0, { style: 'museum', left: true }), I('wc.stall', 5.4, 0, { style: 'museum' }),
        WX('wc.deco', 1.4, { kind: 'label' }, { mount: .75, tags: ['wclabel'] }), I('wc.lamp', .3, 1.1, { kind: 'track' }, { z: 2.7, flip: true }),
        I('generic.bench', 2.4, 3.0, { c: '#f4f2ee' }),
      ],
      exits: [{ x: 5.4, y: 4.5 }] } },

  /* ---- Iron Maple Gym: the locker-room loo: rubber floor, orange stalls, steel basins with pump bottles, lockers, a bench, a scale nobody trusts ---- */
  { venue: 'gym', id: 'gym:wc', back: 'Back to the gym floor', door: { x: 0, y: 6.5, flip: true, style: 'gym', spot: { x: .6, y: 7.0 } },
    def: { name: 'Iron Maple Locker Room', w: 7, d: 5, music: 'gym', floor: GT.f_mat, wall: { color: '#dfe3e6', trim: '#c0392b', rail: .5, h: 2.8 },
      items: [
        I('wc.floor2', 0, 0, { style: 'gym', w: 7, d: 5 }),
        I('wc.basin', 1.9, 0, { style: 'gym' }), WY('wc.glass', 1.9, { style: 'gym', w: 2 }, { mount: 1.2 }), I('wc.bin', 4.05, .05, { style: 'gym' }),
        I('wc.stall', 4.6, 0, { style: 'gym', left: true, n: 1 }), I('wc.stall', 5.8, 0, { style: 'gym', n: 2 }),
        I('generic.lockers', 0, 1.2, { w: 2 }, { flip: true }), I('generic.bench', 1.4, 2.0, { c: '#b07444' }, { flip: true }), I('wc.prop', .35, .3, { kind: 'scale' }, { tags: ['wcscale'] }),
      ],
      exits: [{ x: 3.5, y: 4.5 }] } },

  /* ---- the Blue Heron: one black stall, band stickers everywhere, a red bulb, a steel bowl, a lipstick heart on the mirror, the gumball machine ---- */
  { venue: 'bar', id: 'bar:wc', back: 'Back to the bar', door: { x: 0, y: 9.0, flip: true, style: 'bar', spot: { x: .6, y: 9.5 } },
    def: { name: 'Blue Heron Toilet', w: 4, d: 4, music: 'bar', floor: GT.f_darkwood, wall: { color: '#2a2430', pattern: 'brick', trim: '#ff4a8a', h: 2.6 },
      items: [
        I('wc.floor2', 0, 0, { style: 'bar', w: 4, d: 4 }),
        I('wc.basin', .35, 0, { style: 'bar' }), WY('wc.glass', .35, { style: 'bar' }, { mount: 1.25 }), WY('wc.deco', 1.1, { kind: 'stickers', w: 1.6 }, { mount: .45 }),
        I('wc.stall', 2.8, 0, { style: 'bar', left: true, seed: 5 }), I('wc.bin', 2.3, .1, { style: 'bar' }),
        I('cornerstore.gumball', .2, 2.4), I('wc.lamp', 1.6, 1.8, { kind: 'red' }, { z: 1.95 }),
      ],
      exits: [{ x: 1.9, y: 3.5 }] } },

  /* ---- the Arena: an Otters-red restroom block: five stalls, a round wash fountain you step up to, the score on a TV, a queue rail for half-time ---- */
  { venue: 'arena', id: 'arena:wc', back: 'Back to the concourse', gate: 'arena',
    def: { name: 'Arena Restrooms', w: 12, d: 6, music: 'quiet', floor: GT.f_concrete, wall: { color: '#e6e6e2', pattern: 'brick', trim: '#d2392f', rail: 1.3, h: 3.2 },
      items: [
        I('wc.floor2', 0, 0, { style: 'arena', w: 12, d: 6 }),
        WY('wc.deco', 1.0, { kind: 'tv' }, { mount: 1.6 }), WY('wc.sign', 2.8, { kind: 'otters' }, { mount: 1.9 }),
        I('wc.basin', 2.0, 2.1, { style: 'arena' }), I('wc.bin', 5.3, .1, { style: 'arena' }),
        I('wc.stall', 6.0, 0, { style: 'arena', left: true, n: 1 }), I('wc.stall', 7.2, 0, { style: 'arena', n: 2 }), I('wc.stall', 8.4, 0, { style: 'arena', n: 3 }), I('wc.stall', 9.6, 0, { style: 'arena', n: 4 }), I('wc.stall', 10.8, 0, { style: 'arena', n: 5 }),
        I('generic.queuepost', 6.2, 3.4, { n: 3, c: '#d2392f' }),
      ],
      exits: [{ x: 4, y: 5.5 }] } },

  /* ================= batch 3 ================= */
  /* ---- the Grand Maple Hotel: an art-deco powder room: blush walls, black lacquer stalls with gold sunrays, black marble vanity, fan mirrors, a velvet pouf ---- */
  { venue: 'hotel', id: 'hotel:wc', back: 'Leave the powder room', also: ['hotel_ballroom', 'hotel_spa'],
    def: { name: 'Grand Maple Powder Room', w: 8, d: 6, music: 'quiet', floor: GT.f_tile, wall: { color: '#e8c8c0', trim: '#c9a35a', rail: 1.1, h: 3.4 },
      items: [
        I('wc.floor3', 0, 0, { style: 'deco', w: 8, d: 6 }),
        I('wc.basin3', .5, 0, { style: 'deco' }), WY('wc.glass3', .7, { kind: 'fan' }, { mount: 1.3 }), WY('wc.glass3', 1.9, { kind: 'fan' }, { mount: 1.3 }), WY('lobby.sconce', 3.05, {}),
        I('wc.stall', 3.8, 0, { style: 'deco', left: true }), I('wc.stall', 5.2, 0, { style: 'deco' }), I('wc.stall', 6.6, 0, { style: 'deco' }),
        I('wc.prop3', .4, 1.7, { kind: 'pouf' }), I('generic.plant', 7.4, 5.3, { kind: 'palm', s: 1.4, pot: '#1e1a22' }),
      ],
      exits: [{ x: 4, y: 5.5 }] } },

  /* ---- Bean & Gone: a cosy single loo: chalkboard wall of customers' doodles, trailing pothos, green tiles, a bowl on a reclaimed shelf ---- */
  { venue: 'cafe', id: 'cafe:wc', back: 'Back to Bean & Gone', door: { kind: 'auto' },
    def: { name: 'Bean & Gone Restroom', w: 4, d: 4, music: 'cafe', floor: GT.f_tile, wall: { color: '#efe6d2', trim: '#5f8a7a', rail: 1.0, h: 2.8 },
      items: [
        I('wc.floor3', 0, 0, { style: 'cafe', w: 4, d: 4 }),
        I('wc.basin3', .3, 0, { style: 'cafe' }), WY('wc.glass3', .4, { kind: 'round', c: '#8a6040' }, { mount: 1.2 }), WY('wc.deco3', 1.25, { kind: 'pothos', w: 1.3 }, { mount: 1.3 }),
        I('wc.stall', 2.7, 0, { style: 'cafe', left: true }), WX('wc.deco3', .7, { kind: 'chalk', w: 1.8 }, { mount: .7 }),
      ],
      exits: [{ x: 1.6, y: 3.5 }] } },

  /* ---- Noodle Lantern: dark wood, a paper screen, a stone basin fed by bamboo, a noren curtain on the stall and the toilet slippers waiting ---- */
  { venue: 'ramen', id: 'ramen:wc', back: 'Back to the noodle bar', door: { kind: 'auto' },
    def: { name: 'Noodle Lantern Toilet', w: 4, d: 4, music: 'quiet', floor: GT.f_stone, wall: { color: '#d8c8a0', pattern: 'planks', trim: '#4a3020', rail: 1.0, h: 2.6 },
      items: [
        I('wc.floor3', 0, 0, { style: 'ramen', w: 4, d: 4 }),
        I('wc.basin3', .4, .05, { style: 'ramen' }), WX('wc.deco3', .9, { kind: 'shoji', w: 1.8 }, { mount: .5 }), I('ramen.lantern', 1.6, .3),
        I('wc.stall', 2.8, 0, { style: 'ramen', left: true }), I('wc.prop3', 2.0, 1.7, { kind: 'slippers' }, { solid: false }),
      ],
      exits: [{ x: 1.6, y: 3.5 }] } },

  /* ---- Slice of Heaven: white tile with green trim, terracotta floor, a deep farmhouse sink, Nonna's photo and the restaurant calendar ---- */
  { venue: 'pizza', id: 'pizza:wc', back: 'Back to Slice of Heaven', door: { x: 0, y: 2.0, flip: true, style: 'pizza', spot: { x: .6, y: 2.5 } },
    def: { name: 'Slice of Heaven Restroom', w: 4, d: 4, music: 'cafe', floor: GT.f_tile, wall: { color: '#f4f0e8', pattern: 'tile', trim: '#3f8a55', rail: 1.1, h: 2.6 },
      items: [
        I('wc.floor3', 0, 0, { style: 'pizza', w: 4, d: 4 }),
        I('wc.basin3', .4, 0, { style: 'pizza' }), WY('wc.glass3', .55, { kind: 'oval', c: '#f4f0e8' }, { mount: 1.15 }),
        I('wc.stall', 2.8, 0, { style: 'pizza', left: true }), WX('wc.deco3', .8, { kind: 'nonna', w: 1.2 }, { mount: .6 }),
      ],
      exits: [{ x: 1.6, y: 3.5 }] } },

  /* ---- Rise & Shine: the staff loo that doubles as the flour store: butter-yellow walls, floury boards, an enamel washbowl and jug ---- */
  { venue: 'bakery', id: 'bakery:wc', back: 'Back to the bakery', door: { x: 0, y: 1.5, flip: true, style: 'bakery', spot: { x: .6, y: 2.0 } },
    def: { name: 'Rise & Shine Staff Loo', w: 4, d: 4, music: 'cafe', floor: GT.f_wood, wall: { color: '#f0e0c0', trim: '#c0563a', rail: 1.1, h: 2.6 },
      items: [
        I('wc.floor3', 0, 0, { style: 'bakery', w: 4, d: 4 }),
        I('wc.basin3', .4, 0, { style: 'bakery' }), WY('wc.glass3', .5, { kind: 'rect', c: '#c0563a', w: .6 }, { mount: 1.35 }),
        I('wc.stall', 2.8, 0, { style: 'bakery', left: true }), I('bakery.sacks', 0, 2.3, {}, { flip: true }),
      ],
      exits: [{ x: 1.8, y: 3.5 }] } },

  /* ---- the Aquarium: deep-blue tile, a wave across the floor, teal stalls with portholes, scallop-shell basins, a little fish tank in the wall ---- */
  { venue: 'aquarium', id: 'aquarium:wc', back: 'Back to the aquarium', door: { x: 0, y: 18.5, flip: true, style: 'aqua', spot: { x: .6, y: 19.0 } },   // in the gift shop: no ticket needed to reach it
    def: { name: 'Aquarium Restrooms', w: 8, d: 5, music: 'quiet', floor: GT.f_tile, wall: { color: '#2a6a9a', pattern: 'tile', trim: '#c9a35a', rail: 1.2, h: 3.2 },
      items: [
        I('wc.floor3', 0, 0, { style: 'aqua', w: 8, d: 5 }),
        I('wc.basin3', .4, 0, { style: 'aqua' }), WY('wc.glass3', .75, { kind: 'porthole' }, { mount: 1.3 }), WY('wc.glass3', 1.95, { kind: 'porthole' }, { mount: 1.3 }),
        I('wc.stall', 4.1, 0, { style: 'aqua', left: true }), I('wc.stall', 5.4, 0, { style: 'aqua' }), I('wc.stall', 6.7, 0, { style: 'aqua' }),
        WX('wc.deco3', 1.2, { kind: 'tank', w: 1.6 }, { mount: .8 }),
      ],
      exits: [{ x: 3.6, y: 4.5 }] } },

  /* ---- the Natatorium: pool-side tile with a chlorine-blue stripe, non-slip floor, a tiled basin ledge, a wall hair dryer, the lost-property box ---- */
  { venue: 'natatorium:leisure', id: 'natatorium:wc', back: 'Back to the leisure hall',
    def: { name: 'Natatorium Restrooms', w: 9, d: 5, music: 'quiet', floor: GT.f_tile, wall: { color: '#e8eef0', pattern: 'tile', trim: '#5ab4c8', rail: 1.0, h: 3.0 },
      items: [
        I('wc.floor3', 0, 0, { style: 'pool', w: 9, d: 5 }),
        I('wc.basin3', .4, 0, { style: 'pool' }), WY('wc.glass3', .5, { kind: 'rect', c: '#c2c8cc', w: 2.8 }, { mount: 1.25 }),
        I('wc.stall', 5.4, 0, { style: 'pool', left: true, n: 1 }), I('wc.stall', 6.6, 0, { style: 'pool', n: 2 }), I('wc.stall', 7.8, 0, { style: 'pool', n: 3 }),
        WX('wc.deco3', 1.0, { kind: 'hairdryer', w: .5 }, { mount: 1.2 }), I('wc.prop3', .1, 3.2, { kind: 'lost' }, { flip: true }),
      ],
      exits: [{ x: 4, y: 4.5 }] } },

  /* ---- the University Commons: painted block, speckled lino, navy stalls covered in flyers (and E=MC2), a notice board, a forgotten textbook ---- */
  { venue: 'university:commons', id: 'university:wc', back: 'Back to the Commons',
    def: { name: 'Commons Restrooms', w: 7, d: 5, music: 'quiet', floor: GT.f_lino, wall: { color: '#e8e0d0', pattern: 'brick', trim: '#2c3a5c', rail: 1.2, h: 3.0 },
      items: [
        I('wc.floor3', 0, 0, { style: 'uni', w: 7, d: 5 }),
        I('wc.basin3', .4, 0, { style: 'uni' }), WY('wc.glass3', .5, { kind: 'rect', c: '#8a9098', w: 1.8, sticker: 1 }, { mount: 1.25 }),
        I('wc.stall', 3.4, 0, { style: 'uni', left: true }), I('wc.stall', 4.6, 0, { style: 'uni' }), I('wc.stall', 5.8, 0, { style: 'uni' }),
        WX('wc.deco3', 1.0, { kind: 'flyers', w: 1.6 }, { mount: .9 }),
      ],
      exits: [{ x: 3, y: 4.5 }] } },

  /* ---- the Orpheum: red velvet stripes, cinema carpet (a few popcorn kernels), oxblood stalls with brass, a bulb-ringed mirror, a framed poster ---- */
  { venue: 'cinema', id: 'cinema:wc', back: 'Back to the foyer', door: { kind: 'auto' },
    def: { name: 'Orpheum Restrooms', w: 7, d: 5, music: 'quiet', floor: GT.f_carpet, wall: { color: '#6a1e24', pattern: 'stripes', color2: '#5a1820', trim: '#c9a35a', rail: 1.0, h: 3.0 },
      items: [
        I('wc.floor3', 0, 0, { style: 'cinema', w: 7, d: 5 }),
        I('wc.basin3', .4, 0, { style: 'cinema' }), WY('wc.glass3', .5, { kind: 'bulbs', w: 1.8 }, { mount: 1.2 }),
        I('wc.stall', 3.1, 0, { style: 'cinema', left: true }), I('wc.stall', 4.4, 0, { style: 'cinema' }), I('wc.stall', 5.7, 0, { style: 'cinema' }),
        WX('wc.deco3', 1.4, { kind: 'poster' }, { mount: .9 }),
      ],
      exits: [{ x: 3, y: 4.5 }] } },

  /* ---- Bay Fish Hall: wet white tile, red quarry floor with a drain and a puddle, galvanised stalls and sink, rubber boots by the wall ---- */
  { venue: 'fishmarket', id: 'fishmarket:wc', back: 'Back to the fish hall',
    def: { name: 'Fish Hall Washroom', w: 6, d: 4, music: 'quiet', floor: GT.f_tile, wall: { color: '#e8eef0', pattern: 'tile', trim: '#2f6f9f', rail: 1.0, h: 2.8 },
      items: [
        I('wc.floor3', 0, 0, { style: 'fish', w: 6, d: 4 }),
        I('wc.basin3', .3, 0, { style: 'fish' }), WY('wc.glass3', .65, { kind: 'rect', c: '#7a8288', w: .7 }, { mount: 1.4 }),
        I('wc.stall', 2.4, 0, { style: 'fish', left: true }), I('wc.stall', 3.6, 0, { style: 'fish' }), I('wc.stall', 4.8, 0, { style: 'fish' }),
        I('wc.prop3', .1, 2.4, { kind: 'boots' }, { flip: true }),
      ],
      exits: [{ x: 2.6, y: 3.5 }] } },

  /* ---- the Observatory: midnight walls, a star-burst floor, brass, a constellation chart, and a red night light low on the wall for dark-adapted eyes ---- */
  { venue: 'observatory', id: 'observatory:wc', back: 'Back to the observatory', door: { kind: 'auto' },
    def: { name: 'Observatory Restroom', w: 5, d: 4, music: 'quiet', floor: GT.f_darkwood, wall: { color: '#1c2448', trim: '#c9a35a', h: 3.0 },
      items: [
        I('wc.floor3', 0, 0, { style: 'obs', w: 5, d: 4 }),
        I('wc.basin3', .4, 0, { style: 'obs' }), WY('wc.glass3', .45, { kind: 'round', c: BRASS }, { mount: 1.25 }), WY('wc.deco3', 1.4, { kind: 'redlight', w: 1.0 }, { mount: .35 }),
        I('wc.stall', 3.7, 0, { style: 'obs', left: true }), WX('wc.deco3', .7, { kind: 'starmap', w: 1.6 }, { mount: .8 }),
      ],
      exits: [{ x: 2.2, y: 3.5 }] } },

  /* ---- one shared layout for five small coffee and tea places (see nook() below) ---- */
  ...NOOKS,
];
