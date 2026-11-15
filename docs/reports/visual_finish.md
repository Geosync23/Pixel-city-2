# Visual finish, part 2 — ground, water, world edge, weather look, three UI screens, sign hooks, audio wiring (2026-11-15)

Worker: graphics lane (Wave C "unfinished art", the items the art audit found outside `src/art`). No git commands were run.
Evidence: `out/shots/vf_before_<name>.png` / `out/shots/vf_after_<name>.png` (same camera, same time), plus the sheets `vf_cmp_*.png` and `vf_ui_dpr3.png`.
Scratch (tools, specs, a snapshot of the tree before my edits): `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/visual2/`.

## Status per item
| # | Item | Status |
|---|------|--------|
| 1a | Winter ground cover | DONE |
| 1b | Water (depth, ripples, foam, pond edge, frozen pond) | DONE |
| 1c | World edge | DONE |
| 2 | Daytime rain / storm look, snowfall when zoomed out | DONE. `isWet()` bug: already fixed by the QA lane (qa_nav #13); re-verified, nothing to change |
| 3 | Home-picker thumbnails, title backdrop, creator preview | DONE |
| 4 | World-data hooks (names, signs, fuel tanks) | DONE, except the SkyDeck round tower, left unnamed (the "two Beacons" naming is an owner/lead decision) |
| 5 | Audio wiring (`src/sim/audio.js`) | DONE as wiring, verified by API only. Nobody has heard it |

## 1. Ground, water, world edge
New file `src/engine/terrainfx.js` (pure, no DOM) holds everything; `ground.js` calls it per tile. All of it runs once per chunk (chunks are cached canvases), never per frame.
- **Fields per world** (`fields(world)`, lazy, rebuilt when `world.version` changes, about 30-90 ms): distance to the shore, open sea vs inland water, still (closed) water bodies, soft-shore flags, distance to kerb / verge / building for paved tiles, distance to kerb for road tiles.
- **Winter**: the 38% salt-and-pepper noise is gone. Paved ground (sidewalk, plaza, brick, cobble, concrete, boardwalk) is banked with snow along kerbs, verges and building walls, with a shaded lower rim, and trodden clear in the middle (a few thin drifts in large open areas). Roads are ploughed, with slush along the kerb. Loose ground (sand, dirt, soil, gravel) is mostly covered in drifts; rock, ballast and tarmac lightly. Cleared ground is slightly darker (damp).
- **Water**: four depth bands by distance from the shore with dithered, wobbling boundaries (the old 1 px row texture is kept); hashed, staggered wavelets instead of the foam stamp on a grid; white surf foam plus a second swash line along every sea coast; a light rim on inland water; soft shores (grass, sand) get a pebble / wet-sand bank that follows a smoothed contour, so the pond staircase reads as a natural edge. Bridges and piers are not treated as shore.
- **Frozen water in winter**: every closed water body freezes (ice, snow drifts, cracks, skate marks, snow bank at the edge). That is the Duck Pond and also the river basins between the downtown decks/bridges. Open water gets ice shelves along inland shores. See "Owner choices".
- **Animated water**: new `src/sim/waterfx.js` (a `G.underlays` hook): sun glints and drifting wavelets on open water, none on ice or indoors, fewer at night, no glints in rain/fog. Pre-allocated pool of 240.
- **World edge**: the map now continues for 2 chunks (32 tiles) as "outskirts": the bay runs on as water, land continues as meadow, forest and patchwork fields (forest to the north and west, fields to the east, open meadow around the airport approach), roads that reach the edge continue, gentle hills. Everything tints toward the sky colour and dithers away between 8 and 21 tiles out. The brown slab is gone (no skirt on worlds with outskirts). Trees are the real tree sprites, drawn into one extra canvas per outskirts chunk. Only the world named `city` has outskirts; interiors are untouched.

Shared engine edits:
- `src/engine/ground.js`: import of `terrainfx.js`; `renderChunk` rewritten around the same tile loop (painter lookup `P(type, bank, landUse)`, heights/types through `HH`/`T` so chunks outside the map work, border lines skipped where a bank draws the shoreline, skirt only when the world has no outskirts); new export `outskirtChunks(world)`. `GROUND_PAINT` is unchanged.
- `src/engine/render.js`: chunk range extended by `outskirtChunks(world)`; outskirts chunks get `spr.over` (tree layer, built by the new `treeLayer()`), drawn after all ground chunks.
- Before images: `vf_before_win_*`, `vf_before_wat_*`, `vf_before_e_*`. After: same names with `vf_after_`. Sheets: `vf_cmp_winter_phone1.png`, `vf_cmp_winter_phone2.png`.

## 2. Weather look
- `src/sim/_weather_fx.js`: daytime overcast (a cool grey multiply, scaled by rain intensity and switched off as it gets dark, so night and dusk are unchanged); puddles and road sheen (`under()`, six puddle shapes placed by tile hash on flat road / pavement, drawn from per-chunk lists, with rings in random puddles while it rains); particle counts scale with the visible area (they were tuned for zoom 3 and thinned out when zoomed out); storms use a longer slanted streak and 1.4x the drops; snowfall is 1.25x denser, and zoomed out the near layer mixes in larger flakes.
- `src/sim/weather.js`: new `wetness` 0..1 (fills in about 12 game minutes of rain, dries in 60-110; not saved), `current().wetness`, and a `G.underlays` hook that calls `fx.under`. Puddles linger after the rain stops. In winter puddles are drawn at half strength.
- Fog, cloudy, night, dusk: untouched (`vf_cmp_unchanged.png`).
- `isWet()`: `setWeather('rain')` -> true, `setWeather('clear')` -> false, on both the old and the new tree. No change made.
- Before/after: `vf_*_wx_p_*` (phone), `vf_*_wx_w_*` (wide), `vf_*_snow_*`, sheet `vf_cmp_rain_snow_phone.png`.

## 3. UI screens
- **Home picker** (`src/ui/title.js` `homeArt`, `title.css`): each card shows the real building sprite of that home (the building its `door:home:<id>` belongs to) on a ground patch, 104 px. On a dense screen it is drawn at a whole number of device pixels per art pixel (crisp at dpr 3: `vf_ui_dpr3.png`); at dpr 1 it is a smooth reduction (soft, as in desktop tests). The toy house remains as fallback.
- **Title backdrop** (`title.js` `startPan`, `VIEWS`): a tour of five framed landmark views (Bay Wheel pier first, Market Square, City Hall clock tower, Gull Point Lighthouse, Duck Pond), each drifting about 24 s, then the backdrop dips to dark behind the logo and cuts to the next. The camera pulls back to the widest player zoom while the title is up and the previous zoom is restored on Continue / New Game. `?tview=N` starts at view N (testing). `vf_after_title0..4.png`.
- **Creator preview** (`src/ui/creator.js`, preview drawing only: `draw()`, `fit()`, `CROPS.stage`): tighter crop, largest whole-number scale that fits (10x on the phone, was 8x), feet standing on the floor band with a pixel shadow, stage 292 px tall on phones (was 250). `vf_after_creator.png`, `vf_ui_dpr3.png`.

## 4. World-data hooks
`ob.p.name` is the classification key in `sim/public_places.js` and `sim/lobbies.js`, so changing it would rename or reshuffle places. New `src/world/_dress.js` (added as the last build step in `_city.js`) leaves every placement param alone and wraps the object's asset so only the drawn text changes:
- tattoo fronts: (196,95) stays INK & IVY; (224,90) IVY VINTAGE; (254,90) INK & ZINES
- brutalist blocks: roof signs KESSLER (194,241) and OSTRANDER (222,241)
- round towers: TIDEWATER (182,283), PELICAN (222,282), QUAY LABS (238,159), BRIGHTWATER (251,253), ATLAS (250,283)
- duplicates: second ROPE WORKS (209,331) -> SMOKEHOUSE; second BLOOM & PAPER (243,152) -> BLOOM RIVERSIDE; second COFFEE kiosk (212,274) -> ESPRESSO
- railyard tanks (329,317): DIESEL with a green band
- `src/world/_airport.js`: airport fuel tanks moved from (290,36) to (277,93), on the hangar-row concrete beside the cargo shed; the windsock stays.
Checked: no rule missed (`world.dressMiss` empty); the only object difference against the earlier tree is the tank move (a university that appeared in the same diff is another lane's work); places registry otherwise identical. Seen in shots: IVY VINTAGE, ESPRESSO, DIESEL, KESSLER / OSTRANDER lit at night, the moved tanks, the empty runway island. Not individually looked at: INK & ZINES, SMOKEHOUSE, BLOOM RIVERSIDE and the five tower names (drawn by the same mechanism).

## 5. Audio
New `src/sim/audio.js` exposes `G.audio` from the four `_audio_*` libraries: `sfx(name, opts)`, `setVolume / getVolume`, `music(id|null)`, `stinger(name)`, `unlock()`, `info()`.
- Nothing is created before the first pointer / key / touch. Without Web Audio every call is a silent no-op.
- State slice `G.state.audio = { master, music, sfx }` (the object the Settings sliders already write); levels kept under `phone.settings.audio` in older saves are adopted. The "speakers are still being unpacked" note in Settings disappears because `G.audio` now exists.
- Ambience follows scene, district, day/night and weather; music picks a tune for the moment (title, morning, day, evening, night, rainy, interior, train), plays it 2-3 times, then leaves a 45-105 s gap; it steps back while a show's own music plays. Thunder follows the weather's `thunder` event; a door sound plays on entering / leaving interiors.
- Aliases for names callers already use that the library lacks: confirm, tap -> click; buy -> pay; success -> skill; place -> clack. Unknown names are ignored and listed in `info().sfxUnknown`.
- **Verified by API only**: context `running` after a click, harbour ambience layers created, 11 of 11 known/aliased sounds accepted, storm adds rain + rumble layers, music starts ("day"), volumes persist through save/load, zero errors; with `AudioContext` removed: no errors, calls return false. **Nobody has heard it**: loudness, mix and whether the tunes are pleasant are unknown.

## Performance (headless Chromium, 390x844, zoom 2; not a phone)
| View | fps before / after | render ms per frame before / after |
|------|-------------------|-----------------------------------|
| Harbor, night, storm | 60 / 60 | 1.87 / 2.75 |
| Downtown, winter, snow | 60 / 60 | 2.70 / 2.77 |
| Pier, summer day | 60 / 60 | 0.73 / 0.76 |
| Map corner (sea edge) | 60 / 60 | 0.19 / 0.22 |
| Downtown, day rain | 60 / 60 | 2.74 / 3.32 |
| Downtown, day storm | 60 / 60 | 2.66 / 3.89 |

fps is capped at 60 by vsync in both; the render time is the real comparison.
- **Chunk painting is slower** (one-off per chunk, 2 per frame while walking): about 5 -> 10 ms per winter city chunk, 7 -> 10 ms per water chunk, about 15 ms per outskirts chunk on this machine. On a phone this could show as a short hitch when walking into unpainted ground; not measured on a phone.
- JS heap: within noise (57-86 MB before and after). Extra memory: six tile fields for the city (about 3.5 MB) and one tree canvas per cached outskirts chunk.

## Verified vs not
- Looked at (before/after): winter in all nine districts + river, phone and wide; bay, pier, beach, lighthouse, river, both ponds by day; pier and pond at dusk and night (wide only); all four edges and four corners by day, one edge at night, two in winter; rain and storm by day in downtown, Old Town, harbor (phone and wide); snowfall in two districts; title (5 views), creator, home picker at dpr 1 and dpr 3; summer day, fog, night rain and dusk unchanged.
- Run: `node tools/build.mjs`; save -> title -> Continue on the source and the dist build (zoom restored, volumes kept, 0 page errors); title tour cut; a winter interior (cafe) renders as before.
- Not verified: a real phone (speed, hitches, sound); the full New Game flow to the end (only as far as the creator opening); the train-ride and air-tram scenes; water animation was only seen as stills.

## Owner choices
- **How wintry**: sidewalks are trodden clear in the middle and roads are ploughed. More snow (narrower paths) or less is one constant each in `snowWrap`.
- **Frozen river**: the downtown river basins freeze along with the Duck Pond (boats sit on the ice). If only the pond should freeze, that is a one-line size limit.
- **Puddles** stay for about an hour of game time after rain. Shorter or longer is one number in `weather.js`.
- **Title tour**: which landmark comes first (now the Bay Wheel pier), and whether the camera should pull back on the title at all.
- **Sign wording**: IVY VINTAGE, INK & ZINES, SMOKEHOUSE, BLOOM RIVERSIDE, ESPRESSO are my picks from the registry names; all are in `src/world/_dress.js`.
- Still open from the audit: Hillcrest / Maplewood roof colours; which tower is "the Beacon".

## Files
New: `src/engine/terrainfx.js`, `src/sim/waterfx.js`, `src/sim/audio.js`, `src/world/_dress.js`.
Edited: `src/engine/ground.js`, `src/engine/render.js`, `src/sim/weather.js`, `src/sim/_weather_fx.js`, `src/ui/title.js`, `src/ui/title.css`, `src/ui/creator.js` (preview only), `src/world/_city.js` (one import + one build step), `src/world/_airport.js` (tank position).
Debt that can be struck: winter dither, flat water, world edge, daytime rain look, toy home thumbnails, title camera, creator preview size, duplicate / mismatched signs, fuel tanks on the runway island, missing `sim/audio.js`. STATUS/BACKLOG still list the `isWet` bug: it is fixed.
