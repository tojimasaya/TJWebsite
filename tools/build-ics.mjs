// tools/build-ics.mjs — 祝日カレンダーの ICS を作る（提案 3 / Phase 4）
//
//   node tools/build-ics.mjs           … calendars/*.ics を生成し、holidays.html の導線を更新
//   node tools/build-ics.mjs --check   … 差分の有無だけ見る（差分があれば exit 2）
//
// 入力: data/holidays-2026.json, data/holidays-2027.json
//   { year, updated, regions: { hk: { label, color, days: {"2026-01-01": "元日"}, workdays: {...} } } }
// 出力: calendars/{region}.ics（年をまとめた 1 本）と holidays.html のマーカー区間
//   <!-- holidays:ics:start -->…<!-- holidays:ics:end -->
//
// 中国の workdays（振替出勤日）は「出勤日」として同じカレンダーに入れる。
// DTSTAMP は JSON の updated を使うので、JSON を触らなければ ICS も変わらない。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml, readJson, writeIfChanged, replaceMarkerBlock } from './lib/html.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = 'calendars';
const YEARS = [2026, 2027];
const PAGE = 'holidays.html';
const CHECK_ONLY = process.argv.includes('--check');

const REGION_ORDER = ['hk', 'cn', 'tw', 'jp', 'sg', 'us'];

function icsEscape(text) {
  return String(text ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** RFC 5545 の 75 オクテット折り返し */
function fold(line) {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const out = [];
  let start = 0;
  while (start < bytes.length) {
    let end = Math.min(start + (start === 0 ? 75 : 74), bytes.length);
    // マルチバイト文字の途中で切らない
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end -= 1;
    out.push((start === 0 ? '' : ' ') + bytes.slice(start, end).toString('utf8'));
    start = end;
  }
  return out.join('\r\n');
}

function nextDay(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const compact = (iso) => iso.replace(/-/g, '');

function event({ uid, date, summary, stamp }) {
  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${compact(stamp)}T000000Z`,
    `DTSTART;VALUE=DATE:${compact(date)}`,
    `DTEND;VALUE=DATE:${compact(nextDay(date))}`,
    `SUMMARY:${icsEscape(summary)}`,
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  ];
}

function calendar(regionKey, label, years, stamp) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//tojimasaya.com//holidays//JA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(`${label} 祝日カレンダー — tojimasaya.com`)}`,
    'X-WR-TIMEZONE:Asia/Hong_Kong',
    `X-WR-CALDESC:${icsEscape(`${label}の祝日（${years.map((y) => y.year).join('・')}）。出典と注記は https://tojimasaya.com/holidays.html`)}`,
  ];
  let count = 0;
  for (const { year, region } of years) {
    for (const [date, name] of Object.entries(region.days || {})) {
      lines.push(...event({ uid: `${regionKey}-${date}@tojimasaya.com`, date, summary: name, stamp }));
      count += 1;
    }
    for (const [date, name] of Object.entries(region.workdays || {})) {
      lines.push(...event({ uid: `${regionKey}-work-${date}@tojimasaya.com`, date, summary: `出勤日（振替）— ${name}`, stamp }));
      count += 1;
    }
    void year;
  }
  lines.push('END:VCALENDAR');
  return { text: lines.map(fold).join('\r\n') + '\r\n', count };
}

function linksBlock(items, updated) {
  const lines = [];
  lines.push('<section class="ics-download" aria-labelledby="ics-download-title">');
  lines.push('  <h2 id="ics-download-title">カレンダーに取り込む</h2>');
  lines.push(`  <p class="ics-download-lead">地域ごとの .ics ファイルです。ダウンロードして開けば、お使いのカレンダー（macOS・Google・Outlook）に取り込めます。中国は振替出勤日も「出勤日」として入っています。最終更新 ${updated}。</p>`);
  lines.push('  <div class="ics-download-links">');
  for (const it of items) {
    lines.push(`    <a href="/${OUT_DIR}/${it.key}.ics" download data-growth-label="holidays_ics_${it.key}">${escapeHtml(it.label)}<span>${it.count} 件</span></a>`);
  }
  lines.push('  </div>');
  lines.push('  <p class="ics-download-note">取り込んだ予定は自動では更新されません。制度の変更や翌年分の追加があったときは、新しいファイルを取り込み直してください。</p>');
  lines.push('</section>');
  return lines.join('\n');
}

async function main() {
  const data = [];
  for (const year of YEARS) {
    data.push({ year, json: await readJson(path.join(ROOT, `data/holidays-${year}.json`)) });
  }
  const stamp = data.map((d) => d.json.updated).filter(Boolean).sort().pop() || '2026-01-01';

  const written = [];
  const out = async (rel, content) => {
    const cur = await fs.readFile(path.join(ROOT, rel), 'utf8').catch(() => null);
    if (cur === content) return;
    written.push(rel);
    if (!CHECK_ONLY) await writeIfChanged(path.join(ROOT, rel), content);
  };

  const items = [];
  for (const key of REGION_ORDER) {
    const years = data
      .filter((d) => d.json.regions && d.json.regions[key])
      .map((d) => ({ year: d.year, region: d.json.regions[key] }));
    if (!years.length) continue;
    const label = years[0].region.label || key;
    const { text, count } = calendar(key, label, years, stamp);
    await out(`${OUT_DIR}/${key}.ics`, text);
    items.push({ key, label, count });
  }

  // holidays.html のダウンロード導線
  const pageHtml = await fs.readFile(path.join(ROOT, PAGE), 'utf8');
  if (pageHtml.includes('<!-- holidays:ics:start -->')) {
    await out(PAGE, replaceMarkerBlock(pageHtml, 'holidays:ics', linksBlock(items, stamp)));
  } else {
    console.warn(`注意: ${PAGE} に <!-- holidays:ics:start --> が無いのでダウンロード導線を入れていません`);
  }

  console.log(`${CHECK_ONLY ? '[check] ' : ''}ICS: ${items.length} 地域（${items.map((i) => `${i.label} ${i.count}件`).join(' / ')}）`);
  console.log(`${CHECK_ONLY ? '差分のあるファイル' : '書き込んだファイル'}: ${written.length}`);
  for (const f of written) console.log('  - ' + f);
  if (CHECK_ONLY && written.length) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
