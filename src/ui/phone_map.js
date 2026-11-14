// Phone app: Map (city minimap with pan/zoom, pins, transit lines, place cards) + the on-screen waypoint arrow.
// ctx.arg: { place: id } selects and centres that place.
// Waypoint: setWaypoint(placeOrId | null) stores G.state.phone.waypoint = { id, name, x, y } and emits 'waypoint'(place | null);
//           a DOM arrow (#ph-way) at the screen edge points to it with the distance while the player is in the city; arriving clears it.
import { G } from '../core/game.js';
import { root, toast } from './kit.js';
import { renderMinimap } from '../world/minimap.js';
import { FARES } from '../data/economy.js';
import { TRANSIT_SERVICE } from '../data/venues.js';
import { el, iconCanvas, empty, btn, chip, allPlaces, isKnown, place, placeCat, CATS, CAT_BY_ID, openState, cityPos, distTo, homePlace, money, safe, timeInfo } from './phone_util.js';

const INK = '#2a2733', CREAM = '#fff4dc';
let base = null, baseWorld = null, view = { cx: 192, cy: 192, z: 2 }, sel = null, needCenter = true, hidden = {}, pins = [], cv = null, footEl = null, ctxRef = null, wayEl = null;
const cityWorld = () => { const s = G.sceneCache && G.sceneCache.get('city'); return s ? s.world : G.scene && G.scene.id === 'city' ? G.world : null; };
const S = () => G.state.phone;

/* ---------- waypoint ---------- */
export function setWaypoint(p) {
  if (typeof p === 'string') p = place(p);
  S().waypoint = p && typeof p.x === 'number' ? { id: p.id || null, name: p.name || 'Waypoint', x: p.x, y: p.y } : null;
  G.emit('waypoint', S().waypoint ? (place(S().waypoint.id) || S().waypoint) : null); return S().waypoint;
}
export const getWaypoint = () => (G.state.phone ? G.state.phone.waypoint : null);
function wayFrame() {
  const wp = getWaypoint(), on = wp && G.scene && G.scene.id === 'city' && !G.onTitle && G.player && G.cv;
  if (!on) { if (wayEl.classList.contains('on')) wayEl.classList.remove('on'); return; }
  const pl = G.player, d = Math.hypot(wp.x - pl.x, wp.y - pl.y);
  if (d < 4 && !G.cutscene) { S().waypoint = null; G.emit('waypoint', null); G.emit('waypoint:arrived', wp); toast(`You have arrived: ${wp.name}`, 'good'); return; }
  const w = G.cv.parentElement, W = w.clientWidth, H = w.clientHeight, p = G.toScreen(wp.x, wp.y, G.world.heightAt(wp.x, wp.y)), a = wayEl.firstChild, l = wayEl.lastChild;
  const inside = p.x > 50 && p.x < W - 50 && p.y > 90 && p.y < H - 100; let x, y;
  if (inside) { x = p.x; y = p.y - 44; a.style.transform = ''; l.textContent = wp.name; }
  else { const cx = W / 2, cy = H / 2, dx = p.x - cx, dy = p.y - cy, k = Math.min((W / 2 - Math.min(96, W * .24)) / Math.abs(dx || 1e-6), (H / 2 - 100) / Math.abs(dy || 1e-6)); x = cx + dx * k; y = cy + dy * k + 10;
    a.style.transform = `rotate(${Math.round(Math.atan2(dy, dx) * 180 / Math.PI + 90)}deg)`; l.textContent = `${wp.name} · ${Math.round(d)} m`; }
  wayEl.style.left = Math.round(x) + 'px'; wayEl.style.top = Math.round(y) + 'px'; wayEl.classList.toggle('near', inside); wayEl.classList.add('on');
}

/* ---------- drawing ---------- */
function ensureBase(w) {
  if (base && baseWorld === w) return base;
  try { const m = renderMinimap(w, 2), c = document.createElement('canvas'); c.width = m.w; c.height = m.h; c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(m.data.buffer || m.data), m.w, m.h), 0, 0); base = c; }
  catch (e) { // simple generated fallback from ground types
    const c = document.createElement('canvas'); c.width = w.w; c.height = w.h; const g = c.getContext('2d'), COL = { 0: '#2f5d7c', 1: '#8fc46a', 2: '#d8d2c2', 3: '#6b6f7a', 4: '#e2d6b8', 5: '#c9b08a', 6: '#4f8fc0', 7: '#ead9a0', 16: '#79b85c', 17: '#3f78ad', 20: '#8fc46a' };
    for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) { g.fillStyle = COL[w.gt[y * w.w + x]] || '#b9b2a2'; g.fillRect(x, y, 1, 1); } base = c; }
  baseWorld = w; return base;
}
function draw() {
  const w = cityWorld(); if (!cv || !w || !cv.isConnected) return; const box = cv.parentElement, W = box.clientWidth, H = box.clientHeight; if (!W || !H) return;
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const g = cv.getContext('2d'), z = view.z, X = x => Math.round((x - view.cx) * z + W / 2), Y = y => Math.round((y - view.cy) * z + H / 2), b = ensureBase(w);
  g.imageSmoothingEnabled = false; g.fillStyle = '#2f5d7c'; g.fillRect(0, 0, W, H); g.drawImage(b, 0, 0, b.width, b.height, X(0), Y(0), w.w * z, w.h * z);
  const poly = (pts, col, lw, close) => { if (!pts || pts.length < 2) return; g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'miter'; g.beginPath(); pts.forEach((p, i) => { const x = X(p[0] !== undefined ? p[0] : p.x), y = Y(p[1] !== undefined ? p[1] : p.y); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); if (close) g.closePath(); g.stroke(); };
  if (!hidden.transit) {
    for (const r of w.busRoutes || []) { g.setLineDash([6, 4]); poly(r.path, r.color || '#3f7fd0', 2, true); } g.setLineDash([]);
    if (w.rail && w.rail.path) { poly(w.rail.path, INK, 6, true); poly(w.rail.path, '#e0453a', 2, true); }
  }
  g.font = '700 12px "Pixelify Sans", system-ui, sans-serif'; g.textBaseline = 'middle';
  const label = (t, x, y, strong) => { const tw = Math.ceil(g.measureText(t).width); g.fillStyle = strong ? INK : CREAM; g.fillRect(x - 3, y - 8, tw + 6, 16); if (!strong) { g.strokeStyle = INK; g.lineWidth = 1; g.strokeRect(x - 2.5, y - 7.5, tw + 5, 15); } g.fillStyle = strong ? CREAM : INK; g.fillText(t, x, y + 1); };
  const stamp = (id, x, y) => { const c = iconCanvas(id); g.drawImage(c, x - 8, y - 8); };
  pins = []; const home = homePlace(), wp = getWaypoint();
  const list = allPlaces().filter(p => !['busstop', 'taxistand', 'spot'].includes(p.kind) || p.kind === 'busstop' && z >= 4);
  for (const p of list) {
    const cat = placeCat(p); if (hidden[cat]) continue; const x = X(p.x), y = Y(p.y); if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
    const known = isKnown(p.id), isHome = home && p.id === home.id;
    if (!known) { if (z >= 2) { g.fillStyle = INK; g.fillRect(x - 3, y - 3, 6, 6); g.fillStyle = '#b7b3c2'; g.fillRect(x - 2, y - 2, 4, 4); } pins.push({ p, x, y, known }); continue; }
    if (isHome) stamp('ui.home', x, y); else if (p.kind === 'station') stamp('transport.train', x, y); else if (p.kind === 'airport') stamp('transport.plane', x, y); else if (p.kind === 'busstop') stamp('transport.bus', x, y);
    else { const s = z >= 2 ? 6 : 4; g.fillStyle = INK; g.fillRect(x - s - 2, y - s - 2, s * 2 + 4, s * 2 + 4); g.fillStyle = CAT_BY_ID[cat].color; g.fillRect(x - s, y - s, s * 2, s * 2); g.fillStyle = CREAM; g.fillRect(x - 2, y - 2, 4, 4); }
    pins.push({ p, x, y, known });
    if (p.id !== sel && (isHome || p.kind === 'station' && z >= 2 || z >= 5)) label(isHome ? 'Home' : p.name, x + 12, y);
  }
  if (wp) { const x = X(wp.x), y = Y(wp.y); g.fillStyle = INK; g.fillRect(x - 1, y - 20, 3, 21); g.fillStyle = '#e05a3a'; g.fillRect(x + 2, y - 20, 10, 8); g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x + 2, y - 20, 10, 8); }
  const me = cityPos(), mx = X(me.x), my = Y(me.y); g.fillStyle = INK; g.fillRect(mx - 8, my - 8, 16, 16); g.fillStyle = CREAM; g.fillRect(mx - 6, my - 6, 12, 12); g.fillStyle = '#e05a3a'; g.fillRect(mx - 3, my - 3, 6, 6); label('You', mx + 12, my, true);
  const sp = sel && place(sel); if (sp) { const x = X(sp.x), y = Y(sp.y); g.strokeStyle = CREAM; g.lineWidth = 2; g.strokeRect(x - 11, y - 11, 22, 22); g.strokeStyle = INK; g.strokeRect(x - 13, y - 13, 26, 26); stamp('ui.pin', x, y - 22); label(sp.name, Math.min(x + 16, W - g.measureText(sp.name).width - 8), y, true); }
}
const clampView = () => { const w = cityWorld(); if (!w) return; view.z = Math.max(1, Math.min(8, view.z)); view.cx = Math.max(0, Math.min(w.w, view.cx)); view.cy = Math.max(0, Math.min(w.h, view.cy)); };
function zoomBy(f, ax, ay) {
  const box = cv.parentElement, W = box.clientWidth, H = box.clientHeight, z0 = view.z, z1 = Math.max(1, Math.min(8, z0 * f)); if (ax === undefined) { ax = W / 2; ay = H / 2; }
  const wx = (ax - W / 2) / z0 + view.cx, wy = (ay - H / 2) / z0 + view.cy; view.z = z1; view.cx = wx - (ax - W / 2) / z1; view.cy = wy - (ay - H / 2) / z1; clampView(); draw();
}

/* ---------- place card ---------- */
function showCard() {
  if (!footEl) return; footEl.replaceChildren(); const p = sel && place(sel); if (!p) return;
  const cat = CAT_BY_ID[placeCat(p)], os = openState(p), v = p.venue, wp = getWaypoint(), isWp = wp && wp.id === p.id, ctx = ctxRef;
  const c = el('div.ph-placecard', null,
    el('div.t', null, el('div', null, el('b', { text: p.name }), el('br'), el('small', { text: [cat.name, p.districtName].filter(Boolean).join(' · ') + ` · ~${Math.round(distTo(p))} m` })), el('button.ph-link', { text: 'x', 'aria-label': 'Close card', onclick: () => { sel = null; showCard(); draw(); } })),
    v && v.blurb ? el('small', { text: v.blurb }) : null,
    os.open !== null ? el('div', null, chip(os.open ? 'OPEN' : 'CLOSED', os.open ? 'good' : 'bad'), ' ', el('small', { text: os.hours })) : null,
    p.kind === 'station' ? el('small', { text: `Light rail: ${money(FARES.train.single)} flat, a train every ${TRANSIT_SERVICE.train.headwayMinutes.offPeak} min or so.` }) : null,
    el('div.ph-btns', null, btn(isWp ? 'Clear waypoint' : 'Set waypoint', () => { setWaypoint(isWp ? null : p); if (!isWp) ctx.tip('Waypoint set. Follow the arrow.'); showCard(); draw(); }, isWp ? '' : 'pri', 'ui.pin'),
      G.phone.isUnlocked('taxi') ? btn('Call cab here', () => ctx.open('taxi', { place: p.id }), '', 'transport.taxi') : null));
  footEl.append(c);
}
function attach(box, ctx) {
  const pts = new Map(); let moved = 0, pinch = 0;
  box.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; box.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 1) moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } });
  box.addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (pts.size === 1) { moved += Math.abs(dx) + Math.abs(dy); view.cx -= dx / view.z; view.cy -= dy / view.z; clampView(); draw(); }
    else if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y), r = box.getBoundingClientRect(); moved = 99; if (pinch > 0 && d > 0) zoomBy(d / pinch, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); pinch = d; }
  });
  const up = e => {
    if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (moved > 8 || pts.size) return;
    const r = box.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let best = null, bd = 22;
    for (const q of pins) { const d = Math.hypot(q.x - x, q.y - y) - (q.known ? 4 : 0); if (d < bd) { bd = d; best = q; } }
    if (best && !best.known) return ctx.tip('An undiscovered place. Go and have a look!');
    sel = best ? best.p.id : null; showCard(); draw();
  };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', e => pts.delete(e.pointerId));
  box.addEventListener('wheel', e => { e.preventDefault(); const r = box.getBoundingClientRect(); zoomBy(e.deltaY < 0 ? 1.25 : .8, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
}

export default {
  id: 'map',
  setup() {
    wayEl = el('div', { id: 'ph-way', 'aria-hidden': 'true' }, el('span.a'), el('span.l')); root().append(wayEl);
    G.on('frame', wayFrame); G.on('phone:app', id => { if (id === 'map') needCenter = true; });
  },
  render(b, ctx) {
    const w = cityWorld(); if (!w) return b.append(empty('ui.pin', 'No map data yet', 'Step outside and the city map will load.'));
    ctxRef = ctx; footEl = ctx.foot; const a = ctx.arg;
    if (a && a.place && !a._used) { a._used = 1; const p = place(a.place); if (p) { sel = p.id; view.cx = p.x; view.cy = p.y; view.z = Math.max(view.z, 3); needCenter = false; hidden[placeCat(p)] = false; } }
    if (needCenter) { const c = cityPos(); view.cx = c.x; view.cy = c.y; view.z = 3; needCenter = false; sel = null; }
    const present = new Set(allPlaces().map(placeCat));
    b.append(el('div.ph-legend', { role: 'group', 'aria-label': 'Filter' }, CATS.filter(c => present.has(c.id)).map(c => el('button.ph-chip' + (hidden[c.id] ? '.off' : ''), { 'aria-pressed': hidden[c.id] ? 'false' : 'true', onclick: () => { hidden[c.id] = !hidden[c.id]; ctx.refresh(); } }, el('i', { style: { background: c.color } }), c.name))));
    cv = el('canvas', { 'aria-label': 'City map' });
    const box = el('div.ph-map', null, cv, el('div.ph-map-ctl', null, el('button', { text: '+', 'aria-label': 'Zoom in', onclick: () => zoomBy(1.5) }), el('button', { text: '-', 'aria-label': 'Zoom out', onclick: () => zoomBy(1 / 1.5) }),
      el('button', { 'aria-label': 'Centre on me', onclick: () => { const c = cityPos(); view.cx = c.x; view.cy = c.y; draw(); } }, el('span', { text: '◎' }))));
    b.append(box); attach(box, ctx); showCard();
    requestAnimationFrame(() => { clampView(); draw(); }); setTimeout(draw, 250);
  },
};
