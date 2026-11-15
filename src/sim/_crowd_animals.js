// Ambient animals for the crowd system: pigeons (scatter), seagulls (perch / circle), ducks (swim / waddle), squirrels (dart), cats, leashed dogs.
// Animals live in "habitats" (points with a radius) that switch on when near the camera. Flying birds get a ground shadow via G.underlays.
import { G } from '../core/game.js';
import { pixSprite, prebakePix } from '../engine/sprites.js';
import { U } from '../engine/raster.js';
import { GT } from '../engine/world.js';
import { stepToward } from '../engine/nav.js';
import { MODULES } from '../art/registry.js';
import { X, rnd, ri, rr, onScreen, okCell, dirOf } from './_crowd_core.js';

const CAP = 34, AFPS = { stand: 1.1, walk: 7, sit: .6, fly: 9, swim: 2 }, AIX = { stand: 0, walk: 1, sit: 2, fly: 3, swim: 4 };
const IDLE = 0, MOVE = 1, FLY = 2, CIRCLE = 3, SWIM = 4, LEASH = 5;
let ART = null; const art = () => ART || (ART = MODULES['./chars/animals.js'] || { ANIMAL_SB: [-12, -16, 12, 5], drawAnimal() { } });
class Ani {
  constructor() { this.isAnimal = true; this.active = false; this.hidden = true; this.x = 0; this.y = 0; this.z = 0; this.bb = [-.15, -.15, .15, .15, .4]; this.kind = 'pigeon'; this.variant = 0; this.anim = 'stand'; this.dir = 0; this.t = rnd() * 9; this.st = IDLE; this.tx = 0; this.ty = 0; this.sx = 0; this.sy = 0; this.wait = 0; this.k = 0; this.dur = 1; this.alt = 0; this.gz = 0; this.hab = null; this.owner = null; this.spd = 1; this.ang = 0; this.rad = 3; this.air = false; this._sk = -1; this._spr = null; }
  sprite() {
    const A = art(), f = Math.floor(this.t * (AFPS[this.anim] || 2)) & 1 ? 1 : 0, f2 = this.anim === 'walk' && (this.kind === 'cat' || this.kind === 'dog') ? Math.floor(this.t * 7) % 4 : f, k = AIX[this.anim] * 64 + f2 * 8 + this.dir;
    if (k === this._sk && this._spr) return this._spr; this._sk = k; const kind = this.kind, anim = this.anim, dir = this.dir, variant = this.variant;
    return this._spr = pixSprite('an' + kind + variant + anim + f2 + dir, A.ANIMAL_SB, () => A.drawAnimal(kind, { anim, frame: f2, dir, variant }));
  }
  /* performance report (QA13): bake the current frame ahead, same key and drawing as sprite() */
  prebake(pri) {
    const A = art(), f = Math.floor(this.t * (AFPS[this.anim] || 2)) & 1 ? 1 : 0, f2 = this.anim === 'walk' && (this.kind === 'cat' || this.kind === 'dog') ? Math.floor(this.t * 7) % 4 : f, kind = this.kind, anim = this.anim, dir = this.dir, variant = this.variant;
    prebakePix('an' + kind + variant + anim + f2 + dir, A.ANIMAL_SB, () => A.drawAnimal(kind, { anim, frame: f2, dir, variant }), pri);
  }
}
const pool = [], HAB = []; let world = null, tick = 0, nAct = 0;
const VARS = { cat: 6, dog: 6, pigeon: 3, seagull: 1, duck: 2, squirrel: 2 };
const isWater = (x, y) => { const t = world.tileType(x, y); return t === GT.water || t === GT.deepwater; };
const SOFT = new Set([GT.grass, GT.park, GT.lawn, GT.dirt, GT.soil, GT.sand]);
const softCell = (x, y) => !world.isBlocked(x, y) && SOFT.has(world.tileType(x, y));

function alloc(kind) { for (const a of pool) if (!a.active) { a.active = true; a.hidden = false; a.kind = kind; a.variant = ri(VARS[kind] || 1); a.st = IDLE; a.anim = 'stand'; a.wait = rnd() * 3; a.owner = null; a.hab = null; a.air = false; a.alpha = 1; a._sk = -1; nAct++; return a; } return null; }
function free(a) { if (!a.active) return; a.active = false; a.hidden = true; a.owner = null; a.hab = null; nAct--; }
const place = (a, x, y) => { a.x = x; a.y = y; a.gz = a.z = world.heightAt(x, y); };

function habitats(net) {
  const add = (kind, x, y, r, n, mode) => HAB.push({ kind, x, y, r, n, mode: mode || '', on: false, list: [] });
  for (const k of net.W) {
    const cx = (k.x0 + k.x1) / 2, cy = (k.y0 + k.y1) / 2;
    if (k.kind === 'plaza') { add('pigeon', cx - 3, cy, 3.5, 5); add('pigeon', cx + 4, cy + 2, 3, 4); }
    else if (k.kind === 'promenade') for (let t = 10; t < k.len - 6; t += 26) add('pigeon', k.axis === 'x' ? k.x0 + t : cx, k.axis === 'x' ? cy : k.y0 + t, 3, 3 + (t % 3));
    else if (k.kind === 'boardwalk' || k.kind === 'pier') for (let t = 6; t < k.len; t += 17) { const x = k.axis === 'x' ? k.x0 + t : cx, y = k.axis === 'x' ? cy : k.y0 + t; add('seagull', x, y, 3, 2); if ((t / 17 | 0) % 2 === 0) add('seagull', x, y + 1, 4.5, 1, 'circle'); }
    else if (k.kind === 'lane') add('cat', cx, cy, 3, 2);
  }
  for (const p of world.pois) {
    if (p.type === 'spot') {
      if (p.kind === 'busker' || p.kind === 'chess') add('pigeon', p.x + 2, p.y + 2, 2.5, 3); else if (p.kind === 'cats') add('cat', p.x, p.y, 2.5, 3); else if (p.kind === 'duckpond') add('duck', p.x, p.y, 2.5, 3, 'land');
      else if (p.kind === 'fishing' || p.kind === 'beach') { add('seagull', p.x, p.y, 3, 2); add('seagull', p.x, p.y, 5, 1, 'circle'); } else if (p.kind === 'picnic') add('dog', p.x + 1.5, p.y + 1, 1.5, 1);
    } else if (p.type === 'stall') add('pigeon', p.x + 2, p.y + 2.5, 2.5, 3);
    else if (p.type === 'landmark' && /Lighthouse/.test(p.name || '')) add('seagull', p.x, p.y, 5, 2, 'circle');
    else if (p.type === 'door' && /^door:home:/.test(p.id) && (p.x * 7 + p.y * 3 | 0) % 3 === 0) add('cat', p.x + 1.2, p.y + .8, 1.5, 1);
  }
  // water: Central Park pond + river
  const pond = world.pois.find(p => /Duck Pond/.test(p.name || '') && p.type === 'landmark'); if (pond && isWater(pond.x, pond.y)) add('duck', pond.x, pond.y, 6, 5, 'swim');
  for (let y = 124; y < 330; y += 24) for (const x of [153.5, 156, 158.5]) if (isWater(x, y)) { add('duck', x, y, 4, 2 + (y % 2), 'swim'); break; }
  // squirrels on soft ground in parks
  for (let y = 132; y < 192; y += 15) for (let x = 62; x < 138; x += 19) { const sx = x + (y % 7), sy = y + (x % 5); if (softCell(sx, sy)) add('squirrel', sx, sy, 5, 1 + ((x + y) % 2)); }
  for (const p of world.pois) if (p.type === 'landmark' && /Maplewood Park|Campus Green/.test(p.name || '')) add('squirrel', p.x + 2, p.y + 2, 5, 2);
}
function spotIn(h, a, soft) { for (let k = 0; k < 8; k++) { const an = rnd() * 6.283, r = Math.sqrt(rnd()) * h.r, x = h.x + Math.cos(an) * r, y = h.y + Math.sin(an) * r; if (h.mode === 'swim' ? isWater(x, y) && isWater(x + .6, y) && isWater(x, y + .6) && isWater(x - .6, y - .6) : soft ? softCell(x, y) : okCell(x, y)) { a.tx = x; a.ty = y; return true; } } return false; }
function wake(h) {
  const dayBird = h.kind === 'pigeon' || h.kind === 'seagull' || h.kind === 'squirrel'; let n = h.n;
  if (dayBird && (X.hour < 5.5 || X.hour > 20.5)) n = 0; if (X.wet && h.kind !== 'duck') n = h.kind === 'cat' ? 0 : Math.min(n, 1); if (h.kind === 'squirrel' && X.season === 3) n = Math.min(n, 1); if (h.kind === 'cat' && X.night) n++;
  h.on = true;
  for (let i = 0; i < n && nAct < CAP; i++) {
    const a = alloc(h.kind); if (!a) break; a.hab = h; h.list.push(a);
    if (h.mode === 'circle') { a.st = CIRCLE; a.ang = rnd() * 6.283; a.rad = h.r * rr(.7, 1.1); a.alt = rr(4, 6.5); a.spd = rr(.5, .8) * (rnd() < .5 ? 1 : -1); a.anim = 'fly'; a.air = true; place(a, h.x, h.y); continue; }
    if (!spotIn(h, a, h.kind === 'squirrel')) { free(a); h.list.pop(); continue; } place(a, a.tx, a.ty); a.dir = ri(4);
    if (h.mode === 'swim') { a.st = SWIM; a.anim = 'swim'; a.wait = rnd() * 4; } else if (h.kind === 'cat' || h.kind === 'dog') a.anim = 'sit';
  }
}
function sleep(h) { h.on = false; for (const a of h.list) free(a); h.list.length = 0; }
/** a dog on an invisible leash; returns the animal or null */
export function leash(owner) { const a = alloc('dog'); if (!a) return null; a.owner = owner; a.st = LEASH; place(a, owner.x + .5, owner.y + .3); a.wait = 0; return a; }
export function animalCount() { return nAct; }
export function clearAnimals() { for (const h of HAB) if (h.on) sleep(h); for (const a of pool) free(a); }

function takeOff(a, fromX, fromY) {
  const h = a.hab; let ok = false; for (let k = 0; k < 6 && !ok; k++) { ok = spotIn(h, a, false) && Math.hypot(a.tx - fromX, a.ty - fromY) > 2.2; } if (!ok) { a.tx = a.x + (a.x - fromX) * 2 + rr(-1, 1); a.ty = a.y + (a.y - fromY) * 2 + rr(-1, 1); if (!okCell(a.tx, a.ty)) { a.tx = h.x; a.ty = h.y; } }
  a.sx = a.x; a.sy = a.y; a.k = 0; a.dur = 1.3 + Math.hypot(a.tx - a.x, a.ty - a.y) / 4 + rnd() * .6; a.alt = rr(2, 3.6); a.st = FLY; a.anim = 'fly'; a.air = true; a.dir = dirOf(a.tx - a.x, a.ty - a.y);
}
function threat(a, r) { // returns 1 if the player or a moving citizen is within r
  if (X.playerOk) { const dx = X.px - a.x, dy = X.py - a.y; if (dx * dx + dy * dy < r * r * 1.3) { a.sx = X.px; a.sy = X.py; return 2; } }
  const C = X.cits, r2 = r * r * .45; for (let i = 0; i < C.length; i++) { const c = C[i]; if (!c.active || !c.moving) continue; const dx = c.x - a.x, dy = c.y - a.y; if (dx * dx + dy * dy < r2) { a.sx = c.x; a.sy = c.y; return 1; } } return 0;
}
function step(a, dt) {
  a.t += dt; const h = a.hab;
  switch (a.st) {
    case IDLE: {
      a.wait -= dt; if (a.wait > 0) break; a.wait = .25;
      const k = a.kind;
      if (k === 'pigeon' || k === 'seagull') { if (threat(a, 1.9)) { const fx = a.sx, fy = a.sy; for (const b of h.list) if (b.st <= MOVE && Math.hypot(b.x - a.x, b.y - a.y) < 2.6) takeOff(b, fx, fy); break; } if (rnd() < .12) { if (spotIn(h, a, false) && Math.hypot(a.tx - a.x, a.ty - a.y) < 2) { a.st = MOVE; a.spd = .9; a.anim = 'walk'; } } else a.anim = 'stand'; }
      else if (k === 'squirrel') { const t = threat(a, 2.4); if (t || rnd() < .1) { if (spotIn(h, a, true)) { a.st = MOVE; a.spd = t ? 6 : 4.2; a.anim = 'walk'; } } else if (rnd() < .2) a.dir = ri(4); }
      else if (k === 'cat') { if (X.playerOk && X.pmove && Math.hypot(X.px - a.x, X.py - a.y) < 2.3) { const dx = a.x - X.px, dy = a.y - X.py, d = Math.hypot(dx, dy) || 1; a.tx = a.x + dx / d * 4; a.ty = a.y + dy / d * 4; if (!okCell(a.tx, a.ty)) { a.tx = a.x - dy / d * 3; a.ty = a.y + dx / d * 3; } if (okCell(a.tx, a.ty)) { a.st = MOVE; a.spd = 2.8; a.anim = 'walk'; } } else if (rnd() < .012 && spotIn(h, a, false)) { a.st = MOVE; a.spd = 1.1; a.anim = 'walk'; } else if (rnd() < .02) a.anim = a.anim === 'sit' ? 'stand' : 'sit'; }
      else if (k === 'duck') { const t = threat(a, 1.5); if ((t || rnd() < .06) && spotIn(h, a, false)) { a.st = MOVE; a.spd = t ? 1.8 : .7; a.anim = 'walk'; } }
      else if (k === 'dog') { if (rnd() < .02) a.anim = a.anim === 'sit' ? 'stand' : 'sit'; }
      break;
    }
    case MOVE: { const ox = a.x, oy = a.y, m = stepToward(world, a, a.tx, a.ty, a.spd * dt); if (m < 1e-4 || !okCell(a.x, a.y)) { if (m >= 1e-4) { a.x = ox; a.y = oy; } a.st = IDLE; a.anim = a.kind === 'cat' ? 'sit' : 'stand'; a.wait = rr(.5, 3); break; } a.dir = dirOf(a.x - ox, a.y - oy); a.gz = a.z = world.heightAt(a.x, a.y); break; }
    case FLY: { a.k += dt / a.dur; if (a.k >= 1) { place(a, a.tx, a.ty); a.st = IDLE; a.anim = 'stand'; a.air = false; a.wait = rr(1.5, 4); break; } const k = a.k, e = k * k * (3 - 2 * k); a.x = a.sx + (a.tx - a.sx) * e; a.y = a.sy + (a.ty - a.sy) * e; a.gz = world.heightAt(a.x, a.y); a.z = a.gz + Math.sin(k * 3.1416) * a.alt; break; }
    case CIRCLE: { a.ang += a.spd * dt; const c = Math.cos(a.ang), s = Math.sin(a.ang); a.x = h.x + c * a.rad; a.y = h.y + s * a.rad * .8; a.gz = world.heightAt(a.x, a.y); a.z = world.heightAt(h.x, h.y) + a.alt + Math.sin(a.ang * 2.3) * .6; a.dir = dirOf(-s * a.spd, c * a.spd); break; }
    case SWIM: { a.wait -= dt; if (a.wait <= 0) { a.wait = rr(2, 7); spotIn(h, a, false); } const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy); if (d > .1) { const s = Math.min(d, .55 * dt), nx = a.x + dx / d * s, ny = a.y + dy / d * s; if (isWater(nx, ny)) { a.x = nx; a.y = ny; a.dir = dirOf(dx, dy); } else a.wait = 0; } a.z = world.heightAt(a.x, a.y); break; }
    case LEASH: {
      const o = a.owner; if (!o || !o.active || o.pet !== a) { free(a); break; }
      const lx = o.dir === 0 || o.dir === 2 ? 0 : .55 * o.side, ly = o.dir === 0 || o.dir === 2 ? .55 * o.side : 0, ax = o.dir === 0 ? .6 : o.dir === 2 ? -.6 : 0, ay = o.dir === 1 ? .6 : o.dir === 3 ? -.6 : 0, tx = o.x + lx + (o.moving ? ax : 0), ty = o.y + ly + (o.moving ? ay : 0), dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
      a.alpha = o.alpha; if (d > 5) { a.x = o.x; a.y = o.y; }
      else if (d > (a.anim === 'walk' ? .12 : .45)) { const s = Math.min(d, (o.spd * 1.35 + .4) * dt); a.x += dx / d * s; a.y += dy / d * s; a.dir = dirOf(dx, dy); a.anim = 'walk'; a.wait = 0; }
      else { a.wait += dt; a.anim = a.wait > 1.6 ? 'sit' : 'stand'; }
      a.gz = a.z = world.heightAt(a.x, a.y); break;
    }
  }
}

export function initAnimals(scene, net) {
  world = scene.world; habitats(net);
  for (let i = 0; i < CAP; i++) { const a = new Ani(); pool.push(a); scene.ents.push(a); }
  G.underlays.push((ctx, cam) => { // shadows of birds in the air
    if (G.scene !== scene) return; ctx.fillStyle = 'rgba(42,31,69,.3)';
    for (let i = 0; i < pool.length; i++) { const a = pool[i]; if (!a.active || !a.air) continue; const sx = Math.round((a.x - a.y) * U) - cam.x, sy = Math.round((a.x + a.y) * U / 2 - a.gz * U) - cam.y; if (sx < -4 || sy < -4 || sx > G.W + 4 || sy > G.H + 4) continue; ctx.fillRect(sx - 2, sy, 5, 1); ctx.fillRect(sx - 1, sy - 1, 3, 1); ctx.fillRect(sx - 1, sy + 1, 3, 1); }
  });
}
export function updateAnimals(dt) {
  for (let i = 0; i < pool.length; i++) { const a = pool[i]; if (a.active) step(a, dt); }
  if ((tick -= dt) > 0) return; tick = .5;
  for (let i = 0; i < HAB.length; i++) { const h = HAB[i], m = h.r * U; if (!h.on) { if (onScreen(h.x, h.y, 60 + m)) wake(h); } else if (!onScreen(h.x, h.y, 150 + m)) sleep(h); }
}
