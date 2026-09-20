document.addEventListener('DOMContentLoaded', () => {
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
        if (window.innerWidth >= 768 && !menu.classList.contains('hidden')) closeMenu();
    });
});
