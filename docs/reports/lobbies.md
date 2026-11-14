# Lobbies — notes (src/sim/lobbies.js, src/scenes/rooms/lobbies.js + lobbies2.js, src/art/venue/lobby_art.js)
- **46 new enterable lobbies** on existing door-less buildings, converted in place: 23 residential ("X — Lobby", open 24h) + 23 office (open 07:00–20:00, closed toast otherwise).
  Districts: downtown 18, oldtown 13, harbor 6, hillcrest 6, maplewood 1, railyard 1, airport 1. Public places still 61; no lobby sits on a building that owns a door/stall poi or was claimed by public_places.
- Poi `door:lobby:<n>` (type door, room `lobby:<n>`, `lobby: 'res'|'office'`, name, district, blurb) -> flows into G.places (kind 'venue', `.open()` follows the hours, `.lobby`), addresses, the phone map,
  the Wander guide and the welcome glow/door light (stalls.js picks up every door poi) with no edits elsewhere. City interactable: "Enter lobby — <name> · <address>".
  n = index of the building among all lobby-class buildings in scan order (stable; gaps are buildings that already had a door: lobby:5, :10, :40 do not exist). Nothing is saved.
- **Module order is 57, not 60**: it must run after public_places (55) + showpieces (56, SkyDeck door) and BEFORE places (58), otherwise places/guide never see the pois. The lazy path
  (`?scene=int:lobby:<n>` / a save made inside a lobby, before the city scene exists) reserves the SkyDeck tower itself so ids are identical in both paths (checked).
- `G.lobbies`: list() -> [{ id, n, kind, key (building class), style, name, x, y, district, poi, ob, hours ([7,20] | null), spec, address }], get(id | n | 'door:lobby:n'), nearest(kind|style|null, x, y),
  isOpen(id), byDistrict(), census() -> { total, res, office, district, style, skipped }. Events: 'lobby:notices'(id), 'lobby:directory'(id), 'lobby:coffee'(id, drink).
- Guide: every building calls `registerInfo(name, { blurb, signature, tryThis, activities: ['seat'], kind: 'apartment'|'office', hours })` (unique_rooms.js).
- **Classification** (sim/lobbies.js `classOf`): offices = downtown towers twin / twotone / round / setback / banded, office.brutalist, office.mirror, MBTV (civic.radiotower), harbor master,
  Ironside Foundry (front office), BayJet hangar, Town Hall (cityhall), Shed 5 (ind.warehouse.arched 'SHED 5'). Residential = old-town row houses with 3+ floors (gable, brick, stucco, bay, timber, mansard),
  Sunny Court (apartment.garden), res.townhouses ("courts"), harbor SAIL LOFT / NET LOFT warehouses. Left alone: houses, duplexes, 2-floor rows, hotels, police, depots, anything with a door.
- **Rooms**: one hand-written spec per building in `lobbies2.js` (name, sign, style, size, mirror, feature words, palette, guide text; `specFor` adds a numeral if the city ever grows).
  13 layout families in `lobbies.js`: walkup (3 variants), court (2), loft (2), resgrand | deco, brutal, glass, corp (2), cowork, media, harbor, plant, civic. No two lobbies share size + fixture set
  (checked: 0 duplicates); 4–10 npcSpots each (staff: receptionist / doorman / guard / barista), music 'quiet' (residential, Town Hall) or 'office'. All coordinates are on the half-tile grid (World.place snaps).
- **Things to do** (fixture tags, only active inside lobby rooms): sit on any bench / sofa / settee / fountain rim (existing auto "Sit"); `lobby_board` notice boards (3 rotating notices per day, +4 fun once a day),
  felt/digital directories (fictional tenants), tide/safety boards; `lobby_mail`, `lobby_buzzer`, `lobby_packages` (flavour, resident names per building); `lobby_desk` (concierge / reception / security lines);
  `lobby_lift` + `lobby_stairs` ("Residents only" / "Staff only — you don't work here"; defensive hooks `L.homeId` vs G.housing.current().id and `L.venue` vs G.jobs.current().venue — neither is set today);
  `lobby_gate` security turnstiles (lifts behind them are decorative, `item.gated`); `lobby_coffee` kiosks (Meridian, Tidewater, Quay Street Labs, Shed 5 Bean Bar: 4 drinks/snacks, G.money.pay, 6 min, energy/fun);
  `lobby_door` (courtyard, Studio A, council chamber, shop floor: flavour). Restroom doors `furn.lobby.restroom` carry the tag `toilet` (bladder.js gives them "Toilet"); a local fallback exists if nothing claims the tag.
- **New art** (`furn.lobby.*`): mailboxes, lift (styles steel / deco / cage / glass / freight), stairs, restroom, board (cork / felt / digital / safety), panel (wood, sunburst, relief, marble, logo, screens,
  onair, chart, buoy, flags, awards, mural, plane), sconce, intercom, timeclock, desk (wood / marble / deco / glass / concrete / steel / green), podium, turnstile, rail, packages, coffeebar, column
  (marble / deco / concrete / brick / steel / wood), bike, umbrella, settee, chandelier (crystal / deco / ring / industrial), inlay (star, compass, checker, border, terrazzo, herring, stripe, diamond).
- **Gaps**: the door glow stays on for closed offices at night (stalls.js only checks that the room exists); facades are unchanged (no new door art on the building); Town Hall is included as an
  "office" lobby (drop the `cityhall` line in CLASS if a real Town Hall interior is planned); no lobby maps to a job venue or a player home yet; a few old-town doors sit under the rail viaduct on Western Ave;
  NPCs never go through the turnstiles; arts district has no door-less apartment / office building, so no lobby there. Wanted activities (not added): `read_noticeboard`, `lobby_coffee` as real activity ids.
