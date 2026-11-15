// Maple Bay Aquarium — 'aquarium:turtles' (26 x 18, bright): the TURTLE LAGOON. A warm lagoon fills the back of the room (x0-26, y0-11) behind low glass; a short pier (x11.5-14.5, y6.5-11) runs out into it so the
// turtles pass on both sides of you and over your head. Four named residents with their own habits (data TURTLES): Moss the green (curious: comes to the glass), Biscotti the loggerhead (sleeps on the sand),
// Opal the hawksbill (quick, weaves through the coral), Old Tom the leatherback (huge, slow laps, surfaces to breathe every half minute). Plus a hatchling nursery window, a lettuce crate at the end of the pier,
// keeper Kekoa's feeding talk with a diver (10:45 and 15:00), yellow tangs, chromis and parrotfish.  scene.aq = { swimmers (turtles + fish), turtles, diver, keeper, show { turtle }, force(), sync(), tanks }
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { Char } from '../../core/char.js';
import * as R from '../../engine/raster.js';
import { ambient } from '../../core/clock.js';
import { defineRoom } from '../interior.js';
import { toast, bubble } from '../../ui/kit.js';
import { crowd, walkers } from './_show_life.js';
import { specs } from './_airport_life.js';
import { wallTank, Swimmer, school, paint, spr } from './aquarium_life.js';
import { Turtle, DiverEnt, caustics } from './aquarium_life2.js';
import { AQ_VENUES, SHOWS, TURTLES } from '../../data/aquarium.js';

const O = 1, W = 26, D = 18, GY = 11, PX0 = 11.5, PX1 = 14.5, PY0 = 6.5, pick = a => a[Math.floor(Math.random() * a.length)], AS = () => G.aquarium;
const items = [], spots = [];
const A = (id, x, y, p, o) => { const it = Object.assign({ id: 'furn.aqua.' + id, x, y, p: p || {} }, o); items.push(it); return it; }, S = (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o));
const LN = { visitor: ['The big one is sixty years old. He was here before the building.', 'Watch: she is going up for a breath. There!', 'The little amber one never stops. Round and round the coral.', 'Biscotti has not moved in twenty minutes. I envy her.', 'One of them swam right over my head on the pier.'], kid: ['TURTLE!', 'He looked at me. The giant one LOOKED at me.', 'The baby ones are the size of my hand!', 'Can I give it the lettuce? Can I?'],
  kekoa: ['Four turtles, four species, four completely different opinions about lettuce.', 'Old Tom is a leatherback. No hard shell: it is like ridged rubber. He eats jellyfish in the wild, so we make him jelly out of gelatine and squid.', 'Opal, the small amber one, is a hawksbill. That beak is for picking sponges out of the reef.', 'Biscotti is the loggerhead having a lie-down. She was hit by a boat years ago and cannot dive deep, so she retired here.', 'And Moss is a green turtle, the nosy one. Greens are vegetarians: watch what happens to this lettuce.', 'Every one of them breathes air. Watch them come up: one breath can last a turtle five hours asleep. Thank you for coming!'] };
(function build() {
  A('curb', 0, GY, { len: PX0 - .2 }); A('curb', PX1 + .2, GY, { len: W - PX1 - .2 }); A('glint', 0, GY + .05, { len: PX0 - .4, h: 1.5 }); A('glint', PX1 + .3, GY + .05, { len: W - PX1 - .5, h: 1.5 });
  A('curb', PX0 - .2, PY0 - .2, { len: 4.7 }, { flip: true }); A('curb', PX1, PY0 - .2, { len: 4.7 }, { flip: true }); A('curb', PX0 - .2, PY0 - .2, { len: PX1 - PX0 + .4 });
  A('bucket', 12.75, 6.75, {}, { tags: ['aqua_lettuce'], lettuce: 1 });
  TURTLES.forEach((t, i) => A('plaque', [2.4, 7.4, 17.4, 22.4][i], GY + .25, { c: '#17666f' }, { sp: t.sp, who: t.name }));
  A('bench', 4, 13.4, { c: '#f0735a' }, { kind: 'turtle' }); A('bench', 8, 13.4, { c: '#f0735a' }, { kind: 'turtle' });
  A('tankwall', 18.4, 13.6, { w: 5.6, h: 2.4 }); A('plaque', 24.3, 14.2, { c: '#17666f' }, { sp: 'hatchling' }); A('plant', .5, 16.6, { seed: 3 }); A('plant', 24.9, 16.9, { seed: 9 }); A('plant', 10.6, 16.8, { seed: 5 });
  // lagoon floor
  for (const [x, y, s, sd] of [[4.4, 2.2, 1.5, 2], [17.6, 2.6, 1.4, 4], [21.4, 3.6, 1.2, 6], [22.6, 8.4, 1.3, 8], [7, 9, 1, 3], [1.2, 7, 1.1, 5]]) A('rock', x, y, { seed: sd, s, grow: 1, c: '#b8a888' });
  for (const [x, y, k] of [[19.6, 4.6, 1], [16.4, 3.6, 0], [23.6, 5.6, 2], [9, 3, 1], [2.6, 4.6, 0], [20.6, 1.6, 2], [6, 6.6, 2], [16.6, 8.6, 0]]) A('coral', x, y, { k, big: k === 1, seed: (x * 3) | 0 });
  for (const [x, y, sd] of [[10, 1.4, 1], [24.4, 1.4, 2], [1, 1.6, 3], [9.4, 7.6, 4], [15.6, 6.6, 5]]) A('kelp', x, y, { h: 1.4, seed: sd, frame: 0 }, { anim: 1 });
  S(3, GY + .9, 3, { p: .7 }); S(6.4, GY + .9, 3, { age: 'kid', label: 'Kid', lines: LN.kid, p: .8 }); S(19, GY + .9, 3, { p: .6, anim: 'phone' }); S(23.4, GY + .9, 3, { busy: 1, age: 'kid', lines: LN.kid }); S(12.3, 9, 2, { age: 'kid', label: 'Kid', lines: LN.kid, p: .6 }); S(20, 15.2, 3, { p: .6 }); S(22, 15.2, 3, { busy: 1, age: 'kid', lines: LN.kid }); S(10, GY + .9, 3, { busy: 1 });
})();
const N = { a: [13, 17], b: [6.2, 12.4], c: [2.6, 12.4], d: [10, 12.3], e: [13.2, 10.6], f: [13.6, 7.8], g: [17, 12.3], h: [21.2, 15.6], i: [15.6, 15.8], m: [13, 11.8] };
const RT = [['a', 'd', 'b*', 'c*', 'd', 'm', 'e', 'f*', 'e', 'm', 'g*', 'i', 'h*', 'i', 'a'], ['a', 'i', 'h*', 'i', 'g*', 'm', 'e', 'f*', 'e', 'm', 'd', 'b*', 'd', 'a']];
const inPier = (x, y) => x > O + PX0 - .7 && x < O + PX1 + .7 && y > O + PY0 - .7 && y < O + GY + .5, zmin = (x, y) => (inPier(x, y) ? 2.4 : .1), circ = pts => pts.map(p => [p[0] + O, p[1] + O, p[2]]);
const HABIT = { moss: { pts: [[3, 3, 1.6], [10, 2.4, 2], [18, 3, 1.4], [23, 6, 1.8], [18, 9.4, 1.2], [9, 9.6, 1.4], [3, 8, 1.8]], speed: .62, w: { breathe: 45, rest: 110, visit: 16 }, rests: [[8.6, 5]] },
  biscotti: { pts: [[5, 5, 1], [12, 3.6, 1.2], [20, 5, .9], [21, 8, 1], [8, 8.6, .9]], speed: .4, w: { breathe: 70, rest: 24, visit: 90 }, rests: [[5, 7.4], [19.4, 7.6]] },
  opal: { pts: [[16, 2, .8], [19, 3.6, 1.1], [22.4, 2.4, .7], [24, 5.4, 1], [20.6, 6.4, .8], [17.4, 5, 1.2]], speed: .9, w: { breathe: 50, rest: 150, visit: 40 }, rests: [[22, 6.6]] },
  tom: { pts: [[2, 2, 2.3], [24, 2, 2.5], [24.4, 9.6, 2.1], [16.4, 9.8, 2.3], [16, 5.2, 2.6], [10, 5.2, 2.6], [9.6, 9.8, 2.3], [2, 9.6, 2.1]], speed: .46, w: { breathe: 24, rest: 400, visit: 70 }, rests: [[3, 5]], bb: [-.7, -.7, .7, .7, .5] } };
defineRoom({ id: 'aquarium:turtles', name: 'Maple Bay Aquarium: Turtle Lagoon', w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'aquarium', venue: AQ_VENUES.place,
  floor: GT.f_stone, bg: '#0c1a2c', edge: '#16324f', wall: { color: '#bfe4ee', trim: '#1f8f9a', h: 4.2 },
  exits: [{ x: 13, y: 17.5, label: 'Back to the Bay Hall', use: () => G.go('int:aquarium', { x: O + 24.6, y: O + 12.2, dir: 2 }) }], spawn: { x: 13, y: 16.6, dir: 3 }, items, npcSpots: spots,
  setup(sc) {
    const Wd = sc.world, setP = (o, q) => { o.p = Object.assign({}, o.p, q); o._key = null; }, anim = Wd.objs.filter(o => o.data && o.data.anim);
    Wd.decal({ x0: O, y0: O, x1: O + W, y1: O + D, draw(Rr) { const h2 = Rr.hash2;
      const sand = (x, y) => { const k = Math.sin(x * 2.4 + Math.sin(y * 1.9) * 1.3) + Math.sin(y * 3.1 + x * .6); return k > 1.25 ? '#bff0e8' : k < -1.2 ? '#6ec8cc' : h2(Math.floor(x * 8), Math.floor(y * 8), 7) > .96 ? '#e8f8e0' : '#8ad8d4'; };
      const deck = (x, y) => { const fx = x / 1.5 - Math.floor(x / 1.5), fy = y - Math.floor(y); if (fx < .04 || fy < .05) return '#c8b088'; return h2(Math.floor(x / 1.5), Math.floor(y), 2) > .5 ? '#ecd8ac' : '#e4cea0'; };
      const pier = R.PAT.fboards('#c8976a', .5);
      Rr.qz(O, O + W, O, O + GY, 0, sand); Rr.qz(O, O + W, O + GY, O + D, 0, deck); Rr.qz(O + PX0, O + PX1, O + PY0, O + GY + .2, 0, pier); } }); Wd.version++;
    Wd.block(O, O, O + PX0 - .2, O + GY); Wd.block(O + PX1 + .2, O, O + W, O + GY); Wd.block(O + PX0 - .2, O, O + PX1 + .2, O + PY0 - .2);
    Wd.lights.push({ x: O + 6, y: O + 12.5, z: 0, r: 6, c: '#8fe8f0' }, { x: O + 20, y: O + 12.5, z: 0, r: 6, c: '#8fe8f0' }, { x: O + 13, y: O + 8.6, z: 0, r: 5, c: '#8fe8f0' });
    const tanks = { back: wallTank({ x: O, y: O + .02, z: 0, w: W, h: 4.1, axis: 'y', kind: 'lagoon', frame: false }), side: wallTank({ x: O + .02, y: O, z: 0, w: GY, h: 4.1, axis: 'x', kind: 'lagoon', frame: false }), nursery: wallTank({ x: O + 18.4, y: O + 14.42, z: .35, w: 5.6, h: 1.9, axis: 'y', kind: 'nursery' }) };
    for (const k in tanks) sc.ents.push(tanks[k].ent);
    const cst = caustics({ x0: O, y0: O, x1: O + W, y1: O + GY, ok: (x, y) => !(x > O + PX0 - .2 && x < O + PX1 + .2 && y > O + PY0 - .2), col: '#ffffff80', lit: true }); sc.ents.push(cst.ent);
    // ---- the residents
    const glass = p => { const x = p.x - O, y = p.y - O; if (y < GY && x > PX0 - .3 && x < PX1 + .3) return [O + (x < 13 ? PX0 - 1.2 : PX1 + 1.2), O + Math.max(PY0 + .6, y), 1.1]; if (y > GY + 3.2) return null; const gx = Math.max(1.5, Math.min(W - 1.5, x)); return [O + (gx > PX0 - 1.2 && gx < PX1 + 1.2 ? (gx < 13 ? PX0 - 1.4 : PX1 + 1.4) : gx), O + GY - .9, 1]; };
    const sw = [], turtles = TURTLES.map((t, i) => { const h = HABIT[t.id], tt = new Turtle({ sp: t.sp, name: t.name, pts: circ(h.pts), speed: h.speed, at: i * .23, fr: 2, zmin, surf: 3.4, w: h.w, rests: circ(h.rests.map(r => [r[0], r[1], 0])), glass, bb: h.bb || [-.4, -.4, .4, .4, .35] }); tt.id = t.id; sw.push(tt); sc.ents.push(tt); return tt; });
    const rip = paint(18, 9, set => { for (let a = 0; a < 20; a++) { const an = a / 20 * 6.283; set(9 + Math.cos(an) * 8, 4 + Math.sin(an) * 3.6, '#ffffff'); if (a % 2) set(9 + Math.cos(an) * 5, 4 + Math.sin(an) * 2.2, '#dff8ff'); } }), RS = spr(rip);
    const rips = turtles.map(t => { const e = { x: 0, y: 0, z: 3.7, hidden: true, bb: [-.3, -.3, .3, .3, .05], sprite: () => RS }; sc.ents.push(e); return e; });
    for (const s of school({ sp: 'ytang', n: 12, pts: circ([[4, 8, 1.4], [10, 3, 2], [20, 3, 1.6], [23, 8, 1.8], [17, 9.6, 1.2]]), speed: .9, zmin, fr: 5 })) { sw.push(s); sc.ents.push(s); }
    for (const s of school({ sp: 'chromis', n: 16, pts: circ([[20, 5, 1.4], [22.4, 3, 1.8], [19, 2.4, 1.2], [17.4, 4.6, 1.6]]), speed: .6, zmin, fr: 6 })) { sw.push(s); sc.ents.push(s); }
    for (let i = 0; i < 2; i++) { const s = new Swimmer({ sp: 'parrot', pts: circ([[3, 3.4, .8], [8, 2.4, 1], [9, 8.6, .8], [3, 9, 1]]), speed: .7, at: i * .5, zmin, fr: 4 }); sw.push(s); sc.ents.push(s); }
    const diver = new DiverEnt(O + 7, O + 5.4, 1.6); sc.ents.push(diver);
    const P = specs(), keeper = new Char(Object.assign({}, P.staff[3], { topColor: '#f29a3a' }), O + 15.8, O + 12.4); keeper.kind = 'staff'; keeper.dir = 1; sc.ents.push(keeper);
    sc.interactables.push({ ent: keeper, x: keeper.x, y: keeper.y, label: 'Kekoa, turtle keeper', h: 1.3, hit: 8, range: 1.8, visible: () => !keeper.hidden, use: () => { keeper._hold = 4; if (AS()) AS().talkKeeper(keeper, sc, 'turtle'); } });
    const seats = []; for (const f of sc.fixtures) if (/aqua\.bench/.test(f.asset.id)) f.seats.forEach(s => seats.push({ x: s.x - O, y: s.y - O, z: s.z, dir: 3, seated: true, p: .4, lines: LN.visitor }));
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 19, fill: .7, lines: LN.visitor });
    const lane = () => { const r = pick(RT), stay = r.map(k => k.endsWith('*')), keys = r.map(k => k.replace('*', '')); return { pts: keys.map((k, i) => Object.assign({ x: N[k][0] + O + (Math.random() - .5) * .4, y: N[k][1] + O + (Math.random() - .5) * .3 }, stay[i] ? { wait: 7 + Math.random() * 8, pose: Math.random() < .3 ? 'phone' : null, dir: 3 } : null)), kind: 'stroll' }; };
    const wk = walkers(sc, { n: 8, route: lane, lines: LN.visitor, label: 'Visitor' });
    const show = { turtle: false }, forced = {}; let tick = 0, ft = 0, fb = 0, open = null, lvl = -1, li = 0, lt = 0, night = null;
    const showOn = () => { if (forced.turtle > 0) return true; const h = G.now().hf, sh = SHOWS.find(s => s.id === 'turtle'); return !!open && sh.at.some(t => h >= t && h < t + sh.dur); };
    const sync = () => { const n = G.now(), h = n.hf, isOpen = AS() ? AS().isOpen() : true, on0 = show.turtle, nt = h >= 19.5 || h < 6.5; open = isOpen; const on = showOn(), l = !isOpen ? 0 : nt ? .25 : (h < 10 ? .3 : h < 16.5 ? .7 : .4) + (n.weekday >= 5 ? .2 : 0);
      if (l !== lvl) { lvl = l; for (const c of cr.list) { const sp = c.spot; c.hidden = !isOpen || (nt && sp.age === 'kid') || (sp.busy ? l < .6 || c.roll > l + .2 : c.roll > (sp.p !== undefined ? Math.min(sp.p, l + .15) : l)); } wk.setActive(!isOpen ? 0 : Math.round(2 + l * 7), !isOpen); keeper.hidden = !isOpen || nt; }
      if (nt !== night) { night = nt; for (const t of turtles) t.sleep = nt; for (const k in tanks) tanks[k].night(nt); }
      if (on !== on0) { show.turtle = on; li = 0; lt = 1; diver.hidden = !on; for (const t of turtles) t.food = on ? diver : null; if (on) toast('Turtle feeding! A diver slips into the lagoon with an armful of lettuce, and Kekoa picks up the microphone.', 'good', 4800); else keeper.pose = null; G.emit('aquarium:show', 'turtle', on); } };
    sc.life = { crowd: cr, walkers: wk, count: () => cr.count() + wk.count() };
    sc.aq = { swimmers: sw, turtles, diver, keeper, show, tanks, sync, nodes: N, routes: RT, force(id, sec = 60) { forced.turtle = sec; sync(); return true; }, night: () => night,
      lure(x, y, sec) { const t = turtles.filter(q => q.st !== 'rest' || !q.sleep).reduce((a, b) => (Math.hypot(a.x - x, a.y - y) < Math.hypot(b.x - x, b.y - y) ? a : b)); const f = { x, y, z: 1.3, 0: x, 1: y, 2: 1.3 }; t.food = f; setTimeout(() => { if (t.food === f) t.food = show.turtle ? diver : null; }, sec * 1000); return t; } };
    sc.env = t => { const o = ambient(t, G.state.weather); return night ? { amb: '#5a6aa8', dark: .7, bg: Wd.bg, night: true } : { amb: o.amb === '#ffffff' ? o.amb : R.mix(o.amb, '#ffffff', .6), dark: Math.min(.4, (o.dark || 0) * .4), bg: Wd.bg, night: o.night }; };
    sync();
    const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); const p = G.player; cr.update(dt); wk.update(dt); for (const k in tanks) tanks[k].tick(dt, p); cst.update(dt); if (!diver.hidden) diver.tick(dt);
      for (let i = 0; i < sw.length; i++) sw[i].tick(dt, p); for (let i = 0; i < turtles.length; i++) { const t = turtles[i], r = rips[i]; r.hidden = !(t.rip > 0); if (!r.hidden) { r.x = t.x; r.y = t.y; r.alpha = Math.min(1, t.rip); } }
      if (forced.turtle > 0) forced.turtle -= dt; if ((tick -= dt) <= 0) { tick = 1.2; sync(); } if ((ft += dt) > .5) { ft = 0; fb++; for (const o of anim) setP(o, { frame: fb % 2 }); }
      keeper.t += dt; if (keeper._hold > 0) keeper._hold -= dt; else if (show.turtle) { keeper.pose = 'talk'; if ((lt -= dt) <= 0) { lt = 6.5; bubble(keeper, LN.kekoa[li % LN.kekoa.length], 5800); li++; if (li === LN.kekoa.length && AS()) AS().talkDone('turtle', sc); } } else keeper.pose = null; };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); lvl = -1; sync(); if (AS()) AS().arrived(sc, pv); };
  },
});
