// Airport tram: scene 'airtram' - a small automated people-mover (cutaway car) linking Concourse B and the Main Terminal.
//   G.airtram = { ride(to: 'terminal' | 'concourse') -> Promise, state(), scene(), DEST }      events 'ride:start' / 'ride:end' ('airtram', to)
//   The ride takes ~12 s: doors close, tunnel lights streak by, the car pops out beside the runway (an airliner takes off), tunnel again,
//   doors open and the player is dropped on the other platform. The player can walk around the car during the ride.
// Also registers the city-side doors of the terminal building ("Maple Bay Intl" interactables at the ARRIVALS / DEPARTURES doors -> airport:terminal).
// Tuning: RIDE (s), VMAX (units/s), A1/A2 (where the tunnel opens/closes, fraction of the trip), PAX.
import { G } from '../core/game.js';
import { World } from '../engine/world.js';
import { asset } from '../art/registry.js';
import { assetSprite } from '../engine/sprites.js';
import { Char } from '../core/char.js';
import { WS, mix } from '../engine/raster.js';
import { ambient } from '../core/clock.js';
import { caption } from '../ui/goals.js';
import { anySpec } from './rooms/_airport_life.js';

export const order = 67;
const OX = 4, OY = 4, LEN = 9, DEP = 4, DOOR = 3.5, DW = 1.6, T0 = 1.1, RIDE = 10, RAMP = 2.2, VMAX = 24, TOTAL = VMAX * (RIDE - RAMP), A1 = TOTAL * .2, A2 = TOTAL * .8, PAX = 5;
const DEST = { terminal: { room: 'int:airport:terminal', x: 36.5, y: 2.9, name: 'Main Terminal and Baggage Claim', short: 'TERMINAL' }, concourse: { room: 'int:airport:concourse', x: 61.5, y: 3.2, name: 'Gates B1 to B6', short: 'GATES B' } };

function makeScene() {
  const W = new World(LEN + 8, DEP + 8, { name: 'airtram', bg: '#14151d' }); W.skirt = 0; W.zmax = 3; W.bakeTerrainNav(); W.block(0, 0, W.w, W.h); W.free(OX + .5, OY + .5, OX + LEN, OY + DEP);
  const sc = { world: W, ents: [], interactables: [], indoor: true, isTram: true }, st = { to: 'terminal', t: 0, s: 0, v: 0, door: 1, done: false };
  W.place('furn.airport.tram.floor', OX, OY, { p: { len: LEN, d: DEP, doors: [DOOR] } });
  const wall = W.place('furn.airport.tram.wall', OX, OY, { p: { len: LEN, doors: [DOOR], text: 'TERMINAL' } }); W.place('furn.airport.tram.end', OX, OY, { p: { d: DEP } });
  W.place('furn.train.sill', OX, OY + DEP, { p: { len: LEN } }); W.place('furn.train.sill', OX + LEN, OY, { p: { len: DEP }, flip: true });
  const pa = asset('furn.airport.tram.perch'), seats = [];
  for (const [x, n] of [[.5, 5], [5.5, 6]]) { const ob = W.place(pa, OX + x, OY + .5, { p: { n } }); for (const s of pa.seats({ n })) seats.push({ x: ob.x + s.x, y: ob.y + s.y, z: s.z }); }
  for (const x of [2.5, 7]) W.place('furn.train.pole', OX + x, OY + 2.5, {});
  for (const x of [2, 6.5]) W.lights.push({ x: OX + x, y: OY + 2.2, z: 0, r: 3.4, c: '#eaf6ff' });
  const da = asset('furn.airport.tram.door'), door = { x: OX + DOOR, y: OY + .25, z: 0, bb: [0, 0, DW, .1, 1.9], sprite() { return assetSprite(da, { open: Math.round(st.door * 4) / 4 }); } }; sc.ents.push(door);
  const pax = [], camT = { x: 0, y: 0, z: 0 }, STANDS = [[2.1, 2.9, 1], [7.4, 2.7, 0], [5.2, 3.1, 3], [1.2, 2.2, 0]];
  const fill = () => { for (const c of pax) { const i = sc.ents.indexOf(c); if (i >= 0) sc.ents.splice(i, 1); } pax.length = 0; const free = seats.slice(); for (let i = 0; i < PAX; i++) { const c = new Char(anySpec(), 0, 0); if (i < 3) { const s = free.splice(Math.floor(Math.random() * free.length), 1)[0]; c.x = s.x; c.y = s.y; c.z = s.z; c.dir = 1; c.poseOpts = { seated: true }; c.pose = Math.random() < .5 ? 'phone' : 'sit'; } else { const q = STANDS[i - 3]; c.x = OX + q[0]; c.y = OY + q[1]; c.dir = q[2]; c.pose = Math.random() < .5 ? 'phone' : null; if (Math.random() < .6) c.poseOpts = null; } pax.push(c); sc.ents.push(c); } };

  sc.update = dt => {
    st.t += dt; const t = st.t - T0, p = G.player;
    st.v = t < 0 || t > RIDE ? 0 : VMAX * Math.max(0, Math.min(1, t / RAMP, (RIDE - t) / RAMP)); st.s = Math.min(TOTAL, st.s + st.v * dt);
    const want = t > RIDE + .15 ? 1 : 0; if (st.t < T0 && want === 0 && st.door === 1 && st.t > .15) G.audio && G.audio.sfx && G.audio.sfx('train_door');
    st.door = Math.max(0, Math.min(1, st.door + (want ? 1 : -1) * dt * 1.6));
    for (const c of pax) c.t += dt;
    const k = st.v / VMAX; camT.x = p.x; camT.y = p.y; camT.z = p.z + Math.sin(G.time * 6.3) * .012 * k; st.jit = Math.round(Math.sin(G.time * 13) * .6 * k);
    if (!st.said && t > RIDE - 2.6) { st.said = 1; G.audio && G.audio.sfx && G.audio.sfx('train_chime'); caption('Tram', 'Arriving at ' + DEST[st.to].name + '.', 3000); }
    if (!st.done && t > RIDE + 1.1 && !G.modal) { st.done = true; const d = DEST[st.to]; G.emit('ride:end', 'airtram', st.to); G.go(d.room, { x: d.x, y: d.y, dir: 1 }); }
  };
  sc.env = t => { const o = ambient(t, G.state.weather); return { amb: mix('#ffffff', '#d6e0f0', o.dark * .5), dark: .15 + o.dark * .5, bg: '#14151d', night: o.night }; };
  sc.spawn = () => ({ x: OX + DOOR + DW / 2, y: OY + 1.4, dir: 1 });
  sc.onEnter = opts => {
    st.to = (opts && opts.to) || G.state.flags.airtramTo || 'terminal'; if (!DEST[st.to]) st.to = 'terminal'; G.state.flags.airtramTo = st.to;
    Object.assign(st, { t: 0, s: 0, v: 0, door: 1, done: false, said: 0 }); wall.p = Object.assign({}, wall.p, { text: DEST[st.to].short }); wall._key = null; fill();
    camT.x = G.player.x; camT.y = G.player.y; camT.z = 0; G.camTarget = camT; G.snapCam && G.snapCam(); G.emit('ride:start', 'airtram', st.to);
    caption('Tram', 'Doors closing. Next stop: ' + DEST[st.to].name + '.', 3400);
  };
  sc.onExit = () => { st.done = true; if (G.camTarget === camT) G.camTarget = null; };

  /* ---- backdrop: tunnel / airfield sliding by (drawn under the car) ---- */
  const plane = asset('veh.airport.airliner'), shadow = (() => { try { return asset('veh.airport.airliner.shadow'); } catch (e) { return null; } })();
  sc.drawBack = (ctx, cam) => {
    const dir = st.to === 'terminal' ? 1 : -1, c = dir > 0 ? st.s : TOTAL - st.s, env = G.env || { dark: 0 }, dkk = Math.min(.75, (env.dark || 0) * .9), col = h => mix(h, '#10142a', dkk), jy = st.jit || 0;
    const P = (x, y, z = 0) => { const s = WS(x, y, z); return [Math.round(s[0] - cam.x), Math.round(s[1] - cam.y + jy)]; }, X = x => OX + (x - c);
    const poly = (pts, f) => { ctx.fillStyle = f; ctx.beginPath(); pts.forEach((q, i) => { const s = P(q[0], q[1], q[2] || 0); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fill(); };
    const band = (x0, x1, y0, y1, f) => poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], f);
    ctx.fillStyle = '#14151d'; ctx.fillRect(0, 0, G.W, G.H);
    const lo = OX - 45, hi = OX + LEN + 45, xa = Math.max(lo, X(A1)), xb = Math.min(hi, X(A2 + LEN));
    if (xb > xa) {
      ctx.save(); ctx.beginPath(); [[xa, -60], [xb, -60], [xb, 70], [xa, 70]].forEach((q, i) => { const s = P(q[0], q[1], 0); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.clip();
      ctx.fillStyle = col('#6fae5a'); ctx.fillRect(0, 0, G.W, G.H);
      for (let k = Math.floor((c - 50) / 7); k < (c + 60) / 7; k++) { const x = X(k * 7), y = ((k * 37) % 23) - 40 + (k % 2) * 62; band(x, x + 1.6, y, y + .8, col('#62a04f')); }
      band(lo, hi, OY - 16, OY - 8, col('#4a4f5a')); band(lo, hi, OY - 15.7, OY - 15.5, col('#e8e2d0')); band(lo, hi, OY - 8.5, OY - 8.3, col('#e8e2d0'));
      for (let k = Math.floor((c - 50) / 5); k < (c + 60) / 5; k++) { const x = X(k * 5); band(x, x + 2.4, OY - 12.15, OY - 11.85, col('#e8e2d0')); ctx.fillStyle = '#9fc4ff'; const s = P(x, OY - 7.7, .1), s2 = P(x, OY - 16.3, .1); ctx.fillRect(s[0], s[1] - 1, 2, 2); ctx.fillRect(s2[0], s2[1] - 1, 2, 2); }
      band(lo, hi, OY + DEP + 4, OY + DEP + 7.5, col('#5a5f6a')); band(lo, hi, OY + DEP + 5.65, OY + DEP + 5.85, col('#f2c230'));
      band(lo, hi, OY - 1.2, OY + DEP + 1.2, col('#8d949c')); for (let k = Math.floor((c - 50) / 2); k < (c + 60) / 2; k++) { const x = X(k * 2); band(x, x + .35, OY - 1.2, OY + DEP + 1.2, col('#7a818a')); }
      band(lo, hi, OY - 1.4, OY - 1.2, col('#c9d0d6')); band(lo, hi, OY + DEP + 1.2, OY + DEP + 1.4, col('#c9d0d6'));
      const tau = st.t - T0, vp = Math.max(0, 11 * (tau - 1.2)), xp = A1 + 12 + .5 * 11 * Math.max(0, tau - 1.2) ** 2, zp = vp > 44 ? (vp - 44) * (vp - 44) * .02 : 0, px = X(xp);
      if (px > lo - 30 && px < hi + 10) try {
        if (shadow) { const sh = assetSprite(shadow, { dir: 1 }), q = P(px, OY - 20.5, 0); ctx.globalAlpha = Math.max(.25, 1 - zp * .06); ctx.drawImage(sh.c, q[0] + sh.x, q[1] + sh.y); ctx.globalAlpha = 1; }
        const sp = assetSprite(plane, { dir: 1, gear: zp < 4 }), q = P(px, OY - 20.5, zp + Math.min(1, zp * .3)); ctx.drawImage(sp.c, q[0] + sp.x, q[1] + sp.y);
      } catch (e) { }
      ctx.restore();
    }
    // tunnel: far wall, ribs, lights
    const seg = (t0, t1) => { const x0 = Math.max(lo, X(t0)), x1 = Math.min(hi, X(t1)); if (x1 <= x0) return;
      poly([[x0, OY - 1.6, 0], [x1, OY - 1.6, 0], [x1, OY - 1.6, 3.4], [x0, OY - 1.6, 3.4]], '#20222e'); band(x0, x1, OY - 1.6, OY + DEP + 9, '#191a24'); band(x0, x1, OY - 1.2, OY + DEP + 1.2, '#22242f');
      poly([[x0, OY - 1.6, 1.2], [x1, OY - 1.6, 1.2], [x1, OY - 1.6, 1.32], [x0, OY - 1.6, 1.32]], '#2f3342');
      for (let k = Math.ceil((t0 - 2) / 4); k * 4 < t1; k++) { const x = X(k * 4); if (x < x0 || x > x1 - .3) continue; poly([[x, OY - 1.6, 0], [x + .3, OY - 1.6, 0], [x + .3, OY - 1.6, 3.4], [x, OY - 1.6, 3.4]], '#2a2d3c'); band(x, x + .3, OY - 1.6, OY + DEP + 9, '#20222e');
        if (k % 2 === 0) { const sm = Math.min(2.2, st.v * .05); poly([[x - sm, OY - 1.6, 2.5], [x + .9, OY - 1.6, 2.5], [x + .9, OY - 1.6, 2.72], [x - sm, OY - 1.6, 2.72]], '#ffe9b8'); poly([[x - sm - .6, OY - 1.6, 2.42], [x + 1.4, OY - 1.6, 2.42], [x + 1.4, OY - 1.6, 2.5], [x - sm - .6, OY - 1.6, 2.5]], '#6a5f4a'); band(x - sm, x + 1.2, OY - 1.4, OY - .6, '#2c2e3a'); } } };
    seg(-60, A1); seg(A2 + LEN, TOTAL + 80);
    for (const t of [A1, A2 + LEN]) { const x = X(t); if (x > lo && x < hi) { poly([[x - .25, OY - 1.6, 0], [x + .25, OY - 1.6, 0], [x + .25, OY - 1.6, 3.6], [x - .25, OY - 1.6, 3.6]], '#8d949c'); band(x - .25, x + .25, OY - 1.6, OY + DEP + 9, '#6a707a'); } }
  };
  G.airtram._st = st; G.airtram._sc = sc;
  return sc;
}

export function init() {
  G.airtram = { DEST, _st: null, _sc: null, state() { return this._st; }, scene() { return this._sc; }, ride(to) { if (G.scene && G.scene.id === 'airtram') return Promise.resolve(null); return G.go('airtram', { to: DEST[to] ? to : 'terminal' }); } };
  G.registerScene('airtram', () => makeScene());
  // city side: the terminal building's street doors lead into the main terminal
  let added = false;
  G.on('scene', sc => {
    if (added || !sc || sc.id !== 'city') return; added = true; const ap = (sc.world && sc.world.airport) || {}, h = ap.hall || ap.terminal || { x: 316, y: 90, w: 20 }, y = h.y + (h.d || 10);
    for (const [x, label] of [[h.x + 4, 'Maple Bay Intl - Arrivals'], [h.x + (h.w || 20) - 4, 'Maple Bay Intl - Departures']])
      G.addInteractable({ scene: 'city', x, y: y + .2, h: 1.6, hit: 16, range: 1.7, spot: { x, y: y + 1 }, label, visible: () => !(G.intro && G.intro.active), use: () => G.go('int:airport:terminal') });
  });
}
