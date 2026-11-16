// The clothing catalogue: merges the three catalogue files (tops + outerwear / bottoms + dresses + shoes / hats + accessories) and the hairstyles.
// Pure data (node-safe). Rules, brands, shops and the piece() helper live in clothes_brands.js; shapes are drawn by src/art/chars (see docs/reports/clothes_drawing.md).
//   CATALOG            every purchasable piece           PIECE_BY_ID[id]        bySlot(slot)   soldAt(shopId, season?)
//   applyPiece(spec, piece) -> spec    put ONE piece onto a character spec (mutates and returns it)
//   specWith(base, pieces) -> spec     a copy of `base` wearing the given pieces (ids or objects), layered in slot order; used by previews, mirrors, the gallery
//   MANNEQUIN          neutral spec used for contact sheets and shop thumbnails
import { TOPS, OUTERS } from './clothes_tops.js';
import { BOTTOMS, DRESSES, SHOES } from './clothes_bottoms.js';
import { HATS, ACCS } from './clothes_acc.js';
import { HAIR_STYLES, FACIAL, HAIR_DYES } from './hair_styles.js';
import { BRANDS, SHOPS, STYLES, SLOTS, ACC_KINDS, SLOT_NAME, priceOf } from './clothes_brands.js';
import { reanchor } from './clothing_stores.js';   /* the ten brand / speciality stores (owner msgs 177-178): adds them to SHOPS and to each piece's `shops` */
import { NEW_PIECES } from './clothing_new.js';     /* the signature pieces of the new stores */

export { BRANDS, SHOPS, STYLES, SLOTS, ACC_KINDS, SLOT_NAME, priceOf, HAIR_STYLES, FACIAL, HAIR_DYES };
export const MIN_PIECES = 1000, MIN_HAIRS = 60;
export const CATALOG = reanchor([...TOPS, ...OUTERS, ...DRESSES, ...BOTTOMS, ...SHOES, ...HATS, ...ACCS, ...NEW_PIECES]);
export const PIECE_BY_ID = Object.fromEntries(CATALOG.map(p => [p.id, p]));
export const HAIR_BY_ID = Object.fromEntries(HAIR_STYLES.map(h => [h.id, h]));
export const bySlot = slot => CATALOG.filter(p => p.slot === slot);
export const soldAt = (shop, season) => CATALOG.filter(p => p.shops.includes(shop) && (season === undefined || p.season === null || p.season === season || (Array.isArray(p.season) && p.season.includes(season))));

export const MANNEQUIN = { skin: '#ecba90', hair: 'bun', hairColor: '#4a3022', top: 'tee', topColor: '#e8e4dc', bottom: 'slacks', bottomColor: '#9aa0a8', shoes: '#f0ece4', build: 'avg', height: 'avg', age: 'adult', bag: null, hat: null, glasses: false, beard: false };
const CLEAR = { top: ['topPat', 'topColor2'], dress: ['topPat', 'topColor2'], outer: ['outerPat', 'outerColor2'], bottom: ['botPat', 'bottomColor2'], shoes: ['shoeColor2'], hat: ['hatBand'] };
/** put one piece onto a spec */
export function applyPiece(s, it) {
  if (!it) return s; for (const k of CLEAR[it.slot] || []) delete s[k];
  const c = it.c, c2 = it.c2;
  switch (it.slot) {
    case 'top': case 'dress': if (it.slot === 'dress') s.onepiece = true; else delete s.onepiece; s.top = it.shape; s.topColor = c; if (it.pat) s.topPat = it.pat; if (c2) s.topColor2 = c2; if (it.accent) s.accent = it.accent; if (it.inner) s.innerColor = it.inner; break;
    case 'outer': s.outer = it.shape; s.outerColor = c; if (it.pat) s.outerPat = it.pat; if (c2) s.outerColor2 = c2; if (it.accent) s.accent = it.accent; break;
    case 'bottom': s.bottom = it.shape; s.bottomColor = c; if (it.pat) s.botPat = it.pat; if (c2) s.bottomColor2 = c2; break;
    case 'shoes': s.shoes = c; s.shoeType = it.shape; if (c2) s.shoeColor2 = c2; break;
    case 'hat': s.hat = it.shape; s.hatColor = c; if (c2) s.hatBand = c2; if (it.accent) s.accent = it.accent; break;
    case 'acc':
      if (it.kind === 'neck') { s.neck = it.shape; s.neckColor = c; if (it.shape === 'scarf') s.scarf = c; }
      else if (it.kind === 'glasses') { s.glasses = it.shape === 'specs' ? true : it.shape; s.glassesColor = c; }
      else if (it.kind === 'bag') { s.bag = it.shape; s.bagColor = c; if (it.accent) s.accent = it.accent; }
      else if (it.kind === 'earring') { s.earring = it.shape || 'stud'; s.earringColor = c; }
      else s[it.kind] = c; // belt, gloves, socks, tights, watch
  }
  return s;
}
/** the neutral figure a piece is previewed on (shorts for socks, a skirt for tights, short hair under hats and glasses) */
export function previewBase(it) {
  const s = Object.assign({}, MANNEQUIN);
  if (it.slot === 'hat' || (it.slot === 'acc' && (it.kind === 'glasses' || it.kind === 'earring'))) s.hair = 'short';
  if (it.slot === 'acc' && it.kind === 'socks') s.bottom = 'shorts'; else if (it.slot === 'acc' && it.kind === 'tights') s.bottom = 'skirt';
  else if (it.slot === 'acc' && (it.kind === 'watch' || it.kind === 'belt')) s.top = 'tee';
  return s;
}
/** spec of the mannequin wearing just this piece */
export const previewSpec = it => applyPiece(previewBase(it), it);
const ORDER = { bottom: 0, top: 1, dress: 2, outer: 3, shoes: 4, hat: 5, acc: 6 };
export function specWith(base, pieces) {
  const s = Object.assign({}, base); delete s.outfit; delete s._v;
  const list = (pieces || []).map(p => (typeof p === 'string' ? PIECE_BY_ID[p] : p)).filter(Boolean).sort((a, b) => ORDER[a.slot] - ORDER[b.slot]);
  for (const it of list) applyPiece(s, it);
  return s;
}
