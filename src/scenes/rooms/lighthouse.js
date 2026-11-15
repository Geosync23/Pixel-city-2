// Gull Point Lighthouse — the keeper's cottage (room `lighthouse`, 11 x 8), the two stair rooms (`lighthouse_stair`, `lighthouse_stair2`, 7 x 7 and 7.4 high: 44 real steps each, climbed on the visible stone flights)
// and the watch room (`lighthouse_watch`, 8 x 8). The lantern room + gallery is lighthouse_top.js. Gameplay lives in sim/lighthouse.js (G.lighthouse), data in data/lighthouse.js.
// City door `door:lighthouse` (added at runtime at the door of the keeper's cottage of the existing `bld.harbor.lighthouse`). Exits (doormats, all with `to` so the nav arrow can route):
//   cottage: Gull Point (city) | the tower stair;  stair rooms: down | up (the climb);  watch room: down the stair | the ladder to the lantern.
// Climbing: climb(scene, up) walks the player up (or down) both flights step by step as a cutscene, counting the steps; entering a stair room with opts.top starts at the upper door and walks down.
// scene.lh = { sync(), keeper, cat?, climb(up) -> Promise } per room. Fixture tags (only in lighthouse rooms): lh_stove, lh_table, lh_charts, lh_baro, lh_log, lh_shelf, lh_plaque, lh_basket, lh_frame, lh_bench, lh_weight,
//   lh_radio, lh_flags, lh_scope, lh_ships, lh_clock.
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { Char, charArt } from '../../core/char.js';
import * as R from '../../engine/raster.js';
import { ambient } from '../../core/clock.js';
import { pixSprite } from '../../engine/sprites.js';
import { MODULES } from '../../art/registry.js';
import { defineRoom, registerFixture } from '../interior.js';
import { bubble, toast } from '../../ui/kit.js';
import { registerInfo } from './unique_rooms.js';
import { setP, viewNow } from './fishmarket.js';
import { LR, LV, NAME, KEEPER, STEPS } from '../../data/lighthouse.js';

export const O = 1, LS = () => G.lighthouse, pick = a => a[Math.floor(Math.random() * a.length)];
export const only = fn => (fx, scene) => (scene.def && scene.def.showpiece === 'lighthouse' ? fn(fx, scene) : null);
const mkItems = () => { const items = []; return { items, H: (id, x, y, p, o) => { const it = Object.assign({ id: id.includes('.') ? id : 'furn.lh.' + id, x, y, p: p || {} }, o); items.push(it); return it; }, Wl: (id, wall, at, p, o) => { const it = Object.assign({ id: id.includes('.') ? id : 'furn.lh.' + id, wall, at, p: p || {} }, o); items.push(it); return it; } }; };
let KSPEC = null;
export const keeperSpec = () => { if (KSPEC) return KSPEC; const A = charArt(), s = Object.assign({}, A.randomSpec(R.rng(1894), { age: 'elder', season: 1 })); Object.assign(s, { outfit: null, bag: null, scarf: null, top: 'sweater', topColor: '#2e3a52', bottom: 'slacks', bottomColor: '#4a4a58', hat: 'beanie', hatColor: '#b8402e', beard: true, hairColor: '#e8e8ee', shoes: '#2f2c3a', glasses: false }); return KSPEC = s; };
export function mkKeeper(sc, x, y, dir, where) { const c = new Char(keeperSpec(), O + x, O + y); c.dir = dir; c.kind = 'staff'; c.label = KEEPER + ', keeper'; c.speed = 1.3; sc.ents.push(c); sc.interactables.push({ ent: c, x: c.x, y: c.y, label: c.label, h: 1.3, hit: 9, range: 2, visible: () => !c.hidden, use: () => { c._hold = 4; c.faceTo(G.player.x, G.player.y); LS() && LS().talkKeeper(c, where); } }); return c; }
export const softEnv = (Wd, k = .5, d = .55) => t => { const o = ambient(t, G.state.weather); return { amb: o.amb === '#ffffff' ? o.amb : R.mix(o.amb, '#ffe8c0', k), dark: Math.min(d, (o.dark || 0) * d), bg: Wd.bg, night: o.night }; };
export const animal = (kind, variant, x, y) => ({ isAnimal: true, kind, variant, x, y, z: 0, t: Math.random() * 9, anim: 'sit', dir: 1, bb: [-.15, -.15, .15, .15, .4], hidden: false,
  sprite() { const A = MODULES['./chars/animals.js']; if (!A || !A.drawAnimal) return null; const f = Math.floor(this.t * (this.anim === 'walk' ? 7 : this.anim === 'fly' ? 9 : 1.1)) % (this.anim === 'walk' && this.kind === 'cat' ? 4 : 2), k = this.kind, a = this.anim, d = this.dir, v = this.variant; return pixSprite('lh' + k + v + a + f + d, A.ANIMAL_SB, () => A.drawAnimal(k, { anim: a, frame: f, dir: d, variant: v })); } });
const wxNow = () => String(G.state.weather || 'clear'), season = () => G.now().season;

/* ---------------- the keeper's cottage ---------------- */
{
  const { items, H, Wl } = mkItems();
  Wl('window', 'y', .8, { w: 1.7, side: 'sea', lvl: 0 }, { win: 1 }); Wl('barometer', 'y', 2.8, { k: .6 }, { baro: 1 }); Wl('plaque', 'y', 5.6, {}, { plaque: 1, mount: 1.8 });
  Wl('towerdoor', 'x', .7, {}); Wl('clock', 'x', 2.7, {}); Wl('coats', 'x', 5.1, {}); Wl('furn.lobby.restroom', 'x', 6.9, { c: '#5e3c26', dc: '#2e3a52' });
  H('dresser', 3.5, .1, {}); H('logstand', 6.3, .5, { n: 3 }, { log: 1 }); H('shelf', 8.9, .15, {}); H('stove', .25, 2.9, {}, { flip: true }); H('basket', 1.5, 3.1, {});
  H('rug', 3.4, 3.1, { w: 3.6, d: 2.6 }); H('table', 4.5, 3.6, {}); H('chair', 3.7, 4, {}, { flip: true }); H('chair', 6.1, 4, {}, { flip: true }); H('armchair', 1.6, 5.6, {}); H('charttable', 7.9, 4.9, {});
  defineRoom({ id: LR.cottage, name: NAME + ' — the keeper\'s cottage', w: 11, d: 8, zoom: 1, music: 'quiet', noCrowd: true, showpiece: 'lighthouse', venue: LV.place, floor: GT.f_wood, bg: '#14161e', edge: '#3a3440',
    wall: { color: '#efe9da', pattern: 'planks', trim: '#2e3a52', h: 2.9, rail: 1 },
    exits: [{ x: 5.5, y: 7.4, label: 'Exit to Gull Point', poi: 'door:lighthouse' }, { x: 1.2, y: 1.45, label: 'The tower stair (97 steps to the light)', to: 'int:' + LR.stair1, use: () => G.go('int:' + LR.stair1) }],
    spawn: { x: 5.5, y: 6.6, dir: 3 }, items,
    setup(sc) {
      const Wd = sc.world, by = k => Wd.objs.filter(o => o.data && o.data[k] !== undefined), win = by('win')[0], baro = by('baro')[0], plaque = by('plaque')[0], log = by('log')[0];
      Wd.lights.push({ x: O + 1.4, y: O + 3.6, z: 0, r: 4.5, c: '#ffb870' }, { x: O + 5.2, y: O + 4.3, z: 0, r: 5, c: '#ffe2a0' }, { x: O + 9, y: O + 5, z: 0, r: 3.5, c: '#ffe9b0' }); sc.env = softEnv(Wd);
      const k = mkKeeper(sc, 5.3, 2.9, 1, 'cottage'), cat = animal('cat', 4, O + 1.95, O + 3.55); sc.ents.push(cat); sc.interactables.push({ ent: cat, x: cat.x, y: cat.y, label: 'Wickie, the lighthouse cat', h: .5, hit: 9, range: 1.5, use: () => LS() && LS().pet(cat) });
      const SP = [[5.3, 2.9, 1], [2.3, 3.3, 2], [7, 1.7, 3], [8.6, 6.4, 3]]; let ki = 0, kt = 12, last = '';
      const sync = () => { const L = LS(); if (!L) return; setP(win, { time: viewNow(), wx: wxNow(), season: season() }); setP(baro, { k: L.baroK() }); plaque.hidden = !L.keeperName(); if (!plaque.hidden) setP(plaque, { name: 'S. MARROW & ' + L.keeperName() }); setP(log, { n: Math.min(8, L.logCount()) }); k.hidden = L.keeperAt() !== 'cottage'; };
      sc.lh = { sync, keeper: k, cat }; sync();
      sc.update = dt => { const key = Math.floor(G.state.t / 5) + wxNow(); if (key !== last) { last = key; sync(); } cat.t += dt; k.t += dt; if (k.hidden) return; if (k._hold > 0) { k._hold -= dt; k.moving = false; return; } if (k.path) { k.move(Wd, dt); return; } k.moving = false; if ((kt -= dt) <= 0) { kt = 10 + Math.random() * 14; ki = (ki + 1) % SP.length; if (!k.goTo(Wd, O + SP[ki][0], O + SP[ki][1])) kt = 2; else k.pose = null; } else if (!k.pose && Math.random() < dt * .1) k.dir = SP[ki][2]; };
      const e0 = sc.onEnter; sc.onEnter = (o, prev) => { e0(o, prev); sync(); if (LS()) LS().arrived(sc, prev); };
    } });
}

/* ---------------- the stair rooms ---------------- */
const SW = 7, SH = 7.4, A0 = 1.16, RUN = .22, RISE = .11, N = 22, FH = N * RISE, TOP = { x: 6.5, y: .62, z: FH * 2 };
// the climb as a polyline (room coords): foot -> flight A -> corner -> flight B -> the upper door
const PATH = [[.62, A0 + N * RUN + .5, 0], [.62, A0 + N * RUN, 0], [.62, A0, FH], [.62, .62, FH], [A0, .62, FH], [A0 + N * RUN, .62, FH * 2], [TOP.x, TOP.y, FH * 2]];
const LEN = PATH.map((p, i) => (i ? Math.hypot(p[0] - PATH[i - 1][0], p[1] - PATH[i - 1][1]) : 0)), TOTAL = LEN.reduce((a, b) => a + b, 0);
const at = s => { let i = 1; while (i < PATH.length - 1 && s > LEN[i]) { s -= LEN[i]; i++; } const a = PATH[i - 1], b = PATH[i], k = LEN[i] ? Math.max(0, Math.min(1, s / LEN[i])) : 0; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, b[0] - a[0], b[1] - a[1]]; };
function climb(sc, up, base) {
  if (G.cutscene) return Promise.resolve(false); const p = G.player; let s = up ? 0 : TOTAL, said = -1; p.path = null;
  return new Promise(res => { G.cutscene = { update(dt) { s += (up ? 1.5 : 2) * dt; const q = at(Math.max(0, Math.min(TOTAL, s))); p.x = O + q[0]; p.y = O + q[1]; p.z = q[2]; p.moving = true; p.face(up ? q[3] : -q[3], up ? q[4] : -q[4]);
    const st = Math.max(0, Math.min(N * 2, Math.round(q[2] / RISE))); if (st !== said && st % 4 === 0 && st > 0 && st < N * 2) { said = st; bubble(p, String(base + st), 650); try { G.audio && G.audio.sfx && G.audio.sfx('step_in'); } catch (e) { } }
    if (up ? s >= TOTAL : s <= 0) { G.cutscene = null; p.moving = false; if (!up) p.z = 0; res(true); } } }; });
}
function stairRoom(id, idx) {
  const { items, H, Wl } = mkItems(), first = idx === 0, lower = first ? LR.cottage : LR.stair1, upper = first ? LR.stair2 : LR.watch, base = first ? 0 : STEPS.stair1;
  Wl('flight', 'x', A0, { n: N, run: RUN, rise: RISE, rev: 1, top: 1 }); Wl('flight', 'y', A0, { n: N, run: RUN, rise: RISE, top: 1 }, { mount: FH });
  Wl('window', 'x', 2.6, { w: 1.2, h: 1.4, side: 'sea', lvl: idx * 2 + 1, seed: 4 }, { win: 1, mount: 3.3 }); Wl('window', 'y', 2.5, { w: 1.2, h: 1.4, side: 'bay', lvl: idx * 2 + 2, seed: 6 }, { win: 1, mount: 4.7 });
  Wl('frame', 'y', 3.5, { k: first ? 0 : 2 }, { wreck: first ? 0 : 2, mount: 1.5 }); Wl('frame', 'y', 5.3, { k: first ? 1 : 3 }, { wreck: first ? 1 : 3, mount: 1.5 }); if (!first) Wl('frame', 'x', 5.2, { k: 4 }, { wreck: 4, mount: 2.3 });
  Wl('stepsign', 'x', 3.6, { text: first ? '97 STEPS' : '53 TO GO' }, { mount: first ? 2.2 : 2.3 }); Wl('buckets', 'y', 1.5, {}, { mount: .5 });
  H('weight', 3.3, 3.3, { h: 1, top: SH }, { weight: 1 }); if (first) H('stores', 4.9, 4.6, {}); else H('bench', 3.6, 5.3, {});
  defineRoom({ id, name: NAME + (first ? ' — the lower stair' : ' — the upper stair'), w: SW, d: SW, zoom: 1, music: 'quiet', noCrowd: true, showpiece: 'lighthouse', venue: LV.place, floor: GT.f_stone, bg: '#14161e', edge: '#3a3440',
    wall: { color: '#e4ddcc', pattern: 'plain', trim: '#7a7468', h: SH },
    exits: [{ x: 4.6, y: 6.5, label: first ? "Down to the keeper's cottage" : 'Down the stair', to: 'int:' + lower, use: () => (first ? G.go('int:' + LR.cottage, { x: O + 2, y: O + 1.6 }) : G.go('int:' + LR.stair1, { top: 1 })) },
      { x: 1.9, y: 6.2, label: `Climb the stair (${N * 2} steps)`, to: 'int:' + upper, use: () => G.scene.lh && G.scene.lh.climb(true) }],
    spawn: { x: 3.2, y: 5.9, dir: 3 }, items,
    setup(sc) {
      const Wd = sc.world, by = k => Wd.objs.filter(o => o.data && o.data[k] !== undefined), wins = by('win'), wt = by('weight')[0];
      Wd.block(O, O, O + 1.25, O + SW); Wd.block(O, O, O + SW, O + 1.25);
      Wd.decal({ x0: O, y0: O, x1: O + SW, y1: O + SW, draw(Rr) { Rr.qz(O, O + SW, O, O + SW, 0, (x, y) => { const X = x - O - 3.55, Y = y - O - 3.55, d = Math.hypot(X, Y), a = Math.atan2(Y, X); if (d < .5) return '#5a564e'; const ring = Math.floor(d / .9), seg = Math.floor((a + Math.PI) / (Math.PI * 2) * (6 + ring * 4) + (ring & 1) * .5), fr = d / .9 - ring; if (fr < .06) return '#8a8478'; const k = R.hash2(seg, ring, 4), e = (a + Math.PI) / (Math.PI * 2) * (6 + ring * 4) + (ring & 1) * .5; if (e - Math.floor(e) < .05) return '#8a8478'; return k > .6 ? '#c2bcae' : k < .2 ? '#aaa496' : '#b6b0a2'; }); } }); Wd.version++;
      Wd.lights.push({ x: O + 3.5, y: O + 4.5, z: 0, r: 5, c: '#ffe2a0' }, { x: O + 6.3, y: O + 1.6, z: 0, r: 3, c: '#ffd98a' }); sc.env = softEnv(Wd, .4, .6);
      let last = '', busy = false;
      const sync = () => { const L = LS(); for (const o of wins) setP(o, { time: viewNow(), wx: wxNow(), season: season() }); if (wt && L) { const w = L.wound(); setP(wt, { h: first ? (w < .5 ? .3 + w * 2 * (SH - 1.2) : SH) : (w >= .5 ? .3 + (w - .5) * 2 * (SH - 1.2) : -1), top: SH }); wt.hidden = !first && w < .5; } };
      const go = async up => { if (busy || G.busy) return false; busy = true; try { if (up) { await climb(sc, true, base); if (LS()) LS().climbed(N * 2, true, idx); await G.go('int:' + upper, upper === LR.watch ? { x: O + 4, y: O + 6.4 } : {}); } else { await climb(sc, false, base); if (LS()) LS().climbed(N * 2, false, idx); } } finally { busy = false; } return true; };
      sc.lh = { sync, climb: go }; sync();
      sc.update = () => { const key = Math.floor(G.state.t / 5) + wxNow(); if (key !== last) { last = key; sync(); } };
      const e0 = sc.onEnter; sc.onEnter = (o, prev) => { e0(o, prev); sync(); if (o && o.top) { const p = G.player; p.x = O + TOP.x; p.y = O + TOP.y; p.z = TOP.z; go(false); } if (LS()) LS().arrived(sc, prev); };
    } });
}
stairRoom(LR.stair1, 0); stairRoom(LR.stair2, 1);

/* ---------------- the watch room ---------------- */
{
  const { items, H, Wl } = mkItems();
  Wl('window', 'y', .5, { w: 3, h: 1.5, side: 'bay', lvl: 1, seed: 5 }, { win: 1, mount: 1.1 }); Wl('hoist', 'y', 3.7, { word: '' }, { hoist: 1 }); Wl('shipboard', 'y', 4.7, { lines: [] }, { ships: 1 });
  Wl('window', 'x', .8, { w: 2.4, h: 1.5, side: 'sea', lvl: 1, seed: 9 }, { win: 1, mount: 1.1 }); Wl('ladder', 'x', 6.2, {});
  H('telescope', 1.5, 1, {}); H('flaglocker', .2, 3.5, {}, { flip: true }); H('clockwork', 3.6, 3.3, { f: 0 }, { cw: 1 }); H('radio', 5.3, 5.1, {}); H('furn.lh.rug', 2.6, 5.4, { w: 2.4, d: 1.6 });
  defineRoom({ id: LR.watch, name: NAME + ' — the watch room', w: 8, d: 8, zoom: 1, music: 'quiet', noCrowd: true, showpiece: 'lighthouse', venue: LV.place, floor: GT.f_darkwood, bg: '#14161e', edge: '#3a3440',
    wall: { color: '#e4ddcc', pattern: 'plain', trim: '#2e3a52', h: 3.4, rail: .95 },
    exits: [{ x: 4, y: 7.4, label: 'Down the stair (88 steps)', to: 'int:' + LR.stair2, use: () => G.go('int:' + LR.stair2, { top: 1 }) }, { x: 1.2, y: 6.6, label: 'Ladder up to the lantern', to: 'int:' + LR.lantern, use: () => LS() && LS().ladder(true) }],
    spawn: { x: 4, y: 6.4, dir: 3 }, items,
    setup(sc) {
      const Wd = sc.world, by = k => Wd.objs.filter(o => o.data && o.data[k] !== undefined), wins = by('win'), hoist = by('hoist')[0], board = by('ships')[0], cw = by('cw')[0];
      Wd.lights.push({ x: O + 4, y: O + 4.5, z: 0, r: 5.5, c: '#ffe2a0' }, { x: O + 6.2, y: O + 5.8, z: 0, r: 3, c: '#b8ffd0' }); sc.env = softEnv(Wd);
      const k = mkKeeper(sc, 2.6, 2.3, 3, 'watch'); let last = '', ft = 0;
      const sync = () => { const L = LS(); if (!L) return; for (const o of wins) setP(o, { time: viewNow(), wx: wxNow(), season: season() }); setP(hoist, { word: L.word() || '' }); setP(board, { lines: L.shipLines() }); k.hidden = L.keeperAt() !== 'watch'; setP(cw, { wound: Math.round(L.wound() * 10) / 10 }); };
      sc.lh = { sync, keeper: k, spin(n) { ft = n || 3; } }; sync();
      sc.update = dt => { const key = Math.floor(G.state.t / 5) + wxNow(); if (key !== last) { last = key; sync(); } k.t += dt; if (k._hold > 0) k._hold -= dt; const L = LS(), on = L && L.lampOn(); if (ft > 0 || on) { ft = Math.max(0, ft - dt); setP(cw, { f: Math.floor(G.time * (ft > 0 ? 9 : 2)) % 8 }); } };
      const e0 = sc.onEnter; sc.onEnter = (o, prev) => { e0(o, prev); sync(); if (LS()) LS().arrived(sc, prev); };
    } });
}

registerInfo(NAME, {
  blurb: 'The striped light at the end of Gull Point, and you can go all the way up. Through the keeper\'s cottage (stove, charts, a barometer that tells the truth and a cat called Wickie), up ninety-seven stone steps past the shipwreck pictures, into the watch room with its radio, signal flags and telescope, and up the last ladder to the great lens and the open gallery over the whole bay.',
  signature: 'The lamp lighting at dusk: the keeper lets you strike the match, and the beams go round over the sea.',
  tryThis: ['Climb all ninety-seven steps (there is a bench halfway)', 'Tap the barometer and read the keeper\'s log', 'Listen to the shipping bulletin on the radio', 'Spell a word in signal flags and hoist it', 'Spot a named ship in the telescope and log it', 'Wind the clockwork that turns the lens', 'Polish the lens', 'Be in the lantern at dusk and help light the lamp', 'Watch the sunset, a storm or the stars from the gallery', 'Have a mug of tea with Silas'],
  activities: ['lh_climb', 'lh_lamp', 'lh_flags', 'lh_ships', 'lh_polish', 'lh_wind', 'lh_radio', 'lh_sunset', 'lh_storm', 'lh_stars', 'lh_tea'], kind: 'landmark',
});

export function init() {
  const F = (tag, label, fn, o) => registerFixture(tag, only((fx, sc) => Object.assign({ label: typeof label === 'function' ? label(fx) : label, hit: 12, use: () => LS() && fn(LS(), fx, sc) }, o)));
  F('lh_stove', 'The stove', L => L.stove()); F('lh_table', "The keeper's table", (L, fx, sc) => L.tea(sc)); F('lh_charts', 'The chart table', L => L.charts()); F('lh_baro', 'Tap the barometer', L => L.barometer(), { h: 1.8 });
  F('lh_log', "The keeper's log", L => L.log()); F('lh_shelf', "The Keeper's Shelf", L => L.shelf(), { shop: LV.shelf }); registerFixture('lh_plaque', only(fx => ({ label: 'Keepers of the Light', hit: 12, h: 2, visible: () => !fx.ob.hidden, use: () => LS() && LS().plaque() })));
  F('lh_frame', 'A framed shipwreck', (L, fx) => L.frame(fx.item.wreck), { h: 2 }); F('lh_bench', 'Catch your breath', (L, fx, sc) => L.bench(fx, sc)); F('lh_weight', 'The clock weight', L => L.weightInfo(), { h: 2 });
  F('lh_radio', 'The radio', L => L.radio()); F('lh_flags', 'The signal flag locker', L => L.flags(), { h: 1.8 }); F('lh_scope', 'The telescope', L => L.scope()); F('lh_ships', 'Ships today', L => L.shipBoard(), { h: 2 }); F('lh_clock', 'The clockwork', L => L.wind(), { h: 1.6 });
}
