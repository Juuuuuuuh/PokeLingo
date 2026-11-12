"""Fetch committed, pinned PokeAPI item art into the site's local asset bundle."""
import concurrent.futures,json,pathlib,re,urllib.request
root=pathlib.Path(__file__).resolve().parents[1];text=(root/'web/item-art.js').read_text()
def constant(name):return json.loads(re.search(r'const '+name+r'=(.*?);\n',text).group(1))
source=constant('ITEM_ART_SOURCE');art={**constant('ITEM_ART'),**constant('TM_ART')};paths=sorted({p for data in art.values() for p in data['sprites']})
def fetch(relative):
 target=root/'web'/relative
 if target.exists() and target.read_bytes().startswith(b'\x89PNG\r\n\x1a\n'):return target.stat().st_size
 target.parent.mkdir(parents=True,exist_ok=True)
 with urllib.request.urlopen(source['url']+target.name,timeout=30) as response:data=response.read()
 if not data.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError('Invalid PNG: '+relative)
 target.write_bytes(data);return len(data)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:sizes=list(pool.map(fetch,paths))
print(f'Validated {len(paths)} local PNG item sprites ({sum(sizes)} bytes), pinned source {source["commit"]}.')
