const fs   = require('fs');
const path = require('path');

const POSTS_DIR    = path.join(__dirname, 'insights', 'posts');
const MANIFEST_OUT = path.join(__dirname, 'insights', 'manifest.json');

const CATEGORIES = {
  "automatizacion":           { color: "#7a3010", en: "Automation",             es: "Automatización" },
  "inteligencia-artificial":  { color: "#233444", en: "Artificial Intelligence", es: "Inteligencia Artificial" },
  "casos-reales":             { color: "#0d3320", en: "Real Cases",              es: "Casos Reales" },
  "workflows":                { color: "#2a1040", en: "Workflows",               es: "Workflows" }
};

const files = fs.readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.json') && f !== '.gitkeep');

const articles = files.map(file => {
  const raw     = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
  const article = JSON.parse(raw);

  // Strip body from manifest — body stays only in the post JSON
  const { body: _enBody, ...enWithoutBody } = article.en || {};
  const { body: _esBody, ...esWithoutBody } = article.es || {};

  return {
    slug:     article.slug,
    category: article.category,
    date:     article.date,
    readTime: article.readTime,
    en:       enWithoutBody,
    es:       esWithoutBody
  };
}).sort((a, b) => new Date(b.date) - new Date(a.date));

const manifest = {
  generatedAt: new Date().toISOString(),
  total:       articles.length,
  categories:  CATEGORIES,
  articles
};

fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
console.log(`✅ Manifest generated with ${articles.length} articles.`);

/* ────────────────────────────────────────────────────────────
   Static article pages: /insights/<slug>/index.html
   Pre-rendered (English) from insights/insight-post.html so the
   article text is in the HTML search engines read. Spanish is
   served at ?lang=es and swapped in by the same renderer.
──────────────────────────────────────────────────────────── */
const R        = require('./assets/js/insight-render.js');
const SITE     = 'https://dynxlabs.com';
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'insights', 'insight-post.html'), 'utf-8');

const attr   = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ldTag  = (id, data) => `<script type="application/ld+json" id="${id}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
// String.replace with a function so "$" in article text is never treated as a pattern.
const swap   = (html, re, value) => {
  if (!re.test(html)) throw new Error(`template marker not found: ${re}`);
  return html.replace(re, () => value);
};

files.forEach(file => {
  const post = JSON.parse(fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8'));
  const entry = articles.find(a => a.slug === post.slug);
  const full = Object.assign({}, entry, {
    en: Object.assign({}, entry.en, { body: post.en && post.en.body }),
    es: Object.assign({}, entry.es, { body: post.es && post.es.body })
  });
  const out = R.render(full, manifest, 'en');

  let html = TEMPLATE;
  html = swap(html, /<title id="page-title">[^<]*<\/title>/, `<title id="page-title">${attr(out.title)} | DYNX Labs</title>`);
  html = swap(html, /<meta id="meta-description" name="description" content="[^"]*" \/>/, `<meta id="meta-description" name="description" content="${attr(out.summary)}" />`);
  html = swap(html, /<meta id="meta-robots" name="robots" content="[^"]*" \/>/, '<meta id="meta-robots" name="robots" content="index, follow" />');
  html = swap(html, /<link id="meta-alt-en"[^>]*\/>/, `<link id="meta-alt-en" rel="alternate" hreflang="en" href="${R.articleUrl(post.slug, 'en')}" />`);
  html = swap(html, /<link id="meta-alt-es"[^>]*\/>/, `<link id="meta-alt-es" rel="alternate" hreflang="es" href="${R.articleUrl(post.slug, 'es')}" />`);
  html = swap(html, /<link id="meta-alt-x"[^>]*\/>/, `<link id="meta-alt-x" rel="alternate" hreflang="x-default" href="${R.articleUrl(post.slug, 'en')}" />`);
  html = swap(html, /<meta id="og-title"([^>]*)content="[^"]*" \/>/, `<meta id="og-title"       property="og:title"       content="${attr(out.title)}" />`);
  html = swap(html, /<meta id="og-description"([^>]*)content="[^"]*" \/>/, `<meta id="og-description" property="og:description" content="${attr(out.summary)}" />`);
  html = swap(html, /<meta id="og-url"([^>]*)content="[^"]*" \/>/, `<meta id="og-url"         property="og:url"          content="${out.url}" />`);
  html = swap(html, /<\/head>/, `  ${ldTag('json-ld-article', out.jsonLd)}\n  ${ldTag('json-ld-breadcrumb', out.breadcrumb)}\n</head>`);
  html = swap(html, /<main class="post-page" id="post-main">[\s\S]*?<\/main>/, `<main class="post-page" id="post-main">${out.html}\n</main>`);

  const dir = path.join(__dirname, 'insights', post.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
});
console.log(`✅ ${files.length} article pages pre-rendered.`);

/* ────────────────────────────────────────────────────────────
   sitemap.xml — every page in both languages (hreflang pairs)
──────────────────────────────────────────────────────────── */
const today = new Date().toISOString().slice(0, 10);
const PAGES = [
  { loc: '/',          freq: 'weekly',  prio: '1.0' },
  { loc: '/contact',   freq: 'yearly',  prio: '0.9' },
  { loc: '/insights',  freq: 'weekly',  prio: '0.9' },
  { loc: '/products',  freq: 'monthly', prio: '0.8' },
  { loc: '/research',  freq: 'monthly', prio: '0.7' },
  { loc: '/faq',       freq: 'yearly',  prio: '0.7' }
];
const urlBlock = (en, es, lastmod, freq, prio) => [en, es].map(loc => `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>
    <xhtml:link rel="alternate" hreflang="es" href="${es}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${en}"/>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>
  </url>`).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by generate-manifest.js — do not edit by hand -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${PAGES.map(p => urlBlock(SITE + p.loc, SITE + p.loc + '?lang=es', today, p.freq, p.prio)).join('\n')}
${articles.map(a => urlBlock(R.articleUrl(a.slug, 'en'), R.articleUrl(a.slug, 'es'), a.date, 'monthly', '0.7')).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
console.log(`✅ sitemap.xml written (${(PAGES.length + articles.length) * 2} URLs).`);
