# Phone, messages, planner — notes (full docs in the headers of src/ui/phone.js, src/sim/messages.js, src/sim/planner.js)
- `G.phone.open(appId?, arg?)`, `close()`, `notify({ type? (id from data/phone.js NOTIFICATIONS), app, title, text, icon?, priority? low|normal|high, data?, face?: npcId })`,
  `unlock(appId)`, `lock(appId)`, `registerApp({ id, name, iconId?, color?, slot?, render(body, ctx), badge?() })`, `setWaypoint(placeOrId|null)`.
  Events: phone:open/close/notify/unlock/app, waypoint, waypoint:arrived, taxi:request(placeId, fare), taxi:cancel, delivery:order/arrived, photo.
  Deep links: messages {thread|person|tab}, planner {appt|day|add:true, withNpc?, placeId?}, map {place}, taxi {place}.
- `G.messages.send({ from: castId (or any id + name), text, replies?: [{label, value, then?}], appt?: {title, placeId, t, dur?, kind?, withNpc?, data?}, onReply?: eventName, delay? (game min) })`.
  Replies emit `msg:reply`(threadId, value, msg) and `G.emit(onReply, value, threadId, msg)`. `msg:appt`(threadId, accepted, apptId). Also `threads()`, `unread()`, `sendMine(threadId, text)`.
- `G.planner.add({ title, placeId, t (abs game minute), dur=60, kind story|friend|work|event|personal, withNpc, data, remind=30 })` -> id; `remove`, `get`, `update`, `done(id)`, `list(fromT, toT)`, `next()`.
  Events appt:add/remove/soon/start/done/missed. Kept = player in the room / within 12 units of the place while it ran, or `done(id)`.
- Hooks the phone calls if present: `G.social.known()/rel/tier/npc(id).spec/whereIs/call/onText/invite(npcId, {apptId,title,placeId,t,dur})`; `G.transit.callTaxi(placeId)` (false = refuse), `fare(placeId)`, `cancelTaxi()`;
  `G.jobs.current() -> {id|jobId, level, progress?}`, `listings('phone')`, `apply(id)`, `gigs('phone')`, `acceptGig(id)`, `quit()`; `G.money.loan()`, `G.housing.mortgage()`, `G.audio.setVolume(k,v)`.
- MapleCab is unlocked from the start; the intro may `G.phone.lock('taxi')` then `unlock('taxi')` for the "new app" moment. Transit should send `G.phone.notify({ type: 'taxi_arriving', ... })`.
- Keys: M/Q open the phone (via HUD). The phone pauses the sim while open.
