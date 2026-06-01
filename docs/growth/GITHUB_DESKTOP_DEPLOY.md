# GitHub Desktopで反映する手順

このパッケージは、tojimasaya.com の公開リポジトリのルートに上書きコピーして、GitHub Desktopで差分確認・コミット・Pushする前提で作っています。

## 1. GitHub Desktopでリポジトリを開く
1. GitHub Desktopを開く。
2. `File` → `Add local repository...` で tojimasaya.com のローカルリポジトリを選ぶ。
3. 左上の Current Repository が対象リポジトリになっていることを確認する。

## 2. ファイルを上書きする
1. このZIPを展開する。
2. 展開した中身を、リポジトリのルートへコピーする。
3. 既存の `assets/`, `data/`, favicon類、既存JSなどは削除しない。
4. 下記は追加または上書き対象。

```text
index.html
gallery.html
gear.html
gear-camera.html
gear-drone.html
gear-editing.html
gear-accessories.html
writings.html
style.css
growth.js
robots.txt
sitemap.xml
articles/drone-travel-guide.html
articles/leica-m2-travel.html
articles/hong-kong-two-base-life.html
growth-plan.md
hermes-execution-report.md
utm-campaigns.csv
content-calendar-30days.csv
validation-report.md
```

## 3. GitHub Desktopで差分確認
1. GitHub Desktopの `Changes` タブを開く。
2. 変更ファイルが表示されることを確認する。
3. 特に次を確認する。
   - Homeに `Featured Guides` が追加されている。
   - Writingsに `Site Guides` が追加されている。
   - `articles/` に3本の記事ページが追加されている。
   - `sitemap.xml` に3本の記事URLが入っている。
   - 全HTMLに `growth.js` が読み込まれている。

## 4. コミット
おすすめのコミットメッセージ:

```text
Add growth-focused site guides and SEO tracking
```

Description:

```text
- Add three evergreen guide articles for drone, Leica, and Hong Kong/two-base life
- Add Featured Guides and Site Guides entry points
- Improve SEO metadata, sitemap, robots, and structured data
- Add growth.js for GA4/GTM/Plausible-friendly event tracking
- Add Hermes growth plan and validation reports
```

## 5. Push / 公開確認
1. `Commit to main` または対象ブランチへコミット。
2. `Push origin` をクリック。
3. GitHub Pages、Netlify、Vercel、または利用中のホスティングでデプロイ完了を確認。
4. 公開後に確認するURL。

```text
https://tojimasaya.com/
https://tojimasaya.com/writings.html
https://tojimasaya.com/articles/drone-travel-guide.html
https://tojimasaya.com/articles/leica-m2-travel.html
https://tojimasaya.com/articles/hong-kong-two-base-life.html
https://tojimasaya.com/sitemap.xml
```

## 6. 公開後の計測
Search Consoleで `https://tojimasaya.com/sitemap.xml` を送信してください。
GA4では月曜・木曜の定期チェックで以下を見ます。

- New users
- First user default channel group
- Landing page
- `tjm_internal_cta_click`
- `tjm_outbound_click`

月間1,000新規ビジターには、1日平均で約34新規ユーザーが必要です。
