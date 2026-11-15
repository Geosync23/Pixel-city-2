// Big city events — sky and air effects drawn over the city (private helper of sim/cityevents.js): petals, leaves, confetti, fireworks, wish lanterns, sparkles.
// All in low-res canvas pixels through one G.overlays hook; nothing here touches the world or the save.
//   FX.petals(x, y, n, cols?)  FX.leaves(x, y, n)  FX.confetti(x, y, n)  FX.firework(x, y, z?, col?)  FX.lanterns(x, y, n)  FX.sparkle(x, y, z, n)  FX.clear()  FX.count()
import { G } from '../core/game.js';
import { WS } from '../engine/raster.js';
import { CITY_EVENTS } from '../data/cityevents.js';

/* QA6: the River Walk Fair's Ring Toss used the 'aim' mini-game's default art (a basketball hoop and ball). Give it a stall of bottles and a ring.
   Mini-game canvas coordinates: the target is around (140, 34); the hooks are drawn by ui/minigame.js KINDS.aim (def.scene + def.projectile). */
const RR = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const BOT = ['#3f9a4a', '#2f7f86', '#a0522d', '#3f9a4a', '#c0563a', '#2f7f86'];
function ringScene(c, x, y, w, h, st) {
  RR(c, x, y + h - 30, w, 30, '#e8d2a6'); for (let k = 0; k < w; k += 16) RR(c, x + k, y, 8, 10, k % 32 ? '#f2c230' : '#e0453a');   /* sawdust floor, striped awning */
  RR(c, 104, 46, 76, 6, '#7a4a2a'); RR(c, 104, 46, 76, 1, '#a8703f'); RR(c, 108, 52, 4, 30, '#5a3a20'); RR(c, 172, 52, 4, 30, '#5a3a20');   /* the bottle table */
  const rows = [[118, 130, 142, 154, 166], [124, 136, 148, 160], [130, 142, 154]];
  rows.forEach((row, r) => row.forEach((bx, i) => { const by = 46 - r * 12, col = BOT[(i + r) % BOT.length];
    RR(c, bx - 3, by - 10, 7, 10, '#2a2733'); RR(c, bx - 2, by - 9, 5, 9, col); RR(c, bx - 1, by - 14, 3, 4, '#2a2733'); RR(c, bx, by - 13, 1, 3, col); RR(c, bx - 1, by - 8, 1, 5, '#ffffff66'); }));
  if (st && st.stage === 3 && st.q >= 1 && st.fly > .55) { RR(c, 136, 21, 11, 2, '#e0453a'); RR(c, 135, 22, 2, 2, '#e0453a'); RR(c, 146, 22, 2, 2, '#e0453a'); }   /* a ringer: the ring sits on the top bottle */
}
function ringProjectile(c, bx, by, st) {
  if (st && st.stage === 3 && st.q >= 1 && st.fly > .55) return;   /* landed: ringScene draws it on the bottle */
  RR(c, bx - 6, by - 3, 12, 6, '#2a2733'); RR(c, bx - 5, by - 2, 10, 4, '#e0453a'); RR(c, bx - 3, by - 1, 6, 2, '#e8d2a6'); RR(c, bx - 4, by - 2, 3, 1, '#ff9a8a');
}
try { for (const ev of CITY_EVENTS || []) for (const g of ev.games || []) if (g.id === 'ringtoss' && g.game) { g.game.scene = ringScene; g.game.projectile = ringProjectile; g.game.theme = Object.assign({ paper: '#f6e6c4' }, g.game.theme); } } catch (e) { /* data shape changed: keep the default art */ }

const P = [], MAX = 900;   /* particles: { k, x, y (screen-space offset from the world anchor), wx, wy, wz (world anchor), vx, vy, t, life, c, s } */
const PINK = ['#f2a7c3', '#fbe3ea', '#f7c1d4', '#ffffff'], LEAF = ['#e08a2c', '#d9562b', '#e8b63a', '#b8432a'], CONF = ['#e0453a', '#f09a3a', '#f2c230', '#4fa860', '#3b82d6', '#8a5cd0', '#ffffff'],
  FW = ['#ff6a5a', '#ffd24a', '#7ad8ff', '#9cf2b0', '#f0a0ff', '#ffffff', '#ffb060'];
const rnd = Math.random, pick = a => a[(rnd() * a.length) | 0];
const add = p => { if (P.length < MAX) P.push(p); };
function flutter(k, x, y, n, cols, spread, zTop) { for (let i = 0; i < n; i++) add({ k, wx: x + (rnd() - .5) * spread, wy: y + (rnd() - .5) * spread, wz: zTop * (.4 + rnd() * .6), x: 0, y: 0, vx: (rnd() - .5) * 10, vy: 6 + rnd() * 8, t: 0, life: 2.2 + rnd() * 2.2, c: pick(cols), s: rnd() * 6 }); }
export const FX = {
  petals: (x, y, n = 30, cols = PINK) => flutter('fl', x, y, n, cols, 5, 5),
  leaves: (x, y, n = 20) => flutter('fl', x, y, n, LEAF, 5, 5),
  confetti: (x, y, n = 50) => flutter('fl', x, y, n, CONF, 3, 6),
  /** a rocket from (x, y) on the ground / water that bursts high above it */
  firework(x, y, z = 9 + rnd() * 5, col) { add({ k: 'rk', wx: x + (rnd() - .5) * 2, wy: y + (rnd() - .5) * 2, wz: 1, x: 0, y: 0, vx: (rnd() - .5) * 6, vy: -(125 + rnd() * 50), t: 0, life: 1.05 + rnd() * .35, c: col || pick(FW), s: z }); },
  lanterns(x, y, n = 40) { for (let i = 0; i < n; i++) add({ k: 'ln', wx: x + (rnd() - .5) * 14, wy: y + (rnd() - .5) * 6, wz: 1.2, x: 0, y: 0, vx: 2 + rnd() * 3, vy: -(5 + rnd() * 5), t: -rnd() * 7, life: 26 + rnd() * 14, c: pick(['#ffb060', '#ffd98a', '#ff8a5a']), s: rnd() * 6 }); },
  sparkle(x, y, z, n = 40) { for (let i = 0; i < n; i++) { const a = rnd() * 6.28, v = 10 + rnd() * 40; add({ k: 'sp', wx: x, wy: y, wz: z * rnd(), x: 0, y: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6 - 10, t: -rnd() * .5, life: .7 + rnd() * .8, c: pick(['#fff2b0', '#ffffff', '#ffd24a']), s: 0 }); } },
  clear() { P.length = 0; }, count: () => P.length,
};
function burst(p) { const n = 56 + ((rnd() * 30) | 0), ring = rnd() < .35; for (let i = 0; i < n; i++) { const a = rnd() * 6.28, v = ring ? 52 : 14 + rnd() * 46; add({ k: 'bs', wx: p.wx, wy: p.wy, wz: p.wz, x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 1.1 + rnd() * .8, c: rnd() < .8 ? p.c : '#ffffff', s: 0 }); } G.emit('cityevent:bang'); }
export function drawFX(ctx, cam, dt) {
  if (!P.length) return; dt = Math.min(dt || .016, .05); if (G.modal > 0) dt = 0;
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i]; p.t += dt; if (p.t < 0) continue; if (p.t >= p.life) { if (p.k === 'rk') burst(p); P[i] = P[P.length - 1]; P.pop(); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; const w = WS(p.wx, p.wy, p.wz), sx = Math.round(w[0] + p.x - cam.x), sy = Math.round(w[1] + p.y - cam.y), k = p.t / p.life;
    if (p.k === 'fl') { p.vx += Math.sin(p.t * 5 + p.s) * 30 * dt; if (sx < -4 || sy < -4 || sx > G.W + 4 || sy > G.H + 4) continue; ctx.fillStyle = p.c; ctx.fillRect(sx, sy, (p.t * 8 + p.s) & 1 ? 2 : 1, 1); }
    else if (p.k === 'rk') { if (p.wz + (-p.y) / 16 >= p.s) { p.t = p.life; } ctx.fillStyle = '#fff2b0'; ctx.fillRect(sx, sy, 1, 2); ctx.fillStyle = '#ffb060'; ctx.fillRect(sx, sy + 2, 1, 2); }
    else if (p.k === 'bs') { p.vy += 26 * dt; p.vx *= 1 - 1.2 * dt; p.vy *= 1 - 1.2 * dt; if (k > .6 && ((p.t * 20) | 0) & 1) continue; ctx.fillStyle = k > .75 ? '#ffffff' : p.c; ctx.fillRect(sx, sy, k < .45 ? 2 : 1, k < .45 ? 2 : 1); }
    else if (p.k === 'sp') { p.vy += 40 * dt; ctx.fillStyle = p.c; ctx.fillRect(sx, sy, 1, 1); }
    else if (p.k === 'ln') { p.vx += Math.sin(p.t * .7 + p.s) * 1.5 * dt; if (sx < -6 || sy < -8 || sx > G.W + 6 || sy > G.H + 8) continue; const a = k > .85 ? (1 - k) / .15 : 1; ctx.globalAlpha = a * .35; ctx.fillStyle = '#ffd98a'; ctx.fillRect(sx - 3, sy - 3, 7, 8); ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.fillRect(sx - 1, sy - 2, 3, 4); ctx.fillStyle = '#fff2b0'; ctx.fillRect(sx, sy, 1, 2); ctx.fillStyle = '#7a2a24'; ctx.fillRect(sx - 1, sy - 3, 3, 1); ctx.globalAlpha = 1; }
  }
}
