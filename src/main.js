import './art/index.js';
import { G } from './core/game.js';
import { initModules } from './modules.gen.js';

async function start() {
  const q = new URLSearchParams(location.search); G.query = q; G.debug = q.has('debug');
  G.boot(document.getElementById('cv'));
  await initModules(G);                 // every src/{world,scenes,sim,ui,story}/**/*.js with an init(G)
  G.emit('ready');
  if (!G.started) { // no title/intro system took over: drop straight into the city
    const sc = q.get('scene') || 'city'; const o = {}; if (q.has('x')) { o.x = +q.get('x'); o.y = +q.get('y'); }
    if (q.has('t')) G.state.t = +q.get('t') * 60; if (q.has('season')) G.setSeason(+q.get('season'));
    await G.go(sc, Object.assign(o, { fade: false }));
  }
  if (q.has('zoom')) G.setZoom(+q.get('zoom'));
  document.getElementById('load').remove();
}
setTimeout(() => start().catch(e => { console.error(e); document.getElementById('load').textContent = 'Error: ' + e.message; }), 30);
