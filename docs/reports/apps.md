# App store, Properties, Living Tips, mini apps — notes (src/sim/apps.js, src/ui/phone_store.js, phone_homes.js, phone_tips.js, phone_minis.js, phone_apps.css; two one-line edits in src/ui/phone.js)
- `G.apps = { catalog(), get(id), release(id, quiet?), install(id), uninstall(id), isInstalled, isReleased, pending(), hides(id), check() }`; events app:released / app:installed / app:uninstalled; state G.state.apps.
  The phone home screen shows only installed apps (phone.js `isUnlocked` + `homeView` consult G.apps). Home grid is 4 columns.
- Store "Appy" (`store`). Preinstalled core: store, messages, planner, map, guide, settings; preinstalled removable: tips, taxi, bank, jobs, wellness, delivery.
  Releases (notification + store badge, then install): `homes` Nestly day 1; `weather` Skies day 2; `transit` Bay Transit on ride:end or day 2; `showtime` on discovering a show venue or day 3; `closet` at 2+ outfits or day 4;
  `friends` Circle at 3+ people known; `wallet` Receipts on bills:due or day 6. Teasers (not installable): spark (dating), campus, freshfold (laundry), stride, crumbs.
- Nestly (`homes`): all homes from G.housing.homes() with thumbnails, rent/price, unlock days, detail page, Take me there, Rent/Buy cost sheets (rent verified end to end; buy verified to the sheet).
- Bay Basics (`tips`): 47 tips in 8 topics with "Show me" links; `G.tips = { all, get, show(id), seen, go, topics }`; 19 one-time contextual triggers, max one tip notification per game hour.
- To add an app: register it with G.phone.registerApp and add a catalogue row in src/sim/apps.js (release rule: day and/or event).
- Gaps: Circle releases immediately because family counts as "known" (should count non-family); new apps have no `app.*` icon art (generic fallbacks); Receipts categories are regex-based; several buttons wired but not clicked
  (Decorate shortcut, Showtime add-to-planner, ticket purchase, outfit change); NPCs don't mention tips yet; src/data/phone.js comment still says "never more than 9 icons".
