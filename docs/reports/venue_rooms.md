# Venue rooms (src/scenes/rooms/venues_*.js) — room id = venue id
cafe 10x8, bakery 8x7, diner 13x9, ramen 7x6, pizza 9x7, restaurant 13x10, grocery 15x12, cornerstore 7x6, clothing 10x8, homegoods 13x10, bookstore 8x8, gym 16x12, library 14x11, bar 14x11,
cinema 11x8 (+ `cinema:hall` 10x10 via a "Screen 1" exit mat), office 16x12, clinic 12x9, courier 13x10, warehouse 16x13, bank 12x9.
Each def has `venue`, `music` (cafe|gym|bar|shop|office|quiet) and a lazy `npcSpots` getter: [{x, y, z, dir, anim, kind: 'customer'|'staff', fixture?}] in room coords (`scene.toWorld(x,y)`).
All 10 jobs' station tags exist in their workplaces. Some art `use`/`staff` spots lie inside the fixture footprint (office cubicle chair, bossdesk, bank.desk, cinema.ticket, bar.dj): snap characters to them instead of pathfinding onto them.
Flat items (height <= .06, rugs/mats/decals) are now always drawn under everything else by the renderer.
