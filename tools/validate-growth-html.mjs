// tools/validate-growth-html.mjs — 公開 HTML の検査（リンク切れ・メタ・growth.js・sitemap 網羅・hreflang 相互参照・ローカル資産）
// 使い方: node tools/validate-growth-html.mjs      （問題があれば exit code 1）
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SITE_ORIGIN = 'https://tojimasaya.com';
// tools/（テンプレート）と一時フォルダは公開 HTML ではないので走査しない
const SKIP_DIRS = new Set(['.git', '.claude', 'node_modules', 'tools', '_staging', 'docs']);
const REQUIRED_SITEMAP_PATHS = [
  'articles/drone-travel-guide.html',
  'articles/leica-m2-travel.html',
  'articles/hong-kong-two-base-life.html',
];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...await walk(path.join(dir, entry.name)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(path.join(dir, entry.name));
  }
  return files;
}

function getAttributes(source) {
  const attrs = {};
  const pattern = /([a-zA-Z_:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  for (const match of source.matchAll(pattern)) attrs[match[1].toLowerCase()] = match[3] ?? match[4] ?? '';
  return attrs;
}

function stripHashAndQuery(href) {
  return href.split('#')[0].split('?')[0];
}

function isSkippedHref(href) {
  return !href
    || href.startsWith('#')
    || href.startsWith('mailto:')
    || href.startsWith('tel:')
    || href.startsWith('javascript:')
    || href.startsWith('data:')
    || href.includes('${') // JS テンプレートリテラル内の href
    || /['"+]/.test(href) // JS 文字列連結の断片
    || /^(https?:)?\/\//i.test(href);
}

async function fileExists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

function resolveLocal(file, ref) {
  const clean = stripHashAndQuery(ref);
  return clean.startsWith('/') ? path.join(ROOT, clean) : path.join(path.dirname(file), clean);
}

function tagAttrs(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))].map((m) => getAttributes(m[0]));
}

function pageData(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1].trim() ?? '';
  const metas = tagAttrs(html, 'meta');
  const links = tagAttrs(html, 'link');
  const descriptionTags = metas.filter((a) => a.name?.toLowerCase() === 'description').map((a) => a.content?.trim() ?? '').filter(Boolean);
  const isRedirect = metas.some((a) => a['http-equiv']?.toLowerCase() === 'refresh');
  const isNoindex = metas.some((a) => a.name?.toLowerCase() === 'robots' && /noindex/i.test(a.content || ''));
  const canonical = links.find((a) => a.rel?.toLowerCase() === 'canonical')?.href ?? '';
  const hreflangs = links.filter((a) => a.rel?.toLowerCase() === 'alternate' && a.hreflang).map((a) => ({ lang: a.hreflang, href: a.href }));
  const ogImage = metas.find((a) => a.property?.toLowerCase() === 'og:image')?.content ?? '';
  const feedLinks = links.filter((a) => a.rel?.toLowerCase() === 'alternate' && /atom\+xml|rss\+xml|feed\+json/i.test(a.type || '')).map((a) => a.href).filter(Boolean);
  const scriptSources = tagAttrs(html, 'script').map((a) => a.src).filter(Boolean);
  const anchors = tagAttrs(html, 'a').map((a) => a.href).filter(Boolean);
  const assets = [
    ...tagAttrs(html, 'img').map((a) => a.src),
    ...tagAttrs(html, 'source').map((a) => a.srcset),
    ...scriptSources,
    ...links.filter((a) => /stylesheet|icon|preload|apple-touch-icon/i.test(a.rel || '')).map((a) => a.href),
  ].filter(Boolean);
  return { title, descriptionTags, isRedirect, isNoindex, canonical, hreflangs, ogImage, feedLinks, scriptSources, anchors, assets };
}

function relative(file) {
  return path.relative(ROOT, file) || '.';
}

const htmlFiles = (await walk(ROOT)).sort();
const sitemap = await fs.readFile(path.join(ROOT, 'sitemap.xml'), 'utf8').catch(() => '');
const sitemapLocs = new Set([...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]));

const results = {
  missingTitle: [],
  missingDescription: [],
  growthMissing: [],
  growthDuplicate: [],
  brokenInternalHtmlLinks: [],
  brokenLocalAssets: [],
  articleSitemapMissing: [],
  sitemapMissingPublicPages: [],
  sitemapLocsWithoutFile: [],
  hreflangProblems: [],
  feedLinkProblems: [],
};

const pages = new Map(); // relative path -> data

for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  const data = pageData(html);
  const rel = relative(file);
  pages.set(rel, data);

  if (!data.title) results.missingTitle.push(rel);
  if (data.descriptionTags.length === 0) results.missingDescription.push(rel);

  const growthCount = data.scriptSources.filter((src) => src === '/growth.js' || src === 'growth.js' || src.endsWith('/growth.js')).length;
  if (growthCount === 0) results.growthMissing.push(rel);
  if (growthCount > 1) results.growthDuplicate.push(rel);

  for (const href of data.anchors) {
    if (isSkippedHref(href)) continue;
    const cleanHref = stripHashAndQuery(href);
    if (!cleanHref.endsWith('.html')) continue;
    if (!await fileExists(resolveLocal(file, href))) results.brokenInternalHtmlLinks.push(`${rel} -> ${href}`);
  }

  for (const ref of data.assets) {
    if (isSkippedHref(ref)) continue;
    // srcset は "a.webp 1x, b.webp 2x" の形も許す
    for (const candidate of ref.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean)) {
      if (isSkippedHref(candidate)) continue;
      if (!await fileExists(resolveLocal(file, candidate))) results.brokenLocalAssets.push(`${rel} -> ${candidate}`);
    }
  }

  // フィードの rel=alternate: 指す先が実在すること
  for (const href of data.feedLinks) {
    if (isSkippedHref(href)) continue;
    if (!await fileExists(resolveLocal(file, href))) results.feedLinkProblems.push(`${rel} -> ${href}`);
  }

  // sitemap 網羅: リダイレクト・noindex 以外の公開ページは sitemap に載っていること
  if (!data.isRedirect && !data.isNoindex) {
    const url = rel === 'index.html' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/${rel.split(path.sep).join('/')}`;
    const inSitemap = sitemapLocs.has(url) || (rel === 'index.html' && sitemapLocs.has(`${SITE_ORIGIN}/index.html`));
    if (!inSitemap) results.sitemapMissingPublicPages.push(rel);
  }
}

// sitemap 側: 載っている URL のファイルが実在すること
for (const loc of sitemapLocs) {
  if (!loc.startsWith(SITE_ORIGIN + '/')) continue;
  const p = loc.slice(SITE_ORIGIN.length + 1);
  const file = p === '' ? path.join(ROOT, 'index.html') : path.join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
  if (!await fileExists(file)) results.sitemapLocsWithoutFile.push(loc);
}

// hreflang 相互参照: 各 alternate の先が実在し、その先も自分（canonical）を alternate に持つこと
for (const [rel, data] of pages) {
  if (!data.hreflangs.length) continue;
  if (!data.canonical) { results.hreflangProblems.push(`${rel}: hreflang があるのに canonical が無い`); continue; }
  const self = data.hreflangs.find((h) => h.href === data.canonical);
  if (!self) results.hreflangProblems.push(`${rel}: 自分自身（canonical）が hreflang に含まれていない`);
  for (const h of data.hreflangs) {
    if (!h.href.startsWith(SITE_ORIGIN + '/')) { results.hreflangProblems.push(`${rel}: hreflang=${h.lang} が外部 URL ${h.href}`); continue; }
    const targetRel = h.href.slice(SITE_ORIGIN.length + 1) || 'index.html';
    const target = pages.get(targetRel);
    if (!target) { results.hreflangProblems.push(`${rel}: hreflang=${h.lang} の先 ${targetRel} が無い`); continue; }
    if (targetRel !== rel && !target.hreflangs.some((t) => t.href === data.canonical)) {
      results.hreflangProblems.push(`${rel}: ${targetRel} から自分への hreflang が無い（相互参照切れ）`);
    }
  }
}

for (const requiredPath of REQUIRED_SITEMAP_PATHS) {
  if (!sitemap.includes(requiredPath)) results.articleSitemapMissing.push(requiredPath);
}

console.log(`HTML files checked: ${htmlFiles.length}`);
console.log(`sitemap URLs: ${sitemapLocs.size}`);

let issueCount = 0;
for (const [key, items] of Object.entries(results)) {
  issueCount += items.length;
  console.log(`${key}: ${items.length}`);
  for (const item of items) console.log(`  - ${item}`);
}

if (issueCount > 0) process.exitCode = 1;
