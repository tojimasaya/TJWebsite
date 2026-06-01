# tojimasaya.com Growth Plan — HERMES Agent Stack

## North Star
- **Goal:** 1,000 new visitors / month
- **Daily pace:** about 33 new visitors / day
- **Primary measurement:** GA4 `New users` by `First user default channel group`
- **Secondary measurements:** Search Console clicks, indexed pages, internal CTA click rate, outbound article click rate

## HERMES Orchestrator
HERMES is the parent agent that keeps all sub-agents aligned to the single metric: new monthly visitors.

### Sub-agents
1. **SEO Scout**
   - Owns title tags, meta descriptions, canonical URLs, sitemap, robots.txt, structured data, and internal links.
   - Weekly output: search query opportunities and pages to refresh.

2. **Content Curator**
   - Turns existing assets into searchable topic clusters: Hong Kong, drones, Leica/camera, travel gadgets.
   - Weekly output: 1 long-form article idea and 3 short social posts.

3. **Gallery Producer**
   - Converts photos/videos into story-led entries that link to writings and gear.
   - Weekly output: 1 gallery refresh with location, date, story, and related article/gear links.

4. **Growth Engineer**
   - Implements UX, internal links, performance hygiene, and analytics events.
   - Weekly output: one measurable site improvement.

5. **Analytics Scribe**
   - Reads GA4/Search Console, identifies which channel generated new users, and reports actions.
   - Weekly output: a 5-line report: new users, top source, top page, top query, next action.

## First implementation shipped in this package
- Added a **Start here** section on the homepage to route first-time users into Drone, Gallery, and Gear.
- Added **topic route blocks** on Gallery, Gear, and Writings to increase internal navigation.
- Improved titles, meta descriptions, canonical URLs, preconnects, and social card metadata.
- Added Breadcrumb structured data to subpages and expanded homepage structured data.
- Added `sitemap.xml` and `robots.txt`.
- Added `growth.js`, a no-cookie event helper that sends page views and CTA/outbound clicks to `dataLayer`, `gtag`, or Plausible when available.

## 30-day execution plan

### Week 1 — Foundation
- Deploy this package.
- Add GA4 or Plausible script if not already present.
- Submit `sitemap.xml` in Google Search Console.
- Confirm the target report: New users by First user default channel group.

### Week 2 — Searchable content
Publish or refresh 2 articles that can capture search demand:
- `DJI Mini 5 Proを旅行で使うなら：香港・日本二拠点生活での実感`
- `Leica M2と旅写真：デジタル時代にフィルムを持ち歩く理由`

### Week 3 — Social/referral loop
- Post 3 short X threads linking to the new homepage Start Here cards with UTM tags.
- Add links from note profile and YouTube descriptions back to `tojimasaya.com/writings.html` and `tojimasaya.com/gallery.html`.

### Week 4 — Review and double down
- Find the top 3 landing pages by new users.
- Add one internal CTA to each page that sends visitors to the next best page.
- Refresh titles/descriptions on pages with impressions but low CTR.

## Content backlog for 1,000 new users/month
- 香港レンズ：香港の街角写真と生活メモ
- DJI Miniシリーズ：旅行用ドローンの選び方
- Leica M / SL：旅で使うカメラとレンズ
- 俺流トラベルガジェット：二拠点生活の持ち物
- カッパドキア、チベット、ドイツ、イスタンブール：写真から読む旅の記録
