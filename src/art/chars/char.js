// Character sprite system: the player and every NPC.
//   drawChar(spec, pose)   spec = appearance, pose = { anim, frame, dir, seated?, item?, itemColor?, blanket?, seatH? }
// Characters are hand-placed pixels drawn relative to the feet anchor PW(0,0,0), in a canonical "facing screen-right"
// space (front view = facing right-down, back view = facing right-up) and mirrored for the other two directions.
// Layers (front view): shadow, bag-behind, legs, skirt/coat tail, torso, arms, head, hair, hat, bag, props.
import { PW, dk, lt, mix, rng } from '../../engine/raster.js';
import { gclear, p, r, pts, glit, flush, shadow, get } from './_grid.js';
import { HAIR_X, HAIRS_X, TOPS_X, OUTERS, DRESS, SKIRT, BOTTOMS_X, SHOE_TYPES, HATS_X, GLASSES_X, NECKS, BAGS_X, BEARDS, PATTERNS, BOT_PATTERNS, NO_SLEEVE_X, SHORT_SLEEVE_X, TAILS, patC, botPatC } from './_wear.js';
import { SHAPES, HAIR_REG, BUILTIN, torsoShape } from './_shapes.js';

/** fixed sprite bounds in px around the anchor [x0,y0,x1,y1] */
export const CHAR_SB = [-16, -36, 16, 12];
/** animation name -> frame count */
export const ANIMS = {
  stand: 2, walk: 6, run: 6, sit: 2, sleep: 2, eat: 2, drink: 2, phone: 2, talk: 3, wave: 4, type: 2, work: 4,
  lift: 4, treadmill: 6, carry: 6, dance: 4, read: 2, shower: 2, cheer: 2,
};
/** px the feet hang below the anchor in seated poses (anchor = seat surface under the bum). ~0.45 world units */
export const SEAT_H = 7;

/* ---------- option lists (for the character creator) ---------- */
export const SKINS = ['#ffe2c8', '#f8d0aa', '#ecba90', '#dba276', '#c4875a', '#a66a44', '#84502f', '#643c26', '#4a2c1e'];
export const HAIR_COLORS = ['#2b2433', '#4a3022', '#6e4428', '#8f5a30', '#a8452a', '#d9722e', '#e6c36a', '#f0e4b8', '#a9a9b4', '#e8e8ee', '#f07aa8', '#4f8fd8', '#3fb8a8', '#8a5cd0'];
export const CLOTH_COLORS = ['#d9483b', '#f07a5a', '#f09a3a', '#e8b83a', '#9ac84a', '#4fa860', '#2f9a94', '#5ab0e0', '#3b6fd0', '#2f3f72', '#7a55c8', '#f08ab0', '#b83a6a', '#f4f0e8', '#ead9b8', '#9aa0a8', '#4a4a58', '#33303f', '#7a5238'];
export const PANTS_COLORS = ['#4a6fa8', '#34507f', '#7fa0c8', '#33303f', '#4a4a58', '#c8ad7a', '#6f7a48', '#7a5238', '#8a8f98', '#e8e2d4', '#8a3848'];
export const SHOE_COLORS = ['#f0ece4', '#2f2c3a', '#6a4428', '#d04a3a', '#c8a070', '#3b6fd0'];
export const BAG_COLORS = ['#7a5238', '#d9483b', '#3b6fd0', '#4fa860', '#e8b83a', '#33303f', '#ead9b8', '#7a55c8'];
export const HAIRS = ['short', 'buzz', 'sidepart', 'bob', 'long', 'ponytail', 'bun', 'afro', 'curly', 'mohawk', 'bald', 'braids', 'spiky', 'pigtails', 'balding', 'hijab', 'locs', 'cornrows', 'hightop', 'wavy'];
export const TOPS = ['tee', 'graphic', 'stripe', 'polo', 'long', 'tank', 'hoodie', 'jacket', 'suit', 'sweater', 'cardigan', 'flannel', 'dress', 'coat', 'puffer', 'varsity'];
export const BOTTOMS = ['jeans', 'slacks', 'shorts', 'skirt', 'longskirt', 'leggings', 'sweats', 'cargo', 'overalls'];
export const HATS = [null, 'cap', 'beanie', 'sunhat', 'hardhat', 'beret', 'flatcap', 'headband', 'turban'];
export const BAGS = [null, 'backpack', 'tote', 'briefcase', 'grocery', 'messenger'];
export const BUILDS = ['slim', 'avg', 'broad'];
export const HEIGHTS = ['short', 'avg', 'tall'];
export const AGES = ['kid', 'adult', 'elder'];
export const OUTFITS = ['barista', 'grocer', 'cook', 'office', 'courier', 'trainer', 'librarian', 'nurse', 'dockworker', 'bartender',
  'busdriver', 'taxidriver', 'police', 'pilot', 'chef', 'gymwear', 'pajamas', 'swim', 'winter'];
/* the full wardrobe (src/data/clothes.js sells these; the lists above stay the citizens' / starter set) */
export const ALL_HAIRS = HAIRS.concat(HAIRS_X), ALL_TOPS = TOPS.concat(TOPS_X), ALL_BOTTOMS = BOTTOMS.concat(BOTTOMS_X), ALL_HATS = HATS.concat(HATS_X), ALL_BAGS = BAGS.concat(BAGS_X);
export { OUTERS, DRESS, SKIRT, SHOE_TYPES, GLASSES_X, NECKS, BEARDS, PATTERNS, BOT_PATTERNS };
/** carried items for the 'carry' anim (pose.item) */
export const CARRY_ITEMS = ['box', 'bag', 'tray'];

const WHITE = '#f4f0e8', DARK = '#33303f', GOLD = '#f0c040', EYE = '#2b2238';
const DEF = {
  skin: SKINS[2], hair: 'short', hairColor: HAIR_COLORS[1], top: 'tee', topColor: '#5ab0e0', bottom: 'jeans', bottomColor: '#4a6fa8',
  shoes: '#f0ece4', hat: null, hatColor: null, glasses: false, bag: null, bagColor: '#7a5238', build: 'avg', height: 'avg', age: 'adult',
  outfit: null, beard: false, scarf: null, innerColor: null, accent: null,
};

/* ---------- hair templates ---------- */
// 11 columns = x -5..5 around the head centre; first number = head row of the first string (row 6 = top of the skull,
// row 0 = chin; rows below 0 hang over the shoulders). h hair, H highlight, d dark, t stubble, s skin, l skin shine, c accent.
const SHORT_B = ['...hhHhh...', '..hhhHhhh..', '..hhhhhhh..', '..hhhhhh...', '..dhhhhs...', '...ddd.....'];
const HAIR = {
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

Object.assign(HAIR, HAIR_X);
const hairOf = id => HAIR[id] || HAIR_REG[id];

BUILTIN.top = ALL_TOPS.slice(); BUILTIN.outer = OUTERS.slice(); BUILTIN.dress = Object.keys(DRESS); BUILTIN.bottom = ALL_BOTTOMS.slice(); BUILTIN.shoes = SHOE_TYPES.slice(); BUILTIN.hat = ALL_HATS.filter(Boolean);
BUILTIN.neck = NECKS.slice(); BUILTIN.glasses = ['specs', 'sun'].concat(GLASSES_X); BUILTIN.bag = ALL_BAGS.filter(Boolean); BUILTIN.beard = BEARDS.slice(); BUILTIN.hair = ALL_HAIRS.slice();

/* ---------- spec -> resolved look ---------- */
const SUITS = ['#2f3f72', '#4a4a58', '#33303f', '#5a6478', '#6a4a3a'];
const hsh = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const skirty = s => !!DRESS[s.top] || !!SKIRT[s.bottom];
const OUTFIT_DEF = {
  barista(k) { k.top = 'long'; k.topC = WHITE; k.bottom = 'slacks'; k.botC = '#3a3848'; k.apron = '#6b7f4a'; k.shoeC = '#2f2c3a'; k.bag = null; if (k.hat !== 'cap' && k.hat !== 'headband') k.hat = null; },
  grocer(k) { k.top = 'polo'; k.topC = WHITE; k.vest = '#3f9a58'; k.bottom = 'slacks'; k.botC = '#c8ad7a'; k.badge = '#f4f0e8'; k.shoeC = '#6a4428'; k.bag = null; k.hat = null; },
  cook(k) { k.top = 'long'; k.topC = '#f4f4f0'; k.buttons = true; k.bottom = 'slacks'; k.botC = '#4a4a58'; k.apron = '#dcdce4'; k.hat = 'cookcap'; k.hatC = '#f4f4f0'; k.shoeC = '#2f2c3a'; k.bag = null; },
  chef(k) { k.top = 'long'; k.topC = '#f8f8f4'; k.buttons = true; k.bottom = 'slacks'; k.botC = '#33303f'; k.scarf = '#d9483b'; k.hat = 'toque'; k.hatC = '#f8f8f4'; k.shoeC = '#2f2c3a'; k.bag = null; },
  office(k, s) { const c = SUITS[hsh(s.topColor + s.hairColor) % SUITS.length]; k.tie = lt(s.topColor, .1) === WHITE ? '#d9483b' : s.topColor; k.top = 'suit'; k.topC = c; k.inner = WHITE; k.bottom = skirty(s) ? 'skirt' : 'slacks'; k.botC = dk(c, .08); k.shoeC = '#2f2c3a'; k.hat = null; if (k.bag && k.bag !== 'tote') k.bag = 'briefcase'; },
  courier(k) { k.top = 'jacket'; k.topC = '#f08a20'; k.inner = '#33303f'; k.bottom = 'shorts'; k.botC = '#3a4a6a'; k.hat = 'cap'; k.hatC = '#f08a20'; k.bag = 'messenger'; k.bagC = '#8a6238'; k.shoeC = '#f0ece4'; },
  trainer(k) { k.top = 'tee'; k.topC = '#e8483a'; k.bottom = 'shorts'; k.botC = '#33303f'; k.hat = 'headband'; k.hatC = '#f4f0e8'; k.badge = GOLD; k.shoeC = '#f0ece4'; k.bag = null; },
  librarian(k, s) { k.top = 'cardigan'; k.topC = ['#b8862e', '#8a3848', '#4a7a58', '#5a5f9a'][hsh(s.hairColor + s.skin) % 4]; k.inner = '#f4ecd8'; k.bottom = skirty(s) ? 'longskirt' : 'slacks'; k.botC = '#5a4a48'; k.glasses = true; k.hat = null; k.shoeC = '#6a4428'; k.bag = null; },
  nurse(k) { k.top = 'tee'; k.topC = '#4fb8b0'; k.bottom = 'slacks'; k.botC = '#3fa49c'; k.badge = WHITE; k.shoeC = '#f0ece4'; k.hat = null; k.bag = null; },
  dockworker(k, s) { k.top = 'long'; k.topC = '#7a8088'; k.vest = '#f08a20'; k.hivis = true; k.bottom = 'jeans'; k.botC = '#4a6fa8'; k.hat = 'hardhat'; k.hatC = '#f2c230'; k.shoeC = '#6a4428'; k.bag = null; },
  bartender(k) { k.top = 'long'; k.topC = WHITE; k.vest = '#33303f'; k.bow = '#8a2f3a'; k.bottom = 'slacks'; k.botC = '#33303f'; k.shoeC = '#2f2c3a'; k.hat = null; k.bag = null; },
  busdriver(k) { k.top = 'polo'; k.topC = '#9ac8e8'; k.tie = '#2f3f72'; k.bottom = 'slacks'; k.botC = '#2f3f72'; k.hat = 'peaked'; k.hatC = '#2f3f72'; k.shoeC = '#2f2c3a'; k.bag = null; },
  taxidriver(k) { k.top = 'jacket'; k.topC = '#8a5a38'; k.inner = '#f0c838'; k.bottom = 'jeans'; k.botC = '#34507f'; k.hat = 'flatcap'; k.hatC = '#6a6058'; k.shoeC = '#6a4428'; k.bag = null; },
  police(k) { k.top = 'long'; k.topC = '#2f3f72'; k.bottom = 'slacks'; k.botC = '#26325e'; k.belt = '#22202c'; k.badge = GOLD; k.hat = 'peaked'; k.hatC = '#26325e'; k.shoeC = '#2f2c3a'; k.bag = null; },
  pilot(k) { k.top = 'suit'; k.topC = '#26325e'; k.inner = WHITE; k.tie = '#22202c'; k.epaul = GOLD; k.bottom = 'slacks'; k.botC = '#26325e'; k.hat = 'peaked'; k.hatC = '#f4f0e8'; k.hatBand = '#26325e'; k.shoeC = '#2f2c3a'; if (k.bag) k.bag = 'briefcase'; },
  gymwear(k, s) { k.top = 'tank'; k.bottom = skirty(s) || s.bottom === 'leggings' ? 'leggings' : 'shorts'; k.botC = '#33303f'; k.shoeC = '#f0ece4'; if (k.hat !== 'cap' && k.hat !== 'headband') k.hat = null; if (k.bag !== 'backpack') k.bag = null; },
  pajamas(k, s) { const c = lt(s.topColor, .45); k.top = 'pj'; k.topC = c; k.bottom = 'sweats'; k.botC = c; k.pjStripe = true; k.shoeC = null; k.hat = null; k.bag = null; k.scarf = null; },
  swim(k, s) { if (skirty(s)) { k.top = 'swimsuit'; k.bottom = 'bare'; } else { k.top = 'none'; k.bottom = 'shorts'; k.botC = s.topColor; } k.shoeC = null; k.bag = null; k.scarf = null; if (k.hat !== 'sunhat' && k.hat !== 'cap') k.hat = null; },
  winter(k, s) { if (k.top !== 'puffer') k.top = 'coat'; k.scarf = s.accent || mix(s.topColor, '#f4e070', .7); if (!k.hat || k.hat === 'sunhat') { k.hat = 'beanie'; k.hatC = k.scarf; } if (k.bottom === 'shorts' || k.bottom === 'skirt') k.bottom = 'jeans'; k.shoeC = '#6a4428'; },
};
const SHORT_SLEEVE = Object.assign({ tee: 1, graphic: 1, stripe: 1, polo: 1, dress: 1, flannel: 0 }, SHORT_SLEEVE_X), NO_SLEEVE = Object.assign({ tank: 1, none: 1, swimsuit: 1 }, NO_SLEEVE_X);
function look(spec) {
  const s = Object.assign({}, DEF, spec);
  const k = {
    skin: s.skin, hair: hairOf(s.hair) ? s.hair : 'short', hairC: s.hairColor, top: s.top, topC: s.topColor, inner: s.innerColor || WHITE,
    bottom: s.bottom, botC: s.bottomColor, shoeC: s.shoes, hat: s.hat, hatC: s.hatColor, hatBand: null, bag: s.bag, bagC: s.bagColor,
    glasses: s.glasses, beard: s.beard, scarf: s.scarf, accent: s.accent || '#e8546a',
    apron: null, vest: null, hivis: false, tie: null, bow: null, badge: null, belt: null, epaul: null, buttons: false, pjStripe: false,
    kid: s.age === 'kid', elder: s.age === 'elder',
  };
  const uni = s.outfit && OUTFIT_DEF[s.outfit];
  k.pat = null; k.pat2 = null; k.botPat = null; k.bot2 = null; k.shoeT = s.shoeType || null; k.shoe2 = s.shoeColor2 || null; k.sock = s.socks || null; k.glove = s.gloves || null; k.tights = s.tights || null;
  k.neck = null; k.neckC = null; k.glassC = s.glassesColor || null; k.hair2 = s.hairColor2 || null; k.hairFx = s.hairFx || null; k.shag = !!s.shag; k.watch = s.watch || null; k.armC = null; k.skirtPat = null; k.skirtKind = null;
  if (uni) OUTFIT_DEF[s.outfit](k, s);
  else {
    k.pat = s.topPat || null; k.pat2 = s.topColor2 || null; k.botPat = s.botPat || null; k.bot2 = s.bottomColor2 || null; if (s.belt) k.belt = s.belt;
    if (s.neck && s.neck !== 'scarf') { k.neck = s.neck; k.neckC = s.neckColor || k.scarf || k.accent; if (s.neck === 'tie') k.tie = k.neckC; else if (s.neck === 'bowtie') k.bow = k.neckC; if (s.neck !== 'longscarf') k.scarf = null; else k.scarf = k.neckC; }
    else if (s.neck === 'scarf' && s.neckColor) k.scarf = s.neckColor;
  }
  if (!k.hatC) k.hatC = k.hat === 'sunhat' ? '#ecd690' : k.hat === 'hardhat' ? '#f2c230' : k.hat === 'headband' ? k.accent : mix(k.topC, k.botC, .5);
  k.overalls = k.bottom === 'overalls' && k.top !== 'dress' && !k.apron;
  const dsh = SHAPES.dress[k.top], bsh = k.bsh = SHAPES.bottom[k.bottom] || null; k.skirtSh = null;
  if (dsh) { k.skirtC = k.topC; k.skirtLen = dsh.skirt || 4; k.skirtPat = k.pat; k.skirtKind = k.top; k.skirtSh = dsh; k.bottom = 'bare'; k.bsh = null; k.overalls = false; }
  else if (bsh && bsh.skirt) { k.skirtC = k.botC; k.skirtLen = bsh.skirt; k.skirtPat = k.botPat; k.skirtKind = k.bottom; k.skirtSh = bsh; }
  else if (DRESS[k.top]) { k.skirtC = k.topC; k.skirtLen = DRESS[k.top][0]; k.skirtPat = k.pat; k.skirtKind = k.top; k.bottom = 'bare'; k.overalls = false; }
  else if (SKIRT[k.bottom]) { k.skirtC = k.botC; k.skirtLen = SKIRT[k.bottom]; k.skirtPat = k.botPat; k.skirtKind = k.bottom; }
  k.sleeveTop = k.top;
  if (!uni && s.outer) { // outerwear worn open over the top: the top's colour shows down the front
    if (k.top === 'pinafore' || k.top === 'sweatervest' || k.top === 'gilet') k.inner = k.topC; else k.inner = k.pat === 'stripes' || k.pat === 'check' ? mix(k.topC, k.pat2 || WHITE, .5) : k.topC;
    k.top = s.outer; k.topC = s.outerColor || '#33303f'; k.pat = s.outerPat || null; k.pat2 = s.outerColor2 || null; k.overalls = false;
  }
  if (k.top === 'gilet' || k.top === 'sweatervest' || k.top === 'pinafore') k.armC = k.inner;
  // metrics
  const kid = k.kid, hi = s.height === 'short' ? -1 : s.height === 'tall' ? 1 : 0;
  k.L = (kid ? 4 : 6) + hi; k.T = kid ? 4 : 6; k.arm = kid ? 3 : 4;
  const b = kid ? (s.build === 'broad' ? 'avg' : 'slim') : s.build;
  k.x0 = b === 'broad' ? -3 : -2; k.x1 = b === 'slim' ? 1 : b === 'broad' ? 3 : 2;
  k.ax = [k.x0 - 1, k.x1 + 1];
  if (k.skirtLen) k.skirtLen = Math.min(k.skirtLen, k.L - 1, kid && k.skirtLen < 9 ? 2 : 99);
  k.tsh = torsoShape(k.top); if (k.tsh && k.tsh.arm) { const a = k.tsh.arm; k.armC = a === 'inner' ? k.inner : a === 'accent' ? k.accent : a === 'c2' ? (k.pat2 || k.accent) : a === 'skin' ? k.skin : null; }
  k.sleeve = k.tsh ? (k.tsh.sleeve === undefined ? 9 : k.tsh.sleeve && k.tsh.sleeve < 9 ? (kid ? 1 : k.tsh.sleeve) : k.tsh.sleeve) : NO_SLEEVE[k.top] ? 0 : SHORT_SLEEVE[k.top] ? (kid ? 1 : 2) : 9;
  if (k.top === 'gilet' && s.outer && (NO_SLEEVE[k.sleeveTop] || SHORT_SLEEVE[k.sleeveTop])) { k.sleeve = NO_SLEEVE[k.sleeveTop] ? 0 : 2; }
  return k;
}

/* ---------- poses ---------- */
const HANG = [0, 2, 0, 4];
const UPA = [-1, -1, -1, -5], UPB = [1, -1, 1, -5];
function gait(P, f, fy, run) {
  const ph = f % 3, sw = f >= 3; let fwd, back, aF, aB;
  if (!run) {
    if (ph === 0) { fwd = [2, fy, 0]; back = [-2, -fy, 0]; aF = [1, 2, 2, 3]; aB = [-1, 2, -2, 3]; }
    else if (ph === 1) { fwd = [1, 0, 0]; back = [-2, -fy, 1]; P.bob = 1; aF = [0, 2, 1, 4]; aB = [0, 2, -1, 4]; }
    else { fwd = [0, 0, 0]; back = [1, 0, 2]; aF = HANG; aB = HANG; }
  } else {
    P.lean = 1;
    if (ph === 0) { fwd = [3, fy, 1]; back = [-3, -fy, 2]; P.bob = -1; aF = [1, 2, 3, 1]; aB = [-2, 1, -3, 2]; }
    else if (ph === 1) { fwd = [1, 0, 0]; back = [-2, -fy, 3]; P.bob = 1; aF = [1, 2, 2, 2]; aB = [-1, 2, -2, 3]; }
    else { fwd = [-1, 0, 0]; back = [2, 0, 3]; aF = [0, 2, 1, 3]; aB = [0, 2, 1, 3]; }
  }
  P.legs = sw ? [back, fwd] : [fwd, back];
  P.arms = sw ? [aF, aB] : [aB, aF]; // arms swing opposite to the legs
  // swings away from the body are foreshortened so the arms never spread into a T
  const lim = run ? 2 : 1, A = P.arms[0], B = P.arms[1];
  if (A[2] < 0) P.arms[0] = [Math.max(A[0], 0), A[1], Math.max(A[2], -lim), A[3]];
  if (B[2] > 0) P.arms[1] = [Math.min(B[0], run ? 1 : 0), B[1], Math.min(B[2], lim), B[3]];
}
function poseOf(anim, f, front, pose) {
  const fy = front ? 1 : -1;
  if (pose.mood === 'happy') pose = Object.assign({}, pose);
  const P = { bob: 0, jump: 0, hdx: 0, hdy: 0, lean: 0, legs: [[0, 0, 0], [0, 0, 0]], arms: [HANG, HANG], eyes: 1, mouth: 0, prop: null, seated: !!pose.seated, hold: true };
  switch (anim) {
    case 'stand': P.bob = f; break;
    case 'shower': P.arms = f ? [[-1, -1, 0, -3], [1, -1, 0, -4]] : [[-1, -1, 0, -4], [1, -1, 0, -3]]; P.eyes = 2; P.hold = false; break;
    case 'walk': gait(P, f, fy, false); P.seated = false; break;
    case 'run': case 'treadmill': gait(P, f, fy, true); P.seated = false; break;
    case 'carry': gait(P, f, fy, false); P.seated = false; P.arms = [[2, 2, 4, 3], [0, 2, 1, 3]]; P.prop = 'carry'; P.hold = false; break;
    case 'sit': P.seated = true; P.arms = [[1, 2, 2, 3], [0, 2, 1, 3]]; P.hdy = f; break;
    case 'eat': P.arms = [[1, 2, 3, 3], f ? [1, 1, 0, -1] : [0, 2, 0, 3]]; P.prop = 'eat'; P.mouth = f; P.eyes = f ? 1 : 3; P.hold = false; break;
    case 'drink': P.arms = [HANG, f ? [1, 2, 1, 0] : [1, 2, 2, 2]]; P.prop = 'cup'; P.eyes = f ? 2 : 1; break;
    case 'phone': P.arms = [HANG, f ? [1, 2, 2, 2] : [1, 2, 2, 1]]; P.prop = 'phone'; P.eyes = 3; break;
    case 'talk': P.arms = [HANG, f === 0 ? HANG : f === 1 ? [1, 2, 2, 1] : [1, 1, 2, 0]]; P.mouth = f === 1 ? 1 : f === 2 ? 2 : 0; break;
    case 'wave': P.arms = [HANG, [[1, -1, 2, -4], [1, -1, 3, -4], [1, -1, 2, -4], [1, -1, 1, -5]][f]]; P.mouth = 2; break;
    case 'type': P.seated = pose.seated !== false; P.arms = f ? [[2, 2, 5, 3], [1, 2, 3, 2]] : [[2, 2, 5, 2], [1, 2, 3, 3]]; P.hold = false; break;
    case 'work': P.arms = [[[2, 2, 4, 2], [1, 2, 3, 3]], [[2, 2, 4, 3], [1, 2, 3, 2]], [[2, 2, 3, 2], [1, 2, 3, 3]], [[2, 2, 4, 3], [1, 2, 4, 2]]][f]; P.eyes = 3; P.hold = false; break;
    case 'lift': P.arms = f === 0 ? [HANG, HANG] : f === 2 ? [UPA, UPB] : [[-1, 2, -1, 0], [1, 2, 1, 0]]; P.prop = 'dumb'; P.bob = f === 0 ? 1 : 0; P.eyes = f === 2 ? 2 : 1; P.hold = false; break;
    case 'dance':
      P.arms = [[UPA, [1, 1, 3, 1]], [[-1, 2, -2, 1], [1, 2, 2, 1]], [[-1, 1, -3, 1], UPB], [[-1, 2, -2, 1], [1, 2, 2, 1]]][f];
      P.bob = f & 1; P.hdx = f === 0 ? -1 : f === 2 ? 1 : 0; P.legs = f === 0 ? [[-1, 0, 0], [0, 0, 1]] : f === 2 ? [[0, 0, 1], [1, 0, 0]] : P.legs; P.mouth = f === 0 || f === 2 ? 1 : 2; P.hold = false; break;
    case 'read': P.arms = [[2, 2, 4, 2], [0, 2, 1, f ? 1 : 2]]; P.prop = 'book'; P.eyes = 3; P.hold = false; break;
    case 'cheer': P.arms = f ? [[-2, -2, -2, -6], [2, -2, 2, -6]] : [UPA, UPB]; P.jump = f ? 2 : 0; P.mouth = 1; P.eyes = f ? 2 : 1; P.hold = false; break;
  }
  if (pose.mood === 'happy' && !P.mouth) P.mouth = 2;
  P.seatH = pose.seatH || 0;
  return P;
}

/* ---------- layers ---------- */
function legColor(k, i, n) {
  const b = k.bottom, c = k.botC;
  if (k.bsh) { if (k.bsh.skirt) return k.tights || k.skin; const q = k.bsh.leg ? k.bsh.leg(i, n, c, k) : c; return q === 'skin' ? (k.tights || k.skin) : q; }
  if (b === 'bare' || SKIRT[b]) return k.tights || k.skin;
  if (b === 'shorts') return i < (k.kid ? 1 : 2) ? c : k.skin;
  if (b === 'bermuda' || b === 'bikeshorts') return i < (k.kid ? 2 : 3) ? c : k.skin;
  if (b === 'hotpants') return i < 1 ? c : (k.tights || k.skin);
  if (b === 'capri') return n > 3 && i >= n - 2 ? k.skin : c;
  if (b === 'chinos') return n > 2 && i === n - 1 ? k.skin : n > 2 && i === n - 2 ? lt(c, .28) : c;
  if (b === 'joggers') return n > 2 && i === n - 1 ? (k.bot2 || dk(c, .35)) : c;
  if (b === 'ripped' || b === 'flare') return i === n - 1 && n > 2 ? lt(c, .3) : c;
  if (b === 'leggings') return i === n - 1 && n > 2 ? k.skin : c;
  if (b === 'jeans') return i === n - 1 && n > 2 ? lt(c, .3) : c;
  if (b === 'sweats') return i === n - 1 && n > 2 ? dk(c, .2) : (k.pjStripe && (i & 1) ? lt(c, .35) : c);
  return c;
}
function shoeCols(k, near) {
  const b = k.shoeC || k.skin, c = near ? b : dk(b, .16);
  return k.shoeC ? { up: c, hi: lt(c, .3), sole: dk(c, .22), toe: c } : { up: c, hi: c, sole: dk(c, .08), toe: dk(c, .08) };
}
function shoe(k, x, fy, near, n, S) {
  const t = k.shoeT, c = S.up, sk = near ? k.skin : dk(k.skin, .16), c2 = k.shoe2 ? (near ? k.shoe2 : dk(k.shoe2, .16)) : null, Wt = near ? '#f0ece4' : '#cfcbc4';
  const rows = t === 'boot' || t === 'hightop' ? 1 : t === 'tallboot' || t === 'rainboot' ? 2 : 0;
  for (let j = 1; j <= rows && j < n; j++) { p(x, fy - 1 - j, c); p(x + 1, fy - 1 - j, j === rows && t !== 'hightop' ? (c2 || S.hi) : c); }
  if (t === 'rainboot') p(x + 1, fy - 2, lt(c, .45));
  const ssh = SHAPES.shoes[t];
  if (ssh) { for (let j = 1; j <= (ssh.rows || 0) && j < n; j++) { p(x, fy - 1 - j, c); p(x + 1, fy - 1 - j, c); } if (ssh.draw) { ssh.draw({ p, x, fy, n, near, c, hi: S.hi, sole: S.sole, toe: S.toe, c2, sk, white: Wt, k, dk, lt, mix }); return; } }
  switch (t) {
    case 'heel': p(x, fy - 1, c); p(x + 1, fy - 1, sk); p(x, fy, dk(c, .3)); p(x + 2, fy, c); break;
    case 'flat': p(x, fy - 1, sk); p(x + 1, fy - 1, sk); p(x, fy, c); p(x + 1, fy, c); p(x + 2, fy, c2 || S.hi); break;
    case 'loafer': p(x, fy - 1, c); p(x + 1, fy - 1, sk); p(x, fy, S.sole); p(x + 1, fy, c); p(x + 2, fy, c2 || S.hi); break;
    case 'sandal': p(x, fy - 1, sk); p(x + 1, fy - 1, c); p(x, fy, S.sole); p(x + 1, fy, S.sole); p(x + 2, fy, sk); break;
    case 'slipper': p(x, fy - 1, lt(c, .2)); p(x + 1, fy - 1, lt(c, .38)); p(x, fy, c); p(x + 1, fy, c); p(x + 2, fy, lt(c, .2)); break;
    case 'oxford': p(x, fy - 1, c); p(x + 1, fy - 1, S.hi); p(x, fy, '#22202c'); p(x + 1, fy, '#22202c'); p(x + 2, fy, c2 || c); break;
    case 'platform': p(x, fy - 2, c); p(x + 1, fy - 2, S.hi); p(x, fy - 1, c2 || Wt); p(x + 1, fy - 1, c2 || Wt); p(x, fy, c2 || Wt); p(x + 1, fy, c2 || Wt); p(x + 2, fy, c2 || Wt); p(x + 2, fy - 1, c); break;
    case 'sneaker': case 'hightop': p(x, fy - 1, c); p(x + 1, fy - 1, c2 || S.hi); p(x, fy, Wt); p(x + 1, fy, Wt); p(x + 2, fy, c2 || c); break;
    default: p(x, fy - 1, S.up); p(x + 1, fy - 1, S.hi); p(x, fy, S.sole); p(x + 1, fy, S.sole); p(x + 2, fy, S.toe);
  }
}
function standLegs(k, P, front, hipY) {
  for (const near of [false, true]) {
    const idx = (near === front) ? 0 : 1, lg = P.legs[idx], rx = idx ? 1 : -2;
    const fy = (near ? -1 : -2) - P.jump + lg[1] - lg[2], n = Math.max(1, fy - 1 - hipY), S = shoeCols(k, near);
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 1; let x = rx + Math.round(lg[0] * t);
      if (lg[2] >= 2) x += Math.round(Math.sin(Math.PI * t) * 1.2);
      let c = legColor(k, i, n), c2 = c;
      if (k.bottom === 'cargo' && i === (n >> 1)) c2 = lt(c, .22);
      if (near && c !== k.skin && lg[0] === 0 && i === 1 && n > 3) c2 = lt(c2, .12);
      const cloth = c !== k.skin && c !== k.tights;
      if (cloth && (k.botPat || k.bottom === 'track')) { const q = botPatC(k.botPat || 'sidestripe', i, idx, c, c2, k.bot2); c = q[0]; c2 = q[1]; }
      if (k.bottom === 'ripped' && near && i === (n >> 1)) c2 = k.skin;
      if (cloth && k.bsh && k.bsh.px) { const q = k.bsh.px(i, n, near, c, c2, k); if (q) { c = q[0]; c2 = q[1]; } }
      if (!near) { c = dk(c, .16); c2 = dk(c2, .16); }
      p(x, hipY + i, c); p(x + 1, hipY + i, c2);
      if (cloth && ((k.bottom === 'wide' && i >= 1) || (k.bottom === 'flare' && i >= n - 2) || (k.bsh && k.bsh.wide && k.bsh.wide(i, n)))) p(idx ? x + 2 : x - 1, hipY + i, near ? c : c2);
    }
    const x = rx + lg[0];
    if (k.sock && n > 2 && legColor(k, n - 1, n) === k.skin) { const sc = near ? k.sock : dk(k.sock, .16); p(x, fy - 2, sc); p(x + 1, fy - 2, sc); }
    shoe(k, x, fy, near, n, S);
  }
}
function seatedLegs(k, P, front) {
  const sh = P.seatH || (k.kid ? SEAT_H - 2 : SEAT_H), tl = k.kid ? 3 : 4, shoe = k.shoeC || dk(k.skin, .08);
  const thighC = k.skirtLen ? k.skirtC : legColor(k, 0, 6), shinC = k.skirtLen > 6 ? k.skirtC : legColor(k, 3, 6), cuffC = k.skirtLen > 6 ? k.skin : legColor(k, 5, 6);
  for (const near of [false, true]) {
    const sd = c => near ? c : dk(c, .16), s = front ? 1 : -1;
    const hx = (near === front) ? -2 : 1, ty = front ? (near ? -2 : -3) : (near ? -2 : -3);
    let kx = hx, ky = ty;
    for (let i = 0; i <= tl; i++) { kx = hx + i; ky = ty + s * (i >> 1); p(kx, ky, sd(lt(thighC, front ? .1 : 0))); p(kx, ky + 1, sd(thighC)); }
    const foot = ky + sh + (front ? 0 : 1);
    for (let y = ky + (front ? 2 : 1); y < foot - 1; y++) { const c = sd(y === foot - 2 ? cuffC : shinC); p(kx - 1, y, c); p(kx, y, c); }
    { const S = shoeCols(k, near); shoe(k, kx - 1, foot, near, 4, S); }
  }
}
function skirt(k, hipY) {
  const n = Math.min(k.skirtLen, k.L - 1), c = k.skirtC;
  for (let j = 0; j < n; j++) {
    const w = j > 0 ? 1 : 0;
    const ssh = k.skirtSh, kd = k.skirtKind, ww = ssh ? (ssh.flare === undefined ? w : typeof ssh.flare === 'function' ? ssh.flare(j, n) : j > 0 ? ssh.flare : 0) : kd === 'pencil' || kd === 'sweaterdress' ? 0 : (kd === 'tiered' || kd === 'gown' || kd === 'teadress') && j > 2 ? w + 1 : w;
    for (let x = k.x0 - ww; x <= Math.max(2, k.x1) + ww; x++) {
      let cc = k.skirtPat ? patC(k.skirtPat, x, j + k.T, c, kd && DRESS[kd] ? k.pat2 : k.bot2, k.accent, k.T + n) : c;
      if (ssh && ssh.skirtPx) cc = ssh.skirtPx(cc, x, j, n, k) || cc;
      if (kd === 'pleated' && ((x + 8) & 1)) cc = dk(cc, .2); else if (kd === 'tiered' && (j === 1 || j === 3)) cc = lt(cc, .22);
      p(x, hipY + j, x === k.x0 - ww ? dk(cc, .16) : j === n - 1 ? dk(cc, .1) : (n > 4 && j > 0 && x === 0 && !k.skirtPat) ? dk(cc, .1) : cc);
    }
  }
}
function torso(k, P, front, yS, hipY) {
  const T = k.T, x0 = k.x0, x1 = k.x1, body = k.vest || k.topC, top = k.top, sk = k.skin;
  const bare = top === 'none', xo = j => (P.lean && j < T / 2 ? P.lean : 0);
  const t = (x, j, c) => p(x + xo(j), yS + j, c);
  const sh = k.tsh, tl = sh ? sh.tail : TAILS[top];
  const g = sh ? { t, p, x0, x1, T, cx: 1, wide: x1 > 1, sk, body, inner: k.inner, accent: k.accent, c2: k.pat2, k, front, seated: P.seated, yS, hipY, dk, lt, mix, WHITE, GOLD, row: (j, c) => { for (let x = x0; x <= x1; x++) t(x, j, c); } } : null;
  if (tl && !P.seated) for (let j = 0; j < tl && j < k.L - 2; j++) for (let x = x0; x <= x1; x++) p(x, hipY + j, x === x0 ? dk(body, .2) : front && x === 1 && top !== 'tunic' && top !== 'poncho' && top !== 'duster' ? dk(body, .25) : front && x === 1 && top === 'duster' ? dk(k.inner, .12) : dk(body, .06));
  for (let j = 0; j < T; j++) for (let x = x0; x <= x1; x++) {
    let c = bare ? sk : body;
    if (!bare && !k.vest) {
      if ((top === 'stripe' || top === 'pj') && (j & 1)) c = top === 'pj' ? lt(c, .4) : mix(c, WHITE, .75);
      else if (top === 'flannel' && ((x + j) & 1)) c = dk(c, .3);
      else if ((top === 'puffer' || top === 'gilet') && (j & 1)) c = dk(c, .12);
      if (k.pat) c = patC(k.pat, x, j, c, k.pat2, k.accent, T);
      if (sh && sh.body) c = sh.body(c, x, j, g) || c;
      if (top === 'crop' && j >= T - 2) c = sk; else if (top === 'offshoulder' && j === 0) c = sk;
      else if (top === 'windbreaker' && j >= (T >> 1)) c = k.pat2 || k.accent; else if (top === 'rugby' && j % 3 === 1) c = k.pat2 || WHITE;
    }
    if (x === x0) c = dk(c, .14); else if (j === T - 1 && !DRESS[top] && !tl && !(sh && sh.skirt)) c = dk(c, .08); else if (j === 0 && x > x0 && !bare) c = lt(c, .1);
    if (top === 'varsity' && j === T - 1 && !k.vest) c = (x & 1) ? WHITE : dk(body, .1);
    t(x, j, c);
  }
  if (top === 'swimsuit') { for (let x = x0; x <= x1; x++) p(x, hipY, x === x0 ? dk(body, .14) : body); }
  if (front) {
    const cx = 1;
    if (k.vest) { for (let j = 0; j < T; j++) t(cx, j, k.topC); t(cx, 0, sk); if (top === 'polo') { t(0, 0, k.topC); t(2, 0, k.topC); } }
    else if (top === 'graphic') { t(cx, 0, sk); t(0, 2, k.accent); t(1, 2, k.accent); t(0, 3, k.accent); t(1, 3, lt(k.accent, .4)); }
    else if (top === 'varsity') { t(cx, 0, WHITE); t(0, 0, WHITE); for (let j = 1; j < T - 1; j++) t(cx, j, dk(body, .25)); t(x0 + 1, 1, WHITE); }
    else if (top === 'tee' || top === 'stripe' || top === 'long' || top === 'pj' || top === 'flannel') t(cx, 0, sk);
    else if (top === 'polo') { t(0, 0, lt(body, .4)); t(2, 0, lt(body, .4)); t(1, 0, sk); t(1, 1, lt(body, .4)); }
    else if (top === 'tank' || top === 'swimsuit') { t(x0, 0, sk); t(x1, 0, sk); t(0, 0, sk); if (x1 > 1) t(1, 0, sk); }
    else if (top === 'hoodie') { t(0, 1, WHITE); t(2, 1, WHITE); t(1, 0, dk(body, .25)); for (let x = 0; x <= Math.min(2, x1); x++) t(x, T - 2, dk(body, .2)); }
    else if (top === 'jacket' || top === 'cardigan') { for (let j = 0; j < T; j++) t(cx, j, j === T - 1 ? dk(k.inner, .1) : k.inner); t(0, 0, lt(body, .25)); if (x1 > 1) t(2, 0, lt(body, .25)); if (top === 'cardigan') t(cx, 0, sk); }
    else if (top === 'suit') { t(0, 0, k.inner); if (x1 > 1) t(2, 0, k.inner); t(1, 0, k.inner); t(1, 1, k.inner); t(1, 2, k.inner); t(1, T - 2, dk(body, .3)); }
    else if (top === 'sweater') { for (let x = 0; x <= Math.min(2, x1); x++) t(x, 0, lt(body, .3)); for (let x = x0; x <= x1; x++) t(x, T - 1, dk(body, .22)); }
    else if (top === 'coat') { t(0, 0, lt(body, .22)); if (x1 > 1) t(2, 0, lt(body, .22)); for (let j = 1; j < T; j++) t(cx, j, dk(body, .25)); }
    else if (top === 'puffer') { for (let x = x0; x <= x1; x++) t(x, 0, lt(body, .2)); for (let j = 1; j < T; j++) t(cx, j, dk(body, .3)); }
    else if (top === 'dress' || top === 'maxi' || top === 'teadress') { t(0, 0, sk); t(1, 0, sk); for (let x = x0; x <= x1; x++) t(x, T - 2, dk(body, .2)); }
    else if (sh) { if (sh.front) sh.front(g); }
    else frontX(k, top, t, T, x0, x1, sk, body, cx);
    if (k.overalls) { const o = k.botC; t(0, 0, dk(o, .1)); if (x1 > 1) t(2, 0, dk(o, .1)); t(0, 1, dk(o, .1)); if (x1 > 1) t(2, 1, dk(o, .1)); for (let j = 2; j < T; j++) for (let x = (j >= T - 2 ? x0 : 0); x <= x1; x++) t(x, j, x === x0 ? dk(o, .14) : o); t(0, 2, GOLD); if (x1 > 1) t(2, 2, GOLD); t(1, 3, lt(o, .25)); }
    if (k.buttons) { t(0, 1, '#9aa0a8'); t(0, 3, '#9aa0a8'); if (x1 > 1) { t(2, 1, '#9aa0a8'); t(2, 3, '#9aa0a8'); } }
    if (k.hivis) { for (let x = x0; x <= x1; x++) if (x !== cx) t(x, 3, '#f8f0a0'); t(0, 1, '#f8f0a0'); if (x1 > 1) t(2, 1, '#f8f0a0'); }
    if (k.tie) { t(cx, 0, k.tie); t(cx, 1, k.tie); t(cx, 2, dk(k.tie, .15)); if (k.kid === false && top !== 'suit') t(cx, 3, dk(k.tie, .15)); }
    if (k.bow) { t(0, 0, k.bow); t(1, 0, lt(k.bow, .2)); if (x1 > 1) t(2, 0, k.bow); }
    if (k.badge) t(x0 + 1, 1, k.badge);
    if (k.apron) {
      const a = k.apron, ax1 = Math.min(2, x1);
      t(0, 0, dk(a, .25)); if (x1 > 1) t(2, 0, dk(a, .25));
      for (let j = 1; j < T; j++) for (let x = (j >= T - 2 ? x0 + 1 : 0); x <= ax1; x++) t(x, j, j === T - 2 ? dk(a, .18) : a);
      if (!P.seated) for (let j = 0; j < Math.min(3, k.L - 2); j++) for (let x = x0 + 1; x <= ax1; x++) p(x, hipY + j, j === 2 ? dk(a, .12) : a);
    }
    if (k.belt) { for (let x = x0; x <= x1; x++) t(x, T - 1, k.belt); t(cx, T - 1, GOLD); }
  } else {
    if (top === 'tank' || top === 'swimsuit') { t(x0, 0, sk); t(x1, 0, sk); t(0, 0, sk); t(0, 1, sk); }
    else if (top === 'hoodie') { for (let x = -1; x <= 1; x++) { t(x, 0, dk(body, .16)); t(x, 1, dk(body, .16)); } t(0, 2, dk(body, .16)); }
    else if (top === 'suit' || top === 'jacket' || top === 'coat') { for (let x = -1; x <= 1; x++) t(x, 0, lt(body, .2)); if (top !== 'jacket') t(0, T - 1, dk(body, .3)); }
    else if (top === 'sweater') { for (let x = x0; x <= x1; x++) t(x, T - 1, dk(body, .22)); for (let x = -1; x <= 1; x++) t(x, 0, lt(body, .3)); }
    else if (top === 'dress') { for (let x = x0; x <= x1; x++) t(x, T - 2, dk(body, .2)); t(0, 0, sk); }
    else if (sh) { if (sh.back) sh.back(g); }
    else backX(k, top, t, T, x0, x1, sk, body);
    if (k.overalls) { const o = k.botC; for (let j = 0; j < T; j++) { if (j < 2) { t(-1, j, dk(o, .1)); t(1, j, dk(o, .1)); } else if (j === 2) { t(-1, j, o); t(0, j, o); t(1, j, o); } else for (let x = x0; x <= x1; x++) t(x, j, x === x0 ? dk(o, .14) : o); } }
    if (top === 'varsity') { for (let x = -1; x <= 1; x++) t(x, 0, WHITE); t(0, 2, WHITE); t(0, 3, WHITE); t(-1, 2, WHITE); t(1, 2, WHITE); }
    if (k.hivis) { for (let x = x0; x <= x1; x++) t(x, 3, '#f8f0a0'); t(-1, 1, '#f8f0a0'); t(-1, 2, '#f8f0a0'); t(1, 1, '#f8f0a0'); t(1, 2, '#f8f0a0'); }
    if (k.apron) { t(0, 0, dk(k.apron, .25)); for (let x = x0; x <= x1; x++) t(x, T - 2, dk(k.apron, .1)); t(0, T - 1, k.apron); t(-1, T - 1, k.apron); }
    if (k.belt) for (let x = x0; x <= x1; x++) t(x, T - 1, k.belt);
  }
}
const STRAPS = { cami: 1, slip: 1, sundress: 1, minidress: 1, gown: 1 }, COLLAR = { blazer: 1, trench: 1, leather: 1, denim: 1, bomber: 1, duster: 1, robe: 1, windbreaker: 1, parka: 1, raincoat: 1, gilet: 1, shirt: 1, shortshirt: 1, shirtdress: 1, rugby: 1 };
function frontX(k, top, t, T, x0, x1, sk, body, cx) {
  const row = (j, c) => { for (let x = x0; x <= x1; x++) t(x, j, c); }, wide = x1 > 1;
  if (top === 'shirt' || top === 'shortshirt' || top === 'shirtdress') { t(0, 0, lt(body, .35)); if (wide) t(2, 0, lt(body, .35)); t(1, 0, sk); for (let j = 1; j < T; j++) t(cx, j, j & 1 ? dk(body, .25) : lt(body, .3)); if (top === 'shirtdress') { row(T - 2, dk(body, .28)); t(cx, T - 2, GOLD); } }
  else if (top === 'blouse') { t(1, 0, sk); t(0, 0, sk); t(1, 1, sk); row(T - 1, lt(body, .3)); t(x0 + 1, 1, lt(body, .25)); }
  else if (top === 'vneck' || top === 'crop') { t(0, 0, sk); t(1, 0, sk); if (wide) t(2, 0, sk); t(1, 1, sk); }
  else if (top === 'turtleneck' || top === 'sweaterdress') { row(0, lt(body, .22)); if (top === 'sweaterdress') row(T - 1, dk(body, .12)); else row(T - 1, dk(body, .18)); }
  else if (top === 'henley') { t(1, 0, sk); t(1, 1, dk(body, .35)); t(1, 2, dk(body, .35)); }
  else if (top === 'tunic') { t(1, 0, sk); t(1, 1, sk); t(0, 0, k.accent); if (wide) t(2, 0, k.accent); row(T - 1, dk(body, .12)); }
  else if (STRAPS[top]) { for (let x = x0; x <= x1; x++) if (x !== x0 + 1 && x !== x1 - 1) t(x, 0, sk); if (top !== 'cami') row(T - 2, dk(body, .22)); if (top === 'gown' || top === 'slip') t(1, 1, sk); }
  else if (top === 'offshoulder') { row(1, lt(body, .3)); }
  else if (top === 'jersey') { t(1, 0, sk); t(0, 0, k.accent); if (wide) t(2, 0, k.accent); t(0, 2, WHITE); t(1, 2, WHITE); t(0, 3, WHITE); t(1, 3, WHITE); t(0, 3, k.accent); for (let j = 1; j < T; j++) t(x1, j, k.accent); }
  else if (top === 'ziphoodie') { t(0, 1, WHITE); for (let j = 0; j < T; j++) t(cx, j, j === 0 ? k.inner : '#c8ccd4'); for (let x = 0; x <= Math.min(2, x1); x++) if (x !== cx) t(x, T - 2, dk(body, .2)); }
  else if (top === 'sweatervest') { t(0, 0, k.inner); if (wide) t(2, 0, k.inner); t(1, 0, k.inner); t(1, 1, k.inner); row(T - 1, dk(body, .22)); }
  else if (top === 'rugby') { t(0, 0, WHITE); if (wide) t(2, 0, WHITE); t(1, 0, sk); t(1, 1, WHITE); }
  else if (top === 'blazer') { t(0, 0, k.inner); if (wide) t(2, 0, k.inner); t(1, 0, k.inner); t(1, 1, k.inner); t(1, 2, k.inner); t(0, 1, lt(body, .22)); t(1, T - 2, GOLD); }
  else if (top === 'denim') { for (let j = 0; j < T; j++) t(cx, j, j === T - 1 ? dk(k.inner, .1) : k.inner); t(0, 0, lt(body, .3)); if (wide) { t(2, 0, lt(body, .3)); t(2, 2, dk(body, .28)); } t(x0 + 1, 2, dk(body, .28)); for (let x = x0 + 1; x <= x1; x++) if (x !== cx) t(x, T - 1, lt(body, .2)); }
  else if (top === 'bomber') { const rib = k.pat2 || dk(body, .38); for (let j = 0; j < T; j++) t(cx, j, '#c8ccd4'); row(T - 1, rib); t(0, 0, rib); if (wide) t(2, 0, rib); t(1, 0, k.inner); }
  else if (top === 'leather') { for (let j = 0; j < T; j++) t(cx, j, j === T - 1 ? dk(k.inner, .1) : k.inner); t(0, 0, lt(body, .35)); t(0, 1, lt(body, .2)); if (wide) { t(2, 0, lt(body, .35)); t(2, 2, '#c8ccd4'); } t(x0 + 1, T - 2, '#c8ccd4'); }
  else if (top === 'trench') { t(0, 0, lt(body, .22)); if (wide) t(2, 0, lt(body, .22)); t(1, 0, k.inner); for (let j = 1; j < T; j++) t(cx, j, dk(body, .2)); row(T - 2, dk(body, .34)); t(cx, T - 2, GOLD); t(0, 1, dk(body, .3)); if (wide) t(2, 1, dk(body, .3)); }
  else if (top === 'parka') { row(0, '#f0e6d0'); for (let j = 1; j < T; j++) t(cx, j, dk(body, .3)); t(x0 + 1, T - 2, dk(body, .25)); if (wide) t(2, T - 2, dk(body, .25)); }
  else if (top === 'raincoat') { for (let j = 0; j < T; j++) t(cx, j, dk(body, .22)); t(0, 1, lt(body, .4)); t(0, 2, lt(body, .4)); t(cx, 1, WHITE); t(cx, 3, WHITE); }
  else if (top === 'windbreaker') { for (let j = 0; j < T; j++) t(cx, j, '#e8e8ee'); t(0, 0, lt(body, .25)); if (wide) t(2, 0, lt(body, .25)); }
  else if (top === 'gilet') { for (let j = 0; j < T; j++) t(cx, j, j === 0 ? k.inner : dk(body, .32)); t(0, 0, lt(body, .22)); if (wide) t(2, 0, lt(body, .22)); }
  else if (top === 'duster') { for (let j = 0; j < T; j++) t(cx, j, j === T - 1 ? dk(k.inner, .1) : k.inner); t(0, 0, lt(body, .25)); if (wide) t(2, 0, lt(body, .25)); t(cx, 0, sk); }
  else if (top === 'robe') { t(1, 0, sk); t(1, 1, sk); t(0, 0, lt(body, .25)); if (wide) t(2, 0, lt(body, .25)); for (let j = 2; j < T - 1; j++) t(cx, j, dk(body, .14)); row(T - 1, dk(body, .25)); t(cx, T - 1, k.accent); }
  else if (top === 'poncho') { t(1, 0, sk); row(T - 1, k.pat2 || k.accent); t(k.x0 - 1, 1, body); t(k.x0 - 1, 2, body); t(k.x1 + 1, 1, dk(body, .1)); t(k.x1 + 1, 2, dk(body, .1)); }
  else if (top === 'wrapdress') { t(1, 0, sk); t(1, 1, sk); t(0, 0, sk); t(0, 1, dk(body, .2)); if (wide) t(2, 2, dk(body, .2)); row(T - 2, dk(body, .3)); t(x0 + 1, T - 2, lt(body, .3)); }
  else if (top === 'pinafore') { row(0, k.inner); t(1, 0, sk); t(0, 0, body); if (wide) t(2, 0, body); t(x0, 1, dk(k.inner, .14)); row(T - 2, dk(body, .22)); t(0, 2, GOLD); if (wide) t(2, 2, GOLD); }
}
function backX(k, top, t, T, x0, x1, sk, body) {
  const row = (j, c) => { for (let x = x0; x <= x1; x++) t(x, j, c); };
  if (STRAPS[top]) { for (let x = x0; x <= x1; x++) if (x !== x0 + 1 && x !== x1 - 1) t(x, 0, sk); t(0, 1, sk); if (top !== 'cami') row(T - 2, dk(body, .22)); }
  else if (DRESS[top]) { row(T - 2, dk(body, .22)); if (top === 'pinafore') { row(0, k.inner); t(-1, 0, body); t(1, 0, body); } else if (top !== 'sweaterdress' && top !== 'wrapdress') t(0, 0, sk); }
  else if (top === 'ziphoodie') { for (let x = -1; x <= 1; x++) { t(x, 0, dk(body, .16)); t(x, 1, dk(body, .16)); } t(0, 2, dk(body, .16)); }
  else if (top === 'turtleneck') { row(0, lt(body, .22)); row(T - 1, dk(body, .18)); }
  else if (top === 'jersey') { for (let x = -1; x <= 1; x++) t(x, 1, k.accent); t(-1, 3, WHITE); t(0, 3, WHITE); t(0, 2, WHITE); t(x0, 2, k.accent); t(x1, 2, k.accent); }
  else if (top === 'sweatervest') { row(T - 1, dk(body, .22)); for (let x = -1; x <= 1; x++) t(x, 0, k.inner); }
  else if (COLLAR[top]) {
    const cl = top === 'parka' ? '#f0e6d0' : top === 'bomber' ? (k.pat2 || dk(body, .38)) : lt(body, .22); for (let x = -1; x <= 1; x++) t(x, 0, cl);
    if (top === 'trench' || top === 'robe') row(T - 2, dk(body, .32)); else if (top === 'bomber') row(T - 1, k.pat2 || dk(body, .38)); else if (top === 'denim') { row(T - 1, lt(body, .2)); t(-1, 2, dk(body, .2)); t(1, 2, dk(body, .2)); } else if (top === 'raincoat') { t(0, 1, dk(body, .16)); t(-1, 1, dk(body, .16)); t(1, 1, dk(body, .16)); }
  }
  else if (top === 'poncho') { row(T - 1, k.pat2 || k.accent); t(k.x0 - 1, 1, body); t(k.x0 - 1, 2, body); t(k.x1 + 1, 1, dk(body, .1)); t(k.x1 + 1, 2, dk(body, .1)); }
  else if (top === 'tunic') row(T - 1, dk(body, .12));
}
/** draw one arm; returns the hand position */
function arm(k, P, i, a, yS) {
  const sx = k.ax[i] + (P.lean || 0), sc = k.kid ? .75 : 1;
  const ex = sx + Math.round(a[0] * sc), ey = yS + Math.round(a[1] * sc), hx = sx + Math.round(a[2] * sc), hy = yS + Math.round(a[3] * sc);
  const path = pts(sx, yS, ex, ey).concat(pts(ex, ey, hx, hy).slice(1));
  const base = k.armC || ((k.top === 'none' || k.top === 'tank' || k.top === 'swimsuit') ? k.skin : k.top === 'varsity' ? '#ece6d8' : k.topC), sl = i ? dk(base, .15) : lt(base, .12), skn = i ? dk(k.skin, .1) : k.skin, hand = k.glove ? (i ? dk(k.glove, .12) : k.glove) : skn;
  const n = path.length;
  for (let j = 0; j < n; j++) {
    let c = j === n - 1 ? hand : j < k.sleeve ? sl : skn;
    if (j < k.sleeve && j < n - 1) {
      if ((k.top === 'stripe' || k.top === 'pj') && (j & 1)) c = mix(sl, WHITE, k.top === 'pj' ? .4 : .7);
      if (k.top === 'flannel' && (j & 1)) c = dk(sl, .3);
      if ((k.top === 'sweater' || k.top === 'hoodie' || k.top === 'puffer') && j === n - 2) c = dk(sl, .22);
      if (k.top === 'varsity' && j === n - 2) c = k.topC;
      if (k.top === 'suit' && j === n - 2) c = k.inner;
      if (k.epaul && j === n - 2) c = k.epaul;
      if (k.pat && !k.armC) { if ((k.pat === 'stripes' || k.pat === 'plaid' || k.pat === 'check' || k.pat === 'tiedye' || k.top === 'rugby') && (j & 1)) c = mix(sl, k.pat2 || WHITE, .7); else if (k.pat === 'floral' || k.pat === 'leopard' || k.pat === 'camo' || k.pat === 'sparkle' || k.pat === 'dots') { if ((j + i) % 3 === 1) c = k.pat === 'leopard' || k.pat === 'camo' ? dk(sl, .35) : (k.pat2 || lt(sl, .45)); } }
      if ((k.top === 'bomber' || k.top === 'parka' || k.top === 'ziphoodie') && j === n - 2) c = k.top === 'parka' ? '#f0e6d0' : k.top === 'bomber' ? (k.pat2 || dk(sl, .38)) : dk(sl, .22);
    }
    if (k.watch && i === 0 && j === n - 2 && n > 2) c = k.watch;
    if (j === 0 && k.epaul) c = k.epaul;
    p(path[j][0], path[j][1], c);
  }
  return [hx, hy];
}
const NOCUT = { headband: 1, beret: 1, visor: 1, earmuffs: 1, bow: 1, flowercrown: 1, crown: 1, party: 1, bunny: 1 };
function hairTpl(k, cx, yb, front, hat) {
  const tp = hairOf(k.hair)[front ? 'f' : 'b'], top = tp[0], rows = tp[1], h = k.hairC;
  const h2 = k.hair2, fx = h2 ? (k.hairFx || 'ombre') : null;
  const map = { h, H: fx === 'streak' ? h2 : lt(h, .22), d: dk(h, .25), t: mix(k.skin, h, .4), s: k.skin, l: lt(k.skin, .35), c: k.accent };
  const map2 = h2 ? { h: h2, H: lt(h2, .22), d: dk(h2, .25), t: mix(k.skin, h2, .4), s: k.skin, l: map.l, c: k.accent } : map;
  const cut = hat && !NOCUT[hat] && !(SHAPES.hat[hat] && SHAPES.hat[hat].cut === false) && k.hair !== 'hijab', tb = hat === 'turban';
  for (let i = 0; i < rows.length; i++) {
    const rr = top - i; if (cut && rr >= (tb ? (front ? 3 : 1) : 6)) continue; const s = rows[i];
    const m = fx === 'ombre' ? (rr <= 2 ? map2 : map) : fx === 'tips' ? (i >= rows.length - 2 || rr >= top ? map2 : map) : map;
    for (let j = 0; j < 11; j++) { const c = (fx === 'split' && j >= 5 ? map2 : fx === 'streak' && (j === 3 || j === 7) && s[j] === 'h' && (i & 1) ? map2 : m)[s[j]]; if (!c) continue; if (cut && rr === 5 && (j < 2 || j > 8)) continue; p(cx + j - 5, yb - rr, c); }
  }
  if (k.shag && k.hair !== 'bald' && k.hair !== 'hijab' && k.hair !== 'buzz') { // a few weeks past the last cut
    if (front) { p(cx - 3, yb - 2, h); p(cx - 3, yb - 1, dk(h, .2)); if (!cut) p(cx + 1, yb - 4, h); } else { p(cx - 3, yb - 1, h); p(cx + 2, yb - 1, h); for (let x = -2; x <= 1; x++) p(cx + x, yb, dk(h, .22)); }
  }
}
function hatDraw(k, cx, yb, front) {
  const h = k.hat, c = k.hatC, R = (x0, x1, rr, col) => { for (let x = x0; x <= x1; x++) p(cx + x, yb - rr, col); };
  const bf = front ? 5 : 4; // how far the brim reaches forward
  const hsh = SHAPES.hat[h]; if (hsh) { if (hsh.draw) hsh.draw({ R, p, cx, yb, c, band: k.hatBand, accent: k.accent, front, bf, k, dk, lt, mix, WHITE, GOLD }); return; }
  if (h === 'cap') { R(-2, 2, 7, c); R(-3, 3, 6, c); R(-3, 3, 5, dk(c, .15)); R(4, bf, 5, dk(c, .3)); p(cx - 1, yb - 7, lt(c, .3)); if (front) p(cx + 2, yb - 6, lt(c, .45)); }
  else if (h === 'beanie') { R(-2, 2, 7, c); R(-3, 3, 6, c); R(-3, 3, 5, lt(c, .3)); p(cx - 1, yb - 8, WHITE); p(cx, yb - 8, WHITE); p(cx - 2, yb - 6, dk(c, .15)); p(cx, yb - 6, dk(c, .15)); p(cx + 2, yb - 6, dk(c, .15)); }
  else if (h === 'sunhat') { R(-2, 2, 7, c); R(-3, 3, 6, k.hatBand || k.accent); R(-5, 5, 5, c); R(-5, -3, 5, dk(c, .15)); p(cx - 1, yb - 7, lt(c, .4)); }
  else if (h === 'hardhat') { R(-2, 2, 7, c); R(-3, 3, 6, c); R(-3, bf - 1, 5, dk(c, .18)); p(cx - 1, yb - 7, lt(c, .5)); p(cx, yb - 7, lt(c, .5)); p(cx, yb - 8, c); p(cx - 1, yb - 8, c); p(cx + 1, yb - 8, c); }
  else if (h === 'beret') { R(-3, 1, 7, c); R(-4, 3, 6, c); p(cx - 1, yb - 8, dk(c, .3)); p(cx - 2, yb - 7, lt(c, .25)); R(-4, -3, 6, dk(c, .15)); }
  else if (h === 'flatcap') { R(-3, 1, 7, c); R(-3, 4, 6, c); R(3, bf, 5, dk(c, .3)); R(-3, -2, 6, dk(c, .15)); p(cx - 1, yb - 7, lt(c, .2)); }
  else if (h === 'headband') { R(-3, 3, 5, c); if (!front) p(cx - 4, yb - 4, c); }
  else if (h === 'peaked') { const b = k.hatBand || dk(c, .35); R(-2, 2, 8, c); R(-3, 3, 7, c); R(-3, 3, 6, b); R(3, bf, 5, '#22202c'); if (front) p(cx + 2, yb - 7, GOLD); p(cx - 1, yb - 8, lt(c, .25)); }
  else if (h === 'turban') { R(-1, 1, 8, c); R(-2, 2, 7, c); R(-3, 3, 6, c); R(-3, 3, 5, c); R(-3, front ? 0 : 3, 4, c); if (front) { p(cx + 3, yb - 4, c); p(cx + 1, yb - 4, dk(c, .1)); p(cx + 2, yb - 4, dk(c, .1)); } if (front) R(-3, -2, 3, dk(c, .15)); else { R(-3, 2, 3, c); R(-3, -2, 3, dk(c, .15)); p(cx - 1, yb - 2, dk(c, .18)); p(cx, yb - 2, dk(c, .18)); } p(cx, yb - 7, lt(c, .3)); p(cx - 1, yb - 6, lt(c, .3)); p(cx - 2, yb - 5, lt(c, .3)); p(cx + 1, yb - 6, dk(c, .18)); p(cx + 2, yb - 5, dk(c, .18)); p(cx, yb - 5, dk(c, .18)); p(cx - 3, yb - 5, dk(c, .18)); p(cx - 3, yb - 4, dk(c, .18)); }
  else if (h === 'bucket') { R(-2, 2, 7, c); R(-3, 3, 6, c); R(-4, 4, 5, dk(c, .15)); R(-4, -3, 5, dk(c, .28)); p(cx - 1, yb - 7, lt(c, .3)); }
  else if (h === 'fedora') { R(-2, 2, 8, c); R(-3, 3, 7, c); R(-3, 3, 6, k.hatBand || dk(c, .45)); R(-5, 5, 5, c); R(-5, -3, 5, dk(c, .15)); p(cx, yb - 8, dk(c, .2)); p(cx - 1, yb - 8, lt(c, .25)); }
  else if (h === 'cowboy') { R(-2, 2, 8, c); R(-3, 3, 7, c); R(-3, 3, 6, k.hatBand || dk(c, .4)); R(-5, 5, 5, c); R(-5, -4, 5, dk(c, .15)); p(cx - 6, yb - 6, dk(c, .1)); p(cx + 6, yb - 6, c); p(cx, yb - 8, dk(c, .22)); p(cx - 2, yb - 8, lt(c, .2)); }
  else if (h === 'visor') { R(-3, 3, 5, c); R(4, bf, 5, dk(c, .25)); if (front) p(cx + 2, yb - 5, lt(c, .45)); else p(cx - 4, yb - 4, c); }
  else if (h === 'snapback') { R(-3, 3, 7, c); R(-3, 3, 6, c); R(-3, 3, 5, dk(c, .12)); R(3, bf + 1, 5, k.hatBand || k.accent); p(cx - 2, yb - 7, lt(c, .3)); if (front) { p(cx + 1, yb - 6, WHITE); p(cx + 2, yb - 6, WHITE); } }
  else if (h === 'backcap') { R(-2, 2, 7, c); R(-3, 3, 6, c); R(-3, 3, 5, dk(c, .15)); R(-5, -4, 5, dk(c, .3)); p(cx - 1, yb - 7, lt(c, .3)); if (front) p(cx + 1, yb - 5, lt(c, .35)); }
  else if (h === 'slouch') { R(-3, 2, 7, c); R(-4, 3, 6, c); R(-3, 3, 5, lt(c, .28)); p(cx - 4, yb - 5, c); p(cx - 5, yb - 6, dk(c, .15)); p(cx - 5, yb - 5, dk(c, .15)); p(cx - 3, yb - 8, c); p(cx - 2, yb - 8, c); p(cx - 1, yb - 7, lt(c, .2)); }
  else if (h === 'pom') { const b = k.hatBand || k.accent; R(-2, 2, 7, c); R(-3, 3, 6, b); R(-3, 3, 5, c); p(cx - 3, yb - 6, c); p(cx - 1, yb - 6, c); p(cx + 1, yb - 6, c); p(cx + 3, yb - 6, c); p(cx - 1, yb - 8, b); p(cx, yb - 8, b); p(cx - 1, yb - 9, lt(b, .3)); p(cx, yb - 9, b); }
  else if (h === 'tophat') { for (let rr = 7; rr <= 10; rr++) R(-2, 2, rr, rr === 7 ? (k.hatBand || '#b83a6a') : c); R(-4, 4, 6, c); R(-4, -3, 6, dk(c, .2)); for (let rr = 8; rr <= 10; rr++) p(cx - 1, yb - rr, lt(c, .22)); }
  else if (h === 'boater') { R(-3, 3, 7, c); R(-3, 3, 6, k.hatBand || k.accent); R(-5, 5, 5, c); R(-5, -3, 5, dk(c, .12)); p(cx - 1, yb - 7, lt(c, .3)); p(cx + 1, yb - 7, dk(c, .1)); }
  else if (h === 'bandana') { R(-2, 2, 7, c); R(-3, 3, 6, c); R(-3, 3, 5, dk(c, .1)); p(cx - 1, yb - 6, WHITE); p(cx + 1, yb - 7, WHITE); p(cx + 2, yb - 5, WHITE); p(cx - 2, yb - 5, WHITE); p(cx - 4, yb - 4, c); p(cx - 4, yb - 3, dk(c, .2)); }
  else if (h === 'earmuffs') { R(-2, 2, 7, dk(c, .45)); p(cx - 3, yb - 6, dk(c, .45)); p(cx - 3, yb - 5, dk(c, .45)); if (front) { p(cx + 3, yb - 6, dk(c, .45)); p(cx - 3, yb - 4, c); p(cx - 3, yb - 3, c); p(cx - 4, yb - 4, lt(c, .25)); p(cx - 4, yb - 3, c); } else { p(cx + 3, yb - 6, dk(c, .45)); p(cx + 3, yb - 5, dk(c, .45)); for (const x of [-4, 4]) { p(cx + x, yb - 4, lt(c, .2)); p(cx + x, yb - 3, c); } } }
  else if (h === 'party') { const b = k.hatBand || k.accent; p(cx, yb - 11, GOLD); p(cx, yb - 10, c); R(-1, 0, 9, b); R(-1, 1, 8, c); R(-2, 1, 7, b); p(cx - 1, yb - 8, lt(c, .3)); }
  else if (h === 'crown') { R(-2, 2, 7, c || GOLD); p(cx - 2, yb - 8, c || GOLD); p(cx, yb - 8, c || GOLD); p(cx + 2, yb - 8, c || GOLD); p(cx - 1, yb - 7, '#d9483b'); p(cx + 1, yb - 7, '#5ab0e0'); p(cx, yb - 9, lt(c || GOLD, .4)); }
  else if (h === 'flowercrown') { const fl = [c, WHITE, k.accent, c]; for (let x = -3; x <= 3; x++) p(cx + x, yb - 6, (x & 1) ? '#5aa84f' : fl[(x + 4) >> 1 & 3]); p(cx - 2, yb - 7, c); p(cx + 2, yb - 7, k.accent); }
  else if (h === 'bow') { p(cx - 3, yb - 8, c); p(cx - 3, yb - 7, c); p(cx - 2, yb - 7, dk(c, .25)); p(cx - 1, yb - 8, c); p(cx - 1, yb - 7, c); p(cx - 3, yb - 9, lt(c, .2)); p(cx - 1, yb - 9, lt(c, .2)); }
  else if (h === 'helmet') { R(-2, 2, 8, c); R(-3, 3, 7, c); R(-3, 3, 6, c); R(-3, 3, 5, dk(c, .22)); p(cx - 1, yb - 7, '#22202c'); p(cx + 1, yb - 7, '#22202c'); p(cx, yb - 8, lt(c, .45)); p(cx - 1, yb - 8, lt(c, .45)); if (front) { p(cx + 3, yb - 4, '#22202c'); p(cx + 3, yb - 3, '#22202c'); } }
  else if (h === 'trapper') { const fur = '#f0e6d0'; R(-2, 2, 7, c); R(-3, 3, 6, c); R(-3, 3, 5, fur); p(cx - 3, yb - 4, c); p(cx - 3, yb - 3, c); p(cx - 3, yb - 2, fur); p(cx - 4, yb - 4, dk(c, .15)); p(cx - 4, yb - 3, dk(c, .15)); if (!front) { p(cx + 3, yb - 4, c); p(cx + 3, yb - 3, c); p(cx + 3, yb - 2, fur); } p(cx - 1, yb - 7, lt(c, .25)); }
  else if (h === 'cloche') { R(-2, 2, 7, c); R(-3, 3, 6, k.hatBand || k.accent); R(-4, 4, 5, c); R(-4, -3, 5, dk(c, .15)); p(cx - 4, yb - 4, dk(c, .15)); p(cx - 1, yb - 7, lt(c, .3)); if (front) p(cx + 2, yb - 6, lt(k.accent, .4)); }
  else if (h === 'santa') { R(-2, 2, 7, c); R(-3, 3, 6, c); R(-3, 3, 5, WHITE); p(cx - 3, yb - 7, c); p(cx - 4, yb - 6, c); p(cx - 4, yb - 5, c); p(cx - 5, yb - 4, WHITE); p(cx - 5, yb - 5, WHITE); p(cx, yb - 8, lt(c, .2)); p(cx - 1, yb - 8, c); }
  else if (h === 'witch') { p(cx - 1, yb - 11, c); R(-1, 0, 10, c); R(-1, 1, 9, c); R(-2, 1, 8, c); R(-2, 2, 7, c); R(-3, 3, 6, k.hatBand || '#7a55c8'); R(-5, 5, 5, c); R(-5, -3, 5, dk(c, .2)); p(cx, yb - 6, GOLD); p(cx - 1, yb - 9, lt(c, .25)); }
  else if (h === 'bunny') { for (const x of [-2, 1]) for (let rr = 7; rr <= 10; rr++) { p(cx + x, yb - rr, c); p(cx + x + 1, yb - rr, rr > 7 && rr < 10 ? '#f4a8c0' : c); } }
  else if (h === 'cookcap') { R(-2, 2, 7, c); R(-3, 3, 6, c); R(-3, 3, 5, dk(c, .12)); }
  else if (h === 'toque') { R(-3, 3, 5, dk(c, .14)); R(-3, 3, 6, c); R(-3, 3, 7, c); R(-4, 4, 8, c); R(-4, 4, 9, c); R(-3, 3, 10, c); p(cx - 1, yb - 7, dk(c, .12)); p(cx + 1, yb - 7, dk(c, .12)); p(cx - 4, yb - 8, dk(c, .12)); p(cx - 2, yb - 9, lt(c, .5)); }
}
const GLASS = { round: { f: '#c8a040', l: '#eaf6fa' }, color: { f: 1, l: '#dff4fa' }, aviator: { f: '#c8a040', l: '#5a6a3a', low: 2 }, tint: { f: '#22202c', l: 1, low: 1 }, heart: { f: 1, l: 1, low: 1 }, sport: { f: '#22202c', l: 1, low: 2, wrap: 1 }, monocle: { f: '#c8a040', l: '#dff4fa' } };
function beardDraw(k, cx, yb, P) {
  const b = k.beard === true ? 'full' : k.beard, h = k.hairC, d = dk(h, .15), st = mix(k.skin, h, .38);
  if (SHAPES.beard[b]) { SHAPES.beard[b].draw({ p, cx, yb, h, d, st, sk: k.skin, mouth: P.mouth, k, dk, lt, mix }); return; }
  if (b === 'full' || b === 'long') { for (let x = -1; x <= 3; x++) if (x !== 1) p(cx + x, yb - 1, h); for (let x = -1; x <= 2; x++) p(cx + x, yb, d); if (P.mouth !== 1) p(cx + 1, yb - 1, lt(h, .15)); if (b === 'long') { for (let x = -1; x <= 2; x++) p(cx + x, yb + 1, x === -1 ? d : h); p(cx, yb + 2, d); p(cx + 1, yb + 2, h); p(cx + 1, yb + 3, d); } }
  else if (b === 'stubble') { for (let x = -1; x <= 3; x++) if (x !== 1) p(cx + x, yb - 1, st); for (let x = -1; x <= 2; x++) p(cx + x, yb, mix(st, h, .2)); }
  else if (b === 'goatee') { p(cx + 1, yb, h); p(cx + 2, yb, d); p(cx, yb - 1, h); p(cx + 2, yb - 1, h); }
  else if (b === 'mustache') { p(cx, yb - 1, h); p(cx + 2, yb - 1, h); p(cx + 3, yb - 1, d); if (P.mouth !== 1) p(cx + 1, yb - 1, lt(h, .12)); }
  else if (b === 'chinstrap') { for (let x = -2; x <= 2; x++) p(cx + x, yb, d); p(cx - 2, yb - 1, h); p(cx - 2, yb - 2, h); }
  else if (b === 'soulpatch') { p(cx + 1, yb, h); }
  else if (b === 'mutton') { p(cx - 1, yb - 1, h); p(cx - 1, yb - 2, h); p(cx - 2, yb - 1, d); p(cx - 1, yb, d); p(cx - 2, yb, d); p(cx, yb - 1, h); }
}
function head(k, cx, yb, front, P) {
  const sk = k.skin;
  for (let rr = 0; rr < 7; rr++) { const hw = (rr === 0 || rr === 6) ? 2 : 3; for (let x = -hw; x <= hw; x++) p(cx + x, yb - rr, rr === 0 ? dk(sk, .1) : (x === -3 ? dk(sk, .06) : sk)); }
  if (front) {
    const bl = mix(sk, '#f0506a', .28), ey = P.eyes, lip = mix(dk(sk, .3), '#c04050', .35), brow = mix(dk(sk, .35), k.hairC, .45);
    p(cx + 3, yb - 1, bl); if (k.kid) p(cx - 1, yb - 1, bl);
    if (!k.kid) { p(cx, yb - 4, brow); p(cx + 2, yb - 4, brow); }
    for (const x of [0, 2]) {
      if (ey === 1) { p(cx + x, yb - 3, EYE); p(cx + x, yb - 2, EYE); p(cx + x - 1, yb - 3, '#f6efe6'); }
      else if (ey === 2) p(cx + x, yb - 2, dk(sk, .5));      // closed
      else { p(cx + x, yb - 2, EYE); p(cx + x, yb - 3, dk(sk, .12)); }   // looking down
    }
    if (P.mouth === 1) p(cx + 1, yb - 1, '#8a3040'); else if (P.mouth === 2) { p(cx + 1, yb - 1, lip); p(cx + 2, yb - 1, lip); } else p(cx + 1, yb - 1, mix(sk, lip, .55));
    if (k.beard) beardDraw(k, cx, yb, P);
    if (k.elder && !k.beard) p(cx - 1, yb - 2, dk(sk, .1));
    if (SHAPES.glasses[k.glasses]) SHAPES.glasses[k.glasses].draw({ p, cx, yb, c: k.glassC, front: true, sk, EYE, k, dk, lt, mix, WHITE, GOLD });
    else if (GLASS[k.glasses]) { const g = GLASS[k.glasses], fr = g.f === 1 ? (k.glassC || '#d9483b') : g.f, ln = g.l === 1 ? (k.glassC || '#f08ab0') : g.l;
      if (k.glasses === 'monocle') { p(cx + 2, yb - 3, ln); p(cx + 3, yb - 3, fr); p(cx + 1, yb - 3, fr); p(cx + 2, yb - 4, fr); p(cx + 3, yb - 2, fr); p(cx + 3, yb - 1, fr); p(cx + 2, yb - 2, EYE); }
      else { for (const x of [-2, -1, 1, 3]) p(cx + x, yb - 3, fr); p(cx, yb - 3, ln); p(cx + 2, yb - 3, ln); if (g.low) { p(cx, yb - 2, g.low === 1 ? ln : dk(ln, .2)); p(cx + 2, yb - 2, g.low === 1 ? ln : dk(ln, .2)); if (g.wrap) p(cx + 1, yb - 3, ln); p(cx, yb - 3, lt(ln, .4)); } else { p(cx, yb - 2, EYE); p(cx + 2, yb - 2, EYE); } }
    }
    else if (k.glasses === 'sun') { for (let x = -1; x <= 3; x++) p(cx + x, yb - 3, '#22202c'); p(cx, yb - 2, '#22202c'); p(cx + 2, yb - 2, '#22202c'); p(cx, yb - 3, '#5a5a7a'); p(cx - 2, yb - 3, '#22202c'); }
    else if (k.glasses) { const g = '#3a3448'; p(cx - 1, yb - 3, g); p(cx + 1, yb - 3, g); p(cx + 3, yb - 3, g); p(cx, yb - 3, '#dff4fa'); p(cx + 2, yb - 3, '#dff4fa'); p(cx, yb - 2, EYE); p(cx + 2, yb - 2, EYE); p(cx - 2, yb - 3, g); }
  } else if (SHAPES.glasses[k.glasses]) SHAPES.glasses[k.glasses].draw({ p, cx, yb, c: k.glassC, front: false, sk, EYE, k, dk, lt, mix, WHITE, GOLD });
  else if (k.glasses) p(cx + 3, yb - 3, GLASS[k.glasses] ? (GLASS[k.glasses].f === 1 ? (k.glassC || '#d9483b') : GLASS[k.glasses].f) : '#3a3448');
  hairTpl(k, cx, yb, front, k.hat);
  if (k.hat) hatDraw(k, cx, yb, front);
}
function bagBack(k, front, yS, hands) { // drawn over the body
  const b = k.bag, c = k.bagC, T = k.T;
  if (SHAPES.bag[b]) { if (SHAPES.bag[b].back) SHAPES.bag[b].back({ p, yS, x0: k.x0, x1: k.x1, ax: k.ax, T, c, front, accent: k.accent, k, dk, lt, mix, WHITE, GOLD }); return; }
  if (b === 'backpack') {
    if (front) { for (let j = 0; j < Math.min(3, T - 2); j++) { p(k.x0 + 1, yS + j, dk(c, .2)); p(k.x1, yS + j, dk(c, .3)); } }
    else { for (let j = 0; j < T - 1; j++) for (let x = -2; x <= 2 && x <= k.x1; x++) p(x, yS + j, j === 0 ? lt(c, .25) : x === -2 ? dk(c, .2) : c); for (let x = -1; x <= 1; x++) { p(x, yS + T - 3, dk(c, .25)); } p(0, yS + 1, lt(c, .4)); }
  } else if (b === 'tote') {
    const x = k.ax[0] - 2, y = yS + k.T - 3;
    for (let j = 0; j < y - yS; j++) p(k.ax[0], yS + j, dk(c, .3));
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) p(x + i, y + j, j === 0 ? lt(c, .25) : i === 0 ? dk(c, .18) : c);
    p(x + 1, y + 2, k.accent);
  } else if (b === 'messenger') {
    const n = T - 2;
    for (let j = 0; j <= n; j++) p(front ? k.x0 + Math.round(j * (k.x1 - k.x0) / n) : k.x1 - Math.round(j * (k.x1 - k.x0) / n), yS + j, dk(c, .3));
    const x = front ? k.x1 : k.x0 - 2, y = yS + T - 3;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) p(x + i, y + j, j < 2 ? lt(c, .12) : c); p(x + 1, y + 1, lt(c, .5));
  } else if (b === 'purse') {
    const n = T - 2; for (let j = 0; j <= n; j++) p(front ? k.x0 + Math.round(j * (k.x1 - k.x0) / n) : k.x1 - Math.round(j * (k.x1 - k.x0) / n), yS + j, dk(c, .35));
    const x = front ? k.x1 : k.x0 - 1, y = yS + T - 2; p(x, y, lt(c, .2)); p(x + 1, y, lt(c, .2)); p(x, y + 1, c); p(x + 1, y + 1, dk(c, .12)); p(x, y + 2, c); p(x + 1, y + 2, dk(c, .12)); p(x + (front ? 0 : 1), y + 1, GOLD);
  } else if (b === 'fanny') {
    for (let x = k.x0; x <= k.x1; x++) p(x, yS + T - 1, dk(c, .35)); if (front) { for (let x = 0; x <= Math.min(2, k.x1); x++) { p(x, yS + T - 1, lt(c, .15)); p(x, yS + T, c); } p(1, yS + T - 1, '#c8ccd4'); } else p(k.x0, yS + T - 1, c);
  } else if (b === 'camera') {
    if (front) { p(k.x0 + 1, yS, '#22202c'); p(k.x0 + 1, yS + 1, '#22202c'); p(k.x1, yS, '#22202c'); p(k.x1, yS + 1, '#22202c'); for (let x = 0; x <= 2 && x <= k.x1; x++) { p(x, yS + 2, c); p(x, yS + 3, dk(c, .15)); } p(1, yS + 3, '#9ad0e8'); p(0, yS + 2, lt(c, .35)); }
    else { for (let x = -1; x <= 1; x++) p(x, yS, '#22202c'); }
  }
}
function bagHand(k, P, hand) {
  if (!P.hold || P.seated) return; const b = k.bag, c = k.bagC, x = hand[0], y = hand[1];
  if (SHAPES.bag[b]) { if (SHAPES.bag[b].hand) SHAPES.bag[b].hand({ p, x, y, c, accent: k.accent, k, dk, lt, mix, WHITE, GOLD }); return; }
  if (b === 'briefcase') { p(x, y + 1, dk(c, .4)); for (let j = 0; j < 3; j++) for (let i = -1; i <= 2; i++) p(x + i, y + 2 + j, j === 0 ? lt(c, .2) : c); p(x, y + 3, GOLD); p(x + 1, y + 3, GOLD); }
  else if (b === 'duffel') { p(x, y + 1, dk(c, .4)); p(x + 1, y + 1, dk(c, .4)); for (let j = 0; j < 3; j++) for (let i = -2; i <= 3; i++) p(x + i, y + 2 + j, j === 0 ? lt(c, .2) : i === -2 ? dk(c, .18) : c); p(x, y + 3, k.accent); p(x + 1, y + 3, k.accent); }
  else if (b === 'handbag') { p(x - 1, y + 1, dk(c, .35)); p(x + 1, y + 1, dk(c, .35)); p(x, y, dk(c, .35)); for (let j = 0; j < 3; j++) for (let i = -1; i <= 1; i++) p(x + i, y + 2 + j, j === 0 ? lt(c, .22) : i === -1 ? dk(c, .15) : c); p(x, y + 3, GOLD); }
  else if (b === 'grocery') { const g = '#c8a070'; for (let j = 0; j < 4; j++) for (let i = -1; i <= 1; i++) p(x + i, y + 1 + j, i === -1 ? dk(g, .15) : j === 0 ? lt(g, .2) : g); p(x - 1, y, '#5aa84f'); p(x + 1, y, '#f09a3a'); p(x + 1, y - 1, '#5aa84f'); p(x, y + 3, c); }
}
function props(k, P, pose, front, yS, hA, hB) {
  const t = P.prop; if (!t) return;
  if (t === 'phone') { const x = hB[0], y = hB[1]; r(x, y - 3, 2, 3, '#2f2c3a'); glit(() => { p(front ? x : x + 1, y - 3, '#c8f0ff'); p(front ? x : x + 1, y - 2, '#8fd0f0'); }); p(x, y, k.skin); }
  else if (t === 'cup') { const x = hB[0], y = hB[1], c = pose.itemColor || WHITE; r(x, y - 2, 2, 2, c); p(x, y - 2, dk(c, .25)); p(x + 1, y - 2, dk(c, .25)); p(x + 1, y - 1, '#c88a5a'); p(x, y, k.skin); }
  else if (t === 'eat') { const x = hA[0], y = hA[1]; r(x, y - 1, 4, 1, '#f09a5a'); r(x, y, 4, 1, WHITE); p(x + 1, y + 1, '#c8ccd4'); p(x + 2, y + 1, '#c8ccd4'); p(x - 1, y, k.skin); p(hB[0], hB[1] - 1, '#f0c060'); p(hB[0], hB[1], dk(k.skin, .1)); }
  else if (t === 'book') { const x = hA[0], y = hA[1] - 2, c = pose.itemColor || k.accent; r(x, y, 4, 3, c); r(x, y, 4, 1, WHITE); p(x, y + 1, dk(c, .25)); p(x, y + 2, dk(c, .25)); p(hA[0] - 1 + 1, hA[1] + 1, k.skin); p(hB[0], hB[1], dk(k.skin, .1)); }
  else if (t === 'dumb') { for (const h of [hA, hB]) { const g = '#4a4a58'; for (const d of [-1, 1]) { p(h[0] + d, h[1] - 1, g); p(h[0] + d, h[1], lt(g, .2)); p(h[0] + d, h[1] + 1, g); } } }
  else if (t === 'carry') {
    const it = pose.item || 'box', x = 1 + (P.lean || 0), y = yS + 1;
    if (it === 'bag') { const g = pose.itemColor || '#c8a070'; r(x, y - 1, 5, 6, g); r(x, y - 1, 1, 6, dk(g, .15)); r(x + 1, y - 1, 4, 1, lt(g, .2)); p(x + 1, y - 2, '#5aa84f'); p(x + 2, y - 3, '#5aa84f'); p(x + 2, y - 2, '#5aa84f'); p(x + 3, y - 2, '#f09a3a'); p(x + 4, y - 2, '#e8d8b0'); p(x + 4, y - 3, '#e8d8b0'); }
    else if (it === 'tray') { const g = pose.itemColor || '#8a6a4a'; r(x - 1, y + 2, 8, 1, g); p(x + 6, y + 2, dk(g, .2)); r(x + 1, y, 2, 2, WHITE); r(x + 4, y, 2, 2, WHITE); p(x + 1, y, '#c88a5a'); p(x + 4, y, '#c88a5a'); p(x + 3, y + 1, '#f09a5a'); }
    else { const g = pose.itemColor || '#c89a5a'; r(x, y, 6, 5, g); r(x, y, 6, 1, lt(g, .25)); r(x, y, 1, 5, dk(g, .15)); r(x + 3, y, 1, 5, '#ead8b0'); p(x + 5, y + 3, dk(g, .3)); p(x + 4, y + 3, dk(g, .3)); }
    if (front) { p(x, yS + 3, k.skin); p(x + (it === 'tray' ? 6 : 5), yS + 4, dk(k.skin, .1)); }
  }
}

function figure(k, P, front, pose) {
  const seated = P.seated, T = k.T;
  const hipY = seated ? 0 : -k.L + Math.max(P.bob, -9) - P.jump, yS = hipY - T;
  const hdx = P.hdx + (P.lean || 0) + (k.elder ? 1 : 0), yb = yS - 1 + P.hdy;
  let hA, hB;
  if (front) {
    if (k.bag === 'backpack') { const c = k.bagC; for (let j = 0; j < T - 1; j++) { p(k.ax[0] - 1, yS + 1 + j, dk(c, .12)); p(k.ax[0], yS + 1 + j, c); if (j && j < T - 2) p(k.ax[0] - 2, yS + 1 + j, dk(c, .22)); } p(k.ax[0] - 1, yS + 1, lt(c, .3)); }
    if (!seated) { standLegs(k, P, front, hipY); if (k.skirtLen) skirt(k, hipY); }
    const bBehind = P.arms[1][2] < 0; if (bBehind) hB = arm(k, P, 1, P.arms[1], yS);
    torso(k, P, front, yS, hipY);
    if (seated) seatedLegs(k, P, front);
    if (k.top === 'hoodie') { p(k.x0 - 1 + hdx, yS - 1, dk(k.topC, .2)); p(k.x0 - 2 + hdx, yS, dk(k.topC, .2)); }
    if (!bBehind) hB = arm(k, P, 1, P.arms[1], yS); hA = arm(k, P, 0, P.arms[0], yS);
    head(k, hdx, yb, front, P);
    if (k.top === 'turtleneck' || k.top === 'sweaterdress') { const cl = lt(k.topC, .12); p(hdx - 1, yb, dk(cl, .12)); p(hdx, yb, cl); p(hdx + 1, yb, cl); }
    else if (k.top === 'parka' || k.top === 'raincoat') { const cl = k.top === 'parka' ? '#f0e6d0' : dk(k.topC, .16); p(k.x0 - 1 + hdx, yS - 1, cl); p(k.x0 - 2 + hdx, yS, cl); p(k.x0 - 1 + hdx, yS - 2, cl); }
    if (k.scarf) { for (let x = k.x0 - 1; x <= k.x1 + 1; x++) p(x + (P.lean || 0), yS, x < k.x0 + 1 ? dk(k.scarf, .15) : k.scarf); p(P.lean || 0, yS + 1, k.scarf); p(P.lean || 0, yS + 2, dk(k.scarf, .15)); }
    if (k.neck) neckDraw(k, P, yS, true);
    bagBack(k, front, yS); bagHand(k, P, hA);
    props(k, P, pose, front, yS, hA, hB);
  } else {
    if (seated) seatedLegs(k, P, front); else { standLegs(k, P, front, hipY); if (k.skirtLen) skirt(k, hipY); }
    hA = arm(k, P, 0, P.arms[0], yS); hB = arm(k, P, 1, P.arms[1], yS);
    props(k, P, pose, front, yS, hA, hB); bagHand(k, P, hA);
    torso(k, P, front, yS, hipY);
    // arms hanging at the sides stay visible; redraw the shoulders
    p(k.ax[0] + (P.lean || 0), yS, get0(k, 0)); p(k.ax[1] + (P.lean || 0), yS, get0(k, 1));
    if (k.scarf) { for (let x = k.x0 - 1; x <= k.x1 + 1; x++) p(x + (P.lean || 0), yS, x < k.x0 + 1 ? dk(k.scarf, .15) : k.scarf); p(-1, yS + 1, k.scarf); p(-1, yS + 2, dk(k.scarf, .15)); p(-1, yS + 3, dk(k.scarf, .15)); }
    if (k.neck) neckDraw(k, P, yS, false);
    head(k, hdx, yb, front, P);
    if (k.top === 'parka' || k.top === 'raincoat' || k.top === 'ziphoodie') { const cl = k.top === 'parka' ? '#f0e6d0' : dk(k.topC, .16); for (let x = -2; x <= 1; x++) p(x + hdx, yb + 1, cl); }
    bagBack(k, front, yS);
  }
}
function neckDraw(k, P, yS, front) {
  const c = k.neckC, L = P.lean || 0, n = k.neck;
  if (SHAPES.neck[n]) { SHAPES.neck[n].draw({ p, yS, L, x0: k.x0, x1: k.x1, T: k.T, c, front, k, dk, lt, mix, WHITE, GOLD }); return; }
  if (n === 'longscarf' && front) { p(L, yS + 3, c); p(L, yS + 4, c); p(L, yS + 5, dk(c, .25)); p(L - 1, yS + 1, dk(c, .15)); }
  else if (n === 'bandana') { if (front) { for (let x = 0; x <= Math.min(2, k.x1); x++) p(x + L, yS, c); p(1 + L, yS + 1, c); p(L, yS, lt(c, .4)); } else { for (let x = -1; x <= 1; x++) p(x + L, yS, c); p(L, yS + 1, dk(c, .15)); } }
  else if (n === 'necklace') { if (front) { p(L, yS, GOLD); if (k.x1 > 1) p(2 + L, yS, GOLD); p(1 + L, yS + 1, c); } }
  else if (n === 'beads') { if (front) { p(L, yS, c); p(1 + L, yS, lt(c, .35)); if (k.x1 > 1) p(2 + L, yS, c); } else { p(-1 + L, yS, c); p(1 + L, yS, c); } }
  else if (n === 'shawl') { for (let x = k.x0 - 1; x <= k.x1 + 1; x++) { p(x + L, yS, x < k.x0 + 1 ? dk(c, .15) : c); p(x + L, yS + 1, x < k.x0 + 1 ? dk(c, .2) : dk(c, .06)); if ((x + 8) & 1) p(x + L, yS + 2, dk(c, .28)); } }
}
const get0 = (k, i) => { if (k.epaul) return k.epaul; const base = k.armC ? k.armC : ((k.top === 'none' || k.top === 'tank' || k.top === 'swimsuit') ? k.skin : k.top === 'varsity' ? '#ece6d8' : k.topC); return i ? dk(base, .15) : lt(base, .12); };

function lying(k, front, f, pose) {
  const s = front ? 1 : -1, yo = x => Math.round(x * .5 * s) - 4, T = k.T + 1, L = k.L;
  const tx = -5 + (k.kid ? 2 : 0), lx = tx + T, ex = lx + L, bare = k.top === 'none', body = bare ? k.skin : (k.vest || k.topC);
  const armBase = NO_SLEEVE[k.top] ? k.skin : k.top === 'varsity' ? '#ece6d8' : k.topC;
  for (let x = tx; x < lx; x++) {
    const y = yo(x), i = x - tx, br = f && i > 1 && i < T - 1 ? 1 : 0;
    let c = body; if (!bare && (k.top === 'stripe' || k.top === 'pj') && (i & 1)) c = lt(c, .4);
    for (let j = -3 - br; j <= 1; j++) p(x, y + j, j === -3 - br ? lt(c, .12) : j === 1 ? dk(c, .14) : c);
    if (i > 0 && i < 6) { const ac = i === 5 ? k.skin : i <= k.sleeve ? lt(armBase, .12) : k.skin; p(x, y + 2, ac); if (i < 5) p(x, y + 1, dk(ac, .12)); }
  }
  for (let x = lx; x < ex; x++) {
    const y = yo(x), i = x - lx;
    const c = k.skirtLen && i < Math.min(k.skirtLen + 1, L) ? k.skirtC : legColor(k, i, L);
    p(x, y - 3, dk(c, .16)); p(x, y - 2, dk(c, .16)); p(x, y - 1, c); p(x, y, c); if (k.skirtLen && i < Math.min(k.skirtLen + 1, L)) p(x, y + 1, dk(c, .1));
  }
  const S = shoeCols(k, true);
  for (let x = ex; x < ex + 2; x++) { const y = yo(x); for (let j = (x === ex ? -4 : -3); j <= 0; j++) p(x, y + j, x === ex + 1 ? S.sole : j < -2 ? S.hi : S.up); }
  if (pose.blanket) {
    const b = pose.blanket, bx = tx + 3, be = ex + 2;
    for (let x = bx; x <= be; x++) {
      const y = yo(x), i = x - bx, last = x === be, br = f && i > 0 && i < 4 ? 1 : 0;
      for (let j = (last ? -3 : -4) - br; j <= (last ? 1 : 2); j++)
        p(x, y + j, i < 2 ? lt(b, .5) : j === 2 || last ? dk(b, .18) : j <= -4 ? lt(b, .18) : ((x + j * 2) % 6 === 0) ? dk(b, .08) : b);
    }
  }
  const hx = tx - 3, hat = k.hat; k.hat = null;
  head(k, hx, yo(hx) + 2, true, { eyes: 2, mouth: 0 });
  k.hat = hat;
}

/**
 * Draw one character frame at the current raster origin (feet centre / seat point = PW(0,0,0)).
 * spec: { skin, hair, hairColor, top, topColor, bottom, bottomColor, shoes, hat, hatColor, glasses, bag, bagColor,
 *         build, height, age, outfit, beard, scarf, innerColor, accent }
 * pose: { anim, frame, dir, seated, item, itemColor, blanket, seatH }
 */
export function drawChar(spec, pose) {
  pose = pose || {};
  const anim = ANIMS[pose.anim] ? pose.anim : 'stand', n = ANIMS[anim], f = (((pose.frame | 0) % n) + n) % n, dir = (pose.dir | 0) & 3;
  const front = dir < 2, mirror = dir === 1 || dir === 2, k = look(spec || {});
  const s = PW(0, 0, 0), ax = Math.round(s[0]), ay = Math.round(s[1]);
  gclear();
  if (anim === 'sleep') { lying(k, front, f, pose); flush(ax, ay, mirror); return; }
  const P = poseOf(anim, f, front, pose);
  if (P.seated) { const sh = P.seatH || (k.kid ? SEAT_H - 2 : SEAT_H); shadow(ax, ay, 2, sh + (front ? 2 : -2), 5, mirror); }
  else shadow(ax, ay, 0, 0, P.jump ? 4 : k.kid ? 5 : 6, mirror);
  figure(k, P, front, pose);
  flush(ax, ay, mirror);
}

/* ---------- random citizens ---------- */
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
const wpick = (r, a) => { let t = 0; for (const q of a) t += q[1]; let v = r() * t; for (const q of a) { v -= q[1]; if (v <= 0) return q[0]; } return a[0][0]; };
/** fashion archetypes used by randomSpec (opts.style forces one) */
export const STYLES = ['casual', 'street', 'athleisure', 'business', 'hipster', 'workwear', 'preppy'];
// per style: tops for warm / mild / cold weather, bottoms, [hat, chance] list, bags, shoes
const ST = {
  casual: { w: ['tee', 'tee', 'graphic', 'stripe', 'polo', 'tank'], m: ['long', 'hoodie', 'jacket', 'sweater', 'tee', 'stripe', 'flannel'], c: ['coat', 'puffer', 'sweater', 'hoodie'], b: ['jeans', 'jeans', 'slacks', 'cargo'], hats: [['cap', .1]], bags: ['backpack', 'tote', 'grocery', 'messenger'], shoes: SHOE_COLORS },
  street: { w: ['graphic', 'graphic', 'tee', 'tank', 'varsity'], m: ['hoodie', 'hoodie', 'varsity', 'graphic', 'puffer'], c: ['puffer', 'puffer', 'hoodie', 'varsity'], b: ['sweats', 'cargo', 'jeans', 'cargo'], hats: [['cap', .35], ['beanie', .2]], bags: ['backpack', 'messenger'], shoes: ['#f0ece4', '#d04a3a', '#3b6fd0', '#f0c040', '#2f2c3a', '#4fa860'] },
  athleisure: { w: ['tank', 'tee', 'tank'], m: ['long', 'hoodie', 'tee', 'puffer'], c: ['puffer', 'hoodie'], b: ['leggings', 'sweats', 'leggings', 'shorts'], hats: [['headband', .25], ['cap', .2]], bags: ['backpack', 'tote'], shoes: ['#f0ece4', '#f0ece4', '#f08ab0', '#5ab0e0', '#9ac84a'] },
  business: { w: ['suit', 'polo', 'long'], m: ['suit', 'suit', 'cardigan'], c: ['coat', 'suit'], b: ['slacks'], hats: [], bags: ['briefcase', 'briefcase', 'messenger', 'tote'], shoes: ['#2f2c3a', '#6a4428'] },
  hipster: { w: ['stripe', 'flannel', 'graphic', 'tee', 'tank'], m: ['cardigan', 'flannel', 'sweater', 'jacket', 'stripe'], c: ['coat', 'sweater', 'jacket'], b: ['jeans', 'overalls', 'cargo', 'slacks'], hats: [['beanie', .25], ['beret', .12], ['flatcap', .1]], bags: ['tote', 'tote', 'messenger', 'backpack'], shoes: ['#6a4428', '#f0ece4', '#d04a3a', '#2f2c3a', '#c8a070'] },
  workwear: { w: ['tee', 'flannel', 'tank', 'graphic'], m: ['flannel', 'jacket', 'long', 'hoodie'], c: ['jacket', 'puffer', 'coat', 'flannel'], b: ['jeans', 'cargo', 'overalls', 'jeans'], hats: [['cap', .3], ['beanie', .15]], bags: ['backpack', 'grocery'], shoes: ['#6a4428', '#6a4428', '#c8a070', '#2f2c3a'] },
  preppy: { w: ['polo', 'stripe', 'polo', 'tee'], m: ['sweater', 'cardigan', 'long', 'jacket', 'varsity'], c: ['coat', 'coat', 'sweater'], b: ['slacks', 'slacks', 'jeans'], hats: [['cap', .08]], bags: ['tote', 'messenger', 'briefcase', 'backpack'], shoes: ['#f0ece4', '#6a4428', '#c8a070', '#2f2c3a'] },
};
const DIST_STYLE = {
  downtown: { business: 6, preppy: 2, casual: 2, street: 1.5, athleisure: 1, hipster: 1, workwear: .5 },
  oldtown: { casual: 3, hipster: 3, preppy: 2, street: 1, athleisure: 1, business: 1, workwear: 1 },
  harborside: { casual: 3, workwear: 3, street: 1.5, hipster: 1.5, athleisure: 1, preppy: 1, business: .5 },
  hillcrest: { preppy: 4, business: 2, athleisure: 2.5, casual: 2, hipster: 1, street: .5, workwear: .3 },
  maplewood: { casual: 4, athleisure: 2, preppy: 2, street: 1.5, workwear: 1.5, hipster: 1, business: 1 },
  arts: { hipster: 5, street: 3, casual: 2, athleisure: 1, preppy: 1, business: .5, workwear: .5 },
  railyard: { workwear: 6, street: 2, casual: 2, hipster: .5, athleisure: .5, business: .3, preppy: .3 },
  park: { athleisure: 4, casual: 3, street: 2, hipster: 1.5, preppy: 1.5, workwear: .5, business: .5 },
  airport: { casual: 3, business: 3, athleisure: 2, street: 2, preppy: 1.5, hipster: 1, workwear: .5 },
};
// hair textures: straight/wavy styles vs coily/protective styles; mixed by skin tone only as a soft weighting so everyone can wear anything
const HAIR_F = [['long', 3], ['bob', 3], ['ponytail', 3], ['bun', 2.5], ['wavy', 3], ['sidepart', 1], ['short', 1], ['pigtails', .5], ['curly', 2.5]];
const HAIR_M = [['short', 4], ['sidepart', 3], ['buzz', 2.5], ['spiky', 1.5], ['curly', 2.5], ['bald', 1.2], ['mohawk', .4], ['bun', .7], ['ponytail', .6], ['long', .5]];
const COIL_F = [['afro', 3], ['braids', 3.5], ['locs', 2.5], ['curly', 3], ['bun', 2], ['cornrows', 1.5], ['buzz', 1], ['ponytail', 1], ['wavy', 1]];
const COIL_M = [['afro', 2], ['hightop', 2], ['buzz', 3.5], ['locs', 2.5], ['cornrows', 1.5], ['curly', 2], ['bald', 1.5], ['short', 1.5], ['braids', .7]];
const ELDER_F = [['bun', 3], ['bob', 3], ['curly', 3], ['short', 2], ['wavy', 1], ['afro', 1], ['locs', 1]], ELDER_M = [['short', 3], ['balding', 4], ['bald', 2], ['sidepart', 2], ['buzz', 2], ['afro', .7]];
/**
 * Plausible, stylish random citizen. r = rng() function.
 * opts: { age, season (0 spring..3 winter), district, outfit, style }.
 * district: 'downtown'|'oldtown'|'harborside'|'hillcrest'|'maplewood'|'arts'|'railyard'|'park'|'airport'
 */
export function randomSpec(r, opts) {
  opts = opts || {}; const season = opts.season === undefined ? 1 : opts.season, d = opts.district || '';
  const age = opts.age || wpick(r, [['adult', d === 'downtown' || d === 'railyard' ? 86 : 68], ['elder', d === 'oldtown' ? 22 : 16], ['kid', d === 'maplewood' || d === 'park' ? 24 : d === 'downtown' || d === 'railyard' ? 4 : 14]]);
  const fem = r() < .5, kid = age === 'kid', elder = age === 'elder';
  const si = Math.floor(r() * SKINS.length) % SKINS.length, deep = si >= 5, midT = si >= 3 && si < 5;
  const s = { age, skin: SKINS[si], build: wpick(r, [['slim', 3], ['avg', 4], ['broad', kid ? 0 : 3]]), height: wpick(r, [['short', 3], ['avg', 4], ['tall', 3]]) };
  // hair
  const coil = deep ? r() < .8 : midT ? r() < .3 : r() < .06;
  let hp = elder ? (fem ? ELDER_F : ELDER_M) : coil ? (fem ? COIL_F : COIL_M) : (fem ? HAIR_F : HAIR_M);
  if (kid) hp = hp.filter(h => h[0] !== 'bald' && h[0] !== 'mohawk' && h[0] !== 'balding').concat(fem ? [['pigtails', 4]] : [['spiky', 2]]);
  if (elder && coil) hp = hp.concat(fem ? [['afro', 3], ['locs', 2], ['braids', 2]] : [['buzz', 3], ['afro', 2], ['locs', 1]]);
  s.hair = wpick(r, hp);
  const dark = [['#2b2433', 6], ['#4a3022', 3], ['#6e4428', 1]], any = [['#2b2433', 3], ['#4a3022', 4], ['#6e4428', 4], ['#8f5a30', 3], ['#a8452a', 1.5], ['#d9722e', 1.2], ['#e6c36a', 3], ['#f0e4b8', .8]];
  s.hairColor = elder && r() < .85 ? pick(r, ['#a9a9b4', '#e8e8ee', '#c8c8d0', '#8a8a98']) : (!kid && r() < (d === 'arts' ? .28 : .07)) ? pick(r, HAIR_COLORS.slice(10).concat(['#e6c36a', '#f0e4b8'])) : wpick(r, si >= 3 ? dark : si === 2 ? dark.concat(any) : any);
  // faith / culture headwear, worn by a small share across all tones
  const hw = r();
  if (!kid && fem && hw < .07) { s.hair = 'hijab'; s.hairColor = pick(r, ['#3fb8a8', '#ead9b8', '#33303f', '#b83a6a', '#7a55c8', '#5ab0e0', '#f08ab0', '#4a4a58', '#f4f0e8']); }
  s.beard = !fem && !kid && r() < (elder ? .35 : .22);
  if (!kid && !fem && hw < .05) { s.hat = 'turban'; s.hatColor = pick(r, ['#d9483b', '#3b6fd0', '#f09a3a', '#2f3f72', '#33303f', '#7a55c8', '#f4f0e8', '#4fa860']); s.beard = true; if (!elder) s.hairColor = '#2b2433'; s.hair = 'bun'; }
  // style archetype
  const sw = Object.assign({}, DIST_STYLE[d] || { casual: 4, street: 2, athleisure: 1.5, business: 1, hipster: 1.5, workwear: 1, preppy: 1.5 });
  if (kid) { sw.business = 0; sw.workwear = .2; sw.casual += 3; } if (elder) { sw.street *= .3; sw.preppy += 2; sw.casual += 2; sw.athleisure *= .6; }
  const style = ST[opts.style] ? opts.style : wpick(r, Object.keys(sw).map(k => [k, sw[k]])), S = ST[style];
  s.style = style;
  let tops = (season === 1 ? S.w : season === 3 ? S.c : S.m).slice(), bots = S.b.slice();
  if (season === 2 && style !== 'athleisure') tops.push(S.c[0]);
  if (fem && season !== 3 && style !== 'workwear' && style !== 'street') { tops.push('dress'); if (season === 1) tops.push('dress'); }
  if (kid) tops = tops.map(t => t === 'suit' ? 'polo' : t);
  if (season === 1 && style !== 'business') bots.push('shorts', 'shorts', 'shorts');
  if (fem) { if (style === 'business' || style === 'preppy' || style === 'casual' || style === 'hipster') bots.push('skirt', season === 3 || elder ? 'longskirt' : 'skirt'); if (style !== 'business') bots.push('leggings'); if (elder || s.hair === 'hijab') bots.push('longskirt', 'longskirt'); }
  if (season === 3) bots = bots.filter(b => b !== 'shorts' && b !== 'skirt'); if (elder) bots = bots.filter(b => b !== 'shorts' || season === 1).concat(['slacks', 'slacks']);
  s.top = pick(r, tops); s.bottom = pick(r, bots.length ? bots : ['jeans']);
  if (s.hair === 'hijab') { if (s.top === 'tank' || s.top === 'tee' || s.top === 'graphic') s.top = 'long'; if (s.bottom === 'shorts' || s.bottom === 'skirt') s.bottom = 'longskirt'; }
  const muted = ['#2f3f72', '#4a4a58', '#33303f', '#7a5238', '#8a3848', '#5a6478', '#c8ad7a', '#4a7a58', '#ead9b8'];
  const formal = s.top === 'suit' || s.top === 'coat' || style === 'business';
  s.topColor = formal ? pick(r, muted) : style === 'hipster' ? pick(r, ['#b8862e', '#8a3848', '#4a7a58', '#e8b83a', '#f4f0e8', '#d9483b', '#5a6478', '#7a5238', '#2f9a94', '#ead9b8']) : style === 'street' ? pick(r, ['#33303f', '#f4f0e8', '#d9483b', '#e8b83a', '#3b6fd0', '#7a55c8', '#4fa860', '#f09a3a', '#9aa0a8']) : pick(r, CLOTH_COLORS);
  s.bottomColor = s.top === 'suit' ? dk(s.topColor, .08) : s.bottom === 'overalls' ? pick(r, ['#4a6fa8', '#7fa0c8', '#34507f', '#c8ad7a', '#6f7a48']) : s.bottom === 'leggings' ? pick(r, ['#33303f', '#33303f', '#4a4a58', '#2f3f72', '#8a3848', '#7a55c8', '#2f9a94']) : s.bottom === 'cargo' ? pick(r, ['#6f7a48', '#c8ad7a', '#4a4a58', '#33303f', '#7a5238']) : (s.bottom === 'skirt' || s.bottom === 'longskirt' || s.bottom === 'shorts' || s.bottom === 'sweats') && r() < .5 ? pick(r, CLOTH_COLORS) : pick(r, PANTS_COLORS);
  if (s.bottomColor === s.topColor) s.bottomColor = pick(r, PANTS_COLORS.slice(0, 3));
  s.shoes = season === 3 && style !== 'street' && style !== 'athleisure' ? pick(r, ['#6a4428', '#2f2c3a', '#c8a070']) : pick(r, S.shoes);
  s.glasses = r() < (elder ? .45 : style === 'hipster' ? .4 : .14) ? true : (season === 1 && !kid && r() < .1 ? 'sun' : false);
  s.accent = pick(r, ['#e8546a', '#f0c040', '#5ab0e0', '#9ac84a', '#f4f0e8', '#f08a20', '#7a55c8']);
  // hats
  if (!s.hat && s.hair !== 'hijab') {
    s.hat = null; const hr = r(); let acc = 0;
    for (const h of S.hats) { acc += h[1] * (h[0] === 'beanie' && season === 1 ? .2 : 1); if (hr < acc) { s.hat = h[0]; break; } }
    if (!s.hat) { const h2 = r(); if (season === 3 && h2 < .4) s.hat = 'beanie'; else if (season === 1 && h2 < (fem ? .14 : .05)) s.hat = 'sunhat'; else if (elder && h2 < .14) s.hat = 'flatcap'; }
    if (d === 'railyard' && style === 'workwear' && r() < .3) s.hat = 'hardhat';
    if (s.hat) s.hatColor = s.hat === 'sunhat' ? '#ecd690' : s.hat === 'hardhat' ? pick(r, ['#f2c230', '#f4f0e8', '#f08a20']) : s.hat === 'headband' ? s.accent : pick(r, CLOTH_COLORS);
  }
  if (season === 3 && r() < .55) s.scarf = pick(r, ['#d9483b', '#e8b83a', '#f4f0e8', '#4fa860', '#5ab0e0', '#7a55c8']);
  // bags
  const br = r(), bc = kid ? .4 : style === 'business' ? .6 : d === 'airport' ? .7 : .34;
  s.bag = br < bc ? (kid ? 'backpack' : pick(r, S.bags)) : null;
  s.bagColor = s.bag === 'briefcase' ? pick(r, ['#7a5238', '#33303f', '#6a4428']) : pick(r, BAG_COLORS);
  // occasional uniforms seen around town
  if (opts.outfit) s.outfit = opts.outfit;
  else if (!kid) {
    const o = r();
    if (season === 3 && o < .25) s.outfit = 'winter';
    else if (d === 'railyard' && o < .25) s.outfit = 'dockworker';
    else if (d === 'harborside' && o < .1) s.outfit = 'dockworker';
    else if (style === 'business' && s.top === 'suit' && o < .6) s.outfit = 'office';
    else if (style === 'athleisure' && season !== 3 && (d === 'park' || o < .2)) s.outfit = 'gymwear';
    else if (d === 'airport' && o < .06) s.outfit = 'pilot';
  }
  return s;
}

/* ---------- presets ---------- */
export const PLAYER_PRESETS = [
  { name: 'Robin', skin: SKINS[2], hair: 'sidepart', hairColor: '#4a3022', top: 'hoodie', topColor: '#d9483b', bottom: 'jeans', bottomColor: '#4a6fa8', shoes: '#f0ece4', hat: null, glasses: false, bag: 'backpack', bagColor: '#3b6fd0', build: 'avg', height: 'avg', age: 'adult' },
  { name: 'Maya', skin: SKINS[4], hair: 'wavy', hairColor: '#2b2433', top: 'jacket', topColor: '#e8b83a', bottom: 'skirt', bottomColor: '#33303f', shoes: '#2f2c3a', hat: null, glasses: false, bag: 'tote', bagColor: '#ead9b8', build: 'slim', height: 'avg', age: 'adult' },
  { name: 'Theo', skin: SKINS[7], hair: 'locs', hairColor: '#2b2433', top: 'varsity', topColor: '#2f9a94', bottom: 'cargo', bottomColor: '#c8ad7a', shoes: '#f0ece4', hat: null, glasses: true, bag: null, bagColor: '#7a5238', build: 'avg', height: 'tall', age: 'adult' },
  { name: 'Juno', skin: SKINS[0], hair: 'bob', hairColor: '#f07aa8', top: 'sweater', topColor: '#7a55c8', bottom: 'leggings', bottomColor: '#33303f', shoes: '#d04a3a', hat: 'beret', hatColor: '#33303f', glasses: false, bag: 'messenger', bagColor: '#7a5238', build: 'slim', height: 'short', age: 'adult' },
  { name: 'Sam', skin: SKINS[0], hair: 'curly', hairColor: '#a8452a', top: 'flannel', topColor: '#4fa860', bottom: 'jeans', bottomColor: '#34507f', shoes: '#6a4428', hat: null, glasses: false, beard: true, bag: null, bagColor: '#7a5238', build: 'broad', height: 'avg', age: 'adult' },
  { name: 'Aiko', skin: SKINS[1], hair: 'bun', hairColor: '#2b2433', top: 'dress', topColor: '#f07a5a', bottom: 'skirt', bottomColor: '#f07a5a', shoes: '#f0ece4', hat: 'sunhat', glasses: false, bag: 'tote', bagColor: '#4fa860', build: 'avg', height: 'avg', age: 'adult' },
  { name: 'Dev', skin: SKINS[5], hair: 'hightop', hairColor: '#2b2433', top: 'suit', topColor: '#2f3f72', bottom: 'slacks', bottomColor: '#2b3a68', shoes: '#2f2c3a', hat: null, glasses: true, bag: 'briefcase', bagColor: '#6a4428', build: 'avg', height: 'tall', age: 'adult' },
  { name: 'Noor', skin: SKINS[3], hair: 'hijab', hairColor: '#3fb8a8', top: 'cardigan', topColor: '#ead9b8', bottom: 'longskirt', bottomColor: '#34507f', shoes: '#c8a070', hat: null, glasses: false, bag: 'backpack', bagColor: '#f08ab0', build: 'avg', height: 'avg', age: 'adult' },
];

/* ---------- gallery ---------- */
const G = (id, spec, pose) => ({ id, sb: CHAR_SB, draw: () => drawChar(spec, pose) });
const P0 = PLAYER_PRESETS[0], P1 = PLAYER_PRESETS[1];
export const galleryItems = [];
{
  const g = galleryItems, pad = n => (n < 10 ? '0' : '') + n, DISTS = ['downtown', 'oldtown', 'harborside', 'hillcrest', 'maplewood', 'arts', 'railyard', 'park'];
  for (let i = 0; i < 32; i++) g.push(G('char.cit.' + pad(i), randomSpec(rng(100 + i * 7), { season: i < 16 ? 1 : i < 24 ? 2 : 0, district: DISTS[i % 8] }), { anim: i % 5 === 2 ? 'walk' : 'stand', frame: 0, dir: i % 4 === 3 ? 3 : i % 2 }));
  STYLES.forEach((st, i) => { for (let j = 0; j < 3; j++) g.push(G('char.sty.' + st + j, randomSpec(rng(7 + i * 31 + j * 17), { style: st, season: j, age: 'adult' }), { dir: j % 2 })); });
  for (let i = 0; i < 8; i++) g.push(G('char.win.' + i, randomSpec(rng(900 + i * 13), { season: 3 }), { anim: 'stand', dir: i === 7 ? 2 : i % 2 }));
  PLAYER_PRESETS.forEach((s, i) => { g.push(G('char.pre.' + i, s, { dir: 0 })); g.push(G('char.pre.' + i + 'b', s, { dir: 3 })); });
  OUTFITS.forEach((o, i) => { const s = Object.assign(randomSpec(rng(40 + i * 5), {}), { outfit: o }); g.push(G('char.out.' + o, s, { dir: i % 2 })); g.push(G('char.outb.' + o, s, { dir: 2 + (i % 2) })); });
  for (let d = 0; d < 4; d++) { g.push(G('char.dir.' + d, P0, { dir: d })); g.push(G('char.dir.m' + d, P1, { dir: d })); }
  HAIRS.forEach((h, i) => { const s = Object.assign({}, P0, { hair: h, bag: null, hairColor: HAIR_COLORS[(i * 3 + 1) % 9], skin: SKINS[(i * 3) % 8], top: 'tee', topColor: '#f4f0e8' }); g.push(G('char.hair.' + h, s, { dir: 0 })); g.push(G('char.hairb.' + h, s, { dir: 3 })); });
  TOPS.forEach((t, i) => g.push(G('char.top.' + t, Object.assign({}, P0, { top: t, bag: null, topColor: CLOTH_COLORS[(i * 4) % 13] }), { dir: i % 2 })));
  BOTTOMS.forEach((t, i) => { const s = Object.assign({}, P1, { bottom: t, bag: null, top: 'tee', bottomColor: PANTS_COLORS[i] }); g.push(G('char.bot.' + t, s, { dir: 0 })); g.push(G('char.botb.' + t, s, { dir: 3 })); });
  SKINS.forEach((c, i) => g.push(G('char.skin.' + i, Object.assign({}, P0, { skin: c, bag: null, hair: ['short', 'bob', 'curly', 'wavy', 'braids', 'cornrows', 'afro', 'locs', 'hightop'][i], hairColor: i < 2 ? '#8f5a30' : '#2b2433', top: 'tee', topColor: CLOTH_COLORS[i * 2] }), { dir: i % 2, mood: 'happy' })));
  HATS.forEach((t, i) => { if (!t) return; const s = Object.assign({}, i % 2 ? P1 : P0, { hat: t, bag: null, hatColor: t === 'sunhat' || t === 'hardhat' ? null : CLOTH_COLORS[i * 2] }); g.push(G('char.hat.' + t, s, { dir: 0 })); g.push(G('char.hatb.' + t, s, { dir: 3 })); });
  BAGS.forEach((t, i) => { if (!t) return; const s = Object.assign({}, P0, { bag: t, top: 'tee', bagColor: BAG_COLORS[i] }); g.push(G('char.bag.' + t, s, { dir: 0 })); g.push(G('char.bagb.' + t, s, { dir: 3 })); });
  for (const a of AGES) for (const b of BUILDS) g.push(G('char.body.' + a + '.' + b, Object.assign({}, P0, { age: a, build: b, bag: null, height: b === 'slim' ? 'short' : b === 'broad' ? 'tall' : 'avg', hairColor: a === 'elder' ? '#c8c8d0' : P0.hairColor }), { dir: 0 }));
  for (const a of Object.keys(ANIMS)) for (let f = 0; f < ANIMS[a]; f++) g.push(G('char.' + a + '.f' + f, a === 'lift' || a === 'treadmill' ? Object.assign({}, P0, { outfit: 'gymwear', bag: null }) : a === 'sleep' ? Object.assign({}, P0, { outfit: 'pajamas' }) : P0, { anim: a, frame: f, dir: 0 }));
  for (const a of ['walk', 'run', 'sit', 'sleep', 'carry', 'wave', 'type']) for (let f = 0; f < Math.min(ANIMS[a], 6); f++) g.push(G('char.' + a + '.b' + f, P1, { anim: a, frame: f, dir: 3 }));
  for (let f = 0; f < 6; f++) g.push(G('char.walk.m' + f, P1, { anim: 'walk', frame: f, dir: 1 }));
  g.push(G('char.sit.eat', P1, { anim: 'eat', frame: 1, dir: 0, seated: true })); g.push(G('char.sit.read', P0, { anim: 'read', dir: 1, seated: true })); g.push(G('char.sit.phone', P1, { anim: 'phone', dir: 0, seated: true }));
  g.push(G('char.sleep.blanket', P0, { anim: 'sleep', dir: 0, blanket: '#5a8ad0' })); g.push(G('char.sleep.blanket1', P1, { anim: 'sleep', dir: 1, frame: 1, blanket: '#e88a9a' })); g.push(G('char.sleep.b.blanket', P1, { anim: 'sleep', dir: 3, blanket: '#e8c85a' }));
  g.push(G('char.carry.bag', P0, { anim: 'carry', frame: 0, dir: 0, item: 'bag' })); g.push(G('char.carry.tray', Object.assign({}, P1, { outfit: 'barista' }), { anim: 'carry', frame: 3, dir: 1, item: 'tray' }));
  g.push(G('char.kid.walk', Object.assign({}, P1, { age: 'kid', hair: 'pigtails', bag: 'backpack' }), { anim: 'walk', frame: 0, dir: 0 })); g.push(G('char.kid.sit', Object.assign({}, P0, { age: 'kid' }), { anim: 'sit', dir: 1 })); g.push(G('char.elder.walk', Object.assign({}, P0, { age: 'elder', hair: 'balding', hairColor: '#e8e8ee', glasses: true, top: 'cardigan' }), { anim: 'walk', frame: 0, dir: 0 }));
}
