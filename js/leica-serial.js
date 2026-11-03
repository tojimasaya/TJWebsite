(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = value => String(value ?? '').replace(/&amp;/g,'&').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key = name => String(name).toLowerCase().replace(/\s/g,'');
  const params = new URLSearchParams(location.search);
  let mode = ['camera','lens'].includes(params.get('mode')) ? params.get('mode') : 'all';
  let db = null;
  let bodyLinks = {};
  let timer;
  const input = $('#serial-input');
  input.value = params.get('serial') || '';
  const fmt = n => Number(n).toLocaleString('en-US');
  const endLabel = n => n ? fmt(n) : '上限未記録';
  function setMode(next) {
    mode = next;
    document.querySelectorAll('[data-mode]').forEach(button=>{
      const current=button.dataset.mode===mode;
      button.classList.toggle('active',current);
      button.setAttribute('aria-pressed',String(current));
    });
  }
  function updateURL() {
    const p = new URLSearchParams();
    if(input.value.trim())p.set('serial',input.value.trim());
    if(mode!=='all')p.set('mode',mode);
    history.replaceState(null,'',location.pathname+(p.size?'?'+p.toString():'')+location.hash);
  }
  function search() {
    if(!db)return;
    updateURL();
    $('#result-count').textContent='';
    const raw=input.value.normalize('NFKC').replace(/[\s,.\-]/g,'');
    if(!raw){$('#results').innerHTML='<p class="la-result-empty">番号を入力すると、ここに検索結果が表示されます。</p>';return;}
    if(!/^\d+$/.test(raw)||!Number.isSafeInteger(Number(raw))||Number(raw)<1){
      $('#results').innerHTML='<p class="la-result-empty la-result-error">シリアル番号を数字で入力してください。カンマ・空白・全角数字にも対応しています。</p>';return;
    }
    const serial=Number(raw);
    const matches=[];
    for(const type of ['lens','camera']){
      if(mode!=='all'&&mode!==type)continue;
      for(const row of db[type]){
        if(serial>=row.start&&serial<=(row.end||Infinity))matches.push({...row,type});
      }
    }
    $('#result-count').textContent=matches.length+'件';
    if(!matches.length){$('#results').innerHTML=`<p class="la-result-empty">番号 <strong>${fmt(serial)}</strong> に対応する登録データは見つかりませんでした。番号の入力と、カメラ／レンズの種類を確認してください。未収録の番号もあります。</p>`;return;}
    const cards=matches.map(row=>{
      const body=row.type==='camera' ? bodyLinks[key(row.model)] : null;
      return `<article class="la-result-card"><span class="la-result-type">${row.type==='camera'?'CAMERA ／ カメラ':'LENS ／ レンズ'}</span><h3 class="la-result-year">${esc(row.year)}<span class="sr-only">年の登録範囲</span></h3>${row.model?`<p class="la-result-model">${esc(row.model)}</p>`:''}<p class="la-result-range">番号範囲：${fmt(row.start)} — ${endLabel(row.end)}</p>${!row.end?'<p class="la-result-note">この登録範囲は上限未記録です。後年の番号を含む可能性があり、この結果だけで製造年を特定できません。</p>':''}${body?`<a href="leica-bodies.html#${encodeURIComponent(body.id)}">${esc(body.name)}をボディ図鑑で見る →</a>`:''}${row.type==='lens'?'<p class="la-result-note">レンズ名・焦点距離の特定には対応していません。</p>':''}</article>`;
    }).join('');
    $('#results').innerHTML=(matches.length>1?'<p class="la-result-note">複数の登録範囲が該当しています。種類とモデルを確認してください。</p>':'')+cards;
  }
  function fillTables() {
    $('#lens-tbody').innerHTML=db.lens.map(row=>`<tr><td>${esc(row.year)}</td><td>${fmt(row.start)}</td><td>${endLabel(row.end)}</td></tr>`).join('');
    $('#camera-tbody').innerHTML=db.camera.map(row=>{
      const body=bodyLinks[key(row.model)];
      return `<tr><td>${esc(row.year)}</td><td>${fmt(row.start)}</td><td>${endLabel(row.end)}</td><td>${body?`<a href="leica-bodies.html#${encodeURIComponent(body.id)}">${esc(row.model)}</a>`:esc(row.model)}</td></tr>`;
    }).join('');
  }
  $('#serial-form').addEventListener('submit',event=>{event.preventDefault();clearTimeout(timer);search();});
  input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,200);});
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{setMode(button.dataset.mode);search();}));
  setMode(mode);
  Promise.all([
    fetch('data/leica-serial.json').then(r=>{if(!r.ok)throw new Error('Serial data unavailable');return r.json();}),
    fetch('data/leica-body-links.json').then(r=>{if(!r.ok)throw new Error('Body links unavailable');return r.json();}).catch(()=>({}))
  ]).then(([data,links])=>{
    db=data;bodyLinks=links;fillTables();$('#search-btn').disabled=false;$('#search-btn').textContent='検索 →';search();
  }).catch(()=>{
    $('#search-btn').textContent='読み込み失敗';
    $('#results').innerHTML='<p class="la-result-empty la-result-error">番号データを読み込めませんでした。ページを再読み込みしてください。</p>';
  });
})();
