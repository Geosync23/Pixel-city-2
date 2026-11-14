// Instrument pixel kits for the orchestra sprites + small stage props (private helper; used by src/scenes/rooms/performance.js).
// drawKit(kind, mode, playing, f) paints in sprite pixel space around the character anchor PW(0,0,0) (seat surface when seated, feet when
// standing), for a front-facing (dir 1) player. mode: 'play' (the part the musician holds / moves), 'inst' (a free-standing instrument:
// timpani, harp, double bass, snare), 'carry' (walking on with it). kinds: vln vla vc cb fl ob cl bsn hn tpt tbn tuba timp perc harp cond.
import { PW, rect, line, box, qy, qz, lw, cyl, lit, glow, spx, dk, lt } from '../../engine/raster.js';
const W1 = '#b8642a', W2 = '#9a4a20', W3 = '#7a3a1a', GOLD = '#e8b848', GD = '#b8862a', COP = '#b86a3a', BOW = '#f0e8d0', BLK = '#1e1a22', SIL = '#d8dce4', NECK = '#3a2418';
export const KIT_SB = [-22, -42, 22, 14];
export function drawKit(kind, mode, playing, f) {
  const s = PW(0, 0, 0), X = Math.round(s[0]), Y = Math.round(s[1]), P = (dx, dy, w, h, c) => rect(X + dx, Y + dy, w, h, c), L = (ax, ay, bx, by, c) => line([X + ax + .5, Y + ay + .5], [X + bx + .5, Y + by + .5], c);
  f = f | 0;
  if (mode === 'carry') { const c = { vln: W1, vla: W1, vc: W2, fl: SIL, ob: NECK, cl: BLK, bsn: W3, hn: GOLD, tpt: GOLD, tbn: GOLD, tuba: GOLD }[kind]; if (!c) return; if (kind === 'vc' || kind === 'tuba') { P(5, -12, 4, 8, c); P(6, -16, 1, 4, kind === 'vc' ? NECK : c); } else if (kind === 'bsn' || kind === 'tbn') P(6, -17, 1, 12, c); else P(5, -9, 2, 5, c); return; }
  if (mode === 'inst') {
    if (kind === 'timp') { for (const dx of [-11, 2]) { P(dx, -12, 9, 1, '#f4ecd8'); P(dx, -11, 9, 4, COP); P(dx + 1, -7, 7, 1, dk(COP, .2)); P(dx + 2, -6, 5, 1, dk(COP, .3)); P(dx + 1, -5, 1, 5, '#6a6a74'); P(dx + 7, -5, 1, 5, '#6a6a74'); P(dx, -11, 1, 4, lt(COP, .3)); } }
    else if (kind === 'perc') { P(8, -11, 7, 1, '#f4ecd8'); P(8, -10, 7, 3, '#c8c0b0'); P(8, -9, 7, 1, '#c0392b'); P(11, -7, 1, 7, '#6a6a74'); L(9, 0, 13, 0, '#6a6a74'); }
    else if (kind === 'harp') { P(-10, -22, 2, 24, GOLD); P(-10, -23, 3, 2, GD); L(-8, -21, -2, -18, GOLD); L(-2, -18, 1, -15, GOLD); L(1, -15, -8, 1, GD); L(0, -14, -9, 2, GD); for (let i = 0; i < 4; i++) L(-7 + i * 2, -19 + i, -7 + i * 2, -2 - i * 3, '#f4f0e0'); P(-11, 1, 5, 2, GD); }
    else if (kind === 'cb') { P(4, -12, 7, 10, W3); P(5, -14, 5, 2, W3); P(4, -8, 1, 2, dk(W3, .3)); P(10, -8, 1, 2, dk(W3, .3)); P(7, -24, 1, 10, NECK); P(6, -25, 3, 2, NECK); P(7, -2, 1, 3, '#8a8a94'); P(6, -10, 1, 5, dk(W3, .35)); P(8, -10, 1, 5, dk(W3, .35)); }
    return;
  }
  // mode 'play'
  if (kind === 'vln' || kind === 'vla') { const c = kind === 'vla' ? W2 : W1; if (playing) { P(-7, -7, 4, 2, c); P(-8, -6, 3, 2, c); P(-10, -8, 2, 1, NECK); L(-11 + f * 3, -10, -3 + f * 3, -4, BOW); } else { P(-3, -1, 6, 2, c); P(3, -2, 3, 1, NECK); P(6, -8, 1, 8, BOW); } }
  else if (kind === 'vc') { P(-1, -3, 5, 8, W2); P(-2, -1, 1, 3, W2); P(4, -1, 1, 3, W2); P(0, 0, 3, 1, dk(W2, .3)); P(1, -11, 1, 8, NECK); P(0, -12, 3, 1, NECK); P(1, 5, 1, 3, '#8a8a94'); if (playing) P(-6 + f * 4, 1, 9, 1, BOW); else P(6, -4, 1, 8, BOW); }
  else if (kind === 'cb') { if (playing) P(0 + f * 3, -7, 10, 1, BOW); }
  else if (kind === 'fl') { if (playing) { P(-1, -8, 9, 1, SIL); P(3 + f, -7, 1, 1, '#8a9098'); } else P(-3, 0, 7, 1, SIL); }
  else if (kind === 'ob' || kind === 'cl') { const c = kind === 'ob' ? '#4a2a1a' : BLK; if (playing) { L(0, -6, 1, 0, c); P(0, -4 + f, 1, 1, SIL); P(1, -2, 1, 1, SIL); if (kind === 'cl') P(0, 1, 3, 1, c); } else { P(4, -7, 1, 7, c); P(4, -5, 1, 1, SIL); } }
  else if (kind === 'bsn') { L(-3, 4, 4, -14, W3); L(-2, 4, 5, -14, W3); P(4, -15, 2, 1, SIL); if (playing) { L(2, -9, 0, -7, SIL); P(1, -4 + f * 2, 1, 1, SIL); } }
  else if (kind === 'hn') { const y = playing ? -6 : -4; P(1, y, 5, 5, GOLD); P(2, y + 1, 3, 3, GD); P(5, y + 2, 3, 3, lt(GOLD, .3)); if (playing) P(0, -7, 2, 1, GOLD); }
  else if (kind === 'tpt') { if (playing) { P(0, -8, 8, 1, GOLD); P(2, -7, 3, 2, GD); P(8, -9, 1, 3, lt(GOLD, .3)); P(3 + f, -9, 1, 1, SIL); } else { P(-2, -1, 7, 1, GOLD); P(0, 0, 3, 1, GD); P(5, -2, 1, 3, lt(GOLD, .3)); } }
  else if (kind === 'tbn') { if (playing) { P(0, -8, 9 + f * 3, 1, GOLD); P(1, -6, 6 + f * 3, 1, GD); P(-3, -9, 3, 1, GOLD); P(-4, -11, 2, 4, lt(GOLD, .3)); } else { P(5, -12, 1, 12, GOLD); P(4, -13, 3, 2, lt(GOLD, .3)); } }
  else if (kind === 'tuba') { P(0, -5, 6, 7, GOLD); P(1, -4, 4, 5, GD); P(1, -9, 4, 4, GOLD); P(0, -12, 6, 3, lt(GOLD, .3)); P(1, -12, 4, 1, GD); if (playing) P(2 + f, -3, 1, 1, SIL); }
  else if (kind === 'timp') { if (playing) { if (f % 2) { L(-3, -13, -7, -13, BOW); L(3, -16, 7, -19, BOW); P(-8, -14, 2, 2, '#f4ecd8'); } else { L(-3, -16, -7, -19, BOW); L(3, -13, 7, -13, BOW); P(7, -14, 2, 2, '#f4ecd8'); } } else { L(-3, -12, -6, -15, BOW); L(3, -12, 6, -15, BOW); } }
  else if (kind === 'perc') { if (playing) { if (f % 2) { P(-2, -17, 2, 8, GOLD); P(1, -17, 2, 8, lt(GOLD, .3)); } else { P(-9, -16, 2, 8, GOLD); P(8, -16, 2, 8, lt(GOLD, .3)); } } else { P(-6, -10, 1, 6, GOLD); P(6, -10, 1, 6, GOLD); } }
  else if (kind === 'harp') { if (playing) { P(-5, -8 - (f % 3) * 2, 1, 1, '#f0c8a0'); P(-3, -4 - ((f + 1) % 3) * 2, 1, 1, '#f0c8a0'); } }
  else if (kind === 'cond') { const b = [[9, -19], [10, -13], [7, -10], [3, -17]][f % 4]; if (playing) { L(5, -13, b[0], b[1], '#f8f4ea'); P(-6, -13 - (f % 2), 1, 2, '#f0c8a0'); } else L(5, -9, 8, -6, '#f8f4ea'); }
}
/** stage props, drawn with world-space primitives around the origin. kinds: bucket banana bench lamp letter mop case */
export const PROP_SB = [-26, -44, 26, 14];
export function drawProp(kind) {
  if (kind === 'bucket') { cyl(0, 0, 0, .18, .3, '#8a94a4', { t: '#5a9ac0' }); lw([-.18, 0, .3], [0, 0, .5], '#6a6a74'); lw([.18, 0, .3], [0, 0, .5], '#6a6a74'); }
  else if (kind === 'banana') { spx(0, 0, .02, -1, 0, '#f6e04a'); spx(0, 0, .02, 0, 0, '#f6e04a'); spx(0, 0, .02, 1, -1, '#f6e04a'); spx(0, 0, .02, 2, -1, '#c8a020'); spx(0, 0, .02, -2, -1, '#c8a020'); }
  else if (kind === 'bench') { box(-.9, -.25, .28, 1.8, .5, .07, '#7a5030', { t: '#8a5c38' }); box(-.9, -.3, .35, 1.8, .07, .45, '#7a5030'); for (const x of [-.8, .8]) { lw([x, -.2, 0], [x, -.2, .28], '#2a2a34'); lw([x, .2, 0], [x, .2, .28], '#2a2a34'); } }
  else if (kind === 'lamp') { lw([0, 0, 0], [0, 0, 2.1], '#2a2a34'); lw([.02, 0, 0], [.02, 0, 2.1], '#3a3a44'); box(-.15, -.15, 2.1, .3, .3, .25, '#2a2a34'); lit(() => { qy(-.1, .1, .15, 2.12, 2.3, '#ffe6a0'); }); glow(() => qz(-.5, .5, -.3, .7, .01, '#ffe6a0', 'glass')); }
  else if (kind === 'letter') { box(-.1, -.07, .6, .2, .14, .02, '#f8f4ea', { ol: false }); spx(0, 0, .62, 0, 0, '#c0392b'); }
  else if (kind === 'mop') { lw([0, 0, 0], [0, 0, 1.3], '#b8905a'); for (let i = -2; i <= 2; i++) spx(0, 0, .08, i, 0, '#e8e4dc'); for (let i = -1; i <= 1; i++) spx(0, 0, .16, i, 0, '#d8d4cc'); }
  else if (kind === 'case') { box(-.2, -.1, 0, .4, .2, .35, '#8a5a3a', { t: '#9a6a48' }); lw([-.08, .1, .35], [.08, .1, .42], '#3a2a1a'); spx(0, .1, .18, 0, 0, '#e8b848'); }
}
