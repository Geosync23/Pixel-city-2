// City-wide civic services: supermarket, clinic, hospital, fire station, police, post office, community centre.
import { box, qy, qx, qz, fq, lw, glow, lit, gable, hip, cyl, cone, ball, PAT, rng, dk, lt, mix, hash2, PW, px, C, ENV } from '../../engine/raster.js';
import { Q, L, wallPat, txt, txtW, sign, icon, iconW, flatRoof, snowTop, gableSnow, disc, win, wins, door, shutter, awning, canopy, bulbs, neon, lamp, halo, banner, flag, stairs, bush, topiary, planter, ROOF, clutter, mural, VB, band, cornice, pick, winter, SNOW, SNOW2 } from './_lib.js';

const CROSS = ['...ccc...', '...ccc...', '...ccc...', 'ccccccccc', 'ccccccccc', 'ccccccccc', '...ccc...', '...ccc...', '...ccc...'];
const HORN = ['.....yy.', 'yyyyyyyy', 'y.yyyy.y', '.yy..yy.', '..yyyy..'];
/* a row of nested shopping carts along a +y wall, inside a rail corral */
function carts(x0, n, y) {
  for (const x of [x0 - .15, x0 + n * .32 + .55]) { box(x, y, 0, .08, .9, .7, '#3f8a57', { ol: false }); }
  lw([x0 - .1, y + .9, .7], [x0 + n * .32 + .6, y + .9, .7], '#3f8a57'); lw([x0 - .1, y + .9, .4], [x0 + n * .32 + .6, y + .9, .4], '#2f6f47');
  for (let i = 0; i < n; i++) { const x = x0 + i * .32; box(x, y + .2, .3, .5, .5, .42, '#c9ccd2', { ol: false, l: PAT.planks('#aeb4bc', 2), r: PAT.planks('#8d939b', 2) }); lw([x, y + .7, .78], [x + .5, y + .7, .78], '#e2574c'); lw([x + .1, y + .7, .3], [x + .1, y + .7, .1], '#6f757d'); const q = PW(x + .1, y + .7, .06); px(q[0], q[1], C('#2a2a33')); px(q[0] + 5, q[1] + 2, C('#2a2a33')); }
}
/* crates of produce */
function produce(x, y, n, r) { const cs = ['#e2574c', '#f2c230', '#7cc27a', '#e8843a', '#8d5fd1', '#c8e06a']; for (let i = 0; i < n; i++) { const c = cs[(i + Math.floor(r() * 6)) % 6]; box(x + i * .62, y, 0, .55, .45, .32 + (i % 2) * .1, '#8a6f5a', { t: c, t2: lt(c, .3) }); } }

export default [
  /* ------------------------------------------------------------ FreshWay Market */
  {
    id: 'bld.civic.freshway', kind: 'building', tags: ['civic', 'grocery', 'shop', 'supermarket', 'enterable'],
    size: p => [p.w || 16, p.d || 10, 4.6], vb: VB(p => [p.w || 16, p.d || 10, 4.6], .8, .6, 1.8),
    door: { side: 'y', at: 4 }, light: { x: 4, y: 11, z: 0, r: 7 }, lightFor: p => ({ x: 4, y: (p.d || 10) + 1, z: 0, r: 7 }),
    variants: [{ w: 16, d: 10, seed: 4, name: 'FRESHWAY MARKET' }, { w: 14, d: 9, seed: 13, name: 'FRESHWAY MARKET', accent: '#e8843a', green: '#2f8a6a' }, { w: 18, d: 12, seed: 27, name: 'FRESHWAY MARKET' }, { w: 12, d: 8, seed: 39, name: 'FRESHWAY EXPRESS', accent: '#d2392f' }],
    draw(p) {
      const w = p.w || 16, d = p.d || 10, r = rng(p.seed || 1), wall = '#f0ead8', grn = p.green || '#3f9a4f', ac = p.accent || '#f2a12e', dark = '#39404c', H = 4.2, by = d - 1.2;
      const nm = (p.name || 'FRESHWAY MARKET').split(' '), n1 = nm[0], n2 = nm.slice(1).join(' ') || 'MARKET';
      // main shed
      box(0, 0, 0, w, by, H, wall, { l: PAT.planks(dk(wall, .18), 8), r: PAT.planks(dk(wall, .36), 8) });
      qx(w, 0, by, 0, .5, dk(wall, .55)); qx(w, 0, by, H - 1.0, H, dk(grn, .3)); qx(w, 0, by, H - 1.12, H - 1.0, dk(ac, .25));
      // side: loading dock + slogan
      shutter('x', 1.0, 3.6, w, .6, 2.9, '#aab2ba', { step: 3 }); box(w, .9, 0, .5, 2.8, .6, '#6f757d'); for (const y of [1.1, 3.3]) qx(w + .5, y, y + .2, .15, .5, '#f2c230');
      lamp('x', 2.3, w, 3.15);
      sign('x', 'FRESH EVERY DAY', 4.2, by - .4, w + .01, H - .85, H - .2, null, '#fff8e8');
      win('x', by - 2.6, by - .6, w, 1.0, 2.4, { on: true, mullion: 'v', frame: dark });
      const f = flatRoof(0, 0, H, w, by, wall, { cap: lt(grn, .2), roof: '#a8a49c' });
      for (let x = f.x0 + 5.5; x + 1.3 < f.x1; x += 2.6) for (let y = f.y0 + .3; y + 1 < f.y1 - .5; y += 2.6) ROOF.sky(x, y, H, r);
      clutter(r, { ...f, x1: f.x0 + 5 }, ['ac2', 'ac2', 'ac', 'vent', 'hatch'], 4);
      // glazed front under a canopy
      const gx0 = 6.4, gx1 = w - .4;
      qy(0, w, by, 0, .45, dk(wall, .45));
      qy(gx0 - .1, gx1 + .1, by, .45, 2.75, dark);
      const n = Math.max(2, Math.round((gx1 - gx0) / 1.5));
      wins('y', gx0, gx1, by, .5, 2.7, { ww: (gx1 - gx0) / n - .001, gap: 0, n, on: true, frame: dark, mullion: 'h', glowc: ['#fff3c8', '#ffe6a0'] });
      // shelves + sale posters seen through the glass
      const sh = () => { for (let x = gx0 + .2; x + .9 < gx1; x += 1.5) { qy(x, x + 1.0, by, .55, 1.5, '#d9d2c0'); for (let z = .62; z < 1.45; z += .3) for (let k = 0; k < 4; k++) qy(x + .06 + k * .23, x + .24 + k * .23, by, z, z + .2, ['#e2574c', '#f2c230', '#7cc27a', '#4d96ff', '#e8843a', '#f6efe0'][Math.floor(hash2(k, Math.round(z * 10), Math.round(x * 3) + (p.seed || 1)) * 6)]); } };
      sh(); glow(sh);
      for (let i = 0; i < n; i += 2) { const x = gx0 + (i + .2) * (gx1 - gx0) / n; lit(() => { qy(x, x + .7, by + .01, 1.85, 2.5, i % 4 ? '#ffe14a' : '#e2574c'); txt('y', i % 4 ? '99C' : '-50', x + .02, by + .02, 2.3, i % 4 ? '#c8271f' : '#fff8e8'); }); }
      // cart corral baked at the wall
      carts(gx0 + .5, Math.min(6, Math.floor((gx1 - gx0 - 2) / .35)), by);
      if (gx1 - gx0 > 6.5) produce(gx0 + 4.0, by + .1, Math.min(5, Math.floor((gx1 - gx0 - 4.5) / .65)), r);
      if (ENV.season === 2) for (let i = 0; i < 3; i++) ball(gx1 - .5 - i * .45, by + .4, .18, .2, '#e8843a', { squash: .8 });
      // canopy over the front walk
      for (let x = gx0 + 2.2; x < w - .5; x += 3) box(x, d - .3, 0, .2, .2, 2.95, '#d8dce0', { ol: false });
      box(w - .25, d - .3, 0, .2, .2, 2.95, '#d8dce0', { ol: false });
      box(6.0, by, 2.95, w - 6.0, 1.2, .22, grn); qy(6.0, w, d, 2.95, 3.17, dk(ac, .1)); glow(() => qy(6.2, w - .2, d, 2.88, 2.95, '#fff3c8'));
      snowTop(6.0, w, by, d, 3.171, .15);
      // entrance portal
      box(1.6, by - .3, 0, 4.8, 1.5, H + .5, ac);
      qy(1.6, 6.4, d, 0, .3, dk(ac, .45)); qy(1.9, 6.1, d, .3, 2.6, dk(ac, .3));
      door('y', 4, d, { c: '#dfe6ea', double: true, w: 2.2, h: 2.2, frame: dark, full: true, glowc: ['#fff3c8', '#ffe6a0'], handle: dark });
      win('y', 2.0, 2.75, d, .5, 2.3, { on: true, frame: dark }); win('y', 5.25, 6.0, d, .5, 2.3, { on: true, frame: dark });
      lit(() => { qy(1.8, 6.2, d + .01, 2.75, H + .3, grn); sign('y', n1, 1.8, 6.2, d + .02, 3.25, H + .2, null, '#fff8e8', { s: txtW(n1, 2) < 4.2 ? 2 : 1 }); sign('y', n2, 1.8, 6.2, d + .02, 2.8, 3.25, null, '#ffe14a'); });
      // leaf logo
      lit(() => { const q = PW(1.95, d + .02, H + .2); for (let k = 0; k < 4; k++) { px(q[0] + 2 + k, q[1] + 3 + (k >> 1) - k, C('#c8f06a')); px(q[0] + 2 + k, q[1] + 4 + (k >> 1) - k, C('#c8f06a')); } });
      snowTop(1.6, 6.4, by - .3, d, H + .501);
      // small windows left of the portal + bench
      win('y', .35, 1.3, by, 1.0, 2.2, { on: true, frame: dark, mullion: 'v' });
      box(.3, by + .1, 0, 1.1, .4, .4, '#8a6f5a');
    },
  },
  /* ------------------------------------------------------------ Bayside Clinic */
  {
    id: 'bld.civic.clinic', kind: 'building', tags: ['civic', 'clinic', 'health', 'enterable'],
    size: p => [p.w || 9, p.d || 7, (p.floors || 2) * 2 + .3], vb: VB(p => [p.w || 9, p.d || 7, (p.floors || 2) * 2 + .3], 1.5, .6, 3),
    door: { side: 'y', at: 2.2 }, light: { x: 2.2, y: 8.2, z: 0, r: 4.5 }, lightFor: p => ({ x: 2.2, y: (p.d || 7) + 1.2, z: 0, r: 4.5 }),
    variants: [{ w: 9, d: 7, floors: 2, seed: 5, name: 'BAYSIDE CLINIC' }, { w: 11, d: 8, floors: 3, seed: 16, name: 'BAYSIDE CLINIC' }, { w: 8, d: 6, floors: 1, seed: 33, name: 'BAYSIDE CLINIC', accent: '#2f8fd0' }, { w: 9, d: 7, floors: 2, seed: 47, name: 'DENTAL CARE', accent: '#5a8fe0' }],
    draw(p) {
      const w = p.w || 9, d = p.d || 7, fl = p.floors || 2, H = fl * 2, r = rng(p.seed || 1), wall = '#f4f6f4', tl = p.accent || '#1fa39a', dark = '#3a4a54', nm = p.name || 'BAYSIDE CLINIC';
      box(0, 0, 0, w, d, H, wall);
      qy(0, w, d, 0, .45, dk(tl, .25)); qx(w, 0, d, 0, .45, dk(tl, .42));
      for (let f = 0; f < fl; f++) {
        if (f > 0) wins('y', .4, w - .4, d, f * 2 + .6, f * 2 + 1.55, { ww: 1.1, gap: .5, r, p: .5, mullion: 'v', frame: dark, each: () => r() < .6 ? { blind: .3 + r() * .4 } : null });
        wins('x', .5, d - .5, w, f * 2 + .6, f * 2 + 1.55, { ww: 1.1, gap: .6, r, p: .5, mullion: 'v', frame: dark, each: () => r() < .6 ? { blind: .3 + r() * .4 } : null });
        qy(0, w, d, f * 2 + 1.75, f * 2 + 1.95, dk(tl, .18)); qx(w, 0, d, f * 2 + 1.75, f * 2 + 1.95, dk(tl, .36));
      }
      // ground floor front: waiting room glazing + entrance
      wins('y', 4.0, w - .4, d, .6, 1.6, { ww: 1.1, gap: .2, on: true, frame: dark, glowc: ['#f4fff8', '#d8f4e8'] });
      for (let x = 4.3; x + .4 < w - .5; x += 1.3) { const q = () => { qy(x, x + .5, d, .62, 1.0, '#8fc4dc'); qy(x + .1, x + .4, d, 1.0, 1.25, '#f0c8a0'); }; }
      door('y', 2.2, d, { c: '#e8eef0', double: true, w: 1.8, h: 1.75, frame: tl, full: true, handle: dark, glowc: ['#f4fff8', '#d8f4e8'] });
      canopy(.8, 3.6, d, 2.0, 1.1, tl, { th: .16, posts: [1.0, 3.4], postc: '#d8dce0' });
      sign('y', nm, 3.9, 3.9 + txtW(nm) + .6, d + .02, 2.0, 2.5, '#ffffff', tl, { lit: true, frame: tl });
      // ramp rail + planter
      lw([.2, d + .5, .5], [1.0, d + .5, .5], '#c9ccd2'); lw([.2, d + .5, 0], [.2, d + .5, .5], '#c9ccd2');
      planter(4.2, d + .05, 0, Math.min(3, w - 4.8), .5, .4, '#d8dce0');
      const f = flatRoof(0, 0, H, w, d, wall, { cap: lt(tl, .25), roof: '#a8a8a4' });
      clutter(r, { ...f, y1: f.y1 - 1.5 }, ['ac2', 'ac', 'vent', 'solar', 'hatch'], 3);
      // lit cross cube on the roof corner
      const cx = .5, cy = d - 1.6; box(cx + .5, cy + .5, H, .25, .25, .5, '#6f757d', { ol: false });
      box(cx, cy, H + .5, 1.3, 1.3, 1.3, '#ffffff');
      lit(() => { qy(cx + .06, cx + 1.24, cy + 1.3, H + .56, H + 1.74, '#ffffff'); qx(cx + 1.3, cy + .06, cy + 1.24, H + .56, H + 1.74, '#e8f4f0'); icon('y', CROSS, cx + .65 - iconW(CROSS, 2) / 2, cy + 1.31, H + 1.72, { c: tl }, 2); icon('x', CROSS, cy + .65 + iconW(CROSS, 2) / 2, cx + 1.31, H + 1.72, { c: dk(tl, .15) }, 2); });
      snowTop(cx, cx + 1.3, cy, cy + 1.3, H + 1.801, .1);
    },
  },
  /* ------------------------------------------------------------ hospital with helipad */
  {
    id: 'bld.civic.hospital', kind: 'building', tags: ['civic', 'hospital', 'health', 'landmark'],
    size: [16, 12, 12.3], vb: [-.4, -.4, 0, 16.6, 13.4, 15],
    door: { side: 'y', at: 4 }, light: { x: 4, y: 13.2, z: 0, r: 6 },
    variants: [{ seed: 7, name: 'MAPLE BAY GENERAL' }, { seed: 21, name: 'ST. CLARE HOSPITAL', accent: '#2f8fd0', wall: '#eef0f4' }, { seed: 36, name: 'MAPLE BAY GENERAL', wall: '#e9dcc8', accent: '#2a9d6f' }],
    draw(p) {
      const r = rng(p.seed || 1), wall = p.wall || '#f1f3f1', tl = p.accent || '#1fa39a', dark = '#3a4a54', red = '#d93a34', nm = p.name || 'MAPLE BAY GENERAL', W = 16, HS = 12, SD = 7, HP = 4;
      // ward slab
      box(0, 0, 0, W, SD, HS, wall);
      for (let f = 2; f < 6; f++) {
        const z0 = f * 2 + .55, z1 = f * 2 + 1.5;
        qy(.3, W - .3, SD, z0 - .08, z1 + .08, dark); wins('y', .4, W - .4, SD, z0, z1, { ww: .92, gap: .08, r, p: .5, frame: dark, each: () => r() < .35 ? { blind: .5 } : (r() < .2 ? { glowc: ['#d8f0ff', '#b8e0f4'] } : null) });
        qx(W, .3, SD - .3, z0 - .08, z1 + .08, dk(dark, .2)); wins('x', .4, SD - .4, W, z0, z1, { ww: .92, gap: .08, r, p: .5, frame: dark });
        qy(0, W, SD, f * 2 + 1.72, f * 2 + 1.9, dk(tl, .18)); qx(W, 0, SD, f * 2 + 1.72, f * 2 + 1.9, dk(tl, .36));
      }
      // stair core stripe + big cross on the slab
      qy(0, 2.6, SD, HP, HS, dk(tl, .18)); for (let f = 2; f < 6; f++) win('y', .9, 1.7, SD, f * 2 + .3, f * 2 + 1.7, { on: true, frame: dk(tl, .5), glowc: ['#f4fff8', '#d8f4e8'] });
      qx(W, 0, SD, HP, HP + .0, dark);
      const fs = flatRoof(0, 0, HS, W, SD, wall, { cap: lt(tl, .3), roof: '#9a9c9a' });
      // helipad
      const hx = 10.6, hy = 3.3;
      box(hx - 2.9, hy - 2.7, HS, 5.8, 5.4, .35, '#6f757d'); disc(hx, hy, HS + .36, 2.5, winter() ? '#8d9aa4' : '#5d646e'); disc(hx, hy, HS + .36, 2.25, '#f2c230'); disc(hx, hy, HS + .36, 2.05, winter() ? '#8d9aa4' : '#5d646e');
      for (const [a, b, c, e] of [[-.6, -.9, -.6, .9], [.6, -.9, .6, .9], [-.6, 0, .6, 0]]) for (const o of [0, .08, .16]) lw([hx + a + o, hy + b, HS + .36], [hx + c + o, hy + e, HS + .36], '#ffffff');
      lit(() => { for (let a = 0; a < 8; a++) { const q = PW(hx + Math.cos(a * Math.PI / 4 + .4) * 2.5, hy + Math.sin(a * Math.PI / 4 + .4) * 2.5, HS + .36); px(q[0], q[1], C(a % 2 ? '#7dff9a' : '#ff5a4a')); } });
      ROOF.hatch(1, 1.5, HS); ROOF.ac2(3.2, 1, HS); ROOF.ac2(3.2, 3.2, HS); ROOF.antenna(.8, 4.5, HS); ROOF.dish(2, 4.6, HS);
      // name + cross on the slab top band
      lit(() => { qy(.35, 2.25, SD + .01, HS - 2.3, HS - .4, '#ffffff'); icon('y', CROSS, 1.3 - iconW(CROSS, 3) / 2, SD + .02, HS - .5, { c: tl }, 3); });
      // podium
      box(0, SD, 0, W, 12 - SD, HP, wall);
      qy(0, W, 12, 0, .45, dk(tl, .25)); qx(W, SD, 12, 0, .45, dk(tl, .42)); qx(W, 0, SD, 0, .45, dk(tl, .42));
      for (let f = 0; f < 2; f++) {
        wins('x', .5, 11.5, W, f * 2 + .6, f * 2 + 1.55, { ww: 1.1, gap: .5, r, p: .6, mullion: 'v', frame: dark });
        qy(0, W, 12, f * 2 + 1.72, f * 2 + 1.9, dk(tl, .18)); qx(W, 0, 12, f * 2 + 1.72, f * 2 + 1.9, dk(tl, .36));
      }
      wins('y', .4, W - .4, 12, 2.6, 3.55, { ww: 1.1, gap: .4, r, p: .6, mullion: 'v', frame: dark, each: () => r() < .4 ? { blind: .5 } : null });
      wins('y', 6.3, 9.4, 12, .6, 1.6, { ww: 1.3, gap: .2, on: true, frame: dark, glowc: ['#f4fff8', '#d8f4e8'] });
      // main entrance
      door('y', 4, 12, { c: '#e8eef0', double: true, w: 2.2, h: 1.8, frame: tl, full: true, handle: dark, glowc: ['#f4fff8', '#d8f4e8'] });
      win('y', 1.2, 2.6, 12, .6, 1.6, { on: true, frame: dark, mullion: 'v' });
      canopy(2.2, 5.8, 12, 2.05, 1.2, tl, { th: .18 });
      sign('y', nm, 4 - txtW(nm) / 2 - .2, 4 + txtW(nm) / 2 + .2, 13.21, 2.05, 2.5, '#ffffff', tl, { lit: true, frame: tl });
      // emergency bay
      shutter('y', 10.2, 12.6, 12, 0, 1.9, '#dfe4e8', { step: 4 }); glow(() => qy(10.3, 12.5, 12, .1, 1.8, '#fff3c8', 'glass'));
      door('y', 14, 12, { c: '#e8eef0', double: true, w: 1.6, h: 1.75, frame: red, full: true, handle: dark });
      box(9.8, 12, 2.1, 5.8, 1.2, .5, red); lit(() => qy(9.85, 15.55, 13.2, 2.14, 2.56, red)); lit(() => sign('y', 'EMERGENCY', 9.9, 15.5, 13.21, 2.12, 2.58, null, '#ffffff'));
      for (const x of [10, 15.3]) box(x, 12.9, 0, .2, .2, 2.1, '#d8dce0', { ol: false });
      snowTop(9.8, 15.6, 12, 13.2, 2.601, .15);
      const fp = flatRoof(0, SD, HP, W, 12 - SD, wall, { cap: lt(tl, .3), roof: '#9a9c9a' });
      clutter(r, { ...fp, x0: fp.x0 + .5 }, ['sky', 'ac2', 'vent', 'garden', 'sky', 'ac'], 6);
    },
  },
  /* ------------------------------------------------------------ fire station */
  {
    id: 'bld.civic.firestation', kind: 'building', tags: ['civic', 'fire', 'emergency'],
    size: p => [p.w || 12, p.d || 8, 4.8], vb: VB(p => [p.w || 12, p.d || 8, 4.8], .8, .6, 7.5),
    door: { side: 'y', at: 1.2 }, light: { x: 6, y: 9, z: 0, r: 5 }, lightFor: p => ({ x: (p.w || 12) / 2, y: (p.d || 8) + 1, z: 0, r: 5 }),
    variants: [{ w: 12, d: 8, seed: 3, name: 'FIRE STATION 3' }, { w: 9, d: 8, seed: 12, name: 'FIRE STATION 7', wall: '#c9b48a' }, { w: 15, d: 9, seed: 29, name: 'MAPLE BAY FIRE DEPT', wall: '#9a4a3a' }],
    draw(p) {
      const w = p.w || 12, d = p.d || 8, r = rng(p.seed || 1), wall = p.wall || '#b5553f', stone = '#eadfc8', red = '#c8271f', H = 4.5, nm = p.name || 'FIRE STATION';
      // hose tower at the back-left
      box(0, 0, 0, 2.6, 2.6, 9.5, wall, wallPat('brick', wall));
      for (const z of [6.9, 7.3, 7.7, 8.1]) { lw([.6, 2.6, z], [2.0, 2.6, z], dk(wall, .6)); lw([2.6, .6, z], [2.6, 2.0, z], dk(wall, .7)); }
      qy(.5, 2.1, 2.6, 6.7, 8.3, dk(wall, .4), dk(wall, .55)); qx(2.6, .5, 2.1, 6.7, 8.3, dk(wall, .55), dk(wall, .65));
      box(-.12, -.12, 9.5, 2.84, 2.84, .3, stone); hip(0, 0, 9.8, 2.6, 2.6, 1.3, '#5a5f68', { over: .05 }); if (winter()) fq([[2.6, 2.6, 9.8], [0, 2.6, 9.8], [1.3, 1.3, 11.1]], SNOW, 'glass');
      lw([1.3, 1.3, 11.1], [1.3, 1.3, 12.2], '#c9ccd2'); lit(() => { const q = PW(1.3, 1.3, 12.2); px(q[0], q[1], C('#ff5a4a')); px(q[0], q[1] + 1, C('#ff5a4a')); });
      // main hall
      box(0, 0, 0, w, d, H, wall, wallPat('brick', wall));
      // redraw the tower above the hall roofline (it stands inside the footprint)
      qy(0, w, d, 0, .4, dk(stone, .3)); qx(w, 0, d, 0, .4, dk(stone, .45));
      qy(0, w, d, 2.9, 3.1, dk(stone, .18)); qx(w, 0, d, 2.9, 3.1, dk(stone, .36));
      // personnel door + bays
      door('y', 1.2, d, { c: red, frame: stone, transom: true }); lamp('y', .45, d, 1.9, '#ffb0a0');
      const b0 = 2.3, nb = Math.max(1, Math.floor((w - b0 - .3) / 3.1)), bw = (w - b0 - .3) / nb;
      for (let i = 0; i < nb; i++) {
        const x0 = b0 + i * bw + .25, x1 = b0 + (i + 1) * bw - .25;
        qy(x0 - .15, x1 + .15, d, 0, 2.75, stone);
        qy(x0, x1, d, 0, 2.6, PAT.siding(red, 5));
        wins('y', x0 + .15, x1 - .15, d, 1.45, 2.05, { ww: .5, gap: .14, r, p: .8, frame: dk(red, .5), glowc: ['#ffe9b0', '#ffd98a'] });
        lw([x0, d, 0], [x0, d, 2.6], dk(red, .6)); lw([x1, d, 0], [x1, d, 2.6], dk(red, .6)); lw([x0, d, 2.6], [x1, d, 2.6], dk(red, .6));
        txt('y', String(i + 1), (x0 + x1) / 2 - .1, d + .01, 1.2, '#ffe9b0');
        lit(() => { const q = PW((x0 + x1) / 2, d + .01, 2.82); px(q[0], q[1], C('#ff5a4a')); px(q[0] + 1, q[1], C('#ff5a4a')); });
        box(x0 - .25, d, 0, .14, .14, .7, '#f2c230', { ol: false }); box(x1 + .1, d, 0, .14, .14, .7, '#f2c230', { ol: false });
      }
      sign('y', nm, w / 2 + 1.1 - txtW(nm) / 2 - .3, w / 2 + 1.1 + txtW(nm) / 2 + .3, d + .01, 3.3, 3.85, '#2a2233', '#f2c230', { lit: true });
      wins('y', .4, 2.0, d, 3.3, 4.0, { ww: .7, n: 2, r, mullion: 'v', trim: stone });
      wins('x', 3.2, d - .5, w, .9, 2.2, { ww: 1, gap: .9, r, p: .6, mullion: 'cross', trim: dk(stone, .2), sill: true });
      wins('x', 3.2, d - .5, w, 3.3, 4.0, { ww: 1, gap: .9, r, p: .6, mullion: 'v', trim: dk(stone, .2) });
      door('x', 1.5, w, { c: dk(red, .15), glass: false, frame: dk(stone, .2) });
      cornice(w, d, H - .2, stone, .2, .12);
      const f = flatRoof(0, 0, H, w, d, wall, { cap: stone });
      // tower again (upper part) so it sits in front of the roof floor
      box(0, 0, H, 2.6, 2.6, 9.5 - H, wall, wallPat('brick', wall));
      qy(.5, 2.1, 2.6, 6.7, 8.3, dk(wall, .5), dk(wall, .62)); qx(2.6, .5, 2.1, 6.7, 8.3, dk(wall, .6), dk(wall, .7));
      for (const z of [6.9, 7.3, 7.7, 8.1]) { lw([.5, 2.6, z], [2.1, 2.6, z], stone); lw([2.6, .5, z], [2.6, 2.1, z], dk(stone, .2)); }
      box(-.12, -.12, 9.5, 2.84, 2.84, .3, stone); hip(0, 0, 9.8, 2.6, 2.6, 1.3, '#5a5f68', { over: .05 }); if (winter()) fq([[2.6, 2.6, 9.8], [0, 2.6, 9.8], [1.3, 1.3, 11.1]], SNOW, 'glass');
      lw([1.3, 1.3, 11.1], [1.3, 1.3, 12.2], '#c9ccd2'); lit(() => { const q = PW(1.3, 1.3, 12.2); px(q[0], q[1], C('#ff5a4a')); px(q[0], q[1] + 1, C('#ff5a4a')); });
      clutter(r, { ...f, x0: f.x0 + 3 }, ['ac2', 'ac', 'vent', 'hatch', 'sky'], 3);
      // siren + flag
      box(w - 1.6, d - 1.6, H, .2, .2, 1.1, '#6f757d', { ol: false }); box(w - 1.85, d - 1.75, H + 1.1, .7, .5, .35, '#d93a34');
      flag(w - .6, d - .5, H + .3, 2.4, '#c8271f', '#fff6e0');
    },
  },
  /* ------------------------------------------------------------ police station */
  {
    id: 'bld.civic.police', kind: 'building', tags: ['civic', 'police', 'emergency'],
    size: p => [p.w || 10, p.d || 8, (p.floors || 3) * 2 + .3], vb: VB(p => [p.w || 10, p.d || 8, (p.floors || 3) * 2 + .3], 1.2, .6, 4.5),
    door: { side: 'y', at: 2.2 }, light: { x: 2.2, y: 9, z: 0, r: 4.5 }, lightFor: p => ({ x: 2.2, y: (p.d || 8) + 1, z: 0, r: 4.5 }),
    variants: [{ w: 10, d: 8, floors: 3, seed: 6, name: 'POLICE' }, { w: 12, d: 8, floors: 2, seed: 18, name: 'POLICE', wall: '#c9c2b0' }, { w: 9, d: 7, floors: 3, seed: 30, name: 'POLICE', wall: '#7f8fa8' }],
    draw(p) {
      const w = p.w || 10, d = p.d || 8, fl = p.floors || 3, H = fl * 2, r = rng(p.seed || 1), wall = p.wall || '#9aa9ba', stone = '#e8e6de', blue = '#1f4fa8', dark = '#2a3550', nm = p.name || 'POLICE';
      box(0, 0, 0, w, d, H, wall, wallPat('stone', wall));
      qy(0, w, d, 0, .5, PAT.stone(dk(dark, .0))); qx(w, 0, d, 0, .5, PAT.stone(dk(dark, .2)));
      // battenburg band
      const chk = (a, b) => (u, v) => ((u >> 2) + (v >> 2)) & 1 ? a : b;
      qy(0, w, d, 2.05, 2.55, chk(blue, '#f4f6f8')); qx(w, 0, d, 2.05, 2.55, chk(dk(blue, .2), '#d0d6dc'));
      for (let f = 0; f < fl; f++) {
        if (f > 0) wins('y', .4, w - .4, d, f * 2 + .75, f * 2 + 1.65, { ww: .9, gap: .6, r, p: .55, mullion: 'cross', trim: stone, sill: true });
        wins('x', f ? .5 : 3.6, d - .5, w, f * 2 + .75, f * 2 + 1.65, { ww: .9, gap: .7, r, p: .55, mullion: 'cross', trim: dk(stone, .2), sill: true });
      }
      // patrol garage on the side
      shutter('x', .6, 3.0, w, 0, 1.9, '#5a6f8a', { step: 3 }); lit(() => { const q = PW(w + .01, 1.8, 2.0); px(q[0], q[1] - 1, C('#5f9bff')); px(q[0] + 1, q[1] - 1, C('#5f9bff')); });
      // ground front: barred windows + entrance portal
      wins('y', 4.2, w - .4, d, .8, 1.7, { ww: .9, gap: .6, r, p: .7, mullion: 'cross', trim: stone, sill: true });
      box(.9, d, 0, 2.6, .5, 2.6, stone, wallPat('stone', stone));
      door('y', 2.2, d + .5, { c: dark, double: true, w: 1.5, h: 1.8, frame: blue, full: true });
      sign('y', nm, 1.0, 3.4, d + .51, 2.0, 2.5, blue, '#ffffff', { lit: true });
      stairs(1.2, 3.2, d + .5, 2, stone, { dep: .22, rise: .1 });
      // blue lamps
      for (const x of [.6, 3.8]) { box(x - .08, d + .2, 0, .16, .16, 1.9, dark, { ol: false }); box(x - .2, d + .08, 1.9, .4, .4, .5, '#3f7fe0'); lit(() => { qy(x - .16, x + .16, d + .48, 1.96, 2.34, '#6fb0ff'); qx(x + .2, d + .12, d + .44, 1.96, 2.34, '#4f90f0'); }); halo(x, d + .3, 2.15, 7, '#5f9bff'); }
      // noticeboard
      qy(4.6, 5.8, d + .01, 1.85, 1.9, stone);
      cornice(w, d, H - .2, stone, .2, .12);
      const f = flatRoof(0, 0, H, w, d, wall, { cap: stone });
      clutter(r, { ...f, x0: f.x0 + 2.2 }, ['ac2', 'ac', 'vent', 'dish', 'hatch'], 3);
      // radio mast
      const mx = 1.4, my = 1.6; box(mx - .25, my - .25, H, .5, .5, .3, '#6f757d');
      for (let z = 0; z < 3.6; z += .6) { lw([mx - .18, my, H + .3 + z], [mx + .18, my, H + .9 + z], '#8d939b'); lw([mx + .18, my, H + .3 + z], [mx - .18, my, H + .9 + z], '#8d939b'); }
      lw([mx - .18, my, H + .3], [mx - .18, my, H + 3.9], '#6f757d'); lw([mx + .18, my, H + .3], [mx + .18, my, H + 3.9], '#6f757d'); lw([mx, my, H + 3.9], [mx, my, H + 4.6], '#6f757d');
      lit(() => { const q = PW(mx, my, H + 4.6); px(q[0], q[1], C('#ff5a4a')); px(q[0], q[1] + 1, C('#ff5a4a')); });
      flag(w - .6, d - .5, H + .3, 2.2, blue, '#ffffff');
    },
  },
  /* ------------------------------------------------------------ post office */
  {
    id: 'bld.civic.postoffice', kind: 'building', tags: ['civic', 'post', 'shop'],
    size: p => [p.w || 9, p.d || 7, 4.3], vb: VB(p => [p.w || 9, p.d || 7, 4.3], 1.2, .6, 3),
    door: { side: 'y', at: 1.6 }, light: { x: 1.6, y: 8, z: 0, r: 4 }, lightFor: p => ({ x: 1.6, y: (p.d || 7) + 1, z: 0, r: 4 }),
    variants: [{ w: 9, d: 7, seed: 8, name: 'POST OFFICE' }, { w: 11, d: 7, seed: 22, name: 'MAPLE BAY POST', wall: '#e9d9b8' }, { w: 8, d: 6, seed: 40, name: 'POST OFFICE', wall: '#d9e0e4', roof: '#4a5f7a' }],
    draw(p) {
      const w = p.w || 9, d = p.d || 7, r = rng(p.seed || 1), wall = p.wall || '#f1e6cc', blue = '#2756a8', red = '#d2392f', yel = '#f2c230', roof = p.roof || '#b5553f', H = 4, nm = p.name || 'POST OFFICE';
      box(0, 0, 0, w, d, H, wall, wallPat('stucco', wall));
      qy(0, w, d, 0, .5, PAT.brick(dk('#a8553f', .18))); qx(w, 0, d, 0, .5, PAT.brick(dk('#a8553f', .36)));
      // brand stripe
      qy(0, w, d, 2.55, 2.8, blue); qy(0, w, d, 2.45, 2.55, red); qx(w, 0, d, 2.55, 2.8, dk(blue, .2)); qx(w, 0, d, 2.45, 2.55, dk(red, .2));
      // front: door, windows, sign
      door('y', 1.6, d, { c: blue, double: true, w: 1.5, h: 1.75, frame: '#fff8e8', full: true, transom: true });
      wins('y', 3.2, w - 2.6, d, .8, 1.9, { ww: 1.1, gap: .3, on: true, mullion: 'cross', trim: '#fff8e8', sill: true });
      sign('y', nm, 2.9, 2.9 + txtW(nm) + .9, d + .01, 3.0, 3.6, blue, '#ffffff', { lit: true });
      lit(() => icon('y', HORN, 3.0, d + .02, 3.48, { y: yel }));
      icon('y', HORN, 3.0 + txtW(nm) + .45, d + .02, 3.48, { y: yel });
      // clock above the door
      const q = PW(1.6, d + .01, 3.3); for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) if (a * a + b * b <= 17) px(q[0] + a, q[1] + b + (a >> 1), C(a * a + b * b > 10 ? '#3a3350' : '#fff8e0')); px(q[0], q[1], C('#3a3350')); px(q[0], q[1] - 1, C('#3a3350')); px(q[0] + 1, q[1] + 0, C('#3a3350'));
      // parcel lockers + mailbox baked at the wall
      const lx = w - 2.4; box(lx, d, 0, 2.0, .4, 1.7, yel);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { qy(lx + .08 + i * .38, lx + .4 + i * .38, d + .4, .12 + j * .4, .44 + j * .4, (i + j) % 5 === 0 ? '#39404c' : dk(yel, .12)); }
      lit(() => qy(lx + .84, lx + 1.16, d + .41, .95, 1.22, '#7df9ff'));
      box(2.75, d + .05, 0, .5, .45, 1.0, blue); qy(2.82, 3.18, d + .5, .7, .78, '#1a2f66'); qy(2.82, 3.18, d + .5, .3, .55, '#fff8e8'); snowTop(2.75, 3.25, d + .05, d + .5, 1.001, .05);
      // side: loading bay + windows
      shutter('x', .8, 3.0, w, .5, 2.3, '#8fa0b4', { step: 3 }); box(w, .7, 0, .4, 2.4, .5, '#6f757d');
      wins('x', 3.6, d - .5, w, .9, 1.9, { ww: 1, gap: .7, r, p: .6, mullion: 'cross', trim: '#e8dcc0', sill: true });
      txt('x', 'PARCELS', 2.9, w + .01, 3.5, dk(wall, .5));
      awning(.6, 2.6, d, 2.0, { c: blue, c2: '#fff8e8', dep: .7, drop: .35, stripe: .5 });
      // hip roof with cupola
      box(-.12, -.12, H - .15, w + .24, d + .24, .2, '#fff8e8');
      hip(0, 0, H + .05, w, d, 1.7, roof, { over: .15, inset: .25 });
      if (winter()) { const k = Math.min(w, d) / 2 * .75; qz(k, w - k, k, d - k, H + 1.76, SNOW); fq([[.3, d, H + .1], [w - .3, d, H + .1], [w - k, d - k, H + 1.72], [k, d - k, H + 1.72]], SNOW, 'glass'); }
      flag(w / 2, d / 2, H + 1.75, 2.2, blue, yel);
    },
  },
  /* ------------------------------------------------------------ community centre */
  {
    id: 'bld.civic.community', kind: 'building', tags: ['civic', 'community', 'hall'],
    size: p => [p.w || 10, p.d || 8, 3.4], vb: VB(p => [p.w || 10, p.d || 8, 3.4], 1.4, .6, 4),
    door: { side: 'y', at: 2.2 }, light: { x: 2.2, y: 9.2, z: 0, r: 4 }, lightFor: p => ({ x: 2.2, y: (p.d || 8) + 1.2, z: 0, r: 4 }),
    variants: [{ w: 10, d: 8, seed: 5, name: 'COMMUNITY CENTRE' }, { w: 12, d: 8, seed: 17, name: 'MAPLEWOOD HALL', wall: '#e9c98a', roof: '#4f6f8a' }, { w: 9, d: 7, seed: 28, name: 'SENIORS CLUB', wall: '#d9a0a0', roof: '#5a5f68' }, { w: 11, d: 8, seed: 42, name: 'YOUTH CLUB', wall: '#8fb8d8', roof: '#a8553f', mural: 'bubbles' }],
    draw(p) {
      const w = p.w || 10, d = p.d || 8, r = rng(p.seed || 1), wall = p.wall || '#a8c8a0', trim = '#fff8e8', roof = p.roof || '#8a4b3a', H = 3.2, nm = p.name || 'COMMUNITY CENTRE';
      box(0, 0, 0, w, d, H, wall, wallPat('siding', wall));
      qy(0, w, d, 0, .4, PAT.stone('#a8a49c')); qx(w, 0, d, 0, .4, PAT.stone('#8d8884'));
      // side wall: kids' mural + high windows
      mural('x', p.mural || pick(r, ['bubbles', 'hills', 'rainbow', 'memphis']), 1.0, d - 1.0, w + .01, .6, 2.1, (p.seed || 1) + 2);
      wins('x', .6, d - .6, w, 2.35, 2.95, { ww: 1.2, gap: .6, r, p: .7, mullion: 'v', trim: dk(trim, .2) });
      // front: door under porch, hall windows, noticeboard
      door('y', 2.2, d, { c: '#c8572f', double: true, w: 1.6, h: 1.8, frame: trim, full: true });
      wins('y', 4.4, w - .5, d, .8, 2.3, { ww: 1.1, gap: .5, r, p: .8, mullion: 'cross', trim, sill: true, each: () => r() < .4 ? { fbox: true } : null });
      qy(.3, 1.1, d + .01, .8, 1.9, '#8a6f5a'); qy(.36, 1.04, d + .01, .86, 1.84, '#d9c9a8'); for (let i = 0; i < 6; i++) qy(.4 + (i % 2) * .32, .66 + (i % 2) * .32, d + .02, .92 + Math.floor(i / 2) * .3, 1.14 + Math.floor(i / 2) * .3, pick(r, ['#fff8e8', '#ffd166', '#ff8fb0', '#8fd3e8', '#c8f06a']));
      // roof
      gable(0, 0, H, w, d, 2.2, 'x', roof, { wall, over: .25 }); gableSnow(0, 0, H, w, d, 2.2, 'x');
      // cupola + weather vane
      const cx = w / 2, cy = d / 2; box(cx - .5, cy - .5, H + 1.9, 1, 1, .8, trim); qy(cx - .3, cx + .3, cy + .5, H + 2.05, H + 2.55, dk(roof, .3)); hip(cx - .6, cy - .6, H + 2.7, 1.2, 1.2, .7, roof, { over: 0 });
      lw([cx, cy, H + 3.4], [cx, cy, H + 4.1], '#3d3a4a'); lw([cx - .3, cy, H + 3.9], [cx + .3, cy, H + 3.9], '#3d3a4a');
      // porch: posts + lean-to roof + sign + bunting
      const px0 = .8, px1 = 3.9;
      for (const x of [px0 + .1, px1 - .1]) box(x - .08, d + 1.0, 0, .16, .16, 2.3, trim, { ol: false });
      fq([[px0, d, 2.75], [px1, d, 2.75], [px1, d + 1.25, 2.3], [px0, d + 1.25, 2.3]], winter() ? SNOW : lt(roof, .12)); fq([[px1, d, 2.75], [px1, d + 1.25, 2.3], [px1, d, 2.3]], dk(roof, .4));
      qy(px0, px1, d + 1.25, 2.16, 2.3, dk(roof, .3)); lw([px0, d + 1.25, 2.16], [px1, d + 1.25, 2.16], dk(roof, .7)); lw([px0, d, 2.75], [px0, d + 1.25, 2.3], dk(roof, .7));
      glow(() => qy(px0 + .2, px1 - .2, d + 1.25, 2.1, 2.16, '#ffe9b0'));
      sign('y', nm, 4.3, Math.min(w - .2, 4.6 + txtW(nm) + .3), d + .01, 2.55, 3.05, trim, '#4a3a34');
      const BC = ['#e2574c', '#f2c230', '#3fa7a0', '#8d7fd1', '#ef8fb0', '#5fa8e0'];
      for (let x = 4.3, i = 0; x < w - .3; x += .32, i++) { const sag = Math.sin((x - 4.3) / (w - 4.6) * Math.PI) * .18; fq([[x, d + .02, 2.5 - sag], [x + .26, d + .02, 2.5 - sag], [x + .13, d + .02, 2.24 - sag]], BC[i % 6]); }
      box(3.0, d + .1, 0, 1.2, .5, .08, '#8d8884', { ol: false });
    },
  },
];
