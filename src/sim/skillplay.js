// Skill play: 21 skills, what every level gives, interests, the mini-game attached to every skill activity, visible results (works, album, records),
// coaches, selling at the market, and the hooks for classes. Data: src/data/skills_extra.js. Kit: src/ui/minigame.js. Arcade + chess: ./skillplay_arcade.js. UI: src/ui/phone_me.js.
//
// HOW A MINI-GAME ATTACHES (nothing existing is replaced): when an activity that has a game (data GAME_FOR) starts through G.activities, the game sheet opens over the
// running activity. The character keeps animating in the world, the activity bar creeps along, and when the game ends the remaining time whooshes by.
//   played  -> the activity's normal effects + bonus xp (score x TUNE.playBonus) + a better visible result;    Auto / "mini-games off" -> exactly the old activity + the baseline result;
//   Stop    -> the activity is cancelled the normal way (pro-rated effects, no result).
// G.skills (extended here; the existing API is untouched)
//   teach(skillId, xp, source = 'class') -> xp gained   entry point for lessons / university classes / anything that teaches (traits + interests + mood apply; emits 'skill:teach')
//   family(skillId) -> interest family id      interests() -> [family ids]      setInterests([ids]) -> bool (3..5)      isInterest(skillId) -> bool
//   unlocks(skillId) -> [{ level, name, lines: [text], got }] for levels 1..10       perk(skillId, level?) -> text       ladder(skillId, level?) -> the rung name
//   addXp is wrapped: trait multipliers, interest +10%, Logic's bonus to Chess/Tech and the first-practice-of-the-day bonus are applied before the original runs.
// G.skillplay
//   state()                         the slice (read-only please)             games() -> [{ key, title, skill, kind, best }]        best(key) -> { q, n, stat } | null
//   setAuto(on) / auto()            switch every mini-game off (activities run as before) / on
//   demo(key, level?, opts?) -> Promise<result>   play a game by key right now, outside any activity (tests, the Me app's "Try it")
//   works(kind?) -> [{ k, n, q, d, s, p, sold }]  everything made: 'painting' | 'photo' | 'sketch' | 'story' | 'app' | 'song' | 'drink'        thumb(work) -> 48x32 canvas
//   coaches() -> [{ id, name, short, role, skill, fee, hours, x, y, here (bool), doneToday }]        lesson(coachId) -> Promise<bool>
//   sellables() -> [{ id, label, sub, base }]        sell() (the market menu)        tuned(fx) -> bool        chess() -> { elo, w, l, hi }        current() -> session | null
// Events: 'minigame:start'({ game, activity, skill }), 'minigame:done'({ game, activity, skill, score, stars, auto, played, record }), 'skill:level'(skillId, level) (alias of 'skill:up'),
//   'skill:teach'(skillId, xp, source), 'skill:work'(work), 'skill:sold'({ label, amount }), 'skill:interests'([ids]), 'coach:lesson'(coachId, score)
// State G.state.skillplay = { v: 1, auto: 0|1, interests: [family ids], first: { skillId: { d: absDay, t: minute it started } }, best: { gameKey: { q, n, stat } }, works: [...] (max 90),
//   prog: { song, story, app, paintQ, paintN }, garden: { g: 0..1, n: harvests }, chess: { elo, w, l, hi }, fish: { name, cm } | null, arcade: { gameId: hi }, coach: { coachId: absDay },
//   tuned: { sceneId:x,y: absDay until }, n: { counters }, money: { tips, sold, pay } }.   Existing skill xp lives on in G.state.needs.xp untouched; new skills start at 0 there.
import { G } from '../core/game.js';
import { SKILLS, SKILL_MAX_LEVEL } from '../data/needs.js';
import { ACTIVITY_BY_ID } from '../data/activities.js';
import { ITEM_BY_ID, RECIPES } from '../data/items.js';
import { JOBS } from '../data/jobs.js';
import { NEW_SKILLS, FAMILIES, FAMILY_OF, INTEREST, TUNE, LADDER, GATES, XP_MAP, GAME_FOR, COACHES, SMALLTALK, OUTFIT, FIXIT, FISH_SIZE, CROPS, ARCADE, GUIDE_X, TIPS_X, SKILL_IDS } from '../data/skills_extra.js';
import { EXPERIENCES } from './_guide_data.js';
import { LINES } from '../story/ambient_lines.js';
import { GT } from '../engine/world.js';
import { rng } from '../engine/raster.js';
import { Char, charArt } from '../core/char.js';
import { play, abort, sheetRect, stars as starsOf, MG, draw as D } from '../ui/minigame.js';
import { ARCADE_GAMES, chessGame } from './skillplay_arcade.js';
import { el, root, toast, bubble, choose, say } from '../ui/kit.js';
import { iconEl } from '../ui/_icons.js';

export const order = 54;
const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const SK = Object.fromEntries(SKILLS.map(s => [s.id, s]));
const fresh = () => ({ v: 1, auto: 0, interests: [], first: {}, best: {}, works: [], prog: { song: 0, story: 0, app: 0, paintQ: 0, paintN: 0 }, garden: { g: 0, n: 0 }, chess: { elo: 800, w: 0, l: 0, hi: 800 }, fish: null, arcade: {}, coach: {}, tuned: {}, n: {}, money: { tips: 0, sold: 0, pay: 0 } });
const st = () => { let s = G.state.skillplay; if (!s || typeof s !== 'object') s = G.state.skillplay = fresh(); const f = fresh(); for (const k in f) if (s[k] === undefined || s[k] === null && k !== 'fish') s[k] = f[k]; for (const k in f.prog) if (s.prog[k] === undefined) s.prog[k] = 0; return s; };
const day = () => Math.floor((G.state.t || 0) / 1440);
const lvl = k => safe(() => G.skills.level(k), 1);
const money = n => safe(() => G.money.fmt(n), '$' + n);
const T = () => G.traits || { val: (k, b = 1) => b, get: () => null, xpMult: () => 1, has: () => false };
const bump = (k, n = 1) => { const s = st(); s.n[k] = (s.n[k] || 0) + n; return s.n[k]; };
const stamp = id => safe(() => G.guide.stamp(id), 0);
const dayPart = () => { const h = safe(() => G.now().hf, 12); return h < 5 ? 'night' : h < 8 ? 'dawn' : h < 11 ? 'morning' : h < 15 ? 'midday' : h < 18 ? 'afternoon' : h < 21 ? 'dusk' : 'night'; };
const placeOf = ctx => (ctx && ctx.poi && ctx.poi.name) || safe(() => G.scene.def.name, null) || safe(() => G.places.get(G.scene.roomId).name, null) || 'Maple Bay';

/* ====================================================================== skills: xp wrapper, teach, unlocks ====================================================================== */
let origAdd = null, noteFirst = {};
const STUDY = ['read_skill_book', 'library_study', 'computer_study', 'library_read'];
function xpMods(k) {
  const s = st(); let m = T().xpMult(k, STUDY.includes(safe(() => G.activities.current().id, '')) ? 'book' : null);
  if (s.interests.includes(FAMILY_OF[k])) m *= INTEREST.xp;
  if (k === 'chess' || k === 'tech') m *= 1 + .02 * (lvl('logic') - 1);
  const f = s.first[k], d = day();
  if (!f || f.d !== d) { s.first[k] = { d, t: G.state.t }; if (G.started !== false && !noteFirst[k + d]) { noteFirst[k + d] = 1; const fm = 1 + (TUNE.firstPractice - 1) * T().val('firstMult', 1); setTimeout(() => toast(`First ${SK[k] ? SK[k].name : k} practice today: +${Math.round((fm - 1) * 100)}% xp for ${TUNE.firstMinutes} minutes.`, 'info', 3000), 300); } }
  if (G.state.t - s.first[k].t <= TUNE.firstMinutes) m *= 1 + (TUNE.firstPractice - 1) * T().val('firstMult', 1);
  return m;
}
function wrapSkills() {
  const S = G.skills; if (!S || S._skWrapped) return; S._skWrapped = true; origAdd = S.addXp;
  S.addXp = (k, n, raw) => { if (!(n > 0)) return 0; let m = 1; if (!raw) { try { m = xpMods(k); } catch (e) { m = 1; } } return origAdd(k, n * m, raw); };
  S.teach = (k, xp, source = 'class') => { if (!SK[k] || !(xp > 0)) return 0; const got = S.addXp(k, xp * (source === 'coach' ? T().val('coach', 1) : 1)); G.emit('skill:teach', k, got, source); return got; };
  S.family = k => FAMILY_OF[k] || null; S.families = FAMILIES;
  S.interests = () => st().interests.slice(); S.isInterest = k => st().interests.includes(FAMILY_OF[k]);
  S.setInterests = ids => { ids = [...new Set(ids || [])].filter(id => FAMILIES.some(f => f.id === id)).slice(0, INTEREST.max); st().interests = ids; G.emit('skill:interests', ids.slice()); return ids.length >= INTEREST.min; };
  S.ladder = (k, l) => (LADDER[k] ? LADDER[k].rungs[clamp((l || lvl(k)) - 1, 0, 9)] : '');
  S.perk = (k, l) => (LADDER[k] ? LADDER[k].perk(l || lvl(k)) : '');
  S.unlocks = unlocks;
}
function unlocks(k) {
  const L = LADDER[k], cur = lvl(k), out = []; if (!L) return out;
  for (let l = 1; l <= SKILL_MAX_LEVEL; l++) {
    const lines = [`${L.what}: ${L.rungs[l - 1]}`];
    if (GATES[k] && GATES[k][l]) lines.push('New: ' + GATES[k][l]);
    if (k === 'cooking') { const rs = RECIPES.filter(r => r.learn && r.learn.level === l).map(r => r.name); if (rs.length) lines.push('Recipes: ' + rs.slice(0, 3).join(', ') + (rs.length > 3 ? ` and ${rs.length - 3} more` : '')); }
    for (const j of JOBS) { if (j.requires && j.requires[k] === l) lines.push(`Job: can be hired as ${j.name}`); for (const jl of j.levels || []) if (jl.requires && jl.requires[k] === l && jl.level > 1) lines.push(`Job: meets the bar for ${jl.title}`); }
    if (l > 1) lines.push(L.perk(l));
    out.push({ level: l, name: L.rungs[l - 1], lines: lines.slice(0, 5), got: cur >= l });
  }
  return out;
}

/* ====================================================================== works + thumbnails ====================================================================== */
function addWork(w) {
  const s = st(); w = Object.assign({ d: day(), s: Math.floor(Math.random() * 1e6), q: .5, sold: 0 }, w); s.works.push(w);
  if (s.works.length > 90) { const i = s.works.findIndex(x => x.sold) >= 0 ? s.works.findIndex(x => x.sold) : 0; s.works.splice(i, 1); }
  const c = T().get('collect'); if (c) safe(() => G.needs.add('fun', c), 0);
  G.emit('skill:work', w); return w;
}
const works = k => st().works.filter(w => !k || w.k === k);
/** procedural landscape used by the photo game and the album */
function drawView(c, x, y, w, h, seed, hour, focus = 1) {
  const r = rng(seed || 1), night = hour < 5.5 || hour >= 21, gold = (hour >= 17 && hour < 21) || (hour >= 5.5 && hour < 8), sky = night ? ['#1b2046', '#2b3266', '#3c4585'] : gold ? ['#f2a25a', '#f6c27a', '#fbe3a8'] : ['#7fc0ea', '#a8d8f2', '#d4eefa'];
  const b = focus >= .75 ? 0 : focus >= .4 ? 1 : 2, RR = (X, Y, W2, H2, col) => { D.R(c, x + X, y + Y, W2, H2, col); if (b) { c.globalAlpha = .45; D.R(c, x + X - b, y + Y, W2 + b * 2, H2, col); D.R(c, x + X, y + Y - b, W2, H2 + b * 2, col); c.globalAlpha = 1; } };
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  for (let k = 0; k < 3; k++) D.R(c, x, y + k * h * .2, w, h * .2 + 1, sky[k]); const hz = Math.round(h * .58);
  const sx = Math.round(w * (.15 + r() * .7)); if (night) { RR(sx, 6, 5, 5, '#fff8d8'); for (let k = 0; k < 14; k++) D.R(c, x + r() * w, y + r() * hz * .7, 1, 1, '#ffffff'); } else RR(sx, gold ? hz - 12 : 5, 7, 7, gold ? '#fff0b0' : '#fffbe0');
  const kind = Math.floor(r() * 3), hill = night ? '#22284a' : gold ? '#8a5a6a' : '#6fae7a';
  for (let X = 0; X < w; X += 2) { const hh = Math.round(8 + 6 * Math.sin(X * .05 + r() * .3 + seed % 7) + 4 * Math.sin(X * .13 + seed % 5)); RR(X, hz - hh, 2, hh, hill); }
  if (kind !== 0) { let X = 4 + Math.floor(r() * 10); while (X < w - 8) { const bw = 6 + Math.floor(r() * 8), bh = 10 + Math.floor(r() * 26), col = night ? '#2d2f55' : ['#c9886a', '#9ab0c8', '#e0c890', '#b8a0c8'][Math.floor(r() * 4)]; RR(X, hz - bh, bw, bh, col); if (!b) for (let wy = hz - bh + 2; wy < hz - 2; wy += 4) for (let wx = X + 1; wx < X + bw - 1; wx += 3) D.R(c, x + wx, y + wy, 1, 2, night || gold ? '#ffe08a' : '#2a273355'); X += bw + 1 + Math.floor(r() * 6); } }
  if (kind === 0) { RR(Math.round(w * .62), hz - 30, 5, 30, '#fffdf4'); RR(Math.round(w * .62) - 1, hz - 34, 7, 5, '#d8342e'); if (night) RR(Math.round(w * .62) + 6, hz - 33, 30, 2, '#fff8b0'); }
  D.R(c, x, y + hz, w, h - hz, night ? '#182048' : gold ? '#d88a5a' : '#3b82d6'); for (let k = 0; k < 16; k++) D.R(c, x + r() * w, y + hz + 2 + r() * (h - hz - 3), 3 + r() * 5, 1, night ? '#3c4585' : gold ? '#fbe3a8' : '#9fd0f0');
  c.restore();
}
function thumb(w) {
  const cv = document.createElement('canvas'); cv.width = 48; cv.height = 32; cv.className = 'pix'; const c = cv.getContext('2d'), r = rng((w.s || 1) + 3);
  if (w.k === 'photo') drawView(c, 0, 0, 48, 32, w.s, w.h ?? 12, w.q);
  else if (w.k === 'painting' || w.k === 'sketch') { const sk = w.k === 'sketch'; D.R(c, 0, 0, 48, 32, sk ? '#f6efdc' : ['#f3e8cf', '#dfeef5', '#f6e2d0', '#e6f0d8'][Math.floor(r() * 4)]); const pal = sk ? ['#55505f', '#77707f', '#2a2733'] : ['#d8342e', '#3b82d6', '#f2c230', '#5fb84f', '#8a5cc2', '#f08a2c'], n = 4 + Math.round((w.q || .5) * 9);
    for (let k = 0; k < n; k++) { let X = r() * 44, Y = r() * 28; const col = pal[Math.floor(r() * pal.length)], len = 6 + r() * 16, a = r() * 6.28; for (let i = 0; i < len; i++) { D.R(c, X, Y, sk ? 1 : 2 + (w.q > .6 ? 1 : 0), sk ? 1 : 2, col); X += Math.cos(a + i * .12); Y += Math.sin(a + i * .12); } }
    if (!sk) { D.R(c, 0, 0, 48, 2, '#8a5a2c'); D.R(c, 0, 30, 48, 2, '#8a5a2c'); D.R(c, 0, 0, 2, 32, '#8a5a2c'); D.R(c, 46, 0, 2, 32, '#8a5a2c'); } }
  else if (w.k === 'story') { D.R(c, 0, 0, 48, 32, '#d9c9a6'); D.R(c, 9, 2, 30, 28, '#2a2733'); D.R(c, 10, 3, 28, 26, '#fffdf4'); D.R(c, 13, 6, 14, 2, '#2a2733'); for (let k = 0; k < 6; k++) D.R(c, 13, 11 + k * 3, 12 + r() * 10, 1, '#77707f'); }
  else if (w.k === 'app') { D.R(c, 0, 0, 48, 32, '#3a3644'); D.R(c, 15, 1, 18, 30, '#15131c'); D.R(c, 16, 3, 16, 25, ['#3b82d6', '#2f9e8f', '#e0527a', '#f08a2c'][Math.floor(r() * 4)]); for (let k = 0; k < 4; k++) D.R(c, 18, 6 + k * 5, 8 + r() * 4, 3, '#fffdf4'); D.R(c, 22, 29, 4, 1, '#77707f'); }
  else if (w.k === 'song') { D.R(c, 0, 0, 48, 32, '#fffdf4'); for (let k = 0; k < 5; k++) D.R(c, 3, 8 + k * 4, 42, 1, '#77707f'); for (let k = 0; k < 6; k++) { const X = 6 + k * 7, Y = 8 + Math.floor(r() * 5) * 4 - 1; D.R(c, X, Y, 3, 3, '#2a2733'); D.R(c, X + 2, Y - 7, 1, 8, '#2a2733'); } }
  else { D.R(c, 0, 0, 48, 32, '#3a3644'); D.R(c, 19, 6, 10, 18, '#8fd8f0'); D.R(c, 17, 24, 14, 2, '#dfeef5'); D.R(c, 27, 2, 1, 8, '#d8342e'); }
  return cv;
}

/* ====================================================================== result card + world fx + camera ====================================================================== */
function card(o) {
  const e = el('div.mg-res', { role: 'status' }, o.icon ? iconEl(o.icon, 2) : null, el('div', null, el('b', { text: o.title }), ...(o.lines || []).filter(Boolean).map(l => el('span', { text: l }))),
    o.stars !== undefined ? el('div.mg-stars.sm', null, [0, 1, 2].map(k => el('i' + (k < o.stars ? '.on' : '')))) : null);
  e.onclick = () => e.remove(); root().append(e); setTimeout(() => e.classList.add('out'), o.ms || 4200); setTimeout(() => e.remove(), (o.ms || 4200) + 300); return e;
}
const fx = [];
function beatFx(q, col) { const p = G.player; if (!p || q <= 0) return; const n = q >= 1 ? 3 : 1; for (let i = 0; i < n; i++) fx.push({ x: p.x, y: p.y, z: (p.z || 0) + 1.5, ox: (Math.random() - .5) * 14, oy: 0, vy: -14 - Math.random() * 10, t: .9, c: col[Math.floor(Math.random() * col.length)] }); if (fx.length > 60) fx.splice(0, fx.length - 60); }
let swim = null, tunedHere = [];
function drawFx(ctx, cam, dt) {
  const k = G.cssScale || 1;
  for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.t -= dt; f.oy += f.vy * dt; if (f.t <= 0) { fx.splice(i, 1); continue; } const s = G.toScreen(f.x, f.y, f.z); ctx.fillStyle = f.c; ctx.globalAlpha = Math.min(1, f.t * 2); ctx.fillRect(Math.round(s.x / k + f.ox), Math.round(s.y / k + f.oy), 2, 2); ctx.fillRect(Math.round(s.x / k + f.ox) + 2, Math.round(s.y / k + f.oy) - 3, 1, 4); }
  ctx.globalAlpha = 1;
  if (swim && G.busy && G.busy.actId === 'sk_bay_swim') { swim.t += dt; const s = G.toScreen(swim.x + Math.sin(swim.t * .5) * 1.2, swim.y + Math.cos(swim.t * .35) * .8, swim.z), x = Math.round(s.x / k), y = Math.round(s.y / k + Math.sin(swim.t * 5)); ctx.fillStyle = '#dff1fa'; ctx.fillRect(x - 7, y + 1, 15, 1); ctx.fillRect(x - 4 - Math.round(swim.t * 6) % 4, y + 3, 9 + Math.round(swim.t * 6) % 4 * 2, 1); ctx.fillStyle = '#2a2733'; ctx.fillRect(x - 2, y - 4, 5, 5); ctx.fillStyle = swim.skin; ctx.fillRect(x - 1, y - 3, 3, 4); ctx.fillStyle = swim.hair; ctx.fillRect(x - 2, y - 5, 5, 2); const arm = Math.floor(swim.t * 4) % 2; ctx.fillStyle = swim.skin; ctx.fillRect(x + (arm ? 4 : -6), y - 2, 3, 1); }
  for (const tn of tunedHere) { const ph = (G.time * 1.3 + tn.x) % 2; if (ph > .5) continue; const s = G.toScreen(tn.x, tn.y, tn.z + .9 + ph * .8); ctx.fillStyle = '#fff8b0'; const x = Math.round(s.x / k + Math.sin(tn.x * 9 + G.time) * 5), y = Math.round(s.y / k); ctx.fillRect(x, y - 1, 1, 3); ctx.fillRect(x - 1, y, 3, 1); }
}
let camProxy = null;
function camShift() {
  const r = sheetRect(), p = G.player; if (!r || !p) return; const side = r.left > innerWidth * .4 && r.width < innerWidth * .6 && r.height < innerHeight * .95 && r.top > 0 && innerWidth > innerHeight;
  const sx = side ? (innerWidth - r.left) / 2 : 0, sy = side ? 0 : Math.max(0, innerHeight / 2 - r.top / 2 - 10);   // css px the player should move left / up
  const o = G.toScreen(0, 0, 0), ex = G.toScreen(1, 0, 0), ey = G.toScreen(0, 1, 0), a = ex.x - o.x, b = ey.x - o.x, c = ex.y - o.y, d = ey.y - o.y, det = a * d - b * c || 1;
  const wx = (sx * d - b * sy) / det, wy = (a * sy - c * sx) / det, base = swim || p;
  camProxy = { get x() { return base.x + wx; }, get y() { return base.y + wy; }, get z() { return base.z || 0; } }; G.camTarget = camProxy;
}
function camBack() { if (G.camTarget === camProxy) G.camTarget = null; camProxy = null; }

/* ====================================================================== the games ====================================================================== */
const PAL = { music: ['#3b82d6', '#f2c230', '#e0527a'], paint: ['#d8342e', '#3b82d6', '#f2c230', '#5fb84f'], good: ['#f2c230', '#fff8b0'], green: ['#5fb84f', '#8fe07a'], water: ['#8fd8f0', '#dff1fa'], heart: ['#e0527a', '#ffd0dc'] };
const panScene = (c, x, y, w, h, q, bounce) => { const cx = x + w / 2, up = bounce > 0 && q > .5 ? Math.sin((1 - bounce / .35) * Math.PI) * 26 : 0, rot = bounce > 0 && q > .5 ? Math.round((1 - bounce / .35) * 4) % 2 : 0; D.R(c, cx - 34, y + 46, 50, 8, D.INK); D.R(c, cx - 33, y + 47, 48, 6, '#55505f'); D.R(c, cx + 16, y + 48, 30, 4, D.INK); D.R(c, cx + 17, y + 49, 28, 2, '#8a5a2c'); const fy = y + 40 - up + (bounce > 0 && q <= .5 ? 2 : 0); if (rot) { D.R(c, cx - 17, fy - 8, 8, 14, D.INK); D.R(c, cx - 16, fy - 7, 6, 12, '#f2c230'); } else { D.R(c, cx - 22, fy, 26, 7, D.INK); D.R(c, cx - 21, fy + 1, 24, 5, bounce > 0 && q <= .5 ? '#8a5a2c' : '#f2c230'); D.R(c, cx - 19, fy + 2, 8, 2, '#fff0b0'); } for (let k = 0; k < 3; k++) D.R(c, cx - 24 + k * 14, y + 56 + (Math.floor(G.time * 6 + k) % 2), 6, 3, '#f08a2c'); };
const stageScene = (c, x, y, w, h, q, bounce) => { D.R(c, x + 8, y + 4, w - 16, 40, '#5a2338'); D.R(c, x + 8, y + 4, 10, 40, '#8a2f4c'); D.R(c, x + w - 18, y + 4, 10, 40, '#8a2f4c'); D.R(c, x + 4, y + 44, w - 8, 5, '#8a5a2c'); const mx = x + w / 2; D.R(c, mx, y + 22, 1, 22, '#d9d9e0'); D.disc(c, mx, y + 20, 3, '#d9d9e0'); D.icon(c, 'skill.comedy', mx - 34, y + 20, 1); const laugh = bounce > 0 && q > .5; for (let k = 0; k < 9; k++) { const hx = x + 14 + k * 18, hy = y + 56 + (laugh ? Math.round(Math.sin(G.time * 22 + k) * 2) : 0); D.disc(c, hx, hy, 4, D.INK); D.disc(c, hx, hy, 3, ['#e8b890', '#b87a50', '#f2d2b0', '#8a5a3c'][k % 4]); if (laugh && k % 2 === 0) { D.R(c, hx + 4, hy - 9, 1, 4, D.GOLD); D.R(c, hx + 6, hy - 9, 1, 4, D.GOLD); D.R(c, hx + 5, hy - 7, 1, 1, D.GOLD); } } };
const haggleScene = icon => (c, x, y, w, h, q, bounce) => { const cx = x + w / 2; D.box(c, cx - 62, y + 34, 124, 14, '#b8794a'); D.R(c, cx - 66, y + 8, 132, 8, '#d8342e'); for (let k = 0; k < 8; k++) D.R(c, cx - 66 + k * 17, y + 8, 8, 8, '#fffdf4'); D.icon(c, icon || 'ui.bag', cx - 40, y + 18, 1); D.disc(c, cx + 30, y + 26, 8, D.INK); D.disc(c, cx + 30, y + 26, 7, '#e8b890'); D.R(c, cx + 26, y + 24, 2, 2, D.INK); D.R(c, cx + 32, y + 24, 2, 2, D.INK); const happy = bounce > 0 && q > .5; D.R(c, cx + 27, y + 29, 7, 1, D.INK); if (happy) { D.R(c, cx + 26, y + 28, 1, 1, D.INK); D.R(c, cx + 34, y + 28, 1, 1, D.INK); D.icon(c, 'ui.coin', cx - 8, y + 16 - Math.round((1 - bounce / .35) * 8), 1); } else if (bounce > 0) { D.R(c, cx + 26, y + 30, 1, 1, D.INK); D.R(c, cx + 34, y + 30, 1, 1, D.INK); } };
const fishScene = (c, x, y, w, h, s) => { D.R(c, x, y, w, h * .35, '#bfe3f2'); D.R(c, x, y + h * .35, w, h * .65, '#3b82d6'); for (let k = 0; k < 6; k++) D.R(c, x + ((k * 23 + s.t * 10) % w), y + h * .35 + 3 + k * 7, 8, 1, '#8fc0f0'); const fx0 = x + w * .3, fy = y + h * .35 + Math.sin(s.t * 6) * (s.inz ? 1 : 3); D.line(c, x + 6, y + 4, fx0, fy, s.inz ? '#fffdf4' : D.BAD); D.R(c, fx0 - 2, fy - 3, 5, 6, D.INK); D.R(c, fx0 - 1, fy - 2, 3, 2, '#d8342e'); D.R(c, fx0 - 1, fy, 3, 2, '#fffdf4'); const fxx = x + w - 20 - s.prog * (w - 60), fyy = y + h * .62 + Math.sin(s.t * 3) * 6 + (s.v - s.c0) * 20; D.icon(c, 'fish', fxx, fyy, 1); D.line(c, fx0, fy + 3, fxx + 2, fyy + 8, '#ffffff66'); };
const viewScene = (seed, hour) => (c, x, y, w, h, focus) => drawView(c, x, y, w, h, seed, hour, focus);
const gardenScene = (c, x, y, w, h) => { for (let r = 0; r < 3; r++) D.R(c, x + 2, y + 24 + r * 30, w - 4, 3, '#6f5236'); };
const ideaScene = (c, x, y, w, h) => { D.R(c, x, y, w, h, '#fffdf4'); for (let r = 0; r < 8; r++) D.R(c, x + 6, y + 8 + r * 11, w - 12, 1, '#cfd8e6'); D.R(c, x + 14, y, 1, h, '#f0b0b0'); };

/** key -> { skill (primary), also [skills that get the play bonus], title(l, ctx), kit(l, ctx) -> play() def fields, result(R) -> { title, lines, icon } } */
const GAMES = {
  flip: { skill: 'cooking', title: () => 'Flip it!', fxc: PAL.good,
    kit: () => ({ kind: 'timing', icon: 'skill.cooking', hint: 'Tap when the marker is in the green to flip at just the right moment.', o: { rounds: 5 }, scene: panScene, verdicts: ['A bit burnt', 'Edible', 'Tasty', 'Chef\'s kiss!'] }),
    result: R => ({ icon: 'skill.cooking', title: R.played ? `${R.stats.perfect || 0} perfect flips` : 'Cooked the usual way', lines: [R.bonusServing ? 'Chef\'s touch: one extra serving!' : R.played && R.q < .3 ? 'A little scorched. Still dinner.' : null] }) },
  reps: { skill: 'fitness', title: l => 'Clean reps: ' + LADDER.fitness.rungs[l - 1], fxc: PAL.heart,
    kit: () => ({ kind: 'timing', icon: 'skill.fitness', hint: 'Tap at the top of each rep, inside the green.', o: { rounds: 6, zone: .32 }, verdicts: ['Sloppy set', 'Decent set', 'Strong set', 'Perfect form!'] }),
    result: R => { const g = R.played ? +(R.q * 1.5).toFixed(1) : .5; safe(() => G.needs.addFitness(g), 0); return { icon: 'skill.fitness', title: R.played ? `${R.stats.perfect || 0} clean reps of ${R.stats.rounds || 6}` : 'A steady workout', lines: [`Fitness +${g}`] }; } },
  stride: { skill: 'fitness', title: () => 'Find your stride', fxc: PAL.heart,
    kit: () => ({ kind: 'rhythm', icon: 'skill.fitness', hint: 'Left, right, left: tap each side as the step reaches the line.', o: { lanes: 2, alt: true, notes: 16, bpm: 96 }, verdicts: ['Out of step', 'Jogging along', 'Good pace', 'Flying!'] }),
    result: R => { const g = R.played ? +(R.q * 1.2).toFixed(1) : .4; safe(() => G.needs.addFitness(g), 0); return { icon: 'skill.fitness', title: R.played ? `Best run of steps: ${R.stats.combo || 0}` : 'An easy run', lines: [`Fitness +${g}`] }; } },
  pose: { skill: 'fitness', also: ['dancing'], title: () => 'Hold the pose', fxc: PAL.green,
    kit: () => ({ kind: 'balance', icon: 'need.fitness', hint: 'Hold to rise, let go to sink. Keep the bar inside the green until the pose is done.', o: { need: 10 }, theme: { icon: 'need.fitness', paper: '#e6dcf2' }, verdicts: ['Wobbly', 'Steady-ish', 'Balanced', 'Like a tree'] }),
    result: R => { if (R.q >= .55) safe(() => G.needs.addMoodlet('zen'), 0); return { icon: 'need.fitness', title: R.played ? (R.q >= .55 ? 'You held it' : 'You wobbled out') : 'A calm class', lines: [R.q >= .55 ? 'Zen: breathing in, breathing out' : null] }; } },
  study: { skill: 'logic', title: () => 'Make it stick', fxc: PAL.good,
    kit: () => ({ kind: 'memory', icon: 'skill.logic', hint: 'Watch the cards light up, then tap them in the same order.', verdicts: ['It did not stick', 'Some of it stuck', 'Good recall', 'Photographic!'] }),
    result: R => ({ icon: 'skill.logic', title: R.played ? `Notes page ${bump('notes')} filed` : 'Studied quietly', lines: [R.played && R.q >= .85 ? 'Every sequence right' : null] }) },
  sketch: { skill: 'painting', also: ['creativity'], title: (l, ctx) => 'Sketch: ' + placeOf(ctx), fxc: ['#55505f', '#77707f'],
    kit: () => ({ kind: 'trace', icon: 'skill.painting', hint: 'Put your finger on the ring and follow the dots to the gold square.', theme: { thin: true, pal: ['#2a2733', '#55505f', '#77707f'], paper: '#f6efdc' }, verdicts: ['A scribble', 'A rough sketch', 'A good likeness', 'Frame it!'] }),
    result: R => { const w = addWork({ k: 'sketch', n: 'Sketch: ' + placeOf(R.ctx), q: R.q, p: placeOf(R.ctx) }); return { icon: 'skill.painting', title: w.n, lines: ['Added to your sketches in the Me app'], work: w }; } },
  fixit: { skill: 'handiness', title: (l, ctx, id) => (id === 'assemble_furniture' ? 'Sort the fittings' : 'Sort the parts'), fxc: PAL.good,
    kit: () => ({ kind: 'sort', icon: 'skill.handiness', hint: 'Each part goes in its drawer. Tap the right drawer before the timer runs out.', theme: { icon: 'skill.handiness' }, o: { bins: FIXIT.bins, items: FIXIT.items }, verdicts: ['Bits left over', 'It works', 'Solid job', 'Better than new!'] }),
    result: R => { if (R.id === 'assemble_furniture' || !R.ctx.fx) return { icon: 'skill.handiness', title: R.q >= .55 ? 'Built square and true' : 'Built. Mostly straight.', lines: [] };
      const days = TUNE.tuneDays + Math.floor((lvl('handiness') - 1) / 2) + (T().get('tuneDays') || 0) + (R.q >= .85 ? 1 : 0); st().tuned[fxKey(R.ctx.fx)] = day() + days; refreshTuned(); bump('tuned');
      return { icon: 'skill.handiness', title: `${ACTIVITY_BY_ID[R.id].name.replace(/^(Tune Up|Fix) the /, '').replace(' Pressure', '')} tuned up`, lines: [`+${Math.round(TUNE.tuneBonus * 100)}% fun and xp from using it for ${days} days`] }; } },
  song: { skill: 'music', also: ['creativity'], title: l => 'Practise: ' + curSong(l), fxc: PAL.music,
    kit: () => ({ kind: 'rhythm', icon: 'skill.music', hint: 'Tap each string as its note crosses the line.', o: { lanes: 3 }, verdicts: ['Out of tune', 'Getting there', 'Sounding good', 'Note perfect!'] }),
    result: R => { const s = st(), name = curSong(R.lvl), known = works('song').some(w => w.n === name); if (known) return { icon: 'skill.music', title: 'A good jam', lines: ['You know every song at your level. The next comes with the next Music level.'] };
      s.prog.song = clamp(s.prog.song + (.25 + .5 * R.q) * clamp(R.minutes / 45, .4, 2)); if (s.prog.song >= 1) { s.prog.song = 0; const w = addWork({ k: 'song', n: name, q: R.q }); safe(() => G.needs.addMoodlet('proud_maker'), 0); return { icon: 'skill.music', title: `You can play "${name}"`, lines: ['A new song in your repertoire. Busk with it for tips.'], work: w }; }
      return { icon: 'skill.music', title: `"${name}": ${Math.round(s.prog.song * 100)}% learned`, lines: [] }; } },
  busk: { skill: 'music', also: ['charisma'], title: () => 'Busking: ' + anySong(), fxc: PAL.music,
    kit: () => ({ kind: 'rhythm', icon: 'skill.music', hint: 'Play it for the street: tap each note as it crosses the line.', o: { lanes: 3, notes: 16 }, verdicts: ['They walked on', 'A few coins', 'A little crowd', 'They cheered!'] }),
    result: R => { const l = lvl('music'), permit = safe(() => (G.cityhall && G.cityhall.hasPermit ? G.cityhall.hasPermit('busk') : null), null), stand = /bandstand/i.test((R.ctx.poi && R.ctx.poi.name) || '') && l >= 5;
      const amt = Math.max(1, Math.round((4 + 3 * l) * (.4 + R.q) * (permit === false ? .5 : 1) * (1 + .08 * (l - 1)) * tipMult() * (stand ? 1.5 : 1))); pay(amt, 'Busking tips', 'tips'); stamp('x:sk_busk'); crowdSay('busker');
      return { icon: 'skill.music', title: `${money(amt)} in the hat`, lines: [permit === false ? 'No busking permit: half a hat. City Hall sells one.' : permit ? 'Permit holder: the full hat' : null, stand ? 'Bandstand set: +50%' : null] }; } },
  paint: { skill: 'painting', also: ['creativity'], title: l => 'Painting: ' + LADDER.painting.rungs[l - 1], fxc: PAL.paint,
    kit: () => ({ kind: 'trace', icon: 'skill.painting', hint: 'Brush strokes: start on the ring and follow the dots. Every stroke stays on the canvas.', theme: { paper: '#fffdf4' }, verdicts: ['Muddy', 'Coming along', 'Lovely work', 'A masterstroke!'] }),
    result: R => { const s = st(), l = lvl('painting'); s.prog.paintQ += R.q; s.prog.paintN++; const extra = R.minutes * (.05 * (l - 1) + (R.played ? .25 * R.q : 0)); safe(() => { G.state.inv.paint = (G.state.inv.paint || 0) + extra; }, 0);
      if (R.madePainting) { const q = s.prog.paintN ? s.prog.paintQ / s.prog.paintN : .5; s.prog.paintQ = 0; s.prog.paintN = 0; const w = addWork({ k: 'painting', n: LADDER.painting.rungs[l - 1], q }); safe(() => G.needs.addMoodlet('proud_maker'), 0); return { icon: 'painting', title: `Finished: "${w.n}"`, lines: ['It is in your bag. Sell it at the Old Town Market or keep it.'], work: w }; }
      return { icon: 'skill.painting', title: `Canvas ${Math.min(99, Math.round(safe(() => G.state.inv.paint, 0) / 1.2))}% done`, lines: [extra >= 1 ? `Good strokes: ${Math.round(extra)} minutes saved` : null] }; } },
  write: { skill: 'writing', also: ['creativity'], title: l => 'Writing: ' + LADDER.writing.rungs[l - 1].replace(/^An? /, ''), fxc: PAL.good,
    kit: () => ({ kind: 'quickdraw', icon: 'skill.writing', hint: 'Catch the bright ideas. Leave the grey clichés alone.', theme: { icon: 'sk.idea', bad: 'sk.cliche', paper: '#fffdf4' }, scene: ideaScene, verdicts: ['Writer\'s block', 'A rough draft', 'Good pages', 'It wrote itself!'] }),
    result: R => { const s = st(), l = lvl('writing'); s.prog.story = clamp(s.prog.story + (.2 + .5 * R.q) * clamp(R.minutes / 60, .4, 2.5));
      if (s.prog.story >= 1) { s.prog.story = 0; const form = LADDER.writing.rungs[l - 1], n = `${form.replace(/^An? /, '')}: "${title()}"`, w = addWork({ k: 'story', n, q: R.q }); let line = 'Finished! It is on your shelf in the Me app.'; if (l >= 5) { const amt = Math.round((10 + 6 * l) * (1 + .1 * (l - 1)) * (.7 + .6 * R.q) * T().val('sell', 1)); pay(amt, 'Sold to the Maple Bay Gazette', 'pay'); w.sold = 1; line = `The Gazette buys it: ${money(amt)}`; } safe(() => G.needs.addMoodlet('proud_maker'), 0); return { icon: 'skill.writing', title: n, lines: [line], work: w }; }
      return { icon: 'skill.writing', title: `${LADDER.writing.rungs[l - 1]}: ${Math.round(s.prog.story * 100)}% written`, lines: [] }; } },
  photo: { skill: 'photography', also: ['creativity'], title: (l, ctx) => 'Photo: ' + placeOf(ctx), fxc: ['#ffffff', '#fff8b0'],
    kit: (l, ctx, id, sess) => { sess.seed = Math.floor(Math.random() * 1e6); sess.hour = safe(() => G.now().hf, 12); return { kind: 'timing', icon: 'skill.photography', hint: 'Tap when the gold focus ring sits on the white one. Three shots.', o: { style: 'ring', rounds: 3, zone: .34, speed: .6 }, scene: viewScene(sess.seed, sess.hour), verdicts: ['All blur', 'Soft focus', 'Sharp', 'Pin sharp!'] }; },
    result: R => { const w = addWork({ k: 'photo', n: `${placeOf(R.ctx)}, ${dayPart()}`, q: R.q, s: R.sess.seed || Math.floor(Math.random() * 1e6), h: R.sess.hour ?? safe(() => G.now().hf, 12), p: placeOf(R.ctx) }); if (works('photo').length >= 6) stamp('x:sk_photo'); crowdSay('taking_photo');
      return { icon: 'skill.photography', title: w.n, lines: [R.q >= .85 ? 'Pin sharp. In your album.' : R.q >= .4 ? 'In your album.' : 'A bit soft, but it is in the album.', lvl('photography') >= 3 ? 'Prints sell at the Old Town Market' : null], work: w }; } },
  weed: { skill: 'gardening', also: ['handiness'], title: () => 'Weeding', fxc: PAL.green,
    kit: () => ({ kind: 'quickdraw', icon: 'skill.gardening', hint: 'Pull the weeds (tap them). Leave the seedlings to grow.', theme: { icon: 'sk.weed', bad: 'sk.sprout', paper: '#8a6a44' }, scene: gardenScene, verdicts: ['Pulled the wrong ones', 'Tidier', 'Neat rows', 'Show garden!'] }),
    result: R => { if (R.id === 'tend_plants') { if (R.q >= .55) safe(() => G.needs.addMoodlet('fresh_air'), 0); return { icon: 'skill.gardening', title: R.q >= .55 ? 'The plants perk up' : 'Watered', lines: [] }; }
      const s = st(), l = lvl('gardening'), winter = safe(() => G.now().season, 0) === 3; if (winter) return { icon: 'skill.gardening', title: 'Beds tidied for winter', lines: ['Nothing grows until spring.'] };
      s.garden.g = clamp(s.garden.g + (.22 + .45 * R.q) * clamp(R.minutes / 45, .4, 2.5) * (1 + .05 * (l - 1)) + (T().get('grow') ? .2 : 0));
      if (s.garden.g >= .995) { s.garden.g = 0; s.garden.n++; const crop = CROPS[l - 1], qty = 2 + Math.floor(l / 3) + 1, ok = safe(() => G.inv.add(crop, qty), false); stamp('x:sk_harvest'); return { icon: crop, title: `Harvest: ${qty} x ${ITEM_BY_ID[crop].name}`, lines: [ok ? 'In your bag. Cook them or sell them at the market.' : 'Your bag is full! Come back with room.'] }; }
      return { icon: 'skill.gardening', title: `Your bed is ${Math.round(s.garden.g * 100)}% grown`, lines: [`Growing: ${LADDER.gardening.rungs[l - 1]}`] }; } },
  dance: { skill: 'dancing', also: ['fitness'], title: l => 'Dance: ' + LADDER.dancing.rungs[l - 1], fxc: ['#e0527a', '#3b82d6', '#f2c230', '#5fb84f'],
    kit: l => ({ kind: 'rhythm', icon: 'skill.dancing', hint: 'Hit each step as it crosses the line. Keep the combo going.', o: { lanes: l >= 4 ? 4 : 3, notes: 16, bpm: 100 }, verdicts: ['Two left feet', 'Found the beat', 'Smooth', 'Dance floor royalty!'] }),
    result: R => { const l = lvl('dancing'), fun = Math.round((R.played ? 3 + 6 * R.q : 3) * (1 + .04 * (l - 1))); safe(() => G.needs.add('fun', fun), 0); return { icon: 'skill.dancing', title: R.played ? `Best combo x${R.stats.combo || 0}` : 'You danced it out', lines: [`Fun +${fun}`] }; } },
  swim: { skill: 'swimming', also: ['fitness'], title: () => 'Bay swim', fxc: PAL.water,
    kit: () => ({ kind: 'rhythm', icon: 'skill.swimming', hint: 'Left arm, right arm: tap each side as the stroke reaches the line.', o: { lanes: 2, alt: true, notes: 18, bpm: 88 }, theme: { bg: '#bfe3f2' }, verdicts: ['Mostly splashing', 'Steady', 'Strong strokes', 'Like a seal!'] }),
    result: R => { const l = lvl('swimming'), m = Math.round((120 + 40 * l) * (.5 + R.q) / 10) * 10; safe(() => G.needs.addFitness(.6 + R.q), 0); safe(() => G.needs.addMoodlet('sea_legs'), 0); return { icon: 'skill.swimming', title: `You swam ${m} m`, lines: [l >= 2 && R.q >= .7 ? 'Out past the buoy and back' : null], stat: m, statName: 'm' }; } },
  fish: { skill: 'fishing', title: () => 'Fish on!', fxc: PAL.water,
    kit: () => ({ kind: 'balance', icon: 'skill.fishing', hint: 'Hold to reel, let go to give line. Keep the tension in the green until the fish tires.', scene: fishScene, verdicts: ['It got away', 'A nibble', 'Landed it', 'What a catch!'] }),
    result: R => { if (R.played && R.q < .3) return { icon: 'skill.fishing', title: 'It got away', lines: ['Keep the line in the green a little longer.'] };
      const l = lvl('fishing'), top = l - 1, pick = clamp(Math.round(top - Math.random() * 3 * (1.2 - R.q) / (T().val('fish', 1))), 0, top), name = LADDER.fishing.rungs[pick], cm = Math.round(FISH_SIZE[pick] * (.8 + .5 * R.q) * (1 + .06 * (l - 1))), n = 1 + (l >= 4 && R.q >= .85 ? 1 : 0), s = st();
      const ok = safe(() => G.inv.add('fish', n), false), rec = !s.fish || cm > s.fish.cm; if (rec) s.fish = { name, cm, d: day() }; bump('fish', n); stamp('x:sk_fish');
      return { icon: 'fish', title: `${cm} cm ${name}!`, lines: [ok ? `+${n} Fresh Fish in your bag: cook it or sell it` : 'No room in your bag, so you let it go.', rec ? 'Your biggest yet' : null], stat: cm, statName: 'cm' }; } },
  arcade: { skill: 'gaming', title: (l, ctx, id, sess) => (sess.arc ? sess.arc.name : 'Arcade'), fxc: ['#e0527a', '#8fd8f0', '#f2c230'],
    kit: (l, ctx, id, sess) => { const a = sess.arc || ARCADE[0], par = Math.round(a.par * (.75 + .04 * l)), hi = st().arcade[a.id] || 0; sess.par = par; return { kind: 'custom', icon: 'skill.gaming', title: a.name, hint: a.hint, custom: E => ARCADE_GAMES[a.id](E, { par, hi }), theme: { bg: '#161427' }, verdicts: ['Game over', 'Not bad', 'High-score pace', 'Par beaten!'] }; },
    result: R => { const s = st(), a = R.sess.arc || ARCADE[0], pts = R.played ? (R.stats.points || 0) : Math.round((R.sess.par || a.par) * .45), hi = s.arcade[a.id] || 0, rec = pts > hi; if (rec) s.arcade[a.id] = pts; const fun = Math.round((R.played ? 2 + 6 * R.q : 2) * (1 + .03 * (lvl('gaming') - 1))); safe(() => G.needs.add('fun', fun), 0); if (R.played && pts >= (R.sess.par || a.par)) stamp('x:sk_arcade');
      return { icon: 'skill.gaming', title: `${a.name}: ${pts} points`, lines: [rec && R.played ? 'NEW HIGH SCORE. Your initials go on the board.' : `Best ${Math.max(hi, pts)} · par ${R.sess.par || a.par}`, `Fun +${fun}`], stat: pts, statName: 'pts', recKey: 'arcade:' + a.id }; } },
  chess: { skill: 'chess', also: ['logic'], title: l => 'Chess vs. ' + LADDER.chess.rungs[l - 1], fxc: PAL.good,
    kit: l => ({ kind: 'custom', icon: 'skill.chess', hint: 'Tap the square where your white piece attacks TWO black pieces at once (dots show its moves).', custom: E => chessGame(E, { blitz: l >= 7 }), verdicts: ['Outplayed', 'A fighting draw', 'A clean win', 'Brilliant!'] }),
    result: R => { const s = st(), l = lvl('chess'), d = R.played ? Math.round((R.q - .45) * 44 * (1 + .05 * (l - 1)) * (l >= 7 ? 1.3 : 1)) : 3, c = s.chess; c.elo = Math.max(400, c.elo + d); c.hi = Math.max(c.hi, c.elo); if (R.played) { if (R.q >= .55) { c.w++; stamp('x:sk_chess'); } else c.l++; }
      return { icon: 'skill.chess', title: R.played ? `Solved ${R.stats.solved || 0} of ${R.stats.of || 5}` : 'A quiet game', lines: [`Rating ${c.elo} (${d >= 0 ? '+' : ''}${d})`], stat: c.elo, statName: 'rating', recKey: 'none' }; } },
  pour: { skill: 'mixology', title: l => 'Mix: ' + drinkName(l), fxc: PAL.water,
    kit: () => ({ kind: 'aim', icon: 'skill.mixology', hint: 'Hold to pour, let go at the green line. Three pours.', o: { mode: 'pour', shots: 3 }, theme: { icon: 'sk.bottle' }, verdicts: ['Spilled it', 'Drinkable', 'Well balanced', 'Bartender grade!'] }),
    result: R => { const l = lvl('mixology'), item = l >= 3 && R.q >= .5 ? 'bar_cocktail' : 'bar_mocktail', name = l >= 3 && R.q >= .5 ? drinkName(l) : LADDER.mixology.rungs[Math.min(1, l - 1)], q = (1 + .04 * (l - 1)) * (.8 + .4 * R.q);
      if (R.played && R.q < .2) return { icon: item, title: 'Down the sink', lines: ['Too much, too fast. Try again.'] };
      const ok = safe(() => G.inv.add(item, 1, { q, exp: G.state.t + 240 }), false); if (!ok) safe(() => G.inv.applyEffects(ITEM_BY_ID[item].effects, q), 0); addWork({ k: 'drink', n: name, q: R.q });
      return { icon: item, title: `You mixed a ${name}`, lines: [ok ? 'In your bag: drink it within four hours or hand it to a friend' : 'No room to carry it, so you drink it now.'] }; } },
  haggle: { skill: 'bartering', also: ['charisma'], title: (l, ctx) => 'Haggle: ' + ((ctx.sale && ctx.sale.label) || 'your wares'), fxc: PAL.good,
    kit: (l, ctx) => ({ kind: 'timing', icon: 'skill.bartering', hint: 'The buyer wavers. Tap when the marker is in the green to close high. Three rounds.', o: { rounds: 3, high: true, zone: .26 }, scene: haggleScene(ctx.sale && ctx.sale.icon), verdicts: ['They lowballed you', 'A fair price', 'A good price', 'They paid top dollar!'] }),
    result: R => { const sale = R.ctx.sale; if (!sale) return { icon: 'skill.bartering', title: 'Nothing changed hands', lines: [] }; if (!sale.take()) return { icon: 'skill.bartering', title: 'You no longer have it', lines: [] };
      const amt = Math.max(1, Math.round(sale.base * (.75 + .5 * R.q) * (1 + .04 * (lvl('bartering') - 1)) * (lvl('bartering') >= 6 ? 1.08 : 1) * T().val('sell', 1) * 4) / 4); pay(amt, 'Sold: ' + sale.label, 'sold'); stamp('x:sk_sell'); G.emit('skill:sold', { label: sale.label, amount: amt });
      return { icon: 'ui.coin', title: `Sold for ${money(amt)}`, lines: [sale.label, R.played && R.q >= .85 ? 'Top price. They shook your hand.' : null] }; } },
  outfit: { skill: 'style', title: () => 'Put a look together', fxc: PAL.heart,
    kit: () => ({ kind: 'sort', icon: 'skill.style', hint: 'Which occasion is each piece for? Tap the right rail.', theme: { icon: 'skill.style', color: '#e0527a' }, o: { bins: OUTFIT.bins, items: OUTFIT.items }, verdicts: ['A fashion risk', 'Presentable', 'Well dressed', 'Head-turning!'] }),
    result: R => { if (R.q < .55) return { icon: 'skill.style', title: 'Not quite a look', lines: ['Something clashes. Try again any time.'] }; const l = lvl('style'), mins = (TUNE.sharpMinutes + TUNE.sharpPerLevel * (l - 1)) * T().val('sharp', 1); safe(() => G.needs.addMoodlet('looking_sharp', mins / 60), 0); return { icon: 'skill.style', title: 'Looking Sharp', lines: [`+5 mood for ${Math.round(mins / 60 * 10) / 10} hours: ${LADDER.style.rungs[l - 1]}`] }; } },
  debug: { skill: 'tech', also: ['logic'], title: l => 'Building: ' + LADDER.tech.rungs[l - 1], fxc: ['#5fb84f', '#8fe07a'],
    kit: () => ({ kind: 'memory', icon: 'skill.tech', hint: 'The test run lights up the steps. Repeat them in order to make it pass.', verdicts: ['Still red', 'Half the tests pass', 'Green build', 'Ships first try!'] }),
    result: R => { const s = st(), l = lvl('tech'); s.prog.app = clamp(s.prog.app + (.2 + .5 * R.q) * clamp(R.minutes / 45, .4, 2));
      if (s.prog.app >= 1) { s.prog.app = 0; const n = LADDER.tech.rungs[l - 1], amt = Math.round((15 + 8 * l) * (1 + .1 * (l - 1)) * (.7 + .6 * R.q)), w = addWork({ k: 'app', n, q: R.q }); pay(amt, 'App launch: ' + n, 'pay'); safe(() => G.needs.addMoodlet('proud_maker'), 0); return { icon: 'skill.tech', title: `Shipped: "${n}"`, lines: [`Launch day earnings: ${money(amt)}`, l >= 4 ? 'It will earn a little every Monday' : null], work: w }; }
      return { icon: 'skill.tech', title: `"${LADDER.tech.rungs[l - 1]}": ${Math.round(s.prog.app * 100)}% built`, lines: [] }; } },
  punchline: { skill: 'comedy', also: ['charisma'], title: l => 'The bit: ' + LADDER.comedy.rungs[l - 1], fxc: PAL.good,
    kit: () => ({ kind: 'timing', icon: 'skill.comedy', hint: 'Timing! Tap in the green to land each punchline.', o: { rounds: 5 }, scene: stageScene, verdicts: ['Crickets', 'A few chuckles', 'Proper laughs', 'They were crying!'] }),
    result: R => { const l = lvl('comedy'), laughs = R.played ? (R.stats.perfect || 0) + Math.round(R.q * 3) : 2; if (R.id === 'sk_jokes_mirror') return { icon: 'skill.comedy', title: R.q >= .55 ? 'That one is ready for a crowd' : 'Needs work. The mirror was polite.', lines: [] };
      const amt = Math.max(1, Math.round((R.id === 'open_mic' ? 4 + 2 * l : 3 + 2.5 * l) * (.4 + R.q) * (1 + .08 * (l - 1)) * tipMult())); pay(amt, R.id === 'open_mic' ? 'Open mic: extra tips' : 'Street comedy tips', 'tips'); crowdSay('busker');
      return { icon: 'skill.comedy', title: `${laughs} big laughs`, lines: [`${money(amt)} in tips`], stat: laughs, statName: 'laughs' }; } },
  smalltalk: { skill: 'charisma', title: () => 'Small talk', fxc: PAL.heart,
    kit: () => ({ kind: 'sort', icon: 'skill.charisma', hint: 'Read what they say and pick the reply that fits.', theme: { icon: 'need.social', color: '#5fb84f' }, o: { bins: SMALLTALK.bins, items: SMALLTALK.lines }, verdicts: ['Awkward', 'Polite', 'A nice chat', 'A new friend, nearly!'] }),
    result: R => { const l = lvl('charisma'), soc = Math.round((R.played ? 2 + 8 * R.q : 3) * (1 + .04 * (l - 1))); safe(() => G.needs.add('social', soc), 0); const n = bump('chats'); return { icon: 'skill.charisma', title: R.q >= .85 ? 'They did not want to stop talking' : R.q >= .55 ? 'A nice chat' : 'A slightly awkward chat', lines: [`Social +${soc} · conversation no. ${n}`] }; } },
  hoops: { skill: 'fitness', title: l => (l >= 4 ? 'Hoops: from the three-point line' : 'Shoot hoops'), fxc: ['#e0703a', '#f2c230'],
    kit: l => ({ kind: 'aim', icon: 'skill.fitness', hint: 'Tap to lock your aim in the green arc, then tap again to lock the power.', o: { mode: 'throw', shots: l >= 4 ? 6 : 5 }, verdicts: ['All bricks', 'A couple dropped', 'Hot hand', 'Nothing but net!'] }),
    result: R => { const made = R.played ? (R.stats.made || 0) : 2, streak = R.played ? (R.stats.streak || 0) : 1; safe(() => G.needs.addFitness(.4 + R.q * .8), 0); if (streak >= 3) stamp('x:sk_hoops'); return { icon: 'skill.fitness', title: `${made} of ${R.stats.shots || 5} went in`, lines: [streak >= 2 ? `${streak} in a row` : null], stat: streak, statName: 'in a row' }; } },
  darts: { skill: 'gaming', title: () => 'Darts', fxc: PAL.good,
    kit: () => ({ kind: 'aim', icon: 'skill.gaming', hint: 'Tap to lock your aim, then tap again for the throw.', o: { mode: 'throw', shots: 3 }, theme: { icon: 'sk.dart', paper: '#5a3a2c' }, scene: (c, x, y, w, h) => { D.disc(c, 140 - 2, 34, 15, D.INK); D.disc(c, 138, 34, 14, '#fffdf4'); D.disc(c, 138, 34, 10, '#2f7f5f'); D.disc(c, 138, 34, 6, '#fffdf4'); D.disc(c, 138, 34, 2, D.BAD); }, verdicts: ['Hit the wall', 'On the board', 'Trebles', 'One hundred and eighty!'] }),
    result: R => ({ icon: 'skill.gaming', title: R.played ? `${R.stats.made || 0} of 3 in the bull` : 'A friendly game', lines: [] }) },
};
const curSong = l => { const known = new Set(works('song').map(w => w.n)); for (let i = 0; i < l; i++) if (!known.has(LADDER.music.rungs[i])) return LADDER.music.rungs[i]; return LADDER.music.rungs[l - 1]; };
const anySong = () => { const k = works('song'); return k.length ? k[Math.floor(Math.random() * k.length)].n : LADDER.music.rungs[0]; };
const drinkName = l => LADDER.mixology.rungs[Math.max(2, l - 1)] || 'Blue Heron';
const TW = [['The', 'A', 'One', 'Last', 'No'], ['Late', 'Quiet', 'Yellow', 'Borrowed', 'Salt', 'Paper', 'Second', 'Slow'], ['Ferry', 'Lighthouse', 'Tuesday', 'Umbrella', 'Viaduct', 'Bakery', 'Tide', 'Pigeon', 'Lantern', 'Bus Home']];
const title = () => TW.map(a => a[Math.floor(Math.random() * a.length)]).join(' ');
const tipMult = () => T().val('tips', 1) * (1 + .05 * (lvl('charisma') - 1));
function pay(amt, why, key) { safe(() => G.money.add(amt, why), 0); st().money[key] = (st().money[key] || 0) + amt; }
/** a nearby passer-by reacts with a written line (uses the dormant LINES.player / kind pools; cosmetic) */
function crowdSay(pool) {
  const p = G.player, src = safe(() => LINES.player[pool], null) || safe(() => LINES.kind[pool], null); if (!p || !G.scene || !Array.isArray(src) || !src.length) return;
  let best = null, bd = 6; for (const e of G.scene.ents) { if (e === p || e.hidden || !e.spec || e.npcId || e._coach) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; best = e; } }
  const s = src[Math.floor(Math.random() * src.length)]; if (best && typeof s === 'string' && !/\{/.test(s)) setTimeout(() => bubble(best, s, 3400), 900);
}

/* ====================================================================== sessions ====================================================================== */
let sess = null;
const fxKey = f => ((G.scene && G.scene.id) || '') + ':' + f.x + ',' + f.y;
function refreshTuned() { const s = st(), sc = G.scene, d = day(); tunedHere = []; if (!sc || !sc.fixtures) return; for (const f of sc.fixtures) { const u = s.tuned[fxKey(f)]; if (u && u >= d) tunedHere.push({ x: f.x, y: f.y, z: safe(() => sc.world.heightAt(f.x, f.y), 0) }); } for (const k in s.tuned) if (s.tuned[k] < d) delete s.tuned[k]; }
const tuned = f => { const u = f && st().tuned[fxKey(f)]; return !!u && u >= day(); };

async function begin(id, ctx, o = {}) {
  const key = o.key || GAME_FOR[id], gm = GAMES[key], a = G.busy; if (!gm || !a) return;
  const me = sess = { id, key, ctx: ctx || {}, act: a, q: null, played: false, auto: false, stats: {}, coach: o.coach || null, rate0: a.rate, paint0: id === 'paint' ? safe(() => G.inv.count('painting'), 0) : 0, minutes0: a.minutes };
  if (st().auto || (ctx && ctx.noMini)) { me.auto = true; return; }
  a.rate = Math.min(a.rate, Math.max(.1, a.minutes / TUNE.slowSecs));
  if (key === 'arcade') {
    const l = lvl('gaming'), home = id !== 'play_arcade' && !o.mall, list = ARCADE.filter(g => !home || l >= g.level);
    if (o.arc) me.arc = o.arc; else if (list.length > 1) { const s = st(), v = await choose('Pick a game', list.map(g => ({ label: g.name, sub: `Best ${s.arcade[g.id] || 0} · ${g.hint}`, value: g })).concat([{ label: 'Just play (auto)', sub: 'No mini-game this time', value: 'auto' }])); if (sess !== me || G.busy !== a) return; if (!v || v === 'auto') { me.auto = true; a.rate = me.rate0; return; } me.arc = v; } else me.arc = list[0] || ARCADE[0];
  }
  const l = lvl(gm.skill), def = Object.assign({ level: l, title: gm.title(l, me.ctx, id, me), sub: `${SK[gm.skill].name} level ${l}${o.coach ? ' · lesson with ' + o.coach.short : ''}` }, gm.kit(l, me.ctx, id, me));
  if (!def.title) def.title = gm.title(l, me.ctx, id, me); def.onBeat = q => beatFx(q, gm.fxc || PAL.good);
  G.emit('minigame:start', { game: key, activity: id, skill: gm.skill });
  const pr = play(def); requestAnimationFrame(() => requestAnimationFrame(() => { if (sess === me) camShift(); }));
  const res = await pr; camBack();
  if (sess !== me || G.busy !== a) return;                    // the activity ended some other way
  if (res.quit) { sess = null; G.endActivity(false); return; }
  if (res.auto) { me.auto = true; a.rate = me.rate0; return; }
  me.played = true; me.q = res.score; me.stats = res.stats || {}; a.rate = Math.max(me.rate0, a.left / TUNE.whoosh);
}
function finish(me, info) {
  const gm = GAMES[me.key], s = st(), played = me.played && !me.auto, l = lvl(gm.skill); let q = played ? me.q : TUNE.autoScore;
  if (played && q < TUNE.autoScore && T().get('floor')) q = TUNE.autoScore;
  const minutes = info.minutes || me.minutes0 || 15, R = { q, played, auto: !played, lvl: l, ctx: me.ctx, id: me.id, minutes, stats: me.stats || {}, sess: me, bonusServing: me.bonusServing, madePainting: me.id === 'paint' && safe(() => G.inv.count('painting'), 0) > me.paint0 };
  // bonus xp for actually playing: the session's base xp for the game's skills x score
  let bonus = 0; if (played && me.id) { const a = ACTIVITY_BY_ID[me.id] || {}, base = Object.assign({}, a.xpPerHour || {}, XP_MAP[me.id] || {}); for (const k of [gm.skill].concat(gm.also || [])) if (base[k]) bonus += G.skills.addXp(k, base[k] * minutes / 60 * q * TUNE.playBonus * T().val('mini', 1)); }
  let out = { title: gm.title(l, me.ctx, me.id, me), lines: [] }; try { out = gm.result(R) || out; } catch (e) { console.warn('skillplay result: ' + e.message); }
  // records
  const rk = out.recKey || me.key, b = s.best[rk] || (s.best[rk] = { q: 0, n: 0, stat: 0 }); let record = false;
  if (played) { b.n++; if (out.stat !== undefined) { if (out.stat > (b.stat || 0)) { record = b.n > 1 && rk !== 'none'; b.stat = out.stat; b.statName = out.statName; } } else if (q > b.q + .001) record = b.n > 1 && q >= TUNE.goodAt; if (q > b.q) b.q = q; }
  const st3 = played ? starsOf(q) : undefined;
  if (played) { if (record) { const m = T().get('record'); if (m) safe(() => G.needs.addMoodlet(m), 0); } if (st3 === 3) { safe(() => G.needs.addMoodlet('in_the_zone'), 0); stamp('x:sk_3star'); } if (st3 === 0) { const f = T().get('flop'); if (f) safe(() => G.needs.addMoodlet(f), 0); } stamp('x:sk_first'); }
  const lines = (out.lines || []).filter(Boolean); if (bonus >= 1) lines.push(`Played it yourself: +${Math.round(bonus)} bonus xp`); if (record) lines.push('New personal best!');
  card({ icon: out.icon || SK[gm.skill].icon && ('skill.' + gm.skill), title: out.title, lines, stars: st3 });
  if (played && st3 >= 2 && G.player && !G.busy) { const p = G.player; p.pose = 'cheer'; setTimeout(() => { if (!G.busy && p.pose === 'cheer') p.pose = null; }, 1300); }
  G.emit('minigame:done', { game: me.key, activity: me.id, skill: gm.skill, score: q, stars: st3 || 0, auto: !played, played, record });
  return R;
}
function onDone(id, info) {
  info = info || {}; const minutes = info.minutes || 0, s = st(), me = sess && sess.id === id ? sess : null; if (me) sess = null; if (MG.cur && me) abort(); camBack();
  const ok = info.completed || minutes >= 5, a = ACTIVITY_BY_ID[id] || {}, ctx = (me && me.ctx) || {};
  if (minutes > 0) for (const k in XP_MAP[id] || {}) G.skills.addXp(k, XP_MAP[id][k] * minutes / 60);
  if (!ok) return;
  const prim = (me && GAMES[me.key].skill) || Object.keys(XP_MAP[id] || {})[0] || Object.keys(a.xpPerHour || {})[0], fun = (info.totals && info.totals.fun) || 0;
  if (prim && s.interests.includes(FAMILY_OF[prim]) && fun > 0) { const add = Math.round(fun * INTEREST.fun); if (add >= 1) { safe(() => G.needs.add('fun', add), 0); if (!me) toast(`Right up your street: +${add} Fun (an interest of yours).`, 'good', 2600); else me.interestFun = add; } }
  if (ctx.fx && tuned(ctx.fx) && !/^sk_tune/.test(id)) { if (fun > 0) safe(() => G.needs.add('fun', fun * TUNE.tuneBonus), 0); for (const k in a.xpPerHour || {}) if (k !== '$bookSkill') G.skills.addXp(k, a.xpPerHour[k] * minutes / 60 * TUNE.tuneBonus); }
  if (me && info.completed) finish(me, info);
}

/* ====================================================================== selling, coaches, world spots ====================================================================== */
function sellables() {
  const out = [], s = st(), inv = G.inv, cr = lvl('creativity'), art = 1 + .1 * (cr - 1); if (!inv) return out;
  const np = safe(() => inv.count('painting'), 0);
  if (np > 0) { const w = s.works.find(x => x.k === 'painting' && !x.sold), q = w ? w.q : .5, base = ((ITEM_BY_ID.painting.sellBase || 20) + (ITEM_BY_ID.painting.sellPerCreativityLevel || 12) * cr) * (1 + .08 * (lvl('painting') - 1)) * (.7 + .6 * q) * (lvl('painting') >= 4 ? 1.15 : 1);
    out.push({ id: 'painting', icon: 'painting', label: w ? `Painting "${w.n}"` : 'Your painting', sub: `about ${money(Math.round(base))}`, base, take: () => { if (!inv.remove('painting', 1)) return false; if (w) w.sold = 1; return true; } }); }
  if (lvl('photography') >= 3) { const ph = s.works.filter(x => x.k === 'photo' && !x.sold && x.q >= .3).sort((a, b) => b.q - a.q)[0]; if (ph) { const base = (6 + 2 * lvl('photography')) * (.6 + .8 * ph.q) * art * (1 + .1 * (lvl('photography') - 1)); out.push({ id: 'photo', icon: 'skill.photography', label: `Print: ${ph.n}`, sub: `about ${money(Math.round(base))} (the photo stays in your album)`, base, take: () => { ph.sold = 1; return true; } }); } }
  const sk = s.works.find(x => x.k === 'sketch' && !x.sold); if (sk) { const base = (4 + 1.5 * cr) * (.6 + .8 * sk.q); out.push({ id: 'sketch', icon: 'skill.painting', label: sk.n, sub: `about ${money(Math.round(base))}`, base, take: () => { sk.sold = 1; return true; } }); }
  if (lvl('bartering') >= 2) { const nf = safe(() => inv.count('fish'), 0); if (nf > 0) out.push({ id: 'fish', icon: 'fish', label: `${nf} x Fresh Fish`, sub: `about ${money(nf * 4)}`, base: nf * 4, take: () => inv.remove('fish', nf) });
    for (const c of [...new Set(CROPS)]) { const n = safe(() => inv.count(c), 0); if (n >= 2) out.push({ id: c, icon: c, label: `${n} x ${ITEM_BY_ID[c].name}`, sub: `about ${money(n * ITEM_BY_ID[c].price * .8)}`, base: n * ITEM_BY_ID[c].price * .8, take: () => inv.remove(c, n) }); } }
  return out;
}
async function sell(poi) {
  if (G.busy) return; const list = sellables(), b = lvl('bartering');
  if (!list.length) { await say([{ who: 'Market trader', text: 'Bring me something you made, caught or grew: a painting, a sketch' + (lvl('photography') >= 3 ? ', a photo print' : '') + (b >= 2 ? ', fish, vegetables' : '') + '. I pay fair. Well. Fair-ish.' }]); if (b < 2) toast('Fish and vegetables sell here from Bartering level 2. Photo prints from Photography level 3.', 'info', 4200); return; }
  const v = await choose('Sell at the market', list.map(x => ({ label: x.label, sub: x.sub, icon: iconEl(x.icon, 2), value: x })), { text: 'Haggle for a better price, or tap Auto in the game for the usual one.' }); if (!v) return;
  safe(() => G.activities.start('sk_sell', { poi, sale: v, noSummary: true }), null);
}
const hourOk = c => { const h = safe(() => G.now().hf, 12); return h >= c.hours[0] && h < c.hours[1]; };
const coachEnts = new Map();
function findSpot(w, at) {
  if (at.xy) return { x: at.xy[0], y: at.xy[1] };
  if (at.poi) { const p = w.pois.find(q => q && (q.id === at.poi || q.kind === at.poi || q.name === at.poi)); return p ? { x: p.x, y: p.y } : null; }
  if (at.prop) { const obs = w.objs.filter(o => o.a && o.a.id === at.prop); const o = obs[at.n || 0] || obs[0]; return o ? { x: o.x, y: o.y } : null; }
  return null;
}
/** a free cell near (x, y) that is not on top of another point of interest (so its tap target is its own) */
function clearNear(w, x, y, min = 1.7) { for (let r = 0; r < 5; r += .5) for (let a = 0; a < 8; a++) { const X = Math.round((x + Math.cos(a * .785) * r) * 2) / 2, Y = Math.round((y + Math.sin(a * .785) * r) * 2) / 2; if (!w.isBlocked(X, Y) && !w.pois.some(p => p && isFinite(p.x) && Math.hypot(p.x - X, p.y - Y) < min)) return { x: X, y: Y }; } return freeNear(w, x, y); }
function freeNear(w, x, y) { for (let r = 0; r < 4; r += .5) for (let a = 0; a < 8; a++) { const X = Math.round((x + Math.cos(a * .785) * r) * 2) / 2, Y = Math.round((y + Math.sin(a * .785) * r) * 2) / 2; if (!w.isBlocked(X, Y)) return { x: X, y: Y }; } return { x, y }; }
function buildCity(sc) {
  if (!sc || sc.id !== 'city' || sc._skBuilt || !sc.world) return; sc._skBuilt = true; const w = sc.world, A = charArt();
  // basketball hoops (props without a poi) -> "Shoot Hoops"
  w.objs.filter(o => o.a && o.a.id === 'prop.park.hoop').forEach((o, i) => { const sp = freeNear(w, o.x + 1.5, o.y + 1.5), poi = { type: 'spot', id: 'sk:hoop:' + i, kind: 'hoop', name: 'Basketball hoop', x: o.x, y: o.y };
    G.addInteractable({ scene: 'city', x: o.x + .5, y: o.y + .5, label: 'Basketball hoop', h: 1.6, range: 2.2, spot: sp, poi, use: () => safe(() => G.activities.menu({ poi, tags: ['hoop'], title: 'Basketball hoop' }), 0) }); });
  // the Old Town Market trading post
  const mk = w.pois.find(p => p && p.id === 'stall:market_stalls'); if (mk) { const sp = clearNear(w, mk.x + 1.5, mk.y + 5.5, 2.2), poi = { type: 'spot', id: 'sk:market', kind: 'market_trade', name: 'Old Town Market', x: sp.x, y: sp.y }; sc._skMarket = poi;
    const spec = Object.assign({}, A.randomSpec(rng(4411), { age: 'adult', season: 1 }), { bag: null, hat: 'flatcap' }), c = new Char(spec, sp.x, sp.y - .9); c.z = w.heightAt(c.x, c.y); c.dir = 0; c._coach = true; c.label = 'Market trader'; sc.ents.push(c); sc._skTrader = c;
    G.addInteractable({ scene: 'city', ent: c, x: c.x, y: c.y, label: 'Market trader · sell your work', h: 1.3, hit: 8, range: 2, spot: sp, poi, visible: () => !c.hidden, use: () => { c.faceTo(G.player.x, G.player.y); sell(poi); } }); }
  // coaches
  COACHES.forEach((cd, i) => { const at = findSpot(w, cd.at); if (!at) return; const sp = clearNear(w, at.x + cd.off[0], at.y + cd.off[1], 1.3);
    const spec = Object.assign({}, A.randomSpec(rng(7700 + i * 13), { age: cd.look.age || 'adult', season: 1 }), { bag: null }); if (cd.look.hat) { spec.hat = cd.look.hat; spec.hatColor = spec.hatColor || '#2f3f72'; }
    const c = new Char(spec, sp.x, sp.y); c.z = w.heightAt(sp.x, sp.y); c.dir = i % 2; c._coach = true; c.label = cd.short; c.hidden = !hourOk(cd); sc.ents.push(c); coachEnts.set(cd.id, c);
    G.addInteractable({ scene: 'city', ent: c, x: sp.x, y: sp.y, label: `${cd.short} · ${SK[cd.skill].name} lesson`, h: 1.3, hit: 8, range: 1.9, visible: () => !c.hidden, use: () => { c.faceTo(G.player.x, G.player.y); lesson(cd.id); } }); });
}
function coachTick() { const sc = G.sceneCache && G.sceneCache.get('city'); if (!sc) return; for (const cd of COACHES) { const c = coachEnts.get(cd.id); if (c) c.hidden = !hourOk(cd); } const tr = sc._skTrader; if (tr) { const h = safe(() => G.now().hf, 12); tr.hidden = !(h >= 8 && h < 19); } }
const coaches = () => COACHES.map(cd => { const c = coachEnts.get(cd.id); return Object.assign({}, cd, { x: c ? c.x : null, y: c ? c.y : null, here: !!c && hourOk(cd), doneToday: st().coach[cd.id] === day() }); });
async function lesson(id) {
  const cd = COACHES.find(c => c.id === id), c = coachEnts.get(id), s = st(); if (!cd || G.busy) return false;
  if (s.coach[id] === day()) { if (c) bubble(c, 'One lesson a day. Go and practise what I showed you.', 3600); return false; }
  const fav = cd.favour && safe(() => G.inv.count(cd.favour), 0) > 0 ? cd.favour : null;
  const v = await choose(cd.name, [{ label: `Take a lesson · ${money(cd.fee)}`, sub: `About 30 minutes. ${SK[cd.skill].name} xp, ${Math.round(TUNE.coachMult * 100) / 100}x what practice alone gives`, value: 'pay', disabled: !safe(() => G.money.canAfford(cd.fee), true) },
    fav ? { label: `A lesson for your ${ITEM_BY_ID[fav].name}`, sub: 'A favour instead of a fee', value: 'fav', icon: iconEl(fav, 2) } : null, { label: 'Just say hello', value: 'hi' }].filter(Boolean), { text: `${cd.role}. Here ${String(cd.hours[0]).padStart(2, '0')}:00 to ${cd.hours[1]}:00.${cd.favour && !fav ? ` Would also teach for a ${ITEM_BY_ID[cd.favour] ? ITEM_BY_ID[cd.favour].name : cd.favour}.` : ''}` });
  if (!v) return false; if (v === 'hi') { if (c) bubble(c, cd.line, 3800); return false; }
  if (v === 'pay' && !safe(() => G.money.pay(cd.fee, 'Lesson: ' + cd.short, { category: 'fun' }), true)) return false; if (v === 'fav') G.inv.remove(fav, 1);
  const refund = () => { delete s.coach[id]; if (v === 'pay') safe(() => G.money.add(cd.fee, 'Lesson refunded'), 0); else safe(() => G.inv.add(fav, 1, { silent: true }), 0); toast(`${cd.short}: "Another time, then." (${v === 'pay' ? 'fee' : 'favour'} returned)`, 'info', 3200); };
  s.coach[id] = day(); if (c) bubble(c, cd.hello, 3600);
  return new Promise(res => {
    let me = null;
    G.startActivity({ label: 'Lesson with ' + cd.short, anim: cd.game === 'hoops' ? 'lift' : 'talk', minutes: 30, rate: 2, canCancel: true,
      cancel: () => { if (sess === me) sess = null; if (MG.cur) abort(); camBack(); refund(); res(false); },
      done: () => { const m = me; if (sess === m) sess = null; camBack(); const q = m && m.played ? m.q : TUNE.autoScore, xp = G.skills.teach(cd.skill, TUNE.coachXp * (1 + q), 'coach'); safe(() => G.needs.addMoodlet('lesson_learned'), 0); stamp('x:sk_coach'); bump('lessons');
        card({ icon: 'skill.' + cd.skill, title: `Lesson with ${cd.short}`, lines: [`${SK[cd.skill].name} +${Math.round(xp)} xp`, m && m.played ? null : 'You watched and listened.'], stars: m && m.played ? starsOf(q) : undefined }); if (c) setTimeout(() => bubble(c, cd.bye, 3600), 500);
        G.emit('minigame:done', { game: cd.game, activity: null, skill: cd.skill, score: q, stars: m && m.played ? starsOf(q) : 0, auto: !(m && m.played), played: !!(m && m.played), coach: id }); G.emit('coach:lesson', id, q); res(true); } });
    begin(null, {}, { key: cd.game, coach: cd }).catch(e => console.warn('skillplay: ' + e.message)); me = sess;
  });
}

/* ---------- the mall's arcade cabinets (they start a plain core activity): give them the real games ---------- */
function mallArcade(a) {
  if (!a || a.actId || !/^Playing /.test(a.label || '') || !G.scene || G.scene.roomId !== 'deptstore' || st().auto) return; const name = a.label.replace(/^Playing /, '');
  const arc = ARCADE[Math.abs([...name].reduce((h, ch) => h * 31 + ch.charCodeAt(0) | 0, 7)) % ARCADE.length], done0 = a.done; let me = null;
  a.done = () => { const m = me; if (!m || !m.played) return done0 && done0(); if (sess === m) sess = null; const S = G.state.showpieces || (G.state.showpieces = {}), hi = S.arcade || (S.arcade = {}), score = (m.stats.points || 0) * 100, best = score > (hi[name] || 0); if (best) hi[name] = score;
    safe(() => G.needs.add('fun', best ? 24 : 18), 0); G.emit('mall:arcade', score, name); G.skills.addXp('gaming', 10 + 14 * m.q); finish(Object.assign(m, { id: 'sk_arcade_mall' }), { minutes: 15, completed: true }); };
  const c0 = a.cancel; a.cancel = () => { if (sess === me) sess = null; if (MG.cur) abort(); camBack(); c0 && c0(); };
  begin('sk_arcade_mall', {}, { key: 'arcade', arc: Object.assign({}, arc, { name }), mall: true }).catch(e => console.warn('skillplay: ' + e.message)); me = sess;
}

/* ====================================================================== demo (tests / "Try it") ====================================================================== */
async function demo(key, level, opts = {}) {
  const gm = GAMES[key]; if (!gm) return null; const l = level || lvl(gm.skill), me = { ctx: opts.ctx || {}, arc: opts.arc ? ARCADE.find(a => a.id === opts.arc) : ARCADE[0] };
  const def = Object.assign({ level: l, title: gm.title(l, me.ctx, opts.id || null, me), sub: `${SK[gm.skill].name} level ${l} · practice` }, gm.kit(l, me.ctx, opts.id || null, me)); def.onBeat = q => beatFx(q, gm.fxc || PAL.good);
  const pr = play(def); requestAnimationFrame(() => requestAnimationFrame(camShift)); const res = await pr; camBack(); return res;
}

/* ====================================================================== init ====================================================================== */
function levelUp(k, l) {
  G.emit('skill:level', k, l); const L = LADDER[k]; if (!L) return; const gate = GATES[k] && GATES[k][l];
  setTimeout(() => { card({ icon: 'skill.' + k, title: `${SK[k].name} level ${l}`, lines: [`${L.what}: ${L.rungs[l - 1]}`, gate ? 'New: ' + gate : null, L.perk(l)], ms: 6200 }); }, 700);
  safe(() => G.phone.notify({ app: 'me', title: `${SK[k].name} level ${l}`, text: `${L.what}: ${L.rungs[l - 1]}${gate ? '. New: ' + gate : ''}`, icon: 'skill.' + k, priority: 'low', data: { skill: k } }), 0);
  if (l >= 5) stamp('x:sk_level5');
}
function sanity() {   // were the new skills registered before the activity runner built its lookups? (see data/skills_extra.js header)
  const id = '__sk_probe'; ACTIVITY_BY_ID[id] = { id, name: 'x', requires: { skill: { music: 99 } }, minutes: { default: 1 } }; let ok = true;
  try { const r = G.activities.blocked(id, {}); ok = typeof r === 'string' && /Music/.test(r); } catch (e) { ok = false; } delete ACTIVITY_BY_ID[id];
  if (!ok) console.warn('skillplay: the new skills were registered after the activity runner loaded; skill books for new skills and level gates may misbehave (check src/art/icons/skills_extra.js is still imported by the art index).');
  return ok;
}
export function init() {
  G.defineState('skillplay', fresh); st(); wrapSkills();
  for (const x of GUIDE_X) if (!EXPERIENCES.some(e => e.id === x.id)) EXPERIENCES.push(Object.assign({ group: 'Skills & hobbies' }, x));
  const on = (ev, fn) => G.on(ev, (...a) => { try { return fn(...a); } catch (e) { console.warn('skillplay: ' + e.message); } });
  on('load', () => { st(); sess = null; noteFirst = {}; if (MG.cur) abort(); camBack(); const xp = safe(() => G.state.needs.xp, null); if (xp) for (const k of SKILL_IDS) if (xp[k] === undefined) xp[k] = 0; setTimeout(refreshTuned, 0); });
  on('activity:start', (id, ctx) => { swim = null; if (id === 'sk_bay_swim') startSwim(ctx); if (GAME_FOR[id]) begin(id, ctx || {}).catch(e => console.warn('skillplay: ' + e.message)); });
  on('activity', a => mallArcade(a));
  on('activityEnd', a => { if (sess && sess.act === a && !sess.id) return; if (sess && sess.act === a && MG.cur) { abort(); camBack(); } swim = null; });
  on('activity:done', onDone);
  on('cooked', rid => { if (sess && (sess.id === 'cook' || sess.id === 'prep_cold') && sess.played && sess.q >= TUNE.greatAt) { const mid = 'meal_' + rid; if (safe(() => G.inv.fridge.add(mid, 1, { silent: true }), false) || safe(() => G.inv.add(mid, 1, { silent: true }), false)) sess.bonusServing = true; } });
  on('skill:up', levelUp);
  on('scene', sc => { buildCity(sc); coachTick(); refreshTuned(); });
  on('hour', coachTick);
  on('day', () => { const s = st(), apps = works('app').length; if (lvl('tech') >= 4 && apps && safe(() => G.now().weekday, 1) === 0) { const amt = Math.min(30, apps * 3); pay(amt, 'App downloads', 'pay'); toast(`Your apps earned ${money(amt)} this week.`, 'money', 3600); } for (const k in s.first) if (s.first[k].d < day() - 1) delete s.first[k]; });
  // other systems' own games feed the same skills (all defensive: these events may or may not exist)
  on('natatorium:swim', o => G.skills.addXp('swimming', 14 + Math.min(40, ((o && o.dist) || 50) / 10))); on('natatorium:length', () => G.skills.addXp('swimming', 3)); on('natatorium:dive', () => G.skills.addXp('swimming', 8)); on('natatorium:race', () => G.skills.addXp('swimming', 30));
  on('cityhall:busk', () => G.skills.addXp('music', 14)); on('cityhall:stall', () => G.skills.addXp('bartering', 16)); on('hotel:cocktail', () => G.skills.addXp('mixology', 16)); on('hotel:dance', () => G.skills.addXp('dancing', 14));
  on('photo', onn => { if (onn) G.skills.addXp('photography', 6); }); on('skydeck:photo', () => G.skills.addXp('photography', 10));
  on('shop:buy', (id, qty, venueId) => { if (/^(stand_|pubw:)|market_stalls/.test(String(venueId || ''))) G.skills.addXp('bartering', 3); });
  on('fishmarket:auction', () => G.skills.addXp('bartering', 12)); on('arena:shot', () => G.skills.addXp('fitness', 4)); on('museum:dig', () => G.skills.addXp('handiness', 6)); on('observatory:trace', () => G.skills.addXp('logic', 6));
  on('ready', () => { sanity(); for (const t of TIPS_X) safe(() => G.tips.register(t), 0); safe(() => G.guide.rebuild(), 0); buildCity(G.scene); coachTick(); refreshTuned(); });
  G.overlays.push((ctx, cam, dt) => { try { drawFx(ctx, cam, dt); } catch (e) { /* cosmetic */ } });
  G.skillplay = { state: st, games: () => Object.keys(GAMES).map(k => ({ key: k, skill: GAMES[k].skill, title: GAMES[k].title(lvl(GAMES[k].skill), {}, null, {}), best: st().best[k] || null })), best: k => st().best[k] || null,
    setAuto: v => { st().auto = v ? 1 : 0; }, auto: () => !!st().auto, demo, works, thumb, coaches, lesson, sellables, sell: () => sell(safe(() => G.sceneCache.get('city')._skMarket, null)), tuned, chess: () => st().chess, current: () => sess,
    gameFor: id => GAME_FOR[id] || null, GAMES, arcade: ARCADE, families: FAMILIES, xpMap: XP_MAP, newSkills: NEW_SKILLS.map(s => s.id), drawView };
}
function startSwim(ctx) {
  const p = G.player, w = G.world, poi = ctx && ctx.poi; if (!p || !w || !poi) return; let best = null;
  for (let r = 2; r < 16 && !best; r++) for (let a = 0; a < 16; a++) { const x = poi.x + Math.cos(a * .3927) * r, y = poi.y + Math.sin(a * .3927) * r, t = w.tileType(x, y); if (t === GT.water || t === GT.deepwater) { const x2 = poi.x + Math.cos(a * .3927) * (r + 2.5), y2 = poi.y + Math.sin(a * .3927) * (r + 2.5), t2 = w.tileType(x2, y2); best = t2 === GT.water || t2 === GT.deepwater ? { x: x2, y: y2 } : { x, y }; break; } }
  if (!best) return; const sp = p.spec || {}; swim = { x: best.x, y: best.y, z: safe(() => w.heightAt(best.x, best.y), 0), t: 0, skin: sp.skin || '#e8b890', hair: sp.hairColor || '#3a2a20' }; p.hidden = true;
}
