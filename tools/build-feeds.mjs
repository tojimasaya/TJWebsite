// tools/build-feeds.mjs — サイト全体のフィードと更新一覧を生成する（提案 2 / Phase 2）
//
//   node tools/build-feeds.mjs           … 生成して書き込む
//   node tools/build-feeds.mjs --check   … 差分の有無だけ見る（差分があれば exit 2）
//
// 入力: data/recent-photos.json（断章）、assets/images/shirasagi/photos.json（三十六景）、
//       data/articles.json（note / DRONE.jp）、articles/*.html（サイト内記事）
// 出力: feed.xml（Atom 1.0・最新 30 件）、feed-fragments.xml（断章のみ）、feed.json（JSON Feed 1.1）、
//       data/updates.json（トップページの「最近の更新」用・最新 12 件）、rss/index.html（/feed.xml へ）
//
// 生成物は手で編集しない。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SITE_ORIGIN, escapeHtml, paragraphs, truncate, parseDate, isoJst,
  readJson, writeIfChanged,
} from './lib/html.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK_ONLY = process.argv.includes('--check');

const FEED_MAX = 30;
const UPDATES_MAX = 12;
const AUTHOR = { name: '田路昌也 (Toji Masaya)', url: `${SITE_ORIGIN}/about.html`, email: '' };
const SITE_TITLE = 'tojimasaya.com — 田路昌也';
const SITE_SUBTITLE = '姫路と香港、旅とカメラ。白鷺三十六景・断章・香港ハンドブックの更新。';

// 種別（updates.json のチップ表示と並び順に使う）
const KIND = {
  fragment: { label: '断章', order: 1 },
  shirasagi: { label: '三十六景', order: 2 },
  article: { label: '記事', order: 3 },
  note: { label: 'note', order: 4 },
  drone: { label: 'DRONE.jp', order: 5 },
};

function absUrl(p) {
  const s = String(p || '').trim();
  if (!s) return '';
  if (/^(https?:)?\/\//i.test(s)) return s;
  return `${SITE_ORIGIN}${s.startsWith('/') ? s : `/${s}`}`;
}

function sitePath(p) {
  const s = String(p || '').trim();
  if (!s || /^(https?:)?\/\//i.test(s)) return s;
  return s.startsWith('/') ? s : `/${s}`;
}

function attr(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

/* ---------- 収集 ---------- */

async function collectFragments() {
  const list = await readJson(path.join(ROOT, 'data/recent-photos.json'));
  const items = [];
  for (const p of list) {
    const d = parseDate(p.date);
    if (!p.slug || !d) continue; // 日付の無い断章はフィードに載せない（build-fragments.mjs が警告する）
    const url = `${SITE_ORIGIN}/fragments/${p.slug}.html`;
    const image = absUrl(p.image);
    const body = paragraphs(p.body);
    const content = [
      `<p><img src="${escapeHtml(image)}" alt="${escapeHtml(p.alt || p.title || '')}"></p>`,
      body,
      p.place ? `<p>${escapeHtml(p.place)}</p>` : '',
    ].filter(Boolean).join('\n');
    items.push({
      kind: 'fragment',
      id: url,
      url,
      title: p.title,
      date: d.iso,
      summary: truncate(p.body, 110),
      content,
      image,
      thumb: sitePath(p.imageWebp || p.image),
    });
  }
  return items;
}

async function collectShirasagi() {
  const photos = await readJson(path.join(ROOT, 'assets/images/shirasagi/photos.json'));
  const items = [];
  for (const key of Object.keys(photos)) {
    const n = Number(key);
    if (!Number.isInteger(n)) continue;
    const v = photos[key];
    const d = parseDate(v.date);
    if (!d || !v.title) continue;
    const nn = String(n).padStart(2, '0');
    const url = `${SITE_ORIGIN}/shirasagi36/no${nn}.html`;
    const image = `${SITE_ORIGIN}/assets/images/shirasagi/${nn}.jpg`;
    items.push({
      kind: 'shirasagi',
      id: url,
      url,
      title: `第${n}景 ${v.title}`,
      date: d.iso,
      summary: truncate(v.summary || v.story || v.title, 110),
      content: `<p><img src="${escapeHtml(image)}" alt="${escapeHtml(v.title)}"></p>\n${paragraphs(v.summary || '')}`,
      image,
      thumb: `/assets/images/shirasagi/webp/thumb/${nn}.webp`,
    });
  }
  return items;
}

async function collectExternalArticles() {
  const list = await readJson(path.join(ROOT, 'data/articles.json'));
  const items = [];
  for (const a of list) {
    const d = parseDate(a.date);
    if (!d || !a.link || !a.title) continue;
    const kind = a.source === 'drone' ? 'drone' : 'note';
    items.push({
      kind,
      id: a.link,
      url: a.link,
      external: true,
      title: a.title,
      date: d.iso,
      summary: truncate(a.excerpt || '', 110),
      content: `${paragraphs(a.excerpt || '')}\n<p><a href="${escapeHtml(a.link)}">${escapeHtml(a.sourceLabel || kind)} で読む →</a></p>`,
      image: absUrl(a.image),
      thumb: a.image || '',
    });
  }
  return items;
}

async function collectSiteArticles() {
  const dir = path.join(ROOT, 'articles');
  const files = (await fs.readdir(dir).catch(() => [])).filter((f) => f.endsWith('.html'));
  const items = [];
  for (const f of files.sort()) {
    const html = await fs.readFile(path.join(dir, f), 'utf8');
    const title = attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i).replace(/\s*\|\s*Toji Masaya\s*$/, '');
    const description = attr(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
    const image = attr(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i);
    const published = attr(html, /"datePublished"\s*:\s*"([^"]+)"/) || attr(html, /<meta\s+property="article:published_time"\s+content="([^"]*)"/i);
    const modified = attr(html, /"dateModified"\s*:\s*"([^"]+)"/);
    const iso = (modified || published || '').slice(0, 10);
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;
    const url = `${SITE_ORIGIN}/articles/${f}`;
    items.push({
      kind: 'article',
      id: url,
      url,
      title,
      date: iso,
      summary: truncate(description, 110),
      content: `${paragraphs(description)}\n<p><a href="${escapeHtml(url)}">続きを読む →</a></p>`,
      image: absUrl(image),
      thumb: sitePath(image.replace(SITE_ORIGIN, '')),
    });
  }
  return items;
}

/* ---------- 出力 ---------- */

function atom(items, { id, title, subtitle, selfPath, updated }) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push('<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ja">');
  lines.push(`  <title>${escapeHtml(title)}</title>`);
  if (subtitle) lines.push(`  <subtitle>${escapeHtml(subtitle)}</subtitle>`);
  lines.push(`  <id>${escapeHtml(id)}</id>`);
  lines.push(`  <link rel="alternate" type="text/html" href="${SITE_ORIGIN}/"/>`);
  lines.push(`  <link rel="self" type="application/atom+xml" href="${SITE_ORIGIN}${selfPath}"/>`);
  lines.push(`  <updated>${updated}</updated>`);
  lines.push('  <author>');
  lines.push(`    <name>${escapeHtml(AUTHOR.name)}</name>`);
  lines.push(`    <uri>${AUTHOR.url}</uri>`);
  lines.push('  </author>');
  lines.push('  <rights>© Toji Masaya</rights>');
  lines.push('  <generator uri="https://tojimasaya.com/">tools/build-feeds.mjs</generator>');
  for (const it of items) {
    const updatedAt = isoJst(it.date);
    lines.push('  <entry>');
    lines.push(`    <title>${escapeHtml(it.title)}</title>`);
    lines.push(`    <id>${escapeHtml(it.id)}</id>`);
    lines.push(`    <link rel="alternate" type="text/html" href="${escapeHtml(it.url)}"/>`);
    lines.push(`    <published>${updatedAt}</published>`);
    lines.push(`    <updated>${updatedAt}</updated>`);
    lines.push(`    <category term="${escapeHtml(KIND[it.kind].label)}"/>`);
    if (it.summary) lines.push(`    <summary type="text">${escapeHtml(it.summary)}</summary>`);
    if (it.content) lines.push(`    <content type="html">${escapeHtml(it.content)}</content>`);
    lines.push('  </entry>');
  }
  lines.push('</feed>');
  return lines.join('\n') + '\n';
}

function jsonFeed(items, updated) {
  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title: SITE_TITLE,
    description: SITE_SUBTITLE,
    home_page_url: `${SITE_ORIGIN}/`,
    feed_url: `${SITE_ORIGIN}/feed.json`,
    language: 'ja',
    authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
    items: items.map((it) => ({
      id: it.id,
      url: it.url,
      title: it.title,
      content_html: it.content || '',
      summary: it.summary || '',
      image: it.image || undefined,
      date_published: isoJst(it.date),
      tags: [KIND[it.kind].label],
    })),
  }, null, 2) + '\n';
}

function updatesJson(items, generatedAt) {
  return JSON.stringify({
    generatedAt,
    count: items.length,
    feeds: { atom: '/feed.xml', json: '/feed.json', fragments: '/feed-fragments.xml' },
    items: items.map((it) => ({
      kind: it.kind,
      kindLabel: KIND[it.kind].label,
      title: it.title,
      url: it.external ? it.url : it.url.replace(SITE_ORIGIN, ''),
      external: Boolean(it.external),
      date: it.date,
      thumb: it.thumb || null,
    })),
  }, null, 2) + '\n';
}

function rssRedirect() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="robots" content="noindex, follow">
<meta http-equiv="refresh" content="0; url=/feed.xml">
<link rel="canonical" href="https://tojimasaya.com/feed.xml">
<title>フィード | Toji Masaya</title>
<meta name="description" content="tojimasaya.com の更新フィード（Atom）へ移動します。">
</head>
<body>
<p><a href="/feed.xml">更新フィード（Atom）へ</a> — <a href="/feed.json">JSON Feed</a></p>
<script>window.location.replace('/feed.xml');</script>
<script src="/growth.js" defer></script>
</body>
</html>
`;
}

/* ---------- main ---------- */

async function main() {
  const all = [
    ...await collectFragments(),
    ...await collectShirasagi(),
    ...await collectExternalArticles(),
    ...await collectSiteArticles(),
  ].sort((a, b) => b.date.localeCompare(a.date) || KIND[a.kind].order - KIND[b.kind].order || a.title.localeCompare(b.title, 'ja'));

  if (!all.length) throw new Error('フィードに載せる項目がありません');

  const fragments = all.filter((it) => it.kind === 'fragment');
  const newest = all[0].date;
  const updated = isoJst(newest);

  const written = [];
  const stripVolatile = (s) => String(s ?? '').replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g, '');
  const out = async (rel, content) => {
    const cur = await fs.readFile(path.join(ROOT, rel), 'utf8').catch(() => null);
    if (cur !== null && stripVolatile(cur) === stripVolatile(content)) return;
    written.push(rel);
    if (!CHECK_ONLY) await writeIfChanged(path.join(ROOT, rel), content);
  };

  await out('feed.xml', atom(all.slice(0, FEED_MAX), {
    id: `${SITE_ORIGIN}/`, title: SITE_TITLE, subtitle: SITE_SUBTITLE, selfPath: '/feed.xml', updated,
  }));
  await out('feed-fragments.xml', atom(fragments.slice(0, FEED_MAX), {
    id: `${SITE_ORIGIN}/fragments.html`,
    title: '断章 — tojimasaya.com',
    subtitle: '写真を入口に、その日の出来事を一文で残す。',
    selfPath: '/feed-fragments.xml',
    updated: isoJst(fragments.length ? fragments[0].date : newest),
  }));
  await out('feed.json', jsonFeed(all.slice(0, FEED_MAX), updated));
  await out('data/updates.json', updatesJson(all.slice(0, UPDATES_MAX), updated));
  await out('rss/index.html', rssRedirect());

  const byKind = {};
  for (const it of all) byKind[it.kind] = (byKind[it.kind] || 0) + 1;
  console.log(`${CHECK_ONLY ? '[check] ' : ''}フィード対象: ${all.length} 件（${Object.entries(byKind).map(([k, n]) => `${KIND[k].label} ${n}`).join(' / ')}）`);
  console.log(`最新: ${all[0].date} ${all[0].title}`);
  console.log(`${CHECK_ONLY ? '差分のあるファイル' : '書き込んだファイル'}: ${written.length}`);
  for (const f of written) console.log('  - ' + f);
  const kindsInUpdates = new Set(all.slice(0, UPDATES_MAX).map((it) => it.kind));
  console.log(`updates.json の種別: ${[...kindsInUpdates].map((k) => KIND[k].label).join(' / ')}`);
  if (CHECK_ONLY && written.length) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
