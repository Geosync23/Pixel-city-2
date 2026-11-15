// Home-goods store rooms, part 2 (goods:attic, goods:warp, goods:copper, goods:nord, goods:kestrel, goods:sleepy, goods:spoke) + init(): builds every store room
// from SPECS (part 1 in goods_stores.js) with goods_lib.js storeRoom().
import { GT } from '../../engine/world.js';
import { storeRoom, F, WY, WX, HL, SIGNY, HANG } from './goods_lib.js';
import { SPECS } from './goods_stores.js';

const def = s => { SPECS.push(s); return s; };

/* 7. THE GILDED ATTIC — antiques & thrift: crammed rows, walls hung edge to edge, a rocking horse of a till */
def({ id: 'goods:attic', w: 17, d: 14, floor: GT.f_darkwood, wall: { color: '#6a5446', pattern: 'planks', trim: '#d9b65c', h: 3 }, zoom: 1,
  exit: { x: 8.5, y: 13.5 }, counter: { x: 13, y: 12, p: { name: 'GILDED ATTIC', c: '#5a3f3a' } },
  items: [SIGNY(6, 'THE GILDED ATTIC', '#5a3f3a', '#e8c878', 2.45), HL(4, 4, 'bulb'), HL(9, 4, 'bulb'), HL(14, 5, 'bulb'), HL(5, 9, 'bulb'), HL(11, 9, 'bulb'), F('pshop.thrift.bins', 1, 12), F('pshop.crate', 10.5, 12)],
  zones: [
    { k: 'wall', wall: 'y', from: .5, to: 16.5, take: {}, gap: .25 }, { k: 'wall', wall: 'x', from: .5, to: 11, take: {}, gap: .25 },
    { k: 'rows', x: 1.5, y: 1.5, w: 15, d: 4, take: { cat: BIGC() }, aisle: 1, gap: .25 },
    { k: 'table', x: 1.5, y: 6.5, w: 4, d: .5, take: {} }, { k: 'table', x: 6, y: 6.5, w: 4, d: .5, asset: 'goods.dtable', p: { top: '#9c6a3e', c: '#5a3f3a' }, take: {} }, { k: 'table', x: 10.5, y: 6.5, w: 4, d: .5, take: {} },
    { k: 'rows', x: 1.5, y: 8, w: 15, d: 3.5, take: {}, aisle: 1, gap: .25 },
  ] });
function BIGC() { return ['seating', 'tables', 'beds', 'storage', 'music', 'electronics']; }

/* 8. WARP & WEFT — rugs and textiles: rugs laid out on the floor to walk on, rolls stacked, a hanging wall */
def({ id: 'goods:warp', w: 15, d: 13, floor: GT.f_wood, wall: { color: '#f2e4cc', pattern: 'plain', trim: '#7a3a4a', h: 3 }, zoom: 1,
  exit: { x: 7.5, y: 12.5 }, counter: { x: 11.5, y: 11, p: { name: 'WARP & WEFT', c: '#7a3a4a' } },
  items: [SIGNY(5, 'WARP & WEFT  RUGS', '#7a3a4a', '#f4e4c8', 2.45), F('homegoods.rugrolls', 13.5, 1.5), F('homegoods.rugrolls', 13.5, 3), F('homegoods.rugrolls', 13.5, 4.5), HL(4, 5, 'lantern', '#e8a050'), HL(10, 5, 'lantern', '#e8a050')],
  zones: [
    { k: 'wall', wall: 'y', from: .5, to: 13, take: {} }, { k: 'wall', wall: 'x', from: .5, to: 10, take: {} },
    { k: 'flat', x: 1.5, y: 1.5, w: 11.5, d: 7, take: {}, gap: .5 },
    { k: 'rows', x: 1.5, y: 9, w: 9, d: 2, take: {}, aisle: 1 },
    { k: 'table', x: 1.5, y: 9, w: 3, d: .5, take: {} },
  ] });

/* 9. COPPER PAN — kitchen & homeware: long tables of small appliances, kitchen units along the back */
def({ id: 'goods:copper', w: 15, d: 12, floor: GT.f_check, wall: { color: '#f4ece0', pattern: 'tile', trim: '#b9653a', h: 3 }, zoom: 1,
  exit: { x: 7.5, y: 11.5 }, counter: { x: 2, y: 10, p: { name: 'COPPER PAN', c: '#b9653a' } },
  items: [SIGNY(5.5, 'COPPER PAN KITCHEN CO.', '#b9653a', '#fff3dc', 2.45), F('pshop.hanging', 4, 7, { kind: 'salami' }), HL(7.5, 4, 'shade', '#b9653a'), HL(7.5, 8, 'shade', '#b9653a')],
  zones: [
    { k: 'wall', wall: 'x', from: .5, to: 8.5, take: {} },
    { k: 'rows', x: 1.5, y: .5, w: 13, d: 2.5, take: { place: ['floor'] }, aisle: 1, gap: .25 },
    { k: 'table', x: 1.5, y: 4, w: 5.5, d: .5, take: {} }, { k: 'table', x: 8, y: 4, w: 5.5, d: .5, take: {} },
    { k: 'table', x: 1.5, y: 6, w: 5.5, d: .5, asset: 'goods.dtable', p: { top: '#c8703a', c: '#3a3640' }, take: {} }, { k: 'table', x: 8, y: 6, w: 5.5, d: .5, take: {} },
    { k: 'rows', x: 1.5, y: 7.5, w: 12.5, d: 2, take: {}, aisle: 1 },
    { k: 'table', x: 8, y: 9.5, w: 3, d: .5, take: {} },
  ] });

/* 10. ATELIER NORD — designer showroom: six quiet room sets on white floors, lots of space */
def({ id: 'goods:nord', w: 20, d: 15, floor: GT.f_concrete, wall: { color: '#f6f4f0', pattern: 'plain', trim: '#c8c4bc', h: 3.2 }, zoom: 0,
  exit: { x: 10, y: 14.5 }, counter: { x: 15.5, y: 13, p: { name: 'ATELIER NORD', c: '#2c2738' } },
  items: [SIGNY(8, 'ATELIER NORD', '#f1eee6', '#2c2738', 2.6), HL(4, 4, 'shade', '#f1eee6'), HL(10, 4, 'shade', '#f1eee6'), HL(16, 4, 'shade', '#f1eee6'), HL(4, 10, 'shade', '#2c2738'), HL(10, 10, 'shade', '#2c2738'), HL(16, 10, 'shade', '#2c2738')],
  zones: [
    { k: 'set', x: .5, y: 0, w: 6, d: 6, take: { cat: ['seating', 'tables', 'lighting', 'plants'], place: ['floor'] }, wall: { c: '#d8d2c8', pat: 'panel' }, floor: GT.f_wood },
    { k: 'set', x: 7, y: 0, w: 6, d: 6, take: { cat: ['beds', 'storage', 'lighting'], place: ['floor'] }, wall: { c: '#39456f', pat: 'panel', c2: '#d9b65c' }, floor: GT.f_carpet },
    { k: 'set', x: 13.5, y: 0, w: 6, d: 6, take: { cat: ['seating', 'tables', 'decor'], place: ['floor'] }, wall: { c: '#8fae7e', pat: 'stripe' }, floor: GT.f_wood },
    { k: 'set', x: .5, y: 7, w: 6, d: 5.5, take: { cat: ['tables', 'seating', 'kitchen'], place: ['floor'] }, wall: { c: '#e8c8b8' }, floor: GT.f_wood },
    { k: 'set', x: 7, y: 7, w: 6, d: 5.5, take: { place: ['floor'] }, wall: { c: '#2c2738', pat: 'panel', c2: '#f1eee6' }, floor: GT.f_darkwood },
    { k: 'wall', wall: 'x', from: .5, to: 12, take: {} },
    { k: 'rows', x: 14, y: 7, w: 5.5, d: 5, take: {}, aisle: 1 },
  ] });

/* 11. KESTREL & PINE — mid-century showroom: teak, sunburst walls, three living rooms in a row */
def({ id: 'goods:kestrel', w: 18, d: 14, floor: GT.f_wood, wall: { color: '#f2e2b8', pattern: 'planks', trim: '#9c6a3e', h: 3 }, zoom: 1,
  exit: { x: 9, y: 13.5 }, counter: { x: 14, y: 12, p: { name: 'KESTREL & PINE', c: '#9c6a3e' } },
  items: [SIGNY(6.5, 'KESTREL & PINE', '#9c6a3e', '#f2e2b8', 2.45), HL(3, 4, 'shade', '#dba63c'), HL(9, 4, 'shade', '#3f8f8a'), HL(15, 4, 'shade', '#dba63c'), HL(9, 10, 'shade', '#b9653a')],
  zones: [
    { k: 'set', x: .5, y: 0, w: 5.5, d: 6, take: { place: ['floor'], notCat: ['beds'] }, wall: { c: '#dba63c' }, floor: GT.f_carpet },
    { k: 'set', x: 6.5, y: 0, w: 5.5, d: 6, take: { place: ['floor'] }, wall: { c: '#3f8f8a', pat: 'stripe' }, floor: GT.f_carpet },
    { k: 'set', x: 12.5, y: 0, w: 5.5, d: 6, take: { place: ['floor'] }, wall: { c: '#b9653a' }, floor: GT.f_carpet },
    { k: 'wall', wall: 'x', from: 6.5, to: 12, take: {} },
    { k: 'table', x: 1.5, y: 7, w: 4, d: .5, asset: 'goods.dtable', p: { top: '#9c6a3e', c: '#3a3640' }, take: {} },
    { k: 'rows', x: 1.5, y: 8.5, w: 16, d: 3, take: {}, aisle: 1 },
    { k: 'rows', x: 6, y: 7, w: 11.5, d: 1.5, take: {}, aisle: .5 },
  ] });

/* 12. SLEEPYHEAD — beds and linen: a dormitory of display beds, pillows on the tables */
def({ id: 'goods:sleepy', w: 18, d: 14, floor: GT.f_carpet, wall: { color: '#e8ecf8', pattern: 'stripes', color2: '#dfe4f4', trim: '#6a7ab8', h: 3 }, zoom: 0,
  exit: { x: 9, y: 13.5 }, counter: { x: 2, y: 12, p: { name: 'SLEEPYHEAD', c: '#6a7ab8' } },
  items: [SIGNY(6, 'SLEEPYHEAD  BEDS & LINEN', '#6a7ab8', '#f4f0ff', 2.45), HL(4, 5, 'shade', '#f4f0ff'), HL(10, 5, 'shade', '#f4f0ff'), HL(15, 5, 'shade', '#f4f0ff'), HL(9, 10, 'chandelier')],
  zones: [
    { k: 'wall', wall: 'y', from: .5, to: 17.5, take: {} }, { k: 'wall', wall: 'x', from: .5, to: 10, take: {} },
    { k: 'rows', x: 1.5, y: 1.5, w: 16, d: 7, take: { cat: ['beds'] }, aisle: 1, gap: .5 },
    { k: 'table', x: 1.5, y: 9.5, w: 4, d: .5, take: {} },
    { k: 'rows', x: 6, y: 9.5, w: 11.5, d: 2.5, take: {}, aisle: 1, gap: .5 },
  ] });

/* 13. SPOKE & STRUM — hobby shop: a bike row, a guitar wall, boards, fitness corner */
def({ id: 'goods:spoke', w: 18, d: 14, floor: GT.f_lino, wall: { color: '#f4ece0', pattern: 'brick', trim: '#c8574d', h: 3 }, zoom: 0,
  exit: { x: 9, y: 13.5 }, counter: { x: 14, y: 12, p: { name: 'SPOKE & STRUM', c: '#c8574d' } },
  items: [SIGNY(6, 'SPOKE & STRUM', '#c8574d', '#fff8e0', 2.45), HANG(3, 2, 'BIKES & BOARDS', '#c8574d'), HANG(12, 2, 'MUSIC', '#c8574d'), HANG(3, 9, 'PLAY & MAKE', '#c8574d'), F('pshop.hanging', 9, 6, { kind: 'kite' }), F('pshop.hanging', 6, 7, { kind: 'plane' })],
  zones: [
    { k: 'wall', wall: 'y', from: .5, to: 17.5, take: {} }, { k: 'wall', wall: 'x', from: .5, to: 11, take: {} },
    { k: 'rows', x: 1.5, y: 1.5, w: 8, d: 5.5, take: { cat: ['hobby'], art: ['g.hobby'] }, aisle: 1, gap: .25 },
    { k: 'rows', x: 10.5, y: 1.5, w: 7, d: 5.5, take: { cat: ['music', 'electronics'] }, aisle: 1, gap: .25 },
    { k: 'table', x: 1.5, y: 8, w: 4, d: .5, take: {} },
    { k: 'rows', x: 1.5, y: 9, w: 16, d: 2.5, take: {}, aisle: 1, gap: .25 },
    { k: 'rows', x: 6, y: 8, w: 11.5, d: 1, take: {}, aisle: .5 },
  ] });

export const ROOM_DEFS = {};
export function init() { for (const s of SPECS) { try { ROOM_DEFS[s.id] = storeRoom(s); } catch (e) { console.warn('goods room', s.id, e); } } }
