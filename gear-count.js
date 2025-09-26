/**
 * gear-count.js
 * gear.html の各カードにある .gear-count[data-category] に JSONから件数を流し込む
 * data-category の値: camera / drone / editing / accessories
 */
(function () {
  'use strict';
  const $all = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  async function loadJSON(url) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      console.error('[gear-count] JSON読み込み失敗:', e);
      return null;
    }
  }

  function countItems(data, category, mode='all') {
    const items = data?.categories?.[category]?.items || [];
    if (mode === 'available') {
      return items.filter(it => (it.status||'').toLowerCase() === 'available').length;
    }
    return items.length;
  }

  async function main() {
    const holders = $all('.gear-count[data-category]');
    if (!holders.length) return;

    const data = await loadJSON('data/gear.json');
    if (!data) {
      holders.forEach(el => { el.textContent = '—'; });
      return;
    }

    holders.forEach(el => {
      const cat = el.dataset.category;
      // オプション: data-mode="available" なら運用中のみカウント
      const mode = (el.dataset.mode || 'all').toLowerCase();
      const n = countItems(data, cat, mode);
      el.textContent = `${n}機材`;
    });
  }

  document.addEventListener('DOMContentLoaded', main, { once: true });
})();
