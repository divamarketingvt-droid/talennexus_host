/* =====================================================================
   Talennexus — <site-footer> component
   ---------------------------------------------------------------------
   Usage (in every page):
     <head>
       ...
       <script src="components/site-footer.js"></script>     (root pages)
       <script src="../components/site-footer.js"></script>  (sub-folder pages)
     </head>
     <body>
       ...
       <site-footer></site-footer>

   Edit the footer ONCE in FOOTER below — every page updates.
   ===================================================================== */
(function () {
  'use strict';

  var SCRIPT_SRC = document.currentScript && document.currentScript.src;
  var ROOT = SCRIPT_SRC ? new URL('../', SCRIPT_SRC) : new URL('/', location.href);

  /* ------------------------------ DATA ------------------------------ */
  var FOOTER = {
    description: 'Empowering enterprises with intelligent HR solutions and SaaS platforms that drive workforce excellence.',
    social: [
      { icon: 'bi-linkedin', label: 'LinkedIn', href: '#' },
      { icon: 'bi-twitter-x', label: 'X (Twitter)', href: '#' },
      { icon: 'bi-facebook', label: 'Facebook', href: '#' },
      { icon: 'bi-instagram', label: 'Instagram', href: '#' }
    ],
    columns: [
      {
        title: 'Services',
        links: [
          { label: 'Recruitment', href: '#' },
          { label: 'Payroll Management', href: '#' },
          { label: 'Compliance', href: '#' },
          { label: 'Virtual HR', href: '#' },
          { label: 'Training & Development', href: '#' },
          { label: 'Campus Nexus', href: '#' }
        ]
      },
      {
        title: 'Company',
        links: [
          { label: 'About Us', href: '#' },
          { label: 'Careers', href: '#' },
          { label: 'Case Studies', href: '#' },
          { label: 'Blog', href: '#' },
          { label: 'Contact', href: '#' }
        ]
      },
      {
        // Location (city) landing pages — add new cities here
        title: 'Locations',
        links: [
          { label: 'Chennai', href: 'recruitment-agency-in-chennai' },
          { label: 'Bangalore', href: 'recruitment-agency-in-bangalore' },
          { label: 'Mumbai', href: 'recruitment-agency-in-mumbai' },
          { label: 'Pune', href: 'recruitment-agency-in-pune' },
          { label: 'Hyderabad', href: 'recruitment-agency-in-hyderabad' }
        ]
      }
    ],
    contact: [
      { icon: 'bi-geo-alt-fill', text: 'M/s. Talennexus, Module No.17, SDF-III, MEPZ SEZ, Tambaram, Chennai – 600045' },
      { icon: 'bi-telephone-fill', text: '+91 995 297 8818' },
      { icon: 'bi-envelope-fill', text: 'connect@talennexus.com' }
    ],
    legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' }
    ]
  };

  /* ----------------------------- STYLES ----------------------------- */
  var CSS = `
    site-footer {
      display: block;
      --primary-color: #1e3a5f;
      --primary-accent: #4a90d9;
      --secondary-color: #14355d;
      --primary-hover: #16304f;
      --gradient-primary: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-accent) 100%);
      --primary-light: #e6eef7;
      --primary-soft: #a8c8e8;
      --text-dark: #1a1a2e;
      --text-gray: #5a6a7a;
      --bg-light: #f0f4f8;
      --white: #FFFFFF;
      --shadow-sm: 0 4px 15px rgba(30, 58, 95, 0.08);
      --shadow-md: 0 8px 25px rgba(30, 58, 95, 0.12);
      --shadow-lg: 0 15px 40px rgba(30, 58, 95, 0.18);
      --glow-primary: 0 0 20px rgba(74, 144, 217, 0.4);
      --border-radius: 12px;
      --transition: all 0.3s ease;
    }
    site-footer .footer { font-family: 'Inter', sans-serif; line-height: 1.6; }
    site-footer .footer h5 { font-family: 'Poppins', sans-serif; font-weight: 700; }
    site-footer .footer {
      background: var(--secondary-color);
      color: rgba(255, 255, 255, 0.8);
      padding: 80px 0 30px;
    }
    site-footer .footer-brand {
      font-family: 'Poppins', sans-serif;
      font-size: 26px;
      font-weight: 700;
      color: var(--white);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    /* Header logo (assets/tl-logo.svg) on a white card so its navy/blue colours show on the dark footer */
    site-footer .footer-logo {
      display: inline-flex;
      align-items: center;
      background: #fff;
      padding: 10px 16px;
      border-radius: 12px;
      line-height: 0;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    site-footer .footer-logo:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.25); }
    site-footer .footer-logo img { height: 44px; width: auto; display: block; }
    site-footer .footer-brand i {
      font-size: 28px;
      color: var(--primary-accent);
    }
    site-footer .footer-desc {
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 25px;
      line-height: 1.7;
    }
    site-footer .social-links {
      display: flex;
      gap: 12px;
    }
    site-footer .social-links a {
      width: 42px;
      height: 42px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--white);
      transition: var(--transition);
    }
    site-footer .social-links a:hover {
      background: var(--gradient-primary);
      transform: translateY(-3px);
    }
    site-footer .footer h5 {
      color: var(--white);
      font-size: 1.15rem;
      margin-bottom: 25px;
      position: relative;
      padding-bottom: 12px;
    }
    site-footer .footer h5::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 40px;
      height: 3px;
      background: var(--gradient-primary);
      border-radius: 2px;
    }
    site-footer .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    site-footer .footer-links li {
      margin-bottom: 12px;
    }
    site-footer .footer-links a {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    site-footer .footer-links a:hover {
      color: var(--primary-accent);
      padding-left: 5px;
    }
    site-footer .footer-contact {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    site-footer .footer-contact li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 18px;
    }
    site-footer .footer-contact i {
      color: var(--primary-accent);
      margin-top: 4px;
    }
    site-footer .newsletter-form {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    site-footer .newsletter-form input {
      flex: 1;
      padding: 12px 18px;
      border: none;
      border-radius: 50px;
      background: rgba(255, 255, 255, 0.1);
      color: var(--white);
    }
    site-footer .newsletter-form input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
    site-footer .newsletter-form button {
      background: var(--gradient-primary);
      color: var(--white);
      border: none;
      padding: 12px 25px;
      border-radius: 50px;
      font-weight: 600;
      transition: var(--transition);
    }
    site-footer .newsletter-form button:hover {
      opacity: 0.9;
    }
    site-footer .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 30px;
      margin-top: 50px;
      text-align: center;
    }
    site-footer .footer-bottom p {
      margin: 0;
      color: rgba(255, 255, 255, 0.6);
    }
    site-footer .footer-bottom a {
      color: var(--primary-accent);
      text-decoration: none;
    }
    /* Newsletter box must shrink to fit its column (never overflow the page) */
    site-footer .newsletter-form { width: 100%; }
    site-footer .newsletter-form input { min-width: 0; width: 100%; }
    site-footer .newsletter-form button { flex-shrink: 0; }
    .site-footer-toast {
      position: fixed; right: 24px; bottom: 24px; z-index: 9999;
      background: #14355d; color: #fff; padding: 14px 22px; border-radius: 10px;
      font: 500 15px 'Inter', sans-serif; box-shadow: 0 8px 25px rgba(30,58,95,.25);
      opacity: 0; transform: translateY(20px); transition: all .3s ease;
    }
    .site-footer-toast.show { opacity: 1; transform: none; }
  `;

  /* ----------------------------- HELPERS ---------------------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function resolve(href) {
    if (!href || href.charAt(0) === '#' || /^(https?:|mailto:|tel:)/.test(href)) return href;
    return new URL(href, ROOT).href;
  }

  /* ----------------------------- RENDER ----------------------------- */
  function template() {
    var f = FOOTER;
    return '' +
      '<footer class="footer"><div class="container"><div class="row g-4">' +

      '<div class="col-lg-3">' +
      '<div class="footer-brand"><a class="footer-logo" href="' + esc(resolve('./')) + '" aria-label="Talennexus home">' +
        '<img src="' + esc(resolve('assets/tl-logo.svg')) + '" alt="Talennexus" width="156" height="44" loading="lazy"></a></div>' +
      '<p class="footer-desc">' + esc(f.description) + '</p>' +
      '<div class="social-links">' +
      f.social.map(function (s) {
        return '<a href="' + esc(resolve(s.href)) + '" aria-label="' + esc(s.label) + '"><i class="bi ' + esc(s.icon) + '"></i></a>';
      }).join('') +
      '</div></div>' +

      f.columns.map(function (col) {
        return '<div class="col-lg-2 col-md-4"><h5>' + esc(col.title) + '</h5><ul class="footer-links">' +
          col.links.map(function (l) {
            return '<li><a href="' + esc(resolve(l.href)) + '">' + esc(l.label) + '</a></li>';
          }).join('') +
          '</ul></div>';
      }).join('') +

      '<div class="col-lg-3"><h5>Contact Info</h5><ul class="footer-contact">' +
      f.contact.map(function (c) {
        return '<li><i class="bi ' + esc(c.icon) + '"></i><span>' + esc(c.text) + '</span></li>';
      }).join('') +
      '</ul>' +
      '<h5 class="mt-4">Newsletter</h5>' +
      '<form class="newsletter-form" id="newsletterForm">' +
      '<input type="email" placeholder="Your email" aria-label="Your email" required>' +
      '<button type="submit" aria-label="Subscribe"><i class="bi bi-arrow-right"></i></button>' +
      '</form></div>' +

      '</div>' +
      '<div class="footer-bottom"><p>&copy; ' + new Date().getFullYear() + ' Talennexus. All Rights Reserved.' +
      f.legal.map(function (l) { return ' | <a href="' + esc(resolve(l.href)) + '">' + esc(l.label) + '</a>'; }).join('') +
      '</p></div>' +
      '</div></footer>';
  }

  function injectStyles() {
    if (document.getElementById('site-footer-styles')) return;
    var style = document.createElement('style');
    style.id = 'site-footer-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // Small fallback toast for pages that don't define showToast()
  function notify(msg) {
    if (typeof window.showToast === 'function') return window.showToast(msg);
    var t = document.createElement('div');
    t.className = 'site-footer-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 400); }, 3000);
  }

  /* --------------------------- COMPONENT ---------------------------- */
  class SiteFooter extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      injectStyles();
      this.innerHTML = template();

      // Pages that already wire up #newsletterForm themselves keep working
      // (their handler resets the form). Only show our message if no page
      // script handled the submit, so the visitor never sees two messages.
      var form = this.querySelector('.newsletter-form');
      var input = form.querySelector('input');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        setTimeout(function () {
          if (!input.value) return; // already handled + reset by the page
          notify('Subscribed successfully!');
          form.reset();
        }, 0);
      });
    }
  }

  if (!customElements.get('site-footer')) customElements.define('site-footer', SiteFooter);
})();
