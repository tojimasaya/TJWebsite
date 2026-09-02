/* tojimasaya.com — 共通シェア行（Phase 5 完成版）
   <div data-share data-title="…" data-url="…" data-page-id="…"
        data-label-x="X" data-label-copy="リンクをコピー" data-label-copied="コピーしました" data-label-share="共有"></div>
   を見つけて X / リンクをコピー / 端末の共有（navigator.share があるときだけ）を描く。
   クリックは growth.js の tjmGrowth.track('tjm_share', {label: page-id + '_' + 媒体}) に流す。
   モバイル（navigator.share あり）では [共有] 1 ボタンにまとめる。 */
(function () {
  'use strict';

  var ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
  var ICON_LINK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.59 13.41a1 1 0 0 1 0-1.41l2.83-2.83a1 1 0 1 1 1.41 1.41l-2.83 2.83a1 1 0 0 1-1.41 0zm-2.12 2.12a3 3 0 0 0 4.24 0l1.42-1.41 1.41 1.41-1.41 1.42a5 5 0 0 1-7.07-7.07l1.41-1.42 1.42 1.42-1.42 1.41a3 3 0 0 0 0 4.24zm7.06-7.06a3 3 0 0 0-4.24 0L9.88 9.88 8.46 8.46l1.42-1.41a5 5 0 0 1 7.07 7.07l-1.41 1.41-1.42-1.41 1.42-1.41a3 3 0 0 0 0-4.24z"/></svg>';
  var ICON_SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l4 4-1.41 1.41L13 6.83V15h-2V6.83L9.41 8.41 8 7l4-4zm-7 9h2v7h10v-7h2v9H5v-9z"/></svg>';
  var ICON_FB = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z"/></svg>';
  var ICON_LINE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 5.66 2 10.17c0 4.04 3.55 7.42 8.35 8.06.33.07.78.22.89.5.1.26.07.66.03.92l-.14.86c-.04.26-.2 1.01.89.55 1.09-.46 5.86-3.45 8-5.91 1.47-1.61 2-3.25 2-4.98C22 5.66 17.52 2 12 2zM7.6 12.9H5.55a.53.53 0 0 1-.53-.53V8.28c0-.29.24-.53.53-.53s.53.24.53.53v3.56H7.6c.29 0 .53.24.53.53s-.24.53-.53.53zm2.07-.53c0 .29-.24.53-.53.53a.53.53 0 0 1-.53-.53V8.28c0-.29.24-.53.53-.53s.53.24.53.53v4.09zm4.94 0c0 .23-.15.43-.36.5a.6.6 0 0 1-.17.03.53.53 0 0 1-.43-.21l-2.1-2.85v2.53c0 .29-.24.53-.53.53a.53.53 0 0 1-.53-.53V8.28c0-.23.15-.43.36-.5a.5.5 0 0 1 .17-.03c.16 0 .32.08.42.21l2.11 2.86V8.28c0-.29.24-.53.53-.53s.53.24.53.53v4.09zm3.32-2.58c.29 0 .53.24.53.53s-.24.53-.53.53h-1.51v.96h1.51c.29 0 .53.24.53.53s-.24.53-.53.53h-2.04a.53.53 0 0 1-.53-.53V8.28c0-.29.24-.53.53-.53h2.04c.29 0 .53.24.53.53s-.24.53-.53.53h-1.51v.96h1.51z"/></svg>';

  function track(medium, pageId) {
    if (window.tjmGrowth && typeof window.tjmGrowth.track === 'function') {
      window.tjmGrowth.track('tjm_share', { label: pageId + '_' + medium, medium: medium });
    }
  }

  function build(host) {
    var title = host.getAttribute('data-title') || document.title;
    var url = host.getAttribute('data-url') || (location.origin + location.pathname);
    var pageId = host.getAttribute('data-page-id') || location.pathname;
    var L = function (k, d) { return host.getAttribute('data-label-' + k) || d; };

    var wrap = document.createElement('div');
    wrap.className = 'tjm-share';

    // モバイルで端末の共有が使えるときは、ボタンを並べず [共有] と [リンクをコピー] だけにする
    var compact = Boolean(navigator.share) && window.matchMedia('(max-width: 640px)').matches;
    if (compact) {
      var one = document.createElement('button');
      one.type = 'button';
      one.innerHTML = ICON_SHARE + '<span>' + L('share', '共有') + '</span>';
      one.addEventListener('click', function () {
        navigator.share({ title: title, url: url }).then(function () { track('native', pageId); }).catch(function () {});
      });
      wrap.appendChild(one);
      wrap.appendChild(copyButton(host, url, pageId, L));
      host.appendChild(wrap);
      return;
    }

    var x = document.createElement('a');
    x.href = 'https://x.com/intent/post?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url);
    x.target = '_blank';
    x.rel = 'noopener';
    x.setAttribute('data-growth-label', 'share_x');
    x.innerHTML = ICON_X + '<span>' + L('x', 'X') + '</span>';
    x.addEventListener('click', function () { track('x', pageId); });
    wrap.appendChild(x);

    var fb = document.createElement('a');
    fb.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
    fb.target = '_blank';
    fb.rel = 'noopener';
    fb.setAttribute('data-growth-label', 'share_facebook');
    fb.innerHTML = ICON_FB + '<span>' + L('facebook', 'Facebook') + '</span>';
    fb.addEventListener('click', function () { track('facebook', pageId); });
    wrap.appendChild(fb);

    var line = document.createElement('a');
    line.href = 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title);
    line.target = '_blank';
    line.rel = 'noopener';
    line.setAttribute('data-growth-label', 'share_line');
    line.innerHTML = ICON_LINE + '<span>' + L('line', 'LINE') + '</span>';
    line.addEventListener('click', function () { track('line', pageId); });
    wrap.appendChild(line);

    wrap.appendChild(copyButton(host, url, pageId, L));

    host.appendChild(wrap);
  }

  function copyButton(host, url, pageId, L) {
    var copy = document.createElement('button');
    copy.type = 'button';
    copy.innerHTML = ICON_LINK + '<span>' + L('copy', 'リンクをコピー') + '</span>';
    copy.addEventListener('click', function () {
      var done = function () {
        copy.classList.add('is-done');
        copy.querySelector('span').textContent = L('copied', 'コピーしました');
        setTimeout(function () { copy.classList.remove('is-done'); copy.querySelector('span').textContent = L('copy', 'リンクをコピー'); }, 2000);
        track('copy', pageId);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt(L('copy', 'リンクをコピー'), url); });
      } else {
        window.prompt(L('copy', 'リンクをコピー'), url);
      }
    });
    return copy;
  }

  function init() {
    var hosts = document.querySelectorAll('[data-share]');
    for (var i = 0; i < hosts.length; i++) build(hosts[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
