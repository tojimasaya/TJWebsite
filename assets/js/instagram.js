(function () {
  'use strict';

  var pageLanguage = document.body.dataset.entryLanguage;
  var pages = { ja: 'instagram.html', en: 'instagram-en.html', hk: 'instagram-hk.html' };
  var url = new URL(window.location.href);
  var selected = url.searchParams.get('lang');
  var saved;
  try { saved = localStorage.getItem('tjm_instagram_language'); } catch (e) {}

  // Respect an explicit language URL; only the shared Japanese entry auto-selects.
  if (!pages[selected]) {
    if (pageLanguage !== 'ja') selected = pageLanguage;
    else if (pages[saved]) selected = saved;
    else {
      var browserLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
      selected = /^ja\b/i.test(browserLanguage) ? 'ja' : /^zh\b/i.test(browserLanguage) ? 'hk' : 'en';
    }
  }
  if (selected !== pageLanguage) {
    var next = new URL(pages[selected], url);
    next.search = url.search;
    next.searchParams.set('lang', selected);
    next.hash = url.hash;
    window.location.replace(next.href);
    return;
  }
  try { localStorage.setItem('tjm_instagram_language', selected); } catch (e) {}

  var topic = url.searchParams.get('topic');
  var topicLink = Array.from(document.querySelectorAll('[data-topic]')).find(function (link) {
    return link.dataset.topic === topic;
  });
  if (topicLink) {
    var feature = document.querySelector('[data-feature-link]');
    var image = document.querySelector('[data-feature-image]');
    feature.href = topicLink.href;
    feature.dataset.growthLabel = 'instagram_feature_' + topic;
    document.querySelector('[data-feature-title]').textContent = topicLink.dataset.title;
    document.querySelector('[data-feature-summary]').textContent = topicLink.dataset.summary;
    image.src = topicLink.dataset.image;
    image.alt = topicLink.dataset.imageAlt;
  }

  // Carry the incoming campaign and topic through language changes.
  document.querySelectorAll('a[data-entry-language]').forEach(function (link) {
    var target = new URL(link.href);
    url.searchParams.forEach(function (value, key) {
      if (key === 'topic' || /^utm_(source|medium|campaign|content|term)$/.test(key)) {
        target.searchParams.set(key, value);
      }
    });
    target.hash = url.hash;
    link.href = target.href;
  });
})();
