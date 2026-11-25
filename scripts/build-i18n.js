/* ============================================================
   DYNX Labs — Static i18n page builder (Phase 1: main pages)
   File: scripts/build-i18n.js

   Renders each source HTML page into one fully-baked static file
   per language (text already in place), so every language is a
   real, indexable page at /<lang>/<page> instead of being swapped
   by client-side JS.

   It mirrors, at build time, exactly what assets/js/i18n.js does at
   runtime (applyToDOM): data-i18n (text), data-i18n-aria,
   data-i18n-placeholder, data-i18n-content and data-i18n-label.
   Translation keys come from the existing meta.* / a11y.* / page
   namespaces in locales/<lang>.json — no parallel namespace.

   Per language it also:
     - rewrites internal <a> links to the same-language path
     - turns the language toggle into real links between languages
     - bakes the <head> SEO (title, og/twitter title, canonical,
       hreflang, og:url, og:locale) to the /<lang>/ scheme
     - pins the page language so the client JS stays in sync

   NOTE (Phase 1 limitation): JSON-LD (Schema.org) blocks are NOT
   rewritten. Their embedded URLs still point to the legacy scheme
   and MUST be resolved before these pages are production-ready.

   Output goes to /<lang>/... ; nothing in the repo root is touched.
============================================================ */

const fs   = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');
const { rewriteHref } = require('./rewrite-href.js');
const { get, isInvalid, escapeText, bakeText, bakeLangToggle } = require('./i18n-bake.js');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://dynxlabs.com';

const LANGS = {
  es: { htmlLang: 'es', ogLocale: 'es_ES', ogAlt: 'en_US' },
  en: { htmlLang: 'en', ogLocale: 'en_US', ogAlt: 'es_ES' }
};

const XDEFAULT = 'es';

// source file -> output file + meta.* namespace key (null = no meta entry)
const PAGES = [
  { src: 'index.html',      out: 'index.html',      meta: 'home' },
  { src: 'products.html',   out: 'products.html',   meta: 'products' },
  { src: 'faq.html',        out: 'faq.html',        meta: 'faq' },
  { src: 'research.html',   out: 'research.html',   meta: 'research' },
  { src: 'insights.html',   out: 'insights.html',   meta: 'insights' },
  { src: 'contact.html',    out: 'contact.html',    meta: 'contact' },
  { src: 'leadership.html', out: 'leadership.html', meta: 'leadership' },
  { src: '404.html',        out: '404.html',        meta: 'notFound' }
];

/* ---------- helpers ---------- */
function loadLocale(lang) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', `${lang}.json`), 'utf-8'));
}

// get / isInvalid / escapeText and the data-i18n baking live in ./i18n-bake.js
// (shared with generate-manifest.js so article chrome is baked identically).

function setMeta(root, selector, value) {
  const el = root.querySelector(selector);
  if (el && !isInvalid(value)) el.setAttribute('content', value);
}

// Create a <meta> right after `afterSelector` when the page does not ship it.
// Returns true if it was created. Existing tags are never duplicated.
function ensureMeta(root, attr, name, value, afterSelector) {
  if (isInvalid(value)) return false;
  if (root.querySelector(`meta[${attr}="${name}"]`)) return false;
  const anchor = root.querySelector(afterSelector);
  if (!anchor) throw new Error(`ensureMeta: anchor not found (${afterSelector}) for ${name}`);
  anchor.insertAdjacentHTML('afterend', `\n  <meta ${attr}="${name}" content="${String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`);
  return true;
}

/* ---------- Insights listing: static article cards ----------
   The listing renders its cards with JavaScript (assets/js/insights.js).
   To keep every article reachable from the initial HTML (crawlers and
   no-JS readers), the same cards are baked here in the default view
   (grid, newest first). The markup mirrors renderCards() in insights.js;
   on load that script re-renders the grid with identical output. */
// Card data comes from the SAME file the listing's JavaScript reads
// (assets/js/insights-data.js), so the baked cards are identical to what the
// browser renders. Falls back to the manifest if that file is not available.
const LISTING = (() => {
  try {
    const sandbox = {};
    require('vm').runInNewContext(
      fs.readFileSync(path.join(ROOT, 'assets', 'js', 'insights-data.js'), 'utf-8') +
      '\n;this.__A = INSIGHTS_ARTICLES; this.__C = INSIGHTS_CATEGORIES;', sandbox, { timeout: 2000 });
    if (Array.isArray(sandbox.__A) && sandbox.__A.length) return { articles: sandbox.__A, categories: sandbox.__C || {} };
  } catch (e) { /* fall through to the manifest */ }
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'insights', 'manifest.json'), 'utf-8')); }
  catch (e) { return { articles: [], categories: {} }; }
})();

function cardDate(dateStr, lang) {
  return new Date(dateStr + 'T00:00:00')
    .toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function insightCards(lang) {
  const list = (LISTING.articles || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  return list.map(article => {
    const data     = article[lang] || article.en;
    const cat      = (LISTING.categories || {})[article.category] || {};
    const catLabel = cat[lang] || cat.en || article.category;
    const readTime = (article.readTime || {})[lang] || (article.readTime || {}).en || '';
    return `
        <a href="/${lang}/insights/${article.slug}/"
           class="insight-card insight-card--grid"
           data-slug="${article.slug}"
          >
          <div class="insight-card__band" aria-hidden="true">
            <p class="insight-card__cat">${escapeText(catLabel)}</p>
          </div>
          <div class="insight-card__body">
            <h3 class="insight-card__title">${escapeText(data.title)}</h3>
            <p class="insight-card__summary">${escapeText(data.summary)}</p>
            <div class="insight-card__meta">
              <span class="insight-card__date">${cardDate(article.date, lang)}</span>
              <span class="insight-card__dot">·</span>
              <span class="insight-card__read">${escapeText(readTime)}</span>
            </div>
          </div>
        </a>`;
  }).join('');
}

/* ---------- JSON-LD (Schema.org) localization ----------
   Global, stable identities (never change by language):            */
const ORG_ID    = `${BASE}/#organization`;
const PERSON_ID = `${BASE}/#person-arois`;
const SITE_ID   = `${BASE}/#website`;
const PERSON_JOBTITLE = 'Founder & CEO';      // canonical denomination
const LINKEDIN  = 'https://www.linkedin.com/in/aroismonsalve/';
const PAGE_TYPES = ['WebPage', 'CollectionPage', 'ProfilePage', 'AboutPage', 'ContactPage'];

// Article titles per language (from the manifest), for localizing the
// Insights listing ItemList (names + per-language article URLs).
const ARTICLE_TITLES = {};
let ARTICLE_SLUGS = null;                       // manifest order (newest first); null = no manifest
try {
  const mf = JSON.parse(fs.readFileSync(path.join(ROOT, 'insights', 'manifest.json'), 'utf-8'));
  (mf.articles || []).forEach(a => {
    ARTICLE_TITLES[a.slug] = { en: (a.en || {}).title, es: (a.es || {}).title };
  });
  ARTICLE_SLUGS = (mf.articles || []).map(a => a.slug);
} catch (e) { /* no manifest → ItemList names left as-is */ }

const articleSlugOf = url => (String(url || '').match(/\/insights\/([^\/?#]+)\/?$/) || [])[1];

function typeList(node) { return [].concat(node['@type'] || []); }

// slug of a same-origin page URL: '' for home, 'products', 'insights', …; null if external
function slugFromItem(itemUrl) {
  const m = String(itemUrl || '').match(/^https?:\/\/(?:www\.)?dynxlabs\.com(\/[^\s]*)?$/i);
  if (!m) return null;
  return (m[1] || '/').replace(/^\/+/, '').replace(/\/+$/, '');
}

// Recursively localize one parsed JSON-LD object in place, per the allowlist.
function transformJsonLd(node, ctx) {
  if (Array.isArray(node)) { node.forEach(n => transformJsonLd(n, ctx)); return; }
  if (!node || typeof node !== 'object') return;
  const types = typeList(node);

  // --- global identity entities: assign stable @id, keep data global ---
  if (types.includes('Organization')) node['@id'] = ORG_ID;   // name/url/logo/sameAs/description stay global
  if (types.includes('WebSite'))      node['@id'] = SITE_ID;
  if (types.includes('Person')) {
    node['@id']   = PERSON_ID;
    node.jobTitle = PERSON_JOBTITLE;           // resolve "CEO & Founder" vs "Founder & CEO"
    node.sameAs   = [LINKEDIN];                // LinkedIn = official external profile
    delete node.url;                           // global entity: no language-specific url (identity = @id + sameAs)
    delete node.address;                       // drop PostalAddress (country-only, not institutional)
  }

  // --- page-level entities (localized) ---
  if (types.some(t => PAGE_TYPES.includes(t))) {
    node.url        = ctx.pageUrl;
    node['@id']     = `${ctx.pageUrl}#webpage`;
    node.inLanguage = ctx.lang;
    node.isPartOf   = { '@id': SITE_ID };
    const desc = ctx.metaKey ? get(ctx.dict, `meta.${ctx.metaKey}.desc`) : undefined;
    if (node.description !== undefined && !isInvalid(desc)) node.description = desc;
  }

  // --- breadcrumbs (localized URLs + names; home crumb keeps its brand name) ---
  if (types.includes('BreadcrumbList') && Array.isArray(node.itemListElement)) {
    node.itemListElement.forEach(li => {
      if (!li || li.item === undefined) return;
      const slug = slugFromItem(li.item);
      if (slug === null) return;               // external, leave alone
      li.item = slug ? `${BASE}/${ctx.lang}/${slug}` : `${BASE}/${ctx.lang}/`;
      if (slug) {
        const bn = get(ctx.dict, `breadcrumb.${slug}`);
        if (!isInvalid(bn)) li.name = bn;
      }
    });
  }

  // --- FAQ: pull Q/A from the SAME locale data as the visible FAQ (faq.qN / faq.aN) ---
  if (types.includes('FAQPage') && Array.isArray(node.mainEntity)) {
    node.mainEntity.forEach((q, i) => {
      if (!q) return;
      const qk = get(ctx.dict, `faq.q${i + 1}`);
      const ak = get(ctx.dict, `faq.a${i + 1}`);
      if (!isInvalid(qk)) q.name = qk;
      if (q.acceptedAnswer && !isInvalid(ak)) q.acceptedAnswer.text = ak;
    });
  }

  // --- Insights ItemList: keep it in sync with the manifest ---
  // The list is hand-written in insights.html. Existing items keep their order;
  // articles missing from it are added on top (newest first) and items whose
  // article no longer exists are dropped, so a new post never needs a manual edit.
  if (types.includes('ItemList') && Array.isArray(node.itemListElement) && ARTICLE_SLUGS &&
      node.itemListElement.some(li => articleSlugOf(li && li.url))) {
    const present = node.itemListElement.map(li => articleSlugOf(li && li.url));
    const missing = ARTICLE_SLUGS.filter(slug => !present.includes(slug))
      .map(slug => ({ '@type': 'ListItem', position: 0, url: `${BASE}/insights/${slug}`, name: '' }));
    node.itemListElement = missing.concat(node.itemListElement.filter(li => ARTICLE_SLUGS.includes(articleSlugOf(li && li.url))));
    node.itemListElement.forEach((li, i) => { li.position = i + 1; });
  }

  // --- Insights ItemList: localize each article item (url + name) per language ---
  if (types.includes('ListItem') && typeof node.url === 'string') {
    const m = node.url.match(/\/insights\/([^\/?#]+)\/?$/);
    if (m) {
      const slug = m[1];
      node.url = `${BASE}/${ctx.lang}/insights/${slug}/`;
      const t = ARTICLE_TITLES[slug] && ARTICLE_TITLES[slug][ctx.lang];
      if (!isInvalid(t)) node.name = t;
    }
  }

  // --- recurse ---
  for (const k in node) {
    if (k === '@type' || k === '@id' || k === '@context') continue;
    transformJsonLd(node[k], ctx);
  }
}

// Post-process the final HTML string: transform each ld+json block via
// JSON.parse/stringify + splice (never through the HTML parser, which mangles
// script content). Escapes '<' so no value can break out of the <script>.
function localizeJsonLdBlocks(html, ctx) {
  return html.replace(
    /(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
    (m, open, bodyRaw, close) => {
      let json;
      try { json = JSON.parse(bodyRaw); } catch (e) { return m; } // leave malformed untouched
      transformJsonLd(json, ctx);
      const out = JSON.stringify(json, null, 2).replace(/</g, '\\u003c');
      return `${open}\n${out}\n${close}`;
    }
  );
}

/* ---------- bake one page in one language ---------- */
function bake(lang, dict, page) {
  const cfg      = LANGS[lang];
  const pageSlug = page.out === 'index.html' ? '' : page.out.replace(/\.html$/, '');
  const url      = `${BASE}/${lang}/${pageSlug}`;
  const raw      = fs.readFileSync(path.join(ROOT, page.src), 'utf-8');

  const doctype = (raw.match(/^\s*<!doctype html>/i) || ['<!DOCTYPE html>'])[0].trim();
  const body    = raw.replace(/^\s*<!doctype html>\s*/i, '');

  const root = parse(body, {
    comment: true,
    blockTextElements: { script: true, style: true, noscript: true }
  });

  const htmlEl = root.querySelector('html');
  if (htmlEl) {
    htmlEl.setAttribute('lang', cfg.htmlLang);
    // tell the runtime i18n.js this page owns its canonical / og:url, so its
    // legacy ?lang= updateSEO() does not overwrite the baked /<lang>/ values.
    htmlEl.setAttribute('data-own-canonical', '');
  }

  // ---- data-i18n* attributes -> baked text (shared with the article builder) ----
  bakeText(root, dict);

  // ---- internal links -> same-language path ----
  root.querySelectorAll('a[href]').forEach(a => {
    a.setAttribute('href', rewriteHref(a.getAttribute('href'), lang));
  });

  // ---- RSS feed discovery link -> absolute same-language path ----
  root.querySelectorAll('link[rel="alternate"][type="application/rss+xml"]').forEach(l => {
    l.setAttribute('href', `/${lang}/insights/feed.xml`);
  });

  // ---- language toggle: turn buttons into real cross-language links ----
  bakeLangToggle(root, lang, pageSlug);

  // ---- <head> SEO ----
  // title / og:title / twitter:title from meta.<page>.title (covers the home
  // page, whose <title> has no data-i18n; redundant-safe for the rest).
  const title = page.meta ? get(dict, `meta.${page.meta}.title`) : undefined;
  if (!isInvalid(title)) {
    const titleEl = root.querySelector('title');
    if (titleEl) titleEl.set_content(escapeText(title));
    setMeta(root, 'meta[property="og:title"]', title);
    setMeta(root, 'meta[name="twitter:title"]', title);
  }
  // description / og:description / twitter:description are already baked by the
  // data-i18n-content loop (meta.<page>.desc).

  // canonical: set it if present, otherwise create it (main pages ship without
  // a static canonical — the runtime JS used to inject it).
  let canonical = root.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute('href', url);
  } else {
    const head2 = root.querySelector('head');
    if (head2) head2.insertAdjacentHTML('beforeend', `\n  <link rel="canonical" href="${url}">`);
  }

  const alt = {
    en: `${BASE}/en/${pageSlug}`,
    es: `${BASE}/es/${pageSlug}`,
    'x-default': `${BASE}/${XDEFAULT}/${pageSlug}`
  };
  root.querySelectorAll('link[rel="alternate"]').forEach(l => {
    const hl = l.getAttribute('hreflang');
    if (alt[hl]) l.setAttribute('href', alt[hl]);
  });

  setMeta(root, 'meta[property="og:url"]', url);
  setMeta(root, 'meta[property="og:locale"]', cfg.ogLocale);
  setMeta(root, 'meta[property="og:locale:alternate"]', cfg.ogAlt);

  // Indexable pages whose source ships without og:locale or Twitter Card tags
  // get them here (same values as Open Graph), so every page exposes complete
  // and language-correct social metadata. Existing tags are never duplicated.
  if (page.meta) {
    const desc = get(dict, `meta.${page.meta}.desc`);
    const ogImage = root.querySelector('meta[property="og:image"]');
    ensureMeta(root, 'property', 'og:locale', cfg.ogLocale, 'meta[property="og:url"]');
    ensureMeta(root, 'property', 'og:locale:alternate', cfg.ogAlt, 'meta[property="og:locale"]');
    const lastOg = root.querySelector('meta[property="og:image:type"]') ? 'meta[property="og:image:type"]' : 'meta[property="og:image"]';
    ensureMeta(root, 'name', 'twitter:card', 'summary_large_image', lastOg);
    ensureMeta(root, 'name', 'twitter:site', '@dynxlabs', 'meta[name="twitter:card"]');
    ensureMeta(root, 'name', 'twitter:title', title, 'meta[name="twitter:site"]');
    ensureMeta(root, 'name', 'twitter:description', desc, 'meta[name="twitter:title"]');
    ensureMeta(root, 'name', 'twitter:image', ogImage ? ogImage.getAttribute('content') : undefined, 'meta[name="twitter:description"]');
  }

  // Insights listing: bake the article cards so every article is linked from
  // the initial HTML (see insightCards above).
  if (page.meta === 'insights') {
    const grid = root.querySelector('#insights-grid');
    if (!grid) throw new Error('insights.html: #insights-grid not found');
    grid.set_content(`${insightCards(lang)}\n    `);
  }

  // The runtime i18n.js reads the language from the /<lang>/ route, so no
  // localStorage pin is needed here.

  // Localize Schema.org JSON-LD on the final HTML string (parser-safe).
  let outHtml = `${doctype}\n${root.toString()}`;
  outHtml = localizeJsonLdBlocks(outHtml, { lang, pageUrl: url, metaKey: page.meta, dict });

  const outPath = path.join(ROOT, lang, page.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  // Always write LF: the output must be byte-identical on every platform
  // (sources may be checked out with CRLF on Windows and LF in CI).
  fs.writeFileSync(outPath, outHtml.replace(/\r+\n?/g, '\n'));
  return path.relative(ROOT, outPath);
}

/* ---------- run ---------- */
let count = 0;
for (const lang of Object.keys(LANGS)) {
  const dict = loadLocale(lang);
  for (const page of PAGES) {
    if (!fs.existsSync(path.join(ROOT, page.src))) {
      console.warn(`  ! skipped (missing source): ${page.src}`);
      continue;
    }
    console.log(`  ✓ ${bake(lang, dict, page)}`);
    count++;
  }
}
console.log(`\n✅ Built ${count} page(s) across ${Object.keys(LANGS).length} language(s).`);
