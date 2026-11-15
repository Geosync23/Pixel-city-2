// Maple Bay Arena — the bowl. ids furn.arena.* (the concourse, backstage and city pieces live in arena.js; helpers in _arena_lib.js)
//   tier {len, z, c, aisles, rev, sec, last}  one row of a stand: concrete step + plastic seats (the fans are painted live by the room)
//   bowlwall {w, kind: 'plain'|'suite'|'banners'|'tunnel'|'press', text, name}  upper wall of the bowl: LED ribbon, suites, rafter banners (name = the honorary banner)
//   hoop {e}   basket on a padded stanchion (e: the east one, seen from behind)      bench {n, c}  team bench      chairs {n, c, rev}  courtside folding chairs
//   table {w, text, f}  scorer's table with LED front      adboard {w, text, f}      jumbo  the scoreboard housing (screens are live entities)      camera   ballrack   cannon
//   stage {f, c, c2, name}  concert stage + LED wall + truss      stageprop {kind: 'drums'|'keys'|'amp'|'mic'}      ramp   scrapcar {c, flat}      spot (follow-spot tower)
//   veh.arena.minitruck {c, dir, name}
import * as R from '../../engine/raster.js';
import { RED, RED_D, RED_L, CREAM, CONC, CONC_D, CONC_L, STEEL, DARK, NIGHT, GOLD, LED, BLUE, INK, seatXs, textPx, tw } from './_arena_lib.js';
const { box, qy, qx, qz, fq, lw, lit, glow, cyl, ball, dk, lt, mix, PW, px, C, rng, ellipse, hash2, signY, signX, textY, textX, textW, PAT } = R;

const S2 = (x, y, z) => { const s = PW(x, y, z); return [Math.round(s[0]), Math.round(s[1])]; };
const dot = (x, y, z, c, dx = 0, dy = 0) => { const s = S2(x, y, z); px(s[0] + (R.isFlipped() ? -dx : dx), s[1] + dy, C(c)); };
const A = (id, tags, size, draw, x = {}) => Object.assign({ id: 'furn.arena.' + id, kind: 'furniture', tags: ['arena'].concat(tags), size, draw }, x);
/** lit text on a +y plane, centred between x0..x1 */
const ledY = (s, x0, x1, y, z, c) => lit(() => textY(s, (x0 + x1) / 2 - textW(s) / 32, y, z, c));
const ledX = (s, x, y0, y1, z, c) => lit(() => textX(s, x, (y0 + y1) / 2 + textW(s) / 32, z, c));

function tier(p) {
  const len = p.len || 8, z = p.z || .5, c = p.c || RED, rev = !!p.rev, xs = seatXs(len, p.aisles || []), rise = p.rise || .5;
  box(0, 0, 0, len, .5, z, CONC, { t: (x, y) => (y > .43 ? CONC_L : hash2(Math.floor(x * 16), Math.floor(y * 16), 3) > .95 ? CONC_D : CONC), l: (u, v, w, h) => (v > h - rise * 16 ? (v === h - 1 ? CONC_L : u % 32 === 0 ? CONC_D : dk(CONC, .16)) : dk(CONC, .3)), ol: false });
  lw([0, .5, z], [len, .5, z], CONC_L); lw([len, 0, z], [len, .5, z], CONC_L); lw([len, .5, 0], [len, .5, z], CONC_D);
  for (const a of p.aisles || []) { qz(a[0], a[1], 0, .5, z + .005, '#565b68'); lit(() => lw([a[0], .49, z + .01], [a[1], .49, z + .01], GOLD)); if (!rev) qy(a[0], a[1], .5, z - rise, z, dk(CONC, .34)); }
  const by = rev ? .38 : .03, py = rev ? .1 : .1;
  for (const x of xs) { const cc = p.alt && Math.round(x / .6) % 7 === 3 ? CREAM : c;
    if (!rev) { qy(x - .22, x + .22, by + .06, z + .1, z + .52, cc); lw([x - .22, by + .06, z + .52], [x + .22, by + .06, z + .52], lt(cc, .35)); qz(x - .2, x + .2, py, py + .28, z + .17, lt(cc, .15)); qy(x - .2, x + .2, py + .28, z + .05, z + .17, dk(cc, .3)); }
    else { qz(x - .2, x + .2, py, py + .28, z + .17, lt(cc, .15)); qy(x - .22, x + .22, by + .08, z + .08, z + .56, dk(cc, .12)); lw([x - .22, by + .08, z + .56], [x + .22, by + .08, z + .56], lt(cc, .3)); } }
  if (p.sec) { qx(len, .08, .42, Math.max(0, z - .4), Math.max(.3, z - .1), DARK); }
  if (p.last) { qy(0, len, .5, 0, z, DARK, undefined); qy(0, len, .5, z - .5, z - .12, RED); ledY(p.text || 'LET\'S GO OTTERS', 0, len, .51, z - .2, CREAM); box(0, .46, z, len, .04, .5, STEEL, { ol: false, l: (u, v) => (u % 16 === 0 || v % 7 === 0 ? STEEL : null), t: STEEL }); }
}

const UW = 9.5;
function bowlwall(p) {
  const w = p.w || 6, k = p.kind || 'plain', y = .1, r = rng((p.seed || 5) + w * 3);
  qy(0, w, y, 0, UW, '#232838'); qy(0, w, y, 0, 5.1, '#30364a'); qy(0, w, y, UW - .5, UW, '#161a26');
  for (let x = 0; x <= w + .01; x += 3) { const a = Math.max(0, x - .1), b = Math.min(w, x + .1); if (b > a) qy(a, b, y, 5.1, UW - .5, '#2c3246'); }
  // rafters + ribbon board
  for (let x = .5; x < w; x += 1.5) lw([x, y + .01, UW - .5], [Math.min(w, x + .75), y + .01, UW - .1], '#3a4058');
  qy(0, w, y + .01, 5.1, 5.75, '#12141c'); lit(() => { qy(0, w, y + .02, 5.12, 5.18, RED); qy(0, w, y + .02, 5.68, 5.74, RED); });
  const t = p.text || 'MAPLE BAY OTTERS'; for (let x = .4; x + textW(t) / 16 < w; x += textW(t) / 16 + 1.4) lit(() => textY(t, x, y + .03, 5.6, x % 2 < 1 ? LED : CREAM));
  if (k === 'suite') { for (let x = .4; x + 2.2 <= w; x += 2.6) { qy(x, x + 2.2, y + .01, 6.2, 7.5, '#3a4868', '#445478'); glow(() => qy(x, x + 2.2, y + .02, 6.2, 7.5, r() < .7 ? '#ffe2a0' : '#9ac8ff', '#f4c870')); lw([x, y + .02, 6.2], [x + 2.2, y + .02, 6.2], STEEL); lw([x + 1.1, y + .02, 6.2], [x + 1.1, y + .02, 7.5], '#2a3040'); for (let i = 0; i < 3; i++) if (r() < .7) { const fx = x + .35 + i * .7; qy(fx - .12, fx + .12, y + .03, 6.2, 6.62, ['#d2392f', '#33303f', '#f4f0e8', '#3b6fd0'][Math.floor(r() * 4)]); qy(fx - .08, fx + .08, y + .03, 6.62, 6.82, ['#f1c7a1', '#a66a44', '#643c26'][Math.floor(r() * 3)]); } } }
  else if (k === 'banners') {
    const B = [['1998', 'CHAMPS', RED, CREAM], ['EST', '1961', CREAM, RED], ['14', 'OKONJO', RED, CREAM], ['33', 'HALE', CREAM, RED]]; if (p.name) B.unshift(['HONORARY', 'OTTER', GOLD, INK, String(p.name).toUpperCase().slice(0, 9)]);
    let x = .5; for (const b of B) { const bw = Math.max(1.5, (Math.max(textW(b[0]), textW(b[1]), b[4] ? textW(b[4]) : 0) + 8) / 16); if (x + bw > w - .2) break; lw([x, y + .02, 8.75], [x + bw, y + .02, 8.75], STEEL); lw([x + .1, y + .02, 8.75], [x + .1, y + .02, UW - .5], '#565c70'); lw([x + bw - .1, y + .02, 8.75], [x + bw - .1, y + .02, UW - .5], '#565c70');
      qy(x, x + bw, y + .02, 6.5, 8.7, b[2]); fq([[x, y + .02, 6.5], [x + bw / 2, y + .02, 6.15], [x + bw, y + .02, 6.5]], b[2]); qy(x, x + bw, y + .03, 8.5, 8.6, b[3]); qy(x, x + bw, y + .03, 6.55, 6.65, b[3]);
      const tx = s => textY(s, x + bw / 2 - textW(s) / 32, y + .03, 0, b[3]); R.at(0, 0, 8.25, () => tx(b[0])); R.at(0, 0, 7.75, () => tx(b[1])); if (b[4]) R.at(0, 0, 7.2, () => tx(b[4])); else { const s = S2(x + bw / 2, y + .03, 7.05); for (const [dx, dy] of [[0, -2], [-1, -1], [0, -1], [1, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [-1, 2], [1, 2]]) px(s[0] + dx, s[1] + dy + (dx >> 1), C(b[3])); }
      x += bw + .7; } }
  else if (k === 'tunnel') { qy(.6, w - .6, y + .01, 0, 3.1, '#12141c'); qy(.6, w - .6, y + .02, 3.1, 3.7, RED); ledY('TEAM TUNNEL', .6, w - .6, y + .03, 3.55, CREAM); glow(() => qy(1, w - 1, y + .02, 0, 2.6, '#3a3020', '#2a2418')); for (const x of [.6, w - .7]) qy(x, x + .1, y + .02, 0, 3.1, STEEL); qy(.6, w - .6, y + .02, 0, .9, RED_D, '#12141c'); }
  else if (k === 'press') { qy(.5, w - .5, y + .01, 6.1, 7.3, '#3a4868', '#445478'); glow(() => qy(.5, w - .5, y + .02, 6.1, 7.3, '#9ac8ff', '#c8e0ff')); ledY('PRESS', .5, w - .5, y + .03, 7.75, STEEL); }
}

function hoop(p) { R.at(0, -.1, 0, () => hoop_(p)); }
function hoop_(p) {
  const e = !!p.e, pad = RED;
  if (!e) {
    box(0, .1, 0, 1, 1, .95, pad); qx(1, .2, 1, .15, .8, RED_L); box(.36, .48, .95, .28, .24, 1.7, DARK, { ol: false }); box(.5, .52, 2.5, 1.55, .16, .16, DARK, { ol: false }); lw([.5, .6, 2.1], [1.6, .6, 2.55], '#3a4050');
    { const s = S2(2.45, .6, 2.35); for (let a = 0; a < 40; a++) { const an = a / 40 * Math.PI * 2, X = Math.round(s[0] + Math.cos(an) * 5.2), Y = Math.round(s[1] + Math.sin(an) * 2.6); px(X, Y, C('#f08a2c')); if (Math.sin(an) > -.2 && a % 3 === 0) for (let j = 1; j < 6; j++) if ((a + j) & 1) px(X - Math.round(Math.cos(an) * j * .35), Y + j, C('#f4f8fb')); } }
    qx(2.05, 0, 1.2, 2.1, 3.2, '#cfe6f2', 'glass'); for (const [a, b] of [[[2.05, 0, 2.1], [2.05, 1.2, 2.1]], [[2.05, 0, 3.2], [2.05, 1.2, 3.2]], [[2.05, 0, 2.1], [2.05, 0, 3.2]], [[2.05, 1.2, 2.1], [2.05, 1.2, 3.2]], [[2.06, .38, 2.3], [2.06, .82, 2.3]], [[2.06, .38, 2.72], [2.06, .82, 2.72]], [[2.06, .38, 2.3], [2.06, .38, 2.72]], [[2.06, .82, 2.3], [2.06, .82, 2.72]]]) lw(a, b, '#f4f8fb');
    lit(() => { lw([2.06, 0, 3.2], [2.06, 1.2, 3.2], '#ff5a4a'); });
  } else {
    { const s = S2(-1.45, .6, 2.35); for (let a = 0; a < 40; a++) { const an = a / 40 * Math.PI * 2, X = Math.round(s[0] + Math.cos(an) * 5.2), Y = Math.round(s[1] + Math.sin(an) * 2.6); px(X, Y, C('#f08a2c')); if (Math.sin(an) > -.2 && a % 3 === 0) for (let j = 1; j < 6; j++) if ((a + j) & 1) px(X - Math.round(Math.cos(an) * j * .35), Y + j, C('#f4f8fb')); } }
    qx(-1.05, 0, 1.2, 2.1, 3.2, '#b8d4e4', 'glass'); for (const [a, b] of [[[-1.05, 0, 2.1], [-1.05, 1.2, 2.1]], [[-1.05, 0, 3.2], [-1.05, 1.2, 3.2]], [[-1.05, 0, 2.1], [-1.05, 0, 3.2]], [[-1.05, 1.2, 2.1], [-1.05, 1.2, 3.2]]]) lw(a, b, STEEL);
    box(-1.05, .52, 2.5, 1.55, .16, .16, DARK, { ol: false }); lw([-.9, .6, 2.55], [.5, .6, 2.1], '#3a4050'); box(.36, .48, .95, .28, .24, 1.7, DARK, { ol: false }); box(0, .1, 0, 1, 1, .95, pad); qy(.1, .9, 1.1, .15, .8, RED_L); lit(() => lw([-1.04, 0, 3.2], [-1.04, 1.2, 3.2], '#ff5a4a'));
  }
}
function seatRow(n, c, rev, h = .46) { for (let i = 0; i < n; i++) { const x = i * .6 + .08; if (!rev) { box(x, .02, 0, .44, .08, h + .42, c, { ol: false }); box(x, .1, h - .08, .44, .38, .08, lt(c, .12), { ol: false }); lw([x, .48, 0], [x, .48, h - .08], INK); lw([x + .44, .48, 0], [x + .44, .48, h - .08], INK); } else { box(x, .08, h - .08, .44, .38, .08, lt(c, .12), { ol: false }); lw([x, .08, 0], [x, .08, h - .08], INK); box(x, .46, 0, .44, .08, h + .42, dk(c, .1), { ol: false }); lw([x, .54, h + .42], [x + .44, .54, h + .42], lt(c, .3)); } } }
const seatList = (n, rev, z = .42) => Array.from({ length: n }, (_, i) => ({ x: i * .6 + .3, y: rev ? .25 : .3, z, dir: rev ? 3 : 1 }));
function table(p) { const w = p.w || 5; box(0, 0, 0, w, .6, .8, '#1c1f2a'); qz(0, w, 0, .6, .81, '#3a3f4e'); const f = p.f || 0, t = p.text || 'OTTERS'; lit(() => { qy(.05, w - .05, .6, .08, .72, f % 2 ? '#1a1220' : '#200c0c'); for (let x = .2 + (f % 3) * .1; x + textW(t) / 16 < w; x += textW(t) / 16 + .8) textY(t, x, .61, .56, f % 2 ? GOLD : RED_L); }); for (let x = .5; x < w; x += 1.2) { box(x, .15, .81, .5, .3, .28, '#2a2f3d', { ol: false }); lit(() => qy(x + .04, x + .46, .45, .86, 1.06, '#8fd0f0')); } }
function adboard(p) { const w = p.w || 4, t = p.text || 'OTTER POP', f = p.f || 0; box(0, 0, 0, w, .14, .62, '#14161e', { ol: false }); lit(() => { qy(0, w, .14, .04, .58, ['#2a0e0e', '#0e1a2a', '#2a220a'][f % 3]); const tw_ = textW(t) / 16; for (let x = .25; x + tw_ < w; x += tw_ + .9) textY(t, x, .15, .46, [RED_L, '#8fd0f0', GOLD][f % 3]); }); lw([0, .14, .62], [w, .14, .62], STEEL); }
function jumbo() {
  const W = 6.2; for (const [x, y] of [[.3, .3], [W - .3, .3], [.3, W - .3], [W - .3, W - .3]]) lw([x, y, 3.5], [W / 2 + (x - W / 2) * .3, W / 2 + (y - W / 2) * .3, 6.4], '#565c70');
  box(0, 0, .25, W, W, 3.1, '#161922', { ol: false }); box(-.12, -.12, 3.35, W + .24, W + .24, .28, RED_D, { ol: false, t: '#20232e' }); lw([-.12, W + .12, 3.63], [W + .12, W + .12, 3.63], RED_L); lw([W + .12, -.12, 3.63], [W + .12, W + .12, 3.63], RED_L);
  box(-.06, -.06, 0, W + .12, W + .12, .25, '#0e1016', { ol: false }); lit(() => { qy(0, W, W + .07, .04, .2, '#3a0f0c'); qx(W + .07, 0, W, .04, .2, '#2a0b0a'); textY('MAPLE BAY ARENA', 1.2, W + .08, .2, LED); textX('GO OTTERS', W + .08, 4.4, .2, LED); });
  qy(.1, W - .1, W + .01, .3, 3.3, '#05060a'); qx(W + .01, .1, W - .1, .3, 3.3, '#05060a');
}
function camera() { lw([.5, .5, 0], [.5, .5, 1.1], INK); lw([.2, .8, 0], [.5, .5, .9], INK); lw([.8, .8, 0], [.5, .5, .9], INK); lw([.5, .2, 0], [.5, .5, .9], INK); box(.25, .32, 1.1, .5, .36, .3, '#30343f'); box(.75, .4, 1.16, .3, .2, .18, '#1c1f2a', { ol: false }); lit(() => dot(.3, .7, 1.36, '#ff4a3a')); }
function ballrack() { box(0, 0, 0, 1.4, .5, .12, '#30343f', { ol: false }); for (const z of [.3, .75]) { lw([0, .25, z], [1.4, .25, z], STEEL); for (let i = 0; i < 4; i++) ball(.2 + i * .33, .25, z + .15, .13, '#e0762c', { ol: false }); } for (const x of [0, 1.4]) lw([x, .25, 0], [x, .25, 1.05], STEEL); }
function cannon(p) { box(0, 0, .25, 1.2, .7, .4, RED); for (const x of [.25, .95]) { ball(x, .74, .2, .17, INK, { ol: false }); } box(.2, .18, .65, .34, .34, .3, '#30343f', { ol: false }); const a = S2(.36, .35, .95), b = S2(1.25, .35, 1.6); for (let i = 0; i <= 14; i++) { const X = Math.round(a[0] + (b[0] - a[0]) * i / 14), Y = Math.round(a[1] + (b[1] - a[1]) * i / 14); for (let d = -2; d <= 2; d++) px(X, Y + d, C(Math.abs(d) === 2 ? '#8a8e9a' : d < 0 ? STEEL : '#aab0bc')); } textY('TEES', .1, .71, .6, CREAM); if (p.fire) lit(() => { const s = S2(1.3, .35, 1.65); for (const [dx, dy] of [[0, 0], [1, -1], [2, 0], [1, 1], [3, -1], [2, -2]]) px(s[0] + dx, s[1] + dy, C('#fff2a8')); }); }

function stage(p) {
  const f = p.f || 0, c = p.c || '#e84aa8', c2 = p.c2 || '#3fd0e0', nm = String(p.name || 'LIVE').toUpperCase(), W = 8, Dp = 4;
  // speaker stacks (far one first)
  const stack = y => { box(2.5, y, 0, 1, 1, 2.7, '#1a1c24'); for (const z of [.25, 1.15, 2.05]) { qx(3.5, y + .12, y + .88, z, z + .62, '#0c0d12'); const s = S2(3.51, y + .5, z + .31); ellipse(s[0], s[1], 3, 4, '#2c303c'); ellipse(s[0], s[1], 1.5, 2, f % 2 ? '#3a3f4e' : '#22252f'); } };
  stack(-1.15);
  box(0, 0, 0, Dp, W, 1, '#2a2d39', { r: (u, v) => (v > 13 ? '#3a3e4c' : v < 2 ? '#14161e' : u % 8 === 0 ? '#1a1c24' : '#20232d'), l: '#1a1c24' }); lit(() => { qx(Dp + .01, 0, W, .82, .92, c); });
  // back wall + LED screen
  box(0, .2, 1, .32, W - .4, 4, '#14161e', { ol: false });
  lit(() => { qx(.33, .45, W - .45, 1.25, 4.75, (u, v, w, h) => { const col = Math.floor(u / 6), hgt = 8 + Math.floor((Math.sin(col * 1.7 + f * 1.3) * .5 + .5) * 26) + (hash2(col, f, 3) * 10 | 0); if (v > 44) return '#0a0c12'; if (v < hgt && u % 6 < 5) return v > hgt - 3 ? '#ffffff' : (v >> 2) & 1 ? c : mix(c, c2, v / 40); return (u + v + f * 3) % 23 === 0 ? c2 : '#0a0c12'; }); textX(nm.slice(0, 22), .34, W / 2 + textW(nm.slice(0, 22)) / 32, 4.62, '#ffffff'); });
  // truss + lamps
  for (const [x, y] of [[.1, .05], [.1, W - .15], [Dp - .2, .05], [Dp - .2, W - .15]]) box(x, y, 1, .1, .1, 4.6, '#565c70', { ol: false });
  box(Dp - .25, 0, 5.5, .2, W, .2, '#565c70', { ol: false }); box(0, 0, 5.5, Dp, .12, .2, '#4a5064', { ol: false }); box(0, W - .12, 5.5, Dp, .12, .2, '#565c70', { ol: false });
  for (let i = 0; i < 8; i++) { const y = .6 + i * .98, col = [c, c2, '#ffffff', GOLD][(i + f) % 4]; box(Dp - .28, y - .12, 5.2, .26, .24, .3, '#1a1c24', { ol: false }); lit(() => { const s = S2(Dp, y, 5.25); px(s[0], s[1], C(col)); px(s[0] + 1, s[1], C(col)); px(s[0], s[1] + 1, C(col)); px(s[0] + 1, s[1] + 1, C('#ffffff')); }); }
  for (let i = 0; i < 4; i++) { const x = .6 + i * .9, col = [c2, c, GOLD, '#ffffff'][(i + f) % 4]; lit(() => { const s = S2(x, W - .1, 5.45); px(s[0], s[1], C(col)); px(s[0] + 1, s[1], C(col)); px(s[0], s[1] + 1, C(col)); }); }
  // monitors on the lip
  for (const y of [1.6, 4, 6.2]) { fq([[Dp - .7, y, 1], [Dp - .15, y, 1], [Dp - .15, y + .6, 1], [Dp - .7, y + .6, 1]], '#14161e'); fq([[Dp - .7, y, 1], [Dp - .7, y + .6, 1], [Dp - .55, y + .6, 1.3], [Dp - .55, y, 1.3]], '#22252f'); }
  stack(W + .15);
}
function stageprop(p) {
  const k = p.kind || 'amp';
  if (k === 'drums') { cyl(.6, .55, .1, .34, .5, CREAM, { l: '#e8e2d4', r: '#c8c0b0' }); const s = S2(.6, .55, .35); ellipse(s[0] + 4, s[1] + 3, 4, 5, RED); cyl(.2, .9, .5, .18, .22, RED); cyl(1, .9, .5, .18, .22, RED); cyl(.25, .25, .1, .2, .6, RED); lw([1.1, .3, 0], [1.1, .3, 1.1], STEEL); lw([.05, .5, 0], [.05, .5, 1.2], STEEL); for (const [x, y, z] of [[1.1, .3, 1.1], [.05, .5, 1.2]]) { const q = S2(x, y, z); ellipse(q[0], q[1], 5, 2, GOLD); } }
  else if (k === 'keys') { lw([.15, .3, 0], [.85, .3, .8], INK); lw([.85, .3, 0], [.15, .3, .8], INK); box(0, .1, .8, 1.2, .4, .12, '#1c1f2a'); qz(.05, 1.15, .28, .48, .925, CREAM, '#d8d2c4'); lit(() => { dot(.15, .14, .93, '#ff4a3a'); dot(.3, .14, .93, '#7df0a0'); }); }
  else if (k === 'mic') { lw([.2, .2, 0], [.2, .2, 1.15], STEEL); const s = S2(.2, .2, 1.2); px(s[0], s[1], C(INK)); px(s[0] + 1, s[1], C(INK)); px(s[0], s[1] - 1, C('#8a8e9a')); const b = S2(.2, .2, 0); ellipse(b[0], b[1], 3, 1.5, INK); }
  else { box(0, 0, 0, .8, .5, .8, '#1c1f2a'); qy(.06, .74, .5, .08, .6, '#3a3024', '#2c261e'); lit(() => dot(.14, .5, .7, '#ff4a3a')); qy(.06, .74, .5, .64, .74, GOLD); }
}
function ramp() { fq([[0, 0, 0], [2.2, 0, .9], [2.2, 1.6, .9], [0, 1.6, 0]], '#e8b83a', '#d9a430'); fq([[0, 1.6, 0], [2.2, 1.6, .9], [2.2, 1.6, 0]], '#a8762a'); qx(2.2, 0, 1.6, 0, .9, '#8a5f22'); for (let x = .4; x < 2.2; x += .5) lw([x, 0, x * .41], [x, 1.6, x * .41], '#2a2f3d'); lw([0, 1.6, 0], [2.2, 1.6, .9], INK); lw([2.2, 0, .9], [2.2, 1.6, .9], '#fff2a8'); }
function scrapcar(p) { const c = p.c || '#5a8ac8', h = p.flat ? .28 : .55; box(0, 0, 0, 1.9, .95, h, c); if (!p.flat) { box(.45, .08, h, .9, .8, .3, dk(c, .1), { ol: false }); qy(.5, 1.3, .88, h + .04, h + .26, '#8ab8d0', '#6a98b0'); qx(1.35, .12, .84, h + .04, h + .26, '#6a98b0'); } else { qz(.4, 1.4, .1, .85, h + .01, dk(c, .25), dk(c, .4)); lw([.3, .5, h + .02], [1.5, .3, h + .02], INK); lw([.6, .2, h + .02], [1.2, .8, h + .02], INK); } for (const x of [.35, 1.5]) { const s = S2(x, .97, .14); ellipse(s[0], s[1], 2.5, 2.5, INK); } qx(1.9, .1, .3, h * .4, h * .7, '#fff2a8'); qx(1.9, .65, .85, h * .4, h * .7, '#fff2a8'); }
function spot(p) { for (const [x, y] of [[0, 0], [.6, 0], [0, .6], [.6, .6]]) lw([x, y, 0], [x, y, 2.6], '#565c70'); for (const z of [.9, 1.8]) { lw([0, .6, z], [.6, .6, z], '#565c70'); lw([.6, 0, z], [.6, .6, z], '#565c70'); lw([0, .6, z - .9], [.6, .6, z], '#454a5c'); } box(-.05, -.05, 2.6, .7, .7, .1, '#30343f', { ol: false }); box(.12, .12, 2.7, .4, .5, .4, '#1a1c24'); lit(() => { const s = S2(.52, .4, 2.9); ellipse(s[0], s[1], 2, 3, p.on ? '#fff8d0' : '#5a5648'); }); }
function minitruck(p) {
  const c = p.c || '#d2392f', d = p.dir === -1 ? -1 : 1, wheel = (x, y) => { const s = S2(x, y, .38); ellipse(s[0], s[1], 6, 6.5, '#1a1c24'); ellipse(s[0], s[1], 3, 3.2, '#8a8e9a'); px(s[0], s[1], C(INK)); for (const [dx, dy] of [[-6, 0], [6, 0], [0, -6], [0, 6], [-4, -4], [4, 4], [4, -4], [-4, 4]]) px(s[0] + dx, s[1] + dy, C('#3a3f4e')); };
  wheel(.4, .08); wheel(1.5, .08);
  lw([.4, .5, .5], [1.5, .5, .5], STEEL); box(.15, .12, .62, 1.6, .76, .34, c); box(d > 0 ? .45 : .75, .16, .96, .7, .68, .34, lt(c, .1));
  const cx0 = d > 0 ? .45 : .75; qy(cx0 + .06, cx0 + .64, .84, 1, 1.24, '#8ab8d0', '#a8d0e4'); qx(cx0 + .7, .22, .78, 1, 1.24, '#6a98b0');
  qy(.2, 1.7, .88, .68, .78, '#f2c230'); for (let i = 0; i < 4; i++) { const x = (d > 0 ? .25 : 1.2) + i * .12; fq([[x, .885, .78], [x + .08, .885, .78], [x + .16, .885, .92]], '#f08a2c'); }
  lit(() => { const hx = d > 0 ? 1.75 : .15; if (d > 0) { qx(hx, .2, .36, .72, .86, '#fff2a8'); qx(hx, .64, .8, .72, .86, '#fff2a8'); } else { dot(.16, .9, .8, '#ff4a3a'); dot(.16, .9, .78, '#ff4a3a'); } if (d < 0) dot(1.74, .9, .8, '#fff2a8'); else dot(.16, .9, .8, '#ff4a3a'); });
  wheel(.4, .98); wheel(1.5, .98);
  if (p.name) textY(String(p.name).slice(0, 5), .5, .885, .92, CREAM);
}

export default [
  A('tier', [], p => [p.len || 8, .5, p.z || .5], tier, { vb: p => [0, 0, 0, (p.len || 8) + .05, .55, (p.z || .5) + .7], variants: [{ len: 8, z: .5, aisles: [[3, 4]] }, { len: 8, z: 2, alt: 1 }, { len: 6, z: 1.2, rev: 1, last: 1 }] }),
  { id: 'furn.arena.bowlwall', kind: 'furniture', tags: ['arena', 'wall'], wall: true, mount: 0, solid: false, size: p => [p.w || 6, .1, UW], vb: p => [0, 0, 0, p.w || 6, .2, UW + .1], draw: bowlwall, variants: [{ w: 9, kind: 'banners', name: 'Alex' }, { w: 8, kind: 'suite' }, { w: 5, kind: 'tunnel' }, { w: 6, kind: 'press' }] },
  A('hoop', [], [1, 1, .95], hoop, { vb: p => (p.e ? [-1.8, -.2, 0, 1.1, 1.2, 3.5] : [0, -.2, 0, 2.9, 1.2, 3.5]), variants: [{}, { e: 1 }] }),
  A('bench', ['arena_bench'], p => [(p.n || 5) * .6, .56, .5], p => seatRow(p.n || 5, p.c || RED, false), { seats: p => seatList(p.n || 5, false), vb: p => [0, 0, 0, (p.n || 5) * .6 + .05, .6, 1], variants: [{ n: 5 }, { n: 4, c: BLUE }] }),
  A('chairs', ['arena_seat'], p => [(p.n || 5) * .6, .56, .5], p => seatRow(p.n || 5, p.c || '#30343f', !!p.rev), { seats: p => seatList(p.n || 5, !!p.rev), vb: p => [0, 0, 0, (p.n || 5) * .6 + .05, .6, 1], variants: [{ n: 6, rev: 1 }, { n: 4 }] }),
  A('table', [], p => [p.w || 5, .6, .82], table, { vb: p => [0, 0, 0, (p.w || 5) + .05, .65, 1.2], variants: [{ w: 5 }, { w: 5, f: 1, text: 'DOCKSIDE DOGS' }] }),
  A('adboard', [], p => [p.w || 4, .14, .62], adboard, { variants: [{ w: 5 }, { w: 5, f: 1, text: 'RIDE THE LIGHT RAIL' }, { w: 5, f: 2, text: 'MAPLECAB' }] }),
  A('jumbo', [], [6.2, 6.2, 3.7], jumbo, { solid: false, vb: [-.2, -.2, 0, 6.5, 6.5, 6.5] }),
  A('camera', [], [1, 1, 1.5], camera), A('ballrack', ['arena_balls'], [1.4, .5, 1.1], ballrack, { use: { x: .7, y: 1 } }),
  A('cannon', [], [1.2, .7, .9], cannon, { vb: [0, 0, 0, 1.6, .9, 1.9], variants: [{}, { fire: 1 }] }),
  A('stage', [], [4, 8, 1], stage, { vb: [0, -1.3, 0, 4.2, 9.3, 5.9], variants: [{ f: 0, name: 'Neon Tide' }, { f: 3, c: '#f09a3a', c2: '#d9483b', name: 'The Gullwings' }] }),
  A('stageprop', [], p => (p.kind === 'drums' ? [1.2, 1.1, 1] : p.kind === 'keys' ? [1.2, .6, .95] : p.kind === 'mic' ? [.4, .4, 1.2] : [.8, .5, .8]), stageprop, { solid: false, vb: p => (p.kind === 'drums' ? [-.2, 0, 0, 1.4, 1.2, 1.4] : [-.1, -.1, 0, 1.3, .7, 1.4]), variants: [{ kind: 'drums' }, { kind: 'keys' }, { kind: 'mic' }, { kind: 'amp' }] }),
  A('ramp', [], [2.2, 1.6, .9], ramp), A('scrapcar', [], p => [1.9, .95, p.flat ? .3 : .85], scrapcar, { variants: [{}, { flat: 1, c: '#c86a4a' }] }),
  A('spot', [], [.6, .6, 3.1], spot, { vb: [-.1, -.1, 0, .8, .8, 3.3], variants: [{ on: 1 }] }),
  { id: 'veh.arena.minitruck', kind: 'vehicle', tags: ['arena'], size: [1.9, 1.06, 1.3], vb: [-.1, -.2, 0, 2, 1.4, 1.4], draw: minitruck, variants: [{ c: '#d2392f', dir: 1, name: 'CRUSH' }, { c: '#2f9a94', dir: -1 }, { c: '#f2c230', dir: 1 }] },
];
