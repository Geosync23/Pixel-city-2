// Light rail: trains on the viaduct loop, timetable, station boarding panel, tickets, and the G.transit 'train' mode.
//
// Trains exist abstractly all the time: position = f(G.state.t). NSETS trainsets per direction run the closed world.rail.path loop
// (dir 0 = path order on trackOffsets[1], livery line1 "Loop A"; dir 1 = reverse on trackOffsets[0], line2 "Loop B"), cruising at V units per
// game minute with ACC minutes of accel/brake padding per leg and DWELL game minutes at every station. Entities (3 cars each) are only
// built for sets within VIEW units of the camera in the city scene.
//
// G.rail
//   stations() -> [{id, name, x, y, s, entrance, ...}] in loop order      station(id)   (ids: hillcrest arts airport maplewood railyard central harbor oldtown;
//        'st_<id>' and 'station:<id>' are accepted everywhere)
//   nextTrains(stationId, t?) -> [{dir, train, minutes, boarding, departsIn, toward, towardId, line}] sorted by minutes (exact)
//   plan(fromId, toId, t?) -> {dir, train, wait, stops, minutes, via:[ids]}   best direction (wait + travel)
//   trainState(dir, train, t?) -> {dir, train, s, x, y, v, dwell, at, stop, next, frac, toDepart, eta, leg}
//   trains(t?) -> all states            timeTo(dir, train, stationId, t?) -> minutes until that train next arrives there
//   openStation(stationId)              the boarding panel (line diagram, departures, fare, destination -> "Wait on platform")
//   openTickets()                       day / weekly pass panel            diagram(curId, selId, onPick?) -> HTMLElement (line map)
//   ride(fromId, toId, opts?) -> Promise<bool>   pay (unless opts.free / pass), wait for the train (activity), ride in the cutaway scene ('train')
//        (also G.transit.rideTrain(from, to), G.transit mode 'train'). opts: { free, nowait: board the next train instantly }
//   alight(stationId)                   used by the ride scene: leave the train at a station (city entrance poi, or Central's hall)
//   platformOf(dir) -> 1 | 2   Central's platform of a direction (Loop A = 1, Loop B = 2); rides from Central board on the real platform
//        (room 'central_station:platforms': scene.platformBoard), arrivals are put on it (alight -> G.go(..., { arrive: dir }))
//   V, DWELL, ACC, NSETS, LOOP_MIN (per direction)
// Events: 'train:arrive'(stationId, {dir, train, near}), 'train:depart'(stationId, {...}); ride:start / ride:end('train', stationId) via G.transit.
// State: G.state.rail = { rides, cur: {dir, train, from, to} | null }.
import { G } from '../core/game.js';
import { asset } from '../art/registry.js';
import { assetSprite, prebakeAsset } from '../engine/sprites.js';
import { FARES } from '../data/economy.js';
import { getCity } from '../world/_city.js';
import { el, toast, modal } from '../ui/kit.js';
import { ROOMS } from '../scenes/interior.js';

export const order = 64;
/* QA13 (owner msg 131): was V 10, ACC 1.5, DWELL 6, NSETS 4 = a 163-min loop, a train every ~41 min each way, 2.2x walking speed: the train lost to walking almost everywhere.
   Now a ~80-min loop, a train every ~9 min each way (DWELL 4: the doors stay open ~2.7 game min, time to walk out at 1x), ~5.6x walking speed between stations (the ride scene and the city both follow trainState, so quotes stay exact). */
export const V = 26, ACC = 1, DWELL = 4, NSETS = 9, PITCH = 12.4, CARS = 3, VIEW = 95;
const LINE = [{ name: 'Loop A', color: '#d2412f', livery: 'line1' }, { name: 'Loop B', color: '#2f8f96', livery: 'line2' }];
const SHORT = { hillcrest: 'HILLCR', arts: 'ARTS Q', airport: 'AIRPORT', maplewood: 'MAPLEWD', railyard: 'RAILYD', central: 'CENTRAL', harbor: 'HARBOR', oldtown: 'OLDTOWN' };
const CSS = `.rail-win .win-body{max-width:340px}
.rail-map{position:relative;width:280px;height:140px;margin:2px auto 8px;flex:none}
.rail-map svg{position:absolute;left:0;top:0}
.rail-map .rm-st{position:absolute;width:20px;height:20px;margin:-10px 0 0 -10px;border:2px solid var(--edge,#2a2733);background:#fffbe8;padding:0;min-height:0;box-shadow:0 2px 0 var(--edge,#2a2733);cursor:pointer}
.rail-map .rm-st.cur{background:#2a2733}.rail-map .rm-st.cur:after{content:'';position:absolute;inset:4px;background:#fffbe8}
.rail-map .rm-st.sel{background:#f2c230}.rail-map .rm-st.via{background:#f7e3a0}
.rail-map .rm-l{position:absolute;font-size:11px;line-height:12px;white-space:nowrap;pointer-events:none;font-weight:700}
.rail-map .rm-t{position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border:2px solid #2a2733;pointer-events:none}
.rail-rows{display:flex;flex-direction:column;gap:3px;margin-bottom:6px}
.rail-row{display:flex;gap:8px;align-items:center;font-size:13px}.rail-row b{min-width:22px;text-align:center;color:#fff;padding:1px 5px;border:2px solid var(--edge,#2a2733)}
.rail-row i{font-style:normal;margin-left:auto;font-weight:700;white-space:nowrap}
.rail-note{font-size:13px;opacity:.9;margin:4px 0}.rail-sel{font-size:14px;font-weight:700;margin:6px 0;min-height:34px}
.rail-btns{display:flex;flex-direction:column;gap:6px;margin-top:6px}.rail-btns button{min-height:36px}`;

const HALL = 'int:central_station', PLAT = 'int:central_station:platforms', ROOMS_HAS = sid => ROOMS.has(sid.slice(4));
/** Central's platforms: Platform 1 = Loop A (dir 0), Platform 2 = Loop B (dir 1) */
export const platformOf = dir => (dir ? 2 : 1);
let S = null, NET = null, sets = [], carA = null, lastChime = -9;
const mod = (a, n) => ((a % n) + n) % n;
const norm = id => String(id && id.id ? id.id : id || '').replace(/^station:|^st_/, '');
const fmt = n => G.money && G.money.fmt ? G.money.fmt(n) : '$' + n;
const sfx = n => { try { G.audio && G.audio.sfx && G.audio.sfx(n); } catch (e) { } };
const hasPass = () => !!(G.transit && G.transit.hasPass && G.transit.hasPass());

/* ---------- network + timetable ---------- */
function net() {
  if (NET) return NET; const w = getCity(), rail = w && w.rail; if (!rail) return null;
  const P = rail.path, n = P.length, seg = []; let tot = 0;
  for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], len = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push({ a, b, len, s0: tot, dx: (b[0] - a[0]) / len, dy: (b[1] - a[1]) / len }); tot += len; }
  const arc = (x, y) => { let bs = 0, bd = 1e9; for (const g of seg) { const t = Math.max(0, Math.min(g.len, (x - g.a[0]) * g.dx + (y - g.a[1]) * g.dy)), d = Math.hypot(g.a[0] + g.dx * t - x, g.a[1] + g.dy * t - y); if (d < bd) { bd = d; bs = g.s0 + t; } } return bs; };
  const sts = rail.stations.map(s => Object.assign({}, s, { s: arc(s.x, s.y) })).sort((a, b) => a.s - b.s);
  const dirs = [1, -1].map((sg, di) => {
    const stops = (sg > 0 ? sts : sts.slice().reverse()).map(st => ({ st, id: st.id, d: sg > 0 ? st.s : mod(tot - st.s, tot) })).sort((a, b) => a.d - b.d);
    let t = 0; stops.forEach((p, i) => { p.i = i; p.arr = t; p.dep = t + DWELL; p.L = mod(stops[(i + 1) % stops.length].d - p.d, tot); p.run = p.L / V + ACC; t = p.dep + p.run; });
    return { sg, di, stops, T: t, off: rail.trackOffsets ? rail.trackOffsets[sg > 0 ? 1 : 0] : sg * 1.3 };
  });
  const corner = (i, off) => { const g = seg[i], q = seg[(i - 1 + n) % n]; return [g.a[0] + (-g.dy - q.dy) * off, g.a[1] + (g.dx + q.dx) * off]; };
  return NET = { w, rail, seg, tot, sts, dirs, corner, byId: Object.fromEntries(sts.map(s => [s.id, s])) };
}
function posAt(s, off) {
  const N = NET; s = mod(s, N.tot); let i = 0; while (i < N.seg.length - 1 && s >= N.seg[i].s0 + N.seg[i].len) i++;
  const g = N.seg[i], t = (s - g.s0) / g.len, A = N.corner(i, off), B = N.corner((i + 1) % N.seg.length, off);
  return { x: A[0] + (B[0] - A[0]) * t, y: A[1] + (B[1] - A[1]) * t, g };
}
const phase = (D, j, t) => mod(t + j * D.T / NSETS + D.di * D.T / (2 * NSETS) + 7, D.T);
function trainState(di, j, t = G.state.t) {
  const N = net(), D = N.dirs[di], tau = phase(D, j, t), st = D.stops; let i = st.length - 1; while (i > 0 && st[i].arr > tau) i--;
  const p = st[i], nx = st[(i + 1) % st.length]; let x = 0, v = 0, dwell = tau < p.dep;
  if (!dwell) { const u = tau - p.dep, a = V / ACC; if (u < ACC) { x = .5 * a * u * u; v = a * u; } else if (u > p.run - ACC) { const r = p.run - u; x = p.L - .5 * a * r * r; v = a * r; } else { x = V * (u - ACC / 2); v = V; } }
  const d = p.d + x, s = D.sg > 0 ? mod(d, N.tot) : mod(N.tot - d, N.tot), q = posAt(s, D.off);
  return { dir: di, train: j, d, s, x: q.x, y: q.y, g: q.g, v, dwell, at: dwell ? p.id : null, stop: p, next: dwell ? p : nx, leg: p, frac: p.L ? x / p.L : 0, toDepart: dwell ? p.dep - tau : 0, eta: dwell ? 0 : p.dep + p.run - tau, sinceArr: dwell ? tau - p.arr : 0 };
}
function timeTo(di, j, stationId, t = G.state.t) { const D = net().dirs[di], p = D.stops.find(q => q.id === norm(stationId)); return p ? mod(p.arr - phase(D, j, t), D.T) : Infinity; }
function nextTrains(stationId, t = G.state.t) {
  const N = net(), id = norm(stationId), out = []; if (!N || !N.byId[id]) return out;
  for (const D of N.dirs) {
    const p = D.stops.find(q => q.id === id), nx = D.stops[(p.i + 1) % D.stops.length];
    for (let j = 0; j < NSETS; j++) { const tau = phase(D, j, t), boarding = tau >= p.arr && tau < p.dep - .25, w = boarding ? 0 : mod(p.arr - tau, D.T); out.push({ dir: D.di, train: j, minutes: w, boarding, departsIn: boarding ? p.dep - tau : w + DWELL, toward: nx.st.name, towardId: nx.id, line: LINE[D.di].name }); }
  }
  return out.sort((a, b) => a.minutes - b.minutes);
}
function plan(from, to, t = G.state.t) {
  const N = net(); from = norm(from); to = norm(to); if (!N || !N.byId[from] || !N.byId[to] || from === to) return null; let best = null;
  for (const D of N.dirs) {
    const n = D.stops.length, a = D.stops.find(q => q.id === from), via = []; let mins = 0, i = a.i;
    while (D.stops[i].id !== to) { mins += D.stops[i].run + (i === a.i ? 0 : DWELL); i = (i + 1) % n; via.push(D.stops[i].id); }
    const nt = nextTrains(from, t).find(q => q.dir === D.di), o = { dir: D.di, train: nt.train, wait: nt.minutes, boarding: nt.boarding, departsIn: nt.departsIn, stops: via.length, minutes: mins, via, line: LINE[D.di].name, toward: nt.toward };
    if (!best || o.wait + o.minutes + (o.boarding ? 0 : DWELL) < best.wait + best.minutes + (best.boarding ? 0 : DWELL) - .01) best = o;
  }
  return best;
}

/* ---------- trains in the city ---------- */
const OLD_SORT = typeof location !== 'undefined' && /[?&]occl=old\b/.test(location.search || '');   // test switch (tools/occl_check.mjs): the cars' sort boxes as before the occlusion pass
const SORT_UP = OLD_SORT ? 0 : .5;   // the cars' sort boxes stand this much above their floors (the renderer treats what is clear of a box by .5 as "above it", whatever is beside it: engine/render.js behindLong, ZM)
function mkCar(set, k) {
  return { x: 0, y: 0, z: 0, bb: [0, 0, 12, 2.2, 2.6], vb: [-.3, -.3, 12.3, 2.5, 3.1, 0], thru: true, set, k, p: null, key: '', flip: false, isTrain: true,   /* vb: the box the car is painted in (the renderer's outline test, docs/reports/occlusion.md); bb is the sort box, lifted below. thru: drawn over what stands in its path */
    // sort z (this.z) is lifted strictly above everything under the car floor (deck slabs, lamp tops); the sprite is shifted back down by the same amount (lift) so the picture does not move
    lift: 0, _sh: null, sprite() { const spr = assetSprite(carA, this.p, this.flip, this.key); if (!this.lift || !spr) return spr; const sh = this._sh; if (sh && sh.src === spr && sh.lift === this.lift) return sh.out; const out = Object.assign({}, spr, { y: spr.y + Math.round(this.lift * 16) }); this._sh = { src: spr, lift: this.lift, out }; return out; },
    prebake(pri) { if (this.p) prebakeAsset(carA, this.p, this.flip, pri, this.key); } }; // performance report: bake train cars ahead (QA13)
}
/* objects along the line that sit under the cars' floor: their tops must sort below the cars (long thin deck boxes otherwise tie with the car boxes -> draw-order flicker) */
let UNDER = null;
function underList(N) {
  if (UNDER) return UNDER; UNDER = []; const P = N.rail.path, m = 4.6;
  for (const ob of N.w.objs) { const B = ob.B; if (!B) continue; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if (B[3] < Math.min(a[0], b[0]) - m || B[0] > Math.max(a[0], b[0]) + m || B[4] < Math.min(a[1], b[1]) - m || B[1] > Math.max(a[1], b[1]) + m) continue; UNDER.push(ob); break; } }
  return UNDER;
}
function placeCars(set, st) {
  const N = NET, D = N.dirs[set.dir], dest = SHORT[st.next.id] || 'LOOP';
  for (let k = 0; k < CARS; k++) {
    const c = set.cars[k], d = st.d + (1 - k) * PITCH, s = D.sg > 0 ? mod(d, N.tot) : mod(N.tot - d, N.tot), q = posAt(s, D.off), ax = Math.abs(q.g.dx) > .5, mv = D.sg * (q.g.dx + q.g.dy) > 0 ? 1 : -1;
    const head = k === 0 ? (mv > 0 ? 'front' : 'rear') : k === CARS - 1 ? (mv > 0 ? 'rear' : 'front') : 'mid', key = head + mv + (ax ? 'x' : 'y') + dest;
    if (c.sig !== key) { c.sig = key; c.flip = !ax; c.p = { head, livery: LINE[set.dir].livery, dir: mv, dest, line: set.dir + 1, seed: set.train * 7 + k + 1 }; c.key = 'railcar|' + set.dir + '|' + set.train + '|' + k + '|' + key; c.bb = ax ? [0, 0, 12, 2.2, 2.6] : [0, 0, 2.2, 12, 2.6]; }
    c.x = ax ? q.x - 6 : q.x - 1.1; c.y = ax ? q.y - 1.1 : q.y - 6;
    const e = ax ? [q.x - 5.5, q.y, q.x + 5.5, q.y] : [q.x, q.y - 5.5, q.x, q.y + 5.5];
    const zd = Math.ceil(Math.max(N.rail.deckZ(q.x, q.y), N.rail.deckZ(e[0], e[1]), N.rail.deckZ(e[2], e[3])) * 8) / 8 + .0625;
    // footprint slightly inside the deck's and the other track's; sort base above every top that ends below the car body
    // The sort box is also stretched along the track to the full extent of the deck segments under the car: otherwise a pier / lamp under the far end of
    // such a segment is "in front" of the car by x while "behind" the deck by z and the deck is "behind" the car -> a cycle the sorter breaks differently each frame.
    const x0 = c.x, y0 = c.y, x1 = c.x + (ax ? 12 : 2.2), y1 = c.y + (ax ? 2.2 : 12); let top = zd, lo = ax ? x0 : y0, hi = ax ? x1 : y1; const U = underList(N);
    for (const ob of U) { const B = ob.B; if (B[0] >= x1 || x0 >= B[3] || B[1] >= y1 || y0 >= B[4]) continue; if (B[5] > top && B[5] < zd + .9 && B[2] < zd) top = B[5]; }
    const zs = (top > zd ? Math.ceil((top + .02) * 16) / 16 : zd) + SORT_UP; c.z = zs; c.lift = zs - zd; { const v = c.vb; v[2] = ax ? 12.3 : 2.5; v[3] = ax ? 2.5 : 12.3; v[5] = -c.lift; }
    for (const ob of U) { const B = ob.B; if (B[0] >= x1 || x0 >= B[3] || B[1] >= y1 || y0 >= B[4] || B[5] > zs || B[5] - B[2] > 1.5 || ob.id.indexOf('prop.rail.viaduct') !== 0) continue; if (ax) { if (B[0] < lo) lo = B[0]; if (B[3] > hi) hi = B[3]; } else { if (B[1] < lo) lo = B[1]; if (B[4] > hi) hi = B[4]; } }
    if (OLD_SORT && !(G.rail && G.rail._noLift)) c.bb = ax ? [lo - c.x, 0, hi - c.x, 2.2, 2.6] : [0, lo - c.y, 2.2, hi - c.y, 2.6];
  }
}
function tick() {
  const N = net(); if (!N) return; const city = G.scene && G.scene.id === 'city' ? G.scene : null, f = G.camTarget || G.player, t = G.state.t;
  for (const set of sets) {
    const st = trainState(set.dir, set.train, t), near = !!city && f && Math.abs(st.x - f.x) + Math.abs(st.y - f.y) < VIEW;
    if (st.dwell !== set.dwell || (st.dwell && st.at !== set.at)) {
      if (set.dwell !== undefined) { const info = { dir: set.dir, train: set.train, near }; if (st.dwell) G.emit('train:arrive', st.at, info); else G.emit('train:depart', set.at, info); if (near && G.time - lastChime > 3 && Math.abs(st.x - f.x) + Math.abs(st.y - f.y) < 32) { lastChime = G.time; sfx(st.dwell ? 'train_chime' : 'train_door'); } }
      set.dwell = st.dwell; set.at = st.at;
    }
    if (near) { if (!set.on) { set.on = true; for (const c of set.cars) if (!city.ents.includes(c)) city.ents.push(c); } placeCars(set, st); }
    else if (set.on) { set.on = false; const c = G.sceneCache.get('city'); if (c) for (const e of set.cars) { const i = c.ents.indexOf(e); if (i >= 0) c.ents.splice(i, 1); } }
  }
}

/* ---------- UI: line diagram, boarding panel, tickets ---------- */
const NODE = { hillcrest: [62, 22, 't'], arts: [140, 22, 't'], airport: [218, 22, 't'], maplewood: [256, 70, 'r'], railyard: [218, 118, 'b'], central: [140, 118, 'b'], harbor: [62, 118, 'b'], oldtown: [24, 70, 'l'] };
function diagram(cur, sel, onPick, via) {
  const N = net(), box = el('div.rail-map'); cur = norm(cur); sel = sel && norm(sel);
  const pts = N.sts.map(s => NODE[s.id] || [140, 70]);
  box.innerHTML = `<svg width="280" height="140" viewBox="0 0 280 140" shape-rendering="crispEdges"><polygon points="${pts.map(p => p[0] + ',' + p[1]).join(' ')}" fill="none" stroke="#2a2733" stroke-width="8"/><polygon points="${pts.map(p => p[0] + ',' + p[1]).join(' ')}" fill="none" stroke="#e9e4d6" stroke-width="4"/></svg>`;
  for (const D of N.dirs) for (let j = 0; j < NSETS; j++) { // live train markers
    const st = trainState(D.di, j), a = NODE[st.leg.id], b = NODE[D.stops[(st.leg.i + 1) % D.stops.length].id], k = st.dwell ? 0 : st.frac, o = D.di ? 4 : -4;
    box.append(el('div.rm-t', { style: { left: (a[0] + (b[0] - a[0]) * k) + 'px', top: (a[1] + (b[1] - a[1]) * k + o) + 'px', background: LINE[D.di].color } }));
  }
  for (const s of N.sts) {
    const p = NODE[s.id], b = el('button.rm-st' + (s.id === cur ? '.cur' : '') + (s.id === sel ? '.sel' : '') + (via && via.includes(s.id) && s.id !== sel ? '.via' : ''), { 'aria-label': s.name, 'data-st': s.id, onclick: () => onPick && s.id !== cur && onPick(s.id) });
    b.style.left = p[0] + 'px'; b.style.top = p[1] + 'px'; box.append(b);
    const l = el('div.rm-l', { text: s.name }), st = l.style;
    if (p[2] === 't') { st.left = p[0] + 'px'; st.top = (p[1] + 15) + 'px'; st.transform = 'translateX(-50%)'; } else if (p[2] === 'b') { st.left = p[0] + 'px'; st.top = (p[1] - 27) + 'px'; st.transform = 'translateX(-50%)'; }
    else if (p[2] === 'l') { st.left = (p[0] + 16) + 'px'; st.top = (p[1] - 6) + 'px'; } else { st.right = (280 - p[0] + 16) + 'px'; st.top = (p[1] - 6) + 'px'; }
    box.append(l);
  }
  return box;
}
const mins = m => m < .5 ? 'now' : Math.round(m) + ' min';
function openStation(stationId) {
  const N = net(), id = norm(stationId), here = N && N.byId[id]; if (!here) return null;
  const m = modal({ title: here.name + ' Station', cls: 'rail-win' }), free = hasPass(), price = FARES.train.single;
  // nav hook: an active navigator trip boarding here pre-selects its destination station
  const navTo = (() => { try { const t = G.nav && G.nav.trip && G.nav.trip(); return t && t.mode === 'train' && t.stage === 0 && norm(t.from) === id && N.byId[norm(t.to)] ? norm(t.to) : null; } catch (e) { return null; } })(); let sel = navTo;
  const draw = () => {
    m.body.textContent = ''; const pl = sel ? plan(id, sel) : null;
    m.body.append(diagram(id, sel, s => { sel = s; sfx('click'); draw(); }, pl ? pl.via : null));
    const rows = el('div.rail-rows'), nt = nextTrains(id);
    for (const di of [0, 1]) { const a = nt.filter(q => q.dir === di).slice(0, 2); if (!a.length) continue; rows.append(el('div.rail-row', null, el('b', { text: di ? 'B' : 'A', style: { background: LINE[di].color } }), el('span', { text: (id === 'central' ? 'Platform ' + platformOf(di) + ' · ' : '') + 'toward ' + a[0].toward }), el('i', { text: (a[0].boarding ? 'boarding' : mins(a[0].minutes)) + (a[1] ? ', ' + mins(a[1].minutes) : '') }))); }
    const tk = tickets(), ok = free || tk > 0;
    m.body.append(rows, el('div.rail-note', { text: free ? 'Pass valid: your rides are free.' : tk ? 'You have ' + tk + (tk === 1 ? ' ticket' : ' tickets') + '. One ticket = one ride, any distance.' : 'You need a ticket to board: ' + fmt(price) + ' flat, any distance. Free with a transit pass.' }));
    m.body.append(el('div.rail-sel', { text: pl ? (sel === navTo ? 'Your trip - to ' : 'To ') + N.byId[sel].name + ': ' + pl.line + ', ' + pl.stops + (pl.stops === 1 ? ' stop' : ' stops') + ', about ' + Math.round(pl.minutes + (pl.boarding ? Math.max(0, pl.departsIn) : DWELL)) + ' min on board. ' + (id === 'central' ? 'Platform ' + platformOf(pl.dir) + '. ' : '') + (pl.boarding ? 'Boarding now.' : 'Train in ' + mins(pl.wait) + '.') : 'Tap a station on the map to choose where to go.' }));
    const go = el('button' + (ok ? '.primary' : ''), { text: (id === 'central' && pl ? 'Go to Platform ' + platformOf(pl.dir) : 'Wait on platform') + (!ok ? ' (ticket needed)' : free ? ' (pass valid)' : ' (uses 1 ticket)'), 'data-act': 'board', disabled: !pl || !ok, onclick: () => { m.close(); ride(id, sel); } });
    const buy = !free && el('button' + (ok ? '' : '.primary'), { text: 'Buy ticket ' + fmt(price), 'data-act': 'ticket', onclick: () => { if (buyTicket()) draw(); } });
    m.body.append(el('div.rail-btns', null, buy, go, !free && el('button', { text: 'Tickets & passes', onclick: () => { m.close(); openTickets(() => openStation(id)); } })));
  };
  draw(); return m;
}
const tickets = () => (S && S.tickets) || 0;
/** flat-fare single ticket (any distance); kept in G.state.rail.tickets until used */
function buyTicket() { const ok = G.transit && G.transit.payFare ? G.transit.payFare('train') : !!(G.money && G.money.pay(FARES.train.single, 'Train ticket') !== false); if (!ok) return false; S.tickets = tickets() + 1; sfx('pay'); toast('Train ticket bought (' + fmt(FARES.train.single) + '). Good for one ride, any distance.', 'good'); return true; }
function passes() { const P = FARES.transitPass || { price: 18, days: 7 }; return [{ id: 'day', name: 'Day pass', price: Math.round(FARES.train.single * 2.4), days: 1 }, { id: 'week', name: 'Weekly pass', price: P.price, days: P.days }]; }
function buyPass(id) { const p = passes().find(q => q.id === id); if (!p || !G.money || G.money.pay(p.price, 'Transit pass') === false) return false; G.inv && G.inv.grant && G.inv.grant('transit', p.days); sfx('pay'); toast(p.name + ' bought: unlimited train and bus rides for ' + (p.days === 1 ? 'a day' : p.days + ' days') + '.', 'good'); return true; }
function openTickets(after) {
  const m = modal({ title: 'Tickets & passes', cls: 'rail-win', onClose: () => after && after() });
  const until = G.inv && G.inv.accessUntil ? G.inv.accessUntil('transit') : 0, left = until - G.state.t;
  m.body.append(el('div.rail-note', { text: hasPass() ? 'Your transit pass is valid for ' + (left > 1440 ? Math.ceil(left / 1440) + ' more days.' : Math.max(1, Math.round(left / 60)) + ' more hours.') : 'No pass yet. A single train ticket is ' + fmt(FARES.train.single) + ', any distance (bus ' + fmt(FARES.bus.single) + ').' + (tickets() ? ' Tickets in your pocket: ' + tickets() + '.' : '') }));
  if (!hasPass()) m.body.append(el('div.rail-btns', null, el('button.primary', { text: 'Single ticket - ' + fmt(FARES.train.single) + ' (one ride)', 'data-act': 'ticket', onclick: () => { if (buyTicket()) m.close(); } })));
  m.body.append(el('div.rail-btns', null, passes().map(p => el('button', { text: p.name + ' - ' + fmt(p.price) + ' (' + (p.days === 1 ? '24 hours' : p.days + ' days') + ')', 'data-pass': p.id, onclick: () => { if (buyPass(p.id)) m.close(); } }))));
  return m;
}

/* ---------- riding ---------- */
function freeSpot(w, x, y) { if (!w.isBlocked(x, y)) return { x, y }; for (let r = .5; r < 6; r += .5) for (let a = 0; a < 8; a++) { const px = x + Math.cos(a * Math.PI / 4) * r, py = y + Math.sin(a * Math.PI / 4) * r; if (!w.isBlocked(px, py)) return { x: px, y: py }; } return { x, y }; }
function ride(from, to, opts = {}) {
  return new Promise(res => {
    const N = net(); from = norm(from); to = norm(to); const pl = plan(from, to);
    if (!pl || G.busy || (G.transit && G.transit.ride)) { if (!pl) toast('Pick another station.'); return res(false); }
    const price = opts.free || hasPass() ? 0 : FARES.train.single; // a ticket (or pass) is required; callers without one buy at the gate
    if (price && !tickets() && !buyTicket()) { toast('You need a train ticket (' + fmt(FARES.train.single) + ').'); return res(false); }
    const st = N.byId[from], inCity = G.scene && G.scene.id === 'city';
    const board = tr => {
      if (tr !== undefined && tr >= 0) pl.train = tr;   /* the platform room boards the set that is really standing there */
      if (price) S.tickets = Math.max(0, tickets() - 1);
      G.camTarget = null; S.cur = { dir: pl.dir, train: pl.train, from, to }; S.rides = (S.rides || 0) + 1;
      if (G.transit && G.transit.beginRide) G.transit.beginRide({ kind: 'train', destination: to, from, fare: price, resolve: res }); else res(true);
      G.go('train', { ride: S.cur });
    };
    /* Central: you board on the real platform (scenes/rooms/station_platforms.js). From the hall the gates are passed first; from anywhere else the old wait applies. */
    if (from === 'central' && !opts.nowait && G.scene) {
      const keep = () => { if (price) toast('You keep your ticket for later.'); res(false); };
      if (G.scene.id === PLAT && G.scene.platformBoard) return G.scene.platformBoard(pl.dir, to, board, keep);
      if (G.scene.id === HALL && ROOMS_HAS(PLAT)) return G.go(PLAT, { from: 'hall' }).then(sc => (sc && sc.platformBoard ? sc.platformBoard(pl.dir, to, board, keep) : board()), () => res(false));
    }
    if (opts.nowait || pl.boarding && pl.departsIn > 1) return board();
    const wait = pl.wait + .6; toast(inCity ? 'You head up to the platform. ' + pl.line + ' in ' + mins(pl.wait) + '.' : pl.line + ' toward ' + pl.toward + ' in ' + mins(pl.wait) + '.');
    if (inCity) G.camTarget = { x: st.x, y: st.y, z: st.platformZ || 6 };
    G.startActivity({ label: 'Waiting for the train', anim: 'phone', minutes: wait, rate: Math.max(2.5, wait / 4.5), hide: inCity, done: board,
      cancel: () => { G.camTarget = null; if (price) toast('You keep your ticket for later.'); res(false); } });
  });
}
async function alight(stationId) {
  const N = net(), id = norm(stationId), st = N.byId[id]; if (!st) return; const dir = S.cur ? S.cur.dir : 0; S.cur = null;
  if (G.transit && G.transit.ride && G.transit.ride.kind === 'train') G.transit.ride.destination = id;
  if (id === 'central' && G.scenes.has('int:')) { G.state.flags.lastDoor = 'door:central_station'; try { await G.go(ROOMS_HAS(PLAT) ? PLAT : HALL, ROOMS_HAS(PLAT) ? { arrive: dir } : { x: 15, y: 4.6, dir: 1 }); }   /* onto the platform of your line; the stairs lead down to the hall */ catch (e) { await G.go('city', freeSpot(N.w, st.entrance.x, st.entrance.y)); } }
  else await G.go('city', freeSpot(N.w, st.entrance.x, st.entrance.y));
  toast('Arrived: ' + st.name + ' Station', 'good');
  if (G.transit && G.transit.ride && G.transit.ride.kind === 'train') G.transit.endRide(true);
}

const stairs = [];
export function init() {
  const boot = () => { S = G.defineState('rail', () => ({ rides: 0, cur: null })); };
  boot(); G.on('load', () => { S = G.state.rail || G.defineState('rail', () => ({ rides: 0, cur: null })); });
  if (typeof document !== 'undefined') document.head.append(el('style', { text: CSS }));
  const N = net(); if (!N) return;
  try { carA = asset('veh.train.car'); } catch (e) { carA = null; }
  if (carA) for (const D of N.dirs) for (let j = 0; j < NSETS; j++) { const set = { dir: D.di, train: j, cars: [], on: false }; for (let k = 0; k < CARS; k++) set.cars.push(mkCar(set, k)); sets.push(set); }
  G.addSystem({ name: 'rail', update: tick });
  for (const st of N.sts) if (st.id !== 'central') G.addInteractable({ scene: 'city', x: st.entrance.x, y: st.entrance.y, label: st.name + ' Station', h: 1.4, range: 1.8, hit: 16, use: () => openStation(st.id) });
  // the visible stairs / elevators up to each platform are usable too (same panel as the entrance), with the welcome glow
  try {
    const w = N.w, cand = st => { let best = null; for (const ob of w.objs) { if (ob.id !== 'bld.rail.stairs' && ob.id !== 'bld.rail.elevator') continue; const B = ob.B, cx = (B[0] + B[3]) / 2, cy = (B[1] + B[4]) / 2; if (Math.hypot(cx - st.x, cy - st.y) > 16) continue;
      // target: the stair FOOT (low end of the long axis: the flight rises along +x, or +y when flipped); elevators: the side facing the entrance
      const lift = ob.id === 'bld.rail.elevator', ex = st.entrance.x - cx, ey = st.entrance.y - cy, sideY = true || ex,
        tx = lift ? (sideY ? cx : (ex > 0 ? B[3] + .6 : B[0] - .6)) : (ob.flip ? cx : B[0] - .6), ty = lift ? (sideY ? (ey > 0 ? B[4] + .6 : B[1] - .6) : cy) : (ob.flip ? B[1] - .6 : cy);
      let f = null, fd = 1e9; for (let x = Math.floor(B[0]) - 2; x <= B[3] + 2; x += .5) for (let y = Math.floor(B[1]) - 2; y <= B[4] + 2; y += .5) { const px = x + .25, py = y + .25; if (px > B[0] - .3 && px < B[3] + .3 && py > B[1] - .3 && py < B[4] + .3) continue; if (w.isBlocked(px, py)) continue; const d = Math.hypot(px - tx, py - ty); if (d < fd) { fd = d; f = { x: px, y: py }; } }
      if (f && fd < 3.5) (best = best || []).push({ ob, f, cx, cy, lift }); } return best || []; };
    for (const st of N.sts) if (st.id !== 'central') for (const q of cand(st)) { const label = (q.lift ? 'Elevator to ' : 'Stairs to ') + st.name + ' platform';
      G.addInteractable({ scene: 'city', x: q.f.x, y: q.f.y, label, h: 1.4, range: 1.8, hit: 18, use: () => openStation(st.id) }); stairs.push({ station: st.id, x: q.f.x, y: q.f.y, lift: q.lift });
      if (w.poi) w.poi({ type: 'stairs', glow: true, id: 'stairs:' + st.id + ':' + stairs.length, name: label, x: q.f.x, y: q.f.y, station: st.id }); }
  } catch (e) { console.warn('rail stairs: ' + e.message); }
  G.rail = {
    stairs: () => stairs, buyTicket, tickets, platformOf, hasPass,
    V, DWELL, ACC, NSETS, get LOOP_MIN() { return N.dirs[0].T; }, lines: LINE,
    stations: () => N.sts, station: id => N.byId[norm(id)] || null, nextTrains, plan, trainState, timeTo, trains: t => sets.map(s => trainState(s.dir, s.train, t)),
    openStation, openTickets, buyPass, passes, diagram, ride, alight, sets: () => sets,
  };
  if (G.transit && G.transit.registerMode) G.transit.registerMode('train', { ride, fare: () => (hasPass() ? 0 : FARES.train.single) });
}
