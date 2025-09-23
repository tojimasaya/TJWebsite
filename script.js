// === Writings thumbnails FINAL FIX ===
(function fixWritingsThumbs(){
  const p = location.pathname.toLowerCase();
  if (!/\/writings(?:\.html|\/)?$/.test(p)) return;

  const cards = Array.from(document.querySelectorAll('.article-item[data-article-url]'));
  if (!cards.length) return;

  // 1) Instant fallback (avoid empty boxes)
  cards.forEach(card => {
    const img = card.querySelector('.article-thumb img');
    if (!img || img.dataset.ready === '1') return;
    const txt = card.textContent || '';
    let fallback = 'Oreryu.jpg';
    if (/drone\.jp/i.test(txt)) fallback = 'drone.jpg';
    else if (/note/i.test(txt)) fallback = 'HongKong.jpg';
    img.src = fallback;
    img.alt = 'サムネイル';
    img.loading = 'lazy';
    img.dataset.ready = '1';
  });

  // 2) Load JSON then replace fallback with real OGP
  (async () => {
    const tryUrls = ['data/writings-og.json', '/data/writings-og.json'];
    let map = null;
    for (const u of tryUrls) {
      try {
        const res = await fetch(u, {cache:'no-store'});
        if (!res.ok) continue;
        map = await res.json();
        break;
      } catch(_) {}
    }
    if (!map) return;

    cards.forEach(card => {
      const url = card.getAttribute('data-article-url');
      const hit = map[url];
      const img = card.querySelector('.article-thumb img');
      if (hit && hit.image && img) {
        img.src = hit.image;
        img.alt = hit.title || '記事サムネイル';
      }
    });
  })();
})();
