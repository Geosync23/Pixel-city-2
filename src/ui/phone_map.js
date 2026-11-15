// Phone app: Map (city minimap with pan/zoom, pins, transit lines, place cards) + the on-screen waypoint arrow.
// ctx.arg: { place: id } selects and centres that place.
// Street names (G.address.streets()) are drawn along the roads: arterials at every zoom, streets from zoom 2, small streets from zoom 3; label layout is cached per zoom.
// District names are large faint labels (zoomed out). Place cards show the street address. The "Streets" chip opens a searchable street list (tap -> centre on it).
// Waypoint: setWaypoint(placeOrId | null) stores G.state.phone.waypoint = { id, name, x, y } and emits 'waypoint'(place | null);
//           (+ `room` when the place is inside a building). The on-screen guide arrow, arrival and room-to-room guidance live in ui/navarrow.js (G.navArrow).
import { G } from '../core/game.js';
import { toast } from './kit.js';
import { innerPlace } from './navarrow.js';
import { renderMinimap } from '../world/minimap.js';
import { FARES } from '../data/economy.js';
import { TRANSIT_SERVICE } from '../data/venues.js';
import { el, iconCanvas, empty, btn, chip, allPlaces, isKnown, place, placeCat, CATS, CAT_BY_ID, openState, cityPos, distTo, homePlace, money, safe, timeInfo } from './phone_util.js';

const INK = '#2a2733', CREAM = '#fff4dc';
let base = null, baseWorld = null, view = { cx: 192, cy: 192, z: 2 }, sel = null, needCenter = true, hidden = {}, pins = [], cv = null, footEl = null, ctxRef = null, selStreet = null, streetsOpen = false, navKind = null, navDest = null;
const FONT = '"Pixelify Sans", system-ui, sans-serif', lbl = { key: '', w: null, list: [] }, dist = { w: null, list: [] };
const streets = () => (G.address && G.address.streets ? G.address.streets() || [] : []);
const addrOf = p => (p && p.poi && p.poi.address) || (G.address && p ? (G.address.of(p) || {}).text : '') || '';
const cityWorld = () => { const s = G.sceneCache && G.sceneCache.get('city'); return s ? s.world : G.scene && G.scene.id === 'city' ? G.world : null; };
const S = () => G.state.phone;

/* ---------- waypoint ---------- */
export function setWaypoint(p) {
  if (typeof p === 'string') p = place(p) || innerPlace(p);   // innerPlace: a shop inside a building (mall) -> waypoint at the building door with `room`
  S().waypoint = p && typeof p.x === 'number' ? Object.assign({ id: p.id || null, name: p.name || 'Waypoint', x: p.x, y: p.y }, p.room ? { room: p.room } : null) : null;
  G.emit('waypoint', S().waypoint ? (place(S().waypoint.id) || S().waypoint) : null); return S().waypoint;
}
/** what the guide arrow is leading to, as city points: { pts: [next target, ..., destination] } | null (uses the active trip of G.nav when there is one, else the waypoint) */
function guidePts() {
  const wp = getWaypoint(), t = safe(() => G.nav.trip(), null), ok = q => q && typeof q.x === 'number' && typeof q.y === 'number', nm = (q, d) => ({ x: q.x, y: q.y, name: q.name || d });
  const pts = [];
  if (t && ok(t.dest)) { if (t.stage === 0 && ok(t.board)) pts.push(nm(t.board, 'Board here')); if (t.stage <= 1 && ok(t.alight)) pts.push(nm(t.alight, 'Get off here')); pts.push(nm(t.dest, 'Destination')); }
  else if (ok(wp)) pts.push(nm(wp, 'Waypoint'));
  if (t && ok(wp) && pts.length && Math.hypot(wp.x - pts[0].x, wp.y - pts[0].y) > 8 && wp.name !== pts[0].name && t.stage !== 1) pts.unshift(nm(wp, 'Waypoint'));   // a cab pick-up spot etc.
  return pts.length ? { pts } : null;
}
/** "Take me there" from anywhere (Wander, tips, the need chooser): opens the Map on the route card (foot / bus / train / cab) for that place instead of silently setting a waypoint (owner msg 81).
 *  p: place id | place | { x, y, name }. Falls back to a plain waypoint when there is no navigator or the Map app is not available. Returns true when the route card was opened. */
export function routeTo(p) {
  if (typeof p === 'string') p = place(p); if (!p || typeof p.x !== 'number') return false;
  const d = { id: p.id || null, name: p.name || 'Destination', x: p.x, y: p.y };
  if (G.nav && G.phone && G.phone.isUnlocked && G.phone.isUnlocked('map') && safe(() => G.nav.routeTo(d), []).length) { needCenter = false; G.phone.open('map', { route: d }); return true; }
  setWaypoint(p); return false;
}
export const getWaypoint = () => (G.state.phone ? G.state.phone.waypoint : null);

/* ---------- drawing ---------- */
function ensureBase(w) {
  if (base && baseWorld === w) return base;
  try { const m = renderMinimap(w, 2), c = document.createElement('canvas'); c.width = m.w; c.height = m.h; c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(m.data.buffer || m.data), m.w, m.h), 0, 0); base = c; }
  catch (e) { // simple generated fallback from ground types
    const c = document.createElement('canvas'); c.width = w.w; c.height = w.h; const g = c.getContext('2d'), COL = { 0: '#2f5d7c', 1: '#8fc46a', 2: '#d8d2c2', 3: '#6b6f7a', 4: '#e2d6b8', 5: '#c9b08a', 6: '#4f8fc0', 7: '#ead9a0', 16: '#79b85c', 17: '#3f78ad', 20: '#8fc46a' };
    for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) { g.fillStyle = COL[w.gt[y * w.w + x]] || '#b9b2a2'; g.fillRect(x, y, 1, 1); } base = c; }
  baseWorld = w; return base;
}
/* ---------- street + district labels ---------- */
// layout in map pixels (world * zoom), independent of panning -> cached per zoom level
function streetLabels(g, w, z) {
  const sts = streets(), key = z.toFixed(2) + '|' + sts.length; if (lbl.key === key && lbl.w === w) return lbl.list;
  const out = [], boxes = [], rank = s => (s.kind === 'arterial' ? 0 : s.kind === 'street' ? 1 : 2), fits = b => !boxes.some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
  g.font = '700 11px ' + FONT;
  for (const s of sts.slice().sort((a, b) => rank(a) - rank(b) || (b.b - b.a) - (a.b - a.a))) {
    if (z < [0, 1.9, 3][rank(s)]) continue; const len = (s.b - s.a) * z, tw = Math.ceil(g.measureText(s.name).width); if (len < tw + 10) continue;
    const n = Math.max(1, Math.floor(len / (tw + 230))), step = len / n;
    for (let i = 0; i < n; i++) { const al = s.a * z + step * (i + .5), c = s.c * z, hw = tw / 2 + 4, b = s.axis === 'x' ? [al - hw, c - 8, al + hw, c + 8] : [c - 8, al - hw, c + 8, al + hw]; if (!fits(b)) continue; boxes.push(b); out.push({ t: s.name, x: s.axis === 'x' ? al : c, y: s.axis === 'x' ? c : al, v: s.axis !== 'x', hw, art: rank(s) === 0 }); }
  }
  lbl.key = key; lbl.w = w; lbl.list = out; return out;
}
function districtLabels(w) {
  if (dist.w === w) return dist.list; const acc = {};
  if (w.districtAt) for (let y = 2; y < w.h; y += 4) for (let x = 2; x < w.w; x += 4) { const k = w.districtAt(x, y); if (!k) continue; const a = acc[k] || (acc[k] = [0, 0, 0]); a[0] += x; a[1] += y; a[2]++; }
  dist.w = w; dist.list = (w.districts || []).filter(d => acc[d.key] && acc[d.key][2] > 6).map(d => ({ t: String(d.name || d.key).toUpperCase().split('').join('\u200a'), x: acc[d.key][0] / acc[d.key][2], y: acc[d.key][1] / acc[d.key][2] })); return dist.list;
}
function drawLabels(g, w, z, W, H) {
  const ox = W / 2 - view.cx * z, oy = H / 2 - view.cy * z; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  if (z <= 3.4) { g.font = '700 ' + (z < 1.6 ? 12 : z < 2.6 ? 16 : 20) + 'px ' + FONT; for (const d of districtLabels(w)) { const x = Math.round(d.x * z + ox), y = Math.round(d.y * z + oy); if (x < -90 || y < -20 || x > W + 90 || y > H + 20) continue; g.globalAlpha = .7; g.strokeStyle = CREAM; g.lineWidth = 4; g.strokeText(d.t, x, y); g.globalAlpha = .55; g.fillStyle = INK; g.fillText(d.t, x, y); } g.globalAlpha = 1; }
  if (selStreet) { g.strokeStyle = '#f08a2c'; g.lineWidth = Math.max(3, z); g.globalAlpha = .75; g.beginPath(); for (const s of streets()) { if (s.name !== selStreet) continue; if (s.axis === 'x') { g.moveTo(s.a * z + ox, s.c * z + oy); g.lineTo(s.b * z + ox, s.c * z + oy); } else { g.moveTo(s.c * z + ox, s.a * z + oy); g.lineTo(s.c * z + ox, s.b * z + oy); } } g.stroke(); g.globalAlpha = 1; }
  g.font = '700 11px ' + FONT;
  for (const l of streetLabels(g, w, z)) { const x = Math.round(l.x + ox), y = Math.round(l.y + oy), m = l.hw + 8; if (x < -m || y < -m || x > W + m || y > H + m) continue;
    g.save(); g.translate(x, y); if (l.v) g.rotate(-Math.PI / 2); g.strokeStyle = l.t === selStreet ? '#fff0b8' : 'rgba(255,244,220,.92)'; g.lineWidth = 3; g.strokeText(l.t, 0, 1); g.fillStyle = l.art || l.t === selStreet ? INK : '#4a4658'; g.fillText(l.t, 0, 1); g.restore(); }
  g.textAlign = 'left';
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
  drawLabels(g, w, z, W, H);
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
  // whatever the on-screen arrow is guiding you to is drawn here too (owner msg 82): a dashed red route You -> next stop -> ... -> destination, a ring on the next target, a labelled flag on the destination
  const me = cityPos(), mx = X(me.x), my = Y(me.y), gd = guidePts();
  if (gd) {
    const pts = [me].concat(gd.pts); g.setLineDash([5, 4]); poly(pts, INK, 5); poly(pts, '#ff5a3c', 3); g.setLineDash([]);
    gd.pts.forEach((q, i) => { const x = X(q.x), y = Y(q.y), last = i === gd.pts.length - 1;
      if (last) { g.fillStyle = INK; g.fillRect(x - 2, y - 26, 4, 27); g.fillStyle = '#ff5a3c'; g.fillRect(x + 2, y - 26, 14, 10); g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x + 2, y - 26, 14, 10); label(q.name, x + 20, y - 21, true); }
      else { g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(x - 7, y - 7, 14, 14); g.strokeStyle = '#ff5a3c'; g.lineWidth = 3; g.strokeRect(x - 7, y - 7, 14, 14); label((i === 0 ? 'Next: ' : '') + q.name, x + 13, y - 12); } });
  } g.fillStyle = INK; g.fillRect(mx - 8, my - 8, 16, 16); g.fillStyle = CREAM; g.fillRect(mx - 6, my - 6, 12, 12); g.fillStyle = '#e05a3a'; g.fillRect(mx - 3, my - 3, 6, 6); label('You', mx + 12, my, true);
  for (const f of G.mapPins || []) { try { f(g, X, Y, z, label, W, H); } catch (e) { /* a pin layer must never break the map */ } }   /* extra pin layers (Chapters: the gold marker + Mom's pages) */
  const sp = sel && place(sel); if (sp) { const x = X(sp.x), y = Y(sp.y); g.strokeStyle = CREAM; g.lineWidth = 2; g.strokeRect(x - 11, y - 11, 22, 22); g.strokeStyle = INK; g.strokeRect(x - 13, y - 13, 26, 26); stamp('ui.pin', x, y - 22); label(sp.name, Math.min(x + 16, W - g.measureText(sp.name).width - 8), y, true); }
}
const clampView = () => { const w = cityWorld(); if (!w) return; view.z = Math.max(1, Math.min(8, view.z)); view.cx = Math.max(0, Math.min(w.w, view.cx)); view.cy = Math.max(0, Math.min(w.h, view.cy)); };
function zoomBy(f, ax, ay) {
  const box = cv.parentElement, W = box.clientWidth, H = box.clientHeight, z0 = view.z, z1 = Math.max(1, Math.min(8, z0 * f)); if (ax === undefined) { ax = W / 2; ay = H / 2; }
  const wx = (ax - W / 2) / z0 + view.cx, wy = (ay - H / 2) / z0 + view.cy; view.z = z1; view.cx = wx - (ax - W / 2) / z1; view.cy = wy - (ay - H / 2) / z1; clampView(); draw();
}

/* ---------- place card ---------- */
function showCard() {
  if (!footEl) return; footEl.replaceChildren(); if (navDest) return routeCard(); const p = sel && place(sel); if (!p) return;
  const cat = CAT_BY_ID[placeCat(p)], os = openState(p), v = p.venue, wp = getWaypoint(), isWp = wp && wp.id === p.id, ctx = ctxRef;
  const c = el('div.ph-placecard', null,
    el('div.t', null, el('div', null, el('b', { text: p.name }), el('br'), el('small', { text: [cat.name, p.districtName].filter(Boolean).join(' · ') + ` · ~${safe(() => G.nav.fmtDist(distTo(p)), Math.round(distTo(p)) + ' m')}` })), el('button.ph-link', { text: 'x', 'aria-label': 'Close card', onclick: () => { sel = null; showCard(); draw(); } })),
    addrOf(p) ? el('small.ph-addr', { text: addrOf(p) }) : null,
    v && v.blurb ? el('small', { text: v.blurb }) : null,
    os.open !== null ? el('div', null, chip(os.open ? 'OPEN' : 'CLOSED', os.open ? 'good' : 'bad'), ' ', el('small', { text: os.hours })) : null,
    p.kind === 'station' ? el('small', { text: `Light rail: ${money(FARES.train.single)} flat, a train every ${TRANSIT_SERVICE.train.headwayMinutes.offPeak} min or so.` }) : null,
    el('div.ph-btns', null, btn(isWp ? 'Clear waypoint' : 'Set waypoint', () => { if (isWp) { setWaypoint(null); if (G.nav) G.nav.cancel(); } else if (G.nav) { navDest = p; } else { setWaypoint(p); ctx.tip('Waypoint set. Follow the arrow.'); } showCard(); draw(); }, isWp ? '' : 'pri', 'ui.pin'),
      G.phone.isUnlocked('taxi') ? btn('Call cab here', () => ctx.open('taxi', { place: p.id }), '', 'transport.taxi') : null));
  footEl.append(c);
}
/* ---------- navigator: "Where to?" chips -> nearest places -> route card (walk / bus / train / cab) ---------- */
const NAVCHIPS = [['food', 'Food'], ['groceries', 'Groceries'], ['coffee', 'Coffee'], ['home', 'Home'], ['work', 'Work'], ['fun', 'Fun'], ['shopping', 'Shopping'], ['transit', 'Transit'], ['search', 'Search']];
const MODE_ICON = { walk: 'WALK', bike: 'BIKE', bus: 'BUS', train: 'TRAIN', cab: 'CAB' };
function routeCard() {
  const d = navDest, ctx = ctxRef, opts = safe(() => G.nav.routeTo(d), []), t = G.nav.trip && G.nav.trip();
  const c = el('div.ph-placecard.ph-route', null, el('div.t', null, el('div', null, el('b', { text: 'To ' + d.name }), el('br'), el('small', { text: 'How will you get there?' })), el('button.ph-link', { text: 'x', 'aria-label': 'Close directions', onclick: () => { navDest = null; showCard(); draw(); } })));
  if (t) c.append(el('small', null, 'Trip in progress to ' + t.dest.name + '. ', el('button.ph-link', { text: 'Cancel trip', onclick: () => { G.nav.cancel(); showCard(); draw(); } })));
  for (const o of opts) c.append(el('button', { 'data-nav': o.mode, style: { display: 'block', width: '100%', textAlign: 'left', margin: '3px 0', padding: '4px 8px', minHeight: '40px' }, onclick: () => { G.nav.start(o); if (o.mode === 'cab') return; navDest = null; sel = null; showCard(); draw();
      /* QA9 (lead decision): close the phone so the arrow shows at once */ safe(() => G.phone.close()); toast(o.mode === 'bus' || o.mode === 'train' ? 'Trip started: walk to ' + o.board.name + ' first. Follow the arrow.' : 'Follow the arrow.', 'info', 3200); } },
    el('b', { text: MODE_ICON[o.mode] + (o.line ? ' · ' + o.line : '') + ' · ' + o.minutes + ' min · ' + o.costText }), el('br'), el('small', { text: o.text + (o.next ? ' · ' + o.next : '') })));
  if (!opts.length) c.append(el('small', { text: 'No route found.' }));
  footEl.append(c);
}
function navPanel() {
  const list = el('div', { style: { overflowY: 'auto', flex: '1', minHeight: '0', display: 'flex', flexDirection: 'column', gap: '4px' } }), title = (NAVCHIPS.find(c => c[0] === navKind) || [])[1] || 'Places';
  const pick = r => { const p0 = typeof r.id === 'string' ? place(r.id) : null;
    /* QA9: the building you are standing in: no 'WALK 1 min, 10 m' card, the arrow takes over at once */
    if (p0 && G.scene && G.scene.roomId && G.navGoals && safe(() => G.navGoals.rootOf(p0.roomId || p0.id) === G.navGoals.rootOf(G.scene.roomId), false)) { navKind = null; setWaypoint(p0.id); safe(() => G.phone.close()); toast('It is right here: follow the arrow.', 'info', 3000); return; }
    navKind = null; const p = p0; navDest = p ? { id: p.id, name: r.home ? 'Home' : p.name, x: p.x, y: p.y } : { name: r.name, x: r.x, y: r.y }; view.cx = navDest.x; view.cy = navDest.y; sel = null; if (ctxRef) ctxRef.refresh(); };
  const fill = rows => { list.replaceChildren(); for (const r of rows) list.append(el('button', { 'data-navrow': typeof r.id === 'string' ? r.id : 'pos', style: { textAlign: 'left', minHeight: '40px', padding: '4px 10px', display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }, onclick: () => pick(r) },
      el('span', null, el('b', { text: r.name }), r.note ? el('small', { text: ' · ' + r.note }) : null), el('span', { style: { whiteSpace: 'nowrap' } }, el('small', { text: safe(() => G.nav.fmtDist(r.d), Math.round(r.d) + ' m') + ' ' }), r.open == null ? null : chip(r.open ? 'OPEN' : 'CLOSED', r.open ? 'good' : 'bad'))));
    if (!rows.length) list.append(el('small', { text: navKind === 'search' ? 'Type a place, a dish, a thing to do...' : navKind === 'work' ? 'No job yet - try the job board.' : navKind === 'home' ? 'No home yet.' : 'Nothing like that on the map yet.' })); };
  let inp = null;
  if (navKind === 'search') { const c = cityPos(), run = q => fill(q.trim().length < 2 ? [] : safe(() => G.guide.search(q.trim()), []).filter(e => isFinite(e.x) && isFinite(e.y)).slice(0, 10).map(e => { const p = e.placeId && place(e.placeId); return { id: p ? p.id : { x: e.x, y: e.y, name: e.title }, name: e.title, note: e.type || '', x: e.x, y: e.y, d: Math.abs(e.x - c.x) + Math.abs(e.y - c.y), open: p ? openState(p).open : null }; }));
    inp = el('input', { type: 'search', placeholder: 'Search places and things to do...', 'aria-label': 'Search places', style: { minHeight: '40px', padding: '4px 8px', border: '2px solid #2a2733', font: 'inherit', background: '#fffdf4' }, oninput: () => run(inp.value) }); for (const ev of ['pointerdown', 'pointerup', 'wheel']) inp.addEventListener(ev, e => e.stopPropagation()); fill([]); }
  else fill(safe(() => G.nav.find(navKind, 6), []));
  const panel = el('div.ph-streets.ph-navlist', { style: { position: 'absolute', left: '8px', top: '8px', bottom: '8px', width: 'min(290px, calc(100% - 64px))', background: '#fff4dc', border: '2px solid #2a2733', boxShadow: '3px 3px 0 #2a2733', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: '3', touchAction: 'pan-y' } },
    el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, el('b', { text: 'Where to? ' + title }), el('button.ph-link', { text: 'x', 'aria-label': 'Close list', onclick: () => { navKind = null; if (ctxRef) ctxRef.refresh(); } })), inp, list);
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'wheel']) panel.addEventListener(ev, e => e.stopPropagation());
  return panel;
}
function whereTo(ctx) {
  const job = safe(() => G.jobs.current(), null), chips = NAVCHIPS.filter(c => c[0] !== 'work' || job);
  return el('div.ph-legend.ph-whereto', { role: 'group', 'aria-label': 'Where to?', style: { borderBottom: '2px solid #2a2733' } }, el('b', { text: 'Where to?', style: { alignSelf: 'center', whiteSpace: 'nowrap' } }),
    chips.map(([id, name]) => el('button.ph-chip' + (navKind === id ? '.on' : ''), { 'data-navchip': id, 'aria-pressed': navKind === id ? 'true' : 'false', onclick: () => { streetsOpen = false; if (id === 'home') { const h = safe(() => G.nav.find('home', 1), [])[0]; if (!h) return ctx.tip('No home yet.'); navKind = null; navDest = { id: h.id, name: 'Home', x: h.x, y: h.y }; } else navKind = navKind === id ? null : id; ctx.refresh(); } }, name)));
}
/* ---------- street search ---------- */
function streetList() { const by = new Map(); for (const s of streets()) { const e = by.get(s.name); if (!e || s.b - s.a > e.b - e.a) by.set(s.name, s); } return [...by.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })); }
function goStreet(s) { selStreet = s.name; sel = null; const m = (s.a + s.b) / 2; view.cx = s.axis === 'x' ? m : s.c; view.cy = s.axis === 'x' ? s.c : m; view.z = Math.max(view.z, 3); streetsOpen = false; if (ctxRef) ctxRef.refresh(); }
function streetsPanel() {
  const w = cityWorld(), list = el('div', { style: { overflowY: 'auto', flex: '1', minHeight: '0', display: 'flex', flexDirection: 'column', gap: '4px' } }), all = streetList();
  const fill = q => { list.replaceChildren(); q = q.trim().toLowerCase(); const rows = all.filter(s => !q || s.name.toLowerCase().includes(q));
    for (const s of rows) { const m = (s.a + s.b) / 2, k = w && w.districtAt ? w.districtAt(s.axis === 'x' ? m : s.c, s.axis === 'x' ? s.c : m) : '', d = k && (w.districts || []).find(x => x.key === k);
      list.append(el('button', { style: { textAlign: 'left', minHeight: '40px', padding: '4px 10px', display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }, onclick: () => goStreet(s) }, el('b', { text: s.name }), el('small', { text: (d ? d.name : '') + (s.kind === 'arterial' ? ' · main road' : '') }))); }
    if (!rows.length) list.append(el('small', { text: 'No street by that name.' })); };
  const inp = el('input', { type: 'search', placeholder: 'Search streets...', 'aria-label': 'Search streets', style: { minHeight: '40px', padding: '4px 8px', border: '2px solid #2a2733', font: 'inherit', background: '#fffdf4' }, oninput: () => fill(inp.value) });
  for (const ev of ['pointerdown', 'pointerup', 'wheel']) inp.addEventListener(ev, e => e.stopPropagation());
  fill('');
  const panel = el('div.ph-streets', { style: { position: 'absolute', left: '8px', top: '8px', bottom: '8px', width: 'min(260px, calc(100% - 64px))', background: '#fff4dc', border: '2px solid #2a2733', boxShadow: '3px 3px 0 #2a2733', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: '3', touchAction: 'pan-y' } },
    el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, el('b', { text: 'Streets' }), el('button.ph-link', { text: 'x', 'aria-label': 'Close streets', onclick: () => { streetsOpen = false; if (ctxRef) ctxRef.refresh(); } })), inp, list);
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'wheel']) panel.addEventListener(ev, e => e.stopPropagation());
  return panel;
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
    G.on('phone:app', id => { if (id === 'map') needCenter = true; });
  },
  render(b, ctx) {
    const w = cityWorld(); if (!w) return b.append(empty('ui.pin', 'No map data yet', 'Step outside and the city map will load.'));
    ctxRef = ctx; footEl = ctx.foot; const a = ctx.arg;
    if (a && a.place && !a._used) { a._used = 1; const p = place(a.place); if (p) { sel = p.id; navDest = null; navKind = null; view.cx = p.x; view.cy = p.y; view.z = Math.max(view.z, 3); needCenter = false; hidden[placeCat(p)] = false; } }
    if (a && a.route && !a._used) { a._used = 1; const d = a.route; navDest = { id: d.id || null, name: d.name || 'Destination', x: d.x, y: d.y }; view.cx = d.x; view.cy = d.y; view.z = Math.max(view.z, 3); sel = null; navKind = null; streetsOpen = false; needCenter = false; }   // deep link: open on the 'How will you get there?' card
    if (needCenter) { const c = cityPos(); view.cx = c.x; view.cy = c.y; view.z = 3; needCenter = false; sel = null; selStreet = null; streetsOpen = false; navKind = null; navDest = null;
      const gd = guidePts(); if (gd) { const q = gd.pts[0], dx = Math.abs(q.x - c.x), dy = Math.abs(q.y - c.y); view.cx = (q.x + c.x) / 2; view.cy = (q.y + c.y) / 2; view.z = Math.max(1, Math.min(4, Math.min(300 / (dx + 8), 330 / (dy + 8)))); } }   // an active arrow: frame you and the next target
    if (G.nav) b.append(whereTo(ctx));
    const present = new Set(allPlaces().map(placeCat));
    b.append(el('div.ph-legend', { role: 'group', 'aria-label': 'Filter' }, streets().length ? el('button.ph-chip' + (streetsOpen ? '.on' : ''), { 'aria-pressed': streetsOpen ? 'true' : 'false', onclick: () => { streetsOpen = !streetsOpen; ctx.refresh(); } }, 'Streets') : null, CATS.filter(c => present.has(c.id)).map(c => el('button.ph-chip' + (hidden[c.id] ? '.off' : ''), { 'aria-pressed': hidden[c.id] ? 'false' : 'true', onclick: () => { hidden[c.id] = !hidden[c.id]; ctx.refresh(); } }, el('i', { style: { background: c.color } }), c.name))));
    cv = el('canvas', { 'aria-label': 'City map' });
    const box = el('div.ph-map', null, cv, el('div.ph-map-ctl', null, el('button', { text: '+', 'aria-label': 'Zoom in', onclick: () => zoomBy(1.5) }), el('button', { text: '-', 'aria-label': 'Zoom out', onclick: () => zoomBy(1 / 1.5) }),
      el('button', { 'aria-label': 'Centre on me', onclick: () => { const c = cityPos(); view.cx = c.x; view.cy = c.y; draw(); } }, el('span', { text: '◎' }))));
    if (navKind && G.nav) box.append(navPanel()); else if (streetsOpen) box.append(streetsPanel());
    b.append(box); attach(box, ctx); showCard();
    requestAnimationFrame(() => { clampView(); draw(); }); setTimeout(draw, 250);
  },
};
