// District blocks: named venues/homes first, then tag-driven rows of buildings facing +y (south edge) and +x (east edge), then open interiors.
import { GT, W, H } from './_ctx.js';
import { lot as parkingLot } from './_airport.js';
import { WHITE } from './_roads.js';

const XS = { dt: [[182, 202], [210, 230], [238, 260]], ot: [[56, 78], [86, 108], [116, 132]], mw: [[272, 298], [306, 334], [342, 364]] };
const YS = { dt: [[142, 166], [174, 194], [206, 228], [236, 260], [268, 290]], ot: [[206, 228], [236, 260], [268, 290]], mw: [[142, 166], [174, 196], [204, 228], [236, 260], [268, 290]], arts: [[62, 82], [90, 108]] };

export function ground(c) {
  const w = c.world, V = c.venue, blocks = c.blocks = [];
  const B = (xs, ys, style) => { for (let i = 0; i < xs.length; i++) for (let j = 0; j < ys.length; j++) blocks.push({ x0: xs[i][0], x1: xs[i][1], y0: ys[j][0], y1: ys[j][1], i, j, style }); };
  B(XS.dt, YS.dt, 'downtown'); B(XS.ot, YS.ot, 'oldtown'); B(XS.mw, YS.mw, 'maplewood'); B(XS.dt, YS.arts, 'arts');
  for (const [x0, x1] of [[56, 78], [86, 108], [116, 146], [182, 230], [238, 260]]) blocks.push({ x0, x1, y0: 308, y1: 322, style: 'harbor' });
  for (const [x0, x1] of [[272, 298], [306, 364]]) blocks.push({ x0, x1, y0: 308, y1: 322, style: 'railyard' });
  const at = (style, i, j) => blocks.find(b => b.style === style && b.i === i && b.j === j);
  /* ---------- named places (front line coordinates) ---------- */
  // Downtown
  const ch = c.bld('bld.downtown.cityhall', 211, 207, { p: c.vp('bld.downtown.cityhall', c.sub(60)) }); if (ch) { at('downtown', 1, 2).feature = 'cityplaza'; w.poi({ type: 'landmark', id: 'poi_city_plaza', name: 'City Hall Plaza', x: 220, y: 222 }); }
  V('office', 'Hartwell & Finch', ['bld.downtown.hartwell'], 184, 260); V('bank', 'Bay Realty & Trust', ['bld.downtown.bank', ['bank']], 212, 290, { p: { w: 10 } });
  V('clothing', 'Thread & Co.', ['bld.downtown.clothing', ['clothing']], 211, 260); V('home:marlowe_1br', 'The Marlowe', ['bld.downtown.office.brick'], 220, 260, { p: { name: 'THE MARLOWE' } });
  V('homegoods', 'Nest & Wire', ['bld.downtown.homegoods', ['homegoods']], 240, 260); V('gym', 'Iron Maple Gym', ['bld.downtown.gym', ['gym']], 184, 228);
  V('deptstore', 'Maple Bay Department Store', ['bld.downtown.deptstore'], 240, 228); V('hotel', 'Grand Maple Hotel', ['bld.downtown.hotel'], 240, 290);
  V('home:beacon_penthouse', 'The Beacon Tower', ['bld.downtown.tower.crown'], 240, 194, { variant: 0 });
  if (c.has('bld.downtown.construction')) c.bld('bld.downtown.construction', 184, 150, { p: c.vp('bld.downtown.construction', c.sub(61)) });
  if (c.has('bld.civic.police')) c.bld('bld.civic.police', 184, 186, { p: c.vp('bld.civic.police', c.sub(62), { w: 10, d: 8 }) });
  if (c.has('bld.downtown.parking')) c.bld('bld.downtown.parking', 211, 144, { p: c.vp('bld.downtown.parking', c.sub(63), { w: 12, d: 8 }) });
  if (c.has('bld.rail.central')) { const l = c.bld('bld.rail.central', 200, 309, { p: { seed: 3 } }); const d = c.door(l); c.centralDoor = d; w.poi({ type: 'door', id: 'door:central_station', room: 'central_station', name: 'Central Station', x: d.x, y: d.y }); }
  // Old Town
  V('home:juniper_court', 'Juniper Court', ['bld.oldtown.apartment.walkup', 'bld.oldtown.rowhouse.brick'], 58, 228, { p: { name: 'JUNIPER CT' } }); V('bakery', 'Rise & Shine Bakery', ['bld.oldtown.bakery', ['bakery']], 88, 228); V('bookstore', 'Dog-Eared Books', ['bld.oldtown.bookstore', ['bookstore']], 96, 228);
  V('cafe', 'Bean & Gone', ['bld.oldtown.cafe', ['cafe', 'oldtown']], 88, 244); V('home:grandma', "Nana's House", ['bld.oldtown.grandma'], 58, 260); V('cornerstore', 'Lucky Corner', ['bld.oldtown.cornerstore', ['cornerstore']], 124, 260, { variant: 1 });
  V('ramen', 'Noodle Lantern', ['bld.oldtown.ramen', ['ramen']], 92, 279); if (c.has('bld.civic.postoffice')) c.bld('bld.civic.postoffice', 117, 221, { p: c.vp('bld.civic.postoffice', c.sub(64), { w: 9, d: 7 }) });
  // Maplewood
  const gr = V('grocery', 'FreshWay Market', ['bld.civic.freshway', ['grocery']], 274, 186, { variant: 0 }); at('maplewood', 0, 1).feature = 'grocery';
  V('home:sibling', "Nora' House", ['bld.res.sibling'], 275, 226); V('home:sycamore_house', '12 Sycamore Street', ['bld.res.gablehouse'], 344, 194, { p: { wall: '#f0d264' } });
  V('home:birch_lane_flats', 'Birch Lane Flats', ['bld.oldtown.apartment.garden', 'bld.res.duplex'], 206, 363, { flip: true, p: { name: 'BIRCH LANE' } });
  const sch = c.tag('school').find(a => a.kind === 'building') || (c.has('bld.civic.community') && 'bld.civic.community'); if (sch) { c.bld(sch, 308, 206, { p: c.vp(sch, c.sub(65), { w: 12, d: 8, name: 'MAPLEWOOD SCHOOL' }) }); at('maplewood', 1, 2).feature = 'school'; w.poi({ type: 'landmark', name: 'Maplewood Elementary', x: 314, y: 210 }); }
  at('maplewood', 1, 3).feature = 'park'; at('maplewood', 2, 2).feature = 'garden';
  if (c.has('bld.civic.pool')) c.bld('bld.civic.pool', 308, 279, { p: c.vp('bld.civic.pool', c.sub(66), { w: 14, d: 10 }) }); if (c.has('bld.civic.firestation')) c.bld('bld.civic.firestation', 274, 252, { p: c.vp('bld.civic.firestation', c.sub(67), { w: 12, d: 8 }) });
  // Arts
  V('cinema', 'The Orpheum', ['bld.arts.orpheum', ['cinema']], 211, 108, { variant: 2 }); V('pizza', 'Slice of Heaven', ['bld.arts.pizza', ['pizza']], 222, 108); V('bar', 'The Blue Heron', ['bld.arts.blueheron', ['bar', 'arts']], 184, 108);
  V('home:friend', "Kit's Place", ['bld.arts.studio'], 193, 108, { variant: 0 }); V('home:easel_house', 'The Easel House', ['bld.arts.lofts'], 240, 108, { variant: 0 });
  const lib = c.tag('library').find(a => a.kind === 'building'); V('library', 'Maple Bay Public Library', [lib ? lib.id : 'bld.civic.museum', 'bld.civic.community'], 212, 73, { p: { name: 'PUBLIC LIBRARY' } }); at('arts', 1, 0).feature = 'campus';
  if (c.has('bld.arts.theatre')) c.bld('bld.arts.theatre', 184, 70, { p: c.vp('bld.arts.theatre', c.sub(68)) }); if (c.has('bld.civic.arena')) { c.bld('bld.civic.arena', 212, 32, { p: c.vp('bld.civic.arena', c.sub(69)) }); c.paint(208, 50, 234, 54, GT.plaza, 6); }
  if (c.has('bld.civic.hospital')) { c.bld('bld.civic.hospital', 240, 40, { p: c.vp('bld.civic.hospital', c.sub(70)) }); c.paint(238, 52, 260, 54, GT.plaza, 6); } if (lib && c.has('bld.civic.museum')) c.bld('bld.civic.museum', 184, 42, { p: c.vp('bld.civic.museum', c.sub(71)) });
  // Railyard
  V('courier', 'ZipParcel Depot', ['bld.ind.zipparcel', ['courier']], 274, 322, { p: { w: 14 } }); V('diner', "Dot's Diner", ['bld.ind.diner', ['diner']], 276, 336);
  c.bld('bld.ind.gasstation', 308, 314, { p: c.vp('bld.ind.gasstation', c.sub(72)) }); c.bld('bld.ind.factory', 349, 313, { p: c.vp('bld.ind.factory', c.sub(73), { w: 15, d: 9 }) }); c.bld('bld.ind.silos', 326, 332, { p: c.vp('bld.ind.silos', c.sub(74), { n: 5 }) });
  if (c.has('bld.ind.busdepot')) c.bld('bld.ind.busdepot', 308, 331, { p: c.vp('bld.ind.busdepot', c.sub(75), { w: 14, d: 9 }), z: 0 }); if (c.has('bld.ind.brewery')) c.bld('bld.ind.brewery', 240, 314, { p: c.vp('bld.ind.brewery', c.sub(76)) });
  V('home:cannery_loft', 'Cannery Row Loft', ['bld.harbor.lofts'], 58, 322, { variant: 2, p: { name: 'CANNERY ROW' } });
  V('home:villa_belvedere', 'Villa Belvedere', [['villa'], 'bld.res.lhouse', 'bld.res.splitlevel'], 86, 36, { p: { wall: '#f4efe6', roof: '#b5533c' } });

  /* ---------- generic fills ---------- */
  const towers = c.pool(['downtown'], { need: ['tower'] }), mid = c.pool(['downtown'], { need: ['midrise'] }), ot = c.pool(['oldtown'], { not: ['lanternrow'] }), lantern = c.pool(['lanternrow']);
  const res = c.pool(['maplewood']), arts = c.pool(['arts']), harbor = c.pool(['harbor'], { not: ['industrial'] }).concat(c.pool(['harbor'], { need: ['warehouse'] })), ind = c.pool(['industrial'], { allow: ['tanks', 'substation', 'brewery'] });
  let hill = c.pool(['hillcrest']); if (new Set(hill.map(q => q.a)).size < 4) hill = res.filter(q => q.w >= 7 && q.h > 4).concat(hill, hill);
  for (const b of blocks) {
    const r = c.sub(1000 + b.x0 * 7 + b.y0), s = b.style; let rowD = 0; const each = l => { rowD = Math.max(rowD, l.d); };
    for (const l of c.lots) if (l.x < b.x1 && l.x + l.w > b.x0 && l.y + l.d > b.y1 - 3 && l.y < b.y1) rowD = Math.max(rowD, b.y1 - l.y);
    if (s === 'downtown') { if (b.feature !== 'cityplaza') { c.row('y', b.y1, b.x0, b.x1, { pool: b.j % 2 ? towers.concat(mid) : towers, r, maxD: 9, each }); c.row('x', b.x1, b.y0 + (b.j === 0 ? 0 : 5), b.y1 - Math.max(rowD, 7) - 1, { pool: mid, r, maxD: 9, maxH: 15 }); } }
    else if (s === 'oldtown') {
      if (b.j === 2) { c.row('y', 279, b.x0, b.x1, { pool: lantern.length ? lantern : ot, r, maxD: 8 }); b.feature = 'lantern'; }
      else if (b.i === 1 && b.j === 1) { c.row('y', 244, b.x0, b.x1, { pool: ot.filter(q => q.a.tags.includes('shop')), r, maxD: 7 }); b.feature = 'market'; }
      else { c.row('y', b.y1, b.x0, b.x1, { pool: ot, r, maxD: 9, each }); c.row('x', b.x1, b.y0, b.y1 - Math.max(rowD, 7) - 1, { pool: ot, r, maxD: 9 }); }
    } else if (s === 'maplewood') {
      if (b.feature === 'park' || b.feature === 'school') continue;
      if (b.feature !== 'grocery') c.row('y', b.y1 - 2, b.x0 + 1, b.x1 - (b.feature ? 0 : 9), { pool: res, r, maxD: 8, gap: [2, 4], each });
      if (!b.feature) c.row('x', b.x1 - 2, b.y0 + 2, b.y1 - 10, { pool: res, r, maxD: 8, gap: [2, 4] });
      if (!b.feature && b.y1 - b.y0 > 20) c.row('y', b.y0 + 9, b.x0 + 2, b.x1 - 12, { pool: res.filter(q => q.d <= 6), r, maxD: 6, gap: [3, 6] });   // back-lot houses behind hedges (seen from the street north of them)
    } else if (s === 'arts') { if (b.feature !== 'campus') { c.row('y', b.y1, b.x0, b.x1, { pool: arts, r, maxD: 9, each }); c.row('x', b.x1, b.y0, b.y1 - Math.max(rowD, 7) - 1, { pool: arts, r, maxD: 8 }); } }
    else if (s === 'harbor') c.row('y', b.y1, b.x0, b.x1, { pool: harbor, r, maxD: 10, gap: [0, 2], ok: [5] });
    else if (s === 'railyard') c.row('y', b.y1, b.x0, b.x1, { pool: ind, r, maxD: 10, gap: [1, 3], ok: [5] });
    b.rowD = Math.max(rowD, 7);
  }
  // Hillcrest terraces + the Old Town fringe west of the viaduct + arts slope + harbour warehouses on the boardwalk
  const rh = c.sub(81); for (const f of [108, 90, 72, 54, 36]) c.row('y', f - 1, 30, 134, { pool: hill, r: rh, maxD: 7, gap: [2, 4] });
  c.row('x', 40, 204, 290, { pool: ot.filter(q => q.a.tags.includes('residential')), r: rh, maxD: 9, gap: [0, 1] });
  c.row('y', 338, 196, 232, { pool: harbor, r: rh, maxD: 7, gap: [2, 5], ok: [6] });
  c.row('y', 322, 22, 44, { pool: harbor, r: rh, maxD: 9, gap: [1, 2] });
  /* base ground of the blocks */
  const base = { downtown: GT.plaza, oldtown: GT.cobble, maplewood: GT.lawn, arts: GT.sidewalk, harbor: GT.concrete, railyard: GT.concrete };
  for (const b of blocks) for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) { const o = c.occ[y * W + x]; if (o === 0 || o === 3) w.gt[y * W + x] = base[b.style]; }
  for (const b of blocks) {
    const ix1 = b.x1 - 9, iy1 = b.y1 - b.rowD - 1, r = c.sub(2000 + b.x0 * 7 + b.y0); b.ix1 = ix1; b.iy1 = iy1;
    if (b.style === 'downtown' && !b.feature) { b.feature = ['plaza', 'pocketpark', 'parking', 'plaza', 'pocketpark'][(b.i * 2 + b.j * 3 + (r() * 2 | 0)) % 5]; if (b.feature === 'pocketpark') grass(c, b.x0 + 1, b.y0 + 1, ix1 - 1, iy1 - 1, GT.park); if (b.feature === 'parking') { c.paint(b.x0 + 1, b.y0 + 1, ix1 - 1, Math.min(iy1 - 1, b.y0 + 12), GT.asphalt); w.parking.push(...freeSpots(c, parkingLot(c, b.x0 + 1.5, b.y0 + 1.5, ix1 - 1.5, Math.min(iy1 - 1.5, b.y0 + 11.5)))); } }
    if (b.feature === 'grocery') { c.paint(b.x0 + 1, 187, b.x1 - 1, 196, GT.asphalt); w.parking.push(...freeSpots(c, parkingLot(c, b.x0 + 2, 188.5, b.x1 - 2, 196))); }
    if (b.feature === 'park') grass(c, b.x0, b.y0, b.x1, b.y1, GT.park); if (b.feature === 'school') { grass(c, b.x0, 215, b.x1, b.y1, GT.lawn); c.paint(322, 205, 333, 214, GT.tarmac); }
    if (b.feature === 'campus') { grass(c, b.x0, b.y0, b.x1, b.y1, GT.park); c.paint(b.x0, 73, b.x1, 75, GT.plaza); c.paint(219, 75, 221, 82, GT.plaza); w.poi({ type: 'landmark', id: 'poi_campus_green', name: 'Campus Green', x: 220, y: 78 }); }
    if (b.feature === 'lantern') { c.paint(b.x0, 279, b.x1, 283, GT.brickpave); grass(c, b.x0, 283, b.x1, b.y1, GT.plaza); }
    if (b.feature === 'market' || b.feature === 'cityplaza') grass(c, b.x0, b.y0, b.x1, b.y1, GT.plaza);
    if (b.style === 'arts' && !b.feature) grass(c, b.x0 + 1, b.y0 + 1, ix1 - 1, iy1 - 1, r() < .5 ? GT.park : GT.plaza);
    if (b.style === 'oldtown' && !b.feature) grass(c, b.x0 + 2, b.y0 + 2, ix1 - 2, iy1 - 2, r() < .6 ? GT.park : GT.brickpave);
    if (b.style === 'maplewood' && b.feature === 'garden') grass(c, b.x0 + 1, b.y0 + 1, b.x0 + 12, b.y1 - 12, GT.soil);
  }
  w.walkways.push({ x0: 56, y0: 279, x1: 132, y1: 283, axis: 'x', district: 'oldtown', kind: 'lane', name: 'Lantern Row' }, { x0: 86, y0: 244, x1: 108, y1: 260, axis: 'x', district: 'oldtown', kind: 'plaza', name: 'Market Square' }, { x0: 210, y0: 217, x1: 230, y1: 228, axis: 'x', district: 'downtown', kind: 'plaza', name: 'City Hall Plaza' });
  // railyard south yard + freight tracks, wild land
  for (let y = 330; y < 344; y++) for (let x = 272; x < W; x++) if (!c.occ[y * W + x]) { w.gt[y * W + x] = y >= 338 ? GT.ballast : GT.concrete; if (y >= 338) c.occ[y * W + x] = 6; }
  for (let y = 126; y < 134; y++) for (let x = 174; x < 262; x++) if (!c.occ[y * W + x]) w.gt[y * W + x] = GT.park;
}
function grass(c, x0, y0, x1, y1, t) { const w = c.world; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (!c.occ[y * W + x]) w.gt[y * W + x] = t; }
function freeSpots(c, spots) { return spots.filter(s => c.occAt(s.x, s.y) === 0 && c.occAt(s.x + 1.4, s.y + 3.2) === 0); }

export function build(c) {
  const w = c.world, pv = c.putv, put = c.put;
  const T = { downtown: ['prop.nature.tree.maple', 'prop.nature.tree.birch', 'prop.nature.tree.cherry'], oldtown: ['prop.nature.tree.maple', 'prop.nature.tree.cherry', 'prop.nature.tree.fruit', 'prop.nature.tree.oak'], maplewood: ['prop.nature.tree.maple', 'prop.nature.tree.oak', 'prop.nature.tree.birch', 'prop.nature.tree.fruit', 'prop.nature.tree.spruce', 'prop.nature.tree.cherry'], arts: ['prop.nature.tree.cherry', 'prop.nature.tree.birch', 'prop.nature.tree.maple', 'prop.nature.tree.poplar'], harbor: ['prop.nature.tree.palm'], railyard: ['prop.nature.tree.poplar'] };
  const stalls = c.tag('stall').filter(a => !a.tags.includes('lanternrow')).map(a => a.id).concat(c.tag('foodstand').map(a => a.id)), kiosks = c.tag('kiosk').map(a => a.id), pav = c.tag('pavilion').filter(a => !a.tags.includes('riverwalk')).map(a => a.id);
  for (const b of c.blocks) {
    const r = c.sub(3000 + b.x0 * 7 + b.y0), pick = l => l[Math.floor(r() * l.length)], f = b.feature, x0 = b.x0, y0 = b.y0, ix1 = b.ix1, iy1 = b.iy1, tl = T[b.style];
    const trees = (n, X0, Y0, X1, Y1, l) => { for (let i = 0; i < n; i++) pv(pick(l || tl), X0 + r() * (X1 - X0), Y0 + r() * (Y1 - Y0), r, { free: true }); };
    const bench = (x, y, flip) => { if (pv(pick(['prop.street.bench.wood', 'prop.street.bench.metal', 'prop.street.bench.stone']), x, y, r, { free: true, flip })) w.poi({ type: 'bench', x: x + (flip ? .25 : 1), y: y + (flip ? 1 : .25), dir: flip ? 0 : 1 }); };
    if (f === 'plaza' || f === 'cityplaza') { const cx = f === 'cityplaza' ? 217 : (x0 + ix1) / 2 - 3, cy = f === 'cityplaza' ? 219.5 : (y0 + iy1) / 2 - 3; put('prop.park.fountain', cx, cy, { p: { w: f === 'cityplaza' ? 6 : 4 }, free: true }); for (const [dx, dy] of [[-4, 0], [8, 0], [-4, 6], [8, 6]]) pv('prop.street.planter.round', cx + dx, cy + dy, r, { free: true }); bench(cx, cy - 2, false); bench(cx + 7.5, cy + 2, true); trees(4, x0 + 1, y0 + 1, ix1 - 1, y0 + 4); if (kiosks.length) pv(pick(kiosks), x0 + 2, y0 + 6, r, { free: true }); if (pav.length && f === 'plaza') pv(pick(pav), ix1 - 8, iy1 - 6, r, { free: true }); put('prop.street.flagpole', cx + 3, cy - 3, { p: c.vp('prop.street.flagpole', r), free: true }); put('prop.street.clock', cx - 2, cy + 7, { p: c.vp('prop.street.clock', r), free: true }); if (f === 'cityplaza') { pv('prop.street.banner', 212, 218, r, { free: true }); pv('prop.street.banner', 228, 218, r, { free: true }); w.poi({ type: 'spot', kind: 'busker', name: 'City Hall Plaza', x: 224, y: 224 }); } }
    else if (f === 'pocketpark') { trees(7, x0 + 1, y0 + 1, ix1 - 2, iy1 - 2); bench(x0 + 3, y0 + 5, false); bench(x0 + 7, iy1 - 4, false); pv('prop.nature.flowerbed', x0 + 4, y0 + 2, r, { free: true }); pv('prop.street.lamp.globe', x0 + 6, y0 + 4, r, { free: true }); pv('prop.park.birdbath', x0 + 5, y0 + 7, r, { free: true }); }
    else if (f === 'parking') { trees(3, x0 + 1, iy1 - 3, ix1 - 1, iy1 - 1); pv('prop.road.sign.parking', x0 + .5, y0 + .5, r, { free: true }); pv('prop.road.evcharger', x0 + 4, y0 + .6, r, { free: true }); }
    else if (f === 'market') { // Old Town Market square
      for (let i = 0; i < 8; i++) { const sx = 88 + (i % 4) * 5, sy = 248.5 + (i / 4 | 0) * 5; if (i === 5) { put('prop.park.fountain', sx, sy, { p: { w: 4 }, free: true }); continue; } if (stalls.length) pv(stalls[i % stalls.length], sx, sy, r, { free: true }); }
      put('prop.street.clock', 106.5, 245, { p: c.vp('prop.street.clock', r) }); pv('prop.street.stringlights', 88, 247, r, { p: { len: 8 } }); pv('prop.street.stringlights', 98, 247, r, { p: { len: 8 } }); bench(87, 258, false); bench(104, 258, false); pv('prop.street.aframe', 94.5, 244.3, r, { free: true }); pv('prop.street.planter.box', 95.5, 245, r, { free: true });
      w.poi({ type: 'stall', id: 'stall:market_stalls', venue: 'market_stalls', name: 'Old Town Market', x: 96, y: 252.8 }); w.poi({ type: 'landmark', name: 'Market Square', x: 97, y: 252 }); w.poi({ type: 'spot', kind: 'busker', name: 'Market Square', x: 101, y: 257 });
    } else if (f === 'lantern') { const fs = c.tag('foodstand').map(a => a.id); for (let x = x0 + 1; x < b.x1 - 4; x += 7) { pv('prop.street.stringlights', x, 280.7, r, { p: { len: 6, warm: true } }); const k = ((x - x0) / 7 | 0) % 3; if (k === 0 && fs.length) pv(pick(fs), x, 285, r, { free: true }); else if (k === 1) { pv('prop.park.picnictable', x, 285, r, { free: true }); pv('prop.street.planter.box', x + 3, 284, r, { free: true }); } else { pv(pick(tl), x + 1, 286, r, { free: true }); bench(x + 2.5, 284, false); } pv('prop.street.lamp.gas', x + 4.5, 283.3, r, { free: true }); } }
    else if (f === 'campus') { trees(9, x0 + 1, 76, b.x1 - 1, 82); bench(216, 75.5, false); bench(222, 75.5, false); pv('prop.park.blanket', 213, 78, r, { free: true }); pv('prop.park.blanket', 225, 79, r, { free: true }); pv('prop.street.postercolumn', 222.5, 73.5, r, { free: true }); pv('prop.park.bikerack', 226, 73.2, r, { free: true }); }
    else if (f === 'park') { trees(12, x0 + 1, y0 + 1, b.x1 - 1, b.y1 - 1); put('prop.park.gazebo', x0 + 11, y0 + 9, { p: c.vp('prop.park.gazebo', r), free: true }); put('prop.park.play.swings', x0 + 3, y0 + 14, { p: c.vp('prop.park.play.swings', r), free: true }); put('prop.park.play.slide', x0 + 3, y0 + 18, { p: c.vp('prop.park.play.slide', r), free: true }); bench(x0 + 12, y0 + 16, false); bench(x0 + 20, y0 + 6, true); pv('prop.park.picnictable', x0 + 20, y0 + 15, r, { free: true }); pv('prop.street.lamp.globe', x0 + 9, y0 + 15, r, { free: true }); pv('prop.park.dogagility', x0 + 20, y0 + 19, r, { free: true }); w.poi({ type: 'landmark', name: 'Maplewood Park', x: x0 + 14, y: y0 + 12 }); }
    else if (f === 'school') { put('prop.park.goal', 308, 219, { p: { w: 4 }, flip: true, free: true }); put('prop.park.goal', 330, 219, { p: { w: 4 }, flip: true, free: true }); put('prop.park.hoop', 322.2, 209, { p: c.vp('prop.park.hoop', r), flip: true, free: true }); put('prop.park.play.climber', 327, 206, { p: c.vp('prop.park.play.climber', r), free: true }); pv('prop.street.flagpole', 321, 214, r, { free: true }); trees(5, x0 + 1, 224, b.x1 - 1, 227); }
    else if (f === 'garden') { for (let y = y0 + 2; y < b.y1 - 13; y += 2.5) for (let x = x0 + 2; x < x0 + 11; x += 3.5) pv(pick(['prop.park.raisedbed', 'prop.park.raisedbed', 'prop.park.coldframe', 'prop.nature.pumpkins']), x, y, r, { free: true }); pv('prop.park.birdfeeder', x0 + 1.2, y0 + 1.2, r, { free: true }); w.poi({ type: 'spot', kind: 'garden', id: 'poi_community_garden', name: 'Maplewood Community Garden', x: x0 + 5.3, y: y0 + 6.5 }); }
    else if (f === 'grocery') { pv('prop.park.bikerack', 291, 186.2, r, { free: true }); pv('prop.airport.trolleycorral', 291, 183, r, { free: true }); trees(3, 292, 176, 297, 184); }
    else if (b.style === 'maplewood') { trees(7, x0 + 1, y0 + 1, b.x1 - 1, b.y1 - 9); for (let i = 0; i < 5; i++) pv(pick(['prop.nature.hedge', 'prop.nature.bush', 'prop.nature.flowerbed', 'prop.park.birdbath', 'prop.nature.leafpile', 'prop.park.raisedbed']), x0 + 1 + r() * (b.x1 - x0 - 4), y0 + 1 + r() * (b.y1 - y0 - 10), r, { free: true, flip: r() < .3 }); }
    else if (b.style === 'arts' || b.style === 'oldtown') { trees(4, x0 + 2, y0 + 2, ix1 - 2, iy1 - 2); pv(pick(['prop.street.postercolumn', 'prop.street.utilitybox', 'prop.street.trash', 'prop.park.bikerack']), x0 + 1, y0 + 1, r, { free: true }); bench(x0 + 4, y0 + 3, false); pv(pick(['prop.nature.flowerbed', 'prop.street.trash', 'prop.street.planter.round']), x0 + 7, y0 + 6, r, { free: true }); if (b.style === 'oldtown') { pv('prop.street.trash', x0 + 3, iy1 - 2, r, { p: { cat: true }, free: true }); } }
    else if (b.style === 'harbor' || b.style === 'railyard') { for (let i = 0; i < 4; i++) pv(pick(['prop.ind.dumpster', 'prop.ind.pallets', 'prop.harbor.crates', 'prop.harbor.barrels', 'prop.ind.spool']), x0 + 1 + r() * (b.x1 - x0 - 3), 309 + r() * 3, r, { free: true }); }
  }
  // suburban + hillside yards: driveway car spot beside each house, mailbox, front shrub
  const r = c.sub(91), cars = c.tag('car').filter(a => a.kind === 'vehicle' && !a.tags.includes('taxi') && !a.tags.includes('police')).map(a => a.id);
  for (const l of c.lots) { const t = l.a.tags || []; if (!t.includes('suburb') && !t.includes('hillcrest')) continue; if (l.flip) { const y = l.y + l.d + .3; if (c.occAt(l.x + 2, y + .8) === 0 && r() < .6) w.parking.push({ x: l.x + l.w - 3.6, y, axis: 'x', lot: 'driveway' }); pv('prop.street.mailbox', l.x + l.w + 1.2, l.y - .6, r, { free: true }); }
    else { const x = l.x + l.w + .3; if (c.occAt(x + .8, l.y + l.d - 2) === 0 && r() < .7) w.parking.push({ x, y: l.y + l.d - 3.4, axis: 'y', lot: 'driveway' }); pv('prop.street.mailbox', l.x - .6, l.y + l.d + 1.2, r, { free: true }); if (r() < .7) pv(r() < .5 ? 'prop.nature.bush' : 'prop.nature.flowerbed', l.x + l.w - 2.5, l.y + l.d + .3, r, { free: true }); if (t.includes('hillcrest') || l.y < 110) pv(r() < .5 ? 'prop.nature.topiary' : 'prop.nature.tree.cypress', l.x - 1.2, l.y + l.d - 1.5, r, { free: true }); } }
  // freight yard
  for (let x = 272; x < 380; x += 8) put('prop.rail.track', x, 338.4, { p: { len: 8, tracks: 2 }, z: 0 }); put('prop.rail.buffer', 272, 338.4, { p: {} });
  const yard = c.sub(92); for (let i = 0; i < 12; i++) pv(['prop.harbor.containers', 'prop.ind.pallets', 'prop.ind.pipes', 'prop.ind.spool', 'prop.ind.fence', 'prop.ind.barrier'][i % 6], 306 + yard() * 70, 331 + yard() * 5, yard, { free: true });
  if (c.has('bld.ind.tanks')) pv('bld.ind.tanks', 352, 331, yard, { free: true }); if (c.has('veh.train.car')) { put('veh.train.car', 300, 338.6, { p: c.vp('veh.train.car', yard, { dir: 1 }), z: .15 }); }
  // Museum of Maple Bay (showpiece S2) closes the vista at the head of Maple Avenue. Placed late and WITHOUT reserving occupancy, so the wild-greenery random sequence is unchanged (trees that would land inside it fail their free-cell check).
  if (c.has('bld.arts.museum2')) { put('bld.arts.museum2', 259, 41, { p: { seed: 1 }, z: 3 }); w.poi({ type: 'door', id: 'door:museum', room: 'museum', name: 'Museum of Maple Bay', x: 266, y: 53.75, dir: 3, district: 'arts' }); w.poi({ type: 'landmark', id: 'lm:museum', name: 'Museum of Maple Bay', x: 266, y: 47 }); }
  // Maple Bay Aquarium (showpiece S6) on the empty boardwalk lot at the river mouth, with its bronze whale tail in the harbor. Same late placement as the museum: no occupancy reserved, nothing else moves.
  if (c.has('bld.harbor.aquarium')) { put('bld.harbor.aquarium', 164, 331, { p: { seed: 1 }, z: 0 }); w.poi({ type: 'door', id: 'door:aquarium', room: 'aquarium', name: 'Maple Bay Aquarium', x: 171, y: 339.75, dir: 3, district: 'harbor' }); w.poi({ type: 'landmark', id: 'lm:aquarium', name: 'Maple Bay Aquarium', x: 174, y: 335 }); if (c.has('prop.aqua.whaletail')) put('prop.aqua.whaletail', 172.5, 346.5, { p: {}, z: -1 }); }
}
