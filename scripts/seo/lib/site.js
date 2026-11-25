/* ============================================================
   DYNX Labs — SEO audit: site model and shared helpers
   File: scripts/seo/lib/site.js

   Single description of what the built site MUST contain, derived
   from the real sources (insights/posts/*.json + the approved page
   list), never from the generated output. Every check compares the
   generated HTML against this model.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');

const ROOT     = path.join(__dirname, '..', '..', '..');
const BASE     = 'https://dynxlabs.com';
const LANGS    = ['es', 'en'];
const XDEFAULT = 'es';
const OG_LOCALE = { es: 'es_ES', en: 'en_US' };

// Approved main pages: slug -> meta.* key in locales/<lang>.json
const MAIN_PAGES = [
  { slug: '',           file: 'index.html',      meta: 'home' },
  { slug: 'products',   file: 'products.html',   meta: 'products' },
  { slug: 'research',   file: 'research.html',   meta: 'research' },
  { slug: 'faq',        file: 'faq.html',        meta: 'faq' },
  { slug: 'contact',    file: 'contact.html',    meta: 'contact' },
  { slug: 'leadership', file: 'leadership.html', meta: 'leadership' },
  { slug: 'insights',   file: 'insights.html',   meta: 'insights' }
];

// Hand-authored legal pages: dedicated per-language directory page (different slug per language).
// They are NOT part of the generated content model (no locale meta, not in the sitemap, not
// given rich JSON-LD); they are allowlisted for the stray-file check and recognised as valid,
// already-canonical link targets.
const LEGAL_PAGES = [
  { es: 'privacidad', en: 'privacy' },
  { es: 'terminos',   en: 'terms' }
];
// RSS feeds generated at /es/insights/feed.xml and /en/insights/feed.xml
// (not part of the generated page model, allowed in ARC-06).
const FEED_FILES = LANGS.map(lang => `${lang}/insights/feed.xml`);
const LEGAL_FILES = [];
const LEGAL_PATHS = new Set();
const LEGAL_ALTS = {}; // sitemap loc URL -> { es, en, x-default } (legal slug differs per language)
for (const lang of LANGS) for (const lg of LEGAL_PAGES) {
  LEGAL_FILES.push(`${lang}/${lg[lang]}/index.html`);
  LEGAL_PATHS.add(`/${lang}/${lg[lang]}/`);
}
for (const lg of LEGAL_PAGES) {
  const es = `${BASE}/es/${lg.es}/`, en = `${BASE}/en/${lg.en}/`;
  const alts = { es, en, 'x-default': XDEFAULT === 'es' ? es : en };
  LEGAL_ALTS[es] = alts; LEGAL_ALTS[en] = alts;
}

const GLOBAL_IDS = {
  organization: `${BASE}/#organization`,
  person:       `${BASE}/#person-arois`,
  website:      `${BASE}/#website`
};

const rel  = p => path.relative(ROOT, p).split(path.sep).join('/');
const abs  = p => path.join(ROOT, ...p.split('/'));
const read = p => fs.readFileSync(abs(p), 'utf-8');
const isFile = p => { try { return fs.statSync(abs(p)).isFile(); } catch (e) { return false; } };
const isDir  = p => { try { return fs.statSync(abs(p)).isDirectory(); } catch (e) { return false; } };

function loadPosts() {
  const dir = abs('insights/posts');
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => {
    const post = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
    return Object.assign({ _file: `insights/posts/${f}`, _fileSlug: f.replace(/\.json$/, '') }, post);
  });
}

function loadLocale(lang) { return JSON.parse(read(`locales/${lang}.json`)); }

/* The expected page set: 7 main × 2 + N articles × 2 (indexable) + 404 × 2 (noindex). */
function expectedPages(posts) {
  const pages = [];
  for (const lang of LANGS) {
    for (const m of MAIN_PAGES) {
      pages.push({ kind: 'main', lang, slug: m.slug, meta: m.meta, indexable: true,
                   file: `${lang}/${m.file}`, url: `${BASE}/${lang}/${m.slug}`, path: `/${lang}/${m.slug}` });
    }
    for (const p of posts) {
      pages.push({ kind: 'article', lang, slug: p.slug, post: p, indexable: true,
                   file: `${lang}/insights/${p.slug}/index.html`,
                   url: `${BASE}/${lang}/insights/${p.slug}/`, path: `/${lang}/insights/${p.slug}/` });
    }
    pages.push({ kind: '404', lang, slug: '404', indexable: false,
                 file: `${lang}/404.html`, url: `${BASE}/${lang}/404`, path: `/${lang}/404` });
  }
  return pages;
}

const other = lang => (lang === 'es' ? 'en' : 'es');

/* Parsed-document cache. Script/style bodies are kept as raw text. */
const _docs = new Map();
function doc(file) {
  if (!_docs.has(file)) {
    const html = read(file);
    const root = parse(html, { comment: false, blockTextElements: { script: true, style: true, noscript: true } });
    _docs.set(file, { html, root });
  }
  return _docs.get(file);
}

/* JSON-LD blocks, taken from the raw HTML (never through the DOM parser). */
function jsonLdBlocks(html) {
  const out = [];
  const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try { out.push({ ok: true, data: JSON.parse(m[1]) }); }
    catch (e) { out.push({ ok: false, error: e.message, raw: m[1].slice(0, 120) }); }
  }
  return out;
}

/* Walk every node of a JSON-LD value. */
function walkLd(node, fn, parentKey) {
  if (Array.isArray(node)) { node.forEach(n => walkLd(n, fn, parentKey)); return; }
  if (!node || typeof node !== 'object') return;
  fn(node, parentKey);
  for (const k of Object.keys(node)) if (k !== '@context') walkLd(node[k], fn, k);
}
const typesOf = node => [].concat((node && node['@type']) || []);

/* Resolve a site path the way GitHub Pages serves it.
   Returns { status, file }: status is one of
     'file'      exact file            (/assets/x.css, /en/products.html)
     'clean'     extensionless page    (/en/products  -> en/products.html)
     'index'     directory with slash  (/en/insights/x/ -> …/index.html)
     'redirect'  directory w/o slash   (/en/insights/x  -> 301 to …/x/)
     'missing'   nothing served (404)                                    */
function resolvePath(urlPath) {
  let p = urlPath.split('#')[0].split('?')[0];
  try { p = decodeURIComponent(p); } catch (e) { /* keep raw */ }
  p = p.replace(/^\/+/, '');
  if (p === '') return isFile('index.html') ? { status: 'index', file: 'index.html' } : { status: 'missing' };
  if (p.endsWith('/')) {
    const f = `${p}index.html`;
    return isFile(f) ? { status: 'index', file: f } : { status: 'missing' };
  }
  if (isFile(p)) return { status: 'file', file: p };
  if (isFile(`${p}.html`)) return { status: 'clean', file: `${p}.html` };
  if (isDir(p) && isFile(`${p}/index.html`)) return { status: 'redirect', file: `${p}/index.html` };
  return { status: 'missing' };
}

/* Same-origin test + normalization of an href/src found in a page.
   Returns null for external / non-http schemes, else the site path
   (with query and fragment preserved). */
function internalPath(href, pagePath) {
  if (href === undefined || href === null) return null;
  const h = String(href).trim();
  if (h === '' || h.startsWith('#')) return null;
  if (/^(mailto:|tel:|sms:|javascript:|data:|blob:)/i.test(h)) return null;
  const m = h.match(/^https?:\/\/([^\/?#]+)(.*)$/i);
  if (m) {
    if (!/^(www\.)?dynxlabs\.com$/i.test(m[1])) return null;
    return m[2] === '' ? '/' : m[2];
  }
  if (h.startsWith('//')) return null;                     // protocol-relative external
  if (h.startsWith('/')) return h;
  // relative reference: resolve against the page's directory
  const baseDir = pagePath.endsWith('/') ? pagePath : pagePath.replace(/[^\/]*$/, '');
  return new URL(h, `${BASE}${baseDir}`).pathname + (h.includes('?') ? '?' + h.split('?')[1] : '');
}

const norm = s => String(s === undefined || s === null ? '' : s).replace(/\s+/g, ' ').trim();

/* Text of a string that may contain markup / entities, for comparisons. */
function plain(s) {
  return norm(parse(`<div>${String(s === undefined || s === null ? '' : s)}</div>`).text);
}

function listFiles(dirRel) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(abs(d), { withFileTypes: true })) {
      const r = `${d}/${e.name}`;
      if (e.isDirectory()) walk(r); else out.push(r);
    }
  })(dirRel);
  return out.sort();
}

module.exports = {
  ROOT, BASE, LANGS, XDEFAULT, OG_LOCALE, MAIN_PAGES, GLOBAL_IDS, FEED_FILES, LEGAL_FILES, LEGAL_PATHS, LEGAL_ALTS,
  rel, abs, read, isFile, isDir, loadPosts, loadLocale, expectedPages, other,
  doc, jsonLdBlocks, walkLd, typesOf, resolvePath, internalPath, norm, plain, listFiles
};
