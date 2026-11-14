# Traffic / taxi / bus — notes (full API in headers of src/sim/traffic.js, src/sim/transit.js)
- `G.transit.callTaxi(placeId|poiId|{x,y,name}|null, {free, auto:false, silent, fare}) -> Promise<bool>` (resolves true on arrival; null = destination picker), `hailTaxi()`, `cancel()`, `skipRide()`,
  `fare(kind, from?, to?)` / `fare(placeId)`, `payFare(kind)`, `hasPass()`, `boardBus(routeId?, stopId?, destStopId?)`, `nextBuses(stopId)`, `openStop(stopId)`,
  `ride` -> null | {kind, vehicle, destination, progress, fare, district}, `onArrive(fn)`, `registerMode(name, {ride(from,to,opts), fare?})`, `beginRide({kind, vehicle?, destination})`, `endRide(ok)`, `roadGraph()`, `route(a, b)`.
- Events: ride:start(kind, placeId), ride:end(kind, placeId), ride:district(key), taxi:here(cab), taxi:cancel, bus:arrive/depart(bus, stopId).
- Intro cab: `G.state.flags.firstCabFree = true; const off = G.on('ride:district', key => {...}); await G.transit.callTaxi('home:<homeId>' or the door poi id); off();` Cab reaches the airport curb in ~4 s, player auto-boards within 3.3 units (`{auto:false}` = tap to get in). Ride airport -> Old Town ~50 s real; the ride HUD has Skip.
- Train: `G.transit.registerMode('train', { ride(from, to, opts), fare?(from, to) })`; inside use payFare('train'), beginRide, endRide.
- `G.traffic`: graph, vehicles, spawn(kind, laneRef, opts), count(), buses, stands. Signals animate placed `prop.road.trafficlight` objects (mapping of flip->axis is a guess; swap in signals() if inverted).
- Gaps: bus headways long (2 buses per loop), buses 24h, no tilt on slopes, headlight pools are screen-space.
