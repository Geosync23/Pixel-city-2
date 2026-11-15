// =============================================================================
// Maple Bay — RELATIONSHIPS: the small bits  (src/story/rel_small.js)        PURE DATA. No init(), no side effects.
// The gentle daily stream: a wave on the street, a text, a remembered detail. A few a day, all people together (rel_rules.js PACING).
//
// EXPORTS
//   SMALL        { [castId]: { waves: Bit[], texts: Bit[], details: [memKey, line][] } }
//                waves    what they call out when you pass (a bubble, no notification).           <= 90 chars
//                texts    phone messages. `re` is not used: a text never demands an answer.        <= 150 chars
//                details  a line said at the start of a talk when they hold that `mem:` about you (each once). <= 110 chars
//   Bit          { stage, ctx, text }   stage = the LOWEST stage it is used at (a FRIEND_STAGES or ROMANCE_STAGES id; a romance
//                stage means "only on the romance track"); ctx = a _rel_kit SMALL_CTX key. The engine takes the bits whose stage is
//                at or below the current one and whose ctx holds, prefers the most specific ctx, and never repeats one until the
//                person's pool has gone round.
//   SMALL_ANY    the same three pools for anyone without their own (a co-worker from the job casts who has become a friend).
//   NEWS         { [newsKind]: { [castId]: line } }   what the family and close friends text back when told your news ("news" verb).
//   WITH_PARTNER { [castId]: line }   what a visitor says to a live-in partner, once ({partner}).
// =============================================================================
import { bits } from './_rel_kit.js';

const S = (waves, texts, details) => ({ waves: bits(waves), texts: bits(texts), details: details || [] });

export const SMALL = {
  /* --------------------------------------------------------------- the ten --------------------------------------------------------------- */
  marlow: S([
    ['acquaintance', 'any', 'Usual? It\'s already on.'], ['friend', 'morning', 'You\'re four minutes later than Tuesday. I noticed. I notice.'], ['friend', 'rain', 'Come in out of it. First one\'s on the awning.'],
    ['spark', 'any', 'Oh. Hi. I was just... wiping this. It\'s very clean now.'], ['dating', 'any', 'There you are. Tobi, cover the bar a second.'], ['partner', 'evening', 'Home soon. Don\'t eat. I\'m bringing the good bread.'],
  ], [
    ['friend', 'any', 'New beans in from the roaster. I\'ve put a bag aside. No, not as a gift. As a professional opinion I need from you.'], ['friend', 'gap', 'The Duchess asked after you. She makes a noise. I\'ve decided it\'s your name.'],
    ['friend', 'worked', 'Long shift? Come by after. I close at seven, but I close slowly.'], ['friend', 'lowmood', 'You looked tired this morning. I put an extra shot in. You didn\'t ask. I\'m not sorry.'],
    ['spark', 'any', 'I drew a leaf in somebody\'s foam today, by accident. It wasn\'t yours. I felt unfaithful.'], ['dating', 'after_date', 'I\'m at work and I\'m humming. Tobi has asked me to stop. I can\'t.'],
    ['dating', 'rain', 'It\'s raining, the shop\'s empty, and I\'m thinking about a peach stall. That\'s your doing.'], ['exclusive', 'morning', 'Half five. The street\'s blue. You\'re asleep. I just wanted somebody to know it was pretty.'],
    ['exclusive', 'festival', 'It\'s mad in here. Every cup I\'ve got is out. Come and stand at the end of the bar so I\'ve something to look at.'], ['partner', 'any', 'Plant three has a new leaf. I\'m telling you before I tell the plant.'],
    ['partner', 'cooked', 'You cooked. I could smell it on the stairs. I haven\'t come home to a smell since I was sixteen.'], ['married', 'any', 'A customer asked if I was married. I said yes before she\'d finished the word. Still not used to it. Don\'t want to be.'],
    ['friend', 'birthday', 'It\'s my birthday. I\'m working. Obviously. But I\'m closing at four, and that\'s the wildest thing I\'ve ever done.'],
  ], [['asked_day_off', 'I\'ve been thinking about what you asked. About a day off. I\'ve got as far as "a morning".'], ['cart_coffee', 'I went back to that coffee cart. I tipped him. Then I told him about his milk. Gently.'], ['the_lark', 'I looked it up. It\'s a skylark. They sing going up, so they can\'t see where they\'re going. Relatable.'], ['the_table', 'I\'ve stopped holding up the table. I check it twice a day, instead of forty times.'], ['chalkboard_taken', 'A regular asked what "TAKEN" on the board meant. I said it was a seasonal blend.']]),

  nico: S([
    ['acquaintance', 'any', 'Hey! Slice? It\'s good today. It\'s good every day. Today especially.'], ['friend', 'any', 'There\'s my favourite! Marco, look alive, royalty\'s in.'], ['friend', 'sun', 'Beautiful day! I\'m inside next to a five-hundred-degree oven! Beautiful!'],
    ['spark', 'any', 'Oh no. You\'re here. I had a whole thing to say and it\'s gone.'], ['dating', 'any', 'I saw you from the oven. I burned one. Worth it.'], ['partner', 'evening', 'I\'m bringing the ends of the dough home. Garlic knots. Don\'t argue.'],
  ], [
    ['friend', 'any', 'New special. It\'s got figs on. Marco says I\'ve lost my mind. Come and settle it.'], ['friend', 'gap', 'Where\'ve you been? I made your slice out of habit and had to eat it myself. Twice.'],
    ['friend', 'rain', 'It\'s raining and nobody\'s in. I\'m singing to an empty shop. Come and be an audience.'], ['friend', 'festival', 'Festival day! Two hundred pies before noon. I love it. I can\'t feel my arms. I love it.'],
    ['spark', 'any', 'I\'m typing this slowly. See? Slow. This is me being slow. Hi.'], ['dating', 'after_date', 'I told Marco about last night. He said, "You\'ve said that before." I said, "Not like this." He went quiet.'],
    ['dating', 'any', 'One thing a week, right? This week\'s thing: I kept the ticket stub. It\'s in my wallet, behind my mother.'], ['exclusive', 'any', 'It\'s week whatever, and I still don\'t know your middle name. I love that. Don\'t tell me. Tell me in a month.'],
    ['exclusive', 'worked', 'You worked today? Me too. Let\'s both be tired at the same table and say nothing. I\'ve been practicing nothing.'], ['partner', 'morning', 'Ma rang. She asked if you\'re eating. I sent her a photo of your plate. She has notes.'],
    ['partner', 'cooked', 'You cooked for me. ME. A cook. Do you know nobody does that? They\'re scared. You weren\'t scared. It was great.'], ['married', 'any', 'A guy asked how long I\'ve been married. I counted the days out loud. He left. I\'m still counting.'],
    ['friend', 'birthday', 'It\'s my birthday! Thirty! Ma sent a card with twenty dollars in it, like I\'m nine. I\'m buying everyone a slice.'],
  ], [['held_hand_film', 'You held my hand in row F. I looked at that hand for an hour after. It\'s just a hand. It\'s not.'], ['cried_too', 'I told Vera you cry at films as well. She wrote your name on the box under mine.'], ['two_kitchens', 'I\'ve been thinking about what I said. Two kitchens. I think a person can only really sing in one.'], ['sat_in_quiet', 'I sat on the same bench at lunch. On my own. Didn\'t say a word. I was fine! I was just a guy on a bench!'], ['yes_in_biro', 'The YES you wrote on my hand washed off. I\'ve got the photo. It\'s my phone background. Marco thinks it\'s a tattoo.']]),

  tasha: S([
    ['acquaintance', 'any', 'Hey! Shoulders back. Good. See you inside.'], ['friend', 'morning', 'There\'s my star. You\'re on the board, so you\'d better be warming up.'], ['friend', 'rain', 'Rain\'s no excuse! ...It\'s a pretty good excuse. Come in and get dry.'],
    ['spark', 'any', 'Hey. You. Um. Hydrate. That\'s all I\'ve got.'], ['dating', 'any', 'I slowed down so you\'d catch up. Don\'t tell anyone I do that.'], ['partner', 'evening', 'Heading home. I\'m beat. Good beat. Save me a spot on the floor.'],
  ], [
    ['friend', 'any', 'You missed Tuesday. Not judging. Okay, a little. Thursday. I\'ll save your mat.'], ['friend', 'worked', 'Long day? Ten minutes on the rower fixes most things. The rest, pie fixes.'],
    ['friend', 'gap', 'Haven\'t seen you. You good? Real answer, not the gym answer.'], ['friend', 'promoted', 'Heard you moved up. Told the six AM class. They clapped. They\'ll clap at anything, but still.'],
    ['spark', 'any', 'I wrote your name on the board again today. It was already there. I just went over it.'], ['dating', 'after_date', 'Smiling at a kettlebell. Midge asked what was funny. I said "leg day". She didn\'t buy it.'],
    ['dating', 'sun', 'River\'s like glass this morning. You\'d have liked it. Next time I\'m dragging you out of bed.'], ['exclusive', 'lowmood', 'You sounded flat earlier. I\'m not fixing it. I\'m just coming over with soup, and I\'ll sit there.'],
    ['exclusive', 'any', 'A guy at the gym asked me out. I said I\'m taken. First time I\'ve said it. Felt like a PR.'], ['partner', 'morning', 'Smoothie\'s in the fridge. It\'s got your name on. Don\'t let me see it there at lunch.'],
    ['partner', 'any', 'I asked Midge to carry a box for me today. Just to practice. She nearly dropped it from shock.'], ['married', 'any', 'Somebody called me "Mrs." at the bank. I looked behind me. Then I grinned for a block and a half.'],
    ['friend', 'birthday', 'Birthday. Thirty-nine. I did thirty-nine pull-ups about it. Bring cake. I\'ve earned exactly one slice.'],
  ], [['the_catch', 'I heard an eight go by this morning. I thought of telling you about the catch. You\'re the only one I told.'], ['pickle', 'I\'ve got a pickle in my desk drawer. For next time you say "posture".'], ['hand_on_back', 'I\'m not good at thank-yous. You remember the stairs. That was a big one.'], ['not_hers_to_carry', 'I keep turning over what you said at Dot\'s. That it might not be mine. I put some of it down. Not all. Some.'], ['board_taken', 'The six AM class has seen the board. I\'ve been asked eleven questions. I answered none. I\'m beaming, though.']]),

  imani: S([
    ['acquaintance', 'any', 'That jacket! We need to talk. Not now. But we need to.'], ['friend', 'any', 'Come here. Collar. There. Go on with your day.'], ['friend', 'snow', 'You are NOT dressed for this. Get in here. I\'ve got a scarf with your name on it.'],
    ['spark', 'any', 'Well, look at you. I\'m not saying anything. I\'m saying one thing: good.'], ['dating', 'any', 'There\'s my favourite outfit. I mean the person in it.'], ['partner', 'evening', 'I\'m locking up. My feet are done. Tell me there\'s something to drink.'],
  ], [
    ['friend', 'any', 'A coat came in. Your size, your color. I\'m not selling it to you. I\'m only telling you it exists, and it\'s in the back.'], ['friend', 'gap', 'I haven\'t fixed your collar in a week. It\'s probably a disaster. Come in before someone sees.'],
    ['friend', 'festival', 'Festival! Everybody\'s out in their best. I\'m sat in the window, judging. Lovingly. Come and judge with me.'], ['friend', 'promoted', 'Promoted! That\'s a new-shirt occasion. I\'ll pick. You pay. That\'s the arrangement.'],
    ['spark', 'any', 'I dressed a mannequin today and realized I\'d put it in what you wore Tuesday. Paolo noticed. I denied everything.'], ['dating', 'after_date', 'Gwen says I\'m "glowing". I told her it\'s highlighter. It isn\'t highlighter.'],
    ['dating', 'rain', 'Slow day. Rain. I cut a sleeve for no one. It came out your length. I\'m just telling you.'], ['exclusive', 'any', 'A woman asked who made my earrings. I said, "Somebody who likes me." Then I remembered I bought them myself. I meant you anyway.'],
    ['exclusive', 'lowmood', 'Bad day? Put on the good jacket. I know it won\'t fix it. You\'ll just be sad in a good jacket, which is better.'], ['partner', 'morning', 'I left a pin on the bathroom floor. I\'m sorry. I\'m not, I can\'t find it. Tread carefully, baby.'],
    ['partner', 'any', 'Sold another coat. With my name in it. I looked at the label for a full minute before I bagged it.'], ['married', 'any', 'I measured a bride today, and for once I didn\'t feel like the help. I felt like a colleague.'],
    ['friend', 'birthday', 'It\'s my birthday. I\'m wearing all of my favourites at once. It shouldn\'t work. It works.'],
  ], [['asked_ny', 'You asked about New York. I\'ve got the long version ready now. It needs a drink, and a second date.'], ['jacket_reading', 'That jacket of yours. It\'s still waiting. So am I. I\'m only saying.'], ['the_green_coat', 'The green coat\'s still on the rail. I walk past it and I think of what you said. "It knows what it is."'], ['finish', 'I said "finish" to a hem today, out loud, like my grandmother. Gwen jumped.'], ['not_for_sale_tag', 'Are you still wearing the tag? You\'d better be wearing the tag.']]),

  felix: S([
    ['acquaintance', 'any', 'Oh! Hi. The lamp. Is the lamp... never mind. Hi.'], ['friend', 'any', 'Hello! I fixed a thing. It\'s not important. It\'s quite important. Later.'], ['friend', 'fog', 'Careful. The lamp on the corner\'s out. I\'ve reported it. Again.'],
    ['spark', 'any', 'Hi. I was going to say something good. It\'s on a list. At home.'], ['dating', 'any', 'I saw you from the lamp aisle. I walked into a display. I\'m fine.'], ['partner', 'evening', 'On my way. I\'ve got a broken thing. It\'s only small. It followed me.'],
  ], [
    ['friend', 'any', 'A radio came in that only gets one station. It\'s jazz. I\'ve decided not to fix it. Some things are right as they are.'], ['friend', 'gap', 'I thought of you when the buzzer went. It wasn\'t you. It\'s never you when I think it is. Hope you\'re well.'],
    ['friend', 'moved', 'New place! Count the sockets. Then tell me the number. I\'ll worry about it so you don\'t have to.'], ['friend', 'rain', 'It\'s raining. The shop roof has a drip I\'ve named Gerald. No. That name\'s taken, isn\'t it. Derek.'],
    ['spark', 'any', 'I rehearsed a text. This isn\'t it. This is the one that came out.'], ['dating', 'after_date', 'I can\'t sleep, so I\'m fixing a toaster. It\'s a very happy toaster. It doesn\'t know why.'],
    ['dating', 'any', 'Saturn\'s up tonight. I looked. It still looks fake. I laughed, on my own, on a roof.'], ['exclusive', 'worked', 'You worked today. Tell me the bit that went wrong. I like those bits. That\'s where the interesting part is.'],
    ['exclusive', 'any', 'Dev asked how it\'s going with us. I said "it works". From me, that\'s the highest thing there is.'], ['partner', 'morning', 'I descaled the kettle. I timed your tea. I left a note. I see now that was three things, and one would have done.'],
    ['partner', 'any', 'Fourteen jobs on the bench. One was a clock that ran backwards. I nearly left it. It seemed to be enjoying itself.'], ['married', 'any', 'A customer said "your wife" or "your husband", I didn\'t hear which. I said yes. I\'d have said yes to either. I just like the "your".'],
    ['friend', 'birthday', 'It\'s my birthday. My dad posted me a broken barometer. No card. It\'s the nicest thing he\'s ever sent me.'],
  ], [['saturn_laugh', 'I told the Observatory guide you laughed at Saturn. He said everyone does. I said, "Not like that."'], ['bring_broken_thing', 'You said you had something broken. I\'ve kept a space on the bench. No hurry. It\'s a patient space.'], ['loose_wire', 'What you said, about being a bit broken. I\'ve looked. I can\'t find the fault. I don\'t think there is one.'], ['quite_good', 'I said "I\'m quite good at this" to a customer. Out loud. He agreed. I had to go and sit down.'], ['found_and_mended', 'The sign\'s up. "Found and mended." I walk under it every morning and I still look up.']]),

  noor: S([
    ['acquaintance', 'any', 'Oh! Hello. Sorry about the scales. And the hour.'], ['friend', 'any', 'Hello, neighbour. Was it too loud last night? It was. I\'m sorry. I\'m a bit not sorry.'], ['friend', 'evening', 'I\'m about to start. You\'ve got about four minutes to find earplugs.'],
    ['spark', 'any', 'Hi. I, um. I played better last night. I think you were home.'], ['dating', 'any', 'Oh, it\'s you. Good. I\'m not nervous. I checked.'], ['partner', 'evening', 'Nearly seven. I\'m tuning. Come and be a bench.'],
  ], [
    ['friend', 'any', 'I\'m sorry about the piece that wasn\'t on the syllabus. I was cross with a metronome. It\'s resolved now. The metronome won.'], ['friend', 'gap', 'It\'s been quiet on your side of the wall. I hope that\'s a good quiet. I played the slow one anyway.'],
    ['friend', 'rain', 'It\'s raining, so I\'m going to the glass house to learn a score. If you see a cello case under a fig tree, that\'s me.'], ['friend', 'worked', 'You came home late. I heard the door. I\'ll keep it to the quiet pieces tonight.'],
    ['spark', 'any', 'I wrote this three times. This is the fourth. I\'m keeping it. Hello.'], ['dating', 'after_date', 'I\'m practicing. It\'s in a major key. That\'s your fault, and I\'ll be telling my teacher.'],
    ['dating', 'any', 'A boy on a scooter recognized me from the steps. He said, "You\'re the sick cello lady." I\'ve never been prouder.'], ['exclusive', 'lowmood', 'You went quiet today. I can play something for it, if you like. Through the wall. You wouldn\'t have to say anything.'],
    ['exclusive', 'any', 'My mother asked if you\'re warm enough. As a person. I said yes. She\'s knitting you something anyway.'], ['partner', 'morning', 'I made chai. Ammi stayed on the phone while I did it, "just in case". It\'s on the stove. Drink it hot.'],
    ['partner', 'any', 'Bar forty went by tonight and I didn\'t notice it. I only noticed afterwards. That\'s you. That\'s what you did.'], ['married', 'any', 'The orchestra manager asked for my "next of kin". I wrote your name. I had to stop and look at it.'],
    ['friend', 'birthday', 'It\'s my birthday. I\'m playing myself something cheerful, and then ringing my mother before she rings me. A first.'],
  ], [['radio_off', 'You said you turn the radio off when I start. I think of that at seven every day. It\'s like a curtain going up.'], ['bar_forty', 'Bar forty. You said you couldn\'t hear it was wrong. I\'m trying to hear it the way you do.'], ['koi_maestro', 'I went to see Maestro. He\'s grown. He came straight over. I told him about you.'], ['eyes_shut', 'I played with my own eyes shut this morning. Like you did. It was better. It\'s all backwards.'], ['first_coin', 'I\'ve still got the first coin you put in. It\'s separate from the four dollars sixty. It\'s in the rosin tin.']]),

  tav: S([
    ['acquaintance', 'any', 'Morning! Great day for it! Don\'t stop, I\'ll catch you!'], ['friend', 'morning', 'Hey! I\'m slowing down. Look at this. This is me, slow.'], ['friend', 'rain', 'Rain run! Best kind! Nobody on the path but the ducks!'],
    ['spark', 'any', 'Hey! I\'ve run past your building four times this morning. By accident. Four accidents.'], ['dating', 'any', 'There you are! My pace just dropped. That\'s you. That\'s a real effect.'], ['partner', 'morning', 'Back! Heron by the bridge! Coffee\'s on! I need a shower! I love you!'],
  ], [
    ['friend', 'any', 'There\'s a new bench on the River Walk, at mile two. I\'ve sat on it. I, me, sat. It\'s a good bench.'], ['friend', 'gap', 'Haven\'t seen you on the path! No pressure. The ducks asked, though. They\'re worried.'],
    ['friend', 'worked', 'Long day at work? Same. Ms. Hartwell said "adequate" twice. I\'m coasting on it.'], ['friend', 'sun', 'It\'s warm! Actually warm! I can feel my knees! Come out, it won\'t last!'],
    ['spark', 'any', 'I moved a run for you this week. I\'ve never moved a run. My watch sent me a concerned notification.'], ['dating', 'after_date', 'My heart rate was up all evening, and I didn\'t run a step. I\'ve logged it as "other".'],
    ['dating', 'any', 'Mom sent a crab emoji. About you. That\'s the big one. That\'s like a knighthood.'], ['exclusive', 'lowmood', 'Rough day? Walk with me. Not a run. A walk. I\'ll go your speed and I won\'t even bounce.'],
    ['exclusive', 'any', 'I told my dad I\'d met someone. He said, "Do they run?" I said, "No. Walks." He said, "Smart."'], ['partner', 'any', 'Rest day. I\'m lying very still. It\'s been nine minutes. Come and tell me I\'m doing it right.'],
    ['partner', 'cooked', 'You cooked! I ran home faster. That\'s a real number. Eleven seconds a mile faster. Do it again.'], ['married', 'any', 'I\'ve put "spouse" on the race form, under emergency contact. I stared at the word. Then I ran my best 10K of the year.'],
    ['friend', 'birthday', 'It\'s my birthday! Thirty-one! I\'m running thirty-one kilometres. I\'ve made a mistake. Bring snacks to mile fifteen.'],
  ], [['banana_pancakes', 'I made the pancakes again. I thought: you\'re the only one who asked about them, and not about the race.'], ['wheel_hold', 'I told the running club about the Wheel. I left out the bit where I held on to you. They think I\'m a hero.'], ['there_are_ducks', 'I counted the ducks at your speed. Fourteen. At my speed, I\'d always thought it was about three.'], ['walked_mile_eleven', 'I walked mile eleven again today. On purpose. It\'s a nice mile. I\'d never looked at it.'], ['kerb_manners', 'I told Dad you\'ve got good kerb manners. He said, "Keep that one." He means you.']]),

  haru: S([
    ['acquaintance', 'any', 'Welcome. Sit.'], ['friend', 'any', 'You came. Good. The end stool.'], ['friend', 'snow', 'It is snowing. Come in. Today the broth is right for it.'],
    ['spark', 'any', 'Ah. You. ...I will make the egg.'], ['dating', 'any', 'You are early. Sit. I am not ready. I am pleased.'], ['partner', 'evening', 'I close at ten. Wait up, or do not. There will be rice either way.'],
  ], [
    ['friend', 'any', 'Good mackerel at the market this morning. I bought two. One is too many for one person. Come at three.'], ['friend', 'gap', 'You have not come this week. The stool is not offended. I mention it only.'],
    ['friend', 'rain', 'Rain. The shop is quiet. This is the best time for noodles. Nobody knows this. Now you know.'], ['friend', 'fog', 'Fog on the harbor at six. I could not see the fish. I bought by smell. It was a good morning.'],
    ['spark', 'any', 'My niece says I should send a text that is "not about food". I am trying. Did you eat?'], ['dating', 'after_date', 'I am at the stove. I am thinking, and not about the stove. This has not happened before.'],
    ['dating', 'any', 'Monday is in three days. I have counted. I do not usually count toward Monday.'], ['exclusive', 'any', 'A customer left one mouthful of broth. I was not angry. Emi says this is "character development".'],
    ['exclusive', 'lowmood', 'You sounded tired. Come to the shop. Do not order. I will know what to make.'], ['partner', 'morning', 'Rice, egg, pickles, under the cloth. I have sharpened your knife. Do not be alarmed by it.'],
    ['partner', 'any', 'I told the fishmonger about you. He gave me the good tuna and would not take money. You are useful.'], ['married', 'any', 'My mother asks each Monday whether I have sat down today. I tell her yes. It is true now.'],
    ['friend', 'birthday', 'It is my birthday. I do not observe it. I am closing one hour early. That is not observing. That is a coincidence.'],
  ], [['second_onigiri', 'You took a second rice ball, that Monday. I have thought about it. Nobody takes a second.'], ['the_plum', 'You got the plum. My mother would say it means a good year. I do not hold with it. I am glad, however.'], ['good_at_quiet', 'I told my sister you are good at quiet. She said, "Marry that one." She is fourteen years younger, and impertinent.'], ['mr_sato', 'I put an egg on Mr. Sato\'s shelf today. For telling you about him. He would have liked to be mentioned.'], ['knew_about_eggs', 'I told Emi you knew about the two eggs. She did not believe me. I have never won an argument with her before.']]),

  celeste: S([
    ['acquaintance', 'any', 'Good evening. I shall find you something by the window.'], ['friend', 'any', 'Ah, there you are. The bay table. I have been keeping it warm with a councilman.'], ['friend', 'rain', 'Come in, come in. Give me that coat. No, GIVE it to me, it is what I am for.'],
    ['spark', 'any', 'You. Good. I was hoping the door would do something interesting tonight.'], ['dating', 'any', 'Cheri. Do not look at me like that in front of the waiters. Look at me like that.'], ['partner', 'evening', 'Home at midnight. Leave the light. I shall see it from the corner.'],
  ], [
    ['friend', 'any', 'Chef has done something with a scallop that you should know about. Thursday. I shall hold the table and deny everything.'], ['friend', 'gap', 'One has not seen you. I do not complain. I merely observe that table four looks unhappy without you.'],
    ['friend', 'festival', 'A festival. The whole town wishes to eat at eight o\'clock. I am serene. I am not serene. Come at six.'], ['friend', 'promoted', 'I hear you have risen in the world. Naturally. Come and be congratulated properly, with a glass.'],
    ['spark', 'any', 'I ate my lunch standing in the walk-in today, and thought of you saying "sit down". So I sat. On a crate of lemons.'], ['dating', 'after_date', 'Julien asked why I was smiling at the cutlery. I said the forks were unusually straight. He has checked them twice.'],
    ['dating', 'any', 'My night off is Monday. I have nothing planned. For me that is a declaration.'], ['exclusive', 'lowmood', 'You have had a bad day. I can hear it in how you typed. Come to the Gull. I shall feed you and ask nothing.'],
    ['exclusive', 'any', 'Margaux has asked for a photograph of us. She will critique my coat. I am sending it regardless.'], ['partner', 'morning', 'There is coffee. In a pot. I made it sitting down. I wish this noted.'],
    ['partner', 'cooked', 'You cooked. I came in at midnight and there was a plate under a cloth. I ate it at the table. Sitting. I may have wept a little on the potatoes.'], ['married', 'any', 'A guest called me "Madame" and looked at my hand. I let him look. I turned it a little toward the candle.'],
    ['friend', 'birthday', 'It is my birthday, and I am working. Chef has made something with a candle in it. I pretended not to see. I saw.'],
  ], [['only_table', 'You said you were my only table. I have thought of it on every busy night since. It steadies the hand.'], ['cleared_cup', 'You took my cup, that first day, and threw it away for me. I have told Margaux. She said, "Keep that one, Maman."'], ['burnt_toast', 'I told Margaux I had told you about the burnt toast. She cried on the telephone. She says she was "aiming for golden".'], ['the_bigger_half', 'I still think about the bigger half. You did not even notice you had done it. That is the point.'], ['names_in_the_book', 'Julien found our names in the reservation book. He has drawn a small heart beside them, in pencil. I have left it.']]),

  barnaby: S([
    ['acquaintance', 'any', 'Ah. Good day. Do not order the special. I say no more.'], ['friend', 'any', 'There you are! Sit. I require a second opinion, and yours is the only one I trust.'], ['friend', 'rain', 'Come in out of it! A wet companion is better than a dry menu.'],
    ['spark', 'any', 'Good heavens. You. I find I have lost my place in my own sentence.'], ['dating', 'any', 'My dear. Sit. I have ordered nothing, in case you wished to choose. I never do that.'], ['partner', 'evening', 'I am coming home. I have eaten four courses and I want toast.'],
  ], [
    ['friend', 'any', 'I have discovered a pastry. I shall not say where, in writing. Meet me at four and I shall lead you to it blindfold.'], ['friend', 'gap', 'One has dined alone all week and found one\'s own conversation thin. Do reappear.'],
    ['friend', 'festival', 'A festival. Food on sticks. I disapprove of it entirely, and I have had three. Come and stop me.'], ['friend', 'cooked', 'I am told you cooked at home yesterday. What was it? Spare no detail. I shall not print it. I may frame it.'],
    ['spark', 'any', 'I began a review this morning and found I had written your name in the margin. Twice. I have changed pens.'], ['dating', 'after_date', 'I took no notes last night. I find that I remember everything. This has never happened with a tasting menu.'],
    ['dating', 'any', 'I ate at Dot\'s today and she asked where "the nice one" was. You have been noticed. It is the highest honor she confers.'], ['exclusive', 'lowmood', 'You sounded low. I am no use in a crisis, but I can be at your door in twenty minutes with a cheese. Say the word.'],
    ['exclusive', 'any', 'My editor says the column has "a glow". I have told him it is indigestion. He does not believe me. Nor do I.'], ['partner', 'morning', 'I have made toast. It is toast. I am not going to describe it. ...Golden. With a good crumb. Curses.'],
    ['partner', 'any', 'I made an egg today. Unsupervised. I ate it at the stove, standing, like a man who lives somewhere.'], ['married', 'any', 'I was asked at a dinner whom I had brought. I said, "My better judgment." They laughed. I was not joking.'],
    ['friend', 'birthday', 'It is my birthday. Fifty-eight. I shall be dining at an establishment I cannot name, on pancakes. You are invited.'],
  ], [['keeps_dots_secret', 'You have kept my Monday secret. I asked Dot. She said, "Not a peep out of that one." I am in your debt.'], ['the_understudy', 'I called myself the understudy, that first Monday. You have been very kind to him. He is growing in the part.'], ['barney', 'You called me Barney last week. In passing. I have been turning it over like a boiled sweet.'], ['stop_reviewing', 'I caught myself reviewing a sunset. I stopped. I simply looked at it. You did that.'], ['best_meal_nana', 'Your best meal was your grandmother\'s pancakes, you said. I should give a great deal to be introduced to them.']]),

  /* ------------------------------------------------------- family and friends with arcs ------------------------------------------------------- */
  nana: S([
    ['friend', 'any', 'Stand up straight. There. Now you look like a Larkin.'], ['friend', 'rain', 'Where is your umbrella? Do not tell me. Come in.'], ['close', 'morning', 'You have eaten? You have not. I can see it from here.'], ['confidant', 'any', 'There you are. I had the cups out already.'],
  ], [
    ['friend', 'any', 'I have made too much soup. It is on the step in the blue pan. I want the pan back. Washed.'], ['friend', 'gap', 'I am not complaining. I am only saying that the kettle has been on, and nobody has come.'],
    ['friend', 'snow', 'It is snowing. You will wear the scarf. I shall know if you have not.'], ['friend', 'worked', 'Roz says you were seen going to work looking tired. Roz sees everything. Come for supper.'],
    ['friend', 'cooked', 'I hear you cooked a proper dinner. From whom do I hear it? Never mind from whom. What was it?'], ['close', 'chapter', 'I have been thinking about what we did yesterday. I do not say more in a text. Come Thursday.'],
    ['close', 'lowmood', 'Your sister says you sounded low. I am sending Dez with a pie. Eat it warm. Then telephone me.'], ['close', 'festival', 'It is the festival. I shall be on the third bench from the fountain, with a flask. You will find me. Everybody does.'],
    ['confidant', 'any', 'It is Thursday tomorrow. The good biscuits are on the second shelf. I am only reminding you.'], ['confidant', 'morning', 'I took Wednesday\'s tablet. I am telling you, so that you need not ask. You were going to ask.'],
    ['friend', 'birthday', 'It is my birthday. I do not want a fuss. I want you, at four, and a small fuss.'],
  ], [['ten_past_five', 'I put the kettle on at ten past five again. I caught myself. I let it boil anyway.'], ['only_the_flour', 'Ambrose was given the leeks on Saturday. Do not look pleased. It was a heavy bag.'], ['held_nanas_hand', 'You held my hand in that waiting room. I did not thank you. I am not going to now. I am only mentioning it.'], ['ring_from_the_stove', 'You have not rung me from your stove this week. I have been by the telephone, with a card, pretending.'], ['moved_down_one', 'You moved down one seat when asked. That is the mark of a well-brought-up child. Your mother would not have.']]),

  jules: S([
    ['friend', 'any', 'Little one! Have you eaten? Don\'t answer, I can tell.'], ['friend', 'morning', 'Morning! I\'m late. I\'m always late. Walk with me to the corner.'], ['close', 'any', 'There you are. Hug. Quick. I\'ve got twenty-six children waiting.'], ['confidant', 'any', 'Hi, you. Ask me how I am. Go on. I\'ll tell you properly.'],
  ], [
    ['friend', 'any', 'Pip wants to know if you\'re coming Sunday. Milo wants to know if you\'re bringing "the thing". I don\'t know what the thing is.'], ['friend', 'gap', 'I haven\'t heard from you. That\'s fine. I\'m only checking you\'re alive, and then I\'ll go back to marking.'],
    ['friend', 'rain', 'It\'s wet play. Thirty children, indoors, with poster paint. Think of me.'], ['friend', 'moved', 'A new place! I\'m coming round to clap in it. It\'s how I test a room. You know that.'],
    ['friend', 'promoted', 'You got promoted! Theo\'s bought a bottle of something. He buys a bottle of something for everything. Come and help.'], ['close', 'lowmood', 'You sounded flat. I\'m leaving soup in your fridge. I have a key and I\'m not afraid to use it.'],
    ['close', 'chapter', 'I keep thinking about yesterday. I\'m all right. I\'m a good sort of tired. Thank you for being there with me.'], ['close', 'worked', 'Long day? Me too. I\'m sat in the car park with my forehead on the wheel. Solidarity.'],
    ['confidant', 'any', 'It\'s ten o\'clock on a Tuesday, and I\'ve just done all the voices. Best job in the world. I thought you should know.'], ['confidant', 'festival', 'Festival! I\'ve lost Milo twice, and Theo once. Meet us by the bandstand. Bring a lead.'],
    ['friend', 'birthday', 'It\'s my birthday, and nobody\'s allowed to need me until six. Take me somewhere. Anywhere without glue.'],
  ], [['always_twenty_six', 'I said no to something today. Out loud. To a grown man. About a bake sale. I thought of you.'], ['come_on_you', 'I said "come on, you" to a tomato. I didn\'t even mind. I think I\'ve made peace with it.'], ['ten_on_a_tuesday', 'You asked what I\'d want to be doing at ten on a Tuesday. I think about it every Tuesday at ten.'], ['never_did_the_sums', 'You said you never did the sums. I\'ve stopped doing them. Mostly. Some nights I just count sheep now.'], ['signed_the_form', 'I slept eight hours last night. First time in three years. It was the form. It was you.']]),

  theo: S([
    ['friend', 'any', 'Ah! A fellow out-law. As you were.'], ['friend', 'sun', 'Lovely day. I\'m going to spend it in a garage. Don\'t tell the sun.'], ['close', 'any', 'There you are. I was just going for cocoa. Slowly. Walk with me.'], ['confidant', 'any', 'Morning! I\'ve got sawdust in my eyebrows, and I couldn\'t be happier.'],
  ], [
    ['friend', 'any', 'I\'ve made a thing. I don\'t know what it is yet. Come and tell me. It might be for you.'], ['friend', 'gap', 'Out-law club hasn\'t had a meeting in a while. I\'ve kept the minutes. They\'re blank. Lunch?'],
    ['friend', 'rain', 'Rain on the garage roof. Best sound there is. I\'ve got the radio on and a plank to think about.'], ['friend', 'worked', 'You worked today. Good. HAS TO is done. Now what\'s in the WANT TO column?'],
    ['friend', 'promoted', 'Promoted! I\'ve drawn you a napkin. It\'s got a little ladder on it. You\'re on the second rung.'], ['close', 'lowmood', 'Nora says you\'re a bit low. I\'m no good at talking. Come and hold a piece of wood. It helps.'],
    ['close', 'cooked', 'I hear you cooked a roast. A whole one. I\'m very proud. I\'m also coming round.'], ['close', 'chapter', 'Good day, yesterday. I went for cocoa and I could hear you both from the kitchen. I took my time.'],
    ['confidant', 'any', 'A Year Five glued her birdhouse to the desk. I\'ve told her it\'s a feature. She\'s pleased. So\'s the desk.'], ['confidant', 'festival', 'I\'ve got a stall at the festival! Dez is doing the shouting. I apologize in advance for the shouting.'],
    ['friend', 'birthday', 'It\'s my birthday. Nora\'s hidden something large in the garage. I\'m not allowed in. It\'s MY garage.'],
  ], [['fourteen_across', 'Fourteen across was "shelf". I\'ve had it framed. Not really. I\'ve cut it out and put it on the fridge.'], ['regretfully_voice', 'I caught myself using the regretfully voice on Milo. About a biscuit. I stopped halfway. He got the biscuit.'], ['makes_furniture_leans', 'I\'ve had cards printed. "Makes furniture. (Leans.)" You wrote my slogan. You\'re owed a stool.'], ['larkin_under_the_seat', 'I wrote it under the bench. Both names. Nobody will ever see it. I know it\'s there.'], ['a_very_good_rail', 'Bea called it "a very good rail". I\'ve been dining out on that for a month.']]),

  pip: S([
    ['friend', 'any', 'Halt. State your business. ...I\'m joking. You\'re cleared.'], ['friend', 'morning', 'You\'re up early. Noted.'], ['close', 'any', '{title}! I\'ve got a new case. You\'re needed.'], ['confidant', 'any', 'Bureau business. Walk and talk.'],
  ], [
    ['friend', 'any', 'This is Pip, on Mom\'s phone. I have a question about how tax works. Ring when it\'s convenient. It\'s not urgent. It\'s a bit urgent.'], ['friend', 'gap', 'You have not been to Sunday dinner for a while. I am not upset. I have noted it in the file.'],
    ['friend', 'rain', 'It is raining. Milo is being a submarine in the bath. I am writing it up. Send help.'], ['close', 'promoted', 'Mom says you got promoted. Do you get a badge? If you don\'t, I can make you one. I have a laminator.'],
    ['close', 'festival', 'The festival is today. I have a schedule. You are in the two o\'clock slot. Do not be late. Milo will cry. I won\'t. I might.'], ['close', 'chapter', 'I have added yesterday to the file. It is a good file now. It has a face in it.'],
    ['confidant', 'any', 'The Bureau has a meeting on Saturday. You are Item Four. It is a nice item. I can\'t say more.'], ['confidant', 'lowmood', 'Mom says you\'re sad. I looked it up. It says to drink water and tell someone. So: drink water. And you can tell me. I\'m nine, but I\'m discreet.'],
    ['friend', 'birthday', 'It is my birthday in three days. This is your official notice. I have attached a list. It is alphabetical.'],
  ], [['case_two_confidential', 'Case Two is still confidential. I checked. Nobody has talked. Good work.'], ['point_four', 'The pegs rotate now. Point four. You were the only one who asked what it was.'], ['into_the_coat', 'About the thing with your coat. After the election. We never speak of it. Thank you, though.'], ['the_control', 'You\'re still the control in my study. Seventy-four per cent. Don\'t let it slip.'], ['in_pen', 'You\'re in pen. I checked the Bureau list this morning. Still pen.']]),

  milo: S([
    ['friend', 'any', '...hi.'], ['friend', 'any', 'I saw a bird.'], ['close', 'any', '{title}. I\'ve got a rock. Do you want to see it?'], ['confidant', 'any', 'I saved you the seat. It\'s the one by me.'],
  ], [
    ['friend', 'any', 'this is milo. i drew you. you have big shoes. mom is typing this. i did the shoes.'], ['friend', 'rain', 'milo here. it is raining on the stegosaurus. he likes it.'],
    ['close', 'gap', 'milo says when are you coming. he says he has a thing to tell you and it is about a worm. (Nora)'], ['close', 'festival', 'i am going to the festival. i am going to see the big dragon. you can hold my hand if you get scared.'],
    ['close', 'moved', 'has your new house got a bath. is it a good one. (Milo, via Theo)'], ['confidant', 'any', 'i read a whole page today. the bear one. i did the voice.'],
    ['confidant', 'lowmood', 'i drew you a picture so you are not sad. it is a fish with a hat. dad is bringing it.'], ['friend', 'birthday', 'i am seven soon. i want a cake that is a volcano. pip says volcanoes always win.'],
  ], [['milo_floated', 'I floated again. There wasn\'t a bird. I looked at the roof anyway.'], ['you_came_back', 'You came back from under the water. I told Dad. He said, "Yes, they do that."'], ['the_clock_in_the_bed', 'Can I hold the clock again at your house? I liked the clock.'], ['kept_milos_reading', 'You didn\'t tell. About the reading. I checked with Pip. She doesn\'t know.'], ['minded_the_tooth', 'You minded my tooth. I\'ve got another wobbly one. You can mind that one too.']]),

  dez: S([
    ['friend', 'any', 'CUZ! Can\'t stop! I\'ll loop back! I won\'t loop back!'], ['friend', 'rain', 'Wet roads! Love it! Everything\'s a slide!'], ['close', 'any', 'There\'s my favourite cousin. Don\'t tell the others. There aren\'t any others.'], ['confidant', 'any', 'Hey. Got a minute? Like, an actual one. Sit on the kerb with me.'],
  ], [
    ['friend', 'any', 'new taco place by the depot. i\'ve been four times since it opened. come. my shout, if you beat me there. you won\'t'], ['friend', 'gap', 'cuz. where you been. i\'ve had to tell my jokes to rhonda. she doesn\'t laugh. she just says "copy"'],
    ['friend', 'worked', 'you worked today? respect. i did forty drops and met a dog called kevin. we\'re both heroes'], ['friend', 'festival', 'FESTIVAL. i\'m doing a bike escort for the parade. nobody asked me to. meet me by the tram shed'],
    ['friend', 'moved', 'new place!! which floor. please say ground. i\'m the one who carries your sofa. i\'m always the one'], ['close', 'lowmood', 'nora says you\'re down. i\'m outside. i\'ve got two bikes and no plan. that\'s the best kind'],
    ['close', 'chapter', 'been thinking about yesterday. i\'m not gonna say anything clever. it was good. that\'s all. it was good'], ['close', 'cooked', 'heard you cooked. real food. teach me another one. the soup\'s getting lonely'],
    ['confidant', 'any', 'ma walked to the shop and back on her own. i watched from the window like a creep. she saw me. she waved her stick'], ['confidant', 'promoted', 'you got PROMOTED. i\'m telling the whole depot. i\'m putting it out on the radio. "all units, be advised"'],
    ['friend', 'birthday', 'it\'s my birthday. 25. quarter of a century. i\'m doing 25 laps of the plaza. i\'ve done 6. i\'m at dot\'s'],
  ], [['show_me_the_cut', 'You asked for the cut. Nobody asks for the cut. I\'ve got eleven more. Free Saturday?'], ['kevin_the_dog', 'Kevin says hi. He doesn\'t. He\'s a dog. But he looked at me like he meant it.'], ['they_tell_me_after', 'Nora rang me FIRST about something. First! I nearly fell off the bike.'], ['told_dez_about_the_year', 'What you told me. About Aunt Nell getting the birds wrong. I told Ma. She laughed for ages.'], ['call_sign', 'I heard your bell on Lantern Row. From dispatch. I said, "All units, that\'s my cousin."']]),

  dad: S([
    ['close', 'any', 'Ah. There you are.'], ['close', 'rain', 'Wet. Mind the roof.'], ['confidant', 'any', 'Right. What am I looking at.'],
  ], [
    ['close', 'any', 'Dry. Bacon sandwich. A wren on the wall. Dad.'], ['close', 'rain', 'Wet. Soup. Nothing about. Dad.'], ['close', 'snow', 'Snow. Porridge. Fox prints in the yard. Dad.'],
    ['close', 'gap', 'All right? Dad.'], ['close', 'promoted', 'Your sister says promoted. Good. Do it properly. Dad.'], ['close', 'moved', 'New place. Check the roof. Then check it again. Dad.'],
    ['close', 'lowmood', 'Nora says you\'re low. Go and look at the water. Tell me what it\'s doing. Dad.'], ['confidant', 'any', 'Saw a heron. Thought you\'d want it. Dad.'],
    ['confidant', 'festival', 'Festival, Pip says. Describe it Sunday. All of it. Dad.'], ['confidant', 'cooked', 'What did you make. Was it hers. Dad.'],
    ['close', 'birthday', 'Sixty-three. Emmett rang. Told me I\'m "getting on". He\'s eighty-four. Dad.'],
  ], [['narrated_the_harbor', 'What you said about the harbor. I told Emmett. He wants to see it. He\'s never seen the sea.'], ['ok_means', 'OK. (You know what it means now.)'], ['narrated_her_birthday', 'You talked me through that evening. I\'ve not forgotten.'], ['half_that_tells', 'Bea\'s gate still tells. I heard it from the kitchen Thursday. Knew it was you.'], ['a_hook_for_his_cap', 'Left my cap on your hook. On purpose. I\'ll be back for it.']]),

  kit: S([
    ['acquaintance', 'any', 'Hey, stranger. Not a stranger. Hey.'], ['friend', 'any', 'There\'s my person. Day\'s improving.'], ['friend', 'evening', 'I\'m on at five. Come and sit at the bar and heckle.'], ['close', 'any', 'You. Good. I\'ve got a line and I need to say it at someone.'], ['confidant', 'any', 'And then what? ...See, I can do it too.'],
  ], [
    ['friend', 'any', 'Heard a man on the bus say "I\'m not angry, I\'m just in a hat." That\'s a first line. I\'m having it.'], ['friend', 'gap', 'This is me writing. Look. I\'m writing first. Ten years too late, but I\'m doing it.'],
    ['friend', 'rain', 'Rain on the skylight. I\'ve written four lines, and three are about rain. Come and tell me which one\'s good.'], ['friend', 'fog', 'Fog\'s in. The harbor\'s gone. I love this town most when I can\'t see it.'],
    ['friend', 'promoted', 'Promoted! First round\'s on me. Second\'s on Lou. He doesn\'t know yet.'], ['close', 'lowmood', 'You went quiet. I know that quiet. I\'m coming over with bad wine and no advice.'],
    ['close', 'festival', 'I\'m playing the little stage at four. Stand at the front. If I forget the bridge, mouth it at me.'], ['close', 'chapter', 'I\'ve been thinking about your mum all day. In a good way. She\'d be telling the whole street about you.'],
    ['confidant', 'any', 'Finished a verse. FINISHED. I\'m lying on the floor. Don\'t ring, I can\'t reach.'], ['confidant', 'moved', 'A new place! I\'m painting you a sign for the door. You don\'t get a say in the font.'],
    ['friend', 'birthday', 'It\'s my birthday. Twenty-eight. I wrote a song about it. It\'s eleven seconds long. That\'s the whole song.'],
  ], [['six_cards_about_you', 'I read the six cards again. They\'re not that bad. One\'s nearly good. Don\'t get ideas.'], ['load_bearing_fry', 'I can\'t eat fries now without building a wall. That\'s on you.'], ['yet', 'I said "yet" to someone today. "I haven\'t made the album YET." It felt different. It felt like a plan.'], ['both_thought_outgrown', 'Ten years. Being polite. I told Lou. He said, "That\'s not a bridge. That\'s the whole song."'], ['six_stamped_postcards', 'I\'ve got one postcard left over. I\'m keeping it stamped. For next time one of us goes anywhere.']]),

  gordon: S([
    ['acquaintance', 'any', 'Good morning! A fine day for it. Hold tight.'], ['friend', 'morning', 'Seven thirty-one. You are a minute behind. I mention it as a friend.'], ['friend', 'fog', 'Fog. In my day we rang twice at every corner. Mind how you go.'], ['close', 'any', 'Ah, my fitter\'s mate! Monday. Ten o\'clock. Do not forget your rag.'], ['confidant', 'any', 'Good day to you. I can read your face from here, now. It is a good one.'],
  ], [
    ['friend', 'any', 'I have a parcel for you. It was left with me by the postman, who considers me reliable. I am inclined to agree.'], ['friend', 'gap', 'I have not heard your step on the stair this week. I trust it is nothing. A conductor notices who is not aboard.'],
    ['friend', 'rain', 'Rain. The shed roof drips on the nearside seats. I have put down a bucket, and apologized to her.'], ['friend', 'snow', 'Snow. Number Nine ran through worse. Winter of \'78. I shall tell you on the stairs. It takes four flights.'],
    ['friend', 'moved', 'I am told you have moved. I shall miss your step. It was a punctual step. Come and oil something.'], ['close', 'lowmood', 'Miss Aziz says you looked low on the stairs. I am no hand at comfort. I can offer a seat on a tram, and tea that would strip paint.'],
    ['close', 'festival', 'A parade today! I shall be on the kerb outside the diner, in my cap. I salute anything with wheels.'], ['close', 'worked', 'You have done an honest day\'s work, I hear. Good. There is nothing like it. Sleep well.'],
    ['confidant', 'any', 'Mr. Wu has found the fault in the controller. It was a thing I did in 1986 and told nobody. He was very polite about it.'], ['confidant', 'promoted', 'Promoted! Capital. In my day, one was given a new cap. I shall look out an old one of mine. It will be too large.'],
    ['friend', 'birthday', 'I am seventy-five today. Dot has given me a pie with a tram on it, in pastry. The proportions are wrong. I ate it gladly.'],
  ], [['earn_the_bell', 'You asked to ring the bell. I have not forgotten. Name me the fourteen points, and we shall see.'], ['hold_tight_please', '"Hold tight, please." I said it to a lady on the 14 bus. She did. Old habits carry.'], ['the_wrong_bearing', 'The thirty-eight has come. The right bearing. I read the label myself. Every digit.'], ['said_the_route', 'I said the route to myself this morning. For pleasure, not for nerves. Thimble Street, by request.'], ['rang_two', 'Two rings. I heard them in my sleep last night. They were yours. I knew by the spacing.']]),

  fenn: S([
    ['acquaintance', 'any', 'Songs one coin! Sad songs two! Smiles are free, but I do notice.'], ['friend', 'any', 'This next one\'s for my friend. It\'s a happy one. Mostly.'], ['friend', 'rain', 'Come under! There\'s room. The accordion takes up most of it.'], ['close', 'any', 'There you are. I\'ve been saving a tune. It hasn\'t got a name. You name it.'], ['confidant', 'any', 'Evening! Come in, it\'s dry. I get to say that now.'],
  ], [
    ['friend', 'any', 'A man paid me a coin to STOP playing. I said that\'s extra. He paid. Best gig this week.'], ['friend', 'gap', 'Haven\'t seen you come through the plaza. I\'ve been playing your one anyway. A pigeon likes it.'],
    ['friend', 'sun', 'Sun\'s out. Hat\'s filling. I\'m playing things in major keys and I don\'t even mean it ironically.'], ['friend', 'snow', 'Snow. Fingers like sausages. I\'m in the station waiting room, playing very quietly at a radiator.'],
    ['friend', 'festival', 'Festival day! Best pitch of the year. I\'m by the fountain. Throw something. Not at me. In the hat.'], ['close', 'lowmood', 'I heard you\'re blue. I\'ve got a two-coin song for that. No charge. I\'ll play it under your window, like a fool.'],
    ['close', 'worked', 'You worked all day. I played all day. Let\'s both sit on a wall and not be useful for an hour.'], ['close', 'moved', 'You moved! Has it got a door that shuts and a window that opens? Then you\'re rich. I\'ll come and play it in.'],
    ['confidant', 'any', 'Wednesday at the Heron. A woman did a song about her cat. Eleven verses. I cried at nine. Come next week.'], ['confidant', 'gap', 'Cal wrote. He\'s got a calf he\'s named after me. It\'s stubborn and it keeps walking off. He thinks he\'s funny.'],
    ['friend', 'birthday', 'It\'s my birthday. Twenty-three. I\'m playing requests all day, and the only request I\'ll take is "something you like".'],
  ], [['the_kettle_song', 'A woman asked for "the kettle one". By name. I\'ve got a hit. It\'s about a kettle.'], ['chowder_for_a_song', 'I still owe you half a song for that chowder. I don\'t forget a debt. It\'s got a chorus now.'], ['two_coffees', 'I make two coffees some mornings. Just to see. Then I drink both. It\'s not sad. It\'s practice.'], ['the_weather_is_wet', '"The weather is wet. I am well." Best thing I ever wrote, and it hasn\'t even got a tune.'], ['a_visit', 'You asked if I wanted to go or to have gone back. I think about that. It was the right question.']]),

  birdie: S([
    ['acquaintance', 'any', 'Good morning, dear. Mind Maureen. She is in a mood.'], ['friend', 'any', 'There you are. Gerald saw you first. He always does.'], ['friend', 'rain', 'Come under my umbrella, dear. The Bishop is already here.'], ['close', 'any', 'Say "hello" to me, dear. ...Mm. A good day. I can tell.'], ['confidant', 'any', 'Eleven o\'clock, and here you are. I told them you would come.'],
  ], [
    ['friend', 'any', 'This is Birdie, dear. A young man showed me how to do this. Gerald has a new friend. She is called Doreen. It will not last.'], ['friend', 'gap', 'The flock has asked where you are. I said you were busy. They did not accept it.'],
    ['friend', 'snow', 'Snow, dear. I have put down straw by the bench. They will not use it. It is the principle.'], ['friend', 'sun', 'A lovely day. Every bird in the city is on the Town Hall roof, doing nothing. I envy them.'],
    ['friend', 'promoted', 'The Bishop tells me you have been promoted. He had it from a sparrow at your work. Well done, dear.'], ['close', 'lowmood', 'I heard your "hello" in the plaza, dear, from forty yards. Come and sit. You need not say the rest. I shall keep the line open.'],
    ['close', 'festival', 'A festival! Crumbs everywhere. It is their Christmas. I shall be at the pond, keeping order.'], ['close', 'moved', 'A new address! Is there a sill? A wide one? I shall send Gerald to inspect.'],
    ['confidant', 'any', 'Odette rang, dear. Sunday at four. She has a new doctor, and does not care for him. She is clearly better.'], ['confidant', 'worked', 'You have worked hard today. I can hear it in how you walk. Sit a moment. The birds will wait.'],
    ['friend', 'birthday', 'It is my birthday, dear. Seventy-three. Gerald brought me a bottle top. It is the thought.'],
  ], [['hello_is_a_letter', 'I have been reading people\'s hellos all morning, dear. Yours is still the easiest. You do not hide.'], ['seasons_greetings', 'I have bought next year\'s Christmas card for Odette. I am going to write more than two words. I have a draft.'], ['number_please', '"Number, please." You said it through the door. I have not been so glad of two words in forty years.'], ['promised_the_rota', 'You kept the rota. Every day. I read the book twice on the aeroplane home.'], ['look_left_for_the_pond', 'I look up at every aeroplane now, dear. In case somebody is looking left.']]),

  walt: S([
    ['acquaintance', 'any', 'Hm. Morning.'], ['friend', 'any', 'You\'re in late. Not my business. Noticed, is all.'], ['friend', 'snow', 'Salt\'s down on the steps. Use the rail. That\'s what it\'s for.'], ['close', 'any', 'Deputy. Second-floor door\'s singing again. When you\'ve a minute.'], ['confidant', 'any', 'Coffee\'s on the stoop. I made two. Sit.'],
  ], [
    ['friend', 'any', 'Your mail slot was sticking. It isn\'t now. Don\'t thank me.'], ['friend', 'gap', 'Haven\'t heard your door. Your plants were looking thirsty through the window. They aren\'t now. I know nothing about it.'],
    ['friend', 'rain', 'Roof\'s holding. I went up and looked. Not on a ladder. From the hatch. Tell nobody I said "hatch".'], ['friend', 'moved', 'So you\'ve moved. Best tenant I had. Don\'t let it go to your head. Run the taps a full minute at the new place.'],
    ['friend', 'promoted', 'Promoted, I hear. Good. Rent\'s the same. Don\'t look at me like that.'], ['close', 'lowmood', 'You came in heavy tonight. I heard it on the stairs. There\'s soup outside your door. It\'s from the second floor. I only carried it.'],
    ['close', 'worked', 'Long shift. I saw your light go on. I left the hall one on for you. That\'s all.'], ['close', 'festival', 'Parade\'s coming down our street. I\'ve put chairs on the stoop. Four. One\'s yours.'],
    ['confidant', 'any', 'Emi rang. I picked up. Second ring. She said, "Who is this?" Very funny. She gets that from her mother.'], ['confidant', 'snow', 'Boiler\'s purring. I went down and told it so. It likes to be told.'],
    ['friend', 'birthday', 'Sixty-four today. Mr. Pike gave me a tin of oil. Good oil. Don\'t tell him I was pleased.'],
  ], [['full_price_wrench', 'You asked about the wrench. I rang my father\'s old shop number. Just to hear it ring. It\'s a nail bar now.'], ['asked_about_the_radiator', 'You asked how a radiator bleeds, your first week. I\'ve told that story to three people.'], ['helped_walt_up', 'About the basement floor. You never mentioned it. I noticed you not mentioning it.'], ['deputy_super', 'I\'ve had a key cut for the boiler room. It\'s on your hook. Deputies get a key.'], ['held_out_the_phone', 'You held the phone out to me. Like she used to. I didn\'t say, at the time. I\'m saying now.']]),

  vik: S([
    ['acquaintance', 'any', 'Good morning. Do you play? No? A pity. One can learn.'], ['friend', 'any', 'Ah! My most promising opponent. Sit. You are black.'], ['friend', 'rain', 'Rain. The board is under the awning. Chess does not stop for weather.'], ['close', 'any', 'You are late. I have been thinking three moves ahead of nobody.'], ['confidant', 'any', 'Good morning! You are white today. I have decided.'],
  ], [
    ['friend', 'any', 'I have a problem for you. White to mate in three. I shall not send the board. Come and see it. That is the trap.'], ['friend', 'gap', 'Table three has been quiet. I beat a tourist in nine moves and felt nothing. Do return.'],
    ['friend', 'snow', 'Snow on the board. I have swept it with my cap. The pieces are cold, and play more cautiously.'], ['friend', 'sun', 'A fine morning. Leela has sent me out early. She says the house "needs airing". I believe she means of me.'],
    ['friend', 'promoted', 'I hear you are promoted. Excellent. Show your working, and they will promote you again.'], ['close', 'lowmood', 'You were not yourself at the table. You moved your queen like a person apologizing. Come tomorrow. We shall not play. We shall have tea.'],
    ['close', 'festival', 'A festival. Noise. Balloons. I shall be at table three, in protest. Bring me something fried.'], ['close', 'worked', 'You have worked a full day. Then your head is tired, and I shall beat you easily. Come at once.'],
    ['confidant', 'any', 'The maths club has discovered negative numbers. A child asked, "Where do they live?" I have not slept. It is a wonderful question.'], ['confidant', 'moved', 'A new home. I have computed the walk to table three. Eleven minutes, in rain. It is acceptable.'],
    ['friend', 'birthday', 'I am seventy-one today. A prime. Leela has made a cake, and painted a picture of the cake. The cake is better. I said, "How interesting."'],
  ], [['the_italian', 'You asked for one opening, properly. Nobody asks for properly. I have a second one ready, when you are.'], ['a_thermos_does_not_put_its_hand_up', 'I told Leela what I said to you. About the thermos. She was quiet. Then she bought me a second cup.'], ['round_up', 'One professor of fluid dynamics. I have rounded up. I find the result agrees with me.'], ['sir_sir', '"Sir, sir!" I hear it in my sleep again. It is the best sleep I have had in six years.'], ['lost_in_ink', 'The book has a second column now. In ink. You saw me write the first entry. I am glad it was witnessed.']]),
};

/* --------------------------------------------------- anyone without their own pools --------------------------------------------------- */
export const SMALL_ANY = S([
  ['acquaintance', 'any', 'Oh, hello! Didn\'t see you there.'], ['acquaintance', 'morning', 'Morning! Off somewhere?'], ['friend', 'any', 'Hey, you! Good to see a friendly face.'], ['friend', 'rain', 'Some weather! Get home dry.'], ['friend', 'festival', 'You\'re out for it too! Isn\'t it something?'], ['close', 'any', 'There you are. I was just thinking about you.'],
], [
  ['friend', 'any', 'Saw something today that made me think of you. I\'ll tell you when I see you. It\'s better told.'], ['friend', 'gap', 'It\'s been a while. No reason for the text. Just: hello.'],
  ['friend', 'worked', 'Long one today. You as well? We should compare notes over something hot.'], ['friend', 'promoted', 'I heard the news. Well done. Properly well done.'],
  ['friend', 'moved', 'A new place! Tell me when you\'re settled, and I\'ll bring something for the windowsill.'], ['close', 'lowmood', 'You didn\'t seem yourself. No need to explain. I\'m about, if you want company.'],
  ['close', 'festival', 'Are you going today? I\'ll be near the food. I\'m always near the food.'], ['close', 'cooked', 'I heard you\'ve been cooking. I\'d never say no to being a test subject.'],
], []);

/* ------------------------------------------------------------- news replies ------------------------------------------------------------- */
export const NEWS = {
  promoted: { nana: 'Promoted. Naturally. You are a Larkin. Come and be fed for it.', jules: 'LOOK at you! Theo, get the bottle. No, the other bottle.', theo: 'One rung up. I\'ve updated the napkin.', dez: 'Boss moves! I\'m telling the depot.', dad: 'Good. Do it properly.', kit: 'First round\'s mine. You\'re getting the second.', pip: 'Is there a badge? There should be a badge.' },
  moved: { nana: 'A new address. I shall need it written down, in ink, and I shall inspect the kitchen.', jules: 'I\'m coming to clap in it. That\'s not optional.', theo: 'New place needs a shelf. I\'ll bring one. It\'ll lean. That\'s how you\'ll know.', dez: 'WHICH FLOOR. Tell me it\'s the ground.', dad: 'Check the roof.', kit: 'I\'m painting you a sign for the door.', milo: 'Has it got a bath?' },
  together: { nana: 'So I hear. From the fishmonger. Bring them Thursday.', jules: 'I KNEW it. Pip owes me a dollar.', theo: 'Welcome them to the waiting room from me.', dez: 'Called it. I didn\'t. I\'m saying I did.', dad: 'Are they kind.', kit: 'It\'s going in a song. I\'m sorry. It\'s too late.', pip: 'I have eleven questions for them.' },
  engaged: { nana: 'Sit down. I need to look at you. ...Yes. I shall make the cake.', jules: 'Little one. Oh. Come here.', theo: 'Out-law club gains a member. I\'ll order a second badge.', dez: 'I\'M DOING THE BIKES.', dad: 'I\'ll come. Tell me what to wear.', kit: 'I\'m standing up with you. That\'s not a question.', pip: 'I will need the date, the venue, and a list.', milo: 'Can I carry the rings?' },
  married: { nana: 'There. That is that done properly.', jules: 'I cried on a stranger. He was very nice about it.', theo: 'Best seats in the house. I told you.', dez: 'BEST. WEDDING. I did the bikes.', dad: 'It suited you.', kit: 'Two finished songs, and one of them\'s yours.', pip: 'It ran four minutes over. I allowed for it.', milo: 'I didn\'t drop them.' },
  chapter: { nana: 'I have been thinking about what we did. Come Thursday.', jules: 'I\'m glad it was you with me.', theo: 'Good day\'s work, that.', dez: 'That was a good one, cuz.', pip: 'I have filed it.', milo: 'I liked that.' },
};

export const WITH_PARTNER = {
  nana: 'And {partner}. Good. You look fed. That is to your credit, and theirs.', jules: 'Hi, {partner}! Don\'t get up. I\'m only leaving soup.', theo: '{partner}! Fellow out-law. How\'s the shelf holding up?', dez: 'Yo, {partner}! Rematch at pool? No? Smart.',
  pip: 'Hello, {partner}. I have two follow-up questions. They can wait.', milo: '{partner}, do you want to see a rock?', kit: '{partner}! I\'ve got a song about you. It\'s kind. Mostly.', gordon: 'Good day, {partner}. I trust you are keeping this one punctual.',
  walt: 'Hm. {partner}. Tap all right? Good.', birdie: 'Oh, and {partner}, dear. Gerald has heard a great deal about you.', vik: '{partner}. Do you play? No? A pity. One can learn.', fenn: '{partner}! This one\'s for the two of you. It\'s a happy one. All the way through.', dad: '{partner}. You\'re looking after each other.',
};
