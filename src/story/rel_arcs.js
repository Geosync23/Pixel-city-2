// =============================================================================
// Maple Bay — RELATIONSHIPS: vignette arcs, the index  (src/story/rel_arcs.js)     PURE DATA. No init(), no side effects.
// Twelve people who are not on the romance track, each with a story told in six to eight evenings.
//   rel_arcs_a.js  Nana Bea, Nora (`jules`), Theo        rel_arcs_b.js  Pip and Milo (`kids`), Dez, Dad
//   rel_arcs_c.js  Kit, Mr. Pike (`gordon`), Fenn         rel_arcs_d.js  Birdie, Walt, Vik
//
// EXPORTS
//   ARCS            { [personId]: Arc }         Arc = { person, title, premise, thread, scenes: Scene[] }
//   ARC_SCENES      { [sceneId]: Scene }        every vignette, by id ('<person>.<key>').
//   ARC_SPEAKERS    { [arcId]: castId[] }       who the arc "belongs" to for friendship gates (kids = pip and milo).
//   PAGES           { [pageId]: { from, place, title, lines[] } }   "a page for the book": an order slip in that person's hand for a
//                   place they love, with a thing to do there (CHAPTERS.md section 8: "the pages keep coming"). Given by the last scene
//                   of every arc and by every romanceable's third heart scene. Read at home in the book, after the family's pages;
//                   reading one pins its first line on the Map at `place`, like Mom's pages.
//   ARC_ITEMS       { [itemId]: { name, kind, desc, from } }   keepsakes given by vignettes.
//   ARC_TEXTS       { [textId]: { from, text, after? (hours) } }   texts queued by a vignette's `text` effect.
//   ARC_ENGINE_FLAGS  flags the engine sets that a vignette may read.
// =============================================================================
import { ARCS_A } from './rel_arcs_a.js';
import { ARCS_B } from './rel_arcs_b.js';
import { ARCS_C } from './rel_arcs_c.js';
import { ARCS_D } from './rel_arcs_d.js';

const ALL = [...ARCS_A, ...ARCS_B, ...ARCS_C, ...ARCS_D];
export const ARCS = Object.fromEntries(ALL.map(a => [a.person, a]));
export const ARC_SCENES = {};
for (const a of ALL) for (const s of a.scenes) ARC_SCENES[s.id] = s;

export const ARC_SPEAKERS = { nana: ['nana'], jules: ['jules'], theo: ['theo'], kids: ['pip', 'milo'], dez: ['dez'], dad: ['dad'], kit: ['kit'], gordon: ['gordon'], fenn: ['fenn'], birdie: ['birdie'], walt: ['walt'], vik: ['vik'] };

const P = (from, place, title, lines) => ({ from, place, title, lines });

export const PAGES = {
  /* ---- the twelve arcs ---- */
  nana_page: P('nana', 'home:grandma', 'The Chair by the Range', ['Not for the book. For you.', 'Sit in it when I am out. It is the warm one. I have never let anyone.', 'Put the kettle on first. Ten past five is a good time. You will know why.', 'I said it aloud once. Here it is again, written, so you need not rely on my nerve: I love you. B.']),
  jules_page: P('jules', 'spot:community_garden', 'Plot Fourteen', ['Go on a Wednesday, about four. Nobody will need you there.', 'Pinch out the side shoots. You have to take things off for the rest to do well.', 'The first ripe tomato goes to whoever is standing in the plot. That is the rule. I made it up.', 'Say "come on, you" to something. Mom did. I do. Your turn.']),
  theo_page: P('theo', 'spot:market_street', 'The Stall, Saturdays', ['Between the cheese and the candles. Look for the sign Dez wrote.', 'Pick something up. Set it down. Watch it settle. That is not a fault. That is it getting comfortable.', 'Do not rush the last joint of anything. Make a cup of tea first.', 'Out-law club. Best seats in the house.']),
  kids_page: P('pip', 'home', 'Your Flat (an official finding)', ['Item one: the bath is good for submarines. (Milo.)', 'Item two: there is a clock you can hold in bed. (Milo.)', 'Item three: this is where to go when you need a grown-up who says the real time. (Pip.)', 'Things to do there: ask a question. You will get a proper answer. We tested it. Signed, the Bureau.']),
  dez_page: P('dez', 'spot:tram_shed', 'The Cut Behind the Tram Shed', ['Not a road. Not legal. Saves four minutes to the harbor.', 'Go slow the first time. There\'s a dog called Kevin on the corner. Stop for him. Thirty seconds.', 'Every street in this town has a back. This is the first one. I\'ll show you the rest. It\'ll take a year.', 'Ring your bell at the end so Mr. Pike knows it\'s you.']),
  dad_page: P('dad', 'airport', 'Arrivals', ['Stand at the rail.', 'Wait for the last bag.', 'Say what you see.', 'It\'ll keep.']),
  kit_page: P('kit', 'poi_pier', 'The End of the Pier', ['Sunday, when the light goes long. Sit on the planks with your boots over.', 'Write down the first thing anybody says near you. That\'s a first line. I\'ve got thirty.', 'Then finish it. That\'s the hard part. Get someone to sit on your floor and say "and then what".', 'It\'s a hard town to leave. That\'s the best thing I can say about anywhere. I didn\'t say it first.']),
  gordon_page: P('gordon', 'spot:tram_shed', 'The Shed, Mondays at Ten', ['A workman\'s return. Buff. It is the only paper I had about me.', 'Come at ten. Wear old clothes. Name the fourteen points before you touch the oil.', 'Ring twice before she moves. A bell is a promise. It says: I have looked.', 'Forty yards, and every inch of it right. G. Pike, Conductor.']),
  fenn_page: P('fenn', 'central_station', 'The Departures Board', ['Best view in town. Nobody sits down to look at it. Sit down.', 'Pick a train you\'re not getting on. Imagine the whole way there. Then stay.', 'Ask at the window what a return costs. Just to hear them say it.', 'Leave one coin in somebody\'s hat on your way out. So it isn\'t lonely.']),
  birdie_page: P('birdie', 'spot:pond', 'The Bench by the Pond', ['Eleven o\'clock, dear. Scatter. Do not throw.', 'Say "hello" to somebody, and listen to how they say it back. It is a whole letter, if you know how to open it.', 'Keep the line open one second longer than you need to. In case they wish to say the rest.', 'When an aeroplane goes over, wave. One never knows who has the window seat.']),
  walt_page: P('walt', 'spot:building_stoop', 'The Stoop', ['Eight o\'clock, with a coffee. Watch who comes home.', 'Listen to the building. Pipes don\'t lie. Neither do stairs.', 'If the phone rings, pick it up.', 'Don\'t let it go to your head.']),
  vik_page: P('vik', 'spot:chess_tables', 'Table Three (a proof)', ['Given: a board, two cups, and a morning.', 'To show: that one may lose and be the better for it.', 'Method: bring out your pieces. Look after your king. Then ask of every move, where did it come from?', 'Q.E.D. You may be white.']),
  /* ---- the ten romanceables (given by their third heart scene) ---- */
  marlow_page: P('marlow', 'central_station', 'The End of the Line', ['Take the first train on a Sunday. Stay on past Arts Quarter. Stay on.', 'There\'s a platform, a field and a vending machine. That\'s all. That\'s the point.', 'Bring a thermos. Don\'t pour it straight away.', 'Miss the train back on purpose. Start a list of what you like. Mine has a bird on it.']),
  nico_page: P('nico', 'pizza', 'The Corner Table at Slice of Heaven', ['My father sat here. He ate the whole pie. Crust and all.', 'Order the plain one. If a place can\'t do the plain one, nothing else is true.', 'Watch them turn it in the oven. It\'s hot on the left. We turn them.', 'Then stay a while after you\'ve finished. The good part of anything is the middle.']),
  tasha_page: P('tasha', 'spot:riverside_path', 'The Footbridge, 6 AM', ['Get up. I know. Get up anyway.', 'Stand in the middle of the bridge when the mist\'s still on the water.', 'If a boat comes through, listen for the catch. Eight blades. It sounds like one breath.', 'Then let somebody carry your bag home. Small one. Build up.']),
  imani_page: P('imani', 'clothing', 'The Window of Thread & Co.', ['Stand on the pavement, not in the shop. Look at it the way a stranger would.', 'Find the card at the mannequin\'s foot. Read the name out loud.', 'Then go in and try the thing you think you can\'t wear.', 'Finish. My grandmother only ever said one word, and that was it.']),
  felix_page: P('felix', 'library', 'The Fix-It Bench, Saturdays', ['By the periodicals. Noon till three. Bring the bits.', 'Don\'t tell me what\'s wrong with it. I like to find out.', 'While you wait, listen to the queue. Everybody says where the thing came from. Nobody says what it cost.', 'Found and mended. F. Wu.']),
  noor_page: P('noor', 'concerthall', 'Row G, Seat 12', ['You can see the whole stage, and the door in the panelling.', 'Watch the second desk of the cellos. You won\'t hear her. She\'s holding it up.', 'Don\'t clap at the pause. Wait for the end. Then clap. You\'re allowed.', 'Afterwards, hum something on the way home. Badly. On purpose.']),
  tav_page: P('tav', 'spot:riverside_path', 'The Kerb at Mile Eleven', ['By the footbridge, forty yards short. There\'s chalk on it.', 'Sit down on it. Runners will ask if you\'re good. Give them a thumbs-up.', 'Ring somebody a long way off, and tell them where you are.', 'Then get up and do the next mile. Walk it, if you like. It still counts.']),
  haru_page: P('haru', 'poi_pier', 'The Pier, Monday', ['Bring a stool. Bring a second stool.', 'Bait the hook. Put the rod over the rail. Do not expect anything.', 'Eat a rice ball. One has a salted plum. I will not say which.', 'Say one true thing, or say nothing. Both are welcome here.']),
  celeste_page: P('celeste', 'restaurant', 'The Gilded Gull, with Your Back to the Room', ['Ask for the chair that faces the window. Insist, gently.', 'Do not look round, whatever you hear. It is not yours tonight.', 'Order the plainest thing. Let them bring it. Let them pour.', 'Leave your napkin crumpled. It is very difficult. It is the whole lesson.']),
  barnaby_page: P('barnaby', 'diner', 'The End Booth, on a Monday', ['Wear nothing grand. Sit with your back to the door.', 'Order the pancakes. Do not describe them. Close your eyes.', 'If the proprietor calls you "hon", you have been accepted. If she tells you to move your elbows, you are family.', 'No stars. One does not put stars on this. Barney.']),
};

export const ARC_ITEMS = {
  nana_tin: { name: 'The Recipe Tin', kind: 'keepsake', from: 'nana', desc: 'Nineteen index cards. Her handwriting on the titles, yours underneath. "Two handfuls, mine" is crossed out and weighed.' },
  theo_stool: { name: 'A Stool That Leans', kind: 'furniture', from: 'theo', desc: 'About four degrees to the left. It will hold you. It just does not look as though it will.' },
  bureau_badge: { name: 'Bureau Badge', kind: 'keepsake', from: 'pip', desc: 'Cardboard, safety pin. BUREAU: ADULT (TRUSTED). To be worn at all official business, including Sunday dinner.' },
  dez_bell: { name: 'A Brass Bicycle Bell', kind: 'keepsake', from: 'dez', desc: 'Filed out of an old fare box. One round note. The whole Railyard knows who that is.' },
  nell_brush: { name: 'Mom\'s Paintbrush', kind: 'keepsake', from: 'dad', desc: 'Stiff with thirty years of gloss. The blue on the bristles is the blue of a door on Thimble Street.' },
  key_kit: { name: 'The Loft Key', kind: 'keepsake', from: 'kit', desc: 'On a guitar pick with a hole drilled in it. Water the fern. Don\'t read the cards. Read the cards.' },
  pike_ticket: { name: 'A Punched Ticket', kind: 'keepsake', from: 'gordon', desc: 'Harbor line, single, pink. Clipped at MARKET ST. Hold tight, please.' },
  birdie_rota_book: { name: 'The Feeding Book', kind: 'keepsake', from: 'birdie', desc: 'A ruled exercise book: the pond at eleven, City Hall at eight, the plaza at five. A column headed "G."' },
  walt_wrench: { name: 'The Second Wrench', kind: 'tool', from: 'walt', desc: 'His father\'s own, from behind the counter. Lighter than Walt\'s. The maker\'s name is worn nearly flat.' },
};

export const ARC_TEXTS = {
  dad_daily_1: { from: 'dad', after: 24, text: 'Dry. A cheese sandwich. A heron on the quarry pond. Dad.' },
  kit_pc_1: { from: 'kit', after: 168, text: 'POSTCARD 1 of 6. The studio has no window. I drew one. Song 2 has a verse. I miss the fog, which I never thought I\'d type.' },
  kit_pc_2: { from: 'kit', after: 336, text: 'POSTCARD 2. A man here asked what the song was "about". I said a harbor. He said "like, metaphorically?" No. Like, a harbor.' },
  kit_pc_3: { from: 'kit', after: 504, text: 'POSTCARD 3. Halfway. Three songs. I wrote this one in the queue for the post office, looking at the clock. Full circle.' },
  fenn_field_text: { from: 'fenn', after: 96, text: 'Forty posts today. My hands are ruined for the accordion. Cal says that\'s "a mercy". There are more stars here than I remembered.' },
  birdie_cup_text: { from: 'birdie', after: 5, text: 'They DID bring a drink in a little cup, dear. I saw the pond. I waved. Tell Gerald.' },
};

export const ARC_ENGINE_FLAGS = {
  birdie_fed: 'Set if the player fed the pond flock on at least four of the seven days Birdie was away (the favour from `birdie.rota`: an 11:00 idea in My Day, one tap at the bench). Optional; the last scene reads it for one line.',
};
