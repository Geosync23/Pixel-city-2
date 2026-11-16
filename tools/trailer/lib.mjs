// Trailer capture library (docs/trailer/REPORT.md explains the pipeline).
// Drives the CLEAN BUILD of the last published stage (never the working tree) from outside: Playwright + a virtual clock, one screenshot per video frame.
//   open({ url })            -> { page, close }     loads <clean>/dist/index.html?<url> at 1280x720 with the HUD hidden by injected CSS
//   freeze(page)             pauses the page clock; from then on time only moves in step()
//   record(page, name, n, fn) -> writes n frames (30 fps) to <scratch>/frames/<name>/%05d.jpg; fn(i) runs in node before each frame
// Nothing here edits src/. Everything staged is done through window.G in page.evaluate.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
export const SCRATCH = process.env.TRAILER_SCRATCH || '/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/trailer';
export const CLEAN = process.env.TRAILER_CLEAN || path.join(SCRATCH, 'tb');   // git archive 268bafc (Stage 98) + node tools/build.mjs
export const BUILD = process.env.TRAILER_BUILD || path.join(SCRATCH, 's99');   // the lead's clean single-file build of the published Stage 99 (stage99_index.html copied to s99/index.html)
export const FPS = 30, W = 1280, H = 720;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.mp3': 'audio/mpeg' };

export function serve(base) {
  const srv = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.join(base, u); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
  return new Promise(r => srv.listen(0, () => r(srv)));
}

/* everything that is UI, not world: HUD, phone, toasts, prompts, nav arrow, dev button, pad hints. Speech bubbles (.bubble) stay unless hideBubbles. */
export const HIDE_CSS = `
#ui > *:not(.bubble):not(.tr-keep) { display: none !important; }
body.tr-ui #ui > .modal, body.tr-ui #ui > .mg, body.tr-ui #ui > .say { display: revert !important; }
`;

export async function open({ url = '?scene=city&t=7', dist = true, hide = true, w = W, h = H, extraCss = '' } = {}) {
  const srv = await serve(dist ? BUILD : CLEAN); const port = srv.address().port;
  const br = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await br.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errs = []; page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', e => errs.push('EXC ' + (e.stack || e.message)));
  await page.clock.install();
  await page.goto(`http://localhost:${port}/${url}`);
  await page.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 60000 });
  if (hide) await page.addStyleTag({ content: HIDE_CSS + extraCss });
  return { page, errs, close: async () => { await br.close(); srv.close(); } };
}

/** stop real time; afterwards only step() moves the page's clock (rAF, timers, Date, performance.now) */
export async function freeze(page) { const now = await page.evaluate(() => Date.now()); await page.clock.pauseAt(now + 1500); }
export async function step(page, ms = 1000 / FPS) { await page.clock.runFor(ms); }
/** let `sec` seconds of page time pass without recording (settling crowds, traffic, fades) */
export async function settle(page, sec) { const n = Math.round(sec * 20); for (let i = 0; i < n; i++) await page.clock.runFor(50); }

export async function record(page, name, n, fn) {
  const dir = path.join(SCRATCH, 'frames', name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < n; i++) {
    if (fn) await fn(i, i / FPS);
    await step(page);
    await page.screenshot({ path: path.join(dir, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 96 });
  }
  return dir;
}
export async function still(page, name) { const dir = path.join(SCRATCH, 'stills'); fs.mkdirSync(dir, { recursive: true }); const f = path.join(dir, name + '.png'); await page.screenshot({ path: f }); return f; }

/* ---- page-side helpers, installed once per page ---- */
export async function installHelpers(page) {
  await page.evaluate(() => {
    const T = window.TR = { cam: { x: 0, y: 0, z: 0 } };
    /* a free camera: the (hidden) player rides along so crowds / traffic / lights are simulated around the view */
    T.free = (x, y, zoom) => { const G = window.G; G.player.hidden = true; G.player.path = null; T.cam.x = x; T.cam.y = y; T.cam.z = G.world.heightAt(x, y); G.player.x = x; G.player.y = y; G.camTarget = T.cam; if (zoom) G.setZoom(zoom); G.snapCam(); G.renderer.warm(G.world, G.cam); };
    T.move = (x, y, ride = true) => { const G = window.G; T.cam.x = x; T.cam.y = y; T.cam.z = G.world.heightAt(x, y); if (ride) { G.player.x = x; G.player.y = y; } G.snapCam(); };
    T.time = h => { const G = window.G; const d = Math.floor(G.state.t / 1440); G.state.t = d * 1440 + h * 60; };
    T.player = () => { const G = window.G; G.player.hidden = false; G.camTarget = null; G.snapCam(); };
  });
}
