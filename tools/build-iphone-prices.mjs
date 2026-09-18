// tools/build-iphone-prices.mjs — 香港版 iPhone の価格ページを data/iphone-prices.json から組み直す
//
//   node tools/build-iphone-prices.mjs           … 生成して書き込む
//   node tools/build-iphone-prices.mjs --check   … 差分の有無だけ見る（差分があれば exit 2）
//
// 出力先は iphone18-price.html の次のマーカー区間。中身は手で編集しない。
//   <!-- iphone:hero:start -->…<!-- iphone:hero:end -->       ヒーローの写真
//   <!-- iphone:summary:start -->…<!-- iphone:summary:end -->   早見表と為替の前提
//   <!-- iphone:prices:start -->…<!-- iphone:prices:end -->     モデル別の価格表
//   <!-- iphone:buyback:start -->…<!-- iphone:buyback:end -->   先達廣場の買取価格（日付ごとの記録）
// <title> / meta description / JSON-LD も seo と priceCheckedAt から差し替える。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_ORIGIN, escapeHtml, formatDate, readJson, writeIfChanged } from './lib/html.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'data/iphone-prices.json';
const CHECK_ONLY = process.argv.includes('--check');
const TITLE_SUFFIX = ' | Toji Masaya';

const MARK = (name) => ({ start: `<!-- iphone:${name}:start -->`, end: `<!-- iphone:${name}:end -->` });

/** マーカー区間を、開始マーカーの字下げを保ったまま置き換える。 */
function putBlock(html, name, content) {
  const { start, end } = MARK(name);
  const i = html.indexOf(start);
  const j = html.indexOf(end);
  if (i === -1 || j === -1 || j < i) throw new Error(`${name}: マーカーが見つかりません`);
  const lineStart = html.lastIndexOf('\n', i) + 1;
  const indent = (html.slice(lineStart, i).match(/^[ \t]*/) || [''])[0];
  const body = content.split('\n').map((l) => (l ? indent + l : l)).join('\n');
  return html.slice(0, i) + start + '\n' + body + '\n' + indent + html.slice(j);
}

const yen = (n) => n.toLocaleString('en-US');
const hkd = (n) => 'HK$' + Math.round(n).toLocaleString('en-US');
/** 香港ドルの金額を米ドルの目安にする（rates.USD = 1米ドルあたりの HKD） */
const usdOf = (h, rates) => 'US$' + Math.round(h / rates.USD).toLocaleString('en-US');
const withUsd = (h, rates) => (rates && rates.USD ? ` <span class="ip-usd">≈ ${usdOf(h, rates)}</span>` : '');

/** 買取記録1件の金額。priceHigh があれば「HK$14,000 〜 14,050」と幅で出す。 */
function buybackPrice(r, rates) {
  const hi = typeof r.priceHigh === 'number' && r.priceHigh > r.price ? r.priceHigh : null;
  if (!hi) return hkd(r.price) + withUsd(r.price, rates);
  const usd = rates && rates.USD
    ? ` <span class="ip-usd">≈ ${usdOf(r.price, rates)} 〜 ${Math.round(hi / rates.USD).toLocaleString('en-US')}</span>`
    : '';
  return `${hkd(r.price)} 〜 ${yen(hi)}${usd}`;
}

/** その構成のアップル公式価格（基準地＝香港）。買取価格と並べて定価との上下を出す。 */
function retailPrice(cat, modelId, capacity) {
  const base = (cat.regions.find((r) => r.base) || cat.regions[0]).code;
  const model = cat.models.find((m) => m.id === modelId);
  const cap = model && model.capacities.find((c) => c.size === capacity);
  return cap && typeof cap.prices[base] === 'number' ? cap.prices[base] : null;
}

/** 各地の表示価格を香港ドルに換算する。香港はそのまま。 */
function toHkd(region, amount, rates) {
  if (region === 'HK') return amount;
  const rate = rates[region === 'JP' ? 'JPY' : 'CNY'];
  return amount * rate;
}

/** ヒーローの写真。og:image / twitter:image も同じ1枚から取る。 */
function heroBlock(cat) {
  const h = cat.hero;
  return [
    '<picture>',
    `  <source srcset="${h.webp}" type="image/webp">`,
    `  <img src="${h.image}" alt="${escapeHtml(h.alt)}" class="journal-hero-bg" width="${h.width}" height="${h.height}" style="object-position: center ${h.focus || '50%'};" decoding="async" fetchpriority="high">`,
    '</picture>',
  ].join('\n');
}

function summaryBlock(cat) {
  const { rates, regions, models } = cat;
  const base = regions.find((r) => r.base) || regions[0];
  const rows = [];
  for (const m of models) {
    for (const c of m.capacities) {
      const conv = regions.map((r) => ({ code: r.code, hkd: toHkd(r.code, c.prices[r.code], rates) }));
      const min = conv.reduce((a, b) => (b.hkd < a.hkd ? b : a));
      rows.push({ model: m.name, size: c.size, min: min.code, base: c.prices[base.code], conv });
    }
  }
  const baseWins = rows.filter((r) => r.min === base.code).length;
  const gaps = regions
    .filter((r) => r.code !== base.code)
    .map((r) => {
      const diffs = rows.map((row) => row.conv.find((x) => x.code === r.code).hkd - row.base);
      return { label: r.label, min: Math.min(...diffs), max: Math.max(...diffs) };
    });

  const lines = [];
  lines.push('<div class="ip-summary">');
  lines.push('  <div class="ip-summary-cards">');
  lines.push('    <div class="ip-card">');
  lines.push(`      <span class="ip-card-label">全${rows.length}構成のうち</span>`);
  lines.push(`      <strong class="ip-card-value">${baseWins}構成で${escapeHtml(base.label)}が最安</strong>`);
  lines.push('      <span class="ip-card-note">アップル公式価格を香港ドルに換算して比較</span>');
  lines.push('    </div>');
  for (const g of gaps) {
    lines.push('    <div class="ip-card">');
    lines.push(`      <span class="ip-card-label">${escapeHtml(g.label)}との差</span>`);
    lines.push(`      <strong class="ip-card-value">+${hkd(g.min)} 〜 +${hkd(g.max)}</strong>`);
    if (rates.USD) lines.push(`      <span class="ip-card-usd">≈ ${usdOf(g.min, rates)} 〜 ${usdOf(g.max, rates)}</span>`);
    lines.push(`      <span class="ip-card-note">${escapeHtml(base.label)}で買った場合との差額の幅</span>`);
    lines.push('    </div>');
  }
  lines.push('  </div>');

  lines.push('  <dl class="ip-facts">');
  lines.push(`    <div><dt>価格の確認日</dt><dd><time datetime="${cat.priceCheckedAt}">${formatDate(cat.priceCheckedAt, 'hk')}</time></dd></div>`);
  const usdLine = rates.USD
    ? `<br>1米ドル = ${rates.USD} HKD <span class="ip-muted">（${formatDate(rates.usdAsOf || rates.asOf, 'hk')}時点・${escapeHtml(rates.usdSource || rates.source)}）</span>`
    : '';
  lines.push(`    <div><dt>換算レート</dt><dd>1円 = ${rates.JPY} HKD ／ 1元 = ${rates.CNY} HKD<br><span class="ip-muted">${formatDate(rates.asOf, 'hk')}時点・${escapeHtml(rates.source)}</span>${usdLine}</dd></div>`);
  lines.push(`    <div><dt>税の扱い</dt><dd>${regions.map((r) => `${escapeHtml(r.label)}は${escapeHtml(r.taxNote)}`).join('。')}。いずれも店頭で払う金額どうしの比較です。</dd></div>`);
  lines.push('  </dl>');
  lines.push('</div>');
  return lines.join('\n');
}

function pricesBlock(cat) {
  const { rates, regions, models } = cat;
  const base = regions.find((r) => r.base) || regions[0];
  const lines = [];
  for (const m of models) {
    lines.push(`<section class="ip-model" id="${m.id}" aria-labelledby="${m.id}-title">`);
    lines.push(`  <h2 class="ip-model-title" id="${m.id}-title">${escapeHtml(m.name)}</h2>`);
    lines.push('  <table class="ip-table">');
    lines.push('    <thead>');
    lines.push('      <tr>');
    lines.push('        <th scope="col">容量</th>');
    for (const r of regions) {
      lines.push(`        <th scope="col">${escapeHtml(r.label)}<span class="ip-cur">${escapeHtml(r.currency)}</span></th>`);
    }
    lines.push('      </tr>');
    lines.push('    </thead>');
    lines.push('    <tbody>');
    for (const c of m.capacities) {
      const conv = regions.map((r) => ({ ...r, local: c.prices[r.code], hkd: toHkd(r.code, c.prices[r.code], rates) }));
      const min = conv.reduce((a, b) => (b.hkd < a.hkd ? b : a));
      lines.push('      <tr>');
      lines.push(`        <th scope="row">${escapeHtml(c.size)}</th>`);
      for (const r of conv) {
        const cheapest = r.code === min.code;
        const diff = r.hkd - conv.find((x) => x.code === base.code).hkd;
        lines.push(`        <td data-label="${escapeHtml(r.label)}"${cheapest ? ' class="is-cheapest"' : ''}>`);
        lines.push(`          <span class="ip-local">${escapeHtml(r.symbol)}${yen(r.local)}${r.code === base.code ? withUsd(r.local, rates) : ''}</span>`);
        if (r.code === base.code) {
          lines.push(`          <span class="ip-note">${cheapest ? 'ここが最安' : '基準'}</span>`);
        } else {
          const sign = diff >= 0 ? '+' : '−';
          lines.push(`          <span class="ip-conv">${hkd(r.hkd)}${withUsd(r.hkd, rates)}</span>`);
          lines.push(`          <span class="ip-diff">${sign}${hkd(Math.abs(diff))}${rates.USD ? ` <span class="ip-usd">(${sign}${usdOf(Math.abs(diff), rates)})</span>` : ''}</span>`);
        }
        lines.push('        </td>');
      }
      lines.push('      </tr>');
    }
    lines.push('    </tbody>');
    lines.push('  </table>');
    lines.push(`  <p class="ip-table-note">${escapeHtml(base.label)}以外は香港ドル換算と、${escapeHtml(base.label)}で買った場合との差額。${rates.USD ? '「≈ US$」は米ドル換算の目安。' : ''}端数は四捨五入しています。</p>`);
    lines.push('</section>');
  }
  return lines.join('\n');
}

function buybackBlock(cat) {
  const bb = cat.buyback || {};
  const records = bb.records || [];
  const byModel = new Map(cat.models.map((m) => [m.id, m]));
  const condLabel = new Map((bb.conditions || []).map((c) => [c.key, c.label]));
  const lines = [];
  lines.push('<div class="ip-buyback">');
  if (bb.note) lines.push(`  <p class="ip-buyback-note">${escapeHtml(bb.note)}</p>`);

  if (!records.length) {
    lines.push('  <p class="ip-empty">まだ聞きに行けていません。先達廣場で確かめ次第、聞いた日付とあわせてここに足していきます。</p>');
    lines.push('</div>');
    return lines.join('\n');
  }

  // 構成ごとにまとめ、日付の新しい順に並べる（値動きが縦に読めるように）
  const groups = new Map();
  for (const r of records) {
    const key = `${r.model}__${r.capacity}__${r.condition || ''}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const order = [...cat.models.map((m) => m.id)];
  // 容量は models の並び順に従う（文字列順だと 1TB → 256GB → 2TB → 512GB になってしまう）
  const capOrder = new Map(cat.models.map((m) => [m.id, m.capacities.map((c) => c.size)]));
  const sorted = [...groups.entries()].sort((a, b) => {
    const [ma, ca] = a[0].split('__');
    const [mb, cb] = b[0].split('__');
    const ia = (capOrder.get(ma) || []).indexOf(ca);
    const ib = (capOrder.get(mb) || []).indexOf(cb);
    return order.indexOf(ma) - order.indexOf(mb) || ia - ib || ca.localeCompare(cb);
  });

  lines.push('  <div class="ip-buyback-grid">');
  for (const [key, list] of sorted) {
    const [modelId, capacity, condition] = key.split('__');
    const rows = list.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    const latest = rows[0];
    const first = rows[rows.length - 1];
    const model = byModel.get(modelId);
    lines.push('    <section class="ip-bb-card">');
    lines.push('      <header class="ip-bb-head">');
    lines.push(`        <h3>${escapeHtml(model ? model.name : modelId)} <span class="ip-bb-cap">${escapeHtml(capacity)}</span></h3>`);
    if (condition) lines.push(`        <span class="ip-bb-cond">${escapeHtml(condLabel.get(condition) || condition)}</span>`);
    lines.push('      </header>');
    lines.push('      <p class="ip-bb-latest">');
    lines.push(`        <span class="ip-bb-price">${buybackPrice(latest, cat.rates)}</span>`);
    lines.push(`        <span class="ip-bb-when"><time datetime="${latest.date}">${formatDate(latest.date, 'hk')}</time>の板</span>`);
    if (rows.length > 1) {
      const delta = latest.price - first.price;
      lines.push(`        <span class="ip-bb-delta">初回から ${delta >= 0 ? '+' : '−'}${hkd(Math.abs(delta))}</span>`);
    }
    lines.push('      </p>');
    // 定価との上下。買取のほうが高ければ「買ってすぐ売れば乗る額」になる
    const retail = retailPrice(cat, modelId, capacity);
    if (retail != null) {
      const gap = latest.price - retail;
      const ranged = typeof latest.priceHigh === 'number' && latest.priceHigh > latest.price;
      const lead = ranged ? `アップル公式 ${hkd(retail)} より、いちばん安い色でも` : `アップル公式 ${hkd(retail)} より`;
      lines.push(`      <p class="ip-bb-vs ${gap >= 0 ? 'is-up' : 'is-down'}">${lead} <strong>${gap >= 0 ? '+' : '−'}${hkd(Math.abs(gap))}</strong></p>`);
    }
    if (rows.length > 1) {
      lines.push('      <ol class="ip-bb-history">');
      for (const r of rows) {
        lines.push(`        <li><time datetime="${r.date}">${formatDate(r.date, 'hk')}</time><span>${buybackPrice(r, cat.rates)}</span>${r.memo ? `<em>${escapeHtml(r.memo)}</em>` : ''}</li>`);
      }
      lines.push('      </ol>');
    } else if (latest.memo) {
      lines.push(`      <p class="ip-bb-memo">${escapeHtml(latest.memo)}</p>`);
    }
    lines.push('    </section>');
  }
  lines.push('  </div>');
  // 板に出ていなかった機種は、黙って消えると「載せ忘れ」に見えるので一行断っておく
  const missing = cat.models.filter((m) => !records.some((r) => r.model === m.id));
  if (missing.length) {
    lines.push(`  <p class="ip-bb-missing">${missing.map((m) => escapeHtml(m.name)).join('・')}は、まだ板に出ているのを見ていません。見かけたら足します。</p>`);
  }
  lines.push('</div>');
  return lines.join('\n');
}

/** <title> / meta description / JSON-LD を目録に合わせる（H1 は触らない） */
function applySeo(html, cat) {
  let out = html;
  const title = `${cat.seo.title}${TITLE_SUFFIX}`;
  out = out.replace(/<title([^>]*)>[\s\S]*?<\/title>/i, (m, a) => `<title${a}>${escapeHtml(title)}</title>`);
  out = out.replace(/(<meta\s+name="description"\s+content=")([^"]*)(")/i, (m, a, _b, c) => a + escapeHtml(cat.seo.description) + c);
  out = out.replace(/(<meta\s+property="og:title"\s+content=")([^"]*)(")/i, (m, a, _b, c) => a + escapeHtml(cat.seo.title) + c);
  out = out.replace(/(<meta\s+property="og:description"\s+content=")([^"]*)(")/i, (m, a, _b, c) => a + escapeHtml(cat.seo.description) + c);
  out = out.replace(/(<meta\s+name="twitter:title"\s+content=")([^"]*)(")/i, (m, a, _b, c) => a + escapeHtml(cat.seo.title) + c);
  if (cat.hero) {
    const abs = SITE_ORIGIN + cat.hero.image;
    out = out.replace(/(<meta\s+property="og:image"\s+content=")([^"]*)(")/i, (m, a, _b, c) => a + abs + c);
    out = out.replace(/(<meta\s+name="twitter:image"\s+content=")([^"]*)(")/i, (m, a, _b, c) => a + abs + c);
  }

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: cat.seo.title,
    headline: cat.seo.title,
    description: cat.seo.description,
    url: SITE_ORIGIN + cat.page,
    inLanguage: 'ja',
    datePublished: cat.announced,
    // 買取記録を足した日も「更新」なので、公式価格の確認日と新しいほうを採る
    dateModified: [cat.priceCheckedAt, ...(cat.buyback?.records || []).map((r) => r.date)].filter(Boolean).sort().pop(),
    author: { '@type': 'Person', name: '田路昌也 (Toji Masaya)', url: SITE_ORIGIN + '/about.html' },
    publisher: { '@type': 'Person', name: '田路昌也 (Toji Masaya)' },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: cat.models.length,
      itemListElement: cat.models.map((m, i) => ({
        '@type': 'ListItem', position: i + 1, name: m.name, url: `${SITE_ORIGIN}${cat.page}#${m.id}`,
      })),
    },
  };
  out = out.replace(
    /(<script type="application\/ld\+json">\s*)\{[\s\S]*?\}(\s*<\/script>)/,
    (m, a, c) => a + JSON.stringify(ld) + c,
  );
  return out;
}

async function main() {
  const cat = await readJson(path.join(ROOT, SOURCE));

  const problems = [];
  const codes = cat.regions.map((r) => r.code);
  for (const m of cat.models) {
    for (const c of m.capacities) {
      for (const code of codes) {
        if (typeof c.prices[code] !== 'number') problems.push(`${m.id} ${c.size}: ${code} の価格が要ります`);
      }
    }
  }
  for (const r of cat.buyback?.records || []) {
    const model = cat.models.find((m) => m.id === r.model);
    if (!model) problems.push(`買取記録: model "${r.model}" は models にありません`);
    else if (!model.capacities.some((c) => c.size === r.capacity)) {
      problems.push(`買取記録 ${r.model}: capacity "${r.capacity}" は models にありません`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date || '')) problems.push(`買取記録: date は YYYY-MM-DD で（${r.date}）`);
    if (typeof r.price !== 'number') problems.push(`買取記録 ${r.date}: price は数値で`);
    if (r.priceHigh !== undefined && !(typeof r.priceHigh === 'number' && r.priceHigh >= r.price)) {
      problems.push(`買取記録 ${r.date} ${r.model} ${r.capacity}: priceHigh は price 以上の数値で`);
    }
  }
  if (problems.length) {
    console.error(`${SOURCE} に問題があります:`);
    for (const x of problems) console.error('  - ' + x);
    process.exit(1);
  }

  const rel = cat.page.replace(/^\//, '');
  const file = path.join(ROOT, rel);
  const before = await fs.readFile(file, 'utf8');
  let html = before;
  html = putBlock(html, 'hero', heroBlock(cat));
  html = putBlock(html, 'summary', summaryBlock(cat));
  html = putBlock(html, 'prices', pricesBlock(cat));
  html = putBlock(html, 'buyback', buybackBlock(cat));
  html = applySeo(html, cat);

  const changed = html !== before;
  if (changed && !CHECK_ONLY) await writeIfChanged(file, html);

  const configs = cat.models.reduce((n, m) => n + m.capacities.length, 0);
  console.log(`${CHECK_ONLY ? '[check] ' : ''}${cat.generation}: ${cat.models.length} モデル / ${configs} 構成 / 買取記録 ${(cat.buyback?.records || []).length} 件`);
  console.log(`${CHECK_ONLY ? '差分のあるファイル' : '書き込んだファイル'}: ${changed ? 1 : 0}`);
  if (changed) console.log('  - ' + rel);
  if (CHECK_ONLY && changed) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
