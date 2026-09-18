// tools/build-iphone-prices.mjs — 香港版 iPhone の2ページを data/iphone-prices.json から組み直す
//
//   node tools/build-iphone-prices.mjs           … 生成して書き込む
//   node tools/build-iphone-prices.mjs --check   … 差分の有無だけ見る（差分があれば exit 2）
//
// 出力先は次の2ファイルのマーカー区間。中身は手で編集しない。
//
// iphone18-price.html（アップル公式価格の比較）
//   <!-- iphone:hero:start -->…       ヒーローの写真
//   <!-- iphone:summary:start -->…    早見表と為替の前提
//   <!-- iphone:prices:start -->…     モデル別の価格表
//   <!-- iphone:buyback:start -->…    買取ページへの案内（板そのものは向こうにある）
//
// iphone18-buyback.html（先達廣場の買取価格・buyback.page で指定）
//   <!-- iphone:hero:start -->…       ヒーローの写真
//   <!-- iphone:bbsummary:start -->…  いちばん新しい日の要約
//   <!-- iphone:boards:start -->…     日付 → 店 → モデルの順に、板の一覧をそのまま
//
// <title> / meta description / JSON-LD も seo から差し替える。
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

/** 「+HK$2,501」「+HK$2,501 〜 +2,551」。幅が出るのは色で値が違うとき。 */
function gapText(lo, hi) {
  const one = (n) => (n >= 0 ? '+' : '−') + hkd(Math.abs(n));
  return lo === hi ? one(lo) : `${one(lo)} 〜 ${one(hi).replace('HK$', '')}`;
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
function heroBlock(h) {
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

/** 日付の新しい順。同じ日の板は JSON に書いた順のまま（先に見た店が先）。 */
function sortedBoards(cat) {
  const boards = (cat.buyback && cat.buyback.boards) || [];
  return boards
    .map((b, i) => ({ b, i }))
    .sort((x, y) => (x.b.date < y.b.date ? 1 : x.b.date > y.b.date ? -1 : x.i - y.i))
    .map((x) => x.b);
}

/** その板に実際に値が入っている色だけを列にする（銀だけ聞いた日は銀の列だけ出る）。 */
function boardColors(cat, board) {
  const all = (cat.buyback && cat.buyback.colors) || [];
  const used = new Set();
  for (const m of board.models || []) {
    for (const r of m.rows || []) {
      for (const [k, v] of Object.entries(r.prices || {})) if (typeof v === 'number') used.add(k);
    }
  }
  return all.filter((c) => used.has(c.key));
}

/** 渡した板ぜんぶから、モデルごとの「アップル公式価格との差」の幅を出す。 */
function gapSpread(cat, boards) {
  const out = new Map();
  for (const board of boards) {
    for (const m of board.models || []) {
      for (const r of m.rows || []) {
        const retail = retailPrice(cat, m.id, r.size);
        if (retail == null) continue;
        for (const v of Object.values(r.prices || {})) {
          if (typeof v !== 'number') continue;
          const gap = v - retail;
          const cur = out.get(m.id);
          out.set(m.id, cur ? { min: Math.min(cur.min, gap), max: Math.max(cur.max, gap) } : { min: gap, max: gap });
        }
      }
    }
  }
  return out;
}

/** 価格ページ側。板そのものは買取ページにあるので、ここは要約とリンクだけ。 */
function buybackBlock(cat) {
  const bb = cat.buyback || {};
  const boards = sortedBoards(cat);
  const lines = [];
  lines.push('<div class="ip-buyback">');
  lines.push('  <p class="ip-buyback-note">旺角の先達廣場で店頭に出ている買取価格の板は、別のページに店ごと・日付ごとにまとめています。</p>');
  if (boards.length) {
    const latest = boards[0].date;
    const sameDay = boards.filter((b) => b.date === latest);
    const spread = gapSpread(cat, sameDay);
    const bits = cat.models
      .filter((m) => spread.has(m.id))
      .map((m) => `${escapeHtml(m.name)} は ${gapText(spread.get(m.id).min, spread.get(m.id).max)}`);
    lines.push(
      `  <p class="ip-bb-line">いちばん新しいのは <time datetime="${latest}">${formatDate(latest, 'hk')}</time>` +
        `${latest === cat.released ? '（発売日）' : ''}、${sameDay.length}店ぶんの板です。` +
        `${bits.length ? `アップル公式価格と比べると、${bits.join('、')}。` : ''}</p>`,
    );
  } else {
    lines.push('  <p class="ip-bb-line">まだ板を控えていません。先達廣場で見かけ次第、店と日付ごとに足していきます。</p>');
  }
  lines.push(
    `  <p class="ip-bb-cta-wrap"><a class="ip-bb-cta" href="${bb.page || '/iphone18-buyback.html'}"` +
      ' data-growth-label="iphone_price_to_buyback">店ごとの買取価格を見る →</a></p>',
  );
  lines.push('</div>');
  return lines.join('\n');
}

/** 買取ページの頭。いちばん新しい日の板を一行で掴めるように。 */
function bbSummaryBlock(cat) {
  const bb = cat.buyback || {};
  const boards = sortedBoards(cat);
  const lines = [];
  lines.push('<div class="bb-summary">');
  if (!boards.length) {
    lines.push('  <p class="bb-empty">まだ板を控えていません。先達廣場で見かけ次第、店と日付ごとにここへ足していきます。</p>');
    lines.push('</div>');
    return lines.join('\n');
  }
  const latest = boards[0].date;
  const sameDay = boards.filter((b) => b.date === latest);
  const spread = gapSpread(cat, sameDay);
  const condLabel = new Map((bb.conditions || []).map((c) => [c.key, c.label]));
  const conds = [...new Set(sameDay.map((b) => condLabel.get(b.condition) || b.condition).filter(Boolean))];
  const usdGap = (n) => (n >= 0 ? '+' : '−') + usdOf(Math.abs(n), cat.rates);

  lines.push('  <div class="bb-cards">');
  lines.push('    <div class="bb-card">');
  lines.push('      <span class="bb-card-label">いちばん新しい板</span>');
  lines.push(
    `      <strong class="bb-card-value"><time datetime="${latest}">${formatDate(latest, 'hk')}</time>` +
      `${latest === cat.released ? '（発売日）' : ''}</strong>`,
  );
  lines.push(`      <span class="bb-card-note">${sameDay.length}店ぶん${conds.length ? '・' + conds.map(escapeHtml).join('／') : ''}</span>`);
  lines.push('    </div>');
  for (const m of cat.models) {
    const s = spread.get(m.id);
    if (!s) continue;
    lines.push('    <div class="bb-card">');
    lines.push(`      <span class="bb-card-label">${escapeHtml(m.name)}</span>`);
    lines.push(`      <strong class="bb-card-value ${s.min >= 0 ? 'is-up' : 'is-down'}">${gapText(s.min, s.max)}</strong>`);
    // 差が小さいと「≈ +US$0」になって役に立たないので、両端とも1ドル以上のときだけ添える
    const usdWorth = cat.rates.USD && Math.abs(s.min) >= cat.rates.USD / 2 && Math.abs(s.max) >= cat.rates.USD / 2;
    if (usdWorth) {
      lines.push(`      <span class="bb-card-usd">≈ ${usdGap(s.min)}${s.min === s.max ? '' : ` 〜 ${usdGap(s.max)}`}</span>`);
    }
    lines.push('      <span class="bb-card-note">アップル公式価格との差</span>');
    lines.push('    </div>');
  }
  lines.push('  </div>');
  lines.push('</div>');
  return lines.join('\n');
}

/** 買取ページの本体。日付 → 店 → モデルの順に、板の一覧をそのまま並べる。 */
function boardsBlock(cat) {
  const bb = cat.buyback || {};
  const boards = sortedBoards(cat);
  const byModel = new Map(cat.models.map((m) => [m.id, m]));
  const condLabel = new Map((bb.conditions || []).map((c) => [c.key, c.label]));
  const lines = [];
  if (bb.note) lines.push(`<p class="bb-note">${escapeHtml(bb.note)}</p>`);
  if (!boards.length) {
    lines.push('<p class="bb-empty">まだ板を控えていません。先達廣場で見かけ次第、店と日付ごとにここへ足していきます。</p>');
    return lines.join('\n');
  }

  // 同じ日の板は一つの見出しの下にまとめる（店ごとの違いが並んで見えるように）
  const days = [];
  for (const b of boards) {
    const last = days[days.length - 1];
    if (last && last.date === b.date) last.boards.push(b);
    else days.push({ date: b.date, boards: [b] });
  }

  for (const day of days) {
    lines.push(`<section class="bb-day" aria-labelledby="d${day.date}">`);
    lines.push(
      `  <h3 class="bb-day-title" id="d${day.date}">` +
        `<span><time datetime="${day.date}">${formatDate(day.date, 'hk')}</time>の板</span>` +
        `${day.date === cat.released ? '<span class="bb-tag">発売日</span>' : ''}</h3>`,
    );
    for (const board of day.boards) {
      const colors = boardColors(cat, board);
      lines.push('  <section class="bb-shop">');
      lines.push('    <header class="bb-shop-head">');
      lines.push(`      <h4 class="bb-shop-name">${escapeHtml(board.shop || bb.place || '先達廣場')}</h4>`);
      const cond = condLabel.get(board.condition) || board.condition;
      if (cond) lines.push(`      <span class="bb-cond">${escapeHtml(cond)}</span>`);
      lines.push('    </header>');
      for (const note of [board.shopNote, board.note].filter(Boolean)) {
        lines.push(`    <p class="bb-shop-note">${escapeHtml(note)}</p>`);
      }
      for (const m of board.models || []) {
        const model = byModel.get(m.id);
        lines.push(`    <h5 class="bb-model">${escapeHtml(model ? model.name : m.id)}</h5>`);
        lines.push('    <table class="bb-table">');
        lines.push('      <thead>');
        lines.push('        <tr>');
        lines.push('          <th scope="col" class="bb-cap-col">容量</th>');
        for (const c of colors) {
          lines.push(
            `          <th scope="col" class="bb-col bb-col--${escapeHtml(c.key)}">${escapeHtml(c.label)}` +
              `${c.ja ? `<span class="bb-col-ja">${escapeHtml(c.ja)}</span>` : ''}</th>`,
          );
        }
        lines.push('          <th scope="col">アップル公式</th>');
        lines.push('          <th scope="col">公式との差</th>');
        lines.push('        </tr>');
        lines.push('      </thead>');
        lines.push('      <tbody>');
        for (const r of m.rows || []) {
          const retail = retailPrice(cat, m.id, r.size);
          const vals = colors.map((c) => r.prices[c.key]).filter((v) => typeof v === 'number');
          const top = vals.length ? Math.max(...vals) : null;
          const marks = vals.length > 1 && new Set(vals).size > 1;
          lines.push('        <tr>');
          lines.push(`          <th scope="row">${escapeHtml(r.size)}</th>`);
          for (const c of colors) {
            const v = r.prices[c.key];
            if (typeof v !== 'number') {
              lines.push(`          <td data-label="${escapeHtml(c.label)}" class="bb-na">—</td>`);
              continue;
            }
            const cls = marks && v === top ? ' class="is-top"' : '';
            lines.push(`          <td data-label="${escapeHtml(c.label)}"${cls}>${yen(v)}</td>`);
          }
          lines.push(`          <td data-label="アップル公式" class="bb-official">${retail != null ? yen(retail) : '—'}</td>`);
          if (retail != null && vals.length) {
            const lo = Math.min(...vals) - retail;
            const hi = Math.max(...vals) - retail;
            lines.push(`          <td data-label="公式との差" class="bb-gap ${lo >= 0 ? 'is-up' : 'is-down'}">${gapText(lo, hi)}</td>`);
          } else {
            lines.push('          <td data-label="公式との差" class="bb-na">—</td>');
          }
          lines.push('        </tr>');
        }
        lines.push('      </tbody>');
        lines.push('    </table>');
      }
      lines.push('  </section>');
    }
    // その日、板に出ていなかった機種は黙って消えると載せ忘れに見えるので断っておく
    const seen = new Set(day.boards.flatMap((b) => (b.models || []).map((m) => m.id)));
    const missing = cat.models.filter((m) => !seen.has(m.id));
    if (missing.length) {
      lines.push(`  <p class="bb-missing">${missing.map((m) => escapeHtml(m.name)).join('・')}は、この日の板には出ていませんでした。</p>`);
    }
    lines.push('</section>');
  }

  lines.push(
    '<p class="bb-unit">金額はすべて香港ドル。「アップル公式」は香港のアップルストアの表示価格で、' +
      '「公式との差」は買取のほうが高ければプラスです。' +
      (cat.rates.USD ? `1米ドル = ${cat.rates.USD} HKD（${formatDate(cat.rates.usdAsOf || cat.rates.asOf, 'hk')}時点）。` : '') +
      '薄く塗ってあるのは、その容量でいちばん高い色です。</p>',
  );
  return lines.join('\n');
}

/** <title> / meta description / JSON-LD を目録に合わせる（H1 は触らない） */
function applySeo(html, cat, page) {
  let out = html;
  const seo = page.seo;
  const title = `${seo.title}${TITLE_SUFFIX}`;
  out = out.replace(/<title([^>]*)>[\s\S]*?<\/title>/i, (m, a) => `<title${a}>${escapeHtml(title)}</title>`);
  out = out.replace(/(<meta\s+name="description"\s+content=")([^"]*)(")/i, (m, a, _b, c) => a + escapeHtml(seo.description) + c);
  out = out.replace(/(<meta\s+property="og:title"\s+content=")([^"]*)(")/i, (m, a, _b, c) => a + escapeHtml(seo.title) + c);
  out = out.replace(/(<meta\s+property="og:description"\s+content=")([^"]*)(")/i, (m, a, _b, c) => a + escapeHtml(seo.description) + c);
  out = out.replace(/(<meta\s+name="twitter:title"\s+content=")([^"]*)(")/i, (m, a, _b, c) => a + escapeHtml(seo.title) + c);
  if (page.hero) {
    const abs = SITE_ORIGIN + page.hero.image;
    out = out.replace(/(<meta\s+property="og:image"\s+content=")([^"]*)(")/i, (m, a, _b, c) => a + abs + c);
    out = out.replace(/(<meta\s+name="twitter:image"\s+content=")([^"]*)(")/i, (m, a, _b, c) => a + abs + c);
  }

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: seo.title,
    headline: seo.title,
    description: seo.description,
    url: SITE_ORIGIN + page.path,
    inLanguage: 'ja',
    datePublished: page.published,
    dateModified: page.modified,
    author: { '@type': 'Person', name: '田路昌也 (Toji Masaya)', url: SITE_ORIGIN + '/about.html' },
    publisher: { '@type': 'Person', name: '田路昌也 (Toji Masaya)' },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: page.items.length,
      itemListElement: page.items.map((it, i) => ({
        '@type': 'ListItem', position: i + 1, name: it.name, url: `${SITE_ORIGIN}${page.path}#${it.anchor}`,
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
  const colorKeys = new Set(((cat.buyback || {}).colors || []).map((c) => c.key));
  for (const board of (cat.buyback || {}).boards || []) {
    const where = `買取の板 ${board.date || '(日付なし)'} ${board.shop || ''}`.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(board.date || '')) problems.push(`${where}: date は YYYY-MM-DD で`);
    if (!(board.models || []).length) problems.push(`${where}: models が空です`);
    for (const m of board.models || []) {
      const model = cat.models.find((x) => x.id === m.id);
      if (!model) { problems.push(`${where}: model "${m.id}" は models にありません`); continue; }
      if (!(m.rows || []).length) problems.push(`${where} ${m.id}: rows が空です`);
      for (const r of m.rows || []) {
        if (!model.capacities.some((c) => c.size === r.size)) {
          problems.push(`${where} ${m.id}: capacity "${r.size}" は models にありません`);
        }
        const entries = Object.entries(r.prices || {});
        if (!entries.length) problems.push(`${where} ${m.id} ${r.size}: prices が空です`);
        for (const [k, v] of entries) {
          if (!colorKeys.has(k)) problems.push(`${where} ${m.id} ${r.size}: 色 "${k}" は buyback.colors にありません`);
          if (typeof v !== 'number') problems.push(`${where} ${m.id} ${r.size} ${k}: 価格は数値で`);
        }
      }
    }
  }
  if (problems.length) {
    console.error(`${SOURCE} に問題があります:`);
    for (const x of problems) console.error('  - ' + x);
    process.exit(1);
  }

  const boards = sortedBoards(cat);
  const lastBoardDate = boards.length ? boards[0].date : null;
  const written = [];

  // 1) アップル公式価格の比較ページ
  const pricePage = {
    path: cat.page,
    seo: cat.seo,
    hero: cat.hero,
    published: cat.announced,
    // 買取の要約もこのページに出るので、板を足した日も「更新」に数える
    modified: [cat.priceCheckedAt, lastBoardDate].filter(Boolean).sort().pop(),
    items: cat.models.map((m) => ({ name: m.name, anchor: m.id })),
  };
  const priceBlocks = (html) => {
    let out = putBlock(html, 'hero', heroBlock(cat.hero));
    out = putBlock(out, 'summary', summaryBlock(cat));
    out = putBlock(out, 'prices', pricesBlock(cat));
    out = putBlock(out, 'buyback', buybackBlock(cat));
    return out;
  };
  if (await renderPage(pricePage, priceBlocks, cat)) written.push(pricePage.path);

  // 2) 先達廣場の買取価格ページ
  const bp = cat.buybackPage;
  if (bp) {
    const buybackPage = {
      path: (cat.buyback || {}).page,
      seo: bp.seo,
      hero: bp.hero,
      published: boards.length ? boards[boards.length - 1].date : cat.announced,
      modified: lastBoardDate || cat.priceCheckedAt,
      items: [...new Set(boards.map((b) => b.date))].map((d) => ({ name: `${formatDate(d, 'hk')}の板`, anchor: `d${d}` })),
    };
    const bbBlocks = (html) => {
      let out = putBlock(html, 'hero', heroBlock(bp.hero));
      out = putBlock(out, 'bbsummary', bbSummaryBlock(cat));
      out = putBlock(out, 'boards', boardsBlock(cat));
      return out;
    };
    if (await renderPage(buybackPage, bbBlocks, cat)) written.push(buybackPage.path);
  }

  const configs = cat.models.reduce((n, m) => n + m.capacities.length, 0);
  const cells = boards.reduce(
    (n, b) => n + (b.models || []).reduce((k, m) => k + (m.rows || []).reduce((j, r) => j + Object.keys(r.prices || {}).length, 0), 0),
    0,
  );
  console.log(`${CHECK_ONLY ? '[check] ' : ''}${cat.generation}: ${cat.models.length} モデル / ${configs} 構成 / 買取の板 ${boards.length} 枚（${cells} 値）`);
  console.log(`${CHECK_ONLY ? '差分のあるファイル' : '書き込んだファイル'}: ${written.length}`);
  for (const w of written) console.log('  - ' + w.replace(/^\//, ''));
  if (CHECK_ONLY && written.length) process.exitCode = 2;
}

/** 1ページぶんを組み直す。差分があれば true。 */
async function renderPage(page, fill, cat) {
  const file = path.join(ROOT, page.path.replace(/^\//, ''));
  const before = await fs.readFile(file, 'utf8');
  const html = applySeo(fill(before), cat, page);
  const changed = html !== before;
  if (changed && !CHECK_ONLY) await writeIfChanged(file, html);
  return changed;
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
