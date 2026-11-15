// Maple Bay Aquarium — more animals and effects (registers extra species into aquarium_life.js at import time).
//   Sprites: parrotfish, blacktip reef shark, hammerhead, manta, mola (ocean sunfish), moray, lionfish, pufferfish (+ inflated), cleaner shrimp, cuttlefish (3 colours), nautilus, giant spider crab, firefly squid,
//            turtle hatchling, and four turtles: 'turtle' green, 'logger' loggerhead, 'hawks' hawksbill, 'leather' leatherback.
//   Turtle (a Swimmer with a mind: glide / surface to breathe / rest on the sand / come to the glass / follow food / sleep)      caustics(o) rippling light on a floor      DiverEnt (3D diver with lettuce)
import { SP, PAINT, Swimmer, iso, paint, ell, spr, flipC, diverBase, INK, rnd } from './aquarium_life.js';

Object.assign(SP, {
  parrot: { L: 11, H: 3, back: '#3fb8a0', belly: '#f29ac0', fin: '#3a80d0', tail: 'fork', dorsal: 1 },
  blacktip: { L: 20, H: 3, back: '#a09a8c', belly: '#f0ece0', fin: '#2a2a30', tail: 'shark', dorsal: 4, pect: 1 },
  hammerhead: { L: 26, H: 3, back: '#8a8478', belly: '#e8e4d8', fin: '#6a665c', tail: 'shark', dorsal: 7, pect: 1, hammer: 1 },
});
const moray = f => paint(18, 9, set => { for (let i = 0; i < 12; i++) set(i, 4 + Math.round(Math.sin(i / 2.4 + f * .8) * 1.2), i % 3 ? '#8a9a3a' : '#5a6a24', 1, 3); ell(set, 13, 4, 3.5, 3, '#9aaa44'); set(15, 3, INK); set(14, 6, '#3a2a20', 4, 1 + f); set(16, 6, '#f4f0e8'); set(12, 1, '#5a6a24', 3, 1); });
const lionfish = f => paint(20, 18, set => { for (let k = -4; k <= 4; k++) { const an = -Math.PI / 2 + k * .32, L = 8 - Math.abs(k) * .5 + (f && k % 2 ? 1 : 0); for (let j = 2; j < L; j++) set(9 + Math.cos(an) * j, 9 + Math.sin(an) * j, j % 2 ? '#f4e8d8' : '#b8402a'); } for (let k = -2; k <= 2; k++) { const an = Math.PI / 2 + k * .4, L = 6 + (f ? 0 : 1); for (let j = 2; j < L; j++) set(8 + Math.cos(an) * j, 10 + Math.sin(an) * j, j % 2 ? '#f4e8d8' : '#b8402a'); }
  for (let i = 0; i < 11; i++) { const h = 3 * Math.sin(Math.PI * Math.min(1, i / 10 + .08)); for (let y = -Math.round(h); y <= Math.round(h); y++) set(4 + i, 9 + y, i % 2 ? '#f4e8d8' : '#b8402a'); } set(1, 8 + f, '#b8402a', 3, 3); set(2, 9 + f, '#f4e8d8'); set(13, 8, INK); set(15, 10, '#f4e8d8', 2, 1); });
const puffer = f => paint(12, 9, set => { ell(set, 6, 4, 4, 3, '#d8c060'); ell(set, 6, 6, 3, 1.4, '#f4ecc8'); for (const [x, y] of [[4, 2], [6, 3], [8, 2], [5, 4]]) set(x, y, '#7a6a2a'); set(9, 3, INK); set(10, 5, '#f4ecc8'); set(0, 3 + f, '#b8a040', 2, 2); set(6, 0 + f, '#b8a040', 2, 1); });
const pufferB = f => paint(17, 17, set => { ell(set, 8, 8, 6, 6, '#d8c060'); ell(set, 8, 10, 5, 3.5, '#f4ecc8'); for (let a = 0; a < 14; a++) { const an = a / 14 * 6.283, r = 7 + (f ? .6 : 0); set(8 + Math.cos(an) * r, 8 + Math.sin(an) * r, '#f4ecc8'); set(8 + Math.cos(an) * (r + 1), 8 + Math.sin(an) * (r + 1), '#b8a040'); } for (const [x, y] of [[5, 5], [8, 4], [11, 5], [6, 7], [10, 7]]) set(x, y, '#7a6a2a'); set(12, 6, INK); set(13, 6, '#ffffff'); set(13, 9, '#3a2a20', 2, 1); });
const shrimp = f => paint(8, 5, set => { set(1, 2, '#e8483b', 5, 2); set(2, 2, '#f4f0e8'); set(4, 2, '#f4f0e8'); set(6, 1, '#e8483b'); set(7, 0 + f, '#f4f0e8'); set(0, 3, '#e8483b'); set(2, 4, '#f4b0a0'); set(4, 4, '#f4b0a0'); });
const cuttle = c => f => paint(18, 10, set => { ell(set, 8, 5, 6, 3, c[0]); for (let x = 2; x < 15; x++) set(x, 5 + (((x + f) % 3) ? 4 : 3), c[1]); for (let x = 3; x < 13; x += 2) set(x + (f ? 1 : 0), 3, c[1], 1, 2); ell(set, 14, 5, 2, 2, c[0]); set(14, 4, '#f4f0e8'); set(15, 4, INK); for (let k = 0; k < 3; k++) set(16, 4 + k, c[1], 2 - (k & 1) + f, 1); });
const nautilus = f => paint(14, 12, set => { ell(set, 6, 5, 5, 4.5, '#f4ecd8'); for (let a = 0; a < 7; a++) { const an = -2.6 + a * .5; for (let j = 1; j < 5; j++) set(6 + Math.cos(an) * j, 5 + Math.sin(an) * j, '#b8502a'); } ell(set, 7, 6, 1.5, 1.5, '#d8c8a8'); ell(set, 10, 8, 2, 1.6, '#e8d8c0'); set(10, 7, INK); for (let k = 0; k < 4; k++) set(11 + (k & 1) + f, 9 + (k >> 1), '#f4e8d8', 2, 1); });
const spidercrab = f => paint(26, 14, set => { for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { const kx = 13 + sd * (4 + k * 2.4), up = 3 + k * .6 + ((k + f) & 1); for (let j = 0; j < 5; j++) set(13 + sd * (2 + j * (2 + k * 2.4) / 5), 6 - j * up / 5, '#c85a2a'); for (let j = 0; j < 8 - k; j++) set(kx + sd * j * .5, 6 - up + j * 1.3, j % 3 ? '#e87a3a' : '#f4d8c0'); } ell(set, 13, 7, 3.5, 3, '#c85a2a'); ell(set, 13, 6, 2, 1.4, '#e87a3a'); set(12, 5, INK); set(14, 5, INK); });
const firefly = f => paint(8, 4, set => { set(1, 1, '#3a2a5a', 5, 2); set(0, 1 + f, '#3a2a5a'); set(6, 1, '#5a4a8a', 2, 1); set(6, 2 + f, '#5a4a8a', 2, 1); set(2, 1, '#58e0ff'); set(4, 2, '#58e0ff'); set(5, 1, '#bff8ff'); });
const hatch = f => paint(8, 6, set => { ell(set, 4, 3, 2, 1.6, '#3f5a44'); set(4, 2, '#6a8a5a'); set(6, 3, '#5a7a54', 2, 1); set(7, 3, INK); set(2, f ? 0 : 5, '#5a7a54', 2, 1); set(4, f ? 5 : 0, '#5a7a54', 2, 1); set(0, 3, '#5a7a54'); });
const manta = f => paint(44, 21, set => { const cx = 24, cy = 10; for (let x = -15; x <= 15; x++) { const h = Math.round((15 - Math.abs(x)) * .5 + (Math.abs(x) < 5 ? 2 : 0)), lift = Math.abs(x) > 7 ? (f ? -2 : 2) * (Math.abs(x) - 7) / 8 : 0; for (let y = -h; y <= h; y++) set(cx + x, cy + y + lift, y < -h * .2 ? '#2a3038' : '#3a424c'); } for (const sd of [-1, 1]) { set(cx + 13, cy + sd * 3, '#2a3038', 4, 2); set(cx + 6, cy + sd * 4, '#e8ecee', 3, 1); set(cx + 12, cy + sd * 2, INK); } set(cx + 8, cy - 1, '#e8ecee', 4, 2); for (let i = 0; i < 12; i++) set(cx - 15 - i, cy + (i > 7 ? 1 : 0), '#2a3038'); });
const mola = f => paint(24, 34, set => { const cx = 12, cy = 17; ell(set, cx, cy, 9, 8, '#9aa4ae'); ell(set, cx + 1, cy - 2, 6, 4, '#b4bec8'); for (let j = 0; j < 9; j++) { set(cx - 3 + (f ? 1 : -1) * j / 4, cy - 8 - j, '#7a848e', 5 - j / 2.4, 1); set(cx - 3 - (f ? 1 : -1) * j / 4, cy + 8 + j, '#7a848e', 5 - j / 2.4, 1); } for (let y = -6; y <= 6; y++) set(cx - 10, cy + y, y % 3 ? '#7a848e' : '#c8d0d8', 2, 1); set(cx + 6, cy - 2, INK, 2, 2); set(cx + 9, cy + 1, '#e8ecee', 1, 2); for (const [x, y] of [[-3, 2], [2, 4], [-5, -3], [4, -5]]) set(cx + x, cy + y, '#c8d0d8'); set(cx + 3, cy + 3, '#7a848e', 4, 1); });
const TV = { turtle: { shell: '#5a7a4a', hi: '#7a9a5a', sc: '#3f5a34', skin: '#8aa868', k: 1 }, logger: { shell: '#a8643a', hi: '#c8845a', sc: '#7a4424', skin: '#e0b070', k: 1.25, head: 1.5 }, hawks: { shell: '#c89038', hi: '#e8c060', sc: '#6a4018', skin: '#d8c890', k: .8, beak: 1 }, leather: { shell: '#2c343c', hi: '#46525e', sc: '#8a96a2', skin: '#3a444e', k: 1.9, ridge: 1 } };
const turtleV = v => f => { const k = v.k, W = Math.round(24 * k), H = Math.round(15 * k); return paint(W, H, set => { const cx = Math.round(10 * k), cy = H >> 1, rx = 7 * k, ry = 4 * k, fl = f ? 1 : -1;
  set(cx + 2 * k, cy - ry - 2 * k + fl, v.skin, Math.round(5 * k), Math.max(2, Math.round(2 * k))); set(cx + 3 * k, cy + ry - fl, v.skin, Math.round(5 * k), Math.max(2, Math.round(2 * k))); set(cx - rx, cy - ry, v.skin, Math.round(3 * k), 1); set(cx - rx, cy + ry, v.skin, Math.round(3 * k), 1); set(cx - rx - 2, cy, v.skin, 2, 1);
  ell(set, cx, cy, rx, ry, v.shell); ell(set, cx, cy - 1, rx * .7, ry * .5, v.hi);
  if (v.ridge) { for (let j = -2; j <= 2; j++) for (let x = -rx + 2; x < rx - 1; x += 1) if ((x & 1) === 0 || j === 0) set(cx + x, cy + j * ry * .36, v.sc); } else for (const [x, y] of [[-3, 0], [0, -2], [3, 0], [0, 2], [-5, 1], [5, -1], [2, 2], [-2, -2]]) set(cx + x * k, cy + y * k * .8, v.sc);
  ell(set, cx + rx + 1.6 * k * (v.head || 1), cy, 2 * k * (v.head || 1), 1.4 * k * (v.head || 1), v.skin); set(cx + rx + 2.4 * k * (v.head || 1), cy - 1, INK); if (v.beak) set(cx + rx + 3.6 * k, cy, '#6a4018', 2, 1); }); };
Object.assign(PAINT, { moray, lionfish, puffer, pufferB, shrimp, cuttle: cuttle(['#b8926a', '#8a6a4a']), cuttle2: cuttle(['#d8c8b0', '#f4ecd8']), cuttle3: cuttle(['#7a4a5a', '#c87a8a']), nautilus, spidercrab, firefly, hatchling: hatch, manta, mola, turtle: turtleV(TV.turtle), logger: turtleV(TV.logger), hawks: turtleV(TV.hawks), leather: turtleV(TV.leather) });

/** A turtle with behaviour. o: Swimmer options + { name, surf (surface z), rests: [[x, y]], w: { breathe, rest, visit } seconds between, glass(p) -> [x, y, z] | null } */
export class Turtle extends Swimmer {
  constructor(o) { super(o); Object.assign(this, { name: o.name, surf: o.surf || 3.3, rests: o.rests || [], w: o.w || { breathe: 40, rest: 70, visit: 50 }, glass: o.glass || null }); this.st = 'glide'; this.tb = rnd(.3, 1) * this.w.breathe; this.tr = rnd(.3, 1) * this.w.rest; this.tv = rnd(.3, 1) * this.w.visit; this.hold = 0; this.fr0 = this.fr; this.rip = 0; this.sleep = false; this.food = null; }
  tick(dt, player) {
    if (this.rip > 0) this.rip -= dt;
    if (this.food) { this._tgt = [this.food.x, this.food.y, this.food.z]; this.st = 'food'; this.fr = this.fr0; super.tick(dt); return; } if (this.st === 'food') { this.st = 'glide'; this._tgt = null; }
    if (this.sleep && this.st !== 'rest') { this.st = 'rest'; const r = this.rests[0] || [this.x, this.y]; this._tgt = [r[0], r[1], .14]; this.hold = 1e9; }
    if (!this.sleep && this.st === 'rest' && this.hold > 1e8) this.hold = 2;
    if (this.st === 'glide') { this.fr = this.fr0; this._tgt = null; this.tb -= dt; this.tr -= dt; this.tv -= dt;
      if (this.tb <= 0) { this.st = 'up'; this._tgt = [this.x + this.vx * 2, this.y + this.vy * 2, this.surf]; }
      else if (this.tr <= 0 && this.rests.length) { this.st = 'rest'; const r = this.rests[Math.floor(Math.random() * this.rests.length)]; this._tgt = [r[0], r[1], .14]; this.hold = rnd(10, 22); }
      else if (this.tv <= 0 && this.glass && player) { const g = this.glass(player); this.tv = this.w.visit * rnd(.6, 1.3); if (g) { this.st = 'visit'; this._tgt = g; this.hold = rnd(4, 7); } } }
    else if (this.st === 'up') { if (this.z > this.surf - .2) { this.st = 'breath'; this.hold = 2.6; this.rip = 2.6; } }
    else if (this.st === 'breath') { this._tgt = [this.x, this.y, this.surf]; if ((this.hold -= dt) <= 0) { this.st = 'glide'; this.tb = this.w.breathe * rnd(.7, 1.3); } }
    else if (this.st === 'rest') { const d = Math.hypot(this._tgt[0] - this.x, this._tgt[1] - this.y); if (d < .5 && this.z < .4) { this.fr = 0; if ((this.hold -= dt) <= 0) { this.st = 'glide'; this.tr = this.w.rest * rnd(.7, 1.3); } } }
    else if (this.st === 'visit') { const d = Math.hypot(this._tgt[0] - this.x, this._tgt[1] - this.y); if (d < .6) { this.fr = 1.5; if ((this.hold -= dt) <= 0) this.st = 'glide'; } }
    super.tick(dt);
  }
}
/** 3D diver for the lagoon: swims a small loop holding lettuce. */
export class DiverEnt {
  constructor(x, y, z) { this.cx = x; this.cy = y; this.x = x; this.y = y; this.z = z; this.t = 0; this.hidden = true; this.bb = [-.3, -.3, .3, .3, .6]; this.S = [0, 1].map(f => { const c = diverBase(f, 0), g = c.getContext('2d'); g.fillStyle = '#7ac84a'; g.fillRect(21, 12, 4, 3); g.fillStyle = '#a8e06a'; g.fillRect(22, 11, 2, 2); return [spr(c), spr(flipC(c))]; }); this.fl = 0; }
  sprite() { return this.S[Math.floor(this.t * 3) & 1][this.fl]; }
  tick(dt) { this.t += dt; const a = this.t * .25, nx = this.cx + Math.cos(a) * 2.6, ny = this.cy + Math.sin(a) * 1.2; this.fl = (nx - this.x) - (ny - this.y) < 0 ? 1 : 0; this.x = nx; this.y = ny; }
}
/** rippling light on a floor. o: { x0, y0, x1, y1 (world), ok(x, y)?, col, lit } -> { ent, update(dt) } (redraws about 8 times a second) */
export function caustics(o) {
  const dx = o.x1 - o.x0, dy = o.y1 - o.y0, W = Math.round((dx + dy) * 16), H = Math.round((dx + dy) * 8), c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), ox = -dy * 16;
  const s = { c, l: o.lit ? c : null, x: ox, y: 0, w: W, h: H }, ent = { x: o.x0, y: o.y0, z: -.02, bb: [0, 0, dx, dy, .005], sprite: () => s }; let t = rnd(0, 9), acc = 1;
  return { ent, update(dt) { t += dt; if ((acc += dt) < .125) return; acc = 0; g.clearRect(0, 0, W, H); g.fillStyle = o.col || '#ffffff50';
    for (let py = 0; py < H; py += 2) for (let px = (py >> 1) % 3; px < W; px += 3) { const a = (px + ox) / 16, b = py / 8, wx = (a + b) / 2, wy = (b - a) / 2; if (wx < 0 || wy < 0 || wx > dx || wy > dy) continue; if (o.ok && !o.ok(wx + o.x0, wy + o.y0)) continue; const f = Math.sin(wx * 2.3 + t + Math.sin(wy * 1.9 + t * .6) * 1.4) + Math.sin(wy * 2.7 - t * .7 + Math.sin(wx * 1.5) * 1.3); if (f > -.12 && f < .12) g.fillRect(px, py, 2, 1); } } };
}
export const SHARKS = ['sandtiger', 'leopard', 'blacktip', 'hammerhead'];
