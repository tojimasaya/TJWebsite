/* gear.js — JSON駆動のギア一覧レンダラー */
(() => {
  "use strict";
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

  const path = location.pathname.toLowerCase();
  const guessCategory = () =>
    /gear-camera/.test(path) ? "camera" :
    /gear-drone/.test(path) ? "drone" :
    /gear-editing/.test(path) ? "editing" :
    /gear-accessories/.test(path) ? "accessories" : null;

  const category = guessCategory();
  if (!category) return;

  async function fetchJSON(u) {
    const cand = [u, `/` + u.replace(/^\//, "")];
    for (const url of cand) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (r.ok) return await r.json();
      } catch {}
    }
    return null;
  }

  function statusLabel(s) {
    switch ((s||"").toLowerCase()) {
      case "available":     return { text: "運用中",  cls: "available" };
      case "sold":          return { text: "売却済",  cls: "sold" };
      case "considering":   return { text: "検討中",  cls: "considering" };
      case "not-for-sale":  return { text: "非売品",  cls: "not-for-sale" };
      default:              return { text: "",        cls: "" };
    }
  }

  function renderHero(cat) {
    const hero  = $(".gear-hero-image img");
    const title = $(".gear-hero-title");
    const sub   = $(".gear-hero-subtitle");
    if (hero && cat.hero_image) hero.src = cat.hero_image;
    if (title && cat.title)     title.textContent = cat.title;
    if (sub && cat.subtitle)    sub.textContent   = cat.subtitle || "";
    const lead = $(".gear-intro .lead");
    if (lead && cat.description) lead.textContent = cat.description;
  }

  function buildCard(item) {
    const st    = statusLabel(item.status);
    const specs = (item.specs||[]).map(s => `<span class="spec-item">${s}</span>`).join("");
    const price = item.price ? `<div class="gear-price">HK$ ${item.price}</div>` : "";
    const reviewBtn = (item.links && item.links.review)
      ? `<a href="${item.links.review}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">レビュー</a>` : "";
    const buyBtn = (item.links && item.links.buy)
      ? `<a href="${item.links.buy}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">購入先</a>` : "";

    return `
      <article class="gear-item">
        <div class="gear-image">
          <img src="${item.image || "/assets/images/gear/placeholder.jpg"}" alt="${item.name}" loading="lazy">
          ${st.text ? `<span class="gear-status ${st.cls}">${st.text}</span>` : ""}
        </div>
        <div class="gear-info">
          <div class="gear-header">
            <h3>${item.name}</h3>
            ${price}
          </div>
          <div class="gear-specs">${specs}</div>
          <p class="gear-description">${item.description || ""}</p>
          ${item.experience ? `
          <div class="gear-experience">
            <h4>使用メモ</h4>
            <p>${item.experience}</p>
          </div>` : ""}
          <div class="gear-actions">
            ${reviewBtn}
            ${buyBtn}
          </div>
        </div>
      </article>
    `;
  }

  function renderGrid(cat) {
    const grid = $(".gear-grid");
    if (!grid) return;
    grid.innerHTML = cat.items.map(buildCard).join("");
  }

  function setupFilters() {
    const tabs = $$(".filter-tab");
    if (!tabs.length) return;
    const apply = (key) => {
      $$(".gear-item").forEach((el) => {
        const badge = $(".gear-status", el);
        const type  = badge ? (badge.className.match(/available|sold|considering|not-for-sale/)||[""])[0] : "";
        const show  = (key === "all") || (type === key);
        el.classList.toggle("hidden", !show);
      });
    };
    tabs.forEach(btn => {
      btn.addEventListener("click", () => {
        tabs.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        apply(btn.dataset.filter);
      });
    });
  }

  async function main() {
    const data = await fetchJSON("data/gear.json");
    if (!data?.categories?.[category]) return;
    const cat = data.categories[category];
    renderHero(cat);
    renderGrid(cat);
    setupFilters();
  }

  document.addEventListener("DOMContentLoaded", main, { once: true });
})();
