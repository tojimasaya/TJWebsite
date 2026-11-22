(function () {
    const saved = localStorage.getItem('theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    const lang = (document.documentElement.lang || 'ja').toLowerCase();
    const isEn = lang.startsWith('en');
    const isHk = lang.startsWith('zh');

    function getCurrentTheme() {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function getThemeIcon(theme) {
        const shape = theme === 'dark'
            ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'
            : '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>';
        return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${shape}</svg>`;
    }

    function getThemeLabel(theme) {
        if (isEn) return theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
        if (isHk) return theme === 'dark' ? '切換至淺色模式' : '切換至深色模式';
        return theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え';
    }

    const searchLabel = isEn ? 'Search site' : isHk ? '站內搜尋' : 'サイト内検索';
    const skipLabel = isEn ? 'Skip to main content' : isHk ? '跳至主要內容' : 'メインコンテンツにスキップ';
    const searchIcon = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';

    // Ensure skip link & main-content anchor
    if (!document.getElementById('main-content')) {
        const target = document.querySelector('main, header, section');
        if (target && !target.id) target.id = 'main-content';
    }
    if (!document.querySelector('.skip-link')) {
        const targetId = document.getElementById('main-content') ? '#main-content' : '#gallery-anchor';
        document.body.insertAdjacentHTML('afterbegin', `<a href="${targetId}" class="skip-link">${skipLabel}</a>`);
    }

    // Inject search + theme toggle into desktop nav & mobile menu
    const theme = getCurrentTheme();
    const desktopLinks = document.querySelector('.shirasagi-site-links');
    if (desktopLinks && !document.getElementById('theme-toggle')) {
        desktopLinks.insertAdjacentHTML('beforeend',
            `<a href="/search.html" class="nav-search-link" aria-label="${searchLabel}" title="${searchLabel}">${searchIcon}</a>` +
            `<button class="theme-toggle" id="theme-toggle" type="button" aria-label="${getThemeLabel(theme)}" title="${getThemeLabel(theme)}">${getThemeIcon(theme)}</button>`
        );
    }

    const mobileContent = document.querySelector('.shirasagi-mobile-content');
    if (mobileContent && !mobileContent.querySelector('.site-nav-mobile-tools')) {
        mobileContent.insertAdjacentHTML('beforeend',
            `<div class="site-nav-mobile-tools">` +
                `<a href="/search.html">${searchIcon}<span>${searchLabel}</span></a>` +
                `<button type="button" class="js-theme-toggle-mobile" aria-label="${getThemeLabel(theme)}">${getThemeIcon(theme)}<span>${theme === 'dark' ? 'Light' : 'Dark'}</span></button>` +
            `</div>`
        );
    }

    function syncThemeButtons(nextTheme) {
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.innerHTML = getThemeIcon(nextTheme);
            btn.setAttribute('aria-label', getThemeLabel(nextTheme));
            btn.setAttribute('title', getThemeLabel(nextTheme));
        }
        document.querySelectorAll('.js-theme-toggle-mobile').forEach((mBtn) => {
            mBtn.innerHTML = `${getThemeIcon(nextTheme)}<span>${nextTheme === 'dark' ? 'Light' : 'Dark'}</span>`;
            mBtn.setAttribute('aria-label', getThemeLabel(nextTheme));
        });
    }

    function toggleTheme() {
        const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        syncThemeButtons(next);
    }

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    document.querySelectorAll('.js-theme-toggle-mobile').forEach((mBtn) => {
        mBtn.addEventListener('click', toggleTheme);
    });

    const menu = document.getElementById('mobile-menu');
    const toggle = document.getElementById('shirasagi-menu-toggle');
    const close = document.querySelector('.shirasagi-menu-close');
    const moreMenus = document.querySelectorAll('.shirasagi-more');

    if (!menu || !toggle || !close) return;

    function closeMenu(restoreFocus = false) {
        menu.classList.remove('flex', 'opacity-100', 'pointer-events-auto');
        menu.classList.add('hidden', 'opacity-0', 'pointer-events-none');
        menu.querySelectorAll('.shirasagi-more').forEach((details) => { details.open = false; });
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        if (restoreFocus) toggle.focus();
    }

    toggle.addEventListener('click', () => {
        menu.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        menu.classList.add('flex', 'opacity-100', 'pointer-events-auto');
        toggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        close.focus();
    });

    close.addEventListener('click', () => closeMenu(true));

    document.addEventListener('click', (event) => {
        moreMenus.forEach((details) => {
            if (!details.contains(event.target)) details.open = false;
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const openMore = Array.from(moreMenus).find((details) => details.open);
        if (openMore) {
            openMore.open = false;
            openMore.querySelector('summary').focus();
        } else if (!menu.classList.contains('hidden')) {
            closeMenu(true);
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024 && !menu.classList.contains('hidden')) closeMenu();
    });
});
