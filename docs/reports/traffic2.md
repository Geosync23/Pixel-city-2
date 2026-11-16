# Traffic round 2: smarter driving, same density (owner msg 145, BIBLE direction update 27)

Owner: "smarter traffic, fewer jams, no decrease in density". Files: `src/sim/traffic.js`, `_traffic_veh.js`, `_traffic_graph.js`, `tools/traffic_check.mjs` (new). `src/sim/transit.js` was not edited.

## 0. In short

- Before, traffic never visibly "jammed for ever" only because of two hidden tricks: a vehicle that stood 22 s was allowed to **drive through** the cars in front (24 times per hour around the camera), and anything that stood 12 s out of view was **deleted** (31 per hour). What the player saw was cars and buses inside each other (500 pair-seconds per hour, 116 of them in view), junction boxes blocked 6 minutes per hour, and stacks of buses (QA round 14's "three buses at the same point, no bus for 38 minutes").
- Now vehicles reserve a junction before they enter it, never enter one they cannot leave, give way sensibly, change lane or re-plan round something that is not moving, buses load at the kerb and never wait for the timetable in a lane, and the lights follow the traffic. City survey, before -> after: drive-through 24 -> 0.2 per hour; deleted while stuck 31 -> 0.3; junction boxes blocked 374 -> 6 s per hour; gridlock cycles 29 -> 0; vehicles inside each other 500 -> 16 pair-seconds per hour (116 -> 2.5 in view); stops longer than 20 s 31 -> 21 per hour; mean speed +6% (+24% at the busiest junctions). Bus headway spread: cv 0.47-0.56 -> 0.18-0.23, longest gap between buses at a stop 60-92 -> 48-58 game minutes.
- Density: the mean number of vehicles on the road is the same or higher in every time-of-day band of the city survey. It is ~6% LOWER at the three busiest bus junctions and the peaks are 2-4 lower everywhere, for one reason: buses no longer stand stacked on top of each other (section 6 says exactly where). Cars were added to make up for it (ambient cars +15-20%).
- Not improved: the share of time vehicles spend standing longer than 20 s is the same as before (0.5% of vehicle time on a phone-sized view; higher on a desktop-sized view). Before, that number was held down by the two tricks; now it is real waiting at lights (longest 40-55 s, never more than a minute).

## 1. How it was measured (`tools/traffic_check.mjs`)

`node tools/traffic_check.mjs --plan base --html <build> --out <name>` (15-20 minutes), `--plan rides` (the player's cab and bus rides, real time), `--plan shots` (the three worst spots at the rush), `--plan survey|soak|quick`. Results: `out/traffic/<name>.md` + `.json`, heat map `out/shots/<name>_heat.png`.

- The REAL built single-file game runs in headless Chromium at 390x844. The city scene, a camera target placed on a junction, the player on the pavement beside it.
- **Time is not skipped with G.advance** (traffic lives in real seconds; jumping the clock would simulate nothing). Instead the game's own `frame()` is driven with a synthetic clock: `requestAnimationFrame` is captured and called with timestamps 1/60 s apart as fast as the machine allows. Everything in `frame()` runs unchanged at game speed 1x (`G.CLOCK` = 0.85 game minutes per second: one game day = 1694 simulated seconds = 28 real minutes); only `G.renderer.draw` is a no-op while fast-forwarding. Needs are frozen (dev mode), any window that opens is closed.
- Traffic only exists in a ring around the camera (about +-26 units on a phone), so "the city" = 22 camera sites (the junctions of the road graph, thinned to >= 34 apart). Plan `base` = survey (22 sites x 1 game day, clear) + soak (3 busy junctions + a walking tour of 26 legs, 3 game days each) + rain (3 sites x 1 day, rain forced) + event (Winter Lights and Blossom Parade staged with `G.cityEvents.debug.start`, the street closed) + desktop (3 sites x 1 day at 1280x800: a bigger ring and more vehicles).
- Bands by the game clock: am rush 7-9.5, midday 9.5-16, pm rush 16-19, evening 19-22, night 22-7.
- Measures (all computed by the tool from the vehicles' positions, the same code for both builds): vehicles alive (all / ambient = not buses, stand cabs, service cabs / moving), mean speed, share of vehicle-time by vehicles that have stood > 20 s and > 60 s (a red light used to be 11 s at most), number and length of such stops, queues (>= 3 standing in one lane), junction blockage (a vehicle standing > 3 s with its centre inside a junction box), gridlock (a cycle in the "who waits for whom" graph of vehicles standing > 5 s), drive-through unsticks (`v.gho` going on), vehicles removed while standing > 11.5 s (in the tour run this also counts vehicles left behind by the moving camera), overlaps (pairs of vehicle rectangles, shrunk by 0.22, inside each other; in view or not), teleports (a jump of a living vehicle), bus dwell and vehicles held behind a loading bus, bus headways at every stop (all 28 buses, on screen or not).
- Player rides are a separate plan in real time (no fast-forward).

Limits of the method: one seed per site and run (a second survey with other seeds moves "standing > 20 s" by about +-0.15 percentage points and the mean vehicle count by about +-3%); the survey sites are junctions, so mid-block stretches are covered only as part of a ring; overlaps are axis-aligned rectangles (a vehicle in the middle of a turn is approximated).

## 2. Baseline (build of 2026-11-16 00:08, before any change; `out/traffic/traffic_base.md`, heat map `out/shots/traffic_base_heat.png`)

Numbers: the "before" columns of section 6. Where: Harbor Blvd from Western Ave to Maple Ave (the arterial under the rail viaduct that all three bus routes use) and the streets that feed it. Junction boxes blocked, seconds per game day at each: Harbor & Main 2421, Harbor & Maple 1131, Harbor & Riverside 925, Harbor & Cooper 847.

Causes found (each reproduced, not guessed):
1. **A junction was "taken" by a counter, not by paths.** `node.occ` let any number of same-axis vehicles in, let a turning vehicle in only into an empty box, and forced entry after 9 s. Nothing checked that there was room to leave: vehicles stood in the box (374 s per hour) and across each other.
2. **The unstick was the traffic model.** After 22 s a vehicle became a ghost for 4 s and drove through whatever was ahead: median "time to clear" of a long stop was exactly 22.1 s. Out of view anything that stood 12 s (one red light) was deleted and re-spawned elsewhere.
3. **Buses.** 28 buses run every ~12 real seconds per route. Where two routes merge (Main St into Harbor Blvd) one lane had to carry a bus every 6 s through a signal with a stop straight after it: they ghosted into each other all day. A bus that had caught up with the one ahead waited up to 6 extra seconds in the lane; a bus could be created inside another bus (spawn clearance 5 for an 8-long bus) or inside a junction past the stop line.
4. **QA round 14's pile-up, reproduced:** the player stands with their toes on the asphalt at the stop (0.6 from the lane centre). The bus stops for the player for ever (a vehicle never ghosts while the player is in front); every following bus ghosts into it. 11 buses on top of each other after 5 minutes.
5. **Turning long vehicles sweep across lanes** (a vehicle turns about its centre): a bus turning right swung its nose across the next lane into the car beside it: both saw the other as "ahead": a 2-vehicle deadlock inside the box, the commonest gridlock cycle (29 in the survey).
6. **The stop's "1 min".** The ETA constant assumed an on-screen bus averages 5.5 units per second; measured: 1.5-2.3.

## 3. Design (what a driver now does)

Kept: the lane model, kinematics (same acceleration, braking, cornering arcs), spawn rules, the pool, everything in transit.js.

1. **Junction boxes are reserved.** At its stop line a vehicle is let in only if (a) the light is green (or there is none), (b) its swept path does not come within 1.5 of the path of anyone holding the box (paths are compared geometrically per lane, with the nose and tail swing of the vehicle's length class; cached per junction), (c) there is room on the exit lane to clear the box AND the crosswalk completely, counting those already on their way there, (d) nobody with right of way is about to arrive: straight before right turn before left turn, then the bigger road, then a fixed tie-break. Right turn on red after a full stop when nothing is coming.
2. **Nobody starves.** Whoever has waited 2.5 s on a green (or sat through a red) gets a claim on the junction, one per street: crossing traffic lets him go next; the green is held for him up to 3 s.
3. **Lights follow demand.** Per junction: a green ends after 3 s if nobody is coming on it and someone waits on the other street; ends at 6 s when the other street waits; runs on (to 11 s) while vehicles that were already queuing are still standing, or two buses are coming; rests on green when the other street is empty. Amber 1.6 s as before. Sirens and the player's cab / bus still force their green.
4. **Re-planning.** An ambient vehicle whose exit stays full for 3 s takes another exit that has room; on a wide road it takes the other lane of the exit. A cab (anything with a destination) re-routes round the full street after 5 s. On a road with two lanes each way: change lane round anything that is not going anywhere, pick the kerb lane to turn right and the inside lane to turn left. On a one-lane street: overtake a stationary obstacle through the oncoming lane when that is clear for the whole manoeuvre (written and guarded; it did not fire once in 19 simulated hours, because nothing stands in a lane that long any more).
5. **Buses.** Centre themselves in the painted bay and pull in to the kerb; a second bus loads right behind the first where the block is long enough; a third does not queue for the stop: it leaves that stop out (never the bus the player rides, never while the player is within 16 of the stop). On Harbor Blvd they use both lanes and move over to the kerb lane on the street with their stop. No timetable hold on screen; instead every bus drives up to 15-20% faster or slower to keep the gaps even. A bus only appears on the open street (never in a junction) and waits at the edge of the simulated area (up to 8 s) when the street is full there.
6. **People.** A vehicle still waits for anyone crossing. Someone STANDING at the kerb edge of the lane is driven round slowly. The player standing in the middle of a lane of a wide road is driven round in the other lane (on a one-lane street drivers wait and honk, as before). A bus the player keeps from its stop opens its doors where it is.
7. **Cabs** that wait for their fare, or are told to halt, pull over to the kerb so the street behind is not blocked.
8. **Traffic leaves town at dead ends** (out of view) instead of every car avoiding the six stub streets or flipping round at their end.
9. **Last resort, counted** (`G.traffic.stats`): a vehicle that has not moved for 40 s is removed if it is out of view; in view it is let through after 60 s; a siren / ride vehicle after 8 s. In the 19.1 simulated hours of the final run: 4 removed out of view, 0 let through in view, 4 slip-throughs by siren vehicles.
10. **Density.** Traffic that flows leaves the ring sooner and buses no longer pile up, so the ambient target gets `FLOW x (1 + district density) + FLOW_BUS x buses on the street` extra cars, scaled at night and in rain like the rest.

## 4. What changed, per file

- `src/sim/_traffic_veh.js` (driving rules; rewritten `step`): junction reservation (`enterNode / leaveNode / leaveAp / detach`, `conflict`, `pathOf`, `roomFor`, `canEnter`, `rank`), claims, right on red, `pickExit` (re-plan), `laneFree` + lane changes + turn-lane discipline, `canPass` (overtake), kerb pull, standing-pedestrian squeeze, second bus berth, bus stop skip hook, last-resort counters `T.stats`, tunables `TUNE`. New vehicle fields: `uid, mk, nmk, ln, lw, xw, dg, lcT, pass, dest, unstick, why, apN, far, ck`. `Veh.mk()` (sprite maker) is now `mk_()` because `mk` is the movement key.
- `src/sim/_traffic_graph.js`: node fields `inn, ap, cl / clT / clS, cf, sAx / sT / sAm` (every node has the same shape); `occT / occX / occAx` are gone (`occ` = `inn.length`). A guard: at most 511 lane edges (there are ~300).
- `src/sim/traffic.js`: demand-led `signals(dt)` + `SIG`; buses: `gaps()` pace control, no hold on screen, `busSkip`, lane-aware `laneClear` for appearing, no appearing in junctions, `BUS_WAIT`, `BUS_REAL_V` 5.5 -> 3.1 (measured); `kerbIn` (parked cabs), `reroute` (cabs), dead-end exit, `FLOW / FLOW_BUS`, stuck removal only via `v.unstick` (was: anything standing 12 s out of view); perf: out-of-view vehicles stepped every other time (`v.far`), lights every third step, off-street buses every fourth, only people on or at the roadway in the drivers' list. API additions: `G.traffic.stats`, `G.traffic.TUNE`.
- `tools/traffic_check.mjs`: new (section 1).
- `src/sim/transit.js`: unchanged. (Its cab pick-up, ride, Skip, bus boarding and Skip were re-tested, section 7.)

## 5. Tunables

`TUNE` in `_traffic_veh.js`: `claimAfter 2.5` s on a green before a claim; `replanAfter 3` s with a full exit before another exit is taken; `rerouteAfter 5` (cabs); `passAfter 2.5` s an obstacle must have stood before it is overtaken; `ghostPre 8`, `unstickAfter 40`, `ghostAfter 60` (last resort); `clearBox 1.6` units past the box that must be free (the crosswalk); `yieldTime 1.8` s look-ahead for giving way; `rightOnRed true`; `busKerb 0.3`, `cabKerb 0.35`.
`SIG` in `traffic.js`: `min 3, green 4, max 6, claim 3, bus 3, cap 11, amber 1.6` seconds. `FLOW 1`, `FLOW_BUS 0.7` (cars added to the ambient target; set both to 0 for exactly the old target). `BUS_WAIT 8` s. `BERTH 0` (5 was tried: a second berth everywhere, but the bus stood outside its painted bay).

## 6. Before / after (same tool, same sites, same seeds; before = `traffic_base`, after = `traffic_after`)

**survey** (all bands; sim hours 10.2 before, 10.4 after)

| measure | before | after |
|---|---|---|
| vehicles on the road, mean | 7.1 | 7.5 |
| vehicles, peak | 22 | 20 |
| ambient cars, mean | 3.8 | 4.6 |
| ambient cars, peak | 14 | 14 |
| moving (> 0.5), mean | 3.9 | 4.3 |
| mean speed | 2.94 | 3.13 |
| standing > 20 s (share of vehicle time) | 0.48% | 0.48% |
| standing > 60 s | 0.00% | 0.00% |
| stops > 20 s per hour | 30.7 | 21.3 |
| time to clear: p50 / p95 / longest (s) | 22.1 / 31.0 / 50.5 | 23.4 / 37.5 / 46.5 |
| queues (>= 3 standing) at a time / longest | 0.18 / 7 | 0.07 / 4 |
| queue whose head is stuck > 20 s (s per hour) | 13.1 | 9.2 |
| junction box blocked: events / seconds per hour | 52.1 / 374.1 | 1.0 / 5.6 |
| gridlock cycles: number / seconds / longest | 29 / 419.5 / 16.5 | 0 / 0.0 / 0.0 |
| drive-through unstick ("ghost") per hour | 24.0 | 0.2 |
| removed while standing > 11.5 s, per hour | 30.6 | 0.3 |
| vehicles inside each other: pair-seconds per hour (in view) | 499.8 (116.4) | 15.5 (2.5) |
| teleports (in view) | 0 (0) | 0 (0) |
| bus dwell on screen: mean / longest (s) | 2.4 / 8.1 | 2.0 / 2.0 |
| bus dwells that held traffic up / vehicle-seconds held per hour | 19.49% / 154.8 | 1.78% / 9.8 |

**soak** (all bands; sim hours 5.6 before, 5.6 after)

| measure | before | after |
|---|---|---|
| vehicles on the road, mean | 10.8 | 10.1 |
| vehicles, peak | 22 | 19 |
| ambient cars, mean | 4.1 | 4.8 |
| ambient cars, peak | 14 | 14 |
| moving (> 0.5), mean | 4.7 | 5.0 |
| mean speed | 2.62 | 3.25 |
| standing > 20 s (share of vehicle time) | 0.46% | 0.13% |
| standing > 60 s | 0.00% | 0.00% |
| stops > 20 s per hour | 35.9 | 6.6 |
| time to clear: p50 / p95 / longest (s) | 22.1 / 31.6 / 54.5 | 24.3 / 37.7 / 41.6 |
| queues (>= 3 standing) at a time / longest | 0.27 / 7 | 0.09 / 5 |
| queue whose head is stuck > 20 s (s per hour) | 19.5 | 2.3 |
| junction box blocked: events / seconds per hour | 54.4 / 314.9 | 0.5 / 0.7 |
| gridlock cycles: number / seconds / longest | 18 / 250.5 / 19.6 | 0 / 0.0 / 0.0 |
| drive-through unstick ("ghost") per hour | 24.6 | 0.0 |
| removed while standing > 11.5 s, per hour | 44.8 | 28.2 |
| vehicles inside each other: pair-seconds per hour (in view) | 510.7 (192.0) | 38.1 (2.9) |
| teleports (in view) | 0 (0) | 0 (0) |
| bus dwell on screen: mean / longest (s) | 2.5 / 8.1 | 2.0 / 2.0 |
| bus dwells that held traffic up / vehicle-seconds held per hour | 25.87% / 236.7 | 0.38% / 3.6 |

**rain** (all bands; sim hours 1.4 before, 1.4 after)

| measure | before | after |
|---|---|---|
| vehicles on the road, mean | 10.5 | 9.8 |
| vehicles, peak | 23 | 17 |
| ambient cars, mean | 3.7 | 4.3 |
| ambient cars, peak | 12 | 10 |
| moving (> 0.5), mean | 4.5 | 4.8 |
| mean speed | 2.69 | 3.34 |
| standing > 20 s (share of vehicle time) | 0.46% | 0.04% |
| standing > 60 s | 0.00% | 0.00% |
| stops > 20 s per hour | 43.2 | 1.4 |
| time to clear: p50 / p95 / longest (s) | 22.1 / 28.7 / 54.5 | 33.4 / 33.4 / 33.4 |
| queues (>= 3 standing) at a time / longest | 0.18 / 6 | 0.06 / 4 |
| queue whose head is stuck > 20 s (s per hour) | 20.9 | 0.0 |
| junction box blocked: events / seconds per hour | 56.0 / 475.0 | 0.0 / 0.0 |
| gridlock cycles: number / seconds / longest | 9 / 145.0 / 16.5 | 0 / 0.0 / 0.0 |
| drive-through unstick ("ghost") per hour | 31.2 | 0.0 |
| removed while standing > 11.5 s, per hour | 31.9 | 0.0 |
| vehicles inside each other: pair-seconds per hour (in view) | 504.5 (325.9) | 19.6 (2.8) |
| teleports (in view) | 0 (0) | 0 (0) |
| bus dwell on screen: mean / longest (s) | 2.4 / 8.1 | 2.0 / 2.0 |
| bus dwells that held traffic up / vehicle-seconds held per hour | 19.92% / 151.8 | 0.00% / 0.0 |

**event** (all bands; sim hours 0.3 before, 0.3 after)

| measure | before | after |
|---|---|---|
| vehicles on the road, mean | 5.1 | 4.1 |
| vehicles, peak | 14 | 13 |
| ambient cars, mean | 2.1 | 2.0 |
| ambient cars, peak | 13 | 11 |
| moving (> 0.5), mean | 3.0 | 3.3 |
| mean speed | 3.19 | 4.56 |
| standing > 20 s (share of vehicle time) | 0.18% | 0.00% |
| standing > 60 s | 0.00% | 0.00% |
| stops > 20 s per hour | 17.0 | 0.0 |
| time to clear: p50 / p95 / longest (s) | 22.1 / 22.1 / 22.1 | 0.0 / 0.0 / 12.0 |
| queues (>= 3 standing) at a time / longest | 0.04 / 4 | 0.02 / 4 |
| queue whose head is stuck > 20 s (s per hour) | 13.6 | 0.0 |
| junction box blocked: events / seconds per hour | 6.8 / 129.5 | 0.0 / 0.0 |
| gridlock cycles: number / seconds / longest | 1 / 16.5 / 16.5 | 0 / 0.0 / 0.0 |
| drive-through unstick ("ghost") per hour | 6.8 | 0.0 |
| removed while standing > 11.5 s, per hour | 17.0 | 0.0 |
| vehicles inside each other: pair-seconds per hour (in view) | 71.1 (70.7) | 0.0 (0.0) |
| teleports (in view) | 0 (0) | 0 (0) |
| bus dwell on screen: mean / longest (s) | 2.1 / 8.1 | 2.0 / 2.0 |
| bus dwells that held traffic up / vehicle-seconds held per hour | 2.50% / 10.8 | 0.00% / 0.0 |

**desktop** (all bands; sim hours 1.4 before, 1.4 after)

| measure | before | after |
|---|---|---|
| vehicles on the road, mean | 13.7 | 14.2 |
| vehicles, peak | 29 | 27 |
| ambient cars, mean | 6.7 | 9.2 |
| ambient cars, peak | 17 | 20 |
| moving (> 0.5), mean | 5.7 | 6.4 |
| mean speed | 2.30 | 2.62 |
| standing > 20 s (share of vehicle time) | 0.71% | 1.13% |
| standing > 60 s | 0.00% | 0.00% |
| stops > 20 s per hour | 109.8 | 56.0 |
| time to clear: p50 / p95 / longest (s) | 22.1 / 29.6 / 32.6 | 24.8 / 53.9 / 57.7 |
| queues (>= 3 standing) at a time / longest | 0.72 / 6 | 0.96 / 5 |
| queue whose head is stuck > 20 s (s per hour) | 79.3 | 135.6 |
| junction box blocked: events / seconds per hour | 75.8 / 568.1 | 2.8 / 39.3 |
| gridlock cycles: number / seconds / longest | 10 / 145.5 / 17.6 | 0 / 0.0 / 0.0 |
| drive-through unstick ("ghost") per hour | 58.8 | 1.4 |
| removed while standing > 11.5 s, per hour | 43.2 | 0.7 |
| vehicles inside each other: pair-seconds per hour (in view) | 866.9 (675.4) | 198.9 (64.4) |
| teleports (in view) | 0 (0) | 0 (0) |
| bus dwell on screen: mean / longest (s) | 2.4 / 8.1 | 2.0 / 2.0 |
| bus dwells that held traffic up / vehicle-seconds held per hour | 21.25% / 170.0 | 0.30% / 1.5 |

**Density per time of day (survey: 22 sites, 1 game day each)**

| band | vehicles mean before / after | vehicles peak before / after | ambient mean before / after | ambient peak before / after | standing > 20 s before / after | stops > 20 s per hour before / after | box blocked s/h before / after |
|---|---|---|---|---|---|---|---|
| am_rush | 9.6 / 10.1 | 21 / 18 | 6.2 / 7.0 | 14 / 13 | 0.58% / 1.07% | 43.6 / 44.5 | 423.9 / 0.0 |
| midday | 8.4 / 9.3 | 20 / 19 | 4.9 / 6.3 | 14 / 13 | 0.49% / 0.59% | 43.2 / 38.5 | 522.5 / 14.8 |
| pm_rush | 10.0 / 10.2 | 22 / 20 | 6.3 / 7.1 | 14 / 14 | 0.72% / 0.52% | 60.3 / 31.7 | 636.9 / 2.1 |
| evening | 7.1 / 8.1 | 16 / 17 | 3.7 / 5.2 | 11 / 11 | 0.43% / 0.23% | 35.6 / 16.2 | 439.5 / 9.7 |
| night | 4.4 / 4.3 | 14 / 16 | 1.3 / 1.8 | 8 / 11 | 0.21% / 0.03% | 5.9 / 0.8 | 136.1 / 0.3 |

**Bus headways (game minutes, all stops)**

| route | before: mean / sd / cv / max | after: mean / sd / cv / max |
|---|---|---|
| bus1 | 10.7 / 5.2 / 0.49 | 10.3 / 1.9 / 0.18 |
| bus2 | 11.6 / 5.4 / 0.47 | 11.0 / 2.0 / 0.18 |
| bus3 | 10.8 / 6.1 / 0.56 | 10.3 / 2.3 / 0.23 |

The new build's own counters over all 34 runs (19.1 simulated hours; `G.traffic.stats`): {"ghost":0,"ghostPre":4,"unstick":0,"replan":20,"reroute":0,"laneChange":5590,"pass":0,"claim":8847,"squeeze":1170.382833332725,"busSkip":93,"despawn":4,"rightOnRed":657}

Reading the density rows honestly:
- Survey (the whole city, phone view): the mean number of vehicles is higher in four of the five bands and 0.1 lower at night (4.3 vs 4.4: noise); 7.5 vs 7.1 over the day. Ambient cars are up 21% (3.8 -> 4.6).
- Desktop view: 14.2 vs 13.7 vehicles, but made of 9.2 cars (was 6.7) and 5 buses and cabs (was 7).
- Event runs (a street closed, only 0.3 simulated hours): 4.1 vs 5.1 vehicles; cars are equal (2.0 vs 2.1), the difference is buses again.
- Soak and rain (the three busiest bus junctions + the tour): the total is ~6% lower although cars are up, and every peak is 2-4 lower. The missing vehicles are buses: before, real buses crawled at 1.5-2.3 units per second and stood stacked (the overlap rows); now they move at 2.8-3.4, so each spends less time near the camera. The number of buses that PASS is not lower: arrivals of real buses at on-screen stops in 600 s (one paired run each build, last build), before -> after: Harbor & Cooper 22 -> 38, Cooper & Mill 25 -> 31, Harbor & Chandler 22 -> 20, Main & 3rd 24 -> 34, 1st & 3rd 21 -> 31, Harbor & Maple 36 -> 68. (These counts vary a lot between runs: an earlier pair gave 35 / 34 / 33 before.)
- `FLOW_BUS` can be raised to add still more cars at bus junctions; every extra car costs waiting time and frame time (section 7), so it was left at the value where the city-wide mean is above the baseline.

Standing > 20 s did not fall on the survey (0.48% both), fell at the busiest junctions (soak 0.46% -> 0.13%, rain 0.46% -> 0.04%) and ROSE on the desktop-sized view (0.71% -> 1.13%; "queue whose head is stuck" 79 -> 136 s per hour): there are 37% more cars in that bigger ring than before (the density compensation) and nothing removes or drives through a waiting car any more. Reasons: before, nothing could stand longer than ~22 s in view or 12 s out of view; and there are more cars now. What these stops are now (the build's own reason at the head of the line): a red light (a second red after a green that did not reach them), the junction held by crossing traffic (mostly a bus turning left with its long sweep), no room on the exit. The longest stop in 19 simulated hours was under a minute.

## 7. Proof (all run by this worker unless marked)

- **3-game-day soak, zero permanent gridlocks:** 4 runs x 3 game days (5082 simulated seconds each: Main & Market, Maple & Park, Harbor & Main, and the walking tour): 0 gridlock cycles of any length (before: 18), 0 drive-throughs, longest single stop 41.6 s, nothing standing > 60 s, 0 page errors. Over all 34 runs of the plan: no stop over 60 s anywhere (longest 57.7 s, desktop view).
- **Rain, events:** in the tables; with the street closed for the Winter Lights parade and the Blossom Parade: no stop over 20 s, nothing blocked, 0 overlaps.
- **QA round 14 pile-up** (player at the kerb edge of the stop "Harbor Blvd & Cooper St", 300 s): before: 11 buses on top of each other, the first one standing for the whole run; after: 23 arrivals at the stop, longest standstill of a bus 13 s, 0 drive-throughs. Player dead centre in the bus lane: after: buses pass in the other lane, 19 arrivals, 0 drive-throughs (before this last rule: a pile again).
- **Player rides, real time** (`--plan rides`, `out/traffic/traffic_after_rides.md`; baseline `traffic_base_rides.md`): bus from "1st St & 3rd Ave", get off at the next stop: ok both; bus with Choose stop + Skip ride: ok both (14.6 game minutes skipped both); cab to the cinema, full ride of 381 units: before 48.7 s; after 47.1 s on the last build (44.8-67 s over the runs of earlier builds of this round); cab with Skip after 4 s: ok both. Four more cab rides each build: before 8.0 / 3.6 / 7.1 / 4.6 units per second with 1.7 / 19.3 / 3.3 / 8.0 s standing; after 5.7 / 7.1 / 6.4 / 6.5 with 19.3 / 4.2 / 5.2 / 1.0 s standing. One ride in four used the 8-second slip-through once (ghostPre). A third ride in the script (to the airport) is not boarded within 60 s in EITHER build (the cab is still "coming"); not investigated.
- **Screenshots** at 390x844, morning rush, same procedure both builds (the first moment two vehicles in view have stood > 20 s, else the end of the window): `out/shots/traffic_base_spot1..3.png` vs `traffic_after_spot1..3.png` (Harbor & Main, Harbor & Maple, Harbor & Riverside). Looked at: before spot 1 is a taxi inside a bus in the junction, spot 2 a van standing in the box; after: the boxes are clear. The junctions are under the rail viaduct, which hides the two kerb lanes of Harbor Blvd in every picture.
- **Builds / checks:** see the list at the end of this section (filled in at hand-over).

<!--PROOF-->

## 8. Still imperfect

1. Standing > 20 s is not lower than before (section 6). The three worst junctions now: Western Ave & Harbor Blvd (2-4% of vehicle time), Riverside & Park St, Maple & Harbor: a bus turns left there every 12 s and its sweep holds the whole junction for 4-5 s.
2. A long vehicle still turns about its centre (the sprite flips at the corner): its tail can clip a car waiting at the stop line beside it for a few frames. This is what is left of "vehicles inside each other" (16 pair-seconds per hour, 2.5 in view; it was 500 / 116). A proper fix is a drawn turning arc for buses (art + render work, not done).
3. The peak number of vehicles is 2-4 lower and the busiest bus junctions hold ~6% fewer vehicles (section 6).
4. On a one-lane street nothing passes a loading bus (2 s) or a player standing in the lane; the overtake rule exists but needs an obstacle that stands > 2.5 s with a long clear oncoming lane.
5. A stand cab on Harbor Blvd sits in the kerb lane (it always did); buses and cars swerve 0.8 round it only when the inside lane beside them is free, otherwise they wait behind it.
6. A bus that cannot appear because the street is full waits at most 8 s, then passes unseen as every bus did before.
7. The stop panel's minutes for an on-screen bus now use the measured pace (3.1); the navigator's own bus model (`sim/navigator.js`, not this worker's) still uses its own constants.
8. Right turn on red and the lane-discipline changes were judged by the numbers and a handful of screenshots, not by watching long stretches of play.

## 9. Owner questions

1. Buses: there are 28 (one every ~12 real seconds per route). They are half of the vehicles downtown. With real driving rules that is the capacity limit of Harbor Blvd; today the valve is that a third bus skips a full stop. Fewer buses (say every 18 s) would make the bus streets calmer and the stops less often skipped. Keep 28?
2. Is "about the same number of vehicles, but more cars and fewer stacked buses" what you meant by no decrease in density, or should more cars be added until the busiest bus junctions match too (costs waiting time and a little frame time)?
3. Right turn on red (US rule) is on. Keep?
