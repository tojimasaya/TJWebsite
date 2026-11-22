#!/usr/bin/env python3
"""Build a private editable copy; leave the website originals untouched."""
from pathlib import Path
from html import unescape
from html.parser import HTMLParser
import re,json,hashlib,mimetypes,sys
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/private/tmp/macau-editor-bundle')
PREFIX='/manuscripts/macau'
PAGES=['macau-travel-journal.html','macau-photographs.html','macau-bridge-hotel.html','macau-food.html','macau-lisboa-memories.html']
class Text(HTMLParser):
 def __init__(self):super().__init__();self.parts=[]
 def handle_data(self,data):self.parts.append(data)
 def handle_starttag(self,tag,attrs):
  if tag=='br':self.parts.append('\n')
def plain(value):
 x=Text();x.feed(value);return ''.join(x.parts).strip()
fields={};pages={};source_files={};outputs={}
for page in PAGES:
 raw=(ROOT/page).read_text();source_files[page]=hashlib.sha256(raw.encode()).hexdigest()
 title=plain(re.search(r'<h1[^>]*>(.*?)</h1>',raw,re.S)[1]).replace('\n',' ')
 exclude=[m.span() for m in re.finditer(r'<nav\b.*?</nav>|<section class="macau-route".*?</section>',raw,re.S)]
 edits=[];pagefields=[];blocks=[]
 main_start=raw.index('<main ');main_end=raw.index('</main>')
 for m in re.finditer(r'<(h[1-3]|p|figcaption|li)(\s[^>]*|)>(.*?)</\1>',raw,re.S):
  if not main_start<m.start()<main_end or any(a<=m.start()<b for a,b in exclude):continue
  if re.search(r'<a\b|<button\b|<script\b|class="(?:macau-eyebrow|macau-scene-number)',m[0]):continue
  value=plain(m[3])
  if not value:continue
  id=page.removesuffix('.html')+'-'+str(len(pagefields)+1).zfill(3)
  fields[id]=value;pagefields.append(id)
  blocks.append({'id':id,'tag':m[1],'original':m[3],'start':m.start(3),'end':m.end(3),'text':value})
  attr=' data-edit-id="'+id+'" data-edit-label="'+('見出し' if m[1].startswith('h') else '写真の説明' if m[1]=='figcaption' else '本文')+'"'
  edits.append((m.start(),m.end(),'<'+m[1]+m[2]+attr+'>'+m[3]+'</'+m[1]+'>'))
 for a,b,new in reversed(edits):raw=raw[:a]+new+raw[b:]
 pages[page]={'title':title,'fields':pagefields,'blocks':blocks}
 # The private preview uses the same layout, without public-site analytics.
 raw=re.sub(r'<script\b(?![^>]*src="(?:/(?:js/photo-lightbox|assets/js/macau-route-map)|https://unpkg.com/leaflet@1\.9\.4/))[^>]*>.*?</script>','',raw,flags=re.S)
 raw=raw.replace('<body class="macau-page">','<body class="macau-page" data-manuscript-page="'+page+'">')
 raw=raw.replace('<main id="main-content">','<header class="manuscript-header"><a href="'+PREFIX+'/">マカオ原稿・校正</a><span>本人用・未公開</span></header><main id="main-content">')
 raw=raw.replace('href="/trips.html"','href="https://tojimasaya.com/trips.html"')
 raw=re.sub(r'<link[^>]*(?:rel="icon"|rel="apple-touch-icon")[^>]*>','',raw)
 # Each local resource and internal manuscript link is scoped to the private handler.
 raw=re.sub(r'(src|href|srcset)="/(?!/)(?!manuscripts/macau/)([^" ]+)',lambda m:m[1]+'="'+PREFIX+'/'+m[2],raw)
 raw=raw.replace('.jpg"','.webp"')
 raw=raw.replace('</head>','<link rel="stylesheet" href="'+PREFIX+'/editor.css"></head>')
 raw=raw.replace('</body>','<script src="'+PREFIX+'/editor.js" defer></script></body>')
 outputs['/'+page]=raw.encode()
for rel in ['style.css','assets/macau.css','js/photo-lightbox.js','assets/js/macau-route-map.js','data/macau-bridge-route.geojson']:
 data=(ROOT/rel).read_bytes()
 if rel.endswith('.js'):data=data.replace(b"'/data/macau-bridge-route.geojson'",("'"+PREFIX+"/data/macau-bridge-route.geojson'").encode())
 outputs['/'+rel]=data
for p in (ROOT/'assets/images/trips/macau').glob('*.webp'):outputs['/assets/images/trips/macau/'+p.name]=p.read_bytes()
for name in ['editor.js','editor.css']:outputs['/'+name]=(Path(__file__).parent/name).read_bytes()
seed=hashlib.sha256(json.dumps(source_files,sort_keys=True).encode()).hexdigest()
assets={}
for path,data in outputs.items():
 target=OUT/path.lstrip('/');target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
 assets[path]={'hash':hashlib.sha256(data).hexdigest(),'type':mimetypes.guess_type(path)[0] or 'application/octet-stream'}
 if assets[path]['type'].startswith(('text/','application/javascript','application/json')):assets[path]['type']+='; charset=utf-8'
bundle={'seed':seed,'fields':fields,'pages':pages,'source_files':source_files,'assets':assets}
(OUT/'bundle.json').write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':')))
print(json.dumps({'output':str(OUT),'seed':seed,'pages':len(pages),'editable_blocks':len(fields),'assets':len(assets),'bytes':sum(map(len,outputs.values()))},ensure_ascii=False))
