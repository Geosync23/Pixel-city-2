// Seating contact sheets: every furniture asset that carries seats, every (non-colour) variant, both flip states, with the player on the
// first seat and NPCs on the others (single seats get a twin with an NPC). One sheet per art file -> out/shots/seat_<tag>_<family>[_n].png
//   node tools/seatsheet.mjs [--tag before|after] [--only <substring of asset id or file>] [--scale 4] [--cols 6] [--list]
// Runs the un-bundled game (dev server) so the page can import the registry and define a test room. Prints page errors.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { ROOT } from './artfiles.mjs'; import { genModules } from './modules.mjs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const a = process.argv.slice(2), o = { tag: 'after', only: '', scale: 4, cols: 6, list: false, stand: false };
for (let i = 0; i < a.length; i++) { const k = a[i].slice(2); if (k === 'list' || k === 'stand') o[k] = true; else o[k] = isNaN(+a[i + 1]) ? a[++i] : +a[++i]; }
genModules();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' };
const srv = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.join(ROOT, u); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1 });
let errs = 0; pg.on('console', m => { if (m.type() === 'error') { errs++; console.log('[page error]', m.text().slice(0, 300)); } }); pg.on('pageerror', e => { errs++; console.log('[page exception]', (e.stack || e.message).slice(0, 400)); });
await pg.goto(`http://localhost:${port}/?scene=city`);
await pg.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 60000 });
await pg.waitForTimeout(800);
const fams = await pg.evaluate(async (o) => {
  const reg = await import('/src/art/registry.js'), int = await import('/src/scenes/interior.js'), chm = await import('/src/core/char.js');
  window.__SL = { reg, int, chm };
  const fnv = (v, p) => typeof v === 'function' ? v(p) : v, out = {};
  for (const a of reg.ASSETS.values()) {
    if (!a.seats && !a.seatsFor) continue; if (o.only && !(a.id + ' ' + a.file).includes(o.only)) continue;
    const seen = new Set(), vs = a.variants && a.variants.length ? a.variants : [{}];
    vs.forEach((v, vi) => {
      const sig = JSON.stringify(Object.fromEntries(Object.entries(v).filter(([k, x]) => !(typeof x === 'string' && x[0] === '#')))); if (seen.has(sig)) return; seen.add(sig);
      let st; try { st = a.seatsFor ? a.seatsFor(v) : fnv(a.seats, v); } catch (e) { st = null; } if (!Array.isArray(st)) return; st = st.filter(s => s && !s.lie && !s.stand); if (!st.length) return;
      const fam = (a.file || 'x').replace(/^\.\//, '').replace(/\.js$/, '').replace(/\//g, '-'); (out[fam] || (out[fam] = [])).push({ id: a.id, vi, n: st.length, dirs: [...new Set(st.map(s => s.dir === undefined ? 'u' : s.dir))].join('') });
    });
  }
  return out;
}, o);
const total = Object.values(fams).reduce((n, f) => n + f.length, 0);
console.log(Object.keys(fams).length + ' families, ' + total + ' asset variants with seats (x2 flip states)');
if (o.list) { for (const f in fams) console.log(f + ': ' + fams[f].map(t => t.id.replace(/^furn\.|^prop\./, '') + '#' + t.vi + '(' + t.n + ' seats, dir ' + t.dirs + ')').join(', ')); }
else {
  const dir = path.join(ROOT, 'out/shots'); fs.mkdirSync(dir, { recursive: true }); const report = {};
  for (const fam of Object.keys(fams)) {
    const tests = []; for (const t of fams[fam]) for (const flip of [false, true]) tests.push({ ...t, flip });
    const per = o.cols * 5; for (let pgn = 0; pgn * per < tests.length; pgn++) {
      const part = tests.slice(pgn * per, pgn * per + per);
      const r = await pg.evaluate(async ({ part, o, fam }) => {
        const { reg, int, chm } = window.__SL, U = 16, sleep = ms => new Promise(r => setTimeout(r, ms)), frames = async n => { for (let i = 0; i < n; i++) await new Promise(r => requestAnimationFrame(r)); };
        const size = (a, p, flip) => { const s = reg.assetSize(a, p); return flip ? [s[1], s[0], s[2]] : s; };
        // layout: one row of cells along x; each cell holds the piece (+ its twin for single seats)
        let x = 2; const items = [], cells = []; let maxD = 1, maxH = 1;
        for (const t of part) { const a = reg.asset(t.id), p = Object.assign({}, (a.variants && a.variants[t.vi]) || {}), s = size(a, p, t.flip), twin = t.n === 1; const c = { t, x, y: 3, s, twin, i0: items.length }; items.push({ id: t.id, x, y: 3, p, flip: t.flip }); x += s[0] + 1.2; if (twin) { items.push({ id: t.id, x, y: 3, p, flip: t.flip }); c.x2 = x; x += s[0] + 1.2; } x += 2.2; cells.push(c); maxD = Math.max(maxD, s[1]); maxH = Math.max(maxH, s[2]); }
        int.defineRoom({ id: 'seatlab', name: 'Seat lab', w: Math.ceil(x + 2), d: Math.ceil(maxD + 7), noCrowd: true, zoom: 0, floor: undefined, wall: { color: '#cfd6dc', h: .4 }, items, exits: [{ x: 1, y: Math.ceil(maxD + 7) - .5 }] });
        await G.go('int:seatlab', { fresh: true, fade: false }); await frames(3);
        const sc = G.scene, W = sc.world, A = chm.charArt(); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const cv = G.cv, res = [], info = [];
        const npcs = [];
        const sit = (c, s) => { c.x = s.x; c.y = s.y; c.zoff = s.z || 0; c.z = W.heightAt(s.x, s.y) + c.zoff; if (s.dir !== undefined) c.dir = s.dir; c.pose = 'sit'; c.poseOpts = { seated: true }; c.t = 0; };
        for (const c of cells) {
          const fxs = sc.fixtures.filter(f => f.item === items[c.i0] || (c.twin && f.item === items[c.i0 + 1]));
          const fa = sc.fixtures.find(f => f.item === items[c.i0]), fb = c.twin ? sc.fixtures.find(f => f.item === items[c.i0 + 1]) : null; if (!fa) { res.push(null); continue; }
          const sa = fa.seats.filter(s => !s.lie && !s.stand);
          for (const n of npcs) { const i = sc.ents.indexOf(n); if (i >= 0) sc.ents.splice(i, 1); } npcs.length = 0;
          const mk = s => { const n = new chm.Char(A.randomSpec(rnd, { age: 'adult' }), s.x, s.y); sit(n, s); sc.ents.push(n); npcs.push(n); };
          G.endActivity(false); const s0 = sa[0]; G.startActivity({ label: 'Sitting', anim: 'sit', minutes: 1e6, rate: .001, canCancel: true, at: { x: s0.x, y: s0.y, z: s0.z || 0, dir: s0.dir } }); if (s0.z) G.player.poseOpts = { seated: true }; G.player.t = 0;
          for (let i = 1; i < sa.length; i++) mk(sa[i]); if (fb) for (const s of fb.seats.filter(s => !s.lie && !s.stand)) mk(s);
          if (o.stand) { const B = fa.ob.B; for (const q of [[(B[0] + B[3]) / 2, B[1] - .35, 1], [(B[0] + B[3]) / 2, B[4] + .35, 3]]) { const n = new chm.Char(A.randomSpec(rnd, { age: 'adult' }), q[0], q[1]); n.dir = q[2]; n.z = 0; sc.ents.push(n); npcs.push(n); } }
          // crop box: all pieces of the cell + head room
          let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; for (const f of fxs) { const B = f.ob.B; for (const X of [B[0], B[3]]) for (const Y of [B[1], B[4]]) for (const Z of [0, Math.max(B[5], 2)]) { const sx = (X - Y) * U, sy = (X + Y) * U / 2 - Z * U; bx0 = Math.min(bx0, sx); bx1 = Math.max(bx1, sx); by0 = Math.min(by0, sy); by1 = Math.max(by1, sy); } }
          bx0 -= 8; bx1 += 8; by0 -= 4; by1 += 10;
          G.camTarget = { x: 0, y: 0, z: 0 }; const mx = (bx0 + bx1) / 2, my = (by0 + by1) / 2; G.camTarget.x = (mx / U + my / (U / 2)) / 2; G.camTarget.y = (my / (U / 2) - mx / U) / 2; G.snapCam(); await frames(3);
          const cw = Math.min(cv.width, Math.ceil(bx1 - bx0)), chh = Math.min(cv.height, Math.ceil(by1 - by0)), cx = Math.max(0, Math.round(bx0 - G.cam.x)), cy = Math.max(0, Math.round(by0 - G.cam.y));
          const k = document.createElement('canvas'); k.width = cw; k.height = chh; k.getContext('2d').drawImage(cv, cx, cy, cw, chh, 0, 0, cw, chh); res.push(k);
          info.push({ id: c.t.id, vi: c.t.vi, flip: c.t.flip, seats: sa.map(s => [+(s.x - fa.ob.x).toFixed(2), +(s.y - fa.ob.y).toFixed(2), s.z, s.dir]), size: c.s, sitter: G.player._sit ? 1 : 0 });
        }
        G.endActivity(false); G.camTarget = null;
        const S = o.scale, cw0 = Math.max(...res.filter(Boolean).map(k => k.width)) * S + 8, cols = Math.max(1, Math.min(o.cols, Math.floor((o.maxw || 1640) / cw0))), cwm = Math.max(...res.filter(Boolean).map(k => k.width)) * S + 8, chm2 = Math.max(...res.filter(Boolean).map(k => k.height)) * S + 22, rows = Math.ceil(res.length / cols);
        const sheet = document.createElement('canvas'); sheet.width = cwm * cols; sheet.height = chm2 * rows; const g = sheet.getContext('2d'); g.fillStyle = '#14131a'; g.fillRect(0, 0, sheet.width, sheet.height); g.imageSmoothingEnabled = false; g.font = '11px monospace'; g.textBaseline = 'top';
        res.forEach((k, i) => { if (!k) return; const X = (i % cols) * cwm + 4, Y = Math.floor(i / cols) * chm2; g.fillStyle = '#ffe9a8'; const t = part[i]; g.fillText((t.id.replace(/^furn\.|^prop\./, '') + ' #' + t.vi + (t.flip ? ' FLIP' : '') + ' d' + t.dirs).slice(0, Math.floor(cwm / 6.7)), X, Y + 4); g.drawImage(k, X, Y + 20, k.width * S, k.height * S); });
        return { url: sheet.toDataURL('image/png'), info, w: sheet.width, h: sheet.height };
      }, { part, o, fam });
      const file = path.join(dir, `seat_${o.tag}_${fam}${pgn ? '_' + (pgn + 1) : ''}.png`); fs.writeFileSync(file, Buffer.from(r.url.split(',')[1], 'base64')); report[path.basename(file)] = r.info; console.log(file, r.w + 'x' + r.h, part.length + ' cells');
    }
  }
  fs.writeFileSync(path.join(dir, `seat_${o.tag}_index.json`), JSON.stringify(report));
}
console.log(errs ? errs + ' page errors' : 'no page errors');
await br.close(); srv.close();
