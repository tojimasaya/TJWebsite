#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Read the private manuscript history; apply only with explicit --apply."""
from pathlib import Path
from datetime import datetime,timezone
import argparse,hashlib,html,json,os,tempfile,urllib.request
ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');p.add_argument('--snapshot',type=Path);args=p.parse_args()
secret_path=Path.home()/'.tj-launcher-scan-secret'
req=urllib.request.Request('https://tj-launcher.tjmjp22.workers.dev/api/scan/manuscripts/macau',headers={'Authorization':'Bearer '+secret_path.read_text().strip(),'User-Agent':'TJ-Manuscript/1.0'})
with urllib.request.urlopen(req,timeout=30) as response:data=json.load(response)
if data.get('conflict'):raise SystemExit('保存履歴に分岐があります。どの履歴も削除せず、先に照合してください。')
changes={};updated={}
for page,meta in data['pages'].items():
 target=ROOT/page;raw=target.read_text();expected=data['source_files'][page]
 if hashlib.sha256(raw.encode()).hexdigest()!=expected:raise SystemExit(page+' の元原稿が変更されています。保存履歴との照合が必要です。')
 edits=[]
 for block in meta['blocks']:
  value=data['fields'][block['id']]
  if value!=block['text']:
   if raw[block['start']:block['end']]!=block['original']:raise SystemExit('原稿内の編集位置を確認できません。')
   edits.append((block['start'],block['end'],html.escape(value).replace('\n','<br>')))
 if edits:
  for a,b,text in reversed(edits):raw=raw[:a]+text+raw[b:]
  changes[page]=len(edits);updated[page]=raw
stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
snapshot=args.snapshot or Path('/Users/tjm/Documents/New project/work/macau-editor/snapshots')/stamp
snapshot.mkdir(parents=True,exist_ok=False)
(snapshot/'cloud-history.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'revision':data['revision'],'changed_blocks':changes,'history_saved':str(snapshot),'mode':'apply' if args.apply else 'check-only'},ensure_ascii=False))
if not args.apply:raise SystemExit(0)
for page in updated:(snapshot/page).write_bytes((ROOT/page).read_bytes())
for page,text in updated.items():
 target=ROOT/page
 if hashlib.sha256(target.read_bytes()).hexdigest()!=data['source_files'][page]:raise SystemExit('保存直前に元原稿が変更されました: '+page)
 fd,name=tempfile.mkstemp(prefix='.'+page+'.',dir=target.parent)
 try:
  with os.fdopen(fd,'w',encoding='utf-8') as stream:stream.write(text);stream.flush();os.fsync(stream.fileno())
  os.replace(name,target)
  if target.read_text()!=text:raise RuntimeError('保存後の照合に失敗しました: '+page)
 finally:
  if os.path.exists(name):os.unlink(name)
print('元HTMLへの反映と読み直しが完了しました。公開はしていません。')
