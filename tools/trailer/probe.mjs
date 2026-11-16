// Scout stills: node tools/trailer/probe.mjs <name> "<url query>" "<js run in page (async), has TR helpers>" [settleSeconds] [nohide]
import { open, installHelpers, freeze, settle, still } from './lib.mjs';
const [name, url, js, sec, nohide] = process.argv.slice(2);
const { page, errs, close } = await open({ url: url || '?scene=city&t=7', hide: !nohide });
await installHelpers(page);
let r; try { r = await page.evaluate(`(async()=>{${js || ''}})()`); } catch (e) { console.log('[eval error]', e.message); }
if (r !== undefined) console.log('eval ->', JSON.stringify(r));
await freeze(page); await settle(page, +(sec || 2));
console.log(await still(page, name)); if (errs.length) console.log('page errors:', errs.slice(0, 5));
await close();
