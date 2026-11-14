# Showpieces A: Maple Bay Galleria (mall) + SkyDeck — notes (src/scenes/rooms/mall.js, skydeck.js, _show_life.js; src/sim/showpieces.js; src/data/venues_showpiece.js; art src/art/showpiece/)
- Mall = room `deptstore` (44x32, L-shaped; city door `door:deptstore`, renamed "Maple Bay Galleria"). 10 open-front bays: Fern & Frond (plants, `mall:fern`), Nest & Wire Home (`mall:nest`), Pixel Hut (`mall:pixel`),
  Thread & Co. Outlet (`mall:thread`), Kicks (`mall:kicks`), Bloom Beauty (`mall:bloom`, + "New haircut" opens the creator), Paper Moon (`mall:paper`), Toy Galaxy (`mall:toy`, 2 arcade cabinets), Wheel House (`mall:wheel`),
  Food Court (`mall:boba`, `mall:kbbq`, `mall:taco`) + pretzel kiosk (`mall:pretzel`). Counters use tag `mallcounter` -> `G.shop.open(venueId)`. Hours 10-21 (shutters after). ~92 people at 15:00.
- SkyDeck: city door `door:skydeck_lobby` at (197, 260.75) on the tallest downtown tower ("Beacon Tower SkyDeck" — NOT the Beacon penthouse building). Rooms `skydeck_lobby` (ticket $8/day, flag `skydeck_pass` = free), lift ride cutscene, `skydeck` (22x16):
  panorama glass (day/dusk/night, seasons, clouds, planes), 5 telescopes (modal view; discovers places), glass-floor ledge, photo spot, plaques, Cloud Nine bar (`skydeck:bar`), gift nook (`skydeck:gifts`).
- 83 new items (`mall_*`, `sky_*`): plants, outfits, shoes/sport, electronics, toys, bikes/skateboards/helmets (homegood/misc with field `vehicle: 'bike'|'skateboard'|'helmet'` — a riding system can key off it), beauty, stationery.
  Housing VIS and wardrobe LOOKS are extended (MALL_VIS / MALL_LOOKS), so bought plants/furniture/bikes place at home and outfits change the look. Art `furn.home.bicycle`, `furn.home.skateboard` exist.
- `G.showpieces`: skydeck { viewNow(), ride(up), hasTicket(), buyTicket(), scope(district), photo() }, mall { shops(), isOpen() }, photos(). Events skydeck:visit(first) (fires every arrival), skydeck:ride/scope/photo/ledge/plaque/ticket, mall:visit, mall:arcade.
  Place ids `deptstore`, `skydeck_lobby` (alias `skydeck`). State G.state.showpieces.
- Reusable: `_show_life.js` (static crowd + lane walkers), `_pano.js` (city panorama painter).
- Gaps: telescope discovery unverified; shopping is still the counter menu (physical rack-picking comes with the goods stage); placeholder icons; deck stays busy late at night; two places share the "Beacon" name.
