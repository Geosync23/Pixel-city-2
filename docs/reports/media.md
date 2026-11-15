# Phone media apps: Pages, Reel, PlayBox (owner msgs 95, 97, 98) — DONE, live since Stage 33 (worker report condensed by the lead)

- Apps (src/sim/apps.js CATALOG, cat 'life'): `pages` (day 1), `reel` (day 2), `playbox` (day 3). Deep links: pages { read | tab }, reel { film }, playbox { game }.
- Files: src/data/media.js (TUNE, fun table, games, Reel rules), src/sim/media.js (G.media, state G.state.media), src/sim/_media_films.js (4 cinema films + 9 TV shows, paint/thumbOf/pixText),
  src/story/shortreads.js (26 reads, 14,588 words; "The Fog Bell Affair" six-part mystery), src/ui/phone_reader.js, phone_reel.js, phone_play.js, phone_play_a.js, phone_play_b.js, phone_media.css, src/art/icons/media.js.
  Add-only edits: src/sim/_shows_films.js exports `filmCtx` (needed so films defined elsewhere can paint).
- Reel rules: 9 phone/TV-only shows are free from their release day and never play at the cinema. Cinema films (8) are NOT in the app until seen in full at the Orpheum (G.state.shows.seen[id]);
  TUNE.REEL.buyDelayDays = 2 days later they appear under "Now available to own" (notification) for TUNE.REEL.price = $5; bought films replay on the phone and on the home TV ("Stream on Reel", 20 min).
- Fun is deliberately small: per game hour Pages 6, Reel 6.5, PlayBox 8 (armchair novel 12, home TV 14, console 18, arcade 30). Shared screen-time pool: full rate for 45 min a day, tapering to x0.08 at 75 min.
  Ride/queue x1.25, bench x1.1. Moodlets nice_break / eyes_tired (past 100 min). Late night costs extra energy. 7 games (5 free, Cab Connect $8, Tap the Beat $12), 3 skins, a daily challenge, high scores.
- API: G.media (TUNE, context, rate, pool, begin, end, spend, reads, read, readProgress, finishRead, books, readBook, bookmark, films, filmState, canPlay, buyFilm, watched, nextShowing, watchWith, games, owns, buy, score,
  friends, daily, skin, setSkin, stats, sync), G.reel { play, player, control, tv }, G.playbox { start, state, api }. Events media:session, media:session:end, media:read:done, media:book:done, media:film:done,
  media:film:available, media:film:bought, media:score, media:daily, media:bought, media:tired, media:break, media:new, media:watchwith.
- Worker verified (ran): cinema -> wait -> buy at 49 h -> plays on phone + TV; unseen film cannot be played or bought; all 7 games two rounds with pointer input; reader features; old-save load; ~32 screenshots.
- Lead verified: clean build, all three apps install and open at 390x844 (Reel list screenshot), no page errors.
- NOT verified / gaps: a bus ride resuming after the phone closes (worker's teleport test never progressed, also without the phone); trains untested; audio; Reel/PlayBox natural release not watched;
  the 4 new cinema films use the generic poster (posterArt in src/art/performance/perf.js needs cases heist, lantern, bigclaw, extratime); G.minigame arcade games not in PlayBox.
