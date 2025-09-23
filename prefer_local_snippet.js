// Prefer locally cached OGP image when available
function setThumbFromMap(card, map) {
  const url = card.getAttribute('data-article-url');
  const hit = map[url];
  const img = card.querySelector('.article-thumb img');
  if (!img || !hit) return false;
  const src = hit.local || hit.image;
  if (!src) return false;
  img.src = src;
  img.alt = hit.title || '記事サムネイル';
  img.onerror = () => { img.src = '/HongKong.jpg'; };
  return true;
}
