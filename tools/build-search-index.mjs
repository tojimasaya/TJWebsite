// tools/build-search-index.mjs — サイト内検索インデックス（data/search-index.json）を生成
// 外部パッケージ不要（Node.js 標準ライブラリのみ）。
// 使い方: node tools/build-search-index.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_FILE = path.join(ROOT, 'data/search-index.json');

const CATEGORY_LABELS = {
  shirasagi: '白鷺三十六景',
  hongkong: '香港・ハンドブック',
  trips: '旅の記録',
  fragments: '断章',
  writings: '執筆記事',
  archive: 'Archive',
  gear: 'Gear',
  other: 'その他',
};

function cleanText(text) {
  return String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text, max = 120) {
  const s = cleanText(text);
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

function normalizeDate(val) {
  const m = String(val || '').match(/(\d{4})[.\-\/年](\d{1,2})[.\-\/月](\d{1,2})/);
  if (!m) return '';
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

function extractHtmlMeta(html) {
  const title = cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
    .replace(/\s*[|｜—–-]\s*(Toji Masaya|田路昌也).*$/i, '')
    .trim();
  const desc = cleanText(
    html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)?.[1] ||
    html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i)?.[1] ||
    ''
  );
  const headings = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map((m) => cleanText(m[1]))
    .filter(Boolean)
    .slice(0, 12)
    .join(' ');
  const isNoindex = /<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
  const isRedirect = /http-equiv=["']refresh["']/i.test(html);
  return { title, desc, headings, isNoindex, isRedirect };
}

function classifyHtmlFile(rel) {
  if (rel.startsWith('shirasagi36')) return 'shirasagi';
  if (rel.startsWith('hongkong') || rel.startsWith('hk-') || rel.startsWith('cn-') || rel.startsWith('iphone') || rel === 'holidays.html') return 'hongkong';
  if (
    rel === 'trips.html' ||
    rel.endsWith('-travel-journal.html') ||
    rel.endsWith('-detail.html') ||
    /^(tibet-day|italy-|germany-|macau-|hoian-2018)/.test(rel)
  ) return 'trips';
  if (rel === 'archive.html' || rel.startsWith('leica')) return 'archive';
  if (rel.startsWith('gear')) return 'gear';
  if (rel.startsWith('articles/') || rel === 'writings.html') return 'writings';
  if (rel === 'fragments.html') return 'fragments';
  return 'other';
}

async function readJson(rel) {
  return JSON.parse(await fs.readFile(path.join(ROOT, rel), 'utf8'));
}

async function main() {
  const items = [];
  const seenUrls = new Set();

  function add(item) {
    if (!item.t || !item.u || seenUrls.has(item.u)) return;
    seenUrls.add(item.u);
    const out = {
      t: cleanText(item.t),
      u: item.u,
      c: item.c,
      l: item.l || CATEGORY_LABELS[item.c] || 'その他',
      s: truncate(item.s || '', 115),
    };
    if (item.d) out.d = item.d;
    const kw = cleanText(item.k || '');
    if (kw) out.k = kw.slice(0, 260);
    if (item.x) out.x = 1;
    items.push(out);
  }

  // 1. 白鷺三十六景（日本語 35景）
  const shirasagi = await readJson('assets/images/shirasagi/photos.json');
  for (const [idStr, p] of Object.entries(shirasagi)) {
    const nn = String(idStr).padStart(2, '0');
    const loc = p.location?.name || '';
    const tipsText = (p.tips || []).map((tip) => tip.text).join(' ');
    add({
      t: `第${nn}景 ${p.title}`,
      u: `/shirasagi36/no${nn}.html`,
      c: 'shirasagi',
      d: normalizeDate(p.date),
      s: p.summary || p.subtitle || '',
      k: [p.subtitle, loc, p.gear, p.category, '姫路城 白鷺城', tipsText].filter(Boolean).join(' '),
    });
  }

  // 2. 断章（34篇）
  const fragments = await readJson('data/recent-photos.json');
  for (const f of fragments) {
    if (!f.slug) continue;
    add({
      t: f.title,
      u: `/fragments/${f.slug}.html`,
      c: 'fragments',
      d: normalizeDate(f.date),
      s: f.homeLead || f.body || '',
      k: [f.place, f.gear, f.caption, (f.body || '').slice(0, 180)].filter(Boolean).join(' '),
    });
  }

  // 3. 香港ハンドブック（data/handbook.json）
  const handbook = await readJson('data/handbook.json');
  for (const p of handbook.pages || []) {
    add({
      t: p.seoTitle || p.title,
      u: p.url,
      c: 'hongkong',
      d: normalizeDate(p.updated),
      s: p.seoDescription || p.summary || '',
      k: [p.title, p.region, p.audience, '香港ハンドブック'].filter(Boolean).join(' '),
    });
  }

  // 4. 執筆記事（note / DRONE.jp）
  const articles = await readJson('data/articles.json');
  for (const a of articles) {
    add({
      t: a.title,
      u: a.link,
      c: 'writings',
      l: a.sourceLabel || '執筆記事',
      d: normalizeDate(a.date),
      s: a.excerpt || '',
      k: [a.magazine, a.sourceLabel, a.source].filter(Boolean).join(' '),
      x: 1,
    });
  }

  // 5. 機材リスト（data/gear.json → カテゴリページへのキーワード補強）
  const gearJson = await readJson('data/gear.json').catch(() => null);
  const gearKeywordsByPage = {};
  if (gearJson && gearJson.categories) {
    const pageMap = {
      camera: '/gear-camera.html',
      drone: '/gear-drone.html',
      editing: '/gear-editing.html',
      accessories: '/gear-accessories.html',
      bags: '/gear-bags.html',
      sim: '/gear-sim.html',
    };
    for (const [key, cat] of Object.entries(gearJson.categories)) {
      const targetUrl = pageMap[key] || '/gear.html';
      const names = [];
      for (const item of cat.items || []) {
        if (item.name) names.push(item.name);
        if (item.brand) names.push(item.brand);
      }
      gearKeywordsByPage[targetUrl] = names.join(' ');
    }
  }

  // 6. ルートおよび articles/ の公開 HTML ページ（多言語ミラー・検索自身・リダイレクト除く）
  const skipFiles = new Set([
    'index.html',
    'search.html',
    '404.html',
    'links.html',
    'instagram.html',
    'instagram-en.html',
    'instagram-hk.html',
    'about-en.html',
    'about-hk.html',
    'shirasagi36-en.html',
    'shirasagi36-hk.html',
    'shirasagi36-guide-en.html',
    'shirasagi36-guide-hk.html',
    'shirasagi36-access-en.html',
    'shirasagi36-access-hk.html',
  ]);

  const rootEntries = await fs.readdir(ROOT, { withFileTypes: true });
  const htmlPaths = [];
  for (const entry of rootEntries) {
    if (entry.isFile() && entry.name.endsWith('.html') && !skipFiles.has(entry.name)) {
      htmlPaths.push(entry.name);
    }
  }
  const articlesDir = path.join(ROOT, 'articles');
  try {
    const artEntries = await fs.readdir(articlesDir, { withFileTypes: true });
    for (const entry of artEntries) {
      if (entry.isFile() && entry.name.endsWith('.html')) {
        htmlPaths.push(`articles/${entry.name}`);
      }
    }
  } catch { /* ignore */ }

  for (const rel of htmlPaths.sort()) {
    const url = `/${rel}`;
    if (seenUrls.has(url)) continue;
    const html = await fs.readFile(path.join(ROOT, rel), 'utf8');
    const meta = extractHtmlMeta(html);
    if (meta.isNoindex || meta.isRedirect || !meta.title) continue;
    const cat = classifyHtmlFile(rel);
    const extraKw = gearKeywordsByPage[url] || '';
    add({
      t: meta.title,
      u: url,
      c: cat,
      s: meta.desc,
      k: [meta.headings, extraKw].filter(Boolean).join(' '),
    });
  }

  const payload = {
    generated: new Date().toISOString().slice(0, 10),
    count: items.length,
    items,
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(payload) + '\n', 'utf8');
  console.log(`検索インデックスを生成しました: ${items.length} 件 → data/search-index.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
