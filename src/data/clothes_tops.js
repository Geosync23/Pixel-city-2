// Catalogue: TOPS and OUTERWEAR (artist A). Declare pieces with piece() — rules, brands and fields in clothes_brands.js; guide in docs/reports/clothes_drawing.md.
// The rows below are the framework's examples: keep, restyle or replace them. Target for this file: 300+ tops, 200+ outerwear.
import { piece } from './clothes_brands.js';
const P = piece;
export const TOPS = [
  P({ id: 'tp_tee_white', slot: 'top', shape: 'tee', name: 'Everyday Tee, White', brand: 'maple_basics', styles: ['casual'], warmth: 1, c: '#f4f0e8' }),
  P({ id: 'tp_breton_navy', slot: 'top', shape: 'long', name: 'Breton Stripe Long Sleeve', brand: 'thread_co', styles: ['casual', 'smart'], warmth: 2, c: '#2f3f72', c2: '#f4f0e8', pat: 'stripes' }),
  P({ id: 'tp_raglan_otters', slot: 'top', shape: 'raglan', name: 'Dugout Raglan', brand: 'otterline', styles: ['sporty', 'casual'], warmth: 1, c: '#f4f0e8', c2: '#d2392f' }),
  P({ id: 'tp_halter_plum', slot: 'top', shape: 'halter', name: 'Last Dance Halter', brand: 'nightjar', styles: ['party', 'summer'], warmth: 0, c: '#6a3a5a', pat: 'sparkle' }),
  P({ id: 'tp_peplum_cream', slot: 'top', shape: 'peplum', name: 'Gilded Peplum Blouse', brand: 'marigold', styles: ['smart', 'formal'], warmth: 1, c: '#f6ead0' }),
  P({ id: 'tp_shirt_oxford_blue', slot: 'top', shape: 'shirt', name: 'Oxford Button-Down, Sky', brand: 'hollowell', styles: ['smart', 'work'], warmth: 2, c: '#9ac8e8' }),
  P({ id: 'tp_hawaiian_coral', slot: 'top', shape: 'shortshirt', name: 'Boardwalk Aloha Shirt', brand: 'tidepool', styles: ['summer', 'casual'], warmth: 0, c: '#f07a5a', c2: '#f4f0e8', accent: '#3fb8a8', pat: 'floral', season: 1 }),
  P({ id: 'tp_tiedye_pop', slot: 'top', shape: 'tee', name: 'Supernova Tie-Dye Tee', brand: 'pixelpop', styles: ['street', 'artsy'], warmth: 1, c: '#7a55c8', c2: '#f08ab0', accent: '#5ab0e0', pat: 'tiedye' }),
  P({ id: 'tp_turtle_oat', slot: 'top', shape: 'turtleneck', name: 'Fireside Roll-Neck', brand: 'juniper_rye', styles: ['cozy', 'smart'], warmth: 3, c: '#ead9b8' }),
];
export const OUTERS = [
  P({ id: 'ou_denim_classic', slot: 'outer', shape: 'denim', name: 'Trucker Jacket, Mid Wash', brand: 'second_wind', styles: ['vintage', 'casual'], warmth: 2, c: '#4a6fa8' }),
  P({ id: 'ou_slicker_yellow', slot: 'outer', shape: 'raincoat', name: 'Harbour Slicker', brand: 'saltline', styles: ['rain', 'work'], warmth: 2, c: '#e8b83a' }),
  P({ id: 'ou_trench_camel', slot: 'outer', shape: 'trench', name: 'Quayside Trench', brand: 'hollowell', styles: ['formal', 'smart', 'rain'], warmth: 3, c: '#c8a070' }),
  P({ id: 'ou_cape_wine', slot: 'outer', shape: 'cape', name: 'Opera Cape', brand: 'marigold', styles: ['formal', 'party'], warmth: 2, c: '#8a2f3a' }),
  P({ id: 'ou_kimono_indigo', slot: 'outer', shape: 'kimono', name: 'Indigo Block-Print Kimono', brand: 'little_lantern', styles: ['artsy', 'summer'], warmth: 1, c: '#2f3f72', c2: '#ead9b8', accent: '#e8b83a' }),
  P({ id: 'ou_gilet_olive', slot: 'outer', shape: 'gilet', name: 'Ridgeline Gilet', brand: 'fern_field', styles: ['outdoor', 'casual'], warmth: 3, c: '#6f7a48' }),
];
