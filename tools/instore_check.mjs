// tools/instore_check.mjs — checks the "only in store" split (src/data/instore.js, owner msgs 167-168) inside the BUILT game (dist/index.html).
//   node tools/instore_check.mjs [--verbose]     exit 0 = every check passes. Prints the split per category (furniture / decor and clothes).
// Checks: (1) about 55-60% of home goods and of clothes are in store only; every goods category and every clothing slot / accessory kind keeps at least one
//   orderable piece; the older tiered home goods keep t0 + t1 online; SCRIPTED ids are online.
// (2) every in-store-only piece is really sold in at least one enterable shop that is open at sensible hours and can be routed to:
//   goods -> a store / counter whose window (G.shop.stock) lists it; clothes -> its anchor shop (always on the rails there when in season).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), verbose = process.argv.includes('--verbose');
const { chromium } = createRequire(import.meta.url)('playwright');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' }, base = path.join(ROOT, 'dist');
const srv = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.join(base, u); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
await new Promise(r => srv.listen(0, r));
const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 390, height: 844 } }); let pageErr = 0; pg.on('pageerror', e => { pageErr++; console.log('[page exception]', e.message); });
await pg.goto(`http://localhost:${srv.address().port}/?scene=city&t=12`); await pg.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene && window.G.instore, null, { timeout: 60000 });
const R = await pg.evaluate(async () => {
  const I = G.instore, C = G.clothesShop, out = { goods: {}, legacy: { n: 0, store: 0 }, clothes: {}, errors: [], warns: [], stores: {} };
  const sensible = v => { if (!v || !v.hours) return true; let days = 0; for (const h of v.hours) if (h && h[0] <= 12 && h[1] >= 17) days++; return days >= 5; };
  const routeOk = new Map(), canRoute = id => { if (!routeOk.has(id)) routeOk.set(id, !!(G.places.get(id) && (G.nav ? G.nav.routeTo(id).length : true))); return routeOk.get(id); };
  const stockCache = new Map(), sells = (venue, id) => { if (!stockCache.has(venue)) stockCache.set(venue, new Set((G.shop.stock(venue) || []).map(i => i.id))); return stockCache.get(venue).has(id); };
  // enterable: a goods store room, or a venue with an interior / a room of its own, or a walk-up counter in the city (stalls)
  const enterable = id => { const v = I.venue(id), p = G.places.get(id); return !!(p && (G.goods.store(id) || (v && (v.interior || v.type === 'stall' || /^mall:|^pub:/.test(id))) || p.kind === 'stall')); };
  // home goods
  const goods = G.goods.stores().flatMap(s => G.goods.stock(s.id)).reduce((m, g) => m.set(g.id, g), new Map());
  const fam = {};
  for (const g of goods.values()) {
    const on = I.online(g.id), r = out.goods[g.cat] || (out.goods[g.cat] = { goods: 0, store: 0, fams: 0, storeFams: 0, online: [] }); r.goods++; if (!on) r.store++;
    if (!fam[g.family]) { fam[g.family] = 1; r.fams++; if (!on) r.storeFams++; else r.online.push(g.id); }
    if (on) continue;
    const at = [...new Set([...g.stores])].filter(s => enterable(s) && sensible(I.venue(s)) && canRoute(s) && sells(s, g.id));
    if (!at.length) out.errors.push(`orphan good ${g.id} (${g.name}): sold at ${g.stores.join(', ')}`);
    for (const s of at) out.stores[s] = (out.stores[s] || 0) + 1;
  }
  for (const k in out.goods) { if (!out.goods[k].online.length) out.errors.push(`goods category ${k} has nothing orderable`); out.goods[k].online = out.goods[k].online.length; }
  // older tiered home goods (Nest & Wire + the home computer's online shop)
  for (const it of G.shop.stock('homegoods').filter(i => i.category === 'homegood' && !/^g_/.test(i.id))) {
    out.legacy.n++; const on = I.online(it.id); if (!on) out.legacy.store++;
    if (/_t[01]$/.test(it.id) && !on) out.errors.push(`legacy ${it.id} should be online (t0 / t1)`);
    if (!on && !sells('homegoods', it.id)) out.errors.push(`legacy ${it.id} not sold at Nest & Wire`);
  }
  // clothes
  const P = I.pieces();
  const season = G.now().season, kinds = {};
  for (const p of P) {
    const k = p.slot === 'acc' ? 'acc:' + p.kind : p.slot, on = p.shops.includes('online'), r = out.clothes[k] || (out.clothes[k] = { n: 0, store: 0 }); r.n++; if (!on) r.store++;
    if (on !== I.online(p.id)) out.errors.push(`piece ${p.id}: shops and rule disagree`);
    const seasonal = p.season !== null && p.season !== undefined;
    if (on && !seasonal) kinds[k] = 1;
    if (on) continue;
    const phys = p.shops.filter(s => s !== 'online'); if (!phys.length) { out.errors.push(`orphan piece ${p.id}: no shop`); continue; }
    const ok = phys.filter(s => { const place = C.placeOf(s), venue = C.VENUE[s] || place; return place && canRoute(place) && sensible(I.venue(venue)); });
    if (!ok.length) { out.errors.push(`orphan piece ${p.id} (${p.name}): ${phys.join(', ')} not reachable / not open`); continue; }
    const inSeason = !seasonal || p.season === season || (Array.isArray(p.season) && p.season.includes(season));
    if (inSeason && !ok.some(s => C.stock(s).some(q => q.id === p.id))) out.errors.push(`piece ${p.id} is in season but on no rail this week`);
    out.stores['clothes:' + ok[0]] = (out.stores['clothes:' + ok[0]] || 0) + 1;
  }
  for (const k in out.clothes) if (!kinds[k]) out.errors.push(`clothing slot ${k} has nothing orderable all year`);
  out.hours = Object.fromEntries(['arena:store', 'hotel:gifts', 'market_stalls', 'mall:kicks', 'mall:bloom', 'mall:thread', 'pub:12', 'pub:44', 'gym', 'clothing', 'homegoods', 'mall:nest'].map(id => [id, JSON.stringify((I.venue(id) || {}).hours && I.venue(id).hours[0])]));
  return out;
});
await br.close(); srv.close();
const pct = (a, b) => (b ? (100 * a / b).toFixed(0) + '%' : '-');
let gT = 0, gS = 0, fT = 0, fS = 0; console.log('HOME GOODS            goods  in store        families  in store   orderable families');
for (const [k, r] of Object.entries(R.goods)) { gT += r.goods; gS += r.store; fT += r.fams; fS += r.storeFams; console.log(`  ${k.padEnd(14)} ${String(r.goods).padStart(5)}  ${String(r.store).padStart(4)} ${pct(r.store, r.goods).padStart(4)}       ${String(r.fams).padStart(4)}  ${String(r.storeFams).padStart(4)} ${pct(r.storeFams, r.fams).padStart(4)}   ${r.online}`); }
console.log(`  ${'ALL'.padEnd(14)} ${String(gT).padStart(5)}  ${String(gS).padStart(4)} ${pct(gS, gT).padStart(4)}       ${String(fT).padStart(4)}  ${String(fS).padStart(4)} ${pct(fS, fT).padStart(4)}`);
console.log(`  older tiered home goods (Nest & Wire): ${R.legacy.store} of ${R.legacy.n} in store only (${pct(R.legacy.store, R.legacy.n)})`);
let cT = 0, cS = 0; console.log('CLOTHES               pieces in store');
for (const [k, r] of Object.entries(R.clothes)) { cT += r.n; cS += r.store; console.log(`  ${k.padEnd(14)} ${String(r.n).padStart(5)}  ${String(r.store).padStart(4)} ${pct(r.store, r.n).padStart(4)}`); }
console.log(`  ${'ALL'.padEnd(14)} ${String(cT).padStart(5)}  ${String(cS).padStart(4)} ${pct(cS, cT).padStart(4)}`);
if (verbose) { console.log('in-store pieces per first verified shop:', R.stores); console.log('hours (Monday):', R.hours); }
const share = [['home goods', gS / gT], ['clothes', cS / cT]]; for (const [n, s] of share) if (s < .5 || s > .65) R.errors.push(`${n}: ${(s * 100).toFixed(0)}% in store only, outside 50-65%`);
console.log(R.errors.length ? `${R.errors.length} problem(s):\n  ` + R.errors.slice(0, verbose ? 999 : 30).join('\n  ') : 'OK: every in-store-only piece is sold in an enterable, reachable shop with sensible hours; every category / slot keeps an orderable piece.');
if (pageErr) console.log(`${pageErr} page error(s)`);
process.exit(R.errors.length || pageErr ? 1 : 0);
