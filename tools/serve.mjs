// Dev server: node tools/serve.mjs [port]  -> http://localhost:8080  (regenerates module indexes on each page load)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { ROOT } from './artfiles.mjs'; import { genModules } from './modules.mjs';
const port = +process.argv[2] || 8080, MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' };
genModules();
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') { u = '/index.html'; try { genModules(); } catch (e) { console.error(e); } }
  const f = path.join(ROOT, u); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log('http://localhost:' + port));
