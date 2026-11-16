// Motion graphics layer: renders the trailer's titles / captions / counter / door wipes as transparent PNG frames (1280x720, 30 fps) in the game's own look
// (Pixelify Sans from assets/font.woff2, the HUD palette of src/ui/style.css: ink #2a2733, panel #fff4dc, gold #f2c230, 2px borders, hard drop shadows, stepped moves).
//   node tools/trailer/overlay.mjs a|b   -> <scratch>/overlay_<k>/%05d.png      (items come from edl.mjs)
// Item kinds: fadein {t0,t1} · dim {t0,t1,a} · title {t0,t1,tag?} · cap {t0,t1,text,pos,size} · count {t0,t1,steps:[[t,n]...],label,final?} · wipe {t} · day {t0,t1,text}
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { SCRATCH, FPS, W, H } from './lib.mjs'; import { EDL } from './edl.mjs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const font = fs.readFileSync(path.join(ROOT, 'assets/font.woff2')).toString('base64');
const HTML = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:"Pixelify Sans";src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:400 700}
html,body{margin:0;background:transparent;overflow:hidden}
#r{position:relative;width:${W}px;height:${H}px;overflow:hidden;font-family:"Pixelify Sans",sans-serif;font-weight:700;font-variant-ligatures:none;color:#fff4dc}
#r>*{position:absolute}
.ol{text-shadow:3px 0 0 #2a2733,-3px 0 0 #2a2733,0 3px 0 #2a2733,0 -3px 0 #2a2733,3px 3px 0 #2a2733,-3px 3px 0 #2a2733,3px -3px 0 #2a2733,-3px -3px 0 #2a2733,0 7px 0 #2a2733,3px 7px 0 #2a2733,-3px 7px 0 #2a2733}
.cap{left:0;right:0;text-align:center;letter-spacing:.03em;line-height:1.05}
.title{left:0;right:0;text-align:center;font-size:150px;letter-spacing:.04em;line-height:1}
.title b{color:#f2c230;font-weight:700}
.tag{left:50%;transform:translateX(-50%);white-space:nowrap;background:#2a2733;color:#fff4dc;font-size:46px;padding:8px 22px;box-shadow:0 4px 0 #1b1a24}
.box{background:#fff4dc;color:#2a2733;border:3px solid #2a2733;box-shadow:4px 4px 0 #2a2733;padding:6px 16px;text-align:center}
.day{left:40px;top:36px;background:#2a2733;color:#f2c230;font-size:40px;padding:4px 16px;box-shadow:4px 4px 0 #1b1a24;letter-spacing:.06em}
.leaf{background:#2a2733}
</style><div id="r"></div><script>
const items = __ITEMS__, FPS = ${FPS};
const st = (u, n) => Math.round(u * n) / n;                      // stepped easing: n steps
const pop = (t, a, b) => { const i = Math.min(1, (t - a) / .2), o = Math.min(1, (b - t) / .13); return { y: Math.round((1 - st(Math.min(i, 1), 4)) * 22), a: t < a || t >= b ? 0 : o < 1 ? st(o, 3) : 1 }; };
window.render = t => {
  let h = '';
  for (const it of items) {
    if (it.kind === 'wipe') { const u = (t - it.t) / (it.d || .2); if (u < 0 || u >= 1) continue; const w = Math.round((1 - st(u, 5)) * ${W / 2}); if (w <= 0) continue;
      h += '<div class="leaf" style="left:0;top:0;height:${H}px;width:' + w + 'px;border-right:6px solid #f2c230"></div><div class="leaf" style="right:0;top:0;height:${H}px;width:' + w + 'px;border-left:6px solid #f2c230"></div>'; continue; }
    if (t < it.t0 || t >= it.t1) continue;
    if (it.kind === 'fadein') h += '<div style="inset:0;background:#1b1a24;opacity:' + (1 - st((t - it.t0) / (it.t1 - it.t0), 12)).toFixed(3) + '"></div>';
    else if (it.kind === 'fadeout') h += '<div style="inset:0;background:#1b1a24;opacity:' + st((t - it.t0) / (it.t1 - it.t0), 12).toFixed(3) + '"></div>';
    else if (it.kind === 'dim') h += '<div style="inset:0;background:#1b1a24;opacity:' + (Math.min(1, st((t - it.t0) / (it.ramp || .3), 4)) * it.a).toFixed(3) + '"></div>';
    else if (it.kind === 'title') { const p = pop(t, it.t0, it.t1), y = (it.y || 250) + p.y; h += '<div class="title ol" style="top:' + y + 'px;opacity:' + p.a + '">MAPLE <b>BAY</b></div>'; if (it.tag && t >= it.t0 + (it.tagAt || .58)) { const q = pop(t, it.t0 + (it.tagAt || .58), it.t1); h += '<div class="tag" style="top:' + (y + 190 + q.y) + 'px;opacity:' + q.a + '">' + it.tag + '</div>'; } }
    else if (it.kind === 'cap') { const p = pop(t, it.t0, it.t1), s = it.size || 76, y = it.pos === 'center' ? ${H / 2} - s * .6 : it.pos === 'top' ? 60 : ${H} - 70 - s * (1 + (it.text.split('<br>').length - 1) * 1.05); h += '<div class="cap ol" style="top:' + (y + p.y) + 'px;font-size:' + s + 'px;opacity:' + p.a + '">' + it.text + '</div>'; }
    else if (it.kind === 'day') { const p = pop(t, it.t0, it.t1); h += '<div class="day" style="top:' + (36 - p.y) + 'px;opacity:' + p.a + '">' + it.text + '</div>'; }
    else if (it.kind === 'count') { let n = 0, last = -1; for (const s of it.steps) if (t >= s[0]) { n = s[1]; last = s[0]; } const bump = t - last < .1 ? -6 : 0, p = pop(t, it.t0, it.t1);
      h += '<div class="box" style="right:40px;top:' + (34 + bump) + 'px;opacity:' + p.a + ';min-width:230px"><div style="font-size:92px;line-height:.95">' + n + '</div><div style="font-size:26px;line-height:1.1">' + it.label + '</div></div>'; }
  }
  document.getElementById('r').innerHTML = h;
};
</script>`;
const k = process.argv[2]; const E = EDL[k]; if (!E) { console.log('usage: overlay.mjs a|b'); process.exit(1); }
const dir = path.join(SCRATCH, 'overlay_' + k); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const br = await chromium.launch(); const page = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(HTML.replace('__ITEMS__', JSON.stringify(E.gfx))); await page.evaluate(() => document.fonts.ready); await page.evaluate(() => document.fonts.load('700 40px "Pixelify Sans"'));
const N = Math.round(E.len * FPS); let prev = null, blank = 0;
for (let i = 0; i < N; i++) {
  await page.evaluate(t => window.render(t), (i + .5) / FPS);
  const html = await page.evaluate(() => document.getElementById('r').innerHTML), f = path.join(dir, String(i).padStart(5, '0') + '.png');
  if (prev && html === prev.html) fs.copyFileSync(prev.f, f); else { await page.screenshot({ path: f, omitBackground: true }); prev = { html, f }; } if (!html) blank++;
}
await br.close(); console.log(dir, N, 'frames,', blank, 'blank');
