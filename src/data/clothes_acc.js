// Catalogue: HATS / HEADWEAR and ACCESSORIES (artist C). Declare pieces with piece() — see clothes_brands.js and docs/reports/clothes_drawing.md.
// Accessories: slot 'acc' + kind 'neck' | 'glasses' | 'bag' (need a shape) or 'belt' | 'gloves' | 'socks' | 'tights' | 'watch' (colour only, no shape).
// The rows below are the framework's examples. Target for this file: 110+ hats, 110+ accessories.
import { piece } from './clothes_brands.js';
const P = piece;
export const HATS = [
  P({ id: 'ht_newsboy_tweed', slot: 'hat', shape: 'newsboy', name: 'Paperboy Tweed Cap', brand: 'second_wind', styles: ['vintage', 'smart'], warmth: 2, c: '#7a6a58' }),
  P({ id: 'ht_pillbox_rose', slot: 'hat', shape: 'pillbox', name: 'Matinee Pillbox', brand: 'marigold', styles: ['formal', 'vintage'], warmth: 1, c: '#f08ab0', accent: '#f4f0e8' }),
  P({ id: 'ht_sombrero_fiesta', slot: 'hat', shape: 'sombrero', name: 'Fiesta Sombrero', brand: 'little_lantern', styles: ['party', 'summer'], warmth: 0, c: '#ecd690', c2: '#d9483b', season: 1 }),
  P({ id: 'ht_pom_otters', slot: 'hat', shape: 'pom', name: 'Otters Bobble Hat', brand: 'otterline', styles: ['winter', 'sporty'], warmth: 4, c: '#d2392f', c2: '#f4f0e8' }),
];
export const ACCS = [
  P({ id: 'ac_choker_black', slot: 'acc', kind: 'neck', shape: 'choker', name: 'Velvet Choker', brand: 'nightjar', styles: ['party'], warmth: 0, c: '#33303f' }),
  P({ id: 'ac_cateye_red', slot: 'acc', kind: 'glasses', shape: 'cateye', name: 'Cat-Eye Frames, Cherry', brand: 'lacquer', styles: ['vintage', 'smart'], warmth: 0, c: '#d9483b' }),
  P({ id: 'ac_bucketbag_tan', slot: 'acc', kind: 'bag', shape: 'bucketbag', name: 'Saddle Bucket Bag', brand: 'lacquer', styles: ['smart', 'casual'], warmth: 0, c: '#b8794a', accent: '#e8c06a' }),
  P({ id: 'ac_scarf_long_mustard', slot: 'acc', kind: 'neck', shape: 'longscarf', name: 'Mile-Long Scarf, Mustard', brand: 'juniper_rye', styles: ['cozy', 'winter'], warmth: 3, c: '#e8b83a' }),
  P({ id: 'ac_gloves_red', slot: 'acc', kind: 'gloves', name: 'Wool Gloves, Red', brand: 'juniper_rye', styles: ['winter'], warmth: 3, c: '#d9483b' }),
  P({ id: 'ac_socks_stripe', slot: 'acc', kind: 'socks', name: 'Loud Socks, Lime', brand: 'pixelpop', styles: ['street'], warmth: 1, c: '#9ac84a' }),
  P({ id: 'ac_watch_gold', slot: 'acc', kind: 'watch', name: 'Harbourmaster Watch', brand: 'lacquer', styles: ['formal', 'smart'], warmth: 0, c: '#e8c06a' }),
  P({ id: 'ac_belt_brown', slot: 'acc', kind: 'belt', name: 'Bridle Leather Belt', brand: 'hollowell', styles: ['smart', 'work'], warmth: 0, c: '#6a4428' }),
];
