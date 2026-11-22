#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Deploy just the private preview addition; retain live Worker code and assets."""
from pathlib import Path
from email.parser import BytesParser
from email import policy
import argparse,base64,hashlib,json,mimetypes,urllib.request,urllib.error,uuid,time
ROOT=Path(__file__).resolve().parents[2]
ACCOUNT='6f42bbd92ee59523a952fbbae4093251';NAMESPACE='24af8523fdff4bebbd3738bbd84aeb06'
API='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT
SCRIPT=API+'/workers/scripts/tj-launcher';KV=API+'/storage/kv/namespaces/'+NAMESPACE
p=argparse.ArgumentParser();p.add_argument('--deploy',action='store_true');p.add_argument('--bundle',type=Path,default=Path('/private/tmp/macau-editor-bundle'));args=p.parse_args()
token=(Path.home()/'.cloudflare-token').read_text().strip()
def call(url,method='GET',data=None,headers=None):
 h={'Authorization':'Bearer '+token,**(headers or {})}
 req=urllib.request.Request(url,method=method,data=data,headers=h)
 try:
  with urllib.request.urlopen(req,timeout=90) as res:return res.read(),res.headers
 except urllib.error.HTTPError as e:
  if e.code==404:return None,e.headers
  raw=e.read()
  try:info=json.loads(raw);message=json.dumps(info.get('errors',[]))
  except Exception:message=raw[:200].decode(errors='replace')
  raise RuntimeError('Cloudflare HTTP '+str(e.code)+': '+message) from None
def modules_of(raw,content_type):
 msg=BytesParser(policy=policy.default).parsebytes(('Content-Type: '+content_type+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+raw)
 return {(part.get_param('name',header='content-disposition') or part.get_filename()):(part.get_content_type(),part.get_payload(decode=True)) for part in msg.iter_parts()}
bundle=json.loads((args.bundle/'bundle.json').read_text())
original=(Path('/private/tmp/macau-live-worker')/'content').read_bytes()
live,headers=call(SCRIPT+'/content/v2')
baseline=modules_of(original,Path('/private/tmp/macau-live-worker/content-type').read_text())
if modules_of(live,headers['Content-Type'])!=baseline:raise SystemExit('Live Worker changed; stop and fetch a fresh baseline before deploying.')
existing,_=call(KV+'/values/manuscript_bundle%3Av1%3Amacau')
if existing and json.loads(existing).get('seed')!=bundle['seed']:
 data,_=call(KV+'/keys?prefix=manuscript_edit%3Av1%3Amacau%3A&limit=10')
 if json.loads(data).get('result'):raise SystemExit('Cloud edits exist against another seed; pull and reconcile first.')
asset_keys,_=call(KV+'/keys?prefix=manuscript_asset%3Av1%3A&limit=1000')
known={k['name'] for k in json.loads(asset_keys)['result']}
puts=[]
for path,meta in bundle['assets'].items():
 key='manuscript_asset:v1:'+meta['hash']
 if key in known:continue
 raw=(args.bundle/path.lstrip('/')).read_bytes()
 assert hashlib.sha256(raw).hexdigest()==meta['hash']
 puts.append({'key':key,'value':base64.b64encode(raw).decode(),'base64':True})
encoded=json.dumps(bundle,ensure_ascii=False,separators=(',',':'))
if existing is None or json.loads(existing)!=bundle:puts.append({'key':'manuscript_bundle:v1:macau','value':encoded})
print(json.dumps({'new_asset_writes':len(puts),'pages':len(bundle['pages']),'editable_blocks':len(bundle['fields']),'live_code_unchanged':True,'apply':args.deploy}))
if not args.deploy:raise SystemExit(0)
if puts:
 body=json.dumps(puts,separators=(',',':')).encode()
 result,_=call(KV+'/bulk','PUT',body,{'content-type':'application/json'})
 response=json.loads(result)
 if not response.get('success'):raise SystemExit('Private preview upload failed.')
 print('Private draft assets uploaded:',len(puts))
for attempt in range(9):
 readback,_=call(KV+'/values/manuscript_bundle%3Av1%3Amacau')
 if readback and json.loads(readback)==bundle:break
 if attempt==8:raise SystemExit('Bundle still propagating; assets retained, code not deployed. Retry later.')
 print('Waiting for private bundle readback...',flush=True);time.sleep(10)
fresh,fresh_headers=call(SCRIPT+'/content/v2')
latest=modules_of(fresh,fresh_headers['Content-Type'])
if latest!=baseline:raise SystemExit('Live Worker changed during preparation; not deploying code.')
modules=[(name,ctype,data) for name,(ctype,data) in latest.items()]
assert {m[0] for m in modules}=={'index.js','index.js.map'},'Unexpected live module layout'
modules.append(('macau-manuscripts.mjs','application/javascript+module',(ROOT/'tools/macau-editor/worker.mjs').read_bytes()))
wrapper=b"import live from './index.js';\nimport {isManuscriptPath,handleManuscript} from './macau-manuscripts.mjs';\nexport default {...live,fetch(request,env,ctx){return isManuscriptPath(new URL(request.url).pathname)?handleManuscript(request,env):live.fetch(request,env,ctx);}};\n"
modules.append(('macau-preview-entry.mjs','application/javascript+module',wrapper))
boundary='macau-'+uuid.uuid4().hex;payload=[]
def part(name,ctype,data):
 payload.extend([('--'+boundary+'\r\nContent-Disposition: form-data; name="'+name+'"'+('' if name=='metadata' else '; filename="'+name+'"')+'\r\nContent-Type: '+ctype+'\r\n\r\n').encode(),data,b'\r\n'])
part('metadata','application/json',json.dumps({'main_module':'macau-preview-entry.mjs'}).encode())
for name,ctype,data in modules:part(name,ctype,data)
payload.append(('--'+boundary+'--\r\n').encode())
result,_=call(SCRIPT+'/content','PUT',b''.join(payload),{'content-type':'multipart/form-data; boundary='+boundary})
response=json.loads(result)
if not response.get('success'):raise SystemExit('Source-only deployment failed.')
result_id=response.get('result',{}).get('deployment_id') or response.get('result',{}).get('etag')
print('Source-only deployment succeeded:',result_id)
after,_=call(SCRIPT+'/settings');before=json.loads((Path('/private/tmp/macau-live-worker')/'settings.json').read_text())
if sorted(json.loads(after)['result']['bindings'],key=lambda b:b['name'])!=sorted(before['result']['bindings'],key=lambda b:b['name']):raise SystemExit('Binding settings changed; inspect before proceeding.')
(Path('/private/tmp/macau-live-worker')/'deploy-result.json').write_text(json.dumps(response))
print('Existing bindings and static asset attachment retained.')
