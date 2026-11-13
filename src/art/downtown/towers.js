// Downtown glass towers. Storey = FH (1.75) so 16 floors stay within the sprite budget.
import { box, qy, qx, qz, lw, fq, glow, lit, cyl, cone, hip, rng, dk, lt, mix, PW, px, C, ENV } from '../../engine/raster.js';
import * as K from './_lib.js';
const { FH, FY, FX } = K;

const T = (id, tags, def, maxH, draw, variants, extra = {}) => Object.assign({
  id: 'bld.downtown.' + id, kind: 'building', tags: ['downtown', ...tags], variants,
  size: p => { const q = Object.assign({}, def, p); return [q.w, q.d, maxH(q)[0]]; },
  vb: p => { const q = Object.assign({}, def, p), h = maxH(q); return [-.4, -.4, 0, q.w + .4, q.d + 1.6, h[0] + h[1] + .4]; },
  draw: p => draw(Object.assign({}, def, p)),
}, extra);

/* ---- 1. stepped setback tower ---- */
const setbackDims = q => { const fl = K.capFloors(q.floors, q.w, q.d, 5, FH, 2.5), a = Math.max(2, Math.round(fl * .5)), b = Math.max(1, Math.round(fl * .3)), c = Math.max(1, fl - a - b); return { fl, a, b, c, H: 2.5 + fl * FH }; };
const setback = T('tower.setback', ['tower', 'office', 'glass'], { w: 8, d: 8, floors: 15, seed: 1, glass: '#5fa3c4', frame: '#e4e6e2', accent: '#3d4a54' },
  q => [setbackDims(q).H, 5],
  q => {
    const { w, d, glass, frame } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .42), D = setbackDims(q), s = Math.min(1.25, w * .14);
    K.lobby(w, d, 2.5, { r, accent: q.accent, name: q.name, stone: q.stone });
    const o = { L, glass, frame, bay: q.bay || .7, fin: q.fin };
    let z = 2.5;
    K.glassBox(0, 0, z, w, d, D.a * FH, o); z += D.a * FH;
    // terrace 1: garden strip behind tier 2
    K.glassBox(s, s, z, w - 2 * s, d - 2 * s, D.b * FH, Object.assign({}, o, { f0: D.a }));
    K.garden(.3, w - .3, d - s + .15, d - .25, z, r, { low: true }); K.garden(w - s + .15, w - .25, .3, d - s, z, r, { low: true });
    z += D.b * FH;
    K.glassBox(2 * s, 2 * s, z, w - 4 * s, d - 4 * s, D.c * FH, Object.assign({}, o, { f0: D.a + D.b }));
    K.ac(s + .3, d - 2 * s + .1, z, .8); if (w > 8) K.ac(s + 1.6, d - 2 * s + .1, z, .8); K.dish(w - 2 * s + .5, s + .8, z);
    z += D.c * FH;
    const cw = w - 4 * s;
    K.clutter(r, 2 * s + .3, 2 * s + cw - .3, 2 * s + .3, 2 * s + cw - .3, z, 'aAvh', .5, [[2 * s + cw * .3, 2 * s + cw * .3, (x, y) => K.antenna(x, y, z, 4.5)]]);
  },
  [{ w: 8, d: 8, floors: 15, seed: 3 }, { w: 9, d: 7, floors: 12, seed: 8, glass: '#4f9a8e', frame: '#f0e8d8', accent: '#2f6f5f' }, { w: 7, d: 7, floors: 16, seed: 14, glass: '#46689c', frame: '#cfd6de', fin: 3 }, { w: 10, d: 8, floors: 10, seed: 21, glass: '#7a8fb8', frame: '#e8d9c4', accent: '#8a4b3a' }]);



/* ---- 2. rounded-corner tower with helipad ---- */
const roundH = q => 2.5 + K.capFloors(q.floors, q.w, q.d, 3.5, FH, 2.5) * FH + .4;
const round = T('tower.round', ['tower', 'office', 'glass'], { w: 8, d: 8, floors: 14, seed: 1, glass: '#58b0c8', frame: '#f2f0ea', rad: 2.2, stone: '#cfc9bd' },
  q => [roundH(q), 3.5],
  q => {
    const { w, d, glass, frame } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .45), H = roundH(q) - .4, rad = Math.min(q.rad, w / 2 - .6, d / 2 - .6), ins = K.rrect(0, 0, w, d, rad), bb = [0, 0, w, d];
    const st = q.stone, lg = (u, v) => v >= 4 && v < 31 && (Math.floor(u) % 20) >= 3;
    K.extrude(ins, bb, 0, 2.5, (u, v, k) => lg(u, v) ? (v === 24 ? '#2e3440' : dk('#86bcd2', k * .2)) : dk(v < 4 ? dk(st, .2) : st, k * .22), st, { glowf: (u, v, k) => lg(u, v) && v !== 24 ? (k < .5 ? '#ffe6ac' : '#f4cc84') : null });
    const sh = K.glassShader({ L, glass, bay: q.bay || .7, sp: q.band || lt(glass, .75), sph: q.sph || .45, mull: dk(glass, .35), tint: q.glass2 ? (f) => (f % 4 === 3 ? q.glass2 : glass) : null });
    K.extrude(ins, bb, 2.5, H, sh.wall, frame, { glowf: sh.glowf });
    K.extrude(ins, bb, H, H + .4, (u, v, k) => dk(frame, .1 + k * .25), frame);
    K.extrude(K.rrect(.3, .3, w - .3, d - .3, rad - .3), bb, H + .4, H + .4, () => null, dk(frame, .28));
    K.snowTop(1.2, w - 1.2, 1.2, d - 1.2, H + .4);
    const z = H + .4;
    K.antenna(1.3, 1.3, z, 3);
    K.ac(w - 2.6, 1, z); K.hut(1, d - 2.6, z, 1.3, 1.2, 1.2, frame);
    K.helipad(w / 2 + .5, d / 2 + .5, z, Math.min(w, d) * .24);
    const F = FY(d); F.q(w / 2 - 1, w / 2 + 1, 0, 2.05, dk(st, .1)); K.glassDoor(F, w / 2, 0); K.canopy(F, w / 2 - 1.4, w / 2 + 1.4, 2, 1, q.accent || '#3d4a54', { posts: false, trim: '#e8d08a' });
    if (q.name) F.sign(q.name, w / 2 - 1.4, w / 2 + 1.4, 2, 2.4, '#1f2a33', '#ffd98a', { lit: true }, 1.02);
    K.planter(w / 2 - 2.9, d + .2, 1, .5, r); K.planter(w / 2 + 1.9, d + .2, 1, .5, r);
  },
  [{ w: 8, d: 8, floors: 14, seed: 5 }, { w: 9, d: 7, floors: 11, seed: 12, glass: '#3f6f9f', band: '#e8eef2', rad: 2.6 }, { w: 7, d: 7, floors: 16, seed: 19, glass: '#5aa890', band: '#f4e8c8', frame: '#f4e8c8', rad: 2.9 }, { w: 10, d: 8, floors: 9, seed: 23, glass: '#8a7fb8', glass2: '#b89fd0', band: '#f0e6f4', rad: 1.6 }]);

/* ---- 3. slender tower with a lit glass crown and spire ---- */
const crownH = q => 2.5 + K.capFloors(q.floors, q.w, q.d, 8.2, FH, 2.5) * FH;
const crown = T('tower.crown', ['tower', 'office', 'glass', 'landmark'], { w: 7, d: 7, floors: 15, seed: 1, glass: '#4a78a8', frame: '#e6e2d6', crownc: '#7fc4d8', glowc: '#ffe6a0' },
  q => [crownH(q) + 1.3, 7],
  q => {
    const { w, d, glass, frame } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .4), H = crownH(q);
    K.lobby(w, d, 2.5, { r, accent: q.accent || '#8a6a2a', trim: '#e8d08a', name: q.name, stone: q.stone || '#d6cfc2' });
    K.glassBox(0, 0, 2.5, w, d, H - 2.5, { L, glass, frame, bay: .5, fin: 2, finc: frame, sp: dk(glass, .25), sph: .35, m: .25 });
    // crown drum
    const z = H; box(.5, .5, z, w - 1, d - 1, 1.3, frame);
    for (const F of [FX(w - .5), FY(d - .5)]) for (let u = .9; u + .5 <= (F.xf ? d : w) - .9; u += .8) { F.q(u, u + .5, z + .25, z + 1.05, F.sh(dk(glass, .2))); lit(() => F.q(u, u + .5, z + .25, z + 1.05, F.xf ? dk(q.glowc, .1) : q.glowc)); F.l(u, z + .25, u + .5, z + .25, dk(frame, .4)); }
    K.ac(.05, d - 1.4, z, .7);
    const hz = z + 1.3, hw = w - 1.6, hd = d - 1.6, hh = Math.min(hw, hd) * .62, cc = q.crownc;
    hip(.8, .8, hz, hw, hd, hh, cc, { over: 0, l: cc, r: dk(cc, .2) });
    glow(() => hip(.8, .8, hz, hw, hd, hh, q.glowc, { over: 0, l: q.glowc, r: dk(q.glowc, .12) }));
    const rr = Math.min(hw, hd) / 2, ax = [.8 + rr, .8 + hw - rr], ay = [.8 + rr, .8 + hd - rr];
    for (let k = 1; k < 4; k++) { const t = k / 4; lw([.8 + hw * 1 - rr * 0 - (hw - (ax[1])) * 0 - (.8 + hw - ax[1]) * t, .8 + hd - (.8 + hd - ay[1]) * t - 0, hz + hh * t], [.8 + (ax[0] - .8) * t, .8 + hd - (.8 + hd - ay[1]) * t, hz + hh * t], dk(cc, .35)); lw([.8 + hw - (.8 + hw - ax[1]) * t, .8 + (ay[0] - .8) * t, hz + hh * t], [.8 + hw - (.8 + hw - ax[1]) * t, .8 + hd - (.8 + hd - ay[1]) * t, hz + hh * t], dk(cc, .45)); }
    const sx = (ax[0] + ax[1]) / 2, sy = (ay[0] + ay[1]) / 2;
    box(sx - .12, sy - .12, hz + hh - .2, .24, .24, 1.2, frame, { ol: false }); K.antenna(sx, sy, hz + hh + 1, 3.2, { c: '#8a909c' });
    for (const [a, b] of [[.5, d - .8], [w - .8, d - .8], [w - .8, .5]]) { box(a, b, z + 1.3, .3, .3, .7, frame, { ol: false }); cone(a + .15, b + .15, z + 2, .2, .6, '#c9a24a'); }
    if (K.winter()) { fq([[.8, .8 + hd, hz], [.8 + hw, .8 + hd, hz], [.8 + hw - rr * .3, .8 + hd - rr * .3, hz + hh * .3], [.8 + rr * .3, .8 + hd - rr * .3, hz + hh * .3]], K.SNOW, 'glass'); }
  },
  [{ w: 7, d: 7, floors: 15, seed: 2 }, { w: 6, d: 6, floors: 16, seed: 9, glass: '#3f8f86', crownc: '#9fd8c8', frame: '#f0ead8' }, { w: 8, d: 7, floors: 12, seed: 17, glass: '#5a5f9a', crownc: '#b8a8e0', glowc: '#ffc8f0', frame: '#dcd8e4' }, { w: 7, d: 8, floors: 13, seed: 30, glass: '#8a6f4a', crownc: '#e8c06a', frame: '#f0e4c8' }]);

/* ---- 4. banded slab with service core ---- */
const bandH = q => 2.5 + K.capFloors(q.floors, q.w, q.d, 5.5, FH, 2.5) * FH;
const banded = T('tower.banded', ['tower', 'office', 'glass'], { w: 11, d: 6, floors: 13, seed: 1, glass: '#35586e', band: '#f2efe6', core: '#c4bdb0', accent: '#d9562b' },
  q => [bandH(q) + 2, 3.5],
  q => {
    const { w, d, glass, band } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .5), H = bandH(q), cw = 2.4;
    K.lobby(w, d, 2.5, { r, du: cw + (w - cw) / 2, accent: q.accent, name: q.name, stone: q.stone || '#bdb6a8' });
    // core (left end)
    const core = q.core; box(0, 0, 2.5, cw, d, H - 2.5 + 2, core);
    const F = FY(d); for (let z = 3.2; z + 1 < H + 1.6; z += FH) { F.q(.5, .8, z, z + 1.1, '#3a4a5c'); if (L.r() < .5) glow(() => F.q(.5, .8, z, z + 1.1, '#ffd98a')); F.q(1.5, 1.8, z, z + 1.1, '#3a4a5c'); if (L.r() < .5) glow(() => F.q(1.5, 1.8, z, z + 1.1, '#ffd98a')); F.l(.2, z - .35, cw - .2, z - .35, dk(core, .15)); }
    F.q(.95, 1.35, 3, H + 1.2, q.accent); lit(() => F.l(1.15, 3, 1.15, H + 1.2, lt(q.accent, .5), .01));
    K.roofTop(0, 0, H + 2, cw, d, core); K.dish(.8, 1.2, H + 2, 1.1); K.dish(1.5, 2.6, H + 2, .9); K.antenna(1.2, d - 1.2, H + 2, 3);
    // slab
    K.glassBox(cw, 0, 2.5, w - cw, d, H - 2.5, { L, glass, frame: band, bay: .5, sp: band, sph: .75, mull: dk(glass, .18), m: 0, cap: .5, rc: '#8a8f9a' });
    const z = H; K.clutter(r, cw + .4, w - 3.6, .4, d - .3, z, 'aAvsk', .55);
    K.helipad(w - 2, d / 2, z, Math.min(1.6, d * .3));
  },
  [{ w: 11, d: 6, floors: 13, seed: 4 }, { w: 12, d: 7, floors: 10, seed: 11, glass: '#2f5a50', band: '#e8e0cc', accent: '#e8b63a' }, { w: 10, d: 6, floors: 15, seed: 18, glass: '#4a3f5e', band: '#f4f0f0', accent: '#4fb8d0', core: '#a8a4b0' }, { w: 13, d: 6, floors: 8, seed: 26, glass: '#5a4a3a', band: '#f0d8b0', accent: '#b8432a', core: '#d0b898' }]);

/* ---- 5. two-tone interlocking volumes ---- */
const twoH = q => 2.5 + K.capFloors(q.floors, q.w, q.d, 3.5, FH, 2.5) * FH;
const twotone = T('tower.twotone', ['tower', 'office', 'glass'], { w: 9, d: 8, floors: 15, seed: 1, glass: '#2f3f5a', glass2: '#d9a05a', frame: '#3a4050', frame2: '#f0e6d2', accent: '#ffb347', logo: 'MB' },
  q => [twoH(q), 3.5],
  q => {
    const { w, d } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .42), H = twoH(q), wa = Math.round(w * .55), fb = Math.max(2, Math.round((H - 2.5) / FH * .68)), HB = 2.5 + fb * FH;
    K.lobby(w, d, 2.5, { r, accent: q.frame, trim: q.accent, name: q.name, stone: q.stone || '#cfc8ba', du: wa + (w - wa) / 2 - .2 });
    K.glassBox(0, 0, 2.5, wa, d, H - 2.5, { L, glass: q.glass, frame: q.frame, bay: .6, sp: null, hm: true, cap: 1.5 });
    const z = H; K.clutter(r, .4, wa - .3, .4, d - 2.2, z, 'aAvh', .6, [[1, d - 1.6, (x, y) => K.antenna(x, y, z, 3)]]);
    K.bigSign(FY(d), q.logo, .3, wa - .3, H - 1.35, H - .15, null, q.accent, { lit: true, sc: 2 }); K.bigSign(FX(wa), q.logo, .5, 2, H - 1.35, H - .15, null, q.accent, { lit: true, sc: 2 });
    K.neon(FX(wa), .12, HB + .5, .12, H - 1.6, q.accent);
    // lower bright volume
    K.glassBox(wa, 1.5, 2.5, w - wa, d - 1.5, HB - 2.5, { L, glass: q.glass2, frame: q.frame2, bay: .75, sp: lt(q.glass2, .5), sph: .35, f0: 3 });
    K.neon(FY(d), wa, 2.6, wa, HB, q.accent, .03);
    K.garden(wa + .4, w - .4, 1.9, d - 2.6, HB, r); box(wa + .5, d - 2.2, HB, w - wa - 1, .9, .3, '#8a6a4a', { ol: false }); // deck
    for (let x = wa + .8; x < w - .6; x += 1.1) { box(x, d - 1.9, HB + .3, .5, .5, .25, '#f4f0e8', { ol: false }); }
    lw([wa + .3, d - .3, HB + .6], [w - .3, d - .3, HB + .6], '#c8d8e0'); lw([w - .3, 1.8, HB + .6], [w - .3, d - .3, HB + .6], '#c8d8e0');
  },
  [{ w: 9, d: 8, floors: 15, seed: 6 }, { w: 10, d: 7, floors: 12, seed: 13, glass: '#3a6a6a', glass2: '#e8e0d0', frame: '#2a4a4a', accent: '#7dffb0', logo: 'TEAL' }, { w: 8, d: 8, floors: 16, seed: 22, glass: '#5a2f3f', glass2: '#7fb6d0', frame: '#3a2430', frame2: '#e4e6ea', accent: '#ff7a9a', logo: 'RUBY' }, { w: 10, d: 8, floors: 10, seed: 31, glass: '#e4e8ec', glass2: '#3f6f9f', frame: '#f4f4f0', frame2: '#2a3f5a', accent: '#4fb8ff', logo: 'BAY' }]);

/* ---- 6. twin towers on a podium with a skybridge ---- */
const twinD = q => { const pod = 4.5, fl = K.capFloors(q.floors, q.w, q.d, 4.5, FH, pod), f2 = Math.max(3, Math.round(fl * (q.ratio || .78))); return { pod, fl, f2, H: pod + fl * FH }; };
const twin = T('tower.twin', ['tower', 'office', 'glass'], { w: 12, d: 7, floors: 14, seed: 1, glass: '#4f8fb8', glass2: '#4f8fb8', frame: '#e8e6e0', stone: '#c9c2b4', accent: '#2f4f8f' },
  q => [twinD(q).H, 4.5],
  q => {
    const { w, d } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .42), D = twinD(q), wt = Math.floor((w - 2) / 2 * 2) / 2 - .5 > 3 ? Math.round((w - 2.5) / 2 * 2) / 2 : 3, tall1 = q.flipTall, h1 = (tall1 ? D.fl : D.f2) * FH, h2 = (tall1 ? D.f2 : D.fl) * FH, pod = D.pod, st = q.stone;
    // podium: lobby + one retail floor
    K.lobby(w, d, 2.5, { r, accent: q.accent, name: q.name, stone: st });
    box(-.0, 0, 2.5, w, d, pod - 2.5, st);
    K.winGrid(FX(w), 0, d, 2.5, 1, { L, ww: 1.2, wh: 1.2, zo: .35, pitch: 1.7, mullion: 'v' }); K.winGrid(FY(d), 0, w, 2.5, 1, { L, ww: 1.2, wh: 1.2, zo: .35, pitch: 1.7, mullion: 'v' });
    K.cornice(0, 0, w, d, pod - .25, .25, lt(st, .2)); K.roofTop(0, 0, pod, w, d, st);
    const o = { L, frame: q.frame, bay: .6, fin: q.fin };
    const yb = d / 2 - .6, bz = pod + Math.min(h1, h2) * .55;
    K.glassBox(.4, .4, pod, wt, d - .8, h1, Object.assign({ glass: q.glass }, o));
    K.clutter(r, .7, wt, .7, d - .7, pod + h1, 'aAvk', .5, tall1 ? [[1.4, 1.4, (x, y) => K.antenna(x, y, pod + h1, 4)]] : [[.9, d - 2.6, (x, y) => K.tank(x + .7, y + .7, pod + h1)]]);
    // skybridge
    box(.4 + wt, yb, bz, w - .8 - 2 * wt, 1.4, 1.5, q.frame, { ol: false }); const FB = FY(yb + 1.4); FB.win(.4 + wt, w - .4 - wt, bz + .3, bz + 1.2, { on: true, glowc: K.GLOWC.cool }); for (let x = .4 + wt + .5; x < w - .4 - wt; x += .5) FB.l(x, bz + .3, x, bz + 1.2, '#3a4458');
    K.garden(.4 + wt + .15, w - .4 - wt - .15, yb + 1.7, d - .5, pod, r, { low: true });
    K.glassBox(w - .4 - wt, .4, pod, wt, d - .8, h2, Object.assign({ glass: q.glass2, f0: 5 }, o));
    K.clutter(r, w - .1 - wt, w - .7, .7, d - .7, pod + h2, 'aAvk', .5, tall1 ? [] : [[w - .4 - wt / 2, d / 2, (x, y) => K.antenna(x - .8, y - .8, pod + h2, 4)]]);
  },
  [{ w: 12, d: 7, floors: 14, seed: 7 }, { w: 13, d: 7, floors: 12, seed: 15, glass: '#3f7f78', glass2: '#6aa89a', frame: '#f0e8d8', flipTall: true, accent: '#2f6f5f' }, { w: 12, d: 8, floors: 15, seed: 24, glass: '#3a4a7a', glass2: '#5a6aa8', frame: '#d8dce4', ratio: .6, fin: 3 }, { w: 14, d: 7, floors: 10, seed: 33, glass: '#b8864a', glass2: '#3a5a7a', frame: '#f0e4cc', ratio: .85, stone: '#d8c8a8', accent: '#8a4b3a' }]);

export default [setback, round, crown, banded, twotone, twin];
