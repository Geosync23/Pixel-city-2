// Wardrobe extensions for the character sprite (used by char.js): extra hairstyles (built from caps x tails), fabric patterns,
// and the lists of every garment shape / shoe / hat / accessory the catalogue (src/data/clothes.js) may reference.
// Templates use the same 11-column language as char.js HAIR: h hair, H highlight, d dark, t stubble, s skin, c accent bead/tie.
import { dk, lt, mix } from '../../engine/raster.js';

const N = s => (s + '...........').slice(0, 11);
const SB = ['...hhHhh...', '..hhhHhhh..', '..hhhhhhh..'], PB = ['....hhhh...', '...hhHhhh..', '..hhhHhhh..', '..hhhhhhh..'];
/** caps: rows from row `t` down to row 4 (the fringe line) */
const CAP = {
  flat: { t: 6, f: ['...hHHhh...', '..hhHhhhh..', '..hhhh..h..'], b: SB },
  part: { t: 7, f: ['....hhhh...', '...hhHHhh..', '..hhhHHhh..', '..hhh.hhh..'], b: PB },
  bangs: { t: 7, f: ['....hhh....', '...hHHhhh..', '..hhHhhhh..', '..hhhhhhh..'], b: PB },
  curtain: { t: 7, f: ['....hhh....', '...hhHhhh..', '..hhHhhhh..', '..hhh.h.hh.'], b: PB },
  wave: { t: 7, f: ['.....hhh...', '...hhHHhh..', '..hhhHHhhh.', '..hhhh.hhh.'], b: PB },
  volume: { t: 7, f: ['...hhhhh...', '..hHHhhhh..', '.hhHhhhhhh.', '.hhhh...hh.'], b: ['...hhhhh...', '..hhhHhhh..', '.hhhhHhhhh.', '.hhhhhhhhh.'] },
  curl: { t: 7, f: ['...hHhHh...', '..hHhhhHhh.', '.hhhHhhhhh.', '.hHhh..hh..'], b: ['...hHhHh...', '..hhHhhHhh.', '.hHhhhHhhh.', '.hhhHhhhHh.'] },
  slick: { t: 6, f: ['...hhHHh...', '..hhhHHhh..', '..hhh......'], b: SB },
  quiff: { t: 8, f: ['.....hHh...', '....hhHHh..', '...hhhHHh..', '..hhhhhhh..', '..hhh...h..'], b: ['....hhh....', '...hhhhh...', '...hhHhh...', '..hhhHhhh..', '..hhhhhhh..'] },
  fade: { t: 7, f: ['...hhhhh...', '..hhHHhhh..', '..thhhhhh..', '..tt....t..'], b: ['...hhhhh...', '..hhhHhhh..', '..thhhhht..', '..ttttttt..'] },
  knot: { t: 8, f: ['...hHh.....', '...hhh.....', '...hHHhh...', '..hhhhhhh..', '..hhh...h..'], b: ['....hHh....', '....hhh....'].concat(SB) },
  buns: { t: 8, f: ['..hh...hh..', '..hH...hh..', '...hHHhh...', '..hhhhhhh..', '..hhh...h..'], b: ['..hh...hh..', '..hH...Hh..'].concat(SB) },
  puffs: { t: 9, f: ['.hhh...hh..', 'hhHhh.hhhh.', '.hhh..hhh..', '...hHHhh...', '..hhhhhhh..', '..hhh...h..'], b: ['.hhh...hhh.', 'hhHhh.hhHhh', '.hhh...hhh.'].concat(SB) },
  coil: { t: 7, f: ['...hhhhh...', '..hHhHhhh..', '..hhhhhhh..', '..hhh...h..'], b: ['...hhhhh...', '..hhHhHhh..', '..hhhhhhh..', '..hhhhhhh..'] },
  bigfro: { t: 9, f: ['...hhhhh...', '..hhHHhhh..', '.hhHHhhhhh.', 'hhhhhhhhhhh', 'hhhhhhhhhhh', 'hhhhh..hhhh'], b: ['...hhhhh...', '..hhhHhhh..', '.hhhhHHhhh.', 'hhhhhhhhhhh', 'hhhhhhhhhhh', 'hhhhhhhhhhh'] },
  spike: { t: 8, f: ['...h.h.h...', '..hhhHhhh..', '..hHHhhhh..', '..hhhhhhh..', '..hhh.h.h..'], b: ['...h.h.h...', '..hhhhhhh..'].concat(SB) },
  emo: { t: 7, f: ['....hhhh...', '...hhHHhh..', '..hhhHhhhh.', '..hhhhhhhh.'], b: PB },
};
/** tails: rows from row 3 downward; o = overlay for the cap's last row [front, back] (hair ties) */
const TAIL = {
  crop: { f: ['..hh.......', '..hs.......'], b: ['..hhhhhh...', '..dhhhhs...', '...ddd.....'] },
  tfade: { f: ['..tt.......', '..t........'], b: ['..ttttt....', '...ttt.s...'] },
  nape: { f: ['..hhh......', '..hh.......', '..hd.......'], b: ['..hhhhhhh..', '..hhhhhh...', '..dhhhhd...'] },
  bob: { f: ['..hhh...h..', '..hhh...h..', '..hhh......', '..hhd......'], b: ['..hhhhhhh..', '..hhhhhh...', '..hhhhhh...', '..dhhhhd...'] },
  lob: { f: ['..hhh...h..', '..hhh...h..', '..hhh......', '.hhhh......', '.hhhd......', '..dd.......'], b: ['..hhhhhhh..', '..hhhhhh...', '..hhhhhh...', '..hhhhhh...', '.hhhhhhhh..', '.dhhhhhd...'] },
  long: { f: ['..hhh...h..', '..hhh......', '..hhh......', '.hhhh......', '.hhh.......', '.hhh.......', '.hhd.......', '..dd.......'], b: ['..hhhhhhh..', '..hhhhhh...', '..hhhhhh...', '..hhhhhh...', '..hhhhhh...', '..hhhhhh...', '..dhhhhd...', '...dddd....'] },
  xlong: { f: ['..hhh...h..', '..hhh......', '..hhh......', '.hhhh......', '.hhh.......', '.hhh.......', '.hhh.......', '.hhh.......', '.hHh.......', '.hhd.......', '..dd.......'], b: ['..hhhhhhh..', '..hhhhhh...', '..hhhhhh...', '..hhhhhh...', '..hhhhhh...', '..hhhhhh...', '..hhHhhh...', '..hhhhhh...', '..hhhhhh...', '..dhhhhd...', '...dddd....'] },
  hime: { f: ['..hhh...hh.', '..hhh...hh.', '..hhh....h.', '.hhhh......', '.hhh.......', '.hhh.......', '.hhd.......', '..dd.......'], b: ['..hhhhhhh..', '..hhhhhhh..', '..hhhhhh...', '..hhhhhh...', '..hhhhhh...', '..hhhhhh...', '..hhhhhh...', '..dddddd...'] },
  wavy: { f: ['.hhh.....h.', '.hhh.......', '.hhh.......', 'hhhh.......', 'hhhh.......', '.hhd.......', '.dd........'], b: ['.hhhhhhhh..', '.hhhhhhhh..', '.hhhhhhhh..', 'hhhhhhhhh..', 'hhhhhhhhh..', '.dhhhhhdh..', '.d.dddd.d..'] },
  curls: { f: ['.hHh....h..', '.hhh.......', '.hHhh......', '.hhhd......', '..hd.......'], b: ['.hHhhhHhh..', '.hhhHhhhh..', '.hhHhhhHh..', '.hhhhHhhh..', '..dhhdhd...'] },
  ponyhi: { o: ['.c.........', '.....c.....'], f: ['hhhh.......', 'hh.s.......', 'hd.........'], b: ['..hhhhhh...', '..dhhhhs...', '...dhhd....', '....hh.....', '....hh.....', '....hd.....'] },
  ponylong: { o: ['.c.........', '.....c.....'], f: ['hhhh.......', 'hh.s.......', 'hh.........', 'hh.........', 'hh.........', 'hd.........', '.d.........'], b: ['..hhhhhh...', '..dhhhhs...', '...dhhd....', '....hh.....', '....hh.....', '....hh.....', '....hh.....', '....hd.....'] },
  ponylow: { f: ['..hh.......', '.chs.......', '.hh........', '.hh........', '.hd........'], b: ['..hhhhhh...', '..dhhhhs...', '...dchd....', '....hh.....', '....hh.....', '....hd.....'] },
  lowbun: { f: ['..hh.......', 'hhhs.......', 'hHh........', '.d.........'], b: ['..hhhhhh...', '..dhhhhs...', '...hHHh....', '...dhhd....'] },
  braid: { f: ['..hh.......', '.dhs.......', '.h.........', '.d.........', '.h.........', '.d.........', '.c.........'], b: ['..hhhhhh...', '..dhhhhs...', '....hd.....', '....dh.....', '....hd.....', '....dh.....', '....hd.....', '....c......'] },
  twinbraid: { f: ['..hh....h..', '.dhs.......', '.h.........', '.d.........', '.h.........', '.d.........', '.c.........'], b: ['..hhhhhh...', '..hhhhhs...', '..hd.hd....', '..dh.dh....', '..hd.hd....', '..dh.dh....', '..c..c.....'] },
  pig: { o: ['.c.........', '.c.......c.'], f: ['.hhh....hc.', '.h.s.....h.', '.d.......d.'], b: ['.hhhhhhh.h.', '.hdhhhhs.h.', '.d.ddd...d.'] },
  piglong: { o: ['.c.........', '.c.......c.'], f: ['.hhh....hc.', '.h.s.....h.', '.h.......h.', '.h.......h.', '.h.......d.', '.d.........'], b: ['.hhhhhhh.h.', '.hdhhhhs.h.', '.h.ddd...h.', '.h.......h.', '.h.......h.', '.d.......d.'] },
  mullet: { f: ['..hh.......', '.hhs.......', '.hh........', '.hd........'], b: ['..hhhhhhh..', '..hhhhhh...', '..hhhhhh...', '..hdhhdh...', '..d.hd.d...'] },
  locs: { f: ['.hdh....d..', '.dhd.......', '.hdh.......', '.dhd.......', '.hdh.......', '.d.d.......'], b: ['.dhdhdhd...', '.hdhdhdh...', '.dhdhdhd...', '.hdhdhdh...', '.d.dhd.d...', '.c..d..c...'] },
  shortlocs: { f: ['.hdh....d..', '.dhd.......', '.h.d.......'], b: ['.dhdhdhd...', '.hdhdhdh...', '.d.d.d.d...'] },
  box: { f: ['.hdh....h..', '.hdh.......', '.hdh.......', '.hdh.......', '.hdh.......', '.hdh.......', '.hdh.......', '.c.c.......'], b: ['.hdhdhdh...', '.hdhdhdh...', '.hdhdhdh...', '.hdhdhdh...', '.hdhdhdh...', '.hdhdhdh...', '.hdhdhdh...', '.c.c.c.c...'] },
  fro: { f: ['hhhh....hh.', '.hhh.....h.', '..hh.......'], b: ['hhhhhhhhhhh', '.hhhhhhhhh.', '..hhhhhhh..'] },
};
const mk = (cap, tail) => {
  const c = CAP[cap], t = TAIL[tail], side = k => { const rows = c[k].map(N), o = t.o && t.o[k === 'f' ? 0 : 1]; if (o) { const last = rows.length - 1; rows[last] = rows[last].split('').map((ch, i) => (o[i] && o[i] !== '.' ? o[i] : ch)).join(''); } return [c.t, rows.concat(t[k].map(N))]; };
  return { f: side('f'), b: side('b') };
};
/** new style id -> [cap, tail] */
const COMBO = {
  crew: ['flat', 'tfade'], ivy: ['part', 'tfade'], skinfade: ['fade', 'tfade'], quiff: ['quiff', 'crop'], pompadour: ['quiff', 'tfade'], slickback: ['slick', 'crop'], slickfade: ['slick', 'tfade'],
  undercut: ['curtain', 'tfade'], curtains: ['curtain', 'crop'], fringe: ['bangs', 'crop'], bowl: ['bangs', 'nape'], pixie: ['wave', 'nape'], sidesweep: ['wave', 'crop'], combover: ['wave', 'tfade'],
  shag: ['volume', 'mullet'], mullet: ['flat', 'mullet'], wolfcut: ['spike', 'mullet'], fauxhawk: ['spike', 'tfade'], feathered: ['volume', 'nape'], bouffant: ['volume', 'bob'],
  bluntbob: ['bangs', 'bob'], sidebob: ['wave', 'bob'], curlybob: ['curl', 'bob'], lob: ['part', 'lob'], lobbangs: ['bangs', 'lob'], longbangs: ['bangs', 'long'], middlepart: ['curtain', 'long'],
  mermaid: ['volume', 'xlong'], rapunzel: ['bangs', 'xlong'], hime: ['bangs', 'hime'], beachwaves: ['wave', 'wavy'], ringlets: ['curl', 'curls'], waterfall: ['part', 'wavy'],
  highpony: ['flat', 'ponylong'], sleekpony: ['slick', 'ponyhi'], bangspony: ['bangs', 'ponyhi'], lowpony: ['part', 'ponylow'], chignon: ['part', 'lowbun'], manbun: ['knot', 'tfade'], topknot: ['knot', 'nape'], halfup: ['knot', 'long'],
  spacebuns: ['buns', 'crop'], spacebunslong: ['buns', 'long'], sidebraid: ['part', 'braid'], braidbangs: ['bangs', 'braid'], twinbraids: ['bangs', 'twinbraid'], longpigtails: ['flat', 'piglong'],
  boxbraids: ['flat', 'box'], shortlocs: ['curl', 'shortlocs'], locbun: ['knot', 'shortlocs'], twa: ['coil', 'tfade'], curlyfade: ['curl', 'tfade'], bigfro: ['bigfro', 'fro'], afropuffs: ['puffs', 'tfade'], emo: ['emo', 'nape'],
};
export const HAIR_X = {}; for (const k in COMBO) HAIR_X[k] = mk(COMBO[k][0], COMBO[k][1]);
export const HAIRS_X = Object.keys(COMBO);

/* ---------- garment shapes ---------- */
export const TOPS_X = ['shirt', 'shortshirt', 'blouse', 'vneck', 'crop', 'turtleneck', 'henley', 'tunic', 'cami', 'offshoulder', 'jersey', 'ziphoodie', 'sweatervest', 'rugby'];
export const OUTERS = ['jacket', 'blazer', 'denim', 'bomber', 'leather', 'cardigan', 'duster', 'coat', 'trench', 'puffer', 'parka', 'raincoat', 'windbreaker', 'gilet', 'varsity', 'hoodie', 'ziphoodie', 'suit', 'robe', 'flannel', 'poncho'];
/** one-piece tops: skirt length in rows (99 = to the ankle) + sleeve (0 none, 2 short, 9 long) */
export const DRESS = { dress: [4, 2], sundress: [4, 0], minidress: [2, 0], gown: [99, 0], maxi: [99, 2], wrapdress: [4, 9], shirtdress: [4, 2], sweaterdress: [3, 9], slip: [5, 0], pinafore: [4, 2], teadress: [5, 2] };
export const SKIRT = { skirt: 3, longskirt: 99, miniskirt: 2, midi: 5, pleated: 3, pencil: 4, tiered: 5 };
export const BOTTOMS_X = ['chinos', 'ripped', 'flare', 'wide', 'track', 'joggers', 'bermuda', 'bikeshorts', 'hotpants', 'capri', 'miniskirt', 'midi', 'pleated', 'pencil', 'tiered'];
export const SHOE_TYPES = ['sneaker', 'hightop', 'boot', 'tallboot', 'rainboot', 'heel', 'flat', 'loafer', 'sandal', 'slipper', 'oxford', 'platform'];
export const HATS_X = ['bucket', 'fedora', 'cowboy', 'visor', 'snapback', 'backcap', 'slouch', 'pom', 'tophat', 'boater', 'bandana', 'earmuffs', 'party', 'crown', 'flowercrown', 'bow', 'helmet', 'trapper', 'cloche', 'santa', 'witch', 'bunny'];
export const GLASSES_X = ['round', 'color', 'aviator', 'tint', 'heart', 'sport', 'monocle'];
export const NECKS = ['scarf', 'longscarf', 'bandana', 'necklace', 'beads', 'tie', 'bowtie', 'shawl'];
export const BAGS_X = ['purse', 'fanny', 'duffel', 'handbag', 'camera'];
export const BEARDS = ['full', 'stubble', 'goatee', 'mustache', 'long', 'chinstrap', 'soulpatch', 'mutton'];
export const PATTERNS = ['stripes', 'vstripes', 'plaid', 'dots', 'floral', 'colorblock', 'argyle', 'camo', 'tiedye', 'ombre', 'sparkle', 'chevron', 'leopard', 'pinstripe', 'check', 'hearts'];
export const BOT_PATTERNS = ['stripes', 'pinstripe', 'plaid', 'camo', 'sidestripe', 'floral', 'acid', 'dots'];
export const NO_SLEEVE_X = { cami: 1, sundress: 1, minidress: 1, gown: 1, slip: 1, gilet: 1 };
export const SHORT_SLEEVE_X = { shortshirt: 1, blouse: 1, vneck: 1, crop: 1, offshoulder: 1, jersey: 1, maxi: 1, shirtdress: 1, pinafore: 1, teadress: 1 };
/** rows of hem hanging over the hips */
export const TAILS = { coat: 3, trench: 4, parka: 3, raincoat: 3, tunic: 2, duster: 4, robe: 5, poncho: 1 };

const hash = (x, j) => { let h = (x * 374761393 + j * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) % 100; };
/** fabric pattern: colour of body pixel (x, j) for base c, second colour c2, accent a; T = rows */
export function patC(pat, x, j, c, c2, a, T) {
  const d = c2 || mix(c, '#f4f0e8', .75);
  switch (pat) {
    case 'stripes': return (j & 1) ? d : c;
    case 'vstripes': return (x & 1) ? d : c;
    case 'pinstripe': return (x & 1) ? lt(c, .28) : c;
    case 'plaid': return (j % 3 === 1) ? d : (x & 1) ? dk(c, .22) : c;
    case 'check': return ((x + j) & 1) ? d : c;
    case 'dots': return (!(x & 1) && (j & 1)) ? d : c;
    case 'floral': { const h = hash(x, j); return h < 22 ? d : h < 36 ? (a || lt(c, .4)) : h < 46 ? dk(c, .2) : c; }
    case 'colorblock': return j < (T >> 1) ? c : d;
    case 'argyle': return ((x + j) % 4 === 0 || (x - j + 16) % 4 === 0) ? d : c;
    case 'camo': { const h = hash(x >> 1, j >> 1) + hash(x, j) / 4; return h < 30 ? dk(c, .3) : h < 60 ? mix(c, '#c8ad7a', .45) : c; }
    case 'tiedye': { const q = (Math.abs(x) + j) % 3; return q === 0 ? c : q === 1 ? d : (a || lt(c, .4)); }
    case 'ombre': return j < T / 3 ? lt(c, .25) : j < 2 * T / 3 ? c : mix(c, d, .7);
    case 'sparkle': { const h = hash(x, j); return h < 18 ? '#fff8e0' : h < 40 ? lt(c, .3) : c; }
    case 'chevron': return ((j + Math.abs(x)) & 1) ? d : c;
    case 'leopard': { const h = hash(x, j); return h < 24 ? dk(c, .5) : h < 34 ? dk(c, .2) : c; }
    case 'hearts': return ((x + 8) % 3 === 0 && (j % 3 === 1)) ? (a || '#e8546a') : c;
  }
  return c;
}
/** bottoms pattern -> [near column, second column] */
export function botPatC(pat, i, idx, c, c2, b2) {
  const d = b2 || mix(c, '#f4f0e8', .7);
  switch (pat) {
    case 'stripes': return (i & 1) ? [lt(c, .35), lt(c2, .35)] : [c, c2];
    case 'pinstripe': return [c, lt(c, .3)];
    case 'plaid': return (i % 3 === 1) ? [d, d] : [c, dk(c, .22)];
    case 'camo': { const h = hash(idx + 3, i); return [h < 35 ? dk(c, .3) : c, h > 60 ? mix(c, '#c8ad7a', .45) : c2]; }
    case 'sidestripe': return [c, d];
    case 'floral': { const h = hash(idx + 5, i); return [h < 30 ? d : c, h > 70 ? d : c2]; }
    case 'acid': { const h = hash(idx + 7, i); return [h < 40 ? lt(c, .3) : c, h > 55 ? lt(c, .22) : c2]; }
    case 'dots': return (i & 1) ? [d, c2] : [c, c2];
  }
  return [c, c2];
}
