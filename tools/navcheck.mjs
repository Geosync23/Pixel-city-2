// navcheck: regression check for the guide arrow's LAST-METRE guidance (src/sim/navgoals.js + src/ui/navarrow.js).   node tools/navcheck.mjs [--root dir] [--only graph|audit] [--row name-part] [--rooms all] [--v]
//   1. ROOM GRAPH  every room (ROOMS of scenes/interior.js: venues, homes + bathrooms, showpiece sub-rooms, station, airport, mall; pubs / lobbies sampled unless --rooms all):
//        a. every door-like interactable is USED for real (G.go is intercepted) and where it leads is compared with the arrow's edge list (G.navArrow.edges);
//        b. from every room the arrow must find a way to the city and to every other room of the same building (G.navGoals.path), and G.navArrow.route must
//           return the first door of that way.
//   2. AUDIT       one scenario per "the game points you somewhere" row: the state is set up, the player is put in each scene on the way and the arrow's label
//        is compared with what it should say there (and that it points at something). These are placement checks: the real walks are in docs/reports/navgoals.md.
// Prints a pass/fail table; exit code 1 when something fails.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { pathToFileURL, fileURLToPath } from 'node:url';
const a = process.argv.slice(2), opt = { root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), only: '', rooms: '', row: '', v: false };
for (let i = 0; i < a.length; i++) { const k = a[i].replace(/^--/, ''); if (k === 'v') opt.v = true; else opt[k] = a[++i]; }
const ROOT = path.resolve(opt.root);
const { genModules } = await import(pathToFileURL(path.join(ROOT, 'tools/modules.mjs'))); genModules();
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.join(ROOT, u); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
const br = await chromium.launch(); let errs = 0, fails = 0;
async function page(url) {
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }), pg = await ctx.newPage();
  pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') { errs++; console.log('[page ' + m.type() + ']', m.text().slice(0, 300)); } }); pg.on('pageerror', e => { errs++; console.log('[page exception]', (e.stack || e.message).slice(0, 500)); });
  await pg.goto(`http://localhost:${port}/${url}`); await pg.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 90000 });
  await pg.evaluate(HELP); return pg;
}
const HELP = `window.sleep = ms => new Promise(r => setTimeout(r, ms));
window.dismiss = async () => { for (let i = 0; i < 40; i++) { const s = document.querySelector('.say'); if (s) s.click(); const x = document.querySelector('.modal .x'); if (x) x.click(); if (!document.querySelector('.say,.modal')) break; await sleep(40); } if (G.modal > 0 && !document.querySelector('.say,.modal')) G.modal = 0; };
window.T = (wd, hour) => { const n = G.now(); let d = 0; if (wd !== null && wd !== undefined) while ((n.weekday + d) % 7 !== wd) d++; G.state.t = (n.day + d) * 1440 + Math.round(hour * 60); for (const k of ['hunger', 'energy', 'hygiene', 'fun', 'social', 'bladder']) try { G.needs.add(k, 100); } catch (e) { } G.state.player.money = Math.max(G.state.player.money || 0, 900); G.advance(1); };
window.arrow = () => { const t = G.navArrow.target(), c = G.navGoals.current(); return { scene: G.scene.id, goal: c && c.id, mode: t && t.mode, label: t ? t.label : null, x: t && t.x, y: t && t.y, shown: G.navArrow.el.classList.contains('on') }; };`;
const pad = (s, n) => (String(s) + ' '.repeat(n)).slice(0, n);
const row = (ok, name, detail) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${pad(name, 44)} ${detail || ''}`); };

/* ------------------------------------------------------------------ 1. room graph */
const GRAPH = `
const m = await import('/src/scenes/interior.js'), all = ${JSON.stringify(opt.rooms === 'all')}; await dismiss();
const ids = [...m.ROOMS.keys()].filter(k => all || !/^(pub|lobby):/.test(k) || /^(pub:(1|2|40)|lobby:(1|7|20))$/.test(k));
const CAND = /exit|leave|door|lift|elevator|stair|enter|back|lobby|gate|platform|tram|curtain|auditorium|screen \\d|chamber|tunnel|bathroom|into the|climb|ladder|hatch|turnstile|team only|room \\d/i;
const ALIAS = { airtram: ['int:airport:terminal', 'int:airport:concourse'] }, go0 = G.go, sa0 = G.startActivity, out = [], N = G.navGoals, rootOf = N.rootOf;
/* one-way or closed by design: the arrow is not expected to lead INTO these (the plane of the intro, the old cinema hall, City Hall's former lobby id) */
const NOENTRY = /^(airport:plane|cinema:hall|lobby:4)$/;
for (const id of ids) {
  const sid = 'int:' + id; try { G.go = go0; await G.go(sid, { fresh: true }); } catch (e) { out.push({ id, err: String(e).slice(0, 120) }); continue; } await sleep(60); await dismiss();
  if (!G.scene || G.scene.id !== sid) { out.push({ id, err: 'landed in ' + (G.scene && G.scene.id) }); continue; }
  const edges = G.navArrow.edges(sid), rec = { id, bad: [], doors: 0, routes: 0 };
  for (const it of G.interactables().slice()) {
    if ((it.scene && it.scene !== sid) || !isFinite(it.x) || (it.visible && !it.visible())) continue; const e = edges.filter(q => Math.abs(q.x - it.x) < .8 && Math.abs(q.y - it.y) < .8);
    if (!(it.exit || it.navTo || e.length || CAND.test(it.label || ''))) continue; if (it.ent || /^(Sit|Talk|Restroom|Look|Read|Watch|Spot|Species)/.test(it.label || '')) { if (!e.length) continue; }
    let cap = null; G.go = to => { if (!cap) cap = to; return Promise.resolve(null); }; G.startActivity = act => { try { act && act.done && act.done(); } catch (x) { } };
    const sc = G.scene; try { const r = it.use(G, it); if (r && r.then) await Promise.race([r, sleep(200)]); } catch (x) { } await sleep(20);
    await dismiss(); if (G.cutscene) { const t0 = performance.now(); while (G.cutscene && performance.now() - t0 < 15000) await sleep(100); if (G.cutscene) G.cutscene = null; await sleep(900); }   /* lifts: a short ride, then the go() */
    G.camTarget = null; const p = G.player; p.hidden = false; p.pose = null; p.zoff = 0; if (G.busy) G.endActivity(false);
    const tos = e.map(q => q.to); rec.doors++;
    if (cap && !(tos.includes(cap) || (ALIAS[cap] || []).some(x => tos.includes(x)))) rec.bad.push('"' + it.label + '" really leads to ' + cap + ' but the arrow thinks ' + (tos.length ? tos.join('/') : 'it is no door'));
    else if (it.exit && !cap && !tos.some(Boolean)) rec.bad.push('exit "' + it.label + '" leads nowhere the arrow knows');
    if (G.scene !== sc) break;
  }
  G.go = go0; G.startActivity = sa0;
  /* b. connectivity from this (live) room */
  if (!N.path(sid, 'city')) rec.bad.push('no way out to the city');
  for (const other of ids) { if (other === id || rootOf(other) !== rootOf(id) || NOENTRY.test(other)) continue; const want = N.path(sid, 'int:' + other); rec.routes++;
    if (!want) { rec.bad.push('no path to ' + other); continue; } const hop = G.navArrow.route('int:' + other); if (!hop || hop.to !== want[1]) { const alt = hop && N.path(hop.to, 'int:' + other); if (!(alt && alt.length === want.length - 1)) rec.bad.push('route(' + other + ') points at "' + (hop && hop.label) + '" -> ' + (hop && hop.to) + ', expected a door to ' + want[1]); } }
  out.push(rec);
}
G.go = go0; G.startActivity = sa0; return out;`;

/* ------------------------------------------------------------------ 2. audit scenarios (filled from docs/reports/navgoals.md's table) */
const AUDIT = JSON.parse(fs.readFileSync(new URL('./navcheck.audit.json', import.meta.url), 'utf8'));
const RUN = `async (row) => {
  await dismiss(); if (G.busy) G.endActivity(false); G.phone.setWaypoint(null); try { G.nav.cancel(); } catch (e) { } G.navGoals.clear(); G.navGoals.select(null);
  const res = []; let env = {};
  try { env = (await (0, eval)('(async()=>{' + row.setup + '})')()) || {}; } catch (e) { return [{ ok: false, at: 'setup', got: String(e).slice(0, 200) }]; }
  for (const c of row.checks) {
    try { if (c.go === 'city') { const d = G.navGoals.doorOf(row.door || ''); if (G.scene.id !== 'city') await G.go('city', d ? { x: d.x, y: d.y + 2.5 } : {}); if (d) { G.player.stop(); G.player.x = d.x; G.player.y = d.y + 2.5; } await sleep(120); await dismiss(); }
      else if (c.go && G.scene.id !== c.go) { await G.go(c.go, c.fresh === false ? {} : { fresh: true }); await sleep(120); await dismiss(); }
      if (c.do) await (0, eval)('(async()=>{' + c.do + '})')(); await sleep(c.wait || 450); await dismiss(); await sleep(60);
      const a = arrow(), re = new RegExp(c.label, 'i'); let ok = a.label !== null && re.test(a.label) && (!c.mode || a.mode === c.mode) && (!c.goal || a.goal === c.goal) && a.shown;
      if (c.none) ok = a.label === null;
      let reach = '';
      if (ok && a.mode === 'point' && a.scene === G.scene.id && !c.none && c.reach !== false) { const p = G.player, sx = p.x, sy = p.y; const can = p.goTo(G.world, a.x, a.y, { snap: 8, limit: 60000 }); p.stop && p.stop(); p.path = null; p.x = sx; p.y = sy; if (!can) { ok = false; reach = ' (target not reachable on foot)'; } }
      res.push({ ok, at: c.go || G.scene.id, got: (a.label === null ? 'no arrow' : a.mode + ': ' + a.label) + reach, want: c.none ? 'no arrow' : c.label });
    } catch (e) { res.push({ ok: false, at: c.go, got: 'error ' + String(e).slice(0, 160), want: c.label }); }
  }
  if (row.after) try { await (0, eval)('(async()=>{' + row.after + '})')(); } catch (e) { }
  return res;
}`;

if (opt.only !== 'audit' && !opt.row) {
  console.log('== 1. room graph =='); const pg = await page('?scene=city&t=11');
  const out = await pg.evaluate(`(async()=>{${GRAPH}})()`); let doors = 0, routes = 0, bad = 0;
  for (const r of out) { if (r.err) { row(false, 'room ' + r.id, r.err); bad++; continue; } doors += r.doors; routes += r.routes; if (r.bad.length) { bad++; for (const b of r.bad) row(false, 'room ' + r.id, b); } else if (opt.v) row(true, 'room ' + r.id, `${r.doors} doors, ${r.routes} routes`); }
  row(!bad, `room graph: ${out.length} rooms`, `${doors} doors used for real, ${routes} room-to-room routes checked, ${bad} rooms with problems`);
  await pg.context().close();
}
if (opt.only !== 'graph') {
  console.log('== 2. audit scenarios (arrow label per scene on the way) ==');
  let pg = null, url = null;
  for (const r of AUDIT) {
    if (opt.row && !r.name.includes(opt.row)) continue;
    const u = r.url || '?scene=city&t=11'; if (!pg || u !== url || r.fresh) { if (pg) await pg.context().close(); pg = await page(u); url = u; }
    let res; try { res = await pg.evaluate(`(${RUN})(${JSON.stringify(r)})`); } catch (e) { res = [{ ok: false, at: 'run', got: String(e.message).slice(0, 200) }]; }
    const ok = res.every(q => q.ok); row(ok, r.name, ok && !opt.v ? res.map(q => q.got).join('  >  ').slice(0, 220) : '');
    if (!ok || opt.v) for (const q of res) console.log(`        ${q.ok ? 'ok  ' : 'FAIL'} ${pad(q.at, 26)} got "${q.got}"${q.ok ? '' : '   want /' + q.want + '/'}`);
  }
  if (pg) await pg.context().close();
}
console.log(`\n${fails ? fails + ' FAILED' : 'all passed'}${errs ? `, ${errs} page errors` : ', 0 page errors'}`);
await br.close(); srv.close(); process.exit(fails || errs ? 1 : 0);
