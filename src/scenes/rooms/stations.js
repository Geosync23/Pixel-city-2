// Central Station: the grand hall under the glass vault (room id 'central_station', 28 x 20). City door poi 'door:central_station'.
// Platforms are reached through the fare gates on the far side: with a ticket / pass you walk up to room 'central_station:platforms' (station_platforms.js);
// arriving trains put you on the platform and the stairs bring you down by the gates.
// Fixtures are looked up by item key `k`: gates, counter, tm1-3 (ticket machines), coffee / news / bakery / flowers kiosks, info, clock, piano.
// Sky-dependent art (items with sky: true) is re-rendered at dawn / dusk / night; light shafts (shaft: true) only show by day.
// npcSpots (derived by venues_lib from `n:` flags + the hand-placed `npc` list): ~50 spots - bench seats, ticket queue + clerks, kiosk staff and
// customers, people watching the departures board, the meeting point, the pianist. music: 'quiet'.
import { GT } from '../../engine/world.js';
import { room, V, WY, WX, S } from './venues_lib.js';
import { el, toast, modal } from '../../ui/kit.js';
import * as R from '../../engine/raster.js';
import { toSpritePooled } from '../../engine/sprites.js';

const H = 4.4, SKY = { sky: true };
const arch = (W, at, w) => Object.assign(W('station.arch', at, { w, h: H, seed: at + 1 }), SKY);
const bench = (x, y, flip) => ({ id: 'prop.rail.bench', x, y, flip: !!flip, p: { color: '#34504f' }, n: 'seats' });
const items = [
  arch(WY, 0, 4), arch(WY, 4, 4), arch(WY, 8, 3), Object.assign(WY('station.portal', 11, { h: H, live: 1 }), { k: 'portal' }), arch(WY, 17, 3), arch(WY, 20, 4), arch(WY, 24, 4),
  arch(WX, 0, 4), arch(WX, 4, 4), arch(WX, 8, 4), arch(WX, 12, 4), arch(WX, 16, 4),
  Object.assign(V('station.dome', 0, 0, { w: 28, d: 20 }, { z: H, solid: false }), SKY),
  V('station.medallion', 10, 6), ...[[2, 2.5], [7, 9], [16.5, 2.5], [19, 11]].map(q => V('station.shaft', q[0], q[1], null, { shaft: true })),
  V('station.gates', 10, 0, null, { k: 'gates' }),
  { id: 'prop.rail.ticket', x: 1.5, y: .5, k: 'tm1', n: 'use' }, { id: 'prop.rail.ticket', x: 2.5, y: .5, k: 'tm2', p: { color: '#2f8f96' } }, { id: 'prop.rail.ticket', x: 3.5, y: .5, k: 'tm3', n: 'use' },
  { id: 'prop.rail.vending', x: 6, y: .5, p: { seed: 1 } }, { id: 'prop.rail.vending', x: 7, y: .5, p: { color: '#d2412f', seed: 4 } }, { id: 'prop.rail.bin', x: 8.5, y: .5 },
  V('generic.lockers', 18.5, .5), V('generic.lockers', 20.5, .5), V('generic.lockers', 22.5, .5), { id: 'prop.rail.bin', x: 25, y: .5 }, V('generic.plant', 26.5, .5, { kind: 'palm', s: 1.5 }),
  V('station.counter', .5, 4.5, null, { flip: true, k: 'counter', n: 'staff use' }),
  V('station.pillar', 4.5, 3.5), V('station.pillar', 4.5, 9), V('station.pillar', 4.5, 15), V('station.pillar', 22.5, 3.5), V('station.pillar', 22.5, 9), V('station.pillar', 22.5, 15),
  V('station.planter', 7.5, 4), V('station.planter', 19, 4, { seed: 5 }), V('station.planter', 7.5, 13.5, { seed: 7 }), V('station.planter', 19, 13.5),
  bench(10, 5), bench(12, 5), bench(15, 5), bench(17, 5), bench(10, 14), bench(12, 14), bench(15, 14), bench(17, 14), bench(5.5, 10.5, true), bench(5.5, 12.5, true), bench(20, 8.5), bench(20, 12.5),
  V('station.clock', 13.5, 9.5, null, { k: 'clock' }),
  V('station.kiosk', 24, 4.5, { kind: 'coffee' }, { k: 'coffee', n: 'staff use' }), V('station.kiosk', 24, 9.5, { kind: 'news' }, { k: 'news', n: 'staff use' }), V('station.kiosk', 24, 14.5, { kind: 'flowers' }, { k: 'flowers', n: 'staff use' }),
  V('station.kiosk', 1, 12.5, { kind: 'bakery' }, { k: 'bakery', n: 'staff use' }),
  V('station.info', 12.5, 16.5, null, { k: 'info', n: 'staff use' }), V('station.piano', 6, 16.5, null, { k: 'piano', n: 'seats' }),
  V('generic.plant', .5, 18.5, { kind: 'palm', s: 1.5 }), V('generic.plant', 26.5, 18.5, { kind: 'palm', s: 1.5 }), V('generic.bench', 9, 18.5), V('generic.bench', 17.5, 18.5),
];
const npc = [S(13, 6.8, 3), S(14.7, 7.2, 3, 'phone'), S(12.1, 7.6, 3), S(15.8, 6.6, 3), S(3.2, 5.5, 2, 'phone'), S(4, 5.6, 2), S(.9, 7.5, 0, 'work', 'staff'),
  S(13, 11.6, 1, 'phone'), S(15.4, 11.3, 0, 'talk'), S(16.3, 11.3, 2, 'talk'), S(12.4, 18.2, 3), S(16.2, 17.9, 1, 'phone'), S(25.4, 7.9, 3, 'phone'), S(25.6, 12.9, 3), S(8.2, 17.4, 2), S(9.2, 3.3, 1, 'stand', 'staff'), S(18.6, 16.6, 2, 'phone')];

function setup(sc, G) {
  const fx = k => sc.fixtures.find(f => f.item && f.item.k === k);
  const add = (k, label, use) => { const f = fx(k); if (!f) return; sc.interactables.push({ x: f.x, y: f.y, h: Math.min(1.6, f.ob.size[2]), hit: 14, spot: f.use || undefined, label, use, fx: f }); };
  const shop = id => () => { if (G.shop && G.shop.open) G.shop.open(id); else toast('Closed right now.'); };
  const tickets = () => (G.rail ? G.rail.openTickets() : toast('The machine is out of order.'));
  /* the fare gates: with a ticket, a pass or a staff badge you tap in and walk up to the platforms (room 'central_station:platforms'); the ticket itself is
     used when you board, as before. Without one the gate stays shut and offers a ticket; the old boarding panel is the "Departures" detail view. */
  const PLAT = 'int:central_station:platforms', staff = () => { try { const j = G.jobs && G.jobs.current && G.jobs.current(); return !!j && j.id === 'station_agent'; } catch (e) { return false; } };
  const fareOk = () => !!G.rail && ((G.rail.hasPass && G.rail.hasPass()) || G.rail.tickets() > 0 || staff());
  const through = () => { try { G.audio && G.audio.sfx && G.audio.sfx('click'); } catch (e) { } return G.go(PLAT, { from: 'hall' }); };
  const gate = () => {
    if (!G.rail) return toast('No trains today.');
    if (fareOk()) { toast(staff() ? 'Staff badge: the gate opens.' : G.rail.hasPass && G.rail.hasPass() ? 'Pass valid: the gate opens. Platforms 1 and 2 are up the stairs.' : 'Ticket shown: the gate opens. It is used when you board.', 'good'); return through(); }
    const m = modal({ title: 'Fare gates · Platforms 1-2', cls: 'rail-win' });
    m.body.append(el('div.rail-note', { text: 'The gate stays shut: you need a ticket or a pass to go up to the platforms. A single ticket is good for one ride, any distance.' }));
    m.body.append(el('div.rail-btns', null,
      el('button.primary', { text: 'Buy a ticket and go through', 'data-act': 'gate-buy', onclick: () => { if (G.rail.buyTicket()) { m.close(); through(); } } }),
      el('button', { text: 'Tickets & passes', onclick: () => { m.close(); G.rail.openTickets(); } }),
      el('button', { text: 'Departures', 'data-act': 'gate-board', onclick: () => { m.close(); G.rail.openStation('central'); } })));
  };
  add('gates', 'Platforms 1 & 2', gate); { const it = sc.interactables[sc.interactables.length - 1]; if (it && it.label === 'Platforms 1 & 2') { it.navTo = PLAT; it.fareOk = fareOk; } }
  add('counter', 'Ticket office', tickets); for (const k of ['tm1', 'tm2', 'tm3']) add(k, 'Ticket machine', tickets);
  add('coffee', 'Coffee kiosk', shop('stand_coffee')); add('news', 'Newsstand', shop('cornerstore')); add('bakery', 'Bakery stand', shop('bakery'));
  add('flowers', 'Flower stall', () => G.startActivity({ label: 'Browsing the flowers', anim: 'stand', minutes: 8, done: () => { G.needs && G.needs.add && G.needs.add('fun', 5); toast('Peonies, tulips and a whole bucket of sunflowers. Lovely.', 'good'); } }));
  add('clock', 'Meeting point', () => toast("It's " + G.now().clock + '. Trains leave from Platforms 1 & 2, straight ahead.'));
  add('info', 'Information desk', () => { const m = modal({ title: 'Maple Bay Light Rail', cls: 'rail-win' }); if (G.rail) m.body.append(G.rail.diagram('central')); m.body.append(el('div.rail-note', { text: 'Two loops, eight stations. Loop A runs clockwise, Loop B the other way. Tickets at the machines; platforms through the gates.' })); });
  const pf = fx('piano');
  if (pf) add('piano', 'Play the piano', () => { const s = pf.seats[0]; G.startActivity({ label: 'Playing the station piano', anim: 'type', minutes: 20, at: { x: s.x, y: s.y, z: s.z, dir: s.dir }, done: () => { if (G.needs && G.needs.add) { G.needs.add('fun', 14); G.needs.add('social', 4); } if (G.skills && G.skills.addXp) try { G.skills.addXp('creativity', 6); } catch (e) { } toast('A few commuters stop to listen. Someone claps!', 'good'); } }); });
  /* the departures board on the portal is LIVE: the next three trains from G.rail's timetable (destination = next stop, platform, minutes), redrawn when it changes */
  const pf0 = fx('portal'), VB = [.35, .3, 2.6, 5.65, .36, 4.12], board = { x: pf0 ? pf0.ob.x : 0, y: pf0 ? pf0.ob.y : 0, z: 0, bb: [VB[0], VB[1], VB[3], VB[4], VB[5]], nl: 'ground', key: '', spr: null, sprite() { return this.spr; } }; let boardT = 0;
  const drawBoard = () => { if (!pf0 || !G.rail) return; const nt = G.rail.nextTrains('central').slice(0, 3), rows = nt.map(q => [String((G.rail.station(q.towardId) || {}).name || q.toward).toUpperCase().slice(0, 10), String(G.rail.platformOf(q.dir)), q.boarding ? 'NOW' : String(Math.round(q.minutes))]), key = JSON.stringify(rows); if (key === board.key) return; board.key = key;
    try { board.spr = toSpritePooled(R.render(R.screenBox(VB), () => R.lit(() => rows.forEach((r, i) => { const z = H - .4 - (i + 1) * .34; R.textY(r[0], .55, .305, z, '#ffb347'); R.textY(r[1], 4.0, .305, z, '#7ee08a'); R.textY(r[2], 4.72 + (3 - r[2].length) * .125, .305, z, r[2] === 'NOW' ? '#7ee08a' : '#ffb347'); })), null, 2, false, true)); } catch (e) { board.spr = null; } };
  if (pf0) sc.ents.push(board);
  // sky-dependent art
  const objs = sc.world.objs, skyObs = objs.filter(o => o.data && o.data.sky), shafts = objs.filter(o => o.data && o.data.shaft); let cur = -1, skyT = 0;
  const apply = () => { const h = G.now().hf, s = h < 5.5 || h >= 20.5 ? 2 : h < 7 || h >= 18.5 ? 1 : 0; if (s === cur) return; cur = s; for (const o of skyObs) { o.p = Object.assign({}, o.p, { sky: s }); o._key = null; } for (const o of shafts) o.hidden = s !== 0; };
  // establishing pan from the vault down to the player (once per day, when walking in from the city)
  const cam = { x: 0, y: 0, z: 0 }, e0 = sc.onEnter, x0 = sc.onExit, u0 = sc.update; let pan = null, panDay = -1;
  sc.onEnter = (opts, prev) => { e0(opts, prev); apply(); drawBoard(); if (prev && prev.id === 'city' && G.now().day !== panDay && !(G.query && G.query.has('nopan'))) { panDay = G.now().day; pan = { t: 0 }; cam.x = 11; cam.y = 4; cam.z = 6.5; G.camTarget = cam; G.snapCam(); } };
  sc.onExit = to => { if (G.camTarget === cam) G.camTarget = null; pan = null; x0(to); };
  sc.update = (dt, gm) => {
    u0(dt, gm); if ((skyT -= dt) <= 0) { skyT = 2; apply(); } if ((boardT -= dt) <= 0) { boardT = .6; drawBoard(); }
    if (pan) { pan.t += dt; const p = G.player, q = Math.max(0, Math.min(1, (pan.t - .8) / 2.4)), k = q * q * (3 - 2 * q); cam.x = 11 + (p.x - 11) * k; cam.y = 4 + (p.y - 4) * k; cam.z = 6.5 * (1 - k) + p.z * k; if (pan.t > 3.3 || p.moving) { pan = null; G.camTarget = null; } }
  };
}

room({ id: 'central_station', name: 'Central Station', w: 28, d: 20, zoom: 0, music: 'quiet', floor: GT.f_stone,
  floors: [{ x0: 11, y0: 0, x1: 17, y1: 20, floor: GT.f_tile }, { x0: 0, y0: 9, x1: 28, y1: 11, floor: GT.f_tile }, { x0: 12, y0: 18.5, x1: 16, y1: 20, floor: GT.f_mat }],
  wall: { color: '#e6dfd0', trim: '#8a7f72', h: H }, items, npc, exits: [{ x: 14, y: 19.5, label: 'Exit to Downtown' }], spawn: { x: 14, y: 18.6, dir: 3 }, setup });
