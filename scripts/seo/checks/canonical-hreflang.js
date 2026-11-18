/* SEO audit — 5.2 Canonical and 5.3 Hreflang */
'use strict';

const GC = '2. Canonical';
const GH = '3. Hreflang';

function headLinks(S, file, relValue) {
  return S.doc(file).root.querySelectorAll('link')
    .filter(l => String(l.getAttribute('rel') || '').toLowerCase().split(/\s+/).includes(relValue));
}

module.exports = function run(ctx, report) {
  const { S, pages } = ctx;
  const indexable = pages.filter(p => p.indexable && S.isFile(p.file));
  const byUrl = new Map(pages.map(p => [p.url, p]));

  /* ---------- canonical ---------- */
  const missing = [], multiple = [], notAbsolute = [], wrong = [], crossLang = [], legacy = [], dead = [];
  for (const p of indexable) {
    const links = headLinks(S, p.file, 'canonical');
    if (links.length === 0) { missing.push({ where: p.file, expected: p.url, found: 'sin canonical' }); continue; }
    if (links.length > 1) multiple.push({ where: p.file, expected: '1 canonical', found: `${links.length}: ${links.map(l => l.getAttribute('href')).join(' , ')}` });
    const href = links[0].getAttribute('href') || '';
    if (!/^https:\/\/dynxlabs\.com\//.test(href)) notAbsolute.push({ where: p.file, expected: `URL absoluta ${S.BASE}/…`, found: href });
    if (href !== p.url) wrong.push({ where: p.file, expected: p.url, found: href });
    const m = href.match(/^https:\/\/dynxlabs\.com\/(es|en)(\/|$)/);
    if (m && m[1] !== p.lang) crossLang.push({ where: p.file, expected: `/${p.lang}/…`, found: href });
    if (/[?#]/.test(href) || /\.html$/.test(href) || !m) legacy.push({ where: p.file, expected: 'URL /es/ o /en/ sin parámetros ni extensión', found: href });
    const target = byUrl.get(href);
    const res = S.resolvePath(href.replace(S.BASE, ''));
    if (res.status === 'missing' || res.status === 'redirect' || (target && !target.indexable) || (res.file && /(^|\/)404\.html$/.test(res.file))) {
      dead.push({ where: p.file, expected: 'canonical hacia una página existente e indexable', found: `${href} (${res.status})` });
    }
  }
  report.check(GC, 'CAN-01', 'Toda página indexable tiene canonical', indexable.length, missing);
  report.check(GC, 'CAN-02', 'Un único canonical por página (sin contradicciones)', indexable.length, multiple);
  report.check(GC, 'CAN-03', 'Canonical absoluto, https y del dominio', indexable.length, notAbsolute);
  report.check(GC, 'CAN-04', 'Canonical igual a la URL propia de la página', indexable.length, wrong);
  report.check(GC, 'CAN-05', 'Canonical no apunta al otro idioma', indexable.length, crossLang);
  report.check(GC, 'CAN-06', 'Canonical sin parámetros, sin extensión y sin rutas legacy', indexable.length, legacy);
  report.check(GC, 'CAN-07', 'Canonical apunta a una página existente (no 404, no redirección)', indexable.length, dead);

  /* ---------- hreflang ---------- */
  const want = p => {
    const tail = p.url.replace(`${S.BASE}/${p.lang}/`, '');
    return { es: `${S.BASE}/es/${tail}`, en: `${S.BASE}/en/${tail}`, 'x-default': `${S.BASE}/${S.XDEFAULT}/${tail}` };
  };
  const setOf = p => {
    const map = {}; const dups = []; const bad = [];
    for (const l of headLinks(S, p.file, 'alternate')) {
      const hl = l.getAttribute('hreflang');
      if (hl === undefined || hl === null) continue;          // e.g. RSS alternates
      if (!['es', 'en', 'x-default'].includes(hl)) bad.push(hl);
      if (map[hl] !== undefined) dups.push(hl);
      map[hl] = l.getAttribute('href') || '';
    }
    return { map, dups, bad };
  };

  const incomplete = [], wrongHref = [], badCodes = [], duplicates = [], notAbs = [], deadAlt = [], notReciprocal = [], xdef = [];
  for (const p of indexable) {
    const { map, dups, bad } = setOf(p);
    const w = want(p);
    for (const hl of ['es', 'en', 'x-default']) {
      if (map[hl] === undefined) { incomplete.push({ where: p.file, expected: `hreflang="${hl}"`, found: 'ausente' }); continue; }
      if (!/^https:\/\/dynxlabs\.com\//.test(map[hl])) notAbs.push({ where: p.file, expected: 'URL absoluta', found: `${hl} → ${map[hl]}` });
      if (map[hl] !== w[hl]) (hl === 'x-default' ? xdef : wrongHref).push({ where: p.file, expected: `${hl} → ${w[hl]}`, found: map[hl] });
      const res = S.resolvePath(map[hl].replace(S.BASE, ''));
      const target = byUrl.get(map[hl]);
      if (res.status === 'missing' || res.status === 'redirect' || !target || !target.indexable) {
        deadAlt.push({ where: p.file, expected: `${hl} hacia página generada e indexable`, found: `${map[hl]} (${res.status})` });
      }
    }
    bad.forEach(c => badCodes.push({ where: p.file, expected: 'es, en o x-default', found: c }));
    dups.forEach(c => duplicates.push({ where: p.file, expected: `un solo hreflang="${c}"`, found: 'repetido' }));

    // reciprocity: the alternate page must declare exactly the same set
    const twin = byUrl.get(w[S.other(p.lang)]);
    if (twin && S.isFile(twin.file)) {
      const back = setOf(twin).map;
      if (back[p.lang] !== p.url || back[twin.lang] !== twin.url) {
        notReciprocal.push({ where: `${p.file} ↔ ${twin.file}`, expected: 'ambas versiones se referencian mutuamente', found: `${twin.file} declara ${p.lang} → ${back[p.lang]}` });
      }
    } else {
      notReciprocal.push({ where: p.file, expected: `versión ${S.other(p.lang)} generada`, found: 'no existe' });
    }
  }
  report.check(GH, 'HRF-01', 'Alternativas es, en y x-default presentes', indexable.length, incomplete);
  report.check(GH, 'HRF-02', 'URLs hreflang absolutas y válidas', indexable.length, notAbs);
  report.check(GH, 'HRF-03', 'Hreflang es/en apuntan a la versión equivalente correcta', indexable.length, wrongHref);
  report.check(GH, 'HRF-04', `x-default coherente (→ /${S.XDEFAULT}/, arquitectura aprobada)`, indexable.length, xdef);
  report.check(GH, 'HRF-05', 'Reciprocidad ES ↔ EN', indexable.length, notReciprocal);
  report.check(GH, 'HRF-06', 'Hreflang solo referencia páginas generadas e indexables', indexable.length, deadAlt);
  report.check(GH, 'HRF-07', 'Sin códigos de idioma incorrectos ni duplicados', indexable.length, badCodes.concat(duplicates));

  // 404 pages must not advertise themselves as indexable alternates of real content
  report.count('Canonicals verificados', indexable.length);
  report.count('Conjuntos hreflang verificados', indexable.length);
};
