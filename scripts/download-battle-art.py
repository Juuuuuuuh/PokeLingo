"""Download pinned rear-facing battle art; no runtime third-party requests."""
import pathlib,json,re,urllib.request,concurrent.futures,time
root=pathlib.Path(__file__).resolve().parents[1];s=(root/'web/battle-art.js').read_text()
def constant(name):return json.loads(re.search(r'const '+name+r'=(.*?);\n',s).group(1))
source=constant('BATTLE_ART_SOURCE');ids=constant('BACK_SPRITES');out=root/'web/assets/back';out.mkdir(exist_ok=True)
def fetch(id):
 target=out/(str(id)+'.png')
 if target.exists() and target.read_bytes().startswith(b'\x89PNG\r\n\x1a\n'):return target.stat().st_size
 for attempt in range(3):
  try:
   with urllib.request.urlopen(source['url']+str(id)+'.png',timeout=25) as response:data=response.read()
   assert data.startswith(b'\x89PNG\r\n\x1a\n'),id
   target.write_bytes(data);return len(data)
  except Exception:
   if attempt==2:raise
   time.sleep(.5)
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:sizes=list(pool.map(fetch,ids))
print(f'Validated {len(ids)} rear-facing sprites, {sum(sizes)} bytes, commit {source["commit"]}.')
