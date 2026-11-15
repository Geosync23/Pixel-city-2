// =============================================================================
// Maple Bay — RELATIONSHIPS: the rules as data  (src/story/rel_rules.js)     PURE DATA. No engine imports, no init(), no side effects.
// The two tracks and what each stage unlocks, the context verbs, the pacing plan, the moodlets and the gift notes.
// Prose and reasons: docs/story/RELATIONSHIPS.md (sections 2, 3, 4). Verified by `node tools/rel_check.mjs`.
//
// EXPORTS
//   FRIEND_TRACK   [{ id, label, min, needs?, unlocks[] }]   the friendship track. `min` = social rel points (the meter that exists today).
//   ROMANCE_TRACK  [{ id, label, min, needs?, unlocks[] }]   the romance track. `min` = warmth points (`ro`, new, 0..100).
//   ROMANCE_RULES  the decisions (one partner, bosses, family, jealousy, age, endings) as data the engine reads.
//   WARMTH         where warmth comes from and how fast.
//   VERBS_NEW      Verb[]  context verbs added on top of dialogue.js VERBS (same panel). Shape below.
//   UNLOCKS        { [unlockId]: what it is }   every id named in a track's `unlocks`.
//   PACING         the pacing plan as numbers and rules.
//   REL_MOODLETS   { [id]: { name, desc, mood, minutes } }
//   TOKENS         text tokens.
//
// VERB  { id, label, track: 'friend' | 'romance', min: a stage id of that track, when: string[] (machine conditions, all must hold),
//         offered: plain words (when the button shows), reads: what it looks at, outcome: what happens, cooldownH,
//         you: string[] (what the player says), ok: string[] (generic replies), soft: string[] (the gentle "not now" replies) }
//   A person may override `ok` / `soft` for a verb in rel_people.js (PEOPLE[id].verbs). A verb never fails harshly.
// =============================================================================

export const FRIEND_TRACK = [
  { id: 'stranger', label: 'Stranger', min: 0, unlocks: ['v_introduce_self'] },
  { id: 'acquaintance', label: 'Acquaintance', min: 15, unlocks: ['waves', 'texts_light', 'v_ask_thing'] },
  { id: 'friend', label: 'Friend', min: 40, unlocks: ['vignettes', 'texts', 'invites_from_them', 'v_catch_up', 'v_walk', 'v_share_meal', 'v_plus_one', 'v_cook_for', 'v_advice', 'v_news', 'v_lean', 'v_show_me', 'gift_notes'] },
  { id: 'close', label: 'Close Friend', min: 75, unlocks: ['spare_keys', 'drop_in', 'favours_big', 'v_introduce', 'stand_with_you', 'page'] },
  { id: 'confidant', label: 'Confidant', min: 75, needs: 'arc_done', unlocks: ['standing_date', 'confidant_lines'] },
];

export const ROMANCE_TRACK = [
  { id: 'none', label: '', min: 0, unlocks: [] },
  { id: 'spark', label: 'Something There', min: 1, needs: 'open_to + (two warm flirts | a match in Porchlight | v_say_it)', unlocks: ['v_ask_out', 'texts_spark', 'coffee_date'] },
  { id: 'dating', label: 'Dating', min: 12, needs: 'first_date', unlocks: ['all_dates', 'v_hand', 'v_kiss', 'heart_1', 'texts_dating', 'plus_one_romance', 'cook_together'] },
  { id: 'exclusive', label: 'Together', min: 35, needs: 'heart_1 + steady', unlocks: ['heart_2', 'texts_exclusive', 'sleepover', 'family_notices', 'porchlight_paused'] },
  { id: 'partner', label: 'Partner', min: 55, needs: 'heart_2 + partner', unlocks: ['heart_3', 'keys', 'move_in', 'sunday_dinner_seat', 'texts_partner', 'v_stay_in'] },
  { id: 'engaged', label: 'Engaged', min: 85, needs: 'heart_3 + 28 days as partners + proposal', unlocks: ['wedding_plans', 'texts_engaged'] },
  { id: 'married', label: 'Married', min: 85, needs: 'wedding', unlocks: ['married_beats', 'anniversary', 'texts_married'] },
];

export const ROMANCE_RULES = {
  onePartner: 'Dating (before "Together") may be with more than one person, and nobody is hurt by it: Porchlight says "seeing people" on your card. "Together" and everything after is one person at a time; choosing it offers each other person you are dating a kind closing word (KIND.letdown), written, never skipped.',
  jealousy: 'None. No meter, no scenes, no punishments. People are told the truth and behave like adults.',
  openTo: 'The player sets who they are open to in Porchlight (women / men / nonbinary people, any mix) and can change it any time. Every romanceable is open to the player whoever the player is.',
  family: ['jules', 'theo', 'pip', 'milo', 'nana', 'dez', 'dad'],
  never: 'Family, anyone under 21, and anyone whose cast group is family are never offered a romance verb. The romanceables are the ten in rel_people.js and nobody else.',
  boss: 'If the person is the boss of the job the player holds now (cast.js JOBS / jobs CASTS boss), a romance track cannot START: the person says their `bossLine` once and the verbs stay away. A track that began before the job goes on, and the workplace second signs the reviews (the line is in the person\'s `bossLine2`).',
  ageGap: 'The player is about 27. Celeste (45), Haru (47) and Barnaby (57) each raise the gap themselves, once, lightly, and then it is never a problem again.',
  noPrize: 'A stage needs warmth AND the person\'s heart scene for that stage. Gifts and flirting alone never carry anyone past Dating. If the player asks early the person says "not yet" kindly and says what is on their mind.',
  endings: 'Letting down (up to Dating) and breaking up (Together and after) are scenes the player starts, with three ways to say it, none cruel. Afterwards: the romance track closes, friendship drops by 8 (never below Friend), a 10-day quiet spell with no invitations from them, then they are a friend again with their own "after" lines. Nobody leaves town, nobody stops serving you coffee.',
  again: 'A closed track can reopen after 28 days if the player asks (v_say_it); the person remembers (`mem:tried_before`).',
  kit: 'Kit and Fenn keep the old light flirt as banter, with no track behind it (see the owner questions).',
  marriedLife: 'After the wedding nothing is taken away: dates, the heart scenes as memories, two anniversary beats a year, and the partner\'s small bits change to the `married` pools.',
  children: 'Not now (BIBLE update 5).',
};

export const WARMTH = {
  flirtOk: 2, dateFine: 4, dateLovely: 6, dateOneForTheBooks: 8, heartScene: 6, giftLoved: 2, cookedTheirFavourite: 3, plusOne: 3, kiss: 1, stayIn: 1,
  dailyCap: 8,                 /* from verbs and gifts; dates and scenes are outside the cap */
  decay: 0,                    /* warmth and friendship never decay. A long gap only switches the small bits to the `gap` pools. */
  lateForDate: -1, stoodUp: -4, /* the only negatives; both come with a kind text and a way to make it right (rel_dates.js REPAIR) */
};

export const UNLOCKS = {
  v_introduce_self: 'The existing first-meeting verbs.',
  waves: 'They greet you first when you pass (SMALL wave bits).',
  texts_light: 'An occasional text (one in three days at most).',
  v_ask_thing: 'Verb: ask about the thing they mentioned (VERBS_NEW ask_thing).',
  vignettes: 'Their vignette arc can begin (ARCS).',
  texts: 'Texts at the normal small-bit rate.',
  invites_from_them: 'They invite you out (the existing inviteFrom), now with a reason from their week.',
  v_catch_up: 'Verb: catch up.', v_walk: 'Verb: walk with me.', v_share_meal: 'Verb: share what you cooked.', v_plus_one: 'Verb: bring them along to an event or a show.',
  v_cook_for: 'Verb: have them round for dinner; you cook.', v_advice: 'Verb: ask what they think.', v_news: 'Verb: tell them your news.', v_lean: 'Verb: tell them it has been a hard day.',
  v_show_me: 'Verb: ask them to show you their craft (a little skill xp, once a week).',
  gift_notes: 'A loved gift is remembered and mentioned later (GIFT_NOTES).',
  spare_keys: 'Trade spare keys: they can water the plants, take in a parcel, be at yours when you get home.',
  drop_in: 'They may drop in at home (never before 09:00 or after 21:00, never two days running).',
  favours_big: 'The existing close-tier favours, plus feed the cat / hold a delivery / a lift home from the airport.',
  v_introduce: 'Verb: introduce two friends who are in the same place.',
  stand_with_you: 'They can stand up with you at a wedding.',
  page: 'They hand you an order slip: a page for the book (PAGES).',
  standing_date: 'A standing weekly thing with them appears in My Day ideas (their arc\'s `standing`).',
  confidant_lines: 'The `confidant` small-bit pools.',
  v_ask_out: 'Verb: ask on a date.', texts_spark: 'The `spark` small-bit pools.', coffee_date: 'The date types marked minStage spark.',
  all_dates: 'Every date type.', v_hand: 'Verb: take their hand.', v_kiss: 'Verb: kiss.', heart_1: 'Their first heart scene.',
  texts_dating: 'The `dating` pools.', plus_one_romance: 'They ask YOU along to things.', cook_together: 'The cook-together date at your home.',
  heart_2: 'Their second heart scene.', texts_exclusive: 'The `exclusive` pools.', sleepover: 'They may stay the night (their routine starts from your door next morning).',
  family_notices: 'The family has opinions (FAMILY_NOTICES).', porchlight_paused: 'Porchlight offers to pause your card.',
  heart_3: 'Their third heart scene.', keys: 'The key exchange scene.', move_in: 'Verb: ask them to move in.', sunday_dinner_seat: 'They are asked to Sunday dinner at Nora\'s (a line in the existing moment).',
  texts_partner: 'The `partner` pools.', v_stay_in: 'Verb: stay in tonight.',
  wedding_plans: 'The wedding planner card in My Day (WEDDING.plan).', texts_engaged: 'The `engaged` texts.',
  married_beats: 'Their married-life scenes.', anniversary: 'A yearly idea in My Day on the wedding date and on the first-date date.', texts_married: 'The `married` pools.',
};

const V = (id, label, track, min, when, offered, reads, outcome, cooldownH, you, ok, soft) => ({ id, label, track, min, when, offered, reads, outcome, cooldownH, you, ok, soft: soft || [] });

export const VERBS_NEW = [
  /* ---- friendship ---- */
  V('ask_thing', 'Ask about {thing}', 'friend', 'acquaintance', ['thread:open'], 'When their last vignette, date or text left a thread open ("How did the recital go?").',
    'The `ask` pair of the last scene played with them, or the newest unanswered `mem:` they hold.', 'They answer with that scene\'s reply. +3 friendship, +Social. The thread closes.', 0,
    ['I meant to ask. {thing}', 'Hey. {thing}'], ['You remembered. Sit down, this takes a minute.', 'I was hoping somebody would ask.']),
  V('catch_up', 'Catch up', 'friend', 'friend', ['gap:5'], 'When you have not spoken for five days or more.',
    'Days since the last talk; what the player did meanwhile (job, home, Chapter).', 'A longer exchange: they tell one thing, ask one thing. +4 friendship, big Social. No reproach, ever.', 24,
    ['It has been a minute. Tell me everything.', 'Where have I been? Where have YOU been?'], ['Oh, good. I had a list. I lost the list. Sit.', 'There you are. Start with the best bit.']),
  V('walk_with', 'Walk with me', 'friend', 'friend', ['outdoors', 'npc:free:30'], 'Outdoors, when they have half an hour before their next place.',
    'Their routine; where the player is headed (the arrow).', 'They walk beside you for a few blocks or to your arrow\'s end, with ambient lines. +2 friendship, +Outdoors.', 6,
    ['Which way are you headed? Walk with me.', 'Keep me company as far as the corner?'], ['As far as the corner. Then the corner after.', 'Go on. I was only going to stand here.'], ['I can\'t, I\'m due somewhere. Ask me again tomorrow.']),
  V('share_meal', 'Share what you cooked', 'friend', 'friend', ['has:cooked_dish'], 'When there is a home-cooked dish in your backpack.',
    'The dish against their `likes.recipes` and the food topic.', 'They eat it with you. A liked recipe: +4 and it is remembered (mem:cooked_for). Any other: +2.', 20,
    ['I made too much. That is a lie. I made it for you.', 'Try this. Be honest. Not too honest.'], ['You MADE this? Sit down, we\'re sharing it.', 'Hand it over. I\'m not proud.']),
  V('cook_for', 'Have them round for dinner', 'friend', 'friend', ['home:kitchen'], 'Any time; you pick an evening and it lands on My Day.',
    'Their routine for a free evening; their `likes.recipes`.', 'A hosted visit (the existing home visit) where you cook and they sit at your table. Their favourite: a line they only say then.', 48,
    ['Come to mine this week. I\'ll cook. I own plates now.', 'Dinner at my place? I am cooking, so bring courage.'], ['Yes. Tell me the day and what not to bring.', 'I never say no to somebody else\'s cooking.'], ['This week is a mess. Next week, and I mean it.']),
  V('plus_one', 'Come with me to {event}', 'friend', 'friend', ['event:within:2'], 'When a show, a game or a city event is on within two days.',
    'Their routine at that hour; `likes.outings`.', 'They meet you there (My Day: "With a friend"). A liked outing: +4. On the romance track it counts as a date.', 24,
    ['{event} is on. I have a spare ticket and no company.', 'Come to {event} with me. I don\'t want to clap alone.'], ['Go on, then. I\'ll meet you outside.', 'I was going to pretend I was busy. I\'m not. Yes.'], ['I can\'t that night. Tell me how it was.']),
  V('advice', 'Ask what they think', 'friend', 'friend', ['player:deciding'], 'When you have something open: a job offer, a home you are looking at, a date tomorrow, a Chapter choice just made.',
    'Which decision is open; their `advice` lines by kind (work, home, heart, family).', 'Their view, in their voice. No effect on the decision. +2 friendship.', 24,
    ['Can I ask you something? I\'m in two minds.', 'You\'re sensible. What would you do?'], ['I have an opinion. I always have an opinion.', 'Tell me both sides and I\'ll tell you which one you already picked.']),
  V('news', 'Tell them your news', 'friend', 'friend', ['news:fresh'], 'Within two days of a promotion, a move, a finished Chapter, a new partner, an engagement.',
    'The news kind; whether they heard it already (the family tells each other within a day).', 'Once per piece of news per person. +3 friendship; family and close friends answer with their own line (SMALL `news`).', 0,
    ['Guess what. Go on, guess.', 'I have news and you\'re the first to hear it. Fourth. You\'re fourth.'], ['Look at you! Say it again, slower.', 'I knew it. I didn\'t know it. But I\'m not surprised.']),
  V('lean', 'Tell them it has been a hard day', 'friend', 'friend', ['mood:low'], 'When your mood is low.',
    'Which need is lowest (tired, hungry, lonely); their nature.', 'They do one small practical thing in character (a seat, a tea, a walk). Clears a little of the low moodlet. They remember (mem:leaned).', 24,
    ['Honestly? Today has been a lot.', 'I\'m all right. I\'m not, actually.'], ['Then stop being all right for five minutes. Sit.', 'Thank you for saying. Most people say "fine".']),
  V('show_me', 'Ask them to show you', 'friend', 'friend', ['npc:atwork|npc:athobby'], 'At their work or their pastime, once a week.',
    'Their `craft` (the skill they teach).', 'A two-minute lesson: a little xp in their skill, one line of real advice about it.', 168,
    ['Show me how you do that. Slowly.', 'I\'ve watched you do that a hundred times. Teach me?'], ['Watch my hands, not my face.', 'All right. First thing: you\'re holding it wrong. Everybody is.']),
  V('introduce', 'Introduce them to {other}', 'friend', 'close', ['two:present'], 'When two of your friends who have not met are in the same place.',
    'Both people\'s topics for something in common.', 'Sets `knows:<a>:<b>`. Later small bits mention each other; the two may turn up together.', 0,
    ['You two should know each other. I\'ll wait.', '{other}, this is the one I keep telling you about.'], ['Oh, YOU\'RE the one. I\'ve heard things. Good things.', 'Any friend of this one has survived a lot. Hello.']),
  V('swap_keys', 'Trade spare keys', 'friend', 'close', ['!keys'], 'Once, at Close Friend.',
    'Nothing.', 'Unlocks spare_keys and drop_in. They say their own line (PEOPLE[id].keyLine).', 0,
    ['Here. My spare. For plants and emergencies.', 'Would you hold a key for me? You\'re the sensible one.'], ['A key. That\'s a promotion. I\'ll guard it badly but faithfully.', 'Then you get mine. It sticks. Lift and turn.']),
  /* ---- romance ---- */
  V('say_it', 'Say how you feel', 'romance', 'none', ['fr:40', 'open_to', '!boss'], 'With a romanceable who is at least a Friend, when no track is open. The honest road; flirting is the playful one.',
    'Friendship, whether they are seeing someone seriously, `mem:tried_before`.', 'Opens the track at Something There, or a kind "give me a little while" (ask again after a week). Never a flat no at Friend or above.', 168,
    ['Can I say something that might make coffee awkward?', 'I like you. Not in a general way.'], ['Oh. Good. I was working up to that for a month.', 'Say it again. I want to be sure I heard it right.'], ['Give me a little while with that. It\'s not a no.']),
  V('ask_out', 'Ask on a date', 'romance', 'spark', ['npc:reachable'], 'In person or by text, at Something There and after.',
    'Their free evenings; the date types open at this stage; what you have done together before.', 'A date picker (type, day, time) that lands on My Day for both of you.', 20,
    ['Are you free this week? As in, with me. On purpose.', 'I\'d like to take you somewhere. You pick, or I do.'], ['Yes. Before you change your mind: yes.', 'On purpose? Then I\'ll wear the good jacket.'], ['Not this week. Ask me on Sunday, I\'ll know my days.']),
  V('hand', 'Take their hand', 'romance', 'dating', ['walking:together'], 'While the two of you are walking somewhere.',
    'Nothing.', 'You walk hand in hand until you arrive. +1 warmth, once a day. A person-specific line the first time.', 12,
    ['*You take their hand. Nobody mentions it.*'], ['*They hold on. A little tighter at the kerb.*', '*A squeeze. Two, in fact.*']),
  V('kiss', 'Kiss', 'romance', 'dating', ['!atwork'], 'After a first date that went well; never while they are working.',
    'The place (not at their counter).', '+1 warmth once a day; a moodlet the first time.', 12,
    ['*You lean in.*'], ['*They meet you halfway.*', '*It is brief and it is exactly right.*'], ['Later. I\'m at work and Mrs. Moss is looking.']),
  V('define', 'Ask where this is going', 'romance', 'dating', ['ro:35'], 'At Dating, when the warmth is there.',
    'Whether their first heart scene has been played.', 'Their `steady` scene (you become Together), or "not yet" with a hint at what is on their mind.', 72,
    ['What are we, do you think? I have a preference.', 'I\'ve stopped wanting to see anyone else. Thought you should know.'], [], ['Soon. There\'s a thing I want to tell you first.']),
  V('ask_partner', 'Ask to be partners', 'romance', 'exclusive', ['ro:55'], 'At Together.',
    'Their second heart scene.', 'Their `partner` scene.', 72,
    ['I keep saying "the person I\'m seeing". I\'d like a shorter word.'], [], ['Ask me after the weekend. I want to say it properly.']),
  V('offer_key', 'Offer a key', 'romance', 'partner', ['!keys'], 'At Partner.',
    'Nothing.', 'Their `keys` scene. Unlocks sleepovers either way and their drop-ins.', 0,
    ['I had a key cut. It\'s not a big thing. It\'s a medium thing.'], [], []),
  V('ask_move_in', 'Ask them to move in', 'romance', 'partner', ['ro:75', 'days:14'], 'Two weeks after becoming partners, when warmth is high.',
    'Their third heart scene; the size of your home (a Tiny home gets a line about it).', 'Their `movein` scene; then the live-in routine (rel_romance.js LIVEIN).', 168,
    ['Half your things are here already. Bring the other half.'], [], ['I want to. Let me sort one thing out first.']),
  V('propose', 'Propose', 'romance', 'partner', ['ro:85', 'days:28'], 'Four weeks after becoming partners. Anywhere; a place that matters to them is noticed.',
    'The place (their `likes.places`), the season, whether a family member is near.', 'Their `proposal` scene. They say yes: nobody asks until the track says so.', 0,
    ['*You take a breath.*'], [], ['Not yet. Ask me when {thing} is behind me. I want to say yes with my whole head.']),
  V('stay_in', 'Stay in tonight', 'romance', 'partner', ['home', 'time:evening'], 'At home in the evening with a partner there.',
    'What is in the house (a TV, a record player, books, a stove).', 'An evening together: one of cook, watch, read, records. Fun, Social, Comfort; a LIVEIN evening line.', 20,
    ['Let\'s not go anywhere.'], ['Best offer I\'ve had all day.', 'I\'ll get the blanket. You get the argument about what to watch.']),
  V('miss_you', 'Say you missed them', 'romance', 'dating', ['gap:4'], 'After four days apart.',
    'Days apart.', '+2 warmth. Their `missed` line.', 96,
    ['I missed you. There, I said it first.'], ['Good. I was going to say it and then hate myself.', 'It was four days. It felt longer. Don\'t tell anyone.']),
  V('just_friends', 'Say you would rather be friends', 'romance', 'spark', [], 'At Something There or Dating.',
    'Nothing.', 'Their `kind.letdown` scene. The track closes; see ROMANCE_RULES.endings.', 0, [], [], []),
  V('end_it', 'End things, kindly', 'romance', 'exclusive', [], 'At Together and after. Asks "Are you sure?" once, plainly.',
    'Whether you live together (then they move back over two days; their things are never lost).', 'Their `kind.breakup` scene.', 0, [], [], []),
];

export const PACING = {
  smallPerDay: [2, 4],            /* small bits a day (texts + waves + remembered details), all people together; 2 on a work day with a Chapter open */
  textsPerDay: 3,                 /* of which texts: at most 3, at most 1 per person, never between 21:30 and 07:30 */
  textGapMin: 90,                 /* game minutes between two relationship texts */
  wavesPerDay: 4,                 /* street greetings never count as interruptions: they are bubbles, no notification */
  sceneEvery: [2, 4],             /* a deep scene (vignette / heart scene / milestone) is OFFERED every 2 to 4 days, all arcs together */
  scenesOfferedAtOnce: 2,         /* invitations waiting unanswered; a third is held back until one is played or set aside */
  sceneCooldownAfter: 1,          /* after playing any deep scene, none is offered until the next morning */
  arcGapDays: 3,                  /* default days between two scenes of one arc (a scene's when.days overrides) */
  perPersonGapDays: 2,            /* one person never invites you twice in two days, across arcs, dates and jobs */
  activeArcs: 3,                  /* friend / family arcs moving at once; the rest wait their turn (those with the highest friendship first) */
  romanceArcs: 2,                 /* romance tracks that offer heart scenes at once */
  yieldOrder: ['chapter', 'work_shift', 'booked', 'family_moment', 'date', 'job_beat', 'vignette', 'opportunity', 'small'],
  yields: {
    chapter: 'On the day a Chapter is begun no deep scene is offered and texts drop to 1. The morning after a Chapter: nothing but one family text about it.',
    family_moment: 'A family moment (Sunday dinner, the Kettle Corner, a festival moment) is never shared with a vignette of the same person on the same day.',
    job_beat: 'An off-shift job beat and a vignette are never both offered on one day; the job beat goes first (it was earned at work), the vignette the day after.',
    opportunity: 'On a day a deep scene is offered, the Opportunity pool offers one fewer.',
    date: 'A date the player booked counts as that day\'s deep scene.',
    myDay: 'Invitations are IDEAS with the person\'s name and face ("Dez, by the tram shed, any evening"), never pre-added. Accepting puts them on the schedule as "With a friend" / "Family" / "A date".',
  },
  never: 'Nothing expires. A scene set aside ("Not today") comes back as an idea after 3 days with no second notification. A person never says "you never call".',
  firstWeek: 'Days 1-5 (Act One): no vignettes, no Porchlight notice; only waves and at most one text a day. Porchlight appears in the app store from day 4 and is mentioned once by Dez.',
  smallMix: 'Of the day\'s small bits: at least one from family once Chapter 3 is done, at most half from one person, a partner at most two.',
  quiet: 'Settings > More > "Fewer messages" halves smallPerDay and textsPerDay.',
};

export const REL_MOODLETS = {
  rel_butterflies: { name: 'Butterflies', desc: 'You have a date coming, or you just had one. Hard to say which is worse. Better. Which is better.', mood: 8, minutes: 480 },
  rel_held: { name: 'Somebody Has You', desc: 'You told someone it was a hard day and they did not flinch.', mood: 6, minutes: 360 },
  rel_tender: { name: 'Let In', desc: 'Someone told you a true thing today. You are carrying it carefully.', mood: 6, minutes: 480 },
  rel_laugh: { name: 'Laughed Until It Hurt', desc: 'You do not remember what started it. That is how you know it was good.', mood: 7, minutes: 300 },
  rel_home: { name: 'Two Toothbrushes', desc: 'Somebody else\'s coat is on your hook. The flat sounds different.', mood: 8, minutes: 720 },
  rel_glow: { name: 'Just Married', desc: 'There is confetti in your shoe. Leave it.', mood: 12, minutes: 2880 },
  rel_quiet: { name: 'A Kind Ending', desc: 'It was the right thing and it was done gently. It still aches a bit. That is allowed.', mood: -3, minutes: 720 },
};

export const TOKENS = {
  '{name}': "the player's name",
  '{title}': 'what Pip and Milo call the player (the Chapters\' token; chosen in Chapter 3). Only used under done:ch03.',
  '{thing}': 'in VERBS_NEW only: the open thread\'s question (ask_thing), or the thing the person is waiting on (propose soft line).',
  '{event}': 'in VERBS_NEW only: the event or show name.',
  '{other}': 'in VERBS_NEW only: the other friend\'s short name.',
  '{partner}': 'the short name of the player\'s partner (wedding and family lines only).',
  '{place}': 'the wedding venue\'s name (WEDDING only).',
};
