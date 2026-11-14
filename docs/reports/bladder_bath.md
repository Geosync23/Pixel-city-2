# Bladder need, toilets, restrooms, bathrooms as their own room — notes
Files: NEW `src/sim/bladder.js` (logic, header has the full API). Edited: `src/data/needs.js` (need + `BLADDER` tuning + 3 moodlets), `src/data/activities.js` (`use_toilet`, `wash_hands`, tags `toilet`/`sink`),
`src/sim/needs.js` (comments only: the need is data-driven), `src/scenes/rooms/homes.js` (bathroom shells + doors), `src/sim/housing.js` (rooms of a home + migration), `src/sim/navigator.js` (`bladder` kind + `addSource`),
`src/ui/phone_tips.js` (one line: `G.tips.register(tip)`). `src/ui/hud.js`/`hud.css` needed NO change (bars are built from `NEEDS`).

## Need (src/data/needs.js)
- `bladder`: 100 = comfortable, start 70, **-17/h awake, -5/h asleep**. Bands: >=85 Comfortable, >=30 Fine, >=12 "Need to go" (`need_to_go`, mood -4), <12 "Bursting" (`bursting`: mood -12, workPerf -10, walkSpeed x1.1, xpMult .85).
  At 0: `atZero.type 'status'` = one toast, nothing else (no pass-out, no accident). Not part of `MOOD.weights` (only the moodlets touch mood).
- `BLADDER.drink`: default 10, water 8, caffeine 14, alcohol 16, soup 4 (taken off on `'inv:use'`, so bag drinks AND `G.shop.eatIn` dishes count). `relieved` moodlet (+4 mood, 60 min) when you go under 35.
- Measured: 17.0/h awake, 5.0/h asleep; 100 -> low in 250 min, -> bursting 315, -> 0 in 355 awake minutes. Simulated day (07-23 awake, 4 drinks, go when < 30): 4 daytime visits + wake-up at 29 = **5 visits per 24 h**.
- HUD now shows 6 bars + the mood face (the brief said "7th bar"; there were 5 needs before). Width 207 px of 390 on phone portrait. Icon `need.bladder` (toilet roll) is registered from bladder.js into `ICONS`.

## Toilets, sinks, restrooms (src/sim/bladder.js)
- `G.bladder = { useRestroom({where?, text?}) -> Promise<bool>, useToilet(fx), washHands(fx), hasRestroom(roomId) -> true|false|null, drinkAmount(item), parkRestrooms(), COUNTER_TAGS }`.
  State `G.state.bladder = { unwashed, visits }`. Events `'bladder:relief'({kind:'toilet'|'restroom', where})`, `'bladder:drink'(itemId, points)`.
- Fixture tag `toilet` -> "Toilet" (`use_toilet`: sit on the seat, 4 min, +100, -3 hygiene). Fixture tag `sink` -> "Wash hands" (`wash_hands`: 1 min, +6 hygiene, +3 more within 30 min of a toilet visit). Works in any room
  (homes, story homes, lobby restrooms). Both interactables carry `guestOk: true` so story homes do not filter them out.
- Venue "Restroom": on `'room:build'`, every non-home room with a counter fixture (`COUNTER_TAGS`: checkout, till, host, reception, ticket(s), counter, bar, desk, info, boxoffice, mallcounter, airport desks ...) and no `toilet`/`restroom`
  fixture of its own gets a restroom door (`furn.home.wall.door.room` + blue sign) on a free, customer-reachable piece of back wall, else a blue sign stand near the counter. Use = fade out/in, 5 min, bladder 100, +3 hygiene.
  Survey of all 79 venue rooms reachable from `G.places`: 49 doors, 30 sign stands, 0 without, 0 blocked spots (cafe, bar, grocery, central_station = sign stand; airport terminal, deptstore = door). `scene._wc` = 'door'|'sign'|'own'.
- City: every `bld.civic.restroom` object gets a "Public restroom" interactable at its door (one pavilion exists, at 82,188).
- Navigation: `G.nav.find('bladder')` = venues with a restroom (`hasRestroom`), airport, nearest park pavilion (via new `G.nav.addSource(kind, fn)`), and "Home (your bathroom)". The HUD "tap a need" chooser uses it unchanged.
- Tip `bladder` (topic Wellbeing, "Nearest restroom" button) registered through the new `G.tips.register`; shown the first time the need goes low (subject to the one-tip-per-hour limit).

## Bathrooms as rooms
- Room ids: `home:<homeId>:bath` for all 9 player homes (dynamic, `G.housing.roomDef(id, 'bath')`) and `home:sibling:bath`, `home:grandma:bath`, `home:friend:bath` (static).
- **Per-home data in `SHELLS[id]`**: `bathDoor: { wall, at, p? }` (door item with tag `bathdoor` added by `bathDoorItems(sh)`; housing keeps 1.5 tiles in front of it clear) and `bath: { w, d, floor, wall, fixed, slots: { shower?, bath? }, exit }`
  — a complete second shell written out per home (sizes 4x4 .. 7x6, own tile/wall colours, tub+shower in the three big homes). Story homes use the same two keys with `items` instead of `fixed`.
  Helpers in homes.js: `bathDoorItems`, `bathReturn`, `enterBath(mainId)`, `leaveBath(mainId)`, `bathDef(homeId, items)`. interior.js was NOT changed (exits already accept `use`; room-to-room is `G.go`).
- The main rooms lost their toilet / bath sink / mat / towel rack / washer (cannery) and the bathroom floor patch; `slots.shower` / `slots.bath` moved into `bath.slots`.
- Housing: placed items carry `r: 'bath'` when they stand in the bathroom. `G.housing.room()` -> 'main'|'bath'; `isHome()` is true in both; `check/place/move/rotate/shell()/roomDef(ownId)/refresh()` act on the room you stand in,
  so Decorate works inside the bathroom. A shower/tub placed from the main room is fitted in the bathroom automatically (toast).
- Save migration: `G.state.home.bathV`. Saves without it run `migrateBath()` on load: showers/tubs in the main room move to the bathroom slots (or any free bathroom spot, else storage). Saves without `needs.v.bladder` get the start value 70
  (existing `rebind` in sim/needs.js); `G.state.bladder` is created by `defineState` defaults.

## Notes for the "unique homes" worker (2g-5)
- When you re-lay out a home, keep `bathDoor` on a back wall ('y' or 'x') with nothing solid in the 1.5 tiles in front, and keep `bath` as its own object in the shell (edit sizes/colours/fixtures freely; `bath.exit` needs ~1 tile free around it,
  `bath.slots` must fit the home's included shower_t*/bath_t* — tub is 2x1, shower 1x1, both need the tile in front (+y, or +x when flipped) free).
- Do not put `shower`/`bath` back into the main `slots`: `included()` looks in `bath.slots` first. `keepRects()` already protects `door`/`exit` and `bathDoor`.
- Old saves keep main-room coordinates for everything else, so moving a `bathDoor` can land it behind player furniture; `check()` only guards new placements.

## Verified (headless, by eval) / looked at
- Decay numbers above; coffee -14 (80 -> 65 incl. decay), juice -10; home toilet 20 -> 100 with sit pose; wash hands +8.9 after a visit; restroom works in cafe, central_station, bar, grocery, airport:terminal, deptstore, park pavilion.
- All 9 player homes + 3 story homes: door reachable, enter bathroom, all bathroom interactables reachable, exit lands next to the door, no main-room bath fixtures left; zero warnings/page errors.
- Old save (no bladder, no bathV, shower + tub at the old main-room slots, extra sofa): loads, shower/tub migrated to `:bath`, sofa untouched. Place/move/rotate/store inside the bathroom, Decorate opens and closes there, shower placed from the main room goes to the bathroom.
- Screenshots viewed: HUD phone 390x844 + desktop 1280x720 (panel open), bathrooms of juniper, marlowe (toilet in use), penthouse, grandma, friend; sycamore + grandma main rooms with the door; cafe sign stand; central station sign stand.

## Gaps / not verified
- Street stations (the 7 without an interior) have no restroom; only Central Station's hall does.
- 30 venue rooms get the sign stand instead of a door because their back walls are full or lead behind the counter; the stand is non-solid and can stand in a walkway.
- Furniture thumbnails: `roomDef(ownHomeId)` without a room returns the bathroom while you stand in it, so Nestly's floor-plan thumbnail of your own home is wrong if opened from inside the bathroom (furnish.js would need to pass 'main').
- A second shower/tub is auto-placed at the first free bathroom spot, which can be in front of the sink.
- Not run: a real drag in Decorate inside the bathroom (API calls only), moving home with bathroom furniture (rent was refused in the test: listing locked), NPC/guest behaviour around bathrooms, the lobby worker's `toilet` fixtures (not present yet),
  the toilet tip notification actually appearing (rate-limited in the test), walking to the restroom spots (reachability checked by flood fill, not by the pathfinder).
- The 'bursting' walk nudge is +10% (hurrying), not a slowdown. No NPC uses toilets. Kitchen sinks also offer "Wash hands".
