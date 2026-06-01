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

## Review guidelines
- Treat broken internal links, missing metadata on new public pages, malformed HTML, and JavaScript errors as high-priority issues.
- Check that new landing pages are linked from at least one existing page and included in `sitemap.xml`.
- Verify that changes do not depend on unavailable local build tools.
- Flag privacy issues if new scripts collect user data beyond click/page events delegated to existing analytics tools.
