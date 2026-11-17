// Playground seating check (owner msg 218: the seesaw). Runs the game from source at phone size (390x844, touch), taps a playground piece, picks from the menus by tapping,
// screenshots the ride at a few moments and reports where the player is. Then stands up.
//   node tools/seesaw_check.mjs [--tag after] [--what seesaw|swings|spring|poi] [--hour 14] [--dist]      -> out/shots/seesaw_<tag>_<what>_<n>.png
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { ROOT } from './artfiles.mjs'; import { genModules } from './modules.mjs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const a = process.argv.slice(2), o = { tag: 'after', what: 'seesaw', hour: 14, dist: false, n: 4 }; for (let i = 0; i < a.length; i++) { const k = a[i].slice(2); if (k === 'dist') o.dist = true; else o[k] = isNaN(+a[i + 1]) ? a[++i] : +a[++i]; }
genModules();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' }, base = o.dist ? path.join(ROOT, 'dist') : ROOT;
const srv = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.join(base, u); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
await new Promise(r => srv.listen(0, r));
const WHERE = { seesaw: [67.5, 189.2, 67.5, 187.5], swings: [68, 183.6, 68, 182], spring: [71, 186.8, 71, 185.5], poi: [65, 186.6, 65, 185] }[o.what];
const br = await chromium.launch(), ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), pg = await ctx.newPage();
const errs = []; pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('EXC ' + e.message));
await pg.goto(`http://localhost:${srv.address().port}/?scene=city&x=${WHERE[0]}&y=${WHERE[1]}&t=${o.hour}&weather=clear`);
await pg.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 60000 }); await pg.waitForTimeout(1500);
const st = () => pg.evaluate(() => { const p = G.player; return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), zoff: +(p.zoff || 0).toFixed(2), dir: p.dir, pose: p.pose, po: p.poseOpts || null, busy: G.busy ? G.busy.label : null, modal: G.modal }; });
// tap the piece: the screen position of the nearest interactable to the wanted point
const tgt = await pg.evaluate(([x, y]) => { const L = G.scene.interactables.concat(typeof G.interactables === 'function' ? G.interactables() : []).filter(q => q.x !== undefined && (!q.scene || q.scene === 'city')); const it = L.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0]; const s = G.toScreen(it.x, it.y, G.world.heightAt(it.x, it.y) + (it.h || .4)), r = G.cv.getBoundingClientRect(); return { label: it.label, x: r.left + s.x, y: r.top + s.y, at: [it.x, it.y] }; }, [WHERE[2], WHERE[3]]);
console.log('tap', JSON.stringify(tgt)); await pg.touchscreen.tap(tgt.x, tgt.y); await pg.waitForTimeout(2500);
for (let k = 0; k < 3; k++) { // menus: the activity, then a duration if asked
  const opts = await pg.$$('.opt'); if (!opts.length || (await st()).busy) break; const names = []; for (const b of opts) names.push((await b.textContent()).trim().slice(0, 28)); console.log('menu', JSON.stringify(names));
  let pick = names.every(n => /^\d+ (min|h)/.test(n)) ? opts[opts.length - 1] : opts[0] /* a duration list: the longest, so there is time to look */; for (let i = 0; i < opts.length; i++) if (/see-?saw|swing|ride|^sit|have a/i.test(names[i])) { pick = opts[i]; break; } await pick.tap(); await pg.waitForTimeout(350);
}
const dir = path.join(ROOT, 'out/shots'); fs.mkdirSync(dir, { recursive: true });
for (let n = 0; n < o.n; n++) { await pg.waitForTimeout(n ? 430 : 500); const f = path.join(dir, `seesaw_${o.tag}_${o.what}_${n}.png`); await pg.screenshot({ path: f }); console.log(f, JSON.stringify(await st()), JSON.stringify(await pg.evaluate(() => G.playground ? G.playground.debug().filter(d => d.riders.some(Boolean)) : null))); }
// stand up: the cancel control of the HUD if there is one, else the API
const before = await st(); await pg.evaluate(() => { const b = document.querySelector('#hud .act-cancel, #hud [data-act="cancel"]'); if (b) b.click(); else G.activities.cancel(); }); await pg.waitForTimeout(1200);
const f = path.join(dir, `seesaw_${o.tag}_${o.what}_up.png`); await pg.screenshot({ path: f }); console.log(f, 'after standing', JSON.stringify(await st()), 'was', JSON.stringify(before));
console.log(errs.length ? 'PAGE ERRORS: ' + errs.slice(0, 5).join(' | ') : 'no page errors'); await br.close(); srv.close();
