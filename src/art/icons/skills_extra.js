// 16x16 icons for the 15 new skills (skill.<id>), the Me app (app.me), a book glyph (ui.book) and the mini-game tokens (sk.*).
// Registered into the shared ICONS table at import (same pattern as showpiece/_nat_icons.js); no world assets here.
// IMPORTANT: this module also imports src/data/skills_extra.js. The art index loads before the gameplay modules, so that import is what
// registers the new skills / activities / books early enough for every system to see them (see the header of that data file).
import { ICONS } from './icons.js';
import { icon, R, r, OV, ov, PG, pg, ln, p, ps, st, spr, P, sparkle } from './_lib.js';
import { glyph2 } from './extras.js';
import '../../data/skills_extra.js';

const I = {
  'skill.music': () => { spr(3, 1, ['......####', '...#######', '...####..#', '...#.....#', '...#.....#', '...#.....#', '...#.....#', '...#...###', '.###..####', '####..####', '####...##.', '.##.......'], { '#': P.teal }, { shade: true }); },
  'skill.painting': () => { PG([[10, 0], [15, 5], [8, 12], [3, 7]], P.wood); PG([[3, 7], [8, 12], [5, 15], [0, 15], [0, 10]], P.steel); PG([[0, 11], [4, 15], [0, 15]], P.red); ln(11, 2, 13, 4, '#d8a868'); p(1, 13, '#ff9a8a'); },
  'skill.writing': () => { PG([[11, 0], [15, 4], [6, 13], [2, 9]], P.navy); PG([[2, 9], [6, 13], [1, 15], [0, 14]], P.gold); p(1, 14, P.black); ln(12, 2, 13, 3, '#6f86d8'); ln(4, 9, 6, 11, P.steel); r(8, 15, 7, 1, P.slate); },
  'skill.photography': () => { R(0, 4, 16, 10, P.slate); R(4, 2, 6, 3, P.dark); OV(4, 5, 8, 8, P.black); ov(6, 7, 4, 4, P.sky); p(7, 8, P.white); r(12, 5, 2, 1, P.gold); r(1, 5, 2, 1, P.red); },
  'skill.gardening': () => { PG([[2, 9], [14, 9], [12, 15], [4, 15]], P.crust); r(2, 9, 12, 2, P.wood); r(7, 3, 2, 6, P.green); PG([[8, 5], [13, 1], [14, 5], [10, 7]], P.leaf); PG([[7, 6], [2, 2], [1, 6], [5, 8]], P.leaf); p(12, 3, P.lime); p(3, 4, P.lime); },
  'skill.dancing': () => { OV(6, 0, 4, 4, P.skin); spr(1, 4, ['#....#####....', '##..#######..#', '.#####.######.', '....#####.....', '....#####.....', '...###.###....', '..###...###...', '.###.....###..', '.##.......###.', '###........##.'], { '#': P.rose }, { shade: true }); st([[14, 1], [15, 0], [1, 1]], P.gold); },
  'skill.swimming': () => { OV(8, 2, 5, 5, P.skin); r(8, 2, 5, 2, P.navy); PG([[1, 7], [9, 5], [11, 8], [3, 10]], P.skin); r(0, 10, 16, 5, P.blue); spr(0, 9, ['.##...##...##...', '####.####.####.#'], { '#': P.sky }, { soft: true }); ps([[2, 13], [3, 13], [8, 12], [9, 12], [13, 14]], P.ice); },
  'skill.fishing': () => { ln(1, 15, 12, 1, P.brown); ln(12, 1, 13, 9, P.steel, true); spr(7, 9, ['..####.#', '.#######', '########', '.#######', '..####.#'], { '#': P.sky }, { shade: true }); p(9, 10, P.black); r(0, 14, 3, 2, P.wood); },
  'skill.gaming': () => { spr(0, 3, ['..####....####..', '.##############.', '################', '################', '################', '################', '####..####..####', '###....##....###', '.#............#.'], { '#': P.purple }, { shade: true }); r(3, 6, 1, 3, P.white); r(2, 7, 3, 1, P.white); p(11, 6, P.gold); p(13, 7, P.red); p(11, 8, P.leaf); },
  'skill.chess': () => { spr(3, 1, ['##.##.##.#', '##########', '##########', '.########.', '..######..', '..######..', '..######..', '..######..', '.########.', '.########.', '##########', '##########', '##########'], { '#': P.cream }, { shade: true }); },
  'skill.mixology': () => { PG([[1, 2], [15, 2], [9, 9], [7, 9]], P.ice); PG([[3, 4], [13, 4], [9, 8], [7, 8]], '#8fd8f0'); r(7, 9, 2, 5, P.steel); r(4, 14, 8, 2, P.steel); OV(11, 0, 4, 4, P.orange); ln(4, 1, 8, 6, P.red); },
  'skill.bartering': () => { OV(0, 5, 9, 9, P.gold); OV(7, 2, 9, 9, P.yellow); ov(9, 4, 5, 5, P.gold); r(11, 5, 1, 3, P.crust); ov(2, 7, 5, 5, P.yellow); r(4, 8, 1, 3, P.crust); sparkle(14, 13); },
  'skill.style': () => { ln(8, 1, 8, 3, P.slate); ln(8, 3, 6, 5, P.slate); PG([[8, 4], [15, 10], [15, 12], [1, 12], [1, 10]], P.rose); PG([[8, 6], [12, 10], [4, 10]], '#ffd0dc'); r(6, 0, 3, 1, P.slate); r(1, 12, 14, 3, P.pink); },
  'skill.tech': () => { R(0, 2, 16, 11, P.dark); r(1, 3, 14, 9, '#1f2a3a'); ps([[4, 5], [3, 6], [2, 7], [3, 8], [4, 9]], P.leaf); ps([[11, 5], [12, 6], [13, 7], [12, 8], [11, 9]], P.leaf); ln(9, 4, 6, 10, P.gold); r(5, 13, 6, 1, P.steel); r(3, 14, 10, 2, P.slate); },
  'skill.comedy': () => { OV(1, 1, 14, 14, P.face); r(4, 5, 2, 3, P.black); r(10, 5, 2, 3, P.black); PG([[3, 9], [13, 9], [11, 13], [5, 13]], P.black); r(5, 9, 6, 1, P.white); r(6, 12, 4, 1, P.tomato); p(4, 4, P.black); p(11, 4, P.black); },
  'app.me': () => { R(0, 0, 16, 16, '#7a55c8'); OV(5, 2, 6, 6, P.skin); r(5, 2, 6, 2, P.choc); PG([[2, 14], [4, 9], [12, 9], [14, 14]], P.gold); sparkle(13, 3); },
  'sk.idea': () => { OV(3, 0, 10, 10, P.yellow); ov(5, 2, 4, 4, '#fff8c0'); r(6, 10, 4, 2, P.gold); R(5, 12, 6, 3, P.steel); st([[1, 2], [0, 5], [14, 2], [15, 5], [8, 15]], P.gold); },
  'sk.cliche': () => { OV(1, 5, 9, 8, P.grey); OV(6, 3, 9, 9, P.grey); OV(4, 2, 7, 6, P.steel); ps([[5, 8], [8, 8], [11, 8]], P.slate); r(4, 14, 8, 1, P.slate); },
  'sk.weed': () => { spr(1, 1, ['......#.......', '.#....#....#..', '.##...##..##..', '..##..##.##...', '#..##.#####..#', '##..######..##', '.##..####..##.', '..########.#..', '....####......', '.....##.......', '.....##.......'], { '#': '#7a8a2a' }, { shade: true }); ps([[7, 1], [2, 2], [12, 2]], P.yellow); r(4, 13, 8, 2, P.crust); },
  'sk.sprout': () => { r(7, 6, 2, 7, P.leaf); PG([[8, 7], [13, 3], [14, 7], [10, 9]], P.lime); PG([[7, 8], [2, 4], [1, 8], [5, 10]], P.lime); r(3, 13, 10, 2, P.crust); OV(6, 1, 4, 4, P.pink); p(8, 3, P.gold); },
  'sk.bottle': () => { R(6, 0, 4, 4, P.steel); PG([[6, 4], [10, 4], [13, 8], [13, 15], [3, 15], [3, 8]], P.green); r(5, 9, 6, 4, P.cream); r(6, 10, 4, 1, P.red); ln(4, 8, 4, 14, '#7fd08a', true); },
  'sk.dart': () => { PG([[0, 16], [5, 9], [7, 11]], P.steel); PG([[5, 9], [10, 4], [12, 6], [7, 11]], P.gold); PG([[10, 4], [13, 0], [16, 3], [12, 6]], P.red); p(14, 2, P.white); },
};
if (!ICONS['ui.book']) I['ui.book'] = () => { R(2, 2, 12, 12, P.blue); r(3, 3, 2, 10, P.navy); r(6, 5, 6, 1, P.ice); r(6, 7, 5, 1, P.ice); r(3, 13, 10, 1, P.white); };
for (const [id, body] of Object.entries(I)) if (!ICONS[id]) ICONS[id] = icon(body);
export const SKILL_ICON_IDS = Object.keys(I);
