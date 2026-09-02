/* tojimasaya.com — 共通シェア行（Phase 1 簡易版）
   <div data-share data-title="…" data-url="…" data-page-id="…"
        data-label-x="X" data-label-copy="リンクをコピー" data-label-copied="コピーしました" data-label-share="共有"></div>
   を見つけて X / リンクをコピー / 端末の共有（navigator.share があるときだけ）を描く。
   クリックは growth.js の tjmGrowth.track('tjm_share', {label: page-id + '_' + 媒体}) に流す。
   Phase 5 で Facebook / LINE を足した完成版に差し替える予定。 */
(function () {
  'use strict';

  var ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
  var ICON_LINK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.59 13.41a1 1 0 0 1 0-1.41l2.83-2.83a1 1 0 1 1 1.41 1.41l-2.83 2.83a1 1 0 0 1-1.41 0zm-2.12 2.12a3 3 0 0 0 4.24 0l1.42-1.41 1.41 1.41-1.41 1.42a5 5 0 0 1-7.07-7.07l1.41-1.42 1.42 1.42-1.42 1.41a3 3 0 0 0 0 4.24zm7.06-7.06a3 3 0 0 0-4.24 0L9.88 9.88 8.46 8.46l1.42-1.41a5 5 0 0 1 7.07 7.07l-1.41 1.41-1.42-1.41 1.42-1.41a3 3 0 0 0 0-4.24z"/></svg>';
  var ICON_SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l4 4-1.41 1.41L13 6.83V15h-2V6.83L9.41 8.41 8 7l4-4zm-7 9h2v7h10v-7h2v9H5v-9z"/></svg>';

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

    var x = document.createElement('a');
    x.href = 'https://x.com/intent/post?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url);
    x.target = '_blank';
    x.rel = 'noopener';
    x.setAttribute('data-growth-label', 'share_x');
    x.innerHTML = ICON_X + '<span>' + L('x', 'X') + '</span>';
    x.addEventListener('click', function () { track('x', pageId); });
    wrap.appendChild(x);

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
    wrap.appendChild(copy);

    if (navigator.share) {
      var sh = document.createElement('button');
      sh.type = 'button';
      sh.innerHTML = ICON_SHARE + '<span>' + L('share', '共有') + '</span>';
      sh.addEventListener('click', function () {
        navigator.share({ title: title, url: url }).then(function () { track('native', pageId); }).catch(function () {});
      });
      wrap.appendChild(sh);
    }

    host.appendChild(wrap);
  }

  function init() {
    var hosts = document.querySelectorAll('[data-share]');
    for (var i = 0; i < hosts.length; i++) build(hosts[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
