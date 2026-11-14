// Job badges (job.<id>), map/venue pins (venue.<type>), the missing phone app icons (app.guide, app.jobs) and
// the home-goods category glyphs used by the word-based fallback (glyph.<thing>).
import { P, OL, r, R, ov, OV, pg, PG, p, ps, ln, st, spr, clr, glyph, glyphC, GLYPHS, gw, gh, sparkle, dk, lt } from './_lib.js';
import { bed, fridge, sofa, flat, laptop, shelf, consoleBox, plant, guitar, bike, frame, rug, speaker } from './items_home.js';

/** a shared mini glyph at 2x (chunky, shaded, outlined), centred in the icon */
export function glyph2(name, c, c2, dy = 0) {
  const g = GLYPHS[name]; if (!g) return; const rows = [];
  for (const row of g) { let s = ''; for (const ch of row.padEnd(gw(name), '.')) s += ch + ch; rows.push(s, s); }
  spr(Math.max(0, Math.floor((16 - gw(name) * 2) / 2)), Math.max(0, Math.floor((16 - gh(name) * 2) / 2)) + dy, rows, { '#': c, '+': c2 || c }, { shade: true });
}
/** round map pin: coloured disc with a white mini glyph */
export const pin = (c, name, c2) => () => { OV(0, 0, 16, 16, c); glyphC(name, 0, 0, 16, 16, P.white, c2 || P.white, { soft: true }); };

export const JOBS = {
  'job.barista': () => { glyph2('mug', P.white, P.steel, 2); r(3, 4, 8, 2, P.coffee); st([[5, 2], [6, 1], [5, 0], [9, 2], [10, 1]], '#e8eef4'); },
  'job.grocery_clerk': () => { OV(2, 3, 5, 5, P.tomato); r(7, 1, 2, 7, P.leaf); OV(9, 3, 5, 5, P.orange); r(4, 2, 1, 1, P.green); ln(1, 7, 4, 2, P.brown); ln(14, 7, 11, 2, P.brown); PG([[0, 7], [16, 7], [14, 15], [2, 15]], P.tan); r(0, 7, 16, 2, P.wood); for (const x of [4, 7, 10]) r(x, 10, 1, 4, P.wood); },
  'job.line_cook': () => { glyph2('chef', P.white, P.white); r(5, 12, 6, 1, P.steel); },
  'job.office_analyst': () => { laptop('#5e6676', '#f4faff'); r(5, 8, 1, 2, P.leaf); r(7, 6, 1, 4, P.gold); r(9, 5, 1, 5, P.red); },
  'job.courier': () => { glyph2('parcel', P.tan, P.cream); },
  'job.fitness_trainer': () => glyph2('dumbbell', P.slate, P.steel),
  'job.librarian': () => shelf(1, 2, 14, 12, P.wood, 2),
  'job.nurse': () => { R(1, 1, 14, 14, P.white); r(6, 3, 4, 10, P.crimson); r(3, 6, 10, 4, P.crimson); },
  'job.dock_worker': () => { glyph2('crate', P.wood, P.crust, 3); r(7, 0, 2, 3, P.slate); },
  'job.bartender': () => { glyph2('cocktail', '#8fd8f0', P.steel); OV(11, 0, 4, 4, P.orange); },
};
for (const g of ['gig_data_entry', 'gig_freelance_writing', 'gig_online_tutoring', 'gig_dog_walking', 'gig_flyers', 'gig_furniture_assembly']) {
  const m = { gig_data_entry: ['laptop', P.slate, P.sky], gig_freelance_writing: ['pen', P.navy, P.gold], gig_online_tutoring: ['book', P.blue, P.cream], gig_dog_walking: ['dog', P.brown, P.brown], gig_flyers: ['paper', P.cream, P.red], gig_furniture_assembly: ['hammer', P.wood, P.steel] }[g];
  JOBS['job.' + g] = () => glyph2(m[0], m[1], m[2]);
}
export const VENUES = {
  'venue.food': pin(P.red, 'knifefork'),
  'venue.cafe': pin(P.coffee, 'mug'),
  'venue.shop': pin(P.purple, 'shirt'),
  'venue.grocery': pin(P.green, 'cart'),
  'venue.bar': pin(P.navy, 'cocktail'),
  'venue.show': pin(P.rose, 'clapper', '#3a3644'),
  'venue.service': pin(P.teal, 'cross'),
  'venue.transit': pin(P.blue, 'train', P.sky),
  'venue.home': pin(P.orange, 'house', P.choc),
  'venue.work': pin(P.slate, 'briefcase', P.gold),
  'venue.leisure': pin(P.rose, 'star'),
  'venue.stall': pin(P.gold, 'stall', P.red),
  'venue.park': pin(P.leaf, 'tree', P.brown),
};
export const VENUE_ALIAS = { 'venue.workplace': 'venue.work', 'venue.restaurant': 'venue.food', 'venue.station': 'venue.transit', 'venue.market': 'venue.grocery', 'venue.cinema': 'venue.show', 'venue.theatre': 'venue.show' };
export const APPS = {
  'app.guide': () => { PG([[0, 3], [7, 4], [7, 15], [0, 13]], '#f4e6c8'); PG([[9, 4], [16, 3], [16, 13], [9, 15]], '#fbf4e0'); r(7, 4, 2, 11, P.crimson); r(2, 6, 3, 1, P.grey); r(2, 8, 4, 1, P.grey); r(2, 10, 3, 1, P.grey); OV(10, 5, 5, 5, P.red); p(12, 7, P.white); ps([[12, 10], [12, 11]], P.red); },
  'app.jobs': () => glyph2('briefcase', P.brown, P.gold),
};
export const GLYPHX = {
  'cat.homegood': () => sofa('#d8a030', '#f4e6c8'),
  'glyph.bed': () => bed(P.wood, P.blue, P.white),
  'glyph.fridge': () => fridge('#f4e6c8', 3, 0, 10, 16, 5, P.brown),
  'glyph.sofa': () => sofa('#3f8fb8', '#f4e6c8'),
  'glyph.chair': () => { R(3, 1, 2, 14, P.wood); R(3, 8, 10, 2, P.wood); r(11, 10, 2, 5, P.wood); R(3, 2, 8, 4, P.teal); },
  'glyph.table': () => { R(0, 5, 16, 3, P.wood); r(2, 8, 2, 7, P.crust); r(12, 8, 2, 7, P.crust); },
  'glyph.tv': () => { flat(1, 2, 14, 9, '#3b6fd0'); r(7, 11, 2, 2, P.dark); R(3, 13, 10, 2, P.wood); },
  'glyph.laptop': () => laptop('#8a909c', '#6fc3e0'),
  'glyph.shelf': () => shelf(2, 0, 12, 16, P.wood, 3),
  'glyph.console': () => consoleBox(P.white, 2, '#e4e0d8'),
  'glyph.plant': () => plant('monstera', 1, '#c8683a'),
  'glyph.cactus': () => plant('cactus', 0, '#c8683a'),
  'glyph.guitar': () => guitar('#d8923a'),
  'glyph.bike': () => bike(P.red),
  'glyph.frame': () => frame(1, 1, 14, 14, P.gold, '#8fcdf0', (x, y) => { r(x, y + 8, 12, 4, P.leaf); ov(x + 7, y + 2, 3, 3, P.lemon); }),
  'glyph.rug': () => rug('#b02a2a', '#f2c230'),
  'glyph.speaker': () => { R(3, 0, 10, 16, '#7a4a2e'); OV(5, 7, 6, 6, '#2f2c3a'); ov(7, 9, 2, 2, P.slate); OV(6, 2, 4, 4, '#2f2c3a'); p(8, 3, P.slate); },
  'glyph.lamp': () => { PG([[5, 1], [11, 1], [14, 8], [2, 8]], '#f6d870'); r(7, 8, 2, 5, P.brown); R(4, 13, 8, 2, P.brown); st([[4, 10], [11, 10]], '#fff4a8'); },
  'glyph.clock': () => { OV(1, 1, 14, 14, '#2f2c3a'); ov(3, 3, 10, 10, '#fbf4e0'); ln(8, 8, 8, 5, '#2f2c3a'); ln(8, 8, 10, 9, '#2f2c3a'); },
  'glyph.phone': () => { R(4, 0, 8, 16, P.dark); r(5, 2, 6, 10, P.sky); r(7, 13, 2, 1, P.steel); ln(6, 9, 8, 4, P.ice); },
  'glyph.camera': () => { r(4, 2, 4, 2, P.dark); R(1, 4, 14, 10, P.slate); OV(5, 5, 7, 7, P.dark); ov(7, 7, 3, 3, P.sky); p(13, 5, P.gold); },
  'glyph.headphones': () => { OV(2, 1, 12, 12, P.dark); clr(4, 3, 8, 12); clr(2, 9, 12, 5); R(1, 8, 4, 6, P.red); R(11, 8, 4, 6, P.red); },
  'glyph.tool': () => { ln(3, 13, 10, 6, P.steel); ln(4, 13, 11, 6, P.steel); OV(9, 1, 6, 6, P.steel); clr(12, 1, 2, 3); R(1, 11, 4, 4, P.red); },
  'glyph.candle': () => { OV(7, 1, 2, 4, P.orange); R(5, 6, 6, 9, '#f6e6c8'); r(5, 10, 6, 2, P.rose); },
  'glyph.mirror': () => { OV(3, 0, 10, 12, P.gold); ov(4, 1, 8, 10, '#cfe9f4'); ln(6, 7, 9, 3, P.white); r(7, 12, 2, 3, P.gold); },
  'glyph.towel': () => { R(2, 2, 12, 12, P.sky); r(2, 4, 12, 1, P.white); r(2, 11, 12, 1, P.white); },
  'glyph.bath': () => { r(12, 2, 1, 4, P.steel); r(10, 2, 3, 1, P.steel); PG([[0, 7], [16, 7], [15, 12], [13, 14], [3, 14], [1, 12]], P.white); R(0, 6, 16, 2, '#fbf7ee'); },
};
