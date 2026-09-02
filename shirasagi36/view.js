/* shirasagi36/view.js — 一景ページの小さな振る舞い（JA / EN / HK 共通、手で編集してよい）
   1) モバイルメニュー  2) 写真クリックで拡大（<dialog>）  3) 「ここで撮る」のミニ地図を、見えたときだけ Leaflet を読み込んで描く */
(function () {
  'use strict';

  /* 1) モバイルメニュー */
  var menu = document.getElementById('v-mobile');
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('is-menu-open', open);
    var btn = document.querySelector('.v-nav__toggle');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-menu]') : null;
    if (!t) return;
    e.preventDefault();
    setMenu(t.getAttribute('data-menu') === 'open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu && menu.classList.contains('is-open')) setMenu(false);
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
