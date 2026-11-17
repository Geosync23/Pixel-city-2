// Downtown civic & commercial landmarks: hotel, department store, bank, city hall, parking garage.
import { box, qy, qx, qz, lw, fq, glow, lit, cyl, cone, gable, rng, dk, lt, mix, PAT, PW, px, C, ENV } from '../../engine/raster.js';
import * as K from './_lib.js';
const { FY, FX } = K;

/* ---- hotel ---- */
const hotel = K.asset('hotel', ['hotel', 'landmark', 'enterable'], { w: 10, d: 7, floors: 8, seed: 1, wall: '#ead9bd', base: '#5a3f3a', accent: '#a8342e', gold: '#e8c06a', name: 'GRAND MAPLE' },
  q => ({ h: 3 + q.floors * 2 + .5, top: 4.2, front: 2.4 }),
  q => {
    const { w, d, floors: fl, wall, base, accent, gold } = q, r = rng(q.seed), L = K.lights(q.seed, q.dens || .5), H = 3 + fl * 2 + .5, FYd = FY(d), FXw = FX(w), du = 5;
    K.lobby(w, d, 3, { r, stone: base, accent, trim: gold, du, shop: 'cafe', shopName: 'BISTRO', side: 'dock', art: 'none', planters: false, awn: accent, name: 'HOTEL' });
    // grand canopy + carpet + topiary
    qz(du - .9, du + .9, d, d + 2, .02, accent, dk(accent, .12)); lw([du - .9, d, .02], [du - .9, d + 2, .02], gold); lw([du + .9, d, .02], [du + .9, d + 2, .02], gold);
    K.canopy(FYd, du - 1.7, du + 1.7, 2.3, 1.9, accent, { pc: gold, trim: gold, th: .3 });
    lit(() => { for (let x = du - 1.6; x <= du + 1.61; x += .4) { const p = PW(x, d + 1.9, 2.42); px(p[0], p[1], C('#fff2c4')); } });
    for (const s of [-1, 1]) { const x = du + s * 2.3; box(x - .25, d + .3, 0, .5, .5, .5, base); lw([x, d + .55, .5], [x, d + .55, .9], '#6b4a2f'); if (K.winter()) { K.art('none', 0, 0, r); } const f = '#3f8a55'; cyl(x, d + .55, .85, .22, .1, f, { ol: false }); cone(x, d + .55, .9, .34, 1, K.winter() ? '#6a9a80' : f); }
    for (const [i, x] of [du - 1.2, du, du + 1.2].entries()) K.flag(x, d, 3.1, 0, [accent, '#2f4a7a', '#f4f0e8'][i], [gold, '#f4f0e8', accent][i], { wall: true });
    // rooms
    box(0, 0, 3, w, d, fl * 2 + .5, wall);
    for (const F of [FXw, FYd]) {
      const n = F.xf ? d : w;
      K.winGrid(F, 0, n, 3, fl, { L, ww: .8, wh: 1.2, zo: .45, pitch: 1.45, m: .6, mullion: 'v', frame: '#5a4a48', glass: ['#6a9ab4', '#80aec4'],
        each: (u, z, f, i, on) => { const cc = F.sh(['#c8543a', '#e8dcc4', '#8a5aa8', '#e8dcc4'][(f * 3 + i) % 4]); F.q(u + .03, u + .16, z + .03, z + 1.17, cc, undefined, .005); F.q(u + .64, u + .77, z + .03, z + 1.17, cc, undefined, .005);
          if ((i + f) % 2 === 0) { F.box(u - .12, 0, z - .14, 1.04, .22, .08, dk(wall, .2), { ol: false }); for (let a = u - .1; a <= u + .92; a += .17) F.l(a, z - .06, a, z + .34, '#4a4048', .22); F.l(u - .12, z + .34, u + .92, z + .34, '#4a4048', .22); } } });
      for (let f = 1; f <= fl; f++) F.l(0, 3 + f * 2 - .05, n, 3 + f * 2 - .05, F.sh(dk(wall, .14)));
      F.q(0, .3, 3, H, F.sh(lt(wall, .25))); F.q(n - .3, n, 3, H, F.sh(lt(wall, .25)));
    }
    K.blade(FYd, .0, 4, 4 + 6 * 7 / 16 + .2, 'HOTEL', accent, '#fff2c4');
    K.cornice(0, 0, w, d, H - .35, .35, lt(wall, .3), .18); K.roofTop(0, 0, H, w, d, wall, { rc: '#b4a898' });
    // roof: pool terrace + lit name sign
    K.hut(.5, .5, H, 1.6, 1.4, 1.4, wall); K.cooling(2.6, .5, H); K.antenna(w - 1, .9, H, 2.6);
    const px0 = w - 5, py0 = d - 3.2; box(px0 - .3, py0 - .3, H, 4.6, 2.4, .12, '#c8a878', { ol: false });
    qz(px0, px0 + 2.6, py0, py0 + 1.5, H + .13, K.winter() ? K.SNOW2 : '#4fc4e0', K.winter() ? K.SNOW : '#6fd4ea'); if (!K.winter()) glow(() => qz(px0, px0 + 2.6, py0, py0 + 1.5, H + .13, '#7fe8ff', '#5fd0f0'));
    for (let i = 0; i < 2; i++) { box(px0 + 3 + i * .6, py0 + .1, H + .12, .4, 1.1, .2, ['#f4f0e8', accent][i], { ol: false }); }
    if (ENV.season < 2) { lw([px0 + 3.5, py0 + 1.5, H + .1], [px0 + 3.5, py0 + 1.5, H + 1.2], '#8a909c'); cone(px0 + 3.5, py0 + 1.5, H + 1, .6, .35, accent); }
    K.billboard(FY(d - .25), .4, .4 + Math.max(4, (K.bigW(q.name, 2) + 14) / 16), H, 1.3, [q.name], '#2a1f2a', gold, { sc: 2, leg: .5 });
  },
  [{ w: 10, d: 7, floors: 8, seed: 3 }, { w: 12, d: 7, floors: 6, seed: 11, wall: '#d9e0e4', base: '#2f3f54', accent: '#2f5f9f', name: 'BAYVIEW' }, { w: 10, d: 7, floors: 10, seed: 21, wall: '#e8c8b4', base: '#3a4a40', accent: '#2f6f5f', name: 'THE LAUREL' }, { w: 11, d: 7, floors: 5, seed: 33, wall: '#c9bcd4', base: '#3a2f4a', accent: '#8a3f8a', name: 'ORCHID INN' }],
  K.entry(5, 7, 4));

/* ---- department store ---- */
const store = K.asset('deptstore', ['store', 'shop', 'landmark', 'enterable'], { w: 12, d: 8, floors: 3, seed: 1, wall: '#e6d6b8', trim: '#f6eedc', accent: '#b8342e', gold: '#e8c06a', name: 'MAPLE & MAIN' },
  q => ({ h: 3 + q.floors * 2.4 + 1, top: 3.6 }),
  q => {
    const { w, d, floors: fl, wall, trim, accent, gold } = q, r = rng(q.seed), L = K.lights(q.seed, .7), fh = 2.4, H = 3 + fl * fh + 1, FYd = FY(d), FXw = FX(w), du = 6;
    box(0, 0, 0, w, d, H, wall);
    for (const F of [FXw, FYd]) {
      const n = F.xf ? d : w, nb = Math.round((n - .6) / 2.2), bw = (n - .6) / nb;
      F.q(0, n, 0, .25, F.sh('#4a4048'));
      for (let i = 0; i < nb; i++) {
        const u0 = .3 + i * bw + .22, u1 = .3 + (i + 1) * bw - .22, mid = (u0 + u1) / 2, isDoor = !F.xf && Math.abs(mid - du) < bw / 2;
        if (isDoor) { F.q(u0, u1, 0, 2.5, '#3a3038'); K.glassDoor(F, du - .5, 0, { w: .9, h: 1.8, frame: '#3a3038', step: false }); K.glassDoor(F, du + .5, 0, { w: .9, h: 1.8, frame: '#3a3038', step: false }); K.shopGlass(F, u0, u1, 1.95, 2.45, { bayw: .5 }); }
        else { K.scene(F, u0, u1, .3, 2.3, (i + (F.xf ? 1 : 0)) % 2 ? 'home' : 'fashion', r, { frame: '#3a3038', bayw: 3, accent }); K.awning(F, u0 - .1, u1 + .1, 2.35, .55, accent, i % 2 ? null : trim, { rise: .3 }); }
        // upper floors: tall windows between pilasters
        for (let f = 0; f < fl; f++) { const z = 3 + f * fh; F.win(u0 + .1, u1 - .1, z + .45, z + 1.95, { on: L.on(f), glowc: L.col(f), mullion: 'cross', sill: true, frame: '#5a4a48', glass: F.xf ? ['#5d8fa8', '#6e9fb6'] : ['#6a9ab4', '#80aec4'] }); F.q(u0 + .1, u1 - .1, z + 1.95, z + 2.12, F.sh(trim)); if (f === 0 && i % 2 === 0 && !isDoor) { F.q(mid - .22, mid + .22, z + .5, z + 1.9, F.sh(accent), undefined, .01); lit(() => K.bigText(F, 'S', F.xf ? mid + .1 : mid - .1, z + 1.75, '#fff2c4', 1, .02)); lit(() => K.bigText(F, 'A', F.xf ? mid + .1 : mid - .1, z + 1.35, '#fff2c4', 1, .02)); lit(() => K.bigText(F, 'L', F.xf ? mid + .1 : mid - .1, z + .95, '#fff2c4', 1, .02)); } }
        F.q(.3 + i * bw - .18, .3 + i * bw + .18, .25, H - 1, F.sh(trim)); F.l(.3 + i * bw + .18, .25, .3 + i * bw + .18, H - 1, F.sh(dk(trim, .25)));
      }
      F.q(n - .48, n - .12, .25, H - 1, F.sh(trim)); F.q(0, n, 2.6, 3, F.sh(trim)); F.l(0, 2.6, n, 2.6, F.sh(dk(trim, .3)));
      if (K.winter()) lit(() => { for (let u = .3; u < n - .2; u += .32) { const p = PW(...F.P(u, .03, 2.82 + Math.sin(u * 5) * .06)); px(p[0], p[1], C(['#ff5a5a', '#ffe45a', '#5affa0', '#5ac8ff'][Math.round(u / .32) % 4])); } });
    }
    // marquee entrance
    K.canopy(FYd, du - 1.6, du + 1.6, 2.5, 1.3, accent, { posts: false, trim: gold, th: .35 });
    lit(() => { for (let x = du - 1.5; x <= du + 1.51; x += .3) { const p = PW(x, d + 1.31, 2.56); px(p[0], p[1], C('#fff2c4')); px(p[0], p[1] + 1, C('#ffd98a')); } });
    K.cornice(0, 0, w, d, H - 1, .25, trim, .15); 
    const nm = q.name, sc = K.bigW(nm, 2) / 16 <= w - 1 ? 2 : 1;
    K.bigSign(FYd, nm, .5, w - .5, H - .72, H - .02, null, K.winter() ? '#fff2c4' : gold, { lit: true, sc }); K.bigSign(FXw, nm.split(' ')[0], .5, d - .5, H - .72, H - .02, null, dk(gold, .08), { lit: true, sc: 2 });
    K.roofTop(0, 0, H, w, d, wall, { rc: '#9a8f88' });
    K.clutter(r, .5, w - .5, .5, d - 2.4, H, 'aAkkhv', .55, [[1, 1, (x, y) => K.cooling(x, y, H)]]);
    K.billboard(FY(d - .4), w * .52, w - .6, H, 1.7, ['WINTER SALE', 'SPRING LOOKS', 'SUMMER SALE', 'AUTUMN STYLE'][(ENV.season + 3) % 4 === 3 ? 0 : ENV.season + 1 > 3 ? 0 : (ENV.season + 1) % 4].split(' '), accent, ['#fff2c4', gold], { sc: 2 });
    K.flag(.4, d - .4, H, 2.2, accent, gold); K.flag(w - .5, .5, H, 2.2, accent, gold);
    K.planter(.6, d + .25, 1.3, .5, r, { c: '#4a4048' }); K.planter(w - 1.9, d + .25, 1.3, .5, r, { c: '#4a4048' }); K.art('bench', du - 3, d + .8, r);
  },
  [{ w: 12, d: 8, floors: 3, seed: 2 }, { w: 14, d: 8, floors: 4, seed: 12, wall: '#d8dce0', trim: '#f4f6f8', accent: '#2f5f8f', name: 'HARBOR HOUSE' }, { w: 12, d: 8, floors: 2, seed: 24, wall: '#e8c4b0', trim: '#fff0e0', accent: '#2f6f5f', gold: '#f0d890', name: 'FINCH & DAUGHTERS' }, { w: 12, d: 9, floors: 4, seed: 36, wall: '#b8a8a0', trim: '#e8e0d8', accent: '#6a2f6a', name: 'THE EMPORIUM' }],
  K.entry(6, 8, 4));

/* ---- bank / realtor ---- */
const bank = K.asset('bank', ['bank', 'realtor', 'enterable'], { w: 8, d: 7, seed: 1, stone: '#e4dccb', roof: '#6a9a8a', gold: '#e8c06a', name: 'MAPLE BAY BANK', sub: 'HOMES & LOANS' },
  q => ({ h: 6.9, top: 2.6, front: 1.8 }),
  q => {
    const { w, d, stone: st, gold } = q, r = rng(q.seed), L = K.lights(q.seed, .5), yb = d - 1.3, FB = FY(yb), FXw = FX(w), du = 4, zc = 4.6;
    // stepped plinth
    for (let i = 0; i < 3; i++) box(-.0 + .0, 0, i * .2, w, d + .9 - i * .3, .2, lt(st, .05 * i), { ol: i === 0 });
    const z0 = .6; box(0, 0, z0, w, yb, zc - z0, st, { l: PAT.stone(dk(st, .18)), r: PAT.stone(dk(st, .36)) });
    // side: tall windows + ATM
    for (let y = .7; y + 1 <= yb - 1.8; y += 1.7) { FXw.win(y, y + 1, z0 + .8, z0 + 3.1, { on: L.r() < .7, mullion: 'cross', sill: true, frame: '#5a4a48', glowc: K.GLOWC.warm }); FXw.q(y - .1, y + 1.1, z0 + 3.1, z0 + 3.3, dk(st, .3)); FXw.q(y - .28, y - .12, z0, zc - .3, dk(st, .28)); }
    FXw.q(yb - 1.5, yb - .5, z0 + .2, z0 + 1.7, '#3a4458'); lit(() => { FXw.q(yb - 1.3, yb - .7, z0 + .95, z0 + 1.45, '#7fe0ff'); FXw.sign('ATM', yb - 1.5, yb - .5, z0 + 1.75, z0 + 2.15, '#2f5f9f', '#ffffff', { frame: false }); }); FXw.q(yb - 1.2, yb - .8, z0 + .55, z0 + .8, '#8a909c');
    FXw.sign(q.sub, .5, .5 + (q.sub.length * 4 + 6) / 16, zc - .1, zc + .3, '#3a3038', gold, { lit: true });
    // front wall behind the colonnade
    K.scene(FB, .5, du - 1, z0 + .3, z0 + 3, 'bank', r, { frame: '#5a4a48', bayw: .9, accent: q.roof }); K.scene(FB, du + 1, w - .5, z0 + .3, z0 + 3, 'bank', r, { frame: '#5a4a48', bayw: .9, accent: q.roof });
    FB.q(du - .8, du + .8, z0, z0 + 3, dk(st, .3)); FB.q(du - .65, du + .65, z0, z0 + 2.5, '#6b4a2f'); FB.q(du - .6, du - .03, z0 + .05, z0 + 2.4, '#8a6a3a'); FB.q(du + .03, du + .6, z0 + .05, z0 + 2.4, '#8a6a3a');
    for (const s of [-1, 1]) { FB.q(du + s * .32 - .2, du + s * .32 + .2, z0 + 1.2, z0 + 2.1, '#8ec4da', undefined, .01); glow(() => FB.q(du + s * .32 - .2, du + s * .32 + .2, z0 + 1.2, z0 + 2.1, '#ffe6ac', undefined, .01)); FB.q(du + s * .1 - .03, du + s * .1 + .03, z0 + .9, z0 + 1.15, gold, undefined, .01); }
    lit(() => FB.sign('OPEN', du - .5, du + .5, z0 + 2.55, z0 + 2.95, '#3a3038', '#9cf2b0', { frame: false }));
    glow(() => qz(.3, w - .3, yb, d - .1, z0 + .01, '#ffe6ac', 'glass'));
    // columns
    const nc = Math.max(4, Math.round(w / 1.6)); for (let i = 0; i < nc; i++) { const x = .55 + i * (w - 1.1) / (nc - 1); if (Math.abs(x - du) < .45) continue; box(x - .34, d - .84, z0, .68, .68, .2, lt(st, .1), { ol: false }); cyl(x, d - .5, z0 + .2, .24, zc - z0 - .5, lt(st, .15)); const p = PW(x, d - .5, z0 + .2); for (let k = -3; k <= 3; k += 2) for (let v = 4; v < (zc - z0 - .5) * 16; v += 1) if (k !== 3) px(p[0] + k, p[1] - v + 2, C(dk(st, k < 0 ? .12 : .34))); box(x - .36, d - .86, zc - .3, .72, .72, .3, lt(st, .1), { ol: false }); }
    // entablature + pediment
    box(-.12, -.1, zc, w + .24, d + .12, .9, lt(st, .08));
    const nm = q.name; { const o = { sc: K.bigW(nm, 2) / 16 <= w - .4 ? 2 : 1, off: .01 }; K.bigSign(FY(d + .02), nm, 0, w, zc + .1, zc + .8, null, '#7a5a22', o); glow(() => K.bigSign(FY(d + .02), nm, 0, w, zc + .1, zc + .8, null, '#ffd98a', o)); }
    gable(-.12, -.1, zc + .9, w + .24, d + .12, 1.4, 'y', K.winter() ? mix(q.roof, K.SNOW, .6) : q.roof, { wall: lt(st, .08), over: .1 });
    const pm = [w / 2, d + .02, zc + 1.55]; K.disc(FY(d), w / 2, zc + 1.45, .3, dk(st, .25), .02); K.disc(FY(d), w / 2, zc + 1.45, .2, gold, .03);
    K.flag(w / 2, d / 2, zc + 2.3, 2, '#2f4a7a', '#f4f0e8');
    // street
    for (const s of [-1, 1]) { const x = du + s * 3.3; box(x - .2, d + 1.0, 0, .4, .4, .9, st); K.beacon(x, d + 1.2, 1.2, 0, '#ffe9a0'); lit(() => { const p = PW(x, d + 1.2, 1.15); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) px(p[0] + a, p[1] + b, C('#fff2c4')); }); }
  },
  [{ seed: 4 }, { seed: 13, stone: '#c9c4c0', roof: '#4a5a6a', name: 'FIRST HARBOR', sub: 'REALTY' }, { seed: 26, stone: '#e8cfa8', roof: '#8a4b3a', name: 'UNION TRUST', sub: 'MORTGAGES' }, { seed: 39, w: 10, stone: '#dfe4e4', roof: '#c9a24a', name: 'BAY SAVINGS & LOAN', sub: 'HOME REALTY' }],
  K.entry(4, 7, 3.5));

/* ---- city hall: wings, portico, clock tower with dome ---- */
const cityhall = K.asset('cityhall', ['cityhall', 'landmark', 'civic'], { w: 18, d: 10, seed: 1, stone: '#e6dcc6', roof: '#5fa890', gold: '#e8c06a', name: 'CITY HALL' },
  q => ({ h: 6.4, top: 12, front: 2.2 }),
  q => {
    const { w, d, stone: st, gold } = q, r = rng(q.seed), L = K.lights(q.seed, .45), yw = d - 1.4, hw = 5.2, cx0 = w / 2 - 3.5, cx1 = w / 2 + 3.5, rf = K.winter() ? mix(q.roof, K.SNOW, .65) : q.roof, du = w / 2;
    const wing = (x0, x1) => { for (let u = x0 + .7; u + 1 <= x1 - .5; u += 1.75) for (let f = 0; f < 2; f++) { const z = .5 + f * 2.3; FY(yw).win(u, u + 1, z + .4, z + 1.9, { on: L.on(f), glowc: L.col(f), mullion: 'cross', sill: true, frame: '#5a4a48' }); FY(yw).q(u - .08, u + 1.08, z + 1.9, z + 2.05, lt(st, .3)); if (f === 0) FY(yw).q(u - .36, u - .2, .5, hw - .4, lt(st, .2)); } };
    box(0, 0, 0, w, yw, .5, dk(st, .2)); box(0, 0, .5, w, yw, hw - .5, st, { l: PAT.stone(dk(st, .18)), r: PAT.stone(dk(st, .36)) });
    wing(0, cx0); wing(cx1, w);
    for (let y = .7; y + 1 <= yw - .5; y += 1.75) for (let f = 0; f < 2; f++) { const z = .5 + f * 2.3; FX(w).win(y, y + 1, z + .4, z + 1.9, { on: L.on(f), glowc: L.col(f), mullion: 'cross', sill: true, frame: '#5a4a48' }); }
    K.cornice(0, 0, w, yw, hw - .3, .3, lt(st, .25), .15); K.roofTop(0, 0, hw, w, yw, st, { rc: rf });
    for (let x = .3; x < w; x += .45) if (x < cx0 - .2 || x > cx1 + .2) lw([x, yw, hw], [x, yw, hw + .35], lt(st, .2)); lw([0, yw, hw + .35], [cx0, yw, hw + .35], lt(st, .3)); lw([cx1, yw, hw + .35], [w, yw, hw + .35], lt(st, .3));
    K.flag(.5, yw - .5, hw, 2.4, '#b8342e', '#f4f0e8'); K.ac(2.5, 1, hw); K.skylight(4, 3, hw, 1.6, 1.2);
    // lawn strips in front of the left wing
    const lawn = (x0, x1) => { K.garden(x0 + .2, x1 - .2, yw + .25, d - .1, 0, r, { low: true }); };
    lawn(0, cx0 - .3);
    // central block
    const hc = 6.4; box(cx0, 0, 0, 7, d - .9, hc, st, { l: PAT.stone(dk(st, .18)), r: PAT.stone(dk(st, .36)) });
    const FC = FY(d - .9);
    for (const s of [-1, 1]) { FC.win(du + s * 2.2 - .5, du + s * 2.2 + .5, 1.3, 3.6, { on: true, mullion: 'cross', sill: true, frame: '#5a4a48' }); }
    FC.q(du - 1, du + 1, .6, 4, dk(st, .3)); FC.q(du - .8, du + .8, .6, 3.3, '#5a3f2a'); FC.q(du - .74, du - .03, .65, 3.2, '#7a5a3a'); FC.q(du + .03, du + .74, .65, 3.2, '#7a5a3a'); K.shopGlass(FC, du - .8, du + .8, 3.3, 3.9, { bayw: .4 });
    for (const s of [-1, 1]) FC.q(du + s * .12 - .03, du + s * .12 + .03, 1.6, 1.9, gold, undefined, .01);
    for (let y = .8; y + 1 <= d - 2; y += 1.8) FX(cx1).win(y, y + .9, hw + .2, hc - .3, { on: L.r() < .5, mullion: 'cross', sill: true, frame: '#5a4a48' });   /* (above the right wing's roof: the part of this face that can be seen) */
    /* owner msg 240: the RIGHT WING stands in front of the central block's right face, so it is drawn again over it (the face used to be painted across the wing's roof,
       which made the building look broken: a brick wall hanging over the wing). Same pieces as the first pass, limited to x cx1..w. */
    { const ww = w - cx1; box(cx1, 0, 0, ww, yw, .5, dk(st, .2)); box(cx1, 0, .5, ww, yw, hw - .5, st, { l: PAT.stone(dk(st, .18)), r: PAT.stone(dk(st, .36)) }); wing(cx1, w);
      for (let y = .7; y + 1 <= yw - .5; y += 1.75) for (let f = 0; f < 2; f++) { const z = .5 + f * 2.3; FX(w).win(y, y + 1, z + .4, z + 1.9, { on: L.on(f), glowc: L.col(f), mullion: 'cross', sill: true, frame: '#5a4a48' }); }
      K.cornice(cx1, 0, ww, yw, hw - .3, .3, lt(st, .25), .15); K.roofTop(cx1, 0, hw, ww, yw, st, { rc: rf });
      for (let x = cx1 + .2; x < w; x += .45) lw([x, yw, hw], [x, yw, hw + .35], lt(st, .2)); lw([cx1, yw, hw + .35], [w, yw, hw + .35], lt(st, .3)); }
    glow(() => qz(cx0 + .3, cx1 - .3, d - .9, d - .1, .62, '#ffe6ac', 'glass'));
    // clock tower
    const tx = du - 1.5, ty = 2.2, tz = hc, th = 5.2; box(tx, ty, tz, 3, 3, th, st);
    for (const F of [FX(tx + 3), FY(ty + 3)]) { const a = F.xf ? ty : tx; for (const u of [a + .5, a + 1.9]) { F.q(u, u + .6, tz + 1.4, tz + 2.6, F.sh('#4a5a6a')); if (L.r() < .6) glow(() => F.q(u, u + .6, tz + 1.4, tz + 2.6, '#ffd98a')); F.l(u, tz + 1.4, u + .6, tz + 1.4, lt(st, .3)); } K.clock(F, a + 1.5, tz + 3.9, .85); glow(() => F.q(a, a + 3, tz, tz + th, '#ffd9a0', 'glass')); F.q(a, a + 3, tz + 2.85, tz + 3, F.sh(lt(st, .3))); }
    K.cornice(tx, ty, 3, 3, tz + th - .25, .25, lt(st, .25), .18);
    for (const [a, b] of [[tx, ty + 2.7], [tx + 2.7, ty + 2.7], [tx + 2.7, ty]]) { box(a, b, tz + th, .3, .3, .5, st, { ol: false }); cone(a + .15, b + .15, tz + th + .5, .2, .45, gold); }
    cyl(tx + 1.5, ty + 1.5, tz + th, 1.25, .8, lt(st, .1)); 
    { const p = PW(tx + 1.5, ty + 1.5, tz + th + .15); for (let k = -5; k <= 5; k++) { const X = p[0] + k * 3.6; lit(() => { px(X, p[1] + 9 - Math.abs(k) * .6, C('#ffe6ac')); px(X, p[1] + 8 - Math.abs(k) * .6, C('#ffe6ac')); px(X, p[1] + 7 - Math.abs(k) * .6, C('#ffd98a')); }); } }
    K.dome(tx + 1.5, ty + 1.5, tz + th + .8, 1.3, 1.7, rf, { ribs: 6 });
    cyl(tx + 1.5, ty + 1.5, tz + th + 2.75, .3, .55, lt(st, .15)); lit(() => { const p = PW(tx + 1.5, ty + 1.5, tz + th + 3); for (let a = -3; a <= 3; a++) for (let b = -2; b <= 2; b++) px(p[0] + a, p[1] + b + 3, C('#fff2c4')); });
    cone(tx + 1.5, ty + 1.5, tz + th + 3.3, .4, .7, gold); K.antenna(tx + 1.5, ty + 1.5, tz + th + 3.9, 1.6, { c: gold });
    // portico: pediment roof over the centre + columns
    gable(cx0, 3.4, hc, 7, d - 3.4 + .1, 1.6, 'y', rf, { wall: lt(st, .1), over: .12 });
    K.disc(FY(d + .1), du, hc + .62, .32, gold, .0);
    box(cx0 - .1, d - .9, hc - 1.1, 7.2, 1, 1.1, lt(st, .1));
    { const o = { sc: K.bigW(q.name, 2) / 16 < 6.6 ? 2 : 1, off: .01 }; K.bigSign(FY(d + .1), q.name, cx0, cx1, hc - .95, hc - .15, null, '#6a4a1a', o); glow(() => K.bigSign(FY(d + .1), q.name, cx0, cx1, hc - .95, hc - .15, null, '#ffd98a', o)); }
    for (let i = 0; i < 6; i++) { const x = cx0 + .45 + i * (7 - .9) / 5; if (i === 2 || i === 3) { if (Math.abs(x - du) < .5) continue; } box(x - .32, d - .72, .6, .64, .64, .2, lt(st, .1), { ol: false }); cyl(x, d - .4, .8, .23, hc - 1.1 - .8 - .25, lt(st, .15)); box(x - .34, d - .74, hc - 1.35, .68, .68, .25, lt(st, .1), { ol: false }); }
    // grand steps
    for (let i = 0; i < 3; i++) box(cx0 - .2, d - .9, i * .2, 7.4, 2.6 - i * .45, .2, lt(st, .04 * i), { ol: i === 0 });
    for (const s of [-1, 1]) { const x = du + s * 3.3; box(x - .25, d + .9, 0, .5, .5, 1.1, st); lit(() => { const p = PW(x, d + 1.15, 1.45); for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (Math.abs(a) + Math.abs(b) < 4) px(p[0] + a, p[1] + b, C('#fff2c4')); }); K.beacon(x, d + 1.15, 1.45, 0, '#ffe9a0'); }
    lawn(cx1 + .3, w);
    K.flag(cx0 + .6, d - .2, hc, 0, '#b8342e', '#f4f0e8', { wall: true }); K.flag(cx1 - .6, d - .2, hc, 0, '#2f4a7a', gold, { wall: true });
  },
  [{ seed: 7 }, { seed: 18, stone: '#d4d0cc', roof: '#4a6a8a', name: 'CITY HALL' }, { seed: 29, stone: '#e8cfa8', roof: '#b0563a', name: 'TOWN HALL' }],
  K.entry(9, 10, 5));

/* ---- parking garage ---- */
const CARS = ['#c8343a', '#3f6f9f', '#e8e4dc', '#3a3f4a', '#e8b63a', '#4f9a8e', '#8a909c', '#f4f0e8'];
function car(x, y, z, c, along) { const [l, wd] = along ? [2.6, 1.3] : [1.3, 2.6]; box(x, y, z + .12, l, wd, .42, c); const cx = along ? .55 : .12, cy = along ? .12 : .55, cl = along ? 1.4 : 1.06, cw = along ? 1.06 : 1.4; box(x + cx, y + cy, z + .54, cl, cw, .36, dk(c, .1), { l: '#5d8fa8', r: '#4a7a94' }); if (K.winter()) qz(x + cx, x + cx + cl, y + cy, y + cy + cw, z + .9, K.SNOW); }
const parking = K.asset('parking', ['parking', 'garage'], { w: 10, d: 8, floors: 4, seed: 1, conc: '#c9c4b8', accent: '#2f5fbf', name: 'PARK' },
  q => ({ h: q.floors * 1.6 + .7, top: 3.4 }),
  q => {
    const { w, d, floors: fl, conc, accent } = q, r = rng(q.seed), lh = 1.6, H = fl * lh + .7, tw = 2.4;
    box(0, 0, 0, w, d, H, conc);
    for (const F of [FX(w), FY(d)]) {
      const n = F.xf ? d : w, a0 = F.xf ? .0 : tw;
      for (let f = 0; f < fl; f++) {
        const z = f * lh;
        if (f > 0 || F.xf) { F.q(a0 + .2, n - .2, z + .7, z + lh, F.sh('#35333f')); lit(() => { for (let u = a0 + 1; u < n - .6; u += 1.6) F.q(u, u + .6, z + lh - .14, z + lh - .08, '#dff1ff'); }); glow(() => F.q(a0 + .2, n - .2, z + .7, z + lh - .14, '#6a7a9a', 'glass'));
          for (let u = a0 + .5; u + 1.2 < n - .3; u += 1.5) if (r() < .72) { const c = F.sh(CARS[Math.floor(r() * CARS.length)]); F.q(u, u + 1.15, z + .7, z + .92, c, undefined, .0); F.q(u + .15, u + 1, z + .92, z + 1.18, F.sh('#5d8fa8')); F.q(u + .15, u + 1, z + 1.18, z + 1.24, c); glow(() => { if (r() < .12) { F.q(u + .05, u + .2, z + .74, z + .84, '#fff2c4'); F.q(u + .95, u + 1.1, z + .74, z + .84, '#fff2c4'); } }); }
          for (let u = a0 + .2; u < n; u += 3) F.q(u - .14, u + .14, z + .7, z + lh, F.sh(lt(conc, .08))); }
        F.q(a0, n, z + .42, z + .52, F.sh(accent)); F.l(a0, z + .7, n, z + .7, F.sh(lt(conc, .4))); F.l(a0, z, n, z, F.sh(dk(conc, .3)));
        if (!F.xf && f > 0) lit(() => K.bigText(F, 'L' + f, n - 1.1, z + .38, lt(accent, .6), 1));
      }
    }
    // ground: entrance + exit on +y
    const FYd = FY(d); K.garageDoor(FYd, tw + .9, tw + 3.1, 1.5); FYd.q(tw + 4, w - .5, .1, .7, dk(conc, .15));
    if (w - tw > 6.5) { FYd.q(tw + 4.2, tw + 6.4, 0, 1.5, '#2e2c38'); FYd.q(tw + 4.35, tw + 6.25, 0, .7, '#45434f'); lit(() => FYd.sign('EXIT', tw + 4.6, tw + 6, 1.52, 1.95, '#c8343a', '#ffffff', { frame: false }, .03)); }
    lit(() => FYd.sign(q.name, tw + 1, tw + 3, 1.52, 1.95, accent, '#ffffff', { frame: false }, .03));
    // top deck
    qz(.3, w - .3, .3, d - .3, H, '#5a5862', '#55535d'); K.snowTop(.3, w - .3, .3, d - .3, H);
    for (let x = tw + .6; x < w - 1; x += 1.6) { lw([x, .5, H], [x, 2.9, H], '#e8e4d8'); lw([x, d - 3, H], [x, d - .5, H], '#e8e4d8'); }
    const cars = []; for (let x = tw + .75; x + 1.3 < w - .3; x += 1.6) { if (r() < .6) cars.push([x, .5]); if (r() < .6) cars.push([x, d - 3.2]); }
    cars.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
    for (const [x, y] of cars.filter(c => c[1] < 2)) car(x, y, H - .1, CARS[Math.floor(r() * CARS.length)], false);
    for (const [x, y] of [[w - .5, .5], [tw + .3, d / 2]]) { lw([x, y, H], [x, y, H + 2], '#5a606c'); lw([x, y, H + 2], [x - .5, y, H + 2], '#5a606c'); lit(() => { const p = PW(x - .5, y, H + 1.95); px(p[0], p[1], C('#fff2c4')); px(p[0] + 1, p[1], C('#fff2c4')); }); K.beacon(x - .5, y, H + 1.9, 1, '#ffe9a0'); }
    for (const [x, y] of cars.filter(c => c[1] >= 2)) car(x, y, H - .1, CARS[Math.floor(r() * CARS.length)], false);
    // stair / lift tower with big P
    const th = H + 2.2; box(0, d - 2.6, 0, tw, 2.6, th, lt(conc, .1));
    K.curtain(FY(d), .35, tw - .35, .3, H + .3, { L: K.lights(q.seed, .9), fh: lh, glass: '#6aa8c4', bay: .6, sp: dk(conc, .2), sph: .3, detail: 0 }); K.glassDoor(FY(d), tw / 2, 0, { w: .9, h: 1.5 });
    for (let z = .3; z < H; z += lh) lw([.4, d + .01, z + .4], [tw - .4, d + .01, z + lh], '#e8eef2');
    lit(() => { FY(d).q(.35, tw - .35, H + .55, th - .25, accent, undefined, .02); K.bigText(FY(d), 'P', tw / 2 - 4.5 / 16, th - .42, '#ffffff', 3, .03); FX(tw).q(d - 2.25, d - .35, H + .55, th - .25, dk(accent, .15), undefined, .02); K.bigText(FX(tw), 'P', d - 1.3 + 4.5 / 16, th - .42, '#ffffff', 3, .03); });
    K.roofTop(0, d - 2.6, th, tw, 2.6, lt(conc, .1)); K.antenna(.6, d - 2, th, 1.8);
    K.art('bikes', w - 1.5, d + .6, r);
  },
  [{ w: 10, d: 8, floors: 4, seed: 2 }, { w: 12, d: 8, floors: 3, seed: 14, conc: '#d8cdb8', accent: '#2f8f6f', name: 'CITY PARK' }, { w: 10, d: 9, floors: 6, seed: 27, conc: '#b8bcc4', accent: '#e8843a', name: 'PARK 24H' }, { w: 14, d: 8, floors: 5, seed: 40, conc: '#c4c0c8', accent: '#8a3f8a', name: 'PLAZA PARK' }]);

export default [hotel, store, bank, cityhall, parking];
