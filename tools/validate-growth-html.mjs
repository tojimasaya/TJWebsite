// tools/validate-growth-html.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['.git', '.claude', 'node_modules']);
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

    if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(path.join(dir, entry.name));
    }
  }

  return files;
}

function getAttributes(source) {
  const attrs = {};
  const pattern = /([a-zA-Z_:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  for (const match of source.matchAll(pattern)) {
    attrs[match[1].toLowerCase()] = match[3] ?? match[4] ?? '';
  }
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
    || /^https?:\/\//i.test(href);
}

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function pageData(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1].trim() ?? '';
  const descriptionTags = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => getAttributes(match[0]))
    .filter((attrs) => attrs.name?.toLowerCase() === 'description')
    .map((attrs) => attrs.content?.trim() ?? '')
    .filter(Boolean);
  const scriptSources = [...html.matchAll(/<script\b[^>]*>/gi)]
    .map((match) => getAttributes(match[0]).src)
    .filter(Boolean);
  const links = [...html.matchAll(/<a\b[^>]*>/gi)]
    .map((match) => getAttributes(match[0]).href)
    .filter(Boolean);

  return { title, descriptionTags, scriptSources, links };
}

function relative(file) {
  return path.relative(ROOT, file) || '.';
}

const htmlFiles = (await walk(ROOT)).sort();
const sitemap = await fs.readFile(path.join(ROOT, 'sitemap.xml'), 'utf8').catch(() => '');

const results = {
  missingTitle: [],
  missingDescription: [],
  growthMissing: [],
  growthDuplicate: [],
  brokenInternalHtmlLinks: [],
  articleSitemapMissing: [],
};

for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  const data = pageData(html);

  if (!data.title) results.missingTitle.push(relative(file));
  if (data.descriptionTags.length === 0) results.missingDescription.push(relative(file));

  const growthCount = data.scriptSources.filter((src) => (
    src === '/growth.js' || src === 'growth.js' || src.endsWith('/growth.js')
  )).length;

  if (growthCount === 0) results.growthMissing.push(relative(file));
  if (growthCount > 1) results.growthDuplicate.push(relative(file));

  for (const href of data.links) {
    if (isSkippedHref(href)) continue;

    const cleanHref = stripHashAndQuery(href);
    if (!cleanHref.endsWith('.html')) continue;

    const target = cleanHref.startsWith('/')
      ? path.join(ROOT, cleanHref)
      : path.join(path.dirname(file), cleanHref);

    if (!await fileExists(target)) {
      results.brokenInternalHtmlLinks.push(`${relative(file)} -> ${href}`);
    }
  }
}

for (const requiredPath of REQUIRED_SITEMAP_PATHS) {
  if (!sitemap.includes(requiredPath)) {
    results.articleSitemapMissing.push(requiredPath);
  }
}

console.log(`HTML files checked: ${htmlFiles.length}`);

let issueCount = 0;
for (const [key, items] of Object.entries(results)) {
  issueCount += items.length;
  console.log(`${key}: ${items.length}`);
  for (const item of items) {
    console.log(`  - ${item}`);
  }
}

if (issueCount > 0) {
  process.exitCode = 1;
}
