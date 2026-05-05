/**
 * tojimasaya.com - GA4 detail tracking
 *
 * This file keeps site-specific engagement events in one place:
 * outbound links, Shirasagi 36 project actions, language switches,
 * and photo/map interactions.
 */

(function () {
  'use strict';

  const DOMAIN_MAP = [
    { pattern: /drone\.jp/i, eventName: 'click_dronejp', label: 'DRONE.jp' },
    { pattern: /note\.com/i, eventName: 'click_note', label: 'note' },
    { pattern: /instagram\.com/i, eventName: 'click_instagram', label: 'Instagram' },
    { pattern: /youtube\.com/i, eventName: 'click_youtube', label: 'YouTube' },
    { pattern: /x\.com/i, eventName: 'click_x', label: 'X' },
    { pattern: /facebook\.com/i, eventName: 'click_facebook', label: 'Facebook' },
  ];

  const FEATURE_LINKS = [
    { pattern: /shirasagi36(?:-(en|hk))?\.html$/i, feature: 'shirasagi36' },
    { pattern: /hongkong-neon\.html$/i, feature: 'hongkong_neon' },
    { pattern: /hongkong\.html$/i, feature: 'hongkong' },
    { pattern: /gear(?:-[a-z]+)?\.html$/i, feature: 'gear' },
    { pattern: /writings\.html$/i, feature: 'writings' },
    { pattern: /leica-serial\.html$/i, feature: 'leica_serial' },
    { pattern: /instagram\.html$/i, feature: 'instagram_entry' },
  ];

  function cleanParams(params) {
    return Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => (
        value !== undefined && value !== null && value !== ''
      ))
    );
  }

  function normalizePath(pathname) {
    if (!pathname || pathname === '/') return '/index.html';
    return pathname;
  }

  function getPageLanguage() {
    const path = window.location.pathname;
    if (/-en\.html$/i.test(path)) return 'en';
    if (/-hk\.html$/i.test(path)) return 'zh-Hant';
    return document.documentElement.lang || 'ja';
  }

  function trackEvent(eventName, params) {
    if (typeof window.gtag !== 'function') return;

    window.gtag('event', eventName, cleanParams({
      source_page: normalizePath(window.location.pathname),
      page_title: document.title,
      language: getPageLanguage(),
      ...params,
    }));
  }

  function toUrl(href) {
    try {
      return new URL(href, window.location.href);
    } catch (_) {
      return null;
    }
  }

  function getText(el) {
    return (el.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 120);
  }

  function getContext(el) {
    const closest = (selector) => el.closest(selector);
    if (closest('nav')) return 'global_nav';
    if (closest('#mobile-menu')) return 'mobile_nav';
    if (closest('footer')) return 'footer';
    if (closest('#latest-view')) return 'latest_view';
    if (closest('#gallery-anchor') || closest('#shirasagi-grid')) return 'gallery';
    if (closest('.articles-grid')) return 'articles_grid';
    if (closest('.latest-item')) return 'latest_articles';
    if (closest('.travel-card')) return 'travel_card';
    if (closest('.instagram-hero')) return 'instagram_hero';
    if (closest('[class*="hero"]')) return 'hero';
    return 'other';
  }

  function getArticleTitle(el) {
    const raw = getText(el);
    return raw.replace(/^(note|DRONE\.jp)\s*\|\s*[\d年月日]+\s*/i, '').substring(0, 80);
  }

  function isSameSite(url) {
    return url && url.origin === window.location.origin;
  }

  function isShirasagiPage() {
    return /\/shirasagi36(?:-(en|hk))?\.html$/i.test(window.location.pathname);
  }

  function getLanguageSwitch(link, url) {
    const target = url.pathname.match(/\/shirasagi36(?:-(en|hk))?\.html$/i);
    if (!target || !isShirasagiPage()) return null;

    const targetLanguage = target[1] === 'en' ? 'en' : target[1] === 'hk' ? 'zh-Hant' : 'ja';
    const currentLanguage = getPageLanguage();
    if (targetLanguage === currentLanguage) return null;

    return {
      from_language: currentLanguage,
      to_language: targetLanguage,
      project: 'shirasagi36',
      link_url: url.href,
      click_text: getText(link),
      click_context: getContext(link),
    };
  }

  function getShirasagiCta(link, url) {
    if (!isShirasagiPage()) return null;

    const params = {
      project: 'shirasagi36',
      link_url: url.href,
      click_text: getText(link),
      click_context: getContext(link),
    };

    if (url.hash === '#gallery-anchor') {
      return { eventName: 'click_shirasagi_gallery', params: { ...params, cta_type: 'gallery' } };
    }

    if (/\/shirasagi36-map\.html$/i.test(url.pathname)) {
      return { eventName: 'click_shirasagi_map', params: { ...params, cta_type: 'map_page' } };
    }

    if (url.hash === '#latest-view') {
      return { eventName: 'click_shirasagi_latest', params: { ...params, cta_type: 'latest_view' } };
    }

    return null;
  }

  function getFeatureLink(link, url) {
    if (!isSameSite(url)) return null;
    const targetPath = normalizePath(url.pathname);
    const sourcePath = normalizePath(window.location.pathname);
    if (targetPath === sourcePath && !url.hash) return null;

    const matched = FEATURE_LINKS.find(item => item.pattern.test(targetPath));
    if (!matched) return null;

    return {
      feature: matched.feature,
      target_page: targetPath,
      link_url: url.href,
      click_text: getText(link),
      click_context: getContext(link),
    };
  }

  function getCurrentModalPhoto(fallbackId) {
    const num = document.getElementById('modal-num')?.textContent || fallbackId;
    const title = document.getElementById('modal-title')?.textContent;
    const date = document.getElementById('modal-date')?.textContent;
    const location = document.getElementById('modal-loc-name')?.textContent;

    return {
      photo_id: String(num || '').trim().padStart(2, '0'),
      photo_title: title ? title.trim().substring(0, 120) : undefined,
      photo_date: date ? date.trim() : undefined,
      photo_location: location && location !== '--' ? location.trim().substring(0, 80) : undefined,
    };
  }

  function trackShirasagiFilter(button) {
    if (!isShirasagiPage()) return;

    trackEvent('filter_shirasagi', {
      project: 'shirasagi36',
      filter_name: button.dataset.filter,
      click_text: getText(button),
      click_context: getContext(button),
    });
  }

  function trackModalMapClick(link) {
    if (!isShirasagiPage() || link.id !== 'modal-map-link') return false;

    trackEvent('click_shirasagi_photo_map', {
      project: 'shirasagi36',
      link_url: link.href,
      click_text: getText(link),
      click_context: 'photo_modal',
      ...getCurrentModalPhoto(),
    });

    return true;
  }

  function installOpenModalTracking() {
    if (!isShirasagiPage()) return;
    if (typeof window.openModal !== 'function' || window.openModal.__gaTracked) return;

    const originalOpenModal = window.openModal;
    window.openModal = function trackedOpenModal(id) {
      const result = originalOpenModal.apply(this, arguments);

      window.setTimeout(() => {
        trackEvent('open_shirasagi_photo', {
          project: 'shirasagi36',
          ...getCurrentModalPhoto(id),
        });
      }, 0);

      return result;
    };
    window.openModal.__gaTracked = true;
  }

  document.addEventListener('click', function (event) {
    const filterButton = event.target.closest('.filter-btn[data-filter]');
    if (filterButton) {
      trackShirasagiFilter(filterButton);
    }

    const link = event.target.closest('a[href]');
    if (!link) return;

    if (trackModalMapClick(link)) return;

    const url = toUrl(link.getAttribute('href'));
    if (!url) return;

    const languageSwitch = getLanguageSwitch(link, url);
    if (languageSwitch) {
      trackEvent('switch_language', languageSwitch);
      return;
    }

    const shirasagiCta = getShirasagiCta(link, url);
    if (shirasagiCta) {
      trackEvent(shirasagiCta.eventName, shirasagiCta.params);
      return;
    }

    const featureLink = getFeatureLink(link, url);
    if (featureLink) {
      trackEvent('click_feature_link', featureLink);
      return;
    }

    const matched = DOMAIN_MAP.find(item => item.pattern.test(url.href));
    if (!matched) return;

    trackEvent(matched.eventName, {
      link_url: url.href,
      link_domain: matched.label,
      article_title: getArticleTitle(link),
      click_text: getText(link),
      click_context: getContext(link),
    });
  });

  installOpenModalTracking();
  document.addEventListener('DOMContentLoaded', installOpenModalTracking);
  window.addEventListener('load', installOpenModalTracking);
})();
