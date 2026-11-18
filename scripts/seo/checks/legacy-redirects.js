/* SEO audit — 9. Legacy redirects: the PRODUCTION configuration of Phase 5.2.

   Source of truth: .github/seo/phase-5.2/production/
     REGLAS-PRODUCCION.txt   the 8 Redirect Rules, the Bulk list and the Bulk rule, literal
     dynx_redirects.csv      the Bulk list in Cloudflare's import format

   The rules are REBUILT here from slugs.txt and the main pages and compared
   literally with those files, then every legacy URL is simulated with the same
   evaluation order Cloudflare uses (Redirect Rules first, first match wins,
   then Bulk). This check never contacts Cloudflare: real HTTP behaviour was
   verified in production on 18/11/2026 (see PHASE-5.2-PRODUCTION.md). */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const G = '9. Redirecciones legacy (configuración de producción, Fase 5.2)';

const DIR  = '.github/seo/phase-5.2';
const PROD = `${DIR}/production`;
const RULES_FILE = `${PROD}/REGLAS-PRODUCCION.txt`;
const CSV_FILE   = `${PROD}/dynx_redirects.csv`;
const SLUGS_SHA  = '277a7dc8765d7a92957021db44a65b9a313786f0e5cdaecd26bfb9b1a1dc3527'; // frozen legacy set
const MAX_EXPR   = 4096;
const MAX_RULES  = 10;   // Cloudflare Free: Single Redirects per zone

const APEX = 'dynxlabs.com', WWW = 'www.dynxlabs.com';
const HOSTS = [APEX, WWW, `${APEX}.`, `${WWW}.`];
const lit = a => '{' + a.map(x => `"${x}"`).join(' ') + '}';
const H  = `http.host in ${lit(HOSTS)}`;
const ES = 'any(http.request.uri.args["lang"][*] == "es")';
const EN = 'any(http.request.uri.args["lang"][*] == "en")';

const lines = s => String(s || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
const sha = buf => crypto.createHash('sha256').update(buf).digest('hex');

/* The expected production configuration, rebuilt from the sources. */
function expected(slugs, mainPages) {
  const pages = mainPages.filter(m => m.slug).map(m => m.slug);              // 6 named pages
  const A  = ['/'].concat(pages.map(p => `/${p}`), slugs.map(s => `/insights/${s}/`));
  const A5 = A.filter(p => p !== '/');
  const B  = slugs.map(s => `/insights/${s}`);
  const C  = slugs.map(s => `/insights/${s}/index.html`);
  const bulk = [];
  const add = (src, dst, pq) => bulk.push({ src, dst, pq });
  add('/', '/es/', false); add('/index.html', '/es/', false); add('/index', '/es/', false);
  pages.forEach(p => add(`/${p}.html`, `/en/${p}`, false));
  add('/insights/insight-post', '/en/insights', false); add('/insights/insight-post.html', '/en/insights', false);
  for (const l of ['es', 'en']) {
    add(`/${l}/index.html`, `/${l}/`, true); add(`/${l}/index`, `/${l}/`, true);
    pages.forEach(p => add(`/${l}/${p}.html`, `/${l}/${p}`, true));
  }
  const bulkPaths = bulk.map(b => b.src);
  const rules = [
    { id: 'S1', expr: `(${H}) and ${ES} and (http.request.uri.path in ${lit(B)})`, target: `concat("https://${APEX}/es", http.request.uri.path, "/")`, pq: false },
    { id: 'S2', expr: `(${H}) and ${ES} and (http.request.uri.path in ${lit(A)})`, target: `concat("https://${APEX}/es", http.request.uri.path)`, pq: false },
    { id: 'S3', expr: `(${H}) and ${ES} and (http.request.uri.path in ${lit(C)})`, target: `wildcard_replace(http.request.uri.path, "/insights/*/index.html", "https://${APEX}/es/insights/\${1}/", "s")`, pq: false },
    { id: 'S4', expr: `(${H}) and (http.request.uri.path in ${lit(B)})`, target: `concat("https://${APEX}/en", http.request.uri.path, "/")`, pq: false },
    { id: 'S5', expr: `(${H}) and ((http.request.uri.path in ${lit(A5)}) or (http.request.uri.path eq "/" and ${EN}))`, target: `concat("https://${APEX}/en", http.request.uri.path)`, pq: false },
    { id: 'S6', expr: `(${H}) and (http.request.uri.path in ${lit(C)})`, target: `wildcard_replace(http.request.uri.path, "/insights/*/index.html", "https://${APEX}/en/insights/\${1}/", "s")`, pq: false },
    { id: 'S7', expr: `(${H}) and (http.request.uri.path strict wildcard "/es/insights/*/index.html" or http.request.uri.path strict wildcard "/en/insights/*/index.html")`, target: `wildcard_replace(http.request.uri.path, "/*/insights/*/index.html", "https://${APEX}/\${1}/insights/\${2}/", "s")`, pq: true },
    { id: 'S8', expr: `(http.host in ${lit([`${APEX}.`, `${WWW}.`])}) or (http.host eq "${WWW}" and not (http.request.uri.path in ${lit(bulkPaths)}))`, target: `concat("https://${APEX}", http.request.uri.path)`, pq: true }
  ];
  const csv = [];
  for (const h of [APEX, WWW]) for (const b of bulk) csv.push(`${h}${b.src},https://${APEX}${b.dst},301,${b.pq ? 'TRUE' : 'FALSE'},FALSE,FALSE,FALSE`);
  const bulkRule = `(http.host in ${lit([APEX, WWW])}) and (http.request.full_uri in $dynx_redirects)`;
  return { A, A5, B, C, bulk, bulkPaths, rules, csv, bulkRule };
}

/* Parse REGLAS-PRODUCCION.txt into rules, Bulk CSV lines and the Bulk rule. */
function parseRulesFile(txt) {
  const out = { rules: [], csv: [], bulkRule: null };
  const sections = txt.split(/^### /m).slice(1);
  for (const sec of sections) {
    const ls = sec.split(/\r?\n/);
    const head = ls[0];
    const m = head.match(/^(S\d) —/);
    if (m) {
      const meta = ls.find(l => l.startsWith('Tipo:')) || '';
      const ei = ls.findIndex(l => l.startsWith('Expresión'));
      const di = ls.findIndex(l => l.startsWith('Destino'));
      out.rules.push({
        id: m[1],
        type: (meta.match(/Tipo: (\w+)/) || [])[1],
        code: (meta.match(/Código: (\d+)/) || [])[1],
        pq: /Preserve query string: ON/.test(meta) ? true : /Preserve query string: OFF/.test(meta) ? false : null,
        declaredLen: Number((ls[ei] || '').match(/\((\d+) caracteres\)/)?.[1]),
        expr: ei >= 0 ? (ls[ei + 1] || '').trim() : '',
        target: di >= 0 ? (ls[di + 1] || '').trim() : ''
      });
    } else if (/^Lista Bulk/.test(head)) {
      out.csv = lines(ls.slice(1).join('\n'));
    } else if (/^Regla Bulk/.test(head)) {
      out.bulkRule = lines(ls.slice(1).join('\n'))[0] || null;
    }
  }
  return out;
}

/* Cloudflare evaluation model used by the simulation (documented behaviour):
   adjacent slashes merged, Redirect Rules in panel order, first match wins,
   then the Bulk list; `lang` compared raw and case-sensitive. */
function makeSimulator(x) {
  const wc = (s, pat) => s.match(new RegExp('^' + pat.split('*').map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.*?)') + '$'));
  return function simulate(url) {
    const u = new URL(url);
    const path = u.pathname.replace(/\/{2,}/g, '/');
    const args = u.search ? u.search.slice(1).split('&').map(kv => kv.split('=')) : [];
    const has = v => args.some(([k, val]) => k === 'lang' && val === v);
    const inH = HOSTS.includes(u.host);
    const q = pq => (pq ? u.search : '');
    if (inH && has('es') && x.B.includes(path)) return { rule: 'S1', to: `https://${APEX}/es${path}/` };
    if (inH && has('es') && x.A.includes(path)) return { rule: 'S2', to: `https://${APEX}/es${path}` };
    if (inH && has('es') && x.C.includes(path)) return { rule: 'S3', to: `https://${APEX}/es/insights/${wc(path, '/insights/*/index.html')[1]}/` };
    if (inH && x.B.includes(path)) return { rule: 'S4', to: `https://${APEX}/en${path}/` };
    if (inH && (x.A5.includes(path) || (path === '/' && has('en')))) return { rule: 'S5', to: `https://${APEX}/en${path}` };
    if (inH && x.C.includes(path)) return { rule: 'S6', to: `https://${APEX}/en/insights/${wc(path, '/insights/*/index.html')[1]}/` };
    if (inH && (wc(path, '/es/insights/*/index.html') || wc(path, '/en/insights/*/index.html'))) {
      const m = wc(path, '/*/insights/*/index.html'); return { rule: 'S7', to: `https://${APEX}/${m[1]}/insights/${m[2]}/${q(true)}` };
    }
    if ([`${APEX}.`, `${WWW}.`].includes(u.host) || (u.host === WWW && !x.bulkPaths.includes(path))) return { rule: 'S8', to: `https://${APEX}${path}${q(true)}` };
    const b = x.bulk.find(e => e.src === path);
    if ([APEX, WWW].includes(u.host) && b) return { rule: 'Bulk', to: `https://${APEX}${b.dst}${q(b.pq)}` };
    return null;
  };
}

module.exports = function run(ctx, report) {
  const { S, posts, pages } = ctx;

  /* LGC-01 production files present; frozen legacy slug set unchanged */
  const fileProblems = [];
  for (const f of [RULES_FILE, CSV_FILE, `${PROD}/PHASE-5.2-PRODUCTION.md`, `${DIR}/slugs.txt`]) {
    if (!S.isFile(f)) fileProblems.push({ where: f, expected: 'archivo presente', found: 'no existe' });
  }
  if (S.isFile(`${DIR}/slugs.txt`)) {
    const h = sha(fs.readFileSync(S.abs(`${DIR}/slugs.txt`)));
    if (h !== SLUGS_SHA) fileProblems.push({ where: `${DIR}/slugs.txt`, expected: `SHA256 ${SLUGS_SHA} (conjunto legacy congelado)`, found: h });
  }
  report.check(G, 'LGC-01', 'Configuración de producción presente y conjunto legacy (slugs.txt) congelado', 4, fileProblems);
  if (fileProblems.some(p => p.found === 'no existe')) return;

  const slugs = lines(S.read(`${DIR}/slugs.txt`)).sort();
  const x = expected(slugs, S.MAIN_PAGES);
  const got = parseRulesFile(S.read(RULES_FILE));
  const sitemapLocs = new Set((S.read('sitemap.xml').match(/<loc>([^<]+)<\/loc>/g) || []).map(v => v.replace(/<\/?loc>/g, '')));

  /* LGC-02 every legacy slug still exists: source post, ES/EN build and sitemap */
  const slugProblems = [];
  const postSlugs = posts.map(p => p.slug);
  if (slugs.length !== 29) slugProblems.push({ where: 'slugs.txt', expected: '29 slugs legacy', found: `${slugs.length}` });
  for (const s of slugs) {
    if (!postSlugs.includes(s)) slugProblems.push({ where: `insights/posts/${s}.json`, expected: 'artículo legacy presente', found: 'no existe (¿eliminado o renombrado?)' });
    for (const lang of S.LANGS) {
      if (!S.isFile(`${lang}/insights/${s}/index.html`)) slugProblems.push({ where: `${lang}/insights/${s}/index.html`, expected: 'página generada', found: 'no existe' });
      if (!sitemapLocs.has(`${S.BASE}/${lang}/insights/${s}/`)) slugProblems.push({ where: 'sitemap.xml', expected: `${S.BASE}/${lang}/insights/${s}/`, found: 'ausente' });
    }
  }
  report.check(G, 'LGC-02', 'Los 29 slugs legacy siguen existiendo: artículo fuente, build ES/EN y sitemap', slugs.length, slugProblems);
  report.count('Artículos posteriores a la migración (sin regla legacy, por diseño)', postSlugs.filter(s => !slugs.includes(s)).length);

  /* LGC-03 the 8 Redirect Rules: order, type, code, query handling, length, quota */
  const metaProblems = [];
  const ids = got.rules.map(r => r.id).join(',');
  if (ids !== x.rules.map(r => r.id).join(',')) metaProblems.push({ where: RULES_FILE, expected: 'S1,S2,S3,S4,S5,S6,S7,S8', found: ids });
  if (got.rules.length > MAX_RULES) metaProblems.push({ where: RULES_FILE, expected: `≤ ${MAX_RULES} reglas (plan Free)`, found: `${got.rules.length}` });
  for (const w of x.rules) {
    const r = got.rules.find(g => g.id === w.id);
    if (!r) continue;
    if (r.type !== 'Dynamic') metaProblems.push({ where: w.id, expected: 'Tipo Dynamic', found: String(r.type) });
    if (r.code !== '301') metaProblems.push({ where: w.id, expected: 'Código 301', found: String(r.code) });
    if (r.pq !== w.pq) metaProblems.push({ where: w.id, expected: `Preserve query string ${w.pq ? 'ON' : 'OFF'}`, found: String(r.pq) });
    if (r.expr.length > MAX_EXPR) metaProblems.push({ where: w.id, expected: `≤ ${MAX_EXPR} caracteres`, found: `${r.expr.length}` });
    if (r.declaredLen !== r.expr.length) metaProblems.push({ where: w.id, expected: `longitud declarada = ${r.expr.length}`, found: `${r.declaredLen}` });
  }
  report.check(G, 'LGC-03', 'Ocho Redirect Rules: orden, tipo Dynamic, 301, tratamiento de la query y límites del plan', x.rules.length, metaProblems);

  /* LGC-04 / LGC-05 expressions and targets identical to the ones rebuilt from the sources */
  const exprProblems = [], destProblems = [];
  for (const w of x.rules) {
    const r = got.rules.find(g => g.id === w.id);
    if (!r) { exprProblems.push({ where: w.id, expected: 'regla presente', found: 'ausente' }); continue; }
    if (r.expr !== w.expr) exprProblems.push({ where: w.id, expected: 'expresión reconstruida desde slugs.txt y las páginas principales', found: 'texto distinto' });
    if (r.target !== w.target) destProblems.push({ where: w.id, expected: w.target, found: r.target });
  }
  report.check(G, 'LGC-04', 'Expresiones de las 8 reglas idénticas a las reconstruidas desde las fuentes', x.rules.length, exprProblems);
  report.check(G, 'LGC-05', 'Destinos de las 8 reglas literales', x.rules.length, destProblems);

  /* LGC-06 Bulk list (54) and Bulk rule; CSV file and rules file agree */
  const bulkProblems = [];
  const csvFile = lines(S.read(CSV_FILE));
  const cmp = (have, where) => {
    x.csv.filter(l => !have.includes(l)).forEach(l => bulkProblems.push({ where, expected: l, found: 'ausente o distinto' }));
    have.filter(l => !x.csv.includes(l)).forEach(l => bulkProblems.push({ where, expected: 'solo las entradas aprobadas', found: l }));
  };
  cmp(csvFile, CSV_FILE); cmp(got.csv, `${RULES_FILE} (lista Bulk)`);
  const srcs = csvFile.map(l => l.split(',')[0]);
  if (new Set(srcs).size !== srcs.length) bulkProblems.push({ where: CSV_FILE, expected: 'orígenes únicos', found: 'orígenes duplicados' });
  if (got.bulkRule !== x.bulkRule) bulkProblems.push({ where: 'regla Bulk', expected: x.bulkRule, found: String(got.bulkRule) });
  report.check(G, 'LGC-06', `Lista Bulk (${x.csv.length} entradas, 301) y regla Bulk`, x.csv.length, bulkProblems);

  /* Simulation inputs: every legacy URL form, both hosts, with and without lang=es */
  const simulate = makeSimulator(x);
  const legacyPaths = x.A.concat(x.B, x.C, x.bulk.filter(b => !b.pq && !b.src.includes('insight-post') && b.src !== '/').map(b => b.src));
  const inputs = [];
  for (const h of [APEX, WWW]) {
    for (const p of legacyPaths) for (const q of ['', '?lang=es']) inputs.push(`https://${h}${p}${q}`);
    inputs.push(`https://${h}/?lang=en`);   // the only way back to /en/ from the legacy root
  }
  const isPage = url => pages.some(p => p.url === url && S.isFile(p.file));
  const langOf = url => (url.match(/^https:\/\/dynxlabs\.com\/(es|en)\//) || [])[1];
  const wantLang = url => {
    const u = new URL(url);
    if (u.pathname === '/' && /(^|&)lang=en(&|$)/.test(u.search.slice(1))) return 'en';
    if (['/', '/index', '/index.html'].includes(u.pathname)) return 'es';
    if (/\.html$/.test(u.pathname) && !u.pathname.startsWith('/insights/')) return 'en';
    return /(^|&)lang=es(&|$)/.test(u.search.slice(1)) ? 'es' : 'en';
  };

  /* LGC-07 every legacy URL: one rule, canonical destination in the sitemap, right language, no query */
  const destProblems2 = [];
  const reached = new Set();
  for (const url of inputs) {
    const r = simulate(url);
    if (!r) { destProblems2.push({ where: url, expected: 'una regla de redirección', found: 'ninguna' }); continue; }
    reached.add(r.to);
    if (!sitemapLocs.has(r.to) || !isPage(r.to)) destProblems2.push({ where: `${url} (${r.rule})`, expected: 'URL canónica del sitemap y página generada, sin query', found: r.to });
    else if (langOf(r.to) !== wantLang(url)) destProblems2.push({ where: `${url} (${r.rule})`, expected: `destino en ${wantLang(url)}`, found: r.to });
  }
  report.check(G, 'LGC-07', 'Cada URL antigua (ambos hosts, con y sin lang=es, y la raíz con lang=en) va a su URL canónica del sitemap, en el idioma correcto y sin parámetros', inputs.length, destProblems2);

  /* LGC-08 completeness: the 72 canonical URLs with a legacy equivalent are all reachable */
  const legacyCanonicals = [];
  for (const lang of S.LANGS) {
    S.MAIN_PAGES.forEach(m => legacyCanonicals.push(`${S.BASE}/${lang}/${m.slug}`));
    slugs.forEach(s => legacyCanonicals.push(`${S.BASE}/${lang}/insights/${s}/`));
  }
  report.check(G, 'LGC-08', 'Las 72 URLs canónicas con equivalente legacy son alcanzables desde una URL antigua', legacyCanonicals.length,
    legacyCanonicals.filter(u => !reached.has(u)).map(u => ({ where: u, expected: 'alcanzable desde una URL legacy', found: 'ninguna regla la produce' })));

  /* LGC-09 no chains or loops: no destination is itself matched by a rule */
  report.check(G, 'LGC-09', 'Sin cadenas ni bucles: ningún destino vuelve a coincidir con una regla', reached.size,
    [...reached].filter(u => simulate(u)).map(u => ({ where: u, expected: 'destino final', found: `coincide con ${simulate(u).rule}` })));

  /* LGC-10 the canonical site is untouched: no sitemap URL matches any rule */
  report.check(G, 'LGC-10', 'Ninguna URL del sitemap coincide con una regla (el sitio nuevo no se redirige)', sitemapLocs.size,
    [...sitemapLocs].filter(u => simulate(u)).map(u => ({ where: u, expected: 'sin redirección', found: simulate(u).rule })));

  /* LGC-11 S8 never steals a www URL that the Bulk list must handle in one hop */
  const s8 = got.rules.find(r => r.id === 'S8');
  const excl = s8 ? ((s8.expr.match(/not \(http\.request\.uri\.path in \{([^}]*)\}\)/) || [])[1] || '') : '';
  const exclList = [...excl.matchAll(/"([^"]*)"/g)].map(m => m[1]);
  report.check(G, 'LGC-11', 'La exclusión de S8 coincide con las rutas de la lista Bulk', x.bulkPaths.length,
    x.bulkPaths.filter(p => !exclList.includes(p)).map(p => ({ where: 'S8', expected: `excluye ${p}`, found: 'no la excluye' }))
      .concat(exclList.filter(p => !x.bulkPaths.includes(p)).map(p => ({ where: 'S8', expected: 'solo rutas de la lista Bulk', found: p }))));

  report.count('URLs antiguas simuladas (2 hosts × con/sin lang=es)', inputs.length);
  report.count('Rutas legacy cubiertas', legacyPaths.length);
};
