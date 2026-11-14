// Water features, indoor planting, hanging art, baggage claim (carousel + bags), customs channel, exit doors.
import { box, qy, qx, qz, fq, lw, lit, glow, cyl, ball, dk, lt, mix, rng, hash2, signY, textY, PW, ellipse, spx } from '../../engine/raster.js';
import { WH, GR, STEEL, DARK, TEAL, WOOD, YEL, NAVY, RED, GREEN, BAGC, GREENS, T, SKY, wp, we, rowsY, screenY, suitcase, clump, fronds } from './_lib.js';

const STONE = '#d9d2c4', WATER = ['#4fa6c0', '#66bcd0'], MAPLE = ['#d9562b', '#e08a2c', '#c9402a'];
const disc = (x, y, z, r, c, c2) => { const s = PW(x, y, z); ellipse(s[0], s[1], r * 16 * 1.414, r * 16 * .707, c, c2); };
/** stadium outline (two semicircles of radius r centred at (x0,cy) and (x1,cy)) */
function stad(x0, x1, cy, r, z) { const p = []; for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + i / 8 * Math.PI; p.push([x1 + Math.cos(a) * r, cy + Math.sin(a) * r, z]); } for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 + i / 8 * Math.PI; p.push([x0 + Math.cos(a) * r, cy + Math.sin(a) * r, z]); } return p; }

export default [
  { id: 'furn.airport.fountain', kind: 'furniture', tags: T(['water_feature', 'fountain']), frames: 4, size: [2.4, 2.4, 1], vb: [-1.9, -1.9, 0, 4.3, 4.3, 4.3], light: { x: 1.2, y: 1.2, z: 0, r: 5.5 },
    seats: [-12, 12, 36, 58, 80, 102].map(a => ({ x: 1.2 + Math.cos(a * Math.PI / 180) * 2.8, y: 1.2 + Math.sin(a * Math.PI / 180) * 2.8, z: .46, dir: a < 45 ? 0 : 1 })),
    variants: [{ frame: 0 }, { frame: 2 }],
    draw(p) {
      const f = p.frame || 0, r = rng(31 + f * 17), c = 1.2;
      cyl(c, c, 0, 3.0, .45, STONE, { t: '#ebe5d8' }); disc(c, c, .4, 2.62, dk(STONE, .3)); disc(c, c, .38, 2.56, WATER[0], WATER[1]);
      glow(() => { for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; disc(c + Math.cos(a) * 2.1, c + Math.sin(a) * 2.1, .38, .14, '#c8f4ff'); } });
      for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, d = 1.4 + r() * 1.1; spx(c + Math.cos(a) * d, c + Math.sin(a) * d, .38, 0, 0, i % 3 ? '#dff6fb' : '#9fdcea'); if (i % 4 === 0) spx(c + Math.cos(a) * d, c + Math.sin(a) * d, .38, 1, 0, '#dff6fb'); }
      const jet = a => { let q = null; for (let k = 0; k <= 7; k++) { const t = k / 7, d = 2.25 - t * .95, z = .4 + Math.sin(t * Math.PI) * (1.15 + ((f + Math.round(a * 3)) % 2) * .1), pt = [c + Math.cos(a) * d, c + Math.sin(a) * d, z]; if (q) lw(q, pt, k % 2 ? '#f4fdff' : '#bfe9f5'); q = pt; } };
      for (let i = 0; i < 5; i++) jet(Math.PI + (i - 2) * .6 + .78);
      cyl(c, c, 0, 1.25, .78, STONE, { t: '#6a4e36' }); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + .3; clump(c + Math.cos(a) * .85, c + Math.sin(a) * .85, .95, .3, i); } fronds(c + .6, c + .7, .9, .7, 6, 1); fronds(c - .5, c + .8, .9, .6, 5, 3);
      box(c - .1, c - .1, .78, .2, .2, 1.5, '#6b4a34', { ol: false }); lw([c, c, 2.0], [c - .5, c + .3, 2.6], '#6b4a34'); lw([c, c, 2.0], [c + .6, c - .1, 2.8], '#6b4a34');
      ball(c, c, 3.1, 1.0, MAPLE[0]); ball(c - .7, c + .4, 2.75, .62, MAPLE[1]); ball(c + .75, c - .1, 3.0, .6, MAPLE[2]); ball(c + .1, c + .5, 3.55, .5, lt(MAPLE[1], .12));
      for (let i = 0; i < 5; i++) jet(-.35 + (i - 2) * .6 + .78);
      lit(() => { for (let i = 0; i < 6; i++) { const a = r() * Math.PI * 2; spx(c + Math.cos(a) * 2.0, c + Math.sin(a) * 2.0, .4, 0, 0, '#ffffff'); } });
    } },
  { id: 'furn.airport.pond', kind: 'furniture', tags: T(['water_feature', 'pond']), frames: 4, size: [4, 2, .45], vb: [-.1, -.1, 0, 4.1, 2.1, 2.6], light: { x: 2, y: 1, z: 0, r: 3.5 }, use: { x: 2, y: 2.5 }, variants: [{ frame: 0 }, { frame: 2 }],
    draw(p) {
      const f = p.frame || 0, r = rng(5);
      box(0, 0, 0, 4, 2, .4, STONE, { t: '#ebe5d8' }); qz(.22, 3.78, .22, 1.78, .41, dk(STONE, .3)); qz(.26, 3.74, .26, 1.74, .36, WATER[0], WATER[1]);
      glow(() => { for (const x of [.6, 2, 3.4]) qz(x - .1, x + .1, 1.5, 1.66, .365, '#c8f4ff'); });
      for (let i = 0; i < 5; i++) { const a = f / 4 * Math.PI * 2 * (i % 2 ? 1 : -1) + i * 1.9, x = .9 + i * .55 + Math.cos(a) * .28, y = .95 + Math.sin(a) * .35 + (i % 2) * .2, c = ['#e8782c', '#f4efe2', '#e8782c', '#d2412f', '#f2c230'][i]; qz(x, x + .22, y, y + .09, .37, c); qz(x + .07, x + .13, y, y + .09, .371, i % 2 ? '#f4efe2' : '#c0392b'); qz(x - .07, x, y + .02, y + .07, .37, lt(c, .2)); }
      for (let i = 0; i < 5; i++) { const x = .5 + r() * 3, y = .4 + r() * 1.1; disc(x, y, .375, .13, GREENS[i % 5]); if (i % 2) spx(x, y, .39, 0, -1, '#f2a7c3'); }
      for (let i = 0; i < 7; i++) { const x = .35 + i * .5 + r() * .15; lw([x, .14, .4], [x + .04, .14, 1.9 + r() * .5], i % 2 ? '#7fae4a' : '#5a8f3c'); lw([x + .04, .14, 1.5], [x + .28, .14, 1.7 + r() * .3], '#62b356'); lw([x + .04, .14, 1.1], [x - .2, .14, 1.35], '#4f9a45'); }
      ball(3.5, .5, .55, .22, '#9a9488'); ball(3.2, .35, .5, .14, '#b0aa9c'); ball(.4, 1.6, .5, .15, '#9a9488'); clump(3.6, 1.5, .62, .25, 2);
    } },
  { id: 'furn.airport.raincurtain', kind: 'furniture', tags: T(['water_feature', 'rain_curtain']), frames: 4, size: [3, .5, 3.2], light: { x: 1.5, y: .8, z: 0, r: 3 }, variants: [{ frame: 0 }, { frame: 1 }],
    draw(p) {
      const f = p.frame || 0;
      box(0, 0, 0, 3, .5, .3, DARK, { t: WATER[0], t2: WATER[1] }); box(0, .1, .3, .12, .3, 2.6, STEEL, { ol: false }); box(2.88, .1, .3, .12, .3, 2.6, STEEL, { ol: false });
      qy(.12, 2.88, .25, .3, 2.9, '#9fd8ee', 'glass');
      const strand = (x, i) => { for (let z = 2.9 - ((f * .35 + hash2(i, 3) * 1.4) % 1.4); z > .3; z -= 1.4) { lw([x, .26, Math.min(2.9, z + .5)], [x, .26, Math.max(.3, z)], i % 2 ? '#e8fbff' : '#bfe9f5'); } };
      for (let i = 0, x = .18; x < 2.86; x += .09, i++) { if (i % 3 === 0) lit(() => strand(x, i)); else strand(x, i); }
      box(0, .05, 2.9, 3, .4, .3, '#59616e'); glow(() => qy(.1, 2.9, .45, 2.9, 2.95, '#c8f4ff')); for (let i = 0; i < 8; i++) spx(.2 + hash2(i, f) * 2.6, .3, .32, 0, 0, '#ffffff');
    } },
  { id: 'furn.airport.tree', kind: 'furniture', tags: T(['plant', 'tree']), size: [1.5, 1.5, 3.4], vb: [-.7, -.7, 0, 2.2, 2.2, 4.2], variants: [{ kind: 'ficus' }, { kind: 'palm' }, { kind: 'maple' }, { kind: 'ficus', bench: 1 }],
    seats: p => p.bench ? [{ x: .45, y: 1.68, z: .46, dir: 1 }, { x: 1.05, y: 1.68, z: .46, dir: 1 }, { x: 1.68, y: .45, z: .46, dir: 0 }, { x: 1.68, y: 1.05, z: .46, dir: 0 }] : [],
    draw(p) {
      const k = p.kind || 'ficus', r = rng((p.seed || 1) * 3 + 2);
      box(0, 0, 0, 1.5, 1.5, .5, WH, { t: '#6a4e36' }); qy(0, 1.5, 1.5, .38, .46, WOOD); qx(1.5, 0, 1.5, .38, .46, dk(WOOD, .15));
      if (p.bench) { box(0, 1.5, .3, 1.5, .34, .12, WOOD, { ol: false }); box(1.5, 0, .3, .34, 1.5, .12, dk(WOOD, .08), { ol: false }); qy(0, 1.5, 1.84, .3, .42, dk(WOOD, .3)); }
      for (let i = 0; i < 5; i++) clump(.25 + r() * 1.0, .25 + r() * 1.0, .62, .2, i);
      if (k === 'palm') { for (let z = .5; z < 2.6; z += .2) box(.68 + Math.sin(z) * .05, .68, z, .14, .14, .2, z * 5 % 2 < 1 ? '#8a6a48' : '#7a5a3e', { ol: false }); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, g = GREENS[i % 5]; let q = [.75, .75, 2.7]; for (let s = 1; s <= 5; s++) { const d = s * .26, pt = [.75 + Math.cos(a) * d, .75 + Math.sin(a) * d, 2.7 + Math.sin(s / 5 * Math.PI) * .5 - s * .09]; lw(q, pt, g); lw([q[0], q[1], q[2] - .06], [pt[0], pt[1], pt[2] - .06], dk(g, .15)); lw([q[0], q[1], q[2] + .06], [pt[0], pt[1], pt[2] + .04], lt(g, .1)); q = pt; } } }
      else { const cs = k === 'maple' ? MAPLE : ['#3f8a55', '#4f9a45', '#5aa84f']; box(.66, .66, .5, .18, .18, 1.5, '#6b4a34', { ol: false }); lw([.75, .75, 1.8], [.3, .9, 2.4], '#6b4a34'); lw([.75, .75, 1.8], [1.2, .6, 2.5], '#6b4a34'); ball(.75, .75, 2.75, .95, cs[0]); ball(.2, 1.0, 2.45, .55, cs[1]); ball(1.35, .6, 2.6, .58, cs[2]); ball(.8, 1.1, 3.25, .5, lt(cs[1], .1)); }
    } },
  { id: 'furn.airport.planter', kind: 'furniture', tags: T(['plant', 'planter']), size: p => [p.len || 3, .5, 1], vb: p => [0, -.1, 0, p.len || 3, .6, 1.5], variants: [{ len: 3 }, { len: 2, flowers: 1, c: '#c79a64' }],
    draw(p) { const L = p.len || 3, r = rng((p.seed || 1) + L * 3), c = p.c || WH; box(0, 0, 0, L, .5, .5, c, { t: '#6a4e36' }); qy(0, L, .5, .4, .46, p.c ? dk(c, .2) : TEAL); for (let x = .2; x < L - .1; x += .32) { if (r() < .55) clump(x, .25, .62 + r() * .1, .2 + r() * .06, Math.floor(r() * 5)); else fronds(x, .25, .5, .55 + r() * .3, 5, Math.floor(r() * 5)); if (p.flowers && r() < .7) { spx(x, .3, .85, 0, 0, ['#f2a7c3', '#f2c230', '#ffffff'][Math.floor(r() * 3)]); spx(x, .3, .85, 1, 0, '#f2a7c3'); } } } },
  { id: 'furn.airport.greenwall', kind: 'furniture', tags: T(['plant', 'green_wall']), wall: true, mount: .25, solid: false, size: p => [p.w || 4, .1, 3], variants: [{ w: 4 }, { w: 6, text: 'MAPLE BAY' }],
    draw(p) {
      const w = p.w || 4, Y = .08; box(0, 0, 0, w, .06, 3, '#3a4250', { ol: false });
      qy(.08, w - .08, Y, .08, 2.92, (u, v) => { const a = u >> 2, b = v >> 2, k = hash2(a, b, 5), s = Math.sin(a * .35 + b * .22) + Math.sin(b * .4 - a * .12); if (k > .955) return '#f2a7c3'; if (k < .03) return '#e9c46a'; const g = s > 1 ? '#7fc45e' : s > .2 ? '#5aa84f' : s > -.7 ? '#3f8a55' : '#2f6a48'; return ((u + v) & 3) === 0 && k > .5 ? dk(g, .15) : g; });
      for (let i = 0; i < w * 5; i++) { const x = .15 + hash2(i, 1) * (w - .3), z = .2 + hash2(i, 2) * 2.5; lw([x, Y + .01, z], [x + .08, Y + .01, z - .14], '#8fd06a'); }
      if (p.text) signY(p.text, w / 2 - p.text.length * .14 - .1, w / 2 + p.text.length * .14 + .1, Y + .02, 1.3, 1.7, '#1f4a34', '#ffffff', { lit: true }); glow(() => qy(.1, w - .1, Y, 2.92, 2.98, '#fff2c4'));
    } },
  { id: 'furn.airport.mobile', kind: 'furniture', tags: T(['art', 'overhead']), solid: false, overhead: true, size: p => [p.w || 4, p.d || 3, 1.6], vb: p => [-.3, -.3, -.2, (p.w || 4) + .5, (p.d || 3) + .5, 2.6], variants: [{ seed: 1 }, { seed: 5, w: 6, d: 4 }],
    draw(p) {
      const w = p.w || 4, d = p.d || 3, r = rng((p.seed || 1) * 11), n = Math.round(w * d * .8), L = [];
      for (let i = 0; i < n; i++) L.push([r() * w, r() * d, .1 + r() * 1.1, r()]); L.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
      for (const [x, y, z, k] of L) { const c = ['#f4efe2', '#f2c230', '#d2412f', '#2f8f96', '#f2a7c3', '#ffffff', '#e08a2c'][Math.floor(k * 7)], s = .55 + k * .4; lw([x + s * .4, y + s * .2, z + .08], [x + s * .4, y + s * .2, 2.5], '#aab3be'); fq([[x, y, z], [x + s, y + s * .15, z + s * .32], [x + s * .3, y + s * .4, z + .05]], c); fq([[x, y, z], [x + s, y + s * .15, z + s * .32], [x + s * .45, y - s * .1, z + .12]], dk(c, .16)); }
    } },
  /* ---- baggage claim ---- */
  { id: 'furn.airport.carousel', kind: 'furniture', tags: T(['baggage_carousel', 'carousel_belt']), flat: true, solid: false, size: [7, 3, .05], vb: [-.1, -.1, 0, 7.1, 3.1, .6], variants: [{}],
    draw() {
      for (let z = 0; z <= .4; z += .0625) fq(stad(1.5, 5.5, 1.5, 1.5, z), z < .07 ? '#3a4250' : '#7d8794'); fq(stad(1.5, 5.5, 1.5, 1.5, .42), '#aab3be'); fq(stad(1.5, 5.5, 1.5, 1.42, .42), '#3a4250');
      for (let x = 1.5; x <= 5.5; x += .33) { lw([x, .1, .42], [x, 1.0, .42], '#4f5968'); lw([x, 2.0, .42], [x, 2.9, .42], '#4f5968'); }
      for (let i = 1; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * Math.PI; lw([5.5 + Math.cos(a) * .5, 1.5 + Math.sin(a) * .5, .42], [5.5 + Math.cos(a) * 1.4, 1.5 + Math.sin(a) * 1.4, .42], '#4f5968'); lw([1.5 - Math.cos(a) * .5, 1.5 + Math.sin(a) * .5, .42], [1.5 - Math.cos(a) * 1.4, 1.5 + Math.sin(a) * 1.4, .42], '#4f5968'); }
      fq(stad(1.5, 5.5, 1.5, .52, .42), '#59616e');
    } },
  { id: 'furn.airport.carousel.island', kind: 'furniture', tags: T(['baggage_carousel', 'carousel_island']), size: [5, 1, 1.2], vb: [0, 0, 0, 5, 1.45, 2.0], variants: [{ num: '2', text: 'MB 417' }, { num: '1', text: 'KX 88' }],
    draw(p) {
      box(.15, .12, 0, 4.7, .76, .62, '#c9d0d6', { t: '#dfe4e9' }); qy(.15, 4.85, .88, .5, .56, TEAL);
      box(1.9, .15, .62, 1.2, .7, .55, '#aab3be'); qy(2.0, 3.0, .85, .62, 1.05, '#1f2630'); for (let x = 2.05; x < 3; x += .14) lw([x, .86, .7], [x, .86, 1.05], '#3a4250'); fq([[2.0, .85, .64], [3.0, .85, .64], [3.0, 1.35, .46], [2.0, 1.35, .46]], '#8e9aaa'); lw([2.0, .85, .64], [2.0, 1.35, .46], '#59616e'); lw([3.0, .85, .64], [3.0, 1.35, .46], '#59616e');
      box(.4, .35, .62, .3, .3, 1.2, DARK); lit(() => { qy(.4, .7, .65, 1.3, 1.78, YEL); qx(.7, .35, .65, 1.3, 1.78, dk(YEL, .12)); }); lit(() => { textY(String(p.num || '2'), .5, .66, 1.68, '#1c222b'); textY(String(p.num || '2'), .51, .66, 1.68, '#1c222b'); });
      box(3.5, .32, .62, 1.25, .16, .5, '#1c222b'); screenY(3.56, 4.69, .49, .68, 1.06); rowsY([[String(p.text || 'MB 417').slice(0, 7), '#ffd98a']], 3.6, .5, 1.02);
    } },
  { id: 'furn.airport.bag', kind: 'furniture', tags: T(['bag', 'luggage']), solid: false, size: p => p.up ? [.45, .3, .65] : [.65, .45, .3], vb: p => p.up ? [-.05, -.05, 0, .5, .35, .95] : [-.05, -.05, 0, .7, .5, .45],
    variants: [{ c: 0 }, { c: 1, kind: 'duffel' }, { c: 8, kind: 'box' }, { c: 3, kind: 'pack' }, { mine: 1 }, { c: 4, up: 1 }, { mine: 1, up: 1 }],
    draw(p) {
      const c = p.mine ? '#f2c230' : typeof p.c === 'string' ? p.c : BAGC[(p.c || 0) % BAGC.length], k = p.mine ? 'case' : p.kind || 'case';
      if (p.up) { suitcase(0, 0, 0, c, { tag: p.mine ? '#d2412f' : null }); if (p.mine) { qy(.02, .4, .25, .1, .16, '#2f8f96'); } return; }
      if (k === 'duffel') { box(.04, .08, 0, .58, .3, .24, c, { ol: false }); cyl(.06, .23, .0, .0, 0, c); box(0, .1, .02, .06, .26, .2, dk(c, .2), { ol: false }); box(.6, .1, .02, .05, .26, .2, dk(c, .2), { ol: false }); lw([.15, .23, .25], [.5, .23, .25], dk(c, .45)); lw([.2, .38, .1], [.45, .38, .1], lt(c, .3)); lw([.02, .38, 0], [.64, .38, 0], dk(c, .6)); }
      else if (k === 'box') { box(0, 0, 0, .6, .42, .3, '#c79a64'); qz(.26, .34, 0, .42, .301, '#e8d8a8'); qy(.26, .34, .42, 0, .3, '#e8d8a8'); lit(() => 0); qy(.4, .55, .42, .08, .2, '#ffffff'); }
      else if (k === 'pack') { box(.05, .04, 0, .5, .36, .26, c); box(.12, .1, .26, .34, .24, .06, lt(c, .12), { ol: false }); qy(.15, .45, .4, .06, .18, dk(c, .25)); lw([.05, .12, .27], [.55, .12, .27], dk(c, .5)); }
      else { box(0, 0, 0, .64, .42, .24, c); qz(.06, .58, .06, .36, .241, lt(c, .1)); lw([.2, 0, .24], [.2, .42, .24], dk(c, .35)); lw([.44, 0, .24], [.44, .42, .24], dk(c, .35)); qy(.24, .4, .42, .09, .15, '#3a4250'); if (p.mine) { qz(.25, .39, .14, .28, .242, '#d2412f'); qz(.3, .34, .1, .32, .243, '#d2412f'); qz(.21, .43, .19, .23, .243, '#d2412f'); qy(.46, .58, .42, .04, .2, '#2f8f96'); } }
    } },
  { id: 'furn.airport.customs', kind: 'furniture', tags: T(['customs', 'arch']), solid: false, size: [3, .4, 3], variants: [{ kind: 'green' }, { kind: 'red' }],
    draw(p) {
      const g = p.kind !== 'red', c = g ? '#2f9a55' : '#c0392b', fg = g ? '#e4ffe9' : '#ffe9e4';
      box(0, 0, 0, .3, .4, 2.2, WH); box(2.7, 0, 0, .3, .4, 2.2, WH); qy(0, .3, .4, .9, 1.4, c); qy(2.7, 3, .4, .9, 1.4, c); box(0, 0, 2.15, 3, .4, .85, c);
      lit(() => { qy(.06, 2.94, .4, 2.2, 2.95, dk(c, .12)); const a = g ? 'NOTHING TO' : 'GOODS TO', b = 'DECLARE'; textY(a, 1.5 - (a.length * 4 - 1) / 32, .41, 2.9, fg); textY(b, 1.5 - (b.length * 4 - 1) / 32, .41, 2.5, fg); }); lit(() => qy(.35, 2.65, .4, 2.2, 2.24, g ? '#7df0a0' : '#ff8a70'));
    } },
  { id: 'furn.airport.exitdoors', kind: 'furniture', tags: T(['exit', 'door', 'auto_doors']), wall: true, mount: 0, solid: false, size: p => [p.w || 4, .1, 3.2], variants: [{ text: 'EXIT - TAXI' }, { text: 'EXIT', sky: 2 }],
    draw(p) {
      const w = p.w || 4, Y = .06, S = SKY(p.sky || 0), m = w / 2;
      qy(0, w, Y, 0, 3.2, '#dfe4e9'); qy(.2, w - .2, Y, 0, 2.4, S.top); qy(.2, w - .2, Y, 0, 1.3, S.lo); qy(.2, w - .2, Y, 0, .5, S.gnd2); qy(.2, w - .2, Y, .5, .58, S.gnd);
      wp(Y + .01, [[m + .3, .28], [m + 1.3, .28], [m + 1.3, .55], [m + 1.05, .58], [m + .95, .78], [m + .55, .78], [m + .42, .58], [m + .3, .55]], YEL); wp(Y + .01, [[m + .58, .6], [m + .92, .6], [m + .88, .74], [m + .6, .74]], '#27303c'); we(Y + .02, m + .52, .28, .09, .09, '#1f2630'); we(Y + .02, m + 1.08, .28, .09, .09, '#1f2630');
      if (!S.n) glow(() => qy(.2, w - .2, Y, 0, 2.4, '#3a4a6a')); else lit(() => { we(Y + .01, m - .9, 1.6, .05, .05, '#ffe2a0'); we(Y + .01, m + .2, 1.9, .04, .04, '#ffe2a0'); });
      const Y2 = Y + .02, F = '#4a5462'; for (const [a, b] of [[.2, m - .55], [m + .55, w - .2]]) { qy(a, b, Y2, 0, 2.4, '#cfe9f1', 'glass'); lw([a, Y2, 0], [a, Y2, 2.4], F); lw([b, Y2, 0], [b, Y2, 2.4], F); lw([a + .15, Y2, 2.2], [a + .5, Y2, 1.7], '#ffffff'); qy(a, b, Y2, 1.05, 1.11, '#ffffff'); }
      qy(.2, w - .2, Y2, 2.4, 2.48, F); qy(m - .55, m + .55, Y2, 0, .05, YEL); signY(p.text || 'EXIT', .4, w - .4, Y2, 2.6, 3.05, '#1c5a36', '#e4ffe9', { lit: true });
    } },
];
