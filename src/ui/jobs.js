// ui/jobs.js — windows for the jobs system (sim/jobs.js): job board + gigs, shift HUD with tickets, micro-interactions, results card.
// Styles: jobs.css. Everything talks to the sim through G.jobs.
//   openBoard(ctx?, tab = 'jobs'|'gigs') -> modal        showHud() / hideHud() / refreshHud()        showResults(summary) -> modal
//   mini(spec) -> Promise<quality 0..1 | null (closed)>   pauses the game while open. spec.kind:
//     'pick'  { title, prompt, need?: [labels shown as the ticket], options: [labels], answer: [indices], ordered?, wide? }
//     'meter' { title, prompt, label, mode: 'timing' (marker sweeps, tap to stop) | 'hold' (hold to fill, release to stop), zone: [a, b] }
//     'taps'  { title, prompt, mode: 'belt' (tap each sliding item; labels) | 'mash' (tap/press keys n times; label, n) }
import { G } from '../core/game.js';
import { el, modal, toast, root } from './kit.js';

function css() { if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/jobs.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/jobs.css' })); }
const $ = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
const cap = s => s[0].toUpperCase() + s.slice(1);
const hm = m => { m = Math.max(0, Math.round(m)); return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : m + ' min'; };

/* ---------- job board ---------- */
export function openBoard(ctx, tab = 'jobs') {
  css(); const J = G.jobs, m = modal({ title: 'Maple Bay Job Board', cls: 'jobwin' });
  const draw = () => {
    m.body.textContent = ''; const cur = J.current();
    m.body.append(el('div.jb-tabs', null, ...[['jobs', 'Careers'], ['gigs', 'Quick gigs']].map(([id, name]) => el('button' + (tab === id ? '.on' : ''), { text: name, onclick: () => { tab = id; draw(); } }))));
    if (tab === 'jobs') {
      if (cur) m.body.append(el('div.jb-cur', null, el('b', { text: `You: ${cur.title} at ${cur.venueName}` }), el('small', { text: ` level ${cur.level} of 4. Taking another job replaces this one.` })));
      for (const L of J.listings('computer')) m.body.append(jobCard(L, draw));
    } else {
      const a = J.activeGig(); if (a) m.body.append(el('div.jb-cur', null, el('b', { text: 'Gig in progress' }), el('button.jb-sm', { text: 'Cancel it', onclick: () => { J.cancelGig(); draw(); } })));
      m.body.append(el('p.jb-note', { text: 'One-off paid tasks. No commitment, up to two a day.' }));
      for (const g of J.gigs('computer')) m.body.append(gigCard(g, ctx, m));
    }
  };
  draw(); return m;
}
function jobCard(L, redraw) {
  const J = G.jobs;
  return el('div.jb-card' + (L.mine ? '.mine' : ''), null,
    el('div.jb-top', null, el('div', null, el('b.jb-name', { text: L.name }), el('span.jb-venue', { text: L.venueName })), el('b.jb-pay', { text: $(L.hourly) + '/h' + (L.tips ? ' + tips' : '') })),
    el('small.jb-when', { text: `${L.days} · ${L.hours} · starts as ${L.title}` }),
    el('p', { text: L.blurb }),
    el('div.jb-reqs', null, L.reqs.length ? L.reqs.map(r => el('span.jb-req.' + (r.met ? 'ok' : 'no'), { text: `${r.met ? '✓' : '✗'} ${cap(r.skill)} ${r.need}${r.have < r.need ? ' (you: ' + r.have + ')' : ''}` })) : el('span.jb-req.ok', { text: '✓ No requirements' })),
    el('small.jb-perk', { text: 'Perk: ' + L.perk }),
    el('div.jb-act', null, L.note ? el('small', { text: L.note }) : null,
      L.mine ? [el('span.jb-req.ok', { text: 'Your job' }), el('button.jb-sm', { text: 'Quit', onclick: e => { if (e.target.dataset.sure) { J.quit(); redraw(); } else { e.target.dataset.sure = 1; e.target.textContent = 'Sure? Tap again'; } } })]
        : el('button.jb-apply', { text: 'Apply', onclick: () => { J.apply(L.id); redraw(); } })));
}
function gigCard(g, ctx, m) {
  const req = Object.keys(g.requires || {});
  return el('div.jb-card', null,
    el('div.jb-top', null, el('div', null, el('b.jb-name', { text: g.name }), el('span.jb-venue', { text: g.source === 'computer' ? 'At this computer' : 'Out in the city' })), el('b.jb-pay', { text: $(g.payNow) })),
    el('small.jb-when', { text: `${hm(g.minutes)}${req.length ? ' · needs ' + req.map(k => cap(k) + ' ' + g.requires[k]).join(', ') : ''}` }),
    el('p', { text: g.blurb }),
    el('div.jb-act', null, g.why ? el('small', { text: g.why }) : null, el('button.jb-apply', { text: 'Take gig', disabled: g.ok ? undefined : true, onclick: () => { if (!g.ok) return; m.close(); G.jobs.acceptGig(g.id, ctx); } })));
}

/* ---------- shift HUD ---------- */
let hud = null, refs = null, timer = 0, sig = '', off = null;
const sigOf = d => d.orders.map(o => o.id + ':' + o.steps.findIndex(s => s.cur)).join(',') + (d.auto ? 'A' : '');
export function showHud() { css(); if (!hud) { hud = el('div', { id: 'jobhud' }); root().append(hud); } build(); if (!timer) timer = setInterval(tick, 400); if (!off) off = G.on('jobs:hud', () => hud && build()); }
export function hideHud() { if (hud) hud.remove(); hud = null; refs = null; clearInterval(timer); timer = 0; if (off) { off(); off = null; } }
export function refreshHud() { if (hud) build(); }
function build() {
  const d = G.jobs && G.jobs.hud(); if (!d) return; sig = sigOf(d); hud.textContent = ''; refs = { pats: [], lefts: [] };
  hud.append(el('div.jh-head', null, el('b', { text: d.title }), refs.left = el('span')), el('div.jh-bar', null, refs.bar = el('i')), refs.info = el('small.jh-info'));
  if (d.auto) hud.append(el('div.jh-auto', { text: 'Auto-working... the shift is fast-forwarding.' }));
  for (const [i, o] of d.orders.entries()) {
    const pat = o.pat !== null ? el('div.jh-pat', null, el('i')) : null; refs.pats.push(pat);
    hud.append(el('div.jh-tk' + (i ? '.rest' : ''), { onclick: () => G.jobs.goStep(o.id) }, el('b', { text: o.title }), pat,
      el('div.jh-steps', null, o.steps.map(s => { const c = el('span' + (s.done ? '.d' : s.cur ? '.c' : ''), null, s.color ? el('i.jh-dot', { style: { background: s.color } }) : null, (s.done ? '✓ ' : '') + s.name + (s.hint ? ' → ' + s.hint : '')); if (s.cur && s.left !== null) { const t = el('em'); c.append(t); refs.lefts.push([t, o.id]); } return c; }))));
  }
  let sure = 0;
  hud.append(el('div.jh-btns', null,
    d.auto ? el('button', { text: 'Take over', onclick: () => G.busy && G.busy.jobAuto && G.endActivity(false) }) : el('button', { text: 'Auto-work', title: 'Fast-forward the rest of the shift at a steady pace', onclick: () => G.jobs.autoWork() }),
    el('button.jh-end', { text: 'End shift early', onclick: e => { if (sure) G.jobs.leaveEarly(); else { sure = 1; e.target.textContent = 'Sure? (pay cut)'; setTimeout(() => { sure = 0; if (e.target.isConnected) e.target.textContent = 'End shift early'; }, 2500); } } })));
  tick();
}
function tick() {
  if (!hud || !refs) return; const d = G.jobs && G.jobs.hud(); if (!d) return hideHud(); if (sigOf(d) !== sig) return build();
  refs.left.textContent = hm(d.left) + ' left'; refs.bar.style.width = Math.round(d.frac * 100) + '%'; refs.info.textContent = `${d.count} task${d.count === 1 ? '' : 's'} done · bonuses ${$(Math.round(d.bonus * 4) / 4)}`;
  d.orders.forEach((o, i) => { const p = refs.pats[i]; if (p && o.pat !== null) { p.firstChild.style.width = Math.round(o.pat * 100) + '%'; p.className = 'jh-pat' + (o.pat < .25 ? ' low' : o.pat < .5 ? ' mid' : ''); } });
  for (const [t, id] of refs.lefts) { const o = d.orders.find(x => x.id === id), s = o && o.steps.find(x => x.cur); if (s && s.left !== null) t.textContent = s.left >= 0 ? ` ${s.left} min` : ' late'; }
}

/* ---------- results card ---------- */
export function showResults(s) {
  css(); const m = modal({ title: s.promoted ? 'Promoted!' : s.early ? 'Shift ended early' : 'Shift complete', cls: 'jobwin jobres' }), row = (a, b, cls) => el('div.jr-row' + (cls ? '.' + cls : ''), null, el('span', { text: a }), el('b', { text: b }));
  m.body.append(
    el('div.jr-head', null, el('b', { text: `${s.title} · ${s.venueName}` }), el('div.jr-stars', null, [0, 1, 2, 3, 4].map(i => el('span' + (i < s.stars ? '.on' : ''), { text: '★' }))), el('small', { text: `${s.band} (${s.score}/100)${s.late ? ' · clocked in late' : ''}${s.auto > .05 ? ` · ${Math.round(s.auto * 100)}% auto-worked` : ''}` })),
    row('Tasks done', `${s.tasks}${s.perfect ? ` (${s.perfect} perfect)` : ''}${s.missed ? ` · ${s.missed} missed` : ''}`),
    row(`Wages: ${s.hours} h × ${$(s.hourly)}${s.payMult !== 1 ? ' × ' + s.payMult : ''}`, $(s.base)),
    row('Task bonuses', $(s.bonus)), ...(s.tips ? [row('Tips', $(s.tips))] : []), row('Paid to your account', $(s.pay), 'total'));
  if (s.promoted) m.body.append(el('div.jr-promo', null, el('b', { text: `You are now ${s.promoted.title}!` }), el('small', { text: `${$(s.promoted.hourly)}/h from today · bonus ${$(s.promoted.bonus)}${s.promoted.unlocks.length ? ' · new: ' + s.promoted.unlocks.join(', ') : ''}` })));
  if (s.nextTitle) m.body.append(el('div.jr-prog', null, el('small', { text: `Promotion to ${s.nextTitle}: ${s.points} / ${s.need}${s.nextNeeds.length ? ' · also needs ' + s.nextNeeds.join(', ') : ''}` }), el('div.jh-bar', null, el('i', { style: { width: Math.round(s.progress * 100) + '%' } }))));
  else if (!s.promoted) m.body.append(el('small', { text: 'Top of the ladder. Nothing left to prove.' }));
  m.body.append(el('div.jb-act', null, el('button.jb-apply', { text: 'Clock out', onclick: () => m.close() })));
  return m;
}

/* ---------- micro-interactions ---------- */
export function mini(spec) {
  css();
  return new Promise(res => {
    let over = false; const stops = [];
    const end = q => { if (over) return; over = true; stops.forEach(f => f()); res(q); m.close(); };
    const m = modal({ title: spec.title || 'Work', cls: 'jobmini', onClose: () => { if (!over) { over = true; stops.forEach(f => f()); res(null); } } });
    const flash = q => { if (over) return; stops.forEach(f => f()); stops.length = 0; m.body.append(el('div.jm-res.' + (q >= .99 ? 'ok' : q >= .5 ? 'mid' : 'no'), { text: q >= .99 ? 'Perfect!' : q >= .5 ? 'Close enough.' : 'Oops. It will do.' })); const t = setTimeout(() => end(q), 520); stops.push(() => clearTimeout(t)); };
    if (spec.prompt) m.body.append(el('p.jm-prompt', { text: spec.prompt }));
    if (spec.kind === 'pick') {
      const sel = [], A = spec.answer, btns = []; let locked = false;
      if (spec.need && A.length > 1) m.body.append(el('div.jm-need', null, spec.need.map((n, i) => el('span', { text: (spec.ordered ? (i + 1) + '. ' : '') + n }))));
      m.body.append(el('div.jm-grid' + (spec.wide ? '.wide' : ''), null, spec.options.map((o, i) => { const b = el('button', { text: o, onclick: () => {
        if (locked) return; const k = sel.indexOf(i); if (k >= 0) { sel.splice(k, 1); b.classList.remove('on'); return; } sel.push(i); b.classList.add('on'); if (sel.length < A.length) return; locked = true;
        const set = A.every(a => sel.includes(a)), exact = set && (!spec.ordered || A.every((a, j) => sel[j] === a)), hit = A.filter(a => sel.includes(a)).length;
        btns.forEach((x, j) => { if (A.includes(j)) x.classList.add('right'); else if (sel.includes(j)) x.classList.add('wrong'); }); flash(exact ? 1 : set ? .6 : .45 * hit / A.length); } }); btns.push(b); return b; })));
    } else if (spec.kind === 'meter') {
      const z = spec.zone || [.56, .84], hold = spec.mode === 'hold', cur = el('i.cur' + (hold ? '.fill' : '')), bar = el('div.jm-bar', null, el('i.zone', { style: { left: z[0] * 100 + '%', width: (z[1] - z[0]) * 100 + '%' } }), cur); let v = 0, dir = 1, held = false, done = false;
      const judge = () => { if (done) return; done = true; flash(v >= z[0] && v <= z[1] ? 1 : Math.min(Math.abs(v - z[0]), Math.abs(v - z[1])) < .12 ? .6 : .3); };
      const iv = setInterval(() => { if (done) return; if (!hold) { v += dir * .02; if (v >= 1) { v = 1; dir = -1; } else if (v <= 0) { v = 0; dir = 1; } } else if (held) { v = Math.min(1, v + .015); if (v >= 1) judge(); } cur.style[hold ? 'width' : 'left'] = v * 100 + '%'; }, 30); stops.push(() => clearInterval(iv));
      const b = el('button.jm-big', { text: spec.label || (hold ? 'Hold' : 'Now!') });
      if (hold) { b.onpointerdown = e => { e.preventDefault(); held = true; }; const up = () => { if (held) { held = false; judge(); } }; b.onpointerup = up; b.onpointerleave = up; b.onpointercancel = up; } else b.onclick = judge;
      m.body.append(bar, b);
    } else {
      const t0 = performance.now();
      if (spec.mode === 'belt') { let n = 0; const L = spec.labels;
        m.body.append(el('div.jm-belt', null, L.map((x, i) => { const c = el('button', { text: x, style: { animationDelay: i * .28 + 's' }, onclick: () => { if (c.classList.contains('on')) return; c.classList.add('on'); if (++n >= L.length) flash((performance.now() - t0) / 1000 < 2.2 + L.length * 1.1 ? 1 : .7); } }); return c; })));
      } else { let n = 0; const N = spec.n || 8, fillEl = el('i.cur.fill'), b = el('button.jm-big', { text: spec.label || 'Tap' }), hit = () => { if (n >= N) return; n++; fillEl.style.width = n / N * 100 + '%'; b.classList.toggle('alt'); if (n >= N) flash(1); };
        b.onclick = hit; const key = e => { if (e.key !== 'Escape' && !e.repeat) hit(); }; window.addEventListener('keydown', key); stops.push(() => window.removeEventListener('keydown', key));
        m.body.append(el('div.jm-bar', null, fillEl), b); }
    }
  });
}
export { toast };
