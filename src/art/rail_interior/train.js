// Light-rail CUTAWAY interior kit (used by src/scenes/trainride.js). The car lies along x; the far wall is at y = 0 (faces +y),
// the near wall and the roof are cut away. Ids furn.train.*:
//   wall  {len, doors:[x...], dw}   far wall with window HOLES (transparent: the scenery shows through) + route-map strip
//   door  {open: 0..1}              one sliding double door (animated by swapping params)
//   end   {text}                    end wall (faces +x) with gangway door + lit LED destination display
//   seats {n, side:'far'|'near', c} longitudinal bench seats (seats[] dir 1 / dir 3)
//   pole, straps {len} (overhead grab rail + hanging straps), floor {len, d, doors} (flat), sill {len} (cut near wall + outer skirt)
import { box, qy, qx, qz, lw, lit, dk, lt, cyl, signX, signY, spx, hash2, textY } from '../../engine/raster.js';

const BODY = '#ece6d6', PAN = '#d6cfbf', CUT = '#3a3644', ACC = '#d2412f', YEL = '#f2c230', STEEL = '#aab2bb', FR = '#4a4856';
const T = ['train', 'rail'];

const wall = {
  id: 'furn.train.wall', kind: 'furniture', tags: T, size: p => [p.len || 16, .25, 2.3], variants: [{ len: 16, doors: [3.5, 11], text: 'OLD TOWN' }],
  draw(p) {
    const L = p.len || 16, doors = p.doors || [3.2, 11.2], dw = p.dw || 1.6, Y = .25, spans = []; let a = 0;
    for (const d of doors) { spans.push([a, d]); a = d + dw; } spans.push([a, L]);
    for (const [x0, x1] of spans) {
      box(x0, 0, 0, x1 - x0, Y, .85, PAN, { t: CUT, ol: false });
      qy(x0, x1, Y, 0, .12, dk(PAN, .3)); qy(x0, x1, Y, .12, .2, dk(PAN, .12)); qy(x0, x1, Y, .78, .85, STEEL);
      const n = Math.max(1, Math.round((x1 - x0 - .3) / 1.75)), w = (x1 - x0 - .3) / n;
      for (let i = 0; i <= n; i++) { const q = x0 + i * w; box(q, 0, .85, .3, Y, 1.05, BODY, { ol: false }); lw([q, Y, .85], [q, Y, 1.9], FR); lw([q + .3, Y, .85], [q + .3, Y, 1.9], FR); }
      for (let i = 0; i < n; i++) { const w0 = x0 + i * w + .3, w1 = x0 + (i + 1) * w; lw([w0, Y, .86], [w1, Y, .86], FR); lw([w0 + .12, Y, 1.78], [w0 + .42, Y, 1.5], '#ffffff'); lw([w0 + .3, Y, 1.78], [w0 + .48, Y, 1.62], '#e8f6fb'); }
    }
    box(0, 0, 1.9, L, Y, .4, BODY, { t: CUT, ol: false }); lw([0, Y, 1.9], [L, Y, 1.9], FR);
    // route map strip + ad cards above the windows
    let k = 0;
    for (const [x0, x1] of spans) {
      if (x1 - x0 > 4) {
        qy(x0 + .5, x1 - .5, Y, 1.98, 2.22, '#fbf8ee'); const n = 8, w = (x1 - x0 - 1.6) / (n - 1); lw([x0 + .8, Y, 2.1], [x1 - .8, Y, 2.1], ACC);
        for (let i = 0; i < n; i++) { const q = x0 + .8 + i * w; spx(q, Y, 2.1, 0, -1, '#2a2733'); spx(q, Y, 2.1, 0, 0, '#ffffff'); spx(q, Y, 2.1, 0, 1, '#2a2733'); spx(q, Y, 2.1, -1, 0, '#2a2733'); spx(q, Y, 2.1, 1, 0, '#2a2733'); }
      } else if (x0 === 0 && p.text) { signY(String(p.text).slice(0, 12), .4, x1 - .35, Y, 1.96, 2.25, '#16141c', '#ffb347', { lit: true });
      } else { const cs = ['#2f8f96', '#e8c060', '#7a5aa8', '#5aa84f']; for (let q = x0 + .35; q + .9 <= x1 - .2; q += 1.05) { qy(q, q + .9, Y, 1.98, 2.22, cs[k++ % 4]); lw([q + .1, Y, 2.14], [q + .6, Y, 2.14], '#ffffff'); lw([q + .1, Y, 2.06], [q + .45, Y, 2.06], '#ffffff'); } }
    }
    for (const d of doors) { // door frame + lit header
      box(d - .08, 0, 0, .08, Y + .02, 1.9, YEL, { ol: false }); box(d + dw, 0, 0, .08, Y + .02, 1.9, YEL, { ol: false });
      qy(d + .3, d + dw - .3, Y, 1.98, 2.2, '#16141c'); lit(() => { spx(d + dw / 2 - .3, Y, 2.1, 0, 0, '#5ad06a'); spx(d + dw / 2 - .3, Y, 2.1, 1, 0, '#5ad06a'); textY('EXIT', d + dw / 2 - .15, Y, 2.17, '#ffb347'); });
    }
    lw([0, Y, 2.3], [L, Y, 2.3], dk(BODY, .5)); lw([0, Y, 0], [L, Y, 0], dk(PAN, .55));
  },
};

function leaf(x0, y) {
  const c = '#e4ddcc';
  qy(x0, x0 + .8, y, 0, .95, c); qy(x0, x0 + .8, y, 1.68, 1.9, c); qy(x0, x0 + .12, y, .95, 1.68, c); qy(x0 + .68, x0 + .8, y, .95, 1.68, c);
  qy(x0 + .12, x0 + .68, y, .95, 1.68, '#d4ecf2', 'glass'); qy(x0, x0 + .8, y, .28, .4, ACC); qy(x0, x0 + .8, y, 0, .1, dk(c, .3));
  for (const q of [x0, x0 + .8]) lw([q, y, 0], [q, y, 1.9], FR); lw([x0, y, 1.9], [x0 + .8, y, 1.9], FR); lw([x0 + .12, y, .95], [x0 + .68, y, .95], FR); lw([x0 + .12, y, 1.68], [x0 + .68, y, 1.68], FR);
}
const door = {
  id: 'furn.train.door', kind: 'furniture', tags: T, size: [1.6, .1, 1.9], vb: [-.8, 0, 0, 2.4, .1, 1.95], solid: false, variants: [{ open: 0 }, { open: .5 }, { open: 1 }],
  draw(p) { const o = (p.open || 0) * .74; leaf(-o, .1); leaf(.8 + o, .1); },
};

const end = {
  id: 'furn.train.end', kind: 'furniture', tags: T, size: p => [.25, p.d || 4, 2.3], variants: [{ text: 'OLD TOWN' }, { text: 'ARTS QUARTER' }],
  draw(p) {
    const X = .25, D = p.d || 4;
    box(0, 0, 0, X, D, 2.3, BODY, { t: CUT, ol: false }); qx(X, 0, D, 0, .85, PAN); qx(X, 0, D, 0, .12, dk(PAN, .3)); qx(X, 0, D, .78, .85, STEEL);
    qx(X, 1.4, 2.6, 0, 1.85, '#cfc8b8'); qx(X, 1.62, 2.38, .95, 1.62, '#2c3344'); lw([X, 2.3, 1.55], [X, 2.1, 1.35], '#6f86a8');
    for (const y of [1.4, 2.6]) lw([X, y, 0], [X, y, 1.85], FR); lw([X, 1.4, 1.85], [X, 2.6, 1.85], FR); qx(X, 1.48, 1.54, .8, 1.0, STEEL);
    qx(X, 2.85, 3.75, .98, 1.72, '#fbf8ee'); for (let i = 0; i < 3; i++) lw([X, 3.65, 1.6 - i * .16], [X, 3.0 + i * .1, 1.6 - i * .16], ['#d2412f', '#2f8f96', '#8a8f9a'][i]);
    qx(X, .25, 1.15, .98, 1.72, '#2f8f96'); qx(X, .35, 1.05, 1.2, 1.6, '#e8c060'); lw([X, 1.0, 1.1], [X, .4, 1.1], '#ffffff');
    qx(X, 3.78, 3.92, .25, .7, '#e0453a');
    signX(String(p.text || 'MAPLE BAY').slice(0, 13), X, .4, 3.6, 1.93, 2.24, '#16141c', '#ffb347', { lit: true });
    lw([X, 0, 2.3], [X, D, 2.3], dk(BODY, .5)); lw([X, 0, 0], [X, D, 0], dk(PAN, .55));
  },
};

const seats = {
  id: 'furn.train.seats', kind: 'furniture', tags: T.concat('seat', 'seating'), size: p => [(p.n || 3) * .6, .6, 1.25],
  variants: [{ n: 3 }, { n: 4, c: '#e08a2c' }, { n: 3, side: 'near' }],
  seats: p => { const o = []; for (let i = 0; i < (p.n || 3); i++) o.push(p.side === 'near' ? { x: i * .6 + .3, y: .24, z: .5, dir: 3 } : { x: i * .6 + .3, y: .36, z: .5, dir: 1 }); return o; },
  draw(p) {
    const n = p.n || 3, W = n * .6, c = p.c || '#2f8f96', near = p.side === 'near', c2 = lt(c, .12);
    const fab = col => (u, v) => (u * 3 + v * 5) % 11 === 0 ? lt(col, .3) : (u * 5 + v * 3) % 13 === 0 ? dk(col, .2) : col;
    const back = y => { box(0, y, .3, W, .12, .78, c, { l: fab(near ? dk(c, .25) : c), ol: false }); for (let i = 1; i < n; i++) lw([i * .6, y + .12, .5], [i * .6, y + .12, 1.08], dk(c, .4)); lw([0, y + .12, 1.08], [W, y + .12, 1.08], near ? dk(c, .45) : lt(c, .3)); };
    box(.08, near ? .05 : .15, 0, W - .16, .35, .3, '#5c6068', { ol: false });
    if (!near) back(0);
    for (let i = 0; i < n; i++) box(i * .6 + .03, near ? .02 : .12, .3, .54, .46, .18, c2, { t: fab(c2), ol: false });
    if (near) back(.48);
    box(W - .05, 0, 0, .05, .6, 1.2, '#c9d2d8', { ol: false }); lw([W, 0, 1.2], [W, .6, 1.2], YEL); lw([W, 0, 1.21], [W, .6, 1.21], YEL);
    lw([0, .6, 0], [W, .6, 0], '#2a2733');
  },
};

const pole = { id: 'furn.train.pole', kind: 'furniture', tags: T, size: [.15, .15, 2.25], variants: [{}], draw() { cyl(.075, .075, 0, .05, 2.25, YEL, { ol: false }); cyl(.075, .075, 0, .09, .06, '#8a8f9a', { ol: false }); } };

const straps = {
  id: 'furn.train.straps', kind: 'furniture', tags: T, overhead: true, solid: false, size: p => [p.len || 4, .1, .5], variants: [{ len: 4 }],
  draw(p) {
    const L = p.len || 4, y = .05;
    for (let x = .3; x < L; x += .55) { lw([x, y, .44], [x, y, .2], '#55525f'); for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [-1, 1], [1, 1], [-1, 2], [1, 2], [0, 3]]) spx(x, y, .2, dx, dy, dy === 3 || dy === 0 ? '#e9e4d6' : '#c9c3b4'); }
    lw([0, y, .46], [L, y, .46], STEEL); lw([0, y, .44], [L, y, .44], dk(STEEL, .3)); for (let x = 0; x <= L; x += 2) lw([x, y, .46], [x, y, .5], dk(STEEL, .3));
  },
};

const floor = {
  id: 'furn.train.floor', kind: 'furniture', tags: T, flat: true, solid: false, size: p => [p.len || 16, p.d || 4, .02], variants: [{ len: 16, d: 4, doors: [3.2, 11.2] }],
  draw(p) {
    const L = p.len || 16, D = p.d || 4, doors = p.doors || [3.2, 11.2], dw = p.dw || 1.6;
    qz(0, L, 0, D, .01, (x, y) => {
      if (x < .06 || y < .06 || x > L - .06 || y > D - .06) return '#4c4f5e';
      for (const d of doors) if (x > d - .1 && x < d + dw + .1) { if (y < .5 || y > D - .5) return ((Math.floor(x * 8) + Math.floor(y * 8)) & 1) ? YEL : '#e2b020'; if (y < .58 || y > D - .58) return '#3a3644'; }
      const k = hash2(Math.floor(x * 16), Math.floor(y * 16), 5), a = y > 1.3 && y < D - 1.3;
      if (Math.abs(y - 1.3) < .04 || Math.abs(y - D + 1.3) < .04) return '#666a7c';
      return a ? (k > .9 ? '#a3a7b6' : k < .08 ? '#868a9a' : '#9498a8') : (k > .92 ? '#8b8fa0' : k < .1 ? '#70748a' : '#7c8092');
    });
  },
};

const sill = {
  id: 'furn.train.sill', kind: 'furniture', tags: T, size: p => [p.len || 4, .2, .3], vb: p => [0, 0, -.95, p.len || 4, .2, .32], variants: [{ len: 4 }],
  draw(p) {
    const L = p.len || 4;
    box(0, 0, 0, L, .2, .3, BODY, { t: CUT, ol: false }); qy(0, L, .2, -.62, 0, BODY); qy(0, L, .2, -.34, -.2, ACC); qy(0, L, .2, -.9, -.62, '#35323f');
    for (let x = .6; x + 1.4 < L; x += 2.6) { qy(x, x + 1.4, .2, -.9, -.66, '#25212d'); lw([x, .2, -.66], [x + 1.4, .2, -.66], '#4a4856'); }
    lw([0, .2, .3], [L, .2, .3], dk(BODY, .5)); lw([0, .2, -.62], [L, .2, -.62], '#25212d'); lw([0, .2, 0], [L, .2, 0], dk(BODY, .25));
  },
};

export default [wall, door, end, seats, pole, straps, floor, sill];
