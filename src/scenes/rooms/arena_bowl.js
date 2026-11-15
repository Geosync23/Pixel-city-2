// Maple Bay Arena — the bowl (`arena:bowl`, 31 x 23). Court in the middle, tiered stands north + west (8 rows each), low risers south, the team tunnel in the
// north-east corner, the jumbotron (two live canvas faces) over centre court. One room, four floors: hardwood (games), stage + standing floor (concerts),
// ice (Maple Bay on Ice) and dirt (Mini Monster Truck Mayhem). Everything on show is a pure function of the clock (G.state.t against the event's T0),
// so walking in late, fast-forwarding or loading a save made mid-game all land in the right place.
//   The crowd: every seat of every row is a fan record; each row of a stand is ONE entity whose sprite is a canvas the room repaints (4 rows a frame) from
//   cached character sprites, so a full house of ~560 animated fans costs 22 sprites. Fans walk in along their row, sit, eat, cheer, do the wave, and leave.
//   scene.arena = { mode 'idle'|'game'|'concert'|'ice'|'trucks', ph, sync(), fansIn(), state(), seat(id), sit(seat, opts), mySeat(), ff(on), cheer(kind), pass (may walk on the floor),
//     contest: { start(), shot(q) -> Promise }, mascot: { start(), move(i), end() }, tee(target) (fire one T-shirt), jumbo(o, sec) (override the scoreboard), mood, actors, rows }
//   Exports for the sim: SEATS (every seat: { id, st, k, i, x, y, z, dir, tier, spot, label }), seatsOf(tier), seatById(id), BOWL_ENTRY.
// Fixture tags handled here: arena_balls (shoot hoops on a quiet day), arena_btunnel (team tunnel), arena_seat (courtside chairs, quiet days).
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { Char, charArt } from '../../core/char.js';
import { pixSprite, assetSprite } from '../../engine/sprites.js';
import { asset } from '../../art/registry.js';
import * as R from '../../engine/raster.js';
import { defineRoom, registerFixture } from '../interior.js';
import { toast, bubble } from '../../ui/kit.js';
import { caption } from '../../ui/goals.js';
import { specs } from './_airport_life.js';
import { sfx, unlock, play, note, AU } from '../../sim/_shows_audio.js';
import { mk, setP, by } from './arena.js';
import { JW, JH, paintJumbo, charSprite } from './arena2.js';
import { BOWL, COURT as C, STANDS, rowGeo, seatXs, floorPx, mascot } from '../../art/showpiece/_arena_lib.js';
import { ARENA_VENUES, ARENA_HOURS, TEAM, ROSTER, TUNE, gameAt, LINES, CHANTS, ADS, FAMILY } from '../../data/arena.js';

const O = 1, pick = a => a[Math.floor(Math.random() * a.length)], h2 = R.hash2, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = t => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
const AR = () => G.arena, safe = fn => { try { return fn(); } catch (e) { return undefined; } };
const W = BOWL.W, D = BOWL.D, ROWN = 'ABCDEFGH';
export const BOWL_ENTRY = { x: 15.6, y: 21.6 };

/* ---------- seats (room coordinates) ---------- */
export const SEATS = [];
for (const st of STANDS) { const xs = seatXs(st.len, st.aisles); for (let k = 0; k < st.rows; k++) { const g = rowGeo(st, k), cr = st.face === 3 ? .3 : .27;
  xs.forEach((a, i) => { const x = st.axis === 'x' ? st.x0 + a : g.o + cr, y = st.axis === 'x' ? g.o + cr : st.y0 + a, tier = st.id[0] === 'S' ? 'lower' : k < 5 ? 'lower' : 'nose';
    SEATS.push({ id: st.id + k + '_' + i, st: st.id, k, i, a, x, y, z: g.z + .2, dir: st.face, tier, label: `Section ${st.sec}${st.id === 'S2' ? 'B' : ''}, Row ${ROWN[k]}, Seat ${i + 1}`,
      spot: st.id === 'N' ? { x, y: 7.25 } : st.id === 'W' ? { x: 7.25, y } : { x, y: 18.2 } }); }); } }
const CHAIRS = [{ x: 9.5, y: 17, n: 9, rev: 1 }, { x: 17, y: 17, n: 9, rev: 1 }, { x: 25.5, y: 9, n: 6, rev: 1, flip: 1 }, { x: 25.5, y: 13, n: 6, rev: 1, flip: 1 }];
CHAIRS.forEach((c, ci) => { for (let i = 0; i < c.n; i++) { const x = c.flip ? c.x + .25 : c.x + i * .6 + .3, y = c.flip ? c.y + i * .6 + .3 : c.y + .25; SEATS.push({ id: 'C' + ci + '_' + i, st: 'C' + ci, k: 0, i, x, y, z: .42, dir: c.flip ? 2 : 3, tier: 'court', label: `Courtside ${c.flip ? 'East' : 'South'}, Seat ${ci * 10 + i + 1}`, spot: c.flip ? { x: c.x - .35, y } : { x, y: c.y - .35 } }); } });
const SEAT_BY = Object.fromEntries(SEATS.map(s => [s.id, s]));
export const seatsOf = tier => SEATS.filter(s => s.tier === tier);
export const seatById = id => SEAT_BY[id] || null;

/* ---------- the room definition ---------- */
const M = mk();
(function build() {
  const A = M.A.bind(M), WY = M.WY.bind(M), WX = M.WX.bind(M);
  WY('bowlwall', 0, { w: 9, kind: 'banners' }, { bn: 1 }); WY('bowlwall', 9, { w: 8, kind: 'suite', text: 'DOCKSIDE DOGS', seed: 3 }); WY('bowlwall', 17, { w: 7.5, kind: 'press', text: 'BAY COAST LEAGUE' }); WY('bowlwall', 24.5, { w: 6.5, kind: 'tunnel' }, { tags: ['arena_btunnel'] });
  WX('bowlwall', 0, { w: 8, kind: 'suite', text: 'OTTER POP SODA', seed: 8 }); WX('bowlwall', 8, { w: 7, kind: 'banners' }); WX('bowlwall', 15, { w: 8, kind: 'suite', text: 'RIDE THE LIGHT RAIL', seed: 5 });
  for (const st of STANDS) for (let k = 0; k < st.rows; k++) { const g = rowGeo(st, k), p = { len: st.len, z: g.z, rise: st.rise, aisles: st.aisles, alt: k % 2, sec: 1, rev: st.face === 3 ? 1 : 0, last: st.face === 3 && k === st.rows - 1 ? 1 : 0, text: st.id === 'S' ? 'LET\'S GO OTTERS' : 'MAPLE BAY ARENA' };
    if (st.axis === 'x') A('tier', st.x0, g.o, p, { tier: st.id + k }); else A('tier', g.o, st.y0, p, { flip: true, tier: st.id + k }); }
  A('hoop', C.x0 - 1.5, C.cy - .5, {}, { game: 1, hoop: 0 }); A('hoop', C.x1 + .5, C.cy - .5, { e: 1 }, { game: 1, hoop: 1 });
  A('bench', 9.5, 7.5, { n: 6, c: TEAM.c }, { game: 1, bench: 0 }); A('table', C.cx - 2.5, 7.5, { w: 5, text: 'OTTERS' }, { game: 1, table: 1 }); A('bench', 19, 7.5, { n: 6, c: '#3b6fd0' }, { game: 1, bench: 1 });
  CHAIRS.forEach((c, i) => A('chairs', c.x, c.y, { n: c.n, rev: 1, c: i < 2 ? '#30343f' : '#3a3f4e' }, { flip: !!c.flip, tags: ['arena_cseat'], chairs: i, game: i < 2 ? undefined : 1, court: 1 }));
  A('adboard', 24.5, 8.5, { w: 3.6, text: 'OTTER POP' }, { flip: true, game: 1, ad: 0 }); A('adboard', 24.5, 12.5, { w: 3.6, text: 'MAPLECAB' }, { flip: true, game: 1, ad: 1 });
  A('camera', 24, 7, {}, { game: 1 }); A('camera', 7.5, 19); A('ballrack', 1.5, 19.5, {}, {}); A('cannon', 26.5, 17.5, {}, { cannon: 1 }); A('spot', 29.5, 20.5, { on: 1 });
  A('jumbo', 13, 9.5, {}, { z: 6.5, solid: false });
  // concert kit (hidden until a concert)
  A('stage', C.x0, C.cy - 4, {}, { concert: 1, stage: 1 }); A('stageprop', 9, 12, { kind: 'drums' }, { z: 1, concert: 1, solid: false }); A('stageprop', 10, 9.5, { kind: 'keys' }, { z: 1, concert: 1, solid: false, flip: true }); A('stageprop', 9, 15, { kind: 'amp' }, { z: 1, concert: 1, solid: false, flip: true }); A('stageprop', 12, 12.5, { kind: 'mic' }, { z: 1, concert: 1, solid: false });
  // monster-truck kit
  A('ramp', 12.5, 11.5, {}, { trucks: 1, solid: false }); A('scrapcar', 15, 12, { c: '#5a8ac8' }, { trucks: 1, solid: false }); A('scrapcar', 17, 12, { c: '#c86a4a', flat: 1 }, { trucks: 1, solid: false }); A('scrapcar', 19, 12, { c: '#6aa85a', flat: 1 }, { trucks: 1, solid: false });
})();

const PO_SEAT = { seated: true }, FPS = { walk: 7, run: 10, stand: 1.2, talk: 4, dance: 6, eat: 3, drink: 2, wave: 5, cheer: 5, phone: .8, sit: .5, work: 4 };
const WALK = .7; // world minutes a fan takes to shuffle along the row
const OFF = [[5.6, 0], [4.4, -2.9], [4.4, 2.9], [1.9, -1.7], [1.5, 1.5]];
const spotFor = (E, role, slot, pi) => { let u = OFF[slot][0] + (h2(pi, slot, 3) - .5) * .9, v = OFF[slot][1] + (h2(pi, slot, 4) - .5) * .9; if (role) { u = u * .7 + .2; v *= .76; } const bx = E > 0 ? C.x1 - C.rim : C.x0 + C.rim; return [bx - E * u, C.cy + v]; };
const endOf = (tm, q) => ((tm === 0) === (q < 2) ? 1 : -1);

defineRoom({ id: 'arena:bowl', name: 'Maple Bay Arena: the Bowl', w: W, d: D, zoom: 0, music: 'none', noCrowd: true, showpiece: 'arena', venue: ARENA_VENUES.place,
  floor: GT.f_stone, bg: '#0e1018', edge: '#262a36', wall: { color: '#232838', trim: '#3a4058', h: 9.5 },
  exits: [{ x: BOWL_ENTRY.x, y: 22.4, label: 'To the concourse', use: () => G.go('int:arena', { x: O + 8.5, y: O + 3.6, dir: 1 }) }], spawn: { x: BOWL_ENTRY.x, y: BOWL_ENTRY.y, dir: 3 }, items: M.items, npcSpots: [],
  setup(sc) {
    const Wd = sc.world; Wd.zmax = 13; const A_ = charArt(), P = specs(), grp = k => by(Wd, k);
    const banner = grp('bn')[0], stageOb = grp('stage')[0], ads = grp('ad'), tableOb = grp('table')[0], cannonOb = grp('cannon')[0];
    let floor = 'court', fpx = floorPx('court');
    Wd.decal({ x0: O, y0: O, x1: O + W, y1: O + D, draw(Rr) { Rr.qz(O, O + W, O, O + D, 0, (x, y) => fpx(x - O, y - O)); } }); Wd.version++;
    const setGroup = (k, on) => { for (const o of grp(k)) { if (o.hidden === !on) continue; o.hidden = !on; if (o.solid) { if (on) Wd.block(o.B[0], o.B[1], o.B[3], o.B[4]); else Wd.free(o.B[0], o.B[1], o.B[3], o.B[4]); } } };
    const setFloor = m => { if (m === floor) return; floor = m; fpx = floorPx(m); Wd.version++; };
    setGroup('concert', false); setGroup('trucks', false);

    /* ---------- fans ---------- */
    const mkPool = (n, seed, o) => { const r = R.rng(seed), out = []; for (let i = 0; i < n; i++) { const s = Object.assign({}, A_.randomSpec(r, Object.assign({ season: G.now().season }, o && o.age ? { age: o.age } : null))); s.bag = null; const k = r(); if (o && o.c && k < (o.p || .6)) { s.topColor = k < .12 ? o.c2 : o.c; if (k < .3) { s.top = 'tee'; } if (r() < .25) { s.hat = 'cap'; s.hatColor = o.c; } if (r() < .12) s.scarf = o.c2; } out.push(s); } return out; };
    const POOL = { home: mkPool(34, 77, { c: TEAM.c, c2: TEAM.c2, p: .62 }), kid: mkPool(8, 78, { c: TEAM.c, c2: TEAM.c2, p: .7, age: 'kid' }), away: [], any: mkPool(30, 79, null) }; let awayKey = '';
    const rows = [];
    const mkRow = (id, axis, x0, y0, len, z, dir, seats, cross) => {
      const cv = document.createElement('canvas'); cv.width = Math.ceil(len * 16) + 64; cv.height = Math.ceil(len * 8) + 76; const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
      const ox = axis === 'x' ? -32 : -Math.ceil(len * 16) - 32, oy = -50, spr = { c: cv, l: null, x: ox, y: oy, w: cv.width, h: cv.height };
      const ent = { x: O + x0, y: O + y0, z, bb: axis === 'x' ? [0, 0, len, .05, 1.5] : [0, 0, .05, len, 1.5], hidden: true, sprite: () => spr };
      const r = { id, axis, len, dir, cross, cv, ctx, ox, oy, ent, fans: [], dirty: true, any: false }; sc.ents.push(ent); rows.push(r); return r;
    };
    for (const st of STANDS) for (let k = 0; k < st.rows; k++) { const g = rowGeo(st, k), r = mkRow(st.id + k, st.axis, st.axis === 'x' ? st.x0 : g.o, st.axis === 'x' ? g.o : st.y0, st.len, g.z, st.face, null, st.face === 3 ? .3 : .27); r.stand = st; r.k = k; r.entry = st.aisles.length ? st.aisles.map(a => (a[0] + a[1]) / 2) : [st.id === 'S' ? st.len + .2 : -.2];
      for (const s of SEATS) if (s.st === st.id && s.k === k) r.fans.push({ seat: s, a: s.a, id: rows.length * 100 + s.i, ph: h2(s.i, rows.length, 1), exc: h2(s.i, rows.length, 2), roll: h2(s.i, rows.length, 3), s: 0, team: 0, on: false, ta: 0, tl: 0, wv: st.id === 'W' ? (1 - s.a / st.len) * .34 : st.id === 'N' ? .34 + s.a / st.len * .66 : -1 }); }
    // the standing floor (concerts): rows across the court, facing the stage in the west
    const floorRows = []; for (let k = 0; k < 11; k++) { const x = 13.8 + k * .86, r = mkRow('F' + k, 'y', x, C.y0 + .15, C.y1 - C.y0 - .3, 0, 2, null, .1); r.floor = true; r.k = k; for (let i = 0; i < 13; i++) { const a = .35 + i * .59 + (h2(i, k, 9) - .5) * .25; r.fans.push({ seat: null, a, id: 9000 + k * 20 + i, ph: h2(i, k, 21), exc: h2(i, k, 22), roll: h2(i, k, 23), s: 0, team: 2, on: false, ta: 0, tl: 0, wv: -1, cx: (h2(i, k, 24) - .5) * .3 }); } floorRows.push(r); }
    const courtFans = []; // courtside chairs are real characters
    for (const s of SEATS) if (s.tier === 'court') { const c = new Char(POOL.home[0], O + s.x, O + s.y); c.z = s.z; c.dir = s.dir; c.pose = 'sit'; c.poseOpts = PO_SEAT; c.hidden = true; c.seat = s; c.roll = h2(s.i, 5, s.x * 10 | 0); c.exc = h2(s.i, 6, 2); c.kind = 'customer'; sc.ents.push(c); courtFans.push(c);
      sc.interactables.push({ ent: c, x: c.x, y: c.y, label: 'Fan', h: 1.1, hit: 6, range: 1.7, visible: () => !c.hidden, use: () => bubble(c, pick(st_.mode === 'concert' ? LINES.concert : st_.mode === 'game' ? LINES.fan : LINES.family)) }); }
    const mood = { cheerT: 0, cheerI: 0, awayT: 0, standT: 0, waveT: -99, clapT: 0, groanT: 0, beat: 0 };
    let myId = null, evKey = '';
    function seed(ev) { // who is in which seat for this event
      const big = ev.big, fill = ev.kind === 'game' ? (big ? 1 : .84) : ev.kind === 'concert' ? (big ? .98 : .88) : .7, opp = ev.opp, margin = ev.kind === 'game' ? Math.abs(ev.game.final[0] - ev.game.final[1]) : 0, lost = ev.kind === 'game' && !ev.game.won;
      if (opp && awayKey !== opp.id) { awayKey = opp.id; POOL.away = mkPool(10, 80 + opp.id.charCodeAt(0), { c: opp.c, c2: opp.c2, p: .85 }); }
      const kids = ev.kind === 'ice' || ev.kind === 'trucks' ? .34 : .1, sd = (ev.T0 / 60) | 0;
      const set = (f, seat, stId, k) => { const r1 = h2(f.id, sd, 1), r2 = h2(f.id, sd, 2), r3 = h2(f.id, sd, 3);
        f.on = r1 < fill && !(seat && seat.id === myId) && !(ev.kind === 'concert' && stId === 'W'); if (!f.on) return;
        const away = opp && stId === 'N' && k >= 6 && seat.a > 17.2; f.team = away ? 1 : 0; const pool = away ? POOL.away : r2 < kids ? POOL.kid : ev.kind === 'game' || r2 > .6 ? POOL.home : POOL.any; f.pool = pool; f.s = Math.floor(r3 * pool.length) % pool.length;
        f.key = (away ? 'a' + opp.id : pool === POOL.kid ? 'k' : pool === POOL.home ? 'h' : 'n') + f.s; f.spec = pool[f.s];
        f.ta = -TUNE.DOORS + 2 + Math.pow(h2(f.id, sd, 4), .7) * (TUNE.DOORS - 2) + (h2(f.id, sd, 5) < .06 ? 6 : 0); f.tl = ev.len + (ev.kind === 'game' ? TUNE.FINAL * .5 : 1.5) + Math.pow(h2(f.id, sd, 6), 1.3) * (TUNE.OUT - 9) + (away ? 0 : 0);
        if (ev.kind === 'game' && (margin > 14 || lost) && h2(f.id, sd, 7) < (margin > 14 ? .18 : .06)) f.tl = ev.len - 3 - h2(f.id, sd, 8) * 9; f.food = h2(f.id, sd, 9) < .3; };
      for (const r of rows) { if (r.floor) { for (const f of r.fans) { f.on = ev.kind === 'concert' && h2(f.id, sd, 1) < (big ? 1 : .86); if (f.on) { f.pool = POOL.any; f.s = Math.floor(h2(f.id, sd, 3) * 30) % 30; f.key = 'n' + f.s; f.spec = POOL.any[f.s]; f.ta = -TUNE.DOORS + 1 + h2(f.id, sd, 4) * (TUNE.DOORS - 4) * (.3 + r.k / 14); f.tl = ev.len + 1 + h2(f.id, sd, 6) * 14; } } }
        else for (const f of r.fans) set(f, f.seat, r.stand.id, r.k); }
      for (const c of courtFans) { const f = c.fan || (c.fan = { id: 7000 + courtFans.indexOf(c) }); set(f, c.seat, 'C', 0); if (ev.kind === 'concert' || (ev.kind !== 'game' && c.seat.st > 'C1')) f.on = false; if (f.on) c.setSpec(f.spec); }
    }
    const fanAt = (f, w) => (!f.on || w < f.ta || w > f.tl + WALK ? -1 : w < f.ta + WALK ? (w - f.ta) / WALK : w > f.tl ? 1 - (w - f.tl) / WALK : 2); // -1 away, 0..1 walking in/out, 2 settled
    const fanAnim = (f, tr, live, seated) => {
      const home = f.team !== 1;
      if (st_.mode === 'concert') { if (!seated) { const b = mood.beat; return tr < mood.cheerT ? (f.exc > .3 ? 'cheer' : 'wave') : !b ? (f.exc > .8 ? 'talk' : 'stand') : f.exc > .78 ? 'cheer' : f.exc > .2 ? 'dance' : 'wave'; } return tr < mood.cheerT && f.exc > .3 ? 'cheer' : mood.beat && f.exc > .6 ? 'wave' : idle(f, tr); }
      if (tr < mood.standT && f.exc > (home ? .08 : 2)) return 'CHEER';
      if (home ? tr < mood.cheerT && f.exc > 1 - mood.cheerI : tr < mood.awayT && f.exc > .2) return f.exc > .9 ? 'CHEER' : 'cheer';
      if (home && f.wv >= 0 && tr - mood.waveT < 9) { const fr = ((tr - mood.waveT) * .28) % 1.2; if (Math.abs(f.wv - fr) < .045) return 'CHEER'; }
      if (tr < mood.clapT && f.exc > .5) return 'wave';
      return idle(f, tr);
    };
    const idle = (f, tr) => { const k = h2(f.id, Math.floor(tr / 5 + f.ph * 7), 11); return k < .6 ? 'sit' : k < .7 ? 'talk' : k < .78 ? 'phone' : k < .9 ? (f.food ? (k < .84 ? 'eat' : 'drink') : 'sit') : k < .93 ? 'wave' : 'sit'; };
    function paintRow(r, w, tr) {
      const x = r.ctx; x.clearRect(0, 0, r.cv.width, r.cv.height); let any = false; const axX = r.axis === 'x', N = r.fans.length;
      for (let n = 0; n < N; n++) { const f = r.fans[n], s = fanAt(f, w); if (s < 0) continue; any = true;
        let a = f.a, anim, dir = r.dir, seated = !r.floor, cr = r.cross + (f.cx || 0);
        if (s < 2) { let e = r.entry[0]; for (const q of r.entry) if (Math.abs(q - f.a) < Math.abs(e - f.a)) e = q; if (r.floor) { e = f.a; cr = r.cross + (1 - s) * (9 - r.k * .5); } a = lerp(e, f.a, s); anim = 'walk'; seated = false; const fwd = (f.a > e) === (w < f.ta + WALK + .01); dir = r.floor ? (w < f.ta + WALK + .01 ? 2 : 0) : axX ? (fwd ? 0 : 2) : (fwd ? 1 : 3); }
        else { anim = fanAnim(f, tr, true, seated); if (anim === 'CHEER') { anim = 'cheer'; seated = false; } }
        const nf = A_.ANIMS[anim] || 1, fr = Math.floor(tr * (FPS[anim] || 4) + f.ph * 9) % nf, sp = charSprite(f.key, f.spec, anim, fr, dir, seated ? PO_SEAT : null);
        const sx = axX ? (a - cr) * 16 : (cr - a) * 16, sy = (a + cr) * 8 - (seated ? 3 : 0);
        x.drawImage(sp.c, Math.round(sx + sp.x - r.ox), Math.round(sy + sp.y - r.oy + (seated ? 0 : r.floor ? 0 : 2)));
      }
      r.ent.hidden = !any; r.any = any;
    }

    /* ---------- jumbotron ---------- */
    const jc = document.createElement('canvas'); jc.width = JW; jc.height = JH; const jx = jc.getContext('2d');
    const mkFace = () => { const c = document.createElement('canvas'); c.width = JW + 2; c.height = JH + JW / 2 + 2; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }, [cl, xl] = mkFace(), [cR, xr] = mkFace();
    const jbx = 13 + O, jby = 9.5 + O, JZ = 6.65;
    // +y face (constant y, runs along +x: screen right-down) and +x face (constant x, runs along -y: screen right-up)
    const sprY = { c: cl, l: cl, x: 0, y: -JH - 1, w: cl.width, h: cl.height }, sprX = { c: cR, l: cR, x: 0, y: -JH - JW / 2 - 1, w: cR.width, h: cR.height };
    sc.ents.push({ x: jbx + .1, y: jby + 6.22, z: JZ, bb: [0, 0, 6, .05, 3], sprite: () => sprY }, { x: jbx + 6.22, y: jby + 6.1, z: JZ, bb: [0, -6, .05, 0, 3], sprite: () => sprX });
    const blitJ = () => { xl.setTransform(1, 0, 0, 1, 0, 0); xl.clearRect(0, 0, cl.width, cl.height); xl.setTransform(1, .5, 0, 1, 0, 1); xl.drawImage(jc, 0, 0); xr.setTransform(1, 0, 0, 1, 0, 0); xr.clearRect(0, 0, cR.width, cR.height); xr.setTransform(1, -.5, 0, 1, 0, JW / 2 + 1); xr.drawImage(jc, 0, 0); };
    let jOver = null, jUntil = 0, jT = 0, jState = { mode: 'idle' };

    /* ---------- actors ---------- */
    const mkc = (spec, hidden = true) => { const c = new Char(spec, O + 26.6, O + 2); c.hidden = hidden; c.tx = c.x; c.ty = c.y; c.sp = 6.5; sc.ents.push(c); return c; };
    const pspec = (p, tm) => (AR() ? AR().playerSpec(p, tm) : P.adult[0]);
    const homeP = ROSTER.map(p => { const c = mkc(pspec(p, TEAM)); c.pl = p; return c; }), awayP = Array.from({ length: 8 }, () => mkc(P.adult[1]));
    const refs = [0, 1].map(() => mkc(Object.assign({}, P.adult[5], { top: 'stripe', topColor: '#f4f0e8', accent: '#33303f', bottom: 'slacks', bottomColor: '#33303f', hat: null, bag: null })));
    const coaches = [mkc(Object.assign({}, P.staff[4], { top: 'suit', topColor: '#33303f', innerColor: '#f4f0e8', accent: TEAM.c, hat: null, hair: 'bob', hairColor: '#a9a9b4' })), mkc(Object.assign({}, P.staff[1], { top: 'suit', topColor: '#4a4a58', hat: null }))];
    const dancers = Array.from({ length: 6 }, (_, i) => mkc(Object.assign({}, P.adult[(i * 5 + 2) % P.adult.length], { top: 'tank', topColor: TEAM.c, bottom: 'skirt', bottomColor: TEAM.c2, hair: 'ponytail', hat: null, bag: null, age: 'adult', scarf: null })));
    const mc = mkc(Object.assign({}, P.staff[6], { top: 'suit', topColor: TEAM.c, innerColor: '#f4f0e8', hat: null })); const contestants = [mkc(POOL.home[3]), mkc(POOL.home[11]), mkc(POOL.kid[2])];
    const band = Array.from({ length: 4 }, (_, i) => mkc(P.adult[(i * 3 + 4) % P.adult.length])), skaters = Array.from({ length: 8 }, (_, i) => mkc(Object.assign({}, P.adult[(i * 7 + 1) % P.adult.length], { top: i === 0 ? 'coat' : 'dress', topColor: i === 0 ? '#2f3f72' : i < 3 ? '#f4f8fb' : i % 2 ? '#8fd0f0' : '#f2c230', bottom: i === 0 ? 'slacks' : 'leggings', bottomColor: i === 0 ? '#33303f' : '#f4f0e8', hat: i === 0 ? 'beanie' : null, hatColor: '#d2392f', scarf: i === 0 ? '#d2392f' : null, bag: null, age: 'adult', shoes: '#f0ece4' })));
    for (const c of homeP.concat(awayP, refs, dancers, band, skaters, contestants, [mc], coaches)) { c.bag = null; }
    const ollie = { x: O + 26, y: O + 16.6, z: 0, f: 0, hidden: true, tx: O + 26, ty: O + 16.6, sp: 4, bb: [-.3, -.3, .3, .3, 1.7], t: 0, bubbleH: 2.1, sprite() { return pixSprite('ollie' + this.f, [-12, -29, 12, 4], () => { const s = R.PW(0, 0, 0), X = Math.round(s[0]), Y = Math.round(s[1]); mascot((dx, dy, c) => R.px(X + dx, Y + dy, R.C(c)), this.f); }); } }; sc.ents.push(ollie);
    sc.interactables.push({ ent: ollie, x: ollie.x, y: ollie.y, label: 'Ollie the Otter', h: 1.6, hit: 10, range: 2, visible: () => !ollie.hidden && !st_.inSuit, use: () => { bubble(ollie, pick(['(enthusiastic otter noises)', '(Ollie high-fives you. It is surprisingly firm.)', '(Ollie points at you, then at the scoreboard, then flexes.)'])); safe(() => G.needs.add('fun', 2)); } });
    const ballSpr = f => pixSprite('aball' + f, [-3, -3, 3, 3], () => { const s = R.PW(0, 0, 0), X = Math.round(s[0]), Y = Math.round(s[1]); for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy < 6) R.px(X + dx, Y + dy, R.C(dx + dy < -1 ? '#f4a050' : dx + dy > 2 ? '#b85a20' : '#e0762c')); R.px(X + (f ? -1 : 1), Y, R.C('#6a3a1a')); R.px(X, Y + (f ? 1 : -1), R.C('#6a3a1a')); });
    const ball = { x: O + C.cx, y: O + C.cy, z: 1, hidden: true, bb: [-.1, -.1, .1, .1, .2], sprite() { return ballSpr(Math.floor(G.time * 8) & 1); } }; sc.ents.push(ball);
    const shadow = { x: ball.x, y: ball.y, z: 0.01, hidden: true, bb: [-.1, -.1, .1, .1, .02], sprite: () => pixSprite('aballsh', [-3, -2, 3, 2], () => { const s = R.PW(0, 0, 0); for (let dx = -2; dx <= 2; dx++) for (let dy = -1; dy <= 0; dy++) R.px(Math.round(s[0]) + dx, Math.round(s[1]) + dy, R.C('#2a1f4560')); }) }; sc.ents.push(shadow);
    const tees = Array.from({ length: 3 }, (_, i) => { const e = { x: 0, y: 0, z: 0, hidden: true, t: 0, bb: [-.1, -.1, .1, .1, .2], sprite: () => pixSprite('atee', [-3, -3, 3, 3], () => { const s = R.PW(0, 0, 0), X = Math.round(s[0]), Y = Math.round(s[1]); for (let dy = -2; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) R.px(X + dx, Y + dy, R.C(dy === -2 ? '#d2392f' : '#f4f0e8')); }) }; sc.ents.push(e); return e; });
    const conf = Array.from({ length: 46 }, (_, i) => { const col = [TEAM.c, TEAM.c2, '#f2c230'][i % 3], e = { x: 0, y: 0, z: 0, hidden: true, vz: 0, bb: [-.05, -.05, .05, .05, .1], sprite: () => pixSprite('aconf' + (i % 3) + (Math.floor(G.time * 6 + i) & 1), [-1, -1, 2, 2], () => { const s = R.PW(0, 0, 0); R.lit(() => { R.px(s[0], s[1], R.C(col)); if (Math.floor(G.time * 6 + i) & 1) R.px(s[0] + 1, s[1], R.C(col)); else R.px(s[0], s[1] + 1, R.C(col)); }); }) }; sc.ents.push(e); return e; });
    const truckA = safe(() => asset('veh.arena.minitruck')), TR = [['#d2392f', 'CRUSH'], ['#2f9a94', 'TIDAL'], ['#f2c230', 'MAULR'], ['#8a55c8', 'GULLT']];
    const trucks = TR.map(([c, name], i) => { const e = { x: O + C.cx, y: O + C.cy, z: 0, hidden: true, flip: false, dir: 1, i, bb: [-.9, -.5, .9, .5, 1.2], px: 0, py: 0, sprite() { return truckA ? assetSprite(truckA, { c, dir: this.dir, name }, this.flip) : null; } }; sc.ents.push(e); return e; });
    const marker = { x: 0, y: 0, z: 0, hidden: true, bb: [-.1, -.1, .1, .1, .3], sprite: () => pixSprite('amark' + (Math.floor(G.time * 3) & 1), [-4, -12, 5, 2], () => { const s = R.PW(0, 0, 0), X = Math.round(s[0]), Y = Math.round(s[1]) - (Math.floor(G.time * 3) & 1) * 2; R.lit(() => { for (let j = 0; j < 5; j++) for (let i = -(4 - j); i <= 4 - j; i++) R.px(X + i, Y - 6 + j, R.C(j === 0 ? '#fff2a8' : '#f2c230')); for (let j = 0; j < 3; j++) { R.px(X - 1, Y - 9 + j, R.C('#f2c230')); R.px(X, Y - 9 + j, R.C('#f2c230')); R.px(X + 1, Y - 9 + j, R.C('#f2c230')); } }); }) }; sc.ents.push(marker);
    const foam = { x: 0, y: 0, z: 0, hidden: true, up: 0, bb: [-.05, .21, .05, .26, .4], sprite() { const u = this.up ? Math.floor(G.time * 6) & 1 : 0; return pixSprite('afoam' + u + (this.up ? 1 : 0), [-3, -14, 9, 2], () => { const s = R.PW(0, 0, 0), X = Math.round(s[0]) + 3 + u, Y = Math.round(s[1]) - (this.up ? 3 : 0); for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 5; dx++) R.px(X + dx, Y - 5 + dy, R.C(dx === 0 || dy === 4 ? '#a82a26' : '#d2392f')); for (let dy = 0; dy < 5; dy++) { R.px(X + 2, Y - 10 + dy, R.C('#d2392f')); R.px(X + 3, Y - 10 + dy, R.C('#e8584a')); } R.px(X + 2, Y - 3, R.C('#f4f0e8')); R.px(X + 2, Y - 2, R.C('#f4f0e8')); }); } }; sc.ents.push(foam);
    const anchorN = { x: O + 12, y: O + 3, z: 3.2 }, anchorW = { x: O + 3, y: O + 12, z: 3.2 }, anchorS = { x: O + 9, y: O + 19.5, z: 1.4 }, anchorF = { x: O + 18, y: O + 12.5, z: .6 };
    const cam = { x: O + C.cx, y: O + C.cy, z: 1.2 };

    /* ---------- state ---------- */
    const st_ = sc.arena = { mode: 'idle', ph: 'none', ev: null, w: 0, house: 1, mood, rows, floorRows, actors: { homeP, awayP, refs, dancers, band, skaters, trucks, ollie, ball, mc, coaches }, pass: false, inSuit: false, mine: null, ffOn: false, watched: 0, sat: 0, log: [], speed: 1,
      seat: seatById, mySeat: () => (myId ? SEAT_BY[myId] : null), fansIn: () => { let n = 0; for (const r of rows) for (const f of r.fans) if (fanAt(f, st_.w) >= 0) n++; for (const c of courtFans) if (!c.hidden) n++; return n; },
      state: () => ({ mode: st_.mode, ph: st_.ph, w: Math.round(st_.w * 10) / 10, fans: st_.fansIn(), house: Math.round(st_.house * 100) / 100, floor, seated: !!st_.mine, jumbo: jState.mode, score: st_.ga ? st_.ga.score.slice() : null, q: st_.ga ? st_.ga.q : 0, gph: st_.ga ? st_.ga.ph : null, clock: st_.ga ? Math.round(st_.ga.clock) : 0, scene: st_.scene, song: st_.song, rate: G.busy ? G.busy.rate : G.state.speed }),
      jumbo(o, sec = 4) { jOver = o; jUntil = G.time + sec; }, cheer(kind) { const t = G.time; if (kind === 'stand') mood.standT = t + 3; else { mood.cheerT = t + 2; mood.cheerI = .5; } },
    };
    const snapAll = () => { for (const c of homeP.concat(awayP, refs, dancers, band, skaters, contestants, [mc], coaches)) c.snap = true; ollie.snap = true; for (const r of rows) r.dirty = true; };
    const chase = (c, dt) => { const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy); c.t += dt; if (c.snap || d > 16) { c.x = c.tx; c.y = c.ty; c.snap = false; c.moving = false; return; } if (d < .04) { c.moving = false; if (c.pose === 'run') c.pose = null; return; } const sp = (c.sp || 6) * (d > 5 ? 1.5 : 1), stp = Math.min(d, sp * dt); c.x += dx / d * stp; c.y += dy / d * stp; c.face(dx, dy); c.moving = true; if (!c.keepPose) c.pose = sp > 5 && d > .6 ? 'run' : null; };
    const to = (c, x, y) => { c.tx = O + x; c.ty = O + y; c.hidden = false; };
    const hideAll = L => { for (const c of L) c.hidden = true; };
    const say = (who, text, ms) => { if (G.scene === sc) caption(who, text, ms || 4200); };
    const chant = (text, anchor = anchorN) => { if (G.scene === sc) bubble(anchor, text, 2600, 'shout'); };
    const sfxA = (n, d, v) => { if (G.scene === sc && st_.speed < 2.5 && (!G.busy || G.busy.rate < 1.5)) safe(() => sfx(n, d, v)); };
    const buzz = () => { if (G.scene !== sc) return; safe(() => { const c = AU.ctx; if (!c || c.state !== 'running') return; const t = c.currentTime + .02; note('brass', 46, t, 1.1, 1.4); note('brass', 47, t, 1.1, 1.2); note('reed', 34, t, 1.1, 1.3); }); };

    /* ---------- the game ---------- */
    let evI = -1, homeRun = 0, lastPh = '', lastGph = '', teeN = 0, camDone = {}, introI = -1, warm = 0;
    const lu = (g, q) => { const p = g.poss.find(x => x.q === q); return p ? p.lu : [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4]]; };
    function benchAll(g, q, exceptCourt) { // seat everybody who is not on the floor
      const L = lu(g, q), bs = sc.fixtures.filter(f => f.item.bench !== undefined);
      [homeP, awayP].forEach((team, tm) => { const fx = bs.find(f => f.item.bench === tm); let bi = 0; team.forEach((c, i) => { if (exceptCourt && L[tm].includes(i)) { c.onCourt = true; c.slot = L[tm].indexOf(i); c.z = 0; c.poseOpts = null; c.keepPose = false; return; } c.onCourt = false; const s = fx && fx.seats[bi++]; if (s) { c.hidden = false; c.x = c.tx = s.x; c.y = c.ty = s.y; c.z = s.z; c.dir = 1; c.pose = 'sit'; c.poseOpts = PO_SEAT; c.keepPose = true; c.moving = false; } else c.hidden = true; }); });
    }
    const posOf = (tm, slot) => { const team = tm === 0 ? homeP : awayP; for (const c of team) if (c.onCourt && c.slot === slot) return c; return team[0]; };
    function playPossession(g, ga, dt) {
      const p = ga.p, i = ga.i, f = ga.f, E = endOf(p.tm, p.q), prev = i > 0 ? g.poss[i - 1] : null, same = !!prev && prev.tm === p.tm && prev.q === p.q, s = same ? 1 : ease(clamp(f / .36, 0, 1)), bx = E > 0 ? C.x1 - C.rim : C.x0 + C.rim;
      for (let tm = 0; tm < 2; tm++) { const off = tm === p.tm; for (let j = 0; j < 5; j++) { const c = posOf(tm, j), a = same ? spotFor(E, off ? 0 : 1, j, i - 1) : spotFor(-E, off ? 1 : 0, j, i - 1), b = spotFor(E, off ? 0 : 1, j, i); let x = lerp(a[0], b[0], s), y = lerp(a[1], b[1], s);
        if (p.kind === 'ft' && f > .12) { if (off && j === p.slot) { x = bx - E * 2.15; y = C.cy; } else { x = bx - E * (.5 + (j % 3) * .75); y = C.cy + (((j + tm) & 1) ? 1.55 : -1.55); } }
        else if (off && j === p.slot && f > .62 && (p.kind === 'two' || p.kind === 'dunk')) { const k = ease(clamp((f - .62) / .2, 0, 1)), u = p.kind === 'dunk' ? .45 : 1.7; x = lerp(x, bx - E * u, k); y = lerp(y, C.cy + (b[1] - C.cy) * (p.kind === 'dunk' ? .15 : .5), k); }
        else if (!off && j === p.slot && f > .6) { const sh = posOf(p.tm, p.slot); x = lerp(x, sh.x - O - E * -.7, .6); y = lerp(y, sh.y - O, .6); }
        else if (f > .4) { x += Math.sin(G.time * 2.3 + j * 1.7 + tm) * .25; y += Math.cos(G.time * 1.9 + j * 2.1) * .25; }
        c.tx = O + x; c.ty = O + y; c.hidden = false; c.z = off && j === p.slot && f > .74 && f < .95 && p.kind !== 'ft' && p.kind !== 'to' ? (p.kind === 'dunk' ? Math.sin(clamp((f - .74) / .2, 0, 1) * Math.PI) * 1.1 : Math.sin(clamp((f - .74) / .12, 0, 1) * Math.PI) * .35) : 0; } }
      // the ball
      const pg = posOf(p.tm, 0), as = posOf(p.tm, p.ast), sh = posOf(p.tm, p.slot), rim = [O + bx, O + C.cy, C.rimZ], hold = (c, zz) => { ball.x = c.x + (E > 0 ? .25 : -.25); ball.y = c.y + .12; ball.z = c.z + (zz === undefined ? .55 + Math.abs(Math.sin(G.time * 9)) * .45 : zz); }, fly = (a, b, k, arc) => { ball.x = lerp(a[0], b[0], k); ball.y = lerp(a[1], b[1], k); ball.z = lerp(a[2], b[2], k) + Math.sin(k * Math.PI) * arc; };
      const P3 = c => [c.x, c.y, c.z + 1.25];
      if (p.kind === 'to') { const df = posOf(1 - p.tm, p.ast); if (f < .5) hold(pg); else if (f < .64) fly(P3(pg), P3(df), (f - .5) / .14, .3); else hold(df); }
      else if (p.kind === 'ft') { const m1 = p.pts >= 1, m2 = p.pts >= 2, shot = (k, made) => { if (k < .7) fly(P3(sh), rim, k / .7, 1.3); else if (made) fly(rim, [rim[0], rim[1], .2], (k - .7) / .3, 0); else fly(rim, [rim[0] - E * 1.4, rim[1] + .9, 1.2], (k - .7) / .3, .5); }; if (f < .2) hold(sh, 1); else if (f < .5) shot((f - .2) / .3, m1); else if (f < .58) hold(sh, 1); else if (f < .9) shot((f - .58) / .32, m2); else hold(posOf(1 - p.tm, 4), 1); }
      else { const pass2 = p.ast === p.slot || p.ast === 0;
        if (f < .38) hold(pg); else if (f < .5) { if (p.ast === 0) hold(pg); else fly(P3(pg), P3(as), (f - .38) / .12, .25); } else if (f < .62) hold(p.ast === 0 ? pg : as); else if (f < .72) { if (pass2 && p.slot === (p.ast === 0 ? 0 : p.ast)) hold(sh); else fly(P3(p.ast === 0 ? pg : as), P3(sh), (f - .62) / .1, .25); }
        else if (f < .78) hold(sh, 1.45 + sh.z * .3);
        else if (p.kind === 'dunk') { if (f < .9) hold(sh, 1.5); else fly(rim, [rim[0], rim[1], .2], (f - .9) / .1, 0); }
        else if (f < .92) fly([sh.x, sh.y, sh.z + 1.7], rim, (f - .78) / .14, p.kind === 'three' ? 1.7 : 1);
        else if (p.made) fly(rim, [rim[0], rim[1], .25], (f - .92) / .08, 0); else { const rb = posOf(p.oreb ? p.tm : 1 - p.tm, p.oreb ? 3 : 4); fly(rim, P3(rb), (f - .92) / .08, .6); } }
      ball.hidden = false; refs[0].tx = O + clamp(ball.x - O - E * 3.5, C.x0 + .6, C.x1 - .6); refs[0].ty = O + C.y0 + .3; refs[1].tx = O + clamp(ball.x - O + E * 2, C.x0 + .6, C.x1 - .6); refs[1].ty = O + C.y1 - .3; refs[0].hidden = refs[1].hidden = false;
    }
    function onResult(g, p, i) {
      const t = G.time, last = i === g.poss.length - 1, pl = g.rosters[p.tm][p.pi];
      if (p.pts > 0 && p.tm === 0) { const big = p.kind !== 'two' && p.kind !== 'ft'; homeRun += p.pts; mood.cheerT = t + (big ? 2.6 : 1.6); mood.cheerI = big ? .85 : .5; sfxA('applause', big ? 2.2 : 1.1, big ? .8 : .5);
        if (big && !last) st_.jumbo({ mode: 'replay', pts: p.pts, name: pl.last, kind: p.kind === 'dunk' ? 'SLAM!' : '3 PTS', e: endOf(0, p.q), from: OFF[p.slot] }, 3.2);
        if (homeRun >= 8 && t - mood.waveT > 20) { mood.waveT = t; chant(pick(CHANTS.run)); say(TEAM.mascot ? 'Big Stan' : '', `The Otters are on a ${homeRun}-0 run! Here comes the wave!`, 3600); homeRun = 0; } else if (big && Math.random() < .4) chant(pick(CHANTS.home), Math.random() < .5 ? anchorN : anchorW);
        if (AR()) AR().onPlay(p, pl, big); }
      else if (p.pts > 0) { homeRun = 0; mood.awayT = t + 1.6; mood.groanT = t + 1.5; if (p.kind === 'three' && Math.random() < .3) sfxA('gasp', 1, .5); }
      else if (p.tm === 1 && (p.kind === 'to' || !p.made) && Math.random() < .25) { mood.clapT = t + 1.5; if (Math.random() < .3) chant('DE-FENSE!', anchorW); }
      if (p.kind === 'ft' && p.tm === 1 && Math.random() < .5) chant(pick(CHANTS.ft));
      if (last) { buzz(); if (g.buzzer) { const win = p.tm === 0; if (win) { mood.standT = t + 9; sfxA('applause', 7, 1); confetti(); say('Big Stan', `AT THE BUZZER! ${pl.name.toUpperCase()}! OTTERS WIN! OTTERS WIN!`, 7000); } else { mood.awayT = t + 5; sfxA('gasp', 1.5, 1); say('Big Stan', `Oh no. ${pl.last} at the buzzer for the ${g.a.nick}. Heartbreak in Maple Bay.`, 6000); } safe(() => G.emit('arena:buzzer', win)); } else if (g.won) { mood.standT = t + 5; sfxA('applause', 5, .9); confetti(); } }
    }
    function confetti() { for (const e of conf) { e.hidden = false; e.x = O + C.x0 + Math.random() * (C.x1 - C.x0); e.y = O + C.y0 - 1 + Math.random() * (C.y1 - C.y0 + 2); e.z = 6 + Math.random() * 5; e.vz = 1.4 + Math.random() * 1.6; e.vx = (Math.random() - .5) * .6; } }
    function fireTee(target) { const e = tees.find(q => q.hidden); if (!e) return null; const s = target || pick(SEATS.filter(q => q.tier !== 'court')); e.hidden = false; e.t = 0; e.from = [ollie.x + .4, ollie.y, 1.6]; e.to = [O + s.x, O + s.y, s.z + .9]; e.dur = 1.5; e.seat = s; if (cannonOb) { setP(cannonOb, { fire: 1 }); cannonOb._ft = .25; } sfxA('hush', 1, 1.6); return e; }
    st_.tee = fireTee;
    function gameFrame(dt, a) {
      const g = st_.ev.game, w = st_.w, ph = st_.ph, t = G.time; let ga = st_.ga = gameAt(g, w);
      if (ph === 'doors') { // warm-ups: both teams shoot around their own basket
        hideAll(dancers); mc.hidden = true; refs[0].hidden = refs[1].hidden = true; const on = w > -42;
        [homeP, awayP].forEach((team, tm) => { const E = tm === 0 ? 1 : -1; team.forEach((c, i) => { c.onCourt = on && i < 7; c.hidden = !on || i >= 7; c.poseOpts = null; c.keepPose = false; c.z = 0; if (c.pose === 'sit') c.pose = null; if (!on) return; const k = Math.floor(t / 4 + i * .7), sp = spotFor(E, 0, (i + k) % 5, k + i); c.tx = O + sp[0]; c.ty = O + sp[1]; }); });
        const k = (t % 3) / 3, sh = homeP[Math.floor(t / 3) % 5], rim = [O + C.x1 - C.rim, O + C.cy, C.rimZ]; ball.hidden = !on; if (k < .35) { ball.x = sh.x + .2; ball.y = sh.y; ball.z = .6 + Math.abs(Math.sin(t * 9)) * .4; } else if (k < .75) { const q = (k - .35) / .4; ball.x = lerp(sh.x, rim[0], q); ball.y = lerp(sh.y, rim[1], q); ball.z = lerp(1.7, rim[2], q) + Math.sin(q * Math.PI) * 1.4; } else { const q = (k - .75) / .25; ball.x = rim[0]; ball.y = rim[1]; ball.z = lerp(rim[2], .2, q); }
        coaches.forEach((c, i) => to(c, i ? 21 : 11.4, 8.25)); ollie.hidden = false; ollie.tx = O + 24.6 + Math.sin(t * .3) * .8; ollie.ty = O + 16.9; ollie.pose = Math.floor(t / 5) % 3 === 0 ? 2 : 0;
        jState = { mode: 'text', lines: ['TONIGHT', 'OTTERS V ' + g.a.nick.toUpperCase(), 'TIP-OFF 19:00'], c: '#f4f0e8' };
      } else if (ph === 'intro') { // lights down, the Otters run out one by one
        const k = clamp((w + TUNE.INTRO) / TUNE.INTRO, 0, 1), n = Math.min(4, Math.floor(k * 5.6)); ball.hidden = true; refs[0].hidden = refs[1].hidden = true;
        awayP.forEach((c, i) => { c.poseOpts = null; c.keepPose = false; c.z = 0; if (i < 5) { to(c, C.x0 + 2.2 + i * .8, C.y0 + 1.1); } else c.hidden = true; });
        homeP.forEach((c, i) => { c.poseOpts = null; c.keepPose = false; c.z = 0; if (i > 4) { c.hidden = true; return; } if (i <= n) to(c, C.cx + 1.2 + i * .9, C.cy - 1.6 + i * .8); else { c.hidden = true; c.x = c.tx = O + 26.6; c.y = c.ty = O + 3; } });
        if (n !== introI && k < 1) { introI = n; const p = ROSTER[n]; mood.cheerT = t + 2.4; mood.cheerI = n === 2 ? 1 : .7; sfxA('applause', 2, .8); say('Big Stan', n === 0 ? `Maple Bay! Put your hands together for YOUR OTTERS! At guard, number ${p.num}: ${p.name.toUpperCase()}!` : `Number ${p.num}: ${p.name.toUpperCase()}!`, 3600); }
        const p = ROSTER[Math.max(0, n)]; jState = { mode: 'intro', num: p.num, name: p.name, pos: { PG: 'GUARD', SG: 'GUARD', SF: 'FORWARD', PF: 'FORWARD', C: 'CENTRE' }[p.pos] }; to(mc, C.cx, C.cy + 2.6); mc.pose = 'talk'; mc.keepPose = true; ollie.hidden = false; ollie.tx = O + C.cx - 2; ollie.ty = O + C.cy + 1; ollie.pose = 4;
        coaches.forEach((c, i) => to(c, i ? 21 : 11.4, 8.25)); hideAll(dancers);
      } else if (ph === 'live') {
        const q = ga.q - 1; if (ga.ph !== lastGph || st_._q !== q) { st_._q = q; benchAll(g, ga.ph === 'half' ? 2 : ga.ph === 'break' ? Math.min(3, q + 1) : q, true); if (ga.ph === 'q') { hideAll(dancers); mc.hidden = true; for (const c of contestants) c.hidden = true; } if (ga.ph === 'to') { buzzSoft(); teeN = 0; } if (ga.ph === 'half' || ga.ph === 'break') buzz(); lastGph = ga.ph; }
        coaches.forEach((c, i) => to(c, (i ? 21 : 11.4) + Math.sin(t * .4 + i) * 1.2, 8.3)); mc.keepPose = false;
        const resI = ga.ph === 'q' && ga.p ? (ga.f >= .9 ? ga.i : ga.i - 1) : ga.i; if (resI > evI) { if (resI - evI <= 2 && evI >= -1) for (let i = evI + 1; i <= resI; i++) onResult(g, g.poss[i], i); evI = resI; }
        const tick = ga.i >= 0 && g.poss[Math.max(0, resI)] && resI >= 0 ? (() => { const p = g.poss[resI], pl = g.rosters[p.tm][p.pi]; return p.pts ? `#${pl.num} ${pl.last} +${p.pts}` : p.kind === 'to' ? 'TURNOVER ' + (p.tm ? g.a.abbr : g.h.abbr) : ADS[Math.floor(t / 6) % ADS.length]; })() : 'TIP-OFF';
        jState = { mode: 'score', home: { abbr: g.h.abbr, c: g.h.c, score: ga.score[0] }, away: { abbr: g.a.abbr, c: g.a.c, score: ga.score[1] }, q: ga.q, clock: ga.clock, ball: ga.p ? ga.p.tm : -1, tick, to: ga.ph === 'to', brk: ga.ph === 'half' ? 'HALF-TIME' : ga.ph === 'break' ? 'END OF Q' + ga.q : null };
        if (ga.ph === 'q') { if (ga.p) playPossession(g, ga, dt); ollie.hidden = false; ollie.tx = O + 25.4 + Math.sin(t * .25) * .6; ollie.ty = O + 17; ollie.pose = t < mood.cheerT ? 4 : 0; }
        else if (ga.ph === 'to' || ga.ph === 'break') { // huddles, dancers, the T-shirt cannon, fan-cam
          ball.hidden = true; [homeP, awayP].forEach((team, tm) => team.forEach((c, i) => { if (!c.onCourt) return; c.z = 0; c.tx = O + (tm ? 21 : 11.4) + (c.slot - 2) * .5; c.ty = O + 8.5 + (c.slot & 1) * .5; }));
          refs[0].tx = O + C.cx - .6; refs[0].ty = O + C.y0 + .3; refs[1].tx = O + C.cx + .6; refs[1].ty = O + C.y0 + .3; const f = ga.f;
          dancers.forEach((c, i) => { to(c, C.cx - 2.5 + (i % 3) * 2.5, C.cy - 1 + Math.floor(i / 3) * 2); c.pose = Math.hypot(c.x - c.tx, c.y - c.ty) < .2 ? 'dance' : c.pose; c.keepPose = Math.hypot(c.x - c.tx, c.y - c.ty) < .2; if (c.keepPose) c.dir = 1; });
          ollie.hidden = false; ollie.tx = O + 26; ollie.ty = O + 18.3; ollie.pose = 4; const shots = ga.ph === 'to' ? [.2, .42, .64] : [.3, .6];
          if (teeN < shots.length && f > shots[teeN] && Math.hypot(ollie.x - ollie.tx, ollie.y - ollie.ty) < .5) { const want = st_.mine && AR() && AR().wantTee(st_.ev, st_.mine) ; const e = fireTee(want ? st_.mine : null); if (e && want && AR()) AR().teeIncoming(e, st_); teeN++; if (teeN === 1) say('Big Stan', 'Time out on the floor! Ollie has the T-shirt cannon. Hands up if you want one!', 3600); }
          if (f > .55 && !jOver) fanCam(ga);
        } else if (ga.ph === 'half') halftime(g, ga, dt);
      } else if (ph === 'final' || ph === 'exit') {
        const g2 = g; ga = st_.ga = gameAt(g, g.len + 1); if (evI < g.poss.length - 1) evI = g.poss.length - 1; ball.hidden = true; refs[0].hidden = refs[1].hidden = true; hideAll(dancers); mc.hidden = true; const fin = ph === 'final', k = clamp((w - g.len) / TUNE.FINAL, 0, 1);
        const autos = AR() ? AR().autoPlayers(st_.ev) : [];
        homeP.forEach((c, i) => { c.poseOpts = null; c.z = 0; if (fin) { c.hidden = false; c.tx = O + C.cx - 2 + (i % 5) * 1; c.ty = O + C.cy - .8 + Math.floor(i / 5) * 1.4; c.keepPose = Math.hypot(c.x - c.tx, c.y - c.ty) < .3; if (c.keepPose) { c.pose = g2.won ? 'cheer' : 'stand'; c.dir = 1; } } else { const ai = autos.indexOf(c.pl.id); if (ai >= 0 && w < st_.ev.len + TUNE.OUT - 4) { c.hidden = false; c.tx = O + 25.3 + ai * 1.5; c.ty = O + 6.9; c.keepPose = Math.hypot(c.x - c.tx, c.y - c.ty) < .3; if (c.keepPose) { c.pose = 'stand'; c.dir = 1; } } else { c.keepPose = false; c.tx = O + 27.5; c.ty = O + 1.4; if (Math.hypot(c.x - c.tx, c.y - c.ty) < .5) c.hidden = true; } } });
        awayP.forEach((c, i) => { c.poseOpts = null; c.z = 0; c.keepPose = false; c.tx = O + 27.5; c.ty = O + 1.4; if (Math.hypot(c.x - c.tx, c.y - c.ty) < .5 || !fin) c.hidden = true; });
        coaches.forEach(c => { c.tx = O + 27.5; c.ty = O + 1.4; if (Math.hypot(c.x - c.tx, c.y - c.ty) < .5) c.hidden = true; }); ollie.hidden = !fin && w > st_.ev.len + 12; ollie.tx = O + C.cx; ollie.ty = O + C.cy + 2.2; ollie.pose = g2.won ? 4 : 0;
        jState = { mode: 'final', home: { abbr: g.h.abbr, c: g.h.c, score: g.final[0] }, away: { abbr: g.a.abbr, c: g.a.c, score: g.final[1] }, won: g.won, tick: g.won ? 'OTTERS WIN!  TOP SCORER #' + g.top.num + ' ' + g.top.name.split(' ').pop() + ' ' + g.top.pts : 'FINAL.  THANK YOU FOR COMING.  GET HOME SAFE' };
        if (lastPh !== ph && fin && AR()) AR().onFinal(st_.ev, st_);
      }
    }
    const buzzSoft = () => { if (G.scene === sc) safe(() => { const c = AU.ctx; if (c && c.state === 'running') note('brass', 58, c.currentTime + .02, .5, .9); }); };
    let camT = 0, camFan = null;
    function fanCam(ga) { // cycle the fan-cam during dead time; once a game it finds you
      const t = G.time; if (t < camT) return; camT = t + 3.4; const key = ga.q + ga.ph, a = AR();
      if (st_.mine && a && !camDone[key] && a.wantCam(st_.ev, ga)) { camDone[key] = 1; a.fanCam(st_, ga.ph === 'break' && ga.q === 3); return; }
      const f = pick(rows[Math.floor(Math.random() * 20)].fans); if (!f || !f.on || f.team === 1) return; const kiss = Math.random() < .25, sp = charSprite(f.key, f.spec, 'wave', Math.floor(t * 5) % 4, 1, null), f2 = kiss ? pick(POOL.home) : null;
      st_.jumbo({ mode: 'fancam', spr: sp, spr2: f2 ? charSprite('h' + POOL.home.indexOf(f2), f2, 'wave', 1, 1, null) : null, kiss, label: kiss ? 'KISS CAM' : pick(['FAN CAM', 'FAN OF THE GAME', 'LOUDEST FAN', 'DANCE CAM']), bounce: 1 }, 3.2); mood.cheerT = t + 1.2; mood.cheerI = .3;
    }
    let htStage = '';
    function halftime(g, ga, dt) { // 0-.1 MC, .1-.42 dance crew + Ollie, .42-.86 half-court shot contest, .86-1 teams come back
      const f = ga.f, t = G.time; ball.hidden = true; refs[0].hidden = refs[1].hidden = true; const stage = f < .1 ? 'mc' : f < .42 ? 'dance' : f < .86 ? 'contest' : 'back';
      for (const c of homeP.concat(awayP)) { if (stage === 'back') { c.z = 0; c.poseOpts = null; c.keepPose = false; if (c.onCourt) { c.hidden = false; const tm = homeP.includes(c) ? 0 : 1, sp = spotFor(tm === 0 ? -1 : 1, 0, c.slot, 3); c.tx = O + sp[0]; c.ty = O + sp[1]; } } else if (!c.hidden) { c.z = 0; c.poseOpts = null; c.keepPose = false; c.pose = null; c.tx = O + 27.5; c.ty = O + 1.4; if (Math.hypot(c.x - c.tx, c.y - c.ty) < .6) c.hidden = true; } }
      if (stage === 'back' && htStage !== 'back') { for (const c of homeP.concat(awayP)) if (c.onCourt) { c.x = O + 27; c.y = O + 2; } }
      coaches.forEach(c => { c.hidden = stage !== 'back'; }); to(mc, C.cx + 3, C.cy + 2.6); mc.pose = stage === 'mc' || stage === 'contest' ? 'talk' : null; mc.keepPose = true; mc.dir = 1;
      if (stage !== htStage) { htStage = stage; if (stage === 'mc') say('Big Stan', `That is the half! Otters ${ga.score[0]}, ${g.a.nick} ${ga.score[1]}. Stay in your seats: the Otterettes are coming out, and then somebody in this building is shooting from HALF COURT for sixty dollars.`, 6000);
        else if (stage === 'dance') { say('Big Stan', 'Make some noise for the Otterettes, and for the one, the only, OLLIE!', 3600); st_.jumbo({ mode: 'noise', v: .2 }, 5); mood.cheerT = t + 3; mood.cheerI = .7; sfxA('applause', 3, .8); }
        else if (stage === 'contest') { say('Big Stan', 'Half-court shot contest! One shot, sixty dollars. Who is feeling lucky?', 4200); if (AR()) AR().contestOpen(st_, ga); }
        else if (stage === 'back') { for (const c of contestants) c.hidden = true; hideAll(dancers); if (AR()) AR().contestClose(st_); } }
      if (stage === 'dance') { const k = (f - .1) / .32, ring = k > .5; dancers.forEach((c, i) => { const an = i / 6 * 6.28 + (ring ? t * .5 : 0); if (ring) to(c, C.cx + Math.cos(an) * 2.4, C.cy + Math.sin(an) * 1.6); else to(c, C.cx - 3 + i * 1.2, C.cy + (i % 2 ? .6 : -.6)); const at = Math.hypot(c.x - c.tx, c.y - c.ty) < .3; c.keepPose = at; if (at) { c.pose = 'dance'; c.dir = 1; } }); ollie.hidden = false; ollie.tx = O + C.cx; ollie.ty = O + C.cy + (ring ? 0 : 2); ollie.pose = 4; st_.noise = .3 + .7 * Math.abs(Math.sin(t * .8)); if (jOver && jOver.mode === 'noise') jOver.v = st_.noise; if (Math.floor(t) % 3 === 0) { mood.cheerT = t + .8; mood.cheerI = .4; } }
      else if (stage === 'contest') { dancers.forEach((c, i) => { to(c, C.x0 + 1 + i * 2.6, C.y0 + .5); c.keepPose = Math.hypot(c.x - c.tx, c.y - c.ty) < .3; if (c.keepPose) { c.pose = 'stand'; c.dir = 1; } }); ollie.hidden = false; ollie.tx = O + C.cx - 1.6; ollie.ty = O + C.cy + 1.6; ollie.pose = 2;
        // three fans take their turn (unless you are up): every ~.11 of the half
        const k = (f - .42) / .44, turn = Math.floor(k * 4), u = (k * 4) % 1; if (!st_.contestBusy) { contestants.forEach((c, i) => { c.z = 0; if (i === turn) { to(c, C.cx - .2, C.cy); c.keepPose = Math.hypot(c.x - c.tx, c.y - c.ty) < .3; if (c.keepPose) { c.dir = 0; c.pose = u > .3 && u < .5 ? 'cheer' : 'stand'; } } else { to(c, C.cx - 1.5 - i * .7, C.cy + 3.4); c.keepPose = false; } });
          if (turn < 3) { const rim = [O + C.x1 - C.rim, O + C.cy, C.rimZ], c = contestants[turn], made = h2(turn, st_.ev.T0 | 0, 7) < .12; if (u > .4 && u < .8) { ball.hidden = false; const q = (u - .4) / .4; ball.x = lerp(c.x, rim[0] + (made ? 0 : .6), q); ball.y = lerp(c.y, rim[1] + (made ? 0 : (turn - 1) * .7), q); ball.z = lerp(1.6, rim[2] + (made ? 0 : .4), q) + Math.sin(q * Math.PI) * 3; } else if (u >= .8 && st_._ct !== turn) { st_._ct = turn; if (made) { mood.standT = t + 3; sfxA('applause', 3, 1); say('Big Stan', 'IT IS GOOD! From half court! Somebody get that fan a contract!', 4000); } else { mood.groanT = t + 1; sfxA('gasp', .8, .5); } } } } }
    }

    /* ---------- concerts ---------- */
    let music = null, musicKey = '', songI = -2;
    const score = (act, n) => { const bpm = act.bpm + n * 4, beat = 60 / bpm, bars = 16, sc_ = act.scale, root = act.root + [0, 5, 7, 3, 0, 5][n % 6], r = R.rng(act.id.length * 31 + n * 7 + 3), bass = [], lead = [], pad = [], kick = [], sn = [], hat = [], prog = [0, 3, 4, 3, 0, 5, 3, 4];
      for (let b = 0; b < bars; b++) { const ch = prog[b % 8], rt = root + sc_[ch % sc_.length] - 12; for (let k = 0; k < 4; k++) { const t = (b * 4 + k) * beat; bass.push([t, rt + (k === 2 ? 7 : 0), beat * .8, .9]); kick.push([t, 36, .2, k % 2 ? .5 : 1]); if (k % 2) sn.push([t, 60, .1, .8]); hat.push([t + beat / 2, 80, .05, .25]); if (r() < .75) { const d = sc_[Math.floor(r() * sc_.length)]; lead.push([t + (r() < .3 ? beat / 2 : 0), root + 12 + d, beat * (r() < .3 ? 1.6 : .7), .7]); } } pad.push([b * 4 * beat, rt + 24, beat * 3.8, .4], [b * 4 * beat, rt + 24 + 7, beat * 3.8, .3]); }
      return { dur: bars * 4 * beat, beat, tracks: [{ inst: 'bass', sec: ['bass'], gain: 1, notes: bass }, { inst: act.id === 'juniper' ? 'brass' : act.id === 'gullwings' ? 'pizz' : 'synth', sec: ['lead'], gain: 1, notes: lead }, { inst: act.id === 'neontide' ? 'synth' : 'str', sec: ['pad'], gain: .7, notes: pad }, { inst: 'timp', sec: ['drums'], gain: .7, notes: kick }, { inst: 'snare', sec: ['drums'], gain: 1, notes: sn }, { inst: 'cym', sec: ['drums'], gain: .12, notes: hat }] }; };
    const stopMusic = () => { if (music) { safe(() => music.h.stop(.5)); music = null; musicKey = ''; } };
    function concertFrame(dt) {
      const ev = st_.ev, act = ev.act, w = st_.w, ph = st_.ph, t = G.time, T = TUNE.CONCERT, per = T.song + T.gap, live = ph === 'live';
      let si = -1, inSong = false, enc = false; if (live) { if (w < 5 * per) { si = Math.floor(w / per); inSong = w - si * per < T.song; } else if (w >= T.encoreAt) { si = 5; inSong = w < T.encoreAt + T.encoreLen - .6; enc = true; } }
      const dark = live && w >= 5 * per && w < T.encoreAt, onStage = (live && !dark) || (ph === 'final' && w < ev.len + 1.2); st_.song = si >= 0 ? (enc ? act.encore : act.songs[si]) : null; st_.scene = dark ? 'encore?' : st_.song;
      const SP = [[10.4, 9.9, 0], [11.9, 12.9, 0], [10.6, 15.3, 0], [9.9, 12.5, 0]];
      band.forEach((c, i) => { c.hidden = !onStage; c.z = 1; c.x = c.tx = O + SP[i][0] + (i === 1 && inSong ? Math.sin(t * .7) * .5 : 0); c.y = c.ty = O + SP[i][1] + (i === 1 && inSong ? Math.cos(t * .5) * .8 : 0); c.dir = 0; c.t += dt; const k = act.band[i]; c.pose = !inSong ? (i === 1 ? 'wave' : 'stand') : k === 'singer' ? (Math.floor(t / 3) % 2 ? 'dance' : 'talk') : k === 'drums' || k === 'keys' ? 'work' : 'dance'; c.poseOpts = k === 'drums' ? PO_SEAT : null; if (k === 'drums') c.z = 1.35; });
      if (si !== songI) { songI = si; if (si >= 0 && inSong) { mood.cheerT = t + 3; mood.cheerI = 1; sfxA('applause', 2.5, .8); say(act.name, enc ? `One more? ALL RIGHT, MAPLE BAY. This one is called "${act.encore}".` : si === 0 ? `Good evening, Maple Bay! We are ${act.name}. This is "${act.songs[0]}".` : `"${act.songs[si]}"`, 4600); if (enc && AR()) AR().onEncore(st_.ev, st_); } }
      if (live && !inSong && !dark && Math.floor(t * 2) % 5 === 0) { mood.cheerT = t + 1; mood.cheerI = 1; }
      if (dark) { if (Math.floor(t) % 4 === 0 && t - (st_._ch || 0) > 3.5) { st_._ch = t; chant('ONE MORE SONG!', anchorF); mood.cheerT = t + 2; mood.cheerI = 1; sfxA('applause', 2, .6); } }
      if (ph === 'final' && lastPh !== 'final') { say(act.name, 'Thank you, Maple Bay! Get home safe! Goodnight!', 4200); mood.cheerT = t + 5; mood.cheerI = 1; sfxA('applause', 5, 1); if (AR()) AR().onFinal(st_.ev, st_); }
      // music + beat
      const key = inSong && G.scene === sc ? ev.key + ':' + si : ''; if (key !== musicKey) { stopMusic(); if (key) { safe(unlock); const s = score(act, si); music = { h: play(s, { gain: .5 }), s, t0: t }; musicKey = key; } }
      if (music) { let mt = t - music.t0; if (mt >= music.s.dur) { music.h = play(music.s, { gain: .5 }); music.t0 = t; mt = 0; } safe(() => music.h.pump(mt)); mood.beat = inSong ? 1 : 0; st_.bf = Math.floor(mt / music.s.beat); } else { mood.beat = inSong ? 1 : 0; st_.bf = Math.floor(t * 2); }
      if (stageOb && !stageOb.hidden) setP(stageOb, { f: inSong ? st_.bf % 8 : 0, c: act.c, c2: act.c2, name: act.name });
      st_.house = ph === 'doors' ? .75 : live || ph === 'final' ? (dark ? .08 : .2) : 1;
      jState = ph === 'doors' ? { mode: 'text', lines: ['TONIGHT', act.name.toUpperCase().slice(0, 23), 'ON STAGE 20:00'], c: '#f4f0e8' } : dark ? { mode: 'noise', v: .5 + .5 * Math.abs(Math.sin(t)) } : live ? { mode: 'concert', act: act.name.toUpperCase(), song: (st_.song || '').toUpperCase(), c: act.c, c2: act.c2, beat: st_.bf & 1 } : { mode: 'text', lines: ['GOODNIGHT', 'MAPLE BAY'], c: act.c };
      ollie.hidden = true; ball.hidden = true;
    }

    /* ---------- family shows ---------- */
    let scI = -1;
    function familyFrame(dt) {
      const ev = st_.ev, sh = ev.show, w = st_.w, ph = st_.ph, t = G.time, live = ph === 'live', ice = ev.kind === 'ice'; let si = -1; if (live) for (let i = 0; i < sh.scenes.length; i++) if (w >= sh.scenes[i][0]) si = i;
      st_.scene = si >= 0 ? sh.scenes[si][1] : null; if (si !== scI) { scI = si; if (si >= 0) { say(sh.name, sh.scenes[si][2], 5600); mood.cheerT = t + 2.5; mood.cheerI = .8; sfxA('applause', 2, .7); } }
      if (ph === 'final' && lastPh !== 'final') { mood.standT = t + 5; sfxA('applause', 5, 1); if (AR()) AR().onFinal(st_.ev, st_); }
      st_.house = ice ? (live ? .22 : ph === 'final' ? .6 : 1) : 1; const sw = live ? w - sh.scenes[si][0] : 0, cx = C.cx, cy = C.cy, T2 = t * .5;
      jState = live ? { mode: 'show', title: sh.name.toUpperCase(), scene: (st_.scene || '').toUpperCase(), kind: ev.kind } : { mode: 'text', lines: ph === 'doors' ? [ice ? 'MAPLE BAY ON ICE' : 'MONSTER TRUCKS', 'STARTS 14:00'] : ['THANK YOU', 'SEE YOU SUNDAY'], c: '#f4f0e8' };
      if (ice) {
        const on = live || (ph === 'final' && w < ev.len + 2);
        skaters.forEach((c, i) => { c.hidden = !on; if (!on) return; let x = cx, y = cy, pose = 'stand'; const a = i / 8 * 6.283;
          if (ph === 'final' || si === 5) { x = cx - 4.2 + i * 1.2; y = cy + 1 + Math.sin(T2 * 2 + i) * .15; pose = 'wave'; c.sdir = 1; }
          else if (si === 0) { const an = a + T2 * .8; x = cx + Math.cos(an) * 5.2; y = cy + Math.sin(an) * 2.8; }
          else if (si === 1) { if (i === 0) { const an = T2 * 1.1; x = cx + Math.sin(an) * 5.4; y = cy + Math.sin(an * 2) * 2.4; pose = Math.floor(t / 2) % 2 ? 'talk' : 'stand'; } else { x = cx - 6 + i * 1.7; y = C.y0 + .8; pose = 'stand'; c.sdir = 1; } }
          else if (si === 2) { if (i === 1 || i === 2) { const an = T2 * 3 + (i - 1) * Math.PI; x = cx + Math.cos(an) * 1.1; y = cy + Math.sin(an) * .7; pose = 'dance'; c.sdir = Math.floor(t * 4 + i * 2) % 4; } else { const an = a - T2 * .5; x = cx + Math.cos(an) * 6; y = cy + Math.sin(an) * 3.2; pose = i === 0 ? 'stand' : 'wave'; } }
          else if (si === 3) { const lead = cx - 5.5 + ((T2 * 2.2) % 11); x = lead - 1.2 - i * .9; if (x < C.x0 + .5) x += 11; y = cy + Math.sin(x * 1.1) * 1.4; pose = 'wave'; }
          else { const in_ = i < 4, an = (in_ ? T2 * 1.2 : -T2 * .8) + (i % 4) / 4 * 6.283, r = in_ ? [1.8, 1.1] : [5.6, 3]; x = cx + Math.cos(an) * r[0]; y = cy + Math.sin(an) * r[1]; pose = in_ ? 'dance' : 'cheer'; }
          const nx = O + x, ny = O + y; if (c.snap) { c.x = nx; c.y = ny; c.snap = false; } const dx = nx - c.x, dy = ny - c.y, d = Math.hypot(dx, dy), stp = Math.min(d, 7 * dt); if (d > .01) { c.x += dx / d * stp; c.y += dy / d * stp; if (c.sdir === undefined && d > .03) c.face(dx, dy); } if (c.sdir !== undefined) { c.dir = c.sdir; c.sdir = undefined; } c.z = 0; c.moving = false; c.pose = pose === 'stand' ? null : pose; c.t += dt; });
        ollie.hidden = !(live && si === 3) && !(ph === 'final'); if (!ollie.hidden) { if (si === 3) { const lead = cx - 5.5 + ((T2 * 2.2) % 11); ollie.tx = O + lead; ollie.ty = O + cy + Math.sin(lead * 1.1) * 1.4 + Math.sin(t * 5) * .15; ollie.sp = 9; ollie.pose = Math.floor(t * 2) % 5 === 0 ? 2 : 6; } else { ollie.tx = O + cx; ollie.ty = O + cy - 1; ollie.pose = 2; } }
        for (const e of trucks) e.hidden = true;
      } else {
        hideAll(skaters); ollie.hidden = true; const on = live || (ph === 'final' && w < ev.len + 2), x0 = C.x0 + 1.2, x1 = C.x1 - 1.2, y0 = C.y0 + 1, y1 = C.y1 - 1, per = 2 * (x1 - x0) + 2 * (y1 - y0);
        const lap = (s) => { s = ((s % per) + per) % per; if (s < x1 - x0) return [x0 + s, y1, 1, 0]; s -= x1 - x0; if (s < y1 - y0) return [x1, y1 - s, 0, -1]; s -= y1 - y0; if (s < x1 - x0) return [x1 - s, y0, -1, 0]; s -= x1 - x0; return [x0, y0 + s, 0, 1]; };
        trucks.forEach((e, i) => { e.hidden = !on; if (!on) return; let x, y, z = 0, vx = 1, vy = 0;
          if (si === 1 || si === 4) { const turn = Math.floor(sw / 2.2) % 4, u = (sw / 2.2) % 1; if (i === turn) { x = lerp(C.x0 + .8, C.x1 - 1, ease(u)); y = cy; const jx = x - 14.4; if (jx > 0 && jx < 7) z = Math.sin(jx / 7 * Math.PI) * (si === 4 ? 2.6 : 1.9) + .3; else if (x > 12.4 && x <= 14.4) z = (x - 12.4) * .45; if (u > .46 && u < .5 && t - (st_._tj || 0) > 1) { st_._tj = t; mood.cheerT = t + 1.6; mood.cheerI = .9; sfxA('applause', 1.5, .7); } } else { const q = lap(i * per / 4 + (si === 4 ? t * 2 : 0)); x = q[0]; y = q[1]; vx = q[2]; vy = q[3]; if (si === 4) z = Math.abs(Math.sin(t * 3 + i)) * .3; } }
          else if (si === 2) { const an = t * 2.4 * (i % 2 ? -1 : 1) + i, qx = cx + (i % 2 ? 3.6 : -3.6), qy = cy + (i < 2 ? -1.9 : 1.9); x = qx + Math.cos(an) * 1.5; y = qy + Math.sin(an) * 1; vx = -Math.sin(an) * (i % 2 ? -1 : 1); vy = Math.cos(an) * (i % 2 ? -1 : 1); }
          else if (si === 3) { const u = (sw / 1.6) % 1, pair = Math.floor(sw / 1.6) % 2; if ((i >> 1) === pair) { x = lerp(C.x0 + .8, C.x1 - 1, Math.pow(u, 1.3 + h2(i, Math.floor(sw / 1.6), 3) * .5)); y = cy + (i & 1 ? 2 : -2); z = Math.abs(Math.sin(u * 20)) * .12; } else { x = C.x0 + 1 + (i & 1) * 1.6; y = C.y1 - 1 - (i >> 1) * .2; } }
          else { const q = lap(sw * 9 + t * 1.5 + i * per / 4); x = q[0]; y = q[1]; vx = q[2]; vy = q[3]; z = Math.abs(Math.sin(t * 6 + i)) * .08; }
          e.x = O + x; e.y = O + y; e.z = z; if (Math.abs(vx) >= Math.abs(vy)) { e.flip = false; e.dir = vx >= 0 ? 1 : -1; } else { e.flip = true; e.dir = vy >= 0 ? 1 : -1; } });
      }
      ball.hidden = true;
    }

    /* ---------- sync: which event, which phase ---------- */
    let tick = 0, rowI = 0, okPos = null, lastWarn = 0, courtBlk = false;
    function applyMode(mode, ev) {
      st_.mode = mode; evI = -1; homeRun = 0; lastGph = ''; st_._q = -1; introI = -1; camDone = {}; songI = -2; scI = -1; htStage = ''; st_._ct = -1; stopMusic();
      hideAll(homeP.concat(awayP, refs, dancers, band, skaters, contestants, [mc], coaches)); for (const e of trucks.concat(tees, conf)) e.hidden = true; ollie.hidden = true; ball.hidden = true;
      setFloor(mode === 'concert' ? 'concert' : mode === 'ice' ? 'ice' : mode === 'trucks' ? 'trucks' : 'court'); setGroup('game', mode === 'game' || mode === 'idle'); setGroup('concert', mode === 'concert'); setGroup('trucks', mode === 'trucks');
      for (const o of grp('court')) if (o.data.chairs < 2) { const on = mode !== 'concert'; if (o.hidden === on) { o.hidden = !on; if (on) Wd.block(o.B[0], o.B[1], o.B[3], o.B[4]); else Wd.free(o.B[0], o.B[1], o.B[3], o.B[4]); } }
      if (ev && ev.kind === 'game') { const g = ev.game; awayP.forEach((c, i) => { const p = g.a === ev.opp ? g.rosters[1][i] : g.rosters[1][i]; c.pl = p; c.setSpec(AR() ? AR().playerSpec(p, ev.opp) : P.adult[1]); }); }
      if (ev && ev.kind === 'concert') band.forEach((c, i) => c.setSpec(Object.assign({}, P.adult[(i * 3 + 4 + ev.act.id.length) % P.adult.length], { top: i === 1 ? 'jacket' : 'tee', topColor: i % 2 ? ev.act.c : ev.act.c2, innerColor: '#33303f', bottom: 'jeans', bottomColor: '#33303f', hat: i === 3 ? 'beanie' : null, hatColor: ev.act.c, bag: null, age: 'adult' })));
      if (ev) seed(ev); else for (const r of rows) for (const f of r.fans) f.on = false; snapAll();
    }
    function sync() {
      const a = AR(), s = a ? a.now() : { ph: 'none' }, ev = s.ev || null, mode = ev ? ev.kind : 'idle', tk = a && ev ? a.ticketFor(ev) : null, mid = tk ? tk.seat : null, key = (ev ? ev.key : '-') + '|' + mid;
      if (key !== evKey) { evKey = key; myId = mid; st_.ev = ev; applyMode(mode, ev); }
      st_.ph = s.ph; st_.w = ev ? G.state.t - ev.T0 : 0; if (banner && a) setP(banner, { name: a.chain().st >= 6 ? a.playerName() : null }); st_.honor = a && a.chain().st >= 6 ? a.playerName() : null;
      const seat = st_.mySeat(); marker.hidden = !(seat && !st_.mine && ev && s.ph !== 'none'); if (seat) { marker.x = O + seat.x; marker.y = O + seat.y; marker.z = seat.z + 1.5; }
      for (const o of ads) setP(o, { f: Math.floor(G.time / 4) % 3, text: ADS[(Math.floor(G.time / 8) + o.data.ad * 3) % ADS.length] }); if (tableOb) setP(tableOb, { f: Math.floor(G.time / 3) % 6 });
    }
    function frame(dt) {
      const ev = st_.ev, ph = st_.ph, t = G.time; st_.w = ev ? G.state.t - ev.T0 : 0; const w = st_.w;
      if (!ev || ph === 'none') { st_.house = isOpenHrs() ? 1 : .35; st_.ga = null; const a = AR(), nx = a ? a.nextLine() : ['', '']; jState = { mode: 'idle', l1: nx[0], l2: nx[1], clock: G.now().clock }; if (!st_.shoot) ball.hidden = true; }
      else if (ev.kind === 'game') { st_.house = ph === 'intro' ? .18 : 1; gameFrame(dt, AR()); }
      else if (ev.kind === 'concert') concertFrame(dt); else familyFrame(dt);
      if (ev && ph === 'exit') { hideAll(band); if (ev.kind !== 'game') { hideAll(skaters); for (const e of trucks) e.hidden = true; ollie.hidden = true; st_.house = 1; jState = { mode: 'text', lines: ['THANK YOU', 'GET HOME SAFE'], c: '#f4f0e8' }; stopMusic(); } }
      lastPh = ph;
      // actors chase their marks
      for (const c of homeP) if (!c.hidden && !(c.poseOpts && c.poseOpts.seated)) chase(c, dt); else c.t += dt; for (const c of awayP) if (!c.hidden && !(c.poseOpts && c.poseOpts.seated)) chase(c, dt); else c.t += dt;
      for (const c of refs) if (!c.hidden) chase(c, dt); for (const c of dancers) if (!c.hidden) chase(c, dt); for (const c of coaches) if (!c.hidden) chase(c, dt); for (const c of contestants) if (!c.hidden) chase(c, dt); if (!mc.hidden) chase(mc, dt);
      if (!ollie.hidden && !st_.inSuit) { const dx = ollie.tx - ollie.x, dy = ollie.ty - ollie.y, d = Math.hypot(dx, dy); ollie.t += dt; if (ollie.snap || d > 14) { ollie.x = ollie.tx; ollie.y = ollie.ty; ollie.snap = false; } else if (d > .05) { const stp = Math.min(d, (ollie.sp || 4) * dt); ollie.x += dx / d * stp; ollie.y += dy / d * stp; ollie.f = 8 + (Math.floor(ollie.t * 7) & 1); } else { const p = ollie.pose || 0; ollie.f = p === 4 ? 4 + Math.floor(ollie.t * 5) % 4 : p === 2 ? 2 + (Math.floor(ollie.t * 4) & 1) : p === 6 ? 6 : Math.floor(ollie.t * 1.5) & 1; } }
      if (st_.shotA) { const s = st_.shotA; s.t += dt; const k = Math.min(1, s.t / s.dur); ball.hidden = false; if (k < .78) { const q = k / .78; ball.x = lerp(s.from[0], s.to[0], q); ball.y = lerp(s.from[1], s.to[1], q); ball.z = lerp(s.from[2], s.to[2], q) + Math.sin(q * Math.PI) * s.arc; } else { const q = (k - .78) / .22; if (s.made) { ball.x = s.to[0]; ball.y = s.to[1]; ball.z = lerp(s.to[2], .2, q); } else { ball.x = s.to[0] - q * 1.6; ball.y = s.to[1] + q * (s.side || 1); ball.z = s.to[2] + Math.sin(q * Math.PI) * .8 - q * 1.4; } } if (k >= 1) { st_.shotA = null; ball.hidden = true; s.res(s.made); } }
      shadow.hidden = ball.hidden; shadow.x = ball.x; shadow.y = ball.y;
      for (const e of tees) if (!e.hidden) { e.t += dt; const k = e.t / e.dur; if (k >= 1) { e.hidden = true; if (e.onLand) { const f = e.onLand; e.onLand = null; f(); } else { mood.cheerT = t + .8; mood.cheerI = .25; } } else { e.x = lerp(e.from[0], e.to[0], k); e.y = lerp(e.from[1], e.to[1], k); e.z = lerp(e.from[2], e.to[2], k) + Math.sin(k * Math.PI) * 4.5; } }
      if (cannonOb && cannonOb._ft > 0 && (cannonOb._ft -= dt) <= 0) setP(cannonOb, { fire: 0 });
      for (const e of conf) if (!e.hidden) { e.z -= e.vz * dt; e.x += e.vx * dt + Math.sin(t * 3 + e.vz * 9) * dt * .4; if (e.z <= 0.05) e.hidden = true; }
      // courtside fans
      for (const c of courtFans) { const f = c.fan, s = f ? fanAt(f, w) : -1; c.hidden = !ev || s < 0 || (c.seat.id === myId); if (c.hidden) continue; c.t += dt; if (c._hold > 0) { c._hold -= dt; continue; } const an = fanAnim(f, t, true, true); c.exc = f.exc; if (an === 'CHEER' || an === 'cheer') { c.pose = 'cheer'; c.poseOpts = an === 'CHEER' ? null : PO_SEAT; c.z = an === 'CHEER' ? 0 : c.seat.z; } else { c.pose = an; c.poseOpts = PO_SEAT; c.z = c.seat.z; } }
      // repaint a few rows of the crowd
      if (ev && ph !== 'none') { const L = rows.length; for (let n = 0; n < 7; n++) { rowI = (rowI + 1) % L; const r = rows[rowI]; if (r.floor && ev.kind !== 'concert') { r.ent.hidden = true; continue; } paintRow(r, w, t); } } else for (const r of rows) r.ent.hidden = true;
      // jumbotron (10 fps)
      if ((jT -= dt) <= 0) { jT = .1; const o = jOver && t < jUntil ? jOver : (jOver = null, jState); o.t = t; if (st_.honor) o.name = st_.honor; paintJumbo(jx, o); blitJ(); }
      // camera: from your seat, look toward the action
      if (st_.mine) { const fx = ev && ev.kind === 'concert' ? O + 12 : ev && !ball.hidden ? ball.x : O + C.cx, fy = ev && !ball.hidden ? ball.y : O + C.cy, p = G.player, k = st_.mine.tier === 'nose' ? .52 : st_.mine.tier === 'court' ? .7 : .62, tx = lerp(p.x, fx, k), ty = lerp(p.y, fy, k), tz = lerp(p.z, 2.2, k); cam.x += (tx - cam.x) * Math.min(1, dt * 2.2); cam.y += (ty - cam.y) * Math.min(1, dt * 2.2); cam.z += (tz - cam.z) * Math.min(1, dt * 2.2); }
      // foam finger
      const p = G.player, hasF = AR() && AR().hasFoam(); foam.hidden = !hasF || p.hidden || G.scene !== sc; if (!foam.hidden) { foam.x = p.x; foam.y = p.y; foam.z = p.z + (p.pose === 'sit' || p.pose === 'cheer' && p.poseOpts ? .55 : .8); foam.up = p.pose === 'cheer' || p.pose === 'wave' || p.pose === 'dance'; }
      // keep people off the floor during a show (the court is also taken out of the nav grid so paths go round it)
      { const blk = !!(ev && ph !== 'none' && ph !== 'exit' && ev.kind !== 'concert' && !st_.pass); if (blk !== courtBlk) { courtBlk = blk; if (blk) Wd.block(O + C.x0, O + C.y0, O + C.x1, O + C.y1); else Wd.free(O + C.x0, O + C.y0, O + C.x1, O + C.y1); } }
      const rx = p.x - O, ry = p.y - O, onFloor = rx > C.x0 - .2 && rx < C.x1 + .2 && ry > C.y0 - .2 && ry < C.y1 + .2, live = ev && ph !== 'none' && ph !== 'exit', may = !live || st_.pass || (ev.kind === 'concert' && AR() && AR().floorOk(ev) && rx > 13.2);
      if (onFloor && !may && !G.busy && !G.cutscene) { if (okPos) { p.x = okPos.x; p.y = okPos.y; } else { p.x = O + BOWL_ENTRY.x; p.y = O + BOWL_ENTRY.y; } p.stop(); G.target = null; G.pending = null; if (t - lastWarn > 3) { lastWarn = t; toast(ev.kind === 'concert' ? 'The floor is for standing tickets. An usher points you back to the seats.' : 'An usher steps in front of you. "Not on the floor during the show, please!"', 'info', 3200); } }
      else if (!onFloor) { if (!okPos) okPos = { x: p.x, y: p.y }; else { okPos.x = p.x; okPos.y = p.y; } }
    }
    const isOpenHrs = () => { const h = G.now().hf; return h >= ARENA_HOURS[0] && h < ARENA_HOURS[1]; };

    /* ---------- sitting ---------- */
    st_.sit = (seat, o = {}) => {
      if (G.busy || !seat) return false; const p = G.player, ev = st_.ev, live = ev && st_.ph !== 'none', mins = live ? Math.max(4, ev.out - G.state.t - 2) : 20, rate = live ? (ev.kind === 'game' ? TUNE.WATCH : ev.kind === 'concert' ? TUNE.CONCERT.watch : TUNE.FAMILY.watch) : 2.5;
      st_.mine = seat; st_.ffOn = false; p.poseOpts = PO_SEAT; cam.x = p.x; cam.y = p.y; cam.z = p.z; G.camTarget = cam;
      const end = () => { p.poseOpts = null; st_.mine = null; G.camTarget = null; if (AR()) AR().seatBar(false); safe(() => G.snapCam()); };
      const a = G.startActivity({ label: live ? (ev.kind === 'game' ? 'Watching the game' : ev.kind === 'concert' ? 'At the concert' : 'Watching the show') : 'Sitting in the empty arena', anim: 'sit', minutes: mins, rate, at: { x: O + seat.x, y: O + seat.y, z: seat.z, dir: seat.dir },
        tick: gm => { if (AR()) AR().watchTick(gm, st_); }, cancel: end, done: end }); a._arena = true; a.base = rate; if (AR()) AR().seatBar(true, st_); cam.x = p.x; cam.y = p.y; safe(() => G.snapCam()); return true;
    };
    st_.throwBall = (made, o = {}) => new Promise(res => { const p = G.player, rim = [O + C.x1 - C.rim, O + C.cy, C.rimZ], off = made ? [0, 0, 0] : [(o.long ? .7 : -.5), (o.side || .8), .35]; st_.shotA = { t: 0, dur: o.dur || 1.9, from: [p.x, p.y, p.z + 1.6], to: [rim[0] + off[0], rim[1] + off[1], rim[2] + off[2]], arc: o.arc || 3.2, made, side: o.side || 1, res }; });
    st_.ff = on => { st_.ffOn = !!on; if (G.busy && G.busy._arena) G.busy.rate = on ? TUNE.WATCH_FF : G.busy.base; return st_.ffOn; };
    st_.react = anim => { const p = G.player; if (!G.busy || !G.busy._arena) return; p.pose = anim; st_._rt = G.time + 2.2; };
    // your own seat + (quiet days) any stand
    sc.interactables.push({ x: 0, y: 0, z: 0, h: .6, hit: 12, label: 'Your seat', get spot() { const s = st_.mySeat(); return s ? { x: O + s.spot.x, y: O + s.spot.y } : undefined; }, visible() { const s = st_.mySeat(); if (!s || st_.mine || !st_.ev) return false; this.x = O + s.x; this.y = O + s.y; this.z = s.z - .2; this.label = 'Your seat: ' + s.label; return true; }, use: () => st_.sit(st_.mySeat()) });
    for (const [sid, lab, sx, sy] of [['N3_14', 'Sit in the stands', 12, 4.6], ['W2_9', 'Sit in the stands', 5, 13], ['N9_20', 'Sit in the nosebleeds', 14, 1.4]]) { const s = SEAT_BY[sid] || SEATS[0]; sc.interactables.push({ x: O + s.x, y: O + s.y, z: s.z - .2, h: .6, hit: 12, label: lab, spot: { x: O + s.spot.x, y: O + s.spot.y }, visible: () => st_.mode === 'idle' && !st_.mine, use: () => st_.sit(s) }); }

    sc.env = t => { const L = st_.house; return { amb: R.mix('#2a2a48', '#ffffff', L), dark: (1 - L) * .88, bg: Wd.bg, night: false }; };
    const lp = (m, cam_, pool, x, y, z, r, c, a) => { const s = R.WS(x, y, z), ps = pool(r, c); m.globalAlpha = clamp(a, 0, 1); m.drawImage(ps, Math.round(s[0]) - cam_.x - (ps.width >> 1), Math.round(s[1]) - cam_.y - (ps.height >> 1)); };
    sc.lights = (m, cam_, pool) => { const L = 1 - st_.house; if (L < .05) return; const ga = m.globalAlpha, t = G.time, ev = st_.ev; try {
      if (ev && ev.kind === 'concert') { const c = ev.act.c, c2 = ev.act.c2, b = mood.beat ? .75 + .25 * ((st_.bf || 0) & 1) : .35; lp(m, cam_, pool, O + 11, O + 12.5, 1, 6, '#ffffff', L * .9); for (let i = 0; i < 5; i++) { const an = t * (.5 + i * .13) + i * 1.3; lp(m, cam_, pool, O + 17.5 + Math.cos(an) * 5, O + 12.5 + Math.sin(an * 1.3) * 3.4, 0, 4, i % 2 ? c : c2, L * b); } lp(m, cam_, pool, O + 5, O + 4, 3, 7, c2, L * .25 * b); lp(m, cam_, pool, O + 14, O + 4, 3, 7, c, L * .3 * b); lp(m, cam_, pool, O + 22, O + 20, 1, 6, c, L * .2 * b); }
      else if (ev && ev.kind === 'ice') { for (let i = 0; i < 8; i += 1) { const c = skaters[i]; if (!c.hidden && (i < 3 || i % 2)) lp(m, cam_, pool, c.x, c.y, 0, i === 0 ? 3 : 2, i === 0 ? '#fff2c8' : i < 3 ? '#cfe9f4' : '#8fd0f0', L); } if (!ollie.hidden) lp(m, cam_, pool, ollie.x, ollie.y, 0, 3, '#ffd98a', L); lp(m, cam_, pool, O + C.cx, O + C.cy, 0, 9, '#3a5a9a', L * .7); }
      else { for (const c of homeP) if (!c.hidden) lp(m, cam_, pool, c.x, c.y, 0, 2, '#fff2c8', L); lp(m, cam_, pool, O + C.cx + Math.cos(t * 1.3) * 5, O + C.cy + Math.sin(t * 1.7) * 3, 0, 4, TEAM.c, L * .8); lp(m, cam_, pool, O + C.cx + Math.cos(t * 1.1 + 2) * 5, O + C.cy + Math.sin(t * .9 + 1) * 3, 0, 4, '#ffffff', L * .5); if (!mc.hidden) lp(m, cam_, pool, mc.x, mc.y, 0, 2, '#ffffff', L); }
    } finally { m.globalAlpha = ga; } };

    sync(); snapAll();
    const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); if ((tick -= dt) <= 0) { tick = .5; sync(); } frame(dt); if (st_._rt && G.time > st_._rt && G.busy && G.busy._arena) { G.player.pose = 'sit'; st_._rt = 0; } };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); evKey = ''; okPos = null; sync(); snapAll(); for (let i = 0; i < rows.length; i++) { const r = rows[i]; if (st_.ev && st_.ph !== 'none' && !(r.floor && st_.ev.kind !== 'concert')) paintRow(r, st_.w, G.time); else r.ent.hidden = true; } if (st_.ev && st_.ev.kind === 'game' && st_.ph === 'live') { const ga = gameAt(st_.ev.game, st_.w); evI = ga.ph === 'q' && ga.p ? ga.i - 1 : ga.i; } if (AR()) AR().arrivedBowl(sc, pv); };
    const x0 = sc.onExit; sc.onExit = () => { x0(); stopMusic(); caption('', ''); G.camTarget = null; st_.mine = null; st_.pass = false; if (AR()) AR().seatBar(false); };
  },
});

const only = fn => (fx, scene) => (scene.def && scene.def.showpiece === 'arena' ? fn(fx, scene) : null);
export function init() {
  registerFixture('arena_balls', only((fx, sc) => ({ label: 'Shoot some hoops', hit: 14, visible: () => sc.arena && sc.arena.mode === 'idle', use: () => AR() && AR().shootAround(fx, sc) })));
  registerFixture('arena_btunnel', only(() => ({ label: 'Team tunnel', hit: 30, spot: { x: O + 27.6, y: O + 1.4 }, use: () => AR() && AR().tunnelToBackstage() })));
  registerFixture('arena_cseat', only((fx, sc) => ({ label: 'Sit courtside', hit: 12, visible: () => sc.arena && sc.arena.mode === 'idle' && !sc.arena.mine && !fx.ob.hidden, use: () => { const s = SEATS.find(q => q.st === 'C' + fx.item.chairs && q.i === 2); if (s) sc.arena.sit(s); } })));
}
