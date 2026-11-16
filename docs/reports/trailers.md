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

