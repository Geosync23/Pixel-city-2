// Record trailer shots: node tools/trailer/shoot.mjs <shotId> [<shotId> ...]   (ids: the keys of SHOTS in shots.mjs; `all` = every one; --list)
// Each shot: opens the clean build, stages the scene through window.G, freezes the clock, records N frames at 30 fps to <scratch>/frames/<id>/ and
// writes a near-lossless <scratch>/clips/<id>.mp4 plus a 6-frame strip <scratch>/strips/<id>.jpg to look at.
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { open, installHelpers, freeze, settle, record, SCRATCH, FPS } from './lib.mjs'; import { SHOTS } from './shots.mjs';
let ids = process.argv.slice(2); if (ids[0] === '--list') { console.log(Object.keys(SHOTS).join(' ')); process.exit(0); } if (ids[0] === 'all') ids = Object.keys(SHOTS);
for (const d of ['clips', 'strips']) fs.mkdirSync(path.join(SCRATCH, d), { recursive: true });
for (const id of ids) {
  const S = SHOTS[id]; if (!S) { console.log('no shot', id); continue; }
  const t0 = Date.now(), { page, errs, close } = await open({ url: S.url || '?scene=city&t=12&debug' });
  try {
    await installHelpers(page);
    const ctx = { page, meta: o => { const f = path.join(SCRATCH, 'meta', id + '.json'); fs.mkdirSync(path.dirname(f), { recursive: true }); let m = {}; try { m = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { } fs.writeFileSync(f, JSON.stringify(Object.assign(m, o))); }, ev: (fn, arg) => page.evaluate(fn, arg), settle: s => settle(page, s), freeze: () => freeze(page), frozen: false };
    fs.rmSync(path.join(SCRATCH, 'meta', id + '.json'), { force: true }); if (S.setup) await S.setup(ctx);
    if (!ctx.frozen) { await freeze(page); ctx.frozen = true; }
    if (S.settle) await settle(page, S.settle);
    if (S.ready) await S.ready(ctx);
    const dens = []; const n = Math.round((S.sec || 3) * FPS), dir = await record(page, id, n, async (i, t) => { if (S.frame) await S.frame(ctx, t, i); if (i % 3 === 0) { const d = await page.evaluate(() => window.TR && TR.count ? TR.count() : null).catch(() => null); if (d) dens.push(d); } });
    if (dens.length) { const av = k => +(dens.reduce((a, d) => a + d[k], 0) / dens.length).toFixed(1); ctx.meta({ dens, people: av(0), moving: av(1), vehicles: av(2), clock: await page.evaluate(() => G.now().clock + ' wd' + G.now().weekday) }); console.log(id, 'in view: people', av(0), 'moving vehicles', av(1), 'all vehicles', av(2)); }
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(dir, '%05d.jpg'), '-c:v', 'libx264', '-crf', '10', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', path.join(SCRATCH, 'clips', id + '.mp4')]);
    const k = Math.max(1, Math.floor(n / 6));
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(dir, '%05d.jpg'), '-vf', `select='not(mod(n\\,${k}))',scale=640:-1,tile=3x2`, '-frames:v', '1', path.join(SCRATCH, 'strips', id + '.jpg')]);
    console.log(id, n, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's', errs.length ? 'PAGE ERRORS: ' + errs.slice(0, 3).join(' | ') : '');
  } catch (e) { console.log(id, 'FAILED', e.message.split('\n')[0], errs.slice(0, 3)); }
  await close();
}
