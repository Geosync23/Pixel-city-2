# The Classics: the eight original loops are back (owner msgs 165, 166, 181)

Worker report, 2026-11-16. Owner: "Its indoors, and daytime streets songs I like the most. But just bring all of these back as all the songs for the first day then put them back in rotation weighted to appear a bit more than others but not an absolute ton." Design: BIBLE Direction update 40 (it replaces the "first ~5 minutes" note of update 34).

**Nobody has listened to any of this.** Everything below was checked by measurement, by script and by reading the code. The sound of the loops is the old code unchanged, but whether they sit well next to the songbook is for the owner's ears (`docs/audio/jukebox.html`, Classics at the top).

## What came back

`src/sim/_music_classic.js`: `TRACKS`, `compile()` and `Session` from commit e834cfe (`src/sim/_audio_music.js`), character for character (music_check compares the text with the copy in `docs/audio/classics.html`). The stingers were not copied: they stay in `_audio_music.js`. New in the file:

- `CLASSICS` / `CLASSIC_IDS`: ids `classic_<old track>` with the titles the game shows: Classic: Indoors (`classic_interior`), Classic: Daytime Streets (`classic_day`), Classic: Morning Streets (`classic_morning`), Classic: Evening Streets (`classic_evening`), Classic: Night Streets (`classic_night`), Classic: Rain (`classic_rainy`), Classic: Train (`classic_train`), Classic: Title (`classic_title`).
- `ClassicPlayer(ctx, id, dest, send, { db, fade, passes })`: a Session dressed as the songbook's `Player` (schedule / wind / stop / pos / done / next / started / song), so `src/sim/audio.js` drives both the same way. Chain: Session (its own 3 s fade-in, as before) -> trim (`CLASSIC_LEVELS`) -> the songbook's per-tune peak limiter -> the current music bus (`L.music * .6`) and the same echo send. A natural end waits 2.5 s for the tails (as the old controller did); `wind()` ends at the bar line and fades; `pos()` reports "pass 1 of 3".
- `renderClassic(id, sr, db, { passes, seed })` (offline render, Math.random seeded so the per-pass variations repeat) and `useContext(ctx, dest)` (for the jukebox page).
- The old per-track vinyl crackle on title / evening / night / rain is part of the old sound and is kept (4 ms clicks, 12 % of 16th notes, -34 to -42 dB). Measured above 6 kHz: 0.01 % or less of the energy. If the owner hears it as hiss, deleting `crackle: true` from four TRACKS lines removes it.
- Size: `_music_classic.js` is 15.5 KB of source, 9.7 KB minified; with the controller and pool additions the game file grew by about 13 KB (14,550 KB now).

## Loudness (`node tools/music_check.mjs`, same method as the tunes)

Each classic rendered offline by the shipped game (OfflineAudioContext in Chromium, 48 kHz), four seeds x three passes, measured with ffmpeg EBU R128; the trim is set from the energy mean of the four. Target -17 LUFS like every tune.

| Classic | key, bpm | untrimmed (limiter on) | trim | with trim (4 seeds) | true peak | through a small speaker |
|---|---|---|---|---|---|---|
| Indoors | D, 104 | -14.5 | -2.5 dB | -17.0 (-17.3 .. -16.8) | -4.0 | -23.0 |
| Daytime Streets | G, 100 | -14.0 | -3.1 dB | -17.0 (-17.3 .. -16.8) | -4.0 | -23.4 |
| Morning Streets | F, 92 | -13.6 | -3.4 dB | -17.0 (-17.2 .. -16.8) | -5.9 | -23.0 |
| Evening Streets | Eb, 78 | -14.8 | -2.3 dB | -17.0 (-17.3 .. -16.9) | -4.0 | -21.1 |
| Night Streets | A minor, 68 | -12.8 | -4.4 dB | -17.0 (-17.4 .. -16.5) | -4.3 | -20.8 |
| Rain | D minor, 72 | -12.8 | -4.3 dB | -17.0 (-17.2 .. -16.6) | -4.7 | -20.6 |
| Train | A, 116 | -14.2 | -2.8 dB | -17.0 (-17.1 .. -16.8) | -4.4 | -24.8 |
| Title | C, 76 | -13.9 | -3.2 dB | -17.0 (-17.4 .. -16.4) | -3.6 | -21.4 |

The trims live in `src/sim/_music_levels.js` as `CLASSIC_LEVELS` (`--write` regenerates both tables). The music bus is 3.5 dB lower than in the e834cfe days (`.6` vs `.9`), so in the game the classics are now as loud as the songbook, a little quieter than they used to be.

**Caveat, phone speaker:** the old loops carry more of their weight in the bass. With nothing under 200 Hz (a rough phone speaker) they measure -20.6 to -24.8 LUFS, where the songbook measures -20.1 to -17.4. On a phone speaker the classics may sound 1 to 5 LU quieter than the tunes around them (Train and Daytime Streets the most). If the owner says so, matching them on the small-speaker figure instead is a table change (about +3 dB for Train, +2 for Indoors / Day / Morning).

## The day-one rule (exactly)

- `G.state.audio.mus.d1` = `Math.floor(G.state.t / 1440)` (the game's day index) at the moment `game:new` fires (a new game committed from the title). Saves from before have no `d1` and are unaffected, whatever day they are on.
- **Day one lasts until 05:00 of the next calendar day.** I chose the clock over "the first sleep" because both usual endings land on the same moment: sleeping until morning wakes at 07:00 or later (past 05:00), and staying up all night ends it at 05:00. A nap or an evening sleep that wakes before 05:00 does not end it. Once past, `d1` is deleted.
- While day one lasts, ONLY classics play, by the e834cfe `wantTrack()` rule: scene id with train / tram (or a train / air-tram ride) -> Train; any indoor scene -> Indoors; rain or storm outdoors -> Rain; otherwise by the hour: 05-11 Morning Streets, 11-17 Daytime Streets, 17-21 Evening Streets, 21-05 Night Streets. (The old code fell through to 'day' between 00:00 and 05:00 by an oversight; that hour now gets Night Streets, as the brief describes the rule.) A cab ride is outdoors, so it keeps the street loop (as before).
- Old behaviour: each classic plays its loop 2 or 3 times (random per start, with the old per-pass variations), then a quiet gap of 20-50 s (the songbook's current gap; it was 45-105 s). A change of the kind of place (title / indoors / train / outdoors) ends it at the bar line with a fade and the new place's classic starts 2.5-5 s later; moving between outdoor times or into rain does not cut it, the next start follows the new place (both as with the songbook).
- **The title screen** (before a game is loaded) always opens with Classic: Title, whatever the save; after it, the title pool (3 tunes + Classic: Title) rotates with a 5 s gap. Coming back to the title opens with it again.
- Day one plays outside the shuffle bag (the bag is not touched; `played()` is recorded, so day two never starts with the same tune).

## From day two: the weights table (`src/sim/_music_pools.js`, `CLASSIC_IN`, one table)

| Classic | Pools | Tickets per bag round |
|---|---|---|
| Indoors | home, home_am, room (lobbies), cafe, shop | 2.5 |
| Daytime Streets | outdoors midday + afternoon (every district, every season), heat | 2.5 |
| Morning Streets | outdoors dawn + morning | 2 |
| Evening Streets | outdoors golden hour (17:00-19:30) | 2 |
| Night Streets | outdoors late night (23:00-04:30) | 2 |
| Rain | rain, storm, home_rain | 2 |
| Train | train, bus, cab | 2 |
| Title | title | 2 |

The bag: a round holds every tune of the pool once and a classic its weight in tickets (2.5 = 2 or 3, by chance per round), so every tune still comes round in every round. Never the same tune twice in a row (unchanged). Two small changes to make the tickets count: a classic with tickets to spare is not held back by the "recent tunes" rule, and when all that is left of a round is the tune just heard, the next round starts and that spare ticket carries over (once). `putBack` returns at most the classic's ticket count. Old saves' bags simply pick the classics up at their next refill.

Places chosen to keep the share down ("not an absolute ton"): Indoors is not in diners, offices, work shifts or the family pool (they keep their character); the 19:30-23:00 outdoor band has no classic (it sat between the old evening and night loops); bars, gyms, library, museum, hotel, late-night home, plane, date, festival, snow and fog have none.

**Simulated shares** (music_check: 10,000 picks in each of the 252 pools: 28 named + 7 times x 8 districts x 4 seasons):

- Ratio to an ordinary tune of the same pool: within 2 % of the table everywhere (furthest: cafe, Indoors 2.46x for 2.5x).
- Share of plays that are classics, per pool: title 40 %; rain 29, storm 33, home_rain 33; cafe 29, shop 38, home 29, home_am 33, room 33; train 33, bus 29, cab 25; heat 33; outdoors by time of day (mean of the 32 pools): dawn 30, morning 26, midday 32, afternoon 32, golden 26, evening 0, late 35; every other pool 0.
- **Overall: 18.6 % over a typical day** (hours: at home 6, work 3, outdoors 6.3 spread over the day, cafe / diner / shop / bar / gym / library 3.2, rides 0.8, rain 0.5 ...), **24.7 % as the plain mean of all 252 pools** (named pools 15.0 %, outdoors 25.9 %). Both within 10-25 %. In a single place the classic is often 1 tune in 3 or 4, because the pools are small (4-9 tunes); lowering one number in the table lowers it.

## Everything else that works with classics

`G.audio.nowPlaying()` (title "Classic: ...", where "First day: Indoors" or the pool's name, section "pass 1 of 3"), Skip (on day one: the place's classic afresh; later the next of the bag), `G.audio.music('classic_day')` and the eight old names (`G.audio.music('interior')` now plays Classic: Indoors instead of a tune of the lobby pool), `debug.music()` (adds `dayOne`, `firstDay`; the pool on day one is the one classic), `debug.jukebox()` (a Classics section at the top), `debug.musicKit()` (CLASSICS, CLASSIC_IN, CLASSIC_LEVELS, ClassicPlayer, renderClassic, weight, dayOne, oldTrack), the watch-a-show silence, Music volume 0, save / load of the bag. `docs/audio/jukebox.html` (rebuilt by `tools/music_jukebox.mjs`, 116 KB) has "Classics (8)" at the top, playing through the same ClassicPlayer.

## How it was checked

- **Script, `node tools/music_check.mjs`** (full run 76 of 77; the one failure was the new day-two check itself, which did not wait out the 12 s of quiet after its own show test; fixed, and the live part re-run alone: 48 of 48). New checks: the code text equals e834cfe's; titles; each classic in exactly its pools; 10,000 picks per pool (no repeat, every tune comes round, ratios, shares 10-25 %); bag save / load (JSON and a real `G.save()` / `G.load()`); render + loudness + true peak of the eight; live: the title opens with Classic: Title; 11 day-one places each play the right classic (downtown 8:00, old town 13:00, park 18:30, harbor 22:00, rain, a cab at 14:00, the cafe, home 23:30, Central Station, the train, outdoors 3:00); Skip and `music('interior')` on day one; a classic stops for a show; past 05:00 of day two the songbook pools are back. All the old checks still pass (the two bag checks now allow a classic's extra tickets).
- **Played in the built game with Playwright** (390 x 844, touch, fresh browser, no save): tapped the title, New Game, creator Next, traits Surprise me + Next, a home, Move in; the intro steps were moved on with `G.intro.goto` / `G.airtram.ride` / `G.housing.goHome` (the player was not walked by hand), the cab was called by the intro and ridden for 40 s, then skipped. `G.audio.nowPlaying()` logged every second: title -> Classic: Title (it played on through the creator); the arrival cinematic, which is the city scene -> Classic: Daytime Streets for 2 s, ended at the bar as the plane cabin loaded; cabin / concourse -> Classic: Indoors; the air tram -> Classic: Train; the terminal -> Classic: Indoors; the curb -> Classic: Daytime Streets, carried on through the whole cab ride; the flat -> Classic: Indoors. Nothing else played. Then the real sleep activity on the bed: at 05:00 the context became `home_am`; day two at home, 10 skips: Watering the Plants, Classic: Indoors, Blossom Confetti, Milk Round, Toast and Slippers, Bakery Run, Classic: Indoors, Watering the Plants, Blossom Confetti, Classic: Indoors; outdoors (old town, 07:00), 10 skips: 2 of 10 Classic: Morning Streets. Zero page errors, zero audio errors. (The game clock stood still at 14:55 in the flat on day one and at 07:00 on day two while the intro's / wake-up's own panels were open, so "30 game minutes" were 30 real seconds there.)
- `node src/data/validate.mjs` OK; `node tools/build.mjs` OK; `node tools/ambience_check.mjs` 138 of 138; `grep -c '(?<[=!]' dist/index.html` = 0. Jukebox page in Chromium, light and dark: Classics first, a classic and a songbook tune play and stop, no external requests, no sideways scroll at 390 px.
- **Code-read only:** Safari / iOS (same Web Audio nodes as the songbook); a save made mid-day-one by an older build (it has no `d1`, so it gets the songbook: intended).

## Not done / for the lead

- `docs/reports/music.md` still describes the songbook alone; a pointer to this file belongs in its Files table.
- The owner questions: is Classic: Train / Daytime Streets too quiet on the phone next to the songbook (see the caveat)? Is the crackle welcome? Are the shares right (one table)?

## Summary

The eight original loops play again, unchanged in sound, as "Classic: ..." tunes at -17 LUFS like the songbook. On the first day of a new game (until 05:00 next morning) only they play, each in its old place with its old 2-3 passes; the title screen always opens with Classic: Title. From day two they sit in their places' pools with 2 (Indoors and Daytime Streets 2.5) bag tickets: 18.6 % of plays over a typical day. Nobody has listened.

Files: `src/sim/_music_classic.js` (new), `src/sim/audio.js` (music controller), `src/sim/_music_pools.js` (CLASSIC_IN table, weighted bag), `src/sim/_music_levels.js` (CLASSIC_LEVELS), `tools/music_check.mjs`, `tools/music_jukebox.mjs`, `docs/audio/jukebox.html` (regenerated), `docs/reports/classics.md`.
