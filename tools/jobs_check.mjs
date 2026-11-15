// tools/jobs_check.mjs — verifies the jobs-story data (src/story/jobs_arcs.js and its group files).
//   node tools/jobs_check.mjs            exit 0 = all checks pass; prints counts.   --verbose lists warnings in full.
// What it checks is listed in docs/reports/jobs_design.md ("What jobs_check verifies"). It imports data only; it runs no game code.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = rel => import(pathToFileURL(path.join(ROOT, rel)).href);
const verbose = process.argv.includes('--verbose');

const errors = [], warns = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warns.push(`${where}: ${msg}`);

const J = await imp('src/story/jobs_arcs.js');
const { JOBS } = await imp('src/data/jobs.js');
const CAST = await imp('src/story/cast.js');
const CAL = await imp('src/data/calendar.js');
const NEEDS = await imp('src/data/needs.js');
const { VENUE_BY_ID } = await imp('src/data/venues.js');
let CH = null; try { CH = await imp('src/story/chapters.js'); } catch (e) { warn('setup', 'chapters.js not importable: ' + e.message); }
/* the showpieces push their calendar events / venues at import time; pull them in when they import cleanly */
for (const f of ['museum', 'observatory', 'cityhall', 'aquarium', 'arena', 'fishmarket', 'lighthouse', 'natatorium', 'hotel', 'conservatory', 'post', 'university', 'venues_showpiece', 'venues_extra']) {
  try { await imp(`src/data/${f}.js`); } catch (e) { warn('setup', `data/${f}.js not importable (${e.message.split('\n')[0]}); falling back to a text scan for its ids`); }
}

/* ---- reference sets ---- */
const LIMIT = 140, TEXT_LIMIT = 160;
const SKILLS = new Set((NEEDS.SKILLS || []).map(s => s.id));
try { const X = await imp('src/data/skills_extra.js'); for (const s of X.NEW_SKILLS) SKILLS.add(s.id); } catch (e) { /* already merged */ }
const WEATHER = new Set(Object.keys(CAL.WEATHER_TYPES));
const SEASONS = new Set(CAL.SEASONS.map(s => s.id));
const EVENTS = new Set(CAL.EVENTS.map(e => e.id));
const CHAPTERS = new Set(CH ? CH.CHAPTERS.map(c => c.id) : Array.from({ length: 15 }, (_, i) => 'ch' + String(i + 1).padStart(2, '0')));
const NEEDS_IDS = new Set((NEEDS.NEEDS || []).map(n => n.id));
const EXISTING_MOODLETS = new Set(Object.keys(NEEDS.MOODLETS || {}).concat((Array.isArray(NEEDS.MOODLETS) ? NEEDS.MOODLETS : []).map(m => m.id)));

/* all source text, for "does this id / name exist in the game" checks */
const walk = (dir, out = []) => { for (const f of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, f.name); if (f.isDirectory()) walk(p, out); else if (f.name.endsWith('.js')) out.push(p); } return out; };
const MINE = /[\\/]src[\\/]story[\\/](_jobs_|jobs_)/;
const srcFiles = walk(path.join(ROOT, 'src')).filter(p => !MINE.test(p));
const SRC = Object.fromEntries(srcFiles.map(p => [path.relative(ROOT, p).split(path.sep).join('/'), fs.readFileSync(p, 'utf8')]));
const inDirs = (needle, dirs) => Object.keys(SRC).some(f => dirs.some(d => f.startsWith(d)) && SRC[f].includes(needle));
const quoted = id => [`'${id}'`, `"${id}"`, '`' + id + '`'];
const idInGame = id => quoted(id).some(q => inDirs(q, ['src/scenes/', 'src/data/', 'src/sim/', 'src/world/']));

const placeOk = (id, where) => {
  if (id == null || id === 'home' || id === 'green' || id === 'new' || id === 'event' || id === 'supplies') return true;
  if (typeof id !== 'string') { err(where, `place is not a string: ${JSON.stringify(id)}`); return false; }
  if (id.startsWith('npc:')) { const n = id.slice(4); if (n === 'boss' || CAST.CAST_BY_ID[n]) return true; err(where, `opportunity target ${id}: no such cast member`); return false; }
  if (id.startsWith('near:')) return true;
  if (id.startsWith('@')) { if (inDirs(id.slice(1), ['src/'])) return true; err(where, `named place "${id}" not found in the game source`); return false; }
  if (id.startsWith('spot:')) { if (CAST.SPOTS[id.slice(5)]) return true; err(where, `${id}: not in cast.js SPOTS`); return false; }
  if (J.PLACES_NEW[id]) return true;
  if (VENUE_BY_ID[id] || CAST.VENUES[id]) return true;
  if (idInGame(id)) return true;
  err(where, `place id "${id}" does not exist in the venue / room / world data (and is not in PLACES_NEW)`);
  return false;
};

/* ---- jobs: the 10 existing + 15 new, no duplicates ---- */
const existingIds = JOBS.map(j => j.id), newIds = J.NEW_JOBS.map(j => j.id);
const allJobs = [...JOBS, ...J.NEW_JOBS], JOB = Object.fromEntries(allJobs.map(j => [j.id, j]));
if (new Set([...existingIds, ...newIds]).size !== existingIds.length + newIds.length) err('jobs', 'duplicate job id between data/jobs.js and NEW_JOBS');
if (newIds.length !== 15) err('jobs', `NEW_JOBS has ${newIds.length} rows, expected 15`);
if (J.JOB_IDS.length !== 25 || new Set(J.JOB_IDS).size !== 25) err('jobs', `JOB_IDS has ${J.JOB_IDS.length} ids (${new Set(J.JOB_IDS).size} unique), expected 25`);
for (const id of [...existingIds, ...newIds]) if (!J.JOB_IDS.includes(id)) err('jobs', `job ${id} has no arc`);
for (const id of J.JOB_IDS) if (!JOB[id]) err('jobs', `arc for unknown job ${id}`);

/* ---- ladders (all 25): 4 levels, pay strictly rising, requirements never falling, level 1 = hiring requirement ---- */
const JOB_FIELDS = ['id', 'name', 'venue', 'listedOn', 'blurb', 'requires', 'shifts', 'levels', 'trains', 'uniform', 'workDrain', 'tips', 'perk', 'workLoop'];
for (const j of allJobs) {
  const w = 'job ' + j.id;
  for (const f of JOB_FIELDS) if (!(f in j)) err(w, `missing field ${f}`);
  if (!Array.isArray(j.levels) || j.levels.length < 3 || j.levels.length > 5) { err(w, 'needs 3-5 levels'); continue; }
  if (j.levels.length !== 4) warn(w, `${j.levels.length} levels (WORK_RULES.promotion is tuned for 4)`);
  const titles = new Set();
  j.levels.forEach((l, i) => {
    if (l.level !== i + 1) err(w, `level numbering at index ${i}`);
    if (titles.has(l.title)) err(w, `duplicate title ${l.title}`); titles.add(l.title);
    if (i > 0 && !(l.hourly > j.levels[i - 1].hourly)) err(w, `pay not rising at level ${l.level} (${j.levels[i - 1].hourly} -> ${l.hourly})`);
    for (const s in l.requires) { if (!SKILLS.has(s)) err(w, `unknown skill ${s} at level ${l.level}`); if (l.requires[s] < 1 || l.requires[s] > 10) err(w, `skill level out of range at level ${l.level}`); }
    if (i > 0) for (const s in j.levels[i - 1].requires) if ((l.requires[s] || 0) < j.levels[i - 1].requires[s]) err(w, `requirement for ${s} falls at level ${l.level}`);
  });
  if (JSON.stringify(j.levels[0].requires) !== JSON.stringify(j.requires)) err(w, 'level 1 requires differs from the hiring requires');
  for (const s in j.requires) if (!SKILLS.has(s)) err(w, `unknown skill ${s} in requires`);
  const sh = j.shifts || {};
  if (!Array.isArray(sh.days) || !sh.days.length || sh.days.some(d => !Number.isInteger(d) || d < 0 || d > 6) || new Set(sh.days).size !== sh.days.length) err(w, 'bad shift days');
  if (!(sh.end > sh.start) || sh.end - sh.start > 10 || sh.end - sh.start < 3) err(w, `odd shift hours ${sh.start}-${sh.end}`);
  if (!SKILLS.has(j.trains.primary) || (j.trains.secondary && !SKILLS.has(j.trains.secondary))) err(w, 'trains: unknown skill');
  for (const s in j.trains.xpPerHour) if (!SKILLS.has(s)) err(w, `xpPerHour: unknown skill ${s}`);
  if (!['phone', 'computer'].includes(j.listedOn)) err(w, 'listedOn must be phone | computer');
  const wl = j.workLoop || {};
  const tids = new Set();
  for (const t of wl.tasks || []) { if (tids.has(t.id)) err(w, `duplicate task ${t.id}`); tids.add(t.id); if (!wl.stations.includes(t.station)) err(w, `task ${t.id} uses station ${t.station} not in workLoop.stations`); if (t.unlockLevel && (t.unlockLevel < 1 || t.unlockLevel > j.levels.length)) err(w, `task ${t.id} unlockLevel`); }
  if (!(wl.tasks || []).length) err(w, 'no tasks');
}
/* the pay scale of the new jobs stays inside the existing one */
const exMin = Math.min(...JOBS.map(j => j.levels[0].hourly)), exMax = Math.max(...JOBS.map(j => j.levels[j.levels.length - 1].hourly));
for (const j of J.NEW_JOBS) {
  const w = 'job ' + j.id;
  if (j.levels[0].hourly < exMin || j.levels[j.levels.length - 1].hourly > exMax) err(w, `pay ${j.levels[0].hourly}-${j.levels[j.levels.length - 1].hourly} outside the existing range ${exMin}-${exMax}`);
  if (!placeOk(j.venue, w + ' venue')) { /* reported */ }
  if (j.room) placeOk(j.room, w + ' room');
  if (j.bay) placeOk(j.bay, w + ' bay');
  if (J.PLACES_NEW[j.venue] && !j.needsRoom) err(w, 'venue is in PLACES_NEW but needsRoom is not set');
  if (!J.PLACES_NEW[j.venue] && j.needsRoom) err(w, 'needsRoom set but venue is not in PLACES_NEW');
  const t = j.texts || {};
  for (const k of ['offer', 'firstDay', 'goodShift', 'warning', 'lastWarning', 'letGo']) { if (typeof t[k] !== 'string') err(w, `texts.${k} missing`); else if (t[k].length > TEXT_LIMIT) err(w, `texts.${k} is ${t[k].length} chars (> ${TEXT_LIMIT})`); }
  if (!Array.isArray(t.promotion) || t.promotion.length !== j.levels.length - 1) err(w, 'texts.promotion needs one line per promotion');
  else t.promotion.forEach((p, i) => { if (p.length > TEXT_LIMIT) err(w, `texts.promotion[${i}] is ${p.length} chars`); });
  if (j.blurb.length > LIMIT) err(w, `blurb is ${j.blurb.length} chars`);
  if (!J.CASTS[j.id] || J.CASTS[j.id].boss !== j.boss) err(w, 'boss differs from the cast\'s boss');
  if (!J.PLAYS[j.id]) err(w, 'no PLAYS entry');
}
for (const id of existingIds) { if (!J.PLAYS[id]) err('job ' + id, 'no PLAYS entry'); if (J.CASTS[id] && CAST.JOBS[id] && J.CASTS[id].boss !== CAST.JOBS[id].boss) err('job ' + id, `boss ${J.CASTS[id].boss} differs from cast.js JOBS (${CAST.JOBS[id].boss})`); }
for (const id in J.PLACES_NEW) { const p = J.PLACES_NEW[id]; if (!quoted(p.building).some(q => inDirs(q, ['src/world/', 'src/art/', 'src/sim/']))) err('PLACES_NEW.' + id, `building ${p.building} not found in the world / art data`); if (idInGame(id)) err('PLACES_NEW.' + id, 'this id already exists in the game'); }
for (const id in J.PLAYS) { const p = J.PLAYS[id]; if (!JOB[id]) err('PLAYS.' + id, 'unknown job'); if (!(p.seconds[0] >= 60 && p.seconds[1] <= 120)) err('PLAYS.' + id, 'seconds outside 60-120'); for (const k of ['name', 'reuses', 'how', 'good', 'bad', 'pays']) if (!p[k]) err('PLAYS.' + id, `missing ${k}`); }

/* ---- casts and speakers ---- */
const nameOf = {};
let newPeople = 0, existingPeople = 0;
const seenPerson = new Set();
for (const job of J.JOB_IDS) {
  const c = J.CASTS[job], w = 'cast ' + job;
  if (!c || !Array.isArray(c.people)) { err(w, 'missing'); continue; }
  if (c.people.length < 3) err(w, `only ${c.people.length} people (boss + at least two)`);
  if (!c.people.some(p => p.id === c.boss)) err(w, `boss ${c.boss} is not in people`);
  placeOk(c.place, w + ' place');
  if (JOB[job] && ![JOB[job].venue, JOB[job].room].includes(c.place)) err(w, `place ${c.place} is not the job's venue/room`);
  const ids = new Set();
  for (const p of c.people) {
    if (ids.has(p.id)) err(w, `duplicate person ${p.id}`); ids.add(p.id);
    for (const k of ['id', 'name', 'short', 'role', 'voice']) if (!p[k]) err(w, `${p.id}: missing ${k}`);
    if (nameOf[p.id] && nameOf[p.id] !== p.name) err(w, `${p.id} is "${p.name}" here and "${nameOf[p.id]}" in another cast`);
    nameOf[p.id] = p.name;
    if (p.existing === 'cast') {
      const e = CAST.CAST_BY_ID[p.id];
      if (!e) err(w, `${p.id} marked existing:'cast' but not in cast.js`);
      else { if (e.name !== p.name) err(w, `${p.id}: name "${p.name}" differs from cast.js "${e.name}" (never rename anyone)`); if (e.short !== p.short) warn(w, `${p.id}: short "${p.short}" vs cast.js "${e.short}"`); }
    } else if (p.existing) {
      const f = 'src/' + p.existing;
      const key = p.short.replace(/^(Dr\.|Mrs\.|Mr\.|Ms\.|Coach|Captain|Skipper|Stationmaster|Principal|Chef|Deacon)\s+/, '');
      if (!SRC[f]) err(w, `${p.id}: existing file ${f} not found`); else if (!SRC[f].includes(key)) err(w, `${p.id}: "${key}" not found in ${f}`);
    } else {
      if (CAST.CAST_BY_ID[p.id]) err(w, `${p.id} is a NEW person but that id is taken in cast.js`);
      if (!p.look) err(w, `${p.id}: a new person needs a look for the artist`);
    }
    if (!seenPerson.has(p.id)) { seenPerson.add(p.id); if (p.existing) existingPeople++; else newPeople++; }
  }
}
/* a new person must not share a first name with a cast.js NPC (confusing in a small town) */
const castFirst = new Set(CAST.CAST.map(c => c.short.replace(/^(Mr\.|Mrs\.|Ms\.|Chef|Coach|Nurse|The)\s+/, '').split(' ')[0].toLowerCase()));
for (const id of seenPerson) { const p = J.SPEAKERS[id]; if (!p.existing && castFirst.has(p.short.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Captain|Coach|Chef|Skipper|Stationmaster|Principal|Deacon)\s+/, '').split(' ')[0].toLowerCase())) warn('cast', `new person ${id} ("${p.short}") shares a name with a cast.js NPC`); }

/* ---- arcs and beats ---- */
const FLAGS_SET = new Set(), PICKS = {}, TEXT_REFS = new Set(), OPP_REFS = new Set(), ITEM_REFS = new Set();
const EXTERNAL_FLAGS = new Set(['fountain_fixed', 'hotel_friend', 'post_friend', 'uni_grad', 'skydeck_pass', 'conservatory_pass']);
const beatIds = new Set(), choiceIds = new Set();
let nBeats = 0, nSay = 0, nChoices = 0, nOptions = 0, nWords = 0, maxLen = 0;
const beatLens = [];

const fxCheck = (fx, w, cast) => {
  if (!fx) return;
  for (const k in fx) {
    if (k === 'do') continue;
    if (!(k in J.EFFECT_KEYS)) { err(w, `effect key "${k}" is not documented in EFFECT_KEYS`); continue; }
    const v = fx[k];
    if (k === 'rel') for (const n in v) { if (!cast.has(n) && !CAST.CAST_BY_ID[n]) err(w, `rel with ${n}: not in this job's cast`); if (!(Math.abs(v[n]) >= 1 && Math.abs(v[n]) <= 4)) err(w, `rel ${n}: ${v[n]} outside 1..4`); }
    if (k === 'flag') for (const f of [].concat(v)) FLAGS_SET.add(f);
    if (k === 'xp') for (const s in v) { if (!SKILLS.has(s)) err(w, `xp: unknown skill ${s}`); if (v[s] < 5 || v[s] > 40) err(w, `xp ${s}: ${v[s]} outside 5..40`); }
    if (k === 'money' && !(v > 0 && v <= 30)) err(w, `money ${v} outside 1..30`);
    if (k === 'mood' && !J.MOODLETS_NEW[v] && !EXISTING_MOODLETS.has(v)) err(w, `mood ${v}: unknown moodlet`);
    if (k === 'perf' && !(v >= -5 && v <= 10)) err(w, `perf ${v} outside -5..10`);
    if (k === 'text') for (const t of [].concat(v)) { TEXT_REFS.add(t); if (!J.TEXTS[t]) err(w, `text ${t}: not in TEXTS`); }
    if (k === 'opp') { OPP_REFS.add(v); if (!J.OPPS[v]) err(w, `opp ${v}: not in OPPS`); }
    if (k === 'item') { ITEM_REFS.add(v); if (!J.ITEMS_NEW[v]) err(w, `item ${v}: not in ITEMS_NEW`); }
    if (k === 'need') for (const n in v) if (NEEDS_IDS.size && !NEEDS_IDS.has(n)) err(w, `need ${n}: unknown`);
  }
};
const condUses = [];   /* [where, cond] resolved after all beats are read */
const condCheck = (cond, w) => {
  for (let c of [].concat(cond)) {
    if (typeof c !== 'string') { err(w, 'condition is not a string'); continue; }
    if (c[0] === '!') c = c.slice(1);
    if (!J.COND_PREFIXES.some(p => c.startsWith(p))) { err(w, `condition "${c}" uses an undocumented prefix`); continue; }
    condUses.push([w, c]);
  }
};
const textCheck = (text, w, limit = LIMIT) => {
  if (typeof text !== 'string' || !text.trim()) { err(w, 'empty text'); return; }
  maxLen = Math.max(maxLen, text.length);
  if (text.length > limit) err(w, `${text.length} chars (> ${limit}): "${text.slice(0, 60)}..."`);
  const toks = text.match(/\{[a-z]+\}/g) || [];
  for (const t of toks) if (!(t in J.TOKENS)) err(w, `unknown token ${t}`);
  if (/\s{2,}/.test(text)) err(w, 'double space');
  if (/[—–]/.test(text)) err(w, 'dash character in dialogue (the game text uses commas, colons and full stops)');
};
/* returns the longest path length in `say` steps */
const stepsCheck = (steps, w, cast, job) => {
  let len = 0;
  if (!Array.isArray(steps)) { err(w, 'steps is not an array'); return 0; }
  for (const s of steps) {
    if (!s || !(s.do in J.STEP_KINDS)) { err(w, `step kind "${s && s.do}" is not documented`); continue; }
    if (s.do === 'say') {
      if (s.who !== 'narrator' && s.who !== 'player' && !cast.has(s.who)) err(w, `speaker "${s.who}" is not defined in the cast of ${job}`);
      textCheck(s.text, w); nSay++; nWords += s.text.split(/\s+/).length; len++;
    } else if (s.do === 'choice') {
      if (choiceIds.has(s.id)) err(w, `duplicate choice id ${s.id}`); choiceIds.add(s.id); nChoices++;
      if (!Array.isArray(s.options) || s.options.length < 2 || s.options.length > 3) err(w, `choice ${s.id}: needs 2-3 options`);
      PICKS[s.id] = new Set(); let best = 0; const oids = new Set();
      for (const op of s.options || []) {
        if (oids.has(op.id)) err(w, `choice ${s.id}: duplicate option ${op.id}`); oids.add(op.id); PICKS[s.id].add(op.id); nOptions++;
        textCheck(op.text, w + ' option ' + op.id);
        fxCheck(op.fx, w + ' option ' + op.id, cast);
        best = Math.max(best, stepsCheck(op.reply, w + ' reply ' + op.id, cast, job));
        if (!op.reply || !op.reply.length) err(w, `choice ${s.id} option ${op.id}: no reply`);
      }
      len += 1 + best;
    } else if (s.do === 'if') {
      condCheck(s.cond, w);
      len += Math.max(stepsCheck(s.then, w, cast, job), s.else ? stepsCheck(s.else, w, cast, job) : 0);
    } else if (s.do === 'fx') fxCheck(s, w, cast);
  }
  return len;
};

const SOFT = new Set(J.PACING.softConditions);
for (const job of J.JOB_IDS) {
  const arc = J.ARCS[job], w0 = 'arc ' + job;
  if (!arc || !Array.isArray(arc.beats)) { err(w0, 'missing'); continue; }
  if (arc.beats.length < 8) err(w0, `${arc.beats.length} beats (needs at least 8)`);
  if (!arc.title || !arc.premise) err(w0, 'needs a title and a premise');
  const cast = new Set(J.CASTS[job].people.map(p => p.id));
  const days = JOB[job] ? new Set(JOB[job].shifts.days) : new Set([0, 1, 2, 3, 4, 5, 6]);
  let lastShifts = 0, choiceBeats = 0, remembered = 0; const spoke = new Set();
  const before = nChoices;
  arc.beats.forEach((b, i) => {
    const w = 'beat ' + b.id;
    nBeats++;
    if (beatIds.has(b.id)) err(w, 'duplicate beat id'); beatIds.add(b.id);
    if (b.id !== job + '.' + b.id.split('.')[1] || b.job !== job) err(w, 'id / job mismatch');
    if (b.n !== i + 1) err(w, 'n out of order');
    if (!(b.at in J.BEAT_AT)) err(w, `at "${b.at}" is not documented`);
    if (!b.title) err(w, 'no title');
    if (i > 0 && b.prev !== arc.beats[i - 1].id && !(b.when && b.when.after)) err(w, 'prev does not point at the previous beat');
    const wh = b.when || {};
    for (const k in wh) if (!(k in J.TRIGGER_KEYS)) err(w, `trigger key "${k}" is not documented in TRIGGER_KEYS`);
    const sh = wh.shifts != null ? wh.shifts : (wh.promoted || wh.level ? lastShifts : null);
    if (i === 0 && wh.shifts !== 1) err(w, 'the first beat must fire on shift 1');
    if (wh.shifts != null) { if (!(wh.shifts >= lastShifts)) err(w, `shifts ${wh.shifts} is earlier than the beat before (${lastShifts})`); if (i > 0 && wh.shifts === lastShifts) err(w, 'two beats on the same shift count'); lastShifts = wh.shifts; }
    if (sh == null) err(w, 'needs shifts, promoted or level');
    const soft = Object.keys(wh).filter(k => SOFT.has(k));
    if (soft.length && wh.orShifts == null) err(w, `soft condition (${soft.join(', ')}) without orShifts: a player could be stuck`);
    if (wh.orShifts != null) { if (!soft.length) err(w, 'orShifts without a soft condition'); if (wh.shifts != null && wh.orShifts <= wh.shifts) err(w, 'orShifts must be later than shifts'); if (wh.orShifts > lastShifts) lastShifts = Math.max(lastShifts, wh.shifts || lastShifts); }
    if (wh.weekday) { if (b.at !== 'off') for (const d of wh.weekday) if (!days.has(d)) err(w, `weekday ${d} is not a shift day of ${job}`); }
    if (wh.weather) for (const x of wh.weather) if (!WEATHER.has(x)) err(w, `unknown weather ${x}`);
    if (wh.season) for (const x of wh.season) if (!SEASONS.has(x)) err(w, `unknown season ${x}`);
    if (wh.event && !EVENTS.has(wh.event) && !idInGame(wh.event)) err(w, `unknown calendar event ${wh.event}`);
    if (wh.dom && !(wh.dom.length === 2 && wh.dom[0] >= 1 && wh.dom[1] <= 14 && wh.dom[0] <= wh.dom[1])) err(w, 'bad dom');
    if (wh.level != null && !(wh.level >= 1 && wh.level <= 4)) err(w, 'bad level');
    if (wh.promoted != null && !(wh.promoted >= 2 && wh.promoted <= 4)) err(w, 'bad promoted');
    if (wh.chapter && !CHAPTERS.has(wh.chapter)) err(w, `unknown chapter ${wh.chapter}`);
    if (wh.pick) condUses.push([w, 'pick:' + wh.pick]);
    if (wh.flag) condUses.push([w, 'flag:' + wh.flag]);
    if (wh.skill) for (const s in wh.skill) if (!SKILLS.has(s)) err(w, `unknown skill ${s}`);
    if (wh.rel) for (const n in wh.rel) if (!cast.has(n)) err(w, `rel with ${n}: not in cast`);
    if (wh.after && !J.BEATS_BY_ID[wh.after]) err(w, `after: unknown beat ${wh.after}`);
    if (b.at === 'off') {
      if (!b.place || !b.invite || !b.window) err(w, 'an off beat needs place, invite and window');
      else { placeOk(b.place, w + ' place'); if (!J.TEXTS[b.invite]) err(w, `invite ${b.invite}: not in TEXTS`); TEXT_REFS.add(b.invite); const win = b.window; if (!(win.to > win.from) || !Array.isArray(win.days) || !win.days.length) err(w, 'bad window'); }
    } else if (b.place || b.invite || b.window) err(w, 'place / invite / window only belong on off beats');
    const c0 = nChoices, n0 = nSay;
    const len = stepsCheck(b.steps, w, cast, job);
    fxCheck(b.fx, w + ' fx', cast);
    beatLens.push([b.id, len]);
    if (len < 5) err(w, `only ${len} lines on its longest path (5 at least)`);
    if (len > 16) err(w, `${len} lines on its longest path (16 at most)`);
    if (nChoices > c0) choiceBeats++;
    if (nChoices - c0 > 3) err(w, 'more than 3 choices in one beat');
    const whoSpeaks = JSON.stringify(b.steps).match(/"who":"([a-z_]+)"/g) || [];
    for (const m of whoSpeaks) spoke.add(m.slice(7, -1));
    if (nSay === n0) err(w, 'no dialogue');
    FLAGS_SET.add('beat:' + b.id);
  });
  if (choiceBeats < 4) err(w0, `only ${choiceBeats} beats have a choice (4 at least)`);
  for (const p of J.CASTS[job].people) if (!spoke.has(p.id)) err(w0, `${p.id} is in the cast but never speaks in a beat`);
  /* a remembered choice: some later condition in this arc reads a pick / flag made by a choice in this arc */
  const src = JSON.stringify(arc.beats);
  const reads = (src.match(/"cond":"!?(pick|flag):[^"]+"/g) || []).length + arc.beats.filter(b => b.when.pick || b.when.flag).length;
  if (!reads) err(w0, 'no choice is ever remembered later in the arc');
  /* the ending marks the arc done */
  const last = arc.beats[arc.beats.length - 1];
  const endFlags = [].concat((last.fx && last.fx.flag) || []);
  if (!endFlags.some(f => /_arc_done$/.test(f))) err(w0, 'the last beat does not set an *_arc_done flag');
  if (lastShifts > 26) warn(w0, `the arc needs ${lastShifts} shifts`);
}

/* ---- conditions: every pick / flag read must be writable, every id valid ---- */
for (const [w, c] of condUses) {
  const [pre, rest] = [c.slice(0, c.indexOf(':')), c.slice(c.indexOf(':') + 1)];
  if (pre === 'pick') { const [cid, oid] = rest.split('='); if (!PICKS[cid]) err(w, `pick: no choice "${cid}"`); else if (!PICKS[cid].has(oid)) err(w, `pick: choice ${cid} has no option "${oid}"`); }
  else if (pre === 'flag') { if (!FLAGS_SET.has(rest) && !EXTERNAL_FLAGS.has(rest)) err(w, `flag "${rest}" is read but nothing sets it`); }
  else if (pre === 'weather') { if (!WEATHER.has(rest)) err(w, `unknown weather ${rest}`); }
  else if (pre === 'season') { if (!SEASONS.has(rest)) err(w, `unknown season ${rest}`); }
  else if (pre === 'done') { if (!CHAPTERS.has(rest)) err(w, `unknown chapter ${rest}`); }
  else if (pre === 'festival') { if (!EVENTS.has(rest) && !idInGame(rest)) err(w, `unknown calendar event ${rest}`); }
  else if (pre === 'level') { if (!/^>=[1-4]$/.test(rest)) err(w, `level condition must be "level:>=n", got "${c}"`); }
  else if (pre === 'rel') { const m = rest.match(/^([a-z_]+)>=(\d+)$/); if (!m || !J.SPEAKERS[m[1]]) err(w, `bad rel condition "${c}"`); }
  else if (pre === 'day') { if (!['weekday', 'weekend'].includes(rest)) err(w, `bad day condition "${c}"`); }
  else if (pre === 'time') { if (!['morning', 'day', 'evening', 'night'].includes(rest)) err(w, `bad time condition "${c}"`); }
}
condUses.length = 0;

/* ---- ambient lines ---- */
let nLines = 0;
for (const job of J.JOB_IDS) {
  const lines = J.SHIFT_LINES[job] || [], w = 'lines ' + job, cast = new Set(J.CASTS[job].people.map(p => p.id)), seen = new Set(), speakers = new Set();
  if (lines.length < 20) err(w, `${lines.length} lines (20 at least)`);
  lines.forEach((l, i) => {
    nLines++;
    if (!cast.has(l.who)) err(w, `line ${i}: speaker ${l.who} is not in the cast`);
    textCheck(l.text, `${w} #${i}`);
    if (seen.has(l.text)) err(w, `line ${i} is a duplicate`); seen.add(l.text); speakers.add(l.who);
    if (l.cond) condCheck(l.cond, `${w} #${i}`);
  });
  if (speakers.size < 3) err(w, 'fewer than three voices');
  if (lines.filter(l => !l.cond).length < 12) err(w, 'fewer than 12 unconditional lines');
}
for (const [w, c] of condUses) {
  const pre = c.slice(0, c.indexOf(':')), rest = c.slice(c.indexOf(':') + 1);
  if (pre === 'flag' && !FLAGS_SET.has(rest) && !EXTERNAL_FLAGS.has(rest)) err(w, `flag "${rest}" is read but nothing sets it`);
  if (pre === 'pick') { const [cid, oid] = rest.split('='); if (!PICKS[cid] || !PICKS[cid].has(oid)) err(w, `bad pick ${rest}`); }
  if (pre === 'weather' && !WEATHER.has(rest)) err(w, `unknown weather ${rest}`);
  if (pre === 'level' && !/^>=[1-4]$/.test(rest)) err(w, `bad level condition ${c}`);
  if (pre === 'rel') { const m = rest.match(/^([a-z_]+)>=(\d+)$/); if (!m || !J.SPEAKERS[m[1]]) err(w, `bad rel condition "${c}"`); }
  if (pre === 'day' && !['weekday', 'weekend'].includes(rest)) err(w, `bad day condition "${c}"`);
}
condUses.length = 0;

/* ---- texts, opportunities, items ---- */
for (const id in J.TEXTS) {
  const t = J.TEXTS[id], w = 'text ' + id;
  if (!J.SPEAKERS[t.from]) err(w, `from ${t.from}: unknown speaker`); else if (!J.CASTS[t.job].people.some(p => p.id === t.from)) err(w, `from ${t.from}: not in the cast of ${t.job}`);
  textCheck(t.text, w, TEXT_LIMIT);
  if (t.on) { const m = t.on.match(/^(beat|promoted):(.+)$/); if (!m) err(w, `bad on "${t.on}"`); else if (m[1] === 'beat' && !J.BEATS_BY_ID[m[2]]) err(w, `on: unknown beat ${m[2]}`); else if (m[1] === 'promoted' && !/^[2-4]$/.test(m[2])) err(w, 'on: promoted level'); }
  else if (!TEXT_REFS.has(id)) err(w, 'never sent (no beat names it and it has no `on`)');
  if (!t.on && t.after == null) err(w, 'needs `after` (hours)');
  if (t.after != null && !(t.after >= 1 && t.after <= 120)) err(w, 'after outside 1..120 hours');
}
for (const job of J.JOB_IDS) { const ts = Object.values(J.TEXTS).filter(t => t.job === job); if (ts.length < 3) err('texts ' + job, `${ts.length} texts (3 at least)`); if (!ts.some(t => t.on === 'promoted:4')) err('texts ' + job, 'no promoted:4 coda'); }
const OPP_KEYS = new Set(['id', 'src', 'title', 'text', 'at', 'do', 'when', 'reward', 'ttl', 'until', 'appt', 'once', 'wt', 'repeat']);
const WHEN_KEYS = new Set(['h', 'wd', 'season', 'dom', 'wx', 'notWx', 'need', 'clean', 'sup', 'supLow', 'has', 'lacks', 'homeTag', 'job', 'ml', 'minDay', 'open', 'npcOut', 'event', 'eventAny', 'flag']);
const REWARD_KEYS = new Set(['money', 'needs', 'rel', 'item', 'xp', 'moodlet', 'stamp']);
const oppJob = {};
for (const job of J.JOB_IDS) { const arcSrc = JSON.stringify(J.ARCS[job]); for (const id in J.OPPS) if (id.startsWith(id.split('_')[0]) && (arcSrc.includes(`"opp":"${id}"`))) oppJob[id] = job; }
for (const id in J.OPPS) {
  const o = J.OPPS[id], w = 'opp ' + id;
  if (o.id !== id) err(w, 'id differs from its key');
  for (const k in o) if (!OPP_KEYS.has(k)) err(w, `key ${k} is not in the opportunities.js row shape`);
  if (o.src !== 'job') err(w, 'src must be job');
  textCheck(o.title, w + ' title'); textCheck(o.text, w + ' text', 200);
  placeOk(o.at, w + ' at');
  if (!o.do || !['visit', 'use', 'act', 'buy', 'ev', 'talk'].includes(o.do.type)) err(w, 'bad do.type');
  for (const l of (o.do && o.do.lines) || []) textCheck(l, w + ' line', 200);
  for (const k in o.when || {}) if (!WHEN_KEYS.has(k)) err(w, `when.${k} is not a documented opportunity condition`);
  if (o.when && o.when.flag) condUses.push([w, 'flag:' + o.when.flag]); else if (!OPP_REFS.has(id)) err(w, 'never offered (no beat names it and it has no when.flag)');
  for (const x of (o.when && o.when.wx) || []) if (!WEATHER.has(x)) err(w, `unknown weather ${x}`);
  for (const k in o.reward || {}) if (!REWARD_KEYS.has(k)) err(w, `reward.${k} is not documented`);
  for (const s in (o.reward && o.reward.xp) || {}) if (!SKILLS.has(s)) err(w, `reward xp: unknown skill ${s}`);
  for (const n in (o.reward && o.reward.rel) || {}) if (!J.SPEAKERS[n] && !CAST.CAST_BY_ID[n]) err(w, `reward rel: unknown person ${n}`);
  if (o.reward && o.reward.moodlet && !J.MOODLETS_NEW[o.reward.moodlet] && !EXISTING_MOODLETS.has(o.reward.moodlet)) err(w, `reward moodlet ${o.reward.moodlet}: unknown`);
  if (o.reward && o.reward.money > 30) err(w, 'reward money over 30');
}
for (const [w, c] of condUses) { const rest = c.slice(5); if (!FLAGS_SET.has(rest) && !EXTERNAL_FLAGS.has(rest)) err(w, `flag "${rest}" is read but nothing sets it`); }
for (const id in J.ITEMS_NEW) { const it = J.ITEMS_NEW[id], w = 'item ' + id; if (!ITEM_REFS.has(id)) err(w, 'never given'); if (!it.name || !it.desc || !['keepsake', 'recipe'].includes(it.kind)) err(w, 'needs name, desc and kind keepsake|recipe'); if (it.desc.length > 200) err(w, 'desc too long'); if (idInGame(id)) err(w, 'this item id already exists in the game'); }
for (const id in J.MOODLETS_NEW) if (EXISTING_MOODLETS.has(id)) err('moodlet ' + id, 'already exists in data/needs.js');

/* ---- the data files themselves: pure data, no init, no mid-line // comments ---- */
const mine = fs.readdirSync(path.join(ROOT, 'src/story')).filter(f => /^(_jobs_|jobs_).*\.js$/.test(f));
for (const f of mine) {
  const mod = await imp('src/story/' + f), text = fs.readFileSync(path.join(ROOT, 'src/story', f), 'utf8');
  if ('init' in mod) err(f, 'exports init (the build would treat it as a module)');
  if (/\bimport\b[^;]*from\s+['"]\.\.\//.test(text)) err(f, 'imports from outside src/story (must stay pure data)');
  if (/\bdocument\.|\bwindow\.|\blocalStorage\b|\bG\.[a-zA-Z]/.test(text.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''").replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''))) err(f, 'touches a browser / engine global');
  text.split('\n').forEach((line, i) => {
    const bare = line.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''");
    const at = bare.indexOf('//');
    if (at > 0 && bare.slice(0, at).trim() && !/^\s*(\/\/|\*)/.test(bare)) err(`${f}:${i + 1}`, 'a // comment after code on the same line (use /* */)');
  });
}
try { JSON.stringify(J.ARCS); JSON.stringify(J.NEW_JOBS); JSON.stringify(J.OPPS); } catch (e) { err('data', 'not serialisable: ' + e.message); }

/* ---- report ---- */
const lens = beatLens.map(x => x[1]).sort((a, b) => a - b), inBand = lens.filter(n => n >= 6 && n <= 14).length;
console.log('jobs_check');
console.log(`  jobs        ${J.JOB_IDS.length} (${existingIds.length} existing + ${newIds.length} new); ${Object.keys(J.PLACES_NEW).length} need a new room`);
console.log(`  beats       ${nBeats} (min ${Math.min(...J.JOB_IDS.map(j => J.ARCS[j].beats.length))} per job); lines per beat on the longest path: min ${lens[0]}, median ${lens[lens.length >> 1]}, max ${lens[lens.length - 1]}; ${inBand}/${lens.length} within 6-14`);
console.log(`  dialogue    ${nSay} say lines (${nWords} words), ${nChoices} choices with ${nOptions} options; longest line ${maxLen} chars`);
console.log(`  cast        ${seenPerson.size} speakers: ${newPeople} new people, ${existingPeople} existing (cast.js or showpiece staff)`);
console.log(`  ambient     ${nLines} shift lines (min ${Math.min(...J.JOB_IDS.map(j => J.SHIFT_LINES[j].length))} per job)`);
console.log(`  texts       ${Object.keys(J.TEXTS).length} + ${newIds.length * 9} boss texts for the new jobs; opportunities ${Object.keys(J.OPPS).length}; keepsakes ${Object.keys(J.ITEMS_NEW).length}; moodlets ${Object.keys(J.MOODLETS_NEW).length}`);
if (warns.length) { console.log(`  warnings    ${warns.length}`); for (const x of (verbose ? warns : warns.slice(0, 12))) console.log('    - ' + x); if (!verbose && warns.length > 12) console.log('    ... (--verbose for all)'); }
if (errors.length) { console.log(`\nFAILED: ${errors.length} error(s)`); for (const x of errors.slice(0, verbose ? 1e9 : 80)) console.log('  x ' + x); process.exit(1); }
console.log('\nOK: all checks pass.');
