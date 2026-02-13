/**
 * 画像読み込みエラー時のフォールバック処理
 * 全ページで使用可能な共通スクリプト
 */
(function() {
  'use strict';

  const FALLBACK_IMAGE = '/assets/images/gallery/hongkong.jpg';

  /**
   * 画像のエラーハンドリングを設定
   */
  function setupImageFallback() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // 既にエラーハンドラーが設定されている場合はスキップ
      if (img.dataset.fallbackSetup) return;
      
      img.addEventListener('error', function() {
        // フォールバック画像自体が読み込めない場合は無限ループを防ぐ
        if (this.src === FALLBACK_IMAGE || this.src.endsWith(FALLBACK_IMAGE)) {
          console.warn('フォールバック画像も読み込めませんでした:', this.src);
          return;
        }
        
        // 元のsrcを保存（デバッグ用）
        const originalSrc = this.src;
        
        // フォールバック画像に置き換え
        this.src = FALLBACK_IMAGE;
        this.alt = this.alt || '画像を読み込めませんでした';
        
        // ログ出力（開発時のみ）
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log('画像読み込みエラー:', originalSrc, '→ フォールバック画像を使用');
        }
      });
      
      // 設定済みフラグを設定
      img.dataset.fallbackSetup = 'true';
    });
  }

  /**
   * 動的に追加される画像にも対応（MutationObserver）
   */
  function observeNewImages() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            if (node.tagName === 'IMG') {
              setupImageFallback();
            } else if (node.querySelectorAll) {
              const newImages = node.querySelectorAll('img');
              if (newImages.length > 0) {
                setupImageFallback();
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // DOMContentLoaded時に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setupImageFallback();
      observeNewImages();
    });
  } else {
    setupImageFallback();
    observeNewImages();
  }
})();
