// Performance venues: rooms + stage directors. The shared flow (tickets, audience, seating, lights, applause) lives in src/sim/shows.js;
// this file builds the halls and performs the content on stage.
//   cinema:screen1      The Orpheum's screening hall (replaces `cinema:hall`; the lobby's "Screen 1" exit is repointed by shows.js)
//   concerthall, concerthall:hall     Maple Bay Symphony Hall: lobby + auditorium (228 seats, 25-piece orchestra + conductor)
//   playhouse, playhouse:hall         The Lantern Playhouse: lobby + proscenium theatre (120 seats)
// A hall scene exposes scene.perf = { venue, seats: [{x,y,z,dir,row,n,fy,ax,taken}], entry, focus, usher, route(seat) -> waypoints,
//   dir: { dur(prog) seconds, start(prog, ctx), update(t, dt) -> done, finish(), cleanup(), lights(m, cam, pool, level) } } and scene.house (0..1 house lights).
import { G } from '../../core/game.js';
import { Char, charArt } from '../../core/char.js';
import { GT } from '../../engine/world.js';
import * as R from '../../engine/raster.js';
import { pixSprite } from '../../engine/sprites.js';
import { ambientIndoor } from '../../core/clock.js';
import { defineRoom, registerFixture } from '../interior.js';
import { V, WY, WX } from './venues_lib.js';
import { crowd } from './_show_life.js';
import { bubble } from '../../ui/kit.js';
import { registerInstance } from '../../data/venues_extra.js';
import { play, sfx } from '../../sim/_shows_audio.js';
import { score } from '../../sim/_shows_music.js';
import { drawFilm, FW, FH } from '../../sim/_shows_films.js';
import { drawKit, drawProp, KIT_SB, PROP_SB } from '../../art/performance/_kits.js';
import { BACKDROPS } from '../../art/performance/perf.js';

const lobbyOf = (id, x, y) => G => G.go('int:' + id, { x: x + 1, y: y + 1, dir: 1 });
const lp = (m, cam, pool, x, y, z, r, c, a) => { const s = R.WS(x, y, z), ps = pool(r, c); m.globalAlpha = Math.max(0, Math.min(1, a)); m.drawImage(ps, Math.round(s[0]) - cam.x - (ps.width >> 1), Math.round(s[1]) - cam.y - (ps.height >> 1)); };
let SID = 0; const sid = s => s._pid || (s._pid = ++SID);
const mkSpec = (r, o) => { const A = charArt(), q = Object.assign({}, o), ov = {}; for (const k of ['topColor', 'bottomColor', 'hat', 'hatColor', 'glasses', 'scarf', 'top', 'hairColor', 'bag']) if (q[k] !== undefined) { ov[k] = q[k]; delete q[k]; } return Object.assign(A.randomSpec(r, Object.assign({ season: 1 }, q)), ov); };

/* ------------------------------------------------------------------ shared hall plumbing */
function mkHall(sc, cfg) {
  const O = sc.toWorld(0, 0), seats = []; sc.world.zmax = 8; sc.house = 1;
  for (const fx of sc.byTag('seating')) { const ry = fx.ob.B[1]; for (const s of fx.seats) seats.push({ x: s.x, y: s.y, z: s.z, dir: s.dir, ry, fy: ry - .25, taken: null }); }
  const ys = [...new Set(seats.map(s => s.ry))].sort((a, b) => a - b), aisles = cfg.aisles.map(a => a + O.x);
  for (const s of seats) { s.row = ys.indexOf(s.ry); s.ax = aisles.reduce((b, a) => (Math.abs(a - s.x) < Math.abs(b - s.x) ? a : b), aisles[0]); }
  for (let i = 0; i < ys.length; i++) seats.filter(s => s.row === i).sort((a, b) => a.x - b.x).forEach((s, n) => { s.n = n; });
  const entry = sc.toWorld(cfg.entry[0], cfg.entry[1]), crossY = cfg.crossY + O.y, f = sc.toWorld(cfg.focus[0], cfg.focus[1]);
  const hall = sc.perf = { venue: cfg.venue, seats, entry, focus: { x: f.x, y: f.y, z: cfg.focus[2] || 0 }, usher: null, dir: null,
    route: s => { const j = (Math.random() - .5) * .5; return [{ x: s.ax + j, y: crossY + (Math.random() - .5) * .6 }, { x: s.ax + j * .6, y: s.fy }, { x: s.x, y: s.fy, slow: 1 }]; } };
  for (const st of seats) sc.interactables.push({ x: st.x, y: st.y, z: st.z - .2, h: .5, hit: 4, label: 'Sit', spot: { x: st.x, y: st.fy }, visible: () => !(G.shows && G.shows.run), use: () => G.shows && G.shows.sitFree(st) });
  const DARK = cfg.dark || '#3a3452';
  sc.env = t => { const b = ambientIndoor(t), L = sc.house === undefined ? 1 : sc.house; if (L >= .995) return b; return { amb: R.mix(DARK, b.amb, L), dark: b.dark + (1 - L) * (.92 - b.dark), bg: b.bg, night: b.night }; };
  sc.lights = (m, cam, pool) => { const L = 1 - (sc.house === undefined ? 1 : sc.house); if (L < .03 || !hall.dir || !hall.dir.lights) return; const ga = m.globalAlpha; try { hall.dir.lights(m, cam, pool, L); } finally { m.globalAlpha = ga; } };
  const u = sc.toWorld(cfg.usher[0], cfg.usher[1]), us = new Char(mkSpec(R.rng(cfg.seed || 5), { outfit: 'bartender' }), u.x, u.y); us.dir = cfg.usher[2] === undefined ? 3 : cfg.usher[2]; sc.ents.push(us); hall.usher = us;
  sc.interactables.push({ ent: us, x: us.x, y: us.y, label: 'Usher', h: 1.2, hit: 6, range: 1.7, use: () => bubble(us, G.shows && G.shows.state() ? 'Find your seat. We start shortly!' : 'Nothing on right now. See the box office for times.') });
  const upd = sc.update; sc.update = (dt, gm) => { upd(dt, gm); us.t += dt; if (hall.dir && hall.dir.idle) hall.dir.idle(dt); };
  return hall;
}
const seatRows = (id, rows, blocks, c) => { const out = []; for (const y of rows) for (const [x, n] of blocks) out.push(V(id, x, y, c ? { n, c } : { n })); return out; };

/* ------------------------------------------------------------------ cinema: The Orpheum, Screen 1 (13 x 13) */
function filmDir(sc, hall, pos) {
  const film = document.createElement('canvas'); film.width = FW; film.height = FH; const fx = film.getContext('2d');
  const cv = document.createElement('canvas'); cv.width = FW + 2; cv.height = FH + FW / 2 + 2; const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
  const one = document.createElement('canvas'); one.width = one.height = 1; const ox = one.getContext('2d', { willReadFrequently: true });
  const spr = { c: cv, l: cv, x: -1, y: -FH - 1, w: cv.width, h: cv.height }; let col = '#8a8aa0', last = -1, slideK = '';
  const blit = () => { cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); cx.setTransform(1, .5, 0, 1, 1, 1); cx.fillStyle = '#16121a'; cx.fillRect(-1, -1, FW + 2, FH + 2); cx.drawImage(film, 0, 0); };
  const slide = (a, b, c) => { const k = a + b + c; if (k === slideK) return; slideK = k; drawFilm({ scenes: [[0, 9, () => { fx.fillStyle = '#241a2c'; fx.fillRect(0, 0, FW, FH); fx.fillStyle = '#3a2a44'; fx.fillRect(4, 4, FW - 8, FH - 8); fx.fillStyle = '#e8b848'; fx.fillRect(4, 14, FW - 8, 1); fx.fillRect(4, FH - 15, FW - 8, 1); }]] }, fx, 1); txt(a, 20, '#ffd060'); txt(b, 31, '#f4f0e8'); txt(c, 42, '#b8a8c8'); blit(); col = '#6a5a80'; };
  const txt = (s, y, c) => { if (!s) return; const sp = R.render([0, 0, R.textW(s) + 1, 6], () => R.textS(s, 0, 0, c), null, 1), id = new ImageData(new Uint8ClampedArray(sp.buf.buffer), sp.w, sp.h), t = document.createElement('canvas'); t.width = sp.w; t.height = sp.h; t.getContext('2d').putImageData(id, 0, 0); fx.drawImage(t, Math.round(FW / 2 - R.textW(s) / 2) + sp.x, y + sp.y); };
  const ent = { x: pos.x, y: pos.y, z: pos.z, bb: [0, -.02, FW / 16, .06, FH / 16], sprite: () => spr }; sc.ents.push(ent);
  const D = { p: null, h: null, on: false, ci: 0,
    dur: p => p.dur, idle() { if (!D.on) { const st = G.shows && G.shows.run; if (st && st.scene === sc && st.phase !== 'exit') slide('THE ORPHEUM PRESENTS', st.prog.title.toUpperCase(), 'PLEASE SILENCE YOUR PHONES'); else slide('THE ORPHEUM', 'SCREEN 1', D.p ? 'THANK YOU FOR COMING' : 'SEE BOX OFFICE FOR TIMES'); } },
    start(prog, ctx) { D.p = prog; D.ctx = ctx; D.on = true; D.ci = 0; last = -1; D.h = play(score(prog.score), { rate: ctx.speed(), gain: .9 }); },
    update(t) {
      if (!D.on) return true; const p = D.p; if (t >= p.dur) { D.on = false; slideK = ''; return true; }
      const fr = Math.floor(t * 15); if (fr !== last) { last = fr; drawFilm(p, fx, t); blit(); if (fr % 3 === 0) { ox.drawImage(film, 0, 0, 1, 1); const d = ox.getImageData(0, 0, 1, 1).data, qn = v => Math.min(255, (v >> 5) * 36 + 40).toString(16).padStart(2, '0'); col = '#' + qn(d[0]) + qn(d[1]) + qn(d[2]); } }
      D.h.pump(t); while (D.ci < p.cues.length && p.cues[D.ci][0] <= t) D.ctx.cue(p.cues[D.ci++][1]); return false;
    },
    finish() { D.on = false; slideK = ''; if (D.h) D.h.stop(1.5); }, cleanup() { D.on = false; slideK = ''; if (D.h) D.h.stop(.3); D.h = null; },
    lights(m, cam, pool, L) { const k = D.on ? .55 + .12 * Math.sin(G.time * 23) : .35, x0 = pos.x + FW / 32; lp(m, cam, pool, x0, pos.y + 2.2, 0, 5, col, L * k); lp(m, cam, pool, x0 - 2.6, pos.y + 4.5, 0, 4, col, L * k * .6); lp(m, cam, pool, x0 + 2.6, pos.y + 4.5, 0, 4, col, L * k * .6); lp(m, cam, pool, x0, pos.y + .6, 2.5, 5, col, L * .5); } };
  return D;
}
defineRoom({ id: 'cinema:screen1', name: 'The Orpheum — Screen 1', w: 13, d: 13, zoom: 0, noCrowd: true, music: 'quiet', showVenue: 'cinema', floor: GT.f_carpet, wall: { color: '#2a2030', trim: '#8a2a3a', h: 5.4 },
  items: [V('perf.stage', 2.5, .2, { w: 8, d: .7, h: .45, c: '#3a2a30' }, { solid: true }), V('perf.curtain', 2.3, 0, { w: 8.4, h: 5.2, frame: 0 }, { solid: false }),
    V('bar.speaker', 1.2, .3), V('bar.speaker', 11.3, .3), WX('generic.exit', 11.4), WX('cinema.curtain', 2, { w: 2 }), WX('cinema.curtain', 6.5, { w: 2 }),
    ...seatRows('cinema.seats', [4, 5.5, 7, 8.5, 10], [[1, 10], [7, 10]]), V('cinema.projector', 11.6, 11.7), V('perf.rope', 4.2, 11.9)],
  exits: [{ x: 6.5, y: 12.5, label: 'Lobby', use: lobbyOf('cinema', 7, 1.6) }],
  setup(sc) { const hall = mkHall(sc, { venue: 'cinema', aisles: [.55, 6.5, 12.45], entry: [6.5, 12.2], crossY: 11.5, focus: [6.5, 3.6, 1.2], usher: [8.2, 12.1, 3], dark: '#2e2a44' }), p = sc.toWorld(3, .12); hall.dir = filmDir(sc, hall, { x: p.x, y: p.y, z: 1.05 }); hall.dir.idle(); } });

/* ------------------------------------------------------------------ concert hall: the orchestra */
const KITS = { vln1: { k: 'vln' }, vln2: { k: 'vln' }, vla: { k: 'vla' }, vc: { k: 'vc' }, cb: { k: 'cb', stand: 1, inst: [.3, .1] }, fl: { k: 'fl', anim: 'eat' }, ob: { k: 'ob', anim: 'eat' }, cl: { k: 'cl', anim: 'eat' }, bsn: { k: 'bsn' }, hn: { k: 'hn' }, tpt: { k: 'tpt', anim: 'eat' },
  tbn: { k: 'tbn', anim: 'eat' }, tuba: { k: 'tuba' }, timp: { k: 'timp', stand: 1, inst: [0, .3] }, perc: { k: 'perc', stand: 1, inst: [0, .3] }, harp: { k: 'harp', inst: [0, .12] }, cond: { k: 'cond', stand: 1 } };
// [section, x, y] in room coords on the stage (y 5.2 front row .. 1.2 riser back)
const ORCH = [['vln1', 7.5, 5.2], ['vln1', 8.9, 5.2], ['vln1', 10.3, 5.2], ['vc', 15.7, 5.2], ['vc', 17.1, 5.2], ['vln2', 6.6, 4.25], ['vln2', 8, 4.25], ['vln2', 9.4, 4.25], ['vla', 16.6, 4.25], ['vla', 18, 4.25], ['cb', 19.6, 4], ['cb', 20.9, 4],
  ['fl', 10.3, 3.5], ['ob', 11.7, 3.5], ['cl', 14.3, 3.5], ['bsn', 15.7, 3.5], ['harp', 5.8, 3.2], ['hn', 9, 2.2], ['hn', 10.2, 2.2], ['tpt', 12.4, 2.2], ['tpt', 13.6, 2.2], ['tbn', 15.8, 2.2], ['tuba', 17, 2.2], ['timp', 13, 1.25], ['perc', 15.8, 1.25]];
const STAGE_Z = .6, stageZ = y => STAGE_Z + (y < 1.8 ? .5 : y < 2.8 ? .25 : 0), PRE = 22;
class Mus {
  constructor(spec, sec, x, y, z) { this.spec = spec; this.sec = sec; this.K = KITS[sec]; this.tx = x; this.ty = y; this.tz = z; this.x = x; this.y = y; this.z = z; this.dir = 1; this.st = 0; this.t = Math.random() * 5; this.on = false; this.n = 0; this.seated = false; this.moving = false; this.hidden = true; this.bow = false; this.bb = [-.22, -.22, .22, .22, 1.5]; this.bubbleH = 1.9; }
  sprite() {
    const A = charArt(), K = this.K, on = this.on && !this.moving && this.st === 2, f = on ? this.n % 4 : 0, sit = this.seated && !this.moving;
    const anim = this.moving ? 'walk' : this.bow ? 'wave' : sit ? (on && K.anim ? K.anim : 'sit') : (on && K.k === 'timp' ? 'work' : 'stand'), nf = (A.ANIMS && A.ANIMS[anim]) || 1, fr = this.moving ? Math.floor(this.t * 7) % nf : this.bow ? Math.floor(this.t * 4) % nf : anim === 'eat' ? 1 : anim === 'work' ? this.n % nf : 0, dir = this.dir;
    const mode = this.moving ? 'carry' : this.bow ? '' : 'play';
    return pixSprite('mus' + sid(this.spec) + this.sec + anim + fr + dir + mode + (on ? 'p' + f : 'r') + (sit ? 's' : ''), KIT_SB, () => { A.drawChar(this.spec, { anim, frame: fr, dir, seated: sit }); if (mode && (dir === 1 || K.k === 'cond')) drawKit(K.k, mode, on, f); });
  }
}
function concertDir(sc, hall) {
  const r = R.rng(4242), W = (x, y) => sc.toWorld(x, y), mus = [], wingL = W(3.5, 0).x, wingR = W(22.5, 0).x, oy = W(0, 0).y;
  ORCH.forEach(([sec, x, y], i) => { const p = W(x, y), m = new Mus(mkSpec(r, { style: 'business', topColor: i % 5 === 3 ? '#7a2a3a' : '#f4f0e8', bottomColor: '#1e1a22' }), sec, p.x, p.y, stageZ(y)); m.left = x < 13; m.at = .4 + (i % 13) * .62 + (m.left ? 0 : .3); mus.push(m); sc.ents.push(m);
    const K = KITS[sec]; if (K.inst) sc.ents.push({ x: p.x + K.inst[0], y: p.y + K.inst[1], z: m.tz, bb: [-.3, -.1, .3, .1, 1], sprite: () => pixSprite('inst' + K.k, KIT_SB, () => drawKit(K.k, 'inst')) }); });
  const cp = W(13, 6.1), cond = new Mus(mkSpec(r, { style: 'business', age: 'elder', top: 'coat', topColor: '#16131a', bottomColor: '#16131a' }), 'cond', cp.x, cp.y, STAGE_Z + .22); sc.ents.push(cond);
  const walk = (m, dt, tx, ty, tz, spd = 2.4) => { const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy), st = spd * dt; m.z += (tz - m.z) * Math.min(1, dt * 6); if (d <= st) { m.x = tx; m.y = ty; m.moving = false; return true; } m.x += dx / d * st; m.y += dy / d * st; m.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); m.moving = true; return false; };
  const D = { p: null, h: null, on: false, fin: false, off: false, ci: 0, tuned: false, clap: false,
    dur: p => PRE + score(p.id).dur + 1.2,
    start(prog, ctx) { D.p = prog; D.ctx = ctx; D.on = true; D.fin = D.off = D.tuned = D.clap = false; D.ci = 0; D.h = null; D.sc = score(prog.id);
      for (const m of mus.concat(cond)) { m.st = 0; m.hidden = true; m.seated = false; m.on = false; m.bow = false; m.x = m.left === false ? wingR : wingL; m.y = m.ty; m.z = STAGE_Z; m.dir = 1; m.leg = 0; } cond.at = 15.5; cond.left = true; cond.y = W(0, 6.4).y; },
    update(t, dt) {
      if (!D.on) return true; const S = D.sc, mt = t - PRE;
      for (const m of mus) { m.t += dt;
        if (m.st === 0) { if (t >= m.at) { m.st = 1; m.hidden = false; } }
        else if (m.st === 1) { if (walk(m, dt, m.tx, m.ty, m.tz)) { m.st = 2; m.dir = 1; m.seated = !m.K.stand; } }
        else if (m.st === 3) { m.seated = false; m.bow = false; if (walk(m, dt, m.left ? wingL : wingR, m.ty, STAGE_Z)) { m.st = 4; m.hidden = true; } } }
      if (!D.tuned && t >= 11) { D.tuned = true; sfx('tune'); }
      if (t >= 11 && t < 15.6 && !D.h) for (const m of mus) { m.on = m.sec === 'ob' || t > 12.1; m.n = Math.floor(t * 3 + m.tx); } else if (!D.h) for (const m of mus) m.on = false;
      // the conductor
      cond.t += dt; if (cond.st === 0 && t >= cond.at) { cond.st = 1; cond.hidden = false; } if (cond.st === 1) { if (walk(cond, dt, cp.x, cp.y, STAGE_Z + .22, 2)) { cond.st = 2; cond.dir = 1; } }
      if (!D.clap && t >= 16.4) { D.clap = true; D.ctx.cue('cheer'); } if (cond.st === 2 && !D.fin) { cond.bow = t < 20.3; cond.dir = t < 20.3 ? 1 : 3; }
      if (mt >= 0 && !D.fin) {
        if (!D.h) D.h = play(S, { rate: D.ctx.speed() }); D.h.pump(mt);
        for (const m of mus) { const s = D.h.sec[m.sec]; m.on = !!(s && s.on); if (s) m.n = s.n; } cond.on = mt < S.dur; cond.n = Math.floor(mt / S.spb) % S.meter + (S.meter === 3 ? 1 : 0);
        const cu = D.p.cues || []; while (D.ci < cu.length && cu[D.ci][0] * S.dur <= mt) { D.ci++; D.ctx.cue('aww'); }
      } else if (!D.fin) cond.on = t > 20.8;
      if (D.fin && !D.off && t > D.endT + 9) { D.off = true; for (const m of mus.concat(cond)) if (m.st === 2) m.st = 3; cond.left = true; } if (cond.st === 3) { cond.bow = false; if (walk(cond, dt, wingL, cond.y, STAGE_Z, 2)) { cond.st = 4; cond.hidden = true; } }
      return mt >= S.dur + 1.2;
    },
    finish() { D.fin = true; D.endT = D.dur(D.p); for (const m of mus) { m.on = false; m.seated = false; } cond.on = false; cond.dir = 1; cond.bow = true; if (D.h) D.h.stop(2.5); },
    cleanup() { D.on = false; if (D.h) D.h.stop(.3); D.h = null; for (const m of mus.concat(cond)) m.hidden = true; },
    lights(m, cam, pool, L) { for (let x = 5; x <= 21; x += 4) { const p = W(x, 4.2); lp(m, cam, pool, p.x, p.y, STAGE_Z, 5, '#ffe2b0', L * .95); const q = W(x, 1.6); lp(m, cam, pool, q.x, q.y, 1.4, 4.5, '#ffd8a0', L * .7); } lp(m, cam, pool, cp.x, cp.y, STAGE_Z, 3, '#fff2d0', L * .6); for (let x = 8; x <= 18; x += 5) lp(m, cam, pool, W(x, 0).x, oy + .3, 3.4, 4, '#ffd090', L * .5); } };
  return D;
}
const CH = '#2f5a7a', CROWS = [9, 10.5, 12, 13.5, 15, 16.5];
defineRoom({ id: 'concerthall:hall', name: 'Symphony Hall — Auditorium', w: 26, d: 21, zoom: -1, noCrowd: true, music: 'quiet', showVenue: 'concerthall', floor: GT.f_darkwood, floors: [{ x0: 0, y0: 8, x1: 26, y1: 21, floor: GT.f_carpet }],
  wall: { color: '#e4d4b4', trim: '#b8862a', rail: 1.2, h: 5.6 },
  items: [V('perf.stage', 3, .5, { w: 20, d: 6.5, h: .6, c: '#b08050' }), WY('perf.organ', 7, { w: 12, h: 5.4 }), WY('perf.panel', 3.4, { w: 3, h: 5 }), WY('perf.panel', 19.6, { w: 3, h: 5 }), WY('perf.panel', .3, { w: 2.6, h: 5 }), WY('perf.panel', 23.1, { w: 2.6, h: 5 }),
    WX('perf.panel', 1, { w: 3, h: 5 }), WX('perf.sidebox', 8.6, { w: 3.6 }), WX('perf.sidebox', 13, { w: 3.6 }), WX('generic.exit', 18.6),
    V('perf.stage', 8, .8, { w: 10, d: 1, h: .5, c: '#8a5a34' }, { z: STAGE_Z, solid: false }), V('perf.stage', 8, 1.8, { w: 10, d: 1, h: .25, c: '#8a5a34' }, { z: STAGE_Z, solid: false }), V('perf.podium', 12.5, 5.7, null, { z: STAGE_Z, solid: false }), V('perf.piano', 3.5, 4, null, { z: STAGE_Z, solid: false }),
    ...ORCH.filter(o => !KITS[o[0]].stand).map(([s, x, y]) => V('perf.chair', x - .3, y - .32, { c: '#8a6a4a', stand: s !== 'harp' }, { z: stageZ(y), solid: false })), ...ORCH.filter(o => KITS[o[0]].stand).map(([s, x, y]) => V('perf.chair', x - .3, y - .32, { nochair: true }, { z: stageZ(y), solid: false })),
    ...seatRows('perf.seats', CROWS, [[2, 12], [9.5, 14], [18, 12]], CH), V('perf.chandelier', 6, 12), V('perf.chandelier', 18, 12), V('perf.rope', 10.4, 19.9), V('perf.rope', 13.6, 19.9), V('generic.plant', .5, 20.3), V('generic.plant', 25, 20.3)],
  exits: [{ x: 13, y: 20.5, label: 'Lobby', use: lobbyOf('concerthall', 1.9, 7.8) }],
  setup(sc) { const hall = mkHall(sc, { venue: 'concerthall', aisles: [1.2, 8.75, 17.25, 24.8], entry: [13, 20.2], crossY: 18.6, focus: [13, 6.4, 1], usher: [15, 20, 3], dark: '#3a3450' }); hall.dir = concertDir(sc, hall); } });

/* ------------------------------------------------------------------ playhouse: the stage director */
function playDir(sc, hall, geo) {
  const W = (u, v) => sc.toWorld(geo.x0 + u * geo.w, geo.y0 + v * geo.d), Z = geo.z, r = R.rng(909), act = {}, props = {}, curt = sc.fixtures.filter(f => f.asset.id === 'furn.perf.curtain').map(f => f.ob), drops = {};
  for (const f of sc.fixtures) if (f.asset.id === 'furn.perf.backdrop') { drops[f.item.p.scene] = f.ob; f.ob.hidden = true; }
  const showCurt = k => curt.forEach((ob, i) => { ob.hidden = i !== k; }), showSet = n => { for (const k in drops) drops[k].hidden = k !== n; };
  const wing = s => (s === 'L' ? W(-.07, 0).x : W(1.07, 0).x);
  const clear = () => { for (const k in act) { const i = sc.ents.indexOf(act[k]); if (i >= 0) sc.ents.splice(i, 1); delete act[k]; } for (const k in props) { const i = sc.ents.indexOf(props[k]); if (i >= 0) sc.ents.splice(i, 1); delete props[k]; } };
  const prop = (key, kind, x, y) => { const e = { x, y, z: Z, kind, bb: kind === 'bench' ? [-.9, -.3, .9, .25, .5] : [-.15, -.15, .15, .15, .5], sprite: () => pixSprite('prop' + kind, PROP_SB, () => drawProp(kind)) }; props[key] = e; sc.ents.push(e); return e; };
  const D = { p: null, h: null, on: false, i: 0, cf: 4, ct: 4, L: { wash: .6, tint: '#ffe0b0', spots: [] }, sweep: -1, t0: 0, spd: 1,
    dur: p => p.dur + 1,
    idle(dt) { if (D.cf !== D.ct) { const d = D.ct - D.cf, s = dt * 3.2 * D.spd; D.cf = Math.abs(d) <= s ? D.ct : D.cf + Math.sign(d) * s; showCurt(Math.round(D.cf)); } },
    start(prog, ctx) { clear(); D.p = prog; D.ctx = ctx; D.on = true; D.i = 0; D.h = null; D.sweep = -1; D.spd = ctx.speed(); D.rows = prog.script.slice().sort((a, b) => a[0] - b[0]);
      for (const id in prog.cast) { const c = prog.cast[id], a = new Char(mkSpec(r, c.spec || {}), wing('L'), W(0, .5).y); a.z = Z; a.zx = 0; a.hidden = true; a.name = c.name; a.id = id; a.bubbleH = 2; a.tgt = null; a.pt = 0; act[id] = a; sc.ents.push(a); } },
    op(row, t) {
      const [, op, a, b, c, d] = row, A = act[a];
      if (op === 'curtain') D.ct = a; else if (op === 'set') showSet(a); else if (op === 'light') D.L = Object.assign({ wash: .5, tint: '#ffe0b0', spots: [] }, a); else if (op === 'cue') D.ctx.cue(a); else if (op === 'sfx') sfx(a);
      else if (op === 'music') { D.h = play(score(a), { rate: D.spd }); D.t0 = t; } else if (op === 'sweep') D.sweep = 0;
      else if (op === 'prop') { const p = W(c, d); prop(a, b, p.x, p.y); } else if (op === 'unprop') { const e = props[a]; if (e) { const i = sc.ents.indexOf(e); if (i >= 0) sc.ents.splice(i, 1); delete props[a]; } }
      else if (op === 'hold') { const e = prop(a, a === 'mop' ? 'mop' : 'case', 0, 0); e.held = act[b]; }
      else if (op === 'dance') { for (const id of a) if (act[id]) act[id].pose = b ? 'dance' : null; }
      else if (!A) return;
      else if (op === 'enter') { const p = W(c, d); A.x = wing(b); A.y = p.y; A.hidden = false; A.pose = null; A.poseOpts = null; A.zx = 0; A.tgt = p; A.out = false; }
      else if (op === 'go') { A.tgt = W(b, c); if (A.pose === 'sleep') { A.pose = null; } }
      else if (op === 'exit') { A.tgt = { x: wing(b), y: A.y }; A.out = true; if (A.pose === 'sit') { A.pose = null; A.poseOpts = null; A.zx = 0; } }
      else if (op === 'say') bubble(A, b, (c || Math.max(1700, 900 + b.length * 55)) / D.spd);
      else if (op === 'pose') { A.pose = b || null; A.pt = c || 0; } else if (op === 'face') A.dir = b;
      else if (op === 'lie') { A.tgt = null; A.pose = 'sleep'; A.dir = 0; A.zx = .12; } else if (op === 'up') { A.pose = null; A.poseOpts = null; A.zx = 0; }
      else if (op === 'sit') { A.tgt = null; A.pose = 'sit'; A.poseOpts = { seated: true }; A.zx = b || .3; A.dir = 1; }
    },
    update(t, dt) {
      if (!D.on && !D.calls) return true; const p = D.p;
      if (D.on) while (D.i < D.rows.length && D.rows[D.i][0] <= t) { try { D.op(D.rows[D.i], t); } catch (e) { console.warn('play op', D.rows[D.i], e); } D.i++; }
      for (const id in act) { const a = act[id]; if (a.hidden) continue; a.t += dt; if (a.pt > 0 && (a.pt -= dt) <= 0) a.pose = null;
        if (a.tgt) { const dx = a.tgt.x - a.x, dy = a.tgt.y - a.y, d = Math.hypot(dx, dy), st = (a.out ? 3 : 2.3) * dt; if (d <= st) { a.x = a.tgt.x; a.y = a.tgt.y; a.tgt = null; a.moving = false; if (a.out) a.hidden = true; else a.dir = 1; } else { a.x += dx / d * st; a.y += dy / d * st; a.face(dx, dy); a.moving = true; } } else a.moving = false;
        a.z = Z + (a.zx || 0); }
      for (const k in props) { const e = props[k]; if (e.held) { const a = e.held; e.hidden = a.hidden || a.pose === 'sleep'; e.x = a.x + (a.dir === 2 ? -.3 : .3); e.y = a.y + .06; } }
      if (D.h) D.h.pump(t - D.t0); if (D.sweep >= 0) { D.sweep += dt / 2.6; if (D.sweep > 1) D.sweep = -1; }
      if (D.on && t >= p.dur) { D.on = false; return true; } return !D.on;
    },
    finish() { // curtain call: everyone back on, in a line, bowing
      D.on = false; D.calls = true; D.ct = 0; D.L = { wash: 1, tint: '#ffe8c0', spots: [] }; const ids = Object.keys(act); ids.forEach((id, i) => { const a = act[id], p = W(ids.length > 1 ? .2 + .6 * i / (ids.length - 1) : .5, .84); a.hidden = false; a.x = p.x; a.y = p.y; a.tgt = null; a.zx = 0; a.poseOpts = null; a.dir = 1; a.pose = i % 2 ? 'wave' : 'cheer'; a.pt = 0; });
      for (const k in props) if (props[k].held) props[k].hidden = true; if (D.h) D.h.stop(2); },
    cleanup() { D.on = false; D.calls = false; if (D.h) D.h.stop(.3); D.h = null; clear(); D.ct = 4; },
    lights(m, cam, pool, L) {
      const S = D.L, n = 4; for (let i = 0; i < n; i++) { const p = W((i + .5) / n, .55); lp(m, cam, pool, p.x, p.y, Z, 4.5, S.tint || '#ffe0b0', L * (S.wash === undefined ? .5 : S.wash)); const q = W((i + .5) / n, 0); lp(m, cam, pool, q.x, q.y - .5, Z + 2, 4, S.tint || '#ffe0b0', L * (S.wash || 0) * .8); }
      for (const s of S.spots || []) { const p = W(s[0], s[1]); lp(m, cam, pool, p.x, p.y, Z, s[2], s[3], L); lp(m, cam, pool, p.x, p.y, Z + 1, s[2] * .7, s[3], L * .7); }
      if (S.follow && act[S.follow] && !act[S.follow].hidden) { const a = act[S.follow]; lp(m, cam, pool, a.x, a.y, Z + .6, 2.4, '#fff6dc', L); }
      for (let i = 0; i < 6; i++) { const p = W((i + .5) / 6, 1.02); lp(m, cam, pool, p.x, p.y, Z, 1.6, '#ffd890', L * .5); }
      if (D.sweep >= 0) { const p = W(-.2 + D.sweep * 1.4, .5); lp(m, cam, pool, p.x, p.y, Z + 1, 3.5, '#fff8e0', L); lp(m, cam, pool, p.x, p.y, Z, 5, '#c8d8ff', L * .8); } } };
  showCurt(4); showSet('castle'); return D;
}
const PROWS = [7.5, 9, 10.5, 12, 13.5];
defineRoom({ id: 'playhouse:hall', name: 'The Lantern Playhouse — Auditorium', w: 16, d: 16, zoom: 0, noCrowd: true, music: 'quiet', showVenue: 'playhouse', floor: GT.f_carpet, wall: { color: '#5a2a34', trim: '#d8a848', rail: 1.1, h: 5.2 },
  items: [V('perf.stage', 1, .5, { w: 14, d: 4.6, h: .6, foot: true }), ...BACKDROPS.map(scene => WY('perf.backdrop', 2.4, { scene, w: 11.2, h: 3.9 }, .6)),
    ...[0, 1, 2, 3, 4].map(frame => V('perf.curtain', 1.9, 4.8, { w: 12.2, h: 3.05, frame }, { z: .6, solid: false })), V('perf.proscenium', 1, 5.1, { w: 14, h: 4.6, open: true }, { solid: false }),
    WX('perf.sidebox', 7, { w: 3.4 }), WX('generic.exit', 13.6), WX('perf.poster', 11.2, { poster: 'understudy' }), WX('perf.poster', 12.3, { poster: 'mybay' }),
    ...seatRows('perf.seats', PROWS, [[1.5, 12], [8.5, 12]], '#7a2a4a'), V('perf.chandelier', 7, 9.6), V('perf.rope', 5.2, 15.2), V('perf.rope', 8.9, 15.2)],
  exits: [{ x: 8, y: 15.5, label: 'Lobby', use: lobbyOf('playhouse', 10.6, 1.9) }],
  setup(sc) { const hall = mkHall(sc, { venue: 'playhouse', aisles: [.9, 8, 15.1], entry: [8, 15.2], crossY: 14.9, focus: [8, 5.2, .8], usher: [9.6, 15.3, 3], dark: '#34283e' }); sc.world.block(sc.toWorld(1, 0).x, sc.toWorld(0, 5.1).y, sc.toWorld(15, 0).x, sc.toWorld(0, 5.6).y); hall.dir = playDir(sc, hall, { x0: 2.2, y0: 1.3, w: 11.6, d: 3.2, z: .6 }); } });

/* ------------------------------------------------------------------ lobbies */
const LOBBY_LINES = { concerthall: ['The acoustics here are something else.', 'I come for the adagio. I stay for the interval bar.', 'They tune to the oboe. Always the oboe.', 'Black tie is optional. Applause is not.'], playhouse: ['I hear the understudy steals the show.', 'Front row or nothing.', 'Do you think they do autographs?', 'I cried at Platform Six. Twice.'] };
function lobbyLife(sc, spots, key) { const c = crowd(sc, spots, { seed: key.length * 7, fill: .85, lines: LOBBY_LINES[key] }); c.show(true, true); const upd = sc.update; sc.update = (dt, gm) => { upd(dt, gm); c.update(dt); }; sc.life = c; }
const hallDoor = v => G => G.shows.enterHall(v);
defineRoom({ id: 'concerthall', name: 'Maple Bay Symphony Hall', w: 18, d: 13, noCrowd: true, music: 'quiet', showVenue: 'concerthall', floor: GT.f_check, floors: [{ x0: 5, y0: 4, x1: 13, y1: 12, floor: GT.f_stone }], wall: { color: '#ece0c8', trim: '#b8862a', rail: 1.2, h: 4.4 },
  items: [V('generic.rug', 7, 6, { w: 4, d: 3, c: '#8a2a3a', c2: '#d8a848' }), V('perf.boxoffice', 1, 1.2), V('bar.backbar', 5.5, 0), V('bar.counter', 5.5, 1.5, null, { tags: ['perfbar'], venue: 'concerthall:bar' }), V('bar.stool', 6, 2.5), V('bar.stool', 7.5, 2.5),
    V('perf.stairs', 9.6, 0), V('perf.coatcheck', 14.2, .3), V('perf.chandelier', 4.5, 5.5), V('perf.chandelier', 11.5, 5.5),
    WX('perf.poster', 2.6, { poster: 'waltz' }), WX('perf.poster', 3.8, { poster: 'adagio' }), WX('perf.poster', 5, { poster: 'overture' }), WX('perf.marquee', 10.2, { title: 'TONIGHT 19:30', w: 3.6, c: '#2a3a6a' }), WX('generic.doorway', 7.3),
    V('perf.rope', 1.2, 6.6, null, { flip: true }), V('perf.usher', 1.6, 9.1), V('generic.sofa', 14.5, 8.5, { c: '#2f5a7a' }), V('generic.sofa', 14.5, 10.5, { c: '#2f5a7a' }), V('generic.plant', 17.3, 12.3), V('generic.plant', .3, 12.3), V('station.piano', 12.2, 4.6)],
  exits: [{ x: 9, y: 12.5 }, { x: .8, y: 7.8, label: 'Auditorium', use: hallDoor('concerthall') }],
  setup(sc) { lobbyLife(sc, [{ x: 2.5, y: 1.65, dir: 1, kind: 'staff', label: 'Box office' }, { x: 7, y: 1, dir: 1, kind: 'staff', label: 'Bartender' }, { x: 15.7, y: 1, dir: 1, kind: 'staff', label: 'Coat check' }, { x: 1.7, y: 10.2, dir: 0, kind: 'staff', label: 'Usher', lines: ['Tickets, please. Doors open fifteen minutes before the downbeat.'] },
    { x: 6.3, y: 3.2, dir: 3, anim: 'drink' }, { x: 8, y: 3.3, dir: 3, anim: 'talk' }, { x: 9, y: 7, dir: 2, anim: 'talk' }, { x: 8, y: 7.4, dir: 0, anim: 'talk' }, { x: 12, y: 9, dir: 3 }, { x: 4, y: 9.5, dir: 1, anim: 'phone' }, { x: 15.2, y: 9.1, z: .45, dir: 2, anim: 'sit', seated: true }, { x: 11.5, y: 3.4, dir: 0, age: 'elder' }], 'concerthall'); } });
defineRoom({ id: 'playhouse', name: 'The Lantern Playhouse', w: 12, d: 9, noCrowd: true, music: 'quiet', showVenue: 'playhouse', floor: GT.f_carpet, floors: [{ x0: 0, y0: 0, x1: 12, y1: 2.6, floor: GT.f_wood }], wall: { color: '#4a2a3a', trim: '#d8a848', rail: 1, h: 3.4 },
  items: [V('generic.rug', 4.5, 4.5, { w: 3, d: 2.5, c: '#2a3a6a', c2: '#d8a848' }), V('perf.boxoffice', .6, 1.2, { c: '#2a3a6a', name: 'TICKETS' }), V('cinema.concession', 4.6, 1.6, { c: '#2a3a6a' }, { tags: ['perfbar'], venue: 'playhouse:snacks' }), V('cinema.popcorn', 8.3, 1.6),
    WY('cinema.curtain', 9.6, { w: 2, c: '#2a3a6a' }), WX('perf.poster', 2.8, { poster: 'understudy' }), WX('perf.poster', 3.9, { poster: 'platform' }), WX('perf.poster', 5, { poster: 'mybay' }), WX('perf.marquee', 6.2, { title: 'TONIGHT 20:00', w: 2.6 }),
    V('perf.usher', 9, 2.2), V('generic.sofa', .5, 6.8, { c: '#7a2a4a' }), V('generic.plant', 11.3, 8.3), V('generic.floorlamp', .3, 5.8), V('perf.chandelier', 5, 3.6)],
  exits: [{ x: 6, y: 8.5 }, { x: 10.6, y: .8, label: 'Auditorium', use: hallDoor('playhouse') }],
  setup(sc) { lobbyLife(sc, [{ x: 2.1, y: 1.65, dir: 1, kind: 'staff', label: 'Box office' }, { x: 6.6, y: 1.1, dir: 1, kind: 'staff', label: 'Snack counter' }, { x: 9.3, y: 3.2, dir: 1, kind: 'staff', label: 'Usher', lines: ['Tickets, please. Doors open fifteen minutes before curtain.'] },
    { x: 5, y: 3.6, dir: 3, anim: 'talk' }, { x: 6.2, y: 3.8, dir: 3 }, { x: 3.4, y: 6, dir: 0, anim: 'phone' }, { x: 1.3, y: 7.25, z: .45, dir: 0, anim: 'sit', seated: true }, { x: 8.5, y: 6.2, dir: 2, anim: 'talk' }], 'playhouse'); } });

export function init() {
  try { registerInstance('gen_bar', 'concerthall:bar', 'The Interval Bar', 'arts'); registerInstance('gen_cafe', 'playhouse:snacks', 'Playhouse Snack Counter', 'arts'); } catch (e) { console.warn('performance venues', e); }
  registerFixture('boxoffice', (fx, scene) => (scene.def.showVenue ? { label: 'Box office', use: () => G.shows && G.shows.openBoxOffice(scene.def.showVenue) } : null));
  registerFixture('perfbar', (fx) => (fx.item.venue ? { label: fx.item.venue === 'concerthall:bar' ? 'Interval bar' : 'Snacks', use: () => G.shop && G.shop.open(fx.item.venue) } : null));
}
