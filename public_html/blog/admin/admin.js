/* =====================================================================
   Talennexus Blog admin — editor logic
   ---------------------------------------------------------------------
   Talks to the Node.js server (server.js → /api/blog/*), which stores
   posts in blog/data/posts.json and writes the live pages into blog/.
   Clicking Save puts a post live immediately.
   ===================================================================== */
(function () {
  'use strict';

  var T = window.BlogTemplates;
  var $ = function (id) { return document.getElementById(id); };

  var csrf = '';
  var API = '/api/blog/';
  var posts = [];          // all posts from the server (drafts included)
  var categories = [];     // managed category list
  var current = null;      // post being edited (working copy)
  var dirty = false;
  var busy = false;

  /* ============================ utilities ============================ */
  function toast(msg, err) {
    var el = document.createElement('div');
    el.className = 'toast-msg' + (err ? ' err' : '');
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(function () { el.remove(); }, err ? 7000 : 3500);
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  function download(name, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* =============================== API =============================== */
  function api(action, data, opts) {
    opts = opts || {};
    var o = { method: data ? 'POST' : 'GET', credentials: 'same-origin', headers: { 'X-CSRF-Token': csrf } };
    if (data) {
      if (opts.raw) { o.body = data; o.headers['Content-Type'] = data.type || 'application/octet-stream'; }
      else { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(data); }
    }
    return fetch(API + action + (opts.query || ''), o).then(function (r) {
      return r.json().catch(function () { throw new Error('Server error (' + r.status + ').'); }).then(function (d) {
        if (r.status === 401 && action !== 'password') { dirty = false; location.replace('./'); }
        if (!d.ok) throw new Error(d.error || 'Request failed.');
        return d;
      });
    });
  }

  function setBusy(v, label) {
    busy = v;
    var b = $('btnSave');
    b.disabled = v;
    b.innerHTML = v ? '<span class="spinner-border spinner-border-sm"></span> ' + (label || 'Saving…') : saveLabel();
  }

  /* Write the whole blog on the server: posts + every live page. */
  function commit(newPosts, extraRemove) {
    var live = T.published(newPosts);
    var liveSlugs = live.map(function (p) { return p.slug; });
    var files = {
      'index.html': T.renderIndex(newPosts),
      'posts.json': T.renderPublicJson(newPosts)
    };
    live.forEach(function (p) { files[p.slug + '.html'] = T.renderPost(p, newPosts); });
    var remove = posts.filter(function (p) { return p.status === 'published' && liveSlugs.indexOf(p.slug) === -1; })
      .map(function (p) { return p.slug; }).concat(extraRemove || [])
      .filter(function (x) { return liveSlugs.indexOf(x) === -1; });
    return api('save', { posts: newPosts, files: files, remove: remove }).then(function (d) { posts = d.posts; });
  }

  /* ============================ images ============================ */
  // Resize to max 1600px wide and convert to WebP (JPEG fallback), then upload
  function processImage(file) {
    return new Promise(function (res, rej) {
      if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return rej(new Error('Please choose a JPG, PNG, WebP or GIF image.'));
      if (file.type === 'image/gif') return res({ blob: file, ext: 'gif', w: 0, h: 0 });
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, 1600 / img.naturalWidth);
        var c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        c.toBlob(function (blob) {
          if (blob && blob.type === 'image/webp') return res({ blob: blob, ext: 'webp', w: c.width, h: c.height });
          c.toBlob(function (jb) { jb ? res({ blob: jb, ext: 'jpg', w: c.width, h: c.height }) : rej(new Error('Could not process this image.')); }, 'image/jpeg', 0.85);
        }, 'image/webp', 0.82);
      };
      img.onerror = function () { rej(new Error('Could not read this image.')); };
      img.src = URL.createObjectURL(file);
    });
  }

  function uploadImage(file, base) {
    toast('Uploading image…');
    return processImage(file).then(function (r) {
      var q = '?name=' + encodeURIComponent(T.slugify(base) || 'image') + (r.w ? '&w=' + r.w + '&h=' + r.h : '');
      return api('upload', r.blob, { raw: true, query: q });
    }).then(function (d) { return { src: d.src, w: d.w, h: d.h }; });
  }

  // How an image path looks from /blog/admin/
  function viewSrc(src) {
    if (!src) return '';
    if (src.indexOf('images/') === 0) return '../' + src;
    return src;
  }

  /* ============================ dashboard ============================ */
  function statusBadge(p) {
    return p.status === 'published'
      ? '<span class="badge-st st-published">Live</span>'
      : '<span class="badge-st st-draft">Draft</span>';
  }

  function renderDashboard() {
    var list = posts.slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    $('noPosts').hidden = list.length > 0;
    $('postRows').innerHTML = list.map(function (p) {
      return '<tr data-id="' + T.esc(p.id) + '">' +
        '<td><div class="t-title">' + T.esc(p.title || '(untitled)') + '</div><div class="t-slug">/blog/' + T.esc(p.slug) + '</div></td>' +
        '<td>' + statusBadge(p) + '</td>' +
        '<td class="small">' + T.esc(T.fmtDate(p.date)) + '</td>' +
        '<td class="text-end text-nowrap">' +
        (p.status === 'published' ? '<a class="btn btn-sm btn-outline-secondary" href="../' + T.esc(p.slug) + '" target="_blank" rel="noopener" title="View live"><i class="bi bi-box-arrow-up-right"></i></a> ' : '') +
        '<button class="btn btn-sm btn-outline-secondary" data-act="link" title="Copy link"><i class="bi bi-link-45deg"></i></button> ' +
        '<button class="btn btn-sm btn-outline-primary" data-act="edit" title="Edit"><i class="bi bi-pencil"></i></button> ' +
        '<button class="btn btn-sm btn-outline-secondary" data-act="copy" title="Duplicate as draft"><i class="bi bi-files"></i></button> ' +
        '<button class="btn btn-sm btn-outline-danger" data-act="del" title="Delete"><i class="bi bi-trash"></i></button>' +
        '</td></tr>';
    }).join('');
    if (categories.length || $('catManage').innerHTML) renderCategories();
  }

  $('postRows').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-act]');
    if (!btn || busy) return;
    var id = btn.closest('tr').dataset.id;
    var p = posts.find(function (x) { return x.id === id; });
    if (!p) return;
    if (btn.dataset.act === 'edit') return openEditor(p);
    if (btn.dataset.act === 'link') return copyPostLink(p);
    if (btn.dataset.act === 'copy') {
      var c = clone(p), n = 2;
      c.id = uid(); c.title = p.title + ' (copy)'; c.status = 'draft'; c.updatedAt = Date.now();
      c.slug = p.slug + '-copy';
      while (posts.some(function (x) { return x.slug === c.slug; })) c.slug = p.slug + '-copy-' + (n++);
      busy = true;
      commit(posts.concat([c])).then(function () { renderDashboard(); toast('Copy saved as a draft.'); })
        .catch(function (x) { toast(x.message, true); }).then(function () { busy = false; });
      return;
    }
    if (btn.dataset.act === 'del') {
      if (!confirm('Delete "' + (p.title || p.slug) + '"?' + (p.status === 'published' ? '\nIt will be removed from the website immediately.' : ''))) return;
      busy = true;
      commit(posts.filter(function (x) { return x !== p; })).then(function () { renderDashboard(); toast('Post deleted.'); })
        .catch(function (x) { toast(x.message, true); }).then(function () { busy = false; });
    }
  });

  /* ============================== views ============================== */
  function show(view) {
    if (view !== 'editor' && dirty && !confirm('You have unsaved changes. Leave without saving?')) return false;
    if (view !== 'editor') { setDirty(false); current = null; }
    ['dashboard', 'editor', 'settings'].forEach(function (v) { $('view-' + v).classList.toggle('active', v === view); });
    $('editorActions').hidden = view !== 'editor';
    if (view === 'dashboard') renderDashboard();
    window.scrollTo(0, 0);
    return true;
  }
  [].forEach.call(document.querySelectorAll('[data-go]'), function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); show(b.dataset.go); });
  });
  $('btnBack').addEventListener('click', function () { show('dashboard'); });
  $('btnLogout').addEventListener('click', function () {
    if (dirty && !confirm('You have unsaved changes. Log out anyway?')) return;
    dirty = false;
    api('logout', {}).catch(function () {}).then(function () { location.replace('./'); });
  });
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ============================== editor ============================== */
  var FIELDS = {
    'f-title': 'title', 'f-slug': 'slug', 'f-excerpt': 'excerpt', 'f-status': 'status', 'f-date': 'date',
    'f-author': 'author', 'f-tags': 'tags', 'f-keyword': 'focusKeyword',
    'f-metaTitle': 'metaTitle', 'f-metaDesc': 'metaDescription', 'f-keywords': 'keywords', 'f-robots': 'robots',
    'f-canonical': 'canonical', 'f-ogTitle': 'ogTitle', 'f-ogDesc': 'ogDescription', 'f-ogImage': 'ogImage',
    'f-headTags': 'headTags'
  };
  var slugTouched = false;

  function saveLabel() {
    return current && current.status === 'published'
      ? '<i class="bi bi-broadcast"></i> Save &amp; go live'
      : '<i class="bi bi-check2"></i> Save draft';
  }

  function newPost() {
    return {
      id: uid(), title: '', slug: '', excerpt: '', status: 'draft', date: today(), author: 'Talennexus',
      category: '', categories: [], tags: '', focusKeyword: '', metaTitle: '', metaDescription: '', keywords: '',
      robots: 'index, follow', canonical: '', ogTitle: '', ogDescription: '', ogImage: '', headTags: '',
      featuredImage: { src: '', alt: '' },
      blocks: [{ type: 'p', text: '' }, { type: 'h2', text: '' }, { type: 'p', text: '' }]
    };
  }

  function openEditor(p) {
    current = clone(p);
    current.featuredImage = current.featuredImage || { src: '', alt: '' };
    current.blocks = current.blocks || [];
    slugTouched = !!current.slug;
    Object.keys(FIELDS).forEach(function (id) { $(id).value = current[FIELDS[id]] || ''; });
    if (!current.robots) $('f-robots').value = 'index, follow';
    $('f-feat-alt').value = current.featuredImage.alt || '';
    $('f-feat-url').value = current.featuredImage.src && current.featuredImage.src.indexOf('images/') !== 0 ? current.featuredImage.src : '';
    $('f-feat-file').value = '';
    current.categories = T.catsOf(current);
    fillCategorySelect();
    showFeatured(); renderBlocks(); analyse();
    setDirty(false);
    show('editor');
    $('btnSave').innerHTML = saveLabel();
  }

  function setDirty(v) {
    dirty = v;
    $('dirtyDot').textContent = v ? '● Unsaved changes' : '';
  }

  Object.keys(FIELDS).forEach(function (id) {
    $(id).addEventListener('input', function () {
      if (!current) return;
      current[FIELDS[id]] = this.value;
      if (id === 'f-title' && !slugTouched) { current.slug = T.slugify(this.value); $('f-slug').value = current.slug; }
      if (id === 'f-slug') slugTouched = true;
      if (id === 'f-status' && !busy) $('btnSave').innerHTML = saveLabel();
      setDirty(true); analyseSoon();
    });
  });
  $('f-slug').addEventListener('blur', function () {
    if (!current) return;
    current.slug = T.slugify(this.value); this.value = current.slug; analyseSoon();
  });
  /* ---------------------------- copy link ---------------------------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var t = document.createElement('textarea');
      t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); }
      t.remove();
    });
  }
  function copyPostLink(p) {
    var url = T.postUrl(p);
    copyText(url).then(function () {
      toast('Link copied: ' + url + (p.status !== 'published' ? ' (works after you publish)' : ''));
    }, function () { prompt('Copy this link:', url); });
  }
  $('btnCopyLink').addEventListener('click', function () {
    if (!current) return;
    var slug = T.slugify(current.slug || current.title);
    if (!slug) return toast('Add a title or URL first.', true);
    copyPostLink({ slug: slug, status: current.status });
  });

  /* ---------------------------- categories ---------------------------- */
  function allCategories() {
    var list = categories.slice();
    posts.forEach(function (p) { T.catsOf(p).forEach(function (c) { if (list.indexOf(c) === -1) list.push(c); }); });
    return list;
  }
  // Tick boxes: a post can be in several categories
  function fillCategorySelect() {
    var chosen = current ? current.categories : [];
    var list = allCategories();
    chosen.forEach(function (c) { if (list.indexOf(c) === -1) list.push(c); });
    $('f-categories').innerHTML = list.length ? list.map(function (c, i) {
      return '<label class="cat-pick"><input type="checkbox" value="' + T.esc(c) + '"' + (chosen.indexOf(c) > -1 ? ' checked' : '') + '>' +
        '<span>' + T.esc(c) + '</span></label>';
    }).join('') : '<span class="small text-muted">No categories yet — click “New”.</span>';
  }
  $('f-categories').addEventListener('change', function () {
    if (!current) return;
    current.categories = [].slice.call(this.querySelectorAll('input:checked')).map(function (x) { return x.value; });
    current.category = current.categories[0] || '';
    setDirty(true);
  });
  function saveCategories(list) {
    return api('categories', { categories: list }).then(function (d) { categories = d.categories; renderCategories(); return d; });
  }
  function addCategory(name) {
    name = String(name || '').replace(/\s+/g, ' ').trim();
    if (!name) return Promise.reject(new Error('Enter a category name.'));
    var exists = allCategories().filter(function (c) { return c.toLowerCase() === name.toLowerCase(); })[0];
    if (exists) return Promise.resolve(exists);
    return saveCategories(categories.concat([name])).then(function () { return name; });
  }
  function renderCategories() {
    var used = {};
    posts.forEach(function (p) { T.catsOf(p).forEach(function (c) { used[c] = (used[c] || 0) + 1; }); });
    $('catManage').innerHTML = categories.length ? categories.map(function (c, i) {
      return '<li class="list-group-item d-flex align-items-center gap-2 px-0"><span class="me-auto">' + T.esc(c) + '</span>' +
        '<span class="badge bg-light text-dark">' + (used[c] || 0) + ' post' + (used[c] === 1 ? '' : 's') + '</span>' +
        '<button class="btn btn-sm btn-outline-danger" data-delcat="' + i + '" title="Remove"><i class="bi bi-trash"></i></button></li>';
    }).join('') : '<li class="list-group-item px-0 text-muted small">No categories yet.</li>';
  }
  $('btnAddCat').addEventListener('click', function () {
    if (!current) return;
    var name = prompt('New category name:');
    if (name === null) return;
    addCategory(name).then(function (c) {
      if (current.categories.indexOf(c) === -1) current.categories.push(c);
      current.category = current.categories[0];
      fillCategorySelect(); setDirty(true); toast('Category "' + c + '" added and ticked.');
    }).catch(function (x) { toast(x.message, true); });
  });
  $('catForm').addEventListener('submit', function (e) {
    e.preventDefault();
    addCategory($('catNew').value).then(function (c) { $('catNew').value = ''; toast('Category "' + c + '" added.'); })
      .catch(function (x) { toast(x.message, true); });
  });
  $('catManage').addEventListener('click', function (e) {
    var b = e.target.closest('[data-delcat]');
    if (!b) return;
    var name = categories[+b.dataset.delcat];
    var n = posts.filter(function (p) { return T.catsOf(p).indexOf(name) > -1; }).length;
    if (!confirm('Remove category "' + name + '"?' + (n ? '\n' + n + ' post(s) still use it and will keep it until you change them.' : ''))) return;
    saveCategories(categories.filter(function (c) { return c !== name; })).then(function () { toast('Category removed.'); })
      .catch(function (x) { toast(x.message, true); });
  });

  $('btnSlugAuto').addEventListener('click', function () {
    current.slug = T.slugify(current.focusKeyword || current.title); $('f-slug').value = current.slug;
    slugTouched = true; setDirty(true); analyseSoon();
  });

  // Featured image
  function showFeatured() {
    var f = current.featuredImage, th = $('feat-thumb');
    th.src = f.src ? viewSrc(f.src) : '';
    th.classList.toggle('show', !!f.src);
    $('f-feat-remove').hidden = !f.src;
  }
  $('f-feat-file').addEventListener('change', function () {
    var file = this.files[0], input = this;
    if (!file) return;
    uploadImage(file, current.slug || current.title || 'featured').then(function (r) {
      current.featuredImage = { src: r.src, alt: current.featuredImage.alt || '', w: r.w, h: r.h };
      $('f-feat-url').value = '';
      showFeatured(); setDirty(true); analyseSoon(); toast('Image uploaded.');
    }).catch(function (e) { input.value = ''; toast(e.message, true); });
  });
  $('f-feat-url').addEventListener('input', function () {
    current.featuredImage = { src: this.value.trim(), alt: current.featuredImage.alt || '' };
    showFeatured(); setDirty(true); analyseSoon();
  });
  $('f-feat-alt').addEventListener('input', function () {
    current.featuredImage.alt = this.value; setDirty(true); analyseSoon();
  });
  $('f-feat-remove').addEventListener('click', function () {
    current.featuredImage = { src: '', alt: current.featuredImage.alt || '' };
    $('f-feat-url').value = ''; $('f-feat-file').value = '';
    showFeatured(); setDirty(true); analyseSoon();
  });

  /* ------------------------------ blocks ------------------------------ */
  var BLOCK_META = {
    h2: { label: 'Heading (H2)', icon: 'bi-type-h2' },
    h3: { label: 'Sub-heading (H3)', icon: 'bi-type-h3' },
    p: { label: 'Paragraph', icon: 'bi-text-paragraph' },
    img: { label: 'Image', icon: 'bi-image' },
    ul: { label: 'Bullet list', icon: 'bi-list-ul' },
    ol: { label: 'Numbered list', icon: 'bi-list-ol' },
    quote: { label: 'Quote', icon: 'bi-quote' },
    cta: { label: 'Button link', icon: 'bi-hand-index' },
    html: { label: 'Custom HTML', icon: 'bi-code-slash' }
  };
  var FMT_HELP = '<div class="help-fmt"><code>**bold**</code> <code>*italic*</code> <code>[link text](/contact/)</code> · select text and use the buttons</div>';
  var FMT_BTNS = '<button type="button" data-fmt="b" title="Bold"><i class="bi bi-type-bold"></i></button>' +
    '<button type="button" data-fmt="i" title="Italic"><i class="bi bi-type-italic"></i></button>' +
    '<button type="button" data-fmt="a" title="Link"><i class="bi bi-link-45deg"></i></button>';

  function blockBody(b) {
    var v = T.esc;
    switch (b.type) {
      case 'h2':
      case 'h3':
        return '<input class="form-control ' + b.type + '-input" data-k="text" value="' + v(b.text) + '" placeholder="' + (b.type === 'h2' ? 'Section heading' : 'Sub-heading') + '">';
      case 'p':
        return '<textarea class="form-control" data-k="text" rows="4" placeholder="Write your paragraph…">' + v(b.text) + '</textarea>' + FMT_HELP;
      case 'ul':
      case 'ol':
        return '<textarea class="form-control" data-k="items" rows="4" placeholder="One item per line">' + v((b.items || []).join('\n')) + '</textarea>' + FMT_HELP;
      case 'quote':
        return '<textarea class="form-control mb-2" data-k="text" rows="2" placeholder="Quote text">' + v(b.text) + '</textarea>' +
          '<input class="form-control form-control-sm" data-k="cite" value="' + v(b.cite) + '" placeholder="Who said it (optional)">';
      case 'cta':
        return '<div class="row g-2"><div class="col-md-6"><input class="form-control form-control-sm" data-k="text" value="' + v(b.text) + '" placeholder="Button text, e.g. Talk to our recruiters"></div>' +
          '<div class="col-md-6"><input class="form-control form-control-sm code" data-k="url" value="' + v(b.url) + '" placeholder="/contact/"></div></div>';
      case 'html':
        return '<textarea class="form-control code" data-k="html" rows="5" placeholder="<table>…</table>, YouTube embed, etc.">' + v(b.html) + '</textarea>' +
          '<div class="help-fmt">Added to the page exactly as written — only paste code you trust.</div>';
      case 'img':
        return '<div class="img-pick"><img class="thumb' + (b.src ? ' show' : '') + '" src="' + v(viewSrc(b.src)) + '" alt="">' +
          '<div class="row g-2"><div class="col-md-6"><label class="form-label small">Upload image</label><input class="form-control form-control-sm" type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-file="1"></div>' +
          '<div class="col-md-6"><label class="form-label small">…or image URL / path</label><input class="form-control form-control-sm code" data-k="src" value="' + v(b.src && b.src.indexOf('images/') === 0 ? '' : b.src) + '" placeholder="https://…"></div>' +
          '<div class="col-12"><label class="form-label small">Alt text <span class="text-danger">*</span></label><input class="form-control form-control-sm" data-k="alt" value="' + v(b.alt) + '" placeholder="Describe the image for Google and screen readers"></div>' +
          '<div class="col-12"><label class="form-label small">Caption (optional)</label><input class="form-control form-control-sm" data-k="caption" value="' + v(b.caption) + '"></div></div></div>';
    }
    return '';
  }

  function renderBlocks() {
    $('blocks').innerHTML = current.blocks.map(function (b, i) {
      var m = BLOCK_META[b.type] || { label: b.type, icon: 'bi-square' };
      var fmt = (b.type === 'p' || b.type === 'ul' || b.type === 'ol') ? FMT_BTNS : '';
      return '<div class="block" data-i="' + i + '"><div class="block-head"><span class="lbl"><i class="bi ' + m.icon + '"></i> ' + m.label + '</span>' + fmt +
        '<button type="button" data-mv="-1" title="Move up"' + (i === 0 ? ' disabled' : '') + '><i class="bi bi-arrow-up"></i></button>' +
        '<button type="button" data-mv="1" title="Move down"' + (i === current.blocks.length - 1 ? ' disabled' : '') + '><i class="bi bi-arrow-down"></i></button>' +
        '<button type="button" class="del" data-del="1" title="Remove"><i class="bi bi-trash"></i></button></div>' +
        '<div class="block-body">' + blockBody(b) + '</div></div>';
    }).join('');
  }

  $('blocks').addEventListener('input', function (e) {
    var el = e.target, k = el.dataset.k;
    if (!k) return;
    var b = current.blocks[+el.closest('.block').dataset.i];
    if (k === 'items') b.items = el.value.split('\n');
    else if (k === 'src') {
      b.src = el.value.trim(); delete b.w; delete b.h;
      var th = el.closest('.img-pick').querySelector('.thumb'); th.src = viewSrc(b.src); th.classList.toggle('show', !!b.src);
    } else b[k] = el.value;
    setDirty(true); analyseSoon();
  });

  $('blocks').addEventListener('change', function (e) {
    var el = e.target;
    if (!el.dataset.file || !el.files[0]) return;
    var box = el.closest('.block');
    var b = current.blocks[+box.dataset.i];
    uploadImage(el.files[0], b.alt || current.slug || 'image').then(function (r) {
      b.src = r.src; b.w = r.w; b.h = r.h;
      var th = box.querySelector('.thumb'); th.src = viewSrc(r.src); th.classList.add('show');
      box.querySelector('[data-k="src"]').value = '';
      setDirty(true); analyseSoon(); toast('Image uploaded.');
    }).catch(function (x) { el.value = ''; toast(x.message, true); });
  });

  $('blocks').addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var box = btn.closest('.block'), i = +box.dataset.i;
    if (btn.dataset.mv) {
      var j = i + (+btn.dataset.mv);
      if (j < 0 || j >= current.blocks.length) return;
      var t = current.blocks[i]; current.blocks[i] = current.blocks[j]; current.blocks[j] = t;
      renderBlocks(); setDirty(true); analyseSoon();
    } else if (btn.dataset.del) {
      var b = current.blocks[i];
      var empty = !(b.text || b.src || b.html || (b.items || []).join('').trim());
      if (!empty && !confirm('Remove this ' + (BLOCK_META[b.type] || {}).label + '?')) return;
      current.blocks.splice(i, 1); renderBlocks(); setDirty(true); analyseSoon();
    } else if (btn.dataset.fmt) {
      var ta = box.querySelector('textarea');
      var s = ta.selectionStart, en = ta.selectionEnd, sel = ta.value.slice(s, en) || 'text', out;
      if (btn.dataset.fmt === 'b') out = '**' + sel + '**';
      else if (btn.dataset.fmt === 'i') out = '*' + sel + '*';
      else { var u = prompt('Link address (e.g. /contact/ or https://…)', '/'); if (!u) return; out = '[' + sel + '](' + u.trim() + ')'; }
      ta.setRangeText(out, s, en, 'end'); ta.focus();
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  $('addBar').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add]');
    if (!btn) return;
    var type = btn.dataset.add, b = { type: type };
    if (type === 'ul' || type === 'ol') b.items = []; else if (type === 'img') { b.src = ''; b.alt = ''; } else b.text = '';
    current.blocks.push(b);
    renderBlocks(); setDirty(true); analyseSoon();
    var last = $('blocks').lastElementChild;
    last.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var f = last.querySelector('input:not([type=file]), textarea'); if (f) f.focus({ preventScroll: true });
  });

  /* ---------------------------- SEO analysis ---------------------------- */
  function counter(id, len, lo, hi) {
    var el = $(id);
    el.textContent = len + ' / ' + hi;
    el.className = 'counter ' + (len === 0 ? 'bad' : len >= lo && len <= hi ? 'ok' : 'warn');
  }

  // Canonical: empty = automatic (https://talennexus.com/blog/<slug>)
  function showCanonical() {
    var auto = T.postUrl({ slug: current.slug || 'your-post' });
    var custom = (current.canonical || '').trim();
    $('f-canonical').placeholder = auto;
    $('canonBadge').textContent = custom ? 'Custom' : 'Automatic';
    $('canonBadge').className = 'badge ' + (custom ? 'bg-warning-subtle text-warning-emphasis' : 'bg-success-subtle text-success');
    $('canonHelp').textContent = custom
      ? 'Custom canonical — only use this when the same article is published elsewhere first. Clear the box to go back to automatic.'
      : 'Created automatically from the post URL. Leave empty (recommended).';
  }

  function analyse() {
    if (!current) return;
    showCanonical();
    var p = current, kw = (p.focusKeyword || '').toLowerCase().trim();
    var mt = p.metaTitle || ((p.title || '') + ' | Talennexus Blog');
    var md = p.metaDescription || '';
    counter('c-metaTitle', mt.length, 30, 60);
    counter('c-metaDesc', md.length, 120, 160);

    $('serp-url').textContent = 'talennexus.com › blog › ' + (p.slug || 'your-post');
    $('serp-title').textContent = mt;
    $('serp-desc').textContent = md || T.excerpt(p) || 'Add a meta description to control what Google shows here.';

    var blocks = p.blocks || [];
    var paras = blocks.filter(function (b) { return b.type === 'p' && b.text; });
    var heads = blocks.filter(function (b) { return (b.type === 'h2' || b.type === 'h3') && b.text; });
    var h2s = blocks.filter(function (b) { return b.type === 'h2' && b.text; });
    var imgs = blocks.filter(function (b) { return b.type === 'img' && b.src; });
    var words = T.wordCount(p);
    var all = blocks.map(function (b) { return (b.text || '') + ' ' + (b.items || []).join(' ') + ' ' + (b.html || ''); }).join(' ');
    var internal = /\]\((\/|\.\.?\/|https?:\/\/(www\.)?talennexus\.com)/i.test(all) || /href="(\/|https?:\/\/(www\.)?talennexus\.com)/i.test(all) ||
      blocks.some(function (b) { return b.type === 'cta' && b.url && !/^https?:/i.test(b.url); });
    var has = function (s) { return kw && String(s || '').toLowerCase().indexOf(kw) > -1; };
    var kwCount = kw ? T.plain(all).toLowerCase().split(kw).length - 1 : 0;
    var density = words && kw ? (kwCount * kw.split(/\s+/).length / words) * 100 : 0;

    var checks = [];
    function add(state, msg) { checks.push({ s: state, m: msg }); }

    add(p.title ? 'ok' : 'bad', p.title ? 'Post has an H1 title.' : 'Add a post title (H1).');
    add(mt.length >= 30 && mt.length <= 60 ? 'ok' : 'warn', 'Meta title is ' + mt.length + ' characters (best 30–60).');
    add(md.length >= 120 && md.length <= 160 ? 'ok' : md ? 'warn' : 'bad', md ? 'Meta description is ' + md.length + ' characters (best 120–160).' : 'Add a meta description.');
    add(p.slug ? (p.slug.length <= 75 ? 'ok' : 'warn') : 'bad', p.slug ? (p.slug.length <= 75 ? 'URL slug is short and clean.' : 'URL slug is long — try to shorten it.') : 'Add a URL slug.');
    if (!kw) add('warn', 'Set a focus keyword to get keyword tips.');
    else {
      var kwSlug = T.slugify(kw);
      add(has(mt) ? 'ok' : 'bad', 'Focus keyword ' + (has(mt) ? 'is' : 'is not') + ' in the meta title.');
      add(has(md) ? 'ok' : 'bad', 'Focus keyword ' + (has(md) ? 'is' : 'is not') + ' in the meta description.');
      add(has(p.title) ? 'ok' : 'warn', 'Focus keyword ' + (has(p.title) ? 'is' : 'is not') + ' in the H1 title.');
      add(p.slug && p.slug.indexOf(kwSlug) > -1 ? 'ok' : 'warn', 'Focus keyword ' + (p.slug && p.slug.indexOf(kwSlug) > -1 ? 'is' : 'is not') + ' in the URL.');
      add(paras[0] && has(T.plain(paras[0].text)) ? 'ok' : 'warn', 'Focus keyword ' + (paras[0] && has(T.plain(paras[0].text)) ? 'appears' : 'does not appear') + ' in the first paragraph.');
      add(heads.some(function (h) { return has(h.text); }) ? 'ok' : 'warn', 'Use the focus keyword in at least one sub-heading.');
      add(density >= 0.5 && density <= 2.5 ? 'ok' : 'warn', 'Keyword density ' + density.toFixed(1) + '% (' + kwCount + '×, best 0.5–2.5%).');
    }
    add(words >= 600 ? 'ok' : words >= 300 ? 'warn' : 'bad', words + ' words (aim for 600+).');
    add(h2s.length >= 2 ? 'ok' : 'warn', h2s.length + ' H2 sub-headings (use 2 or more).');
    add(p.featuredImage && p.featuredImage.src ? (p.featuredImage.alt ? 'ok' : 'bad') : 'warn',
      p.featuredImage && p.featuredImage.src ? (p.featuredImage.alt ? 'Featured image has alt text.' : 'Add alt text to the featured image.') : 'Add a featured image (used for Google & social sharing).');
    var noAlt = imgs.filter(function (b) { return !b.alt; }).length;
    if (imgs.length) add(noAlt ? 'bad' : 'ok', noAlt ? noAlt + ' content image(s) missing alt text.' : 'All content images have alt text.');
    add(internal ? 'ok' : 'warn', internal ? 'Has an internal link to another Talennexus page.' : 'Add a link to another Talennexus page (e.g. /contact/ or a service).');

    var score = Math.round(checks.reduce(function (a, c) { return a + (c.s === 'ok' ? 1 : c.s === 'warn' ? 0.5 : 0); }, 0) / checks.length * 100);
    var ring = $('seo-ring');
    ring.textContent = score;
    ring.style.background = score >= 80 ? 'var(--ok)' : score >= 55 ? 'var(--warn)' : 'var(--bad)';
    $('seo-label').innerHTML = '<strong>' + (score >= 80 ? 'Good' : score >= 55 ? 'Needs work' : 'Poor') + '</strong> SEO score';
    var icons = { ok: 'bi-check-circle-fill', warn: 'bi-exclamation-circle-fill', bad: 'bi-x-circle-fill' };
    $('seo-checks').innerHTML = checks.map(function (c) {
      return '<li class="' + c.s + '"><i class="bi ' + icons[c.s] + '"></i><span>' + T.esc(c.m) + '</span></li>';
    }).join('');
  }
  var analyseSoon = debounce(analyse, 200);

  /* ------------------------------- save ------------------------------- */
  function validate(p) {
    if (!p.title.trim()) return 'Add a post title.';
    p.slug = T.slugify(p.slug || p.title);
    if (!p.slug) return 'Add a URL slug.';
    if (T.RESERVED.indexOf(p.slug) > -1 || p.slug === 'data') return 'The URL "' + p.slug + '" is reserved. Choose another.';
    if (posts.some(function (x) { return x.slug === p.slug && x.id !== p.id; })) return 'Another post already uses the URL "' + p.slug + '".';
    if (p.status === 'published') {
      if (!p.date) return 'Set a publish date.';
      if (p.featuredImage.src && !String(p.featuredImage.alt || '').trim()) return 'Add alt text to the featured image.';
      if (p.blocks.some(function (b) { return b.type === 'img' && b.src && !String(b.alt || '').trim(); })) return 'Every image needs alt text.';
    }
    return '';
  }

  $('btnSave').addEventListener('click', function () {
    if (!current || busy) return;
    var p = clone(current);
    p.title = (p.title || '').trim();
    var err = validate(p);
    if (err) return toast(err, true);
    p.blocks = p.blocks.filter(function (b) {
      return b.text || b.src || b.html || (b.items || []).some(function (x) { return String(x).trim(); });
    });
    p.blocks.forEach(function (b) { if (b.items) b.items = b.items.map(function (x) { return x.trim(); }).filter(Boolean); });
    var old = posts.find(function (x) { return x.id === p.id; });
    if (old && old.status === 'published' && old.slug !== p.slug &&
      !confirm('You changed the URL of a live post.\nThe old address /blog/' + old.slug + ' will stop working. Continue?')) return;
    if (p.status === 'published' && old && old.status === 'published') p.modified = today();
    p.updatedAt = Date.now();

    var next = old ? posts.map(function (x) { return x === old ? p : x; }) : posts.concat([p]);
    setBusy(true, p.status === 'published' ? 'Publishing…' : 'Saving…');
    commit(next).then(function () {
      current = clone(p);
      $('f-slug').value = p.slug;
      renderBlocks(); setDirty(false);
      if (p.status === 'published') {
        $('dirtyDot').innerHTML = '<span class="text-success">● Live at <a href="../' + T.esc(p.slug) + '" target="_blank" rel="noopener">/blog/' + T.esc(p.slug) + '</a></span>';
        toast('Published! The post is live now.');
      } else toast('Draft saved (not visible to visitors).');
    }).catch(function (x) { toast('Not saved: ' + x.message, true); })
      .then(function () { setBusy(false); });
  });

  /* ------------------------------ preview ------------------------------ */
  $('btnPreview').addEventListener('click', function () {
    if (!current) return;
    var p = clone(current);
    p.slug = p.slug || 'preview';
    p.status = 'published';
    var others = posts.filter(function (x) { return x.id !== p.id; });
    var html = T.renderPost(p, others.concat([p]), { preview: true, base: new URL('../', location.href).href });
    window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank');
  });

  /* ------------------------------ settings ------------------------------ */
  $('loginChange').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target;
    var cur = $('s-current').value, u = $('s-user').value.trim(), p1 = $('s-pass').value, p2 = $('s-pass2').value;
    if (!u) return toast('Enter a username.', true);
    if (p1.length < 8) return toast('Password must be at least 8 characters.', true);
    if (p1 !== p2) return toast('New passwords do not match.', true);
    api('password', { current: cur, user: u, pass: p1 }).then(function () {
      form.reset(); toast('Login updated. Use the new username and password next time.');
    }).catch(function (x) { toast(x.message, true); });
  });

  /* --------------------- SEO files (robots.txt / sitemap) --------------------- */
  function loadSeo() {
    return api('seo').then(function (d) {
      $('seoRobots').value = d.seo.robotsExtra || '';
      $('seoExclude').value = (d.seo.exclude || []).join('\n');
      $('seoCanon').checked = d.seo.autoCanonical !== false;
    }).catch(function () {});
  }
  $('seoForm').addEventListener('submit', function (e) {
    e.preventDefault();
    api('seo', { robotsExtra: $('seoRobots').value, exclude: $('seoExclude').value.split('\n'), autoCanonical: $('seoCanon').checked })
      .then(function () { toast('Saved. robots.txt and sitemap.xml are updated.'); })
      .catch(function (x) { toast(x.message, true); });
  });

  $('btnBackup').addEventListener('click', function () {
    download('talennexus-blog-backup-' + today() + '.json',
      JSON.stringify({ version: 1, exported: new Date().toISOString(), posts: posts }, null, 2), 'application/json');
  });

  $('btnRebuild').addEventListener('click', function () {
    if (busy) return;
    busy = true;
    commit(posts).then(function () { toast('All blog pages rebuilt.'); })
      .catch(function (x) { toast(x.message, true); }).then(function () { busy = false; });
  });

  $('btnNew').addEventListener('click', function () {
    if (dirty && !confirm('You have unsaved changes. Start a new post anyway?')) return;
    setDirty(false);
    openEditor(newPost());
  });

  /* ------------------------------- start ------------------------------- */
  fetch(API + 'status', { credentials: 'same-origin' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d.loggedIn) return location.replace('./');
      csrf = d.csrf;
      document.body.hidden = false;
      return api('posts').then(function (r) { posts = r.posts || []; categories = r.categories || []; renderDashboard(); renderCategories(); loadSeo(); });
    })
    .catch(function (x) {
      document.body.hidden = false;
      $('loadNote').innerHTML = '<div class="alert alert-danger small py-2">Cannot load posts: ' + T.esc(x.message) + '. Is the Node.js server running?</div>';
    });
})();
