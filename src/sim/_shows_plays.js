// The playhouse programme (private helper of shows.js): three short stage shows as timed scripts, performed by the stage director in
// src/scenes/rooms/performance.js. Stage coords: u 0..1 across the stage (left -> right), v 0 (upstage, back) .. 1 (downstage, footlights).
// Script rows [t (s), op, ...]:
//   curtain k (0 open .. 4 closed) | set name (backstage castle platform dawn city harbor) | light { wash: 0..1, tint, spots: [[u, v, r, colour]], follow: id }
//   enter id side('L'|'R') u v | go id u v | exit id side | say id text [ms] | pose id anim|null [secs] | face id dir | lie id | up id | sit id z
//   prop key kind u v | hold key id | unprop key | cue kind (laugh gasp aww cheer) | music scoreId | sfx name | sweep (a train-light pass) | dance [ids] on
const W = (o, x) => Object.assign(o, x);
export const PLAYS = [
  { id: 'understudy', title: 'The Understudy', blurb: 'Slapstick. The star is out cold, the curtain is up, and the only one who knows the lines is holding a mop.', poster: 'understudy', price: 16, minutes: 115, dur: 66,
    cast: { star: { name: 'Sir Reginald', spec: { style: 'business', age: 'elder', top: 'coat', topColor: '#6a2a7a', hat: 'beret', hatColor: '#6a2a7a' } }, dir: { name: 'Director Bloom', spec: { style: 'preppy', glasses: true, topColor: '#2a2733' } },
      pip: { name: 'Pip', spec: { style: 'workwear', topColor: '#3c8a6a', hat: 'cap', hatColor: '#3c8a6a' } }, hand: { name: 'Stagehand', spec: { style: 'street', topColor: '#1e1a22', bottomColor: '#1e1a22' } } },
    script: [
      [0, 'set', 'backstage'], [0, 'light', { wash: .8, tint: '#ffe0b0' }], [.2, 'curtain', 0], [.2, 'prop', 'bucket', 'bucket', .16, .5],
      [1, 'enter', 'star', 'L', .5, .7], [3.2, 'say', 'star', 'Tonight, I shall be MAGNIFICENT.'], [3.2, 'pose', 'star', 'wave', 2], [5.5, 'enter', 'dir', 'R', .74, .55], [6.6, 'say', 'dir', 'Places! Curtain in two minutes!'],
      [8, 'enter', 'pip', 'L', .2, .55], [9, 'pose', 'pip', 'work'], [9.4, 'prop', 'banana', 'banana', .4, .78], [10, 'say', 'pip', 'Who left a banana back here?'], [12, 'go', 'star', .4, .78], [12.2, 'say', 'star', 'A star never looks down.'],
      [14.2, 'lie', 'star'], [14.3, 'cue', 'laugh'], [15.5, 'say', 'star', '...I have looked down.'], [17.5, 'go', 'dir', .55, .6], [18, 'say', 'dir', 'He is out cold! Who knows the part?!'], [20.5, 'pose', 'pip', null], [20.8, 'say', 'pip', 'I mop here every night. I know ALL the parts.'],
      [23.5, 'say', 'dir', 'You are hired. You are Hamlet. GO!'], [24.2, 'cue', 'laugh'], [25, 'enter', 'hand', 'L', .34, .8], [26.5, 'exit', 'star', 'L'], [26.5, 'exit', 'hand', 'L'], [26.5, 'exit', 'dir', 'R'], [26.5, 'exit', 'pip', 'L'], [27, 'curtain', 4],
      [29, 'set', 'castle'], [29, 'unprop', 'bucket'], [29, 'unprop', 'banana'], [29, 'light', { wash: .35, tint: '#c8d8ff', spots: [[.5, .7, 3, '#fff2c4']] }], [30.5, 'curtain', 0],
      [31.5, 'enter', 'pip', 'L', .5, .72], [31.5, 'hold', 'mop', 'pip'], [34, 'say', 'pip', 'To mop... or not to mop.'], [35.6, 'cue', 'laugh'], [37, 'pose', 'pip', 'work', 2], [37.2, 'say', 'pip', 'That is the question.'],
      [39.5, 'enter', 'hand', 'R', .84, .5], [40.4, 'say', 'hand', 'Psst! Wrong play!'], [42.3, 'say', 'pip', 'O Romeo, Romeo! Wherefore art thou... wet floor?'], [44.4, 'cue', 'laugh'], [45.5, 'enter', 'dir', 'R', .72, .62], [46.3, 'say', 'dir', 'Keep going! They LOVE it!'],
      [48.5, 'go', 'pip', .5, .86], [49.3, 'say', 'pip', 'All the world is a stage... and somebody has to clean it.'], [51.5, 'cue', 'cheer'], [52.5, 'light', { wash: .8, tint: '#ffe0b0' }], [52.5, 'enter', 'star', 'L', .26, .72], [54, 'say', 'star', 'That... was MY banana.'], [55.2, 'cue', 'laugh'],
      [56.5, 'pose', 'pip', 'cheer'], [56.5, 'pose', 'dir', 'wave'], [56.5, 'pose', 'hand', 'wave'], [58, 'say', 'pip', 'Thank you! Mind the wet patch on your way out!'], [60, 'go', 'star', .4, .86], [61.2, 'lie', 'star'], [61.3, 'cue', 'laugh'], [63, 'curtain', 4]] },

  { id: 'platform', title: 'Platform Six', blurb: 'A two-hander. A late train, one bench, and two strangers deciding whether to get on.', poster: 'platform', price: 16, minutes: 120, dur: 69,
    cast: { ada: { name: 'Ada', spec: { age: 'elder', style: 'preppy', top: 'coat', topColor: '#7a3a4a', scarf: '#e8d890' } }, sam: { name: 'Sam', spec: { style: 'hipster', topColor: '#3c64ad', bag: 'backpack' } } },
    script: [
      [0, 'set', 'platform'], [0, 'light', { wash: .3, tint: '#a8c0ff', spots: [[.5, .62, 3, '#ffe6a0']] }], [0, 'prop', 'bench', 'bench', .5, .56], [0, 'prop', 'lamp', 'lamp', .86, .4], [.2, 'curtain', 0],
      [1.2, 'enter', 'ada', 'L', .43, .66], [3.8, 'sit', 'ada', .3], [4.6, 'say', 'ada', 'The last train is late again.'], [6.5, 'enter', 'sam', 'R', .66, .74], [6.5, 'hold', 'case', 'sam'], [8.6, 'say', 'sam', 'Is this seat taken?'], [10.6, 'say', 'ada', 'Only by forty years of waiting.'], [12.2, 'cue', 'laugh'],
      [12.8, 'go', 'sam', .57, .66], [13.8, 'sit', 'sam', .3], [14.8, 'say', 'sam', 'Where are you headed?'], [17, 'say', 'ada', 'Nowhere. I come to watch people leave.'], [20.4, 'say', 'sam', 'I am supposed to leave tonight. New city. New job.'], [23.8, 'say', 'ada', 'And?'], [25.2, 'say', 'sam', 'And I keep letting the trains go by.'], [27, 'cue', 'aww'],
      [28.5, 'sweep'], [28.5, 'sfx', 'hush'], [31.5, 'say', 'ada', 'That was the 10:40. There is one more.'], [34.5, 'say', 'sam', 'What if it is a mistake?'], [37.3, 'say', 'ada', 'Then you will have a story. I only have a bench.'], [39.6, 'cue', 'aww'],
      [41.5, 'up', 'ada'], [41.6, 'go', 'ada', .34, .74], [43, 'say', 'ada', 'Post this for me when you get there.'], [43, 'prop', 'letter', 'letter', .4, .72], [45.6, 'say', 'sam', 'Who is it for?'], [47.6, 'say', 'ada', 'Whoever sits here next.'], [50, 'curtain', 4],
      [52, 'set', 'dawn'], [52, 'unprop', 'letter'], [52, 'light', { wash: .75, tint: '#ffd0a0', spots: [[.6, .75, 3, '#fff2c4']] }], [52, 'up', 'sam'], [52.1, 'go', 'sam', .62, .78], [52.1, 'go', 'ada', .43, .66], [53.5, 'curtain', 0], [53.6, 'sit', 'ada', .3],
      [55, 'say', 'sam', 'It is here.'], [56.8, 'say', 'ada', 'Go on. I will wave.'], [58.8, 'exit', 'sam', 'R'], [59.2, 'pose', 'ada', 'wave', 4], [60, 'sweep'], [61.5, 'say', 'ada', '...Mind the gap, dear.'], [63.3, 'cue', 'aww'], [64.5, 'light', { wash: .15, tint: '#ffd0a0', spots: [[.43, .66, 2, '#ffe6a0']] }], [66, 'curtain', 4]] },

  { id: 'mybay', title: 'Maple Bay, My Bay', blurb: 'A musical number. One newcomer, a chorus of couriers, cooks and baristas, and a tune you will hum all week.', poster: 'mybay', price: 18, minutes: 110, dur: 66,
    cast: { lola: { name: 'Lola', spec: { style: 'preppy', top: 'dress', topColor: '#e8483a', hairColor: '#2a1c14' } }, c1: { name: 'Chorus', spec: { outfit: 'courier' } }, c2: { name: 'Chorus', spec: { outfit: 'barista' } }, c3: { name: 'Chorus', spec: { outfit: 'cook' } },
      c4: { name: 'Chorus', spec: { outfit: 'nurse' } }, c5: { name: 'Chorus', spec: { outfit: 'dockworker' } }, c6: { name: 'Chorus', spec: { outfit: 'office' } } },
    script: (() => {
      const C = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'], s = [[0, 'set', 'city'], [0, 'light', { wash: .3, tint: '#c0a8ff', spots: [[.5, .75, 3, '#fff2c4']], follow: 'lola' }], [.2, 'curtain', 0], [1, 'enter', 'lola', 'L', .5, .78], [1, 'hold', 'case', 'lola'], [2, 'music', 'song'],
        [6, 'say', 'lola', '♪ Stepped off the plane with one suitcase...', 3600], [10, 'say', 'lola', '♪ A cab, a key, a brand new place...', 3600], [14, 'say', 'lola', '♪ The ferry horn, the morning train...', 3600], [18, 'say', 'lola', '♪ I think I will never leave again!', 3400], [18, 'pose', 'lola', 'cheer', 3], [20, 'unprop', 'case'],
        [21.8, 'light', { wash: .85, tint: '#ffd8f0', spots: [[.5, .75, 3, '#fff2c4']], follow: 'lola' }], [22, 'dance', C, true], [22, 'pose', 'lola', 'dance'], [22, 'say', 'lola', '♪ Maple Bay, my bay!', 3400], [26, 'say', 'lola', '♪ Coffee steam and lantern light!', 3400], [30, 'say', 'lola', '♪ Maple Bay, my bay!', 3400], [30, 'say', 'c2', '♪ My bay!', 1800], [34, 'say', 'lola', '♪ You feel like home tonight!', 3400], [36, 'cue', 'cheer'],
        [37.2, 'light', { wash: .05 }], [37.6, 'set', 'harbor'], [38, 'light', { wash: 1, tint: '#ffd0a0', spots: [[.5, .6, 3.5, '#fff2c4']] }], [38, 'go', 'lola', .5, .6], [38, 'say', 'c1', '♪ Maple Bay!', 1800], [39, 'say', 'c5', '♪ My bay!', 1800], [42, 'say', 'lola', '♪ From Hillcrest down to Harbourside!', 3400], [46, 'say', 'lola', '♪ Maple Bay, my bay!', 3400], [46, 'say', 'c4', '♪ My bay!', 1800],
        [50, 'say', 'lola', '♪ There is room for you, come take a ride!', 3600], [54, 'dance', C, false], [54, 'pose', 'lola', 'cheer'], [54.2, 'cue', 'cheer'], [58, 'pose', 'lola', 'wave', 4], [62.5, 'curtain', 4]];
      C.forEach((id, i) => { s.push([20 + i * .15, 'enter', id, i < 3 ? 'L' : 'R', .14 + i * .145, .42], [38 + i * .1, 'go', id, .12 + i * .152, i % 2 ? .86 : .78], [54, 'pose', id, 'cheer'], [58, 'pose', id, 'wave', 4]); });
      return s.sort((a, b) => a[0] - b[0]);
    })() },
];
