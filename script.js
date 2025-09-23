/* =========================================================================
   Global helpers (safe on every page)
   ========================================================================= */
(function(){
  'use strict';

  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  function onReady(fn){
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  // Minimal date formatter like "2025-09-10"
  function formatDate(d){
    try {
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch(_){ return ''; }
  }

  /* =====================================================================
     Writings: NOTE feed rendering (best-effort; CORS tolerant)
     - Tries to fetch RSS from note.com directly.
     - If CORS blocked, silently skip (server-side Actions can still hydrate thumbs).
     ===================================================================== */
  async function loadNotePosts(container){
    // Your note RSS URL
    const RSS_URLS = [
      'https://note.com/tojimasaya/rss',
      // Fallback via text proxy (simple passthrough) if you later deploy one.
      // 'https://r.jina.ai/http://note.com/tojimasaya/rss'
    ];

    // Try a few endpoints; stop at first success
    let xmlText = null;
    for (const url of RSS_URLS){
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const ct = res.headers.get('content-type') || '';
        const isXML = /xml|rss|atom/i.test(ct);
        xmlText = isXML ? await res.text() : null;
        if (xmlText) break;
      } catch(_){/*ignore*/}
    }
    if (!xmlText) return; // CORSなどで取得できない場合は静かにスキップ

    // Parse simple RSS items
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    const items = Array.from(doc.querySelectorAll('item')).slice(0, 12);
    const posts = items.map(it => ({
      title: (it.querySelector('title')?.textContent || '').trim(),
      link: (it.querySelector('link')?.textContent || '').trim(),
      description: (it.querySelector('description')?.textContent || '').trim(),
      pubDate: new Date(it.querySelector('pubDate')?.textContent || Date.now())
    }));

    displayArticles(container, posts);
  }

  // Unified renderer for NOTE posts -> .article-item structure
  function displayArticles(container, posts){
    const frag = document.createDocumentFragment();
    posts.forEach(post => {
      const article = document.createElement('article');
      article.className = 'article-item';
      article.setAttribute('data-article-url', post.link);
      article.innerHTML = `
        <figure class="article-thumb">
          <img alt="" loading="lazy" width="600" height="338">
        </figure>
        <div class="article-meta">
          <span class="article-source note">note</span>
          <time datetime="${post.pubDate.toISOString()}">${formatDate(post.pubDate)}</time>
        </div>
        <h3><a href="${post.link}" target="_blank" rel="noopener noreferrer">${post.title}</a></h3>
        <p class="article-excerpt">${post.description || ''}</p>
      `;
      frag.appendChild(article);
    });
    container.innerHTML = '';
    container.appendChild(frag);
  }

  /* =====================================================================
     Writings thumbnails:
     - Always show a fallback first (absolute paths)
     - Then hydrate from /data/writings-og.json (prefer local cached image)
     - React to dynamically added cards (MutationObserver)
     ===================================================================== */
  (function thumbnailsWithObserver(){
    const pageOK = /\/writings(?:\.html|\/)?$/i.test(location.pathname);
    if (!pageOK) return;

    // Kick NOTE rendering (best-effort). HTML should have #note-articles
    onReady(() => {
      const noteGrid = document.getElementById('note-articles');
      if (noteGrid) {
        loadNotePosts(noteGrid).catch(()=>{});
      }
    });

    let ogMap = null;
    async function loadMap() {
      if (ogMap) return ogMap;
      const urls = ['data/writings-og.json', '/data/writings-og.json'];
      for (const u of urls) {
        try {
          const r = await fetch(u, { cache: 'no-store' });
          if (r.ok) { ogMap = await r.json(); break; }
        } catch(_) {}
      }
      return ogMap || {};
    }

    function setFallback(img, text){
      let fallback = '/Oreryu.jpg';
      if (/drone\.jp/i.test(text)) fallback = '/drone.jpg';
      else if (/note/i.test(text)) fallback = '/HongKong.jpg';
      img.src = fallback;
      img.alt = 'サムネイル';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.onerror = () => { img.src = '/HongKong.jpg'; };
      img.dataset.ready = '1';
    }

    async function hydrate(card){
      const img = $('.article-thumb img', card);
      if (!img) return;
      if (!img.dataset.ready) setFallback(img, card.textContent || '');

      const map = await loadMap();
      const url = card.getAttribute('data-article-url');
      const hit = map && map[url];
      const src = (hit && (hit.local || hit.image)) || null;
      if (src) {
        img.src = src;
        img.alt = (hit.title || '記事サムネイル');
        img.onerror = () => { img.src = '/HongKong.jpg'; };
      }
    }

    function runInitial(){
      $$('.article-item[data-article-url]').forEach(hydrate);
    }

    onReady(runInitial);

    // Observe dynamically added cards (NOTE feed etc.)
    const obs = new MutationObserver(muts => {
      muts.forEach(m => {
        m.addedNodes.forEach(n => {
          if (!(n instanceof Element)) return;
          if (n.matches?.('.article-item[data-article-url]')) hydrate(n);
          n.querySelectorAll?.('.article-item[data-article-url]').forEach(hydrate);
        });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  })();

})();