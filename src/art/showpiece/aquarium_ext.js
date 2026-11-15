// Maple Bay Aquarium — exterior on the harbor boardwalk.
//   bld.harbor.aquarium (20 x 8, door on +y at 7): white hall with a blue glass curtain wall under a three-crest wave roof, and a glass drum with a shallow dome at the river end. Glows blue at night.
//   prop.aqua.whaletail (3.2 x 1.4): the life-size bronze whale tail that rises out of the harbor in front of the door.
//   prop.aqua.crate {open}: the turtle transport crate used at the release (city).
import * as R from '../../engine/raster.js';
import { AQ, S2, cylP, fishS, steel } from './_aqua_lib.js';
const { box, qy, qx, qz, fq, lw, lit, glow, ball, dk, lt, hash2, signY, PAT, C, px, rect, ellipse, textS, textW } = R;

const H = 4.3, Y1 = 7.6, WX0 = .4, WX1 = 13.8;
const crest = x => { const t = ((x - WX0) / 4.47) % 1; return .25 + 1.45 * Math.pow(Math.sin(Math.PI * Math.pow(t, 1.7)), 1.3); };
const wline = u => Math.sin(u / 8) * 3 + Math.sin(u / 19) * 2;
function building() {
  box(0, .3, 0, 20, 7.6, .25, '#c9d2d0', { l: PAT.stone('#b4bfbe'), r: PAT.stone('#98a6a6') });
  // ---- the hall: glass curtain wall with a painted water line
  const curtain = (u, v, w, h) => { if (u % 12 === 0 || v % 16 === 15 || v < 2 || u < 2 || u > w - 3 || v > h - 3) return AQ.frame; const wl = h * .5 + wline(u); if (Math.abs(v - wl) < 1.2) return AQ.foam; return v < wl ? (((u >> 1) + (v >> 1)) & 1 ? '#2a86b4' : '#2f90c0') : (hash2(u / 12 | 0, v / 16 | 0, 3) > .6 ? '#8ad4ec' : '#7fcbe6'); };
  box(WX0, .6, .25, WX1 - WX0, Y1 - .6, H - .25, AQ.white, { l: curtain, r: dk(AQ.white, .2), t: '#9ab0b4' });
  for (const [x, z, l, c, d] of [[2.2, 1.3, 9, '#16527a', 1], [3.6, 1.9, 6, '#1a5c86', 1], [11.2, 1.5, 11, '#16527a', -1], [9.9, .95, 6, '#1a5c86', -1], [12.6, 2.05, 5, '#1a5c86', 1], [4.9, .9, 5, '#16527a', -1]]) fishS(x, Y1 + .01, z, l, c, { dir: d });
  glow(() => { qy(WX0 + .15, WX1 - .15, Y1 + .01, .4, H - .2, (u, v, w, h) => { if (u % 12 === 0 || v % 16 === 15) return null; const wl = h * .5 + wline(u); return v < wl ? (((u >> 1) + (v >> 1)) & 1 ? '#2fb0e8' : '#3fc0f0') : '#bff0ff'; }); for (const [x, z, l, d] of [[2.2, 1.3, 9, 1], [11.2, 1.5, 11, -1], [3.6, 1.9, 6, 1], [9.9, .95, 6, -1]]) fishS(x, Y1 + .02, z, l, '#0f4a78', { dir: d }); });
  // banners
  for (const [x, c] of [[1.1, AQ.coral], [12.3, AQ.orange]]) { qy(x, x + .8, Y1 + .03, 1, 3.7, c); qy(x, x + .8, Y1 + .03, 3.6, 3.7, AQ.navy); fishS(x + .4, Y1 + .04, 2.9, 7, AQ.foam, { dir: 1 }); fishS(x + .4, Y1 + .04, 2.2, 5, AQ.foam, { dir: -1 }); fishS(x + .4, Y1 + .04, 1.55, 7, AQ.foam, { dir: 1 }); }
  // ---- wave roof: three breaking crests
  for (let x = WX0; x < WX1 - 1e-6; x += .25) { const h = crest(x + .12), foam = h > 1.35; box(x, .6, H, .25, Y1 - .6, h, AQ.teal, { ol: false, t: foam ? AQ.foam : h > .9 ? '#3fb4c8' : '#2f9eb4', l: (u, v, w, hh) => (v > hh - 3 ? AQ.foam : v > hh - 6 ? '#58c4dc' : (v & 3) === 0 ? '#2a8aa6' : '#2f9eb4'), r: '#1f7a8e' }); }
  for (let x = WX0; x < WX1 - .2; x += .25) lw([x, Y1, H + crest(x + .12)], [x + .25, Y1, H + crest(x + .37)], AQ.navy);
  lw([WX0, Y1, H], [WX1, Y1, H], AQ.tealD);
  // ---- entrance
  qy(5.9, 8.1, Y1 + .02, .25, 2.5, '#34505e'); for (const x of [6.05, 7.05]) { qy(x, x + .9, Y1 + .03, .3, 2.35, '#6fb8d4', '#8fd0e4'); lw([x + .45, Y1 + .03, 1.2], [x + .45, Y1 + .03, 1.5], AQ.foam); }
  glow(() => qy(6.05, 7.95, Y1 + .04, .3, 2.35, '#d8f6ff'));
  box(5.3, Y1, 2.55, 3.4, 1.3, .2, AQ.teal, { t: '#3fb4c8' }); for (const x of [5.45, 8.4]) box(x, Y1 + 1.05, .25, .15, .15, 2.3, AQ.steel, { ol: false });
  signY('MAPLE BAY AQUARIUM', 4.55, 9.45, Y1 + .03, 2.95, 3.55, AQ.navy, AQ.foam, { lit: true });
  // ---- glass drum at the river end
  const cx = 16.9, cy = 4.2, r = 2.95, DH = 5.5;
  cylP(cx, cy, .25, r, DH, (k, v, hp) => { const a = Math.asin(Math.max(-1, Math.min(1, k))), m = Math.abs((((a / Math.PI * 9) % 1) + 1) % 1 - .5) > .45; if (v > hp - 26 && v < hp - 12) return k > .3 ? '#102a44' : AQ.navy; if (m || v % 18 === 0 || v < 3 || v > hp - 4) return k > .3 ? '#aebcc2' : AQ.frame; const wl = hp * .42 + Math.sin(a * 7) * 3; if (Math.abs(v - wl) < 1.2) return AQ.foam; const sh = k > .3 ? .16 : 0; return dk(v < wl ? '#2f90c0' : '#86d0ea', sh); }, { t: '#9ab0b4' });
  { const s = S2(cx, cy, .25 + DH - 1.5); lit(() => textS('AQUARIUM', s[0] - 14 - (textW('AQUARIUM') >> 1) + 8, s[1] + 12, AQ.foam)); }
  for (const [a, zz, l, d] of [[-.5, 1.5, 9, 1], [.25, 2.6, 6, -1], [-.15, .9, 5, -1]]) { const s = S2(cx, cy, zz); const X = s[0] + Math.round(a * r * 22), Y = s[1] + Math.round(Math.sqrt(1 - a * a) * r * 11); const q = [X, Y]; for (let i = 0; i < l; i++) { const w = Math.round(1.6 * Math.sin(Math.PI * Math.min(1, i / l * 1.1 + .05))); for (let j = -w; j <= w; j++) px(q[0] + d * (i - (l >> 1)), q[1] + j, C('#16527a')); } rect(q[0] - d * ((l >> 1) + 2) - (d < 0 ? 0 : 0), q[1] - 2, 2, 5, '#16527a'); }
  glow(() => cylP(cx, cy, .25, r, DH, (k, v, hp) => { const a = Math.asin(Math.max(-1, Math.min(1, k))), m = Math.abs((((a / Math.PI * 9) % 1) + 1) % 1 - .5) > .45; if (m || v % 18 === 0 || v < 3 || v > hp - 26) return null; const wl = hp * .42 + Math.sin(a * 7) * 3; return v < wl ? '#3fc0f0' : '#bff0ff'; }, { ol: false }));
  ball(cx, cy, .25 + DH + .5, 3.25, '#7fcbe6', { squash: .5, t: '#c8f0fa', d: '#3f9ec4' });
  { const s = S2(cx, cy, .25 + DH + 2.4); rect(s[0], s[1] - 8, 1, 9, AQ.navy); const q = [s[0] + 1, s[1] - 10]; for (let i = 0; i < 9; i++) { const w = Math.round(2 * Math.sin(Math.PI * Math.min(1, i / 9 * 1.1 + .05))); for (let j = -w; j <= w; j++) px(q[0] + i - 4, q[1] + j, C(AQ.orange)); } rect(q[0] - 7, q[1] - 2, 2, 5, AQ.coral); px(q[0] + 3, q[1] - 1, C(AQ.ink)); }
  // side wall detail on +x of the hall is hidden by the drum; a service door + porthole on the drum plinth
  box(13.9, 7.2, .25, 6, .5, .5, '#b9c4c6', { ol: false }); for (let x = 14.4; x < 19.6; x += 1.3) { const s = S2(x, 7.7, .62); ellipse(s[0], s[1] - 2, 3, 2, '#5f8a3a'); ellipse(s[0] + 3, s[1] - 3, 2, 2, '#f29ac0'); }
}

function whaletail() {
  const c = AQ.bronze, d = AQ.bronzeD, l = AQ.bronzeL, y = .7, s0 = S2(1.6, y, 0);
  ellipse(s0[0], s0[1], 17, 7, '#bfeaf6', 'glass'); ellipse(s0[0], s0[1], 12, 5, AQ.foam, 'glass');
  for (let z = 0; z < 2.5; z += 1 / 16) { const s = S2(1.6, y, z), rx = 8.5 - z * 2.5; for (let X = -Math.round(rx); X <= Math.round(rx); X++) px(s[0] + X, s[1], C(X > rx * .3 ? d : X < -rx * .45 ? l : c)); }
  const lobe = sg => { fq([[1.6, y, 2.2], [1.6 + sg * 1.6, y, 3.2], [1.6 + sg * 1.5, y, 4.15], [1.6 + sg * .6, y, 3.8], [1.6, y, 3.35]], sg > 0 ? d : c); lw([1.6, y, 3.05], [1.6 + sg * .75, y, 3.5], l); lw([1.6 + sg * .75, y, 3.5], [1.6 + sg * 1.5, y, 4.15], l); lw([1.6, y, 2.2], [1.6 + sg * 1.55, y, 3.35], AQ.ink); lw([1.6 + sg * 1.55, y, 3.35], [1.6 + sg * 1.5, y, 4.15], AQ.ink); for (let i = 1; i < 4; i++) lw([1.6 + sg * .3 * i, y, 2.5 + i * .22], [1.6 + sg * (.5 + .28 * i), y, 3.2 + i * .2], sg > 0 ? dk(d, .2) : d); };
  lobe(-1); lobe(1);
  for (const [dx, dz] of [[-12, 6], [-9, 12], [10, 8], [13, 4], [-15, 2], [7, 14]]) px(s0[0] + dx, s0[1] - dz, C(AQ.foam));
  ellipse(s0[0] - 2, s0[1] + 2, 9, 3, AQ.foam, 'glass');
}
function crate(p) {
  box(0, 0, 0, 1.4, 1, .7, '#4f9ad0', { l: '#3f86bc', r: '#2f6f9e' }); qy(.1, 1.3, 1.01, .25, .45, AQ.foam); const s = S2(.7, 1.02, .42); textS('TURTLE', s[0] - 11, s[1] - 3, AQ.navy);
  if (p.open) { qz(.1, 1.3, .1, .9, .71, '#1f4a6a'); } else box(-.05, -.05, .7, 1.5, 1.1, .1, '#5faee0', { ol: false });
  for (const x of [.25, .7, 1.15]) qx(1.41, .15, .85, .2, .5, '#1f4a6a');
}

export default [
  { id: 'bld.harbor.aquarium', kind: 'building', tags: ['harbor', 'aquarium', 'landmark', 'culture', 'venue'], size: [20, 8, 6], vb: [-.3, -.3, 0, 20.3, 8.6, 9], door: { side: 'y', at: 7 }, light: { x: 7, y: 9, z: 0, r: 6, c: '#8fd8ff' }, variants: [{ seed: 1 }], draw: building },
  { id: 'prop.aqua.whaletail', kind: 'prop', tags: ['harbor', 'aquarium', 'sculpture'], size: [3.2, 1.4, 4.2], vb: [-.4, -.4, -.2, 3.6, 1.8, 4.4], variants: [{}], draw: whaletail },
  { id: 'prop.aqua.crate', kind: 'prop', tags: ['aquarium'], size: [1.4, 1, .8], solid: false, variants: [{ open: 0 }, { open: 1 }], draw: crate },
];
