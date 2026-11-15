// Private: procedural ambience beds for src/sim/audio.js.
// LAYERS are continuous noise/osc beds (created on demand, crossfaded, stopped when silent);
// PROFILES mix layers + random one-shot events (sfx names with a mean interval in seconds and a volume).
import { A, gain, filt, loopNoise, lfo } from './_audio_lib.js';

// build(out) -> array of sources to stop later. Each layer gets its own gain node in front of `out`.
const LAYERS = {
  traffic: o => { const f = filt(o, 'lowpass', 220), g = gain(f, 1); return [loopNoise(g, 'brown'), lfo(g.gain, .06, .35), loopNoise(filt(gain(o, .12), 'bandpass', 450, .6), 'pink')]; },
  air: o => { const g = gain(filt(o, 'bandpass', 650, .5), .5); return [loopNoise(g, 'pink', .9), lfo(g.gain, .045, .25)]; },
  leaves: o => { const g = gain(filt(o, 'highpass', 2600), .25); return [loopNoise(g, 'pink'), lfo(g.gain, .17, .2), lfo(g.gain, .07, .1)]; },
  waves: o => { const f = filt(o, 'lowpass', 650), g = gain(f, .5); const f2 = filt(gain(o, .2), 'bandpass', 1400, .4), g2 = gain(f2, .5); return [loopNoise(g, 'pink'), lfo(g.gain, .11, .48), loopNoise(g2, 'white', .8), lfo(g2.gain, .11, .45), lfo(f.frequency, .11, 250)]; },
  jet: o => { const g = gain(filt(o, 'bandpass', 1900, 3), .8); const w = A.ctx.createOscillator(); w.frequency.value = 3150; w.connect(gain(o, .006)); w.start(); return [loopNoise(g, 'pink'), lfo(g.gain, .03, .3), w, lfo(w.frequency, .05, 40)]; },
  room: o => [loopNoise(filt(gain(o, .6), 'lowpass', 260), 'brown')],
  hvac: o => { const h = A.ctx.createOscillator(); h.frequency.value = 120; h.connect(gain(o, .03)); h.start(); return [h, loopNoise(filt(gain(o, .35), 'lowpass', 520), 'pink', .8)]; },
  murmur: o => { const a = gain(filt(o, 'bandpass', 650, 1.3), .5), b = gain(filt(o, 'bandpass', 1150, 1.6), .3); return [loopNoise(a, 'pink'), loopNoise(b, 'pink', 1.1), lfo(a.gain, 2.7, .25), lfo(b.gain, 3.9, .18), lfo(a.gain, .23, .15)]; },
  rain: o => [loopNoise(filt(filt(gain(o, .35), 'lowpass', 7500), 'highpass', 900), 'white'), loopNoise(filt(gain(o, .45), 'lowpass', 1400), 'pink')],
  rumble: o => { const g = gain(filt(o, 'lowpass', 95), 1); return [loopNoise(g, 'brown'), lfo(g.gain, .3, .2)]; },
  hush: o => [loopNoise(filt(gain(o, .5), 'lowpass', 380), 'pink', .7)],
  engine: o => { const e = A.ctx.createOscillator(); e.type = 'triangle'; e.frequency.value = 52; e.connect(filt(gain(o, .08), 'lowpass', 200)); e.start(); return [e, lfo(e.frequency, .2, 4), loopNoise(filt(gain(o, .6), 'lowpass', 150), 'brown')]; },
};
export const CITY_BED = false;
export const LAYER_NAMES = Object.keys(LAYERS);
const WEATHER_LAYERS = { rain: 1, rumble: 1, hush: 1 };

// layers: level 0..1; ev: [sfxName, meanIntervalSeconds, volume, regular?]
export const PROFILES = {
  city_day: { layers: { traffic: .55, air: .25 }, ev: [['horn_far', 28, .35], ['chirp', 14, .35], ['whoosh', 16, .25], ['bike_bell', 90, .2], ['bark', 140, .15], ['buoy', 400, .1]] },
  city_night: { layers: { traffic: .25, air: .18 }, ev: [['cricket', 2.5, .3], ['whoosh', 35, .18], ['meow', 160, .15], ['horn_far', 90, .15]] },
  suburb: { layers: { traffic: .2, air: .3, leaves: .25 }, ev: [['chirp', 6, .35], ['bark', 60, .18], ['bike_bell', 120, .2], ['whoosh', 45, .15]] },
  suburb_night: { layers: { traffic: .1, air: .2, leaves: .15 }, ev: [['cricket', 1.6, .35], ['bark', 150, .1], ['meow', 200, .12]] },
  industrial: { layers: { traffic: .45, air: .2, hvac: .25 }, ev: [['clank', 18, .2], ['horn_far', 50, .2], ['whoosh', 25, .2]] },
  industrial_night: { layers: { traffic: .2, air: .15, hvac: .2 }, ev: [['cricket', 3, .25], ['clank', 40, .12]] },
  park: { layers: { leaves: .45, air: .25, traffic: .1 }, ev: [['chirp', 3.5, .4], ['bark', 70, .15], ['bike_bell', 60, .18], ['splash', 120, .1]] },
  park_night: { layers: { leaves: .3, air: .2, traffic: .06 }, ev: [['cricket', 1.2, .4], ['meow', 240, .1]] },
  harbor: { layers: { waves: .65, air: .3, traffic: .08 }, ev: [['gull', 9, .3], ['buoy', 24, .3], ['splash', 45, .15], ['horn_far', 120, .1]] },
  harbor_night: { layers: { waves: .6, air: .25 }, ev: [['buoy', 18, .3], ['gull', 60, .12], ['cricket', 6, .15]] },
  airport: { layers: { jet: .35, traffic: .35, air: .2 }, ev: [['plane', 75, .45], ['honk', 60, .15], ['whoosh', 20, .2]] },
  airport_night: { layers: { jet: .25, traffic: .2, air: .15 }, ev: [['plane', 120, .4], ['cricket', 5, .15]] },
  room: { layers: { room: .4 }, ev: [] },
  cafe: { layers: { room: .3, murmur: .35 }, ev: [['cup', 5, .3], ['sizzle', 60, .08]] },
  restaurant: { layers: { room: .3, murmur: .45 }, ev: [['cup', 3.5, .3]] },
  gym: { layers: { room: .3, hvac: .25, murmur: .12 }, ev: [['clank', 4, .25]] },
  office: { layers: { hvac: .45, room: .2 }, ev: [['typing', 7, .12], ['page', 40, .1]] },
  library: { layers: { hvac: .25, room: .25 }, ev: [['page', 9, .15]] },
  bar: { layers: { murmur: .6, room: .25 }, ev: [['cup', 3, .3], ['applause', 200, .08]] },
  store: { layers: { hvac: .3, room: .25, murmur: .12 }, ev: [['scan', 6, .12]] },
  train: { layers: { rumble: .65, room: .25 }, ev: [['clack', 1.4, .35, true]] },
  vehicle: { layers: { engine: .55, room: .15 }, ev: [] },
  silent: { layers: {}, ev: [] },
};
// weather overlays: layers go through the weather bus (muffled indoors)
export const WEATHER = {
  rain: { layers: { rain: .6 }, ev: [] },
  storm: { layers: { rain: .9, rumble: .35 }, ev: [['thunder', 25, .6]] },
  snow: { layers: { hush: .45 }, ev: [], hush: .55 }, // hush: scales the base profile down (snow muffles the city)
  fog: { layers: { hush: .2 }, ev: [], hush: .8 },
};

/** Ambience controller: crossfades layers between profiles, fires random events. */
export class Ambience {
  constructor(bus, playSfx) {
    this.bus = bus; this.base = gain(bus, 1); this.wx = gain(bus, 1); this.muffle = filt(this.wx, 'lowpass', 18000); this.playSfx = playSfx;
    this.layers = {}; this.profile = null; this.weather = null; this.indoor = false; this.events = []; this.next = []; this.ver = 0;
  }
  layer(name, wx) {
    let L = this.layers[name]; if (L) return L;
    const g = gain(wx ? this.muffle : this.base, 0); g.gain.setValueAtTime(0, A.ctx.currentTime);
    L = this.layers[name] = { g, srcs: LAYERS[name](g), target: 0, stopAt: 0 }; return L;
  }
  set(profile, weather, indoor) {
    if (profile === this.profile && weather === this.weather && indoor === this.indoor) return;
    this.profile = profile; this.weather = weather; this.indoor = indoor; this.ver++;
    const P = PROFILES[profile] || PROFILES.silent, W = WEATHER[weather], targets = {}, hush = W && W.hush && !indoor ? W.hush : 1, now = A.ctx.currentTime;
    for (const k in P.layers) targets[k] = P.layers[k] * hush;
    if (W) for (const k in W.layers) targets[k] = Math.max(targets[k] || 0, W.layers[k] * (indoor ? .45 : 1));
    /* owner msg 111: the outdoor city bed (filtered-noise traffic / air / leaves / waves / jet and the rain hiss) read as a white-noise machine: CUT until the ambience is redesigned. One-shot events, music, indoor tones and vehicles stay. Flip CITY_BED to bring it back. */
    if (!CITY_BED && !indoor && /^(city|suburb|industrial|park|harbor|airport)/.test(profile)) for (const k in targets) targets[k] = 0;
    this.muffle.frequency.setTargetAtTime(indoor ? 550 : 18000, now, .5);
    for (const k of new Set(Object.keys(targets).concat(Object.keys(this.layers)))) {
      const v = targets[k] || 0; if (!v && !this.layers[k]) continue;
      const L = this.layer(k, !!WEATHER_LAYERS[k] && !!W && !!W.layers[k] && !P.layers[k]); L.target = v; L.g.gain.setTargetAtTime(v, now, 1.6); L.stopAt = v ? 0 : now + 10;
    }
    this.events = P.ev.map(e => [e[0], e[1], e[2] * (indoor ? 1 : hush), e[3]]).concat(W && !indoor ? W.ev : W && weather === 'storm' ? [['thunder', 30, .3]] : []);
    this.next = this.events.map(e => now + (e[3] ? e[1] : e[1] * (.3 + Math.random())));
  }
  tick(now) {
    for (let i = 0; i < this.events.length; i++) if (now >= this.next[i]) {
      const e = this.events[i]; this.next[i] = now + (e[3] ? e[1] * (.92 + Math.random() * .16) : -Math.log(1 - Math.random() * .95) * e[1] + .5);
      this.playSfx(e[0], e[2], (Math.random() * 2 - 1) * .7);
    }
    for (const k in this.layers) { const L = this.layers[k]; if (L.stopAt && now > L.stopAt) { for (const s of L.srcs) try { s.stop(); } catch (e) { } try { L.g.disconnect(); } catch (e) { } delete this.layers[k]; } }
  }
}
