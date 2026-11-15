// Phone app: Settings (save, game speed, sound, text size, banners, photo mode, help, back to title).
// Audio: sliders write G.state.audio[k] (or G.state.phone.settings.audio until an audio system owns that slice) and call G.audio.setVolume(k, v) if present.
import { G } from '../core/game.js';
import { el, btn, card, section, chip, kv, safe, iconEl } from './phone_util.js';

const S = () => G.state.phone.settings;
function photoMode(ctx) {
  ctx.close(); const ui = document.getElementById('ui'); ui.classList.add('ph-photo'); G.emit('photo', true);
  setTimeout(() => { ui.classList.remove('ph-photo'); G.emit('photo', false); }, 5000);
}
function help(b) {
  for (const [t, x] of [['The gentle rules', 'Nobody dies and nobody gets evicted in Maple Bay. If a need runs out you get a little help and carry on.'], ['Getting around', 'Tap the ground to walk. MapleCab drives you anywhere you know; the light rail and buses are cheaper.'], ['Your phone', 'M or Q opens the phone, Esc goes back. Banners at the top open the right app when tapped.'], ['Time', 'One game minute is about a real second. The phone pauses the world while it is open.'], ['Money', 'Bills come every Monday at 08:00. Bay Bank shows what is due.']])
    b.append(card(el('b', { text: t }), el('p', { text: x })));
}
export default {
  id: 'settings',
  render(b, ctx) {
    const st = S();
    b.append(section('Game'));
    b.append(el('div.ph-btns', null, btn('Save now', () => { const ok = safe(() => G.save(), null); ctx.tip(ok ? 'Game saved.' : 'Could not save right now.'); if (ok && G.hud && G.hud.saved) safe(() => G.hud.saved(), 0); }, 'pri', 'ui.check'), btn('Photo mode (5 s)', () => photoMode(ctx), '', 'ui.sparkle')));
    b.append(card(el('b', { text: 'Game speed' }), el('div.ph-chips', null, [1, 2, 4].map(s => chip(s + 'x', G.state.speed === s ? 'on' : '', () => { G.state.speed = s; safe(() => G.hud.refresh(), 0); ctx.refresh(); })))));
    b.append(section('Sound'));
    const A = G.state.audio && typeof G.state.audio === 'object' ? G.state.audio : (st.audio = st.audio || { master: .8, music: .6, sfx: .8 }), c = card();
    for (const [k, name] of [['master', 'Master'], ['music', 'Music'], ['sfx', 'Effects']]) { if (A[k] === undefined) A[k] = k === 'music' ? .6 : .8; const out = el('span', { text: Math.round(A[k] * 100) });
      c.append(el('label.ph-range', null, el('span', { text: name }), el('input', { type: 'range', min: 0, max: 100, step: 5, value: Math.round(A[k] * 100), 'aria-label': name + ' volume', oninput: e => { A[k] = e.target.value / 100; out.textContent = e.target.value; safe(() => G.audio.setVolume(k, A[k]), 0); } }), out)); }
    b.append(c); if (!G.audio) b.append(el('p.ph-note', { text: 'The speakers are still being unpacked. Your levels are remembered.' }));
    b.append(section('Phone'));
    b.append(card(el('b', { text: 'Text size' }), el('div.ph-chips', null, [[14, 'Small'], [15, 'Normal'], [17, 'Large']].map(([s, l]) => chip(l, (st.text || 15) === s ? 'on' : '', () => { st.text = s; document.querySelector('.ph').style.fontSize = s + 'px'; ctx.refresh(); }))),
      el('b', { text: 'Notification banners' }), el('div.ph-chips', null, chip('On', st.banners !== false ? 'on' : '', () => { st.banners = true; ctx.refresh(); }), chip('Badges only', st.banners === false ? 'on' : '', () => { st.banners = false; ctx.refresh(); })),
      kv('Battery', 'Same as yours'), kv('Carrier', 'BayTel 4G')));
    b.append(section('More'));
    b.append(card(el('b', { text: 'Developer mode' }), el('div.ph-chips', null, chip('Off', !(G.dev && G.dev.on()) ? 'on' : '', () => { safe(() => G.dev.set(false), 0); ctx.refresh(); }), chip('On', G.dev && G.dev.on() ? 'on' : '', () => { safe(() => G.dev.set(true), 0); ctx.refresh(); })),
      el('p.ph-note', { text: 'Adds a DEV button to the bottom-left corner of the game screen: freeze needs, endless money, unlock everything, time and weather.' })));
    b.append(el('div.ph-btns', null, btn('Help', () => ctx.push('Help', help), '', 'ui.question'), btn('Back to title', () => { if (!ctx._t) { ctx._t = 1; return ctx.tip('Tap again to save and return to the title screen.'); } safe(() => G.save(), 0); ctx.close(); import('./title.js').then(m => m.showTitle && m.showTitle()).catch(() => {}); }, '', 'ui.home')));
    b.append(el('p.ph-note', { text: 'Maple Bay. Take your time.' }), iconEl('season.autumn', 2));
  },
};
