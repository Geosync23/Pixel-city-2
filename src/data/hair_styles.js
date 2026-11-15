// Catalogue: HAIRSTYLES and FACIAL HAIR sold as services (artist C). id = the hair / beard shape id drawn by src/art/chars (built-in or regHair / regShape('beard')).
// books: which lookbooks carry the style: 'barber' (Otis & Sons), 'salon' (Bloom Beauty), 'colorbar' (Lacquer Lounge). starter: true = offered in the character creator
// (keep about 12). The rows below are the framework's examples; the built-in ids still to be listed are in docs/reports/clothes_drawing.md. Target: 60+ styles, 10+ facial.
import { hair, facial } from './clothes_brands.js';
export const HAIR_STYLES = [
  hair({ id: 'short', name: 'Short & Simple', len: 'short', books: ['barber', 'salon'], starter: true }),
  hair({ id: 'bob', name: 'Classic Bob', len: 'medium', books: ['salon'], starter: true }),
  hair({ id: 'long', name: 'Long & Straight', len: 'long', books: ['salon'], starter: true }),
  hair({ id: 'skinfade', name: 'Skin Fade', len: 'short', books: ['barber'] }),
  hair({ id: 'pompadour', name: 'Pompadour', len: 'short', books: ['barber'] }),
  hair({ id: 'spacebuns', name: 'Space Buns', len: 'medium', books: ['salon'] }),
  hair({ id: 'mermaid', name: 'Mermaid Lengths', len: 'long', books: ['salon', 'colorbar'] }),
  hair({ id: 'sidepony', name: 'Side Ponytail', len: 'medium', books: ['salon'] }),
  hair({ id: 'curtainbob', name: 'Curtain Bob', len: 'medium', books: ['salon'] }),
  hair({ id: 'quifffade', name: 'Quiff Fade', len: 'short', books: ['barber'] }),
];
export const FACIAL = [
  facial({ id: 'full', name: 'Full Beard' }), facial({ id: 'stubble', name: 'Designer Stubble', price: 8 }),
  facial({ id: 'vandyke', name: 'Van Dyke' }), facial({ id: 'handlebar', name: 'Handlebar Moustache', price: 14 }),
];
/** dye colours sold at salons / the colour bar: [hex, name, natural?] */
export const HAIR_DYES = [['#2b2433', 'Soft Black', 1], ['#4a3022', 'Espresso', 1], ['#6e4428', 'Chestnut', 1], ['#8f5a30', 'Caramel', 1], ['#a8452a', 'Auburn', 1], ['#d9722e', 'Copper', 1], ['#e6c36a', 'Honey Blonde', 1], ['#f0e4b8', 'Platinum', 1], ['#a9a9b4', 'Silver', 1], ['#e8e8ee', 'Snow', 1],
  ['#f07aa8', 'Bubblegum'], ['#4f8fd8', 'Bay Blue'], ['#3fb8a8', 'Sea Glass'], ['#8a5cd0', 'Lilac'], ['#d9483b', 'Fire Engine'], ['#9ac84a', 'Lime'], ['#f09a3a', 'Tangerine'], ['#2f9a94', 'Otter Teal'], ['#b83a6a', 'Magenta'], ['#f4a8c0', 'Rose Quartz']];
