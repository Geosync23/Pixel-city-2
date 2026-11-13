// Screenshot the running game (starts its own static server).
//   node tools/shot.mjs [--url "?scene=city&x=50&y=60&t=21&season=2&zoom=2"] [--out name] [--w 1280 --h 800] [--wait ms] [--eval "js run in page before the shot"] [--dist]
// Output: out/shots/<name>.png. Prints console errors from the page. Use --eval to drive the game through window.G.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { ROOT } from './artfiles.mjs'; import { genModules } from './modules.mjs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const a = process.argv.slice(2), o = { url: '', out: 'shot', w: 1280, h: 800, wait: 1200, eval: '', dist: false };
for (let i = 0; i < a.length; i++) { const k = a[i].slice(2); if (k === 'dist') o.dist = true; else o[k] = isNaN(+a[i + 1]) || k === 'url' || k === 'eval' || k === 'out' ? a[++i] : +a[++i]; }
genModules();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const base = o.dist ? path.join(ROOT, 'dist') : ROOT;
const srv = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.join(base, u); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: o.w, height: o.h }, deviceScaleFactor: 1 });
let errs = 0; pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') { errs++; console.log('[page ' + m.type() + ']', m.text()); } }); pg.on('pageerror', e => { errs++; console.log('[page exception]', e.stack || e.message); });
await pg.goto(`http://localhost:${port}/${o.url}`); 
try { await pg.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 30000 }); } catch (e) { console.log('!! game did not finish loading'); }
if (o.eval) { try { const r = await pg.evaluate(`(async()=>{${o.eval}})()`); if (r !== undefined) console.log('eval ->', JSON.stringify(r)); } catch (e) { errs++; console.log('[eval error]', e.message); } }
await pg.waitForTimeout(o.wait);
const dir = path.join(ROOT, 'out/shots'); fs.mkdirSync(dir, { recursive: true }); const file = path.join(dir, o.out + '.png'); await pg.screenshot({ path: file });
const st = await pg.evaluate(() => window.G && window.G.renderer ? { fps: Math.round(G.fps), items: G.renderer.stats.items, scene: G.scene && G.scene.id, t: G.now().clock } : null).catch(() => null);
console.log(file, JSON.stringify(st), errs ? `(${errs} page errors)` : '');
await br.close(); srv.close();
