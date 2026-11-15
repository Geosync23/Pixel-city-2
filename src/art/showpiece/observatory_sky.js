// Maple Bay Observatory — planetarium, telescope dome and roof terrace art. ids furn.obs.* (see observatory.js for the ground floor)
//   recliner {n} row of reclining theatre seats (tags seating, obs_seat)   projector {a 0-7} the star ball   console   steplight
//   skywall   wall art (wall: true): the night sky over Maple Bay above a stone parapet. p: { w, u0 (panorama offset px), time, season, wx: null|'cloud'|'rain', frame,
//             moon (phase 0..1 | -1 none), cons (constellation id), comet, rev }
//   domeshell wall art: the inside of the great dome. p: { w, sx (slit centre, local units; omit for none), open 0..1, time, wx, frame }
//   telescope {az 0-4, alt 0-2, park} the great refractor   smallscope {kind: 'refr'|'dob', cover, c}   finder (planisphere plinth)   domewall {w}   arch {w, name}
//   sketchstool   lantern {on}   partytable   notice {a, b}   deckchair {c}   stairhead   planter {seed}
import * as R from '../../engine/raster.js';
import { pano, PANO_W } from './_pano.js';
import { NAVY, NAVY_D, NAVY_L, BRASS, BRASS_D, BRASS_L, CREAM, MARBLE, MARBLE_D, WOOD, WOOD_L, RED, TEAL, DARK, moonDisc, skyPx, CONS_BY_ID, drawFigure } from './_obs_lib.js';
import { S2, dot, disc, wallPut } from './observatory.js';
const { box, qy, qx, qz, fq, lw, lit, glow, cyl, ball, dk, lt, mix, PW, px, C, rng, line, ellipse, hash2, signY, textY, textW, PAT } = R;

/* ---------- planetarium ---------- */
function recliner(p) {
  const n = p.n || 6, c = p.c || '#3a4a86';
  for (let i = 0; i < n; i++) { const x = i * .9 + .06;
    box(x, .62, 0, .78, .34, .86, c, { t: lt(c, .12), l: dk(c, .12) }); box(x + .1, .7, .86, .58, .2, .14, lt(c, .08), { ol: false }); // reclined back + headrest
    box(x, .14, 0, .78, .5, .34, dk(c, .1), { t: c }); box(x - .04, .14, .3, .08, .76, .22, DARK, { ol: false }); if (i === n - 1) box(x + .76, .14, .3, .08, .76, .22, DARK, { ol: false }); }
}
function projector(p) {
  const a = (p.a || 0) / 8 * Math.PI, cx = .7, cy = .7;
  for (const [dx, dy] of [[-.5, -.3], [.5, -.3], [0, .55]]) { lw([cx + dx, cy + dy, 0], [cx, cy, 1.3], '#5e6676'); lw([cx + dx + .02, cy + dy, 0], [cx + .02, cy, 1.3], '#3a3440'); }
  cyl(cx, cy, 1.25, .2, .22, DARK, { t: '#4a5068' }); const ux = Math.cos(a) * .5, uy = Math.sin(a) * .22, uz = .42;
  const A = [cx - ux, cy - uy, 1.75 - uz * .5], B = [cx + ux, cy + uy, 1.75 + uz * .5], far = (ux + uy) < 0 ? B : A, near = far === A ? B : A;
  const globeB = q => { ball(q[0], q[1], q[2], .3, '#2a2f44', { t: '#4a5270', d: '#161a2a' }); lit(() => { for (let i = 0; i < 12; i++) { const an = i * 2.4 + a, rr = .12 + (i % 3) * .07; dot(q[0] + Math.cos(an) * rr, q[1], q[2] + Math.sin(an) * rr * .9, i % 4 === 0 ? '#ffffff' : '#ffe9b0'); } }); };
  globeB(far); lw([A[0], A[1], A[2]], [B[0], B[1], B[2]], '#8a94a4'); lw([A[0], A[1], A[2] - .04], [B[0], B[1], B[2] - .04], '#5e6676'); cyl(cx, cy, 1.62, .13, .26, '#3a4058', { ol: false }); globeB(near);
}
function consoleDesk() { box(0, .1, 0, 1.6, .55, .85, NAVY_D, { t: DARK }); fq([[0, .66, .85], [1.6, .66, .85], [1.6, .2, 1.1], [0, .2, 1.1]], '#20263c'); lit(() => { for (let i = 0; i < 10; i++) dot(.15 + (i % 5) * .3, .55 - Math.floor(i / 5) * .16, .9 + Math.floor(i / 5) * .09, ['#7df0a0', '#ffe070', '#ff7a6a', '#7ad8ff'][i % 4]); }); }
function steplight() { box(.04, .04, 0, .12, .12, .08, DARK, { ol: false }); lit(() => { dot(.1, .1, .09, '#8aa8ff'); dot(.1, .1, .09, '#8aa8ff', 1, 0); }); }

/* ---------- the terrace sky ---------- */
const WH = 5.6;
function skywall(p) {
  const w = p.w || 5, y = .1, n = Math.round(w * 16), T = p.time || 'night', o = { time: T, wx: p.wx || null, frame: p.frame || 0, season: p.season === undefined ? 1 : p.season }, u0 = p.u0 || 0, put = wallPut(w, y, 0), H = Math.round(WH * 16);
  const m = (x, v, c, li) => put(p.rev ? n - 1 - x : x, v, c, li);
  // the city panorama fills the lower 64 px
  let L = false; pano((x, v, c) => m(x, v, c, L), { u0: ((u0 % PANO_W) + PANO_W) % PANO_W, w: Math.min(w * 16, PANO_W), time: T, season: o.season, frame: (o.frame || 0) % 32, plane: -1, lit: f => { L = true; try { f(); } finally { L = false; } } });
  for (let x = 0; x < n; x++) { for (let v = 64; v < H; v++) { const s = skyPx(u0 + x, v - 26 + 28, o); m(x, v, s[0], s[1]); }
    if (o.wx) for (let v = 30; v < 64; v++) { const s0 = skyPx(u0 + x, v - 26 + 28, { time: T }), s = skyPx(u0 + x, v - 26 + 28, o); if (s[0] !== s0[0]) m(x, v, s[0], false); } }
  if (T === 'night' && !o.wx) {
    if (p.cons && CONS_BY_ID[p.cons]) drawFigure((a, b, c, li) => m(a, H - 3 - b, c, li), CONS_BY_ID[p.cons], Math.round(n * .12), 0, Math.min(44, n * .5), 30, { big: 2 });
    if (p.comet) { const cx = Math.round(n * .78), cv = 70; for (let i = 0; i < 16; i++) { m(cx - i, cv + (i >> 1), i < 3 ? '#ffffff' : i < 9 ? '#c8e8ff' : '#6a9ae0', true); if (i > 1 && i < 11) m(cx - i, cv + (i >> 1) + 1, '#8ab8f0', true); } m(cx + 1, cv, '#ffffff', true); m(cx, cv - 1, '#ffffff', true); }
  }
  if (p.moon !== undefined && p.moon >= 0 && !o.wx && T !== 'day') moonDisc((a, b, c, li) => m(a, b, c, li), Math.round(n * .62), 76, 5.5, p.moon, { dark: T === 'night' ? '#141c44' : null });
  // parapet + brass rail in front
  box(0, .12, 0, w, .26, .78, MARBLE, { l: PAT.stone(dk(MARBLE, .14)), t: lt(MARBLE, .1) }); for (let x = .5; x < w; x += 1) { lw([x, .25, .8], [x, .25, 1.06], BRASS_D); } lw([0, .25, 1.06], [w, .25, 1.06], BRASS_L); lw([0, .25, 1.03], [w, .25, 1.03], BRASS_D);
  if (o.season === 3) for (let x = 0; x < w; x += .12) if (hash2(Math.round(x * 16), 2, 5) > .3) dot(x, .25, .8, '#f4f8fb');
}
const SHELL = '#e2ded2', SHELL_D = '#bdb8aa';
function domeshell(p) {
  const w = p.w || 4.5, y = .1, T = p.time || 'day', has = p.sx !== undefined, op = has ? Math.max(0, Math.min(1, p.open || 0)) : 0, hw = .7 * op, sx = p.sx || 0, o = { time: T, wx: p.wx || null, frame: p.frame || 0 };
  qy(0, w, y, 0, WH, SHELL, undefined); qy(0, w, y, 0, .9, PAT.planks(WOOD, 6)); qy(0, w, y, .9, 1, '#5e6676');
  for (const z of [2.2, 3.5, 4.7]) lw([0, y, z], [w, y, z], SHELL_D); for (let x = 0; x <= w + .01; x += 1.5) { const a = Math.max(0, x - .05), b = Math.min(w, x + .05); if (b > a) { qy(a, b, y, 1, WH, SHELL_D); lw([a, y, 1], [a, y, WH], lt(SHELL, .4)); } }
  glow(() => { qy(0, w, y + .01, 1.02, 1.1, '#c8402f'); qy(0, w, y + .01, 1.1, 1.5, '#5a1a20', '#3a1418'); });
  // curved top leaning in
  const ry = 1.3, rz = 6.5; fq([[0, y, WH], [w, y, WH], [w, ry, rz], [0, ry, rz]], dk(SHELL, .12), dk(SHELL, .2)); for (let x = 0; x <= w + .01; x += 1.5) lw([Math.min(w, x), y, WH], [Math.min(w, x), ry, rz], SHELL_D); lw([0, ry, rz], [w, ry, rz], '#8a8678');
  if (has) {
    const fw = .78; qy(sx - fw, sx + fw, y + .01, 1.2, WH, '#8a8e9a'); fq([[sx - fw, y, WH], [sx + fw, y, WH], [sx + fw, ry, rz], [sx - fw, ry, rz]], '#7a7e8a');
    lw([sx - fw, y + .01, 1.2], [sx - fw, y + .01, WH], '#5e6272'); lw([sx + fw, y + .01, 1.2], [sx + fw, y + .01, WH], '#5e6272');
    if (hw > .04) { const put = wallPut(w, y + .02, 1.3), a = Math.round((sx - hw) * 16), b = Math.round((sx + hw) * 16), hh = Math.round((WH - 1.3) * 16);
      for (let u = a; u < b; u++) for (let v = 0; v < hh; v++) { const s = skyPx(u + (p.u0 || 40), v + 30, o); put(u, v, s[0], s[1]); }
      const sk = v => skyPx(Math.round(sx * 16) + (p.u0 || 40), 110 + v, o)[0]; fq([[sx - hw, y, WH], [sx + hw, y, WH], [sx + hw, ry, rz], [sx - hw, ry, rz]], sk(0), T === 'night' ? '#0f1740' : undefined);
      if (T === 'night' && !o.wx) lit(() => { for (let i = 0; i < 5; i++) dot(sx - hw + .1 + hash2(i, 3, 8) * (hw * 2 - .2), y + .2 + hash2(i, 5, 8) * 1, WH + .1 + hash2(i, 7, 8) * .7, '#ffffff'); });
    } else { lw([sx, y + .02, 1.2], [sx, y + .02, WH], '#5e6272'); lw([sx, y, WH], [sx, ry, rz], '#5e6272'); }
    for (const z of [1.2, 2.6, 4.0, 5.4]) { lw([sx - fw, y + .02, z], [sx - hw, y + .02, z], '#a8acb8'); lw([sx + hw, y + .02, z], [sx + fw, y + .02, z], '#a8acb8'); }
  }
}

/* ---------- telescopes ---------- */
function tube(E, O, hw, o = {}) { // a fat tube between two world points (screen-space thickness hw px)
  const a = PW(E[0], E[1], E[2]), b = PW(O[0], O[1], O[2]), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, up = ny < 0 ? 1 : -1;
  const cols = o.cols || ['#ffffff', '#eef1f4', '#e4e8ec', '#d2d8de', '#b4bcc6', '#9aa2ae', '#7a8290'];
  for (let k = -hw - 1; k <= hw + 1; k += .5) { const t = (k * up + hw) / (2 * hw), c = Math.abs(k) > hw ? (o.ol || '#3a3f52') : cols[Math.max(0, Math.min(cols.length - 1, Math.round(t * (cols.length - 1))))]; line([a[0] + nx * k, a[1] + ny * k], [b[0] + nx * k, b[1] + ny * k], c); }
  for (const f of o.rings || []) { const x = a[0] + dx * f, y = a[1] + dy * f; line([x + nx * (hw + 1), y + ny * (hw + 1)], [x - nx * (hw + 1), y - ny * (hw + 1)], o.ringC || BRASS); line([x + nx * (hw + 1) + dx / L, y + ny * (hw + 1) + dy / L], [x - nx * (hw + 1) + dx / L, y - ny * (hw + 1) + dy / L], o.ringC2 || BRASS_D); }
}
const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
export const scopeDir = p => (p.park ? norm([1, -.25, .22]) : norm([2.25 + ((p.az === undefined ? 2 : p.az) - 2) * .55, -4.5, 2.6 + (p.alt === undefined ? 1 : p.alt) * 1.1]));
function telescope(p) {
  const d = scopeDir(p), Cn = [1.5, 1.5, 2.45], pt = (c, k) => [c[0] + d[0] * k, c[1] + d[1] * k, c[2] + d[2] * k];
  cyl(1.5, 1.5, 0, .62, .25, '#8a8e9a', { t: '#a8acb8' }); cyl(1.5, 1.5, .25, .42, 1.5, '#d2d4d8', { l: '#e4e6ea', r: '#a8acb4' }); for (const z of [.5, 1.6]) { const s = PW(1.5, 1.5, z); ellipse(s[0], s[1] + 3, 9.6, 4.8, '#8a8e9a'); ellipse(s[0], s[1] + 2, 9.6, 4.8, '#d2d4d8'); }
  box(1.2, 1.2, 1.75, .6, .6, .4, '#2f4f7a', { t: '#3f5f8a' }); // mount head + counterweight
  const cw = [1.5 - d[1] * .9, 1.5 + d[0] * .9, 2.2 - .5]; lw([1.5, 1.5, 2.2], cw, '#8a94a4'); ball(cw[0], cw[1], cw[2], .2, '#5e6676');
  const E = pt(Cn, -1.5), O = pt(Cn, 2.3), M = pt(Cn, 1.7);
  tube(E, M, 3.5, { rings: [.02, .45, .98] }); tube(M, O, 4.5, { rings: [.04], cols: ['#ffffff', '#f4f6f8', '#e8ecf0', '#d8dee4', '#bcc4ce', '#a2aab6', '#828a98'] });
  { const s = PW(O[0], O[1], O[2]); ellipse(s[0], s[1], 4, 3, '#2a3050'); ellipse(s[0] - 1, s[1] - 1, 1.5, 1, '#6a8ad8'); }
  const F0 = pt([Cn[0], Cn[1], Cn[2] + .32], -.9), F1 = pt([Cn[0], Cn[1], Cn[2] + .32], .5); tube(F0, F1, 1, { cols: [BRASS_L, BRASS, BRASS_D], ol: BRASS_D }); // finder
  const ep = [E[0], E[1] + .12, E[2] - .28]; lw(E, ep, DARK); lw([E[0] + .03, E[1], E[2]], [ep[0] + .03, ep[1], ep[2]], '#5e6676'); ball(ep[0], ep[1], ep[2], .07, BRASS, { ol: false });
  glow(() => { const s = S2(1.5, 1.82, 1.95); px(s[0], s[1], C('#ff5a4a')); px(s[0] + 1, s[1], C('#ff5a4a')); });
}
function smallscope(p) {
  const k = p.kind || 'refr', c = p.c || '#c8402f';
  if (p.cover) { for (const [dx, dy] of [[-.3, -.2], [.3, -.2], [0, .32]]) lw([.45 + dx, .45 + dy, 0], [.45, .45, .5], '#5e6676'); ball(.45, .45, .85, .36, '#8a94a4', { squash: 1.25, t: '#a8b0bc', d: '#5e6676' }); lw([.2, .45, .55], [.7, .45, .55], '#4a5262'); return; }
  if (k === 'dob') { box(.15, .15, 0, .6, .6, .5, WOOD, { t: WOOD_L }); tube([.45, .55, .45], [.45, -.05, 1.5], 3, { cols: ['#5a6aa8', '#3a4a86', '#2d3a6e', '#1c2548'], ol: '#131a36', rings: [.95], ringC: '#c2cad4', ringC2: '#8a94a4' }); dot(.5, .5, .75, BRASS_L); return; }
  for (const [dx, dy] of [[-.32, -.22], [.32, -.22], [0, .36]]) { lw([.45 + dx, .45 + dy, 0], [.45, .45, .95], '#3a3440'); lw([.45 + dx + .02, .45 + dy, 0], [.47, .45, .95], '#6a6478'); }
  tube([.45, .8, .85], [.45, -.1, 1.5], 2, { cols: [lt(c, .5), lt(c, .2), c, dk(c, .2), dk(c, .4)], ol: dk(c, .6), rings: [.9], ringC: '#f4f0e8', ringC2: '#c9c2b0' }); ball(.45, .45, .98, .08, DARK, { ol: false }); lw([.45, .8, .85], [.45, .86, .98], DARK);
}
function finder() {
  box(.15, .15, 0, .5, .5, .8, MARBLE, { l: PAT.stone(dk(MARBLE, .1)) }); const P = [[.02, .78, .8], [.78, .78, .8], [.78, .1, 1.12], [.02, .1, 1.12]]; fq(P, BRASS); fq([[.08, .72, .83], [.72, .72, .83], [.72, .16, 1.09], [.08, .16, 1.09]], NAVY_D);
  lit(() => { for (let i = 0; i < 9; i++) dot(.14 + hash2(i, 1, 4) * .52, .66 - hash2(i, 2, 4) * .44, .86 + hash2(i, 2, 4) * .2, i % 3 ? '#b8c6f0' : '#ffe9b0'); }); lw([.4, .44, .96], [.62, .3, 1.03], BRASS_L);
}
function domewall(p) { const w = p.w || 3; box(0, 0, 0, w, .4, 2.8, SHELL, { l: (u, v) => (v < 12 ? '#8a8e9a' : (u % 24) === 0 ? SHELL_D : v % 14 === 0 ? SHELL_D : dk(SHELL, .1)), t: '#f4f0e6' }); qy(0, w, .401, 2.62, 2.8, '#8a8e9a'); }
function arch(p) {
  const w = p.w || 2.5, nm = p.name || 'GREAT TELESCOPE';
  box(0, 0, 0, .3, .4, 2.8, SHELL, { t: '#f4f0e6' }); box(w - .3, 0, 0, .3, .4, 2.8, SHELL, { t: '#f4f0e6' }); box(0, 0, 2.3, w, .4, .5, SHELL, { t: '#f4f0e6' });
  signY(textW(nm) > (w - .2) * 16 ? 'DOME' : nm, .1, w - .1, .401, 2.36, 2.72, NAVY, BRASS_L, { lit: true }); glow(() => { dot(.15, .41, 2.1, '#ff5a4a'); dot(w - .15, .41, 2.1, '#ff5a4a'); });
}
function sketchstool() {
  cyl(.3, .62, 0, .16, .4, WOOD, { t: '#7a2a3a' }); for (const [a, b] of [[[.6, .2, 0], [.75, .3, 1.05]], [[.95, .2, 0], [.8, .3, 1.05]], [[.78, .55, 0], [.78, .3, 1.05]]]) lw(a, b, WOOD_L);
  fq([[.52, .32, .5], [1.0, .32, .5], [1.0, .26, 1.05], [.52, .26, 1.05]], '#f4f0e8'); lw([.52, .32, .5], [1.0, .32, .5], WOOD); const q = PW(.76, .3, .8); ellipse(q[0], q[1], 3, 3, '#c9c6b4'); px(q[0] - 1, q[1] - 1, C('#8a8878')); glow(() => { dot(.56, .3, .98, '#ff5a4a'); });
}
function lantern(p) { cyl(.25, .25, 0, .1, .05, DARK, { ol: false }); cyl(.25, .25, .05, .03, 1.2, '#3a3440', { ol: false }); box(.13, .13, 1.2, .24, .24, .3, '#5a1a20', { t: DARK }); if (p.on) lit(() => { qy(.15, .35, .371, 1.23, 1.47, '#ff5a4a'); qx(.371, .15, .35, 1.23, 1.47, '#e8483b'); }); }
function partytable() {
  box(0, 0, 0, 1.6, .7, .75, '#7a2a3a', { l: PAT.vstripes('#7a2a3a', '#8a3444', 4), t: CREAM }); cyl(.4, .35, .75, .2, .5, '#c2cad4', { t: '#e4e8ec' }); ball(.4, .35, 1.3, .07, DARK, { ol: false }); dot(.4, .56, .9, RED);
  for (let i = 0; i < 4; i++) cyl(.85 + (i % 2) * .24, .22 + Math.floor(i / 2) * .26, .75, .07, .13, i % 2 ? NAVY_L : CREAM, { ol: false }); signY('COCOA', .2, 1.4, .701, .2, .5, CREAM, RED);
  const s = S2(.4, .35, 1.4); for (const [dx, dy] of [[0, -2], [1, -4], [0, -6]]) px(s[0] + dx, s[1] + dy, C('#e8eef4'));
}
function notice(p) { const a = p.a || 'DOME', b = p.b || 'CLOSED', W = 1.7; for (const x of [.1, W - .1]) lw([x, .2, 0], [x, .2, 1.25], WOOD); qy(.05, W - .05, .22, .35, 1.25, CREAM); lw([.05, .22, 1.25], [W - .05, .22, 1.25], WOOD); lw([.05, .22, .35], [W - .05, .22, .35], WOOD);
  textY(a, W / 2 - textW(a) / 32, .23, 1.16, RED); textY(b, W / 2 - textW(b) / 32, .23, .78, NAVY); }
function deckchair(p) {
  const c = p.c || '#3b6fd0', st = PAT.stripes(c, CREAM, 3);
  for (const x of [.08, .7]) { lw([x, 1.5, 0], [x, .2, .95], WOOD_L); lw([x, .3, 0], [x, 1.3, .5], WOOD); }
  fq([[.1, 1.4, .22], [.7, 1.4, .22], [.7, .75, .3], [.1, .75, .3]], (X, Y) => ((Y >> 1) & 1 ? c : CREAM)); fq([[.1, .75, .3], [.7, .75, .3], [.7, .24, .92], [.1, .24, .92]], (X, Y) => ((Y >> 1) & 1 ? c : CREAM)); lw([.08, .2, .95], [.72, .2, .95], WOOD_L); void st;
}
function stairhead() { box(0, 0, 0, 2, 1.2, 2.3, SHELL, { l: PAT.stucco(dk(SHELL, .1)), t: '#8a8e9a' }); qy(.55, 1.45, 1.201, 0, 1.8, NAVY); qy(.62, 1.38, 1.202, .08, 1.72, '#2a3a6a'); glow(() => qy(.62, 1.38, 1.203, .08, 1.72, '#ffd98a', '#f4c870')); lw([1.0, 1.203, .08], [1.0, 1.203, 1.72], NAVY_D); signY('STAIRS', .5, 1.5, 1.202, 1.86, 2.16, NAVY, BRASS_L, { lit: true }); }
function planter(p) {
  const r = rng(p.seed || 3); box(0, 0, 0, 1.2, .6, .45, MARBLE, { l: PAT.stone(dk(MARBLE, .12)), t: '#5e4636' }); const snow = R.ENV.season === 3;
  for (let i = 0; i < 3; i++) { const x = .25 + i * .35, h = .5 + r() * .35; for (let k = 0; k < 4; k++) ball(x, .3, .5 + k * h / 4, .2 - k * .04, k === 3 && snow ? '#f4f8fb' : '#3f7a55', { ol: k === 0, squash: .8, t: snow ? '#e6edf2' : '#58a068' }); }
  if (R.ENV.season === 0 || R.ENV.season === 1) for (let i = 0; i < 5; i++) dot(.1 + r() * 1, .55, .47, ['#b07ad8', '#f08ab0', '#ffe070'][i % 3]);
}

const T = ['observatory', 'obs'];
const A = (id, tags, size, draw, x) => Object.assign({ id: 'furn.obs.' + id, kind: 'furniture', tags: T.concat(tags), size, draw, variants: [{}] }, x);
export default [
  A('recliner', ['seating', 'obs_seat'], p => [(p.n || 6) * .9, 1, .95], recliner, { seats: p => Array.from({ length: p.n || 6 }, (q, i) => ({ x: i * .9 + .45, y: .42, z: .36, dir: 3 })), use: p => ({ x: (p.n || 6) * .45, y: -.3 }), variants: [{ n: 6 }, { n: 3 }] }),
  A('projector', ['obs_projector'], [1.4, 1.4, 1.5], projector, { frames: 8, vb: [-.2, -.2, 0, 1.6, 1.6, 2.6], variants: [{ a: 0 }, { a: 2 }, { a: 5 }] }),
  A('console', ['desk'], [1.6, .7, 1.1], consoleDesk, { staff: { x: .8, y: -.4, dir: 1 } }),
  A('steplight', ['light'], [.2, .2, .1], steplight, { solid: false, light: { x: .1, y: .1, z: 0, r: 1.3, c: '#6a8aff' } }),
  A('skywall', ['wall', 'sky'], p => [p.w || 5, .4, WH], skywall, { wall: true, mount: 0, solid: false, vb: p => [0, 0, 0, p.w || 5, .5, WH + .1], variants: [{ w: 8, time: 'night', u0: 330, moon: .3, cons: 'orion' }, { w: 8, time: 'day', u0: 330 }, { w: 8, time: 'dusk', u0: 130, moon: .5 }, { w: 6, time: 'night', u0: 130, wx: 'cloud' }, { w: 6, time: 'night', u0: 400, comet: 1, cons: 'cygnus', moon: -1 }, { w: 5, time: 'night', u0: 200, wx: 'rain' }] }),
  A('domeshell', ['wall'], p => [p.w || 4.5, .12, WH], domeshell, { wall: true, mount: 0, solid: false, vb: p => [0, 0, 0, p.w || 4.5, 1.5, 6.6], variants: [{ w: 4.5 }, { w: 4.5, sx: 2.25, open: 1, time: 'night' }, { w: 4.5, sx: 2.25, open: .5, time: 'dusk' }, { w: 4.5, sx: 2.25, open: 0 }, { w: 4.5, sx: 2.25, open: 1, time: 'day' }] }),
  A('telescope', ['obs_scope'], [3, 3, 2.2], telescope, { use: { x: .9, y: 3.4 }, vb: [-1.5, -3.5, 0, 5, 4, 6.2], variants: [{ az: 2, alt: 1 }, { az: 0, alt: 0 }, { az: 4, alt: 2 }, { park: 1 }] }),
  A('smallscope', ['obs_tscope'], [.9, .9, 1.2], smallscope, { use: { x: .45, y: 1.35 }, vb: [-.3, -.5, 0, 1.2, 1.2, 1.8], variants: [{}, { kind: 'dob' }, { c: '#f4f0e8' }, { cover: 1 }] }),
  A('finder', ['obs_finder'], [.8, .8, 1.15], finder, { use: { x: .4, y: 1.25 } }),
  A('domewall', ['wall_segment'], p => [p.w || 3, .4, 2.8], domewall, { variants: [{ w: 3 }] }),
  A('arch', ['archway'], p => [p.w || 2.5, .4, 2.8], arch, { solid: false, variants: [{}] }),
  A('sketchstool', ['obs_sketch'], [1.1, .9, 1.1], sketchstool, { seats: [{ x: .3, y: .62, z: .42, dir: 3 }], use: { x: .3, y: 1.3 } }),
  A('lantern', ['lamp'], [.5, .5, 1.5], lantern, { solid: false, variants: [{ on: 1 }, {}] }),
  A('partytable', ['obs_partycocoa'], [1.6, .7, 1.3], partytable, { use: { x: .8, y: 1.2 }, vb: [-.1, -.1, 0, 1.7, .8, 1.8] }),
  A('notice', ['sign'], [1.7, .4, 1.3], notice, { solid: false, variants: [{}, { a: 'CLOUD', b: 'TONIGHT' }] }),
  A('deckchair', ['obs_deckchair'], [.8, 1.6, .6], deckchair, { seats: [{ x: .4, y: .95, z: .3, dir: 3 }], use: { x: .4, y: 2 }, vb: [-.1, 0, 0, .9, 1.7, 1.1], variants: [{}, { c: '#c8402f' }] }),
  A('stairhead', ['obs_stairhead'], [2, 1.2, 2.3], stairhead, { use: { x: 1, y: 1.8 } }),
  A('planter', ['decor'], [1.2, .6, 1.2], planter, { variants: [{ seed: 3 }, { seed: 8 }] }),
];
