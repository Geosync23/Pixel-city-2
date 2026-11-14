# Playtest fix pack 1 (owner msg 36) — what landed, per item
1. Airport walkways keep right — DONE (belts, zones, decals, walker lanes swapped; eval table confirmed all six belts on the right of travel).
2. Deboarding order — DONE in logic (cabin `myTurn()` / `release()`; player released when the line reaches their row, ~11 s, rows behind wait). The real intro flow was not run end to end afterwards.
3. Plane-shaped cabin — DONE (new non-solid art `furn.airport.cabin.cove/.skin/.nose/.tail`, wing through windows). Tail piece not viewed; the room floor does not narrow.
4. Station stairs — PARTIAL: "Stairs to / Elevator to <Station> platform" interactables (5) open the station panel, with glow pois (type `stairs`, `glow: true`; stalls.js glows any poi with `p.glow`). Not viewed in the city;
   spots sit beside the structure, some stations skipped where the entrance is adjacent.
5. Train ticket, flat fee — DONE: "Buy ticket $2.50" in the station panel and at ticket machines; boarding needs a ticket or pass; tickets in G.state.rail.tickets, consumed on boarding. `ride()` without a ticket auto-buys
   (so phone/story callers still work); `{free:true}` unchanged; cancelling the platform wait keeps the ticket. Money deduction not directly confirmed.
6. Sit in any chair — PARTIAL: interiors verified (any fixture with a non-lying seat and no other interactable offers "Sit"); city bench props got Sit spots but were not verified (flipped-prop seat coords are a guess).
7. Tap goal -> waypoint (pin on rows with a placeId) — DONE. Tap a need -> "where can I fix this?" with up to 3 nearest places — DONE but matching is a rough name/kind regex (e.g. social suggested a nail bar);
   the "Home" and friend rows did not appear in testing.
8. Planner feeds the Goals widget — DONE (today's appointments of every kind, in time order; header shows "N today").
Files edited: src/scenes/rooms/airport.js, _airport_life.js, src/sim/intro_airport.js, src/art/airport_interior/cabin.js, src/sim/rail.js, src/sim/stalls.js, src/sim/activities.js, src/ui/goals.js, src/ui/hud.js.
STILL OPEN from msg 36 (not in this pack): item icons, train flicker overhead, Map navigator with foot/bus/train, unique interiors + more enterable buildings, separate bathrooms + toilets/bladder, app store / Properties / Living Tips,
clothes/hair/laundry, traits/skills/mini-games, university.
