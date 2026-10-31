/* HZMB road alignment for orientation, with official port-to-port distances. */
(function () {
  'use strict';

  var blocks = document.querySelectorAll('.macau-route');
  var bounds = [[22.18, 113.55], [22.335, 113.97]];
  var stops = [
    { point: [22.3187, 113.9514], label: '香港口岸', detail: '香港空港横のバスターミナル', color: '#245e8a', direction: 'top' },
    { point: [22.2015, 113.5741], label: 'マカオ口岸', detail: 'マカオ側の到着ターミナル', color: '#9b553d', direction: 'top' }
  ];

  function init(block) {
    var el = block.querySelector('[data-route-map]');
    var hint = block.querySelector('[data-route-hint]');
    if (!window.L) {
      el.innerHTML = '<p class="macau-route-loading">地図を読み込めませんでした。<br><a href="https://www.openstreetmap.org/#map=11/22.265/113.765" target="_blank" rel="noopener noreferrer">別画面で地図を見る</a></p>';
      return;
    }

    el.innerHTML = '';
    var map = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: false, zoomSnap: 0.25 });
    var tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);
    var loadedTiles = 0;
    var failedTiles = 0;
    tiles.on('tileload', function () { loadedTiles++; });
    tiles.on('tileerror', function () { failedTiles++; });
    tiles.on('load', function () {
      if (!loadedTiles && failedTiles) hint.textContent = '背景地図を読み込めませんでした。経路線と地点のみ表示しています。';
    });
    L.control.scale({ imperial: false, maxWidth: 110 }).addTo(map);
    function reset() { map.fitBounds(bounds, { padding: [30, 45], animate: false }); }
    reset();

    stops.forEach(function (s) {
      L.circleMarker(s.point, { radius: 7, color: '#fff', weight: 3, fillColor: s.color, fillOpacity: 1 })
        .bindTooltip(s.label, { permanent: true, direction: s.direction, offset: [0, -10], className: 'macau-route-label' })
        .bindPopup('<strong>' + s.label + '</strong><br>' + s.detail).addTo(map);
    });
    L.circleMarker([22.308, 113.9185], { radius: 4, color: '#777', weight: 1, fillColor: '#fff', fillOpacity: 1 })
      .bindTooltip('香港国際空港', { permanent: true, direction: 'bottom', offset: [-14, 12], className: 'macau-route-label macau-route-airport' }).addTo(map);

    fetch('/data/macau-bridge-route.geojson').then(function (res) {
      if (!res.ok) throw new Error('Route unavailable');
      return res.json();
    }).then(function (data) {
      // White casing keeps the alignment visible against roads on the base map.
      L.geoJSON(data, { style: { color: '#fff', weight: 7, opacity: 0.85 } }).addTo(map);
      L.geoJSON(data, { style: function (feature) {
        return { color: '#245e8a', weight: 4, opacity: 0.95,
          dashArray: feature.properties.kind === 'approach' ? '5 7' : null };
      } }).addTo(map);
      el.setAttribute('data-route-ready', 'true');
    }).catch(function () {
      hint.textContent = '経路線を読み込めませんでした。地図上の大橋と、香港口岸・マカオ口岸の位置を参照してください。';
    });

    var button = block.querySelector('[data-route-reset]');
    button.hidden = false;
    button.addEventListener('click', reset);
    if (L.Browser.mobile) {
      hint.textContent = '指2本で地図を移動、＋／−で拡大・縮小できます。縮尺は左下に表示しています。';
      el.addEventListener('touchstart', function (e) { if (e.touches.length > 1) map.dragging.enable(); }, { passive: true });
      el.addEventListener('touchend', function (e) { if (!e.touches.length) map.dragging.disable(); }, { passive: true });
    }
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        init(entry.target);
      });
    }, { rootMargin: '300px' });
    blocks.forEach(function (block) { observer.observe(block); });
  } else {
    blocks.forEach(init);
  }
})();
