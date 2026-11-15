// =============================================================================
// Maple Bay — CHAPTERS  (src/story/chapters.js)          PURE DATA. No engine imports, no init().
// The main story, "The Maple Bay Year": 15 Chapters. Design, arcs, canon and the build list are in
// docs/story/CHAPTERS.md. Nothing here runs by itself; a Chapter engine reads CHAPTERS and plays it.
//
// EXPORTS
//   CHAPTERS        Chapter[]            the 15 Chapters, in order.
//   CHAPTERS_BY_ID  { [id]: Chapter }
//   BOOK            { id, title, cover, contents[], pages: { [pageId]: Page } }   Mom's exercise book.
//                   Page = { n, title, place, state: 'written'|'half'|'blank'|'found'|'family', foundIn: chapterId|null,
//                            text: string[] (her handwriting, one paragraph per entry), pin: string (the short note the Map shows
//                            at `place` once the page is found), todo: string|null (what the page asks you to do there) }
//   SPEAKERS_EXTRA  { [id]: { name, short, note } }   speakers that are NOT in cast.js (see the build list).
//   PLACES_NEW      { [id]: note }                    place ids used here that the game does not have yet.
//   ITEMS_NEW       { [id]: { name, kind, desc } }    keepsakes that are not in story.js STORY_ITEMS or the item data yet.
//   TOKENS          { [token]: note }                 text tokens the engine substitutes.
//
// CHAPTER
//   id        'ch01' .. 'ch15'           n  1..15          act  1 | 2 | 3
//   title     string                     shown as "Chapter 4 · <title>"
//   hook      string                     the one line under the title in My Day and on the map marker. Never states a mechanic.
//   ready     string                     the kind line beside it ("Whenever you're ready." and its cousins).
//   marker    { place, label }           where the gold marker stands; walking onto it offers "Begin".
//   window    null | { slots: [{ days?: weekday[], from, to }], weather?: 'clear', closed: string }
//             When the Chapter can be STARTED. from/to are 'HH:MM', or 'dusk-HH:MM' / 'dusk+HH:MM' (the lighthouse lamp time
//             of the season). `closed` is the kind line the marker shows outside the window. Nothing is ever lost by waiting.
//             Once begun, a Chapter runs to its end whatever the clock says (the engine holds closing times for its places).
//   cast      speakerId[]                everyone who speaks (the engine stages them; their routines are overridden meanwhile).
//   unlock    { after: chapterId|'intro', breath: 'next_morning' | { mornings: n }, life?: { cond, waiting } }
//             The Chapter appears the morning after `after` is finished (or n mornings later). `life` is a light condition from
//             the player's own life; until it is met My Day shows the `waiting` line under the previous Chapter. Always achievable,
//             and `life.orMornings: n` opens the Chapter anyway after n mornings, so nobody is ever stuck.
//   minutes   [min, max]                 real minutes it should take.
//   play      string                     the one piece of real play (for the designer's eye; the steps say it again).
//   teaches   string[]                   what the player comes away knowing.
//   takeaway  [{ type, id?, ... }]       type: 'item' | 'recipe' | 'place' | 'page' | 'rel' | 'contact' | 'ability' | 'opportunity'
//             | 'money' | 'recurring' | 'flag'. Granted by `give` steps as they happen; listed here so the end card can show them.
//   scenes    Scene[]
//
// SCENE   { id, place, title?, steps: Step[] }         place = a place id (see PLACE IDS). A scene normally ENDS with the `go`
//         step that takes the player to the next scene's place (their own trip); where there is none, the engine cuts.
//         place 'ride:cab' = the scene plays inside the cab during the ride started by the previous `go` (Chapter 15).
//
// STEP    every step is an object with a `do` key.
//   { do: 'say', who, text, anim?, to? }      one bubble. who = cast id | SPEAKERS_EXTRA id | 'narrator' | 'player'.
//                                             Text <= ~140 chars. anim = a character animation name (stand walk sit eat drink
//                                             phone talk wave type work lift dance read cheer).
//   { do: 'choice', id, options: [{ id, text, reply: Step[], fx?: { rel?: { [npc]: n }, flag?: string } }] }
//                                             The player answers. Choices colour relationships and later lines; they never fail
//                                             or branch the plot. The picked option is remembered as pick:<choiceId>=<optionId>.
//   { do: 'go', place, by?, with?, label, note? }
//                                             The player really travels there (Map / trip chooser / on foot). by = 'any' | 'walk'
//                                             | 'train' | 'bus' | 'cab' (a suggestion, never enforced, unless `must: true`).
//                                             with = npc ids that come along (they walk with you or are waiting when you arrive).
//                                             label = the arrow label. note = a line said if the player dawdles a long while.
//   { do: 'walk', to, with?, talk?: Step[] }  walk together to a spot inside the current place; `talk` lines play on the way.
//   { do: 'play', kind, id, label, hint?, with?, skip?: boolean, results?: { good?: Step[], ok?: Step[] } }
//                                             The player really does something. kind = 'minigame' (id = a G.skillplay key or a
//                                             showpiece activity) | 'activity' (a fixture activity) | 'buy' | 'ui' (a phone/HUD
//                                             action, e.g. open My Day) | 'climb'. Always completable; `skip: true` shows a quiet
//                                             "Not today" beside it. results.good plays on a strong score, results.ok otherwise.
//                                             talk?: Step[] = lines said by companions WHILE the player is doing it (spaced out
//                                             over the activity; any left over are said at the end).
//   { do: 'wait', event, label, hint? }       hold until a game event fires (e.g. 'job:hired'), with a kind label.
//   { do: 'give', type, id?, n?, text? }      type as in takeaway, plus 'meal' (a dish eaten on the spot: fills hunger) and
//                                             'ticket' (entry paid for you). text = the toast.
//   { do: 'flag', id, value? }                remember something (value defaults to true).
//   { do: 'rel', with: { [npc]: n } }         relationship points outside a choice.
//   { do: 'stage', who, at, anim? }           put an NPC somewhere in the current place (at = a fixture/spot name, free text key).
//   { do: 'page', id }                        open a page of BOOK full-screen in her handwriting; the page becomes found and its
//                                             `pin` appears on the Map at its place. id 'cover' = BOOK.cover + BOOK.contents.
//   { do: 'if', cond, then: Step[], else?: Step[] }
//   { do: 'beat', ms? }                       a held pause (default 900 ms): no bubble, the camera stays.
//
// CONDITIONS   a string, or an array of strings (all must hold). '!' in front negates.
//   'time:morning' (05-11) | 'time:day' (11-17) | 'time:evening' (17-21) | 'time:night' (21-05)
//   'season:spring|summer|autumn|winter'     'weather:rain|snow|clear|fog'      'festival:<calendar event id>' (on today)
//   'flag:<id>'      'pick:<choiceId>=<optionId>'      'rel:<npc>>=<n>'      'met:<npc>'      'has:job'      'has:item:<id>'
//   'seen:<placeId>' (the player has been inside before)      'done:<chapterId>'      'day:weekday' | 'day:weekend'
//   'went:train|bus|walk|cab' (how the player travelled the most recent `go` step)
//   'worked:<n>' (shifts attended)      'cooked:<n>' (meals cooked at home)   -- used only in unlock.life
//
// PLACE IDS  cast.js VENUES / HOMES / 'spot:<id>' from SPOTS, the showpiece place + room ids (museum, observatory,
//   observatory:roof, lighthouse, lighthouse_lantern, lighthouse_watch, fishmarket, cityhall, cityhall_archive, skydeck,
//   skydeck_lobby, central_station, university, university:lecture, conservatory, goods:attic ...), 'home:player',
//   'home:grandma' (4 Thimble Street), 'home:sibling' (12 Sycamore Lane), and the few in PLACES_NEW.
// =============================================================================

/* ---- tiny builders (local; the exports are plain objects) ---- */
const s = (who, text, x) => Object.assign({ do: 'say', who, text }, x);
const n = (text, x) => s('narrator', text, x);
const o = (id, text, reply, fx) => Object.assign({ id, text, reply: reply || [] }, fx ? { fx } : null);
const pick = (id, ...options) => ({ do: 'choice', id, options });
const go = (place, x) => Object.assign({ do: 'go', place, by: 'any' }, x);
const walk = (to, talk, x) => Object.assign({ do: 'walk', to, talk: talk || [] }, x);
const play = (kind, id, x) => Object.assign({ do: 'play', kind, id }, x);
const wait = (event, x) => Object.assign({ do: 'wait', event }, x);
const give = (type, id, x) => Object.assign({ do: 'give', type, id }, x);
const flag = (id, value = true) => ({ do: 'flag', id, value });
const rel = w => ({ do: 'rel', with: w });
const stage = (who, at, anim) => ({ do: 'stage', who, at, anim: anim || 'stand' });
const page = id => ({ do: 'page', id });
const iff = (cond, then, els) => Object.assign({ do: 'if', cond, then }, els ? { else: els } : null);
const beat = ms => ({ do: 'beat', ms: ms || 900 });
const sc = (id, place, title, steps) => ({ id, place, title, steps });
const R = (npc, v = 2) => ({ rel: { [npc]: v } });

export const TOKENS = {
  '{name}': "the player's name",
  '{title}': 'what Pip and Milo call the player, chosen in Chapter 3 (pick:c03_title): "Aunt {name}", "Uncle {name}", "{name}" or "Captain {name}". Before Chapter 3: "{name}".',
  '{home}': "the name of the player's home (e.g. Juniper Court)",
  '{job}': 'the player\'s job title in lower case, or "the job hunt" when there is none',
  '{count}': 'the step count the player called in Chapter 7: "ninety-seven" or "ninety-eight"',
};

export const SPEAKERS_EXTRA = {
  narrator: { name: '', short: '', note: 'Caption text, no bubble tail.' },
  player:   { name: '{name}', short: '{name}', note: 'Only used for the rare line the player says without choosing it.' },
  nell:     { name: 'Eleanor "Nell" Larkin', short: 'Mom', note: 'Mom. Never on screen. Used only for lines read from her book (handwriting style bubble).' },
  dad:      { name: 'Frank', short: 'Dad', note: 'NEW NPC (must-have). Dad: 62, a retired quarry fitter from Pinehollow. On the phone in Chapter 7, in person in Chapter 15.' },
  silas:    { name: 'Silas Marrow', short: 'Silas', note: 'The lighthouse keeper (exists in sim/lighthouse.js as the keeper; needs a speaker hook).' },
  hester:   { name: 'Hester Quill', short: 'Ms. Quill', note: 'The City Hall archivist (named in data/cityhall.js PEOPLE; needs a speaker hook).' },
  pym:      { name: 'Mrs. Hester Pym', short: 'Mrs. Pym', note: 'The university registrar (story/university.js CAST.pym).' },
  crier:    { name: 'The auctioneer', short: 'Auctioneer', note: 'The fish-hall auctioneer at the rostrum (existing figure; two lines).' },
};

export const PLACES_NEW = {
  'home:grandma:attic': 'MUST. A small attic room over Nana Bea\'s house (about 8x6): trunk, three boxes, a dust-sheeted armchair, a round window. Reached by a ladder fixture on her landing.',
  'spot:second_wind': 'MUST (tiny). A standing spot on the pontoon beside the Captain\'s houseboat "Second Wind", berth 3, with a small brass bell prop by the cabin door.',
  'spot:kettle_stall': 'MUST. The Little Kettle: a striped, slightly leaning market stall on Market Street, Old Town (reuse prop.event.stall + a counter the player can serve from).',
  'spot:airport_arrivals': 'NICE. The arrivals rail inside the terminal; falls back to spot:taxi_rank_airport.',
};

export const ITEMS_NEW = {
  nells_book:    { name: '"Maple Bay, for F."', kind: 'keepsake', desc: "Mom's exercise book. Readable at home, page by page, as you find them. Sits on a shelf or table." },
  nana_armchair: { name: "Nana's Attic Armchair", kind: 'furniture', desc: 'Green velvet, one arm worn smooth. "Your mother read in that. Upside down, mostly."' },
  best_sticker:  { name: 'The Best Sticker', kind: 'decor', desc: 'A foil stegosaurus. Milo chose it. Do not lose it.' },
  nell_postcard: { name: "Kit's Postcard", kind: 'keepsake', desc: 'The lighthouse, 1960s colours. On the back, in Mom\'s hand: "Go."' },
  order_slip:    { name: 'Copper Kettle Order Slip', kind: 'keepsake', desc: 'TABLE __  COVERS __ . Blank on the back. Pip has assigned you one page.' },
};

/* ---- Mom's book -------------------------------------------------------------------------------------------------- */
export const BOOK = {
  id: 'nells_book',
  title: 'MAPLE BAY, FOR F.',
  cover: [
    'A school exercise book, soft at the corners. Thirty-five cents, pencilled inside the cover.',
    'Under the price, in ink: "Frank will never read this. He would rather be shown. So this is for the days I am busy."',
  ],
  contents: ['1. The Light', '2. The Fish Hall, at dawn', '3. The Ferry', '4. Marge', '5. The Dome', '6. The Glass House', '7. The Baths',
    '8. The Grand Maple', '9. Number Nine', '10. The Orpheum', '11. The College', '12. The Kettle', '13. The Lookout (last. save it.)'],
  pages: {
    light: { n: 1, title: 'The Light', place: 'lighthouse', state: 'written', foundIn: 'ch07',
      text: ['Start here. Everybody should be started here.',
        'Go late in the day. Count the steps going up. I get 97. You will get 98, because you will count the doorstep, and you will be wrong, and I will let you be.',
        'Ask the keeper nicely and he lets you put the match to the lamp. Then stand outside on the gallery and do not say anything clever. It does the talking.'],
      pin: 'Count the steps. I get 97.', todo: 'Climb at the end of the day and light the lamp.' },
    fishhall: { n: 2, title: 'The Fish Hall, at dawn', place: 'fishmarket', state: 'written', foundIn: 'ch08',
      text: ['Half past five in the morning. Yes. I know.',
        'The auction runs backwards: the price falls till somebody loses their nerve. Dad says it is the only honest theatre in town, because everybody in it is trying not to act.',
        'Bid on nothing. Stand by the ice machine and watch faces. Then buy a paper of smoked herring from Halvorsen and eat it on the quay with your fingers like a gull.'],
      pin: 'The only honest theatre in town.', todo: 'Go at dawn. Watch one lot fall.' },
    ferry: { n: 3, title: 'The Ferry', place: 'spot:second_wind', state: 'written', foundIn: 'ch08',
      text: ['You know this one. You keep her engine alive. But you have never once ridden her as a passenger, so:',
        'Stand at the back rail, not the front. From the front you see where you are going. From the back you see the town get small enough to hold.',
        'The Captain will tell you I ride back and forth for the air. I ride back and forth to look at you through the engine-room hatch. Do not tell the Captain.'],
      pin: 'Stand at the back rail.', todo: null },
    marge: { n: 4, title: 'Marge', place: 'museum', state: 'written', foundIn: 'ch10',
      text: ['The Museum, Symphony Street, up the steps. Marge is the tyrannosaur. She is forty feet of very old lady and she has known me since I was three.',
        'Say hello to her. Out loud. Tell her Nell sent you. The guards are used to it.',
        'Then go and look at one thing only, for a long time. Not everything. One thing. That is how you do a museum.'],
      pin: 'Say hello to Marge. Tell her Nell sent you.', todo: 'Say hello. Then look at one thing for a long time.' },
    dome: { n: 5, title: 'The Dome', place: 'observatory', state: 'written', foundIn: 'ch11',
      text: ['Clear nights only. If it is cloudy, go home and kiss me instead.',
        'Up on the roof they will give you a chart with the proper names. Ignore it once. Find the one that looks like a pan with a bent handle. That is the Kettle. It is not on their chart. It is mine.',
        'I am giving it to you. You will say a person cannot give a person stars. Watch me.'],
      pin: 'Find the Kettle. It is not on their chart.', todo: 'A clear night. Find the pan with the bent handle.' },
    glasshouse: { n: 6, title: 'The Glass House', place: 'conservatory', state: 'written', foundIn: null,
      text: ['In the park. It is always summer in there, which in February is worth the walk on its own.',
        'There is a fig by the lily pool that is older than Mum and has better manners. Sit under it. Feed the orange fish. The fat one is called Bishop and he is not to be trusted.'],
      pin: 'Sit under the fig. Do not trust Bishop.', todo: 'Sit a while by the lily pool and feed the koi.' },
    baths: { n: 7, title: 'The Baths', place: 'natatorium', state: 'written', foundIn: null,
      text: ['Where I learned to swim, by being dropped in by June, who was six and stronger than she looked.',
        'Lane two is the lucky lane. Nobody knows why. Swim one length in it, slowly, on your back, and look at the ceiling. You will see what I mean about the ceiling.'],
      pin: 'Lane two. On your back. Look up.', todo: 'Swim one slow length on your back.' },
    grandmaple: { n: 8, title: 'The Grand Maple', place: 'hotel', state: 'written', foundIn: null,
      text: ['We cannot afford it. Go in anyway. Walk like you are meeting someone. I have been meeting someone in that lobby since I was fourteen.',
        'The piano is real and so is the pianist. If you put a coin in the dish he plays what you ask. Ask for something slow. Then ask me to dance. I will say no. Ask twice.'],
      pin: 'Walk in like you are meeting someone.', todo: 'Ask the pianist for something slow.' },
    numbernine: { n: 9, title: 'Number Nine', place: 'spot:tram_shed', state: 'written', foundIn: null,
      text: ['The streetcar. My dad drives it and Gordon Pike rings the bell, and between them they have never once been on time and never once been late. Do not ask how. It is a Larkin thing.',
        'Ride the whole loop without getting off. Sit on the left for the harbour. If Dad sees you he will not wave, because he is working. He will ring the bell twice. That is waving.'],
      pin: 'Two rings. That is waving.', todo: null },
    orpheum: { n: 10, title: 'The Orpheum', place: 'cinema', state: 'written', foundIn: null,
      text: ['Row F, the two seats with the wobble. They are ours now. I have decided.',
        'It does not matter what is on. Vera in the box office will tell you it is the best picture she has ever shown. She has said so every week since I could reach the counter. She means it every time. Be like Vera.'],
      pin: 'Row F. The seats with the wobble.', todo: 'See whatever is on.' },
    college: { n: 11, title: 'The College', place: 'university', state: 'half', foundIn: 'ch12',
      text: ['Up the hill past the green. Second door, Mrs. Pym. If her door is shut she is in. If it is open she is in and cross.',
        '(Write this one properly when term starts.)'],
      pin: 'Write this one properly when term starts.', todo: null },
    kettle: { n: 12, title: 'The Kettle', place: 'bakery', state: 'blank', foundIn: 'ch13',
      text: ['(The title, underlined twice. Nothing else. The paper is worn thin in one place, as if a pencil rested there a long time.)'],
      pin: '', todo: null },
    kettle_note: { n: 12, title: 'The Kettle (the order slip)', place: 'bakery', state: 'found', foundIn: 'ch13',
      text: ['Mum.',
        'I never wrote the Kettle page. I sat with it open in Ambrose\'s shop for two hours once. You cannot write somebody directions to a place you never had to find.',
        'I did not leave because of what you said. I had my bag packed before you said it. I left because he asked, and because I thought the Kettle would still be there on Tuesday. I always thought there would be a Tuesday.',
        'I should have come into the kitchen. Every visit I sat out front like a customer because I thought I had given up the right to the back. You never said I had. I decided it for you. That is a thing we do, you and I.',
        'It was the best room in the world. I told everybody in Pinehollow. They are sick of hearing it.',
        'I am putting this in the teapot because you will find it the next time you make a proper pot, which knowing you is Thursday.',
        'Your Nell.'],
      pin: 'It was the best room in the world.', todo: null },
    lookout: { n: 13, title: 'The Lookout', place: 'lookout', state: 'blank', foundIn: 'ch15',
      text: ['(The title, and under it, small: "last. save it.")'],
      pin: '', todo: null },
  },
};

/* =====================================================================================================================
   ACT ONE — SETTLING  (Chapters 1-5: the first few days; each one a family member showing you a part of living here)
   ===================================================================================================================== */

const ch01 = {
  id: 'ch01', n: 1, act: 1, title: "Breakfast at Nana's",
  hook: 'Nana Bea has the kettle on. Blue door, Thimble Street.',
  ready: "Whenever you're ready. She'll be in.",
  marker: { place: 'home:grandma', label: "Nana Bea's blue door" },
  window: { slots: [{ from: '07:00', to: '19:30' }], closed: "Nana's lights are out. She keeps early hours. The door will still be blue tomorrow." },
  cast: ['nana'],
  unlock: { after: 'intro', breath: 'next_morning' },
  minutes: [6, 9],
  play: "Cook Nana's pancakes on her stove (the flip game), after washing your hands at her sink.",
  teaches: ['Eating, washing and resting are things you do, at fixtures, and they change how you feel', 'A first recipe you can cook at home',
    'The gentler needs: outdoors, people, lovely things, a kind home', 'Where food and soap come from (FreshWay, Lucky Corner)'],
  takeaway: [{ type: 'recipe', id: 'maple_pancakes' }, { type: 'item', id: 'nana_jam' }, { type: 'place', id: 'home:grandma' }, { type: 'contact', id: 'nana' }, { type: 'rel', id: 'nana', n: 5 }],
  scenes: [
    sc('door', 'home:grandma', 'The blue door', [
      n('Thimble Street. A narrow brick house, a blue door, and a gate that announces you to the whole row.'),
      s('nana', 'That gate has told on every visitor since 1971. Come here. Let me look at you.', { anim: 'wave' }),
      s('nana', 'Hm.'),
      s('nana', 'Hungry. Tired. And you washed in an airport. I can tell by the collar.'),
      s('nana', 'And you have not laughed since Tuesday. That one shows around the eyes.'),
      pick('c01_look',
        o('how', 'How can you possibly tell?', [
          s('nana', 'Thirty-one years behind a tearoom counter. People are not complicated, darling. They are only bad at checking.')], R('nana')),
        o('fine', "I'm fine, Nana.", [
          s('nana', '"Fine." Your mother said "fine" in exactly that voice. It was never once true.'),
          s('nana', 'In. Shoes off, troubles off.')], R('nana')),
        o('hug', '(Just hug her.)', [
          n('She is very small. It is like hugging a warm coat full of opinions.'),
          s('nana', 'There. That is one of them fixed already.')], R('nana'))),
      iff('weather:rain', [s('nana', 'And you have walked here in that. Stand on the mat and drip like a Christian.')]),
    ]),
    sc('kitchen', 'home:grandma', 'The kitchen', [
      n('The kitchen is most of the downstairs. A range, a scrubbed table, a dresser of plates that do not match, on purpose.'),
      s('nana', 'Hands. Sink. The soap is the yellow one. Nobody cooks in my kitchen with airport on them.'),
      play('activity', 'wash_hands', { label: "Wash your hands at Nana's sink", hint: 'Tap the sink.' }),
      s('nana', 'Good. Now I am going to show you one thing, and you are going to do it, and after that you will always be able to feed yourself.'),
      s('nana', 'Pancakes.'),
      iff('time:evening', [s('nana', 'Yes, I know what time it is. It is breakfast when I say it is.')]),
      s('nana', 'Flour, oats, an egg, milk. The maple goes on after, never in. Anybody who tells you "in" is selling something.'),
      s('nana', 'The pan tells you when. Watch the edges, not the clock. Your mother never owned a clock she believed.'),
      play('minigame', 'flip', { label: "Make Nana's pancakes", hint: 'Tap when the edges say so.', with: ['nana'], results: {
        good: [s('nana', 'Oh, now. Look at that. That is a Larkin wrist.'),
          s('nana', 'Do not tell your sister. She still flips as though she is apologising to it.')],
        ok: [s('nana', 'That one is a map of somewhere. We shall call it rustic and eat it first.')] } }),
      n('You eat at the table by the window. She does not eat. She watches you eat, which is apparently the same thing.'),
      give('meal', 'maple_pancakes', { text: 'Pancakes, eaten hot.' }),
      s('nana', 'Better. You have gone a different colour.'),
      n('On the dresser, between a jug and a faded rosette: two girls on a harbour wall, squinting. The taller one is laughing at whoever holds the camera.'),
      s('nana', 'That is your mother. Twenty. And June, pulling a face, because June.'),
      s('nana', 'You have her nose. I have been deciding all morning whether to say so.'),
      pick('c01_nose',
        o('dad', "Everyone says it's Dad's nose.", [
          s('nana', 'Your father has a perfectly good nose and that is not it. I have had thirty-six years to study the man.')], R('nana')),
        o('like', 'What was she like, at twenty?', [
          s('nana', 'Loud. Funny. Always halfway out of a door.'),
          beat(),
          s('nana', 'Eat. That is a long question and you have a short fork.')], R('nana')),
        o('look', '(Look at it a moment longer.)', [
          n('She lets you. She straightens a plate that was already straight.'),
          s('nana', 'You may come and look at her whenever you like. That is what a dresser is for.')], R('nana'))),
      s('nana', 'Now tell me. Why now? Nora has been at you to come for ten years. Something tipped.'),
      pick('c01_why',
        o('fresh', 'I wanted to start again somewhere.', [
          s('nana', 'Mm. You cannot, you know. You bring yourself along.'),
          s('nana', 'But it is a good town to be yourself in. I have found.')], R('nana')),
        o('dad', "Dad told me to go. He said she'd have sent me years ago.", [
          beat(),
          s('nana', 'Did he. Well. Frank says about nine things a year, and they are usually right.')], R('nana')),
        o('dunno', "Honestly? I don't know yet.", [
          s('nana', 'Good. The ones who know are insufferable.'),
          s('nana', 'You will find out by living here. That is how it is done.')], R('nana'))),
      s('nana', 'Then I shall tell you how to live on your own, because nobody told me, and I made a mess of the first year.'),
      s('nana', 'Three rules. Eat something hot every day. Wash before anybody has to mention it. And go to bed while you still like yourself.'),
      s('nana', 'Your kitchen has a starter cupboard. Walt told me. I telephoned him. He was frightened of me, which is correct.'),
      s('nana', 'When it runs out there is FreshWay, or Lucky Corner if you can only face a small shop. Bags come home, things go in cupboards.'),
      s('nana', 'Soap runs out too. It always picks a Sunday.'),
      s('nana', 'And the days you feel low and cannot say why? It is never a mystery.'),
      s('nana', 'You have not been out of doors. Or you have not spoken to a soul. Or you have not looked at one lovely thing all week.'),
      s('nana', 'Or your home is being unkind to you. A flat that echoes will sour a person. We shall see about that, in time.'),
      s('nana', 'Do not sit and wonder which it is. Get up and fix one. It is usually the right one.'),
      s('nana', 'Which will you be worst at? Be honest. I shall know anyway.'),
      pick('c01_worst',
        o('sleep', 'Bed. I stay up.', [
          s('nana', 'Of course you do. Night owls, the lot of you.'),
          s('nana', 'Put the telephone face down. It is not going anywhere. That is rather the trouble with it.')], R('nana')),
        o('food', 'Eating properly.', [
          s('nana', 'Then you will learn four dishes and rotate them like a sensible person. Pancakes is one. Three to go.')], R('nana')),
        o('people', 'Seeing people.', [
          s('nana', 'Then it is lucky you have moved to a town where I know everybody.'),
          s('nana', 'You will not be let alone. I shall see to it personally.')], R('nana'))),
      s('nana', 'And the bathroom is at the top of the stairs. You have been crossing your ankles since the second pancake.'),
      play('activity', 'use_toilet', { label: 'Top of the stairs', skip: true }),
      s('nana', 'Now sit in the chair by the range for ten minutes. Not to sleep. Only to see what happens.'),
      play('activity', 'nap', { label: 'Ten minutes in the chair by the range', skip: true, results: {
        good: [n('You see what happens. It is forty minutes.'), s('nana', 'There. And I never said a word.')],
        ok: [n('You see what happens. It is forty minutes.'), s('nana', 'There. And I never said a word.')] } }),
    ]),
    sc('leaving', 'home:grandma', 'The jar', [
      s('nana', 'Take this. It says what it is.'),
      give('item', 'nana_jam', { text: 'A jar of plum jam. The label reads: PLUM. EAT IT.' }),
      give('recipe', 'maple_pancakes', { text: "Bea's Maple Oat Pancakes. You can make them at home now." }),
      n('At the foot of the stairs a ladder leans under a hatch in the ceiling. She sees you see it.'),
      s('nana', 'Not today. There is a chair up there with your name on it, but it wants a flat that is ready for a chair.'),
      s('nana', 'And a day when I am ready for the attic.'),
      s('nana', 'Your cousin Desmond will be round to drag you about the town. Let him. He knows it the way a pigeon knows it.'),
      s('nana', 'And {name}. The door is blue so that you can find it. Come when you like. You need not wait to be asked.'),
      n('The gate tells the whole street you are leaving.'),
    ]),
  ],
};

const ch02 = {
  id: 'ch02', n: 2, act: 1, title: 'The Long Way Round',
  hook: 'Cousin Dez is outside your building with a bike and a plan.',
  ready: "No rush. He's got parcels to drop either way.",
  marker: { place: 'spot:building_stoop', label: 'Dez, on your front stoop' },
  window: { slots: [{ from: '08:00', to: '18:00' }], closed: "Dez knocks off at dark. He'll be leaning on your building again tomorrow." },
  cast: ['dez'],
  unlock: { after: 'ch01', breath: 'next_morning' },
  minutes: [7, 11],
  play: 'Pick the SkyDeck on the Map, choose a way there from the trip chooser, and really make the trip (train, bus or on foot).',
  teaches: ['The Map and the trip chooser: walk, bus, train, cab', 'Trains and buses: where you board and where you get off', 'Cabs cost money: for late nights and luggage',
    'Wander: every place in town, hours, what is on', 'Looking at a place from the SkyDeck telescopes puts it in your phone'],
  takeaway: [{ type: 'place', id: 'central_station' }, { type: 'place', id: 'skydeck' }, { type: 'item', id: 'sky_poster' }, { type: 'contact', id: 'dez' }, { type: 'rel', id: 'dez', n: 6 }],
  scenes: [
    sc('stoop', 'spot:building_stoop', 'The stoop', [
      n('A bike is leaning on your building. Its owner is leaning on the bike. Neon windbreaker, one trouser leg rolled, grin already loaded.'),
      s('dez', "Cuz! Nana says I'm to show you the town. I get one afternoon and a sandwich budget. I've spent the budget.", { anim: 'wave' }),
      s('dez', 'Desmond. Dez. Nobody says Desmond but Nana and the parking people.'),
      s('dez', "I'm the other side. Grandpa Ray's lot, out of the Railyard. Your side got the opinions. We got the legs."),
      pick('c02_know',
        o('wedding', "I know who you are. You were at Nora's wedding.", [
          s('dez', 'I was fourteen and I ate nine devilled eggs. Family record. It stands.')], R('dez')),
        o('second', 'Second cousin, technically?', [
          s('dez', 'Technically is for lawyers. Cousin. It is shorter and you get better birthday presents.')], R('dez')),
        o('say', 'Do I get a say in this tour?', [
          s('dez', "No! That's the beauty of it. Relax. I'm a professional. I get paid to know where things are.")], R('dez'))),
      s('dez', "Okay. First rule of Maple Bay: you don't drive. Nobody does. It's the parking. It's a whole thing."),
      s('dez', 'So there are three ways and one cheat. Feet. Bus. Train.'),
      s('dez', 'The cheat is a cab, and the cheat costs money, so the cheat is for two in the morning and suitcases.'),
      s('dez', 'Phone out. Map. Find the tallest thing downtown. Beacon Tower. The top of it is called the SkyDeck.'),
      play('ui', 'map_pick:skydeck_lobby', { label: 'Open the Map and pick the SkyDeck', hint: 'It will offer you the ways to get there.' }),
      s('dez', 'See how it hands you choices? Walk, bus, train, cab. How long, how much.'),
      s('dez', "You don't have to know the town. You just have to know where you want to be. The phone does the rest and so do your feet."),
      s('dez', "Pick one. Not the cab. I'll be on the bike, so I'll beat you, so don't feel bad about it."),
      go('skydeck_lobby', { with: ['dez'], label: 'Make your own way to Beacon Tower', note: "Dez texts: 'still here. the pigeons and I are becoming close.'" }),
    ]),
    sc('lobby', 'skydeck_lobby', 'Beacon Tower', [
      iff('went:train', [s('dez', 'Train! Good pick. It goes round the whole town on its bridge like a toy.'),
        s('dez', "Tap in at the gate, sit on the bay side, get off when it says your stop. That's the entire skill.")]),
      iff('went:bus', [s('dez', 'The bus! Respect. The bus is the truth about a city.'),
        s('dez', 'Stops every few blocks. The sign tells you the number, the Map tells you which number. Done.')]),
      iff('went:walk', [s('dez', "You WALKED? All of it? Okay, I take back the legs thing. Your side got some legs.")]),
      iff('went:cab', [s('dez', 'A cab. I said not the cab. Was it Manny?'), s('dez', "...It was Manny. Fine. Manny's allowed.")]),
      s('dez', "Took you long enough. I've dropped two parcels and had a pretzel."),
      s('dez', "I deliver here every day, so I know a guy. The guy is the ticket machine. I'm paying. Get in the lift."),
      give('ticket', 'skydeck', { text: "Dez buys your SkyDeck ticket. He makes a show of it." }),
      go('skydeck', { with: ['dez'], by: 'walk', label: 'Take the lift to the top' }),
    ]),
    sc('deck', 'skydeck', 'Fifty-one floors up', [
      n('The lift counts to fifty-one. Your ears count along.'),
      n('And then the whole town is under you, all at once, like something spilled.'),
      s('dez', "Right? Right. Okay. Come to the glass. I'll do it properly."),
      walk('panorama_glass', [
        s('dez', 'Brick, crooked roofs: Old Town. Nana country. Sneeze there and she knows by lunch.'),
        s('dez', 'Green bit with the school: Maplewood. Nora and Theo and the small ones. Go at dinnertime. They over-cater.'),
        s('dez', "Tracks and sheds: the Railyard. Mine. Dot's Diner does pancakes. Do not tell Nana I said so."),
        s('dez', "The posh hill is Hillcrest. There's a lookout on top, and a dome for looking at stars."),
        s('dez', 'Murals and the campus: Arts Quarter. The pictures, the Blue Heron, people with opinions about coffee.'),
        s('dez', 'And the Harbor. Fish, boats, tourists. The white stick at the far end is the lighthouse.'),
      ], { with: ['dez'] }),
      pick('c02_light',
        o('been', 'Have you been up it?', [
          s('dez', "The lighthouse? Nah. It's for tourists."),
          beat(),
          s('dez', "...Twenty-four years. Never been up. Don't look at me like that.")], R('dez')),
        o('far', 'It looks further than I thought.', [
          s('dez', "Everything here's further than it looks and closer than you'd think. Town motto. I made it up. Still true.")], R('dez')),
        o('mom', 'Mom used to talk about that light.', [
          s('dez', 'Yeah? She gave me five dollars once and told me to wear a helmet. I was seven.'),
          s('dez', "Worn one ever since. That's the whole of what I've got of her. It's a good one, though.")], R('dez'))),
      s('dez', "Now. Telescopes. They're not just for looking. Point one at somewhere you'd like to go."),
      play('activity', 'skydeck_scope', { label: 'Look through a telescope', hint: 'Pick a part of town.', results: {
        good: [s('dez', "Whatever you just looked at, it's in your phone now. That's how this town works. You look, it remembers.")],
        ok: [s('dez', "Whatever you just looked at, it's in your phone now. That's how this town works. You look, it remembers.")] } }),
      s('dez', "Other thing. There's an app called Wander. Every place in town, when it's open, what's on tonight."),
      s('dez', "Nana would call it a stamp book. She'd be right."),
      s('dez', "When you're bored, don't sit there being bored. Open that. Pick a thing you've never done."),
      s('dez', "That's how I found the taco place. And the other taco place."),
      s('dez', 'So what are you? Train person, bus person, feet person?'),
      pick('c02_style',
        o('train', 'Train. I like the bridge.', [
          s('dez', 'Bay side, always. And at night, when the windows go by like a film.')], R('dez')),
        o('bus', 'Bus. You see more.', [
          s('dez', "You do. You hear more, too. The 3 has a guy who narrates. Not official. He's just a guy.")], R('dez')),
        o('feet', 'Feet. I want to learn it properly.', [
          s('dez', "Then you'll know it better than me in a year. All the shortcuts are on foot."),
          s('dez', "I'll show you two. Not the illegal ones. Okay, one illegal one.")], R('dez'))),
      give('item', 'sky_poster', { text: 'Dez buys you the SkyDeck poster from the gift nook.' }),
      s('dez', 'For your wall. So you remember what it looked like before you knew what any of it was. You only get that once.'),
      s('dez', "Right. I've got a parcel for a dentist who hates me. You can get home without me. That's the test."),
      s('dez', "There's no test. But get home."),
      s('dez', "And hey. Welcome. I'm glad there's more of us."),
    ]),
  ],
};

const ch03 = {
  id: 'ch03', n: 3, act: 1, title: "Pip's Fun Survey",
  hook: 'Your niece has a clipboard and some questions. Sycamore Lane.',
  ready: 'Whenever suits. The clipboard is patient. Pip, less so.',
  marker: { place: 'home:sibling', label: 'The yellow house, 12 Sycamore Lane' },
  window: { slots: [{ days: ['mon', 'tue', 'wed', 'thu', 'fri'], from: '15:30', to: '19:00' }, { days: ['sat', 'sun'], from: '10:00', to: '19:00' }],
    closed: 'The yellow house is quiet. The kids are home after school and all weekend. It will keep.' },
  cast: ['jules', 'pip', 'milo', 'theo', 'vik'],
  unlock: { after: 'ch02', breath: 'next_morning' },
  minutes: [8, 12],
  play: "Tick your interests on Pip's survey, then one real game in Central Park: hoops with Pip, chess with Mr. Sethi, or sketching the pond with Milo.",
  teaches: ['Interests: the things you tick lift your mood faster', 'The many ways to have fun: at home, on the phone, outdoors, at venues',
    'Getting better at something makes it more fun (skills)', 'Fun has to be put into the day on purpose'],
  takeaway: [{ type: 'ability', id: 'interests', text: 'Your interests are set (change them any time in the Me app).' }, { type: 'item', id: 'milo_drawing' },
    { type: 'place', id: 'home:sibling' }, { type: 'place', id: 'park' }, { type: 'contact', id: 'pip' }, { type: 'contact', id: 'theo' },
    { type: 'rel', id: 'pip', n: 6 }, { type: 'rel', id: 'milo', n: 5 }, { type: 'rel', id: 'jules', n: 4 }],
  scenes: [
    sc('porch', 'home:sibling', 'The porch', [
      n('Sycamore Lane. A yellow house, a porch swing, a chalk drawing of something with a great many legs.'),
      s('jules', "Come here. Hug first, news after. That's the rule.", { anim: 'wave' }),
      s('jules', "You look better. Nana's been at you. I can smell pancakes. Don't deny it."),
      n('Behind her knee: a green hood with a small serious face in it. Beside that, a clipboard with a girl attached.'),
      s('pip', 'Mom says you are my aunt-or-uncle. I have questions.'),
      s('jules', 'Pip. Hello first.'),
      s('pip', 'Hello. I have questions.'),
      s('pip', 'Question one. What do I call you? I need it for the form.'),
      pick('c03_title',
        o('aunt', 'Aunt {name}.', [s('pip', "Aunt {name}. Writing it down. It's official once it's on the clipboard.")], R('pip')),
        o('uncle', 'Uncle {name}.', [s('pip', "Uncle {name}. Writing it down. It's official once it's on the clipboard.")], R('pip')),
        o('name', 'Just {name}.', [s('pip', 'Just {name}. Okay. Efficient. I respect that.')], R('pip')),
        o('captain', 'Captain.', [
          s('pip', '...Captain {name}. Mom, is that allowed?'),
          s('jules', "It's allowed."),
          s('pip', "It's the best one. I'm annoyed I didn't think of it.")], R('pip'))),
      s('pip', "Question two isn't a question. This is Milo. He's six. He's shy."),
      s('milo', '...hi.'),
      s('milo', 'Do you know what a stegosaurus is?'),
      pick('c03_stego',
        o('yes', 'Plates on the back. Spikes on the tail.', [
          s('milo', '...Okay. Good.'),
          n('The hood nods, once. You have been admitted to something.')], R('milo')),
        o('remind', 'Remind me?', [
          s('milo', 'Plates. On the back. The spikes on the tail have a name. It is a thagomizer.'),
          s('pip', 'It really is. I checked. I was furious.')], R('milo')),
        o('wrong', 'Is that the one with the long neck?', [
          s('milo', 'No.'),
          beat(),
          s('milo', "That's okay. You can learn.")], R('milo'))),
      s('pip', 'Question three. What do you do for fun?'),
      pick('c03_fun',
        o('read', 'I... read? Sometimes?', [s('pip', '"Sometimes" is not a hobby. I am writing "unclear."')], R('pip')),
        o('packing', "Honestly, I've mostly been packing.", [s('pip', "Packing is a chore. I'm writing \"none at present.\" That's sad. We'll fix it.")], R('pip')),
        o('stuff', 'Stuff. You know. Stuff.', [s('pip', "That's not an answer. That's a shrug with words in it.")], R('pip'))),
      s('jules', "She's not wrong, you know. You've been getting through it for two years. You're allowed to like things again."),
      s('pip', "I have a SURVEY. Sit on the swing. It's multiple choice, so you can't get it wrong. You can only get it boring."),
      play('ui', 'interests_pick', { label: "Pip's Fun Survey: tick what sounds like you", hint: 'You can change your mind later. Pip will re-file.', with: ['pip'] }),
      s('pip', "Interesting. Very interesting. I can't say what it means until I've done the graph."),
      s('pip', "The ones you ticked are your things. When you do your things you cheer up quicker. That's not my opinion. That's science."),
      s('jules', "Okay, here's the deal. I have forty spelling tests and a husband who is \"fixing\" the gate."),
      s('jules', "Take them to the park for me? An hour. They think you're the entertainment. You'll find it's the other way round."),
      go('spot:playground', { with: ['pip', 'milo'], label: 'Walk Pip and Milo to Central Park', note: "Pip: 'We can hear the park from here. It's that way. It's always been that way.'" }),
    ]),
    sc('park', 'spot:playground', 'Central Park', [
      s('pip', 'Okay. The official list. "Things That Are Fun, by Pip, age nine, for grown-ups who forgot."'),
      s('pip', "One: things at home. Books. TV. Games, if you've got a console. Cooking, if you do it on purpose and not just because you're hungry."),
      s('pip', "Two: things on your phone. There's a book one, a film one and a games one. Mom says a little is lovely and a lot makes your eyes go square."),
      s('pip', "Three: things outside. Hoops. Chess with the old men. Fishing off the pier. Taking photos. Milo says looking at ducks. I've allowed it."),
      s('milo', 'Ducks is fun.'),
      s('pip', "Four: places. The pictures. The arcade in the mall. The pool with the slides. The Otters. They're our team. They're not good. We love them."),
      s('pip', "Five is the secret one. Getting good at something. The more you do a thing, the better you get, and then it's MORE fun. Grown-ups forget five."),
      s('pip', "Dad says fun doesn't just happen to grown-ups. You have to put it in the day on purpose. Like teeth."),
      s('pip', "So. Field test. Pick one. We're doing it right now."),
      pick('c03_test',
        o('hoops', 'Hoops. You and me, Pip.', [
          s('pip', "YES. I'm small, but I foul."),
          play('minigame', 'hoops', { label: 'Shoot hoops with Pip', with: ['pip'], results: {
            good: [s('pip', 'Okay, you\'re GOOD. That goes on the form. Under "surprises."')],
            ok: [s('pip', "That was bad! But you laughed twice. I counted. That's the point of it.")] } })], R('pip')),
        o('chess', 'Chess, with the old men.', [
          s('pip', "That's Mr. Sethi. He's the champion. He says. Nobody's checked."),
          s('vik', 'A new face! Sit, sit. I will be gentle. I will not be gentle.'),
          play('minigame', 'chess', { label: 'Play Mr. Sethi under the big maple', with: ['vik', 'pip'], results: {
            good: [s('vik', 'Hm. HM. Who taught you? No. Do not tell me. Come back Thursday.')],
            ok: [s('vik', 'You lost beautifully. That is rarer than winning. Come back Thursday.')] } })], R('pip')),
        o('sketch', 'Draw the ducks with Milo.', [
          s('milo', '...You have to be quiet. Ducks know.'),
          play('minigame', 'sketch', { label: 'Sketch the pond with Milo', with: ['milo'], results: {
            good: [s('milo', "That's a good duck."), n('From Milo, you gather, this is five stars.')],
            ok: [s('milo', 'That one looks like a shoe.'), beat(), s('milo', 'I like shoes.')] } })], R('milo'))),
      s('pip', "See? You've gone a different colour. Nana says that. It's true, though."),
      n('A small hand finds your sleeve and points, through the trees, at a great glass roof.'),
      s('milo', "There's fish in the glass house. Orange ones. They know me."),
      s('pip', "The Conservatory. It's four dollars and Milo talks to a fish for an hour. Another day. It's been there a hundred years. It'll wait."),
      s('pip', 'Last question. Do you look like Grandma Nell? Nana says the nose.'),
      pick('c03_nell',
        o('think', "So I'm told. What do you think?", [
          n('She squints at you for a long time, like a jeweller.'),
          s('pip', "...The nose. I can't do the rest."),
          s('pip', 'I was six. I can do her hands, and her cardigan. Not the middle bit.'),
          s('pip', "That's not on the form. Don't write that down.")], R('pip')),
        o('me', 'I look like me, mostly.', [
          s('pip', 'That\'s what Mom says about herself. Then Nana says "and the nose," and Mom leaves the room.')], R('pip')),
        o('remember', 'Do you remember her?', [
          s('pip', 'Yes.'),
          beat(),
          s('pip', 'Some. I was six. She let me stir.'),
          s('pip', "Milo doesn't. He says he does. Don't tell him I said.")], R('pip'))),
      go('home:sibling', { with: ['pip', 'milo'], label: 'Walk them home. Straight home: you promised.' }),
    ]),
    sc('dinner', 'home:sibling', 'The roast', [
      n('The gate has been fixed. It now opens the other way.'),
      s('theo', 'Ah, the famous sibling. I was told to feed you on sight.', { anim: 'wave' }),
      s('theo', "Theo. We've met, but I had more hair and you had braces."),
      s('theo', "It's a roast. It's always a roast. I have one dish and a great deal of confidence."),
      n('It is loud. Somebody spills. Nora says grace, which is the word "Okay," and then everybody eating.'),
      give('meal', 'sunday_roast', { text: "Theo's roast, second helpings enforced." }),
      s('pip', "I've done the graph. You're forty percent fun. That's up from this morning."),
      n('Milo has been bent over a piece of paper for the whole meal. He slides it across to you without looking up.'),
      s('milo', 'I drew you. You are the tall one. That is a train.'),
      give('item', 'milo_drawing', { text: "Milo's drawing. It goes on the fridge. That is the law." }),
      s('theo', "Nora says you'll want work. Nora says a lot of things, and it's annoying how they turn out."),
      s('theo', "Come and find me at lunch one day. Slice of Heaven, by the Arts steps. I'm buying."),
      s('theo', "Bring your phone and an open mind. I'm going to draw on a napkin."),
      s('jules', "You were good with them. Milo doesn't draw people. He draws trains, and things that are extinct."),
      s('jules', "Come whenever. You don't knock. That's the other rule."),
    ]),
  ],
};

const ch04 = {
  id: 'ch04', n: 4, act: 1, title: 'Theo Draws on a Napkin',
  hook: 'Theo is buying lunch. He has a pen, a napkin and opinions about your week.',
  ready: "Any lunchtime you like. He's there most days anyway.",
  marker: { place: 'pizza', label: 'Slice of Heaven, by the Arts steps' },
  window: { slots: [{ from: '11:30', to: '15:00' }], closed: "Slice of Heaven is between lunches. Theo's a lunchtime man. Tomorrow will do just as well." },
  cast: ['theo', 'nico'],
  unlock: { after: 'ch03', breath: 'next_morning' },
  minutes: [6, 9],
  play: 'Open My Day and add one idea to your day; then look at the job listings and apply for a job.',
  teaches: ['My Day: what is ON your day versus ideas you could add', 'Work puts itself on your day; everything else you add',
    'Finding and applying for a job (Jobs app, or the library computers)', 'Shifts: turn up, and you may work them or coast', 'Bills every Monday'],
  takeaway: [{ type: 'ability', id: 'myday', text: 'My Day: the button in the top corner.' }, { type: 'flag', id: 'has_first_job', text: 'A job, and a first shift on your day.' },
    { type: 'place', id: 'pizza' }, { type: 'rel', id: 'theo', n: 6 }],
  scenes: [
    sc('slice', 'pizza', 'A table for two', [
      n('Slice of Heaven. An oven like a brick igloo, and Theo at a table for two in a knitted vest, guarding a napkin.'),
      s('theo', "You came. Sit. I've ordered you the one with the basil. Nico knows everybody's slice before they do.", { anim: 'wave' }),
      s('nico', "For the in-law! First one's on the house. Second one's on Theo."),
      give('meal', 'pizza_slice', { text: 'A slice with basil. Correct, as it turns out.' }),
      s('theo', "So. How long have you been here? No, don't count. That's the answer. You've stopped counting days and started having them."),
      s('theo', "That's when a person needs a napkin."),
      n('He uncaps a pen with the gravity of a man opening a loan file.'),
      s('theo', 'Three columns. HAS TO. WANT TO. MIGHT.'),
      s('theo', '"Has to" is small. Work. Rent day. Your grandmother, when summoned. Those put themselves in your week whether you like it or not.'),
      s('theo', '"Want to" is whatever you\'d actually choose. That one\'s yours to fill. Nobody fills it for you. I checked. I waited a year.'),
      s('theo', '"Might" is the whole rest of the town, waving at you.'),
      s('theo', 'Your phone has this napkin in it. Top corner of the screen. My Day. Open it.'),
      play('ui', 'myday_open', { label: 'Open My Day', hint: 'The button in the top corner.' }),
      s('theo', "Top half: what's actually on your day. Bottom half: ideas. What's on in town, what you're running low on, who'd like to see you."),
      s('theo', "The ideas aren't yours till you say so. Pick one. Anything. Put it in your day."),
      play('ui', 'myday_add', { label: 'Add one idea to your day', hint: 'Choose any suggestion and add it.' }),
      s('theo', "There. Now it's a plan and not a possibility."),
      s('theo', "That's the entire difference between a good week and a pile of evenings."),
      pick('c04_list',
        o('list', 'You really like a list.', [
          s('theo', "I'm a loans officer. I'm in love with a list. Don't tell Nora. She thinks it's her.")], R('theo')),
        o('yours', 'What\'s in your "want to" column?', [
          s('theo', 'Tuesday: the timber aisle at the Home Centre. Saturday: more of it. I contain multitudes, and they are all brackets.')], R('theo')),
        o('drift', 'And if I just want to drift?', [
          s('theo', "Then drift! Put nothing in it. The napkin's not the boss of you. It's a mirror."),
          s('theo', "You'll just know the drifting was a choice. Tastes better that way.")], R('theo'))),
      s('theo', 'Now, the "has to." The napkin says you need money. I\'d know. I\'m who people come to when they haven\'t any.'),
      s('theo', 'What sort of work? Don\'t say "anything." Everybody says "anything" and means three things.'),
      pick('c04_work',
        o('people', 'Something with people.', [
          s('theo', "Counter work, then. Coffee, the grocery, the bar. You'll know half the town by the end of the month.")], R('theo')),
        o('hands', 'Something with my hands.', [
          s('theo', "A kitchen, the docks, the courier depot. Dez will tell you it's the best job in the world."),
          s('theo', 'Dez is paid by the parcel and has no cartilage left.')], R('theo')),
        o('quiet', 'Somewhere quiet.', [
          s('theo', "The library. Or an office. Hartwell & Finch takes analysts. It's quiet the way a dentist's is quiet.")], R('theo'))),
      s('theo', 'Jobs, on your phone. Or the computers upstairs at the library, if you like a bigger screen.'),
      s('theo', "Have a look. Apply for one. Any one; you can change your mind later, people do. Go on. I'll eat your crust."),
      play('ui', 'jobs_apply', { label: 'Look at the listings and apply for a job', hint: 'Any job. It does not have to be forever.' }),
      wait('job:hired', { label: 'Hear back about the job' }),
      s('theo', 'Hired! Just like that. In my day you had to iron something.'),
      s('theo', 'Now look at My Day again.'),
      play('ui', 'myday_open', { label: 'Open My Day again' }),
      s('theo', "See? Your first shift has put itself there. That's a \"has to.\" You didn't add it. It added you."),
      s('theo', "Everything else on there, you put there. That's the system. That's the whole system. I could've saved the napkin."),
      s('theo', 'Turn up on time and they keep you. Some days you\'ll work it properly, some days you\'ll coast. Either way you were there, and that\'s what they pay for.'),
      s('theo', "Don't turn up at all, and you get a look from me at Sunday dinner. That's the real penalty."),
      s('theo', "Bills are every Monday. Walt will remind you. Then he'll remind you about the reminder."),
      s('theo', "Rule one: rent first. There is no rule two. I'm a loans officer, not a monk."),
      beat(),
      s('theo', 'Can I say a thing? In-law to... whatever you are. Out-law.'),
      s('theo', "I've been here fourteen years. Came up from Atlanta for college. It was two before I stopped telling people I was visiting."),
      s('theo', 'It goes quicker with a "has to" and a "want to." One of each. That\'s all a life is, at the start.'),
      pick('c04_inlaw',
        o('home', 'Does it feel like home now?', [
          s('theo', "Home's wherever they'd notice by lunchtime if you weren't there. So: yes. Loudly.")], R('theo')),
        o('want', 'What was your "want to"?', [
          s('theo', 'Your sister. Then a workbench. In that order, whatever she tells you.')], R('theo')),
        o('outlaw', "Out-law. I'll take it.", [
          s('theo', "Good. It's a small club. It's me and your father. Now there's a waiting list.")], R('theo'))),
      s('theo', "One thing, since you're new and you'll notice. Nora's busy on Thursdays. And Sundays. Those are Nana's days."),
      s('theo', "Don't poke at it yet. It's an old splinter. I've been at it ten years with a very small pair of tweezers."),
      s('theo', "Oh, and I'm making you a shelf."),
      pick('c04_shelf',
        o('no', "You really don't have to.", [s('theo', "Too late. It's glued.")], R('theo')),
        o('level', 'Is it level?', [s('theo', 'It has character.')], R('theo')),
        o('yes', "I'd love a shelf.", [s('theo', 'You say that now.')], R('theo'))),
      s('theo', 'Back to the desk. Somebody wants a mortgage on a houseboat. I\'m going to enjoy saying "no" very slowly.'),
    ]),
  ],
};

const ch05 = {
  id: 'ch05', n: 5, act: 1, title: 'Echo',
  hook: "Nora's coming round. She says your flat echoes. She's bringing an envelope.",
  ready: "When you've a free hour. The echo isn't going anywhere.",
  marker: { place: 'home:player', label: 'Your own front door' },
  window: { slots: [{ from: '09:00', to: '18:00' }], closed: "Nora's in for the night. She'll come by in the daytime, whenever you say." },
  cast: ['jules', 'dez'],
  unlock: { after: 'ch04', breath: 'next_morning', life: { cond: 'worked:1', orMornings: 2, waiting: "Nora wants to come and see the flat, once you've found your feet at work. No hurry." } },
  minutes: [8, 12],
  play: 'Choose one real piece at The Gilded Attic (walk up to it, pay at the counter), then give it a place at home in Decorate.',
  teaches: ['Shops sell furniture from the floor: small things you carry, big pieces arrive next morning in a box', 'Decorate: everything you own can be moved',
    'A kinder home lifts your Comfort', 'Clothes: the wardrobe, the hamper, the laundromat, Thread & Co.'],
  takeaway: [{ type: 'money', n: 60, text: "Nana's envelope: HOUSE. NOT FOOD." }, { type: 'item', id: 'wobbly_shelf' }, { type: 'place', id: 'goods:attic' },
    { type: 'ability', id: 'decorate', text: 'Decorate, from the button at home or the Roomy app.' }, { type: 'rel', id: 'jules', n: 6 }],
  scenes: [
    sc('flat', 'home:player', 'The clap', [
      n('A knock that is also the door opening.'),
      s('jules', "It's me. I knocked. That was the knock."),
      s('jules', 'Oh, {name}.'),
      n('She stands in the middle of your room and claps, once. The clap comes back.'),
      s('jules', "It echoes. You're living in a shoebox with an echo."),
      pick('c05_echo',
        o('busy', "I've been busy!", [s('jules', "You've been busy for a week. Those boxes have been here longer than your job.")], R('jules')),
        o('minimal', 'I like it minimal.', [s('jules', "This isn't minimal. Minimal is a choice. This is a waiting room.")], R('jules')),
        o('start', "I don't know where to start.", [s('jules', "Good. That one I can work with. That's just a Tuesday.")], R('jules'))),
      s('jules', "Nana sent this. Don't argue. I tried. I lost. I'm only the messenger."),
      give('money', null, { n: 60, text: 'An envelope. On the front, in firm handwriting: HOUSE. NOT FOOD.' }),
      s('jules', 'In this family we don\'t discuss envelopes. You say thank you with your eyes, on a Sunday.'),
      s('jules', "My rule for a new place: one thing you need and one thing you love. That's all. Not a whole room."),
      s('jules', 'You do a whole room at once and it looks like a catalogue died in here.'),
      s('jules', "There's a shop in Old Town I've wanted an excuse for. The Gilded Attic. Everything in it was somebody's grandmother's. Come on."),
      go('goods:attic', { with: ['jules'], label: 'Go to The Gilded Attic with Nora' }),
    ]),
    sc('attic_shop', 'goods:attic', 'The Gilded Attic', [
      n("The Gilded Attic smells of beeswax and other people's Christmases."),
      s('jules', 'How it works, here and everywhere: you walk up to the actual thing, you look at it, you pick it. Then the till.'),
      s('jules', 'Small things you carry home. Big things turn up at your door next morning in a box, and you get to open it, which is the best part.'),
      s('jules', "And if you're out when they come, they come back. They're very forgiving. More forgiving than Walt."),
      s('jules', "Go. One thing. I'll be over here pretending I don't need a fourth lamp."),
      play('buy', 'goods:any', { label: 'Choose one thing for the flat', hint: 'Walk up to a piece and pick it, then pay at the counter.', results: {
        good: [s('jules', "Oh, that's a good one. That's a \"love,\" not a \"need.\" I can tell by your face.")],
        ok: [s('jules', "Sensible. That's a \"need.\" The \"love\" can be next week. It'll find you.")] } }),
      n('On a shelf by the till, between a toast rack and a stuffed owl: a cup and saucer. White, a copper rim.'),
      n('Printed on the saucer: THE COPPER KETTLE · THIMBLE ST.'),
      n('Nora has picked it up before she knows she has.'),
      s('jules', 'Huh.'),
      s('jules', "Fourteen dollars. For one of Nana's cups. She'd be livid. She'd say it was worth twenty."),
      pick('c05_cup',
        o('buy', 'Buy it. For her.', [
          s('jules', "...No. She's got forty of them in a box. It isn't cups she's short of."),
          n('She sets it back, exactly square on its saucer.')], R('jules')),
        o('ok', 'You okay?', [
          s('jules', "I'm fine."),
          beat(),
          s('jules', "I said that in Mom's voice, didn't I. Nana does an impression of it. It's very good.")], R('jules')),
        o('wait', '(Say nothing. Wait.)', [
          n('She turns it over, reads the bottom, turns it back.'),
          s('jules', 'I learned to carry three of these up one arm. Summers, when we visited. I was twelve. I thought it was the best job in the world.')], R('jules'))),
      s('jules', 'Come on. Till. Before I buy the owl.'),
      go('home:player', { with: ['jules'], label: 'Home, with Nora' }),
    ]),
    sc('home', 'home:player', 'One thing', [
      s('jules', 'Now the good bit. Decorate. Bottom of the screen when you\'re home. Everything you own lifts up and goes where you tell it.'),
      iff('flag:ch05_delivery', [
        s('jules', "Yours comes tomorrow, in a box. So practise on something you've got. Move it. Anything. The bed, if you're feeling brave.")]),
      play('ui', 'decorate_place', { label: 'Open Decorate and give something a new place', hint: 'Drag it. Green means it fits. Done when you like it.' }),
      s('jules', 'There. Now clap.'),
      n('You clap. It comes back a little softer.'),
      s('jules', "Hear that? That's one thing. Imagine nine."),
      s('jules', "A room works on you, you know. Sit in a kind one and you're kinder. I teach eight-year-olds. I've run the experiment."),
      n('The buzzer. Then the stairs, taken three at a time.'),
      s('dez', 'Parcel for... "the sibling." That\'s all it says. Sent by Theo, who has written THE SHELF IS FINE on the form. Nobody asked him.', { anim: 'wave' }),
      give('item', 'wobbly_shelf', { text: "Theo's Wobbly Shelf. It leans one degree to the left, like somebody listening." }),
      s('jules', "He's so proud. Put a book on it. One. Start with one."),
      s('dez', "It wobbled the whole way here. I've named it. I'm not telling you the name."),
      n('Dez goes. The stairwell applauds him down.'),
      s('jules', "One more thing, and I say it with love. That's the shirt you flew in."),
      pick('c05_shirt',
        o('good', "It's my good shirt!", [s('jules', "It was. It's done three shifts and a plane.")], R('jules')),
        o('might', '...It might be.', [s('jules', 'It is. I can see the airport on it.')], R('jules')),
        o('rotate', "I've been rotating.", [s('jules', "You've been rotating two things. That's not rotating. That's flipping a coin.")], R('jules'))),
      s('jules', 'Wardrobe: change. What you\'ve worn goes in the hamper. When the hamper\'s full, the laundromat.'),
      s('jules', 'And when you want something new, Thread & Co., downtown. Imani will tell you the truth. Brace yourself.'),
      play('activity', 'wardrobe_change', { label: 'Change into something else', skip: true }),
      beat(),
      s('jules', "I should've come and got you at the airport."),
      pick('c05_airport',
        o('kids', 'Third graders. They sense weakness.', [
          s('jules', 'They do. One of them asked me if you were real.')], R('jules')),
        o('manny', 'It was fine. Manny gave me the tour.', [
          s('jules', 'Manny gives everybody the tour. Did he do the cousin in the control tower?')], R('jules')),
        o('liked', "I'd have liked that.", [
          beat(),
          s('jules', "Yeah. Me too. I'll do the next arrival. Whoever it is.")], R('jules'))),
      s('jules', "Nana says there's a chair in her attic with your name on it."),
      s('jules', "She's said so four times this week, which means she wants something, and it isn't the chair."),
      s('jules', "Go when you're ready. She'll pretend she hasn't been waiting."),
      s('jules', 'Bye, little one. Yes, I can still call you that.'),
    ]),
  ],
};

/* =====================================================================================================================
   ACT TWO — THE BOOK  (Chapters 6-10: Mom's exercise book, and the town she wrote down)
   ===================================================================================================================== */

const ch06 = {
  id: 'ch06', n: 6, act: 2, title: "Nana's Attic",
  hook: "There's a chair up Nana's ladder with your name on it.",
  ready: "It'll keep. It has kept this long.",
  marker: { place: 'home:grandma', label: "Nana Bea's blue door" },
  window: { slots: [{ from: '09:00', to: '18:00' }], closed: 'Attics are a daylight job. Nana says so, and the bulb up there went in 2019.' },
  cast: ['nana'],
  unlock: { after: 'ch05', breath: 'next_morning' },
  minutes: [6, 9],
  play: 'Open the three boxes in the attic (the unpacking mechanic: each one opens and its contents appear around you).',
  teaches: ["Mom's name; the book; that Nana has never read it", 'Pages of the book mark places on your Map', 'Keepsakes go in your home'],
  takeaway: [{ type: 'item', id: 'nells_book' }, { type: 'item', id: 'nana_armchair' }, { type: 'page', id: 'cover' },
    { type: 'ability', id: 'pages', text: "Mom's pages now show on your Map, in her handwriting, as you find them." },
    { type: 'opportunity', id: 'book_page', text: 'A new kind of Opportunity: "A page from the book" (the places she wrote down that are yours to try in your own time).' },
    { type: 'rel', id: 'nana', n: 8 }],
  scenes: [
    sc('landing', 'home:grandma', 'The ladder', [
      s('nana', 'You have come for the chair. Good.'),
      s('nana', 'I have not been up that ladder since my hip formed opinions of its own. Four years.'),
      s('nana', 'There are three boxes in front of it. Move them. Do not open them.'),
      beat(),
      s('nana', 'You are going to open them. You are a Larkin. Open them carefully.'),
      go('home:grandma:attic', { by: 'walk', label: 'Up the ladder' }),
    ]),
    sc('attic', 'home:grandma:attic', 'Under the roof', [
      n('One long slope of roof and a round window full of harbour. Dust turns in the light as if it has all the time in the world.'),
      play('activity', 'unpack_box:kettle', { label: 'The box marked KETTLE · FRAGILE' }),
      n('Menus. A stack of order pads. Forty cups in newspaper from 2016. And something round and heavy, wrapped in a tea towel.'),
      s('nana', 'Is that the teapot? Leave the teapot. LEAVE the teapot.'),
      n('You leave the teapot.'),
      play('activity', 'unpack_box:girls', { label: 'The box marked GIRLS' }),
      n('School reports. A swimming ribbon: THIRD. A recorder with JUNE scratched into it and, under that, in a different hand, IS A PEST.'),
      n('One report, 1979: "Eleanor is a pleasure to teach when she is facing the front."'),
      play('activity', 'unpack_box:tin', { label: 'Something down the side of the armchair' }),
      n('Not a box. A biscuit tin, wedged down beside the cushion, the way you would hide a thing from a sister.'),
      n('Inside: a pencil sharpener, a ferry ticket, and a school exercise book gone soft at the corners.'),
      page('cover'),
      n('Thirteen places, numbered. Pages of handwriting that leans forward as if it is late for something.'),
      n('You know the handwriting. It was on every lunch bag you ever carried.'),
      s('nana', 'You have gone quiet. I do not like a quiet attic. Have you found the chair?'),
      pick('c06_call',
        o('chair', 'Found the chair!', [s('nana', 'Then bring it down before it finds you.')], R('nana')),
        o('else', 'Found something else.', [beat(), s('nana', '...Bring that down as well, then.')], R('nana')),
        o('both', '(Say nothing. Bring both.)', [n('A ladder is harder with a book held in your teeth.')], R('nana'))),
      go('home:grandma', { by: 'walk', label: 'Down the ladder, with the chair' }),
    ]),
    sc('table', 'home:grandma', 'The kitchen table', [
      n('The armchair is green velvet with one arm worn smooth. You set the book on the kitchen table. Nana does not sit down.'),
      s('nana', 'Ah.'),
      s('nana', 'Where was it?'),
      n('You tell her. The tin. The cushion.'),
      s('nana', 'Down the side of the chair. Of course. Where she hid everything from June.'),
      s('nana', 'I know what it is. I found it the week she left. I read the list on the first page.'),
      s('nana', 'Then I put it where I would not have to look at it, and then I forgot where, which was the idea.'),
      s('nana', 'Eleanor. Nell. Nobody called her Eleanor but the school, and me when she was in trouble. So: often.'),
      s('nana', 'She was writing the town down for your father. He had been here one summer and she did not think he had looked at it properly.'),
      s('nana', 'Thirteen places. I counted. There is a page for a fish market. There is a page for a dinosaur.'),
      s('nana', 'And number twelve says "The Kettle," and under it there is nothing at all.'),
      pick('c06_ask',
        o('why', 'Why did she leave, Nana?', [
          s('nana', 'Because a quiet boy asked her to, and nobody had asked her for anything quietly in her life.'),
          s('nana', 'And there was a row. There is always a row. I shall tell you that one when I can tell it properly. Not today.')], R('nana')),
        o('time', 'Maybe she ran out of time.', [
          s('nana', 'She had time for a fish.'),
          beat(),
          s('nana', 'No. That is unkind, and it is thirty-eight years old. I should have thrown it out with the milk.')], R('nana')),
        o('kettle', '(Put the kettle on.)', [
          n('You fill it. You find the cups without being told. She watches you do it.'),
          s('nana', 'You were always the one who knew when to be quiet. Your mother never learned. It was her best quality.')], R('nana'))),
      s('nana', 'I have never read past the list. I do not think it is mine to read. It says "for F." I am not F.'),
      s('nana', 'But you. You are half F.'),
      s('nana', 'Take it. And do not put it on a shelf. That book wants walking. She wrote it to be walked.'),
      give('item', 'nells_book', { text: '"Maple Bay, for F." Mom\'s book. Her pages will mark your Map as you read them.' }),
      s('nana', 'Start with the Light. She started everybody at the Light. Half this town has been marched up those stairs by your mother.'),
      s('nana', 'And tell me what it says. Not all of it. Only whether she is funny in it.'),
      pick('c06_funny',
        o('funny', "She's funny in it.", [s('nana', 'Of course she is.'), n('She says it to the window.')], R('nana')),
        o('bossy', "She's bossy in it.", [s('nana', 'Ha! Good. Then it is really her.')], R('nana')),
        o('read', "I'll read you some. When you want.", [
          s('nana', 'When I want. Yes. I shall let you know.'),
          s('nana', 'Do not hold your breath. I am very old and very stubborn.')], R('nana'))),
      s('nana', 'Desmond will bring the chair round on his contraption. Sit in it. Your mother read in it. Upside down, mostly, with her feet where her head should be.'),
      give('item', 'nana_armchair', { text: "Nana's Attic Armchair. Dez will have it at your door by morning." }),
      s('nana', 'Go on. And {name}.'),
      s('nana', 'Thank you for going up. I could not have.'),
    ]),
  ],
};

const ch07 = {
  id: 'ch07', n: 7, act: 2, title: 'Ninety-Seven Steps',
  hook: 'Page one: The Light. "Go late in the day. Count the steps."',
  ready: "No rush. It's been lit every night since 1871.",
  marker: { place: 'spot:lighthouse', label: 'The foot of Gull Point Lighthouse' },
  window: { slots: [{ from: 'dusk-02:30', to: 'dusk-00:20' }], closed: 'She wrote: "Go late in the day." Come in the last couple of hours before dusk. The Light will be there.' },
  cast: ['dez', 'silas', 'dad'],
  unlock: { after: 'ch06', breath: 'next_morning' },
  minutes: [8, 12],
  play: 'Climb the lighthouse stair (97 real steps, counter on screen) and light the lamp at dusk.',
  teaches: ['The lighthouse and what there is to do in it', 'Reading a page of the book at its place pins it to your Map', 'Dad: the first time you describe the town to him'],
  takeaway: [{ type: 'place', id: 'lighthouse' }, { type: 'page', id: 'light' }, { type: 'item', id: 'postcard' },
    { type: 'flag', id: 'in_keepers_log', text: "Your name is in the keeper's log." }, { type: 'contact', id: 'dad' }, { type: 'rel', id: 'dez', n: 8 }],
  scenes: [
    sc('foot', 'spot:lighthouse', 'The sea wall', [
      n("The breakwater ends in a white tower and a keeper's cottage. Dez is sitting on the sea wall with his helmet on, which is how you know he is nervous."),
      s('dez', 'Nana rang me. NANA. On the PHONE.'),
      s('dez', 'She said, "Desmond, you are going up the lighthouse with your cousin." Then she hung up. I didn\'t know she had my number.'),
      s('dez', "So what's the deal. There's a book?"),
      n('You read him page one.'),
      page('light'),
      s('dez', '"Do not say anything clever." She\'d have hated me.'),
      pick('c07_hated',
        o('liked', "She'd have liked you. She liked loud.", [s('dez', "Yeah? ...Yeah. Okay. I'll take that.")], R('dez')),
        o('five', 'She gave you five dollars.', [s('dez', "And safety advice. That's basically love.")], R('dez')),
        o('stay', "You don't have to come up.", [s('dez', "Are you kidding? Nana PHONED. I'd go up it on my hands.")], R('dez'))),
      s('dez', "Right. She says count, so we count. I'll count out loud, you count in your head. Whoever's wrong buys ramen."),
      s('dez', 'Wait. The doorstep. Does the doorstep count?'),
      pick('c07_doorstep',
        o('no', 'No. Stairs are stairs.', [s('dez', 'Team Nell. Got it.')], R('dez')),
        o('yes', "Obviously it counts. It's a step.", [s('dez', "Team Frank. Bold. She's already said you're wrong.")], R('dez')),
        o('see', "Let's see when we get there.", [s('dez', 'Fence-sitter. The worst kind of counter.')], R('dez'))),
      go('lighthouse', { with: ['dez'], by: 'walk', label: "In through the keeper's cottage" }),
    ]),
    sc('stair', 'lighthouse', 'The stair', [
      play('climb', 'lighthouse_stairs', { label: 'Climb the stair. Count, if you like.', with: ['dez'], talk: [
        s('dez', "Eleven, twelve... okay, here's a thing I've never said out loud."),
        s('dez', "Nobody tells me stuff. In the family. I'm the fun one. You don't tell the fun one stuff."),
        s('dez', 'I found out your mum was ill off Nora\'s fridge. There was a calendar. It said "Mom: scan." Right next to "Pip: recorder."'),
        s('dez', "I didn't say anything. What do you say? I took round a lasagne. I don't know why. It was a bought one."),
        s('dez', "Forty... forty-something. I've lost it. Don't tell me. I'm going on feel."),
        s('dez', 'Anyway. You told me about the book before you told Theo. I noticed. That\'s all.'),
      ] }),
      pick('c07_fun',
        o('more', "You're not just the fun one.", [s('dez', "I'm MOSTLY the fun one. Ninety percent. But yeah. There's a ten.")], R('dez')),
        o('lasagne', 'A bought lasagne counts.', [
          s('dez', "Nora said it was the one thing anybody brought that she didn't have to say something nice about. She just ate it.")], R('dez')),
        o('told', 'Consider yourself told. From now on.', [s('dez', 'Deal. Everything. Even the boring stuff. Especially the boring stuff.')], R('dez'))),
      go('lighthouse_watch', { with: ['dez'], by: 'walk', label: 'The watch room' }),
    ]),
    sc('watch', 'lighthouse_watch', 'The watch room', [
      n('A round room, a stove, a desk, and a man winding a clock without looking at it.'),
      s('silas', 'Two up. Good. I heard the counting from the cottage. One of you stopped at forty.'),
      s('dez', 'Feel.'),
      s('silas', "Silas Marrow. Keeper. My father before me and his before him. We don't get out much. What did you make it?"),
      pick('c07_count',
        o('97', 'Ninety-seven.', [s('silas', 'Ninety-seven. Correct. Thank you.')], R('dez')),
        o('98', 'Ninety-eight.', [
          s('silas', "With the doorstep. There's always one."),
          s('silas', 'The doorstep is not a stair. The doorstep is an introduction.')], R('dez')),
        o('lost', 'I lost it at the second landing.', [
          s('silas', "Ninety-seven. Everybody loses it at the window. It's the view. I don't hold it against the view.")], R('dez'))),
      s('dez', "There's a ghost story says a hundred and twenty-nine."),
      s('silas', 'That is the one in the paperback. And now the film. "Maple Point Light." They gave it thirty-two more steps and a ghost.'),
      s('silas', 'We have neither. I have looked.'),
      n('You show him the page. He reads it twice, the second time with his lips.'),
      s('silas', 'Larkin. The Kettle girl. Wait.'),
      n('He takes down a ledger the size of a paving stone and turns back through it by the fistful.'),
      s('silas', "My father's hand. Fourteenth of August, 1987."),
      s('silas', '"Wind south-west, light. Lamp lit 20:12 by Miss E. Larkin and a visitor from inland. Visitor made it 98 steps. Was told."'),
      s('silas', '"Was told." That is the whole Marrow family, in two words.'),
      s('dez', "They're in the BOOK. Your mum and dad are in the actual lighthouse book."),
      s('silas', 'Everyone who lights her goes in the log. Dusk in a few minutes. Would you care to be in the log?'),
      go('lighthouse_lantern', { with: ['dez', 'silas'], by: 'walk', label: 'Up to the lantern' }),
    ]),
    sc('lantern', 'lighthouse_lantern', 'The lamp', [
      n('The lantern room is all glass and one enormous lens. It is like standing inside an eye.'),
      play('activity', 'lh_light_lamp', { label: 'Light the lamp', hint: 'When Silas nods.', with: ['silas'], results: {
        good: [n('It catches. The lens gathers the flame up, throws it out across the water, and begins, very slowly, to turn.')],
        ok: [n('It catches. The lens gathers the flame up, throws it out across the water, and begins, very slowly, to turn.')] } }),
      n('Out on the gallery the wind takes your hair. The beam goes over your heads like a slow hand.'),
      iff('season:winter', [n('There is snow on the breakwater, and the beam turns each flake on and off.')]),
      n('Dez does not say anything clever. It lasts almost a full minute.'),
      s('dez', "...Okay. Okay, I get it. It's not for tourists."),
      s('dez', 'Ring your dad.'),
      pick('c07_ring',
        o('now', 'Now? From up here?', [s('dez', "When else? You're standing in his log entry.")], R('dez')),
        o('screens', "He won't pick up. He screens.", [s('dez', "He'll pick up for you. Mine only picks up for the bank.")], R('dez')),
        o('dial', "(You're already dialling.)", [n('It rings four times. He will be finding his glasses.')], R('dez'))),
      s('dad', 'Yes. Hello. Is something wrong.', { anim: 'phone' }),
      n("You tell him where you're standing."),
      s('dad', 'The lighthouse. Hm.'),
      s('dad', 'How many steps.'),
      iff('pick:c07_count=98', [
        s('dad', 'Ninety-eight. Correct. Thank you.'),
        s('dad', 'Thirty-nine years I have waited for a second opinion.'),
      ], [
        s('dad', 'Ninety-seven.'),
        beat(),
        s('dad', "It's ninety-eight. You've missed the doorstep. Everybody misses the doorstep."),
      ]),
      s('dad', '...Who told you about the doorstep.'),
      pick('c07_tell',
        o('book', "It's in a book. Mom's. She wrote the town down for you.", [
          beat(1400),
          s('dad', 'She wrote it down.'),
          s('dad', "She said she would. I said don't bother, I've got you."),
          s('dad', 'Is she. Is she funny in it.'),
          n('You tell him she is.'),
          s('dad', "Hm. Good. Don't read it to me down a telephone. I shall want my chair.")], { rel: { dad: 2 }, flag: 'dad_knows_book' }),
        o('nana', 'Nana mentioned it.', [
          s('dad', 'Bea mentioned me. Of her own accord.'),
          s('dad', "Check she's well.")], R('dad')),
        o('guess', 'Lucky guess.', [
          s('dad', 'You never guessed lucky in your life. You get that from me.'),
          s('dad', "Tell me when you're ready to. I can wait. I'm good at it.")], R('dad'))),
      s('dad', 'What does it look like. From up there. I only ever saw it with her talking.'),
      pick('c07_narrate',
        o('gold', "The harbour's gone gold, and there's one boat coming in late.", [
          s('dad', "That'll be a trawler. There was always one late.")], R('dad')),
        o('trains', 'You can see the trains going round on their bridge with the lights on.', [
          s('dad', 'She liked the trains. Said it was the town wearing a necklace.')], R('dad')),
        o('water', "It's a lot of water, Dad. And then the light goes over it.", [
          s('dad', "Yes. That's about what I remember.")], R('dad'))),
      s('dad', 'Hm.'),
      s('dad', "You're not bad at that. Keep on."),
      s('dad', 'Mind the stairs going down. Ninety-eight.'),
      n('He has hung up. He always hangs up first, so that nobody has to say goodbye.'),
      n('Silas is writing in the ledger, slowly, with a pen on a chain.'),
      s('silas', '"Lamp lit by {name}, grandchild of the Kettle, and a courier who stopped counting at forty." There. That\'s you both in.'),
      give('flag', 'in_keepers_log', { text: "You're in the keeper's log at Gull Point." }),
      s('dez', "I'm in a book."),
      s('silas', 'Take a card from the honesty shelf on your way down. No charge to lamplighters. Post it somewhere inland.'),
      give('item', 'postcard', { text: 'A postcard of the Light. It wants a stamp and an address in Pinehollow.' }),
      s('dez', "What's page two?"),
      n('"The Fish Hall, at dawn."'),
      s('dez', "Dawn. That's a Theo job. Theo LIKES mornings. It's the strangest thing about him."),
      s('dez', "Ramen's on whoever lost. I think that's me. I think it's always me."),
    ]),
  ],
};

const ch08 = {
  id: 'ch08', n: 8, act: 2, title: 'The Only Honest Theatre',
  hook: 'Page two: The Fish Hall, at dawn. Theo says he\'ll bring the coffee.',
  ready: 'Any morning you can face it. It happens every day; it will happen without you until you come.',
  marker: { place: 'fishmarket', label: 'The Bay Fish Hall, quay door' },
  window: { slots: [{ from: '05:15', to: '07:15' }], closed: 'The auction is a dawn thing: quarter past five till about seven. Theo will be there whichever morning you choose.' },
  cast: ['theo', 'captain', 'crier'],
  unlock: { after: 'ch07', breath: 'next_morning', life: { cond: 'cooked:1', orMornings: 3, waiting: "Theo wants to take you to the fish hall, once you've cooked yourself a meal at home. He'd like to know you can be trusted with a fish." } },
  minutes: [8, 12],
  play: 'Bid at the dawn auction (the falling price clock) for the fish that goes into the Captain\'s chowder.',
  teaches: ['The fish hall and its dawn auction', 'Who Dad was the summer he came here', "Where the Copper Kettle's bell is", 'Theo, and what he thinks he owes'],
  takeaway: [{ type: 'place', id: 'fishmarket' }, { type: 'place', id: 'spot:second_wind' }, { type: 'page', id: 'fishhall' }, { type: 'page', id: 'ferry' },
    { type: 'recipe', id: 'harbor_chowder' }, { type: 'item', id: 'fm_tally' }, { type: 'contact', id: 'captain' }, { type: 'rel', id: 'theo', n: 8 }, { type: 'rel', id: 'captain', n: 6 }],
  scenes: [
    sc('quay', 'fishmarket', 'Quarter past five', [
      n('The harbour is the colour of the inside of a shell. Theo is holding two coffees and wearing the vest.'),
      iff('weather:rain', [n('Rain is coming in off the water sideways. The vest is under a yellow cape. The vest persists.')]),
      s('theo', "You came. I had a bet with myself. I lost, and I'm delighted.", { anim: 'wave' }),
      s('theo', "Nora thinks I'm at the gym. Nobody thinks I'm at the gym."),
      n('You read him page two under the door lamp.'),
      page('fishhall'),
      s('theo', '"The only honest theatre in town." That\'s Ray. Her dad. I never met the man and I\'ve been quoting him for a decade.'),
      s('theo', '"Bid on nothing." Well. There we disobey her. I\'ve promised the Captain a fish, and you\'re cooking.'),
      n('Inside it is iron and glass and wet light. Twelve stalls waking up. A cat called Biscuit is supervising the ice.'),
      s('theo', 'How it runs: the clock starts high and falls. First hand up takes the lot.'),
      s('theo', 'Too early and you have overpaid. Too late and the woman from the Gilded Gull has your fish.'),
      s('theo', "It's a loan backwards. You wait while it gets cheaper and your nerve gets dearer."),
      s('crier', 'Lot nine! Bay rockfish, line-caught, off the MARGO not forty minutes since!'),
      s('crier', 'Who will start me? Nobody starts me. The clock starts me. Watch the clock!'),
      play('minigame', 'fm_auction', { label: 'Bid on lot nine', hint: 'Hand up when the price feels right.', with: ['theo'], results: {
        good: [s('crier', 'SOLD, to the new face by the ice machine, at a price that makes me personally sad.'),
          s('theo', "Oh, that is a BEAUTIFUL number. I'm going to think about that number at work.")],
        ok: [s('crier', 'Sold! To the new face. A touch eager. We like eager. Eager pays the rent.'),
          s('theo', "You overpaid by about one coffee. That's the tuition. Everybody pays it once.")] } }),
      give('item', 'fm_tally', { text: "A brass buyer's tally. You're on the books at the Bay Fish Hall." }),
      s('theo', "Now the herring. She says herring, on the quay, with your fingers. I'm a married man with a mortgage, and I'm going to eat fish like a gull."),
      n('You do. It is smoky, and too salty, and exactly right. The boats knock against the quay like someone at a door.'),
      go('spot:second_wind', { with: ['theo'], by: 'walk', label: 'Carry the fish along the pontoon to the Second Wind' }),
    ]),
    sc('boat', 'spot:second_wind', 'Berth three', [
      n('A houseboat the green of old bottles. A cat with opinions. By the cabin door, a small brass bell.'),
      s('captain', "Ahoy. A banker and a fish. I've had worse mornings."),
      s('theo', "Captain. This is Nora's sibling. Bea's grandchild."),
      n('He looks at you the way you would look at a chart.'),
      s('captain', "Aye. That's Nell's nose coming up my gangway. I'd know it in fog."),
      pick('c08_nose',
        o('all', 'Everybody says that.', [s('captain', "Then everybody's right, for once. Enjoy it. It won't last.")], R('captain')),
        o('knew', 'You knew her?', [s('captain', "Knew her? She rode my ferry so often I should have put her on the crew list.")], R('captain')),
        o('rest', 'And the rest of me?', [s('captain', "The rest of you is inland. Quarry stock. Stands still well. I'd know that too.")], R('captain'))),
      n('You read him page three. He listens with his eyes shut, like a man taking a bearing.'),
      page('ferry'),
      s('captain', '"Do not tell the Captain." Ha!'),
      s('captain', 'I knew. Of course I knew. Forty crossings in one August, and every one of them stood by the engine hatch "for the air."'),
      s('captain', "There's no air by an engine hatch. There's diesel, and a boy."),
      s('captain', "Your father. Came down from the quarry country, summer of '87, to keep the Marigold's engine alive."),
      s('captain', 'Seasick every crossing for a month. Never missed one. Green as this hull, and would not go ashore.'),
      s('captain', 'I said, "Son, why\'d you take work on a boat?" He said, "I didn\'t know I\'d mind." Then he was sick again. I liked him enormously.'),
      s('theo', "That is the most I have ever heard anybody say about Frank. Including Frank."),
      s('captain', "He doesn't need saying. He needs standing next to. She worked that out inside a week."),
      n('The bell by the door turns a little in the wind off the water, and does not ring.'),
      pick('c08_bell',
        o('ask', 'That bell. Is it from the Kettle?', [
          s('captain', "Bea's bell. Thirty-one years over her door. Ambrose had it a while. Then I had the loan of it for the Marigold's last crossing.")], R('captain')),
        o('look', '(Look at the bell. Say nothing.)', [
          s('captain', "You've a good eye. That's Bea's. From over the Kettle door. I had the loan of it for the Marigold's last crossing.")], R('captain'))),
      s('captain', 'Nobody asked for it back. I ring it Fridays at dusk, for anybody not home yet.'),
      s('captain', "I'd hand it to you this minute. But it isn't yours to ask for, pup, and it isn't mine to offer."),
      s('captain', "A bell wants asking for. By her. She has known where I'm moored for six years."),
      s('captain', "Now. That fish. You'll not waste a rockfish like that on a frying pan. Sit. I'll talk, you chop."),
      n('He talks. You chop. Theo is given the onions, as a test of character, and weeps openly.'),
      s('theo', 'Can I tell you what she said to me? Nell. At the wedding.'),
      s('theo', 'She got me by the elbow, beside the cake. She said: "You\'ll never be from here. Neither was Frank. Don\'t fret about it."'),
      s('theo', '"It\'s the best seat in the house. You can see all of them at once."'),
      s('theo', 'I thought it was a welcome. It was a job description.'),
      s('theo', "Because here is what I can see from my seat. Nora came to this town for me. Bea thought she'd come for the tearoom."),
      s('theo', 'And nobody said which, out loud, until somebody had said something sharp over the dishes instead.'),
      s('theo', "So I've been building apology furniture for ten years."),
      pick('c08_theo',
        o('fault', "It isn't your fault she came for you.", [
          s('theo', "I know. I do know. I'd just like it on the record somewhere other than my garage.")], R('theo')),
        o('help', 'Does the furniture help?', [
          s('theo', 'Bea has six of my stools. She is four foot eleven. She can reach things now. So: a little.')], R('theo')),
        o('wobble', "Apology furniture. That's why it wobbles.", [
          s('theo', "It wobbles because I'm bad at it. But I take the point. It's guilty wood.")], R('theo'))),
      s('captain', "You two done? Good. A chowder doesn't care whose fault anything is. Bowls."),
      give('meal', 'harbor_chowder', { text: "The Captain's chowder, on deck, at seven in the morning." }),
      s('captain', "And you'll take the recipe. It's a trade. I'll want a bowl of yours one day, and I'll tell you what you did wrong."),
      give('recipe', 'harbor_chowder', { text: "Captain's Harbor Chowder. You can make it at home now." }),
      s('captain', 'Off you go, banker. You have a desk. And you: come by some Friday at dusk. I\'ll let you ring her. Once.'),
      s('theo', "Don't tell Nora about the herring. Tell her about the gym. I did a great deal of lifting. I lifted a fish."),
    ]),
  ],
};

const ch09 = {
  id: 'ch09', n: 9, act: 2, title: 'Pip Investigates',
  hook: 'Pip has opened a file. She needs an adult. You are the adult.',
  ready: 'Whenever you have a spare hour. The file can stay open.',
  marker: { place: 'spot:city_hall_steps', label: 'Pip, on the City Hall steps' },
  window: { slots: [{ days: ['mon', 'tue', 'wed', 'thu', 'fri'], from: '10:00', to: '15:00' }, { days: ['sat'], from: '10:00', to: '13:00' }],
    closed: 'The archive keeps office hours: weekdays into the afternoon, Saturday mornings. Pip has checked. Twice.' },
  cast: ['pip', 'hester', 'ambrose'],
  unlock: { after: 'ch08', breath: 'next_morning' },
  minutes: [8, 12],
  play: 'Work the microfilm reader in the City Hall archive: wind the reel and bring two old newspaper pages into focus.',
  teaches: ['City Hall and its archive', 'What Nana said in print in 1988', 'The Copper Kettle on its opening day', 'What Mom said about the blank page, the night before she left'],
  takeaway: [{ type: 'place', id: 'cityhall' }, { type: 'place', id: 'bookstore' }, { type: 'item', id: 'kettle_photo' }, { type: 'contact', id: 'ambrose' },
    { type: 'rel', id: 'pip', n: 8 }, { type: 'rel', id: 'ambrose', n: 5 }],
  scenes: [
    sc('steps', 'spot:city_hall_steps', 'The steps', [
      n('City Hall steps. Pigeons. Pip, with a clipboard, a lanyard she has made herself, and a note safety-pinned to her coat.'),
      n('The note reads: "Back by 4. She has had lunch. Do NOT buy her a gavel. N."'),
      iff('day:weekday', [s('pip', "It's a teacher training day. I didn't ask what they're being trained in. I don't want to know what they don't know.")]),
      s('pip', "{title}. Good. You're on time. I've opened a file."),
      s('pip', '"CASE ONE. Why did Grandma Nell leave Maple Bay. Evidence: none. Witnesses: old."'),
      s('pip', 'Nana says "a quiet boy asked." Mom says "ask Nana." Dad says "ask your mother." That\'s a circle. I drew it. It\'s a circle.'),
      pick('c09_case',
        o('think', 'What do you think happened?', [s('pip', "I don't think. I find out. THEN I think. That's the order.")], R('pip')),
        o('move', "Maybe it's not a mystery. People move.", [s('pip', 'Then it\'ll be a short file. I like a short file. I\'ve got a sticker that says CLOSED.')], R('pip')),
        o('why', 'Why do you want to know?', [
          s('pip', 'Because.'),
          beat(),
          s('pip', "Because everybody goes weird when she comes up. I'd like to know what kind of weird. So I can plan.")], R('pip'))),
      s('pip', 'The city keeps every newspaper. In the basement. On tiny film.'),
      s('pip', 'I\'ve wanted to use the machine since I was seven, and they said I needed "an adult." You\'re my adult.'),
      go('cityhall_archive', { with: ['pip'], by: 'walk', label: 'Down to the archive with Pip' }),
    ]),
    sc('archive', 'cityhall_archive', 'The archive', [
      n('The basement smells of cold paper. Map drawers, grey shelves, two machines like hooded televisions.'),
      s('hester', 'Number?'),
      s('pip', "We don't have a number. It's the archive. There's nobody here."),
      s('hester', 'There is a system.'),
      n('Pip takes a number. It is 1.'),
      s('hester', 'Number one.'),
      s('pip', 'We require The Bay Courier. September, 1988. Please.'),
      s('hester', '"We." Hm. Reel fourteen. Wind it gently. It is older than your mother. Left knob for along, right knob for sharp.'),
      play('activity', 'ch_microfilm:1988', { label: 'Wind the reel to September 1988', hint: 'Along, then sharp. Look for a name you know.', with: ['pip'] }),
      n('Shipping news. A cannery strike. An advertisement for a hat. And low on page six, a column called COMINGS & GOINGS.'),
      n('"Miss Eleanor Larkin of Thimble Street leaves us on Saturday for Pinehollow, where she is to be married."'),
      n('"The Copper Kettle\'s loss, remarks her mother, is entirely Pinehollow\'s gain."'),
      s('pip', '..."Remarks her mother."'),
      s('pip', "That's a sarcasm. Nana did a sarcasm IN THE NEWSPAPER."),
      s('hester', 'Mrs. Larkin telephoned that in herself. I was the junior. I typed it. I asked was she sure. She said, "Print it, dear."'),
      s('pip', 'Writing down: "Nana was cross. In public. With witnesses."'),
      s('pip', 'Now go back. June, 1985. Mom says that\'s when the Kettle opened.'),
      play('activity', 'ch_microfilm:1985', { label: 'Wind back to June 1985', hint: 'A front page, this time.', with: ['pip'] }),
      n('COPPER KETTLE OPENS ON THIMBLE STREET. A doorway, a brass bell. A small upright woman with flour on her cheek. A tall man in a motorman\'s cap. Two girls.'),
      n('The older girl is holding the door open with her foot, and laughing at whoever has the camera.'),
      n('Pip has stopped writing.'),
      s('pip', "That's her."),
      s('pip', "That's the middle bit."),
      pick('c09_face',
        o('her', "That's her. Eighteen.", [s('pip', "She looks like Mom when Mom's winning at cards.")], R('pip')),
        o('let', '(Let her look.)', [n('She looks for a long time, the way she looked at you in the park. Like a jeweller.')], R('pip')),
        o('copy', 'You can have a copy. They print them.', [
          s('pip', 'They PRINT them?'),
          s('hester', 'Two dollars. Three with a frame. Exact change is appreciated.')], R('pip'))),
      s('pip', "I couldn't do her face. I told you. I could do hands, and cardigan."),
      s('pip', "I thought if I couldn't do her face it meant I wasn't... that I didn't..."),
      s('pip', "I was SIX. Six is quite old. You're supposed to keep things from six."),
      pick('c09_forget',
        o('too', 'I forget bits too. And I had her my whole life.', [
          s('pip', 'You do? Which bits?'),
          n('You tell her. The exact sound of the car door. Which hand she stirred with.'),
          s('pip', "Left. She stirred with her left. I've got that one."),
          s('pip', "...We could swap. I've got left hand. What have you got?")], R('pip')),
        o('not', "Forgetting her face isn't forgetting her.", [
          s('pip', 'That sounds like a thing grown-ups say.'),
          beat(),
          s('pip', 'Is it true, though?'),
          n('You say yes.'),
          s('pip', 'Okay. It goes in the file as "unconfirmed but likely."')], R('pip')),
        o('file', "That's what a photograph is for. So you needn't hold it all in your head.", [
          s('pip', 'Like a file.'),
          s('pip', "It's a file for a face. Okay. That's good. That's actually good.")], R('pip'))),
      give('item', 'kettle_photo', { text: 'A print of the Copper Kettle, June 1985. Pip gets one too.' }),
      s('hester', 'The second print is no charge. The child took a number. Nobody takes a number.'),
      s('hester', 'The photograph is credited to "the boy from the bookshop." He is fifty-eight now. He still alphabetises.'),
      s('pip', 'I know him! He gives me the damaged comics. One more witness. Come on.'),
      go('bookstore', { with: ['pip'], label: 'Walk Pip over to Dog-Eared Books' }),
    ]),
    sc('bookshop', 'bookstore', 'The witness', [
      n("Dog-Eared Books. A door bell that works, a cat that doesn't, and Ambrose up a ladder pretending he has not seen you."),
      s('pip', "Mr. Ambrose. I'm here in an official capacity."),
      s('ambrose', "Then I'll come down in one."),
      n('Pip lays the photograph on the counter. He looks at it for some time.'),
      s('ambrose', "I took that. My father's camera. I was seventeen and I had the lens cap on for the first three."),
      s('ambrose', 'She\'s laughing at me. You can tell, can\'t you? That isn\'t a "cheese" laugh. That\'s a "the cap is still on, Ambrose" laugh.'),
      s('pip', 'Were you friends with Grandma Nell? Yes or no.'),
      s('ambrose', "I was going to marry your grandmother. She wasn't informed."),
      s('pip', '...I\'m writing "yes."'),
      s('ambrose', "And you'll be the one with the book. Bea told Roz, Roz told me, and I have told nobody, which in Old Town is some kind of record."),
      s('ambrose', 'I sold her that book. Thirty-five cents. She beat me down from forty.'),
      s('ambrose', 'The night before she left she came in and sat on that step-stool till closing. Had the book open at one page. Two hours. Never wrote a word.'),
      s('ambrose', 'Then she said, "You can\'t write somebody directions to a place you never had to find."'),
      s('ambrose', "And she bought a pencil sharpener she didn't need, and she went."),
      s('pip', 'Which page?'),
      s('ambrose', "The Kettle. I looked. I'm not proud of looking."),
      pick('c09_ambrose',
        o('nana', 'Did you ever tell Nana that?', [
          s('ambrose', 'I tried, once. She said, "Ambrose, I do not need Nell explained to me by a boy who alphabetises." Which was fair.')], R('ambrose')),
        o('purpose', "So she didn't leave it blank to be unkind.", [
          s('ambrose', 'Oh, she left it blank on purpose. Only not the purpose Bea thinks.')], R('ambrose')),
        o('bell', 'Thank you for keeping the bell.', [
          s('ambrose', "Ah. You've met the Captain. Four years it sat on that shelf, between Poetry and Maritime. They seemed the right two.")], R('ambrose'))),
      s('pip', 'Witness is reliable but soppy.'),
      s('ambrose', "I'll take it."),
      s('pip', "Case status: not closed. But I've got a face on file now. That was the main thing. I didn't say so. But it was."),
      s('pip', "You can walk me to the bus. I have to be back by four and I'm not allowed a gavel."),
    ]),
  ],
};

const ch10 = {
  id: 'ch10', n: 10, act: 2, title: 'Say Hello to Marge',
  hook: 'Page four: Marge. Nora needs someone to mind Milo for an afternoon.',
  ready: "When you've an afternoon. Marge has waited sixty-six million years; she can manage a few more days.",
  marker: { place: 'museum', label: 'The Museum of Maple Bay, front steps' },
  window: { slots: [{ from: '10:00', to: '16:30' }], closed: 'The museum is shut for the night. Marge keeps daytime hours. Any day will do.' },
  cast: ['milo', 'jules'],
  unlock: { after: 'ch09', breath: 'next_morning' },
  minutes: [7, 10],
  play: 'Brush a fossil out of the dig pit with Milo (the museum dig game).',
  teaches: ['The Museum of Maple Bay', 'Great-grandpa Ray drove Streetcar No. 9', 'Milo does not remember her, and what you give him instead'],
  takeaway: [{ type: 'place', id: 'museum' }, { type: 'page', id: 'marge' }, { type: 'item', id: 'best_sticker' },
    { type: 'flag', id: 'milo_memory', text: 'You gave Milo one of your memories of her.' }, { type: 'rel', id: 'milo', n: 10 }],
  scenes: [
    sc('steps', 'museum', 'The steps', [
      n('The museum steps. Nora is crouched, doing up a small coat that does not want doing up.'),
      s('jules', "Okay. He's had a snack. He's holding a snack. There's a third snack in the hood. He doesn't know about that one."),
      s('jules', "I've got parents' evening till six. You're in charge of a six-year-old in a building full of bones. You'll be fine. He'll be in charge, really."),
      s('jules', "One thing. He talks when he's ready. Don't fill the gaps for him. He hates it. He gets that from Dad."),
      pick('c10_nora',
        o('fine', "We'll be fine. Won't we, Milo.", [n('The hood considers it.'), s('milo', 'Yes.')], R('milo')),
        o('quiet', "What if he doesn't talk at all?", [
          s('jules', "Then you'll have a lovely quiet afternoon with some dinosaurs. There are worse afternoons.")], R('jules')),
        o('rules', 'Any rules?', [s('jules', "No gift shop till the end. He knows. He'll pretend he doesn't.")], R('jules'))),
      n('You show her page four.'),
      page('marge'),
      s('jules', '"Symphony Street." God. That\'s the old building. It\'s the concert hall now.'),
      s('jules', "They moved Marge in '09, in pieces, on a flatbed. Nana watched from the bakery and said it was the best parade this town ever had."),
      s('jules', 'Go on. Say hello for me.'),
    ]),
    sc('hall', 'museum', 'The Grand Hall', [
      n('A whale hangs from the ceiling like a slow thought. Under it, forty feet of tyrannosaur with her head lowered, as if she is listening.'),
      n('Milo walks up to the rope. He stands very straight.'),
      s('milo', 'Hello, Marge.'),
      s('milo', 'Nell sent me.'),
      n('A guard by the pillar nods, gravely, as to a regular.'),
      pick('c10_hello',
        o('too', 'Hello, Marge. Nell sent me too.', [
          s('milo', 'You have to say it like you mean it.'),
          n('You say it again. Like you mean it.'),
          s('milo', 'Okay. She heard.')], R('milo')),
        o('stand', '(Stand next to him. Say nothing.)', [
          n('The two of you look up at her teeth for a while.'),
          s('milo', "She's not scary. She's just big. People get those mixed up.")], R('milo')),
        o('remember', 'Do you think she remembers Nell?', [
          s('milo', "She's a fossil."),
          beat(),
          s('milo', '...Probably, though.')], R('milo'))),
      s('milo', 'The book says look at one thing. I know which thing.'),
      n('From somewhere in the hood he produces a family membership card on a string.'),
      s('milo', "Mom's card. I'm allowed."),
      walk('dig_pit', [], { with: ['milo'] }),
      s('milo', 'This is the dig. You have to brush. Not scrape. Scraping is how you lose a toe.'),
      play('minigame', 'mus_dig', { label: 'Brush out a fossil with Milo', hint: 'Gently. He is watching your technique.', with: ['milo'], talk: [
        s('milo', "I don't remember her."),
        s('milo', "Grandma Nell. Pip does. Pip says it's because I was a baby."),
        s('milo', 'I was THREE.'),
        s('milo', "Three's not a baby. I knew eleven dinosaurs when I was three."),
        s('milo', "I say I remember. At dinner. It's a lie. It's my only one."),
      ], results: {
        good: [s('milo', "That's a rib. You found a rib. That's a good one to find.")],
        ok: [s('milo', "That's a rock. It's a nice rock. Keep going.")] } }),
      s('milo', 'Do you remember her?'),
      n('He does not look up from the brush.'),
      pick('c10_memory',
        o('song', 'She sang in the car. All the wrong words. On purpose.', [
          s('milo', 'What wrong words?'),
          n('You sing him a bit. A guard looks over. You sing it quieter.'),
          s('milo', "...That's not how it goes."),
          n('"No," you say.'),
          s('milo', "That's good.")], R('milo')),
        o('narrate', 'She told you what everything was. All the time. "That\'s where I fell off my bike."', [
          s('milo', 'Where did she fall off her bike?'),
          n('You do not know. You never asked which street.'),
          s('milo', 'We could find it.'),
          beat(),
          s('milo', "There'll be a mark.")], R('milo')),
        o('notes', 'She put notes in my lunch. Every day. Bossy ones.', [
          s('milo', 'What did they say?'),
          n('"Eat the apple. I\'ll know."'),
          s('milo', 'Did she know?'),
          n('"Always."'),
          s('milo', '...How?')], R('milo'))),
      s('milo', 'Can I have that one?'),
      s('milo', "To remember. If you tell me it, and I remember you telling me, then I've got one. That's not a lie. I checked with myself."),
      pick('c10_give',
        o('yours', "It's yours.", [s('milo', 'Okay.'), n('He brushes for a while.'), s('milo', 'Thank you.')], R('milo')),
        o('all', 'You can have all of mine.', [
          s('milo', "Just that one. I only need one. Pip's got loads. It makes her sad.")], R('milo')),
        o('halves', "We'll go halves.", [
          s('milo', 'Okay. Halves.'),
          n('He holds out a small sandy hand, and you shake on it.')], R('milo'))),
      give('flag', 'milo_memory', { text: 'Milo has a memory of Grandma Nell now. It used to be yours. It still is.' }),
      s('milo', "There's one more thing. It's low down. Grown-ups walk past it."),
      walk('tram_case', [], { with: ['milo'] }),
      n('City History. A glass case at exactly six-year-old height: a model streetcar, a brass controller handle, a photograph of a crew.'),
      n('The label reads: "Motorman R. Larkin and Conductor G. Pike, Car No. 9, 1978."'),
      s('milo', "That's Nana's Ray. He drove the train."),
      pick('c10_train',
        o('streetcar', 'Streetcar.', [s('milo', 'Train.'), n('You know when you are beaten.')], R('milo')),
        o('great', "He's your great-grandad.", [s('milo', "I know. He's got my ears. Mom says.")], R('milo')),
        o('pike', 'Mr. Pike lives in my building, you know. The real one.', [
          n('The hood comes up. It is the first time he has looked straight at you all day.'),
          s('milo', 'The REAL one?'),
          s('milo', 'Can I meet him? I have questions. About the bell.')], R('milo'))),
      s('milo', "We're in a museum."),
      s('milo', "Our family. We're in a glass case."),
      s('milo', 'Are we extinct?'),
      pick('c10_extinct',
        o('loads', "No. We're the opposite. There's loads of us.", [
          s('milo', "Good. Extinct is when there's none left. I'd know.")], R('milo')),
        o('you', "Not while you're around.", [s('milo', "I'm six. I'll be around for ages.")], R('milo')),
        o('hats', 'Only the hats.', [
          n("He studies the motorman's cap for a long moment."),
          s('milo', '...The hats are extinct.'),
          n('It is, you understand, the first joke he has made in front of you, and he made it for you.')], R('milo'))),
    ]),
    sc('out', 'museum', 'The sticker', [
      n('At the doors he stops and opens his fist. A sticker, slightly damp. A foil stegosaurus.'),
      s('milo', "I saved you a sticker. It's the best one. Don't lose it."),
      give('item', 'best_sticker', { text: 'The Best Sticker. Do not lose it.' }),
      s('milo', "You can sit next to me at Sunday dinner. That's your spot now."),
      n("Nora, coming up the steps with a tote bag full of other people's children's reports."),
      s('jules', 'Well? Did he talk?'),
      pick('c10_report',
        o('bit', 'A bit.', [
          s('jules', '"A bit," from Milo, is a lecture series. What about?'),
          n('You look at Milo. Milo looks at a pigeon.'),
          s('jules', 'Fine. Keep your secrets, the pair of you.')], R('milo')),
        o('joke', 'He made a joke.', [s('jules', 'He WHAT.'), s('milo', 'It was about hats.')], R('milo')),
        o('ours', "That's between me and Milo.", [
          n('The hood nods, once.'),
          s('jules', "Oh, I see. It's like that now. Good. It's about time he had a person.")], R('milo'))),
    ]),
  ],
};

/* =====================================================================================================================
   ACT THREE — THE BLANK PAGES  (Chapters 11-15: what nobody said, and the pages she left for someone else)
   ===================================================================================================================== */

const ch11 = {
  id: 'ch11', n: 11, act: 3, title: 'The Kettle in the Sky',
  hook: 'Page five: The Dome. "Clear nights only." Nora and Theo are making a night of it.',
  ready: "No hurry. The stars aren't going anywhere either.",
  marker: { place: 'observatory', label: 'Maple Bay Observatory, Skyline Drive' },
  window: { slots: [{ from: '19:30', to: '23:00' }], weather: 'clear', closed: 'She wrote: "Clear nights only." Come after dark when the sky is open. It always comes round again.' },
  cast: ['jules', 'theo'],
  unlock: { after: 'ch10', breath: 'next_morning' },
  minutes: [8, 12],
  play: "Trace tonight's constellation on the roof terrace finder (the tracing game), then find Mom's Kettle.",
  teaches: ['The Observatory and its roof at night', 'What Nora has carried: not being there, and one sentence from Mom', 'Why Nora and Nana are careful with each other'],
  takeaway: [{ type: 'place', id: 'observatory' }, { type: 'page', id: 'dome' }, { type: 'item', id: 'obs_starwheel' }, { type: 'rel', id: 'jules', n: 12 }, { type: 'rel', id: 'theo', n: 4 }],
  scenes: [
    sc('rotunda', 'observatory', 'The rotunda', [
      n("The observatory at night. A pendulum swings in the rotunda like a slow metronome. Your sister is wearing the coat she only wears when she is Going Out."),
      s('theo', 'Date night! With a chaperone. Like the old days. Bea sent a cousin along on our first four.'),
      s('jules', "Dez's mum. She ate all the popcorn and reported back."),
      s('jules', "Read me the page. Theo's heard it. You read it to him at a fish market, apparently, at an hour I don't believe in."),
      page('dome'),
      s('jules', '"Go home and kiss me instead."'),
      s('jules', 'MOM.'),
      s('theo', "I think she's wonderful."),
      s('jules', 'You would. You never had to share a bathroom with her.'),
      go('observatory:roof', { with: ['jules', 'theo'], by: 'walk', label: 'Up to the roof terrace' }),
    ]),
    sc('roof', 'observatory:roof', 'The roof', [
      n('The roof terrace. The whole town below with its lights on, and above it the other one.'),
      iff('season:winter', [n('Your breath goes up and joins it.')]),
      s('theo', "Right. There's a finder with a chart. You trace one of the proper ones. Then we look for hers."),
      play('minigame', 'obs_trace', { label: "Trace tonight's constellation", hint: 'Star to star. Take your time.', with: ['theo', 'jules'], results: {
        good: [s('theo', "Look at that. First go. My first time I had Orion's belt round his ankles.")],
        ok: [s('theo', "Close enough for a banker. My first time I had Orion's belt round his ankles.")] } }),
      s('jules', 'Okay. A pan with a bent handle. That\'s... oh, come ON. That\'s the Big Dipper. She has just renamed the Big Dipper.'),
      s('theo', "She's renamed it and given it away. That isn't astronomy. That's property law."),
      s('jules', "There. See it? Handle, pan. Tipped, like it's pouring."),
      n('You see it. Now you cannot not.'),
      s('jules', "Thirty-eight years she's had Dad believing there is a constellation called the Kettle. He told me about it when I was nine. With total authority."),
      s('theo', "I'm going for cocoa. Three cocoas. I'm going to be slow about it."),
      n('He kisses the top of her head on the way past, as if leaving a note.'),
    ]),
    sc('deckchairs', 'observatory:roof', 'Two deckchairs', [
      n('Your sister takes the deckchair with the blanket and gives you half of it without asking.'),
      s('jules', 'He does that. He "goes for cocoa." It\'s how he tells me I need to say something.'),
      beat(1200),
      s('jules', "I wasn't there."),
      s('jules', 'For Mom. The last year. You were. I was a face on a phone, propped up against a fruit bowl.'),
      s('jules', 'I flew in three times. I counted. And one of those was the funeral, and Milo had an ear infection, so I spent half of it in a pharmacy.'),
      pick('c11_there',
        o('kind', 'You had two small kids and a plane between us.', [
          s('jules', "That's what Theo says. That's what Dad said. It's very reasonable."),
          s('jules', "It doesn't get in, though. Reasonable doesn't get in.")], R('jules')),
        o('honest', 'It was hard on my own. I was angry with you for a while.', [
          beat(1400),
          s('jules', 'Yeah.'),
          s('jules', "Thank you. No, I mean it. Everybody's been so NICE about it. I've wanted someone to be angry with me for two years.")], R('jules')),
        o('joke', 'You missed nothing. Dad made soup. It was a crime scene.', [
          s('jules', 'The barley one?'),
          s('jules', "Oh, God. The barley one. She'd have eaten it to be polite, and then telephoned me.")], R('jules'))),
      s('jules', "And here's the thing I've never said. Theo's guessed it, because he's Theo."),
      s('jules', 'When I told her I was moving here. Ten years ago. I rang her. I was so pleased with myself. Her town! I thought she\'d cry.'),
      s('jules', 'She went quiet. Then she said, "It\'s a hard town to leave." And then she asked about the weather.'),
      s('jules', "That's all I got. I've carried it around for ten years like a parking ticket."),
      s('jules', "I thought she meant: don't. I thought she meant: I got out, and you're going back."),
      pick('c11_hard',
        o('jealous', 'Maybe she was jealous.', [
          s('jules', 'Of ME?'),
          s('jules', '...She did go quiet in a jealous way. She did the same when June got the piano.')], R('jules')),
        o('true', "Maybe it wasn't about you. Maybe it was just true.", [
          s('jules', '"It\'s a hard town to leave."'),
          s('jules', "Huh. Say it flat like that, and it's only a thing a homesick person says.")], R('jules')),
        o('ask', 'Did you ever ask her what she meant?', [
          s('jules', "No. God, no. We don't ask. We send jam.")], R('jules'))),
      s('jules', 'And then Nana. Theo told you about Thursdays? Of course he did.'),
      s('jules', 'Nana wanted me to have the Kettle. I said no. Badly. In her own kitchen, with my coat on.'),
      s('jules', 'She said, "Then it ends with me." Sharp, like that. And she closed it that winter.'),
      s('jules', "So that's two of them. Mom, who I think didn't want me here. And Nana, who I think can't forgive me for coming and not staying behind her counter."),
      s('jules', 'And I live in between them, like a comma.'),
      beat(),
      s('jules', "You found that book inside a month. I've lived here ten years and I never once went up the ladder."),
      pick('c11_ladder',
        o('hidden', "You weren't meant to find it. It was down the side of a chair.", [
          s('jules', 'Hidden from the sister. Yes. That tracks. I hid my diary in the piano.')], R('jules')),
        o('busy', 'You were busy holding everything else up.', [
          s('jules', "...Don't be kind to me on a roof. I've only got the one tissue.")], R('jules')),
        o('next', 'Come to the next page with me.', [
          s('jules', "What's the next page?"),
          n('"The College."'),
          s('jules', 'Mom never went to college.'),
          n('You say nothing. The book says otherwise.'),
          s('jules', '...Did she?')], R('jules'))),
      n('Footsteps. A tray. Three cocoas, and a man reading the air.'),
      s('theo', "I've brought... no. No, I'll take another lap."),
      s('jules', "Theo. Sit down. We're done. Mostly."),
      s('theo', 'Did you find it?'),
      s('jules', "It's the Big Dipper."),
      s('theo', "It's the KETTLE. Show some respect. It belongs to your father."),
      give('item', 'obs_starwheel', { text: 'A star wheel from the Star Shop. Theo has drawn the Kettle on it. In pen.' }),
      s('theo', "Dial in the date and it shows you what's up there. I've added hers. It's not coming off."),
      s('jules', 'Hey. I keep calling you "little one."'),
      s('jules', "You're the one who stayed. I'm going to try to stop."),
      pick('c11_little',
        o('keep', "Don't. I'd miss it.", [s('jules', "Oh, thank God. I'd have lasted a day.")], R('jules')),
        o('kiddo', 'I\'ll allow "kiddo."', [s('jules', "Kiddo. Fine. Kiddo's a promotion.")], R('jules')),
        o('stayed', 'You stayed too. Only somewhere else.', [beat(), s('jules', '...Okay. Now I need the tissue.')], R('jules'))),
      s('theo', "Home. Nana has the children, which means they've had cake for dinner and learned a card game."),
    ]),
  ],
};

const ch12 = {
  id: 'ch12', n: 12, act: 3, title: 'One Term Short',
  hook: 'Page eleven: The College. Two lines, and then nothing.',
  ready: "Whenever suits. It's waited since the autumn of 1988.",
  marker: { place: 'spot:campus_green', label: 'The campus green, by the clock tower' },
  window: { slots: [{ days: ['mon', 'tue', 'wed', 'thu', 'fri'], from: '09:30', to: '14:00' }],
    closed: "Mrs. Pym's office keeps weekday hours, mornings into early afternoon. The page isn't going anywhere." },
  cast: ['kit', 'pym', 'jules'],
  unlock: { after: 'ch11', breath: 'next_morning' },
  minutes: [9, 12],
  play: 'Sit in on an open lecture in the Ashby Theatre and answer when the lecturer asks (the class mechanic).',
  teaches: ['The University: classes you can take', 'Mom was one term short of being a teacher, at the school where Nora teaches', 'What "a hard town to leave" meant', 'Nana paid for the last term'],
  takeaway: [{ type: 'place', id: 'university' }, { type: 'page', id: 'college' }, { type: 'item', id: 'nell_postcard' },
    { type: 'ability', id: 'nell_credit', text: "Mom's ninth term: one course at the University, paid for in 1988." }, { type: 'rel', id: 'kit', n: 8 }, { type: 'rel', id: 'jules', n: 10 }],
  scenes: [
    sc('green', 'spot:campus_green', 'The green', [
      n('The campus green. Bicycles, a clock tower that runs two minutes fast, and on the steps a teal bob, a denim jacket and a guitar case.'),
      iff('met:kit', [
        s('kit', 'There you are. You texted "the College" as if I\'d know what that meant.'),
        s('kit', 'I did know, actually. Which is the strange part.'),
      ], [
        s('kit', 'No way. NO way. {name}?! In my actual city?', { anim: 'wave' }),
        s('kit', 'Kit. Navarro. Alder Street. I sat next to you in every class that allowed it, and you still owe me a pencil.'),
        s('kit', "Nora said you'd moved. I've been meaning to... I'm bad at meaning to. Hi."),
        give('contact', 'kit', { text: 'Kit Navarro is in your contacts.' }),
      ]),
      s('kit', "You know your mum's the reason I'm here?"),
      s('kit', 'Us kids on Alder Street, she did this town for us like a bedtime story. The glass house. The dinosaur.'),
      s('kit', 'The lighthouse had about four hundred steps, the way she told it.'),
      s('kit', 'I got here for art school and it had ninety-seven. I felt cheated. I counted twice.'),
      pick('c12_kit',
        o('never', 'She never told ME those stories.', [
          s('kit', "No? ...Huh. Maybe you don't tell them at home. Maybe at home it's just being homesick.")], R('kit')),
        o('steps', "Four hundred. And the ghost story's got it at 129.", [
          s('kit', "Everybody adds steps. Town tradition. Give me ten years and I'll be telling people six hundred.")], R('kit')),
        o('say', 'Why did you never say?', [
          s('kit', "I thought you knew! I thought it was your whole family's thing. Turns out it was only hers.")], R('kit'))),
      n('You show her page eleven. It is two lines long.'),
      page('college'),
      s('kit', '"Write this one properly when term starts."'),
      s('kit', '...She was a student here? Your mum?'),
      s('kit', "Mrs. Pym's still there, you know. Same office. I think she came with the building."),
      s('kit', "Come on. She frightens me, so you're going first."),
      go('university', { with: ['kit'], by: 'walk', label: "Find Mrs. Pym's office in University Hall" }),
    ]),
    sc('registrar', 'university', 'The second door', [
      n('A door with frosted glass, standing half open.'),
      s('kit', 'Open. "In and cross."'),
      s('pym', 'Forms in black ink. Blue ink is for people who have given up. Name.'),
      n('You say yours. Then you say hers.'),
      s('pym', 'Larkin.'),
      n('She does not go to the computer. She goes to a wooden drawer and, without searching, takes out a card.'),
      s('pym', 'Larkin, Eleanor. Certificate in Elementary Education. Entered 1985. Eight terms completed, of nine.'),
      s('pym', 'Withdrew, September 1988. Reason given: "Pinehollow."'),
      s('pym', 'I wrote "not a reason" beside it, in pencil. I see no cause to rub it out.'),
      s('kit', 'She was going to be a teacher.'),
      s('pym', 'She was going to be a very good one. Her practice term was at Maplewood Elementary. The report is attached.'),
      s('pym', '"Miss Larkin has the room in the palm of her hand and appears not to know it."'),
      pick('c12_pym',
        o('sister', 'Maplewood Elementary. My sister teaches there.', [
          s('pym', 'Does she. Then somebody finished the certificate. I shall make a note. In pencil.')], R('kit')),
        o('why', 'Did she say why she was going?', [
          s('pym', 'She said, "I\'ll be back for the spring term, Mrs. Pym." I said, "They all say that, Miss Larkin."'),
          s('pym', 'She said, "Then I\'ll be the one who does." I kept her card at the front of the drawer for six years.')], R('kit')),
        o('remember', 'You remember her.', [
          s('pym', 'I remember all of them. The ones who wrote in blue, more vividly.'),
          s('pym', 'She wrote in blue. I let it pass. I have never known why.')], R('kit'))),
      s('pym', 'There is one further matter. The ninth-term fee. Paid in advance, in cash, in August 1988, by a Mrs. B. Larkin.'),
      s('pym', 'Never refunded. Never claimed. It has sat in my ledger for thirty-eight years, annoying me.'),
      n('Kit looks at you. You look at the ledger. Nana paid for the last term.'),
      s('pym', 'I do not give refunds. I give terms. You are next of kin. The term is yours. Any course you like. Black ink.'),
      give('ability', 'nell_credit', { text: "Mom's ninth term is yours: one course at the University, paid for in 1988." }),
      s('pym', 'There is an open lecture in the Ashby Theatre in ten minutes. You may as well begin as she would have gone on.'),
      s('pym', 'Sit at the front. She never did.'),
      go('university:lecture', { with: ['kit'], by: 'walk', label: 'The Ashby Lecture Theatre' }),
    ]),
    sc('lecture', 'university:lecture', 'The front row', [
      play('activity', 'uni_open_lecture', { label: 'Sit in on the lecture. Answer if you are asked.', with: ['kit'], talk: [
        s('kit', "I haven't been in here since my finals. It smells the same. It smells like being wrong."),
        s('kit', "Front row. We're front-row people now. Your mum's fault."),
      ], results: {
        good: [s('kit', 'You put your HAND up. Who are you?'), s('kit', "...She'd have put her hand up. Okay. Fine.")],
        ok: [s('kit', 'We survived. Nobody saw us not know that. Except Pym. Pym can see through walls.')] } }),
      n('Afterwards, on the steps, Kit unlatches the guitar case and does not take out the guitar.'),
      s('kit', "I've got something. I've had it eight years. I didn't know it was part of anything."),
      n('Taped inside the lid: a postcard. The lighthouse, in 1960s colours.'),
      s('kit', 'She gave it me the week I left for here. I was eighteen and terrified. She came round to Alder Street specially.'),
      s('kit', 'Read the back.'),
      n('Her handwriting, leaning forward. "Kit. Go. It\'s a hard town to leave, which is the best thing I can say about anywhere. Say hello to Marge. N."'),
      n('You have heard that sentence before. On a roof. Carried around for ten years like a parking ticket.'),
      pick('c12_card',
        o('borrow', "Can I borrow this? Someone needs to read it.", [
          s('kit', "Keep it. No. Borrow it. I want it back in the case. It's structural.")], R('kit')),
        o('carry', "Kit. You've no idea what you've been carrying around.", [
          s('kit', 'I had some idea. I keep it in a GUITAR, {name}.')], R('kit')),
        o('again', '(Read it again.)', [
          n('"The best thing I can say about anywhere."'),
          s('kit', 'I say it to myself before gigs. "Go." It works about half the time.')], R('kit'))),
      give('item', 'nell_postcard', { text: "Kit's postcard, on loan. It wants returning to the guitar case." }),
      s('kit', "Go on. School's out soon. If you run for the bus you'll catch her at the gate."),
      go('spot:school', { label: 'Get to Maplewood Elementary for the end of school' }),
    ]),
    sc('gate', 'spot:school', 'The school gate', [
      n('The gate opens and the yard fills up like a sink. Nora is on duty, lanyard on, with a child attached to each hand, neither of them hers.'),
      s('jules', "{name}? What's wrong? Nothing's wrong. Why have you got a face?"),
      pick('c12_tell',
        o('card', '(Hand her the postcard, back side up.)', [
          n('She reads it. Then she reads it again, the way you did.'),
          s('jules', '"Which is the best thing I can say about..."'),
          s('jules', 'Oh.'),
          s('jules', 'Oh, you absolute... she meant it NICELY.')], R('jules')),
        o('pym', 'Mom trained as a teacher. Here. One term short.', [
          s('jules', 'No, she didn\'t. She worked in the Kettle, and then she...'),
          beat(),
          s('jules', "...She did the voices. At bedtime. She did them too well. I always thought: where did you LEARN that.")], R('jules')),
        o('both', 'Two things. Sit down first.', [
          s('jules', "I'm on gate duty. I can't sit. I can lean."),
          n('She leans.')], R('jules'))),
      n('You tell her all of it. The drawer. Eight terms of nine. The postcard. The practice report.'),
      s('jules', 'Where? Where was the practice term?'),
      n('You tell her.'),
      beat(1500),
      s('jules', 'Here.'),
      s('jules', "I've walked through that gate every morning for ten years."),
      s('jules', 'Which room?'),
      n("The report doesn't say."),
      s('jules', 'Good.'),
      s('jules', 'Then it can be all of them.'),
      n('A small boy tugs her sleeve to report a crime involving a hat. She deals with it, perfectly, without once taking her eyes off the postcard.'),
      s('jules', '"It\'s a hard town to leave." She wasn\'t warning me off. She was sending a postcard.'),
      s('jules', "Ten years. I could have just ASKED."),
      pick('c12_after',
        o('jam', 'We send jam.', [s('jules', "We send JAM. I'm going to embroider that on something.")], R('jules')),
        o('now', 'You know now.', [s('jules', "I know now. I'm going to teach this afternoon like a lunatic.")], R('jules')),
        o('fee', 'Nana paid for the ninth term. In advance. It\'s still in the ledger.', [
          beat(),
          s('jules', '...She what.'),
          s('jules', 'Before the row or after?'),
          n("The ledger doesn't say."),
          s('jules', 'No. But Nana will. I bet she knows it to the day.')], R('jules'))),
      s('jules', "I need to see Nana. Properly. Not Sundays at arm's length."),
      s('jules', "Pip wants a stall at the market. She's filled in a form. We need pies, and there is exactly one person."),
      s('jules', "Will you ask her? One last errand through you. After that I'll do my own talking. I promise."),
    ]),
  ],
};

const ch13 = {
  id: 'ch13', n: 13, act: 3, title: 'The Copper Teapot',
  hook: 'Nora is asking Nana for pies. Through you. One last time.',
  ready: 'When you can. Nana will have the oven warm whichever day it is.',
  marker: { place: 'home:grandma', label: "Nana Bea's blue door" },
  window: { slots: [{ from: '09:00', to: '16:30' }], closed: 'Nana bakes by daylight. Come in the day; the door will be on the latch.' },
  cast: ['nana', 'roz'],
  unlock: { after: 'ch12', breath: 'next_morning' },
  minutes: [9, 12],
  play: "Bake the Copper Kettle apple-maple pie in Nana's kitchen (the cooking game).",
  teaches: ['The apple-maple pie', 'The row, told properly', 'What was in the teapot'],
  takeaway: [{ type: 'recipe', id: 'apple_maple_pie' }, { type: 'item', id: 'nana_pie' }, { type: 'page', id: 'kettle' }, { type: 'page', id: 'kettle_note' },
    { type: 'contact', id: 'roz' }, { type: 'rel', id: 'nana', n: 12 }, { type: 'rel', id: 'roz', n: 4 }],
  scenes: [
    sc('ask', 'home:grandma', 'The errand', [
      s('nana', 'You have a face on. Your mother wore that face when she wanted the car.'),
      n("You ask her. Pies. For Pip's stall. From Nora."),
      s('nana', 'Nora is asking me for pies.'),
      s('nana', 'Through you. Like a hostage negotiation.'),
      pick('c13_ask',
        o('last', "She says it's the last errand through me. She's coming herself.", [
          beat(),
          s('nana', 'Is she.'),
          s('nana', 'Then I had better have something worth coming for.')], R('nana')),
        o('scared', "She's frightened, Nana.", [
          s('nana', 'Of ME? I am four foot eleven.'),
          beat(),
          s('nana', 'Yes. Well. So was her mother.')], R('nana')),
        o('form', "Pip's filled in a form. It's official.", [
          s('nana', "Then I have no choice. One does not defy a form of Pip's. I have tried.")], R('nana'))),
      s('nana', 'Apple-maple. It will have to be. It is the only pie that ever mattered.'),
      s('nana', 'And I am out of flour. I have not been out of flour since 1985.'),
      s('nana', 'Go to Roz. Say it is for me, and she is not to give you the cheap one.'),
      go('bakery', { label: 'Fetch flour from Rise & Shine, where the Kettle used to be' }),
    ]),
    sc('bakery', 'bakery', 'The hook', [
      n('Rise & Shine. The ovens are new. The floor tiles are not.'),
      s('roz', "Flour for Bea? For PIES? Sit down. No, don't, you'll be quicker standing. Is she baking? Is she actually baking?"),
      s('roz', "Put your money away. I'm not charging Bea Larkin for flour in her own shop."),
      give('item', 'flour', { n: 2, text: "Two bags of Roz's good flour." }),
      s('roz', 'Come here. Look up. Over the door.'),
      n('An iron hook, painted over a dozen times. Beneath it the paint is paler, in the shape of something small that hung there for thirty-one years.'),
      s('roz', "That's where the bell was. I've never put anything on it. It felt like sitting in somebody's chair."),
      s('roz', "She comes in Monday, Wednesday, Friday, nine o'clock. Buys one roll. Looks at that hook. Tells me my crumb is improving. Ten years."),
      pick('c13_roz',
        o('boat', "The bell's on a houseboat. Berth three.", [
          s('roz', "The CAPTAIN has it? That old pirate. Well, tell him the hook's free. It's been free a while.")], R('roz')),
        o('kept', 'You kept the hook.', [
          s('roz', "Of course I kept the hook. I bought a bakery. I didn't buy the right to tidy her away.")], R('roz')),
        o('crumb', 'She says your crumb is improving?', [
          s('roz', "From Bea, that's a parade. I've thought about having it printed on the bags.")], R('roz'))),
      go('home:grandma', { label: "Back to Nana's with the flour" }),
    ]),
    sc('pie', 'home:grandma', 'Forty minutes', [
      s('nana', 'Apron. Sleeves. Good. Cold hands, warm kitchen. Say it.'),
      n('You say it.'),
      play('minigame', 'cook:apple_maple_pie', { label: 'Make the apple-maple pie with Nana', hint: 'Cold hands. Warm kitchen.', with: ['nana'], results: {
        good: [s('nana', 'Well. That is a proper crimp. There is nothing for me to tidy. I do not know what to do with my hands.')],
        ok: [s('nana', 'Lovely. Very rustic. I shall just tidy that one bit. And that bit.')] } }),
      n('The pie goes in. The kitchen ticks.'),
      s('nana', 'I said I would tell you the row when I could tell it properly. The pie has forty minutes. That is about the length of it.'),
      s('nana', 'It was the night before she left. September. I was doing the till. She came in with her coat on.'),
      s('nana', 'She said Frank had found work in Pinehollow and she was going with him on the Saturday.'),
      s('nana', 'I had paid her last term at the college that same week. In cash. The receipt was in my apron pocket while she was talking.'),
      s('nana', 'And I said: "If you go, the Kettle is not yours to come back to."'),
      s('nana', 'She said, "I never wanted it, Mum."'),
      s('nana', 'Which was not true. We both knew it was not true. And she went anyway, and I let her, because I had said a thing, and a Larkin does not unsay.'),
      s('nana', 'I did not write for a year. Then I sent jam. She sent eleven pages. And after that we were very nice to each other for thirty-five years.'),
      s('nana', 'Very nice. Like two people in a lift.'),
      s('nana', 'She would come home and sit out front, at table four, like a customer. Never once came through to the kitchen.'),
      s('nana', 'I thought: she is too good for it now. And I never asked.'),
      s('nana', 'And then I did it again. To Nora. Different words. Same mouth.'),
      pick('c13_row',
        o('unsay', 'You could unsay it now.', [
          s('nana', 'To whom? One of them is...'),
          beat(),
          s('nana', '...One of them is at a school gate. Yes. I know. I am working up to it. I am seventy-eight. The run-up is long.')], R('nana')),
        o('show', 'She did want it, Nana. I think the book can show you.', [
          s('nana', 'Can it. A book I have not the nerve to open?')], R('nana')),
        o('hand', '(Take her hand.)', [
          n('Flour on both of you now.'),
          s('nana', 'Mm. You were always the one.')], R('nana'))),
      s('nana', 'Enough. If there is to be a stall there must be tea, and not from an urn.'),
      s('nana', 'Fetch me the big teapot. The copper one. It is on top of the dresser. Desmond brought it down with the chair, and then I could not look at it.'),
      n('You lift it down. It is heavier than it should be. Copper gone the colour of an old penny, still wrapped in its tea towel.'),
      s('nana', 'Thirty-one years of tea. Give it here. It wants a scald and a polish, and so do I.'),
      n('She unwraps it and takes off the lid to look inside, as you would. As anyone would.'),
      beat(1500),
      n('Something is folded in the bottom. A Copper Kettle order slip, folded in four.'),
      s('nana', 'That is not mine.'),
      n('On the outside, in handwriting that leans forward: "Mum."'),
      s('nana', '...My glasses. I do not know where my glasses are.'),
      n('Her glasses are on her head.'),
      pick('c13_read',
        o('aloud', 'Shall I read it to you?', [
          s('nana', 'Yes. No. Yes. Slowly. I am not as quick as I was.')], R('nana')),
        o('hers', 'It says "Mum." It\'s yours. Here: your glasses.', [
          n('You lift them down out of her hair and put them into her hand.'),
          s('nana', 'Ah.'),
          n('She reads it standing up, with her lips moving, like somebody reading a recipe.')], R('nana')),
        o('nora', 'Shall I fetch Nora?', [
          s('nana', 'No. Me first. Thirty-eight years. I am owed first.'),
          s('nana', 'Read it to me. Then she may have it.')], R('nana'))),
      page('kettle_note'),
      beat(2000),
      n('The oven ticks. Out in the street a gate announces somebody.'),
      s('nana', 'Table four.'),
      s('nana', 'She sat at table four because she thought she had given up the kitchen. And I thought...'),
      s('nana', '"That is a thing we do, you and I." Well. She had that right. She had the pair of us, in one line.'),
      n('You work it out between you. Her last visit, three springs ago. She helped clear up after tea. Nana had said the big pot was too much for two.'),
      s('nana', 'Three years. It has sat in my own teapot for three years, because I was too proud to make a proper pot of tea.'),
      s('nana', '"Which knowing you is Thursday." Ha!'),
      n('It is a laugh, and it is not only a laugh.'),
      s('nana', 'She knew me. She knew me by heart, and she still got it wrong. That is the most Nell thing she ever did.'),
      pick('c13_after',
        o('page', 'She wrote the Kettle page after all.', [
          s('nana', "She did. On an order slip. Table blank, covers blank. Trust her to use the firm's stationery.")], R('nana')),
        o('room', '"The best room in the world."', [
          s('nana', 'It was only a kitchen.'),
          beat(),
          s('nana', "...It was, though. Wasn't it.")], R('nana')),
        o('pour', '(Say nothing. Make the tea.)', [
          n('You scald the pot the way she showed you, and make it properly. Copper, three spoons, wait.'),
          s('nana', 'First pot since 2016.'),
          n('She drinks it.'),
          s('nana', 'Yes. That is what it tastes like.')], R('nana'))),
      n('The timer rings. The pie is gold, and gently hissing.'),
      s('nana', 'There. Now you know the pie, and the row, and the end of the row. Take the pie home. Mind the tin.'),
      give('recipe', 'apple_maple_pie', { text: 'Copper Kettle Apple-Maple Pie. You can bake it at home now.' }),
      give('item', 'nana_pie', { text: "Nana's Apple-Maple Pie. You crimped the edge yourself." }),
      s('nana', 'Tell Nora: the next market day. Tell her I shall bring six.'),
      s('nana', 'Tell her nothing else. I shall tell her the rest myself. I have a note to answer first.'),
      s('nana', 'And a letter to write, to a man on a houseboat. Four words. One of them is "please." It is going to cost me.'),
      s('nana', 'Go on. I am going to sit with her a while.'),
    ]),
  ],
};

const ch14 = {
  id: 'ch14', n: 14, act: 3, title: 'The Little Kettle',
  hook: "Pip's stall is up on Market Street. It leans. Nana is bringing six pies.",
  ready: 'Any market day you like. Pip has the pitch for as long as she wants it.',
  marker: { place: 'spot:kettle_stall', label: 'The Little Kettle, Market Street' },
  window: { slots: [{ days: ['sat', 'sun'], from: '10:00', to: '14:30' }], closed: "The market is a weekend thing, mornings into the afternoon. The stall will go up again; Theo has finally worked out the bolts." },
  cast: ['pip', 'milo', 'theo', 'jules', 'nana', 'captain', 'roz', 'barnaby', 'gordon', 'birdie', 'kit'],
  unlock: { after: 'ch13', breath: { mornings: 2 } },
  minutes: [9, 12],
  play: 'Serve tea from the copper pot at the stall (the pouring game), three cups.',
  teaches: ['Old Town market', 'The bell comes home', 'Nana and Nora, out loud', "Everyone owes Pip a page"],
  takeaway: [{ type: 'item', id: 'kettle_teapot' }, { type: 'item', id: 'order_slip' }, { type: 'place', id: 'spot:market_street' },
    { type: 'recurring', id: 'sunday_dinner', text: 'Sunday dinner on Sycamore Lane, every week, if you fancy it.' },
    { type: 'recurring', id: 'kettle_corner_tea', text: "Saturday tea at the Kettle Corner in Roz's bakery, three till five." },
    { type: 'rel', id: 'nana', n: 10 }, { type: 'rel', id: 'jules', n: 10 }, { type: 'rel', id: 'pip', n: 6 }, { type: 'rel', id: 'milo', n: 6 }, { type: 'rel', id: 'theo', n: 5 }, { type: 'rel', id: 'captain', n: 4 }],
  scenes: [
    sc('stall', 'spot:kettle_stall', 'Market Street', [
      n('Market Street. Between a cheese man and a woman selling socks: a striped stall, leaning slightly, with confidence.'),
      iff('festival:harvest_parade', [n('It is Harvest Festival, and the whole street smells of cider and hay. The stall has a pumpkin on it. Nobody knows whose.')]),
      iff('festival:river_fair', [n('The Summer Fair has spilled all the way up from the river. Somebody has tied a balloon to the stall. It helps with the lean.')]),
      iff('season:winter', [n('There is frost on the awning, and the teapot steams like a small engine.')]),
      s('theo', "It's structural. The lean is structural. I've had a level on it. The level's wrong."),
      s('pip', "{title}! You're on teapot. Mom's on money. Dad's on standing there. Milo's on the hook."),
      s('milo', 'I guard the hook.'),
      n('Over the counter: an empty brass hook. Pip measured for it twice.'),
      s('pip', 'I did a flyer.'),
      n('Eleven fonts. THE LITTLE KETTLE. PIE. TEA. BE THERE. The last part is underlined three times.'),
      s('jules', "She's not here. She said market day. She is never late. She's four minutes early to everything. It's ten past."),
      pick('c14_wait',
        o('six', "She's coming. She's carrying six pies.", [
          s('jules', "Six? She said six? Six is serious. Six is a peace treaty.")], R('jules')),
        o('how', 'How are you doing?', [
          s('jules', "I've alphabetised the napkins. Napkins don't have an alphabet.")], R('jules')),
        o('letter', 'She had a letter to write first.', [
          s('jules', 'A letter? Who to?'),
          n('You look down Market Street, toward the harbour.'),
          s('jules', '...What have you two done.')], R('jules'))),
      s('pip', 'Customers! Places!'),
      play('minigame', 'pour', { label: 'Pour the tea: three cups from the copper pot', hint: 'Steady. It has done this before.', with: ['pip'], talk: [
        s('gordon', "Is that the Kettle's pot? I've had tea out of that pot on the back platform of the Number Nine."),
        s('gordon', "Ray would stop outside the door. It wasn't an official stop."),
        s('birdie', 'Two sugars for me, dear, and a crumb for the committee.'),
      ], results: {
        good: [s('barnaby', 'One cup. Hm. Mm. A properly scalded pot. Four stars. And a fifth, which I have borrowed from next week.')],
        ok: [s('barnaby', 'One cup. Hm. A touch stewed. Four stars. The pot is doing a great deal of the work.')] } }),
      n('And then the street does a thing streets do. It goes quiet from one end.'),
      n("A small upright figure with a stack of pie tins. Beside her, carrying nothing but walking as though he is, an old man in a captain's cap."),
      s('nana', 'I am late. I am never late. He would not set off until the tide turned. Superstition.'),
      s('captain', 'Seamanship.'),
      n('He takes his hand out of his coat. In it: a small brass bell.'),
      s('jules', "Is that... no. That's THE bell. That's her bell."),
      s('captain', 'She asked. In writing. Four words. "Bring my bell, please." The "please" is underlined. I\'m having it framed.'),
      n('Milo holds up both hands. The Captain hangs the bell on the hook himself, the way you would hang a lamp.'),
      s('theo', "I'll take those pies, Bea. And I'll take the children. Over there. Far."),
      s('pip', "But it's about to get INTERESTING."),
      s('theo', "That's why."),
      n('Nora, and Nana, and a counter between them. You are holding a teapot and you are not sure you are allowed to breathe.'),
      s('jules', "Nana. I should have said this years ago. I'm sorry I didn't take it."),
      s('nana', 'Hush. I was never cross with you. I was cross with the calendar.'),
      beat(),
      s('nana', 'No. That is the nice version. I have been giving the nice version for ten years.'),
      s('nana', 'I was cross with your mother. She was not there to be cross with. So I was cross with you instead, in my kitchen, with your coat on.'),
      s('nana', '"Then it ends with me." I was sorry before the plate was dry. I never found a way to unsay it.'),
      s('nana', 'So I shall not unsay it. I shall say a different thing, louder.'),
      s('nana', 'You opened a classroom. In the school where she did her practice term. Yes, I know about that. Who do you suppose paid for the term?'),
      s('nana', 'You finished the thing I wanted for her. I was looking at a tearoom, and I missed it.'),
      s('jules', "I thought you couldn't forgive me. So I stayed busy."),
      s('nana', "And I thought you were ashamed of an old woman's tearoom. Pair of fools. It is hereditary. I have it in writing."),
      n('She takes an order slip out of her cardigan sleeve, where the tissue usually lives, and puts it on the counter.'),
      s('nana', 'Read that. It was in the teapot. It is addressed to me, but it is for the both of us. She never could keep a letter to one person.'),
      n('Nora reads it. Then it is a long hug. The pies, wisely, have already been taken away.'),
      s('pip', 'IS THE FEELINGS PART DONE? WE HAVE A QUEUE.'),
      s('pip', 'Who rings the bell?'),
      pick('c14_bell',
        o('nana', "Nana. It's her bell.", [s('nana', 'Thirty-one years. I know the wrist of it. Stand back.')], R('nana')),
        o('nora', 'Nora. First day of the new shop.', [
          s('jules', 'Me? Oh. Nana, how do I... like this?'),
          s('nana', 'Like you mean it, honey.')], R('jules')),
        o('milo', "Milo. He's guarded that hook all morning.", [
          s('milo', '...Really? Me?'),
          s('milo', 'I will be very careful.')], R('milo'))),
      n('One clear, high note over Market Street. The sock woman stops mid-sock.'),
      s('captain', "There she is. Six years I've rung her for people not home yet. I shall have to find another hobby."),
      iff('met:kit', [s('kit', "That's my cue. This one's new. It's for a pie stall. One, two...")]),
      n('The Little Kettle sells out by two. Pip counts the tin three times.'),
    ]),
    sc('closing', 'spot:kettle_stall', 'A table with a hat on', [
      s('nana', 'It is not the Kettle. It is a table with a hat on.'),
      s('nana', 'It will do.'),
      s('roz', "Bea. The hook over my door's been empty ten years. Saturdays, three till five, the corner table is yours."),
      s('roz', "Bring the pot. Bring the bell. I'll bring my crumb."),
      s('nana', '...Your crumb is improving.'),
      s('roz', 'I KNOW.'),
      s('nana', 'You did this, you know. You went up a ladder.'),
      s('nana', "The bell goes to Roz's hook. But the teapot is yours. No arguing with your Nana."),
      give('item', 'kettle_teapot', { text: 'The Copper Teapot. Tea made in it tastes like being looked after.' }),
      s('jules', "Sunday dinner. All of us. Nana's chair is at the head. It always was. We just kept a coat on it."),
      give('recurring', 'sunday_dinner', { text: 'Sunday dinner on Sycamore Lane is a standing thing now.' }),
      give('recurring', 'kettle_corner_tea', { text: "Saturday tea at the Kettle Corner, in Roz's bakery." }),
      s('pip', 'ONE MORE ITEM.'),
      n('She is holding a stack of blank Copper Kettle order slips like a hand of cards.'),
      s('pip', "The book's not finished. I've read the contents. Twelve is found. Eleven is two lines. Thirteen is blank."),
      s('pip', "And there's loads she never SAW. The aquarium. Dad's garage."),
      s('pip', "So everybody writes a page. On a slip. One place each. That's the rule. I'll collect them."),
      s('theo', 'Is my garage a place?'),
      s('pip', 'Your garage is a hazard. But yes.'),
      s('milo', "I'm doing the turtles."),
      s('nana', 'I shall do the Kettle. Somebody ought to write it who actually had to find it.'),
      s('jules', "I'll finish eleven. I think I might be how it ends."),
      s('pip', '{title}, you\'ve got thirteen. The Lookout. It says "last. save it." So you go last.'),
      give('item', 'order_slip', { text: 'A blank Copper Kettle order slip. Your page: number thirteen.' }),
      iff('flag:dad_knows_book', [
        s('jules', 'Dad rang me. DAD. Rang ME. He said, "I hear there is a book." Then nothing for a full minute. I thought he\'d gone.'),
      ], [
        s('jules', "Somebody's going to have to tell Dad there's a book."),
      ]),
      s('nana', 'I have written to Frank.'),
      n('Everybody looks at her.'),
      s('nana', 'What? I own a stamp. I wrote: "Frank. There is a book of hers here with your initial on it, and it is nearly done. Come and be shown. Bea."'),
      s('nana', 'He replied by return. One line, in capitals, like a telegram. "WHAT SHOULD I BRING."'),
      pick('c14_bring',
        o('shoes', "Tell him his good shoes. There's a lot of walking.", [
          s('nana', 'I shall write "shoes." He will work out "good."')], R('nana')),
        o('nothing', 'Tell him nothing. Just to come.', [
          s('nana', 'He cannot bring nothing. He is Frank. He will bring a tool.')], R('nana')),
        o('box', 'Tell him the recipe box.', [
          beat(),
          s('nana', '...Yes. Oh, that is clever. Her cards. The other half of it.')], { rel: { nana: 2 }, flag: 'recipe_box_asked' })),
      s('jules', "You'll bring him in from the airport? You're the one who can tell him what he's looking at."),
      s('jules', 'No hurry. He needs a few days to find the shoes.'),
    ]),
  ],
};

const ch15 = {
  id: 'ch15', n: 15, act: 3, title: 'The Last Page',
  hook: "Dad is coming to be shown. He'll want meeting at Arrivals.",
  ready: "Whenever you're ready. He would rather be met than be on time.",
  marker: { place: 'spot:airport_arrivals', label: 'Arrivals, Maple Bay International' },
  window: { slots: [{ from: '10:00', to: '15:30' }], closed: "He'll come in on a daytime flight, so there is light to be shown things by. Any day you choose." },
  cast: ['dad', 'manny', 'nana', 'jules', 'theo', 'pip', 'milo', 'dez'],
  unlock: { after: 'ch14', breath: { mornings: 3 } },
  minutes: [10, 14],
  play: 'Tell Dad what he is looking at on the cab ride in (three choices from your own year), then write the last page of the book at the Lookout (the writing game).',
  teaches: ['Everything, back the other way: you are the one who knows the town now'],
  takeaway: [{ type: 'item', id: 'year_photo' }, { type: 'page', id: 'lookout' }, { type: 'contact', id: 'dad' }, { type: 'place', id: 'lookout' },
    { type: 'flag', id: 'book_finished', text: 'The book has thirteen pages, a recipe card and six order slips in it. It is still not finished.' },
    { type: 'rel', id: 'dad', n: 15 }, { type: 'rel', id: 'nana', n: 6 }, { type: 'rel', id: 'jules', n: 6 }, { type: 'rel', id: 'theo', n: 4 }, { type: 'rel', id: 'pip', n: 4 }, { type: 'rel', id: 'milo', n: 4 }, { type: 'rel', id: 'dez', n: 4 }],
  scenes: [
    sc('arrivals', 'spot:airport_arrivals', 'Arrivals', [
      n('Maple Bay International, Arrivals. You know this rail. You stood on the other side of it once, with one suitcase and one whole new city.'),
      n("The belt goes round. Everybody's bag comes off. Then everybody's second bag."),
      n('Last of all: one small brown case with a strap round it. And behind it, in his good shoes, your father.'),
      s('dad', 'It came off last.'),
      s('dad', 'Family tradition.'),
      n('He looks at you for a while. He puts a hand on the back of your neck, the way he did when you were small enough to steer.'),
      s('dad', "You've got taller."),
      s('dad', "No. I've got shorter. It's been reported."),
      pick('c15_hello',
        o('came', 'You came.', [
          s('dad', "I was sent for. Bea wrote. You don't not come when Bea writes. I learned that in 1988.")], R('dad')),
        o('flight', 'How was the flight?', [
          s('dad', "Long. A small boy kicked my seat from Pinehollow to the coast. He told me a great deal about dinosaurs. I've grown fond of him.")], R('dad')),
        o('hug', '(Hug him anyway.)', [
          n("He stands it. Then, after a second, he does it back, carefully, like lifting something he doesn't want to drop."),
          s('dad', "All right. All right. That's the allowance.")], R('dad'))),
      n('Under his arm, where another man would have a newspaper: a tin recipe box with a rubber band round it.'),
      iff('flag:recipe_box_asked', [
        s('dad', "Bea said bring the box. I'd have brought it anyway. I don't go anywhere without it now."),
      ], [
        s('dad', "I've brought the box. Nobody asked. I don't go anywhere without it now."),
      ]),
      s('dad', "Right. Where's this cab. Nora says a man called Manny will talk at me."),
      go('home:grandma', { with: ['dad'], by: 'cab', must: true, label: 'Take Dad into town in Cab 22' }),
    ]),
    sc('cab', 'ride:cab', 'Cab 22', [
      s('manny', "Cab 22! That's me. Manny. And you're the father! I had this one in the back the day they landed. Hopeful suitcase. I said so."),
      s('manny', "Sit back. I give the tour for free. You can't stop me. People have tried."),
      s('dad', "I've a narrator, thank you."),
      s('manny', "...You've a what?"),
      s('dad', 'That one. Go on, {name}. What am I looking at.'),
      n('The Railyard goes by. Sheds, signals, a diner with its sign lit.'),
      pick('c15_n1',
        o('dot', "That's Dot's Diner. Best pancakes in town, but you can't say so in front of Nana.", [
          s('dad', "Then I shan't. I'm not a brave man.")], R('dad')),
        o('shed', "That's the old streetcar shed. Mom's dad drove Number Nine. Two rings on the bell meant hello.", [
          s('dad', 'Two rings.'),
          s('dad', 'She tapped the horn twice, every time she pulled out of the drive. Thirty-six years. I never asked why.')], R('dad')),
        o('dez', "That's where cousin Dez works. He'll try to get you on the back of his bike.", [
          s('dad', 'He may try.')], R('dad'))),
      n('Downtown. Glass, and the tower with the deck on top.'),
      pick('c15_n2',
        o('deck', "That's the SkyDeck. You can see all of it from up there. It's where I learned what any of it was.", [
          s('dad', 'Hm. Sensible. Start with the map.')], R('dad')),
        o('bank', "That's the bank where Theo works. He's made you a stool.", [
          s('dad', "I've a stool."),
          beat(),
          s('dad', "I'll take the stool.")], R('dad')),
        o('hall', "That's City Hall. Pip is going to run it. She's nine. She's started.", [
          s('dad', 'Good. Somebody should.')], R('dad'))),
      n('Then the road tips down toward the harbour, and at the far end of it, white against the water:'),
      pick('c15_n3',
        o('steps', "That's the Light. Ninety-seven steps.", [
          s('dad', 'Ninety-eight.'),
          n('He says it to the window.'),
          s('dad', "...I'll allow ninety-seven. Today.")], R('dad')),
        o('log', 'That\'s where you\'re in the log. Fourteenth of August, 1987. "Was told."', [
          s('dad', 'They wrote that down?'),
          s('dad', "...I was told. That's fair.")], R('dad')),
        o('start', "That's where she started everybody.", [
          s('dad', "She started me there. I didn't know I'd been started. I thought I was going up some stairs with a girl.")], R('dad'))),
      s('manny', "...Nineteen years I've been doing it wrong. I just say, \"that's the lighthouse.\""),
      s('dad', 'You do the driving. It takes two.'),
      s('dad', "You're good at this, {name}."),
      s('dad', "She'd say you talk too fast. She'd be pleased, and she'd say you talk too fast."),
    ]),
    sc('thimble', 'home:grandma', 'The blue door', [
      n('The gate announces him.'),
      n('The blue door opens before he can knock. It always has.'),
      s('nana', 'Frank.'),
      s('dad', 'Bea.'),
      s('nana', 'You are thin.'),
      s('dad', "You're short."),
      s('nana', 'Thirty-eight years, and that is the best you have.'),
      s('dad', "I'd a long flight to think of it."),
      beat(1200),
      s('nana', 'I said a thing to her, Frank. The night before.'),
      s('dad', 'I know. She told me on the train.'),
      s('nana', 'And you never held it against me.'),
      s('dad', "I got Nell. I wasn't in a position to hold things against people."),
      s('nana', 'Come in. The kettle is on. The proper pot.'),
      n('On the kitchen table: the exercise book, soft at the corners. He does not touch it yet. He sets the recipe box down beside it, square, like two halves of something.'),
      s('dad', '"For F."'),
      s('dad', 'She did the F like that on cheques.'),
      n('He opens the cover. "Frank will never read this."'),
      s('dad', 'Well.'),
      s('dad', 'She wrote that on a recipe card as well. Card one. She was wrong twice, then.'),
      pick('c15_read',
        o('now', 'Do you want to read it now?', [
          s('dad', 'No. I want to be shown. That\'s what it says, isn\'t it. "He would rather be shown." She had me right there.')], R('dad')),
        o('left', "It's nearly finished. There's one page left.", [
          s('dad', 'Whose?'),
          n('"Mine."'),
          s('dad', "Then I'll not look till it's done. I never looked in the oven either. Thirty-six years.")], R('dad')),
        o('turn', '(Let him turn the pages.)', [
          n('He turns three. He stops at Marge.'),
          s('dad', '"Forty feet of very old lady."'),
          n('It is the first time you have heard your father laugh since the autumn before last.')], R('dad'))),
      s('nana', 'The others are at the top of the hill. Pip has an agenda. It is laminated.'),
      go('lookout', { with: ['dad', 'nana'], label: 'Up to Hillcrest Lookout, all together' }),
    ]),
    sc('lookout', 'lookout', 'The Lookout', [
      n('Hillcrest Lookout. The whole bay at your feet, and along the railing the whole family, squinting.'),
      iff('season:winter', [n('There is snow on the railing. Dez has built something on it. Nobody is asking what.')]),
      iff('season:autumn', [n('The maples on the hill have gone the colour of the jam.')]),
      iff('time:evening', [n('The sun is going down into the harbour like a coin into a slot.')]),
      s('pip', "Grandpa Frank. Welcome. I'm Pip. We've met, but I was six. I've got an agenda."),
      s('dad', 'Have you.'),
      s('pip', "It's laminated."),
      s('dez', 'Uncle Frank! Ninety-seven or ninety-eight?'),
      s('dad', 'Ninety-eight.'),
      s('dez', 'HA. Okay. I like him.'),
      n('Milo regards your father from inside the hood. Your father regards Milo. Two quiet people, recognising the species.'),
      s('milo', 'Do you know what a stegosaurus is?'),
      s('dad', 'Plates on the back. Thagomizer on the tail. A boy on the aeroplane told me. At length.'),
      s('milo', '...Okay.'),
      n("The hood nods, once. He's in."),
      s('pip', 'Item one. The pages. Nana. Number twelve.'),
      s('nana', '"The Kettle. Thimble Street. It is a bakery now, and the crumb is improving."'),
      s('nana', '"Ring the bell on your way in. I shall pretend not to hear it. I can always hear it."'),
      s('pip', 'Mom. Number eleven.'),
      s('jules', '"The College. She was one term short. So go down the hill to Maplewood Elementary instead, any morning, and stand at the gate at ten to nine."'),
      s('jules', '"That\'s the ninth term. It\'s still going."'),
      s('pip', 'Dad.'),
      s('theo', '"The garage, 12 Sycamore Lane. Not open to the public. Everything in it wobbles. Bring a level and low expectations. Best seat in the house."'),
      s('pip', 'Milo and me. Joint. He did the picture.'),
      s('milo', '"The Aquarium. She never saw it. There are turtles. One is called Biscotti. Say hello. Say Nell sent you."'),
      s('milo', '"They don\'t know her. But they\'ll pretend."'),
      s('dez', 'Mine\'s short. "The Railyard. Ray\'s side. Ride the whole loop and don\'t get off. If anybody rings a bell twice, that\'s us."'),
      s('pip', "Grandpa Frank, you didn't get a slip. Sorry. You weren't here."),
      s('dad', "I've brought a page."),
      n('He slips the rubber band off the recipe box, and from the very front takes a card gone soft at the corners.'),
      s('dad', '"Card one. Toast. One slice bread. Toast it. Butter while hot. Frank, you can do this."'),
      s('dad', 'And on the back, in pencil: "Frank will never read this."'),
      s('dad', "It's the same pencil as the book. I checked. She must have bought a box of them."),
      s('dad', "That's my page. It's toast."),
      s('nana', '...It will have to go in near the front.'),
      s('pip', "{title}. Thirteen. You're last."),
      n('The last page. "The Lookout," and under it, small: "last. save it." And then thirty-eight years of nothing.'),
      play('minigame', 'write', { label: 'Write the last page', hint: 'Take your time. Everybody will pretend not to watch.' }),
      pick('c15_page',
        o('quiet', '"Come up at the end of the day. Bring everybody. Don\'t say anything clever. She\'ll do the talking. She always did."', [
          n('You read it out. Nobody says anything clever.'),
          s('dad', '"She always did."'),
          s('dad', 'Hm.')], R('dad')),
        o('room', '"From here you can see all of it at once: the Light, the Kettle, the school, the trains. She left it blank so there\'d be room for us."', [
          n('You read it out. Nobody says anything clever.'),
          s('nana', '"Room for us." She would tell you she planned that. She did not. But she would tell you.')], R('nana')),
        o('open', '"Last page. Not finished. Come back next year and I\'ll tell you what else is up here by then."', [
          n('You read it out. Nobody says anything clever.'),
          s('pip', "That's an OPEN file. I approve.")], R('pip'))),
      iff('pick:c10_memory=song', [
        s('milo', 'Grandpa Frank. She sang in the car. All the wrong words.'),
        s('dad', '...Who told you that?'),
        s('milo', 'I remember it.'),
        n('Your father looks at you. You look at a bird.'),
        s('dad', 'She did. "Yellow Submarine" was about a sandwich.'),
        s('milo', "That's good."),
      ]),
      iff('pick:c10_memory=narrate', [
        s('milo', "Grandpa Frank. Where did she fall off her bike? We're going to find the mark."),
        s('dad', "Chandler Street. Outside the chemist's. There's a drain cover. She blamed that drain cover for forty years."),
        s('milo', "I KNEW there'd be a mark."),
      ]),
      iff('pick:c10_memory=notes', [
        s('milo', 'Grandpa Frank. She put notes in the lunch. "Eat the apple. I\'ll know."'),
        s('dad', '...She put them in mine as well. Thirty-six years. "Eat the apple, Frank."'),
        s('milo', 'Did she know?'),
        s('dad', 'Always.'),
      ]),
      s('theo', "Photo! Everybody in. I've a tripod. It's home-made. Don't lean on it."),
      n('Everybody squints. The tripod leans one degree to the left, like somebody listening.'),
      n('Milo is looking at a bird.'),
      give('item', 'year_photo', { text: 'A photograph: everyone at the Lookout, squinting. Milo is looking at a bird.' }),
      n('And then, out at the end of the breakwater, exactly on time, because a Marrow has never been early or late: the Light.'),
      n('It comes round over the water, and over the town, and over all of you, like a slow hand.'),
      s('dad', 'There she goes.'),
      s('dad', 'What am I looking at, {name}.'),
      pick('c15_last',
        o('home', 'Home, Dad. Near enough.', [s('dad', "Near enough will do.")], R('dad')),
        o('all', "Everything she wrote down. And a few things she didn't get to.", [s('dad', "Then you'd better keep writing.")], R('dad')),
        o('steps', 'Ninety-eight steps.', [
          beat(),
          s('dad', '...Ninety-seven. I counted the doorstep to annoy her. Thirty-nine years. Don\'t tell Bea.'),
          s('nana', 'I heard that.')], R('dad'))),
      s('dad', "I'll stay the week. If there's a camp bed. I need a chair and a window."),
      iff('has:item:nana_armchair', [n('You have a chair. Green velvet, one arm worn smooth. You know exactly which window.')]),
      s('nana', 'Down the hill, all of you. There is a pie. There are six pies. I got carried away.'),
      n('The book goes into your coat. It is heavier than it was. It has a recipe card in it now, and six order slips, and a page in your handwriting.'),
      n('It still is not finished. That, it turns out, was the idea.'),
      n("It'll keep."),
    ]),
  ],
};

export const CHAPTERS = [ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10, ch11, ch12, ch13, ch14, ch15];
export const CHAPTERS_BY_ID = Object.fromEntries(CHAPTERS.map(c => [c.id, c]));

/* ---- The pages the family reads at the Lookout, for the book reader after Chapter 15 (BOOK state 'family') ---- */
export const FAMILY_PAGES = [
  { by: 'dad', title: 'Card one. Toast.', place: 'home:player', text: ['One slice bread. Toast it. Butter while hot. Frank, you can do this.', '(On the back, in pencil: "Frank will never read this.")'] },
  { by: 'jules', title: 'The College (the rest of it)', place: 'spot:school', text: ['She was one term short. So go down the hill to Maplewood Elementary instead, any morning, and stand at the gate at ten to nine.', "That's the ninth term. It's still going."] },
  { by: 'nana', title: 'The Kettle', place: 'bakery', text: ['Thimble Street. It is a bakery now, and the crumb is improving.', 'Ring the bell on your way in. I shall pretend not to hear it. I can always hear it.'] },
  { by: 'theo', title: 'The Garage', place: 'home:sibling', text: ['12 Sycamore Lane. Not open to the public. Everything in it wobbles. Bring a level and low expectations. Best seat in the house.'] },
  { by: 'pip', title: 'The Aquarium', place: 'aquarium', text: ['She never saw it. There are turtles. One is called Biscotti. Say hello. Say Nell sent you.', "They don't know her. But they'll pretend.", '(Picture by Milo: a turtle, a train, a dinosaur, approving.)'] },
  { by: 'dez', title: 'The Railyard', place: 'spot:tram_shed', text: ["Ray's side. Ride the whole loop and don't get off. If anybody rings a bell twice, that's us."] },
  { by: 'player', title: 'The Lookout', place: 'lookout', text: ['(Whatever the player chose in c15_page.)'] },
];

/* ---- After the last Chapter, and around the year: small family moments. These ARE on the clock (invitations, festival
   days); none is needed for any Chapter. `needs` = the Chapter that must be finished for the moment to be offered; `lines`
   are short scenes in the same step format. The six festival moments stand at the real events (no cutscene). ---------- */
export const FAMILY_MOMENTS = [
  { id: 'fm_blossom', when: 'festival:blossom_parade', place: 'cev:blossom_parade', needs: 'ch03', who: ['pip', 'theo', 'milo'], title: 'Petals', lines: [
    n("Riverside Drive, under the blossom. Pip is on Theo's shoulders with a clipboard. Milo is under a petal the size of his face."),
    s('pip', "I'm counting floats. There are nine. The swan is winning."),
    s('theo', "She's heavier than last year. I'm told I can't say that. I'm saying it about the clipboard."),
    iff('done:ch06', [s('pip', 'Is the parade in the book? ...No? Then somebody should write it a page. Not me. I\'m busy counting.')]),
    s('milo', 'I have a petal.') ] },
  { id: 'fm_harbor', when: 'festival:harbor_day', place: 'cev:harbor_day', needs: 'ch02', who: ['captain', 'dez'], title: 'The Maple Queen', lines: [
    n('Harbor Day. The lit boats come round the pier head one by one, and last of all the old paddle steamer.'),
    s('dez', "That's the Maple Queen. They only run her once a year. Whole town pretends it isn't crying."),
    iff('done:ch08', [
      s('captain', "She's no Marigold. But she'll do for a night. Your father would have had that engine purring. Then he'd have been sick over the side."),
    ], [
      s('captain', "She's no Marigold. But she'll do for a night.")]),
    s('captain', 'Stand at the back rail, pup. You see more.') ] },
  { id: 'fm_fair', when: 'festival:river_fair', place: 'cev:river_fair', needs: 'ch03', who: ['jules', 'pip', 'milo'], title: 'The High Striker', lines: [
    s('pip', "{title}! Hit the thing with the hammer. Mom did it and got 'Featherweight.' She's not speaking."),
    s('jules', "I'm speaking. I'm saying it's rigged."),
    s('milo', 'I want the teddy. The teddy wants me.') ] },
  { id: 'fm_harvest', when: 'festival:harvest_parade', place: 'cev:harvest_parade', needs: 'ch13', who: ['nana', 'roz'], title: 'The Twelfth Ribbon', lines: [
    n("Market Square. A trestle of pies with numbers on them, and Mr. Quill moving down the line like a man defusing something."),
    s('nana', 'Eleven ribbons, that pie has. I entered it this morning for the first time in ten years. Do not look so pleased.'),
    s('barnaby', 'Number six. First prize. The crust is an argument that has been won.'),
    n('Nana takes the blue rosette, looks at it for a moment, and pins it on Roz.'),
    s('nana', 'That makes twelve. Twelve was always going to be somebody else\'s. It is your oven now.'),
    s('roz', 'Bea. I can\'t. ...I\'m keeping it. I\'m never taking it off.') ] },
  { id: 'fm_lantern', when: 'festival:lantern_parade', place: 'cev:lantern_parade', needs: 'ch06', who: ['jules', 'nana', 'kit'], title: 'A Wish', lines: [
    n('Lantern Night. The dragon has gone by. At the wish table people are writing on paper lanterns with a brush.'),
    s('jules', "You're supposed to write a wish. Mom always wrote a shopping list. She said the sky could make itself useful."),
    s('nana', 'Eggs. Flour. A decent son-in-law. She got two out of three the first year, and the third by Christmas.'),
    iff('done:ch15', [s('nana', 'Write her something. She cannot answer, but she never could wait her turn anyway.')]),
    give('item', 'paper_lantern', { text: 'The spare lantern. Your wish went up with the other.' }) ] },
  { id: 'fm_winter', when: 'festival:winter_parade', place: 'cev:winter_parade', needs: 'ch10', who: ['gordon', 'milo', 'nana'], title: 'Two Rings', lines: [
    n("Winter Lights. Behind the band and the sleigh, moving at the speed of a good memory, comes a streetcar with a brass 9 on the front."),
    s('gordon', "Thirty-eight years I rang that bell. They've let me out for one night. Up you get, young man. Mind the step."),
    s('milo', "It's the train from the glass case."),
    s('gordon', 'Streetcar.'),
    s('milo', 'Train.'),
    n('Mr. Pike looks at Nana on the kerb, and rings the bell twice.'),
    s('nana', 'That is waving. Ray never did learn to wave like a person.'),
    give('item', 'tram_ticket', { text: 'A lifetime ticket, punched by Mr. Pike: "No. 9. ALL STOPS. FOREVER."' }) ] },
  { id: 'fm_sunday', when: 'weekly:sun:17:30', place: 'home:sibling', needs: 'ch14', who: ['jules', 'theo', 'pip', 'milo', 'nana'], title: 'Sunday Dinner', lines: [
    n("Sycamore Lane on a Sunday. Nana's chair is at the head. There is no coat on it."),
    s('theo', "It's a roast. I've branched out. It's a different roast."),
    s('milo', "{title} sits here. It's the rule."),
    give('recipe', 'sunday_roast', { text: "Theo's Sunday Roast. He has written it down for you. There are diagrams." }) ] },
  { id: 'fm_kettle_corner', when: 'weekly:sat:15:00', place: 'bakery', needs: 'ch14', who: ['nana', 'roz', 'ambrose'], title: 'The Kettle Corner', lines: [
    n('The corner table at Rise & Shine. A copper-rimmed cup at every place. Over the door, on its old hook, the bell.'),
    s('nana', 'Sit. I am not working. I am supervising. It is completely different.'),
    s('ambrose', "She's been supervising my scone for ten minutes. It's the best afternoon I've had this year.") ] },
  { id: 'fm_dad_visit', when: 'season_start', place: 'home:player', needs: 'ch15', who: ['dad'], title: 'A Chair and a Window', lines: [
    n('A knock. One small brown case with a strap round it.'),
    s('dad', "It's the first of the season. I said I'd come at the first of the season. Where's my chair."),
    s('dad', "Go on, then. What's new. What am I looking at.") ] },
];
