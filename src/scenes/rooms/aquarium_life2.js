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
const hatch = f => paint(11, 9, set => { set(1, 4, '#6a8a5a'); set(3, f ? 0 : 1, '#6a8a5a', 3, 2); set(3, f ? 7 : 6, '#6a8a5a', 3, 2); set(1, 2, '#6a8a5a', 2, 1); set(1, 6, '#6a8a5a', 2, 1); ell(set, 5, 4, 3, 2.4, '#2f4a38'); set(4, 3, '#58785a', 3, 1); set(3, 4, '#58785a'); set(7, 4, '#58785a'); set(5, 5, '#58785a'); ell(set, 9, 4, 1.2, 1.2, '#7a9a68'); set(10, 3, INK); });
const manta = f => paint(48, 23, set => { const cx = 24, cy = 11; for (let x = -15; x <= 15; x++) { const h = Math.round((15 - Math.abs(x)) * .5 + (Math.abs(x) < 5 ? 2 : 0)), lift = Math.abs(x) > 7 ? (f ? -2 : 2) * (Math.abs(x) - 7) / 8 : 0; for (let y = -h; y <= h; y++) set(cx + x, cy + y + lift, y < -h * .2 ? '#2a3038' : '#3a424c'); } for (const sd of [-1, 1]) { for (let j = 0; j < 6; j++) set(cx + 14 + j, cy + sd * (4 - (j > 3 ? j - 3 : 0)), '#1c2028', 1, 2); set(cx + 19, cy + sd * 2, '#e8ecee'); set(cx + 6, cy + sd * 5, '#e8ecee', 4, 1); set(cx + 13, cy + sd * 2, INK); } set(cx + 15, cy - 2, '#565e68', 1, 5); set(cx + 8, cy - 1, '#e8ecee', 4, 2); for (let i = 0; i < 12; i++) set(cx - 15 - i, cy + (i > 7 ? 1 : 0), '#2a3038'); });
const mola = f => paint(24, 34, set => { const cx = 12, cy = 17; ell(set, cx, cy, 9, 8, '#9aa4ae'); ell(set, cx + 1, cy - 2, 6, 4, '#b4bec8'); for (let j = 0; j < 9; j++) { set(cx - 3 + (f ? 1 : -1) * j / 4, cy - 8 - j, '#7a848e', 5 - j / 2.4, 1); set(cx - 3 - (f ? 1 : -1) * j / 4, cy + 8 + j, '#7a848e', 5 - j / 2.4, 1); } for (let y = -6; y <= 6; y++) set(cx - 10, cy + y, y % 3 ? '#7a848e' : '#c8d0d8', 2, 1); set(cx + 6, cy - 2, INK, 2, 2); set(cx + 9, cy + 1, '#e8ecee', 1, 2); for (const [x, y] of [[-3, 2], [2, 4], [-5, -3], [4, -5]]) set(cx + x, cy + y, '#c8d0d8'); set(cx + 3, cy + 3, '#7a848e', 4, 1); });
/* owner msg 141: 'the sea turtle is way too big': every turtle drawn at about two thirds of its old size (top view k x0.65, side view L x0.68) */
export const TV = { turtle: { shell: '#5a7a4a', hi: '#86a862', sc: '#34502c', rim: '#a8c080', skin: '#8aa868', sk2: '#56743e', k: 0.98, L: 27 }, logger: { shell: '#a8643a', hi: '#cc8a5a', sc: '#6a3a1c', rim: '#e0b070', skin: '#e0b070', sk2: '#a8743c', k: 1.17, head: 1.5, L: 33 },
  hawks: { shell: '#b87a2a', hi: '#e8c060', sc: '#4a2c10', rim: '#f0d890', skin: '#d8c890', sk2: '#6a5428', k: 0.81, beak: 1, saw: 1, L: 22 }, leather: { shell: '#2c343c', hi: '#46525e', sc: '#93a0ac', rim: '#46525e', skin: '#3a444e', sk2: '#9aa6b2', k: 1.62, ridge: 1, L: 46 } };
const seg = (set, x0, y0, x1, y1, w0, w1, c) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let i = 0; i <= n; i++) { const t = i / n, w = w0 + (w1 - w0) * t; ell(set, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, w, w, c); } };
/** top view (facing right), two flipper-stroke frames */
const turtleV = v => f => { const k = v.k, W = Math.round(30 * k), H = Math.round(24 * k); return paint(W, H, set => { const cx = Math.round(12 * k), cy = H >> 1, rx = 8 * k, ry = 5.4 * k, hd = v.head || 1;
  for (const sd of [-1, 1]) { const sx = cx + 4.5 * k, sy = cy + sd * 4 * k; if (f) seg(set, sx, sy, cx - 1.5 * k, cy + sd * 10 * k, 1.5 * k, .5 * k, v.skin); else seg(set, sx, sy, cx + 9.5 * k, cy + sd * 9.5 * k, 1.5 * k, .5 * k, v.skin); set(sx - (f ? 2 : -2) * k, sy + sd * 3 * k, v.sk2, Math.max(1, Math.round(k)), 1); seg(set, cx - 6.5 * k, cy + sd * 3.4 * k, cx - (f ? 10.5 : 9.5) * k, cy + sd * (f ? 5 : 6.5) * k, k, .5 * k, v.skin); }
  seg(set, cx - rx, cy, cx - rx - 2 * k, cy, .5 * k, .3, v.skin);
  ell(set, cx, cy, rx, ry, v.rim); ell(set, cx, cy, rx - k, ry - k, v.shell); ell(set, cx - k, cy - k * .8, rx * .55, ry * .4, v.hi);
  if (v.ridge) { for (let j = -2; j <= 2; j++) for (let x = -rx + 2; x < rx - 1; x++) if ((x & 3) !== 3) set(cx + x, cy + j * ry * .36 * (1 - Math.abs(x) / rx * .5), v.sc); for (let i = 0; i < 9; i++) set(cx - rx * .7 + i * rx * .17, cy + ((i * 7) % 5 - 2) * ry * .18, '#c8d2dc'); }
  else { for (let i = -2; i <= 2; i++) { const x = cx + i * rx * .36; for (let y = -ry * .45; y <= ry * .45; y++) set(x + rx * .18, cy + y, v.sc); } for (let x = -rx * .8; x <= rx * .8; x++) { set(cx + x, cy - ry * .45, v.sc); set(cx + x, cy + ry * .45, v.sc); } for (let i = -3; i <= 3; i++) { set(cx + i * rx * .26, cy - ry * .72, v.sc, 1, Math.max(1, Math.round(k))); set(cx + i * rx * .26, cy + ry * .6, v.sc, 1, Math.max(1, Math.round(k))); }
    if (v.saw) { for (let i = -2; i <= 2; i++) set(cx - rx - 1 + Math.abs(i) * .6, cy + i * ry * .3, v.sc, 2, 1); for (let i = 0; i < 7; i++) set(cx - rx * .6 + i * rx * .2, cy + ((i * 5) % 3 - 1) * ry * .25, v.hi, Math.max(1, Math.round(k)), 1); } }
  seg(set, cx + rx - k, cy, cx + rx + 1.5 * k, cy, 1.3 * k * hd, 1.5 * k * hd, v.skin); ell(set, cx + rx + 2.2 * k * hd, cy, 1.9 * k * hd, 1.5 * k * hd, v.skin); set(cx + rx + 2 * k * hd, cy - 1, v.sk2, Math.max(1, Math.round(k)), Math.max(1, Math.round(k)));
  const ex = cx + rx + 3 * k * hd; set(ex, cy - Math.round(1.2 * k * hd), INK); set(ex, cy + Math.round(1.2 * k * hd), INK); if (v.beak) set(cx + rx + 4.2 * k * hd, cy, v.sc, 2, 1); }); };
/** big side view for the underwater window (facing right), two stroke frames. L = length in px */
export const turtleSide = v => f => { const L = v.L, SL = L * .66, DH = L * (v.ridge ? .2 : .25), W = Math.round(L + 14), H = Math.round(L * .7 + 8), ox = 5, oy = Math.round(DH + L * .22); return paint(W, H, set => { const hd = v.head || 1;
  // rear flipper + tail
  seg(set, ox + SL * .1, oy + 2, ox - 3, oy + L * (f ? .1 : .16), L * .035, 1, v.skin); seg(set, ox + 2, oy, ox - 3, oy + 1, 1.2, .5, v.skin);
  // shell: dome + plastron
  for (let x = 0; x <= SL; x++) { const t = x / SL, top = Math.round(DH * Math.pow(Math.sin(Math.PI * t), .6)), bot = Math.round(L * .07 * Math.pow(Math.sin(Math.PI * t), .5)); for (let y = -top; y <= bot; y++) { let c = y > 0 ? '#e8dcb0' : y < -top + 2 ? v.hi : v.shell; if (y === 0 || y === -1) c = v.rim; set(ox + x, oy + y, c); }
    if (v.ridge) { for (const r of [.35, .65, .9]) set(ox + x, oy - Math.round(top * r), (x & 3) === 3 ? v.shell : v.sc); if (x % 5 === 2 && top > 4) set(ox + x, oy - Math.round(top * .5), '#c8d2dc'); }
    else { if (x % Math.max(5, Math.round(SL / 6)) === 0 && top > 2) for (let y = -top + 1; y < -1; y++) set(ox + x + Math.round(y * .25), oy + y, v.sc); if (top > 5) set(ox + x, oy - Math.round(top * .52), v.sc); if (v.saw && x < SL * .35 && x % 3 === 0) set(ox + x, oy + 1, v.sc, 2, 2); if (v.saw && (x * 7) % 11 < 3 && top > 4) set(ox + x, oy - Math.round(top * .75), v.hi, 2, 1); } }
  // neck, head, eye, beak
  const hx = ox + SL + L * .1 * hd, hy = oy - L * .03, hr = L * .075 * hd; seg(set, ox + SL - 2, oy - 1, hx, hy, L * .055 * hd, hr * .9, v.skin); ell(set, hx + hr * .5, hy, hr * 1.25, hr, v.skin); ell(set, hx + hr * .2, hy - hr * .5, hr * .7, hr * .35, v.sk2);
  set(hx + hr * .7, hy - hr * .25, '#f4f0e8', 2, 2); set(hx + hr * .7 + 1, hy - hr * .25, INK, 1, 2); for (let i = 0; i < hr; i++) set(hx + hr * .9 + i, hy + hr * .45, v.sc); if (v.beak) { set(hx + hr * 1.7, hy + hr * .1, v.sc, 2, 2); set(hx + hr * 1.7 + 2, hy + hr * .3, v.sc, 1, 2); }
  // front flipper: the long stroke
  const fx = ox + SL * .72, fy = oy + 1, an = f ? .95 : -.55, fl = L * (v.ridge ? .46 : .4); seg(set, fx, fy, fx + Math.cos(an + .9) * fl * .35, fy + Math.sin(an + .9) * fl * .35, L * .05, L * .045, v.skin); seg(set, fx + Math.cos(an + .9) * fl * .35, fy + Math.sin(an + .9) * fl * .35, fx - Math.cos(an) * fl * .4 + Math.cos(an + .9) * fl * .35, fy + Math.sin(an) * fl + Math.sin(an + .9) * fl * .1, L * .045, 1, v.skin);
  for (let i = 1; i < 4; i++) set(fx + Math.cos(an + .9) * fl * .1 * i, fy + Math.sin(an + .9) * fl * .1 * i, v.sk2, 2, 1); }); };
/** nose to the glass: front view */
export const turtleFront = v => f => { const L = v.L, r = L * .2, W = Math.round(L * .9), H = Math.round(L * .5); return paint(W, H, set => { const cx = W >> 1, cy = H >> 1; for (const sd of [-1, 1]) seg(set, cx + sd * r, cy + r * .3, cx + sd * (r * 2.1), cy + r * (f ? .9 : .1), r * .28, 1, v.skin);
  ell(set, cx, cy - r * .15, r * 1.35, r * .95, v.shell); ell(set, cx, cy - r * .5, r * .9, r * .4, v.hi); ell(set, cx, cy + r * .5, r * 1.2, r * .35, '#e8dcb0'); ell(set, cx, cy + r * .2, r * .62 * (v.head || 1), r * .6 * (v.head || 1), v.skin); ell(set, cx, cy - r * .05, r * .4, r * .22, v.sk2);
  for (const sd of [-1, 1]) { set(cx + sd * r * .32 - 1, cy + r * .12, '#f4f0e8', 3, 3); set(cx + sd * r * .32, cy + r * .12 + 1, INK, 1, 2); } set(cx - 2, cy + r * .5, v.sc, 5, 1); set(cx - 1, cy + r * .5 + 1, v.sc, 3, 1); }); };
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
