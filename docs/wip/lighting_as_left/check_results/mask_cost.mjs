// mask phase cost (renderer's own timer tAmb = mask + night pass, ms per frame) at a few spots: build A vs build B, mask tiles on and off (off = what dusk and dawn cost). CPU 4x slower.
import http from 'node:http'; import fs from 'node:fs'; import { createRequire } from 'node:module';
const ROOT = '/home/user/Pixel-city-2'; const require = createRequire(ROOT + '/tools/x.mjs'); const { chromium } = require('playwright');
const files = process.argv.slice(2), H = files.map(f => fs.readFileSync(f));
const srv = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(H[+req.url.split('?')[0].slice(1) || 0]); }); await new Promise(r => srv.listen(0, r));
const br = await chromium.launch(); const SPOTS = [['juniper', 62, 231, 22], ['glass', 189, 150, 23], ['viaduct', 96, 298, 22], ['plaza', 220, 221, 22], ['towers', 197, 264, 22]];
for (const [name, x, y, t] of SPOTS) { const row = [];
  for (let rep = 0; rep < 2; rep++) for (let b = 0; b < H.length; b++) {
    const pg = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => console.log('ERR', e.message)); const cdp = await pg.context().newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await pg.goto(`http://localhost:${srv.address().port}/${b}?scene=city&x=${x}&y=${y}&t=${t}`); await pg.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 90000 });
    const r = await pg.evaluate(`(async()=>{ const sleep = ms => new Promise(r => setTimeout(r, ms)), R = G.renderer; try { G.state.tips.off = 1; } catch (e) { } await sleep(5000); const run = async ms => { const a = { ...R.stats }; await sleep(ms); const n = R.stats.frames - a.frames; return [+((R.stats.tAmb - a.tAmb) / n).toFixed(3), +((R.stats.tNl - a.tNl) / n).toFixed(3), n]; }; const on = await run(6000); R.nl.tiles = false; await sleep(500); const off = await run(6000); return { on, off }; })()`);
    row.push(`build ${b}: tiles ${r.on[0]} (night pass ${r.on[1]}, ${r.on[2]} fr) | direct ${r.off[0]} (${r.off[1]}, ${r.off[2]} fr)`); await pg.close(); }
  console.log(name + '\n  ' + row.join('\n  ')); }
await br.close(); srv.close();
