(function(){
'use strict';
const page=document.body.dataset.manuscriptPage;const blocks=[...document.querySelectorAll('[data-edit-id]')];
let state=null,editing=false,dirty=false,saving=false,pending=null;
const key='macau-manuscript-unsaved:'+page;
const receiptKey='macau-manuscript-saved-revision';
function remember(){try{localStorage.setItem(receiptKey,JSON.stringify({seed:state.seed,revision:state.revision}));}catch{}}
const bar=document.createElement('aside');bar.className='manuscript-toolbar';bar.setAttribute('aria-label','原稿の校正');
bar.innerHTML='<div><strong>マカオ原稿・本人用</strong><span role="status" aria-live="polite">下書きを読み込み中…</span></div><button type="button" data-edit-toggle disabled>本文を編集</button><button type="button" data-edit-save disabled>下書きを保存</button><button type="button" data-edit-restore hidden>未保存の編集を復元</button>';
document.body.append(bar);const status=bar.querySelector('[role=status]'),toggle=bar.querySelector('[data-edit-toggle]'),save=bar.querySelector('[data-edit-save]'),restore=bar.querySelector('[data-edit-restore]');
function message(t){status.textContent=t;}
function text(el){return el.innerText.replace(/\r\n/g,'\n').trim();}
function changes(){const x={};for(const el of blocks){const id=el.dataset.editId,value=text(el);if(value!==state.fields[id])x[id]=value;}return x;}
function backup(){if(!state)return;dirty=Object.keys(changes()).length>0;save.disabled=!dirty||saving;if(dirty){try{localStorage.setItem(key,JSON.stringify({seed:state.seed,parent:state.revision,changes:changes()}));}catch{}message('未保存の変更があります。');}else{try{localStorage.removeItem(key);}catch{}}}
function apply(fields){for(const el of blocks){if(Object.hasOwn(fields,el.dataset.editId))el.textContent=fields[el.dataset.editId];}}
function showBackup(b){const dialog=document.createElement('dialog');dialog.className='manuscript-backup';const label=document.createElement('p');label.textContent='未保存の本文です。選択してコピーできます。';const area=document.createElement('textarea');area.readOnly=true;area.value=Object.values(b.changes).join('\n\n');const close=document.createElement('button');close.textContent='閉じる';close.onclick=()=>dialog.close();dialog.append(label,area,close);document.body.append(dialog);dialog.showModal();}
function edit(on){editing=on;document.body.classList.toggle('manuscript-editing',on);for(const el of blocks){el.contentEditable=on?'plaintext-only':'false';if(on){el.setAttribute('aria-label','編集：'+el.dataset.editLabel);el.spellcheck=true;}else el.removeAttribute('aria-label');}toggle.textContent=on?'閲覧に戻る':'本文を編集';}
for(const el of blocks){el.addEventListener('input',()=>{pending=null;backup();});el.addEventListener('paste',e=>{if(!editing)return;e.preventDefault();const value=e.clipboardData.getData('text/plain'),selection=getSelection();if(!selection.rangeCount)return;const range=selection.getRangeAt(0);range.deleteContents();const node=document.createTextNode(value);range.insertNode(node);range.setStartAfter(node);range.collapse(true);selection.removeAllRanges();selection.addRange(range);pending=null;backup();});}
toggle.onclick=()=>edit(!editing);
restore.onclick=()=>{try{const b=JSON.parse(localStorage.getItem(key));if(b.seed!==state.seed||b.parent!==state.revision){message('保存版と異なる編集です。未保存の本文をコピーしてMacで照合してください。');showBackup(b);return;}apply(b.changes);restore.hidden=true;edit(true);backup();}catch{message('未保存の編集を復元できませんでした。');}};
save.onclick=async()=>{if(!state||saving)return;const patch=changes();if(!Object.keys(patch).length)return;pending=pending||{id:crypto.randomUUID(),seed:state.seed,parent:state.revision,page,changes:patch};const submitted=pending;saving=true;save.disabled=true;message('下書きを保存しています…');try{const r=await fetch('/manuscripts/macau/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(submitted),cache:'no-store'});const data=await r.json();if(!r.ok)throw new Error(data.error||'保存できませんでした。');state.fields={...state.fields,...submitted.changes};state.revision=data.revision;remember();if(pending===submitted)pending=null;saving=false;backup();message(dirty?'保存後に追加した変更があります。もう一度保存してください。':'下書き保存済み・公開はしていません。');}catch(e){saving=false;save.disabled=false;message(e.message+' 編集はこの端末に残っています。');}};
window.addEventListener('beforeunload',e=>{if(dirty){backup();e.preventDefault();e.returnValue='';}});
document.addEventListener('click',e=>{const link=e.target.closest('a');if(link&&dirty&&link.getAttribute('href')?.startsWith('/manuscripts/macau/')&&!confirm('未保存の編集があります。この端末に残してページを移動しますか？'))e.preventDefault();});
let receipt;try{receipt=JSON.parse(localStorage.getItem(receiptKey));}catch{}
const query=receipt?.revision?'?revision='+encodeURIComponent(receipt.revision):'';
fetch('/manuscripts/macau/api'+query,{cache:'no-store'}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||'原稿を読み込めませんでした。');return data;}).then(data=>{state=data;remember();apply(data.fields);toggle.disabled=false;let b;try{b=JSON.parse(localStorage.getItem(key));}catch{}if(b&&Object.keys(b.changes||{}).length){restore.hidden=false;message('この端末に未保存の編集があります。「復元」で確認できます。');}else message(data.saved_at?'保存済みの下書きを表示しています。':'本文を編集して、下書き保存できます。');}).catch(e=>message(e.message+' 再読み込みしてください。'));
})();
