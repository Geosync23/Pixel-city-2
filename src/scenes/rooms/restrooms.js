// Real venue restrooms (owner msgs 151 + 192, BIBLE Direction update 28): the rooms behind a venue's "Restroom" door. Batch 1 (SkyDeck, diner, City Hall) + batch 2 (eight more) + batch 3 (twelve layouts, sixteen venues) + batch 4 (eleven one-off rooms, the post layout x5, the shop layout x23).
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

/* ======== batch 4 ======== */
const CHROME_ = '#c2c8cc';
/** a story piece you can tap: the item carries the lines (src/sim/restrooms.js fixture 'wcstory') */
const T = (label, who, lines) => ({ tags: ['wcstory'], story: { label, who, lines } });
const BW4 = { vessel: 1, console: 1.1, pedestal: .7, trough: 1.4, tub: 1, stone: .9 };
/** the shared shop restroom (batch 4: ten clothing stores + thirteen home-goods stores): one footprint, every surface in the brand's own style */
const shop = (venue, name, v) => { const bw = BW4[v.basin] || 1;
  return { venue, id: venue + ':wc', back: 'Back to ' + name, door: { kind: 'auto' },
    def: { name: name + ' Restroom', w: 4, d: 4, music: v.music || 'cafe', floor: GT.f_wood, wall: { color: v.wall, pattern: v.pattern, color2: v.wall2, trim: v.trim, rail: 1.0, h: 2.6 },
      items: [
        I('wc.floor4', 0, 0, Object.assign({ w: 4, d: 4 }, v.floor)),
        I('wc.basin4', .3, 0, { style: v.basin, c: v.bc, c2: v.bc2, m: v.m }), WY('wc.glass4', .3 + (bw - (v.gw || .7)) / 2, { kind: v.glass, c: v.frame, w: v.gw }, { mount: v.gm || 1.2 }),
        I('wc.stall', 2.7, 0, Object.assign({ left: true }, v.stall)),
        WX('wc.deco4', 1.0, Object.assign({ w: v.dw || 1.0 }, v.deco), Object.assign({ mount: v.dm || .8 }, T(v.story[0], name, v.story.slice(1)))),
      ],
      exits: [{ x: 1.6, y: 3.5 }] } }; };
const SHOPS = [
  /* ---- the ten clothing stores (docs/reports/clothing_stores.md) ---- */
  shop('cs_hollowell', 'Hollowell & Sons', { wall: '#2f4a40', pattern: 'planks', trim: BRASS, floor: { style: 'herring', c: '#7a5030' }, basin: 'console', bc: '#5a3a24', bc2: '#f2eee6', m: BRASS, glass: 'arch', frame: BRASS,
    stall: { style: 'library', c: '#5a3a24', m: BRASS }, deco: { kind: 'tape' }, story: ['The tape measure', 'A tailor\'s tape and shears hang by the door. "Measure twice, wash once." (Mr Hollowell, embroidered on a hand towel)'] }),
  shop('cs_nightjar', 'Nightjar', { wall: '#1c1622', trim: '#ff4a8a', floor: { style: 'tiles', c: '#141018', c2: '#221c2c' }, basin: 'trough', bc: '#2a2a30', m: '#8a8f98', glass: 'tall', frame: '#2a2a2e',
    stall: { style: 'bar', c: '#141018', deco: 'stars' }, deco: { kind: 'neon', t: 'NIGHT', w: 1.6 }, dw: 1.6, dm: 1.2, music: 'bar', story: ['The neon', 'NIGHTJAR, in pink neon, buzzing very slightly. In here it is always 2 a.m. and you always look great.'] }),
  shop('cs_juniper', 'Juniper & Rye', { wall: '#f4e8d0', trim: '#c8574d', floor: { style: 'boards', c: '#a07850' }, basin: 'console', bc: '#c8a888', bc2: '#f4f0e8', m: BRASS, glass: 'oval', frame: '#8a6a44',
    stall: { style: 'cafe', c: '#c8574d', deco: 'planks' }, deco: { kind: 'yarn', w: 1.2 }, story: ['The yarn shelf', 'Five balls of wool on a shelf, one slowly unravelling toward the floor. A note: "Spare yarn. For emergencies. Knitting emergencies."'] }),
  shop('cs_secondwind', 'Second Wind', { wall: '#e8d9a8', pattern: 'stripes', wall2: '#d8c070', trim: '#3a7a5a', floor: { style: 'check', c: '#9a8a64', c2: '#e8dcc0' }, basin: 'pedestal', bc2: '#e8b0b8', glass: 'oval', frame: '#3a7a5a',
    stall: { style: 'gym', c: '#7a9a6a', deco: 'stickers' }, deco: { kind: 'mismatch', w: 1.2 }, story: ['The picture frames', 'Three frames that have nothing to do with each other, all marked 50 cents. The pink basin was a donation too. Everything in here was.'] }),
  shop('cs_sole', 'Cobble & Sole', { wall: '#9a5a44', pattern: 'brick', trim: '#3a3a40', floor: { style: 'concrete', c: '#8a8680' }, basin: 'trough', bc: '#5a5a60', glass: 'plain', frame: '#3a3a40',
    stall: { style: 'service', c: '#5a4a3a', deco: 'rivets' }, deco: { kind: 'shoes' }, story: ['The shoe boxes', 'Shoe boxes stacked up to the ceiling. One is labelled "LEFT FEET (SPARE)". You decide not to ask.'] }),
  shop('cs_tidepool', 'Tidepool', { wall: '#7fd0cc', pattern: 'planks', trim: '#f4f0e8', floor: { style: 'boards', c: '#c8a070' }, basin: 'stone', bc: '#e8d8b0', glass: 'oval', frame: '#f2c230',
    stall: { style: 'pool', c: '#f28a6a', deco: 'stripe' }, deco: { kind: 'surf', w: 1.2 }, dm: .2, story: ['The surfboard', 'A yellow board with a bite-shaped dent. The sign: "Do not ask Dee about the dent." Sand in the sink, sand on the floor, sand in places sand should not be.'] }),
  shop('cs_outfitters', 'Saltline Outfitters', { wall: '#8a6a48', pattern: 'planks', trim: '#3a3a40', floor: { style: 'boards', c: '#6a4a30' }, basin: 'stone', bc: '#9a968e', glass: 'plain', frame: '#5a4a30',
    stall: { style: 'cafe', c: '#6a5040', deco: 'planks', m: '#3a3a40' }, deco: { kind: 'trail' }, story: ['The trail map', 'A hand-drawn map of the ridge trail, with the staff\'s favourite lunch spots marked. One just says "bears? (no)".'] }),
  shop('cs_otterline', 'Otterline Boathouse', { wall: '#f4f0e8', trim: '#d2392f', floor: { style: 'boards', c: '#d8c8a8' }, basin: 'tub', bc2: '#f4f0e8', m: CHROME_, glass: 'oval', frame: '#d2392f',
    stall: { style: 'arena' }, deco: { kind: 'oars' }, dm: .2, story: ['The crossed oars', 'Two old oars from the 1987 Bay Regatta, which Otterline lost by a boat length. Nobody has forgotten.'] }),
  shop('cs_brim', 'Brim & Buckle', { wall: '#f2d8d0', pattern: 'stripes', wall2: '#e8c0b8', trim: '#3a3a40', floor: { style: 'herring', c: '#c8a070' }, basin: 'pedestal', bc2: '#f4f0e8', m: BRASS, glass: 'oval', frame: BRASS,
    stall: { style: 'deco', c: '#e8a0a8' }, deco: { kind: 'hats', w: 1.2 }, story: ['The hat pegs', 'Three hats on brass pegs: "For trying on in the mirror only. Please return to peg." The red one is very tempting.'] }),
  shop('cs_lantern', 'Little Lantern Atelier', { wall: '#f6efe0', trim: '#3f6a8a', floor: { style: 'concrete', c: '#c8c4bc' }, basin: 'trough', bc: '#8a9098', glass: 'plain', frame: '#3f6a8a',
    stall: { style: 'cafe', c: '#3f6a8a', deco: 'none' }, deco: { kind: 'sketch', w: 1.3 }, story: ['The drying prints', 'Prints pegged up to dry: a hat, a bird, a boat. The ink-stained sink says this is the print room as much as the loo.'] }),
  /* ---- the thirteen home-goods stores ---- */
  shop('goods:timber', 'Timber & Trowel', { wall: '#e8e4dc', pattern: 'brick', trim: '#e8b040', floor: { style: 'concrete', c: '#a8a49c' }, basin: 'trough', bc: '#b8bec4', glass: 'plain', frame: '#e8b040',
    stall: { style: 'service', c: '#e8b040' }, deco: { kind: 'peg', w: 1.2 }, story: ['The pegboard', 'A pegboard with a spare wrench, a level and a sign: "Plumbing aisle 7. Yes, this is a hint."'] }),
  shop('goods:fjord', 'Fjord & Fold', { wall: '#f4f0e8', trim: '#3a6ab0', floor: { style: 'boards', c: '#e0c8a0' }, basin: 'vessel', bc: '#e0c8a0', bc2: '#f4f4f0', glass: 'oval', frame: '#e0c8a0',
    stall: { style: 'museum', c: '#e0c8a0' }, deco: { kind: 'flatpack' }, story: ['The instructions', 'A framed assembly sheet for this very restroom. Step 4 shows a little figure looking confused. Three screws are left over.'] }),
  shop('goods:bellwether', 'Bellwether', { wall: '#efe2cc', pattern: 'stripes', wall2: '#e6d6bc', trim: BRASS, floor: { style: 'check', c: '#7a6a58', c2: '#efe2cc' }, basin: 'console', bc: '#f4f0e8', bc2: '#e8e4dc', m: BRASS, glass: 'arch', frame: BRASS,
    stall: { style: 'library', c: '#5a2a30', m: BRASS }, deco: { kind: 'bell', w: 1.2 }, story: ['The old bell', 'The bell that rang the store open every morning since 1921, now retired to the restroom. It still gleams.'] }),
  shop('goods:lumen', 'Lumen Lighting', { wall: '#2c2738', trim: BRASS, floor: { style: 'tiles', c: '#1e1a26' }, basin: 'vessel', bc: '#3a3448', bc2: '#f4f0e8', m: BRASS, glass: 'oval', frame: BRASS,
    stall: { style: 'bar', c: '#2c2738', deco: 'stars' }, deco: { kind: 'lamps', w: 1.4 }, dm: 1.0, story: ['The test lamps', 'Three pendant shades in yellow, pink and blue, all on, all for sale. The tag: "Try before you buy. Yes, even in here."'] }),
  shop('goods:copper', 'Copper Pan', { wall: '#f4ece0', pattern: 'tile', trim: '#c87a4a', floor: { style: 'redtile' }, basin: 'tub', bc2: '#c87a4a', m: '#c87a4a', glass: 'plain', frame: '#c87a4a',
    stall: { style: 'bakery', c: '#3f6a5a' }, deco: { kind: 'pans', w: 1.4 }, story: ['The pan rail', 'Four copper pans hanging over the sink: "Display only. Please do not cook in the restroom." Someone clearly once tried.'] }),
  shop('goods:attic', 'The Gilded Attic', { wall: '#6a5446', pattern: 'stripes', wall2: '#5e4a3e', trim: BRASS, floor: { style: 'herring', c: '#5a3a24' }, basin: 'console', bc: '#4a3020', bc2: '#e8e0d0', m: BRASS, glass: 'oval', frame: BRASS,
    stall: { style: 'library', c: '#4a3020', m: BRASS }, deco: { kind: 'antique', w: 1.1 }, story: ['The portrait and the clock', 'A stern portrait and a clock stopped at ten past four. The price tags say "not for sale" in three handwritings.'] }),
  shop('goods:warp', 'Warp & Weft', { wall: '#f2e4cc', trim: '#c8574d', floor: { style: 'boards', c: '#b08a60' }, basin: 'stone', bc: '#c8b898', glass: 'oval', frame: '#c8574d',
    stall: { style: 'bakery', c: '#3f6a8a' }, deco: { kind: 'weave', w: 1.4 }, story: ['The woven panel', 'A hand-woven wall panel from the shop\'s loom. A label: "Woven in 41 hours. Please do not dry your hands on it."'] }),
  shop('goods:loam', 'Leaf & Loam', { wall: '#dfeeda', pattern: 'tile', trim: '#4f7a3a', floor: { style: 'tiles', c: '#c87a5a', s: 1 }, basin: 'trough', bc: '#7a8a6a', glass: 'arch', frame: '#4f7a3a',
    stall: { style: 'cafe', c: '#5a8a5a' }, deco: { kind: 'leaves', w: 1.4 }, story: ['The plant shelf', 'Four cuttings on the shelf, rooting in the steam. A card: "These like it in here. Please talk to them."'] }),
  shop('goods:voltaic', 'Voltaic', { wall: '#e8ecf0', pattern: 'tile', trim: '#5a8ac8', floor: { style: 'tiles', c: '#d0d6dc', c2: '#c4cad0' }, basin: 'vessel', bc: '#2a2e36', bc2: '#f4f4f4', m: CHROME_, glass: 'plain', frame: '#2a2e36',
    stall: { style: 'mall', c: '#5a8ac8' }, deco: { kind: 'gadget' }, story: ['The smart panel', 'A smart thermostat says 22C and the hand sensor says hello. The tap needs a wave, a second wave, and then a slightly embarrassed third wave.'] }),
  shop('goods:spoke', 'Spoke & Strum', { wall: '#f4ece0', pattern: 'brick', trim: '#2f8a6a', floor: { style: 'concrete', c: '#8a8680' }, basin: 'trough', bc: '#2f8a6a', glass: 'plain', frame: '#2f8a6a',
    stall: { style: 'gym', c: '#2f8a6a' }, deco: { kind: 'bike', w: 1.4 }, dm: .6, story: ['The bike on the wall', 'A green bike hung on the wall: "Staff parking." Under it, a guitar pick. Of course there is a guitar pick.'] }),
  shop('goods:kestrel', 'Kestrel & Pine', { wall: '#f2e2b8', pattern: 'planks', trim: '#6a4a30', floor: { style: 'boards', c: '#8a6a44' }, basin: 'stone', bc: '#8a8680', glass: 'plain', frame: '#6a4a30',
    stall: { style: 'cafe', c: '#6a4a30', deco: 'planks' }, deco: { kind: 'antler', w: .8 }, story: ['The antlers', 'A pair of carved wooden antlers. A small sign: "No deer were harmed. One woodworker was mildly splintered."'] }),
  shop('goods:sleepy', 'Sleepyhead', { wall: '#e8ecf8', pattern: 'stripes', wall2: '#dfe4f2', trim: '#a8b8d8', floor: { style: 'boards', c: '#d0c0a8' }, basin: 'pedestal', bc2: '#f4f4f8', glass: 'oval', frame: '#a8b8d8',
    stall: { style: 'pool', c: '#a8b8d8', deco: 'none' }, deco: { kind: 'towels', w: 1.4 }, story: ['The towel shelf', 'Fluffy towels in four colours, folded better than any towel has a right to be. The tag: "Feel them. Go on."'] }),
  shop('goods:nord', 'Atelier Nord', { wall: '#f6f4f0', trim: '#2a2a2e', floor: { style: 'concrete', c: '#c8c4bc' }, basin: 'vessel', bc: '#c8a070', bc2: '#2a2a2e', m: '#2a2a2e', glass: 'tall', frame: '#2a2a2e', gw: .5,
    stall: { style: 'museum' }, deco: { kind: 'slab', w: 1.2 }, dm: .1, story: ['The marble slab', 'A slab of marble with one black line across it. It is a towel rail. It is also, the card says, "a meditation on horizon". It costs more than a car.'] }),
];
/** the post office restroom (batch 4): one layout for the five branches, each with its own colour and one detail of its own */
const post = (venue, name, v) => ({ venue, id: venue + ':wc', back: 'Back to the ' + v.short, door: v.door,
  def: { name: name + ' Restroom', w: 5, d: 4, music: 'quiet', floor: GT.f_tile, wall: { color: v.wall, pattern: 'tile', trim: v.trim, rail: 1.1, h: 2.8 },
    items: [
      I('wc.floor4', 0, 0, { style: 'border', w: 5, d: 4, c: v.floor, c2: v.floor2 }),
      I('wc.basin4', .4, 0, { style: 'pedestal', c2: '#f4f4f0', m: CHROME_ }), WY('wc.glass4', .4, { kind: 'plain', c: v.trim }, { mount: 1.2 }), WX('wc.dryer', 2.4, {}, { mount: 1.0 }),
      I('wc.stall', 2.5, 0, { style: 'library', left: true, c: v.stall, m: BRASS }), I('wc.stall', 3.8, 0, { style: 'library', c: v.stall, m: BRASS, n: 2 }),
      WX('wc.deco4', 1.0, Object.assign({ w: 1.0 }, v.deco), Object.assign({ mount: .8 }, T(v.story[0], name, v.story.slice(1)))),
    ],
    exits: [{ x: 2.0, y: 3.5 }] } });
const POSTS = [
  post('post_main', 'General Post Office', { short: 'post office', wall: '#efe6d0', trim: '#c8343a', floor: '#c8343a', floor2: '#efe6d0', stall: '#7a2a24', deco: { kind: 'stamps', c: '#c8343a' },
    story: ['The first stamp', 'A framed sheet of the first Maple Bay stamp, 1898: a red maple leaf, two cents. One of them is printed upside down. The postmaster will not say which.'] }),
  post('post_downtown', 'Postcard Counter', { short: 'counter', wall: '#f4f0e8', trim: '#3a6ab0', floor: '#3a6ab0', floor2: '#f4f0e8', stall: '#2a4a80', deco: { kind: 'postcards' },
    story: ['The postcard rack', 'The rejects rack: postcards with typos. "Greetings from Mapel Bay." "Wish you where here." They sell better than the real ones.'] }),
  post('post_maplewood', 'Maplewood Sub-Post Office', { short: 'post office', wall: '#f2d8d8', trim: '#a84a5a', floor: '#c88a8a', floor2: '#f4ece8', stall: '#a84a5a', deco: { kind: 'sketch', w: 1.3 },
    door: { x: 5.2, y: 0, style: 'nook', c: '#a84a5a', spot: { x: 5.7, y: .7 } }, story: ['The drawings', 'Drawings from Maplewood Elementary: "Our Postman" (a man with a very big bag), "Our Post Office" (pink), "A Stamp" (a dog?).'] }),
  post('post_hillcrest', 'Hillcrest Post & Telegraph', { short: 'post office', wall: '#e8e0cc', trim: '#5a4a30', floor: '#5a4a30', floor2: '#e8e0cc', stall: '#5a4a30', deco: { kind: 'antique', w: 1.1 },
    door: { x: 5.8, y: 0, style: 'library', spot: { x: 6.3, y: .7 } }, story: ['The telegraph clock', 'The old telegraph office clock, stopped at the minute the last telegram left in 1979. It said: STOP.'] }),
  post('post_harbor', 'Harbor Mail Boat Office', { short: 'mail boat office', wall: '#9fb4c4', trim: '#2a4a6a', floor: '#2a4a6a', floor2: '#d8e0e6', stall: '#2a4a6a', deco: { kind: 'tide' },
    door: { x: 5.6, y: 0, style: 'aqua', c: '#2a4a6a', spot: { x: 6.1, y: .7 } }, story: ['The tide chart', 'The mail boat\'s tide chart and a life ring. The boat leaves at high water, so the post does too. "Letters wait for the moon," says the clerk.'] }),
];

/* ---- one-off venues of batch 4 ---- */
const ONE4 = [
  /* ---- Symphony Hall: cream and gold, a parquet floor bordered with a keyboard, green marble and walnut, oval mirrors, the night's programme on the wall ---- */
  { venue: 'concerthall', id: 'concerthall:wc', back: 'Back to the foyer', door: { kind: 'auto' },
    def: { name: 'Symphony Hall Powder Room', w: 7, d: 5, music: 'quiet', floor: GT.f_wood, wall: { color: '#ece0c8', pattern: 'stripes', color2: '#e4d6ba', trim: BRASS, rail: 1.1, h: 3.4 },
      items: [
        I('wc.floor4', 0, 0, { style: 'piano', w: 7, d: 5 }),
        I('wc.basin4', .4, 0, { style: 'marble', c: '#5a3a24' }), WY('wc.glass4', .45, { kind: 'oval', c: BRASS }, { mount: 1.2 }), WY('wc.glass4', 1.45, { kind: 'oval', c: BRASS }, { mount: 1.2 }),
        I('wc.stall', 3.0, 0, { style: 'library', left: true, c: '#5a3a24', m: BRASS }), I('wc.stall', 4.3, 0, { style: 'library', c: '#5a3a24', m: BRASS, n: 2 }), I('wc.stall', 5.6, 0, { style: 'library', c: '#5a3a24', m: BRASS, n: 3 }),
        WX('wc.deco4', 1.2, { kind: 'programme' }, Object.assign({ mount: .8 }, T('Tonight\'s programme', 'Symphony Hall', ['Tonight: Mahler, Symphony No. 5. The interval is twenty minutes, the queue for this room is nineteen. Plan accordingly.', 'A pencil note on the programme: "Adagietto. Bring tissues." Someone has added: "and wash your hands after."']))),
        I('wc.bin', .1, 3.4, { style: 'hall' }, { flip: true }),
      ],
      exits: [{ x: 2.6, y: 4.5 }] } },

  /* ---- the Lantern Playhouse: the backstage loo the audience shares. Black stage floor with spike tape, a dressing-table basin, a costume rail, BREAK A LEG on the mirror ---- */
  { venue: 'playhouse', id: 'playhouse:wc', back: 'Back to the playhouse', door: { kind: 'auto' },
    def: { name: 'Playhouse Backstage Loo', w: 5, d: 4, music: 'quiet', floor: GT.f_darkwood, wall: { color: '#4a2a3a', pattern: 'brick', trim: '#c9a35a', rail: 1.0, h: 2.8 },
      items: [
        I('wc.floor4', 0, 0, { style: 'stage', w: 5, d: 4 }),
        I('wc.basin4', .3, 0, { style: 'dresser' }), WY('wc.glass4', .3, { kind: 'scrawl', w: 1.4 }, { mount: 1.1 }), WY('wc.deco3', 2.3, { kind: 'poster' }, { mount: .9 }),
        I('wc.stall', 3.7, 0, { style: 'bar', left: true, c: '#7a2a3a', deco: 'stars' }),
        WX('wc.deco4', 1.0, { kind: 'rail', w: 1.6 }, Object.assign({ mount: 0 }, T('The costume rail', 'The Lantern Playhouse', ['Costumes waiting for the second act: a red cape, a blue gown, a ghost (it is a sheet). The ghost has a name tag: "Gerald".', 'A note pinned to the rail: "Whoever borrowed the crown, the king needs it at 8:40."']))),
      ],
      exits: [{ x: 2.0, y: 3.5 }] } },

  /* ---- the Conservatory: the gardeners' washroom, a glass wall onto the palm house, brick floor, a potting-bench sink, a watering can ---- */
  { venue: 'conservatory', id: 'conservatory:wc', back: 'Back to the glasshouse', door: { kind: 'auto' },
    def: { name: 'Conservatory Washroom', w: 6, d: 4, music: 'quiet', floor: GT.f_stone, wall: { color: '#d8e4cc', pattern: 'tile', trim: '#4f7a3a', rail: 1.0, h: 3.0 },
      items: [
        I('wc.floor4', 0, 0, { style: 'brick', w: 6, d: 4 }),
        I('wc.basin4', .3, 0, { style: 'potting' }), WY('wc.glass4', .65, { kind: 'arch', c: '#e8ece8' }, { mount: 1.2 }),
        I('wc.stall', 3.4, 0, { style: 'cafe', left: true, c: '#4f7a5a', deco: 'planks' }), I('wc.stall', 4.7, 0, { style: 'cafe', c: '#4f7a5a', deco: 'planks' }),
        WX('wc.deco4', .6, { kind: 'panes', w: 2.0 }, Object.assign({ mount: .5 }, T('The glass wall', 'Conservatory', ['Through the glass: the palm house, steaming gently. A fern has pushed one frond in through a gap in the panes. Nobody has the heart to cut it.', 'A gardener\'s note on the glass: "Do not water the visitors."']))),
        I('wc.prop4', .2, 2.8, { kind: 'can' }, { solid: false }),
      ],
      exits: [{ x: 2.4, y: 3.5 }] } },

  /* ---- Bayside Clinic: the patients' toilet. Pale green tile, speckled vinyl, an elbow-lever basin, a sharps box, the samples hatch, a red pull cord ---- */
  { venue: 'clinic', id: 'clinic:wc', back: 'Back to the clinic', door: { kind: 'auto' },
    def: { name: 'Clinic Patient Toilet', w: 5, d: 4, music: 'quiet', floor: GT.f_lino, wall: { color: '#e4eee8', pattern: 'tile', trim: '#3a8a6a', rail: 1.0, h: 2.8 },
      items: [
        I('wc.floor4', 0, 0, { style: 'vinyl', w: 5, d: 4 }),
        I('wc.basin4', .4, 0, { style: 'clinic' }), WY('wc.glass4', .45, { kind: 'plain', c: '#c2c8cc' }, { mount: 1.25 }), WY('wc.dryer', 1.35, {}, { mount: 1.0 }),
        I('wc.stall', 3.3, 0, { style: 'service', left: true, c: '#8ac0b0', deco: 'none' }), I('wc.bin', 2.4, .1, { style: 'service' }),
        WX('wc.deco4', .8, { kind: 'hatch', w: 1.5 }, Object.assign({ mount: .9 }, T('The samples hatch', 'Bayside Clinic', ['A little steel hatch marked SAMPLES. Thankfully nobody has asked you for one. Today.', 'A laminated card by the hatch: "Please label your sample. We had a mix-up in 2019. We do not talk about 2019."']))),
      ],
      exits: [{ x: 2.0, y: 3.5 }] } },

  /* ---- Maple Bay International: a proper airport restroom. Long and bright, a run of six stalls, a four-basin terrazzo counter, hand dryers,
          the departures board (a late flight), the baby-change room sign, a forgotten luggage trolley ---- */
  { venue: 'airport:terminal', also: ['airport:concourse'], id: 'airport:wc', back: 'Back to the terminal', door: { kind: 'auto' },
    def: { name: 'Airport Restrooms', w: 14, d: 6, music: 'quiet', floor: GT.f_tile, wall: { color: '#eef1f3', pattern: 'tile', trim: '#3a5a9a', rail: 1.2, h: 3.4 },
      items: [
        I('wc.floor4', 0, 0, { style: 'tiles', w: 14, d: 6, c: '#d8dcdc', c2: '#ccd0d2', s: 1 }),
        I('wc.basin4', .2, 0, { style: 'airport' }), WY('wc.glass4', .2, { kind: 'plain', c: '#3a5a9a', w: 4 }, { mount: 1.15 }),
        WY('wc.dryer', 4.4, {}, { mount: 1.0 }), WY('wc.dryer', 5.3, {}, { mount: 1.0 }), WY('wc.dryer', 6.2, {}, { mount: 1.0 }),
        I('wc.stall', 7.4, 0, { style: 'station', left: true, deco: 'number', n: 1 }), I('wc.stall', 8.7, 0, { style: 'station', deco: 'number', n: 2 }), I('wc.stall', 10.0, 0, { style: 'station', deco: 'number', n: 3 }),
        I('wc.stall', 11.3, 0, { style: 'station', deco: 'number', n: 4 }), I('wc.stall', 12.6, 0, { style: 'station', deco: 'number', n: 5 }),
        WX('wc.deco4', .4, { kind: 'flights', w: 2.7 }, Object.assign({ mount: 1.0 }, T('The departures board', 'Maple Bay International', ['DEPARTURES: Vancouver on time, Seattle on time, Boston LATE. There is always one, and it is always Boston.', 'The board flickers. Boston is now LATER. Somebody in stall three sighs very loudly.']))),
        WX('wc.deco4', 3.4, { kind: 'babysign', w: 1.7 }, { mount: 1.3, tags: ['wcbaby'] }),
        I('wc.prop4', .3, 4.6, { kind: 'trolley' }, { flip: true }), I('wc.bin', .15, 2.6, { style: 'station' }, { flip: true }),
      ],
      exits: [{ x: 5.2, y: 5.5 }] } },

  /* ---- the park pavilion's public restroom, reached from the city: a rough outdoor block. Bare concrete, a trough with push taps, a cobweb, leaves blown in ---- */
  { venue: 'city', id: 'park:wc', back: 'Back to the park',
    def: { name: 'Park Pavilion Restroom', w: 6, d: 4, music: 'quiet', floor: GT.f_stone, wall: { color: '#b8b4aa', pattern: 'brick', trim: '#5a7a4a', rail: 1.0, h: 2.6 },
      items: [
        I('wc.floor4', 0, 0, { style: 'park', w: 6, d: 4 }),
        I('wc.basin4', .3, 0, { style: 'parktrough' }), WY('wc.glass4', .5, { kind: 'polished' }, { mount: 1.25 }), WY('wc.deco4', 2.2, { kind: 'cobweb', w: .6 }, { mount: 1.9 }),
        I('wc.stall', 3.4, 0, { style: 'service', left: true, c: '#5a7a4a', deco: 'rivets' }), I('wc.stall', 4.7, 0, { style: 'service', c: '#5a7a4a', deco: 'rivets' }),
        WX('wc.deco4', .8, { kind: 'notice', w: 2.3 }, Object.assign({ mount: .9 }, T('The notice', 'Maple Bay Parks Department', ['NOT DRINKING WATER. Underneath, in marker: "then why is it so cold and nice". Underneath that: "PLEASE".', 'The park keeper has added a smiley face and the cleaning rota. The pavilion was last cleaned this morning. It smells of pine soap.']))),
        I('wc.prop4', 1.8, 2.6, { kind: 'leaves' }, { solid: false }),
      ],
      exits: [{ x: 2.4, y: 3.5 }] } },

  /* ---- Gull Point Lighthouse: the keeper's head. Whitewashed boards, a teak ship's washstand, a porthole stall, the tide chart and a ship in a bottle ---- */
  { venue: 'lighthouse', id: 'lighthouse:wc', back: 'Back to the cottage',
    def: { name: 'The Keeper\'s Head', w: 4, d: 4, music: 'quiet', floor: GT.f_wood, wall: { color: '#efe9da', pattern: 'planks', trim: '#2a4a6a', rail: 1.0, h: 2.6 },
      items: [
        I('wc.floor4', 0, 0, { style: 'boards', w: 4, d: 4, c: '#9a7a5a' }),
        I('wc.basin4', .3, 0, { style: 'washstand' }), WY('wc.glass4', .35, { kind: 'oval', c: BRASS }, { mount: 1.2 }),
        I('wc.stall', 2.7, 0, { style: 'nook', left: true, c: '#2a4a6a', deco: 'porthole' }), WX('wc.deco4', 2.1, { kind: 'tide' }, { mount: .9 }),
        WX('wc.deco4', .9, { kind: 'bottle' }, Object.assign({ mount: .9 }, T('The ship in a bottle', 'The keeper', ['A ship in a bottle, the old mail boat. The keeper built it over one long winter. The sails took a month, the cork took a minute.', 'Pencilled on the shelf: "Flush gently, the pipes go all the way down the rock."']))),
      ],
      exits: [{ x: 1.6, y: 3.5 }] } },

  /* ---- the Gilded Gull: wine-red flock carpet, white marble with gold taps, black and brass stalls, a basket of rolled linen hand towels ---- */
  { venue: 'restaurant', id: 'restaurant:wc', back: 'Back to the dining room', door: { kind: 'auto' },
    def: { name: 'The Gilded Gull Restroom', w: 6, d: 4, music: 'quiet', floor: GT.f_carpet, wall: { color: '#5a3040', pattern: 'stripes', color2: '#4e2836', trim: BRASS, rail: 1.0, h: 3.0 },
      items: [
        I('wc.floor4', 0, 0, { style: 'flock', w: 6, d: 4 }),
        I('wc.basin4', .3, 0, { style: 'gull', c: '#2a1a20' }), WY('wc.glass4', .35, { kind: 'oval', c: BRASS }, { mount: 1.2 }), WY('wc.glass4', 1.25, { kind: 'oval', c: BRASS }, { mount: 1.2 }),
        I('wc.stall', 3.3, 0, { style: 'deco', left: true }), I('wc.stall', 4.7, 0, { style: 'deco' }),
        WX('wc.deco4', 1.0, { kind: 'towels', w: 1.4 }, Object.assign({ mount: .6 }, T('The linen towels', 'The Gilded Gull', ['Rolled linen hand towels in a basket, each one ironed. Use one, drop it in the hamper, feel briefly like royalty.']))),
      ],
      exits: [{ x: 2.2, y: 3.5 }] } },

  /* ---- Maplewood Elementary: child-height basins in bright tiles, a confetti floor, little cubicles, the hand-washing song ---- */
  { venue: 'school_classroom', id: 'school:wc', back: 'Back to Room 4', door: { kind: 'auto' },
    def: { name: 'School Restrooms', w: 6, d: 4, music: 'quiet', floor: GT.f_lino, wall: { color: '#f4f0e8', pattern: 'tile', trim: '#4ac0e0', rail: .9, h: 2.8 },
      items: [
        I('wc.floor4', 0, 0, { style: 'kids', w: 6, d: 4 }),
        I('wc.basin4', .3, 0, { style: 'kids' }), WY('wc.glass4', .4, { kind: 'plain', c: '#f2c230', w: 1.8 }, { mount: .95 }),
        I('wc.stall', 3.3, 0, { style: 'gym', left: true, c: '#4ac0e0', n: 1 }), I('wc.stall', 4.5, 0, { style: 'gym', c: '#9ccc4a', n: 2 }),
        WX('wc.deco4', 1.0, { kind: 'song', w: 1.5 }, Object.assign({ mount: .7 }, T('The hand-washing song', 'Room 4', ['WASH AND SING! Twenty seconds: the alphabet song, twice through. You hum it. You are an adult. You hum it anyway.', 'A gold star sticker next to the song, and a drawing of a very happy bar of soap.']))),
      ],
      exits: [{ x: 2.4, y: 3.5 }] } },

  /* ---- Fire Station No. 2: the crew's washroom. Red quarry tile, a steel scrub sink, steel stalls with a red band, the station's old brass pole and a helmet ---- */
  { venue: 'fire_station', id: 'fire_station:wc', back: 'Back to the station', door: { kind: 'auto' },
    def: { name: 'Fire Station Washroom', w: 6, d: 4, music: 'quiet', floor: GT.f_tile, wall: { color: '#e4d8c0', pattern: 'brick', trim: '#c8343a', rail: 1.0, h: 3.0 },
      items: [
        I('wc.floor4', 0, 0, { style: 'redtile', w: 6, d: 4 }),
        I('wc.basin4', .3, 0, { style: 'fire' }), WY('wc.glass4', .3, { kind: 'polished' }, { mount: 1.25 }),
        I('wc.stall', 3.3, 0, { style: 'service', left: true, deco: 'band' }), I('wc.stall', 4.6, 0, { style: 'service', deco: 'band' }),
        WX('wc.deco4', 1.0, { kind: 'pole' }, Object.assign({ mount: .6 }, T('The old pole', 'Fire Station No. 2', ['A framed photo of the station\'s first brass pole, 1931. Two spare helmets hang beside it, in case anyone is called out mid-wash.', 'Chalked on the frame: "Fastest turnout: 41 seconds. Fastest hand wash: also 41 seconds. Do better."']))),
        I('wc.prop4', .3, 2.6, { kind: 'helmet', c: '#f2c230' }, { solid: false }),
      ],
      exits: [{ x: 2.4, y: 3.5 }] } },
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

  /* ---- (c) City Hall: a grand public washroom of 1891: marble, oak stalls with high cisterns, a maple-leaf medallion, the first mayor watching ---- */
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
  { venue: 'hotel', id: 'hotel:wc', back: 'Leave the powder room', also: ['hotel_ballroom', 'hotel_spa', 'hotel_restaurant', 'hotel_bar'],   // restaurant + bar: batch 4
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
  { venue: 'natatorium:leisure', id: 'natatorium:wc', back: 'Back to the pool', also: ['natatorium:change'],
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
  { venue: 'cinema', id: 'cinema:wc', back: 'Back to the cinema', also: ['cinema:screen1'], door: { kind: 'auto' },
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
  { venue: 'observatory', id: 'observatory:wc', back: 'Back to the observatory', also: ['observatory:planetarium'], door: { kind: 'auto' },
    def: { name: 'Observatory Restroom', w: 5, d: 4, music: 'quiet', floor: GT.f_darkwood, wall: { color: '#1c2448', trim: '#c9a35a', h: 3.0 },
      items: [
        I('wc.floor3', 0, 0, { style: 'obs', w: 5, d: 4 }),
        I('wc.basin3', .4, 0, { style: 'obs' }), WY('wc.glass3', .45, { kind: 'round', c: BRASS }, { mount: 1.25 }), WY('wc.deco3', 1.4, { kind: 'redlight', w: 1.0 }, { mount: .35 }),
        I('wc.stall', 3.7, 0, { style: 'obs', left: true }), WX('wc.deco3', .7, { kind: 'starmap', w: 1.6 }, { mount: .8 }),
      ],
      exits: [{ x: 2.2, y: 3.5 }] } },

  /* ---- one shared layout for five small coffee and tea places (see nook() below) ---- */
  ...NOOKS,
  /* ---- batch 4: one-off venues, the post office layout (five branches), the shared shop restroom (ten clothing + thirteen home-goods stores) ---- */
  ...ONE4, ...POSTS, ...SHOPS,
];
