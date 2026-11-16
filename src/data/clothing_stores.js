// clothing_stores.js — the ten brand / speciality CLOTHING STORES added for owner msgs 177-178 (BIBLE "Direction update 39"), and the rule that moves every
// in-store-only piece to "its" shop. Pure data + pure functions (node-safe; imports only clothes_brands.js). Notes: docs/reports/clothing_stores.md.
//   STORES            [{ id ('cs:<key>' = shop id = venue id = room id = place id), name, sign, district, site (the existing building it moves into), hours[7],
//                        level (price multiplier), taste, blurb, keeper: { name, role, spec, lines[] }, tone: [sign bg, sign fg] }]
//   STORE_BY_ID
//   homeShop(piece) -> shop id | null     the new shop a piece is ANCHORED at (first in its `shops`: always on the rails there when it is in store only)
//   alsoAt(piece) -> [shop id]            new shops that carry it as well (weekly rotation, like every other shop)
//   reanchor(CATALOG)                     applies both to every piece's `shops` (idempotent); called once by data/clothes.js
// The city side (doors, signs, venue records) is src/sim/clothing_stores.js; the rooms are src/scenes/rooms/clothing_stores.js.
import { SHOPS } from './clothes_brands.js';

const D = (o, c) => [0, 1, 2, 3, 4, 5, 6].map(() => [o, c]);
const WK = (o, c, so, sc) => [[o, c], [o, c], [o, c], [o, c], [o, c], [o, c], [so, sc]];
const K = (skin, hair, hairColor, x) => Object.assign({ skin, hair, hairColor, build: 'avg', height: 'avg', age: 'adult' }, x);

export const STORES = [
  { id: 'cs:hollowell', name: 'Hollowell & Sons, Tailors', sign: 'HOLLOWELL & SONS', district: 'downtown', level: 1.15, taste: ['formal', 'smart', 'work'], tone: ['#1f3a34', '#e8d8a8'],
    site: { bld: 'bld.downtown.office.brick', at: [220, 253], face: 'x', off: 3.5 }, hours: WK(10, 18, 12, 17),
    blurb: 'Bespoke and off the peg since 1911. Suits, overcoats and oxfords, measured twice and argued about once.',
    keeper: { name: 'Mr. Ambrose Hollowell', role: 'tailor', spec: K('#f8d0aa', 'combover', '#a9a9b4', { age: 'elder', glasses: true, top: 'waistcoat', topColor: '#3a3f4c', innerColor: '#f4f0e8', bottom: 'slacks', bottomColor: '#4a4a58', shoes: '#2f2c3a', neck: 'tie', neckColor: '#8a3848' }),
      lines: ['Stand up straight. No, straighter. There. That is a thirty-eight regular, whatever you were about to tell me.', 'My grandfather cut the mayor\'s wedding suit on that table. The mayor has changed. The table has not.', 'A good overcoat outlives its owner. We consider that a feature.', 'Off the peg today, altered by Thursday. Nobody will know but the two of us.'] } },
  { id: 'cs:nightjar', name: 'Nightjar', sign: 'NIGHTJAR', district: 'arts', level: 1.1, taste: ['party', 'street', 'formal'], tone: ['#1c1622', '#e87ad0'],
    site: { bld: 'bld.arts.lofts', at: [240, 101], face: 'y', off: 5.5 }, hours: [[12, 22], [12, 22], [12, 22], [12, 22], [12, 23], [11, 23], [12, 20]],
    blurb: 'Going-out wear on a runway of its own: black, plum, sequins. Opens at noon because nobody here has ever seen a morning.',
    keeper: { name: 'Vesper', role: 'stylist', spec: K('#84502f', 'bluntbob', '#2b2433', { top: 'bustier', topColor: '#2b2433', outer: 'bolero', outerColor: '#6a3a7a', bottom: 'leather', bottomColor: '#2b2433', shoes: '#2b2433', shoeType: 'platform', earring: 'hoop', earringColor: '#f0c040' }),
      lines: ['Try it under the spotlight. Everything looks honest under the spotlight.', 'Sequins are a neutral. I will not be taking questions.', 'The Orpheum lets out at ten. Half that queue bought their coats here.', 'You are not overdressed. Everyone else is late.'] } },
  { id: 'cs:juniper', name: 'Juniper & Rye Knitwear', sign: 'JUNIPER & RYE', district: 'hillcrest', level: 1.05, taste: ['cozy', 'winter', 'casual'], tone: ['#7a3a22', '#f4e4c0'],
    site: { bld: 'bld.res.craftsman', at: [85, 100], face: 'y' }, hours: D(9, 18),
    blurb: 'A front room on the hill full of wool: oatmeal, rust, forest green. The fire is lit from October and the kettle is never off.',
    keeper: { name: 'Maeve', role: 'knitter', spec: K('#ffe2c8', 'messybun', '#d9722e', { top: 'cableknit', topColor: '#ead9b8', bottom: 'cords', bottomColor: '#7a5238', shoes: '#6a4428', shoeType: 'clog', glasses: 'round', glassesColor: '#7a5238' }),
      lines: ['Feel that one. Local fleece, spun in the valley. It itches for a week and then it is yours for life.', 'I knit the argyle ones in front of the telly. The plot holes are all mine.', 'Sit by the fire if you like. Half my customers only come for the chair.', 'Wash it cold, dry it flat, and never, ever let a moth hear you say cashmere.'] } },
  { id: 'cs:secondwind', name: 'Second Wind Thrift', sign: 'SECOND WIND', district: 'oldtown', level: .65, taste: ['vintage', 'casual', 'street'], tone: ['#2f6a6a', '#ffe9a8'],
    site: { bld: 'bld.res.loft', at: [62, 251], face: 'y', off: 8.5 }, hours: WK(10, 18, 11, 17),
    blurb: 'Next door to the laundromat, which is no accident. Everything here has had a life already. Denim by the yard, coats by the decade, and a five-dollar rail that changes daily.',
    keeper: { name: 'Dot', role: 'shopkeeper', spec: K('#c4875a', 'afropuffs', '#2b2433', { top: 'ringer', topColor: '#e8b83a', topColor2: '#2f6a6a', outer: 'denim', outerColor: '#7fa0c8', bottom: 'cords', bottomColor: '#8a3848', shoes: '#f0ece4', shoeType: 'canvashi' }),
      lines: ['That jacket came in on Tuesday with a cinema ticket from 1987 in the pocket. I left it in. Part of the price.', 'If it fits, it was waiting for you. If it does not, it is waiting for somebody else. No hard feelings.', 'We wash everything twice. Some of it needed three.', 'The five-dollar rail is along the back wall. Elbows are allowed.'] } },
  { id: 'cs:sole', name: 'Cobble & Sole', sign: 'COBBLE & SOLE', district: 'oldtown', level: 1, taste: ['smart', 'casual', 'work'], tone: ['#5a3a26', '#f2d27a'],
    site: { bld: 'bld.res.townhouses', at: [102, 206], face: 'x', off: 8 }, hours: WK(9, 18, 11, 16),
    blurb: 'On Cobbler\'s Row, where else. Shoes on every wall and a cobbler at the back who still resoles them. Boots, brogues, trainers; laces by the yard.',
    keeper: { name: 'Mr. Iosif', role: 'cobbler', spec: K('#dba276', 'balding', '#4a3022', { beard: 'mustache', top: 'shirt', topColor: '#e8e2d4', outfit: null, outer: 'gilet', outerColor: '#5a3a26', bottom: 'slacks', bottomColor: '#4a4a58', shoes: '#6a4428', shoeType: 'brogue' }),
      lines: ['Show me how you walk. Hm. You lean on the left heel. Everybody in this town leans on the left heel. It is the hill.', 'A shoe wants three things: polish, rest and a little respect. Most people manage one.', 'Sit, sit. Nobody ever bought a good boot standing up.', 'I can resole anything but a flip-flop. Do not bring me a flip-flop.'] } },
  { id: 'cs:tidepool', name: 'Tidepool Beach Shop', sign: 'TIDEPOOL', district: 'harbor', level: .9, taste: ['summer', 'casual', 'sporty'], tone: ['#1f8a9a', '#fff3c8'],
    site: { bld: 'bld.harbor.lofts', at: [58, 314], face: 'y', off: 8 }, hours: D(9, 19),
    blurb: 'A corner of Cannery Row that used to stack lobster pots. Now it stacks swimsuits, sandals and straw hats, and somebody always walks sand in.',
    keeper: { name: 'Koa', role: 'shopkeeper', spec: K('#a66a44', 'beachwaves', '#6e4428', { top: 'bowling', topColor: '#3fb8a8', topColor2: '#fff3c8', bottom: 'boardshorts', bottomColor: '#f07a5a', shoes: '#c8a070', shoeType: 'flipflop', neck: 'lei', neckColor: '#f08ab0' }),
      lines: ['Water was fourteen degrees this morning. I went in anyway. I cannot feel my opinions.', 'Straw hats are by the boards. The gulls have a favourite and it is the expensive one.', 'Sand in the fitting room is normal. Sand at the till is a compliment.', 'Take the sandals for a walk round the shop. If they flap, they fit.'] } },
  { id: 'cs:outfitters', name: 'Saltline Outfitters', sign: 'SALTLINE OUTFITTERS', district: 'harbor', level: 1, taste: ['outdoor', 'rain', 'work'], tone: ['#22384a', '#f2c230'],
    site: { bld: 'bld.harbor.warehouse.timber', at: [130, 316], face: 'y' }, hours: WK(7, 18, 9, 16),
    blurb: 'Oilskins, rubber boots and Fern & Field hiking kit under a hung canoe. Open at seven, because the boats do not wait.',
    keeper: { name: 'Captain Bea', role: 'outfitter', spec: K('#f8d0aa', 'lowpony', '#a9a9b4', { age: 'elder', top: 'turtleneck', topColor: '#f4f0e8', outer: 'raincoat', outerColor: '#e8b83a', bottom: 'cargo', bottomColor: '#34507f', shoes: '#3f5a48', shoeType: 'rainboot', hat: 'watchcap', hatColor: '#22384a' }),
      lines: ['If the label says waterproof, I have stood in the harbour in it. If it says showerproof, I got wet so you need not.', 'Glass is falling. Buy the hood today or wish you had on Thursday.', 'Forty years at sea and the only thing I miss is dry socks. Aisle two.', 'That canoe is not for sale. People keep asking. It was my father\'s and it leaks.'] } },
  { id: 'cs:otterline', name: 'Otterline Boathouse', sign: 'OTTERLINE', district: 'harbor', level: 1, taste: ['sporty', 'street', 'outdoor'], tone: ['#d2392f', '#f4f0e8'],
    site: { bld: 'bld.harbor.boathouse', at: [186, 331], face: 'y' }, hours: WK(6, 20, 8, 18),
    blurb: 'The rowing club let out its front bay to Otterline Athletics. Kit for running, rowing and pretending to: try it on the machine.',
    keeper: { name: 'Coach Renny', role: 'coach', spec: K('#643c26', 'skinfade', '#2b2433', { build: 'broad', top: 'quarterzip', topColor: '#d2392f', bottom: 'track', bottomColor: '#2f2c3a', bottomColor2: '#f4f0e8', shoes: '#f4f0e8', shoeType: 'runner', neck: 'lanyard', neckColor: '#f4f0e8' }),
      lines: ['The eight goes out at six. You are welcome to join. Nobody ever does twice.', 'Those shoes are for running. The other wall is for looking like you run. I sell more of the other wall.', 'Stretch first. I am not your coach, but I am A coach, and it hurts me to watch.', 'Otters play Saturday. Wear the red or sit quietly.'] } },
  { id: 'cs:brim', name: 'Brim & Buckle', sign: 'BRIM & BUCKLE', district: 'arts', level: 1.05, taste: ['smart', 'artsy', 'party'], tone: ['#7a2a4a', '#ffd9a0'],
    site: { bld: 'bld.res.gardenapt', at: [238, 74], face: 'y', off: 2.5 }, hours: WK(10, 19, 11, 17),
    blurb: 'Hats to the ceiling, bags in the cubbies, a glass case of things that sparkle. Nobody has ever left with nothing on their head.',
    keeper: { name: 'Odette', role: 'milliner', spec: K('#ecba90', 'chignon', '#4a3022', { top: 'bowblouse', topColor: '#f4f0e8', bottom: 'pencil', bottomColor: '#7a2a4a', shoes: '#2f2c3a', shoeType: 'pump', hat: 'cloche', hatColor: '#2f9a94', neck: 'pearls', neckColor: '#f4f0e8' }),
      lines: ['Chin up. A hat is worn with the neck, not the head.', 'That one makes you look like you know something. Do you? No matter.', 'Every bag in the cubbies holds exactly one more thing than you need. I test them.', 'The mirror is honest. I am kinder. Ask me second.'] } },
  { id: 'cs:lantern', name: 'Little Lantern Atelier', sign: 'LITTLE LANTERN', district: 'maplewood', level: 1, taste: ['artsy', 'summer', 'casual'], tone: ['#2a3a6a', '#f2c230'],
    site: { bld: 'bld.res.cottage', at: [291, 238], face: 'x' }, hours: [null, [10, 18], [10, 18], [10, 18], [10, 18], [10, 18], [10, 17]],
    blurb: 'A cottage workshop where everything is printed, dyed and sewn at the big table. Indigo to the elbows; closed Mondays to let it dry.',
    keeper: { name: 'Wren', role: 'maker', spec: K('#dba276', 'headwrap', '#2b2433', { hair: 'twists', top: 'peasant', topColor: '#f4f0e8', topPat: 'floral', topColor2: '#2a3a6a', bottom: 'overalls', bottomColor: '#34507f', shoes: '#d04a3a', shoeType: 'clog', hat: 'headwrap', hatColor: '#e8b83a' }),
      lines: ['Mind the table, the marigold is still wet. So am I, a bit.', 'Every print is cut by hand. That is why the lanterns lean. I tell people it is the style.', 'Indigo fades where you bend. In a year it will be a map of you.', 'No two the same. I tried once. Got bored halfway.'] } },
];
export const STORE_BY_ID = Object.fromEntries(STORES.map(s => [s.id, s]));
for (const s of STORES) SHOPS[s.id] = { name: s.name, level: s.level, taste: s.taste, cs: true };

const BRAND_HOME = { hollowell: 'cs:hollowell', nightjar: 'cs:nightjar', juniper_rye: 'cs:juniper', little_lantern: 'cs:lantern', tidepool: 'cs:tidepool', saltline: 'cs:outfitters', fern_field: 'cs:outfitters', otterline: 'cs:otterline', lacquer: 'cs:brim' };
const OWN_SHOP = new Set(['marigold', 'hollowell', 'nightjar', 'juniper_rye', 'little_lantern', 'tidepool', 'saltline', 'fern_field', 'otterline', 'second_wind']);   // brands with a shop of their own keep their shoes and hats there
const HIGH_STREET = new Set(['thread_co', 'maple_basics', 'pixelpop', 'kicks_lab', 'lacquer']);
/** the new shop that is this piece's home, or null when it stays where it was (Marigold, Thread & Co. clothes, team merch, catalogue exclusives) */
export function homeShop(p) {
  if (!p || p.online) return null;
  if (p.brand === 'second_wind') return /^(bottom|shoes|outer|hat)$/.test(p.slot) ? 'cs:secondwind' : null;   // the second branch takes denim, coats, shoes and hats; Ink & Ivy keeps tops, dresses and trinkets
  if (p.brand === 'kicks_lab') return null;                                                  // Kicks stays the home of Kicks Lab
  if (BRAND_HOME[p.brand] && (p.brand !== 'lacquer' || p.slot !== 'shoes')) return BRAND_HOME[p.brand];
  if (!OWN_SHOP.has(p.brand) && p.slot === 'shoes') return 'cs:sole';
  if (!OWN_SHOP.has(p.brand) && (p.slot === 'hat' || p.slot === 'acc')) return 'cs:brim';
  return null;
}
/** new shops that stock it without being its home */
export function alsoAt(p) {
  if (!p || p.online) return []; const out = [];
  if (p.brand === 'second_wind') out.push('cs:secondwind');
  if (p.slot === 'shoes' && (HIGH_STREET.has(p.brand) || p.brand === 'hollowell' || p.brand === 'juniper_rye' || p.brand === 'saltline')) out.push('cs:sole');
  if (p.slot === 'acc' && /^(socks|tights|belt)$/.test(p.kind) && p.brand !== 'otterline' && p.brand !== 'tidepool') out.push('cs:sole');   // the cobbler's small leather-and-wool counter
  if ((p.slot === 'hat' || p.slot === 'acc') && (p.brand === 'hollowell' || p.brand === 'juniper_rye' || p.brand === 'marigold' || p.brand === 'nightjar')) out.push('cs:brim');
  if (p.brand === 'otterline') out.push('cs:otterline');
  return out;
}
export function reanchor(list) {
  for (const p of list) {
    if (p._cs) continue; p._cs = 1; const home = homeShop(p), also = alsoAt(p).filter(s => s !== home && !p.shops.includes(s));
    if (home && !p.shops.includes(home)) p.shops = [home].concat(p.shops);
    if (also.length) { const i = p.shops.indexOf('online'); p.shops = i < 0 ? p.shops.concat(also) : p.shops.slice(0, i).concat(also, p.shops.slice(i)); }
  }
  return list;
}
