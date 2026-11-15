// Assembles the generator steps (pure, DOM-free). getCity(seed?) generates once and caches.
import { generateCity } from './_gen.js';
import { install } from './_lots.js';
import * as rail from './_rail.js';
import * as airport from './_airport.js';
import * as places from './_places.js';
import * as blocks from './_blocks.js';
import * as furnish from './_furnish.js';
import * as dress from './_dress.js';
let city = null;
export function getCity(seed) {
  if (!city) city = generateCity(seed === undefined ? 20261 : seed, {
    terrain: [install, rail.terrain, places.terrain],
    ground: [airport.ground, places.ground, blocks.ground],
    build: [c => c.flushBuildings(), rail.build, airport.build, places.build, blocks.build, furnish.build, dress.build, furnish.offRoad],
  });
  return city;
}
