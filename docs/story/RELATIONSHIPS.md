# Relationships & Romance — the bible (backlog 4b, part a: design + all content as data)

Data: `src/story/rel_rules.js` (tracks, verbs, pacing) · `rel_people.js` (the 10 + the 12, Porchlight) · `rel_dates.js` + `rel_dates_talk.js` (dates) · `rel_romance.js` + `rel_hearts_a.js` / `_b.js` (the romance track) · `rel_arcs.js` + `rel_arcs_a.js` … `_d.js` (vignette arcs, pages, keepsakes) · `rel_small.js` (the daily small bits) · `_rel_kit.js` (builders + the documented vocabularies). Checked by `node tools/rel_check.mjs`.
Source of intent: BIBLE direction update 5 (vignettes, a constant gentle stream, friendship and romance as separate tracks, dating app, dates, move in, marry), update 21 (Chapters, My Day), CHAPTERS.md section 8 ("the pages keep coming": a ready-made hook for this wave). This file is the design; the data files are the text. **Nothing here is engine code, and no existing file was edited.**

Counts: 10 romanceable people · 12 vignette arcs (85 vignettes) · 110 romance scenes + 10 first dates · 205 scenes, 3,095 bubbles and captions, 177 remembered choices (394 options) · 16 date types, 186 person date lines, 40 date conversations · 570 small bits for 23 people · 22 pages for the book · 26 keepsakes · 25 new verbs · about 72,000 words.

---

## 1. What this adds, in one page

- **Everyone in it already lives in Maple Bay.** All 22 people are cast.js NPCs (plus Dad, whom the Chapters added). Nobody was cloned, renamed or invented to be dated. Their looks, routines, homes, birthdays and likes stay as they are; these files only add.
- **Two visible tracks.** Friendship is the meter the game has (0-100, four tiers) plus one story stage, *Confidant*. Romance is a second, separate meter ("warmth") with its own named stages. A person can be a Close Friend and nothing else, for ever, and that is a complete relationship with its own arc.
- **Vignettes.** Someone texts; an idea with their name appears in My Day; when you go, an evening happens and a piece of their life moves. Six to eight of those make a story. Twelve people who are not on the romance track have one (the family after and beside the Chapters, Kit, five friends); each of the ten romanceable people has a three-part story of their own that runs inside the romance.
- **Nobody is a prize.** Each romanceable person is working through one thing that is not about the player (a day off, a father, a boat, a rail under a sheet, a recital...). A stage needs warmth *and* that person's own scene. Flirting and gifts alone never get past Dating.
- **A gentle stream.** Two to four small bits a day in total (a wave, a text, a remembered detail), a deep scene offered every two to four days, never two people at once, nothing that expires, nobody who says "you never call".
- **Choices are remembered.** 379 small facts (`mem:`) are written by choices; 119 are said back later, by name, in a text or at the start of a talk. Every vignette also leaves a question you can ask next time ("How's the stair rail?").
- **Pages.** Every arc ends, and every romance story ends, with the person handing you an order slip for a place they love: a page for Mom's book, in their hand, pinned on the Map.

Rules that hold everywhere (the Chapters' and the job arcs' rules): choices colour, they never fail; nobody is a villain; nothing is bleak; dialogue never names a mechanic; under 110 characters a bubble (140 a caption); American spelling; older and formal people do not use contractions (Nana, Mr. Pike, Mr. Sethi, Haru, Celeste, Barnaby, Birdie), everyone else does.

---

## 2. The two tracks (`rel_rules.js` FRIEND_TRACK, ROMANCE_TRACK, UNLOCKS)

### Friendship — the meter that exists (social `rel`), unchanged numbers
| Stage | Points | What moves it | What it unlocks |
|---|---|---|---|
| Stranger | 0 | introduce yourself | the existing first verbs |
| Acquaintance | 15 | chat, be a regular | they wave first; a light text now and then; "Ask about…" |
| Friend | 40 | talk, gifts they like, hanging out, working beside them | **their vignette arc**; texts; they invite you with a reason; verbs: catch up, walk with me, share what you cooked, cook for them, bring them along (plus-one), ask what they think, tell your news, lean on them, show me; loved gifts are mentioned later |
| Close Friend | 75 | vignettes (outside the daily cap), meals, favours | trade spare keys (they water plants, take in parcels, may drop in); bigger favours; introduce two friends; they can stand up with you at a wedding; their page |
| Confidant | 75 + their arc finished | (story) | a standing weekly thing in My Day ideas ("Thursday elevenses at Thimble Street"); the confidant small bits |

The daily cap and slow rate the owner asked for (REL_RATE .4, cap 5 a person a day) stay for ordinary verbs. **Scenes are outside the cap**, so the way to deepen a friendship is to spend an evening, not to grind a verb. Friendship never decays; a long gap only switches a person's small bits to their `gap` lines, which are kind.

### Romance — a second meter, "warmth" (`ro`, 0-100), only with the ten
| Stage | Shown as | Needs | Unlocks |
|---|---|---|---|
| (none) | nothing | | |
| spark | Something There | they fit who you are open to + two warm flirts, or a Porchlight hello, or "Say how you feel" | ask on a date; first-date types; spark texts |
| dating | Dating | the first date | every date type; take their hand; kiss; **heart scene 1**; they ask *you* along; cooking together |
| exclusive | Together | warmth 35 + heart 1 + the "steady" talk | **heart scene 2**; sleepovers; the family notices; Porchlight offers to pause |
| partner | Partner | warmth 55 + heart 2 + the "partner" talk | **heart scene 3**; key exchange; move in; a seat at Sunday dinner; "Stay in tonight" |
| engaged | Engaged | warmth 85 + heart 3 + 28 days as partners + the proposal | the wedding card in My Day |
| married | Married | the wedding | married-life scenes; two anniversaries a year |

Warmth comes from dates (4 / 6 / 8 by how it went), heart scenes (6), a warm flirt (2), their favourite cooked for them (3), a plus-one (3), a loved gift (2). Daily cap 8 from verbs and gifts; dates and scenes are outside it. It never decays. The only minuses are being more than half an hour late (-1) and not turning up (-4), each with a kind text and one plain way to make it right (`rel_dates.js` REPAIR).

### Decisions (ROMANCE_RULES) and why
- **One partner at a time, from "Together" on. Dating before that may be with more than one person,** openly (Porchlight says "seeing people"). Why: it is how dating works, it lets the player meet several of the ten, and it costs nobody anything. Choosing "Together" with one offers each of the others a kind closing conversation, in person, with the player choosing the words.
- **No jealousy. At all.** No meter, no scenes, no punishments. Why: the owner asked for warm and real; jealousy systems make players manage people instead of knowing them, and they turn a cosy game anxious. People here are told the truth and behave like adults.
- **Who the player is open to** is set in Porchlight (women / men / nonbinary people, any mix, changeable). Every one of the ten is open to the player whoever they are. Simple, and nobody is locked out.
- **Never:** family, anyone under 21, anyone whose cast group is family, anonymous citizens. The romanceable people are the ten written here and nobody else.
- **Bosses, with care.** Marlow (barista), Tasha (trainer) and Imani (retail) are bosses of player jobs. While the player works for them a romance cannot *start*: they say one line ("Ask me that on a day I'm not signing your timesheet") and the verbs stay away. A romance that began before the job continues, and the workplace second signs the reviews (Tobi, Midge, Gwen: all existing job-cast people).
- **Age.** The player is about 27. Celeste (45), Haru (47) and Barnaby (57) each raise it themselves once, lightly, on the first date, and it is never a problem again.
- **Letting down and breaking up** are scenes the player starts, with three honest ways to say it (PLAYER_KIND), each person's own answer (`kind.letdown`, `kind.breakup`), and no cruelty in either direction. After: the romance track closes, friendship drops 8 (never below Friend), ten quiet days, then they are a friend with their own "after" lines. Nobody leaves town or stops serving you coffee. A closed track can reopen after 28 days if the player says so; they remember.
- **Kit and Fenn** keep the old light flirt as banter with nothing behind it (owner question 2).
- **Children:** not now (BIBLE 5).

---

## 3. Context verbs (`rel_rules.js` VERBS_NEW) — on top of social.js's twelve

The old verbs stay (chat, joke, compliment, ask about their day, deep talk, gossip, flirt, give a gift, invite to hang out, invite over, ask a favour, goodbye). These 25 appear in the same panel **only when their moment is true**, so the list stays short. None rolls a harsh failure: the "soft" answer is a kind not-now.

| Verb | When it is offered | What it reads | Outcome |
|---|---|---|---|
| Ask about {thing} | their last scene, date or text left a thread open | that scene's `ask` pair / the newest unanswered `mem:` | their answer; +3; the thread closes |
| Catch up | 5+ days since you spoke | days; what you did meanwhile | a longer exchange; +4; no reproach, ever |
| Walk with me | outdoors, they have half an hour | their routine; your arrow | they walk beside you a few blocks; +2; Outdoors |
| Share what you cooked | a home-cooked dish in the backpack | their liked recipes | they eat with you; a favourite is remembered |
| Have them round for dinner | any time; you pick an evening | a free evening of theirs | a hosted visit where you cook; a line they only say then |
| Come with me to {event} | a show, game or city event within 2 days | their routine; liked outings | they meet you there; on the romance track it is a date |
| Ask what they think | you have a decision open (job offer, a home, a date tomorrow) | which decision; their `advice` line | their view, in their voice; no effect on the decision |
| Tell them your news | within 2 days of a promotion, move, Chapter, partner, engagement | the news; whether they heard | once per news per person; family answers by text (NEWS) |
| Tell them it has been a hard day | your mood is low | your lowest need; their nature | one small practical kindness; they remember |
| Ask them to show you | at their work or pastime, weekly | their `craft` skill | a little xp and one real tip |
| Introduce them to {other} | two friends who have not met are in one place | common topics | they know each other from now on |
| Trade spare keys | once, at Close Friend | | spare keys, drop-ins; their `keyLine` |
| Say how you feel | a romanceable Friend, no track open, not your boss | friendship; `tried_before` | opens the track, or "give me a little while" |
| Ask on a date | Something There and after, in person or by text | their free evenings; open date types | the date picker; lands on My Day for both |
| Take their hand | walking together, Dating+ | | hand in hand until you arrive; +1 a day |
| Kiss | Dating+, never while they work | the place | +1 a day; a moodlet the first time |
| Ask where this is going | Dating, warmth 35 | heart scene 1 seen? | their `steady` scene, or "soon: there's a thing I want to tell you first" |
| Ask to be partners | Together, warmth 55 | heart scene 2 | their `partner` scene |
| Offer a key | Partner | | their `keys` scene |
| Ask them to move in | Partner 14+ days, warmth 75 | heart scene 3; the size of your home | their `movein` scene; living together |
| Propose | Partner 28+ days, warmth 85 | the place, the season | their `proposal` scene (always yes: the verb only appears when it would be) |
| Stay in tonight | at home in the evening with a partner there | what is in the house | an evening together: cook, watch, read, records |
| Say you missed them | 4+ days apart, Dating+ | days | +2; their `missed` line |
| Say you would rather be friends | Something There or Dating | | their `kind.letdown` |
| End things, kindly | Together and after; asks "Are you sure?" once | whether you live together | their `kind.breakup` |

---

## 4. The pacing plan (`rel_rules.js` PACING)

**A day, at most:** 2-4 small bits from everyone together (2 on a work day with a Chapter open); of those at most 3 texts, at most 1 per person, none between 21:30 and 07:30, 90 minutes apart. Waves are bubbles on the street and never notify. **A deep scene** (vignette, heart scene, milestone) is *offered* every 2-4 days; at most two invitations wait unanswered; after playing one, none is offered until next morning. One arc moves a step every 3 days at the fastest; one person never invites you twice in two days; three friend/family arcs and two romances move at once, the rest wait their turn (highest friendship first).

**Who yields to whom** (yieldOrder): Chapter › work shift › something booked › family moment › date › job beat › vignette › Opportunity › small bit.
- The day a **Chapter** is begun: no deep scene offered, texts drop to one. The morning after: only one family text about it.
- A **family moment** (Sunday dinner, the Kettle Corner, a festival moment, Dad's seasonal chair) never shares a day with a vignette of the same person. The vignettes are separate evenings and never retell a moment or a Chapter.
- An off-shift **job beat** and a vignette are never offered on one day; the job beat goes first.
- On a day a deep scene is offered, **Opportunities** offers one fewer.
- A **date** the player booked counts as that day's deep scene.
- **My Day:** invitations are Ideas with the person's name and face ("Dez, by the tram shed, any evening"), never pre-added. Accepting puts them on the schedule tagged "With a friend" / "Family" / "A date".

**Nothing expires.** "Not today" brings an idea back after three days with no second notification. The first five days (Act One) have no vignettes and no Porchlight notice: only waves and one text a day. Porchlight is in the app store from day 4 and Dez mentions it once. Settings › "Fewer messages" halves the stream.

**Gates.** Family scenes each need a Chapter (`when.chapter`), in order, so the arcs can never run ahead of the story or give anything away: Dez's first evening from Chapter 2, costumes with Nora from 5, jam with Nana from 6, the heavier ones from 11-14, Dad's whole arc after 15. Friends' arcs need no Chapter. Soft conditions (a weekday, weather, a season, an event) lapse after `orDays` so nobody waits a season.

A whole arc takes three to five game weeks at the fastest. A player who plays one deep scene every third day will see roughly a year of them.

---

## 5. The ten (`rel_people.js` PEOPLE, `rel_hearts_*.js`)

Art: every one is built from the existing character art system by their cast.js `spec` (already drawn in game). The only additions are two outfit variants each (`looks.date`, `looks.home`), which are existing parts in new colours. No new sprites.

| Person | Everyday (cast.js spec, as built today) | Date look | At-home look |
|---|---|---|---|
| Marlow Reyes | tan skin, sidepart hair, long top, slacks; work outfit barista | jacket + slacks | sweater + sweats |
| Nico Bellucci | olive skin, curly hair, tee, jeans, cap; work outfit cook | long top + slacks | tee + sweats |
| Tasha Brooks | dark skin, ponytail, tank, leggings; work outfit trainer | jacket + jeans | hoodie + sweats |
| Imani Cole | dark skin, afro, long top, slacks | dress | cardigan + leggings |
| Felix Wu | light skin, sidepart, sweater, jeans, glasses | long top | hoodie + sweats |
| Noor Aziz | brown skin, braids, sweater, skirt, glasses, backpack (cello case) | dress | hoodie + leggings |
| Tav Leota | brown skin, bun, jacket, shorts, headband | polo + slacks | tee + shorts |
| Haru Ishikawa | light skin, short hair, long top, slacks, headband; work outfit chef | long top + slacks | sweater + slacks |
| Celeste Dufour | light skin, bun, dress | coat + slacks | cardigan + slacks |
| Barnaby Quill | light skin, sidepart, suit, slacks, glasses, messenger bag | suit (navy) | cardigan + slacks |

| | Age, who, where | Lives (cast home / the door to use) | What they are working through | Their story (meet › three heart scenes) | Likes |
|---|---|---|---|---|---|
| **Marlow** (they) | 31, owner-barista, Bean & Gone. *Boss of barista.* | the flat over the cafe | Six years without a day off; not sure who they are when the machine is off | **The Seventh Day.** A leaf in the foam › the train to the end of the line › ill upstairs while the cafe runs fine without them › their mother's rice, cooked at your stove while ringing Chicago | rice and beans, fried bananas; plants, records; the Conservatory, a show; *not* coffee dates |
| **Nico** (he) | 29, pizzaiolo, Slice of Heaven | a shared flat in the Inkwell building | Falls in love like a firework; has never had a week ten; his father wants him home | **Second Act.** Basil laid with tweezers › five-hour gravy and the phone from New Jersey › week five, on a bench, saying nothing › his father eats the whole pie: "Your oven is hot on the left" | tiramisu, carbonara; the Orpheum, dancing, the Bay Wheel |
| **Tasha** (she) | 38, owner, Iron Maple Gym. *Boss of trainer.* | Meridian Tower, ninth floor | Fourth by three tenths; has never let anyone carry anything for her | **The Catch.** Your name on the board › you carry her groceries up nine floors › the unopened letter from her old crew, over pie › the exhibition row, and she settles | baked salmon, chili; walks, the Otters, the pier; *not* films |
| **Imani** (she) | 33, stylist-owner, Thread & Co. *Boss of retail.* | The Marlowe, Apt 2A | Eleven pieces of her own under a sheet; came home from New York | **Under the Sheet.** She fixes your collar › the sheet comes off › New York rings › her name on a card in her own shop window | shakshuka, baked mac; shows, the Museum, dancing |
| **Felix** (he) | 26, repairs, Nest & Wire | The Easel House, ground floor | Left engineering school on purpose; has not said "I'm good at this" to his father | **Loose Wire.** A spare bulb › the Fix-It Bench at the library and Mrs. Moss's music box › lunch with his father, and a stopped watch › a real bench in Mr. Pike's tram shed | bao, dumplings; the Observatory, the Museum, the Aquarium; *not* dancing |
| **Noor** (she) | 25, cello student (final year) | the flat next to your first one | Plays beautifully to a wall; her recital is this year | **Bar Forty.** Locked out on the stoop › one kitchen chair › busking on the station steps with Fenn › Symphony Hall, seat G12 | biryani, masala chai; a concert, the glass house, the Aquarium |
| **Tav** (he) | 30, analyst, Hartwell & Finch | Meridian Tower, Apt 611 | Four years training for a race he never starts; his last was with his father, in Honolulu | **Mile Eleven.** He slows down for you › four unworn bibs › the kerb at mile eleven › the Half, with his father on a phone held over a bridge | poke, teriyaki salmon; walks, the pier, the Otters, the Wheel |
| **Haru** (he) | 47, chef-owner, Noodle Lantern | two rooms over the shop | Came from Sapporo for one summer, nineteen years ago; answers letters with parcels | **One Summer.** The end stool, two eggs › one line on a card at the Post Office › the shop shut on a Tuesday, and a telephone call › home from Sapporo with snow in a jar | onigiri, agedashi tofu; the pier on Mondays, the fish market, quiet |
| **Celeste** (she) | 45, maître d', The Gilded Gull | a terrace house in Hillcrest | Twenty years of other people's perfect evenings; her daughter has left for college | **Table for One.** A dish with her compliments › a badly cut grilled cheese at your table › brunch with Margaux › dinner at the Gull as a guest, her back to the room | grilled cheese, French onion soup; a show, the glass house, dancing; *not* dinner at the Gull (until it is) |
| **Barnaby** (he) | 57, food critic, the Gazette | a tall thin house in Hillcrest | Eats alone 300 nights a year; cannot fry an egg; is saving his fifth star | **The Fifth Star.** A second opinion on a pastry › you teach him the egg › the manuscript in the end booth at Dot's › you cook him dinner at home | cottage pie, grilled cheese, apple crumble; being cooked for, Dot's on Mondays |

Each person also has: their answer to every stage talk (`steady`, `partner`, `keys`, `movein`, `proposal`), wedding vows, two married-life scenes, a live-in pool (morning, evening, chores, night), a kind letdown, a kind break-up and "after" lines, a goodnight text for each way a date can go, late / stood-up lines, advice in four kinds, gift notes, a Porchlight card and chat. `tools/rel_check.mjs` fails if any of the ten is missing any stage.

Cross-links, all optional and all reuse: Tasha's story leaves room for the trainer arc's ending (the campus pond is "a pond; this is the river, with them"); Tav runs the Half the trainer arc has him enter; Felix's bench is in Mr. Pike's shed, where Mr. Pike's own arc makes him the apprentice; Fenn turns up in Noor's second scene; Celeste seats Barnaby; Dot presides over three first dates and a book launch; Tobi minds Haru's broth.

---

## 6. Dates are real play (`rel_dates.js`, `rel_dates_talk.js`)

A date is booked with "Ask on a date" (or in Porchlight): **type › day › time**, inside the person's `free` windows and the venue's hours. It lands on My Day for both. It then runs in this order (DATE_ORDER): **arrive** (a caption) › **their line as you meet** › **the play** › **their line during it** › **the talk** › **close** › **their goodnight text**.

**The play is the place's own system**, started and awaited exactly as a Chapter's `play` step does it:

| Date type | Where | The play |
|---|---|---|
| A coffee (first-date ok) | a coffee cart, Cafe Ammonite, the Glasshouse Cafe, Bean & Gone, the Quill & Kettle | order for two from the real menu |
| A walk (first) | River Walk, the duck pond, the Lookout, the pier | walk together; hand in hand once that is unlocked |
| Dinner | The Gilded Gull, The Gilded Maple | **the real menu, for two**; the bill is split unless you tap "My treat" |
| Noodles | Noodle Lantern | two bowls at the counter |
| A slice (first) | Slice of Heaven | the counter |
| A show | The Orpheum, Symphony Hall, the Lantern Playhouse | two seats through `G.shows` (`attendWith`): the whole real show |
| The Observatory | a clear night (cloud: the planetarium instead) | the constellation tracer |
| Cook together | your home | the real cooking flow; their liked recipes are starred |
| The Bay Wheel (first) | the boardwalk | the Ferris wheel ride, then Scoop Dreams |
| The Aquarium | bonus on Jellies After Dark | walk the tanks |
| The Museum | bonus on Free Friday | the galleries; Cafe Ammonite after |
| The Conservatory (first) | the glass houses | walk them; the koi under the fig |
| Fishing | the Fishing Pier | the fishing spot |
| An Otters game | the arena on game nights | two seats |
| Dancing | the Grand Maple's ballroom class (Tue / Thu), or the Heron | the dance floor |
| A plus-one | any city event or festival | go round together |

**What they say depends on who they are and on your history.** Every person has two lines of their own for the six core types and for every type they like or dislike (Tasha at a film: "If I fidget, elbow me. If I heckle, elbow me harder."). **The talk** is a small choice-driven conversation: each person has four, and the engine plays the first unplayed one whose condition is true, so the second date's talk is always a getting-to-know question, later ones need a remembered detail (`mem:asked_ny`: "You asked about New York. All right."), a heart scene already seen, or a stage. When all are had, the talk becomes one comfortable line. The fourth time you do the same thing together they say "we do this now".

**Scoring is quiet and cannot fail** (OUTCOMES): on time, not starving or filthy, a type or dish they like, the talk, a remembered detail, a bonus (an event, their birthday, a loved gift). 0-2 = fine, 3-4 = lovely, 5-6 = one for the books. The player sees only the goodnight text and a moodlet. One date a day; the same person every second day at most.

**The first date** is that person's own written scene, at their place and hours: Marlow at the Sunday market ("not coffee"), Nico in row F, Tasha on the River Walk with hot dogs, Imani among the mannequins, Felix and Saturn, Noor in the glass house in the rain, Tav on the Wheel he is afraid of, Haru on the pier with a second stool, Celeste drinking from a paper cup, Barnaby in a flat cap at Dot's.

---

## 7. The romance track, step by step (`rel_romance.js`)

1. **Meet.** In the world (they are all NPCs; be a regular, work beside them) or through Porchlight. At Friend the `meet` scene plays once: a small noticed thing. Then "Say how you feel" (the honest road) or flirting (the playful one) or the app opens the track.
2. **First date** › *Dating.* Any date type. Their first heart scene arrives as an invitation.
3. **"Where is this going?"** › *Together.* Either of you may raise it. Others you are dating get a kind word. The family starts to notice (FAMILY_REACTS: Nana heard it from Roz, who heard it from the fishmonger).
4. **Partner.** A seat at Sunday dinner (one line in the existing moment). Milo makes a place card that is mostly a triceratops.
5. **Key exchange.** Ten keepsake keys, each on something of theirs (a coffee scoop, a cello string, a race lanyard with the year cut off).
6. **Move in** (optional; a couple can marry without it). **Living together uses the home the player has** (LIVEIN):
   - they keep their cast routine but leave from and come home to your door, and sleep in your bed at their own hours;
   - **mornings:** one line or a thing left on the counter (Marlow's coffee under a saucer; Haru's rice, egg and pickles under a cloth);
   - **meals:** cook a dish with 2+ servings in the evening and they sit and eat; on their `cooksOn` days a dish of theirs is waiting;
   - **chores:** each quietly does one kind (dishes, plants, laundry, bins, tidying, or Felix's "things stop dripping"); the home gets dirty about a quarter slower; they never do everything;
   - **bills:** they pay 40% of rent and utilities, shown on the Bay Bank statement;
   - **the bed:** a double sleeps two; with a single they squeeze in, say so once, and My Day gains the idea "A bigger bed"; a Tiny home gets one line and they still come;
   - **their things:** two to four pieces arrive with them (eleven plants, nine pans, a cello on a stand, fourteen pairs of running shoes by the door);
   - they never nag about mess, money, lateness or who else you see.
7. **Proposal.** The player asks, anywhere, when the track allows; a place they love is noticed. Each has their own yes (Barnaby, for the first time in his life, manages one word).
8. **The wedding** (WEDDING). One gold-edged card in My Day: "The wedding: whenever you two are ready", with four small choices in any order: **where** (the Wedding Room at City Hall with the City Clerk, on the existing Saturday slots; under the fig at the Conservatory with Wendell; the lamp gallery at Gull Point with Silas Marrow, lit as you kiss; the park bandstand or the Hillcrest Lookout with the Captain, who "looked it up, not very hard"; the Bay Ballroom), **when**, **who stands up with you** (any Close Friend or family: each has a line), **and afterwards** (tea at the Kettle Corner, the ballroom, the whole of Slice of Heaven, or at home). The ceremony is one script in parts with lines that grow with the Chapters: Pip's laminated seating plan, Milo and the rings and his best rock, Dad in a suit from 1988, Nana's bell from her handbag if Chapter 14 is done, the partner's own vows, three vows to choose from, Theo's toast on a napkin, and, if Chapter 15 is done, Dad asking Nana to dance. Rain does not postpone anything: forty umbrellas go up.
9. **Married life.** Two written scenes each (small on purpose: Marlow sleeps until nine; Nico and the gutter), anniversaries on the first-date date and the wedding date, the `married` small bits. Nothing is taken away.

---

## 8. The vignette arcs (`rel_arcs_*.js`) — 12 people, 85 evenings

| Arc | Thread | The evenings |
|---|---|---|
| **Nana Bea — Elevenses** (8) | being looked after; saying it with words | Jam Day · Ambrose carries the shopping (only the flour) · **A turn**: the clinic waiting room, and what Ray said in one · the stair rail Theo made straight · the recipe tin, weighed · Ray's day at the tram shed · Ambrose is informed (Two-for-Tuesday: "Move down one") · "I love you. There." |
| **Nora — The Comma** (8) | who looks after the one who looks after everyone | twenty-six costumes · plot fourteen · parents' evening · the deputy-head offer · **the day** Mom died, a ladder, and the Bay Wheel · who rings Dad · **a form**: guardians for the children · ten o'clock on a Tuesday |
| **Theo — Apology Furniture** (7) | **a job lost**; what his hands are for | the garage · three days in the library in a tie · telling Nora ("it's only that you're free?") · the CV on a napkin · Out-Law Joinery ("IT LEANS. THAT'S HOW YOU KNOW") · a bench for the Kettle Corner · Monday morning, teaching woodwork |
| **Pip and Milo — The Bureau** (8) | being the grown-up two children trust | Case Two: the biscuit · lane two ("people go under and come back, mostly") · the election, lost by three · the first sleepover, in a storm · the tooth and the ray · "Do Adults Mean 'Fine'?" · Milo reads page six · you are made a member, in pen |
| **Dez — Legs** (7) | the fun one becomes the one who is told things | race you · no bike · **Ma's hip** and chicken soup · the dispatcher's chair · a night ride, and what your year at home was like · eighty yards to the corner · a brass bell |
| **Dad — Four Words at a Time** (7) | being shown, then showing | "Where are you stood?" · "OK." "Dad." and a photograph of a thumb · **her birthday**, and a cake that did not rise · Nana's gate: mend the half that holds, leave the half that tells · **Quarry Road: sell it or keep it?** · a hook for his cap, and Mom's paintbrush · at the Lookout, he narrates to you |
| **Kit — Forty Half-Songs** (7) | finishing; ten years that went missing | forty index cards on a washing line · a bad set, and fries at one in the morning · sign writing · the label's letter: **three months away?** · **"we lost ten years being polite"** · six weeks, six stamped postcards · "Hard Town to Leave" |
| **Mr. Pike — One Bolt at a Time** (7) | eyes; who the knowledge goes to | the oil can · ticket rolls · **small print**: cataracts, and a wrong bearing · Felix, examined with a spanner · the route, recited in the waiting room · crimson lake, not maroon · the bell cord is handed on |
| **Fenn — The Next Train** (7) | **a move away considered**; getting round to staying | sad songs, two coins · a wet Wednesday and the rent · Montana, and two coffees · "The weather is wet. I am well." · a roof and a schedule at the Heron · **the reply**, and the first return ticket of their life · a key round their neck |
| **Birdie — Party Line** (7) | **illness in a family far away**; **a reconciliation** | Gerald · "Number, please" · Odette, and the ninth of August 1979 · the telephone room at the Grand Maple · the feeding rota · gate, window seat · home to roost |
| **Walt — The Same Wrench** (6) | a daughter on the telephone; a building that helps back | your dripping tap · six messages on a machine · boiler night, with a cello on the landing · the second wrench · Sunday lunch on the stoop · "Tanaka." "...Hi, Emi." |
| **Vik — Show Your Working** (6) | whether forty years of teaching left a mark | table three · samosas for Leela · a former pupil he cannot place · maths club ("What's in the box?") · he loses to Pip, in ink · you are white |

Funny, quiet, and a few that are meant to land: Nana in the waiting room; Nora up a ladder on the anniversary; Theo in a library in a tie; Milo asking if his mother is coming back; Dad on the telephone on her birthday; Kit's six index cards; Mr. Pike holding a catalogue at arm's length; Fenn's brother making two coffees; Birdie, who put through a million calls, unable to dial one. None is bleak: every one ends with something done.

**Co-workers become friends.** Anyone from a job cast (JOBS.md) uses the ordinary friendship track and the generic small-bit pools (`SMALL_ANY`); they have no vignette arc here because their story *is* the job arc. Several job-cast people appear in these scenes by name (Tobi, Gwen, Paolo, Midge, Mr. Lindgren, Mrs. Moss, Lorraine) through captions, without speaker lines of their own.

**New small facts** (nothing contradicts CHAPTERS.md or JOBS.md): Theo has been at the loans desk fourteen years; the school's head is Mrs. Okoro; Dez's mother is Lorna; Dad's doors in Pinehollow are painted Thimble Street blue (Nell matched it); Walt's late wife was Keiko, his daughter is Emi; Mr. Sethi's wife is Leela; Birdie's sister is Odette, in Savannah; Fenn's brother is Cal; Marlow's mother is in Chicago; Nico's family shop is Bellucci's (1961) and goes to cousin Gina; Imani's grandmother did alterations on Thimble Street; Felix's father is an engineer; Haru's sister is Emi, his late teacher Mr. Sato; Celeste's daughter is Margaux; Barnaby's mother called him Barney.

---

## 9. Porchlight — the dating app (`rel_people.js` PORCHLIGHT)

**"Leave a light on."** Maple Bay's own. On the phone (app store, free, from day 4) and on any home computer ("Open Porchlight": the same cards, two columns).

**Not a slot machine, on purpose:** it shows the ten who fit who you are open to, as a short stack you scroll (no swiping, no feed). There is no chance roll, no secret score, no daily likes, no boosts, no streaks, no "someone liked you!" bait. Everyone answers within a few game hours, in their free time. When you have seen them all it says **"That's everyone for now. Go outside."**

**Screens (portrait 390x844, inside the phone frame; one thumb; targets 44 px+):**
- **Cards** (home): a lit porch-lamp logo and a gear; a vertical stack, one and a half cards visible. Card = portrait in their date look on a district backdrop (358x300), name, age, pronouns, their headline in italics, a "You've met" chip when true.
- **A card:** portrait · headline · About · three prompt blocks (question in small caps, answer large, each with a small "Reply to this") · three picture tiles drawn from the character art in three poses and places · "Looking for" · a wide **Say hello** and a quiet "Not for me" (undo in Me).
- **Say hello:** a bottom sheet with three openers (two general, one quoting a prompt).
- **Chats:** a list like Messages. Inside: bubbles; under them up to four things to say (that person's `chat.asks`, each once); after two exchanges a lamp-yellow bar, **Suggest meeting**.
- **Meet:** "What sort of thing?" three date tiles (first-date types) › a six-day strip, greyed where they are not free › time chips › Ask. "It's on your day."
- **Me:** your card as others see it: your portrait in what you are wearing, three prompts (pick a question, pick one of three answers), who you are open to, what you are looking for; Pause my card; People I hid.

If you have met them in town their first message knows it ("Oh. It's you. I know your order and now I know you're on here."). At "Together" the app asks once whether to pause your card. Each chat exchange is +1 warmth, at most 2 a day.

---

## 10. Must-build, for the engine worker

Ranked. "Cheapest" = the smallest version that still plays the data as written.

**A. The core (nothing works without these)**
1. **`G.rel` + save state.** Suggested shape:
   `G.state.rel = { v: 1, openTo: ['w','m','n'], ro: { [id]: { pts, stage, since: day, dates: n, firstDateDay, hearts: [bool x3], keys, lives, weddingDay } }, mem: { [id]: { [key]: day } }, picks: { [choiceId]: optionId }, seen: { [sceneId]: day }, arcs: { [arcId]: { next: n, lastDay, offered: sceneId|null, setAside: day } }, threads: { [id]: sceneId }, small: { day, sent: n, bag: { [id]: [...] }, lastText: t }, app: { hidden: [], chats: { [id]: { asked: [], n } }, paused }, wedding: { venue, t, stand, reception }|null, told: { [newsKind]: [ids] } }`.
   Friendship stays in `G.state.social.npcs[id].rel`: do not copy it.
   API: `G.rel.stage(id)`, `warmth(id)`, `addWarmth(id, n, src)`, `friendStage(id)`, `partner()`, `remember(id, key)`, `remembers(id, key)`, `offer(sceneId)`, `start(sceneId)`, `available()`, `verbs(id)` (the context verbs that are true now), `date.book({ id, type, venue, t })`, `date.start(apptId)`, `moveIn(id)`, `moveOut(id)`, `propose(id)`, `wedding.plan(...)`, `endIt(id, how)`, `debug.*` (set stage, play any scene, skip days).
   Events: `rel:stage(id, stage)`, `rel:scene(sceneId)`, `rel:date(id, type, outcome)`, `rel:mem(id, key)`, `rel:movein(id)`, `rel:engaged(id)`, `rel:married(id)`, `rel:ended(id)`.
2. **The scene runner.** Steps are the Chapters' `say / choice / if / beat` plus `fx` (as the job beats) and `play`. Reuse the Chapters' dialogue sheet (`ui/chapters_ui.js`: portrait, typed text, Log, "pick this up later") and its `_chapters_play.js` adapters. Cheapest: one runner shared with the job beats. The clock stands still during dialogue and no need falls below 30 inside a scene, as in a Chapter.
3. **Conditions and effects**: `_rel_kit.js` COND_PREFIXES and EFFECT_KEYS are the complete list (the checker rejects anything else). `fr` goes to `G.social.addRel(id, n, { raw: true })`.
4. **Invitations as My Day ideas.** A scene on offer = its `invite` text in Messages + a pinned idea with the person's face (`G.planner.suggest`). Accepting adds an appointment ("With a friend" / "Family" / "A date") at a time inside `window`; walking up to them there starts the scene. `place: 'theirs'` = their door (`home.anchor`), `'phone'` = Dad's phone-call bubble, `'any'` = wherever the verb was used.
5. **Pacing** exactly as `PACING` (one scheduler, shared budget with job beats and Opportunities; ask the lead before changing `opportunities.js` TUNE: a "one fewer today" hook is enough).

**B. Social panel and phone**
6. **Verbs** (`VERBS_NEW`) added to `ui/talk.js` beside the old twelve, each shown only when its `when` holds. The romance meter under the friendship meter on the contact card, hidden until Something There. Per-person overrides: `bossLine`, `ageLine`, `keyLine`, `missed`, `advice`, `giftNotes`.
7. **Small bits** (`rel_small.js`): waves hook into the existing proximity bubble; texts go through Messages; details play as the first line of the next talk. No-repeat bags per person.
8. **Porchlight** via `G.phone.registerApp` (+ an entry in the home computer menu). Cheapest: Cards, a card, Chats, Meet; "Me" with open-to only.
9. **"Ask about…"**: after any scene the person holds its `ask` pair until asked.

**C. Dates and living together**
10. **The date runner** (DATE_ORDER) with the play adapters: `order` (the venue's menu for two: a thin wrapper on the existing shop / eat-in), `show` (`G.shows.attendWith`, arena tickets), `cook` (start cooking with a second person at the stove; `choose` stars their liked recipes), `walk`, `activity` (Ferris wheel, fishing, watch fish, dance, smell flowers, contemplate art), `minigame` (the observatory tracer). Companion walking beside you = the Chapters' companion code.
11. **Live-in partner** (`LIVEIN`): home becomes the player's; leave / return through the front door; sleep in the bed (second sleeper pose: exists); the morning item on a counter; sit at the table for a cooked meal (the hosted-visit seat); one chore kind; 40% of bills in `money.js`; their 2-4 pieces placed or stored. Cheapest: routine + bed + meal seat + morning line; chores as a cleanliness multiplier.
12. **The wedding**: the My Day card, the four choices, the ceremony staged with the Chapters' staging (guests = family + friends at Friend+ standing in rows), `vows` = the partner's `vows` lines then the player's choice. Cheapest venue set: City Hall's Wedding Room (the Saturday wedding scene exists) + the Lookout.

**D. Hooks and small pieces**
13. Speaker hooks for existing figures: Mr. Ignatius Bell (City Clerk), Wendell (Conservatory); Silas Marrow has one from the Chapters.
14. **New play ids** (the checker lists them): `minigame:fixit` (hold the torch / hand him things: any existing timing ring re-labelled; used 5 times, always skippable) and `activity:post_send` (stand in the Post Office queue and hand over a parcel: the post system's existing send, started by the scene). `activity:swim` (a length at the Natatorium) and `garden_plot`, `duck_pond`, `library_read`, `watch_live_music` exist.
15. **Two optional favours** that set the engine flags: feed Haru's master stock for three days (`haru_fed_broth`), feed Birdie's pond flock at 11:00 for four of seven days (`birdie_fed`). Both are one tap at a spot and read back in one line each.
16. **Items**: 17 romance keepsakes (`ITEMS_NEW`) and 9 arc keepsakes (`ARC_ITEMS`); two are wearable (Imani's piece twelve, the remade jacket: re-coloured existing garments), one is furniture (Theo's stool: an existing stool rotated a few degrees), one is a readable book (Barney's).
17. **Pages**: `PAGES` join the book reader after the family's pages, each pinned on the Map at its place (the Chapters' page-pin code).
18. **A partner's flat.** Four heart scenes are set inside a flat the game does not have (Marlow's, Tasha's, Noor's, Tav's; `place: 'theirs'`). Cheapest: play them at the door with the dialogue sheet (the captions describe the room). Better: one small room template dressed four ways (a blanket and a window on the cafe queue; a crew photograph; one kitchen chair and a music stand; a cork tile with a race number).
19. `REL_MOODLETS` (7) registered like the job moodlets.
20. The family's `FAMILY_REACTS` and `NEWS` lines sent as texts; one extra line in the Sunday-dinner moment when a partner is there (`WITH_PARTNER`).

**Art needed:** no new characters. Two outfit colour variants per romanceable (data: `looks`). Porchlight icon (a lit porch lamp) and card backdrops (reuse district tiles). 26 keepsake icons (the icon kit). Optional: the flat template above; wedding guests need nothing new; confetti exists at City Hall.

**Suggested first slice:** the scene runner + `G.rel` + invitations in My Day, then **one friend arc end to end (Mr. Pike: no Chapter gate, uses the tram shed and the clinic)** and **one romance end to end to Partner (Haru: pier, Post Office, his own shop)**, then Porchlight, then dates for all ten, then living together, then the wedding.

---

## 11. Things the lead should know
- `tools/modules.mjs` bundles every non-underscore file in `src/story`, so the thirteen `rel_*.js` files are now in the build (inert: no `init`, no engine imports). `node src/data/validate.mjs` exits 0 and `node tools/build.mjs` builds with them.
- The friendship numbers are the social system's own; the first four `FRIEND_TRACK` rows are checked against `dialogue.js` RELATIONSHIP_TIERS.
- `{title}` (what Pip and Milo call the player) is used only by Pip and Milo and only after Chapter 3.
- Two existing cast facts are leaned on and should not change without a look here: `flirtable` (the ten include Haru, Celeste and Barnaby, who are `flirtable: false` in cast.js: the engine should read `ROMANCEABLE`, not that flag) and Noor's home `player_building` (if the player moves, she stays in the first building; her scenes use the building stoop).
- Barnaby's workplace is the Gazette newsroom, which is one of the jobs wave's four new rooms (`gazette_newsroom`); nothing here needs it to exist (his scenes are at the cafe, Dot's and your home).
- Nothing was run in a browser. No line has been seen in a bubble.

---

## 12. Owner questions, with a recommendation each
1. **One partner at a time from "Together", dating several before that, and no jealousy at all.** *Recommendation: yes to all three.* It keeps the game kind, and it is the difference between knowing people and managing them.
2. **Kit and Fenn are friends only (for now).** Kit has a long friendship arc about the ten years you lost; a romance with her would need its own careful writing and would change Chapter 12. *Recommendation: keep both as friends in this version; if you want Kit to be romanceable, say so and it becomes a follow-up of about the size of one of the ten.*
3. **The ten include three older people (45, 47, 57) and three of your bosses** (Marlow, Tasha, Imani: no romance can start while you work for them). *Recommendation: keep; they are among the best-written, and the rule is clear and kind.*
4. **Who the player is open to is one setting in Porchlight, and all ten are open to the player whoever they are.** *Recommendation: yes; simple, and nobody is locked out of anyone.*
5. **Moving in is optional and marriage does not need it;** the partner pays 40% of rent and bills and does one kind of chore. *Recommendation: yes. If 40% makes money too easy, 30% is a one-number change.*
6. **Proposals: the player always asks.** Nobody proposes to the player. *Recommendation: start this way (it keeps the player in charge of the pace); "they ask you" for one or two of the ten is a nice later addition.*
7. **Break-ups are gentle and final for the day, and the person stays in town as a friend.** *Recommendation: yes. No bad blood, no avoiding the cafe.*
8. **Emotional weight.** A few evenings are about real things: a grandmother's health scare, the anniversary of Mom's death, a lost job, Dad on her birthday, a child asking whether people come back. They are short, kind, and end with something done. *Recommendation: keep them; they are what you asked for. If any feels too much when you read it, it can be softened in an afternoon.*
9. **Weddings: six venues, the player asks whoever they like to stand up with them, and the family's lines grow with the Chapters.** *Recommendation: build City Hall and the Lookout first, the other four after.*
10. **Children: not in this version** (as you said). Milo carries the rings; that is as far as it goes.
