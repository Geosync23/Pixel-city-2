// Seating in real scenes, at the owner's framing (390x844 portrait, deviceScaleFactor 2): the aquarium Big Blue benches, Nana's chair by the
// range, a cafe, a film audience, a lecture, park benches. Run it on two builds to get before / after pairs.
//   node tools/seatscenes.mjs [--html dist/index.html] [--tag after] [--only aqua,nana]
// Output: out/shots/seatscene_<tag>_<name>.png. Prints page errors.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { ROOT } from './artfiles.mjs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const a = process.argv.slice(2), o = { html: 'dist/index.html', tag: 'after', only: '' }; for (let i = 0; i < a.length; i++) o[a[i].slice(2)] = a[++i];
const HTML = fs.readFileSync(path.resolve(o.html), 'utf8');
const srv = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(HTML); }); await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
const sitP = `const sitP = (s, anim) => { G.endActivity(false); G.startActivity({ label: 'Sitting', anim: anim || 'sit', minutes: 1e6, rate: .001, canCancel: true, at: { x: s.x, y: s.y, z: s.z || 0, dir: s.dir } }); if (s.z) G.player.poseOpts = { seated: true }; }; const sleep = ms => new Promise(r => setTimeout(r, ms));`;
const PRE = `(async()=>{ try { G.state.tips.off = 1; } catch (e) { } try { G.dev.set(true); G.state.dev.needs = true; } catch (e) { } window.closeUi = async () => { for (let i = 0; i < 20; i++) { const s = document.querySelector('.say'); if (s) s.click(); const b = [...document.querySelectorAll('button')].find(b => /^Got it$/.test(b.textContent.trim()) && b.offsetParent); if (b) b.click(); const x = document.querySelector('.modal .x'); if (x) x.click(); if (!s && !b && !x) break; await new Promise(r => setTimeout(r, 80)); } }; await closeUi(); })()`;
const show = v => `try { await G.shows.startNow('${v}'); for (let i = 0; i < 120; i++) { await sleep(500); await closeUi(); const s = G.shows.state(); if (!s || s.phase !== 'doors' || s.seated >= s.audience * .8) break; } G.shows.seatHere(); await sleep(400); return JSON.stringify(G.shows.state()); } catch (e) { return 'ERR ' + e.message; }`;
const SCENES = {
  /* the owner's screenshot: visitors on the two teal benches in front of the Big Blue tank */
  aqua: { url: '?scene=int:aquarium&t=13', js: `const O = 1, near = c => c.x > O + 18.8 && c.x < O + 24.2 && c.y > O + 16.4 && c.y < O + 17.7; for (const c of G.scene.ents) if (c !== G.player && c.poseOpts && c.poseOpts.seated && near(c)) c.hidden = false; G.player.x = O + 21.4; G.player.y = O + 19.4; G.player.dir = 3; G.snapCam(); return G.scene.ents.filter(c => c !== G.player && !c.hidden && near(c)).length + ' bench visitors';` },
  aqua_player: { url: '?scene=int:aquarium&t=13', js: `const O = 1, near = c => c.x > O + 18.8 && c.x < O + 24.2 && c.y > O + 16.4 && c.y < O + 17.7; for (const c of G.scene.ents) if (c !== G.player && c.poseOpts && c.poseOpts.seated && near(c)) c.hidden = false; const fx = G.scene.fixtures.filter(f => /aqua\\.bench/.test(f.asset.id) && Math.abs(f.y - O - 17) < 1); const free = fx.flatMap(f => f.seats).find(s => !G.scene.ents.some(c => c !== G.player && !c.hidden && Math.hypot(c.x - s.x, c.y - s.y) < .3)) || fx[0].seats[0]; sitP(free); G.snapCam();` },
  /* Chapter 1 at Nana Bea's: "sit in the chair by the range" (the Chapter step's own logic, old or new) */
  nana: { url: '?scene=int:home:grandma&t=10', js: `const sc = G.scene, rc = sc.fixtures.find(f => f.tags.includes('rangechair')); if (rc) { sitP(rc.seats[0]); } else { const p = G.player; let best = null, bd = 1e9; for (const f of sc.fixtures) if (f.asset.id === 'furn.home.armchair') { const d = Math.hypot(f.x - p.x, f.y - p.y); if (d < bd) { bd = d; best = f; } } sitP({ x: best.x, y: best.y, z: .35, dir: 0 }); } G.snapCam(); return rc ? 'range chair' : 'old: armchair centre';` },
  nana_fire: { url: '?scene=int:home:grandma&t=10', js: `const f = G.scene.fixtures.filter(f => f.asset.id === 'furn.home.armchair')[0]; sitP(f.seats[0]); G.snapCam();` },
  cafe: { url: '?scene=int:cafe&t=12.5', wait: 2500, js: `G.player.x = 5; G.player.y = 7; G.snapCam();` },
  diner: { url: '?scene=int:diner&t=12.5', wait: 2500, js: `` },
  cinema: { url: '?scene=city&t=19', wait: 300, js: show('cinema') },
  symphony: { url: '?scene=city&t=19', wait: 300, js: show('concerthall') },
  lecture: { url: '?scene=int:university:lecture&t=10.2', wait: 2500, js: `const sc = G.scene, fx = sc.fixtures.filter(f => /lecrow/.test(f.asset.id)); if (fx.length) { const s = fx[Math.floor(fx.length / 2)].seats[1]; sitP(s); } G.snapCam(); return sc.ents.filter(c => !c.hidden).length + ' ents';` },
  park: { url: '?scene=city&t=13', wait: 1500, js: `const W = G.world, FL = [1, 0, 3, 2]; let pick = null, n = 0; for (const ob of W.objs) { if (!/street\\.bench/.test(ob.id) || !ob.a.seats) continue; const B = ob.B; if (W.objs.some(q => q !== ob && q.size[2] > 1.4 && q.B[3] > B[0] - 1.5 && q.B[0] < B[3] + 5 && q.B[4] > B[1] - 1.5 && q.B[1] < B[4] + 5)) continue; if (++n === 12) { pick = ob; break; } pick = pick || ob; } const ob = pick, st = ob.a.seats.map(q => ob.flip ? { x: ob.x + q.y, y: ob.y + q.x, z: ob.z + q.z, dir: FL[q.dir] } : { x: ob.x + q.x, y: ob.y + q.y, z: ob.z + q.z, dir: q.dir }); await G.go('city', { x: st[0].x, y: st[0].y + 1.2, fade: false }); await sleep(600); for (const c of G.scene.ents) if (c !== G.player && c.isCitizen && Math.hypot(c.x - st[0].x, c.y - st[0].y) < 1.6 && c.seated) c.hidden = true; sitP({ x: st[0].x, y: st[0].y, z: st[0].z - W.heightAt(st[0].x, st[0].y), dir: st[0].dir }); let c = null; try { c = G.crowd.spawnNear(st[1].x, st[1].y, { anim: 'read', seated: true, z: .45, dir: st[1].dir, keep: true }); if (c) { c.x = st[1].x; c.y = st[1].y; } G.crowd.spawnNear(st[0].x + .6, st[0].y + 1.1, { anim: 'phone', dir: 3, keep: true }); G.crowd.spawnNear(st[0].x + .9, st[0].y - .9, { anim: 'talk', dir: 1, keep: true }); } catch (e) { return 'ERR ' + e.message; } G.snapCam(); return ob.id + ' at ' + ob.x + ',' + ob.y + (ob.flip ? ' flip' : '') + ' npc ' + !!c;` },
};
const br = await chromium.launch(); const dir = path.join(ROOT, 'out/shots'); fs.mkdirSync(dir, { recursive: true }); let errs = 0;
for (const id of Object.keys(SCENES)) {
  if (o.only && !o.only.split(',').includes(id)) continue; const S = SCENES[id];
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }); const pg = await ctx.newPage();
  await pg.addInitScript(() => { let s = 0x2545f491; Math.random = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; });
  pg.on('console', m => { if (m.type() === 'error') { errs++; console.log('[' + id + ' page error]', m.text().slice(0, 240)); } }); pg.on('pageerror', e => { errs++; console.log('[' + id + ' exception]', (e.stack || e.message).slice(0, 300)); });
  await pg.goto(`http://localhost:${port}/${S.url}`);
  try { await pg.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 60000 }); } catch (e) { console.log('!! ' + id + ' did not load'); }
  await pg.waitForTimeout(700); let r = '';
  try { await pg.evaluate(PRE); r = await pg.evaluate(`(async()=>{${sitP}${S.js}})()`); await pg.evaluate('closeUi()'); } catch (e) { errs++; r = 'EVAL ' + e.message.slice(0, 200); }
  await pg.waitForTimeout(S.wait || 900); try { await pg.evaluate('closeUi()'); await pg.evaluate(`document.querySelectorAll('.toast,.tip,.say,.roomcard,.place-card').forEach(e => { e.style.display = 'none'; })`); } catch (e) { } await pg.waitForTimeout(3200);
  const file = path.join(dir, `seatscene_${o.tag}_${id}.png`); await pg.screenshot({ path: file }); console.log(file, r || ''); await ctx.close();
}
console.log(errs ? errs + ' page errors' : 'no page errors'); await br.close(); srv.close();
