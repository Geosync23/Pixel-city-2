// City-wide multi-family housing: townhouse row, garden apartments, mid-century slab, condo mid-rise with penthouse, brick loft conversion.
import { box, qy, qx, qz, lw, fq, cyl, cone, ball, dk, lt, mix, glow, lit, PAT, hash2, signY, signX, textX, textY, rng } from '../../engine/raster.js';
import {
  mk, body, win, winRow, door, steps, roofGable, roofHip, roofFlat, roofShed, chimney, dormer, dish, antenna, pipe, lamp, rail, balcony, hood,
  fairy, pumpkin, pot, bloom, leafy, winter, autumn, summer, snowTop, wallQ, fs, fQ, fL, fB, pt, disc, W, bike, pick, mat, SNOW, wreath,
} from './_lib.js';

const STEP = '#b9b2a6';
function tank(x, y, z, c = '#9a6a48') { for (const [a, b] of [[-.5, -.5], [.4, -.5], [-.5, .4], [.4, .4]]) box(x + a, y + b, z, .1, .1, .8, '#4a4a5a', { ol: false }); lw([x - .5, y + .5, z + .1], [x + .5, y + .5, z + .7], '#4a4a5a'); lw([x + .5, y + .5, z + .1], [x - .5, y + .5, z + .7], '#4a4a5a'); cyl(x, y, z + .8, .62, 1.2, c); for (const k of [-.45, -.2, .1, .35, .6]) lw([x + k, y + .62 - Math.abs(k) * .3, z + .8], [x + k, y + .62 - Math.abs(k) * .3, z + 2.0], dk(c, .45)); lw([x - .6, y + .3, z + 1.2], [x + .3, y + .62, z + 1.2], '#4a4a5a'); lw([x + .3, y + .62, z + 1.2], [x + .62, y + .1, z + 1.2], '#4a4a5a'); cone(x, y, z + 2.0, .72, .5, winter() ? '#e9eef4' : '#6a6470'); }
function acRoof(x, y, z) { box(x, y, z, .8, .7, .5, '#c9ccd4'); qy(x + .1, x + .7, y + .7, z + .1, z + .42, PAT.siding('#8a8e9a', 2)); if (winter()) snowTop(x, x + .8, y, y + .7, z + .51); }
function bulkhead(x, y, z, c, w = 1.6, d = 1.6) { box(x, y, z, w, d, 1.5, c, { t: winter() ? SNOW : dk(c, .3) }); qy(x + .4, x + 1.0, y + d, z, z + 1.2, '#4a4a5a'); lw([x + .4, y + d, z + 1.2], [x + 1.0, y + d, z + 1.2], '#2e2e38'); }
function winAC(s, a, pl, z) { fB(s, a, pl, z, .5, .25, .3, '#d6d8de', { ol: false }); fL(s, a, z, a + .5, z, pl + .25, '#6a6a78'); fL(s, a + .08, z + .1, a + .42, z + .1, pl + .25, '#8a8e9a'); fL(s, a + .08, z + .2, a + .42, z + .2, pl + .25, '#8a8e9a'); }
function mailboxes(s, a, pl, z, n = 4) { fQ(s, a, a + n * .2, pl, z, z + .5, fs(s, '#b9bcc6')); for (let i = 0; i <= n; i++) fL(s, a + i * .2, z, a + i * .2, z + .5, pl, '#6a6a78'); fL(s, a, z + .25, a + n * .2, z + .25, pl, '#6a6a78'); fL(s, a, z + .5, a + n * .2, z + .5, pl, '#6a6a78'); fL(s, a, z, a + n * .2, z, pl, '#6a6a78'); }
/** multi-pane industrial window with a segmental brick arch */
function indWin(s, a0, a1, pl, z0, z1, o) {
  o = o || {}; const fr = o.frame || '#2e3440', on = o.on !== false;
  fQ(s, a0 - .08, a1 + .08, pl, z1, z1 + .16, fs(s, o.lintel || '#d9cfbb'));
  W(s, a0, a1, pl, z0, z1, { on, mullion: null, frame: fr, glass: ['#6a9aa8', '#84b2be'], glowc: o.glowc });
  const nx = Math.max(2, Math.round((a1 - a0) / .32)), nz = Math.max(2, Math.round((z1 - z0) / .36));
  for (let i = 1; i < nx; i++) { const a = a0 + i * (a1 - a0) / nx; fL(s, a, z0, a, z1, pl, fr); if (on) glow(() => fL(s, a, z0, a, z1, pl, '#a87a3a')); }
  for (let i = 1; i < nz; i++) { const z = z0 + i * (z1 - z0) / nz; fL(s, a0, z, a1, z, pl, fr); if (on) glow(() => fL(s, a0, z, a1, z, pl, '#a87a3a')); }
  if (o.open) fQ(s, a0 + (a1 - a0) / nx, a0 + 2 * (a1 - a0) / nx, pl, z0 + (z1 - z0) / nz, z0 + 2 * (z1 - z0) / nz, '#2e3a48');
  fL(s, a0 - .12, z0 - .08, a1 + .12, z0 - .08, pl, lt(o.lintel || '#d9cfbb', .2)); fL(s, a0 - .12, z0 - .14, a1 + .12, z0 - .14, pl, dk(o.lintel || '#d9cfbb', .4));
}
/** glazed double entrance with flat canopy + lit name sign */
function entrance(s, a, pl, z, o) {
  o = o || {}; const w = o.w || 1.5, h = o.h || 1.8, fr = o.frame || '#2e2e38';
  W(s, a - w / 2, a + w / 2, pl, z, z + h, { on: true, mullion: 'v', frame: fr, glowc: ['#ffe9b0', '#ffd98a'] });
  fL(s, a - w / 2, z + h * .45, a + w / 2, z + h * .45, pl, fr); wpxx(s, a - .1, pl, z + .8); wpxx(s, a + .1, pl, z + .8);
  if (o.canopy !== false) fB(s, a - w / 2 - .35, pl, z + h + .2, w + .7, o.cdp || .4, .12, o.cc || '#3e3e4a', { t: winter() ? SNOW : (o.cc || '#3e3e4a') });
  const sw2 = Math.max(w / 2 + .3, (o.name ? o.name.length * 4 + 5 : 0) / 32);
  if (o.name) (s === 'y' ? signY(o.name, a - sw2, a + sw2, pl + (o.canopy !== false ? (o.cdp || .4) + .02 : .02), z + h + .32, z + h + .78, o.sbg || '#1f2a33', o.sfg || '#ffd98a', { lit: true }) : signX(o.name, pl + .42, a - sw2, a + sw2, z + h + .32, z + h + .78, o.sbg || '#1f2a33', o.sfg || '#ffd98a', { lit: true }));
  lamp(s, a + w / 2 + .3, pl, z + 1.4); lamp(s, a - w / 2 - .3, pl, z + 1.4);
}
function wpxx(s, a, pl, z) { lw(pt(s, a, pl, z), pt(s, a, pl, z + .25), '#d9d9e2'); }

const TOWN_PALS = [
  ['#b5654a', '#e9dcc0', '#8fa3b5', '#c98a6a', '#a9c2a0', '#ecd28a'],
  ['#f2b8a8', '#a9d0c8', '#f4dc9a', '#b8c4e6', '#f1ede4', '#d8b0d0'],
  ['#a85a44', '#8f4838', '#b87058', '#7a5a50', '#c08a68', '#9a5040'],
];

export default [
  /* ---------------- townhouse row: n narrow homes with stoops and mixed rooflines ---------------- */
  mk({
    id: 'bld.res.townhouses', tags: ['maplewood', 'oldtown', 'apartment', 'townhouse', 'home', 'row'],
    defs: { w: 12, d: 6, floors: 2, pal: 0, roof: '#565266', trim: '#f6f1e6', mat: 'brick' },
    height: P => .5 + P.floors * 2 + 1.6,
    doorAt: P => ({ side: 'y', at: .8 }), lightAt: P => ({ x: .8, y: P.d + .4, z: 0, r: 3 }),
    variants: [
      { w: 12, d: 6, floors: 2, seed: 1, pal: 0 },
      { w: 9, d: 6, floors: 3, seed: 2, pal: 2, roof: '#4a4650' },
      { w: 15, d: 6, floors: 2, seed: 3, pal: 1, mat: 'siding', roof: '#6a5a66' },
      { w: 12, d: 6, floors: 3, seed: 4, pal: 0, roof: '#4d4a55' },
      { w: 9, d: 6, floors: 2, seed: 5, pal: 1, mat: 'stucco', roof: '#a8503c' },
      { w: 15, d: 7, floors: 3, seed: 6, pal: 2 },
    ],
    paint(P, r) {
      const { w, d, trim } = P, n = Math.max(2, Math.round(w / 3)), uw = w / n, bd = d - .8, z0 = .5, pal = TOWN_PALS[P.pal % 3], doors = ['#2f5d50', '#a8343a', '#2b3a55', '#f2cf5a', '#3a3038', '#c8683f', '#f6f1e6'];
      const off = Math.floor(r() * 6);
      for (let i = 0; i < n; i++) {
        const x0 = i * uw, wall = pal[(i * 5 + off + (i >> 1)) % pal.length], kind = (i + off) % 3, H = z0 + P.floors * 2 + (kind === 1 ? .3 : 0), m = P.mat === 'brick' && P.pal === 1 ? 'siding' : P.mat, dc = doors[(i * 3 + off) % doors.length];
        const sh = r() < .4 ? dk(wall, .5) : null, fb = r() < .5, dark = dk(wall, .55);
        body(x0, 0, 0, uw, bd, H, wall, m, { base: '#8d8780', baseH: .5 });
        if (i === n - 1) for (let f = 0; f < P.floors; f++) winRow('x', .5, bd - .5, w, z0 + f * 2 + .75, z0 + f * 2 + 1.65, { r, ww: .85, n: 2, trim });
        // ground floor
        door('y', x0 + .8, bd, z0, { c: dc, trim, wreath: true, pumpkin: 1 + (i % 2), glass: i % 2 ? 'fan' : 'top', steps: 3, stepc: STEP });
        fL('y', x0 + .12, 0, x0 + .12, .95, bd + .78, '#2e2a3a'); lw([x0 + .12, bd + .78, .9], [x0 + .12, bd, z0 + .85], '#2e2a3a'); fL('y', x0 + .12, z0, x0 + .12, z0 + .85, bd + .02, '#2e2a3a');
        if (kind === 2) { fB('y', x0 + 1.5, bd, z0 + .35, uw - 1.8, .3, 1.45, wall, { l: mat(m, dk(wall, .18)), r: mat(m, dk(wall, .36)) }); win('y', x0 + 1.62, x0 + uw - .42, bd + .3, z0 + .6, z0 + 1.6, { on: r() < .7, trim, mull: 'v', curt: '#f4f0e8' }); fB('y', x0 + 1.45, bd, z0 + 1.8, uw - 1.7, .36, .1, P.roof, { t: winter() ? SNOW : P.roof }); }
        else win('y', x0 + 1.55, x0 + uw - .4, bd, z0 + .65, z0 + 1.65, { on: r() < .7, trim, mull: 'cross', shut: sh, fbox: fb, v: r(), curt: '#e9c9a0', head: true });
        win('y', x0 + 1.7, x0 + 2.3, bd, .12, .38, { on: r() < .2, trim: false, sill: false, mull: null });
        for (let f = 1; f < P.floors; f++) winRow('y', x0 + .25, x0 + uw - .25, bd, z0 + f * 2 + .75, z0 + f * 2 + 1.65, { r, ww: .8, n: 2, trim, shut: sh, fbox: fb && f === 1, wreath: i % 2 === 0, head: true, lights: f === 1 && i % 3 === 1 });
        if (i > 0) pipe('y', x0 - .03, bd, .5, H - .2, dark);
        // roofline
        if (kind === 0) { roofGable(x0, 0, H, uw, bd, uw * .36, 'y', P.roof, { wall, wmat: m, trim, vent: 'round', over: .1, rake: .2, behind: () => chimney(x0 + .3, bd * .4, H + .2, H + uw * .36 + .6, '#8f4838', { w: .5 }) }); }
        else if (kind === 1) { roofFlat(x0, 0, H, uw, bd, wall, { mat: m, ph: .3, cop: trim }); fB('y', x0, bd, H - .25, uw, .14, .2, trim, { ol: false }); for (let k = x0 + .2; k < x0 + uw - .1; k += .3) fQ('y', k, k + .12, bd + .14, H - .42, H - .25, fs('y', trim)); if (r() < .6) dish(x0 + uw * .5, bd * .5, H + .3); else antenna(x0 + uw * .4, bd * .4, H + .3); }
        else { box(x0, 0, H, uw, bd - 1.1, 1.15, P.roof, { t: winter() ? SNOW : dk(P.roof, .15) }); const R = { axis: 'x', face: 'y', gface: 'x', x: x0, y: bd - 2.2, z: H, w: uw, d: 2.2, h: 1.15, m: bd - 1.1, run: 1.2, rise: 1.2, c: P.roof, kind: 'shingle', sl: (a, t, up = 0) => [a, bd - 1.1 + t * 1.2, H + 1.15 - t * 1.2 + up] }; roofShed(x0, bd - 1.1, H, uw, 1.1, 1.15, P.roof, { kind: 'shingle', over: .1, sidewall: P.roof, trim }); dormer(R, x0 + uw / 2, .78, .8, { wall, trim, on: r() < .6, w: 1.2, roof: P.roof, shed: true }); chimney(x0 + uw - .7, .6, H + 1.15, H + 1.9, '#8f4838', { w: .5 }); }
      }
      if (winter()) fairy([0, bd + .05, z0 + 2.05], [uw, bd + .05, z0 + 2.05], { sag: 1 });
    },
  }),

  /* ---------------- garden apartments: 3-5 storey walk-up with lived-in balconies ---------------- */
  mk({
    id: 'bld.res.gardenapt', tags: ['apartment', 'home', 'maplewood', 'oldtown', 'arts', 'walkup', 'starter'],
    defs: { w: 12, d: 7, floors: 4, wall: '#d9a878', trim: '#f4ead8', accent: '#7a4a3a', mat: 'brick', bal: 'bars', balc: '#3e3a48', roofk: 'flat', roof: '#a8503c', name: 'MAPLE CT' },
    height: P => .2 + P.floors * 2 + (P.roofk === 'hip' ? 1.6 : 1.9),
    doorAt: P => ({ side: 'y', at: P.w / 2 }), lightAt: P => ({ x: P.w / 2, y: P.d + .3, z: 0, r: 4 }),
    variants: [
      { w: 12, d: 7, floors: 4, seed: 1 },
      { w: 10, d: 7, floors: 3, seed: 2, wall: '#f1e6cc', mat: 'stucco', bal: 'solid', balc: '#6fa8a0', accent: '#4f7f7a', roofk: 'hip', roof: '#a8503c', name: 'ELM HOUSE' },
      { w: 14, d: 7, floors: 5, seed: 3, wall: '#b5654a', accent: '#e9dcc0', trim: '#f4ead8', bal: 'bars', name: 'HARBOR VW' },
      { w: 12, d: 7, floors: 3, seed: 4, wall: '#c9d2d8', mat: 'siding', bal: 'glass', balc: '#3e4a5a', accent: '#56708a', roofk: 'hip', roof: '#4a5568', name: 'THE BIRCH' },
      { w: 12, d: 8, floors: 5, seed: 5, wall: '#e9cf8a', mat: 'stucco', bal: 'solid', balc: '#e9e4d8', accent: '#c8683f', name: 'SUNNYSIDE' },
      { w: 10, d: 7, floors: 4, seed: 6, wall: '#9a8a9a', mat: 'brick', bal: 'bars', balc: '#f4ead8', accent: '#f4ead8', name: 'NO 9' },
    ],
    paint(P, r) {
      const { w, d, wall, trim, accent } = P, z0 = .2, fl = P.floors, H = z0 + fl * 2, bd = d - .6, c = w / 2, m = P.mat, sw = 1.1;
      body(0, 0, 0, w, bd, H, wall, m, { base: '#8d8780', baseH: .2, band: m === 'siding' ? null : [H - .15], bandc: trim });
      // +x face
      for (let f = 0; f < fl; f++) {
        const fz = z0 + f * 2;
        winRow('x', .5, bd - .5, w, fz + .7, fz + 1.6, { r, ww: .9, n: bd > 6.6 ? 3 : 2, trim, pOn: .5, each: (i, o) => { if (r() < .22) o.blind = .5; if (r() < .2) o.curt = pick(r, ['#e06a6a', '#6aa8e0', '#f2cf5a', '#8fd08a']); return o; } });
        if (r() < .35) winAC('x', 1.0, w, fz + .42);
      }
      pipe('x', bd - .25, w, .2, H - .2, dk(wall, .45));
      // facade: two wings of balconies
      const wing = (a0, a1, mir) => {
        const bw = Math.min(3.0, a1 - a0 - .2), extra = (a1 - a0) - bw > 1.3, b0 = mir ? a1 - bw - .1 : a0 + .1;
        for (let f = 0; f < fl; f++) {
          const fz = z0 + f * 2, dxx = mir ? b0 + bw - 1.2 : b0 + .35, wx = mir ? b0 + .3 : b0 + 1.5;
          W('y', dxx, dxx + .8, bd, fz, fz + 1.65, { on: r() < .55, mullion: 'h', frame: '#3e394c' });
          win('y', wx, wx + 1.15, bd, fz + .6, fz + 1.55, { on: r() < .6, trim, mull: 'v', curt: r() < .4 ? pick(r, ['#e9c9a0', '#c9d6e8', '#e8b0b0', '#cfe0c0']) : null, blind: r() < .2 ? .4 : 0 });
          if (extra) { const ex = mir ? a0 + .25 : a1 - .95; win('y', ex, ex + .7, bd, fz + .85, fz + 1.55, { on: r() < .4, trim, mull: 'h' }); if (r() < .25) winAC('y', ex + .1, bd, fz + .5); }
        }
        // ground patio + balconies (drawn bottom-up so upper ones overlap correctly)
        rail('y', b0, b0 + bw, bd + .5, 0, { solid: wall, mat: m, h: .7, c: trim }); rail('x', bd, bd + .5, b0 + bw, 0, { solid: wall, mat: m, h: .7, c: trim });
        if (!winter()) pot(b0 + .4, bd + .25, 0, leafy(r()), .22);
        for (let f = 1; f < fl; f++) balcony('y', b0, b0 + bw, bd, z0 + f * 2, { dp: .5, style: P.bal, c: P.balc, solid: P.balc, r, slab: trim, fairy: r() < .5, pump: r() < .5 });
      };
      wing(.2, c - sw, false);
      // stair core
      fB('y', c - sw, bd, 0, sw * 2, .25, H + .5, accent, { l: mat(m === 'siding' ? 'plain' : m, dk(accent, .18)), r: mat(m === 'siding' ? 'plain' : m, dk(accent, .36)), t: winter() ? SNOW : dk(accent, .3) });
      for (let f = 1; f < fl; f++) { const fz = z0 + f * 2 - .9; W('y', c - .45, c + .45, bd + .25, fz + .2, fz + 1.5, { on: true, mullion: 'cross', glowc: ['#ffe9b0', '#f4d890'] }); }
      entrance('y', c, bd + .25, z0, { name: P.name, w: 1.3, h: 1.75, cdp: .35, cc: dk(accent, .3), sbg: dk(accent, .5), sfg: '#ffe9b0' });
      mailboxes('y', c + sw + .15, bd, z0 + .8, 3);
      steps('y', c - .8, c + .8, bd + .25, z0, 1, STEP, .25);
      wing(c + sw, w - .2, true);
      if (autumn()) pumpkin(c - 1.0, bd + .4, 0, true);
      // roof
      if (P.roofk === 'hip') { roofHip(0, 0, H, w, bd, 1.5, P.roof, { trim, kind: 'tile', over: .25, behind: () => chimney(w * .25, bd / 2 - .6, H + .5, H + 2.0, '#8f4838') }); }
      else {
        roofFlat(0, 0, H, w, bd, wall, { mat: m, cop: trim });
        const tz = H + .3;
        bulkhead(c - .8, bd - 2.2, tz, accent);
        if (r() < .6) tank(w * .22, bd * .4, tz); else { acRoof(w * .15, bd * .3, tz); acRoof(w * .28, bd * .3, tz); }
        antenna(w * .8, bd * .3, tz, 1.3); dish(w * .7, bd * .65, tz); if (r() < .5) acRoof(w * .82, bd * .6, tz);
      }
    },
  }),

  /* ---------------- mid-century slab: ribbon windows, coloured spandrels, fins, stair tower ---------------- */
  mk({
    id: 'bld.res.midcentury', tags: ['apartment', 'home', 'midcentury', 'slab', 'downtown', 'arts', 'starter'],
    defs: { w: 14, d: 6, floors: 5, wall: '#efe9da', trim: '#fbf8ee', cols: ['#3aa8a0', '#f2a03a', '#efe9da'], tower: '#b5654a', tmat: 'brick', name: 'BAYVIEW' },
    height: P => 2.4 + (P.floors - 1) * 2 + 2.0,
    doorAt: P => ({ side: 'y', at: 2.3 }), lightAt: P => ({ x: 2.3, y: P.d + .3, z: 0, r: 4 }),
    variants: [
      { w: 14, d: 6, floors: 5, seed: 1 },
      { w: 12, d: 6, floors: 4, seed: 2, cols: ['#e8c23a', '#efe9da', '#5a8ac8'], tower: '#5a5560', tmat: 'stone', name: 'SKYLARK' },
      { w: 16, d: 6, floors: 6, seed: 3, cols: ['#d8563a', '#efe9da', '#efe9da'], tower: '#efe9da', tmat: 'plain', name: 'THE ALDER' },
      { w: 14, d: 7, floors: 4, seed: 4, wall: '#d9d2c4', cols: ['#7a9a5a', '#d9d2c4', '#e8c23a'], tower: '#8a5a3c', tmat: 'planks', name: 'PARKSIDE' },
      { w: 12, d: 6, floors: 6, seed: 5, cols: ['#e88aa0', '#8ac8d8', '#efe9da'], tower: '#3e4a5a', tmat: 'plain', name: 'COMET' },
    ],
    paint(P, r) {
      const { w, d, wall, trim } = P, fl = P.floors, g = 2.4, H = g + (fl - 1) * 2, bd = d - .5, tx0 = 1.2, tx1 = 3.4, a0 = tx1 + .2;
      body(0, 0, 0, w, bd, H, wall, 'plain', { t: wall });
      // end wall: stone cladding + one window column
      qx(w, 0, bd, 0, H, PAT.stone(fs('x', mix(P.tower, wall, P.tmat === 'plain' ? .8 : .35))));
      for (let f = 1; f < fl; f++) win('x', bd - 1.6, bd - .6, w, g + (f - 1) * 2 + .7, g + (f - 1) * 2 + 1.6, { on: r() < .5, trim, mull: 'v' });
      win('x', .8, bd - 2.4, w, .6, 1.8, { on: r() < .3, trim: false, mull: 'v', sill: false, frame: '#3e394c' });
      // ground floor: dark recessed glazing behind pilotis
      qy(a0, w, bd, 0, g - .25, '#3d4a5c', '#445266'); glow(() => { for (let x = a0 + .3; x < w - 1; x += 2.2) if (hash2(Math.floor(x), P.seed, 4) > .4) qy(x, x + 1.6, bd, .2, g - .5, '#ffd98a', '#e8b860'); });
      for (let x = a0; x < w; x += 1.1) lw([x, bd, 0], [x, bd, g - .25], '#2e3644');
      qy(0, tx0, bd, 0, g - .25, PAT.stone(fs('y', '#a8a092')));
      mailboxes('y', .2, bd, .8, 4); bike('y', a0 + 2.6, bd + .12, 0, '#d8443a'); bike('y', a0 + 3.5, bd + .16, 0, '#3aa87a');
      const nb = Math.round((w - a0) / 1.05), bw = (w - a0) / nb;
      for (let x = a0 + bw * 2; x < w - .2; x += bw * 2) cyl(x, bd + .2, 0, .13, g - .2, trim);
      // typical floors
      for (let f = 1; f < fl; f++) {
        const fz = g + (f - 1) * 2;
        for (let b = 0; b < nb; b++) {
          const x = a0 + b * bw, pc = P.cols[Math.floor(hash2(b, f, P.seed) * 2.99)];
          qy(x, x + bw, bd, fz, fz + .7, fs('y', pc)); lw([x, bd, fz], [x, bd, fz + .7], dk(pc, .4));
          const on = r() < .5; W('y', x + .04, x + bw - .04, bd, fz + .75, fz + 1.72, { on, mullion: b % 2 ? null : 'h', frame: '#4a4a5a' });
          const k = r(); if (k < .18) { qy(x + .1, x + bw - .1, bd, fz + 1.2, fz + 1.68, fs('y', '#f4f0e8')); if (on) glow(() => qy(x + .1, x + bw - .1, bd, fz + 1.2, fz + 1.68, '#ffeec4')); } else if (k < .3) { const cc = pick(r, ['#e06a6a', '#6aa8e0', '#8fd08a', '#f2cf5a']); qy(x + .08, x + .35, bd, fz + .8, fz + 1.68, fs('y', cc)); }
          if (k > .93) winAC('y', x + .25, bd, fz + .42);
          if (k > .86 && k < .93 && !winter()) { for (let i = 0; i < 4; i++) fq([[x + .15 + i * .2, bd + .05, fz + .75]], '#000'); fB('y', x + .1, bd, fz + .62, bw - .2, .14, .12, '#8a5a3c', { ol: false }); for (let i = 0; i < 4; i++) lw([x + .2 + i * .2, bd + .1, fz + .76], [x + .2 + i * .2, bd + .1, fz + .86], i % 2 ? (bloom(r()) || '#4f9a45') : '#4f9a45'); }
        }
        fB('y', a0 - .05, bd, fz - .12, w - a0 + .05, .14, .12, trim, { ol: false }); lw([a0, bd + .14, fz - .12], [w, bd + .14, fz - .12], dk(trim, .45));
      }
      for (let b = 0; b <= nb; b += 2) { const x = a0 + b * bw; fB('y', Math.min(x - .05, w - .12), bd, g - .25, .12, .28, H - g + .25, trim, { ol: false }); lw([Math.min(x - .05, w - .12), bd + .28, g - .25], [Math.min(x - .05, w - .12), bd + .28, H], dk(trim, .4)); }
      // stair tower
      fB('y', tx0, bd, 0, tx1 - tx0, .35, H + .9, P.tower, { l: mat(P.tmat, dk(P.tower, .18)), r: mat(P.tmat, dk(P.tower, .36)), t: winter() ? SNOW : dk(P.tower, .3) });
      const gy = bd + .35;
      qy(tx0 + .75, tx1 - .75, gy, g + .3, H + .4, (u, v) => (u % 4 === 0 || v % 4 === 0) ? '#8fb8c4' : '#b9dde6'); glow(() => qy(tx0 + .75, tx1 - .75, gy, g + .3, H + .4, (u, v) => (u % 4 === 0 || v % 4 === 0) ? '#d8a850' : '#ffe9a8'));
      lw([tx0 + .75, gy, g + .3], [tx0 + .75, gy, H + .4], '#4a4a5a'); lw([tx1 - .75, gy, g + .3], [tx1 - .75, gy, H + .4], '#4a4a5a');
      entrance('y', (tx0 + tx1) / 2, gy, 0, { w: 1.4, h: 1.75, name: null, cdp: .1, canopy: false });
      box(tx0 - .3, gy, 2.05, tx1 - tx0 + .6, .15, .12, trim, { t: winter() ? SNOW : trim });
      // roof: thin slab, drying lines, clutter, name sign
      box(-.15, -.15, H, w + .3, bd + .3, .18, trim, { t: '#9a96a0' }); snowTop(0, w, 0, bd, H + .19);
      const tz = H + .18;
      for (const x of [a0 + 1, a0 + 4.2]) { if (x + 2.6 > w) break; box(x, 1.2, tz, .08, .08, 1.0, '#6a6a78', { ol: false }); box(x + 2.6, 1.2, tz, .08, .08, 1.0, '#6a6a78', { ol: false }); lw([x, 1.24, tz + 1], [x + 2.6, 1.24, tz + 1], '#6a6a78'); if (!winter()) for (let k = x + .2; k < x + 2.3; k += .5) { const cc = pick(r, ['#f4f0e8', '#e06a6a', '#6aa8e0', '#f2cf5a', '#f4f0e8']), hh = .4 + r() * .3; qy(k, k + .4, 1.24, tz + 1 - hh, tz + 1, fs('y', cc)); } }
      acRoof(w - 1.4, 1.0, tz); antenna(w - 2.4, bd - 1.5, tz, 1.4); dish(w - .8, bd - 1.4, tz);
      for (const x of [a0 + .2, w - .4]) lw([x, bd - .1, tz], [x, bd - .1, tz + .5], '#4a4a5a');
      signY(P.name, a0 + .2, a0 + .2 + (P.name.length * 4 + 5) / 16, bd - .1, tz + .45, tz + 1.0, '#2a3440', P.cols[0] === '#efe9da' ? '#ffd98a' : lt(P.cols[0], .4), { lit: true });
    },
  }),

  /* ---------------- modern condo mid-rise with a penthouse level ---------------- */
  mk({
    id: 'bld.res.condo', tags: ['apartment', 'home', 'condo', 'penthouse', 'downtown', 'harborside', 'hillcrest', 'modern', 'highrise'],
    defs: { w: 10, d: 8, floors: 10, wall: '#f1eee6', accent: '#c8683f', frame: '#3a3a46', name: 'THE CREST' },
    height: P => 2.6 + (Math.min(12, P.floors) - 1) * 2 + 1.4,
    doorAt: P => ({ side: 'y', at: 2.2 }), lightAt: P => ({ x: 2.2, y: P.d + .3, z: 0, r: 4.5 }),
    variants: [
      { w: 10, d: 8, floors: 10, seed: 1 },
      { w: 9, d: 8, floors: 8, seed: 2, wall: '#3e4450', accent: '#e8c23a', frame: '#22242c', name: 'ONYX' },
      { w: 10, d: 9, floors: 12, seed: 3, wall: '#e9e4d8', accent: '#3aa8a0', name: 'TIDEWATER' },
      { w: 11, d: 8, floors: 9, seed: 4, wall: '#c9b8a0', accent: '#5a4038', frame: '#3a3038', name: 'MAPLE ONE' },
      { w: 9, d: 8, floors: 11, seed: 5, wall: '#dfe6ea', accent: '#56708a', name: 'AZURE' },
    ],
    paint(P, r) {
      const { w, d, wall, accent, frame } = P, fl = Math.min(12, P.floors), g = 2.6, typ = fl - 2, H = g + typ * 2, bd = d - .7, ax = 1.6;
      body(0, 0, 0, w, bd, H, wall, 'plain', { t: wall });
      // podium / lobby
      qy(0, w, bd, 0, g - .3, PAT.stone(fs('y', dk(wall, .25)))); qx(w, 0, bd, 0, g - .3, PAT.stone(fs('x', dk(wall, .25))));
      W('y', 3.6, w - .5, bd, .25, g - .6, { on: true, mullion: null, frame, glowc: ['#ffe9b0', '#ffd98a'] }); for (let x = 3.6 + 1.2; x < w - .6; x += 1.2) lw([x, bd, .25], [x, bd, g - .6], frame);
      qy(4.2, 4.5, bd + .01, .25, 1.5, '#4f8a55', 'glass'); qy(w - 2.4, w - 1.2, bd + .01, .25, .7, '#8a6a5a');
      W('x', 1, bd - 1, w, .5, g - .7, { on: r() < .6, mullion: 'v', frame });
      entrance('y', 2.2, bd, 0, { w: 1.6, h: 1.95, name: P.name, cdp: .45, cc: frame, sbg: frame, sfg: '#ffe9b0', frame });
      if (autumn()) pumpkin(.9, bd + .3, 0, true);
      pot(3.35, bd + .3, 0, leafy(.3), .26, '#e9e4d8');
      // typical floors
      const bays = Math.round((w - ax - .4) / 1.25), bw = (w - ax - .4) / bays, nby = Math.round((bd - .8) / 1.3), byw = (bd - .8) / nby;
      qy(.3, ax - .15, bd, g, H, fs('y', accent)); lw([ax - .15, bd, g], [ax - .15, bd, H], dk(accent, .5));
      qx(w, bd - 1.3, bd - .3, g, H, fs('x', accent));
      for (let f = 0; f < typ; f++) {
        const fz = g + f * 2;
        W('y', .5, ax - .35, bd, fz + .5, fz + 1.6, { on: r() < .4, mullion: null, frame });
        for (let b = 0; b < bays; b++) { const x = ax + b * bw, on = r() < .5; W('y', x, x + bw, bd, fz + .12, fz + 1.72, { on, mullion: null, frame }); if (r() < .25) { qy(x + .06, x + bw - .06, bd, fz + 1.0, fz + 1.68, fs('y', '#f1ede4')); if (on) glow(() => qy(x + .06, x + bw - .06, bd, fz + 1.0, fz + 1.68, '#ffeec4')); } }
        for (let b = 0; b < nby; b++) { const y = .4 + b * byw; if (y + byw > bd - 1.3 && y < bd - .3) continue; W('x', y, y + byw, w, fz + .35, fz + 1.72, { on: r() < .45, mullion: null, frame }); }
        lw([ax, bd, fz + 1.86], [w, bd, fz + 1.86], dk(wall, .3));
        // staggered glass balconies
        const left = f % 2 === 1, b0 = left ? ax : ax + bw * Math.floor(bays / 2), b1 = left ? ax + bw * Math.ceil(bays / 2) : w - .4 + .0;
        if (f > 0 || true) balcony('y', b0, b1, bd, fz + .06, { dp: .6, style: 'glass', c: frame, slab: wall, r, stuff: r() < .7, h: .55 });
      }
      box(-.1, -.1, H, w + .2, bd + .2, .2, wall, { t: '#b9b2a2' });
      // penthouse: set-back glass box with terrace
      const pz = H + .2, px1 = w - 1.3, py1 = bd - 1.5, pH = 2.3;
      qz(0, w, 0, bd, pz, PAT.fboards('#b08a64', .3)); snowTop(0, w, py1, bd, pz + .01); snowTop(px1, w, 0, py1, pz + .01);
      box(.6, .5, pz, px1 - .6, py1 - .5, pH, '#5a5662', { ol: false });
      qy(.6, px1, py1, pz, pz + pH, '#a6d8ea', '#bfe6f2'); glow(() => qy(.6, px1, py1, pz, pz + pH, '#ffdf9a', '#f6c874')); for (let x = .6; x <= px1 + .01; x += (px1 - .6) / 5) lw([x, py1, pz], [x, py1, pz + pH], frame);
      qx(px1, .5, py1, pz, pz + pH, '#8cc3dc', '#a6d8ea'); glow(() => qx(px1, .5, py1, pz, pz + pH, '#f6c874', '#e8b860')); for (let y = .5; y <= py1 + .01; y += (py1 - .5) / 4) lw([px1, y, pz], [px1, y, pz + pH], frame);
      box(.3, .2, pz + pH, px1 + .3, py1 + .4, .2, wall, { t: winter() ? SNOW : lt(wall, .1) });
      box(1.2, 1.2, pz + pH + .2, 1.6, 1.4, .7, '#8a8a96'); lw([2, 1.9, pz + pH + .9], [2, 1.9, pz + pH + 2.2], '#4a4a5a'); lit(() => fq([[2, 1.9, pz + pH + 2.25], [2.08, 1.9, pz + pH + 2.25], [2.08, 1.9, pz + pH + 2.15], [2, 1.9, pz + pH + 2.15]], '#ff5a4a'));
      // terrace life
      const f1 = leafy(r());
      box(.5, py1 + .5, pz, .5, .5, .4, '#e9e4d8', { ol: false }); ball(.75, py1 + .75, pz + .95, .42, f1); box(px1 - 2.2, py1 + .5, pz, 1.2, .5, .3, '#f4f0e8', { ol: false }); box(px1 - .8, py1 + .5, pz, .5, .5, .3, accent, { ol: false });
      box(px1 + .35, 1.0, pz, .5, .5, .4, '#e9e4d8', { ol: false }); ball(px1 + .6, 1.25, pz + .9, .38, leafy(r())); box(px1 + .35, 2.6, pz, .5, 1.1, .2, '#f4f0e8', { ol: false });
      rail('x', 0, bd, w - .04, pz, { glass: true, c: frame, h: .55 }); rail('y', 0, w, bd - .04, pz, { glass: true, c: frame, h: .55 });
      if (winter()) fairy([0, bd, pz + .58], [w, bd, pz + .58], { sag: 0, cols: ['#fff2c4', '#ffd98a'] });
    },
  }),

  /* ---------------- converted brick loft building ---------------- */
  mk({
    id: 'bld.res.loft', tags: ['apartment', 'home', 'loft', 'harborside', 'arts', 'oldtown', 'brick', 'industrial'],
    defs: { w: 10, d: 8, floors: 4, wall: '#a8553f', trim: '#d9cfbb', frame: '#2e3440', ghost: 'MAPLE BAY', ghost2: 'CANNING CO', name: 'LOFTS' },
    height: P => P.floors * 2.4 + 3.2,
    doorAt: P => ({ side: 'y', at: 1.25 }), lightAt: P => ({ x: 1.25, y: P.d + .3, z: 0, r: 4 }),
    variants: [
      { w: 10, d: 8, floors: 4, seed: 1 },
      { w: 12, d: 8, floors: 3, seed: 2, wall: '#8f4a3c', ghost: 'HARBOR', ghost2: 'ROPE WORKS', frame: '#1f3a3a' },
      { w: 10, d: 8, floors: 5, seed: 3, wall: '#b06a4a', ghost: 'UNION', ghost2: 'PRINT HOUSE', frame: '#3a2e2e' },
      { w: 12, d: 9, floors: 4, seed: 4, wall: '#c9b08a', trim: '#f1ead8', ghost: 'BAY CITY', ghost2: 'FLOUR MILL', frame: '#2e3440' },
      { w: 8, d: 8, floors: 4, seed: 5, wall: '#7a4a48', ghost: 'PIER 9', ghost2: 'COLD STORE', frame: '#22262e' },
    ],
    paint(P, r) {
      const { w, d, wall, trim, frame } = P, fl = P.floors, fh = 2.4, H = fl * fh, bd = d - .6, nb = Math.max(3, Math.round(w / 2.4)), bw = (w - .5) / nb, nby = Math.max(2, Math.round(bd / 2.5)), byw = (bd - .5) / nby;
      body(0, 0, 0, w, bd, H, wall, 'brick', { base: '#6a6470', baseH: .35 });
      // +x face: windows + ghost sign
      for (let f = 0; f < fl; f++) for (let b = 0; b < nby; b++) { const y = .25 + b * byw; if (f >= fl - 1 && fl > 2) continue; indWin('x', y + .35, y + byw - .35, w, f * fh + .65, f * fh + 1.95, { on: r() < .5, frame, lintel: trim, open: r() < .15 }); }
      if (fl > 2) { const gz = (fl - 1) * fh + .35, gc = mix(dk(wall, .36), '#f4ead8', .5), gt = dk(wall, .62); qx(w, .4, bd - .4, gz, gz + 1.6, (u, v) => (v % 3 === 0 && hash2(u >> 2, v, 9) > .6) ? mix(gc, dk(wall, .36), .4) : gc); textX(P.ghost, w, bd - .4 - ((bd - .8) * 16 - (P.ghost.length * 4 - 1)) / 32, gz + 1.35, gt); textX(P.ghost2, w, bd - .4 - ((bd - .8) * 16 - (P.ghost2.length * 4 - 1)) / 32, gz + .8, gt); }
      else for (let b = 0; b < nby; b++) { const y = .25 + b * byw; indWin('x', y + .35, y + byw - .35, w, (fl - 1) * fh + .65, (fl - 1) * fh + 1.95, { on: r() < .5, frame, lintel: trim }); }
      // +y facade: piers, windows
      for (let b = 0; b <= nb; b++) { const x = .25 + b * bw - .14; fB('y', Math.max(0, Math.min(w - .28, x)), bd, 0, .28, .1, H, wall, { l: PAT.brick(dk(wall, .12)), ol: false }); }
      for (let f = 0; f < fl; f++) for (let b = 0; b < nb; b++) { const x = .25 + b * bw; if (f === 0 && b === 0) continue; indWin('y', x + .32, x + bw - .32, bd, f * fh + (f ? .65 : .9), f * fh + 1.95, { on: r() < .55, frame, lintel: trim, open: r() < .12 }); }
      // entrance in the old loading bay
      const ex = .25 + bw / 2;
      fQ('y', ex - .8, ex + .8, bd, 0, 2.0, fs('y', '#3a3440')); W('y', ex - .65, ex + .65, bd, .1, 1.85, { on: true, mullion: 'v', frame, glowc: ['#ffe9b0', '#ffd98a'] }); lw([ex - .65, bd, 1.3], [ex + .65, bd, 1.3], frame);
      fB('y', ex - 1.0, bd, 2.1, 2.0, .4, .1, frame, { t: winter() ? SNOW : frame }); lw([ex - .95, bd + .4, 2.2], [ex - .95, bd, 2.8], '#4a4a5a'); lw([ex + .95, bd + .4, 2.2], [ex + .95, bd, 2.8], '#4a4a5a');
      signY(P.name, ex - .7, ex + .7, bd + .42, 2.2, 2.65, '#1f2a33', '#ffd98a', { lit: true });
      lamp('y', ex + 1.05, bd, 1.5); bike('y', ex + 1.5, bd + .12, 0, '#3a78c8');
      if (autumn()) pumpkin(ex - 1.0, bd + .3, 0, true);
      // corbelled cornice
      fB('y', 0, bd, H - .3, w, .12, .3, wall, { l: PAT.brick(dk(wall, .1)), ol: false }); for (let x = .1; x < w - .1; x += .3) qy(x, x + .14, bd + .12, H - .5, H - .3, fs('y', dk(wall, .1)));
      lw([0, bd + .12, H - .3], [w, bd + .12, H - .3], dk(wall, .6));
      // fire escape on the middle bay
      const fb = Math.min(nb - 1, Math.max(1, Math.floor(nb / 2))), fx0 = .25 + fb * bw + .05, fx1 = fx0 + bw - .1, ir = '#2a2a34';
      for (let f = 1; f < fl; f++) {
        const fz = f * fh + .5;
        if (f < fl - 1) { for (const o of [0, .1]) lw([fx0 + .25, bd + .45 + o, fz], [fx1 - .25, bd + .45 + o, fz + fh], ir); for (let k = 1; k < 8; k++) { const t = k / 8; lw([fx0 + .25 + (fx1 - fx0 - .5) * t, bd + .4, fz + fh * t], [fx0 + .25 + (fx1 - fx0 - .5) * t, bd + .58, fz + fh * t], ir); } }
        balcony('y', fx0, fx1, bd, fz, { dp: .6, style: 'bars', c: ir, slab: '#3a3a46', stuff: false, h: .6 });
        if (r() < .6 && !winter()) pot(fx1 - .3, bd + .3, fz, r() < .5 ? (bloom(r()) || leafy(.3)) : leafy(r()), .16);
      }
      lw([fx0 + .3, bd + .55, fh + .36], [fx0 + .3, bd + .55, 1.3], ir); lw([fx0 + .5, bd + .55, fh + .36], [fx0 + .5, bd + .55, 1.3], ir); for (let z = 1.4; z < fh + .3; z += .2) lw([fx0 + .3, bd + .55, z], [fx0 + .5, bd + .55, z], ir);
      // roof: parapet, deck with festoon lights, sawtooth skylights, water tank
      roofFlat(0, 0, H, w, bd, wall, { mat: 'brick', ph: .4, cop: trim, roof: '#77737f' });
      const tz = H + .4;
      for (let i = 0; i < 2; i++) { const x = w * .5 + i * 2.0, y = 1.0; if (x + 1.6 > w - .3) break; fq([[x + 1.5, y, tz], [x + 1.5, y + 2, tz], [x + 1.5, y, tz + .9]], '#5a5662'); fq([[x, y, tz + .9], [x + 1.5, y, tz + .9], [x + 1.5, y + 2, tz], [x, y + 2, tz]], winter() ? SNOW : '#8cc3dc', winter() ? '#dfe8f0' : '#a9d6e8'); glow(() => fq([[x, y, tz + .9], [x + 1.5, y, tz + .9], [x + 1.5, y + 2, tz], [x, y + 2, tz]], '#ffd98a', 'glass')); lw([x, y + 2, tz], [x + 1.5, y + 2, tz], '#3e394c'); lw([x, y, tz + .9], [x + 1.5, y, tz + .9], '#3e394c'); lw([x, y, tz + .9], [x, y + 2, tz], '#3e394c'); lw([x + 1.5, y, tz + .9], [x + 1.5, y + 2, tz], '#3e394c'); lw([x + .75, y, tz + .9], [x + .75, y + 2, tz], '#3e394c'); }
      tank(1.6, 1.6, tz);
      const dx0 = .4, dx1 = Math.min(w * .5 - .2, 4.6), dy0 = bd - 2.6, dy1 = bd - .35;
      qz(dx0, dx1, dy0, dy1, tz + .02, PAT.fboards('#b08a64', .25)); snowTop(dx0, dx1, dy0, dy1, tz + .03);
      box(dx0 + .5, dy0 + .7, tz, .9, .6, .35, '#e9e4d8', { ol: false }); box(dx0 + 1.8, dy0 + .8, tz, .4, .4, .3, '#d8443a', { ol: false }); pot(dx0 + .3, dy1 - .3, tz, leafy(r()), .28); pot(dx1 - .35, dy0 + .35, tz, leafy(r()), .24);
      for (const [px, py] of [[dx0, dy0], [dx1, dy0], [dx0, dy1], [dx1, dy1]]) lw([px, py, tz], [px, py, tz + 1.5], '#4a4a5a');
      fairy([dx0, dy1, tz + 1.5], [dx1, dy1, tz + 1.5], { sag: 3, cols: ['#fff2c4', '#ffd98a'] }); fairy([dx1, dy0, tz + 1.5], [dx1, dy1, tz + 1.5], { sag: 3, cols: ['#fff2c4', '#ffd98a'] });
      antenna(w - .8, bd - .8, tz, 1.2);
    },
  }),
];
