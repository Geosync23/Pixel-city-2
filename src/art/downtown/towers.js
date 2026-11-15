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
    if (r() < .7) K.bmu(FY(d - s), w * .62, z, 2.2 + Math.floor(r() * 3) * FH);
    z += D.c * FH;
    const cw = w - 4 * s;
    K.rail(FY(d - 2 * s), 2 * s, 2 * s + cw, z); K.rail(FX(w - 2 * s), 2 * s, 2 * s + cw, z);
    K.clutter(r, 2 * s + .3, 2 * s + cw - .3, 2 * s + .3, 2 * s + cw - .3, z, 'aAvhc', .5, [[2 * s + cw * .3, 2 * s + cw * .3, (x, y) => K.antenna(x, y, z, 4.5)]]);
  },
  [{ w: 8, d: 8, floors: 15, seed: 3 }, { w: 9, d: 7, floors: 12, seed: 8, glass: '#4f9a8e', frame: '#f0e8d8', accent: '#2f6f5f' }, { w: 7, d: 7, floors: 16, seed: 14, glass: '#46689c', frame: '#cfd6de', fin: 3 }, { w: 10, d: 8, floors: 10, seed: 21, glass: '#7a8fb8', frame: '#e8d9c4', accent: '#8a4b3a' }]);



/* ---- 2. rounded-corner tower with helipad ---- */
const roundH = q => 2.5 + K.capFloors(q.floors, q.w, q.d, 3.5, FH, 2.5) * FH + .4;
const round = T('tower.round', ['tower', 'office', 'glass'], { w: 8, d: 8, floors: 14, seed: 1, glass: '#58b0c8', frame: '#f2f0ea', rad: 2.2, stone: '#cfc9bd' },
  q => [roundH(q), 3.5],
  q => {
    const { w, d, glass, frame } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .45), H = roundH(q) - .4, rad = Math.min(q.rad, w / 2 - .6, d / 2 - .6), ins = K.rrect(0, 0, w, d, rad), bb = [0, 0, w, d];
    /* four finishes picked by seed, so the same tower repeated across downtown reads as different buildings (colours still come from the params):
       0 helipad (the original) | 1 sky garden + lit sky-lobby floor | 2 white fins + round mechanical penthouse | 3 two-tone glass + lit crown line */
    const kind = q.kind === undefined ? (q.seed * 7 + (q.seed >> 4)) % 4 : q.kind, fhp = Math.round(FH * 16), nf = Math.max(1, Math.round((H - 2.5) / FH)), skyF = Math.round(nf * .62);
    const acc = q.accent || ['#3d4a54', '#2f5a4a', '#7a2f3a', '#8a6a2a'][kind], g2 = q.glass2 || (kind === 3 ? dk(glass, .3) : null);
    const st = q.stone, lg = (u, v) => v >= 4 && v < 31 && (Math.floor(u) % 20) >= 3;
    K.extrude(ins, bb, 0, 2.5, (u, v, k) => lg(u, v) ? (v === 24 ? '#2e3440' : dk('#86bcd2', k * .2)) : dk(v < 4 ? dk(st, .2) : st, k * .22), st, { glowf: (u, v, k) => lg(u, v) && v !== 24 ? (k < .5 ? '#ffe6ac' : '#f4cc84') : null });
    const bayu = q.bay || .7, bayp = Math.round(bayu * 16);
    const sh = K.glassShader({ L, glass, bay: bayu, sp: q.band || lt(glass, .75), sph: q.sph || (kind === 2 ? .3 : .45), mull: dk(glass, .35), tint: kind === 1 ? (f) => (f === skyF ? dk(glass, .38) : glass) : g2 ? (f) => (f % 4 === 3 ? g2 : glass) : null });
    const finc = q.band || lt(glass, .75), shade = (c, k) => k < .25 ? c : k < .5 ? dk(c, .06) : k < .75 ? dk(c, .11) : dk(c, .17);
    const wallf = kind === 2 ? (u, v, k) => { const bi = Math.floor(u / bayp), uu = Math.floor(u) - bi * bayp; return bi % 3 === 0 && uu < 2 ? shade(uu ? dk(finc, .18) : finc, k) : sh.wall(u, v, k); } : sh.wall;
    const glowf = kind === 1 ? (u, v, k) => { const fi = Math.floor(v / fhp), vv = v - fi * fhp; if (fi !== skyF) return sh.glowf(u, v, k); return vv > 7 && Math.floor(u) % bayp ? (k < .5 ? '#ffe2a0' : '#f4c878') : null; }
      : kind === 2 ? (u, v, k) => { const bi = Math.floor(u / bayp), uu = Math.floor(u) - bi * bayp; return bi % 3 === 0 && uu < 2 ? null : sh.glowf(u, v, k); } : sh.glowf;
    K.extrude(ins, bb, 2.5, H, wallf, frame, { glowf });
    const crownc = lt(acc, .5);
    K.extrude(ins, bb, H, H + .4, (u, v, k) => kind === 3 && v >= 2 && v <= 3 ? acc : dk(frame, .1 + k * .25), frame, kind === 3 ? { glowf: (u, v) => v >= 2 && v <= 3 ? crownc : null } : {});
    K.extrude(K.rrect(.3, .3, w - .3, d - .3, rad - .3), bb, H + .4, H + .4, () => null, dk(frame, .28));
    K.snowTop(1.2, w - 1.2, 1.2, d - 1.2, H + .4);
    const z = H + .4;
    if (kind === 1) { /* sky garden: lawn, trees, a little glazed pavilion */
      K.hut(1, d - 2.6, z, 1.3, 1.2, 1.2, frame); K.garden(2.5, w - 1.3, 1.3, d - 1.4, z, rng(q.seed + 5)); K.antenna(1.3, 1.3, z, 3);
      box(w - 2.9, d - 2.7, z + .22, 1.4, 1.1, .8, '#8fc4d6', { t: frame }); glow(() => { qy(w - 2.8, w - 1.6, d - 1.6, z + .3, z + .95, '#ffe6ac'); });
    } else if (kind === 2) { /* round mechanical penthouse with a lit ring */
      const cx = w / 2 + .3, cy = d / 2 + .3, pr = Math.min(w, d) * .27;
      K.ac(w - 2.4, .9, z); K.hut(.9, d - 2.5, z, 1.2, 1.1, 1.1, frame);
      K.extrude(K.circ(cx, cy, pr), bb, z, z + 1.3, (u, v, k) => v > 15 && v < 19 ? acc : v > 5 && v < 13 ? (Math.floor(u) % 6 ? dk(glass, .15 + k * .2) : dk(glass, .5)) : dk(frame, .12 + k * .25), dk(frame, .2), { glowf: (u, v) => v > 15 && v < 19 ? crownc : null });
      K.antenna(cx, cy, z + 1.3, 3.2);
    } else {
      K.antenna(1.3, 1.3, z, 3);
      K.ac(w - 2.6, 1, z); K.hut(1, d - 2.6, z, 1.3, 1.2, 1.2, frame);
      K.helipad(w / 2 + .5, d / 2 + .5, z, Math.min(w, d) * .24);
    }
    const F = FY(d); F.q(w / 2 - 1, w / 2 + 1, 0, 2.05, dk(st, .1)); K.glassDoor(F, w / 2, 0); K.canopy(F, w / 2 - 1.4, w / 2 + 1.4, 2, 1, acc, { posts: false, trim: '#e8d08a' });
    if (q.name) F.sign(q.name, w / 2 - 1.4, w / 2 + 1.4, 2, 2.4, '#1f2a33', '#ffd98a', { lit: true }, 1.02);
    K.planter(w / 2 - 2.9, d + .2, 1, .5, r); K.planter(w / 2 + 1.9, d + .2, 1, .5, r);
    K.art(['sphere', 'arc', 'cubes', 'fountain'][q.seed % 4], .7, d - .1, r); K.art('bench', w - .9, d - .3, r); if (kind !== 1 && kind !== 2) K.cooling(w - 2.4, d - 2.8, z, .8);
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
    K.glassBox(cw, 0, 2.5, w - cw, d, H - 2.5, { L: K.lights(q.seed + 1, .34), glass, frame: band, bay: .5, sp: band, sph: .75, mull: dk(glass, .18), m: 0, cap: .5, rc: '#8a8f9a' });
    const z = H; K.clutter(r, cw + .4, w - 3.6, .4, d - .3, z, 'aAvsk', .55);
    K.helipad(w - 2, d / 2, z, Math.min(1.6, d * .3));
    K.bmu(FY(d), cw + 1.6 + r() * 2, z, 1.5 + Math.floor(r() * 4) * FH); K.rail(FX(w), .2, d - .2, z);
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
    const z = H; K.clutter(r, .4, wa - .3, .4, d - 2.2, z, 'aAvhc', .6, [[1, d - 1.6, (x, y) => K.antenna(x, y, z, 3)]]);
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
    const { w, d } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .42), D = twinD(q), wt = Math.floor((w - .8 - 2.6) / 2 * 2) / 2, tall1 = q.flipTall, h1 = (tall1 ? D.fl : D.f2) * FH, h2 = (tall1 ? D.f2 : D.fl) * FH, pod = D.pod, st = q.stone;
    // podium: lobby + one retail floor
    K.lobby(w, d, 2.5, { r, accent: q.accent, name: q.name, stone: st });
    box(-.0, 0, 2.5, w, d, pod - 2.5, st);
    K.winGrid(FX(w), 0, d, 2.5, 1, { L, ww: 1.2, wh: 1.2, zo: .35, pitch: 1.7, mullion: 'v' }); K.winGrid(FY(d), 0, w, 2.5, 1, { L, ww: 1.2, wh: 1.2, zo: .35, pitch: 1.7, mullion: 'v' });
    K.cornice(0, 0, w, d, pod - .25, .25, lt(st, .2)); K.roofTop(0, 0, pod, w, d, st);
    const o = { L, frame: q.frame, bay: .6, fin: q.fin };
    const yb = d - 2.3, bz = pod + Math.min(h1, h2) * .55;
    K.glassBox(.4, .4, pod, wt, d - .8, h1, Object.assign({ glass: q.glass }, o));
    K.clutter(r, .7, wt, .7, d - .7, pod + h1, 'aAvk', .5, tall1 ? [[1.4, 1.4, (x, y) => K.antenna(x, y, pod + h1, 4)]] : [[.9, d - 2.6, (x, y) => K.tank(x + .7, y + .7, pod + h1)]]);
    // skybridge
    box(.4 + wt, yb, bz, w - .8 - 2 * wt, 1.4, 1.5, q.frame, { ol: false }); const FB = FY(yb + 1.4); FB.win(.4 + wt, w - .4 - wt, bz + .3, bz + 1.2, { on: true, glowc: K.GLOWC.cool }); for (let x = .4 + wt + .5; x < w - .4 - wt; x += .5) FB.l(x, bz + .3, x, bz + 1.2, '#3a4458');
    K.garden(.4 + wt + .2, w - .4 - wt - .2, d - 1.6, d - .4, pod, r, { low: true });
    K.glassBox(w - .4 - wt, .4, pod, wt, d - .8, h2, Object.assign({ glass: q.glass2, ph: 7 }, o));
    K.clutter(r, w - .1 - wt, w - .7, .7, d - .7, pod + h2, 'aAvk', .5, tall1 ? [] : [[w - .4 - wt / 2, d / 2, (x, y) => K.antenna(x - .8, y - .8, pod + h2, 4)]]);
  },
  [{ w: 12, d: 7, floors: 14, seed: 7 }, { w: 13, d: 7, floors: 12, seed: 15, glass: '#3f7f78', glass2: '#6aa89a', frame: '#f0e8d8', flipTall: true, accent: '#2f6f5f' }, { w: 12, d: 8, floors: 15, seed: 24, glass: '#3a4a7a', glass2: '#5a6aa8', frame: '#d8dce4', ratio: .6, fin: 3 }, { w: 14, d: 7, floors: 10, seed: 33, glass: '#b8864a', glass2: '#3a5a7a', frame: '#f0e4cc', ratio: .85, stone: '#d8c8a8', accent: '#8a4b3a' }]);



/* ---- 7. art-deco tower: stone piers, setbacks, floodlit crown ---- */
const decoD = q => { const fl = K.capFloors(q.floors, q.w, q.d, 8.5, FH, 3), a = Math.max(2, Math.round(fl * .55)), b = Math.max(1, Math.round(fl * .27)), c = Math.max(1, fl - a - b); return { fl, a, b, c, H: 3 + fl * FH }; };
function decoTier(x, y, z, w, d, nf, q, L, f0) {
  const st = q.stone, h = nf * FH; box(x, y, z, w, d, h, st);
  for (const F of [FX(x + w), FY(y + d)]) {
    const a0 = F.xf ? y : x, a1 = a0 + (F.xf ? d : w);
    K.winGrid(F, a0, a1, z, nf, { L, fh: FH, ww: .42, wh: 1.05, zo: .5, pitch: .95, m: .5, sill: false, f0, frame: dk(q.metal, .3), glass: ['#5d8fa8', '#6e9fb6'],
      each: (u, zz) => { F.q(u, u + .42, zz - .45, zz - .04, F.sh(q.metal)); F.l(u + .21, zz - .45, u + .21, zz - .04, F.sh(lt(q.metal, .3))); F.l(u - .2, z, u - .2, z + h, F.sh(lt(st, .35))); F.l(u + .62, z, u + .62, z + h, F.sh(dk(st, .2))); } });
    for (let u = a0 + .1; u < a1 - .2; u += .5) { F.q(u, u + .25, z + h - .22, z + h - .06, F.sh(q.metal)); }
  }
  K.roofTop(x, y, z + h, w, d, st);
}
const deco = T('tower.deco', ['tower', 'office', 'artdeco', 'landmark'], { w: 8, d: 8, floors: 14, seed: 1, stone: '#d8c8a4', metal: '#8a6a3a', crownc: '#5fae9c', glowc: '#ffc56a', name: '' },
  q => [decoD(q).H, 8],
  q => {
    const { w, d, stone: st } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .38), D = decoD(q), s = Math.min(1, w * .12), FYd = FY(d), FXw = FX(w), base = dk(st, .12);
    // base with tall entrance
    box(0, 0, 0, w, d, 3, base, { l: K.PATs(dk(base, .18)), r: K.PATs(dk(base, .36)) });
    for (const F of [FXw, FYd]) { const n = F.xf ? d : w; for (let u = .7; u + 1.1 <= n - .5; u += 1.8) { if (!F.xf && Math.abs(u + .55 - w / 2) < 1.6) continue; K.shopGlass(F, u, u + 1.1, .5, 2.3, { bayw: .55, frame: dk(q.metal, .35) }); F.q(u, u + 1.1, 2.3, 2.6, F.sh(q.metal)); } }
    FYd.q(w / 2 - 1.2, w / 2 + 1.2, 0, 2.8, dk(base, .25)); FYd.q(w / 2 - .9, w / 2 + .9, 0, 2.5, dk(q.metal, .4));
    K.glassDoor(FYd, w / 2, 0, { w: 1.3, h: 1.8, frame: dk(q.metal, .4) });
    lit(() => { for (let k = 0; k < 5; k++) FYd.l(w / 2, 1.95, w / 2 - .8 + k * .4, 2.45, '#ffd98a', .01); FYd.l(w / 2 - .85, 2.5, w / 2 + .85, 2.5, '#ffd98a', .01); });
    K.sconce(FYd, w / 2 - 1.45, 1.7); K.sconce(FYd, w / 2 + 1.45, 1.7);
    if (q.name) FYd.sign(q.name, w / 2 - 1.6, w / 2 + 1.6, 2.6, 2.98, dk(q.metal, .5), '#ffd98a', { lit: true });
    K.cornice(0, 0, w, d, 2.85, .2, lt(st, .2));
    let z = 3; decoTier(0, 0, z, w, d, D.a, q, L, 0); z += D.a * FH;
    decoTier(s, s, z, w - 2 * s, d - 2 * s, D.b, q, L, D.a);
    for (const [a, b] of [[.1, d - .5], [w - .5, d - .5], [w - .5, .1]]) { box(a, b, z, .4, .4, .8, st, { ol: false }); cone(a + .2, b + .2, z + .8, .26, .5, q.metal); }
    K.ac(1.8, d - s + .05, z, .7);
    z += D.b * FH;
    decoTier(2 * s, 2 * s, z, w - 4 * s, d - 4 * s, D.c, q, L, D.a + D.b);
    for (const [a, b] of [[s + .1, d - s - .5], [w - s - .5, d - s - .5], [w - s - .5, s + .1]]) { box(a, b, z, .4, .4, .8, st, { ol: false }); cone(a + .2, b + .2, z + .8, .26, .5, q.metal); }
    z += D.c * FH;
    // crown: stepped lantern, floodlit
    let cx = 2 * s + .5, cw = w - 4 * s - 1, cd = d - 4 * s - 1;
    for (let k = 0; k < 2; k++) {
      const hh = k ? 1.1 : 1.5; box(cx, cx, z, cw, cd, hh, lt(st, .12));
      for (const F of [FX(cx + cw), FY(cx + cd)]) { const n = F.xf ? cd : cw; for (let u = cx + .3; u + .35 <= cx + n - .2; u += .6) { F.q(u, u + .35, z + .25, z + hh - .2, F.sh('#4a5a6a')); lit(() => F.q(u, u + .35, z + .25, z + hh - .2, F.xf ? dk(q.glowc, .12) : q.glowc)); } glow(() => F.q(cx, cx + n, z, z + hh, q.glowc, 'glass')); }
      z += hh; cx += .5; cw -= 1; cd -= 1;
    }
    cx -= .5; cw += 1; cd += 1;
    const hh = Math.min(cw, cd) * .9; hip(cx, cx, z, cw, cd, hh, K.winter() ? mix(q.crownc, K.SNOW, .5) : q.crownc, { over: .1 });
    glow(() => { fq([[cx, cx + cd, z], [cx + cw, cx + cd, z], [cx + cw / 2, cx + cd / 2, z + hh]], lt(q.crownc, .4), 'glass'); });
    K.antenna(cx + cw / 2, cx + cd / 2, z + hh - .1, 3.4, { c: q.metal });
  },
  [{ w: 8, d: 8, floors: 14, seed: 3, name: 'THE MERIDIAN' }, { w: 9, d: 7, floors: 11, seed: 10, stone: '#c9b8a8', metal: '#5a6a5a', crownc: '#c9a24a', name: 'BAY TRUST' }, { w: 7, d: 7, floors: 15, seed: 27, stone: '#e4dccc', metal: '#3f5a7a', crownc: '#3f6f9f', glowc: '#bfe4ff' }, { w: 10, d: 8, floors: 9, seed: 41, stone: '#c4a890', metal: '#6a3a2a', crownc: '#8a4b3a', name: 'GAZETTE' }]);

/* ---- 8. Hartwell & Finch HQ (enterable office) ---- */
const hfH = q => 4.5 + K.capFloors(q.floors, q.w, q.d, 5.5, FH, 4.5) * FH + 1.6;
const hartwell = T('hartwell', ['tower', 'office', 'hartwell', 'enterable'], { w: 9, d: 8, floors: 12, seed: 1, glass: '#2f4a7a', frame: '#e8e2d2', stone: '#3a4254', gold: '#e8c06a', name: 'HARTWELL & FINCH', logo: 'H&F' },
  q => [hfH(q), 4],
  q => {
    const { w, d, glass, frame, stone: st, gold } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .45), H = hfH(q) - 1.6, FYd = FY(d), FXw = FX(w), du = 4.5;
    // podium
    box(0, 0, 0, w, d, 4.5, st);
    K.scene(FXw, .6, d - .6, .3, 3, 'office', r, { bayw: 1.2, transom: .6, accent: gold, frame: '#22283a' });
    K.scene(FYd, .6, du - 1.5, .3, 3, 'lobby', r, { bayw: 1.2, transom: .6, accent: gold, frame: '#22283a' });
    K.scene(FYd, du + 1.5, w - .6, .3, 3, 'lobby', r, { bayw: 1.2, transom: .6, accent: gold, frame: '#22283a' });
    FYd.q(du - 1.3, du + 1.3, 0, 3.1, lt(st, .12)); K.shopGlass(FYd, du - 1, du + 1, 1.95, 2.9, { bayw: .66 }); K.glassDoor(FYd, du, 0, { w: 1.5, h: 1.8, frame: '#22283a' });
    K.canopy(FYd, du - 1.6, du + 1.6, 1.95, 1.2, '#22283a', { pc: gold, trim: gold });
    const nm = q.name, sc = K.bigW(nm, 2) / 16 <= w - .8 ? 2 : 1;
    K.bigSign(FYd, nm, .4, w - .4, 3.3, 4.2, '#22283a', gold, { lit: true, sc }); FXw.sign(q.logo, d / 2 - 1, d / 2 + 1, 3.4, 4.1, '#22283a', gold, { lit: true });
    K.neon(FYd, .2, 3.2, w - .2, 3.2, gold); K.neon(FXw, .2, 3.2, d - .2, 3.2, dk(gold, .15));
    K.roofTop(0, 0, 4.5, w, d, st, { rc: '#6a7080' });
    // tower
    const s = .75; K.glassBox(s, s, 4.5, w - 2 * s, d - 2 * s, H - 4.5, { L, glass, frame, bay: .6, fin: 2, finc: gold, sp: dk(glass, .3), sph: .35, m: .2, cap: 0, roof: false });
    K.garden(.25, w - .25, d - .62, d - .12, 4.5, r, { low: true });
    // crown band with monogram
    box(s, s, H, w - 2 * s, d - 2 * s, 1.6, '#22283a');
    K.bigSign(FY(d - s), q.logo, s + .3, w - s - .3, H + .2, H + 1.4, null, gold, { lit: true, sc: 2 }); K.bigSign(FX(w - s), q.logo, s + .3, d - s - .3, H + .2, H + 1.4, null, dk(gold, .1), { lit: true, sc: 2 });
    K.neon(FY(d - s), s, H + .05, w - s, H + .05, gold); K.neon(FX(w - s), s, H + .05, d - s, H + .05, dk(gold, .15)); K.neon(FY(d - s), s, H + 1.55, w - s, H + 1.55, gold); K.neon(FX(w - s), s, H + 1.55, d - s, H + 1.55, dk(gold, .15));
    const z = H + 1.6; K.roofTop(s, s, z, w - 2 * s, d - 2 * s, '#3a4254', { rc: '#6a7080' });
    K.antenna(s + 1, s + 1, z, 3.6); K.ac(w - s - 1.6, s + .5, z); K.hut(s + .5, d - s - 2.4, z, 1.4, 1.2, 1.2, '#c9c4b8'); K.garden(s + 2.4, w - s - .5, d - s - 2, d - s - .5, z, r);
    // street
    K.flag(du - 2.2, d, 2.3, 0, '#2f4a7a', gold, { wall: true }); K.flag(du + 2.2, d, 2.3, 0, '#2f4a7a', gold, { wall: true });
    K.planter(du - 3.6, d + .3, 1.2, .55, r, { c: '#22283a' }); K.planter(du + 2.4, d + .3, 1.2, .55, r, { c: '#22283a' }); K.art('arc', .5, d + .9, r, { c: gold });
  },
  [{ seed: 5 }, { seed: 12, floors: 9 }, { seed: 20, floors: 13, glass: '#3a5a5a', gold: '#f0d890', stone: '#2f3a3a' }],
  { door: { side: 'y', at: 4.5 }, light: { x: 4.5, y: 9.2, z: 0, r: 3.5 }, doorFn: () => ({ side: 'y', at: 4.5 }), lightFn: p => ({ x: 4.5, y: (p.d || 8) + 1.2, z: 0, r: 3.5 }) });

/* ---- 9. tower under construction with crane ---- */
const conD = q => { const fl = K.capFloors(q.floors, q.w, q.d, 11, FH, 0), clad = Math.max(1, Math.round(fl * (q.clad === undefined ? .4 : q.clad))); return { fl, clad, H: fl * FH }; };
function lattice(a, b, off, col, n) { const a2 = a.map((v, i) => v + off[i]), b2 = b.map((v, i) => v + off[i]); lw(a, b, col); lw(a2, b2, col); n = n || Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / .5)); for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, P = (s, t) => s.map((v, k) => v + ((s === a ? b : b2)[k] - v) * t); lw(P(a, t0), P(a2, t1), col); if (i % 2 === 0) lw(P(a2, t0), P(a, t1), col); } }
const construction = T('construction', ['tower', 'construction', 'site'], { w: 8, d: 8, floors: 11, seed: 1, glass: '#5fa3c4', conc: '#b8b4aa', crane: '#f2c230', fence: '#3f6f9f', name: 'COMING SOON' },
  q => [conD(q).H, 9],
  q => {
    const { w, d, conc } = q, r = rng(q.seed), D = conD(q), L = K.lights(q.seed, .12), FYd = FY(d), FXw = FX(w);
    // clad floors
    K.glassBox(.3, .3, 0, w - .6, d - .6, D.clad * FH, { L, glass: q.glass, frame: '#dfe3e6', bay: .7, cap: 0, roof: false });
    // bare frame floors
    for (let f = D.clad; f < D.fl; f++) {
      const z = f * FH, top = f === D.fl - 1;
      box(.3, .3, z, w - .6, d - .6, .25, conc);
      if (top) { for (let x = .6; x < w - .5; x += 1.7) for (let y = .6; y < d - .5; y += 1.7) { box(x - .12, y - .12, z + .25, .24, .24, .9 + r() * .5, lt(conc, .1), { ol: false }); lw([x, y, z + 1.2], [x, y, z + 1.9], '#8a4b3a'); lw([x + .08, y, z + 1.2], [x + .08, y, z + 1.8], '#8a4b3a'); } continue; }
      for (const F of [FX(w - .3), FY(d - .3)]) {
        const n = (F.xf ? d : w) - .3; F.q(.3, n, z + .25, z + FH, F.sh('#4a4858'));
        for (let u = .3; u < n - .2; u += 1.7) F.q(u, u + .26, z + .25, z + FH, F.sh(lt(conc, .1)));
        F.l(.3, z + .7, n, z + .7, '#e8843a'); F.l(.3, z + .5, n, z + .5, '#e8843a');
        for (let u = .9; u < n - 1; u += 1.7) { const k = r(); if (k < .3) F.q(u, u + .6, z + .25, z + .6 + r() * .4, F.sh('#a8875a')); else if (k < .42) F.q(u, u + .9, z + .25, z + 1.2, F.sh('#4f9a8e'), 'glass'); else if (k < .55) { glow(() => { F.q(u, u + 1, z + .25, z + FH, '#ffd98a', 'glass'); }); lit(() => F.q(u + .2, u + .3, z + 1.3, z + 1.4, '#fff2c4')); } }
      }
    }
    const H = D.H;
    // scaffolding + netting on +y face above the cladding
    const s0 = D.clad * FH, s1 = Math.min(H - FH, s0 + 3 * FH), SF = FY(d - .1);
    for (let z = s0; z <= s1 + .01; z += FH / 2) SF.l(.4, z, w * .62, z, '#8a909c');
    for (let u = .4; u <= w * .62 + .01; u += .8) SF.l(u, s0, u, s1, '#8a909c');
    SF.q(.4, w * .4, s0 + FH, s1, '#4f9a8e', 'glass');
    // hoist on +x face
    const HX = FX(w + .1); lattice([w + .1, d - 2.2, 0], [w + .1, d - 2.2, H], [0, .7, 0], '#c8343a', Math.round(H / .7)); box(w - .25, d - 2.25, H * .45, .5, .8, 1.1, '#f2c230');
    // crane: mast through the core, jib along +x
    const cx = w * .35, cy = d * .35, mz = H + .25, mh = 7, cr = q.crane, jz = mz + mh;
    lattice([cx - .3, cy + .3, mz], [cx - .3, cy + .3, jz + 1.6], [.6, 0, 0], cr); lattice([cx + .3, cy - .3, mz], [cx + .3, cy - .3, jz], [0, .6, 0], dk(cr, .2));
    const jl = Math.max(6, w * .9), cj = 2.6;
    lattice([cx - cj, cy, jz], [cx + jl, cy, jz], [0, 0, .5], cr); lw([cx - cj, cy + .3, jz], [cx + jl, cy + .3, jz], dk(cr, .25));
    box(cx - cj, cy - .3, jz - .7, 1, .7, .7, '#7a808c'); box(cx - .2, cy + .1, jz - 1, .8, .7, .9, '#f4f0e8'); qy(cx - .1, cx + .5, cy + .8, jz - .7, jz - .3, '#5d8fa8'); glow(() => qy(cx - .1, cx + .5, cy + .8, jz - .7, jz - .3, '#ffd98a'));
    lw([cx, cy, jz + 1.6], [cx + jl * .7, cy, jz + .5], '#4a4f5a'); lw([cx, cy, jz + 1.6], [cx - cj, cy, jz + .5], '#4a4f5a');
    const hx = cx + jl * (.55 + r() * .3), hl = 2 + r() * 3; lw([hx, cy + .15, jz], [hx, cy + .15, jz - hl], '#3a3f4a'); box(hx - .6, cy, jz - hl - .25, 1.2, .3, .22, '#8a4b3a');
    K.beacon(cx, cy, jz + 1.7); K.beacon(cx + jl, cy, jz + .55, 1); K.beacon(cx - cj, cy, jz + .55, 1);
    // site hoarding
    const fc = q.fence; box(0, d - .15, 0, w, .15, 1.3, fc, { l: (u, v) => v > 16 ? '#f4f0e8' : (u % 32 < 1 ? dk(fc, .3) : fc) }); box(w - .15, 0, 0, .15, d, 1.3, fc, { r: (u, v) => v > 16 ? '#f4f0e8' : (u % 32 < 1 ? dk(dk(fc, .3), .2) : dk(fc, .2)) });
    FY(d).sign(q.name, 1, 1 + Math.max(3, (q.name.length * 4 + 6) / 16), .35, .95, '#f4f0e8', '#c8343a', {}, .02);
    FY(d).q(w - 2.6, w - 1, 0, 1.3, '#8a909c', '#6a707c', .02); for (let i = 0; i < 4; i++) fq([[w - 2.6 + i * .4, d + .03, 0], [w - 2.4 + i * .4, d + .03, 0], [w - 2.2 + i * .4, d + .03, .25], [w - 2.4 + i * .4, d + .03, .25]], i % 2 ? '#f2c230' : '#3a3440');
    box(.6, d + .2, 0, .5, .5, .7, '#e8843a', { ol: false }); cone(1.6, d + .5, 0, .18, .5, '#e8843a'); cone(2.1, d + .7, 0, .18, .5, '#e8843a');
    if (K.winter()) K.snowTop(.5, w - .5, .5, d - .5, H + .25);
  },
  [{ w: 8, d: 8, floors: 11, seed: 4 }, { w: 9, d: 7, floors: 8, seed: 13, glass: '#4f9a8e', crane: '#e8843a', clad: .25, fence: '#2f6f5f' }, { w: 7, d: 7, floors: 13, seed: 25, glass: '#46689c', crane: '#f4f0e8', clad: .6, fence: '#8a4b3a', name: 'LOFTS 2027' }],
  { vb: p => { const q = Object.assign({ w: 8, d: 8, floors: 11 }, p), D = conD(q); return [-3, -.4, 0, Math.max(q.w, q.w * .35 + Math.max(6, q.w * .9)) + .6, q.d + 1.4, D.H + 9.6]; } });

export default [setback, round, crown, banded, twotone, twin, deco, hartwell, construction];
