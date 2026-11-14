# Crowd — notes (full docs in header of src/sim/crowd.js)
- `G.crowd`: count(), citizens(), setDensity(mult), freeze(bool), refill(), spawnNear(x, y, {spec, outfit, age, kind, anim, dir, seated, z, keep, named, fade}) -> Cit|null (city only), despawn(cit, fade), reserve(fixture|{x,y}) / release(...), debug().
- Tapping a citizen calls `G.social.talkToCitizen({char, spec, district, mood, kind})` if present (a returned Promise keeps the citizen facing the player until resolved). Citizens have `isCitizen = true` and a `kind`.
- Replace a citizen with a named NPC: read cit.x/y/dir/spec, `G.crowd.despawn(cit, false)`, place your own Char; or `spawnNear(x, y, {spec, named: true, keep: true, anim})` for a crowd-managed stand-in.
- Rooms: venue rooms get staff + customers by hours; homes are never populated. Jobs: `G.crowd.reserve(fx)` at shift start / `release(fx)` at end; also auto-vacates the player's job stations when `G.jobs.onShift()` and `G.jobs.current()` match.
- Gaps: weather `setWeather('clear')` did not clear `isWet()` in tests; no pedestrian signal phase; buskers/fishers use stand/dance anims.
