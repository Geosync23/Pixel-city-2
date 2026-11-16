// Real venue restrooms, batch 2 (owner msgs 151 + 192): art for the SkyDeck lobby (service), Central Station (station), the Galleria (mall), the library,
// the museum, the gym, the Blue Heron (bar) and the Arena. Stalls, bins, doors and signs of these styles live in restrooms_art.js (shared toilet core).
//   basin  {style service|station|mall|library|museum|gym|bar|arena, w}  tag sink. arena = a round wash fountain standing free in the room
//   glass  {style ..., w} wall mirror per style          floor2 {style, w, d} flat floor per style
//   deco   {kind pipes|hivis|mosaic|tv|stickers|label|duck} wall pieces      prop {kind stairs|baby|books|scale}  (tags wcbaby, wcbooks, wcscale; stairs = the station's way down)
//   lamp   {kind cage|globe|red|track|sconce}
import { box, qy, qx, qz, lw, fq, glow, lit, cyl, ball, dk, lt, hash2 } from '../../engine/raster.js';
import { F, bx, frameY } from './_lib.js';
import { PORC, BRASS, CHROME, INK, shadow, dot, blob, discY, label } from './restrooms_art.js';

const STEEL = '#b8bec4', STEELD = '#8a9098';
const tap = (x, y, z, m, h = .22, reach = .14) => { lw([x, y, z], [x, y, z + h], m); lw([x, y, z + h], [x, y + reach, z + h - .03], m); };

/* ---------- basins ---------- */
const BW = { service: .7, station: 3, mall: 3, library: .7, museum: 2.4, gym: 2, bar: .6, arena: 1.4 };
const bw = p => p.w || BW[p.style] || 1;
function basin(p) {
  const st = p.style, W = bw(p);
  if (st === 'arena') {   // the stadium wash fountain: step on the ring, water sprays from the column
    shadow(0, 1.4, 0, 1.4); cyl(.7, .7, 0, .62, .08, '#3a3f4c', { ol: false }); cyl(.7, .7, .08, .3, .3, '#d2392f', {}); cyl(.7, .7, .38, .3, .08, '#f4f0e8', { ol: false }); cyl(.7, .7, .46, .3, .24, '#d2392f', { ol: false });
    cyl(.7, .7, .7, .66, .16, STEEL, { t: '#7a8088' }); blob(.7, .7, .86, 12, 6, '#9aa4ac'); cyl(.7, .7, .86, .08, .32, CHROME);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; dot(.7 + Math.cos(a) * .12, .7 + Math.sin(a) * .12, 1.14, '#cfeeff'); dot(.7 + Math.cos(a) * .3, .7 + Math.sin(a) * .3, 1.02, '#e4f6ff'); }
    cyl(.7, .7, 1.18, .1, .04, '#d2392f', { ol: false }); return;
  }
  shadow(0, W, 0, .6);
  if (st === 'station') {
    box(0, 0, 0, W, .5, .72, '#eef0ea', { l: (u, v) => (u % 8 === 0 || v % 6 === 0 ? '#c8ccc4' : '#eef0ea') }); qy(0, W, .5, 0, .08, '#2f5a46');
    box(-.02, -.02, .72, W + .04, .54, .16, STEEL, { t: STEELD }); qz(.06, W - .06, .06, .44, .885, '#6a7078'); qz(.06, W - .06, .3, .44, .886, '#7a8088');
    for (let x = .4; x < W; x += .75) { tap(x, .05, .88, CHROME, .26, .16); dot(x - .14, .03, 1.02, '#2a2733'); bx(x + .2, 0, 1.1, .12, .08, .2, '#e8e4dc'); dot(x + .26, .08, 1.12, '#3f9a94'); }
  } else if (st === 'mall') {
    glow(() => qy(.05, W - .05, .56, .62, .7, '#c4b4e0'));
    box(0, 0, .74, W, .56, .1, '#efe9e0', { t: (x, y) => (hash2(Math.floor(x * 14), Math.floor(y * 14), 4) < .07 ? '#cfc6b8' : '#f4efe6'), l: '#ddd4c6' }); lw([0, .56, .66], [W, .56, .66], '#b8a6d8');
    for (let i = 0; i < 3; i++) { const cx = (i + .5) * W / 3; blob(cx, .32, .845, 5, 2.2, '#cfc6b8'); blob(cx, .33, .845, 4, 1.6, '#dceef4'); tap(cx, .07, .84, CHROME, .18, .14); dot(cx, .2, 1.0, '#2a2733'); }
    bx(W - .3, .06, .84, .1, .1, .16, '#b8a6d8'); dot(W - .25, .14, 1.02, CHROME);
  } else if (st === 'library') {
    cyl(.35, .25, 0, .1, .66, PORC, { l: '#f4f1ea', r: '#d9d5cb' }); cyl(.35, .25, 0, .14, .06, PORC, {});
    box(.02, 0, .64, .66, .46, .16, PORC, { t: (x, y) => (Math.abs(x - .35) < .22 && y > .12 && y < .38 ? '#d9d5cb' : PORC) }); blob(.35, .26, .8, 3, 1.3, '#a8d8e8');
    for (const [x, c] of [[.16, '#c8574d'], [.54, '#4f74b8']]) { lw([x, .06, .8], [x, .06, .9], BRASS); lw([x - .04, .06, .9], [x + .04, .06, .9], BRASS); dot(x, .06, .92, c); }
    lw([.35, .05, .8], [.35, .05, .9], BRASS); lw([.35, .05, .9], [.35, .14, .88], BRASS); bx(.48, .3, .8, .12, .07, .03, '#efd9a0');
  } else if (st === 'museum') {
    for (let i = 0; i < 2; i++) { const x0 = .25 + i * 1.2; box(x0, .02, 0, .7, .56, .8, '#f8f6f2', { l: '#ece9e3', r: '#d8d4cc' }); cyl(x0 + .35, .3, .8, .22, .12, '#2a2a2e', { t: '#3a3a40' }); blob(x0 + .35, .3, .92, 4, 1.8, '#5a6068');
      lw([x0 + .35, .01, 1.3], [x0 + .35, .16, 1.3], '#2a2a2e'); lw([x0 + .35, .16, 1.3], [x0 + .35, .16, 1.24], '#2a2a2e'); }
  } else if (st === 'gym') {
    box(0, 0, .74, W, .5, .1, STEEL, { t: '#c8ced4', l: STEELD }); lw([.1, .5, .6], [W - .1, .5, .6], '#3a3f4c'); lw([.1, .3, 0], [.1, .3, .74], '#3a3f4c'); lw([W - .1, .3, 0], [W - .1, .3, .74], '#3a3f4c');
    for (let i = 0; i < 2; i++) { const cx = (i + .5) * W / 2; blob(cx, .28, .845, 5, 2.2, STEELD); blob(cx, .29, .845, 4, 1.6, '#a8b0b8'); tap(cx, .06, .84, CHROME, .2, .14); }
    for (const [x, c] of [[W / 2 - .08, '#9ccc4a'], [W / 2 + .06, '#4ad8f0']]) { cyl(x, .14, .84, .05, .16, c, { ol: false }); lw([x, .14, 1.0], [x, .14, 1.06], '#2a2733'); }
  } else if (st === 'bar') {
    lw([.1, .02, .55], [.2, .3, .72], '#2a2733'); lw([.5, .02, .55], [.4, .3, .72], '#2a2733'); cyl(.3, .26, .66, .24, .12, STEEL, { t: '#7a8088' }); blob(.3, .26, .78, 4, 1.8, '#6a7078');
    tap(.3, .03, .78, '#8a8f98', .16, .12); lw([.3, .03, .94], [.4, .03, .98], '#8a8f98'); bx(.46, .05, .78, .08, .06, .14, '#ff4a8a');
  } else {   // service: small steel basin + paper-towel box above
    box(.08, 0, .66, .54, .4, .16, STEEL, { t: '#7a8088' }); lw([.35, .2, 0], [.35, .2, .66], STEELD); tap(.35, .04, .82, CHROME, .14, .1); lw([.35, .04, .96], [.45, .04, .96], CHROME);
    box(.15, 0, 1.25, .4, .12, .3, '#e8e8e4', {}); qy(.2, .5, .121, 1.25, 1.28, '#f8f8f4');
  }
}
/* ---------- mirrors ---------- */
function glass(p) {
  const st = p.style, W = p.w || 1;
  const sheen = (x0, x1, z0, z1) => { lw([x0 + (x1 - x0) * .2, .04, z1 - .06], [x0 + (x1 - x0) * .2 + .2, .04, z1 - .35], '#e6f4f8'); lw([x0 + (x1 - x0) * .2 + .08, .04, z1 - .06], [x0 + (x1 - x0) * .2 + .2, .04, z1 - .22], '#e6f4f8'); };
  if (st === 'mall') { qy(0, W, .03, 0, .7, '#b8d4de', '#c4dde6'); for (let x = .4; x < W; x += 1.1) sheen(x - .3, x + .3, 0, .7); glow(() => qy(0, W, .035, .7, .76, '#fff2d8')); lw([0, .04, .7], [W, .04, .7], CHROME); }
  else if (st === 'library') { const P = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; P.push([.35 + Math.cos(a) * .32, .03, .45 + Math.sin(a) * .45]); } fq(P, '#6a4a30'); fq(P.map(q => [.35 + (q[0] - .35) * .82, .035, .45 + (q[2] - .45) * .86]), '#b8d4de', '#c4dde6'); sheen(.15, .5, .1, .8); }
  else if (st === 'museum') { qy(0, .6, .03, 0, 1.1, '#2a2a2e'); qy(.03, .57, .035, .03, 1.07, '#c4dce4', '#cfe4ea'); sheen(.05, .55, 0, 1.07); }
  else if (st === 'gym') { qy(0, W, .03, 0, .9, '#b8d4de', '#c4dde6'); for (let x = .5; x < W; x += 1.2) sheen(x - .3, x + .3, 0, .9); lw([0, .04, 0], [W, .04, 0], STEELD); }
  else if (st === 'station') { qy(0, .7, .03, 0, .8, STEELD); qy(.05, .65, .035, .05, .75, '#b8d0d8', '#c4dae2'); sheen(.05, .65, 0, .75); for (const [x, z] of [[.05, .05], [.65, .05], [.05, .75], [.65, .75]]) dot(x, .04, z, '#5a6068'); }
  else if (st === 'bar') { discY(.3, .03, .3, .3, '#1e1a22'); discY(.3, .035, .3, .26, '#8aa0aa', '#94aab4'); const h = [[0, -.06], [.06, .02], [.03, .06], [0, .03], [-.03, .06], [-.06, .02]]; for (let i = 0; i < h.length; i++) { const a = h[i], b = h[(i + 1) % h.length]; lw([.36 + a[0], .04, .34 + a[1]], [.36 + b[0], .04, .34 + b[1]], '#e8283c'); } }
  else { qy(0, .5, .03, 0, .5, STEELD); qy(.04, .46, .035, .04, .46, '#a8bcc4', '#b2c6ce'); }
}
/* ---------- floors ---------- */
function floorPat2(p) {
  const st = p.style, w = p.w || 5, d = p.d || 4, H = (x, y, s) => hash2(Math.floor(x * 16), Math.floor(y * 16), s);
  if (st === 'service') return (x, y) => { const r = Math.hypot(x - w / 2, y - d / 2); if (r < .14) return r < .1 && (Math.floor(x * 16) + Math.floor(y * 16)) % 2 ? '#3a3f44' : '#6a7074'; const n = H(x, y, 1); return n < .05 ? '#7a8084' : n > .97 ? '#a8aeb2' : '#8e9498'; };
  if (st === 'station') return (x, y) => { if (d - y < .5 && d - y > .3) return (Math.floor(x * 8) + Math.floor(y * 8)) % 2 ? '#f2c230' : '#e0b020'; const n = H(x, y, 2); return n < .003 ? '#a8857c' : n < .009 ? '#8e8d88' : n < .015 ? '#b0aea8' : (Math.floor(x) + Math.floor(y)) % 2 ? '#a4a39e' : '#9e9d98'; };
  if (st === 'mall') return (x, y) => { const row = Math.floor(y), off = row % 2 ? .75 : 0, fx = (x + off) / 1.5 - Math.floor((x + off) / 1.5), fy = y - row; if (fx < .02 || fy < .03) return '#c8bca8'; return H(x, y, 3) < .04 ? '#d8ccb8' : '#e6dccb'; };
  if (st === 'library') return (x, y) => { const u = x + y, v = x - y, i = Math.floor(u / .5), j = Math.floor(v / .25 + (i % 2) * .5), fu = u / .5 - i, fv = v / .25 + (i % 2) * .5 - j; if (fu < .08 || fv < .1) return '#6a4628'; const k = (i * 7 + j * 3) % 4; return ['#a8743f', '#9c6a38', '#b07c48', '#946232'][k]; };
  if (st === 'museum') return (x, y) => { const fx = x / 2 - Math.floor(x / 2), fy = y / 2 - Math.floor(y / 2); if (fx < .01 || fy < .015) return '#a8a6a0'; return Math.abs(((x - y) % 3 + 3) % 3 - 1.5) < .08 ? '#e2e0da' : H(x, y, 4) < .03 ? '#c4c2bc' : '#d2d0ca'; };
  if (st === 'gym') return (x, y) => { const n = H(x, y, 5); return n < .003 ? '#6a4a40' : n < .006 ? '#3e5a64' : n < .02 ? '#40444c' : (Math.floor(x) + Math.floor(y)) % 2 ? '#383c44' : '#35393f'; };
  if (st === 'bar') return (x, y) => { const k = (Math.floor(x * 2) + Math.floor(y * 2)) % 2, n = H(x, y, 6); return k ? (n < .1 ? '#5a2a30' : '#6e2a32') : (n < .1 ? '#2e2a32' : '#24202a'); };
  return (x, y) => { if (Math.abs(y - (d - 1.2)) < .08) return '#d2392f'; if (Math.abs(y - (d - 1.0)) < .03) return '#f4f0e8'; const n = H(x, y, 7); return n < .04 ? '#8a8e94' : '#a2a6ac'; };   // arena: grey epoxy, team stripe
}
function floor2(p) { qz(0, p.w || 5, 0, p.d || 4, .005, floorPat2(p)); }
/* ---------- wall pieces ---------- */
function deco(p) {
  const k = p.kind;
  if (k === 'pipes') { const W = p.w || 3; for (const [z, c] of [[0, '#b87a4a'], [.16, '#8e979d']]) { box(0, .02, z, W, .08, .08, c, { ol: false }); for (let x = .5; x < W; x += 1) bx(x, .1, z - .02, .06, .02, .12, dk(c, .3)); } cyl(W * .6, .12, .16, .08, .04, '#c8233a', { ol: false }); }
  else if (k === 'hivis') { lw([.25, .02, 1.0], [.25, .1, .96], '#5e666c'); fq([[.08, .06, .95], [.42, .06, .95], [.4, .06, .45], [.1, .06, .45]], '#f2c230'); qy(.08, .42, .065, .6, .66, '#d8dcdf'); qy(.08, .42, .065, .8, .86, '#d8dcdf'); ball(.62, .1, 1.02, .14, '#f2c230'); bx(.48, .04, .96, .28, .12, .04, '#e0b020'); }
  else if (k === 'mosaic') {   // a tile mosaic of the old steam train, in the wall's own small tiles
    const W = p.w || 2.4, H = 1.1; qy(0, W, .02, 0, H, (u, v) => {
      const X = u / 16, Z = v / 16; if (u % 4 === 0 && v % 4 === 0) return '#cfd2cc'; if (X < .06 || X > W - .06 || Z < .06 || Z > H - .06) return '#2f5a46';
      if (Z < .22) return Math.floor(X * 6) % 2 ? '#6a6460' : '#8a8480';   // the track
      const wheel = [.5, .85, 1.2, 1.75].some(c => Math.hypot(X - c, Z - .34) < .14); if (wheel) return Math.hypot(X - .5, Z - .34) < .05 ? '#c8a040' : '#2a2733';
      if (X > .3 && X < 1.4 && Z > .26 && Z < .62) return '#1f3a2e'; if (X > 1.1 && X < 1.5 && Z > .62 && Z < .9) return '#1f3a2e'; if (X > .45 && X < .6 && Z > .62 && Z < .82) return '#2a2733';
      if (X > 1.6 && X < 2.1 && Z > .3 && Z < .6) return '#7a2030'; if (X > .4 && X < .75 && Z > .82 && Z < 1.0 - (X - .4) * .2) return '#f4f0e8';
      return Z > .8 ? '#b8d8e8' : '#d8e8f0'; }); }
  else if (k === 'tv') { box(0, 0, 0, 1.3, .08, .78, '#1e1a22'); lit(() => { qy(.06, 1.24, .081, .06, .72, '#1b2a3a'); qy(.06, 1.24, .082, .5, .72, '#d2392f'); label('OTT 54', .06, 1.24, .083, .68, '#f4f0e8'); label('GUL 48', .06, 1.24, .083, .4, '#f2c230'); }); glow(() => qy(.06, 1.24, .09, .06, .72, '#4a6a9a40')); }
  else if (k === 'stickers') { const W = p.w || 1.6; for (let i = 0; i < 22; i++) { const x = (i * 37 % 97) / 97 * (W - .2), z = (i * 53 % 89) / 89 * 1.3, c = ['#f2c230', '#4ad8f0', '#ff4a8a', '#9ccc4a', '#f4f0e8', '#b07af8', '#e8843a'][i % 7]; qy(x, x + .12 + (i % 3) * .05, .02, z, z + .1 + (i % 2) * .06, c); } label('MOTHS', 0, W, .03, 1.62, '#f4f0e8'); label('LIVE!', .2, W, .03, .32, '#ff4a8a'); }
  else if (k === 'label') {   // the exhibit: a sleek white hand dryer under a gallery spot, and its museum label
    glow(() => qy(0, .7, .02, .0, 1.0, '#fff8e030')); box(.1, 0, .35, .5, .2, .34, '#f8f6f2', { l: '#f2f0ec', r: '#d8d4cc' }); qy(.18, .52, .201, .36, .4, '#2a2a2e'); dot(.35, .2, .6, '#2a2a2e');
    qy(.9, 1.3, .02, .5, .74, '#f8f6f2'); frameY(.9, 1.3, .02, .5, .74, '#c9c4ba'); for (let z = .54; z < .72; z += .05) lw([.94, .025, z], [1.2 - (z * 7 % 1) * .15, .025, z], '#5a5a60'); }
  else if (k === 'duck') {   // the baby-change table, folded down, with a rubber duck
    box(0, 0, .82, 1.0, .1, .5, '#e8e4f0'); qz(.04, .96, .1, .55, .88, '#f4f0f8'); box(0, .1, .82, 1.0, .5, .06, '#e8e4f0', { t: '#f4f0f8' }); qz(.15, .85, .18, .5, .885, '#bfe0f0');
    ball(.75, .3, .93, .06, '#f2c230'); ball(.78, .3, 1.0, .04, '#f2c230'); dot(.82, .3, 1.0, '#e8843a'); qy(.3, .7, .105, 1.08, 1.26, '#b8a6d8'); label('BABY', .3, .7, .106, 1.24, '#f4f0f8'); }
}
/* ---------- free-standing props ---------- */
function prop(p) {
  const k = p.kind;
  if (k === 'stairs') {   // the station's way down to the toilets: a railed opening in the floor, steps going down, an enamel sign on two posts
    qz(0, 2, 0, 1.6, .005, '#4a4a50'); for (let i = 0; i < 6; i++) { const y = .2 + i * .22; qz(.15, 1.85, y, y + .2, .006, i % 2 ? '#7a7a80' : '#6a6a70'); lw([.15, y + .2, .007], [1.85, y + .2, .007], '#f2c230'); }
    qz(.15, 1.85, .05, .2, .007, '#2a2a30');
    const rail = '#2f5a46'; for (const [x0, y0, x1, y1] of [[0, 0, 2, 0], [0, 0, 0, 1.6], [2, 0, 2, 1.6]]) { lw([x0, y0, .9], [x1, y1, .9], rail); lw([x0, y0, .5], [x1, y1, .5], rail); }
    for (const [x, y] of [[0, 0], [2, 0], [0, 1.6], [2, 1.6], [1, 0], [0, .8], [2, .8]]) { lw([x, y, 0], [x, y, .95], rail); ball(x, y, .97, .03, '#b8943a'); }
    lw([.05, 1.6, 0], [.05, 1.6, 1.9], rail); lw([1.95, 1.6, 0], [1.95, 1.6, 1.9], rail); qy(.05, 1.95, 1.6, 1.5, 1.92, '#2f5a46'); frameY(.05, 1.95, 1.6, 1.5, 1.92, '#f4f0e8'); label('TOILETS', .05, 1.95, 1.6, 1.82, '#f4f0e8');
  } else if (k === 'books') {   // "take one, leave one": a little bookcase
    box(0, 0, 0, .9, .32, 1.1, '#6a4a30', { t: '#5a3e28' }); qy(.05, .85, .32, .05, 1.05, '#3a2a1a');
    for (const z of [.08, .45, .8]) { let x = .07; let i = 0; while (x < .8) { const w = .05 + (i * 7 % 4) * .015, h = .22 + (i * 5 % 3) * .04, c = ['#c8574d', '#3f6a5a', '#d8a848', '#4f74b8', '#e8e0cc', '#7a5590'][i % 6]; bx(x, .05, z, w, .24, h, c); x += w + .01; i++; } bx(.05, .02, z - .04, .8, .28, .04, '#7a5a3a'); }
    qy(.15, .75, .33, 1.12, 1.3, '#f4ead0'); label('SWAP', .15, .75, .335, 1.28, '#5a3a20');
  } else if (k === 'scale') { box(.05, .05, 0, .4, .4, .06, '#e8e4dc', { t: '#f4f0e8' }); qz(.15, .35, .12, .22, .061, '#2a2733'); lit(() => { dot(.22, .17, .062, '#9ccc4a'); dot(.28, .17, .062, '#9ccc4a'); }); }
}
function lamp(p) {
  const k = p.kind;
  if (k === 'cage') { bx(.1, 0, 0, .2, .06, .06, '#5e666c'); ball(.2, .14, -.04, .09, '#f4f0d0'); for (const a of [-.1, 0, .1]) lw([.2 + a, .14, -.14], [.2 + a, .14, .06], '#3a3f44'); glow(() => blob(.2, .14, -.04, 3, 3, '#fff2c8')); }
  else if (k === 'globe') { lw([.2, .2, .4], [.2, .2, 1.4], '#2f5a46'); ball(.2, .2, .2, .2, '#f4f0e8', { ol: true }); glow(() => blob(.2, .2, .2, 3, 3, '#fff8e0')); }
  else if (k === 'red') { lw([.2, .2, .2], [.2, .2, 1.4], '#1e1a22'); ball(.2, .2, .1, .1, '#c8233a', { ol: true }); lit(() => blob(.2, .2, .1, 1.5, 1.5, '#ff6a6a')); glow(() => blob(.2, .2, .1, 4, 4, '#ff4a4a50')); }
  else if (k === 'track') { box(0, .15, .4, 2, .08, .06, '#2a2a2e'); for (const x of [.3, 1.0, 1.7]) { lw([x, .19, .4], [x, .19, .3], '#2a2a2e'); cyl(x, .19, .18, .07, .12, '#2a2a2e', { t: '#1e1e22' }); glow(() => blob(x, .19, .16, 2, 2, '#fff8e0')); } }
  else { lw([.2, .02, .3], [.2, .16, .3], BRASS); fq([[.08, .16, .2], [.32, .16, .2], [.26, .16, .38], [.14, .16, .38]], '#2f6a46'); glow(() => blob(.2, .18, .18, 3, 2, '#fff2c8')); }   // library sconce with a green shade
}

const S8 = ['service', 'station', 'mall', 'library', 'museum', 'gym', 'bar', 'arena'];
export default [
  F('wc.basin', ['wc', 'sink'], p => (p.style === 'arena' ? [1.4, 1.4, 1.2] : [bw(p), .56, .9]), basin, { vb: p => [-.3, -.3, 0, bw(p) + .3, p.style === 'arena' ? 1.7 : .9, 1.6], use: p => (p.style === 'arena' ? { x: .7, y: 1.75 } : { x: bw(p) / 2, y: .95 }), variants: S8.map(style => ({ style })) }),
  F('wc.glass', ['wc', 'mirror', 'decor'], p => [p.w || (p.style === 'museum' ? .6 : p.style === 'station' ? .7 : p.style === 'library' ? .7 : p.style === 'bar' ? .6 : .5), .06, p.style === 'museum' ? 1.1 : .9], glass, { wall: true, mount: 1.2, solid: false, variants: [{ style: 'mall', w: 3 }, { style: 'library' }, { style: 'museum' }, { style: 'gym', w: 2 }, { style: 'station' }, { style: 'bar' }, { style: 'service' }] }),
  F('wc.floor2', ['wc', 'floor'], p => [p.w || 5, p.d || 4, .01], floor2, { solid: false, flat: true, variants: S8.map(style => ({ style, w: 4, d: 3 })) }),
  F('wc.deco', ['wc', 'decor'], p => [p.w || (p.kind === 'mosaic' ? 2.4 : p.kind === 'tv' ? 1.3 : p.kind === 'stickers' ? 1.6 : p.kind === 'label' ? 1.3 : p.kind === 'duck' ? 1 : p.kind === 'pipes' ? 3 : .8), p.kind === 'duck' ? .6 : .12, p.kind === 'pipes' ? .3 : 1.6], deco, { wall: true, mount: 1.0, solid: false, vb: p => [-.2, -.2, -.3, (p.w || 3) + .2, .8, 1.9], variants: [{ kind: 'pipes' }, { kind: 'hivis' }, { kind: 'mosaic' }, { kind: 'tv' }, { kind: 'stickers' }, { kind: 'label' }, { kind: 'duck' }] }),
  F('wc.prop', ['wc'], p => (p.kind === 'stairs' ? [2, 1.6, 1.95] : p.kind === 'books' ? [.9, .35, 1.3] : [.5, .5, .1]), prop, { variants: [{ kind: 'stairs' }, { kind: 'books' }, { kind: 'scale' }] }),
  F('wc.lamp', ['wc', 'lamp'], p => (p.kind === 'track' ? [2, .3, .5] : [.4, .4, 1.5]), lamp, { solid: false, overhead: true, vb: [-.2, -.2, -.4, 2.2, .6, 1.6], light: { x: .2, y: .4, z: 0, r: 2 }, variants: [{ kind: 'cage' }, { kind: 'globe' }, { kind: 'red' }, { kind: 'track' }, { kind: 'sconce' }] }),
];
