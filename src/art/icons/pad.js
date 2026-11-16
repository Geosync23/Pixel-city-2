// Controller button glyphs (owner msg 143): small pixel-art pictures of the buttons, in four sets chosen from the pad that is plugged in.
//   padGlyph(name, style) -> a cached canvas (13 px tall; face buttons 13 wide, shoulder pills 19). Draw it scaled by whole numbers (image-rendering: pixelated).
//   name:  'south' 'east' 'west' 'north' (the four face buttons BY POSITION), 'l1' 'r1' (bumpers), 'l2' 'r2' (triggers), 'start' 'select',
//          'ls' 'rs' (move a stick), 'l3' 'r3' (click a stick), 'dpad' 'dup' 'ddown' 'dleft' 'dright' 'dlr' 'dud'
//   style: 'xbox' (A B X Y, coloured), 'ps' (cross circle square triangle), 'switch' (B A Y X: Nintendo prints them the other way round),
//          'generic' (no letters at all: a little diamond of four dots with the one to press filled in. Used whenever the pad's make is unknown.)
// Not an asset list: this module only exports functions (the art index imports it like every file in src/art).
const OL = '#2a2733', CREAM = '#fff4dc', SHADE = '#d9c9a6', DARK = '#3a3644';
const F = {   // 3x5 pixel letters
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'], Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  L: ['#..', '#..', '#..', '#..', '###'], R: ['##.', '#.#', '##.', '#.#', '#.#'], T: ['###', '.#.', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
};
const SHAPE = {   // 7x7 PlayStation symbols
  cross: ['#.....#', '.#...#.', '..#.#..', '...#...', '..#.#..', '.#...#.', '#.....#'], circle: ['..###..', '.#...#.', '#.....#', '#.....#', '#.....#', '.#...#.', '..###..'],
  square: ['#######', '#.....#', '#.....#', '#.....#', '#.....#', '#.....#', '#######'], tri: ['...#...', '...#...', '..#.#..', '..#.#..', '.#...#.', '.#...#.', '#######'],
  menu: ['.......', '#######', '.......', '#######', '.......', '#######', '.......'], view: ['.####..', '.#..#..', '.#.####', '.###..#', '...#..#', '...####', '.......'],
  plus: ['.......', '...#...', '...#...', '.#####.', '...#...', '...#...', '.......'], minus: ['.......', '.......', '.......', '.#####.', '.......', '.......', '.......'],
};
const cache = new Map();
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function stamp(g, rows, x, y, col) { g.fillStyle = col; rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') g.fillRect(x + i, y + j, 1, 1); }); }
function text(g, s, cx, y, col) { const w = s.length * 4 - 1; let x = Math.round(cx - w / 2); for (const ch of s) { stamp(g, F[ch] || F.A, x, y, col); x += 4; } }
function disc(g, fill, cx = 6, cy = 6, r = 6.3, hi = true) {
  for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) { const d = Math.hypot(x - cx, y - cy); if (d > r) continue; g.fillStyle = d > r - 1.05 ? OL : fill; g.fillRect(x, y, 1, 1); }
  if (hi) { g.fillStyle = '#ffffff50'; g.fillRect(cx - 2, cy - r + 1.3 | 0, 4, 1); }
}
function pill(g, w, fill) { g.fillStyle = OL; g.fillRect(1, 1, w - 2, 11); g.fillRect(0, 3, w, 7); g.fillStyle = fill; g.fillRect(2, 2, w - 4, 9); g.fillRect(1, 4, w - 2, 5); g.fillStyle = '#ffffff60'; g.fillRect(3, 2, w - 6, 1); }
const FACE = {
  xbox: { south: ['A', '#2f9e44', CREAM], east: ['B', '#e05a3a', CREAM], west: ['X', '#3b5bdb', CREAM], north: ['Y', '#f2c230', OL] },
  switch: { south: ['B', CREAM, OL], east: ['A', CREAM, OL], west: ['Y', CREAM, OL], north: ['X', CREAM, OL] },
  ps: { south: ['cross', DARK, '#8fb4ff'], east: ['circle', DARK, '#ff7a66'], west: ['square', DARK, '#f7a3c4'], north: ['tri', DARK, '#6fe0a0'] },
};
const POS = { south: [6, 9], east: [9, 6], west: [3, 6], north: [6, 3] };
const SH = { xbox: { l1: 'LB', r1: 'RB', l2: 'LT', r2: 'RT' }, ps: { l1: 'L1', r1: 'R1', l2: 'L2', r2: 'R2' }, switch: { l1: 'L', r1: 'R', l2: 'ZL', r2: 'ZR' }, generic: { l1: 'L', r1: 'R', l2: 'LT', r2: 'RT' } };
function draw(name, style) {
  if (POS[name]) {
    const c = mk(13, 13), g = c.getContext('2d'), f = FACE[style] && FACE[style][name];
    if (!f) { disc(g, CREAM); for (const k in POS) { const p = POS[k], on = k === name; g.fillStyle = on ? '#e05a3a' : '#b9ab8c'; g.fillRect(p[0] - 1, p[1] - 1, 3, 3); if (on) { g.fillStyle = OL; g.fillRect(p[0], p[1], 1, 1); } } return c; }
    disc(g, f[1]); if (SHAPE[f[0]]) stamp(g, SHAPE[f[0]], 3, 3, f[2]); else text(g, f[0], 6.5, 4, f[2]); return c;
  }
  if (/^[lr][12]$/.test(name)) { const s = (SH[style] || SH.generic)[name], c = mk(s.length > 1 ? 19 : 15, 13), g = c.getContext('2d'); pill(g, c.width, name[1] === '2' ? SHADE : CREAM); text(g, s, c.width / 2, 4, OL); return c; }
  if (name === 'start' || name === 'select') { const c = mk(13, 13), g = c.getContext('2d'); disc(g, style === 'ps' || style === 'xbox' ? DARK : CREAM, 6, 6, 6.3, false); stamp(g, SHAPE[style === 'switch' ? (name === 'start' ? 'plus' : 'minus') : name === 'start' ? 'menu' : 'view'], 3, 3, style === 'ps' || style === 'xbox' ? CREAM : OL); return c; }
  if (/^[lr][s3]$/.test(name)) { const c = mk(13, 13), g = c.getContext('2d'); disc(g, SHADE, 6, 6, 6.3, false); disc(g, DARK, 6, 6, 4.3, false); text(g, name[0].toUpperCase(), 6.5, 4, CREAM); if (name[1] === '3') { g.fillStyle = '#e05a3a'; g.fillRect(5, 11, 3, 1); g.fillRect(6, 12, 1, 1); } return c; }
  /* the D-pad: a plus with the arm(s) to press lit */
  const c = mk(13, 13), g = c.getContext('2d'); g.fillStyle = OL; g.fillRect(4, 0, 5, 13); g.fillRect(0, 4, 13, 5); g.fillStyle = SHADE; g.fillRect(5, 1, 3, 11); g.fillRect(1, 5, 11, 3);
  const lit = { dup: ['u'], ddown: ['d'], dleft: ['l'], dright: ['r'], dlr: ['l', 'r'], dud: ['u', 'd'], dpad: [] }[name] || []; g.fillStyle = '#e05a3a';
  for (const a of lit) { if (a === 'u') g.fillRect(5, 1, 3, 4); if (a === 'd') g.fillRect(5, 8, 3, 4); if (a === 'l') g.fillRect(1, 5, 4, 3); if (a === 'r') g.fillRect(8, 5, 4, 3); }
  return c;
}
export function padGlyph(name, style = 'generic') { const k = name + '|' + style; let c = cache.get(k); if (!c) cache.set(k, c = draw(name, style)); return c; }
export const PAD_GLYPHS = ['south', 'east', 'west', 'north', 'l1', 'r1', 'l2', 'r2', 'start', 'select', 'ls', 'rs', 'l3', 'r3', 'dpad', 'dup', 'ddown', 'dleft', 'dright', 'dlr', 'dud'];
export const PAD_STYLES = ['xbox', 'ps', 'switch', 'generic'];
