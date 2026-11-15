# Wave C: gentle needs, home supplies, Opportunities

The previous worker wrote most of this and was cut off before testing it. The takeover worker reviewed it, kept nearly all of it, fixed what testing turned up, and ran the checks listed below.

## Counts
- 3 new needs (Comfort, Outdoors, Inspiration), so 9 in total. 12 new moodlets.
- 7 consumables (soap, shampoo, toothpaste, toilet paper, all-purpose cleaner, sponges, laundry detergent), sold as 7 new `misc` shop items.
- **201 Opportunities**, all hand-written: people 42, place 60, need 23, weather 19, home 15, season 15, event 15, job 11, story 1 (the tutorial one). 15 new Wander stamps (group "Opportunities").

## Files
New (Wave C, previous worker): `src/sim/needs_extra.js`, `src/sim/supplies.js`, `src/data/supplies.js`, `src/sim/opportunities.js`, `src/data/opportunities.js`, `opportunities_a.js`, `opportunities_b.js`, `opportunities_kit.js`, `src/ui/phone_opps.js`, `src/art/icons/needs_extra.js`.
Edited: `src/data/needs.js` (3 NEEDS rows with `soft: true`, SOFT / SOFT_ACT / SOFT_ACT_RULES tuning, moodlets), `src/sim/needs.js` (no zero outcome for soft needs; a kind once-a-day low toast), `src/ui/hud.js` + `hud.css` (9 meters with a hairline before the 3 gentle ones, "Gentle needs" block in the panel, where-to-fix for soft needs), `src/ui/phone_wellness.js` (gentle needs + a Home card with cleanliness and a supplies button).
No shared files were edited. Everything hooks in through events and runtime registration: items are pushed into ITEMS at load, the app goes through `G.phone.registerApp`, the HUD chip through `G.hud.addIndicator`, stamps go into `EXPERIENCES`, and arrow targets go through `G.navGoals.define`.

### Takeover fixes
- `needsx:newcook` was used by `hm_newrecipe` but nothing emitted it. needs_extra now emits it the first time each recipe is cooked.
- The low toast for gentle needs could repeat when a value hovered at the band edge. It now speaks at most once per game day per need (needs.js).
- Tapping a need in the HUD panel opened "where can I fix this?" behind the panel, on phones too. This bug was already there for the six body needs. The panel now closes first (hud.js).
- Offer deadlines are rounded up to the half hour, so cards say "until 22:30" rather than 22:01.
- Opportunity cards that need an item say so: "Bring 3 x Lemon (a grocery, market or corner shop has it)" / "(you have it)".
- Added the debug helpers `G.opps.target(id)` and `G.opps.here(id)`.

## Lead: apps.js row (Opportunities)
The app already shows on the phone without this row (an app outside the catalogue is never hidden). The row adds it to Appy. `core` keeps it on old saves too:
```js
  { id: 'opps', name: 'Opportunities', cat: 'life', core: 1, pre: 1, tagline: 'What could I do today?', size: '7 MB', rating: 4.7, iconIds: ['app.opps', 'ui.opp'], color: '#2fa3a0',
    desc: 'Small things the city puts in your way: a nice evening, a friend short of lemons, something on in town. Say yes to the ones you fancy; nothing is lost by letting one pass.',
    does: ['A few new ones a day', 'Take me there, or a time in your Planner', 'Looking back, with stamps'] },
```
Optional: a `docs/INTERFACES.md` entry pointing to this file.

## API
**G.needsExtra**: `homeComfort()`, `comfortParts()`, `comfortHere()`, `inPark()`, `rates()` (points/hour now), `fix(needId, n)`, `inspire(points, why)`, `greens()`.
Events: `needsx:inspire`(pts, why), `needsx:newplace`(placeId), `needsx:newcook`(recipeId). State `G.state.needsx`.

**G.supplies**: `all()`, `left(key)`, `use(action)`, `add(key, uses)`, `putAway()`, `low()`, `shops(keys?)`, `clean()`, `cleanLabel()`, `addClean(d)`, `mess()`, `tidy('spot'|'quick'|'full')`, `brush()`, `open()`.
Events: `supplies:change`, `supplies:low`(key), `supplies:out`(key), `supplies:restock`(key, uses), `home:clean`(kind, value), `home:brush`. State `G.state.supplies`.
At home there is a broom and bucket ("Cleaning things": proper clean / quick tidy / supplies), up to 5 bits of mess that appear as cleanliness drops ("Tidy this up"), and the sink asks "wash hands or brush teeth". What you buy goes from the backpack into the home when you get there.
Uses: shower or bath = 1 soap + 1 shampoo; hand-wash 0.2 soap; toilet at home 1 roll; brushing 1 toothpaste; proper clean 1 cleaner + 1 sponge; a home washer load 1 detergent (only tracked once you have used a home washer). Going without costs a little hygiene and shows one kind line a day.
Notices: ONE phone notice ("Running low", opens Wellness) when something first runs low. A second item running low within 12 game hours only updates the HUD basket chip (count) and the chip disappears when you restock.

**G.opps**: `list()`, `get(id)`, `log()`, `stats()`, `pool`, `TUNE`, `SOURCES`, `offer(rowOrId, {quiet, force})`, `accept(id, {go})`, `decline(id)`, `drop(id)`, `go(id)`, `complete(id)`, `offerNow(id?)`, `eligible()`, `rewardText(def)`, `target(id)`, `here(id)`.
Events: `opp:offer`(id, row), `opp:accept`(id), `opp:done`(id, row), `opp:end`(id, how), `opps:change`, plus the row's own `emit` on done. State `G.state.opps`.
**Story hook**: `G.opps.offer({ id, title, text, at, do, when?, reward, ttl|until|appt, emit: 'story:x' })` takes JSON only. A story beat waits for `emit`. Tested: a custom row survives save/load and completes after it.
Row format and `when` fields: header of `src/data/opportunities.js`. Accepting adds a Goals entry ("Opportunities"), points the guide arrow (and the navGoals resolver 'opps' leads indoors to the counter or person), and adds a Planner appointment when the row has `appt`.

## Tuning
Gentle needs (SOFT in data/needs.js, points per game hour):
- Outdoors: indoors −3.2, asleep −0.6, street +15, near a park/pier/beach/lookout +26 (×weather, ×0.8 at night). Terrace homes drain at half rate. Full band gives +0.3 energy/h.
- Inspiration: −1.5 awake. Spikes: new place +6 (cap 24/day), show +28, book +10, film +8, recipe +8, first cook +6, new dish +5, showpiece first visit of the day +2..12, small details +2 (cap 30/day), activities via SOFT_ACT.
- Comfort: moves toward the room's level at 14/h while at home. Level = 16 + cleanliness × 0.42 + min(36, ambience × 1.6). −0.9/h while out. Hotel room 85, family home 62. Sleeping 4h+ at home with Comfort ≥ 80 gives `slept_soundly` + 5 energy.
- Cleanliness: −0.3/h, −0.22/h more while awake at home, cooking −2.5. Spot tidy +14, quick tidy +16 (only up to 70), proper clean +55. Bands: Sparkling, Tidy, Lived-in, Dusty, Messy.
- Bands: low under 30-32 (Unsettled / Cooped Up / In a Rut, mood −3/−4). Full at 80+ (Snug / Full of Fresh Air / Brimming: +12% creative xp). No collapse, not in MOOD.weights.

Opportunities (TUNE): 4 a day at most (3 on 45% of days, 2 on the first day). At least 150 game minutes apart (+ up to 90). None 21:54-07:30, while asleep, on shift or in a cutscene. At most 2 unanswered and 5 open. Offers stand 8 h by default. No repeats until nothing unused fits AND half the pool has been offered; then anything offered in the last 6 days still rests.

## Verified by running (headless Chromium, 390x844, this session)
- validate + build pass. Zero page errors in every run. 57-60 fps in the city, the home, the cafe and the museum.
- HUD: 9 meters end at x=230; the speed buttons start at ~265 and the tip banner sits below, in the city and at home (shots `out/shots/opps_hud_city.png`, `opps_hud_room.png`). The panel shows a "Gentle needs" block. Where-to-fix works for Comfort and Inspiration (`opps_fix.png`). The Wellness app shows the gentle needs and the Home card (`opps_wellness.png`).
- Needs from real play: street 1h Outdoors 72→91, park 1h →100, home 3h Outdoors −9.6 and Comfort 56→47 (toward home level 48). Ferris wheel ride Inspiration +18-24, museum visit +15, TV about +0.5/h. Band moodlets appear (snug, cooped_up, brimming, in_a_rut). Dev freeze stops cleanliness drift.
- Supplies: a proper clean used 1 cleaner + 1 sponge (cleanliness 44→99, spick_and_span). Showers drained soap and shampoo. Exactly one "Running low" phone notice ("...Marchetti's Delicatessen & Grocery has it."), then only the HUD chip with a count. Items bought were put away at home (soap 0→24). Supplies window: `opps_n2.png`.
- Opportunities, accept → arrow → complete → reward, 10 of them from 9 sources: st_first (story), pl_wheel (place, real activity), hm_dust (home, real tidy), wx_rain_cafe (weather), pp_marlow_lemons (people, bring + button + dialogue), ev_farmers (event, buy), jb_gig (job), nd_insp_museum (need, room visit), se_lemonade (season, button on Otis in the street), pp_vik_table (people, talk). The waypoint was set to the right place each time. Money, needs and relationship rewards applied. Expiry gives one kind toast and logs it as "expired". Arrow on screen: `opps_arrow.png`. App: `opps_app.png`.
- Pacing over 60 simulated days: 2,3,3,4,3,4,3 offers on days 1-7, then 3-4 a day. 125 distinct before the first cycle (day 30), no repeats before it. Every source appears.
- Save/load round trip (open opps incl. a custom story row, supplies, cleanliness, needs). An old save with no opps/supplies/needsx state and no soft need values loads with start values. It offers "Get your bearings" first, then the normal pace.
- Pool audit (scripts in the scratchpad): every `ev` name is emitted somewhere in src, every act id exists, every bought/bring/reward item exists, and every buy row's place sells a matching item. All `@Name` places resolve. All reward needs, skills, moodlets and stamps exist. The 6 npc rows that did not resolve at 14:00 on day 1 are time-of-day ones (that person is not out then), which is intended. I proofread the whole pool. It is warm and plain, with no "mission"/"quest" (the only matches were the word "questions").

## Not verified / known gaps
- Most completions were triggered by emitting the same event the real system emits (shop:buy, activity:done for linger, job:gig:done, social:talk). The wheel ride, tidy, museum entry, visit-by-standing and the npc button ran through the real code paths.
- `slept_soundly` was not seen in a test. A fresh home with no cosy decor tops out at Comfort 58, so it needs a decorated (ambience ≥ 14) and clean home. That is the design, but nobody has played it that long.
- `read_novel` did not start in tests (no novel in the bag), so its Inspiration rate is untested.
- Tuning is a first guess, especially Inspiration −1.5/h awake (a work-and-home routine drifts into "In a Rut" in about 1.5 days) and the cleaner stock (start 2, so the first proper clean already says "running low").
- The supplies window's "Take me to ..." button uses the shared `button.go` style, which reads faint on 390 px (kit style, not mine).
