// cityevents.js — the six BIG CITY EVENTS of the year (BIBLE direction update 12): staged street festivals and parades that happen in the world.
// Pure design data; the engine is src/sim/cityevents.js (G.cityEvents). Each event is tied to a calendar row (src/data/calendar.js, ids below).
//
// EVENT
//   id, cal         event id = its calendar row id.    lines: calendar id whose ambient line pool the crowd uses (story/ambient_lines.js `events`)
//   name, short     player-facing names.     scheme: colour scheme of the dressing (art/events/common.js SCH)
//   season, day     0 spring..3 winter, day of the 14-day season (the year has 56 days; one big event about every 7 days from Spring 13)
//   open [h0, h1]   hours the street is closed and the stalls trade.      paradeAt: hour the parade sets off.      finaleAt: hour of the finale (optional)
//   site {x,y,name} where the guide arrow leads.           district
//   close           road stretches closed to traffic: [roadId, fromCoord, toCoord] (node to node; never a stretch a bus route uses)
//   route           { pts: [[x,y]..] centre line the parade follows, half: half-width of the carriageway (spectators stand just outside it), water: true for boats,
//                     dress: false = no bunting / arches along it (water) }
//   watch           extra spectator lines: { a: [x,y], b: [x,y], face: 0..3 (dir they look: 0 +x, 1 +y, 2 -x, 3 -y), rows, step?, mood?: 'dance' }
//   lineup          parade units front to back: { t: 'float', a: asset id } | { t: 'band', rows, cols, look } | { t: 'walk', rows, cols, look, anim? } |
//                   { t: 'dragon', segs } | { t: 'boat', a }           looks are defined in sim/_cityevents_stage.js LOOKS
//   stalls          { x, y, flip?, kind, text, name, sells: [item ids] }   (x,y = min corner; nudged to the nearest free ground at run time)
//   props           extra set pieces { a: asset id, x, y, p?, flip?, id? }
//   moment          the thing to take part in: { id, prop (index in props or {a,x,y,p}), label, title, from, to (hours), game (ui/minigame def), text, done (line), fx }
//   games           more things to do: { id, prop, label, title, game, fee, prize }
//   wx              'clear' (the calendar guarantees fine weather) | 'rain_ok' (goes ahead in rain, waits out a storm)
//   reward          { moodlet, needs: { fun, social }, item: [id, qty], money }  for taking part;   watched: { fun, social } for standing by as the parade passes
//   texts           announce (3 days before), eve (the day before), today (morning of), opp (the Opportunity), start, parade, finale, end, rain, storm
export const TUNE = {
  announceDays: 3,        // posters + the first phone notice this many days before
  buntingDays: 1,         // bunting, banners and arches go up this many days before
  closeLead: 30,          // minutes before `open` that the barriers go up (traffic drains)
  paradeSpeed: 1.15,      // world units per second (per game minute when you are not there to watch)
  gap: 2.4,               // units between parade units
  spectStep: .62,         // spacing of spectators along the kerb
  spectMax: 150,          // spectator entities alive at once (those around the screen)
  gatherMin: 70,          // minutes before the parade that people start lining the route
  nearSite: 46,           // "you are at the event" radius (units) for the watch reward / moodlet
  watchMinutes: 8,        // minutes at the site before festival_spirit
};

const FOOD = { tea: ['cafe_tea', 'bakery_fruit_tart'], snacks: ['market_dumplings', 'market_crepe', 'kettle_corn'], flowers: ['gift_flowers', 'gift_wildflowers'],
  dogs: ['stand_hotdog_classic', 'stand_hotdog_pretzel', 'kettle_corn'], ices: ['stand_icecream_cone', 'stand_taco_horchata'], tacos: ['stand_taco_single', 'stand_taco_horchata'],
  cider: ['hot_cider', 'apple'], nuts: ['market_chestnuts', 'kettle_corn'], honey: ['gift_honey', 'gift_candle'], grill: ['market_dumplings', 'ramen_gyoza', 'stand_taco_single', 'hot_cider'],
  cocoa: ['stand_coffee_cocoa', 'hot_cider'], bakes: ['market_chestnuts', 'market_crepe', 'bakery_cinnamon_roll'], gifts: ['gift_candle', 'gift_teddy', 'gift_chocolates', 'gift_postcards', 'decor_string_lights'] };

export const CITY_EVENTS = [
  /* ------------------------------------------------------------------ 1. Spring 13 */
  { id: 'blossom_parade', cal: 'blossom_parade', lines: 'blossom_festival', name: 'Blossom Parade', short: 'the Blossom Parade', scheme: 'blossom', season: 0, day: 13,
    open: [11, 16], paradeAt: 13, district: 'downtown', site: { x: 175, y: 170, name: 'Riverside Drive: Blossom Parade' },
    close: [['r28', 138, 170], ['r28', 170, 200], ['r2', 178, 206]],
    route: { pts: [[178, 142.5], [178, 196]], half: 2 },
    lineup: [{ t: 'walk', rows: 1, cols: 2, look: 'bannerP' }, { t: 'band', rows: 4, cols: 3, look: 'bandPink' }, { t: 'float', a: 'float.blossom.tree' }, { t: 'walk', rows: 4, cols: 2, look: 'parasol' },
      { t: 'float', a: 'float.blossom.swan' }, { t: 'walk', rows: 3, cols: 2, look: 'koi' }, { t: 'float', a: 'float.blossom.teahouse' }, { t: 'walk', rows: 4, cols: 3, look: 'petalKids', anim: 'dance' }, { t: 'float', a: 'float.blossom.throne' }],
    stalls: [{ x: 170, y: 150, flip: true, kind: 'tea', text: 'TEA', name: 'Blossom Tea Tent', sells: FOOD.tea }, { x: 170, y: 160, flip: true, kind: 'food', text: 'SNACKS', name: 'Festival Snacks', sells: FOOD.snacks },
      { x: 170, y: 180, flip: true, kind: 'flower', text: 'FLOWERS', name: 'Cherry Branches', sells: FOOD.flowers }, { x: 170, y: 189, flip: true, kind: 'sweet', text: 'TREATS', name: 'Pink Lemonade & Ices', sells: FOOD.ices }],
    props: [{ a: 'prop.blossom.basket', x: 172.5, y: 169, flip: true }, { a: 'prop.event.balloons', x: 173.5, y: 166.5 }, { a: 'prop.event.balloons', x: 173.5, y: 172 }],
    moment: { id: 'petals', prop: 0, label: 'Petal baskets', title: 'Shower the parade', from: 12, to: 15.5, fx: 'petals',
      text: 'Take a basket and throw petals over the floats as they come by.',
      game: { kind: 'quickdraw', title: 'Petal shower', hint: 'Tap the blossoms as they fall. Leave the leaves.', level: 3, theme: { color: '#f2a7c3', color2: '#fbe3ea' } },
      done: 'Pink petals everywhere. The Blossom Queen waves right at you.' },
    wx: 'clear', reward: { moodlet: 'festival_spirit', needs: { fun: 22, social: 10 }, item: ['gift_wildflowers', 1] }, watched: { fun: 12, social: 6 },
    blurb: 'Floats, a marching band and a swan the size of a bus roll down Riverside Drive under the blossom. Petal baskets by the River Walk.',
    texts: { announce: 'The Blossom Parade is on Saturday: Riverside Drive, one o\'clock. Posters are going up along the river.', eve: 'Bunting is up on Riverside Drive. The Blossom Parade sets off tomorrow at 13:00.',
      today: 'Blossom Parade today. Riverside Drive closes at 10:30; the floats set off at 13:00.', opp: 'The Blossom Parade comes down Riverside Drive at one. Find a spot by the River Walk and throw a few petals.',
      start: 'Riverside Drive is closed for the Blossom Parade. Stalls are open along the River Walk.', parade: 'Here they come! The Blossom Parade is setting off down Riverside Drive.',
      end: 'The last petals are swept up. Riverside Drive is open again.' } },

  /* ------------------------------------------------------------------ 2. Summer 6 */
  { id: 'harbor_day', cal: 'harbor_day', lines: 'summer_fireworks', name: 'Harbor Day', short: 'Harbor Day', scheme: 'harbor', season: 1, day: 6,
    open: [16, 23], paradeAt: 19.5, finaleAt: 22, district: 'harbor', site: { x: 98, y: 331, name: 'Dock Street: Harbor Day' },
    close: [['r12', 82, 112]],
    route: { pts: [[57, 349.6], [91.5, 349.6], [91.5, 380.6], [109.5, 380.6], [109.5, 349.6], [136, 349.6]], half: 1.2, water: true, dress: false },
    street: { pts: [[86, 326], [108, 326]], half: 2 },
    watch: [{ a: [60, 343.2], b: [92, 343.2], face: 1, rows: 2 }, { a: [108, 343.2], b: [134, 343.2], face: 1, rows: 2 }, { a: [96.5, 347], b: [96.5, 372], face: 2, rows: 1 }, { a: [103.5, 347], b: [103.5, 372], face: 0, rows: 1 },
      { a: [90.5, 329.6], b: [100, 329.6], face: 3, rows: 2, mood: 'dance' }],
    lineup: [{ t: 'boat', a: 'boat.harbor.tug' }, { t: 'boat', a: 'boat.harbor.dinghy' }, { t: 'boat', a: 'boat.harbor.sail' }, { t: 'boat', a: 'boat.harbor.dinghy' }, { t: 'boat', a: 'boat.harbor.trawler' },
      { t: 'boat', a: 'boat.harbor.dinghy' }, { t: 'boat', a: 'boat.harbor.queen' }, { t: 'boat', a: 'boat.harbor.sail' }, { t: 'boat', a: 'boat.harbor.dinghy' }],
    stalls: [{ x: 101.5, y: 324.4, kind: 'fish', text: 'CHOWDER', name: 'Boardwalk Bites', sells: FOOD.dogs }, { x: 105, y: 324.4, kind: 'food', text: 'TACOS', name: 'Taco Luna (on tour)', sells: FOOD.tacos }, { x: 108.2, y: 324.4, kind: 'sweet', text: 'ICES', name: 'Scoops Ahoy', sells: FOOD.ices }],
    props: [{ a: 'prop.harbor.plunger', x: 99.2, y: 362.5 }, { a: 'boat.harbor.barge', x: 113, y: 366, water: true }, { a: 'prop.event.stage', x: 92.5, y: 324.2, p: { text: 'HARBOR DAY' } }],
    moment: { id: 'fireworks', prop: 0, label: 'Firing desk', title: 'Fire the first rocket', from: 21.5, to: 22.6, fx: 'fireworks',
      text: 'The Harbor Master needs a steady hand on the plunger. Launch the fireworks in time and the whole bay lights up.',
      game: { kind: 'rhythm', title: 'Light up the bay', hint: 'Tap each rocket as it reaches the line.', level: 3, o: { lanes: 3 }, theme: { color: '#2f6fb5', color2: '#f2c230' } },
      done: 'The sky over the bay is yours for a minute. The whole pier cheers.' },
    wx: 'clear', reward: { moodlet: 'fireworks_awe', needs: { fun: 26, social: 10 }, money: 20 }, watched: { fun: 14, social: 6 },
    blurb: 'Dock Street closes for music and food, a parade of lit boats rounds the pier at dusk, and fireworks go up from a barge at ten.',
    texts: { announce: 'Harbor Day is on Saturday: stalls on Dock Street from four, the boat parade at half past seven, fireworks at ten.', eve: 'Flags are up along the boardwalk. Harbor Day is tomorrow.',
      today: 'Harbor Day today. Dock Street closes at 15:30. Boats at 19:30, fireworks at 22:00.', opp: 'Harbor Day: music on Dock Street, lit boats round the pier at half past seven, fireworks at ten. The Harbor Master wants a volunteer at the firing desk.',
      start: 'Dock Street is closed for Harbor Day. There is a band on the stage and chowder on the go.', parade: 'The boat parade is rounding the point. Best seen from the pier or the boardwalk rail.',
      finale: 'Fireworks over the bay!', end: 'Harbor Day is over. Dock Street is open again.' } },

  /* ------------------------------------------------------------------ 3. Summer 13 */
  { id: 'river_fair', cal: 'river_fair', lines: 'boardwalk_days', name: 'River Walk Summer Fair', short: 'the Summer Fair', scheme: 'fair', season: 1, day: 13,
    open: [11, 20], paradeAt: 15, district: 'downtown', site: { x: 174.5, y: 248, name: 'River Walk: Summer Fair' },
    close: [['r28', 232, 264]],
    route: { pts: [[178, 236.5], [178, 259.5]], half: 2 },
    watch: [{ a: [172.6, 243], b: [172.6, 248.6], face: 2, rows: 3, mood: 'dance', step: .7 }],
    lineup: [{ t: 'walk', rows: 1, cols: 2, look: 'bannerR' }, { t: 'walk', rows: 4, cols: 3, look: 'flags' }, { t: 'float', a: 'float.fair.rainbow' }, { t: 'band', rows: 3, cols: 3, look: 'bandFair' },
      { t: 'walk', rows: 4, cols: 2, look: 'pompom', anim: 'dance' }, { t: 'float', a: 'float.fair.duck' }, { t: 'walk', rows: 4, cols: 3, look: 'balloon' }],
    stalls: [{ x: 166.2, y: 237, flip: true, kind: 'food', text: 'HOT DOGS', name: 'Fairground Dogs', sells: FOOD.dogs }, { x: 166.2, y: 257, flip: true, kind: 'sweet', text: 'ICES', name: 'Half-price Scoops', sells: FOOD.ices },
      { x: 170.6, y: 257.5, flip: true, kind: 'gift', text: 'RING TOSS', name: 'Ring Toss', game: 'ringtoss' }],
    props: [{ a: 'prop.fair.striker', x: 171.6, y: 251.4, flip: true }, { a: 'prop.event.stage', x: 166.2, y: 243, flip: true, p: { text: 'RIVER FAIR' } }, { a: 'prop.event.balloons', x: 173, y: 240.4 }, { a: 'prop.event.balloons', x: 173, y: 255.6 }],
    moment: { id: 'striker', prop: 0, label: 'High striker', title: 'Ring the bell', from: 11, to: 20, fee: 2,
      text: 'One swing, $2. Ring the bell at the top and the prize is yours.',
      game: { kind: 'timing', title: 'High striker', hint: 'Swing when the marker is in the gold.', level: 4, o: { style: 'bar' }, theme: { color: '#8a5cd0', color2: '#f2c230' } },
      done: 'DING! The bell rings across the river and the queue behind you groans.' },
    games: [{ id: 'ringtoss', label: 'Ring Toss', title: 'Ring toss', fee: 2, text: 'Three rings for $2. Land one on a bottle.',
      game: { kind: 'aim', title: 'Ring toss', hint: 'Set the aim, then the power.', level: 3, o: { mode: 'throw' }, theme: { color: '#e0453a', color2: '#f2c230' } }, prize: ['gift_teddy', 1] }],
    wx: 'rain_ok', reward: { moodlet: 'festival_spirit', needs: { fun: 24, social: 8 }, item: ['gift_teddy', 1] }, watched: { fun: 12, social: 6 },
    blurb: 'A fairground on the River Walk: a high striker, ring toss, a band on the stage, and the Rainbow Walk with a giant duck at three.',
    texts: { announce: 'The River Walk Summer Fair is on Saturday: games and music from eleven, the Rainbow Walk at three.', eve: 'The fair is setting up on the River Walk. It opens tomorrow at 11:00.',
      today: 'Summer Fair today on the River Walk, 11:00 to 20:00. The Rainbow Walk sets off at 15:00.', opp: 'The Summer Fair is on by the river. Have a swing at the high striker: ring the bell and you win a bear.',
      start: 'Riverside Drive is closed by the River Walk: the Summer Fair is open.', parade: 'The Rainbow Walk is setting off down Riverside Drive. There is a very large duck.',
      end: 'The fair is packing up. Riverside Drive is open again.', rain: 'A bit of rain will not stop the Summer Fair. It goes ahead.', storm: 'The Rainbow Walk waits for the storm to pass.' } },

  /* ------------------------------------------------------------------ 4. Autumn 6 */
  { id: 'harvest_parade', cal: 'harvest_parade', lines: 'harvest_fair', name: 'Harvest Festival', short: 'the Harvest Festival', scheme: 'harvest', season: 2, day: 6,
    open: [10, 18], paradeAt: 14, district: 'oldtown', site: { x: 108.5, y: 250, name: 'Market Square: Harvest Festival' },
    close: [['r27', 232, 264]],
    route: { pts: [[112, 236.5], [112, 259.5]], half: 2, loop: 3 },
    lineup: [{ t: 'float', a: 'float.harvest.tractor', hitch: true }, { t: 'float', a: 'float.harvest.wagon', ride: true }, { t: 'band', rows: 3, cols: 3, look: 'bandHarvest' }, { t: 'float', a: 'float.harvest.pumpkin' },
      { t: 'walk', rows: 3, cols: 3, look: 'sheaf' }, { t: 'float', a: 'float.harvest.basket' }, { t: 'walk', rows: 3, cols: 2, look: 'scarecrow', anim: 'dance' }],
    stalls: [{ x: 115.2, y: 238, flip: true, kind: 'pumpkin', text: 'CIDER', name: 'Cider Press', sells: FOOD.cider }, { x: 115.2, y: 244, flip: true, kind: 'food', text: 'CHESTNUTS', name: 'Chestnut Cart', sells: FOOD.nuts },
      { x: 115.2, y: 253, flip: true, kind: 'gift', text: 'PRESERVES', name: 'Preserves & Honey', sells: FOOD.honey }],
    props: [{ a: 'prop.harvest.press', x: 104.4, y: 250.2 }, { a: 'prop.harvest.giant', x: 104.6, y: 256.6 }, { a: 'prop.harvest.bales', x: 104.2, y: 244.4, p: { seed: 1 } }, { a: 'prop.harvest.scarecrow', x: 107.2, y: 248 },
      { a: 'prop.harvest.bales', x: 99.5, y: 257.4, p: { seed: 3 } }, { a: 'prop.harvest.bales', x: 115.6, y: 248.6, p: { seed: 2 }, flip: true }, { a: 'prop.harvest.scarecrow', x: 115.8, y: 258.4 }],
    moment: { id: 'press', prop: 0, label: 'Cider press', title: 'Press the cider', from: 10, to: 18, fx: 'leaves',
      text: 'Turn the screw and fill the mugs to the line. The orchard keeper judges every pour.',
      game: { kind: 'aim', title: 'Press the cider', hint: 'Hold to fill each mug to the line.', level: 3, o: { mode: 'pour' }, theme: { color: '#b8432a', color2: '#e8b63a' } },
      done: 'Four clean mugs. The orchard keeper pins a ribbon on you and hands one back, hot.' },
    wx: 'rain_ok', reward: { moodlet: 'festival_spirit', needs: { fun: 20, social: 10 }, item: ['hot_cider', 2], money: 15 }, watched: { fun: 10, social: 6 },
    blurb: 'Hay bales and pumpkins fill Market Square, the tractor parade does laps of Chandler Street at two, and you can ride the hay wagon.',
    texts: { announce: 'The Harvest Festival is on Saturday at Market Square: stalls from ten, the tractor parade at two.', eve: 'Hay bales are stacked round Market Square. The Harvest Festival is tomorrow.',
      today: 'Harvest Festival today at Market Square, 10:00 to 18:00. The tractor parade sets off at 14:00.', opp: 'The Harvest Festival is on at Market Square. Have a go on the cider press, and hop on the hay wagon when the tractor comes round.',
      start: 'Chandler Street is closed beside Market Square: the Harvest Festival is open.', parade: 'The tractor parade is setting off along Chandler Street. Wave it down for a ride on the hay wagon.',
      end: 'The last pumpkin is sold. Chandler Street is open again.', rain: 'The Harvest Festival goes ahead in the rain. The cider is hot.', storm: 'The tractor waits for the storm to pass.' } },

  /* ------------------------------------------------------------------ 5. Autumn 13 */
  { id: 'lantern_parade', cal: 'lantern_parade', lines: 'lantern_night', name: 'Lantern Night Dragon Walk', short: 'Lantern Night', scheme: 'lantern', season: 2, day: 13,
    open: [18, 24], paradeAt: 20, finaleAt: 21.5, district: 'oldtown', site: { x: 100, y: 283.5, name: 'Lantern Row: Lantern Night' },
    close: [['r27', 264, 296]],
    route: { pts: [[112, 268], [112, 281], [86.5, 281]], half: 2, half2: 1.6 },
    lineup: [{ t: 'walk', rows: 2, cols: 2, look: 'lanternBig' }, { t: 'float', a: 'float.lantern.drum' }, { t: 'dragon', segs: 8 }, { t: 'walk', rows: 5, cols: 2, look: 'lanternKids' }, { t: 'band', rows: 2, cols: 3, look: 'bandLantern' }, { t: 'walk', rows: 4, cols: 2, look: 'lantern' }],
    stalls: [{ x: 87, y: 287, kind: 'lantern', text: 'LANTERNS', name: 'Paper Lanterns', sells: ['gift_candle'] }, { x: 104, y: 286.5, kind: 'food', text: 'GRILL', name: 'Night Market Grills', sells: FOOD.grill }, { x: 115, y: 271, flip: true, kind: 'tea', text: 'TEA', name: 'Moon Tea', sells: FOOD.tea }],
    props: [{ a: 'prop.lantern.wish', x: 97.6, y: 284.2 }],
    moment: { id: 'wish', prop: 0, label: 'Wish table', title: 'Write a wish', from: 18, to: 23.5, fx: 'skylantern',
      text: 'Write a wish on a paper lantern. At half past nine everyone lets theirs go together.',
      game: { kind: 'trace', title: 'Write your wish', hint: 'Follow the brush stroke.', level: 3, theme: { color: '#c0302a', color2: '#f2c230' } },
      done: 'Your lantern lifts off the table, warm in your hands for a second, and joins the others over the rooftops.' },
    wx: 'rain_ok', reward: { moodlet: 'festival_spirit', needs: { fun: 20, social: 14 } }, watched: { fun: 12, social: 8 },
    blurb: 'A thousand lanterns over Lantern Row. The paper dragon dances down Chandler Street at eight; at half past nine the wish lanterns go up.',
    texts: { announce: 'Lantern Night is on Saturday in Old Town: the dragon walks at eight, wish lanterns at half past nine.', eve: 'Lanterns are being strung across Lantern Row. Lantern Night is tomorrow.',
      today: 'Lantern Night tonight on Lantern Row from 18:00. The dragon sets off at 20:00; wish lanterns at 21:30.', opp: 'Lantern Night: write a wish on a paper lantern at the table on Lantern Row, and watch the dragon come down Chandler Street at eight.',
      start: 'Chandler Street is closed by Lantern Row: Lantern Night has begun.', parade: 'Drums! The dragon is coming down Chandler Street into Lantern Row.', finale: 'The wish lanterns are going up over Old Town.',
      end: 'The last lantern is out. Chandler Street is open again.', rain: 'Lantern Night goes ahead in the rain; the lanterns are oiled paper.', storm: 'The dragon waits under the arcade for the storm to pass.' } },

  /* ------------------------------------------------------------------ 6. Winter 5 */
  { id: 'winter_parade', cal: 'winter_parade', lines: 'winter_lights', name: 'Winter Lights Parade', short: 'the Winter Lights Parade', scheme: 'winter', season: 3, day: 5,
    open: [15.5, 21], paradeAt: 17, finaleAt: 18, district: 'downtown', site: { x: 216, y: 228.5, name: 'City Hall Plaza: Winter Lights' },
    close: [['r6', 206, 234]],
    route: { pts: [[209.5, 232], [230.5, 232]], half: 2 },
    watch: [{ a: [210.4, 225.6], b: [215.6, 225.6], face: 3, rows: 2 }, { a: [214.6, 220], b: [214.6, 225], face: 2, rows: 2 }, { a: [210.4, 219.8], b: [214, 219.8], face: 1, rows: 1 }],
    lineup: [{ t: 'walk', rows: 1, cols: 2, look: 'bannerW' }, { t: 'band', rows: 4, cols: 3, look: 'bandWinter' }, { t: 'float', a: 'float.winter.train' }, { t: 'walk', rows: 4, cols: 2, look: 'candle' }, { t: 'float', a: 'float.winter.gingerbread' },
      { t: 'walk', rows: 3, cols: 3, look: 'elves', anim: 'dance' }, { t: 'float', a: 'float.winter.globe' }, { t: 'walk', rows: 3, cols: 2, look: 'candle' }, { t: 'float', a: 'float.winter.sleigh' }],
    stalls: [{ x: 218, y: 225.2, kind: 'drink', text: 'COCOA', name: 'Mug & Mitten', sells: FOOD.cocoa }, { x: 222, y: 225.2, kind: 'food', text: 'CHESTNUTS', name: 'Chestnuts & Crepes', sells: FOOD.bakes }, { x: 226, y: 222, flip: true, kind: 'gift', text: 'GIFTS', name: 'Gift Hut', sells: FOOD.gifts }],
    props: [{ a: 'prop.winter.switch', x: 214.4, y: 222.2, id: 'switch', p: { on: false } }, { a: 'prop.winter.tree', x: 210.6, y: 221, id: 'tree', p: { st: 'dark' }, keep: [4, 14] }],
    moment: { id: 'switch', prop: 0, label: 'The big switch', title: 'Light the tree', from: 17.75, to: 18.6, fx: 'treelight',
      text: 'The mayor is looking for someone to throw the switch at six. The plaza counts down; pull on zero.',
      game: { kind: 'timing', title: 'Five... four... three...', hint: 'Throw the switch as the ring closes.', level: 3, o: { style: 'ring' }, theme: { color: '#2f8f6a', color2: '#f2c230' } },
      done: 'The tree blazes up, the plaza gasps, and the mayor shakes your hand.' },
    wx: 'rain_ok', reward: { moodlet: 'festival_spirit', needs: { fun: 24, social: 14 }, item: ['stand_coffee_cocoa', 1] }, watched: { fun: 12, social: 8 },
    blurb: 'Floats covered in lights roll past City Hall at five, and at six the giant tree on the plaza is lit. Somebody has to throw the switch.',
    texts: { announce: 'The Winter Lights Parade is on Friday: Market Street by City Hall at five, the tree lighting at six.', eve: 'The big tree is up on City Hall Plaza. Parade and tree lighting tomorrow from five.',
      today: 'Winter Lights Parade today. Market Street closes by City Hall at 15:00; floats at 17:00, the tree at 18:00.', opp: 'The Winter Lights Parade passes City Hall at five. At six somebody has to throw the big switch for the tree: it could be you.',
      start: 'Market Street is closed by City Hall for the Winter Lights Parade. Cocoa is on.', parade: 'The Winter Lights Parade is setting off along Market Street.', finale: 'Five, four, three, two, one... the tree is lit!',
      end: 'Market Street is open again. The tree stays lit all season.', rain: 'The Winter Lights Parade goes ahead whatever the sky does.', storm: 'The floats wait for the storm to pass.' } },
];
export const CITY_EVENT_BY_ID = Object.fromEntries(CITY_EVENTS.map(e => [e.id, e]));
