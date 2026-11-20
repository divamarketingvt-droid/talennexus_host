/* =====================================================================
   Talennexus — <site-header> component
   ---------------------------------------------------------------------
   Usage (in every page):
     <head>
       ...
       <script src="components/site-header.js"></script>     (root pages)
       <script src="../components/site-header.js"></script>  (sub-folder pages)
     </head>
     <body>
       <site-header></site-header>

   Edit the menu ONCE in NAV_ITEMS below — every page updates.
   Links are written relative to the site root, the component works out
   the correct path automatically (Live Server, Apache, or file://).
   ===================================================================== */
(function () {
  'use strict';

  // Site root = the folder above /components/ (works at any folder depth)
  var SCRIPT_SRC = document.currentScript && document.currentScript.src;
  var ROOT = SCRIPT_SRC ? new URL('../', SCRIPT_SRC) : new URL('/', location.href);

  /* ------------------------------ DATA ------------------------------ */
  var LOGO = { src: 'assets/tl-logo.svg', alt: 'Talennexus' };
  // Button on the right of the menu
  var CTA = { label: 'Contact', href: 'contact' };

  var NAV_ITEMS = [
    // Home link hidden — the logo already links to the home page.
    // To show it again, remove the "//" at the start of the next line.
    // { label: 'Home', href: './' },
    {
      label: 'Services',
      href: '#',
      children: [
        { label: 'Staffing Support', icon: 'bi-people', href: 'staffingsupport' },
        { label: 'Recruitment Management', icon: 'bi-calculator', href: 'recruitment' },
        { label: 'Technical Interview', icon: 'bi-laptop', href: 'staffingsupport' },
        { label: 'Psychometric Assessment', icon: 'bi-people', href: 'staffingsupport' },
        {
          label: 'Payroll Services',
          icon: 'bi-graph-up',
          href: 'payroll',
          children: [
            { label: 'Leave & Timesheet Tracking', icon: 'bi-calendar-check', href: 'payroll#leave-time-tracking' },
            { label: 'Online Tax Reports & IT Declaration', icon: 'bi-file-earmark-text', href: 'payroll#online-tax-reports' },
            { label: 'Online Salary Slip & Form 16', icon: 'bi-receipt', href: 'payroll#salary-slip-form16' },
            { label: 'On-Time Payment Disbursement', icon: 'bi-cash-coin', href: 'payroll#on-time-disbursement' },
            { label: 'Handling Payroll & Tax Queries', icon: 'bi-headset', href: 'payroll#payroll-tax-queries' }
          ]
        },
        { label: 'Exit Interview', icon: 'bi-door-open', href: 'exit-interview' },
        {
          label: 'Campus Nexus',
          icon: 'bi-mortarboard',
          href: 'campushiring',
          children: [
            { label: 'Campus Hiring', icon: 'bi-mortarboard', href: 'campushiring' },
            { label: 'Self Skill Training', icon: 'bi-chat-dots', href: 'self-skill' },
            { label: 'Tech Training on Demand', icon: 'bi-code-slash', href: 'techtraining' }
          ]
        },
        { label: 'Organisation Development', icon: 'bi-diagram-3', href: 'organization-development' }
      ]
    },
    {
      label: 'Industries',
      href: '#',
      industries: true,
      heading: 'Sectors We Serve',
      children: [
        { label: 'IT', sub: 'Software, Cloud, Data, QA & IT Services', icon: 'bi-cpu', href: 'it' },
        { label: 'Healthcare', sub: 'Hospitals, Pharma, MedTech & Life Sciences', icon: 'bi-heart-pulse', href: './#industries-healthcare' },
        { label: 'Telecom', sub: 'Telecommunications, ISP & 5G Networks', icon: 'bi-broadcast-pin', href: 'leadership', dividerAfter: true },
        { label: 'Retail', sub: 'E-Commerce, Fashion, FMCG & D2C Brands', icon: 'bi-cart4', href: 'leadership' },
        { label: 'Banking', sub: 'Commercial Banks, NBFCs, Fintech & Insurance', icon: 'bi-bank2', href: 'bfsi-hiring' },
        { label: 'FMCG', sub: 'Fast Moving Goods, Manufacturing & Supply Chain', icon: 'bi-box-seam-fill', href: './#industries-FMCG', dividerAfter: true },
        {
          label: 'Workforce Solutions',
          icon: 'bi-briefcase',
          href: 'workforce_solutions',
          children: [
            { label: 'Workforce Solutions Overview', icon: 'bi-grid', href: 'workforce_solutions' },
            { label: 'Technology Hiring', icon: 'bi-cpu', href: 'technology-hiring' },
            { label: 'BFSI Hiring', icon: 'bi-bank', href: 'bfsi-hiring' },
            { label: 'Health Care', icon: 'bi-heart-pulse', href: 'healthcare' },
            { label: 'Retail Telecom', icon: 'bi-person-badge', href: 'leadership' }
          ]
        }
      ]
    },
    { label: 'Find a Job?', href: 'https://verifitech.zohorecruit.in/jobs/Careers', external: true }
    // Contact is shown as the button on the right (see CTA above)
  ];

  /* ----------------------------- STYLES ----------------------------- */
  var CSS = `
    site-header {
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
    site-header .navbar, site-header .navbar * { box-sizing: border-box; }
    site-header .navbar { font-family: 'Inter', sans-serif; }
    site-header .navbar .nav-link { white-space: nowrap; }
    site-header .navbar {
      background: var(--white);
      box-shadow: var(--shadow-sm);
      height: 90px;
      padding: 0 !important;
      transition: var(--transition);
      display: flex;
      align-items: center;
    }
    /* No scroll effect: the "scrolled" state looks exactly like the normal header.
       (Some pages still have old scripts that add this class — this cancels them.) */
    site-header .navbar.scrolled {
      height: 90px;
      padding: 0 !important;
      background: var(--white) !important;
      box-shadow: var(--shadow-sm) !important;
    }
    site-header .navbar .container {
      height: 100%;
      display: flex;
      align-items: center;
    }
    site-header .navbar-brand {
      display: flex;
      align-items: center;
      padding: 0 !important;
      margin-right: 25px;
    }
    site-header .navbar-brand img {
      width: auto !important;
      height: 160px !important;
      max-width: none !important;
      object-fit: contain;
      display: block;
    }
    site-header .navbar.scrolled .navbar-brand img {
      height: 160px !important;
    }
    site-header .navbar-nav {
      align-items: center;
    }
    @media (max-width: 1199.98px) {
    site-header .navbar {
      height: 90px;
      padding: 0 !important;
    }
    site-header .navbar.scrolled {
      height: 90px;
    }
    site-header .navbar-brand {
      margin-right: 10px;
    }
    site-header .navbar-brand img {
      height: 78px !important;
      width: auto !important;
      max-height: 78px !important;
      object-fit: contain;
    }
    }
    @media (max-width: 576px) {
    site-header .navbar {
      height: 85px;
      padding: 0 !important;
    }
    site-header .navbar.scrolled {
      height: 85px;
    }
    site-header .navbar-brand img {
      height: 90px !important;
      width: auto !important;
      max-height: 120px !important;
      object-fit: contain;
    }
    }
    site-header .nav-link {
      font-weight: 500;
      color: var(--secondary-color) !important;
      padding: 10px 18px !important;
      transition: var(--transition);
      position: relative;
    }
    site-header .nav-link:hover,
    site-header .nav-link.active {
      color: var(--primary-color) !important;
    }
    site-header .nav-link::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 18px;
      right: 18px;
      height: 2px;
      background: var(--gradient-primary);
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }
    site-header .nav-link:hover::after,
    site-header .nav-link.active::after {
      transform: scaleX(1);
    }
    site-header .dropdown-toggle::after {
      margin-left: 6px;
      vertical-align: middle;
      transition: transform 0.3s ease;
    }
    site-header .dropdown.show .dropdown-toggle::after {
      transform: rotate(180deg);
    }
    site-header .dropdown-menu {
      border: none;
      box-shadow: var(--shadow-lg);
      border-radius: var(--border-radius);
      padding: 15px;
      margin-top: 15px;
      animation: dropdownFadeIn 0.25s ease;
    }
    @keyframes dropdownFadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
    }
    site-header .dropdown-item {
      padding: 10px 20px;
      border-radius: 8px;
      transition: var(--transition);
      font-weight: 500;
      color: var(--text-gray);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    site-header .dropdown-item i {
      font-size: 1.1rem;
      color: var(--primary-color);
      width: 22px;
      text-align: center;
      transition: var(--transition);
    }
    site-header .dropdown-item:hover {
      background: var(--primary-light);
      color: var(--primary-color);
    }
    site-header .dropdown-item:hover i {
      color: var(--primary-accent);
      transform: scale(1.15);
    }
    site-header .dropdown-industry-header {
      padding: 8px 20px 12px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: var(--primary-color);
      opacity: 0.7;
    }
    site-header .dropdown-divider-custom {
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(74, 144, 217, 0.2), transparent);
      margin: 8px 15px;
    }
    site-header .dropdown-item .industry-label {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }
    site-header .dropdown-item .industry-label span:first-child {
      font-weight: 600;
      color: var(--secondary-color);
    }
    site-header .dropdown-item .industry-label span:last-child {
      font-size: 0.8rem;
      color: var(--text-gray);
      font-weight: 400;
    }
    site-header .dropdown-item:hover .industry-label span:first-child {
      color: var(--primary-color);
    }
    site-header .dropdown-item:hover .industry-label span:last-child {
      color: var(--primary-hover);
    }
    site-header .job-count-badge {
      background: var(--gradient-primary);
      color: var(--white);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
      margin-left: auto;
      flex-shrink: 0;
      line-height: 1.5;
    }
    site-header .dropdown-submenu {
      position: relative;
    }
    site-header .dropdown-submenu>.dropdown-item.submenu-toggle {
      justify-content: space-between;
    }
    site-header .dropdown-submenu>.dropdown-item.submenu-toggle::after {
      content: '';
      display: inline-block;
      width: 0;
      height: 0;
      border-top: 4px solid transparent;
      border-bottom: 4px solid transparent;
      border-left: 5px solid currentColor;
      margin-left: auto;
    }
    site-header .dropdown-submenu .dropdown-menu {
      top: 0;
      left: 100%;
      margin-top: 0;
      margin-left: 6px;
      display: none;
      min-width: 260px;
    }
    site-header .dropdown-submenu.show-submenu>.dropdown-menu {
      display: block;
      animation: dropdownFadeIn 0.2s ease;
    }
    @media (min-width: 1200px) {
    site-header .dropdown-submenu:hover>.dropdown-menu {
      display: block;
    }
    }
    /* Industries sits near the right edge: its side menu (Workforce Solutions) opens to the LEFT */
    @media (min-width: 1200px) {
    site-header .dropdown-menu-industries .dropdown-submenu .dropdown-menu {
      left: auto;
      right: 100%;
      margin-left: 0;
      margin-right: 6px;
    }
    }
    @media (max-width: 1199.98px) {
    site-header .dropdown-submenu>.dropdown-menu {
      position: static;
      left: 0;
      margin-left: 15px;
      box-shadow: none;
      border-left: 2px solid var(--primary-light);
      border-radius: 0;
    }
    }
    site-header .btn-primary-custom {
      background: var(--gradient-primary);
      color: var(--white) !important;
      border: none;
      padding: 12px 30px;
      border-radius: 50px;
      font-weight: 600;
      transition: var(--transition);
      box-shadow: 0 4px 15px rgba(30, 58, 95, 0.3);
      position: relative;
      z-index: 1;
      overflow: hidden;
    }
    site-header .btn-primary-custom::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, var(--primary-hover) 0%, var(--primary-color) 100%);
      z-index: -1;
      transition: opacity 0.3s ease;
      opacity: 0;
    }
    site-header .btn-primary-custom:hover {
      transform: translateY(-2px);
      box-shadow: var(--glow-primary);
    }
    site-header .btn-primary-custom:hover::before {
      opacity: 1;
    }
    @media (max-width: 1199.98px) {
    site-header .navbar-collapse {
      background: #ffffff;
      margin-top: 10px;
      padding: 15px 20px 25px;
      border-radius: 12px;
      box-shadow: 0 15px 40px rgba(30, 58, 95, 0.18);
      border: 1px solid #e6eef7;
      max-height: 80vh;
      overflow-y: auto;
    }
    site-header .navbar-nav {
      align-items: stretch !important;
      width: 100%;
    }
    site-header .nav-item {
      width: 100%;
      border-bottom: 1px solid #f0f4f8;
    }
    site-header .nav-item:last-child {
      border-bottom: none;
    }
    site-header .nav-link {
      padding: 14px 10px !important;
      width: 100%;
      display: block;
    }
    site-header .nav-link::after {
      display: none;
    }
    site-header .dropdown-menu {
      position: static !important;
      float: none;
      width: 100%;
      margin-top: 0;
      margin-bottom: 8px;
      box-shadow: none;
      border: none;
      border-left: 3px solid var(--primary-light);
      background: #f8fafc;
      border-radius: 0 8px 8px 0;
      padding: 8px 0;
    }
    site-header .dropdown-item {
      padding: 10px 18px;
    }
    site-header .dropdown-submenu>.dropdown-menu {
      position: static !important;
      left: 0;
      margin-left: 12px;
      box-shadow: none;
      border-left: 2px solid var(--primary-soft);
      background: #f0f4f8;
    }
    site-header .btn-primary-custom.ms-xl-3 {
      margin: 15px 0 5px !important;
      width: 100%;
      text-align: center;
    }
    }
    
    /* ---- Logo: trimmed image (TL-logo.png), same visual size as before ---- */
    site-header .navbar .navbar-brand { margin-right: 18px; flex-shrink: 0; }
    site-header .navbar .navbar-brand img.logo-img {
      height: 56px !important;
      max-height: 56px !important;
      width: auto !important;
    }
    
    /* ---- Desktop menu: one even row, never wraps or overflows ---- */
    site-header .navbar .navbar-nav { flex-wrap: nowrap; }
    site-header .navbar .nav-link.nav-link.nav-link {
      border: 0 !important;
      padding: 10px 18px !important;
      font-size: 16px;
      font-weight: 500;
    }
    site-header .navbar .btn-primary-custom { white-space: nowrap; }
/* Menu links sit in the middle; logo on the left, Contact button on the right */
site-header .navbar .nav-cta { display: flex; align-items: center; flex-shrink: 0; }
@media (min-width: 1200px) {
  site-header .navbar .container { position: relative; }
  /* links exactly in the centre of the bar, whatever the logo / button width */
  site-header .navbar .navbar-nav { gap: 10px; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); margin: 0 !important; }
  site-header .navbar .nav-cta { margin-left: auto; }
}
site-header .navbar .btn-primary-custom.is-current { box-shadow: 0 0 0 3px #ffffff, 0 0 0 5px var(--primary-accent); }
    @media (min-width: 1200px) and (max-width: 1399.98px) {
      site-header .navbar .navbar-brand { margin-right: 10px; }
      site-header .navbar .navbar-brand img.logo-img { height: 46px !important; max-height: 46px !important; }
      site-header .navbar .nav-link.nav-link.nav-link { padding: 10px 14px !important; font-size: 15.5px; }
      site-header .navbar .btn-primary-custom { padding: 10px 22px; margin-left: 8px !important; }
    }
    /* ---- Dropdown: current page / click state uses site colours, not Bootstrap blue ---- */
    site-header .navbar .dropdown-menu {
      --bs-dropdown-link-active-bg: var(--primary-light);
      --bs-dropdown-link-active-color: var(--primary-color);
    }
    site-header .navbar .dropdown-item.active,
    site-header .navbar .dropdown-item:active {
      background: var(--primary-light) !important;
      color: var(--primary-color) !important;
      font-weight: 600;
    }
    site-header .navbar .dropdown-item.active i,
    site-header .navbar .dropdown-item:active i {
      color: var(--primary-accent) !important;
    }
    site-header .navbar .dropdown-item.active .industry-label span:first-child {
      color: var(--primary-color);
    }
    /* ---- Underline fix: one clean underline per link on every page ---- */
    /* Bootstrap draws the dropdown arrow in ::after — the same pseudo-element
       used for the underline. Turn it into the plain gradient underline. */
    site-header .navbar .nav-link.dropdown-toggle::after {
      content: '';
      border: 0 !important;
      margin: 0;
      vertical-align: initial;
    }
    site-header .navbar .dropdown.show .nav-link.dropdown-toggle::after {
      transform: scaleX(1);
    }
    @media (max-width: 1199.98px) {
      site-header .navbar .nav-link.nav-link.nav-link {
        padding: 14px 10px !important;
        font-size: 16px;
      }
      site-header .navbar .navbar-brand img.logo-img { height: 44px !important; max-height: 44px !important; }
    
      /* Keep the logo bar fixed; the opened menu drops down BELOW it
         instead of squeezing into the bar and pushing the logo up. */
      site-header .navbar > .container {
        position: relative;
        flex-wrap: nowrap;
        align-items: center;
      }
      site-header .navbar .navbar-collapse {
        position: absolute;
        top: calc(100% + 6px);
        left: 12px;
        right: 12px;
        margin-top: 0 !important;
        max-height: calc(100vh - 110px) !important;
        overflow-y: auto;
        z-index: 1031;
      }
      site-header .navbar .navbar-toggler {
        margin-left: auto;
        padding: 6px 10px;
        border: 1px solid var(--primary-light);
        border-radius: 10px;
      }
      site-header .navbar .navbar-toggler:focus { box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.25); }
    
      /* Arrow on expandable items so visitors know they open */
      site-header .navbar .nav-link.dropdown-toggle {
        display: flex !important;
        align-items: center;
        justify-content: space-between;
      }
      site-header .navbar .nav-link.dropdown-toggle::after {
        display: inline-block !important;
        position: static !important;
        content: '' !important;
        width: 8px !important;
        height: 8px !important;
        background: none !important;
        border: 0 !important;
        border-right: 2px solid var(--primary-color) !important;
        border-bottom: 2px solid var(--primary-color) !important;
        transform: rotate(45deg) !important;
        margin: 0 6px 4px 12px !important;
        transition: transform 0.25s ease;
      }
      site-header .navbar .nav-link.dropdown-toggle.show::after {
        transform: rotate(-135deg) !important;
        margin-bottom: -4px !important;
      }
    }
  `;

  /* ----------------------------- HELPERS ---------------------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Normalised page path: "/payroll.html" and "/payroll" match
  function pageKey(url) {
    var p = decodeURIComponent(url.pathname).replace(/\.html$/, '').replace(/\/index$/, '/');
    return p.replace(/\/+$/, '') || '/';
  }
  var CURRENT = pageKey(new URL(location.href));

  function isCurrent(href) {
    if (!href || href.charAt(0) === '#' || /^https?:/.test(href)) return false;
    var u = new URL(href, ROOT);
    return !u.hash && pageKey(u) === CURRENT;
  }

  function resolve(href) {
    if (!href || href.charAt(0) === '#' || /^https?:/.test(href)) return href;
    var u = new URL(href, ROOT);
    // Same page + hash → keep just "#id" so in-page smooth scrolling works
    if (u.hash && pageKey(u) === CURRENT) return u.hash;
    return u.href;
  }

  // Highlight only ONE menu entry for the current page (plus its parent).
  // Several entries share a page (e.g. Staffing Support / Technical Interview /
  // Psychometric Assessment), so the first match in menu order wins.
  var ACTIVE = (function () {
    for (var i = 0; i < NAV_ITEMS.length; i++) {
      var item = NAV_ITEMS[i];
      if (isCurrent(item.href)) return [item];
      var kids = item.children || [];
      for (var j = 0; j < kids.length; j++) {
        if (isCurrent(kids[j].href)) return [item, kids[j]];
        var grand = kids[j].children || [];
        for (var k = 0; k < grand.length; k++) {
          if (isCurrent(grand[k].href)) return [item, kids[j], grand[k]];
        }
      }
    }
    return [];
  })();
  function isActive(entry) { return ACTIVE.indexOf(entry) !== -1; }

  function icon(name) { return '<i class="bi ' + esc(name) + '"></i>'; }

  /* ----------------------------- RENDER ----------------------------- */
  function renderChild(item, child) {
    var a = isActive(child) ? ' active' : '';
    if (child.children) {
      return '<li class="dropdown-submenu">' +
        '<a class="dropdown-item submenu-toggle' + a + '" href="' + esc(resolve(child.href)) + '" role="button">' +
        icon(child.icon) + ' ' + esc(child.label) + '</a>' +
        '<ul class="dropdown-menu">' +
        
        child.children.map(function (s) {
          return '<li><a class="dropdown-item' + (isActive(s) ? ' active' : '') + '" href="' + esc(resolve(s.href)) + '">' + icon(s.icon) + esc(s.label) + '</a></li>';
        }).join('') +
        '</ul></li>';
    }
    if (item.industries) {
      return '<li><a class="dropdown-item' + a + '" href="' + esc(resolve(child.href)) + '">' + icon(child.icon) +
        '<div class="industry-label"><span>' + esc(child.label) + '</span><span>' + esc(child.sub) + '</span></div></a></li>' +
        (child.dividerAfter ? '<li><div class="dropdown-divider-custom"></div></li>' : '');
    }
    return '<li><a class="dropdown-item' + a + '" href="' + esc(resolve(child.href)) + '">' + icon(child.icon) + esc(child.label) + '</a></li>';
  }

  function renderItem(item) {
    var active = isActive(item) ? ' active' : '';
    var target = item.external ? ' target="_blank" rel="noopener"' : '';
    if (!item.children) {
      return '<li class="nav-item"><a class="nav-link' + active + '" href="' + esc(resolve(item.href)) + '"' + target + '>' + esc(item.label) + '</a></li>';
    }
  return '<li class="nav-item dropdown">' +
      '<a class="nav-link dropdown-toggle' + active + '" href="' + esc(resolve(item.href)) + '" role="button" data-bs-toggle="dropdown" aria-expanded="false">' + esc(item.label) + '</a>' +
      '<ul class="dropdown-menu' + (item.industries ? ' dropdown-menu-industries' : '') + '">' +
      (item.heading ? '<li><div class="dropdown-industry-header">' + esc(item.heading) + '</div></li>' : '') +
      item.children.map(function (c) { return renderChild(item, c); }).join('') +
      '</ul></li>';
  }

  function template() {
    return '' +
      '<nav class="navbar navbar-expand-xl fixed-top" id="mainNavbar">' +
      '<div class="container">' +
      '<a class="navbar-brand" href="' + esc(resolve('./')) + '">' +
      '<img src="' + esc(new URL(LOGO.src, ROOT).href) + '" alt="' + esc(LOGO.alt) + '" class="logo-img">' +
      '</a>' +
      '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">' +
      '<span class="navbar-toggler-icon"></span>' +
      '</button>' +
      '<div class="collapse navbar-collapse" id="mainNav">' +
      '<ul class="navbar-nav mx-auto align-items-center">' +
      NAV_ITEMS.map(renderItem).join('') +
      '</ul>' +
      '<div class="nav-cta">' +
      '<a class="btn btn-primary-custom ms-xl-3' + (isCurrent(CTA.href) ? ' is-current' : '') + '" href="' + esc(resolve(CTA.href)) + '"' +
      (isCurrent(CTA.href) ? ' aria-current="page"' : '') + '>' +
      (CTA.icon ? '<i class="bi ' + esc(CTA.icon) + ' me-2"></i>' : '') + esc(CTA.label) + '</a>' +
      '</div>' +
      '</div></div></nav>';
  }

  function injectStyles() {
    if (document.getElementById('site-header-styles')) return;
    var style = document.createElement('style');
    style.id = 'site-header-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /* --------------------------- COMPONENT ---------------------------- */
  class SiteHeader extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      injectStyles();
      this.innerHTML = template();

      var navbar = this.querySelector('.navbar');

      // (Scroll effect removed: the header looks the same at all scroll positions.)

      // Mobile: open Payroll sub-menu on tap instead of navigating.
      // Capture phase + stopPropagation so older page scripts don't double-toggle it.
      this.addEventListener('click', function (e) {
        var toggle = e.target.closest('.dropdown-submenu > .submenu-toggle');
        if (!toggle || window.innerWidth >= 1200) return;
        e.preventDefault();
        e.stopPropagation();
        toggle.parentElement.classList.toggle('show-submenu');
      }, true);

      // Close open sub-menus when another dropdown opens
      this.addEventListener('show.bs.dropdown', function (e) {
        navbar.querySelectorAll('.dropdown-submenu.show-submenu').forEach(function (sub) {
          if (!e.target.closest('.dropdown').contains(sub)) sub.classList.remove('show-submenu');
        });
      });

      // Collapse the mobile menu after choosing a link
      this.addEventListener('click', function (e) {
        var link = e.target.closest('a:not([data-bs-toggle]):not(.submenu-toggle)');
        var menu = navbar.querySelector('#mainNav');
        if (link && menu.classList.contains('show') && window.bootstrap) {
          window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
        }
      });
    }
  }

  if (!customElements.get('site-header')) customElements.define('site-header', SiteHeader);
})();
