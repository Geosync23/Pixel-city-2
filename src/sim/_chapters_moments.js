// Family moments (helper of sim/chapters.js): the nine small optional beats of FAMILY_MOMENTS in src/story/chapters.js, between Chapters.
//
// WHAT THE PLAYER SEES: on a festival day, a Sunday evening at Nora's, a Saturday afternoon at the bakery, or the first week of a season (Dad), some of the
//   family are simply THERE, standing in the real place. Walk near: a small gold strip offers "Join them" / "Not today". A few lines play in the Chapter
//   dialogue sheet, perhaps a keepsake, and that is all. Nothing is announced on a timer, nothing expires with a penalty, nothing is ever "missed":
//   a festival moment that was not joined is offered again at the same festival next year; the standing ones come round every week.
// RULES: only between Chapters (never while one is being played), at most ONE moment a day, each needs its Chapter (`needs`) to be finished.
//   Festival moments (`when: 'festival:<id>'`) play once ever. The standing ones (`weekly:*`, `season_start`) come back: Sunday dinner really feeds you,
//   the Kettle Corner is tea and company, Dad is in the chair for the first week of each season after Chapter 15. Their keepsakes / recipes are given once.
//   While a festival moment is open that day, one quiet Opportunity row says who is there (id `fam:<id>`); it is removed, unremarked, when the day is over.
//
// STATE  G.state.chapters.moments = { seen: { id: key }, n: { id: times played }, day: last day one was played, no: { id: day it was declined } }
// API    init(hooks) with hooks = { st(), test(cond), fill(text), give(step), say(line step) -> 'next' | 'out', done(chId), active() }
//        tick() once a second from the chapters system.      playing() -> bool      list() -> [{ id, title, due, seen }]
//        debug: { due(), stage(id) (set the moment up where the player stands, whatever the day), play(id), reset() }
import { G } from '../core/game.js';
import { FAMILY_MOMENTS } from '../story/chapters.js';
import { UI } from '../ui/chapters_ui.js';
import { GT } from '../engine/world.js';
import { WS } from '../engine/raster.js';
import { resolve, here, freeNear, cityWorld } from './_chapters_places.js';
import { who, comp } from './_chapters_cast.js';

const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const DAY = 1440, WD = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
/* how long a standing moment lasts (minutes) and what joining it does for you */
const STANDING = { fm_sunday: { dur: 180, meal: 1, go: 'Sit down with them' }, fm_kettle_corner: { dur: 120, tea: 1, go: 'Pull up a chair' }, fm_dad_visit: { go: 'Sit with Dad' } };
/* where the family stands at each festival (city coordinates, off the roadway; the engine nudges to the nearest free paving) */
const STAND = { fm_blossom: [172.5, 147], fm_harbor: [96.5, 336], fm_fair: [171.5, 246], fm_harvest: [105.5, 253.5], fm_lantern: [97.5, 286], fm_winter: [218, 227] };
const EVENT_NAME = { blossom_parade: 'the Blossom Parade', harbor_day: 'Harbor Day', river_fair: 'the Summer Fair', harvest_parade: 'the Harvest Festival', lantern_parade: 'Lantern Night', winter_parade: 'the Winter Lights Parade' };
let H = null, cur = null, busy = false, lastKey = '';
const S = () => { const s = H.st(); if (!s.moments) s.moments = { seen: {}, n: {}, day: -1, no: {} }; for (const k of ['seen', 'n', 'no']) if (!s.moments[k]) s.moments[k] = {}; return s.moments; };
const today = () => Math.floor(G.state.t / DAY);
const names = m => { const l = m.who.map(w => who(w).short || w); return l.length > 1 ? l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1] : l[0] || ''; };

/** the key of the period this moment is on for right now (a day, a season, 'once'), or null when it is not on */
function due(m) {
  if (!H.done(m.needs)) return null;
  const t = G.state.t, d = today(), tod = t % DAY, [kind, a, b, c] = String(m.when).split(':');
  if (kind === 'festival') { const e = safe(() => G.cityEvents.current(), null); return e && e.ev.id === a && e.level >= 3 ? 'once' : null; }
  if (kind === 'weekly') { const from = (+b) * 60 + (+c || 0), dur = (STANDING[m.id] || {}).dur || 120; return WD[d % 7] === a && tod >= from && tod <= from + dur ? 'd' + d : null; }
  if (kind === 'season_start') { const se = Math.floor(d / 14), dos = d % 14, d15 = safe(() => H.st().done.ch15.day, null); if (dos > 6) return null; if (d15 !== null && Math.floor((d15 - 1) / 14) >= se && !S().seen[m.id]) return null; return 's' + se; }
  return null;
}
const open = m => { const k = due(m), s = S(); return !!k && s.seen[m.id] !== k && s.no[m.id] !== today() && (s.day !== today() || (cur && cur.m === m)); };

/** where the moment stands: { room } or { x, y } in the city */
function placeOf(m) {
  if (STAND[m.id]) { const w = cityWorld(), p = STAND[m.id]; let f = freeNear(w, p[0], p[1], 6);
    if (w && safe(() => w.tileType(f.x, f.y), null) === GT.asphalt) for (let r = 1; r < 9 && safe(() => w.tileType(f.x, f.y), null) === GT.asphalt; r++) for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283, x = Math.round((p[0] + Math.cos(a) * r) * 2) / 2, y = Math.round((p[1] + Math.sin(a) * r) * 2) / 2; if (!safe(() => w.isBlocked(x, y), true) && safe(() => w.tileType(x, y), null) !== GT.asphalt) { f = { x, y }; break; } }
    return { x: f.x, y: f.y, name: EVENT_NAME[String(m.when).split(':')[1]] || 'the festival' }; }
  const d = resolve(m.place); if (!d) return null; return d.room ? { room: d.room, name: d.name, d } : { x: d.x, y: d.y, name: d.name };
}
const near = (m, p, r) => (p.room ? G.scene.id === 'int:' + p.room : G.scene.id === 'city' && Math.hypot(G.player.x - p.x, G.player.y - p.y) < r);

/* ---------- the one quiet Opportunity row on a festival day / while Dad is in town ---------- */
function rows() {
  if (!G.goals) return;
  for (const m of FAMILY_MOMENTS) {
    const id = 'fam:' + m.id, g = safe(() => G.goals.get(id), null), fest = /^festival:/.test(m.when), dad = m.id === 'fm_dad_visit', on = (fest || dad) && open(m) && !H.active();
    if (on && !g) {
      const ev = String(m.when).split(':')[1];
      safe(() => G.goals.add({ id, group: 'opportunity', text: dad ? 'Dad is in town. He has found the chair.' : `${names(m)} ${m.who.length > 1 ? 'are' : 'is'} at ${EVENT_NAME[ev] || 'the festival'}`, hint: dad ? 'Drop in at home when you like.' : 'If you happen to be there. Nothing is lost if not.', placeId: fest ? 'cev:' + ev : undefined, doneText: m.title }));
    } else if (!on && g && !g.done) safe(() => G.goals.remove(id));
  }
}

/* ---------- staging: the family stands there ---------- */
function unstage() {
  if (!cur) return; if (cur.off) cur.off(); UI.chip(null); comp.clear(); comp.follow(true); cur = null; lastKey = '';
}
function stage(m, p, forced) {
  let at = p.room ? null : { x: p.x, y: p.y };
  if (p.room) {       /* by the table, if the room has one */
    const t = safe(() => G.navGoals.locate([{ tag: 'table' }, { label: /table|counter/i }, { tag: 'seat' }]), null);
    if (t) { const f = freeNear(G.world, t.x, t.y + 1, 3); at = { x: f.x, y: f.y }; }
  }
  const cast = m.who.concat(flatAll(m.lines).filter(l => l.do === 'say' && !m.who.includes(l.who) && !['narrator', 'player', 'nell'].includes(l.who)).map(l => l.who)).filter((w, i, a) => a.indexOf(w) === i);   /* everyone who speaks is there */
  comp.clear(); comp.follow(false); comp.set(cast, at ? { at } : {});
  const list = cast.map(w => comp.char(w)).filter(Boolean); if (!list.length) { comp.clear(); comp.follow(true); return false; }
  const cx = list.reduce((a, c) => a + c.x, 0) / list.length, cy = list.reduce((a, c) => a + c.y, 0) / list.length;
  for (const c of list) c.faceTo(G.player.x, G.player.y);
  const it = { x: cx, y: cy, label: names(m), h: 1.4, hit: 22, range: 2.6, scene: G.scene.id, use: () => play(m) };
  cur = { m, p, x: cx, y: cy, scene: G.scene.id, off: G.addInteractable(it), forced: !!forced };
  for (const w of m.who) safe(() => G.social.meet(w));
  return true;
}
function offer() {
  if (!cur || busy) return; const m = cur.m, d = Math.hypot(G.player.x - cur.x, G.player.y - cur.y), key = m.id + (d < 9 || cur.p.room ? ':near' : ':far');
  if (key === lastKey) return; lastKey = key;
  if (d < 9 || cur.p.room) UI.chip({ kicker: 'A family moment', text: `${m.title} · ${names(m)}`, go: { label: (STANDING[m.id] || {}).go || 'Join them', fn: () => play(m) },
    skip: { label: 'Not today', fn: () => { S().no[m.id] = today(); UI.chip(null); lastKey = m.id + ':no'; if (cur) { if (cur.off) cur.off(); cur.off = null; cur.declined = 1; } } } });
  else UI.chip(null);
}

const flatAll = (steps, out = []) => { for (const s of steps || []) { if (s.do === 'if') { flatAll(s.then, out); flatAll(s.else, out); } else out.push(s); } return out; };
/* ---------- playing it ---------- */
function flat(steps, out = []) {
  for (const s of steps || []) { if (s.do === 'if') flat(H.test(s.cond) ? s.then : s.else, out); else out.push(s); }
  return out;
}
async function play(m) {
  if (busy || H.active() || G.cutscene) return false; busy = true; UI.chip(null);
  const s = S(), first = !s.n[m.id], st = STANDING[m.id]; let out = false;
  try {
    if (!cur || cur.m !== m) { const p = placeOf(m) || { x: G.player.x, y: G.player.y }; if (!stage(m, near(m, p, 14) ? p : { x: G.player.x, y: G.player.y, room: G.scene.id !== 'city' ? G.scene.id.slice(4) : undefined }, true)) { busy = false; return false; } }
    if (cur.off) { cur.off(); cur.off = null; }
    if (G.busy) safe(() => G.endActivity(false));
    for (const l of flat(m.lines)) {
      if (l.do === 'give') { const had = l.type === 'recipe' ? !!(G.state.flags || {})['recipe:' + l.id] : l.type === 'item' ? H.st().keeps.includes(l.id) : false; if (!had) H.give(l); continue; }
      if (l.do !== 'say') continue;
      if ((await H.say(l)) === 'out') { out = true; break; }
    }
  } catch (e) { console.warn('family moment ' + m.id, e); }
  UI.close();
  if (!out) {
    s.seen[m.id] = due(m) || s.seen[m.id] || 'once'; s.n[m.id] = (s.n[m.id] || 0) + 1; s.day = today();
    for (const w of m.who) safe(() => G.social.addRel(w, first ? 2 : 1, { raw: true }));
    if (st && st.meal) { safe(() => G.needs.add('hunger', 46)); safe(() => G.needs.add('social', 14)); safe(() => G.needs.add('fun', 6)); UI.toastGold(first ? 'Sunday dinner. Second helpings enforced. Your seat is by Milo, every week.' : 'Sunday dinner. Your seat is by Milo.', 4200); }
    else if (st && st.tea) { safe(() => G.needs.add('hunger', 14)); safe(() => G.needs.add('social', 14)); safe(() => G.needs.add('comfort', 6)); UI.toastGold('Tea at the Kettle Corner. The cup has a copper rim.', 4200); }
    else safe(() => G.needs.add('social', 10));
    safe(() => G.goals.complete('fam:' + m.id)); G.emit('chapter:moment', m.id); safe(() => G.save());
  }
  busy = false; lastKey = m.id + ':done'; if (cur) cur.played = 1;       /* they stay where they stand until you leave */
  return !out;
}

export function tick() {
  if (!H || !G.scene || !G.player) return;
  if (H.active()) { if (cur && !busy) unstage(); return; }
  safe(rows);
  if (busy) return;
  if (cur) {
    const gone = G.scene.id !== cur.scene || (!cur.p.room && Math.hypot(G.player.x - cur.x, G.player.y - cur.y) > 26) || (!cur.played && !cur.forced && !due(cur.m));
    if (gone) { unstage(); return; }
    if (!cur.played && !cur.declined && !G.modal && !G.cutscene) offer();
    return;
  }
  if (G.modal || G.cutscene || G.busy || comp.ids().length) return;
  for (const m of FAMILY_MOMENTS) { if (!open(m)) continue; const p = placeOf(m); if (!p || !near(m, p, 16)) continue; if (stage(m, p)) { lastKey = ''; offer(); } break; }
}
/* a soft gold ring on the ground where they stand (the Chapter marker's ring without the bookmark): it picks the family out of a festival crowd */
function drawRing(ctx, cam) {
  if (!cur || busy || cur.played || cur.declined || !G.scene || G.scene.id !== cur.scene || G.cutscene) return;
  const z = safe(() => G.world.heightAt(cur.x, cur.y), 0), s = WS(cur.x, cur.y, z), t = performance.now() / 1000, X = Math.round(s[0] - cam.x), Y = Math.round(s[1] - cam.y);
  if (X < -40 || Y < -40 || X > G.W + 40 || Y > G.H + 40) return;
  for (const ph of [0, .5]) { const k = (t * .6 + ph) % 1, rx = 10 + k * 16, ry = rx / 2; ctx.globalAlpha = .8 * (1 - k); ctx.fillStyle = '#ffe9a6'; for (let a = 0; a < 44; a++) { const an = a / 44 * 6.283; ctx.fillRect(Math.round(X + Math.cos(an) * rx), Math.round(Y + Math.sin(an) * ry), 1, 1); } }
  ctx.globalAlpha = .9; ctx.fillStyle = '#f2c230'; for (let a = 0; a < 36; a++) { const an = a / 36 * 6.283; ctx.fillRect(Math.round(X + Math.cos(an) * 9), Math.round(Y + Math.sin(an) * 4.5), 1, 1); }
  ctx.globalAlpha = 1;
}
export const playing = () => busy;
export function init(hooks) {
  H = hooks;
  G.overlays.push(drawRing);
  G.on('scene', () => { if (cur && !busy) unstage(); });
  G.on('load', () => { cur = null; busy = false; lastKey = ''; });
}
export const list = () => FAMILY_MOMENTS.map(m => ({ id: m.id, title: m.title, when: m.when, needs: m.needs, due: due(m), open: open(m), seen: S().seen[m.id] || null, n: S().n[m.id] || 0 }));
export const debug = {
  due: () => FAMILY_MOMENTS.filter(open).map(m => m.id),
  /** set a moment up right where the player stands, whatever the calendar says (tests, the dev menu) */
  stage(id) { const m = FAMILY_MOMENTS.find(x => x.id === id); if (!m) return false; unstage(); const ok = stage(m, { x: G.player.x, y: G.player.y, room: G.scene.id !== 'city' ? G.scene.id.slice(4) : undefined }, true); if (ok) { lastKey = ''; offer(); } return ok; },
  play(id) { const m = FAMILY_MOMENTS.find(x => x.id === id); return m ? play(m) : false; },
  reset() { unstage(); H.st().moments = { seen: {}, n: {}, day: -1, no: {} }; return true; },
  where: id => { const m = FAMILY_MOMENTS.find(x => x.id === id); return m ? placeOf(m) : null; },
};
