# tojimasaya.com

田路昌也の個人サイト（静的 HTML / CSS / JS）。方針は `AGENTS.md`、2026-09 の改造計画は `PLAN_2026-09_growth-redesign.md`。

## ホスティング

GitHub Pages（`CNAME` = tojimasaya.com）。`.htaccess` は Apache 用の名残で **GitHub Pages では無効**（サーバー側リダイレクトやヘッダーは効かない）。URL はファイル名・ディレクトリ + `index.html` で解決する。

## 生成物（手で編集しない）

| 生成物 | 生成元 | コマンド / Action |
|---|---|---|
| `shirasagi36/noNN.html`, `noNN-en.html`, `noNN-hk.html`（白鷺三十六景 一景一頁） | `assets/images/shirasagi/photos*.json` + `tools/templates/shirasagi-view.html` | `node tools/build-shirasagi.mjs` / `.github/workflows/build-shirasagi.yml` |
| `data/shirasagi-latest.json`、`sitemap.xml` の `shirasagi36:auto` 区間、hub の `shirasagi36:links` 区間 | 同上 | 同上 |
| `assets/images/shirasagi/webp/**` | `assets/images/shirasagi/*.jpg` | `.github/workflows/webp-convert.yml` |
| `data/articles.json`, `data/writings-og.json`, `assets/og/` | note / DRONE.jp の RSS・OGP | `.github/workflows/ogp-pipeline.yml`（月曜 03:27） |

Action が main に auto-commit したあとは、ローカルで作業を始める前に `git pull`（GitHub Desktop の Fetch origin → Pull）。

## 検査

```
node tools/validate-growth-html.mjs   # title / description / growth.js / リンク切れ / ローカル資産 / sitemap 網羅 / hreflang 相互参照
node tools/build-shirasagi.mjs --check  # 生成物が最新か（差分があれば exit 2）
```

## ローカル確認

`python3 -m http.server 8080` または `.claude/launch.json` の `static-site`。`/shirasagi36/` 配下は絶対パス（`/assets/...`）で参照しているので、ファイル直開きではなくサーバー経由で見る。

## 城の解説ガイドに項目を追加する

`shirasagi36-guide.html` は、目次と独立した `article.guide-chapter` を項目単位で追加する。
目次のリンクは既存と同じ `span`（番号）・`strong`（項目名）・`small`（説明）の構造にし、
リンク先と章の `id` を一致させる。章の見出しには番号・見出し・導入を置く。
`guide.js` がこの目次から追従メニュー・現在の章の表示・次の章へのリンクを作るため、
JavaScriptに項目数やリンクを別途追加する必要はない。目次カードは項目数に応じて折り返す。
JavaScriptが無効でも本文と冒頭の目次は使える。

既存の `renritsu`・`daibashira`・`old-west-pillar` 等のIDは外部リンクから使われるので維持する。
将来、項目を独立ページに移す場合は、元のアンカーからの案内と内部リンク・canonical・sitemapも一緒に更新する。

## 行き方・街歩きと撮影地マップ

城の構造・歴史・見どころは `shirasagi36-guide.html`、所在地・駅からの徒歩経路・街歩きは
`shirasagi36-access.html` に置く。撮影ポイントを探す `shirasagi36-map.html` は独立した地図として保ち、
アクセスページと相互リンクする。白鷺三十六景の入口と末尾には、図解・撮影地マップ・行き方の順にリンクを置く。

旧図解ページの `#access`・`#access-heading`・`#location-heading`・`#walk-heading` は
`guide.js` でアクセスページの同じアンカーへ移動する。JavaScriptが無効でも移転先へのリンクが表示される。
アクセスページは共通の画像拡大機能を使うが、城の解説用の章メニューには含めない。
