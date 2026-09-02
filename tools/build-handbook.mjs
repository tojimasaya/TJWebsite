// tools/build-handbook.mjs — 香港ハンドブックの共通フレームを各ページに入れる（提案 3 / Phase 4）
//
//   node tools/build-handbook.mjs                    … 全ページ
//   node tools/build-handbook.mjs --only hk-return-permit   … 1 ページだけ
//   node tools/build-handbook.mjs --check            … 差分の有無だけ見る（差分があれば exit 2）
//
// 入力: data/handbook.json（目録。audience / summary / updated / group / related / history）
// 出力: 各ページの以下のマーカー区間を置き換える。無ければ決まった位置に挿入する。
//   <!-- handbook:intro:start -->…<!-- handbook:intro:end -->    この記事の前提（＋目次のスロット）
//   <!-- handbook:footer:start -->…<!-- handbook:footer:end -->  更新履歴・シェア・関連ガイド
//   <!-- handbook:hub:start -->…<!-- handbook:hub:end -->        hub のカード一覧
// 本文（TJ の文章）には触らない。マーカーの中身は手で編集しない。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_ORIGIN, escapeHtml, formatDate, readJson, writeIfChanged, fileExists } from './lib/html.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'data/handbook.json';
const CHECK_ONLY = process.argv.includes('--check');
const ONLY = (() => {
  const i = process.argv.indexOf('--only');
  return i !== -1 ? process.argv[i + 1] : null;
})();

const MARK = (name) => ({ start: `<!-- handbook:${name}:start -->`, end: `<!-- handbook:${name}:end -->` });

/** マーカー区間を置き換える。無ければ anchor の前（before）／後ろ（after）に挿入する。 */
function putBlock(html, name, content, { before, after }) {
  const { start, end } = MARK(name);
  const block = `${start}\n${content}\n${end}`;
  const indentOf = (pos) => {
    const lineStart = html.lastIndexOf('\n', pos) + 1;
    const head = html.slice(lineStart, pos);
    return /^[ \t]*$/.test(head) ? head : (head.match(/^[ \t]*/) || [''])[0];
  };
  const indentBlock = (text, indent, skipFirst) =>
    text.split('\n').map((l, idx) => ((skipFirst && idx === 0) || !l ? l : indent + l)).join('\n');

  const i = html.indexOf(start);
  const j = html.indexOf(end);
  if (i !== -1 && j !== -1 && j > i) {
    // 置き換えても字下げが変わらないように、開始マーカーの字下げを使い回す
    return html.slice(0, i) + indentBlock(block, indentOf(i), true) + html.slice(j + end.length);
  }
  if (i !== -1 || j !== -1) throw new Error(`${name}: マーカーが片方だけあります`);
  if (after) {
    const k = html.indexOf(after);
    if (k === -1) throw new Error(`${name}: 挿入位置 ${after} が見つかりません`);
    const at = k + after.length;
    const indent = indentOf(k);
    return html.slice(0, at) + '\n' + indentBlock(block, indent + '    ', false) + html.slice(at);
  }
  const k = html.indexOf(before);
  if (k === -1) throw new Error(`${name}: 挿入位置 ${before} が見つかりません`);
  // その行の頭にある空白だけをインデントとして使い、行の手前に差し込む
  const lineStart = html.lastIndexOf('\n', k) + 1;
  const indent = (html.slice(lineStart, k).match(/^[ \t]*/) || [''])[0];
  const indented = block.split('\n').map((l) => (l ? indent + l : l)).join('\n');
  return html.slice(0, lineStart) + indented + '\n' + html.slice(lineStart);
}

function introBlock(page) {
  const updated = formatDate(page.updated, 'hk'); // 2026年7月12日
  return [
    '<div class="hb-intro">',
    '  <div class="hb-intro-inner">',
    '    <p class="hb-intro-title">この記事の前提</p>',
    '    <dl class="hb-intro-list">',
    `      <div><dt>誰向け</dt><dd>${escapeHtml(page.audience)}</dd></div>`,
    `      <div><dt>最終更新</dt><dd><time datetime="${page.updated}">${updated}</time></dd></div>`,
    '      <div><dt>ご注意</dt><dd>制度・手数料・条件は変わります。手続きの前に公式情報をご確認ください。変更や間違いに気づかれたら、<a href="#comments">ページ下部のコメント</a>で教えていただけると助かります。</dd></div>',
    '    </dl>',
    '  </div>',
    '</div>',
    '<div data-toc data-toc-title="目次"></div>',
  ].join('\n');
}

function footerBlock(page, byUrl) {
  const lines = [];
  lines.push('<div class="hb-foot">');

  const history = page.history || [];
  if (history.length) {
    lines.push('  <section class="hb-history" aria-labelledby="hb-history-title">');
    lines.push('    <h2 id="hb-history-title">更新履歴</h2>');
    lines.push('    <ul>');
    for (const h of history) {
      lines.push(`      <li><time datetime="${h.date}">${h.date}</time><span>${escapeHtml(h.note)}</span></li>`);
    }
    lines.push('    </ul>');
    lines.push('  </section>');
  }

  lines.push('  <div class="hb-share">');
  lines.push('    <span class="hb-share-label">この記事を共有</span>');
  lines.push(`    <div data-share data-title="${escapeHtml(page.title)}" data-url="${SITE_ORIGIN}${page.url}" data-page-id="${page.url}"></div>`);
  lines.push('  </div>');

  const related = (page.related || []).map((url) => byUrl.get(url)).filter(Boolean).slice(0, 3);
  if (related.length) {
    lines.push('  <section class="hb-related" aria-labelledby="hb-related-title">');
    lines.push('    <h2 id="hb-related-title">関連ガイド</h2>');
    lines.push('    <div class="hb-related-grid">');
    for (const r of related) {
      lines.push(`      <a class="hb-related-card" href="${r.url}" data-growth-label="handbook_related">`);
      lines.push(`        <span class="hb-related-group">${escapeHtml(r.groupLabel)}</span>`);
      lines.push(`        <span class="hb-related-title">${escapeHtml(r.title)}</span>`);
      lines.push(`        <span class="hb-related-summary">${escapeHtml(r.summary)}</span>`);
      lines.push('      </a>');
    }
    lines.push('    </div>');
    lines.push('    <p class="hb-related-hub"><a href="/hongkong-handbook.html" data-growth-label="handbook_hub">香港ハンドブックの目次へ →</a></p>');
    lines.push('  </section>');
  }

  lines.push('</div>');
  return lines.join('\n');
}

function hubBlock(catalog) {
  const lines = [];
  for (const group of catalog.groups) {
    const pages = catalog.pages.filter((p) => p.group === group.key);
    if (!pages.length) continue;
    lines.push(`<section class="hb-hub-group" aria-labelledby="hb-group-${group.key}">`);
    lines.push('  <div class="hb-hub-group-head">');
    lines.push(`    <h2 class="hb-hub-group-label" id="hb-group-${group.key}">${escapeHtml(group.label)}</h2>`);
    if (group.note) lines.push(`    <p class="hb-hub-group-note">${escapeHtml(group.note)}</p>`);
    lines.push('  </div>');
    lines.push('  <div class="hb-hub-grid">');
    for (const p of pages) {
      lines.push(`    <a class="hb-hub-card" href="${p.url}" data-growth-label="handbook_hub_card">`);
      lines.push(`      <img class="hb-hub-thumb" src="${p.image}" alt="" loading="lazy" decoding="async">`);
      lines.push('      <span>');
      lines.push(`        <span class="hb-hub-audience">${escapeHtml(p.audience)}</span>`);
      lines.push(`        <span class="hb-hub-title">${escapeHtml(p.title)}</span>`);
      lines.push(`        <span class="hb-hub-summary">${escapeHtml(p.summary)}</span>`);
      lines.push(`        <span class="hb-hub-updated">最終更新 ${p.updated}</span>`);
      lines.push('      </span>');
      lines.push('    </a>');
    }
    lines.push('  </div>');
    lines.push('</section>');
  }
  return lines.join('\n');
}

const TITLE_SUFFIX = ' | Toji Masaya';

/** <title> と meta description を目録の seoTitle / seoDescription に合わせる（H1 は触らない） */
function applySeo(html, seoTitle, seoDescription, where) {
  let out = html;
  if (seoTitle) {
    const title = `${seoTitle}${TITLE_SUFFIX}`;
    if (!/<title[^>]*>[\s\S]*?<\/title>/i.test(out)) throw new Error(`${where}: <title> が見つかりません`);
    out = out.replace(/<title([^>]*)>[\s\S]*?<\/title>/i, (m, attrs) => `<title${attrs}>${escapeHtml(title)}</title>`);
  }
  if (seoDescription) {
    const re = /(<meta\s+name="description"\s+content=")([^"]*)(")/i;
    if (!re.test(out)) throw new Error(`${where}: <meta name="description"> が見つかりません`);
    out = out.replace(re, (m, a, _b, c) => a + escapeHtml(seoDescription) + c);
  }
  return out;
}

/** 必要なスクリプトを（無ければ）comments.js の直前に足す */
function ensureScripts(html) {
  const needed = [
    { test: /js\/toc\.js/, tag: '    <script src="/js/toc.js" defer></script>' },
    { test: /js\/share\.js/, tag: '    <script src="/js/share.js" defer></script>' },
  ];
  const anchor = html.match(/^[ \t]*<script src="[^"]*js\/comments\.js[^"]*"[^>]*><\/script>/m);
  if (!anchor) return html;
  let out = html;
  for (const n of needed) {
    if (n.test.test(out)) continue;
    out = out.replace(anchor[0], `${n.tag}\n${anchor[0]}`);
  }
  return out;
}

async function main() {
  const catalog = await readJson(path.join(ROOT, SOURCE));
  const groupLabel = new Map(catalog.groups.map((g) => [g.key, g.label]));
  for (const p of catalog.pages) p.groupLabel = groupLabel.get(p.group) || '';
  const byUrl = new Map(catalog.pages.map((p) => [p.url, p]));

  const problems = [];
  for (const p of catalog.pages) {
    if (!p.audience || !p.summary || !p.updated) problems.push(`${p.id}: audience / summary / updated が要ります`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.updated || '')) problems.push(`${p.id}: updated は YYYY-MM-DD で`);
    if (!await fileExists(path.join(ROOT, p.url.replace(/^\//, '')))) problems.push(`${p.id}: ${p.url} がありません`);
    if (!groupLabel.has(p.group)) problems.push(`${p.id}: group "${p.group}" は groups にありません`);
  }
  if (problems.length) {
    console.error(`${SOURCE} に問題があります:`);
    for (const x of problems) console.error('  - ' + x);
    process.exit(1);
  }

  const written = [];
  const out = async (rel, content) => {
    const cur = await fs.readFile(path.join(ROOT, rel), 'utf8').catch(() => null);
    if (cur === content) return;
    written.push(rel);
    if (!CHECK_ONLY) await writeIfChanged(path.join(ROOT, rel), content);
  };

  const targets = ONLY ? catalog.pages.filter((p) => p.id === ONLY) : catalog.pages;
  if (ONLY && !targets.length) throw new Error(`--only ${ONLY} は目録にありません`);

  for (const page of targets) {
    const rel = page.url.replace(/^\//, '');
    let html = await fs.readFile(path.join(ROOT, rel), 'utf8');
    html = applySeo(html, page.seoTitle, page.seoDescription, page.id);
    html = putBlock(html, 'intro', introBlock(page), { after: page.introAfter || '<main id="main-content">' });
    html = putBlock(html, 'footer', footerBlock(page, byUrl), { before: '<div id="comments-slot"></div>' });
    html = ensureScripts(html);
    await out(rel, html);
  }

  // hub は --only 指定が無いときだけ組み直す
  if (!ONLY) {
    const hubRel = catalog.hub.replace(/^\//, '');
    let hubHtml = await fs.readFile(path.join(ROOT, hubRel), 'utf8');
    if (catalog.hubSeo) hubHtml = applySeo(hubHtml, catalog.hubSeo.title, catalog.hubSeo.description, 'hub');
    if (hubHtml.includes(MARK('hub').start)) {
      await out(hubRel, putBlock(hubHtml, 'hub', hubBlock(catalog), {}));
    } else {
      await out(hubRel, hubHtml);
      console.warn(`注意: ${hubRel} に <!-- handbook:hub:start --> が無いのでカード一覧を入れていません`);
    }
  }

  console.log(`${CHECK_ONLY ? '[check] ' : ''}ハンドブック: ${targets.length} ページ${ONLY ? `（--only ${ONLY}）` : ''}`);
  console.log(`${CHECK_ONLY ? '差分のあるファイル' : '書き込んだファイル'}: ${written.length}`);
  for (const f of written) console.log('  - ' + f);
  if (CHECK_ONLY && written.length) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
