// Airport props: airfield lighting, windsock, approach gantry, signs, trolleys, luggage, cones, totems, flags, fences.
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, rng, winY, PAT, spx, cyl } from '../../engine/raster.js';
import { AP, SNOW, winter, wtext, tw, bsignY, bsignX, bmp, LEAF, lamp, loft, discY } from './_lib.js';

const LC = { blue: '#4a8cff', white: '#fff6d0', green: '#3dff7a', red: '#ff4a3a', amber: '#ffb84a' };
const ARROW = { r: ['..#..', '...#.', '#####', '...#.', '..#..'], l: ['..#..', '.#...', '#####', '.#...', '..#..'], u: ['..#..', '.###.', '#.#.#', '..#..', '..#..'], d: ['..#..', '..#..', '#.#.#', '.###.', '..#..'] };
const BAGC = ['#d8483a', '#3f7fc4', '#2f8f8a', '#f2c230', '#8c2f4a', '#55627a', '#f08a2c', '#3d4654', '#7a5a3c', '#c93f7a'];

function fixture(x, y, c, raised) {
  if (raised) { box(x - .08, y - .08, 0, .16, .16, .3, '#f2c230', { ol: false }); lamp(x, y, .42, c); }
  else { qz(x - .12, x + .12, y - .12, y + .12, 0.01, '#55627a'); lamp(x, y, .08, c); }
}
function lights(p) {
  const len = p.len || 8, step = p.step || 2, c = LC[p.color || 'blue'], c2 = p.alt ? LC[p.alt] : c;
  for (let x = step / 2, i = 0; x < len; x += step, i++) fixture(x, .25, i % 2 ? c2 : c, p.raised !== false && p.color !== 'green');
}
function papi(p) { const n = 4; for (let i = 0; i < n; i++) { const y = .3 + i * .9; box(.1, y - .25, 0, .5, .5, .12, AP.conc, { ol: false }); lw([.2, y, .1], [.2, y, .4], '#55627a'); lw([.5, y, .1], [.5, y, .4], '#55627a'); box(.1, y - .2, .4, .55, .4, .28, '#f08a2c'); lamp(.66, y, .56, i < (p.red === undefined ? 2 : p.red) ? LC.red : LC.white, true); } }
function windsock(p) {
  const h = p.h || 4.2, wind = p.wind === undefined ? .8 : p.wind, L = 1.9;
  box(.15, .15, 0, .3, .3, .2, AP.conc); box(.25, .25, .2, .1, .1, h - .2, '#e6e9ea', { ol: false }); for (let z = .6; z < h; z += 1.2) qy(.25, .35, .35, z, z + .3, AP.red);
  const drop = (1 - wind) * 1.6, n = 5, secs = [];
  for (let i = 0; i <= n; i++) { const t = i / n, x = .35 + t * L * (.45 + wind * .55), z = h - .25 - drop * t * t, r = .3 - t * .17, s = []; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; s.push([x, .3 + r * Math.cos(a), z + r * Math.sin(a)]); } secs.push(s); }
  loft(secs, { closed: true, col: (k, i) => i % 2 ? '#f4f2ea' : '#f08a2c', cap: '#8a4a1c', ol: '#8a4a1c' });
  lw([.3, .3, h - .6], [.3, .3, h + .15], '#55627a'); lamp(.3, .3, h + .2, LC.red);
}
function gantry(p) {
  const h = p.h || 3, wy = p.w || 5, n = p.n || 5;
  for (const y of [.3, wy - .3]) { box(.1, y - .15, 0, .3, .3, .15, AP.conc, { ol: false }); lw([.25, y, .15], [.25, y, h], '#f08a2c'); lw([.25 + 1 / 16, y, .15], [.25 + 1 / 16, y, h], '#c96a1c'); lw([.25, y, h * .5], [.25, y + (y < 1 ? .6 : -.6), h], '#c96a1c'); }
  for (let z = .6; z < h; z += 1.2) for (const y of [.3, wy - .3]) lw([.25, y, z], [.25, y, z + .5], '#f4f2ea');
  lw([.25, .1, h], [.25, wy - .1, h], '#f08a2c'); lw([.25, .1, h + .06], [.25, wy - .1, h + .06], '#f4f2ea');
  for (let i = 0; i < n; i++) { const y = .3 + i * (wy - .6) / (n - 1); lw([.25, y, h], [.25, y, h + .22], '#55627a'); lamp(.25, y, h + .3, p.color ? LC[p.color] : (p.red && (i === 0 || i === n - 1) ? LC.red : LC.white), true); }
}
function rwySign(p) {
  const t = p.text || '4', kind = p.kind || 'dist', bg = kind === 'dist' ? '#1b1d26' : kind === 'hold' ? '#d8281e' : kind === 'loc' ? '#1b1d26' : '#f2c230', fg = kind === 'dist' || kind === 'hold' ? '#ffffff' : kind === 'loc' ? '#f2c230' : '#1b1d26';
  const k = kind === 'dist' ? 2 : 1, w = Math.max(1, tw(t, k) / 16 + .4 + (p.arrow ? .5 : 0));
  box(.1, .05, 0, .12, .2, .3, '#55627a', { ol: false }); box(w - .22, .05, 0, .12, .2, .3, '#55627a', { ol: false });
  box(0, 0, .3, w, .3, .9, '#2a2f3d'); if (winter()) qz(0, w, 0, .3, 1.21, SNOW);
  lit(() => { qy(.06, w - .06, .3, .36, 1.14, bg); wtext('y', t, .2 + (p.arrow === 'l' ? .5 : 0) + (w - .4 - (p.arrow ? .5 : 0) - tw(t, k) / 16) / 2, .31, .75 + 5 * k / 32, fg, k); if (p.arrow) bmp('y', ARROW[p.arrow], p.arrow === 'l' ? .16 : w - .5, .31, .75 + 5 / 32, { '#': fg }); if (kind === 'loc') { lw([.1, .3, .4], [w - .1, .3, .4], fg); lw([.1, .3, 1.1], [w - .1, .3, 1.1], fg); } });
  return w;
}
function suitcase(x, y, z, w, d, h, c, handle) {
  box(x, y, z, w, d, h, c); lw([x + w * .3, y + d, z + .03], [x + w * .3, y + d, z + h - .03], dk(c, .45)); lw([x + w * .7, y + d, z + .03], [x + w * .7, y + d, z + h - .03], dk(c, .45));
  if (handle) { lw([x + w * .3, y + d / 2, z + h], [x + w * .3, y + d / 2, z + h + .35], '#8a93a0'); lw([x + w * .7, y + d / 2, z + h], [x + w * .7, y + d / 2, z + h + .35], '#8a93a0'); lw([x + w * .3, y + d / 2, z + h + .35], [x + w * .7, y + d / 2, z + h + .35], '#3d4654'); }
  else lw([x + w * .4, y + d / 2, z + h + .05], [x + w * .6, y + d / 2, z + h + .05], '#3d4654');
  spx(x + w * .5, y + d, z + h * .6, 0, 0, '#fff8e0');
}
function duffel(x, y, z, len, c) { box(x, y, z, len, .35, .3, c); box(x + .05, y + .03, z + .3, len - .1, .29, .06, lt(c, .15), { ol: false }); lw([x + len * .3, y + .35, z + .05], [x + len * .5, y + .35, z + .42], dk(c, .5)); lw([x + len * .7, y + .35, z + .05], [x + len * .5, y + .35, z + .42], dk(c, .5)); }
function luggage(p) {
  const r = rng(p.seed || 1), k = p.kind || 'pile', c = () => BAGC[Math.floor(r() * BAGC.length)];
  if (k === 'single') suitcase(.1, .1, 0, .5, .3, .75, p.col || c(), true);
  else if (k === 'duo') { suitcase(.1, .1, 0, .55, .32, .8, p.col || c(), true); suitcase(.75, .2, 0, .4, .28, .55, c(), true); duffel(.2, .55, 0, .7, c()); }
  else if (k === 'family') { suitcase(.1, .05, 0, .6, .35, .85, c(), true); suitcase(.8, .1, 0, .5, .3, .7, c(), true); suitcase(1.4, .15, 0, .4, .28, .5, c(), true); duffel(.3, .6, 0, .8, c()); box(1.3, .6, 0, .35, .3, .3, '#b98a52'); }
  else { // pile
    suitcase(.1, .1, 0, .9, .55, .35, c()); suitcase(1.1, .15, 0, .55, .35, .8, c(), true); suitcase(.15, .15, .35, .8, .45, .3, c()); duffel(.2, .2, .65, .7, c()); suitcase(.3, .8, 0, .6, .32, .7, c(), true); box(1.05, .75, 0, .5, .45, .4, '#b98a52'); lw([1.05, 1.2, .2], [1.55, 1.2, .2], '#7a5a3c'); suitcase(1.15, .8, .4, .35, .3, .25, c());
  }
}
function trolley(x, y, bags, r) {
  // push-cart seen with its handle at -x
  for (const [a, b] of [[.15, .1], [.85, .1], [.15, .55], [.85, .55]]) spx(x + a, y + b, .05, 0, 0, '#2b2a35');
  box(x + .1, y + .05, .1, .85, .55, .06, '#aab4c0'); lw([x + .1, y + .05, .16], [x + .1, y + .05, 1.0], '#8a93a0'); lw([x + .1, y + .6, .16], [x + .1, y + .6, 1.0], '#8a93a0');
  lw([x + .1, y + .05, 1.0], [x + .1, y + .6, 1.0], AP.red); lw([x + .1, y + .05, .6], [x + .1, y + .6, .6], '#8a93a0'); qx(x + .1, y + .08, y + .57, .62, .95, '#8a93a0', 'glass');
  if (bags) { suitcase(x + .2, y + .1, .16, .7, .45, .3, BAGC[Math.floor(r() * 10)]); if (bags > 1) suitcase(x + .25, y + .14, .46, .6, .38, .25, BAGC[Math.floor(r() * 10)]); if (bags > 2) duffel(x + .25, y + .15, .72, .55, BAGC[Math.floor(r() * 10)]); }
}
function corral(p) {
  const n = p.n || 6, L = 1.2 + n * .28 + .6, r = rng(p.seed || 1);
  for (const y of [.05, .95]) { lw([.1, y, .5], [L - .1, y, .5], '#8a93a0'); lw([.1, y, .9], [L - .1, y, .9], '#aab4c0'); for (let x = .1; x <= L; x += (L - .2) / 3) lw([x, y, 0], [x, y, .9], '#8a93a0'); if (y < .5) for (let i = 0; i < n; i++) trolley(.3 + i * .28, .2, 0, r); }
  box(L - .2, .35, 0, .12, .12, 2.1, '#55627a', { ol: false }); bsignY('TROLLEYS', L - 1.9, L - .1, .5, 1.6, 2.1, '#2f7fd0', '#ffffff', { lit: true }); if (winter()) qz(L - 1.9, L - .1, .38, .5, 2.11, SNOW);
}
function cone(x, y) { qz(x - .16, x + .16, y - .16, y + .16, .01, '#c9651c'); const b = [x, y]; fq([[b[0] - .13, b[1] + .13, .03], [b[0] + .13, b[1] + .13, .03], [b[0] + .13, b[1] - .13, .03], [b[0], b[1], .62]], '#f08a2c'); fq([[b[0] - .13, b[1] + .13, .03], [b[0] + .13, b[1] + .13, .03], [b[0], b[1], .62]], '#f59a3c'); fq([[b[0] - .08, b[1] + .08, .26], [b[0] + .08, b[1] + .08, .26], [b[0] + .055, b[1] + .055, .4], [b[0] - .055, b[1] + .055, .4]], '#fff8e0'); fq([[b[0] + .08, b[1] + .08, .26], [b[0] + .08, b[1] - .08, .26], [b[0] + .055, b[1] - .055, .4], [b[0] + .055, b[1] + .055, .4]], '#d9d2c0'); if (winter()) spx(x, y, .62, 0, 0, SNOW); }
function cones(p) { const n = p.n || 1; for (let i = 0; i < n; i++) cone(.25 + i * (p.step || 1), .25); if (p.tape && n > 1) { lw([.25, .25, .5], [.25 + (n - 1) * (p.step || 1), .25, .5], '#f2c230'); } }
const totemW = p => Math.ceil((Math.max(...(p.rows || [['ARRIVALS']]).map(r => tw(r[0]))) / 16 + 1.05) * 2) / 2;
function totem(p) {
  const rows = p.rows || [['ARRIVALS', 'u', '#f2c230', '#1b2233']], w = totemW(p), h = .55 + rows.length * .55 + .7, c = p.col || '#1f3554';
  box(0, 0, 0, w, .35, h, c); qy(0, w, .35, 0, .3, dk(AP.conc, .2)); qx(w, 0, .35, 0, h, dk(c, .2));
  lit(() => { qy(.1, w - .1, .351, h - .6, h - .1, '#fff8e0'); bmp('y', LEAF, .2, .36, h - .1 - 1 / 16, { '#': AP.red }, 1); wtext('y', p.title || 'MBX', .9, .36, h - .22, c); });
  rows.forEach((rw, i) => { const z1 = h - .7 - i * .55, bg = rw[2] || c, fg = rw[3] || '#ffffff';
    lit(() => { qy(.1, w - .1, .351, z1 - .48, z1, bg); wtext('y', rw[0], .2, .36, z1 - .1, fg); if (rw[1]) bmp('y', ARROW[rw[1]], w - .55, .36, z1 - .1, { '#': fg }); }); });
  if (winter()) qz(0, w, 0, .35, h + .01, SNOW);
}
function flagpole(p) {
  const h = p.h || 6, c = p.flag || 'maple', wv = (p.seed || 1) % 3;
  box(.1, .1, 0, .4, .4, .25, AP.conc); box(.25, .25, .25, .1, .1, h - .25, '#dfe3e6', { ol: false }); cyl(.3, .3, h, .1, .08, '#f2c230', { ol: false });
  const fw = 1.9, fh = 1.1, n = 8, z1 = h - .1;
  for (let i = 0; i < n; i++) { const xa = .35 + i * fw / n, xb = xa + fw / n, da = Math.sin((i + wv) * .9) * .09 - i * .012, db = Math.sin((i + 1 + wv) * .9) * .09 - (i + 1) * .012, t = (i + .5) / n;
    let cols; if (c === 'maple') cols = [t < .25 || t > .75 ? '#d8483a' : '#fbfaf4']; else if (c === 'bay') cols = ['#2f7fd0', '#fbfaf4', '#2f8f8a']; else if (c === 'tri') cols = [t < .33 ? '#27456b' : t < .66 ? '#fbfaf4' : '#d8483a']; else if (c === 'sun') cols = ['#fbfaf4', '#f2c230', '#fbfaf4']; else cols = [c];
    cols.forEach((cc, j) => { const za = z1 - j * fh / cols.length, zb = z1 - (j + 1) * fh / cols.length; fq([[xa, .3, zb + da], [xb, .3, zb + db], [xb, .3, za + db], [xa, .3, za + da]], i % 3 === 1 ? dk(cc, .1) : cc); }); }
  if (c === 'maple') bmp('y', LEAF, .35 + fw / 2 - 5 / 16, .31, z1 - .28, { '#': '#d8483a' });
  if (c === 'sun') { discY(.35 + fw / 2, .31, z1 - fh / 2, .2, '#d8483a'); }
  lw([.35, .3, z1], [.35, .3, z1 - fh], '#8a93a0');
}
function fence(p) {
  const len = p.len || 8, h = 2.4, mc = '#9aa7b4';
  qy(.05, len - .05, .1, .1, h, mc, 'glass'); // chain link
  for (let z = .1; z <= h; z += h - .1) lw([0, .1, z], [len, .1, z], '#7c8792'); lw([0, .1, h / 2], [len, .1, h / 2], '#aab4c0');
  for (let x = 0; x <= len + .01; x += len / Math.max(1, Math.round(len / 2))) { const X = Math.min(x, len - .08); box(X, .06, 0, .08, .08, h, '#6b7482', { ol: false }); lw([X + .04, .1, h], [X + .04, .45, h + .3], '#6b7482'); }
  for (const dz of [.1, .2, .3]) lw([0, .1 + dz * 1.15, h + dz], [len, .1 + dz * 1.15, h + dz], dz === .2 ? '#55627a' : '#8a93a0');
  if (p.gate) { const gx = len / 2 - 1.5; qy(gx, gx + 3, .12, .1, h, '#c9d2d8', 'glass'); for (const x of [gx, gx + 1.5, gx + 3]) lw([x, .12, .05], [x, .12, h], '#f2c230'); lw([gx, .12, h], [gx + 3, .12, h], '#f2c230'); lw([gx, .12, .1], [gx + 1.5, .12, h], '#f2c230'); lw([gx + 3, .12, .1], [gx + 1.5, .12, h], '#f2c230'); }
  if (p.sign !== false) for (let x = (p.gate ? .6 : len / 2 - .9); x < len - 1.8; x += 6) { qy(x, x + 1.8, .13, 1.1, 1.75, '#fbfaf4'); qy(x, x + 1.8, .13, 1.5, 1.75, AP.red); wtext('y', 'KEEP', x + .12, .14, 1.71, '#ffffff'); wtext('y', 'OUT', x + 1.05, .14, 1.71, '#ffffff'); wtext('y', 'AIRSIDE', x + .1, .14, 1.44, '#2a2f3d'); }
  if (winter()) lw([0, .1, h + .02], [len, .1, h + .02], SNOW);
}
function blast(p) {
  const len = p.len || 8, n = 6, prof = []; // curved deflector leaning toward +y (deflects jet blast upward); drawn as slats
  for (let i = 0; i <= n; i++) { const t = i / n; prof.push([1.5 - 1.3 * t * t, 2.4 * Math.sin(t * Math.PI / 2 * .95 + .08) - .15]); }
  // support frames behind
  for (let x = .2; x <= len; x += (len - .4) / Math.max(1, Math.round(len / 2))) { lw([x, .1, 0], [x, .15, 2.3], '#55627a'); lw([x, .1, 0], [x, 1.0, 1.2], '#55627a'); }
  const nb = Math.round(len / 2);
  for (let b = 0; b < nb; b++) { const xa = b * len / nb, xb = (b + 1) * len / nb - .06; loft([prof.map(q => [xa, q[0], q[1]]), prof.map(q => [xb, q[0], q[1]])], { col: k => winter() && k <= 1 ? SNOW : k >= 4 ? ((b + k) % 2 ? '#f08a2c' : '#f4f2ea') : (k % 2 ? '#aab4c0' : '#bcc5cf'), ol: '#55627a' }); }
  lit(() => { for (let x = .3; x < len; x += 2) spx(x, .2, 2.3, 0, 0, LC.red); });
}
function railsign(p) {
  const name = p.name || 'AIRPORT', line = p.line || '#2f8f8a', W = 3.6 + (tw(name) > 34 ? .5 : 0);
  box(.3, .1, 0, .2, .2, 3.4, '#55627a', { ol: false }); box(W - .5, .1, 0, .2, .2, 3.4, '#55627a', { ol: false });
  box(0, 0, 2.2, W, .4, 1.3, '#fbfaf4'); qx(W, 0, .4, 2.2, 3.5, dk(line, .2));
  lit(() => { qy(.08, W - .08, .401, 2.28, 3.42, '#fbfaf4'); qy(.08, W - .08, .401, 2.28, 2.62, line);
    bmp('y', ['.######.', '########', '#..##..#', '#..##..#', '########', '########', '#.####.#', '.#....#.'], .22, .41, 3.3, { '#': line }, 1);
    wtext('y', name, .95, .41, 3.36, '#1b2233'); wtext('y', 'STATION', .95, .41, 2.98, '#55627a'); wtext('y', p.sub || 'LINE 1 > CITY', .2, .41, 2.54, '#ffffff'); });
  box(1.5, .12, 1.2, .6, .16, .6, '#2a3140'); lit(() => { qy(1.55, 2.05, .29, 1.25, 1.75, '#141c2b'); wtext('y', '4', 1.6, .3, 1.68, '#ffb84a'); wtext('y', 'M', 1.84, .3, 1.68, '#6dff8a'); });
  if (winter()) qz(0, W, 0, .4, 3.51, SNOW);
}

export default [
  { id: 'prop.airport.lights', kind: 'prop', solid: false, tags: ['airport', 'runway', 'light'], size: p => [p.len || 8, .5, .5], vb: p => [-.3, -.2, 0, (p.len || 8) + .3, .8, .8],
    variants: [{ len: 8, color: 'blue' }, { len: 8, color: 'white' }, { len: 8, color: 'green', step: 1 }, { len: 6, color: 'red', step: .75 }, { len: 8, color: 'white', alt: 'amber' }], draw: lights },
  { id: 'prop.airport.papi', kind: 'prop', solid: true, tags: ['airport', 'runway', 'light'], size: [.8, 3.6, .8], vb: [-.3, -.3, 0, 1.2, 3.9, 1.1], variants: [{ red: 2 }, { red: 3 }], draw: papi },
  { id: 'prop.airport.windsock', kind: 'prop', solid: true, tags: ['airport', 'runway'], size: [.6, .6, 4.4], vb: p => [-.2, -.3, 0, 2.8, .9, (p.h || 4.2) + .6], variants: [{ wind: .9 }, { wind: .35 }, { wind: 0 }], draw: windsock },
  { id: 'prop.airport.gantry', kind: 'prop', solid: true, tags: ['airport', 'runway', 'light'], size: p => [.5, p.w || 5, (p.h || 3) + .4], vb: p => [-.3, -.3, 0, .9, (p.w || 5) + .3, (p.h || 3) + .8], variants: [{ h: 3, w: 5 }, { h: 1.6, w: 5, red: true }, { h: 4.5, w: 7, n: 7 }], draw: gantry },
  { id: 'prop.airport.rwysign', kind: 'prop', solid: true, tags: ['airport', 'runway', 'sign'], size: [1.4, .3, 1.2], vb: [-.2, -.2, 0, 3.4, .6, 1.5],
    variants: [{ text: '4' }, { text: '2' }, { kind: 'hold', text: '09-27' }, { kind: 'taxi', text: 'A2', arrow: 'r' }, { kind: 'taxi', text: 'B', arrow: 'l' }, { kind: 'loc', text: 'A' }], draw: rwySign },
  { id: 'prop.airport.luggage', kind: 'prop', solid: true, tags: ['airport', 'luggage', 'clutter'], size: p => ({ single: [.7, .5, .8], duo: [1.3, 1, .9], family: [1.9, 1, .9] }[p.kind] || [1.8, 1.3, 1]), vb: [-.2, -.2, 0, 2.1, 1.5, 1.4],
    variants: [{ kind: 'single', seed: 1 }, { kind: 'single', seed: 4, col: '#f2c230' }, { kind: 'duo', seed: 2 }, { kind: 'family', seed: 3 }, { kind: 'pile', seed: 5 }, { kind: 'pile', seed: 8 }], draw: luggage },
  { id: 'prop.airport.trolley', kind: 'prop', solid: true, tags: ['airport', 'luggage'], size: [1, .7, 1], vb: [-.2, -.2, 0, 1.3, 1, 1.5], variants: [{ bags: 0 }, { bags: 2, seed: 2 }, { bags: 3, seed: 5 }], draw: p => trolley(0, 0, p.bags || 0, rng(p.seed || 1)) },
  { id: 'prop.airport.trolleycorral', kind: 'prop', solid: true, tags: ['airport', 'luggage'], size: p => [1.8 + (p.n || 6) * .28, 1, 1], vb: p => [-.2, -.2, 0, 2.1 + (p.n || 6) * .28, 1.2, 2.4], variants: [{ n: 6 }, { n: 10 }], draw: corral },
  { id: 'prop.airport.cones', kind: 'prop', solid: true, tags: ['airport', 'apron', 'clutter'], size: p => [.5 + ((p.n || 1) - 1) * (p.step || 1), .5, .65], variants: [{ n: 1 }, { n: 3 }, { n: 4, step: 1.5, tape: true }], draw: cones },
  { id: 'prop.airport.totem', kind: 'prop', solid: true, tags: ['airport', 'sign', 'wayfinding'], size: p => [totemW(p), .35, .55 + (p.rows ? p.rows.length : 1) * .55 + .7], light: { x: 1.1, y: 1, z: 0, r: 2 },
    variants: [{ rows: [['ARRIVALS', 'u', '#f2c230', '#1b2233']] }, { rows: [['TAXI', 'r', '#f2c230', '#1b2233']] }, { rows: [['BUS', 'l', '#2f7fd0', '#ffffff']] }, { rows: [['TRAIN', 'u', '#2f8f8a', '#ffffff']] },
      { rows: [['ARRIVALS', 'u', '#f2c230', '#1b2233'], ['DEPARTURES', 'u'], ['TAXI', 'r', '#f2c230', '#1b2233'], ['BUS', 'r', '#2f7fd0'], ['TRAIN', 'l', '#2f8f8a'], ['PARKING', 'l']] }, { rows: [['HOTEL', 'l'], ['CAR HIRE', 'r', '#f08a2c', '#1b2233'], ['CARGO', 'r']] }], draw: totem },
  { id: 'prop.airport.flagpole', kind: 'prop', solid: true, tags: ['airport', 'flag'], size: [.6, .6, 6.2], vb: p => [-.2, -.2, 0, 2.6, .9, (p.h || 6) + .4], variants: [{ flag: 'maple', seed: 1 }, { flag: 'bay', seed: 2 }, { flag: 'tri', seed: 3 }, { flag: 'sun', seed: 4 }], draw: flagpole },
  { id: 'prop.airport.fence', kind: 'prop', solid: true, tags: ['airport', 'fence', 'airside'], size: p => [p.len || 8, .2, 2.4], vb: p => [-.2, -.2, 0, (p.len || 8) + .2, .7, 2.9], variants: [{ len: 8 }, { len: 4, sign: false }, { len: 10, gate: true }], draw: fence },
  { id: 'prop.airport.blastfence', kind: 'prop', solid: true, tags: ['airport', 'fence', 'airside'], size: p => [p.len || 8, 1.6, 2.3], vb: p => [-.2, -.2, 0, (p.len || 8) + .2, 1.8, 2.7], variants: [{ len: 8 }, { len: 4 }], draw: blast },
  { id: 'prop.airport.railsign', kind: 'prop', solid: true, tags: ['airport', 'sign', 'rail', 'station'], size: [3.6, .4, 3.5], vb: [-.3, -.3, 0, 4.4, .7, 3.8], light: { x: 1.8, y: 1.2, z: 0, r: 2.5 }, variants: [{}, { name: 'AIRPORT T1', line: '#d8483a', sub: 'LOOP > CITY' }], draw: railsign },
];
