// Character entity (player and NPCs): position, facing, animation, path following, sprite.
import { pixSprite } from '../engine/sprites.js';
import { MODULES } from '../art/registry.js';
import * as R from '../engine/raster.js';
import { followPath, stepToward, findPath } from '../engine/nav.js';

let API = null;
/** the character art module (src/art/chars/char.js) or a placeholder until it exists */
export function charArt() {
  if (API) return API; const m = MODULES['./chars/char.js'];
  if (m && m.drawChar) return API = m;
  return API = { CHAR_SB: [-8, -26, 8, 4], ANIMS: { stand: 1, walk: 2 }, randomSpec: r => ({ topColor: ['#3b5bdb', '#e8590c', '#2f9e44', '#d6336c'][r() * 4 | 0], skin: '#f1c7a1', hairColor: '#2a1c14', bottomColor: '#2b2f3a' }),
    drawChar(s, pose) { const p = R.PW(0, 0, 0), X = Math.round(p[0]), Y = Math.round(p[1]), k = pose.anim === 'walk' && pose.frame % 2 ? 1 : 0; R.rect(X - 3, Y - 1, 6, 2, '#2a1f4560'); R.rect(X - 2, Y - 8, 2, 8 - k, s.bottomColor || '#2b2f3a'); R.rect(X + 1, Y - 8, 2, 7 + k, s.bottomColor || '#2b2f3a'); R.rect(X - 3, Y - 16, 7, 8, s.topColor || '#f2c230'); R.rect(X - 2, Y - 22, 5, 6, s.skin || '#f1c7a1'); R.rect(X - 2, Y - 23, 5, 2, s.hairColor || '#2a1c14'); } };
}
let SID = 0; const specIds = new WeakMap();
const specId = s => { let i = specIds.get(s); if (!i) specIds.set(s, i = ++SID); return i; };
const FPS = { walk: 7, run: 10, stand: 1.2, talk: 4, type: 5, work: 4, lift: 3, treadmill: 10, dance: 6, eat: 3, drink: 2, wave: 5, cheer: 5, carry: 7, sleep: .6, read: .5, phone: .8, sit: .5 };

export class Char {
  constructor(spec, x = 0, y = 0) {
    this.spec = spec; this.x = x; this.y = y; this.z = 0; this.dir = 1; this.anim = 'stand'; this.t = Math.random() * 10;
    this.speed = 3.6; this.path = null; this.moving = false; this.bb = [-.2, -.2, .2, .2, 1.4]; this.pose = null; // pose: forced anim while busy
    this.zoff = 0; // extra height (sitting on furniture, lying on bed)
  }
  setSpec(spec) { this.spec = spec; }
  face(dx, dy) { if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) return; this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); }
  faceTo(x, y) { this.face(x - this.x, y - this.y); }
  /** path-find to a point. Returns true if a path was found. */
  goTo(world, x, y, opts) { const p = findPath(world, this.x, this.y, x, y, opts); this.path = p && p.length ? p : null; return !!p; }
  stop() { this.path = null; }
  /** advance along the current path / steer toward (sx,sy) if given. Call every frame. */
  move(world, dt, steer) {
    const ox = this.x, oy = this.y; let moved = 0;
    if (steer) { this.path = null; moved = stepToward(world, this, this.x + steer[0] * 2, this.y + steer[1] * 2, this.speed * dt); }
    else if (this.path) { moved = followPath(world, this, this.path, this.speed * dt); if (!this.path.length) this.path = null; }
    this.moving = moved > 1e-4; if (this.moving) this.face(this.x - ox, this.y - oy);
    this.z = world.heightAt(this.x, this.y) + this.zoff; this.t += dt; return moved;
  }
  sprite() {
    const A = charArt(), anim = this.pose || (this.moving ? (this.carry ? 'carry' : 'walk') : 'stand'), n = (A.ANIMS && A.ANIMS[anim]) || 1, a = A.ANIMS && A.ANIMS[anim] ? anim : 'stand';
    const f = Math.floor(this.t * (FPS[a] || 4)) % n, dir = this.dir;
    return pixSprite('ch' + specId(this.spec) + a + f + dir + (this.spec._v || 0), A.CHAR_SB, () => A.drawChar(this.spec, { anim: a, frame: f, dir }));
  }
}
