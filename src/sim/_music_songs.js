// Private: the whole songbook of the background music (parts A-D) and a lookup by id. Format: _music_engine.js. Pools: _music_pools.js.
import { SONGS_A } from './_music_songs_a.js';
import { SONGS_B } from './_music_songs_b.js';
import { SONGS_C } from './_music_songs_c.js';
import { SONGS_D } from './_music_songs_d.js';
export const SONGS = [].concat(SONGS_A, SONGS_B, SONGS_C, SONGS_D);
export const SONG = {}; for (const s of SONGS) SONG[s.id] = s;
