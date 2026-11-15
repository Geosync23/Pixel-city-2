// =============================================================================
// Maple Bay — RELATIONSHIPS: dates  (src/story/rel_dates.js)                PURE DATA. No engine imports, no init(), no side effects.
// A date is REAL PLAY at a real place: you meet there, you do the thing the place is for (its own system: the menu, the show,
// the telescope, your own stove), one small conversation happens that depends on your history, and you say goodnight.
// Person lines and the conversations are in rel_dates_talk.js. Design: docs/story/RELATIONSHIPS.md section 6.
//
// EXPORTS
//   DATE_TYPES    { [id]: DateType }
//   DATE_ORDER    the order a date runs in (the engine's script; each word is a part below).
//   OUTCOMES      how a date is scored (never failed) and the three results.
//   REPAIR        being late / missing a date: kind lines per person, and the way to make it right.
//   FIRST_DATES   { [personId]: Scene }   each romanceable's own first date (replaces the generic order for date 1).
//   GOODNIGHT     { [personId]: { fine, lovely, books } }   the text they send after a date, by outcome.
//
// DATE TYPE  { id, name, first?: true (offered for a first date), minStage, venues: placeId[] (the player picks one that is open),
//              window: { from, to, days?, weather?, event? }, minutes, cost: words, play: { kind, id, label } (a _rel_kit PLAY_KINDS step),
//              plan: the My Day row ("Dinner with {npc}, The Gilded Gull"), arrive: string[] narrator lines, close: string[] narrator lines,
//              wet?: what happens in rain (an indoor fallback venue or a line), bonus?: a calendar event that makes it special }
// SCENE      as built by _rel_kit V(): { id, title, when, place, invite, window, steps, fx }
// =============================================================================
import { V, o, pick, iff, pause, play, steps } from './_rel_kit.js';

const D = (id, name, minStage, venues, window, minutes, cost, playStep, plan, arrive, close, x) => Object.assign({ id, name, minStage, venues, window, minutes, cost, play: playStep, plan, arrive, close }, x);

export const DATE_TYPES = {
  coffee: D('coffee', 'A coffee, twenty minutes, no pressure', 'spark', ['stand_coffee', 'museum:cafe', 'conservatory:cafe', 'cafe', 'university:cafe'], { from: 8, to: 18 }, 40, 'two coffees',
    play('order', 'venue', 'Order for two'), 'Coffee with {npc}', ['You are four minutes early. So are they. You both pretend to have just arrived.'], ['Twenty minutes turned into an hour. Nobody looked at a clock.'], { first: true }),
  walk: D('walk', 'A walk', 'spark', ['spot:riverside_path', 'spot:pond', 'lookout', 'poi_pier'], { from: 7, to: 21.5 }, 60, 'free',
    play('walk', 'venue', 'Walk together'), 'A walk with {npc}', ['No table between you. No menu to hide behind. Just the path and the weather.'], ['You reach the end of the path and both find a reason to walk back the long way.'], { first: true, wet: 'An umbrella is shared. This is not a hardship.' }),
  dinner: D('dinner', 'Dinner at the Gilded Gull', 'dating', ['restaurant', 'hotel_restaurant'], { from: 17.5, to: 21.5 }, 100, 'the menu, for two',
    play('order', 'restaurant', 'Order dinner'), 'Dinner with {npc}, The Gilded Gull', ['White cloths, the bay going dark in the window, a candle that knows its job.'], ['The bill comes in a little leather book. You both reach. It is a short, friendly war.']),
  noodles: D('noodles', 'Noodles on Lantern Row', 'dating', ['ramen', 'spot:lantern_row'], { from: 11.5, to: 22 }, 50, 'two bowls',
    play('order', 'ramen', 'Order two bowls'), 'Noodles with {npc}', ['Steam on the window. Two stools at the counter, close enough that your elbows have to negotiate.'], ['Two empty bowls. Finishing the broth is the highest compliment in the building.']),
  slice: D('slice', 'A slice at Slice of Heaven', 'spark', ['pizza'], { from: 11, to: 23 }, 45, 'two slices and a drink',
    play('order', 'pizza', 'Order at the counter'), 'Pizza with {npc}', ['The radio is on. The window table is free. Somebody behind the counter is singing along, badly.'], ['You fold the paper plate in half and neither of you is ready to leave yet.'], { first: true }),
  show: D('show', 'A show', 'dating', ['cinema', 'concerthall', 'playhouse'], { from: 12, to: 22 }, 120, 'two tickets',
    play('show', 'venue', 'Two seats, together'), 'A show with {npc}', ['The lobby smells of popcorn or floor polish, depending. Two tickets. Your seats are side by side, which is the point.'], ['The lights come up. You both sit a moment longer than the rest of the row.']),
  stars: D('stars', 'The Observatory on a clear night', 'dating', ['observatory'], { from: 19.5, to: 23, weather: ['clear'] }, 80, 'two tickets and a cocoa',
    play('minigame', 'trace', 'Trace a constellation together'), 'The Observatory with {npc}', ['The dome is open. The roof is cold. There are deckchairs, and someone has left a blanket on one of them.'], ['Two paper cups from Comet Cocoa. The sky does the rest of the talking.'], { wet: 'Cloud. The planetarium show runs instead, and the dark in there is just as good.', bonus: 'obs_star_party' }),
  cook: D('cook', 'Cook together at your place', 'dating', ['home'], { from: 17, to: 21 }, 90, 'what is in your kitchen',
    play('cook', 'choose', 'Cook together'), 'Cooking with {npc}, at home', ['Your own kitchen, with somebody else in it. It is smaller than you thought. That turns out to be fine.'], ['Two plates in the sink. They wash. You dry. Nobody discussed it.']),
  wheel: D('wheel', 'The Bay Wheel', 'spark', ['poi_ferris_wheel'], { from: 11, to: 22 }, 45, 'two rides and an ice cream',
    play('activity', 'ferris_wheel', 'Ride the Bay Wheel'), 'The Bay Wheel with {npc}', ['The boardwalk. Gulls, a calliope, the smell of sugar. The Wheel turns as if it has all evening, and it has.'], ['Your gondola stops at the very top, as they always do. The whole town is down there, pretending to be small.'], { first: true, wet: 'The Wheel is shut in the wet. Scoop Dreams is not.' }),
  aquarium: D('aquarium', 'The Aquarium', 'dating', ['aquarium'], { from: 10, to: 21 }, 90, 'two tickets',
    play('activity', 'watch_fish', 'Walk the tanks together'), 'The Aquarium with {npc}', ['Blue light. Everybody looks a little kinder under blue light. A ray goes over like a slow thought.'], ['You come out blinking. The real sea is right there, doing the same thing for free.'], { bonus: 'aqua_after_dark' }),
  museum: D('museum', 'The Museum', 'dating', ['museum'], { from: 10, to: 17 }, 90, 'two tickets',
    play('activity', 'contemplate_art', 'Walk the galleries'), 'The Museum with {npc}', ['Marge the tyrannosaur keeps an eye on the lobby. She has seen a great many second dates.'], ['Cafe Ammonite, two forks, one slice of something. The gift shop is successfully resisted. Mostly.'], { bonus: 'mus_free_friday' }),
  glasshouse: D('glasshouse', 'The Conservatory', 'spark', ['conservatory'], { from: 9, to: 19 }, 70, 'two garden tickets',
    play('activity', 'smell_flowers', 'Walk the glass houses'), 'The glass house with {npc}', ['Warm, green, dripping. Your coat is too much within a minute. So is theirs.'], ['The koi under the fig come up to look at you both. They seem to approve.'], { first: true }),
  pier: D('pier', 'Fishing off the pier', 'dating', ['poi_pier'], { from: 6, to: 20 }, 80, 'bait',
    play('activity', 'fishing_spot', 'Fish for a while'), 'The Fishing Pier with {npc}', ['Two rods, one bucket, a flask. The water slaps the pilings. Nobody is in a hurry, least of all the fish.'], ['You caught something, or you did not. That was never what it was for.'], { wet: 'A rain hood each and a shared bench under the bait shack. Somehow better.' }),
  game: D('game', 'An Otters home game', 'dating', ['arena'], { from: 17, to: 22, event: 'arena_game_sat' }, 150, 'two seats and a hot dog',
    play('show', 'arena', 'Two seats at the game'), 'The Otters game with {npc}', ['The arena roars before anything has happened. Somebody hands you a foam otter paw. You wear it.'], ['Win or lose, you both shout yourselves hoarse. Your ears ring all the way to the tram.'], { bonus: 'arena_game_wed' }),
  dance: D('dance', 'The ballroom class at the Grand Maple', 'dating', ['hotel', 'bar'], { from: 19, to: 23, event: 'hotel_dance_tue' }, 90, 'the class fee',
    play('activity', 'dance', 'Dance'), 'Dancing with {npc}', ['Madame Vasquez claps twice. "Partners!" You have one. That is a nice thing to notice.'], ['Your feet hurt. Theirs too. You count the bruises on the hotel steps like prizes.'], { bonus: 'hotel_dance_thu' }),
  plusone: D('plusone', 'A plus-one', 'spark', ['event'], { from: 9, to: 23 }, 120, 'whatever the day costs',
    play('walk', 'event', 'Go round together'), '{event} with {npc}', ['The whole town is out. You find each other by the thing you said you would meet by, which is a small triumph in a crowd.'], ['You lose them twice and find them twice. The second finding is the better one.']),
};

export const DATE_ORDER = ['arrive', 'person_arrive', 'play', 'person_moment', 'talk', 'close', 'goodnight'];

export const OUTCOMES = {
  rule: 'A date cannot fail. It is scored quietly from five things and the result is only ever shown as their goodnight text and a moodlet.',
  points: {
    onTime: 'Arrived within 10 minutes of the time: +1. More than 30 late: REPAIR.late plays, 0.',
    looked: 'Hygiene above 40 and not starving or exhausted: +1. (They never mention it otherwise. They suggest food sooner.)',
    liked: 'The date type is in their likes.outings, or the recipe cooked / the dish ordered matches likes.recipes: +1. In dislikes: their line says so, with affection, 0.',
    talk: 'The conversation happened (it always does): +1. A remembered detail came up (a `mem:` they hold was used): +1.',
    extra: 'A bonus event was on, or it was their birthday, or you brought a gift they love: +1.',
  },
  results: { fine: [0, 2], lovely: [3, 4], books: [5, 6] },
  warmth: { fine: 4, lovely: 6, books: 8 },
  mood: { fine: 'connected', lovely: 'rel_butterflies', books: 'rel_butterflies' },
  cooldown: 'One date a day. The same person at most every second day. The same date type with the same person gets its second line set the second time and a "we do this now" line from the fourth.',
};

export const REPAIR = {
  late: { marlow: 'You\'re late. I timed it. Habit. Sit down, I\'m only teasing. Mostly.', nico: 'There you are! I ordered for you twice. Different things. I panicked.', tasha: 'Eleven minutes. I did calf raises. You\'re forgiven, I got a workout.', imani: 'Late, but you look good, so I\'m torn.', felix: 'It\'s fine. I was early enough for both of us.', noor: 'I thought I had the wrong day. I\'m so glad it was only you being late.', tav: 'Hey! I did two laps of the block. Bonus cardio. Thank you.', haru: 'You are late. The tea is still hot. It is not serious.', celeste: 'Fashionably, cheri. But only just.', barnaby: 'I have read the menu four times. I could recite it. Do not make me.' },
  stoodUp: { marlow: 'I waited a while. It\'s all right. Tell me you\'re okay and we\'ll find another day.', nico: 'You didn\'t come. I\'m not mad! I\'m a bit sad. Are you okay? Tell me you\'re okay.', tasha: 'No-show. That\'s not like you. Check in when you can, yeah?', imani: 'I got stood up in my good shoes. You owe the shoes an apology. Are you all right?', felix: 'I think we missed each other. It might have been me. Was it me? Hope you\'re okay.', noor: 'I waited by the door for a bit. I hope nothing\'s wrong. No need to explain.', tav: 'Missed you tonight! Everything good? I ran home, so it wasn\'t a total loss.', haru: 'You did not come. I hope you are well. The offer stands.', celeste: 'I had a table for two and used half. I trust there is a good reason. Tell me when you can.', barnaby: 'I dined alone, which I do superbly, but tonight I had hoped not to. Are you quite well?' },
  makeRight: 'A missed date leaves a quiet idea in My Day: "Make it up to {npc}". Any of: a text chosen from two honest lines, a loved gift, or showing up at their work. It clears the dip. Nothing else is ever held against the player.',
  texts: ['I\'m sorry. I lost track of the day. Can I try again?', 'I let you down. Dinner is on me. Name the night.'],
};

export const GOODNIGHT = {
  marlow: { fine: 'That was nice. I left the building AND I enjoyed it. Noted.', lovely: 'I didn\'t think about the cafe for two whole hours. That\'s a record. Your fault.', books: 'I walked home the long way so it wouldn\'t be over yet.' },
  nico: { fine: 'Good night! Was that good? I thought that was good. Tell me it was good.', lovely: 'I sang all the way home. A dog joined in. Best night.', books: 'I rang my mother. I said "Ma, I\'m in trouble." She said "finally".' },
  tasha: { fine: 'Good time. Drink some water. I mean it.', lovely: 'I\'m smiling at a kettlebell. It\'s concerning. Night.', books: 'I don\'t do speeches. That was a ten. Don\'t make it weird. Night.' },
  imani: { fine: 'That was fun. You wore the right shoes. I notice these things.', lovely: 'I\'m home. I haven\'t taken my coat off. I\'m just standing here grinning.', books: 'I am going to design something about tonight. You\'ll never know which piece. It\'s the best one.' },
  felix: { fine: 'Home safe. Thank you. I had a list of things to say and I said three of them.', lovely: 'I can\'t sleep, so I\'m fixing a toaster. It\'s a happy toaster.', books: 'I said all the things on the list. And two that weren\'t on it. Good night.' },
  noor: { fine: 'Thank you for tonight. I only went quiet twice.', lovely: 'I\'m practicing. It\'s in a major key. You did that.', books: 'I forgot to be nervous. The whole evening. I just noticed.' },
  tav: { fine: 'Home! Good night! 4.2 miles total, if you count the walking.', lovely: 'My watch says my heart rate was up all evening. I didn\'t run once.', books: 'I\'m going to remember tonight at mile ten. That\'s the hard one. Thank you.' },
  haru: { fine: 'I am home. It was a good evening.', lovely: 'I am home. I have been standing in the kitchen. I am not cooking. I am thinking.', books: 'I wrote to my sister about tonight. Three lines. For me, that is a novel.' },
  celeste: { fine: 'A charming evening. Sleep well.', lovely: 'I did not count one fork. Not one. Good night, cheri.', books: 'I rang Margaux. She said, "Maman, you sound nineteen." I hung up on her. Good night.' },
  barnaby: { fine: 'A most agreeable evening. Three and a half stars. I round up.', lovely: 'I took no notes. I find I remember everything anyway.', books: 'I began a review of this evening and stopped at the first line. It read: "Reader, I was happy."' },
};

/* ---------------------------------------------------------------- first dates ---------------------------------------------------------------- */
const F = (person, title, place, window, list, end) => {
  const out = Object.assign(V('first_date', title, { stage: 'spark' }, place, null, window, list, end), { id: person + '.first_date', person });
  delete out.key;
  return out;
};

export const FIRST_DATES = {
  marlow: F('marlow', 'Not Coffee', 'spot:market_street', { days: [6], from: 10, to: 14 }, [
    '*|Sunday, the Market Street stalls. Marlow is standing at the peach stall with both hands in their pockets, on purpose.',
    'marlow|I\'ve been here ten minutes. I\'ve reorganized that man\'s napkins in my head twice.',
    'marlow|Rule for today: we don\'t go near the coffee cart. I\'ll have opinions and you\'ll never see me the same way.',
    '*|You walk the stalls. Marlow carries the bag without being asked and knows, somehow, which peaches.',
    'marlow|This is what people do, isn\'t it? Walk about. Buy a fruit. I\'ve served it for six years and never had one.',
    pick('ma_fd_day', o('what', 'What would you do with a whole day off?', ['marlow|I honestly don\'t know. I think I\'d stand outside the cafe and watch someone else do it wrong.', 'marlow|...Ask me again in a month. I\'d like to have an answer for you.'], { ro: { marlow: 2 }, mem: 'asked_day_off' }),
      o('cart', 'I\'m buying you a coffee from that cart.', ['marlow|You wouldn\'t.', '*|You do. Marlow drinks it slowly, with the face of someone reading a difficult letter.', 'marlow|It\'s... fine. It\'s fine! The milk\'s scalded. I\'m having a lovely time.'], { ro: { marlow: 2 }, mem: 'cart_coffee' }),
      o('peach', 'Hold still. You\'ve got peach on your chin.', ['*|They let you. That seems to surprise both of you.', 'marlow|Six years of handing people napkins. Nobody\'s handed me one.'], { ro: { marlow: 3 }, mem: 'peach' })),
    'marlow|I\'m not good at this part. The talking with nothing to do with my hands.',
    'marlow|But I noticed something. I haven\'t checked the time once. I always know the time.',
    '*|They check now. They laugh. It is an hour later than either of you thought.',
    'marlow|Do this again? Somewhere without a counter. I want to see what I\'m like.',
  ], { ro: { marlow: 4 }, fr: { marlow: 3 }, mood: 'rel_butterflies' }),

  nico: F('nico', 'Row F', 'cinema', { from: 12, to: 20 }, [
    '*|The Orpheum, a matinee. Nico is outside with two tickets, a box of chocolate raisins and the look of a man who got here at noon.',
    'nico|I got row F. It\'s the best row. Vera says so and Vera has been right since 1979.',
    'nico|Okay. Confession before we go in. I cry at films. Not a little. You should know what you\'re sitting next to.',
    play('show', 'cinema', 'Two seats in row F'),
    '*|He lasts eleven minutes. Then a dog on the screen waits at a station, and Nico is gone.',
    '*|Without looking, he holds out the raisins. Without looking, you take some.',
    pick('ni_fd_cry', o('hand', 'Take his hand.', ['*|He grips it like a rail on a ferry. He does not let go until the credits.', 'nico|Don\'t tell the guys at the shop. Tell everyone. I don\'t care.'], { ro: { nico: 3 }, mem: 'held_hand_film' }),
      o('tissue', 'Pass him the tissues from Vera\'s box.', ['nico|She put my name on the box. In MARKER.', '*|He blows his nose like a trumpet. Someone in row D says "bless you".'], { ro: { nico: 2 }, mem: 'vera_tissues' }),
      o('cry', 'Cry too. Why not.', ['*|It turns out to be easy with company.', 'nico|You as well?! Oh, thank God. I thought it was only me and Vera in this whole town.'], { ro: { nico: 3 }, mem: 'cried_too' })),
    '*|Outside it is still daylight, which feels wrong after a film. Nico is puffy and radiant.',
    'nico|I\'m going to say a thing and you can ignore it. I go fast. I always go fast. Then I scare people.',
    'nico|So I\'m going to go slow. This is me going slow. How\'m I doing?',
    '*|He is walking backwards down the pavement so he can keep looking at you. He nearly takes out a bin.',
    'nico|That was the bin\'s fault.',
  ], { ro: { nico: 4 }, fr: { nico: 3 }, mood: 'rel_laugh' }),

  tasha: F('tasha', 'Outdoors, With Food', 'spot:riverside_path', { from: 9, to: 19 }, [
    '*|The River Walk. Tasha is leaning on the rail with two paper trays from the hot dog cart, not stretching, visibly not stretching.',
    'tasha|I got you one with everything. You can pick stuff off. I won\'t watch. I\'ll watch a little.',
    'tasha|Ground rule. I\'m not coaching you today. If I say "posture", you get to throw a pickle at me.',
    '*|You walk. She matches your pace exactly, which you suspect takes more discipline than running.',
    'tasha|People think I\'m always like the morning class. Loud. Counting.', 'tasha|I\'m not, I just... it\'s the job. It\'s armor with a whistle.',
    pick('ta_fd_quiet', o('like', 'I like this version.', ['tasha|Yeah? This one doesn\'t get out much.', '*|She looks at the water for a while. It is not an uncomfortable while.'], { ro: { tasha: 3 }, mem: 'likes_quiet_tasha' }),
      o('both', 'I\'d like to know both.', ['tasha|Greedy. Okay. That\'s the right answer and I\'m annoyed how fast you got it.'], { ro: { tasha: 3 }, mem: 'both_tashas' }),
      o('posture', '"Posture."', ['*|She stares at you. Then she throws her own pickle at you. It is a very accurate throw.', 'tasha|National team. Six years. Don\'t test me with a pickle.'], { ro: { tasha: 2 }, mem: 'pickle' })),
    '*|A rowing eight goes by on the river, all eight backs moving like one animal. Tasha stops talking mid-word.',
    '*|She watches it all the way to the bridge. You do not ask. She notices that you do not ask.',
    'tasha|...Thanks.',
    'tasha|Okay. I had a good time and I\'m going to say so like a normal person. I had a good time.',
    'tasha|Next one\'s on you. Pick something that isn\'t a film. I mean it about films.',
  ], { ro: { tasha: 4 }, fr: { tasha: 3 }, need: { hunger: 20 }, mood: 'rel_butterflies' }),

  imani: F('imani', 'City History, Second Floor', 'museum', { from: 10, to: 17 }, [
    '*|The Museum of Maple Bay. Imani is in the City History hall, hands on hips, in front of a mannequin in a 1920s dock coat.',
    'imani|Look at this. LOOK at it. They\'ve pinned the back so it hangs straight.', 'imani|That coat never hung straight a day in its life.',
    'imani|Sorry. Hi. You look nice. That collar\'s doing a lot of work and I respect it.',
    play('activity', 'contemplate_art', 'Walk the hall with her'),
    '*|She reads clothes the way other people read plaques. A cuff tells her the job. A hem tells her the year, and the pay.',
    'imani|My grandmother did alterations out of her front room on Thimble Street.', 'imani|Everybody in these photographs, she let out their trousers.',
    pick('im_fd_ny', o('ny', 'Do you miss New York?', ['imani|Second date question. But I\'ll give you the trailer.', 'imani|I miss who I thought I\'d be there. I don\'t miss the rent. Ask me the rest over a drink.'], { ro: { imani: 2 }, mem: 'asked_ny' }),
      o('make', 'Do you make your own things?', ['*|A very small pause. If you were not watching, you would miss it.', 'imani|I sell other people\'s. It\'s a living. ...Why, what have you heard?', 'imani|Nothing. You\'ve heard nothing. Good. Come look at the hats.'], { ro: { imani: 3 }, mem: 'asked_designs' }),
      o('me', 'What does my jacket say about me?', ['imani|That you bought it for a different life and it\'s been patient with you.', 'imani|It\'s a good jacket. It\'s waiting. So am I, a bit. Let\'s see what you do.'], { ro: { imani: 3 }, mem: 'jacket_reading' })),
    '*|In the last case there is a child\'s dress, hand-sewn, 1940-something. Imani goes quiet in front of it.',
    'imani|Somebody made that at night. After work. You can tell by the stitches.', 'imani|They get smaller where she got tired and slowed down.',
    'imani|That\'s the whole thing, you know. That\'s all I ever wanted to be able to do.',
    'imani|Okay! Cafe. I\'m buying. You can tell me what you do, and I\'ll pretend I didn\'t guess it from your shoes.',
  ], { ro: { imani: 4 }, fr: { imani: 3 }, mood: 'inspired' }),

  felix: F('felix', 'It Looks Fake', 'observatory', { from: 19.5, to: 23 }, [
    '*|The Observatory, a clear night. Felix is by the door. He has clearly been round the block at least twice.',
    'felix|Hi. I wasn\'t early. I was a normal amount of early. I walked round to make it normal.',
    'felix|I brought a flask. And a spare flask in case the first flask broke. That\'s not... I see how that sounds.',
    play('minigame', 'trace', 'Find Saturn with him'),
    '*|He sets the eyepiece for you with two fingers, quickly, not fussing. With machines he is another person entirely.',
    'felix|There. Don\'t touch the tube. Just look.',
    '*|A small pale bead with a ring round it, hanging there. It looks like a sticker somebody put on the lens.',
    pick('fe_fd_saturn', o('laugh', 'Laugh. It looks completely fake.', ['felix|EVERYBODY laughs! That\'s the best bit. That\'s why I bring people. I mean. I haven\'t brought people.', 'felix|You\'re the people.'], { ro: { felix: 3 }, mem: 'saturn_laugh' }),
      o('quiet', 'Say nothing. Just look.', ['*|He lets you. He does not explain it. You get the sense that is the kindest thing he knows how to do.', 'felix|...Yeah. That\'s the right amount of words for it.'], { ro: { felix: 3 }, mem: 'saturn_quiet' }),
      o('how', 'How does the telescope work?', ['*|Eleven minutes. Mirrors, focal length, a small drawing on the back of a ticket. He does not stammer once.', 'felix|Sorry. That was a lot. You asked, though. You asked and then you LISTENED.'], { ro: { felix: 2 }, mem: 'telescope_lecture', xp: { logic: 10 } })),
    'felix|I rehearsed things to say tonight. I had a list. It\'s in my pocket.',
    '*|He takes it out. It is a real list. Item one reads: "say hello". Item four reads: "don\'t mention the list".',
    'felix|Well. That\'s that one gone.',
    'felix|Could we do this again? Something else. I\'ll make a shorter list.',
  ], { ro: { felix: 4 }, fr: { felix: 3 }, mood: 'rel_butterflies' }),

  noor: F('noor', 'The Glass House in the Rain', 'conservatory', { from: 10, to: 18 }, [
    '*|The Conservatory. Rain on a thousand panes, and under it Noor, at a table in the Glasshouse Cafe with both hands round a cup.',
    'noor|Hello. I got here early to choose a table and then I couldn\'t choose, so I chose this one four times.',
    'noor|I hope it\'s all right that it\'s loud. The rain, I mean.', 'noor|I like it. I can\'t hear myself think, which is the appeal.',
    '*|Without her cello she seems not to know what to do with her arms. She folds a napkin into smaller and smaller squares.',
    'noor|You can hear me through the wall, can\'t you. At home.', 'noor|You must hear everything. The bit in the second movement I keep getting wrong.',
    pick('no_fd_wall', o('love', 'I turn the radio off when you start.', ['*|She puts the napkin down.', 'noor|Oh. ...Oh. Nobody\'s ever. I thought I was the annoying neighbour.', 'noor|I\'ll play the next bit properly. Now I know there\'s an audience. No. I\'ll play it WORSE. I\'m joking. I think.'], { ro: { noor: 3 }, mem: 'radio_off' }),
      o('wrong', 'Which bit is wrong? It all sounds right to me.', ['noor|Bar forty. I rush it. Every time. I can hear myself rushing and I can\'t stop.', 'noor|It\'s nice that you can\'t tell. I\'m going to keep you ignorant as long as I can.'], { ro: { noor: 2 }, mem: 'bar_forty' }),
      o('walk', 'Come and see the koi. Bring the cup.', ['*|She comes. Walking helps. By the fig tree she has forgotten to be careful.', 'noor|That one\'s enormous. I\'m going to call him Maestro.'], { ro: { noor: 3 }, mem: 'koi_maestro' })),
    play('activity', 'smell_flowers', 'Walk the glass houses'),
    'noor|My recital\'s this year. In a real hall.', 'noor|I haven\'t told my parents the date, because then it will be a real date.',
    'noor|I don\'t know why I\'m telling you. I think it\'s the rain. Everything sounds like a secret in here.',
    '*|The rain eases. Neither of you points it out.',
    'noor|I\'d like to do this again. I\'ve practiced saying that. That was the first take. I\'m keeping it.',
  ], { ro: { noor: 4 }, fr: { noor: 3 }, mood: 'rel_tender' }),

  tav: F('tav', 'A Bucket in the Sky', 'poi_ferris_wheel', { from: 11, to: 21 }, [
    '*|The boardwalk. Tav is at the foot of the Bay Wheel in a clean shirt and long trousers, jogging very slightly on the spot.',
    'tav|Hey! Long trousers! Look! I own a pair. Don\'t ask how long I looked for them.',
    'tav|So. The Wheel. Great. Love it. Big fan of... sitting in a bucket. In the sky. With nothing under it.',
    '*|He has gone a shade paler than his shirt.',
    pick('tv_fd_wheel', o('skip', 'We don\'t have to. Let\'s walk the pier instead.', ['tav|No, no. I picked it. I pick things and then I don\'t do them. It\'s kind of my whole deal. Today I\'m doing one.'], { ro: { tav: 2 }, mem: 'offered_skip' }),
      o('hold', 'I\'ll hold on to you. You hold on to the bar.', ['tav|Deal. Don\'t tell the running club. They think I\'m fearless. I\'ve cultivated that.'], { ro: { tav: 3 }, mem: 'wheel_hold' }),
      o('tease', 'You run thirteen miles for fun.', ['tav|On the GROUND. The ground is the whole point of running! It\'s right there the entire time!'], { ro: { tav: 2 }, mem: 'wheel_tease' })),
    play('activity', 'ferris_wheel', 'Ride the Bay Wheel'),
    '*|He keeps his eyes shut to the top. Then the gondola stops, the way they do, and he opens one.',
    'tav|Oh.',
    '*|The whole bay, flat and silver. The lighthouse like a white pencil. A ferry drawing a line across it all.',
    'tav|You can see the River Walk. The whole loop. I\'ve run that a thousand times and never seen the shape of it.',
    'tav|Huh. It\'s not that far, is it? From up here. Thirteen miles looks like nothing.',
    '*|He is quiet all the way down. At the bottom his legs take a moment to remember walking.',
    'tav|I did a thing I said I\'d do. Write the date down. Then let\'s get ice cream, I think I\'ve earned ice cream.',
  ], { ro: { tav: 4 }, fr: { tav: 3 }, mood: 'bay_view' }),

  haru: F('haru', 'Monday', 'poi_pier', { days: [0], from: 9, to: 12 }, [
    '*|Monday, the Fishing Pier. The Noodle Lantern is shut.', '*|Haru is at the rail with a rod, a thermos and a folding stool. There is a second stool.',
    'haru|Good morning. I brought a stool for you. I had to buy it. I have only ever needed one.',
    '*|He hands you a rod already baited and says nothing else for some time. It is a furnished silence. There is tea in it.',
    play('activity', 'fishing_spot', 'Fish beside him'),
    'haru|I do not catch anything. I should say so now. It is not that sort of fishing.',
    'haru|Six days I talk to the pot and shout numbers. On Monday I come here and the water does not want anything.',
    '*|He opens a cloth. Rice balls, four, each a perfect triangle. He said he would not cook.',
    'haru|This is not cooking. This is rice.',
    pick('ha_fd_rice', o('eat', 'Eat one. Say nothing. Take a second.', ['*|He watches you reach for the second one. Something at the corner of his mouth moves about two millimetres.', 'haru|My mother made them this shape. I have not told anyone that. It is not a secret. Nobody asked.'], { ro: { haru: 3 }, mem: 'second_onigiri' }),
      o('ask', 'Who taught you to make these?', ['haru|My mother. In Sapporo. She would put a salted plum in one, only one, and not say which.', 'haru|You have the plum. I can tell by your face. Good. That is the lucky one.'], { ro: { haru: 3 }, mem: 'the_plum' }),
      o('quiet', 'Sit with him and watch the float.', ['*|Twenty minutes. A gull. A ferry. The float does not move, and it is somehow one of the better conversations of your week.', 'haru|You are good at this. Most people talk at the water.'], { ro: { haru: 3 }, mem: 'good_at_quiet' })),
    iff('pick:ha_fd_rice=quiet', [], ['*|The float dips once. Haru looks at it with mild reproach until it stops.']),
    'haru|I am forty-seven. I have a shop and one chair.', 'haru|I came for one summer and I am still here. That is the whole of it.',
    'haru|I would like to do this again. It does not have to be Monday. ...It would be easier if it were Monday.',
  ], { ro: { haru: 4 }, fr: { haru: 3 }, need: { hunger: 18 }, mood: 'zen' }),

  celeste: F('celeste', 'Standing Up, Outdoors', 'stand_coffee', { from: 9, to: 15 }, [
    '*|The coffee cart. Celeste is in a red coat with her hair down, holding a paper cup at arm\'s length as if it might go off.',
    'celeste|You see? I am doing it. Coffee from a cart. Standing. There is no saucer. I feel like a criminal.',
    'celeste|Twenty years I have told people where to sit. Today nobody is sitting anywhere. It is anarchy. I adore it.',
    play('order', 'stand_coffee', 'Order yours'),
    '*|You walk. Twice she turns to check on a table that is not there. The second time she catches herself and laughs.',
    'celeste|Forgive me. I am always facing the room.', 'celeste|My daughter says I enter a party like a lighthouse: slowly, in all directions.',
    pick('ce_fd_room', o('look', 'Then face me. I\'m the only table you\'ve got.', ['*|She does. It is a great deal of attention, all at once. You see why senators behave for her.', 'celeste|Well. Table for one, then. You are a very demanding table.'], { ro: { celeste: 3 }, mem: 'only_table' }),
      o('daughter', 'Tell me about your daughter.', ['celeste|Margaux. She left in September with two suitcases and my good umbrella.', 'celeste|The house makes a sound now. A sort of... nothing. I had not heard my own clock in nineteen years.'], { ro: { celeste: 3 }, mem: 'asked_margaux' }),
      o('carry', 'Take her empty cup and bin it for her.', ['*|She watches you do it as if you had performed a small magic trick.', 'celeste|Nobody clears for me. Not ever. You have no idea what you have just done, do you. No. Good.'], { ro: { celeste: 3 }, mem: 'cleared_cup' })),
    'celeste|I should say.', 'celeste|I am forty-five, I work every night that matters, and I have opinions about how napkins are folded.',
    'celeste|I do not know how to be the one who is looked after.', 'celeste|I intend to learn. You may find it is like teaching a cat to swim.',
    '*|A gull lands on the cart. Celeste gives it a look. The gull leaves.',
    'celeste|That, I can still do. Come. Walk me somewhere I have no business being.',
  ], { ro: { celeste: 4 }, fr: { celeste: 3 }, mood: 'rel_butterflies' }),

  barnaby: F('barnaby', 'Where He Eats on Mondays', 'diner', { days: [0], from: 11.5, to: 14 }, [
    '*|Dot\'s Diner, a Monday. In the end booth sits a man in a flat cap and a plain brown coat.', '*|No velvet. No cravat. He is hiding behind the laminated menu.',
    'barnaby|Sit, sit. Quickly. And lower your voice, I beg of you. I am not here. I have never been here.',
    'barnaby|I have eaten at this counter every Monday for eleven years and never written one word about it.', 'barnaby|It is the only place I do not have to have an opinion.',
    'dot|Usual, Mr. Smith? And for your friend?',
    'barnaby|She knows perfectly well who I am. We have an understanding.', 'barnaby|It is the most successful relationship of my life.',
    play('order', 'diner', 'Order at Dot\'s'),
    '*|The pancakes come. He eats them the way other people pray: eyes shut, no commentary. It is the first time you have seen him not talk.',
    pick('ba_fd_secret', o('safe', 'Your secret\'s safe with me.', ['barnaby|I believe you. I do not know why. I have known you a matter of weeks and I have just shown you the vault.'], { ro: { barnaby: 3 }, mem: 'keeps_dots_secret' }),
      o('stars', 'So how many stars?', ['barnaby|Do NOT. One does not put stars on this. One does not put stars on one\'s mother.', 'barnaby|...Four and a half. Privately. Take it to your grave.'], { ro: { barnaby: 2 }, mem: 'dots_stars' }),
      o('why', 'Why bring me here, of all places?', ['*|He sets down his fork. That, you gather, is an event.', 'barnaby|Because everywhere else I am performing.', 'barnaby|I thought you should meet the understudy before you met any more of the star.'], { ro: { barnaby: 4 }, mem: 'the_understudy' })),
    'barnaby|I am fifty-seven.', 'barnaby|I mention it once, as one mentions the price of a tasting menu, so that nobody is surprised at the end.',
    'barnaby|I cannot cook. I dine alone three hundred nights a year and call it a career. I am, I am told, "a lot".',
    'dot|He\'s a lot, hon. He tips, though. More coffee?',
    'barnaby|There you have it. My character reference.', 'barnaby|I should like to see you again, somewhere I am allowed to wear a cravat.',
  ], { ro: { barnaby: 4 }, fr: { barnaby: 3 }, need: { hunger: 30 }, mood: 'rel_laugh' }),
};

/** The generic lines used when a person has no line of their own for a date type (rel_dates_talk.js DATE_LINES). */
export const DATE_FALLBACK = {
  arrive: steps(['*|They are already there, looking the wrong way down the street for you. Then they turn.']),
  moment: steps(['*|At some point you both stop being careful. You could not say exactly when.']),
  again: steps(['*|"We do this now," they say. It seems you do.']),
  birthday: steps(['*|It is their birthday. They did not tell you. You knew anyway. That lands better than any gift.']),
  quiet: [pause(700)],
};
