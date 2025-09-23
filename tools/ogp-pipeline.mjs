// tools/ogp-pipeline.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const WRITINGS_HTML = path.join(ROOT, 'writings.html');      // 既存のページからURLを拾う
const JSON_OUT = path.join(ROOT, 'data', 'writings-og.json'); // 出力先
const OG_DIR = path.join(ROOT, 'assets', 'og');               // 画像保存先
const NOTE_RSS = 'https://note.com/tojimasaya/rss';           // noteのRSSも併用

await fs.mkdir(path.dirname(JSON_OUT), { recursive: true });
await fs.mkdir(OG_DIR, { recursive: true });

const UA = 'Mozilla/5.0 (compatible; OGP-fetcher/1.0; +https://tojimasaya.com/)';

// ------- 1) URL収集（writings.htmlの data-article-url / note RSS） -------
const urls = new Set();

// writings.html から
try {
  const html = await fs.readFile(WRITINGS_HTML, 'utf8');
  const $ = cheerio.load(html);
  $('.article-item[data-article-url]').each((_i, el) => {
    const u = ($(el).attr('data-article-url') || '').trim();
    if (/^https?:\/\//i.test(u)) urls.add(u);
  });
} catch (e) {
  console.log('WARN: writings.html 読み込みに失敗:', e.message);
}

// note RSS から（最大12件）
try {
  const res = await fetch(NOTE_RSS, { headers: { 'user-agent': UA } });
  if (res.ok) {
    const text = await res.text();
    const $ = cheerio.load(text, { xmlMode: true });
    $('item > link').slice(0, 12).each((_i, el) => {
      const u = ($(el).text() || '').trim();
      if (/^https?:\/\//i.test(u)) urls.add(u);
    });
  } else {
    console.log('WARN: note RSS取得失敗', res.status);
  }
} catch (e) {
  console.log('WARN: note RSS取得エラー:', e.message);
}

if (urls.size === 0) {
  console.log('No article URLs found. 終了');
  process.exit(0);
}

// 既存JSONを読み込み（差分更新）
let map = {};
try { map = JSON.parse(await fs.readFile(JSON_OUT, 'utf8')); } catch {}

// ------- 2) 各URLから OGP(title, image) を取得 -------
async function getOG(url) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'ja,en;q=0.8' }, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    let image = $('meta[property="og:image"]').attr('content') || '';
    // 絶対URL化
    if (image && !/^https?:\/\//i.test(image)) {
      const u = new URL(url);
      image = new URL(image, `${u.protocol}//${u.host}`).toString();
    }
    return { title: title.trim(), image: image.trim() };
  } catch (e) {
    console.log('OGP_FAIL', url, e.message);
    return { title: '', image: '' };
  }
}

// ------- 3) 画像ダウンロード → /assets/og/ に保存、JSONに local を付与 -------
function fileNameFrom(url) {
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);
  const m = (url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/) || [])[1];
  const ext = m ? (m === 'jpeg' ? 'jpg' : m) : 'jpg';
  return `${hash}.${ext}`;
}

async function cacheImage(imageUrl) {
  if (!imageUrl) return '';
  try {
    const res = await fetch(imageUrl, { headers: { 'user-agent': UA }, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const file = fileNameFrom(imageUrl);
    await fs.writeFile(path.join(OG_DIR, file), buf);
    return `/assets/og/${file}`;
  } catch (e) {
    console.log('CACHE_FAIL', imageUrl, e.message);
    return '';
  }
}

// ------- 実行 -------
for (const url of urls) {
  const og = await getOG(url);
  let entry = map[url] || {};
  entry.title = og.title || entry.title || '';
  entry.image = og.image || entry.image || '';
  // local キャッシュ
  const local = await cacheImage(entry.image);
  if (local) entry.local = local;
  map[url] = entry;
  console.log('OK', url, '->', entry.local || entry.image);
}

await fs.writeFile(JSON_OUT, JSON.stringify(map, null, 2), 'utf8');
console.log('Wrote', JSON_OUT, 'total keys:', Object.keys(map).length);
