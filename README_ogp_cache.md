# OGP Local Cache Add-on

This adds a GitHub Actions step that downloads external OGP images (DRONE.jp / note etc.), saves them under `/assets/og/`, and rewrites `data/writings-og.json` to include a `local` path. The frontend should then prefer `local` (if present) and fall back to the remote `image`.

## Files
- `.github/workflows/ogp-cache.yml` – workflow to run scraper and cache script
- `tools/cache-ogp.mjs` – Node script that downloads images and rewrites JSON
- `assets/og/` – directory where cached images will be stored
- `prefer_local_snippet.js` – a small helper snippet for the frontend

## How to integrate on the frontend (script.js)
After loading the JSON map, prefer `hit.local` over `hit.image`:

```js
// inside your JSON hydrate loop
const url = card.getAttribute('data-article-url');
const hit = map[url];
const img = card.querySelector('.article-thumb img');
if (hit && img) {
  const src = hit.local || hit.image;
  if (src) {
    img.src = src;
    img.alt = hit.title || '記事サムネイル';
    img.onerror = () => { img.src = '/HongKong.jpg'; };
  }
}
```

## Deploy
Upload the files to the repo (keep directory structure). Then run the workflow from Actions: **Scrape & Cache OGP thumbnails**. After it completes, your site will serve thumbnails from `/assets/og/…`, avoiding external hotlink blocks.
