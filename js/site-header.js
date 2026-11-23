// Theme initialization (runs before DOM to prevent flash)
(function() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // 現在のページファイル名を取得
    const path = window.location.pathname;
    const pageName = path.split("/").pop();
    const page = (pageName === "" || pageName === "index.html") ? "index.html" : pageName;
    const inShirasagiDir = path.indexOf('/shirasagi36/') !== -1;
    const isHongKongPage = page.startsWith('hongkong') || page.startsWith('hk-') || page.startsWith('cn-') || page.startsWith('iphone') || page === 'holidays.html';
    const isTripsPage = page === 'trips.html' || page.endsWith('-travel-journal.html') || page.endsWith('-detail.html') || /^(tibet-day|italy-|germany-|macau-|hoian-2018)/.test(page);
    const isArchivePage = page === 'archive.html' || page.startsWith('leica') || path.includes('/leica/') || path.includes('/lenses/');
    const isGearPage = page.includes('gear');
    const isReadViewPage = ['gallery.html', 'writings.html', 'fragments.html'].includes(page) || path.includes('/fragments/') || path.includes('/articles/');
    const isAboutPage = page === 'about.html' || page === 'about-en.html' || page === 'about-hk.html';

    // 現在のテーマを判定
    function getCurrentTheme() {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Lucide Moon / Sun / Search (ISC); license: /assets/icons/lucide-LICENSE.txt.
    function getThemeIcon(theme) {
        const shape = theme === 'dark'
            ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'
            : '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>';
        return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${shape}</svg>`;
    }

    const searchIcon = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';

    function getThemeLabel(theme) {
        return theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え';
    }

    const currentTheme = getCurrentTheme();

    // スキップリンクの移動先（#main-content）を確保
    if (!document.getElementById('main-content')) {
        const mainTarget = document.querySelector('main, article, header, section');
        if (mainTarget && !mainTarget.id) mainTarget.id = 'main-content';
    }

    // ナビゲーションのHTML構造（案A：意味ごとの2ドロップダウン＋About）
    const navHtml = `
    <header class="site-header" role="banner">
    <nav class="main-nav" aria-label="メインナビゲーション">
        <div class="nav-container">
            <a href="/" class="nav-logo" aria-label="ホームページへ戻る">TOJIMASAYA</a>
            <button class="nav-toggle" id="nav-toggle" type="button" aria-label="メニューを開く" aria-expanded="false" aria-controls="nav-menu"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path class="nav-toggle-open" d="M4 5h16M4 12h16M4 19h16"/><path class="nav-toggle-close" d="M18 6 6 18m0-12 12 12"/></svg></button>
            <ul class="nav-menu" id="nav-menu">
                <li>
                    <a href="/shirasagi36.html" class="nav-link ${page.includes('shirasagi') || inShirasagiDir ? 'active' : ''}">白鷺三十六景</a>
                </li>
                <li class="nav-more">
                    <details class="nav-dropdown" data-nav-dropdown>
                        <summary class="nav-link ${isHongKongPage ? 'active' : ''}">香港</summary>
                        <ul class="nav-submenu">
                            <li>
                                <a href="/hongkong.html" ${page === 'hongkong.html' ? 'aria-current="page"' : ''}>
                                    <span class="nav-sub-title">変わりゆく香港</span>
                                    <span class="nav-sub-desc">写真とドローンで撮る街の記録</span>
                                </a>
                            </li>
                            <li>
                                <a href="/hongkong-handbook.html" ${page === 'hongkong-handbook.html' ? 'aria-current="page"' : ''}>
                                    <span class="nav-sub-title">香港ハンドブック</span>
                                    <span class="nav-sub-desc">回郷証・銀行・SIM・祝日ガイド</span>
                                </a>
                            </li>
                        </ul>
                    </details>
                </li>
                <li><a href="/trips.html" class="nav-link ${isTripsPage ? 'active' : ''}">旅</a></li>
                <li class="nav-more">
                    <details class="nav-dropdown" data-nav-dropdown>
                        <summary class="nav-link ${isArchivePage ? 'active' : ''}">Archive</summary>
                        <ul class="nav-submenu">
                            <li>
                                <a href="/archive.html" ${page === 'archive.html' ? 'aria-current="page"' : ''}>
                                    <span class="nav-sub-title">Archive トップ</span>
                                    <span class="nav-sub-desc">カメラ・レンズ図鑑の総合入口</span>
                                </a>
                            </li>
                            <li>
                                <a href="/leica.html" ${page === 'leica.html' ? 'aria-current="page"' : ''}>
                                    <span class="nav-sub-title">Leica Archive</span>
                                    <span class="nav-sub-desc">写真から辿るライカ専門ハブ</span>
                                </a>
                            </li>
                            <li>
                                <a href="/leica-bodies.html" ${page === 'leica-bodies.html' ? 'aria-current="page"' : ''}>
                                    <span class="nav-sub-title">Leica ボディ図鑑</span>
                                    <span class="nav-sub-desc">歴代152機種の仕様と画像来歴</span>
                                </a>
                            </li>
                            <li>
                                <a href="/leica-serial.html" ${page === 'leica-serial.html' ? 'aria-current="page"' : ''}>
                                    <span class="nav-sub-title">シリアル番号検索</span>
                                    <span class="nav-sub-desc">カメラ・レンズの番号から年代を調べる</span>
                                </a>
                            </li>
                        </ul>
                    </details>
                </li>
                <li><a href="/gear.html" class="nav-link ${isGearPage ? 'active' : ''}">Gear</a></li>
                <li class="nav-more">
                    <details class="nav-dropdown" data-nav-dropdown>
                        <summary class="nav-link ${isReadViewPage ? 'active' : ''}">読む・見る</summary>
                        <ul class="nav-submenu">
                            <li>
                                <a href="/fragments.html" ${page === 'fragments.html' || path.includes('/fragments/') ? 'aria-current="page"' : ''}>
                                    <span class="nav-sub-title">断章</span>
                                    <span class="nav-sub-desc">写真を入口に、その日の一文</span>
                                </a>
                            </li>
                            <li>
                                <a href="/writings.html" ${page === 'writings.html' ? 'aria-current="page"' : ''}>
                                    <span class="nav-sub-title">Writings</span>
                                    <span class="nav-sub-desc">note・DRONE.jp の執筆記事</span>
                                </a>
                            </li>
                            <li>
                                <a href="/gallery.html" ${page === 'gallery.html' ? 'aria-current="page"' : ''}>
                                    <span class="nav-sub-title">Gallery</span>
                                    <span class="nav-sub-desc">写真・動画の抜粋ギャラリー</span>
                                </a>
                            </li>
                        </ul>
                    </details>
                </li>
                <li><a href="/about.html" class="nav-link ${isAboutPage ? 'active' : ''}">About</a></li>
                <li><a href="/search.html" class="nav-search-link" aria-label="サイト内検索" title="サイト内検索" ${page === 'search.html' ? 'aria-current="page"' : ''}>${searchIcon}</a></li>
                <li><button class="theme-toggle" id="theme-toggle" type="button" aria-label="${getThemeLabel(currentTheme)}" title="${getThemeLabel(currentTheme)}">${getThemeIcon(currentTheme)}</button></li>
            </ul>
        </div>
    </nav>
    </header>
    `;

    // スキップリンクが無いページには自動で追加し、その直後にヘッダーを挿入
    let skipLink = document.querySelector('.skip-link');
    if (!skipLink) {
        const targetId = document.getElementById('main-content') ? '#main-content' : '#top';
        document.body.insertAdjacentHTML('afterbegin', `<a href="${targetId}" class="skip-link">メインコンテンツにスキップ</a>`);
        skipLink = document.querySelector('.skip-link');
    }
    skipLink.insertAdjacentHTML('afterend', navHtml);

    document.querySelectorAll('.main-nav a.nav-link.active').forEach(link => {
        link.setAttribute('aria-current', link.pathname === path ? 'page' : 'location');
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = getCurrentTheme();
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            themeToggle.innerHTML = getThemeIcon(next);
            themeToggle.setAttribute('aria-label', getThemeLabel(next));
            themeToggle.setAttribute('title', getThemeLabel(next));
        });
    }

    // 統一標準フッターの注入（<footer class="footer"> を持つページ）
    const stdFooter = document.querySelector('footer.footer:not([data-custom])');
    if (stdFooter) {
        const year = new Date().getFullYear();
        stdFooter.innerHTML = `
        <div class="tjm-footer">
            <nav class="tjm-footer__row" aria-label="フッターナビゲーション">
                <a href="/">Home</a>
                <a href="/shirasagi36.html">白鷺三十六景</a>
                <a href="/hongkong.html">変わりゆく香港</a>
                <a href="/hongkong-handbook.html">香港ハンドブック</a>
                <a href="/trips.html">旅</a>
                <a href="/archive.html">Archive</a>
                <a href="/gear.html">Gear</a>
                <a href="/fragments.html">断章</a>
                <a href="/writings.html">Writings</a>
                <a href="/gallery.html">Gallery</a>
                <a href="/about.html">About</a>
            </nav>
            <div class="tjm-footer__meta">
                <a href="/search.html">サイト内検索</a>
                <span class="tjm-footer__sep" aria-hidden="true">·</span>
                <a href="/about.html#license">お問い合わせ</a>
                <span class="tjm-footer__sep" aria-hidden="true">·</span>
                <a href="/privacy.html">免責・プライバシー</a>
                <span class="tjm-footer__sep" aria-hidden="true">·</span>
                <a href="/feed.xml">Feed</a>
                <span class="tjm-footer__sep" aria-hidden="true">|</span>
                <span>English: <a href="/about-en.html" hreflang="en" lang="en">About</a> / <a href="/shirasagi36-en.html" hreflang="en" lang="en">Himeji Castle</a></span>
                <span class="tjm-footer__sep" aria-hidden="true">·</span>
                <span>繁體中文: <a href="/about-hk.html" hreflang="zh-Hant" lang="zh-Hant">關於</a> / <a href="/shirasagi36-hk.html" hreflang="zh-Hant" lang="zh-Hant">白鷺三十六景</a></span>
            </div>
            <p class="tjm-footer__copy">&copy; ${year} Toji Masaya. All rights reserved.</p>
            <p class="tjm-footer__disclosure">当サイトには広告（アフィリエイトリンク）を含むページがあります。Amazonのアソシエイトとして、当サイト運営者・田路昌也は適格販売により収入を得ています。</p>
        </div>`;
    }

    // ドロップダウン＆モバイルメニュートグル機能
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const dropdowns = Array.from(document.querySelectorAll('[data-nav-dropdown]'));

    dropdowns.forEach(dd => {
        dd.addEventListener('toggle', () => {
            if (!dd.open) return;
            dropdowns.forEach(other => {
                if (other !== dd) other.open = false;
            });
        });
    });

    document.addEventListener('click', (e) => {
        dropdowns.forEach(dd => {
            if (dd.open && !dd.contains(e.target)) dd.open = false;
        });
    });

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const isExpanded = navMenu.classList.contains('active');
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', !isExpanded);
            navToggle.setAttribute('aria-label', !isExpanded ? 'メニューを閉じる' : 'メニューを開く');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth < 1024 || !navMenu.classList.contains('active')) return;
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.setAttribute('aria-label', 'メニューを開く');
            dropdowns.forEach(dd => { dd.open = false; });
            document.body.style.overflow = '';
        });

        // Escキーでメニューを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openDd = dropdowns.find(dd => dd.open);
                if (openDd) {
                    openDd.open = false;
                    openDd.querySelector('summary').focus();
                } else if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                    navToggle.setAttribute('aria-expanded', 'false');
                    navToggle.setAttribute('aria-label', 'メニューを開く');
                    document.body.style.overflow = '';
                    navToggle.focus();
                }
            }
        });
    }
});
