# Jobs with stories — the jobs bible (25 jobs)

Data: `src/story/jobs_arcs.js` (index) + `jobs_a.js` … `jobs_e.js` (casts, arcs, lines, texts) + `jobs_new.js` (the 15 new job rows, new places, the plays) + `_jobs_kit.js` (builders and the documented vocabularies). Checked by `node tools/jobs_check.mjs`.
Source of intent: BIBLE direction updates 3 (15 more jobs), 4 (jobs have stories), 5 (choices are remembered; a gentle stream), 21 (Chapters, My Day). This file is the design; the data files are the text. Nothing here is engine code.

---

## 1. What a job is now

Every job is **a place with people in it**. Each of the 25 has:

- **a cast** of three to seven: the boss, coworkers, one or two regulars. 108 speakers in all: 39 already exist in the game (26 cast.js NPCs and 13 named showpiece / post-office staff, never renamed), 69 are new;
- **an arc of nine beats** that unfolds over about 23 attended shifts: a beginning (who these people are, what the place wants), a **turn** at beat six (one hard shift, one real choice), and an ending that pays the choice back. Promotions sit inside it (beat four is the first promotion);
- **one distinctive piece of play** (section 3 and `PLAYS`): 60 to 120 seconds, once a worked shift, always with Auto;
- **ambient lines** (22 or 23 per job, 559 in all), **texts** (three per job + the nine boss texts each new job needs), **one Opportunity**, and for half the jobs **a keepsake**.

Rules that hold everywhere:

- **Nothing forces the player.** Work is optional; a missed shift costs what it costs today and no more; a beat that is not played simply waits. Clock-in keeps its two buttons, "Work the shift" / "Skip to the end"; skipping still pays and still counts as attended.
- **Choices colour, they never fail.** Every option is a decent thing to do. What changes is who warms to you, one or two later lines, and how the ending is worded. 208 choices; every arc reads at least one of them back later.
- **Nobody is a villain and nobody is hurt.** The firefighter's "tenth call" is a flooded basement and a parakeet.
- **Dialogue never states a mechanic.** People say "come by on Sunday", never "an event has unlocked".
- **Voice.** Plain, warm, specific, dry. Most people use contractions; a deliberate set of older or formal people do not (Mr. Lindgren, Ms. Hartwell, Odile, Dr. Halvorsen, Pet, Gus...), as Nana Bea does not in the Chapters. American spelling, as in cast.js / texts.js.

### How the arcs touch the rest of the game
- **Skills and the university.** Ladders use the existing skill gates (and so the university's certificate bonus); beats give small xp in the job's skills. Style, writing, gardening, music and swimming now each have a job that trains them.
- **Traits.** No beat requires a trait. The plays are mini-games, so trait mini-game bonuses apply; night jobs suit Night Owl, dawn jobs Early Bird / Morning Person.
- **City events and the calendar.** Beats use `season_end_sale`, `mus_free_friday`, `harbor_day`, `winter_parade` and the weekly rhythms (open mic Wednesday, Friday live music, Saturday weddings at City Hall, council Tuesday / Thursday, the hotel gala on the 12th). Each has an `orShifts` fallback, so nobody waits a season.
- **Weather.** A third of the turns want weather (fog at the gate, a storm at the docks, the radio and the aquarium). They fall back after two or three shifts.
- **Opportunities.** One per job, in the existing row shape, offered by a beat or picked up by the pool once a beat's flag is set. All are small walks to a place the player may not know.
- **My Day.** Off-shift beats arrive as an invitation text and show as an Idea with the person's name ("Mr. Lindgren and Marlow, Sunday afternoon"). Never pre-added.
- **The Chapters cast, lightly.** Nora is the teacher next door; Pip brings a clipboard to the firehouse; Kit paints a sign; Dez races you; Mr. Pike checks the station clock. Seven lines sit behind `done:chNN` conditions and are pure colour (listed in section 6). No arc needs a Chapter, and no Chapter needs a job.

---

## 2. The 25 jobs

Ladders for the ten existing jobs are unchanged (src/data/jobs.js). For the new ones: title $hourly (skill gates). Beats are listed as `n. title (when; where in the shift)`.

### Existing jobs

**1. Barista — "The Day Off"** · `cafe` · Mon-Fri 07-13
- *Cast:* Marlow*; Tobi (the new kid, burns the milk); Mr. Lindgren (retired piano tuner, cortado, crossword); Suki (novelist, chapter eleven).
- *Play, The Regulars:* six customers; strangers show a drink, regulars show only a face and you remember their order; one lever pull on a timing ring.
- *Arc:* Marlow has opened every morning for six years. 1 The Duchess (shift 1). 2 Faces, not names: Mr. Lindgren's flower clues (2). 3 Tobi and the rush (4). 4 You may draw in the foam; the schedule (promotion). 5 "She is flat": the tuner hears the pump failing (rain; 9). 6 **The Duchess stops**: hand-pour for everyone / give coffee away / fetch the tuner (12). 7 Off: Sunday, the machine in pieces (cafe). 8 Keys (18). 9 The day off: you open alone; Marlow comes back with sand on their shoes (22).
- *Links:* Opportunity to the duck pond; keepsake Bean & Gone keys; Skipper Marsh's mail boat brings the part.

**2. Grocery Clerk — "Where the Capers Are"** · `grocery` · Tue-Sat 09-16
- *Cast:* Priya*; Hollis (stock, thirty-one years, no fuss); Bex (cashier, names the carts); Mrs. Moss (one lemon a day).
- *Play, Heavy to Light:* pack eight items into a paper bag grid: heavy low, eggs on top.
- *Arc:* Hollis is retiring and the real shop map is in his head. 1 Aisle six (1). 2 One lemon (2). 3 Hollis's map; fuss or no fuss (4). 4 The price gun (promotion). 5 The inspector and the capers (9). 6 **The freezers go**: give the ice cream away / a countdown sale / carry it to the butcher (storm; 12). 7 Your own aisle: peaches (15). 8 Hollis's last day; he hands you the map (19). 9 Priya's mother comes to shop (23).
- *Links:* keepsake Hollis's map; Opportunity: a lemon for Mrs. Moss in bad weather.

**3. Line Cook — "Order Up"** · `diner` · Wed-Sun 11-19
- *Cast:* Dot*; Lorraine (server, diner shorthand); Tee (dishwasher who wants the grill); Mr. Quill* in a hat.
- *Play, The Rail:* decode four called orders, then run overlapping grill rings so a table lands together.
- *Arc:* Dot has not sat down since 1994. 1 Rule one (1). 2 The rail; Tee reads it from the sink (2). 3 The stool (4). 4 On the line; a critic in disguise (promotion). 5 The Blue Plate is yours (9). 6 **Dot sits down**: put Tee on the grill / run it alone / let her call it from the stool (12). 7 Off: the pie card, after close (diner). 8 Forty years; four stars (20). 9 Your dish in paint; Dot takes Sundays (24).
- *Links:* Opportunity: haddock at the Bay Fish Hall at dawn; keepsake a copy of the pie card; Samira wraps Dot's hand.

**4. Office Analyst — "Mostly a Filing Cabinet"** · `office` · Mon-Fri 09-17
- *Cast:* Ms. Hartwell*; Gideon (office manager, keeper of a small key); Lucia (the other junior, colour-codes); Tav*; Ada Finch (the Finch).
- *Play, The Odd Number:* three small tables; find the cell that does not add up.
- *Arc:* nobody has met Finch. 1 The fern (1). 2 A row of sevens (2). 3 The 1989 photograph (4). 4 Your own client: the Ferry Trust wants a number (promotion). 5 Counting a ferry: who is on the five o'clock boat (10). 6 **Two numbers**: report both / the one they asked for / ask her (13). 7 The cabinet: Finch counted the same boat in 1991 (15). 8 The meeting (19). 9 Finch waters the fern (23).
- *Links:* the Petrel (lighthouse timetable); Opportunity: ride the dawn boat; ties to the station agent's Mrs. Santos and the nurse's night shift.

**5. Courier — "To the Person Who Feeds the Cats"** · `courier` · Mon-Fri 08-14
- *Cast:* Rhonda*; Dez*; Sal (the walking route, forty years, a hand truck called Dolores); Gus*; Mrs. Greer* (Maplewood post office).
- *Play, Five Drops:* order five addresses on the district map against a clock.
- *Arc:* 1 The bag (1). 2 A parcel addressed only "to the person who feeds the cats" (3). 3 The Hillcrest stairs with a floor lamp (5). 4 Pier 7: it is from Gus's sister (7). 5 The Post Office is not the enemy (10). 6 **Sal's knee**: walk his route with the cards / split it by bike / ask him (13). 7 The Golden Bag, against Dez (16). 8 Gus's answer (20). 9 Dolores, and one card left over (24).
- *Links:* Opportunity: "Tomas, who plays the trumpet badly" (answered at the Blue Heron: the bartender's Tomas); keepsake Sal's doorman cards; Gideon signs for a parcel at Hartwell Tower.

**6. Fitness Trainer — "One Pull-Up"** · `gym` · Mon Tue Thu Fri Sat 08-14
- *Cast:* Coach Tasha*; Winnie (seventy-one, one goal); Calder (hides on the far treadmill); Tav*; Coach Okafor* (Natatorium).
- *Play, The Encouraging Zone:* hold a "push" slider in a moving green band through a client's set.
- *Arc:* 1 We yell FOR people (1). 2 The far treadmill (2). 3 Four seconds on the bar (4). 4 The oar on the wall: Tasha's last race (promotion). 5 Land versus water (9). 6 **Calder's card has not moved**: call / a postcard from the treadmill / leave the door open (12). 7 The six o'clock slot; Tav signs up for the Half (15). 8 Off: mile nine (River Walk, Sunday). 9 One: the gym goes quiet for Winnie; Tasha goes back to a boat (22).
- *Links:* Opportunity: lunchtime aqua at the Natatorium; the university rowing club; Tav's four-year-old canon joke finally pays off.

**7. Librarian — "Forty-One Years Overdue"** · `library` · Tue-Sat 10-17
- *Cast:* Ms. Castillo*; Wendy (sixteen, volunteer detective); Mr. Vasile (seventy-nine, learning to read); the Captain*.
- *Play, By the Number:* order six spines; then one reference riddle from a vague description.
- *Arc:* 1 Soft shoes (1). 2 The blue book about a dog (2). 3 The drop box: a book due in 1985 (4). 4 Story Hour; Mr. Vasile's tin of letters (promotion). 5 E.T.: the Captain (9). 6 **Item seven: close Saturdays**: speak yourself / help Mr. Vasile speak / a slip in every book (12). 7 Off: two minutes at the council (`cityhall_council`, Tue/Thu evening). 8 The date stamp; a first headline (18). 9 Saturday: Mr. Vasile reads to the children (22).
- *Links:* City Hall council (the existing "speak" mechanic) and archive; keepsake Miss Pruett's date stamp; echoes the analyst's ferry headline.

**8. Nurse — "Thursdays at Ten"** · `clinic` · Mon-Fri 08-16
- *Cast:* Nurse Samira*; Dr. Faye (brilliant, talks like a leaflet); Hal (front desk); Mr. Albrecht (retired tailor, nothing wrong with him); Otis*; Mr. Sethi*.
- *Play, Who First, and a Pulse:* order four waiting patients; count one pulse on the beat.
- *Arc:* 1 Wash hands, listen first (1). 2 Mr. Albrecht's flutter (Thursday; 4). 3 The leaflet: translate good news (6). 4 Otis and the big machine (promotion). 5 Full house; Samira's sandwich (weather; 10). 6 **The slot**: prescribe him the chess tables / tell him gently / keep the slot (13). 7 Off: table three (`spot:chess_tables`). 8 Running the floor; Dr. Faye sits down (19). 9 Ten o'clock: he comes to cancel in person, with a cake (23).
- *Links:* Mr. Sethi gets an opponent who will not lose on purpose (also heard at the barbershop); Otis buys the bike.

**9. Dock Worker — "Nine Words"** · `warehouse` · Mon-Fri 06-14
- *Cast:* Gus*; Annie (crane operator, sings on the radio); Kip (afraid of the forklift); Skipper Wren* (the Osprey).
- *Play, Heavy Low, Labels Out:* choose the stacking order of six crates; at level 3 a forklift slot bar.
- *Arc:* Gus says about nine words a day; Annie keeps a tally. 1 Yellow line (1). 2 The tally (2). 3 Forty lobsters (4). 4 Teach Kip (promotion). 5 The notice: the 1961 crane is to go (9). 6 **The morning of the Osprey**: a fraying strap: stop the line / pull Kip clear / radio Annie. Gus says twenty-three words (storm; 12). 7 The statement (15). 8 The ticket; Bertha kept for storms (19). 9 The hat, and the loud kitten (23).
- *Links:* Bay Fish Hall freight; Opportunity: nine saucers; keepsake your hard hat; the courier's parcel lands here.

**10. Bartender — "No Requests Before Nine"** · `bar` · Wed-Sun 18-24
- *Cast:* Lou*; Kit* (as your friend; her own story is the Chapters'); Miss Etta (sang with Lou's band, does not sing now); Jonah; Tomas (trumpet, badly).
- *Play, Read the Room:* three guests, two cues each: a drink, water, or a minute of listening.
- *Arc:* 1 Wear black (1). 2 The end stool (2). 3 Senior-level work: Jonah's phone (4). 4 Under the sheet: Lou's drum kit (promotion). 5 Tomas at open mic (Wednesday; 9). 6 **The Friday with no drummer**: Lou plays / is there a drummer in the house / Kit and her one finished song (Friday; 12). 7 After hours (15). 8 Your name on the board (19). 9 The last song of the night (23).
- *Links:* open mic and live Friday events; Marchetti's for the good cherries; Kit's "one finished song" is offered, never required.

### New jobs

**11. Gate Agent — "Final Call"** · `airport:concourse` · Thu-Mon 05-12 · computer; charisma 2
- *Ladder:* Gate Assistant $15 · Gate Agent $18 (charisma 3) · Lead Agent $22 (charisma 5, logic 2) · Duty Manager $29 (charisma 7, logic 4).
- *Cast:* Connie (lead agent, announcement voice); Rafi (plane spotter); Mr. Beaumont (seat 4A, every Monday); Captain Demir (pastries from wherever he woke up); Juno (eight, flying alone).
- *Play, Name, Flight, Gate:* ten passes against the board, spot the two that are wrong; call the rows in order.
- *Arc:* Connie has announced thirty years of departures and never taken one. 1 Gate B3 (1). 2 Seat 4A (Monday; 2). 3 The ladybird backpack (4). 4 The microphone (promotion). 5 Three hours of fog (fog; 9). 6 **The door**: hold two minutes / close on time and rebook her / look to Connie (12). 7 An unpunched staff pass from 1996 (15). 8 A seat on the left (19). 9 Final call, for Connie (Monday; 23).
- *Links:* existing stations `gate_desk`, `boarding_door`, `info_desk`; the lighthouse on the climb-out (Opportunity: wave back).

**12. Baggage Handler — "Nothing Is Lost"** · `airport:terminal` · Tue-Sat 14-22 · phone; fitness 2
- *Ladder:* Ramp Hand $15 · Baggage Handler $17 (fitness 3) · Belt Lead $21 (fitness 5, handiness 3) · Ramp Supervisor $27 (fitness 6, handiness 5).
- *Cast:* Lena (belt lead, crossword); Abdi (studying for his pilot's paper); Mr. Gale (lost and found, a ledger in copperplate).
- *Play, Read the Tag, Not the Bag:* a conveyor sorter by tag colour, speeding up.
- *Arc:* 1 Wheels down, handles in (1). 2 Two hundred and forty rubber ducks (2). 3 A rabbit, traveling alone (4). 4 Flash cards (promotion). 5 The night everything landed here (storm; 9). 6 **The garment bag**: a wedding dress on the wrong label: carry it yourself / call the hotel / find the bride (12). 7 The Traveler: a suitcase hidden from eleven auctions (15). 8 The claim stub; Abdi passes (19). 9 Deputy Keeper of Lost Things (23).
- *Links:* existing stations `baggage_carousel`, `bag_cart`, `lost_found`, `oversize_desk`; Odile at the hotel; the River Fair duck race.

**13. Station Agent — "Four Minutes Fast"** · `central_station` · Mon-Fri 06-13 · phone; no requirement
- *Ladder:* Platform Assistant $13 · Station Agent $15 (logic 2) · Senior Agent $18 (logic 3, charisma 3) · Stationmaster $24 (logic 5, charisma 5).
- *Cast:* Stationmaster Nwosu; Tick (announcer); Mr. Pike*; Fenn*; Mrs. Santos (the 6:42, with an ice box).
- *Play, Along the Train:* watch the doors along the length, raise the flag at the right moment; one runner may be coming.
- *Arc:* the hall clock has been four minutes fast since 1924, on purpose (the City Hall archive's own tram map says so: "clock 4 min fast, do NOT tell the public"). 1 The clock is right (1). 2 The lost property cupboard (2). 3 Four minutes (Monday; 4). 4 The gift (promotion). 5 By hand: a signal failure (weather; 9). 6 **The letter from the Authority**: tell the town / list it "as found" / let it be corrected and give the minutes another way (12). 7 Off: drawer 24-T with Mr. Pike (`cityhall_archive`). 8 The engineer (19). 9 The eighth tick; a second whistle (23).
- *Links:* free transit perk (exists); Opportunity: a tuba for Hillcrest Brass; keepsake the whistle.

**14. Retail Associate — "The Window"** · `deptstore` (the Thread & Co. Outlet bay, `mall:thread`) · Thu-Mon 12-20 · phone; no requirement
- *Ladder:* Stock Associate $12 · Sales Associate $14 (style 2) · Floor Stylist $17 (style 4, charisma 2) · Outlet Manager $22 (style 6, charisma 4).
- *Cast:* Imani* (owner, visits Thursdays); Gwen (floor lead, the folding board); Paolo (windows, names the mannequins); Saffron (seventeen, the green dress); Mrs. Price (mall walkers).
- *Play, Dressed for the Day:* an occasion and a budget; choose three pieces (the existing `outfit` mini-game).
- *Arc:* 1 The folding board (1). 2 The noon walkers; a green dress (2). 3 Forty dollars and an interview (4). 4 Imani on Thursday: the lease (promotion). 5 End of season (`season_end_sale`; 9). 6 **Sixty-nine dollars**: your staff discount / hold it behind the till / a Saturday job for her (12). 7 Window Night: choose the window (15). 8 Steve's arm (19). 9 Two more years (23).
- *Links:* the season-end sale; Opportunity: the practice walk.

**15. Museum Guide — "That Is Not Edith"** · `museum` · Wed-Sun 10-17 · computer; charisma 2
- *Ladder:* Gallery Attendant $14 · Docent $17 (charisma 3, logic 2) · Senior Docent $21 (charisma 5, logic 4) · Curator of Learning $28 (charisma 6, logic 6).
- *Cast:* Dr. Okafor*; Ines* (the museum's docent); Norm (guard, says good morning to Marge); Flo (eighty-eight, in one of the photographs).
- *Play, Walking Backwards:* a four-stop tour; read the group and choose what to say; once, the right choice is silence.
- *Arc:* 1 Do not lean on the tyrannosaur (1). 2 A child asks why she is called Marge (2). 3 The flatbed, 2009 (4). 4 Your first tour (promotion). 5 Free Friday: "That is not Edith. That is me." (`mus_free_friday`; 9). 6 **The label**: correct it now / proof first / a card that asks the town (12). 7 The tin: a pay packet, and Marge Doyle with a ladle (15). 8 Two names (19). 9 The highlights tour: you answer the child (Saturday; 23).
- *Links:* the school party (the teacher's rope with loops); City History photographs; Opportunity: the old clay pits at the Lookout.

**16. Florist — "The Friday Flower"** · `conservatory` (the flower room behind Garden Gifts) · Tue-Sat 07-14 · phone; no requirement
- *Ladder:* Bucket Hand $13 · Florist's Assistant $15 (gardening 2) · Florist $18 (gardening 4, creativity 3) · Head Florist $24 (gardening 6, creativity 5). Tips.
- *Cast:* Pet (head florist, stern with roses); Wendell*; Hank (the van is Petunia); Mr. Babbage (the monthly apology bouquet); Odile*.
- *Play, Three Kinds and No More:* an order card; choose focal, filler and green; wrap on three timed taps.
- *Arc:* 1 On the slant, under water (1). 2 One white flower, Fridays, no name (Friday; 2). 3 The usual: what does she actually like? (4). 4 The hotel lobby, seen from the revolving door (promotion). 5 Forty buttonholes (Saturday; 9). 6 **No peonies**: ask Wendell for the flower show / a hedgerow bouquet / call the bride (Saturday; 12). 7 The third bench: T. Lindo, he sat here: carry it for her / plant them there / walk with her (Friday; 15). 8 The centrepiece (19). 9 Second-best secateurs (23).
- *Links:* the hotel's weekly flowers; Saturday weddings; the seasonal flower show; a repeating Friday Opportunity if you chose to carry the flower.

**17. Radio Host — "The Late Boat"** · `radio_studio` (NEW room in the MBTV Broadcast House) · Thu-Mon 21-01 · computer; charisma 2
- *Ladder:* Board Operator $14 · Overnight Host $17 (charisma 3, music 2) · Evening Host $22 (charisma 5, music 3) · Program Director $29 (charisma 7, music 5).
- *Cast:* Hattie (engineer-manager, twenty years off the air); Sunny (velvet on air, tongue-tied off it); Manny*; Silas*; Noor* (line three).
- *Play, Hit the Post:* choose a record for the caller's mood; talk over the intro and stop just before the singing.
- *Arc:* forty-one listeners. 1 Three seconds (1). 2 Cab 22 and the lighthouse (2). 3 Line three: a cello down a telephone (4). 4 Name the show (promotion). 5 Porch lights off for the meteor shower (clear; 9). 6 **The storm**: open the lines / be the steady thing / hand Hattie the microphone (storm; 12). 7 The memo: "The Overnight Mix" (15). 8 Six hundred postcards; your neighbour unpacks a cello (19). 9 Still here: Silas says "good show" (23).
- *Links:* the lighthouse's own radio bulletin; the Observatory; the General Post Office; Noor is the player's next-door neighbour.

**18. Teacher — "Room 4"** · `school_classroom` (NEW room, Maplewood Elementary) · Mon-Fri 08-15 · computer; logic 2, charisma 2
- *Ladder:* Classroom Aide $15 · Teaching Assistant $18 (logic 3, charisma 3) · Teacher $24 (logic 5, charisma 5) · Lead Teacher $31 (logic 7, charisma 6).
- *Cast:* Principal Whitlow; Mr. Calloway (about to be a father); Mr. Nguyen (caretaker, mittens on a string); Nora*; Cosmo (does not speak at school, draws maps); Juniper; Ayo.
- *Play, Who Can Show Me?:* a two-minute lesson: call on a spread of hands, bring a daydreamer back with a question.
- *Arc:* 1 The door with the paper sun (1). 2 Cosmo's map (2). 3 Twiglet the stick insect is missing (4). 4 Earlier than expected: the class is yours (promotion). 5 Indoor recess (rain; 9). 6 **One line each**: he holds the map / a short line, practised / ask him, on paper (12). 7 The rope with loops: "She is at the whale." (15). 8 Your name on the door (19). 9 Our Town (23).
- *Links:* the Museum trip; Nora next door (one optional line about Mom's practice term after Chapter 12); keepsake Cosmo's map.

**19. Aquarist — "Count Them in the Morning"** · `aquarium` · Wed-Sun 07-14 · computer; logic 2
- *Ladder:* Volunteer Keeper $14 · Aquarist $17 (logic 3, swimming 2) · Senior Aquarist $22 (logic 5, swimming 4) · Head of Animal Care $29 (logic 7, swimming 5).
- *Cast:* Dr. Reyes*; Bart (penguin keeper); Tamsin (dive lead). And Inky, the six existing penguins, Old Tom.
- *Play, The Morning Round:* fill three diet trays to the card, then hand-feed in order while the greedy one tries twice.
- *Arc:* 1 Before opening (1). 2 Inky reads your wrist (2). 3 Five penguins (4). 4 The egg (promotion). 5 A wet trail: he lets himself out (9). 6 **The power cut, and the egg is pipping**: stay with hot water bottles / the dive cart's battery / put it back under its parents (storm; 12). 7 Seven (15). 8 Old Tom will not eat (19). 9 First swim; you choose the name (23).
- *Links:* uses the staff door and `aquarium:lab`; does not touch the existing turtle chain; Opportunity: pebbles from Gull Point Beach.

**20. Restaurant Cook — "Four Stars"** · `restaurant` (The Gilded Gull) · Tue-Sat 15-23 · computer; cooking 4
- *Ladder:* Commis $17 · Chef de Partie $21 (cooking 6) · Sous Chef $27 (cooking 8, charisma 2) · Chef de Cuisine $36 (cooking 9, charisma 4). Tips.
- *Cast:* Chef Bastien (whispers; the whisper is worse); Sol (pastry, hums); Mo (steward, tastes everything); Celeste*; Mr. Quill*. And Gilbert the gull, on the rota.
- *Play, All Together:* three dishes with different times, started so they finish together; then plate to Chef's sketch.
- *Arc:* the menu has not changed since 2011. 1 The whisper (1). 2 Gilbert, one sardine at four (2). 3 A thumbprint (4). 4 Since 2011; Sol's Tuesday tart (promotion). 5 Off: by the eye, at the dawn auction (`fishmarket`). 6 **Table seven**: Chef is away and the critic is in: the twelve exactly / the twelve and Sol's tart / your own fish course (12). 7 Reading the tickets (14). 8 Saturday's Gazette: four stars (19). 9 Service: a thirteenth dish, in ink (23).
- *Links:* the Bay Fish Hall auction; the Gazette; this is the owner's "sous-chef" (level 3 is Sous Chef; Dot's diner already has that title, so the job is named for the restaurant).

**21. Hotel Concierge — "The Black Book"** · `hotel` · Wed-Sun 14-22 · computer; charisma 3
- *Ladder:* Bellhop $14 · Front Desk Clerk $17 (charisma 4) · Concierge $22 (charisma 6, logic 3) · Guest Relations Manager $30 (charisma 8, logic 4). Tips.
- *Cast:* Odile*; Gus the doorman*; Marisol*; Mrs. Voss (room 710, nine years, has not gone out in two).
- *Play, "Where Can I...?":* a guest wants something in the city; choose from three places. **Places the player has discovered score higher**, so walking the city makes you better at the job.
- *Arc:* 1 White gloves (1). 2 Room 710: a lemon, a screwdriver, an honest opinion (2). 3 Not for tourists (4). 4 A ring, Friday, on the roof (promotion). 5 The ring bearer (Saturday; 9). 6 **Gala night and no room**: give them the held suite / Mrs. Voss's spare room / take them somewhere you know (the 12th; 12). 7 By heart: why the book cannot be copied (15). 8 Mrs. Voss and the stars (19). 9 A blank book (23).
- *Links:* does not touch Odile's suitcase chain; the Observatory; the florist's lobby vase; Opportunity: go somewhere new.

**22. Observatory Guide — "The Long Record"** · `observatory` · Thu-Mon 18-24 · computer; logic 3
- *Ladder:* Night Usher $15 · Sky Guide $18 (logic 4, charisma 2) · Planetarium Presenter $23 (logic 6, charisma 4) · Staff Astronomer $31 (logic 8, charisma 5).
- *Cast:* Dr. Halvorsen*; Stella*; Ezra (eleven, wants a comet); Mr. Achebe (and his wife, and "their star").
- *Play, Star-Hop / Show Cues:* clear nights: three clues to tonight's target, then focus (the existing telescope). Cloudy: run the planetarium cues.
- *Arc:* one star, estimated on every clear night since 1979. 1 Let your eyes arrive (1). 2 The sky is shut (cloud; 2). 3 Smudges (Saturday; 4). 4 One star (promotion). 5 Their star is Saturn (clear; 9). 6 **Ezra's object**: tell him / let him check the atlas / let him have tonight (12). 7 The ladder: a second observer (15). 8 Spring 1994: the gap (19). 9 Three sets of initials (clear; 23).
- *Links:* star party; does not touch the comet chain; Opportunity: twenty minutes at the Lookout.

**23. Reporter — "Who Cares?"** · `gazette_newsroom` (NEW room; assignments all over the city) · Mon-Fri 10-18 · computer; writing 2
- *Ladder:* Stringer $15 · Staff Reporter $19 (writing 4, charisma 2) · Senior Reporter $25 (writing 6, charisma 4) · City Editor $33 (writing 8, charisma 5).
- *Cast:* Max (editor, red pencil); Lev (photographer, speaks in captions); Edwina ("Comings & Goings", fifty years); Birdie*; Mr. Quill*; Silas*.
- *Play, Who Cares?:* at the place, three people and a question each; at the desk, a first line, an order and a headline.
- *Arc:* 1 Who cares? (1). 2 Forty-one pigeons (2). 3 Comings & Goings: spell every name right (4). 4 Item four, a crosswalk: go and stand in the street (promotion). 5 The sports desk is sick: the Arena (9). 6 **The Lighthouse Fund is four thousand short**: print now / print with a way to help / hold it and say so (12). 7 Letters; a postcard from the keeper (15). 8 Above the fold: Edwina (19). 9 Arrived: she lends you the column for a week (23).
- *Links:* every showpiece is an assignment; city-event days make the event the assignment; the day's Gazette headline can carry the player's story; keepsake Max's red pencil.

**24. Hair Stylist — "And Daughter"** · `pub:22` (Otis & Sons Barbershop, Old Town; the unique room exists) · Tue-Sat 10-18 · phone; no requirement
- *Ladder:* Shop Assistant $13 · Junior Stylist $16 (style 3) · Stylist $20 (style 5, charisma 3) · Master Barber $27 (style 7, charisma 5). Tips. Free haircuts (the existing hair service runs here).
- *Cast:* Pops (since 1978); Renée (chair two, the best cutter, not on the sign); Mr. Sethi*; Deacon Mills (the same shave since 1987); Kit* (paints signs).
- *Play, The Cut:* the existing cutting scene, plus a read of the customer: talk or quiet.
- *Arc:* the sign says "& Sons"; the son is a dentist. 1 Sweep toward the door (1). 2 A trim he does not need (2). 3 A first haircut (4). 4 Chair three (promotion). 5 Three grooms (Saturday; 9). 6 **The razor**: Pops's hand is not steady: you / Renée / his hand on yours (Thursday; 12). 7 Only a name (15). 8 "Ask my daughter." (19). 9 Otis & Daughter (& Co.) (23).
- *Links:* Saturday weddings; Opportunity: a house call; Kit as a sign painter.

**25. Firefighter — "Probably Toast"** · `fire_station` (NEW room in the existing fire station) · Wed Fri Sun 20-04 · computer; fitness 4, handiness 2
- *Ladder:* Probationary Firefighter $20 · Firefighter $24 (fitness 5, handiness 3) · Engineer $29 (fitness 6, handiness 5) · Lieutenant $37 (fitness 8, handiness 6, charisma 3).
- *Cast:* Captain Abara (Roz the baker's sister); Dutch (engineer, makes the chili); Tully (fifty-one seconds); Pip*. And Sprinkler, a tortoise.
- *Play, The Bell:* dress in order against sixty seconds; at the call choose three pieces of kit and do one careful thing.
- *Arc:* nine calls in ten are toast. 1 Sixty seconds (1). 2 It is toast (2). 3 Chili night; a cat up the big maple (Sunday; 4). 4 Fourteen questions at the open house (promotion). 5 Standby (`harbor_day`, else an Arena concert; 9). 6 **The tenth**: a flooded basement on Lantern Row, a couple, a parakeet and a box (storm; 12). 7 A letter in the logbook: Dutch has not told anyone (15). 8 She pulls to the right: you learn Engine 2 (19). 9 One square of chocolate; it is toast (`winter_parade` if it falls; 23).
- *Links:* three long night shifts with a bunk (a new rhythm: four days off); Roz's bread; the Winter Lights Parade; keepsake (a recipe) Dutch's chili card.

---

## 3. The play, for the programr

Shared rules (data: `PLAYS` in `jobs_new.js`; each has `how`, `good`, `bad`, `pays`, `reuses`):

- **When:** once per worked shift, in place of one ordinary task chain near the middle (not on a shift where a `mid` beat plays: beat first, play next shift). 60 to 120 real seconds.
- **Input:** taps / clicks only, the same sheet as the existing mini-games (`G.minigame.play`), so it works at 390x844 and docked in landscape.
- **Scoring:** 0 to 1, stars at 0.55 and 0.85 as now. A good result adds to the shift's task score (never the difference between kept and let go), a small tip or bonus, and bonus xp (`playBonus`). "Auto" and "mini-games off" score the usual baseline.
- **Skip to the end** never opens the play and still pays the flat auto score.
- **Reuse first.** Nine plays sit on things that exist: `outfit` (retail), the hair cutting scene (stylist), the hotel's "Where can I...?" finder, the observatory telescope and show engine, `pour` (bartender), `flip` rings (line cook), `reps` (trainer), `song` (radio), `study` (analyst). Two more lean on existing pieces (the museum's tour stops, the reporter's `write`). The other fourteen need a new small game; six of those are the same shape, "put things in the right order" (grocery bag, crates, spines, triage, route, diet trays).

---

## 4. Pacing

Data: `PACING` in `jobs_arcs.js`.

- **One beat a shift at most**, and not on two shifts running (except beats 1 and 2). A beat is 6 to 14 lines on its longest path (median 9): about a minute.
- **Typical spacing:** shifts 1, 2, 4, the first promotion (or shift 8), 9, 12 (the turn), 15, 19, 23. A five-day job tells its story in five or six weeks; the firefighter in eight.
- **Conditions lapse.** A beat that wants a weekday, weather, an event or a level carries `orShifts`: after that many shifts it plays anyway, with fallback wording where the text needs it. The checker refuses a soft condition without one.
- **Skipped shifts.** A `clockin` beat plays before the Work / Skip choice. `mid` and `clockout` beats do not play on a skipped shift; they wait. If one has waited through two skipped shifts, clock-in offers a third button, "Just the moment, then skip".
- **Off-shift beats** (seven of the 225) are invitations. They never expire. The next beat waits a while for them, then goes on without, and the invitation stays open.
- **Texts:** at most one arc text a day, never at night; each carries its own delay. On reaching the top level the boss sends one last text (`promoted:4`).
- **Ambient lines:** drawn from a no-repeat bag; about one bubble every 40 to 60 seconds of a worked shift; conditional lines (weather, level, "after the arc") join the bag only while true.
- **Stream, not flood.** With one job at a time (the existing rule), work adds about two story minutes a week. It never competes with a Chapter: no job beat starts while a Chapter is running.
- **Quitting** freezes the arc; coming back resumes it. The shift count per job is kept for good.

---

## 5. Must-build list (ranked), with the cheapest acceptable version of each

**Engine**
1. **The beat runner.** Reads `ARCS`: checks `when` at clock-in, plays `steps` through the Chapters dialogue sheet (same step shapes: say, choice, if, beat), applies `fx`, sets `beat:<id>`. *Cheapest:* reuse the Chapter engine's step player as is; triggers are a 40-line function.
2. **Per-job counters and flags.** Shifts attended per job (never reset), picks, flags. *Cheapest:* one object in `G.state.jobs.story`.
3. **Speakers.** 13 named people the game already has without a speaker hook (showpiece and post-office staff) and 69 new ones. *Cheapest:* a portrait-less bubble with the name for anyone not on screen; put only each job's boss and one coworker in the room as staff; add the rest as the art arrives.
4. **The 15 job rows.** Append `NEW_JOBS` to JOBS, add `jobId` to the venues, add boss rows to cast.js JOBS and their `texts` to JOB_TEXTS (already in the right shape). *Cheapest:* ship the eleven that need no new room first.
5. **Station tags** for the new work loops in rooms that exist (museum, aquarium, hotel, conservatory, Galleria bay, barbershop, Central Station, the Gull's kitchen). *Cheapest:* tag existing fixtures; the airport's tags are already there.
6. **Ambient lines** on shift (shuffle bag per job). *Cheapest:* the existing city-lines bag code.
7. **Texts, Opportunities, keepsakes** as effects. *Cheapest:* `G.messages` and `G.opps.offer` exist; keepsakes can be inventory items first and wall pieces later.
8. **The plays.** Start with the nine that reuse a mini-game; then the "order six things" family (one game, six skins); then the rest. Until a play exists, the job runs on its ordinary task loop and loses nothing but its flavor.
9. **Off-shift beats** as My Day ideas. *Cheapest:* a planner "idea" row with a place and a window; the scene starts on entering the room.
10. **The reporter's shift** out in the city (the courier's walking-pace shift clock already does this).

**Rooms (four new, all inside buildings that stand on the map; nothing moves)**
1. `fire_station` 14x10 in `bld.civic.firestation`: engine bay, kitchen table, bunks, gear hooks, bell. *Cheapest:* one room, Engine 2 as a static prop, calls resolved on a card without leaving the station.
2. `school_classroom` 12x9 in the Maplewood school: desks, a carpet, a board, a nature table. *Cheapest:* reuse the university lecture-room furniture at child scale; children as the existing kid characters.
3. `gazette_newsroom` 13x9 above an office lobby (recommended: the OSTRANDER block beside City Hall): reuse office desks; one shoebox, one dial telephone.
4. `radio_studio` 9x7 behind the MBTV lobby: a board, a microphone, a record shelf, a window over Hillcrest. *Cheapest:* office desk + the bar's DJ booth art.

**Fixtures in existing rooms** (cheapest: a recoloured existing prop): a flower room corner in the Conservatory; a pass and stove line in the Gull; a concierge chair and the brass bell for 710; a lost-and-found counter with a ledger at the airport; the station's lost-property cupboard and announcer's booth; a folding table in the outlet; an incubator in the aquarium lab; Marge's guard chair.

**NPC looks** (data: each new person's `look`). Priority: the fifteen new bosses, then one coworker each, then regulars. Children: Juno, Cosmo, Juniper, Ayo, Ezra. Animals: a herring gull at a door, a tortoise with a badge, a grey kitten, a stick insect (a twig that waves).

**Icons / uniforms:** fifteen job icons for the board; uniforms `gate_agent`, `ramp`, `station`, `retail`, `docent`, `florist`, `aquarist`, `bellhop`, `barber`, `firefighter` (five jobs wear their own clothes). *Cheapest:* recolours of existing outfits (office, dock, chef, nurse).

---

## 6. Things the lead should know

- **The owner's list of fifteen (update 3):** thirteen are here as asked. Two were swapped for showpieces that already have rooms: *vet assistant* became **aquarist** (the same heart; Dr. Reyes's laboratory is a vet's room and is built) and *software developer* became **observatory guide** (the only night-sky job; no startup loft exists). Both are sketched as jobs 26 and 27 below, ready to write if the owner wants them back.
- **Small new facts** (none contradicts the Chapters; change freely): the Gazette absorbed the old Bay Courier and kept Edwina; the station clock is four minutes fast on purpose (the archive's 1924 tram map already says so); Marge the tyrannosaur is named after a cannery canteen lady, found at the clay pits in 1961 (the museum's canon says only that she moved on a flatbed in 2009); Captain Abara is Roz's sister; Mr. Pike's motorman "knew about the clock".
- **Seven optional lines behind Chapters:** `done:ch03` (Pip uses `{title}` at the firehouse), `done:ch06` (Mr. Pike names Ray Larkin), `done:ch09` (Edwina took Nana's call in 1988), `done:ch10` (Milo corrects a dinosaur fact), `done:ch11` (Stella's constellation form), `done:ch12` (Nora on Mom's practice term), `done:ch15` (Rafi remembers a man counting the jet bridge). Without the Chapter each line is simply left out (two have a plain alternative).
- **Name clashes to watch:** two people called Ines (the librarian, the museum docent: both already in the game); three called Gus (dock foreman, hotel doorman, observatory docent: all already in the game; this design uses the first two, with ids `gus` and `gus_door`); two Okafors (curator, swim coach) and "Blitz" Okafor (all existing). No new person shares a first name with a cast.js NPC.
- **Existing canon used:** Marlow's and Dot's promotion texts (keys, the pie recipe), "Finch is mostly a filing cabinet", the Hillcrest stairs with a floor lamp, Tav's four years of training, the gull who thinks he is staff, Mr. Quill's missing fifth star and his Mondays at Dot's, Noor's practice hours, Gus's kitten, the six penguins' names, Odile's twenty-two years.

### Jobs 26 and 27, in reserve
- **Vet Assistant — "The Waiting Room"** · a small clinic room behind *Paws & Whiskers* (the pet shop's unique room exists; one new back room). Mornings. *Play:* calm the animal (keep a stroke rhythm) while the vet works. *Arc:* an old dog, a boy who will not say the dog is old, a parrot that swears in a dead man's voice, and a vet who cannot keep any of the strays she fosters.
- **Software Developer — "Ship It"** · a loft above the *Shed 5 Works* co-working lobby (one new room). Flexible weekday hours, tech skill, the existing `debug` mini-game. *Arc:* four people building an app that tells you when the next ferry is; it is wrong for a month; the fix is to go and ask the ferryman.

---

## 7. Open questions for the owner

1. **Two of your fifteen were swapped** (vet assistant → aquarist; software developer → observatory guide), because the aquarium and observatory are built and neither a vet clinic nor a startup loft is. *Recommendation: keep the swaps; add the two as jobs 26 and 27 later if you miss them. They are sketched above.*
2. **Four jobs need a new room** in an existing building (fire station, classroom, newsroom, radio studio). *Recommendation: yes, in that order; ship the other eleven first.*
3. **The teacher works beside Nora, at the school where Mom did her practice term.** It is one optional line after Chapter 12 and the arc stands without it. *Recommendation: keep; it is the warmest echo of the main story in any job.*
4. **Night and dawn jobs** (radio 21:00-01:00, firefighter 20:00-04:00 three nights a week, gate agent from 05:00). They ask the player to turn their day round. *Recommendation: keep; they are the variety you asked for, and the firefighter can sleep on shift.*
5. **One job at a time** stays the rule, so a player sees one arc at a time and must leave a job to try another (the arc freezes and resumes). *Recommendation: keep one job; make re-applying after a quit instant and friendly, so trying jobs is cheap.*
6. **The turn is sometimes sad for a minute** (a man who comes to the clinic because he is lonely; a florist's bench; a keeper's record with one gap). It always lands warm. *Recommendation: keep; this is the "genuinely emotional and real" of update 5, in small doses.*
7. **Existing bosses get more to say** than their current lines (Marlow, Dot, Gus, Lou and the rest carry whole arcs). Their voices follow cast.js. *Recommendation: read two arcs (suggested: Dock Worker and Line Cook) and say if the voices are right before the engine is built.*
8. **Tips and pay** of the new jobs sit inside the existing range ($12 to $44 an hour). The firefighter earns more per hour for three nights. *Recommendation: keep; tune after a week of play.*
