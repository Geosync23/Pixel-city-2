// Gamepad input (owner msg 143, BIBLE "Direction update 26"): polling, mapping, dead zones, button repeat, which input is in use, rumble, device prefs.
// Pure input: no DOM UI here (the focus layer, the cursor and the glyph hints are src/ui/padnav.js). Design + tunables: docs/reports/controller.md.
//
// NOTHING RUNS UNTIL A PAD SHOWS UP: Pad.init() adds two listeners ('gamepadconnected' / 'gamepaddisconnected') and looks once at navigator.getGamepads().
// The per-frame poll (one requestAnimationFrame loop, one getGamepads() call) starts with the first connected pad and stops when the last one is gone.
//
// Pad
//   init(G)                      called once by ui/padnav.js
//   seen (bool)                  a pad has been connected at some point in this session (the Settings section shows itself)
//   mode  'touch' | 'pad' | 'keys'    the input in use right now. 'pad' after any pad button / stick; 'touch' after a real pointer / wheel event; 'keys' after
//                                a navigation key (arrows / Tab) while a window is open. G.emit('input:mode', mode, prev)
//   active (getter)              mode === 'pad'
//   style (getter)               'xbox' | 'ps' | 'switch' | 'generic': prefs.glyphs, or guessed from the pad's id when that is 'auto'
//   held(action) -> bool         action: 'ok' 'back' 'x' 'y' 'l1' 'r1' 'l2' 'r2' 'select' 'start' 'l3' 'r3' 'up' 'down' 'left' 'right' 'home'
//                                'ok' / 'back' are SEMANTIC (confirm / cancel): the bottom and right face buttons, swapped when prefs.confirm says so
//                                'x' = the left face button, 'y' = the top one (by POSITION, whatever is printed on them)
//   lx ly rx ry                  sticks after the radial dead zone, -1..1 (y down);   lt rt  triggers 0..1
//   nav -> { x, y }              D-pad or left stick as a 4-way direction with auto-repeat (set for ONE poll each time it fires), for the focus layer
//   prefs                        { glyphs: 'auto'|'xbox'|'ps'|'switch'|'generic', confirm: 'auto'|'south'|'east', dead: .18, rumble: true, cursor: 1, stick: 'street'|'screen' }
//                                device-level (localStorage 'maplebay.pad.v1'), not part of the save.   setPref(k, v)
//   rumble(kind)                 'tick' | 'bump' | 'good' | 'thud': a short dual-rumble effect if the pad has a vibrationActuator and prefs.rumble is on
//   steer() -> [dx, dy, mag] | null    the left stick as a WORLD direction for the walk (see stickToWorld) or null inside the dead zone
// Events (G.on): 'pad:down'(action), 'pad:up'(action), 'pad:connect'(pad), 'pad:disconnect', 'pad:poll'(dt) once per polled frame (ui/padnav.js lives on it),
//   'input:mode'(mode, prev), 'pad:prefs'(key)
// Tests: a page can replace navigator.getGamepads and dispatch 'gamepadconnected' (tools/pad_check.mjs does).

const KEY = 'maplebay.pad.v1';
const DEF = { glyphs: 'auto', confirm: 'auto', dead: .18, rumble: true, cursor: 1, stick: 'street' };
/* ---- tunables (docs/reports/controller.md "Tunables") ---- */
export const TUNE = {
  repeatFirst: .34,     // s before a held direction repeats
  repeatNext: .105,     // s between repeats
  navDead: .55,         // stick deflection that counts as a D-pad press in menus
  walkMin: .42,         // slowest walk (fraction of full speed) just outside the dead zone
  walkFull: .82,        // deflection from which the walk is full speed
  snapDeg: 11,          // 'street' feel: within this many degrees of one of the 8 street directions the walk locks onto it
  trigger: .35,         // analogue trigger travel that counts as pressed
};
const ACTIONS = ['south', 'east', 'x', 'y', 'l1', 'r1', 'l2', 'r2', 'select', 'start', 'l3', 'r3', 'up', 'down', 'left', 'right', 'home'];

let G = null, raf = 0, last = 0, drive = -1, lastId = '';
const down = {}, navRep = { x: 0, y: 0, t: 0, first: true };
export const Pad = {
  seen: false, mode: 'touch', lx: 0, ly: 0, rx: 0, ry: 0, lt: 0, rt: 0, nav: { x: 0, y: 0 }, prefs: Object.assign({}, DEF), id: '', count: 0,
  get active() { return Pad.mode === 'pad'; },
  get style() { const g = Pad.prefs.glyphs; return g && g !== 'auto' ? g : guessStyle(Pad.id); },
  /** true when 'ok' is the RIGHT face button (the Nintendo way) */
  get swapped() { const c = Pad.prefs.confirm; return c === 'east' || (c === 'auto' && guessStyle(Pad.id) === 'switch'); },   // follows the pad itself, not the glyph set chosen by hand
  held: a => !!down[sem(a)],
  init, setPref, rumble, steer, setMode, guessStyle, stickToWorld,
};
/* 'ok' / 'back' -> the physical face button */
function sem(a) { if (a === 'ok') return Pad.swapped ? 'east' : 'south'; if (a === 'back') return Pad.swapped ? 'south' : 'east'; return a; }
function unsem(a) { if (a === 'south') return Pad.swapped ? 'back' : 'ok'; if (a === 'east') return Pad.swapped ? 'ok' : 'back'; return a; }

/** which glyph set suits this pad id (never a brand when unknown: 'generic' shows positions) */
export function guessStyle(id) {
  id = String(id || '').toLowerCase();
  if (/045e|xbox|xinput|x-box|microsoft|stadia|luna/.test(id)) return 'xbox';
  if (/057e|nintendo|switch|joy-?con|pro controller/.test(id)) return 'switch';
  if (/054c|dualsense|dualshock|playstation|ps[345]\b|sony|^wireless controller/.test(id)) return 'ps';
  return 'generic';
}

function loadPrefs() { try { const s = localStorage.getItem(KEY); if (s) { const d = JSON.parse(s); for (const k in DEF) if (d[k] !== undefined && typeof d[k] === typeof DEF[k]) Pad.prefs[k] = d[k]; } } catch (e) { /* private mode: defaults */ } }
function setPref(k, v) { if (!(k in DEF)) return; Pad.prefs[k] = v; try { localStorage.setItem(KEY, JSON.stringify(Pad.prefs)); } catch (e) { /* kept for this session */ } if (G) G.emit('pad:prefs', k); }

function setMode(m) { if (m === Pad.mode) return; const prev = Pad.mode; Pad.mode = m; if (G) G.emit('input:mode', m, prev); }

/* ---------- reading one pad ---------- */
const btn = (gp, i) => { const b = gp.buttons[i]; return b ? (typeof b === 'object' ? (b.pressed || b.value > .5) : b > .5) : false; };
const bval = (gp, i) => { const b = gp.buttons[i]; return b ? (typeof b === 'object' ? (b.value || (b.pressed ? 1 : 0)) : +b) : 0; };
const ax = (gp, i) => { const v = gp.axes[i]; return typeof v === 'number' && isFinite(v) ? v : 0; };
/* the "hat" some non-standard pads report on one axis: -1 up, then clockwise in steps of 2/7; about 1.29 (or 0 on some drivers) at rest */
function hat(v) { if (!(v >= -1.01 && v <= 1.01)) return [0, 0]; const k = Math.round((v + 1) * 3.5); return [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]][k] || [0, 0]; }
const cur = {};   // this frame's raw button states by physical action
function read(gp) {
  const std = gp.mapping === 'standard';
  for (let i = 0; i < 12; i++) cur[ACTIONS[i]] = btn(gp, i);
  cur.home = btn(gp, 16);
  let lt = bval(gp, 6), rt = bval(gp, 7), rx = ax(gp, 2), ry = ax(gp, 3);
  if (std || gp.buttons.length >= 16) { cur.up = btn(gp, 12); cur.down = btn(gp, 13); cur.left = btn(gp, 14); cur.right = btn(gp, 15); }
  else {
    /* NON-STANDARD PAD (mapping ''): the first ten buttons are usually in the standard order already. The D-pad is either two axes (6 / 7, or 4 / 5 on small
       pads) or a hat on the last axis. Whatever cannot be told apart stays reachable through the cursor mode (left stick + the bottom face button). */
    let hx = 0, hy = 0; const n = gp.axes.length;
    if (n === 10 || n === 5) { const h = hat(ax(gp, n - 1)); hx = h[0]; hy = h[1]; }
    else if (n >= 8) { hx = Math.round(ax(gp, 6)); hy = Math.round(ax(gp, 7)); }
    else if (n === 6) { hx = Math.round(ax(gp, 4)); hy = Math.round(ax(gp, 5)); }
    cur.up = hy < 0; cur.down = hy > 0; cur.left = hx < 0; cur.right = hx > 0;
    if (n < 4) { rx = 0; ry = 0; }
  }
  if (lt > TUNE.trigger) cur.l2 = true; if (rt > TUNE.trigger) cur.r2 = true;
  Pad.lt = Math.max(lt, cur.l2 ? 1 : 0) > TUNE.trigger ? Math.max(lt, .5) : 0; Pad.rt = Math.max(rt, cur.r2 ? 1 : 0) > TUNE.trigger ? Math.max(rt, .5) : 0;
  const dz = Pad.prefs.dead, st = (x, y, o, kx, ky) => { const m = Math.hypot(x, y); if (m <= dz) { o[kx] = 0; o[ky] = 0; return; } const k = Math.min(1, (m - dz) / (1 - dz)) / m; o[kx] = x * k; o[ky] = y * k; };
  st(ax(gp, 0), ax(gp, 1), Pad, 'lx', 'ly'); st(rx, ry, Pad, 'rx', 'ry');
}
/* is anything pressed / pushed on this pad right now? (decides which pad drives: the last one used) */
function busy(gp) { for (let i = 0; i < gp.buttons.length; i++) if (btn(gp, i)) return true; for (let i = 0; i < Math.min(4, gp.axes.length); i++) if (Math.abs(ax(gp, i)) > .5) return true; return false; }

/* ---------- the poll ---------- */
function pads() { try { const L = navigator.getGamepads ? navigator.getGamepads() : []; const out = []; for (let i = 0; i < L.length; i++) if (L[i] && L[i].connected !== false) out.push(L[i]); return out; } catch (e) { return []; } }
function poll(now) {
  raf = requestAnimationFrame(poll);
  const dt = Math.min(.1, (now - last) / 1000) || .016; last = now;
  const L = pads(); Pad.count = L.length; if (!L.length) { if (drive !== -2) { drive = -2; release(); } return; }
  let gp = null; for (const p of L) if (busy(p) && p.index !== drive) { gp = p; drive = p.index; break; }   // another pad was touched: it drives now
  if (!gp) gp = L.find(p => p.index === drive) || L[0]; drive = gp.index;
  if (gp.id !== lastId) { lastId = gp.id; Pad.id = gp.id; Pad.pad = null; if (G) G.emit('pad:prefs', 'id'); }
  Pad.gp = gp; read(gp);
  let any = Pad.lx || Pad.ly || Pad.rx || Pad.ry;
  for (const a of ACTIONS) { const v = !!cur[a]; if (v) any = true; if (v !== !!down[a]) { down[a] = v; if (v) setMode('pad'); if (Pad.mode === 'pad') G.emit(v ? 'pad:down' : 'pad:up', unsem(a)); } }
  if (any) setMode('pad');
  /* menu direction with auto-repeat: the D-pad, else the left stick pushed past navDead (dominant axis) */
  let nx = (down.right ? 1 : 0) - (down.left ? 1 : 0), ny = (down.down ? 1 : 0) - (down.up ? 1 : 0);
  if (!nx && !ny) { const m = Math.hypot(Pad.lx, Pad.ly); if (m > TUNE.navDead) { if (Math.abs(Pad.lx) > Math.abs(Pad.ly) * 1.15) nx = Math.sign(Pad.lx); else if (Math.abs(Pad.ly) > Math.abs(Pad.lx) * 1.15) ny = Math.sign(Pad.ly); else { nx = navRep.x; ny = navRep.y; } } }
  Pad.nav.x = 0; Pad.nav.y = 0;
  if (nx !== navRep.x || ny !== navRep.y) { navRep.x = nx; navRep.y = ny; navRep.t = TUNE.repeatFirst; if (nx || ny) { Pad.nav.x = nx; Pad.nav.y = ny; } }
  else if (nx || ny) { navRep.t -= dt; if (navRep.t <= 0) { navRep.t = TUNE.repeatNext; Pad.nav.x = nx; Pad.nav.y = ny; } }
  if (Pad.mode === 'pad') G.emit('pad:poll', dt);
}
function release() { for (const a of ACTIONS) if (down[a]) { down[a] = false; if (G) G.emit('pad:up', unsem(a)); } Pad.lx = Pad.ly = Pad.rx = Pad.ry = Pad.lt = Pad.rt = 0; Pad.nav.x = Pad.nav.y = 0; navRep.x = navRep.y = 0; }
function start() {
  if (!Pad.seen) { Pad.seen = true;
    /* from the first pad on: a REAL pointer / wheel event hands the game back to touch (synthetic events from the pad cursor are not trusted, so they do not) */
    const toTouch = e => { if (e.isTrusted && Pad.mode !== 'touch') setMode('touch'); };
    for (const ev of ['pointerdown', 'touchstart', 'wheel']) addEventListener(ev, toTouch, { capture: true, passive: true });
    let mx = 0, my = 0; addEventListener('mousemove', e => { if (!e.isTrusted || Pad.mode === 'touch') return; if (Math.abs(e.screenX - mx) + Math.abs(e.screenY - my) > 24) setMode('touch'); mx = e.screenX; my = e.screenY; }, { capture: true, passive: true });
  }
  if (!raf) { last = performance.now(); raf = requestAnimationFrame(poll); }
}
function stop() { if (pads().length) return; if (raf) { cancelAnimationFrame(raf); raf = 0; } release(); drive = -1; if (Pad.mode === 'pad') setMode('touch'); if (G) G.emit('pad:disconnect'); }

/* ---------- walking: the left stick as a world direction ----------
   The ground is drawn 2:1 isometric: world +x runs down-right on screen, world +y down-left.
   'street' (default): the stick acts on the ground as seen from above, turned 45 degrees: up = straight up the screen, right = straight right, and the four
     diagonals run exactly ALONG THE STREETS (the tile axes, 26.6 degrees on screen), which is where the city's streets, pavements and walls run.
     In between the angle is continuous; within TUNE.snapDeg of one of those 8 directions it locks on, so a thumb that is nearly right walks dead straight.
   'screen': the character moves on screen in exactly the direction the stick points (diagonals at 45 degrees on screen cut across the tiles). */
export function stickToWorld(sx, sy, feel) {
  let dx, dy;
  if (feel === 'screen') { dx = sx + 2 * sy; dy = 2 * sy - sx; }
  else {
    let a = Math.atan2(sy, sx); const q = Math.PI / 4, n = Math.round(a / q) * q; if (Math.abs(a - n) < TUNE.snapDeg * Math.PI / 180) a = n;
    const cx = Math.cos(a), cy = Math.sin(a); dx = cx + cy; dy = cy - cx;
  }
  const d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d];
}
const sv = [0, 0, 0];
function steer() {
  const m = Math.hypot(Pad.lx, Pad.ly); if (Pad.mode !== 'pad' || m < .02) return null;
  const w = stickToWorld(Pad.lx, Pad.ly, Pad.prefs.stick); sv[0] = w[0]; sv[1] = w[1];
  sv[2] = m >= TUNE.walkFull ? 1 : TUNE.walkMin + (1 - TUNE.walkMin) * (m / TUNE.walkFull); return sv;
}

/* ---------- rumble ---------- */
const FX = { tick: [28, .0, .35], bump: [60, .35, .2], good: [120, .25, .6], thud: [160, .8, .3] };
function rumble(kind) {
  if (!Pad.prefs.rumble || Pad.mode !== 'pad') return; const gp = Pad.gp, f = FX[kind] || FX.tick; if (!gp) return;
  try { const a = gp.vibrationActuator; if (a && a.playEffect) { const p = a.playEffect('dual-rumble', { startDelay: 0, duration: f[0], strongMagnitude: f[1], weakMagnitude: f[2] }); if (p && p.catch) p.catch(() => { }); } else if (gp.hapticActuators && gp.hapticActuators[0] && gp.hapticActuators[0].pulse) gp.hapticActuators[0].pulse(Math.max(f[1], f[2]), f[0]); } catch (e) { /* no rumble on this pad */ }
}

function init(g) {
  if (G || typeof window === 'undefined') return; G = g; loadPrefs(); G.pad = Pad;
  addEventListener('gamepadconnected', e => { start(); G.emit('pad:connect', e.gamepad); });
  addEventListener('gamepaddisconnected', () => setTimeout(stop, 0));
  if (pads().length) start();   // a pad that was already awake when the page loaded
}
