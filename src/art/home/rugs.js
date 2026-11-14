// Rugs: flat on the floor, solid:false, draw them before any furniture standing on them. p.w / p.d in 0.5 steps, p.pat picks the pattern.
import { qz, lw, dk, lt, mix } from '../../engine/raster.js';
import { tier, FAB, fabric, dot } from './_lib.js';

function rug(p) {
  const t = tier(p), w = p.w || 2, d = p.d || 1.5, c = p.c || [FAB.grey, FAB.teal, '#8a3a3a'][t], c2 = p.c2 || [lt(FAB.grey, .3), FAB.cream, '#e9d9b0'][t], c3 = p.c3 || FAB.navy;
  const pat = p.pat || ['plain', 'stripe', 'persian'][t], Z = .012, cx = w / 2, cy = d / 2, m = .06;
  let fn;
  if (pat === 'round') fn = (x, y) => { const k = ((x - cx) / (cx - m)) ** 2 + ((y - cy) / (cy - m)) ** 2; return k > 1 ? null : k > .8 ? c2 : k > .62 ? c : k > .5 ? c2 : k < .08 ? c2 : c; };
  else if (pat === 'persian') fn = (x, y) => { const ex = Math.min(x - m, w - m - x), ey = Math.min(y - m, d - m - y), e = Math.min(ex, ey); if (e < .07) return c3; if (e < .11) return c2; if (e < .24) return ((Math.floor(x * 8) + Math.floor(y * 8)) & 1) ? c3 : c; if (e < .28) return c2; const a = Math.abs(x - cx) / (cx * .55) + Math.abs(y - cy) / (cy * .62); if (a < .35) return c2; if (a < .55) return c3; if (a < .7) return c2; const fx = Math.abs(((x * 4) % 1) - .5), fy = Math.abs(((y * 4) % 1) - .5); return fx + fy < .14 ? c2 : c; };
  else if (pat === 'shag') fn = (x, y) => { const a = Math.floor(x * 16), q = Math.floor(y * 16); return ((a * 7 + q * 13) % 5 === 0) ? lt(c, .25) : ((a * 3 + q * 5) % 7 === 0) ? dk(c, .12) : c; };
  else if (pat === 'hide') fn = (x, y) => { const k = ((x - cx) / (cx - m)) ** 2 + ((y - cy) / (cy - m)) ** 2 + Math.sin(x * 9) * .08 + Math.cos(y * 11) * .08; if (k > 1) return null; return (Math.sin(x * 5.3 + y * 3.1) + Math.cos(y * 6.1 - x * 2.2)) > .9 ? c2 : c; };
  else { const f = fabric(c, c2, pat === 'plain' ? 'plain' : pat, pat === 'check' ? .25 : pat === 'stripe' || pat === 'xstripe' ? .25 : .5); fn = (x, y) => { const e = Math.min(x - m, w - m - x, y - m, d - m - y); return (pat !== 'stripe' && pat !== 'xstripe' && e < .1) ? (pat === 'plain' ? lt(c, .25) : c3) : f(x, y); }; }
  qz(m, w - m, m, d - m, Z, fn);
  if (pat !== 'round' && pat !== 'hide') { lw([m, d - m, Z], [w - m, d - m, Z], dk(c, .5)); lw([w - m, m, Z], [w - m, d - m, Z], dk(c, .5));
    if (pat === 'persian' || pat === 'stripe' || p.fringe) for (let y = m + .03; y < d - m; y += .125) { dot(w - m, y, 0, c2, 1, 0); dot(w - m, y, 0, c2, 2, 1); dot(m, y, 0, c2, -1, 0); } }
  if (t === 0 && pat === 'plain') qz(w * .6, w * .6 + .25, d * .3, d * .3 + .2, Z, dk(c, .1));
}
export default [{
  id: 'furn.home.rug', kind: 'furniture', tags: ['home', 'decor', 'rug'], solid: false, size: p => [p.w || 2, p.d || 1.5, .02], vb: p => [-.1, -.1, 0, (p.w || 2) + .15, (p.d || 1.5) + .1, .1],
  variants: [{ tier: 0 }, { tier: 1 }, { tier: 2, w: 3, d: 2 }, { pat: 'check', c: FAB.red, c2: FAB.cream, c3: '#8a3a3a' }, { pat: 'diamond', c: FAB.mustard, c2: FAB.cream, c3: FAB.rust, w: 3, d: 2 }, { pat: 'zig', c: FAB.navy, c2: FAB.cream, c3: FAB.navy },
    { pat: 'round', c: FAB.rose, c2: FAB.cream, w: 2, d: 2 }, { pat: 'shag', c: '#f1eee6', w: 2, d: 1.5 }, { pat: 'hide', c: '#f1eee6', c2: '#5a3a2a', w: 2, d: 1.5 }, { pat: 'persian', c: FAB.navy, c2: '#e9d9b0', c3: '#8a3a3a', w: 2, d: 1.5 }, { pat: 'xstripe', c: FAB.sage, c2: FAB.cream, w: 1, d: 2 }, { pat: 'dots', c: FAB.teal, c2: FAB.cream, c3: FAB.cream, w: 1.5, d: 1.5 }],
  draw: rug,
}];
