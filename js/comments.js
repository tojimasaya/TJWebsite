/**
 * tojimasaya.com - 自前コメント欄 (Cloudflare Workers + D1 + Telegram 承認)
 *
 * 対象ページには <div id="comments-slot"></div> を置く。
 * data-heading / data-intro / data-lang (ja | en | zh-Hant) / data-page-id で上書き可能。
 */
(function () {
  'use strict';

  var API_BASE = 'https://cusdis-telegram.tjmjp22.workers.dev';

  var slot = document.getElementById('comments-slot');
  if (!slot) return;
  var staticAnchor = slot.parentElement && slot.parentElement.id === 'comments' ? slot.parentElement : null;

  var rawLang = (slot.getAttribute('data-lang') || document.documentElement.lang || 'ja').toLowerCase();
  var langKey = rawLang.indexOf('en') === 0 ? 'en' : rawLang.indexOf('zh') === 0 ? 'hk' : 'ja';

  var I18N = {
    ja: {
      heading: 'コメント — 情報のアップデート歓迎',
      intro: '制度や条件は変わります。「ここはもう変わっているよ」という最新情報や、みなさんの体験談をぜひ。名前だけで匿名投稿できます（承認後に公開されます）。',
      loading: 'コメントを読み込んでいます…',
      empty: 'まだコメントはありません。最初のコメントをお待ちしています。',
      loadError: 'コメントの読み込みに失敗しました。時間をおいて再度お試しください。',
      nameLabel: 'お名前（ニックネーム）',
      namePlaceholder: '例：香港在住A',
      bodyLabel: 'コメント',
      bodyPlaceholder: '感想や最新情報などをお書きください（承認後に公開されます）',
      submit: 'コメントを送信する',
      sending: '送信中…',
      success: 'ありがとうございます。コメントを受け付けました（承認後に公開されます）。',
      errEmpty: 'お名前とコメントを入力してください。',
      errRate: '短時間に続けて投稿されています。少し時間をおいてからお試しください。',
      errFail: '送信に失敗しました。時間をおいて再度お試しください。',
      count: function (n) { return n + ' 件のコメント'; },
    },
    en: {
      heading: 'Comments',
      intro: 'Leave a note, question, or update. No account required — just a nickname (comments appear after moderation).',
      loading: 'Loading comments…',
      empty: 'No comments yet. Be the first to share a note.',
      loadError: 'Could not load comments right now. Please try again later.',
      nameLabel: 'Nickname',
      namePlaceholder: 'Your name or handle',
      bodyLabel: 'Comment',
      bodyPlaceholder: 'Share your thoughts or an update (published after approval)',
      submit: 'Post Comment',
      sending: 'Sending…',
      success: 'Thank you! Your comment has been received and will appear once approved.',
      errEmpty: 'Please enter both your nickname and comment.',
      errRate: 'Too many submissions in a short time. Please wait a minute and try again.',
      errFail: 'Failed to submit your comment. Please try again later.',
      count: function (n) { return n + (n === 1 ? ' comment' : ' comments'); },
    },
    hk: {
      heading: '留言 — 歡迎分享最新資訊',
      intro: '歡迎留下感想、問題或最新實地資訊。無需註冊，只需填寫暱稱即可匿名留言（經審核後公開）。',
      loading: '正在載入留言…',
      empty: '目前還沒有留言，歡迎成為第一位留言者。',
      loadError: '暫時無法載入留言，請稍後再試。',
      nameLabel: '暱稱',
      namePlaceholder: '例如：香港讀者',
      bodyLabel: '留言內容',
      bodyPlaceholder: '請輸入您的感想或最新資訊（經審核後公開）',
      submit: '送出留言',
      sending: '送出中…',
      success: '感謝留言！已收到您的內容，經審核後將會公開顯示。',
      errEmpty: '請填寫暱稱與留言內容。',
      errRate: '短時間內送出過於頻繁，請稍候一分鐘再試。',
      errFail: '送出失敗，請稍後再試。',
      count: function (n) { return n + ' 則留言'; },
    },
  };
  var T = I18N[langKey];

  var style = document.createElement('style');
  style.textContent =
    '.comments-section{max-width:720px;margin:0 auto 80px;padding:0 24px;scroll-margin-top:90px;}' +
    '.comments-section h2{font-family:"Noto Serif JP",serif;font-size:1.3rem;font-weight:600;' +
    'margin:0 0 0.8em;padding-bottom:10px;border-bottom:1px solid var(--border-color,#e5e5e5);color:var(--text-color,inherit);}' +
    '.comments-intro{font-family:var(--primary-font,inherit);font-size:0.86rem;color:var(--text-light,#666);' +
    'line-height:1.9;margin:0 0 1.6em;}' +
    '.tjm-c-count{font-size:0.82rem;color:var(--text-light,#666);margin:0 0 14px;}' +
    '.tjm-c-list{list-style:none;margin:0 0 28px;padding:0;display:grid;gap:12px;}' +
    '.tjm-c-empty{font-size:0.86rem;color:var(--text-light,#777);padding:14px 0 24px;}' +
    '.tjm-c-item{padding:14px 16px;border:1px solid var(--border-color,#e5e5e5);border-radius:8px;background:rgba(128,128,128,0.03);}' +
    '.tjm-c-item__head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:6px;font-size:0.82rem;}' +
    '.tjm-c-item__name{font-weight:600;color:var(--text-color,inherit);}' +
    '.tjm-c-item__date{font-size:0.75rem;color:var(--text-light,#888);}' +
    '.tjm-c-item__body{margin:0;font-size:0.92rem;line-height:1.8;color:var(--text-color,inherit);white-space:pre-wrap;word-break:break-word;}' +
    '.tjm-c-form{display:grid;gap:14px;padding:20px;border:1px solid var(--border-color,#e5e5e5);border-radius:10px;background:rgba(128,128,128,0.03);}' +
    '.tjm-c-field{display:grid;gap:6px;}' +
    '.tjm-c-field label{font-size:0.82rem;font-weight:500;color:var(--text-color,inherit);}' +
    '.tjm-c-field input,.tjm-c-field textarea{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--border-color,#d1d5db);' +
    'border-radius:6px;background:var(--bg-color,var(--washi,#fff));color:var(--text-color,var(--ink,#222));font-family:inherit;font-size:0.92rem;line-height:1.6;}' +
    '.tjm-c-field textarea{min-height:110px;resize:vertical;}' +
    '.tjm-c-field input:focus,.tjm-c-field textarea:focus{outline:none;border-color:var(--accent-color,var(--blue,#1a3fb9));box-shadow:0 0 0 3px rgba(26,63,185,0.12);}' +
    '.tjm-c-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;}' +
    '.tjm-c-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}' +
    '.tjm-c-submit{padding:10px 22px;border:0;border-radius:999px;background:var(--accent-color,var(--blue,#1a3fb9));color:#fff;' +
    'font-family:inherit;font-size:0.88rem;font-weight:500;cursor:pointer;transition:opacity 0.2s;}' +
    '.tjm-c-submit:hover{opacity:0.88;}' +
    '.tjm-c-submit:disabled{opacity:0.55;cursor:not-allowed;}' +
    '.tjm-c-msg{font-size:0.84rem;line-height:1.6;margin:0;}' +
    '.tjm-c-msg.is-ok{color:#15803d;}' +
    '.tjm-c-msg.is-err{color:#b91c1c;}' +
    '[data-theme="dark"] .tjm-c-msg.is-ok{color:#4ade80;}' +
    '[data-theme="dark"] .tjm-c-msg.is-err{color:#f87171;}';
  document.head.appendChild(style);

  var pageId = (slot.getAttribute('data-page-id') || location.pathname).split('?')[0].split('#')[0];

  var section = document.createElement('section');
  section.className = 'comments-section';
  section.id = 'comments';
  section.setAttribute('aria-label', langKey === 'en' ? 'Comments' : 'コメント');

  var h2 = document.createElement('h2');
  h2.textContent = slot.getAttribute('data-heading') || T.heading;
  section.appendChild(h2);

  var intro = document.createElement('p');
  intro.className = 'comments-intro';
  intro.textContent = slot.getAttribute('data-intro') || T.intro;
  section.appendChild(intro);

  var countEl = document.createElement('p');
  countEl.className = 'tjm-c-count';
  countEl.hidden = true;
  section.appendChild(countEl);

  var listWrap = document.createElement('div');
  var loadingEl = document.createElement('p');
  loadingEl.className = 'tjm-c-empty';
  loadingEl.textContent = T.loading;
  listWrap.appendChild(loadingEl);
  section.appendChild(listWrap);

  var form = document.createElement('form');
  form.className = 'tjm-c-form';
  form.noValidate = true;

  var fName = document.createElement('div');
  fName.className = 'tjm-c-field';
  var lName = document.createElement('label');
  lName.htmlFor = 'tjm-comment-name';
  lName.textContent = T.nameLabel;
  var iName = document.createElement('input');
  iName.id = 'tjm-comment-name';
  iName.name = 'nickname';
  iName.type = 'text';
  iName.maxLength = 40;
  iName.required = true;
  iName.autocomplete = 'nickname';
  iName.placeholder = T.namePlaceholder;
  fName.appendChild(lName);
  fName.appendChild(iName);
  form.appendChild(fName);

  var fBody = document.createElement('div');
  fBody.className = 'tjm-c-field';
  var lBody = document.createElement('label');
  lBody.htmlFor = 'tjm-comment-body';
  lBody.textContent = T.bodyLabel;
  var iBody = document.createElement('textarea');
  iBody.id = 'tjm-comment-body';
  iBody.name = 'content';
  iBody.maxLength = 2000;
  iBody.required = true;
  iBody.placeholder = T.bodyPlaceholder;
  fBody.appendChild(lBody);
  fBody.appendChild(iBody);
  form.appendChild(fBody);

  // Honeypot field for bot filtering
  var hpWrap = document.createElement('div');
  hpWrap.className = 'tjm-c-hp';
  hpWrap.setAttribute('aria-hidden', 'true');
  var iHp = document.createElement('input');
  iHp.type = 'text';
  iHp.name = 'website';
  iHp.tabIndex = -1;
  iHp.autocomplete = 'off';
  hpWrap.appendChild(iHp);
  form.appendChild(hpWrap);

  var actions = document.createElement('div');
  actions.className = 'tjm-c-actions';
  var btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'tjm-c-submit';
  btn.textContent = T.submit;
  var msgEl = document.createElement('p');
  msgEl.className = 'tjm-c-msg';
  msgEl.setAttribute('aria-live', 'polite');
  actions.appendChild(btn);
  actions.appendChild(msgEl);
  form.appendChild(actions);

  section.appendChild(form);
  (staticAnchor || slot).replaceWith(section);

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return y + '.' + m + '.' + day;
    } catch {
      return '';
    }
  }

  function renderComments(comments) {
    listWrap.innerHTML = '';
    if (!comments || !comments.length) {
      countEl.hidden = true;
      var empty = document.createElement('p');
      empty.className = 'tjm-c-empty';
      empty.textContent = T.empty;
      listWrap.appendChild(empty);
      return;
    }
    countEl.textContent = T.count(comments.length);
    countEl.hidden = false;

    var ul = document.createElement('ul');
    ul.className = 'tjm-c-list';
    comments.forEach(function (c) {
      var li = document.createElement('li');
      li.className = 'tjm-c-item';

      var head = document.createElement('div');
      head.className = 'tjm-c-item__head';
      var nameSpan = document.createElement('span');
      nameSpan.className = 'tjm-c-item__name';
      nameSpan.textContent = c.nickname || '';
      var dateSpan = document.createElement('time');
      dateSpan.className = 'tjm-c-item__date';
      dateSpan.dateTime = c.created_at || '';
      dateSpan.textContent = formatDate(c.created_at);
      head.appendChild(nameSpan);
      head.appendChild(dateSpan);

      var bodyP = document.createElement('p');
      bodyP.className = 'tjm-c-item__body';
      bodyP.textContent = c.content || '';

      li.appendChild(head);
      li.appendChild(bodyP);
      ul.appendChild(li);
    });
    listWrap.appendChild(ul);
  }

  function loadComments() {
    fetch(API_BASE + '/api/comments?page_id=' + encodeURIComponent(pageId))
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        renderComments(data.comments || []);
      })
      .catch(function () {
        listWrap.innerHTML = '';
        var err = document.createElement('p');
        err.className = 'tjm-c-empty';
        err.textContent = T.loadError;
        listWrap.appendChild(err);
      });
  }

  loadComments();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nickname = iName.value.trim();
    var content = iBody.value.trim();
    msgEl.className = 'tjm-c-msg';
    msgEl.textContent = '';

    if (!nickname || content.length < 2) {
      msgEl.classList.add('is-err');
      msgEl.textContent = T.errEmpty;
      return;
    }

    btn.disabled = true;
    btn.textContent = T.sending;

    fetch(API_BASE + '/api/comments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        page_id: pageId,
        page_title: document.title,
        nickname: nickname,
        content: content,
        website: iHp.value,
      }),
    })
      .then(function (res) {
        if (res.status === 429) throw new Error('rate');
        if (!res.ok) throw new Error('fail');
        return res.json();
      })
      .then(function () {
        iName.value = '';
        iBody.value = '';
        msgEl.classList.add('is-ok');
        msgEl.textContent = T.success;
      })
      .catch(function (err) {
        msgEl.classList.add('is-err');
        msgEl.textContent = err && err.message === 'rate' ? T.errRate : T.errFail;
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = T.submit;
      });
  });

  // 「書き込みはこちら」→コメント欄への確実なジャンプ
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href="#comments"]') : null;
    if (!a) return;
    e.preventDefault();
    var target = document.getElementById('comments');
    if (!target) return;
    var jump = function (smooth) {
      target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    };
    var imgs = document.querySelectorAll('img[loading="lazy"]');
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].loading = 'eager';
      if (!imgs[i].complete) imgs[i].addEventListener('load', function () { jump(false); }, { once: true });
    }
    jump(true);
    var tries = 0;
    (function settle() { jump(false); if (++tries < 6) setTimeout(settle, 300); })();
  });
})();
