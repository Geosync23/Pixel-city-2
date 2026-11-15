// Showpiece interiors — city entrances, shop wiring and gameplay for the Maple Bay Galleria (room 'deptstore') and the SkyDeck at Beacon Tower
// (rooms 'skydeck_lobby' + 'skydeck'). Rooms: scenes/rooms/mall.js, skydeck.js. Data: data/venues_showpiece.js. Art: art/showpiece/.
//
// City (once per city world, before places/stalls/addresses build — order 56):
//   - the existing downtown door `door:deptstore` (and its landmark twin) is renamed "Maple Bay Galleria";
//   - the tallest downtown glass tower gets a street door poi `door:skydeck_lobby` (room 'skydeck_lobby', name "Beacon Tower SkyDeck") + its interactable.
//   G.places ids: 'deptstore' (the mall), 'skydeck_lobby' (the tower door) — 'skydeck' is an alias of it (G.places.get('skydeck') / discover('skydeck') work).
// G.showpieces = {
//   skydeck: { viewNow() -> 'day'|'dusk'|'night', ride(up = true) -> Promise (10 s lift cutscene, then the other floor; going up needs a ticket),
//              hasTicket(), buyTicket() -> bool ($8, valid all day; free with G.state.flags.skydeck_pass), scope(district) (telescope view modal; 25c),
//              photo() (flash + keepsake line), tower() -> { x, y, ob } | null, arrived() },
//   mall: { shops() -> [{ id, name, venueId, x, y }] (x, y: world coords inside room 'deptstore'), isOpen() },
//   photos() -> [{ day, clock, view, text }] }
// State: G.state.showpieces = { photos: [], ticketDay, visits: { skydeck, mall }, arcade: { game: best }, ledge }
// Events: 'skydeck:visit'(first: bool) on every arrival on the deck, 'skydeck:ride'(up), 'skydeck:scope'(district, [placeIds]), 'skydeck:photo'(entry),
//         'skydeck:ledge'(first), 'skydeck:plaque'(i), 'skydeck:ticket', 'mall:visit', 'mall:arcade'(score, game)
// Item hooks: MALL_VIS is merged into housing VIS (plants, electronics, bikes/skateboards place as real furniture), MALL_LOOKS into wardrobe LOOKS.
import { G } from '../core/game.js';
import { el, root, toast, modal } from '../ui/kit.js';
import { ROOMS, enterRoom } from '../scenes/interior.js';
import { VENUE_BY_ID } from '../data/venues.js';
import { MALL_SHOPS, FOOD_COURT, MALL_VIS, MALL_LOOKS, MALL_HOURS } from '../data/venues_showpiece.js';
import { VIS } from './housing.js';
import { LOOKS } from './wardrobe.js';
import { getCity } from '../world/_city.js';
import { pano, panoCanvas, SPOTS, PANO_H, HZ } from '../art/showpiece/_pano.js';

export const order = 56;
Object.assign(VIS, MALL_VIS); Object.assign(LOOKS, MALL_LOOKS);
const TICKET = 8, GALLERIA = 'Maple Bay Galleria', TOWER = 'Beacon Tower SkyDeck';
const DNAME = { hillcrest: 'Hillcrest', park: 'Riverside Park', oldtown: 'Old Town', harbor: 'The Harbor', airport: 'Maple Bay International' };
const DTEXT = { hillcrest: 'Big houses climbing a green hill, and the radio mast that blinks all night.', park: 'Lawns, the pond and the bandstand. Somebody is flying a kite.', oldtown: 'Terracotta roofs packed around the clock tower. It is four minutes fast, even from here.', harbor: 'Faith, Hope and Gerald at work over a ship stacked like a toy box — and the lighthouse on the point.', airport: 'The runway, the control tower and a jet on final approach.' };
let S = null, built = null, tower = null;
const st = () => (S = G.state.showpieces || (G.state.showpieces = {}), S.photos = S.photos || [], S.visits = S.visits || {}, S);
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);

function viewNow() { const h = G.now().hf; return h < 5.5 || h >= 20.5 ? 'night' : h < 7 || h >= 18 ? 'dusk' : 'day'; }

/* ---------- city entrances ---------- */
function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w;
  for (const p of w.pois) if (p && (p.id === 'door:deptstore' || p.room === 'deptstore' || p.name === 'Maple Bay Department Store')) p.name = GALLERIA;
  if (w.pois.some(p => p.id === 'door:skydeck_lobby')) return;
  let best = null; for (const ob of w.objs) { if (!ob.a || ob.a.kind !== 'building' || !/^bld\.downtown\.tower/.test(ob.id) || !ob.B) continue; if (w.pois.some(p => p.type === 'door' && p.x > ob.B[0] - 2 && p.x < ob.B[3] + 2 && p.y > ob.B[1] - 2 && p.y < ob.B[4] + 2)) continue; if (!best || ob.size[2] > best.size[2] + .01) best = ob; }
  if (!best) return; const B = best.B, free = (x, y) => x > 1 && y > 1 && x < w.w - 1 && y < w.h - 1 && !w.isBlocked(x, y); let sp = null;
  for (const out of [.75, 1.25, 1.75, 2.25]) { for (const off of [0, .5, -.5, 1, -1, 1.5, -1.5, 2, -2, 3, -3]) { const a = { x: (B[0] + B[3]) / 2 + off, y: B[4] + out, dir: 3 }, b = { x: B[3] + out, y: (B[1] + B[4]) / 2 + off, dir: 2 }; if (free(a.x, a.y)) { sp = a; break; } if (free(b.x, b.y)) { sp = b; break; } } if (sp) break; }
  if (!sp) return;
  const poi = w.poi({ type: 'door', id: 'door:skydeck_lobby', room: 'skydeck_lobby', name: TOWER, x: Math.round(sp.x * 2) / 2, y: Math.round(sp.y * 4) / 4, dir: sp.dir, district: (w.districtAt && w.districtAt(sp.x, sp.y)) || 'downtown', showpiece: true });
  tower = { x: poi.x, y: poi.y, ob: best, poi };
}

/* ---------- tickets ---------- */
const hasTicket = () => !!(G.state.flags && G.state.flags.skydeck_pass) || st().ticketDay === G.now().day;
function buyTicket() {
  if (G.state.flags && G.state.flags.skydeck_pass) { toast('"A SkyDeck pass! Go right up — the lifts are behind the rope."', 'good'); return true; }
  if (hasTicket()) { toast('"Your ticket is good all day. Lifts are just there."', 'info'); return true; }
  if (G.money && !G.money.pay(TICKET, 'SkyDeck ticket', { category: 'fun', venue: 'skydeck' })) return false;
  st().ticketDay = G.now().day; G.emit('skydeck:ticket'); toast(`SkyDeck ticket (${fmt(TICKET)}): valid all day. Take either lift to level 52.`, 'good', 3600); return true;
}

/* ---------- the lift ride ---------- */
const DIG = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111' };
function digits(ctx, str, x, y, s, c) { ctx.fillStyle = c; for (const ch of str) { const d = DIG[ch]; if (d) for (let i = 0; i < 15; i++) if (d[i] === '1') ctx.fillRect(x + (i % 3) * s, y + Math.floor(i / 3) * s, s, s); x += 4 * s; } }
let riding = false;
function ride(up = true) {
  if (riding) return Promise.resolve(false);
  if (up && !hasTicket()) { toast('"Tickets first, please!" The desk is just over there — ' + fmt(TICKET) + ' for the whole day.', 'info', 3600); return Promise.resolve(false); }
  riding = true; G.modal++; G.emit('skydeck:ride', up);
  const CW = 240, CH = 150, wx = 22, wy = 16, ww = 196, wh = 92, mid = wy + 50, time = viewNow(), season = G.now().season || 0, DUR = 10;
  const cv = el('canvas', { width: CW, height: CH }); Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', objectFit: 'contain', background: '#0d0c14', imageRendering: 'pixelated', zIndex: 50, pointerEvents: 'auto' }); cv.className = 'sky-lift'; root().append(cv);
  const ctx = cv.getContext('2d'), far = document.createElement('canvas'); far.width = ww; far.height = PANO_H; panoCanvas(far.getContext('2d'), { u0: 236, w: ww, time, season, frame: 4 });
  const night = time === 'night', TW = [[0, 30, 22, '#4a5a78'], [28, 26, 38, '#3d6a80'], [52, 34, 14, '#5a5068'], [84, 28, 46, '#2f5a70'], [110, 30, 27, '#66788c'], [138, 24, 41, '#4a5a78'], [160, 36, 18, '#70687c']];
  let sprite = null; try { sprite = G.player.sprite(); } catch (e) { }
  return new Promise(res => {
    let t0 = performance.now(), done = false;
    const finish = async () => { if (done) return; done = true; G.modal = Math.max(0, G.modal - 1); try { await G.go(up ? 'int:skydeck' : 'int:skydeck_lobby', up ? {} : { x: 4.2, y: 2.2 }); } catch (e) { console.warn(e); } cv.remove(); riding = false; if (!up) toast('Ground floor. Your ears pop back.', 'info'); res(true); };
    cv.onclick = () => { if (performance.now() - t0 > 900) t0 = performance.now() - DUR * 1000; };
    const frame = () => {
      if (done) return; const k = Math.min(1, (performance.now() - t0) / (DUR * 1000)), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, fl = up ? 1 + 51 * e : 52 - 51 * e, sh = k < .06 || k > .94 ? Math.round(Math.sin(k * 400)) : 0;
      ctx.fillStyle = '#3a2f2a'; ctx.fillRect(0, 0, CW, CH); ctx.fillStyle = '#5a4638'; for (let x = 0; x < CW; x += 12) ctx.fillRect(x, 0, 11, CH);
      ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
      ctx.drawImage(far, wx, mid - (PANO_H - HZ) + sh - Math.round((52 - fl) * .5));
      ctx.fillStyle = night ? '#141a36' : time === 'dusk' ? '#4a3a52' : '#6a7f8c'; ctx.fillRect(wx, mid + HZ - Math.round((52 - fl) * .5) + sh, ww, wh);
      for (const [x, w, h, c] of TW) { const top = Math.round(mid + (fl - h) * 3.2) + sh; ctx.fillStyle = night ? '#1c2440' : c; ctx.fillRect(wx + x, top, w, 400); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(wx + x + w - 4, top, 4, 400); ctx.fillStyle = night ? '#2a3458' : '#dfe8ee'; ctx.fillRect(wx + x, top, w, 2);
        for (let r = 0; r < h; r++) { const y = top + 5 + r * 6; if (y < wy - 4 || y > wy + wh) continue; for (let i = 3; i < w - 6; i += 5) { const on = ((r * 7 + i * 3 + h) % 5) < (night ? 3 : 1); ctx.fillStyle = on && time !== 'day' ? '#ffd98a' : night ? '#101830' : '#9fd0e8'; ctx.fillRect(wx + x + i, y, 3, 3); } } }
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(wx + 30, wy); ctx.lineTo(wx + 52, wy); ctx.lineTo(wx + 18, wy + wh); ctx.lineTo(wx, wy + wh); ctx.lineTo(wx, wy + 60); ctx.fill();
      ctx.fillStyle = '#2a2733'; for (const x of [wx - 3, wx + 64, wx + 130, wx + ww]) ctx.fillRect(x, wy - 3, 3, wh + 6); ctx.fillRect(wx - 3, wy - 3, ww + 6, 3); ctx.fillRect(wx - 3, wy + wh, ww + 6, 3); ctx.fillStyle = '#e8c06a'; ctx.fillRect(wx - 3, wy + wh - 22, ww + 6, 2);
      ctx.fillStyle = '#4a3a30'; ctx.fillRect(0, wy + wh + 3, CW, 8); ctx.fillStyle = '#8a6a4c'; ctx.fillRect(0, wy + wh + 11, CW, CH); ctx.fillStyle = '#7a5a40'; for (let x = -20; x < CW; x += 24) ctx.fillRect(x + 12, wy + wh + 11, 12, CH);
      if (sprite && sprite.c) { ctx.imageSmoothingEnabled = false; const sw = sprite.c.width * 2, shh = sprite.c.height * 2; ctx.drawImage(sprite.c, Math.round(CW / 2 - sw / 2), CH - 6 - shh + sh, sw, shh); }
      ctx.fillStyle = '#1b1a24'; ctx.fillRect(CW / 2 - 22, 1, 44, 13); const f = String(Math.round(fl)); digits(ctx, f, CW / 2 - f.length * 4 + (f.length > 1 ? 0 : 0) - 4, 3, 2, '#ffb050'); ctx.fillStyle = '#7df0a0'; const ax = CW / 2 + 12; for (let i = 0; i < 4; i++) ctx.fillRect(ax + i, up ? 9 - i : 4 + i, 7 - i * 2, 1);
      if (k >= 1) finish(); else requestAnimationFrame(frame);
    };
    frame(); setTimeout(() => { if (!done && performance.now() - t0 >= DUR * 1000) finish(); }, DUR * 1000 + 400);
  });
}

/* ---------- telescopes ---------- */
function scope(district) {
  const cu = SPOTS[district]; if (cu === undefined || G.modal) return false;
  if (G.money && !G.money.pay(.25, 'Telescope', { category: 'fun', venue: 'skydeck' })) return false;
  const s = 3, bw = 120, bh = 44, v0 = 4, VW = 180, VH = 120, time = viewNow(), off = document.createElement('canvas'); off.width = bw * s; off.height = bh * s;
  panoCanvas(off.getContext('2d'), { u0: Math.max(0, Math.min(608 - bw, cu - bw / 2)), w: bw, v0, h: bh, s, time, season: G.now().season || 0, frame: 6 });
  const found = [], dOf = p => p.district || (built && built.districtAt ? built.districtAt(p.x, p.y) : null);
  if (G.places) { const c = G.places.list().filter(p => p.name && /landmark|spot|venue|stall/.test(p.kind) && !G.places.known(p.id) && dOf(p) === district).sort((a, b) => (/landmark|spot/.test(b.kind) ? 1 : 0) - (/landmark|spot/.test(a.kind) ? 1 : 0)); for (const p of c) { if (found.length >= 4) break; if (found.some(q => q.name === p.name)) continue; G.places.discover(p.id, true); found.push(p); } }
  const m = modal({ title: 'Telescope — ' + DNAME[district], cls: 'sky-scope', onClose: () => { live = false; } }); let live = true;
  const cv = el('canvas', { width: VW, height: VH }); Object.assign(cv.style, { width: '100%', maxWidth: '540px', display: 'block', margin: '0 auto', imageRendering: 'pixelated', background: '#000' });
  m.body.append(cv, el('p', { text: DTEXT[district], style: { margin: '8px 0 4px' } }), el('p', { text: found.length ? 'Marked on your map: ' + found.map(p => p.name).join(', ') + '.' : 'Nothing down there you do not already know.', style: { margin: '0 0 8px', opacity: .8 } }), el('button.go', { onclick: () => m.close() }, 'Step back'));
  const ctx = cv.getContext('2d'), t0 = performance.now(), mx = off.width - VW, my = off.height - VH;
  const draw = () => { if (!live || !cv.isConnected) return; const t = (performance.now() - t0) / 1000, px = Math.round(mx / 2 + Math.sin(t * .35) * mx / 2), py = Math.round(my / 2 + Math.sin(t * .23 + 1) * my / 2);
    ctx.drawImage(off, -px, -py); ctx.fillStyle = '#05050a'; const cx = VW / 2, cy = VH / 2, r = 58; for (let y = 0; y < VH; y++) { const dy = y + .5 - cy, hw = Math.abs(dy) < r ? Math.sqrt(r * r - dy * dy) * 1.45 : 0; ctx.fillRect(0, y, Math.max(0, Math.round(cx - hw)), 1); ctx.fillRect(Math.round(cx + hw), y, VW, 1); }
    ctx.fillStyle = 'rgba(20,20,30,.55)'; ctx.fillRect(cx - 6, cy, 4, 1); ctx.fillRect(cx + 3, cy, 4, 1); ctx.fillRect(cx, cy - 6, 1, 4); ctx.fillRect(cx, cy + 3, 1, 4); requestAnimationFrame(draw); };
  draw(); G.emit('skydeck:scope', district, found.map(p => p.id)); try { G.needs.add('fun', 5); } catch (e) { } return true;
}

/* ---------- photo spot ---------- */
function photo() {
  const S = st(), n = G.now(), view = viewNow(), text = { day: 'Blue sky, the whole bay behind you.', dusk: 'Golden hour over the bay. Everybody looks good in this light.', night: 'A thousand lit windows and one slightly blurry you.' }[view];
  const fl = el('div'); Object.assign(fl.style, { position: 'fixed', inset: '0', background: '#fff', zIndex: 60, opacity: '.95', transition: 'opacity .5s', pointerEvents: 'none' }); root().append(fl); requestAnimationFrame(() => requestAnimationFrame(() => { fl.style.opacity = '0'; })); setTimeout(() => fl.remove(), 700);
  const entry = { day: n.day, clock: n.clock, view, text: `SkyDeck, day ${n.day + 1}, ${n.clock}. ${text}` }; S.photos.push(entry); if (S.photos.length > 30) S.photos.shift();
  try { G.needs.add('fun', 6); G.player.pose = 'wave'; setTimeout(() => { if (G.player.pose === 'wave') G.player.pose = null; }, 1400); } catch (e) { }
  G.emit('skydeck:photo', entry); toast('Click! Photo saved to your keepsakes: ' + text, 'good', 3800); return entry;
}
function arrived() { const S = st(), first = !S.visits.skydeck; S.visits.skydeck = (S.visits.skydeck || 0) + 1; if (G.places) G.places.discover('skydeck', true); G.emit('skydeck:visit', first); if (first) toast({ day: 'Level 52. All of Maple Bay, edge to edge.', dusk: 'Level 52 — and the whole sky is on fire. Good timing.', night: 'Level 52. The city is a spilled jar of lights.' }[viewNow()], 'good', 4200); }

/* the Galleria's shops as places (G.places.get('mall:<key>'), G.places.inner()): they stand at the mall's street door with room 'deptstore', so the Map, the
   route card and the guide arrow lead to the door and then to the counter inside. They are not in G.places.list() (no pins piled on the door, no proximity toasts);
   known() follows the Galleria's own discovery. */
const isMall = id => typeof id === 'string' && /^mall:/.test(id);
let mallCache = null;
function mallPlaces(get) {
  if (mallCache) return mallCache; const door = get('deptstore'); if (!door) return [];
  const seen = new Set(), mallOpen = () => { const h = G.now().hf; return h >= MALL_HOURS[0] && h < MALL_HOURS[1]; };
  mallCache = MALL_SHOPS.concat(FOOD_COURT).map(q => q.venueId).concat(['mall:pretzel']).filter(id => id && VENUE_BY_ID[id] && !seen.has(id) && seen.add(id)).map(id => { const v = VENUE_BY_ID[id];
    return { id, name: v.name, kind: 'venue', x: door.x, y: door.y, district: door.district, districtName: door.districtName, poi: door.poi, venue: v, type: v.type, roomId: 'deptstore', room: 'deptstore', inside: 'deptstore', open: mallOpen }; });
  return mallCache;
}
const mallPlace = (id, get) => isMall(id) ? mallPlaces(get).find(p => p.id === id) || null : null;

function mallShops() {
  const def = ROOMS.get('deptstore'), out = []; if (!def) return out;
  for (const it of def.items) if (it.venue && /mall\.counter/.test(it.id)) out.push({ id: it.shop, name: (VENUE_BY_ID[it.venue] || {}).name, venueId: it.venue, x: it.x + 1 + (it.flip ? 1.15 : 1), y: it.y + 1 + (it.flip ? 1 : 1.15) });
  return out;
}

export function init() {
  S = G.defineState('showpieces', () => ({ photos: [], ticketDay: -1, visits: {}, arcade: {} })); G.on('load', () => { st(); });
  const mallOpen = () => { const h = G.now().hf; return h >= MALL_HOURS[0] && h < MALL_HOURS[1]; };
  G.showpieces = { skydeck: { viewNow, ride, hasTicket, buyTicket, scope, photo, arrived, tower: () => tower }, mall: { shops: mallShops, isOpen: mallOpen, list: () => MALL_SHOPS.concat(FOOD_COURT) }, photos: () => st().photos.slice() };
  // the tower door must exist before a save made inside the tower exits to a city that was never built this session
  G.on('room:build', sc => { if (sc && sc.def && sc.def.showpiece && !built) { try { ensure(getCity()); } catch (e) { console.warn('showpieces', e); } } });
  G.on('scene', s => {
    if (G.places && !G.places._skyAlias) { const g = G.places.get; G.places.get = id => g(id === 'skydeck' || id === 'door:skydeck' ? 'skydeck_lobby' : id) || mallPlace(id, g); const k = G.places.known; G.places.known = id => k(id === 'skydeck' ? 'skydeck_lobby' : isMall(id) ? 'deptstore' : id); G.places._skyAlias = true;
      G.places.inner = () => mallPlaces(g); G.on('places:built', () => { mallCache = null; }); }
    // the guide arrow (ui/navarrow.js) follows interactables with `navTo`: the SkyDeck lifts are the way between the deck and the lobby (no doormat up there)
    if (s && (s.id === 'int:skydeck' || s.id === 'int:skydeck_lobby')) for (const it of s.interactables || []) { if (/^Lift down/i.test(it.label || '')) it.navTo = 'int:skydeck_lobby'; else if (/^Lift to the SkyDeck/i.test(it.label || '')) it.navTo = 'int:skydeck'; }
    if (!s || s.id !== 'city' || s._showpieces || !s.world) return; s._showpieces = true; ensure(s.world);
    for (const it of s.interactables) if (it.poi && it.poi.name === GALLERIA) it.label = GALLERIA;
    const p = s.world.pois.find(q => q.id === 'door:skydeck_lobby'); if (p && !tower) tower = { x: p.x, y: p.y, poi: p, ob: null };
    if (p && !s.interactables.some(it => it.poi === p)) s.interactables.push({ x: p.x, y: p.y, label: TOWER, h: 1.2, range: 1.3, poi: p, use: () => enterRoom('skydeck_lobby', p.id) });
  });
}
