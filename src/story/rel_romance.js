// =============================================================================
// Maple Bay — RELATIONSHIPS: the romance track, the shared part  (src/story/rel_romance.js)     PURE DATA. No init(), no side effects.
// Per-person scenes are in rel_hearts_a.js / rel_hearts_b.js; this file indexes them and holds everything the ten share:
// how people meet, what starts each milestone, living together, the family's reactions, the wedding, endings, keepsakes.
// Design: docs/story/RELATIONSHIPS.md section 5. Verified by `node tools/rel_check.mjs`.
//
// EXPORTS
//   HEARTS          { [personId]: Heart }      the ten, from the two group files (shape: header of rel_hearts_a.js).
//   SCENES_BY_ID    { [sceneId]: Scene }       every heart scene.
//   HEART_KEYS      the eleven scene keys every romanceable must have, in order.
//   MILESTONES      { [sceneKey]: { starts, needs, sets, note } }   what makes each scene available and what it changes.
//   MEETING         how a track opens: in the world and through Porchlight.
//   LIVEIN          living together: the routine, meals, chores, bills, the bed, per-person habits.
//   FAMILY_REACTS   { together, partner, engaged } -> { [familyId]: string[] }   what the family says as things get serious ({partner}).
//   WEDDING         venues, the plan (My Day card), the ceremony script in parts, the family's lines, receptions.
//   PLAYER_KIND     the three ways the player can let someone down / end things (their answers are each person's `kind`).
//   ANNIVERSARY     the yearly ideas.
//   SPEAKERS_EXTRA  speakers used here that are not cast.js ids (existing named figures who need a speaker hook).
//   ITEMS_NEW       { [itemId]: { name, kind, desc, from } }   keepsakes given by romance scenes.
//   SCENE_TEXTS     { [textId]: { from, text, after? (hours) } }   texts queued by a scene's `text` effect.
//   ENGINE_FLAGS    flags the ENGINE sets (scenes may read them; nothing in the data writes them).
// =============================================================================
import { HEARTS_A } from './rel_hearts_a.js';
import { HEARTS_B } from './rel_hearts_b.js';
import { o, pick, iff, pause, steps } from './_rel_kit.js';

const ALL = [...HEARTS_A, ...HEARTS_B];
export const HEARTS = Object.fromEntries(ALL.map(h => [h.person, h]));
export const SCENES_BY_ID = {};
for (const h of ALL) for (const s of h.scenes) SCENES_BY_ID[s.id] = s;

export const HEART_KEYS = ['meet', 'h1', 'h2', 'h3', 'steady', 'partner', 'keys', 'movein', 'proposal', 'm1', 'm2'];

export const MILESTONES = {
  meet:     { starts: 'Plays by itself the first time the player talks to them at Friend (40+) while they fit the player\'s `openTo` and are not the player\'s boss. Once.', needs: 'fr 40', sets: 'flag met:<id>:noticed. "Say how you feel" appears.', note: 'No stage change. It is a look, not a promise.' },
  h1:       { starts: 'An invitation (the scene\'s `invite` text) three days or more after the first date.', needs: 'stage dating', sets: 'heart_1', note: 'Needed before "Together".' },
  steady:   { starts: 'The player uses "Ask where this is going"; OR, if warmth is 45+ and h1 is done and the player has not asked for 6 days, THEY raise it at the end of the next date.', needs: 'ro 35 + h1', sets: 'stage exclusive', note: 'The other people the player is dating each get KIND.letdown (the player chooses the words).' },
  h2:       { starts: 'Invitation, four days or more after "Together".', needs: 'stage exclusive', sets: 'heart_2', note: 'Needed before "Partner".' },
  partner:  { starts: '"Ask to be partners", or they say it first at warmth 65+ after h2 (their scene is written so either works).', needs: 'ro 55 + h2', sets: 'stage partner; FAMILY_REACTS.partner begin', note: '' },
  keys:     { starts: '"Offer a key" (or their keyLine if they offer first, a week into Partner).', needs: 'stage partner', sets: 'keys:<id>; sleepovers; drop-ins', note: 'Each gives a keepsake key (ITEMS_NEW key_<id>).' },
  h3:       { starts: 'Invitation, five days or more after "Partner".', needs: 'stage partner', sets: 'heart_3', note: 'Needed before moving in and before a proposal. It ends their own story; the romance goes on.' },
  movein:   { starts: '"Ask them to move in". Optional: a couple can marry without it and then live together from the wedding night.', needs: 'ro 75 + 14 days as partners + h3', sets: 'lives:together; LIVEIN begins', note: 'They keep their old address as a line only ("I\'ve let the flat go").' },
  proposal: { starts: '"Propose" (the player asks). Anywhere; `place: any`.', needs: 'ro 85 + 28 days as partners + h3', sets: 'stage engaged; WEDDING.plan appears in My Day', note: 'If the place is in their likes.places they notice (WEDDING.proposalPlace).' },
  m1:       { starts: 'A week after the wedding, by itself at home (or their place of work for Haru).', needs: 'stage married', sets: '', note: 'Small on purpose.' },
  m2:       { starts: 'An invitation about three weeks after the wedding; afterwards it returns as the yearly anniversary idea.', needs: 'stage married', sets: 'anniversary idea', note: '' },
};

export const MEETING = {
  world: 'All ten are cast.js people with routines, so the player meets them as today (introduce yourself, be a regular, work beside them). Friendship comes first; at Friend the `meet` scene plays and the romance verbs appear.',
  app: 'Porchlight (rel_people.js PORCHLIGHT) shows the same ten. A chat and a first date can happen before friendship is 40: the app is the faster door, the town the slower one. Both end at the same first date (rel_dates.js FIRST_DATES).',
  strangers: 'Anonymous citizens (the existing "introduce yourself to strangers") can become friends as today. They are never romanceable: a romance needs a written person.',
  firstDate: 'The first date is always that person\'s FIRST_DATES scene, at their place and hours. After it the stage is Dating and every date type is open.',
};

export const LIVEIN = {
  rules: {
    routine: 'The partner keeps their cast.js routine, but "home" is now the player\'s home: they leave from it and come back to it, visibly, through the front door. They sleep in the player\'s bed at their own hours (LIVEIN.people[id].sleep).',
    morning: 'If both are home between 06:00 and 10:00, one `morning` line (the person\'s livein.morning pool), at most once a day. People who leave before the player wakes leave a note or a breakfast (their morning lines say which): a real item on the counter.',
    meals: 'Dinner: when the player cooks a dish with 2+ servings between 17:00 and 21:00 and the partner is home, they sit and eat it (the existing hosted-meal seat), +warmth once a day, extra if the recipe is in their likes. On `cooksOn` days the partner cooks instead: a dish from their likes.recipes waits on the table when the player comes home (uses no ingredients of the player\'s).',
    chores: 'Each partner quietly does ONE kind of chore (LIVEIN.people[id].chore) about every second day: dishes, plants, laundry, bins, tidy, or fix (a broken or dripping fixture mends itself). Home cleanliness falls about 25% slower. They never do everything.',
    bills: 'They pay 40% of the rent and utilities, shown on the Bay Bank statement as "From <name>: their share". A partner who moved out stops paying from that week.',
    bed: 'A double bed sleeps two. With only a single bed they say LIVEIN.singleBed once and sleep anyway (nothing blocks); My Day gains the idea "A bigger bed".',
    space: 'In a Tiny home (size class nook) they say LIVEIN.tiny once. They still move in.',
    needs: 'With a partner at home in the evening the Social need drifts up instead of down, and "Stay in tonight" is offered.',
    things: 'Moving in brings 2-4 pieces of theirs (LIVEIN.people[id].brings), placed by the engine in free spots or put in storage, owned jointly; they leave with them if it ends.',
    away: 'When the player is out for more than a day the partner texts once (`gap` bits) and the plants do not die.',
    visitors: 'Family and friends who drop in greet the partner by name (SMALL `with_partner` lines).',
    never: 'They never nag about mess, money, lateness or time spent with others.',
  },
  singleBed: steps(['*|One pillow each, and about a third of a mattress. Somebody\'s feet are cold. It is, against all reason, the best night\'s sleep in weeks.']),
  tiny: steps(['*|There is exactly one place to stand. You take turns standing in it. Nobody minds yet.']),
  people: {
    marlow:  { sleep: [21, 5], cooksOn: [6], chore: 'dishes', brings: ['eleven plants (four placed, the rest on sills)', 'a record player', 'a blue-lidded pot'], habit: 'A coffee under a saucer every morning, with a leaf in the foam.' },
    nico:    { sleep: [0, 8], cooksOn: [0, 1], chore: 'tidy', brings: ['nine pans', 'a record player', 'a framed photo of a shopfront'], habit: 'Sings in the shower. Leftover dough becomes garlic knots.' },
    tasha:   { sleep: [21.5, 5], cooksOn: [5], chore: 'bins', brings: ['a kettlebell', 'a foam roller', 'a crew photograph'], habit: 'A labeled smoothie in the fridge. Stretches on the floor at five.' },
    imani:   { sleep: [23.5, 7.5], cooksOn: [6], chore: 'laundry', brings: ['a dress form', 'a sewing machine on a small table', 'a clothes rail'], habit: 'Your collar is always pressed. There is always a pin on the floor.' },
    felix:   { sleep: [23, 7.5], cooksOn: [], chore: 'fix', brings: ['a workbench lamp', 'a shelf of labeled part boxes', 'a radio that only gets jazz'], habit: 'Things stop dripping, sticking and squeaking. Notes by the kettle.' },
    noor:    { sleep: [23, 7.5], cooksOn: [3], chore: 'dishes', brings: ['a cello on a stand', 'a music stand', 'an old teddy bear'], habit: 'Practices 19:00 to 21:00 in the room with you (a gentle +Inspiration while you are home).' },
    tav:     { sleep: [22.5, 6], cooksOn: [5], chore: 'laundry', brings: ['fourteen pairs of running shoes by the door', 'a beach photograph', 'a blender'], habit: 'Runs at six, back at half seven with coffee. Banana pancakes on rest days.' },
    haru:    { sleep: [0, 5.5], cooksOn: [0], chore: 'dishes', brings: ['a canvas knife roll', 'a small memorial shelf', 'a clay rice pot'], habit: 'Rice, an egg and pickles under a cloth each morning. Your knives are always sharp.' },
    celeste: { sleep: [0.5, 9], cooksOn: [], chore: 'tidy', brings: ['a crate of good glasses', 'two cloth-laid place settings', 'a hatbox'], habit: 'The table is always laid for two. A light is left on for her until midnight.' },
    barnaby: { sleep: [23, 7.5], cooksOn: [6], chore: 'bins', brings: ['a hatstand', 'a great many books', 'a box marked CRAVATS (RETIRED)'], habit: 'Reads the paper aloud at breakfast. Eggs on Sundays, with a thumbprint.' },
  },
};

export const FAMILY_REACTS = {
  together: {
    nana: ['I hear there is a person. I heard it from Roz, who heard it from the fishmonger. You might have told me yourself. Bring them. I shall know in the time it takes to pour.'],
    jules: ['So. {partner}. Pip saw you two on Market Street and has opened a file. I\'m just happy. I\'m also going to need every detail.'],
    theo: ['Welcome them to the out-law waiting room from me. It\'s a small room. The snacks are good.'],
    pip: ['I have questions for {partner}. Eleven. They are numbered. Milo has one question, and it is about dinosaurs.'],
    milo: ['Does {partner} know about stegosauruses? You could tell them. I could tell them.'],
    dez: ['Cuz. CUZ. {partner}? Nice. I\'m telling everyone I called it. I didn\'t call it. I\'m still telling everyone.'],
    dad: ['Your sister says there\'s somebody. Good. Are they kind.'],
    kit: ['{partner}. Okay. I approve, and I\'m writing a song about it. You can\'t stop me. It\'s already got a bridge.'],
  },
  partner: {
    nana: ['{partner} may call me Bea. Not yet. I shall say when. Bring them on Thursday, there will be scones.'],
    jules: ['There\'s a chair for {partner} on Sunday. Milo has made a place card. It\'s mostly a triceratops.'],
    theo: ['I\'ve started a shelf for {partner}. Don\'t tell them. It wobbles. That\'s how they\'ll know it\'s from me.'],
    pip: ['{partner} answered nine of my eleven questions properly. That is a pass. The file is now green.'],
    milo: ['{partner} did the stegosaurus voice. It was wrong. I liked it.'],
    dez: ['{partner}\'s all right, you know. They lost to me at pool and laughed. That\'s the test. That\'s my whole test.'],
    dad: ['Met {partner} on the telephone. Good voice. Looks you in the eye, I\'d say. Even down a wire.'],
    kit: ['Bring {partner} to the Heron on Friday. I\'ll play the song. I\'ve changed the names. I haven\'t changed the names.'],
  },
  engaged: {
    nana: ['Well. Sit down, I need to look at you. ...Yes. You have the face for it. Your mother had that face for a whole summer. I shall make the cake. Do not argue.'],
    jules: ['You\'re getting MARRIED. Little one. Come here. No, I\'m fine. Theo, I\'m fine. Somebody take this tea off me.'],
    theo: ['Congratulations. From one out-law to another: the secret is going for cocoa slowly. I\'ll explain at the wedding. Slowly.'],
    pip: ['I will need the date, the venue and a guest list. I am doing the seating plan. This is not a request.'],
    milo: ['Can I carry the rings? I won\'t drop them. I\'ll put them in my pocket with my best rock.'],
    dez: ['I\'m doing the music. No? The driving? I can\'t drive. The BIKES. I\'ll do a bike escort. It\'s happening.'],
    dad: ['Your mother would have told the whole street by now. I\'ll come. Tell me what to wear.'],
    kit: ['I get to stand up with you, right? I\'ve been standing next to you since we were eleven. It\'d be weird to stop for the main event.'],
  },
};

export const SPEAKERS_EXTRA = {
  narrator: { name: '', short: '', note: 'Caption text, no bubble tail.' },
  player: { name: '{name}', short: '{name}', note: 'The player. Speaks only through choices.' },
  clerk_bell: { name: 'Mr. Ignatius Bell', short: 'Mr. Bell', note: 'The City Clerk (data/cityhall.js PEOPLE.clerk). Officiates in the Wedding Room. Needs a speaker hook, not a new character.' },
  silas: { name: 'Silas Marrow', short: 'Silas', note: 'Keeper of Gull Point Lighthouse (data/lighthouse.js KEEPER; already a Chapters speaker).' },
  wendell: { name: 'Wendell', short: 'Wendell', note: 'The Conservatory\'s docent (sim/conservatory.js). Needs a speaker hook.' },
};

const VENUE = (id, place, name, officiant, when, seats, words, look) => ({ id, place, name, officiant, when, seats, words: steps(words), look });

export const WEDDING = {
  plan: {
    card: 'After the proposal My Day shows one gold-edged card: "The wedding: whenever you two are ready." Tapping it opens four small choices, in any order, each changeable until the day. Nothing has a deadline.',
    steps: [
      { id: 'where', ask: 'Where?', pick: 'one of WEDDING.venues', note: 'The partner says their `venueLine` for the one picked if it is in their likes.places.' },
      { id: 'when', ask: 'When?', pick: 'a day and hour inside the venue\'s `when`, at least two days ahead', note: 'Lands on My Day for both, tagged "The wedding". The family and friends at Friend+ are invited by themselves.' },
      { id: 'who', ask: 'Who stands up with you?', pick: 'any Close Friend or family member', note: 'They say their `standLine` (WEDDING.stand) and hold the rings.' },
      { id: 'after', ask: 'And afterwards?', pick: 'one of WEDDING.receptions', note: '' },
    ],
    clothes: 'Whatever the player is wearing is right. If they change into something from the "smart" clothes tags that morning, Imani (if a friend) and the partner each have a line.',
    cost: 'City Hall $40 (the licence, at the Clerk\'s window: the existing counter). Other venues are free; the reception costs what its food costs.',
    weather: 'An outdoor venue in rain goes ahead under umbrellas, with WEDDING.rain lines. Nothing is postponed.',
  },
  venues: [
    VENUE('cityhall', 'cityhall', 'The Wedding Room, City Hall', 'clerk_bell', { days: [5], hours: [11, 13, 15] }, 24,
      ['clerk_bell|Good morning. I have married nine hundred and four couples in this room. I mention it so you know I shall not be the nervous one.', 'clerk_bell|Confetti is permitted. Rice upsets the pigeons. Shall we?'], 'The second-floor room with the tall windows; the existing Saturday civil weddings, and this slot is yours.'),
    VENUE('conservatory', 'conservatory', 'Under the fig, at the Conservatory', 'wendell', { days: [0, 1, 2, 3, 4, 5, 6], hours: [10, 14, 17] }, 30,
      ['wendell|Welcome, everyone. Mind the koi. They are not invited, and they have come anyway.', 'wendell|This fig was planted in 1911 by two people who had just been married. So it knows what to do. You need only stand under it.'], 'The palm house by the koi pond; green light, dripping glass.'),
    VENUE('lighthouse', 'lighthouse', 'The gallery at Gull Point Light', 'silas', { days: [0, 1, 2, 3, 4, 5, 6], hours: [16, 18] }, 12,
      ['silas|Ninety-seven steps, and all of you made it. Ninety-eight, for those who count the doorstep.', 'silas|The lamp has seen two hundred years of people finding their way home. It seemed the right witness. I\'ll write you both in the log.'], 'The lamp gallery at dusk; small, windy, the whole bay below. The lamp is lit as you kiss.'),
    VENUE('bandstand', '@Bandstand', 'The bandstand in Central Park', 'captain', { days: [5, 6], hours: [11, 14, 16] }, 40,
      ['captain|A ship\'s captain may marry people. I looked it up. I did not look it up very hard.', 'captain|I ran a ferry forty years. I have seen every sort of crossing. This is the only one where both of you get off on the same side.'], 'White iron, bunting, folding chairs on the grass; Fenn plays if they are your friend.'),
    VENUE('lookout', 'lookout', 'Hillcrest Lookout', 'captain', { days: [0, 1, 2, 3, 4, 5, 6], hours: [10, 15, 17] }, 20,
      ['captain|Up here you can see the whole of it. The Light, the harbor, the Wheel. Everything you two will ever argue about is down there, looking small.', 'captain|Stand at the rail. Face each other, not the view. The view will keep.'], 'The rail where Chapter 15 ends (only offered once ch15 is done); maples in season.'),
    VENUE('ballroom', 'hotel_ballroom', 'The Bay Ballroom, the Grand Maple', 'clerk_bell', { days: [5], hours: [15] }, 60,
      ['clerk_bell|I do not usually leave City Hall. An exception has been made. There was talk of cake.', 'clerk_bell|It is a very large room. I shall speak up. You two need only say two words each, and you may say them quietly.'], 'Chandeliers and a dance floor; rolls straight into the existing Saturday reception hours.'),
  ],
  receptions: [
    { id: 'kettle', place: 'bakery', name: 'Tea at the Kettle Corner', needs: 'done:ch14', line: 'Roz closes the bakery for the afternoon. The bell on the hook is rung once for each of you.' },
    { id: 'ballroom', place: 'hotel_ballroom', name: 'The Bay Ballroom', needs: null, line: 'A band, a dance floor, and Madame Vasquez correcting everybody\'s posture.' },
    { id: 'slice', place: 'pizza', name: 'Slice of Heaven, the whole shop', needs: null, line: 'Forty pizzas. Paper plates. Somebody\'s uncle at the jukebox.' },
    { id: 'home', place: 'home', name: 'At home', needs: null, line: 'Everyone brings a dish. Nobody can find a chair. It is perfect.' },
  ],
  stand: {
    jules: 'Me? Of course me. I\'ve been standing up for you since you were four and bit a boy at the swings.', kit: 'Finally, a gig where I don\'t have to sing. I\'m going to sing.', dez: 'I\'ll hold the rings. In the bag. The zip pocket. They\'re safer in there than in a bank.',
    theo: 'I\'d be honored. I\'ll make a little box for the rings. It will wobble.', nana: 'I shall sit. I am seventy-eight. But I shall sit at the FRONT, and hold them in my handbag.', dad: 'Aye. I\'ll stand.', any: 'They say yes before you have finished asking.',
  },
  proposalPlace: steps(['*|You chose this place on purpose. They see that you did. It goes in, and stays.']),
  ceremony: {
    order: ['gather', 'venue.words', 'walk', 'vows.partner', 'vows.player', 'rings', 'kiss', 'after', 'reception'],
    gather: steps([
      '*|{place}. Chairs, and people finding them. Everyone you have met in this town seems to be here, in a better shirt.',
      iff('done:ch03', ['pip|Row one is family. Row two is friends. I have laminated the plan. Uncle Dez, you are in the wrong row. You are ALWAYS in the wrong row.']),
      'dez|I\'m in the fun row.',
      iff('done:ch15', ['*|Dad is at the end of the front row in a suit that has been in a wardrobe since 1988. It still fits. He has checked the roof of the building, twice.', 'dad|It\'s a good day for it.']),
      'nana|Stand up straight. No. You are standing beautifully. I only wanted something to say.',
      'jules|Has anyone got a tissue? Theo. Theo, you had ONE job.',
      'theo|I have eleven tissues. I\'ve been to a wedding with you before.',
      iff('done:ch10', ['milo|I have the rings. They are in my pocket with my best rock. The rock is for luck.']),
    ]),
    walk: steps([
      '*|Then everybody turns round at once, and there they are.',
      '*|{partner}. In the doorway, in the light. Looking at nobody but you.',
      pause(1200),
      '*|It is about fifteen steps. You will remember each one separately.',
    ]),
    playerVows: [pick('wed_vow',
      o('home', '"I came here not knowing anybody. You are how I know I live here."', ['*|{partner} breathes in, and does not quite manage to breathe out.']),
      o('funny', '"I promise to learn how you take your tea, and then get it slightly wrong forever."', ['*|A laugh goes round the chairs. {partner} is laughing too, and wiping their eyes with the heel of a hand.']),
      o('plain', '"I\'ll show up. Every day. That\'s all of it. That\'s the whole promise."', ['*|{partner} nods, hard, twice. It appears to be all they can do.']))],
    rings: steps([
      iff('done:ch10', ['*|Milo comes forward with both fists shut. He opens the right one. It is the rock. He opens the left one. There they are.'], ['*|The rings are passed forward, hand to hand, down the row.']),
      '*|Two rings. They are a little cold, and then they are not.',
    ]),
    kiss: steps([
      '*|Whoever is marrying you says the last words. You do not hear them. You were not waiting to be told.',
      pause(1000),
      iff('done:ch14', ['*|From somewhere at the back, a small brass bell rings, twice. Nana has brought it from the bakery in her handbag.']),
      'dez|YES! Sorry. Yes.',
    ]),
    after: steps([
      'nana|There. Now come here, both of you. {partner}, you may call me Bea. I have decided. It took me less time than I expected.',
      iff('done:ch15', ['dad|She\'d have narrated the whole thing. Start to finish. What everybody wore.', 'dad|So I\'ll say it. It was a good wedding. You looked happy. That\'s what I\'m looking at.']),
      iff('done:ch11', ['jules|Little one. I\'m allowed to say it today. Tomorrow I\'ll stop. I won\'t stop.']),
      'theo|Welcome to the out-law club, {partner}. Best seats in the house. I\'ll go for cocoa, slowly, and you two take as long as you like.',
      iff('done:ch03', ['pip|The ceremony ran four minutes over. I have allowed for it. Photographs are now. Everybody look at the camera. MILO.', 'milo|There was a bird.']),
      'kit|I wrote you a song. It\'s finished. That\'s two finished songs now. I\'m practically prolific.',
    ]),
    rain: steps(['*|It rains. Forty umbrellas go up at once, like a field of mushrooms. Nobody leaves.', 'nana|Rain on a wedding is luck. I have just decided that, and I am old enough to make it true.']),
  },
  reception: {
    toast: steps([
      'theo|I\'ve been asked to say a few words. I\'ve drawn them on a napkin.',
      'theo|There are three columns. HAS TO, WANT TO and MIGHT. Under HAS TO it says "be kind". Under WANT TO, it says "each other". Under MIGHT, it says "learn to dance".',
      'theo|To the pair of you.',
    ]),
    dance: steps([
      '*|There is a first dance. Neither of you is good at it. That turns out not to be what it is for.',
      iff('done:ch15', ['*|Halfway through, you see Dad cross the floor and hold out a hand to Nana Bea. She looks at it for a long moment. Then she takes it.', 'nana|You are still thin, Frank.', 'dad|You\'re still short, Bea.']),
    ]),
    end: steps([
      '*|It gets late. People go home in ones and twos, carrying cake in napkins.',
      '*|You walk back through the town, the two of you, with confetti in your shoes. Leave it.',
    ]),
  },
};

export const PLAYER_KIND = {
  letdown: [
    { id: 'honest', text: '"I like you a great deal. Not that way. I\'d rather say it than let it drift."' },
    { id: 'friend', text: '"You\'re one of my favourite people here. I want to keep that, and I think this would cost it."' },
    { id: 'timing', text: '"I\'m not in the right place for this. That\'s about me. You\'ve been nothing but good to me."' },
  ],
  breakup: [
    { id: 'honest', text: '"I\'ve been turning this over for a while. I don\'t think I can give you what you should have."' },
    { id: 'grateful', text: '"You changed things for me here. I\'m grateful for all of it. And I think it\'s finished."' },
    { id: 'short', text: '"I need to end this. I\'m sorry. You deserve to hear it plainly, and from me."' },
  ],
  sure: 'Are you sure? {partner} will be told kindly, and you will stay friends. This cannot be taken back today.',
  othersTold: 'When the player chooses "Together" with one person, each other person they are dating gets a text first ("Can we talk? Nothing bad. Well. A little bad.") and then their letdown scene the next time they meet. It is never done by text alone.',
};

export const ANNIVERSARY = {
  firstDate: 'On the calendar date of the first date, each year: an idea in My Day, "A year ago today, with {partner}", leading back to the first date\'s place with one new line from DATE_TALK_AFTER.',
  wedding: 'On the wedding date: their `m2` scene comes round again as an invitation (it is written to be re-playable), and the family texts.',
  texts: { nana: 'A year. I told you it would keep.', jules: 'Happy anniversary, little one. Dinner is at ours. Bring nothing but {partner}.', dad: 'A year. Good. Still looks like it suits you.' },
};

export const ITEMS_NEW = {
  key_marlow: { name: 'Marlow\'s Key', kind: 'keepsake', from: 'marlow', desc: 'On a tiny brass coffee scoop. It also opens the cafe. Do not open the cafe.' },
  key_nico: { name: 'Nico\'s Key', kind: 'keepsake', from: 'nico', desc: 'The top lock sticks. There is flour in the teeth of it.' },
  key_tasha: { name: 'Tasha\'s Key', kind: 'keepsake', from: 'tasha', desc: 'Ninth floor. There is a lift. You are told it works.' },
  key_imani: { name: 'Imani\'s Key', kind: 'keepsake', from: 'imani', desc: 'On green grosgrain ribbon, finished at the ends so it will not fray.' },
  key_felix: { name: 'Felix\'s Key', kind: 'keepsake', from: 'felix', desc: 'Cut after hours and filed by hand. It will never catch.' },
  key_noor: { name: 'Noor\'s Key', kind: 'keepsake', from: 'noor', desc: 'On a loop of silver cello string: a C that broke in the middle of an exam.' },
  key_tav: { name: 'Tav\'s Key', kind: 'keepsake', from: 'tav', desc: 'On a race lanyard with the year cut off.' },
  key_haru: { name: 'Haru\'s Key', kind: 'keepsake', from: 'haru', desc: 'Lift, then turn. Like a pan.' },
  key_celeste: { name: 'Celeste\'s Key', kind: 'keepsake', from: 'celeste', desc: 'It lives in the bowl by her door, on the left.' },
  key_barnaby: { name: 'Barnaby\'s Key', kind: 'keepsake', from: 'barnaby', desc: 'Iron, enormous. It opens the kitchen door, as family does.' },
  imani_twelve: { name: 'Piece Twelve', kind: 'clothing', from: 'imani', desc: 'Cut to your shoulders the night the window went up. The label reads IMANI COLE, MAPLE BAY.' },
  imani_jacket: { name: 'The Patient Jacket', kind: 'clothing', from: 'imani', desc: 'Your good jacket, let out through the shoulders and relined in harbor blue. Initials inside the cuff.' },
  felix_orrery: { name: 'A Walnut-Sized Orrery', kind: 'keepsake', from: 'felix', desc: 'Two brass planets that go round when you turn the key. One has a ring. The gears are from Mrs. Moss\'s clock.' },
  tav_bib: { name: 'A Race Number, Worn', kind: 'keepsake', from: 'tav', desc: 'MAPLE BAY HALF. Creased, sweat-stained, four pin holes. He wanted you to have the first one that counted.' },
  haru_snow_jar: { name: 'Snow in a Jar', kind: 'keepsake', from: 'haru', desc: 'It was snow, from under a plum tree in Sapporo. It is water now. He wanted you to have been there.' },
  fifth_star: { name: 'The Fifth Star', kind: 'keepsake', from: 'barnaby', desc: 'Brass, five points, awarded in the third grade for penmanship. Not transferable. There will not be another.' },
  barney_book: { name: 'Kitchens I Was Not Asked Into', kind: 'book', from: 'barnaby', desc: 'By Barney Quill. Plain cover. The dedication has two lines; the second is yours.' },
};

export const SCENE_TEXTS = {
  imani_ny_text: { from: 'imani', after: 60, text: 'Landed. It smells exactly the same. I\'m wearing the wrong shoes on purpose, so I can\'t stay long.' },
};

export const ENGINE_FLAGS = {
  haru_fed_broth: 'Set if the player took the favour "Feed the master stock" while Haru was away between h2 and h3 (visit the Noodle Lantern once a day for three days; one tap at the pot). Optional; h3 reads it for one extra line.',
};
