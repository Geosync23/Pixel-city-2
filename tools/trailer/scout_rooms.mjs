// Scout interiors: node tools/trailer/scout_rooms.mjs <zoom> <hour> room1 room2 ...   -> <scratch>/stills/room_<id>.png + a printed line per room (size, spawn, ents)
import { open, installHelpers, freeze, settle, still } from './lib.mjs';
const [zoom, hour, ...rooms] = process.argv.slice(2);
const { page, errs, close } = await open({ url: `?scene=city&t=${hour}&debug&weather=clear` });
await installHelpers(page); await freeze(page);
for (const r of rooms) {
  try {
    const p = page.evaluate(async ([r, z]) => { await G.go('int:' + r, { fade: false }); G.setZoom(z); G.snapCam(); const s = G.scene; return { r, w: s.world.w, h: s.world.h, sp: [G.player.x, G.player.y, G.player.dir], ents: s.ents.length, zoom: G.zoom }; }, [r, +zoom]);
    await settle(page, 0.5); const info = await p; await settle(page, 4);
    const n = await page.evaluate(() => G.scene.ents.length);
    console.log(JSON.stringify(info), 'ents after', n, await still(page, 'room_' + r.replace(/:/g, '-')));
  } catch (e) { console.log(r, 'FAILED', e.message.split('\n')[0]); }
}
if (errs.length) console.log('page errors:', errs.slice(0, 8));
await close();
