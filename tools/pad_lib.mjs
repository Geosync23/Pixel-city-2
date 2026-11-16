// Shared by tools/pad_check.mjs: a page with a SCRIPTED FAKE GAMEPAD (standard mapping) and helpers that drive the game with nothing else.
// The helpers may LOOK at the page (DOM, G.padnav.info()) to decide what to press, as a player looks at the screen; they never tap, click or call game code to act.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { ROOT } from './artfiles.mjs';
const require = createRequire(ROOT + '/'); const { chromium } = require('playwright');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
export const BTN = { ok: 0, a: 0, back: 1, b: 1, x: 2, y: 3, l1: 4, r1: 5, l2: 6, r2: 7, select: 8, start: 9, l3: 10, r3: 11, up: 12, down: 13, left: 14, right: 15 };
export const PAD_IDS = { xbox: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', ps: 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)', switch: 'Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)', generic: 'USB Gamepad (Vendor: 0079 Product: 0011)' };

export async function serve(dir) {
  const srv = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.join(dir, u); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
  await new Promise(r => srv.listen(0, r)); return { srv, port: srv.address().port };
}
/** open the game with a fake pad installed (not yet connected). o: { w, h, url, style, dist: true, pad: true } */
export async function openGame(o = {}) {
  const { srv, port } = await serve(o.dist === false ? ROOT : path.join(ROOT, 'dist'));
  const br = await chromium.launch(); const ctx = await br.newContext({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: o.dpr || 1 });
  const pg = await ctx.newPage(); const errors = [];
  pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push('[' + m.type() + '] ' + m.text()); }); pg.on('pageerror', e => errors.push('[exception] ' + (e.stack || e.message)));
  if (o.pad !== false) await ctx.addInitScript(id => {
    const mk = () => ({ id, index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), vibrationActuator: { playEffect: () => { window.__rumbles = (window.__rumbles || 0) + 1; return Promise.resolve('complete'); } } });
    window.__pad = mk(); window.__padOn = false;
    navigator.getGamepads = () => (window.__padOn ? [window.__pad, null, null, null] : [null, null, null, null]);
    window.__connect = () => { window.__padOn = true; const e = new Event('gamepadconnected'); e.gamepad = window.__pad; window.dispatchEvent(e); };
    window.__disconnect = () => { window.__padOn = false; const e = new Event('gamepaddisconnected'); e.gamepad = window.__pad; window.dispatchEvent(e); };
    window.__btn = (i, v) => { const b = window.__pad.buttons[i]; b.pressed = !!v; b.touched = !!v; b.value = v ? 1 : 0; window.__pad.timestamp = performance.now(); };
    window.__axes = (a) => { for (let i = 0; i < a.length; i++) if (a[i] !== null && a[i] !== undefined) window.__pad.axes[i] = a[i]; window.__pad.timestamp = performance.now(); };
  }, PAD_IDS[o.style || 'xbox']);
  if (o.storage) await ctx.addInitScript(st => { try { if (!sessionStorage.getItem('__seeded')) { sessionStorage.setItem('__seeded', '1'); for (const k in st) localStorage.setItem(k, st[k]); } } catch (e) { } }, o.storage);
  const base = `http://localhost:${port}/`;
  await pg.goto(base + (o.url || ''));
  await pg.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 60000 });
  const P = pad(pg); P.errors = errors; P.base = base; P.close = async () => { await br.close(); srv.close(); }; P.ctx = ctx;
  return P;
}
export function pad(pg) {
  const sleep = ms => pg.waitForTimeout(ms);
  const P = {
    pg, sleep, used: { focus: 0, cursor: 0, bespoke: 0 }, log: [],
    connect: async () => { await pg.evaluate(() => window.__connect()); await sleep(80); },
    down: (b) => pg.evaluate(i => window.__btn(i, 1), BTN[b]), up: (b) => pg.evaluate(i => window.__btn(i, 0), BTN[b]),
    /** press and release a button (ms held), then wait */
    async press(b, ms = 70, after = 140) { await P.down(b); await sleep(ms); await P.up(b); await sleep(after); },
    stick: (x, y) => pg.evaluate(a => window.__axes(a), [x, y]), rstick: (x, y) => pg.evaluate(a => window.__axes(a), [null, null, x, y]),
    info: () => pg.evaluate(() => (window.G && G.padnav ? G.padnav.info() : null)),
    ev: (fn, arg) => pg.evaluate(fn, arg),
    shot: async name => { const dir = path.join(ROOT, 'out/shots'); fs.mkdirSync(dir, { recursive: true }); await pg.screenshot({ path: path.join(dir, name + '.png') }); return name; },
    /** wait until fn() in the page is truthy (looking only) */
    async until(fn, arg, ms = 8000) { const t0 = Date.now(); for (;;) { const v = await pg.evaluate(fn, arg).catch(() => null); if (v) return v; if (Date.now() - t0 > ms) return null; await sleep(100); } },
    /** move the focus ring with the D-pad onto the element found by `find` (a function run in the page returning an Element, or a regex source matched against
        the label of focusable things). Greedy: press the direction that closes the larger gap. Returns true when the ring is on it. */
    async focusOn(find, arg, opts = {}) {
      const max = opts.max || 40; let stuck = 0, lastKey = '';
      for (let i = 0; i < max; i++) {
        const q = await pg.evaluate(([src, a, isRe]) => {
          const f = G.padnav.focusEl(); let t;
          if (isRe) { const re = new RegExp(src, 'i'); const all = [...document.querySelectorAll('button,[role=button],[role=tab],input,select,a,canvas,div,span,li,label')].filter(e => (e.tagName === 'BUTTON' || e.tagName === 'INPUT' || e.tagName === 'SELECT' || e._pn || e.onclick || e.getAttribute('role')) && e.offsetWidth > 0 && !e.disabled && !e.closest('#hud.off') && re.test((e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim()));
            const vis = e => { const r = e.getBoundingClientRect(), h = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2))); return h && (e === h || e.contains(h)); };
            t = all.find(vis) || all[0]; }
          else t = (0, eval)('(' + src + ')')(a);
          if (!t) return { none: true }; const r = t.getBoundingClientRect(), fr = f ? f.getBoundingClientRect() : null;
          return { on: !!f && (f === t || t.contains(f)), t: [r.left + r.width / 2, r.top + r.height / 2, r.width, r.height], f: fr ? [fr.left + fr.width / 2, fr.top + fr.height / 2, fr.width, fr.height] : null, st: G.padnav.state(), fl: f ? (f.getAttribute('aria-label') || f.textContent || '').slice(0, 30) + (f.parentElement ? [...f.parentElement.children].indexOf(f) : '') : '' };
        }, [typeof find === 'function' ? find.toString() : find.source || String(find), arg, typeof find !== 'function']);
        if (q.none) { await sleep(150); stuck++; if (stuck > 12) return false; continue; }
        if (q.on) return true;
        if (!q.f) { await P.press('down', 60, 160); continue; }
        const dx = q.t[0] - q.f[0], dy = q.t[1] - q.f[1], gx = Math.abs(dx) - (q.t[2] + q.f[2]) / 2, gy = Math.abs(dy) - (q.t[3] + q.f[3]) / 2;
        let dir = gy > 0 || (gx <= 0 && Math.abs(dy) > 3) ? (dy > 0 ? 'down' : 'up') : (dx > 0 ? 'right' : 'left');
        if (gx <= 0 && gy <= 0) dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');   // one inside the other: toward its middle
        const key = q.f.join(',') + q.fl + dir; if (key === lastKey) { stuck++; dir = dir === 'down' || dir === 'up' ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); if (stuck > 6) return false; } lastKey = key;
        await P.press(dir, 60, 130);
      }
      return false;
    },
    /** focus something and press A. Falls back to the CURSOR (R3, stick, A) when the ring cannot get there; counts which was needed. */
    async choose(find, arg, opts = {}) {
      if (await P.focusOn(find, arg, opts)) { P.used.focus++; await P.press('ok', 70, opts.after || 220); return 'focus'; }
      if (opts.noCursor) return null;
      const r = await pg.evaluate(([src, isRe]) => { let t; if (isRe) { const re = new RegExp(src, 'i'); t = [...document.querySelectorAll('button,[role=button],a,div,span')].find(e => e.offsetWidth > 0 && re.test((e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim()) && e.children.length < 6); } else t = (0, eval)('(' + src + ')')(); if (!t) return null; const q = t.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }, [typeof find === 'function' ? find.toString() : find.source, typeof find !== 'function']);
      if (!r) return null; await P.cursorTap(r[0], r[1]); P.used.cursor++; return 'cursor';
    },
    /** the free cursor: R3 on, steer the stick until the pointer is at (x, y), A, R3 off */
    async cursorTap(x, y, holdMs = 70) {
      let i = await P.info(); if (!i.cursor) { await P.press('r3', 60, 120); i = await P.info(); }
      await P.steerCursor(x, y); await P.press('ok', holdMs, 200); i = await P.info(); if (i && i.cursor) await P.press('r3', 60, 120);
    },
    async steerCursor(x, y, tol = 5) {
      for (let k = 0; k < 400; k++) { const i = await P.info(), c = i.cursor || (i.surf && i.surf.at); if (!c) return false; const dx = x - c[0], dy = y - c[1], d = Math.hypot(dx, dy); if (d <= tol) { await P.stick(0, 0); await sleep(40); return true; } const m = d > 120 ? 1 : d > 40 ? .6 : .34; await P.stick(dx / d * m, dy / d * m); await sleep(d > 120 ? 60 : 30); }
      await P.stick(0, 0); return false;
    },
    /** walk with the left stick to a world position, steering along the game's own path (looked up, not commanded). Returns true when within `tol`. */
    async walkTo(x, y, tol = .7, ms = 30000) {
      const t0 = Date.now(); let path = null, pi = 0, lastPlan = 0;
      for (;;) {
        const s = await pg.evaluate(([x, y]) => { const p = G.player; return { x: p.x, y: p.y, st: G.padnav.state(), modal: G.modal, scene: G.scene.id }; }, [x, y]);
        const d = Math.hypot(x - s.x, y - s.y); if (d <= tol) { await P.stick(0, 0); return true; }
        if (s.st !== 'world' || Date.now() - t0 > ms) { await P.stick(0, 0); return false; }
        if (!path || Date.now() - lastPlan > 2500) { lastPlan = Date.now(); path = await pg.evaluate(([x, y]) => { try { const C = G.player.constructor, c = new C(G.player.spec, G.player.x, G.player.y); c.goTo(G.world, x, y, { snap: 8 }); return c.path ? c.path.map(q => [q[0], q[1]]) : null; } catch (e) { return null; } }, [x, y]); pi = 0; }
        let tx = x, ty = y; if (path && path.length) { while (pi < path.length - 1 && Math.hypot(path[pi][0] - s.x, path[pi][1] - s.y) < .45) pi++; tx = path[pi][0]; ty = path[pi][1]; }
        const wx = tx - s.x, wy = ty - s.y, sx = (wx - wy) / 2, sy = (wx + wy) / 2, m = Math.hypot(sx, sy) || 1;   // the inverse of the 'street' stick mapping
        await P.stick(sx / m, sy / m); await sleep(70);
      }
    },
    /** push the stick toward a world point for a moment (turns the player to face it) */
    async face(x, y, ms = 110) { const s = await pg.evaluate(() => [G.player.x, G.player.y]); const wx = x - s[0], wy = y - s[1], sx = (wx - wy) / 2, sy = (wx + wy) / 2, m = Math.hypot(sx, sy) || 1; await P.stick(sx / m * .5, sy / m * .5); await sleep(ms); await P.stick(0, 0); await sleep(160); },
    /** walk up to the interactable whose label matches, get it highlighted (facing it, else LB / RB), press A. Returns 'target' | 'cycle' | null. */
    async useThing(re, opts = {}) {
      const find = () => pg.evaluate(([src, near]) => { const r = new RegExp(src, 'i'), p = G.player; let b = null, bd = 1e9; for (const it of G.interactables()) { if (!r.test(it.label || '')) continue; const d = Math.hypot(it.x - (near ? near[0] : p.x), it.y - (near ? near[1] : p.y)); if (d < bd) { bd = d; b = it; } } return b ? { x: b.x, y: b.y, sx: b.spot ? b.spot.x : null, sy: b.spot ? b.spot.y : null, label: b.label, d: Math.hypot(b.x - p.x, b.y - p.y) } : null; }, [re.source, opts.near || null]);
      let it = await find(); if (!it) return null;
      if (it.d > (opts.range || 1.3)) { await P.walkTo(it.sx !== null ? it.sx : it.x, it.sy !== null ? it.sy : it.y, opts.tol || 1.1, opts.ms || 40000); it = await find(); if (!it) return null; }
      await P.face(it.x, it.y); let how = 'target';
      for (let k = 0; k < 14; k++) { const i = await P.info(); if (i.state !== 'world') return null; if (i.target && re.test(i.target)) { await P.press('ok', 70, opts.after || 400); return how; } how = 'cycle'; await P.press('r1', 60, 160); }
      return null;
    },
    step(name, ok, how, note) { P.log.push({ name, ok: !!ok, how: how || '', note: note || '' }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (how ? '  [' + how + ']' : '') + (note ? '  ' + note : '')); },
  };
  return P;
}
