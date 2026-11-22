/**
 * tojimasaya.com - お問い合わせフォーム (Cloudflare Workers + D1 + Telegram 通知)
 *
 * 対象ページに <div id="contact-slot" data-lang="ja|en|zh-Hant"></div> を置く。
 */
(function () {
  'use strict';

  var API_BASE = 'https://cusdis-telegram.tjmjp22.workers.dev';
  var slot = document.getElementById('contact-slot');
  if (!slot) return;

  var rawLang = (slot.getAttribute('data-lang') || document.documentElement.lang || 'ja').toLowerCase();
  var langKey = rawLang.indexOf('en') === 0 ? 'en' : rawLang.indexOf('zh') === 0 ? 'hk' : 'ja';

  var I18N = {
    ja: {
      title: 'お問い合わせフォーム',
      note: 'フォームから直接お送りいただけます（内容確認のうえメールにて返信いたします）。',
      catLabel: 'ご用件',
      cats: ['写真の利用・掲載・プリント', '執筆・取材のご相談', '記事の情報アップデート・誤記のご連絡', 'その他'],
      nameLabel: 'お名前',
      namePlaceholder: '例：山田 太郎',
      emailLabel: 'メールアドレス（返信先）',
      emailPlaceholder: 'you@example.com',
      msgLabel: 'お問い合わせ内容',
      msgPlaceholder: 'ご用件をお書きください',
      submit: '送信する',
      sending: '送信中…',
      success: 'お問い合わせを受け付けました。内容を確認のうえご連絡いたします。',
      errInvalid: 'お名前・正しいメールアドレス・お問い合わせ内容（5文字以上）をご入力ください。',
      errRate: '短時間に続けて送信されています。少し時間をおいてからお試しください。',
      errFail: '送信に失敗しました。時間をおいて再度お試しいただくか、メールにてご連絡ください。',
    },
    en: {
      title: 'Contact Form',
      note: 'Send a message directly from here and I will reply by email.',
      catLabel: 'Topic',
      cats: ['Photo licensing / prints / exhibition', 'Writing / media inquiry', 'Article update / correction', 'Other'],
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      emailLabel: 'Email address',
      emailPlaceholder: 'you@example.com',
      msgLabel: 'Message',
      msgPlaceholder: 'How can I help?',
      submit: 'Send Message',
      sending: 'Sending…',
      success: 'Thank you! Your message has been received. I will get back to you by email.',
      errInvalid: 'Please enter your name, a valid email address, and a message (at least 5 characters).',
      errRate: 'Too many submissions in a short time. Please wait a minute and try again.',
      errFail: 'Could not send your message right now. Please try again later or email directly.',
    },
    hk: {
      title: '聯絡表單',
      note: '您可直接透過以下表單留言，我會以電郵回覆。',
      catLabel: '查詢類別',
      cats: ['照片授權／刊登／輸出', '撰稿／採訪合作', '文章資訊更新／勘誤', '其他'],
      nameLabel: '姓名／稱呼',
      namePlaceholder: '例如：陳先生',
      emailLabel: '電郵地址（回覆用）',
      emailPlaceholder: 'you@example.com',
      msgLabel: '查詢內容',
      msgPlaceholder: '請輸入您想查詢的內容',
      submit: '送出查詢',
      sending: '送出中…',
      success: '已收到您的查詢！確認內容後會盡快透過電郵回覆。',
      errInvalid: '請填寫姓名、有效的電郵地址與查詢內容（至少 5 個字）。',
      errRate: '短時間內送出過於頻繁，請稍候一分鐘再試。',
      errFail: '送出失敗，請稍後再試或改以電郵聯絡。',
    },
  };
  var T = I18N[langKey];

  var style = document.createElement('style');
  style.textContent =
    '.tjm-contact{margin-top:28px;padding:24px;border:1px solid var(--border-color,#e5e5e5);border-radius:12px;background:rgba(128,128,128,0.03);}' +
    '.tjm-contact__title{font-family:"Noto Serif JP",serif;font-size:1.05rem;font-weight:600;margin:0 0 6px;color:var(--text-color,inherit);}' +
    '.tjm-contact__note{font-size:0.84rem;color:var(--text-light,#666);margin:0 0 18px;line-height:1.7;}' +
    '.tjm-contact__form{display:grid;gap:14px;}' +
    '.tjm-contact__row{display:grid;grid-template-columns:1fr 1fr;gap:14px;}' +
    '@media (max-width:640px){.tjm-contact__row{grid-template-columns:1fr;}}' +
    '.tjm-contact__field{display:grid;gap:6px;}' +
    '.tjm-contact__field label{font-size:0.82rem;font-weight:500;color:var(--text-color,inherit);}' +
    '.tjm-contact__field input,.tjm-contact__field select,.tjm-contact__field textarea{width:100%;box-sizing:border-box;padding:10px 12px;' +
    'border:1px solid var(--border-color,#d1d5db);border-radius:6px;background:var(--bg-color,#fff);color:var(--text-color,#222);' +
    'font-family:inherit;font-size:0.92rem;line-height:1.6;}' +
    '.tjm-contact__field textarea{min-height:120px;resize:vertical;}' +
    '.tjm-contact__field input:focus,.tjm-contact__field select:focus,.tjm-contact__field textarea:focus{outline:none;border-color:var(--accent-color,#1a3fb9);box-shadow:0 0 0 3px rgba(26,63,185,0.12);}' +
    '.tjm-contact__hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;}' +
    '.tjm-contact__actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}' +
    '.tjm-contact__btn{padding:10px 24px;border:0;border-radius:999px;background:var(--accent-color,#1a3fb9);color:#fff;' +
    'font-family:inherit;font-size:0.88rem;font-weight:500;cursor:pointer;transition:opacity 0.2s;}' +
    '.tjm-contact__btn:hover{opacity:0.88;}' +
    '.tjm-contact__btn:disabled{opacity:0.55;cursor:not-allowed;}' +
    '.tjm-contact__msg{font-size:0.84rem;line-height:1.6;margin:0;}' +
    '.tjm-contact__msg.is-ok{color:#15803d;}' +
    '.tjm-contact__msg.is-err{color:#b91c1c;}' +
    '[data-theme="dark"] .tjm-contact__msg.is-ok{color:#4ade80;}' +
    '[data-theme="dark"] .tjm-contact__msg.is-err{color:#f87171;}';
  document.head.appendChild(style);

  var box = document.createElement('div');
  box.className = 'tjm-contact';
  box.id = 'contact';

  var h3 = document.createElement('h3');
  h3.className = 'tjm-contact__title';
  h3.textContent = T.title;
  box.appendChild(h3);

  var note = document.createElement('p');
  note.className = 'tjm-contact__note';
  note.textContent = T.note;
  box.appendChild(note);

  var form = document.createElement('form');
  form.className = 'tjm-contact__form';
  form.noValidate = true;

  // Category
  var fCat = document.createElement('div');
  fCat.className = 'tjm-contact__field';
  var lCat = document.createElement('label');
  lCat.htmlFor = 'tjm-contact-cat';
  lCat.textContent = T.catLabel;
  var sCat = document.createElement('select');
  sCat.id = 'tjm-contact-cat';
  sCat.name = 'category';
  T.cats.forEach(function (label) {
    var opt = document.createElement('option');
    opt.value = label;
    opt.textContent = label;
    sCat.appendChild(opt);
  });
  fCat.appendChild(lCat);
  fCat.appendChild(sCat);
  form.appendChild(fCat);

  // Name + Email row
  var row = document.createElement('div');
  row.className = 'tjm-contact__row';

  var fName = document.createElement('div');
  fName.className = 'tjm-contact__field';
  var lName = document.createElement('label');
  lName.htmlFor = 'tjm-contact-name';
  lName.textContent = T.nameLabel;
  var iName = document.createElement('input');
  iName.id = 'tjm-contact-name';
  iName.name = 'name';
  iName.type = 'text';
  iName.maxLength = 60;
  iName.required = true;
  iName.autocomplete = 'name';
  iName.placeholder = T.namePlaceholder;
  fName.appendChild(lName);
  fName.appendChild(iName);

  var fEmail = document.createElement('div');
  fEmail.className = 'tjm-contact__field';
  var lEmail = document.createElement('label');
  lEmail.htmlFor = 'tjm-contact-email';
  lEmail.textContent = T.emailLabel;
  var iEmail = document.createElement('input');
  iEmail.id = 'tjm-contact-email';
  iEmail.name = 'email';
  iEmail.type = 'email';
  iEmail.maxLength = 120;
  iEmail.required = true;
  iEmail.autocomplete = 'email';
  iEmail.placeholder = T.emailPlaceholder;
  fEmail.appendChild(lEmail);
  fEmail.appendChild(iEmail);

  row.appendChild(fName);
  row.appendChild(fEmail);
  form.appendChild(row);

  // Message
  var fMsg = document.createElement('div');
  fMsg.className = 'tjm-contact__field';
  var lMsg = document.createElement('label');
  lMsg.htmlFor = 'tjm-contact-message';
  lMsg.textContent = T.msgLabel;
  var iMsg = document.createElement('textarea');
  iMsg.id = 'tjm-contact-message';
  iMsg.name = 'message';
  iMsg.maxLength = 3000;
  iMsg.required = true;
  iMsg.placeholder = T.msgPlaceholder;
  fMsg.appendChild(lMsg);
  fMsg.appendChild(iMsg);
  form.appendChild(fMsg);

  // Honeypot
  var hpWrap = document.createElement('div');
  hpWrap.className = 'tjm-contact__hp';
  hpWrap.setAttribute('aria-hidden', 'true');
  var iHp = document.createElement('input');
  iHp.type = 'text';
  iHp.name = 'website';
  iHp.tabIndex = -1;
  iHp.autocomplete = 'off';
  hpWrap.appendChild(iHp);
  form.appendChild(hpWrap);

  // Submit + status
  var actions = document.createElement('div');
  actions.className = 'tjm-contact__actions';
  var btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'tjm-contact__btn';
  btn.textContent = T.submit;
  var msgEl = document.createElement('p');
  msgEl.className = 'tjm-contact__msg';
  msgEl.setAttribute('aria-live', 'polite');
  actions.appendChild(btn);
  actions.appendChild(msgEl);
  form.appendChild(actions);

  box.appendChild(form);
  slot.replaceWith(box);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = iName.value.trim();
    var email = iEmail.value.trim();
    var message = iMsg.value.trim();
    msgEl.className = 'tjm-contact__msg';
    msgEl.textContent = '';

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 5) {
      msgEl.classList.add('is-err');
      msgEl.textContent = T.errInvalid;
      return;
    }

    btn.disabled = true;
    btn.textContent = T.sending;

    fetch(API_BASE + '/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        category: sCat.value,
        name: name,
        email: email,
        message: message,
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
        iEmail.value = '';
        iMsg.value = '';
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
})();
