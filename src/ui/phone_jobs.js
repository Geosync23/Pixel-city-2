// Phone app: Jobs (My Job + the Board). The Board lists the entry jobs first (hired on the spot) and then every other career that is hiring
// (they ask for skills); My Job shows the job's story so far (G.jobStory: shifts attended, keepsakes from work) without spoiling what is next.
// Phone app: Jobs (My Job + the Lite board). Uses G.jobs defensively: current(), listings('phone'), apply(jobId), and when present
// gigs('phone') / acceptGig(id) / quit(). Until the jobs system exists the board previews the phone-listed jobs from data/jobs.js.
import { G } from '../core/game.js';
import { JOBS, JOB_BY_ID, GIGS } from '../data/jobs.js';
import { el, iconEl, row, empty, tabs, btn, card, section, kv, chip, money, when, hhmm, placeName, place, WEEKDAYS, safe, cap, DAY, dayOf } from './phone_util.js';

let tab = 'mine';
const J = () => G.jobs;
const jobOf = x => (x ? (typeof x === 'string' ? JOB_BY_ID[x] : JOB_BY_ID[x.id] || JOB_BY_ID[x.jobId] || (x.levels ? x : null)) : null);
const days = j => j.shifts.days.map(d => WEEKDAYS[d]).join(' ');
function nextShift(j) {
  const a = safe(() => G.planner.list(G.state.t, G.state.t + 8 * DAY, { events: false }).find(x => x.kind === 'work'), null); if (a) return a.t;
  const now = G.state.t, d0 = dayOf(now); for (let d = d0; d < d0 + 8; d++) { const t = d * DAY + j.shifts.start * 60; if (j.shifts.days.includes(d % 7) && t > now) return t; } return null;
}
function reqText(r) { const k = Object.keys(r || {}); return k.length ? k.map(s => `${cap(s)} ${r[s]}`).join(', ') : 'None'; }
function jobCard(j, ctx, cur) {
  const l1 = j.levels[0], on = !!(J() && J().apply), mine = cur && jobOf(cur) === j;
  return card(el('div.ph-kv', null, el('b', { text: j.name, style: { fontSize: '17px' } }), el('b', { text: money(l1.hourly) + '/h' })), el('small', { text: `${placeName(j.venue)} · ${days(j)} · ${hhmm(j.shifts.start)}-${hhmm(j.shifts.end)}` }), el('p', { text: j.blurb }),
    j.hoursNote ? el('small', { text: j.hoursNote }) : null, el('small', { text: 'Needs: ' + reqText(j.requires) }),
    mine ? chip('Your job', 'good') : (() => { const x = btn(on ? 'Apply' : 'Hiring opens soon', () => { let r; try { r = J().apply(j.id); } catch (e) { r = false; } if (r === false) ctx.tip('No luck this time. Check the requirements.'); else { tab = 'mine'; ctx.refresh(); ctx.tip('You got the job! Welcome aboard.'); } }, on ? 'pri wide' : 'wide'); x.disabled = !on; return x; })());
}
function mineTab(b, ctx) {
  const cur = safe(() => J().current(), null), j = jobOf(cur);
  if (!j) return b.append(empty('ui.search', 'No job yet', J() ? 'Have a look at the Board. Entry jobs hire on the spot.' : 'The Board tab shows who is hiring around town.', btn('Open the Board', () => { tab = 'board'; ctx.refresh(); }, 'pri')));
  const lvl = (cur && cur.level) || 1, L = j.levels[lvl - 1] || j.levels[0], N = j.levels[lvl], ns = nextShift(j), prog = cur && (cur.progress !== undefined ? cur.progress : cur.promo);
  b.append(el('div.ph-hero', null, iconEl('ui.trophy', 3), el('div', null, el('b', { text: L.title, style: { fontSize: '18px' } }), el('small', { text: `${placeName(j.venue)} · level ${lvl} of ${j.levels.length}` }))));
  b.append(card(kv('Pay', money(L.hourly) + ' / hour'), kv('Shifts', `${days(j)}, ${hhmm(j.shifts.start)}-${hhmm(j.shifts.end)}`), ns ? kv('Next shift', when(ns)) : null, j.perk ? el('small', { text: 'Perk: ' + j.perk }) : null));
  if (N) { const c = card(el('b', { text: 'Next: ' + N.title + ` (${money(N.hourly)}/h)` })); if (typeof prog === 'number') c.append(el('div.ph-bar', null, el('i', { style: { width: Math.max(0, Math.min(100, prog <= 1 ? prog * 100 : prog)) + '%', background: 'var(--gold)' } })));
    for (const s in N.requires || {}) { const have = safe(() => G.skills.level(s), 1); c.append(kv(cap(s), `${have} / ${N.requires[s]}`)); } b.append(c); }
  else b.append(card(el('b', { text: 'Top of the ladder. Nice work!' })));
  const A = safe(() => G.jobStory.arc(j.id), null);
  if (A) { const seen = A.beats.filter(x => x.done), keeps = safe(() => G.jobStory.keepsakes(), []).filter(k => k.job === j.id), c = card(el('b', { text: 'At work: "' + A.title + '"' }), kv('Shifts you showed up for', String(A.shifts)));
    if (seen.length) c.append(el('small', { text: 'So far: ' + seen.map(x => x.title).join(' · ') })); else c.append(el('small', { text: 'Your first shift is where it starts.' }));
    if (safe(() => G.jobStory.hasPlay(j.id), false)) c.append(kv(safe(() => G.jobStory.playName(j.id), 'Your part'), A.plays ? `played ${A.plays}x · best ${'★'.repeat(A.best >= .85 ? 3 : A.best >= .55 ? 2 : 1)}` : 'look for the pink marker on a shift'));
    for (const k of keeps) c.append(el('small', { text: 'Keepsake: ' + k.name + '. ' + k.desc }));
    b.append(c); }
  const p = place(j.venue); b.append(el('div.ph-btns', null, p ? btn('Workplace on map', () => ctx.open('map', { place: p.id }), '', 'ui.pin') : null, J().quit ? btn('Quit', () => { if (ctx._q) { safe(() => J().quit(), 0); ctx.refresh(); } else { ctx._q = 1; ctx.tip('Tap Quit again to confirm.'); } }) : null));
}
function boardTab(b, ctx) {
  const cur = safe(() => J().current(), null); let L = safe(() => J().listings('phone'), null); if (L && !Array.isArray(L)) L = L.jobs || null;
  const jobs = (L || JOBS.filter(j => j.listedOn === 'phone')).map(jobOf).filter(Boolean);
  if (!J()) b.append(el('p.ph-note', { text: 'Preview: employers are still setting up their hiring desks. Applications open soon.' }));
  b.append(section('Hiring now', chip(String(jobs.length))));
  for (const j of jobs) b.append(jobCard(j, ctx, cur));
  const more = (safe(() => J().listings('computer'), null) || []).map(jobOf).filter(j => j && !jobs.includes(j));
  if (more.length) { b.append(section('More careers', chip(String(more.length)))); b.append(el('p.ph-note', { text: 'These ask for a skill or two. Apply here or at any computer.' })); for (const j of more) b.append(jobCard(j, ctx, cur)); }
  const gigs = safe(() => J().gigs('phone'), null) || GIGS.filter(g => g.source === 'phone');
  if (gigs.length) { b.append(section('Quick gigs')); for (const g of gigs) { const can = !!(J() && J().acceptGig);
    b.append(row({ icon: 'ui.star', title: g.name, sub: `${g.blurb || ''} ${Math.round((g.minutes || 60))} min`, right: g.pay ? `${money(g.pay[0])}-${g.pay[1]}` : '', cls: 'note', onclick: can ? () => { let r; try { r = J().acceptGig(g.id); } catch (e) { r = false; } ctx.tip(r === false ? 'That gig is not available right now.' : 'Gig accepted. It is on your day.'); ctx.refresh(); } : () => ctx.tip('Gigs open up soon.') })); } }
  b.append(el('p.ph-note', { text: 'A computer at home or at the library shows the same board on a bigger screen, with your skills checked against each job.' }));
}
export default {
  id: 'jobs',
  badge: () => { const a = safe(() => G.planner.list(G.state.t, G.state.t + 60, { events: false }).find(x => x.kind === 'work' && x.s < 2), null); return a ? 1 : 0; },
  render(b, ctx) {
    b.append(tabs([{ id: 'mine', name: 'My Job' }, { id: 'board', name: 'Board' }], tab, t => { tab = t; ctx.refresh(); }));
    (tab === 'mine' ? mineTab : boardTab)(b, ctx);
  },
};
