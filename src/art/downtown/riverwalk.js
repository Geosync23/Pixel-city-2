// River Walk pieces for the pedestrian park beside downtown. Main (river-facing) side is +y.
import { box, qy, qx, qz, lw, fq, glow, lit, cyl, cone, gable, rng, dk, lt, mix, PAT, PW, px, C, ENV, foliage } from '../../engine/raster.js';
import * as K from './_lib.js';
const { FY, FX } = K;
const DECK = '#b8875a';
const strings = (a, b, n = 8) => { lw(a, b, '#4a4048'); lit(() => { for (let i = 1; i < n; i++) { const t = i / n, sag = Math.sin(t * Math.PI) * .25, p = PW(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - sag); px(p[0], p[1], C(['#fff2c4', '#ffd98a', '#ffb0a0'][i % 3])); px(p[0], p[1] + 1, C('#ffd98a')); } }); };
const glassRail = (F, u0, u1, z) => { F.q(u0, u1, z, z + .55, '#a8dce8', 'glass'); F.l(u0, z + .55, u1, z + .55, '#e8f0f4'); for (let u = u0; u <= u1 + .01; u += 1) F.l(u, z, u, z + .55, '#8a909c'); };

/* ---- glass restaurant / cafe pavilion with river terrace ---- */
const restaurant = K.asset('river.restaurant', ['riverwalk', 'restaurant', 'cafe', 'pavilion', 'enterable'], { w: 10, d: 8, seed: 1, frame: '#2f3a44', wood: '#b8875a', accent: '#2f6f8f', name: 'THE HERON' },
  q => ({ h: 3.6, top: 2.6, front: .6, side: 1, left: 1 }),
  q => {
    const { w, d, frame: fr, wood, accent } = q, r = rng(q.seed), bd = d - 3.2, H = 3.1, du = 2;
    // timber terrace (front 3.2 units) on low piles
    box(0, bd, 0, w, 3.2, .3, DECK, { t: PAT.fboards(DECK, .4), l: PAT.planks('#8a6444', 6) });
    // glass box
    box(.3, .3, 0, w - .6, bd - .3, H, fr);
    K.scene(FX(w - .3), .6, bd - .3, .35, H - .4, 'cafe', r, { frame: fr, bayw: 1.2, accent }); K.scene(FY(bd), du + 1, w - .6, .35, H - .4, 'cafe', r, { frame: fr, bayw: 1.2, accent });
    FY(bd).q(.6, du + .9, .3, H - .4, dk(fr, .15)); K.glassDoor(FY(bd), du, .3, { w: 1.3, h: 1.8, frame: dk(fr, .3), step: false });
    // butterfly timber roof with deep overhang
    const ov = .9, x0 = -ov, x1 = w + ov, y0 = -.3, y1 = bd + 1.6, zm = H, zl = H + .9;
    fq([[x0, y0, zl], [x1, y0, zl], [x1, (y0 + y1) / 2, zm], [x0, (y0 + y1) / 2, zm]], K.winter() ? K.SNOW2 : '#8a8f9a'); fq([[x0, (y0 + y1) / 2, zm], [x1, (y0 + y1) / 2, zm], [x1, y1, zl + .2], [x0, y1, zl + .2]], K.winter() ? K.SNOW : '#a2a8b2');
    fq([[x1, y0, zl], [x1, (y0 + y1) / 2, zm], [x1, y1, zl + .2], [x1, y1, zl - .05], [x1, (y0 + y1) / 2, zm - .25], [x1, y0, zl - .25]].slice(0, 3), dk(wood, .3)); fq([[x1, y0, zl - .25], [x1, y0, zl], [x1, (y0 + y1) / 2, zm], [x1, (y0 + y1) / 2, zm - .25]], dk(wood, .36)); fq([[x1, (y0 + y1) / 2, zm - .25], [x1, (y0 + y1) / 2, zm], [x1, y1, zl + .2], [x1, y1, zl - .05]], dk(wood, .36));
    qy(x0, x1, y1, zl - .05, zl + .2, PAT.planks(dk(wood, .1), 5)); lw([x0, y1, zl + .2], [x1, y1, zl + .2], lt(wood, .4)); lw([x0, y1, zl - .05], [x1, y1, zl - .05], dk(wood, .6)); lw([x0, (y0 + y1) / 2, zm], [x1, (y0 + y1) / 2, zm], '#5a606c');
    if (!K.winter()) for (let x = x0 + .8; x < x1; x += .8) { lw([x, y0, zl], [x, (y0 + y1) / 2, zm], '#7a7f8a'); lw([x, (y0 + y1) / 2, zm], [x, y1, zl + .2], '#8d939e'); }
    for (let x = 1; x + 1.6 < w * .55; x += 2) fq([[x, y1 - 2.2, zm + (zl + .2 - zm) * (1 - 2.2 / ((y1 - y0) / 2)) + .02], [x + 1.6, y1 - 2.2, zm + (zl + .2 - zm) * (1 - 2.2 / ((y1 - y0) / 2)) + .02], [x + 1.6, y1 - .5, zm + (zl + .2 - zm) * (1 - .5 / ((y1 - y0) / 2)) + .02], [x, y1 - .5, zm + (zl + .2 - zm) * (1 - .5 / ((y1 - y0) / 2)) + .02]], '#2f4f8f', '#3c64ad');
    for (const x of [.4, w - .4]) lw([x, y1 - .2, .3], [x, y1 - .2, zl - .05], fr);
    K.bigSign(FY(y1), q.name, x0, x1, zl - .03, zl + .2, null, '#fff8e0', { lit: true, sc: 1, off: .01 });
    glow(() => { for (let x = .2; x < w; x += .9) { const p = PW(x, y1 - .1, zl - .12); px(p[0], p[1], C('#fff2c4')); px(p[0], p[1] + 1, C('#ffe9a0')); } });
    // terrace life
    for (let x = du + 2.2; x < w - 1; x += 2.2) K.art('cafe', x, d - 1.3, r, { c: accent });
    at3(() => 0);
    K.planter(.2, d - .9, .6, .7, r, { c: fr, tree: false }); K.planter(w - .8, bd + .2, .6, .7, r, { c: fr });
    strings([.4, d - .15, 2.4], [w - .4, d - .15, 2.4], 14); lw([.4, d - .15, .3], [.4, d - .15, 2.4], fr); lw([w - .4, d - .15, .3], [w - .4, d - .15, 2.4], fr);
    glassRail(FY(d - .05), du + 1.2, w, .3); glassRail(FX(w - .05), bd + .2, d, .3);
    for (let i = 0; i < 2; i++) box(du - .9, d + i * .3, 0, 1.8, .3, .15 * (2 - i) - .0, '#c9c4b8', { ol: false });
  },
  [{ seed: 2 }, { seed: 11, w: 12, name: 'RIVER TABLE', wood: '#e4dccc', accent: '#c8543a', frame: '#3a3038' }, { seed: 23, w: 9, name: 'DOCKSIDE CAFE', wood: '#8a6444', accent: '#e8b63a', frame: '#22382f' }],
  K.entry(2, 8, 3.5));
function at3(f) { return f(); }

/* ---- boathouse with rental kiosk ---- */
const boathouse = K.asset('river.boathouse', ['riverwalk', 'boathouse', 'kiosk', 'pavilion'], { w: 9, d: 6, seed: 1, wall: '#3f7f8f', trim: '#f4f0e8', roof: '#b0563a', name: 'BOAT HIRE' },
  q => ({ h: 3, top: 3.2, front: 2.2, side: .6 }),
  q => {
    const { w, d, wall, trim } = q, r = rng(q.seed), H = 3, F = FY(d), FXw = FX(w), kay = ['#e8432a', '#f2c230', '#3fb08a', '#3f6f9f', '#e8843a', '#f4f0e8'];
    box(0, 0, 0, w, d, H, wall, { l: PAT.siding(dk(wall, .18)), r: PAT.siding(dk(wall, .36)) });
    F.q(0, w, 0, .25, dk(wall, .4)); FXw.q(0, d, 0, .25, dk(wall, .5));
    // open boat bay with stacked kayaks
    F.q(.5, 4.6, 0, 2.5, '#2e2a34'); glow(() => F.q(.55, 4.55, .05, 2.45, '#ffd98a', 'glass'));
    for (let i = 0; i < 4; i++) { const z = .35 + i * .5, c = kay[(i + q.seed) % 6]; F.q(.9, 4.2, z, z + .28, c, undefined, .01); F.q(.7, .9, z + .08, z + .2, dk(c, .15), undefined, .01); F.q(4.2, 4.4, z + .08, z + .2, dk(c, .15), undefined, .01); F.q(2.2, 2.9, z + .2, z + .28, '#22283a', undefined, .012); F.l(.9, z, 4.2, z, dk(c, .4), .012); }
    for (const u of [1.3, 3.8]) F.l(u, 0, u, 2.4, '#8a909c', .013);
    F.q(.3, .5, 0, 2.7, trim); F.q(4.6, 4.8, 0, 2.7, trim); F.q(.3, 4.8, 2.5, 2.7, trim);
    // sliding barn door (open, to the side) + rental hatch
    F.q(4.8, 5.4, 0, 2.5, dk(wall, .25), undefined, .02); F.l(4.8, 0, 5.4, 2.5, trim, .025); F.l(4.8, 2.5, 5.4, 0, trim, .025);
    F.q(5.9, w - .5, 1, 2.1, '#3a3440'); lit(() => { F.q(5.95, w - .55, 1.05, 2.05, '#f0d8a8'); F.q(6.5, 6.8, 1.05, 1.6, '#3f6f9f'); F.q(6.56, 6.74, 1.62, 1.8, '#e8b890'); F.q(6.5, 6.8, 1.78, 1.86, '#f4f0e8'); for (let i = 0; i < 3; i++) F.q(w - 1.5, w - .7, 1.2 + i * .25, 1.38 + i * .25, ['#e8843a', '#f2c230', '#e8432a'][i]); });
    F.box(5.8, 0, .9, w - 5.8 - .4, .25, .08, trim, { ol: false }); K.awning(F, 5.7, w - .3, 2.15, .5, q.roof, trim, { rise: .25 });
    // life ring, oars, price board
    K.disc(F, 5.6, 1.9, .3, '#e8432a'); K.disc(F, 5.6, 1.9, .16, wall); F.l(5.38, 1.9, 5.48, 1.9, '#f4f0e8', .025); F.l(5.72, 1.9, 5.82, 1.9, '#f4f0e8', .025);
    FXw.win(1, 2.2, 1.1, 2.2, { on: true, mullion: 'cross', sill: true, frame: trim }); FXw.win(3.4, 4.6, 1.1, 2.2, { on: r() < .5, mullion: 'cross', sill: true, frame: trim });
    for (const y of [2.6, 2.8, 3]) { FXw.l(y, .1, y + .15, 2.6, '#c49a6a', .03); FXw.q(y + .08, y + .25, 2.3, 2.9, '#e8843a', undefined, .03); }
    gable(0, 0, H, w, d, 1.7, 'x', K.winter() ? mix(q.roof, K.SNOW, .7) : q.roof, { wall: wall, f: K.winter() ? undefined : PAT.shingle(q.roof), over: .3 });
    FXw.sign(q.name, d / 2 - 1.3, d / 2 + 1.3, H + .15, H + .65, trim, dk(wall, .4), { lit: true }, .03);
    K.flag(w / 2, d / 2, H + 1.7, 1.6, '#e8432a', '#f4f0e8'); 
    lit(() => F.sign('KAYAKS', .9, 4.2, 2.52, 2.92, dk(wall, .5), '#ffd98a', { frame: false }, .03));
    // slipway + beached boats
    qz(.5, 4.8, d, d + 1.9, .02, '#c9b89a', '#bfae90');
    for (const [x, c] of [[1, kay[(q.seed + 1) % 6]], [2.6, kay[(q.seed + 4) % 6]]]) { fq([[x, d + .3, .12], [x + .5, d + .2, .12], [x + .55, d + 1.6, .12], [x + .3, d + 1.9, .12], [x + .05, d + 1.6, .12]], c); fq([[x + .15, d + .7, .14], [x + .4, d + .7, .14], [x + .4, d + 1.2, .14], [x + .15, d + 1.2, .14]], '#22283a'); lw([x, d + .3, .12], [x + .05, d + 1.6, .12], dk(c, .5)); lw([x + .05, d + 1.6, .12], [x + .3, d + 1.9, .12], dk(c, .5)); if (K.winter()) fq([[x + .05, d + .3, .15], [x + .45, d + .3, .15], [x + .45, d + .6, .15], [x + .05, d + .6, .15]], K.SNOW); }
    box(6, d + .3, 0, 1.2, .5, .45, '#b08a5a'); for (let i = 0; i < 3; i++) qy(6.1 + i * .35, 6.35 + i * .35, d + .8, .08, .38, ['#e8843a', '#f2c230', '#e8843a'][i]);
  },
  [{ seed: 1 }, { seed: 8, wall: '#c8543a', roof: '#4a5a6a', name: 'ROW CLUB' }, { seed: 19, wall: '#e8dcc0', trim: '#2f4a7a', roof: '#2f4a7a', name: 'PADDLE CO' }]);

/* ---- amphitheatre: stepped seating + stage with sail canopy ---- */
const amphi = K.asset('river.amphitheatre', ['riverwalk', 'amphitheatre', 'stage', 'plaza'], { w: 12, d: 9, seed: 1, stone: '#d6cfc0', accent: '#e8843a', sail: '#f4f0e8', tiers: 5 },
  q => ({ h: q.tiers * .4, top: 5, front: .4 }),
  q => {
    const { w, d, stone: st, accent, tiers } = q, r = rng(q.seed), td = .8, sd = d - tiers * td - .2;
    // seating terraces rise toward the back (-y); grass strips + lit step edges
    for (let i = 0; i < tiers; i++) { const y0 = i * td, h = (tiers - i) * .4; box(0, y0, 0, w, td, h, st, { t: i % 2 ? st : lt(st, .1) });
      if (i === 0) { const g = K.winter() ? [K.SNOW, K.SNOW2] : ['#6fae5a', '#79b964']; qz(.2, w - .2, .15, td - .15, h, g[0], g[1]); }
      lit(() => lw([.2, y0 + td, h - .02], [w - .2, y0 + td, h - .02], lt(accent, .35)));
      for (let x = .6; x < w - .6; x += .9) { const k = r(); if (i > 0 && k < .3) { box(x, y0 + .2, h, .4, .4, .08, ['#c8543a', '#3f6f9f', '#e8b63a'][Math.floor(k * 10)], { ol: false }); } else if (i > 0 && k < .42) { const c = ['#c8543a', '#3f6f9f', '#4f9a8e', '#8a5aa8'][Math.floor(r() * 4)]; box(x, y0 + .25, h, .3, .3, .5, c, { ol: false }); box(x + .04, y0 + .29, h + .5, .22, .22, .22, '#e8b890', { ol: false }); } }
      // aisle stairs
      box(w / 2 - .5, y0 + td / 2, 0, 1, td / 2, h - .2, dk(st, .12), { ol: false }); }
    for (const x of [.3, w - .7]) { box(x, .1, tiers * .4, .4, .4, .3, st); K.planter; const f = foliage('pine', .3); cone(x + .2, .3, tiers * .4 + .3, .35, 1.3, K.winter() ? '#6a9a80' : f); }
    // plaza floor + round stage
    const y0 = tiers * td; qz(0, w, y0, d, .02, PAT.ftile(lt(st, .12), st, 1)); K.snowTop(.3, w - .3, y0 + .2, y0 + 1, .03);
    const cx = w / 2, cy = y0 + sd / 2 + .5, sr = Math.min(2.6, sd / 2 - .1);
    // back poles of the sail
    const P = [[cx - sr - .3, cy - sr * .7], [cx + sr + .3, cy - sr * .7], [cx - sr - .5, cy + sr * .75], [cx + sr + .5, cy + sr * .75]], ph = [4.6, 3.2, 3.2, 2.2];
    for (const i of [0, 1]) lw([P[i][0], P[i][1], 0], [P[i][0], P[i][1], ph[i]], '#8a909c');
    cyl(cx, cy, 0, sr, .35, dk(st, .1), { t: '#8a6444', t2: '#94704e' });
    lit(() => { const p = PW(cx, cy, 0), rx = sr * 16 * 1.414; for (let a = 0; a < Math.PI; a += .12) px(p[0] + Math.cos(a) * rx, p[1] + Math.sin(a) * rx / 2 - 2, C(lt(accent, .4))); });
    // stage gear: speakers, mic, drum-ish, performer
    box(cx - sr * .8, cy - .5, .35, .5, .5, .9, '#2a2a34'); box(cx + sr * .5, cy - .9, .35, .5, .5, .9, '#2a2a34');
    lw([cx, cy + .3, .35], [cx, cy + .3, 1.5], '#5a606c'); box(cx - .5, cy - .2, .35, .3, .3, .55, '#3a4458', { ol: false }); box(cx - .46, cy - .16, .9, .22, .22, .2, '#c68a5e', { ol: false }); lw([cx - .7, cy + .1, .8], [cx - .2, cy + .1, 1.1], '#8a5a3a');
    box(cx + .5, cy - .3, .35, .5, .5, .4, accent);
    // sail canopy (two triangles) + front poles + uplights
    const T3 = i => [P[i][0], P[i][1], ph[i]];
    fq([T3(0), T3(1), T3(3)], K.winter() ? K.SNOW2 : dk(q.sail, .1), 'glass'); fq([T3(0), T3(1), T3(3)], dk(q.sail, .1)); fq([T3(0), T3(3), T3(2)], q.sail);
    glow(() => { fq([T3(0), T3(3), T3(2)], '#ffe0b0', 'glass'); fq([T3(0), T3(1), T3(3)], mix(accent, '#ffe0b0', .5), 'glass'); });
    lw(T3(0), T3(1), '#8a909c'); lw(T3(1), T3(3), '#8a909c'); lw(T3(3), T3(2), '#8a909c'); lw(T3(2), T3(0), '#8a909c'); lw(T3(0), T3(3), dk(q.sail, .25));
    for (const i of [2, 3]) lw([P[i][0], P[i][1], 0], [P[i][0], P[i][1], ph[i]], '#8a909c');
    for (const s of [-1, 1]) { const x = cx + s * sr * .9, y = cy + sr * .55; box(x - .12, y - .12, 0, .24, .24, .2, '#3a3f4a', { ol: false }); lit(() => { const p = PW(x, y, .25); px(p[0], p[1], C(s < 0 ? '#ff9ad0' : '#8fd8ff')); px(p[0] + 1, p[1], C('#fff2c4')); }); }
    K.art('bench', 1.4, d - .6, r); K.art('bench', w - 1.4, d - .6, r);
  },
  [{ seed: 3 }, { seed: 12, w: 14, tiers: 6, stone: '#c9c4c8', accent: '#4fb8d0', sail: '#ffe8c8' }, { seed: 27, w: 10, d: 8, tiers: 4, stone: '#e0cfb0', accent: '#c8543a', sail: '#f4d8e0' }], { solid: true });

/* ---- lookout deck: elevated footbridge-style platform with arch ---- */
const lookout = K.asset('river.lookout', ['riverwalk', 'lookout', 'deck', 'bridge'], { w: 12, d: 4, seed: 1, steel: '#f4f4f0', accent: '#e8432a', dz: 2.4 },
  q => ({ h: q.dz + .3, top: 4.6, front: .6 }),
  q => {
    const { w, d, steel, accent, dz } = q, r = rng(q.seed), sx = 3;      // stairs occupy x 0..sx at the left end
    // V-columns under the deck
    for (const x of [sx + 1.5, w - 1.5]) { for (const y of [.8, d - .8]) { box(x - .25, y - .25, 0, .5, .5, .25, '#8a8f9a', { ol: false }); lw([x, y, .25], [x - .9, y, dz], dk(steel, .25)); lw([x, y, .25], [x + .9, y, dz], dk(steel, .25)); lw([x + .06, y, .25], [x + .96, y, dz], dk(steel, .4)); } }
    // back arch + hangers (behind the deck)
    const arch = (y, c) => { let pv = null; const n = 24; for (let i = 0; i <= n; i++) { const t = i / n, x = sx + (w - sx) * t, z = dz + .3 + Math.sin(t * Math.PI) * 4; if (pv) { lw(pv, [x, y, z], c); lw([pv[0], pv[1], pv[2] + .08], [x, y, z + .08], c); } if (i % 2 === 0 && i > 0 && i < n) lw([x, y, z], [x, y, dz + .3], '#aab4bc'); pv = [x, y, z]; } };
    arch(.25, dk(accent, .25));
    // stairs up from the left
    const ns = 8; for (let i = 0; i < ns; i++) { const h = dz * (i + 1) / ns; box(i * sx / ns, .6, 0, sx / ns + .02, d - 1.2, h + .3, i % 2 ? '#b9b4a8' : '#c9c4b8'); }
    lw([0, d - .6, .85], [sx, d - .6, dz + 1.15], '#aab4bc'); lw([0, d - .6, .3], [0, d - .6, .85], '#aab4bc');
    // deck slab
    box(sx, 0, dz, w - sx, d, .3, steel, { t: PAT.fboards(DECK, .4) }); K.snowTop(sx + .3, w - .3, .3, d - .3, dz + .3);
    glow(() => { for (let x = sx + .4; x < w; x += .6) { const p = PW(x, d, dz - .02); px(p[0], p[1], C('#8fd8ff')); px(p[0], p[1] + 1, C('#5fb8f0')); } });
    lit(() => lw([sx, d + .01, dz + .02], [w, d + .01, dz + .02], '#8fd8ff'));
    // deck furniture: bench, binoculars, planter, people
    const z = dz + .3;
    box(sx + 1.4, .6, z, 2, .45, .4, '#b08a5a'); K.garden(w - 3.2, w - .6, .5, 1.5, z, r, { low: true });
    for (const x of [w - 1.6, w - 4.2]) { cyl(x, d - .7, z, .07, .9, '#5a606c', { ol: false }); box(x - .18, d - .86, z + .9, .36, .3, .22, '#3f6f9f'); }
    for (const [x, c] of [[sx + 3.6, '#c8543a'], [w - 2.8, '#e8b63a']]) { box(x, d - 1.1, z, .26, .26, .55, '#3a4458', { ol: false }); box(x - .03, d - 1.13, z + .55, .32, .32, .5, c, { ol: false }); box(x + .02, d - 1.08, z + 1.05, .22, .22, .22, '#e8b890', { ol: false }); }
    // canopy shade at the far end
    for (const y of [.5, d - .5]) lw([w - .5, y, z], [w - .5, y, z + 2.3], dk(steel, .3)); box(w - 3.4, .1, z + 2.3, 3.2, d - .2, .12, K.winter() ? K.SNOW : accent, { ol: true });
    // glass rails + front arch
    glassRail(FX(w - .05), 0, d, z); glassRail(FY(d - .05), sx, w, z);
    arch(d - .25, accent);
    lit(() => { for (let i = 1; i < 24; i++) { const t = i / 24, p = PW(sx + (w - sx) * t, d - .25, dz + .3 + Math.sin(t * Math.PI) * 4); if (i % 2) px(p[0], p[1] + 2, C('#fff2c4')); } });
    for (const x of [sx + .4, sx + (w - sx) * .45]) { lw([x, .4, z], [x, .4, z + 1.6], '#5a606c'); lit(() => { const p = PW(x, .4, z + 1.7); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) px(p[0] + a, p[1] + b, C('#fff2c4')); }); K.beacon(x, .4, z + 1.7, 0, '#ffe9a0'); }
    lit(() => K.bigText(FY(d), 'RIVER WALK', sx + (w - sx) / 2 - K.bigW('RIVER WALK', 1) / 32, dz + .25, dk(steel, .6), 1, .02));
  },
  [{ seed: 2 }, { seed: 9, w: 14, steel: '#dfe6ea', accent: '#2f8fbf', dz: 2.8 }, { seed: 20, w: 10, steel: '#f0e8d8', accent: '#3f9a6a', dz: 2 }], { solid: true });

export default [restaurant, boathouse, amphi, lookout];
