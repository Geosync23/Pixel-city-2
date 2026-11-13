// Character sprite system: the player and every NPC.
//   drawChar(spec, pose)   spec = appearance, pose = { anim, frame, dir, seated?, item?, itemColor?, blanket?, seatH? }
// Characters are hand-placed pixels drawn relative to the feet anchor PW(0,0,0), in a canonical "facing screen-right"
// space (front view = facing right-down, back view = facing right-up) and mirrored for the other two directions.
// Layers (front view): shadow, bag-behind, legs, skirt/coat tail, torso, arms, head, hair, hat, bag, props.
import { PW, dk, lt, mix, rng } from '../../engine/raster.js';
import { gclear, p, r, pts, glit, flush, shadow, get } from './_grid.js';

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
export const SKINS = ['#ffe0c4', '#f7cfa8', '#eab98f', '#d9a074', '#c08457', '#a56a43', '#84502f', '#5f3a22'];
export const HAIR_COLORS = ['#2b2433', '#4a3022', '#6e4428', '#8f5a30', '#a8452a', '#d9722e', '#e6c36a', '#f0e4b8', '#a9a9b4', '#e8e8ee', '#f07aa8', '#4f8fd8', '#3fb8a8', '#8a5cd0'];
export const CLOTH_COLORS = ['#d9483b', '#f07a5a', '#f09a3a', '#e8b83a', '#9ac84a', '#4fa860', '#2f9a94', '#5ab0e0', '#3b6fd0', '#2f3f72', '#7a55c8', '#f08ab0', '#b83a6a', '#f4f0e8', '#ead9b8', '#9aa0a8', '#4a4a58', '#33303f', '#7a5238'];
export const PANTS_COLORS = ['#4a6fa8', '#34507f', '#7fa0c8', '#33303f', '#4a4a58', '#c8ad7a', '#6f7a48', '#7a5238', '#8a8f98', '#e8e2d4', '#8a3848'];
export const SHOE_COLORS = ['#f0ece4', '#2f2c3a', '#6a4428', '#d04a3a', '#c8a070', '#3b6fd0'];
export const BAG_COLORS = ['#7a5238', '#d9483b', '#3b6fd0', '#4fa860', '#e8b83a', '#33303f', '#ead9b8', '#7a55c8'];
export const HAIRS = ['short', 'buzz', 'sidepart', 'bob', 'long', 'ponytail', 'bun', 'afro', 'curly', 'mohawk', 'bald', 'braids', 'spiky', 'pigtails', 'balding', 'hijab'];
export const TOPS = ['tee', 'stripe', 'polo', 'long', 'tank', 'hoodie', 'jacket', 'suit', 'sweater', 'cardigan', 'flannel', 'dress', 'coat', 'puffer'];
export const BOTTOMS = ['jeans', 'slacks', 'shorts', 'skirt', 'longskirt', 'leggings', 'sweats'];
export const HATS = [null, 'cap', 'beanie', 'sunhat', 'hardhat', 'beret', 'flatcap', 'headband'];
export const BAGS = [null, 'backpack', 'tote', 'briefcase', 'grocery', 'messenger'];
export const BUILDS = ['slim', 'avg', 'broad'];
export const HEIGHTS = ['short', 'avg', 'tall'];
export const AGES = ['kid', 'adult', 'elder'];
export const OUTFITS = ['barista', 'grocer', 'cook', 'office', 'courier', 'trainer', 'librarian', 'nurse', 'dockworker', 'bartender',
  'busdriver', 'taxidriver', 'police', 'pilot', 'chef', 'gymwear', 'pajamas', 'swim', 'winter'];
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
    f: [6, ['...hHHhh...', '..hhhhhhh..', '.chhhh.hhc.', 'hhhh....hhh', 'hh.s.....hh', '.d.......d.']],
    b: [6, ['...hhHhh...', '..hhhHhhh..', '.chhhhhhhc.', 'hhhhhhhh.hh', 'hhdhhhh..hh', '.d.ddd...d.']],
  },
  balding: { f: [5, ['..h.l......', '..hh.......', '..hh.......', '..hs.......']], b: [5, ['..h..l..h..', '..hhhhhhh..', '..hhhhhh...', '..dhhhhs...']] },
  hijab: {
    f: [7, ['....hhh....', '...hHHhhh..', '..hhHhhhh..', '..hhh...h..', '..hh....h..', '..hh....h..', '..hhh..hh..', '..hhhhhhh..', '.hhhhhhhh..', '..dhhhhd...']],
    b: [7, ['....hhh....', '...hhHhhh..', '..hhhHhhh..', '..hhhhhhh..', '..hhhhhhh..', '..hhhhhhh..', '..hhhhhhh..', '..hhhhhhh..', '.hhhhhhhh..', '..dhhhhd...']],
  },
};

/* ---------- spec -> resolved look ---------- */
const SUITS = ['#2f3f72', '#4a4a58', '#33303f', '#5a6478', '#6a4a3a'];
const hsh = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const skirty = s => s.top === 'dress' || s.bottom === 'skirt' || s.bottom === 'longskirt';
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
const SHORT_SLEEVE = { tee: 1, stripe: 1, polo: 1, dress: 1, flannel: 0 }, NO_SLEEVE = { tank: 1, none: 1, swimsuit: 1 };
function look(spec) {
  const s = Object.assign({}, DEF, spec);
  const k = {
    skin: s.skin, hair: HAIR[s.hair] ? s.hair : 'short', hairC: s.hairColor, top: s.top, topC: s.topColor, inner: s.innerColor || WHITE,
    bottom: s.bottom, botC: s.bottomColor, shoeC: s.shoes, hat: s.hat, hatC: s.hatColor, hatBand: null, bag: s.bag, bagC: s.bagColor,
    glasses: s.glasses, beard: s.beard, scarf: s.scarf, accent: s.accent || '#e8546a',
    apron: null, vest: null, hivis: false, tie: null, bow: null, badge: null, belt: null, epaul: null, buttons: false, pjStripe: false,
    kid: s.age === 'kid', elder: s.age === 'elder',
  };
  if (s.outfit && OUTFIT_DEF[s.outfit]) OUTFIT_DEF[s.outfit](k, s);
  if (!k.hatC) k.hatC = k.hat === 'sunhat' ? '#ecd690' : k.hat === 'hardhat' ? '#f2c230' : k.hat === 'headband' ? k.accent : mix(k.topC, k.botC, .5);
  if (k.top === 'dress') { k.skirtC = k.topC; k.skirtLen = 4; k.bottom = 'bare'; }
  else if (k.bottom === 'skirt') { k.skirtC = k.botC; k.skirtLen = 3; }
  else if (k.bottom === 'longskirt') { k.skirtC = k.botC; k.skirtLen = 99; }
  // metrics
  const kid = k.kid, hi = s.height === 'short' ? -1 : s.height === 'tall' ? 1 : 0;
  k.L = (kid ? 4 : 6) + hi; k.T = kid ? 4 : 6; k.arm = kid ? 3 : 4;
  const b = kid ? (s.build === 'broad' ? 'avg' : 'slim') : s.build;
  k.x0 = b === 'broad' ? -3 : -2; k.x1 = b === 'slim' ? 1 : b === 'broad' ? 3 : 2;
  k.ax = [k.x0 - 1, k.x1 + 1];
  if (k.skirtLen) k.skirtLen = Math.min(k.skirtLen, k.L - 1, kid && k.skirtLen < 9 ? 2 : 99);
  k.sleeve = NO_SLEEVE[k.top] ? 0 : SHORT_SLEEVE[k.top] ? (kid ? 1 : 2) : 9;
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
}
function poseOf(anim, f, front, pose) {
  const fy = front ? 1 : -1;
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
    case 'talk': P.arms = [HANG, f === 0 ? HANG : f === 1 ? [1, 2, 2, 1] : [1, 1, 2, 0]]; P.mouth = f === 1 ? 1 : 0; break;
    case 'wave': P.arms = [HANG, [[1, -1, 2, -4], [1, -1, 3, -4], [1, -1, 2, -4], [1, -1, 1, -5]][f]]; P.mouth = 1; break;
    case 'type': P.seated = pose.seated !== false; P.arms = f ? [[2, 2, 5, 3], [1, 2, 3, 2]] : [[2, 2, 5, 2], [1, 2, 3, 3]]; P.hold = false; break;
    case 'work': P.arms = [[[2, 2, 4, 2], [1, 2, 3, 3]], [[2, 2, 4, 3], [1, 2, 3, 2]], [[2, 2, 3, 2], [1, 2, 3, 3]], [[2, 2, 4, 3], [1, 2, 4, 2]]][f]; P.eyes = 3; P.hold = false; break;
    case 'lift': P.arms = f === 0 ? [HANG, HANG] : f === 2 ? [UPA, UPB] : [[-1, 2, -1, 0], [1, 2, 1, 0]]; P.prop = 'dumb'; P.bob = f === 0 ? 1 : 0; P.eyes = f === 2 ? 2 : 1; P.hold = false; break;
    case 'dance':
      P.arms = [[UPA, [1, 1, 3, 1]], [[-1, 2, -2, 1], [1, 2, 2, 1]], [[-1, 1, -3, 1], UPB], [[-1, 2, -2, 1], [1, 2, 2, 1]]][f];
      P.bob = f & 1; P.hdx = f === 0 ? -1 : f === 2 ? 1 : 0; P.legs = f === 0 ? [[-1, 0, 0], [0, 0, 1]] : f === 2 ? [[0, 0, 1], [1, 0, 0]] : P.legs; P.mouth = f === 0 || f === 2 ? 1 : 0; P.hold = false; break;
    case 'read': P.arms = [[2, 2, 4, 2], [0, 2, 1, f ? 1 : 2]]; P.prop = 'book'; P.eyes = 3; P.hold = false; break;
    case 'cheer': P.arms = f ? [[-2, -2, -2, -6], [2, -2, 2, -6]] : [UPA, UPB]; P.jump = f ? 2 : 0; P.mouth = 1; P.eyes = f ? 2 : 1; P.hold = false; break;
  }
  P.seatH = pose.seatH || 0;
  return P;
}

/* ---------- layers ---------- */
function legColor(k, i, n) {
  const b = k.bottom, c = k.botC;
  if (b === 'bare' || b === 'skirt') return k.skin;
  if (b === 'shorts') return i < (k.kid ? 1 : 2) ? c : k.skin;
  if (b === 'leggings') return i === n - 1 && n > 2 ? k.skin : c;
  if (b === 'jeans') return i === n - 1 && n > 2 ? lt(c, .3) : c;
  if (b === 'sweats') return i === n - 1 && n > 2 ? dk(c, .2) : (k.pjStripe && (i & 1) ? lt(c, .35) : c);
  return c;
}
function standLegs(k, P, front, hipY) {
  for (const near of [false, true]) {
    const idx = (near === front) ? 0 : 1, lg = P.legs[idx], rx = idx ? 1 : -2;
    const fy = (near ? -1 : -2) - P.jump + lg[1] - lg[2], n = Math.max(1, fy - hipY), shoe = k.shoeC || dk(k.skin, .08);
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 1; let x = rx + Math.round(lg[0] * t);
      if (lg[2] >= 2) x += Math.round(Math.sin(Math.PI * t) * 1.2);
      let c = legColor(k, i, n); if (!near) c = dk(c, .16);
      p(x, hipY + i, c); p(x + 1, hipY + i, c);
    }
    const x = rx + lg[0], sc = near ? shoe : dk(shoe, .16);
    p(x, fy, sc); p(x + 1, fy, sc); if (k.shoeC || !k.kid) p(x + 2, fy, k.shoeC ? sc : dk(sc, .1));
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
    for (let y = ky + (front ? 2 : 1); y < foot; y++) { const c = sd(y === foot - 1 ? cuffC : shinC); p(kx - 1, y, c); p(kx, y, c); }
    p(kx - 1, foot, sd(shoe)); p(kx, foot, sd(shoe)); p(kx + 1, foot, sd(shoe));
  }
}
function skirt(k, hipY) {
  const n = Math.min(k.skirtLen, k.L - 1), c = k.skirtC;
  for (let j = 0; j < n; j++) {
    const w = j > 0 ? 1 : 0;
    for (let x = k.x0 - w; x <= Math.max(2, k.x1) + w; x++) p(x, hipY + j, x === k.x0 - w ? dk(c, .16) : j === n - 1 ? dk(c, .1) : (n > 4 && j > 0 && x === 0) ? dk(c, .1) : c);
  }
}
function torso(k, P, front, yS, hipY) {
  const T = k.T, x0 = k.x0, x1 = k.x1, body = k.vest || k.topC, top = k.top, sk = k.skin;
  const bare = top === 'none', xo = j => (P.lean && j < T / 2 ? P.lean : 0);
  const t = (x, j, c) => p(x + xo(j), yS + j, c);
  if (top === 'coat' && !P.seated) for (let j = 0; j < 3 && j < k.L - 2; j++) for (let x = x0; x <= x1; x++) p(x, hipY + j, x === x0 ? dk(body, .2) : front && x === 1 ? dk(body, .25) : dk(body, .06));
  for (let j = 0; j < T; j++) for (let x = x0; x <= x1; x++) {
    let c = bare ? sk : body;
    if (!bare && !k.vest) {
      if ((top === 'stripe' || top === 'pj') && (j & 1)) c = top === 'pj' ? lt(c, .4) : mix(c, WHITE, .75);
      else if (top === 'flannel' && ((x + j) & 1)) c = dk(c, .3);
      else if (top === 'puffer' && (j & 1)) c = dk(c, .12);
    }
    if (x === x0) c = dk(c, .14); else if (j === T - 1 && top !== 'dress' && top !== 'coat') c = dk(c, .08);
    t(x, j, c);
  }
  if (top === 'swimsuit') { for (let x = x0; x <= x1; x++) p(x, hipY, x === x0 ? dk(body, .14) : body); }
  if (front) {
    const cx = 1;
    if (k.vest) { for (let j = 0; j < T; j++) t(cx, j, k.topC); t(cx, 0, sk); if (top === 'polo') { t(0, 0, k.topC); t(2, 0, k.topC); } }
    else if (top === 'tee' || top === 'stripe' || top === 'long' || top === 'pj' || top === 'flannel') t(cx, 0, sk);
    else if (top === 'polo') { t(0, 0, lt(body, .4)); t(2, 0, lt(body, .4)); t(1, 0, sk); t(1, 1, lt(body, .4)); }
    else if (top === 'tank' || top === 'swimsuit') { t(x0, 0, sk); t(x1, 0, sk); t(0, 0, sk); if (x1 > 1) t(1, 0, sk); }
    else if (top === 'hoodie') { t(0, 1, WHITE); t(2, 1, WHITE); t(1, 0, dk(body, .25)); for (let x = 0; x <= Math.min(2, x1); x++) t(x, T - 2, dk(body, .2)); }
    else if (top === 'jacket' || top === 'cardigan') { for (let j = 0; j < T; j++) t(cx, j, j === T - 1 ? dk(k.inner, .1) : k.inner); t(0, 0, lt(body, .25)); if (x1 > 1) t(2, 0, lt(body, .25)); if (top === 'cardigan') t(cx, 0, sk); }
    else if (top === 'suit') { t(0, 0, k.inner); if (x1 > 1) t(2, 0, k.inner); t(1, 0, k.inner); t(1, 1, k.inner); t(1, 2, k.inner); t(1, T - 2, dk(body, .3)); }
    else if (top === 'sweater') { for (let x = 0; x <= Math.min(2, x1); x++) t(x, 0, lt(body, .3)); for (let x = x0; x <= x1; x++) t(x, T - 1, dk(body, .22)); }
    else if (top === 'coat') { t(0, 0, lt(body, .22)); if (x1 > 1) t(2, 0, lt(body, .22)); for (let j = 1; j < T; j++) t(cx, j, dk(body, .25)); }
    else if (top === 'puffer') { for (let x = x0; x <= x1; x++) t(x, 0, lt(body, .2)); for (let j = 1; j < T; j++) t(cx, j, dk(body, .3)); }
    else if (top === 'dress') { t(0, 0, sk); t(1, 0, sk); for (let x = x0; x <= x1; x++) t(x, T - 2, dk(body, .2)); }
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
    if (k.hivis) { for (let x = x0; x <= x1; x++) t(x, 3, '#f8f0a0'); t(-1, 1, '#f8f0a0'); t(-1, 2, '#f8f0a0'); t(1, 1, '#f8f0a0'); t(1, 2, '#f8f0a0'); }
    if (k.apron) { t(0, 0, dk(k.apron, .25)); for (let x = x0; x <= x1; x++) t(x, T - 2, dk(k.apron, .1)); t(0, T - 1, k.apron); t(-1, T - 1, k.apron); }
    if (k.belt) for (let x = x0; x <= x1; x++) t(x, T - 1, k.belt);
  }
}
/** draw one arm; returns the hand position */
function arm(k, P, i, a, yS) {
  const sx = k.ax[i] + (P.lean || 0), sc = k.kid ? .75 : 1;
  const ex = sx + Math.round(a[0] * sc), ey = yS + Math.round(a[1] * sc), hx = sx + Math.round(a[2] * sc), hy = yS + Math.round(a[3] * sc);
  const path = pts(sx, yS, ex, ey).concat(pts(ex, ey, hx, hy).slice(1));
  const base = (k.top === 'none' || k.top === 'tank' || k.top === 'swimsuit') ? k.skin : k.topC, sl = i ? dk(base, .15) : lt(base, .12), skn = i ? dk(k.skin, .1) : k.skin;
  const n = path.length;
  for (let j = 0; j < n; j++) {
    let c = j === n - 1 ? skn : j < k.sleeve ? sl : skn;
    if (j < k.sleeve && j < n - 1) {
      if ((k.top === 'stripe' || k.top === 'pj') && (j & 1)) c = mix(sl, WHITE, k.top === 'pj' ? .4 : .7);
      if (k.top === 'flannel' && (j & 1)) c = dk(sl, .3);
      if (k.top === 'sweater' && j === n - 2) c = dk(sl, .22);
      if (k.epaul && j === n - 2) c = k.epaul;
    }
    if (j === 0 && k.epaul) c = k.epaul;
    p(path[j][0], path[j][1], c);
  }
  return [hx, hy];
}
function hairTpl(k, cx, yb, front, hat) {
  const tp = HAIR[k.hair][front ? 'f' : 'b'], top = tp[0], rows = tp[1], h = k.hairC;
  const map = { h, H: lt(h, .22), d: dk(h, .25), t: mix(k.skin, h, .4), s: k.skin, l: lt(k.skin, .35), c: k.accent };
  const cut = hat && hat !== 'headband' && hat !== 'beret' && k.hair !== 'hijab';
  for (let i = 0; i < rows.length; i++) {
    const rr = top - i; if (cut && rr >= 6) continue; const s = rows[i];
    for (let j = 0; j < 11; j++) { const c = map[s[j]]; if (!c) continue; if (cut && rr === 5 && (j < 2 || j > 8)) continue; p(cx + j - 5, yb - rr, c); }
  }
}
function hatDraw(k, cx, yb, front) {
  const h = k.hat, c = k.hatC, R = (x0, x1, rr, col) => { for (let x = x0; x <= x1; x++) p(cx + x, yb - rr, col); };
  const bf = front ? 5 : 4; // how far the brim reaches forward
  if (h === 'cap') { R(-2, 2, 7, c); R(-3, 3, 6, c); R(-3, 3, 5, dk(c, .15)); R(4, bf, 5, dk(c, .3)); p(cx - 1, yb - 7, lt(c, .3)); if (front) p(cx + 2, yb - 6, lt(c, .45)); }
  else if (h === 'beanie') { R(-2, 2, 7, c); R(-3, 3, 6, c); R(-3, 3, 5, lt(c, .3)); p(cx - 1, yb - 8, WHITE); p(cx, yb - 8, WHITE); p(cx - 2, yb - 6, dk(c, .15)); p(cx, yb - 6, dk(c, .15)); p(cx + 2, yb - 6, dk(c, .15)); }
  else if (h === 'sunhat') { R(-2, 2, 7, c); R(-3, 3, 6, k.hatBand || k.accent); R(-5, 5, 5, c); R(-5, -3, 5, dk(c, .15)); p(cx - 1, yb - 7, lt(c, .4)); }
  else if (h === 'hardhat') { R(-2, 2, 7, c); R(-3, 3, 6, c); R(-3, bf - 1, 5, dk(c, .18)); p(cx - 1, yb - 7, lt(c, .5)); p(cx, yb - 7, lt(c, .5)); p(cx, yb - 8, c); p(cx - 1, yb - 8, c); p(cx + 1, yb - 8, c); }
  else if (h === 'beret') { R(-3, 1, 7, c); R(-4, 3, 6, c); p(cx - 1, yb - 8, dk(c, .3)); p(cx - 2, yb - 7, lt(c, .25)); R(-4, -3, 6, dk(c, .15)); }
  else if (h === 'flatcap') { R(-3, 1, 7, c); R(-3, 4, 6, c); R(3, bf, 5, dk(c, .3)); R(-3, -2, 6, dk(c, .15)); p(cx - 1, yb - 7, lt(c, .2)); }
  else if (h === 'headband') { R(-3, 3, 5, c); if (!front) p(cx - 4, yb - 4, c); }
  else if (h === 'peaked') { const b = k.hatBand || dk(c, .35); R(-2, 2, 8, c); R(-3, 3, 7, c); R(-3, 3, 6, b); R(3, bf, 5, '#22202c'); if (front) p(cx + 2, yb - 7, GOLD); p(cx - 1, yb - 8, lt(c, .25)); }
  else if (h === 'cookcap') { R(-2, 2, 7, c); R(-3, 3, 6, c); R(-3, 3, 5, dk(c, .12)); }
  else if (h === 'toque') { R(-3, 3, 5, dk(c, .14)); R(-3, 3, 6, c); R(-3, 3, 7, c); R(-4, 4, 8, c); R(-4, 4, 9, c); R(-3, 3, 10, c); p(cx - 1, yb - 7, dk(c, .12)); p(cx + 1, yb - 7, dk(c, .12)); p(cx - 4, yb - 8, dk(c, .12)); p(cx - 2, yb - 9, lt(c, .5)); }
}
function head(k, cx, yb, front, P) {
  const sk = k.skin;
  for (let rr = 0; rr < 7; rr++) { const hw = (rr === 0 || rr === 6) ? 2 : 3; for (let x = -hw; x <= hw; x++) p(cx + x, yb - rr, rr === 0 ? dk(sk, .1) : (x === -3 ? dk(sk, .06) : sk)); }
  if (front) {
    const bl = mix(sk, '#f0506a', .3), ey = P.eyes;
    p(cx + 3, yb - 1, bl); if (k.kid) p(cx - 1, yb - 1, bl);
    for (const x of [0, 2]) {
      if (ey === 1) { p(cx + x, yb - 3, EYE); p(cx + x, yb - 2, EYE); }
      else if (ey === 2) p(cx + x, yb - 2, dk(sk, .5));      // closed
      else p(cx + x, yb - 2, EYE);                           // looking down
    }
    if (P.mouth) p(cx + 1, yb - 1, '#8a3040');
    if (k.beard) { for (let x = -1; x <= 3; x++) p(cx + x, yb - 1, k.hairC); for (let x = -1; x <= 2; x++) p(cx + x, yb, dk(k.hairC, .15)); if (P.mouth) p(cx + 1, yb - 1, '#8a3040'); }
    if (k.elder && !k.beard && !P.mouth) p(cx + 1, yb - 1, dk(sk, .14));
    if (k.glasses === 'sun') { for (let x = -1; x <= 3; x++) p(cx + x, yb - 3, '#22202c'); p(cx, yb - 2, '#22202c'); p(cx + 2, yb - 2, '#22202c'); p(cx, yb - 3, '#4a4a68'); }
    else if (k.glasses) { const g = '#3a3448'; p(cx - 1, yb - 3, g); p(cx + 1, yb - 3, g); p(cx + 3, yb - 3, g); p(cx, yb - 3, '#dff4fa'); p(cx + 2, yb - 3, '#dff4fa'); p(cx, yb - 2, EYE); p(cx + 2, yb - 2, EYE); p(cx - 2, yb - 3, g); }
  } else if (k.glasses) p(cx + 3, yb - 3, '#3a3448');
  hairTpl(k, cx, yb, front, k.hat);
  if (k.hat) hatDraw(k, cx, yb, front);
}
function bagBack(k, front, yS, hands) { // drawn over the body
  const b = k.bag, c = k.bagC, T = k.T;
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
  }
}
function bagHand(k, P, hand) {
  if (!P.hold || P.seated) return; const b = k.bag, c = k.bagC, x = hand[0], y = hand[1];
  if (b === 'briefcase') { p(x, y + 1, dk(c, .4)); for (let j = 0; j < 3; j++) for (let i = -1; i <= 2; i++) p(x + i, y + 2 + j, j === 0 ? lt(c, .2) : c); p(x, y + 3, GOLD); p(x + 1, y + 3, GOLD); }
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
    torso(k, P, front, yS, hipY);
    if (seated) seatedLegs(k, P, front);
    if (k.top === 'hoodie') { p(k.x0 - 1 + hdx, yS - 1, dk(k.topC, .2)); p(k.x0 - 2 + hdx, yS, dk(k.topC, .2)); }
    hB = arm(k, P, 1, P.arms[1], yS); hA = arm(k, P, 0, P.arms[0], yS);
    head(k, hdx, yb, front, P);
    if (k.scarf) { for (let x = k.x0 - 1; x <= k.x1 + 1; x++) p(x + (P.lean || 0), yS, x < k.x0 + 1 ? dk(k.scarf, .15) : k.scarf); p(P.lean || 0, yS + 1, k.scarf); p(P.lean || 0, yS + 2, dk(k.scarf, .15)); }
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
    head(k, hdx, yb, front, P);
    bagBack(k, front, yS);
  }
}
const get0 = (k, i) => { if (k.epaul) return k.epaul; const base = (k.top === 'none' || k.top === 'tank' || k.top === 'swimsuit') ? k.skin : k.topC; return i ? dk(base, .15) : lt(base, .12); };

function lying(k, front, f, pose) {
  const s = front ? 1 : -1, yo = x => Math.round(x * .5 * s) - 3, T = k.T + 2, L = k.L + 1;
  const tx = -4, lx = tx + T, ex = lx + L, bare = k.top === 'none', body = bare ? k.skin : (k.vest || k.topC);
  for (let x = tx; x < lx; x++) {
    const y = yo(x), i = x - tx;
    let c = body; if (!bare && (k.top === 'stripe' || k.top === 'pj') && (i & 1)) c = lt(c, .4);
    for (let j = -2 - (f && i > 0 && i < T - 2 ? 1 : 0); j <= 1; j++) p(x, y + j, j === 1 ? dk(c, .14) : c);
    const armC = i < k.sleeve + 1 && !NO_SLEEVE[k.top] ? lt(k.topC, .12) : k.skin; if (i > 0 && i < 6) p(x, y + 2, armC);
  }
  for (let x = lx; x < ex; x++) {
    const y = yo(x), i = x - lx, n = L;
    let c = k.skirtLen && i < Math.min(k.skirtLen + 1, n) ? k.skirtC : legColor(k, Math.max(0, i - 1), n - 1);
    p(x, y - 2, dk(c, .16)); p(x, y - 1, dk(c, .16)); p(x, y, c); p(x, y + 1, c);
  }
  const shoe = k.shoeC || dk(k.skin, .08);
  for (let x = ex; x < ex + 2; x++) { const y = yo(x); for (let j = (x === ex ? -3 : -2); j <= 1; j++) p(x, y + j, j < -1 ? dk(shoe, .16) : shoe); }
  if (pose.blanket) {
    const b = pose.blanket;
    for (let x = tx + 3; x < ex + 2; x++) { const y = yo(x), i = x - tx - 3; for (let j = -3 - (f && i > 0 && i < 4 ? 1 : 0); j <= 2; j++) p(x, y + j, i === 0 ? lt(b, .45) : j === 2 ? dk(b, .2) : j === -3 ? lt(b, .15) : (i % 5 === 4 && j > -2) ? dk(b, .08) : b); }
  }
  const hx = tx - 4, hat = k.hat; k.hat = null;
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
/**
 * Plausible random citizen. r = rng() function. opts: { age, season (0-3), district, outfit }.
 * district: 'downtown'|'oldtown'|'harborside'|'hillcrest'|'maplewood'|'arts'|'railyard'|'park'|'airport'
 */
export function randomSpec(r, opts) {
  opts = opts || {}; const season = opts.season === undefined ? 1 : opts.season, d = opts.district || '';
  const age = opts.age || wpick(r, [['adult', d === 'downtown' || d === 'railyard' ? 90 : 74], ['elder', d === 'oldtown' ? 20 : 13], ['kid', d === 'maplewood' || d === 'park' ? 22 : d === 'downtown' || d === 'railyard' ? 3 : 12]]);
  const fem = r() < .5, kid = age === 'kid', elder = age === 'elder';
  const s = { age, skin: pick(r, SKINS), build: wpick(r, [['slim', 3], ['avg', 5], ['broad', kid ? 0 : 2]]), height: wpick(r, [['short', 2], ['avg', 5], ['tall', 2]]) };
  s.hairColor = elder && r() < .8 ? pick(r, ['#a9a9b4', '#e8e8ee', '#c8c8d0']) : (!kid && r() < (d === 'arts' ? .3 : .06)) ? pick(r, HAIR_COLORS.slice(10)) : wpick(r, [['#2b2433', 5], ['#4a3022', 5], ['#6e4428', 4], ['#8f5a30', 3], ['#a8452a', 1.5], ['#d9722e', 1], ['#e6c36a', 2.5], ['#f0e4b8', .7]]);
  s.hair = elder ? pick(r, fem ? ['bun', 'bob', 'curly', 'short', 'sidepart', 'hijab'] : ['short', 'balding', 'bald', 'sidepart', 'balding', 'buzz'])
    : kid ? pick(r, fem ? ['pigtails', 'bob', 'ponytail', 'braids', 'curly', 'afro', 'long'] : ['short', 'spiky', 'curly', 'buzz', 'sidepart', 'afro'])
      : pick(r, fem ? ['long', 'bob', 'ponytail', 'bun', 'braids', 'curly', 'afro', 'sidepart', 'long', 'hijab', 'pigtails', 'short'] : ['short', 'sidepart', 'buzz', 'curly', 'spiky', 'afro', 'bald', 'mohawk', 'short', 'sidepart', 'bun', 'ponytail']);
  s.beard = !fem && !kid && r() < (elder ? .3 : .16);
  // clothes by season
  const warm = [['tee', 5], ['stripe', 3], ['polo', 2], ['tank', 2], ['flannel', 1], ['long', 1]], mild = [['long', 3], ['hoodie', 4], ['jacket', 4], ['cardigan', 2], ['flannel', 3], ['sweater', 3], ['tee', 2], ['stripe', 2]], cold = [['coat', 5], ['puffer', 5], ['sweater', 2], ['hoodie', 2], ['jacket', 1]];
  let tops = season === 1 ? warm : season === 3 ? cold : season === 2 ? mild.concat([['coat', 2]]) : mild;
  if (fem && season !== 3) tops = tops.concat([['dress', season === 1 ? 5 : 2]]);
  if (d === 'downtown' && !kid) tops = tops.concat([['suit', 5]]); if (d === 'hillcrest' && !kid) tops = tops.concat([['suit', 2], ['polo', 2], ['cardigan', 2]]); if (d === 'railyard') tops = tops.concat([['flannel', 4], ['hoodie', 2]]); if (d === 'harborside') tops = tops.concat([['stripe', 4]]);
  s.top = wpick(r, tops);
  let bots = season === 1 ? [['shorts', 5], ['jeans', 3], ['slacks', 1]] : season === 3 ? [['jeans', 5], ['slacks', 3], ['sweats', 2]] : [['jeans', 6], ['slacks', 3], ['sweats', 1], ['shorts', season === 0 ? 1 : 0]];
  if (fem) bots = bots.concat(season === 3 ? [['leggings', 3], ['longskirt', 2]] : [['skirt', season === 1 ? 4 : 2], ['leggings', 2], ['longskirt', elder ? 4 : 1]]);
  if (elder) bots = bots.filter(b => b[0] !== 'shorts' || season === 1).concat([['slacks', 5]]);
  s.bottom = s.top === 'suit' ? (fem && r() < .4 ? 'skirt' : 'slacks') : wpick(r, bots);
  const suitish = s.top === 'suit' || s.top === 'coat';
  s.topColor = suitish ? pick(r, ['#2f3f72', '#4a4a58', '#33303f', '#7a5238', '#8a3848', '#5a6478', '#c8ad7a', '#4a7a58']) : pick(r, CLOTH_COLORS);
  s.bottomColor = s.top === 'suit' ? dk(s.topColor, .08) : (s.bottom === 'skirt' || s.bottom === 'longskirt' || s.bottom === 'shorts') && r() < .5 ? pick(r, CLOTH_COLORS) : pick(r, PANTS_COLORS);
  if (s.bottomColor === s.topColor) s.bottomColor = pick(r, PANTS_COLORS.slice(0, 3));
  s.shoes = s.top === 'suit' ? pick(r, ['#2f2c3a', '#6a4428']) : season === 3 ? pick(r, ['#6a4428', '#2f2c3a', '#c8a070']) : pick(r, SHOE_COLORS);
  s.glasses = r() < (elder ? .45 : .14) ? true : (season === 1 && !kid && r() < .08 ? 'sun' : false);
  s.accent = pick(r, ['#e8546a', '#f0c040', '#5ab0e0', '#9ac84a', '#f4f0e8', '#f08a20']);
  // hats
  s.hat = null;
  const hr = r();
  if (s.hair !== 'hijab') {
    if (season === 3) { if (hr < .5) s.hat = 'beanie'; else if (hr < .56) s.hat = 'flatcap'; }
    else if (season === 1) { if (hr < .14) s.hat = 'cap'; else if (hr < (fem ? .26 : .17)) s.hat = 'sunhat'; }
    else if (hr < .08) s.hat = 'cap'; else if (hr < .12) s.hat = 'beanie'; else if (hr < (d === 'arts' ? .26 : .14)) s.hat = 'beret'; else if (elder && hr < .24) s.hat = 'flatcap';
    if (d === 'railyard' && r() < .2) s.hat = 'hardhat';
  }
  if (s.hat) s.hatColor = s.hat === 'sunhat' ? '#ecd690' : s.hat === 'hardhat' ? pick(r, ['#f2c230', '#f4f0e8', '#f08a20']) : pick(r, CLOTH_COLORS);
  if (season === 3 && r() < .55) s.scarf = pick(r, ['#d9483b', '#e8b83a', '#f4f0e8', '#4fa860', '#5ab0e0', '#7a55c8']);
  // bags
  const br = r();
  s.bag = kid ? (br < .35 ? 'backpack' : null) : s.top === 'suit' ? (br < .55 ? 'briefcase' : br < .65 ? 'messenger' : null)
    : d === 'airport' ? (br < .5 ? 'backpack' : br < .7 ? 'briefcase' : null)
      : br < .12 ? 'backpack' : br < .2 ? 'tote' : br < .26 ? 'messenger' : br < (d === 'oldtown' || d === 'maplewood' ? .36 : .3) ? 'grocery' : br < .33 ? 'briefcase' : null;
  s.bagColor = s.bag === 'briefcase' ? pick(r, ['#7a5238', '#33303f', '#6a4428']) : pick(r, BAG_COLORS);
  // occasional uniforms seen around town
  if (opts.outfit) s.outfit = opts.outfit;
  else if (!kid) {
    const o = r();
    if (season === 3 && o < .25) s.outfit = 'winter';
    else if (d === 'railyard' && o < .3) s.outfit = 'dockworker';
    else if (d === 'harborside' && o < .12) s.outfit = 'dockworker';
    else if (d === 'park' && o < .22 && season !== 3) s.outfit = 'gymwear';
    else if (d === 'downtown' && o < .3 && !elder) s.outfit = 'office';
    else if (d === 'airport' && o < .08) s.outfit = 'pilot';
  }
  return s;
}

/* ---------- presets ---------- */
export const PLAYER_PRESETS = [
  { name: 'Robin', skin: SKINS[1], hair: 'sidepart', hairColor: '#6e4428', top: 'hoodie', topColor: '#d9483b', bottom: 'jeans', bottomColor: '#4a6fa8', shoes: '#f0ece4', hat: null, glasses: false, bag: 'backpack', bagColor: '#3b6fd0', build: 'avg', height: 'avg', age: 'adult' },
  { name: 'Maya', skin: SKINS[4], hair: 'long', hairColor: '#2b2433', top: 'jacket', topColor: '#e8b83a', bottom: 'skirt', bottomColor: '#33303f', shoes: '#2f2c3a', hat: null, glasses: false, bag: 'tote', bagColor: '#ead9b8', build: 'slim', height: 'avg', age: 'adult' },
  { name: 'Theo', skin: SKINS[6], hair: 'afro', hairColor: '#2b2433', top: 'stripe', topColor: '#2f9a94', bottom: 'shorts', bottomColor: '#c8ad7a', shoes: '#f0ece4', hat: null, glasses: true, bag: null, bagColor: '#7a5238', build: 'avg', height: 'tall', age: 'adult' },
  { name: 'Juno', skin: SKINS[0], hair: 'bob', hairColor: '#f07aa8', top: 'sweater', topColor: '#7a55c8', bottom: 'leggings', bottomColor: '#33303f', shoes: '#d04a3a', hat: 'beret', hatColor: '#33303f', glasses: false, bag: 'messenger', bagColor: '#7a5238', build: 'slim', height: 'short', age: 'adult' },
  { name: 'Sam', skin: SKINS[3], hair: 'curly', hairColor: '#4a3022', top: 'flannel', topColor: '#4fa860', bottom: 'jeans', bottomColor: '#34507f', shoes: '#6a4428', hat: null, glasses: false, beard: true, bag: null, bagColor: '#7a5238', build: 'broad', height: 'avg', age: 'adult' },
  { name: 'Aiko', skin: SKINS[1], hair: 'bun', hairColor: '#2b2433', top: 'dress', topColor: '#f07a5a', bottom: 'skirt', bottomColor: '#f07a5a', shoes: '#f0ece4', hat: 'sunhat', glasses: false, bag: 'tote', bagColor: '#4fa860', build: 'avg', height: 'avg', age: 'adult' },
  { name: 'Dev', skin: SKINS[5], hair: 'short', hairColor: '#2b2433', top: 'suit', topColor: '#2f3f72', bottom: 'slacks', bottomColor: '#2b3a68', shoes: '#2f2c3a', hat: null, glasses: true, bag: 'briefcase', bagColor: '#6a4428', build: 'avg', height: 'tall', age: 'adult' },
  { name: 'Noor', skin: SKINS[3], hair: 'hijab', hairColor: '#3fb8a8', top: 'cardigan', topColor: '#ead9b8', bottom: 'longskirt', bottomColor: '#34507f', shoes: '#c8a070', hat: null, glasses: false, bag: 'backpack', bagColor: '#f08ab0', build: 'avg', height: 'avg', age: 'adult' },
];

/* ---------- gallery ---------- */
const G = (id, spec, pose) => ({ id, sb: CHAR_SB, draw: () => drawChar(spec, pose) });
const P0 = PLAYER_PRESETS[0], P1 = PLAYER_PRESETS[1];
export const galleryItems = [];
{
  const g = galleryItems, pad = n => (n < 10 ? '0' : '') + n, DISTS = ['downtown', 'oldtown', 'harborside', 'hillcrest', 'maplewood', 'arts', 'railyard', 'park'];
  for (let i = 0; i < 24; i++) g.push(G('char.cit.' + pad(i), randomSpec(rng(100 + i * 7), { season: i < 16 ? 1 : 2, district: DISTS[i % 8] }), { anim: 'stand', dir: i % 4 === 3 ? 3 : i % 2 }));
  for (let i = 0; i < 8; i++) g.push(G('char.win.' + i, randomSpec(rng(900 + i * 13), { season: 3 }), { anim: 'stand', dir: i === 7 ? 2 : i % 2 }));
  PLAYER_PRESETS.forEach((s, i) => { g.push(G('char.pre.' + i, s, { dir: 0 })); g.push(G('char.pre.' + i + 'b', s, { dir: 3 })); });
  OUTFITS.forEach((o, i) => { const s = Object.assign(randomSpec(rng(40 + i * 5), {}), { outfit: o }); g.push(G('char.out.' + o, s, { dir: i % 2 })); g.push(G('char.outb.' + o, s, { dir: 2 + (i % 2) })); });
  for (let d = 0; d < 4; d++) { g.push(G('char.dir.' + d, P0, { dir: d })); g.push(G('char.dir.m' + d, P1, { dir: d })); }
  HAIRS.forEach((h, i) => { const s = Object.assign({}, P0, { hair: h, bag: null, hairColor: HAIR_COLORS[(i * 3 + 1) % 9], skin: SKINS[(i * 3) % 8], top: 'tee', topColor: '#f4f0e8' }); g.push(G('char.hair.' + h, s, { dir: 0 })); g.push(G('char.hairb.' + h, s, { dir: 3 })); });
  TOPS.forEach((t, i) => g.push(G('char.top.' + t, Object.assign({}, P0, { top: t, bag: null, topColor: CLOTH_COLORS[(i * 4) % 13] }), { dir: i % 2 })));
  BOTTOMS.forEach((t, i) => g.push(G('char.bot.' + t, Object.assign({}, P1, { bottom: t, bag: null, top: 'tee', bottomColor: PANTS_COLORS[i] }), { dir: 0 })));
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
