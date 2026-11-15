# Audio sources (recordings for the city ambience, owner msgs 111-116)
All marked PUBLIC DOMAIN on Wikimedia Commons (checked 2026-11-15 through the Commons API, field LicenseShortName). Loops: mono 44.1 kHz, loudness-normalised (-20 LUFS), 3 s crossfade at the seam, MP3 64 kbit/s.
- L_streetA.mp3 (78 s) <- https://commons.wikimedia.org/wiki/File:Sunday_in_the_city_street_noise1.ogg from 0:40
- L_streetB.mp3 (90 s) <- the same file from 2:30
- L_gulls.mp3 (48 s) <- https://commons.wikimedia.org/wiki/File:Gulls_above_the_street_at_dawn.ogg from 0:02
- L_beach.mp3 (33 s) <- https://commons.wikimedia.org/wiki/File:On_a_pebble_beach.ogg from 0:01
Wanted but refused by Commons' rate limit (HTTP 429) on 2026-11-15, try again later: File:Sunday_in_the_city_street_noise3.ogg (public domain), File:Ocean_Waves_on_a_Tropical_Beach.ogg (CC0), File:Urban_Street_on_a_Rainy_Afternoon.flac (CC0, 89 MB). No public-domain park birdsong / night insects of 15 s+ found yet.
Used only in the listening-test page so far (soundtest_head.html + soundtest_page.js + the loops as base64 `BEDS`), NOT in the game. Nobody on the team has heard them; the owner judges by ear.
OWNER RULES (msg 116): no white-noise layer anywhere; generated sounds must be clean tones (a little putter for cars, soft footsteps, bells); the recording is the background, in long stretches with variety (the page crossfades to another stretch every 40-70 s from a random point).
OWNER RULE (msg 117): no footstep sounds.
NOTE (2026-11-15 17:00 UTC): Commons media downloads now answer 429 "Too many requests" for this environment's shared address on every try (10 tries over 45 min). Stop retrying today; try once on a later day, one file per several minutes. Alternative: the owner adds recordings to docs/audio/in/ in the repo (any public-domain / CC0 file, with its link).

## Internet Archive batch (2026-11-15, owner approved archive.org + five file servers; downloaded by the lead)
Files in docs/audio/in/ (originals as served, MP3). Licence as stated on each item's page (metadata field licenseurl).
- GOLD_TAPE_16_17_18_Ambience — CC0 1.0 — https://archive.org/details/GOLD_TAPE_16_17_18_Ambience : G16_07_Crickets_Near_and_Far (169 s), G16_02_Outdoor_Airport_Ambience (164 s), G16_01_Small_Airport_Ambience (71 s), G16_17_Busy_Downtown_City_Traffic (106 s), G16_19_Medium_Perspective_City_Traffic (86 s), G18_09_Trolley_on_Street (66 s)
- SSE_Library_AMBIENCE (USC Cinema / Sunset Editorial) — CC0 1.0 — https://archive.org/details/SSE_Library_AMBIENCE : AMBTraf_Light_traffic_on_Sunset_Blvd (82 s), AMBTraf_Light_traffic_with_a_few_streetcars_voices (82 s), AMBTraf_Distant_traffic_rumble (67 s), AMBPubl_Crowd_walla_at_outdoor_farmers_market (79 s)
- ThomasParkSaintLouisUrbanPhonography — Public Domain Mark 1.0 — https://archive.org/details/ThomasParkSaintLouisUrbanPhonography : CarsAndBirdsong (68 s), BackStairwellEvening (162 s)
- meadow_ms_relax_country — Public Domain Mark 1.0 — https://archive.org/details/meadow_ms_relax_country : meadow_6min.mp3 = minutes 2-8 of the 20-minute file (birds, countryside)
NOT taken: the 'rain-sounds-gentle-rain-thunderstorms' item is tagged CC0 but its file names look like re-uploads from a stock site whose own licence is not CC0: provenance unclear, so rain is still missing. Many of these recordings are old film-library takes (1930s-50s traffic, streetcars): they may sound vintage. Nobody on the team has heard any of them.
To fetch more: archive.org search API works; each item's files are on its own server (metadata fields d1 / dir), which must be allowed by exact host name first.

## The game library (2026-11-15, ambience worker): docs/audio/game/
19 stretches cut from the files above by `docs/audio/tools/make_library.py` (python3 + numpy + ffmpeg; rerun it to rebuild; then `node tools/audio_pack.mjs --listen`). Nothing else is in the game: no noise, no generated bed. Every stretch is derived ONLY from the public-domain / CC0 files listed in this document, so the same licences apply (CC0 1.0 and Public Domain Mark: no attribution required, kept here anyway).
Format: MP3 (MPEG-2 Layer III), mono, 24 kHz, LAME VBR -V8 (22-36 kbit/s), high-pass 80 Hz, loudness-matched at -23 LUFS (measured after a 150 Hz high-pass, never above -20 LUFS full band), written as [0.3 s pre-roll][seamless cycle][0.3 s post-roll]; `manifest.json` holds seconds, loop points, levels and what was cut.
| stretch | from | source seconds used | cycle |
|---|---|---|---|
| busy_a | in/G16_17_Busy_Downtown_City_Traffic.mp3 (GOLD_TAPE, CC0) | 14-68 | 50 s |
| busy_b | in/G16_19_Medium_Perspective_City_Traffic.mp3 (GOLD_TAPE, CC0) | 6-55 | 45 s |
| busy_c | L_streetA.mp3 (Commons "Sunday in the city street noise1", PD) | 1-55 of the loop | 50 s |
| busy_d | L_streetB.mp3 (same Commons file, PD) | 2-56 of the loop | 50 s |
| light_a | in/AMBTraf_Light_traffic_on_Sunset_Blvd_CS_USC.mp3 (SSE Library, CC0) | 1-56 | 50 s |
| light_b | in/AMBTraf_Light_traffic_with_a_few_streetcars_voices_CS_USC.mp3 (SSE Library, CC0) | 1-49 (the voices after 0:50 are not used) | 45 s |
| light_c | in/G18_09_Trolley_on_Street.mp3 (GOLD_TAPE, CC0) | 3-63 | 56 s |
| resid_a | in/CarsAndBirdsong.mp3 (Thomas Park, PD Mark) | 2-21.5 + 30.5-64 | 47.5 s |
| resid_b | in/AMBTraf_Distant_traffic_rumble_CS_USC.mp3 (SSE Library, CC0) | 1-51 | 45 s |
| park_a / park_b / park_c | in/meadow_6min.mp3 (meadow_ms_relax_country, PD Mark), minus the 30 s loop layer that mix contains | 1-55 / 60.5-114.5 / 120-174 | 50 s each |
| harbor_a | L_beach.mp3 (Commons "On a pebble beach", PD) | 0.5-32.5 | 29 s |
| gulls | L_gulls.mp3 (Commons "Gulls above the street at dawn", PD) | 0.5-47.5 | 43 s |
| market_a | in/AMBPubl_Crowd_walla_at_outdoor_farmers_market_CS_USC.mp3 (SSE Library, CC0) | 0.5-17.6 + 20.4-66 | 57 s |
| crickets_a | in/G16_07_Crickets_Near_and_Far.mp3 (GOLD_TAPE, CC0) | 6-70 | 60 s |
| night_air | in/BackStairwellEvening.mp3 (Thomas Park, PD Mark) | 9-41 + 45.5-63 | 44 s |
| airport_a | in/G16_02_Outdoor_Airport_Ambience.mp3 (GOLD_TAPE, CC0) | 3-62 | 55 s |
| airport_c | in/G16_01_Small_Airport_Ambience.mp3 (GOLD_TAPE, CC0) | 18.5-69.5 | 47 s |
Not shipped (left in docs/audio/game/ from a first, larger cut, not in the manifest; safe to delete): airport_b.mp3, crickets_b.mp3.
Found while measuring: `meadow_6min.mp3` is not one continuous recording but a studio mix: one layer repeats every 30.000 s exactly (a broadband wind/hiss swell, 12 times in the 6 minutes) and the bird layer repeats after 180 s. The library subtracts the 30 s layer and uses only the first 180 s. `G16_17` contains the same horn figure four times.
STILL MISSING (public domain / CC0, 60 s or more, with the link): RAIN (steady rain on a street; ideally a second take with thunder far off); a SECOND and THIRD take of WAVES / harbor water (the only one is 33 s); a real PARK or garden recording with birds (to replace the meadow studio mix); a quiet residential street at night; more market / plaza crowd. Drop them into docs/audio/in/ and add one line to the table in make_library.py.

OWNER APPROVAL (msg 123, 2026-11-15): all 16 recordings on the audition page (the 13 Internet Archive files + street, gulls, beach from Wikimedia) are approved by ear.
OWNER (msg 125): indoor sounds (room tones, murmur, hvac) were OK as they are: KEEP indoors. The no-noise rule applies to the outdoor city ambience.
OWNER (msg 126): keep all 19 stretches.
