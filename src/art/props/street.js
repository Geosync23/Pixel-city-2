// Street furniture: lamps, benches, bins, boxes, booths, signs, poles.
import { box, cyl, ball, cone, qz, qy, qx, lw, fq, px, C, PW, ENV, dk, lt, mix, rng, hash2, ellipse, glow, lit, signY, signX, textY, textX, winY, winX, PAT, rect, textW } from '../../engine/raster.js';
import { clumps, leafC, everC, leafBox, limb, pole, shadow, scatter, snowTop, snowMound, blooms, tufts, bulb, stringLights, bike, stampY, LEAF, cat, rail, crate, ring, winter, season, P, SNOW, SNOW2, IRON, IRON2, WOOD, STONE, WARM, WARM2, screenY, screenX } from './_lib.js';

const FL = ['#f25a6a', '#ffd23a', '#ffffff', '#b06ae0', '#ff8ab0'];
/** seasonal planting in a container: centre (x,y), soil height z, radius r */
function planting(x, y, z, r, seed, kind) {
  const s = season(), R = rng(seed || 1);
  if (kind === 'shrub') { clumps([{ x, y, z: z + r * .9, r: r * 1.05, c: everC(seed || 0, '#3f8f4a', .4) }, { x: x - r * .3, y: y + r * .3, z: z + r * .6, r: r * .7, c: everC((seed || 0) + 1, '#3f8f4a', .4) }], { seed, bump: .12, snow: winter() }); return; }
  if (s === 3) { clumps([{ x, y, z: z + r * .45, r: r * .75, sq: .7, c: everC(seed || 0) }], { seed, bump: .15, snow: true }); const q = P(x, y, z + r); px(q[0] + 2, q[1] + 2, C('#d8342c')); px(q[0] - 3, q[1] + 3, C('#d8342c')); return; }
  const c = s === 2 ? '#8a9a45' : leafC(seed || 0), cols = s === 2 ? ['#e8822a', '#b8432a', '#e8b63a'] : s === 0 ? ['#ff8ab0', '#ffd23a', '#ffffff'] : FL;
  clumps([{ x, y, z: z + r * .45, r: r * .95, sq: .65, c }], { seed, bump: .18, dots: { c: cols, p: .42 } });
}
const lampTags = (...t) => ['street', 'lamp', 'light', ...t];

export default [
  /* ================= lamps ================= */
  {
    id: 'prop.street.lamp.modern', kind: 'prop', tags: lampTags('modern', 'downtown', 'road'), solid: true, size: [.5, .5, 4.6], vb: [-.3, -.3, 0, 1.2, 1.5, 4.9],
    light: { x: .25, y: 1.0, z: 0, r: 5 }, variants: [{}, { c: '#e8e2d4' }, { banner: '#d8342c' }, { c: '#2f6f5f', banner: '#e8b63a' }],
    draw(p) {
      const c = p.c || '#4d5d68';
      box(.1, .1, 0, .3, .3, .5, dk(c, .15)); pole(.25, .25, .5, 4.3, c, 2); snowTop(.1, .4, .1, .4, .5);
      limb([.25, .25, 4.3], [.25, .7, 4.45], c, 2, 2);
      box(.08, .6, 4.4, .34, .7, .1, dk(c, .1)); qy(.12, .38, 1.3, 4.4, 4.44, '#e8e2d0'); qx(.42, .7, 1.25, 4.4, 4.43, '#d8d2c0');
      glow(() => { qy(.08, .42, 1.3, 4.36, 4.46, WARM); qx(.42, .62, 1.3, 4.36, 4.44, WARM2); }); snowTop(.08, .42, .6, 1.3, 4.5);
      if (p.banner) { lw([.25, .25, 3.6], [1.0, .25, 3.6], c); lw([.25, .25, 2.3], [1.0, .25, 2.3], c); qy(.36, .98, .25, 2.34, 3.58, p.banner); qy(.36, .98, .25, 2.34, 2.5, dk(p.banner, .2)); stampY(LEAF, .46, .25, 3.3, '#fff8e0'); }
    },
  },
  {
    id: 'prop.street.lamp.gas', kind: 'prop', tags: lampTags('oldtown', 'gaslamp', 'classic', 'lantern'), solid: true, size: [.5, .5, 3.8], vb: [-.5, -.5, 0, 1, 1, 4.2],
    light: { x: .25, y: .25, z: 0, r: 4 }, variants: [{}, { baskets: true, seed: 2 }, { c: '#2f4f45' }, { baskets: true, c: '#3a3440', seed: 5 }],
    draw(p) {
      const c = p.c || '#2f3942', x = .25, y = .25;
      cyl(x, y, 0, .2, .12, c); cyl(x, y, .12, .13, .5, c); cyl(x, y, .62, .16, .06, lt(c, .1), { ol: false }); pole(x, y, .68, 3.05, c, 2); snowTop(.1, .4, .1, .4, .13);
      const s = P(x, y, 2.5); for (let i = -4; i <= 4; i++) px(s[0] + i, s[1], C(i < 0 ? lt(c, .2) : c)); px(s[0] - 5, s[1] - 1, C(c)); px(s[0] + 5, s[1] - 1, C(c));
      if (p.baskets) for (const sx of [-1, 1]) { const bx = x + sx * .36, by = y - sx * .36; lw([bx, by, 2.5], [bx, by, 2.2], '#2a2433'); if (winter()) { ring(bx, by, 2.05, 3, everC(0)); const q = P(bx, by, 2.05); px(q[0], q[1] + 3, C('#d8342c')); px(q[0] - 1, q[1] + 4, C('#d8342c')); px(q[0] + 1, q[1] + 4, C('#d8342c')); } else { planting(bx, by, 2.0, .2, (p.seed || 1) + sx); const q = P(bx, by, 2.0); for (let i = -2; i <= 2; i++) { px(q[0] + i, q[1], C('#6b4a2f')); if (Math.abs(i) < 2) px(q[0] + i, q[1] + 1, C('#4a2f1c')); } } }
      // lantern: tapered glass cage + cap
      cyl(x, y, 3.05, .09, .06, c, { ol: false });
      const a = P(x, y, 3.1), b = P(x, y, 3.55), gl = '#f4ecc8';
      for (let Y = b[1]; Y <= a[1]; Y++) { const t = (a[1] - Y) / (a[1] - b[1]), hw = Math.round(2 + t * 2); for (let i = -hw; i <= hw; i++) px(a[0] + i, Y, C(Math.abs(i) === hw || i === 0 ? c : i < 0 ? gl : dk(gl, .12))); }
      glow(() => { for (let Y = b[1]; Y <= a[1]; Y++) { const t = (a[1] - Y) / (a[1] - b[1]), hw = Math.round(2 + t * 2); for (let i = -hw + 1; i < hw; i++) px(a[0] + i, Y, C(Math.abs(i) < 2 ? '#fffbe8' : WARM2)); } });
      for (let i = -5; i <= 5; i++) px(b[0] + i, b[1] - 1, C(winter() ? SNOW : c)); for (let i = -3; i <= 3; i++) px(b[0] + i, b[1] - 2, C(winter() ? SNOW : lt(c, .15))); for (let i = -1; i <= 1; i++) px(b[0] + i, b[1] - 3, C(c)); px(b[0], b[1] - 4, C(c)); px(b[0], b[1] - 5, C(lt(c, .3)));
    },
  },
  {
    id: 'prop.street.lamp.double', kind: 'prop', tags: lampTags('double', 'avenue', 'downtown', 'road', 'harbor'), solid: true, size: [.5, .5, 5.2], vb: [-1.1, -.4, 0, 1.6, .9, 5.6],
    light: { x: .25, y: .25, z: 0, r: 6.5 }, variants: [{}, { c: '#2f4f45', flags: true }, { c: '#e8e2d4' }],
    draw(p) {
      const c = p.c || '#3d4a54', x = .25, y = .25;
      cyl(x, y, 0, .2, .5, dk(c, .1)); pole(x, y, .5, 5, c, 2); snowTop(.1, .4, .1, .4, .5);
      for (const sx of [-1, 1]) {
        const ex = x + sx * 1.0; limb([x, y, 4.5], [x + sx * .5, y, 5.0], c, 1, 1); rail([x, y, 5.0], [ex, y, 5.0], c, 2); lw([ex - sx * .1, y, 5.0], [ex - sx * .1, y, 4.8], c);
        const q = P(ex - sx * .1, y, 4.6); for (let i = -3; i <= 3; i++) { px(q[0] + i, q[1] - 3, C(winter() ? SNOW : c)); if (Math.abs(i) < 3) px(q[0] + i, q[1] - 4, C(winter() ? SNOW : lt(c, .2))); }
        for (let j = -2; j <= 1; j++) for (let i = -2; i <= 2; i++) px(q[0] + i, q[1] + j, C(j === 1 && Math.abs(i) === 2 ? c : i < 0 ? '#f4ecc8' : '#dcd4b0'));
        glow(() => ellipse(q[0], q[1], 3.2, 2.6, WARM)); glow(() => ellipse(q[0], q[1], 1.6, 1.4, '#fffbe8'));
      }
      const t = P(x, y, 5.0); px(t[0], t[1] - 2, C(c)); px(t[0] + 1, t[1] - 2, C(c)); px(t[0], t[1] - 3, C(lt(c, .3)));
      if (p.flags) for (const sx of [-1, 1]) { const x0 = sx < 0 ? x - .75 : x + .15; qy(x0, x0 + .6, y, 3.0, 4.2, sx < 0 ? '#d8342c' : '#e8e2d4'); stampY(LEAF, x0 + .1, y, 3.9, sx < 0 ? '#fff8e0' : '#d8342c'); lw([x0, y, 4.2], [x0 + .6, y, 4.2], c); }
    },
  },
  {
    id: 'prop.street.lamp.globe', kind: 'prop', tags: lampTags('park', 'globe', 'path', 'hillcrest'), solid: true, size: [.5, .5, 3], vb: [-.5, -.5, 0, 1, 1, 3.4],
    light: { x: .25, y: .25, z: 0, r: 3.5 }, variants: [{}, { triple: true }, { c: '#e8e2d4' }, { c: '#2f4f45', triple: true }],
    draw(p) {
      const c = p.c || '#2f3942', x = .25, y = .25;
      cyl(x, y, 0, .17, .1, c); cyl(x, y, .1, .1, .3, c, { ol: false }); pole(x, y, .4, 2.5, c, 2); snowTop(.12, .38, .12, .38, .11);
      const g = (gx, gy, gz, r) => { cyl(gx, gy, gz - r * .9, .07, .06, c, { ol: false }); ball(gx, gy, gz, r, '#f4f0e0', { t: '#ffffff', d: '#cfcab8' }); glow(() => ball(gx, gy, gz, r + .03, WARM, { t: '#fffbe8', d: WARM2, ol: false })); if (winter()) { const q = P(gx, gy, gz + r); for (let i = -2; i <= 2; i++) px(q[0] + i, q[1] - (Math.abs(i) < 2 ? 1 : 0), C(SNOW)); } };
      if (p.triple) { rail([x - .4, y + .4, 2.3], [x + .4, y - .4, 2.3], c, 1); lw([x - .4, y + .4, 2.3], [x - .4, y + .4, 2.45], c); lw([x + .4, y - .4, 2.3], [x + .4, y - .4, 2.45], c); g(x - .4, y + .4, 2.62, .17); g(x + .4, y - .4, 2.62, .17); g(x, y, 2.85, .2); }
      else g(x, y, 2.75, .23);
    },
  },
  /* ================= seating ================= */
  {
    id: 'prop.street.bench.wood', kind: 'prop', tags: ['street', 'park', 'bench', 'seat', 'wood'], solid: true, size: [2, .5, .9], vb: [-.1, -.1, 0, 2.1, .8, 1.1],
    seats: [{ x: .55, y: .35, z: .45, dir: 1 }, { x: 1.45, y: .35, z: .45, dir: 1 }], variants: [{}, { c: '#3f7a55' }, { c: '#8a4b3a', arm: false }, { c: '#e8e2d4' }],
    draw(p) {
      const c = p.c || WOOD, sl = (x, y) => (Math.floor(y * 16) % 3 === 0) ? dk(c, .3) : c;
      for (const x of [.12, 1.8]) { box(x, .05, 0, .08, .08, .95, IRON, { ol: false }); box(x, .42, 0, .08, .08, .42, IRON, { ol: false }); }
      box(.04, .03, .55, 1.92, .07, .42, c, { l: PAT.siding(dk(c, .15), 4), t: winter() ? SNOW : c });
      box(.04, .1, .4, 1.92, .42, .06, c, { t: winter() ? SNOW : sl });
      if (p.arm !== false) for (const x of [.04, 1.88]) { box(x, .1, .62, .08, .42, .05, IRON, { ol: false }); box(x, .46, .46, .08, .06, .18, IRON, { ol: false }); }
    },
  },
  {
    id: 'prop.street.bench.metal', kind: 'prop', tags: ['street', 'bench', 'seat', 'metal', 'modern', 'downtown', 'station'], solid: true, size: [2, .5, .9], vb: [-.1, -.1, 0, 2.1, .8, 1.1],
    seats: [{ x: .55, y: .35, z: .45, dir: 1 }, { x: 1.45, y: .35, z: .45, dir: 1 }], variants: [{}, { c: '#3b7bd8' }, { c: '#d8a23a', back: false }, { c: '#c8503a' }],
    draw(p) {
      const c = p.c || '#8a959e', mesh = b => (u, v) => ((u + v) & 1) ? dk(b, .3) : b;
      for (const x of [.2, 1.72]) { box(x, .22, 0, .08, .1, .4, IRON, { ol: false }); box(x - .06, .1, 0, .2, .4, .04, IRON, { ol: false }); }
      if (p.back !== false) { for (const x of [.2, 1.72]) box(x, .05, .4, .06, .06, .5, IRON, { ol: false }); box(.06, .04, .58, 1.88, .05, .34, c, { l: mesh(dk(c, .15)), t: winter() ? SNOW : lt(c, .2) }); }
      box(.06, .1, .4, 1.88, .4, .05, c, { t: winter() ? SNOW : (x, y) => (Math.floor(x * 16) + Math.floor(y * 16)) % 2 ? lt(c, .12) : dk(c, .12) });
      box(.96, .1, .45, .06, .4, .14, IRON, { ol: false });
    },
  },
  {
    id: 'prop.street.bench.stone', kind: 'prop', tags: ['street', 'park', 'bench', 'seat', 'stone', 'hillcrest', 'plaza'], solid: true, size: [2, .5, .5],
    seats: [{ x: .55, y: .25, z: .45, dir: 1 }, { x: 1.45, y: .25, z: .45, dir: 1 }], variants: [{}, { c: '#c8b8a0' }, { c: '#8a8f9a', wood: true }],
    draw(p) {
      const c = p.c || STONE;
      box(.15, .08, 0, .3, .34, .34, dk(c, .1), { l: PAT.stone(dk(c, .25)) }); box(1.55, .08, 0, .3, .34, .34, dk(c, .1), { l: PAT.stone(dk(c, .25)) });
      box(0, .02, .34, 2, .46, .12, c, { t: winter() ? SNOW : p.wood ? (x, y) => Math.floor(y * 16) % 3 === 0 ? dk(WOOD, .3) : WOOD : PAT.ftile(c, lt(c, .08), .5) });
    },
  },
  /* ================= bins ================= */
  {
    id: 'prop.street.bin', kind: 'prop', tags: ['street', 'park', 'bin', 'trash'], solid: true, size: [.5, .5, 1], variants: [{}, { style: 'mesh' }, { style: 'hood', c: '#2f6f5f' }, { style: 'box', c: '#8a4b3a' }, { style: 'mesh', full: true }],
    draw(p) {
      const st = p.style || 'round', c = p.c || '#56636b';
      if (st === 'round') { cyl(.25, .25, 0, .2, .7, c, { t: '#2a2f3a' }); cyl(.25, .25, .68, .22, .06, lt(c, .15), { t: winter() ? SNOW : '#2a2f3a', ol: false }); const s = P(.25, .45, .35); for (let i = -3; i <= 2; i += 2) for (let j = -3; j <= 3; j++) px(s[0] + i, s[1] + j, C(dk(c, .4))); }
      else if (st === 'mesh') { cyl(.25, .25, 0, .2, .75, '#7a858e', { l: '#6a757e', r: '#4a555e', t: '#2a2f3a' }); const s = P(.25, .25, 0); for (let Y = -11; Y <= 3; Y++) for (let X = -5; X <= 5; X++) if ((X + Y) & 1 && Y - Math.abs(X) * .1 < 2) px(s[0] + X, s[1] + Y, C('#2f3942')); if (p.full) { ball(.25, .25, .82, .16, '#3a3440'); const q = P(.25, .25, .8); px(q[0] + 3, q[1] + 1, C('#e8e2d4')); px(q[0] - 3, q[1] + 2, C('#d8a23a')); } }
      else if (st === 'hood') { box(.06, .06, 0, .38, .38, .7, c, { l: PAT.planks(dk(c, .18), 3) }); box(.03, .03, .85, .44, .44, .08, dk(c, .1), { t: winter() ? SNOW : dk(c, .1) }); for (const [x, y] of [[.06, .06], [.4, .06], [.06, .4], [.4, .4]]) lw([x, y, .7], [x, y, .85], dk(c, .4)); qy(.1, .4, .44, .7, .85, '#2a2433'); }
      else { box(.05, .05, 0, .4, .4, .8, c, { l: PAT.planks(dk(c, .18), 3), r: PAT.planks(dk(c, .36), 3), t: winter() ? SNOW : dk(c, .2) }); qy(.14, .36, .45, .55, .68, '#2a2433'); }
    },
  },
  {
    id: 'prop.street.recycling', kind: 'prop', tags: ['street', 'park', 'bin', 'recycling', 'trash'], solid: true, size: p => [(p.n || 3) * .5, .5, 1], variants: [{ n: 3 }, { n: 2 }, { n: 4 }],
    draw(p) {
      const n = p.n || 3, cols = ['#3b7bd8', '#4fa850', '#e8b63a', '#56636b'], ic = ['#ffffff', '#ffffff', '#3a3440', '#ffffff'];
      for (let i = 0; i < n; i++) { const x = i * .5 + .04; box(x, .06, 0, .42, .38, .78, cols[i % 4]); box(x - .02, .04, .78, .46, .42, .07, dk(cols[i % 4], .15), { t: winter() ? SNOW : dk(cols[i % 4], .15) }); qy(x + .1, x + .32, .44, .56, .66, '#2a2433'); const s = P(x + .15, .44, .36); for (const q of [[1, 0], [0, 1], [2, 1], [0, 3], [1, 3], [2, 3]]) px(s[0] + q[0], s[1] + q[1] + 1, C(ic[i % 4])); }
    },
  },
  /* ================= small street items ================= */
  {
    id: 'prop.street.hydrant', kind: 'prop', tags: ['street', 'hydrant', 'road'], solid: true, size: [.5, .5, .8], variants: [{}, { c: '#e8b63a' }, { c: '#3b7bd8' }],
    draw(p) {
      const c = p.c || '#d8342c', x = .25, y = .25;
      cyl(x, y, 0, .16, .06, dk(c, .2)); cyl(x, y, .06, .11, .46, c); cyl(x, y, .5, .14, .05, dk(c, .1), { ol: false }); ball(x, y, .6, .11, c, { squash: .8 });
      const s = P(x, y, .68); px(s[0], s[1] - 2, C(dk(c, .4))); px(s[0], s[1] - 3, C(winter() ? SNOW : lt(c, .3)));
      box(x - .22, y - .05, .3, .1, .1, .1, '#c8ccd4', { ol: false }); const q = P(x + .02, y + .13, .32); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) px(q[0] + i, q[1] + j + (i >> 1), C(i + j === 2 ? '#8a8f9a' : '#c8ccd4'));
      if (winter()) snowMound(x, y + .08, 0, .22);
    },
  },
  {
    id: 'prop.street.mailbox', kind: 'prop', tags: ['street', 'mailbox', 'post'], solid: true, size: [.5, .5, 1.3], variants: [{}, { style: 'pillar' }, { style: 'pillar', c: '#e8b63a' }, { c: '#2f6f5f' }],
    draw(p) {
      if (p.style === 'pillar') { const c = p.c || '#d8342c'; cyl(.25, .25, 0, .22, .1, '#2a2433'); cyl(.25, .25, .1, .19, .95, c); cyl(.25, .25, 1.05, .23, .06, dk(c, .1), { ol: false }); ball(.25, .25, 1.1, .19, c, { squash: .5 }); const s = P(.25, .45, .85); rect(s[0] - 3, s[1], 6, 2, '#2a2433'); rect(s[0] - 2, s[1] + 5, 4, 5, '#f4f0e0'); px(s[0] - 1, s[1] + 7, C('#3a3440')); px(s[0], s[1] + 7, C('#3a3440')); if (winter()) { const t = P(.25, .25, 1.22); ellipse(t[0], t[1] + 1, 4, 2, SNOW); } return; }
      const c = p.c || '#2f5fa8';
      for (const [x, y] of [[.08, .08], [.38, .08], [.08, .38], [.38, .38]]) lw([x, y, 0], [x, y, .3], '#2a2f3a');
      box(.05, .05, .25, .4, .4, .7, c); cyl(.25, .25, .95, .2, .12, c, { ol: false }); box(.05, .05, .93, .4, .4, .12, c, { ol: false, t: winter() ? SNOW : lt(c, .12) });
      qy(.1, .4, .45, .76, .86, '#2a2433'); signY('MAIL', .07, .43, .455, .42, .68, c, '#ffffff', { frame: false }); qx(.45, .12, .38, .4, .6, '#e8e2d4');
    },
  },
  {
    id: 'prop.street.newsbox', kind: 'prop', tags: ['street', 'newspaper', 'newsbox'], solid: true, size: p => [(p.cols || ['#d8342c']).length * .5, .5, 1.1],
    variants: [{ cols: ['#d8342c'] }, { cols: ['#3b7bd8', '#e8b63a'] }, { cols: ['#4fa850', '#d8342c', '#3a3440'] }],
    draw(p) {
      (p.cols || ['#d8342c']).forEach((c, i) => {
        const x = i * .5 + .05; box(x + .12, .18, 0, .16, .16, .35, IRON, { ol: false }); box(x - .01, .08, 0, .42, .36, .04, IRON, { ol: false });
        box(x, .08, .35, .4, .36, .7, c, { t: winter() ? SNOW : lt(c, .1) }); qy(x + .05, x + .35, .44, .6, .98, '#cfe0e8'); qy(x + .08, x + .32, .445, .64, .9, '#f4f0e0'); lw([x + .1, .445, .86], [x + .3, .445, .86], '#3a3440'); lw([x + .1, .445, .8], [x + .3, .445, .8], '#8a8f9a'); lw([x + .1, .445, .74], [x + .24, .445, .74], '#8a8f9a'); qy(x + .05, x + .35, .44, .4, .52, dk(c, .3)); const s = P(x + .3, .44, .5); px(s[0], s[1], C('#e8e2d4'));
      });
    },
  },
  {
    id: 'prop.street.phonebooth', kind: 'prop', tags: ['street', 'phone', 'booth', 'oldtown'], solid: true, size: [1, 1, 2.6], use: { x: .5, y: 1.4 }, light: { x: .5, y: 1.2, z: 0, r: 2 },
    variants: [{}, { c: '#2f5fa8' }, { c: '#2f6f5f' }, { c: '#3a3440', name: 'WIFI' }],
    draw(p) {
      const c = p.c || '#c8302a';
      box(0, 0, 0, 1, 1, .12, dk(c, .2)); box(.04, .04, .12, .92, .92, 2.1, c);
      for (let i = 0; i < 3; i++) { winY(.14, .86, .96, .3 + i * .62, .82 + i * .62, { on: true, mullion: 'v', frame: dk(c, .4), glass: ['#a8d0e0', '#c0e0ec'] }); winX(.96, .14, .86, .3 + i * .62, .82 + i * .62, { on: true, mullion: 'v', frame: dk(c, .5) }); }
      qy(.72, .78, .965, 1.0, 1.3, '#e8c85a');
      box(0, 0, 2.22, 1, 1, .3, c); signY(p.name || 'PHONE', .08, .92, 1.005, 2.26, 2.48, '#f4f0e0', dk(c, .2), { lit: true }); signX(p.name || 'PHONE', 1.005, .08, .92, 2.26, 2.48, '#e4e0d0', dk(c, .2), { lit: true });
      box(.1, .1, 2.52, .8, .8, .06, c, { t: winter() ? SNOW : lt(c, .12) });
    },
  },
  {
    id: 'prop.street.bollard', kind: 'prop', tags: ['street', 'bollard', 'road', 'parking', 'segment'], solid: true, size: p => [p.len || .5, .5, .9], vb: p => [-.1, -.1, 0, (p.len || .5) + .1, .6, 1.2],
    light: { x: .25, y: .25, z: 0, r: 0 },
    variants: [{}, { style: 'stone' }, { style: 'lit' }, { style: 'chain', len: 2 }, { style: 'steel', len: 2 }, { style: 'flex' }, { style: 'chain', len: 4 }],
    draw(p) {
      const st = p.style || 'steel', L = p.len || .5, n = Math.max(1, Math.round(L / (st === 'chain' ? 2 : 1))) + (L > .5 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const x = n === 1 ? .25 : .25 + i * (L - .5) / (n - 1), y = .25;
        if (st === 'stone') { cyl(x, y, 0, .15, .5, STONE); ball(x, y, .62, .16, lt(STONE, .1), { squash: .9 }); if (winter()) { const q = P(x, y, .78); ellipse(q[0], q[1] + 1, 3, 1.5, SNOW); } }
        else if (st === 'lit') { cyl(x, y, 0, .1, .7, '#4d5d68'); const q = P(x, y, .7); lit(() => { for (let j = 0; j < 3; j++) for (let k = -2; k <= 2; k++) px(q[0] + k, q[1] + 2 + j, C(j === 1 ? '#fffbe8' : WARM2)); }); cyl(x, y, .78, .11, .06, '#3d4a54', { ol: false, t: winter() ? SNOW : '#56636b' }); }
        else if (st === 'flex') { cyl(x, y, 0, .12, .05, '#2a2f3a'); cyl(x, y, .05, .06, .8, '#f08a1c', { ol: true }); const q = P(x, y, .6); for (let k = -1; k <= 1; k++) { px(q[0] + k, q[1], C('#ffffff')); px(q[0] + k, q[1] + 1, C('#ffffff')); px(q[0] + k, q[1] + 5, C('#ffffff')); } }
        else if (st === 'chain') { cyl(x, y, 0, .09, .8, '#2f3942'); ball(x, y, .86, .09, '#3d4a54'); if (winter()) { const q = P(x, y, .95); px(q[0], q[1], C(SNOW)); px(q[0] - 1, q[1] + 1, C(SNOW)); } }
        else { cyl(x, y, 0, .09, .8, '#a8b0b8', { t: winter() ? SNOW : '#c8ccd4' }); const q = P(x, y, .62); for (let k = -1; k <= 2; k++) px(q[0] + k, q[1] + 1, C('#f0c832')); }
        if (st === 'chain' && i < n - 1) { const x2 = .25 + (i + 1) * (L - .5) / (n - 1), A = PW(x, y, .72), B = PW(x2, y, .72), m = Math.round(B[0] - A[0]); for (let k = 2; k < m - 1; k++) { const t = k / m; px(Math.round(A[0]) + k, Math.round(A[1] + (B[1] - A[1]) * t + Math.sin(t * Math.PI) * 4), C(k & 1 ? '#2a2f3a' : '#6a757e')); } }
      }
    },
  },
  {
    id: 'prop.street.planter.round', kind: 'prop', tags: ['street', 'planter', 'plaza', 'flowers', 'nature'], solid: true, size: [1, 1, .6], vb: [-.3, -.3, 0, 1.3, 1.3, 1.9],
    variants: [{ seed: 1 }, { seed: 2, c: '#c0623a' }, { seed: 3, kind: 'shrub', c: '#56636b' }, { seed: 4, c: '#e8e2d4', big: true }, { seed: 5, kind: 'tree', c: '#8a8f9a' }],
    draw(p) {
      const c = p.c || '#b9b4a8'; shadow(.5, .5, 0, .55);
      cyl(.5, .5, 0, .36, .1, dk(c, .1)); cyl(.5, .5, .1, .42, .42, c); cyl(.5, .5, .5, .45, .06, lt(c, .1), { t: winter() ? SNOW : '#6a4a36', ol: false });
      if (p.kind === 'tree') { pole(.5, .5, .5, 1.2, '#6b4a2f', 2, false); if (winter()) { for (const a of [0, 1.3, 2.6, 3.9, 5.2]) limb([.5, .5, 1.15], [.5 + Math.cos(a) * .35, .5 + Math.sin(a) * .35, 1.6], '#6b4a2f', 1, 1, true); } else clumps([{ x: .5, y: .5, z: 1.45, r: .42, c: leafC(p.seed) }, { x: .35, y: .6, z: 1.3, r: .28, c: leafC((p.seed || 0) + 1) }], { seed: p.seed, bump: .14 }); if (!winter()) blooms(.25, .75, .3, .75, .56, FL, 5, p.seed); }
      else planting(.5, .5, .5, p.big ? .46 : .38, p.seed, p.kind);
    },
  },
  {
    id: 'prop.street.planter.box', kind: 'prop', tags: ['street', 'planter', 'flowers', 'nature', 'segment', 'cafe'], solid: true, size: p => [p.len || 2, .5, .6], vb: p => [-.1, -.1, 0, (p.len || 2) + .1, .7, 1.4],
    variants: [{ len: 2, seed: 1 }, { len: 1, seed: 2, c: '#3d4a54' }, { len: 3, seed: 3, c: '#e8e2d4', kind: 'shrub' }, { len: 2, seed: 4, c: '#8a4b3a', kind: 'hedge' }],
    draw(p) {
      const L = p.len || 2, c = p.c || '#a8744a', wood = !p.c || p.c === '#8a4b3a';
      box(0, .04, 0, L, .42, .5, c, wood ? { l: PAT.planks(dk(c, .18), 5), r: PAT.planks(dk(c, .36), 5), t: '#6a4a36' } : { t: '#6a4a36' }); lw([0, .46, .44], [L, .46, .44], dk(c, .45));
      if (p.kind === 'hedge') leafBox(.06, .1, .5, L - .12, .3, .5, everC(p.seed));
      else for (let i = 0; i < L * 2; i++) planting(.26 + i * .5, .25, .5, .26, (p.seed || 1) + i, p.kind);
    },
  },
  {
    id: 'prop.street.clock', kind: 'prop', tags: ['street', 'clock', 'plaza', 'oldtown', 'station', 'landmark'], solid: true, size: [.5, .5, 4], vb: [-.4, -.4, 0, .9, .9, 4.4], light: { x: .25, y: .25, z: 0, r: 2.5 },
    variants: [{}, { c: '#2f4f45' }, { c: '#7a2a2a', hour: 4 }],
    draw(p) {
      const c = p.c || '#2f3942', x = .25, y = .25;
      cyl(x, y, 0, .22, .14, c); cyl(x, y, .14, .15, .6, c); cyl(x, y, .74, .18, .06, lt(c, .15), { ol: false }); pole(x, y, .8, 3.1, c, 2); snowTop(.1, .4, .1, .4, .15);
      const s = P(x, y, 3.5); ellipse(s[0], s[1], 9, 9, dk(c, .5)); ellipse(s[0], s[1], 8, 8, c); ellipse(s[0] - 1, s[1], 6.4, 6.6, '#d8d2c0');
      lit(() => ellipse(s[0], s[1], 6, 6, '#fbf6e4')); for (let i = 0; i < 12; i++) px(s[0] + Math.round(Math.sin(i * .5236) * 5), s[1] - Math.round(Math.cos(i * .5236) * 5), C(i % 3 ? '#a8a290' : '#3a3440'));
      const h = (p.hour === undefined ? 10 : p.hour) * .5236; for (let k = 0; k <= 3; k++) px(s[0] + Math.round(Math.sin(h) * k), s[1] - Math.round(Math.cos(h) * k), C('#2a2433')); for (let k = 0; k <= 5; k++) px(s[0] + Math.round(Math.sin(1.05) * k), s[1] - Math.round(Math.cos(1.05) * k), C('#2a2433'));
      for (let i = -2; i <= 2; i++) px(s[0] + i, s[1] - 10 - (Math.abs(i) < 2 ? 1 : 0), C(winter() ? SNOW : c)); px(s[0], s[1] - 12, C(lt(c, .3))); px(s[0], s[1] - 13, C('#e8c85a'));
      for (let i = -3; i <= 3; i++) px(s[0] + i, s[1] + 10, C(c));
    },
  },
  {
    id: 'prop.street.drinkingfountain', kind: 'prop', tags: ['street', 'park', 'fountain', 'water', 'drinking'], solid: true, size: [.5, .5, 1.1], use: { x: .25, y: .8 }, variants: [{}, { c: '#2f4f45' }, { c: '#8a959e', bowl: '#c8ccd4' }],
    draw(p) {
      const c = p.c || STONE;
      cyl(.25, .25, 0, .2, .08, dk(c, .1)); cyl(.25, .25, .08, .12, .72, c); cyl(.25, .25, .8, .21, .1, p.bowl || lt(c, .08), { t: winter() ? SNOW : '#8fc8dc', t2: winter() ? SNOW2 : '#a8d8e8' });
      const s = P(.25, .25, .9); px(s[0] + 3, s[1] - 1, C('#c8ccd4')); px(s[0] + 3, s[1] - 2, C('#c8ccd4')); px(s[0] + 2, s[1] - 3, C('#e8ecf0'));
      if (!winter()) { px(s[0] + 1, s[1] - 3, C('#e8f6fb')); px(s[0], s[1] - 2, C('#e8f6fb')); px(s[0] - 1, s[1] - 1, C('#c8e8f4')); } else { px(s[0] + 2, s[1] - 2, C('#c8e8f4')); px(s[0] + 2, s[1] - 1, C('#c8e8f4')); }
    },
  },
  {
    id: 'prop.street.atm', kind: 'prop', tags: ['street', 'atm', 'bank', 'downtown'], solid: true, size: [1, .5, 2.1], use: { x: .5, y: .9 }, light: { x: .5, y: .8, z: 0, r: 2 },
    variants: [{}, { c: '#2f6f5f', name: 'CASH' }, { c: '#7a2a5a', name: 'BANK' }],
    draw(p) {
      const c = p.c || '#2f5fa8';
      box(.05, .05, 0, .9, .4, 1.75, '#dcd8cc'); box(.05, .05, 1.75, .9, .4, .3, c, { t: winter() ? SNOW : lt(c, .1) }); signY(p.name || 'ATM', .1, .9, .455, 1.8, 2.0, c, '#ffffff', { lit: true, frame: false });
      qy(.12, .88, .45, .95, 1.65, '#3a3f4a'); screenY(.22, .78, .455, 1.2, 1.58, '#5ad0c0', '#7fe0d0'); const s = P(.3, .455, 1.5); for (let i = 0; i < 3; i++) lit(() => { px(s[0] + i * 2, s[1] + i + 2, C('#ffffff')); });
      qy(.25, .6, .455, 1.0, 1.12, '#8a8f9a'); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const q = P(.28 + i * .1, .455, 1.1 - j * .06); px(q[0], q[1], C('#e8e2d4')); } qy(.66, .8, .455, 1.02, 1.06, '#2a2433'); lit(() => { const q = P(.72, .455, 1.12); px(q[0], q[1], C('#6af08a')); });
      qy(.12, .88, .45, .86, .92, c); qy(.3, .7, .455, .5, .6, '#2a2433');
    },
  },
  {
    id: 'prop.street.vending', kind: 'prop', tags: ['street', 'vending', 'shop', 'station', 'lit'], solid: true, size: p => [p.n === 2 ? 2 : 1, 1, 2], use: { x: .5, y: 1.4 }, light: { x: .5, y: 1.2, z: 0, r: 2.2 },
    variants: [{ seed: 1 }, { seed: 2, c: '#2f5fa8', kind: 'snack' }, { seed: 3, c: '#e8e2d4', kind: 'drink' }, { seed: 4, n: 2 }, { seed: 5, c: '#3fa890', kind: 'ticket', name: 'TICKETS' }],
    draw(p) {
      const one = (x, c, kind, seed, name) => {
        const R = rng(seed * 7 + 2);
        box(x + .08, .12, 0, .84, .76, 1.9, c, { t: winter() ? SNOW : lt(c, .15) });
        if (kind === 'ticket') { signY(name || 'TICKETS', x + .14, x + .86, .885, 1.5, 1.75, '#f4f0e0', dk(c, .3), { lit: true }); screenY(x + .2, x + .62, .885, .95, 1.38, '#5ad0c0', '#7fe0d0'); qy(x + .68, x + .82, .885, 1.0, 1.3, '#8a8f9a'); qy(x + .2, x + .8, .885, .5, .7, '#2a2433'); return; }
        lit(() => { qy(x + .14, x + .68, .885, .72, 1.76, '#eaf6f4'); for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) { const q = P(x + .19 + i * .125, .885, 1.66 - r * .25), cc = kind === 'snack' ? ['#e8b63a', '#d8342c', '#4fa850', '#b06ae0', '#f08a1c'][Math.floor(R() * 5)] : ['#d8342c', '#3b7bd8', '#4fa850', '#f08a1c', '#3a3440'][Math.floor(R() * 5)]; px(q[0], q[1], C(lt(cc, .3))); px(q[0], q[1] + 1, C(cc)); px(q[0], q[1] + 2, C(cc)); if (kind === 'snack') { px(q[0] + 1, q[1] + 1, C(dk(cc, .15))); px(q[0] + 1, q[1] + 2, C(dk(cc, .15))); } } });
        for (let r = 1; r < 4; r++) lw([x + .14, .885, 1.76 - r * .25 - .02], [x + .68, .885, 1.76 - r * .25 - .02], '#8a959e');
        lw([x + .14, .885, .72], [x + .68, .885, .72], dk(c, .5)); lw([x + .14, .885, 1.76], [x + .68, .885, 1.76], dk(c, .5)); lw([x + .14, .885, .72], [x + .14, .885, 1.76], dk(c, .5)); lw([x + .68, .885, .72], [x + .68, .885, 1.76], dk(c, .5));
        qy(x + .73, x + .86, .885, 1.2, 1.6, '#3a3f4a'); lit(() => { const q = P(x + .77, .885, 1.55); px(q[0], q[1], C('#6af08a')); px(q[0] + 2, q[1] + 3, C('#ff6a5a')); }); qy(x + .2, x + .62, .885, .3, .52, '#2a2433'); qy(x + .14, x + .86, .885, .08, .2, dk(c, .25));
        qx(x + .925, .2, .8, .5, 1.6, dk(c, .45)); qx(x + .925, .2, .8, 1.0, 1.25, kind === 'snack' ? '#e8b63a' : '#ffffff');
      };
      one(0, p.c || '#c8302a', p.kind || 'drink', p.seed || 1, p.name); if (p.n === 2) one(1, p.c2 || '#2f5fa8', 'snack', (p.seed || 1) + 5);
    },
  },
  {
    id: 'prop.street.bikeshare', kind: 'prop', tags: ['street', 'bike', 'bikeshare', 'transit', 'dock'], solid: true, size: p => [p.n || 4, 2, 1.2], vb: p => [-.2, -.2, 0, (p.n || 4) + .2, 2.2, 2.3], use: { x: .5, y: 2.3 },
    variants: [{ n: 4, bikes: [1, 1, 0, 1] }, { n: 6, bikes: [1, 0, 1, 1, 1, 0], c: '#3b7bd8' }, { n: 3, bikes: [0, 1, 1], c: '#e8822a' }],
    draw(p) {
      const n = p.n || 4, c = p.c || '#4fa850', bikes = p.bikes || [];
      box(.9, .15, 0, n - .95, .3, .08, '#8a8f9a', { t: winter() ? SNOW : '#a8acb4' });
      // terminal with a small solar panel
      box(.15, .1, 0, .5, .4, 1.7, '#dcd8cc'); box(.15, .1, 1.7, .5, .4, .2, c, { t: winter() ? SNOW : lt(c, .1) }); screenY(.22, .58, .505, 1.2, 1.55, '#5ad0c0', '#7fe0d0'); stampY(['.##.', '#..#', '#..#', '.##.'], .28, .505, 1.05, c); stampY(['.##.', '#..#', '#..#', '.##.'], .42, .505, 1.05, c); pole(.4, .3, 1.9, 2.1, '#56636b', 1, false); fq([[.1, .1, 2.1], [.7, .1, 2.1], [.7, .5, 2.0], [.1, .5, 2.0]], '#2a3f6a', '#3a5a8a');
      for (let i = 1; i < n; i++) {
        const x = i + .45; box(x - .08, .2, .08, .16, .2, .7, '#a8acb4'); qy(x - .08, x + .08, .4, .55, .75, c); lit(() => { const q = P(x, .4, .7); px(q[0], q[1], C(bikes[i - 1] ? '#6af08a' : '#ff6a5a')); });
        if (bikes[i - 1]) { // bike parked nose-in (along +y): drawn with a helper rotated by hand
          const y0 = .45, r = .3; ring(x, y0 + .3, r, 4, '#2a2f3a', 4); ring(x, y0 + 1.2, r, 4, '#2a2f3a', 4);
          const A = [x, y0 + .3, r], B = [x, y0 + 1.2, r], S = [x, y0 + .95, .78], H = [x, y0 + .45, .85], K = [x, y0 + .8, r];
          lw(B, S, c); lw(S, H, c); lw(K, H, c); lw(S, K, c); lw(B, K, c); lw(H, A, dk(c, .2)); lw(H, [x, y0 + .5, 1.02], '#2a2f3a'); const s = P(S[0], S[1], S[2]); px(s[0] - 1, s[1] - 1, C('#2a2433')); px(s[0], s[1] - 1, C('#2a2433')); px(s[0] + 1, s[1] - 2, C(winter() ? SNOW : '#2a2433')); box(x - .12, y0 + .3, .8, .24, .2, .16, '#56636b', { ol: false });
        }
      }
    },
  },
  {
    id: 'prop.street.trash', kind: 'prop', tags: ['street', 'alley', 'trash', 'clutter', 'boxes'], solid: true, size: p => [p.w || 1, 1, .8], vb: p => [-.2, -.2, 0, (p.w || 1) + .2, 1.2, 1.6],
    variants: [{ kind: 'bags', seed: 1 }, { kind: 'boxes', seed: 2 }, { kind: 'pallet', seed: 3, w: 1.5 }, { kind: 'mixed', seed: 4, w: 2, cat: true }, { kind: 'dumpster', w: 2, seed: 5 }, { kind: 'boxes', seed: 6, w: 1.5, cat: '#e8822a' }],
    draw(p) {
      const k = p.kind || 'bags', w = p.w || 1, R = rng((p.seed || 1) * 3);
      const bag = (x, y, z, r, c) => { ball(x, y, z + r * .8, r, c, { squash: .8 }); const s = P(x, y, z + r * 1.8); px(s[0], s[1], C(dk(c, .5))); px(s[0] + 1, s[1] - 1, C(lt(c, .3))); px(s[0] - 2, s[1] + 3, C(lt(c, .35))); };
      const cbox = (x, y, z, a, b, h) => { const c = '#c9a268'; box(x, y, z, a, b, h, c, { t: winter() ? SNOW : lt(c, .1) }); lw([x + a / 2, y, z + h], [x + a / 2, y + b, z + h], dk(c, .35)); qy(x + a * .25, x + a * .75, y + b, z + h * .55, z + h * .8, '#e8e2d4'); };
      if (k === 'bags' || k === 'mixed') { bag(.3, .35, 0, .26, '#3a3440'); bag(.68, .5, 0, .28, '#2f3942'); bag(.42, .72, 0, .22, k === 'mixed' ? '#e8e2d4' : '#3a3f4a'); }
      if (k === 'boxes') { cbox(.05, .1, 0, .6, .55, .5); cbox(w - .5, .35, 0, .45, .45, .35); cbox(.12, .16, .5, .42, .4, .32); if (p.cat) cat(.3, .4, .82, typeof p.cat === 'string' ? p.cat : '#3a3440'); }
      if (k === 'pallet') { for (const y of [.1, .45, .8]) box(.05, y, 0, w - .1, .1, .08, '#a8824a', { ol: false }); box(.05, .08, .08, w - .1, .84, .05, '#c9a268', { t: (x, y) => Math.floor(y * 8) % 2 ? '#c9a268' : dk('#c9a268', .3) }); crate(.15, .2, .13, .5, .5, .4, '#b8925a'); crate(.75, .3, .13, .5, .5, .4, '#c9a268'); crate(.4, .28, .53, .5, .45, .35, '#d8b070'); }
      if (k === 'mixed') { cbox(1.1, .2, 0, .6, .55, .5); crate(1.2, .7, 0, .4, .28, .3, '#b8925a'); if (p.cat) cat(1.35, .45, .5, typeof p.cat === 'string' ? p.cat : '#3a3440'); const s = P(1.0, .9, 0); px(s[0], s[1], C('#8a959e')); px(s[0] + 1, s[1], C('#c8ccd4')); px(s[0] - 4, s[1] + 1, C('#d8a23a')); }
      if (k === 'dumpster') { const c = p.c || '#2f6f5f'; box(.1, .1, .1, w - .2, .8, .9, c, { l: PAT.planks(dk(c, .18), 6), r: PAT.planks(dk(c, .36), 6) }); fq([[.05, .05, 1.2], [w - .05, .05, 1.2], [w - .05, .95, 1.0], [.05, .95, 1.0]], winter() ? SNOW : dk(c, .3)); qy(.05, w - .05, .95, .94, 1.0, dk(c, .45)); lw([.05, .95, 1.0], [w - .05, .95, 1.0], lt(c, .3)); box(.2, .9, 0, .14, .1, .12, '#2a2f3a', { ol: false }); box(w - .34, .9, 0, .14, .1, .12, '#2a2f3a', { ol: false }); textY('MB', .7, .905, .75, lt(c, .5)); bag(w - .1, 1.0, 0, .2, '#3a3440'); }
    },
  },
  {
    id: 'prop.street.utilitybox', kind: 'prop', tags: ['street', 'utility', 'graffiti', 'alley', 'arts'], solid: true, size: p => [p.w || 1, .5, 1.3], variants: [{ seed: 1 }, { seed: 2, c: '#7a8a6a' }, { seed: 3, w: 1.5, clean: true }, { seed: 4, c: '#c8ccd4', w: 1.5, mural: true }, { seed: 5, w: 2, c: '#56636b' }],
    draw(p) {
      const w = p.w || 1, c = p.c || '#8a959e', R = rng((p.seed || 1) * 13), G = ['#ff5a8a', '#5ad0f0', '#ffd23a', '#8af06a', '#b06ae0', '#ff8a3a'];
      box(0, .03, 0, w, .44, .08, '#6a6a70'); box(.03, .05, .08, w - .06, .4, 1.15, c, { t: winter() ? SNOW : lt(c, .15) });
      lw([w / 2, .45, .12], [w / 2, .45, 1.2], dk(c, .45)); for (let i = 0; i < 3; i++) { lw([.1, .45, 1.1 - i * .05], [.3, .45, 1.1 - i * .05], dk(c, .45)); lw([w - .3, .45, 1.1 - i * .05], [w - .1, .45, 1.1 - i * .05], dk(c, .45)); }
      const q = P(w / 2 - .05, .45, .7); px(q[0], q[1], C('#2a2433')); px(q[0], q[1] + 1, C('#2a2433')); stampY(['.#.', '###', '.#.', '##.'], w - .22, .45, .9, '#e8b63a');
      if (p.mural) { for (let i = 0; i < w * 16 - 4; i++) { const hh = .45 + Math.sin(i * .35) * .12 + .25; lw([.1 + i / 16, .455, .12], [.1 + i / 16, .455, hh], i % 9 < 5 ? '#5ad0f0' : '#3b9be0'); } ball(w * .7, .46, .95, .13, '#ffd23a', { ol: false }); return; }
      if (!p.clean) { const g1 = G[Math.floor(R() * 6)], g2 = G[Math.floor(R() * 6)], tg = ['MB', 'YO', 'ZAP', 'OK!', 'LUV', 'ACE'][Math.floor(R() * 6)]; const A = P(.12, .455, .75); for (let i = 0; i < Math.min(26, w * 16 - 8); i++) { const y = Math.round(Math.sin(i * .7) * 3 + (i >> 1)); px(A[0] + i, A[1] + y, C(g1)); px(A[0] + i, A[1] + y + 1, C(g1)); } textY(tg, .16 + R() * .1, .455, .62, g2); textY(tg, .16 + R() * .1 + 1 / 16, .455, .62, g2); const s = P(.1 + R() * (w - .4), .455, .3); rect(s[0], s[1], 4, 4, '#f4f0e0'); rect(s[0] + 1, s[1] + 1, 2, 2, G[Math.floor(R() * 6)]); textX('X', .5 + 1.0 * (w - .97), .42, .7, g1); }
    },
  },
  {
    id: 'prop.street.aframe', kind: 'prop', tags: ['street', 'sign', 'chalkboard', 'cafe', 'shop'], solid: true, size: [.5, .5, .9], vb: [-.3, -.2, 0, 1, .8, 1.1],
    variants: [{ text: 'OPEN' }, { text: 'CAFE', c: '#8a4b3a' }, { text: 'SALE', c: '#e8e2d4', board: '#2f5f4a' }, { text: 'SOUP', c: '#3b7bd8' }, { text: 'PIE!' }],
    draw(p) {
      const c = p.c || '#a8744a', b = p.board || '#2a3038', L = .8, x0 = -.15;
      fq([[x0, .12, 0], [x0 + L, .12, 0], [x0 + L, .28, .88], [x0, .28, .88]], dk(c, .4)); fq([[x0 + L, .12, 0], [x0 + L, .44, 0], [x0 + L, .28, .88]], dk(c, .55));
      fq([[x0, .44, 0], [x0 + L, .44, 0], [x0 + L, .28, .88], [x0, .28, .88]], c); fq([[x0 + .06, .425, .1], [x0 + L - .06, .425, .1], [x0 + L - .06, .295, .8], [x0 + .06, .295, .8]], b);
      lw([x0, .44, 0], [x0, .28, .88], dk(c, .6)); lw([x0 + L, .44, 0], [x0 + L, .28, .88], dk(c, .6)); lw([x0, .28, .88], [x0 + L, .28, .88], winter() ? SNOW : lt(c, .3));
      const t = String(p.text || 'OPEN').slice(0, 4), tx = x0 + (L - textW(t) / 16) / 2; textY(t, tx, .33, .66, '#f4f0e0'); lw([x0 + .16, .37, .42], [x0 + L - .16, .37, .42], '#ffd98a'); const s = P(x0 + .3, .4, .28); for (const q of [[0, 0], [1, 0], [2, 1], [5, 2], [6, 2], [7, 3]]) px(s[0] + q[0], s[1] + q[1], C('#ff8ab0'));
    },
  },
  {
    id: 'prop.street.postercolumn', kind: 'prop', tags: ['street', 'poster', 'column', 'arts', 'oldtown', 'advert'], solid: true, size: [1, 1, 3], vb: [-.2, -.2, 0, 1.2, 1.2, 3.4], variants: [{ seed: 1 }, { seed: 2, c: '#2f4f45' }, { seed: 3, c: '#7a2a2a' }],
    draw(p) {
      const c = p.c || '#3d4a54', R = rng((p.seed || 1) * 5), PC = ['#e8b63a', '#d8342c', '#3b7bd8', '#f4f0e0', '#4fa850', '#b06ae0', '#f08a1c', '#3fa890'];
      cyl(.5, .5, 0, .46, .2, c); cyl(.5, .5, .2, .4, 2.2, '#e4dcc8', { l: '#e4dcc8', r: '#c4bca8' });
      const s = P(.5, .5, .2);
      for (let row = 0; row < 2; row++) for (let i = 0; i < 3; i++) { const X = s[0] - 8 + i * 6, Y = s[1] - 31 + row * 16 + [3, 5, 3][i] - (row ? 0 : 2), pc = PC[Math.floor(R() * 8)], w = 5, h = 13; rect(X, Y, w, h, i === 2 ? dk(pc, .2) : pc); rect(X + 1, Y + 1, w - 2, 4, i === 2 ? dk(PC[Math.floor(R() * 8)], .2) : PC[Math.floor(R() * 8)]); for (let j = 0; j < 3; j++) { px(X + 1, Y + 7 + j * 2, C(dk(pc, .5))); px(X + 2, Y + 7 + j * 2, C(dk(pc, .5))); if (j < 2) px(X + 3, Y + 7 + j * 2, C(dk(pc, .5))); } }
      cyl(.5, .5, 2.4, .46, .12, c); const t = P(.5, .5, 2.52); for (let j = 0; j < 7; j++) { const hw = Math.round(9 * Math.cos(j / 7 * 1.45)); for (let i = -hw; i <= hw; i++) px(t[0] + i, t[1] - j - 1, C(winter() && j > 2 ? SNOW : i < -hw * .2 ? lt(c, .12) : dk(c, .12))); px(t[0] - hw - 1, t[1] - j - 1, C(dk(c, .7))); px(t[0] + hw + 1, t[1] - j - 1, C(dk(c, .7))); } px(t[0], t[1] - 8, C(c)); px(t[0], t[1] - 9, C(c)); px(t[0], t[1] - 10, C('#e8c85a'));
    },
  },
  {
    id: 'prop.street.banner', kind: 'prop', tags: ['street', 'banner', 'pole', 'festival', 'plaza'], solid: true, size: [.5, .5, 4.6], vb: [-.3, -.3, 0, 1.5, .8, 4.9],
    variants: [{}, { c: '#2f5fa8', text: 'BAY' }, { c: '#e8b63a', fg: '#7a2a2a', text: 'FEST' }, { c: '#2f6f5f', double: true }],
    draw(p) {
      const c = p.c || '#c8302a', fg = p.fg || '#fff8e0', pc = '#3d4a54';
      cyl(.25, .25, 0, .16, .3, pc); pole(.25, .25, .3, 4.4, pc, 2); ball(.25, .25, 4.48, .08, '#e8c85a');
      const ban = (x0, x1) => { rail([Math.min(x0, .25), .25, 4.1], [Math.max(x1, .25), .25, 4.1], pc, 1); rail([Math.min(x0, .25), .25, 1.9], [Math.max(x1, .25), .25, 1.9], pc, 1); qy(x0, x1, .25, 1.95, 4.05, c); qy(x0, x1, .25, 1.95, 2.15, dk(c, .2)); qy(x0, x1, .25, 3.85, 4.05, dk(c, .2)); stampY(LEAF, (x0 + x1) / 2 - 3.5 / 16, .25, 3.7, fg); const t = String(p.text || 'MAPLE').slice(0, 5); for (let i = 0; i < t.length; i++) textY(t[i], (x0 + x1) / 2 - 1.5 / 16, .25, 3.05 - i * .42 + .3, fg); };
      ban(.36, 1.1); if (p.double) ban(-.6, .14 - 0);
    },
  },
  {
    id: 'prop.street.flagpole', kind: 'prop', tags: ['street', 'flag', 'pole', 'plaza', 'civic', 'harbor'], solid: true, size: [.5, .5, 6], vb: [-.3, -1.6, 0, 1.9, .8, 6.4],
    variants: [{}, { flag: 'city' }, { flag: 'stripes' }, { flag: 'harbor' }],
    draw(p) {
      const f = p.flag || 'maple'; cyl(.25, .25, 0, .2, .2, STONE); pole(.25, .25, .2, 5.8, '#c8ccd4', 2); ball(.25, .25, 5.88, .09, '#e8c85a');
      const s = P(.25, .25, 5.7), W = 22, H = 13;
      for (let u = 2; u < W + 2; u++) { const wv = Math.round(Math.sin(u * .45) * 1.6 + u * .25); for (let v = 0; v < H; v++) { const k = (u - 2) / W; let c = '#f4f0e0'; if (f === 'maple') c = k < .25 || k > .75 ? '#d8342c' : '#fbf6ea'; else if (f === 'city') c = v < H / 2 ? '#2f5fa8' : '#e8b63a'; else if (f === 'stripes') c = (v / 3 | 0) % 2 ? '#f4f0e0' : '#3fa890'; else c = (k < .5) === (v < H / 2) ? '#2f5fa8' : '#f4f0e0'; if (Math.sin(u * .45 + 1.2) < -.5) c = dk(c, .14); px(s[0] + u, s[1] + wv + v, C(c)); } px(s[0] + u, s[1] + wv - 1, C('#3a3440')); px(s[0] + u, s[1] + wv + H, C('#3a3440')); }
      if (f === 'maple') { const m = [[0, -3], [0, -2], [-1, -2], [1, -2], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [-1, 1], [0, 1], [1, 1], [0, 2], [0, 3]]; for (const q of m) px(s[0] + 13 + q[0], s[1] + 4 + 6 + q[1], C('#d8342c')); }
      for (let v = -1; v <= H; v++) px(s[0] + W + 2, s[1] + Math.round(Math.sin((W + 2) * .45) * 1.6 + (W + 2) * .25) + v, C('#3a3440'));
    },
  },
  {
    id: 'prop.street.stringlights', kind: 'prop', tags: ['street', 'stringlights', 'festival', 'lit', 'cafe', 'market', 'segment'], solid: false, size: p => [p.len || 4, .5, 3.2], vb: p => [-.2, -.2, 0, (p.len || 4) + .2, .7, 3.5],
    light: { x: 2, y: .25, z: 0, r: 3.5 }, variants: [{ len: 4 }, { len: 6, bunting: true }, { len: 4, warm: true }, { len: 8, warm: true, bunting: true }],
    draw(p) {
      const L = p.len || 4, c = '#6b4a2f', cols = p.warm ? [WARM, WARM2, '#fffbe8'] : undefined;
      for (const x of [.25, L - .25]) { box(x - .15, .1, 0, .3, .3, .3, '#b9b4a8'); pole(x, .25, .3, 3.1, c, 2); snowTop(x - .15, x + .15, .1, .4, .3); }
      if (p.bunting) { const A = PW(.25, .25, 2.75), B = PW(L - .25, .25, 2.75), n = Math.round(L * 2.2), BC = ['#d8342c', '#e8b63a', '#3b7bd8', '#4fa850', '#f4f0e0']; for (let i = 0; i < n; i++) { const t = (i + .5) / n, X = Math.round(A[0] + (B[0] - A[0]) * t), Y = Math.round(A[1] + (B[1] - A[1]) * t + Math.sin(t * Math.PI) * 5); for (let j = 0; j < 4; j++) for (let k = -(3 - j) >> 1; k <= (3 - j) >> 1; k++) px(X + k, Y + j, C(BC[i % 5])); } for (let i = 0; i <= n * 4; i++) { const t = i / (n * 4); px(Math.round(A[0] + (B[0] - A[0]) * t), Math.round(A[1] + (B[1] - A[1]) * t + Math.sin(t * Math.PI) * 5) - 1, C('#3a3440')); } }
      stringLights([.25, .25, 3.05], [L - .25, .25, 3.05], .35, cols); stringLights([.25, .25, 3.05], [L - .25, .25, 3.05], .12, cols);
    },
  },
];
