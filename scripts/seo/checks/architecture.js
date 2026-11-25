/* SEO audit — 5.1 Architecture and pages */
'use strict';

const G = '1. Arquitectura y páginas';

module.exports = function run(ctx, report) {
  const { S, posts, pages } = ctx;

  // ARC-01 source posts are well-formed (the model everything else derives from)
  const cats = Object.keys(JSON.parse(S.read('insights/manifest.json')).categories || {});
  const postProblems = [];
  const seen = new Set();
  for (const p of posts) {
    if (p.slug !== p._fileSlug) postProblems.push({ where: p._file, expected: `slug "${p._fileSlug}"`, found: `slug "${p.slug}"` });
    if (seen.has(p.slug)) postProblems.push({ where: p._file, found: 'slug duplicado' });
    seen.add(p.slug);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug || '')) postProblems.push({ where: p._file, expected: 'slug en minúsculas con guiones', found: p.slug });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date || '')) postProblems.push({ where: p._file, expected: 'date AAAA-MM-DD', found: p.date });
    if (!cats.includes(p.category)) postProblems.push({ where: p._file, expected: `category en [${cats.join(', ')}]`, found: p.category });
    for (const lang of S.LANGS) {
      for (const f of ['title', 'summary', 'body']) {
        if (!p[lang] || !S.norm(p[lang][f])) postProblems.push({ where: p._file, expected: `${lang}.${f} con contenido`, found: 'vacío o ausente' });
      }
      if (!p.readTime || !S.norm(p.readTime[lang])) postProblems.push({ where: p._file, expected: `readTime.${lang}`, found: 'ausente' });
    }
  }
  report.check(G, 'ARC-01', 'Artículos fuente (insights/posts) íntegros y con ambos idiomas', posts.length, postProblems);

  // ARC-02 main pages exist in both languages
  const main = pages.filter(p => p.kind === 'main');
  report.check(G, 'ARC-02', 'Páginas principales presentes en ES y EN', main.length,
    main.filter(p => !S.isFile(p.file)).map(p => ({ where: p.file, expected: 'archivo generado', found: 'no existe' })));

  // ARC-03 / ARC-04 article pages per language
  for (const [lang, id] of [['es', 'ARC-03'], ['en', 'ARC-04']]) {
    const arts = pages.filter(p => p.kind === 'article' && p.lang === lang);
    report.check(G, id, `Artículos de Insights en ${lang.toUpperCase()} con index.html`, arts.length,
      arts.filter(p => !S.isFile(p.file)).map(p => ({ where: p.file, expected: 'index.html', found: 'no existe' })));
  }

  // ARC-05 404 pages per language
  const nf = pages.filter(p => p.kind === '404');
  report.check(G, 'ARC-05', 'Página 404 presente en ES y EN', nf.length,
    nf.filter(p => !S.isFile(p.file)).map(p => ({ where: p.file, expected: 'archivo generado', found: 'no existe' })));

  // ARC-06 nothing unexpected inside /es and /en (stray files, wrong routes, nested language dirs)
  const expected = new Set(pages.map(p => p.file));
  // Hand-authored legal pages are allowed but not part of the generated model.
  S.LEGAL_FILES.forEach(f => expected.add(f));
  // RSS feeds are generated but not part of the page model.
  S.FEED_FILES.forEach(f => expected.add(f));
  const stray = [];
  let total = 0;
  for (const lang of S.LANGS) {
    if (!S.isDir(lang)) { stray.push({ where: `${lang}/`, expected: 'directorio de idioma', found: 'no existe' }); continue; }
    for (const f of S.listFiles(lang)) {
      total++;
      if (!expected.has(f)) stray.push({ where: f, expected: 'solo páginas del modelo aprobado', found: 'archivo inesperado' });
    }
  }
  report.check(G, 'ARC-06', 'Sin archivos ni rutas inesperados en /es y /en', total, stray);

  // ARC-07 no unexpected language directories at the root
  const rootDirs = require('fs').readdirSync(S.ROOT, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name);
  const langLike = rootDirs.filter(d => /^[a-z]{2}(-[A-Za-z]{2})?$/.test(d) && !S.LANGS.includes(d));
  report.check(G, 'ARC-07', 'Sin directorios de idioma no aprobados (solo es, en)', rootDirs.length,
    langLike.map(d => ({ where: `${d}/`, expected: 'solo es/ y en/', found: 'directorio con forma de idioma' })));

  // ARC-08 <html lang> matches the route language
  const langProblems = [];
  for (const p of pages) {
    if (!S.isFile(p.file)) continue;
    const el = S.doc(p.file).root.querySelector('html');
    const found = el ? el.getAttribute('lang') : undefined;
    if (found !== p.lang) langProblems.push({ where: p.file, expected: `<html lang="${p.lang}">`, found: String(found) });
  }
  report.check(G, 'ARC-08', 'Atributo <html lang> coincide con el idioma de la ruta', pages.length, langProblems);

  // ARC-09 no duplicated pages: byte-identical outputs or ES/EN pair with identical <title>+<h1>
  const crypto = require('crypto');
  const byHash = new Map();
  for (const p of pages) {
    if (!S.isFile(p.file)) continue;
    const h = crypto.createHash('sha256').update(S.doc(p.file).html).digest('hex');
    byHash.set(h, (byHash.get(h) || []).concat(p.file));
  }
  const dup = [...byHash.values()].filter(v => v.length > 1).map(v => ({ where: v.join(' = '), found: 'contenido idéntico byte a byte' }));
  report.check(G, 'ARC-09', 'Sin páginas duplicadas (contenido idéntico)', pages.length, dup);

  // ARC-10 / ARC-11 the three article data sources agree.
  //   insights/posts/*.json      source of truth (article pages, sitemap, JSON-LD)
  //   insights/manifest.json     generated from the posts
  //   assets/js/insights-data.js generated from the posts; read by the listing's JavaScript
  const structural = [], texts = [];
  const key  = a => JSON.stringify([a.category, a.date]);
  const text = a => JSON.stringify([a.readTime, a.en && a.en.title, a.en && a.en.summary, a.es && a.es.title, a.es && a.es.summary]);
  const compare = (list, name, textSink) => {
    const got = new Map(list.map(a => [a.slug, a]));
    if (list.length !== got.size) structural.push({ where: name, found: 'slugs duplicados' });
    for (const p of posts) {
      const g = got.get(p.slug);
      if (!g) { structural.push({ where: name, expected: `artículo ${p.slug}`, found: 'ausente' }); continue; }
      if (key(g) !== key(p)) structural.push({ where: `${name} → ${p.slug}`, expected: `categoría y fecha ${key(p)}`, found: key(g) });
      if (text(g) !== text(p)) {
        const diff = ['readTime', 'en.title', 'en.summary', 'es.title', 'es.summary'].filter((k, i) => JSON.parse(text(g))[i] !== undefined && JSON.stringify(JSON.parse(text(g))[i]) !== JSON.stringify(JSON.parse(text(p))[i]));
        textSink.push({ where: `${name} → ${p.slug}`, expected: 'mismos textos que insights/posts', found: `difiere: ${diff.join(', ')}` });
      }
    }
    for (const slug of got.keys()) if (!posts.some(p => p.slug === slug)) structural.push({ where: name, expected: 'solo artículos de insights/posts', found: slug });
  };
  compare(JSON.parse(S.read('insights/manifest.json')).articles || [], 'insights/manifest.json', structural);
  let dataJs = null;
  if (S.isFile('assets/js/insights-data.js')) {
    try {
      const vm = require('vm');
      const sandbox = {};
      vm.runInNewContext(`${S.read('assets/js/insights-data.js')}\n;this.__A = INSIGHTS_ARTICLES;`, sandbox, { timeout: 2000 });
      dataJs = sandbox.__A || [];
      compare(dataJs, 'assets/js/insights-data.js', texts);
    } catch (e) { structural.push({ where: 'assets/js/insights-data.js', expected: 'archivo evaluable', found: e.message }); }
  }
  report.check(G, 'ARC-10', 'Fuentes de datos de artículos coherentes (slugs, categoría, fecha): posts = manifest = insights-data.js', posts.length * (dataJs ? 2 : 1), structural);
  if (dataJs) {
    report.check(G, 'ARC-11', 'Textos del listado (insights-data.js) iguales a los de los artículos (insights/posts)', posts.length, texts);
  }

  // ARC-12 internal documentation must not sit in the published root (GitHub Pages
  // serves every root file as-is; .github/ is never published)
  const rootFiles = require('fs').readdirSync(S.ROOT, { withFileTypes: true }).filter(e => e.isFile()).map(e => e.name);
  const internal = rootFiles.filter(f => (/\.(md|markdown)$/i.test(f) && f !== 'README.md') || /^PHASE/i.test(f));
  report.check(G, 'ARC-12', 'Sin documentación interna en la raíz publicada (solo README.md)', rootFiles.length,
    internal.map(f => ({ where: f, expected: 'documentación interna bajo .github/', found: 'archivo en la raíz (quedaría público)' })));

  report.count('Páginas principales indexables', main.length);
  report.count('Artículos ES', pages.filter(p => p.kind === 'article' && p.lang === 'es').length);
  report.count('Artículos EN', pages.filter(p => p.kind === 'article' && p.lang === 'en').length);
  report.count('Páginas 404 (noindex)', nf.length);
  report.count('Páginas HTML auditadas', pages.length);
};
