// EXAMPLE hairstyles and facial hair (artist C owns hair_*.js).
// A hairstyle is two 11-column templates (f = front view, b = back view): [row of the first string, [strings]]. Row 6 = top of the skull, 4 = brow line,
// 0 = chin, below 0 = over the shoulders. Columns are x = -5..5 around the head centre; the head is columns 2..8; in the FRONT view the face looks right
// (eyes at columns 5 and 7, rows 3 and 2), so the back of the head is on the left. Letters: h hair, H highlight, d dark, t stubble (fades), s skin, c accent (tie / bead).
// hairFrom(capId, tailId) builds one from the shared caps and tails in _wear.js (CAP, TAIL): the quickest way to a clean new style.
import { regShape, regHair, hairFrom } from './_shapes.js';

regHair('sidepony', { f: [6, ['...hHHhh...', '..hhhhhhh..', '..hhhh..hc.', '..hh.....hh', '..hs.....hh', '.........hd']], b: [6, ['...hhHhh...', '..hhhHhhh..', '.chhhhhhh..', 'hhhhhhhh...', 'hh.dhhhs...', 'hd..ddd....']] });
regHair('curtainbob', hairFrom('curtain', 'bob'));
regHair('quifffade', hairFrom('quiff', 'tfade'));

// Facial hair: draw(g) with g = { p, cx, yb, h (hair colour), d (darker), st (stubble tone), sk, mouth }. Mouth is at (cx+1, yb-1); the chin row is yb.
regShape('beard', 'vandyke', { draw(g) { g.p(g.cx, g.yb - 1, g.h); g.p(g.cx + 2, g.yb - 1, g.h); g.p(g.cx + 1, g.yb, g.h); g.p(g.cx + 1, g.yb + 1, g.d); } });
regShape('beard', 'handlebar', { draw(g) { g.p(g.cx, g.yb - 1, g.h); g.p(g.cx + 2, g.yb - 1, g.h); g.p(g.cx - 1, g.yb - 2, g.d); g.p(g.cx + 3, g.yb - 2, g.d); } });
