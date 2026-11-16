# Central Station: Platforms 1 and 2 (Fable worker, 2026-11-16)

Owner msgs 159, 160, 183; BIBLE direction update 31. "Central Station need to be able to access and see the train platform 1 and 2" / "modify the train job to use the platforms once built" / "make a very detailed unique platform".

**In short.** Behind the hall's fare gates there is now a real place: room `central_station:platforms` (20 x 31), a head-end train shed with two tracks, two platforms and a concourse. Trains slide in out of two tunnel mouths on the rail timetable, open their doors, let people off and on, and leave. You walk through the gates onto the platforms, board at a door, and when you arrive at Central by train you stand on the platform of your line and walk down to the hall. The Station Agent's whole shift is worked up there. The hall is untouched except the gates' behaviour and its departures board, which now tells the truth.

**Not tested:** a real phone; one whole shift played by touch from 06:00 to 13:00 in a single run (the first 2 h 20 min were, the end was checked by script: section 8); a save made while standing on the platforms and loaded again; winter (snow on the cars); the job's `mid` and `clockout` story beats (only the first clock-in beat was played); a shift at levels 3 and 4.

## 1. Layout (room coordinates; world = room + 1)
Files: `src/scenes/rooms/station_platforms.js` (room + all behaviour), `src/art/rail_interior/platforms.js` (17 new assets `furn.cplat.*`).

| x | what |
|---|---|
| 0.5 to 3.5 | track 2, a pit 0.5 deep (not walkable) |
| 3.5 to 10 | **Platform 2**; its right edge (x 10) is a brass-railed fence with five framed posters |
| 10.5 to 13.5 | track 1 (pit) |
| 13.5 to 20 | **Platform 1**; the stationmaster's office is its back wall |

- y 0 is the back wall: tunnel mouth 2 (x 0.5), two arched windows, tunnel mouth 1 (x 10.5), the office (x 13.5 to 20: door, lit window, LOST PROPERTY hatch). Above it the glazed fan of the end screen; along the left wall the arcade and the far half of the glass vault (three pieces, pendant lamps on the main ribs).
- The tracks end at buffer stops (y 24.7); y 26 to 31 is the **head concourse**, which joins the two platforms on the level, so no footbridge was needed. On it: the stairwell down to the hall (x 8.5 to 11.5, exit mat at 10, 27.9), WAY OUT sign, two ticket validators, the help point, the live departures board on the left wall (y 26 to 31), two post clocks, luggage trolleys, planters, benches, a CENTRAL name board.
- A train stands with its nose at y 24.2: two cars inside the shed, the rest in the tunnel. Door positions y 2.1, 5.8, 9.5, 14.5, 18.2, 21.9, marked on the tactile strip of both platforms.
- Platform 2: signal, two vending machines, bins, four benches, the glazed waiting shelter (3 seats), four cast-iron lamp columns, trolley rack, platform indicator. Platform 1: signal, the PA box "Gladys", mail trolley, four columns, four benches, the dispatch point (yellow square, flag, baton, whistle, RA box) at (14.9, 16), platform indicator, the platform guard.
- Four pigeons sit on the end screen, the columns and the WAY OUT sign and fly between them.

## 2. Which line uses which platform
`G.rail.platformOf(dir)` (new): **Platform 1 = Loop A** (direction 0, next stop Harborside), **Platform 2 = Loop B** (direction 1, next stop Railyard). It matches the line number already painted on the train noses. Both loops call at all eight stations, so the board shows the next stop and `G.rail.plan()` still picks the quicker way round.
The room draws Central as a terminus: both loops come in from the back and reverse out. On the city viaduct the same trains run through. This is a picture choice, the timetable is not changed.

## 3. How the trains are driven
Every frame, per platform, the room asks `G.rail.timeTo(dir, set, 'central')` for the nine sets of that direction:
- within 1.7 game minutes of arriving: the set slides in (eased), headlights on, display CENTRAL, signal amber;
- for `G.rail.DWELL` (4 game minutes) it stands; doors open from 0.35 after arrival until 0.55 before departure; signal red, then green in the last minute;
- for 1.7 game minutes after departure it backs out, tail lamps on, display HARBOR / RAILYD.
Nothing is stored: a save, a time skip or `G.advance` lands in the right phase. With the current timetable a train stands at each platform for about 4.7 real seconds out of every 10.6 at 1x; the two loops happen to be at Central at almost the same time.
The cars are the existing `veh.train.car` art (flipped). A car that is partly in the tunnel is cut at the wall plane (a clipped copy of its sprite), so it is only seen through the tunnel mouth. Open doors are six small overlays per platform. Three car pictures per car (in / standing / out) are baked ahead on entry.
The boards are live: the big board (next five departures of both platforms: platform, line letter, next stop, minutes, the time), one indicator per platform (next stop, line, minutes, "then 11, 20 min"), and in the hall the portal's board (next three: destination, platform, minutes; its static rows were wrong). They are redrawn when their text changes. The two post clocks run four minutes fast on purpose (the Station Agent's story says the station clock always has).

## 4. Access and arrival
- **Gates** (hall, unchanged art): with a ticket, a pass, or as the Station Agent the gate opens and you go up. The ticket is not taken at the gate; it is used when you board, as before. Without one a small window offers "Buy a ticket and go through", "Tickets & passes", and "Departures" (the old boarding panel, which also still opens from `G.rail.openStation('central')`).
- **Boarding**: every door mark on the tactile strip is tappable ("Wait here: Loop A toward Harborside" / "Board ..." when a train is in). With a Map trip the destination is known; otherwise the old panel opens and its button now reads "Go to Platform N". Then `scene.platformBoard(dir, to, board, fail)` walks you to the nearest door of the right platform (across the concourse if you are on the wrong one), you wait there ("Waiting for the train", cancellable, the train is seen arriving) and step in; the ride scene and Skip run as before, on the very set that stood there.
- `G.rail.ride('central', x)` from the hall first takes you through the gates; from the city or any other caller it behaves as before (hidden wait, then the ride). `opts.nowait` is unchanged.
- **Arriving**: `G.rail.alight('central')` enters the room with `{ arrive: dir }`: you stand at an open door of that line's platform. The stairs lead to the hall by the gates.
- **Guide arrow**: in the city "Go in: Central Station → platforms"; in the hall "Through the gates → Platform 1: Loop A to Harborside"; on the platforms "Platform 1: Loop A to Harborside (· boarding now)" at the door mark; after arriving "Stairs down to the hall → <destination>". Changes: `src/ui/navarrow.js` (4 places), one row in the room graph of `src/sim/navgoals.js`.
- Other stations are not changed.

## 5. The Station Agent on the platforms
`story/jobs_new.js`: the job has `room: 'central_station:platforms'` (the pattern the airport jobs use), so clock-in, the story beats, the work loop and the Play all happen there; the guide arrow leads through the gates ("Walk in to clock in"). Hours, pay, levels and texts are unchanged.

| task | was (hall) | now (platforms) |
|---|---|---|
| Dispatch a Train | a spot by the gates | the dispatch point on Platform 1. The ticket now appears when a Loop A train is really about to stand there, about one train in three |
| Which Platform? | information desk | the help point on the concourse |
| Free a Stuck Ticket | the fare gates | the two validators at the stair head (the ticket title says "validator") |
| Log Lost Property | cupboard on the hall's west wall | the LOST PROPERTY hatch of the stationmaster's office |
| Make an Announcement (level 2) | announcer's booth | the PA box "Gladys" by the office |
| the Play "Along the Train" | at the gates spot | at the dispatch point |

**Nothing of the job stays in the hall.** The work engine runs a shift in one room; working across two rooms would have meant a scene change for every other ticket. The hall keeps its announcer's booth and lost-property cupboard as furniture. Two answers were made true to the platforms ("Which platform for Harborside? Platform 1. Loop A, the red one."; the Play's train cards).
Files: `story/jobs_new.js` (1 field), `sim/_jobstory_stations.js` (the station table, the train ticket, two titles, one answer), `sim/_jobplay_games.js` (one line of text).

## 6. Performance
`tools/perf.mjs --verify`: same pixels, 0 page errors. Frame times, my own script (headless Chromium, CPU 4x slower, dpr 2, 390 x 844, fresh page, 22 s walking both platforms while trains come and go), two runs each:

| scene | fps | 1% low fps | frame ms p50 / p95 | worst ms | frames over 50 ms |
|---|---|---|---|---|---|
| platforms, day | 54.7 / 56.2 | 21.9 / 21.8 | 17.5 / 27.9 | 67 / 108 | 4 / 3 |
| platforms, night | 52.9 / 54.2 | 22.5 / 25 | 18.1 / 29 | 63 / 49 | 2 / 0 |
| platforms, game speed 4x | 51.7 / 48.2 | 19.3 / 13.2 | 18.6 / 31.2 | 74 / 118 | 4 / 13 |
| hall, day (for comparison) | 59.5 / 59.6 | 24.2 / 26.1 | 16.6 / 24.4 | 95 / 92 | 2 / 2 |
| hall, night | 59.5 / 59.4 | 26.7 / 24.5 | 16.6 / 25.9 | 65 / 136 | 1 / 1 |

The room is about 4 to 6 fps below the hall on this slowed-down machine (about 50 entities against 20: up to 18 waiting people, up to 14 passengers, 4 cars, 12 door overlays, boards, birds). No long hitches. Not measured on a phone.

## 7. Size
`dist/index.html`: 14,675 KB before, **14,722 KB after (+47 KB** of the 200 KB allowed). `grep -c '(?<[=!]' dist/index.html` = 0.

## 8. How each thing was checked
Played by touch in the built game (Playwright, 390 x 844, taps on the canvas and on buttons):
- street → hall → gates without a ticket (window, buy, through) → platforms; stairs back; gates again with the ticket (opens at once);
- walking on both platforms and the concourse; tapping both tracks does nothing; every nav cell in both pits is blocked (script);
- sitting on a platform bench;
- boarding on Platform 1 (to Harborside) both when a train was standing and when it had to be waited for; riding to Central from Harborside (arrived on Platform 2) and from Railyard (arrived on Platform 1), then down the stairs to the hall;
- two Map trips with the train, started with `G.nav.start(option)` (the Map's own sheet button was not tapped) and then followed by tapping where the arrow pointed: Harborside → a place near Central, and Central → a place near Harborside. Arrow texts as in section 4;
- a Station Agent shift at level 1 and one at level 2, by touch, from the clock-in story beat ("The Clock Is Right") through the "Work the shift" card and the tickets from 06:00 to about 08:20: all five tasks were done at their new fixtures (dispatch 3 times, about 25 game minutes apart, each as a Loop A train came in) and the Play ticket appeared at the dispatch point. My test driver then stalled on the Play's end card, so the rest of that shift was not played by touch. Separately: the Play played by touch to its end (three trains, "Hold a beat for her", "Back to work", score 1); and by script (`G.jobs.debugStep` x 14, `G.jobs.debugFinish`) the shift ended at 13:00 with the pay card: 7 h x $13 + $8 bonus = $99 paid;
- 375 x 812: gates window, platform, panel, boarding;
- fake gamepad (`tools/pad_lib.mjs`): gates, buy, platforms, door mark, panel, onto the train, with the focus ring only.
Looked at, full size: the whole space by day, dusk and night with trains in and without (`out/shots/cst_day_*`, `cst_dusk_*`, `cst_night_*`), arrivals, the job, the hall board.
Scripts: `node src/data/validate.mjs` OK; `node tools/build.mjs` OK; `node tools/navcheck.mjs --rooms all` all passed, 0 page errors; `node tools/jobs_check.mjs` OK; `node tools/perf.mjs --verify` OK; `node tools/nightcheck.mjs` all checks passed. Zero page errors in every run above.

## 9. What is left / known weak points
- The left wall along the platforms is the hall's tall arched windows; in the sky colours it reads as one glass wall with the vault. Stone piers between the arches would separate them.
- At night the room is as bright as the hall (the shared indoor light). The lamps, the lit train windows and the night sky show, but it is not a dark shed with pools of light.
- The departure text on the car sides is hard to read at this size (the same art as in the city).
- Tapping the floor behind a bench sits you down, because a bench's tap area reaches up the screen. This is the game's rule everywhere (the hall's benches do the same in front of the gates); on the platforms it makes the lane between the yellow line and the benches fiddly.
- During a shift the clock runs at 2x, so trains come and go about every five seconds.
- The hall shows no train through its far wall: the portal is a staircase going up, so there was no cheap honest view. The portal already carries the lit "PLATFORMS 1-2" sign; its board is now live.
- The passengers who get on and off are the room's own light figures; they cannot be talked to (the waiting crowd can).
- The off-shift story beats of the job still name the hall as the place (`cast.place`), which is right for meeting people there.

## 10. Questions for the owner
1. Is it fine that the whole Station Agent shift is on the platforms, or should the information desk and the gates in the hall stay part of the job (it would mean walking between two rooms during a shift)?
2. Central is drawn as a terminus where trains reverse. Is that the station you want, or should trains run through?
3. Should the platforms be darker at night than the hall?

## Files
New: `src/scenes/rooms/station_platforms.js`, `src/art/rail_interior/platforms.js`, this report.
Changed: `src/sim/rail.js` (platformOf, boarding / arriving at Central, panel wording), `src/scenes/rooms/stations.js` (gates, live portal board), `src/art/rail_interior/station.js` (portal `live` flag), `src/ui/navarrow.js`, `src/sim/navgoals.js` (one graph row), `src/story/jobs_new.js`, `src/sim/_jobstory_stations.js`, `src/sim/_jobplay_games.js`.
Nothing is needed in lead-owned files (`unique_rooms.js` is not involved: the room registers itself like the hall does).
