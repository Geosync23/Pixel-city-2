# Background music: the songbook (owner msg 137)

Worker report, 2026-11-15. "We need more music for background music. Lots more variety."

**Nobody on the team has heard any of this.** Every tune was written as notes and checked with measurements only. The owner's ears are the judge: the listening page is `docs/audio/jukebox.html` (the lead publishes it).

## What changed

- The eight generated loops are gone. The game now has **68 hand-written tunes** (166 minutes of music; each lasts 1:51 to 3:24 and plays once, start to finish, with an intro, different sections, often a second lead instrument, a counter line or a key change, and a written ending).
- Variety, counted by `tools/music_check.mjs`: 21 keys, 30 tempi (58 to 168 bpm), six metres (4/4, 3/4, 6/8, 2/4, 5/4, 12/8), 31 accompaniment styles (bossa, lo-fi, city pop, jazz waltz, ragtime stride, music box, surf, chiptune march, folk fingerpicking, bolero, 12/8 blues, synth-pop, ambient, shanty lilt, polka, swing with a walking bass, rock'n'roll, calypso, disco, 5/4, samba, doo-wop, habanera, motorik ...), 16 different lead instruments.
- 25 synthesised instruments (electric piano, piano, nylon and steel guitar, clean electric guitar, upright / electric / synth bass, vibraphone, marimba, music box, celesta, soft brass, clarinet, flute, strings, warm pad, organ, accordion, steel pan, soft square and pulse, synth lead, whistle, harp) and a small drum kit (kick, snare, rim, brush, hat, shaker, clap, ride "ting", woodblock, congas, tom).
- **No hiss:** the vinyl crackle option no longer exists. The only noise in the music is in the drum kit: one 0.25 s buffer used for bursts of 15 to 130 ms (hat 22-35 ms, shaker 40 ms, brush 90 ms, snare 130 ms, clap under 100 ms), all quiet. The ride cymbal is three short sine tones, not noise. No washes, risers or looping noise.
- Pools instead of single tracks, a shuffle bag saved with the game, musical endings on a change of place, a "Now playing" line with Skip in Settings, a dev jukebox, a check tool and a listening page.

## Files

| File | What |
|---|---|
| `src/sim/_music_synth.js` | the instruments and the drum kit (`Synth`, `INST`, `echo`); no game imports |
| `src/sim/_music_engine.js` | song format, accompaniment styles (`STYLES`), `compile(song)`, `Player` (schedule / wind / stop / pos), `renderSong` (offline) |
| `src/sim/_music_songs_a.js` .. `_d.js`, `_music_songs.js` | the songbook (A: title + day outdoors, B: evening, weather, seasons, C: interiors, D: rides, work, special) and the lookup |
| `src/sim/_music_pools.js` | which tune plays where, the pool lookup with fallbacks, the shuffle bag (`draw`, `played`, `putBack`) |
| `src/sim/_music_levels.js` | GENERATED trims (dB) that bring every tune to the same loudness |
| `src/sim/_audio_music.js` | now only the five stingers (unchanged) |
| `src/sim/audio.js` | the controller (music part rewritten; ambience, effects and the `watch` logic untouched) |
| `src/ui/phone_settings.js` | one add-only block: "Now playing: <title>" + Skip under the sliders |
| `tools/music_check.mjs` | the checks (static, offline render of every tune, live game) -> `out/music/report.json` |
| `tools/music_jukebox.mjs` | builds `docs/audio/jukebox.html` (92 KB, self-contained, the same synthesis source files inlined) |

Size: music source 85 KB (limit given: 150 KB). The game file was 14,336 KB when this work started and is 14,456 KB now; about 80 KB of that is the music (85 KB of new source plus the controller, minus the 10 KB of old loops); the rest came from other workers in the same hours.

## How a tune is written

Everything is composed in C (major or natural minor) and moved to its key with `tr`. A song has parts (`P`), each with chords and a lead line, sometimes a counter line (`h`) or a written bass; a `form` string arranges them.

```js
{ id: 'lanterns', title: 'Lantern Street', feel: 'swing', out: 'golden evening|oldtown arts market', pl: 'cafe', bpm: 132, tr: -7, style: 'swing',
  ins: { m: 'clarinet', m2: 'vibes', h: 'brass', c: 'ep', b: 'upright' },
  P: { I: { c: 'C6 A7 Dm7 G7' },
       A: { c: 'C6 A7 Dm7 G7 Em7 A7 Dm7,G7 C6', m: ".5356-5- #1-3-5-3- .4246-4- 2-,7-5-4- .5357-5- 6-5-3-#1- 2-4-5-7- '1-----..", h: '5 5 4 4 5 5 44 3' },
       B: { c: 'Gm7 C7 FM7 % Am7 D7 Dm7 G7', m: "b7-'2-'4-'2- ..." } },
  form: 'I A A B A A~ A~& B A!', end: 'C69' }
```

- Lines: one word per bar, split evenly among its tokens (8 tokens in 4/4 = eighths, 12 = triplets). Token = scale degree 1-7, `'` octave up, `,` octave down, `#` / `b`; `-` holds; `.` rests.
- Chords: one word per bar, commas split the bar, `%` repeats. 29 chord qualities (7ths, 9ths, 13, sus, dim, m7b5, 7b9, 6/9, slash basses ...). Voicings are rootless when there is a bass and stay inside one octave window, so common tones hold and the others move by step.
- Form marks: `-d` drop layers, `=cb` only these layers, `&` add the counter line, `~` second lead instrument, `+` / `_` octave, `!` / `?` louder / softer, `^2` key change.
- The style supplies the comping rhythm, the bass (roots, fifths, walking tones, approach notes to the next chord) and the drum pattern with a tom fill at the end of a section. Timing and loudness get a small seeded human touch (plus or minus 6 ms, 8 %); the notes themselves are all written.
- A mistake in the data (bar counts that do not match, an unknown chord, a lead out of range) fails `music_check`.

## The songbook

Columns: title, feel, where it plays, key, tempo, metre, form, length as rendered, instruments, then measured loudness (LUFS) / true peak (dBTP) / share of energy above 6 kHz / spectral flatness.

| Title | Feel | Plays | Key | bpm | Metre | Form | Length | Instruments | LUFS / peak / >6 kHz / flatness |
|---|---|---|---|---|---|---|---|---|---|
| Hello, Maple Bay | city-pop ballad | Title screen | Eb | 84 | 4/4 | `I-d A A& B C~ B! C O?` | 2:44 | flute, vibraphone, clarinet, electric piano, electric bass, strings, drums | -17.0 / -4.6 / 0.0% / 0.0000 |
| Postcard From the Pier | jazz waltz | Title screen; Cafes and bakeries | F | 138 | 3/4 | `I=cb A A& B A~ B A! O` | 2:29 | vibraphone, clarinet, electric piano, upright bass, drums | -17.0 / -3.3 / 0.1% / 0.0001 |
| First Ferry Home | folk fingerpicking | Title screen; At home; Outdoors: dawn, morning (harbor, old town) | G | 96 | 4/4 | `I-d A-d A~ B C B& C! O` | 2:23 | whistle, clarinet, steel-string guitar, drums | -17.0 / -8.3 / 0.0% / 0.0000 |
| Dew on the Tramlines | ambient pads | Outdoors in fog; Library, bookshop and classrooms; Museum, aquarium, observatory, conservatory; On the plane; Outdoors: dawn | D | 66 | 4/4 | `A=cp A B A& B A?` | 2:59 | vibraphone, flute, celesta, upright bass, warm pad | -17.0 / -2.2 / 0.0% / 0.0000 |
| Milk Round | music-box waltz | Outdoors in the snow; At home, morning routine; Outdoors: dawn, morning (suburb, old town, park, market) | A | 108 | 3/4 | `A-b A B A B A?` | 2:16 | music box, celesta, harp | -17.0 / -4.2 / 0.1% / 0.0000 |
| Gulls Before Breakfast | harbor lilt in 6/8 | Outdoors: dawn, morning (harbor, park, suburb) | G | 60 | 6/8 | `I-p A A B A~ B A& O` | 1:55 | flute, clarinet, harp, upright bass, strings | -17.0 / -5.7 / 0.0% / 0.0000 |
| Open Shutters | bossa nova | Shops and the mall; Cafes and bakeries; Outdoors: morning, midday (old town, arts quarter, market, harbor) | F | 126 | 4/4 | `I A B A~ B A! O` | 2:21 | flute, vibraphone, nylon guitar, upright bass, drums | -17.0 / -3.2 / 0.0% / 0.0000 |
| Bakery Run | ragtime stride | At home, morning routine; On the bus; Outdoors: morning, midday, afternoon (old town, suburb, market, downtown) | C | 104 | 4/4 | `I A A~ B B A!` | 3:17 | piano, clarinet | -17.0 / -3.6 / 0.2% / 0.0001 |
| Crosswalk Shuffle | city pop | Shops and the mall; Cab radio; Outdoors: morning, midday, afternoon (downtown, airport, arts quarter) | E | 108 | 4/4 | `C-d A A B A~ C=cbd B! A! A^1!` | 2:26 | synth lead, vibraphone, electric piano, electric bass, strings, drums | -17.0 / -2.5 / 0.0% / 0.0007 |
| Paper Boats | folk fingerpicking | At home; On the bus; With the family; Outdoors: morning, afternoon, golden hour (park, suburb, harbor) | D | 84 | 4/4 | `I A A B A~+ B& A O` | 2:44 | clarinet, flute, nylon guitar | -17.0 / -6.0 / 0.0% / 0.0000 |
| Stallholder's Polka | market polka | Festival days; Outdoors: morning, midday, afternoon (market, old town) | Bb | 116 | 2/4 | `I A A~ B A C~ C A! O` | 2:08 | clarinet, accordion, upright bass, drums | -17.0 / -2.9 / 0.7% / 0.0000 |
| Noon Whistle | chiptune march | Festival days; Outdoors: midday, afternoon (downtown, market, airport) | C | 120 | 4/4 | `I A A& B A B^2 A^2&! A^2!` | 1:59 | soft square lead, pulse keys, synth bass, drums | -17.0 / -1.5 / 0.0% / 0.0003 |
| High Tide Reel | harbor shanty lilt | Outdoors on a hot afternoon; Festival days; Outdoors: midday, afternoon, golden hour (harbor, market) | D | 92 | 6/8 | `I A A B A~ B A! I=cbd A~ B&! A! A O` | 2:03 | accordion, whistle, clarinet, nylon guitar, upright bass, drums | -17.0 / -2.9 / 0.0% / 0.0001 |
| Five Corners | jazz in 5/4 | Cafes and bakeries; Outdoors: midday, afternoon, evening (arts quarter, downtown) | G minor | 152 | 5/4 | `I A A B A~ B A! O?` | 1:54 | vibraphone, clarinet, electric piano, upright bass, drums | -17.0 / -3.2 / 0.1% / 0.0001 |
| Sprinkler Sunday | lazy shuffle | Outdoors on a hot afternoon; Diners and quick food; On the bus; Outdoors: midday, afternoon (suburb, park, harbor) | A | 92 | 4/4 | `I A C B C~ B! A C` | 2:40 | whistle, clean electric guitar, steel-string guitar, upright bass, drums | -17.0 / -4.5 / 0.0% / 0.0003 |
| Glass Towers | synth-pop | Gym, pool and arena; Cab radio; On the train and the air tram; Outdoors: afternoon, evening (downtown, airport, arts quarter) | F# minor | 116 | 4/4 | `I-d I A A B A~ B D-d B! A D` | 2:32 | synth lead, vibraphone, pulse keys, synth bass, warm pad, drums | -17.0 / -1.9 / 0.0% / 0.0001 |
| Mural Alley | lo-fi hip-hop | During a work shift; Offices, bank, City Hall, clinic; Outdoors in the rain; Outdoors: afternoon, golden hour (arts quarter, old town, downtown) | Db | 78 | 4/4 | `A=c A A& B A~ B A?` | 2:56 | vibraphone, nylon guitar, clarinet, electric piano, electric bass, drums | -17.0 / -1.9 / 0.1% / 0.0003 |
| Kite Weather | light waltz | With the family; Outdoors: afternoon, golden hour (park, suburb, harbor) | Bb | 144 | 3/4 | `I-p A B A~ B A! O` | 1:53 | flute, clarinet, harp, upright bass, strings | -17.0 / -6.0 / 0.1% / 0.0000 |
| Amber Windows | bolero | Date night; Outdoors: golden hour, evening (old town, harbor, market, arts quarter) | E minor | 96 | 4/4 | `I-d A A~ B A B~ A! O?` | 2:23 | clarinet, vibraphone, nylon guitar, upright bass, strings, drums | -17.0 / -4.7 / 0.1% / 0.0001 |
| Last Light on the Water | slow ballad | Outdoors: golden hour, evening (harbor, park, suburb, airport) | Ab | 72 | 4/4 | `A=cp A A~+ B A B~+ A!` | 3:11 | soft brass, flute, electric piano, electric bass, strings, drums | -17.0 / -4.3 / 0.0% / 0.0001 |
| Neon Laundry | night funk | Gym, pool and arena; Bars and clubs; Cab radio; Outdoors: evening, late night (downtown, arts quarter, airport) | B minor | 104 | 4/4 | `I-d I A A B A~ I=cbd B! A~! I` | 2:31 | synth lead, soft brass, electric piano, electric bass, drums | -17.0 / -2.3 / 0.0% / 0.0003 |
| Lantern Street | swing | Cafes and bakeries; Outdoors: golden hour, evening (old town, arts quarter, market) | F | 132 | 4/4 | `I A A B A A~ A~& B A!` | 2:07 | clarinet, vibraphone, soft brass, electric piano, upright bass, drums | -17.0 / -3.7 / 0.1% / 0.0000 |
| Porch Light | slow blues in 12/8 | Bars and clubs; Outdoors: evening, late night (suburb, park, harbor, old town) | G | 66 | 12/8 | `I A B A~ E` | 2:44 | accordion, clean electric guitar, steel-string guitar, upright bass, drums | -17.0 / -2.3 / 0.0% / 0.0002 |
| Blue Hour Tram | lo-fi night | Outdoors in the rain; At home, late at night; At home while it rains; On the plane; Outdoors in a storm; Outdoors: evening, late night (downtown, arts quarter, airport) | C minor | 70 | 4/4 | `A=cp A B A~ B A?` | 2:49 | electric piano, vibraphone, nylon guitar, electric bass, warm pad, drums | -17.0 / -1.9 / 0.0% / 0.0002 |
| Moon Over the Slipway | nocturne | Library, bookshop and classrooms; At home, late at night; Outdoors in fog; Outdoors: late night (harbor, old town, market, park) | D minor | 58 | 4/4 | `A=cp A B A~ B A?` | 3:23 | clarinet, vibraphone, nylon guitar, upright bass, warm pad | -17.0 / -4.1 / 0.1% / 0.0000 |
| The City Turns Over | music-box lullaby | At home, late at night; Outdoors in the snow; Outdoors: late night, dawn (suburb, park, downtown, airport, arts quarter) | D | 76 | 4/4 | `A-b A B A B A?` | 2:35 | music box, celesta, harp, warm pad | -17.0 / -3.9 / 0.1% / 0.0000 |
| Gutter Song | rainy lo-fi piano | Outdoors in the rain; Outdoors in a storm; At home while it rains | A minor | 76 | 4/4 | `A=c A A~ B A B~ A?` | 3:01 | piano, vibraphone, electric piano, upright bass, drums | -17.0 / -1.4 / 0.0% / 0.0002 |
| A Street of Umbrellas | slow jazz waltz | Outdoors in the rain; Outdoors in a storm; At home while it rains | E minor | 104 | 3/4 | `I-d A B A~ B A?` | 2:28 | vibraphone, clarinet, nylon guitar, upright bass, drums | -17.0 / -2.9 / 0.1% / 0.0001 |
| Wait It Out | minor blues in 12/8 | Outdoors in a storm; Bars and clubs | G minor | 60 | 12/8 | `I A B A~ E?` | 3:00 | clean electric guitar, organ, electric bass, drums | -17.0 / -2.4 / 0.0% / 0.0001 |
| First Snow, No Footprints | celesta waltz | Outdoors in the snow | Db | 92 | 3/4 | `A-b A B A~ B A?` | 2:39 | celesta, flute, harp, upright bass, strings | -17.0 / -2.8 / 0.0% / 0.0000 |
| Harbor in the Fog | ambient vibes | Outdoors in fog; Museum, aquarium, observatory, conservatory | B minor | 58 | 4/4 | `A=cp A B A& B A?` | 3:23 | vibraphone, clarinet, celesta, upright bass, warm pad | -17.0 / -2.0 / 0.0% / 0.0000 |
| Heat Haze | calypso | Outdoors on a hot afternoon; Festival days; Outdoors in summer: midday, afternoon, golden hour | C | 104 | 4/4 | `I A A~ B A B~ A! I` | 2:12 | steel pan, marimba, nylon guitar, electric bass, drums | -17.0 / -1.7 / 0.0% / 0.0002 |
| Blossom Confetti | spring gavotte | At home, morning routine; Outdoors in spring: dawn, morning, midday, afternoon, golden hour | G | 112 | 4/4 | `A-d C B C~ B A~ C!` | 2:03 | flute, marimba, harp, upright bass, drums | -17.0 / -5.3 / 0.0% / 0.0000 |
| Ice Pop Parade | surf | Outdoors on a hot afternoon; Diners and quick food; Outdoors in summer: morning, midday, afternoon, golden hour | E | 152 | 4/4 | `I A A B A+ I=cbd B A+ B A!` | 1:57 | clean electric guitar, electric bass, drums | -17.0 / -2.2 / 0.1% / 0.0007 |
| Leaf Pile | autumn jig in 6/8 | Outdoors in autumn: morning, midday, afternoon, golden hour, evening | D minor | 76 | 6/8 | `I-d A A B A~ B A I A~ B A!` | 2:10 | clarinet, flute, nylon guitar, upright bass, drums | -17.0 / -4.6 / 0.1% / 0.0000 |
| Mittens on a String | winter celesta shuffle | Outdoors in the snow; Outdoors in winter: dawn, morning, midday, afternoon, golden hour, evening | B | 100 | 4/4 | `A-d A B A~ B A!` | 1:58 | celesta, music box, harp, upright bass, strings, drums | -17.0 / -3.6 / 0.0% / 0.0000 |
| Steam on the Window | cafe swing | Cafes and bakeries; Hotel, fine dining and foyers; Outdoors: morning (arts quarter, old town) | Bb | 126 | 4/4 | `I A A B C A~ A~ B C!` | 2:13 | piano, vibraphone, upright bass, drums | -17.0 / -3.2 / 0.1% / 0.0001 |
| Two Cortados | minor bossa | Cafes and bakeries; Date night; Outdoors: golden hour, evening (arts quarter, market, old town) | D minor | 132 | 4/4 | `I A A B A~ B A I=cbd B~ A! O` | 2:20 | vibraphone, flute, nylon guitar, upright bass, drums | -17.0 / -3.1 / 0.1% / 0.0001 |
| Fries With That | jukebox rock'n'roll | Diners and quick food | A | 160 | 4/4 | `I A B A~+ A=cbd B! A~+ A! E` | 2:21 | clean electric guitar, piano, electric bass, drums | -17.0 / -2.1 / 0.1% / 0.0007 |
| Malted Moon | doo-wop ballad | Diners and quick food | Eb | 72 | 12/8 | `I A A B A~_ B A!` | 2:57 | vibraphone, soft brass, piano, upright bass, drums | -17.0 / -1.5 / 0.0% / 0.0004 |
| Last Call Blues | jazz blues | Bars and clubs | Bb | 96 | 4/4 | `I A B A~+ B! A E` | 2:53 | soft brass, piano, upright bass, drums | -17.0 / -2.0 / 0.0% / 0.0002 |
| Back Booth | organ shuffle | Bars and clubs | F minor | 112 | 4/4 | `I A A B A~ B A! I` | 2:03 | clean electric guitar, organ, electric bass, drums | -17.0 / -1.6 / 0.0% / 0.0005 |
| Aisle Seven | shop-floor bossa | Shops and the mall; Offices, bank, City Hall, clinic; Outdoors: midday, golden hour (market, downtown, airport) | G | 116 | 4/4 | `I A A B A~ B A I?` | 1:59 | marimba, flute, electric piano, electric bass, strings, drums | -17.0 / -3.0 / 0.0% / 0.0001 |
| Escalator Up | mall disco, softly | Shops and the mall; Cab radio; Outdoors: midday, afternoon, golden hour (airport, downtown, market) | Eb | 118 | 4/4 | `I-d A A B A~ I=cbd B A!` | 1:57 | vibraphone, synth lead, electric piano, electric bass, strings, drums | -17.0 / -3.4 / 0.0% / 0.0000 |
| One More Rep | gym disco-funk | Gym, pool and arena | E minor | 124 | 4/4 | `I=bd I A A B A~ I=cbd B! A! B!` | 2:15 | synth lead, soft brass, electric piano, synth bass, drums | -17.0 / -1.9 / 0.0% / 0.0003 |
| Laps | motorik pulse | Gym, pool and arena; On the train and the air tram | D | 132 | 4/4 | `I=cb A A B A~ C I=cbd B A!` | 1:59 | soft square lead, synth lead, pulse keys, synth bass, warm pad, drums | -17.0 / -2.6 / 0.0% / 0.0001 |
| Whisper Shelf | harp and celesta, hushed | Library, bookshop and classrooms; Museum, aquarium, observatory, conservatory; Outdoors in fog; Lobbies and other rooms; Outdoors: dawn (old town, arts quarter, market, harbor) | A | 72 | 4/4 | `A-b A B A B A?` | 2:43 | celesta, harp | -17.0 / -2.0 / 0.0% / 0.0000 |
| Marble Hall | sarabande | Museum, aquarium, observatory, conservatory; Library, bookshop and classrooms | D minor | 72 | 3/4 | `A=cp A B A~+ B A! A?` | 2:23 | clarinet, flute, harp, upright bass, strings | -17.0 / -3.1 / 0.1% / 0.0000 |
| Lobby Piano, Four O'Clock | solo piano ballad | Hotel, fine dining and foyers; Date night; At home, late at night | Db | 68 | 4/4 | `A C B C B C?` | 2:53 | piano | -17.0 / -2.5 / 0.3% / 0.0001 |
| Revolving Door Waltz | hotel waltz | Hotel, fine dining and foyers | Ab | 150 | 3/4 | `I A B A~ B A! A?` | 2:03 | piano, clarinet, upright bass, strings | -17.0 / -3.4 / 0.1% / 0.0000 |
| Kettle On | cosy shuffle | At home; Lobbies and other rooms; With the family | C | 88 | 4/4 | `A-d C B C~ B A~ C!` | 2:36 | electric piano, clarinet, nylon guitar, upright bass, drums | -17.0 / -3.2 / 0.3% / 0.0001 |
| Toast and Slippers | morning bounce | At home, morning routine; At home; Outdoors: dawn, morning (suburb) | F | 112 | 4/4 | `A-d C B C~+ B A C!` | 2:03 | clarinet, marimba, upright bass, drums | -17.0 / -6.2 / 0.0% / 0.0000 |
| One Lamp On | late-night ballad | At home, late at night | E | 62 | 4/4 | `A=cp A B A~ B A?` | 3:10 | nylon guitar, electric piano, upright bass, warm pad | -17.0 / -1.6 / 0.0% / 0.0000 |
| Rain on the Pane | piano waltz, minor | At home while it rains; Outdoors in the rain; Outdoors in the snow | B minor | 96 | 3/4 | `A-b A B A~ B A?` | 2:33 | piano, celesta, harp, upright bass, strings | -17.0 / -2.4 / 0.1% / 0.0000 |
| Watering the Plants | habanera, lightly | At home; At home, morning routine; During a work shift; Outdoors on a hot afternoon; Lobbies and other rooms; Outdoors: morning, midday (park, suburb) | A | 100 | 4/4 | `I A A~ B A B~ A!` | 2:07 | marimba, flute, nylon guitar, upright bass, drums | -17.0 / -3.2 / 0.0% / 0.0000 |
| Cab Radio, Channel Two | radio funk-pop | Cab radio; Gym, pool and arena; Outdoors: morning, midday (downtown, airport) | G | 116 | 4/4 | `I-d A A B A~ I=cbd B! A!` | 1:59 | soft brass, vibraphone, electric piano, electric bass, drums | -17.0 / -2.9 / 0.0% / 0.0003 |
| Meter Running | late-night soul | Cab radio; Outdoors: late night (downtown, market, harbor, old town) | Bb minor | 84 | 4/4 | `A=cb A A~ B A B~ A?` | 2:44 | flute, electric piano, electric bass, drums | -17.0 / -3.1 / 0.0% / 0.0002 |
| Window Seat | easy guitar ballad | On the bus; Outdoors: morning, midday, golden hour (suburb, park) | E | 104 | 4/4 | `I-d A A~ B A B~ A!` | 2:03 | whistle, steel-string guitar, upright bass, drums | -17.0 / -4.0 / 0.0% / 0.0001 |
| Clickety Line | train-beat twang | On the train and the air tram; On the bus | A | 126 | 4/4 | `I A C B C~+ B A~+ C!` | 1:57 | clean electric guitar, whistle, steel-string guitar, upright bass, drums | -17.0 / -2.8 / 0.0% / 0.0000 |
| Bay Express | motorik in minor | On the train and the air tram; On the plane; Outdoors: evening, late night (airport, downtown, harbor) | Db minor | 126 | 4/4 | `I=cbp I A A B A~_ I=cbd B A!` | 1:57 | vibraphone, synth lead, pulse keys, synth bass, warm pad, drums | -17.0 / -2.3 / 0.1% / 0.0001 |
| Above the Weather | airy synth | On the plane; Outdoors: dawn, morning, late night (airport, downtown) | B | 92 | 4/4 | `A=cp A B A~ B A?` | 2:08 | synth lead, celesta, pulse keys, synth bass, warm pad, drums | -17.0 / -2.6 / 0.0% / 0.0000 |
| Inbox Zero | marimba ostinato | During a work shift; Offices, bank, City Hall, clinic; Lobbies and other rooms; Outdoors: dawn, morning (downtown, arts quarter) | Bb | 100 | 4/4 | `A=cb A B A~ B A A?` | 2:17 | celesta, flute, marimba, upright bass, drums | -17.0 / -2.6 / 0.0% / 0.0000 |
| Steady Hands | soft lo-fi | During a work shift; Offices, bank, City Hall, clinic; Lobbies and other rooms; Outdoors: dawn, golden hour (downtown, arts quarter, market) | F | 82 | 4/4 | `A=cb A A~ B A B~ A?` | 2:48 | nylon guitar, vibraphone, electric piano, electric bass, drums | -17.0 / -2.3 / 0.0% / 0.0000 |
| Candle for Two | tango-habanera | Date night; Outdoors: evening (market, harbor, park) | A minor | 108 | 4/4 | `I A A~ B A C C~ B A!` | 2:34 | accordion, clarinet, nylon guitar, upright bass, strings, drums | -17.0 / -3.8 / 0.0% / 0.0000 |
| Walk Me Home | slow-dance swing | Date night; Hotel, fine dining and foyers; Outdoors: evening, late night (old town, market, suburb) | Eb | 76 | 4/4 | `A A B A A~ B A?` | 3:01 | clarinet, electric piano, upright bass, drums | -17.0 / -3.8 / 0.2% / 0.0001 |
| Nana's Table | family waltz | With the family; At home; Outdoors: golden hour (suburb, old town) | G | 126 | 3/4 | `I A B A~ B A!` | 2:03 | accordion, clarinet, nylon guitar, upright bass | -17.0 / -5.0 / 0.2% / 0.0000 |
| Confetti Parade | street samba | Festival days | F | 104 | 4/4 | `I=d I A A~ B A B~ A! A^2!` | 2:31 | soft brass, steel pan, nylon guitar, electric bass, drums | -17.0 / -2.7 / 0.0% / 0.0009 |
| Ferris Wheel | fairground waltz | Festival days | A | 168 | 3/4 | `I A B A~ B A! A?` | 1:50 | whistle, soft square lead, organ, upright bass | -17.0 / -5.3 / 0.0% / 0.0000 |

## Where and when (the controller, `src/sim/audio.js`)

Every half second the controller works out the context: `{ g: kind of place, key: pool }`.

| Context | Pool |
|---|---|
| Title screen | `title` (3 themes) |
| Outdoors | `out:<time>:<district>:<season>`. Times: dawn 4:30-7, morning 7-11, midday 11-14, afternoon 14-17, golden hour 17-19:30, evening 19:30-23, late night 23-4:30. District flavours: downtown, old town, harbor (also the waterfront and the railyard), park, suburb (Maplewood, Hillcrest), arts quarter, market (around Market Square), airport. Every one of the 7 x 8 x 4 combinations has at least 3 tunes of its own; each season adds its own tune (Blossom Confetti, Ice Pop Parade + Heat Haze, Leaf Pile, Mittens on a String) |
| Weather outdoors | `rain` (5), `storm` (4), `snow` (5), `fog` (4); `heat` (5) on a clear midday / afternoon at 29 C or more |
| A festival day, in the event's district | `festival` (6): uses `G.cityEvents.live()` |
| Rooms | by the scene id: `cafe` (6), `diner` (4), `bar` (5), `shop` (4), `gym` (5), `library` (4), `museum` (4), `hotel` (4: hotel, fine dining, foyers, SkyDeck), `office` (4), the station -> `train`, the airport terminal -> the airport's outdoor pools, the plane -> `plane` (4) |
| Home | `home` (6); 5-10 h `home_am` (5); 22-5 h `home_late` (5); while it rains `home_rain` (4); grandma's house `family` (4) |
| Rides | cab `cab` (6), bus `bus` (5), train and air tram `train` (4) (`ride:start` / `ride:end`) |
| A work shift (`G.jobs.onShift()`) | `work` (4) |
| A relationship story scene (`G.rel.active()`, friends' scenes too) or `G.audio.mood('date')` | `date` (5) |
| Lobbies, stairwells, unknown rooms | whatever is playing carries on; if nothing is, `room` (5) |

Rules:

1. **One tune, once, then quiet.** A tune plays start to finish; then a gap of 20 to 50 s (5 s on the title screen; it was 45 to 105 s with two or three repeats of one loop).
2. **Shuffle bag, saved** in `G.state.audio.mus` (`bags`, `last`, `recent`; old saves get it on load). Never the same tune twice in a row; inside a pool no tune comes again before the others have played; the five most recent tunes of other pools are avoided when the pool allows. If all that is left in a bag is the tune heard a moment ago in another pool, the next round starts instead.
3. **A change of the kind of place ends the tune musically**: it finishes its bar, fades over 1.6 s, and the tune for the new place starts 2.5 to 5 s later. Walking between districts, the clock moving to the next time of day or a change of weather does NOT cut a tune: the next pick follows the new context. A tune that was cut in its first 20 s goes back into its bag.
4. **Watching** (owner msg 135, unchanged): while a show, a film, Reel or the TV is on, and for 12 s after, the music stays out.
5. **Stingers** are unchanged (`G.audio.stinger`).
6. Music volume 0, Master 0 or Mute stop the tune; nothing is created before the first touch; without Web Audio everything stays silent.
7. Each tune goes through its own peak limiter (threshold -9 dB, ratio 6, 3 ms attack) after its trim, so every tune reaches the Music slider at the same loudness with peaks under -1 dBTP.

API (all on `G.audio`): `music(id | pool | null)`, `nowPlaying()`, `skip()`, `mood(name | null, minutes)`, `debug.music()` (what is playing, the context, its pool, what is left in the bag, the tune held for next), `debug.jukebox()` (chooser for any tune), `debug.musicKit()` (for the check tool). `info().track` is the id of the tune.

**Dev-menu row for the lead** (`src/ui/devmode.js`, inside the `sec('Sound')` block, after the ambience row):

```js
row(act('Jukebox…', () => G.audio.debug.jukebox()), act('Music now', k(() => { const m = G.audio.debug.music(); toast(m.playing ? m.playing.title + ' (' + m.playing.where + '; pool of ' + m.pool.length + ', next ' + (m.next || '-') + ')' : 'No tune: next in ' + m.gap + ' s from ' + (m.context ? m.context.key : '-')); })));
```

## The numbers (`node tools/music_check.mjs`: 61 of 61 checks passed)

Rendered by the shipped code (`dist/index.html`, OfflineAudioContext in headless Chromium, 48 kHz), with the trims:

| Measure | Result |
|---|---|
| Tunes / total length | 68 / 166 min; shortest 1:51, longest 3:24 |
| Integrated loudness (EBU R128, ffmpeg) | every tune -17.0 LUFS (target -17; the old loops measured -15.1 to -17.5) |
| True peak | highest -1.4 dBTP: no clipping |
| Through a small speaker (nothing under 200 Hz) | -20.1 to -17.4 LUFS: the tunes stay within 2.7 LU of each other |
| Energy above 6 kHz, whole tune | worst three: Stallholder's Polka 0.66 %, Kettle On 0.32 %, Lobby Piano 0.28 % (white noise 75 %, pink noise 23 %) |
| Energy above 6 kHz, loudest second | worst three: Kettle On 0.13 %, Mural Alley 0.07 %, Blue Hour Tram 0.06 % |
| Spectral flatness, whole tune | worst three: Confetti Parade 0.0009, Crosswalk Shuffle 0.0007, Ice Pop Parade 0.0007 (white noise 0.28, pink 0.25 in the same measure) |
| Spectral flatness, loudest second | worst three: Neon Laundry 0.0006, Noon Whistle 0.0004, Fries With That 0.0003 |
| Different pieces | per tune (median): 3 different sections, 8 chords, 12 lead pitches; none under 2 / 5 / 7 |
| Melodic contour (opening 40 notes, intervals + rhythm, longest common subsequence) | closest pairs 0.55 (The City Turns Over ~ Toast and Slippers), 0.50 (Mittens ~ Confetti Parade), 0.47; median 0.23; limit 0.6 |
| Loudness range inside a tune (LRA) | up to 8.8 LU (quiet intros and codas) |

Live, in the game by touch (390 x 844, phone viewport):

- no AudioContext and no music before the first touch;
- 32 contexts, each plays a tune of the right pool: title, 8 outdoor spots (every district flavour, every time of day), rain / storm / snow / fog, cafe, pizza place, bar, grocery, gym, library, museum, office, station, home at 14 h / 7 h / 23:30, cab, bus, train, a work shift, date / family / festival moods;
- 14 real starts in one place: no tune twice in a row, the pool of 8 played through before any came again;
- 200 picks through the bag across 15 pools: no immediate repeat, the bag rule held on every pick;
- music stops when a show starts, stays off through the show and the TV, comes back 20 s after;
- starting a tune: longest frame 17 to 67 ms over four runs (limit 100 ms; 99th percentile 16.8 ms); picking, compiling and the first notes take 2 to 4 ms;
- zero page errors, zero audio errors.

Other checks: `node src/data/validate.mjs` OK; `node tools/build.mjs` OK; `node tools/ambience_check.mjs`: the first full run had one timing check fail under CPU load ("stretch crossfades are equal power" 1.00..1.29, a recorded-bed check this work does not touch); the live part run again alone passed 107 of 107. The jukebox page: 68 tunes, plays and stops in Chromium (light and dark), no external requests, no sideways scroll at 390 px.

The mix is deliberately mellow (little above 6 kHz) and the bass instruments carry strong 2nd and 3rd harmonics so a line is heard on a phone. Whether it is TOO mellow on an iPhone speaker is for the owner's ears.

## What nobody has heard, and what is rough

- All 68 tunes: whether the melodies are pleasant, whether any instrument is ugly (the accordion, the soft square lead and the whistle are the most exposed), whether the limiter is audible, the balance against the recorded street bed, the level on a phone speaker.
- The check renders in Chromium; Safari on the iPhone runs the same Web Audio nodes but has not been measured.
- The melodies are simple and diatonic for the most part; the harmony carries most of the colour. Several tunes share a common chord pattern (I vi ii V, 12-bar blues): they differ in key, metre, feel and melody.
- A regular date (`_rel_dates.js` `runDate`) is not detected: only relationship story scenes are (`G.rel.active()`). One line fixes it when the lead wants: `G.audio.mood('date', 180)` when a date starts (it ends by itself on `rel:date`, or `G.audio.mood(null)`). The same call gives `family` or `festival` to any scene.
- The "Now playing" row has not been seen on a real phone (it is built with the phone kit's own `btn`, inside the Sound card).
- While you work a shift the `work` pool wins over the venue's own pool.
- A tune held as "next" is taken out of its bag; if the game is closed before it plays, it misses that round.

## Owner questions

1. Listen to `docs/audio/jukebox.html` and name the tunes or instruments to cut, quieten or rework. Cutting a tune is one line.
2. Is the overall music level right against the street recordings, and is the 20 to 50 s gap between tunes right (shorter, longer, none indoors)?
3. Is the mix bright enough on the iPhone speaker, or too soft / muffled?
4. Should a work shift keep the venue's own music (a shift at the cafe plays the cafe pool) instead of the light work pool?
5. More of any kind? The format makes a new tune about one kilobyte.

## Summary

68 hand-written tunes in 28 named pools plus 224 outdoor pools replace the eight loops; a saved shuffle bag stops repeats; tunes end on the bar when the place changes; music still steps out for shows and TV. All synthesised, 85 KB of source, no noise beyond drum bursts under 130 ms. 61 of 61 checks pass; loudness is equal to 0.1 LU across the book and nothing clips. Nobody has heard it.
