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
//   V, DWELL, ACC, NSETS, LOOP_MIN (per direction)
// Events: 'train:arrive'(stationId, {dir, train, near}), 'train:depart'(stationId, {...}); ride:start / ride:end('train', stationId) via G.transit.
// State: G.state.rail = { rides, cur: {dir, train, from, to} | null }.
import { G } from '../core/game.js';
import { asset } from '../art/registry.js';
import { assetSprite } from '../engine/sprites.js';
import { FARES } from '../data/economy.js';
import { getCity } from '../world/_city.js';
import { el, toast, modal } from '../ui/kit.js';

export const order = 64;
export const V = 10, ACC = 1.5, DWELL = 6, NSETS = 4, PITCH = 12.4, CARS = 3, VIEW = 95;
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
function mkCar(set, k) {
  return { x: 0, y: 0, z: 0, bb: [0, 0, 12, 2.2, 2.6], set, k, p: null, key: '', flip: false, isTrain: true,
    sprite() { return assetSprite(carA, this.p, this.flip, this.key); } };
}
function placeCars(set, st) {
  const N = NET, D = N.dirs[set.dir], dest = SHORT[st.next.id] || 'LOOP';
  for (let k = 0; k < CARS; k++) {
    const c = set.cars[k], d = st.d + (1 - k) * PITCH, s = D.sg > 0 ? mod(d, N.tot) : mod(N.tot - d, N.tot), q = posAt(s, D.off), ax = Math.abs(q.g.dx) > .5, mv = D.sg * (q.g.dx + q.g.dy) > 0 ? 1 : -1;
    const head = k === 0 ? (mv > 0 ? 'front' : 'rear') : k === CARS - 1 ? (mv > 0 ? 'rear' : 'front') : 'mid', key = head + mv + (ax ? 'x' : 'y') + dest;
    if (c.sig !== key) { c.sig = key; c.flip = !ax; c.p = { head, livery: LINE[set.dir].livery, dir: mv, dest, line: set.dir + 1, seed: set.train * 7 + k + 1 }; c.key = 'railcar|' + set.dir + '|' + set.train + '|' + k + '|' + key; c.bb = ax ? [0, 0, 12, 2.2, 2.6] : [0, 0, 2.2, 12, 2.6]; }
    c.x = ax ? q.x - 6 : q.x - 1.1; c.y = ax ? q.y - 1.1 : q.y - 6;
    const e = ax ? [q.x - 5.5, q.y, q.x + 5.5, q.y] : [q.x, q.y - 5.5, q.x, q.y + 5.5];
    c.z = Math.ceil(Math.max(N.rail.deckZ(q.x, q.y), N.rail.deckZ(e[0], e[1]), N.rail.deckZ(e[2], e[3])) * 8) / 8 + .0625;
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
  const m = modal({ title: here.name + ' Station', cls: 'rail-win' }), free = hasPass(), price = FARES.train.single; let sel = null;
  const draw = () => {
    m.body.textContent = ''; const pl = sel ? plan(id, sel) : null;
    m.body.append(diagram(id, sel, s => { sel = s; sfx('click'); draw(); }, pl ? pl.via : null));
    const rows = el('div.rail-rows'), nt = nextTrains(id);
    for (const di of [0, 1]) { const a = nt.filter(q => q.dir === di).slice(0, 2); if (!a.length) continue; rows.append(el('div.rail-row', null, el('b', { text: di ? 'B' : 'A', style: { background: LINE[di].color } }), el('span', { text: 'toward ' + a[0].toward }), el('i', { text: (a[0].boarding ? 'boarding' : mins(a[0].minutes)) + (a[1] ? ', ' + mins(a[1].minutes) : '') }))); }
    m.body.append(rows, el('div.rail-note', { text: free ? 'Transit pass: your rides are free.' : 'Single ride ' + fmt(price) + ', any distance. Free with a transit pass.' }));
    m.body.append(el('div.rail-sel', { text: pl ? 'To ' + N.byId[sel].name + ': ' + pl.line + ', ' + pl.stops + (pl.stops === 1 ? ' stop' : ' stops') + ', about ' + Math.round(pl.minutes) + ' min. ' + (pl.boarding ? 'Boarding now.' : 'Train in ' + mins(pl.wait) + '.') : 'Tap a station on the map to choose where to go.' }));
    const go = el('button.primary', { text: pl ? 'Wait on platform' + (free ? '' : ' (' + fmt(price) + ')') : 'Wait on platform', disabled: !pl, onclick: () => { m.close(); ride(id, sel); } });
    m.body.append(el('div.rail-btns', null, go, !free && el('button', { text: 'Tickets & passes', onclick: () => { m.close(); openTickets(() => openStation(id)); } })));
  };
  draw(); return m;
}
function passes() { const P = FARES.transitPass || { price: 18, days: 7 }; return [{ id: 'day', name: 'Day pass', price: Math.round(FARES.train.single * 2.4), days: 1 }, { id: 'week', name: 'Weekly pass', price: P.price, days: P.days }]; }
function buyPass(id) { const p = passes().find(q => q.id === id); if (!p || !G.money || G.money.pay(p.price, 'Transit pass') === false) return false; G.inv && G.inv.grant && G.inv.grant('transit', p.days); sfx('pay'); toast(p.name + ' bought: unlimited train and bus rides for ' + (p.days === 1 ? 'a day' : p.days + ' days') + '.', 'good'); return true; }
function openTickets(after) {
  const m = modal({ title: 'Tickets & passes', cls: 'rail-win', onClose: () => after && after() });
  const until = G.inv && G.inv.accessUntil ? G.inv.accessUntil('transit') : 0, left = until - G.state.t;
  m.body.append(el('div.rail-note', { text: hasPass() ? 'Your transit pass is valid for ' + (left > 1440 ? Math.ceil(left / 1440) + ' more days.' : Math.max(1, Math.round(left / 60)) + ' more hours.') : 'No pass yet. A single ride is ' + fmt(FARES.train.single) + ' (bus ' + fmt(FARES.bus.single) + ').' }));
  m.body.append(el('div.rail-btns', null, passes().map(p => el('button', { text: p.name + ' - ' + fmt(p.price) + ' (' + (p.days === 1 ? '24 hours' : p.days + ' days') + ')', 'data-pass': p.id, onclick: () => { if (buyPass(p.id)) m.close(); } }))));
  return m;
}

/* ---------- riding ---------- */
function freeSpot(w, x, y) { if (!w.isBlocked(x, y)) return { x, y }; for (let r = .5; r < 6; r += .5) for (let a = 0; a < 8; a++) { const px = x + Math.cos(a * Math.PI / 4) * r, py = y + Math.sin(a * Math.PI / 4) * r; if (!w.isBlocked(px, py)) return { x: px, y: py }; } return { x, y }; }
function ride(from, to, opts = {}) {
  return new Promise(res => {
    const N = net(); from = norm(from); to = norm(to); const pl = plan(from, to);
    if (!pl || G.busy || (G.transit && G.transit.ride)) { if (!pl) toast('Pick another station.'); return res(false); }
    const price = opts.free || hasPass() ? 0 : FARES.train.single;
    if (price && G.transit && G.transit.payFare && !G.transit.payFare('train')) return res(false);
    const st = N.byId[from], inCity = G.scene && G.scene.id === 'city';
    const board = () => {
      G.camTarget = null; S.cur = { dir: pl.dir, train: pl.train, from, to }; S.rides = (S.rides || 0) + 1;
      if (G.transit && G.transit.beginRide) G.transit.beginRide({ kind: 'train', destination: to, from, fare: price, resolve: res }); else res(true);
      G.go('train', { ride: S.cur });
    };
    if (opts.nowait || pl.boarding && pl.departsIn > 1) return board();
    const wait = pl.wait + .6; toast(inCity ? 'You head up to the platform. ' + pl.line + ' in ' + mins(pl.wait) + '.' : pl.line + ' toward ' + pl.toward + ' in ' + mins(pl.wait) + '.');
    if (inCity) G.camTarget = { x: st.x, y: st.y, z: st.platformZ || 6 };
    G.startActivity({ label: 'Waiting for the train', anim: 'phone', minutes: wait, rate: Math.max(2.5, wait / 4.5), hide: inCity, done: board,
      cancel: () => { G.camTarget = null; if (price && G.money && G.money.add) G.money.add(price, 'Ticket refund'); res(false); } });
  });
}
async function alight(stationId) {
  const N = net(), id = norm(stationId), st = N.byId[id]; if (!st) return; S.cur = null;
  if (G.transit && G.transit.ride && G.transit.ride.kind === 'train') G.transit.ride.destination = id;
  if (id === 'central' && G.scenes.has('int:')) { G.state.flags.lastDoor = 'door:central_station'; try { await G.go('int:central_station', { x: 15, y: 4.6, dir: 1 }); } catch (e) { await G.go('city', freeSpot(N.w, st.entrance.x, st.entrance.y)); } }
  else await G.go('city', freeSpot(N.w, st.entrance.x, st.entrance.y));
  toast('Arrived: ' + st.name + ' Station', 'good');
  if (G.transit && G.transit.ride && G.transit.ride.kind === 'train') G.transit.endRide(true);
}

export function init() {
  const boot = () => { S = G.defineState('rail', () => ({ rides: 0, cur: null })); };
  boot(); G.on('load', () => { S = G.state.rail || G.defineState('rail', () => ({ rides: 0, cur: null })); });
  if (typeof document !== 'undefined') document.head.append(el('style', { text: CSS }));
  const N = net(); if (!N) return;
  try { carA = asset('veh.train.car'); } catch (e) { carA = null; }
  if (carA) for (const D of N.dirs) for (let j = 0; j < NSETS; j++) { const set = { dir: D.di, train: j, cars: [], on: false }; for (let k = 0; k < CARS; k++) set.cars.push(mkCar(set, k)); sets.push(set); }
  G.addSystem({ name: 'rail', update: tick });
  for (const st of N.sts) if (st.id !== 'central') G.addInteractable({ scene: 'city', x: st.entrance.x, y: st.entrance.y, label: st.name + ' Station', h: 1.4, range: 1.8, hit: 16, use: () => openStation(st.id) });
  G.rail = {
    V, DWELL, ACC, NSETS, get LOOP_MIN() { return N.dirs[0].T; }, lines: LINE,
    stations: () => N.sts, station: id => N.byId[norm(id)] || null, nextTrains, plan, trainState, timeTo, trains: t => sets.map(s => trainState(s.dir, s.train, t)),
    openStation, openTickets, buyPass, passes, diagram, ride, alight, sets: () => sets,
  };
  if (G.transit && G.transit.registerMode) G.transit.registerMode('train', { ride, fare: () => (hasPass() ? 0 : FARES.train.single) });
}
