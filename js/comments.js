/**
 * tojimasaya.com - コメント欄 (Cusdis)
 *
 * 有効化するには CUSDIS_APP_ID に cusdis.com のダッシュボードで発行される
 * App ID を設定するだけ。空のままなら何も表示されない。
 * 対象ページには <div id="comments-slot"></div> を置く。
 */
(function () {
  'use strict';

  var CUSDIS_APP_ID = '9f52aa98-e437-47cb-81f7-1cdc411a7cf8'; // cusdis.com App ID

  if (!CUSDIS_APP_ID) return;

  var slot = document.getElementById('comments-slot');
  if (!slot) return;

  function currentTheme() {
    var saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  var style = document.createElement('style');
  style.textContent =
    '.comments-section{max-width:720px;margin:0 auto 80px;padding:0 24px;scroll-margin-top:90px;}' +
    '.comments-section h2{font-family:"Noto Serif JP",serif;font-size:1.3rem;font-weight:600;' +
    'margin:0 0 0.8em;padding-bottom:10px;border-bottom:1px solid var(--border-color);color:var(--text-color);}' +
    '.comments-intro{font-family:var(--primary-font);font-size:0.85rem;color:var(--text-light);' +
    'line-height:1.9;margin:0 0 1.6em;}';
  document.head.appendChild(style);

  var section = document.createElement('section');
  section.className = 'comments-section';
  section.id = 'comments';
  section.setAttribute('aria-label', 'コメント');

  var h2 = document.createElement('h2');
  h2.textContent = 'コメント — 情報のアップデート歓迎';
  section.appendChild(h2);

  var intro = document.createElement('p');
  intro.className = 'comments-intro';
  intro.textContent = '制度や条件は変わります。「ここはもう変わっているよ」という最新情報や、みなさんの体験談をぜひ。名前だけで匿名投稿できます（承認後に公開されます）。';
  section.appendChild(intro);

  var thread = document.createElement('div');
  thread.id = 'cusdis_thread';
  thread.setAttribute('data-host', 'https://cusdis.com');
  thread.setAttribute('data-app-id', CUSDIS_APP_ID);
  thread.setAttribute('data-page-id', location.pathname);
  thread.setAttribute('data-page-url', location.origin + location.pathname);
  thread.setAttribute('data-page-title', document.title);
  thread.setAttribute('data-theme', currentTheme());
  thread.setAttribute('data-lang', 'ja');
  section.appendChild(thread);

  slot.replaceWith(section);

  var script = document.createElement('script');
  script.src = 'https://cusdis.com/js/cusdis.es.js';
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);

  // サイトのダーク/ライト切替に追従
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'theme-toggle' && window.CUSDIS && window.CUSDIS.setTheme) {
      setTimeout(function () {
        window.CUSDIS.setTheme(currentTheme());
      }, 50);
    }
  });

  // 「書き込みはこちら」→コメント欄への確実なジャンプ
  // 遅延読み込み画像やコメントiframeでレイアウトが伸びるため、
  // 上の画像を先読みし、ロード完了ごとに再スクロールして着地を確定させる
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href="#comments"]') : null;
    if (!a) return;
    e.preventDefault();
    var target = document.getElementById('comments');
    if (!target) return;
    var jump = function (smooth) {
      target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    };
    var imgs = document.querySelectorAll('img[loading="lazy"]');
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].loading = 'eager';
      if (!imgs[i].complete) imgs[i].addEventListener('load', function () { jump(false); }, { once: true });
    }
    jump(true);
    // フォント・iframe等の遅れた再レイアウトも拾う短いテール
    var tries = 0;
    (function settle() { jump(false); if (++tries < 6) setTimeout(settle, 300); })();
  });
})();
