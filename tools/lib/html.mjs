// tools/lib/html.mjs — 生成スクリプト共通ヘルパー（build-shirasagi / build-fragments / build-og で共用）
// 依存なし（Node 18+）。ロジックはここ、文言と構造はテンプレート側に置く。
import fs from 'node:fs/promises';
import path from 'node:path';

export const SITE_ORIGIN = 'https://tojimasaya.com';

/* ---------- 文字列 ---------- */

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

/** 改行を含むテキストを <p> の列に。空行で段落、単一改行は <br>。 */
export function paragraphs(text, className = '') {
  const cls = className ? ` class="${className}"` : '';
  return String(text ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p${cls}>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

/** 全角・半角を問わず文字数で切り詰め（句読点の直後で切れるなら優先）。 */
export function truncate(text, max, suffix = '…') {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  if ([...s].length <= max) return s;
  const chars = [...s].slice(0, max - [...suffix].length);
  let cut = chars.length;
  for (let i = chars.length - 1; i > Math.floor(max * 0.6); i--) {
    if ('。．.、，,！!？?'.includes(chars[i])) { cut = i + 1; break; }
  }
  return chars.slice(0, cut).join('').trim() + suffix;
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

/* ---------- 漢数字 ---------- */

const KANJI_DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/** 1〜99 → 漢数字（13 → 十三、20 → 二十、36 → 三十六） */
export function kanjiNumber(n) {
  n = Number(n);
  if (!Number.isInteger(n) || n < 1 || n > 99) throw new Error(`kanjiNumber: out of range ${n}`);
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  let s = '';
  if (tens === 1) s += '十';
  else if (tens > 1) s += KANJI_DIGITS[tens] + '十';
  s += KANJI_DIGITS[ones];
  return s;
}

/** 13 → 第十三景 */
export function kanjiView(n) {
  return `第${kanjiNumber(n)}景`;
}

/* ---------- 日付 ---------- */

/**
 * "2025.11.13" / "2025-11-13" / "2025年11月13日" → { iso: "2025-11-13", y, m, d }
 * 解釈できなければ null。
 */
export function parseDate(value) {
  const s = String(value ?? '').trim();
  const m = s.match(/^(\d{4})[.\-/年](\d{1,2})[.\-/月](\d{1,2})日?$/);
  if (!m) return null;
  const y = Number(m[1]); const mo = Number(m[2]); const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { iso: `${y}-${pad2(mo)}-${pad2(d)}`, y, m: mo, d };
}

/** 日本時間の ISO 8601（フィード・OGP 用）。時刻は 00:00。 */
export function isoJst(value) {
  const p = parseDate(value);
  return p ? `${p.iso}T00:00:00+09:00` : null;
}

export function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** 表示用: lang に応じて "2025.11.13" / "13 Nov 2025" / "2025年11月13日" */
export function formatDate(value, lang = 'ja') {
  const p = parseDate(value);
  if (!p) return String(value ?? '');
  if (lang === 'en') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${p.d} ${months[p.m - 1]} ${p.y}`;
  }
  if (lang === 'hk') return `${p.y}年${p.m}月${p.d}日`;
  return `${p.y}.${pad2(p.m)}.${pad2(p.d)}`;
}

/* ---------- テンプレート ---------- */

/**
 * 最小テンプレート:
 *   {{key}}          … HTML エスケープして挿入
 *   {{{key}}}        … そのまま挿入（生成済み HTML 用）
 *   {{#key}}…{{/key}} … key が truthy のときだけ中身を出す
 *   {{^key}}…{{/key}} … key が falsy のときだけ中身を出す
 * ネストは可（内側から順に評価）。ループは持たない — 配列は呼び出し側で HTML にしてから渡す。
 */
export function renderTemplate(template, data) {
  let out = template;
  const truthy = (k) => {
    const v = data[k];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  };
  // セクション（ネスト対応のため、変化しなくなるまで繰り返す）
  const section = /\{\{([#^])([\w.-]+)\}\}([\s\S]*?)\{\{\/\2\}\}/g;
  let prev;
  do {
    prev = out;
    out = out.replace(section, (_, kind, key, body) => {
      const show = kind === '#' ? truthy(key) : !truthy(key);
      return show ? body : '';
    });
  } while (out !== prev);
  out = out.replace(/\{\{\{([\w.-]+)\}\}\}/g, (_, key) => String(data[key] ?? ''));
  out = out.replace(/\{\{([\w.-]+)\}\}/g, (_, key) => escapeHtml(data[key] ?? ''));
  const leftovers = out.match(/\{\{[#^/]?[\w.-]+\}\}/g);
  if (leftovers) throw new Error(`renderTemplate: unresolved placeholders ${[...new Set(leftovers)].join(' ')}`);
  return out;
}

/* ---------- マーカー区間の置換 ---------- */

/**
 * `<!-- name:start -->` と `<!-- name:end -->` の間を content で置き換える。
 * マーカーが無ければ、fallbackAnchor（例: '</urlset>'）の直前にマーカーごと挿入する。
 */
export function replaceMarkerBlock(source, name, content, fallbackAnchor = null) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const block = `${start}\n${content.replace(/\s+$/, '')}\n${end}`;
  const i = source.indexOf(start);
  const j = source.indexOf(end);
  if (i !== -1 && j !== -1 && j > i) {
    return source.slice(0, i) + block + source.slice(j + end.length);
  }
  if (i !== -1 || j !== -1) throw new Error(`replaceMarkerBlock: unmatched marker for ${name}`);
  if (!fallbackAnchor) throw new Error(`replaceMarkerBlock: marker ${name} not found`);
  const k = source.lastIndexOf(fallbackAnchor);
  if (k === -1) throw new Error(`replaceMarkerBlock: anchor ${fallbackAnchor} not found`);
  return source.slice(0, k) + block + '\n\n' + source.slice(k);
}

/* ---------- 画像寸法（JPEG / WebP） ---------- */

/** JPEG / WebP のピクセル寸法をヘッダーから読む。{ width, height } または null。 */
export async function imageSize(file) {
  const fh = await fs.open(file, 'r');
  try {
    const { size } = await fh.stat();
    const head = Buffer.alloc(Math.min(size, 65536));
    await fh.read(head, 0, head.length, 0);
    if (head[0] === 0xff && head[1] === 0xd8) return jpegSize(fh, size, head);
    if (head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP') return webpSize(head);
    return null;
  } finally {
    await fh.close();
  }
}

async function jpegSize(fh, size, head) {
  // SOF マーカーが 64KB 以内に無い（大きな EXIF/ICC を持つ）場合に備え、必要に応じて読み進める
  let buf = head;
  let i = 2;
  while (i < size) {
    if (i + 9 > buf.length) {
      const more = Buffer.alloc(Math.min(size - buf.length, 1 << 20));
      if (more.length === 0) break;
      await fh.read(more, 0, more.length, buf.length);
      buf = Buffer.concat([buf, more]);
    }
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    if ((marker >= 0xc0 && marker <= 0xcf) && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

function webpSize(buf) {
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    const b0 = buf[21]; const b1 = buf[22]; const b2 = buf[23]; const b3 = buf[24];
    return { width: 1 + (((b1 & 0x3f) << 8) | b0), height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)) };
  }
  if (chunk === 'VP8X') {
    return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  }
  return null;
}

/* ---------- ファイル ---------- */

export async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

/** 内容が同じなら書かない（Action の空コミット回避・mtime 維持）。書いたら true。 */
export async function writeIfChanged(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  try {
    const current = await fs.readFile(file, 'utf8');
    if (current === content) return false;
  } catch { /* 新規 */ }
  await fs.writeFile(file, content, 'utf8');
  return true;
}

export async function fileExists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}
