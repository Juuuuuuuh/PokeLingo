import json,gzip,re,pathlib,csv,argparse
ap=argparse.ArgumentParser();ap.add_argument('--data-dir',required=True);ap.add_argument('--showdown-dir',required=True);args=ap.parse_args();root=pathlib.Path(__file__).resolve().parent.parent;sourceDir=pathlib.Path(args.showdown_dir);dataDir=pathlib.Path(args.data_dir);audit=json.loads((root/'web/combat-audit.json').read_text());dex=json.load((sourceDir/'pokedex.json').open());learn=json.load((sourceDir/'learnsets.json').open());moves=json.load((sourceDir/'moves.json').open());norm=lambda s:re.sub('[^a-z0-9]','',s.lower().replace('é','e'));records={}
for row in audit['typeReference']:
 key=row['showdown'];info=dex[key];source=learn.get(key,{}).get('learnset',{});base=learn.get(norm(info.get('changesFrom') or info.get('baseSpecies') or info.get('name','')),{}).get('learnset',{})
 if not source or len(source)<5:source={**base,**source}
 records[row['key']]={'types':info['types'],'raw':{move:[s for s in sources if s.startswith('9')] for move,sources in source.items() if any(s.startswith('9') for s in sources)}}
svtm={int(r['move_id']):int(r['machine_number']) for r in csv.DictReader((dataDir/'machines.csv').open()) if int(r['version_group_id']) in [25,26,27]}
reference={'records':records,'machines':svtm,'moves':{d['num']:{k:d[k] for k in ['type','basePower','pp','accuracy','category','priority'] if k in d} for d in moves.values() if d.get('num',0)>0},'sources':audit['sources']}
(root/'tests/fixtures').mkdir(parents=True,exist_ok=True);(root/'tests/fixtures/sv-source-reference.json.gz').write_bytes(gzip.compress(json.dumps(reference,separators=(',',':')).encode(),mtime=0));print('Independent raw-source fixture:',(root/'tests/fixtures/sv-source-reference.json.gz').stat().st_size,'bytes')
