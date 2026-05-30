/* tojimasaya.com growth measurement helper
   - No cookies and no external requests by itself.
   - Emits events to dataLayer, gtag, and Plausible only when those tools already exist on the page.
*/
(function () {
  'use strict';

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  function safeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  }

  function readCampaign() {
    var params = new URLSearchParams(window.location.search);
    var campaign = {};
    UTM_KEYS.forEach(function (key) {
      if (params.has(key)) campaign[key] = params.get(key);
    });

    if (Object.keys(campaign).length) {
      try { window.sessionStorage.setItem('tjm_campaign', JSON.stringify(campaign)); } catch (e) {}
      return campaign;
    }

    try { return JSON.parse(window.sessionStorage.getItem('tjm_campaign') || '{}'); } catch (e) { return {}; }
  }

  function emit(eventName, payload) {
    var campaign = readCampaign();
    var detail = Object.assign({
      event: eventName,
      page_path: window.location.pathname,
      page_title: document.title,
      campaign: campaign
    }, payload || {});

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(detail);
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, detail);
    }

    if (typeof window.plausible === 'function') {
      window.plausible(eventName, { props: detail });
    }

    document.dispatchEvent(new CustomEvent('tjm:growth-event', { detail: detail }));
  }

  window.tjmGrowth = { track: emit };

  document.addEventListener('DOMContentLoaded', function () {
    emit('tjm_page_view', { referrer: document.referrer || '' });
  });

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;

    var url;
    try { url = new URL(link.getAttribute('href'), window.location.href); } catch (e) { return; }

    var label = link.dataset.growthLabel || link.getAttribute('aria-label') || safeText(link.textContent) || url.pathname;
    var isOutbound = url.hostname && url.hostname !== window.location.hostname;
    var isCTA = link.matches('.guide-card a, .start-card, .route-card, .category-btn, .card-action-btn, .external-link, .subscribe-btn, .social-link, .note-link');

    if (isOutbound) {
      emit('tjm_outbound_click', { label: label, href: url.href, destination_host: url.hostname });
    } else if (isCTA) {
      emit('tjm_internal_cta_click', { label: label, href: url.pathname + url.hash });
    }
  }, true);
})();
