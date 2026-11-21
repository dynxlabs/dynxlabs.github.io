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
  total:       articles.length,
  categories:  CATEGORIES,
  articles
};

fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
console.log(`✅ Manifest generated with ${articles.length} articles.`);

/* ────────────────────────────────────────────────────────────
   assets/js/insights-data.js — the data the Insights listing reads in
   the browser (cards, filters, search). It used to be a hand-maintained
   copy of the articles and drifted from them. It is now generated from
   the same source as everything else (insights/posts/*.json), so the
   listing cards, the article pages and the JSON-LD can never disagree.
──────────────────────────────────────────────────────────── */
const DATA_OUT = path.join(__dirname, 'assets', 'js', 'insights-data.js');
fs.writeFileSync(DATA_OUT, `/**
 * ═══════════════════════════════════════════════════════
 * DYNX Labs — Insights Data
 * ═══════════════════════════════════════════════════════
 *
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * ARCHIVO GENERADO — NO EDITAR A MANO.
 *
 * Source / Fuente:  insights/posts/*.json
 * Generator / Generador:  generate-manifest.js  (npm run build)
 *
 * To add or change an article, edit its JSON file in insights/posts/
 * and run the build. Categories are defined in generate-manifest.js.
 *
 * Para agregar o cambiar un artículo, edita su archivo JSON en
 * insights/posts/ y ejecuta el build. Las categorías se definen en
 * generate-manifest.js.
 * ═══════════════════════════════════════════════════════
 */

const INSIGHTS_CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};

const INSIGHTS_ARTICLES = ${JSON.stringify(articles, null, 2)};
`);
console.log(`✅ insights-data.js generated with ${articles.length} articles.`);

/* ────────────────────────────────────────────────────────────
   Bilingual static article pages:
     /es/insights/<slug>/index.html   and   /en/insights/<slug>/index.html
   Each page is fully pre-rendered in its language: the complete article
   is in the HTML (no JS / no fetch needed to read it), with a
   self-referential canonical, reciprocal hreflang (x-default → es),
   localized Open Graph / Twitter Cards / JSON-LD, and @id references
   aligned with Phase 2 (#organization, #person-arois).

   The legacy /insights/<slug>/ pages are intentionally NOT regenerated
   here (their migration is Phase 5). sitemap.xml is not written here
   either (sitemap phase). This run only builds the 58 bilingual pages.
──────────────────────────────────────────────────────────── */
const R        = require('./assets/js/insight-render.js');
const { rewriteHref } = require('./scripts/rewrite-href.js');
const SITE     = 'https://dynxlabs.com';
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'insights', 'insight-post.html'), 'utf-8');

const attr   = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ldTag  = (id, data) => `<script type="application/ld+json" id="${id}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
// String.replace with a function so "$" in article text is never treated as a pattern.
const swap   = (html, re, value) => {
  if (!re.test(html)) throw new Error(`template marker not found: ${re}`);
  return html.replace(re, () => value);
};
// Remove a template region; throws if the region is missing (so we never
// silently ship a page that still hides or re-renders its content).
const strip  = (html, re, what) => {
  if (!re.test(html)) throw new Error(`template region not found: ${what}`);
  return html.replace(re, '');
};

/* Bake the page chrome (everything in <body> outside the article <main>):
   navbar/footer text and aria-labels in the page's language, and the language
   toggle as real links to the equivalent article. Uses the same rules as the
   main pages (scripts/i18n-bake.js). Only the two chrome fragments go through
   the HTML parser; <head> and the pre-rendered article are spliced back
   untouched, byte for byte. Throws if the template structure is not the
   expected one, so a broken page is never written silently. */
const { parse } = require('node-html-parser');
const { bakeText, bakeLangToggle } = require('./scripts/i18n-bake.js');
const LOCALES = {
  es: JSON.parse(fs.readFileSync(path.join(__dirname, 'locales', 'es.json'), 'utf-8')),
  en: JSON.parse(fs.readFileSync(path.join(__dirname, 'locales', 'en.json'), 'utf-8'))
};

function bakeChrome(html, lang, tail) {
  const bodyOpen  = html.match(/<body[^>]*>/);
  const mainStart = html.indexOf('<main class="post-page" id="post-main">');
  const mainEnd   = html.lastIndexOf('</main>') + '</main>'.length;
  const bodyClose = html.lastIndexOf('</body>');
  if (!bodyOpen || mainStart < 0 || mainEnd < '</main>'.length || bodyClose < 0) throw new Error('bakeChrome: template structure not found');
  const chromeStart = bodyOpen.index + bodyOpen[0].length;
  if (!(chromeStart <= mainStart && mainStart < mainEnd && mainEnd <= bodyClose)) throw new Error('bakeChrome: unexpected template order');

  const bakeFragment = fragment => {
    const root = parse(fragment, { comment: true, blockTextElements: { script: true, style: true, noscript: true } });
    bakeText(root, LOCALES[lang]);
    bakeLangToggle(root, lang, tail);
    const out = root.toString();
    const count = (s, re) => (s.match(re) || []).length;
    if (count(out, /<script\b/g) !== count(fragment, /<script\b/g) || count(out, /<\/(div|header|footer|nav|section)>/g) !== count(fragment, /<\/(div|header|footer|nav|section)>/g)) {
      throw new Error('bakeChrome: fragment structure changed while baking');
    }
    return out;
  };

  const baked = html.slice(0, chromeStart) + bakeFragment(html.slice(chromeStart, mainStart)) +
                html.slice(mainStart, mainEnd) + bakeFragment(html.slice(mainEnd, bodyClose)) + html.slice(bodyClose);
  if (/\bdata-i18n/.test(baked.slice(0, mainStart)) || /\bdata-i18n/.test(baked.slice(baked.lastIndexOf('</main>')))) {
    throw new Error('bakeChrome: unresolved data-i18n attributes left in the page chrome');
  }
  return baked;
}

let pageCount = 0;
files.forEach(file => {
  const post  = JSON.parse(fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8'));
  const entry = articles.find(a => a.slug === post.slug);
  const full  = Object.assign({}, entry, {
    en: Object.assign({}, entry.en, { body: post.en && post.en.body }),
    es: Object.assign({}, entry.es, { body: post.es && post.es.body })
  });

  ['es', 'en'].forEach(lang => {
    const out = R.render(full, manifest, lang);
    const alt = out.alternates;
    const img = R.imageUrl(post.slug, lang);
    let html  = TEMPLATE;

    html = html.replace('<html lang="en" id="html-root" data-own-canonical>',
                        `<html lang="${lang}" id="html-root" data-own-canonical>`);

    html = swap(html, /<title id="page-title">[^<]*<\/title>/, `<title id="page-title">${attr(out.title)} | DYNX Labs</title>`);
    html = swap(html, /<meta id="meta-description" name="description" content="[^"]*" \/>/, `<meta id="meta-description" name="description" content="${attr(out.summary)}" />`);
    html = swap(html, /<meta id="meta-robots" name="robots" content="[^"]*" \/>/, '<meta id="meta-robots" name="robots" content="index, follow" />');
    html = swap(html, /<link id="meta-alt-en"[^>]*\/>/, `<link id="meta-alt-en" rel="alternate" hreflang="en" href="${alt.en}" />`);
    html = swap(html, /<link id="meta-alt-es"[^>]*\/>/, `<link id="meta-alt-es" rel="alternate" hreflang="es" href="${alt.es}" />`);
    html = swap(html, /<link id="meta-alt-x"[^>]*\/>/, `<link id="meta-alt-x" rel="alternate" hreflang="x-default" href="${alt['x-default']}" />`);
    html = swap(html, /<meta id="og-title"([^>]*)content="[^"]*" \/>/, `<meta id="og-title"       property="og:title"       content="${attr(out.title)}" />`);
    html = swap(html, /<meta id="og-description"([^>]*)content="[^"]*" \/>/, `<meta id="og-description" property="og:description" content="${attr(out.summary)}" />`);
    html = swap(html, /<meta\s+property="og:image"\s+content="[^"]*" \/>/, `<meta                     property="og:image"        content="${img}" />`);
    html = swap(html, /<meta id="og-url"([^>]*)content="[^"]*" \/>/, `<meta id="og-url"         property="og:url"          content="${out.url}" />`);

    // Static canonical + og:locale + Twitter Cards + JSON-LD (injected once, before </head>).
    html = swap(html, /<\/head>/,
      `  <link rel="canonical" href="${out.url}" />\n` +
      `  <meta property="og:locale" content="${lang === 'es' ? 'es_ES' : 'en_US'}" />\n` +
      `  <meta name="twitter:card"        content="summary_large_image" />\n` +
      `  <meta name="twitter:title"       content="${attr(out.title)}" />\n` +
      `  <meta name="twitter:description" content="${attr(out.summary)}" />\n` +
      `  <meta name="twitter:image"       content="${img}" />\n` +
      `  ${ldTag('json-ld-article', out.jsonLd)}\n` +
      `  ${ldTag('json-ld-breadcrumb', out.breadcrumb)}\n</head>`);

    html = swap(html, /<main class="post-page" id="post-main">[\s\S]*?<\/main>/, `<main class="post-page" id="post-main">${out.html}\n</main>`);

    // Make the page fully static: the article is already baked in <lang>, so
    // drop the "hide until JS swaps" guard and the client re-render that would
    // otherwise hide or replace the pre-rendered content. Navigation JS stays.
    html = strip(html, /\s*<script>\s*\/\/ Spanish readers[\s\S]*?<\/script>\s*<style>\.post-wait #post-main\{visibility:hidden\}<\/style>/, 'post-wait guard');
    html = strip(html, /\s*<script src="\/assets\/js\/insight-render\.js"><\/script>\s*<script>[\s\S]*?<\/script>(?=\s*<\/body>)/, 'client re-render');

    // Localize navbar/footer internal links to the page's language. Reuses the
    // shared rewriteHref: external links, assets and #anchors are preserved, and
    // the idempotency guard leaves already-localized article links untouched.
    html = html.replace(/(<a\b[^>]*?\bhref=")([^"]*)(")/g, (m, pre, href, post) => pre + rewriteHref(href, lang) + post);

    // Bake navbar/footer text and the language toggle in the page's language.
    html = bakeChrome(html, lang, `insights/${post.slug}/`);

    const dir = path.join(__dirname, lang, 'insights', post.slug);
    fs.mkdirSync(dir, { recursive: true });
    // Always write LF so the output is byte-identical on every platform.
    fs.writeFileSync(path.join(dir, 'index.html'), html.replace(/\r+\n?/g, '\n'));
    pageCount++;
  });
});
console.log(`✅ ${pageCount} bilingual article pages pre-rendered (/es/ + /en/).`);

/* ────────────────────────────────────────────────────────────
   sitemap.xml — only the canonical /es/ and /en/ URLs of the new
   architecture (7 main pages + 29 articles, each in both languages),
   with reciprocal hreflang (x-default → the Spanish version).
   No ?lang= URLs, no legacy URLs, no 404, no lastmod (we have no
   verifiable modification date; publication dates are NOT modification
   dates). Article URLs come from R.articleUrl so they match canonical.
   Legacy-URL migration is Phase 5; this run does not touch it.
──────────────────────────────────────────────────────────── */
const MAIN_SLUGS = ['', 'products', 'research', 'faq', 'contact', 'leadership', 'insights'];

// One <url> per language in the pair, each carrying the full hreflang set.
function sitemapPair(esUrl, enUrl) {
  return [esUrl, enUrl].map(loc => `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="es"        href="${esUrl}"/>
    <xhtml:link rel="alternate" hreflang="en"        href="${enUrl}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${esUrl}"/>
  </url>`).join('\n');
}

const mainPairs    = MAIN_SLUGS.map(s => sitemapPair(`${SITE}/es/${s}`, `${SITE}/en/${s}`));
// Hand-authored legal pages (dedicated per-language slug, directory URLs with trailing slash).
const legalPairs   = [sitemapPair(`${SITE}/es/privacidad/`, `${SITE}/en/privacy/`)];
const articlePairs = articles.map(a => sitemapPair(R.articleUrl(a.slug, 'es'), R.articleUrl(a.slug, 'en')));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by generate-manifest.js — do not edit by hand -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${mainPairs.concat(legalPairs, articlePairs).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
console.log(`✅ sitemap.xml written (${(MAIN_SLUGS.length + articles.length + legalPairs.length) * 2} URLs).`);
