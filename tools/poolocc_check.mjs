// poolocc_check: light pools must not show through buildings (owner msg 219; docs/reports/pool_occlusion.md). Build first: node tools/build.mjs
//   node tools/poolocc_check.mjs [--html dist/index.html] [--tag after] [--spots "name,x,y,hour[,weather];..."] [--pics] [--objs 5]
// At each spot (city, 390x844): a picture as the phone shows it (out/shots/poolocc_<tag>_<name>.png) and one of the frozen static world (.._static.png: nobody on screen, no headlights).
// Then, on the frozen static world (not with --pics), the rule itself is tested without using the renderer's own bookkeeping:
//   [leak]   for the --objs things with the most lamps behind them: the picture with every lamp vs. the picture with the lamps BEHIND that thing taken out of the world.
//            On the thing's own visible pixels (= the pixels that change when the thing is hidden) the two must be identical: 0 px. (The lamps "behind" are picked here, by the rule as it is
//            written in the report, not by the renderer.)
//   [ground] only a build with the fix: pool occlusion on vs. off (G.renderer.nl.occ): every pixel that differs lies on the silhouette of a placed object that keeps the pattern. 0 px elsewhere
//            (the ground, people, props: untouched; no halo around a silhouette).
//   [moving] a test light (drawn through the scene.lights hook, like headlights) on the ground behind the first thing: its visible pixels must not change (0 px); the same light in front of it: they do.
//   [fade]   only a build with the fix: the first tall thing is made see-through (alpha .5, as when the player stands behind it); the light mask must be alpha x (mask with the thing solid) +
//            (1 - alpha) x (mask without the thing) on every pixel, to within 2 levels: the pool shows through in proportion.
//   [same]   with --same before.html (a build from before the fix): the frozen static world in that build vs. this build with the occlusion switched off (nl.occ = false): identical, 0 px
//            (the switch really is the whole change; everything else paints as it did).
// Prints one line per spot; exit code 1 if a check fails (a build without the fix fails [leak] and [moving]: that is the "before").
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const av = process.argv.slice(2), o = { html: path.join(ROOT, 'dist/index.html'), tag: 'after', objs: 5, pics: false,
  spots: 'towers,197,264,22;glass,189,150,23;plaza,220,221,22;juniper,62,231,22;hillcrest,34,104,22.8;hillcrest2,100,70,22;viaduct,96,298,22;underpass,300,311,22;central,213,326,22.5;harbour,101,326,22;oldtown,123,263,22;lantern,100,285,21;lofts,74,249,22.5;dusk,189,150,19.2;rain,62,231,22,rain;day,62,231,13' };
for (let i = 0; i < av.length; i++) { const k = av[i].slice(2); if (k === 'pics') o.pics = true; else o[k] = av[++i]; }
const HTML = fs.readFileSync(path.resolve(o.html)), OLD = o.same ? fs.readFileSync(path.resolve(o.same)) : null;
const srv = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(req.url.startsWith('/old') ? OLD : HTML); }); await new Promise(r => srv.listen(0, r));
const OUT = path.join(ROOT, 'out/shots'); fs.mkdirSync(OUT, { recursive: true });
const br = await chromium.launch(); let bad = 0, errs = 0;
const LIB = `window.sleep = ms => new Promise(r => setTimeout(r, ms)); window.frames = n => new Promise(r => { const f = () => { if (--n <= 0) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
  window.settle = async () => { await frames(34); await sleep(60); await frames(14); };   /* the mask tiles wait 20 frames after a change, then one is painted per frame */
  window.hideAll = on => { for (const e of G.scene.ents) { if (on) { if (e._h0 === undefined) { const d = Object.getOwnPropertyDescriptor(e, 'hidden'); if (d && d.get) continue; e._h0 = !!e.hidden; e.hidden = true; } } else if (e._h0 !== undefined) { e.hidden = e._h0; e._h0 = undefined; } } };
  window.grab = () => { const c = G.cv, x = document.createElement('canvas'); x.width = c.width; x.height = c.height; const g = x.getContext('2d'); g.drawImage(c, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
  window.mask = () => G.renderer.Mx.getImageData(0, 0, G.renderer.W, G.renderer.H).data;
  /* THE RULE (docs/reports/pool_occlusion.md): does a thing with box B = [x0, y0, z0, x1, y1, z1] take the pool of a lamp at l on its faces? */
  window.takes = (B, l) => B[2] > l.z + 1.05 ? false : B[5] - B[2] < .5 ? true : (l.x >= B[3] || l.y >= B[4]) ? true : (l.x > B[0] && l.y > B[1]);
  window.poolBox = l => { const U = 16, rx = Math.round(l.r * U * 1.2), ry = Math.round(rx / 2), cx = Math.round((l.x - l.y) * U) - G.cam.x, cy = Math.round((l.x + l.y) * U / 2 - l.z * U) - G.cam.y; return [cx - rx, cy - ry, cx + rx, cy + ry]; };
  window.itemBox = it => { const sp = it.spr, q = sp.bx || [0, 0, sp.w, sp.h], x = sp.x + it.ax - G.cam.x, y = sp.y + it.ay - G.cam.y; return [x + q[0], y + q[1], x + q[2], y + q[3]]; };
  window.openTo = ob => ob.nl === 'ground' || !!(ob.a && (ob.a.nl === 'ground' || (ob.a.tags || []).includes('fountain')));   /* takes every pool, like the ground */
  window.behindOf = it => { const b = itemBox(it), out = []; if (openTo(it.ob)) return out; for (const l of G.world.lights) { if (l.ob === it.ob) continue; const p = poolBox(l); if (p[0] >= b[2] || p[2] <= b[0] || p[1] >= b[3] || p[3] <= b[1] || p[0] >= G.W || p[2] <= 0 || p[1] >= G.H || p[3] <= 0) continue; if (!takes(it.ob.B, l)) out.push(l); } return out; };
  window.pattern = () => G.renderer._S.filter(it => it.ob && it.ob._nw === false && it.ob._a === undefined);
  window.NOISE = null;   /* pixels that change by themselves while the game is frozen (a blinking light, a flag): left out of every comparison */
  window.findNoise = async () => { const a = grab(), v = new Uint8Array(a.length / 4); let n = 0; for (let k = 0; k < 8; k++) { await sleep(260); const b = grab(); for (let p = 0, i = 0; i < a.length; i += 4, p++) if (!v[p] && (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2])) { v[p] = 1; n++; } } NOISE = n ? v : null; return n; };
  window.diffIn = (a, b, sel) => { let n = 0; for (let p = 0, i = 0; i < a.length; i += 4, p++) if ((!sel || sel[p]) && !(NOISE && NOISE[p]) && (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2])) n++; return n; };
  window.visOf = async ob => { const f0 = grab(); ob.hidden = true; await settle(); const f2 = grab(); ob.hidden = false; await settle(); const v = new Uint8Array(f0.length / 4); let n = 0; for (let p = 0, i = 0; i < f0.length; i += 4, p++) if (f0[i] !== f2[i] || f0[i + 1] !== f2[i + 1] || f0[i + 2] !== f2[i + 2]) { v[p] = 1; n++; } v.n = n; return v; };`;
for (const s of o.spots.split(';')) {
  const [name, x, y, t, wx] = s.split(','), url = `?scene=city&x=${x}&y=${y}&t=${t}${wx ? '&weather=' + wx : ''}`;
  const pg = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); pg.on('pageerror', e => { errs++; console.log('[page exception]', (e.stack || e.message).slice(0, 300)); });
  await pg.goto(`http://localhost:${srv.address().port}/${url}`); await pg.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 60000 });
  await pg.evaluate(`(async()=>{${LIB} try { G.state.tips.off = 1; } catch (e) { } await sleep(3500); G.modal++; await sleep(300); })()`);
  await pg.screenshot({ path: path.join(OUT, `poolocc_${o.tag}_${name}.png`) });
  await pg.evaluate(`(async()=>{ hideAll(true); for (const ob of G.world.objs) if (typeof ob.id === 'string' && /trafficlight|crosswalk|signal|fountain/.test(ob.id)) ob.hidden = true;   /* (things that are animated while the game is frozen) */ window._SL = G.scene.lights; G.scene.lights = null; window._ul = G.underlays.splice(0); window._ol = G.overlays.splice(0); await settle(); await settle(); })()`);
  await pg.screenshot({ path: path.join(OUT, `poolocc_${o.tag}_${name}_static.png`) });
  let same = null;
  if (OLD) { const p2 = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); p2.on('pageerror', e => { errs++; console.log('[page exception, old build]', (e.stack || e.message).slice(0, 300)); }); await p2.goto(`http://localhost:${srv.address().port}/old${url}`); await p2.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 60000 });
    const prep = `(async()=>{${LIB} try { G.state.tips.off = 1; } catch (e) { } await sleep(3500); G.modal++; await sleep(300); hideAll(true); for (const ob of G.world.objs) if (typeof ob.id === 'string' && /trafficlight|crosswalk|signal|fountain/.test(ob.id)) ob.hidden = true; G.scene.lights = null; G.underlays.splice(0); G.overlays.splice(0); if (G.renderer.nl && G.renderer.nl.occ !== undefined) G.renderer.nl.occ = false; await settle(); await settle(); await sleep(1500); const d = grab(); let h = 2166136261; for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 16777619); } return { h: h >>> 0, cam: G.cam.x + ',' + G.cam.y, url: G.cv.toDataURL() }; })()`;
    const A = await p2.evaluate(prep); await p2.close(); const p3 = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); await p3.goto(`http://localhost:${srv.address().port}/${url}`); await p3.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 60000 });
    const B = await p3.evaluate(prep); same = A.cam !== B.cam ? -1 : A.h === B.h ? 0 : await p3.evaluate(`(async()=>{ const im = new Image(); im.src = ${JSON.stringify(A.url)}; await im.decode(); const x = document.createElement('canvas'); x.width = im.width; x.height = im.height; const g = x.getContext('2d'); g.drawImage(im, 0, 0); return diffIn(g.getImageData(0, 0, im.width, im.height).data, grab()); })()`); await p3.close(); if (same) bad++; }
  if (o.pics || +t < 18.5 && +t > 7) { if (same !== null) console.log(`${name}: [same] old build vs this build with the occlusion off: ${same < 0 ? 'the camera differs' : same + ' px'}`); console.log(`${name} (${x},${y} t=${t}${wx ? ' ' + wx : ''}): pictures only`); await pg.close(); continue; }
  const r = await pg.evaluate(`(async()=>{ const R = G.renderer, W = G.world, out = { dark: G.env.dark, fix: !!(R.nl && R.nl.occ !== undefined), objs: [] };
    const P = pattern().map(it => ({ it, ob: it.ob, L: behindOf(it) })).filter(q => q.L.length && (q.ob.B[5] - q.ob.B[2]) >= 1).sort((a, b) => b.L.length - a.L.length); out.cands = P.length; out.patt = pattern().length;
    out.noise = await findNoise(); const pick = P.slice(0, ${+o.objs}), f0 = grab(); await sleep(300); out.twice = diffIn(f0, grab());
    for (const q of pick) { const vis = await visOf(q.ob), LL = W.lights; W.lights = LL.filter(l => !q.L.includes(l)); await settle(); const f1 = grab(); W.lights = LL; await settle(); q.vis = vis; out.objs.push({ id: q.ob.id, at: q.ob.B.slice(0, 2).join(','), behind: q.L.length, visible: vis.n, leak: diffIn(f0, f1, vis) }); }
    out.back = diffIn(f0, grab());
    if (out.fix) { /* [ground] */ const U = document.createElement('canvas'); U.width = G.W; U.height = G.H; const u = U.getContext('2d'); for (const it of pattern()) u.drawImage(it.spr.c, it.spr.x + it.ax - G.cam.x, it.spr.y + it.ay - G.cam.y); const ud = u.getImageData(0, 0, G.W, G.H).data, sel = new Uint8Array(G.W * G.H); for (let p = 0; p < sel.length; p++) sel[p] = ud[p * 4 + 3] ? 0 : 1;
      R.nl.occ = false; await settle(); const g0 = grab(); R.nl.occ = true; await settle(); const g1 = grab(); out.occDiff = diffIn(g0, g1); out.occOutside = diffIn(g0, g1, sel); out.occBack = diffIn(f0, g1);
      R.nl.tiles = false; await frames(6); out.notiles = diffIn(f0, grab()); R.nl.tiles = true; await settle(); out.tilesBack = diffIn(f0, grab()); }
    if (pick.length) { /* [moving] */ const q = pick[0], B = q.ob.B, U = 16, put = (lx, ly) => { const z = W.heightAt(lx, ly); G.scene.lights = (m, cam, pool) => { const ps = pool(2.5, '#ffe6b0'); m.drawImage(ps, Math.round((lx - ly) * U) - cam.x - (ps.width >> 1), Math.round((lx + ly) * U / 2 - z * U) - cam.y - (ps.height >> 1)); }; };
      put((B[0] + B[3]) / 2 - 1, B[1] - 1.5); await frames(8); const h1 = grab(); out.movBehind = diffIn(f0, h1, q.vis); out.movBehindAll = diffIn(f0, h1);
      put((B[0] + B[3]) / 2 + 1, B[4] + .6); await frames(8); const h2 = grab(); out.movFront = diffIn(f0, h2, q.vis); G.scene.lights = null; await frames(8); out.movBack = diffIn(f0, grab()); }
    if (out.fix) { /* [fade] */ const q = P.find(q => q.ob.B[5] - q.ob.B[2] >= 2.4 && !q.ob.noFade); if (q) { const ob = q.ob, a = .5, sp = q.it.spr, X = sp.x + q.it.ax - G.cam.x, Y = sp.y + q.it.ay - G.cam.y, sd = sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h).data;
        const mo = mask(); ob.hidden = true; await settle(); const mh = mask(); ob.hidden = false; await settle();
        const run = async () => { Object.defineProperty(ob, '_a', { get: () => a, set: () => { }, configurable: true }); await settle(); const mf = mask(); delete ob._a; await settle(); let n = 0, worst = 0, part = 0, seen = 0; const Wd = R.W, Hd = R.H;
          for (let p = 0, i = 0; p < Wd * Hd; p++, i += 4) { const x = p % Wd - X, y = ((p / Wd) | 0) - Y, al = x >= 0 && y >= 0 && x < sp.w && y < sp.h ? sd[(y * sp.w + x) * 4 + 3] : 0; if (al > 0 && al < 255) { part++; continue; } const k = al ? a : 0; if (al && (mo[i] !== mh[i] || mo[i + 1] !== mh[i + 1] || mo[i + 2] !== mh[i + 2])) seen++; for (let c = 0; c < 3; c++) { const want = k * mo[i + c] + (1 - k) * mh[i + c], d = Math.abs(mf[i + c] - want); if (d > worst) worst = d; if (d > 2) { n++; break; } } } return { n, worst: +worst.toFixed(1), part, seen }; };
        out.fade = Object.assign({ id: ob.id }, await run()); R.nl.tiles = false; await frames(6); out.fadeNoTiles = await run(); R.nl.tiles = true; await settle(); out.fadeBack = diffIn(f0, grab()); } }
    return out; })()`);
  const leak = r.objs.reduce((n, q) => n + q.leak, 0), fail = leak || r.twice || r.back || (r.movBehind || 0) || (r.movBack || 0) || (r.fix && (r.occOutside || r.occBack || r.notiles || r.tilesBack || (r.fade && (r.fade.n || r.fadeNoTiles.n || r.fadeBack))));
  if (fail) bad++;
  console.log(`${name} (${x},${y} t=${t}${wx ? ' ' + wx : ''}, dark ${r.dark}): ${r.patt} things keep the pattern, ${r.cands} of them have lamps behind | [leak] ${r.objs.map(q => `${q.id.replace(/^(bld|prop)\./, '')}@${q.at}: ${q.behind} lamps behind, ${q.leak} of ${q.visible} visible px change`).join('; ')} -> ${leak} px | controls: same picture twice ${r.twice} px, afterwards ${r.back} px${r.noise ? ' (' + r.noise + ' px that change by themselves are left out)' : ''}`
    + (r.fix ? ` | [ground] occlusion on vs off: ${r.occDiff} px differ, ${r.occOutside} outside the silhouettes; on again ${r.occBack} px; mask tiles off ${r.notiles} px, on again ${r.tilesBack} px` : ' | (build without the fix: no [ground] / [fade])')
    + (r.movBehind !== undefined ? ` | [moving] test light behind: ${r.movBehind} px of the thing change (${r.movBehindAll} px in all), in front of it: ${r.movFront} px; afterwards ${r.movBack} px` : '')
    + (r.fade ? ` | [fade] ${r.fade.id} at alpha .5: ${r.fade.n} px off by more than 2 levels (worst ${r.fade.worst}; ${r.fade.seen} px where solid and hidden masks differ, ${r.fade.part} half-transparent sprite px skipped); mask painted directly: ${r.fadeNoTiles.n} px (worst ${r.fadeNoTiles.worst}); afterwards ${r.fadeBack} px` : '')
    + (same !== null ? ` | [same] old build vs this build with the occlusion off, static world: ${same < 0 ? 'the camera differs' : same + ' px'}` : '')
    + (fail ? '  <-- FAIL' : ''));
  await pg.close();
}
console.log(errs ? `${errs} page errors` : 'no page errors'); console.log(bad || errs ? 'FAILED' : 'all checks passed'); await br.close(); srv.close(); process.exit(bad || errs ? 1 : 0);
