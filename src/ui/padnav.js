// CONTROLLER SUPPORT, the UI half (owner msg 143, BIBLE "Direction update 26"). Input half: src/core/pad.js. Glyph art: src/art/icons/pad.js. Styles: padnav.css.
// Design, mapping tables, per-screen status and tunables: docs/reports/controller.md.
//
// ONE FOCUS LAYER OVER THE DOM. Nothing in the game registers with it: while a pad (or the arrow keys) is in use it looks at what is on screen.
//   focusable  = button, a[href], input, select, textarea, [role=button|tab|option|link|checkbox|switch|menuitem], [tabindex], [data-pad], anything that got a
//                click / pointerdown / pointerup handler through kit.el() (el() marks it `_pn`) or an .onclick property, and "surfaces" (game canvases, the map)
//   reachable  = its middle (the visible part, inside its scroller) is what document.elementFromPoint finds there: a window's backdrop hides what is under it, so
//                the top-most thing owns the focus without any registration. Rows scrolled out of a live list count too (they are scrolled into view on focus).
//   move       = D-pad / left stick: the nearest reachable element in that direction (edge gap + 2.2 x sideways gap), wraps along the same row / column,
//                scrolls the list when there is nothing further that way
//   A          = pointerdown + pointerup + click on the element (text field: the pad keyboard; slider / select: left / right changes it; surface: step inside)
//   B          = the closest "back" control around the focus ([data-pad-back], Back, x / Close, Cancel / Not now / Done), else an Escape key press
//   LB / RB    = previous / next tab of the nearest tab bar ([role=tablist], .*-tabs)          X = a "Skip ..." button when there is one
//   right stick scrolls, LT / RT page up / down, R3 toggles the free CURSOR (stick moves a pointer, A taps / drags, works on anything, canvas or DOM)
// WORLD (no window open): left stick walks (core/game.js asks G.padSteer), a TARGET is picked in front of the player and highlighted, A uses it, LB / RB cycle,
//   B stops / cancels, X bag, Y My Day, Start phone, Select map, D-pad left / right speed, down pause, up = step onto the HUD (focus layer over the HUD chips,
//   banners and anything else on screen), right stick looks around, LT / RT zoom, L3 pause, R3 cursor.
// Hooks other files may use (all optional):  data-pad="default" (takes the focus when its window opens)   data-pad="line" (a dialogue line: A advances it; the
//   focus leaves it for the answers as soon as there are any)   data-pad="aside" (a side control such as Log: reachable, never where the focus starts)
//     data-pad-back   data-pad-skip   data-pad-key="x|y"
//   data-pad-passive (a HUD-like layer: never traps the focus)   data-pad-surface="cursor|pan" (a canvas / area played with the pointer)
//   <i class="pg" data-pg="ok|back|x|y|l1|r1|l2|r2|start|select|ls|rs|dpad..."> a glyph slot: empty and display:none until a pad is in use
// G.padnav = { state(), info(), target(), settings(body, ctx), glyph(action, scale) -> canvas, addSurface({ el, rect(), kind?, keys? }) -> remove(), refresh(), TW }
// With no pad and no arrow-key use this module does nothing per frame: no layer in the DOM, no observers, no classes on <body>.
import { G } from '../core/game.js';
import { Pad, TUNE } from '../core/pad.js';
import { WS, U } from '../engine/raster.js';
import { el, root } from './kit.js';
import { padGlyph } from '../art/icons/pad.js';

export const order = 96;
/* ---- tunables for the world side (docs/reports/controller.md "Tunables") ---- */
export const TW = {
  people: .9,        // units a person counts as further away than a thing (streets are full of passers-by; LB / RB still reach them)
  reach: 3.4,        // units: how far away a thing can be and still become the target
  near: 1.6,         // units: the touch prompt's range. Anything this close ...
  nearBonus: 1.5,    // ... is preferred by this much over things further off (among near things the one you face wins)
  facing: 1.25,      // units of distance a thing straight ahead is "closer" than one straight behind
  sticky: .4,        // a new target must beat the current one by this much (no flicker between two things)
  cycleReach: 7,     // LB / RB look this far
  lockSecs: 5,       // a target chosen with LB / RB stays this long (or until you walk 1.5 units)
  look: .36,         // right stick: how far the camera leans, as a fraction of the view
  cursorSpeed: 640,  // px / s at full deflection (x prefs.cursor)
  scrollSpeed: 900,  // px / s right-stick scrolling
  sideWeight: 2.2,   // focus moves: how much a sideways gap costs against a forward gap
  mashGuard: .28,    // s: after the focused thing vanishes and the ring jumps elsewhere, Confirm is ignored this long
};
const PASSIVE = '#hud,#goalsw,#ph-banners,#toasts,#ph-fab,#nav-arrow,#nav-trip,#nav-stop,.dev-btn,.bubble,[data-pad-passive]';
const SURF = 'canvas.mg-cv,canvas.md-gcv,canvas.jp-map,.ph-map,[data-pad-surface]';
const DS = typeof devicePixelRatio === 'number' && devicePixelRatio % 2 === 0 ? 1.5 : 2;   // corner hints: 1.5x where that is whole device pixels, else 2x
const PID = 7743;   // the pointer id of the pad's synthetic pointer

let L = null;                 // the overlay layer { box, ring, cur, deco, bar }
let focus = null, frect = null, froot = null, flabel = '', hist = [], trail = [];
let list = [], overlayN = 0, back = null, skip = null, tabsEl = null, keysMap = {}, mainScroll = null, scanAt = 0, dirty = true, mo = null;
let lost = null, autoAt = -9, arrive = null, fresh = false, hudFocus = false, cursorOn = false, cx = 0, cy = 0, press = null, surf = null, surfaces = [], osk = null;
let target = null, tgtLock = 0, tgtAt = [0, 0], tgtT = 0, legendKey = '', ringKey = '', lastState = '', patched = false, kbLoop = false, zoomHeld = 0;
const wrapEl = () => document.getElementById('wrap');
const now = () => performance.now() / 1000;

/* ---------- glyphs ---------- */
const PHYS = { x: 'west', y: 'north' };
function gname(a) { if (a === 'ok') return Pad.swapped ? 'east' : 'south'; if (a === 'back') return Pad.swapped ? 'south' : 'east'; return PHYS[a] || a; }
function glyph(a, scale = 2) { const src = padGlyph(gname(a), Pad.style), c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); c.className = 'pgc'; c.style.width = src.width * scale + 'px'; c.style.height = src.height * scale + 'px'; return c; }
function fillSlots() { const k = Pad.style + (Pad.swapped ? 's' : ''); for (const s of document.querySelectorAll('.pg[data-pg]')) { if (s._k === k) continue; s._k = k; s.textContent = ''; s.append(glyph(s.getAttribute('data-pg'), +s.getAttribute('data-pgs') || 2)); } }

/* ---------- the layer ---------- */
function ensure() {
  if (L) return L;
  L = { box: el('div', { id: 'padnav', 'aria-hidden': 'true' }), ring: el('div', { id: 'pad-ring' }), cur: el('div', { id: 'pad-cur' }), deco: el('div', { id: 'pad-deco' }), bar: el('div', { id: 'pad-bar' }) };
  L.cur.append(cursorArt()); L.box.append(L.deco, L.ring, L.cur); document.body.append(L.box, L.bar);
  if (!document.querySelector('link[href="src/ui/padnav.css"]') && document.querySelector('link[href="src/ui/style.css"]')) document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/padnav.css' }));
  mo = new MutationObserver(() => { dirty = true; });
  if (!G.overlays.includes(drawTarget)) G.overlays.push(drawTarget);
  return L;
}
function cursorArt() {   // a chunky pixel pointer hand
  const R = ['.##.........', '#ww#........', '#ww#........', '#ww#........', '#ww###......', '#ww#ww###...', '#ww#ww#ww##.', '#ww#ww#ww#w#', '#wwwwwwwwww#', '#wwwwwwwwww#', '#wwwwwwwwww#', '.#wwwwwwww#.', '.#wwwwwwww#.', '..########..'];
  const c = document.createElement('canvas'); c.width = 12; c.height = 14; const g = c.getContext('2d'); R.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') { g.fillStyle = r[i] === '#' ? '#2a2733' : '#fff4dc'; g.fillRect(i, j, 1, 1); } });
  c.style.width = '24px'; c.style.height = '28px'; c.className = 'pgc'; return c;
}
function patchCapture() {   /* the synthetic pointer has no real capture: pretend (events are sent to the pressed element anyway), so game code that captures does not throw */
  if (patched) return; patched = true; const P = Element.prototype, s = P.setPointerCapture, r = P.releasePointerCapture, h = P.hasPointerCapture;
  if (s) P.setPointerCapture = function (id) { if (id === PID) return; return s.call(this, id); };
  if (r) P.releasePointerCapture = function (id) { if (id === PID) return; return r.call(this, id); };
  if (h) P.hasPointerCapture = function (id) { if (id === PID) return !!press && press.el === this; return h.call(this, id); };
}

/* ---------- which state are we in ---------- */
const hudPaused = () => { const e = document.querySelector('.hud-paused.on'); return e || null; };
function uiActive() {
  if (osk || hudFocus) return true; if (!G.scene) return true;
  if (G.onTitle || G.modal > 0) return true;
  if ((G.cutscene || G.busy) && overlayN > 0) return true;
  return false;
}
/** 'world' | 'ui' | 'cursor' | 'surf' */
function state() { if (cursorOn) return 'cursor'; if (surf) return 'surf'; return uiActive() ? 'ui' : 'world'; }

/* ---------- scanning the screen ---------- */
const ROLES = /^(button|tab|option|link|checkbox|switch|menuitem|radio)$/;
function focusable(e) {
  const t = e.tagName;
  if (t === 'BUTTON' || t === 'SELECT' || t === 'TEXTAREA') return !e.disabled;
  if (t === 'INPUT') return !e.disabled && e.type !== 'hidden';
  if (t === 'CANVAS') return e.matches(SURF);
  if (e._pn || e.onclick) return true;
  if (t === 'A') return e.hasAttribute('href');
  if (t === 'DIV' || t === 'SPAN' || t === 'LI' || t === 'LABEL') { const r = e.getAttribute('role'); if (r && ROLES.test(r)) return true; return e.hasAttribute('data-pad') || e.hasAttribute('tabindex') || e.hasAttribute('data-pad-surface') || e.matches(SURF); }
  return false;
}
let scCache = null;
function scroller(e) {
  const w = wrapEl(); let a = e.parentElement, steps = [];
  while (a && a !== w && a !== document.body) {
    if (scCache.has(a)) { const v = scCache.get(a); for (const s of steps) scCache.set(s, v); return v; }
    if (a.scrollHeight > a.clientHeight + 6 || a.scrollWidth > a.clientWidth + 6) { const cs = getComputedStyle(a); if (/auto|scroll/.test(cs.overflowY + cs.overflowX)) { for (const s of steps) scCache.set(s, a); scCache.set(e, a); return a; } }
    steps.push(a); a = a.parentElement;
  }
  for (const s of steps) scCache.set(s, null); return null;
}
const liveCache = new Map();
function live(sc) {
  if (liveCache.has(sc)) return liveCache.get(sc); liveCache.set(sc, false);
  const r = sc.getBoundingClientRect(), p = scroller(sc); let l = Math.max(0, r.left), t = Math.max(0, r.top), rr = Math.min(innerWidth, r.right), b = Math.min(innerHeight, r.bottom), ok = false;
  if (p) { const q = p.getBoundingClientRect(); l = Math.max(l, q.left); t = Math.max(t, q.top); rr = Math.min(rr, q.right); b = Math.min(b, q.bottom); }
  if (rr - l < 4 || b - t < 4) ok = p ? live(p) : false;
  else for (const [fx, fy] of [[.5, .5], [.25, .3], [.75, .7], [.5, .12], [.5, .88]]) { const h = document.elementFromPoint(l + (rr - l) * fx, t + (b - t) * fy); if (h && (sc === h || sc.contains(h))) { ok = true; break; } }
  liveCache.set(sc, ok); return ok;
}
function reachable(e, r) {
  let l = r.left, t = r.top, rr = r.right, b = r.bottom; const sc = scroller(e);
  if (sc) { const q = sc.getBoundingClientRect(); l = Math.max(l, q.left); t = Math.max(t, q.top); rr = Math.min(rr, q.right); b = Math.min(b, q.bottom); if (rr - l < 3 || b - t < 3) return live(sc); }
  const x = (l + rr) / 2, y = (t + b) / 2; if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return false;
  const h = document.elementFromPoint(x, y); return !!h && (e === h || e.contains(h) || (h.tagName === 'LABEL' && h.contains(e)));
}
function layerRoot(e) { const ui = root(), w = wrapEl(); let a = e; while (a.parentElement && a.parentElement !== ui && a.parentElement !== w && a.parentElement !== document.body) a = a.parentElement; return a; }
const label = e => (e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim();
function scan() {
  scanAt = now(); dirty = false; scCache = new Map(); liveCache.clear();
  const w = document.body, all = w.getElementsByTagName('*'), out = [], vw = innerWidth, vh = innerHeight;
  for (let i = 0; i < all.length; i++) {
    const e = all[i]; if (!focusable(e)) continue; const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
    const sf = e.matches(SURF);
    if (!sf && r.width > vw * .9 && r.height > vh * .6 && !e.hasAttribute('data-pad')) continue;   // a backdrop, not a button
    if (L && L.box.contains(e)) continue;
    if (!reachable(e, r)) continue;
    out.push({ e, r, root: layerRoot(e), sf });
  }
  for (const s of surfaces) { const q = s.rect(); if (!q || q.right - q.left < 20 || q.bottom - q.top < 20) continue; const h = document.elementFromPoint((q.left + q.right) / 2, (q.top + q.bottom) / 2); if (h !== s.el && !s.el.contains(h)) continue; out.push({ e: s.el, r: { left: q.left, top: q.top, right: q.right, bottom: q.bottom, width: q.right - q.left, height: q.bottom - q.top }, root: s.el, sf: true, virt: s }); }
  for (const c of out) if (c.sf || c.e.firstElementChild) { c.box = false; for (const d of out) if (d !== c && c.e !== d.e && c.e.contains(d.e)) { c.box = true; break; } }
  const over = out.filter(c => !c.root.matches(PASSIVE)); overlayN = over.length;
  /* a window / sheet / cutscene owns the focus: the HUD under it is not part of the set (step onto the HUD with D-pad up from the world) */
  if (osk) list = out.filter(c => osk.box.contains(c.e));
  else if (hudFocus) list = out;
  else if (G.onTitle || G.modal > 0 || G.cutscene || G.busy || !G.scene) list = over.length ? over : hudPaused() ? out.filter(c => c.e.classList.contains('hud-paused')) : [];
  else list = [];   // walking about: nothing is focused (D-pad up steps onto the HUD)
  /* decorations */
  back = findBack(); skip = null; keysMap = {}; tabsEl = null;
  for (const c of list) { const e = c.e; if (!skip && (e.hasAttribute('data-pad-skip') || (/^skip\b/i.test(label(e)) && !e.closest('[data-set]')))) skip = e;   // not Settings' "Skip" (the tune) const k = e.getAttribute('data-pad-key'); if (k) keysMap[k] = e; }
  tabsEl = findTabs(); mainScroll = null;
}
function rectOf(c) { if (c.virt) { const q = c.virt.rect(); return { left: q.left, top: q.top, right: q.right, bottom: q.bottom, width: q.right - q.left, height: q.bottom - q.top }; } return c.e.getBoundingClientRect(); }
const inList = e => list.find(c => c.e === e) || null;
const BACK = [/^(◀\s*)?back$/i, /^(x|✕|×|close|close .{0,24}|dismiss|put phone away)$/i, /^(cancel|not now|no thanks|maybe later|later|never mind|done|resume)$/i];
function backRank(e) { if (e.hasAttribute('data-pad-back')) return 0; if (e.classList.contains('ph-hback')) return 1; const t = label(e); if (t.length > 30) return -1; if (BACK[0].test(t)) return 1; if (e.classList.contains('x') || BACK[1].test(t)) return 2; if (BACK[2].test(t)) return 3; return -1; }
function depthOf(e) { let d = 0; while (e) { d++; e = e.parentElement; } return d; }
function lca(a, b) { if (!a || !b) return 0; const s = new Set(); for (let x = a; x; x = x.parentElement) s.add(x); for (let x = b; x; x = x.parentElement) if (s.has(x)) return depthOf(x); return 0; }
function findBack() {
  let best = null, bs = -1; const f = focus && focus.isConnected ? focus : null;
  for (const c of list) { const k = backRank(c.e); if (k < 0) continue; if (c.e.disabled) continue; const s = (f ? lca(f, c.e) : 0) * 10 + (4 - k) + (c.root.matches(PASSIVE) ? -500 : 0); if (s > bs) { bs = s; best = c.e; } }
  return best;
}
function findTabs() {
  let best = null, bd = -1; const f = focus && focus.isConnected ? focus : null;
  for (const c of list) { const p = c.e.parentElement; if (!p || p === best) continue; if (!(p.getAttribute('role') === 'tablist' || /(^|[\s-])tabs(\s|$)/.test(p.className || ''))) continue; const d = f ? lca(f, p) : 1; if (d > bd) { bd = d; best = p; } }
  return best;
}

/* ---------- focus ---------- */
const padAttr = e => e.getAttribute('data-pad');
const words = t => t.replace(/[^a-zA-Z ]+.*$/, '').trim().slice(0, 24) || t;   // 'Messages, 3 new' and 'Messages' are the same button
function setFocus(c, quiet) {
  if (!c) { focus = null; return; }
  if (focus && focus !== c.e && focus.isConnected && c.root !== froot) { hist.push(focus); if (hist.length > 8) hist.shift(); }
  focus = c.e; froot = c.root; frect = rectOf(c); flabel = label(c.e).slice(0, 40); lost = null;
  if (!c.virt) { const sc = scCache && scroller(c.e); if (sc) { try { c.e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { c.e.scrollIntoView(false); }
    const r = c.e.getBoundingClientRect(), q = sc.getBoundingClientRect(), m = Math.min(26, Math.max(0, (q.height - r.height) / 2));   // not flush against the list's edge: the ring and the next row stay in view
    if (r.bottom > q.bottom - m) sc.scrollTop += r.bottom - (q.bottom - m); else if (r.top < q.top + m) sc.scrollTop -= q.top + m - r.top; frect = c.e.getBoundingClientRect(); } }
  back = findBack(); tabsEl = findTabs();
}
function defaultFocus(any, strict) {
  let c = list.find(q => q.e.getAttribute('data-pad') === 'default' || q.e.hasAttribute('autofocus')); if (c) return c;
  const vis = q => q.r.top >= -2 && q.r.left >= -2 && q.r.bottom <= innerHeight + 2 && q.r.right <= innerWidth + 2;
  const plain = q => backRank(q.e) < 0 && vis(q) && !padAttr(q.e) && !q.box;   // not a back button, not a dialogue line, not an aside, not a box around other things
  const body = q => plain(q) && !q.root.matches(PASSIVE) && !q.e.closest('[class$="-head"],[class*="-head "]');   // and not a header's Auto / Pause / Log either: the window's content first
  c = list.find(body) || list.find(q => plain(q) && !q.root.matches(PASSIVE)) || list.find(plain) || list.find(q => vis(q) && padAttr(q.e) === 'line');
  /* strict: what was focused vanished but its window is still there (a question was answered, the next is not up yet): the ring does not jump to Close / x */
  if (!c && !(strict && !any)) c = list.find(q => backRank(q.e) < 0 && vis(q) && padAttr(q.e) !== 'aside') || list.find(q => vis(q) && padAttr(q.e) !== 'aside');
  /* an "aside" (Auto, Log, ...) never takes the focus by itself: only when the player pushes a direction and there is nothing else (any = true) */
  return c || (any ? list.find(vis) || list[0] || null : null);
}
/* after a re-render: the thing with the same words close to where the focus was (same = true), else whatever (not a Back button) now sits on that spot */
function nearest(r, lab, sameOnly) {
  let best = null, bd = 1e9; const x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2;
  for (const c of list) { const q = c.r, same = lab && label(c.e).slice(0, 40) === lab; if (sameOnly ? !same : (backRank(c.e) >= 0 || padAttr(c.e))) continue; const d = Math.hypot((q.left + q.right) / 2 - x, (q.top + q.bottom) / 2 - y); if (d < bd) { bd = d; best = c; } }
  return bd < (sameOnly ? 180 : 70) ? best : null;
}
/** keep the focus on something real after every scan */
function refocus(any) {
  if (!list.length) { focus = null; return; }
  const cur = focus && inList(focus);
  /* a dialogue LINE (data-pad="line") holds the focus only while there is nothing to choose: when answers appear the focus goes to the first of them */
  if (cur && padAttr(cur.e) === 'line') { const alt = list.find(c => c.root === cur.root && !padAttr(c.e) && backRank(c.e) < 0 && !c.sf && !cur.e.contains(c.e)); if (alt) return setFocus(alt, true); }
  if (cur) { frect = rectOf(cur); return; }
  /* the element went away. Same layer still there (a list re-rendered): the nearest thing to where it was, same words first. Otherwise: where we were before, else the default. */
  const rootAlive = froot && froot.isConnected && list.some(c => c.root === froot);
  if (focus && rootAlive && frect) {
    const c = nearest(frect, flabel, true); if (c) return setFocus(c, true);
    autoAt = now();
    /* a new page inside the same window (a phone app opened, or closed again): going back puts the focus where it was (same words, same spot) */
    for (let i = trail.length - 1; i >= 0; i--) { const t = trail[i]; if (t.root !== froot) continue; const m = list.filter(q => words(label(q.e)) === words(t.lab)); if (!m.length) continue;
      const dist = q => Math.hypot((q.r.left + q.r.right) / 2 - t.x, (q.r.top + q.r.bottom) / 2 - t.y); m.sort((a, b2) => dist(a) - dist(b2)); if (m.length > 1 && dist(m[0]) > 60) continue;   // one of a kind: wherever it is (the page may still be sliding in)
      trail.length = i; return setFocus(m[0], true); }
    if (flabel) { trail.push({ lab: flabel, x: (frect.left + frect.right) / 2, y: (frect.top + frect.bottom) / 2, root: froot }); if (trail.length > 12) trail.shift(); }
    const c3 = nearest(frect, flabel, false); if (c3) return setFocus(c3, true);
  }
  for (let i = hist.length - 1; i >= 0; i--) { const c = hist[i].isConnected && inList(hist[i]); if (c) { hist.length = i; return setFocus(c, true); } }
  hist = hist.filter(h => h.isConnected); const was = !!focus, strict = (was && rootAlive) || !!(lost && lost.isConnected && list.some(c => c.root === lost));
  setFocus(defaultFocus(any, strict), true); if (!was) fresh = true; else autoAt = now();
  if (!focus && strict) lost = lost || froot;
}
function move(dx, dy) {
  if (!focus || !inList(focus)) { refocus(); return !!focus; }
  const cur = inList(focus), a = rectOf(cur); frect = a; let best = null, bs = 1e9, wrap = null, ws = -1e9, outer = null, outerA = 0;
  const acx = (a.left + a.right) / 2, acy = (a.top + a.bottom) / 2;
  for (const c of list) {
    if (c.e === focus) continue; const q = rectOf(c), qx = (q.left + q.right) / 2, qy = (q.top + q.bottom) / 2;
    let fwd, side, ctr;
    if (dx) { fwd = dx > 0 ? q.left - a.right : a.left - q.right; side = Math.max(0, Math.max(q.top - a.bottom, a.top - q.bottom)); ctr = (qx - acx) * dx; }
    else { fwd = dy > 0 ? q.top - a.bottom : a.top - q.bottom; side = Math.max(0, Math.max(q.left - a.right, a.left - q.right)); ctr = (qy - acy) * dy; }
    const off = dx ? Math.abs(qy - acy) : Math.abs(qx - acx);
    if (q.left >= a.left - 1 && q.right <= a.right + 1 && q.top >= a.top - 1 && q.bottom <= a.bottom + 1) {   // it is inside the focused thing (a button on the map): in, toward it
      if (ctr > 2) { const s = Math.hypot(qx - acx, qy - acy) * .6; if (s < bs) { bs = s; best = c; } } continue; }
    if (a.left >= q.left - 1 && a.right <= q.right + 1 && a.top >= q.top - 1 && a.bottom <= q.bottom + 1) { if (!outer || q.width * q.height < outerA) { outer = c; outerA = q.width * q.height; } continue; }   // the thing the focus is inside: where a move ends up when nothing else lies that way
    if (ctr > 2 && fwd > -Math.min(dx ? a.width : a.height, dx ? q.width : q.height) * .6) {
      if (side > 0 && side > (fwd + 40) * 2.5) continue;   // far off to the side: not "that way"
      const s = Math.max(0, fwd) + side * TW.sideWeight + off * .25 + (c.box ? 140 : 0); if (s < bs) { bs = s; best = c; }   // a box with things in it (the map): its contents first
    } else if (side <= 0 && ctr < -2) { const s = -ctr; if (s > ws) { ws = s; wrap = c; } }   // same row / column, the far end: where a wrap lands
  }
  if (!best) {
    /* nothing further that way: scroll the list if it can, else wrap along the row / column */
    const sc = scCache && scroller(focus) || mainScroller();
    if (sc && dy && (dy > 0 ? sc.scrollTop + sc.clientHeight < sc.scrollHeight - 2 : sc.scrollTop > 0)) { sc.scrollTop += dy * sc.clientHeight * .6; dirty = true; return true; }
    if (sc && dx && sc.scrollWidth > sc.clientWidth + 6 && (dx > 0 ? sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 2 : sc.scrollLeft > 0)) { sc.scrollLeft += dx * sc.clientWidth * .6; dirty = true; return true; }
    best = outer || wrap;
  }
  if (!best) { bump(); return false; }
  setFocus(best); return true;
}
function bump() { if (!L) return; L.ring.classList.remove('bump'); void L.ring.offsetWidth; L.ring.classList.add('bump'); }
function mainScroller() {
  if (mainScroll && mainScroll.isConnected) return mainScroll; mainScroll = null; let ba = 0;
  const roots = new Set(list.map(c => c.root)); if (!roots.size && !hudFocus) for (const r of root().children) if (!r.matches(PASSIVE)) roots.add(r);
  for (const r of roots) { const all = r.querySelectorAll('*'); for (let i = 0; i < all.length && i < 4000; i++) { const a = all[i]; if (a.scrollHeight > a.clientHeight + 6 && a.clientHeight > 60) { const cs = getComputedStyle(a); if (!/auto|scroll/.test(cs.overflowY)) continue; const q = a.getBoundingClientRect(), ar = q.width * q.height; if (ar > ba && live(a)) { ba = ar; mainScroll = a; } } } }
  return mainScroll;
}

/* ---------- pressing things ---------- */
const dead = t => !!(t && t.closest && t.closest('button:disabled,input:disabled,select:disabled,textarea:disabled'));   // a real finger does nothing on a disabled control: neither does the pad
function ptr(type, t, x, y, buttons) {
  if (!t || dead(t)) return; let ev;
  try { ev = new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y, screenX: x, screenY: y, pointerId: PID, pointerType: 'touch', isPrimary: true, button: type === 'pointermove' ? -1 : 0, buttons: buttons || 0, width: 1, height: 1, pressure: buttons ? .5 : 0 }); }
  catch (e) { ev = new MouseEvent(type, { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y }); }
  t.dispatchEvent(ev);
}
function click(t, x, y) { if (t && t.isConnected && !dead(t)) t.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y, screenX: x, screenY: y, detail: 1 })); }
function key(k, type = 'keydown') { const code = k === ' ' ? 'Space' : k.length === 1 ? 'Key' + k.toUpperCase() : k; (document.activeElement && document.activeElement !== document.body && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) ? document.activeElement : document.body).dispatchEvent(new KeyboardEvent(type, { key: k, code, bubbles: true, cancelable: true, composed: true, view: window })); }
function tapKey(k) { key(k, 'keydown'); key(k, 'keyup'); }
const isText = e => e && (e.tagName === 'TEXTAREA' || (e.tagName === 'INPUT' && /^(text|search|email|url|tel|password|number|)$/.test(e.getAttribute('type') || '')));
function activate() {
  const c = focus && inList(focus); if (!c) { refocus(); return; }
  if (now() - autoAt < TW.mashGuard) return;   // what was focused has just gone and the ring jumped: a Confirm meant for the old thing does not press the new one
  const e = c.e, r = rectOf(c), x = Math.max(1, Math.min(innerWidth - 1, (r.left + r.right) / 2)), y = Math.max(1, Math.min(innerHeight - 1, (r.top + r.bottom) / 2));
  if (c.sf) return enterSurface(c);
  if (isText(e)) { if (Pad.mode === 'pad') openOsk(e); else e.focus(); return; }
  if (e.tagName === 'INPUT' && e.type === 'range') return;
  if (e.tagName === 'SELECT') return stepSelect(e, 1);
  patchCapture(); ptr('pointerdown', e, x, y, 1); if (e.isConnected) ptr('pointerup', e, x, y, 0); click(e, x, y);
  if (hudFocus) hudFocus = false;   // one press on the HUD, then back to walking (or into the window it opened)
  dirty = true; scanAt = Math.min(scanAt, now() - .12);
}
function stepSelect(e, d) { const n = e.options.length; if (!n) return; e.selectedIndex = (e.selectedIndex + d + n) % n; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); dirty = true; }
function stepRange(e, d) { const min = +e.min || 0, max = e.max === '' ? 100 : +e.max, st = +e.step || (max - min) / 20 || 1, v = Math.max(min, Math.min(max, (+e.value || 0) + d * st)); if (v === +e.value) return bump(); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }
function clickEl(e) { if (!e || !e.isConnected) return false; const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; patchCapture(); ptr('pointerdown', e, x, y, 1); if (e.isConnected) ptr('pointerup', e, x, y, 0); click(e, x, y); dirty = true; scanAt = Math.min(scanAt, now() - .12); return true; }
function goBack() {
  if (osk) return closeOsk(); if (cursorOn) return setCursor(false); if (surf) return leaveSurface();
  if (hudFocus) { hudFocus = false; dirty = true; return; }
  const p = hudPaused(); if (p) return G.hud.pause(false);
  if (dirty) { scan(); refocus(); }
  if (back && back.isConnected) return clickEl(back);
  tapKey('Escape'); dirty = true;
}
function tab(d) {
  const t = tabsEl && tabsEl.isConnected ? tabsEl : null; if (!t) return false;
  const bs = [...t.children].filter(b => focusable(b) && b.offsetWidth > 0); if (bs.length < 2) return false;
  let i = bs.findIndex(b => b.classList.contains('on') || b.classList.contains('sel') || b.classList.contains('active') || b.getAttribute('aria-selected') === 'true' || b.getAttribute('aria-pressed') === 'true'); if (i < 0) i = bs.indexOf(focus); if (i < 0) i = d > 0 ? -1 : 0;
  const b = bs[(i + d + bs.length) % bs.length]; clickEl(b); Pad.rumble('tick'); return true;
}

/* ---------- the free cursor + surfaces ---------- */
function setCursor(on) {
  ensure(); if (on === cursorOn) return; cursorOn = on; if (press) release();
  if (on) { patchCapture(); const r = focus && inList(focus) ? rectOf(inList(focus)) : null; if (state() !== 'world' && r) { cx = (r.left + r.right) / 2; cy = (r.top + r.bottom) / 2; } else { cx = innerWidth / 2; cy = innerHeight * .45; } }
  L.cur.classList.toggle('on', on || !!surf); dirty = true;
}
function bounds() { if (surf) { const q = surf.rect(); return [q.left + 2, q.top + 2, q.right - 2, q.bottom - 2]; } return [2, 2, innerWidth - 2, innerHeight - 2]; }
function pressAt() {
  if (press) return; const t = document.elementFromPoint(cx, cy); if (!t) return; press = { el: t, x: cx, y: cy, moved: 0 }; ptr('pointerdown', t, cx, cy, 1); L.cur.classList.add('down');
}
function release() {
  const p = press; if (!p) return; press = null; L.cur.classList.remove('down'); ptr('pointerup', p.el, cx, cy, 0);
  if (p.moved < 10) { const t = document.elementFromPoint(cx, cy); if (t && (t === p.el || p.el.contains(t) || t.contains(p.el))) click(p.el.contains(t) ? t : p.el, cx, cy); }
  dirty = true;
}
function moveCursor(dt) {
  let vx = Pad.lx, vy = Pad.ly; const m = Math.hypot(vx, vy);
  if (m > 0) { const sp = TW.cursorSpeed * (Pad.prefs.cursor || 1) * (surf && surf.fast ? 1.5 : 1) * (.25 + .75 * m * m); cx += vx / m * sp * dt; cy += vy / m * sp * dt; }
  const b = bounds(); cx = Math.max(b[0], Math.min(b[2], cx)); cy = Math.max(b[1], Math.min(b[3], cy));
  if (press && (Math.abs(cx - press.x) > .5 || Math.abs(cy - press.y) > .5)) { press.moved += Math.abs(cx - press.x) + Math.abs(cy - press.y); press.x = cx; press.y = cy; ptr('pointermove', press.el, cx, cy, 1); }
  const k = (cx | 0) + ',' + (cy | 0); if (L.cur._k !== k) { L.cur._k = k; L.cur.style.transform = 'translate(' + ((cx | 0) - 5) + 'px,' + ((cy | 0) - 1) + 'px)'; }
  /* right stick: scroll what is under the pointer (DOM lists) and send wheel events (canvases that zoom) */
  if (Pad.ry && !surf) scrollAt(cx, cy, Pad.ry * TW.scrollSpeed * dt);
}
function scrollAt(x, y, d) { let a = document.elementFromPoint(x, y); while (a && a !== document.body) { if (a.scrollHeight > a.clientHeight + 6 && /auto|scroll/.test(getComputedStyle(a).overflowY)) { a.scrollTop += d; return; } a = a.parentElement; } }
function wheelAt(x, y, d) { const t = document.elementFromPoint(x, y); if (t) t.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, deltaY: d, deltaMode: 0 })); }
function nudge(dx, dy) { const b = bounds(), s = surf ? Math.max(12, Math.min(b[2] - b[0], b[3] - b[1]) / (surf.grid || 8)) : 24; cx += dx * s; cy += dy * s; }
/** step inside a surface (a game canvas, the map, the room in Decorate): the stick moves a pointer that stays inside it, A presses, B steps out */
function enterSurface(c, auto) {
  ensure(); patchCapture(); const v = c.virt || {}, e = c.e, kind = v.kind || e.getAttribute('data-pad-surface') || (e.matches('.ph-map') ? 'pan' : 'cursor');
  surf = { el: e, rect: v.rect || (() => e.getBoundingClientRect()), kind, keys: v.keys || null, auto: !!auto, grid: v.grid || 0, fast: !!v.fast, hints: v.hints || null };
  const q = surf.rect(); cx = (q.left + q.right) / 2; cy = (q.top + q.bottom) / 2; L.cur.classList.add('on'); L.cur.classList.toggle('cross', kind === 'pan'); dirty = true;
}
function leaveSurface() { if (press) release(); if (pan) panEnd(); surf = null; if (L) { L.cur.classList.toggle('on', cursorOn); L.cur.classList.remove('cross'); } dirty = true; }
/* 'pan' surfaces (the map): the stick drags the picture under a fixed crosshair, A taps what is under it, the triggers zoom */
let pan = null;
function panStep(dt) {
  const q = surf.rect(), mx = (q.left + q.right) / 2, my = (q.top + q.bottom) / 2, m = Math.hypot(Pad.lx, Pad.ly); cx = mx; cy = my;
  if (m > 0) { if (!pan) { pan = { x: mx, y: my }; ptr('pointerdown', surf.el, mx, my, 1); } pan.x -= Pad.lx * 420 * dt; pan.y -= Pad.ly * 420 * dt; ptr('pointermove', surf.el, pan.x, pan.y, 1); }
  else if (pan) panEnd();
  const k = (cx | 0) + ',' + (cy | 0); if (L.cur._k !== k) { L.cur._k = k; L.cur.style.transform = 'translate(' + ((cx | 0) - 11) + 'px,' + ((cy | 0) - 11) + 'px)'; }
  if (Pad.rt > 0 || Pad.lt > 0) { zoomHeld -= dt; if (zoomHeld <= 0) { zoomHeld = .16; wheelAt(mx, my, Pad.rt > 0 ? -120 : 120); } } else zoomHeld = 0;
}
function panEnd() { const p = pan; pan = null; if (p) ptr('pointerup', surf ? surf.el : document.body, p.x + 60, p.y + 60, 0); }
/* a running mini-game of the shared kit takes the pad at once (no need to focus its canvas first) */
function autoSurface() {
  const mg = G.minigame && G.minigame.MG && G.minigame.MG.cur;
  if (mg && mg.canvas && mg.canvas.isConnected) {
    const st = mg.state(); if (st.done || st.paused || osk) { if (surf && surf.auto) leaveSurface(); return; }
    if (mg.kind === 'sort') { if (surf && surf.auto) leaveSurface(); return; }   // the bins are buttons: the focus layer plays it
    if (!surf || surf.el !== mg.canvas) { enterSurface({ e: mg.canvas, virt: { rect: () => mg.canvas.getBoundingClientRect(), kind: 'game', fast: true } }, true); surf.mg = mg; surf.lanes = mg.kind === 'rhythm' ? Math.max(1, Math.min(4, (mg.def.o && mg.def.o.lanes) || 3)) : 0; }
  } else if (surf && surf.auto) leaveSurface();
  else if (surf && !surf.el.isConnected) leaveSurface();
}
const LANES = { 1: ['ok'], 2: ['x', 'back'], 3: ['x', 'ok', 'back'], 4: ['left', 'right', 'x', 'back'] };
function laneTap(i, n, downNow) { const q = surf.rect(), x = q.left + q.width * (12 + (i + .5) * 156 / n) / 180, y = q.top + q.height * .8;   /* the kit's lanes: 12 px in from each side of its 180 px field */ if (downNow) { ptr('pointerdown', surf.el, x, y, 1); } else ptr('pointerup', surf.el, x, y, 0); }

/* ---------- the pad keyboard (text fields) ---------- */
const ROWS = ['1234567890', 'qwertyuiop', 'asdfghjkl\'', 'zxcvbnm,.-'];
function openOsk(input) {
  if (osk) closeOsk(); let shift = !input.value;
  const show = el('div.osk-text'), keys = el('div.osk-keys'), max = +input.getAttribute('maxlength') || 60;
  const tgt = () => { if (osk.input.isConnected) return osk.input; const a = osk.input.getAttribute('aria-label'), p = osk.input.getAttribute('placeholder'); const n = [...document.querySelectorAll('input,textarea')].find(q => isText(q) && !osk.box.contains(q) && (a ? q.getAttribute('aria-label') === a : q.getAttribute('placeholder') === p)); if (n) osk.input = n; return osk.input; };
  const put = v => { const t = tgt(); t.value = v.slice(0, max); t.dispatchEvent(new Event('input', { bubbles: true })); if (!t.value) shift = true; draw(); };   // an empty field starts with a capital
  const draw = () => { show.textContent = tgt().value; show.classList.toggle('empty', !tgt().value); if (!tgt().value) show.textContent = input.getAttribute('placeholder') || input.getAttribute('aria-label') || ''; for (const b of keys.querySelectorAll('[data-ch]')) b.textContent = shift ? b.dataset.ch.toUpperCase() : b.dataset.ch; };
  const type = ch => { put(tgt().value + (shift ? ch.toUpperCase() : ch)); if (shift) { shift = false; draw(); } };
  for (const r of ROWS) keys.append(el('div.osk-row', null, [...r].map(ch => el('button', { 'data-ch': ch, onclick: () => type(ch) }, ch))));
  keys.append(el('div.osk-row', null, el('button.wide', { onclick: () => { shift = !shift; draw(); } }, 'Shift'), el('button.space', { onclick: () => type(' ') }, el('i.pg', { 'data-pg': 'y', 'data-pgs': 1 }), 'Space'), el('button.wide', { onclick: () => put(tgt().value.slice(0, -1)) }, el('i.pg', { 'data-pg': 'x', 'data-pgs': 1 }), 'Delete'), el('button.wide.go', { 'data-pad-back': '', onclick: () => closeOsk() }, el('i.pg', { 'data-pg': 'start', 'data-pgs': 1 }), 'Done')));
  const box = el('div', { id: 'pad-osk' }, el('div.osk', { role: 'dialog', 'aria-label': 'Keyboard' }, show, keys));
  osk = { box, input, back: () => put(tgt().value.slice(0, -1)), space: () => type(' '), tgt }; root().append(box); draw(); fillSlots(); dirty = true; focus = null;
}
function closeOsk() {
  const o = osk; if (!o) return; osk = null; o.box.remove(); const t = o.input.isConnected ? o.input : null;
  if (t) { t.dispatchEvent(new Event('change', { bubbles: true })); t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })); focus = t; }
  dirty = true;
}

/* ---------- the world: target, highlight ---------- */
const FACE = [[1, 0], [0, 1], [-1, 0], [0, -1]];
function pickTarget(force) {
  const p = G.player; if (!p || !G.scene || G.busy || G.cutscene || G.modal) { target = null; return; }
  const t = now(); if (!force && t - tgtT < .1) return; tgtT = t;
  if (tgtLock && target) { if (t > tgtLock || Math.hypot(p.x - tgtAt[0], p.y - tgtAt[1]) > 1.5 || !stillThere(target)) tgtLock = 0; else return; }
  let f = FACE[p.dir] || FACE[1]; const st = Pad.steer(); if (st) f = st;
  let best = null, bs = 1e9, cs = 1e9; const L0 = G.interactables();
  /* just through a door: the door behind you is not offered again until you step away from it or push the stick at it (else A, A walks you in and straight back out) */
  if (arrive && arrive.it === undefined) { let bd = TW.near; arrive.it = null; for (const it of L0) { const d = Math.hypot(it.x - arrive.x, it.y - arrive.y); if (d < bd && !it.ent) { bd = d; arrive.it = it; } } }
  if (arrive && Math.hypot(p.x - arrive.x, p.y - arrive.y) > 1) arrive = null;
  for (const it of L0) {
    const dx = it.x - p.x, dy = it.y - p.y, d = Math.hypot(dx, dy); if (d > TW.reach) continue;
    if (arrive && it === arrive.it) { if (st && d > .05 && (dx * st[0] + dy * st[1]) / d > .5) arrive = null; else continue; }   // pushed at it: it is wanted after all
    const s = d - (d > .05 ? (dx * f[0] + dy * f[1]) / d : 1) * TW.facing * Math.min(1, d / 1.2) - (d <= TW.near ? TW.nearBonus : 0) + (it.ent ? TW.people : 0);   // what you stand next to beats what is merely ahead; a door or a counter beats a passer-by
    if (it === target) cs = s; if (s < bs) { bs = s; best = it; }
  }
  if (target && cs < 1e9 && best !== target && bs > cs - TW.sticky) best = target;
  target = best;
}
const stillThere = it => G.interactables().includes(it);
function cycle(d) {
  const p = G.player; if (!p || G.busy || G.cutscene) return;
  const L2 = G.interactables().filter(it => { const dd = Math.hypot(it.x - p.x, it.y - p.y); if (dd > TW.cycleReach) return false; const s = G.toScreen(it.x, it.y, it.z || 0); return s.x > 0 && s.y > 0 && s.x < innerWidth && s.y < innerHeight; });
  if (!L2.length) return bump();
  /* in screen order, left to right (ties: top to bottom) */
  const sx = it => { const s = G.toScreen(it.x, it.y, it.z || 0); return s.x + s.y * .001; }; L2.sort((a, b) => sx(a) - sx(b));
  let i = L2.indexOf(target); i = i < 0 ? (d > 0 ? 0 : L2.length - 1) : (i + d + L2.length) % L2.length;
  target = L2[i]; tgtLock = now() + TW.lockSecs; tgtAt = [p.x, p.y]; Pad.rumble('tick');
}
function useTarget() { if (!target || G.busy || G.cutscene || G.modal) return false; const it = target; tgtLock = 0; Pad.rumble('bump'); G.useInteractable(it); return true; }
let BR = null;
function brackets() {   // four gold corners with a dark edge, drawn once
  if (BR) return BR; BR = document.createElement('canvas'); BR.width = 7; BR.height = 7; const g = BR.getContext('2d'); g.fillStyle = '#2a2733'; g.fillRect(0, 0, 7, 3); g.fillRect(0, 0, 3, 7); g.fillStyle = '#ffd23e'; g.fillRect(1, 1, 5, 1); g.fillRect(1, 1, 1, 5); return BR;
}
function drawTarget(ctx, cam) {
  if (Pad.mode !== 'pad' || !target || G.modal || G.busy || G.cutscene || cursorOn || hudFocus || surf || lastState !== 'world') return;
  const it = target, z = it.z !== undefined ? it.z : G.world.heightAt(it.x, it.y), h = it.ent ? 1.7 : Math.max(.9, Math.min(2.4, (it.h === undefined ? .8 : it.h) + .5));
  const a = WS(it.x, it.y, z), cxp = Math.round(a[0] - cam.x), by = Math.round(a[1] - cam.y) + 4, ty = Math.round(a[1] - h * U - cam.y) - 2, hw = it.ent ? 8 : 11, pul = Math.round(Math.sin(performance.now() / 170) * 1.2), b = brackets();
  const l = cxp - hw - pul, r = cxp + hw + pul, t = ty - pul, bt = by + pul;
  ctx.drawImage(b, l, t); ctx.save(); ctx.translate(r + 1, t); ctx.scale(-1, 1); ctx.drawImage(b, 0, 0); ctx.restore();
  ctx.save(); ctx.translate(l, bt + 1); ctx.scale(1, -1); ctx.drawImage(b, 0, 0); ctx.restore(); ctx.save(); ctx.translate(r + 1, bt + 1); ctx.scale(-1, -1); ctx.drawImage(b, 0, 0); ctx.restore();
  /* a small arrow bobbing over it */
  const ay = t - 7 + Math.round(Math.sin(performance.now() / 240) * 1.5); ctx.fillStyle = '#2a2733'; ctx.fillRect(cxp - 4, ay - 1, 9, 3); ctx.fillRect(cxp - 3, ay + 2, 7, 1); ctx.fillRect(cxp - 2, ay + 3, 5, 1); ctx.fillRect(cxp - 1, ay + 4, 3, 1);
  ctx.fillStyle = '#ffd23e'; ctx.fillRect(cxp - 3, ay, 7, 1); ctx.fillRect(cxp - 2, ay + 1, 5, 1); ctx.fillRect(cxp - 1, ay + 2, 3, 1); ctx.fillRect(cxp, ay + 3, 1, 1);
}
function speed(d) { const S = [1, 2, 4], i = Math.max(0, S.indexOf(G.state.speed)), n = S[Math.max(0, Math.min(2, i + d))]; if (n === G.state.speed) return bump(); G.state.speed = n; if (G.hud) G.hud.refresh(); Pad.rumble('tick'); }

/* ---------- button routing ---------- */
function onDown(a) {
  ensure();
  if (a === 'r3') return setCursor(!cursorOn);
  if (osk) { if (a === 'x') return osk.back(); if (a === 'y') return osk.space(); if (a === 'start' || a === 'back') return closeOsk(); if (a === 'ok') return activate(); return; }
  let st = state();
  if (st === 'cursor') { st = uiActive() ? 'ui' : 'world'; if (a === 'ok') return pressAt(); if (a === 'back') return setCursor(false); if (a === 'l2' || a === 'r2') { if (document.elementFromPoint(cx, cy) === G.cv) return G.setZoom(G.zoom + (a === 'r2' ? 1 : -1)); return wheelAt(cx, cy, a === 'r2' ? -120 : 120); } if (/^(up|down|left|right)$/.test(a)) return nudge(a === 'left' ? -1 : a === 'right' ? 1 : 0, a === 'up' ? -1 : a === 'down' ? 1 : 0); if (a === 'l1' || a === 'r1') return; }
  if (st === 'surf') {
    if (surf.lanes) { const m = LANES[surf.lanes], i = m.indexOf(a); if (i >= 0) return laneTap(i, surf.lanes, true); }
    if (a === 'ok') { if (surf.kind === 'pan') { const q = surf.rect(), mx = (q.left + q.right) / 2, my = (q.top + q.bottom) / 2; if (pan) panEnd(); ptr('pointerdown', surf.el, mx, my, 1); ptr('pointerup', surf.el, mx, my, 0); dirty = true; return; } return pressAt(); }
    if (a === 'start') { if (surf.auto) return tapKey('Escape'); return leaveSurface(); }
    if (a === 'back') { if (surf.auto && !surf.lanes) return tapKey('Escape'); if (!surf.lanes) return leaveSurface(); return; }
    if (surf.keys && surf.keys[a]) return tapKey(surf.keys[a]);
    if (a === 'l1' || a === 'r1') { if (tab(a === 'r1' ? 1 : -1)) return; }
    if (a === 'up') return nudge(0, -1); if (a === 'down') return nudge(0, 1); if (a === 'left') return nudge(-1, 0); if (a === 'right') return nudge(1, 0);
    return;
  }
  if (st === 'ui') {
    if (dirty || now() - scanAt > .25) { scan(); refocus(); }
    if (a === 'ok') return activate();
    if (a === 'back') return goBack();
    if (a === 'l1') return void (tab(-1) || bump()); if (a === 'r1') return void (tab(1) || bump());
    if (a === 'x') { if (skip && skip.isConnected) return clickEl(skip); if (keysMap.x) return clickEl(keysMap.x); return; }
    if (a === 'y') { if (keysMap.y) return clickEl(keysMap.y); return; }
    if (a === 'l2' || a === 'r2') { const sc = (focus && scCache && scroller(focus)) || mainScroller(); if (sc) { sc.scrollTop += (a === 'r2' ? 1 : -1) * sc.clientHeight * .8; dirty = true; } return; }
    if (a === 'start') { if (G.phone && G.phone.isOpen && !G.onTitle) return G.phone.close(); if (hudFocus) { hudFocus = false; dirty = true; } const p = hudPaused(); if (p) G.hud.pause(false); return; }
    return;
  }
  /* the world */
  const paused = hudPaused();
  if (paused) { if (/^(ok|back|start|down|l3)$/.test(a)) G.hud.pause(false); return; }
  switch (a) {
    case 'ok': if (!useTarget()) { const adv = document.querySelector('[data-pad-advance]'); if (adv) clickEl(adv); } break;
    case 'back': worldBack(); break;
    case 'x': clickEl(document.querySelector('#hud .hud-bag')) || (G.inv && G.inv.open && G.inv.open()); break;
    case 'y': clickEl(document.querySelector('#hud .hud-myday')) || (G.myDay && G.myDay.open && G.myDay.open()); break;
    case 'start': if (G.phone && G.phone.open) G.phone.open(); break;
    case 'select': if (G.phone && G.phone.open) G.phone.open('map'); break;
    case 'l1': cycle(-1); break; case 'r1': cycle(1); break;
    case 'l2': G.setZoom(G.zoom - 1); break; case 'r2': G.setZoom(G.zoom + 1); break;
    case 'left': speed(-1); break; case 'right': speed(1); break;
    case 'down': case 'l3': if (G.hud && G.hud.visible) G.hud.pause(); break;
    case 'up': hudFocus = true; focus = null; dirty = true; break;
  }
}
function worldBack() {
  const p = G.player;
  if (G.busy) { const x = document.querySelector('#hud .hud-act-x'); if (G.busy.canCancel !== false) { if (x && x.offsetWidth) clickEl(x); else G.endActivity(false); } return; }
  if (document.querySelector('#hud .hud-panel.on')) return G.hud.togglePanel(false);
  if (p && (p.path || G.pending)) { p.stop(); G.pending = null; G.target = null; return; }
  if (tgtLock) { tgtLock = 0; return; }
}
function onUp(a) {
  if (a === 'ok' && press) release();
  if (surf && surf.lanes) { const m = LANES[surf.lanes], i = m.indexOf(a); if (i >= 0) laneTap(i, surf.lanes, false); }
}

/* ---------- once per polled frame while the pad is the input ---------- */
function onPoll(dt) {
  ensure(); autoSurface();
  const st = state(), t = now();
  if (st !== lastState) { lastState = st; dirty = true; if (st !== 'world') { G.camLook = null; } if (st !== 'ui') hudFocusOff(st); }
  const had = !!focus;
  if ((dirty && t - scanAt > .15) || t - scanAt > .7) { scan(); if (st === 'ui') refocus(); }
  if (st === 'cursor') moveCursor(dt);
  else if (st === 'surf') { if (surf.kind === 'pan') panStep(dt); else moveCursor(dt); }
  else if (st === 'ui') {
    const n = Pad.nav;
    if (n.x || n.y) {
      const f = focus && inList(focus) ? focus : null;
      if (fresh || !had || !f) { if (!f) refocus(true); }   // the first push only shows where the focus is
      else if (f && n.x && f.tagName === 'INPUT' && f.type === 'range') stepRange(f, n.x);
      else if (f && n.x && f.tagName === 'SELECT') stepSelect(f, n.x);
      else move(n.x, n.y);
    }
    if (Pad.ry) { const sc = (focus && scCache && scroller(focus)) || mainScroller(); if (sc) sc.scrollTop += Pad.ry * TW.scrollSpeed * dt; }
  } else {
    pickTarget();
    if (Pad.rx || Pad.ry) { const lk = G.camLook || (G.camLook = { x: 0, y: 0 }); lk.x = Pad.rx * G.W * TW.look; lk.y = Pad.ry * G.H * TW.look; } else if (G.camLook) G.camLook = null;
  }
  fresh = false; paint(st);
}
function hudFocusOff(st) { if (hudFocus && st !== 'ui') hudFocus = false; }
/* ---------- drawing the ring, the hints and the legend ---------- */
function paint(st) {
  const showRing = (st === 'ui') && focus && inList(focus);
  let k = '';
  if (showRing) { const c = inList(focus), r = rectOf(c); frect = r; k = Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.width) + ',' + Math.round(r.height); }
  if (k !== ringKey) { ringKey = k; const s = L.ring.style; if (!k) L.ring.classList.remove('on'); else { const r = frect; s.transform = 'translate(' + Math.round(r.left) + 'px,' + Math.round(r.top) + 'px)'; s.width = Math.round(r.width) + 'px'; s.height = Math.round(r.height) + 'px'; L.ring.classList.add('on'); } }
  if (Pad.mode !== 'pad') return;
  /* corner hints: B on what Back will press, X on Skip, LB / RB at the ends of the tab bar */
  const want = []; if (st === 'ui' && !osk) { if (back && back.isConnected && back !== focus) want.push([back, 'back', 0]); if (skip && skip.isConnected) want.push([skip, 'x', 0]); if (tabsEl && tabsEl.isConnected) { want.push([tabsEl, 'l1', 1]); want.push([tabsEl, 'r1', 2]); } for (const kk in keysMap) if (keysMap[kk] !== skip) want.push([keysMap[kk], kk, 0]); }
  const D = L.deco; while (D.children.length > want.length) D.lastChild.remove();
  want.forEach(([e, g, side], i) => {
    let d = D.children[i]; const gk = g + Pad.style + (Pad.swapped ? 's' : ''); if (!d) { d = el('i'); D.append(d); } if (d._g !== gk) { d._g = gk; d.textContent = ''; d.append(glyph(g, DS)); }
    const r = e.getBoundingClientRect(), w = d.firstChild.width * DS; let x = side === 2 ? r.right - w + 4 : side ? r.left - 5 : r.left - w + 7, y = side ? r.top - 12 : r.top - 11; x = Math.max(1, Math.min(innerWidth - w - 1, x)); y = Math.max(1, y);
    const off = r.width < 2 || r.bottom < 0 || r.top > innerHeight; const pk = off ? 'off' : Math.round(x) + ',' + Math.round(y); if (d._p !== pk) { d._p = pk; d.style.display = off ? 'none' : ''; d.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)'; }
  });
  legend(st);
}
function legend(st) {
  const scr = st === 'ui' && !!((focus && scCache && scroller(focus)) || mainScroll), f = st === 'ui' && focus && inList(focus) ? focus : null, sl = f && ((f.tagName === 'INPUT' && f.type === 'range') || f.tagName === 'SELECT');
  const k = [st, Pad.style, Pad.swapped, !!osk, hudFocus, st === 'ui' && !!back, st === 'ui' && !!skip, st === 'ui' && !!tabsEl, scr, sl, surf ? surf.kind + surf.lanes + (surf.auto ? 'a' : '') : '', st === 'world' && !!target, st === 'world' && !!G.busy, !!hudPaused(), f && isText(f)].join('|');
  if (k === legendKey) return; legendKey = k; const B = L.bar; B.textContent = '';
  const it = (g, text, cls) => { const s = el('span' + (cls ? '.' + cls : '')); for (const q of [].concat(g)) s.append(glyph(q, 2)); s.append(text); B.append(s); };
  if (osk) { it('ok', 'Type'); it('x', 'Delete'); it('y', 'Space'); it('start', 'Done'); }
  else if (st === 'cursor') { it('ls', 'Move'); it('ok', 'Tap, hold to drag'); it('rs', 'Scroll', 'wide'); it('back', 'Done'); }
  else if (st === 'surf') {
    if (surf.lanes) { const m = LANES[surf.lanes]; it(m.map(a => a === 'left' ? 'dleft' : a === 'right' ? 'dright' : a), surf.lanes > 1 ? 'Lanes, left to right' : 'Hit'); it('start', 'Pause'); }
    else if (surf.kind === 'pan') { it('ls', 'Move the map'); it('ok', 'Pick'); it(['l2', 'r2'], 'Zoom'); it('back', 'Back'); }
    else { it('ls', surf.auto ? 'Aim' : 'Move'); it('ok', surf.auto ? 'Tap / hold' : 'Tap, hold to drag'); for (const h of surf.hints || []) it(h[0], h[1]); it(surf.auto ? 'start' : 'back', surf.auto ? 'Pause' : 'Back'); }
  } else if (st === 'ui') {
    if (hudPaused()) it('ok', 'Continue');
    else if (sl) it('dlr', 'Change'); else if (f && isText(f)) it('ok', 'Type'); else it('ok', 'Select');
    if (hudFocus) it('back', 'Back to walking'); else if (!hudPaused() && back) it('back', 'Back');
    if (tabsEl) it(['l1', 'r1'], 'Tabs'); if (skip) it('x', 'Skip'); if (scr) it('rs', 'Scroll', 'wide');
  } else {
    if (hudPaused()) it('ok', 'Continue');
    else if (G.busy) { if (G.busy.canCancel !== false) it('back', 'Stop'); it('start', 'Phone'); }
    else { it('x', 'Bag'); it('y', 'My Day'); it('start', 'Phone'); it('select', 'Map'); it('dlr', 'Speed', 'wide'); it('ddown', 'Pause', 'wide'); it('dup', 'Top bar', 'wide'); it('rs', 'Look', 'wide'); it(['l1', 'r1'], 'Next target', 'wide'); }
  }
}

/* ---------- switching the layer on and off with the input in use ---------- */
function onMode(m, prev) {
  if (m === 'touch' && !L) return;
  ensure(); const b = document.body.classList, pad = m === 'pad', kb = m === 'keys';
  b.toggle('pad-on', pad); b.toggle('kb-on', kb);
  if (pad || kb) { try { mo.observe(root(), { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'disabled', 'aria-hidden'] }); } catch (e) { /* no observer: the timed rescan still runs */ } dirty = true; }
  else { mo.disconnect(); if (press) release(); cursorOn = false; if (surf) leaveSurface(); hudFocus = false; G.camLook = null; target = null; focus = null; ringKey = '~'; legendKey = ''; L.ring.classList.remove('on'); L.cur.classList.remove('on'); L.deco.textContent = ''; if (osk) closeOsk(); }
  if (pad) { fillSlots(); G.padSteer = steerNow; }
  if (kb && !kbLoop) { kbLoop = true; G.on('frame', kbFrame); addEventListener('pointerdown', e => { if (e.isTrusted && Pad.mode === 'keys') Pad.setMode('touch'); }, { capture: true, passive: true }); }
  if (pad !== (prev === 'pad')) setTimeout(() => dispatchEvent(new Event('resize')), 0);   // the legend strip takes 30 px under the game while a pad is in use
}
/* the stick walks only while nothing else owns it */
function steerNow() { if (cursorOn || surf || hudFocus || osk) return null; return Pad.steer(); }
function kbFrame() { if (Pad.mode !== 'keys' || !L) return; const t = now(); if (!uiActive()) { Pad.setMode('touch'); return; } if ((dirty && t - scanAt > .15) || t - scanAt > .7) { scan(); refocus(); } paint('ui'); }
/* KEYBOARD: arrows / Tab move the same focus, Enter / Space press it, while a window is open. In the world the keys keep their old jobs (WASD / arrows walk, E uses). */
function onKey(e) {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || !e.isTrusted) return; const k = e.key, t = e.target;
  if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName || '')) return;
  const arrow = k === 'ArrowUp' ? [0, -1] : k === 'ArrowDown' ? [0, 1] : k === 'ArrowLeft' ? [-1, 0] : k === 'ArrowRight' ? [1, 0] : null;
  if (arrow || k === 'Tab') {
    if (Pad.mode === 'pad' || !uiActive() || (G.busy && !G.modal) || G.cutscene) return;   // a mini-game or a ride may use the arrows itself
    ensure(); if (Pad.mode !== 'keys') { Pad.setMode('keys'); scan(); refocus(); e.preventDefault(); e.stopImmediatePropagation(); paint('ui'); return; }
    if (dirty || now() - scanAt > .25) { scan(); refocus(); }
    if (arrow) { const f = focus && inList(focus) ? focus : null; if (f && arrow[0] && f.tagName === 'INPUT' && f.type === 'range') stepRange(f, arrow[0]); else if (f && arrow[0] && f.tagName === 'SELECT') stepSelect(f, arrow[0]); else move(arrow[0], arrow[1]); }
    else { const i = list.findIndex(c => c.e === focus), n = list.length; if (n) setFocus(list[((i < 0 ? 0 : i + (e.shiftKey ? -1 : 1)) + n) % n], true); }
    e.preventDefault(); e.stopImmediatePropagation(); paint('ui'); return;
  }
  if ((k === 'Enter' || k === ' ') && Pad.mode === 'keys' && uiActive() && focus && inList(focus) && !e.repeat) { e.preventDefault(); e.stopImmediatePropagation(); activate(); }
}

/* ---------- Settings: the "Controller" section (shown once a pad has been seen) ---------- */
function settings(b, ctx) {
  if (!Pad.seen) return; const P = Pad.prefs, re = () => ctx.refresh();
  const chips = (key, opts) => el('div.ph-chips', { 'data-set': 'pad-' + key }, opts.map(([v, name]) => el('button.ph-chip' + (P[key] === v ? '.on' : ''), { 'aria-pressed': P[key] === v ? 'true' : 'false', onclick: () => { Pad.setPref(key, v); re(); } }, name)));
  const range = (key, name, min, max, step, fmt) => { const out = el('span', { text: fmt(P[key]) }); return el('label.ph-range', null, el('span', { text: name }), el('input', { type: 'range', min, max, step, value: P[key], 'aria-label': name, oninput: e => { Pad.setPref(key, +e.target.value); out.textContent = fmt(P[key]); } }), out); };
  const row = el('div.pad-set-glyphs', null, ['ok', 'back', 'x', 'y', 'l1', 'r1', 'start', 'select'].map(a => glyph(a, 2)));
  b.append(el('div.ph-sec', null, el('span', { text: 'Controller' })));
  b.append(el('div.ph-card', { 'data-set': 'controller' },
    el('p.ph-note', { text: Pad.id ? 'Connected: ' + String(Pad.id).replace(/\s*\(.*$/, '').slice(0, 40) : 'A controller was used in this session.' }), row,
    el('b', { text: 'Button pictures' }), chips('glyphs', [['auto', 'Auto'], ['xbox', 'A B X Y'], ['ps', 'Shapes'], ['switch', 'B A Y X'], ['generic', 'Dots']]),
    el('b', { text: 'Confirm button' }), chips('confirm', [['auto', 'Auto'], ['south', 'Bottom'], ['east', 'Right']]),
    el('b', { text: 'Walking stick' }), chips('stick', [['street', 'Along the streets'], ['screen', 'Exact direction']]),
    el('p.ph-note', { text: 'Along the streets: a diagonal push follows the pavement. Exact direction: you walk exactly where the stick points on screen.' }),
    range('dead', 'Dead zone', .05, .4, .01, v => Math.round(v * 100) + '%'), range('cursor', 'Pointer speed', .5, 2, .1, v => v.toFixed(1) + 'x'),
    el('b', { text: 'Vibration' }), chips('rumble', [[true, 'On'], [false, 'Off']]),
    el('p.ph-note', { text: 'Press the right stick for a pointer that can tap anything on screen.' })));
}

function info() {
  const c = focus && inList(focus); return { mode: Pad.mode, state: state(), n: list.length, overlay: overlayN, focus: c ? { text: label(c.e).slice(0, 60), tag: c.e.tagName, cls: String(c.e.className || '').slice(0, 60), r: (r => [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)])(rectOf(c)) } : null,
    back: back ? label(back).slice(0, 30) : null, skip: skip ? label(skip).slice(0, 30) : null, tabs: !!tabsEl, target: target ? target.label || 'Use' : null, hudFocus, cursor: cursorOn ? [Math.round(cx), Math.round(cy)] : null, surf: surf ? { kind: surf.kind, lanes: surf.lanes || 0, auto: surf.auto, at: [Math.round(cx), Math.round(cy)] } : null, osk: !!osk, style: Pad.style };
}

export function init() {
  if (typeof window === 'undefined') return;
  Pad.init(G);
  G.padnav = { state, info, target: () => target, settings, glyph, TW, refresh: () => { dirty = true; }, list: () => list.map(c => label(c.e).slice(0, 40)),
    addSurface(s) { surfaces.push(s); dirty = true; return () => { const i = surfaces.indexOf(s); if (i >= 0) surfaces.splice(i, 1); if (surf && surf.el === s.el) leaveSurface(); dirty = true; }; },
    cursorTo(x, y) { cx = x; cy = y; }, focusEl: () => focus, setFocus(e) { scan(); const c = inList(e); if (c) setFocus(c, true); return !!c; } };
  G.on('input:mode', onMode); G.on('pad:down', onDown); G.on('pad:up', onUp); G.on('pad:poll', onPoll);
  G.on('pad:prefs', () => { if (!L) return; for (const s of document.querySelectorAll('.pg[data-pg]')) s._k = ''; fillSlots(); legendKey = ''; if (L) L.deco.textContent = ''; });
  G.on('scene', () => { target = null; tgtLock = 0; dirty = true; hudFocus = false; const p = G.player; arrive = p ? { x: p.x, y: p.y, it: undefined } : null; });
  addEventListener('keydown', onKey, true);
  /* a few light rumbles (Settings > Controller > Vibration) */
  G.on('skill:up', () => Pad.rumble('good')); G.on('friend:up', () => Pad.rumble('good')); G.on('goal:done', () => Pad.rumble('good')); G.on('job:promoted', () => Pad.rumble('good'));
  G.on('needs:zero', () => Pad.rumble('thud')); G.on('money', d => { if (d < 0) Pad.rumble('tick'); }); G.on('minigame:done', o => Pad.rumble(o && o.stars >= 2 ? 'good' : 'bump'));
}
