// Phone app: Wellness (Me: mood, the nine needs (six + three gentle), home care, fitness, moodlets, a daily tip; Skills; Journal). Reads G.needs / G.skills defensively.
import { G } from '../core/game.js';
import { NEEDS, SKILLS, SKILL_MAX_LEVEL, FITNESS } from '../data/needs.js';
import * as TEXTS from '../story/texts.js';
import { el, iconEl, empty, tabs, btn, card, section, kv, bar, chip, dur, dayOf, allPlaces, isKnown, placeCat, openState, distTo, safe, cap } from './phone_util.js';
import { moodletIcon } from './_icons.js';

let tab = 'me';
const N = () => G.needs;
const BAND_COL = { full: 'var(--good)', ok: '#5fb84f', low: 'var(--gold)', critical: 'var(--bad)' };
const TIPS = ['A shower before work is worth more than five more minutes in bed.', 'Cooking at home is cheaper than eating out, and trains your Cooking.', 'A walk in the park lifts Fun and Fitness at once.', 'Friends top up your Social need faster than anything else.', 'The light rail is a flat fare however far you go.', 'Sleep before midnight and mornings feel a lot kinder.', 'The library has free computers and quiet corners to study.'];
function suggestion(k) {
  const cat = { hunger: 'food', fun: 'fun' }[k]; if (!cat) return null; let best = null, bd = 1e9;
  for (const p of allPlaces()) { if (!isKnown(p.id) || placeCat(p) !== cat || !openState(p).open) continue; const d = distTo(p); if (d < bd) { bd = d; best = p; } }
  return best ? { p: best, text: `${k === 'hunger' ? 'Hungry?' : 'Bored?'} ${best.name} is open, about ${Math.max(1, Math.round(bd / 40))} min away.` } : null;
}
function meTab(b, ctx) {
  const mood = safe(() => N().mood(), 50), tier = safe(() => N().moodTier(), { id: 'okay', label: 'Okay' });
  b.append(el('div.ph-hero.pink', null, iconEl('mood.' + tier.id, 3), el('div', null, el('small', { text: 'Mood' }), el('b', { text: tier.label, style: { fontSize: '20px' } }), bar(mood, 100, '#e0608e', `Mood ${Math.round(mood)} of 100`))));
  const c = card(); let low = null, gentle = false;
  for (const d of safe(() => N().defs, NEEDS)) { const v = safe(() => N().get(d.id), 0), band = safe(() => N().band(d.id), { id: 'ok', label: '' }); if ((band.id === 'low' || band.id === 'critical') && !d.soft && (!low || v < low.v)) low = { k: d.id, v };
    if (d.soft && !gentle) { gentle = true; c.append(el('small', { text: 'GENTLE NEEDS · they shape your mood, slowly', style: { fontWeight: '700', letterSpacing: '.5px', opacity: '.6', marginTop: '4px' } })); }
    c.append(el('div.ph-need', null, iconEl('need.' + d.id, 2), el('div.l', null, el('span', { text: d.name }), el('small', { text: `${band.label} · ${Math.round(v)}` })), bar(v, 100, BAND_COL[band.id] || 'var(--good)', `${d.name} ${Math.round(v)} of 100`))); }
  b.append(c);
  /* home care (src/sim/supplies.js): how clean the place is and what is running low */
  const HS = G.supplies; if (HS) { const lows = safe(() => HS.low(), []), nm = k => safe(() => HS.all().find(x => x.key === k).name, k);
    b.append(card(el('div.ph-need', null, iconEl('ui.broom', 2), el('div.l', null, el('span', { text: 'Home' }), el('small', { text: `${safe(() => HS.cleanLabel(), '')} · comfort settles at ${safe(() => G.needsExtra.homeComfort(), '?')}` })), bar(safe(() => HS.clean(), 0), 100, '#3fa8a0', 'Home cleanliness')),
      el('small', { text: lows.length ? 'Running low: ' + lows.map(nm).join(', ') + '.' : 'Bathroom shelf and cleaning cupboard are stocked.' }), btn('Home supplies', () => { ctx.close(); setTimeout(() => safe(() => HS.open()), 250); }, '', 'ui.supplies'))); }
  const sg = low && suggestion(low.k); if (sg) b.append(card(el('p', { text: sg.text }), btn('Show on map', () => ctx.open('map', { place: sg.p.id }), '', 'ui.pin')));
  const fit = safe(() => N().fitness(), null);
  if (fit !== null) b.append(card(el('div.ph-need', null, iconEl('need.fitness', 2), el('div.l', null, el('span', { text: 'Fitness' }), el('small', { text: `${safe(() => N().fitnessLabel(), '')} · ${Math.round(fit)}` })), bar(fit, FITNESS.max, 'var(--accent)', `Fitness ${Math.round(fit)}`))));
  const ml = safe(() => N().moodlets(), []);
  b.append(section('Moodlets'));
  if (!ml.length) b.append(el('p.ph-note', { text: 'Nothing special going on. A calm day.' }));
  else b.append(el('div.ph-chips', null, ml.map(m => el('button.ph-chip' + (m.mood < 0 ? '.bad' : '.good'), { onclick: () => ctx.tip(`${m.name}: ${m.desc || ''}`) }, iconEl(moodletIcon(m.id, m.mood), 1), m.name, m.left ? el('small', { text: ' ' + dur(m.left) }) : null))));
  b.append(section('Tip of the day'), card(el('p', { text: TIPS[dayOf(G.state.t) % TIPS.length] })));
}
function skillsTab(b) {
  const S = G.skills; if (!S) return b.append(empty('ui.star', 'Skills are warming up', 'Practice makes progress. Check back soon.'));
  for (const d of safe(() => S.defs, SKILLS)) { const lvl = safe(() => S.level(d.id), 1), nx = safe(() => S.next(d.id), null);
    b.append(card(el('div.ph-need', null, iconEl('skill.' + d.id, 2), el('div.l', null, el('span', { text: d.name }), el('small', { text: lvl >= SKILL_MAX_LEVEL ? 'Max level' : `Level ${lvl}` })), bar(nx ? nx.into : 1, nx ? nx.need : 1, 'var(--blue)', `${d.name} level ${lvl}`)), el('small', { text: d.desc + (nx ? ` (${Math.round(nx.need - nx.into)} xp to level ${lvl + 1})` : '') }))); }
}
function journalTab(b) {
  const known = allPlaces().filter(p => isKnown(p.id) && p.kind !== 'busstop' && p.kind !== 'taxistand').length, total = allPlaces().filter(p => p.kind !== 'busstop' && p.kind !== 'taxistand').length;
  b.append(card(kv('Days in Maple Bay', String(dayOf(G.state.t) + 1)), kv('Places discovered', `${known} / ${total}`), kv('People you know', String(safe(() => G.social.known().length, 0) || '-')), kv('Books read', String(Object.keys(safe(() => G.state.inv.books, {})).length))));
  const got = safe(() => G.journal.list(), null) || (TEXTS.ACHIEVEMENTS || []).filter(a => G.state.flags && (G.state.flags['ach_' + a.id] || G.state.flags[a.id]));
  b.append(section('Firsts & achievements'));
  if (!got.length) b.append(empty('ui.trophy', 'Your story starts here', 'Small firsts and proud moments get written down in this journal.'));
  else for (const a of got) b.append(card(el('b', { text: a.name }), el('small', { text: a.desc || '' })));
}
export default {
  id: 'wellness',
  // needs that are critical AND that you have not looked at yet: opening Wellness clears the counter; a need counts again only after it recovered and dropped again (owner msg 88)
  badge: () => { const sn = safe(() => G.state.phone.seen.wellness, null) || {}; let n = 0; for (const d of NEEDS) { const c = safe(() => N().band(d.id).id, 'ok') === 'critical'; if (c && !sn[d.id]) n++; else if (!c && sn[d.id]) delete sn[d.id]; } return n; },
  render(b, ctx) {
    { const ph = G.state.phone; if (ph) { const sn = (ph.seen || (ph.seen = {})).wellness || (ph.seen.wellness = {}); let ch = false; for (const d of NEEDS) if (safe(() => N().band(d.id).id, 'ok') === 'critical' && !sn[d.id]) { sn[d.id] = 1; ch = true; } if (ch) setTimeout(() => safe(() => G.phone.syncBadge(), 0), 0); } }
    if (!N()) return b.append(empty('ui.heart', 'Wellness is syncing', 'Your needs and mood will show up here in a moment.'), card(el('b', { text: 'Tip of the day' }), el('p', { text: TIPS[dayOf(G.state.t) % TIPS.length] })));
    b.append(tabs([{ id: 'me', name: 'Me' }, { id: 'skills', name: 'Skills' }, { id: 'journal', name: 'Journal' }], tab, t => { tab = t; ctx.refresh(); }));
    (tab === 'me' ? meTab : tab === 'skills' ? skillsTab : journalTab)(b, ctx);
  },
};
