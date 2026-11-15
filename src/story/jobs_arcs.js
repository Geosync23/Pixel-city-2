// =============================================================================
// Maple Bay — JOB STORIES  (src/story/jobs_arcs.js)        PURE DATA INDEX. No engine imports, no init(), no side effects.
// 25 jobs (the 10 that exist + 15 new), each with a cast, an arc of nine beats, ambient shift lines, follow-up texts and
// one or two Opportunities. Design, the play of each job, pacing, the build list and the owner questions: docs/story/JOBS.md.
// Nothing here runs by itself; a jobs-story engine reads it. Verified by `node tools/jobs_check.mjs`.
//
// FILES   _jobs_kit.js (builders + the documented vocabularies)   jobs_new.js (NEW_JOBS, PLACES_NEW, PLAYS)
//         jobs_a.js barista grocery_clerk line_cook office_analyst courier          jobs_b.js fitness_trainer librarian nurse dock_worker bartender
//         jobs_c.js gate_agent baggage_handler station_agent retail_associate museum_guide
//         jobs_d.js florist radio_dj teacher aquarist gull_cook                     jobs_e.js hotel_bell observatory_guide reporter hair_stylist firefighter
//
// EXPORTS
//   JOB_IDS        string[25]                 every job id, existing first.
//   NEW_JOBS       Job[15]                    rows in the shape of data/jobs.js JOBS[] (+ room, boss, hoursNote, needsRoom, texts).
//   PLACES_NEW     { [placeId]: {...} }       the four workplaces that need a new room in an existing building.
//   PLAYS          { [jobId]: { name, reuses, seconds, how, good, bad, pays } }   the distinctive play of each job.
//   CASTS          { [jobId]: { job, boss, place, people: Person[] } }
//                  Person = { id, name, short, role, voice, existing?: 'cast' | '<file that already has them>', look?, age? }
//                  existing 'cast' = an NPC in src/story/cast.js (same id). Any other `existing` = a named person the game already
//                  has without a speaker hook (a showpiece's staff): needs a speaker entry, NOT a new character. No `existing`
//                  = a new person: needs a character (look is the brief for the artist).
//   SPEAKERS       { [id]: Person }           every speaker used anywhere here, merged across jobs (+ 'narrator', 'player').
//   ARCS           { [jobId]: { job, title, premise, beats: Beat[] } }
//   BEATS_BY_ID    { [beatId]: Beat }
//   SHIFT_LINES    { [jobId]: [{ who, text, cond? }] }     ambient bubbles while working (20+ per job). The engine draws them
//                  from a no-repeat shuffle bag; a line with `cond` is only in the bag while the condition holds.
//   TEXTS          { [textId]: { job, from, text, after?, on? } }   phone messages. Sent when a beat's fx / a choice's fx names the id
//                  (`after` game hours later), or by `on`: 'beat:<beatId>' (after that beat) | 'promoted:<level>' (on reaching it).
//   OPPS           { [oppId]: Opportunity }   rows in the shape of data/opportunities.js (JSON only), offered by a beat's `opp`
//                  effect or, when the row has `when.flag`, picked up by the normal Opportunity pool once that flag is set.
//   ITEMS_NEW      { [itemId]: { job, name, kind, desc } }   keepsakes given by arcs (kind 'keepsake' | 'recipe').
//   MOODLETS_NEW   { [id]: { name, desc, mood, workPerf?, minutes } }   the five moodlets the arcs use.
//   TOKENS         { [token]: note }
//   PACING         the pacing rules as data (the prose is in JOBS.md section 4).
//   TRIGGER_KEYS, BEAT_AT, STEP_KINDS, EFFECT_KEYS, COND_PREFIXES   re-exported from _jobs_kit.js (the documented vocabularies).
//
// BEAT   { id: '<job>.<key>', job, n (1..9), title, when: { ...TRIGGER_KEYS }, at: 'clockin' | 'mid' | 'clockout' | 'off',
//          steps: Step[], fx: effects | null (applied when the beat ends), prev: beatId (the beat before it; must be done first),
//          place?, invite?, window?: { days, from, to }   (only for at: 'off') }
//        When a beat ends the engine also sets the flag 'beat:<beatId>' (conditions and Opportunities use it).
// STEP   exactly the Chapters' dialogue steps (src/story/chapters.js): say, choice (remembered as pick:<id>=<option>), if, beat;
//        plus `fx` (apply effects now). See STEP_KINDS / EFFECT_KEYS in _jobs_kit.js.
// =============================================================================
import { GROUP_A } from './jobs_a.js';
import { GROUP_B } from './jobs_b.js';
import { GROUP_C } from './jobs_c.js';
import { GROUP_D } from './jobs_d.js';
import { GROUP_E } from './jobs_e.js';
import { NEW_JOBS, PLACES_NEW, PLAYS } from './jobs_new.js';
import { TRIGGER_KEYS, BEAT_AT, STEP_KINDS, EFFECT_KEYS, COND_PREFIXES } from './_jobs_kit.js';

const ALL = [...GROUP_A, ...GROUP_B, ...GROUP_C, ...GROUP_D, ...GROUP_E];

export const JOB_IDS = ALL.map(b => b.job);
export const CASTS = Object.fromEntries(ALL.map(b => [b.job, b.cast]));
export const ARCS = Object.fromEntries(ALL.map(b => [b.job, b.arc]));
export const SHIFT_LINES = Object.fromEntries(ALL.map(b => [b.job, b.lines]));

export const BEATS_BY_ID = {};
for (const b of ALL) for (const beat of b.arc.beats) BEATS_BY_ID[beat.id] = beat;

export const TEXTS = {};
export const OPPS = {};
export const ITEMS_NEW = {};
for (const b of ALL) {
  for (const id in b.texts) TEXTS[id] = Object.assign({ job: b.job }, b.texts[id]);
  for (const id in b.opps) OPPS[id] = b.opps[id];
  for (const id in b.items) ITEMS_NEW[id] = Object.assign({ job: b.job }, b.items[id]);
}

export const SPEAKERS = {
  narrator: { id: 'narrator', name: '', short: '', role: 'Caption text, no bubble tail.', voice: '', existing: 'engine' },
  player: { id: 'player', name: '{name}', short: '{name}', role: 'The player (only ever speaks through choices).', voice: '', existing: 'engine' },
};
for (const b of ALL) for (const p of b.cast.people) if (!SPEAKERS[p.id]) SPEAKERS[p.id] = p;

export const MOODLETS_NEW = {
  job_belong:  { name: 'One of the Crew', desc: 'Somebody at work saved you a seat, a biscuit or a word. You belong somewhere.', mood: 7, workPerf: 3, minutes: 480 },
  job_proud:   { name: 'Did It Properly', desc: 'You did a piece of work today that you would sign your name to.', mood: 8, workPerf: 3, minutes: 480 },
  job_tender:  { name: 'A Small Kindness', desc: 'Something gentle happened at work, and you were part of it.', mood: 6, minutes: 360 },
  job_laugh:   { name: 'Laughed at Work', desc: 'It was not even that funny. That is the best kind.', mood: 5, minutes: 240 },
  job_rattled: { name: 'Rattled, but Standing', desc: 'A hard shift. You kept your head, more or less. A quiet evening would be welcome.', mood: -2, workPerf: 0, minutes: 240 },
};

export const TOKENS = {
  '{name}': "the player's name",
  '{title}': 'what Pip and Milo call the player (chosen in Chapter 3; the Chapters\' token). Used once, under a done:ch03 condition.',
  '{level}': 'the new job title, in the NEW_JOBS boss texts (the existing texts.js token).',
};

export const PACING = {
  beatsPerShift: 1,                 /* never more than one story beat on a shift */
  minShiftsBetweenBeats: 1,         /* and never on two shifts running, except beats 1 and 2 of an arc */
  textsPerDayFromWork: 1,           /* at most one arc text a day, never between 21:30 and 07:30 */
  skipToEnd: 'On "Skip to the end" no mid / clockout beat plays; a due beat WAITS for the next worked shift. A clockin beat plays before the choice. If a beat has waited through two skipped shifts, clock-in offers a third button: "Just the moment, then skip".',
  offBeats: 'An `off` beat is an invitation: its `invite` text arrives, My Day shows it as an idea with the person\'s name, and the scene plays whenever the player walks in during `window`. It never expires. The arc\'s next beat waits for it only until `orShifts` on that next beat, or 6 further shifts, whichever is first; after that the off beat stays available as a memory to pick up.',
  softConditions: ['weekday', 'weather', 'season', 'event', 'dom', 'level', 'promoted', 'rel', 'skill', 'chapter'],
  lapse: 'A beat with soft conditions fires on the first shift that meets them; once `orShifts` shifts have been attended it fires on the next shift regardless (its `if` steps supply the fallback wording).',
  arcLength: 'Nine beats over about 23 attended shifts (five to six game weeks of a five-day job). Promotions to level 4 come later and are marked by a `promoted:4` text, not a beat.',
  quitting: 'Leaving a job freezes its arc; coming back resumes at the next beat (shift counts per job are kept for good, unlike promotion points).',
  oneJob: 'WORK_RULES.maxJobs is 1, so only one arc runs at a time. A second playthrough of the same job replays nothing; ambient lines keep rotating.',
};

export { NEW_JOBS, PLACES_NEW, PLAYS, TRIGGER_KEYS, BEAT_AT, STEP_KINDS, EFFECT_KEYS, COND_PREFIXES };
