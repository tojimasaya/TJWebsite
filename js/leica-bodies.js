(() => {
  'use strict';
  const catalog = window.LEICA_CATALOG;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sources = new Map(catalog.sources.map(s=>[s.id,s]));
  const labels = {primary_source_checked:'一次資料で確認',partially_checked:'一部未確認',source_only:'原資料のみ・未照合',conflicting_sources:'資料間に相違'};
  const counts = catalog.counts;
  const fields = ['search','series','decade','direction','entry','image-state','origin','sort'];
  const hasImage = m => m.image.renditions.length > 0;
  const photoLinks = m => (window.LEICA_PHOTO_LINKS?.models[m.id] || []).filter(ref => ref.status === 'photo_page_checked');
  const hasPhotoLink = m => !hasImage(m) && photoLinks(m).length > 0;
  const currentPending = m => m.pending_ja.filter(note=>!note.includes('AI参考イラスト'));
  const photoLabel = m => hasImage(m) ? m.image.label_ja : hasPhotoLink(m) ? '外部の写真リンクあり' : m.entry_kind === 'model' ? '写真参照先未確認' : m.image.label_ja;
  const normalize = s => String(s ?? '').normalize('NFKC').toLocaleLowerCase().replace(/ライカ/g,'leica');
  const identityKey = s => normalize(s).trim().replace(/^leica(?!flex)/,'').replace(/\s+/g,'');
  const years = catalog.models.filter(m=>m.entry_kind==='model').map(m=>m.year).filter(Number.isFinite);
  $('#total-models').textContent = counts.independent_models;
  $('#intro-total').textContent = counts.independent_models;
  $('#year-range').textContent = `${Math.min(...years)} — ${Math.max(...years)}`;
  $('#coverage-summary').textContent = `独立${counts.independent_models}機種の画像：メーカー公式 ${counts.manufacturer_models} ／ Leica Classic ${counts.classic_models} ／ メーカー冊子 ${counts.document_models || 0} ／ 未収録 ${counts.pending_model_images}`;
  const linkedCount = catalog.models.filter(m=>m.entry_kind==='model' && hasPhotoLink(m)).length;
  $('#coverage-summary').textContent += `（外部写真リンクあり ${linkedCount} ／ 写真参照先未確認 ${counts.pending_model_images-linkedCount}）`;
  const series = [...new Map(catalog.models.map(m=>[m.category,m.category_ja])).entries()];
  $('#series').innerHTML = '<option value="">すべてのシリーズ</option>'+series.map(([id,label])=>`<option value="${esc(id)}">${esc(label)}</option>`).join('');
  $('#decade').innerHTML = '<option value="">すべての年代</option>'+[...new Set(years.map(y=>Math.floor(y/10)*10))].sort((a,b)=>a-b).map(y=>`<option value="${y}">${y}年代</option>`).join('');
  const params = new URLSearchParams(location.search);
  let view = params.get('view')==='table' ? 'table' : 'cards';
  let page = Math.max(1,parseInt(params.get('page'),10)||1);
  const pageSize = 24;
  fields.forEach(id=>{ const value=params.get(id);if(value){$('#'+id).value=value;if($('#'+id).tagName==='SELECT' && $('#'+id).selectedIndex===-1)$('#'+id).selectedIndex=0;} });
  if($('#entry').value!=='model'||$('#image-state').value||$('#origin').value)$('#advanced-filters').open=true;
  function image(m,detail=false) {
    const variants=m.image.renditions;
    if(!variants.length)return `<span class="photo-placeholder"><span>${esc(photoLabel(m))}</span><small>${hasPhotoLink(m)?(detail?'下のリンクから掲載元へ':'詳細から掲載元の写真へ'):m.entry_kind==='guide'||m.entry_kind==='accessory'?'比較・解説等の項目':'機種データは収録済み'}</small></span>`;
    return `<img src="${variants[detail?1:0].path}" srcset="${variants.map(r=>`${r.path} ${r.width}w`).join(', ')}" sizes="${detail?'(max-width: 850px) 90vw, 520px':'(max-width: 540px) calc(100vw - 40px), (max-width: 850px) calc((100vw - 84px) / 2), (max-width: 1199px) calc((100vw - 104px) / 3), (max-width: 1400px) calc((100vw - 156px) / 4), 311px'}" width="480" height="320" alt="${esc(m.name)}・${esc(m.image.label_ja)}・${esc(m.image.view_label_ja)}" ${detail?'':'loading="lazy"'} decoding="async">`;
  }
  function imageTag(m) {return esc(photoLabel(m))+(hasImage(m)&&m.image.origin==='manufacturer'?' · © Leica Camera AG':'');}
  function updateURL() {
    const p=new URLSearchParams();
    fields.forEach(id=>{const value=$('#'+id).value;if(value && !(id==='sort'&&value==='newest') && !(id==='entry'&&value==='model'))p.set(id,value);});
    if(view==='table')p.set('view',view);
    if(page>1)p.set('page',page);
    history.replaceState(null,'',location.pathname+(p.size?'?'+p.toString():'')+location.hash);
  }
  function render() {
    const query=normalize($('#search').value).trim().split(/\s+/).filter(Boolean);
    const entry=$('#entry').value;
    // A recognized model name should not also match another model's description.
    const identity=identityKey($('#search').value);
    const exactIds=new Set(identity?catalog.models.filter(m=>[m.name,...m.aliases].some(name=>identityKey(name)===identity)).map(m=>m.id):[]);
    const matchesQuery=m=>exactIds.size?exactIds.has(m.id):query.every(q=>normalize([m.name,...m.aliases,m.year,m.description_ja,m.category_ja,...m.facts.map(f=>f.value_ja)].join(' ')).includes(q));
    const related=query.length&&entry==='model'?catalog.models.filter(m=>m.entry_kind!=='model'&&matchesQuery(m)).length:0;
    $('#related-results').innerHTML=related?`<p class="related-note">仕様違い・試作・解説などにも ${related} 件あります。 <button type="button" data-all-entries>関連する項目も表示 →</button></p>`:'';
    const base=catalog.models.filter(m=>entry==='all'||m.entry_kind===entry);
    const list=base.filter(m=>{
      const state=$('#image-state').value;
      return matchesQuery(m) && (!$('#series').value||m.category===$('#series').value) && (!$('#direction').value||m.image.view===$('#direction').value) && (!$('#decade').value||Math.floor(m.year/10)*10===Number($('#decade').value)) && (!$('#origin').value||m.image.origin===$('#origin').value) && (!state || (state==='confirmed' ? hasImage(m) : state==='linked' ? hasPhotoLink(m) : state==='unlinked' ? !hasImage(m)&&!hasPhotoLink(m) : !hasImage(m)));
    }).sort((a,b)=>{
      if($('#sort').value==='name')return a.name.localeCompare(b.name);
      if(!Number.isFinite(a.year))return Number.isFinite(b.year)?1:0;
      if(!Number.isFinite(b.year))return -1;
      return $('#sort').value==='newest'?b.year-a.year:a.year-b.year;
    });
    const pages=Math.max(1,Math.ceil(list.length/pageSize));page=Math.min(page,pages);
    const shown=list.slice((page-1)*pageSize,page*pageSize);
    $('#count').innerHTML=`<strong>${list.length}</strong> / ${base.length} ${entry==='model'?'機種':'項目'}${list.length?` <span class="range-count">（${(page-1)*pageSize+1}–${(page-1)*pageSize+shown.length}件を表示）</span>`:''}`;
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
    if(!list.length)$('#results').innerHTML='<div class="empty"><strong>該当する項目がありません</strong><p>検索語や絞り込み条件を変えてください。巻き上げ方式違いなどは「仕様違い」に収録されています。</p><button type="button" data-all-entries>仕様違いなど全185項目から探す</button> <button type="button" data-reset>条件をクリア</button></div>';
    else if(view==='cards')$('#results').innerHTML=`<div class="card-grid">${shown.map(m=>`<article class="camera-card"><a href="#${m.id}" class="open-card" data-model="${m.id}" aria-label="${esc(m.name)}の詳細を開く"><span class="photo">${image(m)}${hasImage(m)&&m.image.view!=='front'?`<span class="angle-badge">${esc(m.image.view_label_ja)} · 正面画像未収録</span>`:''}</span><span class="card-meta"><span class="year">${esc(m.year_display)} <span>${esc(m.year_kind_ja)}</span></span><span>${esc(m.category_ja)}</span></span><h2>${esc(m.name)}</h2>${m.entry_kind!=='model'?`<p class="entry-kind">${esc(m.entry_kind_ja)}</p>`:''}<p class="description">${esc(m.description_ja)}</p></a><div class="card-bottom"><span class="image-tag">${imageTag(m)}</span><button class="details-link" data-model="${m.id}" aria-label="${esc(m.name)}の仕様・出典">仕様・出典 ↗</button></div>${cardPhotoLink(m)}</article>`).join('')}</div>`;
    else $('#results').innerHTML=`<p class="table-note">機種名を選ぶと詳細と出典が開きます。狭い画面では表を横にスクロールできます。</p><div class="table-wrap" tabindex="0" role="region" aria-label="機種仕様の比較表"><table><caption>検索結果${list.length}件のうち${shown.length}件を表示。年は登場／発売などの区分を併記しています。</caption><thead><tr><th scope="col">機種</th><th scope="col">年・区分</th><th scope="col">シリーズ</th><th scope="col">主な仕様・特徴</th><th scope="col">画像</th><th scope="col">確認状況</th></tr></thead><tbody>${shown.map(m=>`<tr><td class="model-cell"><button type="button" class="table-model" data-model="${m.id}">${esc(m.name)}</button>${m.entry_kind!=='model'?`<p class="entry-kind">${esc(m.entry_kind_ja)}</p>`:''}</td><td>${esc(m.year_display)}<br><span class="status">${esc(m.year_kind_ja)}</span></td><td>${esc(m.category_ja)}</td><td class="spec-cell">${m.facts.map(f=>`<p>${esc(f.label_ja)}：${esc(f.value_ja)}${f.verification!=='primary_source_checked'?`<br><span class="status unverified">${esc(labels[f.verification]||f.verification)}</span>`:''}</p>`).join('')}</td><td>${imageTag(m)}${hasImage(m)?`<br>${esc(m.image.view_label_ja)}`:''}${cardPhotoLink(m)}</td><td class="status">${esc(labels[m.verification]||m.verification)}${m.notes_ja.length?'<br>注記あり':''}</td></tr>`).join('')}</tbody></table></div>`;
    $('#pagination').hidden=pages===1;
    $('#pagination').innerHTML=`<button type="button" data-page="${page-1}" ${page===1?'disabled':''}>← 前の24件</button><span>${page} / ${pages} ページ</span><button type="button" data-page="${page+1}" ${page===pages?'disabled':''}>次の24件 →</button>`;
    updateURL();
  }
  function sourceLinks(ids) {
    return [...new Set(ids)].map(id=>{
      const s=sources.get(id);
      if(!s)return `<p class="detail-note">提供原資料 ${esc(id.replace('ref-','ページ'))}（一次資料での照合前・原資料の画像は本パッケージに未収録）</p>`;
      const link=/^https?:\/\//.test(s.url)?`<a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`:`<p class="detail-note">${esc(s.title)}：${esc(s.url)}</p>`;
      return link+(s.access?`<p class="detail-note unverified">${esc(s.access.status_ja)}（${esc(s.access.checked_at)}）</p>${s.access.fallback_path?`<a class="source-link" href="${esc(s.access.fallback_path)}" target="_blank" rel="noopener noreferrer">保存済みメーカー冊子を読む ↗</a>`:''}`:'');
    }).join('');
  }
  const externalLink=(url,label)=>url?`<a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`:'';
  function cardPhotoLink(m) {
    if(!hasPhotoLink(m))return '';
    return `<a class="photo-ref-link" href="${esc(photoLinks(m)[0].url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(m.name)}の写真を掲載元で見る">掲載元で写真を見る ↗</a>`;
  }
  function photoReferences(m) {
    if(!hasPhotoLink(m))return '';
    return `<div class="photo-references"><h3>外部の写真を見る</h3>${photoLinks(m).map(ref=>`<a class="photo-reference-button" href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.source_name)}で写真を見る ↗</a><p>${esc(ref.note_ja)}</p><small>${esc(ref.source_kind_ja)} ／ 写真掲載を確認：${esc(ref.checked_at)}</small>`).join('')}<p class="detail-note">掲載元のページを別タブで開きます。この図鑑には画像を転載していません。</p></div>`;
  }
  function provenance(m) {
    const i=m.image;
    if(!hasImage(m))return hasPhotoLink(m)?`<p>掲載用画像は未収録です。上の外部リンクで、掲載元の機種名と対応を確認した個体写真を参照できます。</p><p>写真参照リンクの確認と、年・仕様の照合は別に管理しています。</p>`:`<p>${esc(i.identity_evidence_ja)}</p><p>${esc(i.view_note_ja)}</p>`;
    return `<p>${esc(i.identity_evidence_ja)}</p><p>${esc(i.view_note_ja)}</p>${externalLink(i.page_url,'画像掲載元：'+i.label_ja)}${externalLink(i.original_url,i.origin==='manufacturer_document'?'メーカー冊子の保存元URL':i.download_package?'公式写真ZIP':'取得画像URL')}${i.download_package?`<p>ZIP内のファイル：${esc(i.download_package.member)}</p>`:''}${i.document?`<span>メーカー冊子の${esc(i.document.page)}ページを参照。</span><p>冊子SHA-256：<code>${esc(i.document.sha256)}</code></p>`:''}<p>掲載キャプション等：${esc(i.source_caption||i.official_alt)}</p><p>表示用画像の処理：${esc(i.treatment_ja)}</p>${i.seller?`<p>出品店：${esc(i.seller)}</p>`:''}`;
  }
  function openDetail(id) {
    const m=catalog.models.find(m=>m.id===id);if(!m)return;
    const i=m.image;
    $('#detail-content').innerHTML=`<div class="detail-body"><div class="detail-main"><figure class="detail-photo">${image(m,true)}<figcaption>${imageTag(m)}${hasImage(m)?` ／ ${esc(i.view_label_ja)} ／ 実寸比ではありません`:''}</figcaption>${photoReferences(m)}</figure><div class="detail-copy"><p class="eyebrow">${esc(m.year_display)} · ${esc(m.year_kind_ja)} <span>／ ${esc(m.category_ja)}</span></p><h2 id="detail-title">${esc(m.name)}</h2>${m.entry_kind!=='model'?`<p class="entry-kind">${esc(m.entry_kind_ja)}</p>`:''}<p>${esc(m.description_ja)}</p>${m.related_entry_ids?.length?`<p class="detail-note">巻き上げ方式別：${m.related_entry_ids.map(id=>{const related=catalog.models.find(x=>x.id===id);return `<a href="#${esc(id)}" data-model="${esc(id)}">${esc(related.name.replace('Leica M3 / ',''))} →</a>`;}).join(' ／ ')}</p>`:''}<div class="detail-actions"><a href="leica-serial.html?mode=camera">カメラのシリアル番号を調べる →</a><a href="gear-camera.html">私のLeicaと作例を見る →</a></div><dl>${m.facts.map(f=>`<dt>${esc(f.label_ja)}</dt><dd>${esc(f.value_ja)}<small class="${f.verification==='primary_source_checked'?'':'unverified'}">${esc(labels[f.verification]||f.verification)}</small></dd>`).join('')}</dl><p class="detail-note">年：${esc(labels[m.year_status]||m.year_status)}。<br>${m.notes_ja.map(esc).join('<br>')}</p></div></div><details class="detail-sources" open><summary>出典・画像の来歴・未確認事項</summary><div class="source-block"><h3>年・解説・仕様の根拠</h3>${sourceLinks([...m.year_source_ids,...m.description_source_ids,...m.facts.flatMap(f=>f.source_ids)])}<h3>画像の対応と取得元</h3>${provenance(m)}<h3>未確認事項</h3><ul>${currentPending(m).map(s=>`<li>${esc(s)}</li>`).join('')}</ul>${hasImage(m)?`<h3>利用条件 ／ ${esc(i.usage.checked_at)} 確認</h3><p>クレジット：${esc(i.credit)}</p><p>${esc(i.usage.note_ja)}</p><p>一般公開条件：${esc(i.usage.public_status)}。</p>`:''}<a class="source-link" href="leica-sources.html#${m.id}">この項目の出典・利用条件一覧 →</a><p class="detail-note">${m.is_supplemental?'追加調査で収録した機種です。M3本体の年・仕様を公式資料で確認し、原資料の巻き上げ方式別カードとは区別しています。':`元図鑑との対応：${esc(m.catalog_id)}（${esc(m.source_location.page)}ページ・${esc(m.source_location.item)}項目目）。説明・仕様と確認状況は元図鑑から継承しています。`}</p></div></details></div>`;
    if(!$('#detail').open)$('#detail').showModal();
    history.replaceState(null,'',location.pathname+location.search+'#'+m.id);
    $('#close-detail').focus();
  }
  function closeDetail() {$('#detail').close();}
  $('#detail').addEventListener('close',()=>history.replaceState(null,'',location.pathname+location.search));
  $('#close-detail').addEventListener('click',closeDetail);
  $('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDetail();}});
  $('#filters').addEventListener('submit',e=>e.preventDefault());
  const filterChanged=()=>{page=1;render();};
  $('#filters').addEventListener('input',filterChanged);
  $('#filters').addEventListener('change',filterChanged);
  $('#filters').addEventListener('reset',()=>{queueMicrotask(()=>{fields.filter(id=>id!=='sort').forEach(id=>$('#'+id).value=id==='entry'?'model':'');page=1;render();});});
  $('#sort').addEventListener('change',filterChanged);
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-detail-list]')){e.preventDefault();closeDetail();return;}
    const model=e.target.closest('[data-model]');if(model){e.preventDefault();openDetail(model.dataset.model);}
    const toggle=e.target.closest('[data-view]');if(toggle){view=toggle.dataset.view;render();}
    const target=e.target.closest('[data-page]');if(target&&!target.disabled){page=Number(target.dataset.page);render();$('#catalog').scrollIntoView();$('#count').setAttribute('tabindex','-1');$('#count').focus({preventScroll:true});}
    if(e.target.closest('[data-reset]'))$('#filters').reset();
    if(e.target.closest('[data-all-entries]')){$('#entry').value='all';$('#advanced-filters').open=true;page=1;render();}
  });
  window.addEventListener('hashchange',()=>{if(location.hash)openDetail(location.hash.slice(1));else if($('#detail').open)closeDetail();});
  render();if(location.hash)openDetail(location.hash.slice(1));
})();
