// Downtown enterable venues + small plaza buildings: gym, clothing, home goods, retail pavilion, kiosks.
import { box, qy, qx, qz, lw, fq, glow, lit, cyl, cone, gable, rng, dk, lt, mix, PAT, PW, px, C, ENV } from '../../engine/raster.js';
import * as K from './_lib.js';
const { FY, FX } = K;

/* ---- Iron Maple Gym ---- */
const gym = K.asset('gym', ['gym', 'shop', 'enterable'], { w: 9, d: 7, seed: 1, wall: '#4a4652', accent: '#e8432a', steel: '#2a2a34', name: 'IRON MAPLE GYM' },
  q => ({ h: 6.6, top: 3.6 }),
  q => {
    const { w, d, wall, accent, steel } = q, r = rng(q.seed), L = K.lights(q.seed, .8), H = 6.6, FYd = FY(d), FXw = FX(w), du = 2;
    box(0, 0, 0, w, d, H, wall, { l: PAT.brick(dk(wall, .18), dk(wall, .45)), r: PAT.brick(dk(wall, .36), dk(wall, .6)) });
    for (const F of [FXw, FYd]) { const n = F.xf ? d : w; F.q(0, n, 0, .25, F.sh(steel)); F.q(0, n, 2.75, 3.75, F.sh(steel)); F.q(0, n, 2.75, 2.83, F.sh(accent)); F.q(0, n, 3.67, 3.75, F.sh(accent)); }
    // ground: door + gym floor seen through big windows
    FYd.q(du - .9, du + .9, 0, 2.5, steel); K.glassDoor(FYd, du, 0, { w: 1.3, h: 1.8, frame: steel }); K.shopGlass(FYd, du - .65, du + .65, 1.95, 2.45, { bayw: .65, frame: steel });
    K.scene(FYd, du + 1.3, w - .5, .3, 2.5, 'gym', r, { frame: steel, bayw: 1.3, accent, glowc: K.GLOWC.cool });
    K.scene(FXw, .5, d - .5, .3, 2.5, 'gym', r, { frame: steel, bayw: 1.3, accent, glowc: K.GLOWC.cool });
    K.canopy(FYd, du - 1.1, du + 1.1, 2.5, .9, accent, { posts: false, trim: '#fff2c4', th: .18 });
    // upper studio: tall factory glazing
    for (const F of [FXw, FYd]) { const n = F.xf ? d : w; for (let u = .6; u + 1.7 <= n - .3; u += 2.05) { K.curtain(F, u, u + 1.7, 4.1, 6, { L, fh: 1.9, glass: '#5a8aa4', bay: .43, sp: null, hm: true, mull: steel, detail: 0 }); F.l(u, 4.1, u, 6, steel); F.l(u + 1.7, 4.1, u + 1.7, 6, steel); F.q(u - .05, u + 1.75, 3.98, 4.1, F.sh(lt(wall, .3)));
      const m = u + .85; F.q(m - .1, m + .1, 4.15, 4.95, F.sh('#3a4458'), undefined, .005); F.q(m - .07, m + .07, 4.97, 5.15, F.sh('#c68a5e'), undefined, .005); F.q(m - .3, m + .3, 4.8, 4.86, F.sh('#22283a'), undefined, .005); } }
    const nm = q.name, sc = K.bigW(nm, 2) / 16 <= w - .5 ? 2 : 1;
    K.bigSign(FYd, nm, .2, w - .2, 2.9, 3.6, null, '#fff2c4', { lit: true, sc }); K.bigSign(FXw, nm.split(' ').pop(), .3, d - .3, 2.9, 3.6, null, accent, { lit: true, sc: 2 });
    K.blade(FYd, w - .1, 4.1, 4.1 + 3 * 7 / 16 + .2, nm.split(' ').pop().slice(0, 3), accent, '#fff2c4');
    K.cornice(0, 0, w, d, H - .25, .25, steel, .1); K.roofTop(0, 0, H, w, d, wall, { rc: '#6a6570' });
    // roof: turf workout deck + billboard
    qz(w - 4.2, w - .5, d - 3, d - .5, H + .01, K.winter() ? K.SNOW : '#4f9a55', K.winter() ? K.SNOW2 : '#5aa84f'); lw([w - 4.2, d - 1.75, H + .01], [w - .5, d - 1.75, H + .01], '#f4f0e8');
    K.clutter(r, .4, w - .4, .4, 2.6, H, 'aAvh', .7); K.cooling(.5, 2.6, H);
    box(w - 3.6, d - 2.6, H, .25, .9, .5, steel, { ol: false }); box(w - 2.4, d - 1.4, H, .5, .5, .4, accent, { ol: false }); lw([w - 1.4, d - 2.6, H], [w - 1.4, d - 2.6, H + 1.4], steel); lw([w - 1.4, d - 1, H], [w - 1.4, d - 1, H + 1.4], steel); lw([w - 1.4, d - 2.6, H + 1.4], [w - 1.4, d - 1, H + 1.4], steel);
    K.billboard(FY(d - 3.2), .5, 4.3, H, 1.8, q.slogan || ['GET', 'STRONG'], steel, ['#fff2c4', accent], { sc: 2 });
    K.art('bikes', w - 1.6, d + .6, r, { c: accent }); K.planter(du + 1.6, d + .25, 1.2, .5, r, { c: steel });
  },
  [{ seed: 3 }, { seed: 14, wall: '#6a4a40', accent: '#f2c230', slogan: ['OPEN', '24 HRS'] }, { seed: 25, wall: '#3f4a5a', accent: '#5fd4a0', steel: '#22283a', slogan: ['LIFT', 'RUN', 'REST'] }],
  K.entry(2, 7));

/* ---- Thread & Co. clothing boutique ---- */
const clothing = K.asset('clothing', ['clothing', 'shop', 'enterable'], { w: 8, d: 6, seed: 1, wall: '#f0d9c8', trim: '#2f6f6a', awn: '#2f6f6a', awn2: '#f6eedc', gold: '#e8c06a', name: 'THREAD & CO.' },
  q => ({ h: 5.6, top: 2.6 }),
  q => {
    const { w, d, wall, trim, gold } = q, r = rng(q.seed), L = K.lights(q.seed, .55), H = 5.6, FYd = FY(d), FXw = FX(w), du = 4;
    box(0, 0, 0, w, d, H, wall, { l: PAT.stucco(dk(wall, .18)), r: PAT.stucco(dk(wall, .36)) });
    for (const F of [FXw, FYd]) { const n = F.xf ? d : w; F.q(0, n, 0, 2.6, F.sh(trim)); F.q(0, n, 0, .25, F.sh(dk(trim, .3))); F.q(0, n, 2.6, 3.3, F.sh(dk(trim, .25))); F.l(0, 3.3, n, 3.3, F.sh(gold)); F.l(0, 2.6, n, 2.6, F.sh(gold)); }
    K.scene(FYd, .45, du - .9, .35, 2.2, 'fashion', r, { frame: dk(trim, .4), bayw: 3, accent: '#c8543a' }); K.scene(FYd, du + .9, w - .45, .35, 2.2, 'fashion', r, { frame: dk(trim, .4), bayw: 3, accent: '#c8543a' });
    K.scene(FXw, .5, d - .5, .35, 2.2, 'fashion', r, { frame: dk(trim, .4), bayw: 2.5, accent: '#c8543a' });
    FYd.q(du - .7, du + .7, 0, 2.4, dk(trim, .35)); K.glassDoor(FYd, du, 0, { w: 1.1, h: 1.8, frame: dk(trim, .5) });
    lit(() => FYd.sign('OPEN', du - .45, du + .45, 1.9, 2.3, dk(trim, .5), '#ffb0d0', { frame: false }));
    K.awning(FYd, .3, du - .8, 2.3, .6, q.awn, q.awn2, { rise: .3 }); K.awning(FYd, du + .8, w - .3, 2.3, .6, q.awn, q.awn2, { rise: .3 }); K.awning(FXw, .4, d - .4, 2.3, .5, q.awn, q.awn2, { rise: .3 });
    const nm = q.name, sc = K.bigW(nm, 2) / 16 <= w - .4 ? 2 : 1;
    K.bigSign(FYd, nm, .2, w - .2, 2.63, 3.27, null, gold, { lit: true, sc }); K.bigSign(FXw, nm.split(' ')[0], .2, d - .2, 2.63, 3.27, null, dk(gold, .08), { lit: true, sc: 2 });
    // upper floor: tall windows with shutters + flower boxes
    for (const F of [FXw, FYd]) { const n = F.xf ? d : w; K.winGrid(F, 0, n, 3.3, 1, { L, fh: 2, ww: .9, wh: 1.35, zo: .45, pitch: 1.9, m: .8, mullion: 'cross', frame: '#5a4a48',
      each: (u, z) => { F.q(u - .3, u - .04, z, z + 1.35, F.sh(trim), undefined, .005); F.q(u + .94, u + 1.2, z, z + 1.35, F.sh(trim), undefined, .005); for (let k = .15; k < 1.3; k += .15) { F.l(u - .28, z + k, u - .06, z + k, F.sh(dk(trim, .3)), .006); F.l(u + .96, z + k, u + 1.18, z + k, F.sh(dk(trim, .3)), .006); }
        F.box(u - .1, 0, z - .28, 1.1, .2, .2, '#8a5a3a', { ol: false }); if (!K.winter()) for (let a = u; a < u + .95; a += .22) { const p = PW(...F.P(a, .12, z - .04)); px(p[0], p[1], C('#4f9a55')); px(p[0] + 1, p[1], C('#4f9a55')); px(p[0], p[1] - 1, C(['#ff7a9a', '#ffd84a', '#f4f0ff'][Math.round(a * 9) % 3])); px(p[0] + 1, p[1] - 1, C('#5aa84f')); } else F.box(u - .1, 0, z - .08, 1.1, .2, .05, K.SNOW, { ol: false }); } }); }
    K.blade(FYd, w - .1, 3.5, 3.5 + 2 * 7 / 16 + .2, 'T&', dk(trim, .4), gold);
    K.cornice(0, 0, w, d, H - .3, .3, lt(wall, .4), .15); K.roofTop(0, 0, H, w, d, wall, { rc: '#a89a90' });
    K.hut(.5, .5, H, 1.4, 1.2, 1.2, wall); K.ac(2.4, .6, H); K.garden(w - 3.2, w - .5, d - 2.4, d - .5, H, r);
    // string lights across the roof terrace
    lw([w - 3.3, d - .4, H + 1.3], [w - .4, d - .4, H + 1.3], '#5a4a48'); lw([w - 3.3, d - .4, H], [w - 3.3, d - .4, H + 1.3], '#5a4a48'); lw([w - .4, d - .4, H], [w - .4, d - .4, H + 1.3], '#5a4a48');
    lit(() => { for (let x = w - 3.1; x < w - .5; x += .4) { const p = PW(x, d - .4, H + 1.22); px(p[0], p[1], C('#fff2c4')); px(p[0], p[1] + 1, C('#ffd98a')); } });
    K.planter(.5, d + .25, 1.2, .5, r, { c: dk(trim, .3), fl: '#ffb0d0' }); K.planter(w - 1.7, d + .25, 1.2, .5, r, { c: dk(trim, .3), fl: '#ffb0d0' });
    // mannequin + sale rack on the sidewalk in fair seasons
    if (ENV.season < 3) { lw([du + 1.5, d + .7, .9], [du + 2.6, d + .7, .9], '#c2c8d0'); lw([du + 1.5, d + .7, 0], [du + 1.5, d + .7, .9], '#c2c8d0'); lw([du + 2.6, d + .7, 0], [du + 2.6, d + .7, .9], '#c2c8d0'); for (let i = 0; i < 6; i++) qy(du + 1.6 + i * .16, du + 1.72 + i * .16, d + .7, .3 + (i % 3) * .08, .88, ['#c8543a', '#3f6f9f', '#e8b63a', '#f4f0e8', '#4f9a8e', '#8a5aa8'][i]); }
  },
  [{ seed: 2 }, { seed: 15, wall: '#e4e0ec', trim: '#3a3458', awn: '#3a3458', awn2: '#e8b0c8', name: 'THREAD & CO.' }, { seed: 31, wall: '#f4e8c0', trim: '#8a3a2e', awn: '#8a3a2e', name: 'THREAD & CO.' }],
  K.entry(4, 6));

/* ---- Nest & Wire furniture / electronics ---- */
const homegoods = K.asset('homegoods', ['homegoods', 'furniture', 'electronics', 'shop', 'enterable'], { w: 11, d: 8, seed: 1, wall: '#eef0ee', accent: '#e8843a', accent2: '#2f5f8f', name: 'NEST & WIRE' },
  q => ({ h: 6.2, top: 3.6, side: .8 }),
  q => {
    const { w, d, wall, accent, accent2 } = q, r = rng(q.seed), L = K.lights(q.seed, .8), H = 6.2, FYd = FY(d), FXw = FX(w), du = 3, fr = '#2a3040';
    const panel = c => (u, v) => (u % 24 === 0 || v % 16 === 0) ? dk(c, .12) : c;
    box(0, 0, 0, w, d, H, wall, { l: panel(dk(wall, .12)), r: panel(dk(wall, .3)) });
    for (const F of [FXw, FYd]) { const n = F.xf ? d : w; F.q(0, n, 0, .22, F.sh(fr)); F.q(0, n, 4.6, 5.7, F.sh(accent2)); F.q(0, n, 4.5, 4.6, F.sh(accent)); }
    // double-height showroom
    K.scene(FYd, du + 1.3, w - .5, .3, 2.5, 'home', r, { frame: fr, bayw: 1.5, accent }); K.scene(FYd, .4, du - 1.3, .3, 2.5, 'home', r, { frame: fr, bayw: 1.5, accent });
    K.dock(FXw, .6, 2.6, r, 2); K.scene(FXw, 3.3, d - .5, .3, 2.5, 'home', r, { frame: fr, bayw: 1.5, accent });
    for (const F of [FXw, FYd]) { const n = F.xf ? d : w, a0 = F.xf ? 3.3 : .4; K.curtain(F, a0, n - .5, 2.9, 4.3, { L, fh: 1.4, glass: '#6aa0b8', bay: .75, sp: null, mull: fr, detail: 0 });
      for (let u = a0 + .4; u < n - 1.2; u += 1.5) { const k = r(); lit(() => { if (k < .5) { F.q(u, u + .8, 3.2, 3.8, '#22283a', undefined, .005); F.q(u + .05, u + .75, 3.25, 3.75, ['#8fd8ff', '#9cf2b0', '#ffb0d0', '#ffe45a'][Math.floor(k * 8)], undefined, .006); } else { F.q(u + .3, u + .34, 2.92, 3.5, '#3a3440', undefined, .005); F.q(u + .1, u + .54, 3.5, 3.8, '#fff2c4', undefined, .005); } }); } }
    // portal entrance
    box(du - 1.2, d, 0, 2.4, .5, 3, accent); FYd.q(du - .95, du + .95, 0, 2.7, fr, undefined, .5); glow(() => FYd.q(du - .9, du + .9, .05, 2.65, '#ffe6ac', '#f8d48c', .5)); FYd.q(du - .9, du + .9, .05, 2.65, '#8ec4da', '#a8d6e6', .5);
    K.glassDoor(FY(d + .5), du, 0, { w: 1.5, h: 1.9, frame: fr }); for (let i = 0; i < 3; i++) FY(d + .5).l(du - .9, 2.05 + i * .2, du + .9, 2.05 + i * .2, fr);
    if (K.winter()) K.snowTop(du - 1.2, du + 1.2, d, d + .5, 3, true);
    const nm = q.name, sc = K.bigW(nm, 2) / 16 <= w - .6 ? 2 : 1;
    K.bigSign(FYd, nm, .3, w - .3, 4.75, 5.55, null, '#ffffff', { lit: true, sc }); K.bigSign(FXw, nm.split(' ')[0], .3, d - .3, 4.75, 5.55, null, '#f0f0f0', { lit: true, sc: 2 });
    lit(() => { const F = FYd; F.q(w - 1.5, w - .5, 4.75, 5.55, accent, undefined, .02); F.l(w - 1.3, 5, w - 1, 5.4, '#ffffff', .03); F.l(w - 1, 5.4, w - .7, 5, '#ffffff', .03); F.q(w - 1.2, w - .8, 4.85, 5.05, '#ffffff', undefined, .03); });
    K.roofTop(0, 0, H, w, d, wall, { rc: '#8a8f9a' });
    for (let y = .6; y < d - 3.4; y += 1.5) K.solar(.6, y, H, 5);
    K.clutter(r, 5, w - .5, .5, d - 2.6, H, 'aAvkd', .6);
    K.billboard(FY(d - .4), .6, 6, H, 1.8, q.board || ['SOFAS  TVS', 'BEDS  HIFI'], accent2, ['#ffffff', '#ffd98a'], { sc: 2, stripe: accent });
    K.planter(du + 1.6, d + .25, 1.3, .5, r, { c: fr }); 
    // sidewalk display: boxed TV + armchair
    box(w - 2.6, d + .35, 0, .8, .5, .7, '#c49a6a'); qy(w - 2.5, w - 1.9, d + .85, .15, .55, '#2a3040'); lit(() => qy(w - 2.45, w - 1.95, d + .85, .2, .5, '#8fd8ff')); box(w - 1.5, d + .35, 0, .7, .6, .35, accent); box(w - 1.5, d + .35, .35, .7, .15, .4, lt(accent, .15), { ol: false });
  },
  [{ seed: 6 }, { seed: 17, wall: '#f0e8d8', accent: '#d63a5a', accent2: '#2a3a4a', board: ['NEW SEASON', 'SOFA SALE'] }, { seed: 32, wall: '#dfe6ea', accent: '#3fb08a', accent2: '#3a3058', board: ['SMART HOME', 'WEEK'] }],
  K.entry(3, 8.5));

/* ---- plaza retail pavilion ---- */
const pavilion = K.asset('pavilion', ['pavilion', 'shop', 'plaza', 'cafe'], { w: 6, d: 5, seed: 1, frame: '#3a4450', wood: '#b8875a', kind: 'cafe', name: 'PLAZA CAFE', accent: '#c8543a' },
  q => ({ h: 3.3, top: 1.6, front: 2.4, side: 1, left: .9 }),
  q => {
    const { w, d, frame: fr, wood } = q, r = rng(q.seed), H = 3, ov = .6;
    box(.2, .2, 0, w - .4, d - .4, H, fr);
    K.scene(FX(w - .2), .45, d - .45, .3, H - .35, q.kind, r, { frame: fr, bayw: 1.2, accent: q.accent }); K.scene(FY(d - .2), 2, w - .45, .3, H - .35, q.kind, r, { frame: fr, bayw: 1.2, accent: q.accent });
    FY(d - .2).q(.45, 1.9, 0, H - .35, dk(fr, .2)); K.glassDoor(FY(d - .2), 1.2, 0, { w: 1.1, h: 1.8, frame: dk(fr, .3) });
    // floating timber roof with green top
    box(-ov, -ov, H, w + ov * 2, d + ov * 2, .3, wood, { l: PAT.planks(dk(wood, .18), 5), r: PAT.planks(dk(wood, .36), 5), t: '#8a8f9a' });
    K.garden(-ov + .3, w + ov - .3, -ov + .3, d * .45, H + .12, r, { low: true }); K.skylight(w * .2, d * .55, H + .3, w * .5, 1.3); K.ac(w - .6, d * .6, H + .3, .8); K.snowTop(-ov + .2, w + ov - .2, d * .45, d + ov - .2, H + .3);
    glow(() => { for (let x = 0; x < w + ov; x += .8) { const p = PW(x, d + ov, H - .02); px(p[0], p[1], C('#fff2c4')); px(p[0], p[1] + 1, C('#ffe9a0')); } });
    K.bigSign(FY(d + ov), q.name, -ov, w + ov, H + .02, H + .28, null, '#fff8e0', { lit: true, sc: 1, off: .01 });
    K.art('cafe', 3.2, d + 1.3, r, { c: q.accent }); K.art('cafe', 5, d + 1.3, r, { c: q.accent }); K.planter(-.3, d + .5, .6, 1.2, r, { c: fr });
  },
  [{ seed: 3 }, { seed: 12, kind: 'retail', name: 'BLOOM & PAPER', wood: '#e4dccc', accent: '#3f8a6a', frame: '#2f4a44' }, { seed: 21, w: 7, kind: 'cafe', name: 'JUICE BAR', wood: '#e8b63a', accent: '#e8843a', frame: '#4a4048' }, { seed: 34, w: 8, d: 5, kind: 'office', name: 'VISITOR INFO', wood: '#8a909c', accent: '#2f5f9f', frame: '#22283a' }],
  K.entry(1.2, 5, 3));

/* ---- kiosks ---- */
const kiosk = K.asset('kiosk', ['kiosk', 'shop', 'plaza', 'newsstand'], { w: 3, d: 2, seed: 1, body: '#2f6f5f', awn: '#2f6f5f', awn2: '#f4f0e8', name: 'NEWS', kind: 'news', roof: 'flat' },
  q => ({ h: 2.5, top: 1.4, front: 1.3, side: .5 }),
  q => {
    const { w, d, body } = q, r = rng(q.seed), H = 2.5, F = FY(d), FXw = FX(w), goods = ['#c8543a', '#3f6f9f', '#e8b63a', '#f4f0e8', '#4f9a8e', '#8a5aa8', '#e8843a'];
    box(0, 0, 0, w, d, H, body, { l: PAT.planks(dk(body, .18), 6), r: PAT.planks(dk(body, .36), 6) });
    // serving hatch with stocked shelves
    F.q(.25, w - .25, .9, 2, '#3a3440'); glow(() => F.q(.3, w - .3, .95, 1.95, '#ffe6ac', '#f8d48c')); F.q(.3, w - .3, .95, 1.95, '#6b5a4a');
    lit(() => { F.q(.3, w - .3, .95, 1.95, '#f0d8a8', undefined, .003);
      if (q.kind === 'news') { for (let z = 1; z < 1.9; z += .32) for (let u = .38; u + .2 < w - .3; u += .27) F.q(u, u + .2, z, z + .26, goods[Math.floor(r() * 7)], undefined, .005); }
      else if (q.kind === 'coffee') { F.q(.5, 1.2, .95, 1.4, '#c2c8d0', undefined, .005); F.q(.6, 1.1, 1.05, 1.2, '#3a3440', undefined, .006); for (let u = 1.5; u < w - .5; u += .25) F.q(u, u + .15, .95, 1.15, '#f4f0e8', undefined, .005); F.q(w - 1.4, w - .4, 1.45, 1.9, '#2a3040', undefined, .005); for (let i = 0; i < 3; i++) F.q(w - 1.3, w - .7 + (i % 2) * .15, 1.52 + i * .12, 1.56 + i * .12, '#ffd98a', undefined, .006); }
      else if (q.kind === 'flowers') { for (let u = .4; u < w - .5; u += .3) { F.q(u, u + .2, .95, 1.2, '#8a909c', undefined, .005); F.q(u - .04, u + .24, 1.2, 1.5, '#4f9a55', undefined, .005); F.q(u, u + .2, 1.45, 1.62, goods[Math.floor(r() * 7)], undefined, .006); } }
      else if (q.kind === 'tickets') { F.q(.5, w - .5, 1.5, 1.9, '#2a3040', undefined, .005); for (let i = 0; i < 2; i++) F.q(.6, w - .9 + i * .2, 1.58 + i * .14, 1.63 + i * .14, i ? '#9cf2b0' : '#ffb347', undefined, .006); F.q(w / 2 - .3, w / 2 + .3, .95, 1.4, '#3f6f9f', undefined, .005); F.q(w / 2 - .1, w / 2 + .1, 1.42, 1.62, '#e8b890', undefined, .005); }
      else { for (let u = .4; u < w - .5; u += .35) { F.q(u, u + .26, .95, 1.1, '#c49a6a', undefined, .005); F.q(u + .03, u + .23, 1.1, 1.22, '#e8b63a', undefined, .006); } F.q(.4, w - .4, 1.6, 1.66, '#8a909c', undefined, .005); for (let u = .5; u < w - .5; u += .3) F.q(u, u + .12, 1.4, 1.6, '#c8543a', undefined, .005); } });
    if (q.kind !== 'tickets') { F.q(w / 2 + .2, w / 2 + .5, 1.25, 1.75, '#4a6a9a', undefined, .006); F.q(w / 2 + .26, w / 2 + .44, 1.77, 1.95, '#e8b890', undefined, .006); }
    F.box(.15, 0, .82, w - .3, .25, .08, lt(body, .3), { ol: false }); F.l(.25, 2, w - .25, 2, '#2a2430'); F.l(.25, .9, .25, 2, '#2a2430'); F.l(w - .25, .9, w - .25, 2, '#2a2430');
    // side: posters + door
    FXw.q(.3, 1, 0, 1.7, dk(body, .5)); FXw.q(1.2, d - .25, .7, 1.7, '#f4f0e8'); FXw.q(1.26, d - .31, 1.2, 1.64, goods[Math.floor(r() * 7)]); FXw.l(1.3, .95, d - .4, .95, '#3a3440'); FXw.l(1.3, 1.08, d - .6, 1.08, '#3a3440');
    K.awning(F, .05, w - .05, 2.12, .42, q.awn, q.awn2, { rise: .22 });
    if (q.roof === 'gable') gable(0, 0, H, w, d, .8, 'x', K.winter() ? K.SNOW2 : dk(body, .3), { wall: body }); else if (q.roof === 'barrel') { for (let i = 0; i < 6; i++) { const a0 = i / 6 * Math.PI, a1 = (i + 1) / 6 * Math.PI, y0 = d / 2 + Math.cos(a0) * d / 2, y1 = d / 2 + Math.cos(a1) * d / 2; fq([[0, y0, H + Math.sin(a0) * .7], [w, y0, H + Math.sin(a0) * .7], [w, y1, H + Math.sin(a1) * .7], [0, y1, H + Math.sin(a1) * .7]], K.winter() && i > 1 ? K.SNOW : i < 2 ? q.awn : i < 4 ? lt(q.awn, .25) : dk(q.awn, .3)); } lw([0, d, H], [w, d, H], dk(q.awn, .6)); } else { K.roofTop(0, 0, H, w, d, body); K.vent(.5, .5, H, .3); }
    K.bigSign(FY(q.roof === 'gable' ? d + .1 : d - .1), q.name, .2, w - .2, H + (q.roof === 'flat' ? .05 : -.42 + .0), H + (q.roof === 'flat' ? .65 : .0) + (q.roof === 'flat' ? 0 : .12), '#22283a', '#ffd98a', { lit: true, sc: K.bigW(q.name, 2) / 16 <= w - .6 && q.roof === 'flat' ? 2 : 1 });
    // street goods
    if (q.kind === 'news') { box(-.0, d + .1, 0, .7, .4, .8, '#8a909c'); for (let i = 0; i < 3; i++) qy(.05 + i * .22, .22 + i * .22, d + .5, .35, .7, goods[i]); box(w - .7, d + .15, 0, .5, .4, .9, '#c8343a'); }
    else if (q.kind === 'flowers') { for (let i = 0; i < 4; i++) { const x = .3 + i * .7; cyl(x, d + .5, 0, .16, .35, '#8a909c'); if (!K.winter()) { K.planter; const p = PW(x, d + .5, .6); for (const [a, b, c] of [[-2, 0, '#4f9a55'], [0, -2, goods[i]], [1, -1, goods[i]], [-1, -1, goods[i + 1]], [2, 0, '#5aa84f'], [0, 0, '#4f9a55'], [-1, 1, '#4f9a55'], [1, 1, '#4f9a55'], [0, -3, goods[i + 2]]]) px(p[0] + a, p[1] + b, C(c)); } } }
    else if (q.kind === 'coffee') { K.art('cafe', w + .1 - 1, d + .9, r, { c: q.awn }); }
    else { cyl(w - .4, d + .5, 0, .2, .7, '#3f6f5f'); }
  },
  [{ seed: 1 }, { seed: 5, kind: 'coffee', name: 'COFFEE', body: '#6b4a2f', awn: '#c8543a', roof: 'gable' }, { seed: 9, kind: 'flowers', name: 'FLOWERS', body: '#e8b0c0', awn: '#d65a8a', awn2: '#fff0f4', roof: 'barrel' }, { seed: 13, kind: 'tickets', name: 'TICKETS', body: '#2f4a7a', awn: '#e8b63a', awn2: '#2f4a7a' }, { seed: 17, kind: 'snacks', name: 'PRETZELS', body: '#e8c06a', awn: '#c8343a', roof: 'barrel' }]);

export default [gym, clothing, homegoods, pavilion, kiosk];
