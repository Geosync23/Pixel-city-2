// Garment SHAPE registry: the drawing API every wear_*.js / hair_*.js module implements. See docs/reports/clothes_drawing.md.
//   regShape(slot, id, def)   slot: 'top' | 'outer' | 'dress' | 'bottom' | 'shoes' | 'hat' | 'neck' | 'glasses' | 'bag' | 'beard'
//   regHair(id, { f: [topRow, rows], b: [topRow, rows] })  or  regHair(id, hairFrom(capId, tailId))
// char.js (the engine; artists do not edit it) calls the hooks at the right layer for every pose, frame and direction: a shape only
// describes the garment on the canonical standing figure, the engine bends, mirrors, shades, outlines and animates it.
// A registered shape WINS over a built-in of the same id (pass `override: true` in the def, or regHair(id, tpl, true), to redraw a built-in on purpose).
// Modules under src/art/ are auto-imported (tools/artfiles.mjs), so a new file registers itself; nobody edits an index.
import { hairFrom as hf, CAP, TAIL } from './_wear.js';
export const SLOTS = ['top', 'outer', 'dress', 'bottom', 'shoes', 'hat', 'neck', 'glasses', 'bag', 'beard'];
export const SHAPES = {}; for (const s of SLOTS) SHAPES[s] = {};
export const HAIR_REG = {};
/** ids drawn by char.js itself (filled by char.js at load); shapeIds(slot) = built-ins + registered */
export const BUILTIN = { hair: [] }; for (const s of SLOTS) BUILTIN[s] = [];
export function regShape(slot, id, def) {
  if (!SHAPES[slot]) throw new Error('regShape: unknown slot ' + slot);
  if (SHAPES[slot][id] || (BUILTIN[slot].includes(id) && !def.override)) console.warn('duplicate shape', slot, id);
  def.id = id; def.slot = slot; SHAPES[slot][id] = def; return def;
}
export function regHair(id, tpl, override) {
  const fix = side => [side[0], side[1].map(r => (r + '...........').slice(0, 11))];
  if (HAIR_REG[id] || (BUILTIN.hair.includes(id) && !override)) console.warn('duplicate hair', id);
  HAIR_REG[id] = { f: fix(tpl.f), b: fix(tpl.b) }; return HAIR_REG[id];
}
export const hairFrom = hf; export { CAP, TAIL };
export const shapeIds = slot => [...new Set((BUILTIN[slot] || []).concat(Object.keys(slot === 'hair' ? HAIR_REG : SHAPES[slot] || {})))];
export const hasShape = (slot, id) => shapeIds(slot).includes(id);
/** torso garment for a spec.top / spec.outer id (tops, dresses and outerwear share one API) */
export const torsoShape = id => SHAPES.top[id] || SHAPES.dress[id] || SHAPES.outer[id] || null;
