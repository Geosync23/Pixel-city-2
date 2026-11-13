// Private cars + two-wheelers. All vehicles lie along x; p.dir = 1 drives toward +x, -1 toward -x.
// Common params: color, dir, lights (false = lamps off), parked (true = lamps off, winter snow on the roof), beam (false = no road beam).
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, mix, ENV, PW, px, C, isFlipped } from '../../engine/raster.js';
import { mk, COL, disc, wheel, lamp, halo } from './_lib.js';

const CARC = ['#d64545', '#3b5bdb', '#f1efe8', '#2f9e44', '#7a7f8c', '#e8a33a', '#2b2a38', '#8fc9b8', '#b5654a', '#6d4c9a'];
export const cv = (cols, extra) => { const out = []; cols.forEach((c, i) => out.push(Object.assign({ color: c, dir: i % 3 === 1 ? -1 : 1 }, extra || {}))); return out; };
export const vbOf = (len, wid, h) => [-2.9, -.5, 0, len + 2.9, wid + .5, h + .4];

/** generic car from a spec; returns the builder for extras */
export function stdCar(p, s) {
  const K = mk(p, s.len, s.wid, s.col), zb = s.zb || .3, wr = s.wr || .3, col = K.col;
  K.beam(); K.chassis(zb);
  K.body(s.body, 0, s.wid, zb);
  if (s.pre) s.pre(K);
  // rocker + waist trim
  K.lineY(.12, zb + .05, s.len - .12, zb + .05, s.wid, dk(col, .3));
  if (s.trim) K.lineY(.1, s.trim, s.len - .1, s.trim, s.wid, s.trimc || lt(col, .35));
  if (s.cab) K.cabin(s.cab, s.ins || .12, s.belt, p.roof || s.roof || col, { pillars: s.pillars, pu: s.pu, pz: s.pz });
  for (const d of (s.doors || [])) K.doorLine(d, zb + .08, s.belt - .02);
  for (const h of (s.handles || [])) K.handle(h, s.belt - .14);
  if (s.mirror) K.mirror(s.mirror, s.belt);
  K.wheels(s.wheels, wr, { hub: s.hub });
  const zt = K.f ? s.body[s.body.length - 1][1] : s.body[0][1];
  K.end(zb, zt, Object.assign({ lz: zt - .22 }, K.f ? s.front : s.rear));
  K.markers(s.body[s.body.length - 1][1] - .16, s.body[0][1] - .16);
  if (s.extra) s.extra(K);
  if (p.parked && ENV.season === 3 && s.snow) K.snow(...s.snow);
  return K;
}

export const SPEC = {
  sedan: { len: 3.2, wid: 1.5, h: 1.3, col: '#d64545', body: [[0, .66], [.1, .8], [.7, .82], [2.35, .82], [3.05, .74], [3.2, .6]], cab: [[.55, .82], [.95, 1.3], [1.9, 1.3], [2.4, .82]], belt: .82, pillars: [1.45], doors: [.98, 1.45, 2.3], handles: [1.08, 1.55], mirror: 2.3, wheels: [.62, 2.58], snow: [1, 1.85, .2, 1.3, 1.3] },
  hatch: { len: 2.8, wid: 1.45, h: 1.35, col: '#3b5bdb', body: [[0, .62], [.06, .8], [2.0, .82], [2.66, .74], [2.8, .58]], cab: [[.04, .82], [.34, 1.35], [1.55, 1.35], [2.05, .82]], belt: .82, pillars: [1.0], doors: [.95, 1.95], handles: [1.05], mirror: 1.95, wheels: [.55, 2.25], snow: [.4, 1.5, .2, 1.25, 1.35] },
  suv: { len: 3.5, wid: 1.6, h: 1.65, col: '#2b2a38', zb: .38, wr: .36, body: [[0, .8], [.06, 1.0], [2.5, 1.0], [3.3, .94], [3.5, .74]], cab: [[.06, 1.0], [.26, 1.6], [2.05, 1.6], [2.55, 1.0]], belt: 1.0, pillars: [.85, 1.55], doors: [.9, 1.6, 2.45], handles: [1.0, 1.7], mirror: 2.45, wheels: [.68, 2.8], trim: .52, trimc: '#3d3b49', snow: [.35, 2.0, .2, 1.4, 1.6],
    extra(K) { K.lineY(.4, 1.66, 1.95, 1.66, .22, '#8d939e'); K.lineY(.4, 1.66, 1.95, 1.66, 1.38, '#c9ced6'); } },
  sports: { len: 3.3, wid: 1.5, h: 1.08, col: '#e8a33a', zb: .26, wr: .29, body: [[0, .6], [.08, .7], [.9, .7], [2.3, .68], [3.0, .58], [3.3, .44]], cab: [[.75, .7], [1.3, 1.05], [1.85, 1.05], [2.45, .68]], belt: .69, ins: .16, doors: [1.3, 2.3], handles: [1.4], mirror: 2.3, wheels: [.6, 2.68], hub: '#d9dde2', trim: .46, trimc: '#2b2a38',
    extra(K) { K.box(.02, .2, .12, 1.38, .84, .9, dk(K.col, .15)); K.lineY(.11, .7, .11, .84, 1.38, dk(K.col, .5)); } },
  beetle: { len: 2.9, wid: 1.45, h: 1.38, col: '#8fc9b8', body: [[0, .5], [.12, .7], [.45, .8], [2.0, .8], [2.45, .74], [2.78, .6], [2.9, .46]], cab: [[.3, .8], [.52, 1.12], [.85, 1.3], [1.3, 1.38], [1.7, 1.3], [1.95, 1.1], [2.12, .8]], belt: .8, pu: .2, pz: .09, pillars: [1.25], doors: [1.25, 2.0], handles: [1.35], wheels: [.55, 2.32], hub: '#f1efe8', front: { grille: false, lw: .3, lh: .2 }, snow: [.9, 1.65, .25, 1.2, 1.36],
    extra(K) { for (const u of [.55, 2.32]) { disc('y', K.X(u), K.wid, .34, .43, (a, b, d, rp) => b > 1 && d > rp - 2.6 ? dk(K.col, .08) : null); } wheel(K.X(.55), K.wid, .3, .3, '#f1efe8'); wheel(K.X(2.32), K.wid, .3, .3, '#f1efe8'); K.lineY(.9, .44, 1.95, .44, K.wid, '#3d3b49'); } },
  pickup: { len: 3.7, wid: 1.6, h: 1.5, col: '#b5654a', zb: .38, wr: .36, body: [[0, .78], [.05, .95], [2.75, .95], [3.5, .9], [3.7, .7]], cab: [[1.55, .95], [1.62, 1.5], [2.35, 1.5], [2.8, .95]], belt: .95, doors: [1.65, 2.7], handles: [1.75], mirror: 2.7, wheels: [.75, 2.95], trim: .52, trimc: '#3d3b49', snow: [1.7, 2.3, .2, 1.4, 1.5],
    pre(K) { const a = Math.min(K.X(.12), K.X(1.5)), b = Math.max(K.X(.12), K.X(1.5)); qz(a, b, .12, 1.48, .96, '#3a3644'); qy(a, b, .12, .8, .96, '#2c2935'); lw([a, 1.48, .96], [b, 1.48, .96], dk(K.col, .5)); if (K.p) return; },
    extra(K) { } },
};

function twoWheel(p, s) {
  // drawn on the plane y = wid/2. u: 0 rear .. len front
  const K = mk(p, s.len, s.wid, s.col), y = s.wid / 2, r = s.r, col = K.col, X = K.X;
  const ring = (u, tyre) => disc('y', X(u), y, r, r, (a, b, d, rp) => d > rp - tyre ? COL.tyre : (s.spoke && (Math.abs(a) < 1 && b !== 0 || Math.abs(b) < 1) ? '#8d939e' : (s.solidHub && d < rp - tyre ? '#8d939e' : null)));
  if (s.beam && K.on) K.beam();
  ring(s.wr, s.tyre); ring(s.wf, s.tyre);
  s.frame(K, y, (u0, z0, u1, z1, c) => lw([X(u0), y, z0], [X(u1), y, z1], c || col));
  // kick stand
  lw([X(s.stand), y, r], [X(s.stand) , y + .18, 0], '#3d3b49');
  return K;
}

const car = (id, key, tags, cols) => ({
  id, kind: 'vehicle', tags: ['transit', 'vehicle', 'car', ...tags], size: [SPEC[key].len, SPEC[key].wid, SPEC[key].h], vb: vbOf(SPEC[key].len, SPEC[key].wid, SPEC[key].h),
  variants: cv(cols), draw(p) { stdCar(p, SPEC[key]); },
});

export default [
  car('veh.car.sedan', 'sedan', ['sedan'], [CARC[0], CARC[1], CARC[2], CARC[4], CARC[6]]),
  car('veh.car.hatch', 'hatch', ['hatchback'], [CARC[1], CARC[5], CARC[3], CARC[0], CARC[7]]),
  car('veh.car.suv', 'suv', ['suv'], [CARC[6], CARC[2], CARC[8], '#31556b']),
  car('veh.car.sports', 'sports', ['sports'], [CARC[5], CARC[0], '#f1efe8', '#22a6b3']),
  car('veh.car.beetle', 'beetle', ['vintage'], [CARC[7], '#f0d9a0', '#e58a8a', '#7fa6d9']),
  car('veh.car.pickup', 'pickup', ['pickup'], [CARC[8], '#31556b', CARC[2], CARC[3]]),
  {
    id: 'veh.scooter', kind: 'vehicle', tags: ['transit', 'vehicle', 'twowheel', 'scooter'], size: [1.5, .6, 1.1], vb: [-2.9, -.4, 0, 4.4, 1, 1.5],
    variants: [{ color: '#8fc9b8' }, { color: '#e58a8a', dir: -1 }, { color: '#f0d9a0' }, { color: '#d64545', parked: true }],
    draw(p) {
      twoWheel(p, { len: 1.5, wid: .6, col: '#8fc9b8', r: .2, wr: .28, wf: 1.22, tyre: 1.5, solidHub: true, stand: .7, beam: true,
        frame(K, y, L) {
          const c = K.col, d = dk(c, .25);
          K.box(.1, .62, y - .14, y + .14, .2, .5, c);                       // engine cover / rear body
          K.box(.5, 1.0, y - .13, y + .13, .16, .26, d, { ol: false });      // footboard
          K.box(.12, .66, y - .12, y + .12, .52, .62, '#3a3644', { ol: false }); // seat
          K.polyY([[.98, .2], [1.12, .2], [1.2, .8], [1.06, .8]], y + .14, c); // leg shield
          L(1.06, .2, 1.14, .8, dk(c, .6)); L(1.16, .8, 1.1, .98, '#3d3b49'); // steering column
          lw([K.X(1.1), y - .2, .98], [K.X(1.1), y + .22, .98], '#2a2634');  // handlebar
          K.box(1.08, 1.34, y - .1, y + .1, .36, .44, c, { ol: false });      // front mudguard
          const hx = K.X(1.22); if (K.f) lamp(hx, y + .05, .84, COL.head, K.on ? 3 : 0, 2, 2); else lamp(K.X(.1), y + .05, .46, COL.tail, K.on ? 2 : 0, 2, 2);
          if (!K.on) return;
        } });
    },
  },
  {
    id: 'veh.motorbike', kind: 'vehicle', tags: ['transit', 'vehicle', 'twowheel', 'motorbike'], size: [1.9, .7, 1.15], vb: [-2.9, -.4, 0, 4.8, 1.1, 1.5],
    variants: [{ color: '#d64545' }, { color: '#2b2a38', dir: -1 }, { color: '#3b5bdb' }],
    draw(p) {
      twoWheel(p, { len: 1.9, wid: .7, col: '#d64545', r: .3, wr: .36, wf: 1.52, tyre: 1.8, solidHub: true, stand: .9, beam: true,
        frame(K, y, L) {
          const c = K.col;
          K.box(.62, 1.2, y - .13, y + .13, .28, .56, '#4a4856');           // engine block
          K.lineY(.3, .34, .95, .3, y + .14, '#c9ced6'); K.lineY(.2, .4, .5, .36, y + .14, '#c9ced6'); // exhaust
          K.box(.78, 1.3, y - .12, y + .12, .58, .8, c);                     // tank
          K.box(.3, .8, y - .11, y + .11, .58, .7, '#2a2634', { ol: false }); // seat
          K.box(.14, .4, y - .08, y + .08, .62, .72, c, { ol: false });      // tail
          L(1.52, .3, 1.3, .92, '#c9ced6'); L(1.56, .3, 1.34, .92, '#8d939e'); // fork
          lw([K.X(1.3), y - .24, .96], [K.X(1.3), y + .26, .96], '#2a2634'); // bars
          L(.36, .3, .7, .5, '#3d3b49');                                     // swing arm
          if (K.f) lamp(K.X(1.42), y + .05, .8, COL.head, K.on ? 3 : 0, 2, 2); else lamp(K.X(.14), y + .05, .68, COL.tail, K.on ? 2 : 0, 2, 2);
        } });
    },
  },
  {
    id: 'veh.bicycle', kind: 'vehicle', tags: ['transit', 'vehicle', 'twowheel', 'bicycle', 'parked'], size: [1.6, .5, 1.0], vb: [-.3, -.3, 0, 1.9, .8, 1.3],
    variants: [{ color: '#d64545' }, { color: '#3b5bdb', dir: -1 }, { color: '#2f9e44', basket: true }, { color: '#e8a33a', basket: true, dir: -1 }],
    draw(p) {
      twoWheel(Object.assign({ lights: false }, p), { len: 1.6, wid: .5, col: '#d64545', r: .32, wr: .36, wf: 1.24, tyre: 1.2, spoke: true, stand: .7,
        frame(K, y, L) {
          const c = K.col, s = '#3d3b49';
          L(.36, .32, .72, .78, c); L(.72, .78, 1.12, .82, c); L(.78, .3, 1.12, .82, c); L(.78, .3, .72, .78, c); L(.36, .32, .78, .3, c); // frame
          L(1.24, .32, 1.1, .92, s);                                         // fork + head tube
          L(.72, .78, .7, .9, s); K.box(.58, .82, y - .05, y + .05, .9, .94, '#2a2634', { ol: false }); // saddle
          lw([K.X(1.08), y - .18, .94], [K.X(1.08), y + .2, .94], '#2a2634'); // bars
          L(.78, .3, .86, .2, s);                                            // pedal
          if (p.basket) K.box(1.16, 1.4, y - .14, y + .14, .7, .9, '#b08a5a');
        } });
    },
  },
];
