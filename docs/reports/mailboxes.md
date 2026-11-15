# Mailboxes: lobbies for every apartment, your own box, curb mailboxes for houses (owner msg 115, BIBLE Direction update 23) — worker report

## What exists now
- **No mail basket in any home.** It was never saved (placed when the room was built), so old saves simply no longer get one; waiting mail keeps `where: 'home'` and is now taken out at the mailbox.
- **Every apartment-type home has a lobby** (12 homes). Nine NEW lobby rooms `lobby:h_<homeId>` made with the existing generator (`lobbyRoom`) + hand-placed extras, each a different family / size / palette:
  Juniper Court (brick walk-up, chequered floor), Saltbox Lofts (whitewashed loft, freight lift), The Easel House (mustard walk-up, mural), Birch Lane Flats (garden court), The Marlowe (pre-war, cage lift, doorman),
  Cannery Row (brick loft hall), The Beacon Tower (dark stone, fountain, concierge), The Inkwell (ink-blue walk-up), Meridian Tower Residences (its tower's existing lobby is an OFFICE lobby that closes at 20:00, so the flat got its own).
  Three homes use the residential lobby their building already had: Garret -> `lobby:27`, Sunny Court Garden Flat -> `lobby:25`, Net Loft No. 3 -> `lobby:47` (checked against the building at run time; a console warning if ids ever shift).
  Every one has a mailbox wall, stairs and/or lift, a bench / settee; a parcel shelf where the layout had room (Garret + Sunny Court have none: the parcel is then offered in the mailbox menu).
- **Routing, default `lobby`:** street door of YOUR apartment -> lobby -> "Stairs: up to Flat 3B" / "Lift: up to Apt 5C" -> your flat. "Leave" in the flat -> you arrive in the lobby in front of the stairs / lift -> "Exit to the street" -> outside your door.
  Homes that are not yours keep their listing card ("Look inside"); `G.housing.goHome()` (sleep wake-up, Continue, intro skip, "Take me home" jump) still lands inside the flat, and Leave from there goes lobby -> street, so nothing strands.
- **THE TUNABLE:** `src/data/mailboxes.js` -> `MAIL.ROUTE = 'lobby' | 'direct'`. `'direct'` = street door <-> flat as before, and each new lobby gets a side door poi `door:lobby:h_<homeId>` beside the front door
  ("Enter lobby — Juniper Court"; it becomes a place on the map). Try either without a rebuild: `?mailroute=direct` / `?mailroute=lobby`.
- **Your mailbox (apartments):** in the lobby of the building you live in, the wall's interactable is "Your mailbox · Flat 3B" -> menu: Take out the post (n) / Take your parcel from the shelf / Post my letter(s) in the slot / Open Maple Post.
  Your box is the cream door in a red frame (top row); a red flag + a small light above it when post waits. In lobbies you do not live in: "Mailboxes" (flavour) or, while you carry letters, "Post your letters" (the two used to sit on the same spot; now one shows).
- **Curb mailbox (houses):** 11 house homes + Nana's and Nora's (dressing) get a `prop.post.curbbox` scene entity between the doorstep and the road, one step beside the front path (never on asphalt, a doorstep or a bus stop; not solid).
  Three styles: painted wooden box with a little roof, US-style metal box, brick pillar with a brass slot. Yours: "Your mailbox", flag up while post waits, same menu ("Leave my letter and put the flag up": collected on the next morning round). Others: a line of flavour.
- **Parcels:** small parcel + you are out -> it waits (`st: 'wait'`) on the lobby's parcel shelf ("Parcel shelf: one for you") or on your doorstep (`prop.post.doorparcel`, "Your parcel: take it in"); notice says where. Taking it (or simply walking into your home) turns it into the usual delivery box. At home: "A knock at the door" as before. Big parcels: slip as before ("The slip is in your mailbox").
- **Writing a letter:** "Write a letter" on any free desk / table of your own home (dining table, coffee table, desk; a computer desk that already has a use gets a two-way choice). Needs Writing Paper as before.
  Starter studios have no table: the Maple Post app, tab Sent, has a "Write a letter" button (at home: writes on the spot; elsewhere: routes to the nearest post office). Post offices unchanged.
- **Notices / arrow:** the round's notice says "waiting in your mailbox in the lobby" / "in the mailbox at your curb". Maple Post inbox lists what waits and has "Show me my mailbox": the arrow (a navgoals pin) leads Leave -> lobby -> the box, or to the curb box, and clears when the post is taken out.
  A waypoint to your own apartment now continues through the lobby ("Go in: Juniper Court → home", "Stairs → home") and arrives inside the flat.
- **Old saves:** first load of a save made before this -> one notice (phone + toast): "Your post is in your mailbox downstairs now (1 waiting)..." / "...in the mailbox at the curb now...". Mark `G.state.post.mbx`; every save from now on carries it.
- **Intro:** at the door the hint is unchanged; in the lobby it becomes "Your flat is upstairs. Tap the stairs." (via `G.intro.hint`, keeps Skip intro).
- Texts made true: carrier lines, chain hint, Sealed Letter item, Maple Post app, first-time window `mail` and Bay Basics `post` (overridden at run time, see lead patches).
- **Carriers (item 6):** left as they are: the visible round already walks between street mailboxes, never to doors. Sending them to curb boxes / lobby doors was not done.

## API
`G.mailboxes` (header of `src/sim/mailboxes.js`): route(), kind(homeId?), lobbyOf(homeId), homeOfLobby(roomId), livesIn(scene?), through(homeId?), enter(), up(), leave(roomId), leaveTo(sceneId), navEdges(sceneId), doorOf(root), spot(), guide(), whereText(short?), title(), sync(), curb().
`G.post` gained: whereText, waitingParcels(), takeParcels(), showCollected. Parcel state `'wait'`; event `'post:parcel'(p, 'wait')`.

## Files
New: `src/data/mailboxes.js`, `src/sim/mailboxes.js`, `src/art/post/mailboxes.js` (`furn.post.mailwall`, `prop.post.curbbox`, `prop.post.doorparcel`).
Mine, edited: `src/sim/post.js` (basket code removed, mailbox menu, parcels wait, texts, API), `src/data/post.js` (one item text), `src/ui/phone_post.js` (inbox section, "Show me my mailbox", "Write a letter"),
`src/sim/lobbies.js` (residential lobbies use `furn.post.mailwall` instead of `furn.lobby.mailboxes`: same look; `homeId` set on a home's lobby).
**Edits in other people's files (all of them):**
1. `src/scenes/rooms/homes.js` `leaveHome()`: one line at the top: `const viaLobby = G.mailboxes && G.mailboxes.leave ? G.mailboxes.leave(homeId) : null; if (viaLobby) return viaLobby;`
2. `src/sim/navgoals.js` (4 small edits): GRAPH row `Leave` of a home -> `G.mailboxes.leaveTo(s) || 'city'`; `doorOf` falls back to `G.mailboxes.doorOf(root)`; `fixEdges` adds `G.mailboxes.navEdges(sid)`; new resolver `home_up` (default, prio 1).
No edit in homes data, home_more.js, world files, unique_rooms.js, firsttime.js, systems.js, apps.js, devmode.js, engine, core, hud, navarrow, kit, intro.js.

## Patches for the lead (lead-owned text; the game already shows this wording because mailboxes.js overrides it at init)
- `src/data/firsttime.js`, window `mail`, `text:` -> `'Letters wait in your mailbox: in the lobby of your building, or at the curb if you live in a house. To write back, use a desk or table at home, or any post office: they have paper, stamps and a counter for parcels.'`
- `src/data/systems.js`, system `post`, `how[0]` -> `'Letters come to your mailbox: in the lobby of your building, or at the curb of your house. Write back at a desk at home or from any post office.'`
- `docs/reports/post.md` / `lobbies.md` / `STATUS.md`: "a mail basket by the home door" is gone; lobbies now 46 + 9; hook `L.homeId` is used.

## What was run
Checks: `node src/data/validate.mjs` OK; `node tools/build.mjs` OK; `node tools/navcheck.mjs --rooms all`: 277 rooms (9 new lobbies included), 521 doors, 319 routes, all audit rows pass; ONE room failed: `observatory` "Gallery gate really leads to city"
(not touched by this work; earlier runs in scratchpad r9 / r10 show the same kind of clock-dependent observatory / Nana failures). Not re-run a second time.
**By real taps (Chromium, 390x844, touch; zero page errors in every run):**
- New game, Juniper Court, intro step `apartment_arrival` (started with `G.intro.goto`; the plane / airport / cab ride before it were NOT played): Walt's scene, hint at the door, tap door -> lobby with the new hint, tap stairs -> flat, intro finished, no basket in the room.
- Leave -> lobby (at the stairs) -> Exit to the street -> standing at my door; back in the same way.
- Day 2 (clock advanced by API): post notice; Maple Post inbox -> "Show me my mailbox" -> arrow "Leave → your mailbox" -> lobby "Your mailbox: take out the post" -> tap the wall -> menu -> Take out the post -> paper view; arrow gone.
- Letter written from the app's button at home (compose windows by taps, writing time advanced by API), posted through the mailbox menu ("It drops into the box").
- Small parcel while out (injected with `G.post.debug.parcelIn`): notice "on the parcel shelf in your lobby", tap the shelf -> delivery box at home. Same on a house: parcel on the doorstep, tap -> box.
- Night 23:30: door -> lobby -> stairs -> flat. Waypoint to home from the street at 22:30: arrow through door, lobby, stairs; "You have arrived: Juniper Court".
- Continue from a save made inside the flat -> inside the flat.
- Moved to Wren Cottage (money set by API, `G.housing.rent`): Leave goes straight to the street, curb box flag up, "Show me my mailbox" -> arrow to the box, tap -> "Your mailbox at the curb" menu -> post out, flag down. "Write a letter" on its dining table opens the composer.
  Old flat's door -> listing card (not the lobby); in its lobby the wall is "Mailboxes" again, stairs "Stairs".
- Old save made with the build BEFORE this work (Juniper, day 2, one item in the basket): Continue -> one notice, item taken out in the lobby; saved and loaded again -> no second notice. Same save with `?mailroute=direct`: Leave -> street, side door -> lobby -> mailbox -> stairs -> flat; lobby exit lands on the side door; the lobby is in G.places.
- House old save (built by removing the mark from a new save): notice says "at the curb".
**By API / looked at only:** all 12 lobbies as the resident (interactables, screenshots), all 13 curb spots (tile type, not blocked, screenshots), gallery sheet of the new art day + night.
**Not run:** the full intro from the plane; a real cab ride home (only the door at night and `goHome()` + Leave); a Chapter marker at your own door (read in code: "Not now" uses the door, so it goes to the lobby; accepting a chapter enters the flat directly);
ZipEats / Roomy deliveries (their code keys on `G.housing.isHome()`, untouched; my API attempt to place an order failed on my side, so nothing was shown); visitors; job arrows to a home; the other eight new lobbies were entered by API, not through their street door by taps; winter / other seasons of the art in the city; bought (owned) homes (same code path as rented).
Screenshots: `out/shots/mail_*.png` (lobbies `mail_lobby_<home>`, curb `mail_curb_*`, flow `mail_a*`, `mail_b*`, `mail_c*`, `mail_m*`, `mail_n2*`). Test scripts and saves: scratchpad `mail/`.

## Known gaps
- In route `lobby` the nine new lobbies can only be entered by the resident (a stranger's tap on that door shows the listing card). In `direct` everyone can use the side door.
- The three shared lobbies keep their own street door: the lobby's exit puts you at the lobby door, 1-2 steps from the home door.
- A save made while standing in a lobby continues on the street outside (as for every interior that is not your home).
- Curb boxes are small (a real mailbox next to a 1.4-tall person); Wren Cottage's stands near an existing blue street mailbox. The Crooked House sits in a narrow alley: its box is by the door, not at a kerb.
- The box art carries no house / flat number (too small to read); the number is in the label.

## Owner questions
1. Front door: through the lobby (built, default) or straight home with the lobby as a side door? One switch, see above.
2. Should strangers be able to walk into the starter buildings' lobbies in the default mode too?
3. Flat numbers are invented (Juniper 3B, Saltbox Loft 2, Easel Studio 4, Birch Flat 1, Marlowe 5C, Cannery Loft 6, Inkwell Studio 3, Meridian 1407, Penthouse): fine?
