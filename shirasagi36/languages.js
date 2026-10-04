(function () {
    'use strict';

    // Keep the current chapter or gallery anchor when changing languages.
    function updateLanguageLinks() {
        document.querySelectorAll('[data-castle-language]').forEach(function (link) {
            link.hash = window.location.hash;
        });
    }

    updateLanguageLinks();
    window.addEventListener('hashchange', updateLanguageLinks);
})();
