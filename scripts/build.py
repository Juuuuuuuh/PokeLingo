import pathlib,json,base64,mimetypes
root=pathlib.Path(__file__).resolve().parent.parent
files={}
for p in (root/'web').rglob('*'):
 if p.is_file():
  path='/'+p.relative_to(root/'web').as_posix();mime=mimetypes.guess_type(str(p))[0] or 'application/octet-stream';files[path]={'body':base64.b64encode(p.read_bytes()).decode(),'type':mime}
worker=(root/'web/reward-rules.js').read_text()+'\n'+(root/'worker/api.mjs').read_text().replace('export async function handleAPI','async function handleAPI')+'\nconst ASSETS='+json.dumps(files,separators=(',',':'))+''';
export default {async fetch(request,env){const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return handleAPI(request,env);if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});const key=url.pathname==='/'?'/index.html':url.pathname;const asset=ASSETS[key];if(!asset)return new Response('Not found',{status:404});return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0)),{headers:{'Content-Type':asset.type+(asset.type.startsWith('text/')||asset.type.includes('javascript')?'; charset=utf-8':''),'Cache-Control':key.endsWith('.png')?'public,max-age=86400':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}})}};
'''
(root/'dist/server').mkdir(parents=True,exist_ok=True);(root/'dist/server/index.js').write_text(worker)
manifest=root/'.openai/hosting.json';d=json.loads(manifest.read_text());d.pop('static',None);manifest.write_text(json.dumps(d,indent=2)+'\n');print('Built worker:',len(worker.encode()),'bytes;',len(files),'embedded assets')
