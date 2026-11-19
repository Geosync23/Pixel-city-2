// The game object G: state, scenes, main loop, interactions, activities, save. See docs/ARCHITECTURE.md.
import { Renderer } from '../engine/render.js';
import { WS, U, ENV } from '../engine/raster.js';
import { clearSprites } from '../engine/sprites.js';
import { Char, charArt } from './char.js';
import { setupInput } from './input.js';
import { timeInfo, ambient, ambientIndoor, DAY } from './clock.js';
import * as bus from './bus.js';

const SAVE_KEY = 'maplebay.save.v1';
export const G = {
  version: 1,
  state: { t: 14 * 60, speed: 1, weather: 'clear', player: { name: 'Alex', spec: null, scene: 'city', x: 0, y: 0, money: 600 }, flags: {} },
  on: bus.on, off: bus.off, emit: bus.emit,
  scenes: new Map(), sceneCache: new Map(), scene: null, world: null,
  player: null, cam: { x: 0, y: 0, fx: 0, fy: 0 }, zoom: 2, W: 100, H: 100,
  systems: [], overlays: [], underlays: [], stateDefaults: {},
  modal: 0, busy: null, target: null, pending: null, input: null, renderer: null, cv: null, time: 0, fps: 60, debug: false,
  cutscene: null, // when set: {update(dt)} takes over player control (taxi ride etc.)
};

/* ---------- state ---------- */
/** A system declares its slice of the save: G.defineState('needs', () => ({hunger: 80})) -> G.state.needs */
G.defineState = (key, defaults) => { G.stateDefaults[key] = defaults; if (G.state[key] === undefined) G.state[key] = defaults(); return G.state[key]; };
let mem = null;
G.save = () => { const p = G.player; if (p && !G.cutscene) Object.assign(G.state.player, { x: p.x, y: p.y, scene: G.scene ? G.scene.id : 'city' }); G.emit('save', G.state); const s = JSON.stringify(G.state); try { localStorage.setItem(SAVE_KEY, s); } catch (e) { mem = s; } return s; };
G.hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return !!mem; } };
G.load = () => { let s = null; try { s = localStorage.getItem(SAVE_KEY); } catch (e) { s = mem; } if (!s) return false; try { const d = JSON.parse(s); for (const k in G.stateDefaults) if (d[k] === undefined) d[k] = G.stateDefaults[k](); G.state = d; G.emit('load', G.state); return true; } catch (e) { console.error(e); return false; } };
G.wipeSave = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } mem = null; };

/* ---------- time ---------- */
G.now = () => timeInfo(G.state.t);
/** advance game time by m minutes immediately (fires time events) */
G.advance = m => { const t0 = G.state.t, t1 = t0 + m; G.state.t = t1; tickTime(t0, t1); };
function tickTime(t0, t1) {
  const m0 = Math.floor(t0), m1 = Math.floor(t1); if (m1 === m0) return;
  G.emit('minutes', m1 - m0, t1);                       // (deltaMinutes, t) - for needs decay etc.
  const h0 = Math.floor(t0 / 60), h1 = Math.floor(t1 / 60); for (let h = h0 + 1; h <= h1; h++) G.emit('hour', h % 24, h);
  const d0 = Math.floor(t0 / DAY), d1 = Math.floor(t1 / DAY); for (let d = d0 + 1; d <= d1; d++) { G.emit('day', d); const s = timeInfo(d * DAY).season; if (s !== ENV.season) setSeason(s); }
}
function setSeason(s) { ENV.season = s; clearSprites(); for (const sc of G.sceneCache.values()) if (sc.world) sc.world.version++; G.emit('season', s); }
G.setSeason = setSeason;

/* ---------- systems & scenes ---------- */
/** sys: { name, update(dt, gameMinutes), ... }. update is called every frame (dt real seconds, gm game minutes elapsed). */
G.addSystem = sys => { G.systems.push(sys); return sys; };
/** factory(id, arg) -> scene. Register an exact id ('city') or a prefix ending with ':' ('int:') */
G.registerScene = (id, factory) => G.scenes.set(id, factory);
function makeScene(id, arg) { let f = G.scenes.get(id); if (!f) { const p = id.split(':')[0] + ':'; f = G.scenes.get(p); } if (!f) throw new Error('no scene ' + id); const s = f(id, arg); s.id = id; s.ents = s.ents || []; s.interactables = s.interactables || []; return s; }
/**
 * Switch scene. opts: { x, y (spawn), poi: id of a world poi to spawn at, dir, arg, fade: false to cut, fresh: rebuild scene }
 * Scenes are cached (city forever; the last few interiors).
 */
G.go = (id, opts = {}) => new Promise((res, rej) => {
  const doIt = () => {
    const prev = G.scene; if (prev && prev.onExit) prev.onExit(id);
    let s = !opts.fresh && G.sceneCache.get(id); if (!s) { s = makeScene(id, opts.arg); G.sceneCache.set(id, s); if (G.sceneCache.size > 6) for (const k of G.sceneCache.keys()) { if (k !== 'city' && k !== id) { G.sceneCache.delete(k); break; } } }
    G.scene = s; G.world = s.world; const p = G.player;
    let sp = opts.x !== undefined ? opts : null; if (!sp && opts.poi) sp = s.world.pois.find(q => q.id === opts.poi); if (!sp && s.spawn) sp = typeof s.spawn === 'function' ? s.spawn(opts, prev) : s.spawn; if (!sp) sp = { x: s.world.w / 2, y: s.world.h / 2 };
    p.x = sp.x; p.y = sp.y; p.zoff = 0; p.pose = null; p.path = null; if (opts.dir !== undefined) p.dir = opts.dir; else if (sp.dir !== undefined) p.dir = sp.dir; p.z = s.world.heightAt(p.x, p.y);
    G.target = null; G.pending = null; snapCam(); if (s.onEnter) s.onEnter(opts, prev); G.renderer.warm(s.world, G.cam); G.emit('scene', s, prev); res(s);
  };
  if (opts.fade === false || !G.fadeEl) { try { return doIt(); } catch (e) { return rej(e); } }
  G.modal++; G.fadeEl.classList.add('on'); setTimeout(() => { try { doIt(); } catch (e) { console.error(e); rej(e); } finally { G.modal--; setTimeout(() => G.fadeEl.classList.remove('on'), 60); } }, 260);
});

/* ---------- camera / coords ---------- */
// The low-res canvas scrolls in whole pixels; the remaining fraction is applied as a CSS shift quantised to real screen pixels,
// so scrolling is smooth in every direction (no judder on diagonals).
// PIXEL LOCK (owner msg 220, the hitchy plane): a camera target with `lock` ({ ax, ay } = the unrounded screen anchor of the entity it follows, e.g. a plane's
// flight.cam) is followed in whole canvas pixels in step with the renderer's rounding of that entity, so it stays still on screen (no 1-px wobble against a
// sub-pixel camera), and it is followed without lag (the lerp only takes up the offset left by a jump), so frame-time changes do not shake it either.
function placeCam() { const c = G.cam, z = G.zoom, tx = c.fx - (G.W - 1) / 2, ty = c.fy - (G.H - 1) / 2, L = G.camTarget && G.camTarget.lock ? G.camTarget : null; c.x = Math.floor(tx); c.y = Math.floor(ty); let sx = Math.round((tx - c.x) * z) / z, sy = Math.round((ty - c.y) * z) / z; if (sx >= 1) { sx = 0; c.x++; } if (sy >= 1) { sy = 0; c.y++; }
  if (L) { c.x = Math.round(L.ax) + Math.round(tx - L.ax); c.y = Math.round(L.ay) + Math.round(ty - L.ay); sx = sy = 0; } c.sx = sx; c.sy = sy; if (G.cv && (c._sx !== sx || c._sy !== sy)) { c._sx = sx; c._sy = sy; G.cv.style.transform = 'translate(' + (-sx * G.cssScale) + 'px,' + (-sy * G.cssScale) + 'px)'; } }
function snapCam() { const p = G.camTarget || G.player, a = WS(p.x, p.y, p.z); G.cam.fx = a[0]; G.cam.fy = a[1] - 14; placeCam(); }
G.snapCam = snapCam;
function resize() {
  const wrap = G.cv.parentElement, dpr = window.devicePixelRatio || 1, cw = wrap.clientWidth, ch = wrap.clientHeight;
  G.zmin = Math.max(2, Math.round(dpr * 2)); G.zmax = Math.max(G.zmin + 2, Math.round(dpr * 5)); if (G.query && G.query.has('debug')) G.zmin = 1; G.zoom = Math.min(G.zmax, Math.max(G.zmin, G.zoom));
  G.W = Math.max(32, Math.ceil(cw * dpr / G.zoom) + 1); G.H = Math.max(32, Math.ceil(ch * dpr / G.zoom) + 1); G.renderer.resize(G.W, G.H);
  G.cv.style.width = (G.W * G.zoom / dpr) + 'px'; G.cv.style.height = (G.H * G.zoom / dpr) + 'px'; G.cssScale = G.zoom / dpr;
}
G.setZoom = z => { z = Math.min(G.zmax, Math.max(G.zmin, z)); if (z !== G.zoom) { G.zoom = z; resize(); snapCam(); } };
/** client (css px) -> world position on the terrain */
G.toWorld = (clx, cly) => { const r = G.cv.getBoundingClientRect(), lx = (clx - r.left) / r.width * G.W + G.cam.x, ly = (cly - r.top) / r.height * G.H + G.cam.y; let z = 0, x = 0, y = 0; for (let k = 0; k < 6; k++) { const a = lx / U, b = (ly + z * U) / (U / 2); x = (a + b) / 2; y = (b - a) / 2; const hz = G.world.heightAt(x, y); if (Math.abs(hz - z) < .01) break; z = hz; } return { x, y, z, px: lx, py: ly }; };
/** world -> css px relative to the game wrapper (for DOM bubbles/markers) */
G.toScreen = (x, y, z = 0) => { const s = WS(x, y, z); return { x: (s[0] - G.cam.x - (G.cam.sx || 0)) * G.cssScale, y: (s[1] - G.cam.y - (G.cam.sy || 0)) * G.cssScale }; };

/* ---------- interactions ---------- */
/**
 * Interactable: { x, y, z?, label, use(G, it), spot?: {x,y} where to stand (default: nearest free cell), range?: units (default 1.3),
 *   hit?: px radius for taps (default 12), h?: height of the tap target in units (default 1), visible?: () => bool, ent?: Char (follows it), icon? }
 * Scenes list them in scene.interactables; systems can add global ones with G.addInteractable (returns remover).
 */
const extra = [];
G.addInteractable = it => { extra.push(it); return () => { const i = extra.indexOf(it); if (i >= 0) extra.splice(i, 1); }; };
G.interactables = () => { const out = []; const add = it => { if (it.scene && it.scene !== G.scene.id) return; if (it.visible && !it.visible()) return; if (it.ent) { it.x = it.ent.x; it.y = it.ent.y; it.z = it.ent.z; } out.push(it); }; G.scene.interactables.forEach(add); extra.forEach(add); return out; };
// Doors, exits, stairs and lifts get a generous tap target: a tall capsule from the threshold up over the door itself (owner msg 76: tap the door, not only the ground in front of it).
const DOORISH = /^(enter|exit|leave|go (in|out|up|down|to)|back to)\b|door|restroom|bathroom|stairs|lift|elevator|entrance|platform/i;
const isDoor = it => it.exit || it.door || (it.poi && (it.poi.type === 'door' || it.poi.type === 'station')) || (!it.ent && DOORISH.test(it.label || ''));
const DOOR_SIDE = 2;   /* QA10: a door's tap target reaches about 2 door-widths to each side (was 4: a floor tap 75 px beside the Leave door took the player out of the flat) */
const onScreenX = (x, y, z) => { const a = WS(x, y, z); return a[0] >= G.cam.x - 2 && a[0] <= G.cam.x + G.W + 2; };   /* QA10: the door's middle is on screen (a door past the edge of the screen is not tappable) */
function pick(px, py) {
  let best = null, bd = 1e9;
  for (const it of G.interactables()) {
    const z = it.z !== undefined ? it.z : G.world.heightAt(it.x, it.y), h = it.h === undefined ? .8 : it.h; let d, lim;
    if (isDoor(it) && !onScreenX(it.x, it.y, z)) continue;   /* QA10: floor taps near the edge of the screen took an off-screen lift (SkyDeck lobby) and the off-screen Leave door (Juniper Court kitchen) */
    if (isDoor(it) && !(Math.hypot(it.x - G.player.x, it.y - G.player.y) < (it.homelink ? 3.5 : 1.6))) {   /* QA8: on a door's mat, a tap nearby is not 'go back out' */   /* QA7: standing on the stairs, a tap near them is not 'go back down' */
      const top = Math.max(h, it.exit ? 1.2 : 2.6), a = WS(it.x, it.y, z), b = WS(it.x, it.y, z + top), vx = b[0] - a[0], vy = b[1] - a[1], L = vx * vx + vy * vy || 1;
      const t = Math.max(0, Math.min(1, ((px - a[0]) * vx + (py - a[1]) * vy) / L)), dx = px - (a[0] + vx * t), dy = py - (a[1] + vy * t);
      lim = Math.max(it.hit || 12, 14) + U * (G.scene && G.scene.id === 'city' ? 1.25 : .75); d = Math.hypot(dx * DOOR_SIDE, dy * .8);   /* QA10: rooms are drawn bigger (cssScale 4): a smaller margin indoors */ if (d >= lim) continue; d = d * .6 + 5;   // rank: precise targets right under the finger still win
    } else { const s = WS(it.x, it.y, z + h * .5); d = Math.hypot(px - s[0], (py - s[1]) * .75); lim = (it.hit || 12) + h * U * .4; if (d >= lim) continue; }
    if (d < bd) { bd = d; best = it; }
  }
  return best;
}
/* perf: the same scan as over G.interactables() (same filters, same order, same refresh of ent-following ones), without building the list: the HUD asks several times a second */
G.nearestInteractable = (range = 1.6) => {
  let best = null, bd = range; const sid = G.scene.id, px = G.player.x, py = G.player.y;
  for (let pass = 0; pass < 2; pass++) { const L = pass ? extra : G.scene.interactables; for (let i = 0; i < L.length; i++) { const it = L[i]; if (it.scene && it.scene !== sid) continue; if (it.visible && !it.visible()) continue; if (it.ent) { it.x = it.ent.x; it.y = it.ent.y; it.z = it.ent.z; } const d = Math.hypot(it.x - px, it.y - py); if (d < bd) { bd = d; best = it; } } }
  return best;
};
/** walk to an interactable and use it */
G.useInteractable = it => {
  const p = G.player, range = it.range || 1.3, d = Math.hypot(it.x - p.x, it.y - p.y);
  const fire = () => { G.pending = null; p.stop(); p.faceTo(it.x, it.y); G.emit('use', it); it.use(G, it); };
  if (it.spot ? Math.hypot(it.spot.x - p.x, it.spot.y - p.y) < .35 : d <= range) return fire();
  const tx = it.spot ? it.spot.x : it.x, ty = it.spot ? it.spot.y : it.y;
  if (!p.goTo(G.world, tx, ty, { snap: 8 })) return; G.target = null; G.pending = { it, fire, range: it.spot ? .4 : range };
};
function onTap(clx, cly) {
  if (G.modal || G.cutscene) return; if (G.busy) { return; }
  const w = G.toWorld(clx, cly), it = pick(w.px, w.py);
  // people are only talked to through the Talk prompt/button (E), never by a stray tap while walking (owner request)
  if (it && !(it.ent && /^(talk|say hello)/i.test(it.label || ''))) return G.useInteractable(it);
  G.pending = null; if (G.player.goTo(G.world, w.x, w.y, { snap: 10, limit: 30000 })) { const p = G.player.path; G.target = p && p.length ? p[p.length - 1] : null; }
}

/* ---------- activities ---------- */
/**
 * Lock the player into an activity while game time runs fast.
 * a: { label, anim, minutes, rate?: game-minutes per real second (default: finishes in ~4-8 s), tick?(gm), done?(), cancel?(), canCancel?: true,
 *      at?: {x,y,z?,dir} snap the player there (seat/bed), hide?: bool }
 */
/* owner msg 180: a small hop when the player sits down and stands up (drawn by the renderer from p.hop, about 4 px for 0.18 s; position and sorting are untouched). Only for sitting activities the player walks to:
   not for hidden ones (a bath, a vehicle), lying down, a cutscene, or a scene that puts the player on a far seat (a.noHop switches it off for one activity). */
const HOP_ANIMS = ['sit', 'cycle', 'row', 'eat', 'drink', 'read', 'type', 'phone', 'talk'];
const hopAct = a => !!(a && a.at && !a.hide && !a.noHop && !G.cutscene && (a.anim === 'sit' || a.anim === 'cycle' || a.anim === 'row' || (a.at.z > 0 && HOP_ANIMS.includes(a.anim))));
G.startActivity = a => { const p = G.player; G.endActivity(false); a.left = a.minutes; a.rate = a.rate || Math.max(4, a.minutes / 6); a.prev = { x: p.x, y: p.y, zoff: p.zoff }; if (a.at) { p.x = a.at.x; p.y = a.at.y; p.zoff = a.at.z || 0; if (a.at.dir !== undefined) p.dir = a.at.dir; } p.pose = a.anim || null; p.hidden = !!a.hide; p.stop(); G.busy = a; if (hopAct(a) && Math.hypot(a.at.x - a.prev.x, a.at.y - a.prev.y) < 4) p.hop = performance.now(); G.emit('activity', a); return a; };
G.endActivity = (completed = true) => { const a = G.busy; if (!a) return; G.busy = null; const p = G.player; p.pose = null; p.hidden = false; if (a.at) { p.x = a.prev.x; p.y = a.prev.y; p.zoff = a.prev.zoff; } p.hop = hopAct(a) ? performance.now() : 0; if (completed) a.done && a.done(); else a.cancel && a.cancel(); G.emit('activityEnd', a, completed); };

/* ---------- PUSH INTO A DOOR (owner msg 273) ----------
   While you hold-and-steer (finger, keys or stick) and keep heading INTO a door, you walk through it, as if you had tapped it.
   Not too sensitive (the buffer): the door must be close (PUSH.near tiles) and straight ahead (within PUSH.cone, about 40 degrees each side), or you
   are standing right on its doorstep (PUSH.close) and not walking away, or you are at the doorstep (PUSH.step) and held up by the wall (hardly
   getting forward; sliding sideways along the wall counts as held up); and that must stay true for PUSH.hold real seconds without a break.
   Walking past a door along its wall never qualifies (it is not ahead of you when it is near). After any scene change nothing fires until you
   let go once, so you never bounce straight back through the door you just came in by. Stations (boarding panel) are not doors here. */
const PUSH = { hold: .38, near: 1.5, close: .6, step: 1.3, cone: .76, slow: .35 }; let pushT = 0, pushLock = false, pushScene = null, pushIt = null;
const pushable = it => !!it.use && !it.ent && (it.exit || it.door || (it.poi && it.poi.type === 'door') || DOORISH.test(it.label || '')) && !(it.poi && it.poi.type === 'station') && !/platform|station/i.test(it.label || '');
function pushDoor(steer, dt, px0, py0, k) {
  const p = G.player, sid = G.scene && G.scene.id; if (sid !== pushScene) { pushScene = sid; pushLock = !!steer; pushT = 0; pushIt = null; }
  if (!steer) { pushLock = false; pushT = 0; pushIt = null; return; }
  if (pushLock || G.modal || G.busy || G.cutscene) { pushT = 0; return; }
  const fwd = (p.x - px0) * steer[0] + (p.y - py0) * steer[1], held = fwd < (p.speed || 3.6) * dt * Math.max(.2, k || 1) * PUSH.slow; let best = null, bd = PUSH.near;
  for (const it of G.interactables()) { if (!pushable(it)) continue; const tx = it.x - p.x, ty = it.y - p.y, d = Math.hypot(tx, ty); if (d >= bd) continue; const dot = d > .05 ? (tx * steer[0] + ty * steer[1]) / d : 1; if (!(dot >= PUSH.cone || (d < PUSH.close && dot > -.2) || (d < PUSH.step && held))) continue; bd = d; best = it; }
  if (!best) { pushT = 0; pushIt = null; return; }
  if (best !== pushIt) { pushIt = best; pushT = 0; } pushT += dt; PUSH._t = pushT; PUSH._d = bd;   /* read by tools/pushdoor_check.mjs */
  if (pushT >= PUSH.hold) { pushT = 0; pushIt = null; pushLock = true; p.stop(); p.faceTo(best.x, best.y); G.emit('use', best); best.use(G, best); }
}
G.pushDoorTune = PUSH;

/* ---------- main loop ---------- */
let last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(.05, (now - last) / 1000); last = now; if (!G.scene) return; G.time += dt; G.fps += (1 / Math.max(dt, .001) - G.fps) * .05;
  /* owner msg 142: 'time should go just a little slower': at 1x one real second is now 0.85 game minutes (was 1). Activities (G.busy) keep their own rates; a cab ride owns the clock. */
  const CLOCK = G.CLOCK = .85;
  const paused = G.modal > 0; let gm = 0;
  if (!paused) {
    const t0 = G.state.t; let rate = G.state.speed;
    if (G.busy) { rate = G.busy.rate; } else if (G.cutscene && G.cutscene.clock) rate = 0;   /* QA7: a cab ride owns the clock (sim/transit.js rideClock: game time from the route, at any speed) */
    gm = dt * rate * (G.busy ? 1 : CLOCK); if (G.busy) { gm = Math.min(gm, G.busy.left); G.busy.left -= gm; }
    G.state.t = t0 + gm; tickTime(t0, G.state.t);
    if (G.busy) { G.busy.tick && G.busy.tick(gm); if (G.busy && G.busy.left <= 1e-6) G.endActivity(true); }
    const p = G.player, inp = G.input.poll();
    if (G.cutscene) {   /* QA6: rides (a cab is a cutscene) also run `sub` world steps at 2x / 4x, so a ride costs the same game time at any speed */
      const spd = Math.max(1, G.state.speed || 1), sub = G.cutscene.ride ? Math.min(4, Math.round(spd)) : 1, sdt = dt * spd / sub, sgm = gm / sub;
      for (let q = 0; q < sub; q++) { G.cutscene.update(sub > 1 ? sdt : dt); if (q < sub - 1) { if (G.scene.update) G.scene.update(sdt, sgm); for (const s of G.systems) if (s.update) s.update(sdt, sgm); if (!G.cutscene) break; } }
      if (sub > 1) G._sub = [sdt, sgm]; p.t += dt; }
    else if (G.busy) { p.moving = false; p.t += dt; p.z = G.world.heightAt(p.x, p.y) + p.zoff; }
    else {
      let steer = null;
      if (inp.hold) { const w = G.toWorld(inp.hold.x, inp.hold.y); if (Math.hypot(w.x - p.x, w.y - p.y) > .3) { const d = Math.hypot(w.x - p.x, w.y - p.y); steer = [(w.x - p.x) / d, (w.y - p.y) / d]; } G.target = null; G.pending = null; }
      else if (inp.kx || inp.ky) { const dx = inp.kx + inp.ky, dy = inp.ky - inp.kx, d = Math.hypot(dx, dy); steer = [dx / d, dy / d]; G.target = null; G.pending = null; }
      /* PAD HOOK (core/pad.js, owner msg 143): the left stick as a world direction [dx, dy, speed 0..1]; G.padSteer exists only once a controller has been used */
      let pmag = 1; if (!steer && G.padSteer) { const ps = G.padSteer(); if (ps) { steer = ps; pmag = ps[2]; G.target = null; G.pending = null; } }
      /* game speed moves the WORLD too (QA round 5: at 2x/4x walking and rides cost 2-4x the game time and every ETA was wrong): the walk + scene + systems run `sub` steps per frame */
      const spd = Math.max(1, G.state.speed || 1), sub = Math.min(4, Math.round(spd)), sdt = dt * spd / sub, sgm = gm / sub;
      const px0 = p.x, py0 = p.y;
      for (let q = 0; q < sub; q++) {
        p.move(G.world, sdt * pmag, steer);
        if (G.pending) { const it = G.pending.it; if (it.ent && !it.spot && p.path) { const e = p.path[p.path.length - 1]; if (e && Math.hypot(e[0] - it.x, e[1] - it.y) > 1.5) p.goTo(G.world, it.x, it.y, { snap: 8 }); } const tx = it.spot ? it.spot.x : it.x, ty = it.spot ? it.spot.y : it.y; if (Math.hypot(tx - p.x, ty - p.y) <= G.pending.range) G.pending.fire(); else if (!p.path) { if (Math.hypot(tx - p.x, ty - p.y) <= Math.max(G.pending.range, 1.6)) G.pending.fire(); else G.pending = null; } }
        if (q < sub - 1) { if (G.scene.update) G.scene.update(sdt, sgm); for (const s of G.systems) if (s.update) s.update(sdt, sgm); if (G.modal > 0 || G.busy || G.cutscene || G.scene.world !== G.world) break; }
      }
      G._sub = [sdt, sgm];
      pushDoor(steer, dt, px0, py0, pmag * spd);
      if (!p.path) G.target = null;
    }
    { const ss = G._sub; G._sub = null; if (G.scene.update) G.scene.update(ss ? ss[0] : dt, ss ? ss[1] : gm); for (const s of G.systems) if (s.update) s.update(ss ? ss[0] : dt, ss ? ss[1] : gm); }
  }
  // camera
  const ct = G.camTarget || G.player, a = WS(ct.x, ct.y, ct.z), ff = G.cam.ff || (G.cam.ff = { t: null, x: 0, y: 0 }), k = ct.lock ? 1 - Math.exp(-7 * dt) : Math.min(1, dt * 7);
  if (ct.lock && ff.t === ct) { G.cam.fx += a[0] - ff.x; G.cam.fy += a[1] - ff.y; } ff.t = ct.lock ? ct : null; ff.x = a[0]; ff.y = a[1];   /* PIXEL LOCK: move with the target first */
  const lk = G.camLook /* PAD HOOK: the right stick looks around ({x, y} in canvas px; null without a pad) */; G.cam.fx += (a[0] + (lk ? lk.x : 0) - G.cam.fx) * k; G.cam.fy += (a[1] - 14 + (lk ? lk.y : 0) + (G.camDY || 0) /* PART-SCREEN HOOK (ui/phone.js): the player stays in view above the docked phone */ - G.cam.fy) * k; placeCam();
  const env = G.scene.env ? G.scene.env(G.state.t) : G.scene.indoor ? ambientIndoor(G.state.t) : ambient(G.state.t, G.state.weather); G.env = env;
  const ents = G.scene.ents; if (!ents.includes(G.player)) ents.push(G.player);
  G.renderer.draw(G.world, G.cam, ents, env, {
    under: (ctx, cam) => { if (G.target) { const s = WS(G.target[0], G.target[1], G.world.heightAt(G.target[0], G.target[1])); ctx.drawImage(marker(), Math.round(s[0]) - 6 - cam.x, Math.round(s[1]) - 3 - cam.y); } for (const f of G.underlays) f(ctx, cam); },
    lights: (m, cam, pool) => { if (G.scene.lights) G.scene.lights(m, cam, pool); },
    over: (ctx, cam) => { for (const f of G.overlays) f(ctx, cam, dt); },
  });
  G.emit('frame', dt);
}
let MK = null;
function marker() { if (MK) return MK; MK = document.createElement('canvas'); MK.width = 13; MK.height = 7; const m = MK.getContext('2d'); m.fillStyle = '#fff4dc'; for (let i = 0; i < 7; i++) { const w = i <= 3 ? i * 4 + 1 : (6 - i) * 4 + 1; m.fillRect(6 - (w >> 1), i, w, 1); } m.clearRect(4, 2, 5, 3); m.fillStyle = '#2a2733'; m.fillRect(6, 3, 1, 1); return MK; }

/* ---------- boot ---------- */
G.boot = (cv, opts = {}) => {
  G.cv = cv; G.renderer = new Renderer(cv); G.fadeEl = document.getElementById('fade');
  const A = charArt(); let n = 7; const r = () => (n = (n * 16807) % 2147483647) / 2147483647;
  if (!G.state.player.spec) G.state.player.spec = (A.PLAYER_PRESETS && A.PLAYER_PRESETS[0]) || A.randomSpec(r, {});
  G.player = new Char(G.state.player.spec); G.player.ghost = true; G.player.isPlayer = true;
  ENV.season = timeInfo(G.state.t).season;
  const dpr = window.devicePixelRatio || 1; G.zoom = Math.max(2, Math.round(dpr * 3)); resize(); addEventListener('resize', () => { resize(); snapCam(); });
  G.input = setupInput(cv, { tap: onTap, zoom: (v, abs) => G.setZoom(abs ? v : G.zoom + v), getZoom: () => G.zoom, key: (k, e) => { if (G.modal) return; if (k === 'e' || k === ' ' || k === 'enter') { const it = !G.busy && !G.cutscene && G.nearestInteractable(); if (it) G.useInteractable(it); } G.emit('key', k, e); }, any: () => G.emit('anyinput') });
  last = performance.now(); requestAnimationFrame(frame);
};
if (typeof window !== 'undefined') window.G = G;
