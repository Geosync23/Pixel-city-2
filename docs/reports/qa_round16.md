# QA round 16 (Opus QA lane, 2026-11-16): company on rides, in-store trips, alarm to clock-in, capital letters, the gelato cart and objects on asphalt, the controller pass

**Words.** "Played" = by touch (Playwright `touchscreen.tap` at a point read off the screen) or, in Part B, by the FAKE pad only (`tools/pad_lib.mjs`: D-pad / A / B / X / Y / LB / RB / sticks; the script looks at the page to decide what to press). "Walked" = the pathfinder along the nav arrow (`AW()`), used for the long street walks between taps. "Script" = a measurement in the page. "Code-read" = read, not run. Every shortcut is named where it was used (teleport, `G.go`, money / needs set by API, `debugStart`, `skipTo`).
**Setup.** 390 x 844, `G.CLOCK = .85`, `dist/index.html`. Drivers in `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/r16/`: `srv.mjs` + `t` (touch server, port 7860, round 15's helpers + `dez.js`: a 250 ms trace of the player and each companion), `pad/psrv.mjs` + `pt` / `pt2` (a persistent FAKE-pad session, port 7870; `pad/*.js` = apps, roomy, closet, skill, deco, trav, work, jp), `sw/` (the asphalt sweep), `a4/` (letters). Saves: `c2_21.json` (Ch2 step 21 at the stoop), `c3_106.json` (Ch3 "Walk them home" in the park), `a3_home_2308.json`, `a2_added.json`, `a2_morning.json`, `is_fjord.json`, `pad_cons.json`. Screenshots: `out/shots/r16_*.png` (all named below were looked at).

**Checks (final tree).** `node src/data/validate.mjs` OK · `node tools/build.mjs` OK (14,506 KB) · `node tools/jobs_check.mjs` OK · `node tools/rel_check.mjs` OK · `node tools/instore_check.mjs` OK · `node tools/navcheck.mjs --rooms all` all passed (277 rooms / 518 doors), 0 page errors · `node tools/pad_check.mjs` (regression after the padnav change) 68 passed, 0 failed, cursor fallback 0x · `grep -c '(?<[=!]' dist/index.html` = 0 · page errors in every touch and pad session: 0 (the only console lines were `Failed to load resource` 404s from the local test server and one Chrome `willReadFrequently` performance warning).

---

## Part A

### A1. Chapter company on rides (src/sim/_chapters_cast.js `comp.update` 'aboard'): WORKS, nothing changed
Set-up (named): save d31, Ch2 already done; `G.chapters.debug.skipTo(2, 21)`, then walked to the stoop (`dest()`); from there every run started at Dez's line 21 by touch.

| run | how | during the ride | getting off | into the building | arrival lines (played) |
|---|---|---|---|---|---|
| Ch2 **BUS** (1 Ring, 2 stops) | played: route started with `G.nav.start(<bus option>)` (named: on that build the route card had no BUS row, see note 1), then taps on "Wait for bus", "Get off here: your stop", walked | Dez hidden from boarding 08:06 to 08:11 (trace every 250 ms); nobody ran behind the bus (`r16_a1_bus_ride`) | the same tick the player reappeared, Dez stood **1.4 tiles** beside him (`r16_a1_bus_off`) | walked with him (3.4-3.6 tiles behind), in the lobby 1.3 beside (`r16_a1_bus_lobby`) | "The bus! Respect. The bus is the truth about a city." / "Stops every few blocks…" / "Took us long enough. On the bike I'd have dropped two parcels…" / "I deliver here every day…" |
| Ch2 **CAB** | played: route card CAB, Request ride, Put phone away; the cab pulled up at the kerb where we stood and we were in | hidden 07:38 to 07:53 | 1.4 beside at the drop (197.5, 261.5) | lobby 1.3 beside (`r16_a1_cab_lobby`) | "A cab. I said not the cab." / "...It was Manny, though. Fine. Manny's allowed." / "Took us long enough…" (note 2) |
| Ch2 **TRAIN** (Loop B, 2 stops) | played: TRAIN, ticket and "Wait on platform" tapped, "Get off here" tapped at Central | **in the car with you**, visible 1.4 beside (`r16_a1_train_ride`) | 1.3 beside in Central Station | walked out with him, lobby 1.3 beside (`r16_a1_train_lobby`) | "Train! Good pick…" / "Tap in at the gate, sit on the bay side…" / "Took us long enough…" |
| Ch2 **FOOT** | played: WALK, walked 33 min | never more than **4.3** tiles away (165 samples), never teleported | - | lobby 1.3 beside (`r16_a1_walk_lobby`) | "We WALKED. All of it. Okay, I take back the legs thing…" / "Took us long enough…" |
| **Ch3 "Walk them home"** with Pip and Milo, by **CAB** | `skipTo(3, 106)` (named), walked to Maplewood Park; route card CAB by touch; walked to the kerb, tapped "Get in the cab" | both hidden 15:51 to 15:55 | both 1.1 / 1.4 beside at Nora's (`r16_a1_ch3_cabout`) | - | - |

Notes (none changed):
1. On the build I started from, the route card from Juniper Court to the SkyDeck offered WALK / TRAIN / CAB only, while Dez says "See how it hands you choices? Walk, bus, train, cab." Later in the day `src/sim/navigator.js` changed under me ("owner msg 176: foot, bus, train and cab are ALWAYS all offered") and every later card had a BUS row. Solved by someone else; just confirming it matters for this line.
2. Writing: "Took us long enough. On the bike I'd have dropped two parcels…" is said after EVERY way, including the 21-minute cab and the bus. After the cab it contradicts the joke before it. Suggest gating it to walk / train, or a cab-specific line.
3. The cab dropped the kids on the pavement right behind the cab; for a second they look as if standing on its roof (`r16_a1_ch3_cabout`). Cosmetic, gone when the cab leaves.
4. Train platform wait (07:40-07:44): the player is hidden "on the platform" but Dez stays standing in the street at the station door (off screen; `riding` only counts once a ride exists). Harmless; he is in the car when the train comes.
5. My first Ch3 cab "gave up waiting" because my script stood in the park instead of walking to the kerb arrow: not a game fault.

### A2. In-store: Take me there by bus and cab, a Galleria bay, Add to My Day: WORKS, one bug FIXED, one gap
| what | how | result |
|---|---|---|
| **Roomy -> BUS -> buy** | played: installed Roomy in Appy by touch, Tables & desks > In store > Writing Desk, White ("Fjord & Fold (Harborside) · $192 · Open now · 4.7 km") > Take me there > **BUS · 1 Ring · 31 min** (`r16_a2_roomy_route`); taps on the stop / get-off buttons, walked | left 11:05, in the shop 11:45 (40 min for a quoted 31); tapped the desk on the shop floor, **Buy · $192** ("delivered to your home tomorrow at 09:00"). Money: +$500 by API (named) because the save had $135 |
| **Closet -> CAB -> a Galleria bay -> buy** | played: Closet > Shops > Open the catalogue > In store > Supernova Tie-Dye Tee: "Thread & Co. Outlet, Maple Bay Galleria (Downtown) · $25 · Open now · 2.1 km" / "Ink & Ivy Vintage · $20" (`r16_a2_closet_tee`) > Take me there > CAB (requested **inside** Fjord & Fold: "Head outside to meet your cab") | arrived "Maple Bay Galleria - fare $12.25" (quoted $12.50). **Gap: the guidance ends at the mall's street door. Inside the Galleria there is no arrow to the Thread & Co. Outlet bay** (`r16_a2_galleria_in`, arrow empty): the player has to find the bay (there is a Mall directory). Then by touch: the Outlet's counter > Clothes > search > the tee > **Buy now $25** ("Supernova Tie-Dye Tee is yours.") |
| **Add to My Day for a closed shop** | played at d31 23:15: the Writing Desk page said "Opens tomorrow at 09:00", Add to My Day | "Added to My Day: Fjord & Fold, tomorrow at 09:00." **BUG: a second tap added the same stop again (two identical rows).** FIXED in `src/sim/instore.js plan()`: an open stop for the same shop at the same time is reused, toast "Already on My Day: …" (verified in the rebuilt game: one row) |
| ... **followed next morning** | played: bed > Sleep until morning (woke 07:00), needs set to 95 by API (named; my first try wandered to the clinic with a bursting bladder), My Day > the 09:00 row ("50 min walk, 25 by cab · leave by 08:00", `r16_a2_myday_row`) > Take me there > BUS | at the door 07:42 (shop opens 09:00: the trip just ends, "You have arrived"); waited to 09:00 (4x, named), went in, bought the desk; the My Day stop is marked done |

Also seen: the 09:00 stop sits inside the 07:00-13:00 shift with no word about the clash (the alarm picker has such a line; Add to My Day does not). The open shop sheet does not refresh when money changes while it is open (only noticed because I added money by API).

### A3. Custom alarm with a shift next day, morning played to clock-in: WORKS, one small bug FIXED
Played: d31 23:08 at home (the barista shift is d32 07:00): Bed > "Set the alarm…" > hour − once, minute − twice: "Wake at 05:50 · sleeps 6 h 36 min" (`r16_a3_picker1`; the shift line correctly disappears, 07:00 is not before 05:50 + 45) > Sleep. **The wake card said 05:49** (`r16_a3_woke`): the clock was 349.9999999994 minutes (float drift over the long sleep). FIXED in `src/ui/alarm.js` (the sleep gets 0.001 min = 0.06 s more). Then: Start the day > the NEXT chip > My Day > the shift row > route card > WALK · 8 min > walked: in Bean & Gone at 06:24, **"Clocked in. Uniform on!" at 06:30** on its own, then the clock-in card (`r16_a3_0630`). On time.

### A4. Capital letters at phone size (the B is fine; NOT changed, report only)
Screens at 390 x 844 (DPR 1 and DPR 3): title, a street, the Nest & Wire online window, phone home, Bay Bank, Jobs, Settings, Wander, Roomy, Closet, Bay Basics, My Day, the chapters menu (`r16_a4_dpr1_01..13`, `r16_a4_dpr3_*`), an alphabet sheet in the game's own font at 10-16 px, regular and bold (`r16_a4_dpr1_14_alphabet`), and one 4x zoom per candidate (`r16_a4_zoom_<pair>.png`, 12 / 13 / 14 px, regular and bold). The redrawn **B reads as a B** everywhere.

| rank | letters | what it looks like (12-14 px) | where it bites | picture |
|---|---|---|---|---|
| 1 | **C vs O** | bold C is an O with a one-pixel gap; regular nearly the same. "CAB" reads "OAB", "CLOSED" "OLOSED", "COOK" "OOOK" | route card CAB, "CLOSED" chips, Cooking, Closet, Chapter cards | `r16_a4_zoom_CO.png` |
| 2 | **Z vs 2** | Z is drawn like a 2 (curved top) | "ZipEats" reads "2IPEATS"; any Z next to digits | `r16_a4_zoom_Z2.png` |
| 3 | **G vs 6** | bold G is a 6 / 8 shape | "GO", "GIG", "Galleria" in bold headings | `r16_a4_zoom_G6.png` |
| 4 | **D vs O vs 0** | D is a rounded box like O; the redrawn 0 is close too | "DONE", "DO 10", "OPEN 10" | `r16_a4_zoom_DO0.png` |
| 5 | I vs l vs 1 | l and I are both one bar | "Il1", "MILK 11" | `r16_a4_zoom_Il1.png` |
| 6 | U vs V | V has a flat bottom like U | "VIEW" | `r16_a4_zoom_UV.png` |
| ok | Q / O, S / 5 | Q's tail and S vs 5 are distinct enough | - | `r16_a4_zoom_QO.png`, `r16_a4_zoom_S5.png` |
The same `unicode-range` trick used for B (src/ui/numfont.js mode 'd', U+0042) would take C, G, Z and D next if the owner wants them.

### A5. The gelato cart and solid objects on asphalt (script + screenshots; nothing changed)
**Scoop Dreams** (`prop.street.cart.icecream` at (133, 229), footprint 133-135 x 229-230), played at 14:00: it stands on the brick pavement (tile type 19), the road begins at y 230. Blocked tiles around it: only the cart's own 3 (a 4-tile-wide pavement, free passage at y 226-228). Tapped by touch: the Scoop Dreams menu opens (Rocket Pop $2.50, Single $3.50, Double $5; `r16_a5_gelato_menu`). **There is no vendor:** code-read `src/sim/stalls.js` gives street carts no keeper at all (it only opens the shop), and in the picture nobody stands behind the cart (`r16_a5_gelato2`, `r16_a5_gelato_zoom`). A passer-by was measured standing inside the cart's footprint at (133.0, 229.1) (hidden behind it). A crowd of 5-6 people queued at it.

**Sweep** (`sw/asphalt.mjs`: every `solid` object in the city whose footprint covers a tile of type 3 = asphalt): 3,951 solids, 106 touch asphalt. Then a 5x5 tile neighbourhood per hit and a screenshot of each distinct case (magenta dots = the footprint corners).

| object | where (x, y) | what it is | screenshot | verdict |
|---|---|---|---|---|
| `prop.nature.rock` | (163, 112.5) | a grey rock **in the traffic lane**, beside reeds that also grow on the road, at the bus stop by Maple Falls | `r16_a5_rock_163_112` (+ zoom in `sw/z.png`) | **wrong** |
| `prop.nature.rock` | (147, 109.5) | the same strip, at the road edge | (same area) | wrong |
| `prop.nature.tree.willow` | (148, 114) | a willow trunk **on the road**, next to the yellow centre line, by the light rail | `r16_a5_willow_148_114` | **wrong** |
| `prop.harbor.crates` x2, `prop.harbor.barrels` | (122, 323), (167, 323), (197, 323) | cannery crates / barrels on the kerb lane of the harbour road, by the taxi rank | `r16_a5_crates_122_323` | wrong (could be added to `OFFROAD`, but its search also treats water as "road" and may move dock crates, so I left it) |
| `prop.nature.tree.fruit` / `.birch` / `.oak` / `prop.nature.flowerbed` | (353.5, 250.5), (351, 249), (352, 241), (350.5, 243) | trees in a stepped asphalt patch inside a park ("Maple Falls" area) | `r16_a5_fruit_353_250` | odd: a park patch painted asphalt, no traffic |
| `prop.nature.tree.maple` x2 / `.spruce` / `leafpile` / `hedge` | (325.5-326, 151-151.5), (315.5, 151), (314.5, 151), (325.5, 148) | the same kind of asphalt patch with trees | `r16_a5_tree_325_151` | odd (same) |
| `prop.nature.tree.cherry` x2, `.maple`, `prop.nature.bush`, `prop.park.raisedbed`, `.fruit` | (242.5, 182.5), (321.5, 185), (249, 182), (323, 177.5), (314.5, 176.5), (320, 176) | edge of lots / parks, partly on asphalt | `r16_a5_cherry_242_182` | edge cases |
| `prop.park.bikerack` | (291, 186) | three hoops standing in a car park, beside parked cars | `r16_a5_bikerack_291_186` | odd (a pavement thing; `OFFROAD` matches `prop.road.bikerack` only, not `prop.park.bikerack`) |
| `prop.road.bikerack` | (208.5, 148) | under a glass overhang, edge of the asphalt | `r16_a5_bikerack_208_148` | edge |
| `prop.road.sign.street` x38 | every downtown / Old Town corner, e.g. (50, 118.5), (50, 204.5) | the corner name sign stands 0-0.24 tile into the first road tile, at the end of the crosswalk | `r16_a5_sign_50_204` | by design at the kerb line; pedestrians cross beside it |
| `prop.rail.pier` x5 | (179.5, 122), (235.5, 122), (83.5, 304), (179.5, 304), (235.5, 304) | light-rail viaduct piers in the road | `r16_a5_pier_179_122` | expected |
| parked cars / taxis / vans (~40) | car parks at (309-343, 110-118), (240-248, 175), taxi rank (278-284, 188) | parked vehicles | `r16_a5_cars_309_110`, `r16_a5_car_246_175`, `r16_a5_taxi_278_188` | expected |
| `bld.downtown.parking` | (211, 144) | the parking garage | `r16_a5_parking_211_144` | expected |
Full list with footprints: `sw/asphalt.json`. The ice-cream cart is not in it any more.

---

## Part B: controller pass with the FAKE pad only, 390 x 844 (Xbox style)
Session: `pad/psrv.mjs` (one page, the fake pad of `tools/pad_lib.mjs`, `P.choose` = move the ring with the D-pad and press A, falling back to the free pointer (R3 + stick + A) only when the ring cannot get there; that fallback is counted). Seeds named above; needs topped / money added by API (named) between stages.

### B1. Results
| screen | action done with the pad | reached by | pointer fallback? | result |
|---|---|---|---|---|
| Phone: Messages | open a thread (Theo) | focus | no | played |
| Wander | open a district list | focus | no | played |
| Map | Where to? chip, list, route card, Search with the pad keyboard ("pier"), a result, TRAIN | focus + osk | no | played (note b) |
| Me | Skills tab, a skill page, Practise | focus | no | played |
| MapleCab | a destination quote | focus | no | played |
| Bay Bank | Activity tab | focus | no | played |
| Jobs / job board | Board tab, Apply | focus | **yes, once: the My Day banner covered the tab row** (note c) | played |
| Wellness | Journal tab | focus | no (the need rows are not buttons) | played |
| ZipEats | open Dot's Diner menu | focus | no | played |
| Appy | Get (Receipts, Reel), Get on the Pages row | focus | no | played |
| Settings | (played in round 15's pad_check) | - | - | - |
| Maple Post | Inbox | focus | no | played |
| Bay Basics, Campus, Opportunities, Porchlight | the first control of each | focus | no | played (shallow) |
| My Day | Week | focus | no | played |
| Pages | open a book, Next page | focus | no | played (RB does not turn pages; only the Next button) |
| Reel | play a video | focus | no | played |
| **PlayBox** | Stack & Ship > Play > the game | **was NOT reachable** (the "Tap the game to start" card covers the canvas, so the canvas was dropped from the focus set and the ring went to "Home screen" / Pause) | - | **FIXED** (padnav.js, see B2): ring on the game, A steps on, A drops crates (game played to "over") |
| **Roomy** (new) | Tables & desks > **In store filter** > Writing Desk: **"Only available in store" box** > Take me there > route card > WALK | focus | no | played (`r16_b_roomy_filter`, `r16_b_roomy_box`) |
| **Closet** (new) | Shops > catalogue > **In store filter** > a piece > box > Take me there | focus | no | played |
| **Alarm picker** (new) | bed > Set the alarm… > minute − > Not yet | target + focus | the hour + was at its limit (disabled: nothing to press) | played (`r16_b_alarm`) |
| **Houseplants tab** (new) | Bloom & Paper counter > Houseplants tab (first tab) > Buy (Little Succulent $8) | target + focus | no | played (`r16_b_houseplants`) |
| **Box office** (new) | Buy the 21:30 show by focus | focus | no | played; "Add to My Day" did not appear because buying already put it in My Day ("It is in My Day."): that button was not pressed |
| Wardrobe | Wardrobe > Change Outfit > Dresser: Drawers > a tee (on) | target + focus | no | played |
| **Decorate** | Shop tab > a piece (try) > Turn > Colour > Teal > the room surface: hold A + stick **moved** it, **Y turned** it > Add to cart; select the hamper on the room > **Store**; My Things > Pocket Radio > **Sell** ($168.75 -> $181.75); My Things > the hamper **placed** back; Done; Roomy > Cart > **Order · $25** (the buy) | focus + room surface | no | played (`r16_b_deco_*`); note d |
| Bus ride | route card BUS > walked to the stop > "Wait for bus" (focus) > ride: **Choose stop** (focus; down enters the list; B closes it) > **X = Skip ride** | focus + X | no | played (`r16_b_bus_ride`, `_choose`, `_skipped`) |
| Train ride | station: Buy ticket, Wait on platform (focus) > in the car **D-pad up puts the ring on "Get off here"** > **Skip ahead** | focus | no | played (arrived Central) |
| Skill mini-games | Me > Skills > Logic / Painting / Writing / Gaming / Chess / Fitness / Dancing > Practise: **memory, trace, quickdraw, arcade, chess, timing, rhythm** each played to the end; **balance** by `G.skillplay.demo('pose')` (named) with A held | focus + game surface | no | played |
| Job shifts (ui/jobs.js minis) | `G.jobs.debugStart(job)` (named: hire + clock in), then the pad only: walked to each task and used it; **mash** + **meter** (line cook), **belt** (grocery clerk, level 2), **pick** (barista: the ticket's ingredients by focus) | target + focus (hold A for meters) | no | played (`r16_b_jobmini_*`); scores not judged |
| Job plays (_jobplay_kit) | `G.jobStory.play(job)` (named): **order** (grocery, nurse), **grid** (analyst), **live** with the map canvas (courier) | focus / map surface | no | played (`r16_b_jp_*`; note e) |
| Chapter extra: Nell's book | popped up in the conservatory: A on ">" turned the page, B closed it | focus + B | no | played |
| Venue special: **conservatory butterfly photo** | Photograph a butterfly | **nothing was focusable**; A and X did nothing; only R3 pointer + A on the photo worked | **yes** | **FIXED** (`data-pad-surface` on the photo canvas): ring on the photo, A steps on, A shoots ("Click! …") |
| Venue special: **museum fossil dig** | RB to "Brush out a fossil", A | the sand canvas was not focusable (pointer only) | (yes before) | **FIXED** (`data-pad-surface`): A steps on, hold A + stick brushed: "Trilobite! … New in your Finds (1/6)" |
| Venue special: observatory eyepiece / constellation finder | not played (night only) | code-read: same pattern as the photo (canvas + pointerdown, no focusable thing) | yes | same one-line fix applied, **not played** |
| Venue special: natatorium swim / dive / beat | not played | code-read: these listen to taps on the game canvas or Space / E / Enter via `G.on('key')`; while you are busy in the pool the pad's A does nothing (padnav `useTarget()` returns false and no key is emitted) | yes (R3 + A on the game view) | **not fixed**: see B3 |

Notes: (a) Phone icons have aria-labels like "Messages, 9 new"; the focus reaches all 21 icons. (b) After a Where to? chip the ring stays on the chip, the list is one "down" away. (c) The "My Day · Leave now" banner sits over the app's tab row (Jobs: My Job / Board) and covers it for a finger too; its x was not reachable by focus inside the app (the pointer was needed); banners are reached from the world with D-pad up. (d) After pressing Colour the ring jumps to Undo at the top instead of the colour chips; "left" from the room surface jumps to the category row. (e) In three of my order / grid screenshots the ring sat on the sheet's **x** right after an answer (`r16_b_jp_grocery_clerk_order`, `_nurse_order`, `_office_analyst_grid`), and one analyst run ended early; two careful re-runs (sampling the focus every 120-250 ms) never saw it. Mashing A at that moment would close the play (the ticket stays, nothing is lost). Not reproduced, not fixed.

### B2. Fixes made (small, as allowed)
- `src/ui/padnav.js` `reachable()`: a surface CANVAS whose own small wrapper (the wrapper's area at most 1.4x the canvas) holds the element on top of it (PlayBox's "Tap the game to start" card) still counts as reachable. Only canvases that already match the surface selector are affected.
- `src/sim/conservatory.js` (butterfly photo), `src/sim/museum.js` (fossil dig sand), `src/sim/observatory.js` (eyepiece / constellations): `data-pad-surface="cursor"` on the canvas.

### B3. Bigger things, listed (not changed)
1. **Natatorium minis** (and shows "stand up") are driven by `G.on('key')` / a tap on the game canvas. A two-line padnav change (in the world `ok` case: when `G.busy` and nothing is targeted, `G.emit('key', ' ')`) would make A swim / dive, but shows.js also stands you up on ANY key, so A would end a film; needs a decision (e.g. shows ignoring the pad's key, or a narrower event).
2. Pages: RB / LB could turn pages.
3. Add to My Day / the alarm picker: no pad issue; the picker's + / − at a limit simply grey out.

### B4. Words that still say Click / WASD / Tap with a pad active (listed, not rewritten)
`src/ui/goals.js:74-76` already swaps "Click" to "Tap" on touch screens (`tapWords`); the same hook could swap to the pad's words. 254 player-facing strings (filtered from narrative uses of "tap", e.g. water taps):

- `src/ui/minigame.js:10` ': hold to fill to the line), '
- `src/ui/phone_reel.js:76` `${playable.length} to watch. On the big screen: at home, tap your TV and choose Stream on Reel.`
- `src/ui/phone_settings.js:12` 'Tap the ground to walk. MapleCab drives you anywhere you know; the light rail and buses are cheaper.'
- `src/ui/phone_settings.js:12` 'M or Q opens the phone, Esc goes back. Banners at the top open the right app when tapped.'
- `src/ui/phone_settings.js:47` 'Tap again to save and return to the title screen.'
- `src/ui/phone_home.js:83` 'Tap a box in the room to unpack it.'
- `src/ui/phone_home.js:96` 'Tap "
- `src/ui/phone_home.js:107` `Flat-pack: build it yourself (a quick game), or tap Build to have it arrive built for ${money(FEE.assembly)}.`
- `src/ui/phone_home.js:134` 'Tap the boxes in your room to unpack them.'
- `src/ui/phone_minis.js:93` 'Tap an outfit to change into it, wherever you are.'
- `src/ui/phone_minis.js:100` 'Tap someone in town and press Talk. They will show up here.'
- `src/ui/phone_guide.js:153` 'The same list opens when you tap a need on the game screen.'
- `src/ui/phone_guide.js:212` 'Wander lists every place in town, found or not. Tap "
- `src/ui/jobs.js:6` ' (marker sweeps, tap to stop) | '
- `src/ui/jobs.js:7` ' (tap each sliding item; labels) | '
- `src/ui/jobs.js:42` 'Sure? Tap again'
- `src/ui/jobs.js:124` 'Tap'
- `src/ui/phone_tips.js:27` 'Open MapleCab, pick a place you know and confirm the fare. The cab drives to the kerb next to you; tap it to get in. Cabs are the quickest way across town and the dearest.'
- `src/ui/phone_tips.js:33` 'A soft glow marks doors you can enter and stalls you can buy from. Tap a market stall or kiosk to shop on the spot without going inside.'
- `src/ui/phone_tips.js:34` 'Grocers and corner stores sell ingredients and ready food. Tap the till inside to open the shop. What you buy goes into your bag.'
- `src/ui/phone_tips.js:39` 'Carry a granola bar or a drink in your bag. Open the bag and tap it to eat anywhere, handy on a long shift or a long walk.'
- `src/ui/phone_tips.js:42` 'New homes and deliveries arrive as boxes on the floor. Tap a box to unpack it and its contents are ready to place.'
- `src/ui/phone_tips.js:58` 'Friends and family text you with news and invitations. Answer with a tap. The People tab shows hearts, birthdays and where a friend usually is.'
- `src/ui/phone_tips.js:64` 'Tap a low need'
- `src/ui/phone_tips.js:64` 'When a need icon shows up on screen, tap it. You get the nearest places that fix it and one tap sets the route.'
- `src/ui/phone_tips.js:77` 'Tap the clock card at the top of the phone to see everything you missed. Tapping a banner opens the right app.'
- `src/ui/phone.js:56` 'Tap to open.'
- `src/ui/creator.js:107` 'Tap to turn'
- `src/ui/phone_play.js:79` 'Tap the game to start'
- `src/ui/phone_homes.js:132` " shows the way; then tap the door and choose "
- `src/ui/hud.js:63` 'tap to continue'
- `src/ui/phone_messages.js:124` 'Tap "
- `src/ui/myday.js:166` 'Like one? Tap Add and it is on your day. "
- `src/ui/myday.js:182` 'Pick an idea you like the look of and tap Add.'
- `src/ui/furnish.js:233` 'Storage is empty. Tap Shop to try new pieces in your room.'
- `src/ui/furnish.js:266` 'Drag a piece to move it. Tap one to turn, recolour, store or sell it.'
- `src/ui/furnish.js:266` 'Tap something in the tray to put it in the room.'
- `src/ui/phone_closet.js:82` 'Tap a piece to see who stocks it this week.'
- `src/ui/phone_closet.js:82` 'Nothing on your wish list. Tap the heart on anything in a shop or a catalogue.'
- `src/ui/goals.js:42` 'Tap to set a waypoint'
- `src/ui/goals.js:74` "Click"
- `src/ui/goals.js:74` "Tap"
- `src/ui/goals.js:76` 'Tapping'
- `src/ui/goals.js:76` 'Tap'
- `src/ui/goals.js:76` 'tapping'
- `src/ui/phone_closet_kit.js:62` 'Tap to turn'
- `src/ui/chapters_ui.js:68` ' /* PAD HOOK: A on the line = a tap on the sheet (the click bubbles to d.wrap) */ }); d.more = el('
- `src/ui/phone_jobs.js:40` 'Ask for your next shift off? One day a week. Tap again to ask.'
- `src/ui/phone_jobs.js:41` 'Tap Quit again to confirm.'
- `src/ui/navarrow.js:128` 'tap "
- `src/ui/navarrow.js:149` `Tap the stop: wait for the ${t.line} bus`
- `src/ui/navarrow.js:149` `Tap the station: ${t.line} to ${short(t.alight && t.alight.name)}`
- `src/ui/phone_me.js:40` 'On: cooking, painting, music, fishing and more open a short game. Tap Auto in any game for the usual result.'
- `src/sim/aquarium.js:129` '} · tap to add to your day`
- `src/sim/aquarium.js:278` 'Click. A lovely photograph of blue water. Wait for something to swim into the frame and try again.'
- `src/sim/aquarium.js:289` 'Click.'
- `src/sim/natatorium.js:45` 'Swim a timed 100 m in the competition pool. Tap in time with the stroke; watch the pace clock.'
- `src/sim/natatorium.js:227` 'Tap to change'
- `src/sim/natatorium.js:228` 'Tap "
- `src/sim/natatorium.js:228` " (or Space, or the pool) in time with the marker. Good rhythm is speed; pace is stamina.'
- `src/sim/natatorium.js:301` "Not quite a pass. Tap with the marker, not after it. Come back tomorrow: second go is on the house."
- `src/sim/natatorium.js:311` 'Rhythm before effort. A ragged sprint is slower than a smooth cruise. Tap on the marker, every stroke.'
- `src/sim/natatorium.js:349` 'Tap when the marker is in the green: that is your take-off.'
- `src/sim/natatorium.js:351` 'In the air: tap to open out as the marker reaches the green.'
- `src/sim/natatorium.js:547` 'Swim a timed 100 m: tap in time with the stroke'
- `src/sim/skillplay.js:167` 'Tap when the marker is in the green to flip at just the right moment.'
- `src/sim/skillplay.js:170` 'Tap at the top of each rep, inside the green.'
- `src/sim/skillplay.js:173` 'Left, right, left: tap each side as the step reaches the line.'
- `src/sim/skillplay.js:176` 'Hold to rise, let go to sink. Keep the bar inside the green until the pose is done.'
- `src/sim/skillplay.js:179` 'Watch the cards light up, then tap them in the same order.'
- `src/sim/skillplay.js:185` 'Each part goes in its drawer. Tap the right drawer before the timer runs out.'
- `src/sim/skillplay.js:190` 'Tap each string as its note crosses the line.'
- `src/sim/skillplay.js:195` 'Play it for the street: tap each note as it crosses the line.'
- `src/sim/skillplay.js:210` 'Tap when the gold focus ring sits on the white one. Three shots.'
- `src/sim/skillplay.js:214` 'Pull the weeds (tap them). Leave the seedlings to grow.'
- `src/sim/skillplay.js:224` 'Left arm, right arm: tap each side as the stroke reaches the line.'
- `src/sim/skillplay.js:227` 'Hold to reel, let go to give line. Keep the tension in the green until the fish tires.'
- `src/sim/skillplay.js:237` 'Tap the square where your white piece attacks TWO black pieces at once (dots show its moves).'
- `src/sim/skillplay.js:241` 'Hold to pour, let go at the green line. Three pours.'
- `src/sim/skillplay.js:247` 'The buyer wavers. Tap when the marker is in the green to close high. Three rounds.'
- `src/sim/skillplay.js:252` 'Which occasion is each piece for? Tap the right rail.'
- `src/sim/skillplay.js:260` 'Timing! Tap in the green to land each punchline.'
- `src/sim/skillplay.js:268` 'Tap to lock your aim in the green arc, then tap again to lock the power.'
- `src/sim/skillplay.js:271` 'Tap to lock your aim, then tap again for the throw.'
- `src/sim/skillplay.js:358` 'Haggle for a better price, or tap Auto in the game for the usual one.'
- `src/sim/apps.js:21` 'Texts, invitations and your People list. Reply with a tap, accept a plan and it lands on My Day.'
- `src/sim/apps.js:22` 'Ideas from all over town, one tap to add'
- `src/sim/apps.js:49` 'Every outfit you own in one grid. Change in a tap, wherever you are.'
- `src/sim/apps.js:71` 'Who you are open to, in one tap'
- `src/sim/apps.js:97` `${a.name} is now on ${STORE_NAME}. Tap to install it.`
- `src/sim/_rel_verbs.js:117` `${short(id)} falls in beside you. Tap them to talk as you go.`
- `src/sim/audio.js:269` 'Sound has not started: tap the game once'
- `src/sim/orders.js:123` ' Tap a box to unpack it.'
- `src/sim/lighthouse.js:227` 'Tap the barometer. Everyone does. It likes the attention.'
- `src/sim/shows.js:187` 'The room is nearly full. Tap your seat (the marked one) to sit down.'
- `src/sim/_jobplay_kit.js:67` 'Tap the cards in order. Tap a placed one to take it back.'
- `src/sim/_jobplay_kit.js:86` 'Tap the one that is wrong.'
- `src/sim/clothes_shop.js:30` 'Tap a rack, pick a piece, carry it to the till. Every shop in town stocks different things.'
- `src/sim/clothes_shop.js:98` 'The mirror shows it with what you are wearing now. Tap the mirror to turn round.'
- `src/sim/clothes_shop.js:126` 'Nothing over your arm. Tap a rack, take a few pieces, then come back to the mirror.'
- `src/sim/clothes_shop.js:128` 'Tap the mirror to turn round'
- `src/sim/mailboxes.js:199` 'Tap your door to go inside.'
- `src/sim/mailboxes.js:200` `Your flat is upstairs. Tap the ${APARTMENTS[id].up === '
- `src/sim/homedesign.js:4` `): tap -> "
- `src/sim/homedesign.js:61` ' Tap Decorate to move it.'
- `src/sim/homedesign.js:80` 'Tap when the marker is in the green'
- `src/sim/hair.js:65` 'The cape comes off with a flourish. Tap the mirror to see the back.'
- `src/sim/_jobplay_games.js:68` 'A month appears twice. Tap the second one.'
- `src/sim/_jobplay_games.js:73` 'One column was made up at a desk: every figure in it ends the same way. Tap any figure in it.'
- `src/sim/_jobplay_games.js:83` 'Five drops and back to the depot. Tap the addresses in the order you would ride them: shortest loop wins.'
- `src/sim/_jobplay_games.js:97` " at the top of the lift: tap in the green.'
- `src/sim/_jobplay_games.js:116` 'Take a pulse: tap the button on every beat for ten seconds.'
- `src/sim/_jobplay_games.js:129` 'Ease forward. Stop when the forks line up: tap in the green.'
- `src/sim/_jobplay_games.js:139` 'Hold to pour. Let go at the line.'
- `src/sim/_jobplay_games.js:257` 'Tap a dish to start it cooking.'
- `src/sim/_jobplay_games.js:280` 'Press each cue as the narration reaches it.'
- `src/sim/_jobplay_games.js:306` 'Hold the button to talk over the intro. Let go just before the singing starts.'
- `src/sim/_jobplay_games.js:310` 'Hold to talk'
- `src/sim/_jobplay_games.js:391` 'own (mood match + hold to the post)'
- `src/sim/_jobs_work.js:52` 'Tap the button (or any key) to fill the bar'
- `src/sim/_jobs_work.js:60` 'Tap the ingredients on the ticket'
- `src/sim/_jobs_work.js:66` 'Tap each item as it slides past'
- `src/sim/_jobs_work.js:113` 'Hold to pour. Let go when the glass reaches the green line.'
- `src/sim/_jobs_work.js:113` 'Hold to pour'
- `src/sim/_jobstory_stations.js:110` 'Tap each pass as it comes to the scanner'
- `src/sim/_jobstory_stations.js:133` 'Tap each tag as it slides past'
- `src/sim/_jobstory_stations.js:178` 'Hold to turn it. Let go on the green line.'
- `src/sim/_jobstory_stations.js:178` 'Hold to slew'
- `src/sim/_jobstory_stations.js:182` 'Hold to talk over the intro. Let go just before the singing: on the green line.'
- `src/sim/_jobstory_stations.js:182` 'Hold to talk'
- `src/sim/museum.js:191` '*click*'
- `src/sim/museum.js:266` 'Click.'
- `src/sim/_rel_play.js:149` 'Tap when the marker is in the green.'
- `src/sim/cityhall.js:498` 'Press the brass buttons on the model of the city'
- `src/sim/goods.js:140` 'Click. Warm light.'
- `src/sim/goods.js:140` 'Click. Off.'
- `src/sim/observatory.js:113` '}. Tap to add it to your day.`
- `src/sim/observatory.js:151` 'Find a seat and tap it. The lights go down in a moment.'
- `src/sim/observatory.js:226` 'Somewhere in this field is a faint fuzzy patch that is not a star. Tap it.'
- `src/sim/observatory.js:226` 'Turn the focus: tap when the image is sharp'
- `src/sim/observatory.js:226` 'Tap to step back from the eyepiece'
- `src/sim/observatory.js:281` `${c.name}: tap the pulsing star, then the next, to join the dots`
- `src/sim/observatory.js:343` " and tap the faint fuzzy patch among the stars.'
- `src/sim/intro_airport.js:52` 'Your turn! Tap where you want to walk.'
- `src/sim/intro_airport.js:52` 'Your turn! Click where you want to walk (or use WASD / the arrow keys).'
- `src/sim/intro_airport.js:76` 'Open Messages and tap a reply to send it to Nora.'
- `src/sim/intro_airport.js:76` 'Bzzt! A text from your sibling. Tap your phone to read it.'
- `src/sim/intro_airport.js:123` 'Your bag is on the belt! Tap it to grab it.'
- `src/sim/rail.js:184` 'Tap a station on the map to choose where to go.'
- `src/sim/needs.js:96` 'tap the Bladder bar'
- `src/sim/needs.js:98` `Bursting! The ${w} is right here: tap it.`
- `src/sim/needs.js:102` '} is right here: tap it.`
- `src/sim/needs.js:102` 'any restroom will do: tap the Bladder bar'
- `src/sim/needs.js:154` 'You wake up needing the loo. Tap the Bladder bar for the nearest toilet.'
- `src/sim/needs.js:154` `You stop (${was}): you really need the loo. Tap the Bladder bar for the nearest restroom.`
- `src/sim/inventory.js:157` 'Tap an item.'
- `src/sim/navgoals.js:161` 'Deliver here: tap the gold marker, or go in'
- `src/sim/navgoals.js:161` 'Deliver here: tap the gold marker'
- `src/sim/navgoals.js:174` 'Your MapleCab: tap it to get in'
- `src/sim/navgoals.js:179` `${t.label}: tap the teal marker`
- `src/sim/navgoals.js:197` `Your seat: row ${String.fromCharCode(65 + s.row)}, seat ${s.n + 1}. Tap it to sit`
- `src/sim/navgoals.js:201` `Doors open ${clock(tk.t - T.doorsBefore)}: tap the door to wait here`
- `src/sim/navgoals.js:292` 'Your seat: tap it to sit down'
- `src/sim/navgoals.js:313` 'The tour is leaving: tap the docent to join'
- `src/sim/navgoals.js:329` 'Take any seat: tap it'
- `src/sim/navgoals.js:356` 'Your table: tap it to sit down'
- `src/sim/housing.js:480` '. Tap Decorate to place it.'
- `src/sim/conservatory.js:101` "Next tour at ${clock(nt)}. Wendell waits by the desk. Just tap him to join."
- `src/sim/conservatory.js:169` 'Tap when the butterfly is in the ring with its wings open'
- `src/sim/conservatory.js:192` 'Click! ...A very nice photo of a leaf. The butterfly was elsewhere.'
- `src/sim/conservatory.js:195` `Click! ${sp.name}: ${QN[q]}. ${fresh ? `
- `src/sim/arena.js:93` 'Home games Wednesday and Saturday, concerts on Friday, a family show on Sunday afternoon. Tap one for tickets.'
- `src/sim/arena.js:209` `${seatById(tk.seat).label}. Follow the gold arrow and tap your seat.`
- `src/sim/arena.js:209` 'Standing floor: walk out in front of the stage and find a spot. Tap the crowd to dance.'
- `src/sim/fishmarket.js:88` 'The auction is on: lots on the floor by the quay doors. Tap the rostrum or a crate to bid.'
- `src/sim/fishmarket.js:145` 'The clock starts high and falls. First hand up takes the lot. Tap a crate when you are ready.'
- `src/sim/_guide_data.js:104` 'Tap in, find a seat and watch the districts slide past. The loop takes in all eight stations.'
- `src/sim/guide.js:71` 'Wendell the docent leads a walk through every zone at 10:00, 13:00 and 16:00. Tap him to tag along.'
- `src/sim/guide.js:128` 'A rank where cabs wait. Tap one to hop in, no phone needed.'
- `src/sim/systems.js:104` 'Your stove: tap it to cook'
- `src/sim/traits.js:136` 'Pick three traits that fit you. Small perks, lots of character. Tap to choose.'
- `src/sim/traits.js:170` 'Tap a trait to read about it.'
- `src/sim/university.js:393` `${cs.name}${at}: take a seat (tap one)`
- `src/sim/university.js:394` 'The pond deck: tap it'
- `src/sim/university.js:394` `${cs.name}${at}: ${STATIONS[k].label.toLowerCase()} (tap it)`
- `src/sim/post.js:274` 'Press TAPE when the roll is over the marked seam.'
- `src/sim/wardrobe.js:291` `${out.length} of ${list.length} pieces. Tap one to put it on or take it off.`
- `src/sim/wardrobe.js:316` 'Tap to turn round'
- `src/sim/bladder.js:11` "tap a need"
- `src/data/cityevents.js:77` 'Tap each rocket as it reaches the line.'
- `src/data/cityevents.js:121` 'Press the cider'
- `src/data/cityevents.js:123` 'Press the cider'
- `src/data/cityevents.js:123` 'Hold to fill each mug to the line.'
- `src/data/opportunities_b.js:94` 'Something new on tap'
- `src/data/jobs.js:430` 'Collect 1-3 dogs from a Maplewood/Old Town doorstep, walk the park loop past 4 sniff-spots (click each), return them. Dogs trot behind on leads.'
- `src/data/jobs.js:435` 'Pick up a stack at the client venue, hand a flyer to 12 passers-by (click walkers; charisma raises the accept rate) or pin them on 6 notice boards.'
- `src/data/opportunities_a.js:115` 'Let somebody else drive. Tap in, find a window, watch the city wake up.'
- `src/data/phone.js:43` 'tap an entry -> show on Map / call taxi there'
- `src/data/phone.js:45` 'tap a day -> list'
- `src/data/phone.js:55` 'tap a venue -> card: name, blurb, today\'
- `src/data/phone.js:93` 'tap a low need -> one suggestion with a Map link ("
- `src/data/skills_extra.js:181` 'Tap to flap. Thread the gaps between the pier posts.'
- `src/data/skills_extra.js:182` 'Drag the paddle. Break every brick.'
- `src/data/skills_extra.js:183` 'Drag to steer. You fire by yourself. Dodge the rocks.'
- `src/data/skills_extra.js:184` 'Swipe or tap a side to turn. Eat the snacks, not your tail.'
- `src/data/skills_extra.js:207` 'Most hobbies in Maple Bay have a little game in them. Cook, paint, fish, dance: play it or tap Auto.'
- `src/data/firsttime.js:12` 'Tap "
- `src/data/firsttime.js:114` 'No harm done, though you lose a little time. When a need turns red, tap it and the nearest fix is one more tap away.'
- `src/data/media.js:50` 'Drag a food onto its neighbour to swap. Line up three or more. 20 moves.'
- `src/data/media.js:51` 'Tap for a hop, hold for a high jump. Tap again in the air to flap once. Grab the pretzels. Do not fall.'
- `src/data/media.js:53` 'Hold to let the hook sink, let go to reel in. Hook fish, dodge boots. 60 seconds.'
- `src/data/media.js:54` 'Harbor crates, one tap at a time.'
- `src/data/media.js:54` 'Tap to drop the swinging crate. Anything hanging over the edge is cut off.'
- `src/data/media.js:56` 'Tap two cards. Find every pair in as few turns as you can.'
- `src/data/media.js:57` 'Tap a street tile to turn it. Join the cab to the flag. As many fares as you can in 90 seconds.'
- `src/data/media.js:58` 'Tap the Beat'
- `src/data/media.js:58` 'Tap a lane when the note reaches the line. Keep the streak alive.'
- `src/data/needs.js:117` 'You cannot think about anything else. Any restroom will do: tap the Bladder bar to find the nearest one.'
- `src/data/needs.js:181` 'Feeling a bit lonely. Text or call someone (Messages), or walk up to anyone and tap Talk.'
- `src/data/needs.js:182` 'Need the loo. Tap the Bladder bar to find the nearest restroom.'
- `src/data/needs.js:182` 'Bursting! Tap the Bladder bar for the nearest restroom.'
- `src/data/systems.js:12` 'Tap any need on screen for the nearest place that fixes it. Wellness has the full picture.'
- `src/data/systems.js:28` 'Tap a thing to eat it, read it or give it away.'
- `src/data/systems.js:37` 'At home, Decorate lets you drag furniture about, turn it, store it or sell it.'
- `src/data/systems.js:63` 'Answer with a tap, or ring someone up for a chat.'
- `src/data/systems.js:68` 'Ideas are things you could add. One tap and it is on your day.'
- `src/data/systems.js:72` 'Tap a stop sign or the station stairs to see what is coming and get on.'
- `src/data/university.js:58` 'Pause... then tap in the green to land each line. Five lines.'
- `src/data/university.js:61` 'What came up in the net? Tap where each one belongs.'
- `src/data/university.js:65` 'Hold to tighten, let go to ease off. Keep it in the green until it seals.'
- `src/story/intro.js:47` 'Press any key'
- `src/story/intro.js:68` 'Tap the ground to walk. Stretch those legs!'
- `src/story/intro.js:80` 'Pick your new home, then tap Request ride.'
- `src/story/intro.js:82` 'Tap the cab to hop in.'
- `src/story/intro.js:85` 'Tap your door to go inside.'
- `src/story/intro.js:222` 'Tap a box to unpack it.'
- `src/story/intro.js:224` 'Tap the fridge.'
- `src/story/intro.js:230` 'Tap your bed when you are ready.'
- `src/story/intro.js:241` 'Tap the stove. Pancakes are hard to mess up.'
- `src/story/intro.js:243` 'Walk up to any station. Tap your phone at the gate.'
- `src/story/intro.js:247` 'Walk up to someone and tap Talk at the bottom of the screen. Most people here like it.'
- `src/story/chapters.js:258` 'Tap the sink.'
- `src/story/chapters.js:264` 'Tap when the edges say so.'
- `src/story/chapters.js:328` 'Your cousin Desmond will be round to drag you about the town. Let him. He knows it the way a pigeon knows it.'
- `src/story/chapters.js:718` 'Drag it. Green means it fits. Done when you like it.'
- `src/story/jobs_new.js:229` 'Cut on the slant under water, strip the leaves: a quick swipe per stem.'
- `src/story/jobs_new.js:337` 'They will not hold still: tap each animal once, and only once.'
- `src/story/jobs_new.js:448` 'Press each cue as Stella\'
- `src/story/jobs_new.js:586` 'Eight items come down the belt; drag each into a 3x3 paper bag. Heavy things low, soft things high, eggs on top, cold with cold.'
- `src/story/jobs_new.js:592` 'Four people in the waiting room, each with a short card: put them in order. Then take one pulse: tap on each beat for fifteen seconds; your count is compared.'
- `src/scenes/rooms/natatorium.js:90` 'Swim a timed 100 m and tap the rhythm'
- `src/scenes/rooms/lighthouse.js:118` 'Tap the barometer and read the keeper\'
- `src/scenes/rooms/lighthouse.js:124` 'Tap the barometer'
- `src/scenes/rooms/cityhall.js:146` 'Press the brass buttons on the model of the city'

---
**navcheck** (`node tools/navcheck.mjs --rooms all`, final tree): all passed, 0 page errors; room graph 277 rooms, 518 doors, 319 routes, 0 rooms with problems.

## Files changed
- `src/ui/alarm.js` (wake time float drift: +0.001 min)
- `src/sim/instore.js` (Add to My Day: no duplicate stop)
- `src/ui/padnav.js` (`reachable()`: a game canvas under its own start card)
- `src/sim/conservatory.js`, `src/sim/museum.js`, `src/sim/observatory.js` (`data-pad-surface` on three venue canvases)
- `docs/reports/qa_round16.md` (this report)
