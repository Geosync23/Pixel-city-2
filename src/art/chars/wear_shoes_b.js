// Artist B shoe shapes (catalogue: src/data/clothes_bottoms.js SHOES).
// Each shoe is a little pixel grid drawn at the foot: columns start at x-1 (behind the heel) .. x+3 (past the toe), the last grid row is the sole row fy,
// the row above it the upper (fy-1), rows above that are the ankle / shaft (leg rows). Letters:
//   c shoe colour   h highlight   s sole (dark of c)   d dark of c   l light of c   o toe colour   w white rubber   k skin
//   2 second colour (c2, or the shape's own fallback)   D black lug rubber   g gold hardware   j jute   r gum rubber   f cream fur   .  nothing
// Fixed colours (gold, jute, gum, lug) are shaded on the far leg like the engine shades the shoe colour.
import { regShape } from './_shapes.js';

const FIX = { D: '#2e2a34', g: '#e8c06a', j: '#d8bf8a', r: '#b47a4a', f: '#f0e6d0' };
function colOf(g, ch, d2) {
  switch (ch) {
    case 'c': return g.c; case 'h': return g.hi; case 's': return g.sole; case 'o': return g.toe; case 'w': return g.white; case 'k': return g.sk;
    case 'd': return g.dk(g.c, .3); case 'l': return g.lt(g.c, .25);
    case '2': return g.c2 || (d2 ? colOf(g, d2) : g.hi);
  }
  const f = FIX[ch]; return f ? (g.near ? f : g.dk(f, .16)) : null;
}
/** rows top -> bottom, the last row is the sole row; d2 = letter used for '2' when the item has no second colour */
function grid(g, rows, d2) {
  const top = -(rows.length - 1);
  rows.forEach((s, ri) => {
    const r = top + ri; if (r < -g.n) return; // never paint above the leg (onto the hips / torso)
    for (let ci = 0; ci < s.length; ci++) { const ch = s[ci]; if (ch === '.') continue; const col = colOf(g, ch, d2); if (col) g.p(g.x - 1 + ci, g.fy + r, col); }
  });
}
const shoe = (id, rows, art, d2, extra) => regShape('shoes', id, Object.assign({ rows, draw(g) { grid(g, art, d2); } }, extra || {}));

/* ---- trainers ---- */
// Runner: long low shoe, white foam sole running past the toe, coloured flash on the side.
shoe('runner', 0, ['.c2c.', '.wwww'], 'w');
// Canvas plimsoll: white rubber toe cap rising at the front, white sole.
shoe('canvas', 0, ['.ccw.', '.www.']);
// Canvas high-top: two shaft rows, white ankle patch, rubber toe cap.
shoe('canvashi', 2, ['.wc..', '.cc..', '.ccw.', '.www.']);
// Skate shoe: chunky padded upper, fat tongue sticking up, white cupsole.
shoe('skate', 0, ['..2..', '.ccc.', '.www.'], 'l');
// Football boots: coloured sole plate and dark studs under it.
shoe('cleats', 0, ['.c2c.', '.222.', '.D.D.'], 'w');

/* ---- smart ---- */
// Brogue spectator: two-tone, heel counter and toe cap in the second colour, dark sole.
shoe('brogue', 0, ['.2c2.', '.DD2.'], 'l');
// Chunky derby: rounded toe box on a long black lug sole.
shoe('derby', 0, ['.chc.', '.DDDD']);
// Monk strap: gold buckle on the side, slim leather sole.
shoe('monk', 0, ['.cgc.', '.ssc.']);
// Boat shoe: lace collar at the heel, moc toe, white siped sole.
shoe('boatshoe', 0, ['.2cc.', '.www.'], 'w');

/* ---- heels ---- */
// Court pump: closed vamp, mid heel with the arch gap under it.
shoe('pump', 0, ['.chc.', '.D.c.']);
// Stiletto: the heel lifts the foot a row: heel cup at the ankle, steep arch, pointed toe.
shoe('stiletto', 0, ['.c...', '.dh..', '.D.cc']);
// Slingback: open heel (skin), strap, heel and arch gap.
shoe('slingback', 0, ['.2...', '.kcc.', '.D.c.'], 'c');
// Strappy heeled sandal: ankle strap, bare instep, toe strap.
shoe('strappy', 0, ['.cc..', '.kck.', '.D.c.']);
// Wedge: jute wedge heel all the way to the toe, strap over bare toes.
shoe('wedge', 0, ['.jck.', '.jjj.']);
// Heeled ankle bootie: one shaft row, heel and arch gap.
shoe('bootie', 1, ['.cc..', '.dcc.', '.D.c.']);
// Knee boot on a heel: three shaft rows, top band, heel and arch.
shoe('kneeboot', 3, ['.ll..', '.cc..', '.cc..', '.dcc.', '.D.c.']);

/* ---- summer ---- */
// Espadrille: canvas upper with a rounded toe on a jute sole.
shoe('espadrille', 0, ['.ccc.', '.jjj.']);
// Flip-flop: bare foot on a flat coloured footbed, dark thong post.
shoe('flipflop', 0, ['.kdk.', '.ccc.']);
// Pool slide: wide band over the toes, thick footbed in the second colour.
shoe('slide', 0, ['.kcc.', '.222.'], 'w');
// Gladiator sandal: straps climbing the ankle (strap / skin / strap), flat sole.
shoe('gladiator', 2, ['.cc..', '.kk..', '.kck.', '.sss.']);
// Mule: backless (bare heel), closed toe, low sole.
shoe('mule', 0, ['.kcc.', '.ssc.']);

/* ---- boots ---- */
// Chelsea: pull tab, dark elastic gore at the ankle, slim stacked heel.
shoe('chelsea', 1, ['.c...', '.dc..', '.chc.', '.Dsc.']);
// Combat boot: two shaft rows with laces, chunky lug sole.
shoe('combat', 2, ['.ch..', '.cc..', '.chc.', '.DDD.']);
// Hiking boot: padded collar in the second colour, bulky toe, long lug sole.
shoe('hiking', 1, ['.22..', '.chc.', '.DDDD'], 'r');
// Work boot: dark padded collar, laces, gum sole.
shoe('workboot', 1, ['.dd..', '.chc.', '.rrr.']);
// Snow boot: fur cuff folded over the shaft, puffy toe, lug sole.
shoe('snowboot', 2, ['.fff.', '.cc..', '.ccc.', '.DDD.']);
// Riding boot: tall slim shaft with a lighter top band, low dark heel.
shoe('ridingboot', 3, ['.hh..', '.cc..', '.cc..', '.cc..', '.Dsc.']);
