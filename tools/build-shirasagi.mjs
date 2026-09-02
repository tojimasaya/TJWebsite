#!/usr/bin/env node
// tools/build-shirasagi.mjs — 白鷺三十六景「一景一頁」ジェネレーター
//
// 入力: assets/images/shirasagi/photos.json（JA）, photos-en.json, photos-hk.json
// 出力: shirasagi36/noNN.html / noNN-en.html / noNN-hk.html（NN はゼロ埋め 2 桁。JSON にある番号だけ）
//       shirasagi36/index.html（hub へのリダイレクト）
//       data/shirasagi-latest.json（トップページ用の軽量 JSON）
//       sitemap.xml の <!-- shirasagi36:auto:start/end --> 区間
//       shirasagi36*.html（hub）の <!-- shirasagi36:links:start/end --> 区間（マーカーがあるときだけ）
// 使い方: node tools/build-shirasagi.mjs        （--check で書き込みせず差分だけ報告）
//
// 文章（title / subtitle / summary / story / tips）は JSON のものをそのまま使う。書き換えない。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SITE_ORIGIN, escapeHtml, paragraphs, truncate, pad2, kanjiView, parseDate, isoJst, nowIso, todayIso,
  formatDate, renderTemplate, replaceMarkerBlock, imageSize, readJson, writeIfChanged, fileExists,
} from './lib/html.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSET_DIR = 'assets/images/shirasagi';
const OUT_DIR = 'shirasagi36';
const TOTAL_VIEWS = 36;
const CHECK_ONLY = process.argv.includes('--check');

/* ---------------- 言語別の文言 ---------------- */

const LANGS = {
  ja: {
    code: 'ja', htmlLang: 'ja', suffix: '', ogLocale: 'ja_JP', commentsLang: 'ja',
    hub: '/shirasagi36.html', about: '/about.html',
    fonts: 'https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500&family=Noto+Serif+JP:wght@300;500;700&family=Shippori+Mincho:wght@400;500;700&display=swap',
    siteName: '白鷺三十六景', hubShort: '白鷺三十六景',
    nav: { hub: '白鷺三十六景', hongkong: '香港', handbook: 'ハンドブック', trips: '旅', label: 'メインナビゲーション', breadcrumb: 'パンくず' },
    seasons: { spring: '春', summer: '夏', autumn: '秋', winter: '冬' },
    times: { morning: '朝', day: '昼', afternoon: '午後', evening: '夕方', night: '夜' },
    seasonTime: (s, t) => (t ? `${s}の${t}` : s),
    labels: { season: '季節', time: '時間帯', date: '撮影日', gear: '機材', place: '場所' },
    unknown: '—', unknownPlace: '姫路城周辺',
    undisclosed: /非公開/,
    title: (v) => (v.placeForTitle
      ? `${v.kanjiNo}「${v.title}」— 姫路城の撮影スポット：${v.placeForTitle} | 白鷺三十六景`
      : `${v.kanjiNo}「${v.title}」— 姫路城の撮影スポット | 白鷺三十六景`),
    ogTitle: (v) => `${v.kanjiNo}「${v.title}」— 白鷺三十六景`,
    shareTitle: (v) => `${v.kanjiNo}「${v.title}」— 白鷺三十六景 / 姫路城`,
    eyebrow: (v) => `白鷺三十六景 — No.${v.nn}`,
    crumb: (v) => v.kanjiNo,
    alt: (v) => `姫路城 — ${v.kanjiNo} ${v.title}（${v.placeLabel}から、${v.seasonTime}）`,
    imageName: (v) => `姫路城 — ${v.kanjiNo} ${v.title}`,
    descLen: 120,
    h: { story: '物語', tips: '撮影のヒント', place: 'ここで撮る', related: '同じ季節の景', share: 'この景を共有', prevNext: '前後の景' },
    storyMissing: '', storyReadJa: '',
    btn: { gmaps: 'Googleマップで開く', mapPage: '撮影地マップで見る', mapPageAll: '撮影地マップ', backHub: '白鷺三十六景の一覧へ戻る', prev: '前の景', next: '次の景', hubEnd: '一覧へ', copy: 'リンクをコピー', copied: 'コピーしました', share: '共有', license: '写真の利用について' },
    mapLoading: '地図を読み込み中…', castle: '姫路城', mapAria: (v) => `${v.placeLabel}の地図`,
    comments: { heading: 'コメント', intro: 'この景の撮影地や季節の情報、みなさんの一枚の話をどうぞ。名前だけで匿名投稿できます（承認後に公開されます）。' },
    credit: 'Photo: Toji Masaya',
    linksHeading: '全景一覧', linksNote: '各景のページ（写真・物語・撮影のヒント・地図）',
  },
  en: {
    code: 'en', htmlLang: 'en', suffix: '-en', ogLocale: 'en_US', commentsLang: 'en',
    hub: '/shirasagi36-en.html', about: '/about-en.html',
    fonts: 'https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500&family=Noto+Serif+JP:wght@300;500;700&display=swap',
    siteName: '36 Views of White Heron Castle', hubShort: '36 Views',
    nav: { hub: '36 Views', hongkong: 'Hong Kong', handbook: 'Handbook', trips: 'Trips', label: 'Main navigation', breadcrumb: 'Breadcrumb' },
    seasons: { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' },
    times: { morning: 'Morning', day: 'Daytime', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' },
    seasonTime: (s, t) => (t ? `${s.toLowerCase()} ${t.toLowerCase()}` : s.toLowerCase()),
    labels: { season: 'Season', time: 'Time of day', date: 'Date', gear: 'Gear', place: 'Location' },
    unknown: '—', unknownPlace: 'Around Himeji Castle',
    undisclosed: /undisclosed/i,
    title: (v) => (v.placeForTitle
      ? `View ${v.n} “${v.title}” — Himeji Castle Photo Spot: ${v.placeForTitle} | 36 Views of White Heron Castle`
      : `View ${v.n} “${v.title}” — Himeji Castle Photo Spot | 36 Views of White Heron Castle`),
    ogTitle: (v) => `View ${v.n}: ${v.title} — 36 Views of White Heron Castle`,
    shareTitle: (v) => `View ${v.n}: ${v.title} — 36 Views of White Heron Castle (Himeji)`,
    eyebrow: (v) => `36 Views of White Heron Castle — No.${v.nn}`,
    crumb: (v) => `View ${v.n}`,
    alt: (v) => `Himeji Castle — View ${v.n}: ${v.title} (from ${v.placeLabel}, ${v.seasonTime})`,
    imageName: (v) => `Himeji Castle — View ${v.n}: ${v.title}`,
    descLen: 155,
    h: { story: 'The Story', tips: 'Photo Tips', place: 'Shoot It Here', related: 'More from this season', share: 'Share this view', prevNext: 'Previous and next views' },
    storyMissing: 'The full story for this view has not been translated yet.', storyReadJa: 'Read it in Japanese →',
    btn: { gmaps: 'Open in Google Maps', mapPage: 'See this spot on the map', mapPageAll: 'Photo spot map', backHub: 'Back to the 36 Views', prev: 'Previous view', next: 'Next view', hubEnd: 'All views', copy: 'Copy link', copied: 'Copied', share: 'Share', license: 'Image licensing' },
    mapLoading: 'Loading map…', castle: 'Himeji Castle', mapAria: (v) => `Map of ${v.placeLabel}`,
    comments: { heading: 'Comments', intro: 'Notes on the spot, the season, or a photo of your own from here are welcome. A name is enough to post (comments appear after approval).' },
    credit: 'Photo: Toji Masaya',
    linksHeading: 'All views', linksNote: 'One page per view — photo, story, photo tips and map',
  },
  hk: {
    code: 'hk', htmlLang: 'zh-Hant', suffix: '-hk', ogLocale: 'zh_HK', commentsLang: 'zh-tw',
    hub: '/shirasagi36-hk.html', about: '/about-hk.html',
    fonts: 'https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500&family=Noto+Serif+JP:wght@300;500;700&family=Noto+Serif+TC:wght@300;500;700&display=swap',
    siteName: '白鷺三十六景', hubShort: '白鷺三十六景',
    nav: { hub: '白鷺三十六景', hongkong: '香港', handbook: '手冊', trips: '旅', label: '主導覽', breadcrumb: '導覽路徑' },
    seasons: { spring: '春', summer: '夏', autumn: '秋', winter: '冬' },
    times: { morning: '早晨', day: '白天', afternoon: '下午', evening: '傍晚', night: '夜晚' },
    seasonTime: (s, t) => (t ? `${s}季${t}` : `${s}季`),
    labels: { season: '季節', time: '時段', date: '拍攝日期', gear: '器材', place: '地點' },
    unknown: '—', unknownPlace: '姬路城周邊',
    undisclosed: /未公開|非公開/,
    title: (v) => (v.placeForTitle
      ? `${v.kanjiNo}「${v.title}」— 姬路城攝影景點：${v.placeForTitle} | 白鷺三十六景`
      : `${v.kanjiNo}「${v.title}」— 姬路城攝影景點 | 白鷺三十六景`),
    ogTitle: (v) => `${v.kanjiNo}「${v.title}」— 白鷺三十六景`,
    shareTitle: (v) => `${v.kanjiNo}「${v.title}」— 白鷺三十六景 / 姬路城`,
    eyebrow: (v) => `白鷺三十六景 — No.${v.nn}`,
    crumb: (v) => v.kanjiNo,
    alt: (v) => `姬路城 — ${v.kanjiNo} ${v.title}（從${v.placeLabel}拍攝，${v.seasonTime}）`,
    imageName: (v) => `姬路城 — ${v.kanjiNo} ${v.title}`,
    descLen: 110,
    h: { story: '故事', tips: '攝影提示', place: '在這裡拍', related: '同一季節的景', share: '分享此景', prevNext: '上一景與下一景' },
    storyMissing: '此景的完整故事尚未翻譯。', storyReadJa: '閱讀日文版 →',
    btn: { gmaps: '在 Google 地圖開啟', mapPage: '在拍攝地圖上查看', mapPageAll: '拍攝地圖', backHub: '返回白鷺三十六景', prev: '上一景', next: '下一景', hubEnd: '全部景', copy: '複製連結', copied: '已複製', share: '分享', license: '照片使用說明' },
    mapLoading: '地圖載入中…', castle: '姬路城', mapAria: (v) => `${v.placeLabel}的地圖`,
    comments: { heading: '留言', intro: '歡迎分享拍攝地點、季節資訊，或你在這裡拍下的一張照片。只需填寫名字即可留言（審核後公開）。' },
    credit: 'Photo: Toji Masaya',
    linksHeading: '全景一覽', linksNote: '每景一頁：照片、故事、攝影提示與地圖',
  },
};
const LANG_ORDER = ['ja', 'en', 'hk'];

/* ---------------- データ整形 ---------------- */

function seasonKeyOf(photo) {
  const key = String(photo.category || '').split(/\s+/)[0];
  if (['spring', 'summer', 'autumn', 'winter'].includes(key)) return key;
  if (key === 'sakura') return 'spring';
  const d = parseDate(photo.date);
  if (!d) return null;
  if (d.m >= 3 && d.m <= 5) return 'spring';
  if (d.m >= 6 && d.m <= 8) return 'summer';
  if (d.m >= 9 && d.m <= 11) return 'autumn';
  return 'winter';
}

function timeKeyOf(photo) {
  const key = String(photo.category || '').split(/\s+/)[1] || '';
  return ['morning', 'day', 'afternoon', 'evening', 'night'].includes(key) ? key : null;
}

function pageFile(nn, lang) {
  return `${OUT_DIR}/no${nn}${LANGS[lang].suffix}.html`;
}
function pageUrl(nn, lang) {
  return `${SITE_ORIGIN}/${pageFile(nn, lang)}`;
}
function pagePath(nn, lang) {
  return `/${pageFile(nn, lang)}`;
}

/** 言語ファイルの項目に JA をフォールバックさせた 1 景ぶんのデータ */
function pick(langData, jaData, id, lang) {
  const d = langData[id] || {};
  const j = jaData[id] || {};
  const get = (k) => (d[k] !== undefined && d[k] !== null && d[k] !== '' ? d[k] : j[k]);
  const story = lang === 'ja' ? j.story : d.story; // EN/HK は各言語ファイルの story（無ければ未翻訳扱い）
  return {
    title: get('title'), subtitle: get('subtitle'), date: get('date'), gear: get('gear'),
    category: get('category'), summary: get('summary'),
    tips: Array.isArray(d.tips) && d.tips.length ? d.tips : (j.tips || []),
    story: story || '', location: d.location || j.location || null, orientation: get('orientation') || 'landscape',
  };
}

/* ---------------- HTML 部品 ---------------- */

function thumbCard(view, lang, extraClass, dirLabel) {
  const d = view.data[lang];
  return `<a href="${pagePath(view.nn, lang)}" class="${extraClass}" data-growth-label="shirasagi_view_${extraClass === 'is-prev' ? 'prev' : 'next'}">` +
    `<img src="/${view.paths.thumb}" alt="" width="72" height="72" loading="lazy">` +
    `<span><span class="dir">${escapeHtml(dirLabel)} — No.${view.nn}</span><span class="ttl">${escapeHtml(d.title)}</span></span></a>`;
}

function relatedCard(view, lang) {
  const d = view.data[lang];
  return `        <a href="${pagePath(view.nn, lang)}" data-growth-label="shirasagi_view_related">` +
    `<img src="/${view.paths.thumb}" alt="${escapeHtml(d.title)}" width="${view.sizes.thumb.width}" height="${view.sizes.thumb.height}" loading="lazy">` +
    `<span class="cap"><span class="no">No.${view.nn}</span><span class="ttl">${escapeHtml(d.title)}</span></span></a>`;
}

function jsonLd(view, lang, v) {
  const L = LANGS[lang];
  const d = view.data[lang];
  const image = {
    '@type': 'ImageObject',
    '@id': `${v.canonical}#image`,
    contentUrl: `${SITE_ORIGIN}/${view.paths.jpg}`,
    thumbnailUrl: `${SITE_ORIGIN}/${view.paths.thumb}`,
    url: v.canonical,
    width: view.sizes.jpg.width,
    height: view.sizes.jpg.height,
    name: L.imageName(v),
    caption: d.subtitle || d.summary,
    description: d.summary,
    inLanguage: L.htmlLang,
    dateCreated: v.dateIsoDay,
    creator: { '@type': 'Person', name: '田路昌也 (Toji Masaya)', url: `${SITE_ORIGIN}/about.html` },
    creditText: 'Toji Masaya / tojimasaya.com',
    copyrightNotice: '© Toji Masaya',
    license: `${SITE_ORIGIN}/about.html#license`,
    acquireLicensePage: `${SITE_ORIGIN}/about.html#license`,
    keywords: ['姫路城', 'Himeji Castle', '白鷺城', 'White Heron Castle', '姬路城', '白鷺三十六景'].join(','),
  };
  if (view.hasCoords) {
    image.contentLocation = {
      '@type': 'Place',
      name: v.placeLabel,
      geo: { '@type': 'GeoCoordinates', latitude: view.lat, longitude: view.lng },
    };
  }
  const graph = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: L.siteName, item: `${SITE_ORIGIN}${L.hub}` },
        { '@type': 'ListItem', position: 3, name: `${v.kanjiNo} ${d.title}` },
      ],
    },
    {
      '@type': 'WebPage',
      '@id': v.canonical,
      url: v.canonical,
      name: v.pageTitle,
      description: v.description,
      inLanguage: L.htmlLang,
      datePublished: v.dateIso,
      dateModified: v.buildIso,
      isPartOf: { '@type': 'ImageGallery', name: L.siteName, url: `${SITE_ORIGIN}${L.hub}` },
      primaryImageOfPage: { '@id': image['@id'] },
      author: { '@type': 'Person', name: 'Toji Masaya', alternateName: '田路昌也', url: `${SITE_ORIGIN}/about.html` },
      about: { '@type': 'LandmarkOrHistoricalBuilding', name: '姫路城', alternateName: ['Himeji Castle', '白鷺城', 'White Heron Castle', '姬路城'], url: 'https://www.city.himeji.lg.jp/castle/' },
    },
    image,
  ];
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 1);
}

/* ---------------- 1 ページ ---------------- */

function buildPage(view, views, lang, template, buildIso) {
  const L = LANGS[lang];
  const d = view.data[lang];
  const idx = views.indexOf(view);
  const prev = views[idx - 1];
  const next = views[idx + 1];

  const seasonLabel = view.seasonKey ? L.seasons[view.seasonKey] : L.unknown;
  const timeLabel = view.timeKey ? L.times[view.timeKey] : L.unknown;
  const seasonTime = L.seasonTime(view.seasonKey ? L.seasons[view.seasonKey] : '', view.timeKey ? L.times[view.timeKey] : '');
  const rawPlace = d.location && d.location.name ? String(d.location.name).trim() : '';
  const placeLabel = rawPlace || L.unknownPlace;
  const placeForTitle = rawPlace && !L.undisclosed.test(rawPlace) ? rawPlace : '';

  const v = {
    n: view.n, nn: view.nn, kanjiNo: kanjiView(view.n), title: d.title, placeLabel, placeForTitle, seasonTime,
    canonical: pageUrl(view.nn, lang),
    dateIso: isoJst(d.date) || buildIso, dateIsoDay: (parseDate(d.date) || {}).iso || todayIso(), buildIso,
  };
  v.pageTitle = L.title(v);
  v.description = truncate(d.summary, L.descLen);

  const related = views
    .filter((o) => o !== view && o.seasonKey && o.seasonKey === view.seasonKey)
    .sort((a, b) => Math.abs(a.n - view.n) - Math.abs(b.n - view.n) || a.n - b.n)
    .slice(0, 3)
    .sort((a, b) => a.n - b.n);

  const tipsHtml = (d.tips || []).map((tip) =>
    `          <li><span class="icon" aria-hidden="true">${escapeHtml(tip.icon || '・')}</span><span><b>${escapeHtml(tip.label || '')}</b>${escapeHtml(tip.text || '')}</span></li>`
  ).join('\n');

  const hubEnd = (cls, label) => `<a href="${L.hub}#gallery-anchor" class="${cls} v-pn__empty">${escapeHtml(label)}</a>`;

  const data = {
    lang: L.htmlLang, ogLocale: L.ogLocale, commentsLang: L.commentsLang,
    isJa: lang === 'ja', isEn: lang === 'en', isHk: lang === 'hk',
    pageId: `shirasagi-no${view.nn}${L.suffix}`,
    pageTitle: v.pageTitle, description: v.description, canonical: v.canonical,
    urlJa: pageUrl(view.nn, 'ja'), urlEn: pageUrl(view.nn, 'en'), urlHk: pageUrl(view.nn, 'hk'),
    urlJaPath: pagePath(view.nn, 'ja'), urlEnPath: pagePath(view.nn, 'en'), urlHkPath: pagePath(view.nn, 'hk'),
    fontsHref: L.fonts,
    ogTitle: L.ogTitle(v), shareTitle: L.shareTitle(v),
    ogImage: `${SITE_ORIGIN}/${view.paths.jpg}`, ogImageWidth: view.sizes.jpg.width, ogImageHeight: view.sizes.jpg.height,
    alt: L.alt(v), dateIso: v.dateIso, dateIsoDay: v.dateIsoDay, buildIso, buildYear: buildIso.slice(0, 4),
    jsonLd: jsonLd(view, lang, v),
    hubUrl: L.hub, aboutUrl: L.about,
    t_siteName: L.siteName, t_hubShort: L.hubShort, t_navLabel: L.nav.label, t_breadcrumb: L.nav.breadcrumb,
    t_navHub: L.nav.hub, t_navHongkong: L.nav.hongkong, t_navHandbook: L.nav.handbook, t_navTrips: L.nav.trips,
    crumbLabel: L.crumb(v), eyebrow: L.eyebrow(v), kanjiNo: v.kanjiNo, no: view.n, nn: view.nn,
    title: d.title, subtitle: d.subtitle || '',
    isPortrait: d.orientation === 'portrait' || view.sizes.jpg.height > view.sizes.jpg.width,
    webpFull: `/${view.paths.full}`, jpg: `/${view.paths.jpg}`,
    imgWidth: view.sizes.full.width, imgHeight: view.sizes.full.height,
    captionLeft: placeLabel, captionRight: `${formatDate(d.date, lang)} · ${d.gear || ''} · ${L.credit}`,
    t_season: L.labels.season, t_time: L.labels.time, t_date: L.labels.date, t_gear: L.labels.gear, t_place: L.labels.place,
    seasonLabel, timeLabel, dateDisplay: formatDate(d.date, lang), gear: d.gear || '—', placeLabel,
    hasCoords: view.hasCoords, lat: view.lat, lng: view.lng,
    mapPageUrl: `/shirasagi36-map.html#no${view.nn}`,
    gmapsUrl: view.hasCoords ? `https://www.google.com/maps/search/?api=1&query=${view.lat},${view.lng}` : '',
    summary: d.summary,
    storyHtml: d.story ? paragraphs(d.story) : '',
    storyMissing: !d.story && lang !== 'ja' && Boolean(view.data.ja.story),
    t_story: L.h.story, t_storyMissing: L.storyMissing, t_storyReadJa: L.storyReadJa,
    tipsHtml, t_tips: L.h.tips,
    t_placeHeading: L.h.place, t_mapLoading: L.mapLoading, t_castle: L.castle, t_mapAria: L.mapAria(v),
    t_gmaps: L.btn.gmaps, t_mapPage: L.btn.mapPage, t_mapPageAll: L.btn.mapPageAll,
    t_share: L.h.share, t_copy: L.btn.copy, t_copied: L.btn.copied, t_nativeShare: L.btn.share,
    t_prevNext: L.h.prevNext,
    prevHtml: prev ? thumbCard(prev, lang, 'is-prev', L.btn.prev) : hubEnd('is-prev', L.btn.hubEnd),
    nextHtml: next ? thumbCard(next, lang, 'is-next', L.btn.next) : hubEnd('is-next', L.btn.hubEnd),
    relatedHtml: related.map((o) => relatedCard(o, lang)).join('\n'), t_related: L.h.related,
    t_backHub: L.btn.backHub,
    t_commentsHeading: L.comments.heading, t_commentsIntro: L.comments.intro,
    t_license: L.btn.license,
  };
  return { html: renderTemplate(template, data), meta: { file: pageFile(view.nn, lang), title: v.pageTitle, description: v.description } };
}

/* ---------------- 付随ファイル ---------------- */

function redirectIndex() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="robots" content="noindex, follow">
<meta http-equiv="refresh" content="0; url=/shirasagi36.html">
<link rel="canonical" href="https://tojimasaya.com/shirasagi36.html">
<title>白鷺三十六景 | Toji Masaya</title>
<meta name="description" content="白鷺三十六景の一覧ページへ移動します。">
</head>
<body>
<p><a href="/shirasagi36.html">白鷺三十六景の一覧へ</a></p>
<script src="/growth.js" defer></script>
</body>
</html>
`;
}

function latestJson(views, buildIso) {
  const byDate = [...views].sort((a, b) => (b.data.ja.date || '').localeCompare(a.data.ja.date || '') || b.n - a.n);
  const seasons = {};
  for (const v of views) if (v.seasonKey) seasons[v.seasonKey] = (seasons[v.seasonKey] || 0) + 1;
  const entry = (v) => ({
    no: v.n,
    nn: v.nn,
    title: v.data.ja.title,
    titleEn: v.data.en.title,
    titleHk: v.data.hk.title,
    date: (parseDate(v.data.ja.date) || {}).iso || null,
    season: v.seasonKey,
    place: (v.data.ja.location && v.data.ja.location.name) || null,
    url: pagePath(v.nn, 'ja'),
    urlEn: pagePath(v.nn, 'en'),
    urlHk: pagePath(v.nn, 'hk'),
    thumb: `/${v.paths.thumb}`,
    full: `/${v.paths.full}`,
  });
  return JSON.stringify({
    generatedAt: buildIso,
    total: TOTAL_VIEWS,
    count: views.length,
    remaining: Math.max(TOTAL_VIEWS - views.length, 0),
    seasons,
    hub: { ja: '/shirasagi36.html', en: '/shirasagi36-en.html', hk: '/shirasagi36-hk.html', map: '/shirasagi36-map.html' },
    latest: byDate.slice(0, 3).map(entry),
    views: views.map((v) => ({ no: v.n, title: v.data.ja.title, date: (parseDate(v.data.ja.date) || {}).iso || null, season: v.seasonKey, url: pagePath(v.nn, 'ja') })),
  }, null, 2) + '\n';
}

function sitemapBlock(views, lastmod) {
  const lines = [];
  lines.push('  <!-- 白鷺三十六景 一景ページ（tools/build-shirasagi.mjs が生成。手で編集しない） -->');
  for (const v of views) {
    for (const lang of LANG_ORDER) {
      const L = LANGS[lang];
      lines.push('  <url>');
      lines.push(`    <loc>${pageUrl(v.nn, lang)}</loc>`);
      lines.push(`    <xhtml:link rel="alternate" hreflang="ja" href="${pageUrl(v.nn, 'ja')}"/>`);
      lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${pageUrl(v.nn, 'en')}"/>`);
      lines.push(`    <xhtml:link rel="alternate" hreflang="zh-Hant" href="${pageUrl(v.nn, 'hk')}"/>`);
      lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(v.nn, 'ja')}"/>`);
      lines.push(`    <lastmod>${lastmod}</lastmod>`);
      lines.push('    <changefreq>monthly</changefreq>');
      lines.push(`    <priority>${lang === 'ja' ? '0.8' : '0.7'}</priority>`);
      lines.push('    <image:image>');
      lines.push(`      <image:loc>${SITE_ORIGIN}/${v.paths.jpg}</image:loc>`);
      lines.push(`      <image:title>${escapeHtml(L.imageName({ n: v.n, kanjiNo: kanjiView(v.n), title: v.data[lang].title }))}</image:title>`);
      lines.push('    </image:image>');
      lines.push('  </url>');
    }
  }
  return lines.join('\n');
}

function hubLinksBlock(views, lang) {
  const L = LANGS[lang];
  const groups = { spring: [], summer: [], autumn: [], winter: [], other: [] };
  for (const v of views) (groups[v.seasonKey] || groups.other).push(v);
  const parts = [];
  parts.push(`        <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-20" id="all-views" aria-label="${escapeHtml(L.linksHeading)}">`);
  parts.push('          <div class="border-t border-gray-300 pt-8">');
  parts.push('            <p class="text-[10px] md:text-xs font-serif-en tracking-[0.28em] text-shirasagi-blue uppercase mb-2">Index</p>');
  parts.push(`            <h3 class="text-lg md:text-xl font-bold text-shirasagi-ink mb-1">${escapeHtml(L.linksHeading)}</h3>`);
  parts.push(`            <p class="text-xs text-gray-500 mb-6">${escapeHtml(L.linksNote)}</p>`);
  parts.push('            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 text-sm">');
  for (const key of ['spring', 'summer', 'autumn', 'winter', 'other']) {
    const list = groups[key];
    if (!list.length) continue;
    const label = key === 'other' ? '—' : L.seasons[key];
    parts.push('              <div>');
    parts.push(`                <p class="text-[10px] tracking-[0.22em] text-gray-400 uppercase mb-2 font-serif-en">${escapeHtml(label)}</p>`);
    parts.push('                <ul class="space-y-1.5">');
    for (const v of list) {
      parts.push(`                  <li><a href="${pagePath(v.nn, lang)}" class="hover:text-shirasagi-blue transition-colors" data-growth-label="shirasagi_index_link"><span class="font-serif-en text-gray-400 mr-2">No.${v.nn}</span>${escapeHtml(v.data[lang].title)}</a></li>`);
    }
    parts.push('                </ul>');
    parts.push('              </div>');
  }
  parts.push('            </div>');
  parts.push('          </div>');
  parts.push('        </section>');
  return parts.join('\n');
}

/* ---------------- main ---------------- */

async function main() {
  const buildIso = nowIso();
  const today = todayIso();
  const ja = await readJson(path.join(ROOT, ASSET_DIR, 'photos.json'));
  const en = await readJson(path.join(ROOT, ASSET_DIR, 'photos-en.json'));
  const hk = await readJson(path.join(ROOT, ASSET_DIR, 'photos-hk.json'));
  const template = await fs.readFile(path.join(ROOT, 'tools/templates/shirasagi-view.html'), 'utf8');

  const ids = Object.keys(ja).map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_VIEWS).sort((a, b) => a - b);
  if (!ids.length) throw new Error('photos.json に景が見つかりません');

  const views = [];
  const problems = [];
  for (const n of ids) {
    const nn = pad2(n);
    const paths = { jpg: `${ASSET_DIR}/${nn}.jpg`, full: `${ASSET_DIR}/webp/full/${nn}.webp`, thumb: `${ASSET_DIR}/webp/thumb/${nn}.webp` };
    const before = problems.length;
    for (const p of Object.values(paths)) if (!await fileExists(path.join(ROOT, p))) problems.push(`No.${nn}: 画像がありません ${p}`);
    if (!ja[n].title || !ja[n].summary) problems.push(`No.${nn}: title / summary が空です`);
    if (!parseDate(ja[n].date)) problems.push(`No.${nn}: date "${ja[n].date}" を解釈できません（YYYY.MM.DD）`);
    if (!en[n]) problems.push(`No.${nn}: photos-en.json に項目がありません`);
    if (!hk[n]) problems.push(`No.${nn}: photos-hk.json に項目がありません`);
    if (problems.length > before) continue;
    const sizes = {
      jpg: await imageSize(path.join(ROOT, paths.jpg)),
      full: await imageSize(path.join(ROOT, paths.full)),
      thumb: await imageSize(path.join(ROOT, paths.thumb)),
    };
    for (const [k, s] of Object.entries(sizes)) if (!s) problems.push(`No.${nn}: ${k} の画像寸法を読めません`);
    const loc = ja[n].location || {};
    const hasCoords = typeof loc.lat === 'number' && typeof loc.lng === 'number';
    views.push({
      n, nn, paths, sizes, hasCoords,
      lat: hasCoords ? Number(loc.lat.toFixed(6)) : null,
      lng: hasCoords ? Number(loc.lng.toFixed(6)) : null,
      seasonKey: seasonKeyOf(ja[n]),
      timeKey: timeKeyOf(ja[n]),
      data: { ja: pick(ja, ja, n, 'ja'), en: pick(en, ja, n, 'en'), hk: pick(hk, ja, n, 'hk') },
    });
  }
  if (problems.length) {
    console.error('入力データに問題があります:');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }

  const written = [];
  // 生成時刻（article:modified_time / dateModified / generatedAt）以外に差分が無ければ書かない。
  // これで「JSON を触っていないのに 105 ページが毎回更新される」ことを防ぎ、sitemap の lastmod も安定する。
  const stripVolatile = (s) => String(s ?? '').replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g, '');
  const out = async (rel, content) => {
    const cur = await fs.readFile(path.join(ROOT, rel), 'utf8').catch(() => null);
    if (cur !== null && stripVolatile(cur) === stripVolatile(content)) return;
    written.push(rel);
    if (!CHECK_ONLY) await writeIfChanged(path.join(ROOT, rel), content);
  };

  // 1) 一景ページ
  for (const lang of LANG_ORDER) {
    for (const view of views) {
      const { html, meta } = buildPage(view, views, lang, template, buildIso);
      await out(meta.file, html);
    }
  }

  // JSON から消えた番号の古いページを検出 — 消しはしない。報告だけ。
  const existing = (await fs.readdir(path.join(ROOT, OUT_DIR)).catch(() => [])).filter((f) => /^no\d{2}(-en|-hk)?\.html$/.test(f));
  const expected = new Set(LANG_ORDER.flatMap((l) => views.map((v) => path.basename(pageFile(v.nn, l)))));
  const stale = existing.filter((f) => !expected.has(f));

  // 2) index.html（ディレクトリ直打ち → hub）
  await out(`${OUT_DIR}/index.html`, redirectIndex());

  // 3) トップページ用 JSON
  await out('data/shirasagi-latest.json', latestJson(views, buildIso));

  // 4) sitemap.xml のマーカー区間
  let sitemap = await fs.readFile(path.join(ROOT, 'sitemap.xml'), 'utf8');
  if (!/xmlns:image=/.test(sitemap)) {
    sitemap = sitemap.replace(/<urlset([^>]*)>/, (m, attrs) => `<urlset${attrs.replace(/\s*$/, '')}\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`);
  }
  // lastmod は「一景ページの内容が変わった日」。ページに差分が無ければ既存の lastmod を保つ（無駄な更新を避ける）
  const prevLastmod = sitemap.match(/<!-- shirasagi36:auto:start -->[\s\S]*?<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/)?.[1];
  const pagesChanged = written.some((f) => f.startsWith(`${OUT_DIR}/no`));
  const lastmod = pagesChanged || !prevLastmod ? today : prevLastmod;
  sitemap = replaceMarkerBlock(sitemap, 'shirasagi36:auto', sitemapBlock(views, lastmod), '</urlset>');
  await out('sitemap.xml', sitemap);

  // 5) hub の静的リンク一覧（マーカーがあるファイルだけ）
  for (const lang of LANG_ORDER) {
    const hubRel = LANGS[lang].hub.slice(1);
    const html = await fs.readFile(path.join(ROOT, hubRel), 'utf8').catch(() => null);
    if (!html) continue;
    if (!html.includes('<!-- shirasagi36:links:start -->')) {
      console.warn(`注意: ${hubRel} にマーカー <!-- shirasagi36:links:start --> が無いので全景一覧を挿入しません`);
      continue;
    }
    await out(hubRel, replaceMarkerBlock(html, 'shirasagi36:links', hubLinksBlock(views, lang)));
  }

  // 6) 報告
  console.log(`${CHECK_ONLY ? '[check] ' : ''}白鷺三十六景: ${views.length} 景 × ${LANG_ORDER.length} 言語 = ${views.length * LANG_ORDER.length} ページ`);
  console.log(`${CHECK_ONLY ? '差分のあるファイル' : '書き込んだファイル'}: ${written.length}`);
  for (const f of written) console.log('  - ' + f);
  if (stale.length) console.warn(`JSON に無い番号の古いページがあります（必要なら手で削除）: ${stale.join(', ')}`);
  const noStory = views.filter((v) => !v.data.ja.story).map((v) => v.nn);
  if (noStory.length) console.log(`story が無い景（物語セクションを省略）: ${noStory.join(', ')}`);
  const untranslated = views.filter((v) => v.data.ja.story && (!v.data.en.story || !v.data.hk.story)).map((v) => v.nn);
  if (untranslated.length) console.log(`EN/HK の story が未翻訳の景（日本語版への案内を表示）: ${untranslated.join(', ')}`);
  if (CHECK_ONLY && written.length) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
