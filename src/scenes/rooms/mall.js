// Maple Bay Galleria — the downtown shopping mall (room id 'deptstore', entered by the existing city door `door:deptstore`).
// One big L-shaped concourse (44 x 32; the L's inner block x>12,y>12 is void) with TEN open-front bays you simply walk into:
//   arm A (along the back wall, bays x 6..42): Fern & Frond, Nest & Wire Home, Pixel Hut, Thread & Co. Outlet, Kicks, Bloom Beauty
//   arm B (along the left wall, bays y 6..30): Paper Moon, Toy Galaxy, Wheel House, FOOD COURT (Tapioca Sky, Seoul Ember Express, La Mariposa Tacos)
// Every shop is its own venue record (data/venues_showpiece.js). Counters are `furn.mall.counter` fixtures (tag `mallcounter`, item field `venue`):
// tapping one opens G.shop.open(venueId). Kiosks (tag `kiosk`, item field `venue`), arcade cabinets (item tag `mallarcade`), directory totem (tag `directory`).
// def.noCrowd: the room runs its own life (scene.life = { crowd, walkers, open }): def.npcSpots (staff + browsers) + seats + lane walkers with shopping bags.
// Hours 10-21: after closing the shutters come down (fascia p.closed), counters refuse and the mall empties.
// Scene hooks: scene.shops [{ id, name, venueId, x, y }] (world coords of the counter's customer spot), scene.isOpen(), scene.pa(text).   Event: 'mall:arcade'(score)
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { defineRoom, registerFixture } from '../interior.js';
import { toast, choose, bubble } from '../../ui/kit.js';
import { caption } from '../../ui/goals.js';
import { MALL_SHOPS, FOOD_COURT, KIOSKS, MALL_HOURS } from '../../data/venues_showpiece.js';
import { VENUE_BY_ID } from '../../data/venues.js';
import * as creator from '../../ui/creator.js';
import { crowd, walkers } from './_show_life.js';

const W = 44, D = 32, O = 1, BW = 6, BD = 5;
const pick = a => a[Math.floor(Math.random() * a.length)];
const FD = [1, 0, 3, 2];
const items = [], spots = [];
const A = (id, x, y, p, o) => { const it = Object.assign({ id: 'furn.' + id, x, y, p: p || {} }, o); items.push(it); return it; };
/** bay-local placement: side 'A' bay origin (b,0) facing +y; side 'B' bay origin (0,b) facing +x (mirrored: local x runs along world y) */
const bayT = (side, b) => ({
  F: (lx, ly, id, p, o) => side === 'A' ? A(id, b + lx, ly, p, o) : A(id, ly, b + lx, p, Object.assign({ flip: true }, o)),
  Wl: (lx, id, p, o) => { const it = Object.assign({ id: 'furn.' + id, wall: side === 'A' ? 'y' : 'x', at: b + lx, p: p || {} }, o); items.push(it); return it; },
  S: (lx, ly, dir, o) => spots.push(Object.assign(side === 'A' ? { x: b + lx, y: ly, dir } : { x: ly, y: b + lx, dir: FD[dir] }, o)),
});
const LINES = {
  shopper: ['I came in for socks. SOCKS.', 'Is it me or does the fountain make you need the restroom?', 'Meet you at the pretzel cart in ten.', 'Just looking. That is what I always say.', 'My feet hurt and I regret nothing.', 'The plant shop mists you if you stand too close. Ask me how I know.', 'Three bags. One of them is for someone else, I swear.', 'Do you know where the escalator goes? Nobody knows.'],
  kid: ['Can we go to Toy Galaxy? Pleeease?', 'I got the high score on Star Hopper!', 'I want a pretzel. And a bike. And a dinosaur.'],
  staff: ['Welcome in! Let me know if you need a hand.', 'Everything on that table is new this week.', 'We close at nine. The shutters wait for no one.', 'Cash or card, both are lovely.'],
  food: ['Order at the counter, sit anywhere you like!', 'Number forty-two! Forty-two?', 'Extra napkins are on the side.'],
  window: ['Ooh. That is new.', 'I have been thinking about that one for a week.', 'Too expensive. ...How expensive?'],
};
const DISPLAYS = {
  plants(T) { T.F(.4, .8, 'mall.plantstand', { seed: 1 }, { anim: 1 }); T.F(.4, 3, 'mall.plantstand', { seed: 4 }, { anim: 1 }); T.F(4, 3, 'home.plant.fiddle', { tier: 2, seed: 3 }); T.F(4.7, 3.5, 'home.plant.monstera', { tier: 2, seed: 2 }); T.F(5.3, 2.9, 'home.plant.snake', { tier: 1 }); T.F(4.2, 4.1, 'home.plant.cactus', { tier: 1 }); T.F(5.3, 4.2, 'home.plant.monstera', { tier: 0, seed: 6 }); T.F(2.6, .3, 'home.plant.fiddle', { tier: 1, seed: 5 });
    T.S(1.4, 2.35, 3); T.S(3.1, 3.6, 2); T.S(3.6, 3.3, 0); },
  home(T) { T.F(.3, .5, 'homegoods.sofa', { c: '#2f7a80' }); T.F(.7, 3, 'home.rug', { w: 2, d: 1.5, pat: 'diamond', c: '#d9a23a', tier: 1 }); T.F(.9, 3.5, 'home.coffeetable', { tier: 1 }); T.F(.25, 3.1, 'home.lamp.floor', { tier: 2 }); T.F(4, 3.2, 'homegoods.lamps'); T.F(4.9, 4.1, 'homegoods.plinth', { item: 'vase' }); T.F(3.8, 4.1, 'home.armchair', { c: '#d9a23a', tier: 2 });
    T.S(3.1, 3.2, 2); T.S(4.6, 2.2, 3); T.S(3.6, 2.9, 3); },
  tech(T) { T.F(.4, .9, 'homegoods.tvstand', {}, { anim: 1 }); T.F(.4, 3, 'homegoods.demotable'); T.F(3.9, 3.2, 'homegoods.plinth', { item: 'console' }); T.F(4.95, 3.2, 'homegoods.plinth', { item: 'laptop' }); T.F(2.7, .4, 'homegoods.plinth', { item: 'speaker' });
    T.S(1.4, 2.1, 3, { anim: 'phone' }); T.S(1.4, 4.5, 3); T.S(4.4, 4.7, 3); T.S(4.6, 2.2, 3); },
  clothes(T) { T.F(.4, .9, 'clothing.rack', { pal: 'warm', seed: 2 }); T.F(.8, 2.7, 'clothing.roundrack', { pal: 'cool', seed: 3 }); T.F(.3, 4.2, 'clothing.mannequin', { shirt: '#b8342e' }); T.F(2, 4.3, 'clothing.mannequin', { shirt: '#e8b83a', scarf: '#f4f0e8' }); T.F(3.8, 3.2, 'clothing.foldtable', { pal: 'warm', seed: 5 }); T.F(2.7, .4, 'clothing.mirror');
    T.S(1.4, 1.9, 3); T.S(2.2, 3.2, 2); T.S(4.8, 4.7, 3); T.S(4.6, 2.2, 3); },
  shoes(T) { T.F(.4, .9, 'clothing.foldtable', { pal: 'cool', seed: 2 }); T.F(.9, 2.8, 'clothing.pouf', { c: '#e8862c' }, { tags: ['seating'] }); T.F(.4, 3.7, 'clothing.shelves', { pal: 'cool', seed: 4 }); T.F(4, 3.3, 'clothing.mannequin', { shirt: '#2f9a94', pant: '#33303f' }); T.F(5.1, 3.2, 'clothing.mirror'); T.F(4.2, 4.2, 'generic.bench', { c: '#e8862c' });
    T.S(1.4, 2.4, 3); T.S(3.1, 3.3, 0); T.S(4.6, 2.2, 3); },
  beauty(T) { T.F(.5, 3, 'airport.island', { kind: 'perfume', seed: 3 }); T.F(.4, 1, 'clothing.mirror', { c: '#e8c06a' }); T.F(1.2, 1.2, 'clothing.pouf', { c: '#d86a8f' }); T.F(2.3, 1, 'clothing.mirror', { c: '#e8c06a' }); T.F(4.4, 3.4, 'homegoods.plinth', { item: 'vase', c: '#f8dfe6' }); T.F(5.3, 4.2, 'generic.plant', { kind: 'flower' });
    T.S(1.5, 4.5, 3); T.S(.9, 2, 3, { anim: 'talk' }); T.S(4.6, 2.2, 3); },
  books(T) { T.F(.5, 2.9, 'bookstore.table', { seed: 3 }); T.F(.6, 1.1, 'bookstore.spinner', { seed: 1 }); T.F(1.7, .9, 'bookstore.spinner', { seed: 5 }); T.F(4.6, 3.5, 'home.armchair', { c: '#5a4a8a', tier: 1 }); T.F(4, 3.6, 'generic.floorlamp'); T.F(2.7, .4, 'home.bookshelf', { tier: 2, seed: 4 });
    T.S(1.5, 4.4, 3, { anim: 'read' }); T.S(.85, 2.1, 3, { anim: 'read' }); T.S(4.6, 2.2, 3); },
  toys(T) { T.F(.4, .6, 'home.arcade', { c: '#7a55c8', show: 'toon', tier: 2 }, { tags: ['mallarcade'], game: 'Star Hopper' }); T.F(1.6, .6, 'home.arcade', { c: '#d9483b', c2: '#e8b83a', show: 'toon', tier: 2 }, { tags: ['mallarcade'], game: 'Gull Racer' }); T.F(.5, 3, 'homegoods.demotable', { c: '#f8d070' }); T.F(4.2, 3.2, 'bookstore.spinner', { seed: 8 }); T.F(4.6, 3.8, 'home.beanbag', { c: '#5ab0e0' }); T.F(2.7, .4, 'clothing.accessories', { hats: 1 });
    T.S(1.4, 4.5, 3, { age: 'kid', lines: LINES.kid }); T.S(2.1, 2.2, 3, { age: 'kid', lines: LINES.kid }); T.S(3.1, 3.4, 2); T.S(4.6, 2.2, 3); },
  bikes(T) { T.F(.2, 1, 'mall.bikes', { seed: 1 }); T.F(.4, 3.6, 'clothing.shelves', { pal: 'cool', seed: 7 }); T.F(4, 3.4, 'home.bicycle', { c: '#e8b83a' }); T.F(4.4, 4.3, 'home.skateboard', { c: '#7a55c8' }); T.F(5.2, 4.3, 'home.skateboard', { c: '#f07a5a' });
    T.S(1.6, 2.5, 3); T.S(3.1, 3.5, 0); T.S(4.6, 2.2, 3); },
};
function buildDef() {
  // floors: court, concourse strips, light shafts
  A('mall.floor', 5, 5, { w: 7, d: 7, pat: 'court', c: '#efe6d2', c2: '#2f7f86' });
  for (let k = 0; k < 5; k++) A('mall.floor', 12 + k * 6, 5, { w: 6, d: 7, pat: 'mall', c: '#efe6d2', c2: '#2f7f86' }); A('mall.floor', 42, 5, { w: 2, d: 7, pat: 'plain', c: '#efe6d2', c2: '#f4ecdc' });
  for (let k = 0; k < 3; k++) A('mall.floor', 5, 12 + k * 6, { w: 6, d: 7, pat: 'mall', c: '#efe6d2', c2: '#2f7f86' }, { flip: true }); A('mall.floor', 5, 30, { w: 7, d: 2, pat: 'plain', c: '#efe6d2', c2: '#f4ecdc' });
  A('mall.floor', 0, 0, { w: 6, d: 5, pat: 'check', c: '#e6dcc6', c2: '#d6ccb4' });
  for (const x of [14, 26, 38]) A('station.shaft', x, 5.5); for (const y of [14.5, 23]) A('station.shaft', 5.5, y, {}, { flip: true });
  // the ten bays
  MALL_SHOPS.forEach((s, i) => {
    const side = i < 6 ? 'A' : 'B', b = 6 + (i < 6 ? i : i - 6) * BW, T = bayT(side, b);
    T.F(0, 0, 'mall.floor', { w: BW, d: BD, pat: s.floor[0], c: s.floor[1], c2: s.floor[2] }); T.Wl(0, 'mall.backwall', { w: BW, kind: s.kind, c: s.wall });
    T.F(-.15, 0, 'mall.divider', { d: BD, c: i % 2 ? '#f4ead0' : '#e8dcc0' }); T.F(0, BD, 'mall.fascia', { w: BW, name: s.sign, c: s.c, fg: s.fg }, { fascia: s.key });
    T.F(3.6, 1, 'mall.counter', { c: s.c, kind: s.kind === 'beauty' ? 'beauty' : 'till' }, { venue: s.venueId, shop: s.key }); T.S(4.6, .55, 1, { kind: 'staff', label: s.name + ' staff', lines: LINES.staff });
    DISPLAYS[s.kind](T);
    if (i % 2 === 0) T.S(1.6, 5.9, 3, { lines: LINES.window, p: .6 });
  });
  A('mall.divider', 41.85, 0, { d: BD });
  { // food court (arm B, y 24..30)
    const T = bayT('B', 24); T.F(0, 0, 'mall.floor', { w: BW, d: BD, pat: 'check', c: '#f4f0e8', c2: '#d9483b' }); T.F(-.15, 0, 'mall.divider', { d: BD }); T.F(5.85, 0, 'mall.divider', { d: BD }); T.F(0, BD, 'mall.fascia', { w: BW, name: 'FOOD COURT', c: '#d9483b', fg: '#ffe9a0' }, { fascia: 'food' });
    FOOD_COURT.forEach((f, k) => { T.Wl(k * 2, 'mall.backwall', { w: 2, kind: 'food', c: '#3a3440', c2: f.c, name: f.sign }); T.F(k * 2 + (k === 0 ? .15 : 0) - (k === 2 ? .15 : 0), 2.6, 'mall.counter', { c: f.c, kind: 'food' }, { venue: f.venueId, shop: f.venueId.slice(5) }); T.S(k * 2 + 1, 2.15, 1, { kind: 'staff', outfit: 'cook', label: f.name, lines: LINES.food }); T.S(k * 2 + 1, 3.8, 3, { p: .8 }); });
    T.S(1.1, 4.5, 3, { anim: 'phone' }); T.S(5, 4.5, 3);
    for (const [x, y] of [[7.3, 23.4], [7.3, 25.1], [7.3, 26.8], [7.3, 28.5]]) A('cafe.tableset', x, y, { c: '#d9483b', cc: '#f4f0e8' }, { food: 1 });
  }
  // corner block: escalators, restrooms
  A('mall.escalator', 1.2, 0); A('station.planter', 4.2, .4, { seed: 3 }); items.push({ id: 'furn.generic.doorway', wall: 'x', at: 1.5, p: { c: '#8e98a8' } }, { id: 'furn.generic.exit', wall: 'x', at: 1.5, p: { t: 'WC', c: '#2f7f86' } }, { id: 'furn.generic.doorway', wall: 'x', at: 3.2, p: { c: '#8e98a8' } });
  // the court + aisle furniture
  A('airport.fountain', 7.3, 7.3, {}, { anim: 1 }); A('airport.mobile', 6.5, 6.8, { seed: 5 }, { z: 2.7 });
  A('mall.season', 13.2, 7.7); A('mall.benchplanter', 15.6, 8); A('mall.kiosk', 20, 8, { kind: 'pretzel' }, { venue: 'mall:pretzel', kiosk: 0 }); A('mall.benchplanter', 23.6, 8, { kind: 'palm' }); A('mall.kiosk', 28, 8, { kind: 'cases' }, { kiosk: 1 }); A('mall.benchplanter', 31.6, 8); A('mall.kiosk', 36, 8, { kind: 'shades' }, { kiosk: 2 }); A('airport.tree', 39.6, 7.7, { kind: 'ficus', bench: 1 });
  for (const kx of [20, 28, 36]) { spots.push({ x: kx + 1, y: 7.55, dir: 1, kind: 'staff', label: 'Kiosk', lines: ['Fresh out of the oven!', 'Two for one, today only. Also tomorrow.', 'Try one on! No pressure. Some pressure.'] }, { x: kx + 1, y: 9.6, dir: 3, p: .7, lines: LINES.window }); }
  A('mall.benchplanter', 8, 13.6, {}, { flip: true }); A('airport.tree', 7.8, 17.6, { kind: 'maple', bench: 1 }); A('mall.benchplanter', 8, 20.2, { kind: 'palm' }, { flip: true });
  A('mall.directory', 9.6, 30.2); A('mall.directory', 42.4, 6.2); A('generic.bin', 12.6, 11.2, { recycle: 1 }); A('generic.bin', 11.2, 22.5);
  spots.push({ x: 9.9, y: 31, dir: 3, lines: ['You are here. Apparently.', 'Ten shops. I have been to eleven. Explain that.'] }, { x: 10.4, y: 9.6, dir: 2, age: 'kid', lines: ['I threw a penny in! I wished for a penny.'] }, { x: 10.9, y: 9.9, dir: 2, anim: 'phone' }, { x: 14, y: 9.7, dir: 3, lines: LINES.window });
  // overhead: trusses, banners; the balustrade along the void
  for (let x = 12; x <= 42; x += 6) A('mall.truss', x - .15, 5, { len: 7 }, { z: 3.3 }); for (let y = 12; y <= 30; y += 6) A('mall.truss', 5, y - .15, { len: 7 }, { z: 3.3, flip: true });
  [[18.9, 'SALE'], [26.9, null], [34.9, 'MBG'], [41, null]].forEach(([x, t], i) => A('mall.banner', x, 8.45, t ? { text: t, c: i ? '#2f7f86' : '#b8342e' } : {}, { z: 2 })); for (const y of [16.5, 22.4]) A('mall.banner', 8.45, y, {}, { z: 2, flip: true });
  for (let k = 0; k < 4; k++) A('airport.barrier', 12 + k * 8, 11.85, { len: 8 }); A('airport.barrier', 11.85, 12, { len: 8 }, { flip: true }); A('airport.barrier', 11.85, 20, { len: 8 }, { flip: true }); A('airport.barrier', 11.85, 28, { len: 4 }, { flip: true });
  return { id: 'deptstore', name: 'Maple Bay Galleria', w: W, d: D, zoom: 0, music: 'shop', noCrowd: true, showpiece: 'mall', floor: GT.f_stone, floors: [{ x0: 12, y0: 12, x1: W, y1: D, floor: GT.void }], bg: '#15141d',
    wall: { color: '#f1e8d6', trim: '#8e98a8', h: 3.2, rail: 2.9 }, items, npcSpots: spots, exits: [{ x: 8.5, y: 31.4, label: 'Exit to the street', poi: 'door:deptstore' }, { x: 43.2, y: 8.5, label: 'Exit to the street', poi: 'door:deptstore' }], setup };
}
const hf = () => G.now().hf, isOpen = () => { const h = hf(); return h >= MALL_HOURS[0] && h < MALL_HOURS[1]; };
const closedMsg = name => toast(`${name} is closed. The Galleria is open ${MALL_HOURS[0]}:00 - ${MALL_HOURS[1]}:00.`, 'info');

function setup(sc) {
  const Wd = sc.world, P = (x, y, o) => Object.assign({ x: x + O, y: y + O }, o), setP = (o, q) => { o.p = Object.assign({}, o.p, q); o._key = null; };
  const anim = Wd.objs.filter(o => o.data && o.data.anim && o.a && o.a.frames), fascias = Wd.objs.filter(o => o.data && o.data.fascia);
  sc.isOpen = isOpen; sc.pa = t => { if (!G.modal && !G.cutscene) caption('PA', t, 4600); };
  sc.shops = sc.fixtures.filter(f => f.item.venue && f.tags.includes('mallcounter')).map(f => ({ id: f.item.shop, name: VENUE_BY_ID[f.item.venue].name, venueId: f.item.venue, x: f.use ? f.use.x : f.x, y: f.use ? f.use.y : f.y }));
  // seated visitors from the benches / fountain rim / food-court tables
  const seats = []; for (const f of sc.fixtures) { if (!f.seats.length || !/benchplanter|fountain|tree|tableset|generic\.bench/.test(f.asset.id)) continue; f.seats.forEach((s, i) => seats.push({ x: s.x - O, y: s.y - O, z: s.z, dir: s.dir === undefined ? 1 : s.dir, seated: true, p: f.item.food ? .7 : .5, lines: f.item.food ? ['Best food court in the city. Only food court in the city.', 'I always get the tacos. Always.', 'This boba has structural integrity.'] : LINES.shopper })); }
  const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 11, fill: .75, lines: c => (c.spec && c.spec.age === 'kid' ? LINES.kid : LINES.shopper) });
  // lane walkers
  const EA = [43.2, 8.6], EB = [8.5, 31], bayA = i => 6 + i * BW + 3.1, visitA = (pts, lane) => { const i = Math.floor(Math.random() * 6), x = bayA(i); pts.push([x, lane], [x, 5.6], [x + (Math.random() - .5) * .4, 3.2 + Math.random(), { wait: 5, dir: pick([0, 2, 3]), pose: Math.random() < .25 ? 'phone' : null }], [x, 5.6], [x, lane]); };
  const visitB = (pts, lane) => { const j = Math.floor(Math.random() * 4), y = 6 + j * BW + 3.1; pts.push([lane, y], [5.6, y], [j === 3 ? 4.4 : 3.2 + Math.random(), y + (Math.random() - .5) * .4, { wait: 5, dir: pick([1, 2, 3]) }], [5.6, y], [lane, y]); };
  const route = () => {
    const outer = Math.random() < .55, la = outer ? 6.15 : 10.9, pts = [EA, [41.6, la]], k = Math.random();
    if (outer) { if (k < .6) visitA(pts, la); pts.push([6.15, 6.15]); if (Math.random() < .5) visitB(pts, 6.15); pts.push([6.15, 29.6], EB); }
    else { if (k < .35) { const kx = pick([20, 28, 36]) + 1; pts.push([kx, la], [kx, 9.75, { wait: 4, dir: 3 }], [kx, la]); } if (Math.random() < .3) pts.push([11.4, 10.9], [10.6, 10.4, { wait: 5, dir: 2, pose: Math.random() < .5 ? 'phone' : null }]); pts.push([10.9, 10.9], [10.9, 29.4], EB); }
    const out = pts.map(q => P(q[0] + (Math.random() - .5) * .25, q[1] + (Math.random() - .5) * .25, q[2] || null)); if (Math.random() < .5) out.reverse();
    return { pts: out };
  };
  const wk = walkers(sc, { n: 26, route, lines: LINES.shopper, label: 'Shopper' });
  sc.life = { crowd: cr, walkers: wk, open: null, count: () => cr.count() + wk.count() };
  const sync = force => { const o = isOpen(); if (o === sc.life.open && !force) return; sc.life.open = o; for (const f of fascias) setP(f, { closed: o ? 0 : 1 }); cr.show(o, false); wk.setActive(o ? 26 : 2, !o); if (!o && !force) sc.pa('The Galleria is now closed. Thank you for shopping. Please take your pretzels with you.'); };
  sync(true); if (!sc.life.open) for (const w of wk.list) if (w.n >= 2) { w.ch.hidden = true; w.dead = 1; }
  const PA = ['Welcome to Maple Bay Galleria. Ten shops, one fountain, zero regrets.', 'A small blue mitten has been found at Toy Galaxy. It misses you.', 'Fern & Frond reminds shoppers that the mister is not a shower.', 'The time is {clock}. The Galleria closes at nine.', 'Would the owner of a red bicycle please stop riding it through the food court.', 'Free samples at Twist & Salt while the tray lasts. The tray will not last.'];
  let fa = 0, fb = 0, st = 0, pa = 25 + Math.random() * 30; const u0 = sc.update;
  sc.update = (dt, gm) => { u0(dt, gm); cr.update(dt); wk.update(dt);
    if ((fa += dt) > .28) { fa = 0; fb++; for (const o of anim) setP(o, { frame: fb % o.a.frames }); }
    if ((st -= dt) <= 0) { st = 2; sync(); }
    if (sc.life.open && (pa -= dt) <= 0) { pa = 45 + Math.random() * 50; sc.pa(pick(PA).replace('{clock}', G.now().clock)); } };
  const e0 = sc.onEnter; sc.onEnter = (o, p) => { e0(o, p); sync(true); G.emit('mall:visit'); };
}
defineRoom(buildDef());

async function haircut() {
  const price = 25; if (G.money && !G.money.canAfford(price, { category: 'service' })) return toast('A new haircut is ' + G.money.fmt(price) + '. Maybe next payday.', 'bad');
  const open = creator.openCreator;
  if (typeof open !== 'function') return toast('The stylist is on a break. Try again later.', 'info');
  const base = (G.state.wardrobe && G.state.wardrobe.base) || G.state.player.spec, spec = await open({ mode: 'edit', spec: Object.assign({}, base) }); if (!spec) return;
  if (G.money && !G.money.pay(price, 'New haircut — Bloom Beauty', { category: 'service', venue: 'mall:bloom' })) return;
  if (G.wardrobe && G.wardrobe.setLook) G.wardrobe.setLook(spec); else { G.state.player.spec = spec; if (G.player.setSpec) G.player.setSpec(spec); }
  try { G.needs.add('hygiene', 15); G.needs.add('fun', 8); } catch (e) { } G.emit('service', 'mall:haircut', 'mall:bloom'); toast('Fresh cut. You look like the after picture.', 'good', 3200);
}
export function init() {
  registerFixture('mallcounter', (fx, scene) => {
    const v = VENUE_BY_ID[fx.item.venue]; if (!v) return null;
    return { label: v.name, shop: v.id, hit: 14, use: async () => {
      if (!isOpen()) return closedMsg(v.name);
      if (v.id === 'mall:bloom') { const k = await choose('Bloom Beauty', [{ label: 'Browse the counter', sub: 'Lipstick, perfume, small luxuries', value: 'shop' }, { label: 'New haircut', sub: (G.money ? G.money.fmt(25) : '$25') + ' · change your hair and look', value: 'cut' }, { label: 'Never mind', value: null }]); if (k === 'cut') return haircut(); if (k !== 'shop') return; }
      if (G.shop) G.shop.open(v.id);
    } };
  });
  registerFixture('kiosk', (fx, scene) => { if (scene.roomId !== 'deptstore') return null; const k = KIOSKS[fx.item.kiosk || 0]; return { label: k.name, hit: 14, use: () => { if (!isOpen()) return closedMsg(k.name); if (k.venueId && G.shop) return G.shop.open(k.venueId); toast(k.kind === 'cases' ? '"Got a case with a lighthouse on it. Got one with a gull. Got one with a gull ON a lighthouse." You have a perfectly good case.' : 'You try on a pair. The tiny mirror says: movie star. The price tag says: no.', 'info', 4200); try { G.needs.add('fun', 2); } catch (e) { } } }; });
  registerFixture('mallarcade', (fx, scene) => ({ label: 'Play ' + (fx.item.game || 'arcade') + ' ($1)', hit: 14, use: () => {
    if (!isOpen()) return closedMsg('Toy Galaxy'); if (G.money && !G.money.pay(1, 'Arcade — ' + fx.item.game, { category: 'fun', venue: 'mall:toy' })) return;
    G.startActivity({ label: 'Playing ' + fx.item.game, anim: 'type', minutes: 15, at: fx.use ? { x: fx.use.x, y: fx.use.y, z: 0, dir: fx.item.flip ? 2 : 3 } : undefined, done: () => {
      const S = G.state.showpieces || (G.state.showpieces = {}), hi = S.arcade || (S.arcade = {}), score = 1000 + Math.floor(Math.random() * 9000) * 10, best = score > (hi[fx.item.game] || 0); if (best) hi[fx.item.game] = score;
      try { G.needs.add('fun', best ? 24 : 18); } catch (e) { } G.emit('mall:arcade', score, fx.item.game); toast(`${fx.item.game}: ${score.toLocaleString()} points${best ? ' — NEW HIGH SCORE! Your initials go on the board.' : '. So close to the high score (' + hi[fx.item.game].toLocaleString() + ').'}`, 'good', 4200); } });
  } }));
  registerFixture('directory', (fx, scene) => scene.roomId !== 'deptstore' ? null : ({ label: 'Mall directory', use: async () => {
    const list = scene.shops || [], id = await choose('Maple Bay Galleria', list.map(s => ({ label: s.name, sub: (VENUE_BY_ID[s.venueId] || {}).blurb || '', value: s.venueId })).concat([{ label: 'Close', value: null }]), { text: isOpen() ? 'You are here. Pick a shop and you will walk there.' : 'The shops are closed for the night (open 10:00 - 21:00).' });
    const it = id && scene.interactables.find(i => i.shop === id); if (it) G.useInteractable(it);
  } }));
}
