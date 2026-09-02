// tools/build-fragments.mjs — 断章の個別ページを生成する（提案 2 / Phase 2）
//
//   node tools/build-fragments.mjs           … 生成して書き込む
//   node tools/build-fragments.mjs --check   … 差分の有無だけ見る（差分があれば exit 2）
//   node tools/build-fragments.mjs --dims    … 生成に加えて recent-photos.json に width/height を書き足す
//
// 入力: data/recent-photos.json（新しい順）、tools/templates/fragment.html
// 出力: fragments/{slug}.html、fragments/index.html（/fragments.html へリダイレクト）、
//       sitemap.xml のマーカー区間 <!-- fragments:auto:start -->…<!-- fragments:auto:end -->
//
// 生成物は手で編集しない。文言と構造はテンプレート、ロジックはここ。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SITE_ORIGIN, escapeHtml, paragraphs, truncate, parseDate, isoJst, nowIso, todayIso,
  formatDate, renderTemplate, replaceMarkerBlock, imageSize, readJson, writeIfChanged, fileExists,
} from './lib/html.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = 'fragments';
const SOURCE = 'data/recent-photos.json';
const CHECK_ONLY = process.argv.includes('--check');
// --dims: data/recent-photos.json の各写真に width / height を書き足す（トップの断章ブロックが
// 実寸比を使ってレターボックス（黒帯）を出さないために使う）。写真を足したときだけ実行すればよい。
const WRITE_DIMS = process.argv.includes('--dims');

const AUTHOR = { name: '田路昌也 (Toji Masaya)', url: `${SITE_ORIGIN}/about.html` };

/* ---------- 小さなヘルパー ---------- */

function absPath(p) {
  const s = String(p || '').trim();
  if (!s) return '';
  if (/^(https?:)?\/\//i.test(s)) return s;
  return s.startsWith('/') ? s : `/${s}`;
}

function absUrl(p) {
  const s = absPath(p);
  return /^(https?:)?\/\//i.test(s) ? s : `${SITE_ORIGIN}${s}`;
}

function pagePath(slug) {
  return `/${OUT_DIR}/${slug}.html`;
}

function pageUrl(slug) {
  return `${SITE_ORIGIN}${pagePath(slug)}`;
}

/** 断章のリンク（link フィールド）はサイト内相対のことがある。ページは /fragments/ 配下なので絶対化する。 */
function resolveLink(href) {
  const s = String(href || '').trim();
  if (!s) return '';
  if (/^(https?:|mailto:|tel:|#)/i.test(s) || s.startsWith('//')) return s;
  return s.startsWith('/') ? s : `/${s}`;
}

/* ---------- 各パーツの HTML ---------- */

function figureHtml(item, sizes) {
  const src = absPath(item.image);
  const webp = absPath(item.imageWebp);
  const alt = item.alt || item.title || '';
  const caption = item.caption || '';
  const dim = sizes ? ` width="${sizes.width}" height="${sizes.height}"` : '';
  const lines = [];
  lines.push('    <figure class="fp-figure">');
  lines.push('      <picture>');
  if (webp) lines.push(`        <source srcset="${escapeHtml(webp)}" type="image/webp">`);
  lines.push(`        <img src="${escapeHtml(src)}"${dim} alt="${escapeHtml(alt)}" decoding="async" fetchpriority="high">`);
  lines.push('      </picture>');
  if (caption) lines.push(`      <figcaption>${escapeHtml(caption)}</figcaption>`);
  lines.push('    </figure>');
  return lines.join('\n');
}

function sidesHtml(sides) {
  if (!sides.length) return '';
  const lines = ['    <div class="fp-sides">'];
  for (const sf of sides) {
    const src = absPath(sf.image);
    const webp = absPath(sf.imageWebp);
    const alt = sf.alt || sf.title || '';
    const caption = sf.title || sf.caption || '';
    lines.push('      <figure>');
    lines.push('        <picture>');
    if (webp) lines.push(`          <source srcset="${escapeHtml(webp)}" type="image/webp">`);
    lines.push(`          <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`);
    lines.push('        </picture>');
    if (caption) lines.push(`        <figcaption>${escapeHtml(caption)}</figcaption>`);
    lines.push('      </figure>');
  }
  lines.push('    </div>');
  return lines.join('\n');
}

function linkHtml(item) {
  const href = resolveLink(item.link);
  const label = item.linkLabel || '関連ページ';
  if (!href) return '';
  const external = /^https?:/i.test(href);
  const attrs = external ? ' target="_blank" rel="noopener"' : '';
  return `    <p class="fp-related"><a href="${escapeHtml(href)}"${attrs} data-growth-label="fragment_related">関連: ${escapeHtml(label)} →</a></p>`;
}

function neighbourHtml(item, dir) {
  const isNext = dir === 'next';
  const dirLabel = isNext ? '新しい断章' : '古い断章';
  if (!item) {
    return `      <div class="fp-pn__empty">${isNext ? 'これが最新の断章です' : 'これが最初の断章です'}</div>`;
  }
  const thumb = absPath(item.imageWebp || item.image);
  const cls = isNext ? 'is-next' : 'is-prev';
  const img = thumb
    ? `<img class="fp-pn__thumb" src="${escapeHtml(thumb)}" alt="" loading="lazy" decoding="async">`
    : '<span class="fp-pn__thumb" aria-hidden="true"></span>';
  return [
    `      <a class="${cls}" href="${escapeHtml(pagePath(item.slug))}" data-growth-label="fragment_${dir}">`,
    `        ${img}`,
    '        <span>',
    `          <span class="fp-pn__dir">${dirLabel}</span>`,
    `          <span class="fp-pn__title">${escapeHtml(item.title || '')}</span>`,
    '        </span>',
    '      </a>',
  ].join('\n');
}

function jsonLd(entry, buildIso) {
  const images = [absUrl(entry.item.image), ...(entry.sides.map((s) => absUrl(s.image)))].filter(Boolean);
  const post = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: entry.item.title,
    description: entry.description,
    image: images,
    url: pageUrl(entry.item.slug),
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl(entry.item.slug) },
    author: { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url },
    publisher: { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url },
    inLanguage: 'ja',
    isPartOf: { '@type': 'Blog', name: '断章', url: `${SITE_ORIGIN}/fragments.html` },
    articleSection: '断章',
  };
  if (entry.dateIso) { post.datePublished = entry.dateIso; post.dateModified = entry.dateIso; }
  else post.dateModified = buildIso;
  if (entry.item.place) post.contentLocation = { '@type': 'Place', name: entry.item.place };

  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: '断章', item: `${SITE_ORIGIN}/fragments.html` },
      { '@type': 'ListItem', position: 3, name: entry.item.title, item: pageUrl(entry.item.slug) },
    ],
  };
  return JSON.stringify([post, crumbs], null, 2);
}

function buildPage(entry, prev, next, template, buildIso) {
  const item = entry.item;
  const media = [figureHtml(item, entry.sizes), sidesHtml(entry.sides)].filter(Boolean).join('\n');
  const preload = absPath(item.imageWebp || item.image);
  const data = {
    pageTitle: `${item.title} — 断章 | Toji Masaya`,
    ogTitle: `${item.title} — 断章`,
    description: entry.description,
    canonical: pageUrl(item.slug),
    crumbTitle: truncate(item.title, 24),
    title: item.title,
    shareTitle: `${item.title} — 断章 | Toji Masaya`,
    pageId: pagePath(item.slug),
    place: item.place || '',
    dateDisplay: entry.dateIso ? formatDate(item.date, 'hk') : '',
    dateIsoDay: entry.dateIso || '',
    dateIso: entry.dateIso ? isoJst(item.date) : '',
    buildIso,
    buildYear: new Date().getFullYear(),
    alt: item.alt || item.title || '',
    ogImage: absUrl(item.image),
    ogImageWidth: entry.sizes ? entry.sizes.width : '',
    ogImageHeight: entry.sizes ? entry.sizes.height : '',
    preloadImage: preload,
    preloadType: preload.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
    mediaHtml: media,
    bodyHtml: paragraphs(item.body, 'fp-body__p').replace(/^/gm, '      '),
    linkHtml: linkHtml(item),
    prevHtml: neighbourHtml(prev, 'prev'),
    nextHtml: neighbourHtml(next, 'next'),
    jsonLd: jsonLd(entry, buildIso),
  };
  return renderTemplate(template, data);
}

function redirectIndex() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="robots" content="noindex, follow">
<meta http-equiv="refresh" content="0; url=/fragments.html">
<link rel="canonical" href="https://tojimasaya.com/fragments.html">
<title>断章 | Toji Masaya</title>
<meta name="description" content="断章の一覧ページへ移動します。">
</head>
<body>
<p><a href="/fragments.html">断章の一覧へ</a></p>
<script src="/growth.js" defer></script>
</body>
</html>
`;
}

function sitemapBlock(entries, lastmod) {
  const lines = ['  <!-- 断章の個別ページ（tools/build-fragments.mjs が生成。手で編集しない） -->'];
  for (const e of entries) {
    lines.push('  <url>');
    lines.push(`    <loc>${pageUrl(e.item.slug)}</loc>`);
    lines.push(`    <lastmod>${e.dateIso || lastmod}</lastmod>`);
    lines.push('    <changefreq>monthly</changefreq>');
    lines.push('    <priority>0.7</priority>');
    lines.push('    <image:image>');
    lines.push(`      <image:loc>${absUrl(e.item.image)}</image:loc>`);
    lines.push(`      <image:title>${escapeHtml(e.item.title)}</image:title>`);
    if (e.item.alt) lines.push(`      <image:caption>${escapeHtml(e.item.alt)}</image:caption>`);
    lines.push('    </image:image>');
    lines.push('  </url>');
  }
  return lines.join('\n');
}

/* ---------- main ---------- */

async function main() {
  const buildIso = nowIso();
  const today = todayIso();
  const list = await readJson(path.join(ROOT, SOURCE));
  if (!Array.isArray(list) || !list.length) throw new Error(`${SOURCE} に断章がありません`);
  const template = await fs.readFile(path.join(ROOT, 'tools/templates/fragment.html'), 'utf8');

  const problems = [];
  const warnings = [];
  const seen = new Set();
  const entries = [];

  for (const [i, item] of list.entries()) {
    const where = `#${i + 1} ${item.slug || item.title || '(無題)'}`;
    if (!item.slug) { problems.push(`${where}: slug がありません`); continue; }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(item.slug)) { problems.push(`${where}: slug は英小文字・数字・ハイフンだけにしてください`); continue; }
    if (seen.has(item.slug)) { problems.push(`${where}: slug が重複しています`); continue; }
    seen.add(item.slug);
    if (!item.title) { problems.push(`${where}: title が空です`); continue; }
    if (!item.body) { problems.push(`${where}: body が空です`); continue; }
    if (!item.image) { problems.push(`${where}: image がありません`); continue; }

    const files = [item.image, item.imageWebp, ...(item.sideFrames || []).flatMap((s) => [s && s.image, s && s.imageWebp])].filter(Boolean);
    let missing = false;
    for (const f of files) {
      if (!await fileExists(path.join(ROOT, f))) { problems.push(`${where}: 画像がありません ${f}`); missing = true; }
    }
    if (missing) continue;

    const parsed = parseDate(item.date);
    if (!parsed) warnings.push(`${where}: date "${item.date || ''}" を解釈できません（例: 2026年5月7日）。日付なしのページを作り、フィードには載せません`);

    entries.push({
      item,
      dateIso: parsed ? parsed.iso : null,
      description: truncate(item.body, 110),
      sides: (item.sideFrames || []).filter((s) => s && s.image),
      sizes: await imageSize(path.join(ROOT, item.image)),
    });
  }

  if (problems.length) {
    console.error(`${SOURCE} に問題があります:`);
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }

  // 新しい順。日付が無いものは末尾に置き、JSON の並び順を保つ。
  const ordered = [...entries].sort((a, b) => {
    if (a.dateIso && b.dateIso) return b.dateIso.localeCompare(a.dateIso);
    if (a.dateIso) return -1;
    if (b.dateIso) return 1;
    return 0;
  });

  // --dims: 各写真の実寸を JSON に書き足す
  if (WRITE_DIMS) {
    let touched = 0;
    for (const item of list) {
      for (const media of [item, ...(item.sideFrames || [])]) {
        if (!media || !media.image) continue;
        const size = await imageSize(path.join(ROOT, media.image));
        if (!size) { console.warn(`注意: ${media.image} の寸法を読めません`); continue; }
        if (media.width !== size.width || media.height !== size.height) {
          media.width = size.width;
          media.height = size.height;
          touched += 1;
        }
      }
    }
    if (touched && !CHECK_ONLY) {
      await writeIfChanged(path.join(ROOT, SOURCE), JSON.stringify(list, null, 2) + '\n');
    }
    console.log(`--dims: 寸法を書き足した写真 ${touched} 枚`);
  }

  const written = [];
  const stripVolatile = (s) => String(s ?? '').replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g, '');
  const out = async (rel, content) => {
    const cur = await fs.readFile(path.join(ROOT, rel), 'utf8').catch(() => null);
    if (cur !== null && stripVolatile(cur) === stripVolatile(content)) return;
    written.push(rel);
    if (!CHECK_ONLY) await writeIfChanged(path.join(ROOT, rel), content);
  };

  // 1) 個別ページ（prev = ひとつ古い / next = ひとつ新しい）
  for (const [i, entry] of ordered.entries()) {
    const next = i > 0 ? ordered[i - 1].item : null;
    const prev = i < ordered.length - 1 ? ordered[i + 1].item : null;
    await out(`${OUT_DIR}/${entry.item.slug}.html`, buildPage(entry, prev, next, template, buildIso));
  }

  // 2) ディレクトリ直打ち → 一覧へ
  await out(`${OUT_DIR}/index.html`, redirectIndex());

  // 3) sitemap.xml のマーカー区間
  let sitemap = await fs.readFile(path.join(ROOT, 'sitemap.xml'), 'utf8');
  if (!/xmlns:image=/.test(sitemap)) {
    sitemap = sitemap.replace(/<urlset([^>]*)>/, (m, attrs) => `<urlset${attrs.replace(/\s*$/, '')}\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`);
  }
  sitemap = replaceMarkerBlock(sitemap, 'fragments:auto', sitemapBlock(ordered, today), '</urlset>');
  await out('sitemap.xml', sitemap);

  // 4) JSON から消えた slug の古いページを検出 — 消さずに報告だけ
  const existing = (await fs.readdir(path.join(ROOT, OUT_DIR)).catch(() => []))
    .filter((f) => f.endsWith('.html') && f !== 'index.html');
  const expected = new Set(ordered.map((e) => `${e.item.slug}.html`));
  const stale = existing.filter((f) => !expected.has(f));

  console.log(`${CHECK_ONLY ? '[check] ' : ''}断章: ${ordered.length} 篇`);
  console.log(`${CHECK_ONLY ? '差分のあるファイル' : '書き込んだファイル'}: ${written.length}`);
  for (const f of written) console.log('  - ' + f);
  for (const w of warnings) console.warn('注意: ' + w);
  if (stale.length) console.warn(`JSON に無い断章のページがあります（必要なら手で削除）: ${stale.join(', ')}`);
  if (CHECK_ONLY && written.length) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
