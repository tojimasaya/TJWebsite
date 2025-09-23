import fs from 'node:fs/promises';
import path from 'node:path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const ROOT = process.cwd();
const writingsPath = path.join(ROOT, 'writings.html');
const outDir = path.join(ROOT, 'data');
const outPath = path.join(outDir, 'writings-og.json');

const html = await fs.readFile(writingsPath, 'utf8');
const $ = cheerio.load(html);

// 1) data-article-url を最優先で収集
const urls = new Set();
$('.article-item[data-article-url]').each((_, el) => {
  const u = $(el).attr('data-article-url');
  if (!u) return;
  if (u.startsWith('#') || u.startsWith('mailto:')) return;
  urls.add(u.trim());
});

// 2) 保険：<h3><a href="..."> からも収集
$('h3 > a[href]').each((_, a) => {
  const u = $(a).attr('href');
  if (!u) return;
  if (u.startsWith('#') || u.startsWith('mailto:')) return;
  urls.add(u.trim());
});

if (!urls.size) {
  console.log('No article URLs found (checked data-article-url and <h3><a>).');
  process.exit(0);
}

await fs.mkdir(outDir, { recursive: true });

// 既存JSONを読み込んで差分だけ更新（無駄コミット防止）
let prev = {};
try { prev = JSON.parse(await fs.readFile(outPath, 'utf8')); } catch (_) {}

const results = { ...prev };
for (const url of urls) {
  try {
    const res = await fetch(url, { redirect: 'follow', timeout: 20000, headers: { 'user-agent': 'Mozilla/5.0 (bot; OGP fetch)' }});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const $p = cheerio.load(text);
    let img =
      $p('meta[property="og:image"]').attr('content') ||
      $p('meta[name="twitter:image"]').attr('content') ||
      $p('img').first().attr('src') || '';
    let title =
      $p('meta[property="og:title"]').attr('content') ||
      $p('title').text().trim() || '';

    if (img && img.startsWith('//')) img = 'https:' + img;

    // 変更がある場合のみ更新
    if (!results[url] || results[url].image !== img || results[url].title !== title) {
      results[url] = { image: img, title };
      console.log('UPDATED', url, '->', img || '(empty)');
    } else {
      console.log('UNCHANGED', url);
    }
  } catch (e) {
    console.log('FAIL', url, e.message);
    results[url] = results[url] || { image: '', title: '' };
  }
}

await fs.writeFile(outPath, JSON.stringify(results, null, 2), 'utf8');
console.log('Wrote', outPath);
