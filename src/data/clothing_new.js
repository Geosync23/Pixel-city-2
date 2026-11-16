// clothing_new.js — the NEW pieces made for the clothing stores' signature looks (owner msg 178): 25 pieces, each also sold on its own. Shapes: src/art/chars/wear_cs_new.js.
// All of them are in store only (data/instore.js STORE_PIECE takes NEW_IDS), at the brand's own new shop (data/clothing_stores.js homeShop).
import { piece } from './clothes_brands.js';
const P = piece;
export const NEW_PIECES = [
  // Hollowell & Sons: the morning suit
  P({ id: 'ou_morningcoat_dove', slot: 'outer', shape: 'morningcoat', name: 'Morning Coat, Dove Grey', brand: 'hollowell', styles: ['formal', 'smart'], warmth: 2, c: '#8a8f98' }),
  P({ id: 'tp_wingcollar_ivory', slot: 'top', shape: 'wingcollar', name: 'Wing-Collar Shirt and Claret Cravat', brand: 'hollowell', styles: ['formal'], warmth: 1, c: '#f4f0e8', accent: '#8a3848' }),
  P({ id: 'bt_morningstripe_grey', slot: 'bottom', shape: 'morningstripe', name: 'Cashmere-Stripe Morning Trousers', brand: 'hollowell', styles: ['formal', 'smart'], warmth: 2, c: '#7a808c', c2: '#33303f' }),
  P({ id: 'ht_homburg_pearl', slot: 'hat', shape: 'homburg', name: 'Homburg, Pearl Grey', brand: 'hollowell', styles: ['formal', 'smart'], warmth: 1, c: '#a9a9b4', c2: '#33303f' }),
  P({ id: 'sh_spectator_tan', slot: 'shoes', shape: 'spectator', name: 'Co-Respondent Shoes, Cream and Tan', brand: 'hollowell', styles: ['smart', 'formal', 'vintage'], warmth: 1, c: '#f4f0e8', c2: '#8a5a3a' }),
  // Nightjar: after midnight
  P({ id: 'dr_fringe_midnight', slot: 'dress', shape: 'fringe', name: 'Midnight Fringe Dress', brand: 'nightjar', styles: ['party', 'vintage'], warmth: 1, c: '#2b2433', c2: '#d8b060' }),
  P({ id: 'ou_capelet_plum', slot: 'outer', shape: 'capelet', name: 'Sequin Capelet, Plum', brand: 'nightjar', styles: ['party', 'formal'], warmth: 1, c: '#6a3a7a', c2: '#e8c8f0' }),
  P({ id: 'ht_featherband_gold', slot: 'hat', shape: 'featherband', name: 'Feathered Headband, Gold', brand: 'nightjar', styles: ['party', 'vintage'], warmth: 0, c: '#d8b060', c2: '#2f9a94' }),
  P({ id: 'sh_tstrap_black', slot: 'shoes', shape: 'tstrap', name: 'T-Strap Dance Heels', brand: 'nightjar', styles: ['party', 'vintage'], warmth: 0, c: '#2b2433' }),
  // Juniper & Rye: hearthside
  P({ id: 'tp_yoke_rust', slot: 'top', shape: 'yokeknit', name: 'Hearthside Yoke Jumper, Rust', brand: 'juniper_rye', styles: ['cozy', 'winter'], warmth: 3, c: '#a8452a', c2: '#ead9b8', accent: '#3f6a4a' }),
  P({ id: 'ou_shawlcardi_oat', slot: 'outer', shape: 'shawlcardi', name: 'Shawl-Collar Toggle Cardigan, Oatmeal', brand: 'juniper_rye', styles: ['cozy', 'casual'], warmth: 3, c: '#ead9b8', c2: '#6a4428' }),
  P({ id: 'ht_stripepom_forest', slot: 'hat', shape: 'stripepom', name: 'Striped Bobble Hat, Forest and Oat', brand: 'juniper_rye', styles: ['winter', 'cozy'], warmth: 3, c: '#3f6a4a', c2: '#ead9b8' }),
  P({ id: 'sh_sheepboot_chestnut', slot: 'shoes', shape: 'sheepboot', name: 'Sheepskin Hearth Boots', brand: 'juniper_rye', styles: ['cozy', 'winter'], warmth: 3, c: '#8a5a3a' }),
  // Tidepool: boardwalk
  P({ id: 'tp_aloha_coral', slot: 'top', shape: 'aloha', name: 'Hibiscus Camp Shirt, Coral', brand: 'tidepool', styles: ['summer', 'casual'], warmth: 0, c: '#f07a5a', c2: '#fff3c8', accent: '#2f9a94' }),
  P({ id: 'bt_waveshorts_aqua', slot: 'bottom', shape: 'waveshorts', name: 'Breaker Shorts, Aqua', brand: 'tidepool', styles: ['summer', 'sporty'], warmth: 0, c: '#3fb8a8', c2: '#fff3c8' }),
  P({ id: 'ac_netbag_sand', slot: 'acc', kind: 'bag', shape: 'netbag', name: 'String Beach Bag', brand: 'tidepool', styles: ['summer', 'casual'], warmth: 0, c: '#ead9b8', accent: '#f07a5a' }),
  // Saltline: squall line
  P({ id: 'ou_oilskin_yellow', slot: 'outer', shape: 'oilskin', name: 'Squall Oilskin Long Coat, Yellow', brand: 'saltline', styles: ['rain', 'work', 'outdoor'], warmth: 3, c: '#e8b83a', c2: '#dfe6ea' }),
  P({ id: 'tp_guernsey_navy', slot: 'top', shape: 'guernsey', name: 'Harbour Guernsey, Navy', brand: 'saltline', styles: ['work', 'cozy'], warmth: 3, c: '#2f3f72' }),
  P({ id: 'sh_deckboot_navy', slot: 'shoes', shape: 'deckboot', name: 'Deck Boots, Navy and Yellow', brand: 'saltline', styles: ['rain', 'work'], warmth: 2, c: '#34507f', c2: '#e8b83a' }),
  // Otterline: dawn row
  P({ id: 'tp_chevron_cream', slot: 'top', shape: 'chevrontop', name: 'Crew Zephyr, Cream and Red', brand: 'otterline', styles: ['sporty'], warmth: 0, c: '#f4f0e8', c2: '#d2392f', accent: '#2f2c3a' }),
  P({ id: 'ou_splash_red', slot: 'outer', shape: 'splashjacket', name: 'Splash Jacket, Red and Black', brand: 'otterline', styles: ['sporty', 'outdoor', 'rain'], warmth: 2, c: '#d2392f', c2: '#2f2c3a', accent: '#f4f0e8' }),
  P({ id: 'sh_racer_white', slot: 'shoes', shape: 'racer', name: 'Regatta Racers', brand: 'otterline', styles: ['sporty'], warmth: 0, c: '#f4f0e8', c2: '#d2392f' }),
  // Little Lantern: block print day
  P({ id: 'dr_patchwork_indigo', slot: 'dress', shape: 'patchwork', name: 'Patchwork Pinafore, Indigo and Marigold', brand: 'little_lantern', styles: ['artsy', 'casual'], warmth: 1, c: '#2a3a6a', c2: '#e8b83a', accent: '#c0563a', inner: '#f4f0e8' }),
  P({ id: 'ht_kerchief_marigold', slot: 'hat', shape: 'kerchief', name: 'Block-Print Kerchief, Marigold', brand: 'little_lantern', styles: ['artsy', 'summer'], warmth: 0, c: '#e8b83a', c2: '#2a3a6a' }),
  P({ id: 'ac_bundle_indigo', slot: 'acc', kind: 'bag', shape: 'bundle', name: 'Knot Bundle Bag, Indigo', brand: 'little_lantern', styles: ['artsy', 'casual'], warmth: 0, c: '#2a3a6a', accent: '#f4f0e8' }),
];
export const NEW_IDS = NEW_PIECES.map(p => p.id);
