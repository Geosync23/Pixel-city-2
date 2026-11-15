// Phone app: PLAYBOX (app id 'playbox') — play games. Seven small touch-first games on a 120x160 pixel field (phone_play_a.js, phone_play_b.js):
// Market Match, Rooftop Pidge, One More Cast, Stack & Ship, Bay Pairs (free) and Cab Connect, Tap the Beat (bought once with in-game money),
// plus a few cheap skins. High scores, a daily challenge (+3 fun once a day), a friends table with cast first names as flavour.
// Rules, state and the fun table: src/sim/media.js + src/data/media.js (playing pays less than the console at home and far less than an arcade).
// Deep link: G.phone.open('playbox', { game: id }).   G.playbox = { start(id) -> bool, state() -> { id, st: 'ready'|'play'|'pause'|'over', score } | null, api() } (tests / other systems)
import { G } from '../core/game.js';
import { el, iconEl, btn, section, chip, empty, safe, money } from './phone_util.js';
import { toast } from './kit.js';
import { regDef } from './phone_store.js';
import { injectMediaCss, screenBar, onTick } from './phone_reader.js';
import { TUNE, GAME_BY_ID } from '../data/media.js';
import { pixText } from '../sim/_media_films.js';
import { AU, unlock, note } from '../sim/_shows_audio.js';
import { match, matchArt, pidge, pidgeArt, cast, castArt, stack, stackArt } from './phone_play_a.js';
import { pairs, pairsArt, cab, cabArt, beat, beatArt } from './phone_play_b.js';
export const order = 128;
const M = () => G.media, W = 120, H = 160;
const IMPL = { match: [match, matchArt], pidge: [pidge, pidgeArt], cast: [cast, castArt], stack: [stack, stackArt], pairs: [pairs, pairsArt], cab: [cab, cabArt], beat: [beat, beatArt] };
function art(id, size = 48) { const c = document.createElement('canvas'); c.width = c.height = 16; c.className = 'pix md-gart'; c.style.width = c.style.height = size + 'px'; safe(() => IMPL[id][1](c.getContext('2d')), 0); return c; }
function blip(midi, dur = .08, inst = 'synth') { try { const c = AU.ctx; if (c && c.state === 'running') note(inst, midi, c.currentTime + .01, dur, .7); } catch (e) { /* no audio */ } }

/* ---------- home ---------- */
function home(b, ctx) {
  injectMediaCss(); b.classList.add('md-body');
  const a = ctx.arg; if (a && a.game) { const id = a.game; a.game = null; if (GAME_BY_ID[id]) setTimeout(() => openGame(ctx, id), 0); }
  const D = M().daily(), L = M().games();
  b.append(screenBar('play'));
  b.append(el('div.ph-card.md-daily' + (D.done ? '.done' : ''), null, el('div.md-daily-top', null, art(D.id, 32), el('span', null, el('small', { text: D.done ? 'Daily challenge: done' : 'Daily challenge' }), el('b', { text: `${D.game.name}: reach ${D.target} ${D.game.unit}` }))),
    D.done ? el('small', { text: 'Beaten. A new one tomorrow.' }) : el('div.md-acts', null, el('small', { text: `Beat it for +${TUNE.dailyFun} Fun.` }), btn('Play', () => startPlay(ctx, D.id), 'pri'))));
  b.append(section('Games', chip(`${L.filter(g => g.owned).length}/${L.length}`)));
  const grid = el('div.md-games');
  for (const g of L) grid.append(el('button.md-game' + (g.owned ? '' : '.locked'), { 'aria-label': g.name, onclick: () => openGame(ctx, g.id) }, art(g.id, 48), el('b', { text: g.name }), el('small', { text: g.owned ? (g.best ? `Best ${g.best} ${g.unit}` : 'Not played yet') : money(g.price) })));
  b.append(grid, el('p.md-note', { text: 'Made for the bus, the train and the queue. The console at home and the arcade are the real thing.' }));
}
function friendsTable(id, max = 5) {
  const F = M().friends(id), me = F.findIndex(f => f.you); let rows = F.slice(0, max); if (me >= max) rows = [...F.slice(0, max - 1), F[me]];
  return el('div.md-friends', null, rows.map(f => el('div' + (f.you ? '.you' : ''), null, el('span', { text: `${F.indexOf(f) + 1}.` }), el('b', { text: f.name }), el('em', { text: f.score ? String(f.score) : '-' }))));
}
function openGame(ctx, id) { const d = GAME_BY_ID[id]; if (d) ctx.push(d.name, (b, c) => gamePage(b, c, id), 'game:' + id); }
function gamePage(b, ctx, id) {
  injectMediaCss(); b.classList.add('md-body'); const d = M().games().find(g => g.id === id), D = M().daily();
  b.append(el('div.md-ghero', { style: { background: d.color + '44' } }, art(id, 64), el('div', null, el('b', { text: d.name }), el('span', { text: d.tag }), el('small', { text: d.owned ? (d.best ? `Your best: ${d.best} ${d.unit} · played ${d.plays}x` : 'Not played yet') : 'Not in your library yet' }))));
  b.append(el('p.md-how', { text: d.how }));
  if (D.id === id && !D.done) b.append(el('div.md-soon.gold', { text: `Today's challenge: reach ${D.target} ${d.unit} for +${TUNE.dailyFun} Fun.` }));
  if (d.skins && d.owned) {
    const cur = M().skin(id); b.append(section('Looks'));
    b.append(el('div.md-skins', null, el('button' + (!cur ? '.on' : ''), { text: 'Classic', onclick: () => { M().setSkin(id, null); ctx.refresh(); } }),
      d.skins.map(s => { const own = M().owns(id + ':' + s.id); return el('button' + (cur === s.id ? '.on' : ''), { text: own ? s.name : `${s.name} · ${money(s.price)}`, onclick: () => { if (own) M().setSkin(id, s.id); else if (M().buy(id + ':' + s.id)) toast(`${s.name} unlocked.`, 'good'); ctx.refresh(); } }); })));
  }
  b.append(section('Friends'), friendsTable(id, 6));
  ctx.foot.append(d.owned ? btn('Play', () => startPlay(ctx, id), 'pri wide big') : btn(`Get ${d.name} · ${money(d.price)}`, () => { if (M().buy(id)) { toast(`${d.name} added to PlayBox.`, 'good'); ctx.refresh(); } }, 'gold wide big'));
}

/* ---------- playing ---------- */
let live = null;
function startPlay(ctx, id) { if (!M().owns(id)) return openGame(ctx, id); ctx.push(GAME_BY_ID[id].name, (b, c) => playView(b, c, id), 'play:' + id); }
function playView(b, ctx, id) {
  injectMediaCss(); const d = GAME_BY_ID[id]; b.classList.add('md-play'); const mine = M().begin('playbox', id);
  const view = document.querySelector('#phone-layer .ph-view'), vw = (view && view.clientWidth) || 340, vh = (view && view.clientHeight) || 560;
  const k = Math.max(1, Math.min((vw - 12) / W, (vh - 52 - 44 - 14) / H)), cv = el('canvas.pix.md-gcv', { width: W, height: H, style: { width: Math.floor(W * k) + 'px', height: Math.floor(H * k) + 'px' } }), g = cv.getContext('2d');
  const scoreEl = el('b'), statEl = el('span'), bestEl = el('span.md-ghud-b'), best0 = () => safe(() => M().games().find(x => x.id === id).best, 0) || 0, pauseB = el('button.md-pause', { 'aria-label': 'Pause', text: 'II', onclick: () => { if (st === 'play') { st = 'pause'; panel('Paused', null, [btn('Resume', () => { st = 'play'; over.classList.remove('on'); }, 'pri'), btn('Quit', () => ctx.back())]); } } });
  const over = el('div.md-gover'), wrap = el('div.md-gwrap', null, cv, over);
  const api = { W, H, rnd: Math.random, text: pixText, blip, skin: M().skin(id) };
  let game = IMPL[id][0](api), st = 'ready', sessFun = 0, sessMin = 0;
  function panel(title, lines, btns) { over.replaceChildren(el('div.md-gpanel', null, el('b', { text: title }), ...(lines || []), el('div.md-acts', null, ...btns))); over.classList.add('on'); }
  function restart() { game = IMPL[id][0](Object.assign(api, { skin: M().skin(id) })); st = 'play'; over.classList.remove('on'); over.replaceChildren(); }
  function finish() {
    st = 'over'; const sc = game.score, res = M().score(id, sc), s = M().session(); sessFun = s ? s.fun : 0; sessMin = s ? s.minutes : 0;
    if (res.daily) toast(`Daily challenge beaten! Fun +${TUNE.dailyFun}`, 'good', 3000);
    panel(res.isBest && sc > 0 ? 'New best!' : 'Game over', [el('div.md-gscore', null, el('em', { text: String(sc) }), el('small', { text: `${d.unit} · best ${res.best}` })),
      el('div.md-end-stats', null, chip(`Fun +${sessFun.toFixed(1)}`, sessFun > .05 ? 'good' : ''), chip(`${Math.max(1, Math.round(sessMin))} min`), res.daily ? chip('Daily done', 'gold') : null), friendsTable(id, 4)],
      [btn('Play again', restart, 'pri'), btn('Games', () => ctx.back())]);
  }
  const pos = e => { const q = cv.getBoundingClientRect(); return [(e.clientX - q.left) / q.width * W, (e.clientY - q.top) / q.height * H]; };
  cv.addEventListener('pointerdown', e => { e.preventDefault(); try { unlock(); } catch (x) { /* no audio */ } try { cv.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ } if (st === 'ready') { st = 'play'; over.classList.remove('on'); if (id === 'match' || id === 'pairs' || id === 'cab') game.down(...pos(e)); return; } if (st === 'play') game.down(...pos(e)); });
  cv.addEventListener('pointermove', e => { if (st === 'play') game.move(...pos(e)); });
  for (const ev of ['pointerup', 'pointercancel']) cv.addEventListener(ev, e => { if (st === 'play') game.up(...pos(e)); });
  b.append(el('div.md-ghud', null, el('span.md-ghud-s', null, scoreEl, statEl), bestEl, pauseB), wrap);
  over.replaceChildren(el('div.md-gpanel.ready', null, el('b', { text: d.name }), el('small', { text: d.how }), el('em', { text: 'Tap the game to start' }))); over.classList.add('on'); over.addEventListener('pointerdown', e => { if (st === 'ready' && !e.target.closest('button')) { st = 'play'; over.classList.remove('on'); try { unlock(); } catch (x) { /* no audio */ } } });
  live = { id, state: () => ({ id, st, score: game.score, status: game.status ? game.status() : '' }), game: () => game, canvas: cv, restart };
  onTick(b, dt => {
    if (st === 'play') { game.update(dt); M().spend('play', dt * TUNE.CLOCK.play); if (game.over) finish(); }
    try { g.imageSmoothingEnabled = false; game.draw(g); } catch (e) { console.error('playbox draw', e); }
    scoreEl.textContent = String(game.score); statEl.textContent = game.status ? game.status() : ''; bestEl.textContent = 'Best ' + Math.max(best0(), game.score);
  }, () => { if (M().session() === mine) M().end(); if (live && live.id === id) live = null; });
}

export function init() {
  injectMediaCss(); if (!G.phone || !G.phone.registerApp || !G.media) return;
  G.phone.registerApp(Object.assign(regDef('playbox'), { render: home }));
  G.playbox = { start: id => (M().owns(id) ? G.phone.open('playbox', { game: id }) : false), state: () => (live ? live.state() : null), api: () => live };
  safe(() => G.tips.register({ id: 'playbox', topic: 'phone', title: 'PlayBox: games for the bus', text: 'PlayBox has small games made for one thumb: a match-three, a rooftop runner, fishing, stacking crates and more. There is one daily challenge. It is a little Fun for a ride or a queue; the console at home and the arcade give far more.', go: { app: 'playbox' }, goLabel: 'Open PlayBox' }), 0);
}
