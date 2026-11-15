// Relationship small bits (helper of sim/rel.js): the gentle daily stream of rel_small.js. Three kinds, all quiet:
//   TEXTS    through Messages (the phone's own banner rules apply), paced by _rel_base.js pumpTexts: at most 3 a day, 1 a person, 90 minutes apart,
//            never between 21:30 and 07:30. The day's budget is 2-4 small bits in total (2 on a work day with a Chapter open; halved by "Fewer messages").
//   WAVES    a line of their own in the proximity bubble the social system already shows when you pass somebody you know (add-only hook in sim/social.js):
//            never a notification, at most PACING.wavesPerDay a day and one a person.
//   DETAILS  a remembered detail (`mem:` written by one of your choices) said back as the second line of the next talk, once each, the day after at the earliest
//            (add-only hook in social.js converse()); also the note about a loved gift (PEOPLE[id].giftNotes).
// Bits are drawn from a no-repeat bag per person and kind; the most specific bit that fits (stage, then context) is preferred. Friendship never decays here;
// five days without a word only switches a person to their `gap` lines, which are kind.
import { G } from '../core/game.js';
import { bubble } from '../ui/kit.js';
import { FRIEND_STAGES } from '../story/_rel_kit.js';
import { st, safe, today, fill, fr, friendStage, stage, isRom, remembers, queueText, smallDay, textCap, castOf, SMALL, NEWS, PEOPLE, PACING, partner, pname, familyTexts, short, HOOK } from './_rel_base.js';
import { SMALL_ANY } from '../story/rel_small.js';

const REPEAT_DAYS = 14;
const ev = () => { const s = st().small; return s.ev || (s.ev = { worked: -9, promoted: -9, moved: -9, cooked: -9, chapter: -9, gift: {}, date: {}, scene: {} }); };
const lastTalk = id => safe(() => G.state.social.npcs[id].lastTalkDay, -1);
const known = id => safe(() => (G.social.known() || []).includes(id), false);
function ctxOk(c, id) {
  const n = G.now(), e = ev(), d = today(), w = String(safe(() => G.weather.current().kind, 'clear'));
  switch (c) {
    case 'any': return true; case 'morning': return n.hf < 11; case 'evening': return n.hf >= 18;
    case 'rain': return w === 'rain' || w === 'storm'; case 'snow': return w === 'snow'; case 'fog': return w === 'fog'; case 'sun': return w === 'clear' && n.season < 2;
    case 'worked': return e.worked === d; case 'promoted': return d - e.promoted <= 2; case 'moved': return d - e.moved <= 3; case 'cooked': return e.cooked === d - 1; case 'chapter': return e.chapter === d - 1;
    case 'festival': return safe(() => !!G.cityEvents && G.cityEvents.list().some(c => c.day === d), false);   /* QA10: only on a real big-event day, not any day with a small calendar event */
    case 'after_date': return e.date[id] === d - 1; case 'after_scene': return e.scene[id] === d - 1; case 'gift': return e.gift[id] && e.gift[id][1] === d - 1;
    case 'gap': { const l = lastTalk(id); return l >= 0 && d - l >= 5; }
    case 'birthday': { const b = (castOf(id) || {}).birthday; return !!b && b.season === ['spring', 'summer', 'autumn', 'winter'][n.season] && b.day === n.dayOfMonth; }
    case 'lowmood': return safe(() => G.needs.mood(), 70) < 40;
    default: return c.startsWith('mem:') ? remembers(id, c.slice(4)) : false;
  }
}
/* QA12: lines that name a time of day or a weekday are only said when that is true ("it's tuesday" came on a Wednesday; "coming Sunday" on the Sunday; "tonight" at breakfast) */
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
function timeOk(text) {
  const t = String(text || '').toLowerCase(), n = G.now(), wd = n.weekday, h = n.hf; let m;
  if (/\btonight\b/.test(t) && h < 15) return false;
  if (/\bthis morning\b/.test(t) && h >= 14) return false;
  if ((m = /\bit is (\w+day) tomorrow\b/.exec(t)) && DAYS.indexOf(m[1]) !== (wd + 1) % 7) return false;
  if ((m = /\b(\w+day) is in three days\b/.exec(t)) && DAYS.indexOf(m[1]) !== (wd + 3) % 7) return false;
  if ((m = /\b(?:coming|this|next|free|see you|on) (\w+day)\b/.exec(t)) && DAYS.indexOf(m[1]) === wd) return false;
  if ((m = /\bit'?s (\w+day)\b/.exec(t)) && DAYS.includes(m[1]) && DAYS.indexOf(m[1]) !== wd) return false;
  return true;
}
/** the best unused bit of a kind for this person now, or null. Marks it used. */
function draw(id, kind, peek) {
  const pool = (SMALL[id] && SMALL[id][kind]) || (fr(id) >= 40 ? SMALL_ANY[kind] : null); if (!pool || !pool.length) return null;
  const s = st().small, key = id + ':' + kind, used = s.bag[key] || (s.bag[key] = []), fsi = FRIEND_STAGES.indexOf(friendStage(id)), rs = stage(id);
  const score = (b, i) => { if (!ctxOk(b.ctx, id) || !timeOk(b.text)) return -1; let v = 0; const fi = FRIEND_STAGES.indexOf(b.stage);
    if (fi >= 0) { if (fi > fsi) return -1; v = fi; if (rs !== 'none' && isRom(id)) v -= 3; } else { if (b.stage !== rs) return -1; v = 10; }
    if (b.ctx !== 'any') v += b.ctx === 'gap' || b.ctx === 'birthday' ? 9 : 5; return v + ((i * 7 + today()) % 5) / 10; };
  /* QA11: a line said to the player is not said again for REPEAT_DAYS, even after the bag empties (Theo's "I've made a thing" came twice in three days) */
  const rec = (s.rec || (s.rec = {}))[key] || (s.rec[key] = {}), fresh = i => rec[i] === undefined || today() - rec[i] >= REPEAT_DAYS;
  let best = -1, bv = -1; pool.forEach((b, i) => { if (used.includes(i) || !fresh(i)) return; const v = score(b, i); if (v > bv) { bv = v; best = i; } });
  if (best < 0 && used.length) { s.bag[key] = []; if (!peek) return draw(id, kind, true) ? draw(id, kind) : null; return pool.some((b, i) => fresh(i) && score(b, i) >= 0) ? pool[0] : null; }
  if (best < 0) return null; if (!peek) { used.push(best); rec[best] = today(); } return pool[best];
}
const budget = () => { const d = today(), work = ev().worked === d || !!safe(() => G.jobs.current().nextShift !== null && Math.floor(G.jobs.current().nextShift / 1440) === d, false), ch = !!safe(() => G.chapters.current(), null);
  let n = work && ch ? PACING.smallPerDay[0] : PACING.smallPerDay[0] + (d * 13 % (PACING.smallPerDay[1] - PACING.smallPerDay[0] + 1)); if (d < 5) n = 1; if (st().chDay === d) n = 1; if (st().fewer) n = Math.max(1, Math.round(n / 2)); return n; };
/** once an hour: perhaps one text from somebody, inside the day's budget */
export function hourly(force) {
  const n = G.now(), sm = smallDay(), s = st(); if (!force && (n.hf < 8 || n.hf > 21 || sm.n >= budget() || sm.texts >= textCap() || s.q.length > 1)) return null;
  if (!force && Math.random() > .34) return null;
  const p = partner(), ids = Object.keys(SMALL).filter(id => known(id) && !sm.per[id] && !s.q.some(q => q.from === id) && (fr(id) >= 40 || stage(id) !== 'none' || safe(() => G.social.isFamily(id), false)) && !(s.ro[id] && s.ro[id].quiet !== undefined && today() < s.ro[id].quiet) && !(id === 'dad' && !safe(() => G.chapters.done('ch07'), false)));
  if (!ids.length) return null;
  /* who: somebody with something particular to say first (a gap, a birthday, the morning after), a partner often, family at least once a day */
  const w = id => { const b = draw(id, 'texts', true); if (!b) return 0; let v = 1 + (b.ctx !== 'any' ? 3 : 0); if (id === p) v += 3; else if (stage(id) !== 'none') v += 2; if (safe(() => G.social.isFamily(id), false) && !sm.fam) v += 2; if (fr(id) >= 75) v += 1; return v; };
  const ws = ids.map(w), tot = ws.reduce((a, b) => a + b, 0); if (!tot) return null; let r = Math.random() * tot, id = ids[0]; for (let i = 0; i < ids.length; i++) { r -= ws[i]; if (r <= 0) { id = ids[i]; break; } }
  const b = draw(id, 'texts'); if (!b) return null; if (safe(() => G.social.isFamily(id), false)) sm.fam = 1;
  queueText({ from: id, text: b.text }); G.emit('rel:small', 'text', id, b.text); return { id, text: b.text };
}
/** add-only hook in sim/social.js update(): the line somebody says when you pass them. null = the social system's own wave */
export function wave(id) {
  const sm = smallDay(); if (sm.waves >= PACING.wavesPerDay || (sm.wv || (sm.wv = {}))[id] === today()) return null; if (!SMALL[id] && fr(id) < 40) return null;
  const b = draw(id, 'waves'); if (!b) return null; sm.waves++; sm.wv[id] = today(); G.emit('rel:small', 'wave', id, b.text); return fill(b.text);
}
/** add-only hook in sim/social.js converse(): a remembered detail (or a note about a loved gift) as the second line of the greeting */
export function greeting(ses) {
  const id = ses.id, s = st(), sm = smallDay(); if (!ses.greeting || ses.light || !castOf(id)) return; const said = s.small.said['d:' + id] || (s.small.said['d:' + id] = []);
  const wp = safe(() => HOOK.withPartner(id), null); if (wp && (sm.wp || (sm.wp = {}))[id] !== 1) { sm.wp[id] = 1; ses.greeting.push(wp); return; }
  const g = ev().gift[id], notes = (PEOPLE[id] || {}).giftNotes || {};
  if (g && today() > g[1] && notes[g[0]] && !said.includes('g:' + g[0])) { said.push('g:' + g[0]); ses.greeting.push(fill(notes[g[0]])); G.emit('rel:small', 'detail', id, notes[g[0]]); return; }
  if (sm.dt && sm.dt[id]) return;
  for (const [key, line] of (SMALL[id] && SMALL[id].details) || []) { const m = s.mem[id] && s.mem[id][key]; if (m === undefined || m >= today() || said.includes(key)) continue;
    said.push(key); (sm.dt || (sm.dt = {}))[id] = 1; sm.n++; ses.greeting.push(fill(line)); G.emit('rel:small', 'detail', id, line); return; }
}
export function debug() { const t = hourly(true); const near = safe(() => Object.keys(G.social._rt()).find(id => SMALL[id]), null); if (near) { const w = wave(near) || (SMALL[near].waves[0] || {}).text; if (w) bubble(G.social.char(near), fill(w), 3200); } return { text: t, wave: near }; }
export function init() {
  G.on('job:shift:end', () => { ev().worked = today(); });
  G.on('job:promoted', () => { ev().promoted = today(); familyTexts(NEWS.promoted, {}, 2); });
  G.on('home:move', () => { if (today() > 0) { ev().moved = today(); familyTexts(NEWS.moved, {}, 2); } });
  G.on('cooked', () => { ev().cooked = today(); });
  G.on('chapter:done', () => { ev().chapter = today(); });
  G.on('social:gift', (id, item, kind) => { if (kind === 'loved') ev().gift[id] = [item, today()]; });
  G.on('rel:scene', id => { const p = String(id).split('.'); ev().scene[p[0] === 'fd' ? p[1] : p[0] === 'kids' ? 'pip' : p[0]] = today(); });
  G.on('rel:date', id => { ev().date[id] = today(); });
  G.on('rel:married', id => familyTexts(NEWS.married, { partner: short(id) }, 2));
}
export { pname };
