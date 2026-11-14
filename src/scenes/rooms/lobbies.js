// Lobby rooms for apartment + office buildings (sim/lobbies.js finds the buildings; scenes/rooms/lobbies2.js holds one hand-written spec per building).
// lobbyRoom(L) -> room def (not registered). L = { id 'lobby:<n>', n, kind 'res'|'office', style, v, w, d, mir, f 'feature words', c {palette}, name, sign, tenants, residents }.
// 13 layout families (walkup, court, loft, resgrand | deco, brutal, glass, corp, cowork, media, harbor, plant, civic); each lobby differs by size, variant, mirroring,
// palette, floor, era fixtures and feature words, so no two are alike. All layouts are written un-mirrored; the builder mirrors x when L.mir.
// Fixture tags handled here (only inside lobby rooms): lobby_lift, lobby_stairs, lobby_mail, lobby_board, lobby_desk, lobby_gate, lobby_packages, lobby_coffee,
// lobby_buzzer, lobby_door (item tag) and a fallback for `toilet` restroom doors (used until the bladder/toilet activity claims the tag).
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { registerFixture } from '../interior.js';
import { asset, assetSize } from '../../art/registry.js';
import { toast, say, choose } from '../../ui/kit.js';

const r2 = v => Math.round(v * 100) / 100, half = v => Math.floor(v * 2) / 2;
const METAL = { brass: '#d8a848', steel: '#b8bcc0', bronze: '#9a6a3a', black: '#3a3f4c', copper: '#c0704a', white: '#e8e4dc' };

function builder(L) {
  const W = L.w, D = L.d, M = !!L.mir, items = [], npc = [], floors = [];
  const A = id => asset('furn.' + id), fnv = (v, p) => (typeof v === 'function' ? v(p || {}) : v);
  const size = (id, p, fl) => { const s = assetSize(A(id), p || {}); return fl ? [s[1], s[0], s[2]] : s; };
  const mx = (x, w) => (M ? r2(W - x - w) : x);
  const b = {
    W, D, items, npc, floors, ex: W / 2,
    wy(id, at, p, o) { items.push(Object.assign({ id: 'furn.' + id, wall: 'y', at: mx(at, size(id, p)[0]) }, p ? { p } : null, o)); return b; },
    wx(id, at, p, o) { items.push(Object.assign({ id: 'furn.' + id, wall: 'x', at }, p ? { p } : null, o)); return b; },
    f(id, x, y, p, o) { o = o || {}; const fl = !!o.flip, it = Object.assign({ id: 'furn.' + id, x: o.keep ? x : mx(x, size(id, p, fl)[0]), y }, p ? { p } : null, o); delete it.keep; items.push(it); return it; },
    s(x, y, dir, anim, kind, keep) { npc.push({ x: M && !keep ? r2(W - x) : x, y, z: 0, dir: M && !keep && (dir === 0 || dir === 2) ? 2 - dir : dir, anim: anim || 'stand', kind: kind || 'customer' }); },
    seat(id, x, y, p, o, n = 1, skip = 0) {
      const it = b.f(id, x, y, p, o), a = A(id), fl = !!it.flip; let st = a.seatsFor ? a.seatsFor(p || {}) : fnv(a.seats, p); st = Array.isArray(st) ? st : [];
      for (const q of st.slice(skip, skip + n)) npc.push({ x: r2(it.x + (fl ? q.y : q.x)), y: r2(it.y + (fl ? q.x : q.y)), z: q.z || 0, dir: q.dir !== undefined ? (fl ? [1, 0, 3, 2][q.dir] : q.dir) : 1, anim: 'sit', kind: 'customer' });
      return it;
    },
    staff(id, x, y, p, o) { const it = b.f(id, x, y, p, o), q = fnv(A(id).staff, p); if (q) npc.push({ x: r2(it.x + q.x), y: r2(it.y + q.y), z: 0, dir: 1, anim: 'work', kind: 'staff' }); return it; },
    patch(x0, y0, x1, y1, fl) { floors.push({ x0: M ? W - x1 : x0, y0, x1: M ? W - x0 : x1, y1, floor: GT[fl] }); },
  };
  return b;
}
/** a lift bank behind security gates in the back corner (right, or left when mirrored). The lifts are decorative; the gates carry the interaction. Returns x0 of the zone.
 *  (World.place snaps to a half-tile grid, so every coordinate in these layouts is a multiple of .5.) */
function gate(b, L, n, lp) {
  const W = b.W, zw = n * 2, x0 = W - zw, nt = Math.min(3, n), tw = nt + .5, tx = x0 + half((zw - tw) / 2), mc = METAL[L.c.m] || '#8a9098';
  for (let i = 0; i < n; i++) b.wy('lobby.lift', x0 + i * 2, Object.assign({ floor: 1 + (L.n * 3 + i * 7) % 24 }, lp), { gated: true });
  b.f('lobby.rail', x0 - .5, 0, { w: 2.5, c: mc }, { flip: true });
  if (tx - x0 > .2) b.f('lobby.rail', x0, 2, { w: tx - x0, c: mc }); if (W - tx - tw > .2) b.f('lobby.rail', tx + tw, 2, { w: W - tx - tw, c: mc });
  b.f('lobby.turnstile', tx, 2, { n: nt, c: L.c.tc });
  b.patch(x0, 0, W, 2.5, L.c.gf || 'f_stone');
  return x0;
}
const plantP = (L, i) => [{ kind: 'palm', s: 1.5, pot: '#f1ede4' }, { kind: 'snake', s: 1.4, pot: '#3a3f4c' }, { s: 1.6, leaf: '#3f7a48', pot: METAL[L.c.m] || '#d8a848' }, { flower: '#e87aa0', s: 1.2, pot: '#6fa8b8' }, {}][(L.n + i) % 5];
/** plants in the two front corners (never mirrored, so they cannot collide) */
const corners = (b, L, left = true, right = true, p) => { if (left) b.f('generic.plant', 0, b.D - 1, p || plantP(L, 0), { keep: true }); if (right) b.f('generic.plant', b.W - .5, b.D - 1, p || plantP(L, 2), { keep: true }); };

const LAY = {
  /* ---------------- residential ---------------- */
  walkup(b, L) {
    const { W, D } = b, C = L.c, v = L.v || 0, st = { c: C.dc || '#6a5a4a', open: !L.has('stairdoor'), arch: L.has('arch'), dc: C.dc2, rail: C.rail }, sc = { m: C.m, kind: C.sk };
    if (v === 0) {
      b.ex = W / 2 + .5;
      b.wy('lobby.stairs', .5, st).wy('lobby.sconce', 2, sc).wy('lobby.mailboxes', 2.5, { w: 2, m: C.m, rows: C.rows || 3, seed: L.n });
      if (L.has('lift')) { b.wy('lobby.lift', W - 2.5, { style: 'cage', m: C.m, floor: 1 + L.n % 4 }); b.wx('lobby.board', D - 2, { kind: 'cork', w: 1.5, seed: L.n }); }
      else { b.wy('lobby.board', W - 2, { kind: 'cork', w: 1.5, seed: L.n }); b.wx('lobby.intercom', D - 1.5, { m: C.m, seed: L.n }); }
      if (W >= 9) b.wy('generic.picture', 5, { kind: L.n % 4, w: 1 });
      b.wx('generic.window', 1, { w: 1, cross: false, plant: true });
      b.seat('generic.bench', 0, 2, { c: C.s }, { flip: true, keep: true }, 1);
      b.f('lobby.inlay', half(b.ex - .5), 1.5, { kind: 'stripe', w: 1, d: D - 2.5, c: C.r, c2: C.r2 });
      corners(b, L, !L.mir, !!L.mir); b.f('lobby.umbrella', b.ex + 1, D - 1, { c: METAL[C.m] });
      if (L.has('bike')) b.f('lobby.bike', W - 2, D - 1.5, { c: C.a, basket: L.n % 2 === 0 }, { keep: true }); if (L.has('pkg')) b.f('courier.pile', W - 1.5, D - 2.5, {}, { keep: true });
      b.s(3.5, .8, 3); b.s(1.2, 1.3, 1, 'phone'); b.s(b.ex - 1.3, D - 1.4, 0); b.s(W - 1.3, 1.2, 3);
    } else if (v === 1) {
      const sx = half(W / 2 - .75); b.ex = W / 2 + (W >= 7 ? 1 : .5);
      b.wy('lobby.board', .5, { kind: 'cork', w: 1.5, seed: L.n + 3 }); if (sx >= 2.5) b.wy('lobby.sconce', sx - .5, sc); b.wy('lobby.stairs', sx, st).wy('lobby.sconce', sx + 1.5, sc);
      b.seat('generic.bench', W - 2, 0, { c: C.s }, null, 1);
      b.wx('lobby.mailboxes', 1, { w: 2, m: C.m, rows: C.rows || 3, seed: L.n }).wx('lobby.intercom', 3.5, { m: C.m, seed: L.n }); if (D >= 7) b.wx('generic.window', 4.5, { w: 1, cross: false, plant: true });
      b.patch(b.ex - 1.5, D - 2, b.ex + 1.5, D, C.mat || 'f_mat');
      b.f('lobby.inlay', sx - .5, 1.5, { kind: C.ik || 'checker', w: 2.5, d: D - 3.5, c: C.r, c2: C.r2, s: .5 });
      corners(b, L, !!L.mir, !L.mir, plantP(L, 1)); b.f('lobby.umbrella', b.ex - 1.5, D - 1, { c: METAL[C.m] });
      if (L.has('bike')) b.f('lobby.bike', .5, D - 1.5, { c: C.a }); if (L.has('pkg')) b.f('courier.pile', W - 1.5, 2.5, {});
      b.s(.8, 2.2, 2, 'stand', 'customer', true); b.s(sx + .75, 1.3, 1, 'phone'); b.s(b.ex + 1, D - 1.7, 3); b.s(1.2, 1.2, 3);
    } else {
      b.ex = W / 2 - .5;
      b.wy('lobby.lift', .5, { style: 'cage', m: C.m, floor: 2 + L.n % 3 }).wy('lobby.stairs', 2.5, st).wy('lobby.sconce', 4, sc).wy('lobby.board', 4.5, { kind: 'cork', w: 1.5, seed: L.n });
      if (L.has('panel')) b.wy('lobby.panel', 6, { kind: 'wood', w: W - 6, c: C.pc || '#5a3a28' }); if (W >= 9) b.wy('generic.picture', 6.5, { kind: 2, c: METAL[C.m], w: 1 });
      b.wx('lobby.mailboxes', 1, { w: 2.5, m: C.m, rows: 3, seed: L.n }).wx('lobby.sconce', 4, sc);
      if (L.has('nodesk')) b.seat('generic.bench', W - 2, 1.5, { c: C.s }, null, 2); else b.staff('lobby.podium', W - 2, 2, { name: 'DOORMAN', c: C.pc || '#5a4030', a: METAL[C.m] }, { label: 'Doorman' });
      b.f('lobby.inlay', half(b.ex - 1.5), 2.5, { kind: C.ik || 'border', w: 3, d: 2, c: C.r, c2: C.r2, c3: METAL[C.m] }); b.f('lobby.chandelier', half(b.ex - .5), 3, { kind: C.ch || 'crystal', m: C.m });
      b.seat('lobby.settee', W - 2.5, D - 2.5, { c: C.s, a: METAL[C.m] }, null, 1);
      b.f('generic.plant', W - .5, 0, plantP(L, 2)); b.f('lobby.umbrella', b.ex + 1, D - 1, { c: METAL[C.m] });
      b.s(1.5, 1.1, 3); b.s(.8, 2.3, 2, 'stand', 'customer', true); b.s(b.ex - 1.4, D - 1.5, 0, 'phone');
    }
  },
  court(b, L) {
    const { W, D } = b, C = L.c, v = L.v || 0;
    if (v === 0) {
      const mxm = half(W / 2 - 1.5);
      b.wy('lobby.stairs', .5, { c: C.dc, dc: C.dc2 }).wy('lobby.mailboxes', mxm, { w: 3, m: C.m, rows: C.rows || 3, seed: L.n }).wy('lobby.stairs', W - 2, { c: C.dc, open: true, rail: C.rail });
      b.f('lobby.packages', 2, 0, { w: 1, seed: L.n, c: C.pk });
      if (W >= 10) b.seat('generic.bench', mxm + 3, 0, { c: C.s }, null, 1); else b.seat('generic.bench', W - 2.5, D - 2, { c: C.s }, null, 1);
      b.wx('generic.window', .5, { w: 1, cross: false, plant: true }).wx('lobby.board', 2.5, { kind: 'cork', w: 1.5, seed: L.n }); if (D >= 6) b.wx('lobby.sconce', 4.5, { m: C.m, kind: C.sk });
      b.f('generic.rug', 1.5, 2, { w: W - 3, d: 1, c: C.r, c2: C.r2 });
      corners(b, L); b.f('lobby.umbrella', b.ex + 1.5, D - 1, { c: METAL[C.m] });
      if (L.has('bike')) b.f('lobby.bike', 1, D - 1.5, { c: C.a, basket: true });
      b.s(W / 2, .8, 3); b.s(W - 1.2, 1.3, 1, 'phone'); b.s(W - 4, 3.4, 2); b.s(1.2, 1.3, 1);
    } else {
      const ww = W >= 10 ? 3 : 2, wp = { w: ww, z0: .3, z1: 2.3, c: C.wf || '#f1ede4', seed: L.n };
      b.wy('generic.window', W >= 10 ? .5 : 1, wp).wy('generic.doorway', half(W / 2 - 1), { w: 2, c: C.dc || '#8a6a4a', dark: '#5a8a6a' }, { tags: ['lobby_door'], label: 'Courtyard', text: 'A shared courtyard: washing lines, a lemon tree in a tub, somebody practising the trumpet badly. Residents only.' }).wy('generic.window', W - (W >= 10 ? 3.5 : 3), wp);
      b.seat('generic.bench', 1, 0, { c: C.s }, null, 1); b.seat('generic.bench', W - 2.5, 0, { c: C.s }, null, 1);
      b.wx('lobby.mailboxes', 1, { w: 2.5, m: C.m, rows: C.rows || 3, seed: L.n }).wx('lobby.stairs', 3.5, { c: C.dc, open: true, rail: C.rail }); if (D >= 6) b.wx('lobby.intercom', 5, { m: C.m, seed: L.n });
      b.f('lobby.inlay', half(W / 2 - 2), 1.5, { kind: C.ik || 'diamond', w: 4, d: D - 2.5, c: C.r, c2: C.r2, c3: METAL[C.m], s: 1 });
      corners(b, L, false, true, plantP(L, 1)); b.f('courier.pile', W - 1.5, 2, {}, { keep: true });
      if (L.has('bike')) b.f('lobby.bike', W - 3.5, D - 1.5, { c: C.a });
      b.s(.8, 2.2, 2, 'stand', 'customer', true); b.s(W / 2 + .3, 1.2, 1); b.s(b.ex + 1.5, D - 1.6, 3, 'phone'); b.s(.8, 4.2, 2, 'stand', 'customer', true);
    }
  },
  loft(b, L) {
    const { W, D } = b, C = L.c, v = L.v || 0, win = { c: '#3a3f4c', z0: .3, z1: 2.3, seed: L.n };
    if (v === 0) {
      b.wy('lobby.lift', .5, { style: 'freight', floor: 1 + L.n % 3 }).wy('lobby.stairs', 2.5, { c: '#4a4f5c', dc: C.dc2 || '#8a9aa8' }).wy('generic.window', 4, Object.assign({ w: W >= 10 ? 3 : 2 }, win));
      b.f('courier.parcellocker', W - 2.5, 0, {}, { tags: ['lobby_packages'] });
      b.wx('lobby.mailboxes', 1, { w: 2.5, m: 'steel', rows: 4, seed: L.n }).wx('lobby.board', 4, { kind: 'cork', w: 2, seed: L.n }); if (D >= 8) b.wx('lobby.sconce', 6.5, { m: 'black', kind: 'tube' });
      b.f('lobby.column', 3, 2.5, { kind: C.col || 'steel' }); b.f('lobby.column', W - 3.5, 2.5, { kind: C.col || 'steel' });
      b.f('generic.rug', 3.5, 3.5, { w: 3.5, d: 2.5, c: C.r, c2: C.r2, inner: C.r3 });
      b.seat('generic.sofa', 4, 3.5, { c: C.s }, null, 2); b.f('clinic.magtable', 4.5, 4.5); b.seat('generic.sofa', 2.5, 4.5, { c: C.s2 || C.s, w: 1 }, { flip: true }, 1);
      b.f('lobby.bike', W - 2, 3.5, { c: C.a }); b.f('lobby.bike', W - 2, 4, { c: '#2f8f8a', basket: true }); if (L.has('bike')) b.f('lobby.bike', W - 2, 4.5, { c: '#f2c230' });
      b.f('lobby.chandelier', 4.5, 4, { kind: 'industrial', c: C.a }); b.f('lobby.chandelier', W - 2.5, 1.5, { kind: 'industrial', c: C.a });
      corners(b, L);
      b.s(1.5, 1.1, 3); b.s(.8, 2.2, 2, 'stand', 'customer', true); b.s(W - 2.6, 3.4, 0); b.s(W - 1.5, 1.1, 3, 'phone');
    } else {
      b.wy('lobby.mailboxes', .5, { w: 3, m: C.m || 'steel', rows: 4, seed: L.n }).wy('lobby.lift', 4, { style: 'freight', floor: 2 }).wy('lobby.stairs', 6, { c: '#4a4f5c', open: true, rail: '#2a2733' });
      if (W >= 10) b.wy('lobby.board', 8, { kind: 'cork', w: 1.5, seed: L.n });
      b.wx('generic.window', 1, Object.assign({ w: 3 }, win)).wx('generic.window', 4.5, Object.assign({ w: 3 }, win));
      b.f('lobby.column', 3.5, 2.5, { kind: C.col || 'wood' }); b.f('lobby.column', W - 3, 5, { kind: C.col || 'wood' });
      b.f('generic.rug', 1, 3.5, { w: 3, d: 2.5, c: C.r, c2: C.r2, inner: C.r3 });
      b.seat('generic.sofa', 1.5, 3.5, { c: C.s }, null, 2); b.f('clinic.magtable', 2, 4.5); b.f('generic.floorlamp', 1, 3.5, {});
      b.seat('office.meeting', W - 4, 2, {}, null, 2); b.f('lobby.packages', W - 2.5, D - 3, { w: 2, seed: L.n, c: '#7d858e' });
      b.f('lobby.bike', .5, D - 1.5, { c: C.a }, { keep: true });
      b.f('lobby.chandelier', 2, 4, { kind: 'industrial', c: C.a }); b.f('lobby.chandelier', W - 3, 2.5, { kind: 'industrial', c: C.a });
      b.f('generic.plant', W - .5, 0, plantP(L, 2)); corners(b, L, false, true);
      b.s(2, .8, 3); b.s(5, 1.1, 3, 'phone'); b.s(W - 1.5, D - 1.8, 3); b.s(b.ex + 1.4, D - 1.5, 2);
    }
  },
  resgrand(b, L) {
    const { W, D } = b, C = L.c, mw = W >= 10 ? 3 : 2, lx = mw + 1;
    b.wy('lobby.mailboxes', .5, { w: mw, m: C.m, rows: 3, seed: L.n }).wy('lobby.lift', lx, { style: C.lift || 'cage', m: C.m, floor: 3 }).wy('lobby.sconce', lx + 2, { m: C.m, kind: C.sk }).wy('lobby.stairs', lx + 2.5, { c: C.dc, open: true, arch: L.has('arch'), rail: C.rail });
    if (W - (lx + 4) >= 2) b.wy('lobby.board', W - 2, { kind: 'cork', w: 1.5, seed: L.n });
    b.staff('lobby.desk', W - 3, 2, { style: C.desk || 'wood', w: 2.5, name: C.dn || 'CONCIERGE', a: METAL[C.m], c: C.dkc }, { label: C.dl || 'Concierge' });
    b.wx('generic.picture', 1, { kind: 3, w: 1.5, c: METAL[C.m] }).wx('lobby.sconce', 2.5, { m: C.m, kind: C.sk }).wx('generic.window', D - 2.5, { w: 2, curtain: C.cur || '#c0563a', seed: 4 });
    b.seat('lobby.settee', 0, 2.5, { c: C.s, a: METAL[C.m] }, { flip: true, keep: true }, 1);
    if (L.has('fountain')) { b.seat('airport.fountain', half(W / 2 - 1.5), 3, {}, null, 1); b.ex = W - 2; }
    else { b.f('lobby.inlay', half(W / 2 - 1.5), 2.5, { kind: C.ik || 'star', w: 3, d: 2.5, c: C.r, c2: C.r2, c3: METAL[C.m] }); b.ex = half(W / 2 - .5); }
    b.f('lobby.chandelier', half(W / 2 - .5), 3, { kind: C.ch || 'crystal', m: C.m });
    b.f('generic.plant', W - .5, 0, { kind: 'palm', s: 1.5, pot: METAL[C.m] }); corners(b, L, true, true, { kind: 'palm', s: 1.5, pot: METAL[C.m] });
    b.s(lx + 1, 1.1, 3); b.s(1.5, 1.1, 3, 'phone'); b.s(b.ex - 1.3, D - 1.5, 0); b.s(W - 1.8, 3.4, 3);
  },
  /* ---------------- offices ---------------- */
  deco(b, L) {
    const { W, D } = b, C = L.c, n = L.lifts || 2, lx = 4, end = lx + n * 2, mc = METAL[C.m];
    b.ex = half(W / 2 + .5);
    b.wy('lobby.panel', .5, { kind: 'sunburst', w: 3, c: C.pc, c2: mc });
    b.wy('lobby.sconce', lx - .5, { m: C.m, kind: 'fan' }); for (let i = 0; i < n; i++) b.wy('lobby.lift', lx + i * 2, { style: 'deco', m: C.m, c: C.lc, floor: 2 + i * 5 + L.n % 4 }); b.wy('lobby.sconce', end, { m: C.m, kind: 'fan' });
    const dirBack = W - end - .5 >= 2.5; if (dirBack) b.wy('lobby.board', W - 2.5, { kind: 'felt', w: 2, m: C.m, seed: L.n });
    b.wx('generic.clock', 1, { c: mc, h: 3, m: 40 }).wx('lobby.restroom', 3, { dc: '#8a5a3a', c: '#5a4030' }).wx('lobby.sconce', 4, { m: C.m, kind: 'fan' });
    if (dirBack) b.wx('lobby.panel', 4.5, { kind: 'marble', w: 2, c: C.mc || '#e8e4dc', c2: mc, seed: L.n }); else b.wx('lobby.board', 4.5, { kind: 'felt', w: 2, m: C.m, seed: L.n });
    b.staff('lobby.desk', .5, 1.5, { style: 'deco', w: 3, name: L.sign, a: mc, c: C.dkc }, { label: 'Reception' });
    b.f('lobby.column', 3.5, 2.5, { kind: 'deco', a: mc, c: C.cc }); b.f('lobby.column', end, 2.5, { kind: 'deco', a: mc, c: C.cc });
    b.f('lobby.inlay', b.ex - 1.5, 3.5, { kind: C.ik || 'star', w: 3, d: 3, c: C.ic || '#2a2733', c2: C.r2 || '#e8e4dc', c3: mc, s: 1 });
    b.f('lobby.chandelier', b.ex - .5, 4.5, { kind: 'deco', m: C.m }); if (W >= 13) b.f('lobby.chandelier', 2, 4.5, { kind: 'deco', m: C.m });
    b.seat('lobby.settee', W - 2.5, D - 3.5, { c: C.s, a: mc }, null, 1); b.seat('lobby.settee', 1, D - 3.5, { c: C.s, a: mc }, null, 1);
    b.f('generic.plant', W - .5, 0, { kind: 'palm', s: 1.5, pot: mc }); corners(b, L, true, true, { kind: 'palm', s: 1.5, pot: mc });
    b.s(b.ex + 1.4, D - 1.5, 3, 'stand', 'staff'); b.s(lx + 1, 1.1, 3); b.s(lx + 3, 1.3, 1, 'phone'); if (dirBack) b.s(W - 1.5, 1.1, 3); else b.s(.8, 5.7, 2, 'stand', 'customer', true);
  },
  brutal(b, L) {
    const { W, D } = b, C = L.c, x0 = gate(b, L, 3, { style: 'steel', c: C.lc || '#6a6a68' });
    b.wy('lobby.panel', .5, { kind: 'relief', w: Math.min(3, x0 - 1.5), c: C.pc || '#9a9a96', c2: C.a, seed: L.n });
    b.wx('lobby.sconce', 2.5, { m: 'steel', kind: 'tube' }).wx('lobby.board', 3, { kind: 'digital', w: 2, seed: L.n, c: C.scr, a: C.a }).wx('lobby.restroom', 5.5, { c: '#5a5a58', dc: C.rd || '#c8c4bc' }).wx('lobby.sconce', 7, { m: 'steel', kind: 'tube' });
    b.staff('lobby.podium', x0 - 1.5, 2, { name: 'SECURITY', c: C.pd || '#3a3f4c', a: C.a }, { label: 'Security desk' });
    b.seat('generic.bench', 1.5, 4.5, { c: C.s }, null, 1); b.f('airport.planter', 1, 5.5, {}); b.seat('generic.bench', 1.5, 6.5, { c: C.s }, null, 1);
    b.f('lobby.column', 5, 4, { kind: 'concrete', c: C.cc }); b.f('lobby.column', W - 2.5, 4, { kind: 'concrete', c: C.cc });
    if (D >= 10) { b.f('lobby.column', 5, 7, { kind: 'concrete', c: C.cc }); b.f('lobby.column', W - 2.5, 7, { kind: 'concrete', c: C.cc }); }
    b.f('lobby.inlay', 6, 4.5, { kind: 'stripe', w: W - 9, d: D - 6, c: C.r || '#5a5a58', c2: C.a });
    b.f('lobby.chandelier', half(W / 2 + 1), 5, { kind: 'ring', m: 'black' }); b.f('generic.bin', W - .5, D - 1, {}, { keep: true });
    if (L.has('vend')) b.f('generic.vending', 0, D - 2.5, { c: '#3c64ad', kind: 'snacks', seed: 5 }, { flip: true, keep: true });
    b.s(.8, 4, 2, 'stand', 'customer', true); b.s(x0 - 2.6, 3.4, 0, 'phone'); b.s(x0 + 3, 3.4, 3); b.s(b.ex + 1.5, D - 1.6, 3);
  },
  glass(b, L) {
    const { W, D } = b, C = L.c, n = L.lifts || 3, x0 = gate(b, L, n, { style: 'glass', c: '#c8ccd0' }), ky = half(D / 2 + .5);
    if (L.has('mural')) b.wy('lobby.panel', .5, { kind: 'mural', w: Math.min(4, x0 - 1), cols: C.cols, seed: L.n }); else b.wy('lobby.panel', 1, { kind: 'logo', w: 3, name: L.sign, c: C.lc || '#2e3440', c2: C.a });
    if (x0 - 5 >= 2) b.wy('generic.window', 4.5, { w: 2, z0: .3, z1: 2.3, c: '#5a6272', seed: L.n });
    if (L.has('green')) b.wx('airport.greenwall', 1, { w: 4, text: L.sign }); else b.wx('generic.window', 1, { w: 3, z0: .3, z1: 2.3, c: '#5a6272', seed: L.n + 2 }).wx('lobby.sconce', 4.5, { m: 'steel', kind: 'tube' });
    b.wx('lobby.board', 5.5, { kind: 'digital', w: 2, seed: L.n, c: C.scr, a: C.a }).wx('lobby.restroom', 7.5, {});
    b.staff('lobby.desk', .5, 1.5, { style: 'glass', w: 3.5, name: L.has('mural') ? L.sign : 'WELCOME', a: C.a, c: C.dkc, flower: C.a }, { label: 'Reception' });
    if (L.has('fountain')) b.seat('airport.fountain', half(x0 - 1.5), 4, {}, null, 2); else if (L.has('tree')) b.seat('airport.tree', half(x0 - 1), 4.5, {}, null, 2);
    b.patch(.5, D - 4, 4.5, D - 1, C.lf || 'f_carpet');
    b.seat('generic.sofa', 1, D - 3.5, { c: C.s, w: 3 }, null, 2); b.f('clinic.magtable', 2, D - 2.5); corners(b, L);
    if (L.has('coffee')) { b.staff('lobby.coffeebar', W - 3, ky, { c: C.kc, a: C.ka, name: C.kn }, { label: C.kl || 'Coffee kiosk' }); b.s(W - 1.8, ky + 1.5, 3); }
    else { b.seat('generic.sofa', W - 3, ky, { c: C.s2 || C.s }, null, 1); b.f('generic.floorlamp', W - .5, ky, {}); }
    if (L.has('bike')) b.f('lobby.bike', W - 2.5, D - 1.5, { c: C.a });
    b.f('lobby.chandelier', half(W / 2 - 1), half(D / 2 + 1), { kind: 'ring', m: C.m || 'steel' }); b.f('lobby.chandelier', half(W / 2 + 2), half(D / 2 - .5), { kind: 'ring', m: C.m || 'steel' });
    b.s(2.2, 3, 3); b.s(.8, 6.6, 2, 'stand', 'customer', true); b.s(x0 + n, 3.4, 3, 'phone'); b.s(b.ex - 1.5, D - 1.5, 0);
  },
  corp(b, L) {
    const { W, D } = b, C = L.c, v = L.v || 0, mc = METAL[C.m] || '#d8a848', lp = { style: C.lift || 'steel', c: C.lc, m: C.m };
    if (!L.has('nopatch')) b.patch(1, 3, W - 1, D - 1, C.cf || 'f_carpet');
    if (v === 0) {
      const x0 = L.has('gate') ? gate(b, L, 2, lp) : W - 4;
      if (!L.has('gate')) { b.wy('lobby.lift', W - 4, Object.assign({ floor: 4 }, lp)).wy('lobby.lift', W - 2, Object.assign({ floor: 11 }, lp)); }
      b.wy('lobby.panel', .5, { kind: 'wood', w: Math.min(4, x0 - 1), c: C.wd || '#8a5a3a', h: 1.2 }).wy('lobby.panel', 1, { kind: 'logo', w: 3, name: L.sign, c: C.lgc || '#2e3440', c2: C.a, z0: 1.55 });
      if (L.has('books')) for (let x = 4.5; x + 2 <= x0 - .5; x += 2) b.f('books.shelf', x, 0, {}, { tags: ['lobby_books'] });
      else if (L.has('chart') && x0 - 5 >= 2) b.wy('lobby.panel', 4.5, { kind: 'chart', w: 2 }); else if (x0 - 5 >= 1.5) b.wy('generic.picture', 4.5, { kind: 3, w: 1.5, c: mc });
      b.wx('generic.picture', 1, { kind: L.n % 3, c: mc }).wx('lobby.board', 3, { kind: C.dir || 'felt', w: 2, m: C.m, seed: L.n, a: C.a, c: C.scr }).wx('lobby.restroom', D - 3, { dc: C.rd }).wx('lobby.sconce', D - 1.5, { m: C.m, kind: C.sk });
      b.staff('lobby.desk', .5, 1.5, { style: C.desk || 'wood', w: 3, name: 'RECEPTION', a: mc, c: C.dkc }, { label: 'Reception' });
      b.seat('generic.sofa', 1, D - 3.5, { c: C.s }, null, 1); b.f('clinic.magtable', 1.5, D - 2.5); b.f('generic.floorlamp', 3.5, D - 3.5, { c: C.a, base: mc });
      b.seat('clinic.chairs', W - 3, D - 3, {}, null, 2); b.f('generic.cooler', W - .5, D - 3, {}); corners(b, L, false, true);
      b.f('lobby.chandelier', half(W / 2), half(D / 2 + .5), { kind: C.ch || 'ring', m: C.m });
      b.s(2, 3, 3); b.s(.8, 4, 2, 'stand', 'customer', true); b.s(L.has('gate') ? x0 + 2 : W - 3, L.has('gate') ? 3.4 : 1.1, 3, 'phone'); b.s(b.ex + 1.5, D - 1.5, 2);
    } else {
      b.ex = half(W / 2 + 1);
      b.wx('lobby.lift', 1, Object.assign({ floor: 6 }, lp)).wx('lobby.lift', 3, Object.assign({ floor: 14 }, lp)).wx('lobby.sconce', 5, { m: C.m, kind: C.sk }).wx('generic.picture', D - 2.5, { kind: 1, c: mc });
      b.wy('lobby.panel', 2, { kind: 'wood', w: W - 5.5, c: C.wd || '#8a5a3a', h: 1.2 }).wy('lobby.panel', half(W / 2 - 1.5), { kind: 'logo', w: 3, name: L.sign, c: C.lgc || '#2e3440', c2: C.a, z0: 1.55 });
      b.wy('lobby.board', W - 3.5, { kind: C.dir || 'digital', w: 2, m: C.m, seed: L.n, a: C.a, c: C.scr }).wy('lobby.restroom', W - 1, { dc: C.rd });
      b.staff('lobby.desk', half(W / 2 - 1.5), 1.5, { style: C.desk || 'steel', w: 3, name: 'RECEPTION', a: C.a, c: C.dkc }, { label: 'Reception' });
      b.f('generic.queuepost', 1, 5, { n: 2, kind: 'belt', c: C.a });
      b.seat('generic.sofa', W - 3, D - 3.5, { c: C.s }, null, 1); b.f('clinic.magtable', W - 2.5, D - 2.5); b.seat('clinic.chairs', W - 3, D - 5.5, {}, null, 1);
      b.f('generic.plant', W - .5, 3, plantP(L, 1)); corners(b, L, !L.mir, !!L.mir); b.f('generic.cooler', L.mir ? W - 2 : 1.5, D - 1, {}, { keep: true });
      b.f('lobby.chandelier', half(W / 2), half(D / 2 + .5), { kind: C.ch || 'ring', m: C.m });
      b.s(half(W / 2), 3, 3); b.s(.8, 2, 2, 'phone', 'customer', true); b.s(W - 2.5, 1.1, 3); b.s(b.ex - 1.6, D - 1.5, 0);
    }
  },
  cowork(b, L) {
    const { W, D } = b, C = L.c; b.ex = 8.5;
    b.wy('lobby.stairs', .5, { c: '#4a5a4a', open: true, rail: '#2a2733' }).wy('office.whiteboard', 2, {}).wy('lobby.panel', 4.5, { kind: 'mural', w: 4, cols: C.cols, seed: 5 }).wy('lobby.restroom', 9, {}).wy('lobby.board', 10.5, { kind: 'cork', w: 2, seed: 9 });
    b.wx('generic.window', 1, { w: 3, z0: .3, z1: 2.3, c: '#3a3f4c', seed: 3 }).wx('generic.picture', 4.5, { kind: 2, c: '#d8a848' }).wx('lobby.board', 7, { kind: 'digital', w: 2, seed: 2, c: '#2f4a3f', a: C.a });
    b.seat('office.meeting', 3, 2, {}, null, 3); b.seat('office.meeting', 7.5, 2, {}, null, 2, 3);
    b.staff('lobby.coffeebar', .5, 5.5, { c: '#2f5a4a', a: '#f4e9cf', name: 'BEAN BAR' }, { label: 'Bean Bar', keep: true }); b.s(1.7, 7, 3, 'stand', 'customer', true);
    b.staff('lobby.desk', W - 3, 5.5, { style: 'steel', w: 2.5, name: 'SHED 5', a: C.a, c: '#e8e4dc' }, { label: 'Community desk' });
    b.f('generic.rug', 4, 5, { w: 3.5, d: 2.5, c: C.r, c2: C.r2, inner: '#4f7a6a' }); b.seat('generic.sofa', 4.5, 5.5, { c: C.s, w: 3 }, null, 2); b.f('clinic.magtable', 5.5, 6.5);
    b.f('lobby.bike', W - 2, 3.5, { c: C.a }); b.f('lobby.bike', W - 2, 4, { c: '#f2c230', basket: true }); b.f('generic.lockers', 11.5, 2.5, { w: 1, c: '#8a9098', open: true });
    for (const [x, y] of [[4, 2.5], [8.5, 2.5], [5.5, 6]]) b.f('lobby.chandelier', x, y, { kind: 'industrial', c: C.a });
    b.f('generic.plant', W - .5, D - 1, { s: 1.6, leaf: '#3f7a48', pot: '#d8a848' }); b.f('generic.plant', 3.5, D - 1, { kind: 'snake', s: 1.4, pot: '#3a3f4c' }); b.f('generic.plant', 6.5, 0, {});
    b.s(3.5, 1, 3); b.s(10.5, 7.2, 1, 'phone');
  },
  media(b, L) {
    const { W, D } = b; b.ex = 5;
    b.wy('lobby.panel', .5, { kind: 'screens', w: 3, seed: 6 }).wy('generic.door', 4, { kind: 'staff', dc: '#5a6272' }, { tags: ['lobby_door'], label: 'Studio A', text: 'The red light is on. Somewhere behind this door the six o\'clock news is being read by a man with extremely good hair.' }).wy('lobby.panel', 4, { kind: 'onair', w: 1.5 }).wy('lobby.lift', 6, { style: 'steel', floor: 3 }).wy('lobby.restroom', 8, {});
    b.wx('lobby.panel', 1, { kind: 'awards', w: 2, c: '#3a3f4c', c2: '#e8c06a' }).wx('lobby.panel', 3.5, { kind: 'logo', w: 3, name: 'MBTV', c: '#b8342e', c2: '#fff2c4' });
    b.staff('lobby.desk', .5, 1.5, { style: 'glass', w: 3, name: 'MBTV', a: '#b8342e', flower: '#f2c230' }, { label: 'Reception' });
    b.f('generic.rug', 5, 3.5, { w: 3, d: 2, c: '#2e3440', c2: '#b8342e', inner: '#3a4252' }); b.seat('generic.sofa', 5.5, 3.5, { c: '#b8342e' }, null, 2); b.f('clinic.magtable', 6, 4.5);
    b.f('lobby.chandelier', 4, 3.5, { kind: 'ring', m: 'black' }); b.f('generic.plant', W - .5, D - 1, { kind: 'snake', s: 1.4, pot: '#3a3f4c' }); b.f('generic.plant', 0, D - 1, { kind: 'palm', s: 1.5, pot: '#f1ede4' });
    b.s(2, 3, 3); b.s(7, 1.1, 3, 'phone'); b.s(.8, 4.6, 2); b.s(3.3, D - 1.5, 0);
  },
  harbor(b, L) {
    const { W, D } = b; b.ex = 3.5;
    b.wy('lobby.panel', .5, { kind: 'chart', w: 2 }).wy('lobby.stairs', 3, { c: '#7a2f2f', open: true, rail: '#d8a848' }).wy('lobby.panel', 4.5, { kind: 'buoy', w: 1, bg: '#e6dcc0' }).wy('lobby.board', 5.5, { kind: 'safety', w: 2, title: 'TIDES', c: '#2f5f9f', seed: 3 });
    b.wx('generic.window', 1, { w: 1, cross: false, plant: true }).wx('generic.picture', 2.5, { kind: 'sea', w: 1 }).wx('lobby.restroom', 4, { dc: '#8a5a3a', c: '#5a4030' });
    b.staff('lobby.desk', W - 3, 2, { style: 'wood', w: 2.5, name: 'HARBOR', a: '#d8a848', c: '#7a4e2d', shade: '#2f5f9f' }, { label: 'Harbor desk' });
    b.seat('generic.bench', 0, 1.5, { c: '#8a5a3a' }, { flip: true, keep: true }, 1);
    b.f('generic.rug', 2, 3, { w: 3, d: 1.5, c: '#2f3f72', c2: '#e8c06a' }); b.f('lobby.umbrella', W - .5, D - 1, { c: '#d8a848' }); b.f('generic.plant', 0, D - 1, plantP(L, 2)); b.f('lobby.chandelier', 3, 2.5, { kind: 'industrial', c: '#2f5f9f' });
    b.s(1.5, 1.1, 3); b.s(6.5, 1.2, 3, 'phone'); b.s(W - 1.8, 3.4, 3);
  },
  plant(b, L) {
    const { W, D } = b, C = L.c;
    b.wy('lobby.timeclock', .5, {}).wy('lobby.board', 2, { kind: 'safety', w: 2, title: C.bt || 'SAFETY', c: C.bc, seed: L.n }).wy('generic.door', 4, { kind: 'staff', dc: C.sd }, { tags: ['lobby_door'], label: C.dl || 'Shop floor', text: C.dt });
    b.f('generic.vending', 5.5, 0, { c: '#3c64ad', kind: 'snacks', seed: L.n }); b.f('generic.cooler', 7, 0, {});
    if (L.has('plane')) b.wy('lobby.panel', W - 2.5, { kind: 'plane', w: 2 });
    b.wx('lobby.restroom', 1, {}).wx(L.has('plane') ? 'lobby.panel' : 'generic.picture', 2.5, L.has('plane') ? { kind: 'awards', w: 2, c: '#5a6272', c2: '#c4c9ce' } : { kind: 1, c: '#2a2733' }).wx('generic.clock', D - 2, {});
    b.f('generic.lockers', 0, 4.5, { w: 2, c: C.lk }, { flip: true, keep: true });
    b.staff('lobby.desk', W - 3, 2.5, { style: 'steel', w: 2.5, name: L.sign, a: C.a, c: C.dkc }, { label: 'Front office' });
    if (L.has('sofa')) { b.seat('generic.sofa', 2, 4, { c: C.s }, null, 2); b.f('clinic.magtable', 2.5, 5); } else { b.seat('clinic.chairs', 2, 3.5, {}, null, 2); b.seat('clinic.chairs', 4, 3.5, {}, null, 1); }
    b.f('lobby.inlay', half(b.ex - .5), 4.5, { kind: 'stripe', w: 1, d: D - 5.5, c: '#f2c230', c2: '#2a2733' }); b.f('generic.bin', W - .5, D - 1, { recycle: true }, { keep: true }); b.f('generic.plant', W - .5, 1, plantP(L, 1));
    b.s(1, 1.1, 3); b.s(6, 1.1, 3, 'phone'); b.s(W - 1.8, 4, 3); b.s(b.ex + 1.4, D - 1.5, 2);
  },
  civic(b, L) {
    const { W, D } = b, mc = METAL.brass; b.ex = 8.5;
    b.wy('lobby.panel', .5, { kind: 'flags', w: 3 }).wy('lobby.stairs', 4, { c: '#b89a70', open: true, arch: true, rail: mc, text: 'UP' }).wy('lobby.sconce', 5.5, { kind: 'fan' })
      .wy('generic.doorway', 6, { w: 2, c: '#8a5a3a', dark: '#5a3a28' }, { tags: ['lobby_door'], label: 'Council Chamber', text: 'The Council is in session. Through the door: a gavel, a cough, and a forty-minute debate about duck pond signage.' }).wy('lobby.sconce', 8, { kind: 'fan' })
      .wy('lobby.board', 9, { kind: 'cork', w: 2.5, seed: 7 }).wy('lobby.lift', 12, { style: 'deco', floor: 2 }).wy('lobby.restroom', 14.5, { dc: '#8a5a3a', c: '#5a4030' });
    b.wx('lobby.panel', 1, { kind: 'marble', w: 2, c: '#e8dcc0', c2: mc }).wx('lobby.board', 3.5, { kind: 'felt', w: 2, title: 'OFFICES', seed: 4 }).wx('generic.picture', 6, { kind: 3, w: 1.5, c: mc }).wx('generic.clock', 8, { c: mc, h: 3, m: 40 });
    b.staff('lobby.desk', 2, 2.5, { style: 'marble', w: 3, name: 'TOWN HALL', a: mc }, { label: 'Information desk' });
    b.staff('bank.teller', 12, 3.5, {}, { tags: ['lobby_desk'], label: 'Permits & Licences' }); b.f('generic.queuepost', 12.5, 5, { n: 2, kind: 'belt', c: '#b8342e' });
    b.f('lobby.inlay', 6.5, 3.5, { kind: 'compass', w: 4, d: 4, c: '#2f3f72', c2: '#e8dcc0', c3: '#b8342e' });
    for (const [x, y] of [[5, 3], [11, 3], [5, 7], [11, 7]]) b.f('lobby.column', x, y, { kind: 'marble', h: 3 });
    b.seat('generic.bench', 1.5, 6.5, { c: '#8a5a3a' }, null, 1); b.seat('generic.bench', 3, 6.5, { c: '#8a5a3a' }, null, 1); b.seat('generic.bench', 12, 7, { c: '#8a5a3a' }, null, 1); b.seat('generic.bench', 13.5, 7, { c: '#8a5a3a' }, null, 1);
    b.f('lobby.chandelier', 8, 2, { kind: 'crystal' }); b.f('lobby.chandelier', 8, 6, { kind: 'crystal' });
    b.f('generic.plant', W - .5, D - 1, { kind: 'palm', s: 1.5, pot: mc }); b.f('generic.plant', 0, D - 1, { kind: 'palm', s: 1.5, pot: mc });
    b.s(13, 1.1, 3); b.s(13.5, 5.9, 3); b.s(7, 1.2, 1, 'phone'); b.s(3.5, 4.3, 3); b.s(.8, 4.6, 2);
  },
};

export function lobbyRoom(L) {
  const fs = String(L.f || '').split(/\s+/).filter(Boolean); L.has = k => fs.includes(k); L.c = L.c || {};
  const b = builder(L), C = L.c; (LAY[L.style] || LAY.walkup)(b, L);
  const ex = L.mir ? L.w - b.ex : b.ex, res = L.kind === 'res';
  return {
    id: L.id, name: res ? L.name + ' — Lobby' : L.name, w: L.w, d: L.d, lobby: L, music: res || L.style === 'civic' ? 'quiet' : 'office', floor: GT[C.fl || 'f_tile'], floors: b.floors,
    wall: { color: C.wc || '#e9e4da', pattern: C.wp || 'plain', color2: C.w2, trim: C.wt || '#5a4a3a', h: C.h || (res ? 2.8 : 3.1), rail: C.rail0 },
    items: b.items, exits: [{ x: ex, y: L.d - .5, label: 'Exit to the street', poi: 'door:' + L.id }], npcSpots: b.npc, setup,
  };
}

/* ---------------- interactions ---------------- */
const pickN = (arr, n, seed) => { const a = arr.slice(), o = []; let s = seed * 7919 + 13; while (o.length < n && a.length) { s = (s * 16807 + 11) % 2147483647; o.push(a.splice(s % a.length, 1)[0]); } return o; };
const SURNAMES = ['Abernathy', 'Okafor', 'Lindqvist', 'Marchetti', 'Nakamura', 'Delacroix', 'Brandt', 'Oyelaran', 'Pham', 'Kowalski', 'Haddad', 'Fitzgerald', 'Castellanos', 'Bergström', 'Iyer', 'Mbeki', 'Novak', 'Quinn', 'Rosenthal', 'Tanaka', 'Vasquez', 'Whitlock', 'Yilmaz', 'Zielinski', 'Achterberg', 'Moreau', 'Singh', 'Petrov'];
const COMPANIES = ['Halyard & Co. Accountants', 'Bluefin Logistics', 'Maple Ledger', 'Gullwing Design', 'Northlight Architects', 'Pennywhistle Games', 'Saltmarsh Legal', 'Driftwood Capital', 'Kite & Anchor Media', 'Orchard Street Dental', 'Tidepool Software', 'Brass Lantern Publishing', 'Fathom Analytics', 'Wren & Sparrow Travel', 'Copperline Engineering', 'Lighthouse Recruitment', 'Bay Area Surveyors', 'Mossback Insurance Brokers', 'Second Tuesday Consulting', 'Plum Street Podcasts', 'Quarterdeck Shipping', 'Heron Translation Bureau', 'Starboard Robotics', 'Paper Kite Advertising'];
const NOTICES_RES = ['LOST: one grey sock, sentimental value. Flat 3.', 'Whoever keeps watering the plastic fern: thank you, but it is plastic.', 'Piano lessons, all ages. Knock twice on 2B. Not before ten.', 'Bins go out THURSDAY. This is the fourth notice. — the Management', 'FOUND: a very calm tortoise on the second-floor landing. Describe him to claim him.', 'Building potluck on the roof, Saturday. Bring a dish and a chair.', 'To the person practising the trumpet: you are improving. Slowly. — 4A', 'Free to a good home: one sofa, mustard, has opinions.', 'The lift is not broken. It is resting. — the Management', 'Knitting circle Wednesdays in the lobby. Beginners welcome, gossip mandatory.', 'Please stop feeding the gull on the fire escape. His name is Gerald and he is on a diet.', 'Bicycle left in the hall since March will be adopted by the building on the 1st.', 'Babysitter available evenings. References: every parent on floor three.', 'Somebody\'s parcel has been "arriving today" for nine days. Solidarity.'];
const NOTICES_OFF = ['Fire drill Thursday at 10:00. Yes, you have to actually go outside.', 'The 9th-floor fridge will be emptied on Friday. Label your yoghurt or lose your yoghurt.', 'Lunchtime running club meets by the fountain. Pace: conversational. Conversation: mostly complaints.', 'Lift 2 is being serviced. Lift 1 is being brave.', 'Charity bake sale in the lobby on Wednesday. Karen from Accounts is defending her title.', 'Lost: one access badge, photo of a man who looks tired. Return to security.', 'Reminder: the revolving door is not a ride.', 'Yoga in the atrium, Mondays 12:30. Mats provided. Dignity not guaranteed.', 'Visitor parking is for visitors. You know who you are, blue hatchback.', 'New coffee machine on 6. Please do not ask it for "the usual". It does not know you yet.'];
const DESK_LINES = {
  Concierge: ['Good day. Visiting someone? I shall need a name, and ideally the right one.', 'The lift is temperamental but loyal. Rather like me.', 'Parcels are on the shelf. If it rattles, it is probably for Flat 6.'],
  Doorman: ['Afternoon. Residents upstairs, visitors by invitation, pigeons never.', 'Thirty years on this door. I have seen every kind of umbrella.', 'Mind the step. It has been there since 1924 and it still surprises people.'],
  Porter: ['Hello there! Looking for somebody? The buzzer panel has all the names.', 'Sunny Court, sunny people. Mostly. Flat 9 is working on it.'],
  Reception: ['Welcome. Do you have an appointment? No? Then you have a lovely lobby to enjoy.', 'The directory is on the wall. Lifts are for badge holders, I am afraid.', 'You can wait on the sofas as long as you like. The magazines are from this decade, mostly.'],
  'Security desk': ['Badge holders through the gates. Everyone else: the sofas are very comfortable.', 'I watch nine screens. Eight of them are the car park.', 'No badge, no lift. It is not personal. It is laminated policy.'],
  'Front office': ['Deliveries round the back, visitors sign in here, hard hats beyond that door.', 'Shift change is at four. Until then it is just me and the vending machine.'],
  'Community desk': ['Welcome to Shed 5! Day passes are for members\' guests, but the Bean Bar is open to everybody.', 'Hot desks upstairs, quiet pods at the back, table tennis wherever it ends up.'],
  'Harbor desk': ['Harbor Authority. Mooring permits, tide tables, lost anchors. Mostly lost anchors.', 'High water at ten past six. Do not let anyone tell you different.'],
  'Information desk': ['Welcome to Town Hall. Permits to your right, council chamber straight ahead, patience is self-service.', 'Dog licences, market pitches, noise complaints about trumpets. We do it all.'],
  'Permits & Licences': ['Take a number. ...We are out of numbers. Take a seat instead.', 'Form 27B is for market stalls. Form 27C is for complaining about Form 27B.'],
};
const worksHere = L => { try { const j = G.jobs && G.jobs.current && G.jobs.current(); return !!(j && L.venue && j.venue === L.venue); } catch (e) { return false; } };
const livesHere = L => { try { const h = G.housing && G.housing.current && G.housing.current(); return !!(h && L.homeId && h.id === L.homeId); } catch (e) { return false; } };
const need = (k, d) => { try { if (G.needs && G.needs.add) G.needs.add(k, d); } catch (e) { } };
const tenants = L => L.tenants || (L.tenants = pickN(COMPANIES, 5 + L.n % 3, L.n));
const residents = L => L.residents || (L.residents = pickN(SURNAMES, 6 + L.n % 4, L.n + 5));
const only = fn => (fx, scene) => { const L = scene.def && scene.def.lobby; return L ? fn(fx, scene, L) : null; };

function setup(scene) {
  // restroom doors: tagged `toilet` for the bladder/toilet activity; until something claims the tag, give them a small real use
  for (const fx of scene.fixtures) {
    if (!fx.tags.includes('lobby_restroom') || scene.interactables.some(it => it.fx === fx)) continue;
    scene.interactables.push({ x: fx.x, y: fx.y, h: 1.4, spot: fx.use || undefined, fx, label: 'Restroom', use: () => G.startActivity({ label: 'Using the restroom', anim: 'stand', minutes: 4, done: () => { need('bladder', 100); need('hygiene', 6); toast('Much better. The hand dryer sounded like a small jet.', 'good', 2600); } }) });
  }
}
async function coffee(L, fx) {
  const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n), menu = [['Espresso', 3, 14, 3], ['Flat white', 4, 12, 5], ['Hot chocolate', 4, 4, 9], ['Cinnamon bun', 3, 0, 6, 14]];
  const pick = await choose(fx.item.label || 'Coffee kiosk', menu.map((m, i) => ({ label: m[0], sub: fmt(m[1]), value: i, disabled: !!(G.money && G.money.canAfford && !G.money.canAfford(m[1])) })).concat([{ label: 'Never mind', value: -1 }]), { text: 'A little kiosk in the corner of the lobby. It smells better than the whole rest of the building.' });
  const m = pick !== null && pick >= 0 && menu[pick]; if (!m) return; if (G.money && G.money.pay && !G.money.pay(m[1], m[0] + ' — ' + L.name, { category: 'food' })) return;
  G.emit('lobby:coffee', L.id, m[0]);
  G.startActivity({ label: 'Having a ' + m[0].toLowerCase(), anim: 'stand', minutes: 6, done: () => { if (m[2]) need('energy', m[2]); need('fun', m[3]); if (m[4]) need('hunger', m[4]); toast(m[0] + ': gone. Worth every cent.', 'good', 2400); } });
}
export function init() {
  registerFixture('lobby_lift', only((fx, sc, L) => fx.item.gated ? null : { label: L.kind === 'res' ? 'Lift' : 'Lifts', use: () => {
    if (L.kind === 'res') toast(livesHere(L) ? 'Home is upstairs. (Use your own front door to go in.)' : 'Residents only. The lift listens for a key you do not have.', 'info', 3000);
    else toast(worksHere(L) ? 'Your badge beeps green. Your desk is waiting upstairs.' : 'Staff only — you don\'t work here.', 'info', 3000);
  } }));
  registerFixture('lobby_gate', only((fx, sc, L) => ({ label: 'Security gates', use: () => toast(worksHere(L) ? 'Your badge beeps green. Morning!' : 'Staff only — you don\'t work here. The gate blinks red, politely.', 'info', 3000) })));
  registerFixture('lobby_stairs', only((fx, sc, L) => ({ label: 'Stairs', use: () => toast(L.kind === 'res' ? (livesHere(L) ? 'Up you go... (use your own front door to go in.)' : 'Residents only upstairs. Somebody up there is frying onions.') : L.style === 'civic' ? 'Upstairs: Planning, Parks, and a room nobody has found the key to since 1987.' : 'Staff only beyond this point.', 'info', 3200) })));
  registerFixture('lobby_mail', only((fx, sc, L) => ({ label: 'Mailboxes', use: () => { const r = residents(L); say([{ who: L.name, text: 'Rows of little doors with little names: ' + r.slice(0, 5).join(', ') + '... ' + (livesHere(L) ? 'Yours is empty. Probably for the best.' : 'None of them is yours.') }]); } })));
  registerFixture('lobby_buzzer', only((fx, sc, L) => ({ label: 'Buzzer panel', use: () => { const r = residents(L); toast('Flat 1: ' + r[0] + ' · Flat 2: ' + r[1] + ' · Flat 3: ' + r[2] + ' ... You do not know anyone here well enough to buzz.', 'info', 3600); } })));
  registerFixture('lobby_board', only((fx, sc, L) => {
    const k = (fx.item.p && fx.item.p.kind) || 'cork';
    if (k === 'felt' || k === 'digital') return { label: L.style === 'civic' ? 'Departments' : L.kind === 'res' ? 'Residents' : 'Directory', use: () => { const t = L.style === 'civic' ? ['Mayor\'s Office', 'Planning & Permits', 'Parks & Ponds', 'Registry of Births, Boats & Bicycles', 'Lost Property (lost, currently)'] : tenants(L); say([{ who: L.name + ' — Directory', text: t.map((n, i) => 'Floor ' + (2 + i * (1 + L.n % 3)) + ': ' + n).join('\n') }]); G.emit('lobby:directory', L.id); } };
    if (k === 'safety') return { label: fx.item.p.title === 'TIDES' ? 'Tide tables' : 'Safety board', use: () => toast(fx.item.p.title === 'TIDES' ? 'High water 06:10 and 18:32. Small craft warning: none. Gull warning: permanent.' : '412 days without a lost-time incident. Somebody has drawn a tiny party hat on the 4.', 'info', 3400) };
    return { label: 'Notice board', use: () => { const day = (G.now && G.now().day) || 0, pool = L.kind === 'res' ? NOTICES_RES : NOTICES_OFF, three = pickN(pool, 3, L.n * 31 + day); const key = 'nb' + day; if (!sc[key]) { sc[key] = 1; need('fun', 4); } G.emit('lobby:notices', L.id); say(three.map(t => ({ who: 'Notice board', text: t }))); } };
  }));
  registerFixture('lobby_desk', only((fx, sc, L) => { const label = fx.item.label || 'Front desk'; return { label, use: () => { const lines = DESK_LINES[label] || DESK_LINES.Reception; say([{ who: label, text: lines[Math.floor(Math.random() * lines.length)] }]); } }; }));
  registerFixture('lobby_packages', only((fx, sc, L) => ({ label: 'Parcels', use: () => toast(livesHere(L) ? 'Nothing for you today.' : 'Parcels for ' + residents(L)[1] + ', ' + residents(L)[3] + ' and one addressed only to "The Cat".', 'info', 3000) })));
  registerFixture('lobby_coffee', only((fx, sc, L) => ({ label: fx.item.label || 'Coffee kiosk', use: () => coffee(L, fx) })));
  registerFixture('lobby_door', only((fx, sc, L) => ({ label: fx.item.label || 'Door', use: () => toast(fx.item.text || 'Staff only.', 'info', 3800) })));
  registerFixture('lobby_books', only(() => ({ label: 'Law library', use: () => toast('Maple Bay Bylaws, volumes 1 to 46. Volume 12 is entirely about hedges.', 'info', 3000) })));
}
