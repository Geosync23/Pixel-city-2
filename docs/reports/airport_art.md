# Airport art — notes from the artist (src/art/airport/)
49 assets, all tagged `airport`. Run `node tools/gallery.mjs airport --scale 1 --out a` to see them.
## Terminal snapping (unflipped, street = +y; all street facades flush)
- `bld.airport.terminal.hall` size [w,10,6.2] (w 12/16/20; p.name). Doors on +y at 4 (ARRIVALS) and w-4 (DEPARTURES).
- `bld.airport.terminal.wing` [w,8,4.3] (w 8-24). Right of hall: wing.x = hall.x + hall.w, wing.y = hall.y + 2. Left: wing.x = hall.x - wing.w, same y.
- `bld.airport.terminal.endcap` [5,8,4.3]: x = wing.x + wing.w, y = wing.y (caps the +x end only).
- `prop.airport.canopy` [w,4,3.8] solid:false overhead: canopy.y = hall.y + 10 (facade line); `pillars:true` draws pillars in-sprite, or place
  `prop.airport.canopy.pillar` at canopy.y + 3.05, x = canopy.x + 0.95 + i*(w-2.4)/(n-1), n = max(2, round(w/4)).
- `prop.airport.jetbridge` [len,1.6,3.7]: terminal end x=0, aircraft cab at +x, floor z 1.5. `prop.airport.board` lit flight board.
- Airside behind the terminal (-y) is hidden by the building: put jet bridges / parked planes beyond the +x end or expect only tails to show.
## Buildings
tower [6,6,h+5.2] (landmark), hangar.arch / hangar.box (p.w,d,open), cargo, fire, fueltanks, radome, carpark, hotel, rental, `prop.airport.shelter` (sign 'TAXI'/'BUS', has seats).
Door `at` is only right at default width for hangar.box (w-2.2), fire (w-0.9), hotel (w/2).
## Aircraft (kind vehicle, lie along x, p.dir ±1, p.gear true/false, liveries in variants)
`veh.airport.airliner` [22,17,6.2], `.turboprop` [15,15,5.2], `.bizjet` [10,9,3.9], `.cargo` [22,17,6.6], `.helicopter` [10,7.6,3.5].
Each has `<id>.shadow` (same footprint/origin, p.dir only) to draw on the ground under a flying plane. Wheels touch at local z=0. No pitch param (fake flare with z bob).
Planes are big: sort by centre or draw airborne ones as an always-on-top layer.
## Ground vehicles / props
baggagetug, baggagecart, baggagetrain (p.carts), pushback, fueltruck, catering (p.up), stairs, followme.
`prop.airport.lights` [len,.5,.5] (color blue/white/green/red/amber; runs along x), papi, windsock, gantry (spans y), rwysign, luggage (kind single/duo/family/pile),
trolley, trolleycorral, cones, totem (rows [[text, arrow, bg, fg]]), flagpole, fence [len,.2,2.4], blastfence, railsign.
## Suggested opening scene, front to back
street -> drop-off lane -> sidewalk under canopy (shelter, totems, luggage, trolleys) -> terminal row (wing + hall + wing + endcap) -> apron -> runway along x with light strips.
Tower, hotel, car park to the sides so the view of landing planes stays open.
