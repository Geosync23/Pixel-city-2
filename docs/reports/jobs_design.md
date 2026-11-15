# Jobs with stories — design + data hand-off (backlog item 3; BIBLE updates 3 and 4) — worker report, condensed

DESIGN AND DATA ONLY. No engine code was written and no existing file was edited. A jobs-story engine worker builds from this.

## Files (all new)
- `docs/story/JOBS.md` — the jobs bible: 25 sections (place, play, ladder, cast, arc in beats, links), the play rules, pacing, the ranked must-build list with cheapest versions, things the lead should know, 8 owner questions with recommendations.
- `src/story/jobs_arcs.js` — the index: every export is documented in its header.
- `src/story/jobs_a.js` … `jobs_e.js` — five jobs each: cast, arc (9 beats), ambient lines, texts, an Opportunity, keepsakes.
- `src/story/jobs_new.js` — `NEW_JOBS` (15 rows in the exact shape of `data/jobs.js` JOBS + `room`, `boss`, `hoursNote`, `needsRoom`, `texts`), `PLACES_NEW` (4), `PLAYS` (25).
- `src/story/_jobs_kit.js` — builders + the documented vocabularies (`TRIGGER_KEYS`, `BEAT_AT`, `STEP_KINDS`, `EFFECT_KEYS`, `COND_PREFIXES`).
- `tools/jobs_check.mjs` — `node tools/jobs_check.mjs` (add `--verbose`). Passes.

## The 25
Existing 10 (ladders untouched): barista, grocery_clerk, line_cook, office_analyst, courier, fitness_trainer, librarian, nurse, dock_worker, bartender.
New 15: gate_agent (airport:concourse), baggage_handler (airport:terminal), station_agent (central_station), retail_associate (deptstore, the `mall:thread` bay), museum_guide (museum), florist (conservatory), radio_dj (radio_studio*), teacher (school_classroom*), aquarist (aquarium), gull_cook (restaurant), hotel_bell (hotel), observatory_guide (observatory), reporter (gazette_newsroom*), hair_stylist (pub:22, Otis & Sons Barbershop), firefighter (fire_station*). `*` = needs a new room inside a building that already stands (`PLACES_NEW`); those four rows carry `needsRoom: true`.
Thirteen of the owner's fifteen (update 3) are here; vet assistant became aquarist and software developer became observatory guide (reasons + sketches of both as jobs 26 / 27 in JOBS.md section 6).

## The schema in one screen
```
ARCS[jobId] = { job, title, premise, beats: Beat[] }
Beat  = { id '<job>.<key>', job, n, title, when, at, steps, fx, prev, place?, invite?, window? }
when  = { shifts, level, promoted, weekday, weather, season, event, dom, pick, flag, notFlag, chapter, rel, skill, after, orShifts }
        all given keys must hold; SOFT keys (weekday weather season event dom level promoted rel skill chapter) lapse at `orShifts`
at    = 'clockin' | 'mid' | 'clockout' | 'off' (off = an invitation: invite text + place + window; never expires)
steps = the Chapters' dialogue steps: { do:'say', who, text, anim? } | { do:'choice', id, options:[{ id, text, reply, fx? }] }
        | { do:'if', cond, then, else? } | { do:'beat', ms } | { do:'fx', ...effects }
fx    = { rel:{id:n}, flag, xp:{skill:n}, money, mood, perf, text, opp, item, need }
cond  = 'pick:<choice>=<option>' | 'flag:<id>' | 'weather:<id>' | 'season:<id>' | 'done:chNN' | 'festival:<event>' | 'level:>=n' | 'rel:<id>>=n' | 'day:weekday|weekend'
```
The engine sets flag `beat:<beatId>` when a beat ends. `CASTS[job].people[]` = `{ id, name, short, role, voice, existing?, look? }`; `existing: 'cast'` = a cast.js NPC, any other `existing` = a file that already names them, none = a new person. `SHIFT_LINES[job]` = `[{ who, text, cond? }]`. `TEXTS[id]` = `{ job, from, text, after? (hours), on? ('beat:<id>' | 'promoted:4') }`. `OPPS[id]` = an opportunities.js row. `PACING` holds the pacing rules as data.

## Counts
225 beats (9 per job; 7 are off-shift) · 2,191 dialogue lines, 37,300 words · 208 choices, 464 options · beats are 6-14 lines on their longest path (median 9) · 108 speakers (26 cast.js NPCs, 13 named showpiece / post staff, 69 new) · 559 ambient lines (22-23 per job) · 75 arc texts + 135 boss texts for the new jobs · 25 Opportunities · 12 keepsakes · 5 moodlets · 25 plays (9 reuse an existing mini-game, 2 lean on one, 14 new).

## What jobs_check verifies (it failed on each of these when I broke the data on purpose: an undocumented trigger key, a weekday off the job's shift days, a soft condition without `orShifts`, a 231-character line, a pick that names a missing option, a place id that does not exist)
- 25 unique job ids; the 10 existing match `data/jobs.js`; every job has a cast, an arc, lines, texts, a play.
- Ladders of all 25: 4 levels, pay strictly rising, no skill requirement falls, level 1 = the hiring requirement, skills exist; new pay inside the existing range; shift days / hours sane; every task's station is in its work loop; boss texts complete and <= 160 characters.
- Places: every workplace, off-beat place and Opportunity target exists in `data/venues.js`, cast.js VENUES / SPOTS, or as a quoted id in the room / data / sim / world source; `PLACES_NEW` ids do not exist yet and their building ids do.
- People: every speaker is in that job's cast; `existing: 'cast'` ids and names match cast.js exactly; other `existing` people are found by name in the file named; new people have a `look` and do not take a cast.js id; one id never has two names.
- Beats: unique ids, `at` and every `when` key documented, first beat on shift 1, shift counts rising, weekdays inside the job's shift days, weather / season / event / chapter ids real, soft conditions always have `orShifts`, off beats have place + invite + window, 5-16 lines, at least four beats with a choice per arc, at least one remembered choice read back per arc, the last beat sets `<x>_arc_done`, everyone in the cast speaks in a beat.
- Steps: kinds documented; text <= 140 characters, no unknown `{token}`, no dash characters, no double spaces; choices have 2-3 options, unique ids, a reply each; effects use documented keys with sane sizes; every `pick:` / `flag:` read is written somewhere; every text / opp / item named exists and every one that exists is used.
- Lines: 20+ per job, 3+ voices, 12+ unconditional, no duplicates. Texts: sender in the cast, <= 160 characters, 3+ per job incl. a `promoted:4` coda. Opportunities: row shape, `when` and reward keys as in opportunities.js.
- Files: no `init` export, no import from outside src/story, no browser / engine globals, no `//` comment after code on a line, data serialises to JSON.

## Also run
`node src/data/validate.mjs` (exit 0) and `node tools/build.mjs` (builds, 7,777 KB). NOTE: `tools/modules.mjs` lists every non-underscore file in `src/story`, so the build now bundles the six `jobs_*.js` data files (about 0.5 MB of source, inert: no `init`). The build regenerated `src/modules.gen.js` and `dist/index.html`; I changed neither by hand.

## Not checked
- Nothing was run in a browser: no beat has been played, no line seen in a bubble, bubble wrapping at 140 characters unverified.
- Read through once while writing and spot-read after two automatic passes (long lines split in two; contractions added for informal speakers); not proof-read line by line by a second reader. Likely leftovers: an odd British word, a contraction in a slightly wrong place.
- `pub:22` (the barbershop) and the mall bay are found as literal ids in the source, not confirmed at runtime; the four `PLACES_NEW` buildings exist in the world files, and their districts were read from `zoneOf`.
- The pace (nine beats in about 23 shifts) and the pay / tip numbers are untested estimates.
- The existing speaker gender of Dr. Okafor, Dr. Reyes and Dr. Halvorsen is not stated in the game; their lines avoid pronouns.

## For the lead
- New small facts and the seven optional `done:chNN` lines are listed in JOBS.md section 6. Name clashes already in the game (two Ineses, three Guses) are noted there.
- Suggested first slice for the engine worker: the beat runner on the Chapters step player + two existing jobs end to end (Dock Worker, Line Cook), then the eleven new jobs that need no room.
- Owner questions (8) with recommendations: JOBS.md section 7.
