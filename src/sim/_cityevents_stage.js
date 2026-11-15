// Big city events — the STAGE (private helper of sim/cityevents.js): everything an event puts into the city world and takes out again.
//   buildStage(ev, city, graph) -> stage     layout only (nothing placed yet): dressing by level, barriers, stalls, props, spectator spots, the parade line-up
//   stage.setLevel(n)      0 nothing | 1 posters + banners | 2 + bunting + arches | 3 + barriers, stalls, set pieces, actors   (idempotent; 0 removes everything)
//   stage.update(dt, o)    o = { u: parade progress (units) | -1, dens: 0..1 spectator density, wet, t: seconds } moves the parade and keeps spectators around the screen
//   stage.cycle, stage.passes, stage.len (route length), stage.total (line-up length)   stage.placed -> world objects   stage.actors -> entities in the city scene
//   stage.propOb(i | id)   stage.setProp(i | id, p)   re-skin a set piece (the tree lights up)       stage.near(x, y) -> distance to the route / site
// All world objects are placed non-solid, so the nav grid is never touched; setLevel(0) restores the world exactly.
import { G } from '../core/game.js';
import { Char, charArt } from '../core/char.js';
import * as RA from '../engine/raster.js';
import { U, rng } from '../engine/raster.js';
import { GT } from '../engine/world.js';
import { assetSprite, pixSprite } from '../engine/sprites.js';
import { ASSETS, assetSize } from '../art/registry.js';
import { Cit, getSpec, speak, ambientLine } from './_crowd_core.js';
import { TUNE } from '../data/cityevents.js';

const FPS = { walk: 7, stand: 1.2, dance: 6, wave: 5, cheer: 5, talk: 4, work: 4, sit: .5, phone: .8 };
const SB = [-20, -52, 20, 12];
const BUNT = { blossom: 'pennant', harbor: 'lights', fair: 'pennant', harvest: 'pennant', lantern: 'lantern', winter: 'lights' };
const C = RA.C, px = RA.px;

/* ---------- marcher looks: clothes + what they carry ---------- */
const RBW = ['#e0453a', '#f09a3a', '#f2c230', '#4fa860', '#3b82d6', '#8a5cd0'];
const band = (coat, trousers, hat) => ({ o: { top: 'jacket', topColor: coat, bottom: 'slacks', bottomColor: trousers, hat: 'cap', hatColor: hat, bag: null, outfit: null, age: 'adult' }, items: ['drum', 'horn', 'horn', 'flute', 'tuba', 'cymbal'], cols: [coat, hat] });
export const LOOKS = {
  bandPink: band('#e0608f', '#f4f0e8', '#f4f0e8'), bandFair: band('#8a5cd0', '#f4f0e8', '#f2c230'), bandHarvest: band('#b8432a', '#5a3a22', '#e8b63a'), bandLantern: Object.assign(band('#c0302a', '#33303f', '#f2c230'), { items: ['drum', 'cymbal', 'drum'] }),
  bandWinter: band('#d8342e', '#f4f8fb', '#2f8f6a'),
  bannerP: { o: { top: 'long', topColor: '#fbe3ea', bag: null }, items: ['standard'], cols: ['#e0608f', '#fbe3ea'] }, bannerR: { o: { top: 'tee', topColor: '#f4f0e8', bag: null }, items: ['standard'], cols: ['#8a5cd0', '#f2c230'] },
  bannerW: { o: { top: 'coat', topColor: '#2f8f6a', bag: null }, items: ['standard'], cols: ['#d8342e', '#f4f8fb'] },
  parasol: { o: { top: 'dress', topColor: '#f7c1d4', bag: null, hat: null }, items: ['parasol'], cols: ['#f2a7c3', '#fbe3ea', '#e0608f', '#9ad0a0'] },
  koi: { o: { top: 'long', topColor: '#f4f0e8', bottomColor: '#3b6fd0', bag: null }, items: ['koi'], cols: ['#e0453a', '#3b82d6', '#f09a3a'] },
  petalKids: { o: { age: 'kid', top: 'tee', topColor: '#f7c1d4', bag: null }, items: ['pompom'], cols: ['#f2a7c3', '#fbe3ea'] },
  flags: { o: { bag: null }, items: ['flag'], cols: RBW }, pompom: { o: { top: 'tank', topColor: '#f2c230', bottom: 'shorts', bag: null }, items: ['pompom'], cols: ['#e0453a', '#3b82d6', '#f2c230', '#4fa860'] },
  balloon: { o: { bag: null }, items: ['balloon'], cols: RBW },
  sheaf: { o: { top: 'flannel', topColor: '#b8432a', bottom: 'overalls', bottomColor: '#4a6fa8', hat: 'sunhat', hatColor: '#e8c85a', bag: null }, items: ['sheaf', 'pumpkin'], cols: ['#e8c85a'] },
  scarecrow: { o: { top: 'flannel', topColor: '#6f7a48', bottom: 'overalls', bottomColor: '#7a5238', hat: 'sunhat', hatColor: '#c9a23a', bag: null }, items: ['pompom'], cols: ['#e8c85a', '#d9562b'] },
  lantern: { o: { top: 'long', topColor: '#c0302a', bag: null }, items: ['lantern'], cols: ['#e0453a', '#f2c230', '#f09a3a'] }, lanternBig: { o: { top: 'long', topColor: '#33303f', bag: null }, items: ['lanternBig'], cols: ['#e0453a', '#f2c230'] },
  lanternKids: { o: { age: 'kid', bag: null }, items: ['lantern'], cols: ['#f2c230', '#ffd0c0', '#f09a3a'] },
  candle: { o: { top: 'coat', topColor: '#2f3f72', scarf: '#d8342e', hat: 'beanie', hatColor: '#d8342e', bag: null }, items: ['candle'], cols: ['#fff2b0'] },
  elves: { o: { top: 'long', topColor: '#2f8f6a', bottom: 'leggings', bottomColor: '#d8342e', hat: 'beanie', hatColor: '#d8342e', bag: null }, items: ['pompom', 'bell'], cols: ['#f2c230', '#f4f8fb'] },
  bearer: { o: { top: 'long', topColor: '#33303f', bottom: 'slacks', bottomColor: '#33303f', bag: null, hat: null }, items: [null], cols: [] },
  rider: { o: { bag: null }, items: [null], cols: [] }, farmer: { o: { top: 'flannel', topColor: '#b8432a', bottom: 'overalls', hat: 'sunhat', hatColor: '#e8c85a', bag: null, age: 'adult' }, items: [null], cols: [] },
  santa: { o: { top: 'coat', topColor: '#d8342e', bottom: 'slacks', bottomColor: '#d8342e', hat: 'beanie', hatColor: '#d8342e', beard: true, hairColor: '#f4f8fb', age: 'elder', bag: null }, items: [null], cols: [] },
  queen: { o: { top: 'dress', topColor: '#fbe3ea', hat: null, bag: null, age: 'adult' }, items: ['crown'], cols: ['#f2c230'] },
  drummer: { o: { top: 'tank', topColor: '#c0302a', bottom: 'slacks', bottomColor: '#33303f', hat: 'headband', hatColor: '#f4f0e8', bag: null }, items: [null], cols: [] },
};
const lookPools = new Map();
function lookSpecs(id) {
  let p = lookPools.get(id); if (p) return p; const L = LOOKS[id] || LOOKS.rider, A = charArt(), r = rng(id.length * 131 + id.charCodeAt(0) * 17 + id.charCodeAt(id.length - 1)); p = [];
  for (let i = 0; i < 5; i++) { const s = A.randomSpec(r, { age: L.o.age || 'adult', season: RA.ENV.season, district: 'arts' }); Object.assign(s, L.o); if (L.o.outfit === null) s.outfit = null; p.push(s); }
  lookPools.set(id, p); return p;
}
export function clearLooks() { lookPools.clear(); }

/* what a marcher carries: drawn in sprite pixels around the feet anchor (0,0); fx = +1 when the figure faces screen-right */
function drawItem(it, f, dir, c1, c2) {
  const fx = dir === 0 || dir === 3 ? 1 : -1, front = dir < 2, P = (x, y, h) => px(x, y, C(h)), o = RA.PW(0, 0, 0), X = Math.round(o[0]), Y = Math.round(o[1]), b = f & 1;
  const R = (x, y, w, h, col) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(X + x + i, Y + y + j, col); };
  const lamp = (x, y, col, r) => { RA.glow(() => { for (let j = -r - 3; j <= r + 3; j++) for (let i = -r - 3; i <= r + 3; i++) { const d = Math.abs(i) + Math.abs(j); if (d > r + 3 || (d > r && ((i + j) & 1))) continue; P(X + x + i, Y + y + j, RA.lt(col, .4)); } }); RA.lit(() => { for (let j = -r; j <= r; j++) for (let i = -r + (Math.abs(j) === r ? 1 : 0); i <= r - (Math.abs(j) === r ? 1 : 0); i++) P(X + x + i, Y + y + j, i < 0 && j < 0 ? RA.lt(col, .4) : col); }); };
  if (it === 'drum') { if (front) { R(-4, -14, 9, 5, '#f4f0e8'); R(-4, -14, 9, 1, c1); R(-4, -10, 9, 1, c1); P(X - 3 + b * 2, Y - 16, '#8a6a45'); P(X + 3 - b * 2, Y - 15, '#8a6a45'); } else { R(fx * 4 - 1, -14, 3, 5, '#f4f0e8'); R(fx * 4 - 1, -14, 3, 1, c1); } }
  else if (it === 'horn') { for (let i = 2; i <= 7; i++) P(X + fx * i, Y - 18 + (front ? (i >> 2) : -(i >> 2)), '#f2c230'); R(fx * 8 - 1, -19 + (front ? 1 : -2), 2, 3, '#e8a820'); }
  else if (it === 'flute') { for (let i = -1; i <= 6; i++) P(X + fx * i, Y - 18, '#d8dde2'); }
  else if (it === 'tuba') { R(-fx * 5 - 2, -30, 5, 5, '#f2c230'); R(-fx * 5 - 1, -29, 3, 3, '#8a6a20'); R(-fx * 4 - 1, -25, 2, 9, '#e8a820'); }
  else if (it === 'cymbal') { R(-6 + b, -15, 2, 5, '#f2c230'); R(5 - b, -15, 2, 5, '#e8a820'); }
  else if (it === 'flag') { for (let y = -36; y <= -10; y++) P(X + fx * 5, Y + y, '#d8d2c0'); for (let j = 0; j < 6; j++) for (let i = 1; i <= 8; i++) P(X + fx * 5 + fx * i, Y - 36 + j + (((i + f) >> 2) & 1), j < 2 ? c1 : j < 4 ? c2 : RBW[(RBW.indexOf(c1) + 3) % 6] || c1); }
  else if (it === 'standard') { for (let y = -46; y <= -10; y++) P(X + fx * 4, Y + y, '#d8d2c0'); R(fx * 4 - 4, -46, 9, 14, c1); R(fx * 4 - 3, -44, 7, 2, c2); R(fx * 4 - 3, -36, 7, 2, c2); R(fx * 4 - 1, -41, 3, 3, c2); P(X + fx * 4 - 4, Y - 32, c2); P(X + fx * 4 + 4, Y - 32, c2); }
  else if (it === 'parasol') { for (let y = -30; y <= -12; y++) P(X + fx * 3, Y + y, '#8a6a45'); for (let j = 0; j < 4; j++) { const w = 4 + j * 2; R(fx * 3 - w, -34 + j, w * 2 + 1, 1, j < 2 ? RA.lt(c1, .3) : c1); } for (let i = -8; i <= 8; i += 4) P(X + fx * 3 + i, Y - 30, c2); }
  else if (it === 'koi') { for (let y = -44; y <= -10; y++) P(X + fx * 4, Y + y, '#d8d2c0'); for (let i = 1; i <= 11; i++) { const w = i < 3 ? 1 : i < 9 ? 2 : i === 9 ? 1 : 2, yy = -43 + (((i + f) >> 1) & 1); for (let j = -w; j <= w; j++) P(X + fx * 4 - fx * i, Y + yy + j, j === -w ? RA.lt(c1, .3) : (i % 3 === 0 ? '#f4f0e8' : c1)); } P(X + fx * 4 - fx * 2, Y - 44 + (((2 + f) >> 1) & 1), '#2b2238'); }
  else if (it === 'pompom') { const d = b ? -5 : 0; R(-8, -14 + d, 3, 3, c1); R(6, -19 - d, 3, 3, c2 || c1); P(X - 7, Y - 15 + d, RA.lt(c1, .4)); P(X + 7, Y - 20 - d, RA.lt(c2 || c1, .4)); }
  else if (it === 'bell') { R(fx * 6 - 1, -15 - b * 2, 3, 3, '#f2c230'); P(X + fx * 6, Y - 12 - b * 2, '#8a6a20'); }
  else if (it === 'balloon') { for (let y = -30; y <= -12; y++) P(X + fx * 5 + ((y >> 3) & 1), Y + y, '#e8e2d4'); for (let j = -4; j <= 4; j++) { const w = Math.round(Math.sqrt(16 - j * j) * .85); R(fx * 5 - w, -35 + j, w * 2 + 1, 1, c1); } P(X + fx * 5 - 1, Y - 37, RA.lt(c1, .5)); P(X + fx * 5 - 2, Y - 36, RA.lt(c1, .5)); }
  else if (it === 'lantern') { for (let i = 0; i <= 6; i++) P(X + fx * (3 + i), Y - 14 - i, '#8a6a45'); P(X + fx * 9, Y - 19, '#8a6a45'); lamp(fx * 9, -15, c1, 2); }
  else if (it === 'lanternBig') { for (let y = -40; y <= -10; y++) P(X + fx * 4, Y + y, '#7a2a24'); lamp(fx * 4, -44, c1, 4); R(fx * 4 - 1, -39, 3, 1, '#f2c230'); }
  else if (it === 'candle') { R(fx * 5, -14, 1, 3, '#f4f0e8'); lamp(fx * 5, -16, c1, 1); }
  else if (it === 'sheaf') { for (let k = 0; k < 4; k++) for (let i = 0; i < 10; i++) P(X - fx * (2 + k) - fx * (i >> 2), Y - 16 - i, k % 2 ? '#e8c85a' : '#c9a23a'); R(-fx * 4 - 1, -18, 4, 1, '#8a5a2a'); }
  else if (it === 'pumpkin') { if (front) { R(-3, -13, 7, 5, '#e8802a'); R(-2, -14, 5, 1, '#e8802a'); P(X, Y - 15, '#5a7a3a'); P(X - 3, Y - 13, '#c9662a'); P(X + 3, Y - 13, '#c9662a'); } else R(fx * 4 - 1, -13, 3, 4, '#e8802a'); }
  else if (it === 'crown') { R(-3, -29, 7, 1, c1); P(X - 3, Y - 30, c1); P(X, Y - 31, c1); P(X + 3, Y - 30, c1); P(X, Y - 30, c1); }
}

/* ---------- entities ---------- */
class Mar extends Char {   /* marcher / rider */
  constructor() { super(null, 0, 0); this.isEventActor = true; this.hidden = true; this.alpha = 1; this.look = 'rider'; this.vi = 0; this.item = null; this.c1 = '#fff'; this.c2 = '#fff'; this.an = 'walk'; this.seated = false; this._k = -1; this._s = null; this.bubbleH = 1.9; }
  dress(look, i) { const L = LOOKS[look] || LOOKS.rider, P = lookSpecs(look); this.look = look; this.vi = i % P.length; this.spec = P[this.vi]; this.item = L.items[i % L.items.length]; this.c1 = L.cols.length ? L.cols[i % L.cols.length] : '#fff'; this.c2 = L.cols.length ? L.cols[(i + 1) % L.cols.length] : '#fff'; this._k = -1; this.t = (i * .37) % 3; }
  sprite() {
    const A = charArt(), a = A.ANIMS[this.an] ? this.an : 'stand', n = A.ANIMS[a] || 1, f = Math.floor(this.t * (FPS[a] || 4)) % n, dir = this.dir, k = f * 8 + dir + (this.seated ? 4 : 0);
    if (k === this._k && this._s) return this._s; this._k = k; const spec = this.spec, it = this.item, c1 = this.c1, c2 = this.c2, seated = this.seated;
    return this._s = pixSprite('cev' + this.look + this.vi + (it || '') + c1 + a + f + dir + (seated ? 's' : ''), SB, () => { A.drawChar(spec, seated ? { anim: a, frame: f, dir, seated: true } : { anim: a, frame: f, dir }); if (it) drawItem(it, f, dir, c1, c2); });
  }
}
class Flt {   /* float / boat / dragon part: an asset sprite that lies along its direction of travel */
  constructor() { this.x = 0; this.y = 0; this.z = 0; this.hidden = true; this.alpha = 1; this.isEventActor = true; this.isFloat = true; this.asset = null; this.p = {}; this.ax = 'x'; this.d = 1; this.len = 4; this.wid = 2; this.h = 3; this.bb = [0, 0, 0, 0, 1]; this.spr = {}; this.hop = -1; }
  set(asset, p) { this.asset = asset; this.p = p || {}; const s = assetSize(asset, this.p); this.len = s[0]; this.wid = s[1]; this.h = s[2]; this.spr = {}; }
  face(ax, d) { if (ax === this.ax && d === this.d) return; this.ax = ax; this.d = d; const a = this.len / 2, b = this.wid / 2; if (ax === 'x') { this.bb[0] = -a; this.bb[1] = -b; this.bb[2] = a; this.bb[3] = b; } else { this.bb[0] = -b; this.bb[1] = -a; this.bb[2] = b; this.bb[3] = a; } this.bb[4] = this.h; }
  sprite() {
    const k = this.ax + this.d + (this.hop >= 0 ? this.hop : ''); let s = this.spr[k]; if (s !== undefined) return s;
    const flip = this.ax === 'y', p = Object.assign({}, this.p, { dir: this.d }); if (this.hop >= 0) p.hop = this.hop; let r = null;
    try { r = assetSprite(this.asset, p, flip); } catch (e) { r = null; } if (!r) return this.spr[k] = null;
    const hx = (flip ? this.wid : this.len) / 2, hy = (flip ? this.len : this.wid) / 2;
    return this.spr[k] = { c: r.c, l: r.l, x: r.x - Math.round((hx - hy) * U), y: r.y - Math.round((hx + hy) * U / 2), w: r.w, h: r.h };
  }
}

/* ---------- route geometry ---------- */
function mkRoute(pts) {
  const segs = []; let L = 0;
  for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy); if (len < .01) continue; segs.push({ x0: a[0], y0: a[1], x1: b[0], y1: b[1], len, ux: dx / len, uy: dy / len, ax: Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y', d: (Math.abs(dx) >= Math.abs(dy) ? dx : dy) > 0 ? 1 : -1, s0: L }); L += len; }
  return { segs, len: L, at(s, lat, out) { let g = segs[0]; for (let i = 1; i < segs.length; i++) if (s >= segs[i].s0) g = segs[i]; const t = Math.max(-2, Math.min(g.len + 2, s - g.s0)); out.x = g.x0 + g.ux * t - g.uy * lat; out.y = g.y0 + g.uy * t + g.ux * lat; out.ax = g.ax; out.d = g.d; return out; } };
}
const BADG = new Set([GT.asphalt, GT.water, GT.deepwater, GT.void, GT.tarmac, GT.ballast]);
const tmp = { x: 0, y: 0, ax: 'x', d: 1 };

export function buildStage(ev, city, graph) {
  const world = city.world, R = rng(ev.id.length * 977 + 13), route = mkRoute(ev.route.pts), water = !!ev.route.water;
  const dressR = ev.route.dress === false ? (ev.street ? { r: mkRoute(ev.street.pts), half: ev.street.half } : null) : { r: route, half: ev.route.half };
  const sch = ev.scheme, decor = [[], [], [], []], keep = [];   /* decor[level] = [{ a, x, y, p, flip, i?: prop index }] */
  const add = (lvl, a, x, y, p, flip, extra) => { if (!ASSETS.has(a)) return null; const d = Object.assign({ a, x, y, p: p || {}, flip: !!flip }, extra); decor[lvl].push(d); return d; };
  const free = (x0, y0, x1, y1, road) => { for (let y = Math.floor(y0); y < y1; y++) for (let x = Math.floor(x0); x < x1; x++) { if (world.isBlocked(x + .5, y + .5)) return false; const t = world.tileType(x + .5, y + .5); if (t === GT.water || t === GT.deepwater || (!road && t === GT.asphalt)) return false; } return true; };
  const fit = (x, y, w, d, road) => { if (free(x, y, x + w, y + d, road)) return [x, y]; for (let r = .5; r <= 6; r += .5) for (const [dx, dy] of [[0, r], [0, -r], [r, 0], [-r, 0], [r, r], [-r, -r], [r, -r], [-r, r]]) if (free(x + dx, y + dy, x + dx + w, y + dy + d, road)) return [x + dx, y + dy]; return null; };

  /* dressing along the street */
  if (dressR) dressR.r.segs.forEach((g, gi) => {
    const half = gi > 0 && ev.route.half2 ? ev.route.half2 : dressR.half, span = Math.round((2 * half + 1) * 2) / 2, y = g.ax === 'y', c = y ? g.x0 : g.y0, lo = Math.min(y ? g.y0 : g.x0, y ? g.y1 : g.x1), hi = Math.max(y ? g.y0 : g.x0, y ? g.y1 : g.x1);
    const across = (lvl, a, s, p, off = 0) => y ? add(lvl, a, c - span / 2 + off, s, p, false) : add(lvl, a, s, c - span / 2 + off, p, true);
    const n = Math.max(1, Math.round((hi - lo - 6) / 7)); for (let i = 0; i <= n; i++) across(2, 'prop.event.bunting', lo + 3 + (hi - lo - 6) * (n ? i / n : .5), { scheme: sch, span, kind: BUNT[sch] || 'pennant', seed: i + 1 });
    if (gi === 0) across(2, 'prop.event.arch', (g.d > 0 ? lo : hi) + g.d * 1.2 - .3, { scheme: sch, span, text: ev.arch || ev.name.toUpperCase().slice(0, 15) });
    if (gi === dressR.r.segs.length - 1 && hi - lo > 14) across(2, 'prop.event.arch', (g.d > 0 ? hi : lo) - g.d * 1.2 - .3, { scheme: sch, span, text: ev.arch2 || ev.arch || ev.name.toUpperCase().slice(0, 15) });
    for (let s = lo + 5; s < hi - 2; s += 9) for (const side of [-1, 1]) { const o = c + side * (half + .35) - (side < 0 ? .2 : 0); if (y) add(1, 'prop.event.banner', o, s, { scheme: sch }); else add(1, 'prop.event.banner', s, o - .35, { scheme: sch }, true); }
    for (const s of [lo + 1.4, hi - 3.2]) { const o = c + half + .75; if (y) add(1, 'prop.event.poster', o, s, { scheme: sch, text: ev.poster || ev.name.split(' ')[0], text2: ev.poster2 || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][(ev.day - 1) % 7] }, true); else add(1, 'prop.event.poster', s, o, { scheme: sch, text: ev.poster || ev.name.split(' ')[0], text2: ev.poster2 || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][(ev.day - 1) % 7] }); }
  });

  /* barriers at the outer ends of the closed stretch */
  const edges = [], nodeUse = new Map();
  for (const [rid, a, b] of ev.close || []) { const e = graph.edges.find(q => q.road.id === rid && Math.min(q.s0, q.s1) === Math.min(a, b) && Math.max(q.s0, q.s1) === Math.max(a, b)); if (!e) { console.warn('cityevents: no road edge', rid, a, b); continue; } edges.push(e); for (const n of [e.from, e.to]) nodeUse.set(n, (nodeUse.get(n) || 0) + 1); }
  for (const e of edges) for (const n of [e.from, e.to]) {
    if (nodeUse.get(n) !== 1 || n.dead) continue; const y = e.axis === 'y', nc = y ? n.y : n.x, dir = n === e.from ? e.d : -e.d, s = nc + dir * ((y ? n.hy : n.hx) + 1.1), w = e.half * 2;
    if (y) add(3, 'prop.event.barrier', e.c - w / 2, s - .25, { w, scheme: sch }); else add(3, 'prop.event.barrier', s - .25, e.c - w / 2, { w, scheme: sch }, true);
  }

  /* stalls + set pieces (nudged onto free ground) */
  const boxes = [], stalls = [], props = [];
  for (const st of ev.stalls || []) { const w = st.flip ? 2 : 3, d = st.flip ? 3 : 2, q = fit(st.x, st.y, w, d, true); if (!q) { console.warn('cityevents: no room for stall', st.name); continue; }
    const dd = add(3, 'prop.event.stall', q[0], q[1], { scheme: sch, kind: st.kind, text: st.text, seed: stalls.length + 2 }, st.flip); if (!dd) continue; boxes.push([q[0] - .4, q[1] - .4, q[0] + w + .4, q[1] + d + (st.flip ? .4 : 1.2) + (st.flip ? 0 : 0)]); if (st.flip) boxes[boxes.length - 1][2] += .9;
    stalls.push({ def: st, x: q[0] + w / 2, y: q[1] + d / 2, spot: st.flip ? { x: q[0] + w + .6, y: q[1] + d / 2 } : { x: q[0] + w / 2, y: q[1] + d + .6 } }); }
  (ev.props || []).forEach((pr, i) => {
    const a = ASSETS.get(pr.a); if (!a) { props.push(null); return; } const sz = assetSize(a, pr.p || {}), w = pr.flip ? sz[1] : sz[0], d = pr.flip ? sz[0] : sz[1], q = pr.water ? [pr.x, pr.y] : fit(pr.x, pr.y, w, d, true) || [pr.x, pr.y];
    const dd = add(3, pr.a, q[0], q[1], Object.assign(/bunting|balloons|stage/.test(pr.a) ? { scheme: sch } : {}, pr.p), pr.flip, { i, id: pr.id, keepDays: pr.keep }); if (pr.keep) keep.push(dd);
    const u = typeof a.use === 'function' ? a.use(pr.p || {}) : a.use, spot = u ? { x: q[0] + (pr.flip ? u.y : u.x), y: q[1] + (pr.flip ? u.x : u.y) } : { x: q[0] + w / 2, y: q[1] + d + .6 };
    props.push({ def: pr, d: dd, x: q[0] + w / 2, y: q[1] + d / 2, w, dp: d, h: sz[2], spot }); if (!pr.water) boxes.push([q[0] - .3, q[1] - .3, q[0] + w + .3, q[1] + d + .9]);
  });

  /* spectator spots */
  const spots = [], okSpot = (x, y) => { if (world.isBlocked(x, y) || BADG.has(world.tileType(x, y))) return false; for (const b of boxes) if (x > b[0] && x < b[2] && y > b[1] && y < b[3]) return false; return true; };
  if (!water) route.segs.forEach((g, gi) => { const half = gi > 0 && ev.route.half2 ? ev.route.half2 : ev.route.half;
    for (const side of [-1, 1]) for (let row = 0; row < 2; row++) for (let s = .6 + row * .3; s < g.len - .4; s += TUNE.spectStep) {
      if (R() < .12 + row * .25) continue; const lat = side * (half + .42 + row * .58 + R() * .12), t = s + (R() - .5) * .2, x = g.x0 + g.ux * t - g.uy * lat, y = g.y0 + g.uy * t + g.ux * lat; if (!okSpot(x, y)) continue;
      const fxx = g.uy * side, fyy = -g.ux * side; spots.push({ x, y, dir: Math.abs(fxx) > Math.abs(fyy) ? (fxx > 0 ? 0 : 2) : (fyy > 0 ? 1 : 3), s: g.s0 + t, h: R(), c: null, row, mood: null, kid: row === 0 && R() < .22 }); } });
  for (const wl of ev.watch || []) { const dx = wl.b[0] - wl.a[0], dy = wl.b[1] - wl.a[1], len = Math.hypot(dx, dy), st = wl.step || TUNE.spectStep, bx = [1, 0, -1, 0][wl.face], by = [0, 1, 0, -1][wl.face];
    for (let row = 0; row < (wl.rows || 1); row++) for (let s = row * .3; s <= len; s += st) { if (R() < .1 + row * .2) continue; const x = wl.a[0] + dx / len * s - bx * row * .6 + (R() - .5) * .15, y = wl.a[1] + dy / len * s - by * row * .6 + (R() - .5) * .15; if (!okSpot(x, y)) continue;
      spots.push({ x, y, dir: wl.face, s: -1, h: R(), c: null, row, mood: wl.mood || null, kid: R() < .15, always: !!wl.mood }); } }

  /* the parade line-up: elements with an offset behind the head */
  const els = [], actors = []; let cur = 0, mi = 0;
  const mar = (look, i, an) => { const m = new Mar(); m.dress(look, i); m.an = an || 'walk'; actors.push(m); return m; };
  for (const un of ev.lineup || []) {
    if (un.t === 'float' || un.t === 'boat') { const a = ASSETS.get(un.a); if (!a) continue; const f = new Flt(); f.set(a, {}); actors.push(f); const el = { k: 'float', e: f, o: cur + f.len / 2, lat: 0, water, ride: !!un.ride, bob: R() * 6 }; els.push(el);
      for (const rd of a.riders || []) { const m = mar(rd.outfit === 'santa' ? 'santa' : rd.outfit === 'farmer' ? 'farmer' : a.id === 'float.blossom.throne' ? 'queen' : a.id === 'float.lantern.drum' ? 'drummer' : 'rider', mi++, rd.anim || 'wave'); m.seated = !!rd.seated; els.push({ k: 'rider', e: m, par: el, du: rd.u - f.len / 2, dl: rd.y - f.wid / 2, dz: rd.z, rdir: rd.dir }); }
      if (un.ride) el.seat = a.seat; cur += f.len + (un.hitch ? .45 : un.t === 'boat' ? 4.5 : TUNE.gap); }
    else if (un.t === 'band' || un.t === 'walk') { const cols = un.cols || 2, rows = un.rows || 3, sp = un.look.startsWith('banner') ? 2.2 : .9; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) els.push({ k: 'mar', e: mar(un.look, mi++, un.anim), o: cur + .4 + r * 1.15, lat: (c - (cols - 1) / 2) * sp }); cur += rows * 1.15 + TUNE.gap; }
    else if (un.t === 'dragon') { const n = un.segs || 7; for (let i = 0; i < n + 2; i++) { const f = new Flt(); f.set(ASSETS.get('prop.lantern.dragon'), { part: i === 0 ? 'head' : i === n + 1 ? 'tail' : 'body', i }); f.hop = 0; actors.push(f); els.push({ k: 'dragon', e: f, o: cur + .8 + i * .95, lat: 0, i }); els.push({ k: 'mar', e: mar('bearer', mi++), o: cur + .8 + i * .95 + .02, lat: 0, wave: i }); } cur += (n + 2) * .95 + TUNE.gap; }
  }
  const total = cur, passes = ev.route.loop || 1, cycle = route.len + total + 3;

  /* spectators: a pool of citizens moved to the spots around the screen */
  const cits = []; let nCit = 0, tWin = 0, tSay = 4;
  const placed = [], byDecor = new Map(); let level = 0, inScene = false;
  const onScr = (x, y, m) => { const sx = (x - y) * U - G.cam.x, sy = (x + y) * U / 2 - world.heightAt(x, y) * U - G.cam.y; return sx > -m && sx < G.W + m && sy > -m && sy < G.H + m + 30; };
  const putOb = d => { if (byDecor.has(d)) return; let ob = null; try { ob = world.place(d.a, d.x, d.y, { p: Object.assign({}, d.p), flip: d.flip, solid: false, z: d.z }); } catch (e) { console.warn('cityevents: place failed', d.a, e.message); } if (ob) { ob.noFade = /bunting|arch|banner/.test(d.a); ob.cev = ev.id; placed.push(ob); byDecor.set(d, ob); } };
  const takeOb = d => { const ob = byDecor.get(d); if (!ob) return; world.remove(ob); const i = placed.indexOf(ob); if (i >= 0) placed.splice(i, 1); byDecor.delete(d); };
  const freeCit = sp => { const c = sp.c; if (!c) return; sp.c = null; c.hidden = true; c.active = false; if (c.spec && c.spec._n > 0) c.spec._n--; nCit--; };
  function actorsIn(on) { if (on === inScene) return; inScene = on; const E = city.ents; if (on) { for (const a of actors) { a.hidden = true; E.push(a); } } else { for (const a of actors) { const i = E.indexOf(a); if (i >= 0) E.splice(i, 1); } for (const c of cits) { const i = E.indexOf(c); if (i >= 0) E.splice(i, 1); } for (const sp of spots) sp.c = null; cits.length = 0; nCit = 0; } }

  const S = {
    ev, route, len: route.len, total, cycle, passes, spots, els, actors, placed, stalls, props, edges, water, get level() { return level; }, get spectators() { return nCit; },
    setLevel(n, keepOn) {
      for (let l = 1; l <= 3; l++) for (const d of decor[l]) { const want = l <= n || (keepOn && d.keepDays && keep.includes(d)); if (want) putOb(d); else takeOb(d); }
      actorsIn(n >= 3); level = n; if (n < 3) for (const el of els) el.e.hidden = true;
    },
    propOb(i) { const pr = typeof i === 'number' ? props[i] : props.find(q => q && q.def.id === i); return pr ? byDecor.get(pr.d) || null : null; },
    prop(i) { return typeof i === 'number' ? props[i] : props.find(q => q && q.def.id === i); },
    setProp(i, p) { const pr = S.prop(i); if (!pr) return; Object.assign(pr.d.p, p); const ob = byDecor.get(pr.d); if (ob) { ob.p = Object.assign({}, ob.p, p); ob._key = undefined; } },
    near(x, y) { let b = Math.hypot(x - ev.site.x, y - ev.site.y); for (const g of route.segs) { const t = Math.max(0, Math.min(g.len, (x - g.x0) * g.ux + (y - g.y0) * g.uy)), d = Math.hypot(x - g.x0 - g.ux * t, y - g.y0 - g.uy * t); if (d < b) b = d; } return b; },
    /** world position of line-up element el at parade progress u (null when it is not on the route) */
    elPos(el, u, out) { const s = (u % cycle) - el.o; if (u < 0 || u >= cycle * passes || s < 0 || s > route.len) return null; return route.at(s, el.lat, out); },
    update(dt, o) {
      const u = o.u, T = o.t;
      /* parade */
      if (level >= 3) for (const el of els) {
        const e = el.e; if (el.k === 'rider') { const p = el.par.e; if (p.hidden) { e.hidden = true; continue; } const ax = p.ax, d = p.d; e.hidden = false; e.alpha = p.alpha;
          if (ax === 'x') { e.x = p.x + el.du * d + .01; e.y = p.y + el.dl + .01; } else { e.x = p.x + el.dl + .01; e.y = p.y + el.du * d + .01; } e.z = p.z + el.dz; e.dir = el.rdir !== undefined ? (ax === 'x' ? el.rdir : (el.rdir + 3) % 4) : (ax === 'x' ? 1 : 0); e.t += dt; e.bb = RB; continue; }
        const q = u < 0 ? null : S.elPos(el, u, tmp); if (!q) { e.hidden = true; continue; }
        const s = (u % cycle) - el.o, fade = Math.min(1, s / 1.5, (route.len - s) / 1.5); e.hidden = false; e.alpha = fade < 1 ? Math.max(.05, fade) : undefined;
        if (el.k === 'mar') { let lx = 0; if (el.wave !== undefined) lx = Math.sin(s * .55 + el.wave * .0) * .55; e.x = q.x - (q.ax === 'y' ? lx : 0); e.y = q.y + (q.ax === 'x' ? lx : 0); e.z = world.heightAt(e.x, e.y); e.dir = q.ax === 'x' ? (q.d > 0 ? 0 : 2) : (q.d > 0 ? 1 : 3); e.t += dt; }
        else { let lx = 0; if (el.k === 'dragon') { lx = Math.sin(s * .55) * .55; e.hop = Math.floor(T * 5 + el.i * .9) & 3; } e.x = q.x - (q.ax === 'y' ? lx : 0); e.y = q.y + (q.ax === 'x' ? lx : 0); e.face(q.ax, q.d); e.z = el.water ? world.heightAt(e.x, e.y) + Math.sin(T * 1.6 + el.bob) * .04 : world.heightAt(e.x, e.y); }
      }
      /* spectators */
      if (level < 3) return;
      if ((tWin -= dt) <= 0) { tWin = .4; const dens = o.dens;
        for (const sp of spots) { const want = sp.h < (sp.always ? Math.max(dens, o.densA || 0) : dens) && onScr(sp.x, sp.y, 70);
          if (want && !sp.c && nCit < TUNE.spectMax) { let c = cits.find(q => !q.active); if (!c) { c = new Cit(); c.isEventActor = true; cits.push(c); city.ents.push(c); } c.clear(); c.active = true; c.hidden = false; c.alpha = onScr(sp.x, sp.y, -4) ? 0 : 1; c.named = true;
            const sp0 = getSpec(ev.district, null, sp.kid ? 'kid' : null); c.setSpec(sp0); sp0._n++; c.district = ev.district; c.x = sp.x; c.y = sp.y; c.z = world.heightAt(sp.x, sp.y); c.dir = sp.dir; c.t = sp.h * 10; c.pose = sp.mood === 'dance' ? 'dance' : null; c.nx = T + sp.h * 4; sp.c = c; nCit++; }
          else if (!want && sp.c) freeCit(sp); }
      }
      if ((tSay -= dt) <= 0) { tSay = 6 + Math.random() * 5; const on = spots.filter(sp => sp.c && sp.c.alpha >= 1 && onScr(sp.x, sp.y, -30)); if (on.length) { const c = on[(Math.random() * on.length) | 0].c; try { speak(c, ambientLine(c, { eventId: ev.lines, event: ev.lines })); } catch (e) { /* lines are optional */ } } }
      const hs = u < 0 ? -99 : (u % cycle), ts = hs - total;   /* route span the parade covers right now */
      for (const sp of spots) { const c = sp.c; if (!c) continue; c.t += dt; if (c.alpha < 1) c.alpha = Math.min(1, c.alpha + dt * 2);
        if (sp.mood === 'dance') continue;
        if (T > c.nx) { c.nx = T + 1.2 + sp.h * 2.5; const hot = o.cheer || (sp.s >= 0 && sp.s > ts - 3 && sp.s < hs + 5); c.pose = hot ? (Math.random() < .5 ? 'cheer' : Math.random() < .6 ? 'wave' : null) : (Math.random() < .12 ? 'talk' : Math.random() < .06 ? 'phone' : null); } }
    },
  };
  return S;
}
const RB = [.28, .28, .68, .68, 1.4];   /* riders sort in front of the float they stand on */
