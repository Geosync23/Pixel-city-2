// Real venue restrooms, batch 4 (owner msgs 151 + 192): the one-off venues (concert hall, playhouse, conservatory, clinic, airport, park pavilion,
// post offices, lighthouse, the Gilded Gull, the school, the fire station) and the two plain layouts every shop, restaurant and office uses
// (owner msg 208: shops' bathrooms very simple). Stalls, doors, bins: restrooms_art.js.
//   basin4 {style, c, c2, w}  tag sink     glass4 {kind, c, w}  (wall)     floor4 {style, w, d, c, c2}  (flat)
//   deco4  {kind, c, w, t}  wall pieces     prop4 {kind, c}  floor pieces
import { box, qy, qx, qz, lw, fq, glow, lit, cyl, ball, dk, lt, hash2, isFlipped } from '../../engine/raster.js';
import { F, bx, frameY } from './_lib.js';
import { PORC, BRASS, CHROME, INK, shadow, dot, blob, discY, label } from './restrooms_art.js';

const tap = (x, y, z, m, h = .2, r = .13) => { lw([x, y, z], [x, y, z + h], m); lw([x, y, z + h], [x, y + r, z + h - .03], m); };
const sink = (cx, y, z, rim, water) => { blob(cx, y, z, 4.5, 2, rim); blob(cx, y + .01, z, 3.5, 1.4, water || '#d4e6ee'); };
const ring = (cx, cz, r, n = 18) => { const P = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; P.push([cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r * 1.3]); } return P; };

/* ---------- basins ---------- */
const BW = { marble: 2, dresser: 1.4, potting: 1.4, clinic: .8, airport: 4, parktrough: 1.6, washstand: .8, gull: 1.8, kids: 2, fire: 1.4, console: 1.1, pedestal: .7 };
const bw = p => p.w || BW[p.style] || 1;
function basin(p) {
  const st = p.style, W = bw(p), c = p.c || '#8a6040', c2 = p.c2 || PORC; shadow(0, W, 0, .6);
  if (st === 'marble' || st === 'gull') {   // marble on a carved wood skirt (concert hall: green marble, walnut; Gilded Gull: white marble, gold taps)
    const top = st === 'gull' ? '#f2eee6' : '#4a6a5a', m = BRASS; box(.05, 0, 0, W - .1, .5, .76, c, { l: (u, v) => (u % 10 < 1 ? dk(c, .25) : c) }); box(0, 0, .76, W, .56, .09, top, { t: (x, y) => (Math.abs(((x * 2.1 + y * 1.6) % 1) - .5) < .02 ? lt(top, .25) : top) });
    for (let i = 0; i < 2; i++) { const cx = (i + .5) * W / 2; sink(cx, .3, .855, dk(top, .2)); tap(cx, .06, .85, m, .22, .14); dot(cx - .14, .08, .9, m); dot(cx + .14, .08, .9, m); }
  } else if (st === 'dresser') {   // the playhouse: an old dressing table turned washstand, a bowl let in, greasepaint and a wig stand
    box(0, 0, 0, W, .5, .74, '#6a4a3a', {}); for (const x of [.08, W / 2, W - .08]) lw([x, .5, .1], [x, .5, .7], '#4a2a20'); box(-.02, -.02, .74, W + .04, .54, .06, '#8a6a50');
    sink(.5, .28, .8, '#e8e2d6'); tap(.5, .05, .8, CHROME); for (let i = 0; i < 4; i++) cyl(.9 + i * .1, .2, .8, .03, .06, ['#e8483c', '#f4d0b0', '#3a3a40', '#f2c230'][i], { ol: false }); ball(1.25, .3, .98, .1, '#e8dcc8'); lw([1.25, .3, .8], [1.25, .3, .9], '#5a5a60');
  } else if (st === 'potting') {   // the conservatory: a potting bench with a stone sink and a watering can
    for (const x of [.08, W - .08]) lw([x, .44, 0], [x, .44, .72], '#6a5040'); box(0, 0, .72, W, .5, .08, '#8a6a4a'); bx(.04, .04, .2, W - .08, .42, .03, '#7a5a3a'); for (let i = 0; i < 3; i++) cyl(.25 + i * .22, .25, .23, .08, .12, '#c0704a', { ol: false });
    box(.5, .05, .8, .7, .42, .14, '#9a9488', { t: '#7a7468' }); blob(.85, .26, .94, 4, 1.6, '#8ab0b8'); tap(.85, .05, .94, '#8a9098'); cyl(.25, .3, .8, .09, .12, '#5a8a6a', { ol: false }); lw([.34, .3, .88], [.44, .3, .96], '#5a8a6a');
  } else if (st === 'clinic') {   // wall basin, elbow lever, sanitiser and a yellow sharps box
    box(.06, 0, .66, .68, .46, .16, PORC, { t: '#e2e6e4' }); sink(.4, .26, .82, '#d0d6d4'); lw([.4, .04, .82], [.4, .04, 1.0], CHROME); lw([.4, .04, 1.0], [.6, .04, 1.0], CHROME); lw([.4, .04, 1.0], [.4, .18, .98], CHROME);
    bx(.62, 0, 1.2, .12, .08, .22, '#e8eef0'); dot(.68, .08, 1.24, '#3a8a6a'); bx(.04, 0, 1.15, .2, .14, .2, '#f2c230'); qy(.06, .22, .141, 1.28, 1.33, '#c8343a');
  } else if (st === 'airport') {   // a long terrazzo counter with four basins and sensor taps
    box(0, 0, .74, W, .56, .1, '#d8d4cc', { t: (x, y) => (hash2(Math.floor(x * 12), Math.floor(y * 12), 9) < .06 ? '#a8a49c' : '#dedad2') }); qy(0, W, .56, 0, .74, '#5a6878');
    for (let i = 0; i < 4; i++) { const cx = (i + .5) * W / 4; sink(cx, .3, .845, '#bcb8b0'); tap(cx, .06, .84, CHROME, .16, .12); dot(cx, .16, .98, '#2a2733'); }
  } else if (st === 'parktrough') {   // the park: a concrete trough, two push taps, a pine-soap dispenser
    box(0, 0, .5, W, .5, .3, '#a8a49c', { t: '#8a867e' }); for (const x of [.15, W - .15]) box(x - .1, .1, 0, .2, .3, .5, '#9a968e', {}); qz(.06, W - .06, .06, .44, .805, '#6a6a68');
    for (const x of [.45, W - .45]) { lw([x, .03, .8], [x, .03, .98], '#8a9098'); bx(x - .04, .03, .98, .08, .06, .05, '#6a7078'); } bx(W / 2 - .08, 0, 1.2, .16, .1, .2, '#5a8a4a'); dot(W / 2, .1, 1.22, '#e8f0e0');
  } else if (st === 'washstand') {   // the lighthouse: a ship's folding washstand in teak with a brass rim
    box(.05, 0, 0, .7, .45, .74, '#8a5a34', {}); frameY(.12, .68, .45, .1, .64, '#5a3a20'); cyl(.4, .24, .74, .26, .1, PORC, { t: BRASS }); blob(.4, .24, .84, 4, 1.8, '#a8d0dc'); tap(.4, .03, .74, BRASS, .3, .16);
  } else if (st === 'kids') {   // the school: two low basins at child height, colour-coded tiles, a step stool
    box(0, 0, 0, W, .46, .56, '#f4f0e8', { l: (u, v) => ['#f2c230', '#4ac0e0', '#e8483c', '#9ccc4a'][Math.floor(u / 8) % 4] }); box(0, 0, .56, W, .5, .07, '#f4f4f0');
    for (const cx of [.5, 1.5]) { sink(cx, .28, .63, '#dcdcd4'); tap(cx, .05, .62, CHROME, .14, .12); } box(.9, .55, 0, .3, .2, .18, '#4ac0e0', {});
  } else if (st === 'fire') {   // the fire station: a steel scrub sink with knee taps and a big brush
    box(0, 0, .6, W, .5, .26, '#b8bec4', { t: '#7a8088' }); for (const x of [.1, W - .1]) lw([x, .4, 0], [x, .4, .6], '#7a8288'); qz(.06, W - .06, .06, .44, .855, '#6a7078');
    tap(W / 2, .03, .86, '#c2c8cc', .28, .18); bx(.3, .48, .3, .2, .03, .14, '#c8343a'); bx(.15, .12, .86, .3, .1, .05, '#e8b040');
  } else if (st === 'console') { box(0, 0, 0, W, .5, .8, c, {}); frameY(.08, W - .08, .5, .1, .7, dk(c, .3)); box(-.02, -.02, .8, W + .04, .54, .06, c2); sink(W / 2, .28, .86, dk(c2, .2)); tap(W / 2, .05, .86, p.m || BRASS); }
  else if (st === 'pedestal') { cyl(.35, .25, 0, .1, .64, c2, {}); box(.02, 0, .64, .66, .46, .16, c2, { t: (x, y) => (Math.abs(x - .35) < .22 && y > .12 && y < .38 ? dk(c2, .12) : c2) }); blob(.35, .26, .8, 3, 1.3, '#a8d8e8'); tap(.35, .05, .8, p.m || CHROME); }
}
/* ---------- mirrors ---------- */
function glass(p) {
  const k = p.kind, c = p.c || BRASS, W = p.w || .7, gl = (x0, x1, z0, z1) => { qy(x0, x1, .035, z0, z1, '#b8d0d8', '#c4dae2'); lw([x0 + (x1 - x0) * .2, .04, z1 - .06], [x0 + (x1 - x0) * .2 + .16, .04, z1 - .3], '#e6f4f8'); };
  if (k === 'oval') { const P = ring(.35, .45, .32); fq(P.map(q => [q[0], .03, q[2]]), c); fq(P.map(q => [.35 + (q[0] - .35) * .82, .035, .45 + (q[2] - .45) * .84]), '#b8d4de', '#c4dde6'); dot(.35, .04, .9, lt(c, .3)); }
  else if (k === 'arch') { qy(0, W, .03, 0, .7, c); fq([[0, .03, .7], [W, .03, .7], [W * .8, .03, .9], [W * .5, .03, .98], [W * .2, .03, .9]], c); gl(.06, W - .06, .06, .7); fq([[.06, .035, .7], [W - .06, .035, .7], [W * .78, .035, .86], [W * .5, .035, .92], [W * .22, .035, .86]], '#b8d0d8'); }
  else if (k === 'scrawl') { qy(0, W, .03, 0, .8, '#2a2626'); gl(.05, W - .05, .05, .75); label('BRAVO', 0, W, .04, .45, '#e8283c'); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; lw([W - .22, .04, .2], [W - .22 + Math.cos(a) * .1, .04, .2 + Math.sin(a) * .1], '#e8283c'); } for (let i = 0; i < 7; i++) ball(.1 + i * (W - .2) / 6, .05, .82, .035, '#fff2c0'); }
  else if (k === 'polished') { qy(0, W, .03, 0, .5, '#8a9098'); qy(.04, W - .04, .035, .04, .46, '#a8b4ba', '#b2bcc2'); for (let i = 0; i < 4; i++) dot(.1 + i * (W - .2) / 3, .04, .25 + (i % 2) * .1, '#7a8288'); }
  else { qy(0, W, .03, 0, .7, c); gl(.05, W - .05, .05, .65); }   // plain frame
}
/* ---------- floors ---------- */
function floorPat(p) {
  const st = p.style, w = p.w || 4, d = p.d || 4, c = p.c || '#a07850', c2 = p.c2 || '#e8e4dc', H = (x, y, s) => hash2(Math.floor(x * 16), Math.floor(y * 16), s);
  if (st === 'piano') return (x, y) => { const e = Math.min(x, y, w - x, d - y); if (e < .35) { const along = x < .35 || w - x < .35 ? y : x, k = Math.floor(along * 4); if (e > .14 && [1, 2, 4, 5, 6].includes(((k % 7) + 7) % 7) && (along * 4 - k) > .3) return '#1e1a1a'; return '#f4f0e8'; } const fy = (x + y) * 2 - Math.floor((x + y) * 2); return fy < .06 ? '#5a3a20' : '#7a5030'; };
  if (st === 'stage') return (x, y) => { if ((Math.abs(x - 1.5) < .03 && Math.abs(y - 2) < .3) || (Math.abs(y - 2) < .03 && Math.abs(x - 1.5) < .3)) return '#f2c230'; if (Math.abs(x - 3.2) < .03 && Math.abs(y - 1.4) < .25) return '#4ac0e0'; const fy = y * 3 - Math.floor(y * 3); return fy < .05 ? '#141214' : H(x, y, 3) < .03 ? '#3a3638' : '#2a2628'; };
  if (st === 'brick') return (x, y) => { const u = x * 3, v = y * 6, row = Math.floor(v), fx = (u + (row % 2) * .5) - Math.floor(u + (row % 2) * .5); if (fx < .08 || v - row < .1) return '#8a6a5a'; return H(x, y, 4) < .05 ? '#a85a3a' : '#b8644a'; };
  if (st === 'vinyl') return (x, y) => { const n = H(x, y, 5); return n < .02 ? '#a8c8bc' : n < .035 ? '#e8f0ec' : '#cfe0d8'; };
  if (st === 'apt') return (x, y) => { const fx = x - Math.floor(x), fy = y - Math.floor(y); if (fx < .03 || fy < .03) return '#a8aaa8'; return H(x, y, 6) < .03 ? '#b8bab8' : '#c8cac8'; };
  if (st === 'park') return (x, y) => { if (Math.hypot(x - w / 2, y - d / 2) < .12) return '#4a4a48'; const n = H(x, y, 7); if (n < .006) return '#b8783a'; if (n < .01) return '#8a9a3a'; return Math.abs(((x * 1.3 - y) % 1.7) - .8) < .02 ? '#7a7874' : '#8e8c86'; };
  if (st === 'flock') return (x, y) => { const u = (x * 2) % 1, v = (y * 2) % 1; return Math.hypot(u - .5, v - .5) < .18 ? '#7a2a30' : '#5a1a22'; };
  if (st === 'kids') return (x, y) => { const i = Math.floor(x * 2), j = Math.floor(y * 2), fx = x * 2 - i, fy = y * 2 - j; if (fx < .05 || fy < .05) return '#c8c8c0'; return (i + j) % 5 === 0 ? ['#f2c230', '#4ac0e0', '#e8483c', '#9ccc4a'][(i * 3 + j) % 4] : '#f0eee6'; };
  if (st === 'redtile') return (x, y) => { const fx = x * 2 - Math.floor(x * 2), fy = y * 2 - Math.floor(y * 2); if (fx < .05 || fy < .05) return '#6a2a24'; return '#a8382e'; };
  if (st === 'tiles') { const s = p.s || .5; return (x, y) => { const fx = x / s - Math.floor(x / s), fy = y / s - Math.floor(y / s); if (fx < .05 || fy < .05) return dk(c, .25); return (Math.floor(x / s) + Math.floor(y / s)) % 2 && p.c2 ? c2 : c; }; }
  if (st === 'border') return (x, y) => { const e = Math.min(x, y, w - x, d - y); if (e < .3) return e < .05 || e > .25 ? dk(c, .2) : c; const fx = x * 2 - Math.floor(x * 2), fy = y * 2 - Math.floor(y * 2); return fx < .05 || fy < .05 ? dk(c2, .1) : c2; };
  return (x, y) => { const fy = y * 3 - Math.floor(y * 3); if (fy < .06) return dk(c, .35); return hash2(Math.floor(x * 1.2 + Math.floor(y * 3) * .5), Math.floor(y * 3), 17) < .5 ? c : lt(c, .06); };   // boards
}
function floor(p) { qz(0, p.w || 4, 0, p.d || 4, .005, floorPat(p)); }
/* ---------- wall pieces (story details) ---------- */
function deco(p) {
  const k = p.kind, W = p.w || .8, c = p.c || '#2a2733';
  const pic = (x0, x1, z0, z1, fr, bg) => { qy(x0, x1, .02, z0, z1, fr); qy(x0 + .05, x1 - .05, .025, z0 + .05, z1 - .05, bg); };
  switch (k) {
    case 'programme': pic(0, .7, 0, 1.0, BRASS, '#f4ecd8'); qy(.12, .58, .03, .78, .9, '#2f4a3a'); for (const x of [.22, .34, .46]) { ball(x, .035, .64, .03, '#2a2733'); lw([x + .03, .035, .64], [x + .03, .035, .74], '#2a2733'); } lw([.15, .03, .55], [.55, .03, .55], '#8a6a44'); for (let z = .2; z < .45; z += .08) lw([.12, .03, z], [.58, .03, z], '#9a8a70'); ball(.95, .06, .8, .1, BRASS); lw([.95, .06, .9], [.95, .06, 1.0], BRASS); break;
    case 'rail': lw([0, .3, 1.2], [W, .3, 1.2], '#3a3a40'); for (const x of [.04, W - .04]) { lw([x, .3, 0], [x, .3, 1.2], '#3a3a40'); lw([x, .1, 0], [x, .5, 0], '#3a3a40'); } for (let i = 0; i < 5; i++) { const x = .15 + i * (W - .3) / 4, cc = ['#c8343a', '#3a5a9a', '#e8c060', '#7a4a8a', '#2a8a6a'][i]; lw([x, .3, 1.2], [x, .3, 1.12], '#8a8f98'); fq([[x - .12, .3, 1.12], [x + .12, .3, 1.12], [x + .16, .3, .4], [x - .16, .3, .4]], cc); } break;
    case 'panes': for (let x = 0; x < W - .01; x += .5) for (let z = 0; z < 1.6; z += .4) { qy(x + .03, x + .47, .02, z + .03, z + .37, '#bcd8c4', '#c8e0cc'); } for (let x = 0; x <= W + .01; x += .5) lw([x, .025, 0], [x, .025, 1.6], '#e8ece8'); lw([0, .025, 1.6], [W, .025, 1.6], '#e8ece8'); for (let i = 0; i < 6; i++) { const x = .1 + i * W / 6; lw([x, .03, 1.6], [x + .1, .03, 1.1 - (i % 3) * .2], '#4f7a3a'); blob(x + .1, .03, 1.1 - (i % 3) * .2, 2, 1.5, '#6aa04a'); } break;
    case 'hatch': qy(0, .8, .02, 0, .8, '#e8eef0'); frameY(0, .8, .02, 0, .8, '#8a9098'); qy(.06, .74, .025, .06, .74, '#d0dcd8'); qy(.15, .65, .03, .86, 1.0, '#3a8a6a'); lw([.64, .03, .36], [.64, .03, .46], '#5a6068'); lw([1.2, .03, 1.3], [1.2, .03, .2], '#c8343a'); qy(1.14, 1.26, .035, .12, .24, '#c8343a'); lw([.95, .08, .9], [1.45, .08, .9], '#c2c8cc'); break;   // + the red pull cord and a grab rail
    case 'flights': { box(0, 0, 0, W, .08, 1.7, '#1b2028'); qy(.06, W - .06, .081, .06, 1.64, '#141820'); label('DEPARTURES', .06, W - .06, .082, 1.25, '#f2c230'); const R = ['YVR', 'BOS'], fl = isFlipped(); R.forEach((r, i) => { const z = .8 - i * .45, L = fl ? [W * .5, W - .06] : [.06, W * .5], S = fl ? [.1, W * .5] : [W * .5, W - .1]; label(r, L[0], L[1], .082, z, '#f4f0e8'); label(i ? 'LATE' : 'ON', S[0], S[1], .082, z, i ? '#e8483c' : '#9ccc4a'); }); glow(() => qy(0, W, .09, -.1, 1.7, '#4a6a9a30')); break; }
    case 'babysign': qy(0, 1.7, .02, 0, .8, '#3a6ab0'); label('BABY', 0, 1.7, .025, .72, '#f4f0e8'); label('CHANGE', 0, 1.7, .025, .32, '#f4f0e8'); fq([[1.45, .025, .3], [1.6, .025, .4], [1.45, .025, .5]], '#f4f0e8'); break;
    case 'cobweb': for (let i = 0; i < 5; i++) lw([0, .02, 0], [Math.cos(i * .35) * .5, .02, -Math.sin(i * .35) * .5 + .5], '#d8d8d4'); for (const r of [.2, .35]) for (let i = 0; i < 4; i++) lw([Math.cos(i * .35) * r, .02, .5 - Math.sin(i * .35) * r], [Math.cos((i + 1) * .35) * r, .02, .5 - Math.sin((i + 1) * .35) * r], '#d8d8d4'); dot(.25, .025, .3, '#2a2733'); break;
    case 'notice': pic(0, 2.3, 0, 1.3, '#2f5a3a', '#f4f0e8'); label('NOT FOR', 0, 2.3, .03, .95, '#2f5a3a'); label('DRINKING', 0, 2.3, .03, .45, '#c8343a'); break;
    case 'tide': pic(0, .7, 0, .9, '#2a4a6a', '#f4f0e8'); qy(.1, .6, .03, .74, .82, '#2a4a6a'); for (let i = 0; i < 12; i++) { const x = .08 + i * .045; lw([x, .03, .4 + Math.sin(i * .9) * .15], [x + .045, .03, .4 + Math.sin((i + 1) * .9) * .15], '#3a7ab0'); } discY(1.0, .05, .5, .22, '#c8343a'); discY(1.0, .055, .5, .13, '#e8e4dc'); break;
    case 'bottle': bx(0, 0, .3, W, .2, .04, '#5a3a20'); cyl(.3, .1, .34, .1, .08, '#cfe8e0', { ol: false }); lw([.18, .1, .38], [.42, .1, .38], '#cfe8e0'); fq([[.24, .1, .38], [.36, .1, .38], [.33, .1, .52], [.27, .1, .52]], '#f4f0e8'); lw([.3, .1, .38], [.3, .1, .52], '#8a5a34'); ball(.6, .1, .42, .08, '#c9a35a'); break;
    case 'song': pic(0, 1.5, 0, 1.0, '#4ac0e0', '#fffbe8'); label('WASH', 0, 1.5, .03, .95, '#e8483c'); label('SING!', 0, 1.5, .03, .5, '#4a8a3a'); blob(1.3, .03, .2, 3, 3, '#f2c230'); for (let i = 0; i < 3; i++) dot(.2 + i * .12, .03, .12, ['#e8483c', '#4ac0e0', '#9ccc4a'][i]); break;
    case 'pole': pic(0, .6, 0, 1.0, '#c8343a', '#f4ecd8'); lw([.3, .03, .1], [.3, .03, .9], BRASS); lw([.31, .03, .1], [.31, .03, .9], dk(BRASS, .3)); qy(.15, .45, .03, .16, .26, '#c8343a'); for (const x of [.85, 1.05]) { lw([x, .05, .7], [x, .1, .62], '#5e666c'); qy(x - .08, x + .08, .1, .1, .6, '#e8b040'); } break;
    case 'sketch': for (let i = 0; i < 3; i++) { const x = i * .42; pic(x, x + .36, .1 + (i % 2) * .2, .6 + (i % 2) * .2, '#e8e0d0', '#fbf8f0'); lw([x + .18, .03, .5 + (i % 2) * .2], [x + .18, .03, .2 + (i % 2) * .2], '#3a3a40'); fq([[x + .1, .03, .2 + (i % 2) * .2], [x + .26, .03, .2 + (i % 2) * .2], [x + .2, .03, .4 + (i % 2) * .2], [x + .16, .03, .4 + (i % 2) * .2]], ['#e8a0b8', '#7ac0d8', '#e8c060'][i]); } break;
    case 'antique': pic(0, .5, .2, .9, '#c9a35a', '#5a4a3a'); blob(.25, .03, .62, 3, 4, '#c8b090'); discY(.85, .05, .7, .2, '#8a6a44'); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; dot(.85 + Math.cos(a) * .14, .055, .7 + Math.sin(a) * .18, '#f4ecd8'); } lw([.85, .055, .7], [.85, .055, .82], '#2a2733'); lw([.85, .055, .7], [.93, .055, .7], '#2a2733'); break;
    case 'towels': bx(0, 0, .3, W, .3, .04, '#e8e0d0'); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) box(.08 + i * (W - .16) / 4, .04, .34 + j * .1, (W - .2) / 4, .24, .09, ['#e8c0c8', '#f4f0e8', '#b8d0e0', '#f4e0b0'][(i + j) % 4], { ol: false }); break;
    case 'stamps': pic(0, .9, 0, .7, '#3a3a40', '#f4ecd8'); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const x = .1 + i * .18, z = .08 + j * .18; qy(x, x + .15, .03, z, z + .15, '#f8f4ea'); qy(x + .02, x + .13, .032, z + .02, z + .13, p.c || '#c8343a'); dot(x + .075, .034, z + .075, '#f4ecd8'); } break;
    case 'postcards': bx(0, 0, 0, .9, .14, .06, '#8a8f98'); for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { const x = .04 + i * .22, z = .08 + r * .3; qy(x, x + .19, .1, z, z + .26, ['#4ac0e0', '#f2c230', '#e8483c', '#9ccc4a', '#f4a8c0', '#7a9ac8'][(r * 4 + i) % 6]); qy(x + .03, x + .16, .101, z + .03, z + .1, '#f4f0e8'); } break;
    default: pic(0, W, 0, .7, c, '#f4f0e8');
  }
}
/* ---------- floor pieces ---------- */
function prop(p) {
  const k = p.kind;
  if (k === 'trolley') { lw([.05, .5, .1], [.05, .5, 1.0], '#8a9098'); lw([.75, .5, .1], [.75, .5, 1.0], '#8a9098'); lw([.05, .5, 1.0], [.75, .5, 1.0], '#c8343a'); box(.05, .05, .1, .7, .45, .06, '#8a9098', {}); box(.12, .1, .16, .5, .3, .3, '#3a5a9a', {}); for (const x of [.1, .7]) ball(x, .45, .05, .05, '#2a2733'); }
  else if (k === 'can') { cyl(.25, .25, 0, .16, .3, '#5a8a6a', {}); lw([.38, .25, .2], [.55, .25, .4], '#5a8a6a'); lw([.15, .25, .3], [.25, .25, .42], '#4a7a5a'); lw([.25, .25, .42], [.35, .25, .3], '#4a7a5a'); }
  else if (k === 'leaves') { for (let i = 0; i < 8; i++) blob(.1 + (i * 37 % 60) / 100, .1 + (i * 53 % 50) / 100, .01, 2, 1, ['#c8783a', '#a8582a', '#d8a040'][i % 3]); }
  else if (k === 'helmet') { const c = p.c || '#c8343a'; ball(.25, .25, .2, .2, c); qz(.05, .45, .05, .45, .2, dk(c, .2)); box(.18, .38, .05, .14, .1, .06, '#2a2733', {}); }
}

const ST4 = ['marble', 'dresser', 'potting', 'clinic', 'airport', 'parktrough', 'washstand', 'gull', 'kids', 'fire', 'console', 'pedestal'];
const DK = ['programme', 'rail', 'panes', 'hatch', 'flights', 'babysign', 'cobweb', 'notice', 'tide', 'bottle', 'song', 'pole', 'sketch', 'antique', 'towels', 'stamps', 'postcards'];
export default [
  F('wc.basin4', ['wc', 'sink'], p => [bw(p), .56, .9], basin, { vb: p => [-.3, -.3, 0, bw(p) + .3, .9, 1.6], use: p => ({ x: bw(p) / 2, y: .95 }), variants: ST4.map(style => ({ style })) }),
  F('wc.glass4', ['wc', 'mirror', 'decor'], p => [p.w || .7, .06, 1.0], glass, { wall: true, mount: 1.2, solid: false, variants: [{ kind: 'oval' }, { kind: 'arch', c: '#e8ece8' }, { kind: 'scrawl', w: .8 }, { kind: 'polished', w: .8 }, { kind: 'plain', c: '#3a5a9a', w: 3 }] }),
  F('wc.floor4', ['wc', 'floor'], p => [p.w || 4, p.d || 4, .01], floor, { solid: false, flat: true, variants: ['border', 'piano', 'stage', 'brick', 'vinyl', 'apt', 'park', 'flock', 'kids', 'redtile', 'tiles', 'boards'].map(style => ({ style, w: 4, d: 3 })) }),
  F('wc.deco4', ['wc', 'decor'], p => [p.w || 1.0, .12, 1.4], deco, { wall: true, mount: 1.0, solid: false, vb: p => [-.4, -.2, -.3, (p.w || 1) + .4, .4, 2.1], variants: DK.map(kind => ({ kind, w: ['flights', 'jet', 'weave', 'panes', 'peg', 'pans', 'towels', 'slab', 'leaves', 'rail'].includes(kind) ? 1.6 : 1.0 })) }),
  F('wc.prop4', ['wc', 'decor'], p => (p.kind === 'trolley' ? [.8, .55, 1.0] : [.5, .5, .4]), prop, { variants: ['trolley', 'can', 'leaves', 'helmet'].map(kind => ({ kind })) }),
];
