// Hand-planned set pieces: footbridges, Hillcrest stairways + lookout, Central Park, the River Walk, the waterfront.
import { GT, W, H, RIV, SEA, level } from './_ctx.js';
import { placeRailing, WHITE } from './_roads.js';

const pin = (c, x0, y0, x1, y1, z, f = 2) => { const w = c.world; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * (W + 1) + x, v = typeof z === 'function' ? z(x, y) : z; if (v === null) continue; w.hv[i] = v; c.fixed[i] = f; } };
export const FOOTBRIDGES = [156, 180, 264];
export const STAIR_X = [47, 81, 113], CLIFFS = [[98, 108], [80, 90], [62, 72], [44, 54], [26, 36]];
export const POND = { x: 98, y: 158, rx: 15, ry: 10 };
export const QUAYS = [[208, 226], [238, 258], [270, 288]];

export function terrain(c) {
  const w = c.world;
  for (const y of FOOTBRIDGES) { pin(c, RIV.x0 - 2, y - 2, RIV.x1 + 2, y + 2, 1); c.occSet(RIV.x0 - 2, y - 2, RIV.x1 + 2, y + 2, 6); }
  for (const sx of STAIR_X) for (const [cy, front] of CLIFFS) { const zu = level(sx, cy - 1), zl = level(sx, cy + 1.5); for (let k = 0; k <= 3; k++) pin(c, sx, cy + k, sx + 3, cy + k, zu + (zl - zu) * k / 3, 1); w.ground(sx, cy, sx + 3, cy + 3, GT.stairs); w.ground(sx, cy + 3, sx + 3, front, GT.plaza); c.occSet(sx - 1, cy, sx + 4, front, 6); }
  // pond
  const P = POND; for (let y = P.y - P.ry - 1; y <= P.y + P.ry + 1; y++) for (let x = P.x - P.rx - 1; x <= P.x + P.rx + 1; x++) { const d = Math.hypot((x - P.x) / P.rx, (y - P.y) / P.ry) + Math.sin(x * .9) * .04 + Math.cos(y * .7) * .05; if (d < 1) pin(c, x, y, x, y, .5, 1); }
  // lower quays on the west bank
  for (const [y0, y1] of QUAYS) { pin(c, 145, y0, 149, y1, 0, 1); pin(c, 144, y0, 144, y1, .5, 1); pin(c, 132, y0 - 1, 143, y1 + 1, 1, 1); }
  // waterfront: fun pier, Pier 7, lighthouse point, beach
  pin(c, 94, SEA - 1, 106, 377, 0); c.occSet(94, SEA - 1, 106, 377, 6); pin(c, 234, SEA - 1, 260, 361, 0); c.occSet(234, SEA - 1, 260, 361, 6);
  pin(c, 22, 340, 44, 364, (x, y) => { const d = Math.hypot((x - 33) / 11, (y - 352) / 12); return d < 1 ? (d < .7 ? .75 : .25) : null; }); for (let y = 340; y < 364; y++) for (let x = 22; x < 44; x++) if (Math.hypot((x + .5 - 33) / 11, (y + .5 - 352) / 12) < .95) c.occ[y * W + x] = 6;
  pin(c, 44, 334, 58, 352, (x, y) => (x > 44 || y < 340) ? Math.max(-1, Math.min(0, -(y - 340) / 8)) : null); c.occSet(44, 332, 58, 348, 6);
}

export function ground(c) {
  const w = c.world, P = c.paint;
  for (const y of FOOTBRIDGES) w.ground(RIV.x0 - 2, y - 2, RIV.x1 + 2, y + 2, GT.boardwalk);
  /* ---- Central Park ---- */
  P(56, 126, 140, 194, GT.park);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const g = w.gt[y * W + x]; if (c.fixed[y * (W + 1) + x] === 1 && w.H(x, y) === .5 && w.H(x + 1, y + 1) === .5 && w.H(x + 1, y) === .5 && w.H(x, y + 1) === .5 && x > 80 && x < 116 && y > 145 && y < 171) { w.gt[y * W + x] = GT.water; c.occ[y * W + x] = 4; } }
  const path = (x0, y0, x1, y1, t = GT.gravel) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (c.occ[y * W + x] === 0 || c.occ[y * W + x] === 5) { w.gt[y * W + x] = t; c.occ[y * W + x] = 6; } w.walkways.push({ x0, y0, x1, y1, axis: x1 - x0 >= y1 - y0 ? 'x' : 'y', district: 'park', kind: 'path' }); };
  c.path = path;
  path(56, 176, 140, 178); path(78, 142, 118, 144); path(78, 172, 118, 174); path(78, 142, 80, 174); path(116, 142, 118, 174); path(99, 174, 101, 194); path(89, 134, 92, 142); path(56, 157, 78, 159); path(118, 157, 140, 159); path(128, 126, 130, 157); path(66, 159, 68, 176);
  P(58, 180, 74, 192, GT.sand, 6); P(60, 130, 74, 140, GT.concrete, 6); P(60, 143, 74, 153, GT.tarmac, 6);
  for (const [a, b, cc, d] of [[60, 130, 74, 130.12], [60, 139.88, 74, 140], [60, 130, 60.12, 140], [73.88, 130, 74, 140], [66.94, 130, 67.06, 140], [60, 143, 74, 143.1], [60, 152.9, 74, 153], [60, 143, 60.1, 153], [73.9, 143, 74, 153], [60, 147.95, 74, 148.05]]) c.mark(a, b, cc, d, WHITE);
  P(122, 180, 138, 186, GT.soil, 6);
  c.venue('clinic', 'Bayside Clinic', ['bld.civic.clinic', ['clinic']], 128, 193, { p: { name: 'BAYSIDE CLINIC' } }); P(126, 193, 140, 194, GT.plaza, 6);
  c.bld('bld.civic.conservatory', 122, 132, { p: c.vp('bld.civic.conservatory', c.sub(31)) }); c.bld('bld.civic.parkcafe', 60, 167, { p: c.vp('bld.civic.parkcafe', c.sub(32)) }); c.bld('bld.civic.restroom', 82, 188, { p: c.vp('bld.civic.restroom', c.sub(33)) });
  /* ---- River Walk ---- */
  for (let y = 122; y < 292; y++) { for (let x = 140; x < 149; x++) if (!c.occ[y * W + x] && y < 196) { w.gt[y * W + x] = (x + y) % 9 === 0 ? GT.plaza : GT.gravel; c.occ[y * W + x] = 6; } for (let x = 132; x < 149; x++) if (!c.occ[y * W + x] && y >= 206) { w.gt[y * W + x] = x >= 145 && QUAYS.some(q => y >= q[0] && y < q[1]) ? GT.boardwalk : GT.brickpave; c.occ[y * W + x] = 6; } }
  for (const [y0, y1] of QUAYS) { const m0 = Math.round(y0 + (y1 - y0) * .3), m1 = Math.round(y0 + (y1 - y0) * .7); w.ground(143, y0, 145, y1, GT.lawn); w.ground(143, m0, 145, m1, GT.stairs); w.ground(143, y0, 145, y0 + 2, GT.stairs); w.ground(143, y1 - 2, 145, y1, GT.stairs); }
  for (let y = 142; y < 290; y++) for (let x = 163; x < 174; x++) if (!c.occ[y * W + x]) { w.gt[y * W + x] = x < 166 ? GT.boardwalk : GT.plaza; c.occ[y * W + x] = 6; }
  w.walkways.push({ x0: 140, y0: 122, x1: 149, y1: 194, axis: 'y', district: 'park', kind: 'promenade' }, { x0: 134, y0: 206, x1: 143, y1: 290, axis: 'y', district: 'oldtown', kind: 'promenade' }, { x0: 163, y0: 142, x1: 174, y1: 290, axis: 'y', district: 'downtown', kind: 'promenade' });
  const rr = c.sub(41);
  c.venueLike = (id, x, y, o) => c.has(id) ? c.bld(id, x, y, o) : null;
  c.venueLike('bld.downtown.river.restaurant', 133, 209, { p: c.vp('bld.downtown.river.restaurant', rr, { w: 10 }), flip: true });
  c.venueLike('bld.downtown.river.amphitheatre', 133, 241, { p: c.vp('bld.downtown.river.amphitheatre', rr, { w: 12 }), flip: true });
  c.venueLike('bld.downtown.river.boathouse', 134, 272, { p: c.vp('bld.downtown.river.boathouse', rr), flip: true });
  c.venueLike('bld.downtown.pavilion', 166.5, 214, { p: c.vp('bld.downtown.pavilion', rr, { w: 6 }), flip: true }); c.venueLike('bld.downtown.pavilion', 166.5, 276, { p: c.vp('bld.downtown.pavilion', rr, { w: 6 }), flip: true });
  /* ---- waterfront ---- */
  for (let y = 330; y < SEA - 1; y++) for (let x = 58; x < 262; x++) if (!c.occ[y * W + x]) { w.gt[y * W + x] = GT.boardwalk; c.occ[y * W + x] = 6; }
  P(94, SEA - 1, 106, 377, GT.boardwalk); P(234, SEA - 1, 260, 361, GT.concrete);
  for (let y = 338; y < 366; y++) for (let x = 20; x < 46; x++) if (c.occ[y * W + x] === 6) w.gt[y * W + x] = GT.rock;
  for (let y = 330; y < 350; y++) for (let x = 20; x < 58; x++) if (c.occ[y * W + x] !== 1 && c.occ[y * W + x] !== 2 && w.gt[y * W + x] !== GT.rock && w.H(x, y + 1) > -.9) { w.gt[y * W + x] = GT.sand; c.occ[y * W + x] = 6; }
  w.walkways.push({ x0: 58, y0: 338, x1: 262, y1: 344, axis: 'x', district: 'harbor', kind: 'boardwalk' }, { x0: 96, y0: 345, x1: 104, y1: 366, axis: 'y', district: 'harbor', kind: 'pier' });
  c.venue('restaurant', 'The Gilded Gull', ['bld.harbor.gildedgull', ['seafood']], 118, 338, {}); 
  c.bld('bld.harbor.fishmarket', 84, 331, { p: c.vp('bld.harbor.fishmarket', rr, { w: 11, d: 7 }) });
  c.venue('home:saltbox_lofts', 'Saltbox Lofts', ['bld.harbor.lofts'], 62, 338, { variant: 1, p: { name: 'SALTBOX' } });
  c.bld('bld.harbor.master', 138, 333, { p: c.vp('bld.harbor.master', rr) }); c.venueLike('bld.harbor.boathouse', 186, 331, { p: c.vp('bld.harbor.boathouse', rr) }); c.venueLike('bld.harbor.boathouse', 72, 331, { p: c.vp('bld.harbor.boathouse', rr) });
  c.bld('bld.harbor.lighthouse', 29, 349, { p: c.vp('bld.harbor.lighthouse', rr), z: .75, noPad: true });
  const p7 = c.venue('warehouse', 'Pier 7 Freight', ['bld.harbor.pier7'], 238, 357, { p: { w: 16 } });
  /* ---- Hillcrest lookout ---- */
  P(30, 10, 132, 26, GT.park); path(40, 23, 124, 25, GT.gravel); path(81, 12, 84, 23, GT.gravel); P(66, 12, 98, 22, GT.plaza, 6);
  c.bld('bld.civic.observatory', 70, 13, { p: c.vp('bld.civic.observatory', rr) }); c.venueLike('bld.civic.radiotower', 110, 12, { p: c.vp('bld.civic.radiotower', rr) }); c.venueLike('bld.civic.watertower', 36, 12, { p: c.vp('bld.civic.watertower', rr) });
}

export function build(c) {
  const w = c.world, r = c.sub(51), put = c.put, pv = c.putv;
  const bench = (id, x, y, flip, dir) => { const o = pv(id, x, y, r, { flip, free: true }); if (o) w.poi({ type: 'bench', x: x + (flip ? .25 : 1), y: y + (flip ? 1 : .25), dir }); return o; };
  const TREES = c.tag('nature', 'tree').filter(a => !a.tags.includes('palm') && !a.tags.includes('sapling')).map(a => a.id), pick = l => l[Math.floor(r() * l.length)];
  const tree = (x, y, ids) => { const id = pick(ids || TREES); return c.has(id) ? pv(id, x, y, r, { free: true }) : null; };
  for (const y of FOOTBRIDGES) { placeRailing(c, RIV.x0 - 1, y - 2, RIV.x1 + 1, y - 2, '#7a5a3e'); placeRailing(c, RIV.x0 - 1, y + 1.75, RIV.x1 + 1, y + 1.75, '#7a5a3e'); put('prop.street.lamp.globe', RIV.x0 + 5.5, y - 1.7, { p: {} }); }
  /* ---- park ---- */
  let n = 0; for (let i = 0; i < 520 && n < 150; i++) { const x = 57 + r() * 82, y = 127 + r() * 66; if (c.occAt(x, y) !== 0 || c.occAt(x + .5, y + .5) !== 0) continue; if (tree(x, y)) n++; }
  for (let i = 0; i < 60; i++) { const x = 57 + r() * 82, y = 127 + r() * 66; if (c.occAt(x, y) !== 0 || c.occAt(x + 2, y + 2) !== 0) continue; pv(pick(['prop.nature.bush', 'prop.nature.flowerbed', 'prop.nature.wildflowers', 'prop.nature.fern', 'prop.nature.rock', 'prop.nature.mushrooms', 'prop.park.blanket', 'prop.nature.log']), x, y, r, { free: true }); }
  for (let x = 80; x < 118; x += 9) { put('prop.street.lamp.globe', x + 3, 141.3, { p: {} }); put('prop.street.lamp.globe', x + 3, 174.2, { p: {} }); bench('prop.street.bench.wood', x + 5, 144.1, false, 1); bench('prop.street.bench.wood', x, 171.4, false, 3); }
  for (let x = 58; x < 140; x += 10) { put('prop.street.lamp.globe', x, 178.2, { p: {} }); if (x % 20 === 8) bench('prop.street.bench.wood', x + 4, 175.4, false, 1); }
  for (let y = 146; y < 172; y += 8) { put('prop.street.lamp.globe', 77.3, y, { p: {} }); put('prop.street.lamp.globe', 118.2, y + 3, { p: {} }); }
  const P = POND; for (let i = 0; i < 16; i++) { const a = r() * 6.28, x = P.x + Math.cos(a) * (P.rx - 1 - r() * 3), y = P.y + Math.sin(a) * (P.ry - 1 - r() * 2); if (w.tileType(x, y) === GT.water) pv(pick(['prop.nature.reeds', 'prop.nature.lilypads', 'prop.nature.lilypads']), Math.floor(x), Math.floor(y), r, { z: .5 }); }
  put('prop.park.rowboat', 92, 156, { p: c.vp('prop.park.rowboat', r, { swan: true }), z: .5 }); put('prop.park.rowboat', 101, 161, { p: c.vp('prop.park.rowboat', r), z: .5 }); put('prop.park.boathut', 104, 168.5, { p: c.vp('prop.park.boathut', r) }); put('prop.park.dock', 99, 166.5, { p: { len: 4, boat: true }, z: .75, flip: false });
  w.poi({ type: 'spot', kind: 'duckpond', id: 'poi_duck_pond', name: 'Duck Pond', x: 96, y: 170.5 }); w.poi({ type: 'landmark', id: 'lm:pond', name: 'Duck Pond', x: P.x, y: P.y });
  put('prop.park.gazebo', 124, 148, { p: c.vp('prop.park.gazebo', r) }); w.poi({ type: 'spot', kind: 'busker', name: 'Bandstand', x: 126.5, y: 154 });
  for (const [x, y] of [[124, 164], [130, 166], [134, 162], [126, 169]]) { put('prop.park.picnictable', x, y, { p: c.vp('prop.park.picnictable', r) }); } put('prop.park.bbq', 128.5, 163, { p: c.vp('prop.park.bbq', r) }); w.poi({ type: 'spot', kind: 'picnic', name: 'Picnic Meadow', x: 129, y: 168.5 }); w.poi({ type: 'spot', kind: 'chess', name: 'Chess Tables', x: 133, y: 165.5 });
  put('prop.park.play.slide', 60, 182, { p: c.vp('prop.park.play.slide', r) }); put('prop.park.play.swings', 66, 181, { p: c.vp('prop.park.play.swings', r) }); put('prop.park.play.climber', 60, 186, { p: c.vp('prop.park.play.climber', r) }); put('prop.park.play.seesaw', 66, 187, { p: c.vp('prop.park.play.seesaw', r) }); put('prop.park.play.springrider', 70.5, 185, { p: c.vp('prop.park.play.springrider', r) }); put('prop.park.play.sandbox', 69, 188.5, { p: { w: 3, seed: 2 } }); bench('prop.street.bench.wood', 64, 192.2, false, 3);
  w.poi({ type: 'spot', kind: 'playground', id: 'poi_playground', name: 'Playground', x: 65, y: 185 });
  put('prop.park.hoop', 60.2, 134.5, { p: c.vp('prop.park.hoop', r), flip: true }); put('prop.park.hoop', 72.8, 134.5, { p: c.vp('prop.park.hoop', r), flip: true }); put('prop.park.tennisnet', 63, 147.75, { p: { len: 8 } }); put('prop.park.gymbars', 62, 155, { p: c.vp('prop.park.gymbars', r) });
  for (let x = 122; x < 138; x += 3) { pv('prop.park.raisedbed', x, 181, r); pv('prop.nature.flowerbed', x, 184, r); } put('prop.park.pergola', 124, 187.5, { p: c.vp('prop.park.pergola', r) });
  put('prop.park.arch', 97.5, 193, { p: { name: 'CENTRAL PARK', w: 5 } }); put('prop.park.infoboard', 103, 192.5, { p: { name: 'CENTRAL PARK' } }); put('prop.park.fountain', 97, 176.5 - 8, { p: { w: 4 } , free: true });
  const cart = c.tag('foodstand').map(a => a.id).concat(['veh.van.icecream']).filter(c.has); if (cart.length) { pv(cart[0], 104, 189.5, r); w.poi({ type: 'stall', id: 'stall:stand_hotdog', venue: 'stand_hotdog', name: "Frank's Franks", x: 105.5, y: 192.6 }); }
  put('prop.park.balloon', 112, 130, { p: c.vp('prop.park.balloon', r) });
  /* ---- River Walk ---- */
  const seg = (y0, y1) => { // east bank between two crossings
    placeRailing(c, 163.1, y0, 163.1, y1, '#4f6f7f');
    for (let y = y0 + 2, k = 0; y < y1 - 2; y += 5, k++) { if (c.occAt(170, y) !== 6) continue; if (k % 2 === 0) tree(171, y, ['prop.nature.tree.maple', 'prop.nature.tree.cherry', 'prop.nature.tree.birch', 'prop.nature.tree.willow']); else if (k % 4 === 1) put(c.first('prop.street.lamp.double', 'prop.street.lamp.modern'), 167, y, { p: {}, free: true }); else bench(c.first('prop.street.bench.metal', 'prop.street.bench.wood'), 166.3, y, true, 2); if (k % 6 === 3) pv('prop.street.planter.round', 172.5, y + 2, r, { free: true }); if (k % 7 === 5) pv('prop.street.bin', 167.2, y + 1.5, r, { free: true }); }
  };
  const cuts = [142, 152, 160, 176, 184, 194, 206, 228, 236, 260, 268, 290]; for (let i = 0; i < cuts.length; i += 2) seg(cuts[i], cuts[i + 1]);
  const kiosk = c.tag('kiosk').map(a => a.id), carts = c.tag('foodstand').map(a => a.id);
  [[168, 148], [168, 188], [168, 240], [168, 254]].forEach(([x, y], i) => { const id = i % 2 ? pick(carts.length ? carts : kiosk) : pick(kiosk.length ? kiosk : carts); if (id) pv(id, x, y, r, { flip: true, free: true }); });
  w.poi({ type: 'spot', kind: 'busker', name: 'River Walk', x: 169, y: 222 }); w.poi({ type: 'spot', kind: 'lookout', name: 'River Lookout', x: 164.5, y: 246 }); w.poi({ type: 'spot', kind: 'fishing', name: 'River Quay', x: 148, y: 250 }); w.poi({ type: 'landmark', id: 'poi_riverside_path', name: 'River Walk', x: 168, y: 220 });
  put('prop.park.fountain', 166.5, 198 + 22, { p: { w: 4 }, free: true }); put('prop.harbor.anchor', 168, 284, { p: {}, free: true });
  for (const [y0, y1] of QUAYS) { placeRailing(c, 148.9, y0, 148.9, y1, '#7a5a3e'); for (let y = y0 + 2; y < y1 - 2; y += 7) { put('prop.street.lamp.gas', 142.2, y, { p: c.vp('prop.street.lamp.gas', r), free: true }); bench('prop.street.bench.wood', 146, y + 3, true, 2); } pv('prop.harbor.boat.row', 150.5, y0 + 4, r, { flip: true, z: -1 }); pv('prop.park.rowboat', 150.5, y1 - 6, r, { flip: true, z: -1 }); }
  for (let y = 207; y < 289; y += 6) { if (c.occAt(142, y) !== 6 || c.occAt(141, y) !== 6) continue; if (QUAYS.some(q => y >= q[0] - 1 && y <= q[1])) tree(142.3, y + 3.2, ['prop.nature.tree.willow', 'prop.nature.tree.cherry', 'prop.nature.tree.maple']); else pv('prop.street.planter.round', 142, y, r, { free: true }); }
  for (const [x, y] of [[142.5, 220.5], [142.5, 261], [142.5, 266], [137, 230]]) { if (carts.length) pv(pick(carts), x - 3, y, r, { free: true }); } pv('prop.street.stringlights', 133, 262, r, { p: { len: 8 } }); pv('prop.street.stringlights', 133, 266.5, r, { p: { len: 8 } });
  for (let y = 126; y < 192; y += 6) { if (c.occAt(144, y) !== 6) continue; const k = (y / 6 | 0) % 3; if (k === 0) tree(141, y, ['prop.nature.tree.willow', 'prop.nature.tree.poplar']); else if (k === 1) put('prop.street.lamp.globe', 147.8, y, { p: {}, free: true }); else bench('prop.street.bench.wood', 147.4, y, true, 2); }
  placeRailing(c, 148.9, 123, 148.9, 154, '#7a5a3e'); placeRailing(c, 148.9, 158, 148.9, 178, '#7a5a3e'); placeRailing(c, 148.9, 182, 148.9, 194, '#7a5a3e');
  /* ---- waterfront ---- */
  const hl = c.first('prop.harbor.lamp', 'prop.street.lamp.double');
  for (let x = 60; x < 260; x += 8) { if (c.occAt(x, 343) !== 6 || (x > 92 && x < 108)) continue; const k = (x / 8 | 0) % 4; if (k === 0) put(hl, x, 343.2, { p: c.vp(hl, r), free: true }); else if (k === 1) bench('prop.street.bench.wood', x, 342.8, false, 1); else if (k === 2) pv(pick(['prop.harbor.bollard', 'prop.harbor.gullperch', 'prop.harbor.lifering', 'prop.harbor.mooringpost']), x, 343.3, r, { free: true }); else pv(pick(['prop.harbor.nets', 'prop.harbor.lobstertraps', 'prop.harbor.crates', 'prop.harbor.barrels', 'prop.street.planter.box']), x, 339 + r() * 2, r, { free: true }); }
  for (let x = 112; x < 232; x += 4) placeRailing(c, x, 343.75, Math.min(232, x + 4), 343.75, '#7a5a3e');
  const boats = c.tag('boat').filter(a => a.kind === 'prop' && !a.tags.includes('ship') && !a.tags.includes('pond')).map(a => a.id);
  if (boats.length) for (let x = 110; x < 232; x += 9 + (r() * 6 | 0)) pv(pick(boats), x, 346.5 + (r() * 4 | 0), r, { z: -1 }); if (boats.length) for (let y = 348; y < 372; y += 8) { pv(pick(boats), 107, y, r, { z: -1, flip: true }); pv(pick(boats), 90.5, y + 3, r, { z: -1, flip: true }); }
  pv('prop.harbor.cargoship', 262, 364, r, { z: -1 }); pv('prop.harbor.boat.tug', 222, 352, r, { z: -1 });
  for (const [x, y] of [[60, 364], [130, 366], [200, 370], [16, 372], [70, 352]]) pv('prop.harbor.buoy', x, y, r, { z: -1 });
  put('prop.harbor.ferriswheel', 94.5, 372.5, { p: c.vp('prop.harbor.ferriswheel', r) }); w.poi({ type: 'landmark', id: 'poi_ferris_wheel', name: 'The Bay Wheel', x: 100, y: 369 }); w.poi({ type: 'spot', kind: 'ferriswheel', name: 'The Bay Wheel', x: 100, y: 371.6 });
  placeRailing(c, 94.1, 346, 94.1, 376, '#7a5a3e'); placeRailing(c, 105.7, 346, 105.7, 376, '#7a5a3e'); placeRailing(c, 94, 376.6, 106, 376.6, '#7a5a3e');
  const shacks = carts.length ? carts : kiosk; [[96, 348], [96, 356], [102.5, 352], [112, 331], [150, 334], [160, 334]].forEach(([x, y], i) => { if (shacks.length) pv(pick(shacks), x, y, r, { free: true, flip: i < 3 }); });
  w.poi({ type: 'stall', id: 'stall:stand_icecream', venue: 'stand_icecream', name: 'Scoop Dreams', x: 99.5, y: 350 }); w.poi({ type: 'spot', kind: 'fishing', id: 'poi_pier', name: 'Fishing Pier', x: 104.8, y: 362 });
  for (let y = 348; y < 366; y += 6) put(hl, 99.8, y + 3, { p: c.vp(hl, r), free: true }); bench('prop.street.bench.wood', 96, 366, true, 0);
  w.poi({ type: 'landmark', id: 'poi_lighthouse', name: 'Gull Point Lighthouse', x: 32, y: 352 }); w.poi({ type: 'spot', kind: 'lookout', name: 'Gull Point', x: 36.5, y: 356.5 });
  for (let i = 0; i < 14; i++) pv('prop.nature.rock', 22 + r() * 22, 342 + r() * 20, r, { free: true }); for (let i = 0; i < 7; i++) pv('prop.nature.tree.palm', 22 + r() * 34, 331 + r() * 6, r, { free: true });
  for (let i = 0; i < 5; i++) pv('prop.park.blanket', 46 + r() * 9, 334 + r() * 5, r, { free: true }); w.poi({ type: 'spot', kind: 'beach', name: 'Gull Point Beach', x: 50, y: 338 });
  for (const [x, y] of [[236, 348], [252, 349], [256, 356]]) pv(pick(['prop.harbor.containers', 'prop.ind.pallets', 'prop.harbor.crates', 'prop.ind.forklift']), x, y, r, { free: true }); put('prop.harbor.crane', 226, 337.5, { p: c.vp('prop.harbor.crane', r), free: true });
  for (let i = 0; i < 16; i++) pv(pick(['prop.harbor.containers', 'prop.ind.pallets', 'prop.harbor.crates', 'prop.harbor.barrels', 'prop.ind.spool', 'prop.ind.forklift', 'prop.ind.pipes']), 194 + r() * 60, 331 + r() * 8, r, { free: true });
  /* ---- Hillcrest lookout + stairways ---- */
  for (let x = 42; x < 124; x += 6) { const k = (x / 6 | 0) % 4; if (x > 78 && x < 88) continue; if (k === 0) put('prop.park.telescope', x, 25.2, { p: c.vp('prop.park.telescope', r), free: true }); else if (k === 1) bench('prop.street.bench.stone', x, 25.3, false, 1); else if (k === 2) put('prop.street.lamp.globe', x, 25.4, { p: {}, free: true }); else pv('prop.park.stonelantern', x, 22, r, { free: true }); }
  for (let x = 30; x < 132; x += 4) if (!(x >= 46 && x < 51) && !(x >= 80 && x < 85) && !(x >= 112 && x < 117)) placeRailing(c, x, 26.1, x + 4, 26.1, '#5b6670');
  w.poi({ type: 'spot', kind: 'lookout', id: 'poi_lookout', name: 'Hillcrest Lookout', x: 86, y: 24 }); w.poi({ type: 'landmark', id: 'lm:lookout', name: 'Hillcrest Lookout', x: 82, y: 18 });
  put('prop.park.pergola', 100, 14, { p: c.vp('prop.park.pergola', r) }); put('prop.park.fountain', 88, 15, { p: { w: 4 }, free: true });
  n = 0; for (let i = 0; i < 200 && n < 46; i++) { const x = 30 + r() * 100, y = 10 + r() * 13; if (c.occAt(x, y) !== 0) continue; if (tree(x, y, ['prop.nature.tree.pine', 'prop.nature.tree.cypress', 'prop.nature.tree.cherry', 'prop.nature.tree.fir', 'prop.nature.tree.maple'])) n++; }
  for (const sx of STAIR_X) for (const [cy, front] of CLIFFS) { put('prop.street.lamp.globe', sx - .7, cy + 3.2, { p: {}, free: true }); if (r() < .5) pv('prop.nature.topiary', sx + 3.2, cy + 4, r, { free: true }); }
  w.poi({ type: 'spot', kind: 'shrine', name: 'Hillside Shrine', x: 116.5, y: 66.5 }); put('prop.park.stonelantern', 117.3, 66, { p: c.vp('prop.park.stonelantern', r), free: true }); bench('prop.street.bench.stone', 117.2, 68, true, 2);
}
