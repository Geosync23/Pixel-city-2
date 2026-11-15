// The home-goods store rooms (Wave C). Room id = store id (data/goods.js STORES): goods:timber, goods:fjord, goods:bellwether, goods:lumen, goods:voltaic, goods:loam,
// goods:attic, goods:warp, goods:copper, goods:nord, goods:kestrel, goods:sleepy, goods:spoke. City doors: src/sim/goods_city.js. Shopping: src/sim/goods.js.
// Layout engine + zone kinds: goods_lib.js. Each room: one counter (till -> the store's full catalogue in the buy menu, delivered), a front exit mat, the rest is
// the shop floor where every piece on display is tappable (inspect / colours / buy / try).
import { GT } from '../../engine/world.js';
import { storeRoom, F, WY, WX, HL, SIGNY, HANG } from './goods_lib.js';

const BIG = ['seating', 'tables', 'beds', 'storage'];
export const SPECS = [];
const def = s => { SPECS.push(s); return s; };

/* 1. TIMBER & TROWEL — big-box home centre: racking along the back, numbered aisles, a garden centre on the right, trolleys at the door */
def({ id: 'goods:timber', w: 32, d: 24, floor: GT.f_concrete, wall: { color: '#e8e4dc', pattern: 'plain', trim: '#e0662e', h: 3.6, rail: 2.6 }, zoom: 0,
  floors: [{ x0: 23, y0: 0, x1: 32, y1: 24, floor: GT.f_stone }, { x0: 0, y0: 20, x1: 23, y1: 24, floor: GT.f_lino }],
  exit: { x: 14, y: 23.5 }, counter: { x: 3, y: 21, p: { name: 'TILLS', c: '#e0662e' } },
  items: [
    ...[1, 5, 9, 13, 17].map((x, i) => F('goods.racking', x, 0, { w: 4, seed: 3 + i * 7 })),
    F('pshop.hw.lumber', 21, 0), F('pshop.hw.lumber', 22, 0), WY('pshop.hw.pegwall', 25, null, .9), WY('pshop.hw.pegwall', 28, null, .9),
    SIGNY(8, 'TIMBER & TROWEL HOME CENTRE', '#2f5a48', '#fff8e0', 2.95), SIGNY(25.5, 'GARDEN CENTRE', '#3f8a55', '#e8f4d8', 2.6),
    HANG(5, 3.5, 'AISLE 1  BATH & KITCHEN', '#e0662e'), HANG(5, 9.5, 'AISLE 2  STORAGE & FURNITURE', '#e0662e'), HANG(5, 15.5, 'AISLE 3  LIGHTS & DECOR', '#e0662e'),
    F('goods.cart', 20, 21.5), F('goods.cart', 20.5, 21.5), F('goods.cart', 21, 21.5, { c: '#3a5f9a' }), F('pshop.hw.paint', 7, 21), F('pshop.hw.paint', 8.5, 21), F('pshop.hw.rope', 10, 21),
    F('goods.pallet', 1, 17.5), F('goods.pallet', 1, 13, { seed: 7, c: '#d8c6a4' }), HL(26, 12, 'tube'), HL(29, 18, 'tube'), HL(12, 6, 'tube'), HL(12, 12, 'tube'), HL(12, 18, 'tube'),
  ],
  zones: [
    { k: 'wall', wall: 'y', from: 24, to: 31, take: { cat: ['plants', 'outdoor', 'wall'] }, mount: 1.2, gap: .5 },
    { k: 'rows', x: 24, y: 1.5, w: 7.5, d: 21, take: { cat: ['outdoor', 'plants'] }, aisle: 1.5 },
    { k: 'rows', x: 2, y: 1.5, w: 20, d: 4.5, take: { cat: ['bath', 'kitchen'] }, aisle: 1.5 },
    { k: 'rows', x: 2, y: 7.5, w: 20, d: 5, take: { cat: ['storage', 'seating', 'tables', 'beds'] }, aisle: 1.5 },
    { k: 'table', x: 3, y: 13.5, w: 4, d: .5, take: {} }, { k: 'flat', x: 8, y: 13.5, w: 6, d: 2.5, take: {} },
    { k: 'rows', x: 3, y: 16.5, w: 16, d: 3, take: {}, aisle: 1 },
    { k: 'rows', x: 15, y: 13.5, w: 7, d: 2.5, take: {}, aisle: 1 },
  ] });

/* 2. FJORD & FOLD — flat-pack warehouse store: room sets on the showroom loop (follow the arrows), the market hall, then the self-serve racking */
def({ id: 'goods:fjord', w: 28, d: 22, floor: GT.f_lino, wall: { color: '#f4f0e8', pattern: 'plain', trim: '#3f6fb0', h: 3.2 }, zoom: 0,
  floors: [{ x0: 0, y0: 15, x1: 28, y1: 22, floor: GT.f_concrete }],
  exit: { x: 25, y: 21.5 }, counter: { x: 20, y: 19.5, p: { name: 'FJORD', c: '#3f6fb0' } },
  items: [
    SIGNY(10, 'SHOWROOM  >  MARKET HALL  >  SELF SERVE', '#3f6fb0', '#f2c230', 2.6),
    ...[[3, 7.5, 0], [8, 7.5, 0], [13, 7.5, 0], [18, 7.5, 0], [23, 7.5, 1], [23, 13, 1]].map(([x, y, d]) => F('goods.arrow', x, y, { dir: d, c: '#f2c230' })),
    F('goods.racking', 1, 18, { w: 4, seed: 11 }), F('goods.racking', 6, 18, { w: 4, seed: 12 }), F('goods.racking', 11, 18, { w: 4, seed: 13 }), F('goods.pallet', 15.5, 18.5), F('goods.pallet', 15.5, 20, { seed: 9 }),
    F('goods.cart', 26, 18), F('goods.cart', 26.5, 18, { c: '#3a5f9a' }), HANG(4, 16.5, 'SELF SERVE', '#f2c230', '#3f6fb0'), HANG(10, 10, 'MARKET HALL', '#3f6fb0', '#f2c230'),
    HL(5, 4, 'shade', '#f2c230'), HL(11, 4, 'shade', '#f4f0e8'), HL(17, 4, 'shade', '#f2c230'), HL(23, 4, 'shade', '#f4f0e8'),
  ],
  zones: [
    { k: 'set', x: 1, y: 0, w: 5.5, d: 7, take: { cat: ['seating', 'tables', 'lighting'], place: ['floor'] }, wall: { c: '#dfe8f2', pat: 'stripe' } },
    { k: 'set', x: 7, y: 0, w: 5.5, d: 7, take: { cat: ['beds', 'storage'], place: ['floor'] }, wall: { c: '#f2e2c8', pat: 'dots' } },
    { k: 'set', x: 13, y: 0, w: 5.5, d: 7, take: { cat: ['kitchen', 'tables', 'seating'], place: ['floor'] }, wall: { c: '#e2efd8', pat: 'panel' } },
    { k: 'set', x: 19, y: 0, w: 5.5, d: 7, take: { cat: ['seating', 'storage', 'electronics', 'fitness', 'bath'], place: ['floor'] }, wall: { c: '#f4dcdc' } },
    { k: 'wall', wall: 'x', from: 8, to: 15, take: {} },
    { k: 'table', x: 2, y: 9, w: 5, d: .5, take: {} }, { k: 'table', x: 2, y: 11.5, w: 5, d: .5, take: {} }, { k: 'table', x: 2, y: 14, w: 5, d: .5, take: {} },
    { k: 'flat', x: 8.5, y: 9, w: 6, d: 5.5, take: {} },
    { k: 'rows', x: 15.5, y: 9, w: 6.5, d: 6, take: {}, aisle: 1 },
    { k: 'rows', x: 25, y: 1, w: 2.5, d: 15, take: {}, aisle: 1 },
  ] });

/* 3. BELLWETHER — department store: five departments under hanging signs on a red carpet, chandeliers */
def({ id: 'goods:bellwether', w: 26, d: 20, floor: GT.f_wood, wall: { color: '#efe2cc', pattern: 'stripes', color2: '#e6d4b6', trim: '#39456f', h: 3.2, rail: 1 }, zoom: 0,
  floors: [{ x0: 11, y0: 0, x1: 14, y1: 20, floor: GT.f_carpet }, { x0: 0, y0: 9, x1: 26, y1: 11, floor: GT.f_carpet }],
  exit: { x: 12.5, y: 19.5 }, counter: { x: 15, y: 17.5, p: { name: 'BELLWETHER', c: '#39456f' } },
  items: [
    SIGNY(10.5, 'BELLWETHER  EST. 1911', '#39456f', '#f2d27a', 2.6),
    HANG(3, 2, 'HOME', '#39456f', '#f2d27a'), HANG(17, 2, 'BED & BATH', '#39456f', '#f2d27a'), HANG(3, 12, 'KITCHEN & DINING', '#39456f', '#f2d27a'), HANG(17, 12, 'LIGHTING & GIFTS', '#39456f', '#f2d27a'),
    HL(12.5, 4, 'chandelier'), HL(12.5, 14, 'chandelier'), HL(6, 10, 'chandelier'), HL(20, 10, 'chandelier'), F('generic.plant', 11, 18.5, { kind: 'palm', s: 1.5, pot: '#f1ede4' }), F('generic.plant', 14.5, 18.5, { kind: 'palm', s: 1.5, pot: '#f1ede4' }),
  ],
  zones: [
    { k: 'wall', wall: 'y', from: 1, to: 10.5, take: { cat: ['wall', 'lighting'] } },
    { k: 'wall', wall: 'y', from: 14.5, to: 25.5, take: { cat: ['wall', 'bath', 'lighting', 'plants'] } },
    { k: 'wall', wall: 'x', from: 11.5, to: 19, take: {} },
    { k: 'set', x: 1.5, y: 1.5, w: 9, d: 7.5, take: { cat: ['seating', 'tables', 'storage', 'rugs', 'plants', 'decor', 'lighting'], place: ['floor'] }, wall: null },
    { k: 'rows', x: 15, y: 1.5, w: 10.5, d: 7.5, take: { cat: ['beds', 'bath', 'storage'] }, aisle: 1 },
    { k: 'table', x: 2, y: 12, w: 4, d: .5, take: { cat: ['kitchen'] } }, { k: 'table', x: 6.5, y: 12, w: 4, d: .5, take: { cat: ['kitchen', 'decor'] } },
    { k: 'rows', x: 1.5, y: 13.5, w: 9, d: 6, take: { cat: ['kitchen', 'tables', 'seating', 'electronics', 'storage'] }, aisle: 1 },
    { k: 'table', x: 15, y: 12, w: 4, d: .5, take: { cat: ['lighting', 'decor'] } }, { k: 'table', x: 19.5, y: 12, w: 5, d: .5, take: {} },
    { k: 'rows', x: 18.5, y: 13.5, w: 7, d: 6, take: {}, aisle: 1 },
  ] });

/* 4. LUMEN — the lighting shop: dark walls, every lamp switched on */
def({ id: 'goods:lumen', w: 15, d: 12, floor: GT.f_darkwood, wall: { color: '#2c2738', pattern: 'plain', trim: '#d9b65c', h: 3 }, zoom: 1,
  exit: { x: 7.5, y: 11.5 }, counter: { x: 11.5, y: 10, p: { name: 'LUMEN', c: '#2c2738' } },
  items: [SIGNY(5.5, 'LUMEN  LIGHTING', '#2c2738', '#ffe6a0', 2.45), HL(4, 5, 'chandelier'), HL(10, 5, 'chandelier'), HL(7, 8, 'lantern', '#f2c230'), HL(3, 9, 'shade', '#c8574d'), HL(12, 7, 'shade', '#3f8f8a')],
  zones: [
    { k: 'wall', wall: 'y', from: .5, to: 14.5, take: {}, gap: .5 }, { k: 'wall', wall: 'x', from: .5, to: 10, take: {}, gap: .5 },
    { k: 'rows', x: 1.5, y: 1.5, w: 13, d: 3.5, take: { place: ['floor'] }, aisle: 1, gap: .5 },
    { k: 'table', x: 2, y: 6.5, w: 5, d: .5, take: {} }, { k: 'table', x: 8, y: 6.5, w: 5, d: .5, take: {} },
    { k: 'rows', x: 1.5, y: 8.5, w: 13, d: 1.5, take: {}, aisle: 1 },
  ] });

/* 5. VOLTAIC — electronics: a lit screen wall, consoles and arcade cabinets to the right, gadget tables */
def({ id: 'goods:voltaic', w: 17, d: 13, floor: GT.f_tile, wall: { color: '#e8ecf0', pattern: 'tile', trim: '#1f2a44', h: 3 }, zoom: 1,
  exit: { x: 8.5, y: 12.5 }, counter: { x: 12.5, y: 11, p: { name: 'VOLTAIC', c: '#1f2a44' } },
  items: [WY('goods.tvwall', 1, { w: 9, text: 'SCREENS', hc: '#1f2a44' }, 0), SIGNY(11, 'VOLTAIC', '#1f2a44', '#58d8f8', 2.4), HL(4, 6, 'tube', '#d8f4fc'), HL(10, 6, 'tube', '#d8f4fc'), HL(14, 3, 'tube', '#d8f4fc')],
  zones: [
    { k: 'rows', x: 1.5, y: .5, w: 9, d: 2.5, take: { tag: ['tv'] }, aisle: 1, gap: .5 },
    { k: 'wall', wall: 'x', from: 4, to: 12, take: {} }, { k: 'wall', wall: 'y', from: 11, to: 16.5, take: {} },
    { k: 'rows', x: 11, y: 1.5, w: 5.5, d: 8, take: { tag: ['game', 'music', 'computer'] }, aisle: 1 },
    { k: 'table', x: 2, y: 4.5, w: 4, d: .5, take: {} }, { k: 'table', x: 6.5, y: 4.5, w: 4, d: .5, take: {} },
    { k: 'rows', x: 1.5, y: 6, w: 9, d: 4.5, take: {}, aisle: 1 },
  ] });

/* 6. LEAF & LOAM — plant house: slatted benches, big plants in rows, hanging baskets */
def({ id: 'goods:loam', w: 15, d: 13, floor: GT.f_stone, wall: { color: '#dfeeda', pattern: 'planks', trim: '#2f6a48', h: 3 }, zoom: 1,
  floors: [{ x0: 0, y0: 10, x1: 15, y1: 13, floor: GT.f_wood }],
  exit: { x: 7.5, y: 12.5 }, counter: { x: 2, y: 11, p: { name: 'LEAF&LOAM', c: '#2f6a48' } },
  items: [SIGNY(5, 'LEAF & LOAM', '#2f6a48', '#e8f4d8', 2.45), F('pshop.hanging', 3, 4, { kind: 'basket' }), F('pshop.hanging', 7, 4, { kind: 'basket' }), F('pshop.hanging', 11, 4, { kind: 'basket' }), F('pshop.hanging', 5, 8, { kind: 'basket' }), F('pshop.hanging', 9, 8, { kind: 'basket' }), F('pshop.flower.buckets', 12.5, 11)],
  zones: [
    { k: 'wall', wall: 'y', from: .5, to: 14.5, take: {}, mount: 1.3 }, { k: 'wall', wall: 'x', from: .5, to: 9, take: {}, mount: 1.3 },
    { k: 'rows', x: 1.5, y: 1.5, w: 13, d: 3, take: { cat: ['plants'], place: ['floor'] }, aisle: 1, gap: .5 },
    { k: 'table', x: 1.5, y: 5.5, w: 4, d: .5, h: .62, asset: 'goods.bench', p: { d: .5 }, take: {} }, { k: 'table', x: 6, y: 5.5, w: 4, d: .5, h: .62, asset: 'goods.bench', p: { d: .5 }, take: {} }, { k: 'table', x: 10.5, y: 5.5, w: 4, d: .5, h: .62, asset: 'goods.bench', p: { d: .5 }, take: {} },
    { k: 'rows', x: 1.5, y: 7, w: 13, d: 3, take: {}, aisle: 1 },
  ] });
