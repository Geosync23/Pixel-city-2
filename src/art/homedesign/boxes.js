// Home design + online ordering (Wave C): what a delivery looks like on your floor. Ids `furn.homedesign.*`.
//   parcel     a small taped parcel (0.5 x 0.5)            p.seed 0..6 picks tape / label colours, p.c the card colour
//   carton     a big furniture carton (1 x 1, 0.8 high)    p.seed, p.c; arrows-up mark, red FRAGILE sticker on some
//   flatpack   two or three long flat-pack boxes (1 x 1)   p.seed, p.c (the shop's stripe colour); a picture label on the top one
//   cardboard  flattened boxes tied with string, waiting to be recycled (0.5 x 0.5, never in the way)   p.n 1..3 how many
// The box pieces carry the tag `hd_box`, the pile `hd_card` (handlers in src/sim/homedesign.js).
import { box, qy, qx, qz, lw, dk, lt } from '../../engine/raster.js';
import { shadow } from '../home/_lib.js';

const CARD = ['#c9a36a', '#b8925a', '#d2ad74', '#c29a62'], TAPE = ['#e9d9a8', '#f1eee6', '#9ad0e8', '#e9d9a8'], INK = '#59607a', RED = '#d8483e';
const S = (id, tags, o) => Object.assign({ id: 'furn.homedesign.' + id, kind: 'furniture', tags: ['home', 'decor', ...tags] }, o);
const V7 = [{ seed: 0 }, { seed: 2 }, { seed: 4 }, { seed: 5 }];

function parcel(p) {
  const s = (p.seed || 0) % 7, c = p.c || CARD[s % 4], t = TAPE[s % 4], w = [.34, .4, .3][s % 3], h = [.22, .28, .2][s % 3], x = (.5 - w) / 2;
  shadow(x, x + w + .05, .08, .5); box(x, .08, 0, w, .36, h, c, { t: lt(c, .15) });
  lw([x + w / 2, .08, h], [x + w / 2, .44, h], t); lw([x + w / 2, .44, h], [x + w / 2, .44, h - .1], t);
  qy(x + .04, x + .18, .44, h * .3, h * .72, '#f8f5ee'); lw([x + .06, .44, h * .5], [x + .16, .44, h * .5], INK);
  if (s % 2) qy(x + w - .13, x + w - .04, .44, h * .45, h * .8, RED);
}
function carton(p) {
  const s = (p.seed || 0) % 7, c = p.c || CARD[s % 4], t = TAPE[s % 4], w = .82, d = .78, h = [.78, .7, .84][s % 3], x = .09, y = .1;
  shadow(x, x + w + .08, y, y + d + .06); box(x, y, 0, w, d, h, c, { t: lt(c, .14) });
  /* tape over the top seam and down both faces */
  qz(x + w / 2 - .05, x + w / 2 + .05, y, y + d, h, t); qy(x + w / 2 - .05, x + w / 2 + .05, y + d, h - .2, h, t);
  lw([x, y + d / 2, h], [x + w, y + d / 2, h], dk(c, .3));
  /* this-way-up arrows */
  for (const ax of [x + .12, x + .24]) { lw([ax, y + d, .14], [ax, y + d, .34], INK); lw([ax - .04, y + d, .28], [ax, y + d, .34], INK); lw([ax + .04, y + d, .28], [ax, y + d, .34], INK); }
  lw([x + .08, y + d, .1], [x + .28, y + d, .1], INK);
  /* address label + sticker */
  qy(x + w - .34, x + w - .08, y + d, .3, .52, '#f8f5ee'); lw([x + w - .31, y + d, .45], [x + w - .12, y + d, .45], INK); lw([x + w - .31, y + d, .38], [x + w - .18, y + d, .38], INK);
  if (s % 2 === 0) qy(x + w - .32, x + w - .1, y + d, .1, .2, RED);
  qx(x + w, y + .1, y + .36, h - .34, h - .12, dk('#f8f5ee', .12));
}
function flatpack(p) {
  const s = (p.seed || 0) % 7, c = p.c || CARD[s % 4], stripe = p.stripe || ['#3f6fb0', '#e0a030', '#3f8f8a', '#3f6fb0'][s % 4], n = 2 + (s % 2);
  shadow(.04, 1.02, .2, .86);
  let z = 0;
  for (let i = 0; i < n; i++) {
    const w = .92 - i * .06, d = .5 - i * .05, h = [.14, .1, .12][i], x = .04 + i * .03 + (i === 1 ? .03 : 0), y = .24 + i * .03, cc = i % 2 ? dk(c, .06) : c;
    box(x, y, z, w, d, h, cc, { t: lt(cc, .14) });
    qy(x + .06, x + .2, y + d, z + .02, z + h - .02, stripe); lw([x + .26, y + d, z + h / 2], [x + w - .08, y + d, z + h / 2], dk(cc, .32));
    z += h;
    if (i === n - 1) { qz(x + .08, x + .36, y + .08, y + d - .08, z, '#f8f5ee'); lw([x + .12, y + .16, z], [x + .32, y + .16, z], INK); lw([x + .12, y + d - .16, z], [x + .26, y + d - .16, z], INK); qz(x + w - .2, x + w - .08, y + .1, y + .22, z, stripe); lw([x + w / 2 + .06, y, z], [x + w / 2 + .06, y + d, z], TAPE[s % 4]); }
  }
}
function cardboard(p) {
  const n = Math.max(1, Math.min(3, p.n || 1)), c = '#c9a36a';
  shadow(.06, .5, .1, .48);
  let z = 0;
  for (let i = 0; i < n + 1; i++) { const x = .06 + (i % 2) * .03, y = .1 + ((i + 1) % 2) * .03, cc = i % 2 ? dk(c, .08) : lt(c, .04); box(x, y, z, .38, .34, .035, cc, { t: lt(cc, .12), ol: i === n }); z += .035; }
  /* string */
  lw([.25, .1, z], [.25, .47, z], '#f1eee6'); lw([.06, .28, z], [.47, .28, z], '#f1eee6'); lw([.25, .47, z], [.25, .47, 0], '#f1eee6');
}

export default [
  S('parcel', ['hd_box'], { size: [.5, .5, .4], use: { x: .25, y: .8 }, variants: V7, draw: parcel }),
  S('carton', ['hd_box'], { size: [1, 1, .9], use: { x: .5, y: 1.3 }, variants: V7, draw: carton }),
  S('flatpack', ['hd_box'], { size: [1, 1, .45], use: { x: .5, y: 1.3 }, variants: V7, draw: flatpack }),
  S('cardboard', ['hd_card'], { size: [.5, .5, .2], solid: false, use: { x: .25, y: .8 }, variants: [{ n: 1 }, { n: 2 }, { n: 3 }], draw: cardboard }),
];
