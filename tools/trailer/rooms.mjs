// "Open every door" clips: the player steps into one interior after another, framed identically (match cut): node tools/trailer/rooms.mjs [--zoom 3] [--hour 13] [--sec 1.5] room[@dx,dy] ...
// Per room: G.go('int:<id>') (the game's own scene change, no fade), wait 4 s of game time for the room's own crowd, then the player walks in from the entrance
// (player.goTo, the game's own pathfinding; default 5 tiles straight in, or the given offset from the spawn) while the camera leads it by a fixed offset.
// -> <scratch>/frames/room_<id>/ + clips/room_<id>.mp4 ; --strip writes strips/rooms_<n>.jpg contact sheets (frame 12 of each)
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { open, installHelpers, freeze, settle, record, SCRATCH, FPS } from './lib.mjs';
const args = process.argv.slice(2); const opt = { zoom: 3, hour: 13, sec: 1.5, tag: 'rooms' }; const rooms = [];
for (let i = 0; i < args.length; i++) { if (args[i].startsWith('--')) opt[args[i].slice(2)] = isNaN(+args[i + 1]) ? args[++i] : +args[++i]; else rooms.push(args[i]); }
fs.mkdirSync(path.join(SCRATCH, 'clips'), { recursive: true }); fs.mkdirSync(path.join(SCRATCH, 'strips'), { recursive: true });
const { page, errs, close } = await open({ url: `?scene=city&t=${opt.hour}&debug&weather=clear` });
await installHelpers(page); await freeze(page);
const picks = [];
for (const spec of rooms) {
  const [r, off] = spec.split('@'); const name = 'room_' + r.replace(/:/g, '-');
  try {
    const go = page.evaluate(async ([r, z]) => { await G.go('int:' + r, { fade: false }); G.setZoom(z); G.player.hidden = false; G.camTarget = null; G.snapCam(); const p = G.player, ex = G.scene.interactables.filter(i => i.exit).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0] || { x: p.x, y: p.y }; window._ex = [ex.x, ex.y]; return [p.x, p.y, p.dir, ex.x, ex.y, G.world.w, G.world.h]; }, [r, opt.zoom]);
    await settle(page, 0.3); const sp = await go; await settle(page, 4);
    const dOld = [[5, 0], [0, 5], [-5, 0], [0, -5]][sp[2]] || [0, -5];
    /* owner msg 216: the character must walk INTO the room, away from the door it came through. --away 1: the walk direction is the axis that points from the exit (the nearest exit interactable; the room centre decides when the spawn stands on it) into the room */
    let dNew = [sp[0] - sp[3], sp[1] - sp[4]]; if (Math.hypot(dNew[0], dNew[1]) < .5) dNew = [sp[5] / 2 - sp[0], sp[6] / 2 - sp[1]]; dNew = Math.abs(dNew[0]) > Math.abs(dNew[1]) ? [5 * Math.sign(dNew[0]), 0] : [0, 5 * Math.sign(dNew[1])];
    const d = off ? off.split(',').map(Number) : opt.away ? dNew : dOld; const trace = [];
    const info = await page.evaluate(([sp, d, z]) => {
      const p = G.player; p.x = sp[0]; p.y = sp[1]; p.path = null; G.setZoom(z);
      /* nearest free tile to the wanted target, searching back toward the spawn */
      let tx = sp[0] + d[0], ty = sp[1] + d[1], ok = false; for (let k = 0; k < 12 && !ok; k++) { for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1.5, 0], [-1.5, 0]]) if (!G.world.isBlocked(tx + ox, ty + oy)) { tx += ox; ty += oy; ok = true; break; } if (!ok) { tx -= d[0] / 12; ty -= d[1] / 12; } }
      p.goTo(G.world, tx, ty); const L = Math.hypot(d[0], d[1]) || 1, lead = { x: 0, y: 0, z: 0 }; TR.lead = lead; TR.ld = [d[0] / L * 3.2, d[1] / L * 3.2]; G.camTarget = lead;
      TR.follow = () => { if (G.modal) { TR.sawModal = (document.querySelector('#ui .ftw, #ui .modal') || {}).className || 'modal'; for (const w of document.querySelectorAll('#ui .ftw, #ui .modal')) w.remove(); G.modal = 0; if (!p.path) p.goTo(G.world, tx, ty); } lead.x = p.x + TR.ld[0]; lead.y = p.y + TR.ld[1]; lead.z = p.z; G.snapCam(); }; TR.follow();
      return { path: p.path ? p.path.length : 0, to: [tx, ty], ents: G.scene.ents.length, modal: G.modal, saw: TR.sawModal || null };
    }, [sp, d, opt.zoom]);
    for (let q = 0; q < Math.round((opt.pre === undefined ? .5 : opt.pre) * 30); q++) { await page.evaluate(() => TR.follow()); await page.clock.runFor(1000 / 30); }
    const pos = () => page.evaluate(() => { TR.follow(); const p = G.player; return [p.x, p.y, Math.hypot(p.x - window._ex[0], p.y - window._ex[1])]; });
    if (opt.dry) { for (let q = 0; q < 19; q++) { trace.push(await pos()); await page.clock.runFor(1000 / 30); } const a = trace[0], b = trace[17], m = trace[13]; console.log(r, 'AUDIT', JSON.stringify({ dOld, dNew, same: dOld[0] === dNew[0] && dOld[1] === dNew[1], awayBy: +(b[2] - a[2]).toFixed(2), movingAtEnd: +Math.hypot(b[0] - m[0], b[1] - m[1]).toFixed(2), exit0: +a[2].toFixed(1) })); continue; }   /* polish pass: the player is a couple of steps inside when the clip starts */
    const dir = await record(page, name, Math.round(opt.sec * FPS), async i => { const q = await pos(); if (i === 0 || i === 13 || i === 17) trace.push(q); });
    { const a = trace[0], m = trace[1], b = trace[2]; console.log(r, 'WALK', JSON.stringify({ d, awayBy: +(b[2] - a[2]).toFixed(2), movingAtEnd: +Math.hypot(b[0] - m[0], b[1] - m[1]).toFixed(2), exit0: +a[2].toFixed(1) })); }
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(dir, '%05d.jpg'), '-c:v', 'libx264', '-crf', '10', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', path.join(SCRATCH, 'clips', name + '.mp4')]);
    picks.push(path.join(dir, '00014.jpg')); console.log(r, JSON.stringify(sp), JSON.stringify(info));
  } catch (e) { console.log(r, 'FAILED', e.message.split('\n')[0]); }
}
if (errs.length) console.log('page errors:', errs.slice(0, 8));
await close();
// contact sheets, 12 rooms each
for (let i = 0; i < picks.length; i += 12) { const part = picks.slice(i, i + 12), inp = part.flatMap(f => ['-i', f]); execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...inp, '-filter_complex', part.map((_, k) => `[${k}:v]scale=640:-1[s${k}]`).join(';') + ';' + part.map((_, k) => `[s${k}]`).join('') + `xstack=inputs=${part.length}:layout=${part.map((_, k) => `${(k % 3) * 640}_${Math.floor(k / 3) * 360}`).join('|')}`, path.join(SCRATCH, 'strips', `${opt.tag}_${i / 12}.jpg`)]); }
