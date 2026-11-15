// Builds docs/audio/listen.html: the owner's listening page for the recorded city ambience.   node tools/audio_pack.mjs --listen
// One self-contained file (no external requests): the SAME mixer module the game runs (src/sim/_audio_bed.js, bundled here unchanged), the same
// base64 blocks of the same MP3 stretches, a button per place and time of day, and every single recording with its own play button.
// Written without <html>/<head>/<body> tags on purpose: it opens as a file as it is, and the artifact publisher wraps it in its own skeleton.
import fs from 'node:fs'; import path from 'node:path'; import { build } from 'esbuild';
import { ROOT } from './artfiles.mjs'; import { manifest, audioBlocks } from './audio_pack.mjs';

const SCENES = [
  ['Day', [['Busy street', 'city', 'day', 'Downtown traffic; now and then a trolley rolls through'], ['Old town street', 'town', 'day', 'Light traffic and streetcars; a little crowd murmur drifts in and out'], ['Quiet street', 'suburb', 'day', 'A few cars, birds coming and going, the city far off'], ['Park', 'park', 'day', 'Meadow birds, the city barely there'], ['Harbor', 'harbor', 'day', 'Waves, gulls now and then, the town behind you'], ['Pier', 'waterfront', 'day', 'Out on the boardwalk: waves up close, more gulls'], ['Market', 'market', 'day', 'Market Square: the crowd over a light street'], ['Airport', 'airport', 'day', 'Engines on the apron, a propeller plane'], ['Rail yard', 'industrial', 'day', 'Traffic from further off, low rumble']]],
  ['Dawn and evening', [['Busy street, dawn', 'city', 'dawn', 'Traffic still thin, birds up'], ['Quiet street, dawn', 'suburb', 'dawn', 'Mostly birds'], ['Busy street, evening', 'city', 'evening', 'Traffic thinner and a little duller'], ['Quiet street, evening', 'suburb', 'evening', 'Cars, evening air, crickets starting'], ['Park, evening', 'park', 'evening', 'Birds quieter, first crickets'], ['Harbor, evening', 'harbor', 'evening', 'Waves; a gull only now and then']]],
  ['Night', [['Night, downtown', 'city', 'night', 'Crickets, the city far off and muffled'], ['Night, quiet street', 'suburb', 'night', 'Crickets, far rumble, still air'], ['Night, park', 'park', 'night', 'Crickets'], ['Night, harbor', 'harbor', 'night', 'Waves, far rumble']]],
  ['Weather', [['Busy street in rain', 'city', 'day', 'No rain recording yet: the street just steps back by half', 'rain'], ['Park in snow', 'park', 'day', 'Snow hushes everything: the same birds, quieter', 'snow']]],
];
const CSS = `
/* layout: one narrow column; a sticky "now playing" strip on top, then scene buttons by time of day, then the recordings as a plain list */
:root{--bg:#f3f6f5;--panel:#ffffff;--ink:#16211f;--muted:#5b6b68;--line:#d5dedb;--accent:#0f7a6c;--accent-ink:#ffffff;--on:#dff1ec;--warn:#9a5b00;
  --sans:ui-rounded,"SF Pro Rounded","Avenir Next","Segoe UI",system-ui,sans-serif;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#101816;--panel:#18231f;--ink:#e6efec;--muted:#95a7a2;--line:#2a3833;--accent:#4fc4b0;--accent-ink:#062019;--on:#1d3a33;--warn:#e0a84e;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#101816;--panel:#18231f;--ink:#e6efec;--muted:#95a7a2;--line:#2a3833;--accent:#4fc4b0;--accent-ink:#062019;--on:#1d3a33;--warn:#e0a84e;color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font:16px/1.45 var(--sans);margin:0}
main{max-width:640px;margin:0 auto;padding-block:20px 48px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:flex;flex-direction:column;gap:22px}
h1{font-size:26px;line-height:1.15;margin:0;text-wrap:balance;letter-spacing:-.01em}
h2{font-size:13px;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin:0 0 8px;font-weight:700}
p{margin:0;max-width:62ch}.lede{color:var(--muted)}
button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
button:focus-visible,input:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.now{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--bg)}
.now-top{display:flex;gap:10px;align-items:center;justify-content:space-between}
.now-title{font-weight:700;min-width:0}.now-sub{color:var(--muted);font-size:13px}
.stop{border:1px solid var(--line);background:var(--bg);border-radius:999px;padding:8px 16px;font-weight:700;flex:none}
.vol{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--muted)}.vol input{flex:1;min-width:0;accent-color:var(--accent)}
.tracks{display:flex;flex-direction:column;gap:3px;font:12px/1.4 var(--mono);color:var(--muted);font-variant-numeric:tabular-nums}
.tracks b{color:var(--ink);font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}
.scene{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:11px 12px;text-align:left;display:flex;flex-direction:column;gap:2px;min-height:68px}
.scene b{font-size:15px}.scene span{font-size:12px;color:var(--muted);line-height:1.3}
.scene[aria-pressed="true"]{background:var(--on);border-color:var(--accent)}
.recs{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.rec{display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}
.rec div{min-width:0;flex:1}.rec b{font:600 13px var(--mono)}.rec p{font-size:14px}.rec small{color:var(--muted);font-size:12px;display:block;overflow-wrap:anywhere}
.play{flex:none;width:64px;border-radius:999px;border:1px solid var(--accent);background:transparent;color:var(--accent);padding:8px 0;font-weight:700;font-size:14px}
.play[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink)}
.note{font-size:13px;color:var(--muted)}.warn{color:var(--warn)}
`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export async function buildListen() {
  const L = manifest(), blocks = audioBlocks();
  const r = await build({ entryPoints: [path.join(ROOT, 'src/sim/_audio_bed.js')], bundle: true, format: 'iife', globalName: 'Bed', minify: true, write: false, target: 'es2020', legalComments: 'none' });
  const mixer = r.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
  const meta = {}; for (const s of L) meta[s.name] = { s: s.seconds, a: s.loopStart, b: s.loopEnd, desc: s.desc, place: s.place, src: s.source };
  let sc = '', n = 0; for (const [title, list] of SCENES) { sc += `<section><h2>${esc(title)}</h2><div class="grid">`; for (const [label, place, phase, sub, wx, room] of list) sc += `<button class="scene" id="scene-${n++}" aria-pressed="false" data-q="${esc(JSON.stringify({ place, phase, weather: wx || null, indoor: room || null }))}" data-label="${esc(label)}"><b>${esc(label)}</b><span>${esc(sub)}</span></button>`; sc += '</div></section>'; }
  let recs = ''; for (const s of L) recs += `<li class="rec"><button class="play" id="rec-${s.name}" aria-pressed="false" data-name="${s.name}" aria-label="Play ${esc(s.name)}">Play</button><div><b>${s.name}</b><p>${esc(s.desc)}</p><small>${Math.round(s.seconds)} s, from ${esc(s.source)}</small></div></li>`;
  const app = `
(function(){
var S=${JSON.stringify(meta)},$=function(i){return document.getElementById(i)},ac=null,mx=null,vol=null,cur=null,curLabel='';
function bytes(name){return new Promise(function(res,rej){setTimeout(function(){try{var b=atob($('amb-'+name).textContent),n=b.length,u=new Uint8Array(n);for(var i=0;i<n;i++)u[i]=b.charCodeAt(i);res(u.buffer)}catch(e){rej(e)}},0)})}
function load(name){return bytes(name).then(function(ab){return new Promise(function(res,rej){try{var p=ac.decodeAudioData(ab,res,rej);if(p&&p.catch)p.catch(function(){})}catch(e){rej(e)}})})}
function start(){if(ac){if(ac.state!=='running')ac.resume();return true}var C=window.AudioContext||window.webkitAudioContext;if(!C){$('now-sub').textContent='This browser has no Web Audio.';return false}
  ac=new C();var comp=ac.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=4;comp.connect(ac.destination);vol=ac.createGain();vol.gain.value=$('vol').value/100;vol.connect(comp);
  mx=new Bed.BedMixer(ac,vol,load,S);if(ac.state!=='running')ac.resume();setInterval(function(){if(ac.state==='running'){mx.tick(ac.currentTime);show()}},250);return true}
function press(id){var all=document.querySelectorAll('[aria-pressed]');for(var i=0;i<all.length;i++){var on=all[i].id===id;all[i].setAttribute('aria-pressed',on);if(all[i].classList.contains('play'))all[i].textContent=on?'Stop':'Play'}cur=id}
function stop(){if(mx){mx.force(null);mx.set(null)}press(null);curLabel='';$('now-title').textContent='Nothing playing';$('now-sub').textContent='Pick a place below.';$('tracks').textContent=''}
function show(){if(!cur)return;var st=mx.state(),h='';var tr=st.tracks.concat(st.fadingOut);for(var i=0;i<tr.length;i++){var t=tr[i],v=t.voices.map(function(v){return '<b>'+v.name+'</b> '+v.at.toFixed(0)+'/'+v.of.toFixed(0)+' s'+(v.fadingOut?' (fading out)':'')}).join(' + ');
    var nx=t.dying?'leaving':t.next?(t.next.stretch?(t.next.stretch.charAt(0)==='('?'moves on in ':'then '+t.next.stretch+' in ')+Math.max(0,t.next.in).toFixed(0)+' s':t.next.fadesOutIn!==undefined?'fades out in '+Math.max(0,t.next.fadesOutIn).toFixed(0)+' s':'comes in in '+Math.max(0,t.next.fadesInIn).toFixed(0)+' s'):'';
    h+='<div>'+t.id+' '+(t.db>0?'+':'')+t.db+' dB'+(t.lp?', muffled below '+t.lp+' Hz':'')+': '+(v||'(resting)')+(nx?' | '+nx:'')+'</div>'}
  $('tracks').innerHTML=h||'<div>(nothing at this level)</div>';var d=st.decoding.length?'Loading '+st.decoding.join(', ')+'... ':'',f=st.failed.length?'Could not load: '+st.failed.join(', ')+'. ':'';$('now-sub').innerHTML=(f?'<span class="warn">'+f+'</span>':'')+d+(st.master<1?'Whole bed at '+Math.round(st.master*100)+' %. ':'')+'The lines below change as it remixes.'}
document.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
  if(b.id==='stop'){stop();return}
  if(b.classList.contains('scene')){if(!start())return;if(cur===b.id){stop();return}press(b.id);curLabel=b.dataset.label;$('now-title').textContent=curLabel;mx.force(null);mx.set(Bed.sceneFor(JSON.parse(b.dataset.q)));show();return}
  if(b.classList.contains('play')){if(!start())return;if(cur===b.id){stop();return}press(b.id);$('now-title').textContent='One recording: '+b.dataset.name;mx.audition(b.dataset.name);show()}});
$('vol').addEventListener('input',function(){if(vol)vol.gain.setTargetAtTime(this.value/100,ac.currentTime,.05);$('vol-out').textContent=this.value});
})();`;
  const html = `<title>Maple Bay Soundcheck</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>${CSS}</style>
<main>
<header><h1>Maple Bay Soundcheck</h1><p class="lede">The city's background sound, made only from real recordings. Tap a place and leave it running: this page runs the same mixer as the game, so what you hear here is what the game will play there. Nobody on the team has heard any of it.</p></header>
<div class="now" aria-live="off"><div class="now-top"><div><div class="now-title" id="now-title">Nothing playing</div><div class="now-sub" id="now-sub">Pick a place below.</div></div><button class="stop" id="stop">Stop</button></div>
<label class="vol" for="vol">Volume <input type="range" id="vol" min="0" max="100" step="5" value="80"><span id="vol-out">80</span></label><div class="tracks" id="tracks"></div></div>
${sc}
<section><h2>The ${L.length} recordings, one at a time</h2><p class="note">Each is a cut of 29 to 60 seconds that loops without a seam. If one bothers you (hiss, a voice, a horn that keeps coming back), tell us its name and it goes.</p><ul class="recs">${recs}</ul></section>
<p class="note">All recordings are public domain or CC0 (Wikimedia Commons, Internet Archive). There is no rain recording yet and only one 29-second take of waves. Indoors, on the train and in cars the game keeps the sounds it already had.</p>
</main>
${blocks.html}<script>${mixer}</script>
<script>${app}</script>
`;
  const out = path.join(ROOT, 'docs/audio/listen.html'); fs.writeFileSync(out, html);
  console.log('docs/audio/listen.html', (html.length / 1e6).toFixed(2) + ' MB, ' + n + ' scene buttons, ' + L.length + ' recordings'); return out;
}
