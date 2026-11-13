// =============================================================================
// Maple Bay — DIALOGUE  (src/story/dialogue.js)
// Pure data for the social system. All speech-bubble lines are <= 90 chars.
// Tokens usable in any line: {name} player name, {npc} the NPC's short name,
// {venue} venue sign name, {district} district display name, {gift} gift item name.
//
// EXPORTS
//   RELATIONSHIP_TIERS  [{ id, label, min, max }]
//       Relationship is 0..100 points per NPC. Tier ids are used everywhere:
//       'stranger' (0) < 'acquaintance' (1) < 'friend' (2) < 'close' (3).
//       Family members (cast group 'family') start at 40 (friend) and additionally
//       unlock the 'family' line pools at every tier. Kit starts at 20 (acquaintance).
//   STARTING_RELATIONSHIP  { [npcId]: points }  everyone not listed starts at 0.
//
//   VERBS  Verb[]   the interaction menu, in display order.
//     id           string
//     label        string   menu text
//     minTier      tier id required for the verb to appear
//     requires     optional extra gate: 'flirtable' (cast.flirtable) | 'hasGift' | 'atHome'
//                  | 'notFamily'
//     cooldownMin  game minutes before the same verb can be used on the same NPC again
//     baseChance   0..1 success chance before modifiers
//     factors      { likedBy: trait[], dislikedBy: trait[], mood: number, tierBonus: number }
//                  +0.15 per matching likedBy trait, -0.15 per dislikedBy trait;
//                  mood: weight of the PLAYER's mood/needs (0 = irrelevant, 1 = strong) —
//                  a tired, hungry, grubby player fails more; tierBonus: + per tier above min.
//     delta        { success, fail }  relationship points
//     needs        { social, fun }    change to PLAYER needs on success (fail gives half social)
//     playerLines  string[]  what the player says (pick one)
//     success      string[]  NPC replies on success
//     fail         string[]  NPC replies on failure (always gentle, never mean)
//     outcome      optional string naming a system hook on success:
//                  'openGiftPicker' | 'createHangout' | 'createVisit' | 'grantFavor' | 'endTalk'
//   GIFT_REACTIONS  { loved, liked, neutral, disliked }  each { delta, lines[] }
//       loved = item in npc.likes.gifts, disliked = in npc.dislikes.gifts, liked = same
//       venue/category heuristics (programmer's call), neutral = everything else.
//   FAVORS   [{ id, minTier, ask, yes, no, effect }]  what "ask a favor" can grant.
//
//   NPC_LINES  { [npcId]: { stranger?, acquaintance?, friend?, close?, family? : string[] } }
//       Unique chat lines per NPC, used as the reply to 'chat' / 'ask about day' or as
//       idle bubbles when the player is near. Pick from the pool matching the current tier
//       (falling back to lower tiers). 'family' pools mix in at any tier for family.
//
//   AMBIENT   pools of anonymous-citizen bubbles. Each sub-pool is an array of strings.
//       AMBIENT.district[districtId]         AMBIENT.timeOfDay[morning|midday|evening|night]
//       AMBIENT.weather[sunny|cloudy|rain|fog|wind|snow|heat]
//       AMBIENT.season[spring|summer|autumn|winter]
//       AMBIENT.events[eventId]              (ids listed in the object)
//       AMBIENT.venue[queue|eating|cafe|workout|shopping|library|bar|cinema|transit]
//       AMBIENT.reactions[greeting|bump|wave|running|carrying|late_night|friendly_stranger]
//
//   LORE_TOPICS  [{ id, title, tags, lines[], askedOf }]  small-talk about the city.
//       tags     topics from cast.TOPICS (an NPC who likes the tag enjoys the topic)
//       lines    things any citizen may say about it
//       askedOf  { [npcId]: string }  a special line from someone who knows more.
// =============================================================================

export const RELATIONSHIP_TIERS = [
  { id: 'stranger',     label: 'Stranger',     min: 0,  max: 14 },
  { id: 'acquaintance', label: 'Acquaintance', min: 15, max: 39 },
  { id: 'friend',       label: 'Friend',       min: 40, max: 74 },
  { id: 'close',        label: 'Close Friend', min: 75, max: 100 },
];

export const STARTING_RELATIONSHIP = {
  jules: 55, nana: 60, theo: 40, pip: 40, milo: 40, dez: 45, kit: 20,
};

export const VERBS = [
  {
    id: 'chat', label: 'Chat', minTier: 'stranger', cooldownMin: 20, baseChance: 0.85,
    factors: { likedBy: ['chatty', 'warm', 'cheerful'], dislikedBy: ['stoic', 'shy'], mood: 0.3, tierBonus: 0.05 },
    delta: { success: 2, fail: 0 }, needs: { social: 12, fun: 3 },
    playerLines: [
      'So, what\'s good around here?',
      'Nice day for it, whatever "it" is.',
      'I\'m still learning my way around. Any tips?',
      'How long have you lived in Maple Bay?',
      'I keep getting lost. In a nice way.',
      'Is it always this pretty, or did I get lucky?',
    ],
    success: [
      'Oh, you\'ll love it here. Give it a week. Then a year.',
      'Ha! Stick around, it only gets odder.',
      'Tip one: follow the smell of bread. Tip two: see tip one.',
      'Long enough that the gulls know my lunch break.',
      'Getting lost is how you find the good bits.',
      'You got lucky. But so did the rest of us.',
    ],
    fail: [
      'Mm. Sorry, head full of errands today.',
      'Ah, catch me another time? I\'m mid-thought.',
      'Hm? Oh. Yes. Lovely. Anyway.',
    ],
  },
  {
    id: 'joke', label: 'Tell a joke', minTier: 'stranger', cooldownMin: 45, baseChance: 0.6,
    factors: { likedBy: ['witty', 'playful', 'cheerful', 'mischievous'], dislikedBy: ['proud', 'perfectionist', 'stoic'], mood: 0.5, tierBonus: 0.08 },
    delta: { success: 4, fail: -1 }, needs: { social: 10, fun: 10 },
    playerLines: [
      'Why did the gull cross the road? It was the fry-stand side.',
      'I asked the lighthouse for directions. It was very bright.',
      'The train was on time today. I checked for other miracles.',
      'I tried the ramen challenge. The ramen won.',
      'My apartment is so small the mice are hunched over.',
      'I told my fridge a joke. It was empty inside too.',
    ],
    success: [
      'Ha! Okay. Okay, that got me.',
      'Oh, that\'s terrible. Tell it again.',
      'Pfft. You have been saving that one, huh?',
      'I\'m stealing that. It\'s mine now.',
      'Stop, I just had my coffee. It nearly left by the nose.',
    ],
    fail: [
      '...Was that the end? Oh. Ha. Yes.',
      'I\'ll laugh later. In private. Probably.',
      'Hm. The gulls have better material, friend.',
      'Bold. Not funny. But bold.',
    ],
  },
  {
    id: 'compliment', label: 'Compliment', minTier: 'stranger', cooldownMin: 60, baseChance: 0.75,
    factors: { likedBy: ['proud', 'warm', 'artistic', 'romantic'], dislikedBy: ['grumpy', 'stoic'], mood: 0.4, tierBonus: 0.05 },
    delta: { success: 3, fail: 0 }, needs: { social: 10, fun: 2 },
    playerLines: [
      'You always look like you know where you\'re going.',
      'I like your style. It\'s very Maple Bay.',
      'You have a great laugh, you know.',
      'You make this place feel friendlier.',
      'Whatever you\'re doing, it\'s working.',
    ],
    success: [
      'Oh! Well. That\'s my whole day made, thank you.',
      'Stop it. Actually, don\'t stop. Go on.',
      'You\'re too kind. Correctly kind, but too kind.',
      'I\'m writing that down for a rainy day.',
      'Well, now I have to live up to it.',
    ],
    fail: [
      'Hm. What are you after?',
      'That is... nice of you. I think. Anyway.',
      'Ha. You need glasses. But thank you.',
    ],
  },
  {
    id: 'ask_day', label: 'Ask about their day', minTier: 'stranger', cooldownMin: 120, baseChance: 0.9,
    factors: { likedBy: ['warm', 'chatty', 'gentle'], dislikedBy: [], mood: 0.1, tierBonus: 0.03 },
    delta: { success: 3, fail: 0 }, needs: { social: 14, fun: 2 },
    playerLines: [
      'How is your day going?',
      'Busy one today?',
      'You look like you have had a day. Good or bad?',
      'What has the Bay thrown at you today?',
    ],
    success: [
      'Better now someone has asked, honestly.',
      'Busy! But the good kind, where the time goes missing.',
      'A gull stole my sandwich. Otherwise, perfect.',
      'Slow. I like slow. Slow has snacks.',
      'Long. But the sunset is free, so we\'re even.',
      'You know, nobody asks. It was good. Thank you.',
    ],
    fail: [
      'Oh, you know. A day. It had hours in it.',
      'Ask me after I have eaten.',
    ],
  },
  {
    id: 'deep_talk', label: 'Deep talk', minTier: 'friend', cooldownMin: 240, baseChance: 0.65,
    factors: { likedBy: ['dreamy', 'bookish', 'gentle', 'romantic', 'calm'], dislikedBy: ['energetic', 'mischievous', 'practical'], mood: 0.6, tierBonus: 0.12 },
    delta: { success: 7, fail: -1 }, needs: { social: 25, fun: 5 },
    playerLines: [
      'Do you ever wonder where you would be if you had not come here?',
      'What did you want to be, when you were small?',
      'I moved here to start over. Did you ever start over?',
      'What\'s the thing you\'re proudest of that nobody knows?',
      'Do you think a place can change a person?',
    ],
    success: [
      'All the time. But I always end up glad about the answer.',
      'A lighthouse keeper. Honestly, it\'s still on the list.',
      'Twice. The second time took. I think yours will too.',
      'Hm. I\'ll tell you. But you have to tell me yours after.',
      'I think a place just gives you room. The rest is you.',
      'Nobody has asked me that in years. Sit. This will take a while.',
    ],
    fail: [
      'Oof. Big question for a small afternoon.',
      'Ask me again by the water sometime. Not here.',
      'Ha. You first. ...No? Then me neither.',
    ],
  },
  {
    id: 'gossip', label: 'Gossip about the city', minTier: 'acquaintance', cooldownMin: 90, baseChance: 0.7,
    factors: { likedBy: ['nosy', 'chatty', 'mischievous', 'witty'], dislikedBy: ['calm', 'stoic', 'shy'], mood: 0.2, tierBonus: 0.08 },
    delta: { success: 4, fail: -2 }, needs: { social: 14, fun: 8 },
    playerLines: [
      'So. What\'s the news? The real news.',
      'I heard something about the lighthouse. Is it true?',
      'Who actually is Finch, of Hartwell & Finch?',
      'Is it true the food critic eats at the diner in secret?',
      'What\'s everyone not telling the new person?',
    ],
    success: [
      'You didn\'t hear it from me, but the gull at the Gilded Gull has a tab.',
      'Oh, sit down. Sit DOWN. It\'s a good one this week.',
      'Nobody has seen Finch since the nineties. I think he\'s a cat.',
      'Mondays, back booth, hat pulled low. Everybody knows. Nobody says.',
      'The lighthouse blinks twice on Fridays. Nobody will say why.',
      'Somebody keeps knitting scarves for the statues. I have suspects.',
    ],
    fail: [
      'Oh, I don\'t really keep up with all that.',
      'I\'d rather not say. Walls have ears. So do pigeons.',
      'Hm. Not my business. Nor yours, strictly.',
    ],
  },
  {
    id: 'flirt', label: 'Flirt', minTier: 'friend', requires: 'flirtable', cooldownMin: 180, baseChance: 0.55,
    factors: { likedBy: ['romantic', 'playful', 'witty'], dislikedBy: ['shy', 'practical'], mood: 0.7, tierBonus: 0.12 },
    delta: { success: 5, fail: -2 }, needs: { social: 15, fun: 12 },
    playerLines: [
      'I was having a good day and then you made it better.',
      'Do you come here often, or is it just my lucky week?',
      'You know, the city is nicer with you standing in it.',
      'I had a clever line ready. Then you smiled and I lost it.',
    ],
    success: [
      'Oh. Well. Now I\'m going to be smiling at nothing all day.',
      'Smooth. Very smooth. ...Say another one.',
      'Careful. I blush in a very obvious way.',
      'Ha! You\'re trouble. The good kind.',
      'I was hoping you would say something like that.',
    ],
    fail: [
      'Ha, you\'re sweet. Really. Friends is good though, yes?',
      'Oh! Um. That\'s kind. I\'m going to look at this wall now.',
      'Aw. No. But ten out of ten for bravery.',
    ],
  },
  {
    id: 'give_gift', label: 'Give a gift', minTier: 'acquaintance', requires: 'hasGift', cooldownMin: 1440, baseChance: 1,
    factors: { likedBy: [], dislikedBy: [], mood: 0, tierBonus: 0 },
    delta: { success: 0, fail: 0 }, needs: { social: 10, fun: 5 },
    playerLines: [
      'I saw this and thought of you.',
      'Here. It\'s a small thing.',
      'I got you something. Don\'t make it weird.',
      'For you. No occasion. Just because.',
    ],
    success: [], fail: [],
    outcome: 'openGiftPicker',
  },
  {
    id: 'invite_hangout', label: 'Invite to hang out', minTier: 'acquaintance', cooldownMin: 720, baseChance: 0.6,
    factors: { likedBy: ['cheerful', 'energetic', 'playful', 'chatty'], dislikedBy: ['shy', 'grumpy'], mood: 0.3, tierBonus: 0.15 },
    delta: { success: 3, fail: 0 }, needs: { social: 8, fun: 5 },
    playerLines: [
      'Want to grab a bite sometime? My treat. Probably.',
      'We should hang out properly. Are you free later?',
      'I\'m going to {venue} later. Come along?',
      'I owe you a coffee. Shall we make it official?',
    ],
    success: [
      'Yes! I thought you would never ask. Message me the when.',
      'Oh, I\'d like that. Put it in my phone before I forget.',
      'Sure! Fair warning, I order dessert first.',
      'It\'s a plan. A real one. I\'ll even be on time.',
    ],
    fail: [
      'Ah, this week is a mess. Ask me again soon?',
      'I wish I could! Rain check? I honor my rain checks.',
      'Not today, but don\'t stop asking.',
    ],
    outcome: 'createHangout',
  },
  {
    id: 'invite_over', label: 'Invite over', minTier: 'friend', cooldownMin: 1440, baseChance: 0.6,
    factors: { likedBy: ['warm', 'curious', 'nosy', 'generous'], dislikedBy: ['shy', 'stubborn'], mood: 0.4, tierBonus: 0.15 },
    delta: { success: 4, fail: 0 }, needs: { social: 8, fun: 5 },
    playerLines: [
      'Come round to mine sometime. I own two whole mugs now.',
      'You should see the place. It\'s small but it\'s trying.',
      'I\'m cooking tonight. Risky, but there will be a lot of it.',
      'Come over? I finally unpacked the last box. Nearly.',
    ],
    success: [
      'I\'d love to. I\'ll bring something. Don\'t argue.',
      'Finally! I\'ve been dying to see the place.',
      'Yes. I\'ll bring dessert in case the cooking goes wrong.',
      'Say the time and I\'m there. I\'m nosy about apartments.',
    ],
    fail: [
      'Oh, not tonight, I\'m flattened. Soon, though?',
      'Can we do next week? I want to be good company for it.',
      'I can\'t today. Keep a mug free for me.',
    ],
    outcome: 'createVisit',
  },
  {
    id: 'ask_favor', label: 'Ask a favor', minTier: 'friend', cooldownMin: 2880, baseChance: 0.55,
    factors: { likedBy: ['generous', 'warm', 'gentle'], dislikedBy: ['grumpy', 'proud', 'stubborn'], mood: 0.2, tierBonus: 0.2 },
    delta: { success: -2, fail: -3 }, needs: { social: 4, fun: 0 },
    playerLines: [
      'Could I ask you a small favor?',
      'I hate to ask, but I\'m in a bit of a pickle.',
      'You wouldn\'t happen to be feeling generous today?',
      'Tiny favor. Microscopic. You\'ll barely notice.',
    ],
    success: [
      'For you? Of course. Don\'t make it a habit. Or do.',
      'Go on, then. You would do the same for me.',
      'Say no more. Actually, say a bit more. Then yes.',
      'That\'s what friends are for. And for pie. Mostly pie.',
    ],
    fail: [
      'Ooh. Not this time, I\'m stretched thin myself.',
      'I\'d if I could. I cannot, so I\'ll not. Sorry!',
      'Ask me again when I have slept.',
    ],
    outcome: 'grantFavor',
  },
  {
    id: 'goodbye', label: 'Say goodbye', minTier: 'stranger', cooldownMin: 0, baseChance: 1,
    factors: { likedBy: [], dislikedBy: [], mood: 0, tierBonus: 0 },
    delta: { success: 0, fail: 0 }, needs: { social: 0, fun: 0 },
    playerLines: [
      'I should get going. See you around!',
      'Right, back to it. Take care!',
      'Lovely chatting. Until next time.',
      'I\'ll let you go. Bye for now!',
    ],
    success: [
      'See you around! Mind the gulls.',
      'Take care of yourself. And eat something.',
      'Bye for now! Don\'t be a stranger.',
      'Off you go. The Bay isn\'t going anywhere.',
      'Until next time. It was nice, this.',
      'So long! Say hello to your Nana for me.',
    ],
    fail: [],
    outcome: 'endTalk',
  },
];

export const GIFT_REACTIONS = {
  loved: {
    delta: 10,
    lines: [
      'Oh! How did you know? No, really, who told you?',
      '{gift}! My favorite. You have been paying attention.',
      'I\'m keeping this forever. Or until I use it. Then the memory.',
      'Stop it. This is perfect. You\'re perfect. Stop it.',
      'Well, now you have done it. I\'m properly touched.',
    ],
  },
  liked: {
    delta: 5,
    lines: [
      'Oh, that\'s lovely. Thank you!',
      'For me? You didn\'t have to. I\'m glad you did.',
      'How thoughtful. This will go to good use.',
      'Aw. You remembered I exist. That\'s the real gift.',
    ],
  },
  neutral: {
    delta: 2,
    lines: [
      'Oh! A {gift}. Thank you. That is... a {gift}.',
      'How nice. I\'ll find a place for it.',
      'Thank you! It\'s the thought, and it\'s a nice thought.',
    ],
  },
  disliked: {
    delta: -2,
    lines: [
      'Ah. A {gift}. You... really should not have.',
      'Oh! Hm. I know someone who will love this.',
      'Thank you. I\'ll put it somewhere very safe. And far.',
    ],
  },
};

export const FAVORS = [
  { id: 'small_loan',   minTier: 'friend', ask: 'Could you spot me a little until payday?',
    yes: 'Here. Pay me back in dinner.', no: 'I\'m broke myself this week, sorry.', effect: { money: 30 } },
  { id: 'leftovers',    minTier: 'friend', ask: 'I don\'t suppose you have any food going spare?',
    yes: 'Say no more. Take this, and this. And this.', no: 'Cupboards are bare, I\'m afraid.', effect: { item: 'home_cooked_meal' } },
  { id: 'lift',         minTier: 'friend', ask: 'Any chance of a ride across town?',
    yes: 'Hop in. Shotgun picks the radio.', no: 'No wheels today. The train isn\'t bad, though.', effect: { freeRide: 1 } },
  { id: 'water_plants', minTier: 'friend', ask: 'Would you water my plants while I\'m at work?',
    yes: 'Consider them watered. I\'ll sing to them too.', no: 'I kill plants by looking at them. Best not.', effect: { flag: 'plants_watered' } },
  { id: 'good_word',    minTier: 'close',  ask: 'Would you put in a good word for me at work?',
    yes: 'Already did. I may have overdone it. You invented soup.', no: 'I would, but they don\'t listen to me there.', effect: { jobPerformance: 10 } },
  { id: 'cover_shift',  minTier: 'close',  ask: 'Could you cover for me if I\'m late tomorrow?',
    yes: 'I never saw you. You were here the whole time.', no: 'I can\'t fib to save my life. Set two alarms.', effect: { flag: 'late_forgiven' } },
];

// ---------------------------------------------------------------------------
// PER-NPC UNIQUE LINES
// ---------------------------------------------------------------------------
export const NPC_LINES = {
  jules: {
    friend: [
      'I told my whole class you moved here. You\'re famous in third grade.',
      'Do you have enough plates? Blankets? I have spare everything.',
      'Theo is building a birdhouse. The birds aren\'t optimistic.',
      'I grade papers on the porch swing. Come by and distract me.',
    ],
    close: [
      'When you got off that plane I cried in the teachers\' lounge. A bit.',
      'I was scared you would hate it here. Silly. Look at you.',
      'You\'re better with Milo than anyone. He talks to you.',
      'Some days I miss the Copper Kettle more than I let on.',
    ],
    family: [
      'Remember when you ate Nana\'s whole pie and blamed the dog?',
      'We didn\'t have a dog. That was the flaw in your plan.',
      'You still fold towels wrong. I love you. But wrong.',
      'Mom would have liked your apartment. She would have moved a chair.',
    ],
  },
  nana: {
    friend: [
      'The secret to pastry is cold hands and a warm kitchen.',
      'I knew this street when the tram still rang past the door.',
      'Roz at the bakery learned her knots from me. She ties them better.',
      'Never trust a quiet kettle or a loud man.',
    ],
    close: [
      'Thirty-one years I ran the Kettle. I can still hear the door bell.',
      'Your grandfather proposed over my lemon tart. He liked the tart.',
      'I worry Jules thinks I am cross with her. I never was. Not once.',
      'You came here for a fresh start. I have been hoping for one too.',
    ],
    family: [
      'You had these same cheeks at four. I have photographs. Many.',
      'Take a jar home. No, two. You have a fridge now, fill it.',
      'I lit a candle the day your plane landed. And baked. Mostly baked.',
      'Call your sister. She worries. She gets it from me.',
    ],
  },
  kit: {
    acquaintance: [
      'It\'s so strange seeing you with a grown-up face.',
      'I still have the mixtape you made me. The tape, not a player.',
      'Do you remember Mr. Hobbs? He comes to the Heron. Tips well!',
    ],
    friend: [
      'I have forty half-songs. Finishing is the scary part.',
      'Lou says I mumble my best lines. He\'s annoyingly right.',
      'I painted the heron on the mural wall. Left wing is wonky. Don\'t look.',
      'The loft is cold but the light at four p.m. is worth it.',
    ],
    close: [
      'I nearly left Maple Bay last year. Glad I dawdled.',
      'You always clapped loudest at school. I could pick it out.',
      'When I sing I look for one face. Lately it\'s yours. No pressure.',
      'New rule: we don\'t lose each other again. Sign here.',
    ],
  },
  theo: {
    friend: [
      'Jules hasn\'t stopped smiling since you landed. It\'s unsettling.',
      'I build furniture to relax. The furniture doesn\'t relax.',
      'If you ever want a house, come see me. I do the boring bit kindly.',
    ],
    close: [
      'I never had a sibling. I\'m borrowing you, if that\'s all right.',
      'Jules still keeps the Kettle\'s old menu in her sock drawer.',
    ],
    family: [
      'Sunday roast is a standing invitation. Sitting, technically.',
      'The kids ask about you at bedtime. It\'s a top-three topic.',
    ],
  },
  pip: {
    friend: [
      'I am president of Garden Club and treasurer of Book Club.',
      'Did you know the lighthouse has one hundred and twelve steps?',
      'I am writing a newspaper. You can be in it if you do something.',
    ],
    close: [
      'When I am mayor you can have a job. A medium one.',
      'I told my teacher you are brave for moving. Mom is my teacher.',
    ],
    family: [
      'Nana says you were noisy as a baby. I have it in my notes.',
      'Milo likes you. He does not say it. I am saying it for him.',
    ],
  },
  milo: {
    friend: [
      'Trains are just long land dinosaurs.',
      'I found a snail. His name is Speed.',
      'The lighthouse is the tallest. I checked from the car.',
    ],
    close: [
      'This drawing is for your fridge. Mom says you have one now.',
      'If you get scared at night you can borrow my triceratops.',
    ],
    family: [
      'Nana\'s house smells like yes.',
      'You are in my family picture. You are the one waving.',
    ],
  },
  dez: {
    friend: [
      'Fastest delivery on record? Mine. Eleven minutes, Hillcrest stairs.',
      'Rhonda says I ride like a dropped tray. Compliment, I think.',
      'Need to learn the city? Follow me for a day. Bring lungs.',
    ],
    close: [
      'Glad you\'re here, cuz. The family felt a size too small.',
      'Don\'t tell Nana I fell in the harbor. Twice.',
    ],
    family: [
      'Nana still pinches my cheeks. I\'m twenty-four. I allow it.',
      'Family dinner means Jules cooks, Theo carves, I eat.',
    ],
  },
  marlow: {
    stranger: ['First cup is half price for new faces. I just made that up. Enjoy.'],
    acquaintance: ['I roast on Sundays. The whole street smells like a good idea.', 'The name? My first shop closed. This one is the "gone" part done right.'],
    friend: ['I\'m working on a maple latte. Don\'t tell anyone until it\'s good.'],
    close: ['I learn every regular\'s order. Yours I learned first.'],
  },
  priya: {
    stranger: ['Bags are by the till. Carry the eggs on top. Always the eggs on top.'],
    acquaintance: ['Tuesdays the produce comes in. Wednesdays the bargains go out.', 'A full fridge is a calm mind. That\'s free advice.'],
    friend: ['My mother ran a spice stall. I run nine aisles. She isn\'t impressed.'],
    close: ['I keep a list of who buys what. Yours says "learning to cook". Proud.'],
  },
  mr_oh: {
    stranger: ['We have everything. If we don\'t have it, you don\'t need it.'],
    acquaintance: ['The lucky cat? Waving since 1994. Arm has never tired.', 'The lemonade boy pays me rent in lemons. Fair deal.'],
    friend: ['I listen to every baseball game. We always lose. I still listen.'],
    close: ['You shop late, like me. Night people must look out for each other.'],
  },
  roz: {
    stranger: ['Take a sample! Go on. The tray is heavy and you\'re helping.'],
    acquaintance: ['These ovens are older than me. They came with the Copper Kettle.', 'Your Nana taught me to bake when I was all elbows and attitude.'],
    friend: ['I still use Bea\'s rolling pin. Don\'t tell her. She knows.'],
    close: ['When the Kettle closed I cried into the flour. Made good bread.'],
  },
  dot: {
    stranger: ['Menu is on the wall. Pie is on the counter. Decide fast.'],
    acquaintance: ['Been here forty years. Outlasted three mayors and a jukebox.', 'The trains rattle the cups at ten past. That\'s how I know the time.'],
    friend: ['I act grumpy so folks tip out of fear. Don\'t blow my cover.'],
    close: ['You sit in my late husband\'s booth. He would have liked you there.'],
  },
  haru: {
    stranger: ['No menu. Tell me how your day was. I will choose.'],
    acquaintance: ['Fish market at dawn. Best part of the day. Nobody is talking yet.', 'The lantern outside is lit when the broth is ready. Not before.'],
    friend: ['I came to Maple Bay for one summer. That was nineteen years ago.'],
    close: ['Tonight I try a new recipe. You taste first. This is an honor. Probably.'],
  },
  nico: {
    stranger: ['First rule: no pineapple debate before noon. After noon, I fight.'],
    acquaintance: ['My nonna says I talk too much to be a good cook. She\'s half right.', 'Students pay in coins. I count them like treasure.'],
    friend: ['I\'m in love with someone new every week. This week: the oven.'],
    close: ['One day my own place, by the harbor. You get table one. Forever.'],
  },
  celeste: {
    stranger: ['The gull on the sign is gilded. The one on the railing is merely rude.'],
    acquaintance: ['A good table is like a good chair by the fire. One must earn it.', 'Mr. Quill is in tonight. We pretend we have not noticed. He likes that.'],
    friend: ['I began as a dishwasher in Marseille. I tell no one. So. Now you.'],
    close: ['After closing I eat fries on the pier. With my shoes off. Ruinous.'],
  },
  tasha: {
    stranger: ['No mirrors on the east wall. That wall is for trying, not looking.'],
    acquaintance: ['I rowed for the country once. Now I row for breakfast.', 'Saturday class is free for first-timers. Bring water and excuses.'],
    friend: ['Truth? I hate burpees. Everyone does. That\'s why they work.'],
    close: ['I opened this place so nobody would feel small in a gym. Keep that.'],
  },
  imani: {
    stranger: ['Everything here has a story. Some of the stories are just "sale".'],
    acquaintance: ['I dress half the city. The other half, I\'m working on.', 'Your grandmother? Best posture in Old Town. I notice these things.'],
    friend: ['I sew the costumes for the Maple Festival parade. Top secret. Sequins.'],
    close: ['I keep a sketch of an outfit for you. For when you\'re ready.'],
  },
  felix: {
    stranger: ['The floor lamps are, um, on the floor. Where the lamps are.'],
    acquaintance: ['I can fix most things. Not people. Toasters, though. Good at toasters.', 'Honestly, wait for the sale. I didn\'t say that. It\'s Thursday.'],
    friend: ['I\'m building a robot that waters plants. It has watered the cat twice.'],
    close: ['You\'re the first person I don\'t rehearse sentences for.'],
  },
  ambrose: {
    stranger: ['Browse as long as you like. The chairs are for exactly that.'],
    acquaintance: ['The cat is called Chapter. He is on his eleventh.', 'I keep a shelf of books nobody buys. I love them most.'],
    friend: ['Your grandmother brought me scones every Saturday for thirty years.'],
    close: ['I write poems on the backs of receipts. Check yours sometime.'],
  },
  ines: {
    stranger: ['A library card is the most powerful card in your wallet.'],
    acquaintance: ['Jobs board is on the upstairs computers. Print costs one coin.', 'We have a ghost in Local History. Very quiet. Model patron.'],
    friend: ['I read the last page first. Do not tell the book club.'],
    close: ['I keep a list of people who return books early. It is short. You are on it.'],
  },
  margaret: {
    stranger: ['We analyse things here. Do not ask what. It is on your desk.'],
    acquaintance: ['I built this firm from one desk and a borrowed stapler.', 'Finch handles the long-term view. Very long-term. He is in a drawer.'],
    friend: ['I run the Hillcrest stairs every Sunday. Nobody at work must know I sweat.'],
    close: ['I was new here once. Someone was kind. I am passing it along. Quietly.'],
  },
  samira: {
    stranger: ['Have you registered with us? Good to do it before you sneeze.'],
    acquaintance: ['Sleep, water, vegetables. I charge nothing for the classics.', 'I walk the pier after shift. The sea takes the day off my shoulders.'],
    friend: ['The lollipops are for kids. And for me, on double shifts.'],
    close: ['Nursing is mostly listening. You\'re good at it. I have noticed.'],
  },
  lou: {
    stranger: ['The heron on the sign? Drew it on a napkin. The napkin is framed.'],
    acquaintance: ['I played drums in nineteen countries. Best crowd is still Friday here.', 'Kit has a voice like warm rain. Don\'t tell her I said so.'],
    friend: ['A bar is just a living room that pays its own rent. On good months.'],
    close: ['When I hang up the towel, I want the Heron to go to someone who cares.'],
  },
  vera: {
    stranger: ['We show one film at a time. As it should be.'],
    acquaintance: ['Monday is classics night. Half price if you gasp at the right bit.', 'The velvet seats are original. So are some of the stains. History!'],
    friend: ['I met my husband in row F. He was in my seat. He stayed there forty years.'],
    close: ['When the lights go down, everyone is seventeen again. I just run the lamp.'],
  },
  rhonda: {
    stranger: ['Packages in by nine go out by noon. Packages in by noon, we\'ll see.'],
    acquaintance: ['I know every address in this city and half the door codes.', 'Your cousin Dez? Good kid. Rides like he\'s being chased by geese.'],
    friend: ['I started on the bikes. My knees filed a complaint. Now I do radio.'],
    close: ['You want the truth of a city? Read its packages. Lot of love in the mail.'],
  },
  gus: {
    stranger: ['Yellow line. Stay behind it.'],
    acquaintance: ['Ships come. Ships go. Cats stay.', 'Pier 7 was my father\'s pier. His father\'s too.'],
    friend: ['The kitten is called Bosun. He is in charge. I just carry him.'],
    close: ['Do not say much. Never did. But I notice who shows up. You show up.'],
  },
  walt: {
    stranger: ['Trash goes out Thursday. Recycling is the blue one. It\'s always the blue one.'],
    acquaintance: ['Building is ninety years old. So are the pipes. Be patient with them.', 'Mr. Pike downstairs will talk your ear off. Let him. He\'s good value.'],
    friend: ['I complain about the tenants. Truth is, the place is too quiet without them.'],
    close: ['Left a spare key under... no. I won\'t say. But there\'s one. For you.'],
  },
  manny: {
    stranger: ['Twenty-six years driving and I\'ve never used the same route twice. Lie.'],
    acquaintance: ['My cousin runs the fish stall, my other cousin the ferry desk. I got cousins.', 'You want the real Bay? Ride at dawn. The whole city is yawning.'],
    friend: ['I remember everyone I pick up from the airport. You had the hopeful suitcase.'],
    close: ['I should charge you for the therapy, not the ride. Ha! Get in.'],
  },
  noor: {
    stranger: ['The walls are thin. I know because I heard you sneeze. Bless you.'],
    acquaintance: ['I\'m writing my thesis on harbor work songs. It\'s mostly "heave".', 'If you hear the same eight bars forty times, I\'m sorry. It\'s a hard eight.'],
    friend: ['I left a jar of dal by your door. It isn\'t a bribe. It\'s a little bit a bribe.'],
    close: ['I was lonely in this building until your boxes arrived.'],
  },
  gordon: {
    stranger: ['The No. 9 ran from the harbor to Hillcrest. Twenty-two minutes. Never late.'],
    acquaintance: ['They stopped the trams in ninety-one. I kept the bell. And the hat.', 'That viaduct train is fine. No bell, though. A train should have a bell.'],
    friend: ['Your Nana rode my tram every morning. Always had a bun for the conductor.'],
    close: ['When the No. 9 runs again, you ring the bell. I have decided.'],
  },
  fenn: {
    stranger: ['Tips are welcome. Smiles also. Smiles don\'t buy soup, though.'],
    acquaintance: ['I came for a weekend. The weekend has been two years long.', 'Best acoustics in town: under the viaduct at Arts Quarter. Free reverb.'],
    friend: ['I write a song for every station. Railyard is the sad one.'],
    close: ['You\'re the first person here who asked my name before my song.'],
  },
  captain: {
    stranger: ['See the lighthouse? Blinked me home four thousand times. I counted.'],
    acquaintance: ['The ferry was called the Marigold. Handled like a bathtub. Loved her.', 'A gull is just a sailor who never came ashore. That is a fact.'],
    friend: ['Your grandmother sent pies out to the ferry crew. Storm or shine.'],
    close: ['I do not fish. I sit with a rod so nobody asks why I am sitting.'],
  },
  vik: {
    stranger: ['Chess is conversation without the small talk. So. Pawn?'],
    acquaintance: ['I taught math for forty years. Half this city owes me homework.', 'The maple above us drops a leaf when someone blunders. Watch.'],
    friend: ['My wife beat me every game for thirty years. I am still practicing.'],
    close: ['I say I let nobody win. Last Tuesday I let you. Tell no one.'],
  },
  tav: {
    stranger: ['Riverside loop is four miles! Or one, if you turn back. No shame!'],
    acquaintance: ['Hartwell seems scary. She is. But fair. But scary.', 'I track my sleep, steps and sandwiches. The sandwiches are trending up.'],
    friend: ['Honestly? I just like being outside before the emails wake up.'],
    close: ['I signed us both up for the Maple Bay Half. Surprise! We can walk it.'],
  },
  barnaby: {
    stranger: ['I never reveal a rating before print. But I will raise one eyebrow.'],
    acquaintance: ['The Gull is excellent. The Lantern is honest. Honest wins, some nights.', 'A croissant should shatter. If it bends, send it back to school.'],
    friend: ['Mondays at Dot\'s are off the record. A man must have one unreviewed joy.'],
    close: ['My first review was of my mother\'s stew. Two stars. She has not forgotten.'],
  },
  otis: {
    stranger: ['Fresh squeezed. By me. I have very clean hands, I checked.'],
    acquaintance: ['Mr. Oh lets me use the corner. I pay in lemons and good behaviour.', 'Summer is my busy season. Winter I pivot to hot lemonade.'],
    friend: ['Pip is my business rival. Also my best friend. It\'s complicated.'],
    close: ['I put your picture on the stand. "Customer of the Month". Every month.'],
  },
  birdie: {
    stranger: ['People say pigeons are plain. People aren\'t looking properly.'],
    acquaintance: ['Gerald only has one good foot. Finest gentleman I know.', 'The birds see everything, dear. The mayor\'s hat? A wig. They told me.'],
    friend: ['I was a telephone operator for forty years. I miss connecting people.'],
    close: ['I leave seed on your windowsill, dear. So you wake to company.'],
  },
};

// ---------------------------------------------------------------------------
// AMBIENT POOLS (anonymous citizens)
// ---------------------------------------------------------------------------
export const AMBIENT = {
  district: {
    downtown: [
      'Third coffee, second meeting, first deep breath.',
      'They wash those tower windows every week. Brave souls.',
      'Meet me under the Central clock. Everyone meets under the clock.',
      'I only came downtown for socks. That was four shops ago.',
      'City Hall says the fountain will be fixed "soon". Since spring.',
      'Lunch at my desk again. The pigeons get the better view.',
    ],
    oldtown: [
      'Mind the cobbles. They have claimed many a heel.',
      'Smell that? Rise & Shine. My willpower never stood a chance.',
      'Lantern Row at dusk. Best time. Best smells.',
      'My grandma lived on this street. So did hers.',
      'They say every door on Thimble Street is a different blue.',
      'Market Street on a Saturday. Elbows out, basket ready.',
    ],
    harbor: [
      'Fresh catch! Well, fresh this morning. Fresh-ish.',
      'Hold onto your fries. The gulls work in teams.',
      'You can set your watch by the lighthouse. If your watch is slow.',
      'Salt in the air, sand in my shoes. Worth it.',
      'The ferry is late. The ferry is always fashionably late.',
      'Pier 7 never sleeps. Pier 6 naps a little.',
    ],
    hillcrest: [
      'Two hundred steps to my front door. I have calves like a goat.',
      'You can see the whole bay from here. And my laundry, sadly.',
      'The view is free. The houses are not.',
      'Up here the fog comes to visit you personally.',
      'I carried a sofa up these stairs once. Once.',
    ],
    maplewood: [
      'Somebody on Sycamore Lane is baking. I\'m going to walk slowly.',
      'The school bell means the lemonade stand opens in ten.',
      'Garden club has a waiting list. For a garden club!',
      'Leaves everywhere. That\'s the "maple" and the "wood" for you.',
      'Mr. Oh had my newspaper ready before I asked. Every day.',
      'Kids on bikes. Slow down, look both ways, wave.',
    ],
    arts: [
      'New mural on Easel Lane. I think it\'s a fish. Or grief.',
      'Somebody is practicing trumpet. Bravely.',
      'I came for the library and stayed for the pizza.',
      'Open mic at the Heron tonight. Bring earplugs or bring a poem.',
      'The Orpheum is showing a black-and-white one. Date night sorted.',
      'Students everywhere. I remember having that much hope and no socks.',
    ],
    railyard: [
      'The ten-past freight shakes my fillings. Reliable, though.',
      'Dot\'s does a breakfast that sees you through to Thursday.',
      'My package is "out for delivery". So am I, frankly.',
      'They say the old tram is still in the shed. Asleep, not gone.',
      'It isn\'t pretty down here, but it works. Like me.',
    ],
    park: [
      'The ducks expect payment. In bread. In advance.',
      'Shh. The chess men are thinking.',
      'Best bench is the one by the pond. I got here at seven for it.',
      'Three laps of the river path and I have earned a pastry. Two pastries.',
      'That maple is older than the city. It has seen things.',
      'Picnic! Somebody remembered the blanket. Nobody remembered forks.',
    ],
    airport: [
      'Every time a plane lands I wonder who\'s starting over.',
      'I\'m picking up my aunt. She packs like she\'s moving in.',
      'Arrivals is the happiest door in the city.',
      'Somewhere in there\'s my suitcase. I believe in it.',
      'Taxi rank is on the left. Manny is the one who\'s talking.',
    ],
  },
  timeOfDay: {
    morning: [
      'Morning! Is it? It is. Morning!',
      'Don\'t talk to me until the coffee kicks in. Hello, though.',
      'The bakery line is out the door. Good sign.',
      'First train is the quiet one. Everyone is still dreaming.',
      'I love the city before it has had its breakfast.',
      'Running late. Walking late, technically.',
      'The gulls are up early. Suspiciously early.',
      'Paper says sun. My knee says rain. I trust the knee.',
      'Is it too early for pie? Asking for me.',
      'Shop shutters going up. Best sound of the day.',
    ],
    midday: [
      'Lunch o\'clock. My favorite o\'clock.',
      'Every bench is taken. Sandwich on the move, then.',
      'Half the day gone and I\'ve done one thing. A good thing, though.',
      'The line at the Lantern is round the corner. Worth it.',
      'Sun is right overhead. I have no shadow. Spooky.',
      'I said a quick lunch. That was an hour ago.',
      'Midday bells! Old Town still does them properly.',
      'Just nipping out for a bit of sky.',
      'Soup or sandwich. The eternal question.',
      'If you need me I\'ll be horizontal in the park.',
    ],
    evening: [
      'Look at that sky. Somebody spilled the peaches.',
      'Home time. The best time. No offence to work.',
      'Lanterns are coming on. I love that bit.',
      'What\'s for dinner? No, really, I\'m asking you.',
      'Evening train is all yawns and shopping bags.',
      'One quick drink at the Heron. Famous last words.',
      'The whole street smells like other people\'s dinners.',
      'Long day. Good day. Feet disagree.',
      'Lighthouse just came on. Evening, old friend.',
      'I\'m going to sit on my step and watch nothing happen. Bliss.',
    ],
    night: [
      'Quiet tonight. You can hear the harbor from here.',
      'Last train soon. I\'m not running. I might run.',
      'Should be asleep. The moon had other ideas.',
      'Night shift. The city is all mine and the cats\'.',
      'Lucky Corner is still open. Lucky me.',
      'Stars are out. Well, four of them. City stars.',
      'You\'re up late! So am I. No judgment.',
      'The lighthouse and I are the only ones awake.',
      'Midnight snack run. Don\'t tell my doctor.',
      'Everything looks softer after dark, huh?',
    ],
  },
  weather: {
    sunny: [
      'Not a cloud! I don\'t trust it, but I love it.',
      'Sunglasses weather. I look mysterious. Do I look mysterious?',
      'Ice cream for lunch is legal on days like this.',
      'Every café table in the city is taken. Rightly so.',
      'I\'m photosynthesising. Don\'t disturb.',
      'The bay is all sparkles today.',
    ],
    cloudy: [
      'Gray sky, good light. The painters will be out.',
      'It\'s thinking about raining. Just thinking.',
      'Cardigan weather. The best weather.',
      'Cloudy with a chance of soup.',
      'The sky has pulled the blanket over its head.',
      'Bring a umbrella. Don\'t need it. That\'s the law.',
    ],
    rain: [
      'Lovely weather for ducks. And umbrella salesmen.',
      'I own six umbrellas. All of them are at home.',
      'Puddle! Jump it or own it.',
      'The cobbles shine like fish when it rains.',
      'Good day to be a ramen shop.',
      'Rain on the train roof. Best sound for a nap.',
      'My socks have given up. I respect their decision.',
    ],
    fog: [
      'Can\'t see the lighthouse. It can see us, though.',
      'The Bay has gone and put its bathrobe on.',
      'Foghorn woke me at five. Hello to you too, harbor.',
      'I walked past my own door twice.',
      'Everything is a secret in the fog.',
      'Hillcrest has vanished again. It comes back. Usually.',
    ],
    wind: [
      'Hold onto your hat! I did not. That was my hat.',
      'The wind is coming straight off the bay with opinions.',
      'Good kite day. Bad newspaper day.',
      'My hair has gone ahead without me.',
      'Even the gulls are flying backwards.',
      'Leaning into it. This is how I walk now.',
    ],
    snow: [
      'First flake landed on my nose. I made a wish.',
      'The whole city has gone quiet under it.',
      'Snow on the tram lines. Looks like sugar.',
      'Careful on the Hillcrest stairs. I took them sitting down.',
      'Cocoa. Immediately. This isn\'t a request.',
      'Somebody built a snow gull on the pier. It\'s very good.',
    ],
    heat: [
      'Too hot. I\'m moving into the frozen aisle at FreshWay.',
      'The sidewalk is cooking. Don\'t test it. I tested it.',
      'Lemonade stand has a line of grown adults.',
      'Even the pigeons are walking slowly.',
      'I\'m one big freckle today.',
      'The fountain isn\'t for paddling. I\'m paddling.',
    ],
  },
  season: {
    spring: [
      'Blossom on the cobbles. Like confetti with nowhere to be.',
      'The ducklings are out. Guard your heart.',
      'Spring cleaning. I found a sandwich from winter.',
      'First day without a coat. I feel reckless.',
      'Garden plots are waking up. So are the slugs.',
      'Everything smells green. Is that a smell? It\'s today.',
      'Window boxes are back. Old Town looks like a cake.',
      'Rain, sun, rain, sun. Spring can\'t make up its mind.',
      'New leaves on the big maple. Right on schedule.',
      'I always fall a little in love in spring. Usually with a pastry.',
    ],
    summer: [
      'Long light, late dinners. Summer in the Bay.',
      'The pier is all sunburn and ice cream.',
      'Swimming off the breakwater later. Cold but glorious.',
      'I haven\'t worn socks in a week.',
      'School Summer Fair soon. I\'m guessing the cake weight. Again.',
      'Open windows, somebody\'s radio, perfect.',
      'The sunset takes about an hour to finish these days.',
      'Tomatoes from the garden. I\'m rich.',
      'Everyone is slightly kinder in summer. Have you noticed?',
      'Fireflies in the park! Or phones. No, fireflies!',
    ],
    autumn: [
      'This is our season. The whole city turns maple.',
      'Crunchy leaves. I go out of my way to step on them.',
      'Maple Festival soon! I\'ve been practicing my pie face.',
      'Scarf is back. I missed you, scarf.',
      'The hills look like they\'re on fire, in a nice way.',
      'Soup season has officially opened.',
      'Maple syrup on everything. It\'s basically the law.',
      'The light goes gold at four. Poets, to your stations.',
      'Somebody raked the park into a leaf pile. It won\'t last.',
      'First fog of the year. Autumn is clearing its throat.',
    ],
    winter: [
      'Breath like a steam train this morning.',
      'Lantern Night soon. The whole of Old Town glows.',
      'I can see the fairy lights on Hillcrest from here.',
      'Mittens. On strings. I\'m not ashamed.',
      'The harbor steams when it\'s this cold. Magic.',
      'Hot chestnuts on Market Street. That smell is my childhood.',
      'Dark by five. Cozy by six.',
      'The lighthouse works overtime in winter.',
      'My radiator sings. Not well.',
      'Everyone walks closer together in winter. It\'s nice.',
    ],
  },
  events: {
    maple_festival: [
      'Happy Maple Festival! Have you tried the syrup taffy?',
      'The parade is coming down Market Street! I can hear the tuba.',
      'I entered the pie contest. I don\'t expect to beat Bea. Nobody does.',
      'Leaf crowns for everyone! Even the statues!',
      'Best day of the year. Fight me. Gently. It\'s a festival.',
      'They tap the big maple at noon. First cup goes to the youngest.',
    ],
    summer_fair: [
      'Guess the weight of the cake! I say eight pounds. It\'s always eight.',
      'The school fair! I have won a goldfish-shaped sponge.',
      'Three throws for a coin. I have spent eleven coins.',
      'The teachers are in the dunk tank. Justice.',
      'Whose pie is that? I need to shake their hand.',
    ],
    lantern_night: [
      'Mind your lantern near my scarf, hon.',
      'Every window in Old Town has a candle. Look.',
      'I wrote my wish on mine. Not telling.',
      'They float them out from the pier at nine. Don\'t be late.',
      'It\'s like the stars came down for a visit.',
    ],
    market_day: [
      'Market day! I came for eggs. I\'m leaving with a lamp.',
      'Try the cheese man. He gives samples if you look sad.',
      'Bargain of the day: three cabbages. I don\'t need three cabbages.',
      'Elbows in, everyone. There\'s plenty of jam.',
      'The busker is on fire today.',
    ],
    rush_hour: [
      'Excuse me, sorry, excuse me, sorry.',
      'If I miss this train I\'m simply moving to the platform.',
      'Everybody breathe in. Doors closing.',
      'Same faces every morning. We nod. It\'s a friendship.',
      'Somebody is eating toast on the platform. Living the dream.',
    ],
    gig_night: [
      'Who\'s playing tonight? Hope it\'s the girl with the teal hair.',
      'Lou says no talking during the slow ones.',
      'I only came for one song. That was two hours ago.',
      'Clap on two and four, people. Two and four.',
      'Shh, shh, this is my favorite bit.',
    ],
    fireworks: [
      'Ooooh.',
      'Aaaah.',
      'That one looked like a jellyfish! Do the jellyfish again!',
      'Best seat is the pier. Second best is somebody\'s shoulders.',
      'The gulls hate this. Serves them right for my fries.',
    ],
    first_snow: [
      'First snow! Everybody outside! Coats optional! No, coats needed!',
      'It\'s sticking! It\'s actually sticking!',
      'I caught one on my tongue. Tastes like sky.',
      'Snowball truce until I have had my coffee.',
      'The kids at Maplewood will be feral with joy.',
    ],
    train_delay: [
      'Delayed. "Leaves on the line." It\'s called Maple Bay, what did they expect?',
      'Ten minutes late. Time for a pastry. Silver linings.',
      'Mr. Pike says the tram was never late. He says it a lot.',
      'I shall simply stand here and become a statue.',
    ],
  },
  venue: {
    queue: [
      'Is this the line? It has the look of a line.',
      'After you. No, after you. We could be here all day.',
      'I know what I want. I\'ll panic at the counter anyway.',
      'That smells incredible. I\'m getting two.',
      'Worth the wait. It\'s always worth the wait here.',
      'Somebody at the front is paying in small coins. Bless them.',
    ],
    eating: [
      'Mmm. Don\'t talk to me. I\'m busy being happy.',
      'I said I\'d only have half. I lied.',
      'Compliments to the chef. And to me, for ordering it.',
      'Is it rude to lick the plate? Asking quietly.',
      'This tastes like a hug.',
      'One more bite and I\'ll have to be rolled home.',
    ],
    cafe: [
      'Oat flat white, please. And whatever that smell is.',
      'I come here to work. I have written one email.',
      'The corner seat is free! This is my lucky day.',
      'Marlow drew a little gull in my foam. I can\'t drink it now.',
      'Just five more minutes. The cup is still warm.',
    ],
    workout: [
      'One more rep. I said that three reps ago.',
      'I can\'t feel my legs. Coach says that is "progress".',
      'Do I look strong? I feel like soup.',
      'Whoever invented stairs machines has never met stairs.',
      'I came, I sweated, I\'m going for pancakes.',
    ],
    shopping: [
      'I only came in for milk.',
      'Does this look like me? Be honest. Kindly honest.',
      'It was on sale. So really I saved money.',
      'Where do they keep the, the thing. For the, you know.',
      'My basket is heavier than my wallet. Classic.',
    ],
    library: [
      '(whispering) Sorry. Is this seat taken?',
      '(whispering) Late fees. Eleven years. I\'m scared to ask.',
      '(whispering) The jobs board upstairs is actually good.',
      '(whispering) I love the smell in here. Paper and patience.',
      '(whispering) She shushed me with just her eyebrows.',
    ],
    bar: [
      'To Friday! Is it Friday? To whatever today is!',
      'Lou makes it strong. Sip, don\'t gulp.',
      'I\'m going to request a song. I\'m going to regret it.',
      'Best stools in the city. They spin just enough.',
      'Shh, she\'s about to sing.',
    ],
    cinema: [
      'I cried at the adverts. It\'s going to be a long night.',
      'Large popcorn. It\'s for sharing. With me.',
      'No spoilers! I\'ve waited all week!',
      'The seats here squeak in the romantic bits. Every time.',
    ],
    transit: [
      'Is this the Hillcrest train? It says Hillcrest. I trust nothing.',
      'I love the bit where the viaduct crosses the river.',
      'Window seat. Small victories.',
      'Next stop is mine. I always nearly miss it.',
      'You can see into everyone\'s kitchens from up here. Cozy.',
    ],
  },
  reactions: {
    greeting: [
      'Morning!',
      'Hello there!',
      'Hi! Nice day, huh?',
      'Oh, hello! You\'re new, right? Welcome!',
      'Hey, neighbor.',
      'Howdy.',
      'Afternoon! Take it easy.',
      'Hiya! Nice to see a friendly face.',
      'Evening. Off anywhere nice?',
      'Well, hello! I like your coat.',
    ],
    bump: [
      'Ope! Sorry! My fault. Or yours. Nobody\'s!',
      'Whoa there! Easy does it.',
      'Oh! Pardon me. Lost in thought.',
      'Careful, friend. Precious cargo. It\'s a croissant.',
      'Sorry! These sidewalks were built for thinner times.',
      'Oof. No harm done. Nice shoulder, though.',
      'Steady! In a hurry?',
    ],
    wave: [
      'Oh! Hello! Do I know you? I do now!',
      '(waves back with both hands)',
      'Hi! Yes! Hello!',
      'Aw. A waver. We need more wavers.',
      'Same to you!',
      '(tips hat)',
    ],
    running: [
      'Where is the fire?',
      'Late for the train? Left at the lamp post, it\'s quicker!',
      'Go on! You\'ll make it!',
      'Somebody is in a hurry.',
      'Run like the rent is due!',
    ],
    carrying: [
      'Big shop! Somebody is cooking tonight.',
      'Need a hand with those? No? Strong arms.',
      'Eggs on top, I hope!',
      'That\'s a lot of noodles. I respect it.',
      'Moving day? Welcome to the neighborhood!',
    ],
    late_night: [
      'You\'re out late. Get home safe, yes?',
      'Can\'t sleep either? Lucky Corner does a decent cocoa.',
      'Take care. The cats own the streets after midnight.',
      'Night owl, eh? We\'re a fine club.',
    ],
    friendly_stranger: [
      'I\'ve seen you around! You\'re settling in, I can tell.',
      'You\'re Bea\'s grandkid, right? You have the nose.',
      'First month in the Bay? It gets under your skin. Nicely.',
      'If you need anything, this street looks after its own.',
      'You look like you belong here. Took me years. You, weeks.',
      'Tell your sister the class play was wonderful.',
    ],
  },
};

// ---------------------------------------------------------------------------
// LORE SMALL-TALK
// ---------------------------------------------------------------------------
export const LORE_TOPICS = [
  {
    id: 'lighthouse', title: 'The Lighthouse', tags: ['sea', 'history'],
    lines: [
      'One hundred and twelve steps to the lamp. I counted once, puffing.',
      'It blinks twice on Fridays. Nobody at City Hall will explain.',
      'They call it Old Marigold, after the ferry. Or the other way round.',
      'On foggy nights the horn sounds like a very sad cow. I love it.',
    ],
    askedOf: {
      captain: 'Twice on Fridays? That\'s the keeper saying goodnight to his wife. Still.',
      gus: 'Sundays I check the door is locked. Nobody asked me to.',
      milo: 'It\'s the tallest. A giraffe is two. The lighthouse is six giraffes.',
    },
  },
  {
    id: 'old_tram', title: 'Tram No. 9', tags: ['trains', 'history'],
    lines: [
      'You can still see the tram rails on Market Street, between the cobbles.',
      'The last tram ran in ninety-one. Half the city rode it to the shed.',
      'People say No. 9 is still in the Railyard shed, under a tarp.',
      'The viaduct train is faster. The tram was friendlier. It had a bell.',
    ],
    askedOf: {
      gordon: 'Under a tarp? She\'s polished weekly! Come see her. Bring a rag.',
      nana: 'I rode it every morning. Gordon would hold the tram if I was late.',
      manny: 'Trams! Pah. Could a tram take you door to door? ...It was nice, though.',
    },
  },
  {
    id: 'maple_festival', title: 'The Maple Festival', tags: ['festival', 'food', 'history'],
    lines: [
      'Every autumn they tap the big maple in the park. First cup to the youngest.',
      'The pie contest gets serious. Friendships have been tested.',
      'Leaf crowns, a parade, and syrup on everything. Best day of the year.',
      'It started as a harvest supper on the pier. Now it shuts the whole city.',
    ],
    askedOf: {
      nana: 'I won the pie ribbon eleven years running. Then I judged. Fairer.',
      imani: 'I do the parade costumes. This year: more leaves. That\'s all I can say.',
      roz: 'I enter every year. Second place, every year. Bea trained me too well.',
    },
  },
  {
    id: 'copper_kettle', title: 'The Copper Kettle', tags: ['history', 'food', 'family'],
    lines: [
      'There used to be a tearoom where the bakery is. The Copper Kettle.',
      'Best lemon tart in the county, the Kettle. People still talk about it.',
      'There was a brass bell over the Kettle\'s door. You could hear it a street away.',
      'When the Kettle closed, half of Old Town turned up for the last pot.',
    ],
    askedOf: {
      roz: 'I kept her ovens and her corner table. Some things you don\'t replace.',
      ambrose: 'I have a photograph of the Kettle somewhere. Under a cat, probably.',
      dot: 'Bea and me, rivals for thirty years. I miss the competition.',
    },
  },
  {
    id: 'big_maple', title: 'The Big Maple', tags: ['history', 'gardening'],
    lines: [
      'The big maple in the park is older than the city. The bay is named for it.',
      'They say if a leaf lands on your head, you get a good week.',
      'Sailors used to steer by it, before the lighthouse. So they say.',
      'Every child in the Bay has climbed it. And been told not to.',
    ],
    askedOf: {
      vik: 'It drops a leaf on the board when someone blunders. The tree plays, too.',
      pip: 'It\'s two hundred and forty years old. I asked the council. Twice.',
    },
  },
  {
    id: 'finch', title: 'The Mystery of Finch', tags: ['gossip', 'work'],
    lines: [
      'Hartwell & Finch. Everybody has met Hartwell. Nobody has met Finch.',
      'I heard Finch is a parrot. Inherited half the firm.',
      'There\'s a door on the top floor marked "Finch". It has never been open.',
    ],
    askedOf: {
      margaret: 'Finch is on sabbatical. Since ninety-seven. He sends postcards. Blank ones.',
      tav: 'I saw the Finch door ajar once. There was a hat stand. With a hat!',
    },
  },
  {
    id: 'gilded_gull', title: 'The Gull at the Gull', tags: ['animals', 'food', 'gossip'],
    lines: [
      'There\'s one gull that sits at the Gilded Gull every night. Same railing.',
      'They call him the Maître G. He has stolen four lobsters.',
      'Tourists think the gull is part of the decor. He thinks so too.',
    ],
    askedOf: {
      celeste: 'We don\'t discuss him. He has been spoken to. He was unmoved.',
      barnaby: 'Honestly, his taste is impeccable. He only steals the specials.',
    },
  },
  {
    id: 'heron', title: 'The Blue Heron', tags: ['music', 'history'],
    lines: [
      'Everybody who\'s anybody played the Heron first. And a lot of nobodies. Bless them.',
      'Friday open mic. Anyone can sing. Not everyone should. All are clapped.',
      'There\'s a real heron on the river. People say it comes to listen.',
    ],
    askedOf: {
      lou: 'Bought it with my last tour money. Best bad decision I ever made.',
      kit: 'First time I sang there I forgot my own name. Lou clapped anyway.',
      fenn: 'One day I\'ll play inside the Heron. For now I play the sidewalk.',
    },
  },
  {
    id: 'hillcrest_stairs', title: 'The Hillcrest Stairs', tags: ['sports', 'history'],
    lines: [
      'Three hundred and one steps from the river to the lookout.',
      'There\'s a bench halfway up the stairs called Mercy.',
      'Courier record up the stairs is eleven minutes. With a package.',
    ],
    askedOf: {
      dez: 'Eleven minutes. With a lamp. A floor lamp. Ask Rhonda.',
      tasha: 'I do them twice on Sundays. Come with. Mercy bench is allowed. Once.',
    },
  },
  {
    id: 'lantern_night', title: 'Lantern Night', tags: ['festival', 'history', 'sea'],
    lines: [
      'In deep winter the whole city floats paper lanterns from the pier.',
      'You write a wish inside. If the lantern clears the breakwater, it counts.',
      'It began for the fishing boats. A light for everyone not home yet.',
    ],
    askedOf: {
      captain: 'I watched them from the ferry, forty winters. Never once dry-eyed.',
      haru: 'I close early that night. Soup at the pier, free. It\'s tradition now.',
    },
  },
  {
    id: 'fog_of_68', title: 'The Great Fog of \'68', tags: ['weather', 'history'],
    lines: [
      'In sixty-eight the fog sat on the Bay for nine days. Nine!',
      'They say people found their way home by following the tram bell.',
      'My grandma says she walked into the harbor twice that week.',
    ],
    askedOf: {
      gordon: 'I rang that bell nine days straight. My arm still knows it.',
      captain: 'The Marigold never left the dock. We played cards. I lost a hat.',
    },
  },
  {
    id: 'pigeons', title: 'The City Hall Pigeons', tags: ['animals', 'gossip'],
    lines: [
      'City Hall has more pigeons than councillors. Better attendance, too.',
      'There\'s a one-footed pigeon downtown. Bit of a local celebrity.',
      'Don\'t eat lunch on the City Hall steps unless you like sharing.',
    ],
    askedOf: {
      birdie: 'That\'s Gerald, dear. He\'s on the steps by eight. Never misses.',
      otis: 'Pigeons don\'t buy lemonade. I have tried. Terrible market.',
    },
  },
];
