// Seating: a save made WHILE SEATED by one build must load cleanly in another.   node tools/seatsave.mjs --old before.html [--new dist/index.html]
// In the old build: sit on a cafe seat, save; sit in Nana's armchair the old Chapter way, save. Each save is then loaded through the title screen of
// the new build: no page errors, the player is in the saved room, not seated, and can walk (a path to the exit exists). Screenshots: out/shots/seatsave_<case>.png
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { ROOT } from './artfiles.mjs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const a = process.argv.slice(2), o = { old: '', new: 'dist/index.html' }; for (let i = 0; i < a.length; i++) o[a[i].slice(2)] = a[++i];
const B = [fs.readFileSync(path.resolve(o.old || o.new), 'utf8'), fs.readFileSync(path.resolve(o.new), 'utf8')], BASE = fs.readFileSync(path.join(ROOT, 'tools/perf_save.json'), 'utf8');
const srv = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(B[+(req.url.split('?')[0].slice(1) || 0)] || B[0]); }); await new Promise(r => srv.listen(0, r)); const U = `http://localhost:${srv.address().port}/`;
const br = await chromium.launch(); let bad = 0;
async function open(i, save) {
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true }), pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.goto(U + i); await pg.evaluate(s => localStorage.setItem('maplebay.save.v1', s), save);
  await pg.goto(U + i); await pg.waitForFunction(() => window.G && G.onTitle !== undefined && !document.getElementById('load'), null, { timeout: 180000 }); await pg.waitForTimeout(800);
  await pg.touchscreen.tap(195, 440); await pg.waitForFunction(() => !G.onTitle && G.scene, null, { timeout: 60000 }); await pg.waitForTimeout(2000);
  return { ctx, pg, errs };
}
const CASES = {
  cafe: `await G.go('int:cafe', { fade: false }); await new Promise(r => setTimeout(r, 800)); const fx = G.scene.fixtures.find(f => f.seats.length && !f.seats[0].lie && !f.seats[0].stand), s = fx.seats[0]; G.startActivity({ label: 'Sitting', anim: 'sit', minutes: 90, rate: 5, canCancel: true, at: { x: s.x, y: s.y, z: s.z || 0, dir: s.dir } }); G.player.poseOpts = { seated: true };`,
  nana: `await G.go('int:home:grandma', { fade: false }); await new Promise(r => setTimeout(r, 800)); const fx = G.scene.fixtures.find(f => f.asset.id === 'furn.home.armchair'); G.startActivity({ label: 'Ten minutes in the chair', anim: 'sit', minutes: 10, rate: 1.2, at: { x: fx.x, y: fx.y, z: .35, dir: 0 } });`,
};
for (const id of Object.keys(CASES)) {
  const A = await open(0, BASE); const save = await A.pg.evaluate(`(async()=>{ try { G.state.tips.off = 1; } catch (e) { } ${CASES[id]} await new Promise(r => setTimeout(r, 300)); return G.save(); })()`); await A.ctx.close();
  const N = await open(1, save);
  const r = await N.pg.evaluate(`(async()=>{ const p = G.player, W = G.world, ex = G.scene.interactables.find(i => i.exit) || G.scene.spawn; await new Promise(r => setTimeout(r, 600)); return { scene: G.scene.id, busy: !!G.busy, pose: p.pose, zoff: p.zoff, blocked: W.isBlocked(p.x, p.y), canWalk: !!(ex && p.goTo(W, ex.x, ex.y - .4, { snap: 6 })), at: [+p.x.toFixed(2), +p.y.toFixed(2)] }; })()`);
  await N.pg.waitForTimeout(1500); await N.pg.screenshot({ path: path.join(ROOT, 'out/shots', 'seatsave_' + id + '.png') });
  const ok = !N.errs.length && !r.busy && !r.pose && r.canWalk; if (!ok) bad++;
  console.log((ok ? 'ok   ' : 'FAIL ') + id.padEnd(6) + JSON.stringify(r) + ' page errors: ' + N.errs.length + ' ' + N.errs.slice(0, 2).join(' | ')); await N.ctx.close();
}
await br.close(); srv.close(); process.exitCode = bad ? 1 : 0;
