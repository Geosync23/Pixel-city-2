// jobs.js — G.jobs: employment, shifts, pay, promotions, gigs. Data: data/jobs.js (JOBS, WORK_RULES, GIGS), story/texts.js (boss texts).
// The on-shift work loop lives in _jobs_work.js; windows / shift HUD / minis in ui/jobs.js.
//
// G.jobs
//   listings(source = 'computer') -> [{ id, jobId, name, title, venue, venueName, blurb, hourly, tips, days, hours, reqs: [{skill, need, have, met}],
//                                       eligible, mine, perk, level (level you would start at), note }]   'phone' = entry jobs only
//   apply(jobId) -> false | { hired: true, level, title }      instant decision; replaces a current job; boss texts the offer
//   quit()   current() -> null | { id, jobId, name, level, title, hourly, progress 0..1, points, need, nextShift (abs min), venue, venueName, onShift, perk, warnings }
//   onShift() -> bool    shift() -> the live shift record | null    lastSummary() -> last results
//   clockIn() -> bool (inside the window, at the workplace)    autoWork()    leaveEarly()    requestDayOff() -> bool (1 per week)
//   openBoard(ctx?)  openGigs(ctx?)                              job board window (computers)
//   gigs(source) -> [{ ...gig, payNow, ok, why }]   acceptGig(id, ctx?) -> bool   activeGig()   cancelGig()
//   discount(venueId) -> price multiplier (staff discount)       perks() -> { freeCoffee, freeGym, freeTransit, freeCheckups, staffMeal }
//   hud() / goStep(orderId)                                      used by the shift HUD
//   debugStart(jobId, level?) -> Promise (hire if needed, teleport to the workplace, clock in)   debugStep() -> task id   debugFinish() -> summary   debugGig(id)
// Events: 'job:hired'(jobId, level)  'job:quit'(jobId, reason)  'job:shift:start'(jobId, shift)  'job:shift:end'(summary)  'job:promoted'(jobId, level)
//         'job:missed'(jobId, streak)  'job:task'(jobId, taskId, quality)  'job:gig:start'(id)  'job:gig:done'(id, pay)  'jobs:hud' (UI refresh)
// State G.state.jobs = { job: { id, level, points, hiredDay, from, shifts, streak, warnings, lastDay, offWeek } | null, shift: {...} | null,
//                        history: { [jobId]: { level, points, day, reapply } }, gigs: { day, count, cool: {id: t}, active }, stats, appts: { [day]: apptId }, last }
// A save made mid-shift ends the shift on load, paid for the time worked.
// JOB STORIES (sim/jobstory.js, G.jobStory): the 11 new jobs that need no new room are appended to JOBS here at load (rows: story/jobs_new.js NEW_JOBS; boss texts
//   go into JOB_TEXTS). A job may carry `room` (the room with its stations when it is not `venue`: the airport concourse / terminal) and `boss` (a speaker id that is
//   not a cast.js person: texts are sent with the speaker's name, relationship is kept by G.jobStory). Clock-in hands over to G.jobStory.clockIn (a clock-in beat, then
//   the "Work the shift / Skip to the end" card); the pay card waits for G.jobStory.shiftEnd (a clock-out beat).   roomOf(job) -> scene id of the workplace.
import { G } from '../core/game.js';
import { JOBS, JOB_BY_ID, WORK_RULES, GIGS, GIG_RULES, shiftHours } from '../data/jobs.js';
import { DISCOUNTS } from '../data/economy.js';
import { JOB_TEXTS } from '../story/texts.js';
import { CAST_BY_ID } from '../story/cast.js';
import { NEW_JOBS, SPEAKERS } from '../story/jobs_arcs.js';
import { toast } from '../ui/kit.js';
import * as UI from '../ui/jobs.js';
import * as WK from './_jobs_work.js';
import { leash } from './_crowd_animals.js';

/* ---------- the new jobs (story/jobs_new.js): the rows that need no new room go live here; `uniform` is mapped to outfit art that exists ---------- */
const UNIFORM_ART = { gate_agent: 'pilot', ramp: 'dockworker', station: 'busdriver', retail: 'office', docent: 'librarian', florist: 'grocer', aquarist: 'trainer', chef: 'chef', bellhop: 'taxidriver', barber: 'barista', firefighter: 'dockworker', none: null };
for (const row of NEW_JOBS) { if (row.needsRoom || JOB_BY_ID[row.id]) continue; /* `uniform` stays empty on purpose: sim/_crowd_rooms.js dresses a venue's ambient staff in the uniform of the job at that venue, and these venues have their own staff looks. The player's shift clothes are `wear`. */
  const j = Object.assign({}, row, { uniform: null, wear: UNIFORM_ART[row.uniform] !== undefined ? UNIFORM_ART[row.uniform] : null, isNew: true }); JOBS.push(j); JOB_BY_ID[j.id] = j; if (!JOB_TEXTS[j.id]) JOB_TEXTS[j.id] = Object.assign({ boss: row.boss }, row.texts); }
export const roomOf = job => 'int:' + (job.room || job.venue);
const story = () => G.jobStory || null;
export const SHIFT_SPEED = 2;      // game minutes per real second while on shift (a 6 h shift = 3 real minutes, minus task fast-forwards)
export const COURIER_SPEED = 1;    // the courier works out in the city at walking pace
const DAY = 1440, WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const defaults = () => ({ job: null, shift: null, history: {}, gigs: { day: -1, count: 0, cool: {}, active: null }, stats: { shifts: 0, earned: 0, tasks: 0, promotions: 0, gigs: 0, held: [] }, appts: {}, last: null });
let S, quiet = false, dbg = false, ending = false, dog = null;
const st = () => (S = G.state.jobs || (G.state.jobs = defaults()));
const cl = (v, a, b) => Math.max(a, Math.min(b, v)), r25 = n => Math.round(n * 4) / 4, hh = h => String(Math.floor(h) % 24).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
const skill = k => (G.skills ? G.skills.level(k) : 1) + (G.university ? G.university.jobBonus(k) : 0), today = () => Math.floor(G.state.t / DAY), cap = x => x[0].toUpperCase() + x.slice(1);
const vname = job => { const p = G.places && G.places.get && G.places.get(job.venue); return (p && p.name) || job.name; };
const fill = (x, job, level) => String(x || '').replace(/\{name\}/g, G.state.player.name).replace(/\{level\}/g, job.levels[level - 1].title).replace(/\{job\}/g, job.name);
const bossOf = job => (G.social && G.social.boss && G.social.boss(job.id)) || (JOB_TEXTS[job.id] || {}).boss;
const bossName = id => (CAST_BY_ID[id] ? undefined : (SPEAKERS[id] && (SPEAKERS[id].short || SPEAKERS[id].name)) || undefined);
function text(job, key, level, i) { const T = JOB_TEXTS[job.id]; let x = T && T[key]; if (Array.isArray(x)) x = x[i]; const from = bossOf(job); if (!x || !from || !G.messages) return; try { G.messages.send({ from, name: bossName(from), text: fill(x, job, level || (S.job ? S.job.level : 1)) }); } catch (e) { /* optional */ } }
const shiftT = (job, d) => (job.shifts.days.includes(d % 7) ? { start: d * DAY + job.shifts.start * 60, end: d * DAY + job.shifts.end * 60 } : null);
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);

/* ---------- listings / hiring ---------- */
const expWaiver = () => Math.min(2, Math.floor(S.stats.shifts / 8)); // work experience: every 8 shifts worked anywhere waives one skill level (max 2)
function reqs(job) { const w = expWaiver(); return Object.keys(job.requires || {}).map(k => { const need = job.requires[k], have = skill(k); return { skill: k, need, have, met: have >= need || have >= Math.max(1, need - w), waived: have < need && have >= need - w }; }); }
function listing(job) {
  const R = reqs(job), h = S.history[job.id], d = today(), wait = h && h.reapply > d ? h.reapply - d : 0, back = h && d - h.day <= 14 ? h.level : 1;
  return { id: job.id, jobId: job.id, name: job.name, title: job.levels[back - 1].title, venue: job.venue, venueName: vname(job), blurb: job.blurb, hourly: job.levels[back - 1].hourly, tips: job.tips ? job.tips.perShift : null,
    days: job.shifts.days.map(x => WD[x]).join(' '), hours: hh(job.shifts.start) + '-' + hh(job.shifts.end), shifts: job.shifts, requires: job.requires, levels: job.levels, perk: job.perk, hoursNote: job.hoursNote || '', isNew: !!job.isNew, listedOn: job.listedOn, reqs: R, eligible: R.every(r => r.met) && !wait,
    mine: !!(S.job && S.job.id === job.id), level: back, note: wait ? `Re-apply in ${wait} day${wait > 1 ? 's' : ''}` : R.some(r => r.waived) ? 'Your work experience covers the gap' : '' };
}
function listings(source = 'computer') { st(); return JOBS.filter(j => source !== 'phone' || j.listedOn === 'phone').map(listing); }
function apply(jobId) {
  st(); const job = JOB_BY_ID[jobId]; if (!job) return false; if (S.job && S.job.id === jobId) { toast('You already work there.'); return false; }
  const L = listing(job), h = S.history[jobId]; if (h && h.reapply > today()) { toast(L.note + '.', 'bad'); return false; }
  const miss = L.reqs.filter(r => !r.met), gap = miss.reduce((a, r) => a + r.need - r.have, 0);
  const charm = miss.length === 1 && gap === 1 && (skill('charisma') >= 3 || (G.state.flags || {}).goodWord || (G.social && G.social.rel && G.social.rel(bossOf(job)) >= 40)); // a little charm closes a one-level gap
  if (miss.length && !charm) { toast(`${L.venueName}: not yet. Needs ${miss.map(r => cap(r.skill) + ' ' + r.need).join(', ')}.`, 'bad'); return false; }
  if (S.job) quit('switch');
  const lvl = L.level, keep = h && today() - h.day <= 14;
  S.job = { id: jobId, level: lvl, points: keep ? h.points || 0 : 0, hiredDay: today(), from: G.state.t, shifts: 0, streak: 0, warnings: 0, lastDay: -1, offWeek: -1 }; delete S.history[jobId];
  if (!S.stats.held.includes(jobId)) S.stats.held.push(jobId);
  text(job, 'offer', lvl); syncPlanner(); perkTick(); toast(`Hired! ${job.levels[lvl - 1].title} at ${L.venueName}.`, 'good'); G.emit('job:hired', jobId, lvl); G.emit('jobs:hud');
  return { hired: true, level: lvl, title: job.levels[lvl - 1].title };
}
function quit(reason = 'quit') {
  st(); const j = S.job; if (!j) return false; if (S.shift) endShift('early');
  S.history[j.id] = { level: reason === 'letgo' ? Math.max(1, j.level - 1) : j.level, points: reason === 'letgo' ? 0 : j.points, day: today(), reapply: reason === 'letgo' ? today() + WORK_RULES.missedShift.reapplyAfterDays : 0 };
  S.job = null; syncPlanner(); G.goals && G.goals.remove && G.goals.remove('job_shift'); if (reason === 'quit') toast('You handed in your notice.'); G.emit('job:quit', j.id, reason); return true;
}
function needPts(level) { return WORK_RULES.promotion.pointsToReachLevel[level] || 0; } // points to go from `level` to level + 1
function nextShiftT() { const j = S.job; if (!j) return null; const job = JOB_BY_ID[j.id], d0 = today(); for (let d = d0; d < d0 + 9; d++) { const T = shiftT(job, d); if (T && T.end > G.state.t && j.lastDay !== d && T.start >= j.from - 60 && j.off !== d) return T.start; } return null; }
function current() {
  st(); const j = S.job; if (!j) return null; const job = JOB_BY_ID[j.id], L = job.levels[j.level - 1], need = needPts(j.level);
  return { id: j.id, jobId: j.id, name: job.name, level: j.level, title: L.title, hourly: L.hourly, points: Math.round(j.points), need, progress: j.level >= 4 ? 1 : cl(j.points / need, 0, 1), nextShift: nextShiftT(), venue: job.venue, venueName: vname(job), onShift: !!S.shift, perk: job.perk, warnings: j.warnings, shifts: j.shifts };
}

/* ---------- planner + clock ---------- */
function syncPlanner() {
  const P = G.planner; if (!P) return; const d0 = today(), j = S.job, job = j && JOB_BY_ID[j.id];
  for (const d in S.appts) { const keep = job && +d >= d0 && S.appts[d].job === j.id && j.off !== +d; if (!keep) { if (+d >= d0 && !(job && j.lastDay === +d)) try { P.remove(S.appts[d].id); } catch (e) { /* gone */ } delete S.appts[d]; } }
  if (!job) return;
  for (let d = d0; d < d0 + 7; d++) { const T = shiftT(job, d); if (!T || S.appts[d] || T.start <= G.state.t || T.start < j.from || j.off === d) continue;
    try { S.appts[d] = { id: P.add({ title: 'Shift at ' + vname(job), placeId: job.venue, t: T.start, dur: T.end - T.start, kind: 'work', data: { jobId: job.id } }), job: job.id }; } catch (e) { /* optional */ } }
}
const atWork = job => G.scene && G.scene.id === roomOf(job);
function clockIn(force, withStory) {
  st(); const j = S.job; if (!j || S.shift) return false; const job = JOB_BY_ID[j.id], d = today(), now = G.state.t; let T = shiftT(job, d);
  if (force) T = { start: now, end: now + shiftHours(job) * 60 };
  else if (!T || j.lastDay === d || j.off === d || T.start < j.from - 60 || now < T.start - WORK_RULES.clockIn.earlyMinutes || now > T.end - 20 || !atWork(job)) return false;
  const late = now - T.start, P = WORK_RULES.performance.punctuality;
  S.shift = { jobId: j.id, day: d, start: T.start, end: T.end, in: now, payFrom: Math.max(now, T.start), late: late > P.veryLateAfterMinutes ? 2 : late > WORK_RULES.clockIn.graceMinutes ? 1 : 0, tasks: 0, count: 0, bonus: 0, tipSum: 0, tipN: 0, missed: 0, autoMin: 0, moodSum: 0, moodN: 0, auto: false, prevSpeed: G.state.speed || 1 };
  j.lastDay = d; if (S.appts[d]) try { G.planner.done(S.appts[d].id); } catch (e) { /* optional */ }
  G.goals && G.goals.remove && G.goals.remove('job_shift');
  try { G.wardrobe && G.wardrobe.wearTemp(job.wear !== undefined ? job.wear : job.uniform); } catch (e) { /* optional */ }
  G.state.speed = job.id === 'courier' ? COURIER_SPEED : SHIFT_SPEED;
  if (job.id === 'barista' && G.needs) G.needs.add('energy', 8);                                  // perk: a free coffee per shift
  if (job.id === 'courier' && G.inv && G.inv.grant && !G.inv.hasAccess('transit')) G.inv.grant('transit', (T.end - now + 30) / DAY); // perk: free transit in uniform
  if (!j.shifts) text(job, 'firstDay', j.level);
  WK.start(job, j.level, S.shift); UI.showHud();
  toast(S.shift.late ? 'Clocked in (late). Uniform on.' : 'Clocked in. Uniform on!', S.shift.late ? 'info' : 'good'); G.emit('job:shift:start', j.id, S.shift);
  /* job stories: a clock-in beat, then "Work the shift / Skip to the end". The ticket stream waits until the player has chosen. Dev / test clock-ins (force) go straight to work. */
  if (story() && (withStory || (!force && !quiet))) { WK.pause(true); try { story().clockIn(job, S.shift, { work: () => { if (S.shift && !S.shift.auto) { WK.pause(false); G.emit('jobs:hud'); } }, skip: () => autoWork() }); } catch (e) { console.error(e); WK.pause(false); } }
  return true;
}
function missed(d) {
  const j = S.job, job = JOB_BY_ID[j.id], M = WORK_RULES.missedShift; j.lastDay = d; j.points = Math.max(0, j.points - M.pointsPenalty); j.streak++; G.goals && G.goals.remove && G.goals.remove('job_shift');
  toast(`You missed your shift at ${vname(job)}.`, 'bad'); G.emit('job:missed', j.id, j.streak);
  if (j.streak >= M.letGoAfterInARow) { text(job, 'letGo', j.level); quit('letgo'); }
  else if (j.streak === M.warningAfter) { j.warnings++; text(job, 'warning', j.level); } else if (j.streak === M.letGoAfterInARow - 1) { j.warnings++; text(job, 'lastWarning', j.level); }
}
function onMinutes(delta) {
  st(); const now = G.state.t, sh = S.shift;
  if (sh) { const job = JOB_BY_ID[sh.jobId], h = delta / 60;
    if (G.needs) { for (const k in job.workDrain) if (k !== 'fitnessPerHour') G.needs.add(k, job.workDrain[k] * h); sh.moodSum += G.needs.workPerf() * delta; sh.moodN += delta; }
    if (sh.auto) sh.autoMin += delta;
    if (now >= sh.end) endShift('done');
    return; }
  const j = S.job; if (!j) return; const job = JOB_BY_ID[j.id], d0 = today();
  for (let d = Math.max(d0 - 6, j.lastDay + 1, j.hiredDay); d <= d0 && S.job === j; d++) { // shifts that came and went (asleep, busy, away)
    const T = shiftT(job, d); if (!T || T.start < j.from - 60) continue; if (j.off === d) { if (now >= T.end) j.lastDay = d; continue; }
    if (now >= T.end) missed(d);
    else if (d === d0 && now >= T.start - 90 && j.lastDay !== d) { if (atWork(job) && !dbg && clockIn()) return; if (G.goals && G.goals.add && !(G.goals.get && G.goals.get('job_shift'))) try { G.goals.add({ id: 'job_shift', text: `Shift at ${vname(job)} ${hh(job.shifts.start)}`, group: 'opportunity', placeId: job.venue, hint: `Walk into ${vname(job)} between ${hh(job.shifts.start - .5)} and the end of the shift to clock in.` }); } catch (e) { /* optional */ } }
  }
}

/* ---------- clock out ---------- */
function endShift(reason = 'done') {
  st(); const sh = S.shift; if (!sh || ending) return null; ending = true;
  const j = S.job, job = JOB_BY_ID[sh.jobId], lvl = j ? j.level : 1, L = job.levels[lvl - 1], P = WORK_RULES.performance, early = reason === 'early' || reason === 'left';
  if (G.busy && (G.busy.jobAuto || G.busy.jobTask)) G.endActivity(false);
  WK.stop(); UI.hideHud(); try { G.wardrobe && G.wardrobe.restore(); } catch (e) { /* optional */ } G.state.speed = sh.prevSpeed || 1;
  const now = Math.min(G.state.t, sh.end), total = Math.max(1, now - sh.in), worked = Math.max(0, now - sh.payFrom) / 60, full = shiftHours(job), share = cl(worked / full, 0, 1), autoShare = cl(sh.autoMin / total, 0, 1);
  const activeH = Math.max(.25, (total - sh.autoMin) / 60), taskPart = P.taskPart.max * Math.min(1, sh.tasks / (job.workLoop.targetTasksPerHour * activeH)) * (1 - autoShare) + P.taskPart.auto * autoShare;
  const mood = cl(sh.moodN ? sh.moodSum / sh.moodN : G.needs ? G.needs.workPerf() : 0, -20, 15), prim = job.trains.primary, skillPart = cl((skill(prim) - (L.requires[prim] || 1)) * P.skillPart.perLevelAboveRequirement, 0, P.skillPart.max);
  const punct = [P.punctuality.onTime, P.punctuality.late, P.punctuality.veryLate][sh.late];
  const score = Math.round(cl(P.base + mood + skillPart + punct + taskPart + cl(sh.perf || 0, -5, 10) - (early ? 10 : 0), 0, 100)), band = WORK_RULES.payBands.find(b => score >= b.min);
  const base = r25(worked * L.hourly * band.payMult), tipQ = sh.tipN ? sh.tipSum / sh.tipN : .6;
  let tips = 0; if (job.tips) { const [a, b] = job.tips.perShift; tips = (a + (b - a) * tipQ) * (score / 100) * (1 + skill('charisma') * .05) * share * ((1 - autoShare) + autoShare * WORK_RULES.autoTipShare); if (job.id === 'bartender' && sh.day % 7 === 4) tips *= 2; tips = r25(tips); }
  const bonus = r25(sh.bonus), pay = r25(base + bonus + tips);
  if (pay > 0 && G.money) G.money.add(pay, 'Wages: ' + vname(job));
  if (G.skills) for (const k in job.trains.xpPerHour) G.skills.addXp(k, Math.round(job.trains.xpPerHour[k] * worked));
  if (G.needs) { try { if (job.workDrain.fitnessPerHour) G.needs.add('fitness', job.workDrain.fitnessPerHour * worked); if (band.moodlet && share > .5) G.needs.addMoodlet(band.moodlet); if (job.id === 'line_cook' && share > .5) G.needs.add('hunger', 50); } catch (e) { /* optional */ } }
  const boss = bossOf(job); { const d = score >= 90 ? 2 : score >= 70 ? 1 : score < 40 ? -1 : 0; if (boss && d) try { if (CAST_BY_ID[boss]) G.social.addRel(boss, d); else if (story()) story().addRel(boss, d); } catch (e) { /* optional */ } }
  S.stats.shifts++; S.stats.earned += pay; S.stats.tasks += sh.count; let promoted = null;
  if (j && j.id === job.id) {
    j.points += score * share; j.shifts++; j.streak = 0;
    if (early && worked <= 0) j.lastDay = sh.day - 1; // walked out before the shift even began: you may still clock in today
    if (score >= 90 && share > .5 && j.shifts % 3 === 1) text(job, 'goodShift', lvl);
    const N = job.levels[lvl];
    if (N && j.points >= needPts(lvl) && Object.keys(N.requires).every(k => skill(k) >= N.requires[k])) {
      j.level++; j.points = 0; S.stats.promotions++; const pb = r25(N.hourly * full); if (G.money) G.money.add(pb, 'Promotion bonus: ' + vname(job));
      try { G.needs && G.needs.addMoodlet(WORK_RULES.promotion.onPromotion.moodlet); } catch (e) { /* optional */ }
      text(job, 'promotion', j.level, j.level - 2); promoted = { level: j.level, title: N.title, hourly: N.hourly, bonus: pb, unlocks: job.workLoop.tasks.filter(t => t.unlockLevel === j.level).map(t => t.name) };
    }
  }
  const N2 = j && job.levels[j.level], need = j ? needPts(j.level) : 0;
  const sum = S.last = { jobId: job.id, title: L.title, venue: job.venue, venueName: vname(job), reason, hours: Math.round(worked * 10) / 10, hourly: L.hourly, score, stars: Math.round(score / 20), band: band.label, payMult: band.payMult, base, bonus, tips, pay, total: pay,
    tasks: sh.count, missed: sh.missed, perfect: sh.perfect || 0, auto: Math.round(autoShare * 100) / 100, late: sh.late, early, points: j ? Math.round(j.points) : 0, need, progress: j ? (j.level >= 4 ? 1 : cl(j.points / need, 0, 1)) : 0,
    nextTitle: N2 ? N2.title : null, nextNeeds: N2 ? Object.keys(N2.requires).filter(k => skill(k) < N2.requires[k]).map(k => `${cap(k)} ${N2.requires[k]}`) : [], promoted, day: sh.day };
  S.shift = null; ending = false; syncPlanner();
  G.emit('job:shift:end', sum); if (promoted) G.emit('job:promoted', job.id, promoted.level);
  const show = () => { if (reason === 'load') toast(`Shift at ${sum.venueName} wrapped up: ${fmt(pay)} paid.`, 'money'); else if (!quiet) UI.showResults(sum); else if (reason === 'left') toast('You left work early.'); };
  if (story() && story().shiftEnd) { try { story().shiftEnd(sum, show, quiet); } catch (e) { console.error(e); show(); } } else show();   /* a clock-out beat plays before the pay card */
  return sum;
}
function autoWork() {
  st(); const sh = S.shift; if (!sh || sh.auto) return false; if (G.busy) G.endActivity(false); const job = JOB_BY_ID[sh.jobId], left = sh.end - G.state.t; if (left <= 0) return false;
  WK.pause(true); sh.auto = true; G.emit('jobs:hud');
  G.startActivity({ label: 'Auto-working', anim: 'work', minutes: left, rate: WORK_RULES.autoWorkSpeed, jobAuto: true, hide: job.id === 'courier' && !atWork(job), done: () => { sh.auto = false; endShift('done'); }, cancel: () => { sh.auto = false; if (S.shift === sh && !ending) { WK.pause(false); G.emit('jobs:hud'); } } });
  return true;
}
function hud() {
  st(); const sh = S.shift; if (!sh) return null; const job = JOB_BY_ID[sh.jobId], j = S.job, now = G.state.t;
  return { jobId: job.id, title: job.levels[(j ? j.level : 1) - 1].title, venueName: vname(job), left: Math.max(0, Math.round(sh.end - now)), frac: cl((now - sh.in) / Math.max(1, sh.end - sh.in), 0, 1), bonus: sh.bonus, count: sh.count, auto: sh.auto, orders: WK.hud() || [], clock: G.now().clock || '' };
}

/* ---------- perks ---------- */
function discount(venueId) { st(); const d = S.job && DISCOUNTS.staff && DISCOUNTS.staff[S.job.id]; return d && d.venue === venueId ? d.mult : 1; }
function perks() { st(); const id = S.job && S.job.id; return { freeCoffee: id === 'barista' || id === 'office_analyst', freeGym: id === 'fitness_trainer', freeTransit: id === 'courier' && !!S.shift, freeCheckups: id === 'nurse', staffMeal: id === 'line_cook', fishingBonus: id === 'dock_worker' ? 1.2 : 1, libraryXp: id === 'librarian' ? 1.25 : 1 }; }
function perkTick() { if (S.job && S.job.id === 'fitness_trainer' && G.inv && G.inv.grant && !G.inv.hasAccess('gym')) G.inv.grant('gym', 1); }
function requestDayOff() { st(); const j = S.job, wk = Math.floor(today() / 7); if (!j || j.offWeek === wk) return false; const t = nextShiftT(); if (t === null) return false; j.off = Math.floor(t / DAY); j.offWeek = wk; syncPlanner(); toast('Day off booked. Enjoy it.', 'good'); return true; }

/* ---------- gigs ---------- */
const GIG = id => GIGS.find(g => g.id === id);
function gigPay(g) { const k = g.paySkill, over = cl(skill(k) - ((g.requires || {})[k] || 1), 0, 9); return Math.round(g.pay[0] + (g.pay[1] - g.pay[0]) * over / 9); }
function gigs(source = 'computer') {
  st(); const G0 = S.gigs, d = today(), n = G.now(); if (G0.day !== d) { G0.day = d; G0.count = 0; }
  return GIGS.filter(g => source !== 'phone' || g.source === 'phone').map(g => {
    const miss = Object.keys(g.requires || {}).filter(k => skill(k) < g.requires[k]), A = g.availability || { hours: [0, 24], days: [0, 1, 2, 3, 4, 5, 6] }; let why = '';
    if (S.shift) why = 'You are at work'; else if (G0.active) why = G0.active.id === g.id ? 'In progress' : 'Finish your current gig first'; else if (miss.length) why = 'Needs ' + miss.map(k => cap(k) + ' ' + g.requires[k]).join(', ');
    else if (G0.count >= GIG_RULES.maxPerDay) why = 'Enough gigs for today'; else if ((G0.cool[g.id] || 0) > G.state.t) why = `Back in ${Math.ceil((G0.cool[g.id] - G.state.t) / 60)} h`;
    else if (!A.days.includes(n.weekday)) why = 'Not offered today'; else if (n.hf < A.hours[0] || n.hf >= A.hours[1]) why = `Offered ${hh(A.hours[0])}-${hh(A.hours[1])}`;
    else if (g.source === 'phone' && G.weather && G.weather.current && /storm/.test(String((G.weather.current() || {}).kind || G.weather.current()))) why = 'Cancelled: storm';
    return Object.assign({}, g, { payNow: gigPay(g), ok: !why, why });
  });
}
function gigDone(g, pay) {
  S.gigs.active = null; WK.city.set('gig', null); if (dog) { dog.active = false; dog = null; } G.goals && G.goals.remove && G.goals.remove('job_gig');
  if (G.money) G.money.add(pay, 'Gig: ' + g.name); if (G.skills) for (const k in g.xp || {}) G.skills.addXp(k, g.xp[k]);
  if (G.needs) { for (const k in g.needs || {}) G.needs.add(k, g.needs[k]); if (g.fitness) try { G.needs.add('fitness', g.fitness); } catch (e) { /* optional */ } }
  S.stats.gigs++; S.stats.earned += pay; toast(`${g.name} done: ${fmt(pay)}`, 'money'); G.emit('job:gig:done', g.id, pay);
}
function gigTargets(g) { // the playable outdoor version: a short chain of city targets
  const w = WK.cityWorld(); if (!w) return null; const home = G.housing && G.housing.current && G.housing.current(), mine = home && home.door, per = n => Math.max(4, Math.round(g.minutes / n));
  const T = (p, label, anim, min) => ({ x: p.x, y: p.y, name: p.name || label, label, anim, min });
  const homes = (x, y) => WK.doorsNear(x, y, p => p.id.startsWith('door:home:') && p.id !== mine);
  if (g.id === 'gig_dog_walking') { const cx = 98, cy = 160, door = homes(cx, cy)[0], near = t => w.pois.filter(p => t(p)).map(p => ({ p, d: Math.hypot(p.x - cx, p.y - cy) })).filter(e => e.d < 60).sort((a, b) => a.d - b.d).map(e => e.p);
    const three = []; for (const p of [...near(p => p.type === 'spot'), ...near(p => p.type === 'bench')]) if (three.length < 3 && three.every(q => Math.hypot(q.x - p.x, q.y - p.y) > 9)) three.push(p); if (!door || three.length < 3) return null;
    return [T(door, 'Collect the dogs', 'talk', 4), ...three.map((p, i) => T({ x: p.x + .8, y: p.y + .8, name: 'Sniff spot ' + (i + 1) }, 'Let them sniff', 'stand', per(4))), T(door, 'Bring the dogs home', 'wave', 4)]; }
  if (g.id === 'gig_flyers') { const src = w.pois.find(p => p.id === 'door:pizza') || w.pois.find(p => p.type === 'door'); const doors = WK.doorsNear(src.x, src.y, p => p !== src).slice(0, 5); return [T(src, 'Pick up the flyers', 'talk', 4), ...doors.map(p => T(p, 'Post a flyer', 'wave', per(6)))]; }
  const door = homes(G.player.x, G.player.y)[G.scene && G.scene.id === 'city' ? 0 : 1] || homes(190, 190)[0]; return door ? [T(door, 'Assemble the wardrobe', g.anim || 'work', g.minutes)] : null;
}
function gigAim() { const a = S.gigs.active; if (!a || !a.targets) return WK.city.set('gig', null); const t = a.targets[a.i]; WK.city.set('gig', { x: t.x, y: t.y, name: t.name, label: t.label, color: '#8fd3c8', use: () => gigStep() });
  if (a.id === 'gig_dog_walking' && a.i > 0 && !dog && G.scene && G.scene.id === 'city') leashDog(); }
function leashDog() { try { if (dog || !S.gigs.active) return; const p = G.player, o = { active: true, side: 1, pet: null, get x() { return p.x; }, get y() { return p.y; }, get dir() { return p.dir; }, get moving() { return p.moving; } }; o.pet = leash(o); if (o.pet) dog = o; } catch (e) { /* no dog art: the walk still works */ } }
function gigStep(instant) {
  const a = S.gigs.active; if (!a) return; const g = GIG(a.id), t = a.targets[a.i];
  const fin = () => { if (S.gigs.active !== a) return; a.i++; if (a.i >= a.targets.length) return gigDone(g, a.pay); if (a.id === 'gig_dog_walking' && a.i === a.targets.length - 1 && dog) { /* keep the dog until home */ } gigAim(); toast(`${g.name}: ${a.targets[a.i].label} (${a.i}/${a.targets.length})`); };
  if (instant) return fin(); G.startActivity({ label: t.label, anim: t.anim, minutes: t.min, rate: t.min / Math.min(4, 1.5 + t.min * .03), done: fin });
}
function acceptGig(id, ctx) {
  const g = gigs('computer').find(x => x.id === id); if (!g || !g.ok) { if (g && g.why) toast(g.why + '.', 'bad'); return false; }
  const pay = g.payNow, G0 = S.gigs, begin = () => { G0.count++; G0.cool[id] = G.state.t + GIG_RULES.cooldownHoursPerGig * 60; G.emit('job:gig:start', id); };
  if (g.source === 'computer') { begin(); G0.active = { id, pay, desk: true };
    G.startActivity({ label: g.name, anim: g.anim || 'type', minutes: g.minutes, rate: g.minutes / 6, at: ctx && ctx.at ? ctx.at : undefined, done: () => gigDone(GIG(id), pay), cancel: () => { G0.active = null; toast('Gig abandoned. No pay.', 'bad'); } }); return true; }
  const targets = gigTargets(GIG(id)); if (!targets) { toast('That gig fell through. Try again later.', 'bad'); return false; }
  begin(); G0.active = { id, pay, targets, i: 0 }; gigAim(); toast(`${g.name}: ${targets[0].label} at ${targets[0].name}. Follow the marker.`, 'good');
  try { G.goals && G.goals.add({ id: 'job_gig', text: 'Gig: ' + g.name, group: 'opportunity', hint: 'Follow the teal marker in the city. Pays ' + fmt(pay) + ' when finished.' }); } catch (e) { /* optional */ }
  return true;
}
function cancelGig() { st(); if (!S.gigs.active) return false; S.gigs.active = null; WK.city.set('gig', null); if (dog) { dog.active = false; dog = null; } G.goals && G.goals.remove && G.goals.remove('job_gig'); toast('Gig cancelled.'); return true; }

/* ---------- debug / test hooks ---------- */
async function debugStart(jobId, level, opts) {   /* opts.story: clock in the way the player does (beat, card, pay card) */
  st(); const job = JOB_BY_ID[jobId]; if (!job) return false; quiet = !(opts && opts.story); if (S.shift) endShift('early'); dbg = true;
  if (!S.job || S.job.id !== jobId) { if (S.job) quit('switch'); S.job = { id: jobId, level: level || 1, points: 0, hiredDay: today(), from: G.state.t, shifts: 0, streak: 0, warnings: 0, lastDay: -1, offWeek: -1 }; syncPlanner(); G.emit('job:hired', jobId, S.job.level); }
  if (level) S.job.level = level;
  try { if (!atWork(job)) await G.go(roomOf(job)); } finally { dbg = false; }
  return clockIn(true, !!(opts && opts.story));
}
function debugFinish() { st(); const sh = S.shift; if (!sh) return null; if (G.busy) G.endActivity(false); WK.pause(true); sh.auto = true; G.advance(Math.max(1, Math.ceil(sh.end - G.state.t))); if (S.shift) endShift('done'); return S.last; }
async function debugGig(id) { const G0 = st().gigs; G0.count = 0; G0.cool = {}; const m0 = G.money ? G.money.get() : 0; if (!acceptGig(id)) return false; if (G.busy) { G.advance(G.busy.left); G.endActivity(true); } else while (S.gigs.active) gigStep(true); return (G.money ? G.money.get() : 0) - m0; }

export const order = 120;
export function init() {
  G.defineState('jobs', defaults); st(); WK.initWork();
  G.jobs = { listings, apply, quit: () => quit('quit'), current, onShift: () => !!st().shift, shift: () => st().shift, lastSummary: () => st().last, clockIn: () => clockIn(false), autoWork, leaveEarly: () => endShift('early'), requestDayOff,
    openBoard: ctx => UI.openBoard(ctx, 'jobs'), openGigs: ctx => UI.openBoard(ctx, 'gigs'), gigs, acceptGig, activeGig: () => st().gigs.active, cancelGig, discount, perks, hud, goStep: id => WK.goStep(id),
    debugStart, debugStep: () => WK.debugStep(), debugFinish, debugGig, roomOf, clockInNow: () => clockIn(true), job: id => JOB_BY_ID[id] || null, get quiet() { return quiet; }, set quiet(v) { quiet = !!v; }, SHIFT_SPEED, COURIER_SPEED };
  G.addSystem({ name: 'jobs', update(dt) { if (S && S.shift) WK.update(dt); } });
  G.on('minutes', onMinutes);
  G.on('day', () => { st(); syncPlanner(); perkTick(); });
  G.on('scene', () => { st(); WK.onScene(); const sh = S.shift;
    if (sh) { const job = JOB_BY_ID[sh.jobId]; if (job.id !== 'courier' && !atWork(job)) endShift('left'); else UI.showHud(); }
    else if (S.job && !dbg) clockIn(false);
    if (S.gigs.active && S.gigs.active.targets) gigAim(); });
  const recover = () => { st(); ending = false; WK.stop(); if (dog) { dog.active = false; dog = null; } if (S.shift) { if (G.busy && (G.busy.jobAuto || G.busy.jobTask)) G.endActivity(false); endShift('load'); } else UI.hideHud();
    if (S.gigs.active && S.gigs.active.desk) S.gigs.active = null; syncPlanner(); if (S.gigs.active) gigAim(); else WK.city.set('gig', null); };
  G.on('load', recover); G.on('ready', recover);
}
