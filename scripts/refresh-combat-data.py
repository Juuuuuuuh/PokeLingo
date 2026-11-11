"""Optional network refresh: Python 3 + Node 22.13+. Normal tests run offline."""
import argparse,pathlib,urllib.request,subprocess,concurrent.futures
ap=argparse.ArgumentParser();ap.add_argument('--cache',default='work/combat-sources');ap.add_argument('--reuse-cache',action='store_true');args=ap.parse_args();root=pathlib.Path(__file__).resolve().parent.parent;cache=pathlib.Path(args.cache).resolve();api=cache/'pokeapi';sd=cache/'showdown';api.mkdir(parents=True,exist_ok=True);sd.mkdir(parents=True,exist_ok=True)
files=[('https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'+n+'.csv',api/(n+'.csv')) for n in ['moves','move_names','machines','pokemon_moves','type_names','pokemon','pokemon_species','pokemon_types']]+[('https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/'+n+'.ts',sd/(n+'.ts')) for n in ['pokedex','learnsets','moves']]
def download(pair):
 url,dest=pair
 if not(args.reuse_cache and dest.exists()):
  with urllib.request.urlopen(url,timeout=60) as r:dest.write_bytes(r.read())
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:list(pool.map(download,files))
subprocess.run(['node',str(root/'scripts/parse-source-tables.cjs'),str(sd)],check=True,cwd=root)
subprocess.run(['python3',str(root/'scripts/generate-combat-data.py'),'--data-dir',str(api),'--showdown-dir',str(sd)],check=True,cwd=root)
subprocess.run(['python3',str(root/'scripts/build-combat-fixture.py'),'--data-dir',str(api),'--showdown-dir',str(sd)],check=True,cwd=root)
print('Updated SV data, audit report and offline raw-source fixture. Run npm test before committing.')
