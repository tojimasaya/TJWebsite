/* tojimasaya.com — 購読モジュール（Phase 2）
   <div data-subscribe data-heading="更新を受け取る" data-note="…"></div> を見つけて
   Feed / note / X / YouTube / Instagram の行を描く。
   クリックは growth.js の tjmGrowth.track('tjm_subscribe_click', {label: 媒体}) に流す。
   メール購読はアカウント（Buttondown 等）を用意してから data-email="…" で有効化する。 */
(function () {
  'use strict';

  var ICONS = {
    feed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11a9 9 0 0 1 9 9h-2.5A6.5 6.5 0 0 0 4 13.5zm0-6a15 15 0 0 1 15 15h-2.5A12.5 12.5 0 0 0 4 7.5zM6 17.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>',
    note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h11.2L20 8.8V20H4zm2 2v12h12V9.8L14.2 6zM7.5 11h9v1.6h-9zm0 3.4h6.4V16H7.5z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.28 5 12 5 12 5s-6.28 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.72 19 12 19 12 19s6.28 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.06.42 2.23.06 1.3.07 1.69.07 4.9s0 3.6-.07 4.9c-.05 1.17-.25 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.17-1.06.37-2.23.42-1.3.06-1.69.07-4.9.07s-3.6 0-4.9-.07c-1.17-.05-1.8-.25-2.23-.42a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.17-.42-.37-1.06-.42-2.23C2.21 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.37 2.23-.42C8.4 2.21 8.8 2.2 12 2.2zm0 3.05A6.75 6.75 0 1 0 18.75 12 6.75 6.75 0 0 0 12 5.25zm0 11.13A4.38 4.38 0 1 1 16.38 12 4.38 4.38 0 0 1 12 16.38zm6.94-11.4a1.58 1.58 0 1 1-1.58-1.57 1.58 1.58 0 0 1 1.58 1.58z"/></svg>'
  };

  var LINKS = [
    { key: 'feed', label: 'Feed（RSS / Atom）', href: '/feed.xml', cls: 'is-feed' },
    { key: 'note', label: 'note', href: 'https://note.com/tojimasaya', external: true },
    { key: 'x', label: 'X', href: 'https://x.com/mongkok93', external: true },
    { key: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/TJVlog', external: true },
    { key: 'instagram', label: 'Instagram', href: 'https://instagram.com/tojimasaya', external: true }
  ];

  function track(medium) {
    if (window.tjmGrowth && typeof window.tjmGrowth.track === 'function') {
      window.tjmGrowth.track('tjm_subscribe_click', { label: medium, medium: medium });
    }
  }

  function build(host) {
    var box = document.createElement('section');
    box.className = 'tjm-subscribe';
    box.setAttribute('aria-label', '更新を受け取る');

    var h = document.createElement('p');
    h.className = 'tjm-subscribe__heading';
    h.textContent = host.getAttribute('data-heading') || '更新を受け取る';
    box.appendChild(h);

    var note = host.getAttribute('data-note');
    if (note) {
      var n = document.createElement('p');
      n.className = 'tjm-subscribe__note';
      n.textContent = note;
      box.appendChild(n);
    }

    var row = document.createElement('div');
    row.className = 'tjm-subscribe__links';
    LINKS.forEach(function (l) {
      var a = document.createElement('a');
      a.href = l.href;
      if (l.cls) a.className = l.cls;
      if (l.external) { a.target = '_blank'; a.rel = 'noopener'; }
      a.setAttribute('data-growth-label', 'subscribe_' + l.key);
      a.innerHTML = ICONS[l.key] + '<span></span>';
      a.querySelector('span').textContent = l.label;
      a.addEventListener('click', function () { track(l.key); });
      row.appendChild(a);
    });
    box.appendChild(row);

    host.replaceWith(box);
  }

  function init() {
    var hosts = document.querySelectorAll('[data-subscribe]');
    for (var i = 0; i < hosts.length; i++) build(hosts[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
