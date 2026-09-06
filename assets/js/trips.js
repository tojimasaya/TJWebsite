/**
 * tojimasaya.com — 旅の記録（trips.html）
 *
 * 一覧の検索・絞り込み・並び替えと、あとから開く地図。
 * 記事の正本は trips.html のカード（data-* 属性）、
 * 座標の正本は /data/trips.json。両者は記事 id で結びつける。
 */
(function () {
  'use strict';

  var grid = document.getElementById('trip-grid');
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.trip-card'));
  if (!cards.length) return;

  var qInput    = document.getElementById('trip-q');
  var yearSel   = document.getElementById('trip-year');
  var sortSel   = document.getElementById('trip-sort');
  var countEl   = document.getElementById('trip-count');
  var emptyEl   = document.getElementById('trip-empty');
  var noticeEl  = document.getElementById('trip-notice');
  var mapToggle = document.getElementById('trip-maptoggle');
  var mapPanel  = document.getElementById('trip-mappanel');
  var mapEl     = document.getElementById('trip-map');
  var mapHint   = document.getElementById('trip-map-hint');
  var regionBtns = Array.prototype.slice.call(document.querySelectorAll('[data-region]'));

  var REGIONS = ['all', 'japan', 'asia', 'europe'];
  var SORTS   = ['recommended', 'newest', 'oldest'];
  var TOTAL   = cards.length;

  /* ------------------------------------------------------------------ 索引 */

  var index = cards.map(function (el) {
    return {
      el: el,
      id: el.dataset.trip,
      regions: (el.dataset.regions || '').split(' ').filter(Boolean),
      years: (el.dataset.years || '').split(' ').filter(Boolean),
      newest: parseInt(el.dataset.newest, 10) || 0,
      oldest: parseInt(el.dataset.oldest, 10) || 0,
      order: parseInt(el.dataset.order, 10) || 0,
      search: el.dataset.search || '',
      title: (el.querySelector('.trip-card__title') || {}).textContent || ''
    };
  });

  var byId = {};
  index.forEach(function (t) { byId[t.id] = t; });

  var allYears = [];
  index.forEach(function (t) {
    t.years.forEach(function (y) { if (allYears.indexOf(y) === -1) allYears.push(y); });
  });
  allYears.sort(function (a, b) { return Number(b) - Number(a); });

  allYears.forEach(function (y) {
    var o = document.createElement('option');
    o.value = y;
    o.textContent = y + '年';
    yearSel.appendChild(o);
  });

  /* ------------------------------------------------------------------ 状態 */

  var state = { region: 'all', year: 'all', q: '', sort: 'recommended' };

  function normalize(value) {
    var s = String(value == null ? '' : value);
    if (s.normalize) { try { s = s.normalize('NFKC'); } catch (e) { /* noop */ } }
    return s.toLowerCase().trim();
  }

  function readUrl() {
    var p = new URLSearchParams(window.location.search);
    var region = p.get('region');
    var year   = p.get('year');
    var sort   = p.get('sort');
    // 未知の値は既定値に戻す
    state.region = REGIONS.indexOf(region) > -1 ? region : 'all';
    state.year   = (year && allYears.indexOf(year) > -1) ? year : 'all';
    state.sort   = SORTS.indexOf(sort) > -1 ? sort : 'recommended';
    state.q      = (p.get('q') || '').slice(0, 100);
  }

  function writeUrl(push) {
    var p = new URLSearchParams();
    if (state.region !== 'all') p.set('region', state.region);
    if (state.year !== 'all') p.set('year', state.year);
    if (state.q) p.set('q', state.q);
    if (state.sort !== 'recommended') p.set('sort', state.sort);
    var qs = p.toString();
    var url = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    var snapshot = { region: state.region, year: state.year, q: state.q, sort: state.sort };
    try {
      if (push) history.pushState(snapshot, '', url);
      else history.replaceState(snapshot, '', url);
    } catch (e) { /* file:// などでは無視 */ }
  }

  function syncControls() {
    qInput.value = state.q;
    yearSel.value = state.year;
    sortSel.value = state.sort;
    regionBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.region === state.region));
    });
  }

  /* ------------------------------------------------------------- 絞り込み */

  function matches(t) {
    if (state.region !== 'all' && t.regions.indexOf(state.region) === -1) return false;
    if (state.year !== 'all' && t.years.indexOf(state.year) === -1) return false;
    if (state.q) {
      var q = normalize(state.q);
      if (q && t.search.indexOf(q) === -1) return false;
    }
    return true;
  }

  function comparator() {
    if (state.sort === 'newest') {
      return function (a, b) { return (b.newest - a.newest) || (a.order - b.order); };
    }
    if (state.sort === 'oldest') {
      return function (a, b) { return (a.oldest - b.oldest) || (a.order - b.order); };
    }
    return function (a, b) { return a.order - b.order; };
  }

  var visibleIds = [];

  function apply() {
    var shown = [];
    index.forEach(function (t) {
      var ok = matches(t);
      t.el.hidden = !ok;
      if (ok) shown.push(t);
    });

    // 表示順を DOM 順にも反映する（フォーカス順を見た目に合わせる）。
    // 並びが変わらないときは触らない — 並べ替えるとスクロール位置が失われるため。
    var sorted = index.slice().sort(comparator());
    var current = Array.prototype.slice.call(grid.children);
    var changed = sorted.some(function (t, i) { return current[i] !== t.el; });
    if (changed) {
      var frag = document.createDocumentFragment();
      sorted.forEach(function (t) { frag.appendChild(t.el); });
      grid.appendChild(frag);
    }

    visibleIds = shown.map(function (t) { return t.id; });

    var filtered = state.region !== 'all' || state.year !== 'all' || !!state.q;
    countEl.innerHTML = filtered
      ? '<strong>' + shown.length + '件</strong> / 全' + TOTAL + '件'
      : '<strong>' + TOTAL + '件</strong>の旅行記';

    emptyEl.hidden = shown.length !== 0;
    syncMap();
  }

  function setState(patch, push) {
    Object.keys(patch).forEach(function (k) { state[k] = patch[k]; });
    syncControls();
    writeUrl(push);
    apply();
  }

  function reset(push) {
    setState({ region: 'all', year: 'all', q: '', sort: 'recommended' }, push !== false);
    hideNotice();
  }

  function showNotice(text) { noticeEl.textContent = text; noticeEl.hidden = false; }
  function hideNotice() { noticeEl.hidden = true; noticeEl.textContent = ''; }

  /* ------------------------------------------------------------------ 操作 */

  regionBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      setState({ region: b.dataset.region }, true);
      hideNotice();
    });
  });

  yearSel.addEventListener('change', function () {
    setState({ year: yearSel.value }, true);
    hideNotice();
  });

  sortSel.addEventListener('change', function () {
    setState({ sort: sortSel.value }, true);
  });

  var qTimer = null;
  qInput.addEventListener('input', function () {
    window.clearTimeout(qTimer);
    qTimer = window.setTimeout(function () {
      // 入力中は履歴を増やさない
      setState({ q: qInput.value }, false);
      hideNotice();
    }, 180);
  });
  qInput.addEventListener('search', function () { setState({ q: qInput.value }, false); });

  Array.prototype.slice.call(document.querySelectorAll('#trip-reset, [data-reset]'))
    .forEach(function (b) { b.addEventListener('click', function () { reset(true); qInput.focus(); }); });

  window.addEventListener('popstate', function () {
    readUrl();
    syncControls();
    apply();
    hideNotice();
  });

  /* --------------------------------------------------- ハッシュでの到達 */

  function hashCard() {
    var hash = window.location.hash.replace('#', '');
    if (!hash) return null;
    var el = document.getElementById(hash);
    return (el && el.classList.contains('trip-card')) ? el : null;
  }

  // ハッシュ付きURLで来たとき、対象が絞り込みで隠れていれば条件を解除して知らせる。
  function revealHashTarget() {
    var el = hashCard();
    if (!el || !el.hidden) return;
    var t = byId[el.dataset.trip];
    reset(false);
    showNotice('「' + (t ? t.title : '選択された旅行記') + '」を表示するため、絞り込みを解除しました。');
  }

  // ハッシュがある場合だけ位置を補う（通常のスクロール復元には触らない）
  function scrollToHash() {
    var el = hashCard();
    if (!el || el.hidden) return;
    el.scrollIntoView({ block: 'start' });
  }

  window.addEventListener('hashchange', function () {
    revealHashTarget();
    scrollToHash();
  });

  /* ------------------------------------------------------------------ 地図 */

  var LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  var LEAFLET_CSS_HASH = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
  var LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  var LEAFLET_JS_HASH = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';

  var BASES = [
    { name: '香港 (Hong Kong)', lat: 22.3193, lng: 114.1694, emoji: '🏠' },
    { name: '姫路 (Himeji)', lat: 34.8394, lng: 134.6939, emoji: '🏯' }
  ];

  var mapReady = false;
  var mapLoading = false;
  var map = null;
  var markers = [];   // { marker, articles: [id], latlng }
  var lines = [];     // { line, articles: [id] }

  function mapFailed() {
    mapEl.innerHTML = '<p class="trip-map-msg">地図を読み込めませんでした。一覧から旅行記を選べます。</p>';
  }

  function loadLeaflet(done) {
    if (window.L) { done(); return; }
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = LEAFLET_CSS;
    css.integrity = LEAFLET_CSS_HASH;
    css.crossOrigin = '';
    document.head.appendChild(css);

    var s = document.createElement('script');
    s.src = LEAFLET_JS;
    s.integrity = LEAFLET_JS_HASH;
    s.crossOrigin = '';
    s.onload = done;
    s.onerror = function () { mapLoading = false; mapFailed(); };
    document.head.appendChild(s);
  }

  function popupHtml(cityName, articleIds) {
    var items = articleIds.map(function (id) {
      var t = byId[id];
      if (!t) return '';
      var link = t.el.querySelector('.trip-card__link');
      return '<li><a href="' + link.getAttribute('href') + '">' + t.title + ' を読む →</a></li>';
    }).filter(Boolean).join('');
    return '<div class="trip-popup"><div class="trip-popup__city">' + cityName +
           '</div><ul class="trip-popup__list">' + items + '</ul></div>';
  }

  function buildMap(routes) {
    map = L.map(mapEl, {
      center: [30, 80],
      zoom: 2,
      zoomControl: true,
      scrollWheelZoom: false   // ページのスクロールを奪わない
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    // スマートフォンでは指2本のときだけ地図を動かす（縦スクロールを妨げない）
    if (L.Browser.mobile) {
      map.dragging.disable();
      var c = map.getContainer();
      c.addEventListener('touchstart', function (e) {
        if (e.touches.length > 1) map.dragging.enable();
      }, { passive: true });
      c.addEventListener('touchend', function (e) {
        if (e.touches.length === 0) map.dragging.disable();
      }, { passive: true });
      if (mapHint) mapHint.textContent = '地図は指2本で移動、ピンチで拡大できます。';
    }

    BASES.forEach(function (b) {
      var m = L.marker([b.lat, b.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div class="trip-marker-base">' + b.emoji + '</div>',
          iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -14]
        }),
        title: '拠点：' + b.name
      }).bindPopup('<div class="trip-popup"><div class="trip-popup__city">' + b.name +
                   '</div><p style="margin:0;font-size:.8rem;">拠点</p></div>').addTo(map);
      var el = m.getElement();
      if (el) { el.setAttribute('role', 'button'); el.setAttribute('aria-label', '拠点：' + b.name); }
    });

    routes.forEach(function (route) {
      var routeArticles = (route.articles || []).filter(function (id) { return byId[id]; });
      if (!routeArticles.length) return;

      var coords = route.cities.map(function (c) { return [c.lat, c.lng]; });
      if (coords.length > 1) {
        var line = L.polyline(coords, {
          color: '#5b6b7c', weight: 2, opacity: 0.45, dashArray: '6 6'
        }).addTo(map);
        lines.push({ line: line, articles: routeArticles });
      }

      route.cities.forEach(function (city) {
        var cityArticles = (city.articles && city.articles.length ? city.articles : routeArticles)
          .filter(function (id) { return byId[id]; });
        if (!cityArticles.length) return;

        var label = city.name + '：' + cityArticles.map(function (id) { return byId[id].title; }).join('、');
        var m = L.marker([city.lat, city.lng], {
          icon: L.divIcon({
            className: '', html: '<div class="trip-marker"></div>',
            iconSize: [13, 13], iconAnchor: [6.5, 6.5], popupAnchor: [0, -10]
          }),
          title: label
        }).bindPopup(popupHtml(city.name, cityArticles), { maxWidth: 260, minWidth: 200 }).addTo(map);

        var el = m.getElement();
        if (el) { el.setAttribute('role', 'button'); el.setAttribute('aria-label', label); }
        markers.push({ marker: m, articles: cityArticles, latlng: [city.lat, city.lng] });
      });
    });

    mapReady = true;
    syncMap();
  }

  function syncMap() {
    if (!mapReady || !map) return;
    var visible = {};
    visibleIds.forEach(function (id) { visible[id] = true; });
    var bounds = [];

    markers.forEach(function (m) {
      var on = m.articles.some(function (id) { return visible[id]; });
      var el = m.marker.getElement();
      if (el) el.style.display = on ? '' : 'none';
      m.marker.closePopup();
      if (on) bounds.push(m.latlng);
    });

    lines.forEach(function (l) {
      var on = l.articles.some(function (id) { return visible[id]; });
      var el = l.line.getElement();
      if (el) el.style.display = on ? '' : 'none';
    });

    if (mapHint && !L.Browser.mobile) mapHint.textContent = '';

    if (!bounds.length) {
      // 世界地図に戻さず、結果なしを伝える
      if (mapHint) mapHint.textContent = '条件に合う旅先はありません。条件を変えて探してみてください。';
      return;
    }
    if (bounds.length === 1) map.setView(bounds[0], 6);
    else map.fitBounds(L.latLngBounds(bounds).pad(0.2), { maxZoom: 9 });
  }

  function openMap() {
    mapPanel.hidden = false;
    mapToggle.setAttribute('aria-expanded', 'true');

    if (mapReady) { map.invalidateSize(); syncMap(); return; }
    if (mapLoading) return;
    mapLoading = true;

    loadLeaflet(function () {
      fetch('/data/trips.json')
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (routes) {
          buildMap(routes);
          map.invalidateSize();
        })
        .catch(function (err) {
          if (window.console) console.error('trips map:', err);
          mapFailed();
        });
    });
  }

  function closeMap() {
    mapPanel.hidden = true;
    mapToggle.setAttribute('aria-expanded', 'false');
  }

  if (mapToggle && mapPanel) {
    mapToggle.addEventListener('click', function () {
      if (mapToggle.getAttribute('aria-expanded') === 'true') closeMap();
      else openMap();
    });
  }

  /* ------------------------------------------------------------------ 起動 */

  readUrl();
  syncControls();
  writeUrl(false);
  apply();
  revealHashTarget();
  if (window.location.hash) {
    // 画像の遅延読み込みでレイアウトが決まってから位置を合わせる
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(scrollToHash);
    });
  }
})();
