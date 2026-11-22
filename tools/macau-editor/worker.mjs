// Private manuscript preview. This module handles only its two dedicated paths.
const BASE = '/manuscripts/macau';
const PREFIX = 'manuscript_edit:v1:macau:';
const BUNDLE = 'manuscript_bundle:v1:macau';
const EMAILS = new Set(['tojimasaya07@gmail.com', 'tjmjp22@gmail.com']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const PRIVATE = { 'cache-control':'private, no-store', 'x-content-type-options':'nosniff', 'referrer-policy':'no-referrer', 'x-robots-tag':'noindex, nofollow' };
const json = (x,status=200) => new Response(JSON.stringify(x),{status,headers:{...PRIVATE,'content-type':'application/json; charset=utf-8'}});
export function isManuscriptPath(path) { return path === BASE || path.startsWith(BASE + '/') || path === '/api/scan/manuscripts/macau'; }
function isTJ(req) { return EMAILS.has((req.headers.get('cf-access-authenticated-user-email')||'').toLowerCase()) && !!req.headers.get('cf-access-jwt-assertion'); }
export async function readState(env,bundle,knownRevision) {
  const records=[];let cursor;
  do {
    const page=await env.KV.list({prefix:PREFIX,...(cursor?{cursor}:{})});
    records.push(...(await Promise.all(page.keys.map(k=>env.KV.get(k.name,'json')))).filter(Boolean));
    cursor=page.list_complete?undefined:page.cursor;
    if(records.length>500)throw new Error('保存履歴が増えています。Macで原稿への反映を依頼してください。');
  }while(cursor);
  const fetched=new Map(records.map(r=>[r.id,r]));
  let known=knownRevision;const visited=new Set();
  while(known&&known!==bundle.seed){
    if(!UUID.test(known)||visited.has(known))throw new Error('保存履歴を確認できません。再読み込みしてください。');
    visited.add(known);
    const record=fetched.get(known)||await env.KV.get(PREFIX+known,'json');
    if(!record)throw new Error('保存内容を反映中です。少し待って再読み込みしてください。');
    if(record.id!==known)throw new Error('保存履歴を確認できません。');
    if(!fetched.has(known)){records.push(record);fetched.set(known,record);}
    known=record.parent;
    if(visited.size>500)throw new Error('保存履歴の照合が必要です。');
  }
  if(records.some(r=>r.seed!==bundle.seed))return {conflict:true,error:'元原稿が変更されています。編集をコピーして、Macで原稿の照合を依頼してください。',records};
  const parents=new Set(records.map(r=>r.parent));
  const heads=records.filter(r=>!parents.has(r.id));
  if(heads.length>1)return {conflict:true,error:'別の画面で保存された修正があります。編集をコピーして、Macで原稿の照合を依頼してください。',records};
  const byId=new Map(records.map(r=>[r.id,r]));const chain=[];let id=heads[0]?.id||bundle.seed;const seen=new Set();
  while(id!==bundle.seed){if(seen.has(id)||!byId.has(id))return {conflict:true,error:'保存履歴の確認が必要です。編集をコピーして、Macで確認を依頼してください。',records};seen.add(id);const r=byId.get(id);chain.unshift(r);id=r.parent;}
  const fields={...bundle.fields};
  for(const r of chain)Object.assign(fields,r.changes);
  return {revision:heads[0]?.id||bundle.seed,fields,chain:chain.map(r=>r.id),saved_at:heads[0]?.saved_at||null,records};
}
async function body(req) {
  const reader=req.body?.getReader();if(!reader)throw new Error('保存する本文がありません。');
  const chunks=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>120000){await reader.cancel();throw new Error('一度に保存する本文が大きすぎます。');}chunks.push(value);}
  const bytes=new Uint8Array(length);let i=0;for(const c of chunks){bytes.set(c,i);i+=c.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function handleManuscript(req,env) {
  const url=new URL(req.url);const machine=url.pathname==='/api/scan/manuscripts/macau';
  if(machine){if(!env.SCAN_SECRET||req.headers.get('authorization')!==`Bearer ${env.SCAN_SECRET}`)return json({error:'unauthorized'},401);if(req.method!=='GET')return json({error:'Method not allowed'},405);}
  else if(!isTJ(req))return json({error:'TJ Appsにログインし直してください。'},401);
  const bundle=await env.KV.get(BUNDLE,'json');if(!bundle)return json({error:'原稿を準備中です。'},503);
  if(machine||url.pathname===BASE+'/api'){
    if(req.method==='GET'){
      let state;try{state=await readState(env,bundle,url.searchParams.get('revision'));}catch(e){return json({error:e.message},503);}
      if(machine)return json({seed:bundle.seed,pages:bundle.pages,source_files:bundle.source_files,...state});
      if(state.conflict)return json({error:state.error,conflict:true},409);
      return json({seed:bundle.seed,revision:state.revision,fields:state.fields,chain:state.chain,saved_at:state.saved_at});
    }
    if(req.method!=='POST')return json({error:'Method not allowed'},405);
    if(req.headers.get('origin')!==url.origin||req.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return json({error:'この記事の編集画面から保存してください。'},403);
    let b;try{b=await body(req);}catch{return json({error:'保存する本文を読み取れません。'},400);}
    if(!b||typeof b!=='object'||Array.isArray(b)||!UUID.test(b.id)||b.seed!==bundle.seed||!Object.hasOwn(bundle.pages,b.page)||(b.parent!==bundle.seed&&!UUID.test(b.parent))||!b.changes||Array.isArray(b.changes)||typeof b.changes!=='object')return json({error:'元原稿を確認できません。再読み込みしてください。'},400);
    const entries=Object.entries(b.changes);const allowed=new Set(bundle.pages[b.page].fields);
    if(!entries.length||entries.length>200||entries.some(([key,value])=>!allowed.has(key)||typeof value!=='string'||value.length>15000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)))return json({error:'保存する本文を確認してください。'},400);
    const previous=await env.KV.get(PREFIX+b.id,'json');
    if(previous){if(previous.seed===b.seed&&previous.parent===b.parent&&previous.page===b.page&&JSON.stringify(previous.changes)===JSON.stringify(b.changes))return json({ok:true,revision:previous.id,saved_at:previous.saved_at});return json({error:'保存IDが重複しています。'},409);}
    let state;try{state=await readState(env,bundle,b.parent);}catch(e){return json({error:e.message},503);}
    if(state.conflict||state.revision!==b.parent)return json({error:state.error||'別の画面で新しい修正が保存されました。本文をコピーしてから再読み込みしてください。',conflict:true},409);
    const record={id:b.id,parent:b.parent,seed:b.seed,page:b.page,changes:Object.fromEntries(entries),saved_at:new Date().toISOString(),by:req.headers.get('cf-access-authenticated-user-email')};
    await env.KV.put(PREFIX+b.id,JSON.stringify(record));
    return json({ok:true,revision:record.id,saved_at:record.saved_at});
  }
  if(!['GET','HEAD'].includes(req.method))return json({error:'Method not allowed'},405);
  let path;try{path=decodeURIComponent(url.pathname.slice(BASE.length))||'/';}catch{return json({error:'Not found'},404);}
  if(path==='/'||path==='/index.html')path='/macau-travel-journal.html';
  if(!Object.hasOwn(bundle.assets,path))return json({error:'Not found'},404);
  const asset=bundle.assets[path];const bytes=await env.KV.get('manuscript_asset:v1:'+asset.hash,'arrayBuffer');
  if(!bytes)return json({error:'原稿ファイルを読み込めません。'},503);
  const headers={...PRIVATE,'content-type':asset.type};
  if(asset.type.startsWith('text/html'))headers['content-security-policy']="default-src 'self'; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.tile.openstreetmap.org; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
  return new Response(req.method==='HEAD'?null:bytes,{headers});
}
