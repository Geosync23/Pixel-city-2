// Alarm clock for the bed menus (owner: "keep those options and those recommendations, but at the bottom, you click a button and you can actually set the alarm
// clock to whatever time you want"). One shared picker used by every bed menu with sleep-until choices (sim/activities.js home beds, sim/hotel.js hotel bed).
//   ALARM_LABEL / ALARM_SUB                  the row's words ("Set the alarm…")
//   pickAlarm({ maxMin = 840 }) -> Promise<{ minutes, hour } | null>   a small window: hours +/- (1 h), minutes +/- (5 min), "Wake at HH:MM · sleeps X h Y min",
//        one plain line when a shift / planner appointment starts before (or soon after) that wake time (information only), then Sleep / Not yet.
//        Limits: at least 30 min of sleep, at most maxMin (14 h = the longest existing sleep-until option; the hotel passes the end of the stay too).
//        The chosen time is kept as the planner's wake-up alarm (G.planner.alarm(): saved with the game, also shown in the phone's My Schedule) and is the
//        picker's start value next time.
//   commitNote(fromT, untilT) -> '' | 'your shift starts at 07:00' | 'Dentist starts at 09:30'   the first work shift / timed planner entry in (fromT, untilT]
import { G } from '../core/game.js';
import { el, modal } from './kit.js';

export const ALARM_LABEL = 'Set the alarm…', ALARM_SUB = 'Wake at a time you choose';
const DAY = 1440, MIN = 30, LEAD = 45;   /* a commitment that starts less than LEAD min after the wake time is worth a line */
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const pad = n => String(n).padStart(2, '0');
const clock = m => { m = ((Math.round(m) % DAY) + DAY) % DAY; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
const len = m => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`; };

/** the first commitment (job shift or timed planner entry) that starts after fromT and no later than untilT: { t, shift, title } | null */
export function firstCommit(fromT, untilT) {
  const out = [], jb = safe(() => G.jobs.current(), null);
  if (jb && isFinite(jb.nextShift) && jb.nextShift > fromT && jb.nextShift <= untilT) out.push({ t: jb.nextShift, shift: true });
  for (const a of safe(() => G.planner.list(fromT, untilT + 1), [])) if (a && !a.flex && !a.pin && !a.event && (a.s || 0) < 2 && a.t > fromT && a.t <= untilT) out.push({ t: a.t, shift: a.kind === 'work', title: a.title });
  return out.sort((a, b) => a.t - b.t)[0] || null;
}
/** a plain note for a bed-menu row, '' when nothing is due */
export function commitNote(fromT, untilT, cap) {
  const c = firstCommit(fromT, untilT); if (!c) return '';
  const s = c.shift ? `your shift starts at ${clock(c.t)}` : `${c.title || 'an appointment'} starts at ${clock(c.t)}`;
  return cap ? s[0].toUpperCase() + s.slice(1) : s;
}

/** the time picker. Resolves { minutes, hour } (the sleep length and the wake time as a decimal hour) or null */
export function pickAlarm(opts = {}) {
  return new Promise(res => {
    const t0 = G.state.t, now = ((t0 % DAY) + DAY) % DAY, max = Math.max(MIN, Math.min(840, opts.maxMin || 840));
    const dur = w => ((w - now) % DAY + DAY) % DAY, ok = w => dur(w) >= MIN && dur(w) <= max;
    const lo = Math.ceil((now + MIN) / 5) * 5 % DAY, hi = Math.floor((now + max) / 5) * 5 % DAY;   /* the earliest / latest wake minute on the 5-min grid */
    const saved = safe(() => G.planner.alarm(), null), st = (saved !== null && isFinite(saved) ? Math.round(saved * 12) * 5 : 420) % DAY;
    let w = ok(st) ? st : dur(st) < MIN ? lo : hi, done = false;
    const m = modal({ title: 'Set the alarm', cls: 'alarm-win', onClose: () => { if (!done) res(null); } });
    const hh = el('b.al-num'), mm = el('b.al-num'), line = el('p.al-line'), warn = el('p.al-warn');
    const step = d => { const n = (w + d + DAY) % DAY; w = ok(n) ? n : d < 0 ? lo : hi; draw(); };
    const btn = (txt, d, lab) => el('button.al-btn', { text: txt, 'aria-label': lab, onclick: () => step(d) });
    const hUp = btn('+', 60, 'One hour later'), hDn = btn('−', -60, 'One hour earlier'), mUp = btn('+', 5, 'Five minutes later'), mDn = btn('−', -5, 'Five minutes earlier');
    const go = el('button.al-go', { text: 'Sleep', onclick: () => { done = true; safe(() => G.planner.setAlarm(w / 60)); m.close(); res({ minutes: dur(w), hour: w / 60 }); } });
    function draw() {
      const d = dur(w); hh.textContent = pad(Math.floor(w / 60)); mm.textContent = pad(w % 60);
      line.textContent = `Wake at ${clock(w)} · sleeps ${len(d)}`;
      const n = commitNote(t0, t0 + d + LEAD, true); warn.textContent = n; warn.style.display = n ? '' : 'none';
      hDn.disabled = mDn.disabled = w === lo; hUp.disabled = mUp.disabled = w === hi;
    }
    m.body.append(el('p.menu-text', { text: opts.text || 'Wind the old clock: when should it ring?' }),
      el('div.al-dial', null, el('div.al-col', null, hUp, hh, hDn), el('b.al-colon', { text: ':' }), el('div.al-col', null, mUp, mm, mDn)),
      line, warn, el('div.al-act', null, go, el('button', { text: 'Not yet', onclick: () => m.close() })));
    draw();
  });
}
