/* 日本語⇄中文 言語切替。<head>で読み込む想定。
   - localStorage の保存値を即座に <html data-lang> に反映（ちらつき防止・既定は日本語）
   - .lang-switch button[data-lang] を配線し、選択を保存 */
(function () {
  'use strict';
  var KEY = 'tj-lang';
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var current = (saved === 'zh') ? 'zh' : 'ja';

  function setAttr(lang) {
    document.documentElement.setAttribute('data-lang', lang);
  }
  // 即座に属性を反映（body描画前）
  setAttr(current);

  function syncButtons(lang) {
    var btns = document.querySelectorAll('.lang-switch button[data-lang]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-lang') === lang ? 'true' : 'false');
    }
  }

  function wire() {
    var btns = document.querySelectorAll('.lang-switch button[data-lang]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        var lang = this.getAttribute('data-lang');
        current = lang;
        setAttr(lang);
        syncButtons(lang);
        try { localStorage.setItem(KEY, lang); } catch (e) {}
      });
    }
    syncButtons(current);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
