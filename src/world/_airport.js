// Maple Bay International: runway, taxiway, apron, terminal row, drop-off curb, car park, tower, hangars, fence.
import { GT, W } from './_ctx.js';
import { WHITE, YELLOW } from './_roads.js';

export const AP = { rw: { axis: 'x', c: 28, a: 276, b: 380, z: 3, width: 12 }, apron: { x0: 288, y0: 50, x1: 372, y1: 90 }, curb: { x: 321, y: 102.6 }, hall: { x: 316, y: 90, w: 20 } };
export function ground(c) {
  const w = c.world, P = c.paint, rw = AP.rw;
  P(274, 6, 384, 101, GT.grass, 6);
  P(rw.a, rw.c - 6, rw.b, rw.c + 6, GT.tarmac, 6); P(280, 44, 378, 50, GT.tarmac, 6); P(282, 34, 290, 44, GT.tarmac, 6); P(366, 34, 374, 44, GT.tarmac, 6); P(322, 34, 330, 44, GT.tarmac, 6);
  P(AP.apron.x0, AP.apron.y0, AP.apron.x1, AP.apron.y1, GT.concrete, 6); P(276, 56, 288, 100, GT.concrete, 6); P(353, 90, 382, 100, GT.concrete, 6); P(300, 90, 304, 100, GT.concrete, 6);
  P(298, 100, 358, 102, GT.plaza, 6); P(308, 110, 344, 119, GT.asphalt, 6); P(308, 119, 344, 126, GT.plaza, 6);
  P(276, 102, 298, 126, GT.sidewalk); P(354, 102, 373, 126, GT.sidewalk);
  // runway paint
  const M = c.mark; for (let x = rw.a + 14; x < rw.b - 14; x += 6) M(x, rw.c - .15, x + 3, rw.c + .15, WHITE);
  for (const x0 of [rw.a + 2, rw.b - 6]) for (let k = -5; k <= 4.5; k += 1.4) M(x0, rw.c + k, x0 + 4, rw.c + k + .7, WHITE);
  M(rw.a, rw.c - 5.6, rw.b, rw.c - 5.45, WHITE); M(rw.a, rw.c + 5.45, rw.b, rw.c + 5.6, WHITE);
  for (const x0 of [rw.a + 20, rw.b - 26]) { M(x0, rw.c - 4, x0 + 5, rw.c - 2.4, WHITE); M(x0, rw.c + 2.4, x0 + 5, rw.c + 4, WHITE); }
  for (let x = 280; x < 378; x += 2) M(x, 46.9, x + 1.4, 47.1, YELLOW); for (const tx of [286, 370, 326]) for (let y = 34; y < 47; y += 2) M(tx - .1, y, tx + .1, y + 1.4, YELLOW);
  for (const gx of [303, 333]) { M(gx, 76, gx + .15, 90, YELLOW); M(gx - 3, 76, gx + 3, 76.15, YELLOW); }
  // terminal row + big buildings
  const h = AP.hall;
  c.bld('bld.airport.terminal.hall', h.x, h.y, { p: { w: h.w, seed: 5, name: 'MAPLE BAY INTL' } }); c.bld('bld.airport.terminal.wing', h.x - 12, h.y + 2, { p: { w: 12, seed: 2 } }); c.bld('bld.airport.terminal.wing', h.x + h.w, h.y + 2, { p: { w: 12, seed: 3 } }); c.bld('bld.airport.terminal.endcap', h.x + h.w + 12, h.y + 2, { p: { seed: 4 } });
  c.bld('bld.airport.tower', 364, 92, { p: c.vp('bld.airport.tower', c.sub(3)) }); c.bld('bld.airport.fire', 356, 80, { p: { w: 10, seed: 2 } }); c.bld('bld.airport.radome', 376, 62, { p: { h: 4, seed: 1 } });
  c.bld('bld.airport.hangar.arch', 276, 58, { p: { w: 10, d: 12, seed: 3, open: true }, flip: true }); c.bld('bld.airport.hangar.box', 276, 72, { p: { w: 12, d: 8, seed: 4, name: 'BAYJET' } }); c.bld('bld.airport.cargo', 276, 84, { p: { w: 14, d: 8, seed: 2 } });
  c.bld('bld.airport.fueltanks', 290, 36, { p: { n: 2 } });
  c.bld('bld.airport.carpark', 280, 112, { p: { w: 16, d: 10, floors: 3, seed: 2 } }); c.bld('bld.airport.rental', 291, 104, { p: c.vp('bld.airport.rental', c.sub(4)) });
  const ht = c.bld('bld.airport.hotel', 357, 112, { p: { w: 12, d: 7, floors: 6, seed: 3, name: 'SKYWAY INN' } });
  w.airport = { runways: [{ ...rw }], apron: { ...AP.apron }, taxiway: { axis: 'x', c: 47, a: 280, b: 378 }, gates: [{ x: 303, y: 66, dir: 1 }, { x: 333, y: 66, dir: 1 }], curb: { ...AP.curb },
    approach: { axis: 'x', c: rw.c, from: 384 + 90, touchdown: rw.b - 24, exit: rw.a + 10, z: 3 }, terminal: { x: h.x - 12, y: h.y, w: h.w + 29, d: 10 } };
  w.parking.push(...lot(c, 309, 110.5, 343, 118.5));
}
/** two facing rows of perpendicular bays with an aisle between; returns spots */
export function lot(c, x0, y0, x1, y1, o = {}) {
  const spots = []; const rows = y1 - y0 >= 8 ? [y0, y1 - 3.6] : [y0];
  for (const y of rows) for (let x = x0; x + 2 <= x1; x += 2) { c.mark(x, y, x + .1, y + 3.5, WHITE); spots.push({ x: x + .25, y: y + .15, axis: 'y', lot: o.name || 'lot' }); if (x + 4 > x1) c.mark(x + 2, y, x + 2.1, y + 3.5, WHITE); }
  return spots;
}
export function build(c) {
  const w = c.world, r = c.sub(21), h = AP.hall, rw = AP.rw;
  c.put('prop.airport.canopy', h.x + 2, h.y + 10, { p: { w: 16, pillars: true, signs: true } });
  c.put('prop.airport.shelter', 340, 100.2, { p: { sign: 'TAXI', w: 4 } }); c.put('prop.airport.shelter', 306, 100.2, { p: { sign: 'BUS', w: 4 } });
  c.put('prop.airport.board', 331, 100.1, { p: { w: 3, seed: 2, title: 'ARRIVALS' } }); c.put('prop.airport.totem', 314, 100.3, { p: c.vp('prop.airport.totem', r) }); c.put('prop.airport.totem', 337.5, 100.3, { p: c.vp('prop.airport.totem', r) });
  for (const [x, y] of [[317, 100.3], [326.5, 100.4], [334.5, 101]]) c.putv('prop.airport.luggage', x, y, r, { free: true }); c.putv('prop.airport.trolleycorral', 310.5, 100.2, r, { free: true }); c.putv('prop.airport.trolley', 328.5, 100.3, r, { free: true });
  for (const x of [300, 345, 352]) c.putv('prop.street.planter.round', x, 100.4, r, { free: true }); c.put('prop.airport.flagpole', 355.5, 100.5, { p: {} }); c.put('prop.airport.flagpole', 298.5, 100.5, { p: {} });
  w.poi({ type: 'spawn', id: 'spawn:airport', x: AP.curb.x, y: AP.curb.y, dir: 1 }); w.poi({ type: 'taxistand', id: 'taxi:airport', name: 'Airport Taxi Stand', x: 342, y: 103.4, lane: { x: 342, y: 105 } });
  w.poi({ type: 'landmark', id: 'lm:airport', name: 'Maple Bay International', x: 326, y: 95 });
  for (const x of [336, 339.6]) c.put('veh.taxi', x, 104.3, { p: { dir: -1, free: true, parked: true } });
  // aircraft + apron life
  const A = (id, x, y, k, o = {}) => { const a = c.has(id) && id; if (!a) return; const vs = c.world && c.tag('airport').find(q => q.id === id).variants || [{}]; c.put(id, x, y, { p: Object.assign({}, vs[k % vs.length], { dir: o.dir || 1, gear: true }), flip: o.flip }); };
  A('veh.airport.airliner', 292, 56, 0); A('veh.airport.airliner', 322, 56, 2); A('veh.airport.turboprop', 350, 54, 1); A('veh.airport.bizjet', 290, 10, 0, { dir: -1 }); A('veh.airport.helicopter', 366, 70, 0);
  c.put('prop.airport.jetbridge', 303.2, 77, { p: { len: 11, gate: 'A1' }, flip: true }); c.put('prop.airport.jetbridge', 333.2, 77, { p: { len: 11, gate: 'A2' }, flip: true });
  const gv = ['veh.airport.baggagetug', 'veh.airport.baggagetrain', 'veh.airport.pushback', 'veh.airport.fueltruck', 'veh.airport.catering', 'veh.airport.stairs', 'veh.airport.followme', 'prop.airport.baggagetug', 'prop.airport.baggagetrain', 'prop.airport.pushback', 'prop.airport.fueltruck', 'prop.airport.catering', 'prop.airport.stairs', 'prop.airport.followme', 'prop.airport.baggagecart', 'veh.airport.baggagecart'].filter(c.has);
  const spots = [[312, 80], [318, 62], [344, 78], [300, 80], [340, 62], [352, 72], [309, 52], [330, 84], [362, 52], [294, 78]]; spots.forEach((s, i) => { if (gv.length) c.putv(gv[i % gv.length], s[0], s[1], r); });
  for (let i = 0; i < 6; i++) c.putv('prop.airport.cones', 296 + r() * 60, 76 + r() * 10, r);
  for (let x = rw.a + 2; x < rw.b - 4; x += 10) { c.put('prop.airport.lights', x, rw.c - 7, { p: { len: 4, color: 'white' } }); c.put('prop.airport.lights', x, rw.c + 6.5, { p: { len: 4, color: 'white' } }); }
  for (let x = 282; x < 376; x += 12) c.put('prop.airport.lights', x, 50.2, { p: { len: 4, color: 'blue' } });
  c.put('prop.airport.lights', rw.a + .5, rw.c - 5, { p: { len: 4, color: 'green' }, flip: true }); c.put('prop.airport.lights', rw.b - 1, rw.c - 5, { p: { len: 4, color: 'red' }, flip: true });
  c.putv('prop.airport.papi', rw.b - 22, rw.c + 8, r); c.putv('prop.airport.windsock', 300, 38, r); c.putv('prop.airport.windsock', 372, 16, r); c.putv('prop.airport.rwysign', 292, 41, r); c.putv('prop.airport.rwysign', 362, 41, r);
  // perimeter fence (landside line + west + north)
  const F = c.first('prop.airport.fence', 'prop.ind.fence'); if (F) { const fx = (x0, x1, y) => { for (let x = x0; x < x1; x += 6) c.put(F, x, y, { p: { len: Math.min(6, x1 - x) } }); }, fy = (y0, y1, x) => { for (let y = y0; y < y1; y += 6) c.put(F, x, y, { p: { len: Math.min(6, y1 - y) }, flip: true }); }; fx(274, 304, 100.6); fx(353, 383, 100.6); fy(6, 100.6, 274); fx(274, 383, 6); }
  for (let i = 0; i < 26; i++) { const x = 276 + r() * 104, y = 8 + r() * 10; if (c.occAt(x, y) === 6 && w.tileType(x, y) === GT.grass) c.putv('prop.nature.grass', x, y, r); }
}
