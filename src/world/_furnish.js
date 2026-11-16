// Street furniture, signals, bus routes + stops, taxi stands, sidewalks as walkways, parked cars, wild greenery.
import { GT, W, H, RIV, Z, zoneOf } from './_ctx.js';
import { YELLOW } from './_roads.js';

const LAMP = { [Z.downtown]: ['prop.street.lamp.modern'], [Z.oldtown]: ['prop.street.lamp.gas'], [Z.harbor]: ['prop.harbor.lamp', 'prop.street.lamp.double'], [Z.hillcrest]: ['prop.street.lamp.globe'], [Z.maplewood]: ['prop.street.lamp.modern'], [Z.arts]: ['prop.street.lamp.modern'], [Z.railyard]: ['prop.street.lamp.double'], [Z.park]: ['prop.street.lamp.globe'], [Z.airport]: ['prop.street.lamp.double'] };
const TREE = { [Z.downtown]: ['prop.nature.tree.maple', 'prop.nature.tree.sapling', 'prop.nature.tree.birch'], [Z.oldtown]: ['prop.nature.tree.maple', 'prop.nature.tree.cherry'], [Z.harbor]: ['prop.nature.tree.palm', 'prop.nature.tree.sapling'], [Z.hillcrest]: ['prop.nature.tree.cypress', 'prop.nature.tree.pine', 'prop.nature.tree.cherry'], [Z.maplewood]: ['prop.nature.tree.maple', 'prop.nature.tree.oak', 'prop.nature.tree.maple'], [Z.arts]: ['prop.nature.tree.cherry', 'prop.nature.tree.birch', 'prop.nature.tree.sapling'], [Z.railyard]: [], [Z.park]: ['prop.nature.tree.oak', 'prop.nature.tree.maple', 'prop.nature.tree.poplar'], [Z.airport]: ['prop.nature.tree.sapling'] };
const SMALL = { [Z.downtown]: ['prop.street.bin', 'prop.street.hydrant', 'prop.street.newsbox', 'prop.street.mailbox', 'prop.road.meter', 'prop.street.planter.round', 'prop.street.recycling', 'prop.street.bollard', 'prop.road.bikerack', 'prop.street.atm', 'prop.street.vending'],
  [Z.oldtown]: ['prop.street.bin', 'prop.street.hydrant', 'prop.street.mailbox', 'prop.street.planter.round', 'prop.street.phonebooth', 'prop.street.postercolumn', 'prop.street.aframe', 'veh.bicycle', 'veh.scooter', 'prop.street.planter.box'],
  [Z.harbor]: ['prop.street.bin', 'prop.street.hydrant', 'prop.harbor.bollard', 'prop.harbor.crates', 'prop.harbor.barrels', 'prop.harbor.gullperch', 'prop.ind.dumpster'], [Z.hillcrest]: ['prop.street.mailbox', 'prop.nature.topiary', 'prop.street.hydrant', 'prop.street.planter.round'],
  [Z.maplewood]: ['prop.street.hydrant', 'prop.street.mailbox', 'prop.street.bin', 'veh.bicycle', 'prop.street.newsbox'], [Z.arts]: ['prop.street.bin', 'prop.street.utilitybox', 'prop.street.postercolumn', 'prop.street.hydrant', 'veh.bicycle', 'prop.street.aframe', 'prop.street.bikeshare', 'veh.scooter', 'prop.street.newsbox'],
  [Z.railyard]: ['prop.street.hydrant', 'prop.ind.barrier', 'prop.ind.dumpster', 'prop.street.utilitybox', 'prop.ind.pallets'], [Z.park]: ['prop.street.bin', 'prop.street.drinkingfountain', 'prop.street.bench.wood', 'prop.park.bikerack'], [Z.airport]: ['prop.street.bin', 'prop.street.hydrant', 'prop.street.planter.round'] };
const DK = ['', 'downtown', 'oldtown', 'harbor', 'hillcrest', 'maplewood', 'arts', 'railyard', 'park', 'airport'];

export function build(c) {
  const w = c.world, r = c.sub(101), pick = l => l[Math.floor(r() * l.length)], pv = c.putv;
  const segs = [];
  for (const rd of c.roads) {
    const ns = c.nodes.filter(n => (rd.axis === 'x' ? n.rx : n.ry) === rd).map(n => ({ t: rd.axis === 'x' ? n.x : n.y, h: rd.axis === 'x' ? n.hx : n.hy })).sort((p, q) => p.t - q.t);
    const cuts = [[-1e3, rd.a + (rd.endA === 'bulb' ? 6 : 0)], ...ns.map(k => [k.t - k.h - 2, k.t + k.h + 2]), [rd.b - (rd.endB === 'bulb' ? 6 : 0), 1e3]].sort((p, q) => p[0] - q[0]);
    for (let i = 0; i < cuts.length - 1; i++) { const t0 = Math.max(cuts[i][1], rd.a), t1 = Math.min(cuts[i + 1][0], rd.b); if (t1 - t0 >= 3) segs.push({ rd, t0, t1 }); }
  }
  const P = (rd, t, off) => rd.axis === 'x' ? [t, rd.c + off] : [rd.c + off, t];
  for (const { rd, t0, t1 } of segs) for (const s of [-1, 1]) {
    const [mx, my] = P(rd, (t0 + t1) / 2, s * (rd.half + 1)), zn = zoneOf(mx, my);
    if (rd.axis === 'x') w.walkways.push({ x0: t0, y0: s < 0 ? rd.c - rd.half - 2 : rd.c + rd.half, x1: t1, y1: s < 0 ? rd.c - rd.half : rd.c + rd.half + 2, axis: 'x', district: DK[zn], kind: 'sidewalk', road: rd.id });
    else w.walkways.push({ x0: s < 0 ? rd.c - rd.half - 2 : rd.c + rd.half, y0: t0, x1: s < 0 ? rd.c - rd.half : rd.c + rd.half + 2, y1: t1, axis: 'y', district: DK[zn], kind: 'sidewalk', road: rd.id });
    const off = s * (rd.half + .5) - .25; let k = s < 0 ? 0 : 2;
    for (let t = t0 + 1.5; t < t1 - 1.5; t += 4.5, k++) {
      const [x, y] = P(rd, t, off); if (c.occAt(x + .25, y + .25) !== 2) continue; const z = zoneOf(x, y), bridge = x > RIV.x0 - 2 && x < RIV.x1 + 2;
      if (k % 4 === 0) { const id = c.first(...(rd.half === 4 && z !== Z.oldtown && z !== Z.hillcrest ? ['prop.street.lamp.double'] : []), ...(LAMP[z] || LAMP[1]), 'ex.lamp'); c.put(id, x, y, { p: c.vp(id, r), free: true }); }
      else if (bridge) continue;
      else if (k % 4 === 2) { const l = TREE[z] || []; if (l.length && r() < .8) pv(pick(l), x, y, r, { free: true }); }
      else if (r() < .45) { const id = pick(SMALL[z] || SMALL[1]); if (!c.has(id)) continue; const sz = c.size(id, {}); if (Math.max(sz[0], sz[1]) > 1.6 && r() < .5) continue; pv(id, x - (rd.axis === 'y' && s < 0 ? sz[1] - .5 : 0), y - (rd.axis === 'x' && s < 0 ? Math.min(sz[1], 1) - .5 : 0), r, { free: true, flip: rd.axis === 'y' && sz[0] > 1 }); }
    }
  }
  /* signals + signs */
  const rname = id => c.roads.find(q => q.id === id).name;
  const sgn = nm => String(nm || '').replace(/ (St|Ave|Blvd|Dr|Rd|Ln|Way|Ct|Ter|Pkwy)$/, '').toUpperCase().slice(0, 9); // arm sign = the street you are crossing
  for (const n of c.nodes) {
    const cs = [[1, 1], [-1, -1], [1, -1], [-1, 1]].map(([sx, sy]) => [n.x + sx * (n.hx + .45) - .15, n.y + sy * (n.hy + .45) - .15]).filter(p => c.occAt(p[0], p[1]) === 2);
    if (n.signal) cs.forEach((p, i) => { c.put('prop.road.trafficlight', p[0], p[1], { p: Object.assign(c.vp('prop.road.trafficlight', r, { state: i % 2 ? 'red' : 'green' }), { name: sgn((i >= 2 ? n.rx : n.ry).name) }), flip: i >= 2 }); });
    else if (cs.length) c.put('prop.road.sign.stop', cs[0][0], cs[0][1], { p: {} });
    const q = cs[cs.length - 1]; if (q) c.put('prop.road.sign.street', q[0] + (n.signal ? .5 : 0), q[1] + (cs.length === 1 ? .5 : 0), { p: { name: n.rx.name.toUpperCase(), cross: n.ry.name.toUpperCase() } });
  }
  /* bus routes */
  const ROUTES = [{ id: 'bus1', name: '1 Ring', color: '#e0453a', xs: [52, 266], ys: [114, 296], n: 9 }, { id: 'bus2', name: '2 Airport - Maplewood', color: '#3f7fd0', xs: [234, 368], ys: [138, 296], n: 8 }, { id: 'bus3', name: '3 Old Town - Harbor', color: '#3f9a6a', xs: [82, 206], ys: [200, 296], n: 7 }];
  const stops = [];
  const roadAt = (axis, cc, t) => c.roads.find(q => q.axis === axis && q.c === cc && q.a <= t && q.b >= t);
  for (const R of ROUTES) {
    const [xa, xb] = R.xs, [ya, yb] = R.ys, legs = [{ axis: 'x', c: yb, a: xa, b: xb, dir: 1 }, { axis: 'y', c: xb, a: yb, b: ya, dir: -1 }, { axis: 'x', c: ya, a: xb, b: xa, dir: -1 }, { axis: 'y', c: xa, a: ya, b: yb, dir: 1 }];
    const lane = L => { const rd = roadAt(L.axis, L.c, (L.a + L.b) / 2), k = rd && rd.half === 4 ? 3 : 1; return L.c + (L.axis === 'x' ? L.dir * k : -L.dir * k); };
    const ln = legs.map(lane), path = [[ln[3], ln[0]], [ln[1], ln[0]], [ln[1], ln[2]], [ln[3], ln[2]]]; // corners: start of legs 0..3
    const per = 2 * (xb - xa + yb - ya), gap = per / R.n, ids = []; let d = gap * .35;
    legs.forEach((L, li) => { const len = Math.abs(L.b - L.a); while (d < len) {
      let t = L.a + L.dir * d; const rd = roadAt(L.axis, L.c, t); d += gap; if (!rd) continue;
      for (let it = 0; it < 12; it++) { const bad = c.nodes.find(n => (L.axis === 'x' ? n.rx : n.ry) === rd && Math.abs((L.axis === 'x' ? n.x : n.y) - t) < (L.axis === 'x' ? n.hx : n.hy) + 8); if (!bad && !(L.axis === 'x' && t > RIV.x0 - 6 && t < RIV.x1 + 6)) break; t += L.dir * 3; }
      const side = L.axis === 'x' ? L.dir : -L.dir, sw = L.c + side * (rd.half + 1), x = L.axis === 'x' ? t : sw, y = L.axis === 'x' ? sw : t;
      let st = stops.find(q => q.road === rd.id && q.side === side && Math.hypot(q.x - x, q.y - y) < 14);
      if (!st) { const cross = c.nodes.filter(n => (L.axis === 'x' ? n.rx : n.ry) === rd).sort((p, q) => Math.abs((L.axis === 'x' ? p.x : p.y) - t) - Math.abs((L.axis === 'x' ? q.x : q.y) - t))[0]; const nm = rd.name + (cross ? ' & ' + (L.axis === 'x' ? cross.ry : cross.rx).name : '');
        st = w.poi({ type: 'busstop', id: 'bus:' + (stops.length + 1), name: nm, x, y, road: rd.id, side, axis: L.axis, routes: [], lane: L.axis === 'x' ? { x: t, y: ln[li] } : { x: ln[li], y: t } }); stops.push(st);
        const cx = L.axis === 'x' ? t : L.c + side * (rd.half + .5) - .12, cy = L.axis === 'x' ? L.c + side * (rd.half + .5) - .12 : t; c.put('prop.road.busstop', cx, cy, { p: { routes: [R.name[0]] } });
        const bx = L.axis === 'x' ? t + 1 : L.c + side * (rd.half + 1.2) - .75, by = L.axis === 'x' ? L.c + side * (rd.half + 1.2) - .75 : t + 1, back = L.axis === 'x' ? c.occAt(t + 3, L.c + side * (rd.half + 3)) : c.occAt(L.c + side * (rd.half + 3), t + 3);
        if (back !== 3 && c.has('prop.road.busshelter')) c.put('prop.road.busshelter', L.axis === 'x' ? bx : bx - (side > 0 ? 0 : 0), by, { p: c.vp('prop.road.busshelter', r), flip: L.axis === 'y', free: true });
        const lo = side * (rd.half - 1.9), hi = side * (rd.half - .1), a0 = Math.min(lo, hi), a1 = Math.max(lo, hi); if (L.axis === 'x') { c.mark(t - 4, L.c + a0, t + 5, L.c + a0 + .12, YELLOW); c.mark(t - 4, L.c + a0, t - 3.88, L.c + a1, YELLOW); c.mark(t + 4.88, L.c + a0, t + 5, L.c + a1, YELLOW); } else { c.mark(L.c + a0, t - 4, L.c + a0 + .12, t + 5, YELLOW); c.mark(L.c + a0, t - 4, L.c + a1, t - 3.88, YELLOW); c.mark(L.c + a0, t + 4.88, L.c + a1, t + 5, YELLOW); } }
      st.routes.push(R.id); ids.push(st.id);
    } d -= len; });
    w.busRoutes.push({ id: R.id, name: R.name, color: R.color, stops: ids, path });
  }
  /* taxi stands */
  for (const [id, name, x, y, lx, ly] of [['central', 'Central Station', 222, 302.4, 222, 299], ['cityhall', 'City Hall', 224, 228.5, 224, 231], ['market', 'Old Town Market', 100, 260.5, 100, 263], ['boardwalk', 'Boardwalk', 126, 329.5, 126, 327], ['freshway', 'FreshWay Market', 284, 196.5, 284, 199], ['orpheum', 'The Orpheum', 218, 108.5, 218, 111], ['hillcrest', 'Hillcrest', 92, 36.5, 92, 39], ['riverwalk', 'River Walk', 174.5, 222, 177, 222]]) {
    w.poi({ type: 'taxistand', id: 'taxi:' + id, name: name + ' Taxi Stand', x, y, lane: { x: lx, y: ly } }); c.put('prop.road.taxistand', x + 1.2, y + (ly > y ? .9 : -.9) - .12, { p: {}, free: true }); }
  /* parked cars */
  const cars = c.tag('vehicle', 'car').filter(a => !a.tags.includes('emergency')).map(a => a.id).concat(['veh.van', 'veh.car.sedan', 'veh.car.hatch', 'veh.car.suv']).filter(c.has), rc = c.sub(102);
  for (const s of w.parking) { s.occupied = false; if (rc() > .62 || !cars.length) continue; const id = cars[Math.floor(rc() * cars.length)], p = c.vp(id, rc, { dir: rc() < .5 ? 1 : -1 }); delete p.seed; if (id === 'veh.taxi') p.parked = true; const ob = c.put(id, s.x, s.y, { p, flip: s.axis === 'y', solid: true }); s.occupied = !!ob; }
  /* wild greenery: woods on the fringes and hillsides */
  const rw = c.sub(103), WOOD = ['prop.nature.tree.pine', 'prop.nature.tree.fir', 'prop.nature.tree.spruce', 'prop.nature.tree.oak', 'prop.nature.tree.maple', 'prop.nature.tree.birch'].filter(c.has); let n = 0;
  const wild = (x, y) => c.occAt(x, y) === 0 && w.tileType(x, y) === GT.grass && w.steep(Math.floor(x), Math.floor(y)) < .5 && !c.blocks.some(b => x >= b.x0 - 1 && x <= b.x1 && y >= b.y0 - 1 && y <= b.y1);
  for (let i = 0; i < 5200 && n < 900; i++) { const x = 2 + rw() * (W - 4), y = 2 + rw() * 342; if (!wild(x, y)) continue; const zn = zoneOf(x, y); if (zn === Z.hillcrest && y > 27 && x > 28 && x < 136 && rw() < .75) continue; if ((zn === Z.maplewood || zn === Z.downtown || zn === Z.oldtown) && rw() < .5) continue;
    if (rw() < .12) pv(pick(['prop.nature.rock', 'prop.nature.bush', 'prop.nature.wildflowers', 'prop.nature.fern', 'prop.nature.stump', 'prop.nature.grass']), x, y, rw, { free: true }); else if (WOOD.length && pv(WOOD[Math.floor(rw() * rw() * WOOD.length)], x, y, rw, { free: true })) n++; }
  // rocks + reeds along the upper river and the spring pond
  for (let i = 0; i < 40; i++) { const y = 42 + rw() * 78, x = rw() < .5 ? 146 + rw() * 3 : 163 + rw() * 3; pv(pick(['prop.nature.rock', 'prop.nature.reeds', 'prop.nature.grass', 'prop.nature.tree.willow']), x, y, rw, { free: true }); }
  w.poi({ type: 'spot', kind: 'skate', name: 'Campus Skate Spot', x: 196, y: 96 }); w.poi({ type: 'spot', kind: 'cats', name: 'Cat Alley', x: 60, y: 240 }); w.poi({ type: 'spot', kind: 'planespotting', name: 'Runway Viewpoint', x: 270, y: 60 });
  w.poi({ type: 'landmark', name: 'Maple Falls', x: 156, y: 121 }); w.poi({ type: 'spot', kind: 'lookout', name: 'Maple Falls', x: 147, y: 124.5 });
}

/* owner msg 150 ("this newspaper dispenser bank is in the road"): street furniture placed at a half tile can be wider than the strip of pavement it stands on, so
   ten pieces city-wide hung half a tile over the asphalt. Last world step: every small street piece whose footprint touches asphalt is slid, by the smallest
   step that works, back onto pavement where nothing else stands. Nothing is removed. */
const OFFROAD = /^prop\.street\.(newsbox|bin|hydrant|mailbox|planter|recycling|bollard|atm|vending|utilitybox|postercolumn|aframe|bikeshare|bench|cart\.[a-z]+|kiosk|phonebooth|busshelter)|^prop\.road\.(meter|bikerack)/;
export function offRoad(c) {
  const w = c.world, ASPHALT = 3, onRoad = (x0, y0, x1, y1) => { for (let x = x0 + .1; x < x1; x += .2) for (let y = y0 + .1; y < y1; y += .2) { const t = w.tileType(x, y); if (t === ASPHALT || t === 0 || t === 6) return true; } return false; };
  const hits = (ob, x0, y0, x1, y1) => w.objs.some(o => o !== ob && o.solid && o.B[0] < x1 - .01 && o.B[3] > x0 + .01 && o.B[1] < y1 - .01 && o.B[4] > y0 + .01);
  let moved = 0;
  for (const ob of w.objs.slice()) {
    if (!OFFROAD.test(ob.id) || !onRoad(ob.B[0], ob.B[1], ob.B[3], ob.B[4])) continue;
    const sx = ob.size[0], sy = ob.size[1]; let best = null;
    for (let d = .5; d <= 6 && !best; d += .5) for (const [dx, dy] of [[-d, 0], [d, 0], [0, -d], [0, d], [-d, -d], [d, d], [-d, d], [d, -d]]) { const x = ob.x + dx, y = ob.y + dy; if (!onRoad(x, y, x + sx, y + sy) && !hits(ob, x, y, x + sx, y + sy)) { best = [x, y]; break; } }
    if (!best) continue;
    const o = { p: ob.p, flip: ob.flip, data: ob.data, solid: ob.solid }; w.remove(ob); w.place(ob.a, best[0], best[1], o); moved++;
  }
  return moved;
}
