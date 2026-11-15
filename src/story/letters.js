// =============================================================================
// Maple Bay — LETTERS FROM HOME  (src/story/letters.js)      pure data, no engine imports
// The written correspondence that arrives in the player's mailbox over the first year (sim/post.js delivers it).
// Canon kept: the player's sister Nora, Nana Bea and cousin Dez live IN Maple Bay; Kit grew up in the same home town.
// The people who write are the ones still in that home town ("Pinehollow", 14 Quarry Road):
//   dad     Dad                    block capitals in blue ballpoint on graph paper; practical, dry, a widower learning to cook from Mom's recipe box
//   gramps  Granddad Emmett        shaky fountain pen on cream paper; 84, forty years a Railway Mail Service clerk; tomatoes; post-office lore
//   june    Aunt June              looping purple ink on a flowered notelet; choir, bake sales, knitting, CAPITALS for emphasis, matchmaking
//   robin   Cousin Robin (16)      green gel pen on torn notebook paper; driving test, a band called Wet Cement, wants Otters things
//   sam     Sam Okafor             typewriter on onion skin; best friend from school, night shift at the Pinehollow radio station; knows Kit
//   varga   Mrs. Adela Varga       upright violet ink on airmail paper; retired geography teacher from across the road; lighthouses, pressed flowers
//   (+ ada  Miss Ada Lindqvist     one letter, part of the dead-letter chain, written from Elm House in Hillcrest)
//
// SENDERS[id] = { id, name, short, rel, from (address line), hand: { font, size, ink, paper, caps?, slant, wobble, lh, deco }, greet(c), sign }
// LETTERS = [{ id, from, n, minDay, gap (days after that sender's previous letter), text(c) -> [paragraph, ...],
//              enc?: { kind: 'money', n } | { kind: 'item', id, qty? } | { kind: 'recipe' } | { kind: 'stamp', id } | { kind: 'photo' } ,   note?: line shown under the letter
//              parcel?: { label, gives: [{ item, qty }], big? }   a care package that travels with the letter (arrives through the housing delivery flow or as a collection slip)
//              ask?: 'home_parcel'                              the letter that opens the "send something back home" opportunity }]
// c (context snapshot, built by sim/post.js at delivery and stored with the mail so a letter never changes once it has arrived):
//   name, job (title | ''), home (name | ''), dist (district name | ''), season ('spring' | 'summer' | 'autumn' | 'winter'), rich, broke, friends (count, not family), kit (met Kit),
//   seen: { lighthouse, hotel, cityhall, aquarium, museum, observatory, conservatory, arena, fishmarket } (booleans), fountain (the plaza fountain runs),
//   wrote (letters + postcards the player has sent to THIS sender), sent (what the last parcel to this sender held, e.g. 'the postcards and the jam' | ''), tone ('warm' | 'funny' | 'honest' | 'brief' | ''), day
// REPLIES[senderId](c, o) -> [paragraph, ...]   answer to something the player posted.  o = { kind: 'letter' | 'card' | 'parcel', tone, topics: [..], items: 'the x and the y' | '', n (item count), wrap 0-3, card (postcard name | '') , local (has a Maple Bay souvenir) }
// COMPOSE = { tones, topics(c, toId) -> [{ id, text }] }   the lines the player assembles a letter from at a writing desk.
// JUNK = [{ id, title, from, text, coupon?: { venue, pct } , place?: placeId }]   flyers, coupons and catalogues that turn up between the real post.
// =============================================================================

const P = (...a) => a.filter(Boolean);
const season = c => ({ spring: 'spring', summer: 'summer', autumn: 'autumn', winter: 'winter' }[c.season] || 'spring');

export const SENDERS = {
  dad: { id: 'dad', name: 'Dad', short: 'Dad', rel: 'Your father', from: '14 Quarry Road, Pinehollow', greet: c => `DEAR ${c.name},`, sign: 'LOVE, DAD',
    hand: { font: 'sans-serif', weight: 'bold', size: 11, ink: '#2a3f8a', paper: 'graph', caps: true, slant: 0, wobble: .5, lh: 15, deco: 'ring' } },
  gramps: { id: 'gramps', name: 'Granddad Emmett', short: 'Granddad', rel: 'Your grandfather', from: 'The back bedroom, 14 Quarry Road, Pinehollow', greet: c => `My dear ${c.name},`, sign: 'Your loving Granddad, Emmett',
    hand: { font: 'serif', style: 'italic', size: 13, ink: '#3a2a1c', paper: 'cream', slant: -.12, wobble: 1.5, lh: 17, deco: 'rms' } },
  june: { id: 'june', name: 'Aunt June', short: 'Aunt June', rel: 'Your aunt', from: 'The Yellow House, Mill Lane, Pinehollow', greet: c => `Darling ${c.name}!!`, sign: 'Heaps and heaps of love, your Aunt June xxx',
    hand: { font: 'cursive, serif', style: 'italic', size: 13, ink: '#6a2a8a', paper: 'floral', slant: -.2, wobble: .9, lh: 17, deco: 'hearts' } },
  robin: { id: 'robin', name: 'Cousin Robin', short: 'Robin', rel: 'Your cousin', from: 'my room (KEEP OUT), Mill Lane, Pinehollow', greet: c => `hey ${c.name}`, sign: 'ok bye — Robin',
    hand: { font: 'sans-serif', size: 11, ink: '#1f7a4a', paper: 'notebook', slant: .08, wobble: 1.3, lh: 14, deco: 'doodle' } },
  sam: { id: 'sam', name: 'Sam Okafor', short: 'Sam', rel: 'Your oldest friend', from: 'WPHL 1340 AM, Pinehollow (the night desk)', greet: c => `${c.name} —`, sign: 'Yours from the wrong side of midnight, Sam',
    hand: { font: 'monospace', size: 11, ink: '#26242c', paper: 'onion', slant: 0, wobble: .35, lh: 15, deco: 'type' } },
  varga: { id: 'varga', name: 'Mrs. Adela Varga', short: 'Mrs. Varga', rel: 'Your old geography teacher', from: '17 Quarry Road, Pinehollow (the house with the green gate)', greet: c => `Dear ${c.name},`, sign: 'With my affectionate regards, Adela Varga',
    hand: { font: 'serif', size: 12, ink: '#4a2a6a', paper: 'airmail', slant: 0, wobble: .25, lh: 16, deco: 'flower' } },
  ada: { id: 'ada', name: 'Miss Ada Lindqvist', short: 'Ada Lindqvist', rel: 'Elm House, Hillcrest', from: 'Elm House, Hillcrest, Maple Bay', greet: c => `Dear ${c.name},`, sign: 'Yours, gratefully and at last, Ada Lindqvist',
    hand: { font: 'serif', style: 'italic', size: 12, ink: '#1c3a5a', paper: 'blue', slant: -.1, wobble: .8, lh: 16, deco: 'none' } },
  keeper: { id: 'keeper', name: 'The Lighthouse Keeper', short: 'The Keeper', rel: 'Maple Bay Light', from: 'The Lamp Room, Maple Bay Light', greet: c => `To ${c.name}, ashore,`, sign: 'Keep a good lookout. — The Keeper',
    hand: { font: 'serif', size: 12, ink: '#1c2a4a', paper: 'cream', slant: 0, wobble: .6, lh: 16, deco: 'none' } },
  bottle: { id: 'bottle', name: 'A stranger', short: 'A stranger', rel: 'Somewhere down the coast', from: 'no address', greet: () => 'To whoever threw the bottle,', sign: 'A friend you have not met',
    hand: { font: 'sans-serif', style: 'italic', size: 12, ink: '#2a5a6a', paper: 'cream', slant: .1, wobble: 1.1, lh: 16, deco: 'none' } },
};
export const HOME_SENDERS = ['dad', 'gramps', 'june', 'robin', 'sam', 'varga'];

const L = (id, from, n, minDay, gap, text, x) => Object.assign({ id, from, n, minDay, gap, text }, x);

export const LETTERS = [
  /* ------------------------------------------------------------------ DAD */
  L('dad1', 'dad', 1, 2, 0, c => P(
    `THE HOUSE IS VERY QUIET. I WANT THAT ON THE RECORD. I TURNED ON THE RADIO IN THE KITCHEN AND THE RADIO IN THE GARAGE AND IT IS STILL QUIET, ONLY NOW IT IS QUIET IN STEREO.`,
    `NORA TELEPHONED TO SAY YOU LANDED IN ONE PIECE AND THAT YOUR BAG CAME OFF THE BELT LAST, WHICH IS A FAMILY TRADITION. ${c.home ? `SHE SAYS YOU ARE AT ${c.home.toUpperCase()}. I LOOKED FOR IT ON THE MAP IN THE HALL. THE MAP IS FROM 1974 SO I HAVE DRAWN IT IN.` : 'SHE SAYS YOU HAVE A PLACE. I HAVE NOT SEEN IT SO I AM ASSUMING THE WORST ABOUT THE LOCKS.'}`,
    `PRACTICAL MATTERS. ONE: CHECK THE WINDOW LATCHES. TWO: FIND OUT WHERE THE FUSE BOX IS BEFORE YOU NEED IT. THREE: EAT SOMETHING GREEN ONCE A WEEK. YOUR MOTHER WOULD HAVE SAID ONCE A DAY BUT I KNOW WHO I AM TALKING TO.`,
    `I HAVE STARTED ON HER RECIPE BOX. CARD NUMBER ONE IS "TOAST". SHE WROTE THAT ONE FOR ME IN 1989 AS A JOKE. I MADE IT ANYWAY. IT CAME OUT WELL.`,
    `WRITE BACK WHEN YOU HAVE A MINUTE. A REAL LETTER, WITH A STAMP. YOUR GRANDFATHER CHECKS THE MAILBOX TWICE A DAY AND PRETENDS HE IS CHECKING THE WEATHER.`,
    `I AM PUTTING TWENTY DOLLARS IN THIS. IT IS NOT FOR RENT. IT IS FOR SOMETHING FOOLISH.`), { enc: { kind: 'money', n: 20 }, note: 'A twenty-dollar bill, folded in four, falls out of the envelope.' }),
  L('dad2', 'dad', 2, 8, 6, c => P(
    c.wrote ? `YOUR LETTER CAME TUESDAY. YOUR GRANDFATHER GOT TO THE BOX FIRST AND READ THE ENVELOPE OUT LOUD, POSTMARK AND ALL, BEFORE HE WOULD HAND IT OVER. IT IS ON THE REFRIGERATOR NOW UNDER THE MAGNET SHAPED LIKE A TROUT.` : `NO LETTER FROM YOU YET. I AM NOT COMPLAINING. YOUR GRANDFATHER IS COMPLAINING, AT LENGTH, TO THE MAILBOX. ANY POST OFFICE WILL SELL YOU A STAMP. THEY HAVE DESKS WITH PENS ON CHAINS SO YOU CANNOT EVEN CLAIM YOU HAD NOTHING TO WRITE WITH.`,
    c.job ? `SO YOU ARE WORKING AS A ${c.job.toUpperCase()}. GOOD. SHOW UP EARLY, LEARN EVERYBODY'S NAME, AND NEVER BE THE ONE WHO FINISHES THE COFFEE WITHOUT MAKING MORE. THAT IS ALL I KNOW ABOUT WORK AND IT GOT ME THROUGH THIRTY-ONE YEARS AT THE BUS GARAGE.` : `NORA SAYS YOU ARE STILL LOOKING FOR WORK. THAT IS FINE. A JOB IS LIKE A PARKING SPACE. THE FIRST ONE YOU SEE IS RARELY THE ONE YOU END UP IN. KEEP DRIVING AROUND THE BLOCK.`,
    `NEWS FROM HERE. GERTRUDE WILL NOT START. I HAVE CHANGED THE PLUGS, THE LEADS AND MY TONE OF VOICE. SHE IS A 1986 PICKUP AND SHE KNOWS IT. I WILL NOT BE BEATEN BY A TRUCK.`,
    `RECIPE CARD NUMBER FOUR WAS MEAT LOAF. IT SAYS "BAKE UNTIL DONE". YOUR MOTHER NEVER WROTE DOWN A TIME IN HER LIFE. I BAKED IT UNTIL THE SMOKE ALARM HAD AN OPINION. NEXT TIME I WILL STOP SOONER.`,
    `IS IT TRUE THE TRAINS THERE RUN ON A BRIDGE OVER THE STREET? YOUR GRANDFATHER WANTS TO KNOW THE GAUGE. I TOLD HIM YOU WOULD NOT KNOW THE GAUGE. PROVE ME WRONG IF YOU CAN.`)),
  L('dad3', 'dad', 3, 15, 6, c => P(
    `A REQUEST, AND THEN THE NEWS.`,
    `YOUR GRANDFATHER HAS CLEARED A SPACE ON THE WALL OVER HIS BED, ABOUT THE SIZE OF A CEREAL BOX. HE SAYS IT IS FOR "WHATEVER COMES". WHAT HE MEANS IS: HE WOULD LIKE SOMETHING FROM MAPLE BAY AND HE WILL NOT ASK. SO I AM ASKING.`,
    `COULD YOU PUT A SMALL PARCEL TOGETHER? NOTHING DEAR. A POSTCARD OF THAT LIGHTHOUSE. SOMETHING YOU CAN EAT THAT WE CANNOT GET HERE. ANYTHING WITH THE NAME OF THE TOWN ON IT. THREE OR FOUR THINGS IN A BOX. THE POST OFFICE WILL WEIGH IT AND TELL YOU WHAT IT COSTS, AND YOU WILL HAVE TO STAND IN A LINE, WHICH BUILDS CHARACTER.`,
    c.seen.lighthouse ? `NORA SAYS YOU HAVE ALREADY BEEN OUT TO THE LIGHTHOUSE. HE WILL WANT TO KNOW HOW MANY STEPS. COUNT THEM NEXT TIME.` : `NORA SAYS THE LIGHTHOUSE IS AT THE FAR END OF THE HARBOR AND THAT YOU CAN GO UP IT. GO UP IT. THEN TELL HIM HOW MANY STEPS.`,
    `THE NEWS. GERTRUDE STARTED. THEN SHE STOPPED, IN THE MIDDLE OF QUARRY ROAD, OUTSIDE MRS. VARGA'S GATE. MRS. VARGA BROUGHT ME A CUP OF TEA AND A PRESSED FERN AND STOOD THERE BEING SYMPATHETIC UNTIL I GOT HER ROLLING AGAIN. THE TRUCK, NOT MRS. VARGA.`,
    c.broke ? `AND IF MONEY IS SHORT, SAY SO. I WOULD RATHER HEAR IT FROM YOU THAN FROM NORA. THE PARCEL CAN WAIT. YOU CANNOT EAT A POSTCARD.` : `RECIPE CARD NUMBER NINE: CHICKEN SOUP. IT WORKED. I ATE IT STANDING UP AT THE STOVE LIKE A MAN WHO HAS WON SOMETHING.`), { ask: 'home_parcel' }),
  L('dad4', 'dad', 4, 23, 7, c => P(
    c.sent ? `THE BOX CAME. YOUR GRANDFATHER CARRIED IT IN FROM THE PORCH HIMSELF, KNEE AND ALL, AND WOULD NOT LET ANYONE ELSE CUT THE TAPE. ${c.sent.toUpperCase()}: ALL ARRIVED IN GOOD ORDER. THE WALL OVER HIS BED IS NO LONGER EMPTY AND HE HAS STOPPED PRETENDING TO CHECK THE WEATHER.` : `NO BOX YET, AND THAT IS ALL RIGHT. THE SPACE ON YOUR GRANDFATHER'S WALL IS PATIENT. HE DUSTS IT.`,
    `I HAVE JOINED THE THURSDAY BOWLING LEAGUE AGAIN. THE TEAM IS CALLED THE SPARE PARTS. WE ARE ALL RETIRED FROM THE BUS GARAGE AND WE ARE ALL TERRIBLE. LAST WEEK I BOWLED A 141 AND HAROLD CRIED.`,
    c.home ? `TELL ME ABOUT ${c.home.toUpperCase()}. NOT THE NICE PARTS. THE PARTS A FATHER WANTS TO KNOW. DOES THE HOT WATER COME RIGHT AWAY. DO THE STAIRS HAVE A LIGHT. IS THERE A NEIGHBOR WHO WOULD NOTICE IF YOU DID NOT COME HOME.` : `TELL ME ABOUT WHERE YOU ARE LIVING. NOT THE NICE PARTS. THE PARTS A FATHER WANTS TO KNOW.`,
    c.friends >= 3 ? `NORA TELLS ME YOU KNOW HALF THE TOWN ALREADY. YOU GET THAT FROM YOUR MOTHER. I HAVE LIVED ON QUARRY ROAD FORTY YEARS AND I KNOW SIX PEOPLE, TWO OF THEM BY SIGHT.` : `MAKE A FRIEND OR TWO. IT DOES NOT HAVE TO BE A GOOD ONE AT FIRST. YOUR MOTHER MET HER BEST FRIEND BY BACKING INTO HER CAR.`,
    `RECIPE CARD ELEVEN IS PIE CRUST AND I AM NOT READY. I HAVE PUT IT BACK IN THE BOX FACE DOWN.`,
    `IT IS ${season(c).toUpperCase()} THERE TOO I SUPPOSE. ${c.season === 'winter' ? 'WEAR THE GOOD COAT, NOT THE ONE YOU LIKE.' : c.season === 'summer' ? 'DRINK WATER. I KNOW YOU. YOU FORGET.' : 'HERE THE GUTTERS ARE FULL AND I AM UP THE LADDER MOST AFTERNOONS, WHICH I AM TOLD I AM TOO OLD FOR.'}`)),
  L('dad5', 'dad', 5, 31, 7, c => P(
    `THE PORCH. I HAVE DECIDED TO REBUILD THE PORCH.`,
    `YOU WILL REMEMBER THE THIRD STEP. EVERYBODY REMEMBERS THE THIRD STEP. YOUR MOTHER CALLED IT "THE DOORBELL" BECAUSE YOU COULD HEAR ANYONE COMING. I WAS GOING TO FIX IT IN 1998. THEN IN 2004. LAST WEEK THE MAILMAN WENT THROUGH IT UP TO THE SHIN AND WAS VERY DECENT ABOUT IT, SO NOW IT IS A MATTER OF HONOR.`,
    `YOUR GRANDFATHER SUPERVISES FROM A LAWN CHAIR. HIS SUPERVISION CONSISTS OF SAYING "MEASURE TWICE" EVERY TIME I PICK UP THE SAW. I HAVE MEASURED SOME BOARDS NINE TIMES.`,
    c.job ? `HOW IS THE WORK. ARE THEY TREATING YOU FAIRLY. IF THERE IS A BOSS WHO SHOUTS, LET THEM SHOUT, DO THE JOB WELL AND WRITE DOWN THE DATE. THAT IS NOT CYNICISM. THAT IS THIRTY-ONE YEARS IN A UNION.` : `STILL NO JOB, NORA SAYS. I AM NOT WORRIED AND YOU SHOULD NOT BE. BUT GO AND LOOK AT THE BOARD AGAIN TOMORROW. SOMETHING IS ALWAYS PINNED UP ON A MONDAY.`,
    c.fountain ? `AND WHAT IS THIS I HEAR ABOUT A FOUNTAIN. NORA SENT A CLIPPING. "NEWCOMER GETS PLAZA FOUNTAIN RUNNING AFTER YEARS." I READ IT TO THE SPARE PARTS AT BOWLING. HAROLD CRIED AGAIN. I AM PROUD OF YOU. I WILL ONLY SAY IT THE ONCE.` : c.seen.cityhall ? `NORA SAYS YOU HAVE BEEN IN AND OUT OF THE CITY HALL. GOOD. KNOW WHERE YOUR PAPERWORK LIVES.` : `GET YOURSELF DOWN TO THE CITY HALL AND GET WHATEVER CARD THEY GIVE RESIDENTS. A PERSON SHOULD BE ON A LIST SOMEWHERE.`,
    `THE NEW THIRD STEP DOES NOT CREAK. I STOOD ON IT A LONG TIME. I HAVE NOT DECIDED HOW I FEEL ABOUT THAT.`), { enc: { kind: 'photo' }, note: 'A photograph is tucked inside: the old porch, half rebuilt, Granddad in the lawn chair pointing at something.' }),
  L('dad6', 'dad', 6, 40, 8, c => P(
    c.wrote >= 2 ? `YOU WRITE A GOOD LETTER. I DID NOT KNOW THAT ABOUT YOU. I KEEP THEM IN THE DRAWER WITH THE TRUCK PAPERS, WHICH IS THE DRAWER FOR THINGS THAT MATTER.` : `A SHORT ONE FROM ME, SINCE THE ONES FROM YOU ARE SHORT TOO. THAT IS A HINT. I DO NOT HAVE MANY HINTS IN ME, SO TAKE IT.`,
    `PIE CRUST. I DID IT. CARD ELEVEN. IT SAYS "COLD HANDS, COLD BUTTER, DO NOT FUSS". I FUSSED. THE FIRST ONE WAS A ROOF SHINGLE. THE SECOND ONE YOUR GRANDFATHER ATE TWO SLICES OF AND ASKED WHO MADE IT, WHICH FROM HIM IS A STANDING OVATION.`,
    `ON THE BACK OF THE CARD, IN PENCIL, SHE HAD WRITTEN: "FRANK WILL NEVER READ THIS." WELL.`,
    c.rich ? `NORA SAYS YOU ARE DOING ALL RIGHT FOR MONEY. PUT SOME AWAY WHERE YOU CANNOT SEE IT. NOT BECAUSE SOMETHING WILL GO WRONG. BECAUSE SOMETHING WILL GO RIGHT ONE DAY AND YOU WILL WANT TO SAY YES TO IT.` : `IF THE MONTH IS LONGER THAN THE MONEY, THAT IS NORMAL AT YOUR AGE AND AT MINE. COOK A POT OF SOMETHING ON SUNDAY AND EAT IT TILL WEDNESDAY. CARD NINE. I WILL COPY IT OUT FOR YOU.`,
    `GERTRUDE PASSED INSPECTION. THE MAN SAID "I DO NOT KNOW HOW" AND SIGNED THE FORM.`,
    c.season === 'winter' ? `IT HAS SNOWED HERE. I SHOVELED THE WALK AND MRS. VARGA'S WALK AND SHE SENT OVER A STRUDEL THE SIZE OF A FIRE LOG.` : `THE PORCH IS FINISHED. FOUR STEPS, NO DOORBELL. I HAVE HUNG A REAL ONE. IT IS NOT THE SAME BUT THE MAILMAN LIKES IT.`), { enc: { kind: 'recipe' }, note: 'A recipe card, copied out in careful capitals, is clipped to the letter.' }),
  L('dad7', 'dad', 7, 50, 9, c => P(
    `I HAVE BEEN THINKING I MIGHT COME AND SEE IT. MAPLE BAY. NOT TO STAY. TO SEE.`,
    `YOUR MOTHER GREW UP THERE AND IN THIRTY-SIX YEARS I NEVER ONCE WENT WITHOUT HER TO TELL ME WHAT I WAS LOOKING AT. "THAT IS WHERE I FELL OFF THE BICYCLE. THAT IS WHERE NANA'S TEAROOM WAS." I DO NOT KNOW IF I CAN WALK DOWN THOSE STREETS WITH NOBODY NARRATING.`,
    c.seen.fishmarket || c.seen.lighthouse || c.seen.hotel ? `BUT YOUR LETTERS HAVE STARTED TO DO IT. THE HARBOR, THE LIGHT, THE TRAINS UP ON THEIR BRIDGE. I READ THEM AND I THINK: ALL RIGHT. THERE IS SOMEBODY THERE NOW WHO COULD TELL ME WHAT I AM LOOKING AT.` : `SO HERE IS WHAT I WOULD LIKE. GO AND LOOK AT THE HARBOR FOR ME, AND THE LIGHTHOUSE, AND WRITE DOWN WHAT YOU SEE. PRACTISE THE NARRATING. THEN I WILL COME.`,
    `YOUR GRANDFATHER SAYS HE IS COMING TOO AND THAT HE WANTS TO SEE "A PROPER POST OFFICE WITH A SORTING FLOOR". I TOLD HIM WE ARE NOT GOING ALL THAT WAY TO LOOK AT A POST OFFICE. HE SAID "SPEAK FOR YOURSELF".`,
    c.home ? `IS THERE ROOM AT ${c.home.toUpperCase()} FOR A CAMP BED. I DO NOT NEED MUCH. I NEED A CHAIR AND A WINDOW.` : `FIND OUT WHAT A ROOM COSTS AT THAT BIG HOTEL. THEN SIT DOWN, AND TELL ME.`,
    `NO DATE YET. THE SPARE PARTS ARE IN THE PLAYOFFS, GOD HELP US. BUT SOON.`,
    `YOU DID A BRAVE THING, GOING. I SHOULD HAVE SAID SO AT THE AIRPORT INSTEAD OF TALKING ABOUT YOUR SHOELACES.`)),

  /* ------------------------------------------------------------------ GRANDDAD EMMETT */
  L('gramps1', 'gramps', 1, 4, 0, c => P(
    `Your father says I am to let you settle before I write. I have let you settle for the better part of a week, which at my age is a considerable investment.`,
    `Now then. You have gone to a town with a real post office, and I want you to walk into it for me. I worked forty years for the Railway Mail Service, sorting letters in a car doing sixty miles an hour with one hand on the case and the other on my hat, and in all that time the Maple Bay bag was the tidiest on the line. Somebody down there tied a good knot. I always meant to go and shake his hand.`,
    `So go in. Smell it. A post office smells of paper, gum and floor wax, and if it does not, something has gone wrong with the country. See if they still have the brass boxes. See if there is a desk with a pen on a chain. Then write to me AT that desk, so the letter starts its journey from the proper place.`,
    `A letter, my dear, is a visit that fits in a pocket. The telephone is a fine thing, but nobody ever kept a telephone call in a shoebox for fifty years.`,
    `I enclose five dollars. This is for ice cream and for no other purpose. I shall expect a full report on the flavour.`,
    c.season === 'winter' ? `P.S. Yes, ice cream in winter. Character is built in the cold.` : `P.S. The tomatoes are in. Mr. Pruitt next door has put his in too, a full week early, the showoff.`), { enc: { kind: 'money', n: 5 }, note: 'A five-dollar bill, ironed flat, is pinned to the page with a dressmaker\'s pin.' }),
  L('gramps2', 'gramps', 2, 11, 6, c => P(
    c.wrote ? `Your letter arrived Tuesday by the second delivery and I have read it four times, once aloud to your father, who pretended to be busy with a fuse.` : `No letter yet. I do not scold. I merely mention that I walk to the box twice a day and that my knee keeps a careful account of each trip.`,
    `Since you ask (you did not ask), I shall tell you about the Night Mail. We left the junction at ten past eleven. Six of us in the car, the pouches hanging from the ceiling like hams, and at every little station that did not rate a stop there stood a crane with a bag on it, and we would swing out an iron arm and CATCH it, at speed, in the dark. If you missed, that town got no mail, and you got a talking-to from a man named Ferris that you could feel in your teeth.`,
    `I never missed Maple Bay. I mention it only for the record.`,
    c.seen.cityhall ? `I am told your City Hall keeps an archive. Good. A town that keeps its paper keeps its memory.` : `Find out whether your town keeps an archive. A town that keeps its paper keeps its memory.`,
    `The tomato situation. Mine are a foot high. Pruitt's are fourteen inches and he has taken to measuring them where I can see. I have responded with fish emulsion. The whole street knows about it.`,
    `Tell me one small true thing about your day. Not a big thing. What you had for breakfast will do very well.`), { enc: { kind: 'stamp', id: 'rpo54' }, note: 'A single old stamp slides out of the fold: a mail train at speed, cancelled "R.P.O. 1954". He has written on the back: "For your album. Do not lick it."' }),
  L('gramps3', 'gramps', 3, 19, 7, c => P(
    `I have been thinking about dead letters, as one does at four in the morning.`,
    `When a letter could not be delivered, wrong street or the family moved or the ink had run, we did not throw it away. Never. It went to the Dead Letter Office, where a clerk with a magnifying glass and the patience of a heron would try everything: old directories, the handwriting, a laundry mark on the envelope. They called those clerks "the blind readers", because they could read an address nobody else could see.`,
    `Every post office of any age has a few that beat even them. They sit in a drawer. Postmasters are sentimental and will not burn them. If yours has such a drawer, and you are ever offered the chance to help one of those letters home, TAKE it. There is no finer errand. I delivered one myself in 1961, eleven years late, to a woman in a blue hat. She read it on the step and then she kissed me on the cheek, and I was a married man and I have never mentioned it until now.`,
    c.job ? `Your father says you are working as a ${c.job}. I approve of any job where you can see at the end of the day what you did.` : `Your father says you are still looking for work. In my day a post office was always hiring. Ask.`,
    `Pruitt has put up a little fence around his tomatoes. A FENCE. As if I would stoop.`,
    `I would stoop, mind you, if my knee allowed.`)),
  L('gramps4', 'gramps', 4, 27, 7, c => P(
    c.sent ? `Well. The parcel. I have it here on the bed. ${c.sent.charAt(0).toUpperCase() + c.sent.slice(1)}, all of it wrapped by somebody who has clearly never tied a parcel knot in their life, and I would not change a single lump of that tape. It is on my wall and on my shelf, and one part of it, I confess, I have already eaten.` : `Your father tells me he has asked you for a parcel on my behalf. I am mortified. I also take a size nine and a half slipper, should that be useful to know.`,
    `Do you know how a parcel was weighed in 1950? A brass beam scale with a sliding poise, and the clerk would tap it along with one fingernail, tick tick tick, until the beam floated level. A good clerk could guess within half an ounce before the parcel touched the pan, and would announce the guess to the queue for sport. I once guessed a wedding cake to the dram.`,
    c.seen.lighthouse ? `And you have been up the lighthouse! Your father read it out. A lamp like that is the same business as mine was, when you think of it. It says to people far away: here we are, this way, you are not lost.` : `Have you been out to that lighthouse yet? A lamp like that is the same business as mine was. It says to people far away: here we are, this way, you are not lost.`,
    `The knee is no better. The doctor says "at your age". I told him my other knee is exactly the same age and gives no trouble at all.`,
    `Tomatoes: first blush of red on mine yesterday. Pruitt's are still green as envy. I sat on the porch a full hour, where he could see me, saying nothing.`), { enc: { kind: 'item', id: 'post_flower' }, note: 'Pressed between two squares of blotting paper: a four-leaf clover. "Found by the tomato bed. You may need it more than I do."' }),
  L('gramps5', 'gramps', 5, 36, 8, c => P(
    `Your grandmother and I wrote to each other every day for two years before we married. Seven hundred and some letters. I was on the mail cars and she was teaching school in a town I passed through at ten past two in the morning, and do you know, I sorted her letters to me WITH MY OWN HANDS, in the dark, going sixty. I knew her envelope by the feel of it. I would set it to one side and finish the case first, because the mail comes before the mailman, and then I would read it by the lantern while the others slept.`,
    `I tell you this because your father says you have ${c.friends >= 4 ? 'made a great many friends' : c.friends >= 1 ? 'made a friend or two' : 'not yet found your people'} down there, and I want you to know how it is done. ${c.friends >= 1 ? 'You keep them the way you keep a garden. A little, often.' : 'You do it a little at a time. You say good morning to the same person at the same counter every day for a month, and one morning they tell you something true.'}`,
    `You can post a present to someone across town, did you know? It need not be a birthday. A small thing in brown paper, arriving for no reason at all, has started more friendships than any party ever thrown.`,
    c.season === 'autumn' ? `The frost took the last of the tomatoes Thursday. Final count: Pruitt forty-one, your grandfather forty-four. I have had a small card printed.` : c.season === 'winter' ? `Snow on the tomato bed. Pruitt and I have declared a truce until April. He brought soup. It was, I am sorry to report, very good soup.` : `The tomato count stands at Pruitt nineteen, your grandfather twenty-three. He disputes two of mine as "cherry sized". They are tomatoes in the eyes of God.`,
    `Write to me about the weather. An old man likes to know what the sky is doing where his people are.`)),
  L('gramps6', 'gramps', 6, 45, 8, c => P(
    c.wrote >= 3 ? `I have all your letters in a shoebox now, in order, with a rubber band. Your father says I am being morbid. I say I am being a filing clerk, which is the opposite.` : `I shall be brief, because my hand tires and because, forgive me, there is not a great deal from your end to reply TO.`,
    `Here is a thing they never tell you about sorting. You come to know a town without ever setting foot in it. I knew Maple Bay had a Lantern Row and a Quay Street and a Juniper Court. I knew the fish hall got its bills on a Friday. I knew a certain Miss on Tannery Steps got a letter every single week from a ship, in the same blue ink, for three years, and that one week they stopped. I wondered about her for a long time. You wonder, you see. You are not supposed to, but the hands know more than the rule book does.`,
    c.seen.fishmarket ? `Your father tells me you have been in the fish hall itself. Is it true about the auction bell? Tell me everything. Tell me twice.` : `Go and look at that fish hall for me one early morning. I only ever knew it as a name on a bundle.`,
    `Your father talks of bringing me down to visit. I have told him I shall require a window seat, a thermos, and one hour alone in the post office with nobody hurrying me.`,
    `The knee has agreed to the journey in principle.`,
    `It is ${season(c)} where you are. Go and stand in it a minute for me, hat off.`)),
  L('gramps7', 'gramps', 7, 54, 8, c => P(
    `I am eighty-four and I have decided to learn something, to spite the calendar. Mrs. Varga across the road is teaching me the names of the stars, Thursdays, from her back step, with a flask of something Hungarian that she calls medicinal.`,
    c.seen.observatory ? `She says your town has an observatory on a hill and that you have BEEN. I could not get a word of sense out of her for an hour afterwards. She wants to know the size of the mirror. I want to know whether they give you a chair.` : `She says your town has an observatory on a hill. Go, and report. She wants to know the size of the mirror. I want to know whether they give you a chair.`,
    `So far I can find the Plough, the North Star and a thing she insists is a swan. What I like about it is that it is the same mail route every night. The stars come round on schedule. Nothing is ever late, and nothing is ever lost. After forty years of the other kind of delivery I find that very restful.`,
    `Now. A serious word, and then I shall let you go. You went a long way off. Some at this end thought you were running from something. I never did. I sorted a great many letters from young people who had gone a long way off, and I could tell from the envelopes which ones were running AWAY and which were running TO. Yours have always been the second kind. The handwriting leans forward.`,
    `Keep writing. I am not going anywhere. But I have noticed that I check the box three times a day now, and I should like there to be something in it.`), { enc: { kind: 'money', n: 5 }, note: 'Another ironed five-dollar bill. The pin has a note on it: "ICE CREAM. I MEAN IT."' }),

  /* ------------------------------------------------------------------ AUNT JUNE */
  L('june1', 'june', 1, 3, 0, c => P(
    `You have been gone SIX days and I have started four letters and torn up three, because your uncle said the first one was "a bit much" and the second one made ME cry, and the third had gravy on it.`,
    `So this is the sensible one. HOW ARE YOU. Are you eating. Are you WARM. Is there somebody on your stair who would lend you an egg. These are the only three questions that matter in any town in the world, and I want all three answered, in ink.`,
    c.home ? `Nora tells me you are at ${c.home}${c.dist ? `, in ${c.dist}` : ''}, and I have decided it is charming and I will not hear otherwise.` : `Nora is being very mysterious about where you are living, so naturally I have imagined a garret.`,
    `News!! The choir is doing the Fauré for Easter, and I have the solo in the Pie Jesu, because Marjorie Platt has had her tonsils out at SIXTY-ONE, can you imagine. Also the church roof fund stands at eleven hundred dollars. The roof itself stands at an angle.`,
    `I am knitting you something. I shan't say what. It is long and it is not a sock.`,
    `Robin sends love by way of a grunt from behind a door. I have translated.`,
    `Write and tell me EVERYTHING, and if you meet anybody NICE I want their name, their age and what their mother does.`)),
  L('june2', 'june', 2, 10, 6, c => P(
    c.wrote ? `Your LETTER!! I read it standing in the hall with my coat still on. Then I read it to your uncle, then to Marjorie Platt on the telephone, then to the cat, who took it best.` : `Not a word from you, and I am NOT hurt. I am simply sending a box so that you will feel dreadful.`,
    `The box: it is coming separately, because the post office here will not let me put jam in an envelope (I ASKED). There is plum jam from the tree by the garage, the dark sort. There are the oat biscuits you like. There is a tin of the good cocoa. And there is a dishcloth, because I know for a FACT you do not own a decent one.`,
    c.job ? `And you have a JOB, a ${c.job}!! I have told everyone. I told the butcher. He said "who?" but he was pleased, I could tell.` : `Nora says no job yet, and I say GOOD, take your time, you were always the one who walked all round the pool before getting in.`,
    `The roof fund bake sale is Saturday. I am doing the lemon drizzle and the walnut loaf and I am NOT doing a third thing, no matter what Reverend Tibbs says with his eyebrows.`,
    `I have enclosed the drizzle recipe, since you used to stand on a chair and "help". It wants a HOT oven and a COLD heart. You must stab it all over while it is still warm, and no flinching.`,
    `Is there a choir in Maple Bay? There is always a choir. Go and stand at the back. You have a perfectly nice baritone-ish sort of voice, whatever you say.`), { enc: { kind: 'recipe' }, note: 'A recipe card is pinned inside, splashed with something lemony.', parcel: { label: 'A box from Aunt June', gives: [{ item: 'post_jam', qty: 2 }, { item: 'post_biscuits', qty: 1 }, { item: 'post_cocoa', qty: 1 }] } }),
  L('june3', 'june', 3, 18, 7, c => P(
    `DISASTER and TRIUMPH, in that order.`,
    `Disaster: at the bake sale Marjorie Platt (tonsils out, voice BACK, worse luck) put her coffee-walnut right next to my walnut loaf, with a little card that said "the ORIGINAL recipe". Original!! Her mother got that recipe from MY mother, in 1962, in exchange for a hat.`,
    `Triumph: mine sold out by ten past eleven. Hers was still there at noon, sweating.`,
    `The fund is at fourteen hundred and six dollars. The roofer says we need nine thousand. Reverend Tibbs says the Lord will provide. I say the Lord had better like lemon drizzle.`,
    c.friends >= 2 ? `Now. Nora says you have made FRIENDS. Names, please. And is any of them, you know, a FRIEND friend. I am not prying. I am gathering.` : `Now. Have you met anybody yet? You must go where the people are. Markets! Queues! I met your uncle in a queue for a bus that never came, and by the time we gave up we were engaged, practically.`,
    c.season === 'winter' || c.season === 'autumn' ? `It has turned cold here and so I have knitted FASTER. The thing is nearly done. It has a stripe.` : `The thing I am knitting is growing. It has a stripe now. Your uncle asked who it was for, "a giraffe?", and he has been spoken to.`,
    `Did the jam arrive WHOLE? If it leaked on the cocoa I shall write to the Postmaster General.`)),
  L('june4', 'june', 4, 26, 7, c => P(
    c.sent ? `OH, the parcel!! ${c.sent.charAt(0).toUpperCase() + c.sent.slice(1)}!! I opened it on the kitchen table and your uncle and Robin stood round like the three kings. I have put the wrapping paper in my drawer, I don't care how daft that is.` : `Your father has asked you for a parcel of Maple Bay things, and I want it KNOWN that I would also like a parcel of Maple Bay things, and that I asked second only because I am polite.`,
    `IT IS FINISHED. The knitting. It is a SCARF (you guessed, I know you guessed), it is six feet long because I got carried away during a very dull sermon, and it is in the post to you in its own box. It is maple-leaf red with a cream stripe, because Nora told me the colours of your town. If you do not wear it I shall KNOW. Aunts know.`,
    c.seen.hotel ? `Nora says you have been inside the GRAND MAPLE HOTEL. Did you have the afternoon tea? Did they do the little sandwiches with the crusts off? I need to know about the sandwiches.` : `There is a grand hotel in your town, Nora says, with a pianist in the lobby. GO and have the afternoon tea, and write down what is on the stand, top to bottom.`,
    `Choir news: the Fauré went beautifully, until the Pie Jesu, when a pigeon got in. I sang ON. I want that understood. The pigeon and I finished together.`,
    `Roof fund: sixteen hundred and ten.`), { parcel: { label: 'A soft parcel from Aunt June', gives: [{ item: 'post_scarf', qty: 1 }], big: true } }),
  L('june5', 'june', 5, 34, 8, c => P(
    `Sit down, because I am going to be SERIOUS for one paragraph, and then I shall stop.`,
    `When your mother went off to marry your father, she was the first of us ever to leave Maple Bay, and our Mum (your Nana Bea) did not write to her for a whole YEAR. Too proud. Too hurt. Then one day a parcel came with no letter in it at all, just a jar of the plum jam and a tea towel. That was Mum saying sorry, in jam. Your mother cried into the tea towel and then wrote back eleven pages.`,
    `I tell you so that you will know what the jam MEANS. In this family we say the big things with small parcels. If ever you do not know what to write to somebody, put something in a box.`,
    `There. I have stopped.`,
    c.kit ? `Now!! Nora tells me you have found KIT, little Kit Navarro from Alder Street, who used to sing into my wooden spoon. Give her my love, and tell her that her mother still has the spoon.` : `Is it true that little Kit Navarro from Alder Street lives in your town now? She used to sing into my wooden spoon. FIND her. She will want feeding.`,
    c.season === 'winter' ? `ARE YOU WEARING THE SCARF. It is the weather for it.` : `Keep the scarf in a drawer with a bar of soap till the cold comes. NOT lavender. Lavender is for the dead.`,
    `Roof fund: two thousand and FORTY. I did a third cake. Do not tell Reverend Tibbs's eyebrows.`)),
  L('june6', 'june', 6, 43, 8, c => P(
    c.wrote >= 2 ? `I keep your letters in the biscuit tin with the Queen on it, and when Marjorie Platt starts on about her grandson the dentist I get one out and READ it to her.` : `One teeny letter from you would not go amiss, you know. I have a biscuit tin standing ready, and it is EMPTY, and Marjorie Platt's grandson is a dentist.`,
    `Robin has failed the driving test again. It was a hedge this time. The examiner was very kind about it, and so was the hedge's owner. Robin has gone silent and plays the same four chords behind the door. Could you write a line? You were always the one Robin listened to. Do not say I asked.`,
    `Your uncle has taken up bread. There is flour in the PIANO.`,
    c.rich ? `Nora says you are managing nicely for money, which I knew you would, you always did count your Halloween sweets.` : c.broke ? `Nora let slip that things are TIGHT. Darling. There is a ten in this envelope and you are NOT to mention it to your father, who will want to send a twenty and a lecture.` : `Are you managing? Properly? I do not mean "fine". I mean, is there butter.`,
    `There is to be a Midwinter concert, and we are doing carols by CANDLELIGHT, which the fire officer has agreed to on condition that the altos stand well away from the tinsel.`,
    `Roof fund: two thousand nine hundred. The roofer has started returning my calls.`), { enc: { kind: 'money', n: 10 }, note: 'A ten-dollar note, wrapped in a paper napkin with a robin on it.' }),
  L('june7', 'june', 7, 52, 9, c => P(
    `I have a SCHEME, and you are in it.`,
    `Your father talks of visiting Maple Bay "soon", which in your father's mouth means within the decade. Your grandfather wants to see a post office. Robin wants to see anything that is not Pinehollow. And I want to see my MOTHER, who is seventy-eight and stubborn, and my niece Nora, and YOU, and I am not waiting for any of them to organise it.`,
    `So. I am going to book the tickets MYSELF and tell them on the morning. I need three things from you. ONE: what the weather does there in ${c.season === 'winter' ? 'the spring' : 'the season after this one'}. TWO: whether a person can get a decent cup of tea${c.seen.hotel ? ' anywhere other than that hotel' : ''}. THREE: whether there is a pew, a pier or a park bench where an aunt might sit and look at you all for an hour without being told she is staring.`,
    c.home ? `I shall NOT be sleeping at ${c.home}. I have seen how you make a bed. But I shall want to stand in it and say "well!".` : `I shall want to see where you LIVE, and say "well!" in it.`,
    `The roof fund has passed FOUR THOUSAND, and Reverend Tibbs wept at the font.`,
    `You went off so quietly, darling. Not a fuss. I wanted to make a fuss for you, and you did not let me, so I am bringing the fuss down on the train.`,
    `Start saving jam jars. I am not coming empty-handed, and I am not going home empty-handed either.`), { parcel: { label: 'A heavy box from Aunt June', gives: [{ item: 'post_jam', qty: 2 }, { item: 'post_cocoa', qty: 1 }, { item: 'post_biscuits', qty: 2 }], big: true } }),

  /* ------------------------------------------------------------------ COUSIN ROBIN */
  L('robin1', 'robin', 1, 5, 0, c => P(
    `mum is making me write this. she is standing in the doorway. hi mum.`,
    `ok she's gone. so. you actually did it. you actually LEFT. nobody leaves pinehollow. my geography teacher left for a weekend once and they put it in the paper.`,
    `questions, in order of importance:`,
    `1. is it true there's a train that goes OVER the street. 2. is there anywhere to see bands. 3. do people there know what pinehollow is (do not answer this one). 4. is there a hockey team or whatever, the OTTERS?? dez told nora who told mum there's a team called the otters and i need something with an otter on it more than i have ever needed anything in my life.`,
    `things here: same. the vending machine at school now takes cards. that's it. that's the whole news.`,
    `i'm starting a band. it's called WET CEMENT. it's me on guitar and a kid called Dov on a drum (one drum). we know four chords between us and three of them are mine.`,
    c.home ? `mum says you live at "${c.home}" which sounds made up.` : `mum says you live in "an apartment". an APARTMENT. in a CITY. i live in a room with a slanted ceiling and a poster i'm not allowed to put up.`,
    `send a postcard. not a letter, a postcard, with a picture. i'm doing a wall.`)),
  L('robin2', 'robin', 2, 13, 7, c => P(
    c.wrote ? `ok your ${c.tone === 'funny' ? 'letter was actually funny, i laughed in front of mum by accident' : 'thing came'}. it's on the wall. the wall is now: 1 thing from you, 1 bus timetable, 1 drawing of an otter by me.` : `the wall is still empty by the way. just saying. it's a big wall.`,
    `driving test is in two weeks. i can do everything except reversing and roundabouts and "observation". the instructor (Mr. Kettle, he has a moustache like a draught excluder) says i drive "like someone being chased". i said maybe i AM being chased. he wrote something down.`,
    `WET CEMENT UPDATE: we have a song. it's called "third step" and it's about your porch. it goes: the third step / the third step / don't step on the third step. that's the chorus. also the verse.`,
    c.seen.arena ? `nora told mum you've BEEN to the arena. the actual arena. where the OTTERS are. i am being so normal about this. what do they SELL. do they have a scarf. a pennant. a foam otter. i have $11.` : `have you been to see the otters yet. you LIVE there. if i lived in a town with an otter team i would simply never be anywhere else.`,
    c.job ? `mum says you're a ${c.job} now. do you get a uniform. do you get to tell people what to do. these are the two things i'd want from a job.` : `mum says you don't have a job yet. honestly, goals.`,
    `Dov says hi. Dov has never met you. Dov says hi to everyone.`), { enc: { kind: 'item', id: 'post_pick' }, note: 'Taped to the page: a green guitar pick with a bite mark in it. "official WET CEMENT merch. first one ever."' }),
  L('robin3', 'robin', 3, 21, 7, c => P(
    `i failed.`,
    `it was the roundabout. i went round it three times because i couldn't work out when to get off. Mr. Kettle just kept saying "any exit, Robin. any exit at all." and then on the third lap a man on the pavement WAVED at us.`,
    `mum made a cake about it. it says BETTER LUCK NEXT TIME in icing, which is the worst thing a cake has ever said to me.`,
    `anyway. it's fine. i'm fine. i'm writing a song about it called "any exit".`,
    c.sent ? `OH also. THE PARCEL. i know it was for granddad, but i was there when he opened it and i saw ${c.sent} and i just want you to know i am not jealous. i am so not jealous that i have written "not jealous" on my hand.` : `dad (your uncle, whatever) says uncle frank asked you for a parcel of maple bay stuff for granddad. if an otter thing happened to fall into that box, no one would ask questions.`,
    `what's it like, actually. not the stuff you tell the adults. like, when you walk down the street there, do people look at you? here everyone looks at you. they know what you had for lunch. i went to the shop for gum and Mrs. Platt asked how the roundabout went.`,
    c.friends >= 2 ? `mum says you have friends there already. how. HOW. what do you SAY to people.` : `do you know anyone yet, or is it just you and the train.`,
    `resit is in three weeks. don't tell me it'll be fine. tell me something else.`)),
  L('robin4', 'robin', 4, 29, 7, c => P(
    c.wrote >= 2 ? `ok so i read your letter in the bus shelter so mum wouldn't watch my face while i did it.` : `you never write but i'm writing anyway because Dov is at his nan's and there's literally nobody else.`,
    `WET CEMENT played our first show. it was in Dov's garage. the audience was: Dov's nan, a neighbour who came to complain and then stayed, and a dog. we played "third step" and "any exit" and then "third step" again, because the dog liked it.`,
    `Dov's nan said we were "very loud and very brave". i'm putting that on the poster.`,
    c.kit ? `MUM SAYS YOU KNOW KIT NAVARRO. kit navarro who went to art school. kit navarro who has a GUITAR CASE with STICKERS. ask her how you finish a song. not for me. for a friend. the friend is me.` : `mum says a girl from here called kit moved to maple bay years ago to do music, and i think about that a normal amount (constantly).`,
    `the wall has ${c.wrote >= 2 ? 'a whole maple bay corner now' : 'room'}. i want the lighthouse one. and a tram. is it a tram or a train. be specific.`,
    c.seen.aquarium ? `also you went to an AQUARIUM?? with OTTERS in it?? real ones?? i need you to go back and look at one for me for like ten minutes and then describe its whole deal.` : `nora says there's an aquarium there with real otters. if you haven't been yet i genuinely don't understand how you spend your time.`,
    `resit in nine days. i've been practising the roundabout on my bike. the same man waved.`)),
  L('robin5', 'robin', 5, 38, 8, c => P(
    `HEDGE.`,
    `it was a hedge this time. i did the roundabout PERFECTLY, first exit, mirror signal manoeuvre, Mr. Kettle actually said "good". and then i was so happy about it that i reversed into the Hendersons' hedge. gently. it was a gentle hedge incident. Mr. Henderson came out and said "it'll grow back" and that was somehow worse than shouting.`,
    `so that's two.`,
    `mum thinks i'm upset about the test. i'm not upset about the test. i'm upset because everybody here already knows, and they'll know FOREVER. when i'm forty i'll walk into the shop and someone will go "mind the hedge".`,
    `is that why you left? you don't have to say. but there, nobody knows what you were like when you were nine, right? you just get to turn up and be whoever.`,
    c.wrote >= 1 ? `you said something in your last one that i keep thinking about. i'm not going to say which bit. it was a good bit.` : `you could write back to this one. just this one.`,
    `i'm saving up. i have $46. the bus to the city where the trains go from is $19, and then i don't know how much. i'm not running away, mum, if you're reading this over my shoulder. i'm PLANNING A VISIT.`,
    `third test is next month. Mr. Kettle says third time lucky. he said it like someone who's had to say it a lot.`), { enc: { kind: 'item', id: 'post_bracelet' }, note: 'A knotted bracelet in green and white thread falls out. "otters colours. i made two. don\'t make it weird."' }),
  L('robin6', 'robin', 6, 47, 8, c => P(
    `I PASSED.`,
    `I PASSED I PASSED I PASSED. three minors. one of them was "excessive caution at a roundabout", which i think is fair. Mr. Kettle shook my hand and then sat down on the kerb for a bit.`,
    `mum cried. dad let me drive to the shop and back, and didn't hold the door handle the whole way, just for most of it. granddad said "about time", and then gave me two dollars for petrol like it's 1955.`,
    `WET CEMENT has a new song, it's called "three minors". Dov's got a second drum.`,
    c.sent ? `also your parcel stuff is still the best thing on the wall. Dov thinks i've BEEN to maple bay. i haven't corrected him.` : `also i now have a licence and no otter merchandise, and one of those feels fixable from your end.`,
    c.job ? `do you like it? being a ${c.job}? like actually? everyone here keeps asking what i want to DO, and i say "music", and they do a face.` : `mum says you're still figuring out the job thing, and honestly that makes me feel better about everything.`,
    `ok. here's the plan. aunt june (mum) is plotting a family trip to maple bay. she thinks it's a secret. everyone knows. i'm in. i've got $61.`,
    `when i get there i want to: 1. go on the train that goes over the street. 2. see an otter (either kind). 3. meet kit navarro and be cool about it. 4. see where you live and not say anything dumb.`,
    `you have to promise not to tell anyone there about the hedge.`)),
  L('robin7', 'robin', 7, 56, 9, c => P(
    `this one's short because it's 1am and i've got school.`,
    `i played "any exit" at the school talent thing. on my own, because Dov had a dentist appointment (Platt's grandson, small world, terrible world). i nearly didn't. i stood behind the curtain thinking about the roundabout and the hedge and everybody knowing everything, and then i thought about you just getting on a plane with one bag.`,
    `so i went out and played it. i messed up the second verse. NOBODY NOTICED. they clapped anyway. Mrs. Varga was there for some reason, and she stood up. just her. she stood up on her own and clapped like she was at the opera.`,
    c.wrote >= 2 ? `i keep your letters in my guitar case. that's where the important stuff goes: picks, letters, one emergency biscuit.` : `i know you're busy. i know letters are a lot. but if you ever do send one, i've got a place for it.`,
    `i think i get it now, the leaving thing. it's not that the place is bad. you just want to find out who you are when nobody's holding the door handle.`,
    c.season === 'winter' ? `it's snowing here. i drove in it. i was EXCELLENT.` : `it's raining here. i drove in it. i was EXCELLENT.`,
    `see you when the secret trip that everyone knows about happens.`,
    `save me an otter.`)),

  /* ------------------------------------------------------------------ SAM */
  L('sam1', 'sam', 1, 6, 0, c => P(
    `I am typing this on the station Olivetti at ten to three in the morning, between the farm report and a record that runs eleven minutes. That's why there are no corrections. I can't see the keys and I refuse to turn on the big light.`,
    `So you went. I drove past your dad's place Tuesday out of habit and had my hand on the horn before I remembered. I honked anyway. Your grandfather waved from the porch like I was a parade.`,
    `Things you should know. The Rialto is closing in the spring. They're showing everything they've got in the vault first, one a night, and I'm going to all of them. Last night was a western with a reel missing. A man walks into a saloon, and then he's married.`,
    `I've got the night desk full time now, midnight to six. It's me, the transmitter, and a listener called Doreen who rings at four every morning to request the same song and tell me about her feet.`,
    c.kit ? `Your sister tells me you ran into KIT. Kit Navarro! Tell her she still has my copy of "Marquee Moon", and that I've decided to be gracious about it for one more year.` : `Isn't Kit Navarro in Maple Bay somewhere? Art school, then a bar, last I heard. If you find her, tell her she still has my copy of "Marquee Moon".`,
    `Write back. Use a pen, I want to see whether your handwriting got any better when you crossed the state line.`,
    `It's 2:58. The record's ending. Doreen will be dialling.`)),
  L('sam2', 'sam', 2, 14, 7, c => P(
    c.wrote ? `Your letter got here Thursday and I read it on the air. Not the whole thing. The bit about ${c.job ? 'the job' : c.home ? 'your place' : 'the town'}. I said "a listener in Maple Bay writes" and then I played you a song. Doreen rang to ask who you were. I told her you were nobody. She said "they don't sound like nobody".` : `No letter yet. I'm not sore. I've told Doreen you're a very busy and important person in a faraway city, and she's started asking after you by name.`,
    `The Rialto, night six: a musical. The sound's gone on reel two, so for twenty minutes forty people in tap shoes dance in total silence. Old Mr. Abel in the front row started humming along to it. Then the row behind him. By the end the whole house was humming a tune none of us knew. Best night at the pictures I've ever had.`,
    c.seen.museum || c.seen.aquarium || c.seen.hotel ? `Your sister's been telling people about all the places you've been turning up in. You always did walk into a building like you'd been invited.` : `Have you been INTO anything yet? A museum, a big hotel, anywhere with a ceiling worth looking at? You always did walk into a building like you'd been invited. Don't lose that.`,
    `I've been offered days. The breakfast show, real hours, listeners with jobs. I said I'd think about it. The thing is, at night it's mine. Nobody in a tie has ever been awake to tell me what to play.`,
    `What's the radio like there? Find the smallest station on the dial and tell me what it's playing at 3 a.m. I need to know I'm not the only one.`,
    `Sign-off's coming. I always say "sleep well, Pinehollow, somebody's up". Last night I nearly said your town instead.`)),
  L('sam3', 'sam', 3, 22, 7, c => P(
    `Something for you, under separate cover, as they say. It's a tape. An actual cassette, so you'll need to find something to play it on, and good luck to you.`,
    `Side A is everything I played the week you left. Side B is the Rialto. I held the station recorder up in the back row for the last five nights, so it's mostly projector and coughing and Mr. Abel humming, and it's the best thing I've ever recorded.`,
    c.job ? `How's the work? You said ${c.job}. I've been trying to picture it. In my head you're very good at it and slightly annoyed by everyone, which is how you did everything at school.` : `Still between things? Good. I mean it. Everyone I know who went straight into a job at twenty-two is still in it and can't tell you why.`,
    `I turned down the breakfast show.`,
    `I haven't told anyone but you and Doreen. My mother thinks I'm "considering it". The station manager thinks I'm cracked. But I sat in the booth at four in the morning with the meters twitching and I thought: there are eleven people awake in this county and I know most of their names. Who knows the names of the people listening at breakfast?`,
    c.friends >= 3 ? `You'll have a crowd there by now. You collect people. Just don't replace me with anyone who has better taste.` : `Have you found your eleven people yet? Doesn't have to be eleven. Three will do. One, if it's the right one.`,
    `Tell me what the place sounds like. Never mind what it looks like, I've seen the postcards.`), { parcel: { label: 'A padded envelope from Sam', gives: [{ item: 'post_mixtape', qty: 1 }] } }),
  L('sam4', 'sam', 4, 30, 7, c => P(
    c.sent ? `Your parcel. I opened it in the booth, on air, with the mic live, which was a mistake, because I said a word about ${c.sent} that I'm not licensed to broadcast. Doreen rang in to say she'd heard worse. Thank you. I mean it. It's on the shelf over the turntables, where the awards would go if we'd won any.` : `I'll be honest, I check the station pigeonhole for anything with a Maple Bay postmark. Mostly it's a seed catalogue. I've started reading the seed catalogue.`,
    `The Rialto's gone dark. Last picture was a comedy from 1941 and nobody laughed, not once. We just sat there being fond of it. Afterwards Mr. Abel stood up and thanked the screen, out loud, for fifty-eight years. Then he asked me to walk him home, and he told me the whole way about a girl he took there in 1950 to see a film he can't remember.`,
    `They're turning it into a carpet warehouse.`,
    c.seen.cityhall ? `Your sister says your town takes these things to a council, and that people actually stand up and say their piece. Imagine. Here we just sigh.` : `Does your town fight for things? Old buildings, fountains, that kind of trouble? Here we just sigh.`,
    `I kept one thing. The projectionist let me have the house lights dimmer, the big brass one. It's wired to nothing, it sits on my desk, and when the night's long I turn it down slowly and pretend.`,
    `What have you kept? From here, I mean. You left with one bag. I've been wondering what made the cut.`,
    `It's ${c.season === 'winter' ? 'snowing' : 'raining'} on the transmitter. You can hear it on the air if you know to listen.`)),
  L('sam5', 'sam', 5, 39, 8, c => P(
    `Doreen didn't ring.`,
    `Four o'clock came and the phone just sat there. I played her song anyway. Four-thirty, nothing. By five I'd played it three times, and a man called in to ask if the record was stuck.`,
    `I've never met her. Six years of four o'clocks and I don't know her last name or her street, only that she has bad feet and a sister in Tulsa and that she thinks I talk too fast. I sat there thinking about how you can know somebody down to their bunions and still not know where to send a card.`,
    `She rang the next night. She'd been at her niece's. She said, "Did you miss me?" and I said no, and she laughed for about a minute.`,
    `But it got me thinking about you, obviously. It was the same kind of quiet.`,
    c.wrote >= 2 ? `Your letters help. I want that on the record. They come in at the back of the station with the bills, and I save them for the eleven-minute record.` : `A line now and then would help, is what I'm saying. Doesn't have to be good. Doreen's never said anything good in six years, and I'd be lost without her.`,
    c.seen.lighthouse ? `Your sister says you've been up the lighthouse. That's my job, you know, only with a bulb. Somebody's up. This way. You're not lost.` : `There's a lighthouse there, isn't there? Go up it some night for me. That's my job, only with a bulb. Somebody's up. This way. You're not lost.`,
    `I got her address in the end. I just asked. Turns out you can do that.`)),
  L('sam6', 'sam', 6, 48, 8, c => P(
    `News, and you're the first to get it, because Doreen was asleep.`,
    `There's a station in the city (not yours, the one two hours up the line) that wants a night man. A real signal. Forty thousand watts. On a clear night you could hear it at the coast, they say, which by my map means you could hear it in Maple Bay if you put the radio in the window and held your breath.`,
    `I've said I'll go up and talk to them.`,
    `Everyone here will say I'm doing what you did. I'm not. You went toward something. I'm just finding out whether I can talk to more than eleven people without changing my voice.`,
    c.job ? `How did you know, when you took the ${c.job} job? Or didn't you? Tell me you didn't. I'd like to hear from one person who just did it and found out afterwards.` : `How did you know it was time to go? Or didn't you? Tell me you didn't know. I'd like to hear from one person who just went and found out afterwards.`,
    `My mother's already told the whole street I've "got the job", which I haven't, so now I either get it or I move to Peru.`,
    c.kit ? `Tell Kit. She'll laugh. She always said I'd die in that booth, and they'd find me in the spring with the farm report still going.` : `If you ever do run into Kit Navarro, tell her. She always said I'd die in that booth.`,
    `If I go, who tells Pinehollow that somebody's up?`,
    `It's 3:40. I'm going to play something long.`)),
  L('sam7', 'sam', 7, 57, 9, c => P(
    `I got it.`,
    `I start in six weeks. Midnight to five, forty thousand watts, a booth with a window. I told Doreen on the air. I said, "this next one goes out to a lady with bad feet, who I'm going to miss," and the phone rang before the needle hit the record. She said, "Well, I'll just have to get a better radio, won't I?"`,
    `Mr. Abel's nephew is taking the night desk here. He's nineteen and he plays everything too loud, and he'll be fine.`,
    `Here's the thing I wanted to tell you. On my last night I'm going to play the Rialto tape, side B: the projector, and the coughing, and all of them humming. The whole eleven minutes, to whoever's up. Then I'll say it one more time, and then I'll drive.`,
    `And when I'm set up at the new place, on the first clear night, I'm going to say: "Good evening to the coast. I know one of you is listening." So put a radio in the window${c.home ? ` at ${c.home}` : ''}. I don't know which night. You'll have to leave it on.`,
    c.wrote >= 3 ? `You wrote me through this, you know. You didn't mean to. You just kept describing a place where you'd turned up as a stranger and it had gone all right.` : `Write to me at the new address when I've got one. I'll want a familiar hand in the pigeonhole.`,
    `Sleep well, Maple Bay. Somebody's up.`)),

  /* ------------------------------------------------------------------ MRS. VARGA */
  L('varga1', 'varga', 1, 7, 0, c => P(
    `You will be surprised to hear from me, and I am a little surprised to be writing. But I have watched the house across the road for thirty years, and it has a different shape with you gone from it. The upstairs window on the left no longer lights at midnight. I had not realised that I steered by it.`,
    `I taught you geography for three years, and you were a poor student of capitals and a very fine student of maps. You never cared what a place was called. You wanted to know which way its rivers ran. I have always thought that the better question.`,
    `So. Which way does the river run in Maple Bay? I have looked it up, of course. I should like to hear it from someone standing beside it.`,
    `I am told the town has a lighthouse, an observatory on its highest ground, and a glass house full of plants from four climates. For a town of that size this is an embarrassment of riches, and I expect you to visit all three, and to write to me about each. Consider it homework, set thirty years late.`,
    `Your father is well. He is cooking. I have been brought a meat loaf, and I have thanked him for it.`,
    `Admiral, the cat, has taken to sitting on your gatepost in the evenings. I do not say that he is waiting. Cats do not wait. He is merely there.`,
    `I enclose a flower from the verge by your gate. I press them. It is an old woman's vice.`), { enc: { kind: 'item', id: 'post_flower' }, note: 'A pressed speedwell, blue as an inkblot, mounted on a card in tiny upright capitals: VERONICA CHAMAEDRYS. QUARRY ROAD.' }),
  L('varga2', 'varga', 2, 16, 8, c => P(
    c.wrote ? `Thank you for your letter. Your handwriting has not improved, but your sentences have, which is the more important of the two.` : `I have not had a reply. I do not mind. A teacher is used to setting work that is not handed in.`,
    c.seen.conservatory ? `You have been to the glass house! Then you will have stood in four climates in an afternoon, which took me sixty years and a great many railway tickets. Tell me: is there a fig? There is always a fig. And is there one plant, there always is one, that has been in the building longer than any of the gardeners?` : `Have you been yet to the glass house in the park? Go on a cold day. Step from the temperate room into the tropical and stand quite still. For one moment your spectacles will fog and you will be nowhere at all. I recommend it highly.`,
    `My late husband, Lajos, collected atlases. Forty-one of them. When he died I meant to give them to the school, and I find that I cannot. Each has his pencil in it, small crosses on the places he meant to go. He went to almost none of them. He was a dentist in Pinehollow for forty years, and he travelled every evening from six until nine in the green chair.`,
    `There is a cross on Maple Bay. I found it on Tuesday. 1971 atlas, plate 34. I do not know why. I have decided to believe that it was the lighthouse.`,
    `Your father's truck stopped outside my gate. I took him tea. He is a proud man and a poor mechanic, and I am fond of him.`,
    `It is ${season(c)} with you. Describe to me one tree.`)),
  L('varga3', 'varga', 3, 24, 7, c => P(
    c.seen.lighthouse ? `So you have climbed the lighthouse. Thank you. I read your family's account of it twice over the fence. Now I must have the facts. The colour of the light. Whether it turns, or flashes. How far it is said to carry. A lighthouse has a signature, you know, a rhythm that belongs to it and to no other, so that a sailor may read the coast in the dark as you would read a street sign.` : `You have not yet been to the lighthouse, or you have not told me. Go. And when you do, find out its signature. Every light has a rhythm that belongs to it and to no other, so that a sailor may read the coast in the dark as you would read a street sign.`,
    `I collect them. Not lighthouses, I have not the room. Postcards of lighthouses. I have one hundred and twelve. Lajos began it, to tease me, because I said once that I should like to live in one, and he said I would rearrange the sea.`,
    `I have none from Maple Bay.`,
    `I do not ask. I merely observe that there is a gap in the album between Mallaig and Marblehead, and that it is precisely the size of a postcard.`,
    `Young Robin was at my gate yesterday with a guitar, asking whether I had ever wanted to leave Pinehollow. I said: every day for the first ten years, and never since. Robin said that was "bleak". I said it was the opposite of bleak, and that one day it would be clear why. Then I gave the child a biscuit.`,
    `Admiral has caught a mouse and left it on your father's new porch. It is a housewarming, I think. Your father has not seen it in that light.`), { enc: { kind: 'item', id: 'post_flower' }, note: 'A pressed sea-pink on a card: ARMERIA MARITIMA. "From Lajos\'s album, 1968. It grew by a lighthouse. I can spare it."' }),
  L('varga4', 'varga', 4, 33, 8, c => P(
    c.sent ? `Your father came across the road with ${c.sent} to show me. He carried them on a tea tray, as though they were communion. I have not seen him so pleased since the truck passed its inspection.` : `I hear that a parcel is requested of you. Parcels are an art. Lajos wrapped like a surgeon, every corner square. I wrap like a woman escaping a fire. Both arrive.`,
    `I have been teaching your grandfather the stars. He is an excellent pupil, for he has a sorter's mind: everything must have its pigeonhole. He has named a small constellation of his own, beside Cygnus, which he calls The Mailbag. I have not corrected him. Astronomers have done worse.`,
    c.seen.observatory ? `And you have been to the observatory. Then you have looked through a serious instrument, and you will know the feeling: that the sky is not a ceiling at all but a distance. I felt it at nineteen in Budapest, and I have never quite got over it.` : `When you go to the observatory, and you must, do not look first at whatever they tell you to look at. Look at the dark between. The first time you understand that it is not a ceiling but a distance, you will want to sit down.`,
    `May I say something that a teacher ought not? You were not happy here in your last year. I saw it from across the road. You walked like someone carrying a full glass. I said nothing, because it was not my place, and I have regretted that a little.`,
    c.friends >= 2 ? `I am told that you have friends there now, and that you walk differently. Nobody told me the second part. I infer it.` : `I hope that someone there has noticed how you walk. If not yet, give it time. Towns are slow readers.`,
    `Admiral sends nothing. He is a cat.`)),
  L('varga5', 'varga', 5, 42, 8, c => P(
    c.wrote >= 2 ? `Your letters are in the drawer of the hall table, with the good scissors and Lajos's reading glasses. It is the drawer for things I may need suddenly.` : `I write again without a reply, which is forward of me. Put it down to the season.`,
    `I have done something reckless. I have taken down the 1971 atlas, and I have begun to go to the places with crosses. Not in person. I am seventy-nine. But I write to their post offices. "To the Postmaster. Dear Sir or Madam, my late husband once wished to visit your town. Would you be so kind as to tell me one true thing about it?"`,
    `Eleven have answered. A postmistress in the Faroe Islands sent a puffin feather. A man in Tasmania sent a four-page letter about his apricots. People are very good, on the whole, when you ask them a small question plainly.`,
    `I have not written to the postmaster of Maple Bay. I have you.`,
    `So. One true thing, please, about each of the following. The ${c.seen.fishmarket ? 'fish hall, which I am told you have seen at its early-morning best' : 'harbor before seven in the morning'}. The ${c.fountain ? 'fountain, which I hear has been made to run again, and that you had a hand in it, and I am not in the least surprised' : 'main square'}. And the view from wherever you stand when you wish to think.`,
    c.season === 'winter' ? `It is snowing on Quarry Road. Your father has cleared my path without being asked. I have retaliated with strudel.` : c.season === 'autumn' ? `The verge is all seed-heads now. I press those too. They are a quieter beauty, but they keep better.` : `The verge by your gate is in flower again. I have left it unpressed this year. Some things should be allowed to finish.`,
    `Robin has passed nothing yet, but will. Tell the child so. It will be believed, coming from you.`)),
  L('varga6', 'varga', 6, 51, 8, c => P(
    `I must tell you about Thursday, and you must not laugh.`,
    `Your grandfather and I were on the back step with the star chart and the flask, when he said, quite calmly, "Adela, I believe that one is moving." It was. A bright, steady point, crossing Cygnus from west to east in perfect silence. I said, "That is a satellite, Emmett." He watched it all the way down to the Hendersons' chimney, and then he said, "Somebody is sorting up there."`,
    `He has added it to his sky. It is called The Night Mail. It runs, he informs me, about ninety minutes late.`,
    c.seen.museum ? `I hear you have found the museum. Go to the map room, if there is one, and find the oldest chart of your bay. Note what the cartographer drew in the corners where he did not know. That is always the most honest part of a map.` : `Is there a museum? There must be. Find the oldest map of your bay and look in its corners. What a mapmaker draws where he does not know is the most honest part of any map.`,
    `Your father speaks of a journey. Your aunt has a secret which the whole road could recite. Your grandfather has packed a thermos three weeks early. I have been asked whether I would "mind the houses", and I have said yes, as I am expected to.`,
    `But I find, ${c.name}, that I should rather like to see a lighthouse that is not on a postcard.`,
    `I have not said so to anyone. A geography teacher who has never seen the sea is a private joke, and I have kept it for fifty years.`,
    `Perhaps keep a corner for me in your plans. A small one. I fold up neatly.`), { enc: { kind: 'item', id: 'post_bookmark' }, note: 'A ribbon bookmark, embroidered with a tiny compass rose. "Lajos\'s, from the 1971 atlas. Plate 34. It is yours now."' }),
  L('varga7', 'varga', 7, 59, 9, c => P(
    `It is settled, and I am the last to be told, which is correct, since I was the last to admit that I wanted it.`,
    `Your aunt came across the road on Sunday with a railway ticket in my name. She said, "Adela, don't be ridiculous, who's going to tell us what we're looking at?" So I am to be the narrator. Your father looked at his shoes and said that he would be obliged.`,
    `I have packed the 1971 atlas. I shall put my own cross on plate 34, beside Lajos's, in ink.`,
    `The Henderson boy will feed Admiral. Admiral has been informed, and has gone under the shed.`,
    c.wrote >= 3 ? `Before I see it, I wish to say: I know your town already, a little, from your letters. I know which way its river runs. You told me in your second line. You have become a very fine student of capitals after all. You have made one.` : `Before I see it, I should like one letter from you that tells me where to stand. Only that. Where does one stand in Maple Bay to understand it?`,
    c.seen.lighthouse ? `And you will take me up the lighthouse. I shall be slow on the stairs. You will pretend to be slow also. This is how it is done.` : `And we shall climb the lighthouse together, you for the first time and I for the only time. I shall be slow on the stairs. You will pretend to be slow also.`,
    `Thirty years ago I wrote on your report: "Attentive to rivers. Will go far if pointed downstream." I should like it noted that I was right.`,
    `Until the platform, then.`)),

  /* ------------------------------------------------------------------ the chain + small replies */
  L('ada1', 'ada', 1, 0, 0, c => P(
    `They tell me at the post office that you are the one who carried it. I am eighty-one, and I have only now read a letter that was written to me when I was twenty-two. You will forgive my hand. It has not been steady since Tuesday.`,
    `He wrote it the night before the Corriveau sailed. He asked me a question in it. He said that if my answer was yes, I was to stand at the foot of Tannery Steps at six the next morning, with the blue door open behind me, so that he could see it from the deck as they went out. If the door was shut he would understand, and he would not write again.`,
    `I never had the letter. The door was shut because I was asleep.`,
    `He did not write again. I thought he had forgotten me. He thought I had answered. Fifty-eight years, the pair of us, each being dignified about it at opposite ends of one small town. I have bought fish from that man.`,
    `I walked down to the harbor yesterday, and I stood where he could see me. I am too old to open doors at six in the morning, but I wore a blue coat. He took his cap off. Neither of us said anything sensible. We are going to try again on Thursday, with a flask.`,
    `You must not think it sad. It is the least sad thing that has happened to me in years. A letter is not late, you know, if you are still alive to open it.`,
    `I enclose the stamp from the envelope. They let me keep the rest. I think this part should be yours.`), { enc: { kind: 'stamp', id: 'light58' }, note: 'A small, old stamp, carefully soaked off: the Maple Bay Light, in blue. The cancellation is still on it.' }),
  L('keeper1', 'keeper', 1, 0, 0, c => P(
    `Your letter came out on the mail boat with the lamp oil and the newspapers, and I read it at the top of the stairs, which is where I read anything that matters.`,
    `You asked what it is like out here. It is like being the last house on a street that is made of water. I have 137 steps, one kettle and a very good chair. At dusk I climb up and light the town's way home, and every night, whether the town knows it or not, somebody steers by it.`,
    `The children ask me every year whether I am ever lonely. I tell them the truth: a keeper gets more post than anyone in Maple Bay. It comes once a week in a canvas bag, and I answer every letter, because a light that did not answer would be no use to anyone.`,
    c.seen.lighthouse ? `They tell me you have been up the tower yourself. Then you have seen my chair. I hope you sat in it. Everyone does, and they all think that I do not know.` : `Come out and climb the tower one day. There is a chair at the top. Everyone sits in it, and they all think that I do not know.`,
    `Here is something to steer by. When you are far from where you started, pick one light and keep it on your left.`,
    `I enclose a stamp for your album. We are given a few each year, and I have nobody else to spend them on.`), { enc: { kind: 'stamp', id: 'lightnight' }, note: 'A stamp is tucked into the fold: the lighthouse at night, its beam cut across a dark blue sky.' }),
  L('bottle1', 'bottle', 1, 0, 0, c => P(
    `I found your bottle on the shingle below Cutter's Point, forty miles down the coast from you, tangled up in bladderwrack with a crab sitting on it. The crab was reluctant.`,
    `I do not know who you are, and you asked me not to say who I am, and I think that is a very good rule. I will tell you only this much. I am a person who walks the same beach every morning, I have been doing it for a long time, and until Tuesday nothing on it had ever been addressed to me.`,
    `You wrote that you had not long arrived somewhere new. I arrived somewhere new once, too. It stops being new on a day that you do not notice. Somebody in a shop says "the usual?", and you find that you have a usual.`,
    `I have put your message on my windowsill, beside a sea-urchin and a very small boot.`,
    `I am sending this back the slow way. The post office says it will get there. They seemed pleased to be asked.`,
    `Throw another one some time. I will keep walking the beach.`)),
];
export const LETTER_BY_ID = Object.fromEntries(LETTERS.map(l => [l.id, l]));

/* ---------------------------------------------------------------------- replies to what the player posts */
const itemsLine = (o, a, b) => (o.items ? a : b);
export const REPLIES = {
  dad: (c, o) => P(
    o.kind === 'parcel' ? `THE BOX CAME ${o.wrap >= 3 ? 'WRAPPED SQUARE AS A BRICK. I DID NOT KNOW YOU HAD IT IN YOU.' : o.wrap <= 1 ? 'HELD TOGETHER BY TAPE AND OPTIMISM. IT ARRIVED. THAT IS ALL A BOX HAS TO DO.' : 'IN GOOD ORDER.'} ${o.items ? o.items.toUpperCase() + '.' : ''} ${o.local ? 'YOUR GRANDFATHER HAS THE MAPLE BAY THINGS LINED UP ON THE SILL IN ORDER OF SIZE.' : 'WE HAVE DIVIDED IT FAIRLY, WHICH MEANS YOUR GRANDFATHER GOT MOST OF IT.'}` : o.kind === 'card' ? `THE POSTCARD CAME${o.card ? ' (' + o.card.toUpperCase() + ')' : ''}. IT IS ON THE REFRIGERATOR, PICTURE SIDE OUT. YOUR GRANDFATHER TURNS IT OVER EVERY MORNING TO READ THE BACK AGAIN AND THEN PUTS IT BACK WRONG.` : `YOUR LETTER CAME. I READ IT AT THE KITCHEN TABLE WITH MY GLASSES ON, WHICH YOU KNOW I DO NOT DO FOR JUST ANYTHING.`,
    o.tone === 'funny' ? `YOU MADE ME LAUGH OUT LOUD AND YOUR GRANDFATHER CAME IN TO SEE WHAT HAD BROKEN.` : o.tone === 'honest' ? `THANK YOU FOR TELLING IT STRAIGHT. I WOULD RATHER HAVE THE TRUE VERSION AND WORRY THAN THE NICE VERSION AND WONDER.` : o.tone === 'brief' ? `SHORT, BUT IT HAD A STAMP ON IT AND YOUR NAME AT THE BOTTOM. THAT WILL DO.` : `IT WAS A GOOD WARM LETTER. I AM NOT GOOD AT SAYING SO, SO I HAVE SAID IT IN CAPITALS.`,
    o.topics.includes('job') ? (c.job ? `GLAD THE WORK IS GOING ALONG. REMEMBER THE COFFEE RULE.` : `DO NOT FRET ABOUT THE WORK. KEEP GOING ROUND THE BLOCK.`) : null,
    o.topics.includes('home') ? `I HAVE MARKED YOUR PLACE ON THE HALL MAP IN PEN NOW INSTEAD OF PENCIL.` : null,
    o.topics.includes('miss') ? `WE MISS YOU TOO. THE THIRD STEP USED TO TELL ME WHEN YOU CAME IN. NOTHING TELLS ME NOW.` : null,
    o.topics.includes('food') ? `IF YOU ARE EATING THAT WELL THERE I WILL STOP SENDING INSTRUCTIONS ABOUT VEGETABLES. FOR ONE LETTER.` : null,
    o.topics.includes('ask') ? `YOU ASKED AFTER GERTRUDE. SHE STARTED THIS MORNING ON THE SECOND TRY AND I TOLD HER YOU SAID HELLO.` : null,
    `WRITE AGAIN WHEN YOU CAN.`),
  gramps: (c, o) => P(
    o.kind === 'parcel' ? `A parcel, for ME, with a Maple Bay postmark struck clean and square. ${o.wrap >= 3 ? 'And tied properly, by heaven. Somebody has been paying attention.' : 'The wrapping I shall describe as "spirited".'} ${o.items ? 'Inside: ' + o.items + '.' : ''} ${o.local ? 'The things from your town are on my wall and my shelf already.' : 'Your father and I have shared it out, and I won.'}` : o.kind === 'card' ? `A postcard!${o.card ? ' ' + o.card + '.' : ''} I have studied the picture with the glass and the postmark with the other glass. It is over my bed.` : `Your letter came by the second delivery. I knew the envelope before I had it out of the box.`,
    o.tone === 'funny' ? `You have your grandmother's wit, which is to say that it arrives late and stays long.` : o.tone === 'honest' ? `I am glad you wrote it plainly. A sorter can always tell an honest letter. It weighs a little more.` : o.tone === 'brief' ? `A short letter, but a short letter is a whole one. I have had telegrams with less in them.` : `What a kind letter. I read it to the tomatoes.`,
    o.topics.includes('town') ? `What you say of the town matches the bundles exactly. I always knew it was a place where people answered their post.` : null,
    o.topics.includes('weather') ? `Thank you for the weather. I have entered it in my book beside ours. You are running about four degrees ahead of us.` : null,
    o.topics.includes('friends') ? `And friends, too. Good. Keep them like a garden. A little, often.` : null,
    o.topics.includes('ask') ? `You ask about the knee. It has good days, and days on which it has opinions.` : null,
    `I am, as ever, at the box twice a day.`),
  june: (c, o) => P(
    o.kind === 'parcel' ? `THE PARCEL!! ${o.items ? o.items.charAt(0).toUpperCase() + o.items.slice(1) + '!!' : ''} ${o.wrap >= 3 ? 'And so beautifully wrapped that I nearly did not open it. (I opened it.)' : o.wrap <= 1 ? 'Wrapped by somebody in a HURRY, bless you, there was tape on the tape.' : 'All safe and sound.'} ${o.local ? 'Things from MAPLE BAY, where I was a GIRL. I have had a little weep, and a biscuit.' : 'I have shown it to Marjorie Platt, who had nothing to say for ONCE.'}` : o.kind === 'card' ? `A POSTCARD${o.card ? ', ' + o.card : ''}!! It is on the mantel, where everyone must look at it.` : `Your LETTER came, and I read it in the hall with my coat on.`,
    o.tone === 'funny' ? `You are WICKED, and I laughed till your uncle came in.` : o.tone === 'honest' ? `Thank you for telling me how it REALLY is. I shall not tell your father the worrying bits. (I have told him one.)` : o.tone === 'brief' ? `It was SHORT, darling, but I have read it nine times, so that makes it long.` : `Such a LOVELY letter. I have put it in the tin with the Queen on it.`,
    o.topics.includes('food') ? `And you are EATING. That is all I ever wanted to know.` : null,
    o.topics.includes('friends') ? `FRIENDS!! Names and ages in the next one, please.` : null,
    o.topics.includes('home') ? `It sounds a dear little place. Do you have a decent dishcloth YET?` : null,
    o.topics.includes('miss') ? `We miss you DREADFULLY, and I have told the choir so, twice.` : null,
    o.topics.includes('ask') ? `You asked about the roof fund. It is UP, and so am I.` : null,
    `More soon. I am knitting as I write this, which is why it slopes.`),
  robin: (c, o) => P(
    o.kind === 'parcel' ? `a PARCEL. for ME. ${o.items ? o.items + '.' : ''} ${o.local ? 'ACTUAL MAPLE BAY STUFF. i am being so normal. it is all on the wall, except the bits that are on me.' : 'mum made me share. i shared badly.'} ${o.wrap <= 1 ? 'also who wrapped this, a raccoon? (i kept the paper.)' : ''}` : o.kind === 'card' ? `POSTCARD${o.card ? ' (' + o.card.toLowerCase() + ')' : ''}. it's on the wall. the wall is getting good.` : `ok your letter came, and i read it in the bus shelter.`,
    o.tone === 'funny' ? `i laughed out loud and a pigeon left.` : o.tone === 'honest' ? `thanks for not doing the adult voice. you know the one.` : o.tone === 'brief' ? `short. respect.` : `it was nice. don't make me say more than that.`,
    o.topics.includes('town') ? `the city sounds unreal. a train OVER the street.` : null,
    o.topics.includes('job') ? `the job thing sounds ${c.job ? 'kind of cool actually' : 'fine, whatever, no rush'}.` : null,
    o.topics.includes('ask') ? `you asked about the band. WET CEMENT is thriving. Dov has a cowbell now.` : null,
    `write again. or don't. (do.)`),
  sam: (c, o) => P(
    o.kind === 'parcel' ? `A parcel turned up in the station pigeonhole and I opened it on air. ${o.items ? o.items.charAt(0).toUpperCase() + o.items.slice(1) + '.' : ''} ${o.local ? "It's a piece of your town, sitting on my desk next to the dimmer. Doreen wants it described again tomorrow night." : "Doreen made me list what was in it. She approved."} ${o.wrap >= 3 ? 'Wrapped like you were being graded on it.' : ''}` : o.kind === 'card' ? `Your postcard${o.card ? ' (' + o.card + ')' : ''} is taped to the booth window, picture side in, so I can see it and the listeners can't.` : `Your letter came in with the bills and I saved it for the eleven-minute record.`,
    o.tone === 'funny' ? `I read the funny part on air. Doreen says you should have my job.` : o.tone === 'honest' ? `Thanks for the straight version. It's easier to be honest at 3 a.m. and I could tell that's when you wrote it.` : o.tone === 'brief' ? `Short, but it's got your voice in it. That's all I'm ever after.` : `That was a good letter. I'm not going to make a joke about it.`,
    o.topics.includes('town') ? `I can nearly hear the place now. Keep sending me the sound of it.` : null,
    o.topics.includes('miss') ? `Yeah. Me too. I honked outside your dad's again on Tuesday.` : null,
    o.topics.includes('friends') ? `Glad you've got people. Don't let any of them have better taste than me.` : null,
    o.topics.includes('ask') ? `You asked after Doreen. Her feet are no better and she sends her regards, in that order.` : null,
    `Somebody's up.`),
  varga: (c, o) => P(
    o.kind === 'parcel' ? `I have received a parcel, which at my age is an event. ${o.items ? 'It contained ' + o.items + '.' : ''} ${o.local ? 'Something of Maple Bay now sits in a house on Quarry Road. Lajos would have marked the occasion in pencil.' : 'I have written each item into my household book.'} ${o.wrap >= 3 ? 'It was wrapped with precision. I approve.' : 'It was wrapped as I wrap. We are two of a kind.'}` : o.kind === 'card' ? (/light/i.test(o.card || '') ? `THE GAP IS FILLED. Between Mallaig and Marblehead there is now a Maple Bay. I sat for some minutes with the album open. One hundred and thirteen.` : `Your postcard has come${o.card ? ': ' + o.card : ''}. It is not a lighthouse, but I have made an exception and given it a page of its own.`) : `Thank you for your letter, which I have read twice, once for the news and once for the sentences.`,
    o.tone === 'funny' ? `You were always amusing when you forgot to be careful. I am glad to see you have forgotten.` : o.tone === 'honest' ? `You write frankly. It suits you. Frankness is merely good map-making applied to oneself.` : o.tone === 'brief' ? `It was brief, but then a compass is brief, and nobody complains of it.` : `It was a warm letter, and it has warmed the house.`,
    o.topics.includes('weather') ? `Your account of the weather has been compared with ours, and found to be more interesting.` : null,
    o.topics.includes('town') ? `You describe the town as one who has walked it and not merely looked. Full marks.` : null,
    o.topics.includes('ask') ? `You enquire after Admiral. He is on your gatepost as I write. He is merely there.` : null,
    `I remain at the green gate.`),
};

/* ---------------------------------------------------------------------- composing at the writing desk */
export const COMPOSE = {
  tones: [{ id: 'warm', label: 'Warm', sub: 'Say it kindly' }, { id: 'funny', label: 'Funny', sub: 'Make them laugh' }, { id: 'honest', label: 'Honest', sub: 'How it really is' }, { id: 'brief', label: 'Brief', sub: 'Short, but with a stamp on it' }],
  open: { warm: 'I have been meaning to write, and today I sat down at a real desk with a pen on a chain to do it.', funny: 'I am writing this with a pen that is chained to a desk, so if it stops suddenly, the post office has reeled me in.', honest: 'I am going to tell you how it actually is here, not the version for the telephone.', brief: 'A short one, but a real one.' },
  close: { warm: 'I think of you all more than I say. Write back.', funny: 'Write back, or I will send another one just like this.', honest: 'That is the true account. I feel better for having written it down.', brief: 'More soon. This counts.' },
  /** the lines on offer; each is a true thing about the player's game */
  topics(c, to) {
    const T = [];
    T.push({ id: 'job', text: c.job ? `I am working as a ${c.job} now. I am not bad at it, and some days I am good.` : 'I do not have a job yet. I look at the board most mornings, and I am trying not to take the first thing I see.' });
    T.push({ id: 'home', text: c.home ? `I live at ${c.home}${c.dist ? ', in ' + c.dist : ''}. It is small, and it is mine, and I know where the fuse box is.` : 'I am still sorting out somewhere to live. I will send the address when I have one that will last.' });
    T.push({ id: 'town', text: c.seen.lighthouse ? 'I climbed the lighthouse. From the top you can see the whole town, and the trains going round it on their bridge.' : c.fountain ? 'The fountain on the plaza is running again. I had a hand in that, and people sit on the rim now.' : 'The trains here run on a bridge above the streets, and the whole town slopes down to a harbor with a lighthouse at the end.' });
    T.push({ id: 'miss', text: 'I miss the house. I miss the third step. I did not expect to, but I do.' });
    T.push({ id: 'weather', text: `It is ${c.season} here. ${c.season === 'winter' ? 'There is snow on the roofs, and the harbor steams in the mornings.' : c.season === 'summer' ? 'The boardwalk is full until dark, and everybody is eating something on a stick.' : c.season === 'autumn' ? 'The maples are living up to the name. The whole park is red.' : 'Everything is in bud, and the market has put its stalls out.'}` });
    T.push({ id: 'food', text: 'I am eating properly. There is a market, a noodle place and a bakery that knows my order.' });
    T.push({ id: 'friends', text: c.friends >= 3 ? 'I know people here now. Enough that I get stopped in the street.' : c.friends >= 1 ? 'I have made a friend or two. It is slow, but it is real.' : 'I do not really know anyone yet outside the family. I say good morning to the same people every day, and I am waiting.' });
    T.push({ id: 'ask', text: { dad: 'How is Gertrude? Has she started?', gramps: 'How is the knee? And what is the tomato count?', june: 'How is the roof fund? And did the walnut loaf sell?', robin: 'How is the band? Is it still called Wet Cement?', sam: 'How is Doreen? Does she still ring at four?', varga: 'How is Admiral? Is he still on the gatepost?' }[to] || 'How are you, really? Tell me one small true thing about your day.' });
    return T;
  },
};

/* ---------------------------------------------------------------------- junk mail, flyers, coupons, catalogues */
export const JUNK = [
  { id: 'j_cable', title: 'YOU MAY ALREADY BE A WINNER', from: 'Bay Cable & Telephone', text: 'Dear RESIDENT or CURRENT OCCUPANT: you have been specially selected, along with everybody else on your street, to receive 400 channels for the first three months. After that the price becomes a surprise. No need to reply. We will keep writing.' },
  { id: 'j_gull', title: 'Two-for-one starters', from: 'The Gilded Gull', text: 'The Gilded Gull invites you to the harbor for dinner. Bring this flyer for a little something off your bill. We have ironed the tablecloths. The gulls have been spoken to.', coupon: { venue: 'restaurant', pct: 15 }, place: 'restaurant' },
  { id: 'j_fresh', title: 'FreshWay weekly specials', from: 'FreshWay Market', text: 'THIS WEEK: carrots (orange), bread (sliced), and a mystery tin with no label for the adventurous. Clip the corner of this flyer for money off your next shop. One per household. We know where you live. We delivered this.', coupon: { venue: 'grocery', pct: 10 }, place: 'grocery' },
  { id: 'j_lucky', title: 'A note from Lucky Corner', from: 'Lucky Corner', text: 'Handwritten, photocopied a hundred times: "NEIGHBOR! We have milk at midnight. We have batteries. We have the good crisps. Show this at the till and Mr. Oh will take a little off. He says he will not. He will."', coupon: { venue: 'cornerstore', pct: 10 }, place: 'cornerstore' },
  { id: 'j_gym', title: 'Is this the year?', from: 'Iron Maple Gym', text: 'Your free trial is waiting. It has been waiting since this flyer was printed. It is not angry, just disappointed. Bring this in for a discount on a pass, and Coach Tasha will say only encouraging things for the first ten minutes.', coupon: { venue: 'gym', pct: 20 }, place: 'gym' },
  { id: 'j_pizza', title: 'SLICE OF HEAVEN: now with more slice', from: 'Slice of Heaven', text: 'We heard you. The slices are bigger. The heaven is the same size. Tear off the coupon below. Not valid with any other offer, with pineapple, or on days when Nico is in a mood.', coupon: { venue: 'pizza', pct: 15 }, place: 'pizza' },
  { id: 'j_council', title: 'Notice to residents', from: 'City of Maple Bay', text: 'The Department of Streets advises that Quay Street will be resurfaced "in the near future". Residents are reminded that the phrase "in the near future" carries no legal meaning. Council meets Tuesdays and Thursdays at half past six; the podium is open to anyone.', place: 'cityhall' },
  { id: 'j_otters', title: 'GO OTTERS! Home game this week', from: 'Maple Bay Otters', text: 'Your Otters are at home this week at the Maple Bay Arena. Bring the family. Bring a scarf. Bring a voice you do not need the next day. Kids who write to Ollie the Otter get a letter back (he dictates).', place: 'arena' },
  { id: 'j_nest', title: 'Nest & Wire: the catalogue', from: 'Nest & Wire', text: 'Forty-eight glossy pages of lamps you did not know you needed, sofas photographed in rooms larger than your building, and a rug called "Tranquil Fjord". Everything is delivered in a box the morning after you buy it. Circle what you like in pen. It is good for the soul.', cat: 1, place: 'homegoods' },
  { id: 'j_thread', title: 'Thread & Co.: new season', from: 'Thread & Co.', text: 'The new season has arrived, and it is mostly coats. Celeste writes: "Come in and try something you would never choose. That is what the mirror is for." Bring this card for a little off anything on the rail.', coupon: { venue: 'clothing', pct: 10 }, cat: 1, place: 'clothing' },
  { id: 'j_dentist', title: 'We miss your smile', from: 'Dr. Platt, Dental Surgeon, Pinehollow', text: 'Our records show that it has been some time since your last check-up. We understand that you have moved several hundred miles away. We do not consider this an excuse. Yours, Dr. Platt (grandson).' },
  { id: 'j_lost', title: 'LOST: one tortoise', from: 'a neighbor', text: 'LOST. One tortoise, answers to "Gerald" (slowly). Last seen heading for the River Walk with great determination on Tuesday, or possibly the Tuesday before. Not dangerous. If found, do not chase. Walk beside him and tell me where he is going.' },
  { id: 'j_library', title: 'Library card reminder', from: 'Maple Bay Public Library', text: 'New in town? A library card is free, and the reading room has the best radiators in the city. This month: a display of "Books Returned Very Late", with the apologies people wrote in them.', place: 'library' },
  { id: 'j_hotel', title: 'Afternoon tea at the Grand Maple', from: 'The Grand Maple Hotel', text: 'Three tiers, a pianist, and sandwiches with the crusts off. Served daily from two until five in the lobby lounge. Come as you are. The doorman will open the door as though you were expected.', place: 'hotel' },
];
export const JUNK_BY_ID = Object.fromEntries(JUNK.map(j => [j.id, j]));
