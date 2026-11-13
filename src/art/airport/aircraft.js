// Aircraft for Maple Bay International. All lie along the x axis: p.dir = 1 nose toward +x, -1 nose toward -x.
// p.gear (default true) = wheels down. Every aircraft has a matching flat ground shadow asset '<id>.shadow'.
import { fq, lw, glow, dk, lt, spx, hash2 } from '../../engine/raster.js';
import { loft, tubeSecs, tpt, discX, discY, discZ, wheel, lamp, wtext, tw, AP, ringZ } from './_lib.js';

const SH = '#1c1a30';
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

const CFG = {
  airliner: {
    L: 22, span: 18, h: 6.2, zc: 1.9,
    st: [[.3, .15, .55], [2, .45, .4], [5, .9, .1], [7.5, 1.05, 0], [18.5, 1.05, 0], [20.3, .9, -.05], [21.3, .6, -.15], [21.9, .2, -.25]],
    wing: { x0: 8.8, x1: 13.2, tx0: 6.6, tx1: 7.9, z: 1.35, zt: 1.95, ry: .5, winglet: 1 },
    eng: { type: 'jet', y: 3.3, x0: 10.6, x1: 13.7, r: .6, z: .95 },
    stab: { x0: 1.2, x1: 3.5, tx0: .5, tx1: 1.5, half: 3.8, z: 2.35 },
    fin: [[1.4, 2.6], [5.2, 2.7], [1.9, 6.0], [.3, 6.0]],
    win: [6.3, 18.7, .42], cock: [19.9, 20.9], doors: [5.6, 19.1],
    gear: { nose: 19.2, main: 10.4, y: 1.5 }, text: 13.2,
  },
  turboprop: {
    L: 15, span: 15, h: 5.2, zc: 1.75,
    st: [[.3, .12, .5], [2, .4, .35], [4.2, .75, .05], [5.5, .8, 0], [12.2, .8, 0], [13.6, .68, -.05], [14.4, .42, -.15], [14.85, .15, -.22]],
    wing: { x0: 7.0, x1: 8.9, tx0: 7.5, tx1: 8.6, z: 2.5, zt: 2.6, ry: 0, high: 1 },
    eng: { type: 'prop', y: 2.7, x0: 7.0, x1: 10.2, r: .42, z: 2.1, prop: 1.05 },
    stab: { x0: .3, x1: 1.9, tx0: .2, tx1: 1.2, half: 2.7, z: 4.9, T: 1 },
    fin: [[.9, 2.1], [3.8, 2.3], [1.8, 4.9], [.4, 4.9]],
    win: [5, 12.2, .45], cock: [13.2, 14.1], doors: [4.5],
    gear: { nose: 13, main: 8.3, y: 2.7 }, text: 9.4,
  },
  bizjet: {
    L: 10, span: 9, h: 3.9, zc: 1.25,
    st: [[.3, .1, .3], [1.5, .32, .2], [3, .52, .03], [4, .55, 0], [7.6, .55, 0], [8.8, .45, -.04], [9.5, .25, -.1], [9.85, .08, -.14]],
    wing: { x0: 3.8, x1: 5.9, tx0: 2.9, tx1: 3.6, z: .9, zt: 1.15, ry: .25, winglet: 1 },
    eng: { type: 'rear', y: .88, x0: 1.9, x1: 3.7, r: .3, z: 1.6 },
    stab: { x0: .1, x1: 1.5, tx0: 0, tx1: .8, half: 1.9, z: 3.6, T: 1 },
    fin: [[.7, 1.6], [3.0, 1.7], [1.4, 3.6], [.3, 3.6]],
    win: [4.4, 7.5, .6], cock: [8.5, 9.2], doors: [7.9],
    gear: { nose: 8.4, main: 4.7, y: .9, r: .22 }, text: 0,
  },
  cargo: {
    L: 22, span: 18, h: 6.6, zc: 2.1,
    st: [[.3, .2, 1.1], [2.5, .6, .8], [5.5, 1.15, .2], [7.5, 1.3, 0], [18, 1.3, 0], [20, 1.1, -.1], [21.2, .7, -.3], [21.85, .25, -.45]],
    wing: { x0: 9.2, x1: 13.2, tx0: 7.4, tx1: 8.8, z: 3.3, zt: 2.95, ry: 0, high: 1 },
    eng: { type: 'jet', y: 3.6, x0: 10.4, x1: 13.7, r: .64, z: 2.3 },
    stab: { x0: .2, x1: 2.5, tx0: 0, tx1: 1.3, half: 3.8, z: 6.3, T: 1 },
    fin: [[1.0, 3.0], [5.2, 3.2], [2.3, 6.3], [.3, 6.3]],
    win: null, cock: [20, 21], doors: [], cdoor: [14.6, 17.4],
    gear: { nose: 19, main: 9.8, y: 1.2 }, text: 8.6,
  },
};

function setup(cfg, p) {
  const dir = p.dir === -1 ? -1 : 1, L = cfg.L, cy = cfg.span / 2;
  return { dir, L, cy, M: (u, y, z) => [dir > 0 ? u : L - u, y, z], half: cfg.span / 2 - .15 };
}

function drawPlane(cfg, p) {
  const { dir, L, cy, M, half } = setup(cfg, p), gear = p.gear !== false;
  const body = p.body || '#f3f2ec', belly = p.belly || '#c4c9d2', stripe = p.stripe || AP.red, tailc = p.tail || stripe, engc = p.eng || '#e9e8e2', wingc = p.wing || '#d5dae0', accent = p.accent || '#ffffff';
  const st = cfg.st.map(s => ({ x: s[0], y: cy, z: cfg.zc + (s[2] || 0), ry: s[1], rz: s[1] }));
  const W = cfg.wing, E = cfg.eng, S = cfg.stab, G = cfg.gear, rmax = Math.max(...cfg.st.map(s => s[1]));
  const tube = (ss, col, o) => { ss = ss.slice().sort((a, b) => dir * (a.x - b.x)); loft(tubeSecs(ss, o && o.N || 16, M), Object.assign({ closed: true, col: (k, i) => col(k, (ss[i].x + ss[i + 1].x) / 2) }, o)); };
  const poly = (pts, h, h2) => fq(pts.map(q => M(q[0], q[1], q[2])), h, h2);
  const ln = (a, b, h) => lw(M(a[0], a[1], a[2]), M(b[0], b[1], b[2]), h);
  const wz = y => W.z + (W.zt - W.z) * Math.min(1, Math.abs(y) / half);

  const surface = (sgn, o, col, flaps) => { // a flat lifting surface (wing or stabiliser half)
    const y0 = cy + sgn * (o.ry || 0), y1 = cy + sgn * o.half;
    const a = [o.x0, y0, o.z], b = [o.x1, y0, o.z], c = [o.tx1, y1, o.zt === undefined ? o.z : o.zt], d = [o.tx0, y1, o.zt === undefined ? o.z : o.zt];
    const dn = q => [q[0], q[1], q[2] - .13];
    poly([a, b, c, d].map(dn), dk(col, .5)); poly([a, b, c, d], col);
    if (flaps) { // flap / aileron panels along the trailing edge
      const f = (t0, t1, k, h) => poly([lerp(a, d, t0), lerp(lerp(a, d, t0), lerp(b, c, t0), k), lerp(lerp(a, d, t1), lerp(b, c, t1), k), lerp(a, d, t1)], h);
      f(.12, .58, .28, dk(col, .1)); f(.62, .93, .24, dk(col, .16));
      ln(lerp(lerp(a, d, .12), lerp(b, c, .12), .28), lerp(lerp(a, d, .58), lerp(b, c, .58), .28), dk(col, .3));
      ln(lerp(lerp(a, d, .1), lerp(b, c, .1), .82), lerp(lerp(a, d, .95), lerp(b, c, .95), .82), lt(col, .5));
    }
    const oc = dk(col, .65); ln(a, b, oc); ln(b, c, oc); ln(c, d, oc); ln(d, a, oc);
    return { a, b, c, d };
  };
  const wingHalf = sgn => {
    const q = surface(sgn, { x0: W.x0, x1: W.x1, tx0: W.tx0, tx1: W.tx1, z: W.z, zt: W.zt, ry: W.ry, half }, wingc, true);
    if (W.winglet) { const t = [q.d[0] - .5, q.d[1], q.d[2] + 1.0], t2 = [q.d[0] - .05, q.d[1], q.d[2] + 1.0]; poly([q.d, q.c, t2, t], dk(tailc, .18)); const oc = dk(tailc, .7); ln(q.d, q.c, oc); ln(q.c, t2, oc); ln(t2, t, oc); ln(t, q.d, oc); }
    const near = sgn > 0, red = (near && dir > 0) || (!near && dir < 0);
    const tipz = q.c[2] + (W.winglet ? 1.0 : .06), tipx = W.winglet ? q.d[0] - .2 : q.c[0] - .15;
    lamp(...M(tipx, q.c[1], tipz), red ? '#ff4a3a' : '#3dff7a');
  };
  const stabHalf = sgn => surface(sgn, { x0: S.x0, x1: S.x1, tx0: S.tx0, tx1: S.tx1, z: S.z, ry: S.T ? 0 : .2, half: S.half }, S.T ? dk(tailc, .08) : wingc, false);
  const engine = sgn => {
    const ey = cy + sgn * E.y, len = E.x1 - E.x0, r = E.r, front = dir > 0;
    if (E.type === 'jet' || E.type === 'rear') {
      if (E.type === 'jet') { const zt = wz(E.y) - .05; poly([[E.x0 + .7, ey, E.z + r * .7], [E.x1 - .9, ey, E.z + r * .7], [E.x1 - 1.3, ey, zt], [E.x0 + .3, ey, zt]], dk(engc, .3)); }
      else poly([[E.x0 + .3, cy + sgn * .3, E.z + .08], [E.x1 - .4, cy + sgn * .3, E.z + .08], [E.x1 - .4, ey, E.z + .08], [E.x0 + .3, ey, E.z + .08]], dk(body, .25));
      tube([{ x: E.x0, r: r * .55 }, { x: E.x0 + len * .28, r: r * .88 }, { x: E.x1 - .45, r }, { x: E.x1, r: r * .9 }].map(q => ({ x: q.x, y: ey, z: E.z, ry: q.r, rz: q.r })),
        (k, u) => u > E.x1 - .45 ? '#c3cad2' : u < E.x0 + len * .28 ? '#8a93a0' : engc, { N: 12, cap: front ? '#b6bec8' : '#3a3d4a' });
      if (front) { discX(...M(E.x1, ey, E.z), r * .72, '#2b3040'); discX(...M(E.x1, ey, E.z), r * .22, '#c9d0d8', null, 6); }
      else discX(...M(E.x0, ey, E.z), r * .32, '#1d1c26', null, 8);
    } else { // turboprop nacelle + propeller
      const prop = () => {
        const c = M(E.x1 + .12, ey, E.z);
        if (p.spin === false) { for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .5; lw(c, [c[0], c[1] + Math.cos(a) * E.prop, c[2] + Math.sin(a) * E.prop], '#2e3440'); lw([c[0], c[1], c[2] + .06], [c[0], c[1] + Math.cos(a) * E.prop, c[2] + Math.sin(a) * E.prop + .06], '#2e3440'); } }
        else { discX(c[0], c[1], c[2], E.prop, '#f4f8fb', 'glass', 16); for (let i = 0; i < 3; i++) { const a = i * 2.094 + .4; lw(c, [c[0], c[1] + Math.cos(a) * E.prop * .9, c[2] + Math.sin(a) * E.prop * .9], '#8f99a6'); } for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; spx(c[0], c[1] + Math.cos(a) * E.prop, c[2] + Math.sin(a) * E.prop, 0, 0, i % 4 === 0 ? AP.yel : '#8f99a6'); } }
      };
      if (!front) prop();
      tube([{ x: E.x0, r: r * .5 }, { x: E.x0 + 1, r: r * .95 }, { x: E.x1 - .5, r }, { x: E.x1, r: r * .6 }, { x: E.x1 + .25, r: r * .15 }].map(q => ({ x: q.x, y: ey, z: E.z, ry: q.r, rz: q.r * 1.1 })),
        (k, u) => u > E.x1 ? '#3a3f4c' : (k >= 9 || k === 0) && u > E.x0 + 1 ? dk(engc, .25) : engc, { N: 12, cap: '#3a3f4c' });
      if (front) prop();
    }
  };
  const gearAt = (u, y, zt, r) => {
    r = r || G.r || .3; const X = M(u, y, 0)[0];
    wheel(X, y - .17, 0, r); lw([X, y, zt], [X, y, r], '#7c8592'); lw([X + 1 / 16, y, zt], [X + 1 / 16, y, r], '#a9b1bc'); lw([X - .25 * dir, y, zt * .8], [X, y, r + .15], '#7c8592'); wheel(X, y + .17, 0, r);
  };
  const mainZ = E.type === 'prop' ? E.z : cfg.zc - rmax * .5;

  // ---- far side ----
  if (gear) { gearAt(G.main, cy - G.y, mainZ); gearAt(G.nose, cy, cfg.zc - rmax * .6, (G.r || .3) * .85); }
  if (E.type !== 'rear') engine(-1);
  if (!W.high) wingHalf(-1);
  if (!S.T) stabHalf(-1);
  if (E.type === 'rear') engine(-1);
  // ---- fuselage ----
  const tb = p.tailBody ? 5.2 : -1;
  tube(st, (k, u) => (u < tb ? (k >= 12 ? dk(tailc, .15) : tailc) : k === 15 ? stripe : k >= 12 ? belly : k === 0 && p.stripe2 ? p.stripe2 : body), { cap: dir > 0 ? body : tailc });
  // doors, cargo door
  const P = (u, a) => M(...tpt(st, u, a));
  for (const d of cfg.doors) { const oc = dk(body, .35); lw(P(d, -.25), P(d, .75), oc); lw(P(d + .55, -.25), P(d + .55, .75), oc); lw(P(d, .75), P(d + .55, .75), oc); spx(...P(d + .27, .3), 0, 0, '#2b3a55'); spx(...P(d + .27, .3), 0, 1, '#2b3a55'); }
  if (cfg.cdoor) { const oc = dk(body, .4), [a, b] = cfg.cdoor; lw(P(a, -.2), P(a, .95), oc); lw(P(b, -.2), P(b, .95), oc); lw(P(a, .95), P(b, .95), oc); lw(P(a, -.2), P(b, -.2), oc); lw(P(a + .1, .35), P(b - .1, .35), dk(body, .15)); }
  // cabin windows
  if (cfg.win) for (let u = cfg.win[0], i = 0; u <= cfg.win[1]; u += cfg.win[2], i++) {
    if (cfg.doors.some(d => u > d - .2 && u < d + .75)) continue;
    const q = P(u, .3); spx(...q, 0, 0, '#2b3a55'); spx(...q, 0, 1, '#2b3a55'); spx(...q, 1, 0, '#3f587c'); spx(...q, 1, 1, '#2b3a55');
    if (hash2(i, 7, p.seed || 1) > .18) glow(() => { spx(...q, 0, 0, '#ffe9a8'); spx(...q, 0, 1, '#ffd98a'); spx(...q, 1, 0, '#ffe9a8'); spx(...q, 1, 1, '#ffd98a'); });
  }
  // cockpit glazing
  { const [c0, c1] = cfg.cock, g = '#27344e';
    fq([P(c0, .3), P(c1, .22), P(c1, .95), P(c0, 1.15)], g); fq([P(c0, 1.15), P(c1, .95), P(c1, Math.PI - .95), P(c0, Math.PI - 1.15)], '#3a4f72');
    lw(P(c0, 1.15), P(c1, .95), '#8fb4d0'); lw(P((c0 + c1) / 2, .28), P((c0 + c1) / 2, 1.05), '#55688a'); lw(P(c0, .3), P(c0, 1.15), dk(body, .4));
    glow(() => { fq([P(c0 + .1, .45), P(c1 - .1, .4), P(c1 - .1, .8), P(c0 + .1, .9)], '#7fe0c8', 'glass'); }); }
  // airline name
  if (p.name && cfg.text) { const wd = tw(p.name) / 16, u0 = dir > 0 ? cfg.text : L - cfg.text - wd, q = tpt(st, cfg.text, .82); wtext('y', p.name, u0, q[1], q[2] + .1, p.nameC || dk(stripe, .2)); }
  // ---- fin ----
  { const f = cfg.fin.map(q => [q[0], cy, q[1]]), fc = dk(tailc, .12), oc = dk(tailc, .7);
    poly(f.map(q => [q[0], q[1] - .12, q[2]]), dk(tailc, .45)); poly(f, fc);
    poly([f[1], lerp(f[1], f[0], .22), lerp(f[2], f[3], .3), f[2]], dk(accent === '#ffffff' ? tailc : accent, accent === '#ffffff' ? .0 : .1));
    for (let i = 0; i < 4; i++) ln(f[i], f[(i + 1) % 4], oc);
    ln(lerp(f[0], f[3], .08), lerp(f[0], f[3], .92), lt(tailc, .35));
    const c = lerp(lerp(f[0], f[1], .45), lerp(f[3], f[2], .45), .52), m = M(...c), lc = p.logo || '#ffffff'; // emblem: small maple-leaf-ish diamond
    for (const [a, b] of [[0, -3], [-1, -2], [0, -2], [1, -2], [-3, -1], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [3, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2], [0, 3]]) spx(m[0], m[1], m[2], a, b, lc);
  }
  if (S.T) { stabHalf(-1); stabHalf(1); } else stabHalf(1);
  if (E.type === 'rear') engine(1);
  if (W.high) wingHalf(-1);
  // ---- near side ----
  if (gear) gearAt(G.main, cy + G.y, mainZ);
  if (E.type !== 'rear') engine(1);
  wingHalf(1);
  if (W.high) { ln([W.x0, cy, W.z + .02], [W.x1, cy, W.z + .02], dk(wingc, .2)); }
  // lights
  lamp(...M(L * .52, cy, cfg.zc + rmax + .08), '#ff4a3a');
  lamp(...M(.25, cy, cfg.zc + cfg.st[0][2]), '#ffffff');
  if (gear) lamp(...M(G.nose + .1 * dir, cy + .05, (G.r || .3) * 2 + .35), '#fff6d0', true);
}

function drawShadow(cfg, p) {
  const { cy, M, half } = setup(cfg, p), W = cfg.wing, E = cfg.eng, S = cfg.stab, s = cfg.st;
  const sh = pts => fq(pts.map(q => M(q[0], q[1], 0)), SH, 'glass');
  for (let i = 0; i < s.length - 1; i++) sh([[s[i][0], cy - s[i][1]], [s[i + 1][0], cy - s[i + 1][1]], [s[i + 1][0], cy + s[i + 1][1]], [s[i][0], cy + s[i][1]]]);
  for (const g of [-1, 1]) {
    sh([[W.x0, cy], [W.x1, cy], [W.tx1, cy + g * half], [W.tx0, cy + g * half]]);
    sh([[S.x0, cy], [S.x1, cy], [S.tx1, cy + g * S.half], [S.tx0, cy + g * S.half]]);
    sh([[E.x0, cy + g * E.y - E.r], [E.x1, cy + g * E.y - E.r], [E.x1, cy + g * E.y + E.r], [E.x0, cy + g * E.y + E.r]]);
  }
}

const LIV = {
  maple: { name: 'MAPLE AIR', stripe: '#d8483a', tail: '#d8483a', belly: '#c4c9d2', logo: '#ffffff' },
  bayjet: { name: 'BAYJET', stripe: '#f2c230', tail: '#1f8f8a', tailBody: true, belly: '#1f8f8a', eng: '#1f8f8a', logo: '#f2c230', nameC: '#1a6f6b' },
  north: { name: 'NORTHWIND', stripe: '#27456b', tail: '#27456b', belly: '#27456b', eng: '#27456b', accent: '#6fb4cf', logo: '#bfe4ee' },
  sunrise: { name: 'SUNRISE', stripe: '#f08a2c', tail: '#c93f7a', tailBody: true, belly: '#d9d2c8', eng: '#f08a2c', accent: '#f08a2c', logo: '#ffe9a8', body: '#fbf3e2', nameC: '#c93f7a' },
  polar: { name: 'POLAR', stripe: '#6fb4cf', tail: '#3f7fc4', belly: '#aeb9c8', logo: '#ffffff', stripe2: '#dfeaf2' },
  maplex: { name: 'MAPLE CARGO', stripe: '#f08a2c', tail: '#5b3f8c', tailBody: true, belly: '#5b3f8c', eng: '#f3f2ec', logo: '#f08a2c', nameC: '#5b3f8c' },
  quick: { name: 'QUIKPAK', stripe: '#d8483a', tail: '#f2c230', belly: '#8d6b3f', body: '#f2c230', eng: '#f2c230', logo: '#d8483a', nameC: '#8a2f26', wing: '#cfd3d8' },
  gold: { stripe: '#c9a24a', tail: '#2a2f3d', belly: '#2a2f3d', eng: '#2a2f3d', logo: '#c9a24a' },
  wine: { stripe: '#8c2f4a', tail: '#8c2f4a', belly: '#d9d2c8', eng: '#f3f2ec', logo: '#ffffff', body: '#fbf6ea' },
  teal: { stripe: '#2f8f8a', tail: '#f3f2ec', belly: '#2f8f8a', eng: '#2f8f8a', logo: '#2f8f8a' },
};
const V = (liv, dir, gear, extra) => Object.assign({ dir, gear, seed: 3 }, LIV[liv], extra || {});

function planeAssets(key, id, variants, tags) {
  const cfg = CFG[key], size = [cfg.L, cfg.span, cfg.h];
  return [
    { id: 'veh.airport.' + id, kind: 'vehicle', tags: ['airport', 'aircraft', ...tags], size, vb: [-.4, -.4, 0, cfg.L + .4, cfg.span + .4, cfg.h + .4], variants, draw: p => drawPlane(cfg, p) },
    { id: 'veh.airport.' + id + '.shadow', kind: 'vehicle', solid: false, tags: ['airport', 'aircraft', 'shadow'], size: [cfg.L, cfg.span, .1], vb: [-.2, -.2, 0, cfg.L + .2, cfg.span + .2, .2], variants: [{ dir: 1 }, { dir: -1 }], draw: p => drawShadow(cfg, p) },
  ];
}

/* ---------- helicopter ---------- */
const HL = 10, HS = 7.6, HCY = HS / 2, HZ = 1.5;
function heliM(p) { const dir = p.dir === -1 ? -1 : 1; return { dir, M: (u, y, z) => [dir > 0 ? u : HL - u, y, z] }; }
function drawHeli(p) {
  const { dir, M } = heliM(p), body = p.body || '#d8483a', trim = p.trim || '#f3f2ec', cy = HCY, zc = HZ;
  const tube = (ss, col, o) => { ss = ss.slice().sort((a, b) => dir * (a.x - b.x)); loft(tubeSecs(ss, 16, M), Object.assign({ closed: true, col: (k, i) => col(k, (ss[i].x + ss[i + 1].x) / 2) }, o)); };
  const ln = (a, b, h) => lw(M(...a), M(...b), h), poly = (pts, h, h2) => fq(pts.map(q => M(...q)), h, h2);
  const skid = y => { ln([5.2, y, .08], [8.6, y, .08], '#3d4654'); ln([5.2, y, .14], [8.6, y, .14], '#5b6676'); ln([8.6, y, .14], [8.9, y, .35], '#3d4654'); ln([5.8, y, .1], [5.8, cy + (y - cy) * .6, .75], '#3d4654'); ln([7.9, y, .1], [7.9, cy + (y - cy) * .6, .75], '#3d4654'); };
  if (p.gear !== false || true) skid(cy - .85);
  // tail boom + fin + tail rotor
  const tr = () => { const c = M(.75, cy + .22, zc + 1.15); if (p.spin === false) { lw([c[0] - .6, c[1], c[2] - .3], [c[0] + .6, c[1], c[2] + .3], '#2e3440'); } else { discY(c[0], c[1], c[2], .7, '#dfe6ee', 'glass'); } spx(c[0], c[1], c[2], 0, 0, '#2e3440'); };
  tube([{ x: .5, r: .13, dz: .7 }, { x: 4.9, r: .34, dz: .42 }].map(q => ({ x: q.x, y: cy, z: zc + q.dz, ry: q.r, rz: q.r })), k => k >= 12 ? trim : body, { cap: body });
  { const f = [[.3, cy, zc + .5], [1.3, cy, zc + .7], [.95, cy, zc + 2.0], [.2, cy, zc + 2.0]]; poly(f, dk(trim, .12)); for (let i = 0; i < 4; i++) ln(f[i], f[(i + 1) % 4], dk(trim, .7)); poly([[.25, cy, zc + 1.6], [1.05, cy, zc + 1.6], [.95, cy, zc + 2.0], [.2, cy, zc + 2.0]], dk(body, .12));
    poly([[.3, cy - .6, zc + .75], [1.2, cy - .6, zc + .75], [1.2, cy + .6, zc + .75], [.3, cy + .6, zc + .75]], trim); }
  tr();
  // pod
  const st = [[4.3, .3, .3], [5, .78, .1], [6.2, 1.0, 0], [7.7, .95, 0], [8.6, .7, -.1], [9.2, .3, -.25]].map(s => ({ x: s[0], y: cy, z: zc + s[2], ry: s[1] * .92, rz: s[1] }));
  const glass = '#5fa9c8';
  tube(st, (k, u) => u > 7.7 && k < 8 ? (k < 2 ? '#4a90b0' : glass) : k >= 13 ? trim : k === 12 ? dk(body, .2) : body, { cap: '#4a90b0' });
  const P = (u, a) => M(...tpt(st, u, a));
  fq([P(6.3, .25), P(7.5, .25), P(7.5, 1.0), P(6.3, 1.0)], '#3d7fa0'); lw(P(6.3, .25), P(6.3, 1.0), dk(body, .5)); lw(P(6.9, .25), P(6.9, 1.0), dk(body, .5)); lw(P(7.5, .25), P(7.5, 1.0), dk(body, .5)); lw(P(6.3, 1.0), P(7.5, 1.0), dk(body, .5));
  lw(P(7.7, .1), P(7.7, 1.6), dk(body, .6)); lw(P(8.6, .2), P(7.7, 1.0), '#bfe4ee');
  glow(() => fq([P(6.4, .35), P(7.4, .35), P(7.4, .9), P(6.4, .9)], '#ffe9a8', 'glass'));
  if (p.name) { const wd = tw(p.name) / 16, q = tpt(st, 5.6, -.05); wtext('y', p.name, dir > 0 ? 4.9 : HL - 4.9 - wd, q[1], q[2] + .1, p.nameC || dk(body, .55)); }
  if (p.cross) { const m = P(5.6, .55); for (const [a, b] of [[0, -2], [0, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [0, 1], [0, 2], [1, -2], [1, -1], [1, 1], [1, 2], [-2, 1], [-1, 1], [2, 1]]) spx(m[0], m[1], m[2], a, b, p.cross); }
  skid(cy + .85);
  // engine hump, mast, rotor
  tube([{ x: 5.0, r: .3 }, { x: 5.5, r: .5 }, { x: 6.9, r: .5 }, { x: 7.3, r: .3 }].map(q => ({ x: q.x, y: cy, z: zc + .95, ry: q.r, rz: q.r * .7 })), () => dk(trim, .1), { cap: '#3a3f4c' });
  const hub = M(6.2, cy, zc + 1.75); lw([hub[0], hub[1], zc + 1.2], hub, '#3d4654'); lw([hub[0] + 1 / 16, hub[1], zc + 1.2], [hub[0] + 1 / 16, hub[1], hub[2]], '#5b6676');
  const R = 3.6;
  if (p.spin === false) { for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .45, c = Math.cos(a), s = Math.sin(a), w = .09; fq([[hub[0] - s * w, hub[1] + c * w, hub[2]], [hub[0] + c * R - s * w, hub[1] + s * R + c * w, hub[2] - .08], [hub[0] + c * R + s * w, hub[1] + s * R - c * w, hub[2] - .08], [hub[0] + s * w, hub[1] - c * w, hub[2]]], '#2e3440'); } }
  else { ringZ(hub[0], hub[1], hub[2], R * .62, R * .93, '#c3ccd6', 'glass'); ringZ(hub[0], hub[1], hub[2], R * .93, R, '#f4f8fb', 'glass');
    for (let i = 0; i < 2; i++) { const a = i * Math.PI + .6, c = Math.cos(a), s = Math.sin(a), w = .12; fq([[hub[0] - s * w, hub[1] + c * w, hub[2]], [hub[0] + c * R - s * w, hub[1] + s * R + c * w, hub[2]], [hub[0] + c * R + s * w, hub[1] + s * R - c * w, hub[2]], [hub[0] + s * w, hub[1] - c * w, hub[2]]], '#6b7482', 'glass'); } }
  discZ(hub[0], hub[1], hub[2] + .02, .22, '#3d4654', null, 8);
  lamp(...M(.2, cy, zc + 2.05), '#ff4a3a'); lamp(...M(6.2, cy + .9, zc - .2), dir > 0 ? '#ff4a3a' : '#3dff7a'); lamp(...M(9.1, cy + .1, zc - .55), '#fff6d0', true);
}
function drawHeliShadow(p) {
  const { M } = heliM(p), cy = HCY, c = M(6.9, cy, 0), h = M(6.2, cy, 0);
  fq([[4.6, cy - .5], [.4, cy - .12], [.4, cy + .12], [4.6, cy + .5]].map(q => M(q[0], q[1], 0)), SH, 'glass');
  fq([8, 7, 6, 5, 4, 3, 2, 1].map(i => { const a = i / 8 * 6.283; return [c[0] + Math.cos(a) * 2.4, c[1] + Math.sin(a) * .95, 0]; }), SH, 'glass');
  for (let i = 0; i < 2; i++) { const a = i * Math.PI / 2 + .6, co = Math.cos(a), s = Math.sin(a), w = .12, R = 3.6; fq([[h[0] - co * R - s * w, h[1] - s * R + co * w, 0], [h[0] + co * R - s * w, h[1] + s * R + co * w, 0], [h[0] + co * R + s * w, h[1] + s * R - co * w, 0], [h[0] - co * R + s * w, h[1] - s * R - co * w, 0]], SH, 'glass'); }
}

export default [
  ...planeAssets('airliner', 'airliner', [V('maple', 1, true), V('bayjet', -1, true), V('north', 1, false), V('sunrise', -1, false), V('polar', 1, true)], ['airliner', 'jet']),
  ...planeAssets('turboprop', 'turboprop', [V('teal', 1, true, { name: 'ISLAND HOP', nameC: '#1a6f6b' }), V('maple', -1, true, { name: 'MAPLE LINK' }), V('wine', 1, false, { name: 'COASTAL', spin: true })], ['regional', 'prop']),
  ...planeAssets('bizjet', 'bizjet', [V('gold', 1, true), V('wine', -1, true), V('north', 1, false, { name: '' }), V('teal', -1, false)], ['private', 'jet']),
  ...planeAssets('cargo', 'cargo', [V('maplex', 1, true), V('quick', -1, true), V('maplex', -1, false), V('quick', 1, false)], ['cargo', 'jet']),
  { id: 'veh.airport.helicopter', kind: 'vehicle', tags: ['airport', 'aircraft', 'helicopter'], size: [HL, HS, 3.5], vb: [-.3, -.3, 0, HL + .3, HS + .3, 3.9],
    variants: [{ dir: 1, body: '#d8483a', trim: '#f3f2ec', name: 'RESCUE', cross: '#ffffff', nameC: '#8a2f26' }, { dir: -1, body: '#27456b', trim: '#f3f2ec', name: 'POLICE', nameC: '#27456b', spin: false }, { dir: 1, body: '#f2c230', trim: '#2a2f3d', name: 'NEWS 7', nameC: '#f2c230', spin: false }, { dir: -1, body: '#f3f2ec', trim: '#2f8f8a', name: 'SKYTOUR', nameC: '#2f8f8a' }],
    draw: drawHeli },
  { id: 'veh.airport.helicopter.shadow', kind: 'vehicle', solid: false, tags: ['airport', 'aircraft', 'shadow'], size: [HL, HS, .1], vb: [-.2, -.2, 0, HL + .2, HS + .2, .2], variants: [{ dir: 1 }, { dir: -1 }], draw: drawHeliShadow },
];
