// Generates src/ui/_numfont_data.js: two tiny TrueType fonts (regular 5x7, bold 6x7) holding only the digits 0-9,
// drawn on a pixel grid for legibility (QA round 13, number legibility option "d"). Same advance widths (586 / 603, the 1 404 / 426), ascent and
// descent as Pixelify Sans (586 / 603 units, 920 / -280), so swapping them in shifts no layout.
// Run: node tools/numfont_gen.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REG = { // 5 x 7, one-pixel strokes
  0: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  1: ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'], // narrow, as Pixelify's 1 (advance 404)
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
};
const BOLD = { // 6 x 7, two-pixel vertical strokes
  0: ['.####.', '##..##', '##..##', '##..##', '##..##', '##..##', '.####.'],
  1: ['.##.', '###.', '.##.', '.##.', '.##.', '.##.', '####'], // narrow, as Pixelify's bold 1 (advance 426)
  2: ['.####.', '##..##', '....##', '...##.', '..##..', '.##...', '######'],
  3: ['#####.', '....##', '....##', '.####.', '....##', '....##', '#####.'],
  4: ['...##.', '..###.', '.#.##.', '##.##.', '######', '...##.', '...##.'],
  5: ['######', '##....', '#####.', '....##', '....##', '##..##', '.####.'],
  6: ['..###.', '.##...', '##....', '#####.', '##..##', '##..##', '.####.'],
  7: ['######', '....##', '...##.', '..##..', '.##...', '.##...', '.##...'],
  8: ['.####.', '##..##', '##..##', '.####.', '##..##', '##..##', '.####.'],
  9: ['.####.', '##..##', '##..##', '.#####', '....##', '...##.', '.###..'],
};
const PH = 92; // pixel height in units (7 rows = 644, the height of Pixelify's digits)

function glyph(rows, pw, lsb) { // rows of '#'/'.' -> one rectangle per horizontal run
  const rects = []; rows.forEach((r, i) => { const y1 = (7 - i) * PH, y0 = y1 - PH; for (let x = 0; x < r.length;) { if (r[x] !== '#') { x++; continue; } let e = x; while (e < r.length && r[e] === '#') e++; rects.push([lsb + x * pw, y0, lsb + e * pw, y1]); x = e; } });
  const ends = [], xs = [], ys = []; let n = 0;
  for (const [x0, y0, x1, y1] of rects) { for (const [x, y] of [[x0, y0], [x0, y1], [x1, y1], [x1, y0]]) { xs.push(x); ys.push(y); } n += 4; ends.push(n - 1); } // clockwise
  const b = []; const u16 = v => b.push((v >> 8) & 255, v & 255), i16 = v => u16(v & 0xffff);
  i16(rects.length); i16(Math.min(...xs)); i16(Math.min(...ys)); i16(Math.max(...xs)); i16(Math.max(...ys));
  ends.forEach(u16); u16(0); xs.forEach(() => b.push(1));
  let p = 0; for (const x of xs) { i16(x - p); p = x; } p = 0; for (const y of ys) { i16(y - p); p = y; }
  while (b.length % 4) b.push(0);
  return { bytes: b, pts: n, cts: rects.length, xMin: Math.min(...xs), xMax: Math.max(...xs) };
}

function font(set, { pw, lsb, adv, lsb1, adv1, weight, sub, os2 }) {
  const glyphs = [{ bytes: [], pts: 0, cts: 0, xMin: 0, xMax: 0, adv }].concat(Object.keys(set).map(k => Object.assign(glyph(set[k], pw, k === '1' ? lsb1 : lsb), { adv: k === '1' ? adv1 : adv })));
  const ng = glyphs.length; const T = {};
  const B = () => { const a = []; a.u16 = v => a.push((v >> 8) & 255, v & 255); a.i16 = v => a.u16(v & 0xffff); a.u32 = v => a.push((v >>> 24) & 255, (v >> 16) & 255, (v >> 8) & 255, v & 255); return a; };
  const glyf = [], loca = B(); for (const g of glyphs) { loca.u32(glyf.length); glyf.push(...g.bytes); } loca.u32(glyf.length); T.glyf = glyf; T.loca = loca;
  const xMax = Math.max(...glyphs.map(g => g.xMax));
  const head = B(); head.u32(0x00010000); head.u32(0x00010000); head.u32(0); head.u32(0x5F0F3CF5); head.u16(0x000B); head.u16(1000);
  for (let i = 0; i < 16; i++) head.push(0); head.i16(0); head.i16(0); head.i16(xMax); head.i16(7 * PH); head.u16(weight >= 600 ? 1 : 0); head.u16(8); head.i16(2); head.i16(1); head.i16(0); T.head = head;
  const hhea = B(); hhea.u32(0x00010000); hhea.i16(920); hhea.i16(-280); hhea.i16(0); hhea.u16(adv); hhea.i16(0); hhea.i16(adv - xMax); hhea.i16(xMax); hhea.i16(1); hhea.i16(0); hhea.i16(0); for (let i = 0; i < 4; i++) hhea.i16(0); hhea.i16(0); hhea.u16(ng); T.hhea = hhea;
  const maxp = B(); maxp.u32(0x00010000); maxp.u16(ng); maxp.u16(Math.max(...glyphs.map(g => g.pts))); maxp.u16(Math.max(...glyphs.map(g => g.cts))); maxp.u16(0); maxp.u16(0); maxp.u16(2); for (let i = 0; i < 8; i++) maxp.u16(0); T.maxp = maxp;
  const hmtx = B(); for (const g of glyphs) { hmtx.u16(g.adv); hmtx.i16(g.xMin); } T.hmtx = hmtx;
  const cmap = B(); cmap.u16(0); cmap.u16(1); cmap.u16(3); cmap.u16(1); cmap.u32(12);
  const sub4 = B(); sub4.u16(4); sub4.u16(32); sub4.u16(0); sub4.u16(4); sub4.u16(4); sub4.u16(1); sub4.u16(0);
  sub4.u16(0x39); sub4.u16(0xffff); sub4.u16(0); sub4.u16(0x30); sub4.u16(0xffff); sub4.i16(1 - 0x30); sub4.i16(1); sub4.u16(0); sub4.u16(0);
  cmap.push(...sub4); T.cmap = cmap;
  const o = Buffer.from(os2); o.writeUInt16BE(weight, 4); o.writeUInt16BE(0x30, 64); o.writeUInt16BE(0x39, 66); o.writeInt16BE(adv, 2);
  o.writeUInt16BE(weight >= 600 ? 0x20 : 0x40, 62); T['OS/2'] = [...o];
  const fam = 'MB Digits', names = [[1, fam], [2, sub], [4, fam + ' ' + sub], [6, 'MBDigits-' + sub]];
  const name = B(); name.u16(0); name.u16(names.length); name.u16(6 + 12 * names.length); const strs = []; let off = 0;
  for (const [id, s] of names) { const u = []; for (const c of s) u.push(0, c.charCodeAt(0)); name.u16(3); name.u16(1); name.u16(0x409); name.u16(id); name.u16(u.length); name.u16(off); off += u.length; strs.push(...u); }
  name.push(...strs); T.name = name;
  const post = B(); post.u32(0x00030000); post.u32(0); post.i16(-100); post.i16(50); post.u32(1); for (let i = 0; i < 4; i++) post.u32(0); T.post = post;
  const tags = Object.keys(T).sort(); const nt = tags.length; let es = 0; while ((2 << es) <= nt) es++; const sr = 16 << es;
  const dir = B(); dir.u32(0x00010000); dir.u16(nt); dir.u16(sr); dir.u16(es); dir.u16(nt * 16 - sr);
  const sum = a => { let s = 0; for (let i = 0; i < a.length; i += 4) s = (s + (((a[i] << 24) | ((a[i + 1] || 0) << 16) | ((a[i + 2] || 0) << 8) | (a[i + 3] || 0)) >>> 0)) >>> 0; return s; };
  let at = 12 + 16 * nt; const body = []; const offs = {};
  for (const t of tags) { const d = T[t]; offs[t] = at; dir.push(...[...t].map(c => c.charCodeAt(0))); dir.u32(sum(d)); dir.u32(at); dir.u32(d.length); const pad = [...d]; while (pad.length % 4) pad.push(0); body.push(...pad); at += pad.length; }
  const all = Buffer.from(dir.concat(body)); const adj = (0xB1B0AFBA - sum([...all])) >>> 0; all.writeUInt32BE(adj, offs.head + 8);
  return all;
}

// OS/2 is copied from Pixelify Sans (decompressed from the woff2) and patched: weight, first / last char, avg width, fsSelection
import zlib from 'node:zlib';
function pixelifyTable(tag) {
  const b = fs.readFileSync(path.join(ROOT, 'assets/font.woff2')); const n = b.readUInt16BE(12), tc = b.readUInt32BE(20);
  const known = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];
  let o = 48; const T = []; const b128 = () => { let v = 0; for (let i = 0; i < 5; i++) { const c = b[o++]; v = (v << 7) | (c & 127); if (!(c & 128)) return v; } };
  for (let i = 0; i < n; i++) { const f = b[o++]; const t = (f & 63) === 63 ? b.toString('latin1', o, o += 4) : known[f & 63]; const tv = (f >> 6) & 3; const len = b128(); let tl = len; if ((t === 'glyf' || t === 'loca') ? tv !== 3 : tv !== 0) tl = b128(); T.push({ t, tl }); }
  const data = zlib.brotliDecompressSync(b.subarray(o, o + tc)); let p = 0; for (const x of T) { if (x.t === tag) return data.subarray(p, p + x.tl); p += x.tl; }
}
const os2 = pixelifyTable('OS/2');
const reg = font(REG, { pw: 92, lsb: 63, adv: 586, lsb1: 64, adv1: 404, weight: 400, sub: 'Regular', os2 });
const bold = font(BOLD, { pw: 80, lsb: 61, adv: 603, lsb1: 53, adv1: 426, weight: 700, sub: 'Bold', os2 });
const out = `// GENERATED by tools/numfont_gen.mjs - do not edit. Two digit-only TrueType fonts (QA round 13, number legibility option "d").\nexport const DIGITS_REGULAR = '${reg.toString('base64')}';\nexport const DIGITS_BOLD = '${bold.toString('base64')}';\n`;
fs.writeFileSync(path.join(ROOT, 'src/ui/_numfont_data.js'), out);
console.log('src/ui/_numfont_data.js', reg.length, '+', bold.length, 'bytes');
