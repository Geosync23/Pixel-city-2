// Road furniture: signals, signs, bus stops, taxi stand, meters, bike racks, EV charger, road works, billboards, gantry.
// Everything faces +y (flip the asset for the other street direction).
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, mix, ENV, PAT, rng, textY, textX, textW, signY, signX, U, at, cone, ball, cyl, PW, px, C, isFlipped } from '../../engine/raster.js';
import { COL, disc, lamp, halo, post, pole, tw, glassY, glassX, sparse, list, num } from './_lib.js';
import cars from './cars.js';

const armOf = p => { const a = +p.arm; return p.arm === undefined || !isFinite(a) ? 3.2 : Math.max(0, Math.min(8, a)); };
const STEEL = '#56636b', STEELD = '#3d4a54', DARK = '#25212d', NAVY = '#26335e';
const bike = cars.find(a => a.id === 'veh.bicycle');
const P = (id, tags, size, draw, extra) => Object.assign({ id, kind: 'prop', tags: ['transit', 'road', 'street', ...tags], size, solid: true, draw }, extra || {});
/** a round signal lamp on a +y face */
function bulb(x, y, z, r, c, on) { disc('y', x, y, z, r + .04, DARK); if (on) { halo(x, y + .01, z, Math.round(r * U) + 3, lt(c, .35)); lit(() => disc('y', x, y + .005, z, r, c)); } else disc('y', x, y + .005, z, r, dk(c, .74)); }
function head3(x, y, z, state, r = .13) {   // 3-lamp head, bottom at z, centred on x, front face at y
  box(x - .2, y - .22, z, .4, .22, 1.08, DARK); qy(x - .26, x + .26, y - .2, z - .04, z + 1.12, '#f2c230'); qy(x - .2, x + .2, y + .001, z, z + 1.08, DARK);
  bulb(x, y + .002, z + .86, r, '#ff3b3b', state === 'red'); bulb(x, y + .002, z + .54, r, '#ffb347', state === 'amber'); bulb(x, y + .002, z + .22, r, '#4dff88', state === 'green');
}
/** tiny screen-space pixel icon anchored on a world point (rows of strings, '#' = pixel) */
function icon(x, y, z, rows, hex) { const s = PW(x, y, z), X = Math.round(s[0]), Y = Math.round(s[1]), c = C(hex), d = isFlipped() ? -1 : 1; rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') px(X + d * (i - (r.length >> 1)), Y + j + ((i - (r.length >> 1)) >> 1), c); }); }
const plate = (x0, x1, y, z0, z1, c, edge) => { qy(x0, x1, y, z0, z1, c); const e = edge || dk(c, .5); lw([x0, y, z0], [x1, y, z0], e); lw([x0, y, z1], [x1, y, z1], e); lw([x0, y, z0], [x0, y, z1], e); lw([x1, y, z0], [x1, y, z1], e); };
const signPole = (h, c) => { box(.06, .06, 0, .12, .12, h, c || '#8d939e'); box(.02, .02, 0, .2, .2, .08, STEELD, { ol: false }); };

function adArt(x0, x1, y, z0, z1, kind, seed) {
  const w = x1 - x0, h = z1 - z0, cx = (x0 + x1) / 2;
  if (kind === 'zip') { qy(x0, x1, y, z0, z1, '#f26a2e'); fq([[x0, y, z0], [x0 + w * .55, y, z0], [x0 + w * .3, y, z1], [x0, y, z1]], '#ff8a4a'); textY('ZIP', x0 + .3, y, z1 - .3, '#fff8e0'); textY('WE DELIVER', x0 + .3, y, z1 - .9, '#3a1f10'); box(x1 - 1.5, y, z0 + .3, 1.1, .02, .7, '#f6f2e6', { ol: false }); qy(x1 - 1.5, x1 - .4, y + .02, z0 + .3, z0 + 1.0, '#f6f2e6'); lw([x1 - 1.5, y + .02, z0 + 1.0], [x1 - .95, y + .02, z0 + .7], '#c9a58a'); lw([x1 - .4, y + .02, z0 + 1.0], [x1 - .95, y + .02, z0 + .7], '#c9a58a'); }
  else if (kind === 'cola') { qy(x0, x1, y, z0, z1, '#c9382e'); for (let i = 0; i < 6; i++) disc('y', x0 + .5 + ((i * 37) % 50) / 50 * (w - 1), y, z0 + .3 + ((i * 53) % 40) / 40 * (h - .6), .12 + (i % 3) * .05, '#e0584a'); qy(x1 - 1.3, x1 - .7, y, z0 + .3, z1 - .5, '#3a1f10'); qy(x1 - 1.2, x1 - .8, y, z1 - .5, z1 - .25, '#f6f2e6'); qy(x1 - 1.3, x1 - .7, y, z0 + .8, z0 + 1.3, '#f6f2e6'); textY('FIZZ', x0 + .4, y, z1 - .4, '#fff8e0'); textY('COLA', x0 + .4, y, z1 - .85, '#ffd98a'); textY('SINCE 1962', x0 + .4, y, z0 + .75, '#f2b0a8'); }
  else if (kind === 'radio') { qy(x0, x1, y, z0, z1, '#2a2548'); for (let i = 0; i < 14; i++) { const hh = .3 + Math.abs(Math.sin(i * 1.7 + (seed || 0))) * (h - 1.3); qy(x0 + .4 + i * (w - .8) / 14, x0 + .4 + (i + .6) * (w - .8) / 14, y, z0 + .3, z0 + .3 + hh, ['#ff5a8a', '#ffb347', '#4dd8e8'][i % 3]); } textY('98.5 BAY FM', cx - 21.5 / U, y, z1 - .25, '#fff8e0'); }
  else { qy(x0, x1, y, z0, z1, '#7fc8e8'); qy(x0, x1, y, z0, z0 + h * .38, '#2f8f96'); qy(x0, x1, y, z0 + h * .38, z0 + h * .44, '#f2e2a8'); disc('y', x1 - 1.1, y, z1 - .9, .5, '#ffd95a'); disc('y', x1 - 1.1, y, z1 - .9, .36, '#fff2a0');
    for (let i = 0; i < 5; i++) lw([x0 + .3 + i * 1.1, y, z0 + .3 + (i % 2) * .25], [x0 + .9 + i * 1.1, y, z0 + .3 + (i % 2) * .25], '#bfeef2');
    fq([[x0 + 1.2, y, z0 + h * .44], [x0 + 1.5, y, z0 + h * .44], [x0 + 1.4, y, z0 + h * .44 + 1.0], [x0 + 1.3, y, z0 + h * .44 + 1.0]], '#f6f2e6'); qy(x0 + 1.28, x0 + 1.42, y, z0 + h * .44 + .5, z0 + h * .44 + .62, '#d2412f'); // lighthouse
    textY('VISIT', x0 + 2.0, y, z1 - .3, '#26335e'); textY('MAPLE BAY', x0 + 2.0, y, z1 - .75, '#fff8e0'); }
}

export default [
  P('prop.road.trafficlight', ['signal', 'trafficlight'], [.3, .3, 5.6], p => {
    const st = p.state || 'red', arm = armOf(p);
    box(0, 0, 0, .3, .3, .5, STEELD); box(.08, .08, .5, .14, .14, 5.0, STEEL); box(.06, .06, 5.5, .18, .18, .08, STEELD, { ol: false });
    box(-.02, .3, 1.0, .2, .12, .3, '#f2c230', { ol: false }); disc('y', .08, .425, 1.15, .05, DARK);                     // push button
    if (arm > 0) { box(.2, .1, 5.1, arm, .1, .1, STEEL); lw([.3, .15, 5.5], [arm * .6, .15, 5.2], STEELD); head3(arm + .05, .3, 4.05, st, .14); if (arm > 2.4) qy(arm - 1.7, arm - .5, .21, 4.6, 5.0, '#2f7f4f'), textY(String(p.name || 'MAIN').slice(0, 4), arm - 1.62, .215, 4.93, '#f6f2e6'); }
    head3(.15, .52, 2.5, st, .12);
  }, { vb: p => [-.4, -.3, 0, armOf(p) + .7, .9, 5.8], variants: [{ state: 'red' }, { state: 'green' }, { state: 'amber' }, { state: 'green', arm: 0 }] }),

  P('prop.road.pedsignal', ['signal', 'pedestrian'], [.3, .3, 3.0], p => {
    const walk = p.state === 'walk';
    box(.04, .04, 0, .22, .22, .3, STEELD); box(.09, .09, .3, .12, .12, 2.6, STEEL);
    box(-.1, .08, 2.0, .5, .2, .95, DARK); qy(-.1, .4, .281, 2.0, 2.95, DARK);
    const man = ['.#.', '###', '.#.', '.#.', '#.#'], go = ['.#.', '##.', '.##', '.#.', '#.#'];
    if (!walk) { halo(.15, .29, 2.7, 4, '#ff8a7a'); lit(() => icon(.15, .285, 2.86, man, '#ff3b3b')); } else icon(.15, .285, 2.86, man, '#5a2026');
    if (walk) { halo(.15, .29, 2.25, 4, '#8affb0'); lit(() => icon(.15, .285, 2.42, go, '#4dff88')); } else icon(.15, .285, 2.42, go, '#1f5a3a');
    box(.0, .21, 1.0, .3, .1, .3, '#f2c230', { ol: false });
  }, { vb: [-.4, -.3, 0, .7, .7, 3.2], variants: [{ state: 'stop' }, { state: 'walk' }] }),

  P('prop.road.sign.stop', ['sign', 'stop'], [.24, .24, 2.9], () => { signPole(2.8); const y = .2, z = 2.25, r = .58 * U;
    disc('y', .12, y, z, .66, (a, b) => Math.abs(a) + Math.abs(b) > r * 1.42 + 1 || Math.abs(a) > r + .5 || Math.abs(b) > r + .5 ? null : (Math.abs(a) + Math.abs(b) > r * 1.42 - .6 || Math.abs(a) > r - 1 || Math.abs(b) > r - 1) ? '#f6f2e6' : '#d2332a');
    textY('STOP', .12 - 7.5 / U, y + .001, z + .2, '#f6f2e6'); }, { vb: [-.7, -.2, 0, 1, .5, 3.2], variants: [{}] }),
  P('prop.road.sign.yield', ['sign', 'yield'], [.24, .24, 2.8], () => { signPole(2.7); const y = .2;
    fq([[-.42, y, 2.7], [.66, y, 2.7], [.12, y, 1.8]], '#d2332a'); fq([[-.24, y, 2.6], [.48, y, 2.6], [.12, y, 2.0]], '#f6f2e6'); }, { vb: [-.6, -.2, 0, .9, .5, 3], variants: [{}] }),
  P('prop.road.sign.oneway', ['sign', 'oneway'], [.24, .24, 2.9], p => { signPole(2.8); const y = .2, d = p.dir === -1 ? -1 : 1;
    plate(-.5, .74, y, 2.2, 2.7, DARK, '#f6f2e6'); qy(-.3, .54, y + .001, 2.41, 2.49, '#f6f2e6'); const tip = d > 0 ? .64 : -.4, b = d > 0 ? .44 : -.2; fq([[tip, y + .001, 2.45], [b, y + .001, 2.62], [b, y + .001, 2.28]], '#f6f2e6'); }, { vb: [-.7, -.2, 0, 1, .5, 3.1], variants: [{ dir: 1 }, { dir: -1 }] }),
  P('prop.road.sign.parking', ['sign', 'parking'], [.24, .24, 2.8], () => { signPole(2.7); const y = .2; plate(-.26, .5, y, 1.95, 2.7, '#2c5fc4', '#f6f2e6'); icon(.12, y + .001, 2.56, ['###.', '#..#', '#..#', '###.', '#...', '#...', '#...'], '#f6f2e6'); }, { vb: [-.5, -.2, 0, .8, .5, 3], variants: [{}] }),
  P('prop.road.sign.street', ['sign', 'streetname'], [.24, .24, 3.3], p => { signPole(3.25, STEELD); const y = .19, a = String(p.name || 'MAPLE ST'), b = p.cross, w = tw(a, 8);
    plate(.12 - w / 2, .12 + w / 2, y, 2.7, 3.15, '#2f7f4f', '#f6f2e6'); textY(a, .12 - textW(a) / U / 2, y + .001, 3.02, '#f6f2e6');
    if (b) { const s = String(b), w2 = tw(s, 8); qx(.19, .12 - w2 / 2, .12 + w2 / 2, 2.2, 2.62, '#256a40'); textX(s, .191, .12 + textW(s) / U / 2, 2.52, '#f6f2e6'); } },
    { vb: p => { const w = Math.max(tw(p.name || 'MAPLE ST', 8), p.cross ? tw(p.cross, 8) : 0) / 2 + .2; return [.12 - w, .12 - w, 0, .12 + w, .12 + w, 3.5]; }, variants: [{ name: 'MAPLE ST' }, { name: 'HARBOR RD', cross: 'PIER AVE' }, { name: 'LANTERN ROW' }] }),

  P('prop.road.busshelter', ['busstop', 'shelter', 'bus'], [4.2, 1.5, 2.7], p => {
    const W = 4.2, D = 1.5, H = 2.45, routes = list(p.routes, ['12', '7']).slice(0, 3), snow = ENV.season === 3, ad = p.ad || 'bay';
    qz(0, W, 0, D, .01, '#c9c2b2');
    // back glass wall + far end panel
    for (const x of [.06, W / 2, W - .06]) post(x, .08, 0, H, STEELD, .1);
    glassY(.1, W - .1, .1, .5, H - .2, '#d4f2f6', 3); lw([.1, .1, .5], [W - .1, .1, .5], STEEL); lw([.1, .1, 1.5], [W - .1, .1, 1.5], STEEL);
    qy(.25, 1.25, .12, .7, 1.9, '#f1ead6'); for (let z = .85; z < 1.8; z += .14) lw([.32, .12, z], [1.18, .12, z], z > 1.6 ? NAVY : '#8d939e');     // timetable + map
    qy(1.5, 2.6, .12, .9, 1.9, '#dcefd8'); lw([1.6, .12, 1.2], [2.5, .12, 1.7], '#d2412f'); lw([1.6, .12, 1.7], [2.3, .12, 1.0], '#2f8f96'); disc('y', 2.05, .12, 1.45, .06, DARK);
    // bench
    box(.5, .3, .42, 2.4, .4, .08, '#b08a5a', { t: PAT.fboards('#c09a66', .14) }); for (const x of [.6, 2.7]) box(x, .35, 0, .08, .3, .42, STEELD, { ol: false });
    // lit advertising end panel (+x end)
    box(W - .12, .1, .2, .12, D - .25, 2.0, STEELD); lit(() => { qx(W + .001, .2, D - .25, .35, 2.1, '#fff2c4'); qx(W + .001, .26, D - .31, .42, 2.03, ad === 'cola' ? '#c9382e' : '#2f8f96'); qx(W + .001, .26, D - .31, .42, 1.0, ad === 'cola' ? '#3a1f10' : '#f2e2a8'); });
    lit(() => disc('x', W + .002, .75, 1.55, .22, ad === 'cola' ? '#f6f2e6' : '#ffd95a'));
    // roof
    post(.06, D - .1, 0, H, STEELD, .1);
    box(-.15, -.1, H, W + .3, D + .35, .12, STEELD, { t: snow ? COL.snow : '#6f8a96' }); fq([[-.1, 0, H + .125], [W + .1, 0, H + .125], [W + .1, D + .2, H + .125], [-.1, D + .2, H + .125]], sparse(snow ? '#ffffff' : '#bfe6ee', 3));
    lit(() => lw([.3, D + .24, H - .01], [W - .3, D + .24, H - .01], '#fff2c4')); glow(() => { qz(.2, W - .2, .2, D + .9, .02, '#55536a'); qy(.3, W - .3, D + .25, H - .08, H, '#fff2c4'); });
    // route flag on the front-left post
    box(-.1, D - .14, H + .12, .5, .08, .62, NAVY, { ol: false }); lit(() => { qy(-.1, .4, D - .055, H + .12, H + .74, NAVY); disc('y', .15, D - .054, H + .52, .17, '#f6f2e6'); icon(.15, D - .053, H + .64, ['.###.', '#####', '#.#.#', '#####', '#.#.#'], '#3f9a6a'); });
    routes.forEach((r, i) => { const z = H - .1 - i * .42; qy(-.1, .4, D - .05, z - .36, z, i % 2 ? '#2f8f96' : '#3f9a6a'); textY(String(r).slice(0, 2), .15 - textW(String(r).slice(0, 2)) / U / 2, D - .049, z - .03, '#fff8e0'); });
  }, { seats: [{ x: 1.1, y: .5, z: .5, dir: 1 }, { x: 2.3, y: .5, z: .5, dir: 1 }], use: { x: 2.1, y: 2.0 }, light: { x: 2.1, y: 1.6, z: 0, r: 4 }, vb: [-.4, -.3, 0, 4.7, 2.5, 3.4],
    variants: [{ routes: ['12', '7'] }, { routes: ['3'], ad: 'cola' }] }),

  P('prop.road.busstop', ['busstop', 'bus', 'sign'], [.24, .24, 3.2], p => {
    const routes = list(p.routes, ['12']).slice(0, 3); signPole(3.1, STEELD); const y = .19;
    lit(() => { disc('y', .12, y, 2.75, .36, '#f6f2e6'); disc('y', .12, y + .001, 2.75, .3, '#3f9a6a'); icon(.12, y + .002, 2.92, ['.#####.', '#######', '#.#.#.#', '#######', '#######', '.#...#.'], '#fff8e0'); });
    routes.forEach((r, i) => { const z = 2.3 - i * .4; plate(-.2, .44, y, z - .34, z, i % 2 ? '#2f8f96' : NAVY); textY(String(r).slice(0, 2), .12 - textW(String(r).slice(0, 2)) / U / 2, y + .001, z - .03, '#fff8e0'); });
    plate(-.14, .38, y, .9, 1.5, '#f1ead6'); for (let z = 1.0; z < 1.45; z += .1) lw([-.08, y + .001, z], [.32, y + .001, z], '#8d939e');
  }, { use: { x: .12, y: 1.0 }, vb: [-.5, -.2, 0, .8, .5, 3.4], variants: [{ routes: ['12'] }, { routes: ['7', '3', '12'] }] }),

  P('prop.road.taxistand', ['taxistand', 'taxi', 'sign'], [.24, .24, 3.2], () => {
    signPole(3.1, DARK); const y = .19;
    box(-.4, .1, 2.45, 1.04, .1, .62, DARK); lit(() => { qy(-.36, .6, y + .012, 2.5, 3.03, '#ffd23a'); textY('TAXI', .12 - 7.5 / U, y + .013, 2.92, DARK); });
    halo(.12, y + .02, 2.76, 9, '#ffe9a8'); lit(() => textY('TAXI', .12 - 7.5 / U, y + .013, 2.92, DARK));
    plate(-.14, .38, y, 1.5, 2.0, '#f1ead6'); lw([-.08, y + .001, 1.85], [.32, y + .001, 1.85], DARK); lw([-.08, y + .001, 1.72], [.2, y + .001, 1.72], '#8d939e'); lw([-.08, y + .001, 1.62], [.26, y + .001, 1.62], '#8d939e');
  }, { use: { x: .12, y: 1.0 }, light: { x: .1, y: .8, z: 0, r: 2.5 }, vb: [-.8, -.3, 0, 1.1, .7, 3.5], variants: [{}] }),

  P('prop.road.meter', ['parking', 'meter'], [.24, .24, 1.5], p => {
    box(.08, .08, 0, .08, .08, 1.05, '#8d939e'); box(.0, .04, 1.05, .24, .16, .42, p.color || '#4a5a66'); lit(() => qy(.05, .19, .201, 1.25, 1.4, '#9cf2b0')); qy(.08, .16, .201, 1.1, 1.17, DARK);
  }, { variants: [{}, { color: '#2c5fc4' }] }),

  P('prop.road.bikerack', ['bike', 'rack', 'parking'], [1.9, 2.6, 1.0], p => {
    const r = rng(p.seed || 1), n = p.bikes === undefined || !isFinite(+p.bikes) ? 3 : +p.bikes, cols = ['#d64545', '#3b5bdb', '#2f9e44', '#e8a33a', '#8fc9b8'];
    for (let i = 0; i < 5; i++) { const y = .15 + i * .575;
      lw([.5, y, 0], [.5, y, .8], '#aab0ba'); lw([1.3, y, 0], [1.3, y, .8], '#8d939e'); lw([.5, y, .8], [1.3, y, .8], '#c9ced6'); lw([.5, y, .82], [1.3, y, .82], '#8d939e');
      if (i < 4 && bike && r() < n / 4) at(.12, y + .06, 0, () => bike.draw({ color: cols[Math.floor(r() * cols.length)], dir: r() < .5 ? 1 : -1, basket: r() < .3 })); }
  }, { solid: true, variants: [{ seed: 1 }, { seed: 5, bikes: 4 }, { seed: 3, bikes: 1 }] }),

  P('prop.road.evcharger', ['ev', 'charger'], [.5, .4, 1.7], p => {
    const c = p.color || '#f1efe8';
    box(0, 0, 0, .5, .4, 1.6, c); box(0, 0, 1.6, .5, .4, .08, '#3f9a6a', { ol: false });
    lit(() => { qy(.1, .4, .401, 1.05, 1.4, '#16323a'); qy(.14, .36, .401, 1.26, 1.34, '#4dff88'); icon(.25, .402, 1.2, ['.#', '##', '#.'], '#9cf2b0'); }); qy(.06, .44, .401, .86, .92, '#3f9a6a');
    box(.5, .12, .9, .08, .16, .3, DARK, { ol: false }); lw([.54, .2, .9], [.6, .34, .4], DARK); lw([.6, .34, .4], [.5, .38, .7], DARK);
    lamp(.25, .41, 1.52, '#4dff88', 3, 2, 1);
  }, { use: { x: .25, y: .9 }, variants: [{}, { color: '#2b2a38' }] }),

  P('prop.road.barrier', ['roadwork', 'barrier'], p => [num(p.len, 2, 1, 8), .5, 1.1], p => {
    const L = num(p.len, 2, 1, 8);
    for (const x of [.15, L - .15]) { lw([x, .0, 0], [x, .25, 1.0], '#8d939e'); lw([x, .5, 0], [x, .25, 1.0], '#c9ced6'); }
    box(0, .2, .62, L, .08, .3, '#e0453a', { l: PAT.vstripes('#f6f2e6', '#e0453a', 4), t: '#f6f2e6' }); box(0, .2, .25, L, .08, .14, '#f2c230', { l: PAT.vstripes('#25212d', '#f2c230', 4), ol: false });
    for (const x of [.15, L - .15]) lamp(x, .25, 1.06, '#ffb347', 3, 2, 2);
  }, { vb: p => [-.2, -.2, 0, num(p.len, 2, 1, 8) + .2, .7, 1.4], variants: [{ len: 2 }, { len: 3 }] }),

  P('prop.road.cone', ['roadwork', 'cone'], [.4, .4, .7], () => {
    box(.02, .02, 0, .36, .36, .05, '#d95a1e'); cone(.2, .2, .05, .14, .62, '#f26a2e'); const s = [[.2, .2, .32]]; disc('y', .2, .22, .3, .0, null);
    lw([.12, .26, .3], [.3, .24, .3], '#f6f2e6'); lw([.12, .26, .34], [.29, .24, .34], '#f6f2e6'); lw([.15, .25, .5], [.26, .24, .5], '#f6f2e6');
  }, { solid: false, variants: [{}] }),

  P('prop.road.billboard', ['billboard', 'ad'], [6, .5, 7.2], p => {
    const W = 6, z0 = 3.6, z1 = 6.9, ad = p.ad || 'bay';
    for (const x of [1.2, W - 1.5]) { box(x, .1, 0, .3, .3, z0 + .2, STEEL); box(x - .1, 0, 0, .5, .5, .2, STEELD, { ol: false }); lw([x + .15, .4, 1], [x + .15, .4, z0], dk(STEEL, .3)); }
    lw([1.5, .25, .6], [W - 1.5, .25, z0 - .2], STEELD); lw([1.5, .25, z0 - .2], [W - 1.5, .25, .6], STEELD);
    box(-.1, .05, z0 - .15, W + .2, .4, z1 - z0 + .3, '#3a3644');
    lit(() => adArt(0, W, .455, z0, z1, ad, p.seed)); 
    box(-.1, .45, z0 - .3, W + .2, .5, .08, STEELD, { ol: false }); for (let x = .6; x < W; x += 1.2) { lw([x, .9, z0 - .22], [x, .6, z0 - .22], DARK); lamp(x, .92, z0 - .2, '#fff2c4', 2, 2, 1); }
    if (ENV.season === 3) qz(-.1, W + .1, .05, .45, z1 + .16, COL.snow);
  }, { vb: [-.4, -.3, 0, 6.4, 1.3, 7.5], variants: [{ ad: 'bay' }, { ad: 'zip' }, { ad: 'cola' }, { ad: 'radio', seed: 2 }] }),

  P('prop.road.gantry', ['gantry', 'sign', 'highway'], p => [num(p.span, 10, 4, 30), .6, 7.2], p => {
    const S = num(p.span, 10, 4, 30), zb = 5.4, signs = (Array.isArray(p.signs) && p.signs.length ? p.signs : [['DOWNTOWN', '^'], ['AIRPORT', '>']]).map(q => Array.isArray(q) ? q : [String(q), '^']), n = signs.length, sw = Math.min(4.6, (S - 1) / n - .3);
    const leg = x => { box(x, .1, 0, .4, .4, zb + .9, STEEL); box(x - .12, 0, 0, .64, .6, .35, '#a39e93'); };
    leg(0);
    // truss beam
    for (const [y, c] of [[.12, dk(STEEL, .3)], [.48, STEEL]]) { for (let x = .4; x < S - .4; x += .8) { lw([x, y, zb], [x + .4, y, zb + .8], c); lw([x + .4, y, zb + .8], [Math.min(x + .8, S - .4), y, zb], c); } lw([.4, y, zb], [S - .4, y, zb], c); lw([.4, y, zb + .8], [S - .4, y, zb + .8], c); }
    for (let x = .4; x <= S - .39; x += .8) { lw([x, .12, zb + .8], [x, .48, zb + .8], STEEL); }
    signs.forEach((s, i) => { const cx = S * (i + .5) / n, x0 = cx - sw / 2, x1 = cx + sw / 2, y = .56, t = String(s[0]).slice(0, 10);
      box(x0, .5, zb - .5, sw, .06, 1.6, '#256a40', { ol: false });
      lit(() => { qy(x0, x1, y, zb - .5, zb + 1.1, '#2f7f4f'); plate(x0 + .06, x1 - .06, y + .001, zb - .44, zb + 1.04, '#2f7f4f', '#f6f2e6'); textY(t, cx - textW(t) / U / 2, y + .002, zb + .86, '#f6f2e6');
        const a = s[1] || '^', az = zb - .25; if (a === '^') { fq([[cx, y + .002, az + .6], [cx - .28, y + .002, az + .3], [cx + .28, y + .002, az + .3]], '#f6f2e6'); qy(cx - .08, cx + .08, y + .002, az, az + .32, '#f6f2e6'); } else { const d = a === '<' ? -1 : 1; fq([[cx + d * .45, y + .002, az + .3], [cx + d * .1, y + .002, az + .58], [cx + d * .1, y + .002, az + .02]], '#f6f2e6'); qy(Math.min(cx - d * .35, cx + d * .12), Math.max(cx - d * .35, cx + d * .12), y + .002, az + .22, az + .38, '#f6f2e6'); }
        if (s[2]) { qy(x0 + .15, x0 + .15 + tw(s[2], 4), y + .002, zb - .34, zb + .06, '#f2c230'); textY(String(s[2]), x0 + .15 + 2 / U, y + .003, zb + .0, DARK); } });
      lamp(cx - sw / 4, y + .5, zb - .6, '#fff2c4', 2, 2, 1); lamp(cx + sw / 4, y + .5, zb - .6, '#fff2c4', 2, 2, 1); lw([cx - sw / 4, .56, zb - .6], [cx - sw / 4, 1.06, zb - .6], DARK); lw([cx + sw / 4, .56, zb - .6], [cx + sw / 4, 1.06, zb - .6], DARK); });
    leg(S - .4);
  }, { solid: false, vb: p => [-.3, -.2, 0, num(p.span, 10, 4, 30) + .3, 1.3, 7.4], variants: [{ span: 10 }, { span: 12, signs: [['HARBOR', '<', '4'], ['OLD TOWN', '^'], ['HILLCREST', '>', '7']] }] }),
];
