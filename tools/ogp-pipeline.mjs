// tools/ogp-pipeline.mjs — note / DRONE.jp の RSS 新着取り込み＆OGP サムネイルキャッシュ
//
//   node tools/ogp-pipeline.mjs                … 新着記事を取り込み、未キャッシュの OGP 画像を保存
//   node tools/ogp-pipeline.mjs --refresh-all  … 既存キャッシュ済み URL も含めて OGP を再取得
//   node tools/ogp-pipeline.mjs --dry-run      … ファイルを書き換えずに差分だけ確認
//   node tools/ogp-pipeline.mjs --root <dir> --note-rss <src> --drone-rss <src>  … テスト用オプション
//
// 依存なし（Node 20+ の組み込み fetch を使用）。
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { truncate, writeIfChanged, fileExists } from './lib/html.mjs';

export const DEFAULT_NOTE_RSS = 'https://note.com/tojimasaya/rss';
export const DEFAULT_DRONE_RSS = 'https://drone.jp/column/masaya-toji/feed/';

const UA = 'Mozilla/5.0 (compatible; OGP-fetcher/1.0; +https://tojimasaya.com/)';
const FETCH_TIMEOUT_MS = 15000;
const EXCERPT_MAX_LEN = 160;

/* ---------- 文字列・HTML/XML ユーティリティ ---------- */

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
};

export function decodeEntities(value) {
  return String(value ?? '').replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, code) => {
    if (code.startsWith('#x') || code.startsWith('#X')) {
      const cp = parseInt(code.slice(2), 16);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : match;
    }
    if (code.startsWith('#')) {
      const cp = parseInt(code.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : match;
    }
    return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, code) ? NAMED_ENTITIES[code] : match;
  });
}

function unwrapCdata(raw) {
  const s = String(raw ?? '').trim();
  const m = s.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return m ? m[1] : s;
}

export function normalizeUrl(url) {
  const s = String(url ?? '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = u.pathname.replace(/\/+$/, '');
    return `${host}${pathname}`;
  } catch {
    return s.replace(/^https?:\/\/(www\.)?/i, '').replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
  }
}

export function articleIdentityKeys(url) {
  const keys = [];
  const norm = normalizeUrl(url);
  if (norm) keys.push(`url:${norm}`);

  const noteMatch = norm.match(/^note\.com\/[^/]+\/n\/([a-z0-9]+)$/i);
  if (noteMatch) keys.push(`note:${noteMatch[1].toLowerCase()}`);

  const droneMatch = norm.match(/^drone\.jp\/.+\/(\d+)\.html$/i);
  if (droneMatch) keys.push(`drone:${droneMatch[1]}`);

  return keys;
}

export function pubDateToJstIso(pubDate) {
  const s = String(pubDate ?? '').trim();
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = jst.getUTCFullYear();
  const mm = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(jst.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function cleanExcerpt(rawHtml, maxLen = EXCERPT_MAX_LEN) {
  let s = unwrapCdata(rawHtml);
  // note RSS の末尾リンク「続きをみる」を除去
  s = s.replace(/<a\b[^>]*>\s*続きをみる\s*<\/a>/gi, ' ');
  // 段落・改行タグはスペースに変換（句読点直後の不要スペースは後で整える）
  s = s.replace(/<\/(p|div|li|h[1-6])>/gi, ' ');
  s = s.replace(/<br\s*\/?>/gi, ' ');
  // 残りの HTML タグを除去
  s = s.replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  // 末尾の省略記号・続きリンク残骸を整理
  s = s.replace(/続きをみる\s*$/u, '');
  s = s.replace(/\s*\[\s*(?:…|\.{3})\s*\]\s*$/u, '…');
  s = s.replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const cut = truncate(s, maxLen);
  return cut.replace(/……+$/u, '…');
}

/* ---------- RSS 2.0 パーサー ---------- */

function extractTagText(block, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const m = block.match(re);
  if (!m) return '';
  return decodeEntities(unwrapCdata(m[1])).trim();
}

function extractTagRaw(block, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const m = block.match(re);
  return m ? m[1] : '';
}

function extractMediaThumbnail(block) {
  // note: <media:thumbnail>https://...</media:thumbnail>
  const textForm = extractTagText(block, 'media:thumbnail');
  if (/^https?:\/\//i.test(textForm)) return textForm;
  // 標準 MRSS: <media:thumbnail url="https://..." />
  const attrMatch = block.match(/<media:thumbnail\b[^>]*\burl=["']([^"']+)["'][^>]*\/?>/i);
  if (attrMatch && /^https?:\/\//i.test(attrMatch[1])) return decodeEntities(attrMatch[1]).trim();
  // enclosure 画像フォールバック
  const encMatch = block.match(/<enclosure\b[^>]*\btype=["']image\/[^"']+["'][^>]*\burl=["']([^"']+)["'][^>]*\/?>/i)
    || block.match(/<enclosure\b[^>]*\burl=["']([^"']+)["'][^>]*\btype=["']image\/[^"']+["'][^>]*\/?>/i);
  if (encMatch && /^https?:\/\//i.test(encMatch[1])) return decodeEntities(encMatch[1]).trim();
  return '';
}

export function parseRss(xml) {
  const items = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = extractTagText(block, 'title');
    const link = extractTagText(block, 'link');
    const pubDate = extractTagText(block, 'pubDate');
    const descriptionRaw = extractTagRaw(block, 'description');
    const image = extractMediaThumbnail(block);
    if (!/^https?:\/\//i.test(link)) continue;
    items.push({
      title,
      link,
      date: pubDateToJstIso(pubDate),
      image,
      excerpt: cleanExcerpt(descriptionRaw),
    });
  }
  return items;
}

/* ---------- HTML OGP 抽出 ---------- */

function parseAttributes(tag) {
  const attrs = {};
  const attrRe = /([a-zA-Z0-9:_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let m;
  while ((m = attrRe.exec(tag)) !== null) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '').trim();
  }
  return attrs;
}

export function extractOgMeta(html, baseUrl) {
  let ogTitle = '';
  let ogImage = '';
  let ogDesc = '';
  let metaDesc = '';

  const metaRe = /<meta\b[^>]*>/gi;
  let m;
  while ((m = metaRe.exec(html)) !== null) {
    const attrs = parseAttributes(m[0]);
    const prop = (attrs.property || '').toLowerCase();
    const name = (attrs.name || '').toLowerCase();
    const content = attrs.content || '';
    if (!content) continue;
    if (prop === 'og:title' && !ogTitle) ogTitle = content;
    else if (prop === 'og:image' && !ogImage) ogImage = content;
    else if (prop === 'og:description' && !ogDesc) ogDesc = content;
    else if (name === 'description' && !metaDesc) metaDesc = content;
  }

  let title = ogTitle;
  if (!title) {
    const tMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    if (tMatch) title = decodeEntities(tMatch[1]).replace(/\s+/g, ' ').trim();
  }

  let image = ogImage;
  if (image && !/^https?:\/\//i.test(image)) {
    try {
      const u = new URL(baseUrl);
      image = new URL(image, `${u.protocol}//${u.host}`).toString();
    } catch {
      image = '';
    }
  }

  return {
    title: title.trim(),
    image: image.trim(),
    description: cleanExcerpt(ogDesc || metaDesc),
  };
}

/* ---------- 配列への安全な新規挿入 ---------- */

/**
 * 既存記事の順序や手編集内容を一切壊さず、新着記事だけを日付降順の位置へ挿入する。
 */
export function insertNewArticles(existingArticles, newArticles) {
  if (!newArticles.length) return existingArticles;
  const result = [...existingArticles];
  // 複数件の新着があるときは、古い方から順に挿入すると日付降順・フィード順が保たれる
  const ordered = [...newArticles].sort((a, b) => a.date.localeCompare(b.date));
  for (const item of ordered) {
    let insertAt = result.findIndex((cur) => (cur.date || '') < item.date);
    if (insertAt === -1) insertAt = result.length;
    result.splice(insertAt, 0, item);
  }
  return result;
}

/* ---------- ネットワーク / キャッシュ ---------- */

function fileNameFrom(url) {
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);
  const m = (url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/) || [])[1];
  const ext = m ? (m === 'jpeg' ? 'jpg' : m) : 'jpg';
  return `${hash}.${ext}`;
}

async function fetchText(source, headers = {}) {
  if (!/^https?:\/\//i.test(source)) {
    return fs.readFile(source, 'utf8');
  }
  const res = await fetch(source, {
    headers: { 'user-agent': UA, ...headers },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function getOG(url) {
  try {
    const html = await fetchText(url, { 'accept-language': 'ja,en;q=0.8' });
    return extractOgMeta(html, url);
  } catch (e) {
    console.log('OGP_FAIL', url, e.message);
    return { title: '', image: '', description: '' };
  }
}

async function cacheImage(imageUrl, ogDir, dryRun = false) {
  if (!imageUrl) return '';
  try {
    const file = fileNameFrom(imageUrl);
    const destination = path.join(ogDir, file);
    if (await fileExists(destination)) {
      return `/assets/og/${file}`;
    }
    if (dryRun) {
      return `/assets/og/${file}`;
    }
    const res = await fetch(imageUrl, {
      headers: { 'user-agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(destination, buf);
    return `/assets/og/${file}`;
  } catch (e) {
    console.log('CACHE_FAIL', imageUrl, e.message);
    return '';
  }
}

/* ---------- メインパイプライン ---------- */

export async function runPipeline(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const noteRss = options.noteRss ?? DEFAULT_NOTE_RSS;
  const droneRss = options.droneRss ?? DEFAULT_DRONE_RSS;
  const refreshAll = Boolean(options.refreshAll);
  const dryRun = Boolean(options.dryRun);
  const ogFetcher = options.ogFetcher || getOG;
  const imageCacher = options.imageCacher || ((imgUrl) => cacheImage(imgUrl, ogDir, dryRun));

  const articlesJson = path.join(root, 'data', 'articles.json');
  const jsonOut = path.join(root, 'data', 'writings-og.json');
  const ogDir = path.join(root, 'assets', 'og');

  if (!dryRun) {
    await fs.mkdir(path.dirname(jsonOut), { recursive: true });
    await fs.mkdir(ogDir, { recursive: true });
  }

  let articles = [];
  try {
    articles = JSON.parse(await fs.readFile(articlesJson, 'utf8'));
    console.log(`articles.json から ${articles.length} 件を読み込み`);
  } catch (e) {
    console.log('WARN: articles.json 読み込みに失敗:', e.message);
  }

  let map = {};
  try {
    map = JSON.parse(await fs.readFile(jsonOut, 'utf8'));
  } catch {}

  // 既存記事の重複判定セット（正規化URL＋記事ID）
  const seenKeys = new Set();
  const urlsToCheck = new Set();
  for (const a of articles) {
    const u = (a.link || '').trim();
    if (!/^https?:\/\//i.test(u)) continue;
    urlsToCheck.add(u);
    for (const k of articleIdentityKeys(u)) seenKeys.add(k);
  }

  // RSS フィードから新着候補を収集（片方が失敗してももう片方は続行する fail-soft）
  const feeds = [
    { source: 'note', sourceLabel: 'note', url: noteRss, limit: 25 },
    { source: 'drone', sourceLabel: 'DRONE.jp', url: droneRss, limit: 15 },
  ];

  const newCandidates = [];
  for (const feed of feeds) {
    if (!feed.url) continue;
    try {
      const xml = await fetchText(feed.url);
      const parsed = parseRss(xml).slice(0, feed.limit);
      console.log(`${feed.sourceLabel} RSS から ${parsed.length} 件を取得`);
      for (const item of parsed) {
        const keys = articleIdentityKeys(item.link);
        if (keys.some((k) => seenKeys.has(k))) continue;
        if (!item.title || !item.date) {
          console.log(`SKIP (${feed.sourceLabel}): title/date 不足`, item.link);
          continue;
        }
        urlsToCheck.add(item.link);
        for (const k of keys) seenKeys.add(k);
        newCandidates.push({
          ...item,
          source: feed.source,
          sourceLabel: feed.sourceLabel,
        });
      }
    } catch (e) {
      console.log(`WARN: ${feed.sourceLabel} RSS 取得失敗（続行します）:`, e.message);
    }
  }

  console.log(`新着候補: ${newCandidates.length} 件`);

  const newCandidateByUrl = new Map(newCandidates.map((c) => [c.link, c]));
  const ogDescByUrl = new Map();

  // OGP 取得＆画像キャッシュ（既にローカルキャッシュが存在する URL は通常スキップ）
  for (const url of urlsToCheck) {
    const existingEntry = map[url] || {};
    const candidate = newCandidateByUrl.get(url);
    const localFile = existingEntry.local
      ? path.join(root, existingEntry.local.replace(/^\/+/, ''))
      : '';
    const hasLocalFile = Boolean(localFile && await fileExists(localFile));
    const needsOgForCandidate = Boolean(candidate && (!candidate.image || !candidate.excerpt));
    const needsFetch = refreshAll || !existingEntry.image || !hasLocalFile || needsOgForCandidate;

    if (!needsFetch) continue;

    const og = await ogFetcher(url);
    if (og.description) ogDescByUrl.set(url, og.description);

    const entry = { ...existingEntry };
    entry.title = og.title || entry.title || candidate?.title || '';
    entry.image = og.image || entry.image || candidate?.image || '';

    const local = await imageCacher(entry.image);
    if (local) entry.local = local;

    map[url] = entry;
    console.log('OK', url, '->', entry.local || entry.image);
  }

  // 新着候補を articles.json スキーマへ整形
  const newArticles = newCandidates.map((c) => {
    const cached = map[c.link];
    const image = c.image || cached?.image || '';
    const excerpt = c.excerpt || ogDescByUrl.get(c.link) || '';
    const article = {
      title: c.title,
      link: c.link,
      date: c.date,
      image,
      excerpt,
      source: c.source,
      sourceLabel: c.sourceLabel,
    };
    if (cached?.local) article.imageLocal = cached.local;
    return article;
  });

  // 既存記事は維持しつつ、新着のみ挿入＆未付与の imageLocal を補完
  const merged = insertNewArticles(articles, newArticles).map((article) => {
    const cached = map[article.link];
    if (!cached?.local || article.imageLocal === cached.local) return article;
    return { ...article, imageLocal: cached.local };
  });

  const ogJsonText = JSON.stringify(map, null, 2);
  const articlesJsonText = `${JSON.stringify(merged, null, 2)}\n`;

  let ogChanged = false;
  let articlesChanged = false;
  if (!dryRun) {
    ogChanged = await writeIfChanged(jsonOut, ogJsonText);
    if (merged.length) {
      articlesChanged = await writeIfChanged(articlesJson, articlesJsonText);
    }
  }

  console.log(
    `${dryRun ? '[dry-run] ' : ''}完了: writings-og=${Object.keys(map).length}件(更新:${ogChanged}), ` +
    `articles=${merged.length}件(新着:${newArticles.length}, 更新:${articlesChanged})`,
  );

  return {
    addedCount: newArticles.length,
    addedArticles: newArticles,
    totalArticles: merged.length,
    ogChanged,
    articlesChanged,
  };
}

/* ---------- CLI エントリポイント ---------- */

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--refresh-all') opts.refreshAll = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--root' && argv[i + 1]) opts.root = argv[++i];
    else if (arg === '--note-rss' && argv[i + 1]) opts.noteRss = argv[++i];
    else if (arg === '--drone-rss' && argv[i + 1]) opts.droneRss = argv[++i];
  }
  return opts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runPipeline(parseArgs(process.argv.slice(2))).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
