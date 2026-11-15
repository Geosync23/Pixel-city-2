# QA round 13 (Opus QA lane, 2026-11-15): number legibility, small fixes, the train made worth taking, bus skip, relationships by hand

**Setup.** Round 12's driver copied to `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/r13/` (`srv.mjs` on port 7843, now serving the **dist build** by default: `BASE=dist/index.html`, `DPR` env for the device pixel ratio; clock frozen between requests). New helpers in `r13.js`: `TAPNPC`, `BTN` / `TAPB` (tap a visible button by its text), `DLG` / `DSTEP` / `CHOOSE` (dialogue sheet by touch), `RIDE`; `numinv.js` (`NUMINV()`: every visible text with a digit, with its computed size / weight / selector); `trainprobe.js` + `tp.sh` (the ten-trip table); `sheets.mjs` (the font comparison sheets), `grid.mjs` / `grid2.mjs` / `crisp.mjs` / `woff2.mjs` (font analysis), `artba.mjs` (draws the dock and gazebo and reports throws). Saves (new): `r13_d19_datebooked`, `r13_d20_afterdate`, `r13_d20_railyard`, `r13_d20_harborside`, `r13_d21_together`, `r13_d27_h2pinned`, `r13_d27_h2done`.
**What "played" means.** As round 12: "touch" = `touchscreen.tap` at a point read off the screen (or a CDP touch drag); "API" = a direct call, named; "clock" = `G.state.t` set by the driver; "teleport" = player position set by the driver. Every API / clock / teleport step is named below.
**Checks (final).** `node src/data/validate.mjs` passes; `node tools/build.mjs` passes (14,336 KB); `node tools/jobs_check.mjs` passes; `node tools/rel_check.mjs` passes; `node tools/perf.mjs --verify` **VERIFY OK: same pixels** (3,776 city sprites, 0 differ; "0 whose art throws": the dock and gazebo no longer throw); `node tools/navcheck.mjs --rooms all` (final, after every change incl. the clock audit): **all passed**; its "16 page errors" are all the Chrome *warning* "Canvas2D: Multiple readback operations using getImageData are faster with willReadFrequently" (new since round 12; `getImageData` is in `engine/render.js` / `sprites.js`, the seating worker's files; not an exception). A first full run had 1 FAIL ("Appointment with a friend in a cafe") caused by my first navgoals fix; corrected and re-run. Zero page errors in every play session (dist logs a few `404` resource loads at boot, harmless, not new).

---

## Part A: number legibility (the owner decides; everything is behind one switch, default = today's look)

### A.1 Why the digits misread
The font is **Pixelify Sans**, a *variable* font (`wght` 400-700, one file; licence OFL, `assets/font-LICENSE.txt`), units-per-em 1000, ascender 920 / descender -280. Parsed from the woff2 (`woff2.mjs`) and measured by rendering every digit at 1000 px (`grid.mjs`, `grid2.mjs`):
1. **The glyph design is the main cause.** The digits are drawn on a 5 x 7 grid of ~91-93 units ("design pixel" ~0.092 em) with **half-pixel steps**. The **2** has an upper-left stem and a closed-looking middle; **3** has hooks at upper-left and lower-left; **5** is S-shaped with a top-right hook; so **2, 3 and 5 share the outline of 8** and differ from it only by one design pixel (a 2's missing lower-right stroke, a 5's missing lower-left...). The **7**'s bar is short, so 17 reads 11. At 1000 px it is legible; at 12-19 px one design pixel is 1.1-1.75 CSS px and the tell-tale gap is a smear (`r13_font_glyphs.png`).
2. **Bold makes it worse, and it is real bold, not synthetic.** `font-weight:700` moves the `wght` axis: every stroke grows by ~0.4 design pixel (edges move 39-51 units), so a one-pixel gap shrinks to ~0.55 pixel. The HUD asks for **900**; in Chromium that renders identically to 700 (`w900.mjs`: pixels equal, no synthetic bold). Safari (the owner's phone) was not available here (no WebKit in the container): **not verified** whether it adds synthetic bold at 900.
3. **"Integer multiples of the design size" do not help this font.** The outlines are not on a clean grid (91-93 unit pixels, 10-unit slivers at stroke joins: X edges at 60/151/161/241/251/333/343/423/433/525), so no font size renders crisply. `crisp.mjs` measured the share of anti-aliased ink pixels for sizes 10-24 px in 0.5 steps at dpr 1/2/3: it falls smoothly with size (dpr 2, weight 400: 0.73 at 10 px -> 0.37 at 24 px) with **no dip at 11 / 22 px** (the would-be integer sizes). That part of option (a) is therefore not worth a layout change and is not implemented.
4. dpr 2-3 does not rescue it: at dpr 3, regular weight, `$241.50` still reads `$241.80` (`r13_font_a_dpr3`, top rows) and the weather row's `27° / 15°` reads `27° / 18°` (`r13_font_all_planner`).
Pixelify has no stylistic alternates or `tnum` (GSUB: ccmp, frac, liga, locl only); its digits all advance 586 units (700: 603) **except the 1** (404 / 426), so `tabular-nums` does nothing with it today.

### A.2 Where the game shows numbers that matter (dist build, 390 x 844; `NUMINV()` on each screen + what I saw while playing)
| where | example | size / weight | selector |
|---|---|---|---|
| HUD money chip | `$241.50` | 17 px / **900** (= 700), tabular asked | `.hud-money b` |
| HUD clock | `17:15` | 17 px / 900 (19 px wide screens) | `.hud-clock` |
| HUD date, speed buttons, phone badge | `Sun · Spring 14`, `4x`, `83` | 12 px / 600-700 | `.hud-date`, `.hud-speed button`, `.hud-badge` |
| phone status bar (round 12 set it to 16 px) | `17:19 Sun`, `17°`, `$241.50` | 16 px / 700 | `.ph-st-clock`, `.ph-st-money` |
| phone home widget clock | `17:24` | 30 px / 900 | `.ph-w-clock` |
| Bay Bank balance | `$241.50` | 34 px / 700 | `.ph-big` |
| bank in / out, bills, total | `+$475.50`, `$160`, `$20`, `$188` | 15-16 px / 700 | `.ph-kv b` |
| bill due chip | `TOMORROW 08:00` | 13 px / 700 | `.ph-chip` |
| My Day (planner) times | `21:00`, `4 h`, `Now 17:19`, `3 h 45 min free` | 10.8-13 px / 700-900 | `.ph-row-r`, `.ph-nowline b`, `.ph-gap b` |
| weather forecast | `18° / 9°`, `27° / 15°` | 13 px / 700 | `.ph-fc span` |
| MapleCab fares / quick picks | `$18`, `$23.75` | 13 px / 700 | `.ph-row-r` |
| route card ("How will you get there?") | `BUS · 29 min · $1.50`, `next in 13 min` | 13-15 px / 700 | `.ph-row` text |
| Jobs app wage | `$14 / hour` | 15 px / 700 | `.ph-kv b` |
| job board pay + hours | `$13/h + tips`, `07:00-13:00` | 15 px / 700; 12 px / 400 | `.jb-pay`, `.jb-when` |
| ZipEats fees | `$4 delivery + 15% service · 30-45 min` | 13 px / 400 | `.ph-hero small` |
| Wellness need values | `Fine · 64` | 11.7 px / 500 | `.ph-need small` |
| shop / order-for-two prices (Bean & Gone) | `$4.50`, `$3.50` read `$4.80`, `$3.80` | 13 px / 700 | `.shop-price`, order sheet |
| home listing card | `$150 / week` read `$180` | 15 px / 700 (red) | furnish card |
| canvas Map labels | street / place names | 12 px / 700 canvas | `phone_map.js` (draws with its own font string: **not covered by the switch**) |

### A.3 The options, all behind ONE switch
**The switch:** the `data-num` attribute on `<html>`, set by the new module `src/ui/numfont.js`. API `G.numFont.set('' | 'a' | 'b' | 'c' | 'd')` (remembered per device in `localStorage 'maplebay.num'`), `G.numFont.get()`, URL `?num=a|b|c|d|pixel`. **Default `''` = today's look; nothing changes until the lead flips it.** How: a `unicode-range: U+0030-0039` face is put in front of "Pixelify Sans" in `body`'s font-family (plus `.bk-note` and the navigator's trip bar, which name the font themselves), so **only the ten digits change; words, `$`, `:`, `.` stay in the pixel font**; no markup was touched. The faces are created with the `FontFace` API only when a mode is chosen (zero cost by default). `:root[data-num] body` also gets `font-variant-numeric: tabular-nums` and `font-synthesis-weight: none` (so the browser never fakes a bolder digit).
- **(a) Pixelify digits, never bold**: the same font's digits at weight 400 in every context. *Result: barely better.* At dpr 2 and 3 `$241.50` still reads `$241.80` and `17:03` still reads `11:03` (`r13_font_a_dpr2.png`, `r13_font_a_dpr3.png`). Strings get ~1.5 px narrower (HUD money chip 105.2 -> 103.7 px); heights unchanged.
- **(b) = (a) + money and time 12% larger**: a second face of the same digits with `size-adjust: 112%` and the ascent / descent overridden so line heights do not move, applied to the HUD money and clock, status bar, bank, `.ph-kv`, `.ph-row-r`, shop prices, the phone clock widget, My Day's now-line. *Result: slightly easier, still the same misreads* (`r13_font_b_dpr2.png`, `_dpr3`). Layout: those strings ~6% wider (HUD money chip 105.2 -> 109.2 px, status-bar money 58.6 -> 62.3, bank lines 67 -> 71); heights unchanged.
- **(c) the phone's own UI font for digits**: `local("Roboto")`, Helvetica Neue, Arial, Segoe UI, Inter, Liberation Sans, DejaVu Sans (regular 100-550, bold 551-1000), tabular figures. *Result: unmistakable at every size and dpr* (`r13_font_c_dpr2.png`, `_dpr3`), but the digits are visibly a different, smooth typeface next to pixel letters. Layout: ~7% wider (HUD chip 112.4 px, status-bar money 65.4, bank 70.3). **Risk:** iPhone Safari may refuse `local()` for system fonts; if no face loads the module falls back to (d) by itself (console warning), so it never breaks. Tested here with Inter / Liberation (Linux).
- **(d) pixel digits drawn for legibility** (my addition): a tiny digit-only TrueType pair generated by `tools/numfont_gen.mjs` into `src/ui/_numfont_data.js` (5.5 KB): **5 x 7 regular with one-pixel strokes, 6 x 7 bold with two-pixel verticals**, classic distinct shapes (a 2 with a diagonal, a flat-topped 3 open on the left, a 5 with a straight top, a 7 with a full bar), the same advance widths as Pixelify (586 / 603, the 1 narrow 404 / 426), the same ascent / descent. *Result: unmistakable at dpr 2 and 3 and still pixel art* (`r13_font_d_dpr2.png`, `r13_font_d_dpr3.png`; even at dpr 1, `r13_t_d_bank.png`). Layout: **no height change; widths within 0.5 px** (HUD chip 105.2 -> 105.7; status-bar money 58.6 -> 59.0; bank lines 67 -> 67; the remainder is Pixelify's kerning, which does not apply across two fonts).
Sheets: `out/shots/r13_font_{a,b,c,d}_dpr{2,3}.png` (rows: HUD, My Day top, My Day agenda, Bay Bank, job board card, MapleCab; columns: today | option, each 1:1 in device pixels), `r13_font_all_planner.png` (today / a / b / c / d side by side at dpr 3), `r13_font_sizes_dpr{2,3}.png` (sizes 12-18 at 400 / 700 and the system font), `r13_font_glyphs.png` (the glyphs at 150 px).
**Recommendation: (d).** It is the only option that both fixes the misreads and keeps the pixel look, and it shifts no layout. (c) is the fallback if the owner prefers plain phone digits. (a) and (b) do not fix the problem. I did **not** make any option the default ((a) is not strictly better). To make (d) the default: `apply(m)` in `numfont.js` gets `m || 'd'` where the stored value is empty (one line), or the lead adds a Settings row ("Numbers: Pixel / Clear pixel / Phone font") calling `G.numFont.set` (`phone_settings.js` is outside my brief's safe area for the sound row only; I did not add it).

## Part B: fixes
1. **Continue from a lobby** (`src/ui/title.js` `cont()`): saved in the lobby of the building you live in -> you continue in that lobby, where you stood (as round 9 did for the flat). **By touch**: round 12's `j_d1_lobby` save, title -> Continue -> Juniper Court lobby at the stairs (`r13_b1_cont_lobby.png`), then "Exit to the street" by tap -> the street.
2. **`prop.park.dock` / `prop.park.gazebo`** (`src/art/props/park.js`). Reproduced with `artba.mjs` (draws them like the city does): the dock placed in `world/_places.js` with `{ len: 4, boat: true }` threw `h.slice is not a function` (the boat colour was `true`) and lost its rowboat; **all three gazebo variants threw on their first line** (`cyl` given `PAT.stone` functions as side colours, the fountain's old bug), so **every gazebo in the city drew nothing at all**: the Maplewood Park gazebo and the bandstand (the busker "Bandstand" spot) were invisible. Fixed: the boat takes a colour or `true` (red), the gazebo's base takes plain colours. Before / after: `r13_b2_art_before.png` (dock without boat, no gazebos), `r13_b2_art_after.png` (dock with boat, three gazebos). In the city: `r13_b2_gazebo_city.png` (the bandstand now stands at (124,148); **big park trees cover much of it from the south-west**; worth a look by the art owner). `perf.mjs --verify` passes; those sprites differ from before **by design** (they now draw).
3. **Prebake hooks** (performance report's patch): `sim/rail.js` (train cars, `prebakeAsset`), `sim/_crowd_animals.js` (`prebakePix`, same key and drawing as `sprite()`), `sim/planes.js` (`args()` shared by `sprite()` and the new `prebake()`). Applied cleanly. `node tools/perf.mjs --scenes train,walk --runs 3 --html before,after` (`out/perf/r13_prebake.md`): train 59.7 / 59.4 fps, JS worst 112 -> 89 ms; walk 55.3 / 55.4 fps, JS worst 46 / 48 ms: **no regression** (differences are within run-to-run noise). Note: in this tree the `walk` scene shows 7-8 hitches >100 ms in BOTH builds (the performance worker's final build had 0): something added since then (not the hooks) is worth a profile.
4. **Residents-only lobbies** (lead decision): the street door of the nine new apartment lobbies still opens the listing card for a non-resident, and the card now starts: "Residents only: the lobby of Saltbox Lofts is for the people who live here. Loft 2 is to let: here is its listing." / "... Apt 1407 is not on the market yet." (`src/ui/furnish.js showCard`; only those nine, only with the lobby route). **By touch** at Saltbox Lofts and Meridian (teleported to the doors, door tapped): `r13_b4_card_saltbox.png`, `r13_b4_card_meridian.png`. Reads right. (The same card shows `$150 / week` so that it reads `$180`: Part A.)

## Part B+ (lead's mid-round items)
### The train made worth taking (owner msgs 131, 133)
**Where the time went** (measured with `G.nav.routeTo(p, from, { all: true })` at 12:00, day 20):
- **Headway**: `NSETS 4` trains per direction on a **163-minute** loop = a train every ~41 min each way; the average wait was 18-24 min (up to 38).
- **Ride**: `V = 10` u per game minute (2.2x walking) plus **`DWELL = 6` min at every station**: one stop cost ~13 min, Old Town -> Airport 93 min.
- **The walk to the station from downtown is real**: City Hall's streets (220,225) are ~100 u from both Central (213,323) and Arts Quarter (219,132): 20-22 min on foot. Station choice was correct (the two nearest at each end, best total); downtown simply has no station.
- **Bug**: `trainOption(from, D, dist)` was called with the distance in units where its parameter `walk` is minutes, so its `wa + wb > walk * .8` cut never fired. The call now passes minutes; per the owner's rule (msg 133, lead) **the cut is removed** and the train is always listed when a plan exists.
- "next in N min" on the route card is the departure of the train you will catch, counted from now (it includes the walk to the station); kept, as the bus line reads the same.
**Tuning** (`src/sim/rail.js`): `V 10 -> 26`, `ACC 1.5 -> 1`, `DWELL 6 -> 4`, `NSETS 4 -> 9`: an **80-minute loop, a train every ~9 min each way**, ~5.6x walking speed between stations. (I first tried DWELL 2.5: the doors were open only ~1.2 game min, and on a real ride by touch I **missed my stop** walking to the door; DWELL 4 gives ~2.7 game min.) Late-evening headways are not varied: the timetable is a closed formula of the clock; thinning it at night would make trains pop in and out of view; not done. The station panel now says "about N min **on board**" including the train's stop at your station (it said 5 for a ride that took 9).
**Ten trips, before / after** (walk / bus / train / cab, game minutes; bus times move with the live buses; measured BEFORE the owner's clock change of msg 142: walk and bus quotes are now ~15% lower, train minutes unchanged, see Part D):
| from downtown (220,225) | before | after |
|---|---|---|
| Nana's House | 42 / 38 / 75 / 19 | 42 / 36 / 50 / 19 |
| The Sail Loft | 44 / 41 / 58 / 19 | 44 / 39 / 37 / 19 |
| Maple Bay Symphony Hall | 43 / 41 / 94 / 19 | 43 / 40 / 70 / 19 |
| Harbor Tea & Spice | 28 / - / 73 / 18 | 28 / - / 53 / 18 |
| Atelier Nord | 51 / 35 / 63 / 21 | 51 / 34 / 39 / 21 |
| Airport Station | 45 / 36 / 57 / 22 | 45 / 36 / 30 / 22 |
| Maplewood Elementary | 23 / - / 78 / 16 | 23 / - / 52 / 16 |
| Old Town Market | 33 / 39 / 69 / 16 | 33 / 37 / 48 / 16 |
| Hillcrest Station | 49 / 39 / 54 / 26 | 49 / 38 / 30 / 26 |
| Railyard Station | 43 / 26 / 54 / 24 | 43 / 30 / 34 / 24 |

| from beside Old Town Station (38,250) | before | after |
|---|---|---|
| Nana's House | 7 / - / 35 / 10 | 7 / - / 35 / 10 |
| The Sail Loft | 30 / 24 / 18 / 15 | 30 / 17 / 18 / 15 |
| Maple Bay Symphony Hall | 76 / 58 / 98 / 31 | 76 / 51 / 43 / 31 |
| Harbor Tea & Spice | 62 / 38 / 43 / 25 | 62 / 31 / 33 / 25 |
| Atelier Nord | 44 / 51 / 66 / 24 | 44 / 44 / 19 / 24 |
| Airport Station | 90 / 53 / 95 / 34 | 90 / 46 / 30 / 34 |
| Maplewood Elementary | 68 / 45 / 88 / 28 | 68 / 38 / 52 / 28 |
| Old Town Market | 13 / - / 29 / 13 | 13 / - / 29 / 13 |
| Hillcrest Station | 35 / 60 / 57 / 21 | 35 / 53 / 10 / 21 |
| Railyard Station | 77 / 42 / 54 / 33 | 77 / 35 / 34 / 33 |
With a station a few minutes away at both ends the train is now a third to a half of the walk (Hillcrest 35 -> 10, Airport 90 -> 30, Atelier Nord 44 -> 19). From downtown it still loses on short trips: the 20-minute walk to a station is the city's geography. Where it is a bad idea (Nana's House from next door: 7 vs 35) it is listed with its true time, as the owner asked; it is not moved to the end of the list (the lead said that is optional).
**Quote vs actual, two real rides by touch** (Map > Search > place > TRAIN row; tap the station; buy ticket; Wait on platform):
- Railyard -> Harborside (on a Map trip to Old Town Market), **skipped**: card at 13:03 said train 37 (next in 8, 2 stops, walk 14 at the end) -> boarded 13:09 ("Boarding now"), Skip ahead -> got off on Harborside's street at 13:30: **27 min to the platform vs 23 quoted** (37 - 14): the skip lands 0.9 min after arrival plus the door walk; the rest is the train's remaining stop at Railyard.
- Harborside -> Old Town, **not skipped**: panel said "Train in 4 min", ride about 5 (now "about 9 on board"); doors opened 13:45, "Get off here" by touch, arrived 13:48: on time against the new wording.
- First attempt (DWELL 2.5) at Harborside: the door tap came too late, "Missed your stop: get off at the next station" (the reason DWELL went back up to 4).
**Perf**: more trains = more cars to place. `perf.mjs --scenes train,walk` before vs. after (`out/perf/r13_rail.md`, 8 sets, DWELL 2.5): train 59.1 / 59.1 fps; walk 54.7 -> 52.3 fps, >100 ms hitches 7 -> 10. A second run with the final constants (9 sets, DWELL 4; 4 runs each, `out/perf/r13_rail2.md`): **walk 54.8 / 55.4 fps, >100 ms 9 / 8; train 59.5 / 59.4 fps, JS worst 110 / 94 ms: no regression**; the first run's walk dip was noise.

### Skip the bus ride (owner msg 134)
`src/sim/transit.js`: the bus ride HUD has **"Skip ride"** next to "Choose stop" (`G.transit.skipBus()`). It fades, advances the clock with `G.advance` (so needs and the hour / day events tick for the skipped time) by the rest of the ride **at the navigator's own bus model** (distance along the loop to your stop / 20 u per game minute + 0.6 min per stop passed, = navigator.js `BUS_V` / `BUS_DWELL`), and gets you off at your stop through the normal `alight()` (fare already paid at boarding, speed restored, `ride:end`, the Map trip moves to its walking leg). **Which stop:** the stop you chose with "Choose stop"; else the Map trip's stop; else (a loop bus has no end of the line) it asks "Get off at..." first. Works at any game speed (a bus ride runs its own clock and restores yours). `src/sim/traffic.js` exports `busU` (the ridden bus's place on its loop).
**By touch**: downtown -> Railyard Station by Map > BUS (card: 29 min, next in 13, 2 stops), walked to Main St & 3rd Ave, "Wait for bus 2 (your trip)", boarded 12:20, **Skip ride** -> off at Harbor Blvd & Aspen St at 12:31 (**10.4 game min skipped vs ~9 quoted for the ride**), trip stage 2, arrow "Railyard Station · 370 m", walked the last leg by taps: "You have arrived: Railyard Station" (`r13_bus_2.png`, `r13_bus_3.png`). My walk to the stop took 19 game min against the quoted 7 (my harness stops between taps), so the door-to-door total is not a fair comparison; the ride itself matches within ~1.5 min.
**The train already had "Skip ahead"** (`scenes/trainride.js`). One change: skipping ahead now arms getting off (you land at your stop and step out when the doors open), so a skip always ends on the destination platform; on the Map trip above it put me on Harborside's street with the trip at stage 2 and the arrow "Old Town Market · 1.0 km" (`r13_train_6.png`). The last walk after the train was not walked to the end.
**A bus ride without skipping: not re-run** (my harness failed to open the stop panel on the second attempt and waited 90 game minutes; time). The bus's non-skip code is unchanged except that "Choose stop" now calls a shared `pickStop()` with the same list.

## Part C: still never played by hand
**Relationships** (round 12's day-19 save, Felix at Dating, warmth 28):
- **Talk sheet at Dating, by touch** (library, Saturday): the context verbs were *Ask: "How's Mrs. Moss's music box?"* (a sensible answer, warmth +2), *Ask on a date* (the date picker: 15 types with ★ for his favourites -> place -> three times tomorrow -> "Yes. Before you change your mind: yes."), *Kiss* ("It is brief and it is exactly right.", +1, then gone for the day), *Say you would rather be friends*; on day 21 also *Ask where this is going*. The general verbs (Chat, Tell a joke, Compliment, Ask about their day, Gossip, Give a gift, Invite to hang out, Flirt, Say goodbye) all answered in character (`r13_c_verbs_dating.png`). **Friend-level verbs: not reached** (no Friend-only person was in reach).
- **A kind let-down, by touch, but not of a second match**: a tap meant to move his greeting on landed on **"Say you would rather be friends"** (the verb list appears under the text box) and the let-down ran with **no "Are you sure?"**: three wordings, I chose the first, "Thank you for telling me in words", "The lamp's still under guarantee. Unofficially. For life.", stage none (`r13_c_letdown1/2`). **Fixed**: the verb now asks "Are you sure? ... This cannot be taken back today." like "End things, kindly" (`_rel_verbs.js`, `_rel_life.js endIt(id, how, { ask })`). (The automatic let-down of other matches at Together keeps no question.) The let-down of a second match at Together: **not run** (no second person was dating).
- **Dating -> Together, by touch** (save reloaded): a coffee date booked by touch at Bean & Gone (Sunday 11:00; "Order for two", Maple Latte + Hot Chocolate, My treat, every line and one choice by touch; warmth 33 -> 40); next morning (clock to day 21 10:40, teleported to Nest & Wire's door) door, Felix, **"Ask where this is going"** -> the "steady" scene (the folded list, "I'd like us to be a fixed thing ... Set.", choice "What was item two?") -> **Together** (warmth 45; `r13_c_steady1`).
- **A heart scene after it, by touch**: heart 2 "Find It" needs 4 days after Together; the governor had not offered it by day 27 (clock skips to days 25-27), so the invitation was sent with `G.rel.debug.invite('felix.h2')` (API). Then by touch: My Day > Add > Take me there > Walk (teleported near the University, walked in by taps), waited, the rose card at 11:30, Begin, every line, the choice "press your knee against Felix's", done; warmth 54 (`r13_c_h2_8`, `r13_c_h2_end`).
- **Found and fixed** (`src/sim/navgoals.js`): with that meeting on My Day, inside Nest & Wire the arrow said **"Felix, Maple Bay University: Felix is on the way, wait here"** 5 km from the University (`r13_c_h2_5`). Now, away from the meeting place and with them not in sight, the 'meet' goal steps aside and the place arrow leads ("Exit → Felix", then "Maple Bay University · 4.0 km"). Re-tested by touch in the shop.
- **Two more friend-arc and two family-arc scenes: not run** (time; `nana.jam` was on offer the whole time).
**Jobs**:
- **A missed shift on a played day** (round 12's radio save, clock running at 4x from 17:11, nothing skipped, the player idle in town): 20:11 "Leave now", 20:30 "In 30 min", 21:00 "Starting now", 21:21 toast "Your shift at Bay Radio 98.6 began at 21:00. You can still clock in until 00:40; after that it counts as missed.", **01:02** "You missed today's shift at Bay Radio 98.6. It happens. It counts as a warning (1 of 3 before they must let you go); the next one is Mon at 21:00." (`r13_c_missed`). Clear and true; the "missed" line comes 22 min after the 00:40 it named.
- **A play ticket played fully by hand on two jobs, the radio's held "hold to talk", a promotion: not run** (the lead's train / bus items took the time).


## Part D: the clock change audit (owner msg 142: `G.CLOCK = .85` in `src/core/game.js`, lead's change)
At 1x one real second is now 0.85 game minutes on the free-running clock (`gm = dt * speed * CLOCK`); activities (`G.busy`) keep their own `rate`; a cab ride owns the clock. Anything that moves in real time (the player, citizens, cars, buses on screen) now covers the same ground in 15% fewer game minutes. Method: grep of `src` for `G.state.speed`, `-= dt` / `+= dt` timers, `rate:`, `CLOCK`, `performance.now` / `Date.now`, distance -> minutes conversions (`WALK`, `/ 3.8`, `/ 3.1`, vehicle speeds), "in N min" / "N min walk" strings, then a measurement where it was cheap. G.CLOCK is only set on the first frame, so every use below reads `(G.CLOCK || .85)`.
| file:line | what it assumes | breaks at 0.85? | done |
|---|---|---|---|
| `sim/navigator.js:26` `WALK .215`, `BUS_V 20`, `BUS_DWELL .6` | measured at 1 game min per real s | yes: walks quoted 18% long, ridden bus 15% long | **fixed**: `clockK()` rescales them on every `routeTo` (WALK x CLOCK, BUS_V / CLOCK, BUS_DWELL x CLOCK); `walkMinPerUnit()` exported |
| `sim/myday.js:42` `WALK .215` (Ideas "N min walk", need rows) | same | yes | **fixed** (x CLOCK) |
| `ui/_guide_quick.js:16` `WALK .215` | same | yes | **fixed** |
| `ui/phone_guide.js:17`, `ui/phone_store.js:15` `/ 3.8` | a walking pace (and an older, slower one: .26 min/u) | yes (was already 20% off) | **fixed**: the navigator's pace x CLOCK |
| `sim/planner.js:117` `/ 3.1` | fallback only when the navigator is missing | no (never used in play) | left |
| `sim/planner.js` "Leave now" = `travelTo()` -> `G.nav.routeTo` + `LEAD.buffer` 10 | the navigator's minutes | follows the navigator | fixed through it |
| `sim/traffic.js:144` `BUS_REAL_V 5.5` "u per game min at 1x" (ETA of an on-screen bus) | 1:1 | yes: buses in sight arrived 15% late on their ETA | **fixed** (/ CLOCK) |
| `sim/transit.js` waiting at a stop: activity `rate 1` when the bus is in sight | 1 game min per real s while the world moves in real time | yes: the bus "in 3 min" cost 3.5 | **fixed**: rate = CLOCK |
| `sim/transit.js` bus ride `BUS_CLOCK .2` (a speed) | the free clock | follows CLOCK (0.17 game min/s) | quotes rescaled above |
| `sim/transit.js` Skip ride (mine) | the navigator's bus model | yes | **fixed** (same CLOCK scaling) |
| `sim/transit.js:233-` cab pick-up: `hold` and the "late cab" checks compare **real seconds** (`pd.t`, `pd.hold -= dt`) with the quote in game minutes | 1:1 | yes: pick-ups came 15% early | **fixed** (quote / CLOCK in real s). Measured after: quote 6.0, cab "here" after **4.4** game min (it drives in faster than `CAB_CAR_V` assumes; was already so) |
| `sim/transit.js` cab ride `rideClock` | owns the clock | no | - |
| cab patience 80 s, `CAB_REACH` 20 s, hail 12 s | real-time patience | no (lead: fine) | - |
| `sim/rail.js` trains | positions are a formula of `G.state.t` (game time) | no: the timetable is exact; trains now look 15% slower on screen | - |
| `scenes/trainride.js` skip `G.advance(timeTo + .9)` | timetable | no | - |
| `sim/rail.js` waiting for a train: activity `rate max(2.5, wait/4.5)` | activity | no | - |
| `sim/jobs.js:43,121` `SHIFT_SPEED 2`, `COURIER_SPEED` set as `G.state.speed` | "a 6 h shift = 3 real minutes" | game time right (pay, clock-in / lateness windows are game minutes); a shift now takes **3.5 real minutes** | left (the owner asked for slower time); courier walking deadlines get 15% easier |
| `sim/intro_airport.js:17` `TUNE.CLOCK .12` as a speed | the intro's slow clock | now .102 game min/s: the airport takes 15% fewer game minutes | left; not measured (the intro's hand-off times are events, not clock times) |
| activities (`G.busy.rate`: sleep, showers, films `phone_reel.js:132`, reading / playing `data/media.js CLOCK`, aquarium, natatorium, job-room tasks) | their own rate | no: durations and progress bars unchanged | - |
| needs decay, moodlets, planner / chapter / class / show windows, shop hours, day-night, weather | game minutes | no (only slower in real time) | - |
| `-= dt` animation timers (mini-games, aquarium keepers, museum tours, `_show_life`, natatorium kids...) | real seconds, for animation | no | - |
| citizens / NPC routines walking to a venue on a game-time schedule | they walk in real time | they now arrive with 15% more game-minute slack: no visible problem | - |
| arena (`arena_bowl.js` own world-minute clock `st_.w`), observatory programmes, natatorium swim `SWIM.CLOCK` (stopwatch seconds) | their own clocks | no | - |
| game-speed buttons 1/2/4, dev 8/16 | multiply the free clock | all 15% slower in game time per real s | intended |
| first-time-window holds, toasts, banners, autosave, audio / music timers | real time | no | - |
| `tools/perf.mjs`, `tools/navcheck.mjs` | real seconds / arrow texts | navcheck all passed after the change (below); perf scenes are real-time | - |
| `tools/ambience_check.mjs` (not mine to touch) | real time | not run | - |
**Ten trips after the change, quote vs actual** (quotes from the route card at 1x; "actual" walked by the pathfinder (API `goTo`), rides by touch):
| trip (from downtown 220,226 unless said) | mode | quote | actual |
|---|---|---|---|
| Nana's House | walk | 36 | 37.5 |
| The Sail Loft | walk | 38 | 33.4 |
| Atelier Nord | walk | 44 | 37.6 |
| Harbor Tea & Spice | walk | 24 | 25.2 |
| Old Town Market | walk | 28 | 29.3 |
| Railyard Station (bus 2, no skip: walk 6, wait, ride, walk 6) | bus | 19 | 21.0 (at the stop 14.4 vs 13) |
| Railyard Station (bus 2, **Skip ride**, before the CLOCK fix) | bus | ride ~9 | 10.4 |
| Railyard -> Harborside (Map trip, **Skip ahead**) | train | 23 to the platform | 27 |
| Harborside -> Old Town (no skip) | train | 4 + 9 on board | doors 13:45, off 13:48 (on time) |
| cab pick-up near Old Town Market | cab | 6.0 | 4.4 |
(The walks before the change were quoted 42 / 44 / 51 / 28 / 33 for the same five: 15-20% too long.) Maplewood Elementary: the pathfinder found no path from that spot (a harness start point issue), not measured.
**A full ordinary game day by touch at 1x with a shift and a class or show: not run** (time). What was played by touch at the new clock: the bus trip above (no skip), the arrival / get-off flow, the Map route cards; the missed-shift day (Part C) was played before the clock change.

## Fixed (my files this round)
1. `src/ui/numfont.js` (new), `src/ui/_numfont_data.js` (new, generated), `tools/numfont_gen.mjs` (new): the number switch (Part A).
2. `src/ui/title.js`: Continue in your own lobby.
3. `src/art/props/park.js`: dock boat colour; gazebo base colours (they now draw).
4. `src/sim/rail.js`, `src/sim/_crowd_animals.js`, `src/sim/planes.js`: prebake hooks.
5. `src/ui/furnish.js`: "Residents only ..." line on the nine lobby doors' listing card.
6. `src/sim/rail.js`: timetable (V, ACC, DWELL, NSETS) and the station panel's "about N min on board"; `src/sim/navigator.js`: `trainOption` gets minutes, no "not worth it" cut for trains (owner rule); `src/scenes/trainride.js`: Skip ahead arms getting off.
7. `src/sim/transit.js` (+ `src/sim/traffic.js` exports `busU`): Skip ride on the bus.
8. `src/sim/_rel_verbs.js`, `src/sim/_rel_life.js`: "Say you would rather be friends" asks first.
9. `src/sim/navgoals.js`: no "wait here" for a meeting in a building that is not the meeting place (indoors only; the street's "Go in: X → Kit" stays: navcheck caught my first version).
10. Clock audit (Part D): `src/sim/navigator.js`, `src/sim/myday.js`, `src/ui/_guide_quick.js`, `src/ui/phone_guide.js`, `src/ui/phone_store.js`, `src/sim/traffic.js`, `src/sim/transit.js`.

## Patches for files I may not touch
None.

## Seen, not changed
- **Felix outside work** greets you with his shop line in the library ("Welcome to Nest & Wire. Um. Sofas left, wires right.", `story/cast.js` greetings `low`) and waves "I saw you from the lamp aisle" there; on a Saturday he says "I didn't say that. It's Thursday."; the coffee date opens "You are four minutes early" 25 minutes before the time; the "steady" verb's first reply on the sheet was his greeting line ("Last time we got onto that nice thing you said") under your "I've stopped wanting to see anyone else".
- "My Day · Good morning" banner at 11:40 listing the coffee date that had just ended.
- Milo's "this is milo. i drew you..." twice four days apart (lines from before round 11's no-repeat rule).
- In the train, at your stop the HUD's left button still reads "Get off at next stop" until the doors are half open (`r13_train_4`).
- The route card lists Nana's House by train (35 min) from 7 minutes' walk: true, per the owner's rule.
- The gazebo at (124,148) is largely hidden behind park trees from the usual camera angle.
- The canvas Map labels draw their own font and are outside the number switch.
- Tapping a text box to move a conversation on can land on a verb button when the verbs appear (fixed for the one irreversible verb only).

## Decisions for the owner
1. **Numbers**: today / (a) / (b) / (c) / (d) (sheets above). *Recommendation: (d), the clear pixel digits; (c) if you prefer your phone's own digits.*
2. **Trains at night**: one timetable all day (a train every ~9 min). Thinner late-night service would need a timetable rewrite. *Recommendation: keep.*
3. **More trains vs. smoothness**: 9 trains a direction costs a little frame time in the city (see perf). *Recommendation: keep 9 unless the owner's phone stutters; 6 is the fallback.*

## Not verified
A full game day by touch at the new clock; the intro at the new clock; Real phone, Safari (bold at 900, `local()` faces for option (c)), sound; Friend-level talk verbs; the let-down of a second match; two friend-arc and two family-arc scenes; a job play ticket by hand on two jobs and the held "hold to talk"; a promotion; a bus ride without skipping after the change; the last walking leg after the train skip; late-night train service; landscape.

## Files changed
`src/ui/numfont.js` (new), `src/ui/_numfont_data.js` (new), `tools/numfont_gen.mjs` (new), `src/ui/title.js`, `src/art/props/park.js`, `src/sim/rail.js`, `src/sim/_crowd_animals.js`, `src/sim/planes.js`, `src/ui/furnish.js`, `src/sim/navigator.js`, `src/sim/transit.js`, `src/sim/traffic.js`, `src/scenes/trainride.js`, `src/sim/_rel_verbs.js`, `src/sim/_rel_life.js`, `src/sim/navgoals.js`, `src/sim/myday.js`, `src/ui/_guide_quick.js`, `src/ui/phone_guide.js`, `src/ui/phone_store.js`, `docs/reports/qa_round13.md`. (`dist/index.html` rebuilt by the checks.)
Screenshots cited (all looked at): `out/shots/r13_font_glyphs, r13_font_sizes_dpr2, r13_font_a_dpr3 (top crop), r13_font_b_dpr2, r13_font_d_dpr3, r13_font_all_planner, r13_t_d_bank, r13_t_c_bank, r13_t_a_bank, r13_inv_bank, r13_inv_board, r13_inv_planner, r13_b1_cont_lobby, r13_b2_art_before, r13_b2_art_after, r13_b2_gazebo_city, r13_b2_dock_city, r13_b4_card_saltbox, r13_t_ot2, r13_t_ot3, r13_t_ot7, r13_t_ot9, r13_bus_map1..5, r13_bus_2, r13_bus_3, r13_train_1, r13_train_3, r13_train_4, r13_train_6 (via state), r13_c_lib1, r13_c_felix3..10, r13_c_verbs_dating, r13_c_cafe2, r13_c_cafe4, r13_c_steady1, r13_c_h2_1, r13_c_h2_5, r13_c_h2_8, r13_c_h2_ch`.
