# QA round 4 (Opus QA & data lane, 2026-11-15): clothes/hair/laundry, traits + mini-games, post offices, media apps, showpieces, dev mode, leftovers

All runs used headless Chromium from `src/` in portrait **390x844**, unless a line says otherwise.

**The driver** is in `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/r4/`:
- `drv.mjs` + `help.js`: round 3's runner, plus:
  - `seed:` puts a save file in localStorage, reloads, and **clicks Continue on the title screen**.
  - `saveTo:` writes a checkpoint.
  - `type:` types real keystrokes.
- `mg.mjs` / `mg2.mjs`: a mini-game bot. It reads each game's `want()` hint and plays it with real Playwright **touch taps** (`touchscreen.tap`) and mouse drags / holds.
- `sweep.mjs`: the interactable-reachability sweep.
- Scenario files: `nc*`, `cl*`, `la*`, `hr*`, `po*`, `md*`, `sp*`, `dv*`, `tr.mjs`, `t7*.mjs`.
- Screenshots are in its `shots/`.

**Checkpoints:**
- `ck_bag.json`: a game started through the real New Game flow, played to day 4. It has 6 pieces bought, 3 days worn and the laundry bag picked up.
- `ck_post.json`, `ck_mail.json`: later post-office states.

**What "real" means here:**
- Walking is done by the pathfinder: `G.useInteractable`, which is what a tap does.
- DOM buttons are clicked at their screen position.
- Canvas games get pointer events.
- Lines marked **(setup via API)** used the API only to set the scene up: teleports, `G.advance` for days, dev-mode needs freeze, adding a few items to the bag.

The shared tree changed under me all session (goods / navigation / university workers). One post-office run logged 36 "object is not iterable" exceptions. Re-running the same scenario twice gave 0, so I count it as another worker's mid-edit file, not a defect (not proven).

## Defects

| # | what | where | sev | status |
|---|---|---|---|---|
| D1 | **Barber mirror was a dead tap.** The default use spot of the wall mirror is inside the barber chair. You walked over and nothing happened, from a tap or from the action chip (Otis & Sons, every barbershop). | src/sim/hair.js | high | **Fixed.** `spot: null, range: 2.4`. A real tap now opens the lookbook. Played: Skin Fade + full beard, $30, 25 min in the chair, reveal. |
| D2 | **70 of 3,524 interactables in 213 rooms can never fire** (sweep, then spot-checked with real walk-and-use). `G.useInteractable` walks to `it.spot`. If the path ends more than 0.4 from it (the spot is inside furniture), the tap is dropped silently (core/game.js:156 `else if (!p.path) G.pending = null`). Confirmed dead: Hotel spa restroom; aquarium "Spot: Manta ray", "Spot: Magellanic penguin", "Species plaque: Spotted garden eel, Cuttlefish"; museum "Look: the centrepiece"; lighthouse stair "A framed shipwreck"; airport "Gate B1-B6"; pub:47 "Listings"; some "Sit" in home:sibling and the natatorium; 1 of 3 "Flip Through the Flash" (pub:41). Full list: sweep output (#2). | src/core/game.js (lead) | high | **Needs the lead** (core). Suggested one-line fallback covering all 70: `else if (!p.path) { if (Math.hypot(tx - p.x, ty - p.y) <= Math.max(G.pending.range, 1.6)) G.pending.fire(); else G.pending = null; }`. Then re-run `sweep.mjs`. |
| D3 | **Vintage rummage bins always showed "Nothing matches".** The bins list the cheapest mixed pieces, but the window still filtered them by the rack's slot (tops). | src/sim/clothes_shop.js | medium | **Fixed** (no slot filter for bins). Ink & Ivy: 16 pieces shown, a $1 pair of socks put in the basket. Leaving with it unpaid gave "You hang 1 unpaid piece back…". |
| D4 | **Flyer coupons could not be clipped.** Opening a flyer in Maple Post marked it read without clipping it, and its note said "Open the flyer from your basket to clip it". But "Pick up the post" already empties the basket. | src/ui/phone_post.js | medium | **Fixed.** Reading it in the app clips it ("Coupon clipped: 15% back… (10 days)"). Real purchase at Slice of Heaven: soda $2.50, "Coupon: $0.50 back." |
| D5 | Thread & Co.'s flyer ("a little off anything on the rail") never paid on clothes. Coupons refund on `shop:buy`; rack and till purchases emit `wardrobe:buy`. | src/sim/post.js | medium | **Fixed** (`onClothes`). Real "Buy now" of a $14 tee with the coupon: "Coupon: $1.50 back." (the coupon was set up via the API). |
| D6 | Parcel replies talked about a letter: "IT WAS A GOOD WARM LETTER…". Parcels get tone 'warm' by default. | src/story/letters.js | medium | **Fixed.** The tone paragraph is dropped for parcel replies (all 6 senders). |
| D7 | The hair reveal showed you still in your hat, so the new cut / colour was hidden (the lookbook preview already takes the hat off). | src/sim/hair.js | medium | **Fixed** (looked at: Skin Fade + beard; blue/pink ombre). |
| D8 | Toasts slid under the tip / "New app" banner. At 390 px both sit at y≈104, and the banner has z 60. | src/ui/phone.js (brief 7c) | medium | **Fixed.** While a banner shows, `#toasts` gets a `padding-top` that starts it under the banner. padding because navigator.js owns `top` and hud.js owns `margin-top`. Measured: first toast at y 104-159 under a banner ending at 161 → now y 167. Screenshot `t7c`. |
| D9 | The "New app" banner covered the cook menu's tabs right after a new game (brief 7b / QA3 D27). | src/ui/phone.js | low | **Fixed.** Banners are held while `G.modal > 0` (unless the phone itself is open). One already showing when a menu opens is taken back and re-shown after. Checked: 12 samples with the cook menu open, no banner; banners drop in after closing. |
| D10 | Strangers never reacted to the wardrobe states: `_crowd_lines.playerStates()` ignored `G.wardrobe.playerStates()` (brief 7a). wardrobe.js also ran its own same-outfit bubble outside the 18 s limit. | _crowd_lines.js, wardrobe.js | low | **Fixed.** Merged. wardrobe.js's own reaction now honours and sets `REACT`. |
| D11 | "broke" / "flush" city-folk lines could never fire: `_crowd_lines` called `G.money.balance()`, which does not exist (`G.money.get()`). | _crowd_lines.js | low | **Fixed.** |
| D12 | Mini-game header buttons were 40x38 px (Pause and Stop side by side). | src/ui/minigame.css | low | **Fixed:** 44x44 (bot run after: `II:44x44`, `x:44x44`, Auto 54x44). |
| D13 | Post packing-table −/+ buttons were 30x30 px. | src/sim/post.js | low | **Fixed:** 40x40. |
| D14 | Arena: sitting during doors (an hour before tip-off) said "Watching the game · 3h 18m left". The lead's "8h 19m" did not reproduce. Phases over two days are sane (doors 18:19, live 19:19, exit 21:19; concert / ice show likewise), so it was likely a debug-scene load. | src/scenes/rooms/arena_bowl.js | low | **Fixed** (label only): "Waiting for tip-off" / "Waiting for the show" during doors, then the old label. Re-run: "Waiting for tip-off 3h 18m left" at 18:06. |
| D15 | Dev Teleport list showed stations / homes twice (as the place and as its landmark: "Airport Station", "12 Sycamore Street"…). | src/ui/devmode.js | low | **Fixed** (deduped by name). |
| D16 | Turning dev mode off left the game at 8x / 16x, which the normal HUD (1x / 2x / 4x) cannot show or undo. | src/ui/devmode.js | low | **Fixed:** turning it off caps the speed at 4x. |
| D17 | Letters: "a analyst", "a express courier" (job titles in 6 places), Dad's greeting "DEAR Rosa," in his all-capitals hand, double spaces in parcel replies when nothing was named. | letters.js | low | **Fixed:** `an()`, upper-case greeting, `P` normalises spaces. Automated render: 45 letters x 4 contexts + 54 replies, 0 glitches. |
| D18 | Letters typos / continuity: "showoff" → "show-off"; Dad (US voice) "PRACTISE" → "PRACTICE". Mrs. Varga "homework, set thirty years late" and "Thirty years ago I wrote on your report": the player is in their twenties (Sam: "went straight into a job at twenty-two"), so this became **ten** years. | letters.js | low | **Fixed.** Questionable items are listed below, not changed. |
| D19 | Four new cinema films had the generic poster. | src/art/performance/perf.js | low | **Done:** `heist` (trench-coat otters, spotlit mackerel), `lantern` (boy, string, glowing lantern), `bigclaw` (red claw out of the harbor, Bay Wheel, pier), `extratime` (Otters red / cream, hoop and ball). Also added to POSTERS / BAND. Looked at in the gallery and at 7x. |
| D20 | **Aquarium (known item): a speech bubble near the screen edge is cut off.** Measured: a bubble anchored at x 375 shrinks to 63 px wide and runs to x 406 on a 390 screen. The cause is generic: `kit.js bubble()` has no edge clamp, and an absolutely positioned bubble shrinks to the space left. | src/ui/kit.js (lead) | medium | **Needs the lead** (kit.js is only mine for 7c). Suggested: add `width:max-content` to `.bubble`, then in `upd` after positioning: `const r = b.getBoundingClientRect(), dx = Math.max(6 - r.left, 0) + Math.min(innerWidth - 6 - r.right, 0); if (dx) b.style.left = (s.x + dx) + 'px';`. That is what QA3 D2 did for crowd bubbles. |
| D21 | The "+ Goals 0/5" chip sits on top of every modal's title / first line in portrait: rack window, dresser ("Dresser" title), stamp sheet, letter view. | goals.css / goals.js (not mine) | medium | **Needs the owner of goals.** Hide it or drop its z-index under `.modal` while `G.modal > 0`. |
| D22 | Closet app release rule is `G.wardrobe.owned().length >= 2` (outfit **sets**) or day 4. Buying 6 pieces on day 1 did not release it, unlike the clothes report's "first purchase or first dirty clothes". | src/sim/apps.js (lead) | low | **Needs the lead:** `poll: () => (safe(() => G.wardrobe.pieces().length, 0) > 0) || safe(() => G.wardrobe.owned().length, 0) >= 2`. |
| D23 | A planner "Starting now: Breakfast at Nana's **at Nana's House**" card covers the top of an open letter, with the doubled place text. | planner / phone (not mine) | low | Report only. |
| D24 | A city label reads **"Nora' House"**. | src/world/_blocks.js:34 (world file) | low | Report only: `"Nora's House"`. |
| D25 | Toasts ("Try Things On: Fun +8", "First Style practice…") cover the fitting-room title and the top of the mirror for about 2.6 s. Toasts sit above modals. | hud / kit (not mine) | cosmetic | Report only. |
| D26 | "Tip: Decorate mode" fires during the intro's landing cinematic. | tips / goods (not mine) | cosmetic | Report only. |

## Played: results

### 1. Clothes, hair, laundry

**New Game, with real clicks** (`nc*`):
- **Title → creator** ("Step 1 of 3"):
  - Body tab: Build ◀ → Slim. Hair tab: "Side Part 5/15", 12 colours, beard. Clothes tab: ▶▶ → "Teal varsity & cargos 3/16". Extras: hat / glasses / bag + colour.
  - All four tabs read well at 390.
- **Traits** ("Step 2: pick 3 traits"):
  - Picked Fashionista, Night Owl, Curious (3/3).
  - Early Bird was refused with "Does not go with Night Owl", and Next stayed disabled until 3 were picked.
- **Home picker** ("Step 3 of 3") → Juniper Court → **Move in** → the intro (skipped via `G.intro.skip()`).
- The step labels are inconsistent: "Step 1 of 3" / "Step 2: pick 3 traits" / "Step 3 of 3".
- The starter outfit is the travel set (`outfit_travel`, 0 pieces). The creator's backpack stays on top of every later outfit.

**Shops:**
- **Thread & Co.:**
  - Browse the tops (37 cells) → Oxford Button-Down "Take it (basket)"; Pinstripe Trousers; Puddle Jumpers from the Shoe wall.
  - **Try Things On**: a 5 / 10 / the usual / 20-minute *activity* that then opens the fitting room. Mirror with all 3: Take off / Put back per piece; tap the mirror to turn round (it mirrors).
  - Buy all 3 · **$240** → "They are in your dresser".
- **Marigold & Main:** Fireside Roll-Neck, **Buy now $56**.
- **Ink & Ivy Vintage:** bins (D3), "Hats and bags" Block Party Snapback $15, unpaid-basket line on exit.
- **Galleria Kicks:** till → "Clothes / Everything else" → Otters Court Jersey $29.

**Dresser:**
- Wardrobe → Change Outfit (2 min) → Today suggestion / Drawers (6) / Outfits.
- Tapped 4 pieces on.
- Saved **"Rainy Monday"** by typing into the name field with the keyboard.

**City look:**
- 12 outfits x 2 builds (slim, broad) x 4 walking directions, cropped at game scale (`m_lb_slim.png`, `m_lb_broad.png`), in Market Square.
- (setup via API: pieces added and worn; the walking is real.)
- All outfits read, back views are drawn, the broad build reads best.
- Notes for the artists:
  - The creator's **blue backpack straps** (2 px on a 5 px torso) dominate every front view, so most tops read "blue" (design: thinner / darker straps, or no starter bag).
  - "Beach Headscarf, Aqua" reads as a dotted helmet.

**Daily wear → laundry:**
- (setup via API: 3 days advanced with needs frozen.)
- Wears counted 1/1 → 2/3, "2 things you are wearing need a wash", dresser "Day 3 in these clothes (people notice) · 1 dirty piece".
- Took off the roll-neck + trousers → hamper (2). Hamper → "Take the laundry bag" → carried.
- **Suds & Bubbles:**
  - Washer 12, $3 → waited ("time skips") → "Move the wet load to a dryer" $2 → waited → **Fold it neatly** → "1 clean piece, folded".
  - The delicate trousers stayed in the bag ("1 delicate stay in the bag"). Front desk "Dry-clean the delicates $6" → 4 h → Collect.
  - A load left 200 min went to the basket with the "Laundry moved" phone note, and could still be dried "(from the basket)".
- **Home washer: not tested** (it needs buying + placing a washer through the goods worker's furnish UI).

**Hair:**
- Barber (D1, D7).
- **Lacquer Lounge colour bar:** Front desk → Colour bar → Bay Blue + Ombre + Rose → $45 → chair → reveal.
- Bloom salon and the 21-day shaggy toast: not tested.

**Old save (v1):**
- Made from the checkpoint: wardrobe `{ owned: 13 sets, wearing: business, base }`, and the clothes / laundry / hair / traits / skillplay / media / post / dev states removed.
- Loaded through **Continue**: v2, 13 sets kept with clean records, wearing kept, new states fresh, no errors.
- The dresser's Outfits tab lists all 13. The trait nudge comes on the next game hour (by design).

### 2. Traits, skills, mini-games
**All 26 mini-games at level 2** with real touch taps / drags / holds (`mg.mjs`, `mg_all.log`). **Every one ended with a result**, 4.7-42 s each, 0 page errors. Kinds:
- flip / reps / photo / haggle / punchline (timing);
- stride / song / busk / dance / swim (rhythm);
- pose / fish (balance, hold);
- study / debug (memory);
- sketch / paint (trace, drag);
- write / weed (quickdraw);
- fixit / outfit / smalltalk (sort, 3 bins of 119x46 px);
- pour / hoops / darts (aim);
- arcade, chess (custom).

The bot plays perfectly, so the scores (0.93-1) say nothing about difficulty for a person.

**Thumb sizes** (canvas 360x220 at 2x):
- Memory tiles about 110x72 and sort bins 119x46: fine.
- Quickdraw targets (lightbulbs, weeds) about 20-30 px and moving: small.
- **Chess squares are 24 px** (`sq` 12 units). Too small for a thumb, and a near-miss lands on another legal square. Design call: a larger board needs the sheet taller than 110 units.

**Pay-out through real activities** (`mg2.mjs`):
- Chess lesson with coach Blitz ($15): +263 chess xp → level 3.
- Home stove cooking (flip): +92 cooking xp + the meal.
- Natatorium Lane 1 "Just swim": the swim sheet opened, +19.8 swimming xp.
- The gym needs a pass and the pier fishing spot needs a Fishing Rod (gates, correct), so they were not played via activity.

**Me app:** not opened by hand this round (the lead verified it).

### 3. Post offices
- **General Post Office**, walked in Thursday 15:21.
- **Writing desk past the preview:** Dad → Funny → 3 topics tapped (3/3) → Sign and seal → an 8-minute "Writing a letter" activity → "Letter to Dad: sealed".
- **Take a number** ("A124… 1 ahead") → sat → "that is you" → **Window 1**:
  - Buy stamps: the sheet of 51; tapping a stamp buys one at $1.50, "into the album".
  - "Post my letter" → "Collected at 17:00".
- **Pack-items picker by tapping:** + jam, + granola (2 of the 3 bag items were API-added) → "Small box (2/2) · $2" → **tape game** played with real clicks timed to the roll: 3 strips, quality 0.78 / 0.78 / 0.77 → "A tidy parcel: 0.6 kg".
- New number → **Window 2** "Send my parcel" → Dad → Standard $5.50 → "arriving Spring 7".
- **Days** (setup via API, rounds checked each morning at the home basket):
  - Letters arrived in order (dad1, june1, gramps1, robin1, sam1, varga1, dad2, june2…) with junk and the weekly bill.
  - The letter was delivered Spring 6 and the parcel Spring 7.
  - **Two replies from Dad on Spring 10**: the letter reply picks up the funny tone and all 3 topics; the parcel reply had D6.
- **Maple Post app sub-pages** (tapped): Inbox, Sent ("Parcel to Dad Delivered Spring 7 / Letter to Dad Delivered Spring 6"), Album (1/51, sets, postcards, covers), Offices (5 with hours, "Now OPEN", Take me there).
- **Closed-door toast:** GPO at 20:27 Wednesday: "…is closed. Monday to Friday 08:00 to 18:00 (Thursday until 20:00)…".
- **Collection slip:**
  - A big parcel (setup via `debug.parcelIn`) arrived while I was out → slip.
  - Home basket "Collection slip: a parcel is waiting" → slip in the bag.
  - GPO number → **Window 3** "Collect my parcel / Hand over the pink slip" → "Opened: Aunt June's Scarf".
- **Coupons:** D4 / D5 (real purchases).

**All 45 letters proofread** (plus the 6 reply writers, COMPOSE, 14 junk). Fixed: D17, D18. Questionable, not changed (owner / lead to decide):
- Granddad's timeline: 84 years old, 40 years in the Railway Mail Service (which in reality ended in 1977), "how a parcel was weighed in **1950**… I once guessed a wedding cake" (he would have been about 8), "a married man" by 1961 (about 19).
- Sam: Mr. Abel thanks the Rialto "for fifty-eight years", yet took a girl there in **1950** (76 years ago).
- june1 "You have been gone SIX days" arrives on day 3. gramps1 "the better part of a week" arrives on day 4.
- dad4's spring/autumn line ("the gutters are full") is autumnal in spring.
- The Pinehollow family mixes US and UK English: Dad writes US (HARBOR, NEIGHBOR); Aunt June and Robin write UK (Mum, biscuits, kerb, licence, petrol, manoeuvre). A deliberate voice, or not?
- Reel's "The Keeper's Light" documentary and three short reads use **"Maple Point Light… 129 steps"**. The town's light is Gull Point, 97 steps (lighthouse data and the Keeper's letter). It looks like a deliberate fictional setting in the stories, but a *documentary* reads as fact.
- Canon in the letters is consistent: Nora, Nana Bea 78, June = Mom's sister, Dad = Frank, Kit Navarro (she), Platt the dentist grandson, Lajos, Admiral the cat, Ada 81 = 23 + 58.

### 4. Media apps
- **Natural release**, fresh game (setup: `G.advance` in 4 h steps): Pages day 1 (16:01), Reel day 2 (08:01), PlayBox day 3 (04:02), each with a "New app: … Tap to install it" banner.
- Installed all three from Appy by tapping **Get**.
- **Bus** (boarded via `G.transit.boardBus`, Noodle Lantern → Rope Works):
  - While riding: Pages ("On the move: +25% fun", context `ride`) → Reel, played "The Keeper's Light" → PlayBox, One More Cast, tapped 12 times → closed the phone.
  - The ride went on and ended normally: ok, 7.8 game min, alighted 0.6 from the stop, not hidden, speed 1.
- **Train** (`G.rail.ride('oldtown','hillcrest',{nowait})`):
  - Pages (read The Fog Bell Affair Part 2) + PlayBox during the ride, phone closed.
  - At Hillcrest the "This is your stop!" banner showed. Tapped **Get off here** → city, `ride:end('train','hillcrest')`, 53 game min.
  - Note: the train never alights by itself (owner msg 72, by design). Two control rides without tapping just looped for 4 game hours, with or without the phone.

### 5. Showpieces (door → main activity → out)
- **Hotel:** Reception → Classic Room, room 704, $120 (real charge). "Sit and listen" (pianist): "Those seats are taken."
- **Arena:** Saturday (days via API). Box office → Otters vs Gulls → Upper bowl $8 → "Into the bowl" → my seat → D14.
- **Aquarium:** Tickets → Day ticket $8.
  - Spot: Garibaldi and the Lionfish / Ochre plaques open their panels.
  - The garden-eel plaque is a dead tap (D2). Bubble cut-off: D20.
- **Fish hall:** Kowalczyk Daughters → Fresh Fish $5 ("0.8 kg on the scale"); "Taste a sample".
- **Lighthouse:** cottage → tower stair → 44 + 44 steps → watch room → ladder → lantern ("The top. Wind, gulls…"). Walked out from the cottage.
- **City Hall:** door from the plaza → Rotunda → Permits & Records → Take a number (A90, then "NOW SERVING A90"). My first teleport put me on the fountain, which made the door look dead (my error, not a defect).
- **Natatorium:** Front desk Swim $6 → Changing Village → Lockers ("Swimwear on…") → Shower ("Rinsed") → Competition Pool → Lane 3 refused (needs the Seahorse badge) → Lane 1 "Just swim" (mini-game) → Lockers → "Back into your clothes" → Entrance → city.

### 6. Dev mode (all by tapping)
- Settings → Developer mode **On** → DEV button (52x33 at bottom-left).
- DEV → **Teleport…** (229 rows before D15) → "Maple Bay Aquarium" → city at (171, 340.4), walkable, centred on screen.
- DEV → **Hire me as…** → "Trainee Barista · Bean & Gone" → hired ("Achievement: Hired!").
- **16x for 3 game days:** 4,333 game min in 231 real s. fps min 53 / avg 60, heap 54 MB, 19 entities, 0 errors.
  - My tap had switched "Freeze needs" **off** (the checkpoint already had it on), so the player passed out to the clinic 3 times. That is normal game behaviour, and the speed held at 16x through it.
- **8x for 1 day:** 1,461 min in 150 s, fps 60, 0 errors.
- DEV → **Turn dev mode off** → button hidden, freeze off. The speed stayed 8x → D16.

## Files changed
- src/sim/_crowd_lines.js, src/sim/wardrobe.js (7a, D11)
- src/ui/phone.js (7b, 7c)
- src/sim/clothes_shop.js (D3)
- src/sim/hair.js (D1, D7)
- src/sim/post.js (D5, D13), src/ui/phone_post.js (D4), src/story/letters.js (D6, D17, D18)
- src/art/performance/perf.js (D19)
- src/ui/minigame.css (D12)
- src/ui/devmode.js (D15, D16)
- src/scenes/rooms/arena_bowl.js (D14)
- docs/reports/qa_round4.md (this file)

## Needs the lead / owner
- D2: core tap fallback, one line.
- D20: kit.js bubble clamp.
- D21: Goals chip over modals.
- D22: Closet release rule.
- D23, D24, D25, D26.
- Design calls:
  - chess board size;
  - the starter backpack's straps;
  - the Try Things On activity before the fitting room (a basket could open the mirror straight away);
  - the questionable letter items above.

## Not tested
- Home washer / dryer / rack.
- Bloom salon; the shaggy toast; a clothes gift from a friend; weather moodlets.
- The Me app by hand.
- Mini-games inside the gym, library, bar, open mic (gated or not reached); darts and hoops via their world spots.
- The letter chain "The Letter That Waited".
- Telegram, bottle post, P.O. box rental, holiday closure.
- The hotel stay overnight; the arena game to the final buzzer; the aquarium turtle chain.
- Real phones / sound.

Touch was used for taps (Playwright touchscreen). Drags and holds used the mouse.
