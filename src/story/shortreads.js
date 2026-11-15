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
];
