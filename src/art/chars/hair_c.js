// Hairstyles and facial hair, batch C (artist C). Template language: see hair_ex.js (11 columns x = -5..5, row 6 = top of the skull, 4 = brow,
// 0 = chin; front view faces right; h hair, H highlight, d dark, t stubble/fade, s skin, c accent bead / tie, . nothing).
import { regShape, regHair } from './_shapes.js';

// 360 waves: close crop, rippled wave pattern, crisp line-up, faded sides.
regHair('waves', { f: [6, ['...hHhHh...', '..HhHhHhH..', '..hHhh.....', '..tt.......', '..t........']],
  b: [6, ['...hHhHh...', '..HhHhHhH..', '..hHhHhHh..', '..thhhhht..', '..ttttttt..', '...ttt.s...']] });
// Two-strand twists, chin length, bumpy top.
regHair('twists', { f: [8, ['...h.h.h...', '..hHhHhHh..', '.hhdhhdhhh.', '.hdhhdhhdh.', '.hdhh.d..h.', '.dhd.....d.', '.hdh.......', '.d.d.......']],
  b: [8, ['...h.h.h...', '..hhHhHhh..', '.hdhhdhhdh.', '.hdhdhdhdh.', '.dhdhdhdhd.', '.hdhdhdhdh.', '.dhdhdhdhd.', '.h.d.h.d.h.']] });
// Bantu knots: little coiled knots on a parted scalp.
regHair('bantuknots', { f: [8, ['..hH..hH...', '..dhttdh...', '.hHtttthH..', '.dhtttttdh.', '..tt.......', '..t........']],
  b: [8, ['..hH..hH...', '..dhttdh...', '.hHtttthH..', '.dhttttdh..', '..tthHtt...', '..ttdhtt...', '...ttt.s...']] });
// Fulani braids: cornrowed top, long braids with beads (accent colour), one braid framing the face.
regHair('fulani', { f: [6, ['...hthth...', '..hththth..', '..hthth.h..', '.hcdh...h..', '.hdh....c..', '.dhc.......', '.hdh.......', '.chd.......', '.hdh.......', '.c.c.......']],
  b: [6, ['...hthth...', '..hththth..', '..hththth..', '.hdhdhdhd..', '.hdhcdhdh..', '.hchdhchd..', '.hdhdhdhd..', '.chdhcdhd..', '.hdhdhdhd..', '.c.c.c.c...']] });
// Goddess locs: long locs with loose curly ends and cuffs (accent).
regHair('goddesslocs', { f: [7, ['...hhhh....', '..hHhHhhh..', '..hhHhhHh..', '.hdhh.h.h..', '.hdh....d..', '.dhd....h..', '.hch.......', '.dhd.......', '.hdh.......', '.dhd.......', 'Hh.hH......', '.H..h......']],
  b: [7, ['...hhhh....', '..hhHhhhh..', '..hdhHhdh..', '.hdhdhdhd..', '.dhdhdhdh..', '.hdhchdhd..', '.dhdhdhdh..', '.hdhdhdhd..', '.dhdhcdhd..', '.hdhdhdhd..', 'HhHhHhHh...', '.H.h.H.h...']] });
// Finger waves: short, sculpted glossy S-waves and a pinned curl on the forehead.
regHair('fingerwaves', { f: [6, ['...hHhhH...', '..HhhHhhH..', '..hHhhHH...', '..hH.......', '..h........']],
  b: [6, ['...hHhhH...', '..HhhHhhH..', '..hHhhHhh..', '..hhHhhH...', '..dhhHhs...', '...ddd.....']] });
// Pineapple: curls gathered into a high puff, a band (accent) at its base.
regHair('pineapple', { f: [10, ['...hHhH....', '..hHhhHh...', '..hhHhhhh..', '...hhhhh...', '...hhchh...', '..hhhhhhh..', '..hhh...h..', '..hh.......', '..hs.......']],
  b: [10, ['...hHhH....', '..hhHhHh...', '..hHhhhHh..', '...hhhhh...', '...hhchh...', '..hhhhhhh..', '..hhhhhhh..', '..dhhhhs...', '...ddd.....']] });
// Tapered afro: tall rounded top, tight faded sides.
regHair('taperfro', { f: [9, ['...hhhhh...', '..hhHHhhh..', '.hhHHhhhhh.', '.hhhhhhhhh.', '..hhhh.hh..', '..tt.......', '..t........']],
  b: [9, ['...hhhhh...', '..hhhHhhh..', '.hhhhHHhhh.', '.hhhhhhhhh.', '..hhhhhhh..', '..ttttttt..', '..ttttt....', '...ttt.s...']] });
// Frohawk: a curly crest down the middle, shaved sides.
regHair('frohawk', { f: [9, ['..h.hHh....', '..hHhhhh...', '..hhHhHhh..', '..thhhhht..', '..tthhhtt..', '..tt.......', '..t........']],
  b: [9, ['...h.h.h...', '...hHhHh...', '...hhHhh...', '..thhhhht..', '..tthhhtt..', '..tthhhtt..', '..ttthht...', '...ttt.s...']] });
// Dutch (boxer) braids: two raised braids from the hairline, a centre part, tails over the shoulders.
regHair('dutchbraids', { f: [7, ['...hdh.....', '..hdhdhd...', '..dhhdhhd..', '..hdh..h...', '.dhs.......', '.hd........', '.dh........', '.hd........', '.c.........']],
  b: [7, ['...hd.dh...', '..hdh.hdh..', '..dhd.dhd..', '..hdh.hdh..', '..dhd.dhd..', '..hd...hd..', '..dh...dh..', '..hd...hd..', '..c....c...']] });
// Crown (milkmaid) braid: a braid wrapped over the top like a band, smooth hair below.
regHair('crownbraid', { f: [7, ['...dhdhd...', '..hdhdhdh..', '..hhHhhhh..', '..hhh...h..', '..hh.......', '..hs.......']],
  b: [7, ['...dhdhd...', '..hdhdhdh..', '..hhhHhhh..', '..hhhhhhh..', '..dhdhdhd..', '..hdhdhd...', '...ddd.....']] });
// Messy bun: loose top bun with flyaways, face-framing strands left out.
regHair('messybun', { f: [9, ['...h.h.....', '..hhHh.h...', '...hhhh....', '...hHHhh...', '..hhhhhhh..', '..hh....h..', '..h.....h..', '..h........']],
  b: [9, ['...h.h.....', '..hhHh.h...', '...hhhh....', '..hhhHhh...', '..hhhhhhh..', '..hhhhhhh..', '..h.hh.h...', '..h....h...']] });
// Butterfly cut: long, big layered volume, face-framing layers that flick outwards.
regHair('buttercut', { f: [7, ['...hhhhh...', '..hHHhhhh..', '.hhHhhhhhh.', '.hhhh..hhh.', '.hhh.....hh', '.hhh.....h.', 'hhhh.......', 'hhhh.......', '.hhh.......', 'Hhhh.......', '.hhd.......', '..dd.......']],
  b: [7, ['...hhhhh...', '..hhhHhhh..', '.hhhhHhhhh.', '.hhhhhhhhh.', 'hhhhhhhhhhh', '.hhhhhhhhh.', '.hhhhhhhh..', 'hhhhhhhhh..', '.hhhhhhhh..', 'hhHhhhhHh..', '.hhdhhdhh..', '..d.dd.d...']] });
// French crop: choppy textured top, short blunt fringe jutting forward, skin-faded sides.
regHair('frenchcrop', { f: [7, ['....hHh....', '..hhHhHhh..', '..thHhhhhh.', '..tt.......', '..t........']],
  b: [7, ['....hHh....', '..hhHhHhh..', '..thhhhht..', '..ttttttt..', '..ttttt....', '...ttt.s...']] });
// Side shave: one side buzzed, the rest swept over and falling long past the cheek.
regHair('sideshave', { f: [7, ['....hhhh...', '...thHHhh..', '..tthHhhhh.', '..tt....hh.', '..t.....hh.', '........hh.', '........hd.', '........d..']],
  b: [7, ['....hhhh...', '...thhHhh..', '..tthhhhh..', '..ttthhhh..', '..tttthhh..', '...tt.hhh..', '......hhh..', '......hd...']] });
// Silk press: long, poker-straight and glossy, centre part, a straight curtain in front of the shoulder.
regHair('silkpress', { f: [7, ['...hhHh....', '..hhHh.hh..', '..hhhHhhhh.', '..hhh...hh.', '..hhh....h.', '..hhh....h.', '..hhh....h.', '..hhh....h.', '..hhh....H.', '..hhh....h.', '..Hhh......', '..hhd......']],
  b: [7, ['...hhHh....', '..hhh.hhh..', '..hhhHhhh..', '..hhhHhhh..', '..hhhHhhh..', '..hhhHhhh..', '..hhhHhhh..', '..hhhHhhh..', '..hhhHhhh..', '..hhhHhhh..', '..hhhhhhh..', '..ddddddd..']] });
// Bubble ponytail: high pony sectioned by bands (accent) into bubbles.
regHair('bubblepony', { f: [6, ['...hHHhh...', '..hhHhhhh..', '..hhhh..h..', 'hhhh.......', 'cHhs.......', 'hh.........', '.c.........', 'Hh.........', 'hh.........', '.c.........', 'hh.........', '.d.........']],
  b: [6, ['...hhHhh...', '..hhhHhhh..', '..hhhhhhh..', '..hhhhhh...', '..dhhchs...', '...hHHh....', '....cc.....', '...hHHh....', '...hhhh....', '....cc.....', '...hHHh....', '....hd.....']] });
// Twist-out: big defined curls, shoulder length, the widest curly silhouette.
regHair('twistout', { f: [8, ['...hHhHh...', '..hHhhhHh..', '.hHhhHhhhh.', 'hhhHhhhHhhh', '.hHhh....hH', 'hhHh.....hh', 'hHhh......h', '.hhHh......', 'hHhhh......', '.hhHh......', '..hd.h.....']],
  b: [8, ['...hHhHh...', '..hhHhhHh..', '.hHhhhHhhh.', 'hhhHhhhHhhh', 'hHhhHhhhHhh', 'hhHhhhHhhhH', 'hHhhHhhhHh.', '.hhHhhHhhh.', 'hhhhHhhHhh.', '.hHhhhhHh..', '..hd.hd.h..']] });
// Braided top bun: box braids swept up into a big bun.
regHair('braidbun', { f: [9, ['..hdhd.....', '..dhdhd....', '...hdhh....', '..hdhdhdh..', '..dhdhdhd..', '..hdh...h..', '..hd.......', '..h........']],
  b: [9, ['...hdhd....', '..dhdhdh...', '...hdhd....', '..hdhdhdh..', '..dhdhdhd..', '..hdhdhdh..', '..dhdhdhd..', '..hdhdhs...', '...ddd.....']] });

/* ---------------- facial hair ---------------- */
// Boxed beard: neat and short, joined to the sideburns, a squared-off bottom edge.
regShape('beard', 'boxed', { draw(g) { const { p, cx, yb, h, d } = g;
  p(cx - 2, yb - 2, h); for (const x of [-2, -1, 0, 2, 3]) p(cx + x, yb - 1, h); if (g.mouth !== 1) p(cx + 1, yb - 1, g.lt(h, .12));
  for (let x = -2; x <= 2; x++) p(cx + x, yb, x === -2 ? d : h); for (let x = -1; x <= 1; x++) p(cx + x, yb + 1, d); } });
// Horseshoe moustache: down both sides of the mouth to below the chin.
regShape('beard', 'horseshoe', { draw(g) { const { p, cx, yb, h, d } = g;
  p(cx, yb - 1, h); p(cx + 2, yb - 1, h); p(cx + 3, yb - 1, d); p(cx, yb, h); p(cx + 2, yb, h); p(cx, yb + 1, d); p(cx + 2, yb + 1, d); } });
// Pencil moustache: a thin dark line split at the lip.
regShape('beard', 'pencil', { draw(g) { const { p, cx, yb, d } = g; p(cx, yb - 1, g.dk(d, .15)); p(cx + 2, yb - 1, g.dk(d, .15)); } });
// Chevron: thick, wide moustache covering the lip.
regShape('beard', 'chevron', { draw(g) { const { p, cx, yb, h, d } = g; for (let x = -1; x <= 3; x++) p(cx + x, yb - 1, x === -1 || x === 3 ? d : h); p(cx + 1, yb - 1, g.lt(h, .15)); } });
// Long sideburns down to the jaw, nothing else.
regShape('beard', 'sideburns', { draw(g) { const { p, cx, yb, h, d } = g; p(cx - 2, yb - 2, h); p(cx - 2, yb - 1, h); p(cx - 2, yb, d); p(cx - 3, yb - 1, d); p(cx - 3, yb - 2, h); } });
// Garibaldi: big, wide, rounded full beard with highlights.
regShape('beard', 'garibaldi', { draw(g) { const { p, cx, yb, h, d } = g, H = g.lt(h, .2);
  p(cx - 2, yb - 2, h); for (let x = -2; x <= 3; x++) if (x !== 1) p(cx + x, yb - 1, h); if (g.mouth !== 1) p(cx + 1, yb - 1, H);
  for (let x = -2; x <= 3; x++) p(cx + x, yb, x === -2 ? d : x === 0 ? H : h); for (let x = -1; x <= 2; x++) p(cx + x, yb + 1, x === 1 ? H : h); p(cx, yb + 2, d); p(cx + 1, yb + 2, d); } });
