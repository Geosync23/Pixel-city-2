# City ambience from real recordings (2026-11-15, ambience worker)

Owner msgs 111-119, 123, 125; BIBLE "Direction update 24". **Nobody on the team has heard any of this.** Everything below marked "measured" is a number from a tool; how it sounds is the owner's call (listening page: `docs/audio/listen.html`).

## What exists now
- **Outdoors the city's background is real recordings only**: 19 cut stretches (924 s) of the 16 recordings the owner approved by ear (msg 123). No noise layer, no generated bed. The old noise bed stays off (`CITY_BED = false` in `src/sim/_audio_amb.js`).
- **Indoors, in the train and in vehicles nothing changed** (owner msg 125, "Indoor sounds were ok"): the old room tones, murmur, hvac, muffled rain, train rumble, engine and indoor one-shots play as before, and the recorded bed is silent there (it fades out over 2.5 s at the door and back in on the way out). Switch: `BED_INDOORS` in `src/sim/_audio_bed.js` (false). The table for "street through the wall + real crowd murmur" is written and tested but OFF.
- **Mixer** `src/sim/_audio_bed.js` (no game imports; the game, the listening page and the offline test all run this one file). Single switch `BED_ON`.
- **Delivery**: the MP3s ride at the end of `dist/index.html` as 19 inert `<script type="application/octet-stream" id="amb-NAME">` base64 blocks. The browser never parses them as code. `src/sim/audio.js` reads one block only when its stretch is first needed, unpacks it in its own task (0.9-5 ms, measured) and hands it to `decodeAudioData` (off the main thread); buffers not in use are dropped (one spare kept). Run from source (`tools/serve.mjs`) the same loader fetches `docs/audio/game/NAME.mp3`.
- **Controls**: bed level = Effects x **City sound** (new slider in Settings, default 70 %, saved in `state.audio.city`; old saves get the default). Master 0 / Mute / City sound 0 / Effects 0 stop the sources and decode nothing.
- **Tools**: `docs/audio/tools/make_library.py` (cuts the library; python3 + numpy + ffmpeg), `tools/audio_pack.mjs` (manifest module `src/data/ambience_audio.js`; `--listen` rebuilds the listening page via `tools/audio_listen.mjs`), `tools/build.mjs` (appends the blocks; `--no-audio` leaves them out), `tools/ambience_check.mjs` (the proof, below).
- **Dev**: `G.audio.debug.ambience()` (scene, tracks, stretch + position + speed per voice, level, low-pass, next change, buffers held, decode times), `G.audio.debug.menu()` (chooser: follow the game / any place x time / weather / any single recording), plus `force(place, phase, weather?, indoor?)`, `audition(name)`, `release()`, `stretches()`, `places()`, `meter()`, `kit()`.
  **Dev row for the lead** (`src/ui/devmode.js`, not edited by me): `sec('Sound'); row(act('City ambience…', () => G.audio.debug.menu()), act('What is playing', k(() => { const a = G.audio.debug.ambience(); toast((a.scene || 'nothing') + ': ' + a.tracks.map(t => t.id + ' ' + t.voices.map(v => v.name).join('+')).join(', ')); })));`

## Size
| | |
|---|---|
| MP3 in `docs/audio/game/` (19 files) | 3.68 MB |
| Added to `dist/index.html` (base64 blocks + ~14 kB of code) | **4.80 MB** (8.76 MB before -> 13.56 MB) |
| Listening page `docs/audio/listen.html` (21 scene buttons + the 19 recordings one by one; outdoor scenes only, since indoors is unchanged) | 4.94 MB |

That is over the "about 4 MB" aim and under the 6 MB ceiling. The codec numbers below say 24 kHz VBR ~31 kbit/s is the floor for this material (at 24 kbit/s 10-22 % of the time-frequency cells above 1 kHz drop out); so the only honest way to 4 MB is less material (drop ~170 s: e.g. `busy_b`, `night_air`, `airport_c`, `resid_b` = 0.86 MB). I kept them: the owner asked for long stretches and variety. Say the word and they go (one line each in `make_library.py`, then `node tools/audio_pack.mjs`).

## The library (measured; made by `make_library.py`)
Every stretch: mono, 24 kHz MP3 (MPEG-2 Layer III, LAME VBR -V8), high-pass 80 Hz, low-pass where the source has only hiss above, slow level riding (halves the long swings, at most +-6 dB), loudness -23 LUFS measured after a 150 Hz high-pass ("phone" column: what a phone speaker gives back) and never above -20 LUFS full band, peak limited to -3 dBFS, a seamless cycle closed with a 3-5 s equal-power crossfade, written with 0.3 s of pre- and post-roll so the loop point is safe whatever padding a decoder keeps.

| stretch | source | source seconds | cycle s | file | LUFS phone / full | loudness range after <- before (LU) | peak dBFS | what was cut, and why |
|---|---|---|---|---|---|---|---|---|
| busy_a | G16_17_Busy_Downtown_City_Traffic | 14-68 | 50.0 | 184 kB, 29 kbit/s | -23.0 / -22.9 | 5.5 <- 9.9 | -4.9 | first 14 s (slate burst at 0-2 s, a 30 dB hole and a click to 8 s); last 37 s (the same horn figure returns twice more) |
| busy_b | G16_19_Medium_Perspective_City_Traffic | 6-55 | 45.0 | 162 kB, 28 | -23.0 / -22.0 | 5.0 <- 8.6 | -6.5 | first 6 s (slate burst); last 31 s (size; it ends in a loud burst, crest 18) |
| busy_c | L_streetA | 1-55 | 50.0 | 205 kB, 32 | -23.0 / -20.9 | 6.1 <- 11.3 | -3.5 | last 23 s (squeals / calls in the foreground at 60-72 s, speech-proxy 0.6 vs 0.1; the old loop seam) |
| busy_d | L_streetB | 2-56 | 50.0 | 209 kB, 33 | -23.0 / -20.9 | 3.6 <- 6.1 | -3.4 | last 34 s (the quiet tail, old loop seam, a click at the end) |
| light_a | AMBTraf_Light_traffic_on_Sunset_Blvd | 1-56 | 50.0 | 185 kB, 29 | -23.0 / -22.3 | 4.7 <- 9.0 | -3.8 | hiss bursts above 10 kHz (low-pass 7 kHz); last 26 s (a 10 dB quiet patch) |
| light_b | AMBTraf_Light_traffic_with_a_few_streetcars_voices | 1-49 | 45.0 | 173 kB, 30 | -23.0 / -22.1 | 4.6 <- 7.9 | -6.2 | everything after 0:49: voices in the foreground at 0:50-1:20 (speech-proxy up to 0.49; harmonic stacks in the spectrogram) |
| light_c | G18_09_Trolley_on_Street | 3-63 | 56.0 | 214 kB, 30 | -23.0 / -22.4 | 6.8 <- 12.2 | -4.4 | first 3 s (slate burst); last 3 s. The trolley bell at ~0:20 is kept |
| resid_a | CarsAndBirdsong | 2-21.5 + 30.5-64 | 47.5 | 192 kB, 32 | -23.0 / -22.2 | 2.4 <- 4.5 | -6.8 | first 2 s (silence + click, crest 45); 21.5-30.5 s (the recording drops 18 dB to near silence); the fade-out |
| resid_b | AMBTraf_Distant_traffic_rumble | 1-51 | 45.0 | 127 kB, 22 | -24.8 / -20.0 | 4.9 <- 8.6 | -4.3 | a thin whine near 6-7 kHz from 0:20 (low-pass 2.5 kHz; 99.9 % of its energy is below 1.3 kHz); last 16 s (size, a click) |
| park_a | meadow_6min minus its 30 s loop layer | 1-55 | 50.0 | 219 kB, 35 | -23.0 / -22.9 | 6.2 <- 10.3 | -2.9 | the 30 s wind/hiss loop (subtracted, see below); everything above 9.5 kHz (hiss; costs the highest bird calls their top) |
| park_b | same | 60.5-114.5 | 50.0 | 217 kB, 34 | -23.0 / -22.9 | 2.9 <- 3.9 | -5.0 | as park_a |
| park_c | same | 120-174 | 50.0 | 218 kB, 34 | -23.0 / -22.8 | 3.5 <- 5.3 | -4.6 | as park_a; minutes 4-6 of the source repeat 1-3 (not used) |
| harbor_a | L_beach | 0.5-32.5 | 29.0 | 128 kB, 34 | -23.0 / -22.2 | 6.5 <- 8.8 | -2.4 | nothing (the source is only 33 s) |
| gulls | L_gulls | 0.5-47.5 | 43.0 | 175 kB, 32 | -23.0 / -22.9 | 7.0 <- 11.2 | -5.2 | nothing |
| market_a | AMBPubl_Crowd_walla_at_outdoor_farmers_market | 0.5-17.6 + 20.4-66 | 57.2 | 220 kB, 30 | -23.0 / -22.8 | 4.5 <- 7.8 | -3.1 | 17.6-20.4 s (a bang: crest 22 vs 6); clicks above 8 kHz (low-pass 6 kHz); last 13 s (size) |
| crickets_a | G16_07_Crickets_Near_and_Far | 6-70 | 60.0 | 271 kB, 36 | -23.0 / -22.9 | 2.4 <- 4.2 | -5.4 | first 6 s (slate burst + hole); the second half is not used (size) |
| night_air | BackStairwellEvening | 9-41 + 45.5-63 | 44.0 | 170 kB, 30 | -23.0 / -22.7 | 1.2 <- 1.5 | -7.7 | first 9 s and 41-45.5 s (the same loud event twice); the second half (a splice at 1:20, a bang at 2:06, crest 26); a steady band at 11-16 kHz that holds most of the energy and reads as whine/hiss (low-pass 6 kHz) |
| airport_a | G16_02_Outdoor_Airport_Ambience | 3-62 | 55.0 | 219 kB, 32 | -23.0 / -21.6 | 2.6 <- 5.9 | -6.1 | first 3 s (slate burst); the second half is not used (size) |
| airport_c | G16_01_Small_Airport_Ambience | 18.5-69.5 | 47.0 | 188 kB, 32 | -23.0 / -21.9 | 4.6 <- 7.9 | -3.8 | first 18 s (slate burst, then 16 s at -12 dB) |

"speech-proxy" = 2.5-8 Hz modulation depth of the 300-3400 Hz band (syllable rhythm); "crest" = peak / RMS in a 2 s window. They are proxies: I cannot tell a voice from a squeaking brake with certainty.

**Two things found in the sources** (measured by autocorrelation): `meadow_6min.mp3` is a studio mix, not one take: a broadband wind/hiss layer repeats every 30.000 s, sample exact, 12 times, and the bird layer repeats after 180 s. The library subtracts the 30 s layer (mean of the 12 cycles; it was 5-7 dB under the total at 2-8 kHz) and uses only the first 180 s. Side effect of the subtraction: very quiet copies (about -16 dB) of bird calls from other cycles. And `G16_17` holds the same horn figure four times; the cut keeps two.

**Codec** (measured: original vs decoded, 23 bands, 46 ms frames; "holes" = share of cells above 1 kHz that come back 10 dB or more too quiet; "envelope" = lowest per-band correlation of the level curve). Tested on busy_a, park_a, crickets_a, gulls, market_a, resid_b, harbor_a:

| setting | kbit/s | bandwidth kept | holes | envelope |
|---|---|---|---|---|
| 24 kHz, CBR 16 | 16 | 3.7-5.3 kHz | 20-38 % | 0.01-0.6 |
| 24 kHz, CBR 24 | 24 | 5.3-6.4 kHz | 5-22 % | 0.0-0.8 |
| 24 kHz, CBR 32 | 32 | 7.7 kHz | 0.1-9 % | 0.09-0.97 |
| 32 kHz, CBR 40 | 40 | 7.7-12 kHz | 0-0.3 % | 0.80-0.99 |
| **24 kHz, VBR -V8 (chosen)** | 26-36 | full (to 12 kHz) | 0-3 % | 0.78-0.97 |
| 24 kHz, VBR -V9 | 25-32 | 6.4-7.7 kHz | 0.2-14 % | 0.09-0.89 |

The final 19 files (with the steeper low-pass): bandwidth kept = bandwidth of the processed source in all 19, band levels within 1.0 dB, holes 0.0-0.1 %, envelope 0.89-0.99. **24 kHz instead of 44.1 kHz loses nothing that is there**: after the low-pass the energy above 11 kHz is -52 to -88 dB under the total for 15 stretches, -36 dB for harbor_a and -24 dB for the three park stretches (their source did reach 16 kHz, mostly the hiss layer: that cut is deliberate, see the table). iPhone Safari decodes MPEG-2 Layer III MP3 through Core Audio; **not tested on a real iPhone**.

**Loop seam** (measured on the decoded MP3): the 0.4 s around loop start and loop end correlate at 0.90-1.00 for 15 stretches (0.71-0.86 for park and harbor: high-frequency texture that the codec renders differently each time); level step across the seam -2.0..+2.6 dB. Tried over 143 decoder alignments, the worst sample jump at the raw loop point was 0.8-2.7 x the 99.9th percentile of ordinary sample steps next to it, i.e. a possible faint tick in the worst case. So the mixer does not use the raw loop point: 0.12 s before it, it hands over to a fresh voice started in the pre-roll (the same material) with an 80 ms crossfade.

## The mixer (what plays where)
A scene = a few tracks; each track = a pool of stretches + its own level, low-pass and timers.
- Steady track: crossfades (equal power, 4-8 s) to **another** stretch of its pool every 40-90 s, capped so a stretch is never played past its own entry point (with 45-60 s stretches that is 33-51 s in practice); least recently played first, never the same twice running; a stretch is entered where it was left last time plus 0-6 s (first time: a random point), so a pool is used end to end before a second of it returns. A pool with ONE stretch plays 55-90 % of a pass, then crossfades to itself 20-45 % further on.
- Every entry runs 0-3 % slower or faster, never within 0.4 % of that stretch's last five plays.
- Drifting tracks fade in (5-8 s) and out (6-10 s) on their own random timers; every track's level wanders +-1.5 dB (new target every 14-30 s).
- Scene change: tracks shared by both scenes (same id + pool) keep playing and are retuned over ~2.5 s; the others crossfade out / in over 2.5 s with equal power. The outgoing tracks wait (at most 2 s) for the first incoming recording to be decoded, so there is no dip.

| place (districts) | dawn | day | evening | night |
|---|---|---|---|---|
| city (downtown) | busy -7 dB < 5 kHz, birds -6 | busy 0, trolley drifts in 18-32 s every 70-160 s at -6 | busy -3, trolley rarer | busy -13 < 1.1 kHz, crickets -9, far rumble -8 |
| town (old town, arts) | light -6, birds -5 | light 0, crowd drifts at -11 | light -3, crowd rarer | light -14 < 1.2 kHz, crickets -7, far -8 |
| suburb (maplewood, hillcrest) | birds -2, resid -8 | resid -1, birds drift at -8, far -9 | resid -4, night air -12, crickets drift | crickets -5, far -9, night air -13 |
| industrial (railyard) | busy -8, far -5 | busy -4 < 4.5 kHz, far -5 | busy -7, far -5 | far -6, crickets -12, busy -16 |
| park | birds +1.5 | birds 0, busy -17 < 1 kHz | birds -5, crickets -12 | crickets -3, far -12 |
| harbor | waves -3, gulls -6, light -14 | waves -2, gulls drift at -6, light -11 | waves -3, gulls rare | waves -5, far -11 |
| waterfront (boardwalk + pier: new) | waves -1, gulls -5 | waves 0, gulls drift at -4 | waves -1, gulls rare | waves -3, far -13 |
| market (within 10 tiles of Market Square: new) | as town | crowd -2, light -7 | crowd -7, light -4 | as town |
| airport | airport -3, birds -10 | airport 0 | airport -2 | airport -7 < 3.5 kHz, crickets -11 |

Pools: busy = busy_a..d; light = light_a..c; resid = resid_a + light_a; birds = park_a..c; waves = harbor_a; gulls; crowd = market_a; crickets = crickets_a; air = night_air; far = resid_b; airport = airport_a + airport_c; trolley = light_c. Time of day: night = the game's own `G.env.night`; dawn 04:00-08:30; evening from 17:30.
Weather outdoors: rain x0.5, storm x0.4, snow x0.55, fog x0.8 on the whole bed. **No rain sound** (no recording; the noise hiss stays cut outdoors). Slot: add `rain_*.mp3` / `storm_*.mp3` stretches and put their names in `POOLS.rain` / `POOLS.storm`: they then play as their own track in rain. Title screen: the bed 6 dB lower under the title music.

## Every noise source in the audio code
| source | where | status | why |
|---|---|---|---|
| traffic, air, leaves, waves, jet (looping filtered noise) | `_audio_amb.js` LAYERS, outdoor profiles | **CUT** (was already off: `CITY_BED = false`) | owner msg 111: the white-noise machine; replaced by recordings |
| rain hiss, storm rumble, snow / fog hush outdoors | `_audio_amb.js` WEATHER | **CUT outdoors** (as before my work) | noise; no recording yet |
| the same weather layers heard indoors (muffled) and in the train | same | KEEP | msg 125: indoors untouched |
| room tone, hvac (+ 120 Hz hum), murmur | indoor profiles | KEEP | msg 125 |
| train rumble + room; engine tone + its road noise | train / vehicle profiles | KEEP | msg 125 |
| random outdoor one-shots: whoosh (noise), bark (part noise), splash (noise), plane (noise), clank, horn_far, honk, chirp, cricket, gull, meow | `_audio_amb.js` PROFILES `ev` | **CUT as random ambience** (`AMBIENT_EVENTS = 'tonal'`); all still exist as effects | generated city sounds were rejected (msgs 116-118) and the recordings now carry birds, crickets, gulls, horns, planes, cars |
| random outdoor bike bell, harbor buoy (pure tones) | same | KEEP | clean bells; set `AMBIENT_EVENTS = 'none'` to drop them too (owner question 3) |
| indoor / train one-shots (cup, typing, page, sizzle, scan, clank, applause, clack) | same | KEEP | msg 125 |
| short noise bursts inside one-shot effects (click, door, pay, step, thunder, shower, ...) | `_audio_sfx.js` | KEEP | one-shot effects stay (msg 111) |
| rim / hi-hat ticks (20-35 ms), vinyl crackle (4 ms ticks) | `_audio_music.js` | KEEP | music stays |
| the three 3 s noise buffers | `_audio_lib.js` makeBuffers | KEEP | the effects above use them |
One small fix in `_audio_amb.js`: a silenced old layer is now let go 10 s after it went silent (its stop time used to be pushed back at every profile change, so a silent source could hang on for as long as the player kept moving between districts).

## Proof: `node tools/ambience_check.mjs` (headless Chromium, 390x844, touch; ~13 minutes)
Last full run: see "Result" at the end. What it measured:
- **Before the first touch**: 0 AudioContexts, state `none`. After the tap: `running`.
- **Every place by day (9), 11 place x time combinations, rain / storm / snow**: the scene key is the expected one, exactly the expected tracks run with exactly one voice each from the right pool (drifting layers 0 or 1), the count of long buffer sources alive in the page equals the mixer's count, **no noise-buffer source older than 5 s and no old noise layer outdoors**.
- **Scene change town -> city**, sampled every 100 ms: summed power of all voices (track gain x fades, squared) stays at 1.00 (1 = one bed) through the whole 2.5 s crossfade, at most 2 sources at once, never silent (one 0.51 sample: see "Result").
- **Stretch crossfades** (100 s standing downtown): 2 crossfades, 3 different stretches heard, summed fade power 1.00..1.00.
- **Indoors** (cafe, grocery, gym, bookstore): recorded sources 0, the old layers present ([room, murmur], [room, murmur, hvac]); back outdoors after 11.5 s: noise sources 0, recordings back.
- **Mute / sliders**: Master 0 -> 0 sources, bus at digital silence; City sound 0 -> 0 sources; 35 % -> -34 dBFS, 70 % -> -26 dBFS on the bed bus; `state.audio.city` saved.
- **Level**: city, day, default sliders: bed bus mean -24 to -25 dBFS, 40 ms RMS -30..-20, peak -10.5 dBFS.
- **Decoding and frames**: 3 rounds; in each, 10 s standing still, then all 19 stretches auditioned 0.7 s apart (52 fresh decodes): 19 of 19 play within 0.7 s; unpack + decode 76-217 ms each (median 143 ms) off the main thread; base64 unpack on the main thread 0.9-2 ms. Frames while decoding: median 16.7 ms, p99 16.8 ms, worst 16.8-66.7 ms per round, none over 100 ms (without decoding: worst 16.8 ms). In one earlier full run a single 166 ms frame appeared during the decode phase (1 of 879 frames); a dedicated rerun of 54 decodes showed none over 40 ms. I cannot tie that one frame to decoding or rule it out; this machine was also running another worker's benchmarks. **Headless desktop Chromium: a phone will decode slower** (the sound just comes in later; the unpack is the only main-thread part).
- **Start-up**: see "Start-up cost" below.
- **Every recording corrupted**: the game runs, 0 sources, the mixer gives up on each stretch once, effects still play, 0 page errors.
- **Offline render** (the same mixer class taken from the page, `OfflineAudioContext`, 24 kHz, 180 s, bed bus before the volume sliders; WAVs in `out/ambience/`):

| scene | integrated LUFS | LRA | short-term (3 s) LUFS | loudest 400 ms | true peak | best waveform match of any 10 s window elsewhere (r) | first second of a recording heard twice |
|---|---|---|---|---|---|---|---|
| city, day | -22.0 | 4.8 | -27.2 .. -17.5 | -15.6 | -4.9 dBFS | 0.18 | at 162 s (busy_a, first heard at 0 s) |
| town, day | -21.8 | 6.7 | -27.1 .. -17.6 | -12.3 | -3.2 | 0.07 | at 124.5 s (light_a, first heard at 47.7 s) |
| park, day | -23.3 | 3.4 | -26.8 .. -20.7 | -14.3 | -4.2 | 0.15 | at 127 s (park_b, first heard at 42.5 s) |
| suburb, night | -25.4 | 2.7 | -28.0 .. -23.4 | -21.9 | -8.2 | 0.22 | at 33.5 s (night_air: a one-stretch pool) |
| harbor, day | -23.3 | 5.0 | -28.8 .. -19.9 | -17.4 | -4.3 | **0.60** (155 s vs 30 s) | at 22.8 s (the only wave take, 29 s) |

  No clipping anywhere. **Read the repeat columns honestly**: the waveform test passes for four scenes partly because every entry runs at a slightly different speed, which breaks sample-level correlation; the right-hand column is the mixer's own log and is the real answer to "does the same material come back within 3 minutes": yes, after 2 to 2.7 minutes downtown / old town / park (pools of 150-195 s), and within half a minute wherever a track has a single recording (waves, crickets, night air, far rumble, crowd, gulls). A third measure (spectral shape, speed-tolerant) is printed but gives 0.6-0.8 even where nothing repeated, so it decides nothing. Only more recordings fix this.

## Start-up cost (measured: headless Chromium, 7 fresh loads each, interleaved, same save)
| build | size | title screen ready, no CPU throttle | first animation frame | title ready at 4x CPU throttle |
|---|---|---|---|---|
| without the recordings (`--no-audio`) | 8.98 MB | median 1412 ms (1200-1506) | 1091 ms | 7022 ms (4694-7630) |
| with the recordings | 13.89 MB | median 1570 ms (1458-1942) | 1254 ms | 3993 ms (3505-4708) |

The blocks sit after the game's script, so the game starts before the browser has read them; the browser then reads the 4.8 MB tail while the game initialises (DOMContentLoaded moves from 0.3 s to 1.8 s). Unthrottled that costs about 0.16 s to the title screen, inside the run-to-run spread. The 4x-throttle rows are the other way round (faster WITH the recordings, in both of two series); I do not have an explanation beyond scheduling in headless Chromium, so I read those rows as "no measurable penalty", not as a gain. Download size matters more than parse time: +4.8 MB over the network (the base64 text compresses only ~25 % if the host gzips).

## Result of the last full run (`node tools/ambience_check.mjs`, after all changes)
**130 / 130 checks passed**, 0 page errors in all three pages (live, broken, render). `node src/data/validate.mjs` OK, `node tools/build.mjs` OK (13,564 KB). Details: `out/ambience/report.json` (not in git: `out/` is ignored) and the WAV renders beside it.
In that run the town -> city sample series reads 1.00 at every 100 ms sample except one 0.51: that sample fell inside an 80 ms loop hand-over (two voices of the SAME material crossfading linearly: their amplitudes add to 1, the squares to 0.5), not a dip in level.

## What nobody has heard
All of it: the 19 cuts, the level balance between tracks, the night low-pass, whether `night_air` is pleasant air or hiss, whether the meadow with its loop layer removed sounds natural, whether the vintage traffic sits well next to the modern street takes, the 0-3 % speed change, the real level against music and effects on a phone speaker (phone speakers give back little below ~200 Hz: `resid_b`, the far rumble, will be faint there), and anything on real iPhone Safari (decode of 24 kHz MP3, `setValueCurveAtTime`, `new GainNode`; each has a fallback, none was run on a device).

## What cannot be done well with what is there
- **Rain**: no recording. Outdoors in rain the bed halves and that is all. Wanted: steady rain on a street, 60 s+; ideally one with far thunder.
- **Harbor**: one 29 s take of waves and one 43 s of gulls. Wanted: two more takes of water (harbor lapping, small waves), 60 s+.
- **Park**: the only source is a studio mix with built-in loops. Wanted: a real park / garden with birds, 2 minutes+.
- **Night, quiet street**: `night_air` is a stairwell. Wanted: a quiet residential street at night.
- **Market / plaza**: one 57 s take.
- Not shipped but on disk from a first, larger cut: `docs/audio/game/airport_b.mp3`, `crickets_b.mp3` (not in the manifest; delete them, or add their two lines back to `make_library.py` for +0.67 MB).

## Owner questions
1. Size: 4.8 MB added against the "about 4 MB" aim. Keep all 19 stretches, or drop four (to 3.7 MB)?
2. Any recording to drop after hearing the cuts on the listening page? (`night_air` and the three `park_*` are the ones I trust least.)
3. Outdoors two generated bells still ring now and then (bike bell, harbor buoy). Keep, or recordings only?
4. Indoors is untouched as asked. The "street through the wall + real crowd murmur in cafes" version exists behind `BED_INDOORS`; want to hear it some day?
5. May the lead fetch rain, more water and a real park recording?
