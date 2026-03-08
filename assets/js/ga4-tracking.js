/**
 * tojimasaya.com — GA4 詳細トラッキングスクリプト
 * 外部リンク（note / DRONE.jp / SNS）のクリックを
 * イベント名・記事タイトル・クリック元ページ込みで計測する
 *
 * 使い方: 全ページの </body> 直前に以下の <script> タグで読み込む
 *   <script src="/assets/js/ga4-tracking.js" defer></script>
 *
 * または各HTMLの </body> 直前に直接 <script>...</script> で貼る
 */

(function () {
  'use strict';

  // ── 計測対象ドメインとイベント名のマッピング ──────────────────────────
  const DOMAIN_MAP = [
    { pattern: /drone\.jp/,       eventName: 'click_dronejo',   label: 'DRONE.jp'   },
    { pattern: /note\.com/,       eventName: 'click_note',      label: 'note'       },
    { pattern: /instagram\.com/,  eventName: 'click_instagram', label: 'Instagram'  },
    { pattern: /youtube\.com/,    eventName: 'click_youtube',   label: 'YouTube'    },
    { pattern: /x\.com/,          eventName: 'click_x',         label: 'X'          },
    { pattern: /facebook\.com/,   eventName: 'click_facebook',  label: 'Facebook'   },
  ];

  // ── クリックした場所の文脈ラベルを返す ────────────────────────────────
  function getContext(el) {
    const cls = el.closest('[class]')?.className || '';
    if (cls.includes('travel-card'))   return '旅の記録カード';
    if (cls.includes('latest-item'))   return '最新記事リスト';
    if (cls.includes('articles-grid')) return '記事一覧';
    if (cls.includes('footer-social')) return 'フッターSNS';
    if (cls.includes('footer'))        return 'フッター';
    if (cls.includes('hero'))          return 'ヒーロー';
    return 'その他';
  }

  // ── 記事タイトルを取得（リンクテキストから媒体名プレフィックスを除去）──
  function getArticleTitle(el) {
    const raw = el.textContent.trim().replace(/\s+/g, ' ');
    // "note | 2026年..." や "DRONE.jp | 2026年..." のパターンを整形
    return raw.replace(/^(note|DRONE\.jp)\s*\|\s*[\d年月日]+\s*/i, '').substring(0, 80);
  }

  // ── メインのクリックリスナー（イベント委譲）────────────────────────────
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.href || '';
    const matched = DOMAIN_MAP.find(d => d.pattern.test(href));
    if (!matched) return;

    // gtag が存在しない環境では何もしない
    if (typeof gtag !== 'function') return;

    const params = {
      // ① どのリンクか
      link_url:      href,
      link_domain:   matched.label,

      // ② 何の記事/ページか
      article_title: getArticleTitle(link),

      // ③ サイト内どこからクリックされたか
      source_page:   window.location.pathname,   // 例: /index.html, /writings.html
      click_context: getContext(link),            // 例: 記事一覧, フッターSNS
    };

    gtag('event', matched.eventName, params);

    // デバッグ用（本番では削除可）
    // console.log('[GA4 tracking]', matched.eventName, params);
  });

})();
