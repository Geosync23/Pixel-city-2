# Unique homes (2g-5) — every player home has its own size, shape, finishes and bathroom
Files: `src/scenes/rooms/homes.js` (all 9 `SHELLS` rewritten, `v: 2`; `bathDoor.off`; `homegarden` fixture), NEW `src/art/home/homes_unique_art.js` (17 assets `furn.home.build.*`),
`src/sim/housing.js` (voids, wall cover, shell-version migration, smarter box spots, stricter `check`), `src/data/homes.js` (`tiles`, `layout`, a few pros/cons).
Two small UI edits outside my files: `src/ui/phone_homes.js` (Size row shows `h.tiles`; `h.layout` paragraph on the detail page) and `src/ui/furnish.js` (plan colours for `void`/`grass`).

## The nine homes (main room w x d, bathroom w x d)
| home | size | bath | concept |
|---|---|---|---|
| juniper_court | 7x9 | 3x4 | Old Town brick walk-up. L-shape: the stairwell is a void cut-out (front-right, wooden banister). Bakery flue block in the corner (glowing hatch), bay window + window seat (usable seat). |
| saltbox_lofts | 10x6 | 4x3 | Long low net-loft, whitewashed boards, h 3.4. Two tall sea windows, boarded sleeping nook (pony wall + post) with a porthole, galley at the far end. Porthole bathroom. |
| easel_house | 8x8 | 5x3 | The mustard `build.block` in the back-left corner IS the bathroom (door on its front face, `bathDoor.off`); room wraps around it. Front door on the left wall, sleeping alcove, paint-splattered concrete studio corner + clerestory. |
| birch_lane_flats | 9x7 | 4x4 | Striped wallpaper, garden level. Bathroom block juts out of the back wall on the right (dog-leg), carpet bed corner, garden window with pots. |
| marlowe_1br | 11x9 | 5x4 | Pre-war: walled bedroom (pony walls with a doorway gap), chequered kitchen behind a breakfast bar, picture rail, skyline window. Chequered bathroom. |
| cannery_loft | 14x10 | 5x5 | Brick h 3.6, three arched factory windows (sea), two cast-iron columns under steel beams, raised board sleeping platform (decal), studio nook. Brick/concrete bathroom with washer. |
| sycamore_house | 17x12 | 6x5 | Kitchen-diner, fireplace lounge, walled bedroom, staircase, and a back garden: grass floor, picket fence, vegetable bed ("Tend the garden bed" = the `garden` activity; perk home_garden is now real). Tub + shower. |
| villa_belvedere | 18x14 | 7x5 | White stone, h 3.2: arched terrace doors + arched windows (hills/sea view), arch into the kitchen, columned loggia, balustraded terrace with lemon trees, front door on the left wall. Stone bathroom, arched window. |
| beacon_penthouse | 19x13 | 8x6 | Floor-to-ceiling skyline glass on both walls (windows glow at night), sunken lounge (decal) with fixed sofa set, glazed master suite, roof terrace with glass railing. Dark bathroom with skyline window. |

## Shape tools (how to make a non-rectangular home)
- `floors: [{ x0,y0,x1,y1, floor: GT.void }]` = hole in the floor plan (whole tiles; only at the FRONT edges, the two back walls are always full length). Housing: `voidRects()` -> blocked for furniture, boxes, rugs.
- `build.block` (full-height mass with the wall finish) against a back wall = a jog in the wall / the bathroom volume. Nothing can hang on the wall behind it (`wallCover`). A block hides whatever stands directly "behind-left" of it
  (camera looks along -x,-y): keep the tile row beside a block on a back wall empty (Birch: x 5..6).
- `build.wall` = pony partitions (h 1.2, dark cut top = dollhouse cut; full height hides the room behind). Collision 0.5 thick.
- `bathDoor: { wall, at, off }`: with `off` the door stands on the front face of a block, `off` tiles out from that wall (floor item, non-solid); `bathReturn`/`keepRects` follow it.
- Decals: `build.step` (`sunk` pit / `raise` platform — visual only, the engine has no interior height), `build.lightpool`, `build.paint`. Overhead: `build.beam`, `build.arch` (place with `z`).
- Use multiples of 0.5 for all coordinates (World.place snaps to 0.5; housing rects do not).
- Wall art: `build.window` (views sea / city / garden / hills / brick / sky; `arch`, `shelf`, `post`, `curtain`), `build.window.porthole`, `build.door.terrace`, `build.lifebuoy`. Others: column, stairs (high end at local x = 0), railing (glass / iron / wood / picket / stone), windowseat [seat], lemontree [plant], gardenbed [homegarden].

## Save compatibility
- `SHELLS[id].v` (all 2 now) vs `G.state.home.shellV` (set on move-in; missing in old saves = 1). On load `norm()` runs `migrateBath()` (older saves) and then `migrateShell()`:
  1. landlord's pieces (`inc`) go to their new slots; 2. every other piece stays where it stands if `check()` still passes and it does not cover / face a fitting's use spot;
  3. else the nearest free spot (0.5 grid, same rotation preferred) whose own front is reachable and which blocks nobody's front; 4. else a plain valid spot; 5. else storage (`stay` for landlord's pieces). Nothing is deleted.
  One toast on the next scene change ("... has been rebuilt: N of your things were moved ..., X is in storage").
- To change a shell later: edit it, bump its `v`. The migration is generic.
- `check()` is slightly stricter for everyone: void cut-outs, wall behind a block, and "That would block the way" now also covers sealing off the spot you use a piece from. Boxes avoid doorways, use spots and pockets.

## Verified (headless evals, numbers from the last run)
- `node tools/build.mjs` ok; 0 page errors / warnings in every run (also once with `--dist`).
- New game in each of the 9 homes: included items all placed (5/5 or 3/3 or 4/4), 3/3 boxes shown, every interactable's use spot reachable by flood fill from the spawn (10-19 per home), bathroom enter -> all fixtures reachable -> back lands
  next to the door, Decorate opens/closes. 9 distinct main sizes, 9 distinct bathroom sizes.
- Old saves: for each home a save at the OLD coordinates (old slots, no `shellV`): realistic set (11 player pieces + included) -> 9/9 homes nothing lost, all valid, all reachable, idempotent on a second load;
  stress set (22 player pieces, more than a studio's slot limit) -> 9/9 nothing lost (1-3 wall pieces to storage in the studios), all reachable except one potted plant in Birch. Pre-bathroom save (no `bathV`) of Sycamore: shower + tub to the bathroom, rest kept.
- Decorate API in Juniper/Easel: void, outside, doorway, wall-behind-block refused; place / move / rotate / store ok. Rent Marlowe from a furnished studio: boxes arrive, `shellV` 2. Garden bed starts the `garden` activity. Save -> load roundtrip unchanged. Story homes' bathrooms still work.
- Screenshots looked at: all 9 main rooms, all 9 bathrooms (montage), Nestly list + detail + realtor listing plans, a migrated Juniper with the toast, Decorate open in Easel, art gallery sheet.

## Not verified / gaps
- No real pointer drag in Decorate (API calls + opening the tray only). No NPC guests invited. Night / other seasons of the new art not looked at (gallery `--night` runs without errors). Pathfinder walks not run (flood fill only).
- Raised/sunken areas are visual only (characters and furniture stand at floor level).
- Optional extra listings (walk-up, firehouse, houseboat) NOT done: a new home needs a `door:home:<id>` poi on a city building (`src/world/_blocks.js`, not mine) because places / navigator / taxi / Nestly all key on that poi.
- The Nestly list picture is the building exterior (unchanged); only the realtor window (`furnish.js plan`) draws the shell.
- Marlowe / Cannery arrive unfurnished apart from kitchen + shower (as before): big empty floors until the player furnishes.
- A build.block hides the wall strip beside it (see above); a player can still put furniture in that blind corner.
