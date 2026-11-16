// Mini-games B (owner msgs 163-164, BIBLE Direction update 33): data and difficulty tunables for the chore / venue games.
// Kinds: src/ui/minigame_b.js. Game definitions and where each attaches: src/sim/_mg_games.js. Record: docs/reports/minigames_b.md.

/* ---- difficulty tunables (everything a play-test would want to turn) ---- */
export const TUNE_B = {
  slowSecs: 75, whoosh: 1.2,                      // a game opened by the B runner: the activity bar creeps while you play, then finishes in `whoosh` seconds (same numbers as skillplay)
  unbox: { par: 5, per: 1.6, floor: .6 },         // seconds allowed before the score starts to drop: par + per x items; it never drops under `floor` (the first mini-game of the game: very easy)
  sort: { n: 8, secs: 4.4 },                      // garments per load, seconds each garment hangs before it counts as missed (shrinks a little with level)
  fold: { n: 4, secs: 6 },                        // garments to fold, seconds per garment for full marks
  scrub: { work: 44, tap: .5, par: 1.7, secs: 34 },   // canvas px of rubbing that cleans one spot, share one tap cleans (pad / keys), par seconds per spot, time limit
  water: { pots: 3, band: .085 },                 // pots per plant, half-width of the green band (shrinks with level)
  wires: { secs: 13, rounds: 2 },                 // seconds per panel for full marks, panels
  cast: { need: 6.5, secs: 20, bite: .95 },       // seconds of good tension to land the fish, reel time limit, seconds the bite stays on
  mix: { rounds: 3, secs: 12 },                   // colours to mix, seconds per colour for full marks
  loadMinutes: 3,                                 // "Loading the machine" (the sort game's own short activity; it does not exist when mini-games are off)
  bonus: { unboxFun: 5, sortHours: 2, foldFun: 3, clean: 6, cleanXp: 5, showerHyg: 8, poolFun: 5, swingFun: 4, duckFun: 4, petFun: 5, lapsFit: .8, recallXp: 14 },   // the most a perfect game adds (x score)
};

/* ---- laundry: [name, shape, colour, basket (0 lights, 1 darks)] ---- */
export const GARMENTS = [
  ['White T-shirt', 'tee', '#f6f2e8', 0], ['Cream jumper', 'jumper', '#f2e2bc', 0], ['Pale blue towel', 'towel', '#cfe8f4', 0], ['White socks', 'sock', '#f6f2e8', 0], ['Pink T-shirt', 'tee', '#f7cdd6', 0], ['Lemon towel', 'towel', '#f8eeb0', 0], ['Light grey joggers', 'trousers', '#d9d9e0', 0],
  ['Black jeans', 'trousers', '#2f3142', 1], ['Navy jumper', 'jumper', '#27375e', 1], ['Bottle-green T-shirt', 'tee', '#2f5f4a', 1], ['Maroon towel', 'towel', '#7a2638', 1], ['Charcoal socks', 'sock', '#44424e', 1], ['Dark denim jeans', 'trousers', '#34466e', 1], ['Black T-shirt', 'tee', '#33303c', 1],
];
export const FOLDABLES = [['tee', '#e0527a'], ['towel', '#8fd8f0'], ['jumper', '#f2c230'], ['trousers', '#3b82d6'], ['tee', '#f6f2e8'], ['towel', '#5fb84f'], ['jumper', '#8a5cc2']];

/* ---- repairs: wire colours (each also carries a mark, so colour is never the only cue) ---- */
export const WIRE_COLS = ['#d8342e', '#3b82d6', '#f2c230', '#5fb84f', '#e89aa0'];
export const LEAK_SPOTS = [[36, 30], [84, 30], [132, 30], [60, 72], [108, 72], [150, 72]];

/* ---- painting: target colours as drops of [red, yellow, blue] ---- */
export const MIXES = [['Orange', [1, 1, 0]], ['Green', [0, 1, 1]], ['Violet', [1, 0, 1]], ['Vermilion', [2, 1, 0]], ['Amber', [1, 2, 0]], ['Lime', [0, 2, 1]], ['Teal', [0, 1, 2]], ['Plum', [2, 0, 1]], ['Indigo', [1, 0, 2]], ['Brown', [1, 1, 1]], ['Olive', [1, 2, 1]], ['Rust', [2, 1, 1]]];

/* ---- which activity opens which game.  skill: the game goes through skillplay (GAME_FOR + GAMES: bonus xp in that skill, records, the Me app);  no skill: the B runner (no xp: a shower is not a skill) ---- */
export const ACT_GAME_B = {
  unpack_boxes: 'unbox', tend_plants: 'water', sk_tune_shower: 'leak', sk_tune_stove: 'wires', sk_tune_tv: 'wires', sk_tune_computer: 'wires', play_pool: 'cue', dance_home: 'dance', read_skill_book: 'recall',   // skillplay
  shower: 'dial', gym_shower: 'dial', swing: 'swing', feed_ducks: 'ducks', meet_animals: 'brush',                                                                                                                // B runner
};
