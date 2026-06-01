# Hermes Execution Report — tojimasaya.com

実行日: 2026-05-30

## North Star
- 目標: 月間 1,000 新規ビジター
- 必要ペース: 1日あたり約 34 新規ビジター
- 主指標: New users / first visit ベース
- 補助指標: Search Console clicks, indexed pages, internal CTA clicks, outbound clicks

## Hermes Agent Stack — 実行結果

### 1. SEO Scout
- 既存HTMLのtitle / description / canonical / OGP / Twitter Cardを維持・拡張。
- `sitemap.xml` に3本の新規記事URLを追加。
- 新規記事3本に Article JSON-LD を追加。
- 内部リンクのアンカー整合性を検査対象にした。

### 2. Content Curator
- 検索・SNSから来た初回ユーザー向けに、下記3本のオンサイト記事を追加。
  - `/articles/drone-travel-guide.html`
  - `/articles/leica-m2-travel.html`
  - `/articles/hong-kong-two-base-life.html`
- Home と Writings に記事入口を追加。

### 3. Growth Engineer
- Homeに `Featured Guides` セクションを追加。
- Writingsに `Site Guides` セクションを追加。
- 計測用 `growth.js` を全ページに読み込ませ、内部CTA・外部リンククリックをイベント化。
- CSSに記事ページ・ガイドカード用スタイルを追加。

### 4. Gallery Producer
- 既存Galleryの写真・動画を起点に、記事とGearへ流れる導線を維持。
- 新規記事側から Gallery へ戻る導線を追加。

### 5. Analytics Scribe
- `growth.js` のイベント名:
  - `tjm_page_view`
  - `tjm_internal_cta_click`
  - `tjm_outbound_click`
- GA4 / GTM / Plausible のいずれかがページに存在する場合だけ送信。
- cookieや外部通信は `growth.js` 単体では行わない。

## 初回公開後の確認
1. ZIP内のファイルをサーバーの公開ディレクトリへ上書きアップロード。
2. 既存の `assets/`, `data/`, `gear-count.js`, `script.js`, favicon類はそのまま残す。
3. `https://tojimasaya.com/sitemap.xml` を開いてURLが表示されるか確認。
4. Google Search Consoleでサイトマップを送信。
5. GA4で New users と Landing page を毎週確認。

## 7日以内にやる配信
- X投稿1: `/articles/drone-travel-guide.html?utm_source=x&utm_medium=social&utm_campaign=site_guides_202606`
- X投稿2: `/articles/leica-m2-travel.html?utm_source=x&utm_medium=social&utm_campaign=site_guides_202606`
- noteプロフィール: `https://tojimasaya.com/writings.html?utm_source=note&utm_medium=profile&utm_campaign=site_guides_202606`
- YouTube概要欄: `https://tojimasaya.com/gallery.html?utm_source=youtube&utm_medium=description&utm_campaign=gallery_202606`

## 次の改善判断
公開後14日で、次の3つを見て判断する。
- 新規ユーザー数が 14日で 470 に近いか。
- 新規記事3本のうち、どれがLanding pageとして機能しているか。
- `home_guide_*` と `writings_guide_*` の内部クリックが発生しているか。
