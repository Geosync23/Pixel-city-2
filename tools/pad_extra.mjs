// CONTROLLER CHECK, the side cases (the play-through is tools/pad_check.mjs):  node tools/pad_extra.mjs
//   keyboard focus (arrows / Tab / Enter in a window, WASD untouched in the world) · touch takes over from the pad and gives it back · a Switch-style pad (confirm = the
//   right button) · a NON-STANDARD pad (mapping '', D-pad on a hat axis) · two pads (the last one used drives) · unplugging · a phone game's canvas as a surface ·
//   the free pointer walking the player (tap far away to walk there) · a sheet of every glyph in the four styles (out/shots/pad_glyphs.png).
import { openGame, BTN } from './pad_lib.mjs'; import { genModules } from './modules.mjs';
genModules(); let bad = 0; const say = (ok, t, note) => { if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + t + (note ? '  ' + note : '')); };
const errs = [];
/* ---- 1. keyboard ---- */
{ const P = await openGame({ url: '?scene=int:cafe&t=10', pad: false }), pg = P.pg; await P.sleep(1200); await pg.evaluate(() => { try { G.firstTime.setEnabled(false); } catch (e) { } });
  const p0 = await pg.evaluate(() => [G.player.x, G.player.y]); await pg.keyboard.down('ArrowLeft'); await P.sleep(600); await pg.keyboard.up('ArrowLeft'); const p1 = await pg.evaluate(() => [G.player.x, G.player.y]);
  say(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > .5 && !(await pg.evaluate(() => document.body.classList.contains('kb-on'))), 'keyboard, in the world: the arrow keys still walk, no ring');
  await pg.keyboard.press('m'); await P.sleep(700); await pg.keyboard.press('ArrowDown'); await P.sleep(200); let i = await P.info();
  say(i.mode === 'keys' && i.focus && (await pg.evaluate(() => document.body.classList.contains('kb-on') && !document.body.classList.contains('pad-on') && getComputedStyle(document.getElementById('pad-bar')).display === 'none')), 'keyboard, phone open: an arrow key shows the ring (no glyphs, no legend strip)', i.focus && i.focus.text);
  await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('ArrowRight'); await P.sleep(150); const f1 = (await P.info()).focus; await pg.keyboard.press('Tab'); await P.sleep(150); const f2 = (await P.info()).focus;
  say(f1 && f2 && f1.text !== f2.text && f1.text !== i.focus.text, 'keyboard: arrows and Tab move the focus', `${i.focus.text} -> ${f1 && f1.text} -> ${f2 && f2.text}`);
  for (let k = 0; k < 30; k++) { const f = (await P.info()).focus; if (f && /^Settings/.test(f.text)) break; await pg.keyboard.press('Tab'); await P.sleep(60); }
  await pg.keyboard.press('Enter'); await P.sleep(700); const inSet = await pg.evaluate(() => G.phone.viewing('settings')); await P.shot('pad_kb_settings');
  say(inSet, 'keyboard: Tab to Settings, Enter opens it'); await pg.keyboard.press('Escape'); await P.sleep(500); await pg.keyboard.press('Escape'); await P.sleep(600);
  say(!(await pg.evaluate(() => G.phone.isOpen)), 'keyboard: Esc, Esc closes the phone (the old behaviour)');
  await P.sleep(400); say((await P.info()).mode === 'touch' && !(await pg.evaluate(() => document.body.classList.contains('kb-on'))), 'keyboard: back in the world the ring is gone');
  errs.push(...P.errors); await P.close(); }
/* ---- 2. touch <-> pad, the free pointer, a phone game ---- */
{ const P = await openGame({ url: '?scene=int:cafe&t=10' }), pg = P.pg; await P.sleep(1200); await pg.evaluate(() => { try { G.firstTime.setEnabled(false); } catch (e) { } }); await P.connect();
  await P.press('start', 70, 700); let i = await P.info(); const on1 = await pg.evaluate(() => ({ cls: document.body.className, ring: document.getElementById('pad-ring').classList.contains('on'), bar: getComputedStyle(document.getElementById('pad-bar')).display, h: document.getElementById('wrap').clientHeight }));
  say(i.mode === 'pad' && on1.ring && on1.bar === 'flex' && on1.h === 844 - 30, 'pad: Start opens the phone; ring + legend strip on, the game is 30 px shorter', JSON.stringify(on1));
  await pg.mouse.click(195, 300); await P.sleep(500); const off = await pg.evaluate(() => ({ cls: document.body.className, ring: getComputedStyle(document.getElementById('padnav')).display, bar: getComputedStyle(document.getElementById('pad-bar')).display, h: document.getElementById('wrap').clientHeight, slots: [...document.querySelectorAll('.pg')].filter(e => getComputedStyle(e).display !== 'none').length }));
  say(off.cls === '' && off.ring === 'none' && off.bar === 'none' && off.h === 844 && off.slots === 0, 'a real click / tap: ring, glyphs and strip are gone at once, the game is full height again', JSON.stringify(off));
  await P.press('down', 60, 300); i = await P.info(); say(i.mode === 'pad' && i.focus, 'the next pad button brings them back', i.focus && i.focus.text);
  /* a phone game: its canvas is a surface */
  const has = await P.choose(/^(Playbox|Play)/, null, { after: 800, noCursor: true });
  if (has) { await P.sleep(300); const L = await pg.evaluate(() => G.padnav.list()); console.log('   playbox:', JSON.stringify(L.slice(0, 12))); }
  await pg.evaluate(() => { /* looking only */ }); for (let k = 0; k < 4; k++) { if ((await P.info()).state === 'world') break; await P.press('back', 60, 400); }
  /* the free pointer: tap far away to walk there */
  const p0 = await pg.evaluate(() => [G.player.x, G.player.y]); await P.press('r3', 60, 200); i = await P.info(); const cur = !!i.cursor; const fl = await pg.evaluate(() => { const s = G.toScreen(4.2, 6.5, 0), r = G.cv.getBoundingClientRect(); return [s.x + r.left, s.y + r.top]; }); await P.steerCursor(fl[0], fl[1]); await P.shot('pad_cursor_world'); await P.press('ok', 70, 1600); const p1 = await pg.evaluate(() => [G.player.x, G.player.y]);
  say(cur && Math.hypot(p1[0] - 4.2, p1[1] - 6.5) < 1.2 && Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 1.5, 'free pointer (R3): move it with the stick, A on the floor far away walks the player there', `${p0.map(v => v.toFixed(1))} -> ${p1.map(v => v.toFixed(1))}`);
  await P.press('back', 60, 200); say(!(await P.info()).cursor, 'B puts the pointer away');
  /* right stick looks around and springs back */
  const c0 = await pg.evaluate(() => G.cam.fx); await P.rstick(1, 0); await P.sleep(600); const c1 = await pg.evaluate(() => G.cam.fx); await P.rstick(0, 0); await P.sleep(900); const c2 = await pg.evaluate(() => G.cam.fx);
  say(c1 - c0 > 20 && Math.abs(c2 - c0) < 4, 'right stick: the camera leans and springs back', `${c0.toFixed(0)} -> ${c1.toFixed(0)} -> ${c2.toFixed(0)}`);
  /* triggers zoom, D-pad speed and pause */
  const z0 = await pg.evaluate(() => G.zoom); await P.press('r2', 60, 250); const z1 = await pg.evaluate(() => G.zoom); await P.press('l2', 60, 250); const z2 = await pg.evaluate(() => G.zoom);
  say(z1 === z0 + 1 && z2 === z0, 'RT / LT zoom in / out one step', `${z0} ${z1} ${z2}`);
  await P.press('right', 60, 200); const s1 = await pg.evaluate(() => G.state.speed); await P.press('left', 60, 200); const s2 = await pg.evaluate(() => G.state.speed); await P.press('down', 60, 300); const pz = await pg.evaluate(() => G.modal); await P.shot('pad_paused'); await P.press('down', 60, 300); const pz2 = await pg.evaluate(() => G.modal);
  say(s1 === 2 && s2 === 1 && pz === 1 && pz2 === 0, 'D-pad right / left = speed 2x / 1x, D-pad down pauses and continues', `${s1} ${s2} ${pz} ${pz2}`);
  /* unplug */
  await pg.evaluate(() => window.__disconnect()); await P.sleep(300); const un = await pg.evaluate(() => ({ mode: G.pad.mode, cls: document.body.className }));
  say(un.mode === 'touch' && un.cls === '', 'unplugging the pad: back to touch, nothing left on screen', JSON.stringify(un));
  errs.push(...P.errors); await P.close(); }
/* ---- 3. a Switch-style pad: confirm is the RIGHT button ---- */
{ const P = await openGame({ url: '?scene=int:cafe&t=10', style: 'switch' }), pg = P.pg; await P.sleep(1200); await pg.evaluate(() => { try { G.firstTime.setEnabled(false); } catch (e) { } }); await P.connect();
  await P.press('start', 70, 700); const st = await pg.evaluate(() => ({ style: G.pad.style, swapped: G.pad.swapped }));
  await pg.evaluate(i => window.__btn(i, 1), 1); await P.sleep(80); await pg.evaluate(i => window.__btn(i, 0), 1); await P.sleep(600); const opened = await pg.evaluate(() => G.phone.isOpen && !!document.querySelector('.ph-app')); await P.shot('pad_switch_phone');
  await pg.evaluate(i => window.__btn(i, 1), 0); await P.sleep(80); await pg.evaluate(i => window.__btn(i, 0), 0); await P.sleep(600); const backed = await pg.evaluate(() => G.phone.isOpen && !document.querySelector('.ph-app'));
  say(st.style === 'switch' && st.swapped && opened && backed, 'Switch-style pad: glyph set B A Y X, the right button confirms, the bottom one goes back', JSON.stringify(st));
  errs.push(...P.errors); await P.close(); }
/* ---- 4. a non-standard pad (mapping ''): 12 buttons, 4 axes + a hat ---- */
{ const P = await openGame({ url: '?scene=int:cafe&t=10', style: 'generic' }), pg = P.pg; await P.sleep(1200); await pg.evaluate(() => { try { G.firstTime.setEnabled(false); } catch (e) { } });
  await pg.evaluate(() => { const p = window.__pad; p.mapping = ''; p.buttons.length = 12; p.axes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1.2857]; delete p.vibrationActuator; }); await P.connect();
  await P.press('start', 70, 700); const st = await pg.evaluate(() => ({ style: G.pad.style, open: G.phone.isOpen })); let i = await P.info(); const f0 = i.focus && i.focus.text;
  const hat = async v => { await pg.evaluate(x => { window.__pad.axes[9] = x; }, v); await P.sleep(90); await pg.evaluate(() => { window.__pad.axes[9] = 1.2857; }); await P.sleep(200); };
  await hat(0.142857); const f1 = (await P.info()).focus; await hat(-0.428571); const f2 = (await P.info()).focus; await P.shot('pad_generic_phone');
  say(st.style === 'generic' && st.open && f1 && f2 && f1.text !== f0 && f2.text !== f1.text, 'non-standard pad: brand-free "dots" glyphs, Start works, the hat axis moves the focus down and right', `${f0} -> ${f1 && f1.text} -> ${f2 && f2.text}`);
  await P.press('ok', 70, 600); say(await pg.evaluate(() => !!document.querySelector('.ph-app')), 'non-standard pad: the bottom face button confirms');
  errs.push(...P.errors); await P.close(); }
/* ---- 5. two pads ---- */
{ const P = await openGame({ url: '?scene=int:cafe&t=10' }), pg = P.pg; await P.sleep(1200); await pg.evaluate(() => { try { G.firstTime.setEnabled(false); } catch (e) { } });
  await pg.evaluate(() => { const mk = (id, index) => ({ id, index, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) }); window.__p2 = mk('DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)', 1); navigator.getGamepads = () => [window.__pad, window.__p2, null, null]; window.__padOn = true; const e = new Event('gamepadconnected'); e.gamepad = window.__pad; window.dispatchEvent(e); });
  await P.press('start', 70, 600); const s1 = await pg.evaluate(() => G.pad.style); await pg.evaluate(() => { const b = window.__p2.buttons[13]; b.pressed = true; b.value = 1; }); await P.sleep(120); await pg.evaluate(() => { const b = window.__p2.buttons[13]; b.pressed = false; b.value = 0; }); await P.sleep(300); const s2 = await pg.evaluate(() => G.pad.style);
  await P.press('down', 60, 300); const s3 = await pg.evaluate(() => G.pad.style); say(s1 === 'xbox' && s2 === 'ps' && s3 === 'xbox', 'two pads: the one used last drives (and the glyphs follow it)', `${s1} -> ${s2} -> ${s3}`);
  /* the glyph sheet */
  await pg.evaluate(() => { const names = ['ok', 'back', 'x', 'y', 'l1', 'r1', 'l2', 'r2', 'start', 'select', 'ls', 'rs', 'l3', 'r3', 'dpad', 'dup', 'ddown', 'dleft', 'dright', 'dlr']; const box = document.createElement('div'); box.id = 'glyphsheet'; box.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#fff4dc;padding:12px;display:grid;gap:10px;font:700 14px sans-serif;color:#2a2733;width:760px';
    for (const [st, bg] of [['xbox', '#fff4dc'], ['ps', '#1b1a24'], ['switch', '#6fb3e0'], ['generic', '#3f7d4a']]) { G.pad.setPref('glyphs', st); const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;align-items:center;padding:8px;background:' + bg + ';color:' + (bg === '#fff4dc' ? '#2a2733' : '#fff4dc'); const t = document.createElement('span'); t.textContent = st; t.style.width = '64px'; row.append(t); for (const n of names) row.append(G.padnav.glyph(n, 2)); box.append(row); } G.pad.setPref('glyphs', 'auto'); document.body.append(box); });
  await pg.setViewportSize({ width: 800, height: 400 }); await P.sleep(200); await pg.screenshot({ path: 'out/shots/pad_glyphs.png', clip: { x: 0, y: 0, width: 784, height: 250 } });
  errs.push(...P.errors); await P.close(); }
say(!errs.length, 'page errors: ' + errs.length, errs.slice(0, 3).join(' | ').slice(0, 300));
console.log(bad ? bad + ' FAILED' : 'all side cases pass'); process.exit(bad ? 1 : 0);
