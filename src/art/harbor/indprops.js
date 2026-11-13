// Industrial yard props.
import { U, PW, C, px, box, qy, qx, qz, lw, fq, glow, lit, cyl, cone, ball, spx, PAT, rng, dk, lt, mix } from '../../engine/raster.js';
import { Lc, Rc, face, rope, ring, disc, circ, band, crate, drum, pallet, hcyl, chainlink, snowTop, snowDisc, stripeHaz, winter, SNOW } from './_lib.js';

const pallets = {
  id: 'prop.ind.pallets', kind: 'prop', tags: ['industrial', 'harbor', 'pallet', 'cargo'], solid: true, size: p => [1.2, 1, p.load ? 1.4 : (p.n || 4) * .16 + .05], vb: [-.2, -.2, 0, 1.5, 1.3, 1.9],
  variants: [{ n: 1 }, { n: 5 }, { n: 9, seed: 2 }, { load: 'boxes', seed: 1 }, { load: 'wrap', seed: 3 }, { load: 'sacks', seed: 4 }],
  draw(p) {
    const r = rng(p.seed || 1);
    if (!p.load) { const n = p.n || 4; for (let i = 0; i < n; i++) pallet((r() - .5) * .08, (r() - .5) * .08, i * .16, 1.2, 1, i % 3 === 2 ? '#b8935a' : '#c9a36a'); snowTop(0, 1.2, 0, 1, n * .16, .08); return; }
    pallet(0, 0, 0);
    if (p.load === 'boxes') { for (let k = 0; k < 2; k++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { if (k === 1 && r() < .3) continue; const c = ['#c9a36a', '#b98a52', '#d8b47a'][Math.floor(r() * 3)]; box(.05 + i * .56, .05 + j * .46, .16 + k * .5, .54, .44, .5, c); qy(.05 + i * .56 + .2, .05 + i * .56 + .32, .05 + j * .46 + .44, .16 + k * .5, .16 + k * .5 + .5, Lc('#e8d8b0')); } snowTop(.05, 1.15, .05, .95, 1.16, .08); }
    else if (p.load === 'wrap') { box(.06, .06, .16, 1.08, .88, 1.1, '#cfe0e8', { l: PAT.siding(Lc('#cfe0e8'), 4), r: PAT.siding(Rc('#cfe0e8'), 4) }); qy(.3, .7, .945, .6, .9, Lc('#f4f0e8')); lw([.36, .95, .8], [.64, .95, .8], '#4a4458'); snowTop(.06, 1.14, .06, .94, 1.26, .08); }
    else { for (let k = 0; k < 3; k++) for (let i = 0; i < 2; i++) { const c = k % 2 ? '#d8c8a0' : '#cdbb90'; box(.05 + i * .56 + (k % 2) * .03, .08, .16 + k * .26, .52, .84, .26, c); lw([.05 + i * .56 + .1, .92, .16 + k * .26 + .13], [.05 + i * .56 + .4, .92, .16 + k * .26 + .13], '#8a7a5a'); } snowTop(.05, 1.15, .08, .92, .94, .08); }
  },
};

const forklift = {
  id: 'prop.ind.forklift', kind: 'prop', tags: ['industrial', 'harbor', 'forklift', 'vehicle', 'warehouse'], solid: true, size: [2.4, 1.1, 2.1], vb: [-.3, -.3, 0, 3.1, 1.5, 2.9],
  variants: [{ c: '#f2c230' }, { c: '#e8702a', load: true, seed: 2 }, { c: '#3f8a55', load: true, lift: 1, seed: 5 }, { c: '#d8452f' }],
  draw(p) {
    const c = p.c || '#f2c230', W = 1.1, lift = p.lift || 0, blk = '#2e2a3a';
    // far wheels
    disc('y', [.45, .12, .26], .26, blk, null, 10); disc('y', [1.45, .12, .3], .3, blk, null, 10);
    // body: counterweight + chassis
    box(0, .1, .22, .7, W - .2, .75, c); box(.7, .1, .22, 1.1, W - .2, .45, c); box(.1, .2, .97, .45, W - .4, .1, blk, { ol: false });
    qy(.05, .65, W - .1, .5, .62, Lc(blk)); 
    // seat + wheel + guard
    box(.75, .32, .67, .4, .46, .3, '#3a3446'); box(.72, .32, .67, .1, .46, .6, '#3a3446', { ol: false }); lw([1.45, .55, .67], [1.3, .55, 1.15], blk); spx(1.3, .55, 1.15, 0, -1, blk); spx(1.3, .55, 1.15, -1, -1, blk);
    for (const [x, y] of [[.3, .2], [.3, W - .2]]) lw([x, y, .97], [x, y, 2], blk); for (const [x, y] of [[1.65, .2], [1.65, W - .2]]) lw([x, y, .67], [x, y, 2], blk);
    box(.22, .14, 2, 1.5, W - .28, .07, blk); snowTop(.22, 1.72, .14, W - .14, 2.07, .06);
    lit(() => { spx(.5, W / 2, 2.07, 0, -1, '#ff9a30'); spx(.5, W / 2, 2.07, 0, -2, '#ffb850'); spx(.5, W / 2, 2.07, 1, -1, '#ff9a30'); });
    // near wheels
    for (const [x, rr] of [[.45, .26], [1.45, .3]]) { disc('y', [x, W - .08, rr], rr, blk, null, 12); disc('y', [x, W - .07, rr], rr * .42, Lc(c), null, 8); }
    // mast + carriage + forks
    for (const y of [.25, W - .37]) box(1.82, y, .1, .12, .12, 2 + lift * .6, '#4a4458');
    lw([1.88, .31, 1.2 + lift * .5], [1.88, W - .31, 1.2 + lift * .5], '#4a4458'); lw([1.88, .31, 2.05 + lift * .6], [1.88, W - .31, 2.05 + lift * .6], '#4a4458');
    const fz = .12 + lift; box(1.95, .2, fz, .08, W - .4, .6, blk); for (const y of [.26, W - .38]) box(2.0, y, fz, 1, .12, .06, '#6c7a83');
    if (p.load) { pallet(2.02, .05, fz + .06, 1, 1); crate(2.1, .12, fz + .22, .8, '#b98a52', .7); }
    glow(() => { spx(1.82, W - .25, .6, 1, 0, '#fff2c4'); spx(1.82, W - .25, .6, 1, 1, '#fff2c4'); });
  },
};

const dumpster = {
  id: 'prop.ind.dumpster', kind: 'prop', tags: ['industrial', 'harbor', 'dumpster', 'trash', 'street'], solid: true, size: [1.9, 1.1, 1.3], vb: [-.2, -.2, 0, 2.2, 1.5, 1.9],
  variants: [{ c: '#3f7a5a', seed: 1 }, { c: '#2f5a8a', seed: 2, open: true }, { c: '#8a4a3a', seed: 3 }, { c: '#5a5f68', seed: 4, open: true, bags: true }],
  draw(p) {
    const c = p.c || '#3f7a5a', r = rng(p.seed || 1), L = 1.9, W = 1.1;
    for (const x of [.2, L - .2]) { disc('y', [x, W - .1, .09], .09, '#2e2a3a', null, 6); }
    box(0, 0, .12, L, W, .95, c, { l: PAT.planks(Lc(c), 8), r: PAT.planks(Rc(c), 8) }); const F = face('y', W);
    F.q(0, L, .96, 1.07, Lc(dk(c, .25))); F.q(.2, .5, .6, .7, Lc(dk(c, .4))); F.q(L - .5, L - .2, .6, .7, Lc(dk(c, .4))); F.text('MB', .75, .78, lt(c, .5));
    for (const y of [-.06, W - .06]) box(-.08, y + .3, .7, .08, .12, .12, '#4a4458', { ol: false });
    if (p.open) { qz(.08, L - .08, .08, W - .08, 1.07, '#2a2433'); box(0, -.06, 1.07, L, .08, .9, dk(c, .15)); for (let i = 0; i < 4; i++) { const x = .2 + i * .42 + r() * .1; if (r() < .4) box(x, .3 + r() * .3, 1, .35, .3, .22, '#c9a36a', { ol: false }); else ball(x + .15, .35 + r() * .35, 1.12, .2, p.bags || r() < .5 ? '#3a3446' : '#e8e2d4', { squash: .8, ol: false }); } }
    else { fq([[0, 0, 1.3], [L, 0, 1.3], [L, W, 1.07], [0, W, 1.07]], winter() ? SNOW : dk(c, .12)); fq([[L, 0, 1.07], [L, W, 1.07], [L, 0, 1.3]], Rc(dk(c, .1))); lw([0, W, 1.07], [L, W, 1.07], lt(c, .3)); lw([L, W, 1.07], [L, 0, 1.3], dk(c, .6)); lw([0, 0, 1.3], [L, 0, 1.3], dk(c, .6)); lw([L / 2, 0, 1.3], [L / 2, W, 1.07], dk(c, .45)); lw([0, 0, 1.3], [0, W, 1.07], dk(c, .6)); }
    if (p.bags) { ball(L + .1, W - .2, .2, .24, '#3a3446', { squash: .85 }); ball(L - .3, W + .2, .18, .2, '#2e2a3a', { squash: .85 }); }
  },
};

const fence = {
  id: 'prop.ind.fence', kind: 'prop', tags: ['industrial', 'harbor', 'fence', 'chainlink'], solid: true, size: p => [p.len || 4, .2, p.h || 2], vb: p => [-.2, -.2, 0, (p.len || 4) + .2, .5, (p.h || 2) + .5],
  variants: [{ len: 4 }, { len: 6, barbed: true }, { len: 4, sign: 'KEEP OUT' }, { len: 4, gate: true }, { len: 2, slats: '#3f7a5a' }],
  draw(p) {
    const L = p.len || 4, h = p.h || 2, F = face('y', .1), pc = '#7c8690';
    box(0, 0, 0, L, .2, .1, '#b8b4aa', { ol: false });
    if (p.slats) F.q(.05, L - .05, .15, h - .05, PAT.planks(Lc(p.slats), 3));
    if (p.gate) { const m = L / 2; chainlink(F, .05, m - .03, .18, h - .1); chainlink(F, m + .03, L - .05, .18, h - .1); F.l(.05, .18, m - .03, h - .1, pc); F.l(m + .03, h - .1, L - .05, .18, pc); F.q(m - .2, m + .2, .9, 1.15, '#f2c230'); F.q(m - .06, m + .06, .95, 1.1, '#2e2a3a'); for (const x of [.6, L - .6]) cyl(x, .1, 0, .07, .1, '#2e2a3a', { ol: false }); }
    else chainlink(F, .05, L - .05, .1, h - .1);
    for (let x = 0; x <= L + .01; x += L / Math.max(1, Math.round(L / 2))) { box(Math.min(x, L - .1), .05, 0, .1, .1, h, pc, { ol: false }); if (p.barbed) lw([Math.min(x, L - .1) + .05, .1, h], [Math.min(x, L - .1) + .05, .35, h + .3], pc); }
    if (p.barbed) for (const k of [.12, .24, .36]) { lw([0, .1 + k * .7, h + k * .8], [L, .1 + k * .7, h + k * .8], '#5a6068'); for (let x = .2; x < L; x += .4) spx(x, .1 + k * .7, h + k * .8, 0, -1, '#9aa0a8'); }
    if (p.sign) { const tw = p.sign.length * 4 / 16 + .2; F.q(L / 2 - tw / 2, L / 2 + tw / 2, 1.05, 1.55, '#f4f0e8'); F.text(p.sign, L / 2 - tw / 2 + .12, 1.47, '#d8452f'); F.l(L / 2 - tw / 2, 1.05, L / 2 + tw / 2, 1.05, '#d8452f'); }
    if (winter()) lw([0, .1, h + .02], [L, .1, h + .02], SNOW);
  },
};

const barrier = {
  id: 'prop.ind.barrier', kind: 'prop', tags: ['industrial', 'harbor', 'barrier', 'jersey', 'street'], solid: true, size: p => [p.len || 2, .6, .9], vb: p => [-.2, -.2, 0, (p.len || 2) + .2, .8, 1.3],
  variants: [{ len: 2 }, { len: 2, c: '#e8702a', plastic: true }, { len: 2, c: '#f4f0e8', plastic: true, alt: '#d8452f' }, { len: 4, stripe: true }, { len: 2, light: true }],
  draw(p) {
    const L = p.len || 2, c = p.c || '#c4c0b6', W = .6;
    const prof = x => [[x, W, 0], [x, W, .2], [x, W - .17, .42], [x, W - .2, .9], [x, .2, .9], [x, .17, .42], [x, 0, .2], [x, 0, 0]];
    const a = prof(0), b = prof(L), seg = p.plastic && p.alt ? 2 : 1;
    for (let s = 0; s < seg; s++) { const x0 = L * s / seg, x1 = L * (s + 1) / seg, cc = s % 2 ? p.alt : c, A = prof(x0), B = prof(x1);
      fq([A[0], B[0], B[1], A[1]], Lc(cc)); fq([A[1], B[1], B[2], A[2]], lt(Lc(cc), .12)); fq([A[2], B[2], B[3], A[3]], Lc(cc)); fq([A[3], B[3], B[4], A[4]], winter() ? SNOW : lt(cc, .15)); }
    fq(b, Rc(c)); for (let i = 0; i < 7; i++) lw(b[i], b[i + 1], dk(c, .65)); lw(a[0], b[0], dk(c, .65)); lw(a[4], b[4], dk(c, .65)); lw(a[0], a[1], dk(c, .65)); lw(a[1], a[2], dk(c, .65)); lw(a[2], a[3], dk(c, .65)); lw(a[3], a[4], dk(c, .65)); lw(a[3], b[3], lt(c, .5));
    if (p.stripe) face('y', W - .19).q(.1, L - .1, .5, .8, (u, v) => ((u + v) >> 2) & 1 ? '#f2c230' : '#2e2a3a');
    if (!p.plastic && !p.stripe) { for (let x = .5; x < L; x += 1) { spx(x, W - .19, .7, 0, 0, '#f08a3a'); spx(x, W - .19, .7, 1, 0, '#f08a3a'); } lw([L / 2, W, 0], [L / 2, W, .2], dk(c, .3)); }
    if (p.light) { box(L / 2 - .08, W / 2 - .06, .9, .16, .12, .2, '#f2c230', { ol: false }); lit(() => { spx(L / 2, W / 2, 1.2, 0, 0, '#ff9a30'); spx(L / 2, W / 2, 1.2, 0, 1, '#ff9a30'); spx(L / 2, W / 2, 1.2, 1, 0, '#ffb850'); spx(L / 2, W / 2, 1.2, -1, 0, '#ffb850'); }); }
  },
};

const spool = {
  id: 'prop.ind.spool', kind: 'prop', tags: ['industrial', 'harbor', 'spool', 'cable'], solid: true, size: p => p.flat ? [1.5, 1.5, .9] : [1.5, 1, 1.5], vb: [-.3, -.3, 0, 1.8, 1.8, 1.9],
  variants: [{ cable: '#2e2a3a' }, { cable: '#e8702a' }, { cable: '#3f7fbf', big: true }, { flat: true, cable: '#2e2a3a' }, { cable: null }],
  draw(p) {
    const wood = '#c9a36a', cab = p.cable === undefined ? '#2e2a3a' : p.cable;
    if (p.flat) { cyl(.75, .75, 0, .72, .1, wood); cyl(.75, .75, .1, .42, .6, cab || dk(wood, .2), { ol: false }); for (let z = .16; z < .7; z += .1) band(.75, .75, z, .42, .03, dk(cab || wood, .3)); cyl(.75, .75, .7, .72, .1, wood, { t: winter() ? SNOW : lt(wood, .1) }); if (!winter()) { const t = PW(.75, .75, .8); for (let i = -12; i <= 12; i += 4) for (let j = -3; j <= 3; j++) px(t[0] + i, t[1] + j, C(dk(wood, .18))); } return; }
    const R = .72, cx = .75, cz = R, y0 = .05, y1 = .95, flange = (y, front) => { hcyl('y', cx, y, cz, .1, R, wood, { cap: false }); if (front) { const cc = [cx, y + .1, cz]; disc('y', cc, R, Lc(wood), null, 20); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI; lw([cx + Math.cos(a) * R, y + .1, cz + Math.sin(a) * R], [cx - Math.cos(a) * R, y + .1, cz - Math.sin(a) * R], dk(Lc(wood), .22)); } circ('y', cc, R, dk(wood, .65), 24); disc('y', cc, .2, Lc(dk(wood, .3)), null, 10); disc('y', cc, .09, '#2e2a3a', null, 8); for (let k = 0; k < 4; k++) { const a = k / 4 * 6.283 + .78; spx(cx + Math.cos(a) * .45, y + .1, cz + Math.sin(a) * .45, 0, 0, '#4a4458'); } } };
    flange(y0, false); const rr = cab ? (p.big ? .62 : .5) : .28;
    hcyl('y', cx, y0 + .1, cz, y1 - y0 - .1, rr, cab || dk(wood, .15), { cap: false }); if (cab) for (let y = y0 + .2; y < y1; y += .12) circ('y', [cx, y, cz], rr + .005, dk(cab, .35), 10, -1.1, 2.04);
    flange(y1 - .1 + .0, true);
    box(.2, y1 + .0, 0, .25, .12, .1, '#6b5240', { ol: false }); box(1.05, y1, 0, .25, .12, .1, '#6b5240', { ol: false });
    if (cab) rope([cx + rr, y0 + .4, cz], [1.6, .5, .02], .1, cab, 4);
  },
};

const pipes = {
  id: 'prop.ind.pipes', kind: 'prop', tags: ['industrial', 'harbor', 'pipes', 'construction'], solid: true, size: p => [p.len || 4, 1.7, 1.4], vb: p => [-.2, -.2, 0, (p.len || 4) + .3, 2, 1.9],
  variants: [{ c: '#b8b4aa', r: .4, rows: [2, 1] }, { c: '#3f7fbf', r: .26, rows: [3, 2, 1], len: 5 }, { c: '#a8603a', r: .26, rows: [3, 2] }, { c: '#3f8a55', r: .4, rows: [2], len: 3 }, { c: '#5a5f68', r: .2, rows: [4, 3, 2, 1], len: 5 }],
  draw(p) {
    const L = p.len || 4, c = p.c || '#b8b4aa', R = p.r || .4, rows = p.rows || [2, 1], n0 = rows[0], W = n0 * R * 2, y0 = (1.7 - W) / 2;
    for (const x of [.5, L - .7]) box(x, y0 - .15, 0, .2, W + .3, .12, '#8a6a4a');
    for (const x of [.5, L - .7]) { fq([[x, y0 - .15, .12], [x + .2, y0 - .15, .12], [x + .2, y0 + .02, .3], [x, y0 + .02, .3]], '#8a6a4a'); }
    rows.forEach((n, k) => { for (let i = 0; i < n; i++) { const y = y0 + R + (n0 - n) * R + i * R * 2, z = .12 + R + k * R * 1.73, cc = [L, y, z];
      hcyl('x', 0, y, z, L, R, c, { snow: k === rows.length - 1 }); disc('x', [L + .005, y, z], R * .72, '#2a2433', null, 12); circ('x', [L + .005, y, z], R * .72, dk(c, .5), 12);
      if (R > .3) { for (const x of [L * .33, L * .66]) circ('x', [x, y, z], R + .005, dk(c, .25), 14, -1.1, 2.04); } } });
    for (const x of [.5, L - .7]) { const yy = y0 + W; fq([[x, yy + .15, .12], [x + .2, yy + .15, .12], [x + .2, yy - .02, .32], [x, yy - .02, .32]], Lc('#8a6a4a')); fq([[x + .2, yy + .15, .0], [x + .2, yy + .15, .12], [x + .2, yy - .02, .32], [x + .2, yy - .02, 0]], Rc('#8a6a4a')); }
  },
};

export default [pallets, forklift, dumpster, fence, barrier, spool, pipes];
