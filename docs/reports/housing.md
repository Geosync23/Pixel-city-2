# Housing, home rooms, wardrobe — notes (full API in headers of src/sim/housing.js, src/sim/wardrobe.js, src/scenes/rooms/homes.js, src/ui/furnish.js)
- Room ids: player homes `home:<homeId>` (dynamic; def.home = true only for the player's current home): juniper_court, saltbox_lofts, easel_house, birch_lane_flats, marlowe_1br, cannery_loft, sycamore_house, villa_belvedere, beacon_penthouse.
  Story homes (static): `home:sibling`, `home:grandma`, `home:friend`. Visiting rule: 08:00-21:00 or an invitation (`G.housing.invite(roomId, hours)`); friend also needs rel('kit') >= 20.
- `G.housing`: current() -> {id, home, owned, roomId, door}, isHome(sceneId?), homes(), rent(id), buy(id), start(homeId), goHome(), canEnter(roomId), whyNot(roomId), invite(roomId, hours),
  addFurniture(itemId), unpack(boxUid), boxes(), storage(), items(), place/move/rotate/store/sell, guestSpots(), openListings(), decorate().
  Events: home:move(id, prev), home:furnish, home:delivery(box), home:unpack(box, introCount), home:bought(id). Flags: boxes_unpacked (count), invited:<roomId>, lastHomeDoor.
  'game:new' ({homeId}) -> start(homeId): starter kit, 3 intro moving boxes, first-week rent charged.
- `G.wardrobe`: owned(), add(itemId), wear(itemId), wearing(), styles(), wearTemp(artOutfitKey) / restore() (job uniforms), setLook(spec), open().
- Gaps: no "Sit" on seats in story homes (activities.tagsFor gives home-art seats no activity); perks mostly unwired.
