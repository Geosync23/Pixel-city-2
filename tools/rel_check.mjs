// tools/rel_check.mjs — verifies the relationships & romance data (src/story/rel_*.js + _rel_kit.js).
//   node tools/rel_check.mjs            exit 0 = all checks pass; prints counts.   --verbose lists warnings in full.
// What it checks is listed in docs/reports/relationships_design.md ("What rel_check verifies"). It imports data only; it runs no game code.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = rel => import(pathToFileURL(path.join(ROOT, rel)).href);
const verbose = process.argv.includes('--verbose');
const errors = [], warns = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warns.push(`${where}: ${msg}`);

const KIT = await imp('src/story/_rel_kit.js');
const RULES = await imp('src/story/rel_rules.js');
const PPL = await imp('src/story/rel_people.js');
const DATES = await imp('src/story/rel_dates.js');
const TALK = await imp('src/story/rel_dates_talk.js');
const ROM = await imp('src/story/rel_romance.js');
const ARCS = await imp('src/story/rel_arcs.js');
const SMALL = await imp('src/story/rel_small.js');
const CAST = await imp('src/story/cast.js');
const DLG = await imp('src/story/dialogue.js');
const CAL = await imp('src/data/calendar.js');
const NEEDS = await imp('src/data/needs.js');
const ITEMS = await imp('src/data/items.js');
const HOMES = await imp('src/data/homes.js');
const { VENUE_BY_ID } = await imp('src/data/venues.js');
let JOBS = null; try { JOBS = await imp('src/story/jobs_arcs.js'); } catch (e) { warn('setup', 'jobs_arcs.js not importable: ' + e.message.split('\n')[0]); }
let CH = null; try { CH = await imp('src/story/chapters.js'); } catch (e) { warn('setup', 'chapters.js not importable: ' + e.message.split('\n')[0]); }
let ART = null; try { ART = await imp('src/art/chars/char.js'); } catch (e) { warn('setup', 'art/chars/char.js not importable; look parts unchecked'); }
for (const f of ['museum', 'observatory', 'cityhall', 'aquarium', 'arena', 'fishmarket', 'lighthouse', 'natatorium', 'hotel', 'conservatory', 'post', 'university', 'venues_showpiece', 'venues_extra']) {
  try { await imp(`src/data/${f}.js`); } catch (e) { warn('setup', `data/${f}.js not importable (${e.message.split('\n')[0]})`); }
}

/* ---- limits ---- */
const L = { bubble: 110, caption: 140, choice: 110, invite: 190, text: 160, wave: 90, detail: 120, vow: 150, headline: 90, about: 180, page: 130 };

/* ---- reference sets ---- */
const CASTIDS = new Set(CAST.CAST.map(c => c.id)); CASTIDS.add('dad'); /* Dad is added to the cast at load by sim/_chapters_cast.js */
const FAMILY = new Set(CAST.CAST.filter(c => c.group === 'family').map(c => c.id).concat('dad'));
const SKILLS = new Set((NEEDS.SKILLS || []).map(s => s.id));
try { const X = await imp('src/data/skills_extra.js'); for (const s of X.NEW_SKILLS) SKILLS.add(s.id); } catch (e) { /* merged or absent */ }
const NEED_IDS = new Set((NEEDS.NEEDS || []).map(n => n.id));
const MOODS = new Set(Object.keys(NEEDS.MOODLETS || {}).concat((Array.isArray(NEEDS.MOODLETS) ? NEEDS.MOODLETS : []).map(m => m.id), Object.keys(RULES.REL_MOODLETS)));
const RECIPES = new Set((ITEMS.RECIPES || []).map(r => r.id));
const WEATHER = new Set(Object.keys(CAL.WEATHER_TYPES)), SEASONS = new Set(CAL.SEASONS.map(s => s.id)), EVENTS = new Set(CAL.EVENTS.map(e => e.id));
const CHAPTERS = new Set(CH ? CH.CHAPTERS.map(c => c.id) : Array.from({ length: 15 }, (_, i) => 'ch' + String(i + 1).padStart(2, '0')));
const FR_STAGES = KIT.FRIEND_STAGES, RO_STAGES = KIT.ROMANCE_STAGES, ALL_STAGES = new Set([...FR_STAGES, ...RO_STAGES]);
const DATE_IDS = new Set(Object.keys(DATES.DATE_TYPES));
const ROMANCE = PPL.ROMANCEABLE, ROSET = new Set(ROMANCE);
const SPEAKERS = new Set([...CASTIDS, ...Object.keys(ROM.SPEAKERS_EXTRA)]);
const TOKENS = new Set(Object.keys(RULES.TOKENS).concat(['{npc}', '{prompt}']));

const walk = (dir, out = []) => { for (const f of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, f.name); if (f.isDirectory()) walk(p, out); else if (f.name.endsWith('.js')) out.push(p); } return out; };
const MINE = /[\\/]src[\\/]story[\\/](_rel_|rel_)/;
const srcFiles = walk(path.join(ROOT, 'src'));
const SRC = Object.fromEntries(srcFiles.filter(p => !MINE.test(p)).map(p => [path.relative(ROOT, p).split(path.sep).join('/'), fs.readFileSync(p, 'utf8')]));
const inDirs = (needle, dirs) => Object.keys(SRC).some(f => dirs.some(d => f.startsWith(d)) && SRC[f].includes(needle));
const quoted = id => [`'${id}'`, `"${id}"`, '`' + id + '`'];
const idInGame = id => quoted(id).some(q => inDirs(q, ['src/scenes/', 'src/data/', 'src/sim/', 'src/world/']));
const SPECIAL_PLACES = new Set(['home', 'theirs', 'phone', 'any', 'event']);
function placeOk(id, where) {
  if (SPECIAL_PLACES.has(id)) return true;
  if (typeof id !== 'string') { err(where, `place is not a string: ${JSON.stringify(id)}`); return false; }
  if (id.startsWith('@')) { if (inDirs(id.slice(1), ['src/world/', 'src/sim/', 'src/scenes/'])) return true; err(where, `named place "${id}" not found in the game source`); return false; }
  if (id.startsWith('spot:')) { if (CAST.SPOTS[id.slice(5)]) return true; err(where, `${id}: not in cast.js SPOTS`); return false; }
  if (VENUE_BY_ID[id] || CAST.VENUES[id]) return true;
  if (JOBS && JOBS.PLACES_NEW[id]) return true;
  if (HOMES.HOME_BY_ID && HOMES.HOME_BY_ID[id]) return true;
  if (idInGame(id)) return true;
  err(where, `place id "${id}" does not exist in the venue / room / world data`);
  return false;
}

/* ---- text hygiene ---- */
function checkText(t, where, limit) {
  if (typeof t !== 'string' || !t.trim()) { err(where, 'empty text'); return; }
  if (t.length > limit) err(where, `${t.length} chars (> ${limit}): "${t.slice(0, 60)}..."`);
  if (/[–—]/.test(t)) err(where, `dash character in "${t.slice(0, 50)}"`);
  if (/ {2}/.test(t)) err(where, `double space in "${t.slice(0, 50)}"`);
  if (/[‘’“”]/.test(t)) err(where, `curly quote in "${t.slice(0, 50)}"`);
  for (const m of t.match(/\{[a-z]+\}/g) || []) if (!TOKENS.has(m)) err(where, `unknown token ${m}`);
}

/* ---- conditions and effects ---- */
const picksWritten = new Map(), flagsWritten = new Set(), memWritten = new Set(), sceneIds = new Set();
const picksRead = [], flagsRead = [], memRead = [], seenRead = [];
const textsUsed = new Set(), itemsUsed = new Set(), pagesUsed = new Set();
const ALL_TEXTS = Object.assign({}, ROM.SCENE_TEXTS, ARCS.ARC_TEXTS), ALL_ITEMS = Object.assign({}, ROM.ITEMS_NEW, ARCS.ARC_ITEMS);
const ENGINE_FLAGS = new Set([...Object.keys(ROM.ENGINE_FLAGS), ...Object.keys(ARCS.ARC_ENGINE_FLAGS)]);
const MINIGAMES = new Set(['flip', 'pour', 'write', 'sketch', 'chess', 'hoops', 'song', 'reps', 'trace', 'dig', 'auction', 'fixit']);
const SHOWS = new Set(['cinema', 'concerthall', 'playhouse', 'arena', 'venue']);
const hooksNeeded = new Set();
const arr = v => (v == null ? [] : Array.isArray(v) ? v : [v]);

function checkCond(c, where) {
  if (typeof c !== 'string') { err(where, 'condition is not a string'); return; }
  const s = c.startsWith('!') ? c.slice(1) : c;
  const pre = KIT.COND_PREFIXES.find(p => s.startsWith(p));
  if (!pre) { err(where, `condition "${c}" uses an undocumented prefix`); return; }
  const v = s.slice(pre.length);
  if (pre === 'pick:') picksRead.push([v, where]);
  else if (pre === 'flag:') flagsRead.push([v, where]);
  else if (pre === 'mem:') memRead.push([v, where]);
  else if (pre === 'seen:') seenRead.push([v, where]);
  else if (pre === 'done:') { if (!CHAPTERS.has(v)) err(where, `done:${v}: no such Chapter`); }
  else if (pre === 'weather:') { if (!WEATHER.has(v)) err(where, `weather:${v}`); }
  else if (pre === 'season:') { if (!SEASONS.has(v)) err(where, `season:${v}`); }
  else if (pre === 'festival:') { if (!EVENTS.has(v)) err(where, `festival:${v}: no such calendar event`); }
  else if (pre === 'stage:') { const m = /^([a-z_]+)>=([a-z]+)$/.exec(v); if (!m || !ROSET.has(m[1]) || !RO_STAGES.includes(m[2])) err(where, `bad stage condition "${c}"`); }
  else if (pre === 'fr:') { const m = /^([a-z_]+)>=(\d+)$/.exec(v); if (!m || !CASTIDS.has(m[1])) err(where, `bad fr condition "${c}"`); }
  else if (pre === 'date:') { if (!/^\d+$/.test(v)) err(where, `bad date condition "${c}"`); }
  else if (pre === 'time:') { if (!['morning', 'day', 'evening', 'night'].includes(v)) err(where, `time:${v}`); }
  else if (pre === 'job:') { if (JOBS && !JOBS.JOB_IDS.includes(v)) err(where, `job:${v}: no such job`); }
  else if (pre === 'lives:') { if (v !== 'together') err(where, `lives:${v}`); }
}
function checkFx(fx, where, person) {
  if (!fx) return;
  for (const k in fx) { if (k === 'do') continue; if (!KIT.EFFECT_KEYS[k]) err(where, `undocumented effect key "${k}"`); }
  for (const k of ['fr', 'ro']) for (const id in fx[k] || {}) {
    if (!CASTIDS.has(id)) err(where, `${k}: unknown person ${id}`);
    const n = fx[k][id]; if (!(n >= 1 && n <= 6)) err(where, `${k}.${id} = ${n} (expected 1-6)`);
    if (k === 'ro' && !ROSET.has(id)) err(where, `ro for ${id}, who is not romanceable`);
    if (k === 'ro' && FAMILY.has(id)) err(where, `ro for family member ${id}`);
  }
  for (const f of arr(fx.flag)) flagsWritten.add(f);
  for (const m of arr(fx.mem)) { if (!/^[a-z0-9_]+$/.test(m)) err(where, `mem key "${m}"`); memWritten.add(m); }
  for (const t of arr(fx.text)) { if (!ALL_TEXTS[t]) err(where, `text "${t}" is not in SCENE_TEXTS / ARC_TEXTS`); textsUsed.add(t); }
  if (fx.item) { if (!ALL_ITEMS[fx.item]) err(where, `item "${fx.item}" is not in ITEMS_NEW / ARC_ITEMS`); itemsUsed.add(fx.item); }
  if (fx.page) { if (!ARCS.PAGES[fx.page]) err(where, `page "${fx.page}" is not in PAGES`); pagesUsed.add(fx.page); }
  if (fx.recipe && !RECIPES.has(fx.recipe)) err(where, `recipe "${fx.recipe}" does not exist`);
  if (fx.mood && !MOODS.has(fx.mood)) err(where, `moodlet "${fx.mood}" does not exist`);
  for (const s in fx.xp || {}) { if (!SKILLS.has(s)) err(where, `xp: unknown skill ${s}`); if (!(fx.xp[s] >= 5 && fx.xp[s] <= 40)) err(where, `xp.${s} out of range`); }
  for (const n in fx.need || {}) if (!NEED_IDS.has(n)) err(where, `need: unknown need ${n}`);
}
/** Walk steps; returns { lines (longest path), choices, speakers } */
function checkSteps(steps, where, st) {
  let lines = 0;
  if (!Array.isArray(steps)) { err(where, 'steps is not an array'); return 0; }
  for (const s of steps) {
    if (typeof s === 'string') { err(where, `uncompiled shorthand string "${s.slice(0, 40)}"`); continue; }
    if (!s || !KIT.STEP_KINDS[s.do]) { err(where, `undocumented step kind ${JSON.stringify(s && s.do)}`); continue; }
    if (s.do === 'say') {
      lines++;
      if (!SPEAKERS.has(s.who)) err(where, `unknown speaker "${s.who}"`);
      st.speakers.add(s.who);
      checkText(s.text, `${where} [${s.who}]`, s.who === 'narrator' ? L.caption : L.bubble);
      if (/\b(Mr|Mrs|Ms|Dr|No)\.$/.test(s.text) || /^[a-z]/.test(s.text)) err(where, `a line cut in the wrong place: "${s.text.slice(0, 50)}"`);
      if (/\{title\}/.test(s.text) && !['pip', 'milo'].includes(s.who)) err(where, '{title} used by someone other than Pip / Milo');
    } else if (s.do === 'choice') {
      st.choices++;
      if (!s.id || picksWritten.has(s.id)) err(where, `choice id "${s.id}" missing or used twice`);
      const opts = new Set(); picksWritten.set(s.id, opts);
      if (!Array.isArray(s.options) || s.options.length < 2 || s.options.length > 3) err(where, `choice ${s.id}: needs 2-3 options`);
      let longest = 0;
      for (const op of s.options || []) {
        if (opts.has(op.id)) err(where, `choice ${s.id}: duplicate option ${op.id}`); opts.add(op.id);
        checkText(op.text, `${where} choice ${s.id}.${op.id}`, L.choice);
        checkFx(op.fx, `${where} choice ${s.id}.${op.id}`);
        longest = Math.max(longest, checkSteps(op.reply || [], `${where} ${s.id}.${op.id}`, st));
      }
      lines += longest;
    } else if (s.do === 'if') {
      checkCond(s.cond, where);
      lines += Math.max(checkSteps(s.then || [], where, st), s.else ? checkSteps(s.else, where, st) : 0);
    } else if (s.do === 'fx') checkFx(s, where);
    else if (s.do === 'play') {
      st.plays++;
      if (!KIT.PLAY_KINDS[s.kind]) err(where, `play kind "${s.kind}" undocumented`);
      if (!s.label) err(where, 'play step without a label'); else checkText(s.label, where + ' play label', 60);
      if (s.kind === 'cook' && s.id !== 'choose' && !RECIPES.has(s.id)) err(where, `cook: recipe "${s.id}" does not exist`);
      if (s.kind === 'show' && !SHOWS.has(s.id)) err(where, `show: "${s.id}"`);
      if (s.kind === 'minigame') { if (!MINIGAMES.has(s.id)) err(where, `minigame "${s.id}" is not a known game`); if (s.id === 'fixit') hooksNeeded.add('minigame:fixit'); }
      if (s.kind === 'order' && s.id !== 'venue') placeOk(s.id, where + ' order');
      if (s.kind === 'walk' && s.id !== 'venue') placeOk(s.id, where + ' walk');
      if (s.kind === 'activity' && !idInGame(s.id) && !inDirs(s.id, ['src/sim/activities.js', 'src/data/activities.js'])) hooksNeeded.add('activity:' + s.id);
    }
  }
  return lines;
}
const WHEN_OK = new Set(Object.keys(KIT.WHEN_KEYS));
function checkScene(sc, o) {
  const w = sc.id;
  if (sceneIds.has(sc.id)) err(w, 'duplicate scene id'); sceneIds.add(sc.id);
  if (!sc.title) err(w, 'no title');
  placeOk(sc.place, w + ' place');
  for (const k in sc.when || {}) if (!WHEN_OK.has(k)) err(w, `undocumented when key "${k}"`);
  const wh = sc.when || {};
  if (KIT.SOFT_WHEN.some(k => k in wh && k !== 'chapter') && !('orDays' in wh)) err(w, 'a soft condition (weekday / weather / season / event) without orDays');
  if (wh.chapter && !CHAPTERS.has(wh.chapter)) err(w, `when.chapter ${wh.chapter}`);
  if (wh.stage && !RO_STAGES.includes(wh.stage)) err(w, `when.stage ${wh.stage}`);
  for (const x of wh.weather || []) if (!WEATHER.has(x)) err(w, `when.weather ${x}`);
  for (const x of wh.season || []) if (!SEASONS.has(x)) err(w, `when.season ${x}`);
  if (wh.event && !EVENTS.has(wh.event)) err(w, `when.event ${wh.event}`);
  for (const d of wh.weekday || []) if (!(d >= 0 && d <= 6)) err(w, 'when.weekday');
  if (wh.pick) picksRead.push([wh.pick, w]); if (wh.flag) flagsRead.push([wh.flag, w]);
  if (sc.invite) checkText(sc.invite, w + ' invite', L.invite);
  if (sc.window) { const win = sc.window; if (!(win.to > win.from) || win.from < 0 || win.to > 24) err(w, 'bad window hours'); for (const d of win.days || []) if (!(d >= 0 && d <= 6)) err(w, 'bad window day'); if (wh.weekday && win.days && !wh.weekday.some(d => win.days.includes(d))) err(w, 'when.weekday and window.days never meet'); }
  const st = { choices: 0, plays: 0, speakers: new Set() };
  const lines = checkSteps(sc.steps, w, st);
  checkFx(sc.fx, w + ' end');
  if (o.minLines && (lines < o.minLines || lines > o.maxLines)) err(w, `${lines} lines on its longest path (expected ${o.minLines}-${o.maxLines})`);
  if (o.choice && !st.choices) err(w, 'no choice');
  if (o.invite && !sc.invite && !(sc.steps[0] && sc.steps[0].who === 'narrator')) err(w, 'no invite text and does not open with a caption');
  if (o.window && !sc.window) err(w, 'no window');
  if (o.ask) { if (!Array.isArray(sc.ask) || sc.ask.length !== 2) err(w, 'no `ask` pair'); else { checkText(sc.ask[0], w + ' ask', 70); const m = /^([a-z_*]+)\|(.+)$/.exec(sc.ask[1]); if (!m || !SPEAKERS.has(m[1])) err(w, 'ask answer must be "who|text"'); else checkText(m[2], w + ' ask answer', L.text); } }
  if (o.speaker && !o.speaker.some(s => st.speakers.has(s))) err(w, `${o.speaker.join(' / ')} never speaks`);
  return { lines, st };
}

/* ================================================================ 1. files ================================================================ */
const mine = srcFiles.filter(p => MINE.test(p));
for (const p of mine) {
  const t = fs.readFileSync(p, 'utf8'), f = path.basename(p);
  if (/export\s+(const|function|let|var)\s+(init|order)\b/.test(t)) err(f, 'exports init / order (must be inert when bundled)');
  for (const m of t.matchAll(/import[^;]*from\s+'([^']+)'/g)) if (!/^\.\/(_rel_kit|rel_[a-z_]+)\.js$/.test(m[1])) err(f, `imports ${m[1]} (only ./_rel_kit.js and ./rel_*.js allowed)`);
  const code = t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
  if (/\b(window|document|globalThis)\.|\blocalStorage\b|\bG\.[a-z]/.test(code)) err(f, 'uses a browser / engine global');
}
for (const [name, mod] of Object.entries({ rel_rules: RULES, rel_people: PPL, rel_dates: DATES, rel_dates_talk: TALK, rel_romance: ROM, rel_arcs: ARCS, rel_small: SMALL })) {
  for (const k in mod) { try { JSON.parse(JSON.stringify(mod[k])); if (typeof mod[k] === 'function') err(name, `export ${k} is a function`); } catch (e) { err(name, `export ${k} does not serialise to JSON`); } }
}

/* ================================================================ 2. people ================================================================ */
if (ROMANCE.length < 8 || ROMANCE.length > 10 || ROSET.size !== ROMANCE.length) err('people', `ROMANCEABLE has ${ROMANCE.length} ids (${ROSET.size} unique), expected 8-10`);
const ART_OK = ART ? { top: new Set(ART.TOPS), bottom: new Set(ART.BOTTOMS), hat: new Set(ART.HATS) } : null;
const BOSS_OF = {}; for (const j in CAST.JOBS) BOSS_OF[CAST.JOBS[j].boss] = j; if (JOBS) for (const j in JOBS.CASTS) if (!BOSS_OF[JOBS.CASTS[j].boss]) BOSS_OF[JOBS.CASTS[j].boss] = j;
function checkLikes(p, w) {
  const lk = p.likes || {}, c0 = CAST.CAST_BY_ID[p.id], c = c0 && w === 'person kids' ? { likes: { gifts: [...c0.likes.gifts, ...CAST.CAST_BY_ID.milo.likes.gifts] } } : c0;
  for (const r of lk.recipes || []) if (!RECIPES.has(r)) err(w, `likes.recipes: "${r}" is not a recipe`);
  for (const r of (p.dislikes && p.dislikes.recipes) || []) if (!RECIPES.has(r)) err(w, `dislikes.recipes: "${r}" is not a recipe`);
  for (const g of lk.gifts || []) { if (!CAST.GIFTS[g]) err(w, `likes.gifts: "${g}" is not in cast.js GIFTS`); else if (c && !c.likes.gifts.includes(g)) warn(w, `likes.gifts: "${g}" is not in their cast.js likes`); }
  for (const d of [...(lk.outings || []), ...((p.dislikes && p.dislikes.outings) || [])]) if (!DATE_IDS.has(d)) err(w, `outing "${d}" is not a DATE_TYPES id`);
  for (const pl of lk.places || []) placeOk(pl, w + ' likes.places');
  if ((lk.recipes || []).length < 3) err(w, 'needs 3+ liked recipes');
  for (const g in p.giftNotes || {}) { if (!(lk.gifts || []).includes(g)) err(w, `giftNotes.${g}: not one of their liked gifts`); checkText(p.giftNotes[g], w + ' giftNotes', L.text); }
  if (Object.keys(p.giftNotes || {}).length < 2) err(w, 'needs 2+ giftNotes');
  for (const k of ['work', 'home', 'heart', 'family']) { if (!p.advice || !p.advice[k]) err(w, `advice.${k} missing`); else checkText(p.advice[k], w + ' advice', L.text); }
  if (!p.keyLine) err(w, 'no keyLine'); else checkText(p.keyLine, w + ' keyLine', L.text);
  if (p.craft && !SKILLS.has(p.craft)) err(w, `craft "${p.craft}" is not a skill`);
}
for (const id of ROMANCE) {
  const p = PPL.PEOPLE[id], w = 'person ' + id, c = CAST.CAST_BY_ID[id];
  if (!p) { err(w, 'not in PEOPLE'); continue; }
  if (!c) { err(w, 'not a cast.js person'); continue; }
  if (p.kind !== 'romance') err(w, 'kind must be romance');
  if (FAMILY.has(id)) err(w, 'family can never be romanceable');
  if (p.age !== c.age || p.pronouns !== c.pronouns) err(w, `age / pronouns differ from cast.js (${c.age}, ${c.pronouns})`);
  if (p.age < 21) err(w, 'under 21');
  if (p.home.cast !== c.home) err(w, `home.cast "${p.home.cast}" differs from cast.js home "${c.home}"`);
  if (!CAST.HOMES[p.home.cast]) err(w, 'home.cast not in cast.js HOMES');
  placeOk(p.home.anchor, w + ' home.anchor'); checkText(p.home.address, w + ' address', 150);
  placeOk(p.work.venue, w + ' work.venue');
  if (c.work && c.work.venue !== p.work.venue && !(id === 'noor' || id === 'barnaby')) err(w, `work.venue "${p.work.venue}" differs from cast.js "${c.work.venue}"`);
  const boss = BOSS_OF[id];
  if (boss && p.work.bossOf !== boss) err(w, `is the boss of ${boss}: work.bossOf must say so`);
  if (p.work.bossOf && (!p.bossLine || !p.bossLine2)) err(w, 'a boss needs bossLine and bossLine2');
  if (!p.work.bossOf && (p.bossLine || p.bossLine2)) err(w, 'bossLine on someone who is nobody\'s boss');
  if ((p.age >= 45) !== !!p.ageLine) err(w, 'ageLine: required from 45, not allowed below');
  for (const k of ['bossLine', 'bossLine2', 'ageLine', 'missed']) if (p[k]) checkText(p[k], w + ' ' + k, L.text);
  if (!p.missed || !p.inner) err(w, 'missed / inner missing');
  if (!Array.isArray(p.free) || !p.free.length) err(w, 'no free windows'); else for (const f of p.free) if (!(f.to > f.from) || !f.days.length) err(w, 'bad free window');
  for (const look of ['date', 'home']) { const lk = p.looks && p.looks[look]; if (!lk) { err(w, `looks.${look} missing`); continue; } if (ART_OK) for (const part of ['top', 'bottom', 'hat']) if (part in lk && !ART_OK[part].has(lk[part])) err(w, `looks.${look}.${part} "${lk[part]}" is not a character art part`); for (const col of ['topColor', 'bottomColor']) if (lk[col] && !/^#[0-9a-f]{6}$/i.test(lk[col])) err(w, `looks.${look}.${col}`); }
  checkLikes(p, w);
  const pr = p.profile || {};
  checkText(pr.headline, w + ' headline', L.headline); checkText(pr.about, w + ' about', L.about); checkText(pr.looking, w + ' looking', L.headline);
  if (!Array.isArray(pr.prompts) || pr.prompts.length !== 3) err(w, 'profile needs 3 prompts'); else for (const [q, a] of pr.prompts) { checkText(q, w + ' prompt', 40); checkText(a, w + ' prompt answer', L.text); }
  if (!Array.isArray(pr.photos) || pr.photos.length !== 3) err(w, 'profile needs 3 photos'); else pr.photos.forEach(t => checkText(t, w + ' photo', 130));
  const ch = p.chat || {};
  for (const k of ['known', 'fresh']) { if (!Array.isArray(ch[k]) || !ch[k].length) err(w, `chat.${k} missing`); else ch[k].forEach(t => checkText(t, w + ' chat.' + k, L.text)); }
  if (!Array.isArray(ch.asks) || ch.asks.length !== 4) err(w, 'chat needs 4 asks'); else for (const [q, a] of ch.asks) { checkText(q, w + ' ask', 60); checkText(a, w + ' ask reply', L.text); }
  checkText(ch.yes, w + ' chat.yes', L.text);
}
if (PPL.ARC_PEOPLE.length < 10 || PPL.ARC_PEOPLE.length > 12) err('people', `ARC_PEOPLE has ${PPL.ARC_PEOPLE.length}, expected 10-12`);
for (const id of PPL.ARC_PEOPLE) {
  const p = PPL.PEOPLE[id], w = 'person ' + id;
  if (!p) { err(w, 'not in PEOPLE'); continue; }
  if (ROSET.has(id)) err(w, 'is both romanceable and an arc person');
  for (const s of ARCS.ARC_SPEAKERS[id] || []) if (!CASTIDS.has(s)) err(w, `speaker ${s} is not a cast.js person`);
  if (!ARCS.ARC_SPEAKERS[id]) err(w, 'no ARC_SPEAKERS row');
  if (!p.standing) err(w, 'no `standing`');
  checkLikes(Object.assign({}, p, { id: id === 'kids' ? 'pip' : id }), w);
}
for (const id in PPL.PEOPLE) if (!ROSET.has(id) && !PPL.ARC_PEOPLE.includes(id)) err('person ' + id, 'in PEOPLE but in neither list');
/* Porchlight */
{ const A = PPL.PORCHLIGHT, w = 'PORCHLIGHT';
  for (const k of ['name', 'tagline', 'blurb', 'availability', 'player', 'matching', 'chat', 'screens', 'openers']) if (!A[k]) err(w, `missing ${k}`);
  for (const q of A.player.prompts) if (!A.player.answers[q] || A.player.answers[q].length !== 3) err(w, `player prompt "${q}" needs 3 answers`);
  for (const s of ['home', 'card', 'hello', 'chats', 'meet', 'me', 'computer', 'empty']) if (!A.screens[s]) err(w, `screen ${s} not described`);
  A.openers.forEach(t => checkText(t, w + ' opener', L.text));
  if (idInGame('porchlight') || inDirs('Porchlight', ['src/data/', 'src/sim/', 'src/ui/'])) warn(w, 'an app called Porchlight already exists in the game');
}

/* ================================================================ 3. rules ================================================================ */
if (RULES.FRIEND_TRACK.map(s => s.id).join() !== FR_STAGES.join()) err('rules', 'FRIEND_TRACK ids differ from _rel_kit FRIEND_STAGES');
if (RULES.ROMANCE_TRACK.map(s => s.id).join() !== RO_STAGES.join()) err('rules', 'ROMANCE_TRACK ids differ from _rel_kit ROMANCE_STAGES');
RULES.FRIEND_TRACK.slice(0, 4).forEach((s, i) => { if (s.min !== DLG.RELATIONSHIP_TIERS[i].min || s.id !== DLG.RELATIONSHIP_TIERS[i].id) err('rules', `friend stage ${s.id} differs from dialogue.js RELATIONSHIP_TIERS`); });
for (const tr of [RULES.FRIEND_TRACK, RULES.ROMANCE_TRACK]) tr.forEach((s, i) => { if (i && s.min < tr[i - 1].min) err('rules', `stage ${s.id}: min falls`); });
const unlockUsed = new Set();
for (const s of [...RULES.FRIEND_TRACK, ...RULES.ROMANCE_TRACK]) for (const u of s.unlocks) { unlockUsed.add(u); if (!RULES.UNLOCKS[u]) err('rules', `unlock "${u}" (stage ${s.id}) is not described in UNLOCKS`); }
for (const u in RULES.UNLOCKS) if (!unlockUsed.has(u)) err('rules', `UNLOCKS.${u} is not unlocked by any stage`);
for (const f of RULES.ROMANCE_RULES.family) if (!FAMILY.has(f)) err('rules', `ROMANCE_RULES.family: ${f} is not family`);
for (const f of FAMILY) if (!RULES.ROMANCE_RULES.family.includes(f)) err('rules', `family member ${f} missing from ROMANCE_RULES.family`);
const oldVerbs = new Set(DLG.VERBS.map(v => v.id)), verbIds = new Set();
for (const v of RULES.VERBS_NEW) {
  const w = 'verb ' + v.id;
  if (verbIds.has(v.id) || oldVerbs.has(v.id)) err(w, 'duplicate id (or collides with dialogue.js VERBS)'); verbIds.add(v.id);
  if (!['friend', 'romance'].includes(v.track)) err(w, 'track');
  if (!(v.track === 'friend' ? FR_STAGES : RO_STAGES).includes(v.min)) err(w, `min "${v.min}" is not a stage of its track`);
  for (const k of ['label', 'offered', 'reads', 'outcome']) if (!v[k]) err(w, `missing ${k}`);
  for (const t of [...v.you, ...v.ok, ...v.soft]) checkText(t, w, L.bubble);
}
for (const m in RULES.REL_MOODLETS) { const x = RULES.REL_MOODLETS[m]; if (!x.name || !x.desc || !(x.minutes > 0)) err('moodlet ' + m, 'shape'); if (NEEDS.MOODLETS && NEEDS.MOODLETS[m]) err('moodlet ' + m, 'id already exists in data/needs.js'); }
for (const k of RULES.PACING.yieldOrder) if (!['chapter', 'work_shift', 'booked', 'family_moment', 'date', 'job_beat', 'vignette', 'opportunity', 'small'].includes(k)) err('pacing', `yieldOrder ${k}`);

/* ================================================================ 4. dates ================================================================ */
const CORE_DATES = ['coffee', 'walk', 'dinner', 'cook', 'show', 'stars'];
let firstTypes = 0, dateLineCount = 0;
for (const id in DATES.DATE_TYPES) {
  const d = DATES.DATE_TYPES[id], w = 'date ' + id;
  if (d.id !== id) err(w, 'id mismatch');
  if (!RO_STAGES.includes(d.minStage)) err(w, 'minStage');
  for (const v of d.venues) placeOk(v, w + ' venue');
  if (!(d.window.to > d.window.from)) err(w, 'window');
  if (d.window.event && !EVENTS.has(d.window.event)) err(w, `window.event ${d.window.event}`);
  if (d.bonus && !EVENTS.has(d.bonus)) err(w, `bonus event ${d.bonus}`);
  for (const x of d.window.weather || []) if (!WEATHER.has(x)) err(w, 'window.weather');
  const st = { choices: 0, plays: 0, speakers: new Set() }; checkSteps([d.play], w, st);
  for (const t of [...d.arrive, ...d.close]) checkText(t, w, L.caption);
  checkText(d.plan, w + ' plan', 60); if (d.wet) checkText(d.wet, w + ' wet', L.caption);
  if (d.first) firstTypes++;
}
if (firstTypes < 3) err('dates', 'fewer than 3 first-date types');
for (const k of DATES.DATE_ORDER) if (!['arrive', 'person_arrive', 'play', 'person_moment', 'talk', 'close', 'goodnight'].includes(k)) err('dates', `DATE_ORDER ${k}`);
for (const id of ROMANCE) {
  const p = PPL.PEOPLE[id], w = 'dates ' + id, lines = TALK.DATE_LINES[id] || {};
  const need = new Set([...CORE_DATES, ...p.likes.outings, ...((p.dislikes && p.dislikes.outings) || [])]); need.delete('plusone');
  for (const t of need) if (!lines[t]) err(w, `no DATE_LINES for "${t}" (core, liked or disliked type)`);
  for (const t in lines) { if (!DATE_IDS.has(t)) err(w, `DATE_LINES for unknown type ${t}`); if (lines[t].length !== 2) err(w, `${t}: needs [arrive, moment]`); lines[t].forEach(x => { checkText(x, `${w} ${t}`, L.bubble); dateLineCount++; }); }
  const talks = TALK.DATE_TALK[id] || [];
  if (talks.length < 4) err(w, `only ${talks.length} DATE_TALK conversations (need 4+)`);
  for (const t of talks) { if (t.when) checkCond(t.when, w + ' ' + t.id); const st = { choices: 0, plays: 0, speakers: new Set() }; const n = checkSteps(t.steps, `${w} talk ${t.id}`, st); if (st.choices !== 1) err(w, `talk ${t.id}: needs exactly one choice`); if (n < 2 || n > 8) err(w, `talk ${t.id}: ${n} lines`); if (!st.speakers.has(id)) err(w, `talk ${t.id}: ${id} never speaks`); }
  if (talks.length && talks[0].when !== 'date:2') warn(w, 'first talk is not at date:2');
  if (!(TALK.DATE_TALK_AFTER[id] || []).length || TALK.DATE_TALK_AFTER[id].length < 3) err(w, 'needs 3+ DATE_TALK_AFTER lines'); else TALK.DATE_TALK_AFTER[id].forEach(x => checkText(x, w + ' after', L.bubble));
  const fd = DATES.FIRST_DATES[id];
  if (!fd) err(w, 'no first date'); else { if (fd.id !== id + '.first_date') err(w, 'first date id'); checkScene(fd, { minLines: 9, maxLines: 22, choice: true, window: true, speaker: [id] }); const types = Object.values(DATES.DATE_TYPES).filter(d => d.first); if (!fd.window) err(w, 'first date window'); void types; }
  const g = DATES.GOODNIGHT[id]; if (!g) err(w, 'no GOODNIGHT'); else for (const k of ['fine', 'lovely', 'books']) checkText(g[k], w + ' goodnight.' + k, L.text);
  for (const k of ['late', 'stoodUp']) checkText(DATES.REPAIR[k][id], w + ' repair.' + k, L.text);
}
for (const k of ['arrive', 'moment', 'again', 'birthday']) checkSteps(DATES.DATE_FALLBACK[k], 'DATE_FALLBACK.' + k, { choices: 0, plays: 0, speakers: new Set() });

/* ================================================================ 5. hearts ================================================================ */
let heartLines = 0, heartScenes = 0, heartChoices = 0;
if (Object.keys(ROM.MILESTONES).sort().join() !== [...ROM.HEART_KEYS].sort().join()) err('romance', 'MILESTONES keys differ from HEART_KEYS');
const CHORES = ['dishes', 'plants', 'laundry', 'bins', 'tidy', 'fix'];
for (const id of ROMANCE) {
  const h = ROM.HEARTS[id], w = 'heart ' + id;
  if (!h) { err(w, 'no HEART: every romanceable needs every stage'); continue; }
  const keys = h.scenes.map(s => s.id.slice(id.length + 1));
  const want = ['meet', 'h1', 'h2', 'h3', 'steady', 'partner', 'keys', 'movein', 'proposal', 'm1', 'm2'];
  if (keys.join() !== want.join()) err(w, `scene keys are [${keys.join(', ')}], expected [${want.join(', ')}]`);
  for (const sc of h.scenes) {
    const k = sc.id.slice(id.length + 1), isH = /^h\d$/.test(k);
    const r = checkScene(sc, isH ? { minLines: 12, maxLines: 24, choice: true, invite: true, window: true, ask: true, speaker: [id] } : k === 'meet' ? { minLines: 4, maxLines: 9, window: true, speaker: [id] } : { minLines: 3, maxLines: 10, speaker: k === 'm2' || k === 'm1' ? null : [id] });
    heartLines += r.lines; heartScenes++; heartChoices += r.st.choices;
    const wantStage = { meet: null, h1: 'dating', h2: 'exclusive', h3: 'partner', steady: 'dating', partner: 'exclusive', keys: 'partner', movein: 'partner', proposal: 'partner', m1: 'married', m2: 'married' }[k];
    if (wantStage && sc.when.stage !== wantStage) err(sc.id, `when.stage should be ${wantStage}`);
    if (k === 'meet' && !(sc.when.fr >= 40)) err(sc.id, 'meet needs when.fr >= 40');
    if (k === 'h3' && !(sc.fx && sc.fx.page)) err(sc.id, 'the third heart scene must hand over a page');
    if (k === 'keys' && !(sc.fx && sc.fx.item === 'key_' + id)) err(sc.id, 'keys scene must give key_' + id);
    if (isH && !(sc.fx && sc.fx.ro && sc.fx.ro[id])) err(sc.id, 'heart scene gives no warmth');
    if (isH && sc.place === 'theirs' && !PPL.PEOPLE[id].home) err(sc.id, 'place theirs without a home');
  }
  if (!Array.isArray(h.vows) || h.vows.length < 3 || h.vows.length > 5) err(w, 'vows: 3-5 lines'); else h.vows.forEach(v => checkText(v, w + ' vows', L.vow));
  for (const [k, n] of [['morning', 3], ['evening', 3], ['chores', 2], ['night', 2]]) { const pool = h.livein && h.livein[k]; if (!pool || pool.length < n) err(w, `livein.${k}: needs ${n}+`); else heartLines += checkSteps(pool, `${w} livein.${k}`, { choices: 0, plays: 0, speakers: new Set() }); }
  if (!h.kind || h.kind.letdown.length < 2 || h.kind.breakup.length < 3 || h.kind.after.length < 2) err(w, 'kind: letdown 2+, breakup 3+, after 2+'); else { heartLines += checkSteps(h.kind.letdown, w + ' letdown', { choices: 0, plays: 0, speakers: new Set() }) + checkSteps(h.kind.breakup, w + ' breakup', { choices: 0, plays: 0, speakers: new Set() }); h.kind.after.forEach(t => checkText(t, w + ' after', L.bubble)); }
  const lp = ROM.LIVEIN.people[id]; if (!lp) err(w, 'no LIVEIN.people row'); else { if (!CHORES.includes(lp.chore)) err(w, 'LIVEIN chore'); if (!lp.brings || lp.brings.length < 2) err(w, 'LIVEIN brings'); for (const d of lp.cooksOn) if (!(d >= 0 && d <= 6)) err(w, 'cooksOn'); }
}
for (const id in ROM.HEARTS) if (!ROSET.has(id)) err('heart ' + id, 'a HEART for someone who is not in ROMANCEABLE');
/* family reacts + wedding */
for (const k of ['together', 'partner', 'engaged']) { const fr = ROM.FAMILY_REACTS[k]; for (const f of ['nana', 'jules', 'theo', 'pip', 'milo', 'dez', 'dad', 'kit']) { if (!fr[f]) err('FAMILY_REACTS.' + k, `no line for ${f}`); else fr[f].forEach(t => checkText(t, `FAMILY_REACTS.${k}.${f}`, L.invite)); } for (const f in fr) if (!CASTIDS.has(f)) err('FAMILY_REACTS.' + k, `unknown ${f}`); }
{ const W = ROM.WEDDING;
  if (W.venues.length < 4) err('WEDDING', 'fewer than 4 venues');
  for (const v of W.venues) { placeOk(v.place, 'WEDDING venue ' + v.id); if (!SPEAKERS.has(v.officiant)) err('WEDDING venue ' + v.id, `officiant ${v.officiant} unknown`); const st = { choices: 0, plays: 0, speakers: new Set() }; checkSteps(v.words, 'WEDDING venue ' + v.id, st); if (!st.speakers.has(v.officiant)) err('WEDDING venue ' + v.id, 'officiant never speaks'); for (const d of v.when.days) if (!(d >= 0 && d <= 6)) err('WEDDING venue ' + v.id, 'days'); }
  for (const r of W.receptions) { placeOk(r.place, 'WEDDING reception ' + r.id); if (r.needs) checkCond(r.needs, 'WEDDING reception ' + r.id); checkText(r.line, 'WEDDING reception', L.caption); }
  for (const k of ['gather', 'walk', 'playerVows', 'rings', 'kiss', 'after', 'rain']) { if (!W.ceremony[k]) err('WEDDING', `ceremony.${k} missing`); else heartLines += checkSteps(W.ceremony[k], 'WEDDING ceremony.' + k, { choices: 0, plays: 0, speakers: new Set() }); }
  for (const k of ['toast', 'dance', 'end']) heartLines += checkSteps(W.reception[k], 'WEDDING reception.' + k, { choices: 0, plays: 0, speakers: new Set() });
  for (const k of ['venueLiked', 'proposalPlace']) checkSteps(W[k], 'WEDDING.' + k, { choices: 0, plays: 0, speakers: new Set() });
  for (const k in W.stand) { if (k !== 'any' && !CASTIDS.has(k)) err('WEDDING.stand', k); checkText(W.stand[k], 'WEDDING.stand.' + k, L.text); }
  for (const part of W.ceremony.order) if (!/^(gather|venue\.words|walk|vows\.partner|vows\.player|rings|kiss|after|reception)$/.test(part)) err('WEDDING', `ceremony.order ${part}`);
}
for (const k of ['letdown', 'breakup']) { if (ROM.PLAYER_KIND[k].length !== 3) err('PLAYER_KIND', `${k}: needs 3 ways`); ROM.PLAYER_KIND[k].forEach(x => checkText(x.text, 'PLAYER_KIND.' + k, L.choice)); }
for (const k of ['singleBed', 'tiny']) checkSteps(ROM.LIVEIN[k], 'LIVEIN.' + k, { choices: 0, plays: 0, speakers: new Set() });
for (const id in ROM.SPEAKERS_EXTRA) { if (CASTIDS.has(id)) err('SPEAKERS_EXTRA', `${id} is already a cast id`); const n = ROM.SPEAKERS_EXTRA[id].name; if (n && n !== '{name}' && !inDirs(n.replace('Mr. ', ''), ['src/data/', 'src/sim/', 'src/story/'])) err('SPEAKERS_EXTRA', `${n} is not named anywhere in the game`); }

/* ================================================================ 6. arcs ================================================================ */
let arcLines = 0, arcScenes = 0, arcChoices = 0;
for (const id of PPL.ARC_PEOPLE) {
  const a = ARCS.ARCS[id], w = 'arc ' + id;
  if (!a) { err(w, 'no arc'); continue; }
  if (!a.title || !a.premise || !a.thread) err(w, 'title / premise / thread');
  if (a.scenes.length < 6 || a.scenes.length > 9) err(w, `${a.scenes.length} scenes (expected 6-9)`);
  const sp = ARCS.ARC_SPEAKERS[id] || [], fam = sp.some(s => FAMILY.has(s));
  let lastCh = 0;
  a.scenes.forEach((sc, i) => {
    if (sc.id.split('.')[0] !== id || sc.n !== i + 1) err(sc.id, 'id / n');
    if (i > 0 && sc.prev !== a.scenes[i - 1].id) err(sc.id, 'prev chain');
    const r = checkScene(sc, { minLines: 8, maxLines: 24, choice: true, invite: true, window: true, ask: true, speaker: sp });
    arcLines += r.lines; arcScenes++; arcChoices += r.st.choices;
    if (i === 0 && !(sc.when.fr >= 30) && !fam) err(sc.id, 'the first scene of a friend arc needs when.fr');
    if (fam && !sc.when.chapter) err(sc.id, 'family scenes need when.chapter');
    if (sc.when.chapter) { const n = +sc.when.chapter.slice(2); if (n < lastCh && fam) err(sc.id, `chapter gate goes backwards (${sc.when.chapter} after ch${lastCh})`); lastCh = Math.max(lastCh, n); }
    if (sc.place === 'phone' && id !== 'dad') err(sc.id, 'only Dad\'s arc uses the phone');
  });
  const last = a.scenes[a.scenes.length - 1];
  if (!arr(last.fx && last.fx.flag).includes(id + '_arc_done')) err(w, `the last scene must set ${id}_arc_done`);
  if (!(last.fx && last.fx.page === (id + '_page'))) err(w, `the last scene must hand over ${id}_page`);
  const choicesInArc = a.scenes.reduce((n, s) => n + JSON.stringify(s.steps).split('"do":"choice"').length - 1, 0);
  if (choicesInArc < a.scenes.length) err(w, 'fewer choices than scenes');
  const reads = JSON.stringify(a.scenes).match(/"cond":"!?(pick|mem|flag|done):/g) || [];
  if (!reads.length && !fam) warn(w, 'no scene reads anything back (a pick, a mem, a flag or a Chapter)');
}
for (const id in ARCS.ARCS) if (!PPL.ARC_PEOPLE.includes(id)) err('arc ' + id, 'not in ARC_PEOPLE');
for (const id in ARCS.PAGES) { const p = ARCS.PAGES[id], w = 'page ' + id; if (!CASTIDS.has(p.from)) err(w, 'from'); placeOk(p.place, w); if (!p.title || p.lines.length < 3 || p.lines.length > 5) err(w, 'title / 3-5 lines'); p.lines.forEach(t => checkText(t, w, L.page)); }
for (const id in ALL_ITEMS) { const it = ALL_ITEMS[id]; if (!it.name || !it.desc || !CASTIDS.has(it.from)) err('item ' + id, 'shape'); checkText(it.desc, 'item ' + id, 150); if (ITEMS.ITEM_BY_ID && ITEMS.ITEM_BY_ID[id]) err('item ' + id, 'id already exists in data/items.js'); }
for (const id in ALL_TEXTS) { const t = ALL_TEXTS[id]; if (!CASTIDS.has(t.from)) err('text ' + id, 'from'); checkText(t.text, 'text ' + id, L.text); }

/* ================================================================ 7. small bits ================================================================ */
let smallCount = 0; const CTX = new Set(Object.keys(KIT.SMALL_CTX));
function checkPool(p, w, min) {
  const seen = new Set();
  for (const [k, lim] of [['waves', L.wave], ['texts', L.text]]) for (const b of p[k]) {
    smallCount++;
    if (!ALL_STAGES.has(b.stage) || b.stage === 'none' || b.stage === 'stranger') err(w, `${k}: stage "${b.stage}"`);
    if (!CTX.has(b.ctx)) err(w, `${k}: ctx "${b.ctx}" is not in SMALL_CTX`);
    checkText(b.text, `${w} ${k}`, lim);
    if (seen.has(b.text)) err(w, `duplicate line "${b.text.slice(0, 40)}"`); seen.add(b.text);
  }
  for (const [key, line] of p.details) { smallCount++; memRead.push([key, w + ' details']); checkText(line, w + ' details', L.detail); }
  if (p.waves.length < min.waves || p.texts.length < min.texts || p.details.length < min.details) err(w, `needs ${min.waves}+ waves, ${min.texts}+ texts, ${min.details}+ details (has ${p.waves.length}, ${p.texts.length}, ${p.details.length})`);
  if (!p.texts.some(b => b.ctx === 'gap')) err(w, 'no `gap` text'); else for (const b of p.texts.filter(x => x.ctx === 'gap')) if (/never (call|write|ring|text)|forgot(ten)? (me|us)/i.test(b.text)) err(w, 'a gap text reads as a reproach');
  if (w !== 'small ANY' && !p.texts.some(b => b.ctx === 'birthday')) err(w, 'no birthday text');
}
for (const id in SMALL.SMALL) {
  const w = 'small ' + id, p = SMALL.SMALL[id], ro = ROSET.has(id);
  if (!CASTIDS.has(id)) { err(w, 'not a cast.js person'); continue; }
  checkPool(p, w, ro ? { waves: 6, texts: 12, details: 5 } : { waves: 3, texts: 8, details: 5 });
  const roStages = new Set([...p.waves, ...p.texts].filter(b => RO_STAGES.includes(b.stage)).map(b => b.stage));
  if (ro) for (const s of ['spark', 'dating', 'exclusive', 'partner', 'married']) if (!roStages.has(s)) err(w, `no small bit for romance stage ${s}`);
  if (!ro && roStages.size) err(w, 'romance-stage bits on someone who is not romanceable');
  for (const b of [...p.waves, ...p.texts]) if (/\{title\}/.test(b.text) && !['pip', 'milo'].includes(id)) err(w, '{title} outside Pip / Milo');
}
for (const id of ROMANCE) if (!SMALL.SMALL[id]) err('small', `no pools for ${id}`);
for (const id of PPL.ARC_PEOPLE) for (const s of ARCS.ARC_SPEAKERS[id] || []) if (!SMALL.SMALL[s]) err('small', `no pools for ${s}`);
checkPool(SMALL.SMALL_ANY, 'small ANY', { waves: 5, texts: 6, details: 0 });
for (const k in SMALL.NEWS) for (const id in SMALL.NEWS[k]) { if (!CASTIDS.has(id)) err('NEWS.' + k, id); checkText(SMALL.NEWS[k][id], `NEWS.${k}.${id}`, L.text); smallCount++; }
for (const id in SMALL.WITH_PARTNER) { if (!CASTIDS.has(id)) err('WITH_PARTNER', id); checkText(SMALL.WITH_PARTNER[id], 'WITH_PARTNER.' + id, L.bubble); smallCount++; }

/* ================================================================ 8. cross references ================================================================ */
const chapterText = Object.keys(SRC).filter(f => /src\/story\/(chapters|story)\.js$/.test(f)).map(f => SRC[f]).join('\n');
for (const [v, where] of picksRead) { const [c, op] = v.split('='); if (!picksWritten.has(c)) err(where, `reads pick "${v}" but no choice "${c}" exists in the relationships data`); else if (!picksWritten.get(c).has(op)) err(where, `reads pick "${v}" but choice "${c}" has no option "${op}"`); }
for (const [f, where] of flagsRead) if (!flagsWritten.has(f) && !ENGINE_FLAGS.has(f) && !chapterText.includes(`'${f}'`)) err(where, `reads flag "${f}" which nothing sets (not in the data, ENGINE_FLAGS or the Chapters / story.js)`);
for (const [m, where] of memRead) if (!memWritten.has(m)) err(where, `reads mem "${m}" which no scene writes`);
for (const [s, where] of seenRead) if (!sceneIds.has(s)) err(where, `seen:${s}: no such scene`);
for (const t in ALL_TEXTS) if (!textsUsed.has(t)) err('text ' + t, 'never queued by any scene');
for (const i in ALL_ITEMS) if (!itemsUsed.has(i)) err('item ' + i, 'never given by any scene');
for (const p in ARCS.PAGES) if (!pagesUsed.has(p)) err('page ' + p, 'never handed over by any scene');
for (const f of ENGINE_FLAGS) if (!flagsRead.some(([x]) => x === f)) err('engine flag ' + f, 'declared but never read');
const allScenes = [...Object.values(ROM.SCENES_BY_ID), ...Object.values(ARCS.ARC_SCENES), ...Object.values(DATES.FIRST_DATES)];
if (new Set(allScenes.map(s => s.id)).size !== allScenes.length) err('scenes', 'duplicate scene id across files');

/* ================================================================ report ================================================================ */
const words = t => t.split(/\s+/).filter(Boolean).length;
let W = 0; const countWords = v => { if (typeof v === 'string') W += words(v); else if (Array.isArray(v)) v.forEach(countWords); else if (v && typeof v === 'object') for (const k in v) if (!['id', 'do', 'who', 'cond', 'place', 'kind', 'person', 'prev', 'stage', 'ctx', 'from', 'when', 'window', 'fx'].includes(k)) countWords(v[k]); };
[ROM.HEARTS, ARCS.ARCS, DATES.FIRST_DATES, TALK.DATE_TALK, TALK.DATE_LINES, TALK.DATE_TALK_AFTER, SMALL.SMALL, SMALL.SMALL_ANY, SMALL.NEWS, ROM.WEDDING, ROM.FAMILY_REACTS, ARCS.PAGES, DATES.GOODNIGHT, DATES.REPAIR].forEach(countWords);
const allSay = JSON.stringify([ROM.HEARTS, ARCS.ARCS, DATES.FIRST_DATES, TALK.DATE_TALK, ROM.WEDDING]).split('"do":"say"').length - 1;
console.log(`relationships data: ${ROMANCE.length} romanceable, ${PPL.ARC_PEOPLE.length} arcs`);
console.log(`  scenes: ${arcScenes} vignettes + ${heartScenes} romance scenes + ${ROMANCE.length} first dates = ${allScenes.length}`);
console.log(`  dialogue: ${allSay} bubbles and captions in scenes, ${picksWritten.size} choices, ${[...picksWritten.values()].reduce((n, s) => n + s.size, 0)} options`);
console.log(`  dates: ${DATE_IDS.size} date types, ${dateLineCount} person lines, ${Object.values(TALK.DATE_TALK).reduce((n, a) => n + a.length, 0)} conversations`);
console.log(`  small bits: ${smallCount} (waves, texts, remembered details, news) for ${Object.keys(SMALL.SMALL).length} people`);
console.log(`  remembered details: ${memWritten.size} mem keys written, ${new Set(memRead.map(x => x[0])).size} read back; pages ${Object.keys(ARCS.PAGES).length}; keepsakes ${Object.keys(ALL_ITEMS).length}; verbs ${RULES.VERBS_NEW.length}`);
console.log(`  about ${W.toLocaleString('en-US')} words of written text`);
if (hooksNeeded.size) console.log(`  hooks the engine must supply (not in the game yet): ${[...hooksNeeded].sort().join(', ')}`);
if (warns.length) { console.log(`\n${warns.length} warning(s)` + (verbose ? ':' : ' (run with --verbose to list)')); if (verbose) warns.forEach(x => console.log('  - ' + x)); }
if (errors.length) { console.log(`\n${errors.length} ERROR(S):`); errors.slice(0, verbose ? 2000 : 120).forEach(x => console.log('  x ' + x)); if (!verbose && errors.length > 120) console.log(`  ... and ${errors.length - 120} more (--verbose)`); process.exit(1); }
console.log('\nrel_check: all checks pass.');
