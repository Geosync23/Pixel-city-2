// Fixtures of the ten brand / speciality clothing stores (src/scenes/rooms/clothing_stores.js; owner msgs 177-178). Ids `furn.cs.*`, fronts face +y.
// Everything is parametric (colours come from the room), so ten shops share a dozen pieces without looking alike.
//   cs.manq         a dressed shop mannequin: the REAL character renderer on a featureless figure. p: { ids: [catalogue piece ids], dir: 0 | 1, tone: 0 white | 1 black | 2 wood | 3 gold }
//   cs.rack / cs.shelves / cs.foldtable / cs.shoewall.boots / cs.accessories.hats   browseable (sim/clothes_shop.js reads the kind from the id; tag `clothing`)
//   cs.cubby (decor twin of cs.shelves: cloth bolts, yarn, denim, shoe boxes, print rolls)   cs.worktable (tailor | print | cobbler)   cs.podium (three-way mirror, tag `csmirror`)
//   cs.runway (lit catwalk)   cs.hang (overhead: disco | canoe | line | lanterns | pennants | spot)   cs.boards (wall: surfboards | oars | hides)   cs.shoebench (two seats + foot mirror)
import { box, qy, qz, lw, fq, glow, lit, ball, cyl, dk, lt, mix, PAT, spx, hash2, rng, at } from '../../engine/raster.js';
import { F, bx, tube, post, posts, frameY, frameZ, table, mirrorY } from './_lib.js';
import { drawChar } from '../chars/char.js';
import { specWith } from '../../data/clothes.js';

const A = (id, tags, size, draw, x) => F('cs.' + id, tags, size, draw, x);
const CH = '#c4c9ce', BR = '#d8a848', INK = '#2a2733', TAU = 6.2832;
const TONE = ['#e6e1d8', '#3a3842', '#c89868', '#d8b060'];
const DEFC = ['#3a3f4c', '#8a9098', '#f1ede4', '#c0a078', '#5a6272', '#2a2733'];
const garment = (x, y, z0, len, d, c) => { bx(x, y, z0, .1, d, len, c); lw([x, y + d, z0 + len], [x + .1, y + d, z0 + len], lt(c, .3)); };

/** the figure a mannequin is: one flat tone from head to toe, no hair, no face */
export function manqSpec(ids, tone) {
  const t = TONE[tone || 0] || TONE[0];
  return Object.assign(specWith({ skin: t, hair: 'bald', hairColor: t, top: 'tank', topColor: t, bottom: 'leggings', bottomColor: t, shoes: t, shoeType: null, build: 'avg', height: 'avg', age: 'adult', bag: null, hat: null, glasses: false, beard: false }, ids || []), { manq: true, skin: t });
}
function cubby(p) {
  const w = p.w || 2, h = p.h || 2, c = p.c || '#8a5a3a', cols = p.cols || DEFC, kind = p.kind || 'folded', nx = Math.max(2, Math.round(w / .5)), nz = p.rows || 4, cw = w / nx, ch = (h - .12) / nz, back = p.back || dk(c, .5);
  box(0, 0, 0, w, .5, h, c); qy(.04, w - .04, .5, .08, h - .04, back);
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const x = i * cw + .05, z = .08 + j * ch, k = cols[Math.floor(hash2(i, j, p.seed || 1) * cols.length)], k2 = cols[Math.floor(hash2(j, i, (p.seed || 1) + 3) * cols.length)];
    if (kind === 'bolts') { for (let b = 0; b < 3; b++) { const bc = cols[(i * 3 + j * 2 + b + (p.seed || 0)) % cols.length]; qy(x + b * (cw - .1) / 3, x + (b + 1) * (cw - .1) / 3 - .02, .5, z + .02, z + ch - .06, bc); lw([x + b * (cw - .1) / 3, .5, z + ch - .06], [x + (b + 1) * (cw - .1) / 3 - .02, .5, z + ch - .06], lt(bc, .35)); } }
    else if (kind === 'yarn') { for (let b = 0; b < 2; b++) for (let r = 0; r < 2; r++) { const bc = cols[(i + j * 2 + b * 3 + r + (p.seed || 0)) % cols.length], bx0 = x + .08 + b * (cw - .16) / 2, bz = z + .07 + r * (ch - .1) / 2; for (const [dx, dy, cc] of [[0, 0, bc], [1, 0, bc], [0, -1, lt(bc, .25)], [1, -1, bc], [2, 0, dk(bc, .2)], [2, -1, dk(bc, .1)], [0, 1, dk(bc, .25)], [1, 1, dk(bc, .25)]]) spx(bx0, .5, bz, dx, dy, cc); } }
    else if (kind === 'boxes') { const n = 2 + Math.floor(hash2(i, j, 9) * 2); for (let b = 0; b < n; b++) { const bc = b % 2 ? k : k2; qy(x + .02, x + cw - .12, .5, z + b * (ch - .06) / 3, z + (b + 1) * (ch - .06) / 3 - .02, bc); spx(x + cw / 2 - .05, .5, z + (b + .5) * (ch - .06) / 3, 0, 0, '#f4f0e8'); } }
    else if (kind === 'rolls') { for (let b = 0; b < 3; b++) { const bc = cols[(i * 2 + j + b + (p.seed || 0)) % cols.length], bx0 = x + .08 + b * (cw - .14) / 3; for (const [dx, dy, cc] of [[0, 0, bc], [1, 0, bc], [0, -1, bc], [1, -1, lt(bc, .3)], [0, 1, dk(bc, .2)], [1, 1, dk(bc, .2)], [0, -2, '#f4f0e8']]) spx(bx0, .5, z + ch / 2, dx, dy, cc); } }
    else { const n = 3 + Math.floor(hash2(i, j, 5) * 2); for (let b = 0; b < n; b++) { const bc = cols[(i + j + b * 2 + (p.seed || 0)) % cols.length]; qy(x + .01, x + cw - .11, .5, z + .01 + b * .075, z + .065 + b * .075, bc); lw([x + .01, .5, z + .065 + b * .075], [x + cw - .11, .5, z + .065 + b * .075], dk(bc, .25)); } }
  }
  for (let i = 1; i < nx; i++) lw([i * cw, .5, .08], [i * cw, .5, h - .04], c); for (let j = 1; j < nz; j++) lw([.04, .5, .08 + j * ch], [w - .04, .5, .08 + j * ch], lt(c, .12));
  if (p.name) { bx(w / 2 - p.name.length * .13 - .1, .5, h, p.name.length * .26 + .2, .04, .34, p.hc || INK); }
}
function hang(p) {
  const k = p.kind || 'spot', x = .25, y = .25, c = p.c || '#f1ede4';
  if (k === 'disco') { post(x, y, 2.45, 2.8, CH); ball(x, y, 2.22, .22, '#9aa4b4'); lit(() => { for (let i = 0; i < 9; i++) spx(x, y, 2.22, Math.round((hash2(i, 1) - .5) * 6), Math.round((hash2(i, 2) - .5) * 6) - 1, ['#f4fbfc', '#e87ad0', '#7ad8f0', '#ffe680'][i % 4]); }); glow(() => { for (let i = 0; i < 6; i++) spx(x, y, 2.22, Math.round(Math.cos(i * 1.05) * 6), Math.round(Math.sin(i * 1.05) * 5) - 1, '#ffffff'); }); return; }
  if (k === 'canoe') { const l = p.l || 3; post(.2, y, 2.3, 2.8, '#c8a878'); post(l - .2, y, 2.3, 2.8, '#c8a878'); fq([[-.2, y, 2.3], [l + .2, y, 2.3], [l - .1, y, 2.02], [.1, y, 2.02]], c); fq([[-.2, y, 2.3], [l + .2, y, 2.3], [l + .1, y, 2.24], [-.1, y, 2.24]], dk(c, .25)); lw([.1, y, 2.02], [l - .1, y, 2.02], dk(c, .4)); for (let i = 1; i < 4; i++) lw([l * i / 4, y, 2.04], [l * i / 4, y, 2.22], dk(c, .16)); return; }
  if (k === 'line') { const l = p.l || 3, cols = p.cols || ['#2a3a6a', '#e8b83a', '#f4f0e8', '#c0563a']; lw([0, y, 2.5], [l, y, 2.5], '#8a7a5a'); for (let i = 0; i * .5 < l - .3; i++) { const cc = cols[i % cols.length], x0 = .15 + i * .5, len = .35 + hash2(i, 4) * .25; qy(x0, x0 + .34, y, 2.5 - len, 2.5, cc); if (i % 2) for (let d = 0; d < 3; d++) spx(x0 + .08 + d * .08, y, 2.5 - len / 2, 0, d % 2, cols[(i + 2) % cols.length]); else lw([x0, y, 2.5 - len + .08], [x0 + .34, y, 2.5 - len + .08], cols[(i + 1) % cols.length]); spx(x0 + .05, y, 2.5, 0, -1, '#c8a068'); spx(x0 + .29, y, 2.5, 0, -1, '#c8a068'); } return; }
  if (k === 'lanterns') { const l = p.l || 3, cols = p.cols || ['#f2c230', '#e8643a', '#f4f0e8']; lw([0, y, 2.62], [l, y, 2.62], INK); for (let i = 0; i * .6 < l - .2; i++) { const cc = cols[i % cols.length], lx = .3 + i * .6, lz = 2.36 - (i % 2) * .12; post(lx, y, lz + .12, 2.62, INK); glow(() => ball(lx, y, lz, .2, '#ffe6a0', { ol: false })); lit(() => ball(lx, y, lz, .14, cc, { t: lt(cc, .3), squash: .9 })); lw([lx - .1, y, lz], [lx + .1, y, lz], dk(cc, .18)); } return; }
  if (k === 'pennants') { const l = p.l || 3, cols = p.cols || ['#d2392f', '#f4f0e8']; lw([0, y, 2.6], [l, y, 2.6], '#8a9098'); for (let i = 0; i * .4 < l - .3; i++) { const x0 = .1 + i * .4; fq([[x0, y, 2.6], [x0 + .3, y, 2.6], [x0 + .15, y, 2.28]], cols[i % cols.length]); } return; }
  post(x, y, 2.5, 2.8, INK); cyl(x, y, 2.36, .1, .14, p.shade || INK, { ol: false, t: dk(p.shade || INK, .2) }); lit(() => cyl(x, y, 2.34, .07, .02, '#fff2c4', { ol: false })); glow(() => { cyl(x, y, 2.2, .16, .1, c, { ol: false }); });
}
const HVB = p => [-.5, -.5, 1.5, (p.l || .5) + .6, 1, 2.95];

export default [
  A('manq', ['csmanq', 'mannequin', 'decor'], [.5, .5, 1.7], p => {
    cyl(.25, .25, 0, .2, .05, p.base || '#8a9098', { t: lt(p.base || '#8a9098', .2) });
    at(.25, .25, .05, () => drawChar(manqSpec(p.ids, p.tone), { anim: 'stand', frame: 0, dir: p.dir === 0 ? 0 : 1 }));
  }, { vb: [-.7, -.7, 0, 1.2, 1.2, 2.5], variants: [{ ids: ['tp_tee_white'] }] }),

  A('rack', ['clothing', 'rack', 'shelf'], p => [p.w || 2, .5, 1.5], p => {
    const w = p.w || 2, cols = p.cols || DEFC, r = rng(p.seed || 1), bar = p.bar || CH;
    if (p.wood) { bx(0, .02, 0, .1, .46, 1.5, p.wood); bx(w - .1, .02, 0, .1, .46, 1.5, p.wood); bx(0, .02, 1.46, w, .46, .06, p.wood); }
    else { bx(.02, .04, 0, .08, .42, .04, dk(bar, .3)); bx(w - .1, .04, 0, .08, .42, .04, dk(bar, .3)); post(.06, .25, 0, 1.45, bar); }
    for (let x = .16; x < w - .2; x += .125) { const c = cols[Math.floor(r() * cols.length)], long = p.long ? .6 + r() * .4 : .42 + r() * .22; spx(x + .05, .25, 1.42, 0, 0, INK); garment(x, .08, 1.36 - long, long, .34, c); if (r() < (p.trim === undefined ? .3 : p.trim)) lw([x + .1, .2, 1.36 - long + .1], [x + .1, .3, 1.36 - long + .1], p.tc || lt(c, .4)); }
    tube([.06, .25, 1.42], [w - .06, .25, 1.42], bar); if (!p.wood) post(w - .06, .25, 0, 1.45, bar);
    if (p.tag) { bx(w / 2 - .22, .2, 1.48, .44, .06, .3, p.tagc || '#f6e04a'); lw([w / 2 - .12, .27, 1.62], [w / 2 + .12, .27, 1.62], '#c0392b'); lw([w / 2 - .12, .27, 1.68], [w / 2 + .06, .27, 1.68], '#c0392b'); }
  }, { vb: p => [-.3, -.3, 0, (p.w || 2) + .3, .8, 2], use: p => ({ x: (p.w || 2) / 2, y: 1 }), variants: [{ seed: 1 }, { seed: 2, cols: ['#2a2733', '#6a3a7a', '#e87ad0'], bar: BR, long: true }, { seed: 3, wood: '#8a5a3a', cols: ['#ead9b8', '#a8452a', '#3f6a4a'] }] }),

  A('shelves', ['clothing', 'shelf'], p => [p.w || 2, .5, p.h || 2], cubby, { use: p => ({ x: (p.w || 2) / 2, y: 1 }), variants: [{}, { kind: 'yarn', cols: ['#ead9b8', '#a8452a', '#3f6a4a', '#e8b83a'], c: '#c8a068' }] }),
  A('cubby', ['decor', 'browse'], p => [p.w || 2, .5, p.h || 2], cubby, { use: p => ({ x: (p.w || 2) / 2, y: 1 }), variants: [{ kind: 'bolts' }, { kind: 'boxes', c: '#5a3a26' }, { kind: 'rolls', c: '#f1ede4' }] }),

  A('foldtable', ['clothing', 'table', 'shelf'], p => [p.w || 2, 1, 1], p => {
    const w = p.w || 2, c = p.c || '#d2a26a', cols = p.cols || DEFC, n = Math.round(w / .5);
    if (p.crate) { box(0, .05, 0, w, .9, .7, c, { l: PAT.siding(dk(c, .18), 4), r: PAT.siding(dk(c, .36), 4) }); } else table(0, 0, w, 1, .75, c, { thick: true });
    for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { const k = cols[(i * 2 + j + (p.seed || 0)) % cols.length], h = .08 + hash2(i, j, p.seed || 1) * .2; box(.08 + i * (w - .16) / n, .1 + j * .45, p.crate ? .7 : .75, (w - .16) / n - .08, .34, h, k, { l: PAT.stripes(dk(k, .18), dk(k, .3), 2), r: PAT.stripes(dk(k, .36), dk(k, .46), 2), ol: false }); }
  }, { use: p => ({ x: (p.w || 2) / 2, y: 1.5 }), variants: [{}, { crate: 1, c: '#c8a068', cols: ['#7fa0c8', '#34507f', '#4a6fa8'] }] }),

  A('shoewall.boots', ['clothing', 'shoes', 'shelf'], p => [p.w || 2, .5, 1.1], p => {
    const w = p.w || 2, c = p.c || '#8a6a48', cols = p.cols || ['#e8b83a', '#3f5a48', '#22384a', '#d04a3a', '#2a2733'];
    for (const z of [0, .55]) { bx(0, .05, z + .08, w, .42, .05, c); for (let i = 0; i * .3 < w - .25; i++) { const k = cols[(i + (z ? 2 : 0) + (p.seed || 0)) % cols.length], x = .08 + i * .3, tall = (i + (z ? 1 : 0)) % 3 !== 2; bx(x, .2, z + .13, .09, .2, tall ? .34 : .14, k); bx(x + .11, .2, z + .13, .09, .2, tall ? .34 : .14, dk(k, .12)); bx(x, .36, z + .13, .2, .08, .07, dk(k, .25)); if (tall) lw([x, .4, z + .44], [x + .2, .4, z + .44], lt(k, .3)); } }
    posts(.03, .08, w - .06, .36, 0, 1.05, dk(c, .3)); bx(0, .05, 1.02, w, .42, .05, c);
  }, { use: p => ({ x: (p.w || 2) / 2, y: 1 }), variants: [{}] }),

  A('accessories.hats', ['clothing', 'decor', 'shelf'], [1, .5, 1.8], p => {
    const cols = p.cols || ['#c0704a', '#2f9a94', '#f2c230', '#7a2a4a', '#f1ede4', '#3a3f4c'], c = p.c || BR;
    cyl(.5, .25, 0, .22, .05, dk(c, .3)); tube([.5, .25, .05], [.5, .25, 1.7], c);
    for (let i = 0; i < 4; i++) { const z = .45 + i * .34, sx = i % 2 ? -1 : 1, hx = .5 + sx * (.3 - i * .02), k = cols[(i + (p.seed || 0)) % cols.length], k2 = cols[(i + 3 + (p.seed || 0)) % cols.length];
      lw([.5, .25, z + .08], [hx, .25, z], c); cyl(hx, .25, z, .15, .03, k, { ol: false, t: lt(k, .15) }); cyl(hx, .25, z + .03, .08, .1, k, { ol: false, t: lt(k, .2) }); lw([hx - .08, .3, z + .05], [hx + .08, .3, z + .05], k2);
      const bx0 = .5 - sx * .26; lw([.5, .25, z + .12], [bx0, .25, z + .06], c); bx(bx0 - .08, .2, z - .14, .16, .1, .16, k2); lw([bx0 - .05, .3, z + .02], [bx0 + .05, .3, z + .02], dk(k2, .35)); }
    ball(.5, .25, 1.74, .07, c);
  }, { vb: [-.3, -.3, 0, 1.3, .8, 2], use: { x: .5, y: 1 }, variants: [{}] }),

  A('worktable', ['decor', 'browse'], p => [p.w || 2, 1, 1], p => {
    const w = p.w || 2, c = p.c || '#8a5a3a', k = p.kind || 'tailor'; table(0, 0, w, 1, .8, c, { thick: true, leg: dk(c, .3) }); bx(.1, .12, .25, w - .2, .76, .04, dk(c, .15));
    if (k === 'tailor') { qz(.15, w * .6, .15, .85, .81, p.cloth || '#3a3f4c'); for (let i = 0; i < 5; i++) spx(.2 + i * .12, .8, .82, 0, 0, '#f4f0e8'); lw([.3, .3, .82], [w * .5, .7, .82], '#f6e04a'); fq([[w * .6 - .25, .3, .82], [w * .6 - .05, .36, .82], [w * .6 - .2, .44, .82]], CH);
      bx(w - .62, .25, .8, .5, .3, .08, '#2a2733'); bx(w - .6, .3, .88, .14, .2, .26, '#2a2733'); bx(w - .6, .3, 1.1, .44, .2, .1, '#2a2733'); post(w - .22, .4, .88, 1.1, CH); spx(w - .4, .5, 1.16, 0, 0, BR); cyl(w - .68, .7, .8, .05, .1, '#c0392b', { ol: false }); }
    else if (k === 'print') { const cols = p.cols || ['#2a3a6a', '#e8b83a', '#c0563a']; qz(.12, w - .5, .15, .85, .81, '#f4f0e8'); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const cc = cols[(i + j) % cols.length]; qz(.2 + i * .28, .2 + i * .28 + .14, .22 + j * .2, .22 + j * .2 + .1, .812, cc); }
      for (let i = 0; i < 3; i++) { cyl(w - .3, .2 + i * .28, .8, .09, .12, '#e8e2d4', { ol: false, t: cols[i % cols.length] }); } bx(w - .62, .6, .8, .16, .1, .08, '#8a5a3a'); }
    else { bx(.2, .3, .8, .1, .3, .2, '#5a5f6a'); fq([[.1, .45, 1], [.4, .45, 1], [.36, .45, 1.1], [.14, .45, 1.1]], '#3a3f4c'); bx(.6, .3, .8, .3, .14, .1, '#6a4428'); bx(.62, .3, .9, .14, .14, .08, '#6a4428'); for (let i = 0; i < 4; i++) { post(w - .5 + i * .1, .25, .8, .98 + (i % 2) * .08, i % 2 ? '#c8a068' : '#8a9098'); } cyl(w - .3, .65, .8, .08, .12, '#c0392b', { ol: false, t: '#3a2a20' }); lw([.5, .7, .82], [1.2, .75, .82], '#3a2a20');
      if (p.lamp !== false) { post(.12, .12, .8, 1.3, '#3a3f4c'); lw([.12, .12, 1.3], [.4, .3, 1.24], '#3a3f4c'); lit(() => spx(.4, .3, 1.22, 0, 0, '#ffe680')); glow(() => qz(.2, .7, .2, .6, .82, '#ffe6a0')); } }
  }, { use: p => ({ x: (p.w || 2) / 2, y: 1.5 }), staff: p => ({ x: (p.w || 2) / 2, y: -.5, dir: 1 }), variants: [{ kind: 'tailor' }, { kind: 'print', c: '#c8a068' }, { kind: 'cobbler', c: '#5a3a26' }] }),

  A('podium', ['csmirror', 'mirror', 'decor'], [1.5, 1, 2], p => {
    const c = p.c || BR; mirrorY(.02, .5, .2, .15, 1.9, dk(c, .3)); mirrorY(.52, 1, .1, .15, 1.9, dk(c, .3)); mirrorY(1.02, 1.5, .2, .15, 1.9, dk(c, .3)); frameY(.02, 1.5, .2, .15, 1.9, c);
    cyl(.75, .62, 0, .34, .14, p.top || '#7a2a2a', { t: lt(p.top || '#7a2a2a', .15) }); cyl(.75, .62, 0, .36, .04, c, { ol: false });
  }, { use: { x: .75, y: 1.4 }, pose: { x: .75, y: .62, z: .14, dir: 1 }, variants: [{}] }),

  A('runway', ['decor'], p => [p.w || 4, p.d || 1, .25], p => {
    const w = p.w || 4, d = p.d || 1, c = p.c || '#1c1622', e = p.edge || '#e87ad0'; box(0, 0, 0, w, d, .22, c, { t: lt(c, .12) });
    lit(() => { lw([0, d, .2], [w, d, .2], e); lw([w, 0, .2], [w, d, .2], e); for (let x = .25; x < w; x += .5) spx(x, d, .2, 0, -1, '#fff2c4'); }); glow(() => { qy(0, w, d, 0, .08, e); });
  }, { variants: [{}] }),

  A('hang', ['decor', 'overhead'], p => [p.l || .5, .5, 2.8], hang, { solid: false, overhead: true, vb: HVB, variants: ['disco', 'canoe', 'line', 'lanterns', 'pennants', 'spot'].map(kind => ({ kind, l: kind === 'disco' || kind === 'spot' ? .5 : 3 })) }),
  A('spot', ['decor', 'overhead', 'lamp'], [.5, .5, 2.8], p => hang(Object.assign({ kind: 'spot' }, p)), { solid: false, overhead: true, vb: [-.5, -.5, 1.5, 1.1, 1, 2.95], light: { x: .25, y: .25, z: 0, r: 2.4 }, variants: [{}] }),

  A('boards', ['decor'], p => [p.w || 2, .2, 2], p => {
    const w = p.w || 2, k = p.kind || 'surf', cols = p.cols || ['#f07a5a', '#3fb8a8', '#fff3c8', '#f2c230'];
    if (k === 'oars') { for (let i = 0; i * .35 < w - .2; i++) { const x = .15 + i * .35, cc = cols[i % cols.length]; tube([x, .08, .05], [x, .08, 1.5], '#c8a068'); fq([[x - .09, .08, 1.5], [x + .09, .08, 1.5], [x + .07, .08, 1.95], [x - .07, .08, 1.95]], cc); lw([x - .08, .08, 1.62], [x + .08, .08, 1.62], '#f4f0e8'); } bx(0, .02, .9, w, .08, .06, '#5a3a26'); return; }
    for (let i = 0; i * .55 < w - .3; i++) { const x = .3 + i * .55, cc = cols[i % cols.length], c2 = cols[(i + 2) % cols.length], h = 1.7 + (i % 2) * .2;
      fq([[x - .2, .1, .3], [x + .2, .1, .3], [x + .22, .1, h * .6], [x + .12, .1, h - .1], [x, .1, h], [x - .12, .1, h - .1], [x - .22, .1, h * .6]], cc); fq([[x - .14, .1, .05], [x + .14, .1, .05], [x + .2, .1, .3], [x - .2, .1, .3]], cc); lw([x, .1, .1], [x, .1, h - .05], c2); if (i % 2) { lw([x - .2, .1, h * .5], [x + .2, .1, h * .5], c2); lw([x - .2, .1, h * .5 + .08], [x + .2, .1, h * .5 + .08], c2); } }
    bx(0, .04, .02, w, .14, .05, '#c8a068');
  }, { wall: true, mount: 0, solid: false, variants: [{}, { kind: 'oars', cols: ['#d2392f', '#f4f0e8'] }] }),

  A('shoebench', ['seating', 'bench', 'clothing_seat'], [1.5, .5, .5], p => {
    const c = p.c || '#7a2a2a'; table(0, .04, 1.5, .42, .38, p.wood || '#5a3a26', { thick: true }); box(.04, .06, .38, 1.42, .38, .08, c, { t: lt(c, .14) }); for (const x of [.4, .75, 1.1]) spx(x, .25, .47, 0, 0, dk(c, .4));
    fq([[.55, .62, 0], [.95, .62, 0], [.95, .5, .3], [.55, .5, .3]], '#bfe4ec'); lw([.55, .62, 0], [.95, .62, 0], BR); lw([.55, .5, .3], [.95, .5, .3], BR);
  }, { vb: [-.3, -.3, 0, 1.8, 1, .9], seats: [{ x: .32, y: .25, z: .46, dir: 1 }, { x: 1.18, y: .25, z: .46, dir: 1 }], variants: [{}, { c: '#2f6a6a' }] }),
];
