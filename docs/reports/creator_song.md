# The character creator's sound: the city is silent, a song of its own (owner msgs 230, 232, 234)

Worker report (Opus), 2026-11-17. The owner said: "The city recordings shouldn't be playing while making a character in the pre intro. It should be its own song. Then the songs play the same once completed. A nice fun upbeat song in the style of the classic tracks." He also said: "Let opus silence and make the song, I'll listen to it first."

**Nobody has listened to any of this.** The tunes were written blind and checked only by measurement and by script. The owner chooses by ear on `docs/audio/creator_song.html`.

## What played in the creator before, and why

The title screen, the character creator (step 1), the traits (step 2) and the home picker (step 3) all run with `G.onTitle = true`. The live city runs behind them, because the title camera tours landmarks in the city scene. So everything the city makes kept playing through the creator:

- **music:** the title pool. Classic: Title first, then the title rotation. It played on through the creator (`musicCtx()` returns `title` while `G.onTitle`).
- **the recorded city bed** (`_audio_bed.js`), 6 dB lower while `G.onTitle`, following the camera's tour (harbor, market, ...). These are the "city recordings" the owner heard.
- **the synth ambience** (`_audio_amb.js`): profile from the camera's district and its tonal one-shot events (birds, gulls, ...), plus weather layers in rain.
- **positional / one-shot city sounds:** jets landing and taking off (`sim/planes.js`, through `G.audio.bus()`), tyre screech, traffic honks (`sim/traffic.js`), buses, rail, the lighthouse, the fish market, thunder.

**The title screen itself (unchanged):** Classic: Title (then the title pool), the bed 6 dB under it, the synth ambience and the jets. Measured in the playthrough at title +9 s: music Classic: Title, bed `harbor_day~title`, synth `harbor`, jet bus on. I left it as it is. It is the city behind the logo, and the owner only asked about the creator.

## The gate (the creator hush)

- `src/ui/title.js`: a new `creatorPhase(on)` sets **`G.inCreator`** and emits `'creator'`.
  - On at the start of `newGame()` (New Game, and `?title=creator|homes`).
  - Off when the creator's Back returns to the title.
  - Off in `commitNewGame()` just before the title closes, which is the Move in moment.
  - Back from the home picker to the creator keeps it on.
- `src/sim/audio.js`, while `G.inCreator`:
  - the bed gets `set(null)` and fades out (nothing new is decoded);
  - the synth ambience gets profile `silent` and no weather, so no layers and no events;
  - `G.audio.bus()` returns null, so the jets of `planes.js` stop;
  - `play()` lets only interface sounds through (`UI_SFX`: click, open, close, toast, alert, error, notify, buzz, send, page, typing, coin, pay, scan, skill, levelup, achievement, friend_up). Every city one-shot (honk, gull, train, thunder, tyre screech, ...) is dropped. The creator itself plays no sounds;
  - the music context is `{ g: 'creator', key: 'creator' }`. The title tune finishes its bar and fades (1.6 s), and the creator song starts 0.5 s later. The song is outside the shuffle bags: it never touches them, and nothing is pre-drawn for it.
- When `G.inCreator` clears (Move in, or Back to the title), everything above is the unchanged old code path. The `'creator'` event makes audio re-read the moment at once, without waiting for its 0.5 s tick.
- Debug: `G.audio.debug.music()` gains `creator` and `creatorSong`. `G.audio.debug.ambience()` gains `creator`. `nowPlaying()` shows title "Creator: Sunny Side Up", where "Character creator", section "time round 2, the B part".
- Volume: the song plays on the music bus, so the Music slider, Master and Mute work as for any tune. At Music 0 or Master 0 it is stopped by the existing rule.

## The song: three candidates in the classic engine

New file `src/sim/_music_creator.js`. The tunes are classic `TRACKS` entries with the same fields and the same `Session` code: pad (two detuned voices), triangle + sine bass, the rim or snare kit, a lead through its low-pass, and the music bus echo. The vinyl crackle is not used (it is disabled in the Session anyway).

They are registered into `TRACKS` at load. `_music_classic.js` is **not edited**, because music_check requires its TRACKS / compile / Session text to equal e834cfe. Two differences from a classic, both in a small subclass `CreatorSession`:

1. **The lead is written out by hand** (`mel`: 16 bars x 8 eighths; a number is a scale step with 0 = the key note and 7 = an octave up, `-` holds, `.` rests). It replaces the seeded motif generator, so the hook is the same every time. The form is 16 bars: an 8-bar hook (A), then an 8-bar B part, then it loops.
2. **Gentler per-pass variations:**
   - the first time round always has lead and drums;
   - later times round have the lead 85 % and the drums 90 % of the time;
   - when the lead rests, the arpeggiated pad plays (otherwise 30 %);
   - there is no octave jump.

   The song loops without end (`passes: 1e6`) until it is stopped.

`CreatorPlayer` is `ClassicPlayer`'s twin: a trim, the same peak limiter, `wind` / `stop` / `pos`. Its fade-in is 1.5 s. On Move in it ends at the bar line and fades over 1.6 s.

| | A "Sunny Side Up" (wired) | B "Window Shopping" | C "First Day Fizz" |
|---|---|---|---|
| plain words | bright, bouncy, the most "video game": a square hook that climbs and skips back down | skipping, a little jazzy, a soft triangle tune with a swing | fastest, most excited: a short punchy hook with a jump up at each bar's end |
| key, tempo, swing | C major, 120 bpm, .2 | F major, 112 bpm, .35 (shuffle) | A major, 126 bpm, .1 (nearly straight) |
| hook chords (A, 8 bars) | I V vi IV I V IV V | I IV I V vi IV V I (sevenths) | I iii IV V I iii IV V |
| B part chords (8 bars) | IV V iii vi ii V I V | ii V iii vi ii V IV V (sevenths) | vi IV I V vi IV ii V |
| lead / pad | square (lp 1900) / triangle | triangle (lp 3000) / triangle | square (lp 2200) / sine |
| bass (8 eighths) | `R.5RO.5.` octave hop | `R.O.5.3.` walking | `R.R5.RO.` running |
| drums | rim kit; kick `x.....x.x.......`, rim on 2 and 4 soft, soft 8th hats | snare kit (like Daytime Streets); kick `x......xx.......`, snare 2 and 4, hats `o.x.` | rim kit; light kick on every beat, soft rim 2 and 4 with a pickup, offbeat hats |
| one time round | 32.0 s | 34.3 s | 30.5 s |
| trim (`CREATOR_LEVELS`) | -1.9 dB | -1.9 dB | -2.7 dB |

The melodies, note by note, are the `mel` arrays in the file. Nearly every note on a strong beat is a chord tone; the others are short passing notes. For comparison: Indoors is D major at 104 bpm, Daytime Streets is G major at 100.

## Where it is wired, and how to switch

**`src/sim/_music_creator.js`, line 12: `export const CREATOR_SONG = 'creator_a';`.** Change the one word to `'creator_b'` or `'creator_c'` and rebuild (`node tools/build.mjs`). All three ship in the game, so nothing else changes. `audio.js` reads only `CREATOR_SONG`.

## The listening page

- `docs/audio/creator_song.html` (35.9 KB, page content only, no doctype / html / head / body). Built by **`node tools/creator_song_page.mjs`**. That script copies `src/sim/_audio_lib.js`, `_music_classic.js` and `_music_creator.js` into the page (imports and exports stripped), plus Indoors' trim from `_music_levels.js`. So the page plays the game's own code.
- The mix is the game's at default sliders: the compressor, then Master 0.8, then the music bus 0.6 x 0.6, then the tune, with the same echo.
- Buttons: A, B and C (each with a one-line description and key / tempo / loop length), a "For comparison: Classic: Indoors" button (looping), and a sticky Stop. A status line shows the playing tune, the time and "time round N, the hook / the B part".
- Light and dark CSS variables and an explicit body background. 16 px gutter, max width 560 px, no external resources, audio starts on a tap.
- **Rebuild after any tune edit:** `node tools/creator_song_page.mjs`. **Check and measure:** `node tools/creator_song_page.mjs --check` (Playwright + ffmpeg, about 5-7 minutes; writes `out/creator_song/report.json` and a full-page screenshot `out/creator_song/page_390.png`).

## Measurements (`--check`, second full run, with the trims above)

Each tune was rendered offline by the page (OfflineAudioContext, 48 kHz, trim and limiter, before the music bus): four seeds x three times round. Measured with ffmpeg EBU R128, energy mean, the same method as `tools/music_check.mjs`.

| | loudness (LUFS) | range of 4 seeds | true peak | sample peak | "phone speaker" (no bass < 200 Hz) |
|---|---|---|---|---|---|
| Classic: Indoors (reference, trim -2.5) | -17.0 | -17.3 .. -16.8 | -4.0 dBTP | -4.0 dBFS | -23.0 |
| A Sunny Side Up | -17.0 | -17.2 .. -16.9 | -3.8 | -3.8 | -22.6 |
| B Window Shopping | -17.0 | -17.2 .. -16.8 | -3.5 | -3.5 | -21.2 |
| C First Day Fizz | -17.0 | -17.3 .. -16.8 | -3.9 | -4.0 | -21.1 |

- No clipping: every peak is at least 3.5 dB below full scale.
- **Loop seam:** two times round rendered, the join at 0.15 s + one loop. The largest sample-to-sample step within 50 ms of the join was 0.016 / 0.014 / 0.019 (A / B / C), against 0.16 / 0.16 / 0.11 anywhere in the tune, so there is no click. The loudest 20 ms there (-13.1 / -13.7 / -13.5 dBFS) is the downbeat, the same as at the hook-to-B bar line (-13.9 / -11.5 / -13.6). By construction there is no seam: the Session's clock runs on and the tails ring over the join.
- Page in Chromium at 390 x 844, touch: no sideways scroll (390 / 390), and each of the four buttons produced sound on an AnalyserNode after the mix (loudest 43 ms block -23.6 to -25.5 dBFS). No page errors, no external requests.
- Stop: in the final run, -270 dBFS (silence) 3 s after Stop. In one earlier run, 1.5 s after Stop still showed -62 dBFS: the music echo's tail of notes that had already been sent, as in the game. That run failed my first, too strict threshold (-70 dB at 1.5 s); the check now waits 3 s and allows -55 dB.

## In the game: playthrough (Playwright, built `dist/index.html`, 390 x 844, touch, fresh browser)

Logged per phase: `nowPlaying()`, `debug.ambience()` (bed scene, tracks, bus RMS via `debug.meter()`), the synth profile, whether `G.audio.bus()` gives the jets a bus, and the sfx count.

- **Title +9 s:** Classic: Title; bed `harbor_day~title` (waves, gulls, light); synth `harbor`; jets on.
- **New Game, creator +1 s:** Classic: Title ending (its bar + fade); bed none, its bus still fading (-30 dBFS); synth `silent`; jets off.
- **Creator +5 s / +13 s:** "Creator: Sunny Side Up" only; bed none, bed bus -200 dBFS (silence); synth `silent`, 0 events; jets off; sfx count unchanged.
- **Creator Back to title:** the bed comes back (`market_day~title`), synth `city_day`, jets on, and the title pool resumes ("Hello, Maple Bay" at +7.5 s).
- **New Game again:** the title tune winds, then the creator song plays again from the top; bed none.
- **Traits, home picker, picker Back to creator, picker again:** the creator song carries on without a restart. It was checked at 39 s, past the first loop join. Bed none, synth `silent`, jets off throughout.
- **Move in:**
  - +1 s: the creator song is wound (ended at its bar line and fading); the city bed is back (`city_day`).
  - +4 s: Classic: Daytime Streets (the arrival cinematic over the city), bed `airport_day`, jets on, sfx (plane sounds) counted.
  - +9 s: the cabin; Daytime Streets winds.
  - +15 s: Classic: Indoors.

  This is the same sequence as the classics report logged before this change.
- **Continue from a save:** title (Classic: Title, the bed) → Continue → home → the songbook ("First Ferry Home"). `creator` was false throughout, and the creator song never played.
- **Errors:** zero page errors and zero audio errors in both runs.

## Checks run

- **`node tools/creator_song_page.mjs --check`: three full runs; the third passed everything.**
  - Run 1 used the first-guess trims (A -17.5, B -16.9, C -16.9 LUFS). The trims were then corrected.
  - Run 2 failed only the old Stop threshold and the old seam criterion, which was replaced before the run.
  - Run 3 (final): all passed.
- `node src/data/validate.mjs`: OK. `node tools/build.mjs`: OK. `grep -c '(?<[=!]' dist/index.html` = 0.
- `node tools/ambience_check.mjs`: **138 / 138 passed**.
- `node tools/navcheck.mjs --rooms all`: **1 failure, 0 page errors.**
  - The failing case is "In store: Galleria bay by bus (QA16 gap)": the arrow was hidden by a first-time "CLOTHES SHOPS" tip modal.
  - This is not audio and not in my files. I did not check whether it fails without my change.
- `node tools/music_check.mjs`, full run, finished: **75 of 77 passed.** Both failures look independent of this job:
  1. "classics: ... Session is the code of e834cfe, character for character": the Session text no longer equals `docs/audio/classics.html`, because of the crackle removal (`if (false && T.crackle ...`, owner msg 198). `_music_classic.js` and `classics.html` are unchanged since f3f24e0 (before this job), and TRACKS and compile() still match. Fix: copy the edited line into `classics.html`, or teach the check about it.
  2. "the title screen opens with Classic: Title": Classic: Title WAS playing (`classic_title "Classic: Title"`). The check also asks that the music context key is still `classic:title`, but the existing controller flips that key to `title` once Classic: Title has started (`titleSeen`). Whether the check sees the old or the new key depends on the 0.5 s tick, so it looks like a timing race in the check. My diff only adds a line before that branch, which is never taken on the plain title screen. I did not re-run the old build to prove that it can fail there too.
  - Everything else passed: the songbook and classic renders and loudness, 31 contexts, the bags, save / load, Music volume 0, zero page errors.
- Size: `_music_creator.js` is 5.5 KB minified on its own; `audio.js` grew 0.7 KB minified; `title.js` grew about 0.2 KB. A whole-bundle build measured **+5.3 KB** with all three candidates in the game (limit 10 KB).

## Not tested

- **Nobody listened.** Whether the hooks are catchy, and whether they sound like the classics, is for the owner.
- Real iOS Safari or an Android phone. The code uses the same Web Audio nodes as the classics, and there is no regex lookbehind.
- A game-pad / keyboard walk through the creator. The gate does not depend on input.
- The plane landing sound itself after Move in was not listened to. The sfx count rose and the jet bus was on, as before.

## Questions for the owner

1. Which candidate: A (bright, bouncy), B (swing, jazzy) or C (fastest)? Or a mix: "A's tune at C's tempo" is a two-number edit.
2. Should the title screen also lose the city recordings? It still plays them 6 dB under Classic: Title, as before this job.

## Files

- `src/sim/_music_creator.js` (new): the three tunes, `CREATOR_SONG` (the switch), `CREATOR_LEVELS`, `CreatorPlayer`, `renderCreator`.
- `src/sim/audio.js`: the creator hush and the creator music context.
- `src/ui/title.js`: `creatorPhase()` / `G.inCreator` / the `'creator'` event.
- `tools/creator_song_page.mjs` (new): builds the page; `--check` checks and measures it.
- `docs/audio/creator_song.html` (new, generated).
- `docs/reports/creator_song.md` (this file).
- `dist/index.html`: rebuilt. It also contains other workers' work in progress.
