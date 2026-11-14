// Registry of hand-made rooms that replace the generic templates for converted public places (pub:<n>, see src/sim/public_places.js).
// Each places_*.js module calls registerUnique(builder) at import time; builder(place) -> room def (same shape genericRoom returns, no id/venue) or null.
//   place = { id, n, name, type, tpl, kind, district }
// public_places.js asks uniqueRoom(place) first and falls back to genericRoom. Owned by the lead; workers only call registerUnique.
const BUILDERS = [];
export function registerUnique(fn) { BUILDERS.push(fn); }
export function uniqueRoom(place) {
  for (const fn of BUILDERS) { try { const d = fn(place); if (d) return d; } catch (e) { console.warn('uniqueRoom', place && place.name, e); } }
  return null;
}

// Guide info per place (for the Wander guide + Living Tips): registerInfo(name, { blurb, signature, tryThis: ['...'], activities: ['<activity id or fixture tag>'] }).
// Workers fill this from their places_*.js / lobbies*.js modules; the lead wires it into src/sim/guide.js.
const INFO = new Map();
export function registerInfo(name, info) { if (name && info) INFO.set(name, info); }
export function placeInfo(name) { return INFO.get(name) || null; }
export function allInfo() { return [...INFO.entries()]; }
