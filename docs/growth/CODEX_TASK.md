# Codex task prompt for tojimasaya.com

Copy the prompt below into Codex with the repository connected.

---

You are working on the static site repository for `tojimasaya.com`.

Goal: improve the site toward 1,000 new visitors per month. Make small, high-confidence changes that increase organic discovery, first-visit navigation, internal linking, and measurement.

Implement the following:

1. Add three evergreen on-site guide articles under `articles/`:
   - `articles/drone-travel-guide.html`
   - `articles/leica-m2-travel.html`
   - `articles/hong-kong-two-base-life.html`

2. Add a `Featured Guides` section to `index.html` linking to those three guides. Each card should explain why the guide is useful for first-time visitors.

3. Add a `Site Guides` section to `writings.html` above the external note / DRONE.jp sections, linking to the same three guide pages.

4. Improve SEO basics across public HTML pages:
   - page-specific `<title>`
   - page-specific meta description
   - canonical URL
   - Open Graph / Twitter metadata where missing
   - JSON-LD for new article pages
   - breadcrumb JSON-LD on new article pages

5. Add `sitemap.xml` and `robots.txt`. Include all main pages and the three new article URLs.

6. Add `growth.js` and load it on all public HTML pages. It must not make network requests by itself. It should only forward these events when GA4 `gtag`, GTM `dataLayer`, or Plausible already exists:
   - `tjm_page_view`
   - `tjm_internal_cta_click`
   - `tjm_outbound_click`

7. Update `style.css` only as needed for the new guide cards and article pages. Keep the visual system consistent with the existing site.

Constraints:
- Do not introduce Node, bundlers, frameworks, or package dependencies.
- Preserve existing `assets/` and `data/` files.
- Preserve existing external links unless broken.
- Keep all public-facing copy in Japanese.
- Avoid aggressive SEO language; keep the tone personal and editorial.

Acceptance checks:
- All new article pages open as static HTML.
- `index.html` and `writings.html` link to all three new guides.
- `sitemap.xml` includes all three new article pages.
- Every public HTML page loads `/growth.js` once.
- No internal `.html` link points to a missing file.
- No obvious malformed HTML such as nested `<p>` tags in the intro section.
- Prepare a short PR summary and testing checklist.

Suggested branch name: `growth/site-guides-seo-tracking`
Suggested PR title: `Add growth-focused site guides and SEO tracking`

---
