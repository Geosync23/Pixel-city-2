// SkyDeck at Beacon Tower — rooms `skydeck_lobby` (12 x 9, street level: ticket desk, city model, two lifts) and `skydeck` (22 x 16, level 52).
// The deck's two back walls are floor-to-ceiling glass showing the Maple Bay panorama (art furn.skydeck.pano, day / dusk / night by the clock, season-aware,
// drifting clouds, the odd plane). Inside: 5 coin telescopes (item field `district`), a glass-floor sky ledge, Cloud Nine bar + gift nook (item field `venue`),
// a photo spot, history plaques (item field `text`), the lift core. Both rooms run their own visitors (def.noCrowd; scene.life); sunset is the busy hour.
// Gameplay (ride, telescope view, photo, tickets) lives in sim/showpieces.js (G.showpieces.skydeck.*); this file wires the fixtures to it.
// Fixture tags handled here: elevator, telescope, glassfloor, plaque, photospot, city_model + item tags skyticket, skyshop.   Events: 'skydeck:ledge', 'skydeck:plaque'(i)
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { defineRoom, registerFixture, exitRoom } from '../interior.js';
import { toast, bubble, say } from '../../ui/kit.js';
import { SKY_VENUES } from '../../data/venues_showpiece.js';
import { MOODLETS } from '../../data/needs.js';
import { FRAMES } from '../../art/showpiece/_pano.js';
import { crowd, walkers } from './_show_life.js';

const O = 1, pick = a => a[Math.floor(Math.random() * a.length)];
const SK = () => G.showpieces && G.showpieces.skydeck;
const PLAQUES = [
  ['How Maple Bay got its name', 'In 1871 a surveyor named Odalys Brandt rowed into the bay in October, saw one enormous red maple on the point and wrote "Maple Bay" on her map. The tree is gone. The lighthouse stands exactly where it grew.'],
  ['The Harbor Cranes', 'The three orange cranes are called Faith, Hope and Gerald. Gerald was named by a public vote in 1998. The port authority has apologised twice.'],
  ['Old Town & the Clock Tower', 'The clock tower has run four minutes fast since 1923. Old Towners set their watches by it anyway and are, as a result, slightly early for everything.'],
  ['Beacon Tower', 'At 52 floors Beacon Tower is the tallest building in Maple Bay. The red light on top blinks once every three seconds so that pilots, gulls and night owls know where downtown is.'],
];
const VIS_LINES = ['You can see my house from here! ...I think. It is one of the small ones.', 'I have lived here thirty years and never came up. Thirty years!', 'Hold on, one more photo. One more. Okay one more.', 'The cranes look like toys from up here.', 'Is that the ferry? It looks like it is not moving at all.', 'I am fine with heights. I am fine. I am holding the rail, but I am fine.', 'Come at sunset. Trust me.'];
const KID_LINES = ['The cars look like ANTS!', 'I can see the airport! A plane! A PLANE!', 'Can we go on the glass floor again?'];

/* ---------------- lobby ---------------- */
defineRoom({ id: 'skydeck_lobby', name: 'Beacon Tower — SkyDeck Lobby', w: 12, d: 9, music: 'quiet', noCrowd: true, showpiece: 'skydeck', floor: GT.f_tile, floors: [{ x0: 2, y0: 0, x1: 8, y1: 3, floor: GT.f_darkwood }],
  wall: { color: '#e9e4da', trim: '#39424e', h: 3, rail: 2.6 }, exits: [{ x: 6, y: 8.5, label: 'Exit to the street' }],
  items: [
    { id: 'furn.skydeck.liftdoor', wall: 'y', at: 2.4, p: { floor: '1' }, lift: 'up' }, { id: 'furn.skydeck.liftdoor', wall: 'y', at: 5.4, p: { floor: '38' }, lift: 'up' },
    { id: 'furn.airport.sign', x: 2.6, y: .2, z: 2.45, p: { text: 'SKYDECK  LEVEL 52 ^', w: 5, c: '#39424e' }, solid: false },
    { id: 'furn.generic.queuepost', x: 1.6, y: 2.8, p: { n: 2, kind: 'rope', c: '#b8342e' } }, { id: 'furn.generic.queuepost', x: 6.6, y: 2.8, p: { n: 2, kind: 'rope', c: '#b8342e' } },
    { id: 'furn.station.info', x: 8.8, y: 3.6, tags: ['skyticket'] }, { id: 'furn.skydeck.model', x: 2.6, y: 4.6 }, { id: 'furn.skydeck.plaque', x: 4.9, y: 5.4, text: 3 },
    { id: 'furn.generic.sofa', x: .5, y: 6.6, p: { c: '#2f7f86' }, flip: true }, { id: 'furn.generic.plant', x: .4, y: .5, p: { kind: 'palm' } }, { id: 'furn.generic.plant', x: 11.1, y: .5, p: { kind: 'palm' } }, { id: 'furn.generic.plant', x: 11.1, y: 8, p: { kind: 'snake' } },
    { id: 'furn.airport.greenwall', wall: 'x', at: 3.2, p: { w: 4, text: 'BEACON TOWER' } }, { id: 'furn.generic.clock', wall: 'y', at: 9.6 }, { id: 'furn.generic.picture', wall: 'y', at: 10.5, p: { kind: 'sea', w: 1 } },
    { id: 'furn.generic.rug', x: 3.4, y: 6.6, p: { w: 5, d: 1.5, c: '#2f3f72', c2: '#e8c06a' } },
  ],
  npcSpots: [{ x: 9.9, y: 3.75, dir: 1, kind: 'staff', label: 'Ticket desk', lines: ['Welcome to Beacon Tower! Tickets for the SkyDeck are eight dollars.', 'Fifty-two floors in ten seconds. Your ears will pop. It is part of the experience.', 'Best view is at sunset. Bring someone you like.'] },
    { x: 3.6, y: 6.4, dir: 3, lines: ['Look, the model has a tiny us on it. No? I thought I saw a tiny us.'] }, { x: 4.4, y: 3.4, dir: 3, anim: 'phone', p: .6 }, { x: 7.2, y: 3.5, dir: 3, age: 'kid', lines: KID_LINES, p: .6 }, { x: 10, y: 5.4, dir: 3, p: .5 }],
  setup(sc) { const cr = crowd(sc, sc.def.npcSpots, { seed: 5, fill: .8, lines: VIS_LINES }); cr.show(true, false); sc.life = { crowd: cr, count: cr.count }; const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); cr.update(dt); }; },
});

/* ---------------- the deck ---------------- */
const items = [], spots = [];
for (let at = 0; at < 22; at += 4) { const w = Math.min(4, 22 - at); items.push({ id: 'furn.skydeck.pano', wall: 'y', at, p: { w, u0: 256 + at * 16 }, sky: 1 }); }
for (let at = 0; at < 16; at += 4) items.push({ id: 'furn.skydeck.pano', wall: 'x', at, p: { w: 4, u0: (16 - at) * 16, rev: 1 }, sky: 1 });
const add = (id, x, y, p, o) => items.push(Object.assign({ id: 'furn.' + id, x, y, p: p || {} }, o));
add('generic.rug', 7.5, 4.5, { w: 7, d: 4, c: '#2f3f72', c2: '#e8c06a', inner: '#27345f' });
add('skydeck.glassfloor', 3.2, 1.6, { w: 3, d: 2 }); add('skydeck.photospot', 9.4, 1.5); add('skydeck.plaque', 11.2, 1.2, { kind: 'photo' }, { photo: 1 });
for (const [d, x, y, f, c] of [['hillcrest', .9, 11.6, 1], ['park', .9, 6.9, 1, '#2f6fb0'], ['oldtown', .9, 4.1, 1, '#b8443a'], ['harbor', 12.4, .9, 0, '#b8443a'], ['airport', 19.3, .9, 0, '#2f6fb0']]) add('skydeck.scope', x, y, c ? { c } : {}, { flip: !!f, district: d });
add('skydeck.plaque', 6.6, .9, {}, { text: 0 }); add('skydeck.plaque', 15.6, .9, {}, { text: 1 }); add('skydeck.plaque', .9, 2.6, { c: '#7a4e2d' }, { text: 2, flip: true }); add('skydeck.plaque', .9, 9.2, {}, { text: 3, flip: true });
add('generic.bench', 7.2, 3.2, { c: '#2f7f86' }); add('generic.bench', 15.2, 3.4, { c: '#2f7f86' }); add('generic.bench', 3.4, 7.4, { c: '#2f7f86' }, { flip: true }); add('generic.bench', 3.4, 12.6, { c: '#2f7f86' }, { flip: true });
add('skydeck.core', 8.5, 10, {}, { lift: 'down' });
add('airport.shop.back', 15, 10.3, { kind: 'coffee', w: 4 }); add('bar.counter', 15.5, 11.5, { w: 3, c: '#39424e', top: '#e8c06a' }, { venue: SKY_VENUES.bar, tags: ['skyshop'], label: 'Cloud Nine' }); add('bar.stool', 15.4, 12.2); add('bar.stool', 18.2, 12.2); add('cafe.tableset', 15.6, 13.8, { c: '#39424e' }); add('cafe.tableset', 18.6, 13.8, { c: '#39424e' });
add('airport.shop.back', 1.6, 10.6, { kind: 'souvenir', w: 4 }); add('airport.shop.counter', 2.1, 11.8, { kind: 'souvenir', w: 3 }, { venue: SKY_VENUES.gifts, tags: ['skyshop'], label: 'SkyDeck Gift Nook' });
add('generic.plant', 21, 15, { kind: 'palm' }); add('generic.plant', .5, 15.2, { kind: 'palm' }); add('generic.plant', 21, 8.6, { kind: 'snake' }); add('generic.floorlamp', 14.2, 10.4); add('generic.pendant', 10.6, 5.6, {}, { z: 1.1 });
spots.push({ x: 16.5, y: 11, dir: 1, kind: 'staff', label: 'Cloud Nine', lines: ['What can I get you? The Sunset Spritz is the one everybody photographs.', 'Sit by the glass if you can. Drinks taste better at altitude.'] }, { x: 3.6, y: 11.35, dir: 1, kind: 'staff', label: 'Gift Nook', lines: ['Snow globes are the classic. The magnet is the budget classic.'] },
  { x: 2.2, y: .9, dir: 3, anim: 'phone' }, { x: 8, y: .9, dir: 3, age: 'kid', lines: KID_LINES }, { x: 8.7, y: 1, dir: 3 }, { x: 14.2, y: .9, dir: 3, anim: 'phone' }, { x: 17, y: .9, dir: 3 }, { x: 17.7, y: .95, dir: 3, lines: ['We got engaged right here. Different carpet then.'] }, { x: 20.6, y: 1.2, dir: 3, age: 'kid', lines: KID_LINES },
  { x: .9, y: 13.6, dir: 2, anim: 'phone' }, { x: .95, y: 8.3, dir: 2 }, { x: 1, y: 5.6, dir: 2, age: 'elder' }, { x: 4.6, y: 4, dir: 3, lines: ['No. Nope. I will watch YOU stand on the glass.'] }, { x: 17.2, y: 12.5, dir: 3, anim: 'drink' }, { x: 4.4, y: 12.9, dir: 3 }, { x: 10.4, y: 2.9, dir: 3, anim: 'phone', lines: ['Say cheese! ...No, a normal face. A NORMAL face.'] },
  // sunset rush
  { x: 5.6, y: .9, dir: 3, busy: 1 }, { x: 10.8, y: .95, dir: 3, busy: 1, anim: 'phone' }, { x: 13.2, y: .9, dir: 3, busy: 1 }, { x: 15.9, y: 2, dir: 3, busy: 1, anim: 'phone' }, { x: 18.6, y: .9, dir: 3, busy: 1 }, { x: 19.4, y: 2.1, dir: 3, busy: 1, age: 'kid', lines: KID_LINES }, { x: .9, y: 10.3, dir: 2, busy: 1 }, { x: 1, y: 14.6, dir: 2, busy: 1, anim: 'phone' }, { x: 2, y: 7.6, dir: 2, busy: 1 }, { x: 6.2, y: 2.2, dir: 3, busy: 1 }, { x: 12, y: 2.4, dir: 3, busy: 1, anim: 'talk' }, { x: 12.7, y: 2.5, dir: 3, busy: 1, anim: 'talk' });

defineRoom({ id: 'skydeck', name: 'SkyDeck at Beacon Tower', w: 22, d: 16, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'skydeck', floor: GT.f_darkwood, wall: { color: '#39424e', trim: '#2a2733', h: 4 }, bg: '#101320', exits: [], spawn: { x: 9.8, y: 12.7, dir: 1 }, items, npcSpots: spots,
  setup(sc) {
    const setP = (o, q) => { o.p = Object.assign({}, o.p, q); o._key = null; }, panes = sc.world.objs.filter(o => o.data && o.data.sky).map(o => { const n = (o.p.w || 4) * 16; return { o, a: o.p.rev ? o.p.u0 - n : o.p.u0, b: o.p.rev ? o.p.u0 : o.p.u0 + n }; });
    const seats = []; for (const f of sc.fixtures) if (/generic\.bench|tableset|bar\.stool/.test(f.asset.id)) for (const s of f.seats) seats.push({ x: s.x - O, y: s.y - O, z: s.z, dir: s.dir === undefined ? 3 : s.dir, seated: true, p: .5, busy: seats.length % 3 === 2 ? 1 : 0 });
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 21, fill: .62, lines: VIS_LINES });
    const lane = () => { const a = [[10.4, 13], [12.6, 8.4], [14 + Math.random() * 6, 2.2 + Math.random(), { wait: 7, dir: 3, pose: Math.random() < .5 ? 'phone' : null }], [7 + Math.random() * 5, 3 + Math.random(), { wait: 4, dir: 3 }], [2.4, 3.6 + Math.random() * 9, { wait: 6, dir: 2, pose: Math.random() < .4 ? 'phone' : null }], [6.6, 9 + Math.random()], [9.6, 12.9]]; if (Math.random() < .5) { const m = a.slice(1, -1).reverse(); a.splice(1, m.length, ...m); } return { pts: a.map(q => Object.assign({ x: q[0] + O, y: q[1] + O }, q[2] || null)), kind: Math.random() < .25 ? 'stroll' : 'walk' }; };
    const wk = walkers(sc, { n: 9, route: lane, lines: VIS_LINES, label: 'Visitor' });
    sc.life = { crowd: cr, walkers: wk, count: () => cr.count() + wk.count(), busy: false };
    let view = null, fr = Math.floor(Math.random() * FRAMES), ft = 0, st = 0, plane = -1, pt = 20 + Math.random() * 30;
    const paint = () => { for (const q of panes) setP(q.o, { time: view, frame: fr, plane: plane >= q.a - 12 && plane <= q.b + 12 ? Math.round(plane) : -1 }); };
    const sync = () => { const v = SK() ? SK().viewNow() : 'day', h = G.now().hf, busy = v === 'dusk' && h > 12; if (v !== view) { view = v; paint(); } if (busy !== sc.life.busy || sc.life.shown === undefined) { sc.life.busy = busy; sc.life.shown = true; cr.show(true, busy); wk.setActive(busy ? 9 : 5); } };
    sc.view = () => view; sync();
    const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); cr.update(dt); wk.update(dt);
      if ((st -= dt) <= 0) { st = 2; sync(); }
      if (plane >= 0) { plane += dt * 16; if (plane > 640) plane = -1; }
      else if ((pt -= dt) <= 0) { pt = 35 + Math.random() * 45; plane = -12; G.emit('skydeck:plane'); }
      if ((ft += dt) > (plane >= 0 ? .35 : 1.6)) { ft = 0; if (plane < 0 || Math.random() < .25) fr = (fr + 1) % FRAMES; paint(); } };
    const e0 = sc.onEnter; sc.onEnter = (o, p) => { e0(o, p); view = null; sync(); if (SK()) SK().arrived(); };
  },
});

const skyOnly = fn => (fx, scene) => (scene.def && scene.def.showpiece === 'skydeck' ? fn(fx, scene) : null);
export function init() {
  registerFixture('elevator', skyOnly((fx, scene) => ({ label: fx.item.lift === 'down' ? 'Lift down to the lobby' : 'Lift to the SkyDeck', hit: 16, use: () => SK() && SK().ride(fx.item.lift !== 'down') })));
  registerFixture('skyticket', skyOnly(() => ({ label: 'SkyDeck tickets', hit: 14, use: () => SK() && SK().buyTicket() })));
  registerFixture('skyshop', skyOnly(fx => ({ label: fx.item.label, hit: 14, shop: fx.item.venue, use: () => G.shop && G.shop.open(fx.item.venue, { checkHours: true }) })));
  registerFixture('telescope', skyOnly(fx => ({ label: 'Telescope (25c)', hit: 14, use: () => SK() && SK().scope(fx.item.district) })));
  registerFixture('city_model', skyOnly(() => ({ label: 'Model of Maple Bay', use: () => toast('A tiny Maple Bay under glass: the bay, the river, Old Town, a red light on the tallest tower. Somebody has added a very small gull.', 'info', 4600) })));
  registerFixture('photospot', skyOnly(() => ({ label: 'Photo spot', hit: 14, range: 1, use: () => SK() && SK().photo() })));
  registerFixture('plaque', skyOnly(fx => fx.item.photo ? { label: 'Take a photo', use: () => SK() && SK().photo() } : { label: 'Plaque: ' + PLAQUES[fx.item.text || 0][0], use: () => { const p = PLAQUES[fx.item.text || 0]; G.emit('skydeck:plaque', fx.item.text || 0); say([{ who: p[0], text: p[1] }]); } }));
  registerFixture('glassfloor', skyOnly(fx => ({ label: 'Step onto the sky ledge', hit: 16, range: .6, spot: { x: fx.x, y: fx.y + .2 }, use: () => {
    bubble(G.player, pick(['Oh. Oh no. Oh WOW.', 'Do not look down. ...I looked down.', '*gasp*'])); const S = G.state.showpieces || (G.state.showpieces = {}), first = !S.ledge; S.ledge = (S.ledge || 0) + 1;
    G.startActivity({ label: 'Standing on the sky ledge', anim: 'stand', minutes: 6, at: { x: fx.x, y: fx.y, z: 0, dir: 3 }, done: () => { try { G.needs.add('fun', first ? 22 : 12); if (MOODLETS.inspired && G.needs.addMoodlet) G.needs.addMoodlet(first ? 'inspired' : 'bay_view'); } catch (e) { } G.emit('skydeck:ledge', first); toast(first ? 'Fifty-two floors of nothing under your shoes. Your knees have opinions. Your heart is delighted.' : 'Still terrifying. Still wonderful.', 'good', 4200); } });
  } })));
}
export { PLAQUES, exitRoom };
