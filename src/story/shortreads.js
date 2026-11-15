// Short reads: the built-in library of the Pages app (src/ui/phone_reader.js; rules in src/sim/media.js). Original texts, 300-900 words each.
// A read: { id, title, by, genre (shelf), day (0-based game day it appears; serial parts arrive over the first two weeks), serial?: { id, name, part, of }, blurb, text }
// Text format: paragraphs separated by a blank line; a single line break inside a paragraph is kept (poems, recipes). No markup.
// Shelves (GENRES order). Everything here is invented: no real people, brands or places outside Maple Bay.
export const GENRES = [['mystery', 'Harbor Mysteries'], ['courier', 'From the Bay Courier'], ['story', 'Stories'], ['kids', 'For Small Readers'], ['kitchen', 'Recipes With a Story'], ['poems', 'Poems'], ['history', 'Local History']];
const bell = (part, title, day, blurb, text) => ({ id: 'bell' + part, title, by: 'Winifred Achterberg', genre: 'mystery', day, serial: { id: 'bell', name: 'The Fog Bell Affair', part, of: 6 }, blurb, text });

export const READS = [
  bell(1, 'The Fog Bell Affair, Part 1: The Missing Bell', 0, 'A cosy harbor mystery in six parts. The fog bell at Pier 2 has rung every foggy morning for ninety years. This morning it did not.', `
Mabel Quince had been retired from the pilot boat for eleven years, and in all that time she had never once slept past the fog bell.

So when she woke at seven with the window white as a bedsheet and the harbor perfectly, impossibly quiet, she lay still for a full minute and listened to nothing at all.

"Biscuit," she said. The terrier lifted one ear. "Something's wrong with the morning."

She was at Pier 2 in a quarter of an hour, in her yellow oilskin and the wrong shoes. The bell post stood where it had always stood, at the seaward end, tarred black and leaning a little toward the water like an old man reading a notice. The iron bracket was there. The rope was there, hanging straight down, swaying slightly. The bell was not.

A fog bell is not a small thing. This one was the size of a washing basket and weighed, by Mabel's professional estimate, about as much as a grown sheep. It had been cast in 1934, paid for by a collection among the herring boats, and it had a crack near the lip that gave it a note like somebody clearing their throat. Every captain in Maple Bay knew that note. You steered for it.

Ivo Brandt from the harbor office arrived with a clipboard, which was how Ivo arrived everywhere. He looked at the bracket for a long time.

"Bolts are undone," he said. "Not cut. Undone. Somebody brought a spanner."

"Somebody brought a spanner, a ladder and a wheelbarrow," said Mabel, "and somebody knew the tide." She pointed down. Below the pier, on the wet timber of a cross-brace that was only uncovered for an hour either side of low water, there was a clean bright scrape, and on the scrape, a smear of green paint.

Ivo wrote it down. Then he wrote down that he was calling the police, and went to do it, because Ivo believed in doing things in the order they were written.

Mabel stayed. Biscuit had found something between two planks and was having a serious conversation with it. She knelt, which her knees discussed with her at length, and worked it free with a hairpin.

It was a brass button, the kind with an anchor on it. Not a navy button; she knew those. This anchor had a little rope twisted round it, and underneath, in letters almost too small to read, the words CHANDLERY CLUB.

Mabel had lived in Maple Bay for sixty-eight years. She had never heard of a Chandlery Club.

She put the button in her pocket, next to the dog biscuits, and looked out at the fog, where at this moment four fishing boats were feeling their way home toward a sound that was not there.

"Right," she said. "First things first." And she went to fetch the saucepan and the wooden spoon from the pilot shed, and stood at the end of Pier 2 for an hour and forty minutes, banging the boats in one by one.

It was not the right note. But it would do until she found the right one.`),

  bell(2, 'The Fog Bell Affair, Part 2: Tea at the Chandlery', 1, 'Mabel follows a brass button to a shop that sells rope, and to a club that officially does not exist.', `
The only chandlery left in Maple Bay was Tarrant & Daughter, on Anchor Lane, a narrow shop that smelled of tar and new rope and, faintly, of toast. Mabel had bought her first sou'wester there in the year the bridge opened. She had not been in since they started selling scented candles.

Ansel Tarrant was behind the counter splicing an eye into a mooring line without looking at it, the way other people knit. He was the Daughter's son, which made the sign two generations out of date, and he saw no reason to change it.

Mabel put the button on the counter.

Ansel's hands did not stop, but they slowed. "Haven't seen one of those in a while," he said.

"What is it?"

"That is a blazer button of the Chandlery Club." He finished the splice, examined it, and set it down. "Kettle's on. You'd better come through."

The back room had a stove, two armchairs and a wall of photographs. Men in blazers, mostly, standing on this pier or that one, squinting. The earliest were brown. The latest had a car in it that Mabel remembered being new.

"Founded 1931," Ansel said, pouring. "Net-makers, sail-makers, my grandmother, anyone who sold to the boats rather than fished from them. They met here on the first Thursday. Mostly they argued about the price of hemp. But they did one useful thing." He tapped a photograph. Twelve people stood round a brand-new bell on a handcart, looking pleased with themselves. "They bought that."

"The herring boats bought that. There was a collection."

"The herring boats raised eleven pounds. The bell cost forty. The Club made up the rest, quietly, and never asked for a plaque." He sipped. "Which, if you knew my grandmother, was not like her at all."

Biscuit, who had been investigating the coal scuttle, sneezed.

"So the Club owns the bell," said Mabel slowly.

"The Club owns twenty-nine fortieths of the bell. There's a paper somewhere."

"And who's the Club now?"

Ansel looked at the photographs for a moment. "I'd have said nobody. It wound up in the seventies. There were four members left and three of them weren't speaking." He turned the button over with one finger. "But I'll tell you something odd. A fortnight ago a young woman came in and asked if I still had the Club's minute books. Polite. Green coat. Paid cash for a shackle she plainly didn't need."

"Did you give her the books?"

"I told her they were in the attic and the attic was full of wasps."

"Is it?"

"It's full of minute books," said Ansel. "Top of the stairs. Mind the third step, it's decorative."

Mabel finished her tea. It was very good tea; she said so. Then she climbed the stairs, minding the third step, and found forty years of first Thursdays tied up in tarred twine, and on top of them, clean in the dust, the print of a small hand that was not Ansel's.

Somebody had already been through the wasps.`),

  bell(3, 'The Fog Bell Affair, Part 3: A Receipt for Rope', 3, 'The minute books of the Chandlery Club turn out to contain a missing page, a pressed flower and a very old argument.', `
Mabel read minute books the way she used to read weather: not for what was there, but for what had changed.

She read them at her kitchen table over two evenings, with Biscuit on her feet and the radio murmuring the shipping forecast to nobody. The Chandlery Club had been, on the evidence, nine parts quarrel to one part purpose. They quarrelled about hemp. They quarrelled about whether women could vote on hemp. In 1952 they quarrelled for five consecutive Thursdays about a missing tea urn, which was found in March in the secretary's own shed.

But they kept the bell. Every spring there was an entry in the same words: Bell inspected, rope renewed, bracket greased, cost so much, paid from the Bell Fund. Forty-odd springs, forty-odd different hands, the same sentence. Mabel found she rather loved them for it.

Then, in the book for 1974, a page was gone.

It had been cut, not torn; the stub was neat as a hem. The entry before it was an ordinary first Thursday in September. The entry after it was the last one in the book, and it was very short. "Resolved, three votes to one, that the Club be wound up. The Bell Fund to be dealt with as agreed. No further business." Below that were four signatures. One of them, small and upright, was E. Tarrant. That would be Ansel's grandmother.

One of the others had pressed so hard the pen had gone through.

Mabel held the book up to the lamp and tilted it. The page behind the missing page had taken a ghost of the writing, the way they do. She could make out a column of figures, a word that might have been "trust," and a name, twice: Fenn.

She knew a Fenn. Everybody did. Fenn Marine had the big green sheds at the north basin, and the green launches, and the green vans. Corbin Fenn had bought half the waterfront in the last ten years and sent a hamper to the harbor office every winter, which Ivo distributed with the expression of a man handling evidence.

Green paint, thought Mabel. And then, because she distrusted anything that tidy: half the boats in this harbor are green. I painted one myself.

Something slid out of the back of the minute book and landed on Biscuit, who took it personally. It was a receipt, folded small, brittle as a leaf. Tarrant & Daughter, 14 fathoms best manila for bell-rope, paid. The date was the spring of 1975, six months after the Club had voted itself out of existence.

Somebody had gone on renewing the rope. Out of their own pocket, by the look of it, and without telling anyone.

On the back, in pencil, in that same small upright hand, were five words.

"Ask the gulls. They saw."

Mabel read it twice. Then she looked at the clock, saw it was ten to midnight, and telephoned Ansel Tarrant anyway.

"Your grandmother," she said, when he finally answered. "Was she given to riddles?"

There was a long, sleepy silence.

"She kept pigeons," said Ansel. "On the roof. She called them the gulls, to annoy them."`),

  bell(4, 'The Fog Bell Affair, Part 4: Low Water', 5, 'A pigeon loft, a tin box, and a walk under Pier 2 at the bottom of the tide, where Mabel is not the only visitor.', `
The pigeon loft on the roof of Tarrant & Daughter had not held a pigeon since the year of the long strike. It held a deckchair, a great many feathers, and, under the third nesting box from the left, a biscuit tin with a picture of a lighthouse on it.

"I'd like it noted," said Ansel, from the top of the ladder, "that I have owned this building for thirty years and never once looked in there."

"Noted," said Mabel, and opened the tin.

There was the missing page, folded in four. There was a bank book, long closed. And there was a letter, in the small upright hand, addressed To Whoever Minds About The Bell.

It was not a long letter. Edith Tarrant had not been a woman who wasted ink. In the autumn of 1974, it said, old Mr. Fenn had proposed that the Club sell its share of the bell to his firm, which wished to put up a modern electric horn and take the bell for the lobby of its new offices. Three members had liked the money. Edith had not. She lost the vote. But the motion, as written on the page she had subsequently removed with her dressmaking scissors, said the Bell Fund was to be "dealt with as agreed," and nobody had thought to write down what was agreed.

"So I have agreed it with myself," wrote Edith. "The Fund is in trust for the bell, and the bell is in trust for the harbor, and the papers that say so are where the bell can keep an eye on them."

Mabel read the last line again.

"Where the bell can keep an eye on them," she said. "Ansel. When's low water?"

It was at ten past four, and it was a big tide, the biggest of the month. By four they were under Pier 2 in borrowed waders, with a torch, on mud that had opinions. The piles rose round them like a drowned forest. Above, through the gaps in the planking, the sky was going the colour of pewter.

Directly beneath the bell post, bolted to the inside of the oldest pile, there was an iron box about the size of a loaf. Its door hung open. It was empty.

On the timber beside it was a scrape of green paint, twin to the one Mabel had seen from above.

"Well," said Ansel. "That's that."

"No," said Mabel. "That's fresh." She put her hand on the mud. A line of bootprints led away along the pier's length toward the north basin, small prints, very clear, already filling with water. "And those are about ten minutes old."

Biscuit, who had been carried this far under protest, went rigid.

Somewhere ahead in the dimness, a torch that was not theirs swung round, and stopped, and went out.

"Good morning!" called Mabel pleasantly, because sixty years on the water had taught her that it is very hard to run away from someone who has just said good morning. "I think you've got something of Edith's. And I think I've got your button."

For a moment there was only the tick of the tide coming back.

Then a young woman's voice said, rather shakily: "She was my great-grandmother. I can explain. Could we possibly do it somewhere with less mud?"`),

  bell(5, 'The Fog Bell Affair, Part 5: What the Gulls Saw', 7, 'Explanations over breakfast at the diner, and the question of who really took the bell, which is not the same as who took the papers.', `
They did it at Dot's, in the corner booth, over three full breakfasts and a saucer of bacon for Biscuit that Dot pretended not to see.

The young woman in the green coat was called Tilly Fenn, and she was twenty-six, and she had not stolen the bell.

"I want that understood first," she said. "I took the papers. I'd have put them back. I did not take a bell. I wouldn't know how to take a bell."

"Start with the button," said Mabel.

Tilly's mother had been a Tarrant before she was a Fenn: Edith's granddaughter, who had married into the green sheds and regretted it at leisure. The blazer had come down to Tilly in a trunk, along with a great many stories about Great-Granny and her pigeons. One of the stories was that Edith had hidden the Bell Fund where no Fenn would ever find it. Tilly had always taken it for the kind of thing families say.

"Then last month my uncle Corbin put in to redevelop Pier 2," she said. "Flats. A boardwalk. A restaurant shaped like a boat. And in the plans, where the bell is, it says: existing bell to be relocated to developer's premises." She set down her fork. "He told the council the firm bought it in 1974. He has a copy of the minutes that says so."

"He has a copy of the motion," said Ansel. "Not of what was agreed."

"That's what I went looking for." Out of the green coat came an oilcloth packet, and out of the packet a deed, stiff and blue, with a seal. The Maple Bay Fog Bell Trust, established by E. Tarrant, sole surviving officer of the Chandlery Club. The bell to hang at Pier 2 for as long as there is fog and a harbor to have it in. The Fund to pay for rope.

Mabel read it through and felt something in her chest settle, like a boat coming alongside.

"Then your uncle's stuck," she said. "Which gives him a very good reason to make sure the bell is already gone when anyone asks."

"He wouldn't," said Tilly, without much conviction.

"He'd have someone do it," said Ansel.

"Someone with a spanner, a ladder and a launch," said Mabel. "On a spring tide. And he made one mistake." She looked out of the window. On the rail of Pier 2, a row of gulls sat facing the weather like a jury. "Edith said ask the gulls. She meant her pigeons. But she wasn't wrong about the others."

She had Ivo on the telephone inside two minutes.

"The harbor camera," she said. "The one you put up to catch whoever was feeding chips to the seals."

"It points at the fish steps," said Ivo. "Not at the bell."

"It points at the fish steps, where every gull in the harbor sits at night. Look at the tape for the night before the fog. Don't look for a boat. Look for the moment they all go up at once."

There was a pause, and the sound of a clipboard being put down, which from Ivo was practically a gasp.

He rang back before the toast was cold.

"Eleven minutes past two," he said. "They all go up. And about a minute later something crosses the corner of the picture, low, heading north. No lights." He cleared his throat. "It's green, Mabel."`),

  bell(6, 'The Fog Bell Affair, Part 6: The Bell Comes Home', 9, 'The last part. A lobby, a tarpaulin, a council meeting, and the first foggy morning afterwards.', `
The new offices of Fenn Marine had a lobby with a fountain in it, and by the fountain, under a tarpaulin, something the size of a washing basket.

Mabel did not go in through the lobby. She went to the Tuesday meeting of the Harbor Committee instead, with Tilly on one side and Ansel on the other and Ivo behind carrying a television on a trolley, and she sat through forty minutes on the dredging budget with her hands folded.

Item nine was Pier 2.

Corbin Fenn spoke well. He had drawings. He had a model with tiny trees. He said "heritage" eleven times, by Mabel's count, and when he came to the bell he said that the firm would be honoured to give it a permanent home, "as we have, in fact, owned it since 1974."

"Not quite," said Mabel, and stood up.

It took her six minutes. She had brought the deed, and the missing page, and the receipt for fourteen fathoms of best manila. She had brought a button. And when the chairman, who was not a quick man, asked whether there was any actual evidence that the bell had been removed by anyone at all, Ivo wheeled the trolley forward and pressed play, and the Harbor Committee of Maple Bay sat and watched two hundred gulls rise as one bird into the dark, and a green launch slide through the corner of the picture underneath them.

Nobody said anything for a moment.

"Mr. Fenn," said the chairman at last. "What is under the tarpaulin in your lobby?"

It is to Corbin Fenn's small credit that he did not pretend it was a fountain.

There was no trial; Maple Bay is not that sort of town. There was a very long conversation in the harbor office, after which the plans for Pier 2 lost their boat-shaped restaurant and gained a clause, and Fenn Marine paid for a new bracket, a new post, and forty years of rope in advance. Tilly Fenn left the firm that week. She has the lease on the shop next to Tarrant & Daughter now, and a sign going up; Ansel says it will be out of date within two generations and he approves.

The bell went back on a Thursday, which seemed right. Half the harbor turned out to watch a crane do in four minutes what somebody had done in the dark with a wheelbarrow. They let Mabel tie on the rope.

She did not ring it. You don't, for nothing.

The fog came nine days later. Mabel woke at ten to seven with the window white as a bedsheet, and lay still, and listened.

For a moment there was nothing. Then, from the end of Pier 2, a little flat, a little cracked, like somebody clearing their throat before saying something important, it came.

"There," she said. Biscuit thumped his tail once and went back to sleep.

Out in the white, four boats turned their heads toward the sound, and steered for it, and came home.`),

  // ------------------------------------------------------------------ From the Bay Courier ("The Slow Lane", a weekly column)
  { id: 'col_742', title: 'The Slow Lane: The 7:42', by: 'Odette Marsh, Bay Courier', genre: 'courier', day: 0, blurb: 'Our columnist has taken the same train for nine years and would like to introduce you to people she has never spoken to.', text: `
I have caught the 7:42 from Hillcrest for nine years, and I know nobody on it.

This is not the same as saying I don't know them. I know the man in the grey coat gets on at Old Town and reads the back of the paper first. I know the two nurses coming off nights share one pair of earphones, a bud each, and that whatever they listen to makes the tall one laugh at exactly the Arts Quarter bend. I know the boy with the cello has grown four inches since the spring and the cello has not.

I know, because I have watched it happen over about three hundred mornings, that the woman who does the crossword in pen has begun to leave the last clue blank, and that the man in the grey coat has begun to glance at it as he goes past, and that one day soon one of them is going to say something. The whole carriage is waiting. We would never admit it.

There are rules on the 7:42. Nobody wrote them down. You do not take the single seat by the door at Hillcrest, because that is for the lady with the stick, who gets on at Riverside. You do not speak before Central unless something is on fire. If the train stops between stations, you are permitted one look at your neighbour, eyebrows up, and they are permitted to do the eyebrows back, and that is a complete conversation.

Last winter it stopped for forty minutes in the snow just short of the viaduct. Forty minutes is a long time to do eyebrows. Somewhere around the half hour the boy with the cello, unasked, unzipped the case and played something slow, and nobody looked at him, and everybody listened, and when we finally moved a man I have never seen before or since said "Well," and that was all, and it was exactly the right review.

I thought about this last week because the 7:42 was cancelled, and I took the 7:55 instead.

The 7:55 is a perfectly good train. It has the same seats. It goes to the same places. I stood among a hundred strangers and felt, absurdly, as though I had walked into the wrong house. Nobody was reading the back of the paper. Nobody saved the seat by the door. A man spoke on the telephone before Central and nothing happened to him at all.

A city is mostly this, I think: people you will never meet, arranged in an order you would miss. We talk a great deal about community, and usually we mean bake sales. I mean the lady with the stick, whose name I do not know, getting her seat for the two-thousandth time from people who have never discussed it.

On Thursday the 7:42 was back. Grey coat. Earphones. Cello. The crossword came out, in pen. I checked the last clue from where I stood, like everyone else.

Seven letters. "Regular traveller."

She had left it blank. But she was smiling at it, and so, as he went past, was he.` },

  { id: 'col_bench', title: 'The Slow Lane: In Praise of the Second-Best Bench', by: 'Odette Marsh, Bay Courier', genre: 'courier', day: 0, blurb: 'Everyone knows the best bench in Maple Bay. That is exactly what is wrong with it.', text: `
Everyone in Maple Bay knows the best bench. It is the one at the top of Lookout Park, facing west, with the plaque. From it you can see the whole harbor, the lighthouse, both bridges and, on a clear evening, the weather that is going to arrive on Thursday.

It is a wonderful bench and I never sit on it, because you can't. There is always a couple on it having either the best or the worst conversation of their lives, and you can tell from thirty yards which, and either way you keep walking.

I should like to speak up instead for the second-best bench.

You will not find it in the guidebook. It is on the River Walk, a little past the place where the path bends, between a litter bin and a tree that has never quite decided what shape to be. It faces the river at the wrong angle. Its view consists of some water, the back of the rowing club, and a single mooring post on which, most days, one cormorant stands with its wings out, like a man who has been asked to hold two coats.

The second slat is loose. Somebody, long ago, scratched into the arm the words KEV WAS HERE, and somebody else, later and more neatly, has added WE KNOW, KEV.

I have done a great deal on that bench. I have eaten a sandwich a day there for the better part of a summer. I have written three of these columns and abandoned five. I once sat on it for an hour deciding whether to take a job in another city, and at the end of the hour the cormorant folded its wings and looked at me, and I thought, no, and went back to the office, and I have never regretted it, although I do not think the cormorant should get all the credit.

The thing about the best of anything is that it is under so much pressure. The best bench has to be a moment. You have to have brought the right person, and the right weather, and something to say. The second-best bench asks nothing. It is not for occasions. It is for a Tuesday. You can sit on it badly. You can sit on it in the wrong coat, having had the wrong sort of morning, with a pasty.

I notice the same is true elsewhere. The best cafe has a queue; the second-best has your table. The best view is on the postcards; the second-best is out of your own kitchen window at about ten to five in November, when the light goes the colour of weak tea, and nobody has ever photographed it and nobody ever will.

So here is my advice, which is worth what you paid for it. Find out where the best one is, of whatever it is. Go once. Admire it sincerely. Then walk about two hundred yards further on, to where the path bends, and see what's there.

It will have a loose slat. Sit down anyway. Somebody has been keeping it warm for you.

Probably Kev.` },

  { id: 'col_laundry', title: 'The Slow Lane: Things I Have Overheard at the Laundrette', by: 'Odette Marsh, Bay Courier', genre: 'courier', day: 2, blurb: 'A complete and unedited list, compiled over one winter of a broken washing machine.', text: `
My washing machine died in December, with a noise like a small aeroplane giving up, and the man could not come until February. So for nine weeks I took my washing to the laundrette on Dyer Street on Sunday evenings, and sat with a book I did not read.

You cannot read in a laundrette. It is the best theatre in the city and the seats face the stage.

What follows is everything I wrote on the inside cover of that book. I have changed nothing. I do not know how any of these stories end.

"No, the other Derek."

"And I said, if you wanted a quiet wedding you should not have invited a brass band."

A woman, into a telephone, very calmly: "I'm not angry. I'm folding."

Two students, sharing a dryer and a bag of crisps. First student: "What's the worst that could happen?" Second student, after thinking about it properly: "We'd have to move to a different country." They put another coin in.

A boy of about six, to his father, watching the drum go round: "Is it the same water?" The father opened his mouth. The father closed his mouth. I watched a grown man realise he did not know.

"She's not really my aunt. She's just been coming to Christmas since 1988 and nobody's liked to ask."

An elderly gentleman, holding up one sock to the room at large: "Has anybody lost a sock? It's a good one." Nobody had. He put it in his pocket. The following Sunday he was wearing it, with a different one, and seemed happy.

"I told him: you can have the dog or you can have opinions about how I load the dishwasher."

A young man teaching another young man to fold a fitted sheet. It took eleven minutes. At the end they shook hands.

"So that's why I'm not allowed in the aquarium."

Two women I took to be sisters, not speaking, passing things between them from one basket, each folding the other's clothes without needing to be told whose was whose. When they had finished, one of them said, "Mum would have ironed those," and the other said, "Mum ironed tea towels," and they both laughed until one of them had to sit down.

And once, late, nearly closing, a man on his own, quite smart, holding a single child's cardigan, very small, yellow, still warm from the dryer. He was not doing anything with it. He was just holding it. Then he folded it more carefully than I have ever seen anything folded and put it on top of the pile, and stood for a second with his hand flat on it.

I have no joke for that one. I just wrote it down.

The man came in February and fixed the machine in twenty minutes. It is very convenient. It sits in my kitchen and washes my clothes and tells me nothing whatsoever.

I still go to Dyer Street some Sundays. I take a pillowcase, for the look of the thing.

Last week the elderly gentleman was there. Two different socks again. He nodded at me, as one professional to another.` },

  { id: 'col_umbrella', title: 'The Slow Lane: A Short History of My Umbrellas', by: 'Odette Marsh, Bay Courier', genre: 'courier', day: 6, blurb: 'Fourteen umbrellas, one city, and a theory about where they all go.', text: `
I have owned, by a conservative estimate, fourteen umbrellas since I moved to Maple Bay. I currently own none. I should like to account for them.

The first was black, sensible, and a leaving present from my mother, who said the coast was damp. It lasted three weeks. I left it on the 14 bus, went back to the depot, and was shown into a room containing roughly four hundred black, sensible umbrellas. "Take your pick," said the man. I took one. It was not mine. It was better than mine. This was my introduction to the system.

The second, therefore, was a stranger's. I lost it at the cinema.

The third was red, on the theory that I would not leave behind anything so visible. I left it in the fish market, where it was very visible, for about a month, hanging on the end of the ice counter like a flag of surrender. I could not bring myself to go and ask. Eventually it vanished. I hope it is happy.

Four through seven I think of as the cheap years. They were the kind you buy from a bucket outside the corner shop when the sky opens, and they had the life expectancy of a mayfly. One turned inside out on the footbridge with a noise like a pistol and I simply let go of it. I watched it travel the length of the harbor. For all I know it reached the lighthouse.

The eighth was a gift from a gentleman I was seeing, and was large, and green, and very fine, with a wooden handle. We lasted until the spring. The umbrella, I notice, lasted until almost exactly the same week. I draw no conclusions.

The ninth I never opened. I bought it, carried it for six dry weeks as a sort of charm, and gave it to a girl at a bus stop who was holding a newspaper over her head. She looked at me as if I had handed her a kitten. That is the only one I know the fate of, and it is the only one I miss.

Ten, eleven, twelve: bus, cafe, bus.

The thirteenth I chained to my bag. I mean this literally; I bought a small chain. I lost the bag.

The fourteenth lasted a year and a half, which is my record, and I became superstitious about it. It was not a good umbrella. It was a faded sort of blue and one rib was bent. I left it, last month, in a taxi, and realised on the pavement, and stood in the rain and found that I was not annoyed at all. I was thinking: there you go, then. Off you go.

Because I have a theory. I do not think there are very many umbrellas in Maple Bay. I think there are perhaps two thousand, and I think they are all in constant, gentle circulation, like library books, or the tide. You never own one. You carry it for a while. Then somebody else needs it more.

It rained this morning. I walked to work under a newspaper.

At the bus stop, a young woman I have never seen before held out half of a large, green umbrella with a wooden handle.

"There's room," she said.` },

  { id: 'col_letters', title: 'Letters to the Editor', by: 'Readers of the Bay Courier', genre: 'courier', day: 5, blurb: 'A selection from this week\'s postbag. The Courier does not endorse any of these positions, especially the one about the ducks.', text: `
SIR: Your correspondent of last week claims that the clock on the Old Town tower is "four minutes fast." It is not. It is correct. Everything else is four minutes slow, and has been since the nineteen-sixties, and I have the diaries to prove it.
H. Castellane, Old Town

SIR: May I, through your pages, thank the young person who returned my shopping trolley after it rolled down Hillcrest Road on Tuesday. I did not get your name. I would also like to thank the driver of the 9 bus, the two cyclists, and the gentleman from the fruit stall, all of whom the trolley passed on its way, and all of whom, I am told, cheered.
Mrs. P. Oyelaran, Hillcrest

SIR: Regarding the proposal to rename the River Walk. No.
A. Finch, Riverside

SIR: I have fed the ducks at the pond in Founders Park every morning for eleven years. I wish to register that they have recently become organised. There is now a queue. One of them is clearly in charge. I am not complaining, I simply think the public should know.
Name and address supplied

SIR: Your restaurant critic describes the chowder at a certain harbor establishment as "merely fine." I have eaten that chowder on the day my daughter was born, the day I retired, and every wet Thursday in between. It is not merely fine. It is exactly fine, which is a much rarer thing, and your critic should be sent to sit on a cold pier until they understand the difference.
G. Halloran, Harbor District

SIR: Is anyone else's cat watching the lighthouse? Mine sits in the window from dusk and turns her head with the beam. All night. I am beginning to feel left out of something.
T. Brandvold, Seaview Terrace

SIR: I write in defence of pigeons. They are punctual, they mate for life, and they found their way home for thousands of years before any of us had a telephone. The one outside the bakery has more civic pride than half the council. I would vote for him.
E. Nakagawa, Arts Quarter

SIR: I would not.
A. Finch, Riverside

SIR: A small correction to your history page. The Great Ferry Race of 1957 was not "won by the Marigold." The Marigold arrived first. That is not the same thing. My father was on the Persistence, which stopped to pick up a man who had fallen off the Marigold, and I will thank you to print that.
R. Achebe-Lund, Pier Road

SIR: To whoever has been leaving a single fresh flower on the bench by the rowing club every Monday since March: I do not know who it is for. I hope they know. It is the best thing in my week.
A walker, Riverside

SIR: Further to my letter about the ducks. There are now two queues.
Name and address supplied

The Editor writes: Letters may be left at the Courier office on Press Street or handed to any member of staff, who can usually be found at the second-best bench. We regret we cannot enter into correspondence about the clock.` },

  { id: 'col_vending', title: 'Every Vending Machine at Central Station, Ranked', by: 'The Courier Weekend Desk', genre: 'courier', day: 0, blurb: 'There are six. We tried them all so that you do not have to. One of them tried us back.', text: `
There are six vending machines at Central Station. Over one long Wednesday, with a bag of coins and a growing sense of purpose, we used every one of them. Here they are, worst to best.

6. THE ONE BY PLATFORM 1 (HOT DRINKS)
It offers tea, coffee, hot chocolate and something called simply "soup." We pressed tea. We received soup. We pressed coffee. We received soup, but with more confidence. A regular told us she has used it every weekday for six years and has never once had tea. "You get used to it," she said, drinking her soup.

5. THE TALL ONE BY THE TICKET HALL (SNACKS)
A handsome machine with a glass front and a spiral mechanism, which turns exactly far enough to let your biscuits lean out over the drop and then stops, so that they hang there, visible, paid for, and unobtainable. There are currently four packets in this condition. We are told the record is nine. People come to look at them. It is, in its way, a gallery.

4. THE ONE THAT ONLY TAKES EXACT CHANGE (PLATFORM 3)
Honest, at least. It will not give change and says so, on three separate labels, one handwritten. What it does not say is that it considers "exact" to be a matter of opinion. We put in the right money and it sat and thought about it for nearly a minute, and then, slowly, gave one coin back, as if to say: I think we both know that was too much.

3. THE COLD DRINKS MACHINE UNDER THE CLOCK
Works perfectly. Everything is cold, everything arrives, nothing is surprising. We bought a lemonade and it was a lemonade. Marked down only because, having been through numbers six to four, we no longer trusted it, and stood there for some time waiting for the catch.

2. THE SMALL ONE ON THE FOOTBRIDGE
Nobody knows who stocks it. It has no brand. It contains, at the time of writing: plasters, a single pear, shoelaces, mints, a paperback novel, and reading glasses in three strengths. Every item costs the same. We bought the pear. It was a very good pear. When we went back an hour later there was another pear.

1. THE OLD ONE AT THE END OF PLATFORM 4
It is green, it is enamel, and it has a brass handle that you pull, properly, with your whole arm. It sells one thing: a small bar of plain chocolate wrapped in paper. It has sold one thing since before the station had electric light. The price has been painted over so many times that the number stands out from the metal like a scar.

You put in your coin. You pull the handle. There is a noise from deep inside, a solid, unhurried, mechanical noise, like a very old person standing up to fetch you something. And then the drawer slides out, and there it is.

We do not know if it is good chocolate. It is impossible to tell. By the time you have pulled that handle you are eight years old, and everything is delicious.

Go to Platform 4. Take a coin. Take your time.` },

  // ------------------------------------------------------------------ Stories
  { id: 'ghost_step', title: 'The Thirteenth Step', by: 'Lorcan Vey', genre: 'story', day: 0, blurb: 'A ghost story. The lighthouse at Maple Point has 129 steps. The night keeper has counted them every night for thirty years. Tonight there are 130.', text: `
The stair at Maple Point Light has one hundred and twenty-nine steps, and Tobias Wren had climbed them every dusk for thirty years, and he counted them every time. Not for any reason. The way you count your change.

On the fourth of November he counted a hundred and thirty.

He stopped at the top with his hand on the rail. The lamp room was as it always was: the great lens turning in its bath of mercury, the brass ticking as it warmed, the sea a long way down and going dark. He stood and listened to his own breathing. Then he went down again, counting.

A hundred and twenty-nine.

He was not a fanciful man. He made tea. He wrote in the log: Wind SW 4, vis good, lamp lit 1652. He did not write anything else, because the log is for the next keeper, and you do not hand a man your nerves along with the weather.

The next dusk it was a hundred and thirty again, going up. This time he paid attention, and so he knew which one it was. It was the thirteenth. Twelve was iron, cold through the boot, ringing a little. Fourteen was the same. Between them was a step that made no sound at all.

He stood on it. It held him. It was, if anything, slightly warm.

Now, there is a story about the first keeper at Maple Point, and Tobias knew it, because every keeper is told it on his first night by the man he is replacing, as a courtesy. The first keeper was Elias Trott. In the great storm of 1923 the lamp went out, a seized bearing, at the worst hour of the worst night in a century, with fourteen boats outside the bar. Trott went up the stair in the dark with a lantern in his teeth and a can of oil, and turned the lens by hand until morning. Six hours. Every boat came in.

They say he never came down. Not that he died up there; he lived another twenty years and is buried in the churchyard with a view of the car park. They mean something else. They say that some part of a man who has climbed in that sort of hurry stays on the stair, still climbing, in case.

Tobias had always thought it a good story. Standing on a step that had not been there on Monday, he revised his opinion of it slightly.

On the sixth of November the glass began to fall at noon and went on falling. By dusk the sea had turned the colour of slate and the wind had a note in it he did not care for. He lit the lamp early. He went up at eight to check the bearing, and again at ten, and each time the thirteenth step was there under his foot, silent, patient, faintly warm.

At ten past two in the morning, with the gale at its height and three trawlers showing on the radar outside the bar, the lamp stopped turning.

He took the stair at a run. He had the oil. He had the torch in his teeth, and the thought in his head, quite clearly, that he was fifty-nine and that a hundred and twenty-nine steps at that pace was more than his heart had agreed to.

At the thirteenth step, something took the oil can out of his hand.

It was not snatched. It was taken the way you take a heavy bag from someone at a station: firmly, and with a certain tact. And a voice just ahead of him on the stair, not loud, not strange, only a little out of breath, said:

"I've got it, lad. You see to the boats."

Tobias Wren stood very still for the space of one breath. Then he went down, and got on the radio, and talked three trawlers over the bar by voice alone, while above his head the lens of Maple Point Light began, slowly and then steadily, to turn.

It turned until morning.

He climbed at dawn. The oil can was on the floor of the lamp room, empty, set neatly against the wall. The bearing was cold and clean. And on the way down he counted, as he always did, and there were a hundred and twenty-nine.

He wrote it in the log. He thought the next keeper had better know.

Lamp failed 0210. Restored 0214. Turned by hand till light.

And then, after some thought, on the line below:

Not mine.` },

  { id: 'rom_dumplings', title: 'Two Dumplings', by: 'Suvi Laine', genre: 'story', day: 0, blurb: 'A night-market romance. One stall, one last portion, two people who both got there first.', text: `
The dumpling stall at the Friday night market closes when the dumplings run out, and by half past nine there was one portion left, and two people pointing at it.

"Sorry," said the man. "After you."

"No, no," said the woman. "You were here."

"I really don't think I was."

"You had your hand up."

"I was waving at someone." He looked round. There was nobody. "They've gone."

The stallholder, a small woman in an apron who had watched this exact scene approximately once a week for twenty years, put six dumplings in one paper tray, stuck two forks in it, and held it out between them.

"Three each," she said. "Bench is over there. I'm closing."

So that was how Ines Okafor, who repaired clocks and did not talk to strangers, came to be sitting on a bench under a string of paper lanterns next to a man called Daniel, who taught swimming to nervous adults and talked to everybody, eating dumplings out of the same tray and being very careful about whose side was whose.

"That's a strange job," she said. "Nervous adults."

"It's the best job. Children just get in. Adults stand on the side for twenty minutes explaining why they can't." He ate a dumpling. "And then one day they put their face in the water and come up looking like they've been told a secret. What's strange is clocks."

"Clocks aren't strange. Clocks are the only thing that makes sense." She had not meant to say that so firmly. "They tell you what's wrong with them, if you listen. People never do."

"What do I sound like?"

She actually considered it. "Fast," she said. "About four minutes. But regular."

He laughed so much that a passing child stared.

They had got down to the last two dumplings. One was a perfectly ordinary dumpling. The other was the big one, the one there always is, the one that got twice the filling by some accident of the spoon.

Neither of them took it.

They talked about the market instead. They talked about the stall that sold nothing but lemons, and how it survived. They talked about whether the man who played the saw was good, or whether there was simply nobody to compare him to. The lanterns swung. The stalls came down around them in a clatter of poles. The ordinary dumpling got eaten at some point, by one of them, neither could have said which.

The big one sat in the tray and went cold.

"You have it," said Daniel.

"I couldn't possibly."

"You're just being polite."

"So are you."

"I'm not, I'm terrified," he said. "If I eat it, that's the end of the dumplings, and then there's no reason to be sitting here."

Ines looked at the tray. She was a person who took things apart to see what was wrong with them, and she found, taking this apart, that nothing was wrong with it at all.

She picked up her fork and, with the care of someone setting a very small balance wheel, cut the dumpling exactly in two.

"There," she said. "Now it's still going."

The stallholder, wheeling her cart past them toward the gate, did not look round. But she did, they both agreed afterward, slow down.

They were there the next Friday, at nine, which is far too early for the dumplings to run out. They bought a portion each, and sat on the bench, and Daniel was on his second before he noticed she had not started.

"What's wrong?"

"Nothing," said Ines, and held out her tray. "I just think they taste better from the same one."` },

  { id: 'scifi_tidal', title: 'Last Stop, Tidal Moon', by: 'R. K. Osei', genre: 'story', day: 12, blurb: 'Science fiction. The night shuttle to the moon colony has one driver, eleven passengers and a timetable that has never been wrong.', text: `
The 23:10 to Tidal Moon was a bus, whatever the company called it.

It had forty seats, a luggage rack, and a driver named Bettina Moro, who had done the run nine thousand times and still said "Mind the step" to every passenger, though there had not been a step since they sealed the hull. The run took four hours, bay to moon. The moon had been there a long time before anyone thought to put a stop on it.

Tonight there were eleven aboard. Bettina knew most of them. Shift workers for the tide engines, going up for the week. A grandmother with a cake tin on her knees. A boy of about nineteen with a rucksack and the look of someone who had told his family at the last possible minute.

They cleared the atmosphere at half past, and the bay went from a place to a shape to a light, and then it was just the dark and the hum and the little reading lamps.

At one in the morning, with the moon filling a third of the windscreen, the board lit amber. Docking fault. The cradle at Tidal Station had not opened.

Bettina tried the radio. The station answered at once, polite and synthetic: the cradle was undergoing unscheduled maintenance, estimated duration nine hours, we apologise for any inconvenience.

She had air for six.

She did not announce it. Eleven frightened people cannot help you steer. She sat with her hands on the wheel and thought, the way she thought on an icy road, slowly and all the way through.

There was the old dock on the far side. Decommissioned twelve years. Manual clamps. No lights.

"Ladies and gentlemen," she said into the speaker, in exactly the voice she used for roadworks, "there's a diversion in place this evening. We'll be going round the back way. It's a bit bumpier, so I'll ask you to keep your belts on, and it adds about twenty minutes. I do apologise."

Somebody groaned. Somebody went back to sleep. The grandmother opened the cake tin and passed it across the aisle to the boy with the rucksack, who looked as if he might cry.

The far side of Tidal Moon is not dark, whatever people say. It has the stars. Bettina brought the bus in by starlight and by a memory of having done it once, in training, on a simulator, on a Tuesday twenty-two years ago. She found the dock by its shadow. She matched it. She put forty seats and eleven people against a manual clamp at a closing speed slower than a walk, and felt it take, a small solid knock, like a cup set down on a saucer.

"That's us," she said. "Tidal Moon, far side. There'll be a short walk through to the concourse. Mind the step."

There was one. She had not said it truthfully in years.

They filed past her. The engine crews, yawning. The boy, with crumbs on his coat, who stopped and seemed to want to say something and in the end said "Thanks for the lift."

The grandmother came last. She put the cake tin on the dashboard. There were two slices left.

"Round the back way," she said. "In thirty years I've never known there was one."

"There isn't," said Bettina. "Don't tell the company."

The old woman patted the dashboard, the way you'd pat a horse.

Bettina sat for a while after they had gone, eating cake, looking at the stars over the dead dock. Then she checked the clock. Twenty-two minutes late. She took out the pen and the sheet, and in the box marked Reason for Delay she wrote, after some thought, the only thing that would fit.

Diversion. All passengers delivered.

The 05:10 back to the bay left on time.` },

  { id: 'fable_fog', title: 'The Fog That Wanted a Job', by: 'Marguerite Sole', genre: 'story', day: 13, blurb: 'A fable for a grey morning. Everything in the harbor has something to do except the fog, which decides to apply.', text: `
Everything in the harbor had a job, and the Fog had noticed.

The Tide went out and came in. The Lighthouse stood and shone. The Gulls shouted the news. Even the old Rope on Pier 2 had a job, which was to be pulled, and it did it gladly. Only the Fog had nothing to do. It arrived, it lay about, and people looked at it and sighed.

"I should like," said the Fog one morning, "to be useful."

It went first to the Lighthouse.

"I could shine," said the Fog. "I'm very good at being seen."

"You are very good at not being seen through," said the Lighthouse, kindly enough. "It isn't the same. But try, if you like."

The Fog tried. It gathered itself up and glowed as hard as it could, which was a soft grey. A fishing boat steered toward it, mistook it for the harbor mouth, and had to be shouted off the rocks by the Gulls.

"Thank you for coming in," said the Lighthouse.

So the Fog went to the Tide.

"I could go out and come in," it said. "I do that anyway."

"You do it whenever you like," said the Tide, who was busy. "I do it at eleven minutes past four. People set their lives by me. Could they set their lives by you?"

The Fog thought of all the mornings it had said it would lift by ten and had still been there at lunch. It did not answer.

It tried the Gulls, but it had no voice. It tried the Ferry, but it could not carry so much as a hat. By evening it had drifted to the very end of the last pier and lay down on the water, thin and low, feeling as nearly sorry for itself as a weather can.

There was a girl on the pier. She was sitting with her feet over the edge and her chin on the rail, and she had the look of someone who had been told to go and play and had nobody to do it with.

"Hello, Fog," she said, because she was at the age when you still say hello to things.

The Fog, not knowing what else to do, came a little closer.

The girl looked up. The harbor she knew, the cranes and the sheds and the dull green boats, had gone soft at the edges. The far pier was a pencil line. The lighthouse was a smudge with a slow gold heartbeat in it. A boat went by that might have been any boat, going anywhere. It might have been a pirate. It might have been bringing someone home.

"Oh," said the girl. She stood up. "It's all different."

She walked the whole length of the pier and back, slowly, looking at everything as though she had never seen it, because she never had. An old man mending nets looked up to see what she was staring at, and stopped mending. A woman hurrying home with shopping slowed, and stood, and put the bags down.

Nobody sighed.

"There," said the Lighthouse, from a long way off, blinking gold through the grey. "That's the job."

"What is?" said the Fog.

"Everyone else in this harbor shows people where things are," said the Lighthouse. "You're the only one who can make them look twice."

The Fog thought about that all night. In the morning it lifted at exactly ten, as promised, for the first time in its life.

It was back by Thursday. It had work to do.` },

  // ------------------------------------------------------------------ For Small Readers
  { id: 'kid_ollie', title: 'Ollie the Otter and the Very Loud Shell', by: 'Pim Hartigan', genre: 'kids', day: 0, blurb: 'A bedtime story. Ollie finds a shell with the whole sea inside it, and nobody in the harbor gets any sleep.', text: `
Ollie the otter lived under Pier 3, in a nest of rope, with a view of the fish market.

One morning, at the bottom of the tide, Ollie found a shell. It was as big as his head and curly at one end and pink inside, like the roof of a yawn.

Ollie held it up to his ear.

SHHHHHHHHHH, said the shell.

"There's a sea in here!" said Ollie. "A whole one!"

He took it straight to show Mo, who was his best friend and a very serious heron.

"Listen," said Ollie, and held it to the side of Mo's head, roughly where he thought a heron kept its ears.

SHHHHHHHHHH, said the shell.

"It is telling me to be quiet," said Mo. "I was already being quiet. I am always quiet. I find this shell rude."

"It's not rude, it's the sea!"

"We have a sea," said Mo, and pointed at it with one long foot.

But Ollie loved his shell. He carried it everywhere. He listened to it at breakfast. He listened to it in the bath, which is a strange thing to do when you live in the sea, but he did.

And then Ollie had an idea. It was not a good idea. It was the kind you have just before a nap.

"If I can hear the sea in the shell," said Ollie, "I wonder if the sea can hear ME."

He put his mouth to the curly end. He took the biggest breath an otter has ever taken. And he blew.

BWAAAAAAARP.

Every gull on the fish market roof went straight up in the air. A crab fell off a rock. The harbor master spilled his tea. Far out on the water, the big white ferry stopped, and turned its whole self around, and went back the way it had come, because it thought it had been told to.

"Oh," said Ollie. "It's a LOUD shell."

He did it again. Of course he did.

BWAAAAAAARP.

By lunchtime, Ollie had sent the ferry home three times. By teatime, the fishing boats were going round in circles. By bedtime, nobody in the harbor had heard themselves think since breakfast, and Mo the heron had put his head under his own wing and was pretending to be a post.

That night the fog came in.

It came in thick and quiet, the way it does, and it covered the piers and the boats and the lighthouse, until even the lighthouse was only a small yellow blur, like a torch under a blanket.

And out in the fog, somebody was crying.

It was a very small voice. It was Beans, the littlest otter, who had gone out to practise floating on her back and had floated a great deal further than she meant to.

"I can't see the pier!" cried Beans. "I can't see ANYTHING!"

All the otters called to her. But otters have small voices, and the fog ate them up.

Mo the heron looked at Ollie. He took his head out from under his wing to do it.

"Well?" said Mo. "You have been practising all day."

Ollie picked up his shell. He climbed to the very end of the pier. He took the biggest breath an otter has ever taken, bigger than the last one.

BWAAAAAAARP.

And again. And again. Slow and steady, so you could swim toward it.

BWAAAAARP. BWAAAAARP.

And out of the fog, paddling as fast as her small feet could go, straight toward the sound, came Beans.

After that, nobody minded the shell. The harbor master gave Ollie a hook to hang it on, at the end of Pier 3, and a rule to go with it, which was: only when it's foggy.

Ollie has kept that rule nearly every day.

And if you are ever in the harbor on a foggy night and you hear something that is not the bell and not the ferry, something a bit like a trumpet and a bit like a sneeze, you needn't worry.

It's only Ollie, bringing everyone home.

Goodnight, harbor. SHHHHHHHHHH.` },

  { id: 'kid_pigeons', title: 'The Pigeons Hold a Meeting', by: 'Pim Hartigan', genre: 'kids', day: 4, blurb: 'A story for reading aloud. The pigeons of Clocktower Square have an important matter to discuss. It is a chip.', text: `
On the ledge of the clock tower, above the square, the pigeons of Old Town were holding a meeting.

There were seven of them. There was Gerald, who was the oldest. There was Petunia, who was the cleverest. There were Bob, Bob, and Other Bob, who were brothers. There was Small Sue. And there was Clive, who was not really listening.

"Order!" said Gerald. "Order! This meeting is about a matter of the greatest importance."

"Is it the cat?" said Small Sue.

"It is not the cat."

"Is it the man with the broom?"

"It is not the man with the broom. It is THAT." And Gerald pointed with his beak, down, down, down to the square, where right in the middle of the paving stones, golden in the sun, with a little salt still on it, lay a chip.

All seven pigeons looked at the chip.

"That," said Bob, "is a big one."

"That," said Bob, "is the biggest one I have ever seen."

"I had a bigger one once," said Other Bob. Nobody believed him.

"The question before the meeting," said Gerald, "is this. WHO gets the chip?"

"I am the oldest," said Gerald. "So I should have it."

"I am the cleverest," said Petunia. "I should have it, because I will appreciate it most."

"There are three of us," said the Bobs. "We should have it, because we are the most."

"I am the smallest," said Small Sue. "I should have it, because I need to grow."

Clive said nothing. Clive was watching a cloud that looked a bit like a bun.

So they voted. Every pigeon voted for themself, except Clive, who voted for the cloud.

"That is no good," said Gerald. "We shall have to do this properly. Petunia, make a plan."

Petunia made a plan. It was a very clever plan. She scratched it in the dust on the ledge with her foot. There were arrows. First, the chip would be measured. Then it would be divided into seven pieces, exactly equal, by pecking. Then each pigeon would get a piece, in order of age, except that the Bobs would count as one pigeon for the order and three for the pieces.

"What about the salt?" said Small Sue.

So they had to do the plan again, with the salt.

It took a long time. The clock above them went BONG, and then later it went BONG BONG. The shadows moved across the square. A bus came and went.

"There," said Petunia at last. "It is perfect. It is completely fair. Nobody can argue with it."

Nobody did. They all agreed it was the best plan pigeons had ever made.

"Then let us go down," said Gerald grandly, "and get our chip."

Seven pigeons looked over the edge.

The square was empty. There were the paving stones, and there was the sun, and there was a little bit of salt.

And there, strolling away toward the fountain, looking very round and very pleased, with something golden just disappearing into his beak, was Clive.

"CLIVE!" shouted everyone.

Clive swallowed. He looked up.

"Sorry," said Clive. "Was there a meeting?"

The pigeons of Old Town do not have meetings any more. When they see a chip now, they all just go.

It is not fair. But it is much, much faster.

And Clive still wins. Nobody knows how.` },

  // ------------------------------------------------------------------ Recipes With a Story
  { id: 'rec_chowder', title: 'Nana\'s Wrong Chowder', by: 'Halvard Nilsen', genre: 'kitchen', day: 0, blurb: 'A recipe with a story. Every family in the harbor makes chowder. Only one family makes it wrong on purpose.', text: `
My grandmother made the worst chowder on Pier Road, and people queued for it.

I should explain. Proper harbor chowder, as any of my neighbours will tell you at length, has cream in it, and a bay leaf, and you sweat the onions slowly in butter and you never, ever let it boil. My grandmother thought all of that was fuss. She had four children, a husband on the boats and a stove with one working ring. Her chowder had milk, because milk was what there was. It had no bay leaf, because she said it tasted of hedge. And she boiled it, hard, for exactly as long as it took to hang out a wash.

It should have been dreadful. It was thin where it should have been thick, and the potatoes fell apart, and it had a faint catch at the bottom of the pan that she called "the flavour."

It was also the thing you wanted, more than anything on earth, when you came in off the water with no feeling in your hands.

After she died, my mother made it properly for a while. Cream. Bay leaf. A gentle heat. It was very good. We ate it politely. My uncle, who is not a subtle man, put down his spoon one Sunday and said: "It's lovely, Astrid. It's just not wrong enough."

So here is the wrong one. I give it exactly as she did, which is to say out loud, with her back to me, while doing something else.

NANA'S WRONG CHOWDER
Feeds four, or two off the boats.

2 big potatoes, the floury kind
1 onion
2 cobs of sweetcorn, or a tin, she was not proud
A lump of butter "about the size of a bad decision"
Milk, about a pint and a half
Salt, and more pepper than seems right

1. Chop the onion. Do not be careful about it.

2. Put the butter in your biggest pan and the onion on top, and turn the heat up further than you think. When the onion has gone gold at the edges and you are slightly worried, that is the moment.

3. Potatoes in, cut in chunks the size of a thumb. Corn in. Stir it about so everything gets buttery. Salt now.

4. Pour in the milk. All of it, at once, cold. It will hiss at you. Let it.

5. Bring it to the boil. I know. Do it anyway. Then turn it down to a good steady bubble and go and do something else for twenty minutes. Hang out a wash. Shout at someone on the stairs.

6. When you come back, the potatoes should be falling apart and the bottom should have just begun to catch. Scrape that up into the rest. That is the flavour.

7. Pepper. A great deal. Then taste it and add more.

Eat it standing up, out of a mug if the bowls are dirty, with bread to wipe round.

It will not be the best chowder you have ever had. My neighbours' is better, and they will tell you so.

But some night in February you will come in with the cold right through you, and you will not want the best. You will want this.

She always said the secret was not to respect it too much. I think that was her secret for most things.` },

  { id: 'rec_pancakes', title: 'Emergency Pancakes', by: 'Halvard Nilsen', genre: 'kitchen', day: 8, blurb: 'A recipe with a story. What to cook at seven in the morning when there is nothing in the house and somebody small is looking at you.', text: `
There is a kind of morning every household knows. The bread is finished. The cereal box, when lifted, proves to be a decoy. It is ten past seven, it is raining, and standing in the kitchen doorway in a dressing gown is a person three feet tall who has asked, quite reasonably, what is for breakfast.

This is what Emergency Pancakes are for.

I learned them from my father, who could cook exactly one thing and deployed it with the confidence of a man who can cook forty. He had worked nights on the ferries. He would come in at seven as we were getting up, smelling of diesel and cold, and if the cupboard was bare he would roll up his sleeves and say, "Right. Stand back. This is a job for a professional."

Then he would make a tremendous mess.

That was the point, I see now. The pancakes were ordinary. The performance was the breakfast. He cracked eggs one-handed and got shell in every time and fished it out with a larger piece of shell, explaining that this was how it was done in the best hotels. He measured flour by throwing it at the bowl from a distance. He flipped every pancake far higher than it needed to go, and about one in four he caught.

The ones he dropped went to the dog. The dog had views about Emergency Pancakes. The dog thought they were the best thing that ever happened in that house.

Here is the recipe. It needs nothing you will not have.

EMERGENCY PANCAKES
Makes about eight. Feeds two children and one dog.

1 mug of flour (any mug; use the same one throughout)
1 mug of milk
1 egg
A pinch of salt
Butter for the pan
Whatever is in the house to go on top

1. Announce that you are a professional. This step is not optional.

2. Flour in a bowl. Make a hole in the middle with your fist. Crack the egg into the hole. If shell goes in, remove it with dignity.

3. Pour in about half the milk and stir from the middle outward with a fork until the lumps give up. Then the rest of the milk. It should be about as thick as paint. Add the salt.

4. Get the pan properly hot. Hotter than that. A small piece of butter should skate across it and complain.

5. Pour in enough batter to cover about two thirds of the pan, and tilt it round. Count to forty. When the edges lift and go lacy, it is ready to turn.

6. The flip. Loosen it first with a shake. Then commit. The pancake can tell if you are afraid. Up, over, catch. If you do not catch it, there is a dog.

7. Count to twenty on the second side. Onto a plate. The first one is always a disaster; this is tradition and has nothing to do with you.

For the top: sugar and lemon if you have a lemon. Jam. Honey. A sliced banana. Once, in a true emergency, my father used the last of a jar of marmalade and a crushed biscuit, and we talked about it for years.

Eat them as they come, standing at the counter, one at a time, hot. Do not try to keep a stack warm. A stack is a different, calmer dish, for calmer mornings.

I make these for my own two now. I am better at the flip than he was. I have decided not to be. About one in four, I let go a little late, and it sails past the pan, and there is a shriek, and a scrabble of claws on the kitchen floor.

Different dog. Same views.` },

  // ------------------------------------------------------------------ Poems
  { id: 'poem_rail', title: 'Seven Small Poems for the Light Rail', by: 'Ione Addai', genre: 'poems', day: 0, blurb: 'One for each stop you might be reading this between. Short enough to finish before your station.', text: `
1. HILLCREST, 6:58
The platform holds
nine people and one pigeon.
Only the pigeon
is sure it is going somewhere.

2. DOORS
The doors say they are closing.
They say it to everyone
the same,
the late and the lucky.
I have never heard
a fairer voice.

3. WINDOW SEAT
My face in the glass
rides just outside the train,
a little ahead of me,
getting to everything first
and not saying
what it's like.

4. THE VIADUCT
For eleven seconds
the whole bay is underneath us.
Nobody looks up from their phone.
Nobody needs to.
We can feel it through the floor,
all that light,
holding us up.

5. SOMEONE ELSE'S MUSIC
A small tin sound
escaping from your earphones.
I can't tell the song.
I can tell
you love it.
That's enough to go on.

6. DELAY
We apologise, says the voice,
for the late running of this service.
And for a moment
the whole carriage is forgiven
everything:
the meetings, the dentist, the long day.
None of it is our fault.
A train is late.
We sit, absolved,
between two stations,
and somebody opens a bag of crisps
like a small bell.

7. LAST TRAIN
The carriage is nearly empty.
A man sleeps with his hat on his knee.
A girl takes off her shoes
and holds them like two tired animals.
The driver, somewhere up ahead,
is the only one awake in the city,
carrying us home
one lit window at a time.

Arts Quarter. Old Town. Riverside.
The names go by
like a mother counting heads.

All here.
All here.
All here.

AFTERWORD, FROM THE POET
I wrote these on the loop line over one winter, on the backs of tickets, which is why they are the size they are. A ticket holds about nine lines if you write small. I recommend the form. It is very hard to be pompous on a ticket.

People ask whether the train is a metaphor. I do not think so. I think the train is a train. But I notice that it is the one place in the city where three hundred of us agree, every morning, without a word, to sit quietly together and be carried in the same direction, and I notice that I come out of it kinder than I went in.

If that is a metaphor, it is not mine. It belongs to the transit authority.

If you are reading this between stations: look up. You have about eleven seconds on the viaduct. It is better than the poem.` },

  { id: 'poem_harbor', title: 'Harbor, 6 a.m., and Other Poems', by: 'Ione Addai', genre: 'poems', day: 10, blurb: 'Five poems about the water at the edge of town, from the same pocket notebook.', text: `
HARBOR, 6 A.M.
Before the cafes,
before the gulls have settled
who owns what,
the water lies flat as a held breath
and every boat
sits on its own reflection
like a thought
on the thing it is about.

Then one engine.
Then the day.

THE FERRY
It only goes across.
It has only ever gone across.
A mile of water, forty times a day,
for a hundred years.

People feel sorry for it.
I don't.
I know men who have been everywhere
and never arrived.
The ferry arrives
forty times a day.

WHAT THE LIGHTHOUSE SAYS
Not: come here.
The lighthouse never says come here.
It says: here is where I am.
Now you know where you are.

It is the only honest advice
I have ever been given,
and it was given
to everybody.

LOW TIDE, WITH MY FATHER
He walked out on the flats
further than I liked,
a small dark stroke
on all that shining,
and turned, and waved,
to show me how far the land went
when you were patient.

I think of that.
How much there is
that is only covered,
not gone.
How it comes back,
twice a day,
the whole wide floor of things,
and you can walk on it.

NIGHT MARKET, CLOSING
The last stall folds its light
like a napkin.
Poles clatter. Someone laughs
at something I will never know.
The pavement keeps the smell of ginger
for an hour.

All that brightness,
packed into four vans by midnight.
And yet
on Saturday morning
I find one paper lantern
caught in the plane tree,
still orange,
still, somehow, lit.

A NOTE ON THESE
The notebook these came out of is the kind you buy at the corner shop, with a cardboard cover and a rubber band. It lives in my coat. It has also, over the years, held shopping lists, a telephone number I never rang, and the score of a game of cards played on a delayed train.

I mention this because people imagine poems arriving in a special room. Mine arrive on the harbor wall, usually when I am waiting for someone who is late. I have come to be grateful to late people. Most of what I have written, I owe to them.

The one about my father is true. He is eighty now and still walks out on the flats, further than I like. He still turns and waves.

I wave back. Then I write it down.` },

  // ------------------------------------------------------------------ Local History
  { id: 'hist_name', title: 'How Maple Bay Got Its Name (Twice)', by: 'The Maple Bay Historical Society', genre: 'history', day: 0, blurb: 'Local history. There were no maples here when the town was named. That is, more or less, the whole story.', text: `
Visitors to Maple Bay often ask where the maples are. It is a fair question, and for the first sixty years of the town's existence the honest answer was: there aren't any.

The bay was charted in 1802 by a survey vessel whose captain, a methodical man, named features after whatever he could see from the deck. His log gives us Gull Rock (gulls), Flat Point (flat) and, less happily, Disappointment Creek (he had hoped it was a river). Of the bay itself he wrote only: "A good anchorage. Wooded to the water with alder and some pine." He called it Alder Bay, and Alder Bay it remained on every chart for the next forty years.

The change came through an error, and the error came through a man named Josiah Kemble.

Kemble was a land agent who arrived in 1843 with a commission to sell lots in the new settlement to buyers back east. He had never seen an alder. He had, however, seen a great many advertisements, and he understood that "Alder Bay" did not sound like a place a family would cross a continent for. Alders are damp, modest trees. They suggest a ditch.

So in the prospectus he had printed that winter, the town appears as "Maple Bay, a Situation of Singular Beauty." There was an engraving. It showed a broad avenue of mature maples leading to a handsome church. Neither the avenue nor the church existed, and the maples were, at that time, some two thousand miles away.

The lots sold very well.

One can only imagine the first boatload of settlers coming ashore in the spring of 1844, prospectus in hand, and looking about. The Society holds a letter from one of them, a Mrs. Abigail Thorne, to her sister. "We are arrived," she writes. "There is mud to the knee and not one maple. Mr. Kemble has been spoken to."

What happened next is, we think, the most characteristic thing in the town's history. The settlers did not go home. They did not, after the first week, even stay angry. They held a meeting, in the only building with a roof, and resolved "that the Town having been sold to us as Maple Bay, Maple Bay it shall be, and that the deficiency be made good."

They sent for seedlings. The first crate arrived by ship in 1846: two hundred sugar maples, of which eleven survived the voyage. Those eleven were planted along what is now Maple Street, each one sponsored by a family, each one fenced against goats. Mrs. Thorne's is the third from the harbor end. It is still there. It is forty feet round at the base and the Society's offices are in its shade.

More crates followed. By 1870 there were maples in every street and the town had begun, a little shyly, to hold a festival each October when they turned. By 1900 nobody living could remember the bay without them, and a schoolbook of that date states with perfect confidence that the first explorers "named it for the glorious maples that crowned its shores."

So the town was named twice. Once by a captain, accurately, for what was there. And once by a salesman, falsely, for what was not; and then again by eighty-odd people standing in the mud, who decided to make the falsehood true.

We have always thought the second naming the better one.

Josiah Kemble, it should be recorded, never returned. But in 1861 a crate arrived at the harbor from an address back east, with no letter. It contained forty maple seedlings.

All forty lived.` },

  { id: 'hist_ferry', title: 'The Year the Ferry Froze', by: 'The Maple Bay Historical Society', genre: 'history', day: 3, blurb: 'Local history. For nineteen days in the winter of 1912 you could walk across the harbor. Almost everybody did.', text: `
The harbor at Maple Bay does not freeze. It is salt, it is tidal, and the current through the narrows keeps it moving in the hardest weather. Ask any pilot. It has frozen exactly once in recorded history, and people who were children then talked about it for the rest of their lives.

The cold came down on the ninth of January, 1912, and did not lift for three weeks. Wells failed. Milk froze on doorsteps and pushed its own caps off. On the morning of the fourteenth, the crew of the steam ferry Marigold came down to the slip to find her held fast at her moorings in six inches of ice, with a gull standing beside her, on the harbor, looking as surprised as they were.

By the sixteenth the ice was a foot thick and the harbor master, after walking out on it himself with a rope round his waist, declared it safe.

What followed was the nearest thing to a holiday the town had ever had.

The ferry could not run, so the town simply walked. A path was swept from the Old Town steps to Pier Road, a mile across, and marked with fish barrels and lanterns. The ferry company, with some presence of mind, set a man in a hut at each end and went on charging the fare. Nobody objected. It was felt to be only fair to the Marigold.

Within days there were stalls on the ice. Chestnuts, then hot pies, then a full coffee stand with a stove on a sheet of iron. A barber set up a chair. The Courier printed a special edition from a hand press dragged out on a sledge, and sold it as "the only newspaper in the nation produced upon the sea." A copy hangs in our reading room. The ink is a little smeared; the printer's hands were cold.

There was skating, of course. There was a horse race, won by a milk-cart pony named Admiral against two actual racehorses, who did not care for the footing. There was at least one wedding: a couple from opposite shores, who had been courting by ferry for two years, met in the exact middle of the harbor with a minister and forty guests, on the grounds that neither family would have to cross to the other's side.

And every evening at dusk, the keeper at Maple Point lit his lamp as usual, for ships that could not possibly come, and the whole town stood on the frozen sea and watched the beam go round over their heads.

It ended on the second of February. The wind went round to the south-west in the night. By morning the ice was grey and talking to itself, and the harbor master closed the path at noon. The stalls came off in a great hurry. The barber's chair was left behind and went through at about four o'clock, upright, with dignity; a photograph exists.

The Marigold floated free on the fourth and resumed service on the fifth. Her log for that day reads, in full: "Crossings resumed. Passengers quiet."

One thing remains. If you take the ferry today and stand at the rail about halfway over, you will see a green buoy with a number on it. It marks nothing. There is no rock there, no wreck, no channel. It was placed by subscription in 1913 and has been repainted every spring since.

It is where the wedding was.` },

  { id: 'hist_wheel', title: 'The Bay Wheel Was Supposed to Be Temporary', by: 'The Maple Bay Historical Society', genre: 'history', day: 11, blurb: 'Local history. It was built for one summer. That was a long time ago, and the paperwork has still not caught up.', text: `
The Bay Wheel has stood at the end of the boardwalk for so long that it appears on the town seal. It is therefore worth stating plainly that it was never meant to be there, that it has no planning permission, and that it is, in the strict legal sense, still on loan.

It arrived in the summer of 1936 on four railway wagons, as the centrepiece of a travelling exposition. The exposition was to stay eight weeks. The wheel was to go up on the first of June and come down on the last day of July, after which the whole show would move on down the coast.

The exposition went bankrupt on the nineteenth of June.

Its proprietor, a Mr. Lucian Pardoe, left town the same night, owing money to nearly everyone, including the forty men who had bolted the wheel together. He took the cash box and the performing seal. He left behind a tent, a steam organ, and one hundred and ten feet of ferris wheel, which is not a thing you can put in a suitcase.

The town council met in emergency session. The minutes are rather wonderful. It was established that the wheel belonged to Mr. Pardoe's creditors, of whom the largest was the town itself, for ground rent. It was established that taking it down would cost more than the debt. A motion to sell it for scrap was proposed, and was on the point of passing, when the member for the Harbor Ward, a fish merchant named Dora Vance, asked whether anyone present had actually been up in it.

Nobody had. The meeting adjourned to the boardwalk.

There is no minute of what was said in the gondolas. We know only that it was a clear evening, that the wheel was run by the same forty unpaid men, who were owed the pleasure at least, and that the council came down forty minutes later and voted nine to nothing "that the Wheel be retained for the present season, pending a permanent resolution."

It has been retained for the present season ever since. The motion is renewed each May. It has become the first item on the agenda and takes about four seconds. In 1962 a new clerk, tidy-minded, proposed that the wheel be formally adopted, and was told gently that this would require working out who owned it, and that it was felt better not to ask.

The forty men were paid in full that August, from the first month's takings. Several stayed on. The wheel has been run by their families ever since; the present operator is the great-granddaughter of the man who tightened the last bolt, and still has his spanner.

As for Mr. Pardoe, he was never heard from again, with one exception. In 1951 the council received a postcard from a seaside town a long way south. It showed a small, rather shabby ferris wheel. On the back was written: "Glad to see you kept her. She was always the best one. Do not send the bill. L.P."

The council voted to have it framed. It hangs in the ticket booth.

If you ride the wheel this week, you will be riding, technically, an unclaimed piece of lost property, eighty-odd years overdue for collection. From the top you can see the whole bay: the lighthouse, both bridges, the maples that were not here either, once.

It is a town with a habit of keeping things it was only meant to borrow. We find we do not mind.` },

  { id: 'field_birds', title: 'Field Notes: Birds of the Supermarket Car Park', by: 'The Courier Nature Desk', genre: 'courier', day: 7, blurb: 'You do not need to go to the marshes. A complete guide to the wildlife of Bay C, rows 4 to 9.', text: `
Readers write to ask where in Maple Bay one should go to watch birds. The marshes at Disappointment Creek are very fine, and so are the cliffs at the Point. But for sheer variety of behaviour, this desk recommends the car park of the big supermarket on Quay Road, any weekday, around noon. Take a flask. Sit in the car. What follows is a guide to what you will see.

THE HERRING GULL
Large, white, grey-backed, with a yellow eye that has never once expressed doubt. In the car park the herring gull occupies the tops of lamp posts, one gull per post, and there is a strict order of precedence which they settle each morning by shouting. From here the gull surveys the trolley bays. It is waiting for a child with a sausage roll. It has all day. It is, in its way, a model of patience, and we would admire it more if it had not once taken an entire sandwich out of this correspondent's hand without breaking eye contact.

THE FERAL PIGEON
Found in loose flocks near the recycling bins, walking about with the air of people who have arrived early for a meeting. Much maligned. Observe a pigeon for ten minutes and you will find it courteous, industrious and devoted to its mate, to whom the male bows repeatedly, turning in small circles. He is nearly always ignored. He goes on bowing. There is a lesson there and we decline to draw it.

THE HOUSE SPARROW
Small, brown, and living entirely inside the letter O of the supermarket's sign, where there is a nest every spring. The sparrows of Quay Road have learned that the automatic doors open for them. They do not go in. They simply like to make the doors open. On a quiet morning a single sparrow can keep both sets of doors busy for a quarter of an hour, hopping from sensor to sensor, and nobody in the building has ever worked out why the heating bill is so high.

THE PIED WAGTAIL
The gentleman of the car park. Black and white, slim, immaculately turned out, and always in a hurry: it runs, stops, wags, runs. It works the wet tarmac between rows 6 and 7 for insects and is the only bird present that appears to be earning its own living. It will come within a yard of your car door. It has no interest in your sandwich. It finds the gulls vulgar. We feel it would have a subscription to this newspaper if it could.

THE CROW
One pair, resident, in the poplars by the exit. The crows are the intelligence of the place. They have learned which bins are emptied on which day. They have learned to drop walnuts on the pedestrian crossing and wait for the lights to change. Last autumn this desk watched a crow walk the length of the trolley shelter, test each trolley with its foot, find the one with a coin still in the slot, and stand looking at it for some time, thinking.

It did not get the coin out. But it came back the next day with a twig.

THE HERON
Once. In February. At dawn, standing in the middle of row 4 in an inch of rainwater, perfectly still, enormous, like something left over from an older world. It looked at the supermarket. The supermarket did not seem to trouble it. Then it opened its wings, which took a moment, and went up over the roof toward the creek without a sound.

We have been back every morning since. We will let you know.` },
];
export const READ_BY_ID = Object.fromEntries(READS.map(r => [r.id, r]));
