# AGENTS.md — tojimasaya.com

## Project goal
The primary growth goal is to reach 1,000 new visitors per month for tojimasaya.com. Prioritize changes that improve organic discovery, first-visit navigation, internal linking, and measurement.

## Site type
This is a static personal site written in plain HTML, CSS, and small JavaScript files. Avoid introducing build tooling unless explicitly requested.

## Implementation guidelines
- Keep the existing visual tone: minimal, photographic, travel/camera/drone oriented.
- Preserve existing assets under `assets/` and existing data files under `data/`.
- Prefer small, reversible HTML/CSS/JS edits.
- Use Japanese copy for user-facing text unless the surrounding section is already in English.
- Add or preserve canonical URLs, clear page titles, meta descriptions, Open Graph metadata, and internal links.
- Avoid adding external tracking scripts directly. Use `growth.js` only to bridge to GA4/GTM/Plausible when those libraries already exist on the page.
- Do not remove existing note, DRONE.jp, X, Facebook, YouTube, or mailto links unless replacing them with a better equivalent.

## 断章の写真
- 断章に使う写真は常に `~/Desktop/断章` に保存されている。更新時はまずこのフォルダを確認し、写真の保存場所を毎回ユーザーに尋ねない。
- 元写真はそのまま残し、掲載用の画像を `assets/images/photo-notes/` に作成する。

## 掲載写真の軽量化
- 新規・差し替えの掲載写真はWebPを基本とし、実際にページがWebPを読み込むことまで確認する。元写真は変更せず残す。
- 一覧カードには記事本文の大きな画像を流用せず、表示サイズに合う縮小WebPを用意する。`srcset`・`sizes`で端末に合う画像を配信し、`width`・`height`も指定する。
- 公開前に画像の容量と、PC・スマートフォンでの画質・縦横比・読み込みを確認する。旅の一覧カードは既存の横3:2の枠にそろえる。

## Review guidelines
- Treat broken internal links, missing metadata on new public pages, malformed HTML, and JavaScript errors as high-priority issues.
- Check that new landing pages are linked from at least one existing page and included in `sitemap.xml`.
- Verify that changes do not depend on unavailable local build tools.
- Flag privacy issues if new scripts collect user data beyond click/page events delegated to existing analytics tools.
