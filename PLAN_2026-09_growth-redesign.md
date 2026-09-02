# tojimasaya.com 改造計画 2026-09 — 「見つかる・広がる・戻ってくる」サイトへ

作成: 2026-09-02 / 計画: Claude Fable 5.1 / 実装想定: Claude Code (Opus 5 等)
対象リポジトリ: `~/Projects/tojimasaya.com/TJWebsite`（GitHub `tojimasaya/TJWebsite`、GitHub Pages + 独自ドメイン）

この文書は、TJ が読んで判断するための「提案書」であると同時に、実装エージェントがそのまま作業に入れる「仕様書」を兼ねます。
第 1 章で全体像、第 2 章で現状の事実、第 3 章で 5 提案の仕様、第 4 章で実行順序と各フェーズの指示文、第 5 章で計測、付録に URL 設計と部品仕様をまとめています。

---

## 0. 結論（先に一枚で）

| # | 提案 | 一言で | 主な効果 | 目安工数 | 優先 |
|---|------|--------|----------|----------|------|
| 1 | **白鷺三十六景「一景一頁」化** | モーダルに閉じ込められた 35 景 × 3 言語（= 105 ページ分の内容）を、検索・シェアできる独立ページに解放する | 検索流入（姫路城の撮影スポット系）、インバウンド、SNS シェア | 1.5 日 | ★★★ |
| 2 | **断章の個別ページ化 ＋ サイト全体のフィード** | 断章を 1 篇 1 URL に、Atom / JSON Feed を発行、購読導線を置く | 再訪・購読、長尾検索、note/X 連携の土台 | 1 日 | ★★☆ |
| 3 | **香港ハンドブックを「検索で選ばれる実務ガイド」に** | title の検索意図合わせ、更新日・前提・目次・関連の共通フレーム、祝日 ICS | 検索流入（香港在住・往来する日本人）、信頼性 | 1.5〜2 日 | ★★★ |
| 4 | **トップページを「生きているアーカイブ」に** | 三十六景の進捗ブロック、更新タイムライン、断章ブロックの黒帯修正 | 第一印象、回遊、再訪理由 | 1 日 | ★★☆ |
| 5 | **「シェアされる」基盤 — OGP 画像自動生成 ＋ 共通シェア UI ＋ 画像 SEO** | 全ページの OGP カードを自動生成、シェア行を共通部品化、画像サイトマップ | SNS での見え方、Google 画像検索、拡散 | 1 日 | ★★☆ |

合計 6〜7 日相当（Opus のセッション換算で 1 フェーズ 2〜4 時間 × 6 フェーズ）。
すべて **静的 HTML のまま**（AGENTS.md の方針どおりビルドツール導入なし）。「JSON → HTML を生成するスクリプトを `tools/` に置き、生成物をコミットする」という、すでに `tools/ogp-pipeline.mjs` と GitHub Actions で採用している方式を拡張します。

**なぜこの 5 つか。** 現状の最大の問題は「中身は 90 ページ・35 景・24 篇・60 記事と豊富なのに、検索エンジンと SNS から見えるのはその一部だけ」という構造にあります（第 2 章）。提案 1〜3 は「見つかる」、提案 5 は「広がる」、提案 2・4 は「戻ってくる」を担当し、いずれも **新しい原稿を書かずに、既にある JSON と HTML から価値を引き出す** ものです。

---

## 1. 目標と考え方

- 北極星は AGENTS.md のとおり **月間 1,000 新規訪問者**。2026-06-02 の基準値は月 29 新規（アクティブ 35）、Search Console 表示 55 回 / クリック 2 回、流入はほぼ Direct（116 セッション）と Organic Social（22）。Organic Search はわずか 5 セッション。
- つまり「まだ検索にほとんど載っていない」状態。伸びしろは大きく、最初の 3〜6 か月は **検索に載るページ数と、検索意図に合ったタイトル** がすべてです。SNS は既に動いているので、その受け皿（OGP・シェア UI）を整えると効率が上がります。
- 正直な見立て: 35 → 1,000 は約 30 倍。提案 1・3 で数百 / 月の検索流入は現実的な射程（姫路城は国内外で検索量が大きく、香港実務は競合が少ない）。1,000 の壁を越えるには、その後も三十六景の完成や断章の継続といった **コンテンツの継続** が必要です。この計画は「器」を整える計画であり、器ができれば TJ が書くたびに自動で検索・SNS・フィードに載ります。

---

## 2. 現状診断（コードとライブサイトを確認した事実）

### 2.1 資産の棚卸し
- 公開 URL: sitemap.xml に 90 件。
- 白鷺三十六景: `assets/images/shirasagi/photos.json`（35 景、128KB）。各景に title / subtitle / date / gear / category（季節×時間帯）/ summary / tips（場所・撮り方）/ story（JA）/ location（lat, lng, name）。**`photos-en.json` と `photos-hk.json` も 35 景ぶん揃っている。** 画像は `webp/full`（1600px）と `webp/thumb`（600px）、元 JPG あり。
- 断章: `data/recent-photos.json`（24 篇。slug / title / place / date / body / image / imageWebp / alt / caption / link / sideFrames）。`fragments.html` 1 ページ + `#slug` ハッシュで表示。
- 記事: `data/articles.json`（60 本。note 43 / DRONE.jp 17。月曜 03:27 の Action `ogp-pipeline` が note RSS 等から自動更新）。
- 香港ハンドブック: hub `hongkong-handbook.html` + `hk-*` 9 ページ + `cn-*` 2 ページ + `holidays.html`（2026・2027 祝日、JSON あり）+ `gear-sim.html`。
- 旅: `data/trips.json`（11 旅、都市座標つき）と 60 ページ超の旅行記。
- ツール的ページ: `leica-serial.html`（シリアル→製造年、117KB データ）。
- 共通部品: `js/site-header.js`（ナビ・フッター・テーマ注入）、`growth.js`（GA4/Plausible 向けイベント）、`js/comments.js`（cusdis）、`js/photo-lightbox.js`、`js/image-fallback.js`、`tools/validate-growth-html.mjs`（リンク・メタ検査）。
- デザイン: `style.css` にトークン化済み（`--accent-color` 等、ダークモード対応）。三十六景と About は Tailwind CDN + 和紙色トークン（`bg-washi-bg`、`text-shirasagi-ink`）。

### 2.2 構造的なボトルネック（この計画が解くもの）
1. **三十六景の中身が 1 URL のモーダル内にしかない。** カード → `openModal(n)` で表示、URL は変わらない。Google に「第十三景 イーグレ姫路屋上からの錦秋」という 1 ページは存在せず、X や LINE で「この景」を共有する URL もない。三言語ぶんの物語（story / story_en / story_hk）と 35 か所の座標が眠っている。
2. **断章も同じ構造。** `fragments.html#slug` のみ。1 篇ずつ検索にもシェアにも載らない。
3. **フィードがない。** `rss/index.html` はトップへのリダイレクト。断章は月に数篇の新作があるのに、購読手段が note / X の外部に依存。
4. **OGP 画像がページごとに設計されていない。** 生写真か共通画像。三十六景・断章・ハンドブックが SNS で同じ顔に見える。
5. **title が検索意図でなく随筆の題になっている。** 例: `HSBC Premierとの付き合い方 — 100万ドルの珈琲の代償とメリット`。読み物としては良いが、「HSBC Premier 香港 条件」で探す人には届かない（H1 は随筆の題のまま、title タグだけ検索向けにできる）。
6. **トップの断章ブロックに黒い余白。** メイン写真（横位置）が、右列 3 枚のサイドフレームの高さに引き伸ばされ、写真の下に黒帯が出る（1458px 幅で確認）。トップの第一画面直下なので目立つ。
7. **ホスティングは GitHub Pages と判断**（リポジトリ直下の `CNAME`、その作成・削除の履歴、Actions の auto-commit で公開が更新されている点から。違っていれば Phase 0 で確認して本書を直す）。その前提では `.htaccess` は無効で、サーバー側リダイレクト・ヘッダーは使えない。ディレクトリ + `index.html` かファイル名で解決する設計にする。

### 2.3 競合の様子（2026-09-02 検索）
「姫路城 撮影スポット おすすめ」の上位は旅行会社・地元メディアの「10 選 / 12 選」型記事（読売旅行、姫路の種、castle-himeji.com、himeji-lab など）。英語は japan.travel、nippon.com、Wanderlog。
TJ の優位は **36 か所・四季・時間帯・座標・機材・作者の物語** という深さと、三言語。「一景一頁」にすれば「姫路城 イーグレ姫路 屋上」「姫路城 男山 新緑」「姫路城 初日の出 名古山」のような長尾を丸ごと取りに行けるし、hub は「36 選」として 10 選記事と戦える。

---

## 3. 提案の詳細

各提案は「狙い / 仕様 / 実装手順 / 受け入れ基準 / 工数とリスク」の順。ファイル名・URL・データ項目は付録 A に一覧。

### 提案 1 — 白鷺三十六景「一景一頁」化（最優先）

**狙い**
- 35 景 × JA/EN/HK = 105 ページを検索対象・シェア対象にする。姫路城の長尾クエリとインバウンド（EN / 繁体字）を取りにいく。
- hub（`shirasagi36.html`）は残し、「36 選」の入口として title を検索意図に合わせる。
- モーダルは残す（体験として良い）。ただし URL（`#no13`）を持たせ、「この景のページ」「リンクをコピー」を追加する。

**仕様**
- 生成スクリプト `tools/build-shirasagi.mjs`
  - 入力: `assets/images/shirasagi/photos.json`, `photos-en.json`, `photos-hk.json`
  - 出力: `shirasagi36/no01.html` … `no36.html`（JA）、`no01-en.html`、`no01-hk.html`。番号は 2 桁ゼロ埋め。JSON にある番号だけ生成（欠番・将来の第 36 景に自動追随）。
  - 注意: JSON のキーは `"1"`〜`"35"`（ゼロ埋めなし、`"12"` が末尾近くにある＝順不同）だが、画像ファイルは `assets/images/shirasagi/01.jpg`、`webp/full/01.webp`、`webp/thumb/01.webp` とゼロ埋め 2 桁。生成時は `String(n).padStart(2,'0')` で対応づけ、数値順にソートする。35 景すべてに jpg / full / thumb が揃っていることは確認済み。
  - 併せて出力: `shirasagi36/index.html`（`/shirasagi36.html` へ meta refresh + canonical）、`data/shirasagi-latest.json`（提案 4 が使う軽量 JSON: 総数・最新 3 景・季節別件数）、`sitemap.xml` のマーカー区間 `<!-- shirasagi36:auto:start -->…<!-- shirasagi36:auto:end -->` を置換（`<image:image>` 付き、提案 5 と共用）。
  - テンプレートは `tools/templates/shirasagi-view.html`（`{{title}}` 形式のプレースホルダ。ロジックはスクリプト側）。
  - 共通ヘルパー `tools/lib/html.mjs`（escape、日付整形、漢数字変換 13→「第十三景」、sitemap マーカー置換）。提案 2・5 でも使う。
- 各ページの構成（JA。EN/HK は文言と `lang`、hreflang の向きが変わるだけ）
  1. `<head>`: `<title>第十三景「大手前高楼 錦秋の城下」— 姫路城の撮影スポット：イーグレ姫路屋上 | 白鷺三十六景</title>`（形式: `第N景「title」— 姫路城の撮影スポット：location.name | 白鷺三十六景`）。description は summary を 110〜120 字に整形。canonical。hreflang ja/en/zh-Hant/x-default（4 本、相互に）。OGP（og:image は元 JPG `assets/images/shirasagi/13.jpg`、`og:image:width/height` 実寸、提案 5 完了後は生成カードに差し替え）。twitter:card summary_large_image、`twitter:creator @mongkok93`。`article:published_time`（date）、`article:modified_time`（生成日）。
  2. JSON-LD: `BreadcrumbList`（Home › 白鷺三十六景 › 第十三景）+ `ImageObject`（contentUrl、`creator` Person 田路昌也、`creditText`、`copyrightNotice`、`license` と `acquireLicensePage` → `about.html`、`contentLocation` に `Place` + `GeoCoordinates`、`dateCreated` = date）。`WebPage` の `isPartOf` で hub を示す。
  3. 本文: パンくず → 写真（`<picture>` webp/full + jpg、`width/height` 属性で CLS 回避、クリックで `photo-lightbox.js`）→ 景番号（漢数字）・title・subtitle → メタ行（季節 / 時間帯 / 撮影日 / 機材 / 場所）→ summary → story（段落）→ 撮影のヒント（tips）→ 「ここで撮る」ボックス（Leaflet ミニマップ 1 マーカー、`IntersectionObserver` で遅延初期化、`Googleマップで開く` と `撮影地マップで見る（shirasagi36-map.html#no13）`）→ シェア行（提案 5 の `js/share.js`。提案 5 前は簡易版: X / リンクをコピー）→ 前の景 / 次の景（サムネ付き）→ 同じ季節の景（3 枚）→ hub へ戻る（`shirasagi36.html#no13`）→ コメント（`<div id="comments-slot">` を置いて `js/comments.js` を読むだけ。page id は `location.pathname` から自動）。
     - `js/comments.js` の導入文は現在ハンドブック向けの固定文（「制度や条件は変わります…」）。三十六景・断章では不自然なので、スロットの `data-intro` 属性で上書きできるよう 3 行だけ改修する（例: 「この景の撮影地や季節の情報、みなさんの一枚の話をどうぞ」）。
  4. ナビ・フッターは `js/site-header.js` に任せる。`growth.js`、`/assets/js/ga4-tracking.js`、`js/image-fallback.js` を他ページ同様に読み込む。
  5. 見た目は三十六景 hub と同じ和紙トーン（Tailwind CDN + 既存カスタムクラス）。hub の `<style>` から必要分を `shirasagi36/view.css` に切り出して共有（EN/HK も同じ）。
- hub `shirasagi36.html` の変更
  - カードの `<a href="#view-01" onclick=…>` を `href="shirasagi36/no01.html"` に。JS 有効時は従来どおり `preventDefault` でモーダル、無効時・クローラーは実ページへ（プログレッシブエンハンスメント）。
  - モーダル開閉で `history.replaceState(null, '', '#no13')`、ページ読み込み時に `#noNN` があれば自動で開く。モーダル内に「この景のページを開く ↗」「リンクをコピー」「X で共有」を追加。
  - title を `姫路城の撮影スポット36選｜白鷺三十六景 — 四季・時間帯・場所で選ぶ | 田路昌也`（TJ 決定 2026-09-02。「写真家」「地元の写真家」という語はサイト全体で使わない）に。description も「36 か所・座標つき・三言語」を明示。EN/HK hub も同様（`Himeji Castle Photo Spots: 36 Views…`）。
  - 「最新の景」ブロックの VIEW DETAIL を新ページへリンク。
- `shirasagi36-map.html`: `#noNN` で該当マーカーにフォーカス＆ポップアップ。ポップアップに新ページへのリンク。
- Action `.github/workflows/build-shirasagi.yml`: `push` で `assets/images/shirasagi/photos*.json`、`tools/build-shirasagi.mjs`、`tools/templates/**` が変わったら実行し、`shirasagi36/**`、`data/shirasagi-latest.json`、`sitemap.xml` を auto-commit（`webp-convert.yml` と同じ書式）。`workflow_dispatch` も付ける。ローカルでは `node tools/build-shirasagi.mjs`。

**実装手順（Opus 向け）**
1. `tools/lib/html.mjs` と `tools/templates/shirasagi-view.html` を作る。まず JA 1 景（No.13）だけ生成して見た目を合わせる。
2. 全景・全言語を生成。`python3 -m http.server` でローカル確認（hub → カード → 新ページ → 前後 → hub 戻り）。
3. hub とマップの改修（href、hash、モーダル内リンク）。
4. sitemap マーカー区間、`data/shirasagi-latest.json`、Action。
5. `tools/validate-growth-html.mjs` を拡張して実行。既にルート以下を再帰走査しているので、追加するのは (a) `tools/templates/` を `SKIP_DIRS` に入れる、(b) `REQUIRED_SITEMAP_PATHS` の固定 3 本ではなく「走査した公開 HTML（`index.html` のリダイレクト用を除く）がすべて sitemap にあるか」を検査する、(c) `hreflang` の相互参照検査、の 3 点。
6. Rich Results Test（Google）で No.13 JA/EN の JSON-LD を確認、Lighthouse（モバイル）で SEO 100 / A11y 95+ / CLS 0.1 未満。

**受け入れ基準**
- 105 ページが生成され、それぞれ固有の title / description / canonical / hreflang / og:image を持つ。
- hub のカードは JS 無効でも新ページに到達できる。`shirasagi36.html#no13` で第十三景のモーダルが開く。
- sitemap に 105 URL（+画像）が入り、Search Console で送信済み。
- 生成後の HTML に絶対パスの `/assets/...` を使い、`shirasagi36/` 配下からの相対パス切れがない（validator で確認）。

**工数とリスク**
- 1.5 日（JA 1 日、EN/HK は同じテンプレートなので +0.5 日）。
- リスク: hub と個別ページの重複コンテンツ → hub は summary まで、個別は story まで、と役割を分ければ問題なし。画像重量 → 個別ページは `webp/full`（500KB 前後）1 枚のみ、前後・関連は `thumb`。
- Google の再クロールには 2〜4 週かかる。Search Console の URL 検査で数本は手動リクエストする。

### 提案 2 — 断章の個別ページ化 ＋ サイト全体のフィード

**狙い**
- 断章 1 篇 = 1 URL（検索・シェア・引用可能に）。
- Atom / JSON Feed を発行し、RSS リーダー・Feedly・自動投稿（IFTTT/Zapier → X）に載せられる状態にする。
- 提案 4 の「最近の更新」も同じ生成物（`data/updates.json`）から作り、更新情報の単一ソースにする。

**仕様**
- `tools/build-fragments.mjs`
  - 入力: `data/recent-photos.json`。日付 `2026年8月28日` → ISO に正規化するパーサを `tools/lib/html.mjs` に置く（`date` の表記ゆれがあれば警告して停止）。
  - 出力: `fragments/{slug}.html`（JA のみ）。`fragments/index.html` は `fragments.html` へ meta refresh。
  - ページ: 写真（メイン + sideFrames を 3 列グリッド、それぞれ caption）→ ラベル「断章」・title → place / date（`<time datetime>`）→ body（この一文の長い文体はそのまま。読みやすさのため `max-width: 38em`、行間 2.0）→ `link` があれば「関連: linkLabel →」→ シェア行 → 前の断章 / 次の断章（日付順）→ 「すべての断章」→ コメント（`<div id="comments-slot" data-intro="…">` + `js/comments.js`）。
  - JSON-LD: `BlogPosting`（headline, datePublished, image, author Person, `isPartOf` Blog 断章）+ `BreadcrumbList`。OGP は写真（提案 5 後は生成カード）。
  - `fragments.html` のカードは個別ページへリンク（既存の `#slug` 展開は残してよいが、リンク先は個別ページを優先）。トップの断章ブロックも title とカードを個別ページへ。
- `tools/build-feeds.mjs`
  - 入力: `data/recent-photos.json`、`assets/images/shirasagi/photos.json`、`data/articles.json`、`articles/*.html`（title / description / 日付はメタから）。
  - 出力: `feed.xml`（Atom 1.0、サイト全体、最新 30 件、断章は `<content type="html">` に本文と画像を入れる。note / DRONE.jp 記事は `<link rel="alternate" href="note の URL">` で外部を指す）、`feed-fragments.xml`（断章のみ）、`feed.json`（JSON Feed 1.1）、`data/updates.json`（種別 / タイトル / URL / 日付 / サムネの最新 12 件 = 提案 4 のタイムライン用）。
  - `rss/index.html` を `/feed.xml` へのリダイレクトに変更。
- `<link rel="alternate" type="application/atom+xml" title="tojimasaya.com" href="/feed.xml">` を **全 HTML の `<head>` に静的に挿入**（一回限りのスクリプトで `</head>` 直前に追加。生成テンプレートには最初から含める）。
- 購読モジュール `js/subscribe.js`（または生成テンプレート内の HTML 断片）: 「フォローする」— Feed / note / X / YouTube / Instagram のボタン行。設置: トップ断章ブロック末尾、`fragments.html`、各断章ページ、`writings.html`。メール購読（Buttondown 等）は **TJ の判断待ちの選択肢** としてプレースホルダだけ用意（設置時はアカウントが要る）。
- Action `.github/workflows/build-fragments-feeds.yml`: `data/recent-photos.json`、`data/articles.json`、`assets/images/shirasagi/photos.json`、`articles/**`、`tools/build-fragments.mjs`、`tools/build-feeds.mjs` の push で実行、auto-commit。
  - 注意: `ogp-pipeline.yml` が `GITHUB_TOKEN` でコミットする `articles.json` の更新は、GitHub の仕様で他の workflow をトリガーしない。→ `ogp-pipeline.yml` の末尾に `node tools/build-feeds.mjs` を 1 ステップ追加し、`file_pattern` に `feed*.xml feed.json data/updates.json` を足す。

**実装手順**
1. 日付パーサ + `fragments/{slug}.html` 生成（1 篇で見た目を決めてから全篇）。
2. トップと `fragments.html` のリンク先変更。
3. `build-feeds.mjs`（Atom → JSON Feed → updates.json の順）。W3C Feed Validator で `feed.xml` を検証。
4. 全 HTML への `<link rel="alternate">` 挿入、`rss/index.html` 変更。
5. 購読モジュール設置、Action 追加、`ogp-pipeline.yml` への追記。
6. validator 拡張（`fragments/**`）。

**受け入れ基準**
- 24 篇が個別 URL を持ち、`fragments.html` とトップから到達できる。
- `feed.xml` が Feed Validator を通り、Feedly / NetNewsWire で購読できる（断章の本文と画像が表示される）。
- `data/updates.json` に 5 種（断章 / 三十六景 / サイト内記事 / note / DRONE.jp）が混在して日付降順で入る。

**工数とリスク**
- 1 日。
- リスク: 断章の日付表記ゆれ（半角・全角、年省略）→ パーサで検出して停止し、JSON を直してもらう運用。フィードの画像は絶対 URL 必須。

### 提案 3 — 香港ハンドブックを「検索で選ばれる実務ガイド」に

**狙い**
- 香港に住む・往来する日本人（在留邦人 2 万人台 + 出張・旅行者 + 投資家）の実務クエリで、競合が薄い領域を確実に取る。TJ の 30 年の実体験は E-E-A-T そのもの。
- 随筆の題（H1）は残し、`<title>` と description だけ「探している言葉」に合わせる。中身は変えず、**枠**（更新日・前提・目次・関連・訂正募集）を共通化する。
- 正直な注記: Google は 2023 年に HowTo リッチリザルトを廃止し、FAQ リッチリザルトも行政・医療サイトに限定した。構造化データを入れても検索結果の見た目は変わらない。効くのは **title の意図一致・更新日の明示・内部リンク・ページ構造** なので、そこに工数を寄せる。JSON-LD は `Article`（`dateModified`、`author`）と `BreadcrumbList` にとどめる。

**仕様**
- `data/handbook.json`（新規の目録。title / url / audience（誰向け）/ summary（1 行）/ updated（ISO）/ group（入る・暮らす・お金・通信・行き来する）/ related（URL 配列））。hub・各ページの関連リンク・トップの手帳ブロック・`updates.json` がこれを参照する。
- 共通フレーム（全ハンドブック系ページに同じ順序で）
  1. ページ冒頭「この記事の前提」ボックス: 誰向け（例: 香港永住権のある日本国籍者）/ 最終更新日 / 制度は変わる旨と訂正募集の一文。
  2. 目次（h2 から自動生成する 20 行の JS `js/toc.js`。3 つ以上 h2 があるページのみ）。
  3. 本文は現状維持。ただし **「手順」部分は `<ol>`、「費用・所要日数・持ち物」は `<table>` に**（Opus が読んで該当箇所だけ整形。文章は変えない）。
  4. 末尾「更新履歴」（`<ul>`、日付 + 1 行。初回は「2026-09 枠を整備、内容は 2026-夏 時点」）。
  5. 「関連ガイド」3 件（`handbook.json` の related から）+ hub へ戻る。
  6. コメント（cusdis。対象 14 ページはすべて `js/comments.js` 読み込み済みなので位置の統一のみ）。
  7. シェア行（提案 5）。
- `<title>` / description の書き換え案（H1 は現状維持。Opus は各ページを読んで最終調整し、この表を PR 説明に添える）

| ページ | 現 title | 提案 title（検索意図） |
|---|---|---|
| hongkong-handbook | 香港ハンドブック — 暮らしと実務の記録（回郷証・銀行・送金） | 香港ハンドブック｜在住30年の日本人がまとめた回郷証・銀行・送金・SIM・祝日の実務ガイド |
| hk-return-permit | 非中国籍・香港永住者の回郷証 — 取得から中国入国まで | 非中国籍の回郷証（港澳居民来往内地通行証）の取り方 — 香港永住の日本人が申請・受取・中国入国・e道登録まで【2026年更新】 |
| hk-hsbc-premier | HSBC Premierとの付き合い方 — 100万ドルの珈琲の代償とメリット | 香港HSBC Premier の条件・費用・メリット — 30年使って分かった維持する価値 |
| hk-hsbc-fx-withdrawal | 香港HSBCの外貨引き出し — 事情と2025年限度額改定 | 香港HSBCで外貨（日本円・米ドル）を引き出す方法と限度額【2025年改定対応】 |
| hk-remittance | 香港の賢い送金術 — PayMe、FPS、バーチャルバンクの活用法 | 香港の送金を手数料ゼロで回す — PayMe・FPS・バーチャルバンクの使い分け |
| hk-hsbc-payment-connect | HSBC「Payment Connect」で中国本土に即時送金してみた | 香港から中国本土へ即時送金 — HSBC Payment Connect の使い方・限度額・実体験 |
| hk-hsbc-singapore-dormant | HSBCシンガポール口座、2年放置でドーマント化 — その復活劇 | HSBC シンガポール口座が休眠（ドーマント）になったときの復活手順 |
| hk-hsbc-taiwan | 台湾HSBCで“丁寧な門前払い” — 通貨の自由度を知った日 | 非居住者は台湾で銀行口座を作れるのか — 台北 HSBC で断られた理由と台湾ドルの事情 |
| hk-dbs-account | 新しくDBS銀行で口座をつくった理由 | 香港 DBS 銀行の口座開設 — HSBC・Citi と比べて選んだ理由と手順 |
| cn-icbc-dormant | 中国工商銀行の休眠口座を解決してみた | 中国工商銀行（ICBC）の休眠口座を復活させる手続き — 深圳での実体験 |
| cn-bank-passport-update | 中国の銀行口座のパスポート情報更新 — 深セン体験記 | 中国の銀行口座でパスポート更新後に必要な情報更新 — 深圳の窓口でやった手順 |
| hk-shenzhen-crossing | 旺角から深圳へ — 越境バスと口岸の実践ガイド（皇崗・福田・DJI旗艦店） | 香港から深圳へ日帰り — 旺角発の越境バスと皇崗・福田口岸の通り方（DJI旗艦店・華強北）【2026年夏 e道最新】 |
| gear-sim | SIM / Connectivity — 旅と二拠点生活の通信環境 | 香港・中国・日本を行き来する SIM/eSIM の使い分け — 二拠点生活の通信環境 |
| holidays | 香港・中国・台湾・日本・シンガポール・米国市場 祝日カレンダー 2026・2027 | 香港の祝日カレンダー 2026・2027（中国・台湾・日本・シンガポール・米国市場と重ね表示、中国の振替出勤日つき） |

- `holidays.html` の追加機能: 地域ごとの **ICS ダウンロード**（`tools/build-ics.mjs` が `data/holidays-*.json` から `calendars/hk-2026.ics` 等の静的ファイルを生成。「Google カレンダーに登録」は `webcal://` / URL 購読を案内）。中国の 2027 年カレンダーが公表される 11 月頃に JSON を更新すれば ICS も更新される旨を運用メモに。
- `hk-shenzhen-crossing.html`: 皇崗口岸の新ビル移行（断章 2026-08-28 で触れている）を「更新履歴」で追える構成に。断章 → ガイドへの相互リンク。
- hub `hongkong-handbook.html`: `handbook.json` から group ごとにカード表示（audience 1 行 + 更新日バッジ）。「最近更新したガイド」3 件を自動表示。
- 内部リンク: `articles/hong-kong-two-base-life.html`、`about.html`、`hongkong.html` から hub とハンドブック主要ページへ。

**実装手順**
1. `data/handbook.json` を作る（Opus が各ページから抽出、TJ が audience と updated を確認）。
2. `js/toc.js`、共通フレームの HTML 断片を 1 ページ（hk-return-permit）で完成させ、TJ 確認後に残り 12 ページへ展開。
3. title / description の書き換え（表を PR 説明に添付、TJ が承認したものだけ適用）。
4. holidays の ICS 生成、hub の再構成、内部リンク。
5. validator、Lighthouse。Search Console でハンドブック URL の再クロール要求。

**受け入れ基準**
- 14 ページすべてに前提ボックス・更新日・目次（該当ページ）・関連 3 件・コメント・シェアがある。
- `handbook.json` が hub・関連・トップ・updates の単一ソースになっている。
- ICS が macOS カレンダー / Google カレンダーで読める。

**工数とリスク**
- 1.5〜2 日（ページごとに読む必要があるため）。
- リスク: 事実の誤り。Opus は **本文を書き換えない**。表・ol 化も語句はそのまま。制度情報の更新は TJ の仕事として更新履歴に日付を残す。

### 提案 4 — トップページを「生きているアーカイブ」に

**狙い**
- 初訪問者に「何のサイトか」「いま何が動いているか」を 1 スクロールで伝える。
- 三十六景（看板）に写真の存在感を与え、「35 / 36、あと一景」という進行中の物語で再訪理由を作る。
- 断章ブロックの黒帯を直す。

**仕様（index.html の変更。既存セクションの順序は原則維持）**
1. **三十六景ブロック**（ヒーロー直下、断章の前）: 左に最新の景の写真（thumb ではなく full、`aspect-ratio` 指定）、右に「白鷺三十六景 — 35 / 36 景」の進捗（細いバー + 数字）、最新の景の title / date / 場所、「次の一景を待つ」一文、季節チップ（春 / 夏 / 秋 / 冬 → `shirasagi36.html?season=…` または hub の該当フィルタ）、「36 景を見る →」「撮影地マップ →」。データは `data/shirasagi-latest.json`（提案 1 が生成、数 KB）。フォールバック: JSON 取得失敗時は静的に書いた最新 1 景を表示。
2. **最近の更新タイムライン**（断章ブロックの後、ハンドブックの前）: `data/updates.json` から最新 8 件。行ごとに種別チップ（断章 / 三十六景 / 記事 / note / DRONE.jp / 旅）、日付、タイトル、サムネ 48px。JS 無効時は非表示（`<noscript>` で「すべての記事」リンク）。
3. **断章ブロックの修正**: グリッドを `align-items: start` にし、メイン figure の高さを写真に合わせる（`aspect-ratio` は JSON の実寸から。`recent-photos.json` に `width`/`height` を持たせるのが確実 → `tools/build-fragments.mjs` が画像から読み取って JSON に追記するオプション `--dims` を用意）。サイドフレームはメインの高さに収まるようスクロール可能な縦列に。ラベル「今日の断章」は日付が今日でなければ「最新の断章 · 5日前」のように相対表示に（JS）。
4. **ヒーローのコピー**（TJ の判断に委ねる提案）: 見出しは現状維持でよい。kicker「Himeji, Hong Kong, Travel and Cameras」の下、lead の前に、何が得られるかを名詞で 1 行: 「姫路城の撮影ガイド 36 景 ・ 香港で暮らす実務ハンドブック ・ 旅とカメラの記録」。4 枚のルートカードはそのまま。
5. **フッター**: 白鷺三十六景 / ハンドブック / 断章 / Feed を追加。購読モジュール（提案 2）を about-strip の下に。
6. **性能**: LCP 画像（castle31.webp）に `<link rel="preload" as="image" imagesrcset>`。ヒーロー 3 枚のうち画面外の 2 枚は `loading="lazy"` に戻す（現在 3 枚とも eager）。

**受け入れ基準**
- 1458px と 390px で黒帯が消えている。
- 三十六景ブロックとタイムラインが JSON から描画され、JSON が無くても崩れない。
- Lighthouse モバイル: Performance 85+、CLS 0.1 未満。GA4 で `home_shirasagi_block`、`home_updates_*` のクリックが `growth.js` 経由で取れる（`data-growth-label`）。

**工数とリスク**
- 1 日。提案 1・2 の生成物に依存するので Phase 3 で実施。
- リスク: index.html は 2,200 行で `<style>` が 1,400 行。既存クラスを壊さないよう、新規ブロックは `.home-shirasagi`、`.home-updates` の接頭辞で追加し、既存 CSS は断章の修正以外触らない。

### 提案 5 — 「シェアされる」基盤: OGP 画像自動生成 ＋ 共通シェア UI ＋ 画像 SEO

**狙い**
- X / Facebook / LINE / Threads で貼られたときに「tojimasaya.com のページだ」と分かる統一カードを、全ページぶん自動生成する（手作業ゼロ）。
- どのページからも同じ操作で共有できる小さな部品を置き、共有をイベントとして計測する。
- 三十六景の写真を Google 画像検索に正しく載せる（作者・ライセンス情報 + 画像サイトマップ）。

**仕様**
- `js/share.js`: `<div data-share data-title="…" data-url="…"></div>` を見つけて、[X] [Facebook] [LINE] [リンクをコピー]（モバイルでは `navigator.share` があれば [共有] 1 ボタンに集約）を描画。クリックで `growth.js` の `tjm_share`（label = ページ id + 媒体）を送る。スタイルは `style.css` の `--border-color` 等を使う 30 行程度。
  - `growth.js` の `emit()` は現在 IIFE 内の非公開関数。`window.tjmGrowth = { emit: emit }` を 1 行足して外から呼べるようにする（既存イベントには影響なし）。X / Facebook / LINE のボタンは `<a data-growth-label="share_x">` にしておけば既存の `tjm_outbound_click` でも拾える。設置: 三十六景ページ（提案 1）、断章ページ（提案 2）、ハンドブック（提案 3）、`articles/*.html`、旅行記の各ページ。
- `tools/build-og.mjs`: 1200×630 PNG を `assets/og/cards/{page-id}.png` に生成。
  - 三十六景: 写真を全面に、下 1/3 に暗いグラデーション、左下に「第十三景」（漢数字・小）と title（Noto Serif JP）、右下に「白鷺三十六景 · tojimasaya.com」。EN/HK は title を差し替え。
  - 断章: 写真 + 「断章」+ title + 日付。
  - ハンドブック / 記事 / 主要ページ: 写真（`handbook.json` などで指定、無ければ既定の姫路城 / 香港写真）+ title + 種別。
  - 実装は satori + @resvg/resvg-js（日本語の折り返しが安定。フォントは Noto Serif JP の TTF を `tools/fonts/` に同梱、OFL）。sharp + SVG でも可だが、**日本語の長いタイトル 3 本で折り返しを目視確認** することを受け入れ条件にする。
  - 生成対象の一覧は `tools/og-manifest.mjs` が各 JSON / HTML から組み立てる。差分生成（既存 PNG より入力が新しいときだけ）。
  - 各ページの `og:image` / `twitter:image` を生成カードに差し替え（提案 1・2 のテンプレートは生成パスを参照、既存 HTML は一回限りのスクリプトで置換。PNG が無いページは写真のまま）。
- 画像 SEO: 三十六景ページの `ImageObject`（提案 1）に `license` / `acquireLicensePage` / `creditText` / `creator` / `copyrightNotice` を揃える（Google 画像の「ライセンス可能」バッジ要件）。sitemap の三十六景区間に `<image:image>`（`image:loc`、`image:title`、`image:caption`）。`alt` は「姫路城 — 第十三景 大手前高楼 錦秋の城下（イーグレ姫路屋上から、秋の午後）」の形式で生成。
- Action `.github/workflows/build-og.yml`: 提案 1・2 の workflow の後段に `build-og.mjs` を追加するか、`workflow_dispatch` + 週 1 で実行（生成物は PNG なので差分実行が前提）。

**受け入れ基準**
- X Card Validator 相当（実際に X に投稿してプレビュー）、Facebook Sharing Debugger、LINE で 3 種類（景 / 断章 / ハンドブック）のカードが意図どおり表示される。
- `tjm_share` イベントが GA4 に届く。
- Search Console の「検索タイプ: 画像」で三十六景ページの表示回数が出始める（4〜8 週後）。

**工数とリスク**
- 1 日。
- リスク: フォント同梱のリポジトリ肥大（TTF は Noto Serif JP のサブセットにする。全角ひらがな・カタカナ・JIS 第 1 水準で 1〜2MB）。PNG 105 + 24 + 20 枚 ≒ 150 枚 × 150KB ≒ 25MB。許容範囲だが、`assets/og/cards/` は Git LFS にしないこと（GitHub Pages は LFS を配信しない）。

---

## 4. 実行順序とフェーズ（Opus への引き継ぎ）

原則: **1 フェーズ = 1 ブランチ = 1 セッション**。ローカルでは `.claude/launch.json` の `static-site`（Node の簡易サーバー、port 8080。`python3 -m http.server 8080` でも可）で目視確認 → main にマージ → push → GitHub Pages 反映 → Action が生成物をコミット → `git pull` で生成物を取り込む。各フェーズの末尾で `node tools/validate-growth-html.mjs` を必ず通す。

Action が main に auto-commit したあとは、ローカルで次の作業を始める前に必ず `git pull` すること（GitHub Desktop の Fetch origin → Pull）。生成物を手で編集しない。

| Phase | 内容 | 依存 | ブランチ名 | 目安 |
|---|---|---|---|---|
| 0 | 共通ヘルパー `tools/lib/html.mjs`、validator の走査範囲拡張、`.htaccess` は残すが README に「GitHub Pages では無効」と注記 | なし | `chore/phase0-tooling` | 1 時間 |
| 1 | 提案 1（三十六景ページ JA→EN/HK、hub・map 改修、Action）+ 提案 5 のうち `js/share.js` 簡易版と画像サイトマップ | 0 | `feat/phase1-shirasagi-pages` | 3〜4 時間 |
| 2 | 提案 2（断章ページ、feed、updates.json、購読モジュール、rel=alternate 一括挿入） | 0 | `feat/phase2-fragments-feeds` | 3 時間 |
| 3 | 提案 4（トップ改修） | 1, 2 | `feat/phase3-home` | 3 時間 |
| 4 | 提案 3（ハンドブック）— Phase 2 と並行可（別セッション・別 worktree） | 0 | `feat/phase4-handbook` | 4〜6 時間（2 回に分けてよい） |
| 5 | 提案 5（OG 生成、既存ページの og:image 差し替え） | 1, 2 | `feat/phase5-og-cards` | 3 時間 |

### 4.1 各フェーズの指示文（そのまま貼れる）

共通の前置き（毎回冒頭に付ける）:

```
リポジトリ: ~/Projects/tojimasaya.com/TJWebsite
まず AGENTS.md と PLAN_2026-09_growth-redesign.md を読むこと。
守ること: 静的 HTML のまま／ビルドツール導入なし／生成物は tools/*.mjs で作りコミットする／既存の assets, data, JS, リンク（note, DRONE.jp, X, Facebook, YouTube, mailto）を消さない／
ユーザー向け文言は日本語（既に英語のセクションは英語）／新規公開ページは必ず sitemap.xml と既存ページからのリンクを持つ／
本文（TJ の文章）は書き換えない。整形・枠付け・メタデータのみ。
作業は指定ブランチで行い、終わったら変更ファイル一覧・確認手順・TJ に判断してほしい点を箇条書きで報告すること。
```

Phase 1:
```
Phase 1 を実施する。計画書の「提案 1」と「付録 A / B」に従い、
(1) tools/lib/html.mjs と tools/templates/shirasagi-view.html を作り、まず No.13 の JA ページだけ生成して shirasagi36.html と同じ和紙トーンに合わせる。
(2) 全景・全言語（photos.json / photos-en.json / photos-hk.json）を生成し、shirasagi36/index.html、data/shirasagi-latest.json、sitemap.xml のマーカー区間も出力する。
(3) shirasagi36.html / -en / -hk のカード href を実ページに変え、モーダルに #noNN の replaceState と「この景のページ／リンクをコピー／X で共有」を追加。shirasagi36-map.html に #noNN フォーカスを追加。
(4) js/share.js の簡易版（X／リンクをコピー／navigator.share）を作り、生成ページに設置。
(5) .github/workflows/build-shirasagi.yml を webp-convert.yml と同じ書式で追加。
(6) tools/validate-growth-html.mjs を shirasagi36/** まで走査するよう拡張して実行し、hreflang の相互参照と相対パス切れがないことを確認。
hub の title 変更案は適用せず、報告に案として書くこと（TJ が決める）。
```

Phase 2:
```
Phase 2 を実施する。計画書の「提案 2」に従い、
(1) 日付パーサ（「2026年8月28日」→ ISO、表記ゆれは警告して停止）を tools/lib/html.mjs に追加。
(2) tools/build-fragments.mjs で fragments/{slug}.html を生成（1 篇で見た目を決めてから全篇）。fragments.html とトップの断章ブロックのリンク先を個別ページに。
(3) tools/build-feeds.mjs で feed.xml（Atom）、feed-fragments.xml、feed.json、data/updates.json を生成。W3C Feed Validator で確認。
(4) 全 HTML の </head> 直前に <link rel="alternate" type="application/atom+xml" …> を挿入（一回限りのスクリプト tools/oneoff/add-feed-link.mjs。二重挿入しない）。rss/index.html を /feed.xml へのリダイレクトに。
(5) 購読モジュール（Feed / note / X / YouTube / Instagram）をトップ断章末尾・fragments.html・各断章ページ・writings.html に設置。メール購読はプレースホルダのみ。
(6) .github/workflows/build-fragments-feeds.yml を追加し、ogp-pipeline.yml の末尾に build-feeds.mjs の実行と file_pattern 追記を行う。
```

Phase 3:
```
Phase 3 を実施する。計画書の「提案 4」に従い index.html を改修する。
既存 CSS は断章ブロックの修正以外触らず、新規ブロックは .home-shirasagi / .home-updates 接頭辞で追加。
(1) 三十六景ブロック（data/shirasagi-latest.json、フォールバック付き）、(2) 最近の更新タイムライン（data/updates.json）、(3) 断章ブロックの黒帯修正と相対日付ラベル、(4) フッター追加リンクと購読モジュール、(5) LCP preload とヒーロー画像の lazy 化。
ヒーローのコピー変更は適用せず案として報告。1458px と 390px のスクリーンショットを報告に添える。
```

Phase 4:
```
Phase 4 を実施する。計画書の「提案 3」に従い、
(1) data/handbook.json を作る（対象 14 ページ。audience / summary / updated / group / related）。
(2) js/toc.js と共通フレーム（前提ボックス・更新日・目次・更新履歴・関連 3 件・コメント・シェア）を hk-return-permit.html で完成させ、報告して止まる。
TJ の確認後に残り 13 ページへ展開し、title / description の書き換え案（計画書の表）を PR 説明に添える。本文の語句は変えない。手順は <ol>、費用・日数・持ち物は <table> に整形してよい。
(3) tools/build-ics.mjs で calendars/*.ics を生成し holidays.html にダウンロード導線を置く。
(4) hongkong-handbook.html を handbook.json 駆動の hub に再構成し、articles/hong-kong-two-base-life.html・about.html・hongkong.html から内部リンクを張る。
```

Phase 5:
```
Phase 5 を実施する。計画書の「提案 5」に従い、
(1) tools/og-manifest.mjs と tools/build-og.mjs（satori + @resvg/resvg-js、Noto Serif JP サブセット同梱）で assets/og/cards/*.png を差分生成。三十六景・断章・ハンドブック・主要ページの 4 種のレイアウト。
(2) 生成テンプレートと既存 HTML の og:image / twitter:image を生成カードに差し替え（PNG が無いページは現状維持）。
(3) js/share.js を完成版（X / Facebook / LINE / コピー / navigator.share、tjm_share イベント）にし、ハンドブック・articles・旅行記にも設置。
(4) 日本語の長いタイトル 3 本の折り返しを PNG で目視確認し、報告に画像を添える。
```

### 4.2 TJ が判断・作業すること（フェーズ横断）
- hub / ハンドブックの title 案の採否（言葉の最終判断は TJ）。
- `handbook.json` の audience / updated の確認。
- メール購読サービスを使うか（使うなら Buttondown か Substack のアカウント作成）。
- Search Console でサイトマップ再送信と、主要 URL の検査リクエスト（各フェーズ公開後）。
- X / note のプロフィールに `feed.xml` と三十六景 hub の URL を置く（既存の growth-plan の Week 3 施策と同じ）。

---

## 5. 計測と判断ルール

既存の `docs/growth/monthly-visitor-checklist.md` の月・木レビューをそのまま使い、見る場所を 3 クラスタに分ける。

| クラスタ | Search Console のページフィルタ | GA4 | 4 週後の期待 | 12 週後の期待 |
|---|---|---|---|---|
| 三十六景 | `shirasagi36/` | ランディングページ、`open_shirasagi_photo`、`tjm_share` | 105 URL のインデックス登録、表示 100+ | 表示 1,000+ / 月、クリック 50+、画像検索の表示が発生 |
| ハンドブック | `hk-`、`cn-`、`holidays`、`gear-sim` | ランディング、滞在時間、コメント | 表示が基準値の 3 倍 | クリック 100+ / 月（祝日ページは 11 月以降に跳ねる） |
| 断章・フィード | `fragments/` | 再訪ユーザー率、`feedly.com` 等の参照 | 24 URL 登録 | 再訪率 +5pt、購読参照が出始める |

判断ルール（既存のものに追記）:
- 表示はあるのに CTR 2% 未満 → title / description の言い回しを直す（本文は触らない）。
- 三十六景の特定の景に表示が集中 → その景の story を加筆（TJ）、同季節の景へ内部リンクを増やす。
- 断章の特定 slug に検索表示 → 関連するハンドブック / 旅行記へリンクを足す。

正直な目安: 6 か月後に Organic Search だけで月 300〜600 新規、Social + Direct + Feed を合わせて 500〜800。1,000 到達には「三十六景の完成」「断章の継続」「ハンドブックの年次更新」が要る。器はこの計画で整う。

---

## 6. 今回やらないこと（次の候補）

- **サイト内検索**（Pagefind 相当の静的インデックス）: ページが 250 を超えた後に検討。
- **Leica シリアル検索の英語版**: 英語圏の「Leica serial number lookup」需要は大きいが競合も多い。三十六景の英語ページの反応を見てから。
- **トピックハブ**（姫路 / 香港 / 旅 / ガジェットを横断するタグページ）: JSON へのタグ付けが要る。`updates.json` が整ってから。
- **index.html の 1,400 行インライン CSS の外出し**: 効果は保守性のみ。Phase 3 でついでに触らない。
- **note 記事の要約ページをサイト内に持つ**: 薄いページになり逆効果になりやすいので見送り。オンサイト記事は `articles/` の 3 本方式（本文を書く）を続ける。

---

## 付録 A — URL・ファイル設計

| 種別 | パス | 生成元 | 備考 |
|---|---|---|---|
| 三十六景 JA | `/shirasagi36/no13.html` | `photos.json` | `no01`〜`no36` ゼロ埋め |
| 三十六景 EN / HK | `/shirasagi36/no13-en.html`, `/shirasagi36/no13-hk.html` | `photos-en.json`, `photos-hk.json` | 既存の `-en.html / -hk.html` 慣習に合わせる |
| 三十六景 dir index | `/shirasagi36/index.html` | 固定 | `/shirasagi36.html` へ refresh |
| 三十六景 最新 JSON | `/data/shirasagi-latest.json` | `build-shirasagi.mjs` | トップ用、数 KB |
| 断章 | `/fragments/{slug}.html` | `recent-photos.json` | slug は既存値 |
| フィード | `/feed.xml`, `/feed-fragments.xml`, `/feed.json` | `build-feeds.mjs` | Atom 1.0 / JSON Feed 1.1 |
| 更新一覧 | `/data/updates.json` | `build-feeds.mjs` | トップのタイムライン |
| ハンドブック目録 | `/data/handbook.json` | 手作業（初回は Opus 抽出） | hub / 関連 / トップが参照 |
| 祝日 ICS | `/calendars/hk-2026.ics` 等 | `build-ics.mjs` | 地域 × 年 |
| OG カード | `/assets/og/cards/{page-id}.png` | `build-og.mjs` | 1200×630 |
| 共通 JS | `/js/share.js`, `/js/toc.js` | 手作業 | 30〜80 行ずつ |
| テンプレート | `/tools/templates/*.html` | 手作業 | `{{key}}` 置換 |
| ヘルパー | `/tools/lib/html.mjs` | 手作業 | escape / 日付 / 漢数字 / sitemap マーカー |
| Actions | `.github/workflows/build-shirasagi.yml`, `build-fragments-feeds.yml`, `build-og.yml` | 手作業 | `webp-convert.yml` と同じ auto-commit 方式 |

page-id の規則: 三十六景 `shirasagi-no13`（EN `shirasagi-no13-en`）、断章 `fragment-{slug}`、その他はファイル名から拡張子を除いたもの。cusdis の `data-page-id`、OG カードのファイル名、`tjm_share` の label に共通で使う。

## 付録 B — 三十六景ページの head テンプレート（JA）

```html
<title>{{kanjiNo}}「{{title}}」— 姫路城の撮影スポット：{{locationName}} | 白鷺三十六景</title>
<meta name="description" content="{{description120}}">
<link rel="canonical" href="https://tojimasaya.com/shirasagi36/no{{nn}}.html">
<link rel="alternate" hreflang="ja" href="https://tojimasaya.com/shirasagi36/no{{nn}}.html">
<link rel="alternate" hreflang="en" href="https://tojimasaya.com/shirasagi36/no{{nn}}-en.html">
<link rel="alternate" hreflang="zh-Hant" href="https://tojimasaya.com/shirasagi36/no{{nn}}-hk.html">
<link rel="alternate" hreflang="x-default" href="https://tojimasaya.com/shirasagi36/no{{nn}}.html">
<link rel="alternate" type="application/atom+xml" title="tojimasaya.com" href="/feed.xml">
<meta property="og:type" content="article">
<meta property="og:title" content="{{kanjiNo}}「{{title}}」— 白鷺三十六景">
<meta property="og:description" content="{{description120}}">
<meta property="og:image" content="https://tojimasaya.com/assets/og/cards/shirasagi-no{{nn}}.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:url" content="https://tojimasaya.com/shirasagi36/no{{nn}}.html">
<meta property="article:published_time" content="{{dateIso}}">
<meta property="article:modified_time" content="{{buildIso}}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@mongkok93"><meta name="twitter:creator" content="@mongkok93">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {"@type": "BreadcrumbList", "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://tojimasaya.com/"},
      {"@type": "ListItem", "position": 2, "name": "白鷺三十六景", "item": "https://tojimasaya.com/shirasagi36.html"},
      {"@type": "ListItem", "position": 3, "name": "{{kanjiNo}} {{title}}"}
    ]},
    {"@type": "ImageObject",
     "contentUrl": "https://tojimasaya.com/assets/images/shirasagi/{{nn}}.jpg",
     "url": "https://tojimasaya.com/shirasagi36/no{{nn}}.html",
     "name": "姫路城 — {{kanjiNo}} {{title}}",
     "caption": "{{subtitleOrSummary}}",
     "dateCreated": "{{dateIso}}",
     "creator": {"@type": "Person", "name": "田路昌也 (Toji Masaya)", "url": "https://tojimasaya.com/about.html"},
     "creditText": "Toji Masaya / tojimasaya.com",
     "copyrightNotice": "© Toji Masaya",
     "license": "https://tojimasaya.com/about.html#license",
     "acquireLicensePage": "https://tojimasaya.com/about.html#license",
     "contentLocation": {"@type": "Place", "name": "{{locationName}}",
       "geo": {"@type": "GeoCoordinates", "latitude": {{lat}}, "longitude": {{lng}}}}
    }
  ]
}
</script>
```

（`about.html#license` は「写真の利用について」の短い節を About に追加する。連絡先は既存の mailto。）

## 付録 C — Atom フィードの最小仕様

- `<feed>`: `id` = `https://tojimasaya.com/`、`title`、`subtitle`、`updated`（最新 entry）、`link rel=self`（feed.xml）、`link rel=alternate`（トップ）、`author`。
- `<entry>`: `id`（ページの絶対 URL。外部記事は note の URL）、`title`、`link rel=alternate`、`published`、`updated`、`category term`（fragment / shirasagi / article / note / dronejp）、`summary`、断章のみ `content type=html`（`<img>` は絶対 URL）。
- 文字は必ず escape。日付は ISO 8601 with `+09:00`（断章・三十六景は日本時間）。
- JSON Feed は同じ配列から `items[]`（`id`, `url`, `external_url`（外部記事）, `title`, `content_html` / `summary`, `image`, `date_published`, `tags`）。

## 付録 D — 各フェーズ共通チェックリスト

- [ ] `node tools/validate-growth-html.mjs` が 0 エラー
- [ ] 新規ページは sitemap.xml に入り、既存ページからリンクされている
- [ ] 新規ページに title / description / canonical / og:image / `growth.js` がある
- [ ] `shirasagi36/`・`fragments/` 配下からのパスはすべて `/` 始まりの絶対パス
- [ ] ダークモードで崩れない（`data-theme="dark"` で確認）
- [ ] 390px 幅で横スクロールが出ない
- [ ] Lighthouse（モバイル）SEO 100 / A11y 95+ / CLS 0.1 未満
- [ ] Action が auto-commit するファイルと、手で編集するファイルが混ざっていない（生成物は手で直さない）
