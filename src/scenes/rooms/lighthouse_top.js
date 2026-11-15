// Gull Point Lighthouse — the lantern room and the open gallery (room `lighthouse_lantern`, 13 x 13, outdoors: real weather, wind and night). Gameplay: sim/lighthouse.js.
// In the middle the great lens on its pedestal inside a ring of glazing (door gap toward the camera); around it the gallery deck and its rail; both back walls are the bay panorama, repainted by
// time of day, weather and season (the city and the Bay Wheel on one side, the open sea on the other). Named ships cross the horizon on their timetable, gulls circle, the flag mast flies the hoist.
// At night (and in fog) the lens turns and throws two beams (a canvas overlay); on festival nights the beam changes colour. Fog sounds the horn.
// scene.lh = { sync(), keeper, lens, turn (rad), ships: [...], gulls }. Exit: the hatch (doormat) down to the watch room.
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import * as R from '../../engine/raster.js';
import { pixSprite } from '../../engine/sprites.js';
import { defineRoom, registerFixture } from '../interior.js';
import { setP, viewNow } from './fishmarket.js';
import { O, LS, only, mkKeeper, animal } from './lighthouse.js';
import { shipPx } from '../../art/showpiece/_lh_lib.js';
import { LR, LV, NAME } from '../../data/lighthouse.js';

const W = 13, C = 6.5, RG = 2.4, RR = 4.7, PH = 6, HZ = PH * .42, items = [];
const H = (id, x, y, p, o) => { const it = Object.assign({ id: 'furn.lh.' + id, x, y, p: p || {} }, o); items.push(it); return it; };
items.push({ id: 'furn.lh.pano', wall: 'y', at: 0, p: { w: W, h: PH, side: 'bay', time: 'day' }, pano: 1 }, { id: 'furn.lh.pano', wall: 'x', at: 0, p: { w: W, h: PH, side: 'sea', time: 'day' }, pano: 1 });
const seg = (id, r, n, skip, tag) => { for (let k = 0; k < n; k++) { if (skip && skip(k)) continue; const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2, x0 = C + Math.cos(a0) * r, y0 = C + Math.sin(a0) * r, x1 = C + Math.cos(a1) * r, y1 = C + Math.sin(a1) * r, mx = Math.min(x0, x1), my = Math.min(y0, y1); H(id, mx, my, { x0: +(x0 - mx).toFixed(3), y0: +(y0 - my).toFixed(3), x1: +(x1 - mx).toFixed(3), y1: +(y1 - my).toFixed(3) }, { solid: false, [tag]: k }); if (Math.cos((a0 + a1) / 2 - Math.PI / 4) > .1) items[items.length - 1].p.front = 1; } };
seg('glazing', RG, 12, k => k === 1, 'glz'); seg('rail', RR, 20, null, 'rl');
H('lens', C - 1.1, C - 1.1, { a: 0 }, { lens: 1 }); H('mast', C + 3.5, C - 2.6, { word: '' }, { mast: 1 });

defineRoom({ id: LR.lantern, name: NAME + ' — the lantern and gallery', w: W, d: W, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'lighthouse', venue: LV.place, floor: GT.f_stone, bg: '#1a3a52', edge: '#1a3a52',
  wall: { color: '#7cc4ea', pattern: 'plain', trim: '#2a78a4', h: PH },
  exits: [{ x: C - 1.2, y: C + 1.1, label: 'Hatch down to the watch room', to: 'int:' + LR.watch, use: () => LS() && LS().ladder(false) }], spawn: { x: C - .6, y: C + 1.45, dir: 1 }, items,
  setup(sc) {
    const Wd = sc.world, by = k => Wd.objs.filter(o => o.data && o.data[k] !== undefined), panos = by('pano'), lens = by('lens')[0], mast = by('mast')[0]; sc.indoor = false;
    // nav: only the lantern floor (through the door gap) and the gallery ring are walkable
    for (let gy = 0; gy < (W + 2) * 2; gy++) for (let gx = 0; gx < (W + 2) * 2; gx++) { const x = gx / 2 + .25, y = gy / 2 + .25, dx = x - O - C, dy = y - O - C, d = Math.hypot(dx, dy), a = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2), gap = a > .52 && a < 1.06; if (d > RR - .3 || d < 1.15 || (Math.abs(d - RG) < .3 && !gap)) Wd.block(gx / 2, gy / 2, gx / 2 + .5, gy / 2 + .5); else Wd.free(gx / 2, gy / 2, gx / 2 + .5, gy / 2 + .5); }
    // the deck, and the sea a long way down
    Wd.decal({ x0: 0, y0: 0, x1: W + 2, y1: W + 2, draw(Rr) { Rr.qz(O, O + W, O, O + W, 0, (x, y) => { const X = x - O - C, Y = y - O - C, d = Math.hypot(X, Y), a = Math.atan2(Y, X), k = R.hash2(Math.floor(x * 16), Math.floor(y * 16), 3);
      if (d < RG) { const e = (Math.floor(X * 2 + 40) + Math.floor(Y * 2 + 40)) & 1; return d < 1.05 ? '#2f5a4a' : e ? '#4a5262' : '#3e4656'; }
      if (d < RR + .12) { if (d > RR - .1) return '#2e3a52'; const sg = (a + Math.PI) / (Math.PI * 2) * 40; if (sg - Math.floor(sg) < .07) return '#6a5038'; const rr = (d - RG) / .46; if (rr - Math.floor(rr) < .08) return '#7a5c40'; return k > .8 ? '#a8845c' : k < .15 ? '#8e6c48' : '#9a7850'; }
      // far below: rocks and surf around the foot of the tower, then open water
      const rk = R.hash2(Math.floor(x * 3.1 + y * .8), Math.floor(y * 3.1 - x * .8), 8), rim = 5.4 + R.hash2(Math.floor((a + 4) * 5), 1, 3) * 1.1; if (d > RR + .35 && d < rim && rk > .3) return rk > .8 ? '#9a9aa0' : k > .6 ? '#84848c' : '#74747c'; if (d >= rim - .1 && d < rim + .45 && rk > .35) return k > .4 ? '#eaf6fa' : '#9fd0e0';
      return R.hash2(Math.floor(x * 5), Math.floor(y * 9), 2) > .9 ? '#8fcfe4' : k > .5 ? '#2a78a4' : '#2f80ac'; }); } }); Wd.version++;
    const k = mkKeeper(sc, C + 1.5, C + .9, 1, 'lantern');
    // ships on the horizon (entities pinned to the panorama walls), gulls on the wind
    const ships = []; const shipEnt = () => { const e = { x: 0, y: 0, z: HZ, hidden: true, s: null, night: false, fl: false, bb: [-.05, -.05, .05, .05, .2], sprite() { const s = this.s; if (!s) return null; const n = this.night, fl = this.fl; return pixSprite('lhship' + s.kind + s.c + (n ? 1 : 0) + (fl ? 1 : 0), [-10, -9, 10, 2], () => { const q = R.PW(0, 0, 0); shipPx(s.kind, s.c, Math.round(q[0]), Math.round(q[1]), n, fl); }); } }; sc.ents.push(e); return e; }; for (let i = 0; i < 4; i++) ships.push(shipEnt());
    const gulls = [0, 1, 2].map(i => { const g = animal('seagull', 0, O + C, O + C); g.anim = 'fly'; g.ang = i * 2.1; g.rad = 3.4 + i * .9; g.alt = 2.2 + i * .7; g.bb = [-.1, -.1, .1, .1, .3]; sc.ents.push(g); return g; });
    sc.interactables.push({ x: O + C - 3.1, y: O + C - 3.1, label: 'Look out over the bay', h: 1, hit: 16, range: 1.2, spot: { x: O + C - 2.7, y: O + C - 2.7 }, use: () => { G.player.dir = 3; LS() && LS().lookout(); } });
    sc.interactables.push({ x: O + C - 4.2, y: O + C + .4, label: 'Look out to sea', h: 1, hit: 16, range: 1.2, spot: { x: O + C - 3.8, y: O + C + .4 }, use: () => { G.player.dir = 2; LS() && LS().lookout(); } });
    let last = '', turn = 0, horn = 14, drift = 0;
    const sync = () => { const L = LS(); if (!L) return; const v = viewNow(), wx = String(G.state.weather || 'clear'), n = G.now(); for (const o of panos) setP(o, { time: v, wx, season: n.season, drift: Math.floor(drift) }); setP(mast, { word: L.word() || '' }); k.hidden = L.keeperAt() !== 'lantern';
      const list = L.ships(); ships.forEach((e, i) => { const s = list[i]; e.s = s || null; e.hidden = !s || /fog/.test(wx); if (!s) return; e.night = v === 'night'; const bay = s.kind === 'ferry' || s.kind === 'pilot' || s.kind === 'tug'; if (bay) { e.x = O + 1 + s.f * 11; e.y = O + .12; e.fl = false; } else { e.x = O + .12; e.y = O + 12 - s.f * 11; e.fl = true; } e.z = HZ - .06; }); };
    sc.lh = { sync, keeper: k, lens, ships, gulls, get turn() { return turn; } }; sync();
    sc.update = dt => { const L = LS(), key = Math.floor(G.state.t / 4) + String(G.state.weather); drift += dt * .5; if (key !== last) { last = key; sync(); } k.t += dt; if (k._hold > 0) k._hold -= dt;
      const on = !!(L && L.lampOn()), w = L ? L.wound() : 1; if (on && w > .02) turn += dt * .52; setP(lens, { a: Math.floor(turn / (Math.PI / 2) * 12) % 12, on: on ? 1 : 0, c: L ? L.beamColour(turn) : '#fff2a8', shine: L ? Math.round(L.shine() * 4) / 4 : .5 });
      for (const g of gulls) { g.t += dt; g.ang += dt * (.5 + g.rad * .04); g.x = O + C + Math.cos(g.ang) * g.rad; g.y = O + C + Math.sin(g.ang) * g.rad * .8; g.z = g.alt + Math.sin(g.ang * 2.3) * .4; const tx = -Math.sin(g.ang), ty = Math.cos(g.ang); g.dir = Math.abs(tx) > Math.abs(ty) ? (tx > 0 ? 0 : 2) : (ty > 0 ? 1 : 3); g.hidden = /storm/.test(String(G.state.weather)); }
      if (L && /fog/.test(String(G.state.weather)) && (horn -= dt) <= 0) { horn = 22; L.foghorn(); } };
    const e0 = sc.onEnter; sc.onEnter = (o, prev) => { e0(o, prev); sync(); if (LS()) LS().arrived(sc, prev); };
  },
});

/** the beams: two wedges of light swinging round the lantern (drawn after lighting, in canvas pixels) */
function beams(ctx, cam) {
  const sc = G.scene; if (!sc || sc.roomId !== LR.lantern || !sc.lh || !LS() || !LS().lampOn()) return; const L = LS(), t = sc.lh.turn, fog = /fog/.test(String(G.state.weather)), col = L.beamColour(t), len = fog ? 7 : 15, wid = fog ? .34 : .16, c0 = R.WS(O + C, O + C, 1.9);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let b = 0; b < 2; b++) { const a = t + b * Math.PI; for (let i = 0; i < 3; i++) { const w = wid * (1 - i * .3), p1 = R.WS(O + C + Math.cos(a - w) * len, O + C + Math.sin(a - w) * len, 1.9), p2 = R.WS(O + C + Math.cos(a + w) * len, O + C + Math.sin(a + w) * len, 1.9);
    ctx.globalAlpha = (fog ? .2 : .13) * (.6 + L.shine() * .5); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(Math.round(c0[0] - cam.x), Math.round(c0[1] - cam.y)); ctx.lineTo(Math.round(p1[0] - cam.x), Math.round(p1[1] - cam.y)); ctx.lineTo(Math.round(p2[0] - cam.x), Math.round(p2[1] - cam.y)); ctx.closePath(); ctx.fill(); } }
  ctx.restore();
}
/** and from the city: the same sweep from the top of the real tower, wherever the camera can see it */
function cityBeams(ctx, cam) {
  const sc = G.scene, L = LS(); if (!sc || sc.id !== 'city' || !L || !L.lampOn()) return; const p = L.towerTop(); if (!p) return; const c0 = R.WS(p.x, p.y, p.z), X = c0[0] - cam.x, Y = c0[1] - cam.y; if (X < -500 || Y < -400 || X > G.W + 500 || Y > G.H + 400) return;
  const t = G.time * .52, fog = /fog/.test(String(G.state.weather)), col = L.beamColour(t), len = fog ? 12 : 30, wid = fog ? .3 : .11; ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let b = 0; b < 2; b++) { const a = t + b * Math.PI; for (let i = 0; i < 2; i++) { const w = wid * (1 - i * .45), p1 = R.WS(p.x + Math.cos(a - w) * len, p.y + Math.sin(a - w) * len, p.z), p2 = R.WS(p.x + Math.cos(a + w) * len, p.y + Math.sin(a + w) * len, p.z); ctx.globalAlpha = fog ? .2 : .14; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(Math.round(X), Math.round(Y)); ctx.lineTo(Math.round(p1[0] - cam.x), Math.round(p1[1] - cam.y)); ctx.lineTo(Math.round(p2[0] - cam.x), Math.round(p2[1] - cam.y)); ctx.closePath(); ctx.fill(); } }
  ctx.globalAlpha = .9; ctx.fillStyle = col; ctx.fillRect(Math.round(X) - 2, Math.round(Y) - 2, 5, 4); ctx.restore();
}

export function init() {
  registerFixture('lh_lens', only(() => ({ label: 'The great lens', hit: 18, h: 2.6, use: () => LS() && LS().lens() })));
  registerFixture('lh_mast', only(() => ({ label: 'The signal mast', hit: 10, h: 2, use: () => LS() && LS().mastInfo() })));
  G.overlays.push(beams); G.overlays.push(cityBeams);
}
