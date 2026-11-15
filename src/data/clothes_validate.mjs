// Wardrobe catalogue check (dev tool; not imported by the game).   node src/data/clothes_validate.mjs [--min 1000] [--minhair 60] [--quiet] [--list  print every shape id per slot]
// Fails (exit 1) when: the catalogue has fewer than --min pieces (default MIN_PIECES = 1000) or fewer than --minhair hairstyles; an id is duplicated or badly prefixed;
// a piece names an unknown shape / brand / style / shop / pattern / colour; a piece draws nothing (its sprite equals the bare mannequin: no preview);
// or two pieces of one slot look pixel-identical on the character (front view). Prints the counts by slot, brand and shop.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), art = path.join(here, '../art/chars');
const a = process.argv.slice(2), arg = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? +a[i + 1] : d; };
const C = await import('./clothes.js'), B = await import('./clothes_brands.js');
const R = await import(pathToFileURL(path.join(here, '../engine/raster.js')));
for (const f of fs.readdirSync(art).sort()) if (f.endsWith('.js')) await import(pathToFileURL(path.join(art, f)));
const { drawChar, CHAR_SB, PATTERNS, BOT_PATTERNS, SKIRT } = await import(pathToFileURL(path.join(art, 'char.js')));
const { shapeIds, SHAPES } = await import(pathToFileURL(path.join(art, '_shapes.js')));
const errs = [], E = m => errs.push(m), HEX = /^#[0-9a-f]{6}$/i, PRE = { top: 'tp_', outer: 'ou_', dress: 'dr_', bottom: 'bt_', shoes: 'sh_', hat: 'ht_', acc: 'ac_' };
const min = arg('min', C.MIN_PIECES), minHair = arg('minhair', C.MIN_HAIRS);
const sig = spec => { const r = R.render(CHAR_SB, () => drawChar(spec, { dir: 0 }), null, 1), r2 = R.render(CHAR_SB, () => drawChar(spec, { dir: 3 }), null, 1); let h = 2166136261; for (const b of [r.buf, r2.buf]) for (let i = 0; i < b.length; i++) h = Math.imul(h ^ b[i], 16777619) >>> 0; return h; };
const ids = new Set(), names = new Set(), looks = new Map();
const shapesFor = { top: shapeIds('top'), dress: shapeIds('dress'), outer: shapeIds('outer').concat(shapeIds('top')), bottom: shapeIds('bottom'), shoes: shapeIds('shoes'), hat: shapeIds('hat'), neck: shapeIds('neck'), glasses: shapeIds('glasses'), bag: shapeIds('bag'), earring: shapeIds('ear') };
for (const id of Object.keys(SHAPES.top)) if (SHAPES.outer[id]) E(`shape id "${id}" is registered as both a top and an outerwear shape (outerwear falls back to tops: ambiguous)`);
for (const p of C.CATALOG) {
  const w = p.id || '(no id)';
  if (!p.id || ids.has(p.id)) E(`${w}: missing or duplicate id`); ids.add(p.id);
  if (!B.SLOTS.includes(p.slot)) { E(`${w}: unknown slot ${p.slot}`); continue; }
  if (!String(p.id).startsWith(PRE[p.slot])) E(`${w}: id must start with ${PRE[p.slot]}`);
  if (!p.name) E(`${w}: no name`); else if (names.has(p.name)) E(`${w}: duplicate name "${p.name}"`); names.add(p.name);
  if (!B.BRANDS[p.brand]) E(`${w}: unknown brand ${p.brand}`);
  if (!Array.isArray(p.styles) || !p.styles.length || p.styles.some(s => !B.STYLES.includes(s))) E(`${w}: bad styles ${p.styles}`);
  if (!(p.warmth >= 0 && p.warmth <= 4)) E(`${w}: warmth must be 0..4`);
  if (!(p.price > 0)) E(`${w}: no price`);
  if (!p.shops.length || p.shops.some(s => !B.SHOPS[s])) E(`${w}: unknown shop in ${p.shops}`);
  for (const k of ['c', 'c2', 'accent']) if (p[k] != null && !HEX.test(p[k])) E(`${w}: ${k} is not a #rrggbb colour`); if (!p.c) E(`${w}: no colour c`);
  const skirtB = p.slot === 'bottom' && (SKIRT[p.shape] || (SHAPES.bottom[p.shape] && SHAPES.bottom[p.shape].skirt));
  if (p.pat && !(p.slot === 'bottom' && !skirtB ? BOT_PATTERNS : PATTERNS).includes(p.pat)) E(`${w}: unknown pattern ${p.pat}`);
  if (p.slot === 'acc') { if (!B.ACC_KINDS.includes(p.kind)) E(`${w}: unknown accessory kind ${p.kind}`); else if (shapesFor[p.kind] && !shapesFor[p.kind].includes(p.shape)) E(`${w}: no ${p.kind} shape "${p.shape}"`); }
  else if (!shapesFor[p.slot].includes(p.shape)) E(`${w}: no ${p.slot} shape "${p.shape}"`);
  let s; try { s = sig(C.previewSpec(p)); } catch (e) { E(`${w}: drawing threw ${e.message}`); continue; }
  if (s === sig(C.previewBase(p))) E(`${w}: draws nothing on the character (no preview)`);
  const key = p.slot + (p.kind || '') + ':' + s; if (looks.has(key)) E(`${w}: looks identical to ${looks.get(key)}`); else looks.set(key, p.id);
}
const hairIds = shapeIds('hair'), beardIds = shapeIds('beard'), hs = new Set();
for (const h of C.HAIR_STYLES) { if (hs.has(h.id)) E(`hair ${h.id}: duplicate`); hs.add(h.id); if (!hairIds.includes(h.id)) E(`hair ${h.id}: no such hair shape`); if (!h.name) E(`hair ${h.id}: no name`); if (!(h.books || []).length) E(`hair ${h.id}: in no lookbook`); }
for (const f of C.FACIAL) if (!beardIds.includes(f.id)) E(`facial ${f.id}: no such beard shape`);
const starters = C.HAIR_STYLES.filter(h => h.starter).length;
if (C.CATALOG.length < min) E(`catalogue has ${C.CATALOG.length} pieces; at least ${min} are required`);
if (C.HAIR_STYLES.length < minHair) E(`${C.HAIR_STYLES.length} hairstyles; at least ${minHair} are required`);
const count = fn => { const o = {}; for (const p of C.CATALOG) for (const k of [].concat(fn(p))) o[k] = (o[k] || 0) + 1; return Object.entries(o).sort((x, y) => y[1] - x[1]).map(e => e.join(' ')).join(' · '); };
if (!a.includes('--quiet')) {
  console.log(`pieces ${C.CATALOG.length} (min ${min}) · hairstyles ${C.HAIR_STYLES.length} (min ${minHair}, ${starters} starter) · facial ${C.FACIAL.length} · dyes ${C.HAIR_DYES.length}`);
  console.log('by slot:  ' + count(p => p.slot === 'acc' ? 'acc/' + p.kind : p.slot)); console.log('by brand: ' + count(p => p.brand)); console.log('by shop:  ' + count(p => p.shops));
  console.log('shapes:   ' + Object.keys(shapesFor).map(k => k + ' ' + shapesFor[k].length).join(' · ') + ` · hair ${hairIds.length} · beard ${beardIds.length}`);
}
if (a.includes('--list')) for (const k of [...Object.keys(shapesFor), 'hair', 'beard']) console.log(`\n${k} shapes (${shapeIds(k).length}): ` + shapeIds(k).join(' '));
if (errs.length) { console.error(`\n${errs.length} problem(s):\n` + errs.slice(0, 60).map(e => '  - ' + e).join('\n') + (errs.length > 60 ? `\n  ... and ${errs.length - 60} more` : '')); process.exit(1); }
console.log('clothes OK');
