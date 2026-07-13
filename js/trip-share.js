(function () {
  'use strict';

  const root = document.querySelector('[data-trip-share-title]');
  const buttons = document.querySelectorAll('[data-share-trip]');
  if (!root || !buttons.length) return;

  const canonical = document.querySelector('link[rel="canonical"]');
  const shareData = {
    title: root.dataset.tripShareTitle,
    text: root.dataset.tripShareText || '',
    url: canonical ? canonical.href : window.location.href
  };

  function copyUrl() {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(shareData.url);
    }

    const textarea = document.createElement('textarea');
    textarea.value = shareData.url;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    return Promise.resolve();
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', async function () {
      const status = button.parentElement.querySelector('.share-status');
      try {
        if (navigator.share) {
          await navigator.share(shareData);
          if (status) status.textContent = '共有しました。';
        } else {
          await copyUrl();
          if (status) status.textContent = 'URLをコピーしました。';
        }
      } catch (error) {
        if (error && error.name === 'AbortError') return;
        if (status) status.textContent = '共有できませんでした。URLをコピーしてお使いください。';
      }
    });
  });
})();
