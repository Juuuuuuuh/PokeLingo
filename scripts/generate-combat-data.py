"""Compile pinned local PokeAPI/Showdown snapshots into Scarlet/Violet-only data.
Usage: python scripts/generate-combat-data.py --data-dir CACHE --showdown-dir CACHE
Showdown JSON is produced from its TypeScript records without executing battle hooks.
"""
import argparse,csv,json,re,pathlib,collections,hashlib,datetime
ap=argparse.ArgumentParser();ap.add_argument('--data-dir',required=True);ap.add_argument('--showdown-dir',required=True);args=ap.parse_args();p=pathlib.Path(args.data_dir);sd=pathlib.Path(args.showdown_dir);root=pathlib.Path(__file__).resolve().parent.parent;out=root/'web'
def rows(n):return list(csv.DictReader((p/(n+'.csv')).open()))
def norm(s):return re.sub('[^a-z0-9]','',s.lower().replace('é','e'))
def readconst(file,name):return json.loads(next(l for l in (out/file).read_text().splitlines() if l.startswith('const '+name+'='))[len('const '+name+'='):-1])
db=readconst('pokemon-data.js','POKEMON_DATA');forms=readconst('evolution-data.js','FORMS');dex=json.loads((sd/'pokedex.json').read_text());learn=json.loads((sd/'learnsets.json').read_text());smoves=json.loads((sd/'moves.json').read_text());moveNames={int(r['move_id']):r['name'] for r in rows('move_names') if r['local_language_id']=='3'};pmoves={norm(r['identifier']):r for r in rows('moves')};types={int(r['type_id']):r['name'] for r in rows('type_names') if r['local_language_id']=='3'};typeEN={'Normal':'노말','Fire':'불꽃','Water':'물','Electric':'전기','Grass':'풀','Ice':'얼음','Fighting':'격투','Poison':'독','Ground':'땅','Flying':'비행','Psychic':'에스퍼','Bug':'벌레','Rock':'바위','Ghost':'고스트','Dragon':'드래곤','Dark':'악','Steel':'강철','Fairy':'페어리'}
# Only these callbacks have explicit implementations in combat-core.js.
custom={'transform','protect','detect','splash','rest','roost','leechseed','judgment','multiattack','technoblast','revelationdance','terablast','ivycudgel','seismictoss','nightshade','dragonrage','sonicboom','superfang','naturesmadness','endeavor','finalgambit','lowkick','grassknot','gyroball','electroball','heavyslam','heatcrash','facade','hex','venoshock','brine','acrobatics','knockoff','foulplay','bodypress','psyshock','psystrike','secretsword','storedpower','powertrip','avalanche','revenge','payback','assurance','flail','reversal','waterspout','eruption','watershuriken','struggle','suckerpunch','firstimpression','fakeout'}
allowedVol={'flinch','confusion','protect','roost','leechseed','mustrecharge'}
def hasfn(d):return '__function__' in json.dumps(d)
def supported(k,d):
 if k in custom:return True
 if hasfn(d) or d.get('multiaccuracy') or d.get('mindBlownRecoil'):return False
 if any(d.get(x) for x in ['sideCondition','slotCondition','weather','terrain','pseudoWeather','forceSwitch','pressureTarget','noPPBoosts']):return False
 if d.get('target') not in ['normal','self','allAdjacent','allAdjacentFoes','all','any','randomNormal','adjacentFoe']:return False
 if d.get('volatileStatus') and d['volatileStatus'] not in allowedVol:return False
 if d.get('category')=='Status':return bool(d.get('boosts') or d.get('status') or d.get('heal') or d.get('volatileStatus') in allowedVol)
 return bool(d.get('basePower') or isinstance(d.get('damage'),int))
M={};keyToId={};diff=[]
for k,d in smoves.items():
 num=d.get('num',0)
 if num<=0 or num not in moveNames or d.get('isZ') or d.get('isMax') or d.get('isNonstandard') in ['Future','CAP','LGPE','Custom']:continue
 # Non-SV moves remain named for diagnostics, but cannot enter an SV learnset.
 entry={x:d[x] for x in ['basePower','accuracy','pp','priority','category','type','target','boosts','status','volatileStatus','secondary','secondaries','self','heal','drain','recoil','multihit','critRatio','willCrit','selfSwitch','selfdestruct','ignoreImmunity','ignoreDefensive','ignoreOffensive','breaksProtect','damage','stallingMove'] if x in d};entry.update(id=num,key=k,name=moveNames[num],type=typeEN.get(d.get('type'),d.get('type')),supported=supported(k,d),contact=bool(d.get('flags',{}).get('contact')),sound=bool(d.get('flags',{}).get('sound')));M[num]=entry;keyToId[k]=num
 if k in pmoves:
  api=pmoves[k]
  if types.get(int(api['type_id']))!=entry['type']:diff.append({'move':num,'field':'type','api':types.get(int(api['type_id'])),'canonical':entry['type']})
apiTypes=collections.defaultdict(list)
for row in rows('pokemon_types'):apiTypes[int(row['pokemon_id'])].append((int(row['slot']),types[int(row['type_id'])]))
for entry in db+forms:
 pid=entry.get('sprite',entry.get('key',entry.get('id')))
 if pid in apiTypes and [name for _,name in sorted(apiTypes[pid])]!=entry['types']:raise RuntimeError('PokeAPI type mismatch for '+str(pid))
# Read independent PokeAPI SV learnsets; never merge earlier games.
P=collections.defaultdict(lambda:{'level':{},'machine':set()})
for r in rows('pokemon_moves'):
 if int(r['version_group_id']) not in [25,26,27]:continue
 id=int(r['pokemon_id']);move=int(r['move_id']);method=int(r['pokemon_move_method_id'])
 if method==1:P[id]['level'][move]=min(P[id]['level'].get(move,101),int(r['level']))
 if method==4:P[id]['machine'].add(move)
byNum=collections.defaultdict(list)
for key,d in dex.items():
 if 0<int(d.get('num',0))<=1025:byNum[d['num']].append((key,d))
def pick(d,id):
 candidates=byNum[id];matches=[(k,x) for k,x in candidates if [typeEN.get(t,t) for t in x.get('types',[])]==d['types'] and list(x.get('baseStats',{}).values())==d['stats']];
 if matches:
  preferred=norm(d.get('en',''));return next(((k,x) for k,x in matches if k==preferred),matches[0])
 same=[(k,x) for k,x in candidates if [typeEN.get(t,t) for t in x.get('types',[])]==d['types']];return same[0] if same else (None,None)
SV_TM={int(r['move_id']):int(r['machine_number']) for r in rows('machines') if int(r['version_group_id']) in [25,26,27]};L={};typeAudit=[];learnDiff=[];unavailable=[];mapped={}
for d in db+forms:
 species=d.get('species',d.get('id'));key,idata=pick(d,species);pid=d.get('sprite',d.get('key',species));recordKey=str(d.get('key',d['id'] if 'id' in d else species));mapped[recordKey]=key
 if not idata:raise RuntimeError('Unmapped species '+str(species))
 actual=[typeEN[t] for t in idata['types']];typeAudit.append({'key':recordKey,'species':species,'types':actual,'showdown':key})
 if d['types']!=actual:raise RuntimeError('Type disagreement '+str(d))
 available=bool(P[int(pid)]['level'] or P[int(pid)]['machine'] or P[species]['level'] or P[species]['machine'])
 if not available:L[recordKey]={'level':[],'machine':[],'form':[],'available':False,'source':'스바 미등장','key':key};unavailable.append(recordKey);continue
 # Form tables supplement the base table, but a complete form table replaces it.
 source=learn.get(key,{}).get('learnset',{});baseKey=norm(idata.get('changesFrom') or idata.get('baseSpecies') or idata.get('name',''));base=learn.get(baseKey,{}).get('learnset',{})
 if not source or len(source)<5:source={**base,**source}
 levels={};machines=set();formMoves=set()
 for mk,values in source.items():
  if mk not in keyToId:continue
  mid=keyToId[mk]
  for v in values:
   if v.startswith('9L'):levels[mid]=min(levels.get(mid,101),max(1,int(v[2:])))
   elif v=='9M' and mid in SV_TM:machines.add(mid)
   elif v=='9R':formMoves.add(mid)
 if not levels and not machines:
  L[recordKey]={'level':[],'machine':[],'form':[],'available':False,'source':'스바 학습표 미확인','key':key};unavailable.append(recordKey);continue
 L[recordKey]={'level':sorted([[level,mid] for mid,level in levels.items()]),'machine':sorted(machines),'form':sorted(formMoves),'available':True,'source':'스칼렛·바이올렛 + 벽록/남청 DLC','key':key}
 # Base default/form snapshots use actual PokeAPI Pokemon IDs for independent comparison.
 if recordKey.isdigit() and int(recordKey)<200000:
  api=P[int(pid)];dl=sorted(set(levels)-set(api['level']));dm=sorted(machines-api['machine']);extraL=sorted(set(api['level'])-set(levels));extraM=sorted(api['machine']-machines)
  levelChanges=[{'move':mid,'api':api['level'][mid],'sv':levels[mid]} for mid in levels.keys()&api['level'].keys() if max(1,api['level'][mid])!=levels[mid]]
  if dl or dm or extraL or extraM or levelChanges:learnDiff.append({'key':recordKey,'species':species,'showdown':key,'missingInAPILevel':dl,'missingInAPIMachine':dm,'apiOnlyLevel':extraL,'apiOnlyMachine':extraM,'levelDifferences':levelChanges})
# TM catalogue uses move identity, avoiding different TM numbers across games.
TM=sorted({mid for l in L.values() for mid in l['machine']});catalog=[{'move':mid,'number':SV_TM[mid],'price':max(30,min(100,round((30+M[mid].get('basePower',0)*.35)/5)*5))} for mid in TM]
# Persist primary/reference types and hashes to allow exhaustive offline verification.
audit={'standard':'Scarlet/Violet including The Teal Mask and The Indigo Disk only','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'primaryLearnsets':'Pokemon Showdown Gen9 L/M/R entries; no Gen1-8 moves merged','secondary':'PokeAPI version groups 25/26/27, Pokemon types and move types','species':len(db),'supportedForms':len(forms),'typeChecks':len(typeAudit),'unavailableSV':unavailable,'svLearnsets':sum(l['available'] for l in L.values()),'moves':len(M),'battleSupportedMoves':sum(m['supported'] for m in M.values()),'tmCount':len(TM),'sourceDifferences':learnDiff,'moveTypeDifferences':diff,'typeReference':typeAudit,'sources':{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in [p/'pokemon_moves.csv',p/'moves.csv',p/'pokemon_types.csv',sd/'learnsets.ts',sd/'pokedex.ts',sd/'moves.ts']}}
(out/'moves-data.js').write_text('const MOVES='+json.dumps(M,ensure_ascii=False,separators=(',',':'))+';\nconst LEARNSETS='+json.dumps(L,ensure_ascii=False,separators=(',',':'))+';\nconst TM_CATALOG='+json.dumps(catalog,separators=(',',':'))+';\n')
pokemonRows=rows('pokemon');weights={int(r['species_id']):int(r['weight'])/10 for r in pokemonRows if r['is_default']=='1'};pidWeights={int(r['id']):int(r['weight'])/10 for r in pokemonRows};formWeights={f['key']:pidWeights.get(f['key'],weights[f['species']]) for f in forms}
with (out/'moves-data.js').open('a') as f:f.write('const SPECIES_WEIGHTS='+json.dumps(weights,separators=(',',':'))+';\nconst FORM_WEIGHTS='+json.dumps(formWeights,separators=(',',':'))+';\nconst SPECIES_EVOLVABLE='+json.dumps(sorted({int(r['evolves_from_species_id']) for r in rows('pokemon_species') if r['evolves_from_species_id']}),separators=(',',':'))+';\n')
(out/'combat-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print({k:audit[k] for k in ['species','supportedForms','typeChecks','svLearnsets','moves','battleSupportedMoves','tmCount']});print('PokeAPI/Showdown learnset differences:',len(learnDiff),'move type differences:',len(diff),'unavailable:',len(unavailable))
