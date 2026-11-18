// Shared title-screen helper for the test tools (small items 2026-11-18): the title has a Start button first (Stage 118+), then Continue / New Game.
// Finds the buttons by their text (not by a fixed position) and taps their centres with a real touch tap (falls back to a mouse click when the
// context has no touch). Usage: await titleTo(pg, 'Continue')   (or 'New Game'). Waits for the game scene when 'Continue' is used.
async function where(pg, re) {
  return pg.evaluate(src => { const x = new RegExp(src); const b = [...document.querySelectorAll('.tt-wrap button, button')].find(e => e.offsetWidth && x.test(e.textContent.trim())); if (!b) return null; const q = b.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }, re.source);
}
async function tapAt(pg, p) { try { await pg.touchscreen.tap(p[0], p[1]); } catch (e) { await pg.mouse.click(p[0], p[1]); } }
async function press(pg, re, timeout = 20000) {
  const t0 = Date.now(); while (Date.now() - t0 < timeout) { const p = await where(pg, re); if (p) { await pg.waitForTimeout(150); const q = await where(pg, re); if (q) { await tapAt(pg, q); return true; } } await pg.waitForTimeout(200); }
  return false;
}
export async function titleTo(pg, which = 'Continue', { timeout = 60000 } = {}) {
  await press(pg, /^Start$/, 8000); // absent on very old builds: not fatal
  await pg.waitForTimeout(700);
  const ok = await press(pg, new RegExp('^' + which + '$'), 20000);
  if (!ok) throw new Error('title: no "' + which + '" button');
  if (which === 'Continue') await pg.waitForFunction(() => !G.onTitle && G.scene, null, { timeout });
  return true;
}
