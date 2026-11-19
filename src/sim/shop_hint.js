// shop_hint.js: "Tap the counter to buy things." (owner msg 271, 2026-11-19)
// The airport teaches that a counter sells things. For a while afterwards the same small bubble comes back when you walk into a place with a counter / till:
// the first TIMES such entries after the arrival (one per entry, not twice in a row for the same room), pointing at the counter, for SHOW_S seconds or
// until you open the shop or leave. Never during the arrival, the first-evening lesson's own bubbles, a window, a cutscene, or at home.
// State: G.state.tips.shopHint = how many times it has been shown.   G.shopHint = { TIMES, left() } (tests).
import { G } from '../core/game.js';
import { hint as uiHint } from '../ui/goals.js';

export const order = 138;
const TIMES = 6, SHOW_S = 7, TEXT = 'Tap the counter to buy things.';
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const S = () => { const s = G.state.tips = G.state.tips || {}; return s; };
let mine = null, timer = 0, lastRoom = '';
const clear = () => { clearTimeout(timer); if (mine && document.querySelector('.tut') === mine) uiHint(null); mine = null; };
function offer(sc) {
  clear(); const id = String((sc && sc.id) || ''); if (!/^int:/.test(id) || /^int:(home|lobby|airport)/.test(id)) { if (!/^int:/.test(id)) lastRoom = ''; return; }
  if (!safe(() => G.state.flags.introDone, false) || safe(() => G.intro.active, false) || S().off || (S().shopHint || 0) >= TIMES || id === lastRoom) return;
  setTimeout(() => {   /* after the room's fixtures and people are in, and the door fade is over */
    if (!G.scene || G.scene.id !== id || G.modal || G.cutscene || G.busy || document.querySelector('.tut')) return;
    const it = safe(() => G.interactables().find(i => i.shop && (!i.visible || i.visible())), null); if (!it) return;
    lastRoom = id; S().shopHint = (S().shopHint || 0) + 1;
    uiHint(TEXT, { x: it.x, y: it.y, h: (it.h || 1) + .6 }, { under: true }); mine = document.querySelector('.tut'); timer = setTimeout(clear, SHOW_S * 1000);
  }, 900);
}
export function init() {
  if (typeof document === 'undefined') return;
  G.on('scene', sc => safe(() => offer(sc))); G.on('shop:open', clear);
  G.shopHint = { TIMES, left: () => Math.max(0, TIMES - (S().shopHint || 0)) };
}
