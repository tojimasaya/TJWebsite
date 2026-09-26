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
            image.src = link.href;
            image.alt = link.querySelector('img').alt;
            title.textContent = link.title.replace('を拡大', '');
            dialog.showModal();
            document.body.classList.add('is-diagram-open');
            var viewport = dialog.querySelector('.guide-lightbox-scroll');
            viewport.scrollTop = 0;
            viewport.scrollLeft = Math.max(0, (850 - viewport.clientWidth) / 2);
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
