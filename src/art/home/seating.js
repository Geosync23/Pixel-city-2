// Seating: dining chairs, stools, sofas, armchair, beanbag, office chair.
// Default facing is +y (backrest at y=0, against the back wall). p.face = 3 draws the piece facing -y (seen from behind), e.g. a sofa
// in the middle of the room looking at a TV on the back wall, or a chair on the near side of a table. Flip gives +x / -x facings.
// seats = default (face 1) positions; seatsFor(p) returns the right ones for any p.
import { box, lw, ball, cyl, dk, lt } from '../../engine/raster.js';
import { tier, wood, FAB, METAL, b, leg, pole, shadow, cushion, dot, blob, fabric } from './_lib.js';
import { qz, qy } from '../../engine/raster.js';

const GOLD = '#d9b65c';
function sofa(w, n, p) {
  const t = tier(p), c = p.c || FAB.teal, c2 = p.c2 || FAB.mustard, f3 = p.face === 3, aw = t === 2 ? .22 : .18, ah = t === 2 ? .7 : .54, bh = [.74, .8, .8][t], sw = (w - 2 * aw) / n;
  const B = (x, y, z, ww, dd, h, col, oo) => box(x, f3 ? 1 - y - dd : y, z, ww, dd, h, col, oo), fc = t === 2 ? GOLD : wood(p);
  shadow(-.04, w + .1, 0, 1.1);
  for (const [x, y] of [[.07, .07], [w - .07, .07], [.07, .93], [w - .07, .93]]) leg(x, y, 0, .1, fc);
  const tuft = (u, v) => (t === 2 && u % 6 === 3 && v % 5 === 3) ? dk(c, .45) : (v === (t === 2 ? 1 : 3)) ? dk(c, .34) : dk(c, .18);
  const back = () => B(aw, 0, .1, w - 2 * aw, .26, bh - .1, c, f3 ? { l: tuft } : null);
  const arm = x => { B(x, 0, .1, aw, 1, ah - .1, c, { t: lt(c, .12) }); };
  const base = () => B(aw, .24, .1, w - 2 * aw, .76, .2, dk(c, .1));
  const seatC = () => { for (let i = 0; i < n; i++) B(aw + i * sw, .26, .3, sw, .74, .13, c, { t: lt(c, .1) }); };
  const backC = () => { for (let i = 0; i < n; i++) B(aw + i * sw + .02, .24, .43, sw - .04, .16, .3, lt(c, .06), t === 2 ? { l: (u, v) => (u % 5 === 2 && v % 5 === 2) ? dk(c, .4) : dk(c, .14) } : null); };
  const extras = () => {
    if (t >= 1) B(aw + .04, .42, .43, .32, .14, .26, c2, { t: lt(c2, .2) });
    if (t === 2 || p.pillows === 2) B(w - aw - .36, .42, .43, .32, .14, .26, p.c3 || lt(c2, .35));
    if (t === 0) { const k = p.c2 || '#d9a45a'; qz(aw + sw * .3, aw + sw * .3 + .2, f3 ? .2 : .6, f3 ? .4 : .8, .435, k); }
  };
  if (f3) { arm(0); base(); seatC(); back(); if (t === 0) { box(aw + sw * .2, .98, .5, .5, .04, bh - .5, p.c2 || '#d9a45a', { l: fabric(p.c2 || '#d9a45a', '#eadfc8', 'check', .1), ol: false }); } arm(w - aw); }
  else { back(); arm(0); base(); seatC(); backC(); extras(); arm(w - aw); }
}
const sofaSeats = (w, n, t) => { const aw = t === 2 ? .22 : .18, sw = (w - 2 * aw) / n; return Array.from({ length: n }, (_, i) => ({ x: aw + (i + .5) * sw, y: .64, z: .43, dir: 1 })); };
const faceFlip = (seats, d) => p => p && p.face === 3 ? seats.map(s => Object.assign({}, s, { y: d - s.y, dir: 3 })) : seats;
const sofaAsset = (id, w, n, variants, tags = ['sofa']) => {
  const seats = sofaSeats(w, n, 1);
  return { id: 'furn.home.' + id, kind: 'furniture', tags: ['home', 'living', 'seat', ...tags], size: [w, 1, .8], use: { x: w / 2, y: 1.35 }, seats, seatsFor: faceFlip(seats, 1), variants, draw: p => sofa(w, n, p) };
};
function sofaL(p) {
  const t = tier(p), c = p.c || FAB.sage, c2 = p.c2 || FAB.rust, aw = .2, bh = .8, fc = t === 2 ? GOLD : wood(p);
  shadow(-.04, 3.1, 0, 1.1); shadow(-.04, 1.1, 1.1, 2.1);
  for (const [x, y] of [[.07, .07], [2.93, .07], [2.93, .93], [.07, 1.93], [.93, 1.93]]) leg(x, y, 0, .1, fc);
  box(0, 0, .1, 3 - aw, .26, bh - .1, c);
  box(0, .24, .1, 3 - aw, .76, .2, dk(c, .1)); box(0, 1, .1, 1, 1, .2, dk(c, .1));
  box(0, .26, .3, 1, 1.72, .13, c, { t: lt(c, .1) });
  const sw = (2 - aw) / 2; for (let i = 0; i < 2; i++) box(1 + i * sw, .26, .3, sw, .74, .13, c, { t: lt(c, .1) });
  for (let i = 0; i < 3; i++) { const x0 = i === 0 ? .02 : 1 + (i - 1) * sw + .02; box(x0, .24, .43, (i ? sw : 1) - .04, .16, .3, lt(c, .06), t === 2 ? { l: (u, v) => (u % 5 === 2 && v % 5 === 2) ? dk(c, .4) : dk(c, .14) } : null); }
  if (t >= 1) { box(.08, .42, .43, .32, .14, .26, c2, { t: lt(c2, .2) }); box(2.38, .42, .43, .32, .14, .26, lt(c2, .35)); }
  if (t === 2) { qz(.05, .95, 1.45, 1.8, .435, fabric('#eadfc8', '#d9c8a8', 'check', .12)); }
  if (t === 0) qz(1.5, 1.7, .6, .8, .435, '#d9a45a');
  box(3 - aw, 0, .1, aw, 1, .46, c, { t: lt(c, .12) });
}
function chair(p) {
  const t = tier(p), wd = t === 0 ? (p.metal || '#8e979d') : wood(p), c = p.c || FAB.red, f3 = p.face === 3, Y = (y, d = 0) => f3 ? .5 - y - d : y;
  shadow(.03, .5, .03, .5);
  const lc = t === 2 ? GOLD : wd;
  for (const [x, y] of [[.09, .09], [.41, .09], [.09, .41], [.41, .41]]) leg(x, y, 0, .42, lc);
  const seat = () => { box(.05, .05, .4, .4, .4, .05, t === 0 ? c : wd); if (t) b(.07, .07, .45, .36, .36, .03, c, { t: lt(c, .12) }); };
  const back = () => {
    const y = Y(.05, .05);
    if (t === 2) { box(.06, y, .46, .38, .06, .52, c, { l: (u, v) => (u % 3 === 1 && v % 3 === 1) ? dk(c, .4) : dk(c, .16) }); lw([.06, y + .06, .98], [.44, y + .06, .98], GOLD); }
    else if (t === 1) { leg(.09, y + .03, .45, .46, wd); leg(.41, y + .03, .45, .46, wd); box(.06, y, .8, .38, .05, .13, wd); b(.06, y, .6, .38, .05, .05, wd); }
    else { leg(.09, y + .03, .45, .4, wd); leg(.41, y + .03, .45, .4, wd); box(.07, y, .66, .36, .04, .2, c); }
  };
  if (f3) { seat(); back(); } else { back(); seat(); }
}
function stool(p) {
  const t = tier(p), wd = t === 2 ? GOLD : wood(p), c = p.c || (t ? FAB.red : wood(p)), h = p.bar ? .72 : .46;
  shadow(.05, .48, .05, .48);
  for (const [x, y] of [[.12, .12], [.38, .12], [.12, .38], [.38, .38]]) leg(x, y, 0, h, wd);
  if (p.bar) { lw([.12, .38, .22], [.38, .38, .22], wd); lw([.38, .12, .22], [.38, .38, .22], dk(wd, .2)); }
  cyl(.25, .25, h, .19, t ? .08 : .05, c, { t: lt(c, .15) });
  if (t === 2) dot(.25, .25, h + .08, dk(c, .4));
}
function beanbag(p) {
  const t = tier(p), c = p.c || FAB.mustard;
  shadow(.02, 1, .02, 1);
  ball(.5, .5, .24, t === 2 ? .46 : .42, c, { squash: .62 }); ball(.46, .42, .5, .27, lt(c, .05), { squash: .7, ol: false });
  blob(.52, .55, .5, 5, 2, dk(c, .16));
  if (t === 0) { blob(.75, .75, .3, 2, 2, p.c2 || '#d9a45a'); }
  if (t === 2) { lw([.2, .8, .2], [.5, .95, .16], lt(c, .4)); dot(.47, .42, .72, dk(c, .5)); }
  if (t >= 1) lw([.3, .86, .3], [.36, .9, .2], dk(c, .35));
}
function officeChair(p) {
  const t = tier(p), c = p.c || ['#59607a', '#3d4150', '#2c2738'][t], ac = p.c2 || FAB.red, m = t === 2 ? '#c2cad0' : '#3a3a46', f3 = p.face === 3, Y = (y, d = 0) => f3 ? .5 - y - d : y;
  shadow(.03, .5, .03, .5);
  for (const [dx, dy] of [[.2, 0], [-.2, 0], [.06, .2], [.06, -.2], [-.16, .13]]) { lw([.25, .25, .1], [.25 + dx, .25 + dy, .04], m); dot(.25 + dx, .25 + dy, .02, '#22252f'); }
  leg(.25, .25, .08, .32, m);
  const seat = () => box(.06, .06, .4, .38, .38, .08, c, { t: lt(c, .1) });
  const back = () => {
    const y = Y(.04, .07), bh = [.42, .5, .68][t];
    pole(.25, y + .035, .44, .1, m);
    box(.08, y, .54, .34, .07, bh, c, t === 1 ? { l: (u, v) => ((u + v) & 1) ? dk(c, .3) : dk(c, .1) } : null);
    if (t === 2) { lw([.12, y + .07, .58], [.12, y + .07, .54 + bh - .04], ac); lw([.38, y + .07, .58], [.38, y + .07, .54 + bh - .04], ac); b(.16, y, .54 + bh, .18, .07, .1, c); }
  };
  const arms = x => { if (t) { pole(x, .25, .48, .16, m); lw([x, .12, .64], [x, .4, .64], t === 2 ? c : m); } };
  if (f3) { arms(.07); seat(); back(); arms(.43); } else { back(); arms(.07); seat(); arms(.43); }
}

const chairSeats = [{ x: .25, y: .27, z: .46, dir: 1 }];
const T3 = [{ tier: 0 }, { tier: 1 }, { tier: 2 }];
export default [
  { id: 'furn.home.chair', kind: 'furniture', tags: ['home', 'kitchen', 'dining', 'seat', 'chair'], size: [.5, .5, .95], use: { x: .25, y: .8 }, seats: chairSeats, seatsFor: faceFlip(chairSeats, .5),
    variants: [{ tier: 0, c: FAB.teal }, { tier: 1, c: FAB.red }, { tier: 2, c: FAB.navy }, { tier: 0, c: FAB.mustard, face: 3 }, { tier: 1, c: FAB.sage, wood: '#e9e2d2', face: 3 }, { tier: 2, c: FAB.plum, face: 3 }], draw: chair },
  { id: 'furn.home.stool', kind: 'furniture', tags: ['home', 'kitchen', 'dining', 'seat', 'stool'], size: p => [.5, .5, p.bar ? .8 : .52], use: { x: .25, y: .8 }, seats: [{ x: .25, y: .25, z: .5, dir: 1 }], seatsFor: p => [{ x: .25, y: .25, z: p && p.bar ? .8 : .5, dir: 1 }],
    variants: [{ tier: 0 }, { tier: 1, c: FAB.teal }, { tier: 2, c: '#7a4a3a' }, { tier: 0, bar: true }, { tier: 1, bar: true, c: FAB.mustard }, { tier: 2, bar: true, c: FAB.navy }], draw: stool },
  sofaAsset('sofa.2', 2, 2, [{ tier: 0, c: FAB.olive }, { tier: 1, c: FAB.teal }, { tier: 2, c: FAB.plum, c2: FAB.rose }, { tier: 1, c: FAB.rust, c2: FAB.cream, face: 3 }, { tier: 0, c: FAB.grey, face: 3 }]),
  sofaAsset('sofa.3', 3, 3, [{ tier: 0, c: '#9a7a5a' }, { tier: 1, c: FAB.blue, c2: FAB.cream, pillows: 2 }, { tier: 2, c: '#3f6f5a', c2: FAB.mustard }, { tier: 2, c: FAB.navy, c2: FAB.red, face: 3 }]),
  { id: 'furn.home.sofa.L', kind: 'furniture', tags: ['home', 'living', 'seat', 'sofa'], size: [3, 2, .8], blocks: [[0, 0, 3, 1], [0, 1, 1, 2]], use: { x: 2, y: 1.35 },
    seats: [{ x: .5, y: .64, z: .43, dir: 1 }, { x: 1.45, y: .64, z: .43, dir: 1 }, { x: 2.35, y: .64, z: .43, dir: 1 }, { x: .5, y: 1.4, z: .43, dir: 1 }],
    variants: [{ tier: 0, c: FAB.grey }, { tier: 1, c: FAB.sage }, { tier: 2, c: '#e6d9c4', c2: FAB.teal }, { tier: 2, c: FAB.char, c2: FAB.mustard }], draw: sofaL },
  sofaAsset('armchair', 1, 1, [{ tier: 0, c: '#9a7a5a' }, { tier: 1, c: FAB.mustard, c2: FAB.teal }, { tier: 2, c: '#8a3a3a', c2: FAB.cream }, { tier: 1, c: FAB.rose, c2: FAB.cream, face: 3 }], ['armchair']),
  { id: 'furn.home.beanbag', kind: 'furniture', tags: ['home', 'living', 'seat', 'beanbag'], size: [1, 1, .6], use: { x: .5, y: 1.3 }, seats: [{ x: .5, y: .55, z: .35, dir: 1 }],
    variants: [{ tier: 0, c: FAB.olive }, { tier: 1, c: FAB.mustard }, { tier: 1, c: FAB.red }, { tier: 2, c: FAB.plum }], draw: beanbag },
  { id: 'furn.home.officechair', kind: 'furniture', tags: ['home', 'living', 'seat', 'chair', 'office'], size: [.5, .5, 1], vb: [-.3, -.3, 0, .8, .8, 1.5], use: { x: .25, y: .8 }, seats: [{ x: .25, y: .27, z: .5, dir: 1 }], seatsFor: faceFlip([{ x: .25, y: .27, z: .5, dir: 1 }], .5),
    variants: [...T3, { tier: 0, face: 3 }, { tier: 1, face: 3 }, { tier: 2, face: 3, c2: '#3fb8a8' }], draw: officeChair },
];
