// Maple Bay Natatorium — the Leisure Pool hall (room `natatorium:leisure`, 46 x 26): the slide tower with The Twister flume and The Plunge drop slide (back left), the wellness corner (sauna, steam room,
//   cold plunge) along the back wall, the lazy river looping round a palm island with a hot tub and a bridge, the wave pool with its machine, siren and beach (back right), the toddler splash zone with
//   fountains and the tipping bucket (front right), The Deep End Cafe (front left). Friday nights: DJ booth, disco lights, glow rings. Exits: "Changing Village", "Competition Pool" (front), "Lido" (right edge).
// scene.nat = { river { tubes, mine, ride(on) -> laps so far, laps(), speed }, wave { on, spot, bob(x, y) }, bucket { left(), spot, onTip }, rider(pathId, look) -> { ent, at(s), L, end() }, slideBoard(lines), climb (stair path),
//   tubSpots, party, sync(), stroll }.      Export: stroll(sc, specs, routes, n) (deck walkers in swimwear).
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import * as R from '../../engine/raster.js';
import { ambient } from '../../core/clock.js';
import { defineRoom } from '../interior.js';
import { bubble } from '../../ui/kit.js';
import { crowd } from './_show_life.js';
import { LEIS, FLUME_S, DROP_S, pathAt, pathLen, riverPt, inEll, deck, TEAL, FLOATS } from '../../art/showpiece/_nat_lib.js';
import { NR, HOURS, CAFE_NAME, waveOn, sessionNow, BUCKET, STAFF, inH } from '../../data/natatorium.js';
import { O, NS, pick, setP, showOb, viewNow, mkItems, hallEnv, dress, by, hook, floorDecal, wireLife } from './natatorium.js';
import { waterLayer, PALS, look, swimPeople, splash, sweep, board, person, jet, ent, tubeSpr, mkC, spr } from './natatorium_fx.js';
import { wader } from './natatorium_pool.js';

const W = 46, D = 26, RV = LEIS.RIVER, WV = LEIS.WAVE, TD = LEIS.TOD, SP = LEIS.SPLASH, TUB = LEIS.TUB;
/** people in swimwear strolling the deck. routes: [[[x, y], ...], ...] in world coords */
export function stroll(sc, specs, routes, n) {
  const list = []; for (let i = 0; i < n; i++) { const c = person(sc, specs[i % specs.length], 0, 0, 1, { label: 'Swimmer' }); c.spd = 1.1 + (i % 3) * .3; const set = () => { const rt = pick(routes), rev = Math.random() < .5; c.pts = rev ? rt.slice().reverse() : rt; c.i = 1; c.x = c.pts[0][0]; c.y = c.pts[0][1]; c.alpha = 0; }; c.reset = set; set(); c.wait = i * 2.5; list.push(c);
    sc.interactables.push({ ent: c, x: c.x, y: c.y, label: 'Swimmer', h: 1.2, hit: 6, range: 1.7, visible: () => !c.hidden && (c.alpha === undefined || c.alpha > .6), use: () => { c._hold = 3; c.faceTo(G.player.x, G.player.y); bubble(c, pick(['The slides are faster if you lean. I do not lean.', 'Wave machine in a minute. Listen for the siren.', 'I have been round the river four times. I may live there now.', 'The bucket got me. It always gets me.'])); } }); }
  let active = n; return { list, count: () => list.filter(c => !c.hidden).length, setActive(k) { active = k; }, update(dt) { for (let i = 0; i < list.length; i++) { const c = list[i]; if (i >= active) { c.hidden = true; continue; } if (c.wait > 0) { c.wait -= dt; c.hidden = true; if (c.wait <= 0) { c.hidden = false; c.reset(); } continue; } c.hidden = false; c.t += dt; if (c.alpha !== undefined) { c.alpha += dt * 2; if (c.alpha >= 1) c.alpha = undefined; } if (c._hold > 0) { c._hold -= dt; c.moving = false; continue; } const q = c.pts[c.i]; if (!q) { c.wait = 1 + Math.random() * 5; continue; } const dx = q[0] - c.x, dy = q[1] - c.y, d = Math.hypot(dx, dy), st = c.spd * dt; if (d <= st) { c.x = q[0]; c.y = q[1]; c.i++; } else { c.x += dx / d * st; c.y += dy / d * st; c.face(dx, dy); } c.moving = true; } } };
}
const RID = new Map();
const riderSpr = L => { const k = L.skin + L.suit + L.hair; let s = RID.get(k); if (s) return s; const c = mkC(9, 9), x = c.getContext('2d'), set = (a, b, col, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(a, b, w, h); }; set(2, 0, L.hair, 4, 2); set(2, 2, L.skin, 4, 2); set(1, 4, L.one ? L.suit : L.skin, 6, 2); set(2, 6, L.suit, 4, 1); set(1, 7, L.skin, 2, 2); set(5, 7, L.skin, 2, 2); set(0, 4, L.skin, 1, 2); set(7, 4, L.skin, 1, 2); s = spr(c); s.y = -7; RID.set(k, s); return s; };

{
  const { items, spots, H, Wl, S } = mkItems();
  H('slides', 0, 0, {}, { slides: 1 }); H('sauna', 11.6, .3, {}, { sauna: 1 }); H('steam', 15.4, .3, {}, { steam: 1 }); H('plunge', LEIS.PLUNGE.x - .9, LEIS.PLUNGE.y - .9, {}, { plunge: 1 });
  H('lounger', 23.6, .6, { c: '#1fa3b8', towel: 1 }, { lounger: 1 }); H('lounger', 24.6, .6, { c: '#f2c230' }, { lounger: 1 }); H('lounger', 29.4, 22.8, { c: '#f28fb0' }, { lounger: 1 }); H('lounger', 30.4, 22.8, { c: '#1fa3b8', towel: 2 }, { lounger: 1 }); H('lounger', 31.4, 22.8, { c: '#f2c230' }, { lounger: 1 });
  Wl('sign', 'y', 12.4, { t: 'WELLNESS', w: 2.4, c: '#9a6a3c' }, { mount: 2.9 }); for (const x of [26, 30.4]) Wl('glasswall', 'y', x, { w: 4.2, h: 3.4, seed: x }, { glass: 1, mount: .7 }); Wl('wavegrille', 'y', 36.2, { w: 7.8 }, { mount: .1 }); for (const x of [36.2, 40.2]) Wl('glasswall', 'y', x, { w: 3.8, h: 1.9, seed: x }, { glass: 1, mount: 2.3 });
  Wl('glasswall', 'x', 18.4, { w: 3, h: 2.2, seed: 8 }, { glass: 1, mount: 2.9 }); Wl('furn.lobby.restroom', 'x', 22.6, { c: '#3f8a8a', dc: '#1f6a7a' }); Wl('sign', 'x', 10.9, { t: 'SPLASHDOWN', w: 2.6, c: '#22304e', fg: '#f2c230' }, { mount: 2.75 });
  H('beacon', 34.3, .3, {}, { beacon: 1 }); H('bucketframe', LEIS.BUCKET.x - 1.5, LEIS.BUCKET.y - .58, {}, { bframe: 1 });
  H('fountain', 36.4, 16.4, { k: 'mushroom' }, { mush: 1 }); H('fountain', 43.4, 18.8, { k: 'arch' }); H('fountain', 43, 22.6, { k: 'whale' }); for (const [x, y] of [[38.4, 21.6], [40, 22.6], [41.6, 21.6]]) H('fountain', x - .3, y - .3, { k: 'geyser' }, { geyser: 1 });
  H('guardchair', 33.3, 14.2, {}, { guard: 1, flip: true }); H('guardchair', 10.6, 13.6, {}, { guard: 2 });
  H('cafecounter', .15, 15.6, {}, { cafe: 1 }); for (const [x, y, c] of [[3.6, 15], [6.6, 15.6, 1], [3.8, 18.4, 1], [7, 19], [4.4, 21.8], [7.6, 22.4, 1]]) H('cafetable', x, y, { c: c ? '#5ab0e0' : '#f2c230' }, { table: 1 });
  H('bridge', LEIS.BRIDGE.x0, LEIS.BRIDGE.y0, {}, { bridge: 1 }); H('tallpalm', 16.2, 12.2, { h: 3.2, seed: 3 }); H('tallpalm', 27.2, 13.4, { h: 2.7, seed: 6 }); H('tallpalm', 19, 15.6, { h: 2.3, seed: 9 }); H('tallpalm', 25.6, 10.6, { h: 3, seed: 12 }); H('rock', 17.6, 13.8, { s: 1.4 }); H('rock', 26, 15.4, { s: 1 }); H('rock', 23.6, 9.6, { s: 1.2 });
  H('kit', 12.2, 21.2, { k: 'rings' }, { rings: 1 }); H('kit', 34, 24.3, { k: 'noodles' }); H('plant', 44.6, 13.6, { h: 1.8, seed: 5 }); H('plant', 10.6, 24.6, { h: 2, seed: 8 }); H('plant', 33.6, .3, { h: 1.5, seed: 4 }); H('wetsign', 27, 24.4); H('wetsign', 34.2, 15.4);
  H('djbooth', 25.6, 22.9, {}, { dj: 1 }); H('furn.bar.discoball', 22, 22.4, {}, { dj: 1, z: 2.6, solid: false });
  S(.75, 18.2, 0, { kind: 'staff', label: CAFE_NAME, cafe: 1 }); S(.75, 19.6, 0, { kind: 'staff', label: CAFE_NAME, cafe: 1, p: .6 });
  S(2.6, 17.6, 2, { p: .5, swim: 1 }); S(11, 22, 1, { p: .5, swim: 1, label: 'Waiting for a ring' }); S(34.4, 12.6, 0, { p: .6, swim: 1, label: 'Parent', lines: ['She has been in the waves for an hour. She is nine. I am exhausted.'] }); S(36, 14.4, 3, { p: .5, swim: 1 }); S(39.6, 14.6, 3, { p: .5, swim: 1, anim: 'wave' }); S(44.2, 16.6, 2, { p: .7, swim: 1, label: 'Parent', lines: ['Mind the bucket. No, do not mind the bucket. Stand right under it.', 'He will sleep tonight. That is the whole point of this place.'] }); S(36.6, 24.9, 3, { p: .6, swim: 1, label: 'Parent' });
  S(9.6, 11.8, 1, { p: .6, swim: 1, age: 'kid', anim: 'cheer' }); S(9.4, 10.4, 2, { p: .5, swim: 1, label: 'Watching the splashdown' }); S(20.4, 4.4, 3, { p: .5, swim: 1 }); S(24.6, 4.2, 1, { p: .4, swim: 1 }); S(14, 23.4, 3, { p: .5, swim: 1, anim: 'talk' }); S(15, 23.6, 2, { p: .5, swim: 1 }); S(28.6, 5.4, 1, { p: .4, swim: 1 });
  defineRoom({ id: NR.leisure, name: 'Leisure Pool', w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'nat', floor: GT.f_tile, bg: '#122028', edge: '#3a4a50', wall: { color: '#eaf2ee', pattern: 'tile', trim: TEAL, h: 5.4 },
    exits: [{ x: 18, y: 25.3, label: 'Changing Village', to: 'int:' + NR.change, use: () => NS() && NS().go('change', 'leisure') }, { x: 25, y: 25.3, label: 'Competition Pool', to: 'int:' + NR.pool, use: () => NS() && NS().go('pool', 'leisure') }, { x: 45.3, y: 14.4, label: 'Lido (outdoor pool)', to: 'int:' + NR.lido, use: () => NS() && NS().go('lido') }],
    spawn: { x: 18, y: 24.3, dir: 3 }, items, npcSpots: spots,
    setup(sc) {
      const Wd = sc.world, P = swimPeople(), glass = by(Wd, 'glass'), eo = (x, y) => inEll(x, y, RV.cx, RV.cy, RV.rx, RV.ry), ei = (x, y) => inEll(x, y, RV.cx, RV.cy, RV.ix, RV.iy), inR = (x, y, q) => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1;
      floorDecal(sc, W, D, (x, y) => { const a = eo(x, y), b = ei(x, y), dt = Math.hypot(x - TUB.x, y - TUB.y);
        if (b < 1) { if (dt < TUB.r + .35) return dt > TUB.r + .12 ? '#b8a888' : '#e4d8c0'; if (b > .9) return '#d8c8a0'; const k = R.hash2(Math.floor(x * 5), Math.floor(y * 5), 3); return k > .93 ? '#d8c898' : k < .05 ? '#f6ecc8' : '#ead9b0'; }
        if (a < 1.1 && a >= 1) return a < 1.035 ? '#1f8fb0' : ((Math.floor(x * 4) + Math.floor(y * 4)) & 1 ? '#f4f8f8' : '#e6f0f2');
        const ew = Math.max(WV.x0 - x, x - WV.x1, WV.y0 - y), eb = y - WV.y1; if (ew < .3 && eb < 0 && ew > 0) return ew < .08 ? '#1f8fb0' : '#f4f8f8'; if (x >= WV.x0 - .3 && x <= WV.x1 + .3 && eb >= 0 && eb < 1) return (Math.floor(x * 3) + Math.floor(y * 3)) & 1 ? '#f0e2b8' : '#ead9a8';
        if (x > TD.x0 - .7 && x < TD.x1 + .5 && y > TD.y0 - .7 && y < TD.y1 + .5) { const i = (Math.floor(x) + Math.floor(y)) % 3; return i === 0 ? '#f6d86a' : i === 1 ? '#7fc8f0' : '#f6a8c0'; }
        const es = Math.max(SP.x0 - x, x - SP.x1, SP.y0 - y, y - SP.y1); if (es < .3) return es < .08 ? '#1f8fb0' : '#f4f8f8';
        if (x < 10.4 && y > 14.6) return (Math.floor(x) + Math.floor(y)) & 1 ? '#f4ecd4' : '#e8dcc0'; return deck('#dfeae6', '#d2e0dc')(x, y); });
      // nav: water is not walkable (the toddler pad is ankle deep and is)
      for (let gy = 0; gy < D * 2; gy++) for (let gx = 0; gx < W * 2; gx++) { const x = gx / 2 + .25, y = gy / 2 + .25; if ((eo(x, y) < 1.04 && ei(x, y) > .98) || Math.hypot(x - TUB.x, y - TUB.y) < TUB.r + .1 || inR(x, y, WV) || inR(x, y, SP) || (x < 10.2 && y < 10.6 && !(x > 5 && y > 4.2 && y < 5.5))) Wd.block(O + gx / 2, O + gy / 2, O + gx / 2 + .5, O + gy / 2 + .5); }
      Wd.free(O + LEIS.BRIDGE.x0, O + LEIS.BRIDGE.y0 - .2, O + LEIS.BRIDGE.x1, O + LEIS.BRIDGE.y1 + .2);
      { const s = by(Wd, 'slides')[0]; s.B = [s.x, s.y, 0, s.x + .3, s.y + .3, 7]; s.k = s.B[0] + s.B[3] + s.B[1] + s.B[4]; const b = by(Wd, 'bridge')[0]; b.B[2] = .42; b.B[5] = .5; for (const o of by(Wd, 'bframe')) { o.B = [o.B[0], o.B[1] + .5, 0, o.B[3], o.B[1] + .7, 3.3]; o.k = o.B[0] + o.B[3] + o.B[1] + o.B[4]; } }
      Wd.lights.push({ x: O + 22, y: O + 13, z: 0, r: 9, c: '#a8f4ec' }, { x: O + 40, y: O + 7, z: 0, r: 7, c: '#a8f0f8' }, { x: O + 40, y: O + 20, z: 0, r: 6, c: '#ffe9b0' }, { x: O + 5, y: O + 19, z: 0, r: 6, c: '#ffe2a0' }, { x: O + 5, y: O + 11.5, z: 0, r: 5, c: '#a8f0f8' }, { x: O + 13.4, y: O + 1.6, z: 0, r: 3, c: '#ffb878' }, { x: O + 17, y: O + 22, z: 0, r: 6, c: '#fff0d0' });
      /* ----- water ----- */
      const wRiver = waterLayer({ x0: O + RV.cx - RV.rx, y0: O + RV.cy - RV.ry, x1: O + RV.cx + RV.rx, y1: O + RV.cy + RV.ry, depth: (x, y) => (eo(x - O, y - O) <= 1 && ei(x - O, y - O) >= 1 ? .3 + .25 * Math.sin((x + y) * .4) ** 2 : -1), pal: PALS.leisure });
      const wTub = waterLayer({ x0: O + TUB.x - TUB.r, y0: O + TUB.y - TUB.r, x1: O + TUB.x + TUB.r, y1: O + TUB.y + TUB.r, depth: (x, y) => (Math.hypot(x - O - TUB.x, y - O - TUB.y) <= TUB.r ? .15 : -1), top: (x, y, d, f) => (R.hash2(Math.floor(x * 7) + f * 3, Math.floor(y * 7) - f, 5) > .86 ? '#ffffff' : null), pal: PALS.hot, dz: .1 }); wTub.fps = 8;
      const wWave = waterLayer({ x0: O + WV.x0, y0: O + WV.y0, x1: O + WV.x1, y1: O + WV.y1, depth: (x, y) => (inR(x - O, y - O, WV) ? Math.max(.02, .8 * (WV.y1 - (y - O)) / (WV.y1 - WV.y0)) : -1), pal: PALS.leisure, wave: true, dz: .1 });
      const wTod = waterLayer({ x0: O + TD.x0, y0: O + TD.y0, x1: O + TD.x1, y1: O + TD.y1, depth: (x, y) => (inR(x - O, y - O, TD) ? .06 : -1), pal: PALS.leisure, dz: .03 });
      const wSpl = waterLayer({ x0: O + SP.x0, y0: O + SP.y0, x1: O + SP.x1, y1: O + SP.y1, depth: (x, y) => (inR(x - O, y - O, SP) ? .25 : -1), pal: PALS.lane });
      sc.waters = [wSpl, wRiver, wTub, wWave, wTod];
      const TB = board(sc, { axis: 'x', x: O + .03, y: O + 10.9, z: 1.2, w: 2.6, h: 24, lit: true, bg: '#10141c' }); let tbLines = null;
      const drawTB = () => { TB.clear('#10141c'); const L = tbLines || ['TWISTER', 'BEST  9.8', 'PLUNGE', 'BEST  4.1']; L.forEach((l, i) => TB.text(l, 2, 1 + i * 6, i % 2 ? '#58e07a' : '#ffd24a')); }; drawTB();
      /* ----- life ----- */
      const fxOf = k => sc.fixtures.find(f => f.item[k]), sa = fxOf('sauna'), stm = fxOf('steam'), extra = [];
      const sit = (f, i, o) => { const s = f.seats[i]; extra.push(Object.assign({ x: s.x - O, y: s.y - O, z: s.z, dir: 1, seated: true, swim: 1, p: .55, label: 'In the heat' }, o)); };
      sit(sa, 0, { lines: ['Eighty-five degrees. Ten minutes. Then the barrel. Then you are a new person.'] }); sit(sa, 2, { age: 'elder' }); sit(stm, 1, { lines: ['I cannot see you. I can only hear you. Hello.'] });
      for (const f of sc.fixtures.filter(q => q.item.table)) f.seats.forEach((s, i) => { if ((i + Math.round(f.x)) % 2) extra.push({ x: s.x - O, y: s.y - O, z: s.z, dir: s.dir, seated: true, swim: 1, p: .5, anim: i % 2 ? 'eat' : 'drink', age: i === 3 ? 'kid' : undefined, label: 'At the cafe' }); });
      for (const f of sc.fixtures.filter(q => q.item.lounger)) if (Math.round(f.x * 3) % 2) extra.push({ x: f.seats[0].x - O, y: f.seats[0].y - O, z: f.seats[0].z, dir: 1, seated: true, swim: 1, p: .6, anim: 'read', label: 'On a lounger' });
      const cr = crowd(sc, sc.def.npcSpots.concat(extra), { seed: 33, fill: .65, lines: ['Chips taste better when you are wet. It is science.', 'The red slide is over before you know it. The blue one is not.', 'Sauna, plunge, sauna, plunge. I am basically a Viking.', 'Hot tub on the island. Go over the bridge.'] });
      dress(cr, (s, c) => (s.kind === 'staff' ? P.staff[c.roll > .5 ? 0 : 3] : s.swim ? (s.age === 'kid' ? P.kid[Math.floor(c.roll * 31) % P.kid.length] : s.age === 'elder' ? P.elder[Math.floor(c.roll * 31) % P.elder.length] : P.adult[Math.floor(c.roll * 61) % P.adult.length]) : null));
      for (const c of cr.list) if (c.spot.cafe) { const it = sc.interactables.find(i => i.ent === c); if (it) it.use = () => NS() && NS().cafe(); }
      const gfx = sc.fixtures.filter(f => f.item.guard), guards = gfx.map((f, i) => { const s = f.seats[0], c = person(sc, P.guard[i + 2], s.x, s.y, f.item.flip ? 0 : 1, { pose: 'sit', poseOpts: { seated: true } }); c.zoff = s.z; c.update = function (dt) { this.t += dt; this.z = this.zoff; }; sc.interactables.push({ ent: c, x: c.x, y: c.y, label: 'Lifeguard', h: 2.6, hit: 12, range: 2.2, visible: () => !c.hidden, use: () => bubble(c, pick(['One at a time on the slides. Feet first.', 'Waves on the hour and the half hour. Hold on to the little ones.', 'WALK, please.']), 3000) }); return c; });
      const F = (x, y) => [O + x, O + y], st = stroll(sc, P.adult.concat(P.kid.slice(0, 4)), [[F(11.5, 24), F(33, 24), F(34.2, 15), F(34.2, 5)], [F(10.6, 12), F(10.6, 22.5), F(20, 23.6)], [F(11, 5.2), F(24, 5.2), F(33.6, 5.4), F(34.2, 13.6)], [F(18, 24.6), F(21.6, 21.6), F(22, 18)], [F(34.4, 14.6), F(44, 14.6)]], 9);
      // lazy river tubes
      const tubes = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const L = look(i % 4 === 3 ? P.kid[i % P.kid.length] : P.adult[(i * 5) % P.adult.length]), e = ent(sc, 0, 0, -.1, null, [-.4, -.3, .4, .3, .3]); e.a = i * .7 + (i % 2) * .2; e.col = FLOATS[i % FLOATS.length]; e.L = L; e.sprite = () => tubeSpr(e.col, e.L, Math.floor(G.time * 1.5 + e.a) & 1, sc.nat.party); return e; });
      const mine = ent(sc, 0, 0, -.1, null, [-.4, -.3, .4, .3, .3]); mine.hidden = true; mine.a = 0; mine.col = '#f28fb0'; mine.L = look(G.state.player.spec); mine.sprite = () => tubeSpr(mine.col, mine.L, Math.floor(G.time * 1.5) & 1, sc.nat.party);
      const river = { tubes, mine, speed: .115, a0: Math.atan2((LEIS.RIVER_IN.y - RV.cy) / RV.ry, (LEIS.RIVER_IN.x - RV.cx) / RV.rx), turned: 0, ride(on) { mine.hidden = !on; if (on) { mine.a = river.a0; river.turned = 0; mine.L = look(G.state.player.spec); } return river.turned; }, laps: () => Math.floor(river.turned / 6.2832 + .02) };
      // wave pool
      const bobs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => { const x = WV.x0 + .8 + ((i * 3.7) % (WV.x1 - WV.x0 - 1.6)), y = WV.y0 + 1.2 + ((i * 2.3) % (WV.y1 - WV.y0 - 3)), dep = (WV.y1 - y) / (WV.y1 - WV.y0), e = wader(sc, i % 3 === 1 ? P.kid[i % P.kid.length] : P.adult[(i * 7 + 2) % P.adult.length], O + x, O + y, Math.round(7 + dep * 13), i % 4 === 0 ? 'wave' : null); e.base = e.cut; e.ch.dir = (i % 2) ? 1 : 0; return e; });
      const myBob = wader(sc, G.state.player.spec, O + 40, O + 9.5, 15); myBob.hidden = true; myBob.base = 15;
      const beacon = by(Wd, 'beacon')[0]; let wOn = false, bl = 0;
      const wave = { on: false, spot: { x: O + 40, y: O + WV.y1 + .7 }, me: myBob, wade(on) { myBob.hidden = !on; if (on) myBob.ch.setSpec(G.state.player.spec); }, crest: y => Math.sin((y - O) * 1.25 - 6.2832 * ((G.time * wWave.fps / 6) % 1)) };
      // toddler zone
      const kids = [0, 1, 2, 3, 4, 5].map(i => { const c = person(sc, P.kid[(i * 3 + 2) % P.kid.length], O + TD.x0 + 1 + i * 1.3, O + TD.y0 + 2 + (i % 3) * 2, 1, { label: 'Kid', spd: 1.2 + (i % 3) * .5 }); c.tx = c.x; c.ty = c.y; c.think = i; return c; });
      const jets = by(Wd, 'geyser').map((o, i) => { const j = jet(sc, o.x + .3, o.y + .3, .1, 'up'); j.ph = i * 2.1; return j; }), mj = jet(sc, O + 37.1, O + 17.1, 0, 'mush');
      const bOb = Wd.place('furn.nat.bucket', O + LEIS.BUCKET.x - .75, O + LEIS.BUCKET.y - .3, { z: 2.15, solid: false, p: { tilt: 0 } }); bOb.B = [bOb.x, bOb.y, 2.1, bOb.x + 1.5, bOb.y + .6, 3.3];
      const bucket = { t: BUCKET * .4, spot: { x: O + LEIS.BUCKET.x + .9, y: O + LEIS.BUCKET.y + .1 }, left: () => Math.max(0, BUCKET - bucket.t), onTip: null };
      // slides
      const PATHS = { flume: FLUME_S, drop: DROP_S }, LEN = { flume: pathLen(FLUME_S), drop: pathLen(DROP_S) };
      const rider = (id, L) => { const p = PATHS[id], e = ent(sc, 0, 0, 0, () => riderSpr(L), [-.2, -.2, .2, .2, .5]); const C = { ent: e, L: LEN[id], s: 0, at(s) { C.s = s; const q = pathAt(p, Math.min(s, C.L)); e.x = O + q[0]; e.y = O + q[1]; e.z = q[2] + .05; return q; }, end(big) { const q = pathAt(p, C.L); splash(sc, O + q[0], O + q[1] + .3, big ? 2 : 1); e.hidden = true; e.dead = true; sc._fxn = (sc._fxn || 0) + 1; } }; C.at(0); return C; };
      let npcR = null, npcT = 5;
      // party
      const dj = by(Wd, 'dj'), djc = person(sc, Object.assign({}, P.adult[3], { outfit: null, top: 'graphic', topColor: '#f28fb0', bottom: 'shorts', bottomColor: '#33303f', hat: 'cap', hatColor: '#a8d84a' }), O + 26.8, O + 22.7, 1, { hidden: true, pose: 'dance', label: STAFF.dj });
      sc.interactables.push({ ent: djc, x: djc.x, y: djc.y, label: 'Dance at the pool party', h: 1.6, hit: 16, range: 3, visible: () => !djc.hidden, use: () => NS() && NS().party() });
      const dancers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => person(sc, P.adult[(i * 3 + 1) % P.adult.length], O + 23.6 + (i % 5) * 1.25 + (i > 4 ? .5 : 0), O + 24.3 + Math.floor(i / 5) * .8, 3, { hidden: true, pose: 'dance' }));
      const tubW = [0, 1, 2].map(i => { const e = wader(sc, P.adult[(i * 4 + 9) % P.adult.length], O + TUB.x - .8 + i * .8, O + TUB.y - .3 + (i % 2) * .7, 19); e.z = -.05; return e; });
      const PC = ['#ff5aa0', '#5ab0ff', '#a8ff5a', '#ffd24a', '#b07aff'];
      sc.lights = (m, cam, pool) => { if (!sc.nat.party) return; for (let i = 0; i < 6; i++) { const a = G.time * (.5 + i * .13) + i * 1.9, x = O + 22 + Math.cos(a) * (9 + i), y = O + 14 + Math.sin(a * 1.3) * 8, s = R.WS(x, y, 0), ps = pool(3, PC[i % 5]); m.drawImage(ps, Math.round(s[0]) - cam.x - (ps.width >> 1), Math.round(s[1]) - cam.y - (ps.height >> 1)); } };
      /* ----- sync ----- */
      let tick = 0, view = null, lvl = -1, party = null;
      function sync() {
        const n = G.now(), h = n.hf, hrs = n.weekday === 4 ? HOURS.leisureFri : HOURS.leisure, op = inH(h, hrs), v = viewNow(); if (v !== view) { view = v; for (const o of glass) setP(o, { time: v }); }
        const pt = op && !!sessionNow(n, 'leisure'), L = !op ? 0 : pt ? 1 : h < 11 ? .45 : h < 17 ? .85 : .6; sc.nat.open = op;
        if (L !== lvl || pt !== party) { lvl = L; party = pt; sc.nat.party = pt; cr.show(op, L > .8); st.setActive(Math.round(L * 9)); tubes.forEach((e, i) => { e.hidden = i >= Math.round(L * 9); }); bobs.forEach((e, i) => { e.hidden = i >= Math.round(L * 11); }); kids.forEach((c, i) => { c.hidden = pt || i >= Math.round(L * 6); }); tubW.forEach((e, i) => { e.hidden = i >= Math.round(L * 3); }); guards.forEach(g => { g.hidden = !op; });
          for (const o of dj) showOb(Wd, o, pt); djc.hidden = !pt; dancers.forEach(c => { c.hidden = !pt; }); }
        const w = waveOn(G.state.t), on = op && w.on; if (on !== wOn) { wOn = on; wave.on = on; wWave.mode = on ? 'wave' : 'calm'; if (!on) setP(beacon, { on: 0, f: 0 }); bobs.forEach(e => { e.ch.pose = on ? (Math.random() < .6 ? 'cheer' : 'wave') : null; }); G.emit('natatorium:waves', on); }
        sc.life.open = op;
      }
      sc.nat = { river, wave, bucket, rider, slideBoard(l) { tbLines = l; drawTB(); }, climb: [[5.4, 4.9, 0], [4.6, 5.3, 0], [4.6, 1.2, 4.02], [2.6, 2.3, 4.02]], pathAt: (id, s) => pathAt(PATHS[id], s), tubSpot: { x: O + TUB.x + .2, y: O + TUB.y + TUB.r + .6 }, tubMe: null, party: false, open: true, sync, guards, fx: { sa, stm, plunge: fxOf('plunge') }, npcHold(s) { npcT = Math.max(npcT, s); } };
      sc.nat.tubMe = wader(sc, G.state.player.spec, O + TUB.x + .2, O + TUB.y + .6, 19); sc.nat.tubMe.hidden = true; sc.nat.tubMe.z = -.05;
      hook(sc, 'cafe', CAFE_NAME, () => NS().cafe()); hook(sc, 'sauna', 'Sauna', f => NS().sauna(f, 'sauna')); hook(sc, 'steam', 'Steam room', f => NS().sauna(f, 'steam')); hook(sc, 'plunge', 'Cold plunge', f => NS().plunge(f)); hook(sc, 'lounger', 'Lounger', f => NS().lounger(f)); hook(sc, 'table', 'Cafe table', f => NS().cafe());
      sc.interactables.push({ x: O + 4.6, y: O + 5, label: 'Climb the slide tower', h: 2, hit: 18, range: 1.6, spot: { x: O + 5.4, y: O + 4.9 }, use: () => NS() && NS().slides() });
      sc.interactables.push({ x: O + LEIS.RIVER_IN.x + .5, y: O + LEIS.RIVER_IN.y - .5, label: 'Lazy river: take a ring', h: .6, hit: 18, range: 1.8, spot: { x: O + LEIS.RIVER_IN.x, y: O + LEIS.RIVER_IN.y }, use: () => NS() && NS().river() });
      sc.interactables.push({ x: O + 40, y: O + WV.y1 - .3, label: 'Wade into the wave pool', h: .4, hit: 40, range: 2, spot: wave.spot, use: () => NS() && NS().waves() });
      sc.interactables.push({ x: O + LEIS.BUCKET.x + .8, y: O + LEIS.BUCKET.y, label: 'Stand under the tipping bucket', h: 2.6, hit: 20, range: 1.8, spot: bucket.spot, use: () => NS() && NS().bucket() });
      sc.interactables.push({ x: O + TUB.x, y: O + TUB.y + .8, label: 'The island hot tub', h: .4, hit: 22, range: 1.8, spot: sc.nat.tubSpot, use: () => NS() && NS().hotTub() });
      sc.interactables.push({ x: O + .2, y: O + 12.2, label: 'Splashdown times', h: 2.6, hit: 16, range: 3.4, spot: { x: O + 9.3, y: O + 12 }, use: () => NS() && NS().lookSlideBoard() });
      const base = hallEnv(Wd, .62, .5, '#dffff4'); sc.env = t => { const e = base(t); if (sc.nat.party) return { amb: '#6a62a8', dark: .85, bg: Wd.bg, night: true }; return e; };
      wireLife(sc, [cr, st, { count: () => tubes.filter(e => !e.hidden).length + bobs.filter(e => !e.hidden).length + kids.filter(c => !c.hidden).length }]); sync();
      const u0 = sc.update; sc.update = (dt, gm) => {
        u0(dt, gm); cr.update(dt); st.update(dt); sweep(sc); if ((tick -= dt) <= 0) { tick = 1; sync(); }
        const da = river.speed * dt; for (const e of tubes) { e.a += da; const q = riverPt(e.a); e.x = O + q[0]; e.y = O + q[1]; } if (!mine.hidden) { mine.a += da; river.turned += da; const q = riverPt(mine.a); mine.x = O + q[0]; mine.y = O + q[1]; }
        const fr = (G.time * wWave.fps / 6) % 1; if (wOn) { for (const e of bobs) e.bob = Math.round(Math.sin((e.y - O) * 1.25 - 6.2832 * fr) * -4); myBob.bob = Math.round(Math.sin((myBob.y - O) * 1.25 - 6.2832 * fr) * -4); if ((bl -= dt) <= 0) { bl = .35; setP(beacon, { on: 1, f: beacon.p.f ? 0 : 1 }); } } else if (bobs[0].bob) { for (const e of bobs) e.bob = 0; myBob.bob = 0; }
        for (const j of jets) j.pw = .45 + .55 * Math.abs(Math.sin(G.time * .8 + j.ph));
        for (const c of kids) { if (c.hidden) continue; c.t += dt; if (c._hold > 0) { c._hold -= dt; c.moving = false; continue; } const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy); if (d < .15) { c.moving = false; if ((c.think -= dt) <= 0) { c.think = .5 + Math.random() * 3; c.tx = O + TD.x0 + .6 + Math.random() * (TD.x1 - TD.x0 - 1.4); c.ty = O + TD.y0 + .6 + Math.random() * (TD.y1 - TD.y0 - 1.2); c.pose = null; c.fast = Math.random() < .25; if (c.fast && !guards[0].hidden && Math.random() < .5) { bubble(guards[0], 'PHWEEET! No running!', 2200, 'shout'); c.fast = false; } } } else { const v = (c.fast ? 3.4 : c.spd) * dt; c.x += dx / d * Math.min(d, v); c.y += dy / d * Math.min(d, v); c.face(dx, dy); c.moving = true; c.pose = c.fast ? 'run' : null; } }
        // the tipping bucket
        if (sc.nat.open) { bucket.t += dt; const b = bucket.t, tl = b > BUCKET + 1.6 ? 0 : b > BUCKET + .5 ? 3 : b > BUCKET ? 2 : b > BUCKET - 1 ? 1 : 0; if (tl !== bOb.p.tilt) { setP(bOb, { tilt: tl }); if (tl === 3) { splash(sc, O + LEIS.BUCKET.x + .9, O + LEIS.BUCKET.y + .1, 2, .05); splash(sc, O + LEIS.BUCKET.x + 1.3, O + LEIS.BUCKET.y - .2, 1, .05); for (const c of kids) if (!c.hidden && Math.hypot(c.x - bucket.spot.x, c.y - bucket.spot.y) < 3) { c.pose = 'cheer'; c._hold = 1.6; } if (bucket.onTip) bucket.onTip(); G.emit('natatorium:bucket'); } } if (b > BUCKET + 1.6) bucket.t = 0; if (b > BUCKET - 9 && b < BUCKET - 8.9 + dt) for (const c of kids.slice(0, 3)) { c.tx = bucket.spot.x + (Math.random() - .5) * 1.2; c.ty = bucket.spot.y + (Math.random() - .3) * 1.2; c.think = 9; } }
        // NPC slide riders
        if (sc.nat.open && !sc.nat.party) { if (npcR) { npcR.v = Math.min(npcR.vmax, npcR.v + dt * 3); npcR.c.at(npcR.c.s + npcR.v * dt); if (npcR.c.s >= npcR.c.L) { npcR.c.end(npcR.id === 'drop'); npcR = null; npcT = 6 + Math.random() * 9; } } else if ((npcT -= dt) <= 0) { const id = Math.random() < .6 ? 'flume' : 'drop'; npcR = { id, c: rider(id, look(pick(P.adult.concat(P.kid)))), v: 1, vmax: id === 'drop' ? 5.2 : 3.1 }; } }
        // you, on the bridge
        const p = G.player; if (!G.busy && !G.cutscene) { const bx = p.x - O, byy = p.y - O; if (bx > LEIS.BRIDGE.x0 - .1 && bx < LEIS.BRIDGE.x1 + .1 && byy > LEIS.BRIDGE.y0 && byy < LEIS.BRIDGE.y1) p.zoff = .12 + Math.sin((byy - LEIS.BRIDGE.y0) / 3 * 3.1416) * .5; else if (p.zoff && sc.roomId === NR.leisure) p.zoff = 0; }
      };
      const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); view = null; lvl = -1; sync(); if (NS()) NS().arrived('leisure', sc, pv); };
      const x0 = sc.onExit; sc.onExit = to => { x0(to); mine.hidden = true; myBob.hidden = true; sc.nat.tubMe.hidden = true; G.player.zoff = 0; if (NS()) NS().left('leisure', sc); };
    } });
}
