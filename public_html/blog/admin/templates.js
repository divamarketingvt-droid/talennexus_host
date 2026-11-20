/* =====================================================================
   Talennexus Blog — page templates (shared by the admin editor)
   ---------------------------------------------------------------------
   Builds the final static, SEO-ready HTML files:
     blog/index.html        (blog listing)
     blog/<slug>.html       (one file per published post)
     blog/sitemap.xml
   No server code: the admin downloads these files as a .zip and you
   upload them to public_html.
   ===================================================================== */
(function (root) {
  'use strict';

  var SITE = {
    name: 'Talennexus',
    url: 'https://talennexus.com',          // no trailing slash
    blogPath: '/blog/',
    logo: '/assets/tl-logo.png',
    defaultImage: '/assets/talennexus-og.png',
    locale: 'en_IN',
    lang: 'en-IN',
    version: '20261122'                      // cache-buster for blog.css / components
  };

  var RESERVED = ['index', 'admin', 'images', 'posts', 'sitemap', 'blog'];

  /* ----------------------------- helpers ----------------------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function slugify(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  }

  function safeUrl(u) {
    u = String(u || '').trim();
    if (/^\s*(javascript|data|vbscript):/i.test(u)) return '#';
    return u;
  }

  function isExternal(u) {
    return /^https?:\/\//i.test(u) && u.indexOf(SITE.url.replace(/^https?:\/\//, '')) === -1;
  }

  /* Paragraph formatting: **bold**, *italic*, [link text](url), new lines */
  function inline(s) {
    var h = esc(s);
    h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, text, url) {
      url = safeUrl(url);
      var ext = isExternal(url.replace(/&amp;/g, '&'));
      return '<a href="' + url + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + text + '</a>';
    });
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return h.replace(/\r?\n/g, '<br>');
  }

  function plain(s) {
    return String(s || '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*+/g, '').replace(/<[^>]*>/g, '');
  }

  // Absolute URL for <meta>, JSON-LD and sitemap
  function abs(src) {
    if (!src) return '';
    if (/^https?:\/\//i.test(src)) return src;
    if (src.charAt(0) === '/') return SITE.url + src;
    return SITE.url + SITE.blogPath + src.replace(/^\.\//, '');
  }

  function postUrl(p) { return SITE.url + SITE.blogPath + p.slug; }

  function blockText(b) {
    if (b.type === 'ul' || b.type === 'ol') return (b.items || []).join(' ');
    if (b.type === 'img') return b.caption || '';
    if (b.type === 'html') return String(b.html || '').replace(/<[^>]*>/g, ' ');
    return b.text || '';
  }

  function wordCount(post) {
    var t = (post.blocks || []).map(function (b) { return plain(blockText(b)); }).join(' ');
    var m = t.match(/\S+/g);
    return m ? m.length : 0;
  }

  function readingTime(post) { return Math.max(1, Math.round(wordCount(post) / 200)); }

  function excerpt(post, n) {
    n = n || 160;
    if (post.excerpt) return post.excerpt;
    if (post.metaDescription) return post.metaDescription;
    var p = (post.blocks || []).filter(function (b) { return b.type === 'p'; })[0];
    var t = plain(p ? p.text : '').replace(/\s+/g, ' ').trim();
    return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t;
  }

  function fmtDate(d) {
    if (!d) return '';
    var dt = new Date(d + (String(d).length === 10 ? 'T00:00:00' : ''));
    if (isNaN(dt)) return esc(d);
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function isoDate(d) {
    if (!d) return '';
    return String(d).length === 10 ? d + 'T09:00:00+05:30' : new Date(d).toISOString();
  }

  function published(posts) {
    return (posts || []).filter(function (p) { return p.status === 'published'; })
      .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }

  // A post can have several categories (older posts have a single "category")
  function catsOf(p) {
    var list = Array.isArray(p.categories) && p.categories.length ? p.categories : (p.category ? [p.category] : []);
    return list.filter(function (c, i) { return c && list.indexOf(c) === i; });
  }

  function tagsOf(p) {
    return String(p.tags || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
  }

  // img() lets the admin preview swap "images/x.webp" for a local blob URL
  function imgSrc(src, opts) { return opts && opts.img ? opts.img(src) : src; }

  /* --------------------------- head (shared) --------------------------- */
  function headCommon(opts) {
    var r = '../';
    return '' +
      (opts && opts.preview ? '' : '<!-- Google Tag Manager -->\n<script src="' + r + 'components/site-gtm.js?v=' + SITE.version + '"></script>\n') +
      '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
  }

  function headAssets() {
    var r = '../';
    return '' +
      '<link rel="icon" href="' + r + 'assets/favicon.ico" sizes="any">\n' +
      '<link rel="icon" type="image/png" sizes="32x32" href="' + r + 'assets/favicon-32.png">\n' +
      '<link rel="apple-touch-icon" href="' + r + 'assets/apple-touch-icon.png">\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
      '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">\n' +
      '<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">\n' +
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">\n' +
      '<link href="blog.css?v=' + SITE.version + '" rel="stylesheet">\n' +
      '<script src="' + r + 'components/site-header.js?v=' + SITE.version + '"></script>\n' +
      '<script src="' + r + 'components/site-footer.js?v=' + SITE.version + '"></script>\n';
  }

  function jsonLd(obj) {
    return '<script type="application/ld+json">\n' +
      JSON.stringify(obj, null, 2).replace(/</g, '\\u003c') + '\n</script>\n';
  }

  /* ----------------------------- blocks ----------------------------- */
  function renderBlocks(blocks, opts) {
    var used = {};
    var toc = [];
    var html = (blocks || []).map(function (b) {
      switch (b.type) {
        case 'h2':
        case 'h3': {
          if (!b.text) return '';
          var id = slugify(b.text) || 'section';
          var base = id, i = 2;
          while (used[id]) id = base + '-' + (i++);
          used[id] = true;
          if (b.type === 'h2') toc.push({ id: id, text: b.text });
          return '<' + b.type + ' id="' + id + '">' + esc(b.text) + '</' + b.type + '>';
        }
        case 'p':
          return b.text ? '<p>' + inline(b.text) + '</p>' : '';
        case 'img':
          if (!b.src) return '';
          return '<figure class="post-figure">' +
            '<img src="' + esc(imgSrc(b.src, opts)) + '" alt="' + esc(b.alt) + '"' +
            (b.w && b.h ? ' width="' + b.w + '" height="' + b.h + '"' : '') +
            ' loading="lazy" decoding="async">' +
            (b.caption ? '<figcaption>' + inline(b.caption) + '</figcaption>' : '') +
            '</figure>';
        case 'ul':
        case 'ol': {
          var items = (b.items || []).filter(function (x) { return String(x).trim(); });
          if (!items.length) return '';
          return '<' + b.type + '>' + items.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</' + b.type + '>';
        }
        case 'quote':
          if (!b.text) return '';
          return '<blockquote class="post-quote"><p>' + inline(b.text) + '</p>' +
            (b.cite ? '<cite>— ' + esc(b.cite) + '</cite>' : '') + '</blockquote>';
        case 'cta':
          if (!b.text || !b.url) return '';
          return '<p class="post-cta-inline"><a class="btn-blog" href="' + esc(safeUrl(b.url)) + '"' +
            (isExternal(b.url) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(b.text) +
            ' <i class="bi bi-arrow-right"></i></a></p>';
        case 'html':
          return b.html || '';
        default:
          return '';
      }
    }).filter(Boolean).join('\n');
    return { html: html, toc: toc };
  }

  /* ------------------------------ post ------------------------------ */
  function renderPost(post, allPosts, opts) {
    opts = opts || {};
    var url = post.canonical || postUrl(post);
    var metaTitle = post.metaTitle || (post.title + ' | ' + SITE.name + ' Blog');
    var desc = post.metaDescription || excerpt(post);
    var feat = post.featuredImage || {};
    var ogImg = abs(post.ogImage || feat.src || SITE.defaultImage);
    var body = renderBlocks(post.blocks, opts);
    var mins = readingTime(post);
    var tags = tagsOf(post);
    var robots = post.robots || 'index, follow';

    var related = published(allPosts).filter(function (p) { return p.slug !== post.slug; });
    related.sort(function (a, b) {
      var mine = catsOf(post);
      var shared = function (p) { return catsOf(p).filter(function (c) { return mine.indexOf(c) > -1; }).length; };
      return shared(b) - shared(a);
    });
    related = related.slice(0, 3);
    var recent = published(allPosts).filter(function (p) { return p.slug !== post.slug; }).slice(0, 5);
    var cats = categoriesOf(allPosts);

    var ld = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BlogPosting',
          '@id': url + '#article',
          mainEntityOfPage: { '@type': 'WebPage', '@id': url },
          headline: post.title,
          description: desc,
          image: [ogImg],
          datePublished: isoDate(post.date),
          dateModified: isoDate(post.modified || post.date),
          author: { '@type': post.author && post.author !== SITE.name ? 'Person' : 'Organization', name: post.author || SITE.name },
          publisher: { '@type': 'Organization', name: SITE.name, logo: { '@type': 'ImageObject', url: abs(SITE.logo) } },
          articleSection: catsOf(post).length ? catsOf(post) : undefined,
          keywords: post.keywords || undefined,
          wordCount: wordCount(post),
          inLanguage: SITE.lang
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url + '/' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: SITE.url + SITE.blogPath },
            { '@type': 'ListItem', position: 3, name: post.title, item: url }
          ]
        }
      ]
    };

    var share = encodeURIComponent(url);
    var shareTitle = encodeURIComponent(post.title);

    return '<!DOCTYPE html>\n<html lang="' + SITE.lang + '">\n<head>\n' +
      (opts.base ? '<base href="' + esc(opts.base) + '">\n' : '') +
      headCommon(opts) +
      '<title>' + esc(metaTitle) + '</title>\n' +
      '<meta name="description" content="' + esc(desc) + '">\n' +
      (post.keywords ? '<meta name="keywords" content="' + esc(post.keywords) + '">\n' : '') +
      '<meta name="robots" content="' + esc(robots) + ', max-image-preview:large">\n' +
      '<meta name="author" content="' + esc(post.author || SITE.name) + '">\n' +
      '<link rel="canonical" href="' + esc(url) + '">\n' +
      '<meta property="og:type" content="article">\n' +
      '<meta property="og:site_name" content="' + SITE.name + '">\n' +
      '<meta property="og:locale" content="' + SITE.locale + '">\n' +
      '<meta property="og:title" content="' + esc(post.ogTitle || metaTitle) + '">\n' +
      '<meta property="og:description" content="' + esc(post.ogDescription || desc) + '">\n' +
      '<meta property="og:url" content="' + esc(url) + '">\n' +
      '<meta property="og:image" content="' + esc(ogImg) + '">\n' +
      (feat.alt ? '<meta property="og:image:alt" content="' + esc(feat.alt) + '">\n' : '') +
      '<meta property="article:published_time" content="' + esc(isoDate(post.date)) + '">\n' +
      '<meta property="article:modified_time" content="' + esc(isoDate(post.modified || post.date)) + '">\n' +
      catsOf(post).map(function (c) { return '<meta property="article:section" content="' + esc(c) + '">\n'; }).join('') +
      tags.map(function (t) { return '<meta property="article:tag" content="' + esc(t) + '">\n'; }).join('') +
      '<meta name="twitter:card" content="summary_large_image">\n' +
      '<meta name="twitter:title" content="' + esc(post.ogTitle || metaTitle) + '">\n' +
      '<meta name="twitter:description" content="' + esc(post.ogDescription || desc) + '">\n' +
      '<meta name="twitter:image" content="' + esc(ogImg) + '">\n' +
      headAssets() +
      jsonLd(ld) +
      (post.headTags ? '<!-- Custom head tags -->\n' + post.headTags + '\n' : '') +
      '</head>\n<body class="blog-page">\n' +
      '<site-header></site-header>\n\n' +
      '<main>\n' +
      '<header class="post-hero">\n<div class="container">\n' +
      '<nav aria-label="breadcrumb"><ol class="blog-crumbs">' +
      '<li><a href="../">Home</a></li><li><a href="./">Blog</a></li><li aria-current="page">' + esc(post.title) + '</li></ol></nav>\n' +
      (catsOf(post).length ? '<div class="blog-pills">' + catsOf(post).map(function (c) {
        return '<a class="blog-pill" href="./?category=' + encodeURIComponent(c) + '">' + esc(c) + '</a>';
      }).join('') + '</div>\n' : '') +
      '<h1>' + esc(post.title) + '</h1>\n' +
      '<div class="post-meta">' +
      '<span><i class="bi bi-person-circle"></i> ' + esc(post.author || SITE.name) + '</span>' +
      '<span><i class="bi bi-calendar3"></i> <time datetime="' + esc(post.date) + '">' + fmtDate(post.date) + '</time></span>' +
      '<span><i class="bi bi-clock"></i> ' + mins + ' min read</span>' +
      '</div>\n</div>\n</header>\n\n' +
      '<div class="container post-wrap">\n<div class="row g-5">\n' +
      '<article class="col-lg-8 post-article">\n' +
      (feat.src ? '<figure class="post-featured"><img src="' + esc(imgSrc(feat.src, opts)) + '" alt="' + esc(feat.alt) + '"' +
        (feat.w && feat.h ? ' width="' + feat.w + '" height="' + feat.h + '"' : '') +
        ' fetchpriority="high" decoding="async"></figure>\n' : '') +
      '<div class="post-content">\n' + body.html + '\n</div>\n' +
      (tags.length ? '<div class="post-tags"><i class="bi bi-tags"></i> ' + tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>\n' : '') +
      '<div class="post-share"><strong>Share:</strong>' +
      '<a href="https://www.linkedin.com/sharing/share-offsite/?url=' + share + '" target="_blank" rel="noopener" aria-label="Share on LinkedIn"><i class="bi bi-linkedin"></i></a>' +
      '<a href="https://twitter.com/intent/tweet?url=' + share + '&amp;text=' + shareTitle + '" target="_blank" rel="noopener" aria-label="Share on X"><i class="bi bi-twitter-x"></i></a>' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' + share + '" target="_blank" rel="noopener" aria-label="Share on Facebook"><i class="bi bi-facebook"></i></a>' +
      '<a href="https://wa.me/?text=' + shareTitle + '%20' + share + '" target="_blank" rel="noopener" aria-label="Share on WhatsApp"><i class="bi bi-whatsapp"></i></a>' +
      '<button type="button" class="post-copy" data-url="' + esc(url) + '" aria-label="Copy link"><i class="bi bi-link-45deg"></i> <span>Copy link</span></button>' +
      '</div>\n' +
      '</article>\n' +
      '<aside class="col-lg-4">\n<div class="post-aside">\n' +
      (body.toc.length >= 2 ? '<nav class="aside-card" aria-label="Table of contents"><h2 class="aside-title">In this article</h2><ol class="post-toc">' +
        body.toc.map(function (t) { return '<li><a href="#' + t.id + '">' + esc(t.text) + '</a></li>'; }).join('') + '</ol></nav>\n' : '') +
      (recent.length ? '<nav class="aside-card" aria-label="Recent posts"><h2 class="aside-title">Recent posts</h2><ul class="aside-list">' +
        recent.map(function (p) {
          return '<li><a href="' + esc(p.slug) + '">' + esc(p.title) + '</a><time datetime="' + esc(p.date) + '">' + fmtDate(p.date) + '</time></li>';
        }).join('') + '</ul></nav>\n' : '') +
      (cats.length ? '<nav class="aside-card" aria-label="Categories"><h2 class="aside-title">Categories</h2><ul class="aside-cats">' +
        cats.map(function (c) {
          return '<li><a href="./?category=' + encodeURIComponent(c.name) + '">' + esc(c.name) + '<span>' + c.count + '</span></a></li>';
        }).join('') + '</ul></nav>\n' : '') +
      '<div class="aside-card aside-cta"><h2 class="aside-title">Hiring the right talent?</h2>' +
      '<p>Talk to Talennexus about recruitment, staffing and payroll solutions.</p>' +
      '<a class="btn-blog" href="../contact/">Contact us <i class="bi bi-arrow-right"></i></a></div>\n' +
      '</div>\n</aside>\n</div>\n</div>\n' +
      (related.length ? '<section class="post-related"><div class="container"><h2>Related articles</h2><div class="row g-4">' +
        related.map(function (p) { return '<div class="col-md-6 col-lg-4">' + card(p, opts) + '</div>'; }).join('') +
        '</div></div></section>\n' : '') +
      '</main>\n\n<site-footer></site-footer>\n' +
      '<script>\n' + COPY_SCRIPT + '\n</script>\n' +
      '</body>\n</html>\n';
  }

  // "Copy link" button on post pages
  var COPY_SCRIPT = [
    '(function(){',
    '  var b = document.querySelector(".post-copy"); if (!b) return;',
    '  b.addEventListener("click", function(){',
    '    var url = b.dataset.url, label = b.querySelector("span");',
    '    function done(){ label.textContent = "Copied!"; b.classList.add("copied");',
    '      setTimeout(function(){ label.textContent = "Copy link"; b.classList.remove("copied"); }, 2000); }',
    '    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, fallback); else fallback();',
    '    function fallback(){ var t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select();',
    '      try { document.execCommand("copy"); done(); } catch (e) { prompt("Copy this link:", url); } t.remove(); }',
    '  });',
    '})();'
  ].join('\n');

  // Categories with post counts (published posts only)
  function categoriesOf(posts) {
    var map = {};
    published(posts).forEach(function (p) { catsOf(p).forEach(function (c) { map[c] = (map[c] || 0) + 1; }); });
    return Object.keys(map).sort().map(function (k) { return { name: k, count: map[k] }; });
  }

  /* ------------------------------ card ------------------------------ */
  function card(p, opts) {
    var f = p.featuredImage || {};
    var cs = catsOf(p);
    return '<article class="blog-card" data-categories="|' + esc(cs.join('|')) + '|" data-date="' + esc(p.date || '') + '" data-title="' + esc(String(p.title || '').toLowerCase()) + '" data-search="' +
      esc((p.title + ' ' + excerpt(p) + ' ' + (p.tags || '') + ' ' + cs.join(' ')).toLowerCase()) + '">' +
      '<a class="blog-card-img" href="' + esc(p.slug) + '" tabindex="-1" aria-hidden="true">' +
      (f.src ? '<img src="' + esc(imgSrc(f.src, opts)) + '" alt="' + esc(f.alt) + '"' + (f.w && f.h ? ' width="' + f.w + '" height="' + f.h + '"' : '') + ' loading="lazy" decoding="async">'
        : '<span class="blog-card-noimg"><i class="bi bi-journal-text"></i></span>') +
      '</a><div class="blog-card-body">' +
      (cs.length ? '<div class="blog-pills">' + cs.map(function (c) {
        return '<a class="blog-pill sm" href="./?category=' + encodeURIComponent(c) + '">' + esc(c) + '</a>';
      }).join('') + '</div>' : '') +
      '<h3><a href="' + esc(p.slug) + '">' + esc(p.title) + '</a></h3>' +
      '<p>' + esc(excerpt(p, 140)) + '</p>' +
      '<div class="blog-card-meta"><time datetime="' + esc(p.date) + '">' + fmtDate(p.date) + '</time><span>' + readingTime(p) + ' min read</span></div>' +
      '</div></article>';
  }

  /* ----------------------------- listing ----------------------------- */
  function renderIndex(posts, opts) {
    opts = opts || {};
    var list = published(posts);
    var cats = categoriesOf(posts);
    var url = SITE.url + SITE.blogPath;
    var title = 'Blog — Recruitment, Staffing & HR Insights | ' + SITE.name;
    var desc = 'Expert articles on recruitment, staffing, payroll, HR compliance and hiring trends in India from the Talennexus team.';

    var ld = {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      '@id': url + '#blog',
      name: SITE.name + ' Blog',
      url: url,
      description: desc,
      publisher: { '@type': 'Organization', name: SITE.name, logo: { '@type': 'ImageObject', url: abs(SITE.logo) } },
      blogPost: list.slice(0, 20).map(function (p) {
        return { '@type': 'BlogPosting', headline: p.title, url: postUrl(p), datePublished: isoDate(p.date), image: abs((p.featuredImage || {}).src || SITE.defaultImage) };
      })
    };

    return '<!DOCTYPE html>\n<html lang="' + SITE.lang + '">\n<head>\n' +
      (opts.base ? '<base href="' + esc(opts.base) + '">\n' : '') +
      headCommon(opts) +
      '<title>' + esc(title) + '</title>\n' +
      '<meta name="description" content="' + esc(desc) + '">\n' +
      '<meta name="robots" content="index, follow, max-image-preview:large">\n' +
      '<link rel="canonical" href="' + url + '">\n' +
      '<meta property="og:type" content="website">\n' +
      '<meta property="og:site_name" content="' + SITE.name + '">\n' +
      '<meta property="og:title" content="' + esc(title) + '">\n' +
      '<meta property="og:description" content="' + esc(desc) + '">\n' +
      '<meta property="og:url" content="' + url + '">\n' +
      '<meta property="og:image" content="' + abs(SITE.defaultImage) + '">\n' +
      '<meta name="twitter:card" content="summary_large_image">\n' +
      headAssets() +
      jsonLd(ld) +
      '</head>\n<body class="blog-page">\n<site-header></site-header>\n\n<main>\n' +
      '<header class="blog-hero">\n<div class="container">\n' +
      '<span class="blog-pill"><i class="bi bi-journal-richtext"></i> Talennexus Blog</span>\n' +
      '<h1>Recruitment &amp; HR <span>Insights</span></h1>\n' +
      '<p class="lead">Practical guides on hiring, staffing, payroll and workforce trends — written by our recruitment experts.</p>\n' +
      (list.length ? '<div class="blog-search"><i class="bi bi-search"></i><input type="search" id="blogSearch" placeholder="Search articles…" aria-label="Search articles"></div>\n' : '') +
      '</div>\n</header>\n\n' +
      '<section class="blog-list">\n<div class="container">\n' +
      (list.length ? '<div class="blog-toolbar">' +
        '<div class="blog-filters" role="group" aria-label="Filter by category"><button type="button" class="active" data-cat="">All <span>' + list.length + '</span></button>' +
        cats.map(function (c) { return '<button type="button" data-cat="' + esc(c.name) + '">' + esc(c.name) + ' <span>' + c.count + '</span></button>'; }).join('') + '</div>' +
        '<label class="blog-sort"><i class="bi bi-sort-down"></i><span class="visually-hidden">Sort articles</span><select id="blogSort">' +
        '<option value="new">Most recent</option><option value="old">Oldest first</option><option value="az">Title A–Z</option></select></label>' +
        '</div>\n' : '') +
      (list.length
        ? '<div class="row g-4" id="blogGrid">\n' + list.map(function (p) { return '<div class="col-md-6 col-lg-4">' + card(p, opts) + '</div>'; }).join('\n') + '\n</div>\n' +
          '<p class="blog-empty" id="blogNoResults" hidden>No articles match your search.</p>\n' +
          '<nav class="blog-pager" id="blogPager" aria-label="Blog pages" hidden></nav>\n'
        : '<p class="blog-empty">New articles are coming soon. Stay tuned!</p>\n') +
      '</div>\n</section>\n</main>\n\n<site-footer></site-footer>\n' +
      (list.length ? '<script>\n' + LIST_SCRIPT + '\n</script>\n' : '') +
      '</body>\n</html>\n';
  }

  // Small search + category filter for the listing page (no server needed)
  var PER_PAGE = 9;     // posts per page on the blog listing
  var LIST_SCRIPT = [
    '(function(){',
    '  var PER = ' + PER_PAGE + ';',
    '  var q = document.getElementById("blogSearch"), sort = document.getElementById("blogSort"), grid = document.getElementById("blogGrid");',
    '  var pager = document.getElementById("blogPager"), none = document.getElementById("blogNoResults");',
    '  var cards = [].slice.call(grid.querySelectorAll(".blog-card"));',
    '  var btns = [].slice.call(document.querySelectorAll(".blog-filters button"));',
    '  var params = new URLSearchParams(location.search);',
    '  var cat = params.get("category") || "", page = Math.max(1, parseInt(params.get("page"), 10) || 1);',
    '  if (cat && !btns.some(function(b){ return b.dataset.cat === cat; })) cat = "";',
    '  function setUrl(){ var u = new URL(location.href);',
    '    if (cat) u.searchParams.set("category", cat); else u.searchParams.delete("category");',
    '    if (page > 1) u.searchParams.set("page", page); else u.searchParams.delete("page");',
    '    history.replaceState(null, "", u); }',
    '  function link(n, label, extra){ return \'<a href="?\' + (cat ? "category=" + encodeURIComponent(cat) + "&" : "") + "page=" + n + \'" data-page="\' + n + \'"\' + (extra || "") + ">" + label + "</a>"; }',
    '  function run(){',
    '    var t = (q && q.value || "").toLowerCase().trim();',
    '    btns.forEach(function(x){ x.classList.toggle("active", x.dataset.cat === cat); });',
    '    var match = [].slice.call(grid.children).filter(function(col){ var c = col.querySelector(".blog-card");',
    '      return (!cat || c.dataset.categories.indexOf("|" + cat + "|") > -1) && (!t || c.dataset.search.indexOf(t) > -1); });',
    '    var pages = Math.max(1, Math.ceil(match.length / PER)); if (page > pages) page = pages;',
    '    [].forEach.call(grid.children, function(col){ col.hidden = true; });',
    '    match.slice((page - 1) * PER, page * PER).forEach(function(col){ col.hidden = false; });',
    '    if (none) none.hidden = match.length > 0;',
    '    if (pages < 2) { pager.hidden = true; pager.innerHTML = ""; }',
    '    else { var h = page > 1 ? link(page - 1, "&larr; Previous", \' class="pg-prev" rel="prev"\') : \'<span class="pg-prev disabled">&larr; Previous</span>\';',
    '      for (var i = 1; i <= pages; i++) {',
    '        if (pages > 7 && i > 1 && i < pages && Math.abs(i - page) > 1) { if (i === 2 || i === pages - 1) h += \'<span class="pg-gap">&hellip;</span>\'; continue; }',
    '        h += i === page ? \'<span class="pg-num active" aria-current="page">\' + i + "</span>" : link(i, i, \' class="pg-num"\'); }',
    '      h += page < pages ? link(page + 1, "Next &rarr;", \' class="pg-next" rel="next"\') : \'<span class="pg-next disabled">Next &rarr;</span>\';',
    '      pager.innerHTML = h; pager.hidden = false; }',
    '    setUrl(); }',
    '  function order(){ var m = sort ? sort.value : "new";',
    '    cards.slice().sort(function(a, b){',
    '      if (m === "az") return a.dataset.title.localeCompare(b.dataset.title);',
    '      var d = a.dataset.date.localeCompare(b.dataset.date); return m === "old" ? d : -d;',
    '    }).forEach(function(c){ grid.appendChild(c.parentNode); }); }',
    '  function top(){ var y = grid.getBoundingClientRect().top + window.scrollY - 160; if (window.scrollY > y) window.scrollTo({ top: y, behavior: "smooth" }); }',
    '  if (q) q.addEventListener("input", function(){ page = 1; run(); });',
    '  if (sort) sort.addEventListener("change", function(){ order(); page = 1; run(); });',
    '  btns.forEach(function(b){ b.addEventListener("click", function(){ cat = b.dataset.cat; page = 1; run(); }); });',
    '  pager.addEventListener("click", function(e){ var a = e.target.closest("a[data-page]"); if (!a) return;',
    '    e.preventDefault(); page = +a.dataset.page; run(); top(); });',
    '  run();',
    '})();'
  ].join('\n');

  /* ----------------------------- sitemap ----------------------------- */
  function renderSitemap(posts) {
    var list = published(posts).filter(function (p) { return !/noindex/i.test(p.robots || ''); });
    var latest = list.length ? (list[0].modified || list[0].date) : new Date().toISOString().slice(0, 10);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
      '  <url><loc>' + SITE.url + SITE.blogPath + '</loc><lastmod>' + String(latest).slice(0, 10) + '</lastmod></url>\n' +
      list.map(function (p) {
        var f = p.featuredImage || {};
        return '  <url><loc>' + esc(p.canonical || postUrl(p)) + '</loc><lastmod>' + esc(String(p.modified || p.date).slice(0, 10)) + '</lastmod>' +
          (f.src ? '<image:image><image:loc>' + esc(abs(f.src)) + '</image:loc></image:image>' : '') + '</url>\n';
      }).join('') +
      '</urlset>\n';
  }

  /* ---------- public posts.json (light summary for home page & listing) ---------- */
  function renderPublicJson(posts) {
    return JSON.stringify(published(posts).filter(function (p) { return !/noindex/i.test(p.robots || ''); }).map(function (p) {
      var f = p.featuredImage || {};
      return {
        slug: p.slug, url: SITE.blogPath + p.slug, title: p.title, excerpt: excerpt(p, 150),
        category: catsOf(p)[0] || '', categories: catsOf(p), author: p.author || SITE.name, date: p.date, modified: p.modified || p.date,
        readingTime: readingTime(p), image: f.src || '', imageAlt: f.alt || '', imageW: f.w || null, imageH: f.h || null
      };
    }), null, 2) + '\n';
  }

  var api = {
    renderPublicJson: renderPublicJson,
    SITE: SITE, RESERVED: RESERVED, esc: esc, slugify: slugify, inline: inline, plain: plain, abs: abs,
    postUrl: postUrl, wordCount: wordCount, readingTime: readingTime, excerpt: excerpt, fmtDate: fmtDate,
    published: published, catsOf: catsOf, renderBlocks: renderBlocks, renderPost: renderPost, renderIndex: renderIndex,
    renderSitemap: renderSitemap
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BlogTemplates = api;
})(this);
