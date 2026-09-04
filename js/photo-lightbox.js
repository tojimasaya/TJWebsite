// 組写真(ph-pair/ph-trio/ph-side)の小さな写真をクリックで拡大表示する。
// 断章の個別ページ(fragments/*.html)でも使う。あちらの .fp-sides は
// aspect-ratio 4/3 で切り抜いた小さなサムネイルなので、拡大できないと写真が読めない。
(function () {
  'use strict';

  const imgs = document.querySelectorAll(
    '.ph-pair img, .ph-trio img, .ph-side img, .ph-tallart img, .fp-figure img, .fp-sides img'
  );
  if (!imgs.length) return;

  const dlg = document.createElement('dialog');
  if (typeof dlg.showModal !== 'function') return;
  dlg.className = 'photo-lightbox';
  dlg.innerHTML = '<button type="button" class="lb-close" aria-label="閉じる">&#215;</button><figure><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(dlg);

  const dImg = dlg.querySelector('img');
  const dCap = dlg.querySelector('figcaption');

  imgs.forEach(function (img) {
    img.addEventListener('click', function () {
      dImg.src = img.currentSrc || img.src;
      dImg.alt = img.alt || '';
      const fig = img.closest('figure');
      const cap = fig ? fig.querySelector('figcaption') : null;
      dCap.textContent = cap ? cap.textContent : '';
      dCap.style.display = cap ? '' : 'none';
      dlg.showModal();
    });
  });

  dlg.addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('close', function () { dImg.src = ''; });
})();
