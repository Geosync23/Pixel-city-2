// Number legibility switch (QA round 13). Pixelify Sans draws 2, 3 and 5 with the outline of an 8 (one design pixel tells
// them apart) and its bold (wght 700) thickens every stroke by ~0.4 design pixel, so at 12-19 px "$241.50" reads "$841.80".
// One switch, the `data-num` attribute on <html>, picks how DIGITS ONLY (U+0030-0039) are drawn; words keep the pixel font:
//   ''  (default) today's look: Pixelify digits at the text's own weight
//   'a' Pixelify digits always at weight 400 (no bold), tabular figures
//   'b' 'a' + money and clock numbers one step larger (HUD money / clock, phone status bar, bank, prices, fares, pay)
//   'c' the phone's own UI font for digits (Roboto / Helvetica Neue / Arial ...), tabular figures; falls back to 'd' if none loads
//   'd' a digit-only pixel face drawn for legibility (tools/numfont_gen.mjs): 5x7 regular, 6x7 bold, same widths as Pixelify
// API: G.numFont.set(mode) (persists per device in localStorage 'maplebay.num'), G.numFont.get(), G.numFont.modes.
// URL: ?num=a|b|c|d|pixel. Works by putting a unicode-range face in front of "Pixelify Sans" in body's font-family.
import { DIGITS_REGULAR, DIGITS_BOLD } from './_numfont_data.js';

export const order = 5;
const MODES = ['', 'a', 'b', 'c', 'd'], KEY = 'maplebay.num', DIG = 'U+0030-0039', DIGB = 'U+0030-0039,U+0042-0044,U+0047,U+005A';   /* mode d also redraws the capital B (owner msg 172: Pixelify's B reads as a G) */
const STACK = '"Pixelify Sans",ui-rounded,"Trebuchet MS",system-ui,sans-serif';
const FAM = { a: 'MB Digits A', b: 'MB Digits A', c: 'MB Digits C', d: 'MB Digits D' };
const MONEY = ['.hud-money b', '.hud-clock', '.ph-st-clock', '.ph-st-money', '.ph-big', '.ph-kv b', '.ph-row-r', '.shop-price', '.ph-w-clock', '.ph-nowline b'];
const loaded = {};
let cur = '';

function pixelSrc() { // the src of the game's own @font-face (a url in the dev tree, a data: url in dist)
  for (const s of document.styleSheets) { let rules; try { rules = s.cssRules; } catch (e) { continue; } for (const r of rules || []) if (r.type === 5 && /Pixelify/.test(r.style.getPropertyValue('font-family'))) return r.style.getPropertyValue('src'); }
  return 'url(assets/font.woff2) format("woff2")';
}
const b64 = s => { const t = atob(s), a = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) a[i] = t.charCodeAt(i); return a.buffer; };
const LOCAL = w => (w === 700 ? ['Roboto Bold', 'Roboto-Bold', 'HelveticaNeue-Bold', 'Helvetica Neue Bold', 'Arial Bold', 'Arial-BoldMT', 'Segoe UI Bold', 'Inter Bold', 'Inter SemiBold', 'Liberation Sans Bold', 'DejaVu Sans Bold']
  : ['Roboto', 'Roboto-Regular', 'Roboto Regular', 'HelveticaNeue', 'Helvetica Neue', 'ArialMT', 'Arial', 'Segoe UI', 'Inter', 'Inter Regular', 'Liberation Sans', 'DejaVu Sans']).map(n => `local("${n}")`).join(',');

function faces(m) {
  const fam = FAM[m]; if (!fam || loaded[m]) return loaded[m] || Promise.resolve(true);
  const add = (src, weight, extra, family = fam) => { try { const f = new FontFace(family, src, Object.assign({ weight, unicodeRange: DIG }, extra)); document.fonts.add(f); return f.load().then(() => true, () => false); } catch (e) { return Promise.resolve(false); } };
  let p;
  if (m === 'a') p = add(pixelSrc(), '400'); // one face at 400: bold text matches it and, with font-synthesis-weight:none, is not thickened
  else if (m === 'b') p = Promise.all([add(pixelSrc(), '400'), add(pixelSrc(), '400', { sizeAdjust: '112%', ascentOverride: '82.1%', descentOverride: '25%', lineGapOverride: '0%' }, 'MB Digits B')]).then(r => r[0]); // B: the same digits 12% larger, line metrics unchanged
  else if (m === 'd') p = Promise.all([add(b64(DIGITS_REGULAR), '100 550', { unicodeRange: DIGB }), add(b64(DIGITS_BOLD), '551 1000', { unicodeRange: DIGB })]).then(r => r[0] && r[1]);
  else p = Promise.all([add(LOCAL(400), '100 550'), add(LOCAL(700), '551 1000')]).then(r => r[0] || r[1]);
  return (loaded[m] = p);
}

function css() {
  if (document.getElementById('numfont-css')) return;
  const r = [];
  for (const m of ['a', 'b', 'c', 'd']) {
    const sel = s => s.split(',').map(x => `:root[data-num=${m}] ${x.trim()}`).join(',');
    r.push(`${sel('body,.bk-note')}{font-family:"${FAM[m]}",${STACK}}`, `${sel('#nav-trip')}{font-family:"${FAM[m]}",${STACK}!important}`);
  }
  r.push(':root[data-num] body{font-variant-numeric:tabular-nums;font-synthesis-weight:none}');
  r.push(MONEY.map(s => `:root[data-num=b] ${s}`).join(',') + `{font-family:"MB Digits B","MB Digits A",${STACK}}`);
  const st = document.createElement('style'); st.id = 'numfont-css'; st.textContent = r.join('\n'); document.head.append(st);
}

function apply(m) {
  cur = m; const root = document.documentElement;
  if (!m) { delete root.dataset.num; return; }
  faces(m).then(ok => { if (cur !== m) return; if (!ok && m === 'c') { console.warn('numfont: no system digit face could be loaded; using the pixel digits (d)'); faces('d'); root.dataset.num = 'd'; return; } root.dataset.num = m; });
}

export function init(G) {
  css();
  /* lead decision (QA13's recommendation): the legible pixel digits 'd' are the DEFAULT; G.numFont.set('pixel') or ?num=pixel brings the old look back */
  let m = 'd';
  try { const v = localStorage.getItem(KEY); if (v !== null) m = v === 'pixel' ? '' : v; } catch (e) { }
  try { const q = new URLSearchParams(location.search).get('num'); if (q != null) m = q === 'pixel' ? '' : q; } catch (e) { }
  if (!MODES.includes(m)) m = 'd';
  apply(m);
  G.numFont = {
    modes: MODES.slice(),
    get: () => cur,
    set(mode) { mode = mode === 'pixel' || mode == null ? '' : String(mode); if (!MODES.includes(mode)) return false; try { localStorage.setItem(KEY, mode || 'pixel'); } catch (e) { } apply(mode); return true; },
  };
}
