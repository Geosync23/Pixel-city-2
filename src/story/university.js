// university.js — the people and the words of Maple Bay University: cast (professors, staff, classmates: names, looks, lines), the lectures (three boards and two
// questions each), the set reading of every course, the practical briefings, the exam papers, the open-lecture nights and the campus chatter.
// Pure text + looks; the engine is src/sim/university.js, the rooms src/scenes/rooms/university*.js. Course ids match src/data/university.js COURSES.
//   CAST { id: { name, short, role, look: { seed, ...spec overrides }, lines: [...], pass?: [...], grad?: [...] } }      CLASSMATES [ids]      GROUP [ids] (the study group)
//   LECTURES { courseId: [lecture0, lecture1] }, lecture = { title, open: text, boards: [{ h, t, fig, cap? }], ask: [Q, Q], close: text }
//   Q = [question, [three answers], index of the right one, what the professor says afterwards]
//   READING { courseId: { title, by, notes: [three short notes], ask: [Q, Q, Q] } }      PRACTICAL { courseId: { where, brief: [...], tips: [...], done: [...], project: { title, text } } }
//   FINAL { courseId: { title, intro, extra: [Q, Q] } }  (the paper = lecture + reading questions + extra)      OPEN [{ id, title, by: castId, boards, ask: [Q], close }]
//   LINES { student, exam, fair, commons, library, lecture (classmates' asides), late, missed (texts from professors) }

const L = (seed, o) => Object.assign({ seed }, o);
export const CAST = {
  /* ---- professors ---- */
  baptiste: { name: 'Prof. Odette Baptiste', short: 'Prof. Baptiste', role: 'Kitchen Science', look: L(41, { age: 'elder', hair: 'bun', hairColor: '#e8e8ee', top: 'jacket', topColor: '#f4f0e8', bottom: 'slacks', bottomColor: '#33303f', glasses: true }),
    lines: ['Salt early, taste late. Everything else is detail.', 'A recipe is a hypothesis. Dinner is the experiment.', 'I burned a roux in 1988. I still think about it.', 'Hunger is not an ingredient, but it helps.'],
    pass: ['You can cook AND you know why it works. That is rarer than you would think.'] },
  vandermeer: { name: 'Prof. Ingrid Vandermeer', short: 'Prof. Vandermeer', role: 'Drawing & Colour', look: L(52, { age: 'adult', hair: 'bob', hairColor: '#d9722e', top: 'cardigan', topColor: '#2f9a94', bottom: 'overalls', bottomColor: '#4a4a58', hat: 'beret', hatColor: '#b83a6a' }),
    lines: ['Draw what you see, not what you know. You know far too much.', 'Squint. Go on. Everybody squint.', 'There is no such thing as a mistake, only an underpainting.', 'Shadows are never grey. Look again.'],
    pass: ['You have started to see. It does not switch off, I am afraid.'] },
  lowell: { name: 'Prof. Emeka Lowell', short: 'Prof. Lowell', role: 'Creative Writing', look: L(63, { age: 'adult', hair: 'short', hairColor: '#2b2433', top: 'sweater', topColor: '#7a5238', bottom: 'slacks', bottomColor: '#4a4a58', glasses: true, beard: true }),
    lines: ['Somebody wants something and cannot have it. That is all of literature.', 'Cut the first paragraph. It was you clearing your throat.', 'Read it aloud. Your ear is a better editor than your eye.', 'I have been on page forty of my novel for six years. It is a very good page.'],
    pass: ['You wrote a true sentence and then you wrote another. Keep doing that.'] },
  varma: { name: 'Dr. Anjali Varma', short: 'Dr. Varma', role: 'Computing for Humans', look: L(74, { age: 'adult', hair: 'ponytail', hairColor: '#2b2433', top: 'hoodie', topColor: '#3b6fd0', bottom: 'jeans', bottomColor: '#34507f', glasses: true }),
    lines: ['The computer is not clever. It is fast and obedient, which is worse.', 'Have you tried explaining it to a rubber duck? I am serious. I have a duck.', 'A bug is just the program doing exactly what you said.', 'Turn it off and on again is a real technique and I will not hear otherwise.'],
    pass: ['You think in steps now. Sorry about that. It is permanent.'] },
  ekstrom: { name: 'Maestro Leopold Ekström', short: 'Maestro Ekström', role: 'Music Fundamentals', look: L(85, { age: 'elder', hair: 'wavy', hairColor: '#a9a9b4', top: 'suit', topColor: '#33303f', bottom: 'slacks', bottomColor: '#33303f', scarf: '#b83a6a' }),
    lines: ['Count! Out loud! Nobody ever died of counting.', 'The rests are music too. Play the rests.', 'I conducted the Symphony next door for nine years. They still wave.', 'A wrong note played with confidence is jazz.'],
    pass: ['You kept time under pressure. Half the orchestra cannot say that.'] },
  santangelo: { name: 'Prof. Gloria Santangelo', short: 'Prof. Santangelo', role: 'Public Speaking', look: L(96, { age: 'adult', hair: 'curly', hairColor: '#4a3022', top: 'dress', topColor: '#c8402f', bottom: 'longskirt', bottomColor: '#c8402f' }),
    lines: ['Slower. No, slower than that. There.', 'Nobody in the audience knows what you meant to say. Only what you said.', 'A pause is not a hole. It is a frame.', 'Look at one face. Then another. Never at the clock.'],
    pass: ['You stood up, you breathed, and they listened. That is the whole trick.'] },
  adeyemi: { name: 'Dr. Nkem Adeyemi', short: 'Dr. Adeyemi', role: 'Bay Ecology', look: L(107, { age: 'adult', hair: 'locs', hairColor: '#2b2433', top: 'flannel', topColor: '#4fa860', bottom: 'cargo', bottomColor: '#6f7a48', hat: 'sunhat' }),
    lines: ['Everything is somebody\'s lunch. Hold on to that and you understand ecology.', 'The pond behind the quad has more species than the zoo. Smaller, mind.', 'Wellies are a research instrument.', 'If you find the goldfish, his name is Kevin. He is not native.'],
    pass: ['You will never walk past a puddle again without looking in. You are welcome.'] },
  kowal: { name: 'Mr. Bernie Kowal', short: 'Mr. Kowal', role: 'Home Repair', look: L(118, { age: 'elder', hair: 'balding', hairColor: '#a9a9b4', top: 'flannel', topColor: '#7a5238', bottom: 'overalls', bottomColor: '#34507f', beard: true }),
    lines: ['Righty tighty, lefty loosey. Forty years in the trade and that is still the best of it.', 'Turn the water off first. Write it on your hand.', 'A tool you cannot find is a tool you do not own.', 'Measure twice. Then measure again, I have met you people.'],
    pass: ['You can fix a tap. Your landlord will never know what he has lost.'] },
  /* ---- staff ---- */
  pym: { name: 'Mrs. Hester Pym', short: 'Mrs. Pym', role: 'Registrar', look: L(129, { age: 'elder', hair: 'bun', hairColor: '#e8e8ee', top: 'cardigan', topColor: '#2f3f72', bottom: 'longskirt', bottomColor: '#4a4a58', glasses: true }),
    lines: ['Forms in black ink. Blue ink is for people who have given up.', 'I have enrolled three generations of some families. They all arrive late.', 'The stamp is the important part. Everything else is just paper.'] },
  dean: { name: 'Dean Cordelia Ashby', short: 'The Dean', role: 'Dean of the University', look: L(140, { age: 'elder', hair: 'bob', hairColor: '#a9a9b4', top: 'suit', topColor: '#22304e', bottom: 'slacks', bottomColor: '#22304e', scarf: '#e8b83a' }),
    lines: ['My great-grandfather built this hall with a lantern and a loan. Lux in portu.', 'I teach nothing these days. I sign things and I worry about the roof.', 'Come to an open lecture on Wednesday. They are the best thing we do.'],
    grad: ['By the authority of the University, and with real pleasure: congratulations.'] },
  mott: { name: 'Mr. Cyrus Mott', short: 'Mr. Mott', role: 'Librarian', look: L(151, { age: 'adult', hair: 'sidepart', hairColor: '#4a3022', top: 'sweater', topColor: '#3f6a48', bottom: 'slacks', bottomColor: '#7a5238', glasses: true }),
    lines: ['Shh. ...Sorry. Habit. How can I help?', 'Every book here has been late at least once. I forgive them all.', 'The green lamps are from 1924. Please do not adjust them. Everybody adjusts them.'] },
  juno: { name: 'Juno', short: 'Juno', role: 'The Quill & Kettle', look: L(162, { age: 'adult', hair: 'buzz', hairColor: '#f07aa8', top: 'tee', topColor: '#3f6a5a', bottom: 'jeans', bottomColor: '#33303f', outfit: 'barista' }),
    lines: ['Dean\'s Roast? Brave. Sit down before you drink it.', 'Exam week I just leave the pot on the counter.', 'The toastie is named after the Dean. She has never ordered one.'] },
  albie: { name: 'Albie', short: 'Albie', role: 'Porter', look: L(173, { age: 'elder', hair: 'bald', top: 'jacket', topColor: '#22304e', bottom: 'slacks', bottomColor: '#33303f', hat: 'flatcap', hatColor: '#22304e', beard: true }),
    lines: ['Lecture theatre is straight ahead. Commons on your left. Registrar on your right, if she is in a good mood.', 'The clock runs two minutes fast. On purpose. Ask the Dean.', 'I have the key to every door in this hall and I have never needed more than three.'] },
  /* ---- classmates ---- */
  saoirse: { name: 'Saoirse Flynn', short: 'Saoirse', role: 'Classmate', look: L(201, { age: 'adult', hair: 'braids', hairColor: '#a8452a', top: 'cardigan', topColor: '#e8b83a', bottom: 'skirt', bottomColor: '#2f3f72', glasses: true, bag: 'tote' }),
    lines: ['I colour-code my notes. Yellow is facts, pink is feelings about the facts.', 'I did the reading. And the further reading. And the footnotes.', 'Study group is Tuesday and Thursday at five, in the Commons. I bring the flash cards.'] },
  mateo: { name: 'Mateo Ruiz', short: 'Mateo', role: 'Classmate', look: L(212, { age: 'adult', hair: 'short', hairColor: '#2b2433', top: 'jacket', topColor: '#4a4a58', bottom: 'jeans', bottomColor: '#34507f', beard: true, build: 'broad' }),
    lines: ['Twenty years fixing buses. Thought it was time to learn something that does not leak.', 'My daughter helps me with the homework. She is nine. She is ruthless.', 'I sit at the back so nobody sees me enjoying it.'] },
  deshawn: { name: 'Deshawn Pruitt', short: 'Deshawn', role: 'Classmate', look: L(223, { age: 'adult', hair: 'hightop', hairColor: '#2b2433', top: 'varsity', topColor: '#2f3f72', bottom: 'sweats', bottomColor: '#9aa0a8', bag: 'backpack' }),
    lines: ['Am I late? I am late. Was it good? What did I miss?', 'I do my best thinking on the bus, which is why it all happens at the last minute.', 'Lend me a pen? I will give it back. I will mean to give it back.'] },
  meilin: { name: 'Mei-Lin Zhou', short: 'Mei-Lin', role: 'Classmate', look: L(234, { age: 'adult', hair: 'long', hairColor: '#2b2433', top: 'hoodie', topColor: '#8a5cd0', bottom: 'leggings', bottomColor: '#33303f' }),
    lines: ['I draw in the margins. It helps me listen. That one is the professor as a heron.', '...You can sit here. If you want.', 'I never put my hand up. I always know the answer. It is a problem.'] },
  agnes: { name: 'Agnes Thackeray', short: 'Agnes', role: 'Classmate', look: L(245, { age: 'elder', hair: 'curly', hairColor: '#e8e8ee', top: 'coat', topColor: '#b83a6a', bottom: 'longskirt', bottomColor: '#4a4a58', glasses: true, bag: 'tote' }),
    lines: ['Seventy-two, dear, and this is my eleventh course. I am collecting them.', 'I failed Music twice. Third time I brought a metronome and a flask.', 'Sit near the front. The young ones mumble.'] },
  bao: { name: 'Bao Tran', short: 'Bao', role: 'Classmate', look: L(256, { age: 'adult', hair: 'spiky', hairColor: '#2b2433', top: 'tee', topColor: '#f4f0e8', bottom: 'cargo', bottomColor: '#c8ad7a', build: 'slim' }),
    lines: ['Night shift at the bakery, class at ten. If I snore, nudge me. Gently.', 'I brought rolls. Yesterday\'s, but yesterday was a good day.', 'I am awake. I am taking notes with my eyes closed.'] },
  tunde: { name: 'Tunde Bello', short: 'Tunde', role: 'Classmate', look: L(267, { age: 'adult', hair: 'cornrows', hairColor: '#2b2433', top: 'polo', topColor: '#4fa860', bottom: 'slacks', bottomColor: '#c8ad7a' }),
    lines: ['Sorry, quick question. It is never quick. I know.', 'Somebody has to ask. I have decided it is me.', 'Did you understand the last bit? No? Good. I will ask.'] },
};
export const PROFS = ['baptiste', 'vandermeer', 'lowell', 'varma', 'ekstrom', 'santangelo', 'adeyemi', 'kowal'];
export const CLASSMATES = ['saoirse', 'mateo', 'deshawn', 'meilin', 'agnes', 'bao', 'tunde'];
export const GROUP = ['saoirse', 'mateo', 'agnes', 'bao'];

export const LECTURES = {
  cook: [
    { title: 'Heat: what cooking actually is', open: 'Good. Aprons are for next time. Today, heat.',
      boards: [
        { h: 'Brown food tastes good', t: 'Above about 150 degrees, sugars and proteins on the surface react and make hundreds of new flavours. It is called the Maillard reaction, and it is why toast beats bread.', fig: 'curve' },
        { h: 'Water is the enemy of brown', t: 'Water cannot get hotter than 100 degrees. A wet steak steams; it cannot brown until the surface is dry. So: pat it dry, and do not crowd the pan.', fig: 'pan' },
        { h: 'Rest it', t: 'Heat keeps travelling inward after you take food off. A rested roast finishes cooking on the board and keeps its juice. Five minutes of doing nothing is a technique.', fig: 'layers' }],
      ask: [['Why does a crowded pan give grey meat instead of brown?', ['The pan cools and the food steams in its own water', 'Meat needs to touch other meat', 'Crowding uses up the oxygen'], 0, 'Steam. A hundred degrees is not hot enough to brown anything.'],
        ['Roughly how hot must a surface be before it browns properly?', ['About 60 degrees', 'About 100 degrees', 'About 150 degrees'], 2, 'A hundred and fifty, give or take. Above boiling, which is the whole point.']],
      close: 'Read chapter two before next class. And dry your steak.' },
    { title: 'Salt, acid, fat', open: 'Three things fix nine dishes out of ten. Pens out.',
      boards: [
        { h: 'Salt early', t: 'Salt takes time to travel into food. Salted an hour ahead, meat is seasoned through; salted at the table it only tastes salty on top.', fig: 'layers' },
        { h: 'Acid wakes it up', t: 'When a dish tastes flat and you have already salted it, it wants acid: lemon, vinegar, a spoon of yoghurt. Sour makes the other flavours stand up.', fig: 'bars' },
        { h: 'Why sauces split', t: 'Oil and water do not mix unless something holds them together, like egg yolk or mustard. Add the oil slowly and whisk: that is an emulsion. Rush it and it splits.', fig: 'loop' }],
      ask: [['A stew is salted properly but still tastes dull. What does it most likely need?', ['More salt anyway', 'A squeeze of something sour', 'Another hour'], 1, 'Acid. A little lemon at the end and people ask for the recipe.'],
        ['What keeps the oil and the vinegar together in a dressing?', ['Stirring clockwise', 'An emulsifier such as mustard or egg yolk', 'Cold'], 1, 'Mustard. A molecule with one hand in the oil and one in the water.']],
      close: 'Next time you sit a paper. It is kinder than service on a Saturday night.' }],
  art: [
    { title: 'Line: seeing before drawing', open: 'Pencils down. We are going to look first. Looking is most of it.',
      boards: [
        { h: 'Draw the shape, not the thing', t: 'Your head keeps a symbol for "apple". It is wrong. Draw the outline your eye actually sees, edges and angles, as if you had never met an apple.', fig: 'eye' },
        { h: 'Light has a direction', t: 'Decide where the light comes from and keep it there. The side facing it is light, the side away is dark, and the shadow falls on the far side. That alone makes a circle into a ball.', fig: 'light' },
        { h: 'Things shrink as they go away', t: 'Parallel lines seem to meet at a point on the horizon. Put that point down first and the street draws itself.', fig: 'grid' }],
      ask: [['What turns a flat circle into a ball on paper?', ['A thicker outline', 'A light side, a dark side and a cast shadow', 'Drawing it bigger'], 1, 'Light and shadow. The outline is the least interesting part.'],
        ['In perspective, where do the edges of a straight road appear to meet?', ['At the vanishing point on the horizon', 'At the bottom of the page', 'They never meet'], 0, 'On the horizon, at eye level. Find it first.']],
      close: 'Easels next class. Wear something you do not love.' },
    { title: 'Colour: warm comes forward', open: 'Everybody thinks they know what colour things are. Everybody is wrong. It is lovely.',
      boards: [
        { h: 'The wheel', t: 'Red, yellow and blue make everything else. Colours opposite each other on the wheel, like blue and orange, are complements: side by side they make each other shout.', fig: 'wheel' },
        { h: 'Warm advances, cool recedes', t: 'Reds and oranges seem to come toward you. Blues drop back. Distant hills are blue for exactly this reason, so painters cool the far things down.', fig: 'layers' },
        { h: 'Shadows have colour', t: 'A shadow is not grey paint. It leans toward the complement of the light: warm evening sun, cool violet shadows. Mix a little of the opposite in.', fig: 'light' }],
      ask: [['Which pair are complements, opposite on the colour wheel?', ['Blue and orange', 'Red and orange', 'Blue and green'], 0, 'Blue and orange. Put them together and both get louder.'],
        ['How do painters make hills look far away?', ['Paint them warmer and sharper', 'Paint them cooler, bluer and softer', 'Outline them in black'], 1, 'Cooler and softer. Air is blue when there is enough of it.']],
      close: 'Next session you show the class your still life. They are kind. I am fair.' }],
  write: [
    { title: 'What a story is', open: 'Close the notebooks for a moment. I want to tell you the only rule there is.',
      boards: [
        { h: 'Want, obstacle, change', t: 'Somebody wants something. Something is in the way. By the end, something has changed, usually the somebody. If one of the three is missing you have an anecdote.', fig: 'arc' },
        { h: 'Show the thing', t: '"She was nervous" tells me. "She read the same menu four times" shows me, and lets me work it out. Readers love being trusted to work it out.', fig: 'eye' },
        { h: 'Start late', t: 'Begin as close to the trouble as you can. We do not need the alarm clock, the shower and the bus. Open on the door she is afraid to knock on.', fig: 'flow' }],
      ask: [['Which line shows rather than tells?', ['He was very angry.', 'He folded the letter into a smaller and smaller square.', 'He felt a great deal of anger inside.'], 1, 'The letter. I know exactly how he feels and you never said it.'],
        ['What three things make a story rather than an anecdote?', ['A beginning, a middle and a moral', 'A want, an obstacle and a change', 'A hero, a villain and a twist'], 1, 'Want, obstacle, change. Write it on your wall.']],
      close: 'For next class: read the Marlowe story. It is four pages. Read it twice.' },
    { title: 'Editing: kill your darlings', open: 'Writing is rewriting. I am sorry. Nobody tells you at the start.',
      boards: [
        { h: 'Cut the throat-clearing', t: 'First drafts warm up on the page. Your real opening is usually hiding in paragraph two or three. Find it and delete everything above.', fig: 'bars' },
        { h: 'One darling must go', t: 'The sentence you are proudest of is often there for you, not the story. If the scene works without it, out it goes. Keep a file. Visit sometimes.', fig: 'tree' },
        { h: 'Read it aloud', t: 'Your eye forgives a clumsy sentence. Your mouth will not. Where you stumble, the reader stumbles. Where you run out of breath, put a full stop.', fig: 'wave' }],
      ask: [['Where is the real opening of a first draft usually hiding?', ['In the title', 'A paragraph or two in', 'On the last page'], 1, 'Paragraph two. Sometimes three. Never one.'],
        ['Why read your work aloud?', ['To memorise it', 'Your ear catches what your eye lets through', 'It makes it longer'], 1, 'The ear is merciless. Use it.']],
      close: 'Next session, you read one page of your own to the room. One page. You will be fine.' }],
  code: [
    { title: 'A program is a recipe', open: 'Laptops shut. The first lesson of computing needs no computer.',
      boards: [
        { h: 'Steps, in order', t: 'A program is a list of small, exact instructions, done one after another. The computer adds nothing and assumes nothing. "Make tea" is not a step. "Fill kettle" is.', fig: 'flow' },
        { h: 'Decide: if, else', t: 'Programs choose. IF the kettle is empty, fill it; ELSE carry on. Every app you use is thousands of little ifs.', fig: 'tree' },
        { h: 'Repeat: loops', t: 'Do the same steps again and again until something is true: stir UNTIL the sugar is gone. A loop is why a computer can do in a second what would take you a week.', fig: 'loop' }],
      ask: [['Which of these is a proper step for a computer?', ['Make breakfast', 'Do the usual', 'Put one slice of bread in the toaster'], 2, 'One slice, in the toaster. Small and exact.'],
        ['What does a loop do?', ['Repeats steps until a condition is met', 'Chooses between two paths', 'Stores a number'], 0, 'Repeats. Until something tells it to stop, which is the part people forget.']],
      close: 'Next class we build something. Bring patience. I will bring the duck.' },
    { title: 'Bugs, and how to find them', open: 'Today is about being wrong, which is most of the job.',
      boards: [
        { h: 'The computer did what you said', t: 'A bug is not the machine misbehaving. It is the program doing exactly what was written, which is not what was meant. The gap between the two is the bug.', fig: 'eye' },
        { h: 'Make it small', t: 'To find a bug, cut the problem in half. Does the first half work? Then it is in the second. Halve again. Ten halvings finds one line in a thousand.', fig: 'bars' },
        { h: 'Names are for people', t: 'The computer does not care what you call things. You will, at midnight, in six months. Call it "total_price", not "x2". Clear names are a kindness to your future self.', fig: 'flow' }],
      ask: [['What is the quickest way to find a bug in a long program?', ['Read it from the top again', 'Keep halving where it could be', 'Rewrite all of it'], 1, 'Halve it. Then halve it again.'],
        ['The program gives a wrong answer. Who made the mistake?', ['The computer', 'The electricity', 'The instructions, so: us'], 2, 'Us. Always us. It is quite restful once you accept it.']],
      close: 'Next session is the paper. No screens. You will not need one.' }],
  music: [
    { title: 'Pulse and rhythm', open: 'Stand up. No, really. Up. We clap first, we talk second.',
      boards: [
        { h: 'The beat is a heartbeat', t: 'Under every piece is a steady pulse. Rhythm is the pattern of long and short sounds laid on top. Lose the pulse and it is only noise, however clever.', fig: 'wave' },
        { h: 'Bars of four', t: 'We bundle beats in groups, most often four: ONE two three four. The first is the strong one. A waltz bundles in three, which is why it sways.', fig: 'staff' },
        { h: 'Rests count', t: 'A rest is a silence with an exact length. Musicians count through it. The silence before the last chord is why the last chord works.', fig: 'pause' }],
      ask: [['What is the difference between beat and rhythm?', ['They are the same thing', 'The beat is the steady pulse; rhythm is the pattern on top', 'Rhythm is louder'], 1, 'Pulse underneath, pattern on top. Clap it and you feel it.'],
        ['How many beats to the bar in a waltz?', ['Two', 'Three', 'Four'], 1, 'Three. ONE two three. Your feet already knew.']],
      close: 'Next class, at the piano. Clip your nails.' },
    { title: 'Pitch and four chords', open: 'Today, the secret the radio does not want you to know.',
      boards: [
        { h: 'Twelve notes, then again', t: 'There are only twelve different notes. After the twelfth it starts over, higher: an octave. Same letter, double the vibration.', fig: 'staff' },
        { h: 'A chord is three friends', t: 'Play a note, skip one, play the next, skip one, play the next: a chord. Major chords sound bright, minor ones sound like rain on a window.', fig: 'tri' },
        { h: 'One, five, six, four', t: 'Four chords in that order sit under a startling share of popular songs. Composers have known for three hundred years. Now so do you.', fig: 'bars' }],
      ask: [['What is an octave?', ['The same note, higher or lower, at double or half the vibration', 'Eight notes played at once', 'A very loud note'], 0, 'Same note, one floor up.'],
        ['How does a minor chord tend to sound next to a major one?', ['Brighter', 'Sadder, darker', 'Exactly the same'], 1, 'Darker. One note moved by one step. That is all it takes.']],
      close: 'Next session, a recital. Sixteen bars each. Breathe before you start.' }],
  speak: [
    { title: 'Breath and the pause', open: 'Good afternoon. ... There. Did you feel that? I waited. You leaned in.',
      boards: [
        { h: 'Nerves are fuel', t: 'A racing heart before you speak is your body getting ready, the same as before a race. It is energy, not a warning. Breathe out slowly, longer than you breathe in.', fig: 'wave' },
        { h: 'The pause', t: 'Silence feels endless to the speaker and perfectly natural to the room. Pause before the important thing and after it. A pause tells people: that mattered.', fig: 'pause' },
        { h: 'Half speed', t: 'Nervous people speed up. Aim for what feels far too slow: it will come out as normal. Finish each sentence before you start the next.', fig: 'bars' }],
      ask: [['Your heart is pounding before a talk. What is the most useful way to think of it?', ['Proof you should not be doing this', 'Energy your body is giving you for the job', 'Something to hide at all costs'], 1, 'Fuel. The body is on your side.'],
        ['When should you pause?', ['Never, it looks like you forgot', 'Around the thing that matters most', 'Only at the very end'], 1, 'Before it and after it. Frame it.']],
      close: 'Next class, at the podium. Bring one true thing to say. Thirty seconds of it.' },
    { title: 'One idea, three parts', open: 'If they remember one thing, which thing? Decide that first.',
      boards: [
        { h: 'One idea', t: 'A talk is not everything you know. It is one idea, said clearly, with reasons. If you cannot write it on a ticket stub, you do not have it yet.', fig: 'tri' },
        { h: 'Tell them three times', t: 'Say what you will tell them. Tell them. Say what you told them. It feels like repeating yourself. To a listener it feels like being looked after.', fig: 'flow' },
        { h: 'Eyes up', t: 'Speak to one person for a whole sentence, then another. Notes are a map, not a script: glance down, look up, then speak.', fig: 'eye' }],
      ask: [['How many main ideas should a short talk carry?', ['As many as you can fit', 'One', 'At least five'], 1, 'One. They will thank you.'],
        ['What are notes for?', ['To be read out word for word', 'A map to glance at between sentences', 'To hide behind'], 1, 'A map. Glance, look up, speak.']],
      close: 'Next session you give your two minutes. The class will be on your side. I checked.' }],
  eco: [
    { title: 'Who eats whom', open: 'Before anything else: everything in this bay is either eating or being eaten. Often both.',
      boards: [
        { h: 'Food chains start with light', t: 'Plants and algae turn sunlight into food. Everything else eats them, or eats something that did. In the bay the grass of the sea is plankton, too small to see.', fig: 'web' },
        { h: 'Ten percent', t: 'Each step up the chain keeps only about a tenth of the energy below it. That is why there is a great deal of plankton, plenty of herring, and not many seals.', fig: 'tri' },
        { h: 'Pull one thread', t: 'Take the otters out and the urchins multiply and eat the kelp forest flat. One animal that holds a whole system up is called a keystone species.', fig: 'tree' }],
      ask: [['About how much energy passes from one level of a food chain to the next?', ['Nearly all of it', 'About half', 'About a tenth'], 2, 'A tenth. Which is why the top of the pyramid is small.'],
        ['What is a keystone species?', ['The biggest animal around', 'One whose loss changes the whole system', 'Any animal that eats plants'], 1, 'Take it out and everything else moves. Otters, here.']],
      close: 'Next class we go pond dipping behind the quad. If it rains, the tank comes to us.' },
    { title: 'The pond and the tide', open: 'Two waters meet in Maple Bay. That is the whole reason there is so much living here.',
      boards: [
        { h: 'Where river meets sea', t: 'Fresh water from the river slides over heavier salt water from the bay. That mixing zone, an estuary, is one of the richest habitats there is: a nursery for young fish.', fig: 'layers' },
        { h: 'Read the water', t: 'Some pond insects only survive in clean water. Find mayfly and stonefly young and the pond is healthy. Find only worms and midge larvae and something is wrong upstream.', fig: 'bars' },
        { h: 'Not from here', t: 'A species brought in from elsewhere can spread with nothing to eat it. One released goldfish can strip a pond. Admire it, report it, do not top it up.', fig: 'web' }],
      ask: [['What is an estuary?', ['Where a river\'s fresh water mixes with the sea', 'A very deep pond', 'A kind of seaweed'], 0, 'River meets tide. Everything young grows up there.'],
        ['You find lots of mayfly nymphs in a pond. What does that suggest?', ['The water is clean', 'The water is polluted', 'Nothing at all'], 0, 'Clean water. They are fussy, which makes them useful.']],
      close: 'Next session is the paper. Kevin the goldfish is not on it. Much.' }],
  fix: [
    { title: 'Water: the tap that drips', open: 'Right. First rule of plumbing. Anybody? ... Turn. The water. Off.',
      boards: [
        { h: 'Find the stop tap', t: 'Every home has a stop tap that shuts the water off, often under the kitchen sink. Find yours tonight, while it is not an emergency. Turn it clockwise to close.', fig: 'pipe' },
        { h: 'Why taps drip', t: 'Inside most taps a small rubber washer presses down to seal the flow. Rubber wears. A drip is nearly always a tired washer, which costs less than a bus fare.', fig: 'layers' },
        { h: 'Tight is not better', t: 'Overtighten a fitting and you crush the washer or crack the nut. Firm, then a quarter turn. If it still weeps, the seal is wrong, and force will not fix it.', fig: 'curve' }],
      ask: [['What do you do before taking a tap apart?', ['Turn the water off at the stop tap', 'Run the hot tap', 'Fetch a bigger spanner'], 0, 'Water off. Every time. Write it on your hand.'],
        ['What usually causes a dripping tap?', ['The pipe is too long', 'A worn rubber washer', 'Too much water pressure in the bay'], 1, 'The washer. Pennies. People call a plumber for it.']],
      close: 'Next class, at the benches. I have forty taps and they all drip. I checked.' },
    { title: 'Power: fuses and common sense', open: 'Electricity. It does not give second lessons, so listen to the first.',
      boards: [
        { h: 'A circuit is a loop', t: 'Electricity only flows round a complete loop: out along one wire, through the lamp, back along another. A switch just opens a gap in the loop.', fig: 'loop' },
        { h: 'A fuse is a hero', t: 'A fuse or breaker is the weakest link on purpose. Too much current and it cuts the loop before the wires in your wall get hot. If it trips, something asked for too much.', fig: 'curve' },
        { h: 'Know when to stop', t: 'Changing a plug fuse: yes. Unplug it first. Anything inside the wall or the fuse box: that is a qualified electrician, and knowing so is a skill too.', fig: 'tree' }],
      ask: [['What does a breaker tripping tell you?', ['The breaker is faulty, switch it back and forget it', 'Something drew too much current: find out what', 'The bulb needs changing'], 1, 'It did its job. Now find out what upset it.'],
        ['What must you do before opening a plug?', ['Unplug it from the wall', 'Switch the lights off', 'Nothing, plugs are safe'], 0, 'Unplug it. Out of the wall. In your hand.']],
      close: 'Next session, a short paper. No tools. I will be watching anyway.' }],
};

export const READING = {
  cook: { title: 'The Curious Pan, chapter 2', by: 'O. Baptiste', notes: ['Onions turn sweet because long, gentle heat breaks their sharp compounds down and browns their sugars. It takes forty minutes. There is no shortcut.', 'Yeast eats sugar and breathes out gas; the stretchy gluten in dough traps it. That is why bread rises and why you knead.', 'Pasta water should taste like the sea. The pasta only gets seasoned once, from the inside, while it cooks.'],
    ask: [['Why does bread dough rise?', ['Yeast makes gas that the gluten traps', 'Flour expands when wet', 'The oven pulls it up'], 0], ['How long do onions really take to caramelise?', ['Five minutes', 'About forty minutes', 'Two hours'], 1], ['When does pasta get seasoned?', ['While it boils, from the salted water', 'When the sauce goes on', 'Never'], 0]] },
  art: { title: 'Looking, chapter 1: Value', by: 'I. Vandermeer', notes: ['Value means how light or dark something is, whatever its colour. A picture with good values reads from across the room, even in black and white.', 'Squinting blurs detail and leaves only the big shapes of light and dark. Paint those first.', 'The darkest dark usually sits right beside the lightest light. Put them together where you want people to look.'],
    ask: [['What does "value" mean in drawing?', ['How much the picture sells for', 'How light or dark something is', 'How bright the colour is'], 1], ['Why do painters squint?', ['To see the big shapes of light and dark', 'To rest their eyes', 'To see more detail'], 0], ['Where does the eye go first in a picture?', ['The corner', 'Where the strongest dark meets the strongest light', 'The signature'], 1]] },
  write: { title: '"The Night Ferry", a story', by: 'A. Marlowe', notes: ['The story opens with the ferry already leaving. We never see the argument: we see the suitcase she did not pack properly.', 'Dialogue works when people do not say what they mean. He talks about the weather; they are both talking about the letter.', 'The ending changes one small thing: she takes her coat off. Nothing is explained, and everything is clear.'],
    ask: [['How does "The Night Ferry" begin?', ['With her childhood', 'With the ferry already leaving', 'With a description of the weather'], 1], ['What makes its dialogue work?', ['People say exactly what they feel', 'People talk around the thing that matters', 'There is none'], 1], ['How does the ending show the change?', ['A long speech', 'One small action: the coat', 'A wedding'], 1]] },
  code: { title: 'Small Steps, chapter 3: Variables', by: 'A. Varma', notes: ['A variable is a labelled box. You put a value in, you read it back, you can swap it for another. "score = 0" puts a zero in the box named score.', 'Computers count from zero. The first item in a list is item 0. It causes roughly half of all the trouble in the world.', 'A function is a recipe with a name. Write it once, call it by name wherever you need it.'],
    ask: [['What is a variable?', ['A named box that holds a value', 'A kind of bug', 'A very fast loop'], 0], ['What number do computers usually count from?', ['One', 'Zero', 'Ten'], 1], ['What is a function?', ['A named set of steps you can reuse', 'A broken program', 'A type of screen'], 0]] },
  music: { title: 'The Listening Book, chapter 4', by: 'L. Ekström', notes: ['Tempo is how fast the pulse goes, counted in beats per minute. A resting heart is about 70; most pop songs sit near 120.', 'Dynamics are loud and soft. The Italian "piano" means soft; the instrument was named because it could play both soft and loud.', 'A melody is a row of notes you can sing back. If you can hum it leaving the hall, the composer has won.'],
    ask: [['What is tempo?', ['How loud the music is', 'The speed of the pulse', 'The highest note'], 1], ['What does "piano" mean as a musical instruction?', ['Soft', 'Fast', 'With pedals'], 0], ['What is a melody?', ['A row of notes you can sing back', 'Three notes at once', 'The drum part'], 0]] },
  speak: { title: 'Say It Plain, chapter 2', by: 'G. Santangelo', notes: ['Open with a person or a picture, not a definition. "Last winter my boiler died" beats "Heating is important".', 'Stand with your weight on both feet. People who sway look unsure, and people who look unsure are not believed.', 'End on your main point, then stop. Do not trail off into "so, yes, that is about it".'],
    ask: [['What is the best way to open a talk?', ['With a definition', 'With a person or a picture', 'With an apology'], 1], ['How should you stand?', ['Weight on both feet, still', 'Rocking gently', 'Leaning on the lectern'], 0], ['How should a talk end?', ['On the main point, then stop', 'With "that is about it"', 'With a list of things you forgot'], 0]] },
  eco: { title: 'Field Notes of Maple Bay, part 1', by: 'N. Adeyemi', notes: ['Kelp is not a plant but a giant alga. It can grow half a metre a day and a kelp forest shelters hundreds of species.', 'Herons stand still for so long because their prey spots movement, not shape. Patience is their whole hunting method.', 'A dragonfly spends most of its life, sometimes two years, as a nymph under water, and only a few weeks in the air.'],
    ask: [['What is kelp?', ['A flowering plant', 'A giant alga', 'A kind of coral'], 1], ['Why do herons stand so still?', ['They are asleep', 'Their prey notices movement', 'To keep warm'], 1], ['Where does a dragonfly spend most of its life?', ['In the air', 'Under water as a nymph', 'In trees'], 1]] },
  fix: { title: 'The Householder\'s Handbook, chapter 5', by: 'B. Kowal', notes: ['A squeaking hinge wants a drop of oil on the pin, not a new door. Lift the pin a little, oil, work the door.', 'When hanging something heavy, find the stud behind the plaster: knock, and listen for where the hollow sound goes dull.', 'A spirit level reads true when the bubble sits between the lines. Check the level itself by turning it end for end.'],
    ask: [['How do you quiet a squeaking hinge?', ['Replace the door', 'A drop of oil on the pin', 'Paint over it'], 1], ['How do you find a stud behind plaster?', ['Knock and listen for the dull sound', 'Guess the middle', 'Use the heaviest nail'], 0], ['When does a spirit level read true?', ['Bubble at one end', 'Bubble between the lines', 'No bubble at all'], 1]] },
};

export const PRACTICAL = {
  cook: { where: 'the teaching kitchen', brief: ['Stations, please. One steak, one pan, one job: a proper sear and a proper rest.', 'Dry it. Hot pan. Then leave it alone. The hardest step in cooking is leaving it alone.'], tips: ['Listen to the pan. A hiss is steaming. A crackle is browning.', 'Do not poke it. It knows what it is doing.'], done: ['That is a crust. Look at that. Rest it now.', 'Edible. Next time, a hotter pan and more nerve.'], project: { title: 'Sunday roast, written up', text: 'Cook a dish at your station and note what the heat did at each stage.' } },
  art: { where: 'the studio', brief: ['An easel each. In the middle: a bowl of fruit, a jug, some flowers that have seen better days.', 'Big shapes first. Where is the light? Squint. No detail until I say.'], tips: ['Your jug is leaning. Step back. See?', 'Lovely dark there. Now put your lightest light next to it.'], done: ['It reads from across the room. That is everything.', 'A brave start. The fruit forgives you.'], project: { title: 'A still life of your own', text: 'Come back to the studio and finish a still life for the critique.' } },
  write: { where: 'the writing table', brief: ['Ten minutes, one prompt: "the last bus". Catch the good ideas as they come. Let the tired ones go by.', 'Do not be clever. Be exact.'], tips: ['"Heart pounding like a drum." We have all read that. Find the one only you would write.', 'That one. Keep that one.'], done: ['There is a real page in there. I can hear it.', 'It is a draft. Drafts are allowed to be bad. That is their job.'], project: { title: 'One page of your own', text: 'Write the page you will read to the class.' } },
  code: { where: 'the computer room', brief: ['Each of you has a program with five failing tests. The run shows you the order. Make them pass.', 'Small steps. Run it often. Talk to the duck.'], tips: ['Red is not failure. Red is information.', 'Which step did it expect third? Look again.'], done: ['Green. All green. Enjoy it, it is the best feeling we have.', 'Half of them pass. That is half a program. We go again.'], project: { title: 'A small useful thing', text: 'Build a little program of your own at a university computer.' } },
  music: { where: 'the music corner', brief: ['One at a time at the piano. Four chords, sixteen bars. I will count you in.', 'Do not look at your hands. They know where they are.'], tips: ['You are rushing. The beat is not chasing you.', 'Play the rests! The rests!'], done: ['In time, all the way through. Bravo.', 'You found the pulse by the end. We begin there next time.'], project: { title: 'Sixteen bars, practised', text: 'Practise your recital piece at the university piano.' } },
  speak: { where: 'the seminar corner', brief: ['The podium is yours for thirty seconds. One true thing. The class will count your pauses, kindly.', 'Feet still. Breathe out. Begin when YOU are ready, not when the silence makes you.'], tips: ['Slower. Let that one land.', 'Look up. We are over here.'], done: ['You paused, and the whole room waited. Did you feel it?', 'Fast, but honest. Honest we can slow down.'], project: { title: 'Your two minutes', text: 'Rehearse your talk at the podium until it fits in two minutes.' } },
  eco: { where: 'the pond deck behind the quad', brief: ['Nets in, slowly, along the weed. Tip it into the white tray and wait for the mud to settle.', 'Sort what you have: plant, insect, or something that should not be here at all.'], wetBrief: ['Too wet for the deck, so the pond came to us: I filled the tank this morning. Nets in, slowly, along the weed, and tip it into the white tray.', 'Sort what you have: plant, insect, or something that should not be here at all.'], tips: ['That one with the oars is a water boatman. Count the legs.', 'Kevin. Put Kevin back.'], done: ['A tidy tray and a healthy pond. Mayfly nymphs: that is the good news.', 'Mostly mud, but honest mud. Rinse the net.'], project: { title: 'A species list', text: 'Go back to the pond deck and record what lives there.' } },
  fix: { where: 'the workshop benches', brief: ['A tap each, and each one drips. Water is off. Body off, old washer out, new washer in.', 'Firm, then a quarter turn. If I hear a crack I am putting it on your certificate.'], tips: ['Ease off. You are strangling it.', 'Feel it seat? That. Remember that feeling.'], done: ['Dry as a bone. Go home and fix your own.', 'It weeps a little. So do I. Try again.'], project: { title: 'A repair, start to finish', text: 'Come back to the benches and do a full repair on your own.' } },
};

export const FINAL = {
  cook: { title: 'Kitchen Science: the paper', intro: 'Twenty-five minutes, eight questions. No tasting.', extra: [['Why rest meat after cooking?', ['So it finishes cooking and keeps its juice', 'To cool the plate', 'To make it look bigger'], 0], ['What is the Maillard reaction?', ['Water boiling', 'Browning of sugars and proteins at high heat', 'Salt dissolving'], 1]] },
  art: { title: 'The critique', intro: 'Turn your easel round. Tell us what you saw.' },
  write: { title: 'The reading', intro: 'One page. Take a breath first.' },
  code: { title: 'Computing for Humans: the paper', intro: 'Eight questions, no computers. Think in steps.', extra: [['"IF it is raining, take a coat, ELSE do not." What is this?', ['A loop', 'A decision', 'A variable'], 1], ['Why give things clear names in a program?', ['The computer runs faster', 'So people can read it later', 'It uses less electricity'], 1]] },
  music: { title: 'The recital', intro: 'Sixteen bars. I will count you in.' },
  speak: { title: 'Your two minutes', intro: 'The room is yours. Begin when you are ready.' },
  eco: { title: 'Bay Ecology: the paper', intro: 'Eight questions. Kevin is question nine, which does not exist.', extra: [['What do plants and algae turn into food?', ['Sunlight', 'Sand', 'Salt'], 0], ['Why should a pet goldfish never be released into a pond?', ['It will be lonely', 'With nothing to eat it, it can strip the pond', 'It cannot swim in cold water'], 1]] },
  fix: { title: 'Home Repair: the paper', intro: 'Eight questions. Put the spanner down.', extra: [['Which way do you turn a stop tap to close it?', ['Clockwise', 'Anticlockwise', 'Either'], 0], ['What is a fuse for?', ['To make lamps brighter', 'To break the circuit before the wires overheat', 'To save electricity'], 1]] },
};

export const OPEN = [
  { id: 'glow', title: 'Why the bay glows in August', by: 'adeyemi', boards: [{ h: 'Living light', t: 'On warm late-summer nights the water off Gull Point sparks blue when you stir it. The light comes from plankton, each one smaller than a full stop.', fig: 'wave' }, { h: 'A burglar alarm', t: 'They flash when disturbed. One idea is that the light draws attention to whatever is eating them, so that something bigger comes and eats that instead.', fig: 'web' }],
    ask: [['What makes the bay glow?', ['Moonlight on the waves', 'Tiny plankton that flash when disturbed', 'Lights from the fun pier'], 1, 'Plankton. Go down in August and drag your hand through it.']], close: 'Thank you for coming. The tide is right for it two weeks from now.' },
  { id: 'clock', title: 'The clock that runs two minutes fast', by: 'dean', boards: [{ h: '1891', t: 'My great-grandfather Cornelius Ashby set the tower clock himself, by the harbour master\'s signal. He was two minutes out. Nobody dared tell him.', fig: 'curve' }, { h: 'A tradition', t: 'By the time he died the whole university ran on tower time. We still do. It means nobody is ever quite late, which he would have hated.', fig: 'pause' }],
    ask: [['Why is the tower clock two minutes fast?', ['It is broken', 'The Founder set it wrong and it became a tradition', 'To catch the ferry'], 1, 'And we have never corrected it. Lux in portu, slightly early.']], close: 'Good night. Mind the steps, they are also from 1891.' },
  { id: 'lens', title: 'How a lighthouse throws a candle twenty miles', by: 'kowal', boards: [{ h: 'The problem', t: 'A lamp shines in every direction, and most of that light is wasted on the sky and the rocks. The trick is to bend it all into one flat beam.', fig: 'light' }, { h: 'Fresnel\'s rings', t: 'A French engineer cut a huge lens into rings of prisms, like a stack of glass steps. It is thin, light, and gathers nearly all the light. Ours at Gull Point is one.', fig: 'layers' }],
    ask: [['What does a lighthouse lens do?', ['Makes the lamp hotter', 'Bends the scattered light into one beam', 'Changes its colour'], 1, 'One beam. Go and climb the lighthouse and look at the rings.']], close: 'That is all. Mind how you go, it is dark out.' },
  { id: 'sourdough', title: 'Your sourdough is a pet', by: 'baptiste', boards: [{ h: 'A jar of weather', t: 'A starter is flour, water and whatever wild yeast was passing. It is alive, it is hungry every day, and no two kitchens grow the same one.', fig: 'loop' }, { h: 'Sour is a defence', t: 'The bacteria in it make acid, which keeps other microbes out and gives the bread its tang. The loaf keeps longer for it.', fig: 'bars' }],
    ask: [['What makes sourdough sour?', ['Lemon juice', 'Acid made by its own bacteria', 'Old flour'], 1, 'Its own little lodgers. Feed them and they feed you.']], close: 'There is a jar of mine by the door. Take a spoonful home. Name it.' },
  { id: 'queue', title: 'The mathematics of a good queue', by: 'varma', boards: [{ h: 'One line beats five', t: 'A single line feeding several counters is faster on average than a line per counter, and nobody ever picks the wrong one. Banks know. Supermarkets pretend not to.', fig: 'flow' }, { h: 'Waiting feels longer than it is', t: 'People overestimate a wait by about a third. A queue you can see moving, with something to look at, feels shorter than a faster one in silence.', fig: 'bars' }],
    ask: [['Which is faster on average?', ['One shared line for all the counters', 'A separate line at each counter', 'No difference at all'], 0, 'One line. And nobody glares at the next lane.']], close: 'Thank you. Please leave in a single orderly line.' },
  { id: 'earworm', title: 'Why songs get stuck', by: 'ekstrom', boards: [{ h: 'The earworm', t: 'A tune that loops in your head is usually simple, a little unusual in one place, and something you heard recently. Your brain is rehearsing it, unasked.', fig: 'staff' }, { h: 'The cure', t: 'Listen to the whole song through to the end. An unfinished tune nags; a finished one lets go. Failing that, chewing gum helps. Truly.', fig: 'pause' }],
    ask: [['What is the best cure for a tune stuck in your head?', ['Hum it louder', 'Hear it through to the very end', 'Hold your breath'], 1, 'Finish it. The mind dislikes a loose end.']], close: 'Good night. I apologise for what you will be humming.' },
];

export const LINES = {
  student: ['Is this the queue for the Registrar or just people standing near her?', 'I picked this course because of the timetable. Now I love it. Do not tell anyone.', 'The clock tower is two minutes fast. You get used to being early.', 'There is a goldfish in the pond called Kevin. He is controversial.', 'Open lecture on Wednesday. Free, and there are biscuits.', 'I have a certificate in Home Repair and I still call my landlord.', 'Meet you by the Founder. He is the one not moving.', 'Third coffee. It is a Dean\'s Roast. I can hear colours.', 'I only came to use the library. That was two courses ago.', 'Somebody put a traffic cone on the Founder again. Annual tradition.'],
  exam: ['Do not talk to me. I know eleven things and if I speak I will lose one.', 'What is on the paper? Everything. It is always everything.', 'I revised the wrong chapter. Beautifully. In three colours.', 'Quiet, please. Somebody in there is doing sums.', 'After this I am sleeping until next term.', 'The Reading Room has run out of chairs. People are revising on the stairs.'],
  fair: ['Join the Rowing Club! We have a boat! It is a small boat!', 'Free badge if you sign up. The badge is the main benefit.', 'Six clubs and I want all of them. Is that allowed?', 'The Film Society only shows films nobody has heard of. On purpose.', 'Radio MBU. You have not heard us. Nobody has. Join anyway.'],
  commons: ['The sofa by the fire is the best seat in the university. Do not tell first years.', 'I am not asleep. I am absorbing.', 'Whose flash cards are these? There are four hundred.', 'Juno put cinnamon in the Dean\'s Roast once. There was nearly a riot.', 'Study group at five. Bring your own highlighter.'],
  library: ['Shh.', '...page ninety. Page ninety. I have read page ninety four times.', 'The green lamps make everything look important.', 'I came in for one book in the spring.'],
  aside: ['Did you get that down?', 'Oh, that is good. That is going on a flash card.', 'Wait, say that again?', 'I knew that one. I did not say it. But I knew it.', 'Is this on the paper?', '...zzz... hm? Yes. Agreed.'],
  late: ['You are just in time to have missed the beginning.', 'Ah. Do come in. We were only on the important part.', 'Sit anywhere. Quietly. Quieter.'],
  missed: ['We missed you in class today. The notes are with the study group; come to the next one and you are still on track.', 'Empty seat today. No harm done: same time next class, and the unit will wait for you.'],
};
