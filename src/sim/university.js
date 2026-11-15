// TEMP stub (replaced below)
import { G } from '../core/game.js';
import { getCity } from '../world/_city.js';
import { buildCampus } from './_uni_city.js';
export const order = 56.4;
export function init() { try { buildCampus(getCity()); } catch (e) { console.warn(e); } }
