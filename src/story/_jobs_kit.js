// =============================================================================
// Maple Bay — JOB ARCS kit  (src/story/_jobs_kit.js)      PURE helpers. No engine imports, no init(), no side effects.
// Tiny builders used by the jobs_*.js data files, plus the DOCUMENTED KEY LISTS that tools/jobs_check.mjs enforces.
// The step vocabulary is the Chapters' (src/story/chapters.js) wherever it fits, so one dialogue runner can play both.
// =============================================================================

/* ---- documented vocabularies (the checker rejects anything else) ---- */

/** Keys allowed in a beat's `when` (ALL given keys must hold; a beat also waits for the beat before it in its arc). */
export const TRIGGER_KEYS = {
  shifts:   'number. Shifts ATTENDED at this job so far, counting today (a skipped-to-the-end shift counts).',
  level:    'number 1-4. The player is at least this level in the job.',
  promoted: 'number 2-4. Fires on the first shift after reaching this level.',
  weekday:  'number[] (0 = Monday). Today is one of these.',
  weather:  'string[] of calendar.js WEATHER_TYPES ids. Today\'s weather is one of these.',
  season:   'string[] of season ids.',
  event:    'string. A calendar event id that is on today (data/calendar.js EVENTS and the showpieces\' events).',
  dom:      '[from, to]. Day of the 14-day month, inclusive.',
  pick:     'string "choiceId=optionId". A remembered choice from an earlier beat.',
  flag:     'string. A story flag is set (G.state.flags).',
  notFlag:  'string. A story flag is not set.',
  chapter:  'string "chNN". That Chapter is finished. Only ever used for optional colour, never to gate an arc.',
  rel:      '{ [speakerId]: number }. Relationship with that person is at least this.',
  skill:    '{ [skillId]: number }. Skill level at least this.',
  after:    'string beat id. Overrides the default "the previous beat of this arc is done".',
  orShifts: 'number. SOFT conditions (weekday, weather, season, event, dom, level, promoted, rel, skill, chapter) lapse once this many shifts have been attended, so nobody is ever stuck.',
};

/** Where in the shift a beat plays. */
export const BEAT_AT = {
  clockin:  'On arrival, before the "Work the shift / Skip to the end" choice.',
  mid:      'About halfway through a worked shift, at a natural lull.',
  clockout: 'As the shift ends, before the pay card.',
  off:      'Off shift. Arrives as an invitation (the beat\'s `invite` text); the scene plays at `place` whenever the player goes, inside `window`. Never expires.',
};

/** Step kinds (`do`). say / choice / if / beat are exactly the Chapters' steps. */
export const STEP_KINDS = {
  say:    '{ who, text, anim? }  one bubble. who = a CASTS speaker id | "narrator" | "player". Text <= 140 chars.',
  choice: '{ id, options: [{ id, text, reply: Step[], fx? }] }  remembered as pick:<id>=<optionId>. Choices colour things; they never fail.',
  if:     '{ cond, then: Step[], else?: Step[] }  cond = a Chapters condition string (pick:, flag:, weather:, season:, done:chNN, festival:, rel:, time:) or "level:>=n".',
  beat:   '{ ms? }  a held pause.',
  fx:     '{ ...effects }  apply effects now (see EFFECT_KEYS).',
};

/** Effects, as data. Used in a choice option\'s `fx`, in an `fx` step and in a beat\'s closing `fx`. */
export const EFFECT_KEYS = {
  rel:   '{ [speakerId]: points }  relationship (small: 1-4).',
  flag:  'string | string[]  set story flags.',
  xp:    '{ [skillId]: xp }  skill xp (10-40).',
  money: 'number  dollars, paid on the spot (a tip, a bonus, a fare home).',
  mood:  'string  a moodlet id from MOODLETS_NEW (or an existing moodlet id).',
  perf:  'number  added to today\'s shift score (-5..+10). Never the difference between kept and fired.',
  text:  'string | string[]  TEXTS ids to queue (each row carries its own delay).',
  opp:   'string  an OPPS id to offer through G.opps.offer().',
  item:  'string  an ITEMS_NEW id (a keepsake) put in the backpack / delivered home.',
  need:  '{ [needId]: points }  a small need change (a staff meal, a sit-down).',
};

/** Condition prefixes allowed in `if` steps and SHIFT_LINES conditions. */
export const COND_PREFIXES = ['pick:', 'flag:', 'weather:', 'season:', 'done:', 'festival:', 'rel:', 'time:', 'level:', 'day:'];

/* ---- builders ---- */
export const s = (who, text, x) => Object.assign({ do: 'say', who, text }, x);
export const n = (text) => s('narrator', text);
/** who('marlow', 'tobi') -> [fn, fn]: each fn(text) is a `say` step by that speaker. */
export const who = (...ids) => ids.map(id => (text, x) => s(id, text, x));
export const o = (id, text, reply, fx) => Object.assign({ id, text, reply: reply || [] }, fx ? { fx } : null);
export const pick = (id, ...options) => ({ do: 'choice', id, options });
export const iff = (cond, then, els) => Object.assign({ do: 'if', cond, then }, els ? { else: els } : null);
export const pause = ms => ({ do: 'beat', ms: ms || 900 });
export const fx = e => Object.assign({ do: 'fx' }, e);

/** One beat. key is unique inside its job; the id becomes '<job>.<key>'. */
export const B = (key, title, when, at, steps, end, x) => Object.assign({ key, title, when, at, steps, fx: end || null }, x);

/** An ambient line. cond is optional (a Chapters-style condition string). */
export const L = (whoId, text, cond) => (cond ? { who: whoId, text, cond } : { who: whoId, text });

/** A person in a job's cast. existing = where they already live in the game ('cast' = src/story/cast.js CAST), else they are new. */
export const P = (id, name, short, role, voice, x) => Object.assign({ id, name, short, role, voice }, x);

/** Finish a job bundle: stamps ids, order numbers and the default `after` chain. */
export function bundle(job, def) {
  const beats = def.arc.beats.map((b, i) => {
    const id = job + '.' + b.key;
    const out = Object.assign({ id, job, n: i + 1 }, b);
    delete out.key;
    return out;
  });
  beats.forEach((b, i) => { if (i > 0 && !(b.when && b.when.after)) b.prev = beats[i - 1].id; });
  return {
    job,
    cast: Object.assign({ job }, def.cast),
    arc: { job, title: def.arc.title, premise: def.arc.premise, beats },
    lines: def.lines,
    texts: def.texts || {},
    opps: def.opps || {},
    items: def.items || {},
  };
}
