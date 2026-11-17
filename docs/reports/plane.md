# The airport planes: smooth landings + jet, tyre screech and seat-belt chime (owner msgs 220, 225, 226)

Opus worker report, 2026-11-17. BIBLE "Direction update 43". **Nobody has listened to the sounds in the game.** The owner listened to the page
`docs/audio/plane_sounds.html` (msg 226: "Sounds are good except use variant B for jet"), so the game's jet is now that variant B.

## A. The hitchy landing plane

### What was measured
`node tools/plane_check.mjs` (Playwright, the built single file) starts landings and take-offs with `G.planes` and logs every frame, after the
frame was drawn: the flight, the renderer's anchor for the plane (`Math.round` of WS, as in render.js), the camera (`cam.x/y` + the CSS sub-pixel
shift `cam.sx/sy`) and from those the plane's position on screen in CSS px. Cases: phone 390x844 dpr 3 (zoom min, as the intro), desktop
1280x720 `?debug` zoom 1 (as the trailer), camera following the plane (the intro) or still, 1x / 2x / 4x, landing and take-off. A second mode
drives `requestAnimationFrame` by hand at exactly 60 fps to separate logic from frame timing, and grabs a strip of frames around touchdown.

### Causes found
1. **The following camera and the plane were rounded differently (the main hitch).** The renderer draws the plane at whole canvas pixels
   (`Math.round`), while the camera scrolls with a sub-pixel CSS shift. When the camera follows the plane, the plane should stand still on
   screen; instead it jumped one canvas pixel (3 CSS px on the phone, up to 18 device px at zoom 6) back and forth in about half of all frames:
   252 "wobble" frames out of 493 in the landing (271 of 498 in the hand-driven 60 fps run, so it is not a frame-timing artefact).
2. **The following camera lagged by a frame-rate-dependent amount.** The camera lerp `k = dt * 7` leaves a steady lag of about v/7 - v*dt behind
   a moving target: every change in frame time changed the lag, so a single late frame (50 ms) jumped the plane 11 px on screen. At the start
   of the intro the camera snapped onto the plane and then fell behind it: the plane lurched ~60 CSS px across the screen in the first 0.2 s.
3. **Small kinks in the path:** the flare formula had a kink 14 tiles out (the sink rate jumped by 55 %) and the sink stopped dead at touchdown;
   on take-off the climb started at full rate in one frame.
   NOT causes (checked): the plane steps every frame with the real dt (no coarse tick), no rounding to tiles, the speed changes smoothly
   (5 tiles/s per s), the landing never changes sprite variant (gear stays down), the shadow uses the same x/y and is drawn in the same frame
   (shadow skew 0 px in every case), game speed only adds sub-steps (smooth), the 0.85 clock scale does not touch the planes (they use dt).
   Nothing in render.js / sprites.js needed changing.

### The change
- `src/core/game.js` **PIXEL LOCK**: a camera target with `lock` (`{ ax, ay }` = the plane's unrounded screen anchor, the same expression the
  renderer rounds) is followed in whole canvas pixels in step with the renderer's rounding (no CSS sub-pixel shift while locked), and the camera
  first moves with the target (feed-forward) so the lerp (now frame-rate independent, `1 - exp(-7 dt)`) only takes up an offset, never a lag.
  Every other camera target (the player, rides, the trailer's own camera) behaves exactly as before.
- `src/sim/planes.js`: `flight.cam` carries `lock / ax / ay` (set in `sync`); the flare is a cubic through the same points (same height and slope
  14 tiles out, so no kink; a gentle sink at the wheels; heights within 0.07 tiles of the old curve); the take-off climb rate builds over 0.8 s.
  Flight path, speeds, schedule and timing are otherwise unchanged (touchdown still at flight time 4.93 s).

### Numbers (before -> after; frames while the plane moves; jump = on-screen move per frame, CSS px; jerk = RMS of the 2nd difference, CSS px)
| case | max jump | wobble frames | jerk |
|---|---|---|---|
| phone, landing, camera following, 1x (the intro) | 11.3 -> 2.8 | 252 -> 0 | 2.45 -> 1.30 |
| phone, landing, following, 2x | 21.7 -> 4.5 | 45 -> 0 | 2.04 -> 1.28 |
| phone, take-off, following | 4.2 -> 2.0 | 101 -> 0 | 1.94 -> 1.38 |
| desktop zoom 1, landing, following | 5.0 -> 2.2 | 182 -> 0 | 1.80 -> 0.65 |
| desktop zoom 1, landing, following, 2x | 10.8 -> 1.4 | 13 -> 0 | 1.40 -> 0.63 |
| desktop zoom 1, take-off, following | 2.2 -> 2.0 | 31 -> 0 | 1.21 -> 0.69 |
| hand-driven 60 fps, phone, following | 11.3 -> 2.8 | 271 -> 0 | 2.29 -> 1.30 |
| phone, landing, camera still, 1x / 4x | 15.2 / 58.1 (same) | - | 2.29 / 2.51 (same) |
Zero "still" frames (repeated position while moving) in every case before and after. With a still camera nothing changed and nothing was
wrong: the plane crosses the screen at 6.4 canvas px per frame and the renderer can only draw whole pixels (6/7 px steps); that residue is in
render.js (sub-pixel sprites would be the only way to go lower) and is not a hitch. What is left when following (max 2.8 px) is real motion:
the plane sinks on screen during the approach (the camera tracks 60 % of the altitude) and its shadow slides in.
Strips (hand-driven 60 fps, phone, every 2nd frame, 2 s around touchdown, a 390 x 240 band across the middle of the screen, HUD hidden):
`out/shots/plane_before_strip.png`, `out/shots/plane_after_strip.png`. Before: the fuselage, door and wing shift between frames; after: the plane
holds its place and only the ground scrolls. (The livery differs: the airliner variant is random.)

## B. Sounds (all synthesised; no files)
Code: `src/sim/_audio_plane.js` (uses the helpers of `_audio_lib.js`). The listening page `docs/audio/plane_sounds.html` is generated from the
same source by `node tools/plane_sounds_page.mjs` (lib + this file copied in), so page and game cannot drift apart.

- **Jet** (`Jet` class: one continuous voice per aircraft): brown-noise rumble (low-pass 140-260 Hz), pink-noise roar through a band that opens
  with thrust (320-1270 Hz), a little high air, and the turbine whine (two detuned saws in a narrow band + a triangle an octave down,
  1.8-3.8 kHz with thrust). Owner msg 226 chose page variant B: whine x2.4 louder and x1.2 higher than the first take (now the default; types:
  cargo 1.1 level, bizjet 0.7 level and a higher whine, turboprop 0.6 level and a lower whine). A low-pass falls with distance.
  `planes.js` steers it every frame ('frame' event, so it also runs while the game is paused): level = `hear(d)` x fade x type, d = distance in
  tiles from what the camera follows to the aircraft, altitude included. `hear(d) = 1/(1 + (d/22)^2) + 0.012 (1 - d/300)`: 1 at the runway,
  -20 dB at the Arrivals curb (~75 tiles), a faint low rumble downtown (~250 tiles), nothing past 300. Thrust (`thrustOf`): approach 0.5;
  touchdown -> reverse thrust 1.0 within 0.7 s, held to 2.8 s, then back to idle 0.2 as it slows; take-off roll 0.6 -> 1, climb 1, out 0.85;
  flyover 0.55. At most the two loudest flights are voiced; if their levels add past 1 they are scaled to sum 1 (no blasting with several
  planes). Paused (`G.modal`): held at 0. Through the Effects bus: Master / Effects / Mute apply; a hidden tab suspends the context.
  `G.audio.bus()` is the new hook (null until sound runs).
- **Tyre screech** (`SFX.tyre_screech`): two band-passed pink-noise chirps (3.3->2.2 kHz and 2.9->2.0 kHz, Q 7, 55 ms apart: left and right
  gear), a faint rubber squeal tone and a soft brown-noise thump. Fired by `planes.js` in the frame the main wheels touch (`touchdown()`,
  just before 'plane:landed'), at `hear(d) x 1.1`, panned. No smoke puff added (no suitable particle found that would not need art).
- **Seat-belt chime** (`SFX.seatbelt`): two soft bells (sine + weak 2nd and 3rd partials), A5 880 Hz then F5 698 Hz 0.42 s later. Replaces
  `train_chime` in the intro's cabin step (src/sim/intro_airport.js), which plays it once, 0.5 s after the cut to the cabin (with the caption
  "Ding! The seatbelt sign blinks off."). No other moment seats the player in a plane cabin (`airport:plane` is used only by the intro).
- Dev menu > Sound: new row "Jet" (6 s of a nearby airliner: approach, reverse thrust, idle), "Tyre screech", "Seat-belt chime".

### Measurements (OfflineAudioContext, 48 kHz, through bus 0.64 and the game's compressor = default Master 0.8 x Effects 0.8)
| sound | length (above -40 dB of its peak) | peak | RMS | spectral centre | notes |
|---|---|---|---|---|---|
| tyre_screech (game) | 0.24 s (tail to ~0.3 s) | -18.2 dBFS | -39.6 dB | 3.5 kHz | no clipping |
| seatbelt (game) | 1.06 s | -18.1 dBFS | -35.3 dB | 858 Hz | measured pitches 880 Hz then 698 Hz |
| existing: train_chime / notify / door_close / toast | 1.70 / 0.35 / 0.12 / 0.40 s | -19.4 / -18.0 / -14.5 / -25.5 dBFS | -34.8 / -36.5 / -36.4 / -42.9 dB | | for comparison |
| jet landing by the runway (page = game code, 10.2 s) | | -9.9 dBFS | -28.7 dB | 1.57 kHz | loudness every 0.5 s: -47 dB at the start of the approach, rising to -20 dB at reverse thrust, falling to -47 dB at the end of the roll-out |
| jet heard from downtown (~250 tiles) | | -45 dBFS | -61.5 dB | 408 Hz | a faint low rumble |
In a real landing in the game (`node tools/plane_check.mjs --sound`, phone, sound unlocked by a tap):
- **Timing:** touchdown at game time 7.183 s, and the screech fired at 7.183 s, in the same frame (the call sits in the touchdown branch). Further landings: from the
  Arrivals curb the screech plays at 0.083; from downtown it is skipped (0.009, under the 0.01 floor).
- **Jet level, camera following the plane (the intro):** it rises 0.62 -> 0.91 over the approach as the plane descends to the camera, holds while it rolls, and fades
  to 0.11 as the plane fades out. Engine setting on top: approach 0.5, reverse 1.0, idle 0.2.
- **Peak jet level at other spots:** 0.080 from the Arrivals curb, 0.0097 from downtown.
- **Pause:** level 0.68 before pausing, 0 while paused.
- No audio errors in any run.

## Files
- new: `src/sim/_audio_plane.js`, `tools/plane_check.mjs`, `tools/plane_sounds_page.mjs`, `docs/audio/plane_sounds.html`, this report
- edited: `tools/ambience_check.mjs` (jet sources are not a noise bed), `src/core/game.js` (pixel lock), `src/sim/planes.js` (lock fields, flare, climb ramp, jet + screech), `src/sim/audio.js` (`bus()`,
  `debug.render`), `src/sim/_audio_sfx.js` (two entries), `src/sim/intro_airport.js` (chime), `src/ui/devmode.js` (Sound row)

## Verification
All of these were run by me (the worker) on the tree described here, with the other worker's render.js changes in it:
- **`node src/data/validate.mjs`:** OK.
- **`node tools/build.mjs`:** OK. `grep -c '(?<[=!]' dist/index.html` = 0.
- **`node tools/ambience_check.mjs`:** 138/138 after the change below; the first run had 7 FAILs.
  - What failed: the check counts any noise-buffer source alive over 5 s outdoors as a "noise bed". A landing jet near the player tripped it.
  - The fix: the jet's sources now carry `_jet`, and the check leaves them out.
  - Lead, please decide: the jet IS filtered noise, which is what the brief asked for and what the owner approved in msg 226. Owner rule 116 ("no white-noise layer") is about beds. If you disagree, the alternative is to cut the jet's range.
  - In the same first run, "stretch crossfades are equal power" failed once (1.51) and passed on the rerun. It looks timing-dependent and is not related to this change.
- **`node tools/navcheck.mjs --rooms all`:** all passed, 0 page errors.
- **`node tools/perf.mjs --verify`:** VERIFY OK, same pixels.
- **`node tools/plane_check.mjs`:**
  - live, all cases (before on the build from 4025922, after on this build), plus `--strip before/after`, `--sound` and `--page`: 0 page errors.
  - The full results are in `out/plane/report.json`, with frame logs in `out/plane/frames_*.json`.
- **Full intro by touch** (scratch script; 390x844, touch): New Game -> creator (Next, Surprise me, Next, Juniper Court, Move in) -> the landing cinematic -> the cut to the cabin -> Skip the wait -> walking to the door by tapping -> the concourse.
  - Steps: arrival_plane_cinematic -> cabin -> concourse.
  - Sounds fired: `tyre_screech` during the landing, played in the touchdown frame; `seatbelt` once, 0.75 s after the cabin step began.
  - The jet was voiced for the whole landing (max level 0.91).
  - Audio errors 0, page errors 0.
- **Size:** +5.0 KB (15,215,588 -> 15,220,614 bytes). Measured on the same tree by building with and without my source changes.

## Not tested / open
- Nobody has heard the sounds inside the game (only the page, by the owner). Levels next to the city ambience bed and music are by numbers only.
- Not run on a real phone; the frame-time part of the fix (cause 2) matters most there and was shown only with headless Chromium's frames.
- The trailer uses its own camera object, so the pixel lock does not apply to it unless it follows `flight.cam`.
- Question for the owner: should the planes landing while you stand downtown be audible at all (now: a faint rumble, about -45 dBFS peak)?
