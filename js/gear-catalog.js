(() => {
    'use strict';

    const grid = document.getElementById('editing-grid');
    const dialog = document.getElementById('gear-detail');
    const detailContent = document.getElementById('gear-detail-content');
    const detailTabs = document.getElementById('gear-detail-tabs');
    const filters = document.querySelectorAll('[data-gear-filter]');
    const count = document.getElementById('catalog-count');
    const bookIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z"/><path d="M12 5v15"/></svg>';
    let items = [];
    let activeFilter = 'all';
    let lastTrigger = null;

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    function safeUrl(value) {
        try {
            const url = new URL(value, window.location.href);
            return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
        } catch {
            return null;
        }
    }

    function isReview(key, url) {
        const host = new URL(url).hostname;
        return /(^|\.)(note\.com|drone\.jp)$/.test(host)
            || /^(note|review)$/i.test(key) || /レビュー|記事/.test(key);
    }

    function getLinks(item) {
        return Object.entries(item.links || {}).flatMap(([key, value]) => {
            const url = safeUrl(value);
            return url ? [{ key, url, review: isReview(key, url) }] : [];
        });
    }

    function linkLabel(key) {
        if (key === 'amazon') return 'Amazonで見る';
        if (key === 'official') return '公式サイト';
        if (/^(note|review)$/i.test(key) || key === 'TJによるレビュー') return 'レビューを読む';
        return key;
    }

    function linkRel(url) {
        const host = new URL(url).hostname;
        return /(^|\.)amazon\./.test(host) || host === 'amzn.to'
            ? 'noopener noreferrer sponsored' : 'noopener noreferrer';
    }

    function imageMarkup(item, className, lazy = true) {
        const webp = item.image.replace(/\.(png|jpe?g)$/i, '.webp');
        return '<picture><source srcset="' + escapeHtml(webp) + '" type="image/webp"><img class="' + className + '" src="' + escapeHtml(item.image)
            + '" alt="' + escapeHtml(item.name) + '"' + (lazy ? ' loading="lazy"' : '')
            + ' decoding="async"></picture>';
    }

    function renderCards() {
        const visible = items.filter(item => activeFilter === 'all' || getLinks(item).some(link => link.review));
        count.textContent = activeFilter === 'all' ? items.length + '点' : visible.length + ' / ' + items.length + '点';
        grid.innerHTML = visible.map(item => {
            const reviewCount = getLinks(item).filter(link => link.review).length;
            const name = escapeHtml(item.name);
            const id = escapeHtml(item.id);
            const summary = item.summary || item.description || '';
            return '<article class="gear-card" id="' + id + '" aria-labelledby="' + id + '-name">'
                + '<div class="gear-card__image">' + imageMarkup(item, '')
                + (item.is_new ? '<span class="gear-card__new">' + escapeHtml(item.new_label || 'NEW') + '</span>' : '') + '</div>'
                + '<div class="gear-card__body"><p class="gear-card__brand">' + escapeHtml(item.brand) + '</p>'
                + '<h3 class="gear-card__name" id="' + id + '-name">' + name + '</h3>'
                + '<p class="gear-card__summary">' + escapeHtml(summary) + '</p></div>'
                + '<div class="gear-card__actions"><button type="button" data-gear-open="' + id
                + '" aria-haspopup="dialog" aria-controls="gear-detail" aria-label="' + name + 'の解説を読む">解説を読む <span aria-hidden="true">↗</span></button>'
                + (reviewCount ? '<button class="gear-card__reviews" type="button" data-gear-open="' + id
                    + '" data-section="reviews" aria-haspopup="dialog" aria-controls="gear-detail" aria-label="' + name + 'のTJレビュー ' + reviewCount + '本を読む">'
                    + bookIcon + 'TJレビュー ' + reviewCount + '本</button>' : '')
                + '</div></article>';
        }).join('') || '<p class="catalog-message">レビューのある道具はまだありません。</p>';
    }

    function reviewSource(url) {
        const host = new URL(url).hostname;
        if (/(^|\.)note\.com$/.test(host)) return 'note';
        if (/(^|\.)drone\.jp$/.test(host)) return 'DRONE.jp';
        return host;
    }

    function reviewTitles(item) {
        // Use existing article titles where the comment and review links match.
        const doc = new DOMParser().parseFromString(item.comment || '', 'text/html');
        return new Map(Array.from(doc.querySelectorAll('a[href]'), anchor => [
            safeUrl(anchor.getAttribute('href')), anchor.textContent.trim()
        ]));
    }

    function openDetails(item, section, trigger) {
        document.getElementById('gear-detail-context').textContent = item.name;
        const links = getLinks(item);
        const reviews = links.filter(link => link.review);
        const products = links.filter(link => !link.review);
        const titles = reviewTitles(item);
        detailTabs.hidden = !reviews.length;
        detailTabs.innerHTML = reviews.length
            ? '<button type="button" data-detail-view="overview" aria-controls="gear-overview-panel" aria-pressed="true">解説・仕様</button>'
                + '<button type="button" data-detail-view="reviews" aria-controls="gear-reviews-panel" aria-pressed="false">TJレビュー ' + reviews.length + '本</button>'
            : '';
        detailContent.innerHTML = '<div id="gear-overview-panel"><header class="gear-detail__header">' + imageMarkup(item, 'gear-detail__image', false)
            + '<div><p class="gear-card__brand">' + escapeHtml(item.brand) + '</p>'
            + '<h2 id="gear-detail-title" tabindex="-1">' + escapeHtml(item.name) + '</h2>'
            + '<ul class="gear-detail__specs" aria-label="主な仕様">' + (item.specs || []).map(spec => '<li>' + escapeHtml(spec) + '</li>').join('') + '</ul></div></header>'
            + '<section aria-labelledby="gear-description-title"><h3 id="gear-description-title">この道具について</h3>'
            + '<p class="gear-detail__description">' + escapeHtml(item.description) + '</p></section>'
            + (products.length ? '<section class="gear-detail__section" aria-labelledby="gear-products-title"><h3 id="gear-products-title">製品情報・購入先</h3>'
                + '<div class="gear-detail__products">' + products.map(link => '<a href="' + escapeHtml(link.url)
                    + '" target="_blank" rel="' + linkRel(link.url) + '">' + escapeHtml(linkLabel(link.key)) + ' ↗</a>').join('') + '</div></section>' : '')
            + '</div>'
            + (reviews.length ? '<section id="gear-reviews-panel" aria-labelledby="gear-reviews-title" hidden>'
                + '<h2 id="gear-reviews-title" tabindex="-1">TJによるレビュー <span class="catalog-count">' + reviews.length + '本</span></h2>'
                + '<p class="gear-detail__section-note">実際に使って書いた記事です。別のタブで開きます。</p>'
                + '<ul class="gear-detail__reviews">' + reviews.map(link => '<li><a href="' + escapeHtml(link.url)
                    + '" target="_blank" rel="' + linkRel(link.url) + '"><span><span class="gear-detail__review-source">' + escapeHtml(reviewSource(link.url))
                    + '</span><span class="gear-detail__review-title">' + escapeHtml(titles.get(link.url) || linkLabel(link.key))
                    + '</span></span><span class="gear-detail__review-arrow" aria-hidden="true">↗</span></a></li>').join('') + '</ul></section>' : '');
        lastTrigger = trigger;
        dialog.showModal();
        document.body.classList.add('gear-modal-open');
        selectDetailView(section, true);
    }

    function selectDetailView(view, moveFocus = false) {
        const reviews = document.getElementById('gear-reviews-panel');
        const showReviews = view === 'reviews' && Boolean(reviews);
        document.getElementById('gear-overview-panel').hidden = showReviews;
        if (reviews) reviews.hidden = !showReviews;
        detailTabs.querySelectorAll('button').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.detailView === (showReviews ? 'reviews' : 'overview')));
        });
        detailContent.scrollTop = 0;
        if (moveFocus) document.getElementById(showReviews ? 'gear-reviews-title' : 'gear-detail-title').focus({ preventScroll: true });
    }

    async function loadCatalog() {
        grid.setAttribute('aria-busy', 'true');
        grid.innerHTML = '<p class="catalog-message">道具を読み込んでいます…</p>';
        filters.forEach(button => { button.disabled = true; });
        try {
            const response = await fetch('data/gear.json', { cache: 'no-cache' });
            if (!response.ok) throw new Error('Gear data request failed: ' + response.status);
            const data = await response.json();
            items = data.categories.editing.items;
            if (!Array.isArray(items)) throw new Error('Gear items are missing');
            document.getElementById('filter-all-count').textContent = items.length;
            document.getElementById('filter-review-count').textContent = items.filter(item => getLinks(item).some(link => link.review)).length;
            filters.forEach(button => { button.disabled = false; });
            renderCards();
        } catch (error) {
            console.error('Error loading gear data:', error);
            grid.innerHTML = '<p class="catalog-message">道具の一覧を読み込めませんでした。<button type="button" data-gear-retry>再読み込み</button></p>';
        } finally {
            grid.setAttribute('aria-busy', 'false');
        }
    }

    grid.addEventListener('click', event => {
        if (event.target.closest('[data-gear-retry]')) {
            loadCatalog();
            return;
        }
        const trigger = event.target.closest('[data-gear-open]');
        if (!trigger) return;
        const item = items.find(entry => entry.id === trigger.dataset.gearOpen);
        if (item) openDetails(item, trigger.dataset.section, trigger);
    });

    filters.forEach(button => button.addEventListener('click', () => {
        activeFilter = button.dataset.gearFilter;
        filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
        renderCards();
    }));

    dialog.querySelector('[data-gear-close]').addEventListener('click', () => dialog.close());
    detailTabs.addEventListener('click', event => {
        const button = event.target.closest('[data-detail-view]');
        if (button) selectDetailView(button.dataset.detailView);
    });
    dialog.addEventListener('click', event => {
        const bounds = dialog.getBoundingClientRect();
        if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right
            || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
        document.body.classList.remove('gear-modal-open');
        if (lastTrigger?.isConnected) lastTrigger.focus({ preventScroll: true });
    });

    function imageFallback(event) {
        const image = event.target;
        if (image.tagName !== 'IMG' || image.dataset.fallback) return;
        const source = image.parentElement.querySelector('source');
        if (source) {
            source.remove();
            image.src = image.getAttribute('src');
            return;
        }
        image.dataset.fallback = 'true';
        image.src = 'assets/images/gear/editing.jpg';
    }
    grid.addEventListener('error', imageFallback, true);
    dialog.addEventListener('error', imageFallback, true);

    loadCatalog();
})();
