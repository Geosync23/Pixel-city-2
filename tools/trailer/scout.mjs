// Scout many city views in one page load: node tools/trailer/scout.mjs <prefix> <hour> <zoom> "x,y x,y ..." [settle] [extra js]
import { open, installHelpers, freeze, settle, still } from './lib.mjs';
const [prefix, hour, zoom, pts, sec, js] = process.argv.slice(2);
const { page, errs, close } = await open({ url: `?scene=city&t=${hour}&debug` });
await installHelpers(page); if (js) console.log(await page.evaluate(`(async()=>{${js}})()`));
await freeze(page);
for (const p of pts.split(' ')) { const [x, y] = p.split(',').map(Number); await page.evaluate(([x, y, z]) => TR.free(x, y, z), [x, y, +zoom]); await settle(page, +(sec || 2)); console.log(await still(page, `${prefix}_${x}_${y}`)); }
if (errs.length) console.log('page errors:', errs.slice(0, 5));
await close();
