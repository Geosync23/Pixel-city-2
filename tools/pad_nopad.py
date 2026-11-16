# Usage: python3 tools/pad_nopad.py <empty dir>; then (cd <dir> && node tools/build.mjs); then node tools/pad_touch_check.mjs <dir>/dist
# Builds a copy of the working tree WITHOUT controller support (the new files removed, every PAD HOOK reversed) for the touch A/B comparison.
import os, shutil, sys, re
SRC='/home/user/Pixel-city-2'; DST=sys.argv[1]
if os.path.exists(DST): shutil.rmtree(DST)
os.makedirs(DST)
for d in ['src','assets','tools']: shutil.copytree(os.path.join(SRC,d), os.path.join(DST,d))
for f in ['index.html','package.json']: shutil.copy(os.path.join(SRC,f), os.path.join(DST,f))
os.symlink(os.path.join(SRC,'node_modules'), os.path.join(DST,'node_modules'))
os.makedirs(os.path.join(DST,'docs/audio')); os.symlink(os.path.join(SRC,'docs/audio/game'), os.path.join(DST,'docs/audio/game'))   # the ambience recordings: the same audio in both builds
for f in ['src/core/pad.js','src/ui/padnav.js','src/ui/padnav.css','src/art/icons/pad.js','tools/pad_check.mjs','tools/pad_lib.mjs']:
    p=os.path.join(DST,f); os.path.exists(p) and os.remove(p)
def rep(f, a, b, n=1):
    p=os.path.join(DST,f); s=open(p).read(); assert s.count(a)==n, (f, a[:70], s.count(a)); open(p,'w').write(s.replace(a,b))
def resub(f, pat, b, n=1):
    p=os.path.join(DST,f); s=open(p).read(); s2,k=re.subn(pat,b,s); assert k==n,(f,pat[:60],k); open(p,'w').write(s2)
rep('src/ui/kit.js', "else if (k.startsWith('on')) { if (v) { e.addEventListener(k.slice(2), v); if (k === 'onclick' || k === 'onpointerdown' || k === 'onpointerup') e._pn = 1; /* PAD HOOK (ui/padnav.js): this element can be pressed, so a controller / the arrow keys can focus it */ } }", "else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);")
resub('src/ui/hud.js', r", el\('i\.pg', \{ 'data-pg': 'y' \}\) /\* PAD HOOK[^*]*\*/\)", ")")
resub('src/ui/hud.js', r"el\('i\.pg', \{ 'data-pg': 'ok' \}\), ", "")
resub('src/ui/hud.js', r", el\('i\.pg', \{ 'data-pg': '(x|start)' \}\)\)", ")", 2)
rep('src/ui/hud.js', "it = G.pad && G.pad.active && G.padnav ? G.padnav.target() : G.nearestInteractable(); /* PAD HOOK: with a controller the prompt names the highlighted target */ }", "it = G.nearestInteractable(); }")
resub('src/ui/talk.js', r" 'data-pad': 'line' /\* PAD HOOK[^*]*\*/,", "")
resub('src/ui/chapters_ui.js', r" 'data-pad': 'aside' /\* PAD HOOK \*/,", "")
resub('src/ui/chapters_ui.js', r" 'data-pad': 'aside',", "")
resub('src/ui/chapters_ui.js', r"el\('div\.chd-text', \{ 'data-pad': 'line' /\* PAD HOOK[^*]*\*/ \}\)", "el('div.chd-text')")
resub('src/sim/firsttime.js', r" 'data-pad': 'default' /\* PAD HOOK[^*]*\*/,", "")
resub('src/ui/furnish.js', r"  /\* PAD HOOK \(ui/padnav\.js\): the room between[^\n]*\n  M\.padS = [^\n]*\n", "")
resub('src/ui/furnish.js', r"  if \(m\.padS\) m\.padS\(\);   /\* PAD HOOK \*/\n", "")
resub('src/ui/phone_settings.js', r"    /\* Controller \(owner msg 143\)[^\n]*\n    safe\(\(\) => G\.padnav\.settings\(b, ctx\), 0\);\n", "")
resub('src/core/game.js', r"      /\* PAD HOOK \(core/pad\.js[^\n]*\n      let pmag = 1;[^\n]*\n", "")
rep('src/core/game.js', "p.move(G.world, sdt * pmag, steer);", "p.move(G.world, sdt, steer);")
resub('src/core/game.js', r", lk = G\.camLook /\* PAD HOOK[^*]*\*/; G\.cam\.fx \+= \(a\[0\] \+ \(lk \? lk\.x : 0\) - G\.cam\.fx\) \* k; G\.cam\.fy \+= \(a\[1\] - 14 \+ \(lk \? lk\.y : 0\) - G\.cam\.fy\) \* k;", "; G.cam.fx += (a[0] - G.cam.fx) * k; G.cam.fy += (a[1] - 14 - G.cam.fy) * k;")
resub('src/sim/_jobplay_kit.js', r" 'data-pad': 'aside' /\* PAD HOOK[^*]*\*/,", "")
resub('src/ui/minigame.js', r" 'data-pad': 'aside' /\* PAD HOOK[^*]*\*/,", "")
resub('src/ui/minigame.js', r" 'data-pad': 'aside',", "", 2)
left=os.popen("grep -rn 'PAD HOOK\\|padnav\\|data-pad\\|\\.pg\\b' %s/src | grep -v modules.gen | head" % DST).read()
print('leftovers:', left or 'none')
