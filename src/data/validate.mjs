// validate.mjs — dev-only consistency check for src/data (not imported by the game).
// Run:  node src/data/validate.mjs          (add --summary for a balance printout)
// Exits with code 1 if any cross-reference is broken.
import { NEEDS, MOODLETS, MOOD, SKILLS, SKILL_XP } from './needs.js';
import { VENUES, VENUE_BY_ID, SERVICES, POIS, STATIONS, DISTRICTS, isOpen } from './venues.js';
import { ITEMS, ITEM_BY_ID, RECIPES, HOMEGOODS, DISHES, INGREDIENTS, COOKBOOKS, RECIPE_CATS, LEARN_FROM, LEGACY_RECIPES } from './items.js';
import './venues_extra.js'; // registers the generic venue types (gen_bodega, gen_retail_cheese ...) that items may list in soldAt
import { ACTIVITIES, ANIMS, FUNCTION_TAGS } from './activities.js';
import { JOBS, GIGS, WORK_RULES, shiftHours, weeklyBasePay } from './jobs.js';
import { HOMES, SIZE_CLASSES, STARTER_KIT, MOVING_BOXES, AMBIENCE_TIERS, MOVING_BOXES_DONE_MOODLET } from './homes.js';
import { START, OVERDRAFT, TIPPING, DISCOUNTS, FARES } from './economy.js';
import { SEASONS, WEATHER_TYPES, WEATHER_BY_SEASON, EVENTS, DAY_PARTS } from './calendar.js';
import { APPS, NOTIFICATIONS } from './phone.js';

const errors = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); };
const needIds = NEEDS.map((n) => n.id);
const skillIds = SKILLS.map((s) => s.id);
const districtIds = DISTRICTS.map((d) => d.id);
const stationIds = STATIONS.map((s) => s.id);
const poiIds = POIS.map((p) => p.id);
const seasonIds = SEASONS.map((s) => s.id);
const allTags = Object.values(FUNCTION_TAGS).flat();
const moodlet = (id, where) => ok(id == null || MOODLETS[id], `${where}: unknown moodlet '${id}'`);
const item = (id, where) => ok(ITEM_BY_ID[id], `${where}: unknown item '${id}'`);
const venue = (id, where) => ok(VENUE_BY_ID[id], `${where}: unknown venue '${id}'`);
const skills = (obj, where) => Object.keys(obj || {}).forEach((k) => ok(skillIds.includes(k), `${where}: unknown skill '${k}'`));
const unique = (arr, where) => ok(new Set(arr).size === arr.length, `${where}: duplicate ids ${arr.filter((x, i) => arr.indexOf(x) !== i)}`);

// needs
ok(Math.abs(Object.values(MOOD.weights).reduce((a, b) => a + b, 0) - 1) < 1e-9, 'MOOD.weights must sum to 1');
Object.keys(MOOD.weights).forEach((k) => ok(needIds.includes(k), `MOOD.weights: unknown need ${k}`));
NEEDS.forEach((n) => { n.bands.forEach((b) => moodlet(b.moodlet, `need ${n.id}`)); moodlet(n.atZero.moodlet, `need ${n.id} atZero`); });
ok(SKILL_XP.length === 10, 'SKILL_XP needs 10 entries');

// venues
unique(VENUES.map((v) => v.id), 'VENUES');
VENUES.forEach((v) => {
  ok(districtIds.includes(v.district), `venue ${v.id}: district`);
  ok(stationIds.includes(v.station), `venue ${v.id}: station`);
  ok(v.hours.length === 7, `venue ${v.id}: hours need 7 entries`);
  (v.offers.functions || []).forEach((t) => ok(allTags.includes(t), `venue ${v.id}: unknown function tag '${t}'`));
  (v.offers.services || []).forEach((s) => ok(SERVICES.some((x) => x.id === s && x.venue === v.id), `venue ${v.id}: service '${s}'`));
  (v.seasons || []).forEach((s) => ok(seasonIds.includes(s), `venue ${v.id}: season`));
});
SERVICES.forEach((s) => { venue(s.venue, `service ${s.id}`); moodlet(s.effect.moodlet, `service ${s.id}`); (s.effect.removeMoodlets || []).forEach((m) => moodlet(m, `service ${s.id}`)); });
POIS.forEach((p) => { ok(districtIds.includes(p.district), `poi ${p.id}: district`); p.functions.forEach((t) => ok(allTags.includes(t), `poi ${p.id}: tag '${t}'`)); });

// items
unique(ITEMS.map((i) => i.id), 'ITEMS');
ITEMS.forEach((i) => {
  ['id', 'name', 'category', 'price', 'icon', 'effects', 'stack', 'soldAt'].forEach((f) => ok(i[f] !== undefined, `item ${i.id}: missing ${f}`));
  moodlet(i.effects.moodlet, `item ${i.id}`);
  Object.keys(i.effects).forEach((k) => ok([...needIds, 'moodlet', 'caffeine', 'alcohol'].includes(k), `item ${i.id}: effect key '${k}'`));
  i.soldAt.forEach((v) => {
    venue(v, `item ${i.id}`);
    const o = VENUE_BY_ID[v]?.offers || {};
    if (i.category === 'dish') ok(o.menu, `item ${i.id}: venue ${v} has no menu`);
    else ok((o.shop || []).includes(i.category), `item ${i.id}: venue ${v} does not sell category ${i.category}`); // (QA round 3: generic venue types are checked too; gallery sketchbook/canvas stock fixed)
  });
  (i.blocksMoodlets || i.perk?.blocksMoodlets || []).forEach((m) => moodlet(m, `item ${i.id}`));
  skills(i.perk?.xpMult, `item ${i.id}`);
  if (i.category === 'book' && i.skill) skills({ [i.skill]: 1 }, `item ${i.id}`);
  (i.seasons || []).forEach((s) => ok(seasonIds.includes(s), `item ${i.id}: season`));
});
unique(RECIPES.map((r) => r.id), 'RECIPES');
const catIds = RECIPE_CATS.map((c) => c.id), CORE_SHOPS = ['grocery', 'cornerstore', 'market_stalls', 'bakery'];
const recipeCost = (r) => Object.entries(r.ingredients).reduce((s, [i, q]) => s + (ITEM_BY_ID[i]?.price || 0) * q, 0) / r.servings;
RECIPES.forEach((r) => {
  const w = `recipe ${r.id}`;
  Object.keys(r.ingredients).forEach((ing) => { item(ing, w); ok(ITEM_BY_ID[ing]?.category === 'ingredient' && ITEM_BY_ID[ing].soldAt.length, `${w}: '${ing}' not a buyable ingredient`); });
  ok(r.stoveTier >= 0 && r.stoveTier <= 2 && r.skill >= 1 && r.skill <= 10, `${w}: tier/skill range`);
  ['name', 'icon', 'cookMinutes', 'servings', 'effects', 'eatMinutes', 'shelfLifeDays', 'xp'].forEach((f) => ok(r[f] !== undefined, `${w}: missing ${f}`));
  ok(['none', 'stove'].includes(r.appliance), `${w}: appliance`);
  ok(catIds.includes(r.cat), `${w}: unknown menu category '${r.cat}'`);
  ok(!r.oven || (r.appliance === 'stove' && r.stoveTier >= 1), `${w}: oven dishes need appliance 'stove' and stoveTier >= 1`);
  ok(r.servings >= 1 && r.servings <= 6 && r.cookMinutes >= 5 && r.cookMinutes <= 120, `${w}: servings / cookMinutes range`);
  ok(!r.giftable || (r.gift && r.gift.relationship > 0 && Array.isArray(r.gift.giftTags)), `${w}: giftable needs gift { relationship, giftTags }`);
  ok(!!r.drink === (r.cat === 'drink'), `${w}: drink flag must match the 'drink' category`);
  const c = recipeCost(r); ok(c >= 0.5 && c <= 6.5, `${w}: cost per serving $${c.toFixed(2)} outside $0.50-$6.50`);
  ok(ITEM_BY_ID['meal_' + r.id]?.category === 'meal', `${w}: no meal item`);
  const l = r.learn;
  if (l) {
    ok(['level', 'book', 'eat', 'friend', 'story'].filter((k) => l[k] !== undefined).length === 1, `${w}: learn needs exactly one of level/book/eat/friend/story`);
    if (l.level !== undefined) ok(l.level >= 2 && l.level <= 10 && l.level >= r.skill, `${w}: learn.level must be 2-10 and >= skill`);
    if (l.book) ok(COOKBOOKS.some((b) => b.id === l.book), `${w}: unknown cookbook '${l.book}'`);
    if (l.eat) { ok(l.n >= 1 && l.eat.length, `${w}: learn.eat needs dishes and n`); l.eat.forEach((d) => { item(d, w); ok(ITEM_BY_ID[d]?.soldAt.length, `${w}: learn.eat '${d}' is sold nowhere`); }); }
    if (l.friend || l.story) ok(LEARN_FROM[l.friend || l.story], `${w}: no LEARN_FROM text for '${l.friend || l.story}'`);
  }
});
LEGACY_RECIPES.forEach((id) => ok(RECIPES.some((r) => r.id === id), `LEGACY_RECIPES: '${id}' is gone (old saves could cook it)`));
INGREDIENTS.forEach((i) => {
  ok(i.soldAt.some((v) => CORE_SHOPS.includes(v)), `ingredient ${i.id}: must be sold at FreshWay, Lucky Corner, the market or the bakery`);
  ok(i.shelfLifeDays === null || i.shelfLifeDays > 0, `ingredient ${i.id}: shelfLifeDays`);
  ok(RECIPES.some((r) => r.ingredients[i.id]), `ingredient ${i.id}: used by no recipe`);
});
COOKBOOKS.forEach((b) => { ok(b.teaches.length >= 3, `cookbook ${b.id}: teaches fewer than 3 recipes`); ok(b.soldAt.length, `cookbook ${b.id}: sold nowhere`); });
// icons: every meal, ingredient and cookbook needs its own art (no word / category fallback)
try {
  const { hasIcon } = await import('../art/icons/icons.js'); await import('../art/icons/recipes.js');
  [...RECIPES.map((r) => 'meal_' + r.id), ...INGREDIENTS.map((i) => i.id), ...COOKBOOKS.map((b) => b.id)].forEach((id) => ok(hasIcon(id), `icon missing: ${id} (src/art/icons/recipes.js)`));
} catch (e) { errors.push('could not load the icon modules: ' + e.message); }
FUNCTION_TAGS.home.forEach((t) => [0, 1, 2].forEach((tier) => ok(ITEM_BY_ID[`${t}_t${tier}`], `homegood ${t}_t${tier} missing`)));
HOMEGOODS.forEach((h) => ok(FUNCTION_TAGS.home.includes(h.tag), `homegood ${h.id}: tag`));
VENUES.filter((v) => v.offers.menu).forEach((v) => ok(DISHES.some((d) => d.venue === v.id), `venue ${v.id}: menu but no dishes`));

// activities
unique(ACTIVITIES.map((a) => a.id), 'ACTIVITIES');
ACTIVITIES.forEach((a) => {
  const w = `activity ${a.id}`;
  ok(ANIMS.includes(a.anim), `${w}: anim '${a.anim}'`);
  ok(allTags.includes(a.tag), `${w}: tag '${a.tag}'`);
  ok(a.flavour && a.minutes && a.minutes.min <= a.minutes.default && a.minutes.default <= a.minutes.max, `${w}: minutes/flavour`);
  Object.keys(a.perHour || {}).forEach((k) => ok(needIds.includes(k), `${w}: perHour key '${k}'`));
  Object.keys(a.xpPerHour || {}).forEach((k) => ok(k === '$bookSkill' || skillIds.includes(k), `${w}: xp skill '${k}'`));
  (a.venues || []).forEach((v) => { if (v === '*') return; /* '*' = any non-home interior with the fixture (src/sim/activities.js) */ venue(v, w); ok(VENUE_BY_ID[v]?.offers.functions?.includes(a.tag), `${w}: venue ${v} lacks function tag '${a.tag}'`); });
  if (a.where === 'venue') ok(a.venues?.length, `${w}: needs venues`);
  [a.cost?.item, a.requires?.item].flat().filter(Boolean).forEach((i) => item(i, w));
  if (a.requires?.event) ok(EVENTS.some((e) => e.id === a.requires.event), `${w}: event`);
  skills(a.requires?.skill, w); skills(a.requires?.skillAny, w);
  [...(a.requires?.weather || []), ...(a.requires?.notWeather || [])].forEach((x) => ok(WEATHER_TYPES[x], `${w}: weather '${x}'`));
  moodlet(a.onComplete?.moodlet, w);
  if (Array.isArray(a.onComplete?.gives)) a.onComplete.gives.forEach((g) => item(g.item, w));
  (a.yieldPerHour || []).forEach((y) => [y.item].flat().forEach((i) => item(i, w)));
});
// every home tag and every venue/POI tag that is not purely a shop fixture should offer something
const passiveTags = ['rug', 'decor', 'till', 'shelf', 'host_stand', 'reception', 'showroom', 'clothes_rack', 'front_door', 'taxi_rank'];
allTags.filter((t) => !passiveTags.includes(t)).forEach((t) => ok(ACTIVITIES.some((a) => a.tag === t), `function tag '${t}' has no activity`));

// jobs
unique(JOBS.map((j) => j.id), 'JOBS');
ok(JOBS.length === 10, 'need exactly 10 jobs');
JOBS.forEach((j) => {
  const w = `job ${j.id}`;
  venue(j.venue, w);
  ok(VENUE_BY_ID[j.venue]?.jobId === j.id, `${w}: venue.jobId mismatch`);
  ok(j.levels.length === 4 && j.levels.every((l, i) => l.level === i + 1 && (i === 0 || l.hourly > j.levels[i - 1].hourly)), `${w}: levels`);
  skills(j.requires, w); j.levels.forEach((l) => skills(l.requires, w)); skills(j.trains.xpPerHour, w);
  ok(skillIds.includes(j.trains.primary), `${w}: primary skill`);
  Object.keys(j.workDrain).forEach((k) => ok([...needIds, 'fitnessPerHour'].includes(k), `${w}: workDrain key ${k}`));
  j.shifts.days.forEach((d) => {
    const v = VENUE_BY_ID[j.venue];
    ok(isOpen(v, d, j.shifts.start + 0.01) || isOpen(v, d, j.shifts.start + 0.51), `${w}: venue closed at shift start, day ${d}`);
    const endDay = j.shifts.end > 24 ? (d + 1) % 7 : d; const endH = (j.shifts.end - 0.51) % 24;
    ok(isOpen(v, j.shifts.end - 0.51 >= 24 ? endDay : d, endH), `${w}: venue closed before shift end, day ${d}`);
  });
  ok(j.workLoop.tasks.length >= 3, `${w}: needs 3+ tasks`);
  j.workLoop.tasks.forEach((t) => { ok(ANIMS.includes(t.anim), `${w}: task ${t.id} anim`); ok(j.workLoop.stations.includes(t.station), `${w}: task ${t.id} station '${t.station}'`); });
});
VENUES.filter((v) => v.jobId).forEach((v) => ok(JOBS.some((j) => j.id === v.jobId), `venue ${v.id}: jobId`));
GIGS.forEach((g) => { skills(g.requires, `gig ${g.id}`); skills(g.xp, `gig ${g.id}`); ok(ANIMS.includes(g.anim), `gig ${g.id}: anim`); ok(skillIds.includes(g.paySkill), `gig ${g.id}: paySkill`); });
WORK_RULES.payBands.forEach((b) => moodlet(b.moodlet, 'payBands'));
moodlet(WORK_RULES.promotion.onPromotion.moodlet, 'promotion');

// homes
unique(HOMES.map((h) => h.id), 'HOMES');
HOMES.forEach((h) => {
  const w = `home ${h.id}`;
  ok(districtIds.includes(h.district) && stationIds.includes(h.station) && SIZE_CLASSES[h.sizeClass], `${w}: district/station/size`);
  h.included.forEach((i) => item(i, w));
  h.rooms.forEach((r) => r.suggested.forEach((t) => ok(FUNCTION_TAGS.home.includes(t), `${w}: room ${r.id} tag '${t}'`)));
  ok(h.rentPerWeek != null || h.buyPrice != null, `${w}: neither rentable nor buyable`);
});
STARTER_KIT.forEach((i) => item(i, 'STARTER_KIT'));
MOVING_BOXES.forEach((b) => b.gives.forEach((g) => item(g.item, `box ${b.id}`)));
AMBIENCE_TIERS.forEach((t) => moodlet(t.moodlet, 'AMBIENCE_TIERS')); moodlet(MOVING_BOXES_DONE_MOODLET, 'boxes');

// economy
START.ownedItems.forEach((i) => item(i, 'START')); venue(START.place, 'START');
moodlet(OVERDRAFT.moodletBelowZero, 'OVERDRAFT'); TIPPING.venues.forEach((v) => venue(v, 'TIPPING'));
Object.entries(DISCOUNTS.staff).forEach(([j, d]) => { ok(JOBS.some((x) => x.id === j), `staff discount job ${j}`); venue(d.venue, 'staff discount'); });
item(FARES.transitPass.item, 'FARES'); ok(ITEM_BY_ID[FARES.transitPass.item].price === FARES.transitPass.price, 'transit pass price mismatch');

// calendar
Object.entries(WEATHER_BY_SEASON).forEach(([s, row]) => {
  ok(seasonIds.includes(s), `weather season ${s}`);
  ok(Math.abs(Object.values(row).reduce((a, b) => a + b, 0) - 1) < 1e-9, `weather ${s}: probabilities must sum to 1`);
  Object.keys(row).forEach((k) => ok(WEATHER_TYPES[k], `weather ${s}: type ${k}`));
});
Object.entries(WEATHER_TYPES).forEach(([k, wt]) => { moodlet(wt.moodlet, `weather ${k}`); moodlet(wt.bonusMoodlet, `weather ${k}`); });
ok(DAY_PARTS[0].from === 0 && DAY_PARTS.at(-1).to === 24 && DAY_PARTS.every((p, i) => i === 0 || p.from === DAY_PARTS[i - 1].to), 'DAY_PARTS must tile 0..24');
unique(EVENTS.map((e) => e.id), 'EVENTS');
EVENTS.forEach((e) => {
  const w = `event ${e.id}`;
  if (e.when.season) ok(e.when.season === 'any' || seasonIds.includes(e.when.season), `${w}: season`);
  if (e.place.venue) venue(e.place.venue, w);
  if (e.place.poi) ok(poiIds.includes(e.place.poi), `${w}: poi`);
  if (e.place.district) ok(districtIds.includes(e.place.district), `${w}: district`);
  const s = e.special;
  moodlet(s.moodlet, w); moodlet(s.fireworks?.moodlet, w);
  (s.stalls || []).forEach((st) => st.sells.forEach((i) => item(i, `${w} stall ${st.id}`)));
  (s.discounts || []).forEach((d) => { venue(d.venue, w); (d.items || []).forEach((i) => item(i, w)); });
  (s.closures || []).forEach((v) => venue(v, w));
  (s.activities || []).forEach((a) => ok(ACTIVITIES.some((x) => x.id === a), `${w}: activity ${a}`));
  if (s.guaranteedWeather) ok(WEATHER_TYPES[s.guaranteedWeather], `${w}: weather`);
});

// phone
unique(APPS.map((a) => a.id), 'APPS'); unique(APPS.map((a) => a.slot), 'APP slots');
ok(APPS.length <= 9, 'max 9 apps');
NOTIFICATIONS.forEach((n) => ok(APPS.some((a) => a.id === n.app), `notification ${n.id}: app`));

// ---------------------------------------------------------------------------------------------
if (process.argv.includes('--summary')) {
  console.log(`items ${ITEMS.length} | dishes ${DISHES.length} | recipes ${RECIPES.length} | homegoods ${HOMEGOODS.length} | activities ${ACTIVITIES.length} | moodlets ${Object.keys(MOODLETS).length} | events ${EVENTS.length}`);
  console.log('\nWeekly base pay by level (hours/week):');
  JOBS.forEach((j) => console.log(`  ${j.id.padEnd(16)} ${String(shiftHours(j) * j.shifts.days.length).padStart(2)}h  ` + [1, 2, 3, 4].map((l) => ('$' + weeklyBasePay(j, l)).padStart(6)).join(' ')));
  console.log('\nNeed budget per day (16 h awake / 8 h asleep):');
  NEEDS.forEach((n) => console.log(`  ${n.id.padEnd(8)} ${(n.decayAwake * 16 + n.decayAsleep * 8).toFixed(0)}`));
  console.log(`\nRecipes: ${RECIPES.length} | ingredients ${INGREDIENTS.length} | cookbooks ${COOKBOOKS.length}`);
  console.log('  by category: ' + RECIPE_CATS.map((c) => `${c.id} ${RECIPES.filter((r) => r.cat === c.id).length}`).join(' · '));
  console.log('  by skill:    ' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `${n}: ${RECIPES.filter((r) => r.skill === n).length}`).join(' · '));
  const how = (r) => (!r.learn ? 'known from the start' : r.learn.level ? 'cooking level-up' : r.learn.book ? 'cookbook / card' : r.learn.eat ? 'eating out' : r.learn.friend ? 'friend' : 'story');
  const by = {}; RECIPES.forEach((r) => { by[how(r)] = (by[how(r)] || 0) + 1; });
  console.log('  learned by:  ' + Object.entries(by).map(([k, v]) => `${k} ${v}`).join(' · '));
  console.log(`  no-cook ${RECIPES.filter((r) => r.appliance === 'none').length} · hot plate ${RECIPES.filter((r) => r.appliance === 'stove' && r.stoveTier === 0).length} · range/oven ${RECIPES.filter((r) => r.stoveTier === 1).length} · chef's range ${RECIPES.filter((r) => r.stoveTier === 2).length} · giftable ${RECIPES.filter((r) => r.giftable).length}`);
  console.log('  known from the start, skill 1-2: ' + RECIPES.filter((r) => !r.learn && r.skill <= 2).length);
  console.log('\nRecipe cost per serving / hunger per $:');
  RECIPES.forEach((r) => { const c = recipeCost(r); console.log(`  ${r.id.padEnd(22)} s${String(r.skill).padEnd(2)} ${r.cat.padEnd(9)} $${c.toFixed(2)}  x${r.servings}  ${String(r.cookMinutes).padStart(3)} min  hunger ${String(r.effects.hunger || 0).padStart(2)}  (${((r.effects.hunger || 0) / c).toFixed(1)}/$)  xp ${r.xp}`); });
  console.log('\nStarter studio first-week cost (rent + utilities + phone):');
  HOMES.filter((h) => h.kind === 'starter_studio').forEach((h) => console.log(`  ${h.id.padEnd(18)} $${h.rentPerWeek + SIZE_CLASSES[h.sizeClass].utilitiesPerWeek + 8}`));
}

if (errors.length) { console.error(`\n${errors.length} data error(s):\n - ` + errors.join('\n - ')); process.exit(1); }
console.log('src/data OK: all cross-references resolve.');
