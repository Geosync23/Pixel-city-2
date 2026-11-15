// Maple Bay Aquarium — everything that swims, waddles or floats (browser only; no game state).
//   Sprites are painted once into small canvases (side views, sheared for the four iso headings) and reused.
//   wallTank(o)   a live tank on a back wall or a partition: o = { x, y, z, w, h (world units), axis 'y' | 'x', kind 'kelp'|'reef'|'seal'|'jelly'|'abyss'|'ocean'|'cafe', dark? } -> { ent, update(dt), feed(sec), species }
//   bigTank(o)    the cylinder in the hall: { x, y (centre), z, r, h } -> { ent, update(dt), diver(on), wave(), diverOn(), feeding }
//   Swimmer / school(sc, o) / Circuit   3D fish for the ocean tunnel (entities with schooling)        Critter   penguins, otters, seals, rays, the turtle, Finn the mascot
//   near(list, species, x, y, r) -> entity | null (used by the logbook to "spot" something that is really swimming by)
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const paint = (w, h, fn) => { const c = mk(w, h), x = c.getContext('2d'); fn((px, py, col, ww = 1, hh = 1) => { x.fillStyle = col; x.fillRect(Math.round(px), Math.round(py), ww, hh); }, x); return c; };
const flipC = c => { const o = mk(c.width, c.height), x = o.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return o; };
const shearC = (c, sg) => { const W = c.width, o = mk(W, c.height + Math.ceil(W / 2)), x = o.getContext('2d'); x.setTransform(1, sg * .5, 0, 1, 0, sg > 0 ? 0 : W / 2); x.drawImage(c, 0, 0); return o; };
const spr = (c, lit = true) => ({ c, l: lit ? c : null, x: -(c.width >> 1), y: -(c.height >> 1), w: c.width, h: c.height });
const ell = (set, cx, cy, rx, ry, col) => { for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) { const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / (ry + .3)) ** 2))); if (hw >= 0) set(cx - hw, cy + y, col, hw * 2 + 1, 1); } };
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const INK = '#1a2030';

/* ---------------- species: side views ---------------- */
export const SP = {
  sandtiger: { L: 30, H: 5, back: '#8a94a0', belly: '#e8ecee', fin: '#6a7480', tail: 'shark', dorsal: 6, pect: 1, name: 'sand tiger shark' },
  leopard: { L: 22, H: 3, back: '#b8a888', belly: '#eee6d0', fin: '#8a7a5c', spots: '#4a4034', tail: 'shark', dorsal: 3, pect: 1, name: 'leopard shark' },
  bass: { L: 22, H: 7, back: '#4a5868', belly: '#8a98a8', fin: '#38444f', spots: '#2f3840', tail: 'round', dorsal: 2, name: 'giant sea bass' },
  sardine: { L: 6, H: 1, back: '#9fc4dc', belly: '#eef6fa', fin: '#7aa4c0', tail: 'fork' },
  rockfish: { L: 11, H: 3, back: '#b8643a', belly: '#e8b890', fin: '#8a4428', stripe: [3, '#7a3a20'], tail: 'round', dorsal: 2 },
  greenling: { L: 11, H: 2, back: '#6a8a4a', belly: '#c8d8a0', fin: '#4a6a34', spots: '#3f5a2c', tail: 'round', dorsal: 1 },
  perch: { L: 8, H: 3, back: '#c8d4da', belly: '#f4f8fa', fin: '#9aa8b4', stripe: [2, '#8a98a8'], tail: 'fork' },
  garibaldi: { L: 9, H: 3, back: '#f2742a', belly: '#f89a4a', fin: '#d85a1a', tail: 'fork', dorsal: 1 },
  clown: { L: 7, H: 2, back: '#f0782a', belly: '#f0782a', fin: '#c85a1a', stripe: [3, '#fbf7ee'], tail: 'round' },
  tang: { L: 9, H: 3, back: '#2f6fe0', belly: '#3a80f0', fin: '#f2d23a', mark: '#16224a', tail: 'fork' },
  ytang: { L: 8, H: 3, back: '#f2d23a', belly: '#f6e06a', fin: '#d8b020', tail: 'fork' },
  butterfly: { L: 8, H: 4, back: '#fbf7ee', belly: '#f2d23a', fin: '#f2d23a', stripe: [4, '#2a2733'], tail: 'round' },
  chromis: { L: 5, H: 1, back: '#58d4c8', belly: '#a8f0e0', fin: '#3fb0a8', tail: 'fork' },
  anthias: { L: 6, H: 2, back: '#f26a8a', belly: '#f8a0b0', fin: '#d84a70', tail: 'fork' },
  lantern: { L: 5, H: 1, back: '#3a4a6a', belly: '#8fe0ff', fin: '#2a3450', tail: 'fork' },
  smelt: { L: 5, H: 1, back: '#b8c8d0', belly: '#e8f0f4', fin: '#8a9aa4', tail: 'fork' },
};
function fishBase(s, f) {
  const L = s.L, H = s.H, TL = Math.max(2, Math.round(L * (s.tail === 'shark' ? .3 : .22))), D = s.dorsal || 0, oy = H + D + 2, W = L + TL + 2, HH = 2 * H + D + 5;
  return paint(W, HH, set => {
    const half = t => Math.max(.4, H * (t < .68 ? .28 + .72 * Math.sin(t / .68 * Math.PI / 2) : Math.sqrt(Math.max(0, 1 - ((t - .68) / .32) ** 2))));
    const wig = i => (i < L * .3 ? (f ? 1 : -1) * (i < L * .12 ? 1 : .5) : 0);
    // tail
    for (let k = 1; k <= TL; k++) { const x = TL - k, dy = Math.round((f ? 1 : -1) * (k / TL) * (L > 12 ? 1.6 : 1)); if (s.tail === 'shark') { const up = Math.round(k * (H + D) * .95 / TL), dn = Math.round(k * H * .55 / TL); set(x, oy - up + dy, s.fin, 1, Math.max(1, Math.ceil(up * .45))); set(x, oy + dn - Math.max(1, Math.ceil(dn * .5)) + 1 + dy, s.fin, 1, Math.max(1, Math.ceil(dn * .5))); if (k < TL * .6) set(x, oy + dy, s.fin); } else { const hh = Math.max(1, Math.round(k * (H + .6) / TL)); if (s.tail === 'fork') { const g = Math.floor(hh * .45); set(x, oy - hh + dy, s.fin, 1, hh - g + (k < 2 ? g : 0)); set(x, oy + g + 1 + dy - (k < 2 ? g : 0), s.fin, 1, hh - g + (k < 2 ? g : 0)); if (H < 2) set(x, oy + dy, s.fin); } else set(x, oy - hh + dy, s.fin, 1, hh * 2 + 1); } }
    // body
    for (let i = 0; i < L; i++) { const t = i / (L - 1), h = half(t), x = TL + i, top = Math.round(oy - h + wig(i)), bot = Math.round(oy + h + wig(i)), mid = Math.round(oy + h * .15 + wig(i));
      for (let y = top; y <= bot; y++) { let c = y <= mid ? s.back : s.belly; if (s.stripe && i % s.stripe[0] === (s.stripe[0] - 1) && t > .2 && t < .9) c = s.stripe[1]; set(x, y, c); }
      if (s.spots && i % 3 === 1 && t > .15 && t < .85) set(x, top + 1 + (i % 2), s.spots); if (H > 2) set(x, top, s.fin); }
    if (D) { const bx = TL + Math.round(L * .52); for (let k = 0; k < D + 2; k++) { const hh = Math.max(0, D - Math.abs(k - 1) * (s.tail === 'shark' ? 1.2 : .6)); if (hh > 0) set(bx - k + 2, Math.round(oy - half(.55) - hh), s.fin, 1, Math.ceil(hh)); } }
    if (s.pect) { const bx = TL + Math.round(L * .62); for (let k = 0; k < 4; k++) set(bx - k, Math.round(oy + half(.6)) + k - 1, s.fin, 2, 1); }
    if (s.mark) { set(TL + Math.round(L * .35), oy - 1, s.mark, Math.round(L * .4), 1); set(TL, oy, s.fin, 2, 1); }
    if (L > 6) { set(TL + L - Math.max(2, Math.round(L * .14)), Math.round(oy - H * .35), INK); if (s.tail === 'shark') { set(TL + L - 4, oy + Math.round(H * .5), INK, 3, 1); for (let g = 0; g < 3; g++) set(TL + L - 8 - g * 2, oy - 1, s.fin, 1, 3); } } else set(TL + L - 2, oy, INK);
  });
}
function rayBase(f) { return paint(26, 13, set => { const cx = 15, cy = 6, c = '#7a6a5a', d = '#5a4c40', l = '#a89880'; for (let x = -9; x <= 9; x++) { const h = Math.round((9 - Math.abs(x)) * .55); const lift = Math.abs(x) > 4 ? (f ? -1 : 1) : 0; for (let y = -h; y <= h; y++) set(cx + x, cy + y + lift, y < 0 ? c : d); } for (const [x, y] of [[-3, -1], [1, -2], [3, 0], [-1, 1], [5, -1]]) set(cx + x, cy + y, l); set(cx + 7, cy - 1, INK); for (let i = 0; i < 9; i++) set(cx - 9 - i, cy + (i > 5 ? 1 : 0), d); }); }
function turtleBase(f) { return paint(22, 14, set => { const cx = 10, cy = 7; ell(set, cx, cy, 7, 4, '#5a7a4a'); ell(set, cx, cy - 1, 5, 2, '#7a9a5a'); for (const [x, y] of [[-3, 0], [0, -2], [3, 0], [0, 2], [-5, 1]]) set(cx + x, cy + y, '#3f5a34'); ell(set, cx + 9, cy, 2, 1.4, '#8aa868'); set(cx + 10, cy - 1, INK); const k = f ? 1 : -1; set(cx + 3, cy - 5 + k, '#8aa868', 5, 2); set(cx + 4, cy + 4 - k, '#8aa868', 5, 2); set(cx - 7, cy - 4, '#8aa868', 3, 1); set(cx - 7, cy + 4, '#8aa868', 3, 1); set(cx - 9, cy, '#8aa868', 2, 1); }); }
function sealBase(f) { return paint(30, 14, set => { const c = '#8a8e96', d = '#6a6e78', l = '#b4b8c0'; for (let i = 0; i < 24; i++) { const t = i / 23, h = 4.5 * (t < .7 ? .3 + .7 * Math.sin(t / .7 * 1.57) : Math.sqrt(1 - ((t - .7) / .3) ** 2)), w = i < 6 ? (f ? 1 : -1) : 0; for (let y = Math.round(7 - h + w); y <= Math.round(7 + h + w); y++) set(5 + i, y, y > 8 ? l : c); if (i % 4 === 1 && t > .2) set(5 + i, Math.round(7 - h * .4), d); } set(1, 5 + (f ? 1 : -1), d, 4, 2); set(1, 8 + (f ? 1 : -1), d, 4, 2); set(18, 11, d, 4, 2); set(16, 12, d, 3, 1); set(26, 6, INK); set(28, 8, INK); set(27, 9, '#e8ecee', 2, 1); }); }
function penguinStand(f) { return paint(8, 12, set => { ell(set, 4, 6, 2.6, 4.2, '#2a2e3a'); ell(set, 4 + 1, 7, 1.6, 3.2, '#f4f6f8'); ell(set, 4, 2, 2, 1.8, '#2a2e3a'); set(5, 2, '#f4f6f8', 1, 1); set(6, 2, '#f29a3a', 2, 1); set(5, 1, INK); set(2 + (f ? 0 : 1), 11, '#f29a3a', 2, 1); set(5 - (f ? 1 : 0), 11, '#f29a3a', 2, 1); set(1, 5 + (f ? 1 : 0), '#2a2e3a', 1, 4); }); }
function penguinSwim(f) { return paint(13, 7, set => { ell(set, 6, 3, 5, 2, '#2a2e3a'); set(3, 4, '#f4f6f8', 7, 1); set(11, 3, '#f29a3a', 2, 1); set(10, 2, INK); set(0, 2 + (f ? 1 : 0), '#f29a3a', 2, 1); set(5, f ? 0 : 5, '#2a2e3a', 3, 1); }); }
function otterFloat(f) { return paint(18, 9, set => { ell(set, 8, 5, 6, 2, '#7a5a3c'); ell(set, 8, 4, 4, 1, '#9a7a56'); ell(set, 15, 4, 2.2, 2, '#b89a74'); set(15, 3, INK); set(17, 4, INK); set(16, 5, '#e8dcc8'); set(0, 5, '#5a4028', 3, 1); set(6 + (f ? 1 : 0), 2, '#5a4028', 2, 2); set(10 - (f ? 1 : 0), 2, '#5a4028', 2, 2); if (f) set(8, 1, '#c8ccd0', 2, 2); set(1, 7, '#cff0f8', 4, 1); set(12, 8, '#cff0f8', 4, 1); }); }
function sealHead(f) { return paint(12, 9, set => { ell(set, 6, 4, 4, 3.4, '#8a8e96'); set(4, 3, INK); set(8, 3, INK); set(5, 5, '#5a5e68', 3, 1); set(6, 6, INK); set(2, 5, '#e8ecee', 2, 1); set(9, 5, '#e8ecee', 2, 1); set(0, 8, '#cff0f8', 12, 1); if (f) set(3, 7, '#cff0f8', 6, 1); }); }
function sealRock(f) { return paint(26, 12, set => { for (let i = 0; i < 22; i++) { const t = i / 21, h = 4 * (t < .75 ? .25 + .75 * Math.sin(t / .75 * 1.57) : Math.sqrt(1 - ((t - .75) / .25) ** 2)); for (let y = Math.round(9 - h * 1.6); y <= 9; y++) set(2 + i, y - (t > .75 && f ? 1 : 0), y > 7 ? '#b4b8c0' : '#8a8e96'); if (i % 4 === 2) set(2 + i, Math.round(9 - h * 1.2), '#6a6e78'); } set(0, 8, '#6a6e78', 3, 2); set(22, 5 - (f ? 1 : 0), INK); set(24, 7 - (f ? 1 : 0), INK); set(12, 10, '#6a6e78', 4, 1); }); }
function diverBase(f, wave) { return paint(26, 18, set => { const c = '#2a2e3a', y0 = wave ? 4 : 8;
  if (wave) { ell(set, 12, 5, 2.5, 2.5, '#f2c49a'); set(10, 4, '#58c4dc', 5, 2); set(9, 2, '#f2c24a', 7, 2); set(10, 8, c, 5, 7); set(8, 8, '#f2c24a', 2, 6); set(15, 6 - (f ? 3 : 0), c, 2, 4); set(16, 3 - (f ? 2 : 0), '#f2c49a', 2, 2); set(10, 15, c, 2, 3); set(13, 15, c, 2, 3); set(9, 17, '#f0735a', 4, 1); set(12, 17, '#f0735a', 4, 1); set(17, 1, '#e8fbff'); set(18, 0, '#e8fbff'); }
  else { set(6, y0, c, 12, 4); set(7, y0 - 2, '#f2c24a', 7, 2); ell(set, 20, y0 + 1, 2.5, 2.5, '#f2c49a'); set(20, y0, '#58c4dc', 3, 2); set(2, y0 + 1 + (f ? 1 : -1), c, 4, 2); set(0, y0 + (f ? 2 : -1), '#f0735a', 3, 3); set(15, y0 + 4, c, 4, 1); set(18, y0 + 5, '#f2c49a', 2, 1); set(22, y0 - 3, '#e8fbff'); set(23, y0 - 5 - f, '#e8fbff'); } }); }
function anglerBase(f) { return paint(18, 14, set => { ell(set, 9, 8, 6, 4.5, '#3a2c34'); ell(set, 9, 7, 4, 2, '#4a3a44'); set(13, 9, '#e8dcc8', 3, 1); set(13, 10, '#1a1418', 3, 1); set(14, 11, '#e8dcc8', 1, 1); set(12, 6, '#f4f0e8'); set(1, 6 + (f ? 1 : 0), '#3a2c34', 3, 4); for (let i = 0; i < 5; i++) set(10 + i, 3 - Math.round(Math.sin(i / 4 * 3.1) * 2), '#5a4a54'); set(15, 2 + f, '#bff8ff', 2, 2); set(15, 1 + f, '#ffffff'); }); }
function isopodBase(f) { return paint(13, 6, set => { ell(set, 6, 3, 5, 2, '#c8b8c8'); for (let i = 0; i < 5; i++) set(2 + i * 2, 1, '#a898a8', 1, 4); set(11, 2, INK); for (let i = 0; i < 4; i++) set(2 + i * 2 + (f ? 1 : 0), 5, '#a898a8'); set(12, 1, '#a898a8', 1, 1); }); }
function vampBase(f) { return paint(14, 13, set => { ell(set, 7, 5, 4, 4, '#a8283a'); set(4, 2, '#c8404f', 2, 2); set(9, 2, '#c8404f', 2, 2); set(5, 5, '#bfe8ff', 1, 2); set(9, 5, '#bfe8ff', 1, 2); for (let i = 0; i < 5; i++) { const x = 3 + i * 2; set(x, 9, '#8a1c2c', 1, 2 + ((i + f) & 1)); } set(3, 9, '#a8283a', 9, 1); }); }
function octoBase(f) { return paint(18, 14, set => { ell(set, 8, 5, 5, 4, '#c8503a'); ell(set, 7, 4, 3, 2, '#e07058'); set(5, 6, '#f4f0e8'); set(10, 6, '#f4f0e8'); for (let i = 0; i < 6; i++) { const x = 2 + i * 3; for (let j = 0; j < 4 + ((i + f) & 1); j++) set(x + Math.round(Math.sin(j / 1.5 + i + f) * 1.3), 9 + j, j % 2 ? '#e8846a' : '#c8503a'); } }); }
function eelBase(f) { return paint(16, 8, set => { for (let i = 0; i < 12; i++) set(i, 4 + Math.round(Math.sin(i / 2.2 + f) * 1.4), '#7a8590', 1, 2); ell(set, 12, 3, 3, 2.5, '#8a95a0'); set(13, 2, INK); set(13, 5, '#3a3440', 3, 1); set(12, 1, '#6a7580', 2, 1); }); }
function horseBase(f) { return paint(7, 12, set => { const c = '#f2c24a', d = '#d8a030'; set(2, 0, c, 3, 3); set(5, 1, c, 2, 1); set(3, 1, INK); set(2, 3, c, 2, 2); set(1 + f, 5, c, 3, 3); set(2 + f, 6, d, 1, 1); set(2, 8, c, 2, 2); set(3, 10, d, 2, 1); set(4, 9, d, 1, 1); set(0, 4, d, 1, 2); }); }
function mascotBase(f) { return paint(18, 26, set => { const c = '#8a6240', l = '#d8b888', d = '#6a4628'; ell(set, 9, 17, 5.5, 6.5, c); ell(set, 9, 18, 3.5, 4.5, l); ell(set, 9, 7, 6, 5.5, c); ell(set, 9, 9, 4, 2.6, l); set(4, 1, c, 2, 2); set(12, 1, c, 2, 2); set(6, 6, INK, 2, 2); set(11, 6, INK, 2, 2); set(8, 8, INK, 3, 2); set(7, 10, d, 5, 1); set(5, 23, d, 3, 3); set(10, 23, d, 3, 3); set(2, 14, c, 2, 5); if (f) { set(15, 8, c, 2, 5); set(15, 6, l, 3, 2); } else { set(14, 13, c, 2, 5); set(14, 18, l, 2, 1); } set(6, 12, '#f0735a', 7, 1); set(8, 13, '#f0735a', 3, 2); }); }
const CACHE = {};
const frames = (key, fn, n = 2) => CACHE[key] || (CACHE[key] = Array.from({ length: n }, (_, f) => { const c = fn(f); return [c, flipC(c)]; }));
/** flat frames of a species: [frame][0 right | 1 left] canvas */
export function flat(sp) { if (SP[sp]) return frames('f:' + sp, f => fishBase(SP[sp], f)); return frames('f:' + sp, { ray: rayBase, turtle: turtleBase, seal: sealBase, pswim: penguinSwim, angler: anglerBase, isopod: isopodBase, vampire: vampBase, octopus: octoBase, eel: eelBase, seahorse: horseBase }[sp]); }
/** iso sprites for a species: [heading 0 +x, 1 +y, 2 -x, 3 -y][frame] -> sprite */
export function iso(sp) { return CACHE['i:' + sp] || (CACHE['i:' + sp] = [0, 1, 2, 3].map(h => flat(sp).map(fr => spr(shearC(fr[h === 0 || h === 3 ? 0 : 1], h === 0 || h === 2 ? 1 : -1))))); }
const single = (key, fn, lit) => CACHE[key] || (CACHE[key] = [0, 1].map(f => { const c = fn(f); return [spr(c, lit), spr(flipC(c), lit)]; }));

/* ---------------- 3D swimmers for the ocean tunnel ---------------- */
/** o: { sp, pts: [[x, y, z]] closed circuit (world coords), speed, at (0..1 start), zmin(x, y) } */
export class Swimmer {
  constructor(o) { Object.assign(this, { sp: o.sp, pts: o.pts, speed: o.speed || 1, zmin: o.zmin, lead: o.lead || null, off: o.off || null }); this.S = iso(o.sp); this.bb = o.bb || [-.25, -.25, .25, .25, .3]; this.t = Math.random() * 9; this.h = 0; this.i = Math.floor((o.at || 0) * this.pts.length) % this.pts.length; const p = this.pts[this.i]; this.x = p[0] + (o.off ? o.off[0] : 0); this.y = p[1] + (o.off ? o.off[1] : 0); this.z = p[2] + (o.off ? o.off[2] : 0); this.vx = 1; this.vy = 0; this.vz = 0; this.i = (this.i + 1) % this.pts.length; this.fr = o.fr || 4; this.ph = Math.random() * 6.28; }
  sprite() { return this.S[this.h][Math.floor(this.t * this.fr) & 1]; }
  tick(dt) {
    this.t += dt; let tx, ty, tz, sp = this.speed;
    if (this.lead) { const L = this.lead, o = this.off, w = this.t * .7 + this.ph; tx = L.x + o[0] + Math.sin(w) * .35 - L.vx * .4; ty = L.y + o[1] + Math.cos(w * 1.3) * .35 - L.vy * .4; tz = L.z + o[2] + Math.sin(w * .9) * .2; const d = Math.hypot(tx - this.x, ty - this.y); sp = L.speed * (d > 1.2 ? 1.7 : d > .4 ? 1.1 : .8); }
    else { const p = this.pts[this.i]; tx = p[0]; ty = p[1]; tz = p[2]; if (Math.hypot(tx - this.x, ty - this.y) < .7) this.i = (this.i + 1) % this.pts.length; }
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy) || 1e-6, k = Math.min(1, dt * (this.lead ? 3.5 : 1.6));
    this.vx += (dx / d * sp - this.vx) * k; this.vy += (dy / d * sp - this.vy) * k; this.x += this.vx * dt; this.y += this.vy * dt;
    const zm = this.zmin ? this.zmin(this.x + this.vx * 1.2, this.y + this.vy * 1.2) : 0; this.z += (Math.max(zm, tz) - this.z) * Math.min(1, dt * 1.4);
    const ax = Math.abs(this.vx), ay = Math.abs(this.vy), cur = this.h & 1 ? ay : ax, oth = this.h & 1 ? ax : ay; if (oth > cur * 1.25 || (this.h === 0 && this.vx < 0) || (this.h === 2 && this.vx > 0) || (this.h === 1 && this.vy < 0) || (this.h === 3 && this.vy > 0)) this.h = ax >= ay ? (this.vx > 0 ? 0 : 2) : (this.vy > 0 ? 1 : 3);
  }
}
/** a school: one invisible-ish leader on a circuit and n followers around it */
export function school(o) { const lead = new Swimmer(o), out = [lead]; for (let i = 0; i < o.n; i++) out.push(new Swimmer(Object.assign({}, o, { lead, off: [rnd(-1.4, 1.4), rnd(-1.4, 1.4), rnd(-.6, .6)], bb: [-.08, -.08, .08, .08, .1] }))); return out; }
export const near = (list, sp, x, y, r) => list.find(e => e.sp === sp && !e.hidden && Math.hypot(e.x - x, e.y - y) < r) || null;

/* ---------------- critters on land / at the surface ---------------- */
/** o: { kind 'penguin'|'otter'|'seal'|'ray'|'turtle'|'mascot', x0, y0, x1, y1 (roam rect), z, water: {x0,y0,x1,y1,z}? } */
export class Critter {
  constructor(o) { Object.assign(this, o); this.x = rnd(o.x0, o.x1); this.y = rnd(o.y0, o.y1); this.t = Math.random() * 9; this.wait = Math.random() * 4; this.tx = this.x; this.ty = this.y; this.fl = Math.random() < .5 ? 1 : 0; this.bb = [-.15, -.15, .15, .15, o.kind === 'mascot' ? 1.5 : .4]; this.mode = 'idle'; this.sp = o.kind; this.spd = o.spd || { penguin: .7, otter: .5, seal: .6, ray: .8, turtle: .45, mascot: .8 }[o.kind]; this.z0 = o.z; this.target = null;
    this.A = { penguin: single('c:pen', penguinStand, false), pswim: single('c:pswim', penguinSwim, false), otter: single('c:otter', otterFloat, false), seal: single('c:sealh', sealHead, false), sealrock: single('c:sealr', sealRock, false), mascot: single('c:mascot', mascotBase, false) }; this.I = o.kind === 'ray' ? iso('ray') : o.kind === 'turtle' ? iso('turtle') : null; this.h = 0; if (this.I) this.bb = [-.3, -.3, .3, .3, .1]; }
  sprite() { const f = this.moving || this.waving ? Math.floor(this.t * (this.kind === 'mascot' ? 3 : 5)) & 1 : (this.kind === 'otter' && Math.floor(this.t) % 5 === 0 ? 1 : 0); if (this.I) return this.I[this.h][Math.floor(this.t * 3) & 1]; const k = this.kind === 'penguin' && this.swim ? 'pswim' : this.kind === 'seal' && this.haul ? 'sealrock' : this.kind; return this.A[k][f][this.fl]; }
  goto(x, y) { this.tx = x; this.ty = y; this.wait = 0; }
  tick(dt) {
    this.t += dt; const T = this.target;
    if (T && !this.haul) { this.tx = T.x + (this.jx || 0); this.ty = T.y + (this.jy || 0); if (this.tx < this.x0) this.tx = this.x0; if (this.tx > this.x1) this.tx = this.x1; if (this.ty < this.y0) this.ty = this.y0; if (this.ty > this.y1) this.ty = this.y1; }
    const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy);
    if (d > .08) { const st = Math.min(d, this.spd * (T ? 2 : 1) * dt); this.x += dx / d * st; this.y += dy / d * st; this.moving = true; const sx = dx - dy; if (Math.abs(sx) > .05) this.fl = sx > 0 ? 0 : 1; if (this.I) this.h = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); }
    else { this.moving = false; if (!T && (this.wait -= dt) <= 0) { this.wait = this.kind === 'ray' || this.kind === 'turtle' ? rnd(0, 1.5) : rnd(2, 9); if (this.kind === 'seal') this.haul = this.rock && Math.random() < .35; if (this.haul) { this.tx = this.x = rnd(this.rock.x0, this.rock.x1); this.ty = this.y = rnd(this.rock.y0, this.rock.y1); this.wait = rnd(8, 20); } else { this.tx = rnd(this.x0, this.x1); this.ty = rnd(this.y0, this.y1); if (this.kind === 'seal' && this.rock && this.z !== this.z0) { this.x = this.tx; this.y = this.ty; } } } }
    const W = this.water; if (W) { this.swim = this.x >= W.x0 && this.x <= W.x1 && this.y >= W.y0 && this.y <= W.y1; this.z = this.swim ? W.z : this.z0; } else if (this.kind === 'seal') this.z = this.haul ? this.rock.z : this.z0;
    if (this.kind === 'otter') this.z = this.z0 + Math.sin(this.t * 2) * .02;
  }
}

/* ---------------- live wall tanks (2D sims painted on a sheared canvas) ---------------- */
const BG = { kelp: ['#1c5a6e', '#27788a', '#3a9aa4'], reef: ['#1a5c9a', '#2a7cc0', '#4aa4e0'], cafe: ['#1a5c9a', '#2a7cc0', '#4aa4e0'], seal: ['#1f5a78', '#2f7f9c', '#58aac0'], jelly: ['#0a0c2a', '#10123a', '#181a4a'], abyss: ['#04060e', '#080c1a', '#0c1226'], ocean: ['#0c2a50', '#123c6c', '#1a5088'] };
const CAST = {
  kelp: [['rockfish', 3, 0, .7], ['greenling', 2, 0, .8], ['perch', 9, 1, .45], ['garibaldi', 2, 0, .5], ['eel', 1, 2, .78], ['smelt', 12, 1, .25]],
  reef: [['tang', 3, 0, .4], ['ytang', 5, 1, .5], ['butterfly', 3, 0, .6], ['clown', 3, 0, .78], ['chromis', 14, 1, .3], ['anthias', 9, 1, .55], ['seahorse', 2, 2, .7]],
  cafe: [['ytang', 4, 1, .5], ['tang', 2, 0, .4], ['anthias', 10, 1, .5], ['chromis', 10, 1, .3], ['butterfly', 2, 0, .65]],
  seal: [['seal', 3, 0, .45], ['smelt', 10, 1, .35], ['perch', 4, 1, .6]],
  abyss: [['angler', 2, 0, .45], ['vampire', 1, 0, .3], ['lantern', 12, 1, .5], ['isopod', 2, 3, .93], ['octopus', 1, 2, .8]],
  ocean: [['sardine', 16, 1, .35], ['bass', 1, 0, .6]], jelly: [],
};
const JELLY = [{ name: 'moon', r: 5, c: [200, 220, 255] }, { name: 'nettle', r: 4, c: [255, 170, 90] }, { name: 'comb', r: 3, c: [160, 255, 230] }, { name: 'lion', r: 6, c: [255, 120, 150] }];
export function wallTank(o) {
  const W = Math.round(o.w * 16), H = Math.round(o.h * 16), kind = o.kind, pal = BG[kind], frame = o.frame === false ? 0 : 3;
  const buf = mk(W, H), bx = buf.getContext('2d'), out = mk(W, H + W / 2), ox = out.getContext('2d'); bx.imageSmoothingEnabled = false; ox.imageSmoothingEnabled = false;
  // static backdrop
  const bg = paint(W, H, (set, x) => {
    for (let y = 0; y < H; y++) { const t = y / H, c = kind === 'seal' || kind === 'kelp' || kind === 'reef' || kind === 'cafe' || kind === 'ocean' ? (t < .28 ? 2 : t < .62 ? 1 : 0) : (t < .3 ? 1 : t < .7 ? 0 : 0); set(0, y, pal[c], W, 1); if (y % 2 && (Math.abs(t - .28) < .05 || Math.abs(t - .62) < .05)) for (let xx = (y >> 1) & 1; xx < W; xx += 2) set(xx, y, pal[Math.max(0, c - (t > .28 ? 1 : 0) + (t < .28 ? 0 : 0))]); }
    if (kind !== 'jelly' && kind !== 'abyss') { for (let i = 0; i < W / 14; i++) { const x0 = 6 + i * 14 + ((i * 37) % 9); for (let y = 0; y < H * .6; y++) if ((y + i) % 3) set(x0 + Math.round(y * .35), y, kind === 'ocean' ? '#2a68a0' : '#ffffff22', 2, 1); } set(0, 0, '#e8fbff66', W, 1); }
    // floor: sand + rocks
    const fl = Math.round(H * (kind === 'jelly' ? 1 : .88)); const sand = kind === 'abyss' ? '#1a1c2a' : kind === 'ocean' ? '#3a5a80' : kind === 'seal' ? '#6a7a80' : '#d8c8a0';
    for (let xx = 0; xx < W; xx++) { const top = fl + Math.round(Math.sin(xx / 9) * 1.5 + Math.sin(xx / 23) * 2); set(xx, top, sand, 1, H - top); if (xx % 5 === 0) set(xx, top + 2, '#00000022', 2, 1); }
    const rockC = kind === 'abyss' ? ['#22243a', '#2c2e48'] : kind === 'ocean' ? ['#2a4468', '#34507a'] : ['#5a6670', '#7d8792'];
    for (let i = 0; i < W / 40 + 1; i++) { const cx = 14 + i * 41 + ((i * 53) % 17), rr = 7 + ((i * 29) % 9); ell(set, cx, fl + 1, rr, rr * .6, rockC[0]); ell(set, cx - 2, fl - 1, rr * .6, rr * .35, rockC[1]); }
    if (kind === 'reef' || kind === 'cafe') { const cc = ['#f0735a', '#f29ac0', '#f2c24a', '#a070d0', '#58c4a0', '#f08a3a']; for (let i = 0; i < W / 11; i++) { const cx = 5 + i * 11 + ((i * 31) % 7), c = cc[(i * 7) % 6], hgt = 5 + ((i * 13) % 11); if (i % 3 === 0) { for (let b = -2; b <= 2; b++) for (let j = 0; j < hgt - Math.abs(b) * 2; j++) set(cx + b * 2 + Math.round(b * j / 6), fl - j, j > hgt - 4 ? '#ffffff55' : c, 1, 1); } else if (i % 3 === 1) { ell(set, cx, fl - 3, 6, 4, c); set(cx - 3, fl - 5, '#ffffff44', 4, 1); } else for (let a = 0; a < 6; a++) { const an = -Math.PI * (a + .5) / 6; for (let j = 0; j < hgt * .8; j++) set(cx + Math.cos(an) * j, fl + Math.sin(an) * j, c); } } }
    if (kind === 'abyss') { for (let i = 0; i < 5; i++) { const cx = 20 + i * (W - 40) / 4; for (let j = 0; j < 14; j++) set(cx + Math.sin(j / 3 + i) * 2, fl - j, j > 10 ? '#58e0ff' : '#34405a', 2, 1); } ell(set, W * .5, fl - 4, 9, 5, '#2c2e48'); set(W * .5 - 2, fl - 12, '#3a3c58', 4, 8); }
    if (kind === 'kelp') { ell(set, W * .78, fl - 5, 12, 8, '#4a5660'); ell(set, W * .78 + 3, fl - 4, 5, 3, '#141c24'); }
    if (kind === 'seal') { for (let xx = 0; xx < W; xx++) if ((xx >> 1) % 3 === 0) set(xx, 1 + ((xx >> 2) & 1), '#e8fbff'); }
  });
  // glass + frame overlay
  const over = paint(W, H, set => { if (frame) { set(0, 0, '#0c1a2c', W, frame); set(0, H - frame, '#0c1a2c', W, frame); set(0, 0, '#0c1a2c', frame, H); set(W - frame, 0, '#0c1a2c', frame, H); set(frame, frame, '#58c4dc', W - 2 * frame, 1); for (let x = 64; x < W - 20; x += 64) set(x, 0, '#0c1a2c', 2, H); } for (let i = 0; i < W / 50; i++) { const x0 = 12 + i * 50; for (let j = 0; j < 14; j++) if (j % 2) set(x0 + j, 8 + (14 - j), '#ffffff40', 2, 1); } });
  // cast
  const fish = [], cast = CAST[kind] || [], fl = H * .88;
  cast.forEach(([sp, n, mode, lvl], si) => { const F = flat(sp), sc = { cx: rnd(20, W - 20), cy: lvl * H, vx: rnd(-1, 1) > 0 ? 6 : -6, vy: 0, t: rnd(0, 9) }; for (let i = 0; i < n; i++) fish.push({ sp, F, mode, sc, x: rnd(12, W - 12), y: mode === 3 ? fl - 2 : lvl * H + rnd(-8, 8), vx: (Math.random() < .5 ? -1 : 1) * rnd(4, 9) * (sp === 'seal' ? 2.4 : 1), vy: 0, t: rnd(0, 9), lvl: lvl * H, ox: rnd(-16, 16), oy: rnd(-9, 9), hw: F[0][0].width >> 1, hh: F[0][0].height >> 1, hx: rnd(20, W - 20) }); });
  const kelp = kind === 'kelp' ? Array.from({ length: Math.round(W / 16) }, (_, i) => ({ x: 6 + i * 16 + rnd(-4, 4), h: H * rnd(.5, .85), ph: rnd(0, 6) })) : [];
  const jel = kind === 'jelly' ? Array.from({ length: Math.round(W / 10) }, (_, i) => { const k = JELLY[i % 4]; return { k, x: rnd(8, W - 8), y: rnd(8, H - 14), ph: rnd(0, 6), sp: rnd(.6, 1.2), dx: rnd(-1.5, 1.5) }; }) : [];
  const bub = Array.from({ length: kind === 'abyss' ? 14 : 7 }, () => ({ x: rnd(4, W - 4), y: rnd(0, H), s: rnd(5, 12) }));
  let T = rnd(0, 20), feedT = 0, hue = rnd(0, 360);
  const ent = { x: o.x, y: o.y, z: o.z || 0, hidden: false, sprite: null, tank: null };
  if (o.axis === 'x') { ent.bb = [0, 0, .06, o.w, o.h]; ent.x = o.x; ent.y = o.y; const s = { c: out, l: out, x: -W, y: -H, w: W, h: H + W / 2 }; ent.sprite = () => s; }
  else { ent.bb = [0, 0, o.w, .06, o.h]; const s = { c: out, l: out, x: 0, y: -H, w: W, h: H + W / 2 }; ent.sprite = () => s; }
  function update(dt) {
    T += dt; if (feedT > 0) feedT -= dt; bx.drawImage(bg, 0, 0);
    if (kind === 'jelly') { hue = (hue + dt * 14) % 360; bx.fillStyle = `hsla(${hue}, 80%, 45%, .28)`; bx.fillRect(frame, frame, W - 2 * frame, H - 2 * frame);
      for (const j of jel) { const p = (Math.sin(T * j.sp * 2 + j.ph) + 1) / 2; j.y -= (p > .6 ? 5 : -1.2) * dt * j.sp; j.x += Math.sin(T * .3 + j.ph) * dt * 2 + j.dx * dt; if (j.y < 6) { j.y = 6; j.sp = -Math.abs(j.sp); } if (j.y > H - 16) j.sp = Math.abs(j.sp); if (j.sp < 0 && j.y > H * .6) j.sp = Math.abs(j.sp); if (j.x < 8 || j.x > W - 8) j.dx = -j.dx;
        const r = j.k.r, rw = r * (1 + (1 - p) * .25), rh = r * (.6 + p * .3), c = j.k.c, hs = `hsl(${(hue + j.k.r * 40) % 360}, 90%, 78%)`, X = Math.round(j.x), Y = Math.round(j.y);
        bx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},.55)`; for (let yy = 0; yy <= rh; yy++) { const hw = Math.round(rw * Math.sqrt(1 - (1 - yy / rh) ** 2)); bx.fillRect(X - hw, Y - Math.round(rh) + yy, hw * 2 + 1, 1); }
        bx.fillStyle = hs; bx.fillRect(X - Math.round(rw * .6), Y - Math.round(rh), Math.round(rw * 1.2), 1); bx.fillRect(X - Math.round(rw), Y, Math.round(rw) * 2 + 1, 1);
        bx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},.7)`; for (let k = -2; k <= 2; k++) { const len = r + 3 + (k & 1) * 3; for (let yy = 1; yy < len; yy += 1) bx.fillRect(X + k * Math.max(1, Math.round(rw / 2.6)) + Math.round(Math.sin(yy / 2.5 + T * 3 + k + j.ph) * 1.2), Y + yy, 1, 1); } } }
    for (const k of kelp) { for (let y = 0; y < k.h; y += 1) { const sw = Math.sin(y / 9 + T * 1.3 + k.ph) * (2 + y / k.h * 4); bx.fillStyle = (y >> 2) & 1 ? '#5f8a3a' : '#4a7a34'; bx.fillRect(Math.round(k.x + sw), Math.round(fl - y), 2, 1); if (y % 8 === 3) { bx.fillStyle = '#7aa848'; bx.fillRect(Math.round(k.x + sw) + ((y >> 3) & 1 ? 2 : -3), Math.round(fl - y) - 1, 3, 2); } } }
    // schools drift
    for (const f of fish) { const sc = f.sc; if (f.mode === 1 && f === fish.find(q => q.sc === sc)) { sc.t += dt; sc.cx += sc.vx * dt; sc.cy += Math.sin(sc.t * .7) * 3 * dt; if (sc.cx < 22) sc.vx = Math.abs(sc.vx); if (sc.cx > W - 22) sc.vx = -Math.abs(sc.vx); if (feedT > 0) { sc.cx += (W / 2 - sc.cx) * dt * .8; } } }
    for (const f of fish) { f.t += dt;
      if (f.mode === 1) { const tx = f.sc.cx + f.ox + Math.sin(f.t * .8) * 4, ty = f.sc.cy + f.oy + Math.cos(f.t * 1.1) * 3; f.vx += ((tx - f.x) * 1.4 + f.sc.vx * .6 - f.vx) * dt * 2; f.vy += ((ty - f.y) * 1.2 - f.vy) * dt * 2; }
      else if (f.mode === 0) { f.vy += ((f.lvl + Math.sin(f.t * .5) * 6 - f.y) * .8 - f.vy) * dt; if (feedT > 0) f.vx += Math.sign(W / 2 - f.x) * dt * 6; if (f.x < 14) f.vx = Math.abs(f.vx); if (f.x > W - 14) f.vx = -Math.abs(f.vx); if (Math.random() < dt * .04) f.vx = -f.vx; }
      else if (f.mode === 3) { f.vy = 0; if (f.x < 14) f.vx = Math.abs(f.vx); if (f.x > W - 14) f.vx = -Math.abs(f.vx); f.vx = Math.sign(f.vx) * 2.5; }
      else { f.vx = 0; f.vy = 0; f.x = f.hx + Math.sin(f.t * .4) * 2; f.y = f.lvl + Math.sin(f.t * .9) * 1.5; }
      f.x += f.vx * dt; f.y += f.vy * dt; if (f.y < 6) f.y = 6; if (f.y > fl - 1) f.y = fl - 1;
      bx.drawImage(f.F[Math.floor(f.t * (f.mode === 1 ? 5 : 3)) & 1][f.vx < 0 ? 1 : 0], Math.round(f.x) - f.hw, Math.round(f.y) - f.hh); }
    bx.fillStyle = '#dff6ff'; for (const b of bub) { b.y -= b.s * dt; if (b.y < 2) { b.y = H - 4; b.x = rnd(4, W - 4); } bx.fillRect(Math.round(b.x + Math.sin(b.y / 6) * 1.5), Math.round(b.y), 1, 1); }
    bx.drawImage(over, 0, 0);
    ox.setTransform(1, 0, 0, 1, 0, 0); ox.clearRect(0, 0, W, H + W / 2); if (o.axis === 'x') ox.setTransform(1, -.5, 0, 1, 0, W / 2); else ox.setTransform(1, .5, 0, 1, 0, 0); ox.drawImage(buf, 0, 0);
  }
  update(0);
  return { ent, update, feed(sec = 10) { feedT = sec; }, species: cast.map(c => c[0]).concat(kind === 'jelly' ? JELLY.map(j => j.name) : []), kind };
}

/* ---------------- the big cylinder ---------------- */
export function bigTank(o) {
  const r = o.r, rx = Math.round(r * 16 * 1.414), ry = rx >> 1, HP = Math.round(o.h * 16), W = rx * 2 + 2, H = HP + ry * 2 + 2, cx = rx + 1, base = H - ry - 1;
  const out = mk(W, H), x = out.getContext('2d'); x.imageSmoothingEnabled = false;
  const inside = (X, Y) => { const k = (X - cx) / rx; if (Math.abs(k) > 1) return false; const e = ry * Math.sqrt(1 - k * k); return Y >= base - HP - e && Y <= base + e; };
  const bg = paint(W, H, set => { for (let X = 0; X < W; X++) for (let Y = 0; Y < H; Y++) if (inside(X, Y)) { const t = (base + ry - Y) / (HP + ry * 2), k = (X - cx) / rx; set(X, Y, t > .8 ? ((X + Y) & 1 && t < .86 ? '#2a7cc0' : '#4aa4e0') : t > .45 ? (k > .45 ? '#2470b0' : '#2a7cc0') : (k > .45 ? '#175088' : (X + Y) & 1 && t > .4 ? '#2a7cc0' : '#1a5c9a')); }
    for (let i = 0; i < 6; i++) { const x0 = cx - rx + 12 + i * (rx / 3); for (let y = 0; y < HP * .55; y++) if (y % 3) set(x0 + y * .3, base - HP - ry * .4 + y, '#ffffff1c', 2, 1); }
    ell(set, cx, base + ry * .35, rx * .8, ry * .55, '#d8c8a0'); });
  const colm = paint(W, H, set => { for (let z = 0; z < HP * .78; z++) { const w = 9 + Math.sin(z / 9) * 3 + (z < 12 ? (12 - z) * .8 : 0) - z * .04; set(cx - w, base - z, z % 7 < 2 ? '#4a5660' : '#5a6670', w * 2, 1); set(cx - w, base - z, '#7d8792', 3, 1); } const cc = ['#f0735a', '#f29ac0', '#f2c24a', '#a070d0', '#58c4a0']; for (let i = 0; i < 16; i++) { const z = 6 + i * (HP * .7 / 16), sd = i % 2 ? 1 : -1, w = 9 + Math.sin(z / 9) * 3; ell(set, cx + sd * (w + 1), base - z, 4, 3, cc[i % 5]); set(cx + sd * (w + 1) - 1, base - z - 2, '#ffffff66', 2, 1); } ell(set, cx, base - HP * .78, 8, 4, '#58c4a0'); });
  const over = paint(W, H, set => { for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) { if (!inside(X, Y)) continue; const k = (X - cx) / rx, e = ry * Math.sqrt(1 - k * k), a = Math.asin(k); if (Math.abs((((a / Math.PI * 6) % 1) + 1) % 1 - .5) > .47 && (!inside(X, Y - 1) || Y > base - HP + e)) set(X, Y, '#cfe6f0'); else if (Y > base + e - 3 || (Y < base - HP + e + 2 && Y > base - HP + e - 1)) set(X, Y, '#e8fbff'); else if (k < -.55 && k > -.72 && (X + Y) % 3 === 0 && Y > base - HP + e + 6) set(X, Y, '#ffffff55'); else if (k > .93 || k < -.95) set(X, Y, '#bfeaf6'); }
    for (let X = 0; X < W; X++) { const k = (X - cx) / rx; if (Math.abs(k) > 1) continue; const e = ry * Math.sqrt(1 - k * k); set(X, base - HP - e, '#16324f', 1, 2); } });
  const cast = [['ytang', 7], ['tang', 4], ['anthias', 12], ['chromis', 16], ['butterfly', 4], ['perch', 8]], fish = [];
  for (const [sp, n] of cast) { const F = flat(sp), band = rnd(.25, .8); for (let i = 0; i < n; i++) fish.push({ F, a: rnd(0, 6.28), rho: rnd(.35, .9) * r, z: (band + rnd(-.18, .18)) * o.h, w: (Math.random() < .8 ? 1 : -1) * rnd(.18, .4), t: rnd(0, 9), hw: F[0][0].width >> 1, hh: F[0][0].height >> 1, z0: 0 }); }
  for (const f of fish) f.z0 = f.z;
  const DV = [0, 1].map(f => { const c = diverBase(f, 0); return [c, flipC(c)]; }), DW = [0, 1].map(f => diverBase(f, 1));
  const dv = { on: false, a: 2.3, z: o.h * .55, wave: 0, t: 0, alpha: 0 }; let feeding = 0;
  const ent = { x: o.x, y: o.y, z: o.z, bb: [-r, -r, r, r, o.h], sprite: () => S }, S = { c: out, l: null, x: -cx, y: -base, w: W, h: H };
  const pos = (a, rho, z) => [cx + rho * (Math.cos(a) - Math.sin(a)) * 16, base - z * 16 + rho * (Math.cos(a) + Math.sin(a)) * 8, Math.cos(a) + Math.sin(a)];
  function update(dt) {
    x.clearRect(0, 0, W, H); x.drawImage(bg, 0, 0); if (feeding > 0) feeding -= dt;
    dv.t += dt; if (dv.on || dv.alpha > 0) { dv.alpha = Math.max(0, Math.min(1, dv.alpha + (dv.on ? dt : -dt))); if (dv.wave > 0) { dv.wave -= dt; dv.a += ((Math.PI / 4) - dv.a) * Math.min(1, dt * 1.5); dv.z += (o.h * .42 - dv.z) * dt; } else { dv.a = (dv.a + dt * .22) % 6.283; dv.z = o.h * (.5 + Math.sin(dv.t * .3) * .2); } }
    const dp = pos(dv.a, r * .8, dv.z);
    const drawF = front => { for (const f of fish) { const p = pos(f.a, f.rho, f.z); if ((p[2] > 0) !== front) continue; const dir = (-Math.sin(f.a) - Math.cos(f.a)) * f.w; x.drawImage(f.F[Math.floor(f.t * 4) & 1][dir < 0 ? 1 : 0], Math.round(p[0]) - f.hw, Math.round(p[1]) - f.hh); } };
    for (const f of fish) { f.t += dt; f.a += f.w * dt; if (feeding > 0 && dv.alpha > .5) { let da = dv.a - f.a; da = Math.atan2(Math.sin(da), Math.cos(da)); f.a += da * dt * .8 - f.w * dt * .8; f.z += (dv.z + Math.sin(f.t) * .4 - f.z) * dt * .6; } else f.z += (f.z0 + Math.sin(f.t * .6) * .25 - f.z) * dt; }
    x.globalAlpha = .7; drawF(false); x.globalAlpha = 1; if (dv.alpha > 0 && dp[2] <= 0) { x.globalAlpha = dv.alpha * .7; x.drawImage(DV[Math.floor(dv.t * 3) & 1][0], Math.round(dp[0]) - 13, Math.round(dp[1]) - 9); x.globalAlpha = 1; }
    x.drawImage(colm, 0, 0); drawF(true);
    if (dv.alpha > 0 && dp[2] > 0) { x.globalAlpha = dv.alpha; if (dv.wave > 0) x.drawImage(DW[Math.floor(dv.t * 4) & 1], Math.round(dp[0]) - 13, Math.round(dp[1]) - 9); else x.drawImage(DV[Math.floor(dv.t * 3) & 1][Math.cos(dv.a) + Math.sin(dv.a) > 0 && -Math.sin(dv.a) - Math.cos(dv.a) < 0 ? 1 : 0], Math.round(dp[0]) - 13, Math.round(dp[1]) - 9); x.fillStyle = '#e8fbff'; for (let i = 0; i < 5; i++) x.fillRect(Math.round(dp[0] + 6 + Math.sin(dv.t * 3 + i) * 2), Math.round(dp[1] - 10 - ((dv.t * 14 + i * 9) % 44)), 1 + (i & 1), 1 + (i & 1)); x.globalAlpha = 1; }
    x.drawImage(over, 0, 0);
  }
  update(0);
  return { ent, update, diver(on) { dv.on = !!on; if (on && dv.alpha <= 0) { dv.a = 2.3; } }, wave(sec = 6) { if (dv.on) dv.wave = sec; return dv.on; }, diverOn: () => dv.on && dv.alpha > .5, feed(sec = 20) { feeding = sec; }, isWaving: () => dv.wave > 0 };
}
export { single, mascotBase, pick, rnd };
