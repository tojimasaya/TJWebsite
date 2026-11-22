# クイックフィックス - すぐに実装できる改善

## 🚀 即座に実装可能な改善（優先度順）

### 1. 画像の遅延読み込み追加（5分）

**問題**: 一部の画像に`loading="lazy"`がない

**修正箇所**: `index.html`のヒーロー以外の画像

```html
<!-- 修正前 -->
<img src="assets/images/gallery/castle31.jpg" alt="...">

<!-- 修正後 -->
<img src="assets/images/gallery/castle31.jpg" alt="..." loading="lazy" decoding="async">
```

**対象ファイル**:
- `index.html`: 旅の記録セクション、最新記事セクション
- `gallery.html`: ギャラリーグリッド内の画像
- `writings.html`: 記事サムネイル

---

### 2. フォント読み込みの最適化（10分）

**問題**: Google Fontsが同期読み込みでブロッキング

**修正**: `index.html`の`<head>`セクション

```html
<!-- 修正前 -->
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">

<!-- 修正後 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400;1,600&family=Inter:wght@300;400;500;600;700&family=Noto+Serif+JP:wght@300;400;500;600&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet"></noscript>
```

**追加CSS** (`style.css`に追加):
```css
/* フォント読み込み中のフォールバック */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

### 3. メタディスクリプションの追加（15分）

**問題**: 一部ページでメタディスクリプションが不足

**修正対象**:
- `gallery.html`: 既にあるが最適化可能
- `gear.html`: 確認が必要
- `trips.html`: 追加が必要

**例**: `trips.html`に追加
```html
<meta name="description" content="田路昌也の旅の記録。トルコ、チベット、プラハなど、写真と文章で綴る長編の旅。">
```

---

### 4. ARIAラベルの追加（20分）

**問題**: ナビゲーションやボタンにARIAラベルがない

**修正**: `js/site-header.js`

```javascript
// 修正前
<button class="nav-toggle" id="nav-toggle" aria-label="Menu">

// 修正後（既にaria-labelがあるが、aria-expandedを追加）
<button class="nav-toggle" id="nav-toggle" aria-label="メニューを開く" aria-expanded="false">
```

**JavaScript追加** (`js/site-header.js`):
```javascript
// モバイルメニュートグル時にaria-expandedを更新
navToggle.addEventListener('click', () => {
    const isExpanded = navMenu.classList.contains('active');
    navToggle.setAttribute('aria-expanded', isExpanded);
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});
```

---

### 5. 画像エラーハンドリングの統一（10分）

**問題**: 画像読み込みエラーの処理が統一されていない

**修正**: 共通のエラーハンドラー関数を追加

**新規ファイル**: `js/image-fallback.js`
```javascript
// 画像読み込みエラー時のフォールバック
document.addEventListener('DOMContentLoaded', () => {
  const images = document.querySelectorAll('img');
  const fallbackImage = '/assets/images/gallery/hongkong.jpg';
  
  images.forEach(img => {
    img.addEventListener('error', function() {
      if (this.src !== fallbackImage) {
        this.src = fallbackImage;
        this.alt = '画像を読み込めませんでした';
      }
    });
  });
});
```

**各HTMLファイルに追加**:
```html
<script src="js/image-fallback.js"></script>
```

---

### 6. 構造化データの追加（30分）

**問題**: JSON-LD構造化データがない

**新規追加**: `index.html`の`<head>`セクション末尾

```html
<!-- Person型の構造化データ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Toji Masaya",
  "alternateName": "田路昌也",
  "jobTitle": "Photographer, Writer",
  "url": "https://tojimasaya.com",
  "image": "https://tojimasaya.com/assets/images/about/TJ.jpg",
  "sameAs": [
    "https://instagram.com/tojimasaya",
    "https://note.com/tojimasaya",
    "https://www.youtube.com/TJVlog",
    "https://x.com/mongkok93",
    "https://www.facebook.com/masaya.toji"
  ],
  "description": "香港と日本を行き来する写真家・ライター。Leicaとドローンで旅の断片を記録。"
}
</script>
```

**`writings.html`に追加** (Article型):
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Writings — Toji Masaya",
  "description": "田路昌也の執筆記事一覧",
  "url": "https://tojimasaya.com/writings.html"
}
</script>
```

---

### 7. パフォーマンス監視の追加（5分）

**問題**: パフォーマンスメトリクスの監視がない

**追加**: `index.html`の`<head>`セクション

```html
<!-- Web Vitals の測定 -->
<script>
function sendToAnalytics(metric) {
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      non_interaction: true,
    });
  }
}

// Web Vitals ライブラリの読み込み（CDN）
import('https://unpkg.com/web-vitals@3/dist/web-vitals.umd.js').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
});
</script>
```

---

### 8. セキュリティヘッダーの追加（10分）

**問題**: セキュリティヘッダーが設定されていない可能性

**`.htaccess`ファイルを作成** (Apacheサーバーの場合):
```apache
# セキュリティヘッダー
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# キャッシュ設定
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

**注意**: サーバーがNginxの場合は別の設定が必要

---

## 📋 チェックリスト

### 即座に実装可能（合計約2時間）
- [ ] 画像の遅延読み込み追加
- [ ] フォント読み込みの最適化
- [ ] メタディスクリプションの確認・追加
- [ ] ARIAラベルの追加
- [ ] 画像エラーハンドリングの統一
- [ ] 構造化データの追加（Person型）
- [ ] パフォーマンス監視の追加

### 短期（1週間以内）
- [ ] 画像をWebP形式に変換
- [ ] CSS/JSの最小化
- [ ] OGP画像のサイズ統一（1200x630px）

### 中期（2-3週間）
- [ ] `about.html`のTailwind削除
- [ ] アクセシビリティの完全対応
- [ ] モバイルUXの改善

---

## 🎯 実装の優先順位

1. **最優先（今日中）**:
   - 画像の遅延読み込み
   - フォント読み込みの最適化
   - 構造化データの追加

2. **高優先度（今週中）**:
   - ARIAラベルの追加
   - 画像エラーハンドリング
   - メタディスクリプションの確認

3. **中優先度（来週中）**:
   - 画像のWebP変換
   - CSS/JSの最適化

---

## 💡 実装時の注意点

1. **バックアップ**: 変更前に必ずバックアップを取る
2. **テスト**: 各変更後にブラウザで動作確認
3. **段階的実装**: 一度に全てを変更せず、1つずつ実装してテスト
4. **パフォーマンス測定**: Lighthouseで改善前後のスコアを比較

---

**作成日**: 2026年2月13日
