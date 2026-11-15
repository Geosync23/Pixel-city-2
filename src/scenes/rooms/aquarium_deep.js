// Maple Bay Aquarium — the other three rooms (fixture handlers are registered in aquarium.js; gameplay in sim/aquarium.js).
//   'aquarium:deep' (34 x 20, dark): the OCEAN TUNNEL (x0-20: a glass corridor at y8-11 through a tank that fills the rest of the room; sand tigers, leopard sharks, eagle rays, a green turtle, a giant sea bass
//       and a sardine school are real 3D entities that pass beside and over you), the JELLYFISH GALLERY (x20-34, y0-10: colour-cycling wall of jellies, benches) and THE ABYSS (x20-34, y10-20: deep-sea window, octopus).
//       scene.aq = { swimmers, tanks, bags (sleepover), zoneAt, sync() }
//   'aquarium:deck' (22 x 14, open air): sea otter pool, harbor seal pool, the stand, keeper Anja's feeding talk (13:00, 16:30).  scene.aq = { otters, seals, keeper, show { otter }, force(), sync() }
//   'aquarium:lab' (14 x 10): Behind the Scenes — the rehab pool with the rescued turtle, food prep, quarantine racks, jelly nursery.  scene.aq = { turtle, sync() }
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { Char } from '../../core/char.js';
import * as R from '../../engine/raster.js';
import { ambient } from '../../core/clock.js';
import { defineRoom } from '../interior.js';
import { toast, bubble } from '../../ui/kit.js';
import { crowd, walkers } from './_show_life.js';
import { specs } from './_airport_life.js';
import { wallTank, Swimmer, school, Critter } from './aquarium_life.js';
import { Turtle, caustics, SHARKS } from './aquarium_life2.js';
import { AQ_VENUES, SHOWS } from '../../data/aquarium.js';

const O = 1, pick = a => a[Math.floor(Math.random() * a.length)], AS = () => G.aquarium;
const mkItems = () => { const items = [], spots = []; return { items, spots, A: (id, x, y, p, o) => { const it = Object.assign({ id: 'furn.aqua.' + id, x, y, p: p || {} }, o); items.push(it); return it; }, S: (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o)) }; };
const LN = {
  tunnel: ['Look up. LOOK UP.', 'That is the sand tiger. She has been here longer than I have.', 'The turtle comes round about every two minutes. I have been timing her.', 'I keep forgetting there is glass.', 'The little silver ones move like one animal.'],
  jelly: ['Shh. It is like a lava lamp that is alive.', 'I come here on my lunch break. Do not tell my office.', 'They have no brain and they seem fine. There is a lesson there.', 'Wait for the purple. The purple is the best one.'],
  abyss: ['The light on its head is BACTERIA.', 'A woodlouse the size of a cat. No thank you. Tell me more.', 'The octopus is watching us. I am sure of it.'],
  kid: ['A SHARK!', 'It went over my HEAD!', 'Is the turtle a hundred?', 'Can sharks see me?'],
  deck: ['The little one cracks clams on her tummy. With a rock. Her own rock.', 'Smell that? That is the harbor. And herring.', 'The seals come up to look at YOU, you know.', 'Feeding at one and half past four. Anja does the talk.'],
  anja: ['Sea otters eat a quarter of their weight every day. That is forty burgers for you or me.', 'They have the thickest fur of any animal: a million hairs in a patch the size of a stamp.', 'See the rock? She keeps it in a pocket of skin under her arm. Same rock for years.', 'When they sleep they hold paws, so nobody drifts off alone.', 'Our three were found as orphans along this coast. They cannot go back, so they teach instead.', 'And the harbor seals next door are just here for the gossip. Thank you all for coming!'],
};

/* ================= THE DEEP ================= */
const DW = 34, DD = 20, TX = 20, TY0 = 8, TY1 = 11;
const DZ = [{ id: 'tunnel', name: 'Ocean Tunnel', x0: 0, y0: 0, x1: 20.2, y1: 20 }, { id: 'jelly', name: 'Jellyfish Gallery', x0: 20.2, y0: 0, x1: 34, y1: 10.2 }, { id: 'abyss', name: 'The Abyss', x0: 20.2, y0: 10.2, x1: 34, y1: 20 }];
const dp = mkItems();
(function buildDeep() {
  const { A, S } = dp;
  A('curb', 0, TY0 - .2, { len: TX }); A('curb', 0, TY1, { len: TX }); A('glint', 0, TY1 + .05, { len: TX, h: 2.4 });
  for (let x = 2.6; x < TX; x += 2.9) A('rib', x, TY0, { span: 3, h: 2.6 });
  A('curb', TX, 0, { len: 7.8 }, { flip: true }); A('curb', TX, TY1 + .2, { len: 8.8 }, { flip: true });
  A('stairs', .2, 8.7, { name: 'REEF', up: 1 }, { to: 'reef' }); A('photospot', 9.4, 9, { k: 'tunnel' }, { spot: 'tunnel' });
  [['sandtiger', 3.4], ['ray3', 6.4], ['sardine', 15], ['leopard', 17.6]].forEach(([sp, x]) => A('plaque', x, TY0 + .02, { c: '#0f2a48' }, { sp })); A('plaque', 12, TY0 + .02, { c: '#0f2a48' }, { sps: ['turtle', 'hawks'] }); A('plaque', 8.4, TY0 + .02, { c: '#0f2a48' }, { sps: ['blacktip', 'hammerhead'] });
  A('plaque', 4.8, TY1 - .37, { c: '#0f2a48' }, { sps: ['bass', 'mola'] }); A('plaque', 14.4, TY1 - .37, { c: '#0f2a48' }, { sp: 'manta' });
  for (const [x, c] of [[4.6, '#f0735a'], [7.6, '#3b6fd0'], [10.6, '#58c4a0'], [13.6, '#f2c24a'], [16.2, '#f0735a']]) A('sleepbag', x, 8.25, { c }, { bag: 1 });
  // sea bed (behind the glass)
  A('wreck', 5.6, 13.6); A('anchor', 14.4, 16.4); A('chest', 3, 17, { frame: 0 }, { anim: 1 }); A('rock', 16, 12.6, { seed: 2, s: 1.6, grow: 1 }); A('rock', 11.6, 17.4, { seed: 5, s: 1.3, grow: 1 }); A('rock', 1, 13, { seed: 7, s: 1.2 }); A('rock', 18, 17.6, { seed: 3, s: 1 });
  A('rock', 3, 2, { seed: 4, s: 1.7, grow: 1 }); A('rock', 9.4, 4.4, { seed: 6, s: 1.4, grow: 1 }); A('rock', 15.4, 2, { seed: 8, s: 1.8, grow: 1 }); A('rock', 18, 5.6, { seed: 9, s: 1 }); A('rock', 6.4, 6, { seed: 11, s: .9 });
  for (const [x, y, h, s] of [[1, 5, 3.4, 1], [12, 1.4, 4, 2], [17.4, 4, 3, 3], [7, 2.4, 3.6, 4], [9.6, 14.6, 3, 5], [18.4, 14.4, 3.6, 6], [1.4, 16, 2.6, 7], [13, 6.4, 2.2, 8]]) A('kelp', x, y, { h, seed: s, frame: 0 }, { anim: 1 });
  for (const [x, y, k] of [[5, 4, 0], [13.6, 4.6, 1], [8, 12.4, 2], [12.6, 13.6, 0], [16.6, 15.6, 1], [3.6, 12.2, 1], [10.4, 6.6, 2], [2, 6.6, 0]]) A('coral', x, y, { k, big: k === 1, seed: x | 0 });
  S(6.2, 8.5, 3, { age: 'kid', label: 'Kid', lines: LN.kid, p: .8 }); S(13.4, 10.5, 1, { age: 'kid', label: 'Kid', lines: LN.kid, p: .7 }); S(8.6, 10.5, 1, { p: .6, anim: 'phone' }); S(16.4, 8.5, 3, { busy: 1 }); S(11, 8.5, 3, { busy: 1, age: 'elder' });
  // jellyfish gallery
  [['moon', 21.6], ['nettle', 23.7], ['comb', 25.8], ['lion', 27.9], ['upside', 30], ['crystal', 32.1]].forEach(([sp, x]) => A('plaque', x, 1, { c: '#3a2a6a' }, { sp }));
  A('bench', 22.6, 4, { c: '#3a2a6a' }, { kind: 'jelly' }); A('bench', 26, 4, { c: '#3a2a6a' }, { kind: 'jelly' }); A('bench', 29.4, 4, { c: '#3a2a6a' }, { kind: 'jelly' }); A('bench', 24.4, 6.6, { c: '#3a2a6a' }, { kind: 'jelly' }); A('bench', 27.8, 6.6, { c: '#3a2a6a' }, { kind: 'jelly' });
  A('sign', 20.3, 8.2, { name: 'JELLYFISH', w: 3, c: '#3a2a6a', fg: '#f8c8ff' }, { flip: true, z: 2.8 });
  S(23.6, 2.2, 3, { p: .7 }); S(30, 2.3, 3, { p: .6, anim: 'phone' }); S(26.6, 2.2, 3, { busy: 1, age: 'kid', lines: LN.kid });
  // the abyss
  A('tankwall', 22, 10.2, { w: 10, h: 3 }); [[['angler', 'lantern'], 22.6], [['isopod', 'spidercrab'], 25.4], [['vampire', 'firefly'], 28.2], [['nautilus'], 31]].forEach(([sps, x]) => A('plaque', x, 11.5, { c: '#101828' }, { sps }));
  A('tankwall', 20.3, 12.4, { w: 5, h: 2.7 }, { flip: true }); A('plaque', 21.5, 17.7, { c: '#101828' }, { sp: 'octopus' }); A('bench', 25.6, 14.6, { c: '#101828' }, { kind: 'abyss' });
  A('stairs', 31.4, 16.8, { name: 'SHOP', up: 1 }, { to: 'shop' }); A('sign', 22.6, 11.05, { name: 'THE ABYSS', w: 3, c: '#05070f', fg: '#58e0ff' }, { z: 3 });
  S(24, 12.7, 3, { p: .6 }); S(29, 12.8, 3, { busy: 1 }); S(22, 16.2, 2, { p: .5, age: 'kid', lines: LN.kid });
})();
const DN = { a: [2.9, 9.5], b: [6.5, 9.7], c: [11, 9.3], d: [15.4, 9.7], e: [19.4, 9.5], f: [21.3, 9.4], g: [21.3, 4.6], h: [23.4, 2.5], i: [28.6, 2.5], j: [32.6, 2.8], k: [33, 9], l: [33, 12.9], m: [30.6, 12.9], n: [24.4, 12.9], o: [22.3, 12.9], p: [23.8, 17.4], q: [31, 16.4] };
const DR = [['a', 'b*', 'c*', 'd*', 'e', 'f', 'g', 'h*', 'i*', 'j', 'k', 'l', 'm*', 'n*', 'p', 'q'], ['q', 'p', 'n*', 'm*', 'l', 'k', 'j', 'i*', 'h*', 'g', 'f', 'e', 'd*', 'c*', 'b*', 'a'], ['a', 'b*', 'c', 'd*', 'e', 'f', 'o', 'n*', 'p', 'q']];
const zmin = (x, y) => (y > O + TY0 - .9 && y < O + TY1 + .9 && x < O + TX + .6 ? 3.05 : .4);
const circ = pts => pts.map(p => [p[0] + O, p[1] + O, p[2]]);
defineRoom({ id: 'aquarium:deep', name: 'Maple Bay Aquarium: The Deep', w: DW, d: DD, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'aquarium', venue: AQ_VENUES.place,
  floor: GT.f_carpet, bg: '#04070f', edge: '#0a1424', wall: { color: '#0c1830', trim: '#16324f', h: 4.6 }, exits: [], spawn: { x: 3, y: 9.5, dir: 0 }, items: dp.items, npcSpots: dp.spots, zones: DZ,
  setup(sc) {
    const Wd = sc.world, setP = (o, q) => { o.p = Object.assign({}, o.p, q); o._key = null; }, by = k => Wd.objs.filter(o => o.data && o.data[k]), anim = by('anim'), bags = by('bag');
    Wd.decal({ x0: O, y0: O, x1: O + DW, y1: O + DD, draw(Rr) { const h2 = Rr.hash2;
      const sand = (x, y) => { const k = Math.sin(x * 2.4 + Math.sin(y * 1.9) * 1.3) + Math.sin(y * 3.1 + x * .6); return k > 1.25 ? '#4a7098' : k < -1.2 ? '#2c4a70' : h2(Math.floor(x * 8), Math.floor(y * 8), 7) > .95 ? '#5a84ac' : '#38587f'; };
      const walk = (x, y) => { const Y = y - O; if (Y < TY0 + .12 || Y > TY1 - .12) return '#58c4dc'; return (Math.floor(x * 2) & 1) ? '#1c3450' : '#203a58'; };
      const jel = (x, y) => (h2(Math.floor(x * 6), Math.floor(y * 6), 3) > .92 ? '#3a2a6a' : ((Math.floor(x) + Math.floor(y)) & 1) ? '#1c1640' : '#201a48');
      const aby = (x, y) => (h2(Math.floor(x * 6), Math.floor(y * 6), 9) > .95 ? '#1c3040' : '#0c1220');
      for (const [x0, y0, x1, y1, f] of [[0, 0, TX, TY0, sand], [0, TY1, TX, DD, sand], [0, TY0, TX + .2, TY1, walk], [TX, 0, DW, 10.2, jel], [TX, 10.2, DW, DD, aby]]) Rr.qz(O + x0, O + x1, O + y0, O + y1, 0, f); } }); Wd.version++;
    Wd.block(O, O, O + TX, O + TY0 - .2); Wd.block(O, O + TY1 + .2, O + TX, O + DD);
    for (let x = 2; x < TX; x += 4) Wd.lights.push({ x: O + x, y: O + 9.5, z: 0, r: 4, c: '#6fb8f0' });
    Wd.lights.push({ x: O + 27, y: O + 3, z: 0, r: 7, c: '#b080f0' }, { x: O + 27, y: O + 13, z: 0, r: 5, c: '#4fd0f0' }, { x: O + 5, y: O + 15, z: 0, r: 6, c: '#5fa8e8' }, { x: O + 14, y: O + 4, z: 0, r: 6, c: '#5fa8e8' }, { x: O + 32, y: O + 17.5, z: 0, r: 4, c: '#ffe9b0' }, { x: O + 1.4, y: O + 9.5, z: 0, r: 4, c: '#ffe9b0' });
    const tanks = { back: wallTank({ x: O, y: O + .02, z: 0, w: TX, h: 4.5, axis: 'y', kind: 'ocean', frame: false }), side: wallTank({ x: O + .02, y: O, z: 0, w: DD, h: 4.5, axis: 'x', kind: 'ocean', frame: false }), jelly: wallTank({ x: O + 21, y: O + .02, z: .45, w: 12.4, h: 3.9, axis: 'y', kind: 'jelly' }), abyss: wallTank({ x: O + 22, y: O + 11.02, z: .4, w: 10, h: 2.45, axis: 'y', kind: 'abyss' }), octo: wallTank({ x: O + 21.12, y: O + 12.4, z: .4, w: 5, h: 2.2, axis: 'x', kind: 'octo' }) };
    const cst = caustics({ x0: O, y0: O, x1: O + TX, y1: O + DD, ok: (x, y) => y < O + TY0 - .3 || y > O + TY1 + .3, col: '#9fd8ff48', lit: true }); sc.ents.push(cst.ent); const jl = Wd.lights.find(l => l.c === '#b080f0'), JC = ['#b080f0', '#f080c0', '#f0a070', '#80e0a0', '#70c0f0', '#8090f0'];
    for (const k in tanks) sc.ents.push(tanks[k].ent);
    // ---- the swimmers
    const sw = [], add = o => { const s = new Swimmer(Object.assign({ zmin }, o)); sw.push(s); sc.ents.push(s); return s; };
    const big = circ([[3, 4, 2], [16, 3.4, 2.6], [18, 9.5, 3.7], [16.4, 15.4, 2.2], [3.4, 15.6, 1.8], [2, 9.5, 3.6]]);
    add({ sp: 'sandtiger', pts: big, speed: 1.15, at: 0, bb: [-.5, -.5, .5, .5, .5] }); add({ sp: 'sandtiger', pts: circ([[17, 16.6, 1.4], [3, 17, 1.2], [1.6, 12.4, 2.4], [9.5, 9.5, 3.5], [17.4, 5.6, 2.2], [18, 12.6, 2.8]]), speed: 1, at: .5, bb: [-.5, -.5, .5, .5, .5] });
    add({ sp: 'leopard', pts: circ([[2, 12.6, .7], [18, 13, .8], [18, 18.4, .7], [2, 18.4, .8]]), speed: .9, at: .2 }); add({ sp: 'leopard', pts: circ([[18, 6.4, .7], [2, 6.2, .8], [2, 1.6, .7], [18, 1.6, .8]]), speed: .85, at: .6 });
    for (let i = 0; i < 3; i++) add({ sp: 'ray', pts: circ([[2, 9.5 + (i - 1) * .7, 3.3], [18, 9.5 + (i - 1) * .7, 3.4], [18.4, 4.6, 2.8], [10, 3 + i * .5, 2.4 + i * .3], [2, 4.4, 3]]), speed: 1.05, at: i * .12, fr: 3 });
    add({ sp: 'turtle', pts: circ([[5, 12.6, 2.2], [15, 12.8, 2.6], [16.4, 9.5, 3.4], [15, 6, 3], [5, 6, 2.4], [3.4, 9.5, 3.4]]), speed: .55, at: .3, fr: 2 });
    for (let i = 0; i < 2; i++) add({ sp: 'blacktip', pts: circ([[3, 2.4, 1.6], [17, 2.6, 1.8], [18, 6.4, 1.4], [10, 5.6, 2], [3, 6.2, 1.5]]), speed: 1.3, at: i * .09 });
    add({ sp: 'hammerhead', pts: circ([[17.6, 18, 2.2], [2.4, 17.6, 2.6], [2, 12.4, 2], [17, 12.6, 2.4]]), speed: 1, at: .4, bb: [-.5, -.5, .5, .5, .5] });
    add({ sp: 'manta', pts: circ([[3, 5, 3.6], [16, 4.4, 3.9], [17.6, 9.5, 4], [16, 15, 3.6], [4, 15, 3.5], [2.4, 9.5, 4]]), speed: .7, at: .7, fr: 2, bb: [-.8, -.8, .8, .8, .2] });
    add({ sp: 'mola', pts: circ([[12, 15.6, 2], [5, 13.4, 2.6], [8, 17.6, 1.8], [16, 18, 2.2]]), speed: .3, at: 0, fr: 2, bb: [-.4, -.4, .4, .4, 1.2] });
    { const t = new Turtle({ sp: 'hawks', name: 'hawksbill', pts: circ([[14, 2.4, 1.4], [5, 3, 1.8], [4, 9.5, 3.5], [6, 16, 1.6], [15, 16, 1.4], [16.4, 9.5, 3.5]]), speed: .6, at: .5, fr: 2, zmin, surf: 4, w: { breathe: 60, rest: 90, visit: 1e9 }, rests: [[O + 12, O + 16.6, 0]] }); sw.push(t); sc.ents.push(t); }
    add({ sp: 'bass', pts: circ([[4, 14, 1.4], [15, 14.6, 1.6], [16, 17.4, 1.3], [5, 17.6, 1.5]]), speed: .4, at: .1, fr: 2, bb: [-.4, -.4, .4, .4, .6] });
    const balls = []; for (const s of balls[0] = school({ sp: 'sardine', n: 34, pts: circ([[4, 3, 2.4], [15, 3.6, 3], [17, 9.5, 3.9], [14, 15, 2.6], [5, 15.4, 2.2], [3, 9.5, 3.8]]), speed: 1.6, zmin, fr: 6 })) { sw.push(s); sc.ents.push(s); }
    for (const s of school({ sp: 'smelt', n: 14, pts: circ([[16, 17, 1], [8, 13, 1.6], [2, 16, 1.2], [9, 18.4, 1]]), speed: 1.2, zmin, fr: 6 })) { sw.push(s); sc.ents.push(s); }
    // ---- life
    const seats = []; for (const f of sc.fixtures) { if (!/aqua\.bench/.test(f.asset.id)) continue; f.seats.forEach((s, i) => seats.push({ x: s.x - O, y: s.y - O, z: s.z, dir: 3, seated: true, p: .45, lines: LN.jelly })); }
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 31, fill: .7, lines: c => (c.x - O < TX ? LN.tunnel : c.y - O < 10 ? LN.jelly : LN.abyss) });
    const lane = () => { const r = pick(DR), stay = r.map(k => k.endsWith('*')), keys = r.map(k => k.replace('*', '')); return { pts: keys.map((k, i) => Object.assign({ x: DN[k][0] + O + (Math.random() - .5) * .3, y: DN[k][1] + O + (Math.random() - .5) * .5 }, stay[i] ? { wait: 6 + Math.random() * 8, pose: Math.random() < .3 ? 'phone' : null, dir: DN[k][0] < TX ? (Math.random() < .5 ? 3 : 1) : 3 } : null)), kind: 'stroll' }; };
    const wk = walkers(sc, { n: 10, route: lane, lines: LN.tunnel, label: 'Visitor' });
    let tick = 0, ft = 0, fb = 0, open = null, lvl = -1, sleep = null;
    const zoneAt = (x, y) => { for (const z of DZ) if (x >= z.x0 && x < z.x1 && y >= z.y0 && y < z.y1) return z; return null; };
    const sync = () => { const n = G.now(), h = n.hf, isOpen = AS() ? AS().isOpen() : true, so = !!(AS() && AS().sleepoverNow()), late = AS() ? AS().lateNow() : false, l = !isOpen ? 0 : so ? .3 : (h < 10 ? .3 : h < 16 ? .7 : .45) + (n.weekday >= 5 ? .2 : 0);
      if (l !== lvl || isOpen !== open) { lvl = l; open = isOpen; for (const c of cr.list) { const sp = c.spot; c.hidden = !isOpen || ((late || so) && sp.age === 'kid' && late) || (sp.busy ? l < .6 || c.roll > l + .2 : c.roll > (sp.p !== undefined ? Math.min(sp.p, l + .15) : l)); } wk.setActive(!isOpen ? 0 : Math.round(2 + l * 9), !isOpen); }
      if (so !== sleep) { sleep = so; for (const o of bags) o.hidden = !so; }
      const on = forced.octo > 0 || (isOpen && SHOWS.find(s => s.id === 'octo').at.some(t => h >= t && h < t + .6)); if (on !== show.octo) { show.octo = on; oli = 0; olt = 1; ok.hidden = !on; if (on) { tanks.octo.perform(45); if (Math.hypot(G.player.x - ok.x, G.player.y - ok.y) < 14) toast('"Meet the Octopus" is starting at the octopus den in the Abyss.', 'good', 4200); } G.emit('aquarium:show', 'octo', on); } };
    const P = specs(), ok = new Char(Object.assign({}, P.staff[4], { topColor: '#8a5aa8' }), O + 22.4, O + 14.6); ok.kind = 'staff'; ok.dir = 0; ok.hidden = true; sc.ents.push(ok); const show = { octo: false }, forced = {}; let oli = 0, olt = 0;
    const OL = ['This is Inky. Giant Pacific octopus, three hearts, nine brains: one in the head and one in each arm.', 'Watch the colour. Red means interested. Pale means cross. Mottled means she is pretending to be a rock.', 'She can squeeze through any gap wider than her beak, which is why that lid has four locks.', 'Last month she took the filter apart and stacked the pieces in a corner. We think she was bored.', 'Octopuses taste with their suckers. When she holds your hand, she is reading you. Thank you for coming to meet her!'];
    sc.interactables.push({ ent: ok, x: ok.x, y: ok.y, label: 'Wren, aquarist', h: 1.3, hit: 8, range: 1.8, visible: () => !ok.hidden, use: () => { ok._hold = 3; bubble(ok, 'Stand by the glass and watch her change colour.'); } });
    sc.life = { crowd: cr, walkers: wk, count: () => cr.count() + wk.count() };
    sc.aq = { swimmers: sw, tanks, bags, zoneAt, sync, nodes: DN, routes: DR, show, balls, force(id, sec = 60) { forced.octo = sec; sync(); return true; } };
    sc.env = () => ({ amb: sleep ? '#4a5a9a' : '#6478b4', dark: .78, bg: Wd.bg, night: true });
    sync();
    const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); cr.update(dt); wk.update(dt); const p = G.player; for (const k in tanks) tanks[k].tick(dt, p); cst.update(dt); for (let i = 0; i < sw.length; i++) sw[i].tick(dt, p);
      { const L = balls[0][0]; let dm = 9; for (let i = 0; i < sw.length; i++) { const s = sw[i]; if (SHARKS.includes(s.sp)) { const d = Math.hypot(s.x - L.x, s.y - L.y) + Math.abs(s.z - L.z); if (d < dm) dm = d; } } L.scare = (L.scare || 0) + ((dm < 3 ? 1 : 0) - (L.scare || 0)) * Math.min(1, dt * 3); }
      if (forced.octo > 0) forced.octo -= dt; if (!ok.hidden) { ok.t += dt; if (ok._hold > 0) ok._hold -= dt; else if (show.octo) { ok.pose = 'talk'; if ((olt -= dt) <= 0) { olt = 6; bubble(ok, OL[oli % OL.length], 5400); oli++; if (oli === OL.length && AS()) AS().talkDone('octo', sc); } } }
      if ((tick -= dt) <= 0) { tick = 1.5; sync(); if (jl) jl.c = JC[Math.floor(tanks.jelly.hue() / 60) % 6]; } if ((ft += dt) > .45) { ft = 0; fb++; for (const o of anim) setP(o, { frame: fb % 2 }); } };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); sync(); if (AS()) AS().arrived(sc, pv); };
  },
});

/* ================= HARBOR DECK ================= */
const kp = mkItems();
(function buildDeck() {
  const { A, S } = kp;
  A('deckpool', 1, 1, { w: 8.5, d: 5, kind: 'otter' }); A('deckpool', 11.5, 1, { w: 9.5, d: 5, kind: 'seal' });
  A('stand', 6, 8.8, { w: 9 }); A('plaque', 4.6, 6.1, { c: '#17666f' }, { sp: 'otter' }); A('plaque', 16, 6.1, { c: '#17666f' }, { sp: 'seal' });
  A('scope', 20.6, 9.4); A('rail', 0, 13.8, { len: 22 }); A('rail', 21.8, 6.4, { len: 7.5 }, { flip: true }); A('lamp', .3, 7); A('lamp', 21, 12.6); A('bucket', 10.2, 6.3);
  A('plant', 1, 12.4, { seed: 7 });
  S(3, 6.6, 3, { p: .7 }); S(7.4, 6.5, 3, { age: 'kid', label: 'Kid', lines: LN.kid, p: .8 }); S(14, 6.6, 3, { p: .6, anim: 'phone' }); S(18.4, 6.5, 3, { busy: 1, age: 'kid', lines: LN.kid }); S(19.4, 11.6, 0, { p: .5 });
})();
defineRoom({ id: 'aquarium:deck', name: 'Maple Bay Aquarium: Harbor Deck', w: 22, d: 14, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'aquarium', venue: AQ_VENUES.place,
  floor: GT.boardwalk, bg: '#5aa2d0', edge: '#7a5a3e', wall: { color: '#b8875a', pattern: 'planks', trim: '#8a6240', h: 1.2 },
  exits: [{ x: 2.6, y: 12.9, label: 'Back inside to The Galley', use: () => G.go('int:aquarium', { x: O + 37, y: O + 20.6, dir: 3 }) }], spawn: { x: 2.6, y: 12, dir: 3 }, items: kp.items, npcSpots: kp.spots,
  setup(sc) {
    const Wd = sc.world; sc.indoor = false;
    Wd.decal({ x0: O, y0: O, x1: O + 22, y1: O + 14, draw(Rr) { for (const [x, y, rx, ry] of [[4, 6.7, 1.6, .5], [8.6, 6.5, .9, .35], [13.4, 6.8, 1.4, .45], [18.6, 6.6, 1.1, .4], [10.4, 7.6, .8, .3], [6.4, 7.5, .5, .2], [20.6, 7.2, .6, .25]]) Rr.qz(x + O - rx, x + O + rx, y + O - ry, y + O + ry, 0, (wx, wy) => { const a = (wx - x - O) / rx, b = (wy - y - O) / ry, d = a * a + b * b; return d > 1 ? null : d > .7 ? '#8a6a48' : (Math.sin(wx * 9) + Math.sin(wy * 13)) > 1.2 ? '#cfe6f0' : '#7a5c40'; }); } }); Wd.version++;
    const otters = [0, 1, 2].map(i => { const c = new Critter({ kind: 'otter', x0: O + 1.8, y0: O + 2.6, x1: O + 8.6, y1: O + 5.2, z: .74 }); c.jx = (i - 1) * .9; c.jy = 0; sc.ents.push(c); return c; });
    const seals = [0, 1].map(i => { const c = new Critter({ kind: 'seal', x0: O + 12.2, y0: O + 2.6, x1: O + 20.2, y1: O + 5.2, z: .74, rock: { x0: O + 15.6, y0: O + 3.5, x1: O + 16.9, y1: O + 4, z: .84 } }); sc.ents.push(c); return c; });
    const P = specs(), keeper = new Char(Object.assign({}, P.staff[1], { topColor: '#1f8f9a' }), O + 10.4, O + 6.9); keeper.kind = 'staff'; keeper.dir = 1; sc.ents.push(keeper);
    sc.interactables.push({ ent: keeper, x: keeper.x, y: keeper.y, label: 'Anja, otter keeper', h: 1.3, hit: 8, range: 1.8, visible: () => !keeper.hidden, use: () => { keeper._hold = 4; if (AS()) AS().talkKeeper(keeper, sc); } });
    const seats = []; for (const f of sc.fixtures) if (/aqua\.stand/.test(f.asset.id)) f.seats.forEach((s, i) => { if (i % 4 !== 1) seats.push({ x: s.x - O, y: s.y - O, z: s.z, dir: 3, seated: true, p: .25, busy: i % 2, lines: LN.deck }); });
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 13, fill: .6, lines: LN.deck });
    const show = { otter: false }, forced = {}; let tick = 0, open = null, lvl = -1, li = 0, lt = 0, feedT = null, night = null;
    const showOn = () => { if (forced.otter > 0) return true; const h = G.now().hf, sh = SHOWS.find(s => s.id === 'otter'); return !!open && sh.at.some(t => h >= t && h < t + sh.dur); };
    const sync = () => { const n = G.now(), h = n.hf, isOpen = (AS() ? AS().isOpen() : true) && h < 19, on0 = show.otter; open = isOpen; const on = showOn(), l = !isOpen ? 0 : on ? 1 : (h < 10 ? .25 : h < 16.5 ? .6 : .35);
      if (l !== lvl) { lvl = l; for (const c of cr.list) { const sp = c.spot; c.hidden = !isOpen || (sp.busy ? !on && c.roll > .25 : c.roll > (sp.p !== undefined ? (on ? .95 : sp.p) : l)); } keeper.hidden = !isOpen; }
      const nt = h >= 19 || h < 7; if (nt !== night) { night = nt; otters.forEach((ot, i) => { ot.jx = 0; ot.jy = 0; ot.target = nt ? { x: O + 4 + i * .95, y: O + 3.7 } : null; }); for (const sl of seals) { sl.haul = nt; if (nt) { sl.x = sl.tx = O + 15.8 + Math.random(); sl.y = sl.ty = O + 3.7; sl.wait = 1e6; } else sl.wait = 1; } }
      if (on !== on0) { show.otter = on; li = 0; lt = 1; if (on) { feedT = { x: O + 5.4, y: O + 5 }; for (const o of otters) o.target = feedT; for (const s of seals) { s.haul = false; s.target = { x: O + 13.4, y: O + 5 }; } toast('Feeding time on the Harbor Deck! Anja picks up the bucket. Take a seat in the stand.', 'good', 4600); } else { for (const o of otters) o.target = null; for (const s of seals) s.target = null; keeper.pose = null; } G.emit('aquarium:show', 'otter', on); } };
    sc.life = { crowd: cr, count: () => cr.count() };
    sc.aq = { otters, seals, keeper, show, sync, force(id, sec = 60) { forced.otter = sec; sync(); return true; } };
    sc.env = t => { const o = ambient(t, G.state.weather); return { amb: o.amb, dark: o.dark, bg: o.night ? '#10243c' : R.mix('#5aa2d0', o.amb === '#ffffff' ? '#5aa2d0' : o.amb, .35), night: o.night }; };
    sync();
    const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); cr.update(dt); for (const o of otters) o.tick(dt); for (const s of seals) s.tick(dt); if (forced.otter > 0) forced.otter -= dt; if ((tick -= dt) <= 0) { tick = 1.2; sync(); }
      keeper.t += dt; if (keeper._hold > 0) keeper._hold -= dt; else if (show.otter) { keeper.pose = 'talk'; if ((lt -= dt) <= 0) { lt = 6.5; bubble(keeper, LN.anja[li % LN.anja.length], 5600); li++; if (feedT) { feedT.x = O + 3 + Math.random() * 5; feedT.y = O + 4.4 + Math.random() * .7; } if (AS()) AS().talkLine(li, sc); } } else keeper.pose = null; };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); lvl = -1; sync(); if (AS()) AS().arrived(sc, pv); };
  },
});

/* ================= BEHIND THE SCENES ================= */
const lb = mkItems();
(function buildLab() {
  const { A, S } = lb;
  A('rehab', 5, 2.6, { stage: 0 }, { pool: 1 }); A('board', 5.4, .5, { kind: 'chart', n: 0 }, { chart: 1 }); A('prepbench', 1, 1.6);
  A('rack', 10, 1.2, { frame: 0 }, { anim: 1 }); A('labbench', 10.4, 6, { kind: 'scope' }); A('labbench', 1, 6.4, { kind: 'nursery' }); A('plant', 12.8, 8.6, { seed: 2 }); A('bucket', 4.3, 3.2);
  S(11.6, 7.2, 3, { kind: 'staff', label: 'Lab technician', lines: ['Jelly polyps. Each one of those dots will be a moon jelly by spring.', 'Quarantine is thirty days. Even for the pretty ones.', 'Do not tap the glass. They hate it and so do I.'] });
})();
defineRoom({ id: 'aquarium:lab', name: 'Maple Bay Aquarium: Behind the Scenes', w: 14, d: 10, zoom: 1, music: 'quiet', noCrowd: true, showpiece: 'aquarium', venue: AQ_VENUES.place,
  floor: GT.f_tile, bg: '#0c1a2c', edge: '#16324f', wall: { color: '#e4ecee', pattern: 'tile', trim: '#1f8f9a', h: 3 },
  exits: [{ x: 7, y: 9.5, label: 'Back to Local Waters', use: () => G.go('int:aquarium', { x: O + 1.8, y: O + 12, dir: 0 }) }], spawn: { x: 7, y: 8.7, dir: 3 }, items: lb.items, npcSpots: lb.spots,
  setup(sc) {
    const Wd = sc.world, setP = (o, q) => { o.p = Object.assign({}, o.p, q); o._key = null; }, by = k => Wd.objs.filter(o => o.data && o.data[k]), anim = by('anim'), pool = by('pool')[0], chart = by('chart')[0];
    const turtle = new Critter({ kind: 'turtle', x0: O + 5.9, y0: O + 3.5, x1: O + 7.7, y1: O + 5, z: .88 }); sc.ents.push(turtle);
    const cr = crowd(sc, sc.def.npcSpots, { seed: 3, fill: 1, lines: ['Hello.'] }); let tick = 0, ft = 0, fb = 0, key = '';
    const sync = () => { const c = AS() ? AS().chain() : { st: 0, days: 0 }, k = c.st + ':' + (c.days || 0) + ':' + (c.name || ''); if (k === key) return; key = k; turtle.hidden = !(c.st >= 1 && c.st <= 3); turtle.spd = .25 + Math.min(3, c.days || 0) * .12; if (pool) setP(pool, { stage: c.st >= 2 && c.st <= 3 ? 3 : 0 }); if (chart) setP(chart, { n: Math.min(3, c.days || 0), name: (c.name || '').toUpperCase() }); };
    sc.life = { crowd: cr, count: () => cr.count() }; sc.aq = { turtle, sync }; sync();
    const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); cr.update(dt); if (!turtle.hidden) turtle.tick(dt); if ((tick -= dt) <= 0) { tick = 1; sync(); } if ((ft += dt) > .5) { ft = 0; fb++; for (const o of anim) setP(o, { frame: fb % 2 }); } };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); key = ''; sync(); if (AS()) AS().arrived(sc, pv); };
  },
});
