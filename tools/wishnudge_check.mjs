// Wish-list reminder check (src/sim/wishnudge.js): New Game at 390x844 touch, wish-list by tapping Roomy / Closet, walk past shops, tap the banner, closed shop, cab ride. Run after node tools/build.mjs. Shots: out/shots/wish_*.png
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const ROOT = '/home/user/Pixel-city-2'; const require = createRequire(ROOT + '/'); const { chromium } = require('playwright');
const HTML = fs.readFileSync(path.join(ROOT, 'dist/index.html'), 'utf8');
const OUT = path.join(ROOT, 'out/shots'); fs.mkdirSync(OUT, { recursive: true });
async function boot(W = 390, H = 844) {
  const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(HTML); }); await new Promise(r => srv.listen(0, r)); const U = `http://localhost:${srv.address().port}/`;
  const br = await chromium.launch(); const ctx = await br.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push('PAGEERROR ' + e.message.slice(0, 300))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  await pg.goto(U); await pg.evaluate(() => localStorage.clear()); await pg.goto(U);
  await pg.waitForFunction(() => window.G && G.onTitle !== undefined && !document.getElementById('load'), null, { timeout: 180000 }); await pg.waitForTimeout(800);
  const tap = async (x, y, w = 350) => { await pg.touchscreen.tap(x, y); await pg.waitForTimeout(w); };
  const find = (re, sc = 'button') => pg.evaluate(([s, sc]) => { const x = new RegExp(s, 'i'), e = [...document.querySelectorAll(sc)].find(b => b.offsetWidth && x.test((b.getAttribute('aria-label') || b.textContent || '').trim())); if (!e) return null; e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }, [re.source, sc]);
  const tapText = async (re, sc = 'button', w) => { const r = await find(re, sc); if (!r) throw new Error('no button ' + re); await tap(r[0], r[1], w); return r; };
  const shot = n => pg.screenshot({ path: path.join(OUT, 'wish_' + n + '.png') });
  const close = async () => { await br.close(); srv.close(); };
  return { br, pg, errs, tap, find, tapText, shot, close };
}
async function newGame(B) {
  const { pg, tapText } = B;
  await tapText(/^New Game$/, 'button', 1200);
  await tapText(/^Next ▶/, 'button', 1200); await tapText(/^Surprise me/, 'button', 600); await tapText(/^Next ▶/, 'button', 1500);
  await tapText(/./, '.hp-card', 500); await tapText(/^Move in/, 'button', 2500);
  await pg.waitForFunction(() => window.G && G.intro, null, { timeout: 60000 });
  await pg.evaluate(() => G.intro.skip()); await pg.waitForTimeout(4000);
  await pg.waitForFunction(() => !G.intro.active && G.scene, null, { timeout: 60000 });
  await pg.evaluate(() => { try { G.state.tips.off = 1; } catch (e) { } try { G.firstTime.setEnabled(false); } catch (e) { } });
  await pg.waitForTimeout(1000);
}
const B = await boot(); const { pg, shot } = B; let bad = 0; const say = (ok, t) => { if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + t); };
await newGame(B);
await pg.evaluate(() => { window.__nudges = []; G.on('wish:nudge', (p, ids) => window.__nudges.push({ p, ids: ids.slice(), t: G.state.t, ride: !!G.transit.ride })); window.__banners = []; G.on('phone:notify', e => { if (e.title === 'On your wish list') window.__banners.push(e.text); }); });
const info = await pg.evaluate(() => {
  const goods = G.orders.sellers ? Object.keys(G.instore.pieces ? {} : {}) : [];
  /* an in-store home good sold at Warp & Weft; an in-store, in-season clothes piece anchored at Hollowell & Sons */
  const GB = window.__GB = window.__GB || null; return null; });
const pick = await pg.evaluate(() => {
  const anyGood = []; for (const s of G.goods.stores()) if (s.id === 'goods:warp') for (const g of G.goods.stock(s.id)) if (!G.instore.online(g.id)) anyGood.push(g.id);
  const season = G.now().season, pieces = G.instore.pieces().filter(p => !G.instore.online(p.id) && p.shops.includes('cs_hollowell') && (p.season === null || p.season === undefined || p.season === season || (Array.isArray(p.season) && p.season.includes(season))) && !G.wardrobe.owns(p.id));
  return { good: anyGood[0], goodName: G.goods.stock('goods:warp').find(g => g.id === anyGood[0]).name, goodStores: G.instore.where(anyGood[0], 9).map(r => r.place), piece: pieces[0].id, pieceName: pieces[0].name, pieceShops: pieces[0].shops };
});
console.log('pick', JSON.stringify(pick));
/* 1. wish-list through the real UI (apps unlocked by API: Roomy and Closet are locked at the start of a new game) */
await pg.evaluate(() => { for (const a of ['roomy', 'closet']) { G.apps.release(a, true); G.apps.install(a); } });
await pg.evaluate(id => G.phone.open('roomy', { good: id }), pick.good); await pg.waitForTimeout(900);
console.log('btns', await pg.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetWidth).map(b => (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 30)).join(' | '))); await shot('00_roomy');
await B.tapText(/^Wish list$/, 'button', 600); await shot('01_roomy_wished');
await pg.evaluate(() => G.phone.open('closet', { tab: 'shops' })); await pg.waitForTimeout(700);
await B.tapText(/^Open the catalogue$/, 'button', 900);
const sr = await B.find(/./, 'input'); console.log('search box', sr);
if (sr) { await B.tap(sr[0], sr[1]); await pg.keyboard.type(pick.pieceName, { delay: 10 }); await pg.waitForTimeout(800); }
await shot('02_closet_search');
const cell = await pg.evaluate(() => { const c = [...document.querySelectorAll('#phone button, .ph-body button, button')].filter(b => b.offsetWidth && b.closest('.as-grid, .cw-grid, [class*=grid]')); const e = c[0]; if (!e) return null; const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2, e.className]; });
console.log('cell', JSON.stringify(cell)); if (cell) await B.tap(cell[0], cell[1], 800);
await B.tapText(/Wish list$/, 'button', 600); await shot('03_closet_wished');
const wl = await pg.evaluate(() => ({ goods: G.orders.wish(), clothes: G.wardrobe.wishes() })); console.log('wish lists', JSON.stringify(wl));
say(wl.goods.includes(pick.good), 'home piece on the Roomy wish list (tapped)'); say(wl.clothes.includes(pick.piece), 'clothes piece on the Closet wish list (tapped)');
await B.tapText(/^Put phone away$/, 'button', 600);
console.log('index', await pg.evaluate(() => JSON.stringify(G.wishNudge.index().map(e => [e.place, e.ids.length]))));
/* 2. out into the city */
await pg.evaluate(() => { const d = G.sceneCache.get('city').world.pois.find(p => p.type === 'door' && p.room === 'home:' + G.state.home.id); return G.go('city', { poi: d.id }); }); await pg.waitForTimeout(2500);
const spot = (place, r = 14) => pg.evaluate(([place, r]) => { const p = G.places.get(place), w = G.world, ok = (x, y) => x > 1 && y > 1 && x < w.nw / 2 - 1 && y < w.nh / 2 - 1 && !w.nav[Math.floor(y * 2) * w.nw + Math.floor(x * 2)];
  const out = []; for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r; if (ok(x, y)) out.push([x, y]); } return { door: [p.x, p.y], pts: out }; }, [place, r]);
const tele = (x, y) => pg.evaluate(([x, y]) => { G.player.x = x; G.player.y = y; G.player.path = null; G.pending = null; G.snapCam && G.snapCam(); }, [x, y]);
const walk = async (x, y, ms = 25000) => { const ok = await pg.evaluate(([x, y]) => G.player.goTo(G.world, x, y, { snap: 8 }), [x, y]); if (!ok) return false; await pg.waitForFunction(() => !G.player.path, null, { timeout: ms }).catch(() => {}); await pg.waitForTimeout(700); return true; };
const dist = place => pg.evaluate(p => { const q = G.places.get(p); return Math.hypot(q.x - G.player.x, q.y - G.player.y).toFixed(1); }, place);
const clearB = async () => { for (let i = 0; i < 6; i++) { const x = await pg.evaluate(() => { const b = [...document.querySelectorAll('#ph-banners .ph-banner')].find(e => !/On your wish list/.test(e.textContent)); if (!b) return null; const q = b.querySelector('.ph-banner-x').getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }); if (!x) break; await B.tap(x[0], x[1], 400); } await pg.waitForTimeout(300); };
const n = () => pg.evaluate(() => window.__nudges.length);
const setClock = h => pg.evaluate(h => { const d = Math.floor(G.state.t / 1440); G.state.t = d * 1440 + h * 60; return G.now().clock + ' wd' + G.now().weekday; }, h);
console.log('clock', await setClock(14));
let S = await spot('goods:warp'); console.log('warp', JSON.stringify(S.door), S.pts.length);
await tele(...S.pts[0]); await pg.waitForTimeout(1200); console.log('start dist', await dist('goods:warp'), 'nudges', await n());
say(await n() === 0, 'no reminder 14 units away');
await clearB(); await walk(S.door[0], S.door[1] + 0); console.log('at door dist', await dist('goods:warp'));
let N = await pg.evaluate(() => window.__nudges.slice()); console.log('nudges', JSON.stringify(N), 'banners', JSON.stringify(await pg.evaluate(() => window.__banners)));
say(N.length === 1 && N[0].p === 'goods:warp', 'one reminder when walking up to Warp & Weft');
await shot('04_banner_warp');
const bannerBox = await pg.evaluate(() => { const b = document.querySelector('#ph-banners .ph-banner'); if (!b) return null; const r = b.getBoundingClientRect(), t = b.querySelector('.ph-banner-t span'); return { l: r.left, r: r.right, top: r.top, bottom: r.bottom, sw: t && t.scrollWidth, cw: t && t.clientWidth, sh: t && t.scrollHeight, ch: t && t.clientHeight, text: b.textContent }; }); console.log('banner box', JSON.stringify(bannerBox));
/* walk away and back the same day */
await walk(...S.pts[S.pts.length - 1]); console.log('away', await dist('goods:warp')); await clearB(); await walk(S.door[0], S.door[1]); await pg.waitForTimeout(1500);
say(await n() === 1, 'walk away and back the same day: no second reminder (' + await n() + ')');
/* next day, same hour */
await walk(...S.pts[0]); await pg.evaluate(() => { G.state.t += 1440; }); console.log('next day', await pg.evaluate(() => G.now().clock + ' wd' + G.now().weekday));
await pg.waitForTimeout(1500); await clearB(); await walk(S.door[0] + .5, S.door[1] + .5); for (let i = 0; i < 12 && await n() < 2; i++) { await clearB(); await pg.waitForTimeout(800); }
console.log('diag', await pg.evaluate(() => JSON.stringify({ st: G.wishNudge.state(), modal: G.modal, busy: !!G.busy, cut: !!G.cutscene, ban: [...document.querySelectorAll('#ph-banners > *')].map(e => e.textContent), ch: G.chapters.active(), rel: G.rel.active(), shift: G.jobs.onShift(), js: G.jobStory.active(), ride: !!G.transit.ride, pend: !!G.transit.pending, mg: G.minigame.isOpen(), ph: G.phone.isOpen, wp: G.phone.waypoint(), open: G.instore.hours('goods:warp'), dist: Math.hypot(G.player.x - G.places.get('goods:warp').x, G.player.y - G.places.get('goods:warp').y), scene: G.scene.id, ix: G.wishNudge.index().length, chk: G.wishNudge.check() }))); say(await n() === 2, 'next day: the reminder again (' + await n() + ')'); await shot('05_banner_nextday');
/* tap it: walks in */
await walk(...S.pts[0]); await pg.evaluate(() => { G.state.t += 45; G.wishNudge.debug.reset(); }); await clearB(); const nb = await n(); await walk(S.door[0], S.door[1]); for (let i = 0; i < 12 && await n() === nb; i++) { await clearB(); await pg.waitForTimeout(800); }
console.log('tapdiag', await n(), nb, await pg.evaluate(() => JSON.stringify({ ban: [...document.querySelectorAll('#ph-banners > *')].map(e => e.textContent), last: window.__banners.slice(-2), st: G.wishNudge.state() })));
const bb = await B.find(/On your wish list/, '.ph-banner-main'); console.log('banner button', JSON.stringify(bb));
if (bb) { await shot('06_before_tap'); await B.tap(bb[0], bb[1], 300); await pg.waitForFunction(() => G.scene.id !== 'city', null, { timeout: 15000 }).catch(() => {}); await pg.waitForTimeout(1500); }
const sc = await pg.evaluate(() => G.scene.id); console.log('after tap scene', sc); say(sc === 'int:goods:warp', 'tap the banner: walked in to Warp & Weft'); await shot('07_after_tap_inside');
/* 3. clothes shop: Hollowell & Sons (Sun 12-17). Closed first: 20:00 */
await pg.evaluate(() => { G.go('city', { poi: G.places.get('goods:warp').poi.id }); }); await pg.waitForTimeout(2500);
S = await spot('cs_hollowell'); console.log('hollowell', JSON.stringify(S.door), S.pts.length);
console.log('clock', await setClock(20)); const n0 = await n();
await tele(...S.pts[0]); await pg.waitForTimeout(800); await clearB(); await walk(S.door[0], S.door[1]); await pg.waitForTimeout(1200);
for (let i = 0; i < 8; i++) { await clearB(); await pg.waitForTimeout(700); } const cl = await pg.evaluate(() => ({ ban: document.querySelectorAll('#ph-banners > *').length, d: Math.hypot(G.player.x - G.places.get('cs_hollowell').x, G.player.y - G.places.get('cs_hollowell').y), open: G.instore.hours('cs_hollowell') })); console.log('closed diag', JSON.stringify(cl));
say(await n() === n0 && cl.ban === 0 && cl.d < 4.5 && !cl.open.open, 'closed shop (20:00): silent, with no other banner showing, standing ' + cl.d.toFixed(1) + ' from the door'); await shot('08_closed_silent');
await walk(...S.pts[0]); console.log('clock', await setClock(13)); await clearB(); await walk(S.door[0], S.door[1]); for (let i = 0; i < 12 && await n() === n0; i++) { await clearB(); await pg.waitForTimeout(800); }
N = await pg.evaluate(() => window.__nudges.slice(-1)[0]); console.log('clothes nudge', JSON.stringify(N), JSON.stringify(await pg.evaluate(() => window.__banners.slice(-1))));
say(await n() === n0 + 1 && N.p === 'cs_hollowell', 'open clothes shop (13:00): one reminder'); await shot('09_banner_clothes');
/* 4. a cab ride past it: silent */
const gal = await pg.evaluate(() => { const season = G.now().season; const p = G.instore.pieces().find(p => !G.instore.online(p.id) && G.clothesShop.whereSold(p.id).includes('mall:thread') && (p.season == null || p.season === season) && !G.wardrobe.owns(p.id)); G.wardrobe.wish(p.id); return [p.id, p.name]; }); console.log('galleria piece wished by API', JSON.stringify(gal));
await pg.evaluate(() => { G.wishNudge.debug.reset(); }); await clearB();
const plan = await pg.evaluate(() => { const d = G.places.get('cs_hollowell'), V = G.places.list('venue').filter(p => p.poi && p.poi.type === 'door' && !/^home/.test(p.id));
  let best = null; for (const a of V) for (const b of V) { if (a === b) continue; const ab = Math.hypot(b.x - a.x, b.y - a.y); if (ab < 30 || ab > 70) continue; const da = Math.hypot(a.x - d.x, a.y - d.y), db = Math.hypot(b.x - d.x, b.y - d.y); if (da < 12 || db < 12) continue;
    const t = Math.max(0, Math.min(1, ((d.x - a.x) * (b.x - a.x) + (d.y - a.y) * (b.y - a.y)) / (ab * ab))), off = Math.hypot(a.x + (b.x - a.x) * t - d.x, a.y + (b.y - a.y) * t - d.y); if (!best || off < best.off) best = { a: a.id, b: b.id, off, ax: a.x, ay: a.y }; }
  return { a: 'clothing', b: 'lobby:23', alt: best }; }); console.log('cab plan', JSON.stringify(plan));
await pg.evaluate(p => { const a = G.places.get(p.a); window.__minD = 1e9; window.__rideT = 0; const iv = setInterval(() => { if (G.transit.ride) { window.__rideT++; const d = G.places.get('deptstore'); const v = G.transit.ride.vehicle || G.player; (window.__vk = window.__vk || []).length < 400 && window.__vk.push([Math.round(v.x), Math.round(v.y), !!G.transit.ride.vehicle]); window.__minD = Math.min(window.__minD, Math.hypot(v.x - d.x, v.y - d.y)); } }, 100); window.__iv = iv; G.go('city', { poi: a.poi.id }); }, plan); await pg.waitForTimeout(2500);
console.log('clock', await setClock(13)); const n1 = await n();
await pg.evaluate(p => { G.money && G.money.add && G.money.add(500); window.__cab = G.transit.callTaxi(p.b, { free: true }).then(v => (window.__cabDone = v), e => (window.__cabDone = 'err ' + e.message)); }, plan);
await pg.waitForFunction(() => !!G.transit.ride, null, { timeout: 90000 }).catch(() => {}); await pg.waitForFunction(() => window.__minD < 6, null, { timeout: 60000 }).catch(() => {}); await shot('10_cab_ride');
await pg.waitForFunction(() => window.__cabDone !== undefined, null, { timeout: 240000 }).catch(() => {});
const cabR = await pg.evaluate(() => ({ done: window.__cabDone, minD: window.__minD, samples: window.__rideT, scene: G.scene.id, nudges: window.__nudges.filter(x => x.ride), vk: (window.__vk || []).filter((q, i) => i % 15 === 0) })); console.log('cab', JSON.stringify(cabR));
say(cabR.done === true && cabR.nudges.length === 0 && await n() === n1, 'cab ride past the Galleria, wished piece at Thread & Co. Outlet (cab came within ' + (+cabR.minD).toFixed(1) + ' units): silent');
await shot('11_after_cab');
/* 5. control: walking up to the Galleria with two wished pieces there -> one line, "+1 more" */
const gal2 = await pg.evaluate(id0 => { const season = G.now().season; const p = G.instore.pieces().find(p => p.id !== id0 && !G.instore.online(p.id) && G.clothesShop.whereSold(p.id).includes('mall:thread') && (p.season == null || p.season === season) && !G.wardrobe.owns(p.id)); G.wardrobe.wish(p.id); return [p.id, p.name]; }, gal[0]); console.log('second galleria piece (API)', JSON.stringify(gal2));
S = await spot('deptstore'); const ng = await n(); await tele(...S.pts[0]); await pg.waitForTimeout(800); await clearB(); await walk(S.door[0], S.door[1]); for (let i = 0; i < 12 && await n() === ng; i++) { await clearB(); await pg.waitForTimeout(800); }
const gl = await pg.evaluate(() => [window.__nudges.slice(-1)[0], window.__banners.slice(-1)[0]]); console.log('galleria walk', JSON.stringify(gl));
say(await n() === ng + 1 && gl[0].p === 'deptstore' && gl[0].ids.length === 2 && /\+1 more/.test(gl[1]), 'walk up to the Galleria: one reminder naming the first piece +1 more'); await shot('12_banner_more');
const errs = B.errs.filter(e => !/favicon/.test(e)); console.log('errors', errs.length, errs.slice(0, 5).join('\n'));
console.log(bad ? bad + ' FAILED' : 'ALL PASS'); await B.close(); process.exit(0);
