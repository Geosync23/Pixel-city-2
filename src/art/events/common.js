// Festival street dressing shared by all six big city events: bunting, road barriers, parade arches, posters, lamp-post banners,
// tent stalls, balloon bunches, a small stage. Everything takes p.scheme (blossom | harbor | fair | harvest | lantern | winter).
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, mix, rng, PAT, cyl, ball, hip, signY, textY, textW, U, C, px, ENV } from '../../engine/raster.js';
import { P, lamp, halo, bulbs, pennants, lantern, balloon, flower, pole, cord, sagPt, dot, flag } from './_lib.js';

export const SCH = {
  blossom: { c: ['#f2a7c3', '#fbe3ea', '#f7c1d4', '#9ad0a0', '#fff2b0'], a: '#e0608f', b: '#fbe3ea', ink: '#7a2f52', post: '#f4f0e8', glow: ['#ffd0e0', '#fff2b0'] },
  harbor: { c: ['#2f6fb5', '#f4f0e8', '#e0453a', '#f2c230', '#f4f0e8'], a: '#2f6fb5', b: '#f4f0e8', ink: '#1f3f6f', post: '#f4f0e8', glow: ['#fff2b0', '#9fd8ff', '#ff8a8a'] },
  fair: { c: ['#e0453a', '#f09a3a', '#f2c230', '#4fa860', '#3b82d6', '#8a5cd0'], a: '#8a5cd0', b: '#fff2b0', ink: '#3a2a6a', post: '#f4f0e8', glow: ['#ff8a8a', '#ffe08a', '#9cf2b0', '#9fd8ff', '#d0a8ff'] },
  harvest: { c: ['#d9562b', '#e8b63a', '#8a5a2a', '#b8432a', '#6f7a48'], a: '#b8432a', b: '#f6e6b8', ink: '#5a2a14', post: '#8a6a45', glow: ['#ffd98a', '#ffb060'] },
  lantern: { c: ['#e0453a', '#f2c230', '#f09a3a', '#f6f0dc', '#e0453a'], a: '#c0302a', b: '#f2c230', ink: '#5a1414', post: '#7a2a24', glow: ['#ff9a5a', '#ffd98a'] },
  winter: { c: ['#d8342e', '#f4f8fb', '#2f8f6a', '#f2c230', '#f4f8fb'], a: '#2f8f6a', b: '#f4f8fb', ink: '#1f4f3a', post: '#d8342e', glow: ['#fff2b0', '#ff8a8a', '#9cf2b0', '#9fd8ff'] },
};
const sch = p => SCH[p.scheme] || SCH.fair;
const SCHEMES = Object.keys(SCH);
const snow = () => ENV.season === 3;

/* goods on a stall counter, by kind */
function goods(kind, x0, x1, y, z, R, S) {
  const n = Math.round((x1 - x0) / .32);
  for (let i = 0; i < n; i++) {
    const x = x0 + .1 + i * .32, c = S.c[i % S.c.length];
    if (kind === 'drink') { cyl(x + .08, y, z, .07, .2 + (i % 2) * .06, i % 3 ? '#f4f0e8' : c, { ol: false }); if (i % 2) dot(x + .08, y, z + .34, '#f4f8fb', 1, 2); }
    else if (kind === 'tea') { cyl(x + .08, y, z, .08, .12, '#f6f0dc', { ol: false }); if (i % 3 === 0) { cyl(x + .08, y - .2, z, .11, .2, '#7a9a8a', { ol: false }); } }
    else if (kind === 'sweet') { ball(x + .08, y, z + .1, .09, c, { ol: false }); dot(x + .08, y, z + .0, '#f4f0e8', 1, 2); }
    else if (kind === 'gift') { box(x, y - .1, z, .2, .2, .14 + (i % 3) * .06, c, { ol: false }); dot(x + .1, y, z + .2 + (i % 3) * .06, '#f2c230', 2, 1); }
    else if (kind === 'pumpkin') { ball(x + .1, y, z + .1, .13, i % 3 ? '#e8802a' : '#e8b63a', { ol: false, squash: .7 }); dot(x + .1, y, z + .24, '#5a7a3a', 1, 2); }
    else if (kind === 'lantern') { lantern(x + .08, y, z + .16, i % 2 ? '#f2c230' : '#e0453a', 2); }
    else if (kind === 'flower') { cyl(x + .08, y, z, .07, .12, '#c0623a', { ol: false }); flower(x + .08, y, z + .26, S.c[i % 3]); flower(x + .14, y, z + .2, S.c[(i + 1) % 3]); }
    else if (kind === 'fish') { const q = P(x + .1, y, z + .04); for (let u = 0; u < 5; u++) { px(q[0] + u - 2, q[1] + (u >> 1), C(i % 2 ? '#8aa8c0' : '#e8a08a')); } }
    else { box(x, y - .1, z, .22, .2, .05, '#f4f0e8', { ol: false }); ball(x + .11, y, z + .09, .08, i % 2 ? '#d9a05a' : '#e8c070', { ol: false }); }   /* food: buns on plates */
  }
}

export default [
  { /* a line of pennants / lanterns / fairy lights across a street between two posts. Draws along x; flip for the other axis. */
    id: 'prop.event.bunting', kind: 'prop', tags: ['event', 'festival', 'bunting'], solid: false,
    size: p => [p.span || 5, .2, 3.9], vb: p => [-.3, -.5, 0, (p.span || 5) + .3, .8, 4.2],
    variants: SCHEMES.map((scheme, i) => ({ scheme, span: 5, kind: ['pennant', 'lights', 'pennant', 'pennant', 'lantern', 'lights'][i], seed: i + 1 })),
    draw(p) {
      const S = sch(p), L = p.span || 5, kind = p.kind || 'pennant', a = [.1, .1, 3.7], b = [L - .1, .1, 3.7], sag = Math.min(.9, L * .11);
      for (const x of [.1, L - .1]) { box(x - .12, 0, 0, .24, .24, .3, dk(S.post, .25), { ol: false }); pole(x, .1, .3, 3.5, S.post, .1); ball(x, .1, 3.86, .09, S.c[0], { ol: false }); }
      if (kind === 'lantern') { cord(a, b, sag, '#4a4458'); const n = Math.max(3, Math.round(L / .9)); for (let i = 0; i < n; i++) { const q = sagPt(a, b, (i + .5) / n, sag); lantern(q[0], q[1], q[2] - .28, S.c[i % 3], 3); } }
      else if (kind === 'lights') { bulbs(a, b, Math.round(L * 2.2), S.glow, sag, 3); pennants([.1, .1, 3.3], [L - .1, .1, 3.3], Math.round(L * 1.2), S.c, sag * .8, 4); }
      else { pennants(a, b, Math.round(L * 1.8), S.c, sag, 6); bulbs([.1, .1, 3.45], [L - .1, .1, 3.45], Math.round(L * 1.1), S.glow, sag, 2, null); }
    },
  },
  { /* "ROAD CLOSED" barrier: striped rail on trestles with amber lamps. Along x; flip for the other axis. */
    id: 'prop.event.barrier', kind: 'prop', tags: ['event', 'barrier', 'road'], solid: false,
    size: p => [p.w || 4, .5, 1.2], vb: p => [-.2, -.2, 0, (p.w || 4) + .2, .8, 1.9],
    variants: [{ w: 4, scheme: 'fair' }, { w: 4, scheme: 'winter', text: 'PARADE' }, { w: 2, scheme: 'harvest', text: '' }],
    draw(p) {
      const w = p.w || 4, S = sch(p), text = p.text === undefined ? 'ROAD CLOSED' : p.text;
      for (const x of [.25, w - .35]) { box(x, .0, 0, .1, .5, .08, '#4a4458', { ol: false }); pole(x + .05, .25, .08, .95, '#8a8f98', .08, false); }
      box(.05, .2, .62, w - .1, .08, .3, '#f4f0e8', { l: (u, v) => ((u + v) >> 2) & 1 ? '#e0453a' : '#f4f0e8', ol: true });
      box(.05, .2, .3, w - .1, .08, .14, '#f4f0e8', { l: (u, v) => ((u + v) >> 2) & 1 ? '#f2c230' : '#3a3440' });
      if (text && w >= 3.5) { const tw = (textW(text) + 6) / U, x0 = (w - tw) / 2; signY(text, x0, x0 + tw, .3, .98, 1.5, S.a, '#fff8e0', {}); pole(x0 + .1, .26, .9, .1, '#8a8f98', .06, false); pole(x0 + tw - .1, .26, .9, .1, '#8a8f98', .06, false); }
      lamp(.1, .26, 1.0, '#ffb347', 4, 2, 2); lamp(w - .1, .26, 1.0, '#ffb347', 4, 2, 2);
    },
  },
  { /* parade arch over the street with the event's name. Along x; flip for the other axis. */
    id: 'prop.event.arch', kind: 'prop', tags: ['event', 'arch', 'festival'], solid: false,
    size: p => [p.span || 5, .6, 4.8], vb: p => [-.6, -.6, 0, (p.span || 5) + .6, 1.4, 5.6],
    variants: [{ scheme: 'blossom', text: 'BLOSSOM PARADE' }, { scheme: 'harbor', text: 'HARBOR DAY' }, { scheme: 'fair', text: 'RIVER FAIR' }, { scheme: 'harvest', text: 'HARVEST' }, { scheme: 'lantern', text: 'LANTERN NIGHT' }, { scheme: 'winter', text: 'WINTER LIGHTS' }],
    draw(p) {
      const S = sch(p), L = p.span || 5, text = p.text || 'PARADE', R = rng(7 + (p.seed || 1)), tw = Math.min(L - 1, (textW(text) + 8) / U);
      for (const x of [0, L - .6]) {
        box(x, 0, 0, .6, .6, .4, dk(S.a, .2)); box(x + .08, .08, .4, .44, .44, 3.4, S.b, { l: PAT.stripes(S.a, S.b, 6), r: PAT.stripes(dk(S.a, .2), dk(S.b, .2), 6) });
        box(x - .04, -.04, 3.8, .68, .68, .16, S.a);
        if (p.scheme === 'lantern') { lantern(x + .3, .66, 3.2, '#e0453a', 4); lantern(x + .3, .66, 2.2, '#f2c230', 3); }
        else if (p.scheme === 'winter') { ball(x + .3, .3, 4.2, .3, '#2f8f6a'); lamp(x + .3, .5, 4.3, '#fff2b0', 4); lamp(x + .2, .62, 2.6, '#ff8a8a', 3); lamp(x + .4, .62, 1.6, '#9cf2b0', 3); }
        else if (p.scheme === 'harvest') { ball(x + .3, .62, .2, .26, '#e8802a', { squash: .7 }); for (let k = 0; k < 4; k++) lw([x + .1 + k * .13, .62, 3.9], [x + .05 + k * .16, .62, 4.5 + (k % 2) * .2], '#c9a23a'); }
        else if (p.scheme === 'harbor') { flag(x + .3, .3, 3.96, .9, ['#2f6fb5', '#f4f0e8', '#e0453a'], 7, 5); box(x + .1, .6, 1.6, .4, .06, .4, '#f4f0e8', { ol: false }); lw([x + .12, .67, 1.8], [x + .48, .67, 1.8], '#e0453a'); }
        else { for (let k = 0; k < 3; k++) balloon(x + .1 + R() * .4, .3 + R() * .2, 4.5 + k * .28, S.c[(k + (x > 0 ? 2 : 0)) % S.c.length], 3); }
      }
      /* beam + name board */
      box(.3, .14, 3.96, L - .6, .3, .5, S.a, { l: S.a, t: lt(S.a, .2) });
      const x0 = (L - tw) / 2; signY(text, x0, x0 + tw, .46, 3.98, 4.44, S.b, S.ink, { lit: p.scheme === 'lantern' || p.scheme === 'winter' });
      bulbs([.3, .46, 3.94], [L - .3, .46, 3.94], Math.round(L * 2), S.glow, 0, 2, null);
      if (p.scheme === 'blossom') for (let i = 0; i < 26; i++) flower(.4 + R() * (L - .8), .46, 4.5 + R() * .25, S.c[Math.floor(R() * 3)], '#fff2b0');
      else if (p.scheme === 'winter' || snow()) qz(.3, L - .3, .14, .44, 4.47, '#f4f8fb');
      else pennants([.4, .46, 4.9], [L - .4, .46, 4.9], Math.round(L * 1.4), S.c, .3, 4);
    },
  },
  { /* A-frame poster board that goes up in the days before */
    id: 'prop.event.poster', kind: 'prop', tags: ['event', 'poster'], solid: false, size: [1.8, .5, 1.5], vb: [-.2, -.2, 0, 2, .9, 1.9],
    variants: [{ scheme: 'blossom', text: 'PARADE', text2: 'SAT' }, { scheme: 'harbor', text: 'HARBOR', text2: 'DAY' }, { scheme: 'fair', text: 'FAIR', text2: 'SAT' }, { scheme: 'harvest', text: 'HARVEST', text2: 'FEST' }, { scheme: 'lantern', text: 'LANTERN', text2: 'NIGHT' }, { scheme: 'winter', text: 'LIGHTS', text2: 'FRI' }],
    draw(p) {
      const S = sch(p), t1 = (p.text || 'PARADE').slice(0, 7), t2 = (p.text2 || '').slice(0, 7);
      fq([[0, .05, 0], [1.8, .05, 0], [1.8, .28, 1.4], [0, .28, 1.4]], dk('#8a6a45', .3));
      box(0, .34, 0, 1.8, .06, 1.42, '#8a6a45', { l: S.b });
      qy(.06, 1.74, .41, .84, 1.36, S.a); qy(.06, 1.74, .41, .08, .8, S.b);
      /* little picture: sun / moon / flower / wave / pumpkin / tree by scheme */
      const q = P(.9, .41, 1.1);
      if (p.scheme === 'blossom') { for (const d of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, 1], [1, -1], [-1, 1]]) px(q[0] + d[0], q[1] + d[1], C('#fbe3ea')); px(q[0], q[1], C('#f2c230')); }
      else if (p.scheme === 'harbor') { for (let u = -4; u <= 4; u++) px(q[0] + u, q[1] + 2 + (u & 1), C('#f4f0e8')); for (let k = 0; k < 4; k++) px(q[0], q[1] - 3 + k, C('#f4f0e8')); px(q[0] + 1, q[1] - 2, C('#f2c230')); px(q[0] + 2, q[1] - 1, C('#f2c230')); }
      else if (p.scheme === 'harvest') { for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) if (Math.abs(i) + Math.abs(j) < 5) px(q[0] + i, q[1] + j, C('#e8802a')); px(q[0], q[1] - 3, C('#5a7a3a')); }
      else if (p.scheme === 'lantern') { for (let j = -3; j <= 3; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) + Math.abs(j) < 5) px(q[0] + i, q[1] + j, C('#f2c230')); px(q[0], q[1], C('#fff8e0')); }
      else if (p.scheme === 'winter') { for (let j = 0; j < 6; j++) for (let i = -(j >> 1) - 1; i <= (j >> 1) + 1; i++) px(q[0] + i, q[1] - 3 + j, C('#f4f8fb')); px(q[0], q[1] - 4, C('#f2c230')); }
      else { S.c.forEach((c, k) => { for (let u = -4; u <= 4; u++) px(q[0] + u, q[1] - 3 + k + Math.abs(u >> 1), C(c)); }); }
      textY(t1, .9 - textW(t1) / 2 / U, .42, .7, S.ink); if (t2) textY(t2, .9 - textW(t2) / 2 / U, .42, .36, S.a);
    },
  },
  { /* vertical banner on its own pole (kerb edge) */
    id: 'prop.event.banner', kind: 'prop', tags: ['event', 'banner'], solid: false, size: [.2, .9, 3.6], vb: [-.3, -.3, 0, .6, 1.3, 4],
    variants: SCHEMES.map((scheme, i) => ({ scheme, seed: i })),
    draw(p) {
      const S = sch(p); box(0, .35, 0, .2, .2, .25, '#4a4458', { ol: false }); pole(.1, .45, .25, 3.3, '#5a606c', .08, false);
      lw([.1, .1, 3.4], [.1, .8, 3.4], '#5a606c');
      qx(.14, .12, .78, 2.0, 3.36, S.a); qx(.14, .12, .78, 2.0, 2.2, S.c[1]); qx(.14, .12, .78, 3.16, 3.36, S.c[1]);
      const q = P(.14, .45, 2.75); for (const d of [[0, -3], [0, 3], [-3, 0], [3, 0], [-2, -2], [2, 2], [-2, 2], [2, -2], [0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) px(q[0] + d[0], q[1] + d[1] - (d[0] >> 1), C(S.b));
      fq([[.14, .12, 2.0], [.14, .45, 1.8], [.14, .78, 2.0]], S.a);
    },
  },
  { /* festival tent stall: striped canopy, counter with goods, a name board. Front (customers) on +y. */
    id: 'prop.event.stall', kind: 'prop', tags: ['event', 'stall', 'festival', 'shop'], solid: false, size: [3, 2, 3.1], vb: [-.4, -.4, 0, 3.4, 2.7, 3.7],
    use: { x: 1.5, y: 2.6 }, light: { x: 1.5, y: 2.2, z: 0, r: 3.5 },
    variants: [{ scheme: 'blossom', kind: 'tea', text: 'TEA' }, { scheme: 'harbor', kind: 'fish', text: 'CHOWDER' }, { scheme: 'fair', kind: 'sweet', text: 'TREATS' }, { scheme: 'harvest', kind: 'pumpkin', text: 'CIDER' }, { scheme: 'lantern', kind: 'lantern', text: 'LANTERNS' }, { scheme: 'winter', kind: 'drink', text: 'COCOA' }, { scheme: 'fair', kind: 'gift', text: 'PRIZES' }, { scheme: 'blossom', kind: 'flower', text: 'FLOWERS' }],
    draw(p) {
      const S = sch(p), kind = p.kind || 'food', R = rng((p.seed || 3) * 13), text = (p.text || '').slice(0, 9), A = S.a, B = S.b;
      for (const [x, y] of [[.08, .08], [2.92, .08], [.08, 1.92], [2.92, 1.92]]) pole(x, y, 0, 2.2, '#f4f0e8', .08, false);
      qy(.08, 2.92, .1, .9, 2.2, dk(A, .3), dk(A, .42));                                                                     /* back cloth */
      box(.12, 1.1, 0, 2.76, .8, .9, B, { l: PAT.vstripes(A, B, 6), r: dk(A, .25), t: '#e8dcc0' });                          /* counter */
      goods(kind, .2, 2.8, 1.52, .9, R, S);
      glow(() => qy(.2, 2.8, 1.12, .92, 1.9, '#ffe6a8', '#f5d48a'));
      /* canopy */
      hip(0, 0, 2.2, 3, 2, .8, A, { over: .2, l: PAT.vstripes(A, B, 6), r: PAT.vstripes(dk(A, .22), dk(B, .2), 6) });
      for (let u = -.15; u < 3.15; u += .25) { const q = P(u, 2.2, 2.1); px(q[0], q[1], C(A)); px(q[0] + 1, q[1] + 1, C(B)); px(q[0] + 2, q[1] + 1, C(A)); }
      if (text) { const tw = (textW(text) + 6) / U, x0 = 1.5 - tw / 2; signY(text, x0, x0 + tw, 2.22, 1.72, 2.12, '#fff8e0', S.ink, { lit: true }); }
      bulbs([.1, 2.22, 2.16], [2.9, 2.22, 2.16], 7, S.glow, .12, 2, null);
      ball(1.5, 1, 3.06, .1, S.c[1], { ol: false });
      if (p.scheme === 'winter' || snow()) { qz(.3, 2.7, .5, 1.5, 3.0, '#f4f8fb'); }
      if (kind === 'lantern') { lantern(.5, 2.1, 1.8, '#e0453a', 3); lantern(2.5, 2.1, 1.8, '#f2c230', 3); }
      if (kind === 'sweet' || kind === 'gift') { balloon(.2, 2, 2.9, S.c[0], 3); balloon(2.9, 2, 3.1, S.c[3], 3); }
    },
  },
  { /* bunch of balloons on a weight */
    id: 'prop.event.balloons', kind: 'prop', tags: ['event', 'balloons'], solid: false, size: [.4, .4, 2.6], vb: [-.6, -.6, 0, 1, 1, 3],
    variants: SCHEMES.map((scheme, i) => ({ scheme, seed: i + 2 })),
    draw(p) { const S = sch(p), R = rng(p.seed || 1); box(.1, .1, 0, .2, .2, .16, '#5a606c', { ol: false }); for (let i = 0; i < 6; i++) { const x = .2 + (R() - .5) * .7, z = 1.7 + R() * .8; lw([.2, .2, .16], [x, .2, z - .2], '#e8e2d4'); balloon(x, .2, z, S.c[i % S.c.length], 3); } },
  },
  { /* small open-air stage with a backdrop, speakers and a row of lights. Audience side = +y. */
    id: 'prop.event.stage', kind: 'prop', tags: ['event', 'stage', 'music'], solid: false, size: [5, 3, 3.6], vb: [-.4, -.4, 0, 5.4, 3.6, 4.2], light: { x: 2.5, y: 3.2, z: 0, r: 5 },
    variants: [{ scheme: 'fair', text: 'RIVER FAIR' }, { scheme: 'harbor', text: 'HARBOR DAY' }, { scheme: 'winter', text: 'CAROLS' }, { scheme: 'harvest', text: 'BARN DANCE' }],
    draw(p) {
      const S = sch(p), text = p.text || 'LIVE';
      box(0, 0, 0, 5, 3, .7, '#6a5a52', { l: PAT.planks('#7a5238', 5), r: dk('#7a5238', .3), t: PAT.fboards('#b8925a', .4) });
      for (const x of [.1, 4.9]) { pole(x, .1, .7, 2.8, '#5a606c', .1, false); pole(x, 2.9, .7, 2.8, '#5a606c', .1, false); }
      qy(.1, 4.9, .12, .7, 3.3, S.a, dk(S.a, .12)); const tw = (textW(text) + 8) / U; signY(text, 2.5 - tw / 2, 2.5 + tw / 2, .14, 2.3, 2.8, S.b, S.ink, { lit: true });
      pennants([.2, .14, 2.2], [4.8, .14, 2.2], 9, S.c, .25, 4);
      box(0, 0, 3.4, 5, 3, .14, '#4a4458', { t: dk(S.a, .2) });
      for (let i = 0; i < 6; i++) lamp(.5 + i * .8, 3, 3.36, S.glow[i % S.glow.length], 5, 3, 2);
      for (const x of [.15, 4.25]) { box(x, 2.2, .7, .6, .5, 1.0, '#33303f'); const q = P(x + .3, 2.7, 1.35); for (const d of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) px(q[0] + d[0], q[1] + d[1], C('#5a606c')); px(q[0], q[1] + 5, C('#5a606c')); }
      box(2.1, 1.2, .7, .8, .5, .5, '#7a5238', { ol: false }); cyl(2.5, 1.45, 1.2, .3, .3, '#d8342e'); cyl(1.7, 1.6, .7, .16, .5, '#c9ced6', { ol: false });   /* drum kit */
      pole(3.4, 2.2, .7, 1.2, '#c9ced6', .05, false); dot(3.4, 2.2, 1.95, '#33303f', 2, 2);                                                                 /* mic stand */
    },
  },
];
