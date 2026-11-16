// Real venue restrooms (owner msgs 151 + 192, BIBLE Direction update 28): the rooms behind a venue's "Restroom" door. Trial batch of three.
// Each entry: venue (the room whose Restroom door leads here), id ('<venue>:wc', so navgoals.rootOf() files it under the venue), the room def
// (defineRoom format, see interior.js; exits are added by src/sim/restrooms.js), and where the venue's door goes when the venue has none of its own:
//   door: { x, y, flip, spot: { x, y } }  room coords of the door art (furn.wc.door) in the VENUE and the floor spot in front of it.
//   Venues whose rooms already carry restroom doors (City Hall's lobby.restroom fixtures) leave `door` out: those doors are rerouted.
// Art: src/art/venue/restrooms_art.js (furn.wc.*). Logic + API: src/sim/restrooms.js. Plan for the other venues: docs/reports/bathrooms.md.
import { GT } from '../../engine/world.js';

const I = (id, x, y, p, o) => Object.assign({ id: 'furn.' + id, x, y, p: p || {} }, o);
const WY = (id, at, p, o) => Object.assign({ id: 'furn.' + id, wall: 'y', at, p: p || {} }, o);
const WX = (id, at, p, o) => Object.assign({ id: 'furn.' + id, wall: 'x', at, p: p || {} }, o);

export const WC = [
  /* ---- (a) SkyDeck, level 52: dark slate, walnut stalls to the ceiling, brass, and the whole bay behind the glass ---- */
  { venue: 'skydeck', id: 'skydeck:wc', back: 'Back to the SkyDeck', door: { x: 13.5, y: 10.55, flip: true, style: 'sky', spot: { x: 14.1, y: 11.05 } },
    def: { name: 'SkyDeck — Restrooms', w: 9, d: 6, zoom: 1, music: 'quiet', floor: GT.f_stone, wall: { color: '#2e3036', trim: '#b08a4a', h: 4 }, bg: '#101320',
      items: [
        I('wc.floor', 0, 0, { style: 'sky', w: 9, d: 6 }),
        WX('skydeck.pano', 0, { w: 4, u0: 470, rev: 1 }, { sky: 1 }), WX('skydeck.pano', 4, { w: 2, u0: 406, rev: 1 }, { sky: 1 }),
        I('generic.bench', .9, 2.1, { c: '#5a3f2e' }, { flip: true }),
        I('wc.vanity', 1.0, 0, { style: 'sky', w: 2.6 }), WY('wc.mirror', 1.13, { style: 'sky' }, { mount: 1.3 }), WY('wc.mirror', 2.08, { style: 'sky' }, { mount: 1.3 }),
        I('wc.mints', 1.86, .16, {}, { z: .84 }), WY('wc.sign', 1.3, { kind: 'level' }, { mount: 2.7 }),
        I('wc.bin', 3.75, .1, { style: 'sky' }),
        I('wc.stall', 4.6, 0, { style: 'sky', left: true }), I('wc.stall', 6.0, 0, { style: 'sky' }), I('wc.stall', 7.4, 0, { style: 'sky' }),
        I('wc.pendant', 2.4, 2.6, {}, { z: 2.3 }), I('wc.pendant', 6.4, 3.0, {}, { z: 2.3 }),
        I('generic.plant', 8.4, 5.3, { kind: 'snake', s: 1.4, pot: '#2b2d33' }),
      ],
      exits: [{ x: 5.4, y: 5.5 }] } },

  /* ---- (b) Dot's Diner: tiny, pink tile, one teal stall with a carved heart, a chrome dryer that roars, the mop bucket ---- */
  { venue: 'diner', id: 'diner:wc', back: "Back to Dot's Diner", door: { x: 12.0, y: 0, style: 'diner', spot: { x: 12.5, y: .7 } },
    def: { name: "Dot's Diner — Restroom", w: 5, d: 4, music: 'cafe', floor: GT.f_tile, wall: { color: '#f2b8c6', pattern: 'tile', trim: '#2a2733', rail: 1.3, h: 2.6 },
      items: [
        I('wc.floor', 0, 0, { style: 'diner', w: 5, d: 4 }),
        I('wc.stall', 0, 0, { style: 'diner', tag: 1 }),
        I('wc.sink', 1.7, 0, { style: 'diner' }), WY('wc.tube', 1.5, {}, { mount: 2.15 }), WY('wc.dryer', 2.85, {}, { mount: 1.0 }),
        I('wc.bin', 3.8, .1, { style: 'diner' }),
        WX('wc.sign', 1.75, { kind: 'wash' }, { mount: 1.25 }), WX('generic.window', 3.1, { w: 1 }),
        I('wc.mop', .1, 2.2, {}, { flip: true }),
      ],
      exits: [{ x: 3.4, y: 3.5 }] } },

  /* ---- (c) City Hall: a grand public washroom of 1891 — marble, oak stalls with high cisterns, a maple-leaf medallion, the first mayor watching ---- */
  { venue: 'cityhall', id: 'cityhall:wc', back: 'Back to the Rotunda',
    def: { name: 'City Hall — Public Washroom', w: 12, d: 8, music: 'quiet', floor: GT.f_tile, wall: { color: '#ece4d4', trim: '#2f5f4f', rail: 1.2, h: 3.8 },
      items: [
        I('wc.floor', 0, 0, { style: 'hall', w: 12, d: 8 }),
        WY('cityhall.portrait', .95, { k: 0 }, { mount: 1.0 }), WY('wc.sign', 2.55, { kind: 'civic' }, { mount: 1.25 }),
        I('wc.suggest', 4.45, .3),
        I('wc.stall', 5.2, 0, { style: 'hall', left: true }), I('wc.stall', 6.8, 0, { style: 'hall' }), I('wc.stall', 8.4, 0, { style: 'hall' }), I('wc.stall', 10.0, 0, { style: 'hall' }),
        I('wc.vanity', 0, 1.2, { style: 'hall' }, { flip: true }),
        WX('wc.mirror', 1.45, { style: 'hall' }, { mount: 1.2 }), WX('wc.mirror', 2.85, { style: 'hall' }, { mount: 1.2 }), WX('wc.mirror', 4.25, { style: 'hall' }, { mount: 1.2 }),
        I('generic.plant', .1, .2, { s: 1.6, leaf: '#3f7a48', pot: '#d8a848' }), I('wc.bin', .15, 5.9, { style: 'hall' }),
        I('hotel.chandelier', 5.1, 3.1, { r: .55 }, { z: 3.05 }),
      ],
      exits: [{ x: 6.5, y: 7.5 }] } },
];
