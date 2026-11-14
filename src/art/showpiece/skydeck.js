// SkyDeck at Beacon Tower — art. ids furn.skydeck.*
//   pano        wall art (wall:true, mount 0): a section of the Maple Bay panorama behind floor-to-ceiling glass.
//               p: { w (units, default 4), u0 (panorama px at the section's start), rev (u runs backwards: use on the 'x' wall), time 'day'|'dusk'|'night', season, frame 0..31, plane }
//   scope (telescope)  glassfloor (flat)  plaque {kind: 'info'|'photo', c}  model (city model on a plinth)  liftdoor (wall; p.open, p.floor)  core (lift core for the deck)  photospot (flat)
import * as R from '../../engine/raster.js';
import { pano, PANO_H } from './_pano.js';
const { box, qy, qx, qz, lw, lit, glow, cyl, ball, dk, lt, PW, px, C } = R;
const STEEL = '#8e98a8', DARK = '#39424e', GOLD = '#e8c06a';
const HW = PANO_H / 16; // wall height in units (4)

function liftDoors(x, y, z, p = {}, floor = '1') {
  qy(x - .12, x + 1.52, y, z, z + 2.3, '#c9ced6'); qy(x, x + 1.4, y, z, z + 2.05, p.open ? '#2a2733' : '#aab2bf');
  if (p.open) { lit(() => { qy(x + .1, x + 1.3, y, z + .1, z + 2, '#f6e2b0'); qy(x + .1, x + 1.3, y, z + .9, z + 1, '#c9a26a'); }); qy(x, x + .14, y, z, z + 2.05, '#8e98a8'); qy(x + 1.26, x + 1.4, y, z, z + 2.05, '#8e98a8'); }
  else { qy(x + .68, x + .72, y, z, z + 2.05, '#5a6472'); qy(x + .1, x + .6, y, z + .2, z + 1.9, '#b8c0cc'); qy(x + .8, x + 1.3, y, z + .2, z + 1.9, '#b8c0cc'); qy(x + .2, x + .3, y, z + .4, z + 1.7, '#d6dce6'); qy(x + .9, x + 1, y, z + .4, z + 1.7, '#d6dce6'); }
  R.signY(String(floor), x + .4, x + 1, y, z + 2.08, z + 2.28, '#1b1a24', '#ffb050', { lit: true, frame: false });
  lit(() => qy(x + 1.6, x + 1.68, y, z + 1.05, z + 1.15, '#7df0a0')); qy(x + 1.56, x + 1.72, y, z + .95, z + 1.25, DARK, 'glass');
}

const A = [
  { id: 'furn.skydeck.pano', kind: 'furniture', tags: ['skydeck', 'panorama', 'window'], wall: true, mount: 0, solid: false, size: p => [p.w || 4, .12, HW],
    variants: [{ w: 8, u0: 200, time: 'day' }, { w: 8, u0: 200, time: 'dusk' }, { w: 8, u0: 200, time: 'night' }, { w: 8, u0: 380, time: 'day', season: 3 }, { w: 6, u0: 512, time: 'dusk', frame: 20 }, { w: 6, u0: 0, time: 'day', season: 2 }],
    draw(p) {
      const w = p.w || 4, n = Math.round(w * 16), u0 = p.u0 || 0, y = .1, cols = [];
      for (let i = 0; i < n; i++) { const s = PW((i + .5) / 16, y, 0); cols.push(Math.floor(s[0]), Math.round(s[1])); }
      const put = (x, v, c) => { px(cols[x * 2], cols[x * 2 + 1] - 1 - v, C(c)); };
      const o = { w: n, time: p.time || 'day', season: p.season === undefined ? R.ENV.season : p.season, frame: p.frame || 0, plane: p.plane === undefined ? -1 : p.plane, lit: f => lit(f) };
      if (p.rev) { o.u0 = u0 - n; pano((x, v, c) => put(n - 1 - x, v, c), o); } else { o.u0 = u0; pano(put, o); }
      // glass: reflections, mullions, kerb + header
      for (let k = 0; k < w; k += 2) { if ((k / 2) % 2 === 0) R.fq([[k + .5, y, 3.4], [k + .58, y, 3.4], [k + .3, y, 2.5], [k + .22, y, 2.5]], '#eaf6fc', 'glass'); }
      for (let k = 0; k <= w; k += 2) qy(Math.max(0, k - .05), Math.min(w, k + .05), y, 0, HW, DARK);
      qy(0, w, y, 0, .16, DARK); qy(0, w, y, .16, .2, STEEL); qy(0, w, y, HW - .22, HW, DARK); qy(0, w, y, 2.74, 2.78, DARK);
    } },
  { id: 'furn.skydeck.scope', kind: 'furniture', tags: ['skydeck', 'telescope'], size: [.5, .5, 1.45], use: { x: .25, y: .85 }, variants: [{}, { c: '#b8443a' }, { c: '#2f6fb0' }],
    draw(p) { const c = p.c || '#2f8f96'; cyl(.25, .25, 0, .2, .08, DARK); cyl(.25, .25, .08, .07, .82, STEEL); box(.1, .12, .9, .3, .3, .12, c); box(.04, .04, 1.02, .42, .42, .3, c); qy(.04, .46, .46, 1.02, 1.32, dk(c, .12)); cyl(.15, .47, 1.12, .055, .02, DARK, { ol: false }); cyl(.35, .47, 1.12, .055, .02, DARK, { ol: false }); qy(.2, .3, .46, 1.24, 1.29, GOLD); lit(() => qy(.38, .43, .46, 1.24, 1.28, '#7df0a0')); qx(.46, .14, .2, 1.1, 1.24, GOLD); box(-.02, .16, 1.08, .06, .18, .16, DARK, { ol: false }); } },
  { id: 'furn.skydeck.glassfloor', kind: 'furniture', tags: ['skydeck', 'glassfloor'], solid: false, flat: true, size: p => [p.w || 3, p.d || 2, .03], variants: [{}, { w: 4, d: 3 }],
    draw(p) { const w = p.w || 3, d = p.d || 2, r = R.rng(5);
      qz(0, w, 0, d, .01, STEEL); qz(.12, w - .12, .12, d - .12, .015, '#1f3a52', '#274862');
      for (let x = .5; x < w - .3; x += .9) qz(x, x + .14, .12, d - .12, .02, '#4a5a68'); for (let y = .45; y < d - .3; y += .75) qz(.12, w - .12, y, y + .1, .02, '#4a5a68');
      for (let i = 0; i < 14; i++) { const x = .2 + r() * (w - .5), y = .2 + r() * (d - .5); qz(x, x + .1 + r() * .22, y, y + .1 + r() * .16, .022, ['#6a7a8c', '#8a7a6c', '#5a8a7a', '#9aa8b8'][i % 4]); }
      lit(() => { for (let i = 0; i < 9; i++) { const x = .5 + Math.floor(r() * 3) * .9 + .04, y = .2 + r() * (d - .5); qz(x, x + .05, y, y + .05, .024, i % 3 ? '#ffe9a0' : '#ff7a6a'); } });
      R.fq([[.3, .2, .026], [.7, .2, .026], [.2, d - .2, .026], [.12, d - .2, .026]], '#cfe6f2', 'glass'); R.outline(0, 0, 0, w, d, .02, DARK); for (let x = w / 2; x < w; x += w) lw([x, 0, .03], [x, d, .03], STEEL); } },
  { id: 'furn.skydeck.plaque', kind: 'furniture', tags: ['skydeck', 'plaque'], size: [.5, .5, 1.1], use: { x: .25, y: .85 }, variants: [{}, { kind: 'photo' }, { c: '#7a4e2d' }],
    draw(p) { const c = p.c || DARK; cyl(.25, .22, 0, .16, .06, c); cyl(.25, .22, .06, .05, .8, STEEL); R.fq([[.02, .12, 1.02], [.48, .12, 1.02], [.48, .42, .84], [.02, .42, .84]], p.kind === 'photo' ? '#2f6fb0' : '#f4ead0'); R.fq([[.02, .42, .84], [.48, .42, .84], [.48, .42, .8], [.02, .42, .8]], c);
      if (p.kind === 'photo') { R.fq([[.14, .2, .98], [.36, .2, .98], [.36, .34, .9], [.14, .34, .9]], '#f4f0e8'); lit(() => R.spx(.25, .27, .94, 0, 0, '#ffe9a0')); R.spx(.25, .27, .94, 1, 0, DARK); R.spx(.25, .27, .94, -1, 0, DARK); }
      else { for (let i = 0; i < 3; i++) lw([.08, .2 + i * .07, .97 - i * .04], [.42 - (i === 2 ? .12 : 0), .2 + i * .07, .97 - i * .04], '#7a6a5a'); R.spx(.08, .16, 1, 0, 0, '#b8443a'); R.spx(.08, .16, 1, 1, 0, '#b8443a'); } } },
  { id: 'furn.skydeck.model', kind: 'furniture', tags: ['skydeck', 'city_model'], size: [2, 1.5, 1.6], use: { x: 1, y: 1.9 }, variants: [{}],
    draw() { box(0, 0, 0, 2, 1.5, .8, '#f0ece4', { l: '#e2dccc' }); qy(0, 2, 1.5, 0, .1, DARK); qy(.3, 1.7, 1.5, .45, .62, '#e2dccc'); R.textY('MAPLE BAY', .42, 1.5, .61, '#7a6a5a'); qz(.06, 1.94, .06, 1.44, .81, '#8fbf6a', '#84b560'); qz(.06, .9, .06, .5, .82, '#4f9fd0', '#63add6'); qz(.9, 1.1, .06, 1.44, .82, '#63add6');
      const T = [[1.3, .25, .16, .5, '#6a8aa8'], [1.55, .2, .14, .34, '#8a7a9c'], [1.25, .6, .2, .72, '#4a7a90'], [1.6, .65, .16, .42, '#7a94aa'], [1.35, 1.0, .18, .3, '#c9a27a'], [1.65, 1.05, .14, .22, '#b8563a'], [.3, .75, .12, .12, '#f0e6d2'], [.5, .9, .12, .1, '#e8d0b8'], [.25, 1.1, .12, .12, '#c8603c'], [.6, 1.15, .14, .1, '#f0e6d2'], [.7, .7, .1, .1, '#c8603c']];
      for (const [x, y, s, h, c] of T) box(x, y, .82, s, s, h, c, { ol: false }); lit(() => R.spx(1.35, .7, 1.56, 0, 0, '#ff5a4a')); cyl(.2, .2, .82, .03, .2, '#f4f0e8', { ol: false }); R.spx(.2, .2, 1.04, 0, 0, '#d04a3a');
      R.fq([[0, 1.5, .82], [2, 1.5, .82], [2, 1.5, 1.58], [0, 1.5, 1.58]], '#dff0f8', 'glass'); R.fq([[2, 0, .82], [2, 1.5, .82], [2, 1.5, 1.58], [2, 0, 1.58]], '#c8e2ee', 'glass'); R.outline(0, 0, .82, 2, 1.5, .76, STEEL); } },
  { id: 'furn.skydeck.liftdoor', kind: 'furniture', tags: ['skydeck', 'elevator'], wall: true, mount: 0, solid: false, size: [2, .1, 2.4], use: { x: .8, y: .7 }, variants: [{}, { open: 1 }, { floor: '52' }],
    draw(p) { liftDoors(.15, .1, 0, p, p.floor || '1'); } },
  { id: 'furn.skydeck.core', kind: 'furniture', tags: ['skydeck', 'elevator', 'core'], size: [5, 2, HW], use: { x: 1.3, y: 2.6 }, variants: [{}, { open: 1 }],
    draw(p) { box(0, 0, 0, 5, 2, HW, '#5a4a40', { l: R.PAT.planks('#8a6a4c', 5), r: '#6a5240', t: '#2a2733' }); qy(0, 5, 2, 0, .18, DARK); qy(0, 5, 2, 2.9, 3.5, '#2a2733'); R.signY('SKYDECK  LEVEL 52', 0, 5, 2, 2.95, 3.45, '#2a2733', GOLD, { lit: true, frame: false });
      liftDoors(.5, 2, 0, p, '52'); liftDoors(2.9, 2, 0, {}, '17'); qx(5, .3, 1.7, .6, 2.6, '#f4ead0'); R.textX('52', 5, 1.25, 2.3, '#b8443a'); for (let i = 0; i < 4; i++) lw([5, .5, 1.9 - i * .25], [5, 1.5 - (i % 2) * .3, 1.9 - i * .25], '#7a6a5a'); glow(() => qy(0, 5, 2, 3.5, 3.56, '#ffe9a0')); } },
  { id: 'furn.skydeck.photospot', kind: 'furniture', tags: ['skydeck', 'photospot'], solid: false, flat: true, size: [1.5, 1, .02], variants: [{}],
    draw() { qz(0, 1.5, 0, 1, .01, '#e8c06a', '#dcb25c'); qz(.08, 1.42, .08, .92, .015, '#2f6fb0'); qz(.5, .64, .35, .7, .02, '#f4f0e8'); qz(.86, 1, .35, .7, .02, '#f4f0e8'); qz(.5, .64, .28, .34, .02, '#f4f0e8'); qz(.86, 1, .28, .34, .02, '#f4f0e8'); R.outline(0, 0, 0, 1.5, 1, .01, DARK); } },
];
export default A;
