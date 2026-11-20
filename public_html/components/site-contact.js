/* =====================================================================
   Talennexus — <site-contact> component (Business / Individual form)
   ---------------------------------------------------------------------
   Usage on any page:
     <head>
       <script src="../components/site-contact.js?v=20261118"></script>   (sub-folder pages)
       <script src="components/site-contact.js?v=20261118"></script>      (root pages)
     </head>
     <body>
       <site-contact id="contact-form"></site-contact>

   Optional attribute:  <site-contact tab="individual">  opens that tab first.

   Each tab posts to its own Zoho Form. Field "name" values MUST stay
   exactly as Zoho generated them, or Zoho saves empty values.
   ===================================================================== */
(function () {
  'use strict';

  var SCRIPT_SRC = document.currentScript && document.currentScript.src;
  var ROOT = SCRIPT_SRC ? new URL('../', SCRIPT_SRC) : new URL('/', location.href);
  var THANK_YOU_URL = new URL('thank-you', ROOT).href;

  /* ------------------------------ FORMS ------------------------------ */
  // Add the Individual form here when its Zoho code is ready
  // (same structure as "business").
  var FORMS = {
    business: {
      label: 'Business',
      icon: 'bi-briefcase-fill',
      action: 'https://forms.zohopublic.in/verifitech/form/TalennexusBusinessForm/formperma/QGgtjIjhUpkDA3k6YnUeHYzIFLzeTzXlXDn_3rd1O1M/htmlRecords/submit',
      fields: [
        { name: 'SingleLine', label: 'Full Name', type: 'text', required: true, maxlength: 255, autocomplete: 'name' },
        { name: 'Email', label: 'Business Email', type: 'email', required: true, maxlength: 255, autocomplete: 'email', half: true },
        { name: 'PhoneNumber_countrycode', label: 'Contact Number', type: 'tel', required: true, maxlength: 20, autocomplete: 'tel', half: true },
        {
          // Shown as checkboxes. Zoho's field is a single-choice DROPDOWN, so only one
          // can be ticked. If the Zoho field is changed to "Checkbox" (multiple choice),
          // set multiple: true and use the new field name from Zoho's code.
          name: 'Dropdown', label: 'What are you looking for?', type: 'multiselect', multiple: false, emptyValue: '-Select-',
          options: [
            { value: 'Staffing Support', label: 'Staffing Support' },
            // value keeps Zoho's spelling so Zoho accepts it
            { value: 'Recuritment Management', label: 'Recruitment Management' },
            { value: 'Technical Interview', label: 'Technical Interview' },
            { value: 'Psychometric Assessment', label: 'Psychometric Assessment' },
            { value: 'Payroll Services', label: 'Payroll Services' },
            { value: 'Exit Interview', label: 'Exit Interview' }
          ]
        }
      ],
      hidden: { Dropdown1: 'Business' }
    },
    individual: {
      label: 'Individual',
      icon: 'bi-person-circle',
      action: 'https://forms.zohopublic.in/verifitech/form/TelennexusIndividualForm/formperma/irQASegdWZvx1jmc6djWyqHd4Q0MbZvtmbA8whiLUno/htmlRecords/submit',
      fields: [
        { name: 'Name_First', label: 'First Name', type: 'text', required: true, maxlength: 255, autocomplete: 'given-name', half: true },
        { name: 'Name_Last', label: 'Last Name', type: 'text', maxlength: 255, autocomplete: 'family-name', half: true },
        { name: 'PhoneNumber_countrycode', label: 'Phone', type: 'tel', required: true, maxlength: 20, autocomplete: 'tel', half: true },
        { name: 'Email', label: 'Email Address', type: 'email', required: true, maxlength: 255, autocomplete: 'email', half: true },
        // Zoho's "Why Are You Looking For?" is a free-text field — shown as a text box
        { name: 'SingleLine', label: 'What are you looking for?', type: 'text', maxlength: 255,
          placeholder: 'e.g. Job opportunities, career guidance, training' }
      ],
      // In this Zoho form the "Form Name" field is called "Dropdown"
      hidden: { Dropdown: 'Individual' }
    }
  };

  /* ----------------------------- STYLES ----------------------------- */
  var CSS = `
    site-contact {
      display: block;
      --sc-navy: #14355d; --sc-primary: #1e3a5f; --sc-accent: #4a90d9; --sc-accent-dark: #2f6fb6;
      --sc-gradient: linear-gradient(135deg, #1e3a5f 0%, #4a90d9 100%);
      --sc-light: #e6eef7; --sc-paper: #f5f8fc; --sc-ink: #0f2440; --sc-text: #4a5b70; --sc-line: #d9e5f2;
      --sc-error: #c0392b;
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: var(--sc-text);
      line-height: 1.6; text-align: left;
    }
    site-contact *, site-contact *::before, site-contact *::after { box-sizing: border-box; }
    site-contact .sc-wrap { max-width: 1140px; margin: 0 auto; padding: 0 16px; }
    site-contact .sc-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
    site-contact .sc-cols > * { min-width: 0; }
    site-contact h2, site-contact h3, site-contact p, site-contact ul { margin-top: 0; }
    site-contact button, site-contact input, site-contact select { font: inherit; }
    site-contact .sc-section { padding: 100px 0; background: var(--sc-paper); }
    site-contact .sc-pill {
      display: inline-flex; align-items: center; gap: 8px; padding: 7px 18px; border-radius: 50px;
      background: var(--sc-light); color: var(--sc-accent-dark); font-weight: 600; font-size: .9rem; margin-bottom: 18px;
    }
    site-contact .sc-title {
      font-family: 'Poppins', 'Inter', system-ui, sans-serif; font-weight: 700; color: var(--sc-ink); letter-spacing: -0.02em;
      font-size: clamp(2.1rem, 4.4vw, 3.3rem); line-height: 1.1; margin: 0 0 18px;
    }
    site-contact .sc-title span { color: var(--sc-accent); }
    site-contact .sc-lead { font-size: 1.1rem; line-height: 1.7; max-width: 520px; margin-bottom: 30px; }
    site-contact .sc-points { list-style: none; padding: 0; margin: 0 0 28px; }
    site-contact .sc-points li { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; font-size: 1.05rem; font-weight: 500; color: var(--sc-ink); }
    site-contact .sc-points i {
      width: 48px; height: 48px; border-radius: 50%; background: var(--sc-light); color: var(--sc-accent-dark);
      display: inline-flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;
    }
    site-contact .sc-direct { display: flex; flex-wrap: wrap; gap: 10px 24px; font-size: .95rem; }
    site-contact .sc-direct a { color: var(--sc-navy); font-weight: 600; text-decoration: none; }
    site-contact .sc-direct a:hover { color: var(--sc-accent-dark); }
    site-contact .sc-direct i { color: var(--sc-accent); margin-right: 6px; }

    site-contact .sc-card {
      background: #fff; border: 1px solid var(--sc-line); border-radius: 24px; padding: 34px;
      box-shadow: 0 22px 50px rgba(20, 53, 93, 0.12);
    }
    site-contact .sc-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 26px; }
    site-contact .sc-tab {
      display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px 12px;
      border-radius: 14px; border: 1.5px solid var(--sc-line); background: #fff; color: var(--sc-ink);
      font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 1.05rem; cursor: pointer; transition: all .2s ease;
    }
    site-contact .sc-tab:hover { border-color: var(--sc-accent); }
    site-contact .sc-tab[aria-selected="true"] {
      background: var(--sc-gradient); color: #fff; border-color: transparent; box-shadow: 0 10px 22px rgba(30,58,95,.25);
    }
    site-contact .sc-tab:focus-visible { outline: 3px solid rgba(74,144,217,.4); outline-offset: 2px; }

    site-contact .sc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    site-contact .sc-field { grid-column: span 2; position: relative; }
    site-contact .sc-field.half { grid-column: span 1; }
    site-contact .sc-field label { display: block; font-size: .85rem; font-weight: 600; color: var(--sc-ink); margin-bottom: 6px; }
    site-contact .sc-field label em { color: var(--sc-error); font-style: normal; }
    site-contact .sc-input {
      width: 100%; border: 1.5px solid var(--sc-line); border-radius: 12px; padding: 14px 16px; font-size: 1rem;
      font-family: inherit; color: var(--sc-ink); background: #fff; transition: border-color .2s ease, box-shadow .2s ease; appearance: none;
    }
    site-contact select.sc-input {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%231e3a5f' stroke-width='2' d='M2 5l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 16px center; padding-right: 42px; cursor: pointer;
    }
    site-contact .sc-input::placeholder { color: #95a3b3; }
    site-contact .sc-input:focus { outline: none; border-color: var(--sc-accent); box-shadow: 0 0 0 4px rgba(74,144,217,.15); }
    site-contact .sc-field.invalid .sc-input { border-color: var(--sc-error); }
    /* "What are you looking for?" — dropdown that opens a checkbox panel */
    site-contact .sc-ms { position: relative; }
    site-contact .sc-ms-btn {
      display: flex; align-items: center; justify-content: space-between; gap: 10px; text-align: left; cursor: pointer;
    }
    site-contact .sc-ms-btn .sc-ms-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--sc-ink); }
    site-contact .sc-ms-btn .sc-ms-value.empty { color: #95a3b3; }
    site-contact .sc-ms-btn .bi-chevron-down { color: var(--sc-primary); transition: transform .2s ease; flex-shrink: 0; }
    site-contact .sc-ms-btn[aria-expanded="true"] { border-color: var(--sc-accent); box-shadow: 0 0 0 4px rgba(74,144,217,.15); }
    site-contact .sc-ms-btn[aria-expanded="true"] .bi-chevron-down { transform: rotate(180deg); }
    site-contact .sc-ms-panel {
      position: absolute; left: 0; right: 0; top: calc(100% + 8px); z-index: 30; background: #fff;
      border: 1px solid var(--sc-line); border-radius: 16px; box-shadow: 0 20px 45px rgba(20,53,93,.18); padding: 16px 14px 14px;
    }
    site-contact .sc-ms-head { font-size: .78rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--sc-text); margin: 0 4px 10px; }
    site-contact .sc-ms-list { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; max-height: 230px; overflow-y: auto; padding: 2px 4px; }
    site-contact .sc-ms-list label.sc-opt {
      display: flex; align-items: center; gap: 10px; padding: 9px 6px; border-radius: 10px; cursor: pointer; margin: 0;
      font-size: .95rem; font-weight: 500; color: var(--sc-ink); line-height: 1.3; user-select: none; transition: background .15s ease;
    }
    site-contact .sc-ms-list label.sc-opt:hover { background: var(--sc-paper); }
    site-contact .sc-opt input { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }
    site-contact .sc-box {
      width: 20px; height: 20px; border-radius: 5px; border: 2px solid #b9cfe6; flex-shrink: 0; background: #fff;
      display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: .85rem; transition: all .15s ease;
    }
    site-contact .sc-box i { opacity: 0; transform: scale(.6); transition: all .15s ease; }
    site-contact .sc-opt input:checked + .sc-box { background: var(--sc-gradient); border-color: transparent; }
    site-contact .sc-opt input:checked + .sc-box i { opacity: 1; transform: scale(1); }
    site-contact .sc-opt input:focus-visible + .sc-box { box-shadow: 0 0 0 3px rgba(74,144,217,.35); }
    site-contact .sc-ms-done {
      display: block; width: 100%; margin-top: 12px; border: 0; border-radius: 12px; padding: 12px; cursor: pointer;
      background: var(--sc-light); color: var(--sc-navy); font-weight: 600; font-size: 1rem; transition: background .2s ease;
    }
    site-contact .sc-ms-done:hover { background: #d6e4f4; }
    site-contact .sc-err { display: none; color: var(--sc-error); font-size: .8rem; margin-top: 5px; }
    site-contact .sc-field.invalid .sc-err { display: block; }

    site-contact .sc-submit {
      width: 100%; margin-top: 22px; border: 0; border-radius: 14px; padding: 16px; font-size: 1.08rem; font-weight: 600;
      font-family: 'Poppins', sans-serif; color: #fff; background: var(--sc-gradient); cursor: pointer;
      box-shadow: 0 10px 24px rgba(30,58,95,.25); transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
      display: flex; align-items: center; justify-content: center; gap: 10px;
    }
    site-contact .sc-submit:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(30,58,95,.32); }
    site-contact .sc-submit[disabled] { opacity: .75; cursor: wait; transform: none; }
    site-contact .sc-spin { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; animation: sc-spin .8s linear infinite; display: none; }
    site-contact .sc-submit[disabled] .sc-spin { display: inline-block; }
    @keyframes sc-spin { to { transform: rotate(360deg); } }
    site-contact .sc-note { text-align: center; font-size: .86rem; margin: 16px 0 0; }

    site-contact .sc-soon { text-align: center; padding: 30px 10px 10px; }
    site-contact .sc-soon i { font-size: 2.2rem; color: var(--sc-accent); }
    site-contact .sc-soon h3 { font-family: 'Poppins', sans-serif; color: var(--sc-ink); font-size: 1.2rem; margin: 10px 0 8px; }
    site-contact .sc-soon a { color: var(--sc-navy); font-weight: 600; }

    @media (max-width: 991.98px) {
      site-contact .sc-section { padding: 70px 0; }
      site-contact .sc-cols { grid-template-columns: 1fr; gap: 34px; }
    }
    @media (max-width: 575.98px) {
      site-contact .sc-card { padding: 22px 18px; border-radius: 20px; }
      site-contact .sc-field.half { grid-column: span 2; }
      site-contact .sc-ms-list { grid-template-columns: 1fr; }
      site-contact .sc-tab { font-size: .95rem; padding: 13px 8px; }
    }
  `;

  /* ----------------------------- HELPERS ---------------------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ensureAssets() {
    var links = [].map.call(document.querySelectorAll('link[rel="stylesheet"]'), function (l) { return l.href; }).join(' ');
    function add(href) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
    if (links.indexOf('Poppins') === -1 || links.indexOf('Inter') === -1)
      add('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap');
    if (links.indexOf('bootstrap-icons') === -1)
      add('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css');
  }
  function injectStyles() {
    ensureAssets();
    if (document.getElementById('site-contact-styles')) return;
    var st = document.createElement('style');
    st.id = 'site-contact-styles';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  var uid = 0;

  function fieldHtml(f, prefix) {
    var id = prefix + '-' + f.name;
    var req = f.required ? ' required' : '';
    var lab = '<label for="' + id + '">' + esc(f.label) + (f.required ? ' <em>*</em>' : '') + '</label>';
    var input;
    if (f.type === 'multiselect') {
      var placeholder = f.placeholder || 'Select what you\u2019re looking for';
      return '<div class="sc-field sc-ms" data-name="' + esc(f.name) + '" data-multiple="' + (f.multiple ? 'true' : 'false') + '"' +
          ' data-empty="' + esc(f.emptyValue || '') + '" data-maxlength="' + (f.maxlength || 255) + '" data-placeholder="' + esc(placeholder) + '">' +
        '<label for="' + id + '">' + esc(f.label) + '</label>' +
        '<input type="hidden" name="' + esc(f.name) + '" value="' + esc(f.emptyValue || '') + '">' +
        '<button type="button" class="sc-input sc-ms-btn" id="' + id + '" aria-haspopup="true" aria-expanded="false" aria-controls="' + id + '-panel">' +
          '<span class="sc-ms-value empty">' + esc(placeholder) + '</span><i class="bi bi-chevron-down"></i></button>' +
        '<div class="sc-ms-panel" id="' + id + '-panel" hidden>' +
          '<div class="sc-ms-head">' + (f.multiple ? 'Select all that apply' : 'Select one') + '</div>' +
          '<div class="sc-ms-list" role="group" aria-label="' + esc(f.label) + '">' + f.options.map(function (o, i) {
            var cid = id + '-' + i;
            return '<label class="sc-opt" for="' + cid + '"><input type="checkbox" id="' + cid + '" value="' + esc(o.value) + '" data-label="' + esc(o.label) + '">' +
              '<span class="sc-box" aria-hidden="true"><i class="bi bi-check-lg"></i></span><span>' + esc(o.label) + '</span></label>';
          }).join('') + '</div>' +
          '<button type="button" class="sc-ms-done">Done</button>' +
        '</div>' +
        '<div class="sc-err" id="' + id + '-err" role="alert"></div></div>';
    }
    if (f.type === 'select') {
      input = '<select class="sc-input" id="' + id + '" name="' + esc(f.name) + '"' + req + '>' +
        '<option value="-Select-" selected>-Select-</option>' +
        f.options.map(function (o) { return '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>'; }).join('') +
        '</select>';
    } else {
      input = '<input class="sc-input" id="' + id + '" name="' + esc(f.name) + '" type="' + (f.type === 'tel' ? 'tel' : f.type === 'email' ? 'email' : 'text') + '"' +
        (f.maxlength ? ' maxlength="' + f.maxlength + '"' : '') +
        (f.autocomplete ? ' autocomplete="' + f.autocomplete + '"' : '') +
        (f.type === 'tel' ? ' inputmode="tel"' : '') +
        ' placeholder="' + esc(f.placeholder || f.label) + '"' + req + '>';
    }
    return '<div class="sc-field' + (f.half ? ' half' : '') + '">' + lab + input +
      '<div class="sc-err" id="' + id + '-err" role="alert"></div></div>';
  }

  function formHtml(key, cfg, prefix) {
    var hidden = Object.assign({ zf_referrer_name: '', zf_redirect_url: '', zc_gad: '' }, cfg.hidden || {});
    return '<form class="sc-form" data-form="' + key + '" action="' + esc(cfg.action) + '" method="POST" accept-charset="UTF-8" enctype="multipart/form-data" novalidate>' +
      Object.keys(hidden).map(function (n) { return '<input type="hidden" name="' + esc(n) + '" value="' + esc(hidden[n]) + '">'; }).join('') +
      '<div class="sc-grid">' + cfg.fields.map(function (f) { return fieldHtml(f, prefix + '-' + key); }).join('') + '</div>' +
      '<button type="submit" class="sc-submit"><span class="sc-spin" aria-hidden="true"></span><span class="sc-btn-text">Submit</span></button>' +
      '<p class="sc-note">We reply within 24 hours on business days. Your details are used only to respond to your enquiry.</p>' +
      '</form>';
  }

  function soonHtml() {
    return '<div class="sc-soon"><i class="bi bi-person-circle"></i><h3>Individual enquiries</h3>' +
      '<p>Looking for a job or career guidance? Email <a href="mailto:connect@talennexus.com">connect@talennexus.com</a> ' +
      'or call <a href="tel:+919952978818">+91 995 297 8818</a>.</p></div>';
  }

  /* --------------------------- VALIDATION --------------------------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function setErr(input, msg) {
    var wrap = input.closest('.sc-field');
    wrap.classList.toggle('invalid', !!msg);
    wrap.querySelector('.sc-err').textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  function check(input) {
    var v = input.value.trim();
    if (input.required && (!v || v === '-Select-')) return setErr(input, 'This field is required.');
    if (input.type === 'email' && v && !EMAIL_RE.test(v)) return setErr(input, 'Please enter a valid email address.');
    if (input.type === 'tel' && v) {
      var digits = v.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) return setErr(input, 'Please enter a valid phone number (10–15 digits).');
    }
    return setErr(input, '');
  }

  /* --------------------------- COMPONENT ---------------------------- */
  class SiteContact extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      injectStyles();
      var prefix = 'sc' + (++uid);
      var keys = Object.keys(FORMS);
      var start = (this.getAttribute('tab') || 'business').toLowerCase();
      if (keys.indexOf(start) === -1) start = 'business';

      var tabs = '<div class="sc-tabs" role="tablist" aria-label="Enquiry type">' + keys.map(function (k) {
        var cfg = FORMS[k] || { label: 'Individual', icon: 'bi-person-circle' };
        return '<button type="button" class="sc-tab" role="tab" id="' + prefix + '-tab-' + k + '" aria-controls="' + prefix + '-panel-' + k + '" aria-selected="' + (k === start) + '" data-tab="' + k + '">' +
          '<i class="bi ' + (cfg.icon || 'bi-person-circle') + '"></i>' + esc(cfg.label || k) + '</button>';
      }).join('') + '</div>';

      var panels = keys.map(function (k) {
        return '<div class="sc-panel" role="tabpanel" id="' + prefix + '-panel-' + k + '" aria-labelledby="' + prefix + '-tab-' + k + '"' + (k === start ? '' : ' hidden') + '>' +
          (FORMS[k] ? formHtml(k, FORMS[k], prefix) : soonHtml()) + '</div>';
      }).join('');

      this.innerHTML =
        '<section class="sc-section"><div class="sc-wrap"><div class="sc-cols">' +
          '<div class="sc-info">' +
            '<span class="sc-pill"><i class="bi bi-chat-dots"></i> Contact Us</span>' +
            '<h2 class="sc-title">Let’s Build Your <span>Winning Team</span></h2>' +
            '<p class="sc-lead">Have a hiring need or an HR question? Tell us a little about it and our team will get back to you within 24 hours on business days.</p>' +
            '<ul class="sc-points">' +
              '<li><i class="bi bi-headset"></i>Talk to an HR expert</li>' +
              '<li><i class="bi bi-lightning-charge"></i>Explore our services</li>' +
              '<li><i class="bi bi-chat-square-text"></i>Discuss your hiring requirements</li>' +
            '</ul>' +
            '<div class="sc-direct"><a href="tel:+919952978818"><i class="bi bi-telephone-fill"></i>+91 995 297 8818</a>' +
            '<a href="mailto:connect@talennexus.com"><i class="bi bi-envelope-fill"></i>connect@talennexus.com</a></div>' +
          '</div>' +
          '<div class="sc-form-col"><div class="sc-card">' + tabs + panels + '</div></div>' +
        '</div></div></section>';

      var self = this;

      // Tabs
      this.querySelectorAll('.sc-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.querySelectorAll('.sc-tab').forEach(function (b) { b.setAttribute('aria-selected', String(b === btn)); });
          self.querySelectorAll('.sc-panel').forEach(function (p) { p.hidden = p.id !== prefix + '-panel-' + btn.dataset.tab; });
        });
      });

      // "What are you looking for?" dropdown-checkbox panels
      function syncMs(ms) {
        var checked = [].filter.call(ms.querySelectorAll('.sc-opt input'), function (c) { return c.checked; });
        var labels = checked.map(function (c) { return c.dataset.label; });
        var vals = checked.map(function (c) { return c.value; });
        var hidden = ms.querySelector('input[type="hidden"]');
        hidden.value = vals.length ? vals.join(', ').slice(0, +ms.dataset.maxlength || 255) : ms.dataset.empty;
        var out = ms.querySelector('.sc-ms-value');
        out.classList.toggle('empty', !labels.length);
        out.textContent = !labels.length ? ms.dataset.placeholder
          : labels.length <= 2 ? labels.join(', ') : labels[0] + ' +' + (labels.length - 1) + ' more';
      }
      function openMs(ms, open) {
        ms.querySelector('.sc-ms-panel').hidden = !open;
        ms.querySelector('.sc-ms-btn').setAttribute('aria-expanded', String(open));
      }
      this.querySelectorAll('.sc-ms').forEach(function (ms) {
        var btn = ms.querySelector('.sc-ms-btn');
        var single = ms.dataset.multiple !== 'true';
        btn.addEventListener('click', function () {
          var willOpen = btn.getAttribute('aria-expanded') !== 'true';
          self.querySelectorAll('.sc-ms').forEach(function (o) { if (o !== ms) openMs(o, false); });
          openMs(ms, willOpen);
          if (willOpen) { var first = ms.querySelector('.sc-opt input:checked') || ms.querySelector('.sc-opt input'); if (first) first.focus(); }
        });
        ms.querySelectorAll('.sc-opt input').forEach(function (cb) {
          cb.addEventListener('change', function () {
            if (single && cb.checked) {
              ms.querySelectorAll('.sc-opt input').forEach(function (o) { if (o !== cb) o.checked = false; });
            }
            syncMs(ms);
            if (single && cb.checked) { openMs(ms, false); btn.focus(); }
          });
        });
        ms.querySelector('.sc-ms-done').addEventListener('click', function () { openMs(ms, false); btn.focus(); });
        ms.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { openMs(ms, false); btn.focus(); }
        });
      });
      document.addEventListener('click', function (e) {
        self.querySelectorAll('.sc-ms').forEach(function (ms) { if (!ms.contains(e.target)) openMs(ms, false); });
      });

      // Forms
      this.querySelectorAll('.sc-form').forEach(function (form) {
        var key = form.dataset.form;
        form.querySelectorAll('.sc-input:not(.sc-ms-btn)').forEach(function (inp) {
          inp.addEventListener('blur', function () { if (inp.value.trim()) check(inp); });
          inp.addEventListener('input', function () { if (inp.closest('.sc-field').classList.contains('invalid')) check(inp); });
        });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var ok = true, first = null;
          form.querySelectorAll('.sc-input:not(.sc-ms-btn)').forEach(function (inp) {
            if (!check(inp)) { ok = false; first = first || inp; }
          });
          if (!ok) { first.focus(); return; }

          form.querySelectorAll('.sc-ms').forEach(function (ms) { syncMs(ms); openMs(ms, false); });
          // Zoho expects digits only for the phone field
          form.querySelectorAll('input[type="tel"]').forEach(function (t) { t.value = t.value.replace(/\D/g, ''); });
          // Hidden tracking fields
          form.elements.zf_redirect_url.value = THANK_YOU_URL;
          form.elements.zf_referrer_name.value = location.pathname;
          var gclid = new URLSearchParams(location.search).get('gclid');
          if (gclid) form.elements.zc_gad.value = gclid;

          var btn = form.querySelector('.sc-submit');
          btn.disabled = true;
          btn.querySelector('.sc-btn-text').textContent = 'Sending…';

          // Google Tag Manager lead event
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: 'generate_lead', form_type: key });

          HTMLFormElement.prototype.submit.call(form);
        });
      });

      // Re-enable the button if the visitor comes back with the Back button
      window.addEventListener('pageshow', function (ev) {
        if (!ev.persisted) return;
        self.querySelectorAll('.sc-submit').forEach(function (b) {
          b.disabled = false; b.querySelector('.sc-btn-text').textContent = 'Submit';
        });
        self.querySelectorAll('.sc-form').forEach(function (f) { f.reset(); });
        self.querySelectorAll('.sc-ms').forEach(function (ms) { syncMs(ms); });
      });
    }
  }

  if (!customElements.get('site-contact')) customElements.define('site-contact', SiteContact);
})();
