# Talennexus Website

Website for **Talennexus** — recruitment, staffing, payroll and HR consulting.
Live site: https://talennexus.com

## Folder structure

```
talennexus.com/
├── public_html/              ← everything that goes on the web server
│   ├── index.html            ← home page
│   ├── *.html                ← service, industry, location and IT pages
│   ├── components/           ← shared parts used on every page
│   │   ├── site-header.js    ← top menu
│   │   ├── site-footer.js    ← footer
│   │   ├── site-contact.js   ← contact form (Zoho)
│   │   └── site-gtm.js       ← Google Tag Manager
│   ├── assets/               ← logo, favicons, city photos
│   ├── blog/                 ← blog pages + blog admin
│   ├── server.js             ← Node.js server (website + blog admin)
│   ├── package.json
│   ├── .htaccess             ← clean URLs & redirects for Apache hosting
│   ├── sitemap.xml
│   └── robots.txt
└── README.md
```

## Run on your computer

```bash
cd public_html
npm install
npm start
```

Open http://localhost:3000

## Page addresses

Pages have short addresses without `.html`, for example:

- `/staffingsupport`, `/payroll`, `/recruitment`
- `/recruitment-agency-in-chennai`, `/it-recruitment-agency-in-bangalore`
- `/it/recruitment-agency-in-india` (file: `recruitment-agency-in-india.html`)

Old addresses (like `/services/payroll`) redirect to the new ones — see `.htaccess` and `server.js`.

## Editing the menu, footer or contact form

Change the file in `public_html/components/` — it updates every page at once.

## Not stored in GitHub

These are private and listed in `.gitignore`:

- `public_html/blog/data/admin.json` — blog admin login
- `public_html/blog/data/.secret` — login signing key
- `node_modules/` and `.zip` files

On a new server the blog admin login has to be set up again.
