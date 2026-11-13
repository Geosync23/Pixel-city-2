// City-wide landmarks & park pavilions: museum, pool / sports hall, arena, radio tower, water tower,
// public restroom, park cafe, botanical conservatory, observatory.
import { box, qy, qx, qz, fq, lw, glow, lit, gable, hip, cyl, cone, ball, ellipse, PAT, rng, dk, lt, mix, hash2, foliage, PW, px, C, ENV } from '../../engine/raster.js';
import { Q, L, wallPat, txt, txtW, txtS, sign, icon, iconW, flatRoof, snowTop, gableSnow, dome, disc, vault, win, wins, door, shutter, awning, canopy, bulbs, bulbsV, neon, lamp, halo, banner, flag, column, stairs, pediment, bush, topiary, planter, ROOF, clutter, VB, band, cornice, pick, winter, SNOW, SNOW2 } from './_lib.js';

const beacon = (x, y, z, c = '#ff5a4a', big) => { lit(() => { const q = PW(x, y, z); px(q[0], q[1], C(c)); px(q[0], q[1] - 1, C(c)); if (big) { px(q[0] - 1, q[1], C(c)); px(q[0] + 1, q[1], C(c)); px(q[0], q[1] + 1, C(c)); } }); if (big) halo(x, y, z, 5, c); };
const PERSON = ['.pp.', '.pp.', 'pppp', 'pppp', '.pp.', '.pp.', '.pp.'];
const PERSON2 = ['.pp.', '.pp.', '.pp.', 'pppp', 'pppp', 'pppp', '.pp.'];
/* plants inside a glasshouse */
function jungle(x0, x1, y0, y1, z, r, n) {
  const pts = []; for (let i = 0; i < n; i++) pts.push([x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), r()]);
  pts.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  for (const [x, y, k] of pts) {
    const g = ['#3f9a55', '#2f8a4a', '#58b060', '#4aa86a'][Math.floor(k * 4)];
    if (k < .3) { lw([x, y, z], [x, y, z + 1.6 + k * 2], '#7a5a3a'); for (let a = 0; a < 6; a++) lw([x, y, z + 1.6 + k * 2], [x + Math.cos(a) * .7, y + Math.sin(a) * .7, z + 1.3 + k * 2 + (a % 2) * .3], g); }
    else { ball(x, y, z + .3 + k * .5, .3 + k * .35, g, { ol: false, squash: .8 }); if (k > .8) { const q = PW(x, y, z + .7 + k * .5); px(q[0], q[1], C('#ff8fb0')); px(q[0] + 2, q[1] + 1, C('#ffd166')); } }
  }
}

export default [
  /* ------------------------------------------------------------ museum */
  {
    id: 'bld.civic.museum', kind: 'building', tags: ['civic', 'arts', 'museum', 'landmark', 'culture'],
    size: [16, 10, 7.6], vb: [-.4, -.4, 0, 16.6, 10.6, 10.2],
    door: { side: 'y', at: 8 }, light: { x: 8, y: 10.8, z: 0, r: 6 },
    variants: [{ seed: 4, name: 'MUSEUM' }, { seed: 15, name: 'CITY MUSEUM', wall: '#c9cdd6', b: ['#2f6fd0', '#f2c230', '#d2392f'] }, { seed: 30, name: 'ART MUSEUM', wall: '#e6d2c0', b: ['#7a3f8a', '#e8843a', '#1fa39a'] }],
    draw(p) {
      const r = rng(p.seed || 1), st = p.wall || '#dcc9a2', nm = p.name || 'MUSEUM', B = p.b || ['#c8423a', '#2a9d8f', '#e9b44c'], pz = .6, ct = 5.4, H = 7.2;
      box(0, 0, 0, 16, 9.2, pz, st, wallPat('stone', dk(st, .1)));
      // main block
      box(.4, .4, pz, 15.2, 7.6, ct - pz, st, wallPat('stone', st));
      wins('x', 1.2, 7.4, 15.6, pz + 1.0, pz + 3.4, { ww: .9, n: 4, r, p: .7, trim: dk(lt(st, .3), .2), mullion: 'h', glowc: ['#ffe2a0', '#ffc27a'] });
      for (let y = .9; y < 8; y += 1.6) qx(15.6, y - .14, y + .14, pz, ct, dk(lt(st, .2), .36));
      // porch back wall
      qy(.4, 15.6, 8, pz, ct, dk(st, .3));
      door('y', 8, 8, { z: pz, c: '#6a4a2a', double: true, w: 2, h: 2.6, frame: lt(st, .3), full: false, transom: true });
      for (const x of [3, 5.4, 10.6, 13]) win('y', x - .5, x + .5, 8, pz + 1, pz + 3.4, { on: true, mullion: 'h', trim: lt(st, .3), glowc: ['#ffe2a0', '#ffc27a'] });
      glow(() => qy(.6, 15.4, 8, pz, ct, '#ffd98a', 'glass'));
      // steps
      stairs(3.5, 12.5, 9.2, 3, lt(st, .1), { dep: .27, rise: .2 });
      // colonnade + banners
      const xs = []; for (let i = 0; i < 8; i++) xs.push(1.0 + i * 2);
      for (const x of xs) column(x, 8.75, pz, ct - pz, .28, lt(st, .2));
      for (let i = 0; i < 3; i++) { const x = [3, 5, 11][i] + (i === 2 ? 0 : 0); banner('y', x + .45, 9.06, 1.9, ct - .1, 1.1, B[i], { c2: '#fff8e8' }); }
      banner('y', 13.45, 9.06, 1.9, ct - .1, 1.1, B[0], { c2: '#fff8e8' });
      // attic
      box(0, 0, ct, 16, 9.2, H - ct, st, wallPat('stone', lt(st, .08)));
      qy(0, 16, 9.2, ct, ct + .25, dk(lt(st, .3), .18)); qx(16, 0, 9.2, ct, ct + .25, dk(lt(st, .3), .36)); qy(0, 16, 9.2, H - .2, H, dk(lt(st, .3), .18));
      sign('y', nm, 2, 14, 9.21, ct + .35, H - .3, null, dk(st, .62), { s: 2 });
      const f = flatRoof(0, 0, H, 16, 9.2, st, { cap: lt(st, .3), roof: '#b0a898' });
      // glass pyramid skylight
      const gx = 5.5, gy = 2.2, gs = 5, gh = 2.2, ap = [gx + gs / 2, gy + gs / 2, H + gh];
      box(gx - .2, gy - .2, H, gs + .4, gs + .4, .2, lt(st, .2));
      const tri = (a, b, c1, c2) => { fq([a, b, ap], c1, c2); };
      tri([gx, gy + gs, H + .2], [gx + gs, gy + gs, H + .2], winter() ? SNOW : '#9fd4e8', '#b8e2f0'); tri([gx + gs, gy, H + .2], [gx + gs, gy + gs, H + .2], '#6fb0cc', '#86c0d8');
      glow(() => { tri([gx, gy + gs, H + .2], [gx + gs, gy + gs, H + .2], '#ffe9b0', '#ffd98a'); tri([gx + gs, gy, H + .2], [gx + gs, gy + gs, H + .2], '#f4c870', '#e8b860'); });
      for (let k = 1; k < 4; k++) { const t = k / 4; lw([gx + gs * t, gy + gs, H + .2], ap, '#f4f8fb'); lw([gx + gs, gy + gs * t, H + .2], ap, '#d8e4ea'); lw([gx + gs / 2 * t, gy + gs - gs / 2 * t, H + .2 + gh * t], [gx + gs - gs / 2 * t, gy + gs - gs / 2 * t, H + .2 + gh * t], '#f4f8fb'); lw([gx + gs - gs / 2 * t, gy + gs / 2 * t, H + .2 + gh * t], [gx + gs - gs / 2 * t, gy + gs - gs / 2 * t, H + .2 + gh * t], '#d8e4ea'); }
      lw([gx, gy + gs, H + .2], ap, '#4a5a68'); lw([gx + gs, gy + gs, H + .2], ap, '#f4f8fb'); lw([gx + gs, gy, H + .2], ap, '#4a5a68'); lw([gx, gy + gs, H + .2], [gx + gs, gy + gs, H + .2], '#4a5a68'); lw([gx + gs, gy, H + .2], [gx + gs, gy + gs, H + .2], '#4a5a68');
      ROOF.ac2(12, 1.2, H); ROOF.ac2(12, 3, H); ROOF.hatch(1.5, 1.5, H); ROOF.vent(13.5, 5.5, H);
      // statues on the cheek blocks + flags
      for (const x of [2.3, 12.6]) { box(x, 9.2, 0, 1.1, .8, 1.0, lt(st, .1)); box(x + .35, 9.45, 1.0, .4, .3, .7, '#7a8a80', { ol: false }); ball(x + .55, 9.6, 1.95, .2, '#7a8a80'); }
      flag(.6, 8.8, H + .3, 2.3, B[0], '#fff8e8'); flag(15.4, 8.8, H + .3, 2.3, B[1], '#fff8e8');
    },
  },
  /* ------------------------------------------------------------ public pool / sports hall */
  {
    id: 'bld.civic.pool', kind: 'building', tags: ['civic', 'pool', 'sports', 'gym', 'leisure'],
    size: p => [p.w || 14, p.d || 10, 6.8], vb: VB(p => [p.w || 14, p.d || 10, 6.8], .8, .6, 1),
    door: { side: 'y', at: 2.4 }, light: { x: 2.4, y: 11, z: 0, r: 4.5 }, lightFor: p => ({ x: 2.4, y: (p.d || 10) + 1, z: 0, r: 4.5 }),
    variants: [{ w: 14, d: 10, seed: 3, name: 'AQUATIC CENTRE' }, { w: 16, d: 11, seed: 14, name: 'SPORTS HALL', kind: 'sports', accent: '#e8843a', roof: '#c9d2da' }, { w: 12, d: 9, seed: 25, name: 'PUBLIC POOL', accent: '#2f8fd0', roof: '#e8eef2' }, { w: 14, d: 10, seed: 38, name: 'ICE RINK', kind: 'ice', accent: '#7a6fd0', roof: '#aeb8c8' }],
    draw(p) {
      const w = p.w || 14, d = p.d || 10, r = rng(p.seed || 1), sp = p.kind === 'sports', ice = p.kind === 'ice', ac = p.accent || '#1fa3b8', roof = p.roof || '#b8d4dc', wall = '#eef0ec', dark = '#3a4a54', nm = p.name || 'AQUATIC CENTRE';
      const hd = d - 1.5, HW = 3.4, gc = sp ? ['#ffd98a', '#f4b860'] : ice ? ['#e0f0ff', '#c0dcf8'] : ['#8ff0f0', '#5fd8e8'];
      box(0, 0, 0, w, hd, HW, wall);
      qy(0, w, hd, 0, .5, dk(ac, .3)); qx(w, 0, hd, 0, .5, dk(ac, .45));
      // long glazed wall showing the hall inside
      const gx0 = 5.6, gx1 = w - .5, n = Math.max(2, Math.round((gx1 - gx0) / 1.3));
      wins('y', gx0, gx1, hd, .6, HW - .3, { ww: (gx1 - gx0) / n - .001, gap: 0, n, on: true, frame: dark, mullion: 'h', glowc: gc });
      if (!sp) { qy(gx0, gx1, hd, .62, 1.1, ice ? '#d8ecf8' : '#3fc0d0', ice ? '#eef6fc' : '#6fd8e0'); for (let x = gx0; x < gx1; x += (gx1 - gx0) / n) lw([x, hd, .6], [x, hd, 1.1], dark); if (!ice) for (let x = gx0 + .3; x < gx1 - .3; x += 1.1) { const q = PW(x, hd, 1.1); for (let k = 0; k < 6; k++) px(q[0] + k, q[1] + (k >> 1) - 1, C(k % 3 ? '#e2574c' : '#ffffff')); } }
      else { qy(gx0, gx1, hd, .62, 1.0, '#d9a441', '#e2b458'); for (let x = gx0 + .8; x < gx1 - .5; x += 2.6) { box(x, hd - .01, 1.9, .5, .02, .4, '#ffffff', { ol: false }); const q = PW(x + .25, hd, 1.85); px(q[0], q[1], C('#e8843a')); px(q[0] + 1, q[1], C('#e8843a')); } }
      // wave stripe
      qy(0, gx0 - .2, hd, 2.3, 2.9, (u, v) => v > 4 + Math.sin(u / 5) * 2.5 ? null : ac);
      // glazed arch end wall
      qx(w, .5, hd - .5, .6, HW - .2, '#6aa2bd', '#86bcd2'); glow(() => qx(w, .5, hd - .5, .6, HW - .2, dk(gc[0], .08), dk(gc[1], .08)));
      for (let y = .5; y <= hd - .49; y += (hd - 1) / 5) lw([w, y, .6], [w, y, HW - .2], dark); lw([w, .5, .6], [w, hd - .5, .6], dark); lw([w, .5, HW - .2], [w, hd - .5, HW - .2], dark); lw([w, .5, 1.9], [w, hd - .5, 1.9], dark);
      // vault roof with glazed lunette
      vault(0, 0, HW, w, hd, 3.2, roof, { cap: '#6aa2bd', cap2: '#86bcd2', ribs: 2 });
      glow(() => { const pts = []; for (let i = 1; i <= 11; i++) { const t = i / 12; pts.push([w, hd * t, HW + 3.2 * Math.sin(Math.PI * t) * .9]); } fq(pts, dk(gc[0], .08), dk(gc[1], .08)); });
      for (let i = 1; i < 6; i++) { const t = i / 6; lw([w, hd * t, HW], [w, hd * t, HW + 3.2 * Math.sin(Math.PI * t)], dark); } lw([w, 0, HW], [w, hd, HW], dark);
      // entrance lobby
      const lh = 3.0; box(.5, hd - 1.6, 0, 4.4, 3.1, lh, ac);
      qy(.5, 4.9, d, 0, .35, dk(ac, .45));
      door('y', 2.4, d, { c: '#e8eef0', double: true, w: 1.8, h: 1.8, frame: '#ffffff', full: true, handle: dark });
      win('y', .8, 1.3, d, .5, 1.8, { on: true, frame: '#ffffff' }); win('y', 3.5, 4.6, d, .5, 1.8, { on: true, frame: '#ffffff', mullion: 'v' });
      win('x', hd - .2, d - .4, 4.9, .5, 1.8, { on: true, frame: '#ffffff' });
      sign('y', nm, .6, 4.8, d + .01, 2.1, 2.75, '#ffffff', ac, { lit: true, frame: dk(ac, .3) });
      const fl = flatRoof(.5, hd - 1.6, lh, 4.4, 3.1, ac, { cap: '#ffffff', roof: '#9aa4a8', ph: .2 });
      ROOF.ac(1.2, hd - .2, lh); ROOF.vent(3.2, hd + .2, lh);
      // bike hoops + bench by the wall
      for (let x = 6.2; x < Math.min(w - 1, 9.5); x += .8) { lw([x, hd + .4, 0], [x, hd + .4, .6], '#8d939b'); lw([x, hd + .4, .6], [x + .4, hd + .4, .6], '#8d939b'); lw([x + .4, hd + .4, .6], [x + .4, hd + .4, 0], '#8d939b'); }
      planter(w - 3.4, hd + .1, 0, 2.6, .6, .5, '#d8dce0');
    },
  },
  /* ------------------------------------------------------------ arena / stadium */
  {
    id: 'bld.civic.arena', kind: 'building', tags: ['civic', 'arena', 'stadium', 'sports', 'venue', 'landmark'],
    size: [18, 18, 6], vb: [-.5, -.5, 0, 18.6, 18.8, 12.5],
    door: { side: 'y', at: 9 }, light: { x: 9, y: 19, z: 0, r: 8 },
    variants: [{ seed: 5, name: 'MAPLE BAY ARENA', team: ['#d2392f', '#f4f0e8'] }, { seed: 19, name: 'HERON STADIUM', team: ['#2f6fd0', '#f2c230'], wall: '#d8dce0' }],
    draw(p) {
      const r = rng(p.seed || 1), wall = p.wall || '#e4dccb', T = p.team || ['#d2392f', '#f4f0e8'], nm = p.name || 'MAPLE BAY ARENA', cx = 9, cy = 9, R = 8.8, H = 5.6, dark = '#39404c';
      const A = (a, rr = R) => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
      const arcQ = (a0, a1, z0, z1, c, c2, rr = R + .02) => { const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / .12)); for (let i = 0; i < n; i++) { const p0 = A(a0 + (a1 - a0) * i / n, rr), p1 = A(a0 + (a1 - a0) * (i + 1) / n, rr); fq([[p0[0], p0[1], z0], [p1[0], p1[1], z0], [p1[0], p1[1], z1], [p0[0], p0[1], z1]], c, c2); } };
      const mast = (x, y) => { box(x - .12, y - .12, 0, .24, .24, 10, '#8d939b', { ol: false }); lw([x - .12, y + .12, 0], [x - .12, y + .12, 10], '#5d646e'); box(x - .7, y - .2, 10, 1.4, .4, 1.1, '#5d646e'); lit(() => { for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const q = PW(x - .55 + i * .36, y + .2, 10.95 - j * .34); px(q[0], q[1], C('#fffbe0')); px(q[0] + 1, q[1], C('#fffbe0')); px(q[0], q[1] + 1, C('#fff2a8')); px(q[0] + 1, q[1] + 1, C('#fff2a8')); } }); halo(x, y + .2, 10.6, 12, '#fff8d0'); };
      mast(1.3, 1.3);
      // outer wall
      cyl(cx, cy, 0, R, H, wall, { l: dk(wall, .14), r: dk(wall, .34) });
      const V0 = -Math.PI * .22, V1 = Math.PI * .72; // visible arc (front)
      arcQ(V0, V1, 0, .6, dk(wall, .5)); arcQ(V0, V1, 4.2, 4.9, T[0]); arcQ(V0, V1, 4.9, 5.05, T[1]);
      // concourse glazing + ribs
      for (let a = V0 + .05, i = 0; a < V1 - .1; a += .2, i++) {
        const on = r() < .75; arcQ(a + .03, a + .17, 2.3, 3.6, a > .5 ? '#7fb6d0' : '#6aa2bd', a > .5 ? '#9fcbe0' : '#86bcd2'); if (on) glow(() => arcQ(a + .03, a + .17, 2.3, 3.6, '#ffe2a0', '#f4c870'));
        const q = A(a, R + .25); lw([q[0], q[1], 0], [q[0], q[1], H], dk(wall, .5)); const q2 = A(a, R + .02); lw([q2[0], q2[1], 0], [q2[0], q2[1], H], lt(wall, .3));
      }
      // gates
      for (const a of [Math.PI / 2, Math.PI / 2 - .5, Math.PI / 2 + .5, 0.1, Math.PI * .25]) { arcQ(a - .09, a + .09, 0, 1.8, dark); glow(() => arcQ(a - .07, a + .07, .1, 1.7, '#ffd98a', '#f4c870')); arcQ(a - .1, a + .1, 1.8, 2.05, T[0]); }
      // bowl: rim, tiers, track, pitch
      disc(cx, cy, H, R, lt(wall, .25)); disc(cx, cy, H, R - .5, dk(wall, .45));
      for (let k = 0; k < 6; k++) { const rr = R - .7 - k * .75, z = H - .3 - k * .65; disc(cx, cy, z, rr, k % 2 ? T[0] : dk(T[0], .15), k % 3 === 1 ? T[1] : (k % 2 ? dk(T[0], .1) : T[0])); }
      const pz = H - .3 - 6 * .65 + .2;
      disc(cx, cy, pz, 4.3, winter() ? '#d8b0a0' : '#c8664a'); disc(cx, cy, pz, 3.6, winter() ? SNOW2 : '#4f9a45');
      qz(cx - 2.6, cx + 2.6, cy - 1.7, cy + 1.7, pz, winter() ? (x, y) => (Math.floor(x) & 1 ? SNOW : SNOW2) : (x, y) => (Math.floor(x * 1.2) & 1 ? '#5aa84f' : '#4f9a45'));
      const wl = '#f4f8f4'; lw([cx - 2.6, cy - 1.7, pz], [cx + 2.6, cy - 1.7, pz], wl); lw([cx - 2.6, cy + 1.7, pz], [cx + 2.6, cy + 1.7, pz], wl); lw([cx - 2.6, cy - 1.7, pz], [cx - 2.6, cy + 1.7, pz], wl); lw([cx + 2.6, cy - 1.7, pz], [cx + 2.6, cy + 1.7, pz], wl); lw([cx, cy - 1.7, pz], [cx, cy + 1.7, pz], wl); disc(cx, cy, pz, .5, wl, 'glass');
      // near rim lip (hides the lower tiers' front edge) + roof canopy over the back stands
      { const s = PW(cx, cy, H), rx = R * 16 * 1.414, ry = rx / 2, rx2 = (R - .5) * 16 * 1.414, ry2 = rx2 / 2; for (let X = Math.ceil(s[0] - rx); X <= Math.floor(s[0] + rx); X++) { const k = (X - s[0]) / rx, e = ry * Math.sqrt(Math.max(0, 1 - k * k)), k2 = (X - s[0]) / rx2, e2 = Math.abs(k2) < 1 ? ry2 * Math.sqrt(1 - k2 * k2) : 0; for (let Y = Math.round(s[1] + e2); Y <= Math.round(s[1] + e); Y++) px(X, Y, C(winter() ? SNOW : lt(wall, .25))); px(X, Math.round(s[1] + e2), C(dk(wall, .5))); } }
      { const s = PW(cx, cy, H + 1.2), rx = (R + .3) * 16 * 1.414, ry = rx / 2, rx2 = (R - 2.4) * 16 * 1.414, ry2 = rx2 / 2, cA = C(winter() ? SNOW : '#f4f6f8'), cB = C(winter() ? SNOW2 : '#d0d8e0'), co = C('#5d646e'); for (let X = Math.ceil(s[0] - rx); X <= Math.floor(s[0] + rx); X++) { const k = (X - s[0]) / rx, e = ry * Math.sqrt(Math.max(0, 1 - k * k)), k2 = (X - s[0]) / rx2, e2 = Math.abs(k2) < 1 ? ry2 * Math.sqrt(1 - k2 * k2) : 0; const y0 = Math.round(s[1] - e), y1 = Math.round(s[1] - e2 - (Math.abs(k2) < 1 ? 0 : 0)); const lim = Math.round(s[1] - ry * .12); for (let Y = y0; Y <= Math.min(y1, lim); Y++) px(X, Y, (Math.floor((X - s[0]) / 14) & 1) ? cA : cB); px(X, y0 - 1, co); if (Math.min(y1, lim) > y0) px(X, Math.min(y1, lim) + 1, co); } }
      // scoreboard + sign
      box(cx - 1.6, 1.0, H + 1.3, 3.2, .3, 1.5, dark); lit(() => { qy(cx - 1.45, cx + 1.45, 1.31, H + 1.42, H + 2.68, '#16202c'); txt('y', '2', cx - 1.2, 1.32, H + 2.5, '#ffd24a', 2); txt('y', '1', cx + .75, 1.32, H + 2.5, '#ffd24a', 2); txt('y', 'HOME', cx - .5, 1.32, H + 2.3, '#7df9ff'); });
      mast(16.7, 1.3); mast(1.3, 16.7);
      box(cx - 3.4, cy + R - .1, 2.5, 6.8, .3, 1.2, dark); sign('y', nm, cx - 3.3, cx + 3.3, cy + R + .21, 2.6, 3.6, '#16202c', '#ffd24a', { lit: true, s: txtW(nm, 2) < 6.4 ? 2 : 1 });
      bulbs('y', cx - 3.3, cx + 3.3, cy + R + .21, 3.66, { step: .3, cols: [T[0], '#fff2a8'] });
      for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + (i - 2) * .22, q = A(a, R + .05); banner('y', q[0] - .3, q[1] + .1, 4.3, 5.5, .6, i % 2 ? T[1] : T[0], { c2: i % 2 ? T[0] : T[1], emblem: false }); }
      mast(16.7, 16.7);
    },
  },
  /* ------------------------------------------------------------ radio / TV tower */
  {
    id: 'bld.civic.radiotower', kind: 'building', tags: ['civic', 'tower', 'radio', 'landmark', 'infrastructure'],
    size: [6, 5, 4], vb: [-.4, -.4, 0, 6.5, 5.5, 33.5],
    door: { side: 'y', at: 4.8 }, light: { x: 4.8, y: 5.6, z: 0, r: 3 },
    variants: [{ seed: 2, name: 'MBTV' }, { seed: 9, name: 'RADIO 98', c: '#e8843a' }],
    draw(p) {
      const r = rng(p.seed || 1), red = p.c || '#d93a34', wh = '#f1f1ec', nm = p.name || 'MBTV', cx = 2.3, cy = 2.5, TH = 27, base = 2.0, top = .3;
      const hw = z => base + (top - base) * Math.min(1, z / TH), K = (sx, sy, z) => [cx + sx * hw(z), cy + sy * hw(z), z];
      const seg = 2.7, ns = TH / seg;
      // concrete pad + feet
      box(.1, .3, 0, 4.4, 4.4, .2, '#a8a49c');
      const face = (s1, s2, shade) => { // s1,s2 = corner sign pairs
        for (let i = 0; i < ns; i++) {
          const z0 = i * seg, z1 = z0 + seg, c0 = i % 2 ? wh : red, c = shade ? dk(c0, shade) : c0;
          const a0 = K(s1[0], s1[1], z0), a1 = K(s1[0], s1[1], z1), b0 = K(s2[0], s2[1], z0), b1 = K(s2[0], s2[1], z1);
          lw(a0, b1, c); lw(b0, a1, c); lw(a1, b1, c);
          for (const o of [0, .07]) { lw([a0[0] + o, a0[1], a0[2]], [a1[0] + o, a1[1], a1[2]], c); lw([b0[0] + o, b0[1], b0[2]], [b1[0] + o, b1[1], b1[2]], c); }
        }
      };
      face([-1, -1], [1, -1], .5); face([-1, -1], [-1, 1], .45);
      // central feed + ladder
      lw([cx, cy, .2], [cx, cy, TH], '#5d646e');
      face([1, -1], [1, 1], .22); face([-1, 1], [1, 1], 0);
      // platforms with dishes
      for (const [z, n] of [[13.5, 3], [21.6, 2]]) {
        const h = hw(z) + .35; box(cx - h, cy - h, z, 2 * h, 2 * h, .15, '#6f757d');
        for (let x = cx - h; x <= cx + h + .01; x += h / 2) lw([x, cy + h, z + .15], [x, cy + h, z + .7], '#8d939b'); lw([cx - h, cy + h, z + .7], [cx + h, cy + h, z + .7], '#8d939b'); lw([cx + h, cy - h, z + .7], [cx + h, cy + h, z + .7], '#6f757d');
        for (let i = 0; i < n; i++) { const q = PW(cx - h + .3 + i * (2 * h - .6) / Math.max(1, n - 1), cy + h + .1, z + 1.2 - (i % 2) * .3); ellipse(q[0], q[1], 6, 7, '#e4e8ec'); ellipse(q[0] - 1, q[1], 4, 5, '#c0c8d0'); px(q[0] - 1, q[1], C('#5d646e')); }
        const q = PW(cx + h + .1, cy, z + 1.0); ellipse(q[0], q[1], 5, 7, '#d0d6dc'); ellipse(q[0] + 1, q[1], 3, 5, '#aab2ba');
        beacon(cx - h, cy + h, z + .75); beacon(cx + h, cy + h, z + .75); beacon(cx + h, cy - h, z + .75);
      }
      // top mast with antenna panels + beacons
      box(cx - .4, cy - .4, TH, .8, .8, .2, '#6f757d');
      box(cx - .12, cy - .12, TH + .2, .24, .24, 4.6, wh, { ol: false }); for (let z = TH + .2; z < TH + 4.6; z += 1.15) box(cx - .12, cy - .12, z, .24, .24, .58, red, { ol: false });
      for (let z = TH + .8; z < TH + 3.6; z += .7) { box(cx - .3, cy + .12, z, .6, .1, .45, '#e4e8ec', { ol: false }); box(cx + .12, cy - .3, z, .1, .6, .45, '#c0c8d0', { ol: false }); }
      lw([cx, cy, TH + 4.8], [cx, cy, TH + 5.9], '#8d939b');
      beacon(cx, cy, TH + 5.9, '#ff5a4a', true); beacon(cx - .3, cy + .3, TH + .3, '#ffffff'); beacon(cx + .3, cy + .3, TH + .3, '#ff5a4a');
      // station hut
      box(3.6, 2.6, 0, 2.4, 2.4, 2.4, '#d8d4cc', wallPat('stucco', '#d8d4cc'));
      qy(3.6, 6, 5, 1.9, 2.4, dk(red, .18)); qx(6, 2.6, 5, 1.9, 2.4, dk(red, .36));
      door('y', 4.8, 5, { c: '#39404c', w: .8, h: 1.6, frame: wh }); win('y', 3.8, 4.25, 5, .9, 1.5, { on: true }); win('x', 3.2, 4.4, 6, .8, 1.6, { on: true, mullion: 'v' });
      lit(() => sign('y', nm, 3.7, 5.9, 5.01, 1.95, 2.38, null, '#fff8e8'));
      const f = flatRoof(3.6, 2.6, 2.4, 2.4, 2.4, '#d8d4cc', { ph: .2 }); ROOF.dish(4.2, 3.2, 2.4); ROOF.ac(4.6, 3.7, 2.4);
      // fence posts
      for (let x = .1; x < 3.5; x += .68) lw([x, 4.95, 0], [x, 4.95, 1.2], '#8d939b'); lw([.1, 4.95, 1.2], [3.5, 4.95, 1.2], '#8d939b'); lw([.1, 4.95, .6], [3.5, 4.95, .6], '#aab2ba');
      qy(1.4, 2.2, 4.96, .5, 1.0, '#f2c230'); txt('y', '!', 1.72, 4.97, .93, '#2a2a33');
    },
  },
  /* ------------------------------------------------------------ water tower */
  {
    id: 'bld.civic.watertower', kind: 'building', tags: ['civic', 'tower', 'water', 'infrastructure', 'landmark'],
    size: [4, 4, 11], vb: [-.8, -.8, 0, 4.8, 4.8, 13.6],
    variants: [{ seed: 1, name: 'MAPLE BAY' }, { seed: 2, name: 'MAPLEWOOD', c: '#e8eef0', band: '#d2392f' }, { seed: 3, name: 'RAILYARD', c: '#c9a070', band: '#39404c' }, { seed: 4, name: 'HILLCREST', c: '#f4e6c8', band: '#2f8a57' }],
    draw(p) {
      const c = p.c || '#9fd0c8', bd = p.band || '#2f7f86', nm = p.name || 'MAPLE BAY', cx = 2, cy = 2, steel = '#6f757d', LZ = 6.4;
      box(.2, .2, 0, 3.6, 3.6, .15, '#a8a49c');
      const legs = [[.6, .6], [3.4, .6], [.6, 3.4], [3.4, 3.4]];
      const leg = ([x, y]) => { const tx = cx + (x - cx) * .78, ty = cy + (y - cy) * .78; for (const o of [0, .07, .14]) lw([x + o, y, .15], [tx + o, ty, LZ], o > .1 ? dk(steel, .3) : steel); return [tx, ty]; };
      const brace = (a, b, sh) => { for (let k = 0; k < 3; k++) { const z0 = .3 + k * 2, z1 = z0 + 2, t0 = z0 / LZ, t1 = z1 / LZ, f = (q, t) => [q[0] + (cx - q[0]) * .22 * t, q[1] + (cy - q[1]) * .22 * t]; const a0 = f(a, t0), a1 = f(a, t1), b0 = f(b, t0), b1 = f(b, t1); lw([a0[0], a0[1], z0], [b1[0], b1[1], z1], sh); lw([b0[0], b0[1], z0], [a1[0], a1[1], z1], sh); lw([a1[0], a1[1], z1], [b1[0], b1[1], z1], sh); } };
      brace(legs[0], legs[1], dk(steel, .4)); brace(legs[0], legs[2], dk(steel, .4)); leg(legs[0]);
      cyl(cx, cy, .15, .28, LZ, '#8d939b', { ol: false });
      leg(legs[1]); leg(legs[2]); brace(legs[1], legs[3], dk(steel, .15)); brace(legs[2], legs[3], lt(steel, .2)); leg(legs[3]);
      // ladder
      lw([3.1, 3.4, .15], [2.95, 3.25, LZ + .2], '#c9ccd2'); lw([3.25, 3.4, .15], [3.1, 3.25, LZ + .2], '#c9ccd2');
      // catwalk + tank
      disc(cx, cy, LZ, 2.35, '#5d646e'); cyl(cx, cy, LZ, 2.2, .12, steel, { ol: false });
      cyl(cx, cy, LZ + .15, 2.0, 3.2, c, { l: dk(c, .08), r: dk(c, .3) });
      const s0 = PW(cx, cy, LZ + .15), rx = 2 * 16 * 1.414;
      const ring = (z, col, th = 1) => { const s = PW(cx, cy, z); for (let X = Math.ceil(s[0] - rx); X <= Math.floor(s[0] + rx); X++) { const k = (X - s[0]) / rx, e = rx / 2 * Math.sqrt(Math.max(0, 1 - k * k)); for (let t = 0; t < th; t++) px(X, Math.round(s[1] + e) + t, C(k > .15 ? dk(col, .2) : col)); } };
      ring(LZ + 2.9, bd, 4); ring(LZ + .75, bd, 3); ring(LZ + 2.0, dk(c, .25)); ring(LZ + 1.2, dk(c, .25));
      { const s = PW(cx - .55, cy + .55, LZ + 1.15); const W = nm.length * 4 - 1; const X0 = Math.round(s[0] - W / 2), Y0 = Math.round(s[1]) + 16; const tmp = PW(cx, cy, LZ + 2.25); txtS(nm, cx - 1.0, cy + 1.0, LZ + 2.7, dk(bd, .25)); }
      // railing
      { const s = PW(cx, cy, LZ + .6), rr = 2.3 * 16 * 1.414; for (let X = Math.ceil(s[0] - rr); X <= Math.floor(s[0] + rr); X++) { const k = (X - s[0]) / rr, e = rr / 2 * Math.sqrt(Math.max(0, 1 - k * k)); px(X, Math.round(s[1] + e), C('#c9ccd2')); if ((X & 7) === 0) for (let t = 1; t < 9; t++) px(X, Math.round(s[1] + e) + t, C('#aab2ba')); } }
      // roof
      disc(cx, cy, LZ + 3.35, 2.15, dk(bd, .2));
      cone(cx, cy, LZ + 3.35, 2.15, 1.3, winter() ? SNOW2 : bd);
      box(cx - .12, cy - .12, LZ + 4.6, .24, .24, .3, steel, { ol: false }); lw([cx, cy, LZ + 4.9], [cx, cy, LZ + 5.7], '#8d939b'); beacon(cx, cy, LZ + 5.7, '#ff5a4a', true);
    },
  },
  /* ------------------------------------------------------------ public restroom pavilion */
  {
    id: 'bld.civic.restroom', kind: 'building', tags: ['civic', 'park', 'restroom', 'utility'],
    size: [5, 3, 2.9], vb: [-.6, -.6, 0, 5.7, 4.2, 4],
    door: { side: 'y', at: 1.2 }, light: { x: 2.5, y: 3.8, z: 0, r: 3 },
    variants: [{ seed: 1 }, { seed: 2, wall: '#e8d9b8', accent: '#c8572f', roof: '#6b5a52' }, { seed: 3, wall: '#d8dce0', accent: '#2f6fd0', roof: '#39404c' }],
    draw(p) {
      const wall = p.wall || '#eef0e8', ac = p.accent || '#2a9d8f', roof = p.roof || '#5a6f6a', H = 2.5;
      box(0, 0, 0, 5, 3, H, wall);
      const tile = c => (u, v) => (u % 5 === 0 || v % 5 === 0) ? dk(c, .15) : c;
      qy(0, 5, 3, 0, 1.3, tile(dk(ac, .18))); qx(5, 0, 3, 0, 1.3, tile(dk(ac, .36))); qy(0, 5, 3, 1.3, 1.42, '#ffffff'); qx(5, 0, 3, 1.3, 1.42, '#d8dce0');
      // high slot windows
      wins('y', .3, 4.7, 3, 1.85, 2.25, { ww: .7, gap: .3, on: true, frame: dk(ac, .4), glowc: ['#f4fff8', '#d8f4e8'] });
      wins('x', .4, 2.6, 5, 1.85, 2.25, { ww: .7, gap: .3, on: true, frame: dk(ac, .4), glowc: ['#f4fff8', '#d8f4e8'] });
      // doors with pictograms
      door('y', 1.2, 3, { c: '#e2a84a', glass: false, frame: '#ffffff', w: .85 }); door('y', 3.8, 3, { c: '#4f8fd0', glass: false, frame: '#ffffff', w: .85 });
      icon('y', PERSON2, 1.2 - .12, 3.01, 1.35, { p: '#ffffff' }); icon('y', PERSON, 3.8 - .12, 3.01, 1.35, { p: '#ffffff' });
      // privacy screen between the doors + sign
      box(2.3, 3, 0, .4, .9, 1.9, wall, { l: tile(dk(ac, .18)), r: tile(dk(ac, .36)) });
      lit(() => { qy(2.05, 2.95, 3.91, 1.25, 1.75, '#ffffff'); txt('y', 'WC', 2.28, 3.92, 1.68, ac); });
      lamp('y', .35, 3, 1.75); lamp('y', 4.65, 3, 1.75);
      // floating mono-pitch roof on a clerestory gap
      box(.1, .1, H, 4.8, 2.8, .12, dk(wall, .5), { ol: false });
      fq([[-.4, -.4, H + .65], [5.4, -.4, H + .65], [5.4, 3.7, H + .15], [-.4, 3.7, H + .15]], winter() ? SNOW : roof);
      qy(-.4, 5.4, 3.7, H + .0, H + .15, dk(roof, .3)); fq([[5.4, -.4, H + .65], [5.4, 3.7, H + .15], [5.4, 3.7, H], [5.4, -.4, H + .5]], dk(roof, .5));
      lw([-.4, 3.7, H], [5.4, 3.7, H], dk(roof, .7)); lw([-.4, -.4, H + .65], [5.4, -.4, H + .65], dk(roof, .7)); lw([-.4, -.4, H + .65], [-.4, 3.7, H + .15], dk(roof, .7)); lw([5.4, 3.7, H], [5.4, -.4, H + .5], dk(roof, .7)); lw([-.4, 3.7, H + .15], [5.4, 3.7, H + .15], lt(roof, .3));
      glow(() => qy(.3, 4.7, 3.7, H - .06, H, '#fff3c8'));
    },
  },
  /* ------------------------------------------------------------ park cafe pavilion */
  {
    id: 'bld.civic.parkcafe', kind: 'building', tags: ['civic', 'park', 'cafe', 'food', 'enterable'],
    size: [8, 7, 3.2], vb: [-1, -1, 0, 9, 8, 5.6],
    door: { side: 'y', at: 2 }, light: { x: 4, y: 7.4, z: 0, r: 5 },
    variants: [{ seed: 3, name: 'PARK CAFE' }, { seed: 12, name: 'POND HOUSE', roof: '#8a4b3a', accent: '#2f6f8a' }, { seed: 25, name: 'TEA GARDEN', roof: '#39404c', accent: '#c8423a' }],
    draw(p) {
      const r = rng(p.seed || 1), roof = p.roof || '#4f8a6f', ac = p.accent || '#e8843a', wood = '#a87850', cream = '#fff6e0', nm = p.name || 'PARK CAFE', H = 2.8, D = 4.8;
      // deck
      box(0, 0, 0, 8, 7, .2, wood, { t: PAT.fboards(winter() ? mix(wood, SNOW, .5) : lt(wood, .15), .4) });
      // glass pavilion
      box(.4, .4, .2, 7.2, D - .4, H - .2, cream);
      qy(.4, 7.6, D, .2, .7, wood, dk(wood, .1)); qx(7.6, .4, D, .2, .7, dk(wood, .2));
      // counter + shelves seen through glass
      const inn = () => { qy(3.4, 7.2, D, .75, 1.3, '#8a6f5a'); qy(3.4, 7.2, D, 1.3, 1.38, '#d9c9a8'); for (let x = 3.6; x < 7; x += .5) qy(x, x + .3, D, 1.45, 1.75, pick(r, ['#e2574c', '#f2c230', '#fff6e0', '#7cc27a', '#c9ccd2'])); qy(3.6, 5.2, D, 2.0, 2.4, '#2a2a33'); for (let k = 0; k < 3; k++) lw([3.7, D, 2.3 - k * .1], [5.0 - k * .3, D, 2.3 - k * .1], '#e8e2d4'); };
      wins('y', 3.2, 7.4, D, .75, H - .3, { ww: 1.05 - .001, gap: 0, n: 4, on: true, frame: '#5a4030', glowc: ['#ffe2a0', '#ffc27a'] }); inn(); glow(inn);
      for (let x = 3.2; x <= 7.41; x += 1.05) lw([x, D, .75], [x, D, H - .3], '#5a4030');
      wins('x', .7, D - .3, 7.6, .75, H - .3, { ww: 1.0, gap: 0, n: 4, on: true, frame: '#5a4030', glowc: ['#f4c870', '#e8b860'] });
      door('y', 2, D, { z: .2, c: ac, double: true, w: 1.5, h: 1.8, frame: cream, full: true });
      win('y', .6, 1.1, D, .75, H - .3, { on: true, frame: '#5a4030' });
      // terrace: tables + parasols (benches in winter)
      const T = [[1.0, 5.9], [5.2, 6.0], [3.1, 5.7]].sort((a, b) => a[0] + a[1] - b[0] - b[1]);
      // big overhanging roof
      box(.2, .2, H, 7.6, D, .15, '#5a4030', { ol: false });
      hip(0, 0, H + .15, 8, D + .4, 1.5, roof, { over: .6, inset: .3 });
      if (winter()) { qz(1.9, 6.1, 1.9, D - 1.5, H + 1.66, SNOW); fq([[-.4, D + .9, H + .2], [8.4, D + .9, H + .2], [6.2, D - 1.4, H + 1.6], [1.8, D - 1.4, H + 1.6]], SNOW, 'glass'); }
      // roof lantern + sign
      box(3.2, 1.8, H + 1.6, 1.6, 1.2, .5, cream); qy(3.3, 4.7, 3.0, H + 1.7, H + 2.0, '#9fcbe0'); glow(() => qy(3.3, 4.7, 3.0, H + 1.7, H + 2.0, '#ffe2a0')); hip(3.1, 1.7, H + 2.1, 1.8, 1.4, .5, roof, { over: 0 });
      sign('y', nm, 4 - txtW(nm) / 2 - .3, 4 + txtW(nm) / 2 + .3, D + 1.02, H - .35, H + .15, '#2a2233', '#ffd166', { lit: true });
      // string lights along the eave
      bulbs('y', -.5, 8.5, D + 1.0, H - .42, { step: .4, cols: ['#fff2a8', '#ff8fb0', '#7df9ff', '#ffd166'] }); bulbs('x', -.5, D + .9, 8.6, H - .42, { step: .4, cols: ['#fff2a8', '#ff8fb0', '#7df9ff', '#ffd166'] });
      for (const [x, y] of T) {
        cyl(x, y, .2, .32, .55, '#e8e2d4', { ol: false }); box(x - .55, y - .12, .2, .24, .24, .35, ac, { ol: false }); box(x + .32, y - .12, .2, .24, .24, .35, ac, { ol: false });
        if (ENV.season < 2) { lw([x, y, .75], [x, y, 2.3], '#e8e2d4'); const cs = [ac, cream]; for (let k = 0; k < 6; k++) { const a0 = k * Math.PI / 3, a1 = a0 + Math.PI / 3; fq([[x, y, 2.45], [x + Math.cos(a0) * .95, y + Math.sin(a0) * .95, 2.0], [x + Math.cos(a1) * .95, y + Math.sin(a1) * .95, 2.0]], k % 2 ? cs[0] : cs[1]); } const q = PW(x, y, 2.45); px(q[0], q[1] - 1, C('#5a4030')); }
        else if (ENV.season === 2) ball(x, y, .82, .1, '#e8843a', { ol: false });
      }
      // planters at the deck corners
      planter(6.6, 6.2, .2, 1.2, .5, .2, '#8a6f5a'); topiary(.5, 6.5, .2, .5);
      // menu easel
      box(2.9, 6.5, .2, .1, .3, .8, '#5a4030', { ol: false }); qy(2.7, 3.2, 6.8, .4, 1.1, '#2a2a33'); lw([2.8, 6.8, .95], [3.1, 6.8, .95], '#ffd166'); lw([2.8, 6.8, .75], [3.05, 6.8, .75], '#e8e2d4'); lw([2.8, 6.8, .6], [3.1, 6.8, .6], '#e8e2d4');
    },
  },
  /* ------------------------------------------------------------ botanical conservatory */
  {
    id: 'bld.civic.conservatory', kind: 'building', tags: ['civic', 'park', 'conservatory', 'greenhouse', 'garden', 'landmark'],
    size: [14, 8, 6.5], vb: [-.4, -.4, 0, 14.6, 8.9, 10.4],
    door: { side: 'y', at: 7 }, light: { x: 7, y: 9, z: 0, r: 5 },
    variants: [{ seed: 6, name: 'BOTANICAL GARDEN' }, { seed: 17, name: 'PALM HOUSE', frame: '#2f6f5a', base: '#b5553f' }, { seed: 33, name: 'WINTER GARDEN', frame: '#39404c', base: '#c9cdd4' }],
    draw(p) {
      const r = rng(p.seed || 1), fr = p.frame || '#f4f8f4', base = p.base || '#d9cfbb', nm = p.name || 'BOTANICAL GARDEN', g1 = '#a8dcec', g2 = '#c8ecf6', gn = ['#e8ffc0', '#c8f09a'];
      const glassY = (x0, x1, y, z0, z1) => { qy(x0, x1, y, z0, z1, g2, 'glass'); glow(() => qy(x0, x1, y, z0, z1, gn[0], 'glass')); };
      const glassX = (x, y0, y1, z0, z1) => { qx(x, y0, y1, z0, z1, g1, 'glass'); glow(() => qx(x, y0, y1, z0, z1, gn[1], 'glass')); };
      const wing = (x0, x1) => {
        const y0 = 1.2, y1 = 6.8, H = 3.0, rh = 1.4, m = (y0 + y1) / 2;
        box(x0, y0, 0, x1 - x0, y1 - y0, .6, base, wallPat('brick', base));
        qz(x0 + .1, x1 - .1, y0 + .1, y1 - .1, .61, '#5a4a3a'); jungle(x0 + .5, x1 - .5, y0 + .5, y1 - .6, .6, r, Math.round((x1 - x0) * 3));
        // back slope + back wall frame hints
        fq([[x0, y0, H], [x1, y0, H], [x1, m, H + rh], [x0, m, H + rh]], g1, 'glass');
        glassX(x1, y0, y1, .6, H); fq([[x1, y0, H], [x1, y1, H], [x1, m, H + rh]], g1, 'glass'); glow(() => fq([[x1, y0, H], [x1, y1, H], [x1, m, H + rh]], gn[1], 'glass'));
        glassY(x0, x1, y1, .6, H);
        const sl = [[x0, y1, H], [x1, y1, H], [x1, m, H + rh], [x0, m, H + rh]]; fq(sl, winter() ? SNOW : g2, 'glass'); glow(() => fq(sl, gn[0], 'glass'));
        for (let x = x0; x <= x1 + .01; x += (x1 - x0) / Math.round((x1 - x0) / .9)) { lw([x, y1, .6], [x, y1, H], fr); lw([x, y1, H], [x, m, H + rh], fr); }
        for (let y = y0; y <= y1 + .01; y += (y1 - y0) / 6) lw([x1, y, .6], [x1, y, H + rh * (1 - Math.abs(y - m) / (m - y0))], dk(fr, .2));
        lw([x0, y1, H], [x1, y1, H], fr); lw([x0, y1, 1.8], [x1, y1, 1.8], fr); lw([x0, m, H + rh], [x1, m, H + rh], fr); lw([x1, y0, H], [x1, m, H + rh], dk(fr, .2)); lw([x1, y1, H], [x1, m, H + rh], dk(fr, .2)); lw([x1, y0, H], [x1, y1, H], dk(fr, .2)); lw([x1, y0, 1.8], [x1, y1, 1.8], dk(fr, .2));
        for (let x = x0 + .5; x < x1; x += 1.4) { const q = PW(x, m, H + rh); px(q[0], q[1] - 1, C(fr)); px(q[0], q[1] - 2, C(fr)); }
      };
      wing(0, 4.6);
      // central palm house
      const cx0 = 4.4, cx1 = 9.6, cy1 = 8, CH = 4.6, rh = 2.2, cm = 7;
      box(cx0, 0, 0, cx1 - cx0, cy1, .6, base, wallPat('brick', base));
      qz(cx0 + .1, cx1 - .1, .1, cy1 - .1, .61, '#5a4a3a'); jungle(cx0 + .6, cx1 - .6, .6, cy1 - 1.2, .6, r, 16);
      for (const [x, y] of [[5.6, 3], [8.2, 4.5], [6.8, 6]]) { lw([x, y, .6], [x + .1, y, 3.6], '#7a5a3a'); lw([x + .06, y, .6], [x + .16, y, 3.6], '#5a4030'); for (let a = 0; a < 7; a++) { const ex = x + Math.cos(a * .9) * 1.3, ey = y + Math.sin(a * .9) * 1.3; lw([x + .1, y, 3.6], [(x + ex) / 2, (y + ey) / 2, 4.0], '#3f9a55'); lw([(x + ex) / 2, (y + ey) / 2, 4.0], [ex, ey, 3.3], '#2f8a4a'); } }
      fq([[cx0, 0, CH], [cx0, cy1, CH], [cm, cy1, CH + rh], [cm, 0, CH + rh]], g1, 'glass');
      glassX(cx1, 0, cy1, .6, CH); glassY(cx0, cx1, cy1, .6, CH);
      const gp = [[cx0, cy1, CH], [cx1, cy1, CH], [cm, cy1, CH + rh]]; fq(gp, g2, 'glass'); glow(() => fq(gp, gn[0], 'glass'));
      const rs = [[cx1, 0, CH], [cx1, cy1, CH], [cm, cy1, CH + rh], [cm, 0, CH + rh]]; fq(rs, winter() ? SNOW2 : g1, 'glass'); glow(() => fq(rs, gn[1], 'glass'));
      for (let x = cx0; x <= cx1 + .01; x += (cx1 - cx0) / 6) { lw([x, cy1, .6], [x, cy1, CH + rh * (1 - Math.abs(x - cm) / (cm - cx0))], fr); }
      for (let y = 0; y <= cy1 + .01; y += cy1 / 8) { lw([cx1, y, .6], [cx1, y, CH], dk(fr, .2)); lw([cx1, y, CH], [cm, y, CH + rh], dk(fr, .12)); }
      for (const z of [2.2, 3.4, CH]) { lw([cx0, cy1, z], [cx1, cy1, z], fr); lw([cx1, 0, z], [cx1, cy1, z], dk(fr, .2)); }
      lw([cx0, cy1, CH], [cm, cy1, CH + rh], fr); lw([cx1, cy1, CH], [cm, cy1, CH + rh], fr); lw([cm, 0, CH + rh], [cm, cy1, CH + rh], fr);
      for (let k = 1; k < 4; k++) lw([cm, cy1, CH], [cx0 + (cx1 - cx0) * k / 4, cy1, CH + rh * (1 - Math.abs(cx0 + (cx1 - cx0) * k / 4 - cm) / (cm - cx0))], fr);
      // lantern dome on the ridge
      cyl(cm, 4, CH + rh - .1, .9, .6, fr, { ol: false }); dome(cm, 4, CH + rh + .5, .9, p.frame ? lt(fr, .3) : '#7fc8b8'); lw([cm, 4, CH + rh + 1.45], [cm, 4, CH + rh + 2.2], '#f2d98a');
      // entrance
      qy(cm - 1.2, cm + 1.2, cy1 + .01, 0, 2.5, base); door('y', cm, cy1 + .01, { c: fr === '#f4f8f4' ? '#2f6f5a' : fr, double: true, w: 1.6, h: 1.9, frame: '#ffffff', full: true, transom: true });
      sign('y', nm, cm - txtW(nm) / 2 - .2, cm + txtW(nm) / 2 + .2, cy1 + .02, 2.6, 3.1, '#2f6f5a', '#fff8e8', { lit: true });
      wing(9.4, 14);
      topiary(cm - 1.7, cy1 + .35, 0, .2); topiary(cm + 1.7, cy1 + .35, 0, .6);
    },
  },
  /* ------------------------------------------------------------ observatory */
  {
    id: 'bld.civic.observatory', kind: 'building', tags: ['civic', 'observatory', 'science', 'landmark', 'hillcrest'],
    size: [8, 7, 4], vb: [-.5, -.5, 0, 8.6, 7.8, 8.6],
    door: { side: 'y', at: 6 }, light: { x: 6, y: 7.8, z: 0, r: 4 },
    variants: [{ seed: 2, name: 'OBSERVATORY' }, { seed: 11, name: 'OBSERVATORY', wall: '#e9dcc0', dome: '#6fa89a' }, { seed: 23, name: 'STAR HOUSE', wall: '#c9cdd6', dome: '#d9a441' }],
    draw(p) {
      const r = rng(p.seed || 1), wall = p.wall || '#f1eee6', dc = p.dome || '#c2ccd6', dark = '#39404c', nm = p.name || 'OBSERVATORY', cx = 2.9, cy = 3.2, R = 2.7, DH = 3.8;
      // drum
      cyl(cx, cy, 0, R, DH, wall, { l: dk(wall, .1), r: dk(wall, .3) });
      const A = (a, rr = R + .02) => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
      const arcQ = (a0, a1, z0, z1, c, c2) => { const n = 4; for (let i = 0; i < n; i++) { const p0 = A(a0 + (a1 - a0) * i / n), p1 = A(a0 + (a1 - a0) * (i + 1) / n); fq([[p0[0], p0[1], z0], [p1[0], p1[1], z0], [p1[0], p1[1], z1], [p0[0], p0[1], z1]], c, c2); } };
      arcQ(-.6, 2.4, 0, .5, PAT ? dk(wall, .4) : wall); arcQ(-.6, 2.4, DH - .5, DH - .3, dk(dc, .3));
      for (const a of [1.2, 1.75, 2.25]) { arcQ(a - .1, a + .1, 1.6, 2.7, '#7fb6d0', '#9fcbe0'); if (r() < .7) glow(() => arcQ(a - .1, a + .1, 1.6, 2.7, '#ffd98a', '#f4c870')); }
      cyl(cx, cy, DH, R + .15, .25, lt(wall, .2));
      // dome with shutter slit
      dome(cx, cy, DH + .25, R - .1, dc, { k: 1.0 });
      const k = 1.0, rr = R - .08, ph = 1.9, dp = .16, S = (th, f) => [cx + Math.cos(f) * rr * Math.cos(th), cy + Math.sin(f) * rr * Math.cos(th), DH + .25 + rr * k * Math.sin(th)];
      for (let i = 0; i < 9; i++) { const t0 = .25 + i * .15, t1 = t0 + .15; fq([S(t0, ph - dp), S(t0, ph + dp), S(t1, ph + dp), S(t1, ph - dp)], '#1f2433'); glow(() => fq([S(t0, ph - dp * .6), S(t0, ph + dp * .6), S(t1, ph + dp * .6), S(t1, ph - dp * .6)], '#7a2f3a')); }
      for (let i = 0; i < 9; i++) { const t0 = .25 + i * .15, t1 = t0 + .15; lw(S(t0, ph - dp - .03), S(t1, ph - dp - .03), lt(dc, .4)); lw(S(t0, ph + dp + .03), S(t1, ph + dp + .03), dk(dc, .4)); }
      { const q = S(.75, ph); const q2 = PW(q[0], q[1], q[2]); ellipse(q2[0], q2[1], 3, 3, '#aab2ba'); px(q2[0], q2[1], C('#7fd0ff')); }
      // annex
      const ax = 3.8, ay = 2.4, aw = 4.2, ad = 4.6, AH = 2.9;
      box(ax, ay, 0, aw, ad, AH, wall, wallPat('stucco', wall));
      qy(ax, 8, 7, 0, .5, dk(wall, .4)); qx(8, ay, 7, 0, .5, dk(wall, .52));
      qy(ax, 8, 7, 2.2, 2.4, dk(dc, .25)); qx(8, ay, 7, 2.2, 2.4, dk(dc, .4));
      door('y', 6, 7, { c: '#2f4f7a', frame: lt(wall, .4), transom: true }); lamp('y', 5.2, 7, 1.85);
      win('y', 4.2, 4.9, 7, .8, 1.7, { on: r() < .8, mullion: 'cross', trim: lt(wall, .4), sill: true }); win('y', 6.9, 7.6, 7, .8, 1.7, { on: true, mullion: 'cross', trim: lt(wall, .4), sill: true });
      wins('x', ay + .5, 6.5, 8, .8, 1.7, { ww: .8, gap: .8, r, p: .7, mullion: 'cross', trim: dk(lt(wall, .4), .2), sill: true });
      sign('y', nm, 4.0, 7.8, 7.01, 2.42, 2.86, null, dark);
      // star chart plaque
      qx(8.01, 2.9, 3.9, 1.0, 1.8, '#1f2a55'); lit(() => { for (const [a, b] of [[3.1, 1.6], [3.4, 1.3], [3.6, 1.65], [3.75, 1.2], [3.2, 1.15]]) { const q = PW(8.02, a, b); px(q[0], q[1], C('#fff2a8')); } });
      // roof deck with small telescope + rail
      const f = flatRoof(ax, ay, AH, aw, ad, wall, { cap: lt(wall, .3), roof: '#a8a49c', ph: .2 });
      box(6.2, 4.6, AH, .2, .2, .7, dark, { ol: false }); lw([5.9, 4.9, AH + .6], [6.7, 4.5, AH + 1.3], '#e4e8ec'); lw([5.9, 4.95, AH + .66], [6.7, 4.55, AH + 1.36], '#aab2ba'); lw([5.95, 4.9, AH + .56], [6.75, 4.5, AH + 1.26], '#6f757d');
      for (let x = ax + .1; x <= 8.01; x += .65) lw([x, 6.95, AH + .2], [x, 6.95, AH + .8], '#8d939b'); lw([ax, 6.95, AH + .8], [8, 6.95, AH + .8], '#c9ccd2'); for (let y = ay + .2; y <= 7; y += .65) lw([7.95, y, AH + .2], [7.95, y, AH + .8], '#6f757d'); lw([7.95, ay, AH + .8], [7.95, 7, AH + .8], '#aab2ba');
      // weather mast
      lw([7.5, 3, AH + .2], [7.5, 3, AH + 2.2], '#8d939b'); lw([7.2, 3, AH + 2.0], [7.8, 3, AH + 2.0], '#8d939b'); { const q = PW(7.2, 3, AH + 2.0); px(q[0], q[1] - 1, C('#e4e8ec')); const q2 = PW(7.8, 3, AH + 2.0); px(q2[0], q2[1] - 1, C('#e4e8ec')); } beacon(7.5, 3, AH + 2.2);
      stairs(5.4, 6.6, 7, 1, lt(wall, .1), { dep: .3, rise: .1 }); bush(4.5, 7.3, 0, .35, .4); bush(7.3, 7.3, 0, .35, .7);
    },
  },
];
