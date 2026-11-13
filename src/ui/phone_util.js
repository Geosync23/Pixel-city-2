// Shared helpers for the phone apps (src/ui/phone*.js). No init; imported by the shell and every app.
import { G } from '../core/game.js';
import { el } from './kit.js';
import { iconEl, iconCanvas, hasIcon, weatherIcon } from './_icons.js';
import { timeInfo, DAY, WEEKDAYS, SEASONS } from '../core/clock.js';
import { VENUE_BY_ID, DISTRICTS, isOpen as venueOpen } from '../data/venues.js';
import { FARES } from '../data/economy.js';
import { CAST_BY_ID } from '../story/cast.js';
import { charArt } from '../core/char.js';
import { render } from '../engine/raster.js';
import { toSprite } from '../engine/sprites.js';

export { el, iconEl, iconCanvas, hasIcon, weatherIcon, DAY, WEEKDAYS, SEASONS, timeInfo };

/* ---------- formatting ---------- */
export const money = n => (G.money && G.money.fmt ? G.money.fmt(n) : (n < 0 ? '-$' : '$') + (Math.abs(n) % 1 ? Math.abs(n).toFixed(2) : Math.abs(n)));
export const balance = () => (G.money && G.money.get ? G.money.get() : (G.state.player && G.state.player.money) || 0);
export const hhmm = h => { const m = Math.round(((h % 24) + 24) % 24 * 60); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
export const clockOf = t => timeInfo(t).clock;
export const dayOf = t => Math.floor(t / DAY);
/** "Today 18:30" / "Tomorrow 09:00" / "Wed 18:30" / "Wed 3 Summer 18:30" */
export function when(t, now = G.state.t) {
  const i = timeInfo(t), d = i.day - dayOf(now);
  const day = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : d === -1 ? 'Yesterday' : d > 1 && d < 7 ? i.weekdayName : `${i.weekdayName} ${i.dayOfMonth} ${i.seasonName}`;
  return day + ' ' + i.clock;
}
export const dur = m => (m >= 60 ? (m % 60 ? `${Math.floor(m / 60)} h ${Math.round(m % 60)} min` : `${m / 60} h`) : `${Math.round(m)} min`);
export const cap = s => String(s || '').replace(/^./, c => c.toUpperCase());
export const fill = (s, extra) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => (extra && extra[k] !== undefined ? extra[k] : k === 'name' ? (G.state.player && G.state.player.name) || 'you' : m));
export const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };

/* ---------- small UI builders ---------- */
export const section = (title, right) => el('div.ph-sec', null, el('span', { text: title }), right || null);
export const card = (...kids) => el('div.ph-card', null, ...kids);
export const btn = (label, onclick, cls = '', icon) => el('button.ph-btn' + (cls ? '.' + cls.split(' ').join('.') : ''), { onclick }, icon ? iconEl(icon, 1) : null, el('span', { text: label }));
/** list row: icon/element, title, subtitle, right element/text, onclick */
export function row(o) {
  const ic = typeof o.icon === 'string' ? iconEl(o.icon, o.iconScale || 2, o.cat) : o.icon;
  return el((o.onclick ? 'button' : 'div') + '.ph-row' + (o.cls ? '.' + o.cls : ''), { onclick: o.onclick, disabled: o.disabled },
    ic || null, el('span.ph-row-m', null, el('b', { text: o.title || '' }), o.sub ? el('small', { text: o.sub }) : null),
    o.right !== undefined && o.right !== null ? (o.right.nodeType ? o.right : el('span.ph-row-r' + (o.rightCls ? '.' + o.rightCls : ''), { text: o.right })) : null);
}
/** friendly empty / not-available-yet state */
export const empty = (icon, title, text, action) => el('div.ph-empty', null, icon ? iconEl(icon, 3) : null, el('b', { text: title }), text ? el('p', { text }) : null, action || null);
/** segmented meter 0..max */
export function bar(v, max = 100, color = 'var(--good)', label) {
  const p = Math.max(0, Math.min(1, max ? v / max : 0));
  return el('div.ph-bar', { role: 'img', 'aria-label': label || Math.round(p * 100) + '%' }, el('i', { style: { width: (p * 100).toFixed(1) + '%', background: color } }));
}
export function tabs(list, cur, pick) {
  return el('div.ph-tabs', { role: 'tablist' }, list.map(t => el('button' + (t.id === cur ? '.on' : ''), { role: 'tab', 'aria-selected': t.id === cur ? 'true' : 'false', onclick: () => pick(t.id) }, el('span', { text: t.name }), t.badge ? el('em', { text: t.badge }) : null)));
}
export const chip = (text, cls = '', onclick) => el((onclick ? 'button' : 'span') + '.ph-chip' + (cls ? '.' + cls : ''), { onclick }, text);
export const kv = (k, v, cls) => el('div.ph-kv' + (cls ? '.' + cls : ''), null, el('span', { text: k }), el('b', { text: v }));

/* ---------- app icons (art from icons.js on a coloured tile; 'app.<id>' art wins when it exists) ---------- */
const APP_ART = { messages: ['ui.speech', '#3fae5a'], planner: ['ui.calendar', '#f3ead2'], map: ['ui.pin', '#8fd3c8'], taxi: ['transport.taxi', '#3a3644'], bank: ['ui.coin', '#2f7f6b'], jobs: [null, '#e9b872'],
  wellness: ['ui.heart', '#ffd0dc'], delivery: ['ui.bag', '#f08a2c'], settings: ['ui.settings', '#7b8496'], notifications: ['ui.exclamation', '#3b5bdb'] };
const CASE = ['....####....', '...#....#...', '.##########.', '#bbbbbbbbbb#', '#bbbbbbbbbb#', '#dddd##dddd#', '#bbbbyybbbb#', '#bbbbbbbbbb#', '.##########.'];
function caseCanvas() { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'), m = { '#': '#2a2733', b: '#9a6236', d: '#6b3f2a', y: '#f2c230' }; CASE.forEach((r, j) => [...r].forEach((ch, i) => { if (m[ch]) { g.fillStyle = m[ch]; g.fillRect(i + 2, j + 4, 1, 1); } })); return c; }
/** app icon tile. size in css px (multiple of 16 looks best) */
export function appIcon(id, size = 48, def) {
  const art = APP_ART[id] || [def && def.iconId, (def && def.color) || '#c9c2d8'], k = Math.max(1, Math.round(size / 24));
  const tile = el('span.ph-ico', { style: { width: size + 'px', height: size + 'px', background: art[1] } });
  let c; if (hasIcon('app.' + id)) c = iconEl('app.' + id, k); else if (art[0]) c = iconEl(art[0], k);
  else { const s = caseCanvas(); s.className = 'pix'; s.style.width = s.style.height = 16 * k + 'px'; c = s; }
  tile.append(c); return tile;
}

/* ---------- people ---------- */
export const npcInfo = id => safe(() => G.social.npc(id), null) || CAST_BY_ID[id] || null;
export const npcName = id => { const n = npcInfo(id); return (n && (n.short || n.name)) || cap(id); };
const pcache = new Map();
/** small square portrait: the NPC's head rendered from their character spec when the social system has one, else initials. */
export function portrait(id, size = 40, name) {
  const info = CAST_BY_ID[id], spec = safe(() => G.social.npc(id).spec, null) || (id === '@me' ? G.state.player.spec : null);
  const col = (info && info.spec && info.spec.topColor) || ['#3b5bdb', '#e05a3a', '#2f9e44', '#8a5cc2', '#f08a2c', '#2fa3a0'][[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % 6];
  const box = el('span.ph-face', { style: { width: size + 'px', height: size + 'px', background: col } });
  if (spec) {
    try {
      let src = pcache.get(id); const A = charArt();
      if (!src || src.spec !== spec) { const r = toSprite(render(A.CHAR_SB, () => A.drawChar(spec, { anim: 'stand', frame: 0, dir: 1 }), null, 0)); src = { spec, c: r.c, ox: -A.CHAR_SB[0], oy: -A.CHAR_SB[1] }; pcache.set(id, src); }
      const c = document.createElement('canvas'); c.width = c.height = 16; c.className = 'pix'; c.style.width = c.style.height = '100%';
      c.getContext('2d').drawImage(src.c, src.ox - 8, src.oy - 26, 16, 16, 0, 0, 16, 16); box.style.background = '#cfe9f4'; box.append(c); return box;
    } catch (e) { /* fall through to initials */ }
  }
  const nm = name || npcName(id); box.append(el('b', { text: nm.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(), style: { fontSize: Math.round(size * .42) + 'px' } })); return box;
}

/* ---------- places ---------- */
export const DISTRICT_NAME = Object.fromEntries(DISTRICTS.map(d => [d.id, d.name]));
const useful = p => p && p.id && !String(p.id).startsWith('lm:') && p.name;
export const allPlaces = () => safe(() => G.places.list().filter(useful), []);
export const isKnown = id => safe(() => G.places.known(id), true);
export const place = id => safe(() => G.places.get(id), null);
export const placeName = id => { const p = place(id); return (p && p.name) || (VENUE_BY_ID[id] && VENUE_BY_ID[id].name) || (id ? cap(String(id).replace(/^(home:|st_|poi_)/, '').replace(/_/g, ' ')) : ''); };
/** destinations worth offering (taxi, appointments): known venues/homes/stations/airport/landmarks with a name */
export function destinations() {
  const seen = new Set(), out = [];
  for (const p of allPlaces()) { if (seen.has(p.id) || !isKnown(p.id)) continue; if (['busstop', 'taxistand', 'spot'].includes(p.kind)) continue; seen.add(p.id); out.push(p); }
  return out;
}
/** map/legend category of a place */
export function placeCat(p) {
  if (p.kind === 'home') return 'homes'; if (p.kind === 'station' || p.kind === 'airport' || p.kind === 'busstop' || p.kind === 'taxistand') return 'transit';
  const t = p.type || (p.venue && p.venue.type);
  if (t === 'food') return 'food'; if (t === 'shop') return 'shops'; if (t === 'stall') return p.venue && p.venue.offers && p.venue.offers.menu ? 'food' : 'shops'; if (t === 'leisure') return 'fun'; if (t === 'transit') return 'transit'; if (t === 'service' || t === 'workplace') return 'services';
  return 'sights';
}
export const CATS = [
  { id: 'food', name: 'Food', color: '#e05a3a' }, { id: 'shops', name: 'Shops', color: '#3b5bdb' }, { id: 'fun', name: 'Fun', color: '#8a5cc2' }, { id: 'services', name: 'Services', color: '#2fa3a0' },
  { id: 'homes', name: 'Homes', color: '#f08a2c' }, { id: 'transit', name: 'Transit', color: '#3a3644' }, { id: 'sights', name: 'Sights', color: '#2f9e44' },
];
export const CAT_BY_ID = Object.fromEntries(CATS.map(c => [c.id, c]));
/** {open: bool|null, text} for a place right now */
export function openState(p, t = G.state.t) {
  const v = p && (p.venue || VENUE_BY_ID[p.id] || VENUE_BY_ID[p.roomId]); if (!v || !v.hours) return { open: null, text: '' };
  const i = timeInfo(t), o = venueOpen(v, i.weekday, i.hf), h = v.hours[i.weekday];
  const hours = h ? (h[0] === 0 && h[1] >= 24 ? 'Open 24 hours' : `${hhmm(h[0])} - ${hhmm(h[1])}`) : 'Closed today';
  return { open: o, hours, text: (o ? 'OPEN' : 'CLOSED') + ' · ' + hours };
}
/** the player's position in city coordinates (remembered while indoors) */
export function cityPos() {
  if (G.scene && G.scene.id === 'city' && G.player) return { x: G.player.x, y: G.player.y };
  const room = G.scene ? String(G.scene.id).replace(/^int:/, '') : '', p = place(room) || (G.state.home && place('home:' + G.state.home.id) && /^home/.test(room) ? place('home:' + G.state.home.id) : null);
  if (p) return { x: p.x, y: p.y };
  const s = G.state.phone && G.state.phone.cityPos; return s || { x: G.state.player.x || 0, y: G.state.player.y || 0 };
}
export const distTo = p => { const c = cityPos(); return Math.abs(p.x - c.x) + Math.abs(p.y - c.y); };
/** taxi fare estimate (economy.js FARES.taxi); uses G.transit.fare(placeId) when the transit system offers one */
export function taxiFare(p, t = G.state.t) {
  const f = safe(() => G.transit.fare(p.id), null); if (typeof f === 'number') return f;
  const T = FARES.taxi, c = cityPos(), air = place('airport'), nearAir = air && Math.abs(c.x - air.x) + Math.abs(c.y - air.y) < 40;
  if (p.kind === 'airport' || p.id === 'airport' || p.district === 'airport' || nearAir) return T.airportFlat;
  let fare = T.base + T.perUnit * distTo(p); const h = timeInfo(t).hour; if (h >= T.nightHours[0] || h < T.nightHours[1]) fare *= T.nightMult;
  return Math.round(Math.max(T.minFare, Math.min(T.maxFare, fare)));
}
export const homePlace = () => (G.state.home && G.state.home.id ? place('home:' + G.state.home.id) : null);
export const weatherNow = () => safe(() => G.weather.current(), null);
export const isNight = () => { const h = timeInfo(G.state.t).hour; return h >= 20 || h < 6; };
