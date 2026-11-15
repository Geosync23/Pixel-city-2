// Contact sheets for the wardrobe (loaded last on purpose: every wear_*.js / hair_*.js module has registered by then).
//   node tools/gallery.mjs wear.top.  --scale 3 --out clothes_tops      every catalogue TOP on the mannequin (also wear.outer. wear.dress. wear.bottom.
//                                                                       wear.shoes. wear.hat. wear.acc.)   — filter is a substring of the cell id, e.g. wear.top.tp_tee
//   node tools/gallery.mjs shape.top. --scale 3 --out shapes_tops       every SHAPE of a slot in a neutral colourway
//                                                                       (slots: top outer dress bottom shoes hat neck glasses bag beard)
//   node tools/gallery.mjs hairs.     --scale 3 --out hairs             every hairstyle: front, back, under a cap, shaggy (grown out)
// Every cell shows ONE piece four times: front, back, walking (mirrored direction), seated. Cell ids: wear.<slot>.<item id>, shape.<slot>.<shape id>, hairs.<id>.
import { drawChar, CHAR_SB } from './char.js';
import { shapeIds } from './_shapes.js';
import { PW, at } from '../../engine/raster.js';
import { CATALOG, MANNEQUIN, previewSpec, applyPiece } from '../../data/clothes.js';

const STEP = 21; let U = 0;
const POSES = [{ dir: 0 }, { dir: 3 }, { anim: 'walk', frame: 0, dir: 1 }, { anim: 'sit', dir: 0 }];
/** one gallery cell: the spec in several poses side by side */
const cell = (id, specs, poses = POSES) => ({ id, sb: [CHAR_SB[0], CHAR_SB[1], CHAR_SB[2] + STEP * (poses.length - 1), CHAR_SB[3]], draw: () => { if (!U) U = STEP / (PW(1, -1, 0)[0] - PW(0, 0, 0)[0]); poses.forEach((po, i) => at(U * i, -U * i, 0, () => drawChar(Array.isArray(specs) ? specs[i] : specs, po))); } });
export const galleryItems = [];
for (const it of CATALOG) galleryItems.push(cell('wear.' + it.slot + '.' + it.id, previewSpec(it)));
const DEMO = { top: { c: '#d9483b', c2: '#f4f0e8' }, outer: { c: '#2f3f72', c2: '#e8b83a' }, dress: { c: '#2f9a94', c2: '#f4f0e8' }, bottom: { c: '#4a6fa8', c2: '#f4f0e8' }, shoes: { c: '#d9483b', c2: '#f4f0e8' }, hat: { c: '#3b6fd0', c2: '#f4f0e8' },
  neck: { c: '#d9483b' }, glasses: { c: '#d9483b' }, bag: { c: '#b8794a', accent: '#e8c06a' } };
for (const slot of ['top', 'outer', 'dress', 'bottom', 'shoes', 'hat', 'neck', 'glasses', 'bag']) for (const id of shapeIds(slot)) {
  const acc = slot === 'neck' || slot === 'glasses' || slot === 'bag', it = Object.assign({ slot: acc ? 'acc' : slot, kind: acc ? slot : undefined, shape: id }, DEMO[slot]);
  galleryItems.push(cell(`shape.${slot}.${id}`, applyPiece(Object.assign({}, MANNEQUIN, slot === 'outer' ? { topColor: '#f4f0e8' } : null, slot === 'hat' || slot === 'glasses' ? { hair: 'short' } : null), it)));
}
for (const id of shapeIds('beard')) galleryItems.push(cell(`shape.beard.${id}`, Object.assign({}, MANNEQUIN, { hair: 'short', beard: id }), [{ dir: 0 }, { dir: 1 }]));
for (const id of shapeIds('hair')) { const s = Object.assign({}, MANNEQUIN, { hair: id, hairColor: '#8f5a30' }); galleryItems.push(cell(`hairs.${id}`, [s, s, Object.assign({}, s, { hat: 'cap', hatColor: '#3b6fd0' }), Object.assign({}, s, { shag: true })], [{ dir: 0 }, { dir: 3 }, { dir: 0 }, { dir: 0 }])); }
