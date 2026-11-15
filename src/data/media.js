// Media apps (Pages / Reel / PlayBox): tuning and catalogues. Rules live in src/sim/media.js; texts in src/story/shortreads.js; films in src/sim/_media_films.js.
//
// FUN "A BIT BUT NOT TOO MUCH" (owner msg): every phone app pays clearly LESS fun per game hour than the real place it imitates.
//
//   what                         fun / game hour      compare with (src/data/activities.js, src/sim/shows.js)
//   ---------------------------  -------------------  ------------------------------------------------------------
//   Pages: novel / short read    6                    read_novel at a bookshelf 12 / library nook 12 (+creativity xp 4/h; phone 3/h)
//   Pages: skill book            -2 (same as home)    read_skill_book -2, xp 60/h at home; phone 45/h (75%)
//   Reel: any show or owned film 6.5                  watch_tv 14 at home (Reel on the home TV pays that same 14); the Orpheum pays a +38 lump per film + Movie Magic
//   PlayBox: any game            8                    play_games 18 at home (+logic xp 6/h; phone 2/h); lobby arcade 30
//
//   SCREEN TIME (shared by the three apps, resets every game day): the first SCREEN.full minutes pay the full rate, then the rate slides
//   down to SCREEN.floor (x0.08) at SCREEN.taper minutes and stays there. App-hopping does not dodge it: one pool.
//     30 min  ->  +3.0 .. +4.0 fun       60 min  ->  about +5.5 .. +7.3       3 h  ->  about +7 .. +9.5 (then nothing more that day)
//   Natural fun decay keeps running (about 3.3 an hour awake), so a long phone binge ends up BELOW where it started.
//   Context: on a bus / train / cab ride or waiting for doors or in a queue x1.25 ("made for this"); on a bench outdoors x1.1; home and
//   everywhere else x1.0. Even at x1.25 every app stays under 60% of its at-home equivalent.
//   Moodlets: 'nice_break' (+2 mood, 90 min) after a short session (8+ min, while the day's pool is still under SCREEN.full + 5);
//             'eyes_tired' (-3 mood, 2 h) once the day's pool passes SCREEN.tired minutes.
//   Late night (23:00-05:00): -1.5 energy per hour of screen on top of normal decay. No app touches hunger, bladder, hygiene or social.
//   Time: reading and playing run the game clock at CLOCK.read / CLOCK.play game minutes per real second (the world is paused behind the phone, as with
//   every app); a film costs FILM_MINUTES game minutes however long it is; an owned book is read in 15/30/60-minute sittings.
//
// REEL CONTENT RULES (owner msgs, 2026-11-15): two kinds of content.
//   1. Phone & TV-only shows (TV_SHOWS in _media_films.js): free in the app from their release day, also streamable on the home TV. Never at the cinema.
//   2. Cinema films (the Orpheum's programme): not in the app until you have SEEN the film at the cinema; REEL.buyDelayDays game days later it
//      appears in the app to BUY for REEL.price; once bought you can re-watch it on the phone and on the home TV. Unseen films are only listed
//      as "In cinemas now" with the next showtime and Take me there. Films seen before this update are buyable straight away.
export const TUNE = {
  fun: { read: 6, book_novel: 6, book_skill: -2, watch: 6.5, play: 8 },
  xp: { novelCreativity: 3, skillBook: 45, playLogic: 2 },          // per game hour (home: 4 / 60 / 6)
  SCREEN: { full: 45, taper: 75, floor: 0.08, tired: 100 },         // game minutes of phone entertainment per game day
  context: { ride: 1.25, queue: 1.25, bench: 1.1, home: 1, out: 1 },
  contextLabel: { ride: 'On the move: +25% fun', queue: 'Killing time in the queue: +25% fun', bench: 'Park bench break: +10% fun', home: '', out: '' },
  lateEnergyPerHour: -1.5, lateHours: [23, 5],
  CLOCK: { read: 0.1, play: 0.2 },   // game minutes per real second while reading a short read (a 500-word piece = ~13 game minutes) / playing a game (a 60 s round = 12)
  FILM_MINUTES: 20,             // game minutes a film costs on the phone (the cinema show is ~100)
  READ_WPM: 230,                // "real reading speed": a page is worth words / READ_WPM real minutes, time stops counting at 1.6x that
  bookSittings: [15, 30, 60],   // game minutes; an owned book runs like an activity (fast clock, cancellable)
  bookSecondsPerSitting: 5,     // real seconds a sitting takes
  niceBreakMin: 8, dailyFun: 3, // daily PlayBox challenge: +3 fun, once a day
  dayStartHour: 4,              // the screen-time day rolls over at 04:00
  bookPace: 0.85,               // an owned novel advances 0.85 book-minutes per minute read on the phone (the armchair is 1.0)
  REEL: { price: 5, buyDelayDays: 2 },   // a cinema film can be bought in Reel this many game days after you saw it at the Orpheum, for this price
  tvFunPerHour: 14,             // streaming Reel on the home TV = the normal watch_tv rate (tier-scaled by the TV), no screen-time taper
};

/** PlayBox games. price 0 = free; others are bought once with in-game money. skins: [{ id, name, price }] */
export const GAMES = [
  { id: 'match', name: 'Market Match', tag: 'Swap, match three, clear the stall.', price: 0, color: '#e0703a', how: 'Drag a food onto its neighbour to swap. Line up three or more. 20 moves.', unit: 'pts' },
  { id: 'pidge', name: 'Rooftop Pidge', tag: 'One pigeon. Many roofs. No brakes.', price: 0, color: '#5aa7dd', how: 'Tap to hop, tap again in the air to flap once. Grab the pretzels. Do not fall.', unit: 'm',
    skins: [{ id: 'gold', name: 'Golden Pidge', price: 6 }, { id: 'gull', name: 'Harbor Gull', price: 4 }] },
  { id: 'cast', name: 'One More Cast', tag: 'A quiet minute on the pier.', price: 0, color: '#2f8f8f', how: 'Hold to let the hook sink, let go to reel in. Hook fish, dodge boots. 60 seconds.', unit: 'pts' },
  { id: 'stack', name: 'Stack & Ship', tag: 'Harbor crates, one tap at a time.', price: 0, color: '#c79a2a', how: 'Tap to drop the swinging crate. Anything hanging over the edge is cut off.', unit: 'crates',
    skins: [{ id: 'gift', name: 'Gift-wrapped crates', price: 4 }] },
  { id: 'pairs', name: 'Bay Pairs', tag: 'Sixteen cards, eight landmarks.', price: 0, color: '#8a5cc2', how: 'Tap two cards. Find every pair in as few turns as you can.', unit: 'pts' },
  { id: 'cab', name: 'Cab Connect', tag: 'Turn the streets, get the fare home.', price: 8, color: '#f2c230', how: 'Tap a street tile to turn it. Join the cab to the flag. As many fares as you can in 90 seconds.', unit: 'pts' },
  { id: 'beat', name: 'Tap the Beat', tag: 'Three lanes and a tune from The Tidewater Three.', price: 12, color: '#e0527a', how: 'Tap a lane when the note reaches the line. Keep the streak alive.', unit: 'pts' },
];
export const GAME_BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g]));

/** "friends" on the score table are cast first names (flavour only); base = a typical score for that game, they improve a little every week */
export const FRIEND_SCORES = {
  names: ['Kit', 'Dez', 'Pip', 'Noor', 'Felix', 'Nico', 'Walt', 'Dot'],
  base: { match: 900, pidge: 180, cast: 260, stack: 14, pairs: 620, cab: 520, beat: 1400 },
};
/** daily challenge target = this fraction of the friend base (reachable in one or two tries) */
export const DAILY = { frac: { match: .75, pidge: .55, cast: .7, stack: .6, pairs: .8, cab: .55, beat: .6 } };

/** Guide "Things To Try" entries pushed at runtime (group must be one of _guide_data.js STAMP_GROUPS) */
export const STAMPS = [
  { id: 'x:media_read', title: 'Read on Your Phone', group: 'At home', glyph: 'stamp', blurb: 'Open Pages and finish one short read: a Bay Courier column, a harbor mystery, a poem for the 7:42.' },
  { id: 'x:media_watch', title: 'Stream a Show on Reel', group: 'At home', glyph: 'stamp', blurb: 'Reel has small-screen shows for the bus and the sofa. The Orpheum\'s films turn up to buy a couple of days after you have seen them there.' },
  { id: 'x:media_play', title: 'Beat a PlayBox Daily', group: 'At home', glyph: 'stamp', blurb: 'PlayBox sets one small challenge a day. Beat it on the bus and feel briefly unstoppable.' },
];

export const APP_NAMES = { pages: 'Pages', reel: 'Reel', playbox: 'PlayBox' };
