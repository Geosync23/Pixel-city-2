// Chapter world (helper of sim/chapters.js): everything a Chapter puts INTO the world.
//   - the gold MARKER: an animated bookmark over its city spot (drawn after lighting, so it glows at night; a warm light pool under it), a tap target
//     ("Chapter 4 · ..."), the same gold pin on the phone Map (through the G.mapPins hook) and a tap on the gold Goals row sets the arrow to it;
//   - Mom's page PINS on the Map (a little page + her one line at close zoom);
//   - the ladder under the hatch on Nana's landing (room `home:grandma`) and the way up to `home:grandma:attic`;
//   - the Little Kettle stall on Market Street (from Chapter 13 done: the event stall prop + sign; the bell hangs on it once Chapter 14 is done), the brass bell
//     by the Second Wind until then;
//   - Mom's book at home: once you have it, a "Mom's book" spot by a shelf / table in your own home opens the reader.
// setMarker({ id, x, y, label, sub } | null), marker(), sync() (re-place the story props after a state change), init(hooks).
import { G } from '../core/game.js';
import { asset } from '../art/registry.js';
import { WS } from '../engine/raster.js';
import { markerSprite, pageSprite } from '../art/story/chapter_art.js';
import { freeNear, cityWorld, cityScene, SPOTS } from './_chapters_places.js';

const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
let M = null, H = null, mkOff = null, light = null, props = [], propKey = '';

/* ---------- marker ---------- */
function place(x, y) {
  const w = cityWorld(); if (!w) return { x, y };
  /* stand a step in front of a door (towards the street), never in the doorway itself */
  for (const o of [[1.3, .4], [-1.3, .4], [1.3, 0], [-1.3, 0], [0, 1], [2, .5], [-2, .5], [0, 0]]) { const cx = Math.round((x + o[0]) * 2) / 2, cy = Math.round((y + o[1]) * 2) / 2; if (!safe(() => w.isBlocked(cx, cy), true)) return { x: cx, y: cy }; }
  return freeNear(w, x, y);
}
export function setMarker(m) {
  const key = m ? m.id + '|' + Math.round(m.x) + '|' + Math.round(m.y) : '';
  if ((M ? M.key : '') === key) return;
  if (mkOff) { mkOff(); mkOff = null; }
  const w = cityWorld(); if (light && w) { const i = w.lights.indexOf(light); if (i >= 0) w.lights.splice(i, 1); } light = null;
  M = null; if (!m || !w) { G.emit('chapters:change'); return; }
  const p = m.room ? place(m.x, m.y) : freeNear(w, m.x, m.y);
  M = { key, id: m.id, x: p.x, y: p.y, label: m.label, sub: m.sub };
  light = { x: p.x, y: p.y, z: .4, r: 3.4, c: '#ffd76a' }; w.lights.push(light);
  M.it = { scene: 'city', x: p.x, y: p.y, label: m.label, h: 2.2, hit: 20, range: 2.8, chapter: m.id, use: () => H && H.openCard(m.id) };
  mkOff = G.addInteractable(M.it);
  G.emit('chapters:change');
}
export const marker = () => (M ? { id: M.id, x: M.x, y: M.y, label: M.label } : null);
function drawMarker(ctx, cam) {
  if (!M || !G.scene || G.scene.id !== 'city' || G.cutscene && G.cutscene.hideMarkers) return;
  const z = safe(() => G.world.heightAt(M.x, M.y), 0), s = WS(M.x, M.y, z), t = performance.now() / 1000, bob = Math.round(Math.sin(t * 2.4) * 1.6);
  const X = Math.round(s[0] - cam.x), Y = Math.round(s[1] - cam.y); if (X < -30 || Y < -40 || X > G.W + 30 || Y > G.H + 60) return;
  /* a ring on the ground that breathes */
  const k = (t * .8) % 1, rx = 6 + k * 7, ry = rx / 2; ctx.globalAlpha = .75 * (1 - k); ctx.fillStyle = '#ffe9a6';
  for (let a = 0; a < 28; a++) { const an = a / 28 * 6.283; ctx.fillRect(Math.round(X + Math.cos(an) * rx), Math.round(Y + Math.sin(an) * ry), 1, 1); }
  ctx.globalAlpha = .9; ctx.fillStyle = '#f2c230'; for (let a = 0; a < 20; a++) { const an = a / 20 * 6.283; ctx.fillRect(Math.round(X + Math.cos(an) * 5), Math.round(Y + Math.sin(an) * 2.5), 1, 1); }
  ctx.globalAlpha = 1;
  ctx.drawImage(markerSprite(Math.floor(t * 3)), X - 8, Y - 31 + bob);
}

/* ---------- phone Map pins (G.mapPins: fn(g, X, Y, z, label, W, H) called at the end of the Map's draw) ---------- */
function mapPins(g, X, Y, z, label) {
  if (H) for (const p of safe(() => H.pins(), [])) { const x = X(p.x), y = Y(p.y); g.drawImage(pageSprite(), x - 4, y - 18, 9, 11); if (z >= 4 && p.note) { g.save(); g.font = 'italic 700 12px "Segoe Script","Bradley Hand",cursive'; label(p.note, x + 8, y - 13); g.restore(); } }
  if (M) { const x = X(M.x), y = Y(M.y), c = markerSprite(0); g.imageSmoothingEnabled = false; g.drawImage(c, x - 13, y - 44, 26, 39); if (z >= 2) label(M.label, x + 16, y - 34, true); }
}

/* ---------- story props in the city ---------- */
function clearProps() { const w = cityWorld(); if (w) for (const ob of props) safe(() => w.remove(ob)); props = []; }
export function sync() {
  const w = cityWorld(); if (!w || !H) return; const d13 = H.done('ch13'), d14 = H.done('ch14'), run14 = safe(() => G.chapters.current().id === 'ch14', false);
  const key = [d13 || run14, d14].join('|') + '|' + w.objs.length % 2; if (propKey === key && props.every(o => w.objs.includes(o))) return; propKey = key; clearProps();
  const put = (id, x, y, o) => { const ob = safe(() => w.place(asset(id), x, y, Object.assign({ solid: false }, o)), null); if (ob) { ob.story = 1; props.push(ob); } return ob; };
  const sw = SPOTS['spot:second_wind'], ks = SPOTS['spot:kettle_stall'];
  if (!d14) put('prop.story.bell', sw[0] - 1.5, sw[1] - .5);                        /* the bell by the Captain's cabin door */
  if (d13 || run14) {                                                              /* the Little Kettle, leaning a little */
    put('prop.event.stall', ks[0] - 1.5, ks[1] - 3.2, { p: { scheme: 'blossom', kind: 'tea', text: 'KETTLE', seed: 7 } });
    if (d14) put('prop.story.bell', ks[0] + 1.7, ks[1] - 1.7);
  }
  w.version++;
}

/* ---------- rooms ---------- */
function onRoom(sc) {
  const rid = sc.roomId; if (!rid || !H) return;
  if (rid === 'home:grandma') {
    /* the ladder on the landing, under the hatch */
    const x = 9.0 + 1, y = 3.3 + 1; safe(() => sc.world.place(asset('furn.story.ladder'), x, y, { solid: false }));   /* free-standing by the right-hand wall, between the two plants */
    sc.interactables.push({ x: x + .45, y: y + .4, label: 'The attic ladder', h: 2.2, hit: 16, range: 1.6, spot: { x: x + .45, y: y + 1.1 }, visible: () => H.done('ch05') || safe(() => G.chapters.current().id === 'ch06', false) || H.done('ch06'),
      use: () => { if (H.done('ch06') || safe(() => G.chapters.current().id === 'ch06', false)) G.go('int:home:grandma:attic', {}); else safe(() => G.goalsUI.caption('Nana Bea', 'Not today.', 2600)); } });
  }
  const home = safe(() => G.housing.current().roomId, null);
  if (home && rid === home && H.hasBook()) {
    /* Mom's book sits on a little stool near the door (a free floor cell), where you see it every time you come in */
    const sp = sc.spawn && typeof sc.spawn === 'object' ? sc.spawn : { x: 2, y: 2 }, w = sc.world; let at = null;
    for (const o of [[1.5, -1.5], [-1.5, -1.5], [1.5, 0], [-1.5, 0], [2.5, -1], [-2.5, -1], [0, -2.5], [2, -2.5], [-2, -2.5], [3, 0], [-3, 0]]) { const x = Math.round((sp.x + o[0]) * 2) / 2, y = Math.round((sp.y + o[1]) * 2) / 2; if (x > 1.2 && y > 1.2 && x < w.w - 2 && y < w.h - 2 && !safe(() => w.isBlocked(x, y), true) && !safe(() => w.isBlocked(x + .5, y + .5), true)) { at = { x, y }; break; } }
    if (at) {
      safe(() => w.place(asset('furn.story.book'), at.x - .35, at.y - .35, { solid: false }));
      sc.interactables.push({ x: at.x, y: at.y, label: "Mom's book", h: .9, hit: 16, range: 1.8, use: () => H.openBook() });
    }
  }
}

export function init(hooks) {
  H = hooks;
  G.overlays.push(drawMarker);
  (G.mapPins || (G.mapPins = [])).push(mapPins);
  G.on('room:build', sc => safe(() => onRoom(sc)));
  G.on('scene', s => { if (s && s.id === 'city') setTimeout(() => safe(sync), 50); });
  G.on('chapter:done', () => setTimeout(() => safe(sync), 50)); G.on('chapter:start', () => setTimeout(() => safe(sync), 50));
  G.on('load', () => { M = null; if (mkOff) { mkOff(); mkOff = null; } light = null; props = []; propKey = ''; setTimeout(() => safe(sync), 400); });
  /* a tap ON the marker always means the marker, whoever is standing next to it (passers-by and doors must not win the tap) */
  addEventListener('pointerdown', e => {
    const onWorld = e.target === G.cv || (e.target && e.target.classList && e.target.classList.contains('bubble'));   /* speech bubbles sit over the canvas and take taps */
    if (!M || !M.it || !onWorld || !G.scene || G.scene.id !== 'city' || G.modal || G.cutscene || G.busy) return;
    const r = G.cv.getBoundingClientRect(), z = safe(() => G.world.heightAt(M.x, M.y), 0), s = G.toScreen(M.x, M.y, z), k = G.cssScale || 1;
    const dx = e.clientX - (r.left + s.x), dy = e.clientY - (r.top + s.y);
    if (Math.abs(dx) > 13 * k + 8 || dy < -36 * k - 8 || dy > 7 * k + 6) return;
    e.stopPropagation(); e.preventDefault();
    const p = G.player, it = M.it, fire = () => { G.pending = null; p.stop(); p.faceTo(it.x, it.y); it.use(G, it); };
    if (Math.hypot(it.x - p.x, it.y - p.y) <= it.range) return fire();
    if (p.goTo(G.world, it.x, it.y, { snap: 10, limit: 30000 })) { G.target = null; G.pending = { it, fire, range: it.range }; }
  }, true);
  /* a tap on the gold row in the Goals list points the arrow at the marker */
  document.addEventListener('click', e => {
    const r = e.target && e.target.closest && e.target.closest('[data-g="chapter"]'); if (!r || !M) return;
    safe(() => G.phone.setWaypoint({ id: null, name: M.label, x: M.x, y: M.y }));
  }, true);
}
