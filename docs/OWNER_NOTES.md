# Owner notes — digest of what George has asked for and how he reacts (newest last). Voice-typed: read for intent.

## Likes (keep doing)
- The city layout and liveliness ("so far the city looks great... very lively"); the Auto-work button ("very smart"); the train interior ("looks great").
- Leaving design decisions to the lead; stages published to play; brief status reports.

## Standing preferences
- Pixel art, chunky world, detailed characters, zoomed-in camera with limited zoom-out. Modern, diverse American city. Lots of life everywhere (streets, airport, stores).
- Clean: the phone is how you access everything. Not overwhelming: story is a steady optional stream.
- Names: "Opportunities" and "Appointments" — never "missions". No driving.
- Enterable places must be recognisable without arrows (door glow idea accepted for now; he may ask to restyle). Every cafe/public place enterable or walk-up. Stands and markets must sell.
- Streets uniquely named, on the phone map; addresses.
- Expand/convert, don't rework the city. Don't take away things that exist.
- Usage: pace the work; don't burn the 5-hour window (one worker at a time, pauses); don't stop running workers or downgrade models unless told.
- Wants extensive documentation in the repo and the lead to re-read it after compaction.

## Feature requests log (all recorded in BIBLE direction updates)
1. Core brief (day 1): see HISTORY. 2. Story + airport intro + cab tutorial. 3. Characters high-res; zoomed camera; diverse modern US city; downtown glass towers; River Walk.
4. Airport INTERIOR opening; mall (L-shape, ~10 shops); Central Station glass dome; observation deck with a story moment; more unique interiors; several grocery stores of different sizes;
   needs -> errand chains; a few creative new needs; stronger narrative adventure through the showpiece places; housing ladder; interesting enterable workplaces.
5. 15 more jobs with interiors (25 total). 6. Each job: narrative arc + characters + unique mechanics/moments/ambience; show-up-and-skip.
7. Deep relationships via vignettes; romance: dating app, dates, partners, move in, marriage (children maybe later); constant gentle narrative stream, some emotional and real.
8. Interests chosen at start split "fun"; every activity has a mechanic; animations + visible impact for progress bars (unpacking!); furniture/plant/clothes stores; hundreds of goods incl. functional ones
   (bicycle, skateboard, switchable lamps); online ordering with multi-day shipping; real home design mode (phone app); physical shopping with baskets + counter, buy menu still available; big sensible grocery aisles with other shoppers.
9. Small fixes requested: scroll judder (done), stalls sell (done), unique street names + addresses (done), train on two tracks (done), scooters without riders (done).
10. Performance venues: concert hall (orchestra comes out and plays), movie theater with a ~1-minute clip that actually plays, a theater show; full simulated flow (ticket, audience pours in, sit, show, leave).
11. City Guide app (visual guidebook: places by category + what's on + things to do); live music venues in bars/clubs; outdoor park concerts; lead to invent more events/activities. Asked what push vs pull request means (explained; no PR opened yet).
12. Vehicles flicker when passing (fixed: depth-sort rule). Map picks should offer Take Bus / Take Train with boarding + alighting stops, not only Take Cab (queued 2e). Future project: city 50-100% larger with new districts; may expand now if room is needed.
13. Post offices with interiors: go there to send packages (wait in line); letters from home; packages arrive at home; story use (send something back home).
14. Asked about CI checks (none set up; fine to forgo for now, 'don't change anything') and about moving to another account (not soon). Wants all his messages saved verbatim in git (done: OWNER_MESSAGES.md).
15. Pacing clarified: not worried about weekly usage at all; wants steady continuous progress, not start-stop. One worker at a time, no long pauses; just avoid slamming the 5-hour window.
16. Handoff strategy: no new sessions; keep handoff notes constantly current in the repo and re-read after compaction (docs/HANDOFF.md).
17. Big playtest (msg 36): loves the airport interior. Long list of fixes + new systems -> BIBLE update 11 / backlog 2f-2j. Key preferences: Talk only via button; relationships slower with daily cap; every interior unique; far more enterable buildings (lobbies); absurd amounts of clothes/hair; realistic chores (laundry, bladder); app store; navigator by need; university.
18. Guide app is top priority: comprehensive, fun, visual like a guide book; needs a better name than 'things to do' (working name: Wander).
19. Guide entries need active links (waypoint; add scheduled events to planner). Add 5-6 big staged events (street festivals, parades) across the first 6 months — design now, build later.
20. Big events: spread across the whole year (5-6); must be dynamic and in-world, not cutscenes or separate scenes.\n21. Plans to move the project to another Claude account at the end of this session — keep everything handoff-ready (HANDOFF.md has a MOVING section).
22. Asked how many workers were running and to stop once they report back (msg 44) — none running; clean stop for the account move.
23. (msg 58) New account: new lead took over; publish a new artifact, then start 2g unique interiors + many more enterable buildings.
24. (msg 59) Workers run on Fable 5.2 from now on (the running 2g-1 worker was restarted on it).
25. (msg 60) Asked how large the team will be for the next steps — answered: one Fable worker at a time + the lead (standing pacing rule); offered to run 2 in parallel if he wants faster.
26. (msg 61) Team of 4 workers at once allowed; asked for the plan of action/order of next steps.
27. (msg 62) The old usage numbers were from a different plan; the new account is on a plan with ~10x the usage. Workers no longer need to be ultra-thrifty: favour quality (more checks/screenshots), still steady.
28. (msg 63) Asked whether the signature (unique) interiors are done.
29. (msg 64) Starter apartments must differ from each other; every buyable/rentable property unique (no repeated layouts). Wave D: lots of interesting stores for home goods — a big home-improvement store (Home-Depot-like), department stores, furniture stores, etc. Expanding the map is fine when it makes sense.
30. (msg 65) Asked where the signature interiors sit in the plan; interiors must have activities attached and appear in the Wander guide.
31. (msg 66) "Signature interiors" = the big showpiece places (like the concert hall), not the small shops.
32. (msg 67) Asked (discussion only, no change yet) whether to split the team: Fable 5.2 for complex engineering/lead, Opus for easier tasks. Wants the LEAD on Fable 5.2 — says the session keeps switching back.
33. (msg 68) Team becomes 3 Fable 5.2 workers + 1 Opus QA & data worker. Transition naturally: let running workers finish; the next free Fable slot becomes the Opus QA/data lane.
34. (msg 69) Used /model to pick Fable for the lead; it reverts to Opus.
35. (msg 70) Keep the Opus lead for now; when the running workers finish, move the lead to a NEW session created on Fable 5.2. The new Fable lead first REVIEWS everything this (Opus-lead) session did (commits since a1d2ffc).
36. (msg 72) Loves the Maps trip options (foot/train/cab estimates). Fix: the waypoint arrow must never vanish — clamp to the screen edge when off-screen, work inside interiors (Central Station etc.) and lead room to room; guide every leg end to end (to the cab, bus stop, platform, onto the vehicle, to the destination); a red arrow marks your station/stop and a clear "This is your stop" notice pops up on trains and buses (player still gets off themselves). TOP of the queue for the next free worker.
37. (msg 75) New Fable 5.2 lead session started: review the previous (Opus-lead) session first, report plainly, then nav arrow -> Opus QA/data lane -> signature showpieces.
38. (msg 76) Doors must be tappable on the door itself, not only on the ground in front; wider touch area. Done in core/game.js pick() (tall capsule target for doors/exits/stairs/lifts).
39. (msg 77) Wants a TON of recipes; the starting food could not be cooked into anything; ingredients must live in the kitchen, not on the player. Lead did the kitchen part (Stage 15c); the recipe batch is queued as the next worker.
40. (msg 78) Tip pacing: Nestly tips only after the airport; the Wander tip after Nora's first text. Done (Stage 15d); all new-app banners also wait until you leave the airport.
41. (msg 79) A ton of lines for city folk: same frequency, many more lines, no repeats until the whole pool has fired; a big general pool + contextual pools (e.g. when you stink). An Opus writer does it, outside the 3+1 worker count.
42. (msg 80) The LEAD plans the structure and categories of the city-folk lines; the writer only writes them. Plan: docs/reports/city_lines.md.
43. (msg 81) Wander's 'Take me there' must offer the same travel options as the Map (foot, cab, bus, train). Done (Stage 16b) for Wander, Bay Basics tips and the need chooser via G.phone.routeTo.
44. (msg 82) Whatever the arrow points at must show on the Map when you open it. Done (Stage 16c): dashed red route, ring on the next target, labelled destination flag, Map opens framed on you + the next target.
45. (msg 83) Asked for status and which wave we are in — answered: Wave A done; in the signature-showpiece track (S1-S3 done, S4-S5 running), Wave B not started.
46. (msg 84) MapleCab 'Where to?' should start with what you are likely to want: upcoming planner items and the current arrow/objective. Done (Stage 22b): 'For you now' section.
47. (msg 85) The aquarium must be really excellent and detailed, with sea turtles among many other animals. Relayed to the running aquarium worker verbatim with a raised bar.
48. (msg 86) 'When its worked on' — follow-up to 85 (the aquarium is being worked on now). (msg 87) Wander needs no notification counter on its icon. Done (Stage 22c).
49. (msg 88) The Planner and Wellness counters never cleared whatever he did. Fixed (Stage 22d): they clear when the app is opened and only come back for something new. Standing preference: a counter must always be clearable by looking.
50. (msgs 89-90) Status update, then a recap of the waves — answered with the wave table (A done; showpieces S1-S6 done, S7-S9 running; B-E not started).
51. (msg 91) Wave order changed: old D (goods + home-goods stores, home design + shipping, new needs + Opportunities, unfinished art) is now WAVE C; old C (big city events, jobs expansion, relationships/romance) is now WAVE D; the university moves from B to the new D.
52. (msg 92) Clothing catalogue target raised to 1,000 items (he typed 100, then corrected to 1000). Sent to the running clothes worker.
53. (msg 93) Garment DRAWING is split across 3 Opus agents instead of the 1 Fable clothes worker; the Fable worker comes back once the drawing is done (for the systems: shops, laundry, closet app, integration).
54. (msg 94) Bug: pedestrians sometimes stop in the middle of the road and hold up traffic. Given to QA round 3 (it owns the crowd + traffic files right now).
55. (msg 95) Three new phone apps: one to read a book, one to watch movies, one to play games. Each gives a bit of fun, not too much. Worker launched.
56. (msg 96) Bladder drained too fast. Tuned (Stage 27b): about half the old rate — a full bladder lasts ~8 waking hours before 'Need to go' (was ~4), drinks cost less, a night's sleep costs ~16.
57. (msg 97) The movie app only shows films you have already seen at the cinema (no automatic release). So new films premiere at the cinema and the app is your collection for re-watching.
58. (msg 98) Movie app, final rule: there IS phone- and TV-only content (shows made for the small screen). Cinema films are different: once you have seen one at the cinema it appears on the phone TO BUY a short time later; after buying you can re-watch it.
59. (msg 99) Planner: very clear notifications, a lead-time alert so you can get there on time, and tapping a notification opens that item in the Planner. Done (Stage 28).
60. (msg 100) Needs a way to start a text chat himself. Done (Stage 29): '+ New chat' in Messages and a 'Write a message' composer with topics.
61. (msg 101) Tiredness drained 'just a bit' too fast. Energy drain eased about 13% (5.5 -> 4.8 per waking hour); Stage 30b.
62. (msg 102) The arrow vanishes once you are inside the destination building: courier delivery at the diner (where do I deliver?), the City Hall meeting (no arrow to the council chamber), the play (no arrow to the curtains). Wants the gaps examined and solved everywhere: the arrow must lead to the exact thing to do, not just to the building.
63. (msg 103) Wants a DEV MODE: turn off needs, unlimited money, unlock all progression and jobs etc.; switched on in the menu, then a corner button on the main game screen opens the dev menu. Built by the lead (Settings > More; DEV button bottom-left); Stage 33.
64. (msg 104) 'Continue', sent right after the Fable limit (resets Nov 21, 8am UTC) stopped the goods worker and the needs/Opportunities worker mid-work. Lead's reading (mine, not the owner's words): keep going rather than wait six days, so both jobs were handed to Opus workers who pick up from the files on disk; flagged to the owner so they can say wait instead.
65. (msg 105) 'No, make the workers Fable, I reset my limit.' Correction to the lead's reading of msg 104: do NOT move systems/creative work to Opus when Fable runs out; the owner resets the limit. Systems/creative/visual workers stay on Fable; only the QA/data lane is Opus (CLAUDE.md rule 3).
66. (msg 106) On the old-festivals-next-to-new-events question: don't merge, 'just spread the events out more'. Done (Stage 39b): the six older festivals moved to their own days; the big events keep their Saturdays.
67. (msg 107, the owner went to bed; lead designs and continues) NEXT WAVES, start as slots free ("main missions tonight, and the increased property"):
    (a) PLANNER vs SCHEDULE: two different things. Possibilities/recommendations (pulled from ALL content) on one side; "what is on my schedule" on the other. NOTHING is pre-added except main-story/family items; everything else the player selects, and that is how a day is filled. Dislikes the current calendar tab and pre-added items. An early explainer on how it works. The schedule becomes THE one thing from the phone with its own button in the UPPER-LEFT of the game screen (quick schedule): pull it up fast, it drives what you do next and makes recommendations.
    (b) MORE HOMES: more houses (build interiors for houses already on the map), a few more apartments for variety; on moving in choose FURNISH IT YOURSELF or PRE-FURNISHED (as now).
    (c) MAIN STORY: "Sims with a story", part narrative adventure, part life sim. Structure like an open-world game: main "missions" sit on the map and are started WHEN YOU ARE READY (no clock pressure; some have a time window, e.g. not at night); everything else (work, needs, appointments) stays on the clock. About 15, character-driven and dialogue-heavy, not heavily scripted, a story with your FAMILY (expanding what exists). The first ones teach the game (needs, taking up interests for Fun, getting a job), then it opens into the larger story; maybe a few days of gentle push first. They need a PROPER NOUN, their own colour in the schedule, and "no pressure / when you're ready" wording that never states game mechanics.
    (d) FINDABILITY: all this content is hard to find. Guide app keeps its encyclopedic categories but adds quick tools: "fun things to do", fast ways into every system. More contextual TUTORIAL WINDOWS (e.g. first time moving furniture: stores sell furniture, delivered next day). Not hand-holdy; stays free-form.
    (e) TEAM: don't worry about usage; keep the pace; but ONE LESS WORKER: let running workers finish, then carry on with one fewer. Lead's reading (mine): 2 Fable + 1 Opus QA from now on.
68. (msg 108) Asked for a status report and an overnight report. Lead answered in chat: Stages 48-55 published overnight (findability, Chapter engine + part 2, QA rounds 7-9, job stories, all 25 jobs), relationships design written; running: relationships engine, performance, QA round 10; open owner questions listed.
69. (msg 109) ANSWERS: (a) home purchase gets "pay in full" beside the mortgage: YES. (b) JOBS: add vet assistant + software developer back (26, 27) AND 15 MORE (= 42 jobs), placed in the new buildings we have made wherever possible. (c) Wants a LIST OF EVERY ENTERABLE BUILDING: what is in it and how much interactivity. (d) First-time windows: "Yes" to "fine, or fewer at the start?" — lead's reading (mine): the current amount is fine; no change. (e) CAB: do not lengthen the wait; cheat — if the cab is taking too long, spawn it just off screen. (f) Full jobs board on the phone: keep. (g) Romance rules (several dates early, one partner once together, no jealousy, Kit friend only): OK.
70. (msg 110) Intro: the yellow hint at the top slides to the BOTTOM when the phone opens and covers the reply buttons in Messages. Fix: keep it off the replies.
71. (msg 111) AUDIO: the basic city ambience sounds like a white-noise machine: CUT IT for now. Music and other audio stay. Redesign the city ambience at higher fidelity; lead to pitch options first.
72. (msg 112) (a) Laundry hamper stands in the way of the fridge at Juniper Court, maybe other homes: fix + sweep. (b) Explain the Opportunities system (are they the story missions?) and LIST them. (c) Zip Eats still shows as a LOCKED app: no more locked apps; an app simply becomes downloadable once its conditions are met.
73. (msg 113) Asked whether the lead can procure licence-free recordings for ambience option B. Lead answered (see chat / HISTORY).
74. (msg 114) AMBIENCE: test option D (thin recorded bed + sounds from what is on screen). Wants an artifact that simulates it before it goes into the game.
75. (msg 115) MAIL: the mail basket inside the home ("writing basket", lead's reading: the Mail basket by the door) makes no sense. Starting apartments get a LOBBY with apartment MAILBOXES; houses get a CURB MAILBOX. Mail is collected there.
76. (msg 116) SOUND TEST: the recordings work; the generated sounds do not, mainly because of the white noise in them. NO WHITE NOISE LAYER ANYWHERE. Wants: a little putter for cars, footsteps, etc.; the recording as background with a LONGER loop and MORE VARIETY. Show again.
77. (msg 117) SOUND TEST: take the footsteps out and show the soundscape again.
78. (msg 118) AMBIENCE DECISION: recordings only (no generated city sounds). Longer samples, with clever editing and remixing so no loop is heard.
79. (msg 119) ORDER: the recorded ambience goes into the game BEFORE the 17 new jobs.
80. (msg 120) HOLD the additional jobs (J4: vet assistant, software developer + 15 more). Do not start them until the owner says. Asked for the list again.
81. (msg 121) "Continue."
82. (msg 122) Asked about the other source for recordings the lead had mentioned (Internet Archive / Freesound).
83. (msg 123) ALL 16 recordings on the audition page are APPROVED for the city sound.
84. (msg 124) Asked for a status on all work; lead answered in chat (Stage 62 current; running: ambience, performance, QA round 12; jobs J4 on hold).
85. (msg 125) (a) Going through the LOBBY to leave/enter the flat: KEEP (he likes it). (b) INDOOR sounds (room tones) were OK: keep them; the "no white noise" rule is about the OUTDOOR city bed. (c) Small UI sounds (phone open, cab, paying, eating): leave for now.
86. (msg 126) SOUND: keep all 19 stretches (4.8 MB).
87. (msg 127) SOUND: yes, look for rain recordings.
88. (msg 128) Asked whether the 17 added jobs would push the game over the page size limit. Lead answered: no by estimate (about 15 MB of 16), but little room after.
89. (msg 129) Jobs (J4) stay ON HOLD. Tell him when the rain sound is in the game.
