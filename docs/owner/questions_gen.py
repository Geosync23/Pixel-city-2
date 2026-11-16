# builds docs/owner/questions.html (the owner's questionnaire page) from questions_tpl.html + pictures in out/shots
import base64, json, os
def img(f): return 'data:image/png;base64,' + base64.b64encode(open('out/shots/' + f, 'rb').read()).decode()
P = {'crowd': img('nl_crowd_new.png'), 'pool': img('nl_halfpool_new.png'), 'tree': img('nl_cmp1_new.png'), 'heat': img('traffic_after_heat.png'), 'bus': img('traffic_after_rides_bus2.png')}
Q = [
 ['Traffic', 'Stage 87', [
  ['t1', 'There are 28 buses on the road, about one every 12 seconds per route. Downtown they are half of all vehicles.', ['Keep 28', 'Fewer buses (about one every 18 seconds)', 'More buses'], ['bus', 'A bus at a downtown stop in the morning rush.']],
  ['t2', 'Some junctions on the bus streets see mostly buses. Add more cars there? It costs a little waiting time and frame rate.', ['Leave as is', 'Add more cars'], ['heat', 'Map of the city streets: orange dots are where vehicles stood still during a test morning. The busy line near the bottom is Harbor Blvd, the main bus street.']],
  ['t3', 'Cars turn right on a red light when the way is clear.', ['Keep it', 'Turn it off'], None]]],
 ['Night light', 'Stage 91', [
  ['n1', 'People change brightness in about six steps as they walk from the edge of a lamp pool to its middle. The trial you approved had four, coarser steps.', ['Keep six steps', 'Go back to four, chunkier', 'No preference'], ['crowd', 'People under street lamps as it is now: each person is one clean brightness.']],
  ['n2', 'Trees and walls still show the dotted pool pattern on them. People, lamp posts and small objects are lit as a whole.', ['Fine as it is', 'Light trees as a whole too'], ['tree', 'Palm trunks and a wall with the pool pattern on them; the person is lit as a whole.']],
  ['n3', 'A person standing at the rim of a pool is a touch darker than the ground under them.', ['Fine as it is', 'Make people one step lighter'], ['pool', 'The player at the edge of a pool of light.']]]],
 ['Mini-games: cooking and gym', 'Stage 89', [
  ['a1', 'Wok dishes use the stirring game.', ['Keep stirring', 'Use the pan flip'], None],
  ['a2', 'Kneading and ping-pong reuse other games’ pictures.', ['Fine', 'Draw their own pictures'], None],
  ['a3', 'On the first few plays a hint shows for 7 seconds.', ['7 seconds is fine', 'Longer', 'Shorter'], None]]],
 ['Mini-games: chores and venues', 'Stage 93', [
  ['b1', 'Laundry sorting happens in a 3-minute "Loading the machine" step.', ['Keep it at the machine', 'Sort at the hamper instead'], None],
  ['b2', 'Watering takes three pours per plant.', ['Fine', 'Fewer pours'], None],
  ['b3', 'The pool, ducks, pet pen and fishing have simple animations.', ['Good enough', 'Make fuller animations'], None],
  ['b4', 'Build two more games: "pick the ripest" at the market and a photo game?', ['Yes, both', 'Only pick the ripest', 'Only the photo game', 'Not now'], None]]],
 ['Classic songs', 'Stage 90', [
  ['c1', 'Are the eight original songs too loud next to the new tunes on the phone speaker?', ['Volume is fine', 'Make them a bit quieter', 'Have not listened yet'], None],
  ['c2', 'The originals have a vinyl crackle.', ['Keep the crackle', 'Remove it'], None]]],
 ['Phone: shows and reading', 'Stage 92', [
  ['p1', 'While you read text yourself the clock runs slowly, about 6 game minutes per real minute.', ['Keep the slow clock', 'Run the full clock'], None],
  ['p2', 'Should the phone remember that you pressed "Bigger"?', ['Yes', 'No'], None]]],
 ['From today', 'Stages 96 and 97', [
  ['x1', 'The Central Station platforms are as bright as the hall at night.', ['Fine as it is', 'Darker, with pools of lamp light'], None],
  ['x2', 'Closing the wish-list banner with x:', ['Reminds again the next day (as now)', 'Silences that piece for a week', 'Silences that piece for good'], None]]],
]
t = open('docs/owner/questions_tpl.html').read().replace('__P__', json.dumps(P)).replace('__Q__', json.dumps(Q))
open('docs/owner/questions.html', 'w').write(t); print(os.path.getsize('docs/owner/questions.html') // 1024, 'KB')
