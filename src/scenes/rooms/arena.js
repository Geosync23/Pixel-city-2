// Maple Bay Arena — the concourse and the locker corridor (the bowl is in arena_bowl.js). Entered by the city door `door:arena` on Arena Plaza.
//   `arena` (46 x 14, the concourse; (0,0) = back corner): The Otter Den team store (x0-6), box office + TEAM ONLY door on the left wall, two turnstile gates
//       into the bowl (Sections 101-104 at x6-11, 105-108 at x32-37), league table + What's On boards, the Bay Cup trophy case, bronze Ollie, restrooms (x37-41),
//       Dockside Dogs (x41-46) and the Twist & Pop island (x34-38). Free to walk in during opening hours; the bowl needs a ticket on event nights.
//       scene.arena = { sync(), level, queue: { grill, snacks, wc } (people in line right now), benny, ushers }
//   `arena:backstage` (20 x 9): the locker corridor. Reached through the TEAM ONLY door once Benny trusts you (the lucky-ball chain), and from the court tunnel.
//       scene.arena = { sync(), coach, players: [Char], priya }
// Fixture tags handled here (only inside arena rooms): arena_shop (item.venue), arena_box, arena_portal, arena_gate, arena_board (item.which), arena_trophy,
//   arena_statue, arena_album, arena_merch, arena_restroom, arena_teamdoor, arena_tunnel, arena_locker (item.ids), arena_whiteboard, arena_cage, arena_suit,
//   arena_cooler, arena_lbench.   Gameplay lives in sim/arena.js (G.arena).
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { Char } from '../../core/char.js';
import { defineRoom, registerFixture } from '../interior.js';
import { toast, bubble } from '../../ui/kit.js';
import { crowd, walkers } from './_show_life.js';
import { specs } from './_airport_life.js';
import { registerInfo } from './unique_rooms.js';
import { ARENA_VENUES, ARENA_HOURS, LINES, ROSTER, STAFF, TEAM } from '../../data/arena.js';

const O = 1, pick = a => a[Math.floor(Math.random() * a.length)];
const AR = () => G.arena;
const safe = fn => { try { return fn(); } catch (e) { return undefined; } };
export const mk = () => { const items = [], spots = []; return { items, spots, A(id, x, y, p, o) { const it = Object.assign({ id: 'furn.arena.' + id, x, y, p: p || {} }, o); items.push(it); return it; }, WY(id, at, p, o) { const it = Object.assign({ id: 'furn.arena.' + id, wall: 'y', at, p: p || {} }, o); items.push(it); return it; }, WX(id, at, p, o) { const it = Object.assign({ id: 'furn.arena.' + id, wall: 'x', at, p: p || {} }, o); items.push(it); return it; }, S: (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o)) }; };
export const setP = (o, q) => { let ch = false; for (const k in q) if (JSON.stringify(o.p[k]) !== JSON.stringify(q[k])) { ch = true; break; } if (!ch) return; o.p = Object.assign({}, o.p, q); o._key = null; };
export const by = (Wd, k) => Wd.objs.filter(o => o.data && o.data[k]);
const isOpenNow = () => { const h = G.now().hf; return h >= ARENA_HOURS[0] && h < ARENA_HOURS[1]; };

/* =================================================================== concourse */
const W = 46, D = 14, M = mk();
(function build() {
  const { S } = M, A = M.A.bind(M), WY = M.WY.bind(M), WX = M.WX.bind(M);
  WY('cwall', 0, { w: 6, kind: 'slat', name: 'THE OTTER DEN' }); WY('cwall', 6, { w: 5, kind: 'portal', name: 'SECTIONS 101-104' }, { tags: ['arena_portal'], gateN: 0 }); WY('cwall', 11, { w: 7.5, kind: 'plain', seed: 4 }); WY('cwall', 18.5, { w: 6, kind: 'mural' });
  WY('cwall', 24.5, { w: 7.5, kind: 'plain', seed: 9 }); WY('cwall', 32, { w: 5, kind: 'portal', name: 'SECTIONS 105-108' }, { tags: ['arena_portal'], gateN: 1 }); WY('cwall', 37, { w: 2, kind: 'plain', seed: 99 }); WY('cwall', 39, { w: 2, kind: 'plain', seed: 99 }); WY('cwall', 41, { w: 5, kind: 'menu', name: 'DOCKSIDE DOGS', menu: ['DOG 5', 'CHILI 7', 'NACHO 6', 'CORN 4'] });
  WX('cwall', 0, { w: 5, kind: 'slat', name: 'JERSEYS' }); WX('cwall', 5, { w: 2, kind: 'plain', seed: 99 }); WX('cwall', 7, { w: 2, kind: 'fame' }); WX('cwall', 9, { w: 5, kind: 'plain', name: 'BOX OFFICE', seed: 99 });
  // ---- The Otter Den
  A('backbar', .5, 0, { kind: 'store', w: 5 }); A('counter', 1, 1.5, { kind: 'store', w: 3.5 }, { tags: ['arena_shop'], venue: ARENA_VENUES.store, label: 'The Otter Den: team store' }); S(2.7, 1.05, 1, { kind: 'staff', label: 'The Otter Den', lines: LINES.store });
  A('rack', 1, 4.5, {}, { store: 1 }); A('rack', 3, 4.5, { c: '#f4f0e8' }, { store: 1 }); A('gondola', 3.5, 7, {}, { store: 1 }); A('cardtable', 4.5, 3, {});
  S(1.8, 5.6, 3, { p: .6 }); S(3.8, 5.6, 3, { busy: 1 }); S(4.3, 8.3, 3, { p: .5, age: 'kid', lines: LINES.kid }); S(5.2, 4.2, 3, { p: .6, age: 'kid', lines: LINES.kid }); S(2.6, 2.7, 3, { p: .5 });
  // ---- left wall: TEAM ONLY door, box office
  A('teamdoor', 0, 5, {}, { flip: true, tdoor: 1 }); A('counter', 1, 9, { kind: 'box', w: 3.6 }, { flip: true, tags: ['arena_box'] }); S(.55, 10.8, 0, { kind: 'staff', label: 'Box office', lines: ['Tickets for the next seven days. Big nights sell out, so do not leave it late.', 'Upper bowl, lower bowl or courtside? The view is good from all of them. The price is not.'] });
  A('queue', 2.5, 9.5, { w: 2.5 }, { flip: true }); S(2.4, 10.2, 2, { busy: 1 }); S(3.2, 10.6, 2, { p: .4 });
  // ---- gates: turnstiles + rails in front of the two portals, an usher at each
  for (const [gx, n] of [[6, 0], [32, 1]]) { A('turnstile', gx + .5, 1.5, { n: 3 }, { gate: 1, gateN: n, solid: true }); A('rail', gx, .5, { w: 1.5 }, { flip: true }); A('rail', gx + 4.5, .5, { w: 1.5 }, { flip: true }); S(gx + 4.8, 2.9, 1, { kind: 'staff', label: 'Usher', lines: LINES.usher, usher: n }); }
  // ---- lobby: boards, trophy, statue, banners
  A('board', 11.5, .5, { w: 7, cols: 2, title: 'BAY COAST LEAGUE', rows: [] }, { which: 'table', board: 'table' }); A('board', 25, .5, { w: 7, cols: 1, title: 'WHAT\'S ON', rows: [] }, { which: 'next', board: 'next' });
  A('trophy', 20.5, 5.4, {}, { trophy: 1 }); A('statue', 24.2, 8.6, {}); A('planter', 17.6, 12.6); A('planter', 25, 12.6); A('planter', 11.6, 4.6); A('planter', 30.6, 4.4); A('bin', 10.4, 7.6); A('bin', 31.4, 8.2);
  for (const [x, y, k] of [[14, 7, 0], [29, 7, 2], [8.5, 11, 1], [39, 12, 0]]) A('hbanner', x, y, { kind: k }, { z: 1.7, solid: false });
  S(13.6, 1.5, 3, { p: .7 }); S(15.6, 1.6, 3, { busy: 1 }); S(27, 1.6, 3, { p: .6 }); S(29.2, 1.5, 3, { busy: 1, anim: 'phone' }); S(21.5, 7, 3, { p: .7 }); S(22.9, 6.3, 2, { busy: 1 }); S(24.9, 10.5, 3, { p: .6, age: 'kid', lines: LINES.kid }); S(25.8, 10.4, 3, { busy: 1, anim: 'phone' });
  S(16.5, 8.5, 0, { busy: 1, anim: 'talk' }); S(17.4, 8.6, 2, { busy: 1, anim: 'talk' }); S(13, 11.4, 1, { busy: 1, anim: 'phone' }); S(28.4, 12, 1, { busy: 1 }); S(20.4, 3.2, 3, { busy: 1 }); S(22.6, 3.4, 3, { p: .5 });
  // ---- restrooms
  A('wcdoor', 37, 0, { kind: 'w' }, { wc: 0 }); A('wcdoor', 39, 0, { kind: 'm' }, { wc: 1 });
  for (let i = 0; i < 5; i++) { S(38, 1.4 + i * .62, 3, { q: 'wc', qi: i }); if (i < 4) S(40, 1.4 + i * .62, 3, { q: 'wc', qi: i + 5 }); }
  // ---- Dockside Dogs (back wall) + Twist & Pop (island)
  A('backbar', 41.5, 0, { kind: 'grill', w: 4 }); A('counter', 41.5, 1.5, { kind: 'grill', w: 4 }, { tags: ['arena_shop'], venue: ARENA_VENUES.grill, label: 'Dockside Dogs' }); S(42.4, 1.05, 1, { kind: 'staff', outfit: 'cook', label: 'Dockside Dogs', lines: LINES.grill }); S(44.5, 1.05, 1, { kind: 'staff', outfit: 'cook', label: 'Dockside Dogs', lines: LINES.grill });
  for (let i = 0; i < 6; i++) S(43.5, 2.8 + i * .62, 3, { q: 'grill', qi: i }); A('queue', 44.5, 3, { w: 3 }, { flip: true });
  A('backbar', 33.5, 6, { kind: 'snacks', w: 3.5 }); A('counter', 33.5, 7.5, { kind: 'snacks', w: 3.5 }, { tags: ['arena_shop'], venue: ARENA_VENUES.snacks, label: 'Twist & Pop' }); S(35.2, 7.05, 1, { kind: 'staff', outfit: 'cook', label: 'Twist & Pop', lines: LINES.snacks });
  for (let i = 0; i < 5; i++) S(35.2, 8.8 + i * .62, 3, { q: 'snacks', qi: i });
  for (const [x, y] of [[29.5, 6.5], [31, 11], [37.5, 11.5], [40.5, 6.5], [42.5, 9], [44.5, 6], [40, 9.5]]) { A('stable', x, y); S(x + .45, y + 1.2, 3, { busy: 1, anim: Math.round(x) % 2 ? 'eat' : 'drink' }); S(x + 1.25, y + .45, 2, { p: .35, anim: 'eat' }); }
  A('bin', 39.4, 4.2); A('planter', 45, 12.6);
})();

defineRoom({ id: 'arena', name: 'Maple Bay Arena', w: W, d: D, zoom: 0, music: 'busy', noCrowd: true, showpiece: 'arena', venue: ARENA_VENUES.place,
  floor: GT.f_stone, bg: '#14161e', edge: '#30343f', wall: { color: '#c9ccd4', trim: '#2a2f3d', h: 4.4 },
  exits: [{ x: 21.5, y: 13.5, label: 'Exit to Arena Plaza', poi: 'door:arena' }], spawn: { x: 21.5, y: 12.6, dir: 3 }, items: M.items, npcSpots: M.spots,
  setup(sc) {
    const Wd = sc.world; Wd.zmax = 6; const boards = by(Wd, 'board'), gates = by(Wd, 'gate'), trophy = by(Wd, 'trophy')[0], tdoor = by(Wd, 'tdoor')[0];
    Wd.decal({ x0: O, y0: O, x1: O + W, y1: O + D, draw(Rr) { const h2 = Rr.hash2;
      Rr.qz(O, O + W, O, O + D, 0, (x, y) => { x -= O; y -= O; const k = h2(Math.floor(x * 16), Math.floor(y * 16), 4);
        if (x < 6 && y < 8.6) { const r = Math.floor(y * 2), xx = x + (r & 1) * .9; if (y * 2 - r < .1 || (xx % 1.8) < .06) return '#8a6a48'; return h2(Math.floor(xx / 1.8), r, 9) > .6 ? '#c89a68' : '#b88a5a'; }
        const band = Math.abs(y - 4.2 - Math.sin(x * .14) * .5); if (band < .16) return '#d2392f'; if (band < .3) return '#f4f0e8';
        const d = Math.hypot(x - 21.5, y - 9.2); if (d < 2.3) { if (d > 2.1) return '#f4f0e8'; return d < 1.2 ? '#a82a26' : '#d2392f'; }
        const fx = x % 2, fy = y % 2; if (fx < .05 || fy < .05) return '#7a7e8a'; return k < .06 ? '#9498a4' : k > .95 ? '#a8acb6' : ((Math.floor(x / 2) + Math.floor(y / 2)) & 1 ? '#9ea2ac' : '#a2a6b0'); }); } }); Wd.version++;
    // ---- life
    const cr = crowd(sc, sc.def.npcSpots, { seed: 23, fill: .7, lines: c => (sc.arena.mode === 'concert' ? LINES.concert : sc.arena.mode === 'ice' || sc.arena.mode === 'trucks' ? LINES.family : sc.arena.live ? (sc.arena.post ? (sc.arena.won ? LINES.post_w : LINES.post_l) : LINES.fan) : LINES.quiet) });
    const N = { e: [21.5, 12.8], l1: [21.5, 9.6], l2: [15, 8], l3: [27.6, 8.4], ga: [8.5, 3.4], gb: [34.5, 3.4], st: [5.2, 4.2], s2: [3.6, 9.2], bx: [3.4, 11.2], t1: [14.4, 2.2], t2: [28.2, 2.2], fd: [41.6, 5.2], f2: [38.6, 8.4], f3: [36, 12.2], f4: [44.6, 10.4], wc: [38.9, 5.6], m1: [10.6, 11.6], m2: [32.4, 12] };
    const ROUTES = [['e', 'l1', 'l2', 'ga'], ['e', 'l1', 'l3', 'gb'], ['e', 'l1', 'l3', 'f2*', 'fd*', 'f4', 'f3', 'm2', 'gb'], ['e', 'm1', 'bx*', 's2', 'st*', 'l2', 'ga'], ['ga', 'l2', 't1*', 'l1', 't2*', 'l3', 'gb'], ['gb', 'wc*', 'f2', 'm2', 'l1', 'e'], ['ga', 'st*', 's2', 'm1', 'e'], ['gb', 'fd*', 'f4*', 'f3', 'gb'], ['ga', 'l2', 'l1', 'l3', 'f2*', 'gb'], ['e', 'l1', 't1*', 'l2', 'st*', 'm1', 'e']];
    const lane = () => { const a = sc.arena, exitOnly = a && a.post, r = exitOnly ? pick([['ga', 'l2', 'l1', 'e'], ['gb', 'l3', 'l1', 'e'], ['gb', 'm2', 'e'], ['ga', 'm1', 'e'], ['ga', 'st*', 'm1', 'e']]) : pick(ROUTES), stay = r.map(k => k.endsWith('*')), keys = r.map(k => k.replace('*', ''));
      if (!exitOnly && Math.random() < .25) { keys.reverse(); stay.reverse(); }
      return { pts: keys.map((k, i) => Object.assign({ x: N[k][0] + O + (Math.random() - .5) * 1.2, y: N[k][1] + O + (Math.random() - .5) * .9 }, stay[i] ? { wait: 4 + Math.random() * 6, pose: Math.random() < .3 ? 'phone' : null } : null)), kind: exitOnly ? 'walk' : Math.random() < .3 ? 'bag' : Math.random() < .5 ? 'stroll' : 'walk' }; };
    const wk = walkers(sc, { n: 30, route: lane, lines: c => cr && LINES.fan, label: 'Fan' }); for (const w of wk.list) { w.ch.hidden = true; w.dead = Math.random() * 3; }
    // ---- Benny, by the TEAM ONLY door
    const P = specs(), benny = new Char(Object.assign({}, P.staff[2], { top: 'polo', topColor: TEAM.c, bottom: 'slacks', bottomColor: '#33303f', hat: 'cap', hatColor: TEAM.c, beard: true }), O + 1.6, O + 7.6); benny.dir = 0; benny.kind = 'staff'; sc.ents.push(benny);
    sc.interactables.push({ ent: benny, x: benny.x, y: benny.y, label: 'Benny, equipment manager', h: 1.3, hit: 8, range: 1.8, visible: () => !benny.hidden, use: () => { benny._hold = 6; benny.faceTo(G.player.x, G.player.y); if (AR()) AR().talkBenny(benny); } });
    let tick = 0, key = '';
    function sync() {
      const a = AR(), n = G.now(), open = isOpenNow(), st = a ? a.now() : { ph: 'none' }, ph = st.ph, ev = st.ev, mode = ev ? ev.kind : 'idle', half = !!st.half, post = ph === 'final' || ph === 'exit';
      const lvl = !open ? 0 : ph === 'doors' || ph === 'intro' ? .85 : half ? 1 : ph === 'live' ? .3 : post ? .8 : .16, k = [open, ph, half, lvl, mode, a && a.gatesOpen(), a && a.chain().st, n.day, Math.floor(n.hf)].join('|');
      sc.arena.mode = mode; sc.arena.live = ph !== 'none'; sc.arena.post = post; sc.arena.half = half; sc.arena.won = !!st.won; sc.arena.level = lvl; sc.arena.open = open;
      if (k === key) return; key = k;
      const qn = { grill: !open ? 0 : half ? 6 : ph === 'doors' ? 4 : ph === 'live' || post ? 2 : 1, snacks: !open ? 0 : half ? 5 : ph === 'doors' ? 3 : ph === 'live' ? 1 : 0, wc: !open ? 0 : half ? 9 : ph === 'doors' || post ? 3 : ph === 'live' ? 1 : 0 }; sc.arena.queue = qn;
      for (const c of cr.list) { const sp = c.spot; c.hidden = sp.kind === 'staff' ? !open || (sp.usher !== undefined && false) : !open || (sp.q ? sp.qi >= qn[sp.q] : sp.busy ? lvl < .5 || c.roll > lvl : c.roll > Math.min(1, (sp.p === undefined ? .6 : sp.p) * (lvl + .45))); }
      wk.setActive(Math.round(lvl * 30), !open); benny.hidden = !open;
      const go = !!(a && a.gatesOpen()); for (const o of gates) setP(o, { open: go ? 1 : 0 });
      if (a) { for (const o of boards) setP(o, { rows: a.boardRows(o.data.which) }); if (trophy) setP(trophy, { ball: a.chain().st >= 3 ? 1 : 0 }); if (tdoor) setP(tdoor, { open: a.backstageOpen() ? 1 : 0 }); }
    }
    sc.arena = { sync, level: 0, queue: { grill: 0, snacks: 0, wc: 0 }, benny, crowd: cr, walkers: wk, nodes: N, mode: 'idle' };
    sc.life = { crowd: cr, walkers: wk, count: () => cr.count() + wk.count() };
    sync();
    const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); cr.update(dt); wk.update(dt); if ((tick -= dt) <= 0) { tick = 1.2; sync(); } benny.t += dt; if (benny._hold > 0 && (benny._hold -= dt) <= 0) benny.dir = 0; };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); key = ''; sync(); if (AR()) AR().arrived(sc, pv); };
  },
});

/* =================================================================== the locker corridor */
const BW = 20, BD = 9, BM = mk();
(function buildBack() {
  const { S } = BM, A = BM.A.bind(BM), WY = BM.WY.bind(BM), WX = BM.WX.bind(BM);
  WY('cwall', 0, { w: 7, kind: 'lockerwall', name: 'OTTERS' }); WY('cwall', 7, { w: 7, kind: 'lockerwall', name: 'EST 1961' }); WY('cwall', 14, { w: 6, kind: 'lockerwall', name: 'KIT ROOM' });
  WX('cwall', 0, { w: 4.5, kind: 'portal', name: 'TO THE COURT' }, { tags: ['arena_tunnel'] }); WX('cwall', 4.5, { w: 4.5, kind: 'lockerwall', name: '1998' });
  A('lockers', 1, 0, { n: 5, names: ROSTER.slice(0, 5).map(p => p.last), nums: ROSTER.slice(0, 5).map(p => p.num) }, { ids: ROSTER.slice(0, 5).map(p => p.id) });
  A('lockers', 8, 0, { n: 5, names: ROSTER.slice(5).map(p => p.last), nums: ROSTER.slice(5).map(p => p.num) }, { ids: ROSTER.slice(5).map(p => p.id) });
  A('lbench', 2, 2.5, { w: 3 }); A('lbench', 9, 2.5, { w: 3 }); A('whiteboard', 14, .5); A('cage', 17, .5); A('suit', 17.5, 4.5, {}, { suit: 1 }); A('ttable', 12.5, 5.5); A('cooler', 6.5, 6.5); A('laundry', 3, 6);
})();
defineRoom({ id: 'arena:backstage', name: 'Otters Locker Corridor', w: BW, d: BD, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'arena', venue: ARENA_VENUES.place,
  floor: GT.f_stone, bg: '#14161e', edge: '#30343f', wall: { color: '#d8d2c4', trim: '#6a4226', h: 4.4 },
  exits: [{ x: 10, y: 8.5, label: 'Back to the concourse', use: () => G.go('int:arena', { x: O + 1.9, y: O + 6, dir: 0 }) }], spawn: { x: 10, y: 7.8, dir: 3 }, items: BM.items, npcSpots: [],
  setup(sc) {
    const Wd = sc.world; Wd.zmax = 6; const suit = by(Wd, 'suit')[0];
    Wd.decal({ x0: O, y0: O, x1: O + BW, y1: O + BD, draw(Rr) { const h2 = Rr.hash2; Rr.qz(O, O + BW, O, O + BD, 0, (x, y) => { x -= O; y -= O; if (Math.abs(y - 4.4) < 1) { if (Math.abs(Math.abs(y - 4.4) - .9) < .08) return '#f4f0e8'; return h2(Math.floor(x * 16), Math.floor(y * 16), 3) > .93 ? '#b8322a' : '#d2392f'; } const k = h2(Math.floor(x * 16), Math.floor(y * 16), 7); return k < .08 ? '#565c6c' : k > .94 ? '#6a7080' : '#606676'; }); } }); Wd.version++;
    const P = specs(), mkc = (spec, x, y, dir, label, use) => { const c = new Char(spec, O + x, O + y); c.dir = dir; c.kind = 'staff'; c.hdir = dir; sc.ents.push(c); sc.interactables.push({ ent: c, x: c.x, y: c.y, label, h: 1.3, hit: 8, range: 1.8, visible: () => !c.hidden, use: () => { c._hold = 6; if (!(c.poseOpts && c.poseOpts.seated)) c.faceTo(G.player.x, G.player.y); use(c); } }); return c; };
    const coach = mkc(Object.assign({}, P.staff[4], { top: 'suit', topColor: '#33303f', innerColor: '#f4f0e8', accent: TEAM.c, hat: null, hair: 'bob', hairColor: '#a9a9b4' }), 15.2, 2.4, 3, 'Coach Delacroix', c => AR() && AR().talkCoach(c)); coach.pose = 'read';
    const priya = mkc(Object.assign({}, P.adult[9], { top: 'hoodie', topColor: TEAM.c, hat: null }), 16.4, 5.3, 0, 'Priya (usually Ollie)', c => AR() && AR().talkPriya(c));
    const seats = [[2.5, 2.75], [4.5, 2.75], [9.5, 2.75], [11.5, 2.75]], players = [];
    const pspec = p => { const A = AR(); return A ? A.playerSpec(p, TEAM) : P.adult[0]; };
    ROSTER.forEach((p, i) => { const s = i < 4 ? seats[i] : null, c = mkc(pspec(p), s ? s[0] : 5.6 + (i - 4) * 1.3, s ? s[1] : 4.6 + (i % 2) * .6, s ? 1 : i % 2 ? 3 : 1, '#' + p.num + ' ' + p.name, ch => AR() && AR().talkPlayer(p, ch, sc)); if (s) { c.z = .48; c.poseOpts = { seated: true }; c.pose = 'sit'; } c.pid = p.id; players.push(c); });
    let tick = 0;
    function sync() { const a = AR(), st = a ? a.now() : { ph: 'none' }, game = st.ev && st.ev.kind === 'game', onCourt = game && (st.ph === 'intro' || st.ph === 'live' || st.ph === 'final'), here = game && (st.ph === 'doors' || st.ph === 'exit');
      players.forEach((c, i) => { c.hidden = onCourt || (!here && i % 3 !== (G.now().day % 3)); }); coach.hidden = onCourt; const done = !!(a && a.chain().st >= 6); priya.hidden = !done; if (suit) setP(suit, { gone: a && a.chain().st === 5 ? 1 : 0 }); }
    sc.arena = { sync, coach, players, priya }; sync();
    const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); if ((tick -= dt) <= 0) { tick = 1.5; sync(); } for (const c of players.concat([coach, priya])) { c.t += dt; if (c._hold > 0 && (c._hold -= dt) <= 0) { c.dir = c.hdir; if (c === coach) c.pose = 'read'; } } };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); sync(); if (AR()) AR().arrivedBack(sc); };
  },
});

registerInfo('Maple Bay Arena', {
  blurb: 'The big red-and-cream drum at the top of the Arts District, home of the Maple Bay Otters. Basketball on Wednesdays and Saturdays at 19:00, a concert every Friday at 20:00, a family show on Sunday afternoons. The concourse (team store, hot dogs, trophy case) is open 10:00 to 23:00; the bowl needs a ticket on event nights.',
  signature: 'Eight thousand people on their feet, the scoreboard counting down from three, and Whitlock rising for the corner shot.',
  tryThis: ['Buy a ticket at the box office (upper bowl, lower bowl or courtside) and watch a whole Otters game', 'Enter the half-court shot contest at half-time', 'Catch a T-shirt from Ollie\'s cannon', 'Wave a foam finger when the fan-cam finds you', 'Collect all twelve player cards (packs at The Otter Den)', 'Hunt autographs by the tunnel after the final buzzer', 'Stand on the floor at Friday Night Live and stay for the encore', 'Take the kids to Maple Bay on Ice, or Mini Monster Truck Mayhem, on Sunday at 14:00', 'Shoot hoops on the empty court on a quiet afternoon', 'Ask Benny by the TEAM ONLY door why he looks so worried'],
  activities: ['arena_watch_game', 'arena_shot_contest', 'arena_tshirt_catch', 'arena_fan_cam', 'arena_foam_finger', 'arena_cards', 'arena_autographs', 'arena_concert', 'arena_family_show', 'arena_shootaround'],
});

const only = fn => (fx, scene) => (scene.def && scene.def.showpiece === 'arena' ? fn(fx, scene) : null);
export function init() {
  const F = (tag, fn) => registerFixture(tag, only(fn));
  F('arena_shop', fx => ({ label: fx.item.label, hit: 14, shop: fx.item.venue, use: () => G.shop && G.shop.open(fx.item.venue, { checkHours: true }) }));
  F('arena_box', () => ({ label: 'Box office: tickets', hit: 16, use: () => AR() && AR().boxOffice() }));
  F('arena_portal', (fx, sc) => ({ label: 'Into the bowl: ' + (fx.item.p.name || 'the stands'), hit: 26, spot: { x: fx.x, y: O + 3.4 }, use: () => AR() && AR().enterBowl(fx.item.gateN || 0) }));
  F('arena_gate', (fx, sc) => ({ label: 'Turnstiles', hit: 12, spot: { x: fx.x, y: O + 3.4 }, use: () => AR() && AR().enterBowl(fx.item.gateN || 0) }));
  F('arena_board', fx => ({ label: fx.item.which === 'next' ? 'What\'s on at the arena' : 'Bay Coast League table', hit: 22, use: () => AR() && AR().lookBoard(fx.item.which) }));
  F('arena_trophy', () => ({ label: 'The Bay Cup, 1998', hit: 16, use: () => AR() && AR().lookTrophy() }));
  F('arena_statue', (fx, sc) => ({ label: 'Bronze Ollie', hit: 16, use: () => AR() && AR().statue(fx, sc) }));
  F('arena_album', () => ({ label: 'Otters card album', hit: 14, use: () => AR() && AR().album() }));
  F('arena_merch', fx => (fx.item.store ? { label: 'Browse the team store', hit: 12, shop: ARENA_VENUES.store, use: () => G.shop && G.shop.open(ARENA_VENUES.store, { checkHours: true }) } : null));
  F('arena_restroom', (fx, sc) => ({ label: 'Restroom', hit: 14, restroom: true, use: () => AR() && AR().restroom(fx, sc) }));
  F('arena_teamdoor', () => ({ label: 'TEAM ONLY', hit: 16, use: () => AR() && AR().teamDoor() }));
  F('arena_tunnel', () => ({ label: 'Tunnel to the court', hit: 24, use: () => AR() && AR().tunnelToCourt() }));
  F('arena_locker', (fx, sc) => ({ label: 'The lockers', hit: 18, use: () => AR() && AR().lookLockers(fx.item.ids || []) }));
  F('arena_whiteboard', () => ({ label: 'Coach\'s whiteboard', hit: 14, use: () => AR() && AR().whiteboard() }));
  F('arena_cage', () => ({ label: 'Equipment cage', hit: 16, use: () => AR() && AR().cage() }));
  F('arena_suit', (fx, sc) => ({ label: 'The Ollie suit', hit: 14, use: () => AR() && AR().suit(fx, sc) }));
  F('arena_cooler', () => ({ label: 'Team cooler', hit: 12, use: () => AR() && AR().cooler() }));
  F('arena_lbench', (fx, sc) => ({ label: 'Sit down', hit: 10, use: () => AR() && AR().sitBench(fx, sc) }));
}
