// Park, playground, sports and garden props.
import { box, cyl, ball, cone, qz, qy, qx, lw, fq, px, C, PW, U, dk, lt, mix, rng, hash2, ellipse, glow, lit, signY, signX, textY, winY, winX, PAT, rect, textW, gable } from '../../engine/raster.js';
import { clumps, leafC, everC, limb, pole, shadow, scatter, snowTop, snowMound, blooms, tufts, bulb, stringLights, awning, parasol, octRoof, rowboat, bikeY, bike, crate, pumpkin, stampY, LEAF, rail, ring, disc, rock, winter, season, P, SNOW, SNOW2, IRON, WOOD, STONE, WARM, WARM2 } from './_lib.js';

const WATER = ['#5aa8d0', '#6ab8dc'], ICE = ['#cfe4ee', '#e2f0f6'];
const water = () => winter() ? ICE : WATER;
/** tiny bird, 4px */
function bird(x, y, z, c = '#8a6a55') { const s = P(x, y, z); px(s[0], s[1] - 1, C(c)); px(s[0] + 1, s[1] - 1, C(c)); px(s[0] + 1, s[1] - 2, C(lt(c, .2))); px(s[0] - 1, s[1] - 2, C(dk(c, .3))); px(s[0] + 2, s[1] - 2, C('#e8a23a')); }
const tube = (a, b, c, w = 2) => limb(a, b, c, w, w);


/* ---------- playground pieces that move with their rider (owner msg 218; sim/playground.js) ----------
 * The seesaw plank runs from x = .1 to x = 2.9 over a pivot at x = 1.5, z = .6; an end travels .32 up or down. seesawZ(tilt, x) = the height of the plank's top at x for tilt -2..2
 * (undefined = 2, the resting picture). The seats are at x = .4 and x = 2.6: a rider's seat height is seesawZ(tilt, seat x).
 * A swing seat hangs 1.83 below its bar; swingRise(sw) = how much it lifts when it is `sw` out along y. */
export const SEESAW_SEATS = [.4, 2.6];
export const seesawZ = (tilt, x) => .6 + .32 * ((tilt === undefined ? 2 : tilt) / 2) * (1 - 2 * (x - .1) / 2.8);
export const swingRise = sw => 1.83 - Math.sqrt(Math.max(0, 1.83 * 1.83 - sw * sw));
export default [
  {
    id: 'prop.park.fountain', kind: 'prop', tags: ['park', 'fountain', 'water', 'landmark', 'plaza'], solid: true, size: p => [p.w || 6, p.w || 6, 1], vb: p => [-.3, -.3, 0, (p.w || 6) + .3, (p.w || 6) + .3, (p.w || 6) * .62 + .4],
    light: { x: 3, y: 3, z: 0, r: 5.5 }, variants: [{ w: 6 }, { w: 4, c: '#c8b8a0' }, { w: 6, c: '#8a959e', tiers: 3 }],
    draw(p) {
      const W = p.w || 6, c = W / 2, k = W / 6, sc = p.c || '#b9b4a8', wt = water(), w = winter(), tiers = p.tiers || 2;
      cyl(c, c, 0, 2.9 * k, .12, dk(sc, .12)); cyl(c, c, .12, 2.7 * k, .42, sc, { l: dk(sc, .18), r: dk(sc, .36) }); /* cyl takes colours, not pattern functions (the patterns made every park fountain throw and vanish) */ cyl(c, c, .5, 2.75 * k, .08, lt(sc, .12), { t: w ? SNOW : lt(sc, .12), ol: false });
      cyl(c, c, .5, 2.45 * k, .04, wt[0], { t: wt[0], t2: wt[1], ol: false });
      // ripples + underwater lights
      const s0 = PW(c, c, .54); if (!w) for (const rr of [.9, 1.5, 2.1]) for (let a = 0; a < 40; a++) if ((a + Math.round(rr * 10)) % 5 < 3) px(Math.round(s0[0] + Math.cos(a / 40 * 6.283) * rr * k * U * 1.414), Math.round(s0[1] + Math.sin(a / 40 * 6.283) * rr * k * U * .707), C('#c8e8f4'));
      glow(() => { for (let a = 0; a < 8; a++) { const q = P(c + Math.cos(a * .785) * 2.1 * k, c + Math.sin(a * .785) * 2.1 * k, .54); ellipse(q[0], q[1], 3, 1.5, '#aef0ff'); px(q[0], q[1], C('#ffffff')); } });
      let z = .5, r = 1.25 * k;
      for (let t = 0; t < tiers; t++) {
        const ph = (t ? 1.0 : 1.3) * k; cyl(c, c, z, (.34 - t * .08) * k, ph, sc); cyl(c, c, z + ph * .45, (.42 - t * .08) * k, .08, lt(sc, .1), { ol: false }); z += ph;
        // falling water curtain from this bowl
        if (!w) { const q = PW(c, c, z + .12), fall = Math.round((ph + (t ? .1 : -.05)) * U); for (let a = -1; a <= 1; a += .08) { const X = Math.round(q[0] + a * r * U * 1.38), Y0 = Math.round(q[1] + Math.sqrt(1 - a * a) * r * U * .69); if ((X & 1) === 0) for (let j = 1; j < fall; j++) px(X, Y0 + j, C((j + X) % 5 < 2 ? '#e8f6fb' : (j + X) % 5 < 4 ? '#a8d8ec' : '#7fc0dc')); } }
        cyl(c, c, z, r, .16, lt(sc, .05), { t: wt[0], t2: wt[1] }); const q = PW(c, c, z + .16); ellipse(q[0], q[1], r * U * 1.414 - 2, r * U * .707 - 1, wt[0], wt[1]); if (w) ellipse(q[0], q[1] - 1, r * U * 1.1, r * U * .5, SNOW);
        z += .16; r *= .55;
      }
      cyl(c, c, z, .12 * k, .4 * k, sc); ball(c, c, z + .5 * k, .16 * k, lt(sc, .15)); z += .66 * k;
      if (!w) { // spray: a centre jet and eight arcs
        const top = P(c, c, z); for (let j = 0; j < 9 * k; j++) px(top[0] + ((j >> 1) & 1 ? 0 : (j & 1)), top[1] - j, C(j % 3 ? '#e8f6fb' : '#ffffff'));
        for (let a = 0; a < 8; a++) { const an = a * .785 + .39; for (let i = 0; i <= 12; i++) { const t = i / 12, q = P(c + Math.cos(an) * .75 * k * t, c + Math.sin(an) * .75 * k * t, z + .4 * k + k * (1.1 * t - 2.4 * t * t)); if (i % 3 !== 2) px(q[0], q[1], C(i % 2 ? '#ffffff' : '#c8e8f4')); } }
      } else { const top = P(c, c, z); px(top[0], top[1] - 1, C(SNOW)); px(top[0] - 1, top[1], C(SNOW)); px(top[0] + 1, top[1], C(SNOW)); }
    },
  },
  {
    id: 'prop.park.dock', kind: 'prop', tags: ['park', 'dock', 'pier', 'pond', 'water', 'harbor', 'walkable'], solid: false, size: p => [2, p.len || 4, .4], vb: p => [-.3, -.3, -.5, 3.4, (p.len || 4) + .3, 1.6],
    variants: [{ len: 4 }, { len: 6, boat: '#d8342c' }, { len: 4, lamp: true, boat: '#3b7bd8' }],
    draw(p) {
      // walkable deck at z = 0.4 running along +y out over the water (posts go down to z = -0.5)
      const L = p.len || 4, c = '#b08a5a';
      for (let y = .3; y < L; y += 1.7) for (const x of [.12, 1.88]) pole(x, y, -.5, .4, dk(c, .3), 2, false);
      box(0, 0, .28, 2, L, .12, c, { t: winter() ? SNOW : (x, y) => (Math.floor(y * 4) % 2 ? c : dk(c, .12)), l: dk(c, .3), r: dk(c, .45) });
      if (winter()) qz(.6, 1.4, 0, L, .405, lt(c, .1), 'glass');
      for (let y = .3; y < L; y += 1.7) for (const x of [.12, 1.88]) { pole(x, y, .4, 1.0, dk(c, .15), 2, true); const s = P(x, y, 1.0); px(s[0], s[1] - 2, C(winter() ? SNOW : lt(c, .3))); px(s[0] - 1, s[1] - 2, C(winter() ? SNOW : lt(c, .3))); }
      for (let y = .3; y + 1.7 < L; y += 1.7) for (const x of [.12, 1.88]) { const A = PW(x, y, .85), B = PW(x, y + 1.7, .85), n = Math.round(A[0] - B[0]); for (let i = 1; i < n; i++) px(Math.round(A[0]) - i, Math.round(A[1] + (B[1] - A[1]) * i / n + Math.sin(i / n * Math.PI) * 3), C(i & 1 ? '#e8dcc0' : '#c9b88a')); }
      const q = P(1.88, L - .4, .7); ring(1.88, L - .35, .68, 3, '#f4f0e0'); px(q[0] - 3, q[1], C('#d8342c')); px(q[0] + 3, q[1], C('#d8342c')); px(q[0], q[1] - 3, C('#d8342c')); px(q[0], q[1] + 3, C('#d8342c'));
      if (p.lamp) { pole(.12, L - .2, .4, 2.2, '#3a3440', 1, false); bulb(.12, L - .2, 2.3, 2); }
      if (p.boat) rowboat(2.15, L - 2.9, -.3, 2.4, typeof p.boat === 'string' ? p.boat : '#d8342c'); /* QA13: the city places it with boat: true (a colour was expected; it threw and the dock was cut off) */
    },
  },
  {
    id: 'prop.park.gazebo', kind: 'prop', tags: ['park', 'gazebo', 'bandstand', 'landmark', 'shelter', 'lit'], solid: false, size: [5, 5, 4.4], vb: [-.6, -.6, 0, 5.6, 5.6, 5],
    light: { x: 2.5, y: 2.5, z: 0, r: 5 }, seats: [{ x: 1.2, y: 2.5, z: .9, dir: 0 }, { x: 2.5, y: 1.2, z: .9, dir: 1 }],
    variants: [{}, { roof: ['#8a4b3a', '#7a4132'], c: '#e8dcc0' }, { roof: ['#3a4a5a', '#44566a'], c: '#3d4a54', floor: '#b9b4a8' }],
    draw(p) {
      // octagonal bandstand. Raised walkable floor at z = 0.4 (step up on the +y and +x sides); the 8 posts are the only solid parts; roof is overhead.
      const c = p.c || '#f4f0e6', roof = p.roof || ['#3f7a6a', '#35695b'], fl = p.floor || '#c9a268', cx = 2.5, cy = 2.5, R = 2.2, ps = [];
      cyl(cx, cy, 0, 2.45, .4, '#b9b4a8', { t: fl, l: '#a8a69c', r: '#8a887e' }); /* QA13: cyl takes colours, not PAT functions (it threw: every gazebo drew only its base) */ const f = PW(cx, cy, .4); ellipse(f[0], f[1], 2.3 * U * 1.414, 2.3 * U * .707, fl, dk(fl, .1));
      box(2.0, 4.7, 0, 1, .4, .2, '#b9b4a8'); box(4.7, 2.0, 0, .4, 1, .2, '#b9b4a8');
      for (let i = 0; i < 8; i++) { const a = i * .7854 + .3927; ps.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R, a]); }
      ps.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
      const railTo = (a, b) => { const open = (a[2] < 1.6 && b[2] < 1.6 && a[2] > 1.0) || (b[2] < .5 && a[2] > 5.8); };
      for (let i = 0; i < 8; i++) {
        const a0 = i * .7854 + .3927, a1 = a0 + .7854, A = [cx + Math.cos(a0) * R, cy + Math.sin(a0) * R], B = [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R], am = a0 + .3927, front = Math.cos(am) + Math.sin(am) > 0, gap = Math.abs(am - 1.5708) < .1 || Math.abs(am) < .1 || Math.abs(am - 6.283) < .1;
        if (!front) { rail([A[0], A[1], 1.2], [B[0], B[1], 1.2], dk(c, .1), 2); for (let t = .1; t < 1; t += .1) lw([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, .45], [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, 1.2], dk(c, .18)); box(cx + Math.cos(am) * 1.75 - .5, cy + Math.sin(am) * 1.75 - .2, .4, 1, .4, .45, '#a8744a', { ol: true, t: '#b8845a' }); }
      }
      for (const q of ps.slice(0, 4)) { pole(q[0], q[1], .4, 3.0, c, 3, true); }
      for (let i = 0; i < 8; i++) {
        const a0 = i * .7854 + .3927, a1 = a0 + .7854, A = [cx + Math.cos(a0) * R, cy + Math.sin(a0) * R], B = [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R], am = a0 + .3927, front = Math.cos(am) + Math.sin(am) > 0, gap = Math.abs(am - 1.5708) < .1 || am > 6.2 || am < .1;
        if (front && !gap) { for (let t = .1; t < 1; t += .1) lw([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, .45], [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, 1.2], c); rail([A[0], A[1], 1.2], [B[0], B[1], 1.2], c, 2); rail([A[0], A[1], .5], [B[0], B[1], .5], dk(c, .15), 1); }
      }
      for (const q of ps.slice(4)) pole(q[0], q[1], .4, 3.0, c, 3, true);
      octRoof(cx, cy, 3.0, 2.85, 1.15, roof[0], roof[1], { eave: .16 });
      cyl(cx, cy, 4.1, .3, .25, c); octRoof(cx, cy, 4.35, .5, .4, roof[0], roof[1], { eave: .05 }); const t = P(cx, cy, 4.75); px(t[0], t[1] - 1, C('#e8c85a')); px(t[0], t[1] - 2, C('#e8c85a')); px(t[0], t[1] - 3, C('#fff4c8'));
      for (let i = 0; i < 8; i++) { const a0 = i * .7854 + .3927, a1 = a0 + .7854, am = a0 + .3927; if (Math.cos(am) + Math.sin(am) > -.3) stringLights([cx + Math.cos(a0) * 2.85, cy + Math.sin(a0) * 2.85, 2.82], [cx + Math.cos(a1) * 2.85, cy + Math.sin(a1) * 2.85, 2.82], .1, [WARM, WARM2, '#fffbe8']); }
      glow(() => ellipse(f[0], f[1], 1.5 * U * 1.414, 1.5 * U * .707, WARM2, 'glass'));
    },
  },
  /* ================= playground ================= */
  {
    id: 'prop.park.play.slide', kind: 'prop', tags: ['park', 'playground', 'slide', 'kids'], solid: true, size: [4, 1, 2.4], vb: [-.2, -.2, 0, 4.2, 1.2, 2.9], use: { x: -.4, y: .5 },
    variants: [{}, { c: '#d8342c', c2: '#3b7bd8' }, { c: '#3fa890', c2: '#e85a90', roof: true }],
    draw(p) {
      const c = p.c || '#ffd23a', c2 = p.c2 || '#d8342c';
      for (const [x, y] of [[.1, .1], [1.1, .1]]) pole(x, y, 0, 2.3, c2, 2, false);
      for (let z = .25; z < 1.4; z += .25) lw([.0, .2, z], [.0, .8, z], '#8a8f9a'); lw([0, .2, 0], [0, .2, 1.45], '#a8acb4'); lw([0, .8, 0], [0, .8, 1.45], '#a8acb4');
      box(.1, .1, 1.35, 1, .8, .1, '#a8744a', { t: winter() ? SNOW : '#b8845a' });
      fq([[1.1, .12, 1.45], [1.1, .88, 1.45], [3.5, .88, .25], [3.5, .12, .25]], c, lt(c, .12)); fq([[3.5, .12, .25], [3.5, .88, .25], [4, .88, .22], [4, .12, .22]], lt(c, .15));
      fq([[1.1, .88, 1.45], [3.5, .88, .25], [4, .88, .22], [4, .88, .08], [3.5, .88, .1], [1.1, .88, 1.25]], dk(c, .3));
      lw([1.1, .88, 1.62], [3.5, .88, .42], c2); lw([1.1, .88, 1.63], [3.5, .88, .43], c2); lw([3.5, .88, .42], [4, .88, .3], c2); lw([1.1, .12, 1.62], [3.5, .12, .42], dk(c2, .25));
      if (winter()) fq([[1.5, .3, 1.26], [1.5, .7, 1.26], [3.4, .7, .31], [3.4, .3, .31]], SNOW, 'glass');
      pole(3.0, .88, 0, .4, '#8a8f9a', 1, false); pole(2.2, .88, 0, .78, '#8a8f9a', 1, false);
      for (const [x, y] of [[.1, .9], [1.1, .9]]) pole(x, y, 0, 2.3, c2, 2, false); rail([.1, .9, 1.95], [1.1, .9, 1.95], c2, 2); rail([.1, .9, 1.7], [1.1, .9, 1.7], c2, 1);
      if (p.roof) octRoof(.6, .5, 2.3, .85, .5, c2, c, { n: 4, eave: .06 });
    },
  },
  {
    id: 'prop.park.play.swings', kind: 'prop', tags: ['park', 'playground', 'swings', 'kids', 'seat'], solid: true, size: [4, 2, 2.6], vb: [-.3, -.3, 0, 4.3, 2.3, 2.9],
    seats: [{ x: 1.3, y: 1, z: .55, dir: 1 }, { x: 2.7, y: 1, z: .55, dir: 1 }], variants: [{}, { c: '#3b7bd8', seat: '#ffd23a' }, { c: '#d8342c', seat: '#3a3440', tyre: true }],
    draw(p) {
      const c = p.c || '#3fa890', sc = p.seat || '#d8342c';
      for (const x of [.15, 3.85]) tube([x, .1, 0], [x, 1, 2.5], dk(c, .2), 2);
      rail([.15, 1, 2.5], [3.85, 1, 2.5], c, 3);
      [1.3, 2.7].forEach((x, i) => {
        /* p.s0 / p.s1: where this seat is in its swing (owner msg 218; sim/playground.js). Without them the two seats hang as they always did. */
        const sv = i ? p.s1 : p.s0, sw = sv === undefined ? (i ? .12 : -.1) : sv, up = swingRise(sv || 0); lw([x - .25, 1, 2.45], [x - .25, 1 + sw, .62 + up], '#8a8f9a'); lw([x + .25, 1, 2.45], [x + .25, 1 + sw, .62 + up], '#c8ccd4');
        if (p.tyre && i) { ring(x, 1 + sw, .45 + up, 5, '#2a2433', 3); ring(x, 1 + sw, .45 + up, 4, '#3a3440', 2); } else box(x - .3, 1 + sw - .14, .55 + up, .6, .28, .06, sc, { t: winter() ? SNOW : lt(sc, .15) });
      });
      for (const x of [.15, 3.85]) tube([x, 1.9, 0], [x, 1, 2.5], c, 2);
    },
  },
  {
    id: 'prop.park.play.climber', kind: 'prop', tags: ['park', 'playground', 'climbing', 'kids'], solid: true, size: [3, 3, 2.6], vb: [-.2, -.2, 0, 3.2, 3.2, 3.2],
    variants: [{}, { kind: 'dome' }, { kind: 'tower', c: '#d8342c' }],
    draw(p) {
      const k = p.kind || 'cube', cols = ['#d8342c', '#ffd23a', '#3b7bd8', '#3fa890'];
      if (k === 'dome') { const N = 8, c = 1.5, ring_ = (z, r) => { const a = []; for (let i = 0; i < N; i++) a.push([c + Math.cos(i * .785 + .39) * r, c + Math.sin(i * .785 + .39) * r, z]); return a; }, r0 = ring_(0, 1.4), r1 = ring_(.9, 1.15), r2 = ring_(1.5, .6), top = [c, c, 1.75];
        const seg = (a, b, col) => tube(a, b, col, 1); const ord = [...Array(N).keys()].sort((a, b) => (r0[a][0] + r0[a][1]) - (r0[b][0] + r0[b][1]));
        for (const i of ord) { const j = (i + 1) % N, col = cols[i % 4]; seg(r0[i], r1[i], col); seg(r1[i], r2[i], col); seg(r2[i], top, col); seg(r1[i], r1[j], lt(col, .1)); seg(r2[i], r2[j], lt(col, .1)); seg(r0[i], r1[j], dk(col, .15)); seg(r1[i], r2[j], dk(col, .15)); } return; }
      if (k === 'tower') { const c = p.c || '#d8342c';
        for (const [x, y] of [[.6, .6], [2.4, .6]]) pole(x, y, 0, 2.5, '#a8744a', 2, true);
        box(.6, .6, 1.3, 1.8, 1.8, .1, '#b8845a', { t: winter() ? SNOW : PAT.fboards('#b8845a', .3) });
        qy(.6, 2.4, 2.4, 0, 1.3, (u, v) => (u % 5 === 0 || v % 5 === 0) ? '#e8dcc0' : null); // climbing net on the front
        for (const [x, y] of [[.6, 2.4], [2.4, 2.4]]) pole(x, y, 0, 2.5, '#a8744a', 2, true);
        rail([.6, 2.4, 1.9], [2.4, 2.4, 1.9], c, 2); rail([2.4, .6, 1.9], [2.4, 2.4, 1.9], dk(c, .2), 2); qx(2.4, .7, 2.3, 1.4, 1.85, (u, v) => u % 4 === 0 ? dk(c, .2) : null);
        octRoof(1.5, 1.5, 2.5, 1.45, .7, c, lt(c, .15), { n: 4 }); const t = P(1.5, 1.5, 3.2); for (let i = 0; i < 4; i++) { px(t[0], t[1] - i, C('#3a3440')); if (i > 1) { px(t[0] + 1, t[1] - i, C('#ffd23a')); px(t[0] + 2, t[1] - i, C('#ffd23a')); } }
        tube([2.4, 1.5, 1.4], [3.0, 1.5, 0], '#8a8f9a', 2); return; }
      // cube jungle gym: 3x3 uprights, two levels of rungs
      const g = [.2, 1.5, 2.8];
      for (let yi = 0; yi < 3; yi++) { for (let xi = 0; xi < 3; xi++) { const x = g[xi], y = g[yi], col = cols[(xi + yi) % 4];
        if (xi < 2) for (const z of [1, 2]) tube([x, y, z], [g[xi + 1], y, z], cols[(yi + z) % 4], 1);
        if (yi > 0) for (const z of [1, 2]) tube([x, g[yi - 1], z], [x, y, z], cols[(xi + z + 1) % 4], 1);
        pole(x, y, 0, xi === 1 && yi === 1 ? 2.5 : 2, col, 2, false); } }
      if (winter()) for (const x of g) { const s = P(x, 2.8, 2); px(s[0], s[1] - 1, C(SNOW)); px(s[0] - 1, s[1] - 1, C(SNOW)); }
    },
  },
  {
    id: 'prop.park.play.sandbox', kind: 'prop', tags: ['park', 'playground', 'sandbox', 'kids'], solid: false, size: p => [p.w || 3, p.w || 3, .3], variants: [{ seed: 1 }, { seed: 2, w: 2 }, { seed: 3, w: 4, c: '#3b7bd8' }],
    draw(p) {
      const W = p.w || 3, c = p.c || '#b8845a', w = winter(), sand = w ? SNOW : '#ecd9a0';
      box(0, 0, 0, W, W, .25, c, { t: lt(c, .15) }); qz(.2, W - .2, .2, W - .2, .26, sand, w ? SNOW2 : '#e0cc90');
      const R = rng(p.seed || 1); for (let i = 0; i < W * 4; i++) { const s = P(.4 + R() * (W - .8), .4 + R() * (W - .8), .26); px(s[0], s[1], C(w ? SNOW2 : '#d0bc80')); px(s[0] + 1, s[1], C(w ? '#ffffff' : '#f6e8b8')); }
      if (!w) { box(W * .3, W * .3, .26, .4, .4, .2, '#e0cc90', { ol: false }); box(W * .3 + .1, W * .3 + .1, .46, .2, .2, .15, '#e0cc90', { ol: false }); const f = P(W * .3 + .2, W * .3 + .2, .62); px(f[0], f[1] - 1, C('#6b4a2f')); px(f[0], f[1] - 2, C('#6b4a2f')); px(f[0] + 1, f[1] - 2, C('#d8342c')); }
      cyl(W * .7, W * .6, .26, .12, .18, '#d8342c', { ol: false }); const s = P(W * .55, W * .78, .28); for (let i = 0; i < 5; i++) px(s[0] + i, s[1] - (i >> 1), C(i > 2 ? '#3b7bd8' : '#ffd23a'));
      if (w) { const s2 = P(W * .7, W * .6, .46); px(s2[0], s2[1], C(SNOW)); px(s2[0] - 1, s2[1], C(SNOW)); }
    },
  },
  {
    id: 'prop.park.play.seesaw', kind: 'prop', tags: ['park', 'playground', 'seesaw', 'kids', 'seat'], solid: true, size: [3, 1, 1], vb: [-.2, -.2, 0, 3.2, 1.2, 1.4], seats: [{ x: .4, y: .5, z: .85, dir: 0 }, { x: 2.6, y: .5, z: .35, dir: 2 }],
    variants: [{}, { c: '#3b7bd8', c2: '#ffd23a' }, { c: '#e85a90', c2: '#3fa890' }],
    draw(p) {
      /* p.tilt -2..2 (owner msg 218; sim/playground.js rocks it while somebody rides): 2 = the low-x end up (how it rests, and how it was always drawn), -2 = that end down */
      const c = p.c || '#d8342c', c2 = p.c2 || '#3b7bd8', A = [.1, .5, seesawZ(p.tilt, .1)], B = [2.9, .5, seesawZ(p.tilt, 2.9)];
      box(1.3, .3, 0, .4, .4, .55, '#56636b');
      fq([[A[0], .36, A[2]], [A[0], .64, A[2]], [B[0], .64, B[2]], [B[0], .36, B[2]]], winter() ? SNOW : c); fq([[A[0], .64, A[2]], [B[0], .64, B[2]], [B[0], .64, B[2] - .07], [A[0], .64, A[2] - .07]], dk(c, .35));
      lw([A[0], .36, A[2]], [B[0], .36, B[2]], dk(c, .6)); lw([A[0], .64, A[2] - .07], [B[0], .64, B[2] - .07], dk(c, .6));
      for (const [t, col] of [[.14, c2], [.86, c2]]) { const x = A[0] + (B[0] - A[0]) * t, z = A[2] + (B[2] - A[2]) * t, hx = x + (t < .5 ? .28 : -.28), hz = A[2] + (B[2] - A[2]) * (t + (t < .5 ? .1 : -.1)); fq([[x - .2, .36, z + .05], [x - .2, .64, z + .05], [x + .2, .64, z - .04], [x + .2, .36, z - .04]], col); lw([hx, .5, hz], [hx, .5, hz + .32], '#3a3440'); lw([hx, .4, hz + .32], [hx, .6, hz + .32], '#3a3440'); }
    },
  },
  {
    id: 'prop.park.play.springrider', kind: 'prop', tags: ['park', 'playground', 'springrider', 'kids', 'seat'], solid: true, size: [1, 1, 1], vb: [-.3, -.3, 0, 1.4, 1.3, 1.5], seats: [{ x: .5, y: .5, z: .6, dir: 0 }],
    variants: [{ animal: 'duck' }, { animal: 'horse' }, { animal: 'whale' }, { animal: 'bee' }],
    draw(p) {
      const an = p.animal || 'duck', c = { duck: '#ffd23a', horse: '#c0623a', whale: '#3b9be0', bee: '#ffd23a' }[an];
      cyl(.5, .5, 0, .22, .05, '#56636b'); const s = P(.5, .5, .05); for (let j = 0; j < 6; j++) for (let i = -3; i <= 3; i++) px(s[0] + i, s[1] - j - 1, C(((i + j * 2 + 12) % 4 < 2) ? '#8a8f9a' : '#3a3f4a'));
      box(.12, .38, .45, .76, .24, .3, c, { l: an === 'bee' ? PAT.vstripes(dk(c, .18), '#3a3440', 3) : null, t: winter() ? SNOW : lt(c, .15) });
      if (an === 'duck') { ball(.86, .5, .9, .16, c); const q = P(1.0, .5, .88); px(q[0], q[1], C('#f08a1c')); px(q[0] + 1, q[1], C('#f08a1c')); px(q[0] - 2, q[1] - 2, C('#2a2433')); box(.05, .42, .6, .14, .16, .22, c, { ol: false }); }
      else if (an === 'horse') { box(.74, .4, .72, .16, .2, .38, c); box(.82, .4, .98, .28, .2, .16, c); const q = P(.98, .6, 1.08); px(q[0], q[1], C('#2a2433')); for (let i = 0; i < 4; i++) px(q[0] - 5, q[1] - 2 + i, C('#5a3020')); limb([.12, .5, .7], [-.02, .5, .45], '#5a3020', 2, 1); }
      else if (an === 'whale') { ball(.8, .5, .62, .2, c); const q = P(.95, .62, .66); px(q[0], q[1], C('#2a2433')); px(q[0] - 3, q[1] - 6, C('#c8e8f4')); px(q[0] - 4, q[1] - 8, C('#c8e8f4')); px(q[0] - 2, q[1] - 8, C('#c8e8f4')); limb([.12, .5, .6], [-.05, .4, .9], c, 2, 2); limb([.12, .5, .6], [-.05, .6, .85], dk(c, .2), 2, 2); }
      else { ball(.88, .5, .66, .15, '#3a3440'); const q = P(.5, .5, .78); ellipse(q[0] - 2, q[1] - 3, 3, 2, '#e8f6fb'); ellipse(q[0] + 3, q[1] - 2, 3, 2, '#cfe8f4'); }
      lw([.7, .36, .78], [.7, .64, .78], '#3a3440'); lw([.7, .5, .75], [.7, .5, .88], '#3a3440');
    },
  },
  /* ================= picnic & leisure ================= */
  {
    id: 'prop.park.picnictable', kind: 'prop', tags: ['park', 'picnic', 'table', 'seat'], solid: true, size: [2, 2, .8], vb: [-.2, -.2, 0, 2.2, 2.2, 1.3],
    seats: [{ x: .55, y: .3, z: .45, dir: 1 }, { x: 1.45, y: .3, z: .45, dir: 1 }, { x: .55, y: 1.7, z: .45, dir: 3 }, { x: 1.45, y: 1.7, z: .45, dir: 3 }],
    variants: [{}, { cloth: '#d8342c', basket: true }, { c: '#3f7a55' }, { cloth: '#3b7bd8', basket: true, c: '#8a6a4a' }],
    draw(p) {
      const c = p.c || '#b07444', w = winter(), sl = (x, y) => Math.floor(y * 16) % 4 === 0 ? dk(c, .3) : c;
      box(.05, .12, .4, 1.9, .36, .06, c, { t: w ? SNOW : sl }); for (const x of [.3, 1.62]) box(x, .2, 0, .08, .2, .4, dk(c, .2), { ol: false });
      for (const x of [.3, 1.62]) { tube([x + .04, .55, 0], [x + .04, .85, .72], dk(c, .25), 2); }
      box(.05, .62, .72, 1.9, .76, .07, c, { t: w ? SNOW : p.cloth ? PAT.ftile(p.cloth, '#f4f0e0', .25) : sl, l: p.cloth && !w ? PAT.vstripes(dk(p.cloth, .18), dk('#f4f0e0', .12), 4) : null });
      for (const x of [.3, 1.62]) tube([x + .04, 1.45, 0], [x + .04, 1.15, .72], dk(c, .1), 2);
      if (p.basket && !w) { box(.4, .8, .79, .4, .3, .2, '#c9a268', { l: PAT.siding('#b8925a', 2) }); const s = P(.6, .95, 1.0); for (let i = -3; i <= 3; i++) px(s[0] + i, s[1] - 2 - (Math.abs(i) < 3 ? 1 : 0), C('#8a6a45')); cyl(1.3, 1.0, .79, .07, .16, '#4fa850', { ol: false }); const q = P(1.1, 1.15, .8); px(q[0], q[1], C('#d8342c')); px(q[0] + 1, q[1], C('#d8342c')); px(q[0] + 4, q[1] - 2, C('#ffd23a')); }
      for (const x of [.3, 1.62]) box(x, 1.6, 0, .08, .2, .4, dk(c, .2), { ol: false }); box(.05, 1.52, .4, 1.9, .36, .06, c, { t: w ? SNOW : sl });
    },
  },
  {
    id: 'prop.park.blanket', kind: 'prop', tags: ['park', 'picnic', 'blanket', 'seat', 'decal'], solid: false, size: [2, 2, .1], vb: [-.2, -.2, 0, 2.2, 2.2, .7],
    seats: [{ x: .6, y: 1.3, z: .05, dir: 0 }, { x: 1.4, y: .6, z: .05, dir: 1 }], variants: [{}, { c: '#3b7bd8' }, { c: '#e8b63a', c2: '#f4f0e0' }],
    draw(p) {
      const c = p.c || '#d8342c', c2 = p.c2 || '#f4f0e0';
      if (winter()) { rock(1, 1, 0, .35, .3, .25, '#9a9aa2', 3); snowMound(.6, 1.3, 0, .3); return; } // packed away for winter: just a snowy stone
      qz(.1, 1.9, .1, 1.9, .02, PAT.ftile(c, c2, .3)); lw([.1, 1.9, .02], [1.9, 1.9, .02], dk(c, .5)); lw([1.9, .1, .02], [1.9, 1.9, .02], dk(c, .5));
      box(1.2, 1.2, .02, .45, .32, .22, '#c9a268', { l: PAT.siding('#b8925a', 2), r: PAT.siding('#a07c48', 2) }); const s = P(1.42, 1.36, .26); for (let i = -3; i <= 3; i++) px(s[0] + i, s[1] - 2 - (Math.abs(i) < 3 ? 1 : 0), C('#8a6a45'));
      cyl(.6, .6, .02, .14, .02, '#f4f0e0', { ol: false }); const q = P(.6, .6, .05); px(q[0], q[1], C('#e8b63a')); px(q[0] + 1, q[1], C('#d8342c')); cyl(.95, .5, .02, .05, .16, '#4fa850', { ol: false }); const a = P(.45, 1.0, .03); px(a[0], a[1], C('#d8342c')); px(a[0] + 1, a[1] - 1, C('#d8342c')); px(a[0] + 5, a[1], C('#7ab648'));
    },
  },
  {
    id: 'prop.park.bbq', kind: 'prop', tags: ['park', 'bbq', 'grill', 'picnic'], solid: true, size: [1, 1, 1.2], vb: [-.2, -.2, 0, 1.2, 1.2, 1.9], use: { x: .5, y: 1.4 }, variants: [{}, { kind: 'brick' }, { c: '#d8342c' }],
    draw(p) {
      const w = winter();
      if (p.kind === 'brick') { box(.05, .1, 0, .9, .7, .75, '#b5654a', { l: PAT.brick('#a05a42'), r: PAT.brick('#804634'), t: '#3a3440' }); qy(.25, .75, .8, .1, .5, '#2a2433'); glow(() => qy(.3, .7, .8, .12, .3, '#ff8a3a', '#ffb03a')); qz(.12, .88, .16, .74, .76, (x, y) => Math.floor(x * 16) % 2 ? '#8a8f9a' : '#2a2433'); box(.05, .1, .75, .25, .25, .8, '#b5654a', { l: PAT.brick('#a05a42'), r: PAT.brick('#804634'), t: w ? SNOW : '#d8d2c0' }); if (w) snowTop(.3, .95, .1, .8, .77, true); }
      else { const c = p.c || '#2f3942'; for (const a of [.5, 2.6, 4.7]) tube([.5 + Math.cos(a) * .35, .5 + Math.sin(a) * .35, 0], [.5 + Math.cos(a) * .15, .5 + Math.sin(a) * .15, .6], '#8a8f9a', 1); const s = PW(.5, .5, .78); for (let j = 0; j < 7; j++) { const hw = Math.round(8 * Math.sqrt(1 - (j / 7) ** 2)); for (let i = -hw; i <= hw; i++) px(Math.round(s[0]) + i, Math.round(s[1]) + j, C(i < -hw * .3 ? lt(c, .12) : dk(c, .12))); px(Math.round(s[0]) - hw - 1, Math.round(s[1]) + j, C(dk(c, .7))); px(Math.round(s[0]) + hw + 1, Math.round(s[1]) + j, C(dk(c, .7))); } ellipse(s[0], s[1], 8.5, 4, dk(c, .7)); ellipse(s[0], s[1], 7.5, 3.3, w ? SNOW : '#3a3440', w ? SNOW2 : '#56636b'); if (!w) { glow(() => ellipse(s[0], s[1], 5, 2, '#ff8a3a', '#ffd23a')); for (const d of [[-3, 0], [1, -1], [3, 1]]) { px(Math.round(s[0]) + d[0], Math.round(s[1]) + d[1], C('#a8502a')); px(Math.round(s[0]) + d[0] + 1, Math.round(s[1]) + d[1], C('#c8683a')); } } }
      if (!w) { const s = P(.5, .5, 1.0); for (const d of [[0, 0], [1, -3], [-1, -6], [1, -9], [0, -12]]) px(s[0] + d[0], s[1] + d[1], C('#e8ecf0c0')); }
    },
  },
  {
    id: 'prop.park.arch', kind: 'prop', tags: ['park', 'entrance', 'arch', 'gate', 'sign', 'landmark'], solid: false, size: p => [p.w || 5, 1, 4], vb: p => [-.3, -.3, 0, (p.w || 5) + .3, 1.5, 4.8], light: { x: 2.5, y: 1.3, z: 0, r: 4 },
    variants: [{ name: 'CENTRAL PARK' }, { name: 'RIVERSIDE', kind: 'iron' }, { name: 'LOOKOUT', kind: 'wood', w: 4 }, { name: 'DOG PARK', kind: 'iron', c: '#2f4f45', w: 4 }, { name: 'GARDEN', kind: 'wood', w: 4, vines: true }],
    draw(p) {
      // the two 1x1 pillars are solid, the passage between them (x 1 .. w-1) is open
      const W = p.w || 5, k = p.kind || 'stone', name = String(p.name || 'PARK').slice(0, Math.floor(((W - 1.4) * 16 + 1) / 4)), w = winter();
      const pillar = x => {
        if (k === 'stone') { box(x, 0, 0, 1, 1, 2.7, '#b9b4a8', { l: PAT.stone('#a8a69c'), r: PAT.stone('#8a887e') }); box(x - .08, -.08, 2.7, 1.16, 1.16, .15, '#d8d2c0', { t: w ? SNOW : '#d8d2c0' }); cyl(x + .5, .5, 2.85, .12, .15, '#3a3440', { ol: false }); ball(x + .5, .5, 3.15, .2, '#f4f0e0', { t: '#ffffff', d: '#cfcab8' }); glow(() => ball(x + .5, .5, 3.15, .23, WARM, { t: '#fffbe8', d: WARM2, ol: false })); }
        else if (k === 'iron') { const c = p.c || '#2a2f3a'; box(x + .2, .2, 0, .6, .6, .5, '#a8a69c', { l: PAT.stone('#98968c') }); for (const [dx, dy] of [[.3, .3], [.7, .3], [.3, .7], [.7, .7]]) pole(x + dx, dy, .5, 3.0, c, 1, false); for (let z = .9; z < 3; z += .5) { lw([x + .3, .7, z], [x + .7, .7, z + .4], c); lw([x + .7, .3, z], [x + .7, .7, z + .4], dk(c, .2)); } }
        else { box(x + .25, .25, 0, .5, .5, 3.3, '#8a6a45', { l: PAT.planks('#7a5c3a', 4), r: PAT.planks('#5c452c', 4) }); box(x + .15, .15, 0, .7, .7, .3, '#a8a69c'); }
      };
      pillar(0);
      if (k === 'stone') { // arched lintel + sign
        const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI; pts.push([W / 2 - Math.cos(a) * (W / 2 - .9), .5, 2.7 + Math.sin(a) * .9]); }
        for (let i = 0; i < 16; i++) { fq([pts[i], pts[i + 1], [pts[i + 1][0], .5, pts[i + 1][2] + .5], [pts[i][0], .5, pts[i][2] + .5]], '#3a4a44'); lw([pts[i][0], .5, pts[i][2] + .5], [pts[i + 1][0], .5, pts[i + 1][2] + .5], w ? SNOW : '#56706a'); lw(pts[i], pts[i + 1], '#232e2a'); }
        signY(name, W / 2 - (textW(name) / 32) - .15, W / 2 + (textW(name) / 32) + .15, .52, 3.55, 3.98, '#3a4a44', '#f6e8a0', { lit: true, frame: false });
      } else if (k === 'iron') { const c = p.c || '#2a2f3a', pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI; pts.push([W / 2 - Math.cos(a) * (W / 2 - .5), .5, 3.0 + Math.sin(a) * .9]); }
        for (let i = 0; i < 16; i++) { tube(pts[i], pts[i + 1], c, 2); if (i % 2 === 0) lw(pts[i], [pts[i][0], .5, 3.0], c); } rail([.5, .5, 3.0], [W - .5, .5, 3.0], c, 2);
        signY(name, W / 2 - (textW(name) / 32) - .12, W / 2 + (textW(name) / 32) + .12, .52, 3.08, 3.5, c, '#f6e8a0', { lit: true }); const t = P(W / 2, .5, 3.9); px(t[0], t[1] - 1, C('#e8c85a')); px(t[0], t[1] - 2, C('#e8c85a')); px(t[0] - 1, t[1] - 1, C('#e8c85a')); px(t[0] + 1, t[1] - 1, C('#e8c85a')); }
      else { box(-.2, .3, 3.3, W + .4, .4, .25, '#8a6a45', { t: w ? SNOW : '#9a7a52' }); box(.1, .35, 3.65, W - .2, .3, .2, '#7a5c3a', { t: w ? SNOW : '#8a6a45' }); for (const x of [.9, W - 1.3]) lw([x + .2, .72, 3.3], [x + .2, .72, 3.05], '#3a3440'); box(.9, .64, 2.55, W - 1.8, .08, .5, '#c9a268'); signY(name, 1, W - 1, .725, 2.6, 3.0, '#c9a268', '#4a2f1c', { frame: false });
        if (p.vines && !w) { const R = rng(7), bl = []; for (let x = -.1; x < W + .1; x += .4) bl.push({ x, y: .72, z: 3.5 + R() * .3, r: .22 + R() * .12, c: season() === 2 ? ['#c9792a', '#b8432a', '#e8b63a'][Math.floor(R() * 3)] : leafC(Math.floor(R() * 3)) }); clumps(bl, { seed: 3, bump: .2, dots: season() < 2 ? { c: ['#ff8ab0', '#ffffff'], p: .2 } : null }); } }
      pillar(W - 1);
      if (k !== 'stone') { for (const x of [.5, W - .5]) { lw([x, .8, 2.6], [x, .8, 2.4], '#3a3440'); bulb(x, .8, 2.3, 2); } }
    },
  },
  {
    id: 'prop.park.pergola', kind: 'prop', tags: ['park', 'pergola', 'garden', 'vines', 'shelter', 'hillcrest'], solid: false, size: p => [p.len || 4, 2, 2.8], vb: p => [-.4, -.4, 0, (p.len || 4) + .4, 2.4, 3.4],
    seats: [{ x: 1, y: .6, z: .45, dir: 1 }, { x: 2, y: .6, z: .45, dir: 1 }], variants: [{ len: 4, seed: 1 }, { len: 6, seed: 2, c: '#f4f0e6', bloom: '#b06ae0' }, { len: 4, seed: 3, c: '#6b4a35', bloom: '#ff8ab0', bench: false }],
    draw(p) {
      // open-sided: only the posts are solid. A bench sits along the back.
      const L = p.len || 4, c = p.c || '#a8744a', s = season(), R = rng((p.seed || 1) * 7), n = Math.round(L / 2);
      for (let i = 0; i <= n; i++) pole(.15 + i * (L - .3) / n, .15, 0, 2.5, dk(c, .1), 3, true);
      if (p.bench !== false) { box(.5, .3, .4, L - 1, .45, .06, '#b8845a', { t: winter() ? SNOW : '#b8845a' }); for (const x of [.6, L - .7]) box(x, .35, 0, .1, .35, .4, '#56636b', { ol: false }); }
      for (let i = 0; i <= n; i++) pole(.15 + i * (L - .3) / n, 1.85, 0, 2.5, c, 3, true);
      for (const y of [.15, 1.85]) box(-.2, y - .06, 2.5, L + .4, .12, .14, c, { t: winter() ? SNOW : lt(c, .15) });
      for (let x = 0; x <= L + .01; x += .5) box(x - .04, -.25, 2.64, .08, 2.5, .1, c, { ol: false, t: winter() ? SNOW : lt(c, .2), r: dk(c, .4) });
      if (s === 3) { for (let i = 0; i < L * 3; i++) { const x = R() * L, y = R() * 2; limb([x, y, 2.76], [x + (R() - .5) * .8, y + (R() - .5) * .8, 2.8], '#6b4a2f', 1, 1); } return; }
      const bl = []; for (let i = 0; i < L * 5; i++) bl.push({ x: R() * L, y: -.2 + R() * 2.3, z: 2.82 + R() * .12, r: .26 + R() * .16, sq: .6, c: s === 2 ? ['#c9792a', '#b8432a', '#e8b63a', '#7a9a45'][Math.floor(R() * 4)] : leafC(Math.floor(R() * 4), '#3a8a4a', .25) });
      bl.sort((a, b) => a.x + a.y - b.x - b.y); clumps(bl, { seed: p.seed, bump: .2, gap: .1, flat: true, dots: s < 2 ? { c: [p.bloom || '#ffffff', lt(p.bloom || '#ffffff', .4)], p: s === 0 ? .3 : .12 } : null });
      // hanging tendrils / wisteria along the front beam
      for (let x = .1; x < L; x += .22) { const q = P(x, 1.92, 2.5), len = 2 + Math.floor(R() * 7), col = s < 2 && p.bloom && R() < .6 ? p.bloom : s === 2 ? '#c9792a' : '#4f9a45'; for (let j = 0; j < len; j++) px(q[0], q[1] + j, C(j & 1 ? col : dk(col, .2))); }
      for (let i = 0; i <= n; i++) limb([.15 + i * (L - .3) / n, 1.9, 0], [.15 + i * (L - .3) / n + .08, 1.9, 2.5], '#4f8a45', 1, 1);
    },
  },
  {
    id: 'prop.park.raisedbed', kind: 'prop', tags: ['park', 'garden', 'community', 'vegetables', 'maplewood', 'nature'], solid: true, size: p => [p.len || 2, 1, .5], vb: p => [-.2, -.2, 0, (p.len || 2) + .2, 1.2, 1.5],
    variants: [{ crop: 'tomato', seed: 1 }, { crop: 'lettuce', seed: 2 }, { crop: 'carrot', seed: 3, len: 3 }, { crop: 'herbs', seed: 4, c: '#8a959e' }, { crop: 'sunflower', seed: 5 }, { crop: 'beans', seed: 6, len: 3 }],
    draw(p) {
      const L = p.len || 2, c = p.c || '#a8744a', s = season(), crop = p.crop || 'tomato', R = rng((p.seed || 1) * 5), soil = s === 3 ? SNOW : '#5a4030';
      box(0, 0, 0, L, 1, .42, c, { l: PAT.siding(dk(c, .18), 4), r: PAT.siding(dk(c, .36), 4), t: lt(c, .12) }); qz(.1, L - .1, .1, .9, .43, soil, s === 3 ? SNOW2 : '#6a4a38');
      for (const [x, y] of [[0, 0], [L - .1, 0], [0, .9], [L - .1, .9]]) box(x, y, 0, .1, .1, .5, dk(c, .15), { ol: false });
      const lab = P(L - .25, .88, .43); px(lab[0], lab[1], C('#8a6a45')); px(lab[0], lab[1] - 1, C('#8a6a45')); for (let i = -1; i <= 1; i++) for (let j = 0; j < 2; j++) px(lab[0] + i, lab[1] - 2 - j, C('#f4f0e0'));
      if (s === 3) { if (crop === 'tomato' || crop === 'beans' || crop === 'sunflower') for (let x = .3; x < L; x += .45) pole(x, .5, .43, 1.1, '#c9a268', 1, false); tufts(.2, L - .2, .2, .8, .43, '#8a7a5a', 5, p.seed, 2); return; }
      const g = s === 2 ? '#7a9a45' : '#4fa850';
      if (s === 0) { for (const y of [.3, .7]) for (let x = .25; x < L - .1; x += .25) { const q = P(x, y, .43); px(q[0], q[1] - 1, C('#6dbb58')); px(q[0] - 1, q[1] - 2, C('#8fd06a')); px(q[0] + 1, q[1] - 2, C('#6dbb58')); } if (crop === 'tomato' || crop === 'beans') for (let x = .3; x < L; x += .45) pole(x, .5, .43, 1.1, '#c9a268', 1, false); return; }
      if (crop === 'tomato') { for (let x = .3; x < L; x += .45) { pole(x, .5, .43, 1.15, '#c9a268', 1, false); clumps([{ x, y: .5, z: .75, r: .2, sq: 1.3, c: g }], { seed: Math.round(x * 10), bump: .2, dots: { c: s === 2 ? ['#d8342c', '#b82a24'] : ['#d8342c', '#f08a1c', '#7ab648'], p: .4 } }); } }
      else if (crop === 'beans') { for (let x = .3; x < L; x += .45) { limb([x - .12, .35, .43], [x, .5, 1.25], '#c9a268', 1, 1); limb([x + .12, .65, .43], [x, .5, 1.25], '#c9a268', 1, 1); clumps([{ x, y: .5, z: .8, r: .17, sq: 1.6, c: g }], { seed: Math.round(x * 10), bump: .25, dots: { c: ['#f4f0e0', '#e85a90'], p: .2 } }); } }
      else if (crop === 'sunflower') { for (let x = .3; x < L; x += .4) { const h = .9 + R() * .4; pole(x, .5, .43, .43 + h, '#4f8a3a', 1, false); const q = P(x, .5, .43 + h); px(q[0] - 2, q[1] + 5, C(g)); px(q[0] + 1, q[1] + 8, C(g)); px(q[0] + 2, q[1] + 8, C(g)); if (s === 1) { ellipse(q[0], q[1], 3, 3, '#ffd23a'); ellipse(q[0], q[1], 1.2, 1.2, '#6b4a2f'); } else { ellipse(q[0], q[1] + 1, 2, 2, '#6b4a2f'); } } }
      else if (crop === 'lettuce') { for (const y of [.3, .7]) for (let x = .28; x < L - .15; x += .36) { clumps([{ x, y, z: .5, r: .15, sq: .7, c: (Math.round(x * 3) + (y > .5 ? 1 : 0)) % 3 ? '#8fd06a' : '#8a4a9a' }], { seed: Math.round(x * 9 + y * 5), bump: .25, flat: true }); } if (s === 2) pumpkin(L - .4, .5, .43, 4); }
      else if (crop === 'carrot') { tufts(.2, L - .2, .2, .8, .43, g, Math.round(L * 14), p.seed, 5); for (let x = .3; x < L; x += .5) { const q = P(x, .82, .43); px(q[0], q[1], C('#f08a1c')); px(q[0], q[1] - 1, C('#f08a1c')); } }
      else { for (let x = .3, i = 0; x < L - .1; x += .42, i++) clumps([{ x, y: .5, z: .58, r: .2, sq: .8, c: ['#7ab868', '#5a9a6a', '#9ac878', '#6a8a9a'][i % 4] }], { seed: i, bump: .25, dots: i % 2 ? { c: ['#b06ae0', '#d8a8f0'], p: .3 } : null }); }
    },
  },
  {
    id: 'prop.park.coldframe', kind: 'prop', tags: ['park', 'garden', 'community', 'greenhouse', 'coldframe', 'maplewood'], solid: true, size: p => [p.len || 2, 1, .9], vb: p => [-.2, -.2, 0, (p.len || 2) + .2, 1.2, 2.2],
    variants: [{}, { open: true }, { kind: 'tunnel', len: 3 }, { kind: 'house', len: 3 }],
    draw(p) {
      const L = p.len || 2, c = '#a8744a', w = winter(), g = w ? '#6a9a6a' : '#5ab85a';
      if (p.kind === 'house') { // mini greenhouse
        box(0, 0, 0, L, 1, .25, '#b5654a', { l: PAT.brick('#a05a42'), r: PAT.brick('#804634'), t: '#5a4030' }); if (!w || true) for (let x = .3; x < L; x += .4) clumps([{ x, y: .5, z: .5, r: .2, c: g }], { seed: Math.round(x * 10), bump: .2, dots: { c: ['#d8342c', '#ffd23a'], p: .2 } });
        const fr = '#e8e2d4'; qx(L, 0, 1, .25, 1.3, '#bfe4ec', 'glass'); fq([[L, 0, 1.3], [L, 1, 1.3], [L, .5, 1.8]], '#bfe4ec', 'glass'); qy(0, L, 1, .25, 1.3, '#cfeef4', 'glass');
        fq([[0, 1, 1.3], [L, 1, 1.3], [L, .5, 1.8], [0, .5, 1.8]], '#d8f2f6', 'glass'); if (w) fq([[.1, .9, 1.4], [L - .1, .9, 1.4], [L - .1, .5, 1.8], [.1, .5, 1.8]], SNOW, 'glass');
        for (let x = 0; x <= L + .01; x += .5) { lw([x, 1, .25], [x, 1, 1.3], fr); lw([x, 1, 1.3], [x, .5, 1.8], fr); } lw([0, 1, 1.3], [L, 1, 1.3], fr); lw([0, .5, 1.8], [L, .5, 1.8], w ? SNOW : fr); lw([L, 0, 1.3], [L, .5, 1.8], fr); lw([L, 1, 1.3], [L, .5, 1.8], fr); lw([L, 0, .25], [L, 0, 1.3], fr); lw([L, 1, .25], [L, 1, 1.3], fr); lw([L, .5, .25], [L, .5, 1.8], fr); lw([0, 1, .78], [L, 1, .78], fr); glow(() => qy(.1, L - .1, 1, .3, .7, '#d8ffc8', 'glass')); return; }
      if (p.kind === 'tunnel') { qz(0, L, .05, .95, .02, '#5a4030'); tufts(.2, L - .2, .2, .8, .02, g, L * 8, 3, 4); for (let x = 0; x <= L + .01; x += .5) { const pts = []; for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI; pts.push([x, .5 - Math.cos(a) * .45, Math.sin(a) * .7]); } if (x < L) for (let i = 4; i < 8; i++) fq([pts[i], pts[i + 1], [x + .5, pts[i + 1][1], pts[i + 1][2]], [x + .5, pts[i][1], pts[i][2]]], w && i < 6 ? SNOW : '#e8f6f8', 'glass'); for (let i = 0; i < 8; i++) lw(pts[i], pts[i + 1], '#c8ccd4'); } return; }
      box(0, 0, 0, L, 1, .35, c, { l: PAT.siding(dk(c, .18), 4), r: PAT.siding(dk(c, .36), 4), t: '#5a4030' }); box(0, 0, .35, L, .1, .4, c, { ol: false });
      tufts(.15, L - .15, .2, .85, .36, g, L * 10, 2, 4); if (!w) blooms(.2, L - .2, .3, .8, .42, ['#d8342c', '#ffd23a', '#ffffff'], L * 3, 4, null);
      const lid = p.open ? [[0, .08, .75], [L, .08, .75], [L, .5, 1.5], [0, .5, 1.5]] : [[0, .08, .75], [L, .08, .75], [L, 1, .36], [0, 1, .36]];
      if (!p.open) fq([[L, .08, .36], [L, 1, .36], [L, .08, .75]], dk(c, .36));
      fq(lid, w && !p.open ? '#eef6f8' : '#cfeef4', 'glass'); for (let x = 0; x <= L + .01; x += L / Math.round(L * 1.5)) lw([x, lid[0][1], lid[0][2]], [x, lid[3][1], lid[3][2]], '#f4f0e6'); lw(lid[0], lid[1], '#f4f0e6'); lw(lid[3], lid[2], '#f4f0e6'); lw([0, lid[3][1], (lid[0][2] + lid[3][2]) / 2], [0, lid[3][1], (lid[0][2] + lid[3][2]) / 2], '#f4f0e6');
      if (p.open) { lw([L - .1, .9, .36], [L - .1, .45, 1.4], '#8a6a45'); }
    },
  },
  {
    id: 'prop.park.birdbath', kind: 'prop', tags: ['park', 'garden', 'birdbath', 'birds', 'water'], solid: true, size: [1, 1, 1], vb: [-.1, -.1, 0, 1.1, 1.1, 1.4], variants: [{}, { c: '#c8b8a0', bird: '#d8342c' }, { c: '#8a959e', bird: null }],
    draw(p) {
      const c = p.c || STONE, wt = water();
      shadow(.5, .5, 0, .45); cyl(.5, .5, 0, .28, .1, dk(c, .1)); cyl(.5, .5, .1, .12, .6, c); cyl(.5, .5, .68, .18, .06, lt(c, .08), { ol: false }); cyl(.5, .5, .74, .42, .1, c, { t: lt(c, .12) });
      const s = PW(.5, .5, .84); ellipse(s[0], s[1], .34 * U * 1.414, .34 * U * .707, wt[0], wt[1]); if (winter()) ellipse(s[0] - 2, s[1] - 1, 4, 1.5, SNOW);
      if (p.bird !== null) { bird(.2, .62, .86, p.bird || '#8a6a55'); if (!winter()) { px(Math.round(s[0]) + 2, Math.round(s[1]), C('#e8f6fb')); px(Math.round(s[0]) + 4, Math.round(s[1]) + 1, C('#e8f6fb')); } }
    },
  },
  {
    id: 'prop.park.birdfeeder', kind: 'prop', tags: ['park', 'garden', 'birdfeeder', 'birdhouse', 'birds'], solid: true, size: [.5, .5, 2.4], vb: [-.4, -.4, 0, .9, .9, 2.8], variants: [{}, { kind: 'house', c: '#3b7bd8' }, { kind: 'house', c: '#e8b63a', roof: '#d8342c' }],
    draw(p) {
      const c = p.c || '#a8744a', x = .25, y = .25, w = winter();
      pole(x, y, 0, 1.8, '#8a6a45', 2, false);
      if (p.kind === 'house') { box(x - .2, y - .18, 1.8, .4, .36, .42, c); gable(x - .2, y - .18, 2.22, .4, .36, .22, 'y', w ? SNOW : (p.roof || '#8a4b3a'), { wall: c, over: .08 }); const s = P(x, y + .18, 2.05); ellipse(s[0], s[1], 2, 2, '#2a2433'); px(s[0], s[1] + 4, C('#6b4a2f')); px(s[0] + 1, s[1] + 4, C('#6b4a2f')); bird(x + .18, y + .3, 1.82, w ? '#d8342c' : '#5a8ad8'); }
      else { box(x - .3, y - .3, 1.8, .6, .6, .05, c, { t: '#e8d8a0' }); for (const [dx, dy] of [[-.26, -.26], [.24, -.26], [-.26, .24], [.24, .24]]) lw([x + dx, y + dy, 1.85], [x + dx, y + dy, 2.2], dk(c, .3)); octRoof(x, y, 2.2, .46, .25, w ? SNOW : '#8a4b3a', w ? SNOW2 : '#7a4132', { n: 4, eave: .04, snow: false }); bird(x - .12, y + .2, 1.86, w ? '#d8342c' : '#8a6a55'); bird(x + .18, y - .05, 1.86, '#e8b63a'); }
      if (w) snowMound(x, y, 0, .2);
    },
  },
  {
    id: 'prop.park.dogagility', kind: 'prop', tags: ['park', 'dogpark', 'agility', 'dog'], solid: true, size: p => ({ hurdle: [2, .5, 1], tunnel: [3, 1, 1], weave: [3, .5, 1.2], ramp: [3, 1, 1.4], hoop: [1, .5, 1.6], bowl: [1, 1, .9] })[p.kind || 'hurdle'],
    variants: [{ kind: 'hurdle' }, { kind: 'tunnel' }, { kind: 'weave' }, { kind: 'ramp' }, { kind: 'hoop' }, { kind: 'bowl' }, { kind: 'tunnel', c: '#d8342c' }],
    draw(p) {
      const k = p.kind || 'hurdle', w = winter();
      if (k === 'hurdle') { for (const x of [.1, 1.9]) { box(x - .1, .1, 0, .2, .3, .06, '#f4f0e0', { ol: false }); pole(x, .25, 0, .95, '#f4f0e0', 2, true); } for (const [z, c] of [[.3, '#3b7bd8'], [.55, '#d8342c']]) { rail([.1, .25, z], [1.9, .25, z], c, 2); for (let i = 3; i < 28; i += 8) { const s = P(.1 + i / 16, .25, z); px(s[0], s[1], C('#f4f0e0')); px(s[0] + 1, s[1], C('#f4f0e0')); px(s[0], s[1] + 1, C('#f4f0e0')); px(s[0] + 1, s[1] + 2, C('#f4f0e0')); } } }
      else if (k === 'tunnel') { const c = p.c || '#3b7bd8'; for (let i = 0; i <= 44; i++) { const s = PW(.1 + i / 16, .5, .42); ellipse(s[0], s[1], 5.5, 7.5, dk(c, .6)); ellipse(s[0], s[1], 4.5, 6.5, i % 6 < 2 ? '#ffd23a' : (i % 6 < 4 ? c : lt(c, .12))); } const s = PW(.1 + 45 / 16, .5, .42); ellipse(s[0], s[1], 5.5, 7.5, dk(c, .6)); ellipse(s[0], s[1], 4.5, 6.5, lt(c, .3)); ellipse(s[0] + .5, s[1] + .5, 3.2, 5, '#2a2433'); if (w) for (let i = 4; i < 40; i++) { const q = PW(.1 + i / 16, .5, .42); px(Math.round(q[0]) - 1, Math.round(q[1]) - 7, C(SNOW)); px(Math.round(q[0]) - 2, Math.round(q[1]) - 6, C(SNOW)); } }
      else if (k === 'weave') { box(0, .2, 0, 3, .1, .04, '#8a8f9a', { ol: false }); for (let i = 0; i < 6; i++) { const x = .25 + i * .5; pole(x, .25, .04, 1.1, i % 2 ? '#d8342c' : '#f4f0e0', 2, true); const s = P(x, .25, .6); px(s[0] - 1, s[1], C(i % 2 ? '#f4f0e0' : '#d8342c')); px(s[0], s[1], C(i % 2 ? '#f4f0e0' : '#d8342c')); px(s[0] - 1, s[1] + 1, C(i % 2 ? '#f4f0e0' : '#d8342c')); px(s[0], s[1] + 1, C(i % 2 ? '#f4f0e0' : '#d8342c')); } }
      else if (k === 'ramp') { const c = '#3b7bd8'; fq([[1.5, .1, 1.3], [1.5, .9, 1.3], [0, .9, 0], [0, .1, 0]], dk(c, .1)); fq([[1.5, .9, 1.3], [0, .9, 0], [.15, .9, 0]], dk(c, .45)); fq([[1.5, .1, 1.3], [1.5, .9, 1.3], [3, .9, 0], [3, .1, 0]], w ? SNOW : c); fq([[1.5, .9, 1.3], [3, .9, 0], [2.85, .9, 0]], dk(c, .45)); fq([[2.5, .1, .433], [2.5, .9, .433], [3, .9, 0], [3, .1, 0]], '#ffd23a'); for (let t = .15; t < .7; t += .14) lw([1.5 + t * 1.5, .1, 1.3 * (1 - t)], [1.5 + t * 1.5, .9, 1.3 * (1 - t)], dk(c, .4)); lw([1.5, .1, 1.3], [1.5, .9, 1.3], lt(c, .4)); lw([1.5, .9, 1.3], [3, .9, 0], dk(c, .6)); lw([1.5, .9, 1.3], [0, .9, 0], dk(c, .6)); }
      else if (k === 'hoop') { for (const x of [.1, .9]) { pole(x, .25, 0, 1.5, '#f4f0e0', 2, true); } rail([.1, .25, 1.5], [.9, .25, 1.5], '#f4f0e0', 2); ring(.5, .25, .85, 6, '#d8342c', 7); ring(.5, .25, .85, 5, '#ffd23a', 6); lw([.5, .25, 1.5], [.5, .25, 1.3], '#8a8f9a'); box(0, .1, 0, 1, .3, .05, '#8a8f9a', { ol: false }); }
      else { pole(.5, .3, 0, .9, '#8a6a45', 2, false); box(.15, .26, .5, .7, .06, .35, '#3f7a55'); stampY(['.....', '#.#..', '###.#', '.####', '.#.#.'], .32, .325, .78, '#f4f0e0'); cyl(.3, .7, 0, .16, .08, '#c8ccd4', { t: w ? ICE[0] : WATER[0] }); cyl(.72, .75, 0, .14, .07, '#d8342c', { t: '#8a5a3a' }); const s = P(.5, .95, 0); px(s[0], s[1], C('#ffd23a')); px(s[0] + 1, s[1], C('#e8b63a')); px(s[0], s[1] - 1, C('#fff4a0')); }
    },
  },
  /* ================= sports ================= */
  {
    id: 'prop.park.hoop', kind: 'prop', tags: ['park', 'sports', 'basketball', 'hoop', 'court'], solid: true, size: [2, 1, 3.8], vb: [-.2, -.2, 0, 2.2, 1.6, 4.1], variants: [{}, { c: '#3b7bd8' }, { c: '#3a3440', board: 'glass' }],
    draw(p) {
      const c = p.c || '#56636b';
      box(.8, .05, 0, .4, .4, .5, '#3d4a54'); pole(1, .25, .5, 3.1, c, 3, true); tube([1, .25, 3.05], [1, .65, 3.2], c, 2);
      if (p.board === 'glass') qy(.2, 1.8, .7, 2.65, 3.7, '#cfe8f0', 'glass'); else qy(.2, 1.8, .7, 2.65, 3.7, '#f4f0e6');
      for (const [a, b] of [[[.2, 2.65], [1.8, 2.65]], [[.2, 3.7], [1.8, 3.7]], [[.2, 2.65], [.2, 3.7]], [[1.8, 2.65], [1.8, 3.7]], [[.75, 2.8], [1.25, 2.8]], [[.75, 3.15], [1.25, 3.15]], [[.75, 2.8], [.75, 3.15]], [[1.25, 2.8], [1.25, 3.15]]]) lw([a[0], .705, a[1]], [b[0], .705, b[1]], a[0] > .5 && a[1] > 2.7 && a[1] < 3.6 ? '#d8342c' : '#3a3440');
      if (winter()) lw([.2, .7, 3.72], [1.8, .7, 3.72], SNOW);
      const s = PW(1, 1.0, 2.8); ring(1, 1.0, 2.8, 6, '#f08a1c', 3); ring(1, 1.0, 2.79, 6, '#c8601c', 3);
      for (let j = 1; j < 7; j++) { const hw = 6 - j * .5; for (let i = -Math.round(hw); i <= Math.round(hw); i++) if ((i + j) % 2 === 0) px(Math.round(s[0]) + i, Math.round(s[1]) + j + (Math.abs(i) < 4 ? 2 : 0), C('#f4f0e6')); }
    },
  },
  {
    id: 'prop.park.tennisnet', kind: 'prop', tags: ['park', 'sports', 'tennis', 'net', 'court', 'segment'], solid: true, size: p => [p.len || 8, .5, 1.1], vb: p => [-.2, -.2, 0, (p.len || 8) + .2, .7, 1.4], variants: [{ len: 8 }, { len: 6, kind: 'volley' }, { len: 4, kind: 'badminton' }],
    draw(p) {
      const L = p.len || 8, k = p.kind || 'tennis', h = k === 'tennis' ? 1 : k === 'volley' ? 2.3 : 1.6, z0 = k === 'tennis' ? .08 : h - .8, pc = k === 'tennis' ? '#2f6f5f' : '#e8b63a';
      pole(.1, .25, 0, h + .1, pc, 2, true);
      qy(.1, L - .1, .25, z0, h - .08, (u, v) => (u % 3 === 0 || v % 3 === 0) ? (k === 'tennis' ? '#3a3f4a' : '#f4f0e0') : null); qy(.1, L - .1, .25, h - .1, h, '#f4f0e6'); lw([.1, .25, h], [L - .1, .25, h], winter() ? SNOW : '#ffffff'); lw([.1, .25, z0], [L - .1, .25, z0], '#3a3f4a');
      if (k === 'tennis') { qy(L / 2 - .04, L / 2 + .04, .25, .05, h - .1, '#f4f0e6'); }
      pole(L - .1, .25, 0, h + .1, pc, 2, true);
    },
  },
  {
    id: 'prop.park.goal', kind: 'prop', tags: ['park', 'sports', 'soccer', 'goal', 'field'], solid: true, size: p => [p.w || 4, 2, 2], vb: p => [-.2, -.2, 0, (p.w || 4) + .2, 2.2, 2.3], variants: [{ w: 4 }, { w: 6 }, { w: 3, kind: 'hockey', c: '#d8342c' }],
    draw(p) {
      // mouth faces +y; net slopes down to the back (-y)
      const W = p.w || 4, c = p.c || '#f4f0e6', H = p.kind === 'hockey' ? 1.3 : 2, net = (u, v) => (u % 4 === 0 || v % 4 === 0) ? '#e8ecf0' : null, f = 1.8;
      const mesh = pts => { const q = pts.map(a => PW(a[0], a[1], a[2])); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; q.forEach(a => { x0 = Math.min(x0, a[0]); x1 = Math.max(x1, a[0]); y0 = Math.min(y0, a[1]); y1 = Math.max(y1, a[1]); }); fq(pts, (X, Y) => ((X + 2 * Y) % 6 === 0 || (X - 2 * Y + 6000) % 6 === 0) ? '#e8ecf0' : null); };
      mesh([[0, .2, 0], [W, .2, 0], [W, .2, H * .5], [0, .2, H * .5]]); mesh([[0, .2, H * .5], [W, .2, H * .5], [W, f * .6, H], [0, f * .6, H]]);
      tube([0, .2, 0], [0, .2, H * .5], dk(c, .3), 1); tube([W, .2, 0], [W, .2, H * .5], dk(c, .3), 1); tube([0, .2, H * .5], [0, f, H], dk(c, .25), 1);
      mesh([[W, .2, 0], [W, f, 0], [W, f, H], [W, f * .6, H], [W, .2, H * .5]]); mesh([[0, f * .6, H], [W, f * .6, H], [W, f, H], [0, f, H]]);
      tube([W, .2, H * .5], [W, f, H], dk(c, .2), 1); tube([0, .2, 0], [0, f, 0], dk(c, .3), 1); tube([W, .2, 0], [W, f, 0], dk(c, .3), 1);
      pole(.05, f, 0, H, c, 2, true); pole(W - .05, f, 0, H, c, 2, true); rail([.05, f, H], [W - .05, f, H], winter() ? SNOW : c, 3);
      if (p.kind !== 'hockey' && !winter()) { ball(W * .6, f + .15, .1, .1, '#f4f0e6'); const s = P(W * .6, f + .15, .12); px(s[0], s[1], C('#2a2433')); }
    },
  },
  {
    id: 'prop.park.bikerack', kind: 'prop', tags: ['park', 'street', 'bike', 'bikerack', 'parking'], solid: true, size: p => [p.n || 3, 2, 1], vb: p => [-.2, -.2, 0, (p.n || 3) + .2, 2.2, 1.4],
    variants: [{ n: 3, bikes: ['#d8342c', null, '#3b7bd8'] }, { n: 4, bikes: [null, '#3fa890', '#e8b63a', null], c: '#3b7bd8' }, { n: 2, bikes: ['#3a3440', '#e85a90'] }, { n: 3, bikes: [] }],
    draw(p) {
      const n = p.n || 3, c = p.c || '#a8b0b8', bikes = p.bikes || [];
      for (let i = 0; i < n; i++) { const x = i + .5; const pts = []; for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI; pts.push([x, .7 - Math.cos(a) * .4, .45 + Math.sin(a) * .4]); } tube([x, .3, 0], [x, .3, .45], c, 2); for (let k = 0; k < 8; k++) tube(pts[k], pts[k + 1], k < 4 ? c : lt(c, .15), 2); tube([x, 1.1, 0], [x, 1.1, .45], lt(c, .15), 2); if (winter()) { const s = P(x, .7, .85); px(s[0], s[1] - 1, C(SNOW)); px(s[0] + 1, s[1] - 1, C(SNOW)); }
        if (bikes[i]) bikeY(x + .22, .25, 0, bikes[i]); }
    },
  },
  {
    id: 'prop.park.gymbars', kind: 'prop', tags: ['park', 'sports', 'gym', 'fitness', 'outdoor'], solid: true, size: [4, 2, 2.6], vb: [-.2, -.2, 0, 4.2, 2.2, 2.9], use: { x: 1, y: 2.3 }, variants: [{}, { c: '#d8342c', c2: '#3a3440' }, { c: '#3fa890', c2: '#f4f0e6' }],
    draw(p) {
      const c = p.c || '#3b7bd8', c2 = p.c2 || '#e8b63a', bar = '#c8ccd4';
      // back row: three pull-up bars stepping up; front: parallel bars + sit-up bench
      const xs = [.15, 1.4, 2.65, 3.85], hs = [1.7, 2.1, 2.5];
      for (let i = 0; i < 4; i++) pole(xs[i], .3, 0, i === 0 ? hs[0] + .1 : i === 3 ? hs[2] + .1 : hs[i] + .1, c, 3, true);
      for (let i = 0; i < 3; i++) rail([xs[i], .3, hs[i]], [xs[i + 1], .3, hs[i]], bar, 2);
      for (let z = .5; z < 2.4; z += .35) lw([xs[3], .3, z], [xs[3] - .01, .9, z], bar); pole(xs[3], .9, 0, 2.6, c, 3, true);
      for (const y of [1.3, 1.8]) { pole(.4, y, 0, 1.1, c2, 2, true); pole(1.8, y, 0, 1.1, c2, 2, true); rail([.3, y, 1.1], [1.9, y, 1.1], bar, 2); }
      box(2.5, 1.3, 0, .1, .5, .35, c2, { ol: false }); fq([[2.4, 1.25, .35], [3.7, 1.25, .12], [3.7, 1.85, .12], [2.4, 1.85, .35]], winter() ? SNOW : '#3a3440'); lw([2.4, 1.85, .35], [3.7, 1.85, .12], '#2a2433'); pole(3.7, 1.55, 0, .5, c2, 2, true); rail([3.7, 1.3, .5], [3.7, 1.8, .5], bar, 2);
    },
  },
  {
    id: 'prop.park.telescope', kind: 'prop', tags: ['park', 'lookout', 'telescope', 'hillcrest', 'harbor', 'viewpoint'], solid: true, size: [1, 1, 1.7], vb: [-.3, -.3, 0, 1.3, 1.3, 2], use: { x: .5, y: -.4 }, variants: [{}, { c: '#3b7bd8' }, { c: '#c0623a', kind: 'scope' }],
    draw(p) {
      // looks out toward +y/+x (the view); the user stands behind it
      const c = p.c || '#a8b0b8';
      box(.15, .0, 0, .7, .3, .2, '#8a8f9a', { t: winter() ? SNOW : '#a8acb4' }); cyl(.5, .6, 0, .25, .08, '#56636b'); cyl(.5, .6, .08, .1, 1.05, '#6a757e'); cyl(.5, .6, 1.1, .14, .08, '#56636b', { ol: false });
      if (p.kind === 'scope') { tube([.3, .35, 1.3], [.8, .95, 1.55], c, 4); tube([.72, .85, 1.5], [.85, 1.0, 1.58], dk(c, .3), 5); const s = P(.86, 1.02, 1.56); ellipse(s[0], s[1], 2, 2.5, '#8fd0e8'); }
      else { box(.24, .38, 1.18, .52, .5, .34, c, { t: winter() ? SNOW : lt(c, .2) }); const s = P(.38, .88, 1.36), t = P(.72, .88, 1.36); for (const q of [s, t]) { ellipse(q[0], q[1], 2.6, 2.6, '#2a2433'); ellipse(q[0], q[1], 1.6, 1.6, '#8fd0e8'); px(q[0] - 1, q[1] - 1, C('#e8f6fb')); } qx(.76, .42, .6, 1.25, 1.4, '#2a2433'); lit(() => { const q = P(.76, .5, 1.36); px(q[0], q[1], C('#6af08a')); }); }
    },
  },
  {
    id: 'prop.park.stonelantern', kind: 'prop', tags: ['park', 'garden', 'lantern', 'stone', 'zen', 'light', 'hillcrest'], solid: true, size: [1, 1, 1.9], vb: [-.2, -.2, 0, 1.2, 1.2, 2.3], light: { x: .5, y: .5, z: 0, r: 2.8 }, variants: [{}, { c: '#8a8f8a', moss: true }, { kind: 'low' }],
    draw(p) {
      const c = p.c || '#a8a69c', w = winter(), low = p.kind === 'low', z0 = low ? .25 : .95;
      shadow(.5, .5, 0, .5);
      if (low) { for (const a of [.4, 2.5, 4.6]) tube([.5 + Math.cos(a) * .35, .5 + Math.sin(a) * .35, 0], [.5 + Math.cos(a) * .2, .5 + Math.sin(a) * .2, .28], dk(c, .15), 3); }
      else { cyl(.5, .5, 0, .34, .12, dk(c, .1)); cyl(.5, .5, .12, .13, .7, c); cyl(.5, .5, .82, .3, .13, lt(c, .05)); }
      box(.3, .3, z0, .4, .4, .38, c); qy(.38, .62, .7, z0 + .08, z0 + .3, '#3a3440'); qx(.7, .38, .62, z0 + .08, z0 + .3, '#2a2433'); glow(() => { qy(.38, .62, .7, z0 + .08, z0 + .3, WARM, WARM2); qx(.7, .38, .62, z0 + .08, z0 + .3, WARM2); }); lw([.5, .7, z0 + .08], [.5, .7, z0 + .3], dk(c, .4));
      octRoof(.5, .5, z0 + .38, low ? .62 : .5, .3, w ? SNOW : dk(c, .1), w ? SNOW2 : dk(c, .2), { n: 4, eave: .07, snow: false }); ball(.5, .5, z0 + .76, .09, c);
      if (p.moss && !w) { const s = P(.42, .52, z0 + .55); for (const d of [[0, 0], [1, 0], [2, 1], [-3, 2], [-2, 2]]) px(s[0] + d[0], s[1] + d[1], C('#6a9a4a')); }
    },
  },
  {
    id: 'prop.park.bridge', kind: 'prop', tags: ['park', 'bridge', 'footbridge', 'stream', 'water', 'walkable', 'path'], solid: false, size: p => [p.len || 4, 2, 1.6], vb: p => [-.3, -.3, -.6, (p.len || 4) + .3, 2.3, 2.2],
    variants: [{ len: 4 }, { len: 6, kind: 'red' }, { len: 4, kind: 'stone' }, { len: 6, flat: true }, { len: 8, kind: 'stone' }],
    draw(p) {
      // Walkable deck along x, 2 wide. Deck height: z = rise * sin(pi * x / len) with rise 0.6 (0 with flat: true -> deck at z = 0.25); ends meet the ground at z ~ 0.1. Spans a gap below (drawn down to z = -0.6).
      const L = p.len || 4, k = p.kind || 'wood', rise = p.flat ? 0 : .6, base = p.flat ? .25 : .1, c = { wood: '#b08a5a', red: '#c8402a', stone: '#b9b4a8' }[k], w = winter(), N = Math.round(L * 3);
      const zf = t => base + rise * Math.sin(t * Math.PI), rc = k === 'red' ? '#c8402a' : k === 'stone' ? '#c8c2b4' : '#8a6a45';
      const railing = y => { for (let i = 0; i <= N; i += (k === 'stone' ? 1 : 3)) { const t = i / N; if (k === 'stone') { const s = P(t * L, y, zf(t)); for (let j = 1; j < 9; j++) for (let q = -1; q <= 1; q++) if (i % 2 === 0) px(s[0] + q, s[1] - j, C(q < 0 ? rc : dk(rc, .2))); } else pole(Math.min(L - .05, Math.max(.05, t * L)), y, zf(t), zf(t) + (i === 0 || i === N ? .95 : .8), rc, i === 0 || i === N ? 3 : 2, k !== 'wood' || i === 0 || i === N); }
        for (let i = 0; i < N; i++) { const a = i / N, b = (i + 1) / N; tube([a * L, y, zf(a) + .75], [b * L, y, zf(b) + .75], w ? SNOW : lt(rc, .12), k === 'stone' ? 3 : 2); if (k !== 'stone') lw([a * L, y, zf(a) + .4], [b * L, y, zf(b) + .4], dk(rc, .15)); } };
      railing(.08);
      for (let i = 0; i < N; i++) { const a = i / N, b = (i + 1) / N; fq([[a * L, 0, zf(a)], [b * L, 0, zf(b)], [b * L, 2, zf(b)], [a * L, 2, zf(a)]], w ? (i % 2 ? SNOW : SNOW2) : k === 'stone' ? (i % 2 ? c : lt(c, .06)) : (i % 2 ? c : dk(c, .1))); }
      // +y side: stone arch or timber beam with the dark underside
      for (let i = 0; i < N; i++) { const a = i / N, b = (i + 1) / N, u = t => k === 'stone' ? Math.min(zf(t) - .15, -.6 + 1.0 * Math.sin(t * Math.PI)) : zf(t) - .22; fq([[a * L, 2, zf(a)], [b * L, 2, zf(b)], [b * L, 2, u(b)], [a * L, 2, u(a)]], k === 'stone' ? PAT.stone(dk(c, .18)) : dk(c, .3)); lw([a * L, 2, u(a)], [b * L, 2, u(b)], dk(c, .65)); lw([a * L, 2, zf(a)], [b * L, 2, zf(b)], lt(c, .3)); }
      if (k !== 'stone') for (const x of [.3, L - .3]) pole(x, 1.95, -.6, zf(x / L) - .2, dk(c, .4), 3, false);
      railing(1.92);
      if (k === 'red') for (const x of [.05, L - .05]) { const s = P(x, 1.92, zf(x / L) + .95); for (let i = -2; i <= 1; i++) px(s[0] + i, s[1] - 1, C('#2a2433')); px(s[0] - 1, s[1] - 2, C('#e8c85a')); px(s[0], s[1] - 2, C('#e8c85a')); }
    },
  },
  {
    id: 'prop.park.boathut', kind: 'prop', tags: ['park', 'boat', 'rental', 'hut', 'pond', 'water', 'harbor', 'shop', 'lit'], solid: true, size: [5, 3, 3.2], vb: [-.3, -.3, 0, 5.4, 3.6, 3.8], use: { x: 1.5, y: 3.4 }, light: { x: 1.5, y: 3.3, z: 0, r: 3.5 },
    variants: [{}, { c: '#e8dcc0', roof: '#3b7bd8', name: 'KAYAKS' }, { c: '#c8402a', roof: '#3a3440', name: 'RENTAL' }],
    draw(p) {
      const c = p.c || '#5a9ab0', roof = p.roof || '#8a4b3a', w = winter();
      box(0, 0, 0, 3, 2.4, 2.1, c, { l: PAT.siding(dk(c, .18), 3), r: PAT.siding(dk(c, .36), 3) });
      qy(.3, 1.9, 2.4, .9, 1.75, '#2a2433'); glow(() => qy(.3, 1.9, 2.4, .9, 1.75, '#ffd98a', '#f4c870')); lit(() => { for (let i = 0; i < 4; i++) { const q = P(.5 + i * .35, 2.405, 1.6); for (let j = 0; j < 5; j++) px(q[0], q[1] + j, C(['#f08a1c', '#d8342c', '#ffd23a', '#f08a1c'][i])); px(q[0] + 1, q[1] + 1, C('#f4f0e0')); } });
      box(.2, 2.4, .8, 1.8, .3, .1, '#c9a268'); qy(2.1, 2.8, 2.4, 0, 1.7, dk(c, .45)); qy(2.2, 2.7, 2.405, .9, 1.5, '#7fb6d0'); const dq = P(2.25, 2.405, .85); px(dq[0], dq[1], C('#e8c85a'));
      winX(3, .6, 1.8, .9, 1.7, { on: true, mullion: 'cross', frame: '#f4f0e6', sill: true });
      ring(2.45, 2.42, 1.85, 4, '#f4f0e0', 4); ring(2.45, 2.42, 1.85, 3, '#d8342c', 3); tube([.08, 2.45, 0], [.2, 2.42, 1.9], '#c9a268', 1); const o = P(.2, 2.42, 1.9); for (let j = 0; j < 5; j++) { px(o[0], o[1] - j, C('#c9a268')); px(o[0] + 1, o[1] - j, C('#a8824a')); px(o[0] - 1, o[1] - j, C('#c9a268')); }
      gable(0, 0, 2.1, 3, 2.4, 1.0, 'x', w ? SNOW : roof, { wall: c, over: .25, f: w ? null : PAT.shingle(roof) }); signY(String(p.name || 'BOATS').slice(0, 6), .5, 2.5, 2.68, 1.82, 2.2, '#f4f0e0', dk(c, .4), { lit: true });
      stringLights([-.2, 2.66, 1.95], [3.2, 2.66, 1.95], .08, [WARM, WARM2]);
      // boat rack: two rowboats stacked upside-down beside the hut, one ready on the ground
      for (const y of [.5, 1.9]) { pole(3.5, y, 0, 1.3, '#8a6a45', 2, false); pole(4.8, y, 0, 1.3, '#8a6a45', 2, false); }
      rowboat(3.3, .7, .15, 1.8, '#d8342c', { cover: '#b82a24' }); rail([3.5, 1.9, .75], [4.8, 1.9, .75], '#8a6a45', 2); rowboat(3.3, .7, .8, 1.8, '#ffd23a', { cover: '#e8b63a' }); rail([3.5, 1.9, 1.3], [4.8, 1.9, 1.3], '#8a6a45', 2);
      rowboat(3.2, 2.1, 0, 1.8, '#3b7bd8');
    },
  },
  {
    id: 'prop.park.rowboat', kind: 'prop', tags: ['park', 'boat', 'rowboat', 'pond', 'water', 'harbor', 'floating'], solid: true, size: [3, 1, .5], vb: [-.3, -.4, 0, 3.3, 1.4, 1.2], seats: [{ x: 1, y: .5, z: .3, dir: 0 }, { x: 1.9, y: .5, z: .3, dir: 0 }],
    variants: [{}, { c: '#3b7bd8' }, { c: '#f4f0e6', swan: true }, { c: '#4fa850', oars: false }],
    draw(p) {
      // floats at z = 0 (place on water)
      const c = p.c || '#d8342c'; const s = PW(1.5, .55, 0); ellipse(s[0], s[1] + 2, 30, 9, '#2a4f6a50', 'glass');
      rowboat(.1, 0, 0, 2.8, c);
      if (p.swan) { ball(2.45, .5, .55, .22, '#ffffff', { d: '#cfdcea' }); tube([2.6, .5, .6], [2.75, .5, 1.05], '#ffffff', 3); ball(2.85, .5, 1.1, .1, '#ffffff', { d: '#cfdcea' }); const q = P(2.98, .5, 1.08); px(q[0], q[1], C('#f08a1c')); px(q[0] + 1, q[1], C('#f08a1c')); px(q[0] - 2, q[1] - 1, C('#2a2433')); }
      else if (p.oars !== false) { tube([1.5, .85, .35], [1.9, 1.35, .05], '#c9a268', 1); tube([1.5, .15, .35], [1.9, -.3, .1], '#a8824a', 1); const q = P(1.9, 1.35, .05); px(q[0], q[1], C('#e8d8a8')); px(q[0] + 1, q[1], C('#e8d8a8')); px(q[0], q[1] + 1, C('#e8d8a8')); }
    },
  },
  {
    id: 'prop.park.infoboard', kind: 'prop', tags: ['park', 'sign', 'map', 'info', 'trail'], solid: true, size: [2, .5, 2], vb: [-.2, -.2, 0, 2.2, .8, 2.5], use: { x: 1, y: .9 }, light: { x: 1, y: .8, z: 0, r: 2 }, variants: [{ name: 'PARK MAP' }, { name: 'TRAILS', c: '#3f7a55' }, { name: 'YOU R HERE', c: '#3d4a54' }],
    draw(p) {
      const c = p.c || '#8a6a45', w = winter();
      pole(.15, .25, 0, 1.9, c, 3, true); pole(1.85, .25, 0, 1.9, c, 3, true); box(.1, .18, .8, 1.8, .14, 1.0, dk(c, .1));
      qy(.2, 1.8, .325, .88, 1.5, '#cfe4b8'); qy(.2, 1.8, .325, .88, 1.5, (u, v) => (u > 14 && u < 20 && v > 2 && v < 7) ? '#6ab8dc' : (hash2(u >> 2, v >> 1, 4) < .3 ? '#8fc878' : null)); const A = P(.25, .325, 1.2); for (let i = 0; i < 22; i++) px(A[0] + i, A[1] + (i >> 1) + Math.round(Math.sin(i * .6) * 2), C('#e8d8a8')); lit(() => { const q = P(.9, .325, 1.25); px(q[0], q[1], C('#ff4a3a')); px(q[0] + 1, q[1], C('#ff4a3a')); px(q[0], q[1] + 1, C('#ff4a3a')); px(q[0] + 1, q[1] + 2, C('#ff4a3a')); });
      signY(String(p.name || 'PARK MAP').slice(0, 10), .2, 1.8, .325, 1.52, 1.76, c, '#f6e8c0', { frame: false });
      gable(.0, .1, 1.82, 2, .3, .25, 'x', w ? SNOW : '#6a4a35', { over: .1, wall: c });
    },
  },
  {
    id: 'prop.park.balloon', kind: 'prop', tags: ['park', 'balloon', 'hotair', 'landmark', 'festival', 'lit'], solid: true, size: [3, 3, 9.5], vb: [-2.2, -2.2, 0, 5.2, 5.2, 10], light: { x: 1.5, y: 1.5, z: 0, r: 5 },
    variants: [{}, { cols: ['#3b7bd8', '#f4f0e6', '#3fa890'] }, { cols: ['#e85a90', '#ffd23a', '#b06ae0'], leaf: false }, { cols: ['#f4f0e6', '#d8342c'] }],
    draw(p) {
      // tethered hot-air balloon: basket (1x1) on the ground at the centre, envelope overhead (z 3..9.5), four tether ropes to stakes at the corners
      const cols = p.cols || ['#d8342c', '#f6c83a', '#f08a1c'], cx = 1.5, cy = 1.5, w = winter();
      shadow(cx, cy, 0, 1.6);
      for (const [x, y] of [[.1, .1], [2.9, .1]]) { lw([x, y, 0], [cx, cy, 4.3], '#c9b88a'); const s = P(x, y, 0); px(s[0], s[1], C('#6b4a2f')); px(s[0], s[1] - 1, C('#6b4a2f')); }
      // envelope: teardrop with shaded vertical gores
      const C0 = PW(cx, cy, 6.9), Rx = 2.35 * U * 1.18, top = C0[1] - 2.55 * U, mouthY = PW(cx, cy, 3.25)[1], nG = 12, pc = cols.map(c => [lt(c, .22), c, dk(c, .2), dk(c, .38)].map(C)), oc = C(dk(cols[0], .7));
      const hwAt = Y => { if (Y <= C0[1]) { const t = (C0[1] - Y) / (C0[1] - top); return Rx * Math.sqrt(Math.max(0, 1 - t * t)); } const t = (Y - C0[1]) / (mouthY - C0[1]); return Rx * (Math.cos(t * 1.5708) * .86 + .14) * (1 - t * .1); };
      for (let Y = Math.floor(top); Y <= mouthY; Y++) { const hw = hwAt(Y + .5); if (hw < .5) continue; const x0 = Math.ceil(C0[0] - hw), x1 = Math.floor(C0[0] + hw);
        for (let X = x0; X <= x1; X++) { const k = (X + .5 - C0[0]) / hw, th = Math.asin(Math.max(-1, Math.min(1, k))), g = Math.floor((th / Math.PI + .5) * nG * .999), v = (Y - top) / (mouthY - top); let band = cols[g % cols.length], ci = g % cols.length; if (v > .52 && v < .6) ci = (ci + 1) % cols.length;
          const li = -k * .6 - (v - .45) * .9 + (((X + Y) & 1) ? .08 : -.08), sh = li > .55 ? 0 : li > -.1 ? 1 : li > -.6 ? 2 : 3; px(X, Y, pc[ci][sh]); if (w && v < .12 - Math.abs(k) * .05) px(X, Y, C(k < .2 ? SNOW : SNOW2)); }
        px(x0 - 1, Y, oc); px(x1 + 1, Y, oc); }
      for (let X = Math.ceil(C0[0] - 6); X <= C0[0] + 6; X++) px(X, Math.floor(top) - 1 + (Math.abs(X - C0[0]) > 4 ? 1 : 0), oc);
      if (p.leaf !== false) { const L = ['......#......', '.....###.....', '..#..###..#..', '..#########..', '#############', '.###########.', '..#########..', '.#####.#####.', '......#......'], q = [Math.round(C0[0]) - 13, Math.round(C0[1]) - 14]; L.forEach((r, v) => { for (let u = 0; u < 13; u++) if (r[u] === '#') for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) px(q[0] + u * 2 + i, q[1] + v * 2 + j, C('#fff8e0')); }); }
      const m = PW(cx, cy, 3.25); ellipse(m[0], m[1], Rx * .2, 2.5, dk(cols[0], .6)); glow(() => { for (let Y = Math.round(mouthY) - 34; Y <= mouthY; Y++) { const hw = hwAt(Y + .5) * .8, t = (mouthY - Y) / 34; for (let X = Math.ceil(C0[0] - hw); X <= C0[0] + hw; X++) if (((X + Y) & 1) && hash2(X >> 1, Y >> 1, 3) > t) px(X, Y, C(t < .4 ? '#ffd98a' : '#f4a850')); } });
      // burner + flame, basket, ropes
      lit(() => { const f = P(cx, cy, 2.75); for (let j = 0; j < 6; j++) { const hw = j < 2 ? 0 : j < 5 ? 1 : 0; for (let i = -hw; i <= hw; i++) px(f[0] + i, f[1] - j, C(j < 3 && i === 0 ? '#fff8d0' : j < 4 ? '#ffd23a' : '#ff8a3a')); } });
      for (const [dx, dy] of [[-.4, -.4], [.4, -.4]]) lw([cx + dx, cy + dy, 1.3], [cx + dx * 1.2, cy + dy * 1.2, 3.3], '#6b4a2f');
      box(cx - .5, cy - .5, .3, 1, 1, .9, '#b8824a', { l: (u, v) => ((u >> 1) + (v >> 1)) % 2 ? '#a8723c' : '#c8925a', r: (u, v) => ((u >> 1) + (v >> 1)) % 2 ? '#8a5c30' : '#a07040', t: '#5a3a20' }); box(cx - .55, cy - .55, 1.2, 1.1, 1.1, .08, '#6b4a2f', { t: '#5a3a20' }); box(cx - .2, cy - .2, 2.4, .4, .4, .2, '#8a8f9a');
      for (const [dx, dy] of [[-.4, .4], [.4, .4]]) lw([cx + dx, cy + dy, 1.3], [cx + dx * 1.2, cy + dy * 1.2, 3.3], '#8a6a45'); for (const [dx, dy] of [[-.2, .2], [.2, .2], [.2, -.2]]) lw([cx + dx, cy + dy, 1.3], [cx + dx, cy + dy, 2.4], '#3a3440');
      box(cx + .5, cy - .2, .5, .16, .3, .4, '#c8b088', { ol: false }); box(cx - .2, cy + .5, .45, .3, .16, .4, '#d8c098', { ol: false });
      for (const [x, y] of [[.1, 2.9], [2.9, 2.9]]) { lw([x, y, 0], [cx, cy, 4.3], '#e8dcc0'); const s = P(x, y, 0); px(s[0], s[1], C('#6b4a2f')); px(s[0], s[1] - 1, C('#8a6a45')); px(s[0] + 1, s[1] - 2, C('#d8342c')); }
    },
  },
];
