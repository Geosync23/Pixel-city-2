// Catalogue: BOTTOMS, DRESSES / ONE-PIECES and SHOES (artist B). Declare pieces with piece() — see clothes_brands.js and docs/reports/clothes_drawing.md.
// The rows below are the framework's examples. Target for this file: 160+ bottoms, 110+ dresses, 130+ shoes.
import { piece } from './clothes_brands.js';
const P = piece;
export const BOTTOMS = [
  P({ id: 'bt_jeans_mid', slot: 'bottom', shape: 'jeans', name: 'Straight Jeans, Mid Blue', brand: 'maple_basics', styles: ['casual'], warmth: 2, c: '#4a6fa8' }),
  P({ id: 'bt_culottes_rust', slot: 'bottom', shape: 'culottes', name: 'Gallery Culottes', brand: 'little_lantern', styles: ['artsy', 'smart'], warmth: 1, c: '#b8563a' }),
  P({ id: 'bt_harem_teal', slot: 'bottom', shape: 'harem', name: 'Drift Harem Pants', brand: 'tidepool', styles: ['summer', 'cozy'], warmth: 1, c: '#2f9a94' }),
  P({ id: 'bt_wrapskirt_floral', slot: 'bottom', shape: 'wrapskirt', name: 'Market Day Wrap Skirt', brand: 'little_lantern', styles: ['artsy', 'summer'], warmth: 1, c: '#e8b83a', c2: '#b83a6a', pat: 'floral' }),
  P({ id: 'bt_track_otters', slot: 'bottom', shape: 'track', name: 'Otters Warm-Up Pants', brand: 'otterline', styles: ['sporty'], warmth: 2, c: '#2f9a94', c2: '#f08a20' }),
  P({ id: 'bt_slacks_pin', slot: 'bottom', shape: 'slacks', name: 'Pinstripe Trousers, Charcoal', brand: 'hollowell', styles: ['formal', 'work'], warmth: 2, c: '#4a4a58', pat: 'pinstripe' }),
];
export const DRESSES = [
  P({ id: 'dr_sundress_dots', slot: 'dress', shape: 'sundress', name: 'Picnic Sundress', brand: 'tidepool', styles: ['summer', 'casual'], warmth: 0, c: '#d9483b', c2: '#f4f0e8', pat: 'dots' }),
  P({ id: 'dr_ballgown_midnight', slot: 'dress', shape: 'ballgown', name: 'Midnight Ball Gown', brand: 'marigold', styles: ['formal', 'party'], warmth: 1, c: '#2f3f72', accent: '#e8c06a' }),
  P({ id: 'dr_qipao_jade', slot: 'dress', shape: 'qipao', name: 'Jade Lantern Qipao', brand: 'nightjar', styles: ['formal', 'party'], warmth: 1, c: '#2f9a94', c2: '#e8c06a' }),
  P({ id: 'dr_shirtdress_stripe', slot: 'dress', shape: 'shirtdress', name: 'Deckchair Shirt Dress', brand: 'thread_co', styles: ['smart', 'casual'], warmth: 1, c: '#5ab0e0', c2: '#f4f0e8', pat: 'vstripes' }),
];
export const SHOES = [
  P({ id: 'sh_sneaker_white', slot: 'shoes', shape: 'sneaker', name: 'Court Classics, White', brand: 'kicks_lab', styles: ['casual', 'sporty'], warmth: 1, c: '#f0ece4' }),
  P({ id: 'sh_cowboy_tan', slot: 'shoes', shape: 'cowboyboot', name: 'Dusty Trail Boots', brand: 'second_wind', styles: ['vintage', 'outdoor'], warmth: 2, c: '#8a5a38', c2: '#e8c06a' }),
  P({ id: 'sh_maryjane_red', slot: 'shoes', shape: 'maryjane', name: 'Cherry Mary Janes', brand: 'marigold', styles: ['smart', 'vintage'], warmth: 1, c: '#b83a3a', c2: '#f4f0e8' }),
  P({ id: 'sh_clog_green', slot: 'shoes', shape: 'clog', name: 'Garden Clogs', brand: 'little_lantern', styles: ['artsy', 'casual'], warmth: 1, c: '#4fa860' }),
  P({ id: 'sh_rainboot_yellow', slot: 'shoes', shape: 'rainboot', name: 'Puddle Jumpers', brand: 'saltline', styles: ['rain'], warmth: 2, c: '#e8b83a' }),
];
