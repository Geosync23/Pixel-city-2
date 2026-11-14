// Shows: the shared engine behind the three performance venues (cinema "The Orpheum", "Maple Bay Symphony Hall", "The Lantern Playhouse").
// Flow: box office (ticket) -> doors open 15 min before -> the audience pours in and sits, you take your seat -> house lights dim -> the show
// (film / concert / play, staged by the hall's director in src/scenes/rooms/performance.js) -> applause -> everyone files out.
//
// G.shows
//   venues() -> [{ id, name, kind ('film'|'concert'|'play'), lobby, hall, placeId, programme: [{ id, title, blurb, poster, price, minutes }] }]
//   schedule(venueId, day?) -> [{ id ('<venue>:<day>:<n>'), venue, prog, title, blurb, poster, price, t (abs game minute), doors (t - 15), minutes, clock ('19:30') }]  (deterministic per day)
//   buy(venueId, showId) -> ticket | null      tickets() -> [{ id, venue, prog, title, t, price, appt? }]      openBoxOffice(venueId)
//   enterHall(venueId)     what the lobby's hall door does: usher checks the ticket / offers to wait for the doors
//   startNow(venueId, showId | programmeId?) -> Promise<state>   debug: free ticket, jump to doors-open, walk into the hall
//   state() -> null | { venue, showId, prog, phase ('doors'|'dim'|'show'|'applause'|'exit'), t, audience, seated, mine (player seated), level (house lights 0..1) }
//   leave()                leave early (mid-show: partial fun, back to the lobby)
//   attendWith(npcId)      seat that NPC next to the player at the next show (social bonus at the end)
//   debugSpeed (1)         multiplies the whole run (tests);   log -> [[seconds, event]] of the current / last run;   volume(v)
// Events: 'show:ticket'(ticket), 'show:doors'({venue, showId}), 'show:start'({venue, showId, prog}), 'show:end'({venue, showId, prog, left?}).
// State G.state.shows = { tickets: [...], seen: { progId: count }, count, live: { venue, id, price } | null }. A save made mid-show reloads
// outside the venue with that ticket refunded.
// City: the Art Museum building becomes Symphony Hall (door poi `door:concerthall`), the Grand Theatre becomes the Lantern Playhouse (`door:playhouse`).
import { G } from '../core/game.js';
import { Char, charArt } from '../core/char.js';
import { rng, WS } from '../engine/raster.js';
import { timeInfo } from '../core/clock.js';
import { el, toast, modal, bubble, choose } from '../ui/kit.js';
import { caption, skipButton } from '../ui/goals.js';
import { ROOMS, enterRoom } from '../scenes/interior.js';
import { asset } from '../art/registry.js';
import { assetSprite } from '../engine/sprites.js';
import { getCity } from '../world/_city.js';
import { AU, unlock, sfx, setVolume } from './_shows_audio.js';
import { PIECES } from './_shows_music.js';
import { FILMS } from './_shows_films.js';
import { PLAYS } from './_shows_plays.js';

export const order = 54; // before public_places (55) and places (58): our door pois must exist when they scan the city
/** tuning (real seconds unless noted) */
export const TUNE = { doorsMin: 15, doorsMax: 55, dim: 3.2, applause: 7.5, exitMax: 30, doorsBefore: 15 /* game min */, lateGrace: 12 /* game min */, stream: 17 /* s over which the crowd arrives */, walk: 2.5, rowWalk: 1.5 };
const DAY = 1440, SEATED = { seated: true };
export const VENUES = {
  cinema: { id: 'cinema', name: 'The Orpheum', kind: 'film', lobby: 'cinema', hall: 'cinema:screen1', progs: FILMS, times: () => [12.5, 14.75, 17, 19.25, 21.5], aud: [30, 46], dress: 0, moodlet: 'movie_magic', fun: 38, noun: 'film' },
  concerthall: { id: 'concerthall', name: 'Maple Bay Symphony Hall', kind: 'concert', lobby: 'concerthall', hall: 'concerthall:hall', progs: PIECES, times: wd => (wd >= 5 ? [14, 19.5] : [19.5]), aud: [56, 80], dress: 1, moodlet: 'inspired', fun: 34, noun: 'concert' },
  playhouse: { id: 'playhouse', name: 'The Lantern Playhouse', kind: 'play', lobby: 'playhouse', hall: 'playhouse:hall', progs: PLAYS, times: wd => (wd === 6 ? [15, 20] : [20]), aud: [34, 52], dress: .5, moodlet: 'great_night_out', fun: 36, noun: 'show' },
};
const CONVERT = [{ venue: 'concerthall', id: 'bld.civic.museum', sign: 'SYMPHONY HALL' }, { venue: 'playhouse', id: 'bld.arts.theatre', sign: 'LANTERN PLAYHOUSE' }];
const REACT = { laugh: ['Ha!', 'Hahaha!', 'Pfft!', 'Heh.'], gasp: ['Oh!', '!', 'Whoa...'], aww: ['Aww.', 'Oh...', '*sniff*'], cheer: ['Bravo!', 'Woo!', 'Yes!', 'Encore!'] };
let free = null; // { seat } when the player sits in a hall seat outside a show
let S = null, run = null, lastLog = [], withNpc = null, unSkip = null;
const now = () => G.state.t, fmtClock = t => { const m = Math.round(((t % DAY) + DAY) % DAY), h = Math.floor(m / 60); return (h < 10 ? '0' : '') + h + ':' + (m % 60 < 10 ? '0' : '') + (m % 60); };
const pick = a => a[Math.floor(Math.random() * a.length)], safe = (f, d) => { try { return f(); } catch (e) { return d; } };
const money = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);

/* ------------------------------------------------------------------ schedule + tickets */
function schedule(venueId, day) {
  const v = VENUES[venueId]; if (!v) return []; if (day === undefined) day = Math.floor(now() / DAY);
  const wd = timeInfo(day * DAY + 1).weekday;
  return v.times(wd).map((h, i) => { const p = v.progs[(((day + i) % v.progs.length) + v.progs.length) % v.progs.length], t = day * DAY + h * 60; return { id: `${venueId}:${day}:${i}`, venue: venueId, prog: p.id, title: p.title, blurb: p.blurb, poster: p.poster, price: p.price, t, doors: t - TUNE.doorsBefore, minutes: p.minutes, clock: fmtClock(t) }; });
}
function findShow(venueId, showId) { const m = /:(-?\d+):\d+$/.exec(String(showId)); return m ? schedule(venueId, +m[1]).find(s => s.id === showId) || null : null; }
function prune() { const t = now(); for (let i = S.tickets.length - 1; i >= 0; i--) if (S.tickets[i].t + TUNE.lateGrace + 5 < t && !(run && run.ticket === S.tickets[i])) S.tickets.splice(i, 1); }
function tickets() { prune(); return S.tickets.slice().sort((a, b) => a.t - b.t); }
function buy(venueId, showId) {
  const v = VENUES[venueId], sh = findShow(venueId, showId); if (!v || !sh) return null; prune();
  const have = S.tickets.find(k => k.id === sh.id); if (have) return have;
  if (sh.t + TUNE.lateGrace < now()) { toast('That showing has already started.', 'bad'); return null; }
  if (G.money && !G.money.pay(sh.price, `${v.name}: ${sh.title}`, { category: 'fun' })) return null;
  const tk = { id: sh.id, venue: venueId, prog: sh.prog, title: sh.title, t: sh.t, price: sh.price };
  if (sh.doors - now() > 20 && G.planner) tk.appt = safe(() => G.planner.add({ title: `${sh.title} at ${v.name}`, placeId: v.lobby, t: sh.t, dur: sh.minutes, kind: 'event', data: { show: sh.id } }), null);
  S.tickets.push(tk); G.emit('show:ticket', tk); toast(`Ticket: ${sh.title}, ${sh.clock}. Doors open 15 minutes before.`, 'good', 3600); return tk;
}
function dropTicket(tk) { const i = S.tickets.indexOf(tk); if (i >= 0) S.tickets.splice(i, 1); if (tk.appt && G.planner) safe(() => G.planner.done(tk.appt)); }

/* ------------------------------------------------------------------ box office panel */
function css() { if (document.getElementById('shw-css')) return; document.head.append(el('style', { id: 'shw-css', text: '.shw-row{display:flex;gap:10px;align-items:center;border:2px solid var(--edge);background:#fffaf0;padding:6px 8px;margin-bottom:7px}.shw-row canvas{image-rendering:pixelated;flex:none;background:#2a2733;border:2px solid var(--edge)}.shw-i{flex:1;min-width:0}.shw-t{font-weight:700;font-size:15px}.shw-b{font-size:12.5px;opacity:.8;line-height:1.25}.shw-c{font-weight:700;color:var(--accent);font-size:13px}.shw-next{background:var(--shade);border:2px solid var(--edge);padding:7px 9px;margin-bottom:9px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.shw-next span{flex:1;min-width:150px;font-weight:700}.shw-day{font-weight:700;margin:4px 0 6px;opacity:.7;font-size:13px}' })); }
export function posterCanvas(id, scale = 3) { const c = document.createElement('canvas'); try { const sp = assetSprite(asset('furn.perf.poster'), { poster: id }); c.width = sp.w; c.height = sp.h; c.getContext('2d').drawImage(sp.c, 0, 0); c.style.width = sp.w * scale + 'px'; c.style.height = sp.h * scale + 'px'; } catch (e) { c.width = c.height = 8; } return c; }
function openBoxOffice(venueId) {
  const v = VENUES[venueId]; if (!v) return; css(); unlock(); const m = modal({ title: `${v.name} — Box Office` });
  const draw = () => {
    m.body.textContent = ''; const t = now(), day = Math.floor(t / DAY), mine = tickets().filter(k => k.venue === venueId), nx = mine.find(k => k.t + TUNE.lateGrace > t);
    if (nx) { const d = Math.ceil(nx.t - TUNE.doorsBefore - t); m.body.append(el('div.shw-next', null, el('span', { text: d > 0 ? `Your ticket: ${nx.title}, ${fmtClock(nx.t)}. Doors open in ${d} min.` : `Your ticket: ${nx.title}. The doors are open!` }), el('button', { text: d > 0 ? 'Wait in the lobby' : 'Go in', onclick: () => { m.close(); d > 0 ? waitFor(nx) : enterHall(venueId); } }))); }
    let any = 0;
    for (const dd of [day, day + 1]) {
      const list = schedule(venueId, dd).filter(s => s.t + 5 > t); if (!list.length || (dd > day && any >= 3)) continue; m.body.append(el('div.shw-day', { text: dd === day ? 'Today' : 'Tomorrow' }));
      for (const s of list) { any++; const own = mine.some(k => k.id === s.id); m.body.append(el('div.shw-row', null, posterCanvas(s.poster), el('div.shw-i', null, el('div.shw-t', { text: s.title }), el('div.shw-c', { text: `${s.clock} · ${money(s.price)} · about ${Math.round(s.minutes / 5) * 5} min` }), el('div.shw-b', { text: s.blurb })), el('button', { text: own ? 'Ticket ✓' : 'Buy', disabled: own, onclick: () => { if (buy(venueId, s.id)) draw(); } }))); }
    }
    if (!any) m.body.append(el('p', { text: 'Nothing more today. Come back tomorrow!' }));
  };
  draw(); return m;
}
function waitFor(tk) {
  const mins = tk.t - TUNE.doorsBefore - now(), v = VENUES[tk.venue]; if (mins <= 0) return enterHall(tk.venue);
  G.startActivity({ label: 'Waiting for the doors', anim: 'phone', minutes: mins, rate: Math.max(6, mins / 5), done: () => { toast('The doors are open. Head in!', 'good'); if (G.scene && G.scene.roomId === v.lobby) setTimeout(() => enterHall(tk.venue), 500); } });
}
function enterHall(venueId) {
  const v = VENUES[venueId], t = now(), mine = tickets().filter(k => k.venue === venueId), cur = mine.find(k => t >= k.t - TUNE.doorsBefore && t <= k.t + TUNE.lateGrace); unlock();
  if (cur) return begin(v, cur);
  const nx = mine.find(k => k.t - TUNE.doorsBefore > t);
  if (nx) return choose('Usher', [{ label: `Wait in the lobby (${Math.ceil(nx.t - TUNE.doorsBefore - t)} min)`, value: 'wait' }, { label: 'Not yet', value: 'no' }], { text: `"${nx.title}" starts at ${fmtClock(nx.t)}. Doors open 15 minutes before.` }).then(r => { if (r === 'wait') waitFor(nx); });
  toast('Usher: "Tickets at the box office, please."'); return null;
}

/* ------------------------------------------------------------------ the run */
const log = (r, ev) => { r.log.push([Math.round(r.t * 10) / 10, ev]); };
function setLevel(r, v) { r.level = v; r.scene.house = v; }
async function begin(v, tk) {
  if (free) standFree(); if (run) endRun(false); if (!ROOMS.has(v.hall)) { toast('The hall is closed for repairs.'); return null; }
  await G.go('int:' + v.hall, { fresh: true }); const scene = G.scene, hall = scene.perf; if (!hall) return null;
  const prog = v.progs.find(p => p.id === tk.prog) || v.progs[0];
  const r = run = { venue: v, ticket: tk, prog, scene, hall, dir: hall.dir, phase: 'doors', t: 0, pt: 0, aud: [], seated: 0, level: 1, mine: null, log: [], its: [], cam: { x: 0, y: 0, z: 0 }, dur: hall.dir.dur(prog), cues: [], m0: safe(() => G.state.player.money, 0), f0: safe(() => G.needs.get('fun'), 0) };
  lastLog = r.log; S.live = { venue: v.id, id: tk.id, price: tk.price }; setLevel(r, 1); populate(r); log(r, 'doors'); G.emit('show:doors', { venue: v.id, showId: tk.id });
  const s = r.seat0; caption('Usher', `Row ${String.fromCharCode(65 + s.row)}, seat ${s.n + 1}. It is marked for you. Any free seat is fine too!`, 4200); if (hall.usher) bubble(hall.usher, 'Enjoy the ' + v.noun + '!', 2600);
  return api.state();
}
function populate(r) {
  const hall = r.hall, v = r.venue, A = charArt(), rr = rng(((now() | 0) * 7 + 13) | 0), seats = hall.seats, season = G.now().season;
  // the player's seat: a good one (middle rows, next to an aisle), plus the neighbour for a companion
  const rows = Math.max(...seats.map(s => s.row)) + 1, want = Math.min(rows - 1, Math.round(rows * .45)); let best = null, bd = 1e9;
  for (const s of seats) { const d = Math.abs(s.row - want) * 3 + Math.abs(s.x - hall.focus.x) + Math.abs(s.x - s.ax) * .6; if (d < bd) { bd = d; best = s; } }
  r.seat0 = best; const nb = seats.find(s => s.row === best.row && Math.abs(s.x - best.x) > .4 && Math.abs(s.x - best.x) < .6) || null; r.seat1 = nb;
  const evening = (r.ticket.t % DAY) >= 17 * 60, n = Math.min(seats.length - 6, Math.round((v.aud[0] + rr() * (v.aud[1] - v.aud[0])) * (evening ? 1 : .8)));
  const pool = seats.filter(s => s !== best && s !== nb).map(s => ({ s, k: rr() + Math.abs(s.x - hall.focus.x) * .04 })).sort((a, b) => a.k - b.k).slice(0, n).map(o => o.s);
  const specs = []; for (let i = 0; i < 36; i++) specs.push(A.randomSpec(rr, { season, style: rr() < v.dress ? pick(['business', 'preppy', 'business']) : undefined, age: rr() < .12 ? 'elder' : rr() < (v.kind === 'concert' ? .03 : .1) ? 'kid' : undefined }));
  pool.forEach((s, i) => { const late = i >= pool.length - 3, a = mkAud(r, specs[i % specs.length], s, late ? TUNE.stream + 3 + rr() * 6 : (i / pool.length) * TUNE.stream + rr() * 1.2); s.taken = a; });
  if (withNpc && nb) { const sp = safe(() => G.social.npc(withNpc).spec, null) || specs[0], a = mkAud(r, sp, nb, .6); a.npc = withNpc; nb.taken = a; r.comp = a; withNpc = null; }
  for (const s of seats) if (!s.taken) { const it = { x: s.x, y: s.y, z: s.z - .2, h: .5, hit: 4, label: s === best ? 'Your seat' : 'Free seat', spot: { x: s.x, y: s.fy }, visible: () => run === r && !s.taken && r.phase !== 'exit', use: () => sitPlayer(r, s) }; r.its.push(it); r.scene.interactables.push(it); }
}
function mkAud(r, spec, seat, at) { const e = r.hall.entry, a = new Char(spec, e.x, e.y); a.hidden = true; a.st = 0; a.at = at; a.seat = seat; a.pts = r.hall.route(seat); a.i = 0; a.spd = TUNE.walk * (.85 + Math.random() * .35); a.bubbleH = 1.5; a.rt = 0; r.aud.push(a); r.scene.ents.push(a); return a; }
function sitAud(r, a) { const s = a.seat; a.x = s.x; a.y = s.y; a.z = s.z; a.dir = s.dir; a.pose = 'sit'; a.poseOpts = SEATED; a.moving = false; a.st = 2; r.seated++; a.idle = 2 + Math.random() * 8; }
function sitPlayer(r, s) { if (run !== r || s.taken) return; const p = G.player; if (r.mine) r.mine.taken = null; p.stop(); G.pending = null; G.target = null; p.x = s.x; p.y = s.y; p.zoff = s.z; p.z = s.z; p.dir = s.dir; p.pose = 'sit'; p.poseOpts = SEATED; p.moving = false; r.mine = s; s.taken = 'player'; if (r.phase === 'doors') log(r, 'player seated'); }
function sitFree(seat) { const p = G.player; if (run || !seat) return false; p.stop(); G.pending = null; G.target = null; p.x = seat.x; p.y = seat.y; p.zoff = seat.z; p.z = seat.z; p.dir = seat.dir; p.pose = 'sit'; p.poseOpts = SEATED; free = { seat }; return true; }
function standFree() { const p = G.player, f = free; free = null; if (!f) return; p.pose = null; p.poseOpts = null; p.zoff = 0; p.x = f.seat.x; p.y = f.seat.fy; p.z = 0; }
function standPlayer(r) { const p = G.player, s = r && r.mine; p.pose = null; p.poseOpts = null; p.zoff = 0; if (!s) return; s.taken = null; r.mine = null; p.x = s.x; p.y = s.fy; p.z = 0; }
function react(r, kind) {
  const list = r.aud.filter(a => a.st === 2), k = kind === 'cheer' ? .7 : kind === 'laugh' ? .45 : .2; let b = 0; r.cues.push([Math.round(r.pt * 10) / 10, kind]); log(r, 'cue ' + kind);
  for (const a of list) if (Math.random() < k) { a.pose = 'cheer'; a.rt = .8 + Math.random() * 1.2; a.t = Math.random() * 3; }
  for (let i = 0; i < 4 && list.length; i++) { const a = pick(list); if (b++ < 4) setTimeout(() => { if (run === r && a.st === 2) bubble(a, pick(REACT[kind] || REACT.cheer), 1300); }, i * 260); }
  if (kind === 'laugh') sfx('laugh'); else if (kind === 'gasp') sfx('gasp'); else if (kind === 'cheer') sfx('applause', 2.2, .6); else sfx('hush');
}
function walkAud(a, dt) { // straight-line waypoint walking (no pathfinding); returns true when the route is done
  const q = a.pts[a.i]; if (!q) return true; const dx = q.x - a.x, dy = q.y - a.y, d = Math.hypot(dx, dy), st = (q.slow ? TUNE.rowWalk : a.spd) * dt;
  if (d <= st) { a.x = q.x; a.y = q.y; a.i++; } else { a.x += dx / d * st; a.y += dy / d * st; a.face(dx, dy); } a.moving = true; a.z = 0; return a.i >= a.pts.length;
}
function setPhase(r, ph) {
  r.phase = ph; r.pt = 0; const v = r.venue, p = G.player;
  if (ph === 'dim') {
    if (!r.mine) sitPlayer(r, r.seat0.taken ? r.hall.seats.find(s => !s.taken) : r.seat0); dropTicket(r.ticket); r.used = true; G.pending = null; G.target = null; G.cutscene = { update() { } }; r.cam.x = p.x; r.cam.y = p.y; r.cam.z = p.z; G.camTarget = r.cam;
    for (const a of r.aud) if (a.st === 2) a.pose = 'sit'; caption(null, 'The house lights dim. Phones away. A hush falls over the room.', 3400); sfx('hush'); log(r, `dim (seated ${r.seated}/${r.aud.length})`);
    if (unSkip) unSkip(); unSkip = skipButton('Leave early', () => api.leave());
  } else if (ph === 'show') { r.dir.start(r.prog, { cue: k => react(r, k), speed: () => api.debugSpeed || 1 }); log(r, 'start'); G.emit('show:start', { venue: v.id, showId: r.ticket.id, prog: r.prog.id }); }
  else if (ph === 'applause') { safe(() => r.dir.finish()); for (const a of r.aud) if (a.st === 2) { a.pose = 'cheer'; a.rt = 99; a.t = Math.random() * 3; } p.pose = 'cheer'; sfx('applause', TUNE.applause / (api.debugSpeed || 1)); caption(null, v.kind === 'film' ? 'The credits roll. Applause!' : 'Applause! The whole room is on its feet (in spirit).', 3200); log(r, 'applause'); }
  else if (ph === 'exit') {
    release(); p.pose = 'sit'; setLevel(r, 1); const e = r.hall.entry; log(r, 'house lights up');
    for (const a of r.aud) { if (a.st === 1) continue; if (a.st === 0) { a.st = 4; continue; } a.pose = 'sit'; a.rt = 0; a.st = 5; a.at = Math.hypot(a.seat.x - e.x, a.seat.y - e.y) * .45 + Math.random() * 2.5; }
    reward(r, 1); log(r, 'end'); G.emit('show:end', { venue: v.id, showId: r.ticket.id, prog: r.prog.id });
  }
}
function release() { G.cutscene = null; G.camTarget = null; if (unSkip) { unSkip(); unSkip = null; } }
function reward(r, k) {
  const v = r.venue; S.live = null; if (k >= 1) { S.seen[r.prog.id] = (S.seen[r.prog.id] || 0) + 1; S.count = (S.count || 0) + 1; }
  safe(() => G.needs.add('fun', v.fun * k)); if (k >= 1) safe(() => G.needs.addMoodlet(v.moodlet));
  if (r.comp && k >= 1) { safe(() => G.needs.add('social', 22)); safe(() => G.social.addRel(r.comp.npc, 6)); }
  if (k >= 1) toast(`${r.prog.title}: ${pick(['wonderful.', 'what a night.', 'you will be humming that all week.', 'worth every cent.'])}`, 'good', 3600);
}
function endRun(completed) {
  const r = run; if (!r) return; run = null; release(); safe(() => r.dir.cleanup()); const sc = r.scene; S.live = null;
  for (const a of r.aud) { const i = sc.ents.indexOf(a); if (i >= 0) sc.ents.splice(i, 1); } for (const it of r.its) { const i = sc.interactables.indexOf(it); if (i >= 0) sc.interactables.splice(i, 1); }
  for (const s of r.hall.seats) s.taken = null; sc.house = 1; const p = G.player; if (p.poseOpts === SEATED) { if (G.scene === sc && r.mine) standPlayer(r); else { p.pose = null; p.poseOpts = null; p.zoff = 0; } } r.mine = null; log(r, completed ? 'exit complete' : 'aborted');
}
function step(dt) {
  const r = run; if (!r) return; if (G.scene !== r.scene) return endRun(false);
  dt *= api.debugSpeed || 1; r.t += dt; r.pt += dt; const p = G.player;
  for (const a of r.aud) {
    if (a.st === 0) { if (r.t >= a.at) { a.hidden = false; a.st = 1; } continue; } a.t += dt;
    if (a.st === 1) { if (walkAud(a, dt)) sitAud(r, a); }
    else if (a.st === 2) { if (a.rt > 0 && (a.rt -= dt) <= 0) a.pose = 'sit'; else if (r.phase === 'doors' && (a.idle -= dt) <= 0) { a.idle = 4 + Math.random() * 9; a.pose = pick(['sit', 'sit', 'phone', 'talk', 'sit', 'read']); } }
    else if (a.st === 5) { if ((a.at -= dt) <= 0) { a.st = 3; a.pose = null; a.poseOpts = null; a.pts = r.hall.route(a.seat).reverse(); a.pts.push(r.hall.entry); a.i = 0; a.x = a.seat.x; a.y = a.seat.fy; a.z = 0; } }
    else if (a.st === 3) { if (walkAud(a, dt)) { a.hidden = true; a.st = 4; } }
  }
  if (r.mine && r.phase !== 'doors' && r.phase !== 'exit') { p.x = r.mine.x; p.y = r.mine.y; }
  if (r.phase === 'doors') {
    if (!r.mine && r.pt > TUNE.doorsMax) { sitPlayer(r, r.seat0); caption('Usher', 'This way! We are about to begin.', 2400); }
    if (!r.mine && !r.nag && r.pt > TUNE.doorsMax * .55) { r.nag = 1; caption(null, 'The room is nearly full. Tap your seat (the marked one) to sit down.', 3600); }
    const arrived = r.aud.filter(a => a.at <= TUNE.stream + 1).length; if (r.mine && r.pt > TUNE.doorsMin && r.seated >= arrived * .85) setPhase(r, 'dim');
  } else if (r.phase === 'dim') { setLevel(r, Math.max(0, 1 - r.pt / TUNE.dim)); camEase(r, dt); if (r.pt >= TUNE.dim) setPhase(r, 'show'); }
  else if (r.phase === 'show') { camEase(r, dt); safe(() => G.advance(r.prog.minutes / r.dur * dt)); let done = false; try { done = r.dir.update(r.pt, dt); } catch (e) { console.warn('show director', e); done = true; } if (done || r.pt > r.dur + 3) setPhase(r, 'applause'); }
  else if (r.phase === 'applause') { camEase(r, dt); safe(() => r.dir.update(r.dur + r.pt, dt)); if (r.pt > TUNE.applause * .55) setLevel(r, Math.min(1, r.level + dt * .6)); if (r.pt >= TUNE.applause) setPhase(r, 'exit'); }
  else if (r.phase === 'exit') { safe(() => r.dir.update(r.dur + TUNE.applause + r.pt, dt)); if (r.aud.every(a => a.st === 4) || r.pt > TUNE.exitMax) endRun(true); }
}
function camEase(r, dt) { const f = r.hall.focus, k = Math.min(1, dt * 1.6); r.cam.x += (f.x - r.cam.x) * k; r.cam.y += (f.y - r.cam.y) * k; r.cam.z += ((f.z || 0) - r.cam.z) * k; }

/* ------------------------------------------------------------------ city doors */
function convert(w) {
  if (!w || w._perf || !Array.isArray(w.objs) || !w.pois) return; w._perf = 1;
  for (const c of CONVERT) {
    const ob = w.objs.find(o => o.id === c.id && o.B), v = VENUES[c.venue]; if (!ob || w.pois.some(p => p.id === 'door:' + c.venue)) continue;
    const d = ob.a && ob.a.door, at = d && typeof d.at === 'number' ? d.at : (ob.B[3] - ob.B[0]) / 2; let x = ob.B[0] + at, y = ob.B[4] + .75;
    for (const o of [0, .5, -.5, 1, -1, 1.5, -1.5, 2, -2]) if (!w.isBlocked(x + o, y)) { x += o; break; }
    ob.p = Object.assign({}, ob.p, { name: c.sign }); ob._key = undefined;
    w.poi({ type: 'door', id: 'door:' + c.venue, room: v.lobby, name: v.name, x: Math.round(x * 10) / 10, y, dir: 3, district: safe(() => w.districtAt(x, y), 'arts') || 'arts', perf: true });
  }
}
function patchCinemaLobby(sc) {
  const W = sc.world; let first = true;
  for (let i = sc.interactables.length - 1; i >= 0; i--) { const it = sc.interactables[i]; if (it.fx && it.fx.asset.id === 'furn.cinema.ticket') { if (first) { first = false; it.label = 'Box office'; it.use = () => openBoxOffice('cinema'); } else sc.interactables.splice(i, 1); } else if (it.exit && it.label === 'Screen 1') it.use = () => enterHall('cinema'); }
  let k = 0; for (const fx of sc.fixtures) if (fx.asset.id === 'furn.cinema.poster') { const ob = fx.ob; ob.hidden = true; safe(() => W.place(asset('furn.perf.poster'), ob.x, ob.y, { p: { poster: FILMS[k++ % FILMS.length].poster }, z: .5, flip: ob.flip, solid: false })); }
}

/* ------------------------------------------------------------------ api + init */
const api = {
  debugSpeed: 1, TUNE,
  venues: () => Object.values(VENUES).map(v => ({ id: v.id, name: v.name, kind: v.kind, lobby: v.lobby, hall: v.hall, placeId: v.lobby, programme: v.progs.map(p => ({ id: p.id, title: p.title, blurb: p.blurb, poster: p.poster, price: p.price, minutes: p.minutes })) })),
  schedule, buy, tickets, openBoxOffice, enterHall, waitFor,
  async startNow(venueId, showId) {
    const v = VENUES[venueId]; if (!v) return null; let sh = showId ? findShow(venueId, showId) : null; const t = now(), pr = showId && v.progs.find(p => p.id === showId);
    if (pr) sh = { id: `${venueId}:dbg:${pr.id}:${Math.floor(t)}`, prog: pr.id, title: pr.title, t: t + TUNE.doorsBefore, price: 0 };
    if (!sh) { const d = Math.floor(t / DAY); sh = schedule(venueId, d).concat(schedule(venueId, d + 1)).find(s => s.t + TUNE.lateGrace > t); }
    if (sh.t - TUNE.doorsBefore > t) G.advance(sh.t - TUNE.doorsBefore - t);
    let tk = S.tickets.find(k => k.id === sh.id); if (!tk) { tk = { id: sh.id, venue: venueId, prog: sh.prog, title: sh.title, t: sh.t, price: 0 }; S.tickets.push(tk); }
    return begin(v, tk);
  },
  state: () => (run ? { venue: run.venue.id, showId: run.ticket.id, prog: run.prog.id, phase: run.phase, t: Math.round(run.t * 10) / 10, audience: run.aud.length, seated: run.seated, mine: !!run.mine, level: Math.round(run.level * 100) / 100, dur: Math.round(run.dur) } : null),
  leave() { const r = run; if (!r) return false; const v = r.venue, mid = r.phase === 'dim' || r.phase === 'show' || r.phase === 'applause'; if (mid) { reward(r, r.phase === 'applause' ? .8 : Math.min(.6, r.pt / r.dur)); G.emit('show:end', { venue: v.id, showId: r.ticket.id, prog: r.prog.id, left: true }); } log(r, 'left early'); endRun(false); G.go('int:' + v.lobby); return true; },
  attendWith(npcId) { withNpc = npcId || null; return true; },
  sitFree, standFree,
  seatHere(seat) { if (run) sitPlayer(run, seat || run.seat0); return !!run; },
  volume(v) { if (v !== undefined) setVolume(v); return AU.vol; },
  get log() { return lastLog; }, get run() { return run; },
};
export function init() {
  S = G.defineState('shows', () => ({ tickets: [], seen: {}, count: 0, live: null })); G.shows = api;
  G.on('load', () => {
    S = G.state.shows || (G.state.shows = { tickets: [], seen: {}, count: 0, live: null }); if (run) { const r = run; run = null; release(); safe(() => r.dir.cleanup()); }
    const L = S.live; if (L) { S.live = null; const i = S.tickets.findIndex(k => k.id === L.id); if (i >= 0) { const k = S.tickets.splice(i, 1)[0]; if (k.appt && G.planner) safe(() => G.planner.remove(k.appt)); } if (L.price) safe(() => G.money.add(L.price, 'Ticket refund')); setTimeout(() => toast('You left mid-show: the box office refunded your ticket.', 'info', 4200), 1500); }
  });
  safe(() => convert(getCity()));
  G.on('scene', s => {
    if (s && s.id === 'city' && s.world) { convert(s.world); for (const c of CONVERT) { const p = s.world.pois.find(q => q.id === 'door:' + c.venue); if (p && !s.interactables.some(it => it.poi === p)) s.interactables.push({ x: p.x, y: p.y, label: p.name, h: 1.2, range: 1.3, poi: p, use: () => { if (ROOMS.has(p.room)) enterRoom(p.room, p.id); else toast("It's closed right now."); } }); } }
    if (run && s !== run.scene) endRun(false); free = null;
    const p = G.player; if (p && p.poseOpts === SEATED && !(run && run.mine) && !free) { p.poseOpts = null; p.pose = null; }
  });
  G.on('room:build', sc => { if (sc && sc.roomId === 'cinema') safe(() => patchCinemaLobby(sc)); });
  G.on('key', () => { if (free) standFree(); else if (run && run.mine && !G.cutscene && !G.busy) standPlayer(run); });
  G.addSystem({ name: 'shows', update: dt => step(dt) });
  // seat marker + stand up on tap
  G.overlays.push((ctx, cam) => { const r = run; if (!r || G.scene !== r.scene || r.mine || r.phase !== 'doors') return; const s = r.seat0, w = WS(s.x, s.y, s.z + 1.25), x = Math.round(w[0]) - cam.x, y = Math.round(w[1]) - cam.y + Math.round(Math.sin(G.time * 5) * 1.5); ctx.fillStyle = '#2a2733'; ctx.fillRect(x - 3, y - 5, 7, 4); ctx.fillRect(x - 2, y - 1, 5, 1); ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y + 1, 1, 1); ctx.fillStyle = '#f6e04a'; ctx.fillRect(x - 2, y - 4, 5, 3); ctx.fillRect(x - 1, y - 1, 3, 1); ctx.fillRect(x, y, 1, 1); });
  if (typeof window !== 'undefined') { addEventListener('pointerdown', e => { unlock(); if (free && !G.modal && e.target === G.cv) standFree(); else if (run && run.mine && !G.cutscene && !G.modal && !G.busy && e.target === G.cv && (run.phase === 'doors' || run.phase === 'exit')) standPlayer(run); }, true); addEventListener('keydown', unlock, true); }
}
