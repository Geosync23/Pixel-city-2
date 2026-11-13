// Art preview: renders assets to a PNG contact sheet so you can LOOK at your art.
//   node tools/gallery.mjs <filter...> [--scale 3] [--night] [--season 0-3] [--out name] [--cols px] [--bg hex]
// filter = substrings matched against asset ids / gallery item ids / module file paths (any match). No filter = everything.
// Output: out/gallery/<name>.png  (then view it with the Read tool)
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
import { artFiles, ROOT } from './artfiles.mjs'; import { encodePNG } from './png.mjs';
const R = await import(pathToFileURL(path.join(ROOT, 'src/engine/raster.js')));
const args = process.argv.slice(2), opt = { scale: 3, night: false, season: 1, out: null, cols: 1500, bg: '#8fb8c8' }, filters = [];
for (let i = 0; i < args.length; i++) { const a = args[i]; if (a === '--night') opt.night = true; else if (a === '--flip') opt.flip = true; else if (a.startsWith('--')) opt[a.slice(2)] = isNaN(+args[i + 1]) ? args[++i] : +args[++i]; else filters.push(a); }
R.ENV.season = opt.season;
const items = [];
for (const f of artFiles()) {
  const rel = path.relative(ROOT, f); let mod;
  try { mod = await import(pathToFileURL(f)); } catch (e) { console.error('!! failed to import', rel, '\n', e.stack); process.exitCode = 1; continue; }
  const match = id => !filters.length || filters.some(s => id.includes(s) || rel.includes(s));
  for (const a of (Array.isArray(mod.default) ? mod.default : [])) {
    if (!match(a.id)) continue;
    const vars = a.variants && a.variants.length ? a.variants : [{}];
    vars.forEach((p, i) => { const size = typeof a.size === 'function' ? a.size(p) : a.size; const vb = a.vb ? (typeof a.vb === 'function' ? a.vb(p) : a.vb) : [-.3, -.3, 0, size[0] + .3, size[1] + .3, size[2] + .3]; items.push({ id: a.id + (vars.length > 1 ? '#' + i : ''), vb, size, draw: () => a.draw(p) }); });
  }
  for (const g of (mod.galleryItems || [])) if (match(g.id)) items.push(g);
}
if (!items.length) { console.error('no assets match', filters); process.exit(1); }
const S = opt.scale, cells = [];
const sw = b => [b[1], b[0], b[2], b[4], b[3], b[5]];
if (opt.flip) for (const it of items) { if (it.vb) it.vb = sw(it.vb); if (it.size) it.size = [it.size[1], it.size[0], it.size[2]]; it.id += '~F'; }
for (const it of items) {
  let sb = it.sb || R.screenBox(it.vb); const foot = it.size ? R.screenBox([0, 0, 0, it.size[0], it.size[1], 0]) : null;
  if (foot) sb = [Math.min(sb[0], foot[0] - 6), Math.min(sb[1], foot[1] - 3), Math.max(sb[2], foot[2] + 6), Math.max(sb[3], foot[3] + 3)];
  let spr, gnd = null;
  try {
    if (it.size) gnd = R.render(sb, () => { R.qz(-.4, it.size[0] + .4, -.4, it.size[1] + .4, 0, '#b6b1a3', '#aeaa9c'); });
    spr = R.render(sb, it.draw, null, 3, !!opt.flip);
  } catch (e) { console.error('!! draw failed for', it.id, '\n', e.stack); process.exitCode = 1; continue; }
  cells.push({ it, spr, gnd, w: spr.w, h: spr.h + 8 });
}
// shelf-pack
const maxW = Math.floor(opt.cols / S); let x = 2, y = 2, rowH = 0; const modes = opt.night ? [0, 1] : [0];
for (const c of cells) { const cw = Math.max(c.w, R.textW(c.it.id) + 2) * modes.length + 4; if (x + cw > maxW && x > 2) { x = 2; y += rowH + 4; rowH = 0; } c.x = x; c.y = y; c.cw = cw; x += cw + 4; rowH = Math.max(rowH, c.h); }
const W = Math.max(...cells.map(c => c.x + c.cw)) + 2, H = y + rowH + 2, img = new Uint32Array(W * H), bg = R.C(opt.bg), nbg = R.C('#141a33');
img.fill(bg);
const blit = (s, ox, oy, night) => { for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) { const X = ox + i, Y = oy + j; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; let c = s.buf[j * s.w + i]; const l = s.lb[j * s.w + i]; let a = c >>> 24; if (!a && !(night && l)) continue;
  let r = c & 255, g = c >> 8 & 255, b = c >> 16 & 255; if (a < 255) { const d = img[Y * W + X], k = a / 255; r = r * k + (d & 255) * (1 - k); g = g * k + (d >> 8 & 255) * (1 - k); b = b * k + (d >> 16 & 255) * (1 - k); }
  if (night) { if (!a) { const d = img[Y * W + X]; r = d & 255; g = d >> 8 & 255; b = d >> 16 & 255; } else { r = r * .30 + 10; g = g * .34 + 12; b = b * .48 + 30; } if (l) { r = Math.max(r, l & 255); g = Math.max(g, l >> 8 & 255); b = Math.max(b, l >> 16 & 255); } }
  img[Y * W + X] = (255 << 24 | b << 16 | g << 8 | r) >>> 0; } };
for (const c of cells) modes.forEach((n, k) => {
  const ox = c.x + k * (c.cw / modes.length | 0), oy = c.y + 7;
  if (n) for (let j = 0; j < c.h; j++) for (let i = 0; i < (c.cw / 2 | 0); i++) { const X = ox + i, Y = c.y + j; if (X < W && Y < H) img[Y * W + X] = nbg; }
  if (c.gnd) blit(c.gnd, ox, oy, n); blit(c.spr, ox, oy, n);
  if (!k) { const lab = R.render([0, 0, R.textW(c.it.id), 5], () => R.textS(c.it.id, 3, 3, '#1b1a24'), null, 3); blit(lab, c.x - 3, c.y - 3, 0); }
});
// upscale + write
const OW = W * S, OH = H * S, big = new Uint32Array(OW * OH);
for (let j = 0; j < OH; j++) { const sj = (j / S | 0) * W; for (let i = 0; i < OW; i++) big[j * OW + i] = img[sj + (i / S | 0)]; }
const name = opt.out || (filters.join('_').replace(/[^\w.-]+/g, '_') || 'all');
const dir = path.join(ROOT, 'out/gallery'); fs.mkdirSync(dir, { recursive: true }); const file = path.join(dir, name + '.png');
fs.writeFileSync(file, encodePNG(OW, OH, new Uint8Array(big.buffer)));
console.log(`${cells.length} items -> ${file} (${OW}x${OH})`);
