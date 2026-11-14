// The light-rail ride: scene 'train' - a cutaway car interior (near wall + roof removed) with the city scrolling past.
//
// Enter with G.go('train', { ride: { dir, train, from, to } }) (done by G.rail.ride / G.transit.rideTrain). The scene follows the REAL timetable
// train (G.rail.trainState(dir, train) at G.state.t), so stops, dwell and arrival times match the city. The player walks around freely,
// can sit (tap a seat; small energy/fun perk), read the route map, talk to passengers (G.social.talkToCitizen), and gets off through an open door
// ("Get off here" in the HUD or tap a door) - automatically at the chosen destination. "Skip ahead" fast-forwards time to the destination.
// Leaving calls G.rail.alight(stationId) -> city entrance poi (or Central's hall) and G.transit.endRide -> 'ride:end'('train', stationId).
// G.trainRide = { state(), getOff(), skip(), sit(i), stand(), passengers() } for tests/other systems.
// Tuning: car LEN x DEP, DOORS; passengers 6-14 by hour (paxCount); scenery in _trainbg.js.
import { G } from '../core/game.js';
import { World } from '../engine/world.js';
import { asset } from '../art/registry.js';
import { assetSprite } from '../engine/sprites.js';
import { Char, charArt } from '../core/char.js';
import { el, toast, root, bubble, modal } from '../ui/kit.js';
import { rng, mix } from '../engine/raster.js';
import { ambient } from '../core/clock.js';
import { createBackdrop, THEME_OF } from './_trainbg.js';

export const order = 66;
const OX = 3, OY = 3, LEN = 16, DEP = 5, DOORS = [3.5, 11], DW = 1.6, SEATX = [.5, 5.5, 8.5, 13];
const CSS = `.rail-hud{position:absolute;left:50%;bottom:max(14px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(350px,94vw);background:var(--panel,#fffbe8);border:2px solid var(--edge,#2a2733);box-shadow:0 3px 0 var(--edge,#2a2733);padding:8px 10px;display:flex;flex-direction:column;gap:5px;pointer-events:auto;z-index:6;font-size:14px}
.rail-hud .rh-top{display:flex;gap:8px;align-items:center;font-weight:700}.rail-hud .rh-top b{color:#fff;padding:1px 6px;border:2px solid var(--edge,#2a2733)}
.rail-hud .rh-top i{font-style:normal;margin-left:auto;font-weight:400;font-size:12px;opacity:.8;white-space:nowrap}
.rail-hud .rh-cap{font-size:13px;min-height:17px;opacity:.9}.rail-hud .rh-bar{height:8px;border:2px solid var(--edge,#2a2733);background:var(--shade,#d8d2c2)}.rail-hud .rh-bar i{display:block;height:100%;background:#f2c230;width:0}
.rail-hud .rh-btns{display:flex;gap:6px}.rail-hud .rh-btns button{flex:1;min-height:34px;padding:2px 4px;font-size:13px}.rail-hud .rh-btns button.go{background:#f2c230}`;
const STAND = [[1.6, 2.6, 1], [4.9, 3.1, 3], [7.5, 2.2, 0], [8.5, 3.3, 3], [12.5, 3.0, 1], [14.8, 2.4, 2], [10.4, 2.6, 1], [5.6, 2.4, 0]];
const pick = (r, a) => a[Math.floor(r() * a.length)];

function makeScene() {
  const W = new World(LEN + 8, DEP + 8, { name: 'train' }); W.skirt = 0; W.zmax = 3; W.bakeTerrainNav(); W.free(OX, OY, OX + LEN, OY + DEP);
  const sc = { world: W, ents: [], interactables: [], indoor: true, isTrain: true }, A = charArt(), bg = createBackdrop();
  const st = { ride: null, lastAt: undefined, door: 0, want: 0, scroll: 0, lastD: 0, A: 'suburb', B: null, k: 0, pax: [], plat: null, people: [], peopleFor: '', seat: null, leaving: null, done: false, swap: false, sit: 0, ts: null, hudT: 0, eta0: 1, stay: false };
  W.place('furn.train.floor', OX, OY, { p: { len: LEN, d: DEP, doors: DOORS } });
  const endOb = W.place('furn.train.wall', OX, OY, { p: { len: LEN, doors: DOORS, text: 'MAPLE BAY' } });
  W.place('furn.train.end', OX, OY, { p: { d: DEP, text: 'LOOP' } });
  W.place('furn.train.sill', OX, OY + DEP, { p: { len: LEN } }); W.place('furn.train.sill', OX + LEN, OY, { p: { len: DEP }, flip: true });
  const seats = [], sa = asset('furn.train.seats');
  for (const near of [0, 1]) SEATX.forEach((x, i) => {
    const p = { n: 4, side: near ? 'near' : 'far', c: (i === 0) !== !!near ? '#e08a2c' : '#2f8f96' }, ob = W.place(sa, OX + x, near ? OY + DEP - 1 : OY + .5, { p });
    for (const s of sa.seats(p)) seats.push({ x: ob.x + s.x, y: ob.y + s.y, z: s.z, dir: s.dir, fx: { x: ob.x + s.x, y: near ? ob.y - .25 : ob.y + 1.25 }, by: null });
  });
  for (const x of [4.5, 8, 12]) W.place('furn.train.pole', OX + x, OY + 2.5, {});
  for (const y of [1.5, 3.5]) W.place('furn.train.straps', OX, OY + y, { p: { len: LEN }, z: 1.8, solid: false });
  for (const x of [2, 6, 10, 14]) W.lights.push({ x: OX + x, y: OY + 2.5, z: 0, r: 3.2, c: '#fff1d0' });
  const da = asset('furn.train.door'), doors = DOORS.map(x => ({ x: OX + x, y: OY + .25, z: 0, bb: [0, 0, DW, .1, 1.9], cx: OX + x + DW / 2, sprite() { return assetSprite(da, { open: Math.round(st.door * 4) / 4 }); } }));
  const camT = { x: 0, y: 0, z: 0 };
  let hud = null;

  /* ---- seats ---- */
  const stand = () => { const s = st.seat, p = G.player; if (!s) return; st.seat = null; s.by = null; p.pose = null; p.zoff = 0; if (!p.path) { p.x = s.fx.x; p.y = s.fx.y; } p.z = 0; };
  const sit = s => { const p = G.player; if (typeof s === 'number') s = seats[s]; if (!s || st.leaving) return false; if (s.by) { toast('That seat is taken.'); return false; } if (st.seat) stand(); st.seat = s; s.by = 'player'; p.stop(); p.x = s.x; p.y = s.y; p.zoff = s.z; p.z = s.z; p.dir = s.dir; p.pose = 'sit'; return true; };
  for (const s of seats) sc.interactables.push({ x: s.x, y: s.y, z: s.z, label: 'Sit', h: .6, hit: 8, range: 1, spot: s.fx, visible: () => !s.by && !st.leaving, use: () => sit(s) });
  sc.interactables.push({ x: OX + 8.2, y: OY + .3, z: 1.6, label: 'Route map', h: .8, hit: 12, range: 2.6, use: () => openMap() });
  const getOff = () => {
    const ts = st.ts, p = G.player; if (!ts || st.leaving || st.done) return false; if (!ts.dwell || st.door < .5) { toast('Wait until the train stops and the doors open.'); return false; }
    stand(); const d = doors.reduce((a, b) => Math.abs(b.cx - p.x) < Math.abs(a.cx - p.x) ? b : a); st.leaving = { t: 0, at: ts.at, x: d.cx, y: OY + .75 }; p.goTo(W, d.cx, OY + .75, { snap: 4 }); return true;
  };
  for (const d of doors) sc.interactables.push({ x: d.cx, y: OY + .3, z: .6, label: 'Get off here', h: 1.2, hit: 14, range: 1.5, visible: () => st.door > .9 && !st.leaving, use: getOff });

  /* ---- passengers ---- */
  const R0 = () => rng(Math.floor(G.state.t * 13 + G.time * 997) + 1);
  const paxCount = () => { const h = G.now().hf; return (h >= 7 && h < 9.5) || (h >= 16.5 && h < 19) ? 14 : h >= 9.5 && h < 16.5 ? 10 : h >= 19 && h < 22 ? 8 : 6; };
  const district = () => { const N = G.rail, ts = st.ts, w = G.sceneCache.get('city'); return (ts && w && w.world.districtAt(ts.x, ts.y)) || 'downtown'; };
  const settle = px => { const c = px.ch, s = px.seat; c.path = null; c.moving = false; if (s) { c.x = s.x; c.y = s.y; c.z = s.z; c.dir = s.dir; c.poseOpts = { seated: true }; c.pose = pick(px.r, ['sit', 'sit', 'phone', 'read', 'phone']); } else { c.dir = px.sd; c.pose = px.r() < .5 ? 'phone' : null; c.z = 0; } px.mode = 'stay'; px.pt = 6 + px.r() * 14; };
  const addPax = (r, door) => {
    const free = seats.filter(s => !s.by), spots = STAND.filter(q => !st.pax.some(o => o.spot === q)), seated = free.length && (r() < .72 || !spots.length); if (!seated && !spots.length) return null;
    const kid = r() < .14, spec = A.randomSpec(r, { district: district(), season: G.now().season, age: kid ? 'kid' : r() < .16 ? 'elder' : undefined }), ch = new Char(spec, 0, 0), px = { ch, r, seat: null, spot: null, mode: 'stay', pt: 8, sd: 1 };
    if (seated) { px.seat = pick(r, free); px.seat.by = px; } else { px.spot = pick(r, spots); px.sd = px.spot[2]; }
    const tx = px.seat ? px.seat.fx.x : OX + px.spot[0], ty = px.seat ? px.seat.fx.y : OY + px.spot[1];
    if (door) { ch.x = door.cx + (r() - .5) * .6; ch.y = OY + .75; ch.alpha = 0; ch.speed = 2.6; px.mode = 'enter'; if (!ch.goTo(W, tx, ty, { snap: 4 })) { ch.x = tx; ch.y = ty; } }
    else { ch.x = tx; ch.y = ty; settle(px); }
    px.it = { ent: ch, x: ch.x, y: ch.y, label: 'Passenger', h: 1.3, range: 1.6, visible: () => px.mode === 'stay', use: () => talk(px) };
    st.pax.push(px); sc.ents.push(ch); sc.interactables.push(px.it); return px;
  };
  const dropPax = px => { let i = st.pax.indexOf(px); if (i >= 0) st.pax.splice(i, 1); i = sc.ents.indexOf(px.ch); if (i >= 0) sc.ents.splice(i, 1); i = sc.interactables.indexOf(px.it); if (i >= 0) sc.interactables.splice(i, 1); if (px.seat && px.seat.by === px) px.seat.by = null; };
  const talk = px => { const c = px.ch; c.faceTo(G.player.x, G.player.y); if (G.social && G.social.talkToCitizen) { try { const q = G.social.talkToCitizen({ char: c, spec: c.spec, district: district(), mood: 'ok', kind: 'passenger' }); if (q && q.then) q.then(() => { if (px.seat) c.dir = px.seat.dir; }); return; } catch (e) { } } bubble(c, pick(px.r, ['Nice view from up here.', 'Is this Loop A or B?', 'I love the window seats.', 'Running late again...'])); };
  const swapPax = () => {
    const r = R0(), stay = st.pax.filter(p => p.mode === 'stay'), nOut = Math.min(stay.length, 1 + Math.floor(r() * 3));
    for (let i = 0; i < nOut; i++) { const px = stay.splice(Math.floor(r() * stay.length), 1)[0], c = px.ch, d = doors[Math.abs(doors[0].cx - c.x) < Math.abs(doors[1].cx - c.x) ? 0 : 1]; if (px.seat) { c.x = px.seat.fx.x; c.y = px.seat.fx.y; px.seat.by = null; px.seat = null; } px.spot = null; c.z = 0; c.pose = null; c.poseOpts = null; c.speed = 2.6; px.mode = 'leave'; if (!c.goTo(W, d.cx, OY + .75, { snap: 4 })) px.mode = 'gone'; }
    const want = paxCount(), nIn = Math.max(0, Math.min(3, want - st.pax.length + nOut + (r() < .5 ? 1 : 0)));
    for (let i = 0; i < nIn; i++) addPax(rng(Math.floor(r() * 1e6) + 1), doors[Math.floor(r() * 2)]);
    for (let i = 0; i < Math.min(nIn, st.people.length - 1); i++) st.people.splice(Math.floor(r() * st.people.length), 1);
  };
  const genPeople = id => { const r = rng(id.length * 131 + Math.floor(G.state.t / 5)), n = 3 + Math.floor(r() * 4); st.people = []; st.peopleFor = id; for (let i = 0; i < n; i++) { const ch = new Char(A.randomSpec(r, { district: district(), season: G.now().season }), 0, 0); ch.dir = 1; ch.pose = r() < .4 ? 'phone' : null; st.people.push({ ch, x: 2 + r() * 22, y: .3 + r() * 1.9 }); } st.people.sort((a, b) => a.x + a.y - b.x - b.y); };

  /* ---- HUD ---- */
  const say = t => { st.cap = t; if (hud) hud.cap.textContent = t; };
  const openMap = () => { const R = G.rail, r = st.ride; if (!R || !r) return; { const m = modal({ title: 'Maple Bay Light Rail', cls: 'rail-win' }); m.body.append(R.diagram(st.ts && st.ts.dwell ? st.ts.at : st.ts ? st.ts.next.id : r.from, r.to), el('div.rail-note', { text: 'You are on ' + R.lines[r.dir].name + '. Getting off at ' + R.station(r.to).name + '.' })); } };
  const skip = () => {
    const R = G.rail, r = st.ride; if (!R || !r || st.skipping || st.done || st.leaving) return; const ts = R.trainState(r.dir, r.train); if (ts.dwell && ts.at === r.to) return;
    st.skipping = true; const f = G.fadeEl; G.modal++; if (f) f.classList.add('on');
    setTimeout(() => { try { G.advance(R.timeTo(r.dir, r.train, r.to) + .9); st.scroll += 300; st.lastD = R.trainState(r.dir, r.train).d; } finally { G.modal--; st.skipping = false; setTimeout(() => f && f.classList.remove('on'), 80); } }, 280);
  };
  const mkHud = () => {
    if (hud) hud.root.remove(); const R = G.rail, r = st.ride, L = R.lines[r.dir];
    const t = el('span'), eta = el('i'), cap = el('div.rh-cap'), fill = el('i'), off = el('button.go', { text: 'Get off here', onclick: getOff }), mp = el('button', { text: 'Route map', onclick: openMap }), sk = el('button', { text: 'Skip ahead', onclick: skip });
    hud = { root: el('div.rail-hud', null, el('div.rh-top', null, el('b', { text: r.dir ? 'B' : 'A', style: { background: L.color } }), t, eta), cap, el('div.rh-bar', null, fill), el('div.rh-btns', null, off, mp, sk)), t, eta, cap, fill, off, sk }; root().append(hud.root);
  };
  const setText = t => { const p = Object.assign({}, endOb.p, { text: t }); endOb.p = p; endOb._key = null; };

  /* ---- frame ---- */
  sc.update = (dt, gm) => {
    const R = G.rail, r = st.ride, p = G.player; if (!R || !r) return;
    const ts = st.ts = R.trainState(r.dir, r.train), tot = R.LOOP_MIN; let dd = ts.d - st.lastD; if (dd < -50) dd = 0; if (dd > 60) dd = 60; st.scroll += Math.max(0, dd); st.lastD = ts.d;
    const key = ts.dwell ? ts.at : null;
    if (key !== st.lastAt) {
      const first = st.lastAt === undefined;
      if (key) { const nm = R.station(key).name; setText(nm.toUpperCase()); if (!first) { G.audio && G.audio.sfx && G.audio.sfx('train_chime'); say('This is ' + nm + (key === r.to ? '. This is your stop!' : '.')); st.swap = true; } else say('Boarding at ' + nm + ' - ' + R.lines[r.dir].name + '.'); if (st.peopleFor !== key) genPeople(key); }
      else { const nx = ts.next; setText(nx.st.name.toUpperCase()); say('Next stop: ' + nx.st.name + (nx.id === r.to ? '. Your stop is next - get ready.' : '.')); if (nx.id === r.to) toast('Next stop is yours: ' + nx.st.name); genPeople(nx.id); st.stay = false; }
      st.lastAt = key;
    }
    // doors
    const want = ts.dwell && ts.toDepart > .8 && (ts.sinceArr > .5 || st.door > .5) ? 1 : 0;
    if (want !== st.want) { st.want = want; G.audio && G.audio.sfx && G.audio.sfx('train_door'); }
    st.door = Math.max(0, Math.min(1, st.door + Math.sign(want - st.door) * dt * 1.8));
    if (st.swap && st.door > .9) { st.swap = false; swapPax(); }
    // platform + scenery theme
    const rem = ts.dwell ? 0 : ts.leg.L * (1 - ts.frac), gone = ts.dwell ? 0 : ts.leg.L * ts.frac, x0 = OX + LEN / 2 - 13;
    st.plat = ts.dwell ? { x0, name: ts.stop.st.name, people: st.people } : rem < 46 ? { x0: x0 - rem, name: ts.next.st.name, people: st.people } : gone < 46 ? { x0: x0 + gone, name: ts.leg.st.name, people: [] } : null;
    const th = THEME_OF[district()] || 'suburb'; if (!st.B && th !== st.A) { st.B = th; st.k = 0; } if (st.B) { st.k += dt / 1.6; if (st.k >= 1) { st.A = st.B; st.B = null; st.k = 0; } }
    // player: seat / leaving / auto-alight
    if (st.seat) { if (p.path || p.moving) stand(); else { st.sit += gm; if (st.sit >= 4) { st.sit -= 4; G.needs && G.needs.add && (G.needs.add('energy', 1), G.needs.add('fun', .6)); } } }
    if (ts.dwell && ts.at === r.to && st.door > .9 && !st.leaving && !st.done && !st.stay && !G.modal) { toast('This is your stop: ' + ts.stop.st.name); if (!getOff()) st.stay = true; }
    if (st.leaving) { const l = st.leaving; l.t += dt; if (Math.hypot(p.x - l.x, p.y - l.y) < .6 || l.t > 2.4 || !ts.dwell) { st.leaving = null; if (ts.dwell) { st.done = true; R.alight(l.at); } } }
    // passengers
    for (let i = st.pax.length - 1; i >= 0; i--) {
      const px = st.pax[i], c = px.ch;
      if (px.mode === 'stay') { c.t += dt; if ((px.pt -= dt) <= 0) { px.pt = 7 + px.r() * 15; if (px.seat) c.pose = pick(px.r, ['sit', 'phone', 'read', 'sit']); else c.pose = px.r() < .5 ? 'phone' : null; } }
      else if (px.mode === 'enter') { c.alpha = Math.min(1, (c.alpha || 0) + dt * 3); if (c.alpha >= 1) c.alpha = undefined; c.move(W, dt); if (!c.path) { c.alpha = undefined; settle(px); } }
      else if (px.mode === 'leave') { c.move(W, dt); if (!c.path || st.door < .2) px.mode = 'gone'; }
      else { c.alpha = (c.alpha === undefined ? 1 : c.alpha) - dt * 4; if (c.alpha <= 0) dropPax(px); }
    }
    for (const q of st.people) q.ch.t += dt;
    // camera sway + hud
    const k = ts.v / R.V; camT.x = p.x; camT.y = p.y; camT.z = p.z + (Math.sin(G.time * 2.3) * .025 + Math.sin(G.time * 7.1) * .012) * k; st.jit = Math.round(Math.sin(G.time * 11) * .7 * k + Math.sin(G.time * 3.7) * .6 * k);
    if (hud && (st.hudT -= dt) <= 0) {
      st.hudT = .2; const left = R.timeTo(r.dir, r.train, r.to), at = ts.dwell && ts.at === r.to;
      hud.t.textContent = ts.dwell ? 'At ' + ts.stop.st.name : 'Next: ' + ts.next.st.name; hud.eta.textContent = at ? 'your stop' : R.station(r.to).name + ' in ' + Math.max(1, Math.round(left)) + ' min';
      hud.fill.style.width = Math.round(100 * (at ? 1 : Math.max(0, Math.min(1, 1 - left / st.eta0)))) + '%'; hud.off.disabled = !(ts.dwell && st.door > .5) || !!st.leaving; hud.off.textContent = st.seat && !ts.dwell ? 'Seated' : 'Get off here'; hud.sk.disabled = at || !!st.leaving;
    }
  };
  sc.env = t => { const o = ambient(t, G.state.weather); return { amb: mix('#ffffff', '#d6cde8', o.dark * .55), dark: .2 + o.dark * .7, bg: o.bg, night: o.night }; };
  sc.spawn = () => ({ x: doors[0].cx, y: OY + .8, dir: 1 });
  sc.onEnter = opts => {
    const R = G.rail; st.ride = (opts && opts.ride) || (G.state.rail && G.state.rail.cur) || { dir: 0, train: 0, from: 'central', to: 'oldtown' }; const r = st.ride;
    for (const px of st.pax.slice()) dropPax(px); for (const s of seats) s.by = null;
    Object.assign(st, { lastAt: undefined, door: 0, want: 0, seat: null, leaving: null, done: false, swap: false, B: null, k: 0, stay: false, skipping: false, people: [], peopleFor: '', hudT: 0 });
    if (!R) return; const ts = st.ts = R.trainState(r.dir, r.train); st.lastD = ts.d; if (ts.dwell) { st.door = 1; st.want = 1; } st.eta0 = Math.max(1, R.timeTo(r.dir, r.train, r.to)); st.A = THEME_OF[district()] || 'suburb';
    const rr = R0(), n = paxCount(); for (let i = 0; i < n; i++) addPax(rng(Math.floor(rr() * 1e6) + 1), null);
    if (!ts.dwell) genPeople(ts.next.id);
    if (G.state.rail) G.state.rail.cur = { dir: r.dir, train: r.train, from: r.from, to: r.to };
    if (G.transit && !G.transit.ride && G.transit.beginRide) G.transit.beginRide({ kind: 'train', destination: r.to, from: r.from });
    mkHud(); camT.x = G.player.x; camT.y = G.player.y; camT.z = 0; G.camTarget = camT; G.snapCam && G.snapCam();
  };
  sc.onExit = () => { if (hud) { hud.root.remove(); hud = null; } if (G.camTarget === camT) G.camTarget = null; const p = G.player; p.pose = null; p.zoff = 0; st.seat = null; };
  sc.ents.push(...doors);
  const info = () => ({ d: st.scroll, A: st.A, B: st.B, k: st.k, t: G.state.t, weather: G.state.weather, platform: st.plat });
  sc.drawBack = (ctx, cam) => bg.draw(ctx, { x: cam.x, y: cam.y + (st.jit || 0) }, G.W, G.H, info());
  sc.drawFront = (ctx, cam) => bg.drawFront(ctx, { x: cam.x, y: cam.y + (st.jit || 0) }, G.W, G.H, info());
  G.trainRide = { state: () => st, getOff, skip, sit, stand, passengers: () => st.pax, seats: () => seats, doors: () => doors, scene: sc };
  return sc;
}

export function init() {
  if (typeof document !== 'undefined') document.head.append(el('style', { text: CSS }));
  G.registerScene('train', () => makeScene());
  G.underlays.push((ctx, cam) => { const s = G.scene; if (s && s.drawBack) s.drawBack(ctx, cam); });
  G.overlays.push((ctx, cam) => { const s = G.scene; if (s && s.drawFront) s.drawFront(ctx, cam); });
}
