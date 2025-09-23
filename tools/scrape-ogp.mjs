import fs from 'node:fs/promises';
import path from 'node:path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const ROOT = process.cwd();
const writingsPath = path.join(ROOT, 'writings.html');
const outDir = path.join(ROOT, 'data');
const outPath = path.join(outDir, 'writings-og.json');

const html = await fs.readFile(writingsPath, 'utf8');

// Extract article URLs
const urlRegex = /<h3>\\s*<a[^>]*href="([^"]+)"/g;
const urls = new Set();
let m;
while ((m = urlRegex.exec(html)) !== null) {
  let url = m[1].trim();
  if (url.startsWith('#') || url.startsWith('mailto:')) continue;
  urls.add(url);
}

if (!urls.size) {
  console.log('No article URLs found.');
  process.exit(0);
}

await fs.mkdir(outDir, { recursive: true });

const results = {};
for (const url of urls) {
  try {
    const res = await fetch(url, { redirect: 'follow', timeout: 20000, headers: { 'user-agent': 'Mozilla/5.0 (bot; OGP fetch)' }});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const $ = cheerio.load(text);
    // Prioritize og:image then twitter:image then first <img>
    let img = $('meta[property="og:image"]').attr('content')
          || $('meta[name="twitter:image"]').attr('content')
          || $('img').first().attr('src')
          || '';
    let title = $('meta[property="og:title"]').attr('content')
           || $('title').text().trim()
           || '';
    // Resolve protocol-relative URLs
    if (img && img.startsWith('//')) img = 'https:' + img;
    results[url] = { image: img, title };
    console.log('OK', url, '->', img);
  } catch (e) {
    console.log('FAIL', url, e.message);
    results[url] = { image: '', title: '' };
  }
}

await fs.writeFile(outPath, JSON.stringify(results, null, 2), 'utf8');
console.log('Wrote', outPath);
