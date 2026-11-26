/* =====================================================================
   Talennexus website + blog server (Node.js + Express, no database)
   ---------------------------------------------------------------------
   • Serves the whole website from this folder (same rules as .htaccess)
   • Blog admin API under /api/blog/*
   • Storage = files (no MongoDB):
       blog/data/posts.json   all posts, drafts included
       blog/data/admin.json   admin login (password stored as a hash)
       blog/images/           uploaded images
   • Saving a post writes the static, SEO-ready pages into blog/
   Start:  npm install  →  npm start   (http://localhost:3000)
   ===================================================================== */
'use strict';

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const ROOT = __dirname;
const BLOG = path.join(ROOT, 'blog');
const DATA = path.join(BLOG, 'data');
const IMAGES = path.join(BLOG, 'images');
const PORT = process.env.PORT || 3000;
const SITE_URL = (process.env.SITE_URL || 'https://talennexus.com').replace(/\/+$/, '');
const SESSION_HOURS = 8;
const COOKIE = 'tnx_admin';

const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');

/* ============================ helpers ============================ */
async function readJson(file, def) {
  try { return JSON.parse(await fsp.readFile(file, 'utf8')); } catch (e) { return def; }
}

async function writeAtomic(file, content) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const tmp = file + '.' + crypto.randomBytes(4).toString('hex') + '.tmp';
  await fsp.writeFile(tmp, content);
  await fsp.rename(tmp, file);
}

const writeJson = (file, data) => writeAtomic(file, JSON.stringify(data, null, 2) + '\n');

// Secret used to sign the login cookie (kept in blog/data/, created once)
let SECRET = process.env.SESSION_SECRET || '';
function secret() {
  if (SECRET) return SECRET;
  const f = path.join(DATA, '.secret');
  try { SECRET = fs.readFileSync(f, 'utf8').trim(); } catch (e) { /* create below */ }
  if (!SECRET) {
    SECRET = crypto.randomBytes(32).toString('hex');
    fs.mkdirSync(DATA, { recursive: true });
    fs.writeFileSync(f, SECRET, { mode: 0o600 });
  }
  return SECRET;
}

/* ---------- password hashing (built-in scrypt, no extra package) ---------- */
function hashPassword(pass) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(pass, salt, 64).toString('hex');
  return 'scrypt$' + salt + '$' + key;
}
function verifyHash(pass, stored) {
  const [alg, salt, key] = String(stored).split('$');
  if (alg !== 'scrypt' || !salt || !key) return false;
  const test = crypto.scryptSync(pass, salt, 64);
  const want = Buffer.from(key, 'hex');
  return want.length === test.length && crypto.timingSafeEqual(want, test);
}
const safeEq = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/* ---------- admin login file (editable by hand) ----------
   blog/data/admin.json
     { "user": "admin", "password": "MyNewPassword" }   ← type by hand
   After the first login it becomes { "user": "...", "hash": "scrypt$..." } */
const ADMIN_FILE = path.join(DATA, 'admin.json');
async function loadAdmin() {
  let a = await readJson(ADMIN_FILE, null);
  if (!a) {
    // No password is written in the code: use ADMIN_PASSWORD if set, otherwise create a random one
    // and print it once in the server log (then change it in Blog admin).
    const pass = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
    a = { user: process.env.ADMIN_USER || 'admin', password: pass };
    await writeJson(ADMIN_FILE, a);
    if (!process.env.ADMIN_PASSWORD) console.log('Blog admin created. User: ' + a.user + '  Password: ' + pass + '  (saved in blog/data/admin.json)');
  }
  return a;
}
function checkAdmin(a, user, pass) {
  if (!safeEq(a.user || '', user)) return false;
  if (a.hash) return verifyHash(pass, a.hash);
  if (typeof a.password === 'string' && a.password) return safeEq(a.password, pass);
  return false;
}

/* ---------- signed session cookie (no session store needed) ---------- */
function sign(data) {
  const body = Buffer.from(JSON.stringify(data)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return body + '.' + mac;
}
function unsign(token) {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac) return null;
  const want = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  if (!safeEq(want, mac)) return null;
  try {
    const d = JSON.parse(Buffer.from(body, 'base64url').toString());
    return d.exp > Date.now() ? d : null;
  } catch (e) { return null; }
}
function cookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach((c) => {
    const i = c.indexOf('=');
    if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return out;
}
function setSession(req, res, data) {
  const parts = [COOKIE + '=' + (data ? encodeURIComponent(sign(data)) : ''), 'Path=/', 'HttpOnly', 'SameSite=Strict'];
  if (req.secure) parts.push('Secure');
  if (!data) parts.push('Max-Age=0');
  res.setHeader('Set-Cookie', parts.join('; '));
}
const session = (req) => unsign(cookies(req)[COOKIE]);

/* ---------- validation ---------- */
const RESERVED = ['index', 'admin', 'images', 'data', 'posts', 'sitemap', 'blog'];
const validSlug = (s) => typeof s === 'string' && s.length <= 100 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && !RESERVED.includes(s);

/* =============================== API =============================== */
const api = express.Router();
api.use((req, res, next) => {
  res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
  next();
});
const fail = (res, code, msg) => res.status(code).json({ ok: false, error: msg });

// Simple brute-force protection: 5 wrong logins → 15 minute lock (per IP)
const attempts = new Map();
const LOCK_MS = 15 * 60 * 1000;

api.get('/status', (req, res) => {
  const s = session(req);
  res.json({ ok: true, loggedIn: !!s, user: s ? s.user : '', csrf: s ? s.csrf : '' });
});

api.post('/login', express.json({ limit: '10kb' }), async (req, res) => {
  const ip = req.ip || 'x';
  const a = attempts.get(ip) || { n: 0, t: 0 };
  if (a.n >= 5 && Date.now() - a.t < LOCK_MS) {
    return fail(res, 429, 'Too many wrong attempts. Try again in ' + Math.ceil((LOCK_MS - (Date.now() - a.t)) / 60000) + ' minutes.');
  }
  const user = String((req.body || {}).user || '').trim();
  const pass = String((req.body || {}).pass || '');
  const admin = await loadAdmin();
  if (!user || !pass || !checkAdmin(admin, user, pass)) {
    attempts.set(ip, { n: (a.n >= 5 ? 0 : a.n) + 1, t: Date.now() });
    await new Promise((r) => setTimeout(r, 400));
    return fail(res, 401, 'Wrong username or password.');
  }
  attempts.delete(ip);
  if (!admin.hash) await writeJson(ADMIN_FILE, { user, hash: hashPassword(pass) }); // hide typed password
  const csrf = crypto.randomBytes(16).toString('hex');
  setSession(req, res, { user, csrf, exp: Date.now() + SESSION_HOURS * 3600000 });
  res.json({ ok: true, csrf });
});

api.post('/logout', (req, res) => { setSession(req, res, null); res.json({ ok: true }); });

// Everything below needs a logged-in admin + matching CSRF token
api.use((req, res, next) => {
  const s = session(req);
  if (!s) return fail(res, 401, 'Your session has ended. Please log in again.');
  if (!safeEq(req.get('X-CSRF-Token') || '', s.csrf)) return fail(res, 403, 'Security check failed. Reload the page.');
  req.admin = s;
  next();
});

api.get('/posts', async (req, res) => {
  res.json({ ok: true, posts: await readJson(path.join(DATA, 'posts.json'), []), categories: await loadCategories() });
});

// Blog categories (managed in the admin) → blog/data/categories.json
const CAT_FILE = path.join(DATA, 'categories.json');
const DEFAULT_CATEGORIES = ['Recruitment', 'Staffing', 'Payroll', 'HR Compliance', 'Career Advice', 'Hiring Trends'];
async function loadCategories() {
  const list = await readJson(CAT_FILE, null);
  return Array.isArray(list) ? list : DEFAULT_CATEGORIES.slice();
}
api.post('/categories', express.json({ limit: '50kb' }), async (req, res) => {
  const raw = (req.body || {}).categories;
  if (!Array.isArray(raw)) return fail(res, 400, 'Invalid categories.');
  const seen = new Set();
  const list = [];
  for (const c of raw) {
    const name = String(c || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (name && !seen.has(name.toLowerCase())) { seen.add(name.toLowerCase()); list.push(name); }
  }
  await writeJson(CAT_FILE, list);
  res.json({ ok: true, categories: list });
});

// Image upload: raw image body, checked by its real file signature
api.post('/upload', express.raw({ type: 'image/*', limit: '8mb' }), async (req, res) => {
  const b = req.body;
  if (!Buffer.isBuffer(b) || !b.length) return fail(res, 400, 'No image received (max 8 MB).');
  let ext = null;
  if (b.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) ext = 'jpg';
  else if (b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ext = 'png';
  else if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') ext = 'webp';
  else if (b.slice(0, 4).toString() === 'GIF8') ext = 'gif';
  if (!ext) return fail(res, 400, 'Only JPG, PNG, WebP or GIF images are allowed.');
  const base = String(req.query.name || 'image').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'image';
  const name = base + '-' + crypto.randomBytes(3).toString('hex') + '.' + ext;
  await writeAtomic(path.join(IMAGES, name), b);
  const w = parseInt(req.query.w, 10) || undefined, h = parseInt(req.query.h, 10) || undefined;
  res.json({ ok: true, src: 'images/' + name, w, h });
});

// Save = write all posts + the generated public files into blog/
api.post('/save', express.json({ limit: '15mb' }), async (req, res) => {
  const { posts, files, remove = [] } = req.body || {};
  if (!Array.isArray(posts) || !files || typeof files !== 'object' || !Array.isArray(remove)) return fail(res, 400, 'Invalid data.');
  const seen = new Set();
  for (const p of posts) {
    if (!p || !validSlug(p.slug)) return fail(res, 400, 'Invalid post URL (slug): ' + (p && p.slug));
    if (seen.has(p.slug)) return fail(res, 400, 'Two posts use the same URL: ' + p.slug);
    seen.add(p.slug);
  }
  for (const [name, content] of Object.entries(files)) {
    const m = /^([a-z0-9-]+)\.html$/.exec(name);
    const ok = ['index.html', 'sitemap.xml', 'posts.json'].includes(name) || (m && validSlug(m[1]));
    if (!ok || typeof content !== 'string') return fail(res, 400, 'File not allowed: ' + name);
  }
  try {
    await writeJson(path.join(DATA, 'posts.json'), posts);
    for (const [name, content] of Object.entries(files)) await writeAtomic(path.join(BLOG, name), content);
    for (const slug of remove) {
      if (validSlug(slug) && !files[slug + '.html']) await fsp.unlink(path.join(BLOG, slug + '.html')).catch(() => {});
    }
  } catch (e) {
    console.error(e);
    return fail(res, 500, 'Could not write files: ' + e.message);
  }
  res.json({ ok: true, posts });
});

api.post('/password', express.json({ limit: '10kb' }), async (req, res) => {
  const { current = '', user = '', pass = '' } = req.body || {};
  const admin = await loadAdmin();
  if (!checkAdmin(admin, req.admin.user, String(current))) return fail(res, 400, 'Current password is wrong.');
  const u = String(user).trim();
  if (!u || String(pass).length < 8) return fail(res, 400, 'Username required and password must be at least 8 characters.');
  await writeJson(ADMIN_FILE, { user: u, hash: hashPassword(String(pass)) });
  const s = req.admin;
  setSession(req, res, { user: u, csrf: s.csrf, exp: Date.now() + SESSION_HOURS * 3600000 });
  res.json({ ok: true });
});

/* ---------- SEO settings for robots.txt & sitemap (blog/data/seo.json) ---------- */
const SEO_FILE = path.join(DATA, 'seo.json');
async function loadSeo() {
  const s = await readJson(SEO_FILE, {});
  return {
    robotsExtra: String(s.robotsExtra || ''),
    exclude: Array.isArray(s.exclude) ? s.exclude : [],
    autoCanonical: s.autoCanonical !== false          // on by default
  };
}
api.get('/seo', async (req, res) => res.json({ ok: true, seo: await loadSeo(), siteUrl: SITE_URL }));
api.post('/seo', express.json({ limit: '50kb' }), async (req, res) => {
  const b = req.body || {};
  const robotsExtra = String(b.robotsExtra || '').replace(/\r/g, '').slice(0, 5000);
  const exclude = (Array.isArray(b.exclude) ? b.exclude : String(b.exclude || '').split('\n'))
    .map((x) => String(x).trim()).filter(Boolean)
    .map((x) => (x.startsWith('/') ? x : '/' + x)).slice(0, 500);
  const autoCanonical = b.autoCanonical !== false;
  await writeJson(SEO_FILE, { robotsExtra, exclude, autoCanonical });
  res.json({ ok: true, seo: { robotsExtra, exclude, autoCanonical } });
});

app.use('/api/blog', api);

/* ================= dynamic robots.txt & sitemap.xml ================= */
// Folders and pages that never go in the sitemap
const SKIP_DIRS = new Set(['node_modules', 'components', 'assets', 'images', 'admin', 'data']);
const SKIP_FILES = new Set(['404.html', 'error.html', 'thank-you.html']);
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function scanPages(dir, rel, out) {
  const entries = await fsp.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) await scanPages(full, rel + e.name + '/', out);
    } else if (e.name.endsWith('.html') && !(rel === '' && SKIP_FILES.has(e.name))) {
      out.push({ file: full, url: e.name === 'index.html' ? '/' + rel : '/' + rel + e.name.slice(0, -5) });
    }
  }
  return out;
}

async function buildSitemap(blogOnly) {
  const seo = await loadSeo();
  const excluded = (u) => seo.exclude.some((x) => (x.endsWith('*') ? u.startsWith(x.slice(0, -1)) : u === x || u === x + '/'));
  const posts = await readJson(path.join(DATA, 'posts.json'), []);
  const bySlug = {};
  posts.forEach((p) => { if (p && p.slug) bySlug['/blog/' + p.slug] = p; });

  const pages = await scanPages(ROOT, '', []);
  // Pages served at a different address (ALIASES) are listed under that address
  pages.forEach((pg) => {
    const alias = Object.keys(ALIASES).find((k) => '/' + ALIASES[k] === pg.url + '.html');
    if (alias) pg.url = alias;
  });
  const rows = [];
  for (const pg of pages) {
    if (excluded(pg.url)) continue;
    if (blogOnly && !pg.url.startsWith('/blog/')) continue;
    const head = (await fsp.readFile(pg.file, 'utf8').catch(() => '')).slice(0, 6000);
    if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(head)) continue;   // noindex pages
    const post = bySlug[pg.url];
    if (pg.url.startsWith('/blog/') && pg.url !== '/blog/' && (!post || post.status !== 'published')) continue;
    const st = await fsp.stat(pg.file);
    const lastmod = post ? String(post.modified || post.date || '').slice(0, 10) : st.mtime.toISOString().slice(0, 10);
    let img = post && post.featuredImage && post.featuredImage.src;
    if (img && !/^https?:/i.test(img)) img = SITE_URL + (img.startsWith('/') ? img : '/blog/' + img);
    rows.push({ url: pg.url, lastmod, img, depth: pg.url === '/' ? 0 : pg.url.split('/').filter(Boolean).length });
  }
  rows.sort((a, b) => a.depth - b.depth || a.url.localeCompare(b.url));
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    rows.map((r) => '  <url><loc>' + xmlEsc(SITE_URL + r.url) + '</loc>' + (r.lastmod ? '<lastmod>' + r.lastmod + '</lastmod>' : '') +
      (r.img ? '<image:image><image:loc>' + xmlEsc(r.img) + '</image:loc></image:image>' : '') + '</url>').join('\n') +
    '\n</urlset>\n';
}

// /sitemap.xml = whole website + blog,  /blog/sitemap.xml = blog only
app.get(['/sitemap.xml', '/blog/sitemap.xml'], async (req, res) => {
  try {
    res.type('application/xml').set('Cache-Control', 'no-cache').send(await buildSitemap(req.path.startsWith('/blog/')));
  } catch (e) { console.error(e); res.status(500).type('text/plain').send('Sitemap error'); }
});

app.get('/robots.txt', async (req, res) => {
  const seo = await loadSeo();
  res.type('text/plain').set('Cache-Control', 'no-cache').send(
    'User-agent: *\nAllow: /\nDisallow: /blog/admin/\nDisallow: /api/\n' +
    (seo.robotsExtra.trim() ? '\n# Custom rules (Blog admin → Settings → SEO files)\n' + seo.robotsExtra.trim() + '\n' : '') +
    '\nSitemap: ' + SITE_URL + '/sitemap.xml\nSitemap: ' + SITE_URL + '/blog/sitemap.xml\n');
});

/* ===================== website (replaces .htaccess) ===================== */
// 1) www → non-www, http → https (only on the real domain)
app.use((req, res, next) => {
  const host = String(req.headers.host || '');
  const local = /^(localhost|127\.|\[::1\])/.test(host);
  if (/^www\./i.test(host)) return res.redirect(301, 'https://' + host.slice(4) + req.originalUrl);
  if (!local && req.headers['x-forwarded-proto'] === 'http') return res.redirect(301, 'https://' + host + req.originalUrl);
  next();
});

// Keep the blog admin out of search engines and browser caches
app.use('/blog/admin', (req, res, next) => { res.set({ 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' }); next(); });

// 2) Never serve server files, the blog database, or hidden files
const BLOCKED = /^\/(server\.js|package(-lock)?\.json|node_modules(\/|$)|blog\/data(\/|$))|\/\./i;
app.use((req, res, next) => (BLOCKED.test(decodeURIComponent(req.path)) ? notFound(req, res) : next()));

// 3) Old addresses → new ones (copied from .htaccess)
const REDIRECTS = [
  [/^\/[Cc]ontact\/contact(\.html)?$/, '/contact'],
  [/^\/[Cc]ontact\/(index(\.html)?)?$/, '/contact'],
  [/^\/services\/BFSI hiring(\.html)?$/, '/bfsi-hiring'],
  [/^\/services\/Exit interview(\.html)?$/, '/exit-interview'],
  [/^\/services\/HR Consulting(\.html)?$/, '/hr-consulting'],
  [/^\/services\/Leadership(\.html)?$/, '/leadership'],
  [/^\/services\/Technology hiring(\.html)?$/, '/it'],
  // Workforce Solutions page was removed (industries now have white/blue-collar tabs)
  [/^\/workforce_solutions(\.html)?\/?$/, '/#industries'],
  // Technology Hiring was merged into the IT page (white-collar + blue-collar IT jobs)
  [/^\/technology-hiring(\.html)?\/?$/, '/it'],
  [/^\/services\/self skill(\.html)?$/, '/soft-skill'],
  // Self Skill Training was renamed Soft Skill Training
  [/^\/self-skill(\.html)?\/?$/, '/soft-skill'],
  [/^\/services\/recuirtnmmet ?(\.html)?$/, '/recruitment'],
  [/^\/services\/complinace(\.html)?$/, '/compliance'],
  [/^\/services\/it(-hiring)?(\.html)?$/, '/it'],
  [/^\/organization\/oragnization[ -]development(\.html)?$/, '/organization-development'],
  // service pages moved out of /services/ and /organization/ to the site root
  [/^\/(?:services|organization)\/([^/]+?)(\.html)?$/, '/$1'],
  [/^\/(?:services|organization)\/?$/, '/'],
  // location pages moved from folders to single pages (no trailing slash)
  [/^\/((?:it-)?recruitment-agency-in-(?!india)[a-z]+)\/(index(\.html)?)?$/, '/$1'],
  // Recruitment Agency in India lives at /it/recruitment-agency-in-india
  [/^\/(?:it-)?recruitment-agency-in-india(\.html)?\/?$/, '/it/recruitment-agency-in-india'],
  [/^\/assest\/TL\.png$/, '/assets/tl.png'],
  [/^\/assest\/TL-logo\.png$/, '/assets/tl-logo.png'],
  [/^\/assest\/Talennexus OG\.png$/, '/assets/talennexus-og.png'],
  [/^\/assest\/(.*)$/, '/assets/$1']
];
// Pretty addresses served from a file with a different name (same as the RewriteRule in .htaccess)
const ALIASES = { '/it/recruitment-agency-in-india': 'recruitment-agency-in-india.html' };
app.use((req, res, next) => {
  const p = decodeURIComponent(req.path);
  for (const [re, to] of REDIRECTS) if (re.test(p)) return res.redirect(301, p.replace(re, to));
  // /index.html, /folder/index → folder;  /page.html → /page
  const q = req.originalUrl.slice(req.path.length);
  let m = /^(.*\/)index(\.html)?$/i.exec(req.path);
  if (m) return res.redirect(301, m[1] + q);
  m = /^(.+)\.html$/i.exec(req.path);
  if (m && req.path !== '/404.html') return res.redirect(301, m[1] + q);
  next();
});

// 4) Serve files; extensionless URLs → .html
function cacheHeaders(res, file) {
  if (/\.(html|js|css|json|xml)$/i.test(file)) res.set('Cache-Control', 'no-cache');
  else if (/\.(png|jpe?g|gif|webp|avif|svg|ico|woff2?)$/i.test(file)) res.set('Cache-Control', 'public, max-age=2592000');
}
// Clean public address of an .html file:  /services/payroll.html → /services/payroll,  /contact/index.html → /contact/
function cleanUrl(file) {
  const rel = '/' + path.relative(ROOT, file).split(path.sep).join('/');
  return rel.endsWith('/index.html') || rel === '/index.html' ? rel.slice(0, -10) : rel.replace(/\.html$/, '');
}

// Automatic canonical tag: added to any page that does not already have one
// (skipped for "noindex" pages). Turn off in Blog admin → Settings → SEO files.
async function sendHtml(res, file) {
  const seo = await loadSeo();
  let html = await fsp.readFile(file, 'utf8');
  const head = html.slice(0, html.search(/<\/head>/i) + 1 || 8000);
  if (seo.autoCanonical && !/<link[^>]+rel=["']canonical["']/i.test(head) &&
      !/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(head) && /<\/head>/i.test(html)) {
    const tag = '<link rel="canonical" href="' + xmlEsc(SITE_URL + cleanUrl(file)) + '">\n';
    html = html.replace(/<\/head>/i, tag + '</head>');
  }
  cacheHeaders(res, file);
  res.type('html').send(html);
}

function send(res, file) {
  if (/\.html$/i.test(file)) return sendHtml(res, file).catch(() => res.status(500).end());
  cacheHeaders(res, file);
  res.sendFile(file, { dotfiles: 'deny' });
}
function notFound(req, res) {
  res.status(404);
  cacheHeaders(res, '404.html');
  res.sendFile(path.join(ROOT, '404.html'), (err) => { if (err) res.end('404 Not Found'); });
}

app.get('*', async (req, res) => {
  let p;
  try { p = decodeURIComponent(req.path); } catch (e) { return notFound(req, res); }
  if (ALIASES[p]) return send(res, path.join(ROOT, ALIASES[p]));
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) return notFound(req, res);
  const stat = await fsp.stat(file).catch(() => null);
  if (stat && stat.isFile()) return send(res, file);
  if (stat && stat.isDirectory()) {
    if (!p.endsWith('/')) return res.redirect(301, p + '/' + req.originalUrl.slice(req.path.length));
    const idx = path.join(file, 'index.html');
    if (await fsp.stat(idx).catch(() => null)) return send(res, idx);
  }
  const html = file.replace(/\/+$/, '') + '.html';
  if (await fsp.stat(html).catch(() => null)) {
    // pages have no trailing slash: /recruitment-agency-in-chennai/ → /recruitment-agency-in-chennai
    if (p.length > 1 && p.endsWith('/')) return res.redirect(301, p.replace(/\/+$/, '') + req.originalUrl.slice(req.path.length));
    return send(res, html);
  }
  notFound(req, res);
});

app.use((req, res) => notFound(req, res));

/* ============================== start ============================== */
fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(IMAGES, { recursive: true });
if (!fs.existsSync(path.join(DATA, 'posts.json'))) fs.writeFileSync(path.join(DATA, 'posts.json'), '[]\n');
loadAdmin().then(() => {
  app.listen(PORT, () => console.log('Talennexus site running on http://localhost:' + PORT));
});
