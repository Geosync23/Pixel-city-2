// Real venue restrooms, batch 3 (owner msgs 151 + 192): the Grand Maple Hotel (deco), Bean & Gone (cafe), Noodle Lantern (ramen), Slice of Heaven (pizza),
// Rise & Shine (bakery), the Aquarium (aqua), the Natatorium (pool), the University Commons (uni), the Orpheum (cinema), Bay Fish Hall (fish),
// the Observatory (obs) and one shared layout for five small coffee / tea places (nook, coloured per venue). Stalls, doors, bins: restrooms_art.js.
//   basin3 {style, c}  tag sink      glass3 {kind fan|round|oval|porthole|bulbs|rect, c, w}  (wall)      floor3 {style, w, d, c}  (flat)
//   deco3 {kind ...} wall pieces     prop3 {kind pouf|slippers|boots|lost|sunflower} floor pieces
import { box, qy, qx, qz, lw, fq, glow, lit, cyl, ball, dk, lt, hash2 } from '../../engine/raster.js';
import { F, bx, frameY } from './_lib.js';
import { PORC, BRASS, CHROME, INK, shadow, dot, blob, discY, label } from './restrooms_art.js';

const tap = (x, y, z, m, h = .2, r = .13) => { lw([x, y, z], [x, y, z + h], m); lw([x, y, z + h], [x, y + r, z + h - .03], m); };
const bowlIn = (cx, y, z, rx, ry, rim, water) => { blob(cx, y, z, rx, ry, rim); blob(cx, y + .01, z, rx - 1, ry - .6, water || '#d8eaf0'); };

/* ---------- basins ---------- */
const BW = { deco: 2.4, cafe: .9, ramen: .8, pizza: .9, bakery: .8, aqua: 2.6, pool: 3, uni: 2, cinema: 2, fish: 1.4, obs: .8, nook: .8 };
const bw = p => p.w || BW[p.style] || 1;
function basin(p) {
  const st = p.style, W = bw(p); shadow(0, W, 0, .6);
  if (st === 'deco') {   // black marble on gold legs, two round basins, a vase of roses, a tray of lotions
    for (const x of [.1, W - .1]) for (const y of [.08, .48]) lw([x, y, 0], [x, y, .78], BRASS);
    box(0, 0, .78, W, .56, .1, '#1e1a22', { t: (x, y) => (Math.abs(((x * 1.9 + y * 2.7) % 1.2) - .6) < .015 ? '#4a4450' : '#26202c'), l: BRASS });
    for (const cx of [.6, 1.8]) { bowlIn(cx, .3, .885, 5, 2.2, '#f4f1ea'); tap(cx, .06, .88, BRASS, .22, .14); }
    cyl(1.2, .2, .88, .06, .16, '#d8eef4', { ol: false }); for (const [dx, dz] of [[-.05, .2], [.04, .24], [0, .28], [.07, .2]]) ball(1.2 + dx, .2, .88 + dz, .045, '#c8344a');
    bx(1.02, .34, .885, .36, .16, .02, BRASS); cyl(1.1, .42, .9, .03, .1, '#f2d8e0', { ol: false }); cyl(1.28, .42, .9, .035, .07, '#e8d4a0', { ol: false });
  } else if (st === 'cafe' || st === 'nook') {   // a ceramic bowl on a reclaimed-wood shelf, a mason jar of soap
    const wd = p.c || '#8a6040'; box(0, 0, .7, W, .48, .1, wd, { t: lt(wd, .1) }); for (const x of [.1, W - .14]) bx(x, .02, .3, .04, .1, .4, '#3a3a40');
    cyl(W / 2, .26, .8, .19, .1, p.c2 || '#e8e2d6', { t: '#cfc6b6' }); blob(W / 2, .26, .9, 3, 1.3, '#b8d8e4'); tap(W / 2, .04, .8, '#3a3a40', .26, .16);
    cyl(W - .14, .3, .8, .05, .12, '#d8eef0', { ol: false }); dot(W - .14, .3, .94, '#c2a050');
  } else if (st === 'ramen') {   // a round stone basin fed by a bamboo spout, a wooden ladle
    box(.05, .05, 0, .7, .45, .5, '#7a7470', { t: '#6a6460' }); cyl(.4, .28, .5, .24, .14, '#8a8480', { t: '#5a5450' }); blob(.4, .28, .64, 4, 1.8, '#5a7a88');
    lw([.05, .02, 1.0], [.4, .2, .78], '#9ab050'); lw([.06, .03, 1.02], [.41, .21, .8], '#7a9040'); dot(.4, .22, .72, '#cfeeff'); lw([.6, .36, .66], [.74, .44, .7], '#c09060');
  } else if (st === 'pizza') {   // a deep farmhouse sink with a flour-sack towel
    box(.05, 0, 0, W - .1, .5, .6, '#e8e4dc', { l: '#ece8e0', r: '#d0ccc4' }); box(0, 0, .6, W, .52, .2, PORC, { t: (x, y) => (x > .1 && x < W - .1 && y > .08 && y < .44 ? '#d0ccc4' : PORC) });
    for (const [x, c] of [[.2, '#c8574d'], [W - .2, '#4f74b8']]) { lw([x, .04, .8], [x, .04, .92], CHROME); dot(x, .04, .94, c); } tap(W / 2, .04, .8, CHROME, .22, .18);
    qy(.3, .62, .525, .42, .74, '#f4f0e8'); lw([.3, .53, .6], [.62, .53, .6], '#c8343a'); lw([.3, .53, .64], [.62, .53, .64], '#3f8a55');
  } else if (st === 'bakery') {   // an enamel washbowl on a wooden stand, a jug, a floury bar of soap
    for (const x of [.1, .7]) for (const y of [.06, .44]) lw([x, y, 0], [x, y, .72], '#8a6a44'); box(.05, 0, .66, .7, .5, .06, '#a07a50'); bx(.08, .02, .2, .64, .46, .03, '#8a6a44');
    cyl(.4, .25, .72, .26, .1, '#f4f4f0', { t: '#2a4a7a' }); blob(.4, .25, .82, 4, 1.8, '#c8e4ee'); cyl(.62, .1, .72, .06, .2, '#f4f4f0', { t: '#2a4a7a' }); bx(.12, .38, .72, .1, .06, .03, '#f4ecd8');
  } else if (st === 'aqua') {   // scallop-shell basins on a coral-pink counter
    box(0, 0, 0, W, .54, .8, '#e88a78', { t: '#f0a090', l: (u, v) => (v % 6 === 0 ? '#d07060' : '#e88a78') });
    for (const cx of [.7, 1.9]) { for (let i = 0; i < 5; i++) blob(cx - .14 + i * .07, .3, .81, 2.2, 2.2, '#f8f0e8'); blob(cx, .32, .81, 4, 1.6, '#c8e8f0'); for (let i = 0; i < 5; i++) lw([cx, .38, .81], [cx - .14 + i * .07, .2, .81], '#e8d8c8'); tap(cx, .05, .8, BRASS, .2, .14); }
  } else if (st === 'pool') {   // a tiled ledge with three white basins and push taps
    box(0, 0, 0, W, .5, .78, '#e8eef0', { l: (u, v) => (u % 6 === 0 || v % 6 === 0 ? '#b8c8cc' : '#e8eef0') }); qy(0, W, .5, .7, .78, '#5ab4c8');
    for (const cx of [.5, 1.5, 2.5]) { bowlIn(cx, .28, .785, 4.5, 2, '#f4f4f4'); bx(cx - .04, .02, .82, .08, .06, .08, CHROME); dot(cx, .08, .86, '#2a2733'); }
  } else if (st === 'uni') {   // a white laminate counter, two basins, a forgotten textbook
    box(0, 0, .74, W, .52, .08, '#f0eee8', { l: '#2c3a5c' }); qy(0, W, .52, 0, .74, '#2c3a5c'); for (const cx of [.5, 1.5]) { bowlIn(cx, .28, .825, 4.5, 2, '#dcdad4'); tap(cx, .05, .82, CHROME); }
    box(.85, .12, .82, .34, .24, .07, '#b8342e', { t: '#f4f0e8' }); lw([.86, .36, .86], [1.18, .36, .86], '#f4f0e8');
  } else if (st === 'cinema') {   // black counter with a brass edge, two basins
    box(0, 0, .76, W, .54, .1, '#1e1a1a', { l: BRASS }); qy(.05, W - .05, .54, 0, .76, '#3a1418'); for (let x = .2; x < W; x += .3) lw([x, .54, .05], [x, .54, .7], '#5a2028');
    for (const cx of [.5, 1.5]) { bowlIn(cx, .3, .865, 4.5, 2, '#2a2626', '#5a6068'); tap(cx, .05, .86, BRASS); }
  } else if (st === 'fish') {   // a deep galvanised sink with a hose bib and a scrubbing brush
    for (const x of [.08, W - .08]) lw([x, .4, 0], [x, .4, .56], '#7a8288'); box(0, 0, .56, W, .5, .32, '#a8b0b4', { t: '#6a7278', l: (u, v) => (u % 7 === 0 ? '#98a0a4' : '#a8b0b4') });
    qz(.06, W - .06, .06, .44, .885, '#7a8288'); tap(W / 2, .03, .88, '#c2c8cc', .3, .18); lw([W / 2, .03, 1.1], [W / 2 + .3, .03, .9], '#2a6a3a'); bx(.2, .1, .89, .2, .08, .04, '#e8b040');
  } else if (st === 'obs') {   // a copper bowl on a dark wood stand
    box(.05, 0, 0, .7, .5, .74, '#2a2018', { l: (u, v) => (v % 5 === 0 ? '#3a2c20' : '#2a2018') }); cyl(.4, .25, .74, .26, .1, '#c87a4a', { t: '#a85a30' }); blob(.4, .25, .84, 4, 1.8, '#3a4a6a'); tap(.4, .03, .74, '#c87a4a', .3, .16);
  }
}
/* ---------- mirrors ---------- */
function glass(p) {
  const k = p.kind, c = p.c || BRASS, W = p.w || .8;
  const sheen = (x0, x1, z1) => { lw([x0 + (x1 - x0) * .2, .04, z1 - .06], [x0 + (x1 - x0) * .2 + .18, .04, z1 - .3], '#e6f4f8'); };
  if (k === 'fan') { const P = [[.4, .03, 0]]; for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; P.push([.4 + Math.cos(a) * .42, .03, Math.sin(a) * .7]); } fq(P, BRASS); fq(P.map(q => [.4 + (q[0] - .4) * .86, .035, q[2] * .86 + .03]), '#b8d4de', '#c4dde6'); for (let i = 1; i < 6; i++) { const a = Math.PI * i / 6; lw([.4, .04, .03], [.4 + Math.cos(a) * .36, .04, .03 + Math.sin(a) * .6], '#d8b46a'); } }
  else if (k === 'round' || k === 'porthole') { discY(.35, .03, .35, .35, c); discY(.35, .035, .35, k === 'porthole' ? .26 : .3, '#b8d4de', '#c4dde6'); if (k === 'porthole') for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; dot(.35 + Math.cos(a) * .31, .04, .35 + Math.sin(a) * .31, '#7a5a20'); } sheen(.15, .5, .6); }
  else if (k === 'oval') { const P = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; P.push([.3 + Math.cos(a) * .28, .03, .4 + Math.sin(a) * .4]); } fq(P, c); fq(P.map(q => [.3 + (q[0] - .3) * .84, .035, .4 + (q[2] - .4) * .88]), '#b8d4de', '#c4dde6'); lw([.06, .04, .78], [.54, .04, .78], '#c8343a'); lw([.06, .04, .8], [.54, .04, .8], '#3f8a55'); }
  else if (k === 'bulbs') { qy(0, W, .03, 0, .7, '#2a2626'); qy(.08, W - .08, .035, .08, .62, '#b8d0d8', '#c4dae2'); for (let x = .08; x < W; x += .2) { dot(x, .045, .69, '#f8f0c0'); dot(x, .045, .01, '#f8f0c0'); glow(() => blob(x, .05, .69, 2, 2, '#fff2c0')); } for (let z = .15; z < .62; z += .16) { dot(.03, .045, z, '#f8f0c0'); dot(W - .03, .045, z, '#f8f0c0'); } }
  else { qy(0, W, .03, 0, .7, c); qy(.04, W - .04, .035, .04, .66, '#b8d0d8', '#c4dae2'); sheen(.04, W - .04, .66); if (p.sticker) qy(W - .25, W - .1, .04, .08, .2, '#f2c230'); }
}
/* ---------- floors ---------- */
function floorPat(p) {
  const st = p.style, w = p.w || 4, d = p.d || 4, H = (x, y, s) => hash2(Math.floor(x * 16), Math.floor(y * 16), s);
  if (st === 'deco') return (x, y) => { const u = (x + y) * 1.4, v = (x - y) * 1.4, k = (Math.floor(u) + Math.floor(v)) % 2; const fu = u - Math.floor(u), fv = v - Math.floor(v); if (fu < .04 || fv < .04) return '#a88a4a'; return k ? '#1e1a22' : '#efe8dc'; };
  if (st === 'cafe') return (x, y) => { const i = Math.floor(x * 3), j = Math.floor(y * 3 + (i % 2) * .5), fx = x * 3 - i, fy = y * 3 + (i % 2) * .5 - j; if (fx < .1 || fy < .1) return '#d8d4c8'; return ['#5a8a6a', '#6a9a78', '#4f7f60'][(i * 3 + j) % 3]; };
  if (st === 'ramen') return (x, y) => { const n = H(x, y, 11), r = Math.hypot((x % 1) - .5, (y % 1) - .5); return r < .32 ? (n < .1 ? '#5a5a5e' : '#6a6a6e') : '#3a3a3e'; };
  if (st === 'pizza') return (x, y) => { const fx = x * 2 - Math.floor(x * 2), fy = y * 2 - Math.floor(y * 2); if (fx < .06 || fy < .06) return '#e8dcc8'; return H(x, y, 12) < .05 ? '#b8604a' : '#c8704e'; };
  if (st === 'bakery') return (x, y) => { const fy = y * 3 - Math.floor(y * 3); if (fy < .06) return '#9a7048'; const n = H(x, y, 13); return n < .03 ? '#e8dcc4' : n < .08 ? '#d8bc94' : '#c89a68'; };
  if (st === 'aqua') return (x, y) => { if (Math.abs(y - (d - 1) - Math.sin(x * 3) * .12) < .08) return '#f4f8fb'; const fx = x * 2 - Math.floor(x * 2), fy = y * 2 - Math.floor(y * 2); if (fx < .05 || fy < .05) return '#1a4a6a'; return ['#2a6a9a', '#3a7aaa', '#2f72a2'][(Math.floor(x * 2) + Math.floor(y * 2) * 3) % 3]; };
  if (st === 'pool') return (x, y) => { if (Math.hypot(x - w / 2, y - d / 2) < .12) return '#5a6a70'; const fx = x * 3 - Math.floor(x * 3), fy = y * 3 - Math.floor(y * 3); if (fx < .08 || fy < .08) return '#b8ccd2'; return '#d8e8ec'; };
  if (st === 'uni') return (x, y) => { const n = H(x, y, 14); return n < .03 ? '#8a8478' : n < .05 ? '#c8c2b4' : '#b0a898'; };
  if (st === 'cinema') return (x, y) => { const u = (x * 2) % 2, v = (y * 2) % 2, n = H(x, y, 15); if (n < .006) return '#f4e8a0'; if (Math.hypot(u - 1, v - 1) < .35) return '#c8a040'; if (Math.abs(u - v) < .08 || Math.abs(u + v - 2) < .08) return '#2a5a6a'; return '#5a1820'; };
  if (st === 'fish') return (x, y) => { if (Math.hypot(x - w / 2, y - d / 2) < .12) return '#3a3a3e'; if (Math.hypot((x - w / 2) * .6, y - d / 2 - .2) < .5) return '#a85840'; const fx = x * 2 - Math.floor(x * 2), fy = y * 2 - Math.floor(y * 2); if (fx < .05 || fy < .05) return '#6a3a30'; return '#8a4a38'; };
  if (st === 'obs') return (x, y) => { const cx = x - w / 2, cy = y - d / 2, r = Math.hypot(cx, cy), a = Math.atan2(cy, cx), star = .3 + .3 * Math.abs(Math.cos(a * 2.5)); if (r < .75 && r < star + .15) return r < star ? '#c9a35a' : '#a88a4a'; if (H(x, y, 16) < .01) return '#8a94c0'; return '#1c2448'; };
  const c = p.c || '#a07850'; return (x, y) => { const fy = y * 3 - Math.floor(y * 3); if (fy < .06) return dk(c, .35); return H(Math.floor(x * 1.2 + Math.floor(y * 3) * .5) / 16, y, 17) < .5 ? c : lt(c, .06); };   // nook: plank floor in the venue's wood
}
function floor(p) { qz(0, p.w || 4, 0, p.d || 4, .005, floorPat(p)); }
/* ---------- wall pieces ---------- */
function deco(p) {
  const k = p.kind, W = p.w || 1.4;
  if (k === 'chalk') { qy(0, W, .02, 0, 1.1, '#2a3a32'); frameY(0, W, .02, 0, 1.1, '#8a6a44'); label('BEAN', 0, W * .6, .025, .98, '#f4f0e8'); label('THERE', W * .3, W, .025, .7, '#f2c230'); heartLine(W * .2, .025, .3); lw([W * .55, .025, .25], [W * .85, .025, .4], '#f4a8c0'); lw([W * .85, .025, .4], [W * .7, .025, .15], '#f4a8c0'); dot(W * .9, .025, .9, '#9ad8f0'); }
  else if (k === 'pothos') { lw([.1, .1, 1.2], [W - .1, .1, 1.2], '#8a6a44'); for (let i = 0; i < 9; i++) { const x = .15 + i * (W - .3) / 8, z = 1.18 - (i % 3) * .25 - .1; lw([x, .12, 1.2], [x, .12, z], '#4f7a3a'); blob(x, .12, z, 2, 1.5, i % 2 ? '#6aa04a' : '#4f8a3a'); } }
  else if (k === 'shoji') { qy(0, W, .02, 0, 1.4, '#f4ecd8'); for (let x = 0; x <= W + .01; x += W / 3) lw([x, .025, 0], [x, .025, 1.4], '#5a3a28'); for (let z = 0; z <= 1.41; z += .35) lw([0, .025, z], [W, .025, z], '#5a3a28'); glow(() => qy(0, W, .03, 0, 1.4, '#ffe8b030')); }
  else if (k === 'nonna') { qy(0, .5, .02, .4, 1.0, '#8a5a3a'); qy(.05, .45, .025, .45, .95, '#e8dcc0'); blob(.25, .03, .74, 3, 3, '#8a7a6a'); blob(.25, .03, .62, 4, 3, '#5a4a40'); qy(.65, 1.15, .02, .2, .9, '#f4f0e8'); qy(.65, 1.15, .025, .7, .9, '#c8343a'); for (let z = .28; z < .66; z += .12) for (let x = .7; x < 1.12; x += .1) dot(x, .025, z, '#9a948a'); }
  else if (k === 'tank') {   // a small aquarium set into the wall: fish, weed, bubbles, lit day and night
    qy(-.05, W + .05, .02, -.05, .95, '#1a3a4a'); lit(() => { qy(0, W, .025, 0, .9, '#2a8ab0'); qy(0, W, .026, 0, .15, '#c8b888'); for (let i = 0; i < 4; i++) { const x = .2 + i * (W - .4) / 3; lw([x, .027, .15], [x + .05, .027, .5 + (i % 2) * .2], '#3a8a4a'); } for (const [x, z, c] of [[.4, .6, '#f28a30'], [.9, .4, '#f2d040'], [1.3, .7, '#e8483c'], [.7, .3, '#4ac8f0']]) if (x < W) { blob(x, .03, z, 2.2, 1.2, c); dot(x - .08, .03, z, c, 0, 0); dot(x + .04, .03, z + .01, '#2a2733'); } for (let z = .2; z < .85; z += .16) dot(W - .2, .03, z, '#cfeeff'); }); glow(() => qy(0, W, .04, 0, .9, '#4ac8f030')); }
  else if (k === 'hairdryer') { box(.1, 0, .2, .3, .14, .3, '#e8eef0'); lw([.25, .14, .2], [.3, .2, -.1], '#3a3f44'); box(.24, .18, -.24, .14, .14, .16, '#e8eef0'); qy(.14, .36, .141, .36, .44, '#5ab4c8'); }
  else if (k === 'flyers') { qy(0, W, .02, 0, .9, '#b08a5a'); frameY(0, W, .02, 0, .9, '#6a4a30'); for (let i = 0; i < 6; i++) { const x = .08 + (i % 3) * (W - .16) / 3, z = .08 + Math.floor(i / 3) * .42; qy(x, x + (W - .3) / 3, .025, z, z + .34, ['#f4f0e8', '#f2c230', '#9ccc4a', '#f4a8c0', '#9ad8f0', '#f4f0e8'][i]); dot(x + .1, .03, z + .3, '#c8343a'); } label('BAND', .05, W * .45, .03, .78, '#2a2733'); }
  else if (k === 'poster') { qy(0, .8, .02, 0, 1.2, BRASS); qy(.06, .74, .025, .06, 1.14, '#1a2a4a'); blob(.4, .03, .7, 7, 7, '#f2c230'); label('GULL', .06, .74, .03, .4, '#f4f0e8'); glow(() => qy(.06, .74, .03, .06, 1.14, '#fff2c020')); }
  else if (k === 'starmap') { qy(0, W, .02, 0, 1.0, '#1a2040'); frameY(0, W, .02, 0, 1.0, BRASS); const S = [[.2, .8], [.4, .7], [.55, .75], [.75, .6], [.9, .55], [.3, .3], [.5, .4], [.7, .25], [1.1, .7], [1.2, .4]]; for (let i = 0; i < S.length; i++) { if (S[i][0] > W - .05) continue; dot(S[i][0], .025, S[i][1], '#f4f0e8'); if (i < 4) lw([S[i][0], .025, S[i][1]], [S[i + 1][0], .025, S[i + 1][1]], '#4a5a90'); } label('YOU', .1, .6, .025, .22, '#f2c230'); }
  else if (k === 'redlight') { box(0, 0, 0, W, .08, .08, '#2a2a30'); lit(() => qy(.04, W - .04, .081, .01, .07, '#ff3a3a')); glow(() => qy(0, W, .09, -.3, .1, '#ff2a2a40')); }
  else if (k === 'owl') { qy(0, .7, .02, 0, .9, '#2a2440'); frameY(0, .7, .02, 0, .9, '#c9a35a'); blob(.35, .03, .45, 5, 6, '#8a6a4a'); blob(.28, .03, .55, 2, 2, '#f2d040'); blob(.42, .03, .55, 2, 2, '#f2d040'); dot(.28, .03, .55, '#2a2733'); dot(.42, .03, .55, '#2a2733'); dot(.35, .03, .48, '#e8843a'); }
  else if (k === 'tins') { bx(0, 0, .5, W, .2, .04, '#7a5a3a'); for (let i = 0; i < 6; i++) cyl(.12 + i * (W - .2) / 5, .1, .54, .07, .16, ['#c8343a', '#d8a848', '#3f6a8a', '#c8c8c0', '#3f8a55', '#e8843a'][i], { ol: false }); }
  else if (k === 'kettles') { bx(0, 0, .5, W, .22, .04, '#5a3e28'); for (let i = 0; i < 3; i++) { const x = .25 + i * (W - .4) / 2, c = ['#c8574d', '#3f8f8a', '#e8c060'][i]; ball(x, .11, .66, .11, c); lw([x + .1, .11, .66], [x + .2, .11, .74], c); lw([x - .06, .11, .76], [x + .06, .11, .76], '#3a3a40'); } }
  else if (k === 'rabbit') { const P = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; P.push([.35 + Math.cos(a) * .32, .02, .5 + Math.sin(a) * .32]); } fq(P, '#f4ecd8'); blob(.35, .03, .45, 4, 2.6, '#6aa88a'); blob(.42, .03, .52, 2, 2, '#6aa88a'); lw([.4, .03, .55], [.36, .03, .72], '#6aa88a'); lw([.44, .03, .55], [.46, .03, .72], '#6aa88a'); }
  else if (k === 'sun') { const P = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? .22 : .34; P.push([.35 + Math.cos(a) * r, .02, .5 + Math.sin(a) * r]); } fq(P, '#f2c230'); blob(.35, .03, .5, 3, 3, '#8a5a2a'); }
}
const heartLine = (xc, y, zc) => { const H = [[0, -.1], [.1, .02], [.08, .07], [.04, .08], [0, .04], [-.04, .08], [-.08, .07], [-.1, .02]]; for (let i = 0; i < H.length; i++) { const a = H[i], b = H[(i + 1) % H.length]; lw([xc + a[0], y, zc + a[1]], [xc + b[0], y, zc + b[1]], '#f4a8c0'); } };
/* ---------- floor pieces ---------- */
function prop(p) {
  const k = p.kind;
  if (k === 'pouf') { cyl(.3, .3, 0, .26, .36, '#b8345a', { t: '#c8406a' }); for (let i = 0; i < 4; i++) dot(.3 + Math.cos(i * 1.6) * .12, .3 + Math.sin(i * 1.6) * .12, .36, '#e8c060'); }
  else if (k === 'slippers') { for (const [x, c] of [[.08, '#2c3a6a'], [.3, '#2c3a6a']]) { box(x, .1, 0, .16, .32, .04, '#d8c8a0', {}); qz(x + .01, x + .15, .1, .22, .045, c); } }
  else if (k === 'boots') { for (const x of [.05, .28]) { box(x, .1, 0, .2, .32, .06, '#2a4a2a', {}); box(x, .1, .06, .2, .14, .44, '#3a6a3a', {}); } }
  else if (k === 'lost') { box(0, 0, 0, .6, .4, .36, '#5ab4c8', { t: '#3a94a8' }); blob(.15, .2, .37, 3, 1.4, '#f2c230'); blob(.32, .25, .38, 4, 1.6, '#f4f0e8'); ball(.48, .15, .4, .05, '#2a2733'); qy(.15, .45, .401, .12, .26, '#f4f0e8'); label('LOST', .15, .45, .402, .25, '#2a2733'); }
  else if (k === 'sunflower') { cyl(.15, .15, 0, .1, .3, '#c8a050', {}); lw([.15, .15, .3], [.15, .15, .95], '#4f7a3a'); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; dot(.15 + Math.cos(a) * .08, .15, .98 + Math.sin(a) * .08, '#f2c230'); } blob(.15, .15, .98, 2, 2, '#6a4a2a'); }
}

const S12 = ['deco', 'cafe', 'ramen', 'pizza', 'bakery', 'aqua', 'pool', 'uni', 'cinema', 'fish', 'obs', 'nook'];
export default [
  F('wc.basin3', ['wc', 'sink'], p => [bw(p), .56, .9], basin, { vb: p => [-.3, -.3, 0, bw(p) + .3, .9, 1.6], use: p => ({ x: bw(p) / 2, y: .95 }), variants: S12.map(style => ({ style })) }),
  F('wc.glass3', ['wc', 'mirror', 'decor'], p => [p.kind === 'bulbs' || p.kind === 'rect' ? p.w || .8 : .8, .06, p.kind === 'fan' ? .75 : .8], glass, { wall: true, mount: 1.2, solid: false, variants: [{ kind: 'fan' }, { kind: 'round', c: '#8a6040' }, { kind: 'oval', c: '#f4f0e8' }, { kind: 'porthole' }, { kind: 'bulbs', w: 1.4 }, { kind: 'rect', c: '#c2c8cc', sticker: 1 }] }),
  F('wc.floor3', ['wc', 'floor'], p => [p.w || 4, p.d || 4, .01], floor, { solid: false, flat: true, variants: S12.map(style => ({ style, w: 4, d: 3 })) }),
  F('wc.deco3', ['wc', 'decor'], p => [p.w || 1.4, .12, 1.4], deco, { wall: true, mount: 1.0, solid: false, vb: p => [-.2, -.2, -.4, (p.w || 1.4) + .2, .4, 1.6], variants: ['chalk', 'pothos', 'shoji', 'nonna', 'tank', 'hairdryer', 'flyers', 'poster', 'starmap', 'redlight', 'owl', 'tins', 'kettles', 'rabbit', 'sun'].map(kind => ({ kind })) }),
  F('wc.prop3', ['wc', 'decor'], p => (p.kind === 'pouf' ? [.6, .6, .4] : p.kind === 'lost' ? [.6, .4, .4] : p.kind === 'sunflower' ? [.3, .3, 1.1] : [.6, .5, .1]), prop, { variants: ['pouf', 'slippers', 'boots', 'lost', 'sunflower'].map(kind => ({ kind })) }),
];
