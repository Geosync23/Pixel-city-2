import re,sys,json,glob,subprocess
S='/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad'
OUT='/home/user/Pixel-city-2/src/story/ambient_lines.js'
G=['phone_calls','complaints','tiny_joys','gossip','food','money','work','love','family','pets','transit','city_pride','running_gags','crosswalk_philosophy','tech','health','hobbies','plans','kids_say','elders_say','tourists_say','to_self']
D=['downtown','oldtown','harbor','hillcrest','maplewood','arts','railyard','park','airport']
NEAR=['fountain','pier','lighthouse','ferris_wheel','duck_pond','river_walk','market_square','central_station','bandstand','lookout','campus','stadium','symphony_hall','galleria','skydeck_tower','conservatory','museum','observatory','bus_stop','taxi_stand','construction','crosswalk']
VEN=['cafe','bakery','diner','restaurant','bar','grocery','shop','bookstore','gym','library','lobby_res','lobby_office','station','train','bus_ride','airport','plane','mall','cinema','concert','theatre','museum','conservatory','observatory','skydeck','clinic','bank','laundromat','salon','restroom_queue']
TOD=['dawn','morning','midday','afternoon','evening','late','night']
WK=['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
SEA=['spring','summer','autumn','winter']
WEA=['sunny','cloudy','rain','storm','fog','snow','heat','wind','first_snow','rainbow']
EV=['cheap_tuesday','open_mic_wednesday','live_music_friday','farmers_market','sunday_jazz_brunch','blossom_festival','summer_fireworks','boardwalk_days','harvest_fair','lantern_night','winter_lights','season_end_sale','founders_day','gratitude_supper','midwinter_day','new_years_eve','rent_day','payday','new_year','star_party','flower_show']
KIND=['jogger','carrier','queue','bus','bench','busker','dogwalker','cyclist','phone','couple','kid','tourist','vendor','worker','commuter','smoker_break','photographer','student','parent_with_stroller','late_runner']
PL=['stinky','filthy','exhausted','starving','bursting','gloomy','glowing','lonely','fresh','full','caffeinated','soaked','snowy','sweaty','umbrella','underdressed_cold','pajamas','dressed_up','travel_outfit','sporty','artist_outfit','raincoat','same_outfit_days','new_in_town','settling_in','regular','homeowner','unemployed','on_way_to_work','after_work','promoted','broke','flush','birthday','running','night_owl','early_bird','loaded_bag','carrying_gift','carrying_food','on_bike','with_friend','bumped','staring','blocking','sitting_bench','petting_animal','taking_photo','lost']
DBV=['cafe','bar','diner','restaurant','park','gym','mall','station','laundromat','library']
SPEC=[('general',G,50),('district',D,50),('near',NEAR,15),('venue',VEN,30),('timeOfDay',TOD,40),('weekday',WK,15),('season',SEA,40),('weather',WEA,25),('events',EV,15),('kind',KIND,25),('player',PL,40)]
pools={}; duets=[]; dby={}
for f in sorted(glob.glob(S+'/frag/*.txt')):
    key=None
    for raw in open(f):
        l=raw.strip()
        if not l or l.startswith('#'): continue
        if l.startswith('@ '): key=l[2:].strip(); continue
        if key=='duets' or key.startswith('duets_by.'):
            a,b=[x.strip() for x in l.split('||')]
            (duets if key=='duets' else dby.setdefault(key[9:],[])).append([a,b])
        else: pools.setdefault(key,[]).append(l)
# classify old general
KW=[('running_gags',r'fountain|gerald|pigeon|\b14\b|brenda|sourdough|finch|maître g|blink twice|blinked twice|mercy|streetcar|no\. 9|ferris'),
('gossip',r'\b(vera|lou|tasha|mr\. oh|dot|nico|captain|nana bea|birdie|sethi|otis|fenn|manny|imani|quill|castillo|haru|marlow|roz|celeste|rhonda|ambrose|walt|mr\. pike)\b|rumou?r|gossip|heard|secret'),
('pets',r'\bdogs?\b|\bcats?\b|parrot|kitten|snail|goldfish|tabby|octopus'),
('love',r'husband|\bwife\b|partner|\bex\b|wedding|propos|\bdate\b|love story|married'),
('family',r'\bmum\b|\bmom\b|\bdad\b|sister|brother|grand|aunt|uncle|\bson\b|daughter|niece|nephew|cousin|toddler|mother'),
('tech',r'phone|wi-fi|podcast|\bapp\b|autocorrect|tabs|text'),
('health',r'\bgym\b|knee|\bhip\b|\bnap\b|doctor|dentist|floss|walk more|tired|sleep'),
('transit',r'\bbus\b|train|taxi|ferry|\bbike\b|station|\bcab\b|crossing|walk signal|pedestrian'),
('money',r'dollar|\brent\b|price|sale\b|cheap|\$|cents|afford|lottery|nickel|twenty|allowance|cheques|bargain|deals'),
('work',r'boss|meeting|email|office|printer|manager|desk|shift|crates|lanyard|seminar|essay|major|professor|dock|container|lunch break|presentation|reply all|hiring'),
('food',r'bakery|croissant|taco|soup|pancake|pizza|dumpling|ramen|cheese|coffee|pastr|sandwich|tart|\bpie\b|noodle|hot dog|ice cream|lunch|dinner|cake|bagel|cinnamon|garlic|bread|tomato|cookie|pretzel|hot pot|crisps|burger|sample|cooking'),
('hobbies',r'cello|paint|crossword|book club|chess|knit|sculpt|skat|garden|plant|sail|whistle|charcoal|gallery|puppet|trumpet|piano|record|magician|band'),
('plans',r"tonight|weekend|saturday|tomorrow|going to|i'm doing it|this week"),
('crosswalk_philosophy',r'^is it|do you ever|do you think|wonder|homesick|two kinds|every time|is there anything'),
('city_pride',r'city|maple bay|bridge|river|harbor|lighthouse|skydeck|orpheum|conservatory|\{district\}|street|town|bay'),
('to_self',r"^okay|^i'm |^i've |remind me|deep breath|^hold|^stop"),
]
EXPL={'kids_say':("Mom! Mom! A dog!",11),'elders_say':("Back in my day",10),'tourists_say':("Excuse me, is this the way to the lighthouse?",8)}
old=pools.pop('general._old',[])
gen={k:pools.pop('general.'+k,[]) for k in G}
i=0; forced={}
for k,(start,n) in EXPL.items():
    j=next(x for x,l in enumerate(old) if l.startswith(start))
    for l in old[j:j+n]: forced[l]=k
for l in old:
    k=forced.get(l)
    if not k:
        for t,rx in KW:
            if re.search(rx,l,re.I): k=t; break
    if not k: k='tiny_joys'
    gen[k].append(l)
pools.update({'general.'+k:v for k,v in gen.items()})
# build
data={}; problems=[]; table=[]
for grp,keys,mn in SPEC:
    data[grp]={}
    for k in keys:
        v=pools.pop(grp+'.'+k,[])
        data[grp][k]=v
        table.append((grp+'.'+k,len(v),mn))
for k in list(pools): problems.append('UNKNOWN POOL '+k)
data['duets']=duets
data['duets_by']={'venue':{},'kind':{}}
for k,v in dby.items():
    a,b=k.split('.'); data['duets_by'][a][b]=v
# checks
amb=json.loads(subprocess.check_output(['node','-e',"import('/home/user/Pixel-city-2/src/story/dialogue.js').then(m=>{const o=[];const w=x=>{if(typeof x==='string')o.push(x);else if(x&&typeof x==='object')Object.values(x).forEach(w)};w(m.AMBIENT);console.log(JSON.stringify(o))})"]))
seen={l.lower().strip():'AMBIENT' for l in amb}
def chk(l,where):
    if len(l)>90: problems.append(f'LONG {len(l)} {where}: {l}')
    for t in re.findall(r'\{(\w+)\}',l):
        if t not in('name','district'): problems.append(f'TOKEN {where}: {l}')
        if t=='name' and where not in('player.regular','player.birthday'): problems.append(f'NAME TOKEN {where}: {l}')
        if t=='district' and not where.startswith('general'): problems.append(f'DISTRICT TOKEN {where}: {l}')
    k=l.lower().strip()
    if k in seen: problems.append(f'DUP {where} vs {seen[k]}: {l}')
    seen[k]=where
total=0
for grp,keys,mn in SPEC:
    for k in keys:
        for l in data[grp][k]: chk(l,grp+'.'+k); total+=1
for a,b in duets: chk(a,'duets'); chk(b,'duets'); total+=2
for g in data['duets_by']:
    for k,v in data['duets_by'][g].items():
        for a,b in v: chk(a,'dby.'+k); chk(b,'dby.'+k); total+=2
mode=sys.argv[1] if len(sys.argv)>1 else 'short'
under=[(p,n,m) for p,n,m in table if n<m]
if mode=='full':
    for p,n,m in table: print(f'{p:34s}{n:5d}  (min {m})')
    print('duets',len(duets)); [print('duets_by.'+g+'.'+k,len(v)) for g in data['duets_by'] for k,v in data['duets_by'][g].items()]
else:
    for p,n,m in under: print(f'UNDER {p} {n}/{m}')
print('TOTAL lines',total,'duets',len(duets))
for p in problems: print(p)
# write
def js(v,ind):
    sp='  '*ind
    if isinstance(v,str): return json.dumps(v,ensure_ascii=False)
    if isinstance(v,list):
        if v and isinstance(v[0],list): return '[\n'+''.join(f'{sp}  [{js(a,0)}, {js(b,0)}],\n' for a,b in v)+sp+']'
        return '[\n'+''.join(f'{sp}  {js(x,0)},\n' for x in v)+sp+']'
    return '{\n'+''.join(f'{sp}  {k}: {js(x,ind+1)},\n' for k,x in v.items())+sp+'}'
hdr=open(S+'/header.js').read()
open(OUT,'w').write(hdr+'export const LINES = '+js(data,0)+';\n')
