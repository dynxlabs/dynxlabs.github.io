/* SEO audit — 5.6 Internal links and local resources (static crawl of the generated HTML) */
'use strict';

const path = require('path');
const G = '6. Enlaces internos y recursos';

const STATIC_RE = /^\/(assets\/|favicon\.ico$|site\.webmanifest$|robots\.txt$|sitemap(_index)?\.xml$)/;

module.exports = function run(ctx, report) {
  const { S, pages, posts } = ctx;
  const existing = pages.filter(p => S.isFile(p.file));
  const byPath = new Map(pages.map(p => [p.path, p]));
  const cats = Object.keys(JSON.parse(S.read('insights/manifest.json')).categories || {});

  const broken = [], crossLang = [], legacy = [], dupPrefix = [], ext = [], params = [], to404 = [], nonCanonical = [], toggle = [], frags = [], res = [];
  const inbound = new Map(pages.filter(p => p.indexable).map(p => [p.path, new Set()]));
  let internal = 0, external = 0, resources = 0, toggles = 0;

  for (const p of existing) {
    const { root } = S.doc(p.file);

    /* ---------- <a href> ---------- */
    for (const a of root.querySelectorAll('a')) {
      const href = a.getAttribute('href');
      if (href === undefined || href === null) continue;
      const ip = S.internalPath(href, p.path);
      if (ip === null) { if (/^https?:/i.test(href.trim())) external++; continue; }
      internal++;
      const where = `${p.file} → ${href}`;
      const pathOnly = ip.split('#')[0].split('?')[0];
      const frag = ip.includes('#') ? ip.split('#')[1] : '';
      const cls = String(a.getAttribute('class') || '').split(/\s+/);
      const isToggle = cls.includes('lang-btn');

      if (STATIC_RE.test(pathOnly)) {
        if (S.resolvePath(pathOnly).status !== 'file') broken.push({ where, expected: 'archivo existente', found: 'no existe' });
        continue;
      }
      if (ip.includes('?')) params.push({ where, expected: 'enlace interno sin parámetros', found: ip });
      if (/^\/(es|en)\/(es|en)(\/|$)/.test(pathOnly)) { dupPrefix.push({ where, expected: 'un solo prefijo de idioma', found: pathOnly }); continue; }
      const m = pathOnly.match(/^\/(es|en)(\/|$)/);
      if (!m) { legacy.push({ where, expected: `ruta bajo /${p.lang}/`, found: pathOnly }); continue; }
      if (/\.html?$/.test(pathOnly)) { ext.push({ where, expected: 'URL sin extensión', found: pathOnly }); continue; }

      const r = S.resolvePath(pathOnly);
      if (r.status === 'missing') { broken.push({ where, expected: 'página existente', found: '404' }); continue; }
      if (r.status === 'redirect') { nonCanonical.push({ where, expected: `${pathOnly}/ (con barra final)`, found: pathOnly }); continue; }
      // Hand-authored legal pages are valid, already-canonical targets (served at /<lang>/<slug>/) but not in the generated model.
      if (S.LEGAL_PATHS.has(pathOnly)) continue;
      const target = byPath.get(pathOnly);
      if (!target) { nonCanonical.push({ where, expected: 'forma canónica de la URL', found: pathOnly }); continue; }
      if (target.kind === '404' && p.kind !== '404') to404.push({ where, expected: 'página real', found: 'página 404' });

      if (isToggle) {
        toggles++;
        const btnLang = a.getAttribute('data-lang');
        const tail = p.path.replace(`/${p.lang}/`, '');
        const want = `/${btnLang}/${tail}`;
        if (pathOnly !== want) toggle.push({ where, expected: `selector de idioma → ${want}`, found: pathOnly });
        if (a.getAttribute('hreflang') !== btnLang) toggle.push({ where, expected: `hreflang="${btnLang}"`, found: String(a.getAttribute('hreflang')) });
      } else if (m[1] !== p.lang) {
        crossLang.push({ where, expected: `enlace dentro de /${p.lang}/`, found: pathOnly });
      }

      if (target.indexable && target.path !== p.path && !isToggle && inbound.has(target.path)) inbound.get(target.path).add(p.path);

      // fragment must exist in the target (category hashes of the Insights listing are JS filters)
      if (frag && !(target.kind === 'main' && target.slug === 'insights' && cats.includes(decodeURIComponent(frag)))) {
        const troot = S.doc(target.file).root;
        const id = decodeURIComponent(frag);
        if (!troot.querySelectorAll('[id]').some(el => el.getAttribute('id') === id)) {
          frags.push({ where, expected: `id="${id}" en ${target.file}`, found: 'ancla inexistente' });
        }
      }
    }

    /* ---------- local resources ---------- */
    const refs = [];
    root.querySelectorAll('link').forEach(l => {
      const relv = String(l.getAttribute('rel') || '').toLowerCase();
      if (/stylesheet|icon|manifest|preload|modulepreload/.test(relv)) refs.push(['link', l.getAttribute('href')]);
    });
    root.querySelectorAll('script').forEach(s => { if (s.getAttribute('src')) refs.push(['script', s.getAttribute('src')]); });
    root.querySelectorAll('img').forEach(i => {
      refs.push(['img', i.getAttribute('src')]);
      String(i.getAttribute('srcset') || '').split(',').map(x => x.trim().split(/\s+/)[0]).filter(Boolean).forEach(u => refs.push(['img srcset', u]));
    });
    root.querySelectorAll('source').forEach(s => {
      if (s.getAttribute('src')) refs.push(['source', s.getAttribute('src')]);
      String(s.getAttribute('srcset') || '').split(',').map(x => x.trim().split(/\s+/)[0]).filter(Boolean).forEach(u => refs.push(['source srcset', u]));
    });
    root.querySelectorAll('video').forEach(v => { ['src', 'poster'].forEach(k => { if (v.getAttribute(k)) refs.push([`video ${k}`, v.getAttribute(k)]); }); });
    root.querySelectorAll('iframe').forEach(f => { if (f.getAttribute('src')) refs.push(['iframe', f.getAttribute('src')]); });

    for (const [kind, url] of refs) {
      if (!url) { res.push({ where: `${p.file} <${kind}>`, expected: 'URL de recurso', found: 'atributo vacío' }); continue; }
      const ip = S.internalPath(url, p.path);
      if (ip === null) continue;
      resources++;
      const r = S.resolvePath(ip);
      if (r.status !== 'file') res.push({ where: `${p.file} <${kind}> → ${url}`, expected: 'archivo local existente', found: r.status === 'missing' ? 'no existe' : `resuelve como ${r.status}` });
    }
  }

  /* ---------- CSS url() and web manifest icons ---------- */
  const cssProblems = []; let cssRefs = 0;
  const cssFiles = S.isDir('assets/css') ? S.listFiles('assets/css').filter(f => f.endsWith('.css')) : [];
  for (const f of cssFiles) {
    const css = S.read(f).replace(/\/\*[\s\S]*?\*\//g, '');
    const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g; let m;
    while ((m = re.exec(css))) {
      const u = m[2].trim();
      if (/^(data:|https?:|\/\/|#)/i.test(u)) continue;
      cssRefs++;
      const target = u.startsWith('/') ? u : '/' + path.posix.join(path.posix.dirname(f), u.split('?')[0].split('#')[0]);
      if (S.resolvePath(target).status !== 'file') cssProblems.push({ where: `${f} → url(${u})`, expected: 'archivo existente', found: 'no existe' });
    }
  }
  if (S.isFile('site.webmanifest')) {
    try {
      const wm = JSON.parse(S.read('site.webmanifest'));
      (wm.icons || []).forEach(i => { cssRefs++; if (S.resolvePath(i.src.startsWith('/') ? i.src : '/' + i.src).status !== 'file') cssProblems.push({ where: `site.webmanifest → ${i.src}`, expected: 'icono existente', found: 'no existe' }); });
    } catch (e) { cssProblems.push({ where: 'site.webmanifest', expected: 'JSON válido', found: e.message }); }
  }

  /* ---------- discoverability without JavaScript ---------- */
  const orphans = [...inbound.entries()].filter(([, s]) => s.size === 0)
    .map(([pth]) => ({ where: pth, expected: 'al menos 1 enlace estático entrante desde otra página', found: '0 (solo accesible por sitemap o JavaScript)' }));
  const listing = [];
  for (const lang of S.LANGS) {
    const lp = byPath.get(`/${lang}/insights`);
    if (!lp || !S.isFile(lp.file)) continue;
    const hrefs = new Set(S.doc(lp.file).root.querySelectorAll('a').map(a => (S.internalPath(a.getAttribute('href'), lp.path) || '').split('#')[0]));
    posts.filter(x => !hrefs.has(`/${lang}/insights/${x.slug}/`))
      .forEach(x => listing.push({ where: lp.file, expected: `enlace estático a /${lang}/insights/${x.slug}/`, found: 'ausente en el HTML inicial' }));
  }

  report.check(G, 'LNK-01', 'Sin enlaces internos rotos (destino inexistente)', internal, broken);
  report.check(G, 'LNK-02', 'Sin enlaces cruzados de idioma (ES→EN o EN→ES) fuera del selector', internal, crossLang);
  report.check(G, 'LNK-03', 'Sin enlaces a rutas legacy (sin prefijo de idioma)', internal, legacy);
  report.check(G, 'LNK-04', 'Sin prefijos de idioma duplicados (/es/es, /en/es…)', internal, dupPrefix);
  report.check(G, 'LNK-05', 'Sin extensiones .html en enlaces internos', internal, ext);
  report.check(G, 'LNK-06', 'Sin parámetros (?lang=…) en enlaces internos', internal, params);
  report.check(G, 'LNK-07', 'Sin enlaces a páginas 404', internal, to404);
  report.check(G, 'LNK-08', 'Enlaces en forma canónica (sin redirecciones por barra final)', internal, nonCanonical);
  report.check(G, 'LNK-09', 'Selector de idioma enlaza a la página equivalente', toggles, toggle);
  report.check(G, 'LNK-10', 'Anclas (#id) existentes en la página de destino', internal, frags, 'WARNING');
  report.check(G, 'LNK-11', 'Recursos locales de las páginas existen (CSS, JS, imágenes, iconos)', resources, res);
  report.check(G, 'LNK-12', 'Referencias url() de CSS e iconos del manifest existen', cssRefs, cssProblems);
  report.check(G, 'LNK-13', 'Ninguna página indexable huérfana (enlaces estáticos entrantes)', inbound.size, orphans);
  report.check(G, 'LNK-14', 'El listado de Insights enlaza estáticamente a todos los artículos', posts.length * S.LANGS.length, listing);

  /* ---------- JavaScript-built main menu (assets/js/megamenu.js) ----------
     Its links are not in the static HTML, so the crawl above cannot see them.
     These checks run the menu's own href-localization function and verify it
     against the build's rewriteHref and against the generated pages. */
  const mnuFn = [], mnuTargets = [], mnuGuards = [];
  let mnuCases = 0, mnuLinks = 0;
  if (S.isFile('assets/js/megamenu.js')) {
    const src = S.read('assets/js/megamenu.js');
    const { rewriteHref } = require('../../rewrite-href.js');
    let fnSrc = null;
    const at = src.indexOf('function localizeHref(');
    if (at >= 0) {
      let depth = 0;
      for (let i = src.indexOf('{', at); i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) { fnSrc = src.slice(at, i + 1); break; }
      }
    }
    if (!fnSrc) mnuGuards.push({ where: 'assets/js/megamenu.js', expected: 'función localizeHref', found: 'ausente' });
    else {
      const sandbox = {};
      require('vm').runInNewContext(`${fnSrc}\n;this.f = localizeHref;`, sandbox, { timeout: 2000 });
      const data = [...new Set([...src.matchAll(/\bh:\s*'([^']+)'/g)].map(m => m[1]))]
        .filter(h => h.startsWith('/') && h !== '/insights/')
        .concat(posts.map(x => `/insights/${x.slug}`));
      const edge = ['/', '/contact', '/es/products', '/en/', '/en/insights/x/', '/assets/css/styles.css', '/products?x=1', '//cdn.example.com/x', 'https://example.com/', '#top', ''];
      for (const lang of S.LANGS) {
        for (const h of data.concat(edge)) {
          mnuCases++;
          let want = rewriteHref(h, lang);
          if (/^\/(es|en)\/insights\/[^\/#?]+$/.test(want || '')) want += '/';
          if (h.startsWith('//')) want = h;
          const got = sandbox.f(h, lang);
          if (got !== want) mnuFn.push({ where: `megamenu.js localizeHref("${h}", "${lang}")`, expected: String(want), found: String(got) });
          if (sandbox.f(h, null) !== h) mnuFn.push({ where: `megamenu.js localizeHref("${h}", null)`, expected: 'sin cambios en páginas legacy', found: String(sandbox.f(h, null)) });
        }
        for (const h of data) {
          mnuLinks++;
          const out = sandbox.f(h, lang);
          const pathOnly = out.split('#')[0], frag = out.includes('#') ? out.split('#')[1] : '';
          const target = byPath.get(pathOnly);
          if (!target || !target.indexable || target.lang !== lang || !S.isFile(target.file)) {
            mnuTargets.push({ where: `menú (${lang}): ${h} → ${out}`, expected: `página canónica /${lang}/ existente`, found: S.resolvePath(pathOnly).status });
          } else if (frag && !(target.slug === 'insights' && cats.includes(frag)) &&
                     !S.doc(target.file).root.querySelectorAll('[id]').some(el => el.getAttribute('id') === frag)) {
            mnuTargets.push({ where: `menú (${lang}): ${h} → ${out}`, expected: `id="${frag}" en ${target.file}`, found: 'ancla inexistente' });
          }
        }
      }
    }
    if (/href="\/(?!assets\/)/.test(src)) mnuGuards.push({ where: 'assets/js/megamenu.js', expected: 'todos los href internos pasan por H()', found: 'href interno literal' });
    if (/esc\(it\.h\)/.test(src)) mnuGuards.push({ where: 'assets/js/megamenu.js', expected: 'esc(H(it.h))', found: 'esc(it.h) sin localizar' });
    if (!/function curLang\(\)\s*\{\s*const r = routeLang\(\);\s*if \(r\) return r;/.test(src)) mnuGuards.push({ where: 'assets/js/megamenu.js', expected: 'curLang() prioriza el idioma de la ruta', found: 'idioma tomado solo de localStorage' });
    if (!/a\.lang-btn\[data-lang=/.test(src)) mnuGuards.push({ where: 'assets/js/megamenu.js', expected: 'el selector móvil reutiliza el enlace del selector de cabecera', found: 'ausente' });
  }
  report.check(G, 'MNU-01', 'El menú JavaScript localiza los enlaces igual que el build (localizeHref = rewriteHref)', mnuCases, mnuFn);
  report.check(G, 'MNU-02', 'Destinos del menú JavaScript existen en ES y EN (página canónica y ancla)', mnuLinks, mnuTargets);
  report.check(G, 'MNU-03', 'El menú JavaScript toma el idioma de la ruta y no emite enlaces legacy', 4, mnuGuards);

  report.count('Enlaces del menú JavaScript verificados', mnuLinks);
  report.count('Enlaces internos rastreados', internal);
  report.count('Enlaces externos (no rastreados)', external);
  report.count('Recursos locales verificados', resources + cssRefs);
};
