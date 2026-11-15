# Art audit — Wave C "unfinished art" (2026-11-15)

Worker: pixel-art lane. Scope: audit everything the interrupted artists left, then fix the clear cases inside `src/art/**`
(not goods / chars / showpiece / performance / icons). No non-art file was edited; no git commands were run.

## Headline
The STATUS line "PARTIAL: downtown, oldtown, residential, civic, harbor buildings; props" is out of date. **Every building and prop set is
complete and at the quality bar** (119 of 120 building ids on disk are placed and drawn without errors; all galleries run clean in summer,
winter and flipped). What is actually unfinished is **outside `src/art`**: the water/terrain painter, winter ground cover, daytime rain,
the home-picker thumbnails, the title backdrop, and audio wiring. Inside `src/art` the real problems were *repetition* (identical buildings
placed several times) and two plainly under-detailed pieces. Those are fixed.

## What was captured and what was looked at
Captured to `out/shots/` (names below) — about 290 screenshots — and `out/gallery/` — 27 set sheets (`h_*.png`, 1x) cut into 52 tiles, plus 27 `g_*.png` 2x sheets.
- phone 390x844, zoom 2, day: 45 (`day_<district><n>.png`, all nine districts + river)
- wide 1400x1100, zoom 1 (debug), day: 40 (`ov_*.png`, same points)
- night / dusk, phone + wide: 36 (`night_*`, `dusk_*`, `ovnight_*`, `ovdusk_*`)
- weather: 45 through the `?weather=` URL (`ovrain_*`, `ovfog_*`, `ovstorm_*`, `ovsnow_*`, `ovcloudy_*`, `rain_*` ...) — **these are mid-ramp and under-state the weather**
  (the URL kind ramps over ~20 game minutes); 24 more with the weather snapped on by `G.weather.setWeather()` (`wx_<kind>_<place>.png` wide, `pwx_<kind>_<place>.png` phone) are the ones to trust
- title, creator, home picker: `title_phone.png`, `creator_phone.png`, `homes_phone.png`
- before/after of every changed piece: 30 + 35

**Honest count of what I actually opened and studied:** 14 wide day overviews (downtown x3, oldtown x3, harbor x3, hillcrest x2, maplewood, arts x2, railyard,
airport x3, park), 10 day phone shots, 6 wide night/weather shots, 15 phone night/weather shots, the title/creator/homes sheet, 8 gallery tiles in full
(downtown towers x2, midrise x2, arts street, examples, street props) and every before/after image. The remaining captures and gallery tiles
(residential, civic services, campus, harbor, park/plant/tree/stall/fence props, boats) were **rendered without error but not individually studied**; those sets were judged from the wide city overviews, where they all read as finished.
A later artist who wants a piece-by-piece pass should start from `out/gallery/h_*.png`.

## Ranked list (most visible to a player first)

| # | Item | Where (shot / id) | Owner | Status |
|---|------|-------------------|-------|--------|
| 1 | **Winter ground cover is a harsh 50% salt-and-pepper dither** on brick lanes, the boardwalk and sidewalks; at phone zoom it is the noisiest thing in the game | `pwx_clear_hb.png`, `pwx_snow_ot.png`, `wx_snow_mw.png` | engine ground painter | NOT DONE (not an art file) |
| 2 | **Water is one flat blue with a single foam stamp on a regular grid**, everywhere (bay, river, pond); no shoreline foam, no depth change near land, pond edge is a bare staircase, the pond does not freeze | `ov_hb1.png`, `ov_hb3.png`, `ov_hb4.png`, `ov_pk1.png`, `pwx_snow_pk.png` | engine ground painter | NOT DONE |
| 3 | **World edge**: grass/water stop at a hard line against flat pale blue; a brown slab shows under the bay | `ov_ot4.png`, `ov_hb4.png`, `ov_ap5.png` | engine/world | NOT DONE |
| 4 | **Three identical tattoo parlours** (same black box, same "INK & IVY" sign) within two blocks in the Arts Quarter | `ov_ar1.png`, `ov_ar3.png`; `bld.arts.vintage` | art | **DONE** (looks) — names still need a world hook, see Hooks 1 |
| 5 | **Round glass tower placed six times**, four with identical colours; three are visible at once downtown | `ov_test.png`, `ov_dt3.png`; `bld.downtown.tower.round` | art | **DONE** |
| 6 | **Brutalist office plainly flatter than its neighbours** (grey slab, mesh-like windows), twice, beside City Hall | `ov_test.png`, tile `h_downtown_midrise_1`; `bld.downtown.office.brutalist` | art | **DONE** |
| 7 | **Daytime rain / storm barely changes the picture**: no overcast darkening, no wet sheen or puddles; streaks are fine at phone zoom, invisible zoomed out | `wx_rain_dt.png`, `pwx_storm_dt.png` vs `ov_test.png` | weather fx | NOT DONE |
| 8 | **Home-picker thumbnails are placeholder toy houses** (three near-identical boxes) on an otherwise polished screen | `homes_phone.png` | ui/creator | NOT DONE |
| 9 | **Title backdrop is an arbitrary camera position** — half the screen is a grey flat roof; it should frame a landmark (Market Square, the pier, City Hall) | `title_phone.png` | ui/title | NOT DONE |
| 10 | Creator: the character preview is small and soft inside a large empty blue box | `creator_phone.png` | ui/creator | NOT DONE |
| 11 | Exterior signs do not match the lobby names: both brutalist blocks carve "CIVIC" but are "Kessler Block" / "Ostrander Institute"; round towers carry no name | `after_w_brut1.png` | world data | art side DONE (`p.sign`), needs Hooks 2 |
| 12 | The example asset `ex.shop` is placed in Market Square (94,239) between hand-made Old Town buildings; it was a bare brick box | `ov_ot1.png`; `ex.shop` | art | **DONE** (mostly hidden behind neighbours, low visibility) |
| 13 | Repeated names from world data: "ROPE WORKS" lofts x2, "BLOOM & PAPER" pavilion x2, "COFFEE" kiosk x2 | inventory dump | world data | NOT DONE (Hooks 3) |
| 14 | Fuel tanks: the airport set stands on the grass island between taxiway and runway (290,36) with a windsock; the same "JET A-1" tanks also stand in the railyard (329,317) | `ov_ap5.png`, `ov_ry1.png`; `bld.airport.fueltanks` | world placement | NOT DONE (Hooks 4; the art already takes `label` / `band`) |
| 15 | "Two Beacon buildings": the SkyDeck door is on the tallest tower ("Beacon Tower SkyDeck") while the Beacon Penthouse building is `bld.downtown.tower.crown` at (240,187) | `before_p_brut1.png` toast | naming | NOT DONE (data, owner/lead decision) |
| 16 | Hillcrest / Maplewood roofs are nearly all dark slate; the streets read a little uniform from above | `ov_hc1.png`, `ov_hc2.png` | art variants | NOT DONE on purpose — owner choice, see below |
| 17 | Snowfall is faint when zoomed out; fog is good; night and dusk are good everywhere checked | `wx_snow_mw.png`, `wx_fog_hb.png`, `ovnight_dt1.png` | weather fx | note only |
| 18 | Stale debt: "taqueria shows PIZZA". Taqueria El Farolito is now a unique room with its own `pf.counter`; `pizza.counter` is only used by the pizza place and the unused generic `eatery` template | `src/scenes/rooms/places_food2.js` | — | **DONE** as a safeguard (`p.sign`), debt can be struck |
| 19 | Stale debt: "terminal has no glass roof". The exterior terminal wings and hall have glazed barrel roofs | `ov_ap1.png`, `ov_ap2.png` | — | not a city-art debt (if it means the interior scene, that is the airport-interior lane) |
| 20 | Audio (out of scope, cannot be judged): `src/sim/_audio_lib.js`, `_audio_amb.js`, `_audio_sfx.js`, `_audio_music.js` (382 lines) exist; **there is no `src/sim/audio.js`** and nothing outside those files imports them, while five UI files reference `G.audio`. Only the show audio (`_shows_audio.js`) is wired | grep | sim | NOT DONE |
| 21 | `setWeather('clear')` and `isWet()` (known bug) | `src/sim/weather.js:98` | sim | NOT DONE (not art) |

## What changed (all in `src/art`, same ids, same sizes, same anchors, same variant lists)
Scratch folder: `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/art/` — `before/` and `after/` hold every image named below.

1. **`src/art/civic/arts_street.js` — `bld.arts.vintage`, tattoo style.** Four looks picked from the seed (charcoal / deep teal / oxblood / indigo brick, each with its own neon pair,
   door colour, trim, and a painted flash emblem — rose, dagger, swallow, anchor — that glows at night; two looks get a striped awning, two a neon strip), plus a stone plinth and a
   soldier course. A wall colour passed by the world is still respected. The three Arts Quarter parlours now come out teal, oxblood and charcoal.
   Before/after: `set_tattoo.png` (day + night, exact placed params), `set_tattoo_winter.png`, `gal_bld.arts.vintage.png`, city `*_p_tat1..4.png` (phone) and `*_w_tat1..4.png` (wide).
2. **`src/art/downtown/midrise.js` — `bld.downtown.office.brutalist`.** Real glass with a sky reflection, blinds and desk shadows in place of the mesh; concrete fins every third bay;
   accent spandrel panels wrapping the street corner; weather streaks; a coffered relief on the stair core with a lit accent block; accent door surround and soffit lights under the cantilever;
   louvres or an optional lit roof sign on the core; a planted roof terrace on some seeds. When the placement passes no colours, the seed picks one of three concrete/accent/glass sets,
   so the two blocks beside City Hall are now red-on-cool-grey and teal-on-warm-grey.
   Before/after: `set_brut.png`, `set_brut_night.png` (also shows the sign hook), `gal_bld.downtown.office.brutalist.png`, city `*_p_brut1..2.png`, `*_w_brut1..2.png`.
3. **`src/art/downtown/towers.js` — `bld.downtown.tower.round`.** Four finishes picked from the seed, colours untouched: 0 the original helipad; 1 a sky garden with a glazed pavilion and a
   lit sky-lobby floor; 2 white vertical fins and a round mechanical penthouse with a lit ring; 3 two-tone glass, a lit crown line and the helipad. Canopy colour follows the finish.
   The four blue towers now get four different finishes and the two cyan ones differ. Optional `p.kind` 0-3 forces one.
   Before/after: `set_round.png`, `set_round_winter_x2.png` (winter + flipped), `gal_bld.downtown.tower.round.png`, city `*_p_round1..6.png`, `*_w_round1..6.png`.
4. **`src/art/examples/basics.js` — `ex.shop`.** Stone plinth, string course and cornice, shutters and flower boxes, framed shopfront with goods, proper door with step and handle,
   sloped striped awning with a valance (colour from the seed), chimney; the winter snow now lies on the roof slope instead of floating as a flat rectangle.
   Before/after: `set_exshop.png`, `set_exshop_winter.png`, `gal_ex.shop.png`, city `*_w_exshop.png`.
5. **`src/art/venue/restaurant.js` — `furn.pizza.counter`.** New optional params `sign` (up to 5 letters), `sc` (sign colour), `trays` (three colours; neutral hot trays replace the pizzas
   when a sign other than PIZZA is given). Default output is unchanged. After: `set_counter.png`, `gal_pizza.counter.png`.

Checks: `node tools/build.mjs` passes; galleries for `art/civic`, `art/downtown`, `art/examples`, `art/venue/restaurant` run with no errors in summer and winter, and downtown/arts/examples flipped;
the city still has 4,371 objects with the same placement params; lobby pois next to the two brutalist blocks are unchanged (Kessler Block 202.8,246; Ostrander Institute 230.8,246).
**Not verified:** a real phone, the in-game look of the counter inside a room (only the gallery render), and performance (sprites are cached; no size grew).

Reverted during the work: wall lamps on the tattoo fronts (their night halo read as dither artefacts), a plaza sculpture in front of the brutalist block (it sat on the walkway outside the footprint),
ground light pools under the cantilever (checker blobs), solar panels on tower finish 3 (overlapped the helipad).

**Warning learned the hard way:** appending entries to a placed asset's `variants` array changes which variant the city generator picks for existing buildings (I added two and a building
changed its look; I removed them again). Never grow `variants` of an asset that is already placed; add params instead.

## Hooks the lead needs to add (non-art files, exact changes)
1. **Tattoo names** — `src/world` placement of `bld.arts.vintage` passes `name: 'INK & IVY'` three times (at 196,95 / 224,90 / 254,90). Pass the names the places registry uses for those doors
   (the discovery toasts say "Ink & Ivy Tattoo" and "Ink & Ivy Vintage"), so each sign matches its place.
2. **Office signs** — pass `sign` to the two brutalist blocks: `{ ..., seed: 9980, sign: 'KESSLER' }` at (194,241) and `{ ..., seed: 4037, sign: 'OSTRANDER' }` at (222,241) (the `sign` field of the lobby specs
   in `src/scenes/rooms/lobbies2.js`). It draws a lit roof-level sign on the stair core. The round towers already draw `p.name` over the door: pass TIDEWATER / PELICAN / QUAY LABS / BRIGHTWATER / ATLAS the same way.
3. **Duplicate names** in placement data: second "ROPE WORKS" (209,331), second "BLOOM & PAPER" (243,152), second "COFFEE" kiosk (212,274).
4. **Fuel tanks** — railyard instance (329,317): pass `{ n: 2, seed: 9300, label: 'DIESEL', band: '#3f8a55' }` (params already supported by `bld.airport.fueltanks`). Airport instance (290,36): move it off the
   runway island to the apron edge near the hangars (for example around 284,50), keeping the windsock where it is.
5. **Generic eatery template** (`src/scenes/rooms/generic_venues.js:80`, only if it is ever used again): `V('pizza.counter', .5, 2.5, { sign: c.sign.slice(0, 5), c: c.acc }, ...)`.

## Left for a later artist / other lanes
- Items 1-3 (ground painter: winter cover as soft drifts instead of 50% noise; water with shore foam, depth bands, varied ripples, frozen pond; a proper world edge) — the largest visible win left in the game, in `src/engine/ground.js`.
- Item 7 (rain: overcast tint by day, wet-road sheen, puddles), item 17 (snowfall density).
- Items 8-10 (home thumbnails drawn from the real building sprites; title camera on a landmark; larger creator preview).
- Item 20 (audio wiring).
- A piece-by-piece read of the gallery tiles I did not open (see the honest count above).

## For the owner to choose
- **Roof colours in Hillcrest and Maplewood** (item 16): the houses are finished, but most roofs are dark slate. I can add warmer roofs (terracotta, moss green, weathered cedar) by seed. It would recolour streets you already like, so I left it alone.
- **How far to take seed-picked variety**: the same approach used on the towers and tattoo shops would also work for the 7 harbor lofts, 8 brick offices and the townhouse rows, if you want less repetition there.
- **Beacon naming** (item 15): which tower is "the Beacon Tower" — the SkyDeck one or the penthouse one?
