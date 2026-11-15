// Hair silhouette lookup for headwear that must cover the hair (hijabs, wraps) or sit on top of it (novelty headbands). Artist C.
// BUILTIN_HAIR is a read-only copy of the 20 hairstyles drawn inside char.js (not exported there); registered / _wear.js styles are read live.
import { HAIR_REG } from './_shapes.js';
import { HAIR_X } from './_wear.js';
const SHORT_B = ['...hhHhh...', '..hhhHhhh..', '..hhhhhhh..', '..hhhhhh...', '..dhhhhs...', '...ddd.....'];
const BUILTIN_HAIR = {
  short: { f: [6, ['...hHHhh...', '..hhHhhhh..', '..hhhh..h..', '..hh.......', '..hs.......']], b: [6, SHORT_B] },
  buzz: { f: [6, ['...ttttt...', '..ttttttt..', '..tt.......', '..t........']], b: [6, ['...ttttt...', '..ttttttt..', '..ttttttt..', '..ttttt....', '...ttt.s...']] },
  sidepart: { f: [7, ['....hhhh...', '...hhHHhh..', '..hhhHHhh..', '..hhh.hhh..', '..hh....h..', '..hs.......']], b: [7, ['....hhhh...'].concat(SHORT_B)] },
  bob: {
    f: [7, ['....hhh....', '...hHHhhh..', '..hhHhhhh..', '..hhhhhhh..', '..hhh...h..', '..hhh...h..', '..hhh......', '..hhd......']],
    b: [7, ['....hhh....', '...hhHhhh..', '..hhhHhhh..', '..hhhhhhh..', '..hhhhhhh..', '..hhhhhh...', '..hhhhhh...', '..dhhhhd...']],
  },
  long: {
    f: [7, ['....hhh....', '...hHHhhh..', '..hhHhhhh..', '..hhhh.hh..', '..hhh...h..', '..hhh......', '..hhh......', '.hhhh......', '.hhh.......', '.hhh.......', '.hhd.......', '..dd.......']],
    b: [7, ['....hhh....', '...hhHhhh..', '..hhhHhhh..', '..hhhhhhh..', '..hhhhhhh..', '..hhhhhh...', '..hhhhhh...', '..hhhhhh...', '..hhhhhh...', '..hhhhhh...', '..dhhhhd...', '...dddd....']],
  },
  ponytail: {
    f: [6, ['...hHHhh...', '..hhhhhhh..', '.chhhh..h..', 'hhhh.......', 'hh.s.......', 'hd.........']],
    b: [6, ['...hhHhh...', '..hhhHhhh..', '..hhhhhhh..', '..hhhchh...', '..dhhhhs...', '...dhhd....', '....hh.....', '....hh.....', '....hd.....']],
  },
  bun: {
    f: [8, ['...hHh.....', '...hhh.....', '...hHHhh...', '..hhhhhhh..', '..hhh...h..', '..hh.......', '..hs.......']],
    b: [8, ['....hHh....', '....hhh....'].concat(SHORT_B)],
  },
  afro: {
    f: [8, ['...hhhhh...', '..hhHHhhh..', '.hhHHhhhhh.', '.hhhhhhhhh.', '.hhhh..hhh.', '.hhh....hh.', '.hhh.....h.', '..hh.......']],
    b: [8, ['...hhhhh...', '..hhhHhhh..', '.hhhhHHhhh.', '.hhhhhhhhh.', '.hhhhhhhhh.', '.hhhhhhhh..', '.hhhhhhh...', '..hhhhh....']],
  },
  curly: {
    f: [7, ['...hHhHh...', '..hHhhhHhh.', '.hhhHhhhhh.', '.hHhh..hh..', '.hhh....h..', '.hHh.......', '..hh.......']],
    b: [7, ['...hHhHh...', '..hhHhhHhh.', '.hHhhhHhhh.', '.hhhHhhhHh.', '.hHhhhhhh..', '.hhhHhhh...', '..hhhhh....']],
  },
  mohawk: {
    f: [9, ['...hhh.....', '..hhHhhh...', '..hhHHhhh..', '...thhhht..', '..ttthhtt..', '..tt.......', '..t........']],
    b: [9, ['....hhh....', '...hhHhh...', '...hhHhh...', '...thhht...', '..tthhhtt..', '..tthhhtt..', '..ttthht...', '...ttt.s...']],
  },
  bald: { f: [5, ['....l......']], b: [5, ['.....l.....']] },
  braids: {
    f: [6, ['...hHHhh...', '..hhhhhhh..', '..hhhh.hh..', '..hh....h..', '.dhs.......', '.h.........', '.d.........', '.h.........', '.d.........', '.c.........']],
    b: [6, ['...hhHhh...', '..hhhHhhh..', '..hhhhhhh..', '..hhhhhh...', '..hhhhhs...', '..hd.hd....', '..dh.dh....', '..hd.hd....', '..c..c.....']],
  },
  spiky: {
    f: [8, ['...h.h.h...', '..hhhHhhh..', '..hHHhhhh..', '..hhhhhhh..', '..hhh.h.h..', '..hh.......', '..hs.......']],
    b: [8, ['...h.h.h...', '..hhhhhhh..'].concat(SHORT_B)],
  },
  pigtails: {
    f: [6, ['...hHHhh...', '..hhhhhhh..', '.chhhh.hh..', '.hhh....hc.', '.h.s.....h.', '.d.......d.']],
    b: [6, ['...hhHhh...', '..hhhHhhh..', '.chhhhhhh..', '.hhhhhhh.c.', '.hdhhhhs.h.', '.d.ddd...d.']],
  },
  balding: { f: [5, ['..h.l......', '..hh.......', '..hh.......', '..hs.......']], b: [5, ['..h..l..h..', '..hhhhhhh..', '..hhhhhh...', '..dhhhhs...']] },
  locs: {
    f: [7, ['...hhhh....', '..hHhHhhh..', '..hhHhhHh..', '.hdhh.h.h..', '.hdh....d..', '.dhd.......', '.hdh.......', '.dhd.......', '.hdh.......', '.d.d.......']],
    b: [7, ['...hhhh....', '..hhHhhhh..', '..hdhHhdh..', '.hdhdhdhd..', '.dhdhdhd...', '.hdhdhdh...', '.dhdhdhd...', '.hdhdhdh...', '.d.dhd.d...', '.c..d..c...']],
  },
  cornrows: { f: [6, ['...hthth...', '..hththth..', '..ht.......', '..h........']], b: [6, ['...hthth...', '..hththth..', '..hththth..', '..hththt...', '...hthts...', '...h.h.....']] },
  hightop: {
    f: [8, ['..hhhhhhh..', '..hhHHhhh..', '..hhhhhhh..', '..thhhhhh..', '..tt.......', '..t........']],
    b: [8, ['..hhhhhhh..', '..hhhHhhh..', '..hhhhhhh..', '..thhhhht..', '..ttttttt..', '..ttttt....', '...ttt.s...']],
  },
  wavy: {
    f: [7, ['...hhhhh...', '..hHHhhhh..', '.hhHhhhhhh.', '.hhhh...hh.', '.hhh.....h.', '.hhh.......', '.hhh.......', 'hhhh.......', 'hhhh.......', '.hhd.......', '.dd........']],
    b: [7, ['...hhhhh...', '..hhhHhhh..', '.hhhhHhhhh.', '.hhhhhhhhh.', '.hhhhhhhh..', '.hhhhhhhh..', '.hhhhhhhh..', 'hhhhhhhhh..', 'hhhhhhhhh..', '.dhhhhhdh..', '.d.dddd.d..']],
  },
  hijab: {
    f: [7, ['....hhh....', '...hHHhhh..', '..hhHhhhh..', '..hhh...h..', '..hh....h..', '..hh....h..', '..hhh..hh..', '..hhhhhhh..', '.hhhhhhhh..', '..dhhhhd...']],
    b: [7, ['....hhh....', '...hhHhhh..', '..hhhHhhh..', '..hhhhhhh..', '..hhhhhhh..', '..hhhhhhh..', '..hhhhhhh..', '..hhhhhhh..', '.hhhhhhhh..', '..dhhhhd...']],
  },
};
/** template {f:[top,rows], b:[top,rows]} of a hair id */
export const hairTplOf = id => HAIR_REG[id] || HAIR_X[id] || BUILTIN_HAIR[id] || BUILTIN_HAIR.short;
/** every hair pixel of the style in this view as [x, row] (x -5..5 around the head centre, row 0 = chin) */
export function hairPx(id, front) { const t = hairTplOf(id)[front ? 'f' : 'b'], out = []; t[1].forEach((s, i) => { for (let j = 0; j < 11; j++) if (s[j] && s[j] !== '.' && s[j] !== 's' && s[j] !== 'l') out.push([j - 5, t[0] - i]); }); return out; }
/** highest row the hair reaches (at least 6 = top of the skull) */
export function hairTop(id, front) { let m = 6; for (const [, r] of hairPx(id, front)) if (r > m) m = r; return m; }
