# Intro, story engine, goals, planes — notes (headers of src/sim/intro.js, story.js, planes.js, src/ui/goals.js)
- `G.intro = { steps, at, active, register(stepDef, {before|after: id}), goto(id), next(), skip(), start(), hint(text|null, target?, opts?) }`.
  Default steps: arrival_plane_cinematic, curb, cab_ride, apartment_arrival, first_evening. stepDef = { id, enter(ctx), update?(dt, ctx), exit?(), done?: eventName | predicate },
  ctx = { G, state, fresh, hint, caption, next, goto, home() }. New pre-curb steps: register with { before: 'curb' }; re-registering 'arrival_plane_cinematic' replaces it. Replay: `?scene=city&intro` or G.intro.start().
- `G.goals = { add({ id, text, group: 'goal'|'opportunity', hint?, placeId?, done?: eventName|predicate, onDone?, doneText? }), complete(id), remove(id), get, isDone, list, addList }` — widget sections: Goals / Opportunities / Appointments.
- UI helpers exported from src/ui/goals.js (also G.goalsUI): hint(text, target) (target: CSS selector | element | world pos/entity | fn), caption(who, text, ms), skipButton.
- `G.story = { state(), beat(id), offer(id, {now?}), start(id), complete(id), skipTo(id), active(), hints(), discount(venue), recipes(), keepsakes() }` runs src/story/story.js beats (18): messages + planner appointment kind 'story', NPC staging via G.social.place, scenes via say/choose, rewards. Events story:offer / story:beat / story:missed.
- `G.planes = { landNow(variant?), takeoffNow(variant?), flyover(variant?), count(), flights() }` (a flight has `.cam` as a camera target). Events plane:flyover / plane:landed / plane:gone.
- `G.achievements = { list(), grant(id), has(id) }`.
- Unmapped: story recipes only recorded (no cooking hook), keepsake items not in data/items, story discounts not read by the shop, music unlock flags unused.
