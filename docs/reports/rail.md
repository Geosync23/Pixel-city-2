# Light rail — notes (headers of src/sim/rail.js, src/scenes/trainride.js, src/scenes/rooms/stations.js)
- `G.rail`: stations(), station(id) (ids hillcrest arts airport maplewood railyard central harbor oldtown; also st_<id>/station:<id>), nextTrains(id), plan(from, to), openStation(id), openTickets(), buyPass('day'|'week'),
  ride(from, to, {free, nowait}) -> Promise<bool>. `G.transit.rideTrain(from, to)` works. Events train:arrive/depart(stationId, info), ride:start/end('train', stationId).
- Scene 'train' = cutaway ride (walk around, sit, talk to passengers; parallax city by district; `G.trainRide.getOff()/skip()`).
- Room `central_station` (28x20, glass vault, kiosks via G.shop.open('stand_coffee'|'cornerstore'|'bakery'), ticket machines, piano, gates -> boarding panel). City door poi `door:central_station`.
- Art: `furn.train.*`, `furn.station.*` (arch, portal, dome, gates, counter, kiosk kind coffee|news|flowers|bakery, info, clock, pillar, planter, piano, medallion, shaft) in src/art/rail_interior/.
- Pattern worth copying for other transit-like rides (e.g. an airport tram): the ride scene in src/scenes/trainride.js + parallax backdrop in src/scenes/_trainbg.js.
