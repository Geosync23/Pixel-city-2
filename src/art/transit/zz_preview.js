// Composed gallery previews for the transit folder (no assets exported). `node tools/gallery.mjs lineup --night`
import { at, qz } from '../../engine/raster.js';
import cars from './cars.js';
import service from './service.js';
import train, { drawCar } from './train.js';
const ALL = new Map();
export const addAll = list => { for (const a of list) ALL.set(a.id, a); };
addAll(cars); addAll(service); addAll(train);
const sz = (a, p) => typeof a.size === 'function' ? a.size(p) : a.size;
/** grid of assets: rows = [[ [id, params], ... ], ...]; each row runs along x, rows stack along y */
export function sheet(id, rows, o) {
  o = o || {}; const gx = o.gx === undefined ? 1.2 : o.gx, gy = o.gy === undefined ? 2.6 : o.gy; const cells = []; let y = 0, W = 0, H = 0;
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
  sheet('lineup.service', [
    [['veh.taxi', {}], ['veh.police', {}], ['veh.van', {}], ['veh.van.delivery', {}], ['veh.van.icecream', {}]],
    [['veh.ambulance', {}], ['veh.truck.box', {}], ['veh.truck.garbage', {}]],
    [['veh.taxi', { dir: -1 }], ['veh.police', { dir: -1 }], ['veh.van', { dir: -1, color: '#31556b' }], ['veh.van.delivery', { dir: -1 }], ['veh.van.icecream', { dir: -1 }]],
    [['veh.ambulance', { dir: -1 }], ['veh.truck.box', { dir: -1, color: '#31556b', box: '#e9dcc0', name: 'MAPLE FOODS' }], ['veh.truck.garbage', { dir: -1 }]],
  ], { road: true }),
  sheet('lineup.bus', [
    [['veh.bus', {}], ['veh.truck.fire', {}]],
    [['veh.bus.double', { color: '#c9382e', route: '1', dest: 'CITY TOUR' }], ['veh.truck.fire', { dir: -1 }]],
    [['veh.bus', { dir: -1, route: '7', dest: 'HILLCREST' }], ['veh.bus.double', { dir: -1 }]],
  ], { road: true, gy: 2.4 }),
  { id: 'lineup.train3', size: [36.8, 2.2, 0], vb: [-1, -.4, 0, 38, 2.6, 3.7], draw() { ['rear', 'mid', 'front'].forEach((h, i) => at(i * 12.4, 0, 0, () => drawCar({ head: h, livery: 'line1', seed: i + 1, dest: 'HARBOR' }))); } },
  { id: 'lineup.train2', size: [24.4, 2.2, 0], vb: [-1, -.4, 0, 26, 2.6, 3.7], draw() { ['rear', 'front'].forEach((h, i) => at(i * 12.4, 0, 0, () => drawCar({ head: h, livery: 'line2', seed: i + 4, dest: 'AIRPORT', dir: -1 }))); } },
];
export default [];
