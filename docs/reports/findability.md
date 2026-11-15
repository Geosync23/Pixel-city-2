# Findability: quick tools in Wander, the Systems shelf, first-time windows (owner msg 107, BIBLE 21.3) — worker report

## What was built
1. **Wander front page: QUICK TOOLS.** Under the search box: six tiles (Fun right now · Something new · Fix a need · Tonight · This weekend · On a rainy day), each with a small live line ("8 ideas near you", "Lowest: Fun 35", "It is raining now"), the wide button "How things work here", and the top three Fun picks right on the cover with **Go** and **Add**. Every category, entry, stamp, What's On and the district list are unchanged below it.
   - A tool page is a short list of picks. Each pick has **Take me there** (the Map's route card; the last-metre arrow is selected through `G.navGoals.select`) and **Add to my day** (`G.myDay.add`; the row then shows "On your day"). Phone picks say **Open**, a part-of-the-game pick carries that Systems card's own button.
   - Nothing is ranked twice: every pick is an idea of the My Day engine (`G.myDay.ideas`). What the engine did not gather is fed to it through a new add-only hook, `G.myDay.addSource(fn)`: things to PLAY or practise at a place (guide activities with a `where`: chess, fishing, the arcade, sketching, darts...; kind `play`), fun on the phone (Pages / Reel / PlayBox, or "Get X on Appy"; kind `app`) and "An evening in" (kind `home`). These are gathered only for `ideas({ all: true })`, so the My Day sheet and app list exactly what they did before.
   - Fun right now: one of each kind first (show, event, city event, interest place, friend, coach, class, weather pick, play, phone, home), then the best of the rest; nothing outdoors while it rains. Something new: two places never visited, somewhere to eat you have not been, a recipe you know and have never cooked, a thing with no stamp, a skill never practised, two Systems cards still "new to you". Fix a need: all nine needs, lowest first, each with the nearest good open place (the HUD chooser's own logic: `G.nav.find` / `G.needsExtra.fix`), a meter and the distance. Tonight: in the daytime the evening's timed things then places open then; in the evening what is on and open now. This weekend: Saturday and Sunday, five each. Rainy day: six dry places of different kinds, nearest first, plus the stay-in picks; the page is titled "It is raining" when it is.
2. **THE SYSTEMS SHELF, "How things work here"** (Wander front page, the My Day sheet's foot, the Bay Basics cover, and `G.shelf.open()`): 36 cards in six groups. Each has an icon, two lines of how it works, your state in it right now, ONE button straight in, the first-time tips that belong to it (tap to re-read) and a gold "new to you" tag until you have used it. A "New to you" filter chip. API **`G.shelf`** (not `G.systems`: that name is the core's system list).
3. **FIRST-TIME WINDOWS**: 55 short windows, each shown once at the moment the player first touches a system, with at most one button and "Got it". They ARE the Bay Basics tips: `src/data/firsttime.js` is merged into the tips list by id (same id = the old tip's words are replaced and its seen record kept; new ids are added), every one is re-readable in Bay Basics under its topic and linked from its Systems card. **The tip banner is retired**: `G.tips.show()` now offers the window, so nothing arrives as a banner and a window.
   - Two kinds of trigger. **now**: the player has just opened the thing (Decorate, a till, the stove, a bus stop, an app); shown at once on top; if it cannot be shown it looks again for up to 18 s while they are still there, then is dropped until the next time. **soon**: something happened (hired, a parcel, a need went low); queued (saved) for a calm moment.
   - Rules in code (`calm()` in src/sim/firsttime.js): once each; after one closes the next waits 15 real seconds ("now") or 75 real seconds and 45 game minutes ("soon"); at most 6 waiting ones a game day (9 with the "now" ones); never during the arrival, a Chapter scene, a dialogue, a mini-game, a cutscene / ride, sleep or the title; on shift only the job's own; a "soon" one also waits until no window, phone or banner is up (9 s after the last banner) and nothing is being done; a "soon" one is shown only where it makes sense (Cooking at home, Talking to people out among people...), the ones about something that just happened go first, and a stale one is let go unseen.
   - Settings > Phone > **First-time tips: On / Off** (`G.state.tips.off`). Off shows nothing and marks nothing seen.
   - Old saves: tips already seen stay seen. On the first load of a save older than two game days, windows of systems the save has plainly used are marked seen (`G.shelf.touched`), so nobody is told on day 20 how a shop works.
4. **Wording sweep**: "planner / Calendar" -> "My Day / your day" in player text (list below).

## First-time windows (id · Systems card · trigger · text)
| id | card | trigger | title + text |
|---|---|---|---|
| `navigator` | map | now: the Map app is opened for the first time | **The Map knows the way** Tap "Where to?" and pick a place. The Map compares the walk, the bus, the train and a cab, with times and fares. Choose one and an arrow leads you right to the door. |
| `bus` | transit | now: a bus stop sign is tapped | **A bus stop** The sign shows which buses are coming and how long they will be. Wait here and get on when yours pulls in. Buses are cheap, so it is worth a look before you walk. |
| `train` | transit | now: a station entrance is tapped | **The light-rail loop** Eight stations ring the town. Pick where you are going on the line map, buy a ticket and wait on the platform. One fare takes you any distance. |
| `pass` | transit | soon: the second bus or train ride ends | **Riding often?** A day pass or a week pass covers every bus and train, and it soon pays for itself. Station panels sell them. |
| `wander` | stamps | soon: after Nora's first text is answered / the arrival is over | **Wander, your guidebook** Wander lists every place in town with its hours and what you can do there. Its front page has quick ideas for right now, and "How things work here" has a card for everything in the game. |
| `groceries` | groceries | now: the till of a grocer, market or corner shop is opened | **Buying groceries** What you buy here goes in your backpack, and into your fridge by itself when you get home. Cooking at home is the cheap way to eat well. |
| `cooking` | cooking | now: your stove is tapped · soon: groceries go into your kitchen | **Cooking at home** Your stove cooks from what is in the fridge. Every meal makes you a better cook, and better cooks learn more recipes. Books, cooking shows and friends teach new ones too. |
| `eatout` | eatout | now: the counter of a cafe, diner or restaurant is opened | **Eating out** Order here, then find a seat and eat. Every dish you have never tried is a small treat of its own. Places you have eaten at may bring dinner to your door later on. |
| `spoiled` | groceries | soon: something spoils | **Food goes off** Something of yours went off. Fresh food keeps for days in the fridge and far less in a backpack. Eat the oldest first. |
| `recipe_new` | cooking | soon: a recipe is learned after the arrival | **A new recipe** You have learned a recipe. Your stove lists every dish you know, and what each one still needs from the shops. |
| `decorate` | decor | now: Decorate is opened | **Making it yours** Drag a piece to move it. Tap it to turn it, store it or sell it. Shops around town sell furniture and big pieces arrive at your door the next morning; the Shop tab here lets you try a piece in your room first. |
| `furnshop` | furniture | now: the first furniture shop is entered | **A furniture shop** Everything on the floor is for sale. Tap a piece to look it over. Small things go home in your bag today; big pieces arrive at your door the next morning. |
| `deliveries` | roomy | soon: the first order is placed | **Your order is on its way** The courier rings in the morning on the day. A big piece needs you at home to take it in; small parcels wait at the door. Roomy tracks every one. |
| `boxes` | roomy | soon: a box lands in your home | **A box has arrived** Tap a box to unpack it, or to build it if it is a flat-pack. The piece lands where you planned it. Take the cardboard out afterwards and the room feels better for it. |
| `moving` | homes | now: Nestly is opened | **Somewhere new to live** Nestly lists every flat and house in town. Walk round one before you decide. Take it furnished as you see it, or bare and cheaper with a starter kit; a van brings your own things over. |
| `viewing` | homes | now: a viewing starts | **Just looking** Have a walk round. Nothing here is yours yet, so nothing can be used. If you like it, the listing lets you rent or buy. |
| `cleaning` | house | soon: a household supply runs low | **Running low at home** Soap, shampoo and cleaner run out with use. Grocers and corner shops sell them, and they go into your cupboard by themselves when you get home. |
| `sleep` | needs | soon: past midnight and still up | **It is late** Tap your bed and choose when to wake. A full night sets you up for tomorrow; stay up and the next day is harder. |
| `dresser` | closet | now: the dresser is opened | **Your dresser** This is everything you own to wear. Put an outfit together piece by piece and save the ones you like. Clothes worn for a few days go to the hamper for a wash. |
| `clothesshop` | clothesshop | now: the first clothes shop is entered | **A clothes shop** Take anything off a rack to look at it. The fitting room shows it on you before you pay. Every shop in town has its own style and prices. |
| `laundry` | laundry | soon: clothes turn dirty for the first time | **Washing day** Some of your clothes need a wash. They drop into your hamper when you change; take the laundry bag from there to a laundromat. A washer of your own does it for free. |
| `haircut` | hair | now: a barber or salon is entered | **A new look** Have a leaf through the lookbook. Pick a cut or a colour, sit in the chair and see it in the mirror. It grows out in time, so nothing is for ever. |
| `jobsboard` | jobs | now: the Jobs app is opened | **Finding work** These are a few starter jobs. The full board, with every job in town, is on the free computers at the library. Apply and you hear back at once. |
| `shift` | jobs | soon: hired | **You have a job** Your shifts are on My Day. Be at the door when one starts and you clock in by walking through it. Good shifts lead to promotions. |
| `autowork` | jobs | soon: the first shift starts | **On shift** Do the tasks that light up; each one done well counts. Not in the mood? Auto-work does the day for you at a steady pace, for the same hourly pay. |
| `promoted` | jobs | soon: promoted | **A promotion** Better pay from your next shift. The step after this one may ask for a skill; the Jobs app shows which. |
| `gigs` | jobs | soon: the first gig starts | **A gig** A gig is a one-off job that pays the same day. Follow the arrow to each stop. You can take a few a day from the Jobs app. |
| `bills` | money | soon: the evening before the first bills | **Monday bills** Rent and bills come out every Monday morning. If you are short, the balance dips below zero for a while and nothing worse happens. Bay Bank shows what is due. |
| `money_low` | money | soon: the balance drops under $50 | **When money is tight** Cooking at home, walking and a gig or two from the Jobs app all help. Nobody is ever turned out of their home in Maple Bay. |
| `opps` | opps | soon: the first Opportunity is offered | **An Opportunity** That was an Opportunity: a small thing someone in town would like, with a thank-you at the end. Take it or leave it. Nothing is lost, and more come along. |
| `uni` | university | now: the campus is entered | **The University** The Registrar signs you up for a course. Your classes then appear on My Day, and a certificate at the end helps you at work. |
| `uniclass` | university | soon: the first course is taken | **You are enrolled** Come to class at the times on My Day and keep up with the coursework. Sit the final when you feel ready. |
| `talk` | friends | soon: the first time you are inside a place with people; or Social runs low | **Talking to people** Tap someone and choose Talk. What goes down well depends on the person, and what you learn about them is remembered. Regular chats turn strangers into friends. |
| `gifts` | friends | soon: a friendship moves up | **Getting on well** A small gift goes a long way. Carry it in your bag and choose Give while you talk. Ask what they like first. |
| `invites` | friends | soon: an invitation is accepted | **It is on your day** Turning up on time is good for a friendship. My Day will tell you when to set off, and show the way. |
| `mail` | post | soon: the first letter is delivered | **You have post** Letters wait in the basket by your front door. To write back, any post office has paper, stamps and a counter for parcels. |
| `postoffice` | post | now: a post office is entered | **The post office** Write a letter or a card at the desk, buy stamps, or pack up a present at the parcel table. You can rent a box here for your own mail too. |
| `chapter_after` | chapters | soon: the first Chapter ends | **That was a Chapter** The story goes on at your pace. The next Chapter opens after a breath, and a gold marker shows where it starts. Whenever you're ready: it will keep. |
| `needs_tap` | needs | soon: a need goes low for the first time | **Running low** One of your needs is getting low. Tap its icon on screen for the nearest places that fix it, with the way there. Nobody comes to harm in Maple Bay. |
| `needs_soft` | needs | soon: Comfort, Outdoors or Inspiration goes low | **The gentle needs** Comfort, Outdoors and Inspiration are gentler than the rest. A cosy home, some fresh air, and anything new or beautiful fill them. They only colour your mood. |
| `fun_ways` | skills | soon: Fun runs low | **So many ways to have fun** A film, a game of chess, music, a swim, a friend, a book on your phone: Fun comes from all over town. Wander picks a few for right now. |
| `interests` | skills | soon: the second morning, if no interests are picked | **What do you like?** Pick a few interests in the Me app. Those things become more fun and quicker to learn, and the ideas the town offers lean your way. |
| `skills` | skills | soon: the first skill level | **Getting better** You are getting better at that. Each level makes it easier and opens something new. The Me app shows what every skill gives you. |
| `sk_minis` | coaches | soon: the first mini-game is played | **Mini-games** Most skill activities come with a short game like that one. Play well and you learn faster. Rather watch? The Me app can set them to play themselves. |
| `trait_earned` | traits | soon: a trait is earned | **A habit became a trait** Do something often enough and it becomes part of you. The new trait sits beside the three you chose; switch it off in the Me app if it does not suit. |
| `weather` | weather | soon: the first wet weather | **Rain** Walks are slower and soggier in the rain, and indoor places fill up. A cab keeps you dry, and Wander has ideas for a rainy day. |
| `passout` | needs | soon: a need hits the bottom | **Run right down** No harm done, though you lose a little time. When a need turns red, tap it and the nearest fix is one more tap away. |
| `stamp` | stamps | soon: the first stamp | **Your first stamp** Wander keeps a Stamp Book of everything there is to try in Maple Bay. Do a thing once, anywhere, and it is stamped for good. |
| `shows` | shows | soon: the first ticket is bought | **You have a ticket** Wait in the lobby. When the doors open, go through and find your seat. My Day has the time, and the arrow leads you to your row. |
| `events` | events | soon: a city event opens | **A big day in town** Today is one of the six big days of the year. A street is closed for stalls, games and a parade. Add it to your day and the arrow takes you there. |
| `sight` | sights | now: the first showpiece is entered | **One of the big places** Get a ticket at the desk, then wander. Every room has something to do, and the place changes through the day. Its page in Wander lists what not to miss. |
| `mall` | clothesshop | now: the mall is entered | **The Galleria** Clothes, furniture, a salon and a food court under one roof. A good place to be when it rains. |
| `skydeck` | sights | now: the SkyDeck is entered | **The SkyDeck** The lift goes to the top of the tower for the best view in town. Go at sunset if you can. |
| `phonefun` | phonefun | soon: the first sitting with Pages, Reel or PlayBox | **Fun in your pocket** Reading, watching and playing on your phone all fill Fun, and more so on a ride or in a queue. A little goes a long way, so mix it with getting out. |
| `store` | appy | soon: an app comes out on Appy after the first day | **A new app is out** New apps are free on Appy. Install the ones you fancy; more appear as the days pass and as you try new things. |
Also shown as a window now (text owned by another file): `bladder` (src/sim/bladder.js calls `G.tips.show('bladder')` when Bladder first runs low; its text is four sentences long).

## Systems cards (jump target · verified)
| id | card | the one button | verified |
|---|---|---|---|
| `needs` | Needs & Wellness | Wellness app | tap |
| `skills` | Skills & interests | Me app, Skills tab | tap |
| `traits` | Traits | Me app, Traits tab | tap |
| `coaches` | Mini-games & coaches | route card to the nearest coach who is out now; else the Me app | tap (route to Blitz) |
| `closet` | Clothes & the Closet | Closet app; before it is installed: at home the arrow points at the dresser, away a route home | tap, all three |
| `clothesshop` | Clothes shops | route card to the nearest open clothes shop | tap |
| `laundry` | Laundry | route card to the nearest laundromat | tap |
| `hair` | Hair | route card to the nearest barber / salon | tap |
| `bag` | Your backpack | closes the phone, opens the Backpack window | tap |
| `cooking` | Cooking & recipes | at home: the arrow points at the stove ("Your stove: tap it to cook"); away: a route home | tap, both |
| `groceries` | Groceries | route card to the nearest open grocer (G.nav.find) | tap |
| `eatout` | Eating out | route card to the nearest open food place | tap |
| `decor` | Decorating your home | at home: opens Decorate; away: a route home with a line saying where the button is | tap, both |
| `roomy` | Roomy & deliveries | Roomy app; before it is installed: at home Decorate on its Shop tab, away a route home | tap, all three |
| `furniture` | Furniture shops | route card to the nearest open furniture shop (G.goods.stores) | tap |
| `house` | Keeping house | at home: the Home supplies window; away: a route home | tap, both |
| `homes` | Places to live | Nestly app (its Appy page while it is not installed) | tap, both |
| `jobs` | Jobs & shifts | Jobs app | tap |
| `money` | Money, bills & the bank | Bay Bank app | tap |
| `opps` | Opportunities | Opportunities app | tap |
| `university` | University | route card to the University (the Campus app once enrolled) | tap (route); Campus branch not run |
| `chapters` | Chapters: the story | sets the arrow to the gold marker of the open Chapter ("Follow the gold marker. No rush."); when none is open, a kind line | tap (Chapter 1 open); the "none open" line not run |
| `friends` | Friends & family | Circle app; before it is installed: Messages, People tab | tap, both |
| `messages` | Messages | Messages app | tap |
| `post` | Post & parcels | route card to the nearest post office (G.post.nearest) | tap |
| `myday` | My Day | closes the phone, opens the My Day sheet | tap |
| `map` | The Map | Map app | tap |
| `transit` | Buses & trains | route card to the nearest stop / station | tap |
| `cab` | Cabs | MapleCab app | tap |
| `shows` | Films, concerts & plays | Showtime app; before it is installed: Wander's What's On | tap, both |
| `sights` | The big places | route card to the nearest big place not yet visited + a chip for each of the ten | tap (button + the Aquarium chip) |
| `events` | City events & festivals | the live event's street when one is on; else Wander's What's On | tap (What's On); live-event branch not run |
| `weather` | Weather & seasons | Skies app; before it is installed: a line with tomorrow's forecast | tap, both |
| `stamps` | The Stamp Book | Wander, Stamp Book | tap |
| `phonefun` | Pages, Reel & PlayBox | Pages (then Reel, PlayBox); before any is installed: Appy | tap, both |
| `appy` | New apps | Appy | tap |
"tap" = a real touch tap on the card's button in Playwright (390x844, hasTouch, dist build), result read from the page (app opened / route card title / window title / arrow label).

## What changed in tips (src/ui/phone_tips.js)
- The window texts are merged in by id. Replaced words: navigator, bus, train, pass, wander, groceries, cooking, eatout, decorate, deliveries (was "usually the same day"), boxes, moving, sleep, jobsboard, shift, autowork, gigs, bills, money_low, talk, gifts, invites, needs_tap, weather, skills, shows, events, mall, skydeck, store, and laundry / dresser / haircut / sk_minis (registered by other files; the window's words win, re-applied on 'ready'). 81 tips in the app now.
- `show(id)` no longer sends a "Tip: ..." notification; it calls `G.firstTime.offer(id)`. The old `wire()` (all triggers), the hold-during-airport and hold-during-sleep lists are gone: the queue in firsttime.js does that. `fridge` and `planner` lost their triggers (covered by `groceries`, and by My Day's own walk-through); `planner` is rewritten as "My Day", `needs` now names all nine needs.
- App: a "How things work here" button on the cover, "Lately" (the last three windows shown) when nothing is unread, and a "How it works: <card>" link under every tip that has a card. New `go: { sys }` (a card's jump).

## Wording sweep (text-only edits)
src/ui/phone_guide.js ("Add to my day", "On your day", What's On line), phone_tips.js (gigs, invites, events, planner tip), phone_home.js:109, phone_minis.js:33, phone_opps.js:26-27, phone_taxi.js:72, phone_messages.js:102, phone_jobs.js:41, src/story/intro.js:237, 246, 296, src/story/texts.js (9 x "on your calendar" -> "on your day", 1 x "Calendar has it" -> "My Day has it"), src/sim/aquarium.js:124, 129, museum.js:112, 123, 288, cityhall.js:198, observatory.js:113, 118, arena.js:118, hotel.js:238, 239.
Left alone on purpose: NPC lines about their own calendar (ambient_lines.js, letters.js, two Opportunity texts), item names (wall calendars, a day planner), design notes in data/phone.js.

## Files
NEW: `src/data/firsttime.js`, `src/sim/firsttime.js`, `src/ui/firsttime.css`, `src/data/systems.js`, `src/sim/systems.js`, `src/ui/_guide_quick.js`, `src/art/icons/systems.js` (17 icons `sys.*`).
EDITED (mine): `src/ui/phone_guide.js` (+ quick tools block, tool page, shelf page, deep links `{ tool }` / `{ tab: 'systems', sys }`), `src/ui/phone_guide.css`, `src/ui/phone_tips.js`, `src/ui/phone_settings.js` (one toggle).
EDITED (add-only): `src/sim/myday.js` (`addSource`, `ideas({ all })`, `i.base`), `src/ui/myday.js` (two small buttons at the foot of the sheet: "How things work here", "Fun right now").
EDITED (text only): the sweep list above.

## API
- `G.shelf` = `list()`, `get(id)`, `jump(id, ctx?, chipId?)`, `touched(id)`, `touch(id)`, `groups()`, `nearestPlace(re)`, `open()`. State `G.state.shelf = { v, t: { id: 1 } }`. Event `shelf:touch`(id).
- `G.firstTime` = `offer(id, { now?, delay? })`, `show(id)` (force), `close()`, `isOpen`, `queue()`, `enabled()` / `setEnabled(bool)`, `calm(now?)` -> reason | '', `windows()`, `shown()`, `rush(bool)` (tests: no gaps, no cap). Events `firsttime:show`(id), `firsttime:close`(id, 'ok' | 'go'), and the old `tip`(id). State inside `G.state.tips`: `off, v, q, qt, day, n, nn, nw, rides, at`.
- `G.tips` unchanged in shape (`register, all, get, show, seen, go, topics`).
- `G.myDay.addSource(fn({ day, at, T, isToday, push, have })) -> off`; `G.myDay.ideas({ all: true })`.
- Deep links: `G.phone.open('guide', { tool: 'fun' | 'new' | 'need' | 'tonight' | 'weekend' | 'rainy' })`, `{ tab: 'systems', sys?: cardId }`.

## Lines wanted from the lead (files I may not edit)
- `src/sim/university.js:161, 188` "It is in your Planner." -> "It is on My Day."; `:180` "Your Planner has the new time." -> "My Day has the new time."
- `src/ui/phone_uni.js:42` "Classes appear here, and in your Planner, when you enrol." -> "... and on My Day, when you enrol."
- `src/sim/apps.js`: the My Day worker's list (Planner -> My Day at :21, :22, :44, :62); the Bay Basics description could say "short windows the first time you try something, all kept here".
- `src/sim/bladder.js:180`: the bladder tip is now a window; two or three sentences would suit it better (and `sys: 'needs'` links it to its card).
- Optional, `src/sim/chapters.js`: no window was added for "a Chapter is open" because the engine already sends its own notice; `chapter_after` comes after the first Chapter ends.

## Verified
Real touch taps (Playwright, hasTouch, 390x844, dist build; New Game -> creator -> traits -> home picker by taps, then `G.intro.skip()`):
- Wander front page at 08:30, 13:00, 19:30, 23:36 and in rain: tiles, live lines and the cover picks change with the hour and the weather. Front page build 19-30 ms.
- All six tools: tile -> list -> a pick -> Add to my day (row shows "On your day", entry on the schedule; a Saturday pick lands on Saturday 08:00) -> Take me there -> route card -> Walk -> waypoint + arrow. Arrival: the open-air market arrived by the arrow's own rule; for buildings the arrow turns to "Go in: X" (the walk itself was a teleport close by, then the pathfinder). One chain end to end: Fix a need > Hunger > "Cook at home" > Add > Take me there > "Go in: Juniper Court → cook something: the kitchen" > through the door > inside the arrow points at the kitchen and the any-time entry is ticked off.
- Every Systems card's button (36 of 36) in two states (day 2 with the starting apps; all store apps installed), plus the at-home branches (stove arrow, dresser arrow, Decorate, Decorate's Shop tab, Home supplies window), the Aquarium chip, a tip link to Bay Basics and back to the highlighted card.
- First-time windows by their real moment: Decorate chip (the owner's example, text as specified), the stove, the wardrobe, the Map app, the Jobs app, a grocer's till, a cafe counter, a bus stop, a station entrance (the last four through `G.useInteractable`, the same path a tap takes).
- Settings toggle Off / On; "Got it"; "Show me" (Fun right now page; a furniture shop route); Bay Basics topic page with the card links.
- An old save (QA round 5, day 4, written before this work): loads, the 15 tips it had seen are still seen, 26 more marked seen by what the save shows, no window in 40 s of play, Jobs app opens with no window, off survives save / load.
API / eval: hired -> "You have a job", order placed, box landed (at home only), needs low (Running low, then So many ways to have fun, then The gentle needs), rooms entered by `G.go` (furniture shop, clothes shop, barber, post office, museum, university), blocked states (`calm()` says intro / scene / gap / off), a second "now" straight after one is refused ("gap"), save / load keeps the record.
**Two scripted days of a new game with the windows on** (real waits at 1x / 4x between steps, night skipped by API): nothing during the arrival; day 0: Wander 14:31, Decorate 14:53, the stove 15:28, the Map 15:59, a grocer's till 16:08, an Opportunity 17:16 = six; day 1: Running low 00:24, Jobs 08:21, Eating out 09:35, You have a job 11:12, You have post 15:42 = five. No "Tip:" banner at all. None came during a Chapter, a mini-game or a dialogue; the waiting ones never shared the screen with a banner or a toast; the Decorate one (a "now" window, bottom of the screen) came up while one phone banner was still showing at the top.
Zero page errors in every run. `node src/data/validate.mjs` clean, `node tools/build.mjs` ok.
NOT verified: a hand-played two days; these windows' triggers were not reached in a test (same one-line listeners, event names checked against the source): pass, spoiled, recipe_new, moving, viewing, cleaning, sleep, laundry, autowork, promoted, gigs, bills, money_low, uniclass, gifts, invites, mail by its real delivery (it did come in the two-day run), chapter_after, interests, skills, sk_minis, trait_earned, weather by itself, passout, stamp, shows, events, mall, skydeck, phonefun, store by itself (it did come in the trigger run); the Campus and live-event branches of two cards; arrival for picks at a coach or a friend.

## Known gaps
- 55 windows, more than the 35-50 asked for; the daily cap, not the count, is what keeps a day calm.
- A "now" window does not wait for a banner (it would miss its moment); they sit at opposite ends of the screen.
- A window dropped for the gap or the cap comes back only the next time its moment does.
- "New to you" on an old save is inferred from what the save records; a few systems the player did use may still carry the tag (in the day-4 save: Decorating, Money, My Day).
- Tonight asked in the daytime, and the weekend, use the engine's "another time" lists: things with a time plus places open then, no friends or needs (the My Day worker's stated limit).
- "Take me there" for a pick inside a building ends at the door unless navGoals has a resolver for that place (it does for needs, shows, showpieces).
- The state lines read other systems' slices defensively; a system that renames a field shows an empty line, never an error.

## Owner decisions
- Is six waiting windows a day (nine with the ones you open yourself) the right ceiling, or fewer?
- The shelf is called "How things work here" and lives in Wander, with links from My Day and Bay Basics. Should it also have a place on the game screen?
- "Fun right now" is one tap from the My Day sheet and two from the phone. Should the low-Fun need icon open it directly instead of the nearest-places chooser?
