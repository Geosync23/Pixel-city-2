// Central Station PLATFORMS kit (room 'central_station:platforms', src/scenes/rooms/station_platforms.js). Ids furn.cplat.*:
//   trackbed {len, doors:[y...]}  FLAT: the sunken track (pit drawn at z -0.5: brick side, ballast, sleepers, rails) + the near platform's coping,
//                                 tactile strip, yellow line and door marks. Lies along y; local x 0..3 is the pit, x 3..3.8 the platform edge.
//   mouth {n, line, color, h}     wall bay 3 wide: the dark tunnel mouth a track comes out of, with the enamel platform sign above
//   office {h}                    wall bay 6.5 wide: the stationmaster's office (door, lit window, LOST PROPERTY hatch)  tags office, lost_property
//   lunette {w, sky}              the glazed fan of the end screen above the back wall (place at z = wall height)      sky: 0 day | 1 dusk | 2 night
//   vault {len, off, sky}         the far half of the train shed's glass vault, springing from the left wall (place at z = wall height)
//   column {h, n}                 cast-iron column with brackets, two lamp globes and a platform roundel (light pool)
//   fence {len, posters:[[at, kind]]}   brass-railed fence with framed posters (kind lighthouse | skydeck | coffee | beach | orpheum | zoo)
//   pa (announcer_booth), dispatch (platform_edge), helppoint (station_info), validator (ticket_gate): the Station Agent's fixtures
//   stairwell                     the stairs down to the hall (balustrade, treads going down toward the camera)
//   wayout                        hanging WAY OUT sign over the stair head
//   shelter                       glazed waiting shelter with a bench (3 seats)
//   trolley {kind: row | bags | mail}   luggage trolleys
//   bigboard {w}                  wall frame of the live departures board (the rows are drawn by the room)      indicator {n, color}  hanging platform indicator frame
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, cyl, ball, signY, textY, spx, hash2, rng, PAT, PW, px, C } from '../../engine/raster.js';

const STONE = '#e6dfd0', STEEL = '#3f5a5a', BRASS = '#c9a24a', NAVY = '#27408a', INK = '#16141c', YEL = '#f2c230', GREEN = '#2f5a4a';
const SKY = [['#c9e9f5', '#a9d6ee', '#8cc4e6'], ['#f8d2a0', '#eea58c', '#9a82b8'], ['#2c3160', '#23284e', '#1a1d3c']];
const T = ['station', 'central', 'platforms'];
const num = (v, d) => (isFinite(+v) && v !== null && v !== undefined && v !== '' ? +v : d);

function bay(w, h) {
  box(0, 0, 0, w, .3, h, STONE, { l: PAT.stone(STONE), ol: false });
  qy(0, w, .3, 0, .5, dk(STONE, .14)); lw([0, .3, .5], [w, .3, .5], dk(STONE, .35)); qy(0, w, .3, h - .22, h, lt(STONE, .3)); lw([0, .3, h - .22], [w, .3, h - .22], dk(STONE, .3));
}

/* ---------- the track ---------- */
const trackbed = {
  id: 'furn.cplat.trackbed', kind: 'furniture', tags: T, flat: true, solid: false, size: p => [3, num(p.len, 26), .02], vb: p => [-.3, -.6, -.55, 4, num(p.len, 26) + .3, .05],
  variants: [{ len: 12, doors: [3, 8] }],
  draw(p) {
    const L = num(p.len, 26), Z = -.5, bal = (x, y) => { const k = hash2(Math.floor(x * 16), Math.floor(y * 16), 3); return k < .18 ? '#4f4a47' : k > .82 ? '#77716a' : '#625d58'; };
    qx(0, -.5, L, Z, 0, PAT.brick('#75615a', '#4a3d3a')); lw([0, -.5, Z], [0, L, Z], '#2f2a2c');
    qz(0, 2.5, -.5, L - .5, Z, bal);
    for (let y = -.3; y < L - .7; y += .62) { qz(.42, 2.5, y, y + .22, Z + .02, '#5a4638'); lw([.42, y + .22, Z + .02], [2.5, y + .22, Z + .02], '#3f3027'); }
    for (const xr of [.8, 2.2]) { qz(xr - .05, xr + .05, -.5, L - .5, Z + .09, '#8d949c'); lw([xr + .05, -.5, Z + .09], [xr + .05, L - .5, Z + .09], '#e3e8ec'); lw([xr - .06, -.5, Z + .03], [xr - .06, L - .5, Z + .03], '#3a3432'); }
    for (let y = 1.5; y < L - 2; y += 5.2) { qz(1.3, 1.7, y, y + .5, Z + .03, '#4a4640'); spx(1.5, y + .25, Z + .05, 0, 0, YEL); }   // track magnets
    qz(1.0, 1.9, L - 3.4, L - 1.9, Z + .01, '#4c4744', bal(0, 0));                                                                // oil shadow by the buffers
    /* far side: the coping of the platform (or wall footing) beyond */
    qz(-.16, 0, -.5, L, .01, '#cfc8b8'); lw([0, -.5, .01], [0, L, .01], '#8a7f72');
    /* near side: coping stone, tactile strip, yellow line, door marks */
    qz(3, 3.14, 0, L, .01, '#efe9da'); lw([3, 0, .01], [3, L, .01], '#8a7f72');
    qz(3.14, 3.54, 0, L, .01, (x, y) => ((Math.floor(x * 16) + Math.floor(y * 16)) & 1) && (Math.floor(x * 8) & 1) ? '#b98f10' : '#e3b521');
    lw([3.54, 0, .01], [3.54, L, .01], '#a88410');
    qz(3.66, 3.8, 0, L, .01, YEL);
    for (const d of p.doors || []) { qz(3.14, 3.54, d - .66, d + .66, .01, '#fffbe8', '#e3b521'); for (const s of [-.66, .66]) lw([3.14, d + s, .01], [3.8, d + s, .01], '#2a2733'); qz(3.66, 3.8, d - .66, d + .66, .01, '#fffbe8'); }
    /* the buffer end: a hatched edge on the concourse */
    qz(0, 3, L, L + .16, .01, (x, y) => (Math.floor((x + y) * 5) & 1) ? '#2a2733' : YEL); lw([0, L, .01], [3, L, .01], '#8a7f72');
  },
};

/* ---------- back wall bays ---------- */
const mouth = {
  id: 'furn.cplat.mouth', kind: 'furniture', tags: T, wall: true, mount: 0, solid: false, size: p => [3, .3, num(p.h, 6)], vb: p => [0, 0, 0, 3, .5, num(p.h, 6) + .1],
  variants: [{ n: 1, line: 'LOOP A', color: '#d2412f' }, { n: 2, line: 'LOOP B', color: '#2f8f96' }],
  draw(p) {
    const h = num(p.h, 6), Y = .3, col = p.color || '#d2412f'; bay(3, h);
    /* the opening: 2.5 wide, springing at 2.2, crown at 3.45 */
    qy(0, 3, Y, 0, 3.7, (u, v) => {
      const cx = 24, r = 20, sp = 35, du = u + .5 - cx; let d;                      // d = distance inside the arch outline (px); < 0 outside
      if (v <= sp) d = r - Math.abs(du); else d = r - Math.hypot(du, v - sp);
      if (d < -3.2) return null;
      if (d < 0) { if (v <= sp) return d > -3.2 ? (Math.floor(v / 5) & 1 ? '#cfc6b4' : '#b9ae9a') : null; const a = Math.atan2(v - sp, du); return (Math.floor(a * 5.5 + 20) & 1) ? '#cfc6b4' : '#b3a893'; }
      if (d < 1.2) return '#3a3440';
      if (v < 2) return '#3d3836';
      if (Math.abs(d - 6) < .6 || Math.abs(d - 10.5) < .6 || Math.abs(d - 14) < .5) return '#2b2732';        // the lining rings going back
      if (v < 9 && (Math.abs(du + 6 - v * .35) < .7 || Math.abs(du - 6 + v * .35) < .7)) return '#6f7780';    // rails running in
      return d > 14 ? '#100e15' : INK;
    });
    qy(1.36, 1.64, Y, 3.5, 3.86, BRASS); lw([1.36, Y, 3.5], [1.64, Y, 3.5], dk(BRASS, .4));                 // keystone
    lit(() => { spx(1.02, Y, 1.5, 0, 0, '#ff3b3b'); spx(1.02, Y, 1.5, 1, 0, '#ff3b3b'); spx(1.98, Y, 1.02, 0, 0, '#8fd0ff'); });   // lamps far down the tunnel
    signY(String(p.line || 'LOOP A'), .7, 2.3, Y, 3.98, 4.3, col, '#ffffff', { lit: true });
    signY('PLATFORM ' + (p.n || 1), .22, 2.78, Y, 4.42, 4.86, NAVY, '#ffffff', { lit: true });
    lw([.22, Y, 4.86], [2.78, Y, 4.86], BRASS); lw([.22, Y, 4.42], [2.78, Y, 4.42], BRASS);
    for (const x of [.1, 2.72]) { qy(x, x + .18, Y, 2.5, 2.62, BRASS); lit(() => qy(x + .03, x + .15, Y, 2.62, 2.9, '#fff1c0')); }
    qy(.9, 2.1, Y, 5.05, 5.5, dk(STONE, .08)); lw([.9, Y, 5.05], [2.1, Y, 5.05], dk(STONE, .35)); textY('1924', 1.25, Y, 5.42, dk(STONE, .45));
  },
};

const office = {
  id: 'furn.cplat.office', kind: 'furniture', tags: T.concat('sm_office', 'lost_property'), wall: true, mount: 0, solid: false, size: p => [6.5, .3, num(p.h, 6)], vb: p => [0, 0, 0, 6.5, .6, num(p.h, 6) + .1],
  use: { x: 5.35, y: 1.0 }, variants: [{}],
  draw(p) {
    const h = num(p.h, 6), Y = .3; bay(6.5, h);
    /* the door */
    qy(.6, 2.0, Y, 0, 2.75, dk(STONE, .2)); qy(.7, 1.9, Y, 0, 2.2, GREEN);
    for (const [a, b, z0, z1] of [[.8, 1.25, .2, .95], [1.35, 1.8, .2, .95], [.8, 1.25, 1.1, 2.05], [1.35, 1.8, 1.1, 2.05]]) { qy(a, b, Y, z0, z1, lt(GREEN, .12)); lw([a, Y, z0], [b, Y, z0], dk(GREEN, .4)); lw([a, Y, z0], [a, Y, z1], dk(GREEN, .4)); }
    spx(1.82, Y, 1.02, 0, 0, BRASS); spx(1.82, Y, 1.02, 0, 1, BRASS); qy(1.05, 1.55, Y, 1.5, 1.72, BRASS); textY('S.M.', 1.08, Y, 1.7, '#3a2f16');
    qy(.7, 1.9, Y, 2.26, 2.68, '#d4ecf2', '#bfe0ea'); glow(() => qy(.7, 1.9, Y, 2.26, 2.68, '#ffe6b0', '#ffd98a')); lw([1.3, Y, 2.26], [1.3, Y, 2.68], GREEN); lw([.7, Y, 2.26], [1.9, Y, 2.26], GREEN);
    qy(.55, 2.05, Y, 0, .1, dk(STONE, .35));
    signY('STATIONMASTER', .05, 3.4, Y, 2.86, 3.22, NAVY, '#ffffff', { lit: true });
    /* the window, with a blind and a desk lamp */
    qy(2.5, 4.2, Y, 1.0, 2.3, '#cfe6ee', '#b7d6e2'); glow(() => qy(2.5, 4.2, Y, 1.0, 2.3, '#ffe6b0', '#ffd98a'));
    qy(2.5, 4.2, Y, 1.86, 2.3, '#e8dcc0'); for (let z = 1.9; z < 2.3; z += .12) lw([2.5, Y, z], [4.2, Y, z], '#c9b991');
    qy(3.0, 3.12, Y, 1.0, 1.42, '#3a3440'); qy(2.86, 3.3, Y, 1.42, 1.56, '#3f8a55'); lit(() => qy(3.5, 3.72, Y, 1.22, 1.34, '#fff1c0')); qy(3.58, 3.64, Y, 1.0, 1.22, '#2a2733');
    for (const x of [2.5, 3.35, 4.2]) lw([x, Y, 1.0], [x, Y, 2.3], GREEN); lw([2.5, Y, 2.3], [4.2, Y, 2.3], GREEN); lw([2.5, Y, 1.0], [4.2, Y, 1.0], GREEN); qy(2.42, 4.28, Y, .9, 1.0, lt(STONE, .3));
    for (const x of [2.6, 3.9]) { qy(x, x + .22, Y, 1.0, 1.14, '#b5654a'); spx(x + .1, Y, 1.24, 0, 0, '#e0453a'); spx(x + .16, Y, 1.2, 0, 0, '#f2a7c3'); spx(x + .06, Y, 1.18, 0, 0, '#3f8a55'); }
    /* the lost property hatch */
    qy(4.7, 6.1, Y, 1.0, 2.1, INK); glow(() => qy(4.74, 6.06, Y, 1.04, 1.8, '#5a4a2a'));
    qy(4.7, 6.1, Y, 1.8, 2.1, '#8d939e'); for (let z = 1.84; z < 2.1; z += .07) lw([4.7, Y, z], [6.1, Y, z], '#6b727c');
    for (const [x, z, c] of [[4.82, 1.06, '#b5654a'], [5.1, 1.06, '#2f8f96'], [5.42, 1.06, '#e8c060'], [5.72, 1.06, '#7a5aa8'], [4.95, 1.42, '#e0453a'], [5.55, 1.42, '#f4efe2']]) qy(x, x + .24, Y, z, z + .26, c);
    lw([4.76, Y, 1.4], [6.04, Y, 1.4], '#6b5a4a');                                                                                         // shelf inside
    box(4.62, .3, .92, 1.56, .16, .08, '#8a5a3a', { ol: false }); lw([4.62, .46, 1.0], [6.18, .46, 1.0], BRASS);                          // counter ledge
    cyl(5.95, .38, 1.0, .06, .07, BRASS, { ol: false });                                                                                 // the bell
    signY('LOST', 4.95, 5.85, Y, 2.52, 2.82, '#f4efe2', NAVY); signY('PROPERTY', 4.3, 6.4, Y, 2.2, 2.5, '#f4efe2', NAVY);
    /* fire bucket, notice board, wall lamps */
    qy(.16, .44, Y, 1.0, 1.34, '#e0453a'); lw([.16, Y, 1.34], [.44, Y, 1.34], '#f4efe2'); textY('F', .26, Y, 1.28, '#f4efe2'); lw([.3, Y, 1.34], [.3, Y, 1.6], '#3a3440');
    qy(2.1, 2.42, Y, 1.05, 2.0, '#7a5a44'); for (const [z, c] of [[1.12, '#fbf8ee'], [1.44, '#f2e3a0'], [1.74, '#fbf8ee']]) qy(2.14, 2.38, Y, z, z + .22, c); spx(2.26, Y, 1.96, 0, 0, '#e0453a');
    for (const x of [.14, 2.14]) { qy(x, x + .18, Y, 2.34, 2.46, BRASS); lit(() => qy(x + .03, x + .15, Y, 2.46, 2.72, '#fff1c0')); }
    /* the floor above: two round-headed windows */
    for (const x0 of [1.1, 3.9]) {
      qy(x0, x0 + 1.5, Y, 3.6, 5.3, (u, v, w, hh) => { const r = w / 2, cy = hh - r; if (v > cy && Math.hypot(u + .5 - r, v - cy) >= r) return null; if (u < 1 || u >= w - 1 || v < 1 || u === Math.floor(w / 2) || v === Math.floor(cy)) return GREEN; if (v > cy && Math.hypot(u + .5 - r, v - cy) > r - 1.4) return GREEN; return ((u + v) & 1) ? '#9fc3d6' : '#b7d6e2'; });
      glow(() => qy(x0 + .08, x0 + 1.42, Y, 3.66, 4.5, '#f4c870', 'glass')); qy(x0 - .08, x0 + 1.58, Y, 3.5, 3.6, lt(STONE, .3));
    }
    qy(2.85, 3.65, Y, 3.9, 4.7, dk(STONE, .06)); lw([2.85, Y, 3.9], [3.65, Y, 3.9], dk(STONE, .35)); textY('MB', 3.0, Y, 4.5, NAVY); textY('LR', 3.0, Y, 4.2, '#d2412f');
  },
};

/* ---------- the roof ---------- */
const lunette = {
  id: 'furn.cplat.lunette', kind: 'furniture', tags: T, overhead: true, solid: false, size: p => [num(p.w, 20), .3, 4], vb: p => [0, 0, 0, num(p.w, 20), .5, 4.2],
  variants: [{ w: 20 }, { w: 20, sky: 2 }],
  draw(p) {
    const w = num(p.w, 20), sky = p.sky || 0, S = SKY[sky] || SKY[0], st = sky === 2 ? '#4d6f6c' : STEEL, W2 = w * 8, Hp = 64;
    qy(0, w, .3, 0, 4, (u, v) => {
      const a = (u + .5 - W2) / W2, b = (v + .5) / Hp, r = Math.hypot(a, b); if (r > 1) return null;
      if (r > .965 || v < 1) return dk(st, .25); if (r > .93) return st;
      if (r < .16) return r > .13 ? dk(BRASS, .3) : BRASS;
      if (Math.abs(r - .58) < .012 || Math.abs(r - .2) < .014) return st;
      const an = Math.atan2(b, a) / Math.PI * 18; if (Math.abs(an - Math.round(an)) < .055 / Math.max(.25, r)) return st;
      const k = Math.min(2, Math.floor(b * 2.6 + r * .4));
      if (sky === 2 && hash2(u, v, 11) > .99) return '#e8ecff';
      if (sky === 0 && hash2(Math.floor((u + v) / 9), Math.floor(v / 3), 5) > .9) return '#eef8fc';
      return ((u + v) & 1) && k < 2 ? S[Math.min(2, k + 1)] : S[k];
    });
    lw([0, .3, 0], [w, .3, 0], BRASS); lw([0, .3, .06], [w, .3, .06], dk(st, .4));
  },
};

const vault = {
  id: 'furn.cplat.vault', kind: 'furniture', tags: T, overhead: true, solid: false, size: p => [10, num(p.len, 10), 4], vb: p => [0, 0, 0, 10.1, num(p.len, 10) + .1, 4.4],
  variants: [{ len: 10 }, { len: 10, sky: 2 }],
  draw(p) {
    const len = num(p.len, 10), off = num(p.off, 0), sky = p.sky || 0, S = SKY[sky] || SKY[0], st = sky === 2 ? '#4d6f6c' : STEEL, N = 7, n = Math.round(len / 2);
    const sj = j => Math.PI / 2 * j / N, P = (y, s) => [10 * (1 - Math.cos(s)), y, 4 * Math.sin(s)], main = i => (off + i * 2) % 6 === 0;
    const col = (i, j) => { const b = Math.min(2, Math.floor(j / 2.4)); return [S[b], (i + j) & 1 ? S[Math.min(2, b + 1)] : lt(S[b], .25)]; };
    for (let j = 0; j < N; j++) for (let i = 0; i < n; i++) { const a = i * 2, b = a + 2, c = col(i + off / 2, j); fq([P(a, sj(j)), P(b, sj(j)), P(b, sj(j + 1)), P(a, sj(j + 1))], c[0], c[1]); }
    for (let j = 0; j < N; j++) for (let i = 0; i < n; i++) { const a = P(i * 2 + 1, sj(j)), b = P(i * 2 + 1, sj(j + 1)); lw(a, b, lt(st, .2)); }                    // glazing bars
    for (let j = 0; j <= N; j++) lw(P(0, sj(j)), P(len, sj(j)), j === N ? BRASS : j === 0 ? dk(st, .3) : st);                                               // purlins
    for (let i = 0; i <= n; i++) {
      if (i === n && !p.end) continue;
      for (let j = 0; j < N; j++) { const a = P(i * 2, sj(j)), b = P(i * 2, sj(j + 1)); lw(a, b, main(i) ? dk(st, .35) : st); if (main(i)) { lw([a[0], a[1] + .08, a[2]], [b[0], b[1] + .08, b[2]], dk(st, .2)); lw([a[0], a[1], a[2] + .09], [b[0], b[1], b[2] + .09], lt(st, .3)); } }
      if (main(i)) {                                                                                                                                       // a pendant lamp on every main rib
        const q = P(i * 2, sj(3)); lw([q[0], q[1] + .04, q[2]], [q[0], q[1] + .04, q[2] - 1.1], dk(st, .3)); qy(q[0] - .16, q[0] + .16, q[1] + .04, q[2] - 1.2, q[2] - 1.1, BRASS);
        lit(() => ball(q[0], q[1] + .04, q[2] - 1.34, .15, '#fff1c0', { ol: false }));
      }
    }
    lw([0, 0, .06], [0, len, .06], dk(st, .3));
  },
};

/* ---------- ironwork ---------- */
const column = {
  id: 'furn.cplat.column', kind: 'furniture', tags: T, size: p => [.6, .6, num(p.h, 5)], vb: p => [-1.1, -1.1, 0, 1.7, 1.7, num(p.h, 5) + .3], variants: [{ n: 1 }, { n: 2, h: 5 }],
  light: { x: .7, y: .7, z: 0, r: 5.2, c: '#ffe2b0' },
  draw(p) {
    const h = num(p.h, 5), c = '#2f4f4c', arc = (dx, dy) => { let a = null; for (let k = 0; k <= 6; k++) { const t = k / 6 * Math.PI / 2, q = [.3 + dx * 1.2 * (1 - Math.cos(t)), .3 + dy * 1.2 * (1 - Math.cos(t)), h - 1.55 + 1.2 * Math.sin(t)]; if (a) lw(a, q, c); a = q; } };
    arc(-1, 0); arc(0, -1);
    box(.04, .04, 0, .52, .52, .5, c); qy(.04, .56, .56, .38, .46, BRASS); qx(.56, .04, .56, .38, .46, dk(BRASS, .2));
    cyl(.3, .3, .5, .15, h - 1.25, STEEL); lw([.24, .42, .56], [.24, .42, h - .8], lt(STEEL, .35)); lw([.36, .44, .56], [.36, .44, h - .8], dk(STEEL, .25));
    for (const z of [.6, 1.7, h - .95]) cyl(.3, .3, z, .19, .08, BRASS, { ol: false });
    box(.06, .06, h - .72, .48, .48, .22, c); box(-.06, -.06, h - .5, .72, .72, .14, dk(c, .15)); box(.0, .0, h - .36, .6, .6, .36, c, { ol: false });
    arc(1, 0); arc(0, 1);
    for (const [dx, dy] of [[1, 0], [0, 1]]) { const t = Math.PI / 4, q = [.3 + dx * 1.2 * (1 - Math.cos(t)), .3 + dy * 1.2 * (1 - Math.cos(t)), h - 1.55 + 1.2 * Math.sin(t)]; lw([.3 + dx * .15, .3 + dy * .15, h - 1.0], q, c); lw(q, [.3 + dx * .95, .3 + dy * .95, h - .4], c); }
    /* lamp arms + globes */
    lw([.3, .45, 2.95], [.3, .92, 3.12], BRASS); lw([.45, .3, 2.95], [.92, .3, 3.12], BRASS);
    lit(() => { ball(.3, .95, 3.27, .15, '#fff1c0', { ol: false }); ball(.95, .3, 3.27, .15, '#fff1c0', { ol: false }); });
    /* platform roundel */
    if (p.n) { box(.1, .5, 2.0, .4, .08, .46, NAVY, { ol: false }); lit(() => textY(String(p.n), .24, .585, 2.4, '#ffffff')); lw([.1, .58, 2.0], [.5, .58, 2.0], BRASS); lw([.1, .58, 2.46], [.5, .58, 2.46], BRASS); }
  },
};

const POSTER = {
  lighthouse(x, Y, z) { qy(x, x + 1.3, Y, z, z + 1.2, '#9fd6e8'); qy(x, x + 1.3, Y, z, z + .36, '#2f6f96'); qy(x + .52, x + .78, Y, z + .2, z + .92, '#f4efe2'); qy(x + .52, x + .78, Y, z + .5, z + .62, '#e0453a'); qy(x + .48, x + .82, Y, z + .92, z + 1.02, '#e0453a'); lit(() => spx(x + .65, Y, z + .98, 0, 0, '#fff1c0')); textY('SEE IT', x + .08, Y, z + 1.16, '#27408a'); },
  skydeck(x, Y, z) { qy(x, x + 1.3, Y, z, z + 1.2, '#23284e'); for (const [a, hh] of [[.08, .5], [.3, .78], [.52, .4], [.74, .9], [.98, .56]]) { qy(x + a, x + a + .2, Y, z, z + hh, '#3a4a6e'); lit(() => { spx(x + a + .06, Y, z + hh - .1, 0, 0, '#ffd98a'); spx(x + a + .12, Y, z + hh * .5, 0, 0, '#ffd98a'); }); } textY('SKY', x + .1, Y, z + 1.16, '#ffd98a'); textY('DECK', x + .1, Y, z + .2, '#ffffff'); },
  coffee(x, Y, z) { qy(x, x + 1.3, Y, z, z + 1.2, '#6b4a3a'); qy(x + .4, x + .9, Y, z + .3, z + .7, '#f4efe2'); qy(x + .9, x + 1.02, Y, z + .42, z + .6, '#f4efe2'); qy(x + .46, x + .84, Y, z + .58, z + .66, '#8a5a3a'); lw([x + .56, Y, z + .76], [x + .6, Y, z + .9], '#e8dcc0'); lw([x + .72, Y, z + .76], [x + .76, Y, z + .9], '#e8dcc0'); textY('BEAN', x + .14, Y, z + 1.16, '#e8c060'); textY('+GONE', x + .1, Y, z + .22, '#e8c060'); },
  beach(x, Y, z) { qy(x, x + 1.3, Y, z, z + 1.2, '#f8d2a0'); qy(x, x + 1.3, Y, z + .3, z + .62, '#3f9fc0', '#56b2d0'); qy(x, x + 1.3, Y, z, z + .3, '#f1d9a0'); for (let k = 0; k < 4; k++) qy(x + .5 + k * .1, x + .6 + k * .1, Y, z + .3, z + .52, k & 1 ? '#f4efe2' : '#e0453a'); lw([x + .7, Y, z + .14], [x + .7, Y, z + .52], '#6b5a4a'); lit(() => qy(x + .96, x + 1.14, Y, z + .84, z + 1.0, '#fff1c0')); textY('BOARD', x + .08, Y, z + 1.16, '#b5654a'); textY('WALK', x + .08, Y, z + .22, '#b5654a'); },
  orpheum(x, Y, z) { qy(x, x + 1.3, Y, z, z + 1.2, '#7a1f2e'); qy(x + .14, x + 1.16, Y, z + .28, z + .86, '#2a0d14'); fq([[x + .14, Y, z + .86], [x + .5, Y, z + .86], [x + .14, Y, z + .4]], '#c93a4a'); fq([[x + 1.16, Y, z + .86], [x + .8, Y, z + .86], [x + 1.16, Y, z + .4]], '#c93a4a'); lit(() => { spx(x + .64, Y, z + .5, 0, 0, '#fff1c0'); spx(x + .64, Y, z + .44, 0, 0, '#ffd98a'); }); textY('THE', x + .42, Y, z + 1.16, BRASS); textY('ORPHEUM', x + .0, Y, z + .22, BRASS); },
  zoo(x, Y, z) { qy(x, x + 1.3, Y, z, z + 1.2, '#4f9a55'); ballY(x + .64, Y, z + .62, '#f2c230'); textY('AQUA', x + .14, Y, z + 1.16, '#ffffff'); textY('RIUM', x + .14, Y, z + .22, '#ffffff'); },
};
function ballY(x, Y, z, c) { qy(x - .22, x + .22, Y, z - .12, z + .12, c); qy(x - .12, x + .12, Y, z - .2, z + .2, c); qy(x + .22, x + .4, Y, z - .1, z + .1, c); spx(x - .1, Y, z + .06, 0, 0, '#2a2733'); }
const fence = {
  id: 'furn.cplat.fence', kind: 'furniture', tags: T, size: p => [num(p.len, 6), .2, 1.05], vb: p => [-.1, -.1, 0, num(p.len, 6) + .1, .4, 2.5], variants: [{ len: 6, posters: [[2, 'lighthouse']] }, { len: 6, posters: [[.5, 'skydeck'], [3.5, 'coffee']] }],
  draw(p) {
    const len = num(p.len, 6), Y = .2, c = '#2f4f4c';
    for (let x = .17; x < len; x += .34) lw([x, Y, .12], [x, Y, .98], dk(c, .1));
    lw([0, Y, .12], [len, Y, .12], c); lw([0, Y, .56], [len, Y, .56], c);
    for (let x = 0; x <= len + .01; x += 2) { const xx = Math.min(x, len - .12); box(xx, .04, 0, .12, .14, 1.08, c, { ol: false }); ball(xx + .06, .1, 1.14, .07, BRASS, { ol: false }); }
    qy(0, len, Y, .98, 1.05, BRASS); lw([0, Y, 1.05], [len, Y, 1.05], lt(BRASS, .4));
    for (const [at, kind] of p.posters || []) {
      box(at - .06, .06, 0, .08, .1, 2.2, c, { ol: false }); box(at + 1.28, .06, 0, .08, .1, 2.2, c, { ol: false });
      qy(at - .06, at + 1.36, Y, .86, 2.2, '#3a3440'); (POSTER[kind] || POSTER.lighthouse)(at, Y + .005, .93);
      lw([at - .06, Y, 2.2], [at + 1.36, Y, 2.2], BRASS); lw([at - .06, Y, .86], [at + 1.36, Y, .86], BRASS);
    }
  },
};

/* ---------- the Station Agent's fixtures ---------- */
const pa = {
  id: 'furn.cplat.pa', kind: 'furniture', tags: T.concat('announcer_booth'), size: [.7, .5, 1.9], vb: [-.2, -.1, 0, .95, .8, 2.3], use: { x: .35, y: 1.0 }, variants: [{}],
  draw() {
    box(.27, .17, 0, .16, .16, .95, '#56636b', { ol: false }); box(.2, .1, 0, .3, .3, .08, '#3a3644', { ol: false });
    box(0, .05, .95, .7, .4, .8, '#c9ced6'); qy(.06, .4, .45, 1.28, 1.68, '#3a3644'); for (let z = 1.32; z < 1.66; z += .08) lw([.08, .45, z], [.38, .45, z], '#8d939e');
    qy(.46, .64, .45, 1.02, 1.2, '#2a2733'); lit(() => { spx(.5, .45, 1.14, 0, 0, '#5ad06a'); spx(.58, .45, 1.14, 0, 0, '#ffb347'); qy(.46, .64, .45, 1.5, 1.66, '#e0453a'); });
    textY('PA', .48, .455, 1.42, NAVY);
    lw([.55, .45, 1.75], [.55, .62, 1.92], '#2a2733'); lw([.55, .62, 1.92], [.55, .7, 1.84], '#2a2733'); box(.5, .66, 1.74, .1, .1, .14, '#3a3644', { ol: false });       // gooseneck microphone
    box(-.04, .01, 1.75, .78, .48, .08, NAVY, { ol: false }); signY('GLADYS', .02, .68, .455, .98, 1.0, '#c9ced6', '#c9ced6', { frame: false });
    cyl(.35, .25, 1.83, .16, .22, '#8d939e', { ol: false }); qy(.24, .46, .42, 1.9, 2.02, '#3a3644');                                                                    // horn speaker on top
  },
};
const dispatch = {
  id: 'furn.cplat.dispatch', kind: 'furniture', tags: T.concat('platform_edge'), size: [.6, .6, 2.1], vb: [-.5, -.5, 0, 1.2, 1.3, 2.4], use: { x: .3, y: 1.1 }, variants: [{}],
  draw() {
    qz(-.4, 1.0, -.4, 1.2, .012, (x, y) => (x < -.3 || x > .9 || y < -.3 || y > 1.1) ? YEL : null);                                     // the dispatcher's box on the floor
    box(.14, .14, 0, .32, .32, .1, '#3a3644', { ol: false }); box(.22, .22, .1, .16, .16, 1.9, '#f4efe2', { l: PAT.stripes('#2a2733', YEL, 4), r: PAT.stripes('#2a2733', dk(YEL, .15), 4), ol: false });
    box(.06, .1, 1.5, .48, .34, .5, '#25212d'); lit(() => { textY('RA', .16, .445, 1.92, '#fff1c0'); qy(.14, .26, .445, 1.56, 1.68, '#5ad06a'); qy(.34, .46, .445, 1.56, 1.68, '#e0453a'); });
    /* the flag, the baton and the whistle on their hooks */
    lw([.5, .3, 1.3], [.86, .3, 1.42], '#6b5a4a'); fq([[.56, .3, 1.3], [.86, .3, 1.4], [.86, .3, 1.02], [.56, .3, .96]], '#3fae5a', '#35964d');
    lw([.3, .46, 1.34], [.3, .7, 1.34], '#8d939e'); box(.27, .62, .78, .06, .06, .56, '#f4efe2', { ol: false }); cyl(.3, .65, 1.18, .12, .05, '#e0453a', { ol: false }); cyl(.3, .65, 1.22, .08, .02, '#f4efe2', { ol: false });
    spx(.12, .46, 1.2, 0, 0, BRASS); spx(.12, .46, 1.2, 1, 0, BRASS); spx(.12, .46, 1.2, 0, -1, '#8d939e'); spx(.12, .46, 1.2, 0, -2, '#8d939e');
  },
};
const helppoint = {
  id: 'furn.cplat.helppoint', kind: 'furniture', tags: T.concat('station_info'), size: [.9, .5, 2.4], vb: [-.1, -.1, 0, 1.0, .7, 2.7], use: { x: .45, y: 1.05 }, variants: [{}],
  draw() {
    box(0, .05, 0, .9, .4, 2.0, NAVY); qy(0, .9, .45, 0, .12, dk(NAVY, .35)); box(-.04, .01, 2.0, .98, .48, .08, BRASS, { ol: false });
    box(.25, .1, 2.08, .4, .3, .32, NAVY, { ol: false }); lit(() => { const s = PW(.45, .4, 2.3), X = Math.round(s[0]), Y = Math.round(s[1]), w = C('#ffffff'); px(X, Y - 3, w); for (let i = -1; i < 4; i++) px(X, Y + i, w); px(X - 1, Y + 3, w); px(X + 1, Y + 3, w); px(X - 1, Y - 1, w); });
    /* the line map: the loop with its eight stations */
    qy(.08, .82, .45, 1.1, 1.9, '#fbf8ee');
    const pts = [[.2, 1.78], [.45, 1.78], [.7, 1.78], [.74, 1.5], [.7, 1.22], [.45, 1.22], [.2, 1.22], [.16, 1.5]];
    for (let i = 0; i < 8; i++) { const a = pts[i], b = pts[(i + 1) % 8]; lw([a[0], .455, a[1]], [b[0], .455, b[1]], i < 4 ? '#d2412f' : '#2f8f96'); }
    for (let i = 0; i < 8; i++) spx(pts[i][0], .455, pts[i][1], 0, 0, i === 5 ? '#16141c' : '#27408a');
    lit(() => { qy(.14, .5, .45, .62, .92, '#8fd0ff'); spx(.66, .45, .78, 0, 0, '#5ad06a'); }); qy(.6, .76, .45, .66, .9, '#c9ced6'); textY('HELP', .16, .455, 1.06, '#ffffff');
  },
};
const validator = {
  id: 'furn.cplat.validator', kind: 'furniture', tags: T.concat('ticket_gate'), size: [.4, .4, 1.25], vb: [-.1, -.1, 0, .5, .6, 1.4], use: { x: .2, y: .9 }, variants: [{}],
  draw() {
    box(.12, .12, 0, .16, .16, .8, '#8d939e', { ol: false }); box(.06, .06, 0, .28, .28, .06, '#3a3644', { ol: false });
    box(0, .02, .8, .4, .36, .42, YEL); qy(.06, .34, .38, .86, 1.0, '#2a2733'); lit(() => { qy(.08, .2, .38, 1.06, 1.16, '#5ad06a'); spx(.3, .38, 1.12, 0, 0, '#8fd0ff'); });
    qz(.06, .34, .08, .32, 1.225, '#2a2733'); lw([.1, .2, 1.23], [.3, .2, 1.23], '#f4efe2');
  },
};

/* ---------- concourse ---------- */
const stairwell = {
  id: 'furn.cplat.stairwell', kind: 'furniture', tags: T.concat('stairs'), size: [3, 2.5, 1.0], vb: [-.1, -.1, -1.4, 3.1, 2.7, 1.3], variants: [{}],
  draw() {
    const st = '#d9d1c0';
    qx(.15, .2, 2.5, -1.4, 0, dk(STONE, .32)); lw([.15, .25, -.2], [.15, 2.5, -1.3], BRASS);                                              // far side wall of the well + its handrail
    for (let k = 0; k < 6; k++) { const y0 = .22 + k * .3, z = -(k + 1) * .2, x1 = 2.85 + z; if (y0 - z > 2.75) break; qz(.15, x1, y0, Math.min(y0 + .3, 2.5 + z + .2), z, k & 1 ? dk(st, .1) : st); lw([.15, y0, z], [x1, y0, z], YEL); }
    box(0, .1, 0, .15, 2.4, .9, STONE, { r: PAT.stone(dk(STONE, .14)) }); qz(-.02, .17, .08, 2.52, .92, lt(STONE, .2)); lw([.08, .1, 1.0], [.08, 2.5, 1.0], BRASS); for (const y of [.1, 1.3, 2.45]) lw([.08, y, .92], [.08, y, 1.0], BRASS);
    box(2.85, .1, 0, .15, 2.4, .9, STONE, { r: PAT.stone(dk(STONE, .14)) }); qz(2.83, 3.02, .08, 2.52, .92, lt(STONE, .2)); lw([2.93, .1, 1.0], [2.93, 2.5, 1.0], BRASS); for (const y of [.1, 1.3, 2.45]) lw([2.93, y, .92], [2.93, y, 1.0], BRASS);
    for (const x of [0, 2.85]) { box(x - .03, .02, 0, .21, .21, 1.05, dk(STONE, .1)); ball(x + .075, .125, 1.17, .11, BRASS); }
  },
};
const wayout = {
  id: 'furn.cplat.wayout', kind: 'furniture', tags: T, solid: false, size: [3.2, .2, 3.1], vb: [-.1, -.1, 0, 3.3, .4, 3.2], variants: [{}],
  draw() {
    for (const x of [.02, 3.06]) box(x, .04, 0, .12, .12, 3.05, '#2f4f4c', { ol: false });
    box(0, .02, 2.3, 3.2, .16, .72, INK); lw([0, .18, 2.3], [3.2, .18, 2.3], BRASS); lw([0, .18, 3.02], [3.2, .18, 3.02], BRASS);
    lit(() => { qy(.08, 3.12, .185, 2.66, 2.96, '#f2c230'); textY('WAY OUT', .98, .19, 2.9, INK); textY('V', .5, .19, 2.9, INK); textY('V', 2.58, .19, 2.9, INK); textY('HALL + CITY', .74, .19, 2.58, '#ffffff'); });
  },
};
const shelter = {
  id: 'furn.cplat.shelter', kind: 'furniture', tags: T.concat('bench', 'seat', 'seating'), size: [3, 1.6, 2.5], vb: [-.2, -.2, 0, 3.2, 1.9, 2.7],
  seats: [{ x: .6, y: .62, z: .5, dir: 1 }, { x: 1.5, y: .62, z: .5, dir: 1 }, { x: 2.4, y: .62, z: .5, dir: 1 }], use: { x: 1.5, y: 1.9 }, variants: [{}],
  draw() {
    const c = '#2f4f4c', g = '#bfe0ea';
    qy(.08, 2.92, .1, .35, 2.2, g, 'glass'); for (const x of [.08, 1.03, 1.97, 2.92]) lw([x, .1, 0], [x, .1, 2.25], c); lw([.08, .1, .35], [2.92, .1, .35], c); lw([.08, .1, 1.3], [2.92, .1, 1.3], lt(c, .3));
    qx(.08, .1, 1.5, .35, 2.2, g, 'glass'); lw([.08, 1.5, 0], [.08, 1.5, 2.25], c); lw([.08, .1, .35], [.08, 1.5, .35], c);
    textY('CENTRAL', 1.06, .105, 1.9, '#ffffff');
    for (const x of [.3, 2.6]) box(x, .3, 0, .1, .5, .42, '#56636b', { ol: false });
    box(.15, .28, .42, 2.7, .56, .08, '#34504f', { t: PAT.fboards(lt('#34504f', .1), .17) }); box(.15, .2, .5, 2.7, .08, .42, '#34504f', { l: PAT.siding(dk('#34504f', .18), 3) });
    box(2.86, .04, 0, .1, .1, 2.25, c, { ol: false }); box(2.86, 1.46, 0, .1, .1, 2.25, c, { ol: false }); box(.04, 1.46, 0, .1, .1, 2.25, c, { ol: false });
    box(-.15, -.1, 2.25, 3.3, 1.85, .16, NAVY, { t: '#d4ecf2', t2: '#bfe0ea' }); signY('WAITING SHELTER', .5, 2.8, 1.75, 2.27, 2.4, NAVY, '#ffffff', { lit: true, frame: false });
    glow(() => qz(.2, 2.8, .3, 1.5, .012, '#5a5140', 'glass')); lit(() => qy(1.2, 1.8, .11, 2.1, 2.18, '#ffb347'));
  },
};
const trolley = {
  id: 'furn.cplat.trolley', kind: 'furniture', tags: T.concat('luggage'), size: p => [p.kind === 'row' ? 2.1 : 1.5, .8, 1.2], vb: p => [-.1, -.1, 0, 2.3, 1.0, 1.7], variants: [{ kind: 'row' }, { kind: 'bags' }, { kind: 'mail' }],
  draw(p) {
    const m = '#aab0ba', one = (x, load) => {
      for (const [wx, wy] of [[x + .1, .12], [x + 1.0, .12], [x + .1, .66], [x + 1.0, .66]]) cyl(wx, wy, 0, .07, .1, '#25212d', { ol: false });
      box(x, .08, .14, 1.15, .64, .06, m, { ol: false }); lw([x, .72, .2], [x + 1.15, .72, .2], dk(m, .4));
      lw([x + .04, .1, .2], [x + .04, .1, 1.1], m); lw([x + .04, .7, .2], [x + .04, .7, 1.1], m); lw([x + .04, .1, 1.1], [x + .04, .7, 1.1], '#e0453a'); lw([x + .04, .1, .7], [x + .04, .7, .7], m);
      if (load) load(x);
    };
    if (p.kind === 'row') { for (let k = 2; k >= 0; k--) one(k * .42 + .02); return; }
    if (p.kind === 'mail') return one(.15, x => { box(x + .15, .12, .2, .5, .56, .6, '#b08d57', { l: '#9a7a48' }); lw([x + .15, .68, .56], [x + .65, .68, .56], '#6b5a4a'); box(x + .7, .16, .2, .4, .48, .42, '#c9b991'); qy(x + .76, x + 1.04, .64, .3, .5, '#f4efe2'); textY('MB', x + .2, .685, .5, '#d2412f'); });
    one(.15, x => { box(x + .12, .12, .2, .66, .56, .5, '#7a1f2e', { l: '#8a2a3a' }); lw([x + .12, .68, .45], [x + .78, .68, .45], BRASS); box(x + .8, .16, .2, .32, .48, .7, '#2f8f96'); box(x + .2, .2, .7, .5, .4, .3, '#e8c060'); spx(x + .45, .6, .86, 0, 0, '#6b5a4a'); box(x + .84, .22, .9, .24, .3, .2, '#3a3644', { ol: false }); });
  },
};
const bigboard = {
  id: 'furn.cplat.bigboard', kind: 'furniture', tags: T.concat('departures'), wall: true, mount: 2.3, solid: false, size: p => [num(p.w, 5), .3, 3.1], vb: p => [0, 0, 0, num(p.w, 5), .5, 3.2], variants: [{ w: 5 }],
  draw(p) {
    const w = num(p.w, 5), Y = .3;
    box(0, .12, 0, w, .18, 3.1, INK, { ol: false }); qy(0, w, Y, 0, 3.1, INK);
    for (const z of [0, 3.1]) lw([0, Y, z], [w, Y, z], BRASS); for (const x of [0, w]) lw([x, Y, 0], [x, Y, 3.1], BRASS); lw([.06, Y, 2.62], [w - .06, Y, 2.62], '#3a3440'); lw([.06, Y, .34], [w - .06, Y, .34], '#3a3440');
  },
};
const indicator = {
  id: 'furn.cplat.indicator', kind: 'furniture', tags: T.concat('departures'), solid: false, size: [4, .24, 1.5], vb: [-.1, -.1, 0, 4.1, .4, 2.9], variants: [{ n: 1, color: '#d2412f' }],
  draw(p) {
    const Y = .24; for (const x of [.5, 3.5]) lw([x, .12, 1.5], [x, .12, 2.85], '#2f4f4c');
    box(0, 0, 0, 4, .24, 1.5, INK, { ol: false }); qy(0, 4, Y, 0, 1.5, INK);
    for (const z of [0, 1.5]) lw([0, Y, z], [4, Y, z], BRASS); for (const x of [0, 4]) lw([x, Y, 0], [x, Y, 1.5], BRASS);
    lit(() => { qy(.08, .62, Y + .003, .5, 1.42, p.color || '#d2412f'); textY(String(p.n || 1), .26, Y + .006, 1.2, '#ffffff'); textY(String(p.n || 1), .3, Y + .006, 1.2, '#ffffff'); });
    qy(.08, .62, Y + .003, .08, .44, '#2a2733'); textY('PL', .12, Y + .006, .4, '#8fb0e8');
  },
};

export default [trackbed, mouth, office, lunette, vault, column, fence, pa, dispatch, helppoint, validator, stairwell, wayout, shelter, trolley, bigboard, indicator];
