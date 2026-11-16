// clothing_outfits.js — PRESET OUTFITS of every clothing shop (owner msg 178): ready-made looks put together from pieces the shop sells.
// Pure data (node-safe). A look: { id, name, pieces: [catalogue ids], season?: [0 spring, 1 summer, 2 autumn, 3 winter] (offered only then), sig?: true (made of the NEW pieces) }.
// Rules checked by src/data/validate.mjs (checkOutfits): every piece exists, is sold at that shop, is not a catalogue exclusive, fits the look's season; one piece per slot
// (accessories: one per kind); a top + bottom or a dress, and shoes (the two speciality shops in PARTIAL sell sets instead); 3 to 6 looks per shop, at least 3 on offer in every season. Look pieces are always on that shop's rails (sim/clothes_shop.js inStock).
const L = (id, name, pieces, x) => Object.assign({ id, name, pieces: pieces.split(' ') }, x);
const SIG = { sig: true }, SUMMER = { season: [1] }, COLD = { season: [2, 3] };
/** speciality shops sell no full wardrobe: their looks are SETS (shoes with socks and a belt; a hat with a scarf, a bag and glasses) worn with your own clothes */
export const PARTIAL = { 'cs:sole': 1, 'cs:brim': 1 };
export const OUTFITS = {
  /* ---- the ten new stores ---- */
  'cs:hollowell': [
    L('h_morning', 'The Morning Suit', 'ou_morningcoat_dove tp_wingcollar_ivory bt_morningstripe_grey ht_homburg_pearl sh_spectator_tan', Object.assign({ note: 'Cut for the harbour-side wedding season. New this year, and every piece is sold on its own.' }, SIG)),
    L('h_boardroom', 'Boardroom Charcoal', 'ou_suit_charcoal tp_shirt_pinnavy bt_slacks_charcoal sh_oxford_black ac_tie_burgundy ac_briefcase_black'),
    L('h_blacktie', 'Black Tie', 'ou_tux_midnight tp_shirt_butter bt_slacks_navy sh_monk_black ac_bowtie_black ht_tophat_opera'),
    L('h_country', 'Country Weekend', 'ou_blazer_tweed tp_turtle_greymarl bt_slacks_camel sh_brogue_tan ht_flatcap_camel ac_belt_brown'),
    L('h_overcoat', 'The Town Overcoat', 'ou_coat_navy tp_turtle_navy bt_slacks_pin sh_chelsea_black ht_fedora_charcoal ac_gloves_driving', COLD),
    L('h_office', 'Corner Office', 'dr_sheath_black ou_suit_camel sh_pump_black ac_watch_steel ac_briefcase_chestnut'),
  ],
  'cs:nightjar': [
    L('n_midnight', 'After Midnight', 'dr_fringe_midnight ou_capelet_plum ht_featherband_gold sh_tstrap_black', Object.assign({ note: 'Fringe that keeps moving after you stop. New this year, and every piece is sold on its own.' }, SIG)),
    L('n_wild', 'Wild Side', 'dr_wrapdress_leopard sh_kneeboot_black ou_bomber_satin ac_earring_hoop_silver'),
    L('n_lbe', 'Little Black Everything', 'dr_babydoll_black sh_heel_black ou_bolero_sequin ac_belt_plum'),
    L('n_encore', 'Second Encore', 'tp_star_nightjar bt_miniskirt_spot sh_derby_black ac_choker_wine'),
    L('n_opening', 'Opening Night', 'tp_offsh_black bt_trumpet_wine sh_stiletto_red ou_cape_sparkle ht_fascinator_black ac_pearls_black'),
  ],
  'cs:juniper': [
    L('j_hearth', 'Hearthside', 'tp_yoke_rust ou_shawlcardi_oat bt_cords_forest sh_sheepboot_chestnut ht_stripepom_forest', Object.assign({ note: 'Knitted in front of this very fire. New this year, and every piece is sold on its own.' }, SIG)),
    L('j_fireside', 'Fireside Rust', 'tp_turtle_jrust bt_cords_mustard sh_tallboot_taupe ou_wrap_blanket ht_beanie_oat'),
    L('j_sundayin', 'A Sunday In', 'dr_sweaterdress_argyle sh_slipper_red ou_cardi_shawlmust ac_tights_forest'),
    L('j_cottage', 'Cottage Stripes', 'tp_long_cottage bt_chinos_camel ou_cardi_shawlfor sh_tallboot_taupe ht_newsboy_forest'),
    L('j_keeper', 'Lighthouse Keeper', 'tp_cable_oat bt_cords_brown sh_sheepboot_chestnut ac_scarf_long_mustard ac_gloves_fingerless'),
  ],
  'cs:secondwind': [
    L('s_sunday', 'Charity-Shop Sunday', 'tp_turtle_mustard bt_jeans_faded sh_brogue_brown ou_coat_hound ht_flatcap_grey'),
    L('s_denim', 'Seventies Denim', 'tp_ringer_mustard bt_flare_indigo ou_denim_classic sh_boot_tan ac_bandana_paisley'),
    L('s_league', 'League Night', 'tp_bowl_black bt_jeans_acid sh_skate_brown ht_trucker_gasstation ac_round_wire'),
    L('s_teadance', 'Tea Dance', 'dr_teadress_dots sh_kneeboot_white ou_cardi_grandpa ht_headscarf_cherry'),
  ],
  'cs:sole': [
    L('so_polish', 'The Sunday Polish', 'sh_oxford_brown ac_socks_argyle ac_belt_brown'),
    L('so_tweed', 'Town and Tweed', 'sh_brogue_tan ac_socks_bottle ac_belt_braided'),
    L('so_autumn', 'Autumn Leaves', 'sh_chelsea_brown ac_socks_mustard ac_belt_suede'),
    L('so_dancing', 'Dancing Shoes', 'sh_maryjane_patent ac_tights_wine ac_belt_cherry'),
  ],
  'cs:tidepool': [
    L('t_boardwalk', 'Boardwalk', 'tp_aloha_coral bt_waveshorts_aqua sh_espadrille_navy ac_netbag_sand ht_panama_boardwalk', Object.assign({ note: 'Hibiscus up top, breakers below. New this year, and every piece is sold on its own.' }, SIG)),
    L('t_lifeguard', 'Lifeguard Off Duty', 'tp_retro_lifeguard bt_harem_teal sh_wedge_tan ou_zhood_sand ht_bucket_sandbar'),
    L('t_picnic', 'Picnic Dots', 'dr_sundress_dots sh_wedge_tan ou_cardi_linen ac_bucketbag_straw'),
    L('t_reef', 'Reef Day', 'tp_tank_coral bt_boardshorts_aqua sh_flipflop_coral ht_visor_aqua ac_tint_rose', SUMMER),
    L('t_lido', 'Lido Afternoon', 'dr_halter_aqua sh_strappy_coral ht_floppy_sand', SUMMER),
    L('t_promenade', 'Promenade', 'tp_offsh_stripe bt_denimskirt_white sh_espadrille_stripe ou_denim_white ht_boater_coral', SUMMER),
  ],
  'cs:outfitters': [
    L('o_squall', 'Squall Line', 'ou_oilskin_yellow tp_guernsey_navy bt_sailor_navy sh_deckboot_navy ht_souwester_yellow', Object.assign({ note: 'Tested in the harbour by Captain Bea in person. New this year, and every piece is sold on its own.' }, SIG)),
    L('o_shift', 'Harbour Shift', 'tp_gansey_yellow bt_carpenter_denim sh_rainboot_navy ht_watchcap_navy'),
    L('o_dockhand', 'Dock Hand', 'tp_tee_teal bt_overalls_khaki sh_workboot_black ou_chore_canvas ht_trucker_dockhand'),
    L('o_ridgeway', 'Ridgeway', 'tp_coll_park bt_cargo_khaki sh_hiking_olive ou_field_olive ht_watchcap_moss'),
    L('o_trailhead', 'Trailhead', 'dr_romper_khaki sh_hiking_grey ht_cap_olive'),
  ],
  'cs:otterline': [
    L('r_dawn', 'Dawn Row', 'tp_chevron_cream ou_splash_red bt_runshorts_black sh_racer_white ht_visor_court', Object.assign({ note: 'What the six o\'clock eight wears. New this year, and every piece is sold on its own.' }, SIG)),
    L('r_practice', 'Practice Day', 'tp_raglan_navy bt_joggers_navy sh_runner_blue ac_drawstring_otters'),
    L('r_tiebreak', 'Tiebreak', 'dr_tennisdress_mint sh_runner_red ht_headband_otters ac_watch_band'),
    L('r_match', 'Match Day', 'tp_jersey_home bt_track_otters sh_sneaker_otters ou_track_black ht_snapback_otters'),
    L('r_studio', 'Studio Hour', 'tp_bball_away bt_leggings_plum ou_coach_otters sh_slide_otters'),
  ],
  'cs:brim': [
    L('b_derby', 'Derby Day', 'ht_fascinator_derby ac_pearls_white ac_clutch_gold ac_gloves_opera ac_earring_drop_sapphire'),
    L('b_riviera', 'The Riviera', 'ht_panama_riviera ac_oversized_havana ac_bucketbag_tan ac_watch_gold'),
    L('b_gent', 'City Gent', 'ht_fedora_charcoal ac_ascot_claret ac_briefcase_chestnut ac_browline_black ac_gloves_driving'),
    L('b_leftbank', 'Left Bank', 'ht_beret_claret ac_stripescarf_red ac_cateye_tortoise ac_crossbody_tan ac_earring_hoop_gold'),
  ],
  'cs:lantern': [
    L('l_blockprint', 'Block Print Day', 'dr_patchwork_indigo ht_kerchief_marigold ac_bundle_indigo sh_clog_red', Object.assign({ note: 'Every patch printed at the big table. New this year, and every piece is sold on its own.' }, SIG)),
    L('l_studio', 'Studio Hours', 'tp_tee_splash bt_flare_rust sh_mule_mustard ht_tam_earth ac_tote_marigold'),
    L('l_meadow', 'Meadow Walk', 'dr_prairie_floral sh_clog_green ou_cape_moss ht_sunhat_garden'),
    L('l_saffron', 'Saffron Market', 'tp_tunic_saffron bt_wrapskirt_floral sh_sandal_brown ac_basket_market'),
    L('l_allotment', 'Allotment Saturday', 'tp_star_stamp bt_wide_olive sh_espadrille_cream ou_denim_embroid ac_stripescarf_indigo'),
  ],
  /* ---- the shops that were already in town ---- */
  clothing: [
    L('c_breton', 'Weekend Breton', 'tp_breton_navy bt_chinos_navy sh_canvas_navy ou_chore_indigo ac_watch_navy'),
    L('c_pleats', 'Pleats and Flats', 'dr_pleatmidi_navy sh_flat_black ou_cardi_breton'),
    L('c_ninefive', 'Nine to Five', 'tp_shirt_mint bt_pencil_camel sh_pump_navy ou_blazer_check'),
    L('c_sage', 'Sage Saturday', 'tp_sshirt_sage bt_skirt_denim sh_boot_black'),
    L('c_mod', 'Mod Teal', 'dr_shift_teal sh_mule_black'),
  ],
  'pub:12': [
    L('p_emerald', 'Emerald Evening', 'tp_blouse_jade bt_slitskirt_emerald sh_loafer_gold ac_earring_stud_pearl'),
    L('p_ivory', 'Ivory Power', 'dr_blazerdress_cream sh_tallboot_brown ac_earring_stud_ruby'),
    L('p_cornflower', 'Cornflower Cocktail', 'dr_cocktail_blue sh_flat_gold ou_bolero_gold'),
    L('p_garden', 'Garden Party', 'tp_peplum_emerald bt_midi_sage sh_slingback_black'),
    L('p_gala', 'Gilded Gala', 'dr_gown_gold sh_heel_nude ou_tux_ivory'),
  ],
  'pub:44': [
    L('v_grandad', 'Grandad\'s Cardigan', 'tp_cardi_mustard bt_longskirt_denim sh_clog_blue ht_bowler_brown'),
    L('v_commute', 'Colour-Block Commute', 'dr_jumpsuit_colorblock sh_skate_brown ht_tam_greyscale ac_neckphones_mint'),
    L('v_flower', 'Flower Power', 'tp_band_symph bt_flare_floral sh_cowboy_tan ac_beads_turquoise'),
    L('v_rodeo', 'Rodeo Summer', 'tp_bowl_teal bt_cutoffs_pink sh_cowboyboot_black ac_earring_hoop_neon'),
  ],
  'mall:thread': [
    L('mt_black', 'All Black Basics', 'tp_cami_black bt_longskirt_black sh_boot_brown'),
    L('mt_sofa', 'Sofa Sunday', 'dr_tracksuit_grey sh_slipper_navy ou_cardi_grey ht_slouch_grey'),
    L('mt_candy', 'Candy Pop', 'tp_long_candy bt_cargo_black sh_combat_black ou_bomber_cyan ac_socks_pink'),
    L('mt_stone', 'Stone and Chalk', 'tp_henley_stone bt_skirt_black sh_canvas_white ac_stripescarf_red'),
  ],
  'mall:kicks': [
    L('k_courtside', 'Courtside', 'tp_graphic_volt bt_track_black sh_hightop_white ou_wind_court ht_bucket_black'),
    L('k_grass', 'Grass Court', 'dr_tennisdress_white sh_slide_black'),
    L('k_soleclub', 'Sole Club', 'tp_star_sole bt_joggers_black sh_canvashi_red ht_trucker_soleclub'),
  ],
  'mall:bloom': [
    L('bl_spotlight', 'Spotlight', 'tp_crop_gold bt_miniskirt_black sh_strappy_black'),
    L('bl_cherry', 'Cherry Cocktail', 'dr_cocktail_red sh_slingback_cream ac_tights_wine'),
    L('bl_jet', 'Jet Set', 'dr_cocktail_black sh_bootie_snake ou_bolero_sapph ac_tights_smoke'),
  ],
  gym: [
    L('g_legday', 'Leg Day', 'tp_retro_otters bt_bikeshorts_black sh_runner_black ht_headband_otters'),
    L('g_trail', 'Trail Before Work', 'tp_coll_park bt_joggers_olive sh_runner_orange ou_fleece_orange ht_cap_olive'),
    L('g_court', 'Court Session', 'tp_bball_black bt_tennisskirt_navy sh_runner_blue ht_visor_court ac_socks_marl'),
  ],
  arena: [
    L('a_home', 'Home Game', 'tp_jersey_home bt_sweats_otters sh_sneaker_otters ht_cap_otters'),
    L('a_letterman', 'The Letterman', 'dr_tracksuit_navy sh_runner_black ou_varsity_black ac_watch_band'),
    L('a_warmup', 'Warm-Up', 'tp_crop_studio bt_leggings_stripe sh_runner_red ou_wind_otters'),
  ],
  hotel: [
    L('ho_tea', 'Tea at Two', 'tp_waist_cream bt_trumpet_navy sh_heel_nude ht_fascinator_black ac_clutch_gold'),
    L('ho_cocktail', 'Cocktail Hour', 'dr_cocktail_red sh_heel_black ou_kimono_jade ac_choker_wine'),
    L('ho_ballroom', 'Ballroom', 'tp_blouse_champ bt_bubble_gold sh_slingback_black ou_cape_midnight'),
  ],
  market: [
    L('m_indigo', 'Indigo Dip', 'tp_vneck_dip bt_culottes_mustard sh_bootie_mustard ht_beret_black ac_beads_wood'),
    L('m_picnic', 'Picnic Blanket', 'dr_sundress_dots sh_gladiator_tan ht_floppy_tan ac_basket_dark'),
    L('m_ringer', 'Thrift Ringer', 'tp_ringer_mustard bt_skater_dots sh_canvashi_cream ou_track_vintage'),
  ],
};
export const LOOK_BY_ID = {};
const PIECES = {};
for (const shop in OUTFITS) { PIECES[shop] = new Set(); for (const l of OUTFITS[shop]) { l.shop = shop; LOOK_BY_ID[l.id] = l; for (const id of l.pieces) PIECES[shop].add(id); } }
/** is this piece part of one of the shop's looks (then it never rotates out) */
export const lookPiece = (id, shop) => !!(PIECES[shop] && PIECES[shop].has(id));
/** the shop's looks offered in a season (all of them when season is undefined) */
export const looksFor = (shop, season) => (OUTFITS[shop] || []).filter(l => season === undefined || !l.season || l.season.includes(season));
/** validation: returns a list of problems */
export function checkOutfits(PIECE_BY_ID, SHOPS) {
  const errs = [], seen = new Set();
  for (const shop in OUTFITS) {
    if (!SHOPS[shop]) { errs.push(`outfits: unknown shop ${shop}`); continue; } const list = OUTFITS[shop];
    if (list.length < 3 || list.length > 6) errs.push(`outfits: ${shop} has ${list.length} looks (3 to 6 wanted)`);
    for (let s = 0; s < 4; s++) if (looksFor(shop, s).length < 3) errs.push(`outfits: ${shop} has fewer than 3 looks in season ${s}`);
    const part = !!PARTIAL[shop];
    for (const l of list) {
      if (!l.id || seen.has(l.id)) errs.push(`outfits: duplicate or missing look id ${l.id}`); seen.add(l.id); if (!l.name) errs.push(`outfits: ${l.id} has no name`);
      const slots = {};
      for (const id of l.pieces) {
        const p = PIECE_BY_ID[id]; if (!p) { errs.push(`outfits: ${l.id} references missing piece ${id}`); continue; }
        if (!p.shops.includes(shop)) errs.push(`outfits: ${l.id}: ${id} is not sold at ${shop}`); if (p.online) errs.push(`outfits: ${l.id}: ${id} is a catalogue exclusive`);
        const k = p.slot === 'acc' ? 'acc:' + p.kind : p.slot; if (slots[k]) errs.push(`outfits: ${l.id} has two pieces for ${k}`); slots[k] = 1;
        if (p.season !== null && p.season !== undefined) { const ps = [].concat(p.season); if (!l.season || l.season.some(s => !ps.includes(s))) errs.push(`outfits: ${l.id}: ${id} is seasonal (${ps}) but the look is offered in ${l.season || 'every season'}`); }
      }
      if (part) { if (l.pieces.length < 3) errs.push(`outfits: ${l.id} (a set) needs at least 3 pieces`); continue; }
      if (!(slots.dress || (slots.top && slots.bottom))) errs.push(`outfits: ${l.id} needs a top and a bottom, or a dress`); if (slots.dress && slots.top) errs.push(`outfits: ${l.id} has a dress and a top`);
      if (!slots.shoes) errs.push(`outfits: ${l.id} has no shoes`);
    }
  }
  return errs;
}
