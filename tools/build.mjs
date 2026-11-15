// Build a single self-contained HTML file: node tools/build.mjs  -> dist/index.html
import fs from 'node:fs'; import path from 'node:path'; import { build } from 'esbuild';
import { ROOT } from './artfiles.mjs'; import { genModules } from './modules.mjs'; import { genManifestModule, audioBlocks } from './audio_pack.mjs';
genModules(); genManifestModule();
const r = await build({ entryPoints: [path.join(ROOT, 'src/main.js')], bundle: true, format: 'iife', minify: !process.argv.includes('--dev'), write: false, target: 'es2020', legalComments: 'none' });
const js = r.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
let css = fs.readFileSync(path.join(ROOT, 'src/ui/style.css'), 'utf8');
for (const f of fs.readdirSync(path.join(ROOT, 'src/ui'))) if (f.endsWith('.css') && f !== 'style.css') css += '\n' + fs.readFileSync(path.join(ROOT, 'src/ui', f), 'utf8');
let font = ''; const fp = path.join(ROOT, 'assets/font.woff2'); if (fs.existsSync(fp)) font = `@font-face{font-family:"Pixelify Sans";font-weight:400 700;src:url(data:font/woff2;base64,${fs.readFileSync(fp).toString('base64')}) format("woff2")}`;
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(/<style>@font-face.*?<\/style>/, '').replace('<link rel="stylesheet" href="src/ui/style.css">', () => `<style>${font}${css}</style>`).replace('<script type="module" src="src/main.js"></script>', () => `<script>${js}</script>`);
/* the ambience recordings ride at the very end of the file as inert base64 blocks (never parsed as script; src/sim/audio.js reads one when it is first needed). --no-audio leaves them out */
const amb = process.argv.includes('--no-audio') ? { html: '', bytes: 0, count: 0 } : audioBlocks(); if (amb.html) html = html.replace('</body>', () => amb.html + '</body>');
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'dist/index.html'), html);
console.log('dist/index.html', (html.length / 1024).toFixed(0) + ' KB' + (amb.count ? ' (of which ambience recordings: ' + amb.count + ' stretches, ' + (amb.html.length / 1024).toFixed(0) + ' KB)' : ''));
