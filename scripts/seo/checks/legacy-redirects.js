/* SEO audit — 6. Legacy redirects: static consistency with the approved Phase 5.2 design.

   Source of truth: .github/seo/phase-5.2/PHASE-5.2-LEGACY-REDIRECTS-FINAL.md
   This check never contacts Cloudflare and never simulates HTTP. It only
   detects divergence between the approved document, slugs.txt, the source
   posts, the generated build and the sitemap. */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const G = '9. Redirecciones legacy (consistencia estática con Fase 5.2)';

const DIR = '.github/seo/phase-5.2';
const DOC = `${DIR}/PHASE-5.2-LEGACY-REDIRECTS-FINAL.md`;

// Approved deliverables. A change here must be a deliberate, reviewed decision.
const PINNED = {
  'PHASE-5.2-LEGACY-REDIRECTS-FINAL.md': '6a1d1c05071f5e13a92a067674a6807742a4728b78484ffaa2def61dd7a5f823',
  'slugs.txt':                           '277a7dc8765d7a92957021db44a65b9a313786f0e5cdaecd26bfb9b1a1dc3527',
  'validate_redirects.ps1':              'e44a3a10e1e3a38bc487001cf095936b3a6bdef64333f702bc572b8c7b661c40',
  'validate_redirects.sh':               '7e5feffddaa641e495dd3ddf3fccf30238da877d6821c44311f0cfcb8b53a0b3'
};

const HOST       = 'staging.tudominio';                       // approved placeholder
const HOST_COND  = `(http.host eq "${HOST}")`;
const LANG_COND  = 'any(http.request.uri.args["lang"][*] == "es")';
const MAX_EXPR   = 4096;
const RULES = [
  { n: 1, set: 'B', lang: 'es', dest: `concat("https://${HOST}/es", http.request.uri.path, "/")` },
  { n: 2, set: 'A', lang: 'es', dest: `concat("https://${HOST}/es", http.request.uri.path)` },
  { n: 3, set: 'B', lang: 'en', dest: `concat("https://${HOST}/en", http.request.uri.path, "/")` },
  { n: 4, set: 'A', lang: 'en', dest: `concat("https://${HOST}/en", http.request.uri.path)` }
];

/* First fenced code block that follows a heading line starting with `marker`. */
function blockAfter(md, marker) {
  const at = md.indexOf(marker);
  if (at < 0) return null;
  const m = md.slice(at).match(/```[a-z]*\r?\n([\s\S]*?)\r?\n```/);
  return m ? m[1] : null;
}
/* The n-th fenced block (0-based) after `marker`, bounded by the next heading of the same level. */
function blocksIn(md, marker, stop) {
  const at = md.indexOf(marker);
  if (at < 0) return [];
  let seg = md.slice(at + marker.length);
  const end = seg.search(stop);
  if (end >= 0) seg = seg.slice(0, end);
  return [...seg.matchAll(/```[a-z]*\r?\n([\s\S]*?)\r?\n```/g)].map(m => m[1]);
}
const lines = s => String(s || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
const sameSet = (a, b) => a.length === b.length && new Set(a).size === a.length && a.every(x => b.includes(x));
const diff = (got, want, where) => want.filter(x => !got.includes(x)).map(x => ({ where, expected: x, found: 'ausente' }))
  .concat(got.filter(x => !want.includes(x)).map(x => ({ where, expected: 'solo rutas aprobadas', found: x })));

module.exports = function run(ctx, report) {
  const { S, posts, pages } = ctx;

  /* LGC-01 deliverables present and byte-identical to the approved versions */
  const hashProblems = [];
  for (const f of Object.keys(PINNED)) {
    const p = `${DIR}/${f}`;
    if (!S.isFile(p)) { hashProblems.push({ where: p, expected: 'entregable presente', found: 'no existe' }); continue; }
    const h = crypto.createHash('sha256').update(fs.readFileSync(S.abs(p))).digest('hex');
    if (h !== PINNED[f]) hashProblems.push({ where: p, expected: `SHA256 ${PINNED[f]}`, found: h });
  }
  report.check(G, 'LGC-01', 'Entregables de la Fase 5.2 presentes e idénticos a la versión aprobada (SHA256)', Object.keys(PINNED).length, hashProblems);
  if (!S.isFile(DOC)) {
    report.note(G, 'LGC-02', 'Documento aprobado no disponible: no se puede comprobar la consistencia', 'FAIL', DOC);
    return;
  }

  const md = S.read(DOC);
  const sitemapLocs = new Set((S.read('sitemap.xml').match(/<loc>([^<]+)<\/loc>/g) || []).map(x => x.replace(/<\/?loc>/g, '')));

  /* The legacy article set is FROZEN in slugs.txt: the articles that existed under the
     old /insights/<slug> scheme. Articles published after the migration are born at
     /es/ and /en/ and need no legacy rule (Phase 5.2, limitation 6), so they are allowed
     to exist without being in slugs.txt. What must never happen is a legacy slug
     disappearing or being renamed, because its redirect would point to a 404. */
  const slugTxt = S.isFile(`${DIR}/slugs.txt`) ? lines(S.read(`${DIR}/slugs.txt`)) : [];
  const slugs = slugTxt.slice().sort();
  const mainPaths = S.MAIN_PAGES.map(m => `/${m.slug}`);
  const wantA = mainPaths.concat(slugs.map(s => `/insights/${s}/`));
  const wantB = slugs.map(s => `/insights/${s}`);
  const postSlugs = posts.map(p => p.slug);

  /* LGC-02 every legacy slug still exists: source post, ES/EN build and sitemap */
  const slugProblems = [];
  if (slugTxt.length !== 29) slugProblems.push({ where: 'slugs.txt', expected: '29 slugs legacy', found: `${slugTxt.length}` });
  if (new Set(slugTxt).size !== slugTxt.length) slugProblems.push({ where: 'slugs.txt', found: 'slugs duplicados' });
  for (const s of slugs) {
    if (!postSlugs.includes(s)) slugProblems.push({ where: `insights/posts/${s}.json`, expected: 'artículo legacy presente', found: 'no existe (¿eliminado o renombrado?)' });
    for (const lang of S.LANGS) {
      if (!S.isFile(`${lang}/insights/${s}/index.html`)) slugProblems.push({ where: `${lang}/insights/${s}/index.html`, expected: 'página generada', found: 'no existe' });
      if (!sitemapLocs.has(`${S.BASE}/${lang}/insights/${s}/`)) slugProblems.push({ where: 'sitemap.xml', expected: `${S.BASE}/${lang}/insights/${s}/`, found: 'ausente' });
    }
  }
  report.check(G, 'LGC-02', 'Los 29 slugs legacy (slugs.txt) siguen existiendo: artículo fuente, build ES/EN y sitemap', slugTxt.length, slugProblems);
  report.count('Artículos posteriores a la migración (sin regla legacy, por diseño)', postSlugs.filter(s => !slugs.includes(s)).length);

  /* LGC-03 / LGC-04 sets A and B in the document */
  const docA = lines(blockAfter(md, '### 2.1 Conjunto A'));
  const docB = lines(blockAfter(md, '### 2.2 Conjunto B'));
  report.check(G, 'LGC-03', 'Conjunto A del documento: 36 rutas (raíz, 6 principales, 29 artículos con barra)', docA.length,
    diff(docA, wantA, 'Conjunto A').concat(docA.length !== 36 ? [{ where: 'Conjunto A', expected: '36 rutas', found: `${docA.length}` }] : []));
  report.check(G, 'LGC-04', 'Conjunto B del documento: 29 rutas (artículos sin barra)', docB.length,
    diff(docB, wantB, 'Conjunto B').concat(docB.length !== 29 ? [{ where: 'Conjunto B', expected: '29 rutas', found: `${docB.length}` }] : []));

  /* LGC-05 the four Single Redirect expressions, in order */
  const exprProblems = [];
  const sets = { A: wantA, B: wantB };
  if (blockAfter(md, 'Condición de idioma español (literal)') !== LANG_COND) {
    exprProblems.push({ where: 'condición de idioma', expected: LANG_COND, found: String(blockAfter(md, 'Condición de idioma español (literal)')) });
  }
  const ruleOrder = [...md.matchAll(/^### Prioridad (\d) —/gm)].map(m => Number(m[1]));
  if (JSON.stringify(ruleOrder) !== '[1,2,3,4]') exprProblems.push({ where: 'orden de reglas', expected: 'Prioridad 1, 2, 3, 4', found: ruleOrder.join(', ') });
  const destProblems = [];
  for (const r of RULES) {
    const b = blocksIn(md, `### Prioridad ${r.n} —`, /\n### |\n---/);
    const where = `Prioridad ${r.n}`;
    if (b.length !== 2) { exprProblems.push({ where, expected: '2 bloques (expresión y destino)', found: `${b.length}` }); continue; }
    const [expr, dest] = b;
    const wantExpr = `${HOST_COND} and ${r.lang === 'es' ? LANG_COND + ' and ' : ''}(http.request.uri.path in {${sets[r.set].map(x => `"${x}"`).join(' ')}})`;
    const m = expr.match(/\(http\.request\.uri\.path in \{([^}]*)\}\)$/);
    const got = m ? [...m[1].matchAll(/"([^"]*)"/g)].map(x => x[1]) : [];
    if (!expr.startsWith(HOST_COND + ' and ')) exprProblems.push({ where, expected: `empieza por ${HOST_COND}`, found: expr.slice(0, 60) });
    if (expr.includes(LANG_COND) !== (r.lang === 'es')) exprProblems.push({ where, expected: r.lang === 'es' ? 'incluye la condición de idioma' : 'sin condición de idioma (regla terminal de inglés)', found: 'lo contrario' });
    if (!sameSet(got, sets[r.set])) diff(got, sets[r.set], `${where} (conjunto ${r.set})`).forEach(x => exprProblems.push(x));
    if (expr !== wantExpr) exprProblems.push({ where, expected: 'expresión idéntica a la reconstruida desde los artículos fuente', found: 'texto distinto' });
    if (expr.length > MAX_EXPR) exprProblems.push({ where, expected: `≤ ${MAX_EXPR} caracteres`, found: `${expr.length}` });
    if (/\\\[|\\\*|\]\(http/.test(expr + dest)) exprProblems.push({ where, expected: 'sin barras invertidas ni sintaxis Markdown', found: 'escape o enlace Markdown' });
    if (dest !== r.dest) destProblems.push({ where, expected: r.dest, found: dest });
  }
  report.check(G, 'LGC-05', 'Cuatro expresiones Single Redirect: orden, hostname, idioma, conjuntos y longitud', RULES.length, exprProblems);
  report.check(G, 'LGC-06', 'Cuatro destinos ES/EN literales', RULES.length, destProblems);

  /* LGC-07 Bulk list (7 .html entries) and Bulk rule */
  const bulkProblems = [];
  const csv = lines(blockAfter(md, 'Formato CSV para importar la lista'));
  const wantBulk = S.MAIN_PAGES.map(m => ({ src: `${HOST}/${m.file}`, dst: `https://${HOST}/en/${m.slug}`, legacy: m.file }));
  if (csv.length !== 7) bulkProblems.push({ where: 'lista Bulk', expected: '7 entradas', found: `${csv.length}` });
  const gotBulk = csv.map(l => l.split(','));
  for (const w of wantBulk) {
    const row = gotBulk.find(c => c[0] === w.src);
    if (!row) { bulkProblems.push({ where: 'lista Bulk', expected: w.src, found: 'ausente' }); continue; }
    if (row[1] !== w.dst) bulkProblems.push({ where: w.src, expected: w.dst, found: row[1] });
    if (row.slice(2).join(',') !== '301,TRUE,FALSE,FALSE,FALSE') bulkProblems.push({ where: w.src, expected: '301, preserve query ON, subdominios OFF, subpath OFF, sufijo OFF', found: row.slice(2).join(',') });
    if (!S.isFile(w.legacy)) bulkProblems.push({ where: w.legacy, expected: 'página legacy .html aún presente en la raíz', found: 'no existe' });
  }
  gotBulk.filter(c => !wantBulk.some(w => w.src === c[0])).forEach(c => bulkProblems.push({ where: 'lista Bulk', expected: 'solo las 7 .html aprobadas', found: c[0] }));
  const bulkRule = blockAfter(md, '### 4.2 Regla Bulk Redirect');
  const bulkExpr = blocksIn(md, '### 4.2 Regla Bulk Redirect', /\n## /)[0];
  const wantBulkExpr = `${HOST_COND} and (http.request.full_uri in $dynx_html_staging)`;
  if ((bulkExpr || bulkRule) !== wantBulkExpr) bulkProblems.push({ where: 'regla Bulk', expected: wantBulkExpr, found: String(bulkExpr || bulkRule) });
  report.check(G, 'LGC-07', 'Siete entradas Bulk Redirect (.html → canónica EN) y regla Bulk asociada', 7, bulkProblems);

  /* LGC-08 every destination the rules can produce is a canonical URL of the sitemap */
  const destSet = [];
  for (const r of RULES) for (const pth of sets[r.set]) destSet.push({ rule: r.n, from: pth, to: `${S.BASE}/${r.lang}${pth}${r.set === 'B' ? '/' : ''}` });
  wantBulk.forEach(w => destSet.push({ rule: 'Bulk', from: `/${w.legacy}`, to: w.dst.replace(`https://${HOST}`, S.BASE) }));
  report.check(G, 'LGC-08', 'Todo destino posible de las reglas es una URL canónica del sitemap y una página generada', destSet.length,
    destSet.filter(d => !sitemapLocs.has(d.to) || !pages.some(p => p.url === d.to && S.isFile(p.file)))
      .map(d => ({ where: `regla ${d.rule}: ${d.from}`, expected: 'destino en sitemap y generado', found: d.to })));

  /* LGC-09 completeness: every canonical URL that had a legacy equivalent (7 main pages
     and the 29 legacy articles, in both languages = 72) is produced by at least one rule */
  const reached = new Set(destSet.map(d => d.to));
  const legacyCanonicals = [];
  for (const lang of S.LANGS) {
    S.MAIN_PAGES.forEach(m => legacyCanonicals.push(`${S.BASE}/${lang}/${m.slug}`));
    slugs.forEach(s => legacyCanonicals.push(`${S.BASE}/${lang}/insights/${s}/`));
  }
  report.check(G, 'LGC-09', 'Las 72 URLs canónicas con equivalente legacy tienen al menos una regla que las alcanza', legacyCanonicals.length,
    legacyCanonicals.filter(u => !reached.has(u)).map(u => ({ where: u, expected: 'alcanzable desde una URL legacy', found: 'ninguna regla la produce' })));

  /* LGC-10 no loops / no chains by construction */
  const legacyPaths = new Set(wantA.concat(wantB).concat(wantBulk.map(w => `/${w.legacy}`)));
  report.check(G, 'LGC-10', 'Sin bucles ni cadenas por construcción (ningún destino es a su vez una ruta de origen)', destSet.length,
    destSet.filter(d => legacyPaths.has(d.to.replace(S.BASE, ''))).map(d => ({ where: `regla ${d.rule}: ${d.from}`, expected: 'destino fuera de los conjuntos de origen', found: d.to })));

  /* LGC-11 the placeholder hostname is intact (no real domain slipped in) */
  const hostProblems = [];
  [...md.matchAll(/http\.host eq "([^"]+)"/g)].filter(m => m[1] !== HOST).forEach(m => hostProblems.push({ where: DOC, expected: `"${HOST}" (marcador)`, found: m[1] }));
  [...md.matchAll(/concat\("https:\/\/([^/"]+)/g)].filter(m => m[1] !== HOST).forEach(m => hostProblems.push({ where: DOC, expected: `"${HOST}" (marcador)`, found: m[1] }));
  report.check(G, 'LGC-11', 'Las reglas siguen usando el marcador de hostname de staging (sin dominio real)', 1, hostProblems);

  /* What can only be verified with a staging hostname and active rules */
  const NT = [
    ['LGC-NT1', 'Las 4 expresiones y la regla Bulk se guardan sin error en el editor de Cloudflare'],
    ['LGC-NT2', 'Código 301 y encabezado Location reales de cada URL legacy'],
    ['LGC-NT3', 'Destino final 200, un solo salto y ausencia de bucles con tráfico real'],
    ['LGC-NT4', 'Comportamiento real de lang ausente, lang=ES, Lang=es, lang=%65s y parámetros repetidos'],
    ['LGC-NT5', 'Coincidencia de las entradas Bulk cuando la URL trae query string'],
    ['LGC-NT6', 'Respuesta del origen de staging para /products/ y rutas inexistentes']
  ];
  NT.forEach(([id, t]) => report.note(G, id, t, 'NOT TESTED', 'Requiere dominio de staging con las reglas activas (validate_redirects.ps1 / .sh).'));

  report.count('Rutas legacy cubiertas (A + B + Bulk)', wantA.length + wantB.length + wantBulk.length);
  report.count('Destinos de redirección verificados contra el sitemap', destSet.length);
};
