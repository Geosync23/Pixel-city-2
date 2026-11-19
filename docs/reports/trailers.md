# Trailers (Fable worker, 2026-11-16): storyboards + ROUGH CUTS; owner msgs 169-170, 203-204; BIBLE 36 / 40 / 42

Files: docs/trailer/trailer_a_rough.mp4 (A "The City Wakes Up", 45.0 s, 1280x720, 30 fps, H.264 + AAC, 11.23 MB), trailer_b_rough.mp4 (B doors + week mix, 10.83 MB),
storyboard_a.md / storyboard_b.md (shot lists generated from the edit list), trailers.html (lead's artifact page: https://claude.ai/artifact/3ugMHKYMhkK8mjqwCNHhLd, published with the two
MP4s as files), player.html (worker's local page), out/shots/trailer_a_sheet.png / trailer_b_sheet.png (one frame per shot).
Tools: tools/trailer/ (lib, shots, rooms, shoot, music, overlay, edl, assemble, storyboard + scouting helpers). Re-make: `node tools/trailer/shoot.mjs <shot ids>` (or rooms.mjs <room ids>),
edit edl.mjs, then `node tools/trailer/overlay.mjs a|b && node tools/trailer/assemble.mjs a|b && node tools/trailer/storyboard.mjs`. Raw frames live ONLY in the scratchpad
(scratchpad/trailer/frames/); if cleared, every shot must be re-recorded (~25 min). Footage comes from the lead's clean Stage 99 build (scratchpad/trailer/stage99_index.html).

BUILDING COUNT (counted in the running Stage 99 build from the city's door pois): 190 street doors, each to a different room (+ the airport terminal = 191, so "over 190" is thin; "190" or
"over 180" are the safe wordings). Hand-made, specialised interiors: 94 of them (26 homes, 10 brand clothing stores, 13 home-goods stores, 5 post offices, 40 venues and showpieces); 53 are
converted public places from 12 room templates, 43 generated lobbies. About 290 rooms in total counting floors, wings, bathrooms, platforms.

Real vs staged: every picture is the game rendering itself. Staged through window.G: free camera with the player hidden (wide zoom needs ?debug), HUD hidden by CSS, weather forced clear
(rain shot excepted), two time-lapse shots, plane via G.planes.landNow, suitcase pick-up staged with the intro's pieces (not the intro itself), two separate cab rides, no door-opening
animation exists in the game (B uses a gold two-leaf wipe graphic; street sides of doors are not shown), job via G.jobs.debugStart, mini-games in practice mode clicked every 0.4 s, date via
G.rel.debug.fire, festival via G.cityEvents.debug; B's counter is a graphic climbing 1 -> 190 over 40 interiors, not a true running count.

Music: 'Classic: Indoors' (104 bpm) rendered offline with the game's own code: 2 intro bars, the 8-bar loop twice, a tonic chord at 41.64 s fading to 45 s; A starts pad-only and brings
drums in at bar 7; -14 LUFS. NOBODY HAS LISTENED TO IT (measured only). The worker watched one frame per second of both files, never in motion.

Known weak shots. A: plane shot shows the map edge haze; cab downtown has dithered see-through towers; the player with the suitcase is hard to pick out at the kerb; the title sits over the
lighthouse for 4.4 s; the player's part is ~11.5 s (a quarter, not a third). B: rainy evening has no visible player; the date does not read as a date; gym / cooking sheets small and dark;
job small; home shot is daytime at a kitchen table; 24 interiors at 0.29 s each with the player still on the doormat; the wipe may flicker; the count caption covers the aquarium tank;
MON-SUN tags are the worker's addition. Both: 720p near the 12 MB cap; no maple leaf in the title; same end-card backdrop.

Polish suggestions: re-stage B's activity scenes closer; decide whether mini-game panels belong; a cab route without dithered towers or a free follow camera; start the plane camera further
inside the map; record interiors with the player two steps in; title leaf + different end cards; a listening pass on the ending chord and A's quiet first bar; optional line "over 190
buildings to walk into, 90 of them one of a kind".

LEAD looked at both contact sheets at full size (shot order and captions match the brief); has NOT watched the videos in motion or heard the audio. WAITING FOR THE OWNER'S FEEDBACK on the
rough cuts; then resume the worker (adda1a00a80c38d29) for the polish pass.

## Owner decisions for the polish pass (msgs 206-207)
- Finish TRAILER 2 (B) only. First the occlusion fix (buses vs trees, trains passing) is published; then re-record the SAME shots on the fixed build; then polish.
- Count caption: 'nearly 200 enterable buildings' (not 'over 190 buildings to walk into'); the counter may still climb to 190.
- Keep the MON-SUN tags. Shot order and everything else stay as they are.
- Lead's call on weak shots: re-stage the rainy evening (player visible, under lamps) and the date (companion in frame); tighten gym / cooking / home framing only if cheap; fix the items on the worker's own polish list that do not change the cut (title leaf, wipe flicker, caption not covering the aquarium tank, interiors with the player two steps in).

## Trailer B polished (2026-11-16, same worker; published version id 1794850747-1132 at https://claude.ai/artifact/3ugMHKYMhkK8mjqwCNHhLd)
- docs/trailer/trailer_b.mp4: 45.0 s, 1280x720, 30 fps, H.264 + AAC, 11.05 MB; every shot re-recorded on the Stage 104 build (scratchpad/trailer/stage104_index.html), same shot list / order / beat timing. trailer_b_rough.mp4 kept for comparison; Trailer A set aside.
- FOUND: in the rough cut most interiors were FROZEN STILLS (a stuck G.modal count paused the game after the first room of each batch); all 41 interior clips now move and start with the player a couple of steps inside.
- Differences from the rough cut: caption 'nearly 200 enterable buildings' at the bottom (tank clear; counter label 'enterable buildings', still climbs to 190); MON-SUN tags kept, a little larger; rainy evening re-staged (player crossing the lamplit plaza at zoom 4); date re-staged (player + Tasha side by side at the River Walk rail); cab shot = a later moment of the same ride (no see-through tower); door wipe 2-3 frames, slightly see-through; aquarium hold at real speed; home = a slow drift to the fireplace; pans re-aimed to whole pixels per frame; maple leaf on the end title; captions slightly larger; audio -1 dB.
- The owner's two faults: bus vs trees 5.87-7.02 s (no popping in any frame), trains 7.02-8.18 s (a second train passes; no cars cutting into each other or the deck).
- Music by measurement only: no clipping, tail fades to -91 dB at 45.0 s, first bar level like the body, final chord ~5 dB louder than the body (nobody has HEARD it).
- Worker looked at: one frame per second; every frame of five 3-second stretches; a duplicate-frame scan (five single repeats at 18.7-19.3 s in the job shot). LEAD looked at eight frames (1.0, 6.4, 7.6, 22.6, 23.8, 35.5, 38.0, 43.5 s: out/shots/trailer_b_lead.png): captions, rain, date pair, aquarium caption, end title with leaf all as described. Nobody has watched it in motion or heard it.
- Remaining weak spots: gym / cooking / job framing unchanged (small panels; player beside the treadmill); date text sheet unreadable at phone size; lighthouse is dusk not sunset; half-beat doors fast; plane shot's map-edge haze; 11.05 MB of 12.
- docs/trailer/REPORT.md does not exist (this file is the report); storyboard_a.md still refers to it.

## Trailer B revision 2 (owner msg 211; published version id 1794855009-897d)
- docs/trailer/trailer_b.mp4 = new cut (45.0 s, 11.06 MB, Stage 104 build); previous polished cut kept as trailer_b_v1.mp4.
- Opening 0.00-4.72 s (two bars): close downtown street corner (Hollowell & Sons, Nest & Wire, bus shelter, cab, airport bus, pedestrians), slow pan, dimmed 28 %, title 'MAPLE BAY' + leaf from 0.4 s and 'an open-world life sim' from ~0.85 s, held to 4.57 s. Plane 4.72-7.02 s with '1 city'. The foot / bus / train / cab run is now ONE bar (7.02-9.33 s, 0.58 s each) under 'fully explorable' ('4 ways to get around' removed). End card also carries 'an open-world life sim'. From 9.33 s on unchanged.
- Worker looked at every frame of 0-4.75 s and 7.0-9.4 s, the 98 raw frames of the bus passing the tree in the opening (no popping), end card at 43.5 s. LEAD looked at six frames (0.3, 2.0, 5.5, 7.3, 8.5, 43.5 s: out/shots/trailer_b_lead2.png). Nobody has watched it in motion or heard it.
- Weak spots: the word MAPLE sits across the Nest & Wire sign lettering; the opening is busy rather than packed (10-15 people); the four transport shots are glimpses at 0.58 s each.

## Trailer B round 3 (owner msg 212; published version id 1794857754-51df)
- docs/trailer/trailer_b.mp4 = 54.2 s, 12.43 MB (Stage 104 build); previous cut = trailer_b_v2.mp4.
- 'your life, your pace' now 18.85-23.03 s over MON-THU; doors + counter unchanged; NEW 37.02-41.64 s four job close-ups (barista, station agent, prep cook, firefighter; 1.15 s each) under '25 jobs to work'; NEW 41.64-46.25 s four activity close-ups (treadmill, dance floor, river rail 'fishing', easel) under 'over 90 things to do'; 46.25-48.56 home by the fire + 48.56-50.87 NEW harbour boardwalk in evening light (replaces the lighthouse) under 'so much to see'; end card unchanged 50.87-54.23 s. Music: four more bars rendered in one pass (no splice), same final chord.
- COUNTS: 25 jobs = distinct ids from G.jobs.listings() (not checked that all are equally complete); 'over 90 things to do' = 91 activity definitions in src/data/activities.js (includes small ones: wash hands, check phone, toilet: generous; stricter alternative 'over 40 mini-games' from 46 G.skillplay.games()).
- Close-ups are recorded at zoom 4 and enlarged 2x (closer than a player can zoom). In-world yellow station arrows visible in job shots.
- LEAD looked at twelve frames (out/shots/trailer_b_lead3.png): all sections as described; NOTE the digit 5 in '25 jobs to work' can read like an S at small size (the game font's known weak digit). Nobody has watched it in motion or heard it.
- Weak spots: close-ups are glimpses; barista partly covered by customers; fishing shows no rod; painting on a bare floor; pace caption crosses the gym's TODAY board.

## Trailer B round 4 (owner msg 213; published version id 1794860537-3e2b)
- trailer_b.mp4 = 61.2 s, 13.31 MB; previous = trailer_b_v3.mp4. The four 'fully explorable' shots hold one bar each: on foot 7.02-9.33 (re-recorded longer, City Hall plaza), bus 9.33-11.64, train 11.64-13.95 (second train passing), cab 13.95-16.25; caption on 7.02-15.45 s. Everything after is v3 shifted three bars; music +3 bars at the end in one render (layer changes now fall three bars earlier relative to the picture). Video cap 1.65 Mbit/s.
- LEAD looked at six frames (out/shots/trailer_b_lead4.png): walk, bus, train fine; CAB shows only as a see-through outline under the viaduct in the last second of its hold: worker resumed to re-shoot the cab on a clear route (will deliver as trailer_b.mp4 with this cut kept as trailer_b_v4.mp4).

## Trailer B round 5: cab re-shoot (lead's call)
- trailer_b.mp4 (61.2 s, 13.31 MB): cab shot 13.95-16.25 s is now a real cab ride along the brick river road in Old Town (no viaduct, no tower; the game's 'fade things in front of your cab' effect was switched off for the recording, so trees / lamps stay solid). Previous cut = trailer_b_v4.mp4. Worker checked all 69 frames; lead looked at three (out/shots/trailer_b_lead5.png): cab clear throughout. Quiet street (4-5 pedestrians). This is the CURRENT FINAL unless the owner asks for more.

## Trailer B round 6: real rush-hour density (owner msgs 214-215; published version id 1794867386-89fd) = CURRENT FINAL
- docs/trailer/trailer_b.mp4 (61.2 s, 13.96 MB) = docs/trailer/Maple_Bay_Trailer.mp4 (the downloadable copy sent to the owner). Previous cut = trailer_b_v5.mp4.
- What 'busy' is in the game (tools/trailer/density.mjs): pedestrians are a pool of at most 70 around the camera, full from ~08:00 to 20:00 (18-38 in view at a fixed camera, no pattern by hour); traffic peaks 07:00-09:30 and 16:00-19:00 (~60 % at midday); a camera MOVING with a cab or train outruns the crowd, which is why the cab shot was empty.
- Per shot (people / moving vehicles in view; 'before' re-measured with the old settings): opening corner 22 / 1.2 -> 29.5 / 1.5 REPLACED (weekday ~17:20); on foot 39 / 1.1 kept (rush takes 23-27); bus 32 / 1.7 kept; train 5.7 / 0.6 kept (honestly quiet at street level: camera follows the train); CAB 0.9 / 0.65 -> ~32 / 3.8 REPLACED (same Old Town river road, weekday ~17:10, camera waits on the street ~1 min then drifts as the cab passes; a van, a purple van, two oncoming cars); boardwalk 47 / 1.1 kept.
- Nothing added: no caps raised, nothing spawned, no event forced. The see-through effect for things in front of the ridden cab is still switched off in the cab shot. The cab is partly overlapped by the van and a lamp post for ~0.3 s.
- LEAD looked at six frames (out/shots/trailer_b_lead6.png): opening + title, four frames across the cab shot: clearly busier, cab visible throughout.
- POSSIBLE GAME BUG to check: the worker's Saturday measurements FROZE from 10:00 when the Blossom Festival starts ('the world froze in my measurements from then on'): unknown whether that is its harness (a festival card / modal pausing the game) or a real freeze. LEAD TODO.
- CHECKED by the lead (clean build of the current tree, out/shots/s112_fest.png): on the first Saturday the clock runs straight through 10:00 (09:50 -> 10:24 over ~40 real seconds), no modal, no pause, zero page errors. The 'freeze' in the worker's Saturday measurements was its own harness, not the game.

## Trailer B round 7 (owner msg 216) = CURRENT FINAL
- trailer_b.mp4 = Maple_Bay_Trailer.mp4 (61.2 s, 13.32 MB); previous = trailer_b_v6.mp4.
- Montage = 40 different buildings, aquarium only as the closing hold. Run 1: restaurant, Hollowell & Sons, playhouse, lighthouse lantern room, main post office, City Hall, natatorium pool, museum, observatory, SkyDeck, clinic, bank, fish market, conservatory, Nightjar, bookstore. Run 2: bakery, Juniper & Rye, public library, school classroom, ramen, department store, arena bowl, Second Wind, hotel lobby, Timber, pizza, university, Tidepool, Gazette newsroom, office, concert hall, Sole, Beacon penthouse, radio studio, Brim, cinema, grocery, Lumen, Little Lantern.
- Replaced: aquarium -> playhouse; aquarium deep -> school classroom; diner -> restaurant; cafe -> bank; station platforms -> main post office; station hall -> Lumen; lighthouse ground floor dropped (lantern room moved to run 1) -> Little Lantern in its run-2 slot; Villa Belvedere -> clinic; bar -> department store; gym -> Timber; fire station -> Gazette newsroom; university library -> office. Eight clothing shops remain (different buildings).
- 'a new city' on the plane shot. Walk direction: SkyDeck (the owner's screenshot), lighthouse lantern, natatorium pool, observatory re-recorded; the other clips passed a logged check (moves away from the door, still moving at the clip's end).
- LEAD looked at twelve frames (out/shots/trailer_b_lead7.png): caption, eleven montage rooms incl. SkyDeck at 29 and the closing aquarium: all different places. Not watched in motion.
- Weak: Timber's empty grey floor; Lumen dark; lantern room mostly sea.

## Trailer B round 8 (owner msg 217; published version id 1794879837-6b5a)
- 77.3 s. trailer_b.mp4 (web, ~13.5 MB) + Maple_Bay_Trailer.mp4 (download, ~28 MB); previous = trailer_b_v7.mp4. Shot defs: tools/trailer/shots_r8.mjs.
- Order: opening + title (0-4.72) | plane 'a new city' | walk / bus / train / cab 'fully explorable' (7.02-16.25) | 16 doors (platforms back) | week MON-SUN with THU = Old Town market square (33 people in view) | NEW 34.72-53.18: 'work' + '25 jobs to work' (prep cook, firefighter, airport ramp hand, barbershop) / 'make friends' (talk panel with Nora in the park; date with Haru on the pier) / 'shop and decorate' (Nest & Wire shop window; design mode dragging a lamp) / 'explore' (train interior; walk across the university green) | 24 fast doors | aquarium 'nearly 200 enterable buildings' | 'over 100 activities' (dance floor, community garden, painting, swings) | 'so much to see' (park lake NEW, boardwalk) | home 'your life, your pace' | end card.
- Deviations: Timber removed from the montage (platforms took the post office's slot, post office took Timber's); 'make friends' has two shots; barista / treadmill / river-rail close-ups replaced (airport ramp hand, community garden, swings) to clear repeats. Remaining near-repeats: station platforms vs the train exterior; university hall vs green; Nest & Wire exterior vs interior; the park twice; airport runway vs terminal.
- LEAD looked at twelve frames (out/shots/trailer_b_lead8.png). FLAWS found and sent back (worker resumed): design mode shows the dev money '$999,999' and its tray fills the lower 40 %; the shop shot is a menu over a dark room; the talk panel covers the people; Timber to be restored (41 doors). Not watched in motion or heard.

## Trailer B round 9 (lead's fix list + owner msg 218) = CURRENT CUT
- 77.3 s; trailer_b.mp4 (web 13.0 MB) + Maple_Bay_Trailer.mp4 (download 27 MB); previous = trailer_b_v8.mp4.
- '30 jobs' (36.9-39.2 s); seesaw close-up 65.9-67.0 s re-shot on a build with the playground fix (only shot not from Stage 104); decorate 46.3-48.6 s: design-mode bars hidden by CSS, love seat carried across the room then the lamp; shop 44.0-46.3 s: inside Saltline Outfitters, walk to the coat rack, the rack sheet opens for the last half second; friends 1: close on the player + Nora on a park path with the small dialogue box; friends 2: pier date wider with the Bay Wheel and ~13 people, text sheet hidden; Timber back as a 25th fast door (takes the first half beat of the aquarium hold).
- LEAD looked at eight frames (out/shots/trailer_b_lead10.png): all as described; no dev money. Weak: the shop caption overlaps the rack sheet for half a second; the date reads as two people on a busy pier; the chat bubble overhead is a passer-by's line; a tree hides the seesaw's far end.

## Trailer B round 10 (owner msg 219): plane zoomed in = CURRENT CUT (page version id 1794882713-0484)
- Plane shot 4.72-7.02 s recorded at zoom 2 (not upscaled), whole aircraft in frame, no map-edge haze; starts ~0.5 s later in the landing (touchdown 0.7 s into the shot); the livery came out teal 'BayJet' (random per landing; earlier take was red 'Maple Air'). Previous cut = trailer_b_v9.mp4. Lead looked at three frames (out/shots/trailer_b_lead11.png).
- OWNER (msg 228): in the trailer the landing plane is to be the RED livery (the take in round 10 came out teal); for the next re-shoot of the plane shot.


## Trailer B round 11 (owner msgs 228, 250, 255; 2026-11-18, third account): plane re-shot, RED 'Maple Air' = CURRENT CUT (page version 1794974154-4ced at https://claude.ai/artifact/9Czb8cWCD4m4ZRYmANeZiY, slug 4275c7e9-69f4-4e2d-8e0f-ab6e74a53721)
- Shot `b_plane3` (tools/trailer/shots_r8.mjs): same camera as b_plane2 (zoom 2, follows the aircraft), recorded on the Stage 120 build; livery forced by retrying G.planes.landNow('airliner') until `f.vi === 0` ('maple', red). Touchdown at frame 145, as before, so the same trim (in = touchdown/30 - .67).
- Same slot and length: frames 141-210 (4.72-7.02 s, 70 frames) with the 'a new city' caption re-rendered by overlay.mjs. Everything else is the old cut.
- HOW (raw frames of the other shots no longer exist): the new 70 frames + caption were made into a clip and laid over the old files with ffmpeg (`overlay=enable='between(t,4.699,7.001)'`), then re-encoded: Maple_Bay_Trailer.mp4 (download, 30.7 MB, crf 17, from the old download copy) and trailer_b.mp4 (web, 13.8 MB, maxrate 1300k). So all other shots are one encode generation older-looking than before (slight). Audio streams copied untouched (md5 identical for the download copy): music only, no plane sound. Previous cut = trailer_b_v10.mp4.
- To redo: TRAILER_SCRATCH=<scratch>/trailer TRAILER_BUILD=<dir with the build's index.html> node tools/trailer/shoot.mjs b_plane3; node tools/trailer/overlay.mjs b; then the two ffmpeg commands (see HISTORY 2026-11-18 / this note).
- Looked at (by me): the 6-frame strip of the take, an old-vs-new comparison of the slot, and frames 140, 141, 160, 185, 210, 211 of the WEB copy (out/shots/lead12_trailer_b.jpg): red plane through the whole slot, caption present, neighbours unchanged; 2319 frames, 77.3 s in both files; no duplicate frames in the new 70. NOT done: watched in motion, listened to, or looked at frames of the download copy (same filter, not viewed).

## Trailer B round 12 (owner msg 265; 2026-11-19): plane landing SMOOTHED = CURRENT CUT (page version 1795115423-8915, same link https://claude.ai/artifact/9Czb8cWCD4m4ZRYmANeZiY)
- CAUSE of the 'hitchy' plane: the RECORDER, not the game. The page's fake clock fires the game's frame every 16 ms; lib.mjs stepped 33.33 ms per video frame, so the game ran 2 frames most of the time and 3 frames every 8th video frame: everything moving jumped 1.5x there, and the follow camera (set one frame behind) snapped 11 px back and forth. Measured: plane step -0.768 tiles per frame, -1.152 every 8th.
- FIX: tools/trailer/lib.mjs STEP_MS = 32 (exactly 2 game frames per video frame, always; picture runs 4% slower than real time, evenly). Measured after: every step -0.768, no jumps; the ground under the plane moves 12-13 px per frame steadily.
- Re-shot `b_plane3` on the same Stage 120 build (red livery, touchdown now frame 154), slot = frames 134-203 of the take laid over frames 141-210 of the pre-round-11 files (master_old / web_old in the scratch, so no extra encode generation), same caption, same ffmpeg commands as round 11. trailer_b_v11.mp4 = the round 11 cut (jerky plane), kept for comparison on the page.
- Checked by me: per-frame ground shift of the old take (spikes every 8 frames) vs the new take (none); the 70 frames of the slot extracted from the WEB copy all differ from their neighbours; 6-frame sheet out/shots/r12_trailer_b.jpg (frames 140, 141, 160, 185, 210, 211: neighbours unchanged, red plane, caption); 2319 frames / 77.3 s in both files. NOT done: watched in motion or listened to.
- STILL TRUE: every OTHER shot in the trailer was recorded with the old uneven step (the same 1.5x jump every 8th frame, far less visible on walking people and cars than on a tracked plane). Their raw frames no longer exist: fixing them = re-shooting the whole trailer with the fixed recorder (needs the owner's word).

## Train shot 'hitchy' (owner msg 266, 2026-11-19): DIAGNOSIS ONLY, nothing changed
- Shot = `b05_train` (train leaving Central, camera follows with 0.5 easing). Probe (scratch train_probe.mjs, current build): stepping the game one game frame (16 ms) at a time the train moves EXACTLY the same distance every frame at cruise (0.3564 tiles, 206 of 210 frames; the rest are the acceleration), and its place on screen wobbles under 1 px. So the game's train data is even: positions come straight from the game clock (src/sim/rail.js trainState, placed every frame in tick()).
- With the OLD recorder step (33.33 ms) the same probe shows the trailer's defect: 12 of 100 video frames (every 8th) the train moves 1.5x (1.069 vs 0.713 tiles), jumps ~12 px ahead on screen and the easing camera takes 3-4 frames to catch up. Same cause as the plane (round 12), made more visible by the easing camera.
- So: TRAILER RECORDER, not the game. Fix = re-shoot b05_train with STEP_MS = 32 and splice (as round 12), or re-shoot the whole trailer. NOT checked: the train on a real phone (dropped frames there would show as jumps on anything this fast: ~22 tiles a second).

## Trailer B round 13 (owner msg 267; 2026-11-19): TRAIN shot re-shot = CURRENT CUT
- `b05_train` re-shot with STEP_MS = 32 on the Stage 120 build. It is a DIFFERENT train than before (the next real departure from Central at 13:09 is now the red set heading over the river toward Old Town, with a teal/yellow set passing the other way; before it was a teal/yellow set). Slot unchanged: video frames 349-417 (69 frames) = take frames 6-74, caption 'fully explorable' from overlay_b.
- Second fault found on the first re-shoot: two camera bumps where the follow camera crossed the river bank (TR.move takes the ground height under the camera). tools/trailer/shots.mjs `train()` now keeps one camera height for the whole shot. Re-shot again: no bumps.
- Both files re-made in ONE encode from the pre-round-11 files (master_old / web_old) + the plane clip (round 12) + the train clip, so still only one extra encode generation. trailer_b_v12.mp4 = round 12 cut (jerky train) kept for comparison; v10 and v11 stay in docs/trailer.
- Checked by me: mean frame-to-frame change across frames 347-419 of the WEB copy is even (15-23) with spikes only at the two scene cuts (348/349, 417/418); 10-frame sheet out/shots/r13_trailer_b.jpg (plane slot intact, bus before, cab after, caption). 2319 frames / 77.3 s both files. NOT done: watched in motion, listened to. Other shots still carry the old uneven step.
