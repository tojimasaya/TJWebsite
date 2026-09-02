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
