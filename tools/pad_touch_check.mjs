// TOUCH IS UNTOUCHED (owner msg 143): the same tap session in two builds, compared.
//   node tools/pad_touch_check.mjs <dir of the build WITHOUT controller support> [<dir of the build with it> = dist]
// No gamepad exists in either page. Real taps only (Playwright touchscreen / mouse). For each moment of the session it compares
//   - the DOM of #ui: every element's tag + classes + own text, with volatile things left out (clock, bubbles, toasts, money deltas, the empty glyph slots)
//   - pixels of opaque UI rectangles (the phone, the HUD chips), where the live city behind cannot differ
// and in the build with controller support it asserts that nothing of it is on the page: no #padnav / #pad-bar, no pad-on / kb-on class, every glyph slot empty
// and not displayed, G.padSteer / G.camLook unset, the poll not running.
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { ROOT } from './artfiles.mjs'; import { serve } from './pad_lib.mjs';
const require = createRequire(ROOT + '/'); const { chromium } = require('playwright');
const A = process.argv[2], B = process.argv[3] || path.join(ROOT, 'dist'); if (!A) { console.log('usage: node tools/pad_touch_check.mjs <old build dir> [new build dir]'); process.exit(2); }
const OUT = path.join(ROOT, 'out/shots'); fs.mkdirSync(OUT, { recursive: true });
const sig = () => { const out = []; const walk = e => { if (e.id === 'toasts' || e.getAttribute('data-set') === 'nowplaying' /* a random tune's name */ || e.classList.contains('hud-prompt') /* names whatever is nearest: depends on who walks past */ || e.classList.contains('bubble') || e.classList.contains('hud-deltas') || e.classList.contains('pg') || e.id === 'padnav' || e.classList.contains('talk-wfloat')) return; let own = ''; if (!e.classList.contains('hud-badge') && !e.classList.contains('ph-badge')) for (const n of e.childNodes) if (n.nodeType === 3) own += n.textContent;   /* badges count notifications, which arrive when they like */ own = own.trim().replace(/\d/g, '#'); out.push(e.tagName + '.' + [...e.classList].filter(c => !/^(soon|on|in|bump|low|critical|ok|fine|good|great|full|neg)$/.test(c)).sort().join('.') + (own ? ' "' + own.slice(0, 40) + '"' : '')); for (const c of e.children) walk(c); }; walk(document.getElementById('ui')); return out; };
async function session(dir, tag) {
  const { srv, port } = await serve(dir); const br = await chromium.launch(); const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e.message))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const res = { errs, dom: {}, px: {}, pad: null, walked: false, used: false };
  const tap = async (x, y) => { await pg.touchscreen.tap(x, y); await pg.waitForTimeout(350); };
  const tapEl = async sel => { const r = await pg.evaluate(s => { const e = typeof s === 'string' ? document.querySelector(s) : null; if (!e) return null; const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }, sel); if (!r) throw new Error('no ' + sel); await tap(r[0], r[1]); };
  const tapText = async (re, scope = 'button') => { const r = await pg.evaluate(([src, sc]) => { const x = new RegExp(src, 'i'), e = [...document.querySelectorAll(sc)].find(b => b.offsetWidth && x.test((b.getAttribute('aria-label') || b.textContent || '').trim())); if (!e) return null; const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }, [re.source, scope]); if (!r) throw new Error('no button ' + re); await tap(r[0], r[1]); };
  const grab = async (name, clipSel) => { res.dom[name] = await pg.evaluate(sig); const clip = clipSel ? await pg.evaluate(s => { const q = document.querySelector(s).getBoundingClientRect(); return { x: Math.round(q.left), y: Math.round(q.top), width: Math.round(q.width), height: Math.round(q.height) }; }, clipSel) : null; const f = path.join(OUT, `touch_${tag}_${name}.png`); await pg.screenshot({ path: f, clip: clip || undefined }); res.px[name] = clip ? f : null; };
  /* 1. the title screen */
  await pg.goto(`http://localhost:${port}/`); await pg.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 60000 }); await pg.waitForTimeout(1200);
  await grab('title'); await tapText(/^New Game/); await pg.waitForTimeout(700); await grab('creator', '.cc-panel');
  /* 2. straight into the city (developer URL), HUD, a walk, a thing, the phone and three apps */
  await pg.goto(`http://localhost:${port}/?scene=int:cafe&t=10`); await pg.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 60000 }); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { try { G.firstTime.setEnabled(false); } catch (e) { } }); await grab('hud', '#hud .hud-tl');
  const p0 = await pg.evaluate(() => [G.player.x, G.player.y]); await tap(120, 520); await pg.waitForTimeout(1500); const p1 = await pg.evaluate(() => [G.player.x, G.player.y]); res.walked = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > .5;
  /* tap the counter ("Order") on the canvas: the shop window opens */
  for (let k = 0; k < 3 && !res.used; k++) {   // the camera follows the walk: aim again each time
    const c = await pg.evaluate(() => { const it = G.interactables().find(i => /^Order/.test(i.label)); const s = G.toScreen(it.x, it.y, (it.z || 0) + .4), r = G.cv.getBoundingClientRect(); return [s.x + r.left, s.y + r.top]; });
    await tap(c[0], c[1]); await pg.waitForFunction(() => !!document.querySelector('.modal .win'), null, { timeout: 7000 }).catch(() => { }); await pg.waitForTimeout(500); res.used = await pg.evaluate(() => !!document.querySelector('.modal .win')); }
  if (res.used) { await grab('shop', '.modal .win'); await tapText(/^Close$/); } await tapEl('#hud .hud-phone'); await pg.waitForTimeout(700); await grab('phone_home', '.ph-screen');
  await tapText(/^Settings/); await pg.waitForTimeout(600); await grab('phone_settings', '.ph-view');
  await tapText(/^Back$/); await pg.waitForTimeout(400); await tapText(/^Map/); await pg.waitForTimeout(900); await grab('phone_map');
  await tapText(/^Put phone away/); await pg.waitForTimeout(500); await tapEl('#hud .hud-myday'); await pg.waitForTimeout(800); await grab('myday');
  res.pad = await pg.evaluate(() => ({ layer: !!document.getElementById('padnav'), bar: !!document.getElementById('pad-bar'), cls: document.body.className, slots: [...document.querySelectorAll('.pg')].map(e => [e.childElementCount, getComputedStyle(e).display, e.offsetWidth].join('/')), steer: typeof G.padSteer, look: G.camLook === undefined ? 'unset' : String(G.camLook), mode: G.pad ? G.pad.mode : 'no G.pad', seen: G.pad ? G.pad.seen : false, marks: [...document.querySelectorAll('#ui *')].filter(e => e._pn).length }));
  await br.close(); srv.close(); return res;
}
const a = await session(A, 'old'), b = await session(B, 'new');
const LIMIT = { creator: 12, hud: 8, shop: .5, phone_home: 3, phone_settings: 3 }, NOTE = { creator: 'the random starting look and name differ between runs', hud: 'the weather icon and the meters move', shop: 'a static window', phone_home: 'the clock and the status bar', phone_settings: 'the Now playing line' };
let bad = 0; const say = (ok, t) => { if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + t); };
for (const k of Object.keys(a.dom)) {
  const x = a.dom[k], y = b.dom[k] || []; let i = 0; while (i < x.length && i < y.length && x[i] === y[i]) i++;
  say(x.length === y.length && i === x.length, `DOM of #ui the same at "${k}" (${x.length} elements)` + (i < Math.max(x.length, y.length) ? `  first difference at #${i}: old ${x[i]} | new ${y[i]}` : ''));
}
{ /* pixel comparison in a blank page (canvas getImageData) */
  const br = await chromium.launch(), pg = await br.newPage();
  for (const k of Object.keys(a.px)) {
    if (!a.px[k] || !b.px[k]) continue; const u = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
    const r = await pg.evaluate(async ([ua, ub]) => { const load = u => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; }); const [p, q] = await Promise.all([load(ua), load(ub)]); if (p.width !== q.width || p.height !== q.height) return { size: [p.width, p.height, q.width, q.height] };
      const px = i => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0); return g.getImageData(0, 0, i.width, i.height).data; }; const x = px(p), y = px(q); let d = 0; for (let i = 0; i < x.length; i += 4) if (Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]) > 24) d++; return { w: p.width, h: p.height, pct: d / (p.width * p.height) * 100 }; }, [u(a.px[k]), u(b.px[k])]);
    if (r.size) say(false, `pixels "${k}": sizes differ ${r.size.join('x')}`); else say(r.pct < LIMIT[k], `pixels "${k}" ${r.w}x${r.h}: ${r.pct.toFixed(2)}% differ (limit ${LIMIT[k]}%: ${NOTE[k]})`);
  }
  await br.close(); }
say(a.walked && b.walked, `a tap on the floor walks the player (old ${a.walked}, new ${b.walked})`); say(a.used && b.used, `a tap on the counter opens the shop (old ${a.used}, new ${b.used})`);
const p = b.pad; say(!p.layer && !p.bar && !/pad-on|kb-on/.test(p.cls) && p.steer === 'undefined' && p.look === 'unset' && p.mode === 'touch' && !p.seen && p.slots.every(s => s.startsWith('0/none/0')), 'new build, no pad: no layer, no strip, no body class, glyph slots empty and hidden, no steer / look hooks, mode touch  ' + JSON.stringify(p));
say(!a.errs.length && !b.errs.length, `page errors: old ${a.errs.length}, new ${b.errs.length} ${b.errs.slice(0, 2).join(' | ')}`);
console.log(bad ? `${bad} FAILED` : 'touch session identical with and without controller support'); process.exit(bad ? 1 : 0);
