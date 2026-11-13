# City generator — contracts (src/world/, see header of src/world/city.js). `getCity()` from src/world/_city.js is DOM-free. `node tools/mapview.mjs [--pois]` writes out/map/*.png.
- Districts: `world.districts=[{id,key,name}]` ids 1-9 = downtown, oldtown, harbor, hillcrest, maplewood, arts, railyard, park, airport; `world.districtAt(x,y)` -> key.
- Roads: `world.roads=[{id,axis,c,a,b,half(2|4),name,kind}]`; lanes at c±1 (and ±3). Right-hand traffic: +x traffic drives at y=c+1, -x at y=c-1; +y traffic at x=c-1, -y at x=c+1.
  `world.intersections=[{x,y,roads:[xRoadId,yRoadId],signal,z,arms:{n,s,e,w}}]`.
- `world.walkways=[{x0,y0,x1,y1,axis,district,kind}]` kind sidewalk/promenade/path/boardwalk/pier/lane/plaza. `world.parking=[{x,y,axis,lot,occupied}]`.
- Rail: `world.rail={path:[[43,123],[276,123],[276,129],[376,129],[376,305],[43,305]] (closed loop), stations:[{id,venueId:'st_<id>',name,x,y,axis,platformZ,deckZ,entrance:{x,y}}], profile, deckZ(x,y), trackOffsets:[-1.3,1.3], deckWidth:6}`. Track bed z absolute: 8 north side, 6 south.
- Bus: `world.busRoutes=[{id:'bus1'|'bus2'|'bus3',name,color,stops:[poi ids],path:[lane corner points]}]`; stops are pois `bus:<n>` with `road, side, axis, routes[], lane{x,y}`.
- Airport: `world.airport={runways:[{axis:'x',c:28,a:276,b:380,z:3,width:12}], taxiway, apron, gates, curb:{x:321,y:102.6}, approach:{axis:'x',c:28,from:474,touchdown:356,exit:286,z:3}, terminal}`.
- POIs: `door` id `door:<room>` (room, name, dir, district); homes `door:home:<homeId>` (juniper_court, saltbox_lofts, easel_house, birch_lane_flats, marlowe_1br, cannery_loft, sycamore_house, villa_belvedere, beacon_penthouse, sibling, grandma, friend);
  `station` id `station:<id>`; `busstop`; `taxistand` id `taxi:<id>` with `lane`; `spawn:airport` (321,102.6); `bench` (dir); `spot` (kind: fishing, lookout, duckpond, busker, chess, picnic, playground, garden, beach, ferriswheel, shrine, skate, cats, planespotting); `stall` (venue); `landmark` (name).
- Venue rooms with doors: cafe, bakery, bookstore, cornerstore, ramen, grocery, diner, restaurant, gym, clothing, library, office, clinic, bar, cinema, pizza, courier, warehouse, bank, homegoods (+ deptstore, hotel, central_station doors without rooms).
- Layout: river x 150-162; bridges y 114,200,232,296,326; footbridges y 156,180,264; River Walk west bank x 132-149 / east bank x 163-174; Central Park x 56-140 y 126-194 (pond 98,158);
  Market Square x 86-108 y 244-260; Lantern Row y 279-283; City Hall Plaza (220,222); boardwalk y 330-344; fun pier x 94-106; lighthouse (32,352); Hillcrest terraces z 3..10.5, lookout y 10-26.
- `world.badArt` lists assets whose draw threw. Extra polish steps can be added as files and called from `_gen.js`/`_city.js` pipeline.
