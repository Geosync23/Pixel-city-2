# Navigation arrow everywhere (owner msg 72, BIBLE update 15) — src/ui/navarrow.js + hooks (worker report, condensed)
- Files: NEW src/ui/navarrow.js (arrow, "This is your stop" banner, scene graph of exits, arrival logic; CSS injected). src/ui/phone_map.js (old #ph-way arrow removed; setWaypoint accepts in-building places, waypoint gets `room`).
  src/sim/navigator.js (cab trips, re-routing, watchdog, compact trip banner). Nav hooks only in src/sim/rail.js, src/scenes/trainride.js, src/sim/transit.js, src/ui/phone_taxi.js. The trip chooser is untouched.
- Behaviour: bobbing marker over an on-screen target, else clamped to the edge of the HUD safe area with "name · distance"; a text chip when there is nothing to point at (waiting, riding between stops).
  Interiors: points at the exit toward the next leg ("Exit -> destination"), or at the destination when it is inside the building (Central's gates, a mall counter).
  Train: station door -> gates -> boarding panel pre-selected -> chip while riding -> RED arrow on the door + banner when your stop is next and at it. Bus: arrow to the stop -> panel marks "Wait for bus N (your trip)" -> arrow marks your stop, red when next/at, banner; the bus holds NAV_HOLD 9 s at your stop.
  Cab: pick-up spot -> cab -> destination -> door; requested indoors, the cab is called when you reach the street. Missed stop: banner, then re-route from wherever you get off.
- BEHAVIOUR CHANGES: trains no longer auto-alight at the destination (all rides; HUD button "Get off at next stop" pre-arms / "Get off here"); bus nav trips board without a destination; the arrow hides while a window or the phone is open (banner stays);
  any MapleCab request becomes a guided cab trip.
- API: G.navArrow { target(), banner(title, sub, {red, ms, sfx}), hideBanner(), edges(sceneId?), route(goalSceneId), innerPlace(id), el, bannerEl }; G.nav.replan(why?); G.phone.setWaypoint accepts 'mall:<key>'.
  Events: nav:stop(phase 'next'|'at'|'missed', kind, stopId), nav:reroute(trip, why). State: G.state.nav.trip gains mode 'cab', call, rerouted; G.state.nav.edges (learned exits, max 8 per scene, 48 scenes).
  Tuning (navarrow.js): ARRIVE 4, ARRIVE_IN 2.2, HEAD 2.3, SAFE {l:10, r:10, t:108, b:22}.
- Worker ran (zero page errors, landscape + portrait): walk with edge arrow; train via Central end to end; train INTO Central (the owner's bug) -> exit arrow -> destination; missed train stop + re-route; bus incl. banner and missed stop;
  cab from inside the grocery; interior waypoints (shop, airport concourse); mall shop; trip survives save/load; Phone Map buttons. 41 screenshots out/shots/nav_*.png (worker looked at ~19).
- Lead verified: city edge-clamped arrow in portrait ("Juniper Court · 64 m"), Central Station hall arrow on "Exit to Downtown -> Conservatory", clean build with zero page errors.
- NOT verified: sound; bike mode; real walking between legs (player was teleported; gates / stop panels opened by API); lobbies, homes, cinema/halls, SkyDeck, airtram (generic exit logic); night; the intro with the new arrow.
- Gaps: SkyDeck has no doormat (label/chip fallback until the lift is used once); performance-hall "Lobby" exits use a label heuristic until learned; mall shops are not in G.places (Map cannot pick them);
  phone tip banners can cover the trip strip; MapleCab says "on its way" before an indoor-requested cab is actually called; unused #ph-way CSS in phone.css.
