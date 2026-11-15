#!/usr/bin/env python3
"""Cuts the game-ready ambience STRETCHES out of the recordings (docs/audio/in/*.mp3 + docs/audio/L_*.mp3).
Run:  python3 docs/audio/tools/make_library.py            (needs python3 + numpy, ffmpeg with libmp3lame)
Out:  docs/audio/game/<name>.mp3  +  docs/audio/game/manifest.json   (then: node tools/audio_pack.mjs)

Every stretch: mono, high-pass 80 Hz (rumble), low-pass where the source has nothing but hiss above, slow level riding (halves
the long swings so a random entry point is never a jump), loudness-matched, peak-limited, and PERIODIC: the body of L seconds is
closed with an equal-power crossfade of X seconds, then written as  [0.3 s pre-roll][L s body][0.3 s post-roll]  where pre- and
post-roll are the neighbouring part of the same cycle. The player loops loopStart=0.3 .. loopEnd=0.3+L, so whatever delay an MP3
decoder adds (Safari keeps the encoder padding, Chrome trims it) the loop point always lands inside periodic material: no seam.
"""
import numpy as np, subprocess, json, os, sys, re
HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.dirname(HERE); OUT = os.path.join(AUD, 'game'); TMP = os.environ.get('AMB_TMP', '/tmp/amb_lib')
SR = 44100; ROLL = 0.3; TARGET = -23.0; PEAK = -3.0
os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)

# name: (source, [segments (t0, t1) in source seconds, joined with a 1.5 s crossfade], X seam seconds, low-pass Hz, place, description, cuts)
ENC_SR = 24000; VBR = '8'   # MP3 (MPEG-2 Layer III) 24 kHz mono, LAME VBR -V8: see docs/reports/ambience.md for the codec measurements
S = {
 'busy_a':   ('in/G16_17_Busy_Downtown_City_Traffic.mp3', [(14, 68)], 4, 7000, 'busy street', 'Busy downtown traffic, a few horns (old film-library take)', 'first 14 s (slate burst at 0-2 s, 30 dB hole and a click to 8 s); last 37 s (the same horn figure returns twice more)'),
 'busy_b':   ('in/G16_19_Medium_Perspective_City_Traffic.mp3', [(6, 55)], 4, 7000, 'busy street', 'City traffic from half a block away', 'first 6 s (slate burst); last 31 s (size; it ends in a loud burst, crest 18)'),
 'busy_c':   ('L_streetA.mp3', [(1, 55)], 4, 8000, 'busy street', 'Sunday city street, take 1 (the owner heard this one in the test page)', 'last 23 s (chirping squeals / calls in the foreground at 60-72 s, speech-proxy 0.6 vs 0.1; and the old loop seam)'),
 'busy_d':   ('L_streetB.mp3', [(2, 56)], 4, 8000, 'busy street', 'Sunday city street, take 2 (the owner heard this one in the test page)', 'last 34 s (the quiet tail, old loop seam, click at the end)'),
 'light_a':  ('in/AMBTraf_Light_traffic_on_Sunset_Blvd_CS_USC.mp3', [(1, 56)], 5, 7000, 'light street', 'Light traffic on a boulevard, single cars passing', 'hiss bursts above 10 kHz (low-passed at 7.5 kHz); last 26 s (a 10 dB quiet patch)'),
 'light_b':  ('in/AMBTraf_Light_traffic_with_a_few_streetcars_voices_CS_USC.mp3', [(1, 49)], 3, 7000, 'light street', 'Light traffic with a streetcar going by', 'everything after 0:49: voices in the foreground at 0:50-1:20 (speech-proxy up to 0.49, harmonic stacks in the spectrogram)'),
 'light_c':  ('in/G18_09_Trolley_on_Street.mp3', [(3, 63)], 4, 7000, 'light street', 'A trolley on a quiet street: bell, then it rolls past', 'first 3 s (slate burst); last 3 s'),
 'resid_a':  ('in/CarsAndBirdsong.mp3', [(2, 21.5), (30.5, 64)], 4, 8000, 'quiet residential', 'A few cars and a bird singing close by', 'first 2 s (silence + click, crest 45); 21.5-30.5 s (the recording drops 18 dB to near silence); fade-out after 64 s'),
 'resid_b':  ('in/AMBTraf_Distant_traffic_rumble_CS_USC.mp3', [(1, 51)], 5, 2500, 'far-off city', 'Distant traffic rumble, nothing close', 'a thin whine near 6-7 kHz from 0:20 on (low-passed at 3 kHz; 99.9 % of the energy is below 1.3 kHz); last 16 s (size, click at the end)'),
 'park_a':   ('meadow', [(1, 55)], 4, 9500, 'park', 'Meadow birds, first minute', 'the 30-second wind/hiss loop that the source mix repeats 12 times (subtracted); everything above 9.5 kHz (hiss; costs the highest bird calls their top), see docs/reports/ambience.md'),
 'park_b':   ('meadow', [(60.5, 114.5)], 4, 9500, 'park', 'Meadow birds, second minute', 'as park_a'),
 'park_c':   ('meadow', [(120, 174)], 4, 9500, 'park', 'Meadow birds, third minute', 'as park_a; minutes 4-6 of the source are a repeat of 1-3 (not used)'),
 'harbor_a': ('L_beach.mp3', [(0.5, 32.5)], 3, 9000, 'harbor', 'Waves on a pebble beach (only 33 s exist)', 'nothing (short source)'),
 'gulls':    ('L_gulls.mp3', [(0.5, 47.5)], 4, 7000, 'harbor layer', 'Gulls calling overhead', 'nothing'),
 'market_a': ('in/AMBPubl_Crowd_walla_at_outdoor_farmers_market_CS_USC.mp3', [(0.5, 17.6), (20.4, 66)], 4, 6000, 'market', 'Crowd murmur at an outdoor farmers\' market (no words can be made out: walla)', '17.6-20.4 s (a bang: crest 22 vs 6); clicks above 8 kHz (low-passed at 6 kHz)'),
 'crickets_a': ('in/G16_07_Crickets_Near_and_Far.mp3', [(6, 70)], 4, 8000, 'night', 'Crickets near and far', 'first 6 s (slate burst + hole); the second half is not used (size)'),
 'night_air': ('in/BackStairwellEvening.mp3', [(9, 41), (45.5, 63)], 4, 6000, 'night', 'Evening air in a back stairwell: far-off hum, small ticks', 'first 9 s and 41-45.5 s (the same loud event twice, speech-proxy 1.3); the second half (splice at 1:20, a bang at 2:06, crest 26); a steady band at 11-16 kHz that carries most of the energy and reads as whine/hiss (low-passed at 7 kHz)'),
 'airport_a': ('in/G16_02_Outdoor_Airport_Ambience.mp3', [(3, 62)], 4, 7000, 'airport', 'Outdoor airport: engines idling and taxiing', 'first 3 s (slate burst); the second half is not used (size)'),
 'airport_c': ('in/G16_01_Small_Airport_Ambience.mp3', [(18.5, 69.5)], 4, 7000, 'airport', 'Small airfield, a propeller plane', 'first 18 s (slate burst, then 16 s at -12 dB)'),
 'rain_a':   ('in/R30_24_Rain_on_Roof_and_Concrete.mp3', [(3, 62)], 4, 8000, 'rain', 'Rain on a roof and on concrete: the lighter, pattering rain', 'first 3 s; last 24 s (size): the take is steady throughout (crest 4)'),
 'rain_b':   ('in/R30_25a_Steady_Heavy_Rain.mp3', [(1, 39)], 4, 8000, 'rain', 'Steady heavy rain', 'last 7 s (size)'),
 'rain_c':   ('in/R23_35_Rain_with_Wind.mp3', [(4, 42)], 4, 8000, 'storm', 'Rain driven by wind', 'first 4 s (louder start, speech-proxy 0.35); last 4 s (fade)'),
 'storm_a':  ('in/G46_04_Distant_Storm.mp3', [(10, 48)], 4, 2500, 'storm layer', 'Thunder rolling far away (no close claps)', 'first 10 s (slate burst, hole); everything after 0:48 (30 dB holes at 0:48 and 1:02-1:10; size). Low-passed at 2.5 kHz: 99.9 % of it is below 1.2 kHz'),
}

def ff(args, **kw): return subprocess.run(['ffmpeg', '-v', 'error', '-nostdin'] + args, capture_output=True, **kw)
_cache = {}
def load(src):
    if src in _cache: return _cache[src]
    if src == 'meadow':
        a = load('in/meadow_6min.mp3'); P = 30 * SR; n = len(a) // P   # the source mix repeats one layer every 30.000 s (sample exact): estimate it as the mean of the 12 cycles and take it out
        p = a[:n * P].reshape(n, P).mean(0); a = a[:n * P] - np.tile(p, n)
    else:
        r = ff(['-i', os.path.join(AUD, src), '-map', '0:a:0', '-ac', '1', '-ar', str(SR), '-f', 'f64le', '-']); a = np.frombuffer(r.stdout, dtype=np.float64).copy()
    _cache[src] = a; return a
def xf(n): t = (np.arange(n) + .5) / n; return np.sin(t * np.pi / 2), np.cos(t * np.pi / 2)   # equal power in, out
def join(parts, sec=1.5):
    out = parts[0]; n = int(sec * SR)
    for p in parts[1:]:
        i, o = xf(n); out = np.concatenate([out[:-n], out[-n:] * o + p[:n] * i, p[n:]])
    return out
def periodic(a, X):
    """a has L + X seconds; the first X seconds become a crossfade of the tail (fading out) into the head (fading in)."""
    n = int(X * SR); L = len(a) - n; i, o = xf(n); body = a[:L].copy(); body[:n] = a[:n] * i + a[L:L + n] * o; return body
def fftfilt(a, hp=80, lp=None, order=4, lorder=8):
    A = np.fft.rfft(a); f = np.fft.rfftfreq(len(a), 1 / SR); f[0] = 1e-9
    H = 1 / np.sqrt(1 + (hp / f) ** (2 * order))
    if lp: H = H / np.sqrt(1 + (f / lp) ** (2 * lorder))
    return np.fft.irfft(A * H, len(a))
def ride(a, win=6.0, ratio=.5, lim=6.0):
    """slow level riding: circular RMS over `win` seconds; gain = (mean level / local level) ** ratio, at most +-lim dB."""
    n = int(win * SR); k = np.hanning(n); k /= k.sum(); p = a * a
    P = np.fft.irfft(np.fft.rfft(p) * np.fft.rfft(np.roll(np.pad(k, (0, len(a) - n)), -n // 2)), len(a)); P = np.maximum(P, 1e-12)
    ref = np.exp(np.log(P).mean()); g = (ref / P) ** (ratio / 2); m = 10 ** (lim / 20); return a * np.clip(g, 1 / m, m)
def wav(path, a, sr=SR):
    ff(['-y', '-f', 'f64le', '-ar', str(sr), '-ac', '1', '-i', '-', '-c:a', 'pcm_s24le', path], input=a.astype(np.float64).tobytes())
def lufs(path, pre=''):
    r = subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-nostats', '-i', path, '-af', pre + 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
    g = lambda k: float(re.findall(k + r':\s+(-?[\d.]+)', r)[-1]); return g('I'), g('LRA'), g('Peak')
def limit(a, peak_db):
    th = 10 ** (peak_db / 20) * .8; top = 10 ** (peak_db / 20); x = np.abs(a); over = x > th
    y = a.copy(); y[over] = np.sign(a[over]) * (th + (top - th) * np.tanh((x[over] - th) / (top - th))); return y, int(over.sum())

def build(name):
    src, segs, X, lp, place, desc, cuts = S[name]; sr = ENC_SR; a = load(src)
    raw = join([a[int(t0 * SR):int(t1 * SR)] for t0, t1 in segs]); body = periodic(raw, X); L = len(body) / SR
    body = fftfilt(body, 80, lp, 4, 8); w0 = os.path.join(TMP, name + '_pre.wav'); wav(w0, body); lra0 = lufs(w0)[1]
    body = ride(body); w1 = os.path.join(TMP, name + '_body.wav'); wav(w1, body)
    # loudness: K-weighted, measured after a 150 Hz high-pass (what a phone speaker gives back), but never above TARGET + 3 full-band
    i_ph = lufs(w1, 'highpass=f=150,')[0]; i_full = lufs(w1)[0]; g = min(TARGET - i_ph, TARGET + 3 - i_full)
    body, nlim = limit(body * 10 ** (g / 20), PEAK); r = int(ROLL * SR); full = np.concatenate([body[-r:], body, body[:r]])
    w2 = os.path.join(TMP, name + '.wav'); wav(w2, full); wav(w1, body); I, LRA, PK = lufs(w1); Iph = lufs(w1, 'highpass=f=150,')[0]
    mp3 = os.path.join(OUT, name + '.mp3')
    e = ff(['-y', '-i', w2, '-map_metadata', '-1', '-ar', str(sr), '-ac', '1', '-c:a', 'libmp3lame', '-q:a', VBR, '-compression_level', '2', '-id3v2_version', '0', '-write_id3v1', '0', mp3])
    if e.returncode: raise SystemExit(e.stderr.decode())
    return dict(name=name, place=place, desc=desc, source=os.path.basename(src) if src != 'meadow' else 'meadow_6min.mp3 (minus its 30 s loop layer)', segments=segs, seam=X, lowpass=lp,
                seconds=round(L, 2), loopStart=ROLL, loopEnd=round(ROLL + L, 4), sampleRate=sr, kbps=round(os.path.getsize(mp3) * 8 / (L + 2 * ROLL) / 1000, 1), bytes=os.path.getsize(mp3),
                lufs=I, lufs_phone=Iph, lra=LRA, lra_source=lra0, peak=PK, limited_samples=nlim, gain_db=round(g, 1), cut=cuts)

if __name__ == '__main__':
    names = [n for n in sys.argv[1:] if n in S] or list(S)
    mpath = os.path.join(OUT, 'manifest.json'); man = {m['name']: m for m in json.load(open(mpath))['stretches']} if os.path.exists(mpath) else {}
    for n in names:
        m = build(n); man[n] = m
        print('%-11s %5.1fs %6d B %4.1fk/%dk  I %.1f (phone %.1f) LRA %.1f<-%.1f pk %.1f lim %d gain %+.1f' % (n, m['seconds'], m['bytes'], m['kbps'], m['sampleRate'] // 1000, m['lufs'], m['lufs_phone'], m['lra'], m['lra_source'], m['peak'], m['limited_samples'], m['gain_db']))
    out = [man[n] for n in S if n in man]
    json.dump(dict(target_lufs=TARGET, roll=ROLL, stretches=out), open(mpath, 'w'), indent=1)
    print('total %.0f s, %d bytes (%.2f MB, base64 %.2f MB)' % (sum(m['seconds'] for m in out), sum(m['bytes'] for m in out), sum(m['bytes'] for m in out) / 1e6, sum(m['bytes'] for m in out) * 4 / 3 / 1e6))
