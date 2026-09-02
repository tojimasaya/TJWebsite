/* tojimasaya.com — ハンドブックの目次（Phase 4 / 提案3）
   本文（.essay か main）の h2 を拾って目次を作り、[data-toc] の位置に差し込む。
   ・h2 が 3 つ未満のページ、すでに手書きの目次（.guide-toc）があるページでは何もしない。
   ・id の無い h2 には見出しの順番から id を振る（既存のリンクは壊さない）。 */
(function () {
  'use strict';

  function slot() {
    return document.querySelector('[data-toc]');
  }

  function build() {
    var host = slot();
    if (!host) return;
    if (document.querySelector('.guide-toc')) { host.remove(); return; }

    var scope = document.querySelector('.essay') || document.getElementById('main-content');
    if (!scope) { host.remove(); return; }

    var headings = [].slice.call(scope.querySelectorAll('h2'));
    if (headings.length < 3) { host.remove(); return; }

    var nav = document.createElement('nav');
    nav.className = 'hb-toc';
    nav.setAttribute('aria-label', '目次');

    var title = document.createElement('p');
    title.className = 'hb-toc-title';
    title.textContent = host.getAttribute('data-toc-title') || '目次';
    nav.appendChild(title);

    var ol = document.createElement('ol');
    headings.forEach(function (h, i) {
      if (!h.id) h.id = 'sec-' + (i + 1);
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = (h.textContent || '').replace(/\s+/g, ' ').trim();
      a.setAttribute('data-growth-label', 'handbook_toc');
      li.appendChild(a);
      ol.appendChild(li);
    });
    nav.appendChild(ol);

    host.replaceWith(nav);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
