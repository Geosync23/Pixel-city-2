// Builds docs/audio/jukebox.html: the owner's listening page for the background music.   node tools/music_jukebox.mjs
// Self-contained (no external requests), phone-friendly, light / dark. It carries the SAME source files the game plays with
// (src/sim/_music_synth.js, _music_engine.js, _music_songs_*.js, _music_pools.js, _music_levels.js), inlined with their import / export words removed.
import fs from 'node:fs'; import path from 'node:path';
import { ROOT } from './artfiles.mjs';
const FILES = ['_music_synth.js', '_music_songs_a.js', '_music_songs_b.js', '_music_songs_c.js', '_music_songs_d.js', '_music_songs.js', '_music_levels.js', '_music_engine.js', '_music_pools.js'];
/* the classics (src/sim/_music_classic.js) run on the old synth helpers (_audio_lib.js): both go in their own scope, so their names cannot meet the songbook's */
const strip = f => fs.readFileSync(path.join(ROOT, 'src/sim', f), 'utf8').replace(/^import [^\n]*\n/gm, '').replace(/^export /gm, '');
const classicCode = 'var CLASSIC = (function () {\n/* ---- src/sim/_audio_lib.js ---- */\n' + strip('_audio_lib.js') + '\n/* ---- src/sim/_music_classic.js ---- */\n' + strip('_music_classic.js') + '\nreturn { CLASSICS: CLASSICS, IDS: CLASSIC_IDS, TRACKS: TRACKS, ClassicPlayer: ClassicPlayer, useContext: useContext };\n})();';
const code = FILES.map(f => '/* ---- src/sim/' + f + ' ---- */\n' + fs.readFileSync(path.join(ROOT, 'src/sim', f), 'utf8').replace(/^import [^\n]*\n/gm, '').replace(/^export /gm, '')).join('\n');
const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Maple Bay Jukebox</title>
<style>
:root{--bg:#f6f1e7;--card:#fffdf8;--ink:#2b2622;--muted:#756b60;--line:#d9cfbf;--accent:#b4532a;--accent-ink:#fff;--on:#1f7a5a}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#191715;--card:#23201d;--ink:#efe8dc;--muted:#a79c8e;--line:#3a352f;--accent:#e08a5b;--accent-ink:#1b1410;--on:#6fd0a8}}
:root[data-theme="dark"]{--bg:#191715;--card:#23201d;--ink:#efe8dc;--muted:#a79c8e;--line:#3a352f;--accent:#e08a5b;--accent-ink:#1b1410;--on:#6fd0a8}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:0 16px 150px}
main{max-width:720px;margin:0 auto}
h1{font-size:26px;margin:22px 0 4px;letter-spacing:-.01em}h2{font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:28px 0 8px}
p.lead{margin:0 0 6px;color:var(--muted)}p.note{font-size:14px;color:var(--muted);margin:6px 0 0}
.tune{display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:8px 0}
.tune.on{border-color:var(--on);box-shadow:0 0 0 2px var(--on) inset}
.tune b{font-size:17px;display:block}.tune .meta{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}.tune .where{grid-column:1/-1;font-size:13px;color:var(--muted)}
button{font:inherit;font-weight:700;border:0;border-radius:999px;min-width:76px;min-height:44px;padding:0 16px;background:var(--accent);color:var(--accent-ink);cursor:pointer}
button.stop{background:var(--on);color:var(--bg)}button.ghost{background:transparent;color:var(--ink);border:1px solid var(--line)}
#bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:10px 16px calc(10px + env(safe-area-inset-bottom))}
#bar .in{max-width:720px;margin:0 auto;display:grid;grid-template-columns:1fr auto auto;gap:6px 10px;align-items:center}
#now{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#sub{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
#prog{grid-column:1/-1;height:6px;border-radius:3px;background:var(--line);overflow:hidden}#prog i{display:block;height:100%;width:0;background:var(--on)}
label.vol{grid-column:1/-1;display:flex;gap:10px;align-items:center;font-size:13px;color:var(--muted)}label.vol input{flex:1;accent-color:var(--accent);height:28px}
</style></head><body><main>
<h1>Maple Bay Jukebox</h1>
<p class="lead">The eight Classics (the game's original loops) and <span id="count"></span> hand-written tunes, grouped by where the game plays them. Tap Play. Nothing here is a recording: every note is made on your device by the same code as the game.</p>
<p class="note">On an iPhone, switch the silent switch off (or use headphones) and turn the volume up. One tune plays at a time; "Play all" walks through the list.</p>
<div id="list"></div>
</main>
<div id="bar"><div class="in"><div><div id="now">Nothing playing</div><div id="sub">Pick a tune above.</div></div><button class="ghost" id="all">Play all</button><button class="stop" id="stop">Stop</button><div id="prog"><i></i></div><label class="vol">Volume <input id="vol" type="range" min="0" max="100" value="70" aria-label="Volume"></label></div></div>
<script>
(function(){
${code}
${classicCode}
/* ---- the page ---- */
var KEYS=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'],keyOf=function(S){return KEYS[(((S.tr||0)%12)+12)%12]+(S.min?' minor':'')},mmss=function(s){return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0')};
var GROUPS=[['title','Title screen'],['out:dawn','Outdoors: dawn'],['out:morning','Outdoors: morning'],['out:midday','Outdoors: midday'],['out:afternoon','Outdoors: afternoon'],['out:golden','Outdoors: golden hour'],['out:evening','Outdoors: evening'],['out:late','Outdoors: late night'],['weather','Weather'],['season','Seasons'],
 ['cafe','Cafes'],['diner','Diners'],['bar','Bars'],['shop','Shops'],['gym','Gym'],['library','Library and museum'],['hotel','Hotel'],['home','At home'],['ride','Rides: cab, bus, train, plane'],['work','Work shifts'],['special','Date night, family, festival days']];
var OUTN=SONGS_A.length+SONGS_B.length,MAP={rain:'weather',storm:'weather',snow:'weather',fog:'weather',heat:'weather',museum:'library',home_am:'home',home_late:'home',home_rain:'home',room:'home',cab:'ride',bus:'ride',train:'ride',plane:'ride',office:'work',date:'special',family:'special',festival:'special'};
function groupOf(S,i){var pl=(S.pl||'').split(/\\s+/).filter(Boolean);if(pl.indexOf('title')>=0)return'title';if(S.sea!==undefined)return'season';if(S.out&&i<OUTN){var t=S.out.split('|')[0];return'out:'+(t==='*'?'midday':t.split(' ')[0])}var p=pl[0]||'home';return MAP[p]||p}
var ctx=null,bus=null,send=null,player=null,cur=null,timer=null,queue=null,rows={};
function unlock(){if(!ctx){var C=window.AudioContext||window.webkitAudioContext;if(!C)return false;ctx=new C();var comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=4;comp.connect(ctx.destination);bus=ctx.createGain();bus.connect(comp);setVol();send=echo(ctx,bus)}if(ctx.state==='suspended')ctx.resume();return true}
function setVol(){if(bus)bus.gain.value=Math.pow(document.getElementById('vol').value/100,1.6)*.9}
function stop(keepQueue){if(player){player.stop(.25);player=null}if(cur&&rows[cur])mark(cur,false);cur=null;if(!keepQueue)queue=null;show()}
function mark(id,on){var r=rows[id];r.el.classList.toggle('on',on);r.btn.textContent=on?'Stop':'Play';r.btn.className=on?'stop':''}
var csend=null;function songOf(id){return SONG[id]||CLASSIC.CLASSICS[id]}
function play(id){if(!unlock()){document.getElementById('sub').textContent='This browser has no Web Audio.';return}stop(true);var S=songOf(id);if(S.classic){if(!csend)csend=CLASSIC.useContext(ctx,bus);player=new CLASSIC.ClassicPlayer(ctx,id,bus,csend,{db:CLASSIC_LEVELS[id]||0,fade:1})}else player=new Player(ctx,S,bus,send,{db:LEVELS[id]||0});cur=id;mark(id,true);tick();if(!timer)timer=setInterval(tick,90);show()}
function tick(){if(!player)return;player.schedule(ctx.currentTime+.6);if(player.done&&ctx.currentTime>player.next+.3){var was=cur;stop(true);if(queue){var i=queue.indexOf(was);if(i>=0&&i+1<queue.length)play(queue[i+1]);else queue=null}}show()}
function show(){var n=document.getElementById('now'),s=document.getElementById('sub'),p=document.querySelector('#prog i');if(!player||!cur){n.textContent='Nothing playing';s.textContent='Pick a tune above.';p.style.width='0';return}var S=songOf(cur),q=player.pos();n.textContent=S.title;s.textContent=mmss(q.t)+' / '+mmss(q.dur)+'  ·  '+S.feel+(q.section?'  ·  '+(S.classic?'':'part ')+q.section:'');p.style.width=Math.min(100,100*q.t/q.dur)+'%'}
var list=document.getElementById('list'),by={},order=[];
(function(){var h=document.createElement('h2');h.textContent='Classics ('+CLASSIC.IDS.length+')';list.appendChild(h);var p=document.createElement('p');p.className='note';p.textContent='The original eight loops, back exactly as they were. On the first day of a new game only these play, each in its old place; from day two they join the pools of their places and come up about twice as often as other tunes (Indoors and Daytime Streets about 2.5 times). Each plays its loop two or three times with small changes, as before; here it plays until it ends.';list.appendChild(p);
 CLASSIC.IDS.forEach(function(id){var S=CLASSIC.CLASSICS[id],T=CLASSIC.TRACKS[S.k],d=document.createElement('div');d.className='tune';var a=document.createElement('div'),b=document.createElement('b');b.textContent=S.title;var m=document.createElement('div');m.className='meta';m.textContent=KEYS[T.key%12]+(T.mode==='minor'?' minor':'')+'  ·  '+T.bpm+' bpm  ·  4/4  ·  '+Math.round(S.loop)+' s a time round';a.appendChild(b);a.appendChild(m);
 var bt=document.createElement('button');bt.textContent='Play';bt.setAttribute('aria-label','Play '+S.title);bt.onclick=function(){if(cur===id)stop();else{queue=null;play(id)}};
 var w=document.createElement('div');w.className='where';w.textContent='Plays: '+whereOf(id)+'.';d.appendChild(a);d.appendChild(bt);d.appendChild(w);list.appendChild(d);rows[id]={el:d,btn:bt};order.push(id)})})();SONGS.forEach(function(S,i){var g=groupOf(S,i);(by[g]=by[g]||[]).push(S)});
GROUPS.forEach(function(G){var L=by[G[0]];if(!L)return;var h=document.createElement('h2');h.textContent=G[1]+' ('+L.length+')';list.appendChild(h);L.forEach(function(S){var c=compile(S),d=document.createElement('div');d.className='tune';
 var a=document.createElement('div'),b=document.createElement('b');b.textContent=S.title;var m=document.createElement('div');m.className='meta';m.textContent=S.feel+'  ·  '+keyOf(S)+'  ·  '+S.bpm+' bpm  ·  '+(S.mt||'4/4')+'  ·  '+mmss(c.dur);a.appendChild(b);a.appendChild(m);
 var bt=document.createElement('button');bt.textContent='Play';bt.setAttribute('aria-label','Play '+S.title);bt.onclick=function(){if(cur===S.id)stop();else{queue=null;play(S.id)}};
 var w=document.createElement('div');w.className='where';w.textContent='Plays: '+whereOf(S.id)+'.  Instruments: '+c.info.ins.map(function(i){return INST[i]?INST[i].name:i}).join(', ')+(c.info.kit?', light drums':'')+'.';
 d.appendChild(a);d.appendChild(bt);d.appendChild(w);list.appendChild(d);rows[S.id]={el:d,btn:bt};order.push(S.id)})});
document.getElementById('count').textContent=SONGS.length;document.getElementById('stop').onclick=function(){stop()};document.getElementById('vol').oninput=setVol;
document.getElementById('all').onclick=function(){queue=order.slice();play(cur&&order.indexOf(cur)+1<order.length?order[order.indexOf(cur)+1]:order[0])};
document.addEventListener('visibilitychange',function(){if(ctx&&!document.hidden&&ctx.state==='suspended')ctx.resume()});
window.__jukebox={CLASSICS:CLASSIC.IDS,SONGS:SONGS,play:play,stop:stop,state:function(){return{cur:cur,ctx:ctx?ctx.state:'none',pos:player?player.pos():null}}};
})();
</script></body></html>
`;
const out = path.join(ROOT, 'docs/audio/jukebox.html'); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, PAGE);
console.log('docs/audio/jukebox.html ' + (PAGE.length / 1024).toFixed(0) + ' KB');
