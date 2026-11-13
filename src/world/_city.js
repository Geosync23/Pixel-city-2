// Assembles the generator steps (pure). getCity(seed?) generates once and caches.
import { generateCity } from './_gen.js';
let city = null;
export function getCity(seed) { if (!city) city = generateCity(seed === undefined ? 20261 : seed, { terrain: [], ground: [], build: [] }); return city; }
