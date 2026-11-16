// Media: the rules behind the three entertainment apps on the phone — Pages (read), Reel (watch), PlayBox (play). UI in src/ui/phone_reader.js,
// phone_reel.js, phone_play.js (+ phone_play_*.js games); tuning + the fun table in src/data/media.js; texts in src/story/shortreads.js; films in
// src/sim/_media_films.js. "All give fun a bit but not too much": every app pays less than the real place it imitates and shares one daily
// screen-time pool (see the table at the top of src/data/media.js).
//
// G.media
//   TUNE                         the tuning object of src/data/media.js
//   context() -> 'ride' | 'queue' | 'bench' | 'home' | 'out'      where the phone is being used (bonus on rides and in queues)
//   rate(kind) -> { fun (per game hour right now), base, taper (0..1), ctx, ctxMult, label }     kind: 'read' | 'book_novel' | 'book_skill' | 'watch' | 'play'
//   pool() -> { minutes (phone entertainment today), full, taper, left (minutes of full-rate fun left today), mult }
//   begin(app, what?) / end() -> { app, minutes, fun } | null     a sitting; end() may grant 'nice_break'. Ends by itself when the phone closes.
//   spend(kind, gameMinutes, o?) -> fun gained     THE one place time passes for these apps: advances the clock (G.advance), pays tapered fun,
//                                    fills the pool, late-night energy, xp (play: logic). o: { rate (override fun/h), noAdvance }
//   -- Pages
//   reads() -> [{ ...read, words, minutes, released, isNew, done, page }]      read(id)      readProgress(id, page, pages)      finishRead(id)
//   books() -> [{ id, item, kind, pct, left (minutes or xp), blocked? }]  every book in the backpack      readBook(id, gameMinutes, o?) -> { fun, xp, finished }  (o as spend)
//   PART-SCREEN (owner msg 173, ui/phone.js): while the phone is docked the clock runs by itself, so the apps call spend(..., { noAdvance: true }): the same
//   fun / screen time / xp per film-second, page or game minute as full-screen, without moving the clock a second time.
//   bookmark(id, page, note?) / unmark(id, page) / marks()      streak() -> { n, best, today }
//   -- Reel
//   films() -> [{ film, tv, state: 'free' | 'soon' | 'cinema' | 'wait' | 'buy' | 'owned', canPlay, day?, buyT?, next? (next Orpheum showing), pos, done }]
//   filmState(id), canPlay(id), buyFilm(id) -> bool, watched(id, seconds, dur) (progress + completion: recipe, stamp, watch-with bonus), next(id?) -> film to continue
//   watchWith(npcId) -> bool     hook for the relationships system: the next film finished on the phone or home TV counts as watched together
//                                (+social, +relationship); G.media.companion() tells who.
//   -- PlayBox
//   games() -> [{ ...game, owned, best, plays }]      owns(id) / buy(id) -> bool  (id = game id or 'game:skin')      skin(gameId) / setSkin(gameId, skinId | null)
//   score(gameId, score) -> { best, isBest, daily: bool (the daily challenge was just beaten) }      friends(gameId) -> [{ name, score, you? }] sorted
//   daily() -> { id, game, target, done }
//   stats() -> { read, watch, play } game minutes ever
// Events: 'media:session'(app, what), 'media:session:end'({ app, minutes, fun }), 'media:read:done'(id), 'media:book:done'(itemId),
//         'media:film:done'(id, where 'phone'|'tv'), 'media:film:available'(id), 'media:film:bought'(id), 'media:score'(gameId, score, isBest),
//         'media:daily'(gameId), 'media:bought'(id), 'media:tired', 'media:break', 'media:new'(app, id).
// State G.state.media = { day, pool, nb, tired, base (game day the slice was made: content from before is not "new"), mig,
//   reader: { pos: {readId: page}, done: {readId: day}, marks: [{ id, page, t }], font 0..2, night 0|1, streak: { last, n, best }, told: {id: 1}, last },
//   reel:   { pos: {filmId: seconds}, done: {filmId: n}, last, told: {id: 1}, seenAt: {filmId: t first seen at the cinema}, owned: {filmId: day}, with },
//   play:   { hi: {gameId: score}, plays: {gameId: n}, owned: {id: 1}, skin: {gameId: skinId}, daily: { day, id, done }, wins },
//   stats:  { read, watch, play } }      Old saves get the defaults; cinema films already seen (G.state.shows.seen) become buyable at once.
// Runtime registrations into other systems (nothing else is edited): MOODLETS.nice_break / eyes_tired (data/needs.js object), the home-TV
//   activity 'stream_reel' (pushed into data/activities.js ACTIVITIES + ACTIVITY_BY_ID, tag 'tv'), three "Things To Try" in _guide_data.js
//   EXPERIENCES, four new films in the Orpheum's FILMS rotation (_media_films.js), three G.tips (from the UI files).
import { G } from '../core/game.js';
import { TUNE, GAMES, GAME_BY_ID, FRIEND_SCORES, DAILY, STAMPS } from '../data/media.js';
import { MOODLETS } from '../data/needs.js';
import { ITEM_BY_ID } from '../data/items.js';
import { ACTIVITIES, ACTIVITY_BY_ID } from '../data/activities.js';
import { EXPERIENCES } from './_guide_data.js';
import { READS } from '../story/shortreads.js';
import { TV_SHOWS, CINEMA_ALL, ALL, filmById, isTv } from './_media_films.js';
import { toast } from '../ui/kit.js';

export const order = 119;
const DAY = 1440, safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100000) / 100000; };

/* ---------- runtime registrations (import time, so every system that reads these lists at init sees them) ---------- */
if (!MOODLETS.nice_break) MOODLETS.nice_break = { name: 'Nice Break', desc: 'A few minutes with a story, a show or a silly game. Just enough.', mood: 2, workPerf: 1, walkSpeed: 1, minutes: 90, source: 'activity' };
if (!MOODLETS.eyes_tired) MOODLETS.eyes_tired = { name: 'Eyes Tired', desc: 'Too much screen. The real town is right there.', mood: -3, workPerf: -1, walkSpeed: 1, minutes: 120, source: 'activity' };
if (!ACTIVITY_BY_ID.stream_reel) {
  const a = { id: 'stream_reel', name: 'Stream on Reel', tag: 'tv', where: 'home', minutes: { min: TUNE.FILM_MINUTES, default: TUNE.FILM_MINUTES, max: TUNE.FILM_MINUTES },
    perHour: { fun: TUNE.tvFunPerHour, energy: -1 }, tierScales: ['perHour.fun'], social: true, anim: 'sit',
    note: 'Registered at runtime by src/sim/media.js. Plays a Reel show (phone & TV-only shows, and cinema films you have bought) on the home TV at the normal TV fun rate.',
    flavour: 'Small screen, big sofa.' };
  ACTIVITIES.push(a); ACTIVITY_BY_ID[a.id] = a;
}
for (const s of STAMPS) if (!EXPERIENCES.some(x => x.id === s.id)) EXPERIENCES.push(s);

/* ---------- state ---------- */
let S = null, sess = null;
const fresh = () => ({ day: -1, pool: 0, nb: -1, tired: -1, base: undefined, mig: 0,
  reader: { pos: {}, done: {}, marks: [], font: 1, night: 0, streak: { last: -1, n: 0, best: 0 }, told: {}, last: null },
  reel: { pos: {}, done: {}, last: null, told: {}, seenAt: {}, owned: {}, with: null },
  play: { hi: {}, plays: {}, owned: {}, skin: {}, daily: { day: -1, id: null, done: 0 }, wins: 0 },
  stats: { read: 0, watch: 0, play: 0 } });
function fix() {
  S = G.state.media || (G.state.media = fresh()); const f = fresh();
  for (const k in f) { if (S[k] === undefined && k !== 'base') S[k] = f[k]; else if (f[k] && typeof f[k] === 'object') for (const j in f[k]) if (S[k][j] === undefined) S[k][j] = f[k][j]; }
  if (!Array.isArray(S.reader.marks)) S.reader.marks = [];
  return S;
}
const today = () => Math.floor((G.state.t || 0) / DAY);
const mediaDay = () => Math.floor(((G.state.t || 0) - TUNE.dayStartHour * 60) / DAY);
function roll() { const d = mediaDay(); if (S.day !== d) { S.day = d; S.pool = 0; } }
const installed = app => safe(() => G.apps.isInstalled(app), true);

/* ---------- fun: taper + context ---------- */
const taperAt = m => { const C = TUNE.SCREEN; return m <= C.full ? 1 : m >= C.taper ? C.floor : 1 - (1 - C.floor) * (m - C.full) / (C.taper - C.full); };
function context() {
  const sc = G.scene, sid = String((sc && sc.id) || ''), show = safe(() => G.shows.state(), null);
  if (show && ['dim', 'show', 'applause'].includes(show.phase)) return 'out';
  if (safe(() => G.transit.ride, null) || sid === 'train' || sid === 'airtram' || G.cutscene) return 'ride';
  if ((show && show.phase === 'doors') || (G.busy && /wait|queue|line up|in line/i.test(String(G.busy.label || '')))) return 'queue';
  const rid = String((sc && sc.roomId) || sid.replace(/^int:/, ''));
  if (rid.startsWith('home') || rid === 'devhome') return 'home';
  if (sc && !sc.indoor && G.busy && (G.busy.at || /bench|sit|people/i.test(String(G.busy.actId || G.busy.label || '')))) return 'bench';
  return 'out';
}
function rate(kind) { roll(); const base = TUNE.fun[kind] || 0, ctx = context(), cm = TUNE.context[ctx] || 1, tp = taperAt(S.pool); return { base, taper: tp, ctx, ctxMult: cm, label: TUNE.contextLabel[ctx] || '', fun: base > 0 ? base * tp * cm : base }; }
const pool = () => { roll(); const C = TUNE.SCREEN; return { minutes: S.pool, full: C.full, taper: C.taper, left: Math.max(0, C.full - S.pool), mult: taperAt(S.pool) }; };
const lateNow = () => { const h = safe(() => G.now().hour, 12), L = TUNE.lateHours; return h >= L[0] || h < L[1]; };

function spend(kind, gm, o = {}) {
  if (!(gm > 0)) return 0; roll(); const N = G.needs, base = o.rate !== undefined ? o.rate : (TUNE.fun[kind] || 0);
  let fun = base * gm / 60; if (base > 0) fun *= taperAt(S.pool + gm / 2) * (TUNE.context[context()] || 1);
  const late = lateNow();
  if (!o.noAdvance) safe(() => G.advance(gm), 0);
  if (N) { if (fun) safe(() => N.add('fun', fun), 0); if (late) safe(() => N.add('energy', TUNE.lateEnergyPerHour * gm / 60), 0); }
  if (kind === 'play' && G.skills) safe(() => G.skills.addXp('logic', TUNE.xp.playLogic * gm / 60), 0);
  S.pool += gm; const sk = kind === 'watch' ? 'watch' : kind === 'play' ? 'play' : 'read'; S.stats[sk] = (S.stats[sk] || 0) + gm;
  if (sess) { sess.minutes += gm; sess.fun += fun; }
  if (S.pool >= TUNE.SCREEN.tired && S.tired !== S.day) { S.tired = S.day; safe(() => N.addMoodlet('eyes_tired'), 0); G.emit('media:tired'); toast('Your eyes are tired. Maybe look at the actual bay for a bit.', 'info', 3600); }
  return fun;
}
// while you sit somewhere (bench, sofa, train seat) and use a media app, the character looks at the phone instead of staring ahead
let posed = null;
function pose(on) {
  const p = G.player; if (!p) return;
  if (on && !posed && G.busy && !G.cutscene && p.pose === 'sit') { posed = { pose: p.pose, opts: p.poseOpts }; p.pose = 'phone'; p.poseOpts = { seated: true }; }
  else if (!on && posed) { if (p.pose === 'phone' && G.busy) { p.pose = posed.pose; p.poseOpts = posed.opts; } posed = null; }
}
function begin(app, what) { if (sess) end(); roll(); sess = { app, what: what || null, minutes: 0, fun: 0 }; pose(true); G.emit('media:session', app, what || null); return sess; }
function end() {
  const s = sess; if (!s) return null; sess = null; roll(); pose(false);
  if (s.minutes >= TUNE.niceBreakMin && S.pool <= TUNE.SCREEN.full + 5 && S.nb !== S.day) { S.nb = S.day; safe(() => G.needs.addMoodlet('nice_break'), 0); G.emit('media:break'); }
  if (s.minutes > 0) G.emit('media:session:end', { app: s.app, what: s.what, minutes: s.minutes, fun: s.fun });
  return s;
}

/* ---------- Pages ---------- */
const wordsOf = r => r._w || (r._w = String(r.text).split(/\s+/).filter(Boolean).length);
const readMin = r => Math.max(2, Math.round(wordsOf(r) / TUNE.READ_WPM * 60 * TUNE.CLOCK.read));   // game minutes a read takes at reading speed
/* Opus bundle 2: what a read takes on the clock. Reading runs the NORMAL clock (owner msg 199), so the Library lists the game time a read at reading speed
   really takes at 1x (rounded to 5 min); `minutes` stays the PAY (fun / screen time) of the piece, unchanged */
const clockMin = r => { const m = wordsOf(r) / TUNE.READ_WPM * 60 * (G.CLOCK || .85); return m < 30 ? Math.max(2, Math.round(m)) : Math.round(m / 5) * 5; };
const reads = () => { const d = today(); return READS.map(r => ({ ...r, words: wordsOf(r), minutes: readMin(r), clockMin: clockMin(r), released: d >= (r.day || 0), isNew: d >= (r.day || 0) && (r.day || 0) > (S.base || 0) && d - (r.day || 0) < 7 && S.reader.done[r.id] === undefined, done: S.reader.done[r.id] !== undefined, page: S.reader.pos[r.id] || 0 })); };
const read = id => reads().find(r => r.id === id) || null;
function touchStreak() { const st = S.reader.streak, d = today(); if (st.last === d) return; st.n = st.last === d - 1 ? st.n + 1 : 1; st.last = d; st.best = Math.max(st.best || 0, st.n); }
function readProgress(id, page) { S.reader.pos[id] = page; S.reader.last = { kind: 'read', id }; }
function finishRead(id) {
  const first = S.reader.done[id] === undefined; S.reader.done[id] = today(); S.reader.pos[id] = 0; touchStreak();
  if (first) { G.emit('media:read:done', id); safe(() => G.guide.stamp('x:media_read'), 0); }
  return first;
}
function books() {
  const out = [], B = safe(() => G.state.inv.books, {}) || {};
  for (const st of safe(() => G.inv.items(), []) || []) {
    const it = ITEM_BY_ID[st.id]; if (!it || it.category !== 'book' || out.some(o => o.id === it.id)) continue;
    const prog = B[it.id] || 0, total = it.kind === 'skill' ? it.xpTotal : it.readMinutes, lv = it.kind === 'skill' ? safe(() => G.skills.level(it.skill), 1) : 0;
    out.push({ id: it.id, item: it, kind: it.kind, prog, total, pct: total ? Math.min(1, prog / total) : 0, blocked: it.kind === 'skill' ? (lv > it.maxLevel ? 'You already know everything in this book.' : lv < it.minLevel ? 'A bit advanced for you right now.' : prog >= total ? 'Finished: nothing left to learn here.' : null) : null });
  }
  return out;
}
/** read an owned book for gm game minutes: the same progress, xp and moodlet as at a bookshelf (G.state.inv.books), a little slower, less fun */
function readBook(id, gm, o) {
  const it = ITEM_BY_ID[id], B = safe(() => G.state.inv.books, null); if (!it || it.category !== 'book' || !B || !(gm > 0)) return { fun: 0, xp: 0, finished: false };
  let xp = 0, finished = false; const fun = spend(it.kind === 'skill' ? 'book_skill' : 'book_novel', gm, o);
  if (it.kind === 'skill' && G.skills) {
    const l = G.skills.level(it.skill), paid = B[id] || 0; let x = TUNE.xp.skillBook * gm / 60; if (l < it.minLevel || l > it.maxLevel) x = 0; x = Math.min(x, Math.max(0, it.xpTotal - paid)); B[id] = paid + x;
    if (x > 0) xp = safe(() => G.skills.addXp(it.skill, x), 0); if (x > 0 && B[id] >= it.xpTotal) finished = true;
  } else if (it.kind === 'novel') {
    B[id] = (B[id] || 0) + gm * TUNE.bookPace; if (G.skills) xp = safe(() => G.skills.addXp('creativity', TUNE.xp.novelCreativity * gm / 60), 0);
    if (B[id] >= it.readMinutes) { B[id] = 0; finished = true; safe(() => G.needs.addMoodlet('good_book'), 0); toast(`You finished "${it.name}".`, 'good'); }
  }
  S.reader.last = { kind: 'book', id }; if (sess && sess.minutes >= 10) touchStreak(); if (finished) { touchStreak(); G.emit('media:book:done', id); }
  return { fun, xp, finished };
}
function bookmark(id, page) { const M = S.reader.marks; if (!M.some(m => m.id === id && m.page === page)) { M.unshift({ id, page, t: Math.floor(G.state.t) }); if (M.length > 30) M.length = 30; } }
function unmark(id, page) { S.reader.marks = S.reader.marks.filter(m => !(m.id === id && m.page === page)); }

/* ---------- Reel ---------- */
const cinemaSeen = id => safe(() => G.state.shows.seen[id], 0) > 0;
const buyT = id => (S.reel.seenAt[id] === undefined ? null : S.reel.seenAt[id] + TUNE.REEL.buyDelayDays * DAY);
function filmState(f) {
  if (typeof f === 'string') f = filmById(f); if (!f) return null;
  if (isTv(f)) return today() >= (f.day || 0) ? 'free' : 'soon';
  if (S.reel.owned[f.id] !== undefined) return 'owned';
  if (!cinemaSeen(f.id) || S.reel.seenAt[f.id] === undefined) return cinemaSeen(f.id) ? 'wait' : 'cinema';
  return G.state.t >= buyT(f.id) ? 'buy' : 'wait';
}
const canPlay = f => { const s = filmState(f); return s === 'free' || s === 'owned'; };
function nextShowing(id) {
  for (let d = 0; d < 4; d++) { const list = safe(() => G.shows.schedule('cinema', today() + d), []) || []; const s = list.find(x => x.prog === id && x.t > G.state.t - 5); if (s) return s; }
  return null;
}
const films = () => ALL().map(f => { const state = filmState(f), tv = isTv(f); return { film: f, tv, state, canPlay: state === 'free' || state === 'owned', day: f.day, buyT: tv ? null : buyT(f.id), next: state === 'cinema' ? nextShowing(f.id) : null, pos: S.reel.pos[f.id] || 0, done: S.reel.done[f.id] || 0, isNew: tv ? state === 'free' && (f.day || 0) > (S.base || 0) && !S.reel.done[f.id] && today() - f.day < 7 : state === 'buy' }; });
function buyFilm(id) {
  const f = filmById(id); if (!f || filmState(f) !== 'buy') return false;
  if (G.money && !G.money.pay(TUNE.REEL.price, 'Reel: ' + f.title, { category: 'fun' })) return false;
  S.reel.owned[id] = today(); G.emit('media:film:bought', id); G.emit('media:bought', 'film:' + id); return true;
}
/** progress report from a player. Returns true when this call completed the film. */
function watched(id, sec, dur, where = 'phone') {
  const f = filmById(id); if (!f) return false; S.reel.last = id;
  if (sec < dur - .5) { S.reel.pos[id] = Math.max(0, sec); return false; }
  S.reel.pos[id] = 0; S.reel.done[id] = (S.reel.done[id] || 0) + 1; G.emit('media:film:done', id, where); safe(() => G.guide.stamp('x:media_watch'), 0);
  if (f.teaches && G.cooking && !safe(() => G.cooking.knows(f.teaches), true)) { if (safe(() => G.cooking.learn(f.teaches, 'tv'), false)) toast('New recipe learned from Bay Kitchen. Find it at your stove.', 'good', 3600); }
  const w = S.reel.with; if (w) { S.reel.with = null; safe(() => G.needs.add('social', where === 'tv' ? 8 : 4), 0); safe(() => G.social.addRel(w, where === 'tv' ? 3 : 2), 0); G.emit('media:watchwith', w, id); }
  return true;
}
/** what to play when the user just presses play: the last unfinished one, else the first unwatched playable, else the first playable */
function nextFilm(after) {
  const L = films().filter(x => x.canPlay); if (!L.length) return null;
  if (after) { const i = L.findIndex(x => x.film.id === after); return (L[(i + 1) % L.length] || L[0]).film; }
  const last = L.find(x => x.film.id === S.reel.last && x.pos > 1); if (last) return last.film;
  return (L.find(x => !x.done) || L[0]).film;
}

/* ---------- PlayBox ---------- */
const owns = id => { const [g, sk] = String(id).split(':'), d = GAME_BY_ID[g]; if (!d) return false; if (!sk) return !d.price || !!S.play.owned[g]; const s = (d.skins || []).find(x => x.id === sk); return !!s && (!s.price || !!S.play.owned[id]); };
function buy(id) {
  const [g, sk] = String(id).split(':'), d = GAME_BY_ID[g]; if (!d || owns(id)) return false; const it = sk ? (d.skins || []).find(x => x.id === sk) : d; if (!it) return false;
  if (G.money && !G.money.pay(it.price, 'PlayBox: ' + it.name, { category: 'fun' })) return false;
  S.play.owned[id] = 1; if (sk) S.play.skin[g] = sk; G.emit('media:bought', id); return true;
}
const games = () => GAMES.map(g => ({ ...g, owned: owns(g.id), best: S.play.hi[g.id] || 0, plays: S.play.plays[g.id] || 0 }));
function daily() {
  const d = today(), D = S.play.daily; if (D.day !== d) { const own = GAMES.filter(g => owns(g.id)); D.day = d; D.id = own[Math.floor(hash('daily' + d) * own.length) % own.length].id; D.done = 0; }
  const g = GAME_BY_ID[D.id] || GAMES[0], base = FRIEND_SCORES.base[g.id] || 100; let target = Math.round(base * (DAILY.frac[g.id] || .6) * (.9 + hash('dt' + d) * .25)); if (target > 60) target = Math.round(target / 10) * 10;
  return { id: g.id, game: g, target: Math.max(3, target), done: !!D.done };
}
function score(gameId, sc) {
  sc = Math.max(0, Math.round(sc || 0)); const P = S.play, was = P.hi[gameId] || 0, isBest = sc > was; if (isBest) P.hi[gameId] = sc; P.plays[gameId] = (P.plays[gameId] || 0) + 1;
  const D = daily(); let won = false;
  if (D.id === gameId && !D.done && sc >= D.target) { P.daily.done = 1; P.wins = (P.wins || 0) + 1; won = true; safe(() => G.needs.add('fun', TUNE.dailyFun), 0); G.emit('media:daily', gameId); safe(() => G.guide.stamp('x:media_play'), 0); }
  G.emit('media:score', gameId, sc, isBest); return { best: Math.max(was, sc), isBest, daily: won };
}
function friends(gameId) {
  const base = FRIEND_SCORES.base[gameId] || 100, wk = Math.floor(today() / 7);
  const list = FRIEND_SCORES.names.map(n => { let v = base * (.5 + hash(n + gameId) * .95) * (1 + Math.min(12, wk) * .03 * (.5 + hash(gameId + n + 'w'))); v = v > 60 ? Math.round(v / 10) * 10 : Math.round(v); return { name: n, score: Math.max(1, v) }; });
  list.push({ name: 'You', score: S.play.hi[gameId] || 0, you: true }); return list.sort((a, b) => b.score - a.score);
}

/* ---------- new-content notices (low priority: a badge + a history line; the phone clears an app's notices when the app is opened) ---------- */
function sync(quiet) {
  if (!S || G.onTitle) return; const first = !S.mig; if (S.base === undefined) S.base = today();
  // cinema films: note when each was first seen; films seen before this system existed are buyable straight away
  for (const f of CINEMA_ALL()) if (cinemaSeen(f.id) && S.reel.seenAt[f.id] === undefined) S.reel.seenAt[f.id] = first ? -1e7 : Math.floor(G.state.t);
  S.mig = 1;
  const tell = (app, T, id, title, text, data) => { if (T[id]) return; T[id] = 1; if (quiet || first || !installed(app)) return; G.emit('media:new', app, id); safe(() => G.phone.notify({ app, title, text, priority: 'low', data }), 0); };
  for (const r of READS) if (today() >= (r.day || 0)) { if ((r.day || 0) <= S.base) S.reader.told[r.id] = 1; else tell('pages', S.reader.told, r.id, 'Pages', (r.serial ? `New instalment: ${r.title}` : `New this week: ${r.title}`), { read: r.id }); }
  for (const f of TV_SHOWS) if (today() >= (f.day || 0)) { if ((f.day || 0) <= S.base) S.reel.told[f.id] = 1; else tell('reel', S.reel.told, f.id, 'Reel', `New on Reel: ${f.title}`, { film: f.id }); }
  for (const f of CINEMA_ALL()) if (filmState(f) === 'buy' && !S.reel.told[f.id]) {
    S.reel.told[f.id] = 1; G.emit('media:film:available', f.id);
    if (!quiet && installed('reel')) safe(() => G.phone.notify({ app: 'reel', title: 'Reel', text: `Now available to own: ${f.title}`, priority: first ? 'low' : 'normal', data: { film: f.id } }), 0);
  }
}

export function init() {
  G.defineState('media', fresh); fix();
  G.media = {
    TUNE, context, rate, pool, begin, end, spend, session: () => sess,
    reads, read, readProgress, finishRead, books, readBook, bookmark, unmark, marks: () => S.reader.marks.slice(), streak: () => ({ n: S.reader.streak.last >= today() - 1 ? S.reader.streak.n : 0, best: S.reader.streak.best || 0, today: S.reader.streak.last === today() }),
    prefs: () => S.reader, lastRead: () => S.reader.last,
    films, filmState, canPlay, buyFilm, watched, next: nextFilm, film: filmById, nextShowing,
    watchWith: npcId => { if (!npcId) return false; S.reel.with = npcId; return true; }, companion: () => S.reel.with,
    games, owns, buy, score, friends, daily, skin: g => (S.play.skin[g] && owns(g + ':' + S.play.skin[g]) ? S.play.skin[g] : null), setSkin: (g, sk) => { if (!sk) delete S.play.skin[g]; else if (owns(g + ':' + sk)) S.play.skin[g] = sk; },
    stats: () => Object.assign({}, S.stats), sync,
  };
  G.on('load', () => { fix(); sess = null; setTimeout(() => sync(), 0); });
  G.on('ready', () => sync()); G.on('game:start', () => sync());
  G.on('hour', () => sync()); G.on('day', () => sync());
  G.on('show:end', e => { if (e && e.venue === 'cinema' && !e.left) setTimeout(() => sync(), 0); });
  G.on('app:installed', id => { if (id === 'pages' || id === 'reel') sync(true); });
  G.on('phone:close', () => end());
  setTimeout(() => sync(), 0);
}
