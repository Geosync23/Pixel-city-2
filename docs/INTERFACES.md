# System interfaces — the names every gameplay module agrees on

Each system lives in its own file(s), owns one state slice, attaches its public API to `G.<name>` in `init(G)` and documents it at the
top of its file. Other systems call it defensively (`G.money?.add(...)`) because modules land at different times. Data comes from
`src/data/*` (systems/economy) and `src/story/*` (cast, dialogue, story, intro, texts) — read those files; do not duplicate their numbers.

| API | Owner file | Must provide (minimum) | Events it emits |
|---|---|---|---|
| `G.needs` | sim/needs.js | `get(k)`, `add(k, d)`, `set(k, v)`, `all()`, `mood()` 0-100, `moodlets()` -> [{id,name,desc,icon}], `addMoodlet(id, hours)`; fitness stat | `needs:change`, `needs:low`(k), `needs:zero`(k), `moodlet`(id) |
| `G.skills` | sim/needs.js | `level(k)`, `xp(k)`, `addXp(k, n)` | `skill:up`(k, lvl) |
| `G.money` | sim/money.js | `get()`, `add(n, reason)`, `pay(n, reason)` -> bool (false + toast if broke), `canAfford(n)`, weekly bills, history | `money`(delta, reason) |
| `G.inv` | sim/inventory.js | carried bag: `items()` -> [{id, qty, day}], `add(id, qty)` -> bool, `remove(id, qty)`, `count(id)`, `capacity`; home storage: `fridge` same shape; spoilage; `use(id)` (eat/read/gift...) ; `open()` inventory window | `inv:change` |
| `G.shop` | ui/shop.js | `open(venueId, opts)` buy window from venue stock/menu (data/venues + items); `eatIn(dishId)` | `shop:buy`(itemId, qty, venueId) |
| `G.activities` | sim/activities.js | `start(activityId, ctx)` wraps `G.startActivity` with effects from data/activities.js; registers fixture handlers (`registerFixture`) for every function tag; outdoor spot activities from world pois | `activity:done`(id) |
| `G.hud` | ui/hud.js | top bar (clock, date, weather, money), needs meters (tap to expand), moodlets, activity progress + cancel, interaction prompt, time-speed buttons (1x/2x/4x), phone button | |
| `G.phone` | ui/phone.js (+ui/phone_*.js) | `open(appId?)`, `close()`, `notify({app, title, text, icon})`, `unlock(appId)`, `isOpen` | `phone:open`, `phone:close`, `phone:notify` |
| `G.messages` | sim/messages.js | `send({from: npcId, text, replies?: [{label, value}], appt?: {...}, onReply?: eventName})`, `threads()`, `unread()` | `msg:new`, `msg:reply`(threadId, value) |
| `G.planner` | sim/planner.js | `add({title, placeId, t (abs game minute), dur, kind, withNpc, data})` -> id, `remove(id)`, `list(fromT, toT)`, `next()`; reminders 30 min before | `appt:soon`(a), `appt:start`(a), `appt:missed`(a) |
| `G.places` | sim/places.js | registry of named destinations for map/taxi/appointments: `list(kind?)`, `get(id)` -> {id, name, kind, x, y, district, poi}; built from city pois + data/venues; `known(id)`, `discover(id)` | `place:discover`(id) |
| `G.transit` | sim/transit.js (+traffic.js) | `callTaxi(placeId)` (cab drives to player, ride cutscene, fare), `hailTaxi()`, bus stops & routes (`boardBus`), `rideTrain(fromStation, toStation)` (cutaway scene `train`), fares/pass | `ride:start`(kind), `ride:end`(kind, placeId) |
| `G.crowd` | sim/crowd.js | ambient pedestrians/animals/parked+moving life around the player (not agents); density by district/time/weather | |
| `G.social` | sim/social.js | named NPCs (story/cast.js) on schedules, in city and rooms; `npc(id)`, `rel(id)` 0-100, `addRel(id, d)`, `tier(id)`, `talk(id)` conversation UI, `known()`; invitations both ways; anonymous citizens can be chatted with | `friend:up`(id, tier), `npc:met`(id) |
| `G.jobs` | sim/jobs.js | `listings(source)`, `apply(jobId)`, `current()`, shifts on the planner, work loop at fixtures (station tags), auto-work, pay, promotions, gigs | `job:hired`, `job:shift:start/end`, `job:promoted` |
| `G.housing` | sim/housing.js | `G.state.home = {id, items: [...], fridge: [...]}`; `current()`, `homes()`, `rent/buy(homeId)`, furniture ownership + placement (`place/move/sell`), builds the dynamic room `home:<id>` | `home:move`, `home:furnish` |
| `G.story` | story/_engine in sim/story.js | runs story/story.js beats + story/intro.js sequence (airport arrival -> taxi tutorial -> apartment), goals checklist | `story:beat`(id), `goal:done`(id) |
| `G.weather` | sim/weather.js | `current()`, `forecast(d)`, `isWet()`, `crowdFactor()` | `weather`(kind, intensity) |
| `G.audio` | sim/audio.js | `sfx(name)`, `music.play(id)` | |

Conventions
- City places are world pois (`G.sceneCache.get('city').world.pois`, or import `getCity()` from `src/world/city.js`): `door:<roomId>`, `station:<id>`, `busstop`, `taxistand`, `spawn:airport`, `bench`, `spot`, `landmark`.
  Room ids: venue ids (`cafe`, `grocery`, ...) and homes `home:<homeId>`. Enter with `enterRoom(roomId, doorPoiId)` from `src/scenes/interior.js`.
- Furniture function tags (bed, fridge, stove, tv, computer, shower, checkout, ...) connect art -> rooms -> gameplay: gameplay registers `registerFixture(tag, handler)`.
- Money is integer dollars. Needs 0-100. Time in absolute game minutes (`G.state.t`); `G.now()` for calendar fields.
- UI: one window at a time; use `modal/choose/say/toast/bubble` from ui/kit.js; everything reachable by touch; no hover-only affordances; keyboard shortcuts are a bonus.
- Every system must survive save -> reload (`G.save(); G.load()`): keep runtime caches out of `G.state`, rebuild them on `'load'`.
- Autosave is owned by ui/hud.js (on sleep, scene change, every 2 game hours).
- Night light (src/engine/render.js `NL`, docs/reports/nightlight.md + pool_occlusion.md): default since Stage 121 = pools on the ground (dithered), wall light
  SMOOTH from lamps / headlights in front of a building and its own door / window pools, never from a lamp behind it. URL test switches `?nightlight=`
  `strict` (Stage 120: no pools on walls) | `dither` or `nowalls` (Stage 119: wall light dithered) | `noocc` (Stage 118: pools across everything; the kill
  switch) | `wallown` / `smoothA` (a building keeps only its own pools, dithered / smooth) | `old` | `noprops` | `notrees` | `notiles`. At run time: set
  `G.renderer.nl.walls / wallOwn / smooth / occ` and `nl.gen++`. After ANY change to the night pass run `node tools/poolocc_check.mjs`, `node tools/nightcheck.mjs`
  and `node tools/perf.mjs --verify` (night cost over a long session: `node tools/perf.mjs --nightsoak N`).
