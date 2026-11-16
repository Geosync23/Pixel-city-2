# Draw order of long vehicles and trains (occlusion pass, owner msg 206)

Owner: "trees and busses dont play nice it creates weird clipping and occlusion errors. Same thing with two trains passing eachother."

Files: `src/engine/render.js` (the rules + the sort), `src/sim/rail.js` (the cars' boxes), `tools/occl_check.mjs` (new: reproduces and measures), this report.
Test switch: `?occl=old` draws everything in the old order (same build, for A / B pictures). Nothing else is new for players, nothing is saved.

## Cause (three things, all in how the sort decides who is in front)

The renderer sorts sprites by their ground boxes: for every two sprites whose rectangles overlap it decides "A is behind B", then draws in an order that honours all those links.

1. **A long box has no single depth.** When two boxes were not cleanly one behind the other (beside each other on screen, or reaching into each other) the old rule compared the CENTRES. For an 8-unit
   bus that says "the tree is in front" for half of the pass and "behind" for the other half: the tree popped over / under the bus, lamps and people at its ends flipped.
2. **Links that contradict each other.** The centre rule also contradicts the clean links around it (bus behind the tree, tree behind the man, man "behind" the bus by centres). The sort then has to drop one
   link of the loop, and which one depended on where the bus was that frame: a near-side tree was drawn behind the bus for a stretch (seen in `out/occl/before/bus_xp_day.png`, row 4).
3. **Trains: links with things they never touch, and "x, then y, then height".** A 12-unit car seen from the camera is a slanted band, three quarters of its rectangle is empty; it got an order with
   everything in those corners (a taxi under the viaduct "in front of" the train above it). And a car that had just left a deck slab was "behind" it by x although it is above it. Together: train A is
   over the slab, the slab is "in front of" train B, B is behind A, ... the sort dropped a different link every frame: slabs drawn over cars, cars of one train cut into the other
   (`out/occl/before/trains_viaduct_day.png`, frames 3, 4, 9). The old workaround (the cars' sort boxes stretched along the track in rail.js) made cars of the same train reach into each other.

## What is implemented (engine/render.js; every rule is explained above its code)

**Rules for a pair with a vehicle or train car in it** (`behindLong`; entities with `isVehicle` or `vb`):
- a TREE (any placed object whose picture hangs over its sort box by more than 0.3: crown over trunk) and a vehicle: the SIDE of the vehicle the trunk stands on decides, near side in front, far side
  behind, all along the vehicle and past its ends until the crown has cleared the end; only then the end decides, and by then the two no longer touch. No jump during the pass.
- two vehicles that lie the same way in different lanes: the nearer lane is in front, whoever is further along (lanes are closer than a car is wide, the boxes overlap sideways; passing cars flipped).
- beside each other on screen (behind along x, in front along y): the larger gap decides = the two facing corners are compared (right for thin upright things: people, posts; no jump at the ends).
- one wholly above the other and apart on the ground in the other sense (train and the next slab; car under the viaduct and the train over it): the upper one is drawn later.
- boxes that reach into each other: the axis along which they are least far in decides (somebody at the kerb touching the bus by a hair); something flat on the ground (a plane's shadow) is under what
  stands in it; two train cars at a right angle (corner of the line): a fixed order where one arm runs towards the camera and one away.
- `e.thru` (train cars): drawn over what stands in its path. For two trees of the city that reach up through the viaduct (see "not fixed").

**For a pair of a person (anything else that moves) and anything:** only the "beside each other" case changed: larger gap instead of centres (a person walking past the end of a counter / fence no longer flips at
the middle of it), and a flat entity is under what stands in it. **Two placed objects: unchanged**, so the static world is drawn as before.

**Outlines instead of rectangles** (`pairMiss`): a placed object and a long entity carry the six-sided outline of their painted box on screen; two things are only linked if the outlines (or an outline and the
other's own-pixel box) touch. Exact: sprites are painted inside their boxes (checked: of 3799 city sprites only the park dock and rowboats have pixels outside, by up to 7 px; no vehicle or train car has).
Removes thousands of links between things that cannot touch; a pair that does touch keeps its link, so in a frame without contradictions the picture is the same.

**Links have a weight** (`SOFT`): 0 hard (one box can really cover the other), 1 soft with a mover in it (the two cannot cover each other, the order is for what hangs over the boxes), 2 soft between two
placed objects (the old centre rule). If the sort had to drop a link that is not of the weakest kind in a loop that has a mover in it, the frame is sorted again without the weakest links, starting from the
order just found, and if a hard link is still dropped once more by the hard links alone (`resort`). A weaker link never undoes a stronger one. Loops among placed objects alone are left exactly as they were.

**rail.js:** cars keep their real box for sorting (no stretching; `?occl=old` keeps it), stand 0.5 higher for sorting only (`SORT_UP`; the picture does not move), and carry `vb` (the box they are painted in,
for the outline) and `thru`.

**Test hooks** on `G.renderer`: `sortCycles(hard)`, `sortWhy(a, b)`, `resorts`. `sortCheck()` (perf --verify) compares against a plain-form copy of the same algorithm (`sortItemsRef`).

## Measurements (tools/occl_check.mjs; built game, the game's own frame() stepped at 60 Hz, every frame checked)

pops = a pair (vehicle / train car + anything) whose order flipped between two frames while the two sprites share at least 4 pixels; px = shared pixels added up. wrong = one box can cover the other and the
nearer one was not drawn later. hard loops = frames x groups of hard links that contradict each other. "old" = the same final build with `?occl=old` (stage 101 gives the same picture: 413 / 295 pops).

| staged cases (1170x900, zoom 3) | pops old -> new | px old -> new | wrong old -> new | hard loops old -> new |
|---|---|---|---|---|
| day, 12 cases | 406 -> 19 | 478 000 -> 10 600 | 1402 -> 0 | 3516 -> 0 |
| night (22:00), 12 cases | 303 -> 21 | 415 000 -> 1 500 | 3061 -> 0 | 2820 -> 0 |

Cases: a bus along streets with trees on both sides in all four directions (x+, x-, y+, y-), a truck (x+, y-), a fire engine (y+), a bus through a turn, a real bus at the busiest stop (shelter, people), two
trains meeting at Central and on the open viaduct, a train over a road with traffic. Buses / trucks against trees and street furniture on plain streets: 0 pops, day and night.

| 3-minute free-camera watch, phone view 390x844, 10 800 frames each | pops old -> new, day | pops old -> new, night |
|---|---|---|
| Harbor station and the street under the viaduct (110,308) | 1410 -> 22 (4.0 M px -> 3 300) | 899 -> 7 |
| City Hall Plaza (222,228) | 131 -> 44 (28 000 px -> 4 700) | 76 -> 4 |
| Central Station forecourt (213,311) | 225 -> 8 (587 000 px -> 530) | 230 -> 9 |

What the remaining pops are (all listed in `out/occl/final*/result_*.json` with the reason from `sortWhy`): a pedestrian walking THROUGH a standing car (the person is inside the car's box; flips at the
middle, 50-180 px, was there before), a vehicle against a street sign / signal at the instant it turns at a junction (its sprite changes heading in the same frame), pigeons on the road edge under passing
cars, train cars at a corner of the line (below).

Frame time (must not cost): `tools/perf.mjs`, 4x CPU throttle, 390x844 dpr 2, 3 runs, the same build with `?occl=old` vs new: walk 55.7 -> 56.8 fps (JS p50 6.2 -> 6.4 ms), night_plaza 48.7 -> 45.9 fps
(11.5 -> 12.8 ms) in one session and 52.0 -> 50.8 (9.6 -> 9.6) against stage 101 in another: inside the run-to-run spread of this shared machine. The item stage alone (list + sort + draws, 900 identical
frames, 4x throttle, median of 3, old -> new ms): plaza day 5.34 -> 5.35, plaza night 3.18 -> 3.52, harbor day 3.63 -> 3.93, harbor night 2.41 -> 2.56, central day 4.00 -> 4.28,
central night 2.13 -> 2.19. So there IS a small cost: 0 to +0.3 ms per frame at 4x throttle (single runs spread by +-0.4), i.e. under 0.1 ms on an unthrottled core; it is the outline tests and, where trains or
buses are in a loop, the second sort (`resorts`: 1 to 40% of frames at these places). Size: +6.3 KB minified (render.js 33.1 -> 39.2 KB incl. ~1.5 KB of test hooks, rail.js +0.2 KB).

Other checks on the final build: `node src/data/validate.mjs` OK; build OK; lookbehind grep 0; `perf.mjs --verify` OK (same pixels; draw order vs the plain-form sort 738 frames 0 differ; 6 rooms 0 differ);
`nightcheck.mjs` all checks passed (the night light still follows the draw order; static world [2] 0 px); `traffic_check.mjs --plan quick` 0 page errors, no gridlock, numbers as before;
`navcheck.mjs --rooms all` all passed, 0 page errors. Zero page errors in every occl_check run.
(`nightcheck --before <build>` step [1] fails even when a build is compared with itself: that step of the tool is broken since trees are lit as a whole; not related.)

## Pictures (out/occl/, not in git; regenerate with the commands below)

`final/` new, `final_old/` the same build with `?occl=old`, `before/` stage 101, `final_watch/` + `before_watch/` the watches (a frame every 3 s + a strip of 8 frames around the first ten pops).
Looked at, full size, frame by frame: before/bus_xp_day (the near-side cherry goes behind the bus in row 4) vs final bus_xp_day (stays in front; far-side cypress behind; lamps, people right);
bus_yp_day (big crowns both sides, bus under the viaduct); bus_stop_day (bus pulling in under the far-side maple, shelter, people); before/trains_viaduct_day (slabs over the cars) vs new (clean in all 40
frames); trains_viaduct_night; train_over_road_night; trains_central_day (before); bus_corner_day; watch_harbor_day. NOT looked at one by one: the other night strips and the plaza / central watch strips
(their numbers are in the tables).

    node tools/occl_check.mjs --cases list
    node tools/occl_check.mjs --out final [--hour 22] [--query "?occl=old"]                       # the 12 staged cases
    node tools/occl_check.mjs --out w --cases watch_harbor,watch_plaza,watch_central --w 390 --h 844 [--hour 22]

## NOT fixed

- **Train cars at a corner of the line**: the cars are straight sprites, at a right-angle corner the leading car has turned and the next has not, their boxes (and pictures) cross for ~2 units of travel and
  the order has to flip once (about 1000 px, twice per train per corner). Needs art: a bend in the track or a car picture for the corner.
- **Two trees stand in the train's path and reach up through the viaduct**: poplar at (54.5,121.5) and birch at (270.5,121.5), tops at 9.6-9.7, deck at 8. The train is now simply drawn over them
  (`thru`); they should be moved or shortened (src/world, not my files).
- **A tree is one sprite**: on the far side of a bus the bus cuts the crown at its outline (a crown that hangs over the roof should show over it); right would need trunk and crown as two pieces.
- **Harbor station**: a truck under the platform next to the lift tower is a real three-way contradiction of hard links (platform over truck, lift in front of platform, truck in front of lift by x):
  hard loops left in the watches: Harbor 25 (day) / 48 (night) of 10 800 frames, Plaza 6 / 2, Central 0; they were 12 417 / 11 055, 517 / 185, 6 054 / 5 166. Masts and railings that are part of a deck slab's picture are drawn under the train even where they stand on the near side.
- People walking through standing cars, pigeons under cars (simulation, not the sort).
- The bus_corner case sits behind tall harbour buildings (little to see in its strip); turning vehicles are covered by the plaza watch.
