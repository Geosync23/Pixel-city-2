// Phone app: REEL (app id 'reel') — watch movies and shows. Rules, state and prices: src/sim/media.js + src/data/media.js (REEL CONTENT RULES).
// Films are drawn live in code (src/sim/_media_films.js + the Orpheum's src/sim/_shows_films.js) on a 112x64 frame.
//   On Reel            phone & TV-only shows (free, released on a calendar): cooking show, nature short, cartoon, documentary, music video, a 4-part serial.
//   Your films         cinema films you have bought. A film reaches Reel only after you have SEEN it at the Orpheum; about two game days later it
//                      appears under "Now available to own" (notification) for a small price.
//   In cinemas now     films you have not seen: discreet rows with the next showtime and Take me there. They cannot be played or bought.
//   Player             landscape letterbox in the portrait phone, play / pause / scrub / restart, rotate to fullscreen, Continue watching, Up next.
//   Home TV            the same library streams on your TV at home: tap the TV -> "Stream on Reel" (activity 'stream_reel', registered by
//                      media.js). A picture-in-picture screen shows the film while you sit on the sofa, at the normal TV fun rate.
// Deep link: G.phone.open('reel', { film: id }).      G.reel = { play(id) (open the phone player), tv() -> state of the home TV stream | null }
import { G } from '../core/game.js';
import { el, iconEl, btn, section, chip, empty, safe, money, when } from './phone_util.js';
import { toast, root } from './kit.js';
import { regDef, goTo } from './phone_store.js';
import { injectMediaCss, screenBar, onTick } from './phone_reader.js';
import { TUNE } from '../data/media.js';
import { paint, thumbOf, FW, FH } from '../sim/_media_films.js';
import { AU, unlock, play as playScore, sfx } from '../sim/_shows_audio.js';
import { score } from '../sim/_shows_music.js';
export const order = 127;
const M = () => G.media;
const genre = f => f.genre || (/^([A-Z][a-z-]+)\./.exec(f.blurb || '') || [0, 'Film'])[1];
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const dayName = d => { const k = d - Math.floor(G.state.t / 1440); return k <= 0 ? 'today' : k === 1 ? 'tomorrow' : `in ${k} days`; };
function thumb(f, w = 84) { const c = document.createElement('canvas'); c.width = FW; c.height = FH; c.className = 'pix md-thumb'; c.style.width = w + 'px'; c.style.height = Math.round(w * FH / FW) + 'px'; safe(() => c.getContext('2d').drawImage(thumbOf(f), 0, 0), 0); return c; }

/* ---------- soundtrack (shared by the phone player and the TV stream); silent and safe without an audio device ---------- */
function track(f) {
  let h = null; const start = () => { stop(); try { unlock(); if (AU.ctx && f.score) h = playScore(score(f.score), { gain: .8 }); } catch (e) { h = null; } }, stop = () => { try { if (h) h.stop(.15); } catch (e) { /* no audio */ } h = null; };
  let ci = 0;
  return { start, stop, seek(t) { ci = (f.cues || []).findIndex(c => c[0] > t); if (ci < 0) ci = (f.cues || []).length; if (h) start(); }, pump(t) { try { if (h) h.pump(t); const C = f.cues || []; while (ci < C.length && C[ci][0] <= t) { const k = C[ci++][1]; if (k === 'laugh' || k === 'gasp') sfx(k, 1, .5); } } catch (e) { /* no audio */ } } };
}

/* ---------- home ---------- */
function filmRow(x, ctx, right) {
  const f = x.film;
  return el('div.md-film', null, el('button.md-film-main', { 'aria-label': `Play ${f.title}`, onclick: () => openFilm(ctx, f.id) }, thumb(f),
    el('span.md-film-m', null, el('b', { text: f.title }), el('small', { text: `${genre(f)} · ${mmss(f.dur)}` }),
      x.pos > 1 ? el('span.md-prog', null, el('i', { style: { width: Math.round(x.pos / f.dur * 100) + '%' } })) : null)),
    right || (x.isNew ? el('em.md-tag.new', { text: 'NEW' }) : x.done ? el('em.md-tag.ok', { text: 'Seen' }) : null));
}
function home(b, ctx) {
  injectMediaCss(); b.classList.add('md-body');
  const a = ctx.arg; if (a && a.film) { const id = a.film; a.film = null; if (M().canPlay(id)) setTimeout(() => openFilm(ctx, id), 0); }
  const L = M().films(), playable = L.filter(x => x.canPlay), nx = M().next(), cont = nx && L.find(x => x.film.id === nx.id && x.pos > 1);
  b.append(screenBar('watch'));
  if (cont) b.append(section('Continue watching'), el('button.md-cont.film', { onclick: () => openFilm(ctx, cont.film.id) }, thumb(cont.film, 112), el('span', null, el('b', { text: cont.film.title }), el('small', { text: `${mmss(cont.pos)} of ${mmss(cont.film.dur)}` }), el('span.md-prog', null, el('i', { style: { width: Math.round(cont.pos / cont.film.dur * 100) + '%' } }))), el('em', { text: 'Play' })));
  // phone & TV-only shows
  const tv = L.filter(x => x.tv), free = tv.filter(x => x.state === 'free');
  b.append(section('On Reel', chip('Free')));
  for (const x of free.filter(q => !q.film.serial)) b.append(filmRow(x, ctx));
  const serials = [...new Set(tv.filter(x => x.film.serial).map(x => x.film.serial.id))];
  for (const sid of serials) {
    const eps = tv.filter(x => x.film.serial && x.film.serial.id === sid), out = eps.filter(x => x.state === 'free'), soon = eps.find(x => x.state === 'soon');
    if (!out.length) continue;
    b.append(el('div.md-serial', null, el('b', { text: eps[0].film.serial.name }), el('small', { text: `Serial · ${out.length} of ${eps.length} episodes out` })));
    for (const x of out) b.append(filmRow(x, ctx));
    if (soon) b.append(el('div.md-soon', { text: `Episode ${soon.film.serial.ep} arrives ${dayName(soon.day)}.` }));
  }
  const later = tv.filter(x => x.state === 'soon' && !x.film.serial);
  if (later.length) b.append(el('div.md-soon', { text: `Coming up: ${later.map(x => `${x.film.title} (${dayName(x.day)})`).join(', ')}.` }));
  // cinema films
  const owned = L.filter(x => x.state === 'owned'), buy = L.filter(x => x.state === 'buy'), wait = L.filter(x => x.state === 'wait'), cin = L.filter(x => x.state === 'cinema');
  if (owned.length) { b.append(section('Your films', chip(String(owned.length)))); for (const x of owned) b.append(filmRow(x, ctx)); }
  if (buy.length) {
    b.append(section('Now available to own'));
    for (const x of buy) b.append(el('div.md-film.buy', null, el('div.md-film-main', null, thumb(x.film), el('span.md-film-m', null, el('b', { text: x.film.title }), el('small', { text: `${genre(x.film)} · seen at the Orpheum` }))),
      btn(money(TUNE.REEL.price), () => { if (M().buyFilm(x.film.id)) { toast(`${x.film.title} is yours. Watch it here or on your TV at home.`, 'good', 3200); ctx.refresh(); } }, 'gold md-buy')));
  }
  if (wait.length) for (const x of wait) b.append(el('div.md-soon', { text: `${x.film.title}: you saw it at the Orpheum. It arrives here to own ${x.buyT ? when(x.buyT).toLowerCase() : 'soon'}.` }));
  if (cin.length) {
    b.append(section('In cinemas now'), el('p.md-note', { text: 'See it at the Orpheum first. A couple of days later it turns up here to own.' }));
    for (const x of cin) b.append(el('div.md-cin', null, el('span', null, el('b', { text: x.film.title }), el('small', { text: `${genre(x.film)} · ${x.next ? 'next showing ' + when(x.next.t).toLowerCase() : 'see the box office for times'}` })),
      el('button.md-go', { 'aria-label': `Take me to the Orpheum for ${x.film.title}`, onclick: () => goTo('cinema', ctx, 'The Orpheum') }, iconEl('ui.pin', 1), el('span', { text: 'Take me there' }))));
  }
  b.append(el('p.md-note', { text: `${playable.length} to watch. On the big screen: at home, tap your TV and choose Stream on Reel.` }));
}

/* ---------- player ---------- */
let live = null;   // the phone player that is running (for G.reel and the fullscreen layer)
function openFilm(ctx, id) { const f = M().film(id); if (!f) return; if (!M().canPlay(id)) return toast(M().filmState(id) === 'buy' ? 'Buy it first: it is under Now available to own.' : 'Not on Reel yet. See it at the Orpheum first.'); ctx.push(f.title, (b, c) => player(b, c, id), 'film:' + id); }
function player(b, ctx, id) {
  injectMediaCss(); const f = M().film(id); if (!f || !M().canPlay(id)) { b.append(empty('ui.lock', 'Not available', 'This one is not in your Reel library.')); return; }
  b.classList.add('md-body', 'md-player'); const mine = M().begin('reel', id);
  const st = safe(() => M().films().find(x => x.film.id === id), null) || { pos: 0 }; let t = st.pos > 1 && st.pos < f.dur - 2 ? st.pos : 0, playing = true, ended = false, saved = 0, full = null, lastFrame = -1;
  const cv = el('canvas.pix.md-cv', { width: FW, height: FH }), g = cv.getContext('2d'), tr = track(f);
  const stage = el('div.md-stage', null, cv), over = el('div.md-over'), fill = el('i'), knob = el('u'), scrub = el('div.md-scrub', { role: 'slider', 'aria-label': 'Seek' }, fill, knob), time = el('span.md-time');
  const playB = el('button.md-pp', { 'aria-label': 'Play or pause', onclick: () => toggle() }), restart = el('button.md-ctl', { 'aria-label': 'Restart', text: '|<', onclick: () => seek(0, true) }), fullB = el('button.md-ctl', { 'aria-label': 'Rotate to fullscreen', onclick: () => goFull() }, el('span', { text: 'Rotate' }));
  const draw = () => { paint(f, g, t); if (full) full.g.drawImage(cv, 0, 0); };
  const ui = () => { const k = Math.min(1, t / f.dur); fill.style.width = knob.style.left = (k * 100).toFixed(2) + '%'; time.textContent = `${mmss(t)} / ${mmss(f.dur)}`; playB.textContent = ended ? 'Replay' : playing ? 'Pause' : 'Play'; if (full) { full.fill.style.width = (k * 100).toFixed(2) + '%'; full.pp.textContent = playB.textContent; full.time.textContent = time.textContent; } };
  function toggle() { if (ended) return seek(0, true); playing = !playing; if (playing) { tr.start(); tr.seek(t); } else { tr.stop(); M().watched(id, t, f.dur); } ui(); }
  function seek(nt, play) { t = Math.max(0, Math.min(f.dur - .05, nt)); if (ended) { ended = false; over.replaceChildren(); over.classList.remove('on'); } if (play) playing = true; if (playing) tr.start(); tr.seek(t); draw(); ui(); }
  function finish() {
    ended = true; playing = false; tr.stop(); M().watched(id, f.dur, f.dur, 'phone'); const s = M().session(), nx = M().next(id);
    over.classList.add('on'); over.replaceChildren(el('b', { text: 'The end' }), el('small', { text: s ? `Fun +${s.fun.toFixed(1)} · ${Math.round(s.minutes)} min` : '' }),
      el('div.md-acts', null, btn('Replay', () => seek(0, true)), nx && nx.id !== id ? btn('Next: ' + (nx.serial ? `Episode ${nx.serial.ep}` : nx.title), () => { exitFull(); ctx.back(); setTimeout(() => openFilm(ctx, nx.id), 30); }, 'pri') : null));
    ui();
  }
  const scrubTo = e => { const q = scrub.getBoundingClientRect(); seek((e.clientX - q.left) / q.width * f.dur); };
  let drag = false; scrub.addEventListener('pointerdown', e => { drag = true; try { scrub.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ } scrubTo(e); }); scrub.addEventListener('pointermove', e => { if (drag) scrubTo(e); }); for (const ev of ['pointerup', 'pointercancel']) scrub.addEventListener(ev, () => { drag = false; });
  stage.addEventListener('click', () => toggle());
  /* fullscreen: a layer over the whole game, rotated 90 degrees on a portrait screen so the film fills it sideways */
  function goFull() {
    if (full) return; const c2 = el('canvas.pix', { width: FW, height: FH }), fl = el('i'), pp = el('button', { onclick: e => { e.stopPropagation(); toggle(); } }), tm = el('span'), sb = el('div.md-fs-scrub', null, fl);
    const box = el('div.md-fs-box', null, c2, el('div.md-fs-bar', null, pp, sb, tm, el('button', { text: 'Exit', onclick: e => { e.stopPropagation(); exitFull(); } })));
    const layer = el('div', { id: 'reel-fs', onclick: () => layer.classList.toggle('hide') }, box);
    sb.addEventListener('click', e => { e.stopPropagation(); const q = sb.getBoundingClientRect(), rot = layer.classList.contains('rot'); seek((rot ? (e.clientY - q.top) / q.height : (e.clientX - q.left) / q.width) * f.dur); });
    const fit = () => { const W = innerWidth, H = innerHeight, rot = H > W, lw = rot ? H : W, lh = rot ? W : H, k = Math.max(1, Math.min(lw / FW, (lh - 0) / FH)); layer.classList.toggle('rot', rot); box.style.width = lw + 'px'; box.style.height = lh + 'px'; c2.style.width = Math.floor(FW * k) + 'px'; c2.style.height = Math.floor(FH * k) + 'px'; };
    document.body.append(layer); full = { layer, g: c2.getContext('2d'), fill: fl, pp, time: tm, fit }; fit(); addEventListener('resize', fit); draw(); ui();
  }
  function exitFull() { if (!full) return; removeEventListener('resize', full.fit); full.layer.remove(); full = null; }
  b.append(stage, el('div.md-ctrls', null, playB, restart, scrub, time, fullB), over,
    el('div.md-about', null, el('b', { text: f.title }), el('small', { text: `${genre(f)} · ${mmss(f.dur)} · costs ${TUNE.FILM_MINUTES} min of your day` }), el('p', { text: f.blurb })),
    ...(f.teaches && !safe(() => G.cooking.knows(f.teaches), true) ? [el('p.md-note', { text: 'Watch to the end to learn the recipe.' })] : []));
  tr.start(); tr.seek(t); draw(); ui(); live = { id, state: () => ({ id, t, playing, ended, full: !!full }), toggle, seek, goFull, exitFull };
  onTick(b, dt => {
    if (playing && !ended) {
      const d = Math.min(dt, f.dur - t); t += d; M().spend('watch', TUNE.FILM_MINUTES / f.dur * d); tr.pump(t);
      if (t >= f.dur - .02) finish(); else if (t - saved > 2 || t < saved) { saved = t; M().watched(id, t, f.dur); }
    }
    const fr = Math.floor(t * 20); if (fr !== lastFrame) { lastFrame = fr; draw(); } ui();
  }, () => { tr.stop(); exitFull(); if (!ended && t > 1) M().watched(id, t, f.dur); if (M().session() === mine) M().end(); if (live && live.id === id) live = null; });
}

/* ---------- Reel on the home TV (activity 'stream_reel') ---------- */
let tv = null;
function tvStop() { if (!tv) return; tv.tr.stop(); tv.box.remove(); tv = null; }
function tvStart(ctx) {
  tvStop(); const act = G.busy; if (!act) return; const want = ctx && ctx.film ? M().film(ctx.film) : null, f = want && M().canPlay(want.id) ? want : M().next();
  if (!f) { toast('Nothing in your Reel library yet.', 'info'); return; }
  injectMediaCss(); act.rate = TUNE.FILM_MINUTES / f.dur; act.label = 'Reel: ' + f.title; safe(() => G.hud.refresh && G.hud.refresh(), 0);
  const cv = el('canvas.pix', { width: FW, height: FH }), title = el('b', { text: f.title }), L = M().films().filter(x => x.canPlay);
  const swap = id => { const fx = ctx && ctx.fx; setTimeout(() => safe(() => G.activities.start('stream_reel', { fx, film: id, force: true, quiet: true, noSummary: true }), 0), 0); };
  const pick = el('select.md-tv-pick', { 'aria-label': 'Choose what to watch', onchange: e => swap(e.target.value) }, L.map(x => el('option', { value: x.film.id, text: x.film.title, selected: x.film.id === f.id })));
  const box = el('div', { id: 'reel-tv' }, el('div.md-tv-head', null, iconEl('app.reel', 1), title, el('button', { text: 'Next', 'aria-label': 'Next show', onclick: () => { const n = M().next(f.id); if (n) swap(n.id); } })), cv, pick);
  root().append(box); tv = { f, act, box, g: cv.getContext('2d'), tr: track(f), last: -1 }; tv.tr.start();
}
function tvTick() {
  if (!tv) return; if (G.busy !== tv.act) return tvStop();
  const t = Math.max(0, Math.min(tv.f.dur - .03, (1 - tv.act.left / tv.act.minutes) * tv.f.dur)), fr = Math.floor(t * 20);
  if (fr !== tv.last) { tv.last = fr; paint(tv.f, tv.g, t); } if (!G.modal) tv.tr.pump(t);
}

export function init() {
  injectMediaCss(); if (!G.phone || !G.phone.registerApp || !G.media) return;
  G.phone.registerApp(Object.assign(regDef('reel'), { render: home }));
  G.reel = { play: id => { G.phone.open('reel', { film: id }); return true; }, player: () => (live ? live.state() : null), control: () => live, tv: () => (tv ? { id: tv.f.id, t: (1 - tv.act.left / tv.act.minutes) * tv.f.dur } : null) };
  G.on('activity:start', (id, ctx) => { if (id === 'stream_reel') tvStart(ctx); });
  G.on('activityEnd', (a, completed) => { if (tv && a === tv.act) { const f = tv.f; tvStop(); if (completed) M().watched(f.id, f.dur, f.dur, 'tv'); } });
  G.on('frame', tvTick); G.on('scene', () => tvStop());
  safe(() => G.tips.register({ id: 'reel', topic: 'phone', title: 'Reel: shows in your pocket', text: 'Reel has small-screen shows you can watch anywhere, and on your TV at home (tap the TV, Stream on Reel). Cinema films are different: see one at the Orpheum first, and about two days later it turns up in Reel to buy. The big screen is still the better night out.', go: { app: 'reel' }, goLabel: 'Open Reel' }), 0);
}
