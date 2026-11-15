# City-folk lines — the lead's plan (owner msgs 79-80). The lead owns structure + categories + engine; the writer fills the pools.

Owner: "Add a ton of written lines for city folk. Don't increase the frequency too much, just add many many lines. Don't repeat until they all fire.
A big pool of general ones, then also many contextual ones, like if you stink." / "You plan the structure and categories of the lines and the writer writes them."

## Principles
- Same bubble frequency as today (city 5-10 s, rooms 7-15 s, max two bubbles visible). More lines, not more talking.
- Every pool is a shuffle bag saved in `G.state.lines`: no line repeats until its whole pool has fired (engine: `src/sim/_crowd_lines.js`).
- The most specific true thing wins a share of the time, the general pool is the bedrock: player state (only from someone near the player) > what the speaker is doing > where we are > the general mix.
- Voice: dry, warm, specific; overheard half-conversations, small complaints, tiny joys, gossip about real Maple Bay places; kind even when teasing the player. <= 90 characters, one bubble.

## File: `src/story/ambient_lines.js` -> `export const LINES = { ... }` (keys are the contract with the engine)

### A. `general` — the big pool, said anywhere, any time. An OBJECT of themes (the engine flattens it into ONE no-repeat bag); themes exist so coverage is even. 50+ lines per theme, 1,000+ in all.
`phone_calls` (half of a phone conversation) · `complaints` (small, funny) · `tiny_joys` · `gossip` (neighbours, local businesses, the named cast in passing) · `food` (cravings, where to eat, recipes) ·
`money` (rent, prices, bargains) · `work` (bosses, shifts, meetings) · `love` (dates, crushes, exes, weddings) · `family` (parents, kids, siblings) · `pets` · `transit` (buses, the Loop, cabs, walking) ·
`city_pride` (landmarks, "only in Maple Bay") · `running_gags` (the fountain fixed "soon", pigeons, the late 14 bus, somebody's sourdough starter, the lighthouse keeper's cat, the Ferris wheel that stops at the top) ·
`crosswalk_philosophy` (big thoughts at small moments) · `tech` (phones, apps: Wander, Nestly, MapleCab, Circle, Appy) · `health` (gym, sleep, knees) · `hobbies` · `plans` (tonight, the weekend) ·
`kids_say` (children's logic) · `elders_say` (seen-it-all) · `tourists_say` (first time here) · `to_self` (muttering, lists, pep talks).

### B. Where
- `district`: downtown, oldtown, harbor, hillcrest, maplewood, arts, railyard, park, airport — 50+ each.
- `near` (within a block of a landmark): fountain (City Plaza), pier, lighthouse, ferris_wheel, duck_pond, river_walk, market_square, central_station, bandstand, lookout, campus, stadium (arena), symphony_hall, galleria, skydeck_tower, conservatory, museum, observatory, bus_stop, taxi_stand, construction, crosswalk — 15+ each.
- `venue` (overheard indoors): cafe, bakery, diner, restaurant, bar, grocery, shop, bookstore, gym, library, lobby_res, lobby_office, station, train, bus_ride, airport, plane, mall, cinema, concert, theatre, museum, conservatory, observatory, skydeck, clinic, bank, laundromat, salon, restroom_queue — 30+ each.

### C. When
- `timeOfDay`: dawn, morning, midday, afternoon, evening, late, night — 40+ each.
- `weekday`: monday, tuesday, wednesday, thursday, friday, saturday, sunday — 15+ each.
- `season`: spring, summer, autumn, winter — 40+ each.   `weather`: sunny, cloudy, rain, storm, fog, snow, heat, wind, first_snow, rainbow (just after rain) — 25+ each.
- `events` (keyed by calendar event id, said while it is on or the day before): cheap_tuesday, open_mic_wednesday, live_music_friday, farmers_market, sunday_jazz_brunch, blossom_festival, summer_fireworks,
  boardwalk_days, harvest_fair + the other ids in src/data/calendar.js — 15+ each; plus `events.rent_day` (bills due), `events.payday`, `events.new_year`, `events.star_party`, `events.flower_show`.

### D. Who (what the speaker is doing) — `kind`
jogger, carrier (shopping bags / boxes), queue, bus (waiting at a stop), bench, busker, dogwalker, cyclist, phone (looking at a phone), couple, kid, tourist, vendor (stall holder calling out), worker (hi-vis, delivery),
commuter (rush hour), smoker_break (staff on a break behind a shop), photographer, student, parent_with_stroller, late_runner (running for a bus/train) — 25+ each.

### E. `duets` — two-person exchanges for people standing together: an ARRAY of pairs `[lineA, lineB]`; A speaks, B answers a beat later. Counts as one bubble event. 250+ pairs.
Optional keyed sets with the same shape: `duets_by.venue.<key>`, `duets_by.kind.couple`, `duets_by.kind.kid` (kid + parent) — 20+ each.

### F. `player` — CONTEXTUAL, about or to the player because of what a passer-by can see. Only said by someone within a few steps. Witty, never cruel. 40+ each.
Body / needs: `stinky` (hygiene low) · `filthy` (hygiene critical) · `exhausted` · `starving` (stomach growls) · `bursting` (the walk gives it away) · `gloomy` (strangers being gently kind) · `glowing` · `lonely` (small talk offered) ·
`fresh` (just showered: smells nice) · `full` (just ate well) · `caffeinated`.
Weather on you: `soaked` (rain, no umbrella) · `snowy` · `sweaty` (heatwave) · `umbrella` (has one in the rain: approving nods) · `underdressed_cold`.
Look: `pajamas` (outside) · `dressed_up` · `travel_outfit` (still in travel clothes) · `sporty` · `artist_outfit` · `raincoat` · `same_outfit_days` (same clothes several days running).
Standing in town: `new_in_town` (first 3 days) · `settling_in` (days 4-20) · `regular` (3 weeks+, recognised; may use {name}) · `homeowner` · `unemployed` · `on_way_to_work` · `after_work` · `promoted` (recent promotion) ·
`broke` (< $20) · `flush` (> $5,000) · `birthday` (may use {name}).
What you are doing: `running` · `night_owl` (1-4 am) · `early_bird` (5-6:30 am) · `loaded_bag` (full backpack) · `carrying_gift` · `carrying_food` (takeaway smells) · `on_bike` · `with_friend` (walking with someone) ·
`bumped` (you walked into them) · `staring` (you stood right next to them) · `blocking` (you are standing in a doorway / on a crosswalk) · `sitting_bench` (sharing a bench with them) · `petting_animal` ·
`taking_photo` · `lost` (map out, turning in circles).

## Engine status (lead)
- Written: `src/sim/_crowd_lines.js` — `cityLine(c, ctx)`, `playerStates()`, `roomVenueKey(roomId)`, `lineStats()`; shuffle bags; merges the old AMBIENT pools into the same bags. Not wired until the writer's file exists.
- To do when the file lands: flatten `general` themes; `near` (landmark proximity); `events` by calendar id; `duets` (A then B); the extra `player` states the game can already detect; triggers for bumped / staring / blocking;
  wire into `_crowd_core.js ambientLine`, `crowd.js chatter`, `_crowd_rooms.js`. States the game cannot detect yet stay written and dormant until their system exists (clothes-days, bike, photo...).
