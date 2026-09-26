// Keep links saved before access information moved to its own page working.
(function () {
    'use strict';
    if (document.body.dataset.pageId !== 'shirasagi-guide') return;
    function forwardAccessLink() {
        var hash;
        try { hash = decodeURIComponent(window.location.hash.slice(1)); }
        catch (error) { return; }
        if (['access', 'access-heading', 'location-heading', 'walk-heading'].indexOf(hash) < 0) return;
        window.location.replace('shirasagi36-access.html#' + hash);
    }
    forwardAccessLink();
    window.addEventListener('hashchange', forwardAccessLink);
})();

(function () {
    'use strict';
    var index = document.querySelector('.guide-index');
    if (!index) return;
    // The visible index is the single list of topics. Adding an entry and its
    // article also adds the reading menu and next-chapter links.
    var topics = Array.from(index.querySelectorAll('a[href^="#"]')).map(function (link) {
        return {
            link: link,
            chapter: document.getElementById(link.hash.slice(1)),
            number: link.querySelector('span').textContent,
            title: link.querySelector('strong').textContent
        };
    }).filter(function (topic) { return topic.chapter; });
    if (!topics.length) return;

    var nav = document.createElement('nav');
    nav.className = 'guide-progress';
    nav.setAttribute('aria-label', '章の移動');
    var label = document.createElement('span');
    label.className = 'guide-progress-label';
    label.textContent = '城を知る';
    nav.appendChild(label);
    var links = document.createElement('div');
    links.className = 'guide-progress-links';
    nav.appendChild(links);

    topics.forEach(function (topic, position) {
        var link = document.createElement('a');
        link.href = topic.link.getAttribute('href');
        var number = document.createElement('span');
        number.textContent = topic.number;
        number.setAttribute('aria-hidden', 'true');
        link.appendChild(number);
        link.appendChild(document.createTextNode(topic.title));
        links.appendChild(link);
        topic.readingLink = link;

        var footer = document.createElement('nav');
        footer.className = 'guide-chapter-nav';
        footer.setAttribute('aria-label', topic.title + 'を読み終えたら');
        var back = document.createElement('a');
        back.href = '#guide-topics';
        back.textContent = '目次に戻る ↑';
        footer.appendChild(back);
        var next = topics[position + 1];
        if (next) {
            var onward = document.createElement('a');
            onward.className = 'guide-next';
            onward.href = next.link.getAttribute('href');
            var caption = document.createElement('small');
            caption.textContent = '次の章を読む';
            var title = document.createElement('strong');
            title.textContent = next.number + '　' + next.title + ' →';
            onward.appendChild(caption);
            onward.appendChild(title);
            footer.appendChild(onward);
        }
        topic.chapter.appendChild(footer);
    });
    index.after(nav);

    var current = null;
    var scheduled = false;
    function updateCurrent() {
        scheduled = false;
        var readingLine = nav.getBoundingClientRect().bottom + 28;
        var active = null;
        topics.forEach(function (topic) {
            if (topic.chapter.getBoundingClientRect().top <= readingLine) active = topic;
        });
        if (active === current) return;
        current = active;
        topics.forEach(function (topic) {
            if (topic === active) topic.readingLink.setAttribute('aria-current', 'location');
            else topic.readingLink.removeAttribute('aria-current');
        });
        // Move only the horizontal menu; never scroll the article or steal focus.
        if (active) {
            var item = active.readingLink.getBoundingClientRect();
            var viewport = links.getBoundingClientRect();
            if (item.left < viewport.left) links.scrollLeft -= viewport.left - item.left;
            else if (item.right > viewport.right) links.scrollLeft += item.right - viewport.right;
        }
    }
    function scheduleUpdate() {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(updateCurrent);
    }
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('load', scheduleUpdate);
    window.addEventListener('hashchange', scheduleUpdate);
    // The menu and chapter footers add height after HTML parsing. Realign an
    // incoming deep link once the page is ready, including on a reload.
    var initialHash = window.location.hash;
    window.addEventListener('load', function () {
        if (!initialHash || window.location.hash !== initialHash) return;
        var target;
        try { target = document.getElementById(decodeURIComponent(initialHash.slice(1))); }
        catch (error) { return; }
        if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
        scheduleUpdate();
    }, { once: true });
    document.querySelectorAll('.guide-detail').forEach(function (detail) {
        detail.addEventListener('toggle', scheduleUpdate);
    });
    scheduleUpdate();
})();

(function () {
    'use strict';
    var dialog = document.querySelector('.guide-lightbox');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    var image = dialog.querySelector('img');
    var title = document.getElementById('diagram-title');
    var opener;
    document.querySelectorAll('[data-diagram]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            opener = link;
            var width = Number(link.getAttribute('data-diagram-width')) || 850;
            var focusX = parseFloat(link.getAttribute('data-diagram-focus-x'));
            if (!Number.isFinite(focusX)) focusX = 0.5;
            image.src = link.href;
            image.style.width = width + 'px';
            image.alt = link.querySelector('img').alt;
            title.textContent = link.title.replace('を拡大', '');
            dialog.showModal();
            document.body.classList.add('is-diagram-open');
            var viewport = dialog.querySelector('.guide-lightbox-scroll');
            viewport.scrollTop = 0;
            viewport.scrollLeft = Math.max(0, width * focusX - viewport.clientWidth / 2);
        });
    });
    dialog.querySelector('[data-diagram-close]').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) {
        if (event.target !== dialog) return;
        var rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', function () {
        document.body.classList.remove('is-diagram-open');
        image.removeAttribute('src');
        if (opener) opener.focus();
    });
})();
