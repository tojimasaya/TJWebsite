import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import fetch from 'node-fetch';

const ROOT = process.cwd();
const jsonPath = path.join(ROOT, 'data', 'writings-og.json');
const ogDir = path.join(ROOT, 'assets', 'og');

await fs.mkdir(ogDir, { recursive: true });

let map = {};
try {
  map = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
} catch (e) {
  console.log('No writings-og.json found, skipping.');
  process.exit(0);
}

const normalizeExt = (url) => {
  const m = (url || '').toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/);
  return m ? (m[1] === 'jpeg' ? 'jpg' : m[1]) : 'jpg';
};

const results = { ...map };
let downloaded = 0;

for (const [url, info] of Object.entries(map)) {
  const imgUrl = info?.image;
  if (!imgUrl) continue;
  try {
    const res = await fetch(imgUrl, { redirect: 'follow', timeout: 30000, headers: { 'user-agent': 'Mozilla/5.0 (bot; OGP cache)' }});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());

    const hash = crypto.createHash('sha1').update(imgUrl).digest('hex').slice(0, 12);
    const ext = normalizeExt(imgUrl);
    const fileName = `${hash}.${ext}`;
    const filePath = path.join(ogDir, fileName);

    await fs.writeFile(filePath, buf);
    results[url] = { ...info, local: `/assets/og/${fileName}` };
    downloaded++;
    console.log('CACHED', imgUrl, '->', results[url].local);
  } catch (e) {
    console.log('CACHE_FAIL', imgUrl, e.message);
    // keep remote as-is; no local field
  }
}

await fs.writeFile(jsonPath, JSON.stringify(results, null, 2), 'utf8');
console.log('Updated', jsonPath, 'Downloaded:', downloaded);
