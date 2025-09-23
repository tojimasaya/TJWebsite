/* =========================================================================
   script.js  —  Writings thumbnails 完全版
   - どのページでも安全（Writings 以外では何もしない）
   - フォールバックを必ず表示（ドメインで振り分け）
   - /data/writings-og.json を読み、 local → remote → fallback の順で差し替え
   - 動的に追加されるカード（Note描画など）にも対応（MutationObserver）
   - 可能なら Note RSS を #note-articles に描画（CORS で失敗しても無視）
   ========================================================================= */
(() => {
  "use strict";

  // -------------------- small utilities --------------------
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  const formatDate = (d) => {
    try {
      const dt = (d instanceof Date) ? d : new Date(d);
      const y  = dt.getFullYear();
      const m  = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    } catch { return ""; }
  };

  // ========================================================================
  // Writings only
  // ========================================================================
  const isWritingsPage = /\/writings(?:\.html|\/)?$/i.test(location.pathname);
  if (!isWritingsPage) return;

  // -------------------- Note RSS (best-effort) --------------------
  async function loadNotePosts(container) {
    // 取れたら描画、CORS でダメなら静かにスキップ
    const sources = [
      "https://note.com/tojimasaya/rss",
      // CORS回避の軽量テキストプロキシを後で使うなら↓
      // "https://r.jina.ai/http://note.com/tojimasaya/rss",
    ];
    let xml = null;
    for (const url of sources) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) continue;
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (!/xml|rss|atom/.test(ct)) continue;
        xml = await res.text();
        break;
      } catch { /* ignore */ }
    }
    if (!xml) return;

    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const items = Array.from(doc.querySelectorAll("item")).slice(0, 12);
    const posts = items.map((it) => ({
      title: (it.querySelector("title")?.textContent || "").trim(),
      link:  (it.querySelector("link")?.textContent  || "").trim(),
      description: (it.querySelector("description")?.textContent || "").trim(),
      pubDate: new Date(it.querySelector("pubDate")?.textContent || Date.now()),
    }));
    renderNoteArticles(container, posts);
  }

  function renderNoteArticles(container, posts) {
    const frag = document.createDocumentFragment();
    posts.forEach((p) => {
      if (!/^https?:\/\//i.test(p.link)) return;
      const art = document.createElement("article");
      art.className = "article-item";
      art.setAttribute("data-article-url", p.link);
      art.innerHTML = `
        <figure class="article-thumb">
          <img alt="" loading="lazy" width="600" height="338">
        </figure>
        <div class="article-meta">
          <span class="article-source note">note</span>
          <time datetime="${p.pubDate.toISOString()}">${formatDate(p.pubDate)}</time>
        </div>
        <h3><a href="${p.link}" target="_blank" rel="noopener noreferrer">${p.title}</a></h3>
        <p class="article-excerpt">${p.description || ""}</p>
      `;
      frag.appendChild(art);
    });
    container.innerHTML = "";
    container.appendChild(frag);
  }

  onReady(() => {
    const noteGrid = document.getElementById("note-articles");
    if (noteGrid) loadNotePosts(noteGrid).catch(() => {});
  });

  // -------------------- thumbnails: fallback + hydrate --------------------
  // ドメインで確実にフォールバックを決定
  function setFallback(img, card) {
    const url = (card.getAttribute("data-article-url") || "").toLowerCase();
    let fallback = "/Oreryu.jpg";         // デフォルト（執筆依頼など）
    if (url.includes("drone.jp")) fallback = "/drone.jpg";
    else if (url.includes("note.com")) fallback = "/HongKong.jpg";

    img.src = fallback;
    img.alt = "サムネイル";
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.onerror = () => { img.src = "/HongKong.jpg"; };
    img.dataset.ready = "1";
  }

  // local → remote → fallback の三段フォールバック
  function setSrcWithFallback(img, hit) {
    const local  = hit?.local  || null;   // /assets/og/xxxx.jpg（自サイト：最優先）
    const remote = hit?.image  || null;   // 外部OGP（note/drone.jp 等）
    let triedRemote = false;

    img.onerror = () => {
      if (!triedRemote && remote && img.src !== remote) {
        triedRemote = true;
        img.src = remote;                 // ローカル失敗 → リモート試す
      } else {
        img.src = "/HongKong.jpg";        // 最終フォールバック
      }
    };

    img.src = local || remote || "/HongKong.jpg";
    img.alt = hit?.title || "記事サムネイル";
    img.referrerPolicy = "no-referrer";
  }

  // JSON を1回だけロードして使い回し
  let ogMap = null;
  async function loadOgMap() {
    if (ogMap) return ogMap;
    const candidates = ["data/writings-og.json", "/data/writings-og.json"];
    for (const u of candidates) {
      try {
        const r = await fetch(u, { cache: "no-store" });
        if (r.ok) { ogMap = await r.json(); break; }
      } catch { /* ignore */ }
    }
    return ogMap || {};
  }

  async function hydrateCard(card) {
    const img = $(".article-thumb img", card);
    if (!img) return;

    if (!img.dataset.ready) setFallback(img, card);

    const map = await loadOgMap();
    const url = card.getAttribute("data-article-url");
    const hit = map && map[url];
    if (hit) setSrcWithFallback(img, hit);
  }

  function runInitial() {
    $$(".article-item[data-article-url]").forEach(hydrateCard);
  }

  onReady(runInitial);

  // 動的に追加されるカード（Note 描画など）にも適用
  const obs = new MutationObserver((muts) => {
    muts.forEach((m) => {
      m.addedNodes.forEach((n) => {
        if (!(n instanceof Element)) return;
        if (n.matches?.(".article-item[data-article-url]")) hydrateCard(n);
        n.querySelectorAll?.(".article-item[data-article-url]").forEach(hydrateCard);
      });
    });
  });
  obs.observe(document.body, { childList: true, subtree: true });

})(); 
