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

