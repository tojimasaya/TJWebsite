/* shirasagi36/view.js — 一景ページの小さな振る舞い（JA / EN / HK 共通、手で編集してよい）
   1) モバイルメニュー  2) 写真クリックで拡大（<dialog>）  3) 「ここで撮る」のミニ地図を、見えたときだけ Leaflet を読み込んで描く */
(function () {
  'use strict';

  /* 0) テーマ初期化＆ダークモード切替・検索リンク */
  var savedTheme = localStorage.getItem('theme');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

  var htmlLang = (document.documentElement.lang || 'ja').toLowerCase();
  var isEn = htmlLang.indexOf('en') === 0;
  var isHk = htmlLang.indexOf('zh') === 0;

  function getCurrentTheme() {
    var saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function getThemeIcon(theme) {
    var shape = theme === 'dark'
      ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'
      : '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>';
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + shape + '</svg>';
  }
  function getThemeLabel(theme) {
    if (isEn) return theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    if (isHk) return theme === 'dark' ? '切換至淺色模式' : '切換至深色模式';
    return theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え';
  }
  var searchLabel = isEn ? 'Search site' : isHk ? '站內搜尋' : 'サイト内検索';
  var searchIcon = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';

  var initialTheme = getCurrentTheme();
  var desktopNav = document.querySelector('.v-nav__menu');
  if (desktopNav && !document.getElementById('theme-toggle')) {
    desktopNav.insertAdjacentHTML('beforeend',
      '<a href="/search.html" class="nav-search-link" aria-label="' + searchLabel + '" title="' + searchLabel + '">' + searchIcon + '</a>' +
      '<button class="theme-toggle" id="theme-toggle" type="button" aria-label="' + getThemeLabel(initialTheme) + '" title="' + getThemeLabel(initialTheme) + '">' + getThemeIcon(initialTheme) + '</button>'
    );
  }
  var mobileNav = document.getElementById('v-mobile');
  if (mobileNav && !mobileNav.querySelector('.site-nav-mobile-tools')) {
    mobileNav.insertAdjacentHTML('beforeend',
      '<div class="site-nav-mobile-tools">' +
        '<a href="/search.html">' + searchIcon + '<span>' + searchLabel + '</span></a>' +
        '<button type="button" class="js-theme-toggle-mobile" aria-label="' + getThemeLabel(initialTheme) + '">' + getThemeIcon(initialTheme) + '<span>' + (initialTheme === 'dark' ? 'Light' : 'Dark') + '</span></button>' +
      '</div>'
    );
  }
  function toggleViewTheme() {
    var next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.innerHTML = getThemeIcon(next);
      btn.setAttribute('aria-label', getThemeLabel(next));
      btn.setAttribute('title', getThemeLabel(next));
    }
    document.querySelectorAll('.js-theme-toggle-mobile').forEach(function (mBtn) {
      mBtn.innerHTML = getThemeIcon(next) + '<span>' + (next === 'dark' ? 'Light' : 'Dark') + '</span>';
      mBtn.setAttribute('aria-label', getThemeLabel(next));
    });
  }
  var tBtn = document.getElementById('theme-toggle');
  if (tBtn) tBtn.addEventListener('click', toggleViewTheme);
  document.querySelectorAll('.js-theme-toggle-mobile').forEach(function (mBtn) {
    mBtn.addEventListener('click', toggleViewTheme);
  });

  /* 1) モバイルメニュー */
  var menu = document.getElementById('v-mobile');
  var moreMenus = document.querySelectorAll('.v-nav__more');
  function setMenu(open, restoreFocus) {
    if (!menu) return;
    menu.classList.toggle('is-open', open);
    if (!open) menu.querySelectorAll('.v-nav__more').forEach(function (details) { details.open = false; });
    document.body.classList.toggle('is-menu-open', open);
    var btn = document.querySelector('.v-nav__toggle');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) menu.querySelector('.v-mobile__close').focus();
    else if (restoreFocus && btn) btn.focus();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-menu]') : null;
    if (!t) return;
    e.preventDefault();
    setMenu(t.getAttribute('data-menu') === 'open', true);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openMore = Array.from(moreMenus).find(function (details) { return details.open; });
    if (openMore) {
      openMore.open = false;
      openMore.querySelector('summary').focus();
    } else if (menu && menu.classList.contains('is-open')) setMenu(false, true);
  });
  document.addEventListener('click', function (e) {
    moreMenus.forEach(function (details) { if (!details.contains(e.target)) details.open = false; });
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024 && menu && menu.classList.contains('is-open')) setMenu(false);
  });

  /* 2) ライトボックス */
  var photo = document.querySelector('.v-photo img');
  if (photo && typeof document.createElement('dialog').showModal === 'function') {
    var dlg = document.createElement('dialog');
    dlg.className = 'v-lightbox';
    dlg.innerHTML = '<button type="button" aria-label="close">&#215;</button><img alt="">';
    document.body.appendChild(dlg);
    var big = dlg.querySelector('img');
    photo.addEventListener('click', function () {
      big.src = photo.currentSrc || photo.src;
      big.alt = photo.alt || '';
      dlg.showModal();
      if (window.tjmGrowth) window.tjmGrowth.track('tjm_photo_zoom', { label: document.body.getAttribute('data-page-id') || location.pathname });
    });
    dlg.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('close', function () { big.removeAttribute('src'); });
  }

  /* 3) ミニ地図（Leaflet を遅延読み込み） */
  var mapEl = document.querySelector('.v-place__map[data-lat]');
  if (!mapEl || !('IntersectionObserver' in window)) return;

  function loadLeaflet(cb) {
    if (window.L) return cb();
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    css.crossOrigin = '';
    document.head.appendChild(css);
    var js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    js.crossOrigin = '';
    js.onload = cb;
    js.onerror = function () { mapEl.setAttribute('data-map-state', 'error'); };
    document.head.appendChild(js);
  }

  function drawMap() {
    var lat = parseFloat(mapEl.getAttribute('data-lat'));
    var lng = parseFloat(mapEl.getAttribute('data-lng'));
    var no = mapEl.getAttribute('data-no') || '';
    var map = L.map(mapEl, { center: [lat, lng], zoom: 16, scrollWheelZoom: false, attributionControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);
    var icon = L.divIcon({ className: '', html: '<div class="shirasagi-marker">' + no + '</div>', iconSize: [28, 28], iconAnchor: [14, 14] });
    L.marker([lat, lng], { icon: icon }).addTo(map);
    // 姫路城本体の位置（目印）
    L.circleMarker([34.8394, 134.6939], { radius: 5, color: '#b91c1c', fillColor: '#b91c1c', fillOpacity: .9, weight: 1 })
      .addTo(map).bindTooltip(mapEl.getAttribute('data-castle') || '姫路城', { direction: 'top', offset: [0, -6] });
    mapEl.setAttribute('data-map-state', 'ready');
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      io.disconnect();
      mapEl.setAttribute('data-map-state', 'loading');
      loadLeaflet(drawMap);
    });
  }, { rootMargin: '200px 0px' });
  io.observe(mapEl);
})();
