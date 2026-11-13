// Downtown mid-rise office blocks (storey 2.0).
import { box, qy, qx, qz, lw, fq, glow, lit, cyl, rng, dk, lt, mix, PAT } from '../../engine/raster.js';
import * as K from './_lib.js';
const { FY, FX } = K;

/* ---- concrete grid office ---- */
const grid = K.asset('office.grid', ['office', 'midrise'], { w: 9, d: 7, floors: 6, seed: 1, wall: '#d6d0c2', glass: ['#5d93ad', '#74a8c0'], accent: '#c8543a', name: 'OFFICES', board: null },
  q => ({ h: q.floors * 2 + .5, top: 4 }),
  q => {
    const { w, d, floors: fl, wall } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .45), H = fl * 2 + .5;
    box(0, 0, 0, w, d, H, wall);
    for (const F of [FX(w), FY(d)]) {
      const n = F.xf ? d : w, nb = Math.max(2, Math.round((n - .4) / 1.45)), bw = (n - .4) / nb;
      for (let f = 1; f < fl; f++) for (let i = 0; i < nb; i++) {
        const u = .2 + i * bw, z = f * 2;
        F.q(u + .14, u + bw - .14, z + .3, z + 1.75, F.sh(dk(wall, .45)));
        F.win(u + .2, u + bw - .14, z + .3, z + 1.62, { on: L.on(f), glowc: L.col(f), mullion: 'v', frame: '#3e4a58', glass: F.xf ? q.glass.map(c => dk(c, .14)) : q.glass });
        if (r() < .25) F.q(u + .2, u + bw - .14, z + 1.2, z + 1.62, F.sh('#e8e2d0'));     // blinds
        F.l(u + .14, z + .3, u + bw - .14, z + .3, F.sh(lt(wall, .4)));
      }
      for (let f = 1; f <= fl; f++) F.l(0, f * 2, n, f * 2, F.sh(dk(wall, .22)));
      // ground floor: colonnade + shop glass
      K.shopGlass(F, .5, n - .5, .25, 1.7, { bayw: bw, sil: () => { for (let u = 1.2; u < n - 1; u += 2.3) if (F.xf || Math.abs(u - 2) > 1) K.sil(F, u, .25, ['desk', 'plant', 'box'][Math.floor(r() * 3)], '#4a5068'); } });
      for (let i = 0; i <= nb; i++) F.q(.2 + i * bw - .14, .2 + i * bw + .14, 0, 2, F.sh(lt(wall, .08)));
      F.q(0, n, 1.75, 2, F.sh(q.accent));
    }
    const F = FY(d); F.q(1.3, 2.7, 0, 1.75, dk(wall, .3)); K.glassDoor(F, 2, 0, { w: 1.1, h: 1.6 });
    F.sign(q.name, .5, Math.min(w - .5, .5 + (q.name.length * 4 + 8) / 16), 1.76, 2.2, '#22283a', '#fff2c4', { lit: true }, .03);
    K.roofTop(0, 0, H, w, d, wall);
    const ex = [[.7, .7, (x, y) => K.antenna(x, y, H, 2.4)]];
    if (q.board) K.clutter(r, .4, w - .4, .4, d - 1.6, H, 'aAvhks', .6, ex); else K.clutter(r, .4, w - .4, .4, d - .4, H, 'aAvhkst', .6, ex);
    if (q.board) K.billboard(FY(d - .3), w * .15, w * .85, H, 2, q.board, q.boardbg || '#f4e8c8', q.boardfg || ['#c8343a', '#22283a'], { sc: 2, stripe: q.accent });
    K.planter(3.4, d + .25, 1.2, .5, r); if (w > 8) K.planter(w - 2, d + .25, 1.2, .5, r);
  },
  [{ w: 9, d: 7, floors: 6, seed: 2, name: 'MAPLE MUTUAL' }, { w: 8, d: 6, floors: 4, seed: 9, wall: '#c9b8a4', accent: '#2f6f5f', name: 'BAY TIMES', board: ['BAY', 'TIMES'], boardbg: '#22283a', boardfg: ['#fff2c4', '#ffb347'] }, { w: 11, d: 7, floors: 8, seed: 16, wall: '#e4e0d8', accent: '#3f6f9f', glass: ['#4f7fa8', '#6a98bd'], name: 'NORTHLINE' }, { w: 7, d: 7, floors: 5, seed: 28, wall: '#bfc4c8', accent: '#e8b63a', name: 'COWORK', board: ['FRESH', 'COFFEE'], boardbg: '#8a4b3a', boardfg: '#fff2c4' }]);

/* ---- brutalist block ---- */
const brut = K.asset('office.brutalist', ['office', 'midrise', 'brutalist'], { w: 10, d: 8, floors: 6, seed: 1, conc: '#b4ada2', glass: '#3f5568', accent: '#e8843a', name: 'CIVIC CENTRE' },
  q => ({ h: q.floors * 2 + 2.6, top: 3 }),
  q => {
    const { w, d, floors: fl, conc } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .4), z0 = 2.4, H = z0 + fl * 2, cw = 2.6;
    const board = c => (u, v) => v % 8 === 0 ? dk(c, .16) : (u % 24 === 0 ? dk(c, .1) : c);
    // recessed glazed base + pilotis
    box(cw, .8, 0, w - cw - .9, d - 1.7, z0, dk(conc, .35));
    K.shopGlass(FX(w - .9), 1.2, d - 1.3, .2, 2, { bayw: 1.3 }); K.shopGlass(FY(d - .9), cw + .3, w - 1.3, .2, 2, { bayw: 1.3, sil: () => { K.sil(FY(d - .9), w - 2.4, .2, 'desk', '#4a5068'); K.sil(FY(d - .9), cw + 1.2, .2, 'plant', '#4a5068'); } });
    K.glassDoor(FY(d - .9), cw + 2.6, 0, { w: 1.2, h: 1.7 });
    for (let x = cw + 1.5; x < w - .4; x += 2.4) box(x, d - .5, 0, .45, .45, z0, conc, { l: board(dk(conc, .18)), ol: false });
    for (let y = d - .5 - 2.4; y > .3; y -= 2.4) box(w - .5, y, 0, .45, .45, z0, conc, { ol: false });
    // stair core (left), full height + taller
    box(0, 0, 0, cw, d, H + 1.6, conc, { l: board(dk(conc, .18)), r: board(dk(conc, .36)) });
    const FC = FY(d); FC.q(1.1, 1.45, 1, H + 1, '#2e3644'); for (let z = 1; z < H + .8; z += 1) if (L.r() < .55) glow(() => FC.q(1.1, 1.45, z + .1, z + .9, '#ffd98a')); for (let z = 1; z < H + 1; z += 1) FC.l(1.1, z, 1.45, z, dk(conc, .4));
    K.bigSign(FC, q.name.split(' ')[0], .2, cw - .2, .25, .85, null, dk(conc, .55), { sc: 1 });
    K.roofTop(0, 0, H + 1.6, cw, d, conc); K.antenna(.8, 1, H + 1.6, 2.6); K.dish(1.6, d - 1.4, H + 1.6, 1.1);
    // cantilevered upper block with ribbon windows
    box(cw, 0, z0, w - cw, d, fl * 2, conc, { l: board(dk(conc, .18)), r: board(dk(conc, .36)) });
    for (const F of [FX(w), FY(d)]) {
      const a0 = F.xf ? 0 : cw, a1 = F.xf ? d : w;
      for (let f = 0; f < fl; f++) {
        const z = z0 + f * 2 + .75; F.q(a0 + .35, a1 - .35, z - .08, z + .98, F.sh(dk(conc, .5)));
        for (let u = a0 + .4; u + .7 <= a1 - .35; u += .8) { F.q(u, u + .7, z, z + .9, F.sh(q.glass), F.sh(lt(q.glass, .12))); if (L.on(f)) glow(() => F.q(u, u + .7, z, z + .9, L.col(f)[F.xf ? 1 : 0])); }
        F.l(a0 + .35, z + .98, a1 - .35, z + .98, F.sh(dk(conc, .6))); F.l(a0 + .35, z - .08, a1 - .35, z - .08, F.sh(lt(conc, .35)));
      }
      F.q(a0, a1, z0, z0 + .18, F.sh(q.accent));
    }
    K.roofTop(cw, 0, H, w - cw, d, conc);
    for (let x = cw + .8; x + 1.2 < w - .5; x += 2.3) { box(x, 1, H, 1.2, 1.2, .9, conc); fq([[x, 2.2, H + .9], [x + 1.2, 2.2, H + .9], [x + 1.2, 1.6, H + 1.4], [x, 1.6, H + 1.4]], dk(conc, .3)); qy(x + .15, x + 1.05, 2.2, H + .2, H + .7, '#3a3f4a'); }
    K.clutter(r, cw + .5, w - .5, 3, d - .5, H, 'aAvsk', .55);
    K.planter(cw + .3, d + .2, 1.3, .6, r, { c: conc, tree: true });
  },
  [{ w: 10, d: 8, floors: 6, seed: 3 }, { w: 12, d: 7, floors: 4, seed: 14, conc: '#c2b8a8', accent: '#c8343a', name: 'RECORDS OFFICE' }, { w: 9, d: 8, floors: 8, seed: 22, conc: '#a8a8a4', accent: '#f2c230', glass: '#2f4a4a', name: 'TELECOM' }, { w: 11, d: 9, floors: 5, seed: 35, conc: '#b8a898', accent: '#4f9a8e', name: 'INSTITUTE' }]);

/* ---- brick & glass loft offices ---- */
const brick = K.asset('office.brick', ['office', 'midrise', 'brick'], { w: 9, d: 7, floors: 5, seed: 1, wall: '#a8563e', trim: '#e4dccc', glass: '#4f8fae', awn: '#2f6f5f', name: 'STUDIOS' },
  q => ({ h: q.floors * 2 + .6, top: 4 }),
  q => {
    const { w, d, floors: fl, wall, trim } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .5), H = fl * 2 + .6;
    box(0, 0, 0, w, d, H, wall, { l: PAT.brick(dk(wall, .18)), r: PAT.brick(dk(wall, .36)), t: trim });
    for (const F of [FX(w), FY(d)]) {
      const n = F.xf ? d : w, nb = Math.max(2, Math.round((n - .6) / 2)), bw = (n - .6) / nb;
      for (let i = 0; i < nb; i++) {
        const u0 = .3 + i * bw + .3, u1 = .3 + (i + 1) * bw - .3;
        K.curtain(F, u0, u1, 2, fl * 2, { L, fh: 2, glass: q.glass, bay: .5, sp: dk(wall, .3), sph: .45, hm: true, mull: '#2e3644', f0: 1, ph: i });
        F.l(u0, 2, u0, fl * 2, '#2e3644'); F.l(u1, 2, u1, fl * 2, '#2e3644'); F.q(u0 - .05, u1 + .05, fl * 2, fl * 2 + .15, F.sh(trim));
        // street level
        if (!F.xf && i === 0) { F.q(u0, u1, 0, 1.8, dk(wall, .4)); K.glassDoor(F, (u0 + u1) / 2, 0, { w: 1.1, h: 1.65 }); }
        else K.shopGlass(F, u0, u1, .35, 1.7, { bayw: .8, sil: () => K.sil(F, (u0 + u1) / 2, .35, ['plant', 'desk', 'box', 'lamp'][Math.floor(r() * 4)], '#4a5068') });
        if (!(F.xf && i % 2)) K.awning(F, u0 - .1, u1 + .1, 1.8, .7, q.awn, i % 2 ? null : '#f4f0e8');
      }
      F.q(0, n, 1.82, 2, F.sh(trim), undefined, 0);
    }
    FY(d).sign(q.name, .5, .5 + (q.name.length * 4 + 6) / 16, 2.02, 2.42, '#22283a', '#ffd98a', { lit: true });
    K.cornice(0, 0, w, d, H - .3, .3, trim, .15); K.roofTop(0, 0, H, w, d, trim, { rc: '#7a6f6a' });
    K.clutter(r, .4, w - 3, .4, d - .4, H, 'ahvk', .5, [[w - 2.4, .8, (x, y) => K.tank(x + .8, y + .8, H, .75)]]);
    K.garden(w - 2.8, w - .5, d - 2.6, d - .5, H, r);
  },
  [{ w: 9, d: 7, floors: 5, seed: 6 }, { w: 7, d: 6, floors: 4, seed: 11, wall: '#8a4a48', awn: '#c8343a', name: 'PRESSWORKS' }, { w: 11, d: 7, floors: 6, seed: 19, wall: '#c08a5a', trim: '#f0e4cc', awn: '#3f6f9f', glass: '#5a98a8', name: 'FOUNDRY LOFTS' }, { w: 8, d: 8, floors: 3, seed: 37, wall: '#6a5a58', trim: '#d8d2c4', awn: '#e8b63a', name: 'DESIGN LAB' }]);

/* ---- 80s mirrored block with chamfered corner ---- */
const mirror = K.asset('office.mirror', ['office', 'midrise', 'glass', 'mirror'], { w: 9, d: 8, floors: 7, seed: 1, glass: '#c9a04a', stone: '#4a4048', neon: '#ff5fa2', name: 'PLAZA 88', cut: 2.5 },
  q => ({ h: q.floors * 2 + 2.6, top: 3.5 }),
  q => {
    const { w, d, floors: fl, glass } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .28), z0 = 2.4, H = z0 + fl * 2, cut = q.cut, st = q.stone, ins = K.poly(w, d, cut), bb = [0, 0, w, d];
    const lg = (u, v) => v >= 5 && v < 32 && (Math.floor(u) % 22) >= 4;
    K.extrude(ins, bb, 0, z0, (u, v, k) => lg(u, v) ? dk('#86bcd2', k * .22) : dk(v > 33 ? lt(st, .15) : st, k * .25), st, { glowf: (u, v, k) => lg(u, v) ? (k < .5 ? '#ffe6ac' : '#f4cc84') : null });
    const sh = K.glassShader({ L, glass, fh: 2, bay: .5, sp: dk(glass, .28), sph: .3, mull: dk(glass, .14) });
    K.extrude(ins, bb, z0, H, sh.wall, lt(glass, .3), { glowf: sh.glowf });
    // stepped top: smaller mirrored penthouse
    K.extrude(K.poly(w, d, cut), bb, H, H + .2, (u, v, k) => dk(st, k * .25), '#8a8590');
    K.snowTop(.4, w - cut, .4, d - cut, H + .2);
    const pw = w - 2.4, pd = d - 2.4, sh2 = K.glassShader({ L, glass, fh: 2, bay: .5, sp: null, mull: dk(glass, .14), f0: fl });
    K.clutter(r, .4, w - 1.5, .3, 1.4, H + .2, 'av', .5);
    K.extrude((x, y) => x >= 1 && x <= 1 + pw && y >= 1 && y <= 1 + pd && x + y <= 2 + pw + pd - cut * .7, [1, 1, 1 + pw, 1 + pd], H + .2, H + 2.2, sh2.wall, lt(glass, .3), { glowf: sh2.glowf });
    K.antenna(2, 2, H + 2.2, 2.6); K.ac(pw - 1.2, 1.6, H + 2.2); K.dish(2.2, pd - .6, H + 2.2);
    // neon trim + sign on the chamfer (screen-facing)
    const FYd = FY(d), FXw = FX(w);
    K.neon(FYd, 0, H - .1, w - cut, H - .1, q.neon); K.neon(FXw, 0, H - .1, d - cut, H - .1, q.neon); lit(() => lw([w - cut, d, H - .1], [w, d - cut, H - .1], q.neon));
    K.neon(FYd, 0, z0 + .05, w - cut, z0 + .05, q.neon); K.neon(FXw, 0, z0 + .05, d - cut, z0 + .05, q.neon); lit(() => lw([w - cut, d, z0 + .05], [w, d - cut, z0 + .05], q.neon));
    // entrance on +y (flat part)
    FYd.q(1.2, 3.2, 0, 2.1, dk(st, .2)); K.glassDoor(FYd, 2.2, 0, { w: 1.3, h: 1.7, frame: '#2a2430' }); K.canopy(FYd, 1, 3.4, 1.85, .9, st, { posts: false, trim: q.neon });
    FYd.sign(q.name, 3.7, Math.min(w - cut - .2, 3.7 + (q.name.length * 4 + 6) / 16), 1.75, 2.2, '#2a2430', q.neon, { lit: true }, .03);
    K.planter(3.8, d + .25, 1.3, .5, r, { c: st }); K.art(['arc', 'cubes', 'sphere', 'fountain'][q.seed % 4], w - .9, d - .2, r, { c: q.neon });
  },
  [{ w: 9, d: 8, floors: 7, seed: 5 }, { w: 10, d: 8, floors: 5, seed: 15, glass: '#4fa8a0', neon: '#ffe45a', stone: '#3a4a4a', name: 'AQUA COURT' }, { w: 8, d: 8, floors: 8, seed: 29, glass: '#a8b4c4', neon: '#5fd4ff', stone: '#3a4050', name: 'SILVER ONE', cut: 3 }, { w: 11, d: 7, floors: 6, seed: 38, glass: '#b06a4a', neon: '#ffb347', stone: '#4a3a34', name: 'COPPER SQ', cut: 2 }]);

export default [grid, brut, brick, mirror];
