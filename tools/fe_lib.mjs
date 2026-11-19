// Shared driver for tools/first_evening_check.mjs: opens the BUILT game at phone size with touch, starts a NEW game through the real buttons and skips to the flat.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
export const ROOT = '/home/user/Pixel-city-2'; const require = createRequire(ROOT + '/'); const { chromium } = require('playwright');
export const OUT = path.join(ROOT, 'out/shots/first_evening'); fs.mkdirSync(OUT, { recursive: true });
export async function boot({ w = 390, h = 844, save = null, dsf = 2 } = {}) {
  const HTML = fs.readFileSync(path.join(ROOT, 'dist/index.html'), 'utf8');
  const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(HTML); }); await new Promise(r => srv.listen(0, r)); const U = `http://localhost:${srv.address().port}/`;
  const br = await chromium.launch(), ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, hasTouch: true, isMobile: true }), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 300))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  await pg.goto(U); if (save) { await pg.evaluate(s => localStorage.setItem('maplebay.save.v1', s), save); await pg.goto(U); }
  await pg.waitForFunction(() => window.G && G.onTitle !== undefined && !document.getElementById('load'), null, { timeout: 180000 }); await pg.waitForTimeout(1200);
  const tap = async (x, y, ms = 350) => { await pg.touchscreen.tap(x, y); await pg.waitForTimeout(ms); };
  const btn = (re, sel = 'button, .opt') => pg.evaluate(([src, sel]) => { const x = new RegExp(src, 'i'), e = [...document.querySelectorAll(sel)].find(b => b.offsetWidth && b.offsetHeight && x.test((b.getAttribute('aria-label') || b.textContent || '').trim()) ) || [...document.querySelectorAll(sel)].find(b => b.offsetWidth && b.offsetHeight && x.test((b.textContent || '').trim())); if (!e) return null; e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2, (e.textContent || '').trim().slice(0, 40)]; }, [re.source, sel]);
  const press = async (re, ms = 1000, sel) => { const b0 = await btn(re, sel); if (!b0) return false; await pg.waitForTimeout(150); const b = await btn(re, sel); if (!b) return false; await tap(b[0], b[1], ms); return true; };
  const shot = (name, clip) => pg.screenshot(Object.assign({ path: path.join(OUT, name + '.png') }, clip ? { clip } : {}));
  const ev = (f, a) => pg.evaluate(f, a);
  /** new game through the real buttons, then the intro's own Skip buttons, until we stand in the flat */
  const newGame = async () => {
    for (const re of [/^Start$/, /^New Game/, /^Next ▶/, /^Surprise me/, /^Next ▶/, /^Juniper Court/, /^Move in/]) await press(re);
    for (let k = 0; k < 40; k++) { const st = await ev(() => ({ home: /^int:home/.test((G.scene && G.scene.id) || ''), cut: !!G.cutscene })); if (st.home && !st.cut && !(await btn(/^Skip(?! tips)/))) break; if (!(await press(/^(Yes|Skip it)/, 1500)) && !(await press(/^Skip(?! tips)/, 1500))) { await ev(() => { if (G.intro && G.intro.active && !G.cutscene && !/^int:home/.test((G.scene && G.scene.id) || '')) G.intro.skip(); }); await pg.waitForTimeout(1500); }   /* owner msg 269: the 'Skip intro' button is gone; the tools use G.intro.skip() once the cutscene's own Skip is done */ }
    await pg.waitForTimeout(2500);
  };
  /** walk to an interactable (label regexp source) and tap it on the canvas like a thumb would; returns true when something reacted (menu, busy, modal) */
  const useThing = async (find, { tries = 14, dz = null, until = null } = {}) => {
    for (let k = 0; k < tries; k++) {
      const st = await ev(() => ({ win: !!document.querySelector('.modal .win'), busy: !!G.busy, mg: !!(G.minigame && G.minigame.MG && G.minigame.MG.cur) })); if (st.win || st.busy || st.mg || (until && await ev(until))) return true;
      const c = await ev(([f, dz]) => { const x = new RegExp(f, 'i'), it = G.interactables().filter(i => x.test(i.label || '')).sort((a, b) => Math.hypot(a.x - G.player.x, a.y - G.player.y) - Math.hypot(b.x - G.player.x, b.y - G.player.y))[0]; if (!it) return null; const p = G.toScreen(it.x, it.y, (it.z || 0) + (dz === null ? (it.h || .6) * .5 : dz)), r = G.cv.getBoundingClientRect(); return [p.x + r.left, p.y + r.top, it.label]; }, [find, dz]);
      if (!c) return false;
      /* off the phone screen (the camera follows the player): a real thumb would walk there first; the script puts the player on the thing's use spot and looks again */
      if (c[0] < 24 || c[0] > w - 24 || c[1] < 150 || c[1] > h - 150) { await ev(f => { const x = new RegExp(f, 'i'), it = G.interactables().filter(i => x.test(i.label || '')).sort((a, b) => Math.hypot(a.x - G.player.x, a.y - G.player.y) - Math.hypot(b.x - G.player.x, b.y - G.player.y))[0]; if (it && it.spot) { G.player.x = it.spot.x; G.player.y = it.spot.y; } }, find); await pg.waitForTimeout(900); continue; }
      await tap(Math.max(30, Math.min(w - 30, c[0])), Math.max(150, Math.min(h - 150, c[1])), 900);
      const act = await btn(new RegExp(find, 'i'), '.hud-act, .hud-prompt, .hud-bc button'); if (act) await tap(act[0], act[1], 700);
    }
    return false;
  };
  /** phone banners sit over the To do chip for a few seconds (old gap): wait until they are gone */
  const noBanners = () => pg.waitForFunction(() => { const b = document.getElementById('ph-banners'); return !b || ![...b.children].some(c => c.offsetWidth); }, null, { timeout: 30000 }).then(() => pg.waitForTimeout(400)).catch(() => {});
  const waitIdle = (ms = 60000) => pg.waitForFunction(() => !G.busy && !G.cutscene, null, { timeout: ms }).catch(() => {});
  return { pg, ctx, br, srv, errs, tap, btn, press, shot, ev, newGame, useThing, waitIdle, noBanners, w, h, close: async () => { await br.close(); srv.close(); } };
}
