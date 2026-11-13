// Small animals, drawn like the characters: hand-placed pixels (ascii sprites) relative to the feet anchor PW(0,0,0).
//   drawAnimal(kind, pose)   pose = { anim, frame, dir, variant }
// Profile sprites facing screen-right (dir 0 and 3); mirrored for dir 1 and 2.
import { PW, dk, lt } from '../../engine/raster.js';
import { gclear, ascii, flush, shadow } from './_grid.js';

/** fixed sprite bounds in px around the anchor */
export const ANIMAL_SB = [-12, -16, 12, 5];
export const ANIMALS = ['cat', 'dog', 'pigeon', 'seagull', 'duck', 'squirrel'];
/** kind -> { anim: frameCount } */
export const ANIMAL_ANIMS = {
  cat: { stand: 2, walk: 4, sit: 2 }, dog: { stand: 2, walk: 4, sit: 2 },
  pigeon: { stand: 2, walk: 2, fly: 2 }, seagull: { stand: 2, walk: 2, fly: 2 }, duck: { stand: 2, walk: 2, fly: 2, swim: 2 },
  squirrel: { stand: 2, walk: 2 },
};
/** number of colour variants per kind (pose.variant) */
export const ANIMAL_VARIANTS = { cat: 6, dog: 6, pigeon: 3, seagull: 1, duck: 2, squirrel: 2 };

const EYE = '#2b2238';
const coat = (a, b, o) => Object.assign({ a, A: lt(a, .25), d: dk(a, .25), b: b || lt(a, .45), e: EYE, n: '#e8909a' }, o);
const PALS = {
  cat: [coat('#e8943a', '#f8e8d0'), coat('#8a8f9a', '#d8dce4'), coat('#33303f', '#33303f', { e: '#e8d040' }), coat('#f4f0e8', '#ffffff'), coat('#33303f', '#f4f0e8', { e: '#9ad048' }), coat('#c8a070', '#f4e8d0', { d: '#6a4428' })],
  dog: [coat('#a8703a', '#e8d0a8', { n: EYE }), coat('#e8c070', '#f8ecd0', { n: EYE }), coat('#33303f', '#4a4a58', { n: '#22202c', e: '#c89040' }), coat('#f4f0e8', '#ffffff', { n: EYE, d: '#a8703a' }), coat('#8a8f9a', '#e8e8ee', { n: EYE }), coat('#6a4428', '#f4f0e8', { n: EYE })],
  pigeon: [0, 1, 2].map(i => ({ g: ['#8f9aaa', '#b8a898', '#6a7080'][i], h: ['#6a7890', '#9a8878', '#4a5068'][i], p: ['#8a6aa8', '#c8b8a8', '#5a8a78'][i], w: ['#4a5068', '#7a6858', '#33384a'][i], t: '#4a5068', e: '#f08030', o: '#e8c870', r: '#e0605a', c: '#f4f0e8' })),
  seagull: [{ g: '#f8f8f4', h: '#f8f8f4', p: '#e8ecf0', w: '#9aa4b4', t: '#33303f', e: EYE, o: '#f0b830', r: '#f0a040', c: '#d8dce4' }],
  duck: [{ g: '#a89078', h: '#2f7a58', p: '#7a4a38', w: '#7a8898', t: '#33303f', e: EYE, o: '#f0b830', r: '#f08a30', k: '#f4f0e8', c: '#d8cab8' }, { g: '#a8845a', h: '#8a6a48', p: '#c0a078', w: '#6a5238', t: '#5a4630', e: EYE, o: '#d89040', r: '#f08a30', k: '#a8845a', c: '#d8c0a0' }],
  squirrel: [coat('#c8703a', '#f8e0c0', { t: '#e08a48', n: EYE }), coat('#8a8f98', '#f0f0f4', { t: '#a8aeb8', n: EYE })],
};
const CAT = [
  'a.......a.a',
  'a.......aaa',
  '.a.....aeae',
  '.aaaaaAaaan',
  '.aaaaaaaaa.',
  '.adbbbbda..'];
const CAT2 = ['........a.a', '.a......aaa', 'a......aeae', '.aaaaaAaaan', '.aaaaaaaaa.', '.adbbbbda..'];
const DOG = [
  '..........dd..',
  'a.........aaa.',
  'a........daeaa',
  '.a.......daaan',
  '.aaaaaAAaaab..',
  '.aaaaaaaaaa...',
  '.adbbbbbbda...'];
const DOG2 = ['..........dd..', '..........aaa.', 'aa.......daeaa', '..a......daaan', '.aaaaaAAaaab..', '.aaaaaaaaaa...', '.adbbbbbbda...'];
const BIRD = ['.....hh.', '.....heo', '.ggggph.', 'twwggpp.', '.twwgcc.'];
const BIRDF = [['...ww......', '...www.hh..', 'tggwwggheo.', '.tgggccc...'], ['.......hh..', 'tggggggheo.', '.tgwwwcc...', '...www.....', '...ww......']];
const DUCK = ['......hh..', '......heoo', '......kk..', 'tgggggpp..', '.gwwwgpp..', '..gccccp..'];
const F = {
  cat: {
    stand: [CAT.concat(['.a.a..a.a..', '.a.a..a.a..']), CAT2.concat(['.a.a..a.a..', '.a.a..a.a..'])],
    walk: [CAT.concat(['.a.a..a.a..', 'a...a.a..a.']), CAT2.concat(['.a.a..a.a..', '..aa...aa..']), CAT.concat(['.a.a..a.a..', '.a..a.a...a']), CAT2.concat(['.a.a..a.a..', '..aa...aa..'])],
    sit: [['....a.a', '....aaa', '...aeae', '...aaan', '..aAab.', '.aaaab.', '.aaaabb', 'aaaa.a.'], ['....a.a', '....aaa', '...aeae', '...aaan', '..aAab.', '.aaaab.', '.aaaabb', '.aaa.aa']],
  },
  dog: {
    stand: [DOG.concat(['.aa.....aa....', '.a.a....a.a...', '.a.a....a.a...']), DOG2.concat(['.aa.....aa....', '.a.a....a.a...', '.a.a....a.a...'])],
    walk: [DOG.concat(['.aa.....aa....', '.a.a....a.a...', 'a...a..a...a..']), DOG2.concat(['.aa.....aa....', '..aa....aa....', '..aa.....aa...']), DOG.concat(['.aa.....aa....', '.a.a....a.a...', '.a..a..a...a..']), DOG2.concat(['.aa.....aa....', '..aa....aa....', '..aa.....aa...'])],
    sit: [['......dd..', '......aaa.', '.....daeaa', '.....daaan', '....aAab..', '...aaaab..', '..aaaaab..', '..aaaaab..', 'aaaaa.a.a.'], ['......dd..', '......aaa.', '.....daeaa', '.....daaan', '....aAab..', '...aaaab..', '..aaaaab..', 'a.aaaaab..', '.aaaa.a.a.']],
  },
  bird: {
    stand: [BIRD.concat(['...r.r..']), ['........', '.....hh.', '.ggggheo', 'twwggpp.', '.twwgcc.', '...r.r..']],
    walk: [BIRD.concat(['...r..r.']), ['......hh', '......he', '.ggggpho'.slice(0, 8), 'twwggpp.', '.twwgcc.', '....r...']],
    fly: BIRDF,
  },
  duck: {
    stand: [DUCK.concat(['...r.r....']), DUCK.concat(['...r.r....'])],
    walk: [DUCK.concat(['...r..r...']), DUCK.map(s => '.' + s.slice(0, 9)).concat(['....rr....'])],
    swim: [DUCK, DUCK.map((s, i) => i < 3 ? '.' + s.slice(0, 9) : s)],
    fly: [['...ww.......', '...www..hh..', 'tgggwwkkheoo', '.tggcccp....'], ['........hh..', 'tggggggkheoo', '.tgwwwcp....', '...www......', '...ww.......']],
  },
  squirrel: {
    stand: [['.tt....a.', 'tttt..aaa', 'tttt..aea', 'ttt..aaan', '.tt.aaab.', '.ttaaAbb.', '..taaab..', '..aa.aa..'], ['.tt......', 'tttt...a.', 'tttt..aaa', 'ttt...aea', '.tt.aaaan', '.ttaaAbb.', '..taaab..', '..aa.aa..']],
    walk: [['.tt.......', 'tttt...a..', '.ttt..aaa.', '..ttaaaaea', '...aaAabbn', '..a.a..a.a'], ['..........', '.ttt...a..', 'ttttt.aaa.', '.tttaaaaea', '...aaAabbn', '...aa..aa.']],
  },
};

/**
 * Draw one animal frame at the current raster origin (ground point under the animal = PW(0,0,0)).
 * kind: 'cat'|'dog'|'pigeon'|'seagull'|'duck'|'squirrel'.  pose: { anim, frame, dir, variant }
 * 'fly' frames are drawn just above the anchor with no shadow: put the anchor at the bird's altitude.
 */
export function drawAnimal(kind, pose) {
  pose = pose || {}; if (!ANIMAL_ANIMS[kind]) kind = 'cat';
  const set = F[kind] || (kind === 'duck' ? F.duck : F.bird), anim = set[pose.anim] ? pose.anim : 'stand', fr = set[anim];
  const rows = fr[(((pose.frame | 0) % fr.length) + fr.length) % fr.length], pals = PALS[kind], pal = pals[(((pose.variant | 0) % pals.length) + pals.length) % pals.length];
  const dir = (pose.dir | 0) & 3, mirror = dir === 1 || dir === 2, s = PW(0, 0, 0), ax = Math.round(s[0]), ay = Math.round(s[1]);
  const w = Math.max(...rows.map(q => q.length)), x0 = -(w >> 1);
  gclear();
  if (anim === 'swim') { ascii(rows, pal, x0, -rows.length + 1); flush(ax, ay, mirror); for (let x = -6; x <= 6; x++) if (x & 1 || Math.abs(x) > 4) pxw(ax + (mirror ? -x : x), ay + 1); return; }
  if (anim !== 'fly') shadow(ax, ay, 0, 0, Math.max(3, (w >> 1)), mirror);
  ascii(rows, pal, x0, -rows.length);
  flush(ax, ay, mirror);
}
import { pxh } from '../../engine/raster.js';
const pxw = (x, y) => pxh(x, y, '#e8f6fb90');

const G = (id, kind, pose) => ({ id, sb: ANIMAL_SB, draw: () => drawAnimal(kind, pose) });
export const galleryItems = [];
for (const k of ANIMALS) {
  for (let v = 0; v < ANIMAL_VARIANTS[k]; v++) galleryItems.push(G('char.animal.' + k + '.v' + v, k, { variant: v, dir: v % 2 }));
  for (const a of Object.keys(ANIMAL_ANIMS[k])) if (a !== 'stand') for (let f = 0; f < ANIMAL_ANIMS[k][a]; f++) galleryItems.push(G('char.animal.' + k + '.' + a + f, k, { anim: a, frame: f, dir: 0 }));
}
