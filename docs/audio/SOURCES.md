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
