// Hair silhouette lookup for headwear that must cover the hair (hijabs, wraps) or sit on top of it (novelty headbands). Artist C.
// BUILTIN_HAIR = the engine's own templates (exported by char.js); registered / _wear.js styles are read live.
import { HAIR_REG } from './_shapes.js';
import { HAIR_X } from './_wear.js';
const SHORT_B = ['...hhHhh...', '..hhhHhhh..', '..hhhhhhh..', '..hhhhhh...', '..dhhhhs...', '...ddd.....'];
import { HAIR as BUILTIN_HAIR } from './char.js';
/** template {f:[top,rows], b:[top,rows]} of a hair id */
export const hairTplOf = id => HAIR_REG[id] || HAIR_X[id] || BUILTIN_HAIR[id] || BUILTIN_HAIR.short;
/** every hair pixel of the style in this view as [x, row] (x -5..5 around the head centre, row 0 = chin) */
export function hairPx(id, front) { const t = hairTplOf(id)[front ? 'f' : 'b'], out = []; t[1].forEach((s, i) => { for (let j = 0; j < 11; j++) if (s[j] && s[j] !== '.' && s[j] !== 's' && s[j] !== 'l') out.push([j - 5, t[0] - i]); }); return out; }
/** highest row the hair reaches (at least 6 = top of the skull) */
export function hairTop(id, front) { let m = 6; for (const [, r] of hairPx(id, front)) if (r > m) m = r; return m; }
