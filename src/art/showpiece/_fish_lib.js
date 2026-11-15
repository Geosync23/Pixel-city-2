// Shared palette + helpers for the Bay Fish Hall art (fishmarket.js, fishmarket_stalls.js) and the fish stamp book. Not an asset module.
//   SPECIES { id: { name, note, map: [rows], pal: { char: hex } } }   24 kinds of seafood drawn pixel by pixel (head to the left), SPECIES_IDS
//   stamp(map, pal, X, Y, o) target-pixel stamp with an automatic soft outline; fishAt(id, x, y, z, o) centred on a world point ({ flip, ol, red (cooked lobster) })
//   ice(x0, x1, y0, y1, z) crushed-ice top; iceFront; tile(c) white ceramic tile wall pattern; chalk(lines, x0, x1, y, z0, z1) slate with chalk text on a +y face;
//   dial(x, y, z, r, k 0..1) round scale dial with a needle; crate(x, y, z, w, d, h, c, fill) fish box; S2, dot; iron column + bracket helpers.
import * as R from '../../engine/raster.js';
const { box, qy, qx, qz, fq, lw, cyl, dk, lt, mix, hash2, PW, px, C, lit, glow, textS, textW } = R;
export { R };
export const IRON = '#3f5a5c', IRON_D = '#2c4244', IRON_L = '#5f8a86', TILE = '#f1f4f0', TILE_D = '#cfdcdc', ICE = '#f4fbfd', ICE_D = '#c6e2ee', ICE_B = '#a6cfe2', STEEL = '#b8c4cc', STEEL_D = '#8794a0', SLATE = '#2f3a3c', CHALK = '#f2efe2',
  WOOD = '#a8743e', WOOD_D = '#7a4e2a', WOOD_L = '#c89a5a', RED = '#c8402e', BLUE = '#2f6f9f', NAVY = '#22405e', TEAL = '#2f8a8a', YEL = '#e8b83a', CREAM = '#f4ecd8', INK = '#2a2733', BRICK = '#a85a44', WATER = '#3f8fb0', WATER_L = '#7fc4d8', WATER_D = '#2a6a8c',
  CONC = '#9aa6a6', WARM = '#ffe2a0', GLASS = '#bfe4ee', RUBBER = '#e8a23a';

const P = (o, base) => Object.assign({ e: '#1c1c28' }, base, o);
export const SPECIES = {
  cod: { name: 'Atlantic Cod', note: 'Olive and speckled, with a little beard on its chin. The fish in fish and chips.', pal: P({ b: '#8a7a4a', B: '#a8975c', d: '#665838', l: '#ddd4a4', w: '#f2ecd8', t: '#6f6040', q: '#4a3e28' }),
    map: ['....ddd.dddd.d..', '..bbBbBBbBbbbb.t', '.bBeBbBBbBBbbbtt', 'bBBlllllllllbbt.', '.wwwwwwwwwwwb.tt', '..w.ww...ww....t', '.q..............'] },
  salmon: { name: 'Bay Salmon', note: 'Silver flanks, a steel-blue back and a scatter of black spots. Pink as a sunset inside.', pal: P({ g: '#4f7396', G: '#7a9cbc', S: '#e2eaf0', s: '#b6c6d4', k: '#28344a', t: '#4f7396', p: '#f0a088' }),
    map: ['......ggg.......', '..ggGkGGkGggg..t', '.gGeGGkGGGkGggtt', 'SSSSSSSSSSSSSst.', '.sSSSSSSSSSss.tt', '...ss...ss.....t'] },
  mackerel: { name: 'Mackerel', note: 'Tiger stripes in blue and green over a mother-of-pearl belly. Best eaten the day it lands.', pal: P({ g: '#2f9a94', k: '#1c4458', G: '#6ad0c0', S: '#e6eff2', s: '#b8ccd6', t: '#1c4458' }),
    map: ['..kgkgkgkgk...t', '.gkgkgkgkgkg.tt', 'gGeGGGGGGGGgtt.', '.SSSSSSSSSSs.tt', '...ss..ss.....t'] },
  herring: { name: 'Herring', note: 'Small, silver and endless. Half the harbour was built on them.', pal: P({ b: '#5a86a8', S: '#e4ecf2', s: '#b4c4d2', t: '#5a86a8' }),
    map: ['..bbbbbbb.t', '.bSeSSSSSbt', 'SSSSSSSSSt.', '..ss.ss...t'] },
  snapper: { name: 'Red Snapper', note: 'Deep-bodied and rose red, with a golden eye that follows you down the aisle.', pal: P({ r: '#b02e2c', R: '#e2524a', Q: '#f2a49a', p: '#e88a84', y: '#f6d24a', t: '#b02e2c' }),
    map: ['...r.r.r.r....', '..rrrrrrrrr...', '.rRRRRRRRRrr.t', 'rRyRRRRRRRRrtt', 'rRRRRRRQQQQrt.', '.QQQQQQQQQp.tt', '..ppQQQQpp...t', '....p..p......'] },
  halibut: { name: 'Halibut', note: 'A flatfish the size of a door: both eyes on the top side, the colour of the sea floor.', pal: P({ h: '#74603e', H: '#9c8658', f: '#c2ae7c', t: '#74603e' }),
    map: ['.....ffff......', '...ffhhHhff....', '.ffhHhHHhHhff..', 'fheHhHHhHHhHhtt', 'fhehHhhHHhHhhtt', '.ffhHhHhHhhff..', '...ffhhHhff....', '.....ffff......'] },
  tuna: { name: 'Bluefin Tuna', note: 'A torpedo in midnight blue with little yellow finlets. Sold by the loin, never whole.', pal: P({ n: '#1f3458', N: '#34548a', S: '#dfe8ee', s: '#aebfcf', y: '#f2c230', t: '#1f3458' }),
    map: ['.........nn..........', '...nnnnnnnnnnnn.....t', '.nnNNNNNNNNNNNnnyy.tt', 'nNeNNNNNNNNNNNNNnyytt', 'SSSSSSSSSSSSSSSsnyy.t', '.sSSSSSSSSSSSss.y..tt', '...ssss..sss........t'] },
  bass: { name: 'Sea Bass', note: 'Gunmetal grey with a spiny sail of a fin. Every chef on the quay wants the first box.', pal: P({ g: '#5a6470', G: '#8792a0', S: '#dde4ea', s: '#b0bcc8', t: '#5a6470' }),
    map: ['...g.g.g.gg....', '..ggggggggggg.t', '.gGeGGGGGGGGgtt', 'GGGGGGGGGGGGst.', '.SSSSSSSSSSs.tt', '...ss...ss....t'] },
  sardine: { name: 'Sardines', note: 'Packed like, well. Blue-backed, bright, grilled whole with lemon.', pal: P({ b: '#3f7aa8', S: '#e6eef4', s: '#b8c8d6', t: '#3f7aa8' }),
    map: ['.bbbbb..', 'bSeSSSbt', '.sss...t'] },
  monkfish: { name: 'Monkfish', note: 'All mouth and no manners. The ugliest thing on the ice and one of the best to eat.', pal: P({ m: '#5e4a32', M: '#8a6e4a', w: '#f4eedc', W: '#d8cdb0', t: '#5e4a32' }),
    map: ['.mmmmm.......', 'mMMMMMmm.....', 'MeMMMeMMmm...', 'MwwwwwMMMmmtt', 'MWwWwWMMmm..t', '.mMMMMmm.....', '..mmm........'] },
  swordfish: { name: 'Swordfish', note: 'The bill is real and so is the attitude. Cut into steaks thick as a book.', pal: P({ b: '#3a4e74', B: '#5a76a4', S: '#dbe4ec', s: '#aab8c8', q: '#4a5a74', d: '#2c3c5c', t: '#2c3c5c' }),
    map: ['.........d.............', '........ddd............', '.......bbbbbbbbbb.....t', 'qqqqqqbBeBBBBBBBBbb..tt', '.......SSSSSSSSSSsbbtt.', '........sss..sss.....tt', '......................t'] },
  trout: { name: 'Rainbow Trout', note: 'A river fish that visits: olive back, a pink stripe, freckles all over.', pal: P({ o: '#6a7a44', k: '#2f3a2a', Q: '#f08aa0', S: '#e6ece4', s: '#b8c4b8', t: '#6a7a44' }),
    map: ['..oookooko...t', '.okoeokookoott', 'oQQQQQQQQQQot.', '.SSSSSSSSSs.tt', '...ss..ss....t'] },
  crab: { name: 'Dungeness Crab', note: 'A wide russet shell and ten opinions. Sold live, cooked or cracked.', pal: P({ C: '#c8643a', c: '#8a3a4a', l: '#e89a5a', e: '#1c1c28', h: '#e8a878' }),
    map: ['cc.........cc', 'ccC.e...e.Ccc', '.cCChCCChCCc.', 'l.CCCCCCCCC.l', '.lCCCChCCCCl.', 'l.lCCCCCCCl.l', '.l.l.lll.l.l.'] },
  lobster: { name: 'Lobster', note: 'Blue-black in the tank, red only after the pot. Rubber bands are for your protection.', pal: P({ B: '#2f4a5a', b: '#1f3440', s: '#3f6470', c: '#2a4250', a: '#6a8a94', f: '#3f6470', y: '#e8a23a' }),
    map: ['cc..............', 'cccy.aaa........', '.ccbBBBBbsbsbs.f', 'a..BeBBBBsBsBsff', '.ccbBBBBbsbsbs.f', 'cccy.aaa........', 'cc..............'] },
  oyster: { name: 'Bay Oysters', note: 'Rough grey shells from the beds off Gull Point. Shucked while you wait, with lemon.', pal: P({ g: '#8a8a84', G: '#b2b0a6', d: '#62625e', w: '#f6f2e6', n: '#d6cdb8' }),
    map: ['..gGg..', '.gGGGg.', 'gGwwnGg', 'dgwnnGg', '.dgggd.'] },
  mussel: { name: 'Mussels', note: 'Blue-black and glossy, sold by the scoop. If one will not close, leave it.', pal: P({ m: '#1f2c48', M: '#3c5282', o: '#e8963a' }),
    map: ['.mMM.', 'mMMMm', '.mmm.'] },
  clam: { name: 'Clams', note: 'Cream shells with fine ribs. They spit when the bucket is knocked. It is not personal.', pal: P({ c: '#e8dcbc', C: '#f6eed6', d: '#b8a884' }),
    map: ['.CCC.', 'CcCcC', 'cCcCc', '.ddd.'] },
  scallop: { name: 'Scallops', note: 'The fan-shaped shell from every seaside painting, with the sweet white coin inside.', pal: P({ s: '#f0a078', S: '#f8cdb0', d: '#c8704a', w: '#fbf4e8' }),
    map: ['.SsSsS.', 'SsSsSsS', 'sSsSsSs', '.sSsSs.', '..ddd..', '.ddwdd.'] },
  squid: { name: 'Squid', note: 'A pale pink mantle, two fins and a tangle of arms. Fried in rings, or stuffed.', pal: P({ m: '#f0c8c0', M: '#f8e2dc', f: '#e0a8a0', t: '#d89088', k: '#8a4a5a' }),
    map: ['.ff..........', 'fmmmmmmm.t.t.', 'fMMMMMMmettt.', 'fMMMMMMmettt.', 'fmmmmmmm.t.t.', '.ff..........'] },
  octopus: { name: 'Octopus', note: 'Eight arms, three hearts, and it would get out of this market if it were alive.', pal: P({ p: '#8a3a5e', Q: '#b85a7e', w: '#f0c8d0' }),
    map: ['...ppp....', '..pQQQp...', '..pQQQp...', '..peQep...', '.p.ppp.p..', 'pw.pwp.wp.', '.p.p.pw.p.', 'pw.pw.p.wp'] },
  shrimp: { name: 'Bay Shrimp', note: 'Pink commas by the pound. The heads make the best stock in town.', pal: P({ p: '#f08a78', Q: '#f8b8a4', a: '#c8604e' }),
    map: ['.pQp..', 'pQQQp.', 'pe.pQ.', '...pQ.', '.aapp.'] },
  urchin: { name: 'Sea Urchin', note: 'A purple pincushion. Inside: five tongues of gold that taste of the tide.', pal: P({ u: '#4a2f5e', U: '#74508c', k: '#2c1c3a' }),
    map: ['k..k..k', '.kuUuk.', '.uUUUu.', 'kUUUUUk', '.uUUUu.', '.kuuuk.', 'k..k..k'] },
  eel: { name: 'Conger Eel', note: 'Long, dark and muscular, coiled in its own box. Smoked, it is a delicacy.', pal: P({ g: '#3a4438', G: '#5a6a52', w: '#c8ccb4' }),
    map: ['..ggggg.........ggg.', '.gGeGGGgg.....ggGGGg', 'gwwwwGGGGgggggGGGwwt', '.....wwGGGGGGGGww...', '.......wwwwwww......'] },
  kipper: { name: 'Kippers', note: 'Herring split, salted and smoked over oak until they are the colour of a violin.', pal: P({ k: '#b8722a', K: '#e09a3c', d: '#7a4a1c', b: '#f2c070' }),
    map: ['.kkkkkkk.t', 'kKbKbKbKkt', 'kKbKbKbKkt', '.kkkkkkk.t'] },
};
export const SPECIES_IDS = Object.keys(SPECIES);
const dims = m => [m.reduce((a, r) => Math.max(a, r.length), 0), m.length];
/** stamp a pixel map at target pixel (X, Y) = top-left. o: { flip, ol: hex | false, swap: { char: hex } } */
export function stamp(map, pal, X, Y, o = {}) {
  const [w, h] = dims(map), k = o.k || 1, at = (i, j) => { if (j < 0 || j >= h || i < 0 || i >= w) return '.'; const r = map[j], c = o.flip ? r[w - 1 - i] : r[i]; return c === undefined || c === ' ' ? '.' : c; };
  const put = (i, j, c) => { for (let b = 0; b < k; b++) for (let a = 0; a < k; a++) px(X + i * k + a, Y + j * k + b, c); };
  if (o.ol !== false) { const oc = C(o.ol || '#3e4a5c'); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { if (at(i, j) === '.') continue; for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (at(i + a, j + b) === '.') { if (a) for (let q = 0; q < k; q++) px(X + (a < 0 ? i * k - 1 : i * k + k), Y + j * k + q, oc); else for (let q = 0; q < k; q++) px(X + i * k + q, Y + (b < 0 ? j * k - 1 : j * k + k), oc); } } }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const c = at(i, j); if (c === '.') continue; const hex = (o.swap && o.swap[c]) || pal[c]; if (hex) put(i, j, C(hex)); }
}
const COOKED = { B: '#d8482e', b: '#b0301e', s: '#e8684a', c: '#c83a24', a: '#e8866a', f: '#e8684a' };
/** a species lying on a surface, centred on a world point */
export function fishAt(id, x, y, z, o = {}) { const s = SPECIES[id]; if (!s) return; const [w, h] = dims(s.map), q = PW(x, y, z); stamp(s.map, s.pal, Math.round(q[0]) - ((w * (o.k || 1)) >> 1), Math.round(q[1]) - ((h * (o.k || 1)) >> 1), o.red ? Object.assign({}, o, { swap: COOKED }) : o); }
export const fishSize = id => dims(SPECIES[id].map);
/** screen pixel of a local world point */
export const S2 = (x, y, z) => { const s = PW(x, y, z); return [Math.round(s[0]), Math.round(s[1])]; };
export const dot = (x, y, z, c, r = 1) => { const s = S2(x, y, z), cc = C(c); for (let j = -r + 1; j < r; j++) for (let i = -r + 1; i < r; i++) px(s[0] + i, s[1] + j, cc); };
/** crushed ice on a horizontal top */
export const icePat = (seed = 0) => (x, y) => { const k = hash2(Math.floor(x * 16), Math.floor(y * 16), seed); return k > .86 ? ICE_B : k > .62 ? ICE_D : k < .1 ? '#ffffff' : ICE; };
export const ice = (x0, x1, y0, y1, z, seed) => qz(x0, x1, y0, y1, z, icePat(seed));
/** white ceramic tile (wall pattern) */
export const tile = (c = TILE, s = 4) => { const g = dk(c, .16); return (u, v) => (u % s === 0 || v % s === 0 ? g : c); };
/** a slate with chalk lines on a +y face (screen-aligned text, centred) */
export function chalk(lines, x0, x1, y, z0, z1, o = {}) {
  qy(x0, x1, y, z0, z1, o.bg || SLATE); const f = o.frame || WOOD_D; lw([x0, y, z0], [x1, y, z0], f); lw([x0, y, z1], [x1, y, z1], f); lw([x0, y, z0], [x0, y, z1], f); lw([x1, y, z0], [x1, y, z1], f);
  const s = PW(x0, y, z1), pw = (x1 - x0) * 16; lines.forEach((t, i) => { t = String(t).slice(0, Math.floor((pw - 2) / 4)); const w = textW(t), X = Math.round(s[0] + (pw - w) / 2), Y = Math.round(s[1] + 3 + i * 7), c = C(i === 0 && o.head ? o.head : o.fg || CHALK), bx = Math.round(s[0]); glyphRow(t, X, Y, bx, c); });
}
const FONT = { A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57555', N: '65555', O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55575', X: '55255', Y: '55222', Z: '71247',
  0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71222', 8: '75757', 9: '75716', ' ': '00000', '.': '00002', '-': '00700', '$': '37276', '%': '51245', '&': '25256', "'": '22000', '!': '22202', ':': '02020', '/': '11244', '+': '02720' };
function glyphRow(str, X, Y, bx, c) { str = String(str).toUpperCase(); for (let i = 0; i < str.length; i++) { const g = FONT[str[i]] || FONT[' ']; for (let r = 0; r < 5; r++) { const bits = +g[r]; for (let b = 0; b < 3; b++) if (bits & (4 >> b)) { const u = i * 4 + b; px(X + u, Y + ((X + u - bx) >> 1) + r, c); } } } }
/** round dial with a needle, on a +y face. k 0..1 */
export function dial(x, y, z, r, k, o = {}) {
  const s = S2(x, y, z), rp = Math.round(r * 16); R.ellipse(s[0], s[1], rp + 1, rp + 1, o.rim || STEEL_D); R.ellipse(s[0], s[1], rp, rp, o.face || '#fbf7ee');
  for (let i = 0; i < 8; i++) { const a = Math.PI * (1.25 - i / 7 * 1.5); px(Math.round(s[0] + Math.cos(a) * (rp - 1)), Math.round(s[1] - Math.sin(a) * (rp - 1)), C('#5a5a66')); }
  const a = Math.PI * (1.25 - Math.max(0, Math.min(1, k)) * 1.5); R.line([s[0], s[1]], [s[0] + Math.cos(a) * (rp - 1), s[1] - Math.sin(a) * (rp - 1)], o.needle || '#c8322a'); px(s[0], s[1], C(INK));
}
/** fish box: poly crate with ice and a few fish. fill: [species ids] */
export function crate(x, y, z, w, d, h, c, fill, seed = 1) {
  box(x, y, z, w, d, h, c, { l: (u, v) => (v % 5 === 4 ? dk(c, .32) : dk(c, .18)), r: (u, v) => (v % 5 === 4 ? dk(c, .48) : dk(c, .36)) });
  ice(x + .06, x + w - .06, y + .06, y + d - .06, z + h, seed);
  (fill || []).forEach((id, i) => { const n = fill.length, fx = x + w * (.5 + ((i % 2) - .5) * (n > 1 ? .34 : 0)), fy = y + d * ((Math.floor(i / 2) + .5) / Math.ceil(n / 2)); fishAt(id, fx, fy, z + h + .02, { flip: (i + seed) % 2 === 1 }); });
}
/** cast-iron column with a capital; top at z0 + h */
export function ironCol(x, y, z0, h, c = IRON) { cyl(x, y, z0, .2, .16, dk(c, .15)); cyl(x, y, z0 + .16, .1, h - .4, c, { ol: false, l: lt(c, .12), r: dk(c, .2) }); cyl(x, y, z0 + h - .24, .17, .08, lt(c, .15), { ol: false }); cyl(x, y, z0 + h - .16, .22, .16, c); for (const zz of [.6, 1.4]) cyl(x, y, z0 + zz, .12, .05, lt(c, .2), { ol: false }); }
/** curved iron bracket from a column toward +x or +y */
export function bracket(x, y, z, len, axis, c = IRON) { let p0 = [x, y, z - len]; for (let i = 1; i <= 6; i++) { const a = i / 6 * Math.PI / 2, d = Math.sin(a) * len, zz = z - len + (1 - Math.cos(a)) * len, p1 = axis === 'x' ? [x + d, y, zz] : [x, y + d, zz]; lw(p0, p1, c); lw([p0[0], p0[1], p0[2] + .05], [p1[0], p1[1], p1[2] + .05], lt(c, .2)); p0 = p1; } if (axis === 'x') lw([x, y, z], [x + len, y, z], c); else lw([x, y, z], [x, y + len, z], c); const m = axis === 'x' ? [x + len * .45, y, z - len * .35] : [x, y + len * .45, z - len * .35]; const s = S2(m[0], m[1], m[2]); R.ellipse(s[0], s[1], 2, 2, c); px(s[0], s[1], C(dk(c, .5))); }
/** enamel pendant lamp hanging from zTop down to z */
export function pendant(x, y, zTop, z, c = '#2f6a5a') { lw([x, y, zTop], [x, y, z + .2], INK); const s = S2(x, y, z + .2); fill3([[s[0] - 6, s[1] + 4], [s[0] + 6, s[1] + 4], [s[0] + 2, s[1]], [s[0] - 2, s[1]]], c); R.line([s[0] - 6, s[1] + 4], [s[0] + 6, s[1] + 4], dk(c, .4)); lit(() => { R.rect(s[0] - 3, s[1] + 5, 7, 2, '#fff6c8'); }); glow(() => R.ellipse(s[0], s[1] + 9, 9, 5, '#ffe9a0', 'glass')); }
const fill3 = (p, c) => R.fill(p, c);
/** dithered sky colours for a time of day */
export const SKY = { day: ['#8fd0ee', '#bfe6f4'], dawn: ['#f2a680', '#f8d8a8'], dusk: ['#e8885a', '#f4c078'], night: ['#1c2440', '#2a3458'], grey: ['#9aa8b4', '#b8c4cc'] };
