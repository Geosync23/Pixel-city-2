// Catalogue: TOPS and OUTERWEAR (artist A). Declare pieces with piece() — rules, brands and fields in clothes_brands.js; guide in docs/reports/clothes_drawing.md.
// Rows are hand-written tables, one piece per line:  id | shape | name | styles | warmth | c | c2 | accent | pattern | flags
//   '@brand' starts a brand's block. flags: on = online-only (Closet app), s1 = summer stock only (s23 = autumn + winter, etc.), in=#hex = shirt colour under a waistcoat.
// Ids are permanent once released (saves hold them): add rows, never rename or delete one.
import { piece } from './clothes_brands.js';
const P = piece;

function table(slot, src) {
  const pre = slot === 'top' ? 'tp_' : 'ou_', out = []; let brand = null;
  for (const raw of src.split('\n')) {
    const l = raw.trim(); if (!l || l.startsWith('//')) continue;
    if (l[0] === '@') { brand = l.slice(1).trim(); continue; }
    const [id, shape, name, styles, w, c, c2, acc, pat, flags] = l.split('|').map(s => (s || '').trim());
    const o = { id: pre + id, slot, shape, name, brand, styles: styles.split(',').map(s => s.trim()), warmth: +w, c };
    if (c2) o.c2 = c2; if (acc) o.accent = acc; if (pat) o.pat = pat;
    for (const f of (flags || '').split(/\s+/).filter(Boolean)) {
      if (f === 'on') o.online = true; else if (f.startsWith('in=')) o.inner = f.slice(3);
      else if (/^s\d+$/.test(f)) o.season = f.length > 2 ? f.slice(1).split('').map(Number) : +f.slice(1);
    }
    out.push(P(o));
  }
  return out;
}

/* ------------------------------------------------------------------ TOPS ------------------------------------------------------------------ */
const TOP_ROWS = `
@maple_basics
tee_grey        | tee | Everyday Tee, Heather Grey | casual | 1 | #b8bcc4
tee_navy        | tee | Everyday Tee, Faded Navy | casual | 1 | #4a5a80
tee_black       | tee | Everyday Tee, Washed Black | casual,street | 1 | #3a3842
tee_pink        | tee | Everyday Tee, Faded Pink | casual | 1 | #e8a8a8
tee_sage        | tee | Everyday Tee, Sage | casual | 1 | #a8b890
tee_dustyblue   | tee | Everyday Tee, Dusty Blue | casual | 1 | #8aa8c8
tee_butter      | tee | Everyday Tee, Butter | casual,summer | 1 | #f0dca0
long_oat        | long | Easy Long Sleeve, Oat | casual | 2 | #ead9b8
long_charcoal   | long | Easy Long Sleeve, Charcoal | casual | 2 | #55555f
long_olive      | long | Easy Long Sleeve, Washed Olive | casual | 2 | #7f8758
tank_white      | tank | Rib Tank, White | casual,summer | 0 | #f4f0e8
tank_black      | tank | Rib Tank, Black | casual,summer | 0 | #3a3842
tank_grey       | tank | Rib Tank, Grey Marl | casual,sporty | 0 | #b8bcc4
vneck_marl      | vneck | Soft V-Neck, Grey Marl | casual | 1 | #a8acb4
vneck_rose      | vneck | Soft V-Neck, Faded Rose | casual | 1 | #d89a9a
henley_stone    | henley | Plain Henley, Stone | casual | 2 | #c8c0b0
henley_slate    | henley | Plain Henley, Slate Blue | casual | 2 | #5a6a8a
sweater_grey    | sweater | Crew Jumper, Grey | casual,cozy | 3 | #9aa0a8
sweater_plum    | sweater | Crew Jumper, Faded Plum | casual,cozy | 3 | #8a6a80
hoodie_grey     | hoodie | Pullover Hoodie, Grey | casual,cozy | 2 | #a0a4ac
hoodie_black    | hoodie | Pullover Hoodie, Black | casual,street | 2 | #33303f
crop_white      | crop | Basic Crop Tee, White | casual,summer | 0 | #f4f0e8
crop_lilac      | crop | Basic Crop Tee, Lilac | casual,summer | 0 | #c8b8e0
cami_black      | cami | Jersey Cami, Black | casual,summer | 0 | #3a3842
cami_mauve      | cami | Jersey Cami, Mauve | casual,summer | 0 | #b08098
polo_navy       | polo | Pique Polo, Navy | casual,smart | 1 | #3a4a72
polo_white      | polo | Pique Polo, White | casual,smart | 1 | #f4f0e8
turtle_black    | turtleneck | Plain Roll-Neck, Black | casual,smart | 2 | #33303f
cardi_oat       | cardigan | Plain Cardigan, Oat | casual,cozy | 2 | #ead9b8
raglan_plain    | raglan | Plain Raglan, Grey & Navy | casual,sporty | 1 | #b8bcc4 | #3a4a72
long_white      | long | Easy Long Sleeve, White | casual | 2 | #f4f0e8

@thread_co
breton_red      | long | Mariner Breton, Ecru & Red | casual,smart | 2 | #f4f0e8 | #d9483b | | stripes
stripe_navy     | stripe | Sailing Stripe Tee, Navy | casual | 1 | #2f3f72
stripe_green    | stripe | Sailing Stripe Tee, Green | casual | 1 | #3f7a58
shirt_white     | shirt | Weekday Oxford, White | smart,work | 2 | #f8f8f4
shirt_pink      | shirt | Weekday Oxford, Pink | smart,work | 2 | #f2c4c4
shirt_mint      | shirt | Weekday Oxford, Mint | smart,work | 2 | #b8e0c0
shirt_gingblue  | shirt | Picnic Gingham Shirt, Blue | smart,casual | 2 | #f4f0e8 | #3b6fd0 | | check
shirt_gingred   | shirt | Picnic Gingham Shirt, Red | casual,smart | 2 | #f4f0e8 | #d9483b | | check
shirt_bengal    | shirt | Bengal Stripe Shirt | smart,work | 2 | #f4f0e8 | #5a7ab8 | | vstripes
sshirt_chambray | shortshirt | Short-Sleeve Shirt, Chambray | casual,summer | 1 | #8aa8c8
sshirt_sage     | shortshirt | Short-Sleeve Shirt, Sage | casual,summer | 1 | #b8c8a0
polo_green      | polo | Club Polo, Racing Green | smart,casual | 1 | #2f6a48
polo_burgundy   | polo | Club Polo, Burgundy | smart,casual | 1 | #7a2838
polo_sky        | polo | Club Polo, Sky | smart,casual | 1 | #9ac8e8
polo_regatta    | polo | Regatta Stripe Polo | casual,smart | 1 | #2f3f72 | #f4f0e8 | | stripes
rugby_navy      | rugby | Campus Rugby Shirt, Navy & Gold | casual,sporty | 2 | #2f3f72 | #e8b83a
rugby_green     | rugby | Campus Rugby Shirt, Green & Cream | casual,sporty | 2 | #3f6a48 | #f4f0e8
blouse_white    | blouse | Office Blouse, White | smart,work | 1 | #f8f8f4
blouse_powder   | blouse | Office Blouse, Powder Blue | smart,work | 1 | #c8d8f0
vneck_navy      | vneck | Merino V-Neck, Navy | smart,work | 2 | #2f3f72
henley_stripe   | henley | Striped Henley, Oat & Navy | casual | 2 | #ead9b8 | #4a5a80 | | stripes
qzip_navy       | quarterzip | Weekend Quarter-Zip, Navy | smart,casual | 3 | #2f3f72
qzip_grey       | quarterzip | Weekend Quarter-Zip, Grey & Navy | smart,casual | 3 | #9aa0a8 | #2f3f72
ringer_navy     | ringer | Classic Ringer Tee, White & Navy | casual | 1 | #f4f0e8 | #2f3f72
retro_seaside   | retroband | Seaside Chest-Stripe Tee | casual,summer | 1 | #f4f0e8 | #2f3f72 | #d9483b
sweater_harbour | sweater | Harbour Stripe Jumper | casual,cozy | 3 | #f4f0e8 | #2f3f72 | | stripes
cardi_navy      | cardigan | Fine-Gauge Cardigan, Navy | smart,work | 2 | #2f3f72
bowb_ivory      | bowblouse | Office Bow Blouse, Ivory & Navy | smart,work | 1 | #f4f0e8 | | #2f3f72
tief_gingham    | tiefront | Picnic Tie-Front Shirt, Red Gingham | summer,casual | 0 | #f4f0e8 | #d9483b | | check | s1
mandarin_white  | mandarin | Band-Collar Shirt, White | smart,casual | 2 | #f8f8f4 | #9aa0a8

@marigold
peplum_emerald  | peplum | Gilded Peplum Blouse, Emerald | smart,party | 1 | #2f7a5a
peplum_ruby     | peplum | Gilded Peplum Blouse, Ruby | party,smart | 1 | #a02848
bowb_gold       | bowblouse | Silk Bow Blouse, Ivory & Gold | smart,formal | 1 | #f6ead0 | | #d8b048
bowb_sapphire   | bowblouse | Silk Bow Blouse, Sapphire | formal,smart | 1 | #2f4fa0 | | #f6ead0
bowb_blush      | bowblouse | Silk Bow Blouse, Blush & Wine | smart,formal | 1 | #f2c4c4 | | #8a2f3a
blouse_champ    | blouse | Charmeuse Blouse, Champagne | formal,smart | 1 | #f0e0c0
blouse_jade     | blouse | Charmeuse Blouse, Jade | formal,party | 1 | #3f8a6a
cami_gold       | cami | Satin Cami, Gold | party,formal | 0 | #d8b048
cami_ivory      | cami | Satin Cami, Ivory | formal,party | 0 | #f6ead0
turtle_camel    | turtleneck | Cashmere Roll-Neck, Camel | smart,cozy | 3 | #c8a070
turtle_plum     | turtleneck | Cashmere Roll-Neck, Plum | smart,cozy | 3 | #6a3a5a
mand_jade       | mandarin | Jade Mandarin Blouse | formal,smart | 1 | #2f7a5a | #d8b048
mand_ivory      | mandarin | Ivory Mandarin Blouse | formal,smart | 1 | #f6ead0 | #8a2f3a
onesh_emerald   | oneshoulder | Riviera One-Shoulder, Emerald | party,formal | 0 | #2f7a5a
onesh_gold      | oneshoulder | Riviera One-Shoulder, Gold Sparkle | party,formal | 0 | #d8b048 | | | sparkle
waist_cream     | waistcoat | Gilded Waistcoat, Cream | formal,smart | 2 | #f0e0c0 | #d8b048 | | | in=#f8f8f4
offsh_ivory     | offshoulder | Bardot Top, Ivory | party,summer | 0 | #f6ead0

@hollowell
shirt_lavender  | shirt | Poplin Dress Shirt, Lavender | smart,formal | 2 | #c0b0e0
shirt_pinnavy   | shirt | Poplin Dress Shirt, Navy Pinstripe | formal,work | 2 | #2f3f72 | | | pinstripe
shirt_charcoal  | shirt | Poplin Dress Shirt, Charcoal | formal,smart | 2 | #4a4a58
shirt_butter    | shirt | Poplin Dress Shirt, Butter | smart,work | 2 | #f0dc90
waist_charcoal  | waistcoat | Three-Piece Waistcoat, Charcoal | formal,work | 2 | #4a4a58 | | | | in=#f8f8f4
waist_pinnavy   | waistcoat | Three-Piece Waistcoat, Navy Pinstripe | formal,work | 2 | #2f3f72 | | | pinstripe | in=#9ac8e8
waist_camel     | waistcoat | Waistcoat, Camel | smart,formal | 2 | #c8a070 | #6a4428 | | | in=#f8f8f4
waist_tweed     | waistcoat | Tweed Waistcoat | smart,vintage | 2 | #8a6a48 | #c8a070 | | plaid | in=#f0e8d8
svest_charcoal  | sweatervest | Lambswool Slipover, Charcoal | smart,work | 2 | #4a4a58
svest_camel     | sweatervest | Lambswool Slipover, Camel | smart,work | 2 | #c8a070
turtle_navy     | turtleneck | Merino Roll-Neck, Navy | smart,formal | 3 | #2f3f72
turtle_greymarl | turtleneck | Merino Roll-Neck, Grey Marl | smart,formal | 3 | #9aa0a8
polo_camel      | polo | Clubhouse Knit Polo, Camel | smart | 2 | #c8a070
mand_charcoal   | mandarin | Grandad-Collar Shirt, Charcoal | smart,formal | 2 | #4a4a58 | #2a2833
qzip_charcoal   | quarterzip | Merino Quarter-Zip, Charcoal | smart,work | 3 | #4a4a58 | #9aa0a8
shirt_burgundy  | shirt | Poplin Dress Shirt, Burgundy | formal,party | 2 | #7a2838

@nightjar
halter_black    | halterneck | Last Dance Halter, Black Sparkle | party | 0 | #2a2833 | | | sparkle
halter_silver   | halterneck | Last Dance Halter, Silver | party | 0 | #c8ccd4
bust_black      | bustier | Velvet Bustier, Black & Plum | party | 0 | #2a2833 | #6a3a5a | #c8ccd4
bust_plum       | bustier | Velvet Bustier, Plum | party | 0 | #6a3a5a | #2a2833 | #d8b048
bust_red        | bustier | Velvet Bustier, Lipstick Red | party | 0 | #b02838 | #2a2833 | #2a2833
cami_sparkle    | cami | Sequin Cami, Black | party | 0 | #2a2833 | | | sparkle
cami_lame       | cami | Lame Cami, Silver | party | 0 | #c8ccd4 | | | sparkle
tube_black      | tubetop | Disco Tube Top, Black Sparkle | party,summer | 0 | #2a2833 | | | sparkle
tube_pink       | tubetop | Disco Tube Top, Hot Pink | party,summer | 0 | #e84aa8
onesh_plum      | oneshoulder | Encore One-Shoulder, Plum Sparkle | party | 0 | #6a3a5a | | | sparkle
onesh_black     | oneshoulder | Encore One-Shoulder, Black | party | 0 | #2a2833
crop_gold       | crop | Spotlight Crop, Gold Sequin | party | 0 | #d8b048 | | | sparkle
offsh_black     | offshoulder | Velvet Off-Shoulder, Black | party,formal | 1 | #2a2833
offsh_wine      | offshoulder | Velvet Off-Shoulder, Wine | party,formal | 1 | #8a2f3a
cami_leopard    | cami | Wild Night Cami, Leopard | party,street | 0 | #c89a5a | | | leopard
blouse_black    | blouse | After-Hours Blouse, Black | party,smart | 1 | #2a2833
star_nightjar   | startee | Nightjar Star Tee | party,street | 1 | #2a2833 | | #c8ccd4
bust_silver     | bustier | Mirrorball Bustier | party | 0 | #c8ccd4 | #2a2833 | #e84aa8 | sparkle

@otterline
raglan_navy     | raglan | Practice Raglan, Grey & Navy | sporty,casual | 1 | #9aa0a8 | #2f3f72
jersey_home     | jersey | Otters Home Jersey | sporty,street | 1 | #d2392f | | #f4f0e8
jersey_away     | jersey | Otters Away Jersey | sporty,street | 1 | #f4f0e8 | | #d2392f
bball_home      | bball | Otters Court Jersey, Home Red | sporty,street | 0 | #d2392f | #f4f0e8 | #2a2833
bball_away      | bball | Otters Court Jersey, Away Cream | sporty,street | 0 | #f4f0e8 | #d2392f | #2a2833
bball_black     | bball | Otters Court Jersey, Blackout | sporty,street | 0 | #2a2833 | #d2392f | #f4f0e8
hockey_otters   | hockey | Otters Ice Jersey | sporty,winter | 2 | #d2392f | #f4f0e8 | #2a2833
hockey_classic  | hockey | Otters Winter Classic Jersey | sporty,winter | 2 | #f4f0e8 | #d2392f | #2f3f72 | | s3
racer_black     | racerback | Sprint Racerback, Black & Red | sporty | 0 | #2a2833 | #d2392f
racer_aqua      | racerback | Sprint Racerback, Aqua | sporty,summer | 0 | #3fb8a8 | #f4f0e8
tank_otters     | tank | Otters Practice Tank | sporty | 0 | #d2392f
graphic_ollie   | graphic | Ollie the Otter Tee | sporty,casual | 1 | #d2392f | | #f4f0e8
ringer_otters   | ringer | Otters Ringer Tee | casual,sporty | 1 | #f4f0e8 | #d2392f
coll_red        | collegiate | Otters Crewneck, Red | sporty,casual | 2 | #d2392f | #f4f0e8
coll_cream      | collegiate | Otters Crewneck, Cream | sporty,casual | 2 | #f4f0e8 | #d2392f
hoodie_otters   | hoodie | Otters Pullover Hoodie | sporty,casual | 2 | #d2392f
hoodie_cobalt   | hoodie | Training Hoodie, Cobalt | sporty | 2 | #3b6fd0
zhood_otters    | ziphoodie | Otters Zip Hoodie, Cream | sporty,casual | 2 | #f4f0e8
qzip_bench      | quarterzip | Bench Quarter-Zip, Black & Red | sporty | 3 | #2a2833 | #d2392f
tee_volt        | tee | Dri-Pace Tee, Volt | sporty | 1 | #c8e04a
tee_cobalt      | tee | Dri-Pace Tee, Cobalt | sporty | 1 | #3b6fd0
crop_studio     | crop | Studio Crop, Black | sporty | 0 | #2a2833
retro_otters    | retroband | Otters Retro Stripe Tee | sporty,casual | 1 | #f4f0e8 | #d2392f | #2f3f72
long_base       | long | Base Layer, Black | sporty,winter | 2 | #2a2833
rugby_otters    | rugby | Otters Rugby Shirt | sporty,casual | 2 | #d2392f | #f4f0e8

@kicks_lab
star_sole       | startee | Sole Club Star Tee | street,sporty | 1 | #f4f0e8 | | #e84a3a
retro_lab       | retroband | Lab Stripe Tee, Black & Cyan | street | 1 | #2a2833 | #f4f0e8 | #3fd0e0
coll_lab        | collegiate | Lab Crewneck, Black & Volt | street,casual | 2 | #2a2833 | #c8e04a
hoodie_sail     | hoodie | Drop Hoodie, Sail | street | 2 | #e8e2d4
graphic_volt    | graphic | Box Logo Tee, Volt | street | 1 | #c8e04a | | #2a2833
ringer_court    | ringer | Court Ringer Tee, Green | street,sporty | 1 | #f4f0e8 | #2f9a5a
bball_lab       | bball | Lab Mesh Jersey, Teal | street,sporty | 0 | #2f9a94 | #f4f0e8 | #f2c230 | | on
hoodie_volt     | hoodie | Drop Hoodie, Volt | street,sporty | 2 | #b8d040 | | | | on

@pixelpop
tdye_acid       | tee | Acid Bloom Tie-Dye Tee | street,artsy | 1 | #e8c83a | #3fb8a8 | #f08ab0 | tiedye
tdye_space      | tee | Deep Space Tie-Dye Tee | street,artsy | 1 | #2a2833 | #7a55c8 | #3fd0e0 | tiedye
band_neontide   | bandtee | Neon Tide Tour Tee | street,party | 1 | #2a2833 | #3fd0e0 | #e84aa8
band_gullwings  | bandtee | The Gullwings Tour Tee | street,casual | 1 | #2a2833 | #f4f0e8 | #f09a3a
band_brass      | bandtee | Brass Parade Tour Tee | street,party | 1 | #8a55c8 | #f4f0e8 | #f2c230
star_yellow     | startee | Superstar Tee, Black & Yellow | street | 1 | #2a2833 | | #f2c230
star_pink       | startee | Superstar Tee, Pink & Cyan | street | 1 | #f08ab0 | | #3fd0e0
graphic_heart   | graphic | Pixel Heart Tee | street,artsy | 1 | #2a2833 | | #e84a6a
graphic_arcade  | graphic | Arcade Tee, Cyan | street | 1 | #3fd0e0 | | #2a2833
retro_glitch    | retroband | Glitch Band Tee | street | 1 | #2a2833 | #e84aa8 | #3fd0e0
cblock_tee      | tee | Split Tee, Orange & Navy | street,casual | 1 | #f09a3a | #2f3f72 | | colorblock
cblock_long     | long | Split Long Sleeve, Lime & Purple | street | 2 | #9ac84a | #7a55c8 | | colorblock
crop_cyber      | crop | Cyber Crop, Cyan | street,party | 0 | #3fd0e0
crop_checker    | crop | Checkerboard Crop | street | 0 | #2a2833 | #f4f0e8 | | check
hoodie_pink     | hoodie | Pop Hoodie, Hot Pink | street | 2 | #e84aa8
hoodie_melt     | hoodie | Melt Tie-Dye Hoodie | street,artsy | 2 | #7a55c8 | #f08ab0 | #f2c230 | tiedye
zhood_static    | ziphoodie | Static Zip Hoodie | street | 2 | #2a2833 | | #3fd0e0
coll_lilac      | collegiate | Pixelpop Crewneck, Lilac | street,casual | 2 | #b8a8e0 | #2a2833
tank_skate      | tank | Skate Tank, Yellow | street,summer | 0 | #f2c230
long_candy      | long | Candy Stripe Long Sleeve | street,artsy | 2 | #f08ab0 | #f4f0e8 | | stripes
jersey_pop      | jersey | Pixelpop Jersey, Black & Cyan | street,sporty | 1 | #2a2833 | | #3fd0e0
tee_checkmate   | tee | Checkmate Tee | street | 1 | #f4f0e8 | #2a2833 | | check
vneck_zigzag    | vneck | Zigzag V-Neck | street,artsy | 1 | #f09a3a | #2f9a94 | | chevron
sweat_camo      | sweater | Pixel Camo Sweatshirt | street | 3 | #7a55c8 | | | camo
star_glow       | startee | Glow Star Tee | street,party | 1 | #2f3f72 | | #c8f04a | | on
band_neonpink   | bandtee | Neon Tide Tour Tee, Pink Edition | street,party | 1 | #e84aa8 | #2a2833 | #3fd0e0 | | on
tube_cblock     | tubetop | Colour-Pop Tube Top | street,summer | 0 | #3fd0e0 | #f09a3a | | colorblock

@second_wind
flannel_red     | flannel | Lumberyard Flannel, Red | vintage,casual | 2 | #b83a3a | | | | s2
flannel_green   | flannel | Thrifted Flannel, Green | vintage,casual | 2 | #3f6a48 | | | | s2
flannel_brown   | flannel | Old Mill Flannel, Brown | vintage,casual | 2 | #7a5238
bowl_teal       | bowling | Strike Bowling Shirt, Teal & Cream | vintage,party | 1 | #2f9a94 | #f4f0e8 | #e8b83a
bowl_black      | bowling | Lanes Bowling Shirt, Black & Red | vintage,street | 1 | #2a2833 | #c83a3a | #f4f0e8
bowl_mint       | bowling | Bowl-O-Rama Shirt, Mint & Brown | vintage,casual | 1 | #a8d8c0 | #7a5238 | #f4f0e8
west_denim      | western | Rodeo Western Shirt, Denim | vintage,casual | 2 | #6a88b8 | #f4f0e8
west_brown      | western | Pearl Snap Western, Brown | vintage | 2 | #8a6038 | #e8d8b0
ringer_mustard  | ringer | Thrift Ringer, Mustard & Brown | vintage,casual | 1 | #e8d8a0 | #8a5a30
band_gull09     | bandtee | Gullwings '09 Tour Tee, Faded | vintage,street | 1 | #5a5a68 | #e8d8b0 | #e8784a
band_symph      | bandtee | Symphony Hall Season Tee | vintage,artsy | 1 | #f0e6d0 | #2f3f72 | #8a2f3a
rugby_oldboys   | rugby | Old Boys Rugby Shirt | vintage,sporty | 2 | #7a2838 | #e8d8a0
cardi_mustard   | cardigan | Grandad Cardigan, Mustard | vintage,cozy | 2 | #c8a040
svest_argyle    | sweatervest | Thrift Store Argyle Vest | vintage,smart | 2 | #8a6a48 | #e8d8a0 | | argyle
blouse_garden   | blouse | Grandma's Garden Blouse | vintage,artsy | 1 | #e8d8b8 | #c86a6a | #6a8a58 | floral
sshirt_oddbloom | shortshirt | Odd Bloom Camp Shirt | vintage,summer | 1 | #6a5a8a | #e8c8a0 | #d8784a | floral
sweater_moss    | sweater | Moth-Eaten Jumper, Moss | vintage,cozy | 3 | #6a7a4a
turtle_mustard  | turtleneck | Vintage Ribbed Roll-Neck, Mustard | vintage,cozy | 2 | #c8a040
shirt_cord      | shirt | Corduroy Shirt, Tobacco | vintage,casual | 2 | #8a6038
graphic_souv    | graphic | Souvenir Tee, Maple Bay | vintage,casual | 1 | #e8d0a0 | | #3f6a48
coll_88         | collegiate | Maple Bay College '88 Crew | vintage,casual | 2 | #3a5a3a | #e8d8a0
buff_handme     | buffalo | Hand-Me-Down Buffalo Check | vintage,outdoor | 2 | #b83a3a | #2a2833
hawaii_retro    | shortshirt | Tiki Lounge Shirt | vintage,party | 1 | #2a2833 | #e86a5a | #e8c070 | floral
stripe_seventies | stripe | Seventies Stripe Tee, Brown | vintage | 1 | #8a5a30

@juniper_rye
cable_oat       | cableknit | Lighthouse Cable Knit, Oat | cozy,winter | 3 | #ead9b8
cable_rust      | cableknit | Lighthouse Cable Knit, Rust | cozy,winter | 3 | #b8582e
cable_forest    | cableknit | Lighthouse Cable Knit, Forest | cozy,winter | 3 | #3f6a48
fair_navy       | fairisle | Snowfield Fair Isle, Navy | cozy,winter | 4 | #2f3f72 | #f4f0e8 | #d9483b | | s3
fair_oat        | fairisle | Hearthside Fair Isle, Oat | cozy,winter | 4 | #ead9b8 | #7a5238 | #b8582e
fair_forest     | fairisle | Pine Fair Isle, Forest | cozy,winter | 4 | #3f6a48 | #f4f0e8 | #e0b040 | | s3
argyle_rust     | sweater | Argyle Crew, Rust | cozy,smart | 3 | #b8582e | #ead9b8 | | argyle | s2
argyle_forest   | sweater | Argyle Crew, Forest | cozy,smart | 3 | #3f6a48 | #c8a070 | | argyle
svest_oat       | sweatervest | Argyle Slipover, Oat & Rust | cozy,smart | 2 | #ead9b8 | #b8582e | | argyle
turtle_jrust    | turtleneck | Fireside Roll-Neck, Rust | cozy,smart | 3 | #a85030
turtle_forest   | turtleneck | Fireside Roll-Neck, Forest | cozy,smart | 3 | #3f6a48
cardi_jr_rust   | cardigan | Chunky Rib Cardigan, Rust | cozy | 3 | #b8582e
cardi_forest    | cardigan | Chunky Rib Cardigan, Forest | cozy | 3 | #2f5a3a
henley_waffle   | henley | Waffle Henley, Cream | cozy,casual | 2 | #f4eedf
henley_wrust    | henley | Waffle Henley, Rust | cozy,casual | 2 | #b8582e
qzip_shetland   | quarterzip | Shetland Quarter-Zip, Heather | cozy,smart | 3 | #a8a090 | #7a5238
sweater_cranb   | sweater | Chunky Rib Crew, Cranberry | cozy | 3 | #9a2a3a
long_cottage    | long | Cottage Stripe Long Sleeve | cozy,casual | 2 | #ead9b8 | #b8582e | | stripes
cardi_argyle    | cardigan | Argyle Cardigan, Forest | cozy,vintage | 3 | #3f6a48 | #ead9b8 | | argyle
cable_cream     | cableknit | Aran Cable Knit, Cream | cozy,winter | 3 | #f4eedf | | | | s23

@saltline
sailor_white    | sailor | Deckhand Sailor Top, White & Navy | casual,summer | 1 | #f4f0e8 | #2f3f72 | #d9483b
sailor_navy     | sailor | Deckhand Sailor Top, Navy | casual | 1 | #2f3f72 | #f4f0e8 | #d9483b
long_dock       | long | Dock Stripe Long Sleeve | casual,work | 2 | #e8e0d0 | #3a5a7a | | stripes
gansey_navy     | sweater | Gansey Jumper, Navy | work,winter | 3 | #2a3a5a
gansey_yellow   | sweater | Gansey Jumper, Slicker Yellow | work,rain | 3 | #e8b83a
henley_work     | henley | Workshop Henley, Navy | work,casual | 2 | #2f3f72
shirt_chambray  | shirt | Chambray Work Shirt | work,casual | 2 | #7a98c0
shirt_canvas    | shirt | Canvas Work Shirt, Tan | work | 2 | #c8b088
qzip_harbour    | quarterzip | Harbour Quarter-Zip, Yellow | work,outdoor | 3 | #e8b83a | #2f3f72
buff_trawler    | buffalo | Trawler Check Shirt, Yellow & Black | work,outdoor | 2 | #e8b83a | #2a2833
tee_teal        | tee | Dockside Tee, Harbour Teal | work,casual | 1 | #2f8a8a
raglan_crew     | raglan | Crew Raglan, White & Navy | casual | 1 | #f4f0e8 | #2f3f72
turtle_fog      | turtleneck | Lighthouse Roll-Neck, Fog | work,cozy | 3 | #b8c0c8
stripe_rope     | stripe | Rope Stripe Tee, Red | casual,summer | 1 | #d9483b
tank_deck       | tank | Deck Tank, Navy | casual,summer | 0 | #2f3f72
mand_salt       | mandarin | Net-Mender's Shirt, Ecru | work,casual | 2 | #e8e0cc | #3a5a7a

@fern_field
qzip_trail      | quarterzip | Trailhead Quarter-Zip, Olive | outdoor | 3 | #6f7a48 | #c86a2e
qzip_ember      | quarterzip | Ember Quarter-Zip | outdoor | 3 | #c86a2e | #4a4a38
buff_campfire   | buffalo | Campfire Buffalo Check | outdoor,casual | 2 | #c86a2e | #3a3830 | | | s2
buff_moss       | buffalo | Moss Buffalo Check | outdoor,casual | 2 | #6f7a48 | #2a2833
flannel_khaki   | flannel | Ridge Flannel, Khaki | outdoor | 2 | #b8a878
henley_olive    | henley | Basecamp Henley, Olive | outdoor,casual | 2 | #6f7a48
long_orange     | long | Merino Base Layer, Burnt Orange | outdoor,sporty | 2 | #c86a2e
graphic_summit  | graphic | Summit Tee, Khaki | outdoor,casual | 1 | #b8a878 | | #3f6a48
star_trail      | startee | Trail Star Tee | outdoor,casual | 1 | #6f7a48 | | #e8c070
racer_trail     | racerback | Trail Run Tank, Orange | sporty,outdoor | 0 | #e0783a | #3a3830
hoodie_ridge    | hoodie | Ridgeline Hoodie, Olive | outdoor,cozy | 2 | #6f7a48
long_camo       | long | Bushcraft Camo Long Sleeve | outdoor | 2 | #6f7a48 | | | camo
sweater_fell    | sweater | Fell Jumper, Khaki | outdoor,cozy | 3 | #b8a878
west_ranch      | western | Ranch Western, Khaki & Olive | outdoor,vintage | 2 | #c8b888 | #6f7a48
coll_park       | collegiate | National Park Crew | outdoor,casual | 2 | #3f6a48 | #e8c070
tee_trek        | tee | Trek Tee, Burnt Orange | outdoor | 1 | #c86a2e
turtle_alpine   | turtleneck | Alpine Roll-Neck, Olive | outdoor,winter | 3 | #6f7a48
fair_alpine     | fairisle | Alpine Fair Isle, Orange | outdoor,winter | 4 | #c86a2e | #f4f0e8 | #3f6a48 | | on
hockey_ridge    | hockey | Pond Hockey Jersey, Olive | outdoor,sporty | 2 | #6f7a48 | #e8c070 | #c86a2e | | on

@little_lantern
peas_marigold   | peasant | Marigold Peasant Blouse | artsy,summer | 1 | #f4f0e8 | #2f3f72 | #e8a030
peas_indigo     | peasant | Indigo Peasant Blouse | artsy | 1 | #2f3f72 | #f4f0e8 | #e8a030
peas_rosehip    | peasant | Rosehip Peasant Blouse | artsy | 1 | #c84a4a | #f4e8d0 | #3f6a48
peas_linen      | peasant | Linen Smock, Natural | artsy,casual | 1 | #e8dcc4 | #b8582e | #2f3f72
tunic_indigo    | tunic | Block-Print Tunic, Indigo | artsy | 1 | #2f3f72 | #ead9b8 | #e8a030 | floral
tunic_saffron   | tunic | Saffron Tunic | artsy,summer | 1 | #e8a030 | | #2f3f72
blouse_wild     | blouse | Wildflower Blouse | artsy,vintage | 1 | #f0e8d8 | #6a8ac8 | #e8a030 | floral | s0
mand_indigo     | mandarin | Indigo Mandarin Shirt | artsy,smart | 2 | #2f3f72 | #e8a030
sshirt_garden   | shortshirt | Garden Party Shirt | artsy,summer | 1 | #3f6a48 | #f0d890 | #e86a6a | floral
tee_splash      | tee | Studio Paint-Splash Tee | artsy | 1 | #f4f0e8 | #2f3f72 | #e8a030 | floral
star_stamp      | startee | Hand-Stamped Star Tee | artsy,casual | 1 | #ead9b8 | | #2f3f72
long_polka      | long | Polka Long Sleeve, Indigo | artsy,vintage | 2 | #2f3f72 | #f4f0e8 | | dots
sweater_hand    | sweater | Hand-Knit Jumper, Indigo Speckle | artsy,cozy | 3 | #2f3f72 | #e8a030 | | dots
cardi_embroid   | cardigan | Embroidered Cardigan | artsy,cozy | 2 | #3a4a7a | #f0d890 | #e86a6a | floral
crop_daisy      | crop | Daisy Crop | artsy,summer | 0 | #f0d890 | #f4f0e8 | #e86a6a | floral
halter_batik    | halterneck | Batik Halter | artsy,summer | 0 | #2f3f72 | #6a8ac8 | #f0d890 | tiedye | s1
offsh_poppy     | offshoulder | Poppy Off-Shoulder | artsy,summer | 0 | #f4f0e8 | #d9483b | #3f6a48 | floral
vneck_dip       | vneck | Indigo Dip V-Neck | artsy | 1 | #f4f0e8 | #2f3f72 | | ombre
band_brassprint | bandtee | Brass Parade Screenprint Tee | artsy,party | 1 | #f0e6d0 | #8a55c8 | #f2c230
tunic_moss      | tunic | Moss Linen Tunic | artsy,casual | 1 | #8a9a68 | | #e8a030

@tidepool
hawaii_lagoon   | shortshirt | Lagoon Aloha Shirt | summer,casual | 0 | #3fb8a8 | #f4f0e8 | #f07a5a | floral | s1
hawaii_sandbar  | shortshirt | Sandbar Aloha Shirt | summer,casual | 0 | #e8d8b0 | #3f8a6a | #f07a5a | floral | s1
tank_aqua       | tank | Beach Tank, Aqua | summer | 0 | #5ac8c8
tank_coral      | tank | Beach Tank, Coral | summer | 0 | #f07a5a
cami_seapink    | cami | Sea Pink Floral Cami | summer | 0 | #f2c4c4 | #f4f0e8 | #3fb8a8 | floral | s1
crop_lemon      | crop | Sunny Crop, Lemon | summer | 0 | #f0e070
crop_lido       | crop | Lido Stripe Crop | summer | 0 | #f4f0e8 | #3fb8a8 | | stripes
tief_coral      | tiefront | Tie-Front Shirt, Coral | summer | 0 | #f07a5a | | | | s1
tief_aqua       | tiefront | Tie-Front Shirt, Aqua Gingham | summer | 0 | #f4f0e8 | #3fb8a8 | | check | s1
halter_coral    | halterneck | Sunset Halter, Coral | summer,party | 0 | #f07a5a
halter_hibiscus | halterneck | Hibiscus Halter | summer,party | 0 | #d9483b | #f4f0e8 | #e8c83a | floral | s1
offsh_seafoam   | offshoulder | Breezy Off-Shoulder, Seafoam | summer | 0 | #a8e0d0
offsh_stripe    | offshoulder | Boardwalk Stripe Off-Shoulder | summer | 0 | #f4f0e8 | #2f6ab0 | | stripes
tube_aqua       | tubetop | Bandeau, Aqua | summer | 0 | #3fb8a8 | | | | s1
tube_coral      | tubetop | Bandeau, Coral Stripe | summer | 0 | #f07a5a | #f4f0e8 | | stripes | s1
ringer_surf     | ringer | Surf Ringer, Sand & Aqua | summer,casual | 1 | #e8d8b0 | #3fb8a8
star_starfish   | startee | Starfish Tee | summer,casual | 1 | #5ac8c8 | | #f07a5a
graphic_wave    | graphic | Wave Tee | summer,casual | 1 | #f4f0e8 | | #3fb8a8
retro_lifeguard | retroband | Lifeguard Stripe Tee | summer,sporty | 1 | #d9483b | #f4f0e8 | #e8c83a
racer_swim      | racerback | Swim Club Racerback | summer,sporty | 0 | #3fb8a8 | #f07a5a
vneck_linen     | vneck | Linen V-Neck, Sand | summer,casual | 1 | #e0d0a8
sailor_pier     | sailor | Pier Sailor Top, Aqua | summer,casual | 1 | #f4f0e8 | #3fb8a8 | #f07a5a
tdye_seafoam    | tee | Seafoam Tie-Dye Tee | summer,artsy | 1 | #5ac8c8 | #f4f0e8 | #f08ab0 | tiedye | s1

@lacquer
cami_ruby       | cami | Jewel Satin Cami, Ruby | party,formal | 0 | #a02848
cami_sapphire   | cami | Jewel Satin Cami, Sapphire | party,formal | 0 | #2f4fa0
bust_gilt       | bustier | Gilt Bustier | party,formal | 0 | #2a2833 | #d8b048 | #d8b048
bowb_lacquer    | bowblouse | Lacquer Bow Blouse, Black & Gold | formal,smart | 1 | #2a2833 | | #d8b048
turtle_ruby     | turtleneck | Gloss Roll-Neck, Ruby | smart,party | 2 | #a02848
onesh_pearl     | oneshoulder | Pearl One-Shoulder | formal,party | 0 | #f0ece0
`;

/* ---------------------------------------------------------------- OUTERWEAR --------------------------------------------------------------- */
const OUTER_ROWS = `
@maple_basics
hoodie_navy     | hoodie | Open Hoodie, Navy | casual,cozy | 2 | #3a4a72
hoodie_heather  | hoodie | Open Hoodie, Heather | casual,cozy | 2 | #b8bcc4
zhood_black     | ziphoodie | Everyday Zip Hoodie, Black | casual,street | 2 | #33303f
zhood_grey      | ziphoodie | Everyday Zip Hoodie, Grey | casual | 2 | #9aa0a8
cardi_grey      | cardigan | Everyday Cardigan, Grey | casual,cozy | 2 | #9aa0a8
cardi_navy      | cardigan | Everyday Cardigan, Navy | casual,cozy | 2 | #3a4a72
cardi_oat       | cardigan | Everyday Cardigan, Oat | casual,cozy | 2 | #ead9b8
fleece_grey     | fleece | Everyday Fleece, Grey | casual,outdoor | 3 | #9aa0a8 | #6a6e78
fleece_navy     | fleece | Everyday Fleece, Navy | casual,outdoor | 3 | #3a4a72 | #2a3050
wind_black      | windbreaker | Packable Windbreaker, Black | casual,rain | 1 | #33303f | #5a5a68
gilet_black     | gilet | Puffer Gilet, Black | casual,winter | 2 | #33303f
jacket_khaki    | jacket | Everyday Jacket, Khaki | casual | 2 | #b8a878
rain_black      | raincoat | Everyday Rain Jacket, Black | rain,casual | 2 | #33303f
anorak_grey     | anorak | Everyday Anorak, Grey | casual,rain | 2 | #9aa0a8
puffer_navy     | puffer | Everyday Puffer, Navy | winter,casual | 4 | #3a4a72

@thread_co
denim_dark      | denim | Classic Denim Jacket, Dark Rinse | casual | 2 | #34507f
denim_light     | denim | Classic Denim Jacket, Light Wash | casual,summer | 2 | #8aa8d0
bomber_navy     | bomber | MA-1 Bomber, Navy | casual,street | 2 | #2f3f72 | #d9483b
bomber_olive    | bomber | MA-1 Bomber, Olive | casual,street | 2 | #6f7a48 | #f09a3a
blazer_navy     | blazer | Smart Blazer, Navy | smart,work | 2 | #2f3f72
blazer_check    | blazer | Smart Blazer, Grey Check | smart,work | 2 | #9aa0a8 | #6a6e78 | | check
cardi_camel     | cardigan | Fine-Knit Cardigan, Camel | smart,cozy | 2 | #c8a070
cardi_breton    | cardigan | Breton Cardigan | casual,smart | 2 | #f4f0e8 | #2f3f72 | | stripes
harr_stone      | jacket | Harrington Jacket, Stone | casual,smart | 2 | #d8d0b8
harr_navy       | jacket | Harrington Jacket, Navy | casual,smart | 2 | #2f3f72
trench_stone    | trench | City Trench, Stone | smart,rain | 3 | #d8c8a8
coach_navy      | coach | Weekend Coach Jacket, Navy | casual,street | 1 | #2f3f72 | #f4f0e8 | #f4f0e8
wind_cblock     | windbreaker | Colour-Block Windbreaker, Navy & Red | casual,sporty | 1 | #2f3f72 | #d9483b
coat_red        | coat | Wool-Blend Coat, Red | smart,winter | 3 | #b03a3a
pea_camel       | peacoat | Mariner Pea Coat, Camel | smart,winter | 3 | #c8a070 | #6a4428
flannel_slate   | flannel | Check Overshirt, Slate | casual | 2 | #6a7a9a
chore_indigo    | chore | Chore Jacket, Indigo | casual,work | 2 | #34507f | #7a5238
field_stone     | fieldjacket | Utility Field Jacket, Stone | casual | 2 | #d8d0b8
varsity_navy    | varsity | College Varsity, Navy | casual,sporty | 2 | #2f3f72
duffle_camel    | duffle | Campus Duffle Coat, Camel | smart,winter | 3 | #c8a070 | #6a4428

@marigold
cape_midnight   | cape | Opera Cape, Midnight | formal,party | 2 | #2a2a48
trench_ivory    | trench | Gilded Trench, Ivory | formal,smart | 3 | #efe2c8
wrap_camel      | wrapcoat | Camel Wrap Coat | formal,smart | 3 | #c8a070 | #8a6a48
wrap_emerald    | wrapcoat | Emerald Wrap Coat | formal,party | 3 | #2f7a5a | #d8b048
bolero_gold     | bolero | Gold Bolero | party,formal | 1 | #d8b048
bolero_ruby     | bolero | Velvet Bolero, Ruby | party,formal | 1 | #a02848
tux_ivory       | tuxedo | Ivory Dinner Jacket | formal,party | 2 | #f6ead0 | #2a2833
blazer_cream    | blazer | Gold-Button Blazer, Cream | smart,formal | 2 | #f0e0c0
blazer_sapphire | blazer | Gold-Button Blazer, Sapphire | smart,formal | 2 | #2f4fa0
coat_camel      | coat | Cashmere Coat, Camel | formal,winter | 3 | #c8a070
pea_ivory       | peacoat | Admiral Coat, Ivory & Gold | formal,winter | 3 | #f0e6d0 | #d8b048
shear_cognac    | shearling | Shearling Jacket, Cognac | smart,winter | 4 | #9a5a30 | #f0e6d0
kimono_jade     | kimonojacket | Silk Kimono Jacket, Jade | party,artsy | 1 | #2f7a5a | #d8b048 | #a02848
lpuff_gold      | longpuffer | Gilded Long Puffer | winter,party | 4 | #d8b048 | | | | s3

@hollowell
coat_charcoal   | coat | Town Overcoat, Charcoal | formal,work | 3 | #4a4a58
coat_navy       | coat | Town Overcoat, Navy | formal,work | 3 | #26346a
pea_naval       | peacoat | Naval Pea Coat, Charcoal | smart,winter | 3 | #3a3a46 | #c8ccd4
blazer_pin      | blazer | Pinstripe Blazer, Navy | formal,work | 2 | #2f3f72 | | | pinstripe
blazer_tweed    | blazer | Tweed Hacking Jacket | smart,vintage | 2 | #8a6a48 | #c8a070 | | plaid
suit_charcoal   | suit | Two-Piece Jacket, Charcoal | formal,work | 2 | #4a4a58
suit_pinnavy    | suit | Suit Jacket, Navy Pinstripe | formal,work | 2 | #2f3f72 | | | pinstripe
suit_camel      | suit | Suit Jacket, Camel | smart,formal | 2 | #c8a070
tux_black       | tuxedo | Black Tie Dinner Jacket | formal | 2 | #2a2833 | #5a586e
tux_midnight    | tuxedo | Midnight Dinner Jacket | formal,party | 2 | #2a3458 | #2a2833
duster_fawn     | duster | Covert Duster, Fawn | smart,formal | 3 | #b89a70
wrap_charcoal   | wrapcoat | Wrap Overcoat, Charcoal | formal,winter | 3 | #4a4a58 | #2a2833
trench_navy     | trench | Quayside Trench, Navy | formal,rain | 3 | #2f3f72
coat_chester    | coat | Chesterfield, Oxblood | formal,winter | 3 | #6a2a2a
rain_mac        | raincoat | Gentleman's Mac, Olive | smart,rain | 2 | #6f7a58
shear_aviator   | shearling | Shearling Aviator, Brown | smart,winter | 4 | #5a3a28 | #e8dcc0

@nightjar
leather_black   | leather | Night Rider Leather, Black | party,street | 2 | #2a2833
leather_plum    | leather | Night Rider Leather, Plum | party,street | 2 | #5a2a4a
moto_black      | moto | Moto Jacket, Black | street,party | 2 | #2a2833
moto_silver     | moto | Moto Jacket, Silver | party,street | 2 | #b8bcc8
bolero_sequin   | bolero | Sequin Bolero, Black | party | 1 | #2a2833 | | | sparkle
bomber_satin    | bomber | Satin Bomber, Plum | party,street | 2 | #6a3a5a | #2a2833
tux_velvet      | tuxedo | Velvet Smoking Jacket, Plum | party,formal | 2 | #5a2a4a | #2a2833
cape_sparkle    | cape | Midnight Sparkle Cape | party,formal | 2 | #2a2833 | | | sparkle
blazer_sequin   | blazer | Sequin Blazer, Silver | party | 2 | #9aa0b0 | | | sparkle
bomber_leopard  | bomber | Leopard Bomber | party,street | 2 | #c89a5a | #2a2833 | | leopard
puffer_metal    | puffer | Metallic Puffer, Silver | party,winter | 4 | #c8ccd8
wrap_fur        | wrapcoat | Faux Fur Wrap, Black & Plum | party,formal | 3 | #2a2833 | #6a3a5a

@otterline
varsity_otters  | varsity | Otters Letterman Jacket | sporty,street | 2 | #d2392f
varsity_black   | varsity | Otters Letterman Jacket, Black | sporty,street | 2 | #2a2833
track_otters    | trackjacket | Otters Track Jacket | sporty | 1 | #d2392f | #f4f0e8
track_black     | trackjacket | Track Jacket, Black & Red | sporty,street | 1 | #2a2833 | #d2392f
track_cobalt    | trackjacket | Track Jacket, Cobalt & White | sporty | 1 | #3b6fd0 | #f4f0e8
coach_otters    | coach | Otters Coach Jacket | sporty,street | 1 | #2a2833 | #f4f0e8 | #d2392f
coach_red       | coach | Otters Coach Jacket, Team Red | sporty,street | 1 | #d2392f | #f4f0e8 | #f4f0e8
wind_otters     | windbreaker | Otters Windbreaker | sporty,rain | 1 | #d2392f | #f4f0e8
zhood_red       | ziphoodie | Otters Zip Hoodie, Red | sporty,casual | 2 | #d2392f
hoodie_warmup   | hoodie | Warm-Up Hoodie, Otters Red | sporty | 2 | #d2392f
puffer_otters   | puffer | Otters Sideline Puffer | sporty,winter | 4 | #d2392f
anorak_otters   | anorak | Otters Rain Anorak | sporty,rain | 2 | #d2392f | #2a2833
fleece_otters   | fleece | Otters Sideline Fleece | sporty,cozy | 3 | #f4f0e8 | #d2392f
ski_otters      | skijacket | Otters Stadium Jacket | sporty,winter | 3 | #2a2833 | #d2392f | #f4f0e8
gilet_otters    | gilet | Otters Gilet | sporty | 2 | #d2392f
lpuff_bench     | longpuffer | Otters Bench Coat | sporty,winter | 4 | #2a2833
fleece_otblack  | fleece | Otters Fleece, Black | sporty,cozy | 3 | #2a2833 | #d2392f
rain_otters     | raincoat | Otters Rain Shell | sporty,rain | 2 | #d2392f

@kicks_lab
coach_lab       | coach | Kicks Lab Coach Jacket | street | 1 | #2a2833 | #f4f0e8 | #3fd0e0
bomber_sail     | bomber | Lab Bomber, Sail & Red | street | 2 | #e8e2d4 | #e84a3a
wind_court      | windbreaker | Court Windbreaker | street,sporty | 1 | #f4f0e8 | #2f9a5a
track_volt      | trackjacket | Lab Track Top, Volt | street,sporty | 1 | #c8e04a | #2a2833
puffer_teal     | puffer | Drop Puffer, Teal | street,winter | 4 | #2f9a94
varsity_teal    | varsity | Lab Varsity, Teal | street | 2 | #2f9a94
anorak_lab      | anorak | Lab Anorak, Black & Volt | street,rain | 2 | #2a2833 | #c8e04a | | | on

@pixelpop
coach_cyan      | coach | Pixel Coach Jacket, Black & Cyan | street | 1 | #2a2833 | #e84aa8 | #3fd0e0
coach_pink      | coach | Pixel Coach Jacket, Hot Pink | street | 1 | #e84aa8 | #f4f0e8 | #2a2833
bomber_cyan     | bomber | Pop Bomber, Cyan | street | 2 | #3fd0e0 | #2a2833
wind_crash      | windbreaker | Colour Crash Windbreaker | street | 1 | #7a55c8 | #f2c230
puffer_grape    | puffer | Bubble Puffer, Grape | street,winter | 4 | #7a55c8
puffer_lime     | puffer | Bubble Puffer, Lime | street,winter | 4 | #9ac84a
varsity_purple  | varsity | Pixelpop Varsity, Purple | street | 2 | #7a55c8
track_neon      | trackjacket | Neon Track Jacket | street,party | 1 | #e84aa8 | #2a2833
denim_bleach    | denim | Bleach Splatter Denim | street,artsy | 2 | #4a6fa8 | #c8d8f0 | #e8f0f8 | tiedye
zhood_camo      | ziphoodie | Pixel Camo Zip Hoodie | street | 2 | #7a55c8 | | | camo
anorak_pop      | anorak | Pop Anorak, Orange & Purple | street,rain | 2 | #f09a3a | #7a55c8
ski_retro       | skijacket | Retro Ski Jacket, Teal | street,winter | 3 | #2f9a94 | #f2c230 | #e84aa8 | | on
lpuff_glitch    | longpuffer | Glitch Long Puffer, Pink | street,winter | 4 | #e84aa8 | | | | on
bomber_tdye     | bomber | Tie-Dye Bomber | street,artsy | 2 | #3fd0e0 | #e84aa8 | #f2c230 | tiedye

@second_wind
denim_black     | denim | Faded Denim Jacket, Black | vintage,street | 2 | #4a4a58
leather_brown   | leather | Battered Leather, Brown | vintage,street | 2 | #6a4428
varsity_green   | varsity | Thrifted Letterman, Green | vintage,sporty | 2 | #3f6a48
shear_tan       | shearling | Sheepskin Jacket, Tan | vintage,winter | 4 | #b8864a | #f0e6d0
chore_faded     | chore | Workwear Chore Coat, Faded Blue | vintage,work | 2 | #6a88b8 | #7a5238
cardi_grandpa   | cardigan | Grandpa Cardigan, Brown | vintage,cozy | 2 | #7a5238
flannel_brick   | flannel | Plaid Shacket, Brick | vintage,casual | 2 | #a04838 | | | | s2
duster_cord     | duster | Prairie Duster, Corduroy Brown | vintage | 3 | #7a5238
track_vintage   | trackjacket | Vintage Track Top, Brown & Cream | vintage,sporty | 1 | #7a5238 | #e8d8b0
bomber_flight   | bomber | Flight Jacket, Brown | vintage | 2 | #6a4428 | #3a2a20
blazer_cord     | blazer | Corduroy Blazer, Tobacco | vintage,smart | 2 | #8a6038
coat_hound      | coat | Charity-Shop Coat, Houndstooth | vintage,smart | 3 | #e8e0d0 | #4a4a58 | | check
wind_shell      | windbreaker | Shell Suit Jacket | vintage,sporty | 1 | #2f9a94 | #7a55c8
poncho_granny   | poncho | Granny-Square Poncho | vintage,artsy | 2 | #e8b83a | #b8582e | #3f6a48 | floral
kimono_vintage  | kimonojacket | Vintage Floral Kimono | vintage,artsy | 1 | #2a2833 | #e8a0a0 | #e8c070 | floral
tux_powder      | tuxedo | Thrifted Prom Tuxedo, Powder Blue | vintage,party | 2 | #9ab8d8 | #2f3f72
field_army      | fieldjacket | Old Army Field Jacket, Brown | vintage,outdoor | 2 | #6a5038

@juniper_rye
cardi_shawlmust | cardigan | Shawl Cardigan, Mustard | cozy | 3 | #d8a840
cardi_shawlrust | cardigan | Shawl Cardigan, Rust | cozy | 3 | #b8582e
cardi_shawlfor  | cardigan | Shawl Cardigan, Forest | cozy | 3 | #3f6a48
cardi_long      | cardigan | Argyle Long Cardigan | cozy,vintage | 3 | #b8582e | #ead9b8 | | argyle
duffle_oat      | duffle | Campus Duffle, Oat | cozy,winter | 3 | #e0d0b0 | #7a5238
duffle_forest   | duffle | Campus Duffle, Forest | cozy,winter | 3 | #3f6a48 | #ead9b8
duffle_rust     | duffle | Campus Duffle, Rust | cozy,winter | 3 | #b8582e | #ead9b8 | | | s2
wrap_blanket    | wrapcoat | Blanket Wrap Coat, Oat | cozy,winter | 3 | #e0d0b0 | #b8582e
shear_forest    | shearling | Teddy Collar Jacket, Forest | cozy,winter | 4 | #3f6a48 | #f0e6d0
gilet_knit      | gilet | Knitted Gilet, Forest | cozy | 2 | #3f6a48
poncho_wool     | poncho | Wool Poncho, Oat | cozy,artsy | 3 | #e0d0b0 | #b8582e
shear_oat       | shearling | Fireside Shearling, Oat | cozy,winter | 4 | #ead9b8 | #7a5238 | | | s23
bolero_knit     | bolero | Knit Shrug, Rust | cozy,smart | 1 | #b8582e

@saltline
rain_navy       | raincoat | Harbour Slicker, Navy | rain,work | 2 | #2f3f72
rain_orange     | raincoat | Harbour Slicker, Orange | rain,work | 2 | #f0782a
rain_seagreen   | raincoat | Harbour Slicker, Sea Green | rain,work | 2 | #3f8a6a | | | | s0
anorak_squall   | anorak | Squall Anorak, Navy & Yellow | rain,outdoor | 2 | #2f3f72 | #e8b83a
chore_canvas    | chore | Dock Chore Coat, Canvas | work | 2 | #c8b088 | #6a4428
chore_navy      | chore | Dock Chore Coat, Navy | work | 2 | #2f3f72 | #c8b088
pea_harbour     | peacoat | Harbour Pea Coat, Navy | work,winter | 3 | #2a3458 | #c8a070
field_deck      | fieldjacket | Deck Jacket, Navy | work,outdoor | 2 | #2f3f72
parka_fisher    | parka | Fisherman's Parka, Navy | work,winter | 4 | #2f3f72
fleece_harbour  | fleece | Harbour Fleece, Yellow & Navy | work,outdoor | 3 | #e8b83a | #2f3f72
gilet_canvas    | gilet | Canvas Gilet, Tan | work | 2 | #c8b088
duffle_light    | duffle | Lighthouse Duffle, Navy | work,winter | 3 | #2f3f72 | #e8dcc0
wind_spray      | windbreaker | Spray Jacket, Yellow & Navy | rain,work | 1 | #e8b83a | #2f3f72
jacket_canvas   | jacket | Canvas Work Jacket, Brown | work | 2 | #8a6038
duster_oilskin  | duster | Oilskin Duster, Olive | rain,work | 3 | #4a4a38
lpuff_wharf     | longpuffer | Wharf Long Puffer, Slate | work,winter | 4 | #5a6a7a

@fern_field
gilet_orange    | gilet | Ridgeline Gilet, Burnt Orange | outdoor | 3 | #c86a2e
fleece_olive    | fleece | Trail Fleece, Olive & Khaki | outdoor | 3 | #6f7a48 | #b8a878
fleece_orange   | fleece | Trail Fleece, Orange & Charcoal | outdoor | 3 | #c86a2e | #4a4a50
fleece_oat      | fleece | Trail Fleece, Oat & Olive | outdoor,cozy | 3 | #e0d8c0 | #6f7a48
parka_olive     | parka | Expedition Parka, Olive | outdoor,winter | 4 | #5a6438
parka_khaki     | parka | Expedition Parka, Khaki | outdoor,winter | 4 | #b8a878
anorak_summit   | anorak | Summit Anorak, Orange | outdoor,rain | 2 | #e0783a | #4a4a50
field_olive     | fieldjacket | M-65 Field Jacket, Olive | outdoor | 2 | #6f7a48
field_khaki     | fieldjacket | M-65 Field Jacket, Khaki | outdoor | 2 | #b8a878
field_camo      | fieldjacket | M-65 Field Jacket, Camo | outdoor | 2 | #7a8050 | | | camo
puffer_olive    | puffer | Down Puffer, Olive | outdoor,winter | 4 | #6f7a48
puffer_orange   | puffer | Down Puffer, Orange | outdoor,winter | 4 | #e0783a
lpuff_glacier   | longpuffer | Glacier Long Puffer, Khaki | outdoor,winter | 4 | #a89870
ski_powder      | skijacket | Powder Ski Jacket, Orange | outdoor,winter | 3 | #e0783a | #f4f0e8 | #3f6a48 | | s3
ski_forest      | skijacket | Powder Ski Jacket, Forest | outdoor,winter | 3 | #3f6a48 | #e8c070 | #c86a2e | | s3
wind_trail      | windbreaker | Trail Shell, Olive & Orange | outdoor,rain | 1 | #6f7a48 | #e0783a
gilet_navy      | gilet | Quilted Gilet, Navy | outdoor,smart | 3 | #2f3f72
duffle_bivouac  | duffle | Bivouac Duffle, Olive | outdoor,winter | 3 | #6f7a48 | #e0d8c0 | | | on
parka_orange    | parka | Expedition Parka, Blaze Orange | outdoor,winter | 4 | #d8682a | | | | on

@little_lantern
kimono_marigold | kimonojacket | Marigold Kimono Jacket | artsy,summer | 1 | #e8a030 | #2f3f72 | #f4f0e8
kimono_rose     | kimonojacket | Floral Kimono Jacket, Rose | artsy,summer | 1 | #f0d8d0 | #c84a4a | #3f6a48 | floral | s0
poncho_indigo   | poncho | Woven Poncho, Indigo | artsy | 2 | #2f3f72 | #e8a030 | | stripes
poncho_terra    | poncho | Woven Poncho, Terracotta | artsy | 2 | #b8582e | #f4e8d0 | | stripes
robe_block      | robe | Block-Print House Robe | artsy,cozy | 2 | #2f3f72 | #ead9b8 | #e8a030 | floral
chore_painter   | chore | Painter's Chore Coat | artsy,work | 2 | #e8dcc4 | #2f3f72 | #e8a030 | floral
cape_moss       | cape | Felted Cape, Moss | artsy,cozy | 2 | #6a7a4a
cardi_patch     | cardigan | Patchwork Cardigan | artsy,cozy | 2 | #e8a030 | #2f3f72 | | check
denim_embroid   | denim | Embroidered Denim Jacket | artsy,casual | 2 | #4a6fa8 | #f0d890 | #e86a6a | floral
bolero_crochet  | bolero | Crochet Bolero, Cream | artsy,summer | 1 | #f0e8d8 | #e8a030 | | dots
wrap_indigo     | wrapcoat | Indigo Wrap Coat | artsy,smart | 3 | #2f3f72 | #e8a030

@tidepool
kimono_beach    | kimonojacket | Beach Kimono, Aqua | summer | 0 | #5ac8c8 | #f4f0e8 | #f07a5a | | s1
wind_board      | windbreaker | Boardwalk Windbreaker | summer,sporty | 1 | #3fb8a8 | #f07a5a
cardi_linen     | cardigan | Linen Cardigan, Seafoam | summer,casual | 1 | #a8e0d0
denim_white     | denim | Sun-Bleached Denim Jacket, White | summer,casual | 1 | #e8eef4
poncho_towel    | poncho | Towel Poncho, Stripe | summer | 1 | #f07a5a | #f4f0e8 | | stripes | s1
bolero_coral    | bolero | Shrug, Coral | summer,party | 0 | #f07a5a
anorak_aqua     | anorak | Pack-Away Anorak, Aqua | summer,rain | 1 | #5ac8c8 | #f07a5a
robe_cabana     | robe | Cabana Robe | summer | 1 | #f4f0e8 | #3fb8a8 | | stripes
zhood_sand      | ziphoodie | Surf Zip Hoodie, Sand | summer,casual | 2 | #e8d8b0
fleece_coral    | fleece | Beach Fleece, Coral | summer,cozy | 2 | #f07a5a | #f4f0e8
track_aqua      | trackjacket | Boardwalk Track Jacket, Aqua | summer,sporty | 1 | #5ac8c8 | #f4f0e8

@lacquer
leather_ruby    | leather | Patent Jacket, Ruby | party,formal | 2 | #a02848
cape_pearl      | cape | Pearl Cape | formal,party | 2 | #e4e0ec
bolero_sapph    | bolero | Jewel Bolero, Sapphire | party,formal | 1 | #2f4fa0
tux_goldlapel   | tuxedo | Gold Lapel Tuxedo | formal,party | 2 | #2a2833 | #d8b048
moto_emerald    | moto | Lacquer Moto, Emerald | party,street | 2 | #2f7a5a
wrap_pearl      | wrapcoat | Pearl Wrap Coat | formal | 3 | #f0ece0 | #d8b048
`;

export const TOPS = [
  P({ id: 'tp_tee_white', slot: 'top', shape: 'tee', name: 'Everyday Tee, White', brand: 'maple_basics', styles: ['casual'], warmth: 1, c: '#f4f0e8' }),
  P({ id: 'tp_breton_navy', slot: 'top', shape: 'long', name: 'Breton Stripe Long Sleeve', brand: 'thread_co', styles: ['casual', 'smart'], warmth: 2, c: '#2f3f72', c2: '#f4f0e8', pat: 'stripes' }),
  P({ id: 'tp_raglan_otters', slot: 'top', shape: 'raglan', name: 'Dugout Raglan', brand: 'otterline', styles: ['sporty', 'casual'], warmth: 1, c: '#f4f0e8', c2: '#d2392f' }),
  P({ id: 'tp_halter_plum', slot: 'top', shape: 'halterneck', name: 'Last Dance Halter', brand: 'nightjar', styles: ['party', 'summer'], warmth: 0, c: '#6a3a5a', pat: 'sparkle' }),
  P({ id: 'tp_peplum_cream', slot: 'top', shape: 'peplum', name: 'Gilded Peplum Blouse', brand: 'marigold', styles: ['smart', 'formal'], warmth: 1, c: '#f6ead0' }),
  P({ id: 'tp_shirt_oxford_blue', slot: 'top', shape: 'shirt', name: 'Oxford Button-Down, Sky', brand: 'hollowell', styles: ['smart', 'work'], warmth: 2, c: '#9ac8e8' }),
  P({ id: 'tp_hawaiian_coral', slot: 'top', shape: 'shortshirt', name: 'Boardwalk Aloha Shirt', brand: 'tidepool', styles: ['summer', 'casual'], warmth: 0, c: '#f07a5a', c2: '#f4f0e8', accent: '#3fb8a8', pat: 'floral', season: 1 }),
  P({ id: 'tp_tiedye_pop', slot: 'top', shape: 'tee', name: 'Supernova Tie-Dye Tee', brand: 'pixelpop', styles: ['street', 'artsy'], warmth: 1, c: '#7a55c8', c2: '#f08ab0', accent: '#5ab0e0', pat: 'tiedye' }),
  P({ id: 'tp_turtle_oat', slot: 'top', shape: 'turtleneck', name: 'Fireside Roll-Neck', brand: 'juniper_rye', styles: ['cozy', 'smart'], warmth: 3, c: '#ead9b8' }),
].concat(table('top', TOP_ROWS));
export const OUTERS = [
  P({ id: 'ou_denim_classic', slot: 'outer', shape: 'denim', name: 'Trucker Jacket, Mid Wash', brand: 'second_wind', styles: ['vintage', 'casual'], warmth: 2, c: '#4a6fa8' }),
  P({ id: 'ou_slicker_yellow', slot: 'outer', shape: 'raincoat', name: 'Harbour Slicker', brand: 'saltline', styles: ['rain', 'work'], warmth: 2, c: '#e8b83a' }),
  P({ id: 'ou_trench_camel', slot: 'outer', shape: 'trench', name: 'Quayside Trench', brand: 'hollowell', styles: ['formal', 'smart', 'rain'], warmth: 3, c: '#c8a070' }),
  P({ id: 'ou_cape_wine', slot: 'outer', shape: 'cape', name: 'Opera Cape', brand: 'marigold', styles: ['formal', 'party'], warmth: 2, c: '#8a2f3a' }),
  P({ id: 'ou_kimono_indigo', slot: 'outer', shape: 'kimonojacket', name: 'Indigo Block-Print Kimono', brand: 'little_lantern', styles: ['artsy', 'summer'], warmth: 1, c: '#2f3f72', c2: '#ead9b8', accent: '#e8b83a' }),
  P({ id: 'ou_gilet_olive', slot: 'outer', shape: 'gilet', name: 'Ridgeline Gilet', brand: 'fern_field', styles: ['outdoor', 'casual'], warmth: 3, c: '#6f7a48' }),
].concat(table('outer', OUTER_ROWS));
