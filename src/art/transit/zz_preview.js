// Composed gallery previews for the transit folder (no assets exported). `node tools/gallery.mjs lineup --night`
import { at, qz } from '../../engine/raster.js';
import cars from './cars.js';
const ALL = new Map();
export const addAll = list => { for (const a of list) ALL.set(a.id, a); };
addAll(cars);
const sz = (a, p) => typeof a.size === 'function' ? a.size(p) : a.size;
/** grid of assets: rows = [[ [id, params], ... ], ...]; each row runs along x, rows stack along y */
export function sheet(id, rows, o) {
  o = o || {}; const gx = o.gx === undefined ? 1.2 : o.gx, gy = o.gy === undefined ? 1.6 : o.gy; const cells = []; let y = 0, W = 0, H = 0;
  for (const row of rows) { let x = 0, d = 0; for (const [aid, p] of row) { const a = ALL.get(aid); if (!a) throw new Error('preview: no asset ' + aid); const s = sz(a, p || {}); cells.push([a, p || {}, x, y]); x += s[0] + gx; d = Math.max(d, s[1]); H = Math.max(H, s[2]); } W = Math.max(W, x); y += d + gy; }
  return { id, size: [W, y, 0], vb: [-1, -1, o.z0 || 0, W + 1, y + 1, (o.h || H) + 1.2], draw() { if (o.road) qz(-.5, W + .5, -.5, y + .5, 0, '#5a5862', '#55535d'); for (const [a, p, x, yy] of cells) at(x, yy, o.lift || 0, () => a.draw(p)); } };
}
const P = { beam: true };
export const galleryItems = [
  sheet('lineup.cars', [
    [['veh.car.sedan', { color: '#d64545' }], ['veh.car.hatch', {}], ['veh.car.suv', {}], ['veh.car.sports', {}]],
    [['veh.car.beetle', {}], ['veh.car.pickup', {}], ['veh.scooter', {}], ['veh.motorbike', {}], ['veh.bicycle', {}], ['veh.bicycle', { basket: true, color: '#2f9e44' }]],
    [['veh.car.sedan', { color: '#f1efe8', dir: -1 }], ['veh.car.hatch', { dir: -1, color: '#e8a33a' }], ['veh.car.suv', { dir: -1, color: '#b5654a' }], ['veh.car.sports', { dir: -1, color: '#d64545' }]],
    [['veh.car.beetle', { dir: -1, color: '#e58a8a' }], ['veh.car.pickup', { dir: -1, color: '#31556b' }], ['veh.scooter', { dir: -1 }], ['veh.motorbike', { dir: -1 }], ['veh.bicycle', { dir: -1 }]],
  ], { road: true }),
];
export default [];
