# Life-sim core — notes (read the header comments of src/sim/{needs,money,inventory,activities,places}.js, src/ui/{hud,shop,_icons}.js for full APIs)
- G.needs / G.skills / G.money / G.inv / G.shop / G.activities / G.places / G.hud exist as in docs/INTERFACES.md, with these differences:
  - Money is NOT integer: prices round to $0.25 — always display with `G.money.fmt(n)`. `G.money.addBillSource(() => [{id,label,amount}])` adds weekly bill lines. `history()` newest first.
  - Fridge contents live in `G.state.inv.fridge` (not G.state.home.fridge). `G.inv.grant(access, days)` / `hasAccess` handle passes/memberships.
  - Purchases of furniture/outfits go to `G.housing.addFurniture(itemId)` / `G.wardrobe.add(itemId)` if those exist, else to `G.state.owned = { furniture: [{id, day, t}], outfits: [itemId] }` — housing should drain it.
  - Rent is billed from `G.state.home.id` (`G.state.home.owned` switches to upkeep). First-week rent on arrival is NOT charged yet.
  - Pass-out uses `G.housing.goHome()` if present.
  - Shop fixtures: tags checkout/till/host_stand/host/reception in a room whose id is a venue id. `G.shop.onService(serviceId, fn)` for counter services.
  - Activities appear on fixtures by function tag (data/activities.js). Home activities only in rooms whose id starts with `home` or def has `home: true`.
    City pois type `bench`/`spot` become activity interactables (function tag from poi.tag/fn/kind/tags); a poi with `venue: <id>` or id `stall:<venueId>` opens that stall's shop.
  - Hooks expected from later systems: `G.jobs.openBoard()/openGigs()`, `G.wardrobe.open()/styles()`, `G.housing.goHome()`.
  - HUD: `G.hud.addIndicator({id, icon, text, onclick})`, `setBadge('phone'|'bag', n)`; HUD shows on 'game:start' (or immediately on dev ?scene= launches). Autosave owned by HUD.
  - `iconEl(id, scale, category)` from src/ui/_icons.js for all UI icons.
  - Events: needs:change/low/zero, moodlet, skill:up, passout, money, bills:due/soon, inv:change/use/spoiled, shop:buy/open, service, activity:start/done, ui:open, cooked, place:discover, places:built.
- Dev room: `?scene=int:devhome`. Debug: `G.debugSim.fillNeeds()/setNeed/give/cash`.
- Known gaps: tipping, companion bonus, outfit perks, library loans; seated player may sort behind a flipped sofa.
