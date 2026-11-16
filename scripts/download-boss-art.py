"""Fetch requested legacy form and first-clear orb art from the pinned PokeAPI snapshot."""
import json,pathlib,re,urllib.request
root=pathlib.Path(__file__).resolve().parents[1];s=(root/'web/legacy-boss-data.js').read_text();forms=json.loads(re.search(r'const LEGACY_BOSS_FORMS=(.*?);',s).group(1));base='https://raw.githubusercontent.com/PokeAPI/sprites/c0542f7c51215d9672439012838c99f520596cbd/sprites/'
assets=[('assets/form-'+str(f['key'])+'.png','pokemon/'+str(f['key'])+'.png') for f in forms]+[('assets/items/blue-orb.png','items/blue-orb.png'),('assets/items/red-orb.png','items/red-orb.png')]
for target,remote in assets:
 p=root/'web'/target
 if not p.exists():
  with urllib.request.urlopen(base+remote,timeout=30) as r:p.write_bytes(r.read())
 assert p.read_bytes().startswith(b'\x89PNG\r\n\x1a\n'),target
print('Validated',len(assets),'legacy boss/orb PNGs.')
