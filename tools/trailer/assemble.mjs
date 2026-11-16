// Cut a trailer: node tools/trailer/assemble.mjs a|b [outName]
// Lays the recorded frames (frames/<clip>/) on the timeline of edl.mjs (one hard link per video frame), puts the overlay PNGs (overlay.mjs) on top and the
// music (music.mjs) under it -> docs/trailer/<outName>.mp4 (H.264 high, yuv420p, 30 fps, AAC, faststart), plus out/shots/<outName>_sheet.png (one frame per shot).
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process'; import { createRequire } from 'node:module';
import { SCRATCH, FPS, W, H } from './lib.mjs'; import { EDL } from './edl.mjs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const k = process.argv[2], E = EDL[k], name = process.argv[3] || `trailer_${k}_rough`; if (!E) { console.log('usage: assemble.mjs a|b'); process.exit(1); }
const seq = path.join(SCRATCH, 'seq_' + k); fs.rmSync(seq, { recursive: true, force: true }); fs.mkdirSync(seq, { recursive: true });
const NF = Math.round(E.len * FPS), f5 = i => String(i).padStart(5, '0'); let warn = 0; const mids = [];
for (const s of E.video) {
  let dir = path.join(SCRATCH, 'frames', s.clip);
  if (s.crop && fs.existsSync(dir)) {   /* close-up: the middle of the frame around the character, enlarged by a whole factor with nearest-neighbour (pixels stay square and crisp) */
    const out = dir + '__x' + s.crop, w = W / s.crop, h = H / s.crop; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out);
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(dir, '%05d.jpg'), '-start_number', '0', '-vf', `crop=${w}:${h}:${(W - w) / 2}:${Math.round((H - h) / 2 + (s.cy || 0))},scale=${W}:${H}:flags=neighbor`, '-q:v', '1', path.join(out, '%05d.jpg')]); dir = out; }
  const have = fs.existsSync(dir) ? fs.readdirSync(dir).length : 0, a = Math.round(s.t0 * FPS), b = Math.min(NF, Math.round(s.t1 * FPS)), off = Math.round((s.in || 0) * FPS);
  if (!have) { console.log('MISSING CLIP', s.clip); warn++; continue; }
  if (off + (b - a) / (s.slow || 1) > have) { console.log('short clip', s.clip, 'needs', off + (b - a), 'has', have, '(last frame held)'); warn++; }
  for (let i = a; i < b; i++) fs.linkSync(path.join(dir, f5(Math.min(have - 1, off + Math.floor((i - a) / (s.slow || 1)))) + '.jpg'), path.join(seq, f5(i) + '.jpg'));
  mids.push({ i: Math.floor((a + b) / 2), s });
}
for (let i = 0; i < NF; i++) if (!fs.existsSync(path.join(seq, f5(i) + '.jpg'))) { console.log('GAP at frame', i, (i / FPS).toFixed(2)); process.exit(1); }
const out = path.join(ROOT, 'docs/trailer', name + '.mp4'); fs.mkdirSync(path.dirname(out), { recursive: true });
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(seq, '%05d.jpg'), '-framerate', String(FPS), '-i', path.join(SCRATCH, 'overlay_' + k, '%05d.png'), '-i', path.join(SCRATCH, E.music),
  '-filter_complex', '[0:v][1:v]overlay=format=auto,format=yuv420p[v]', '-map', '[v]', '-map', '2:a', '-t', String(E.len), '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0', '-preset', 'slow', '-crf', '19', '-maxrate', E.len > 50 ? '1750k' : '1900k', '-bufsize', '3600k', '-g', '60',
  '-af', 'volume=-1dB', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', out], { stdio: 'inherit' });
console.log(out, (fs.statSync(out).size / 1048576).toFixed(2) + ' MB', warn ? `(${warn} warnings)` : '');
// contact sheet: one composited frame per shot with its time code
const tmp = path.join(SCRATCH, 'sheet_' + k); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
for (const m of mids) execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', (m.i / FPS).toFixed(3), '-i', out, '-frames:v', '1', '-vf', 'scale=480:-1', path.join(tmp, f5(m.i) + '.jpg')]);
const tc = t => (t < 10 ? '0' : '') + t.toFixed(2);
const cells = mids.map(m => `<div class="c"><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(tmp, f5(m.i) + '.jpg')).toString('base64')}"><div><b>${tc(m.s.t0)}-${tc(m.s.t1)}</b> ${m.s.clip}</div></div>`).join('');
const cols = mids.length > 30 ? 8 : 4, br = await chromium.launch(), page = await br.newPage({ viewport: { width: cols * 250 + 10, height: 800 } });
await page.setContent(`<style>body{margin:5px;background:#1b1a24;color:#fff4dc;font:11px monospace}.g{display:grid;grid-template-columns:repeat(${cols},240px);gap:10px}.c img{width:240px;display:block}b{color:#f2c230}</style><div class="g">${cells}</div>`);
const sheet = path.join(ROOT, 'out/shots', `trailer_${k}_sheet.png`); fs.mkdirSync(path.dirname(sheet), { recursive: true }); await page.screenshot({ path: sheet, fullPage: true }); await br.close(); console.log(sheet);
