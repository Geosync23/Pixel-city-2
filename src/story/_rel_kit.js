// =============================================================================
// Maple Bay — RELATIONSHIPS kit  (src/story/_rel_kit.js)   PURE helpers. No engine imports, no init(), no side effects.
// Builders used by the rel_*.js data files, plus the DOCUMENTED VOCABULARIES that tools/rel_check.mjs enforces.
// The step vocabulary is the Chapters' / the job arcs' (say, choice, if, beat, fx) plus `play`, so one runner can play all.
// Design: docs/story/RELATIONSHIPS.md.
//
// WRITING SHORTHAND (compiled here into ordinary steps, so the data the engine sees is plain objects):
//   'marlow|Text of the bubble.'     -> { do: 'say', who: 'marlow', text: 'Text of the bubble.' }
//   '*|Caption text.'                -> { do: 'say', who: 'narrator', text: 'Caption text.' }
//   pick(id, o(optId, 'what you say', [reply lines], fx?), ...)   a remembered choice (pick:<id>=<optId>)
//   iff(cond, [lines], [else lines]?)   pause(ms?)   fx({ ... })   play(kind, id, label, extra?)
// =============================================================================

/** The two tracks. Friendship REUSES the social system's 0..100 `rel` and its four tiers; `confidant` is a fifth, story stage. */
export const FRIEND_STAGES = ['stranger', 'acquaintance', 'friend', 'close', 'confidant'];
/** Romance is its own 0..100 meter ("warmth", `ro`) with named stages. `none` = no romance track open with this person. */
export const ROMANCE_STAGES = ['none', 'spark', 'dating', 'exclusive', 'partner', 'engaged', 'married'];

/** Keys allowed in a scene's `when` (ALL given keys must hold; a scene also waits for the scene before it in its arc). */
export const WHEN_KEYS = {
  fr:       'number. Friendship points (the social `rel`, 0..100) with the scene\'s person are at least this.',
  stage:    'string, a ROMANCE_STAGES id. The romance stage with this person is at least this.',
  chapter:  'string "chNN". That Chapter is finished. Family scenes use it so they never run ahead of the main story.',
  days:     'number. Game days since the previous scene of this arc ended (default PACING.arcGapDays).',
  weekday:  'number[] (0 = Monday).',
  weather:  'string[] of calendar.js WEATHER_TYPES ids.',
  season:   'string[] of season ids.',
  event:    'string. A calendar event id that is on today.',
  flag:     'string. A story flag is set.',
  notFlag:  'string. A story flag is not set.',
  pick:     'string "choiceId=optionId". A remembered choice.',
  after:    'string scene id. Overrides the default "the previous scene of this arc is done".',
  orDays:   'number. SOFT keys (weekday, weather, season, event, chapter) lapse once the scene has waited this many days.',
};
export const SOFT_WHEN = ['weekday', 'weather', 'season', 'event', 'chapter'];

/** Step kinds (`do`). say / choice / if / beat are exactly the Chapters' steps. */
export const STEP_KINDS = {
  say:    '{ who, text }  one bubble. who = a person id | "narrator" | "player". Text <= 110 chars.',
  choice: '{ id, options: [{ id, text, reply: Step[], fx? }] }  remembered as pick:<id>=<optionId>. Choices colour; they never fail.',
  if:     '{ cond, then: Step[], else?: Step[] }  cond = a condition string (COND_PREFIXES); "!" negates.',
  beat:   '{ ms? }  a held pause.',
  fx:     '{ ...effects }  apply effects now (EFFECT_KEYS).',
  play:   '{ kind, id, label, skip?, with? }  the player really does something (PLAY_KINDS). Always completable; skip shows "Not today".',
};

/** What a `play` step can start. All exist in the game today except `order` and `gift`, which are thin wrappers (see the build list). */
export const PLAY_KINDS = {
  minigame: 'id = a G.skillplay key (flip, pour, write, sketch, chess, hoops, song, reps) or a showpiece activity (trace, dig, auction).',
  activity: 'id = a fixture / world activity id (fishing_spot, ferris_wheel, duck_pond, viewpoint, bench, dance, watch_fish ...).',
  cook:     'id = a recipe id (data/items.js RECIPES) or "choose" (the player picks; the partner\'s liked recipes are starred).',
  order:    'id = a venue id. Opens that venue\'s real menu for two; the bill is split unless the player taps "My treat".',
  show:     'id = "cinema" | "concerthall" | "playhouse" | "arena". Buys two seats through G.shows / G.arena and sits together.',
  walk:     'id = a place id. The two of you walk there; lines in `talk` play on the way.',
  gift:     'id = "choose". Opens the gift picker for this person.',
  ui:       'id = a phone / HUD action ("dating_app", "my_day", "wardrobe", "decorate").',
};

/** Effects, as data. Used in a choice option's `fx`, in an `fx` step and in a scene's closing `fx`. */
export const EFFECT_KEYS = {
  fr:     '{ [personId]: points }  friendship (small: 1-5; scenes are exempt from the daily cap).',
  ro:     '{ [personId]: points }  romance warmth (1-6). Only ever applied when a romance track is open with that person.',
  flag:   'string | string[]  set story flags.',
  mem:    'string | string[]  remember a detail ABOUT THE PLAYER on this person ("mem:<key>"); small bits read it back later.',
  text:   'string | string[]  SMALL texts ids / scene-local text ids to queue.',
  mood:   'string  a moodlet id (REL_MOODLETS or an existing moodlet).',
  item:   'string  an ITEMS_NEW id (a keepsake).',
  recipe: 'string  a recipe id the player learns.',
  need:   '{ [needId]: points }  a small need change (a meal eaten together, a sit-down).',
  xp:     '{ [skillId]: xp }  skill xp (10-40).',
  page:   'string  a PAGES id: an order slip in this person\'s hand for a place they love, added to the book at home (CHAPTERS.md section 8).',
};

/** Condition prefixes allowed in `if` steps and in small bits. "!" in front negates. */
export const COND_PREFIXES = ['pick:', 'flag:', 'done:', 'weather:', 'season:', 'time:', 'festival:', 'day:', 'fr:', 'stage:', 'seen:', 'mem:', 'job:', 'lives:', 'date:'];
/*  fr:<id>>=<n>       friendship points            stage:<id>>=<romance stage>      seen:<sceneId>  that scene has been played
    mem:<key>          this person remembers it     job:<jobId>  the player holds it  lives:together  the partner lives with the player
    date:<n>           this is at least the nth date with this person               time:morning|day|evening|night               */

/* ---- builders ---- */
const say = (who, text) => ({ do: 'say', who: who === '*' ? 'narrator' : who, text });
/** Compile a list of shorthand strings / step objects into steps. */
export function steps(list) {
  return (list || []).map(x => {
    if (typeof x !== 'string') return x;
    const i = x.indexOf('|');
    return say(x.slice(0, i), x.slice(i + 1));
  });
}
export const o = (id, text, reply, effects) => Object.assign({ id, text, reply: steps(reply) }, effects ? { fx: effects } : null);
export const pick = (id, ...options) => ({ do: 'choice', id, options });
export const iff = (cond, then, els) => Object.assign({ do: 'if', cond, then: steps(then) }, els ? { else: steps(els) } : null);
export const pause = ms => ({ do: 'beat', ms: ms || 900 });
export const fx = e => Object.assign({ do: 'fx' }, e);
export const play = (kind, id, label, x) => Object.assign({ do: 'play', kind, id, label }, x);

/**
 * One scene (a vignette, a date, a milestone). key is unique inside its arc; the id becomes '<arc>.<key>'.
 *   invite  the text message that offers it (from the person). The scene then sits in My Day as an Idea with their name.
 *   place   where it plays: 'home' (the player's) | a venue / room / poi id | 'spot:<cast spot>' | 'theirs' (their front door) | 'phone' (a call).
 *   window  { days?: weekday[], from, to } hours it can be started. It never expires; outside the window the idea says when.
 */
export const V = (key, title, when, place, invite, window, list, end, x) =>
  Object.assign({ key, title, when: when || {}, place, invite, window: window || null, steps: steps(list), fx: end || null }, x);

/** Finish an arc: stamps ids, order numbers and the default `prev` chain. */
export function arc(person, def) {
  const scenes = def.scenes.map((v, i) => {
    const out = Object.assign({ id: person + '.' + v.key, person, n: i + 1 }, v);
    delete out.key;
    return out;
  });
  scenes.forEach((v, i) => { if (i > 0 && !(v.when && v.when.after)) v.prev = scenes[i - 1].id; });
  return { person, title: def.title, premise: def.premise, thread: def.thread, needs: def.needs || null, scenes, texts: def.texts || {}, items: def.items || {}, pages: def.pages || {} };
}

/** A small bit row: [stage, ctx, text] -> { stage, ctx, text }. stage = a FRIEND_STAGES / ROMANCE_STAGES id; ctx = a SMALL_CTX key or 'mem:<key>'. */
export const bits = rows => rows.map(r => ({ stage: r[0], ctx: r[1], text: r[2] }));

/** Contexts a small bit can ask for (the engine picks the most specific bit that fits; `any` always fits). */
export const SMALL_CTX = {
  any: 'no condition', morning: 'before 11:00', evening: 'after 18:00', rain: 'rain or storm today', snow: 'snow today', fog: 'fog today',
  sun: 'a clear day in spring or summer', worked: 'the player worked a shift today', promoted: 'the player was promoted in the last two days',
  moved: 'the player moved home in the last three days', festival: 'a city event or festival is on today', after_date: 'the morning after a date with them',
  after_scene: 'the day after one of their vignettes', gift: 'the day after the player gave them a gift they love', gap: 'not seen or spoken for five days or more (kind; never a reproach)',
  birthday: 'their birthday (cast.js)', cooked: 'the player cooked a meal at home yesterday', lowmood: 'the player\'s mood is low', chapter: 'a Chapter was finished yesterday',
};
