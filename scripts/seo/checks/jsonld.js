/* SEO audit — 5.4 Schema.org / JSON-LD */
'use strict';

const G = '4. Schema.org / JSON-LD';

// Approved top-level block types per page (Phases 2 and 3).
const EXPECTED = {
  home:       ['Organization', 'WebSite'],
  products:   ['BreadcrumbList'],
  research:   ['BreadcrumbList'],
  contact:    ['BreadcrumbList'],
  faq:        ['BreadcrumbList', 'FAQPage'],
  insights:   ['BreadcrumbList', 'CollectionPage'],
  leadership: ['BreadcrumbList', 'ProfilePage'],
  article:    ['BlogPosting', 'BreadcrumbList'],
  404:        []
};
const PAGE_TYPES = ['WebPage', 'CollectionPage', 'ProfilePage', 'AboutPage', 'ContactPage'];

module.exports = function run(ctx, report) {
  const { S, pages, posts, locales } = ctx;
  const manifest = JSON.parse(S.read('insights/manifest.json'));
  const byUrl = new Map(pages.map(p => [p.url, p]));
  const existing = pages.filter(p => S.isFile(p.file));

  const invalid = [], typeProblems = [], idProblems = [], pageEntity = [], crumbs = [], faq = [], posting = [], refs = [], itemList = [], urlProblems = [];
  let blocks = 0, crumbCount = 0, faqQuestions = 0, postings = 0, listItems = 0;

  for (const p of existing) {
    const { html, root } = S.doc(p.file);
    const parsed = S.jsonLdBlocks(html);
    blocks += parsed.length;
    parsed.filter(b => !b.ok).forEach(b => invalid.push({ where: p.file, expected: 'JSON válido', found: `${b.error} — ${b.raw}` }));
    const data = parsed.filter(b => b.ok).map(b => b.data);

    // top-level types (a block may be an object, an array or an @graph)
    const top = [];
    data.forEach(d => {
      const nodes = Array.isArray(d) ? d : (d && d['@graph'] ? d['@graph'] : [d]);
      nodes.forEach(n => S.typesOf(n).forEach(t => top.push(t)));
    });
    const key = p.kind === 'main' ? p.meta : p.kind;
    const expected = EXPECTED[key] || [];
    const sorted = top.slice().sort();
    if (JSON.stringify(sorted) !== JSON.stringify(expected.slice().sort())) {
      typeProblems.push({ where: p.file, expected: `[${expected.join(', ')}]`, found: `[${sorted.join(', ')}]` });
    }

    const dict = locales[p.lang];
    const bodyEl = root.querySelector('body');
    const bodyText = S.norm(bodyEl ? bodyEl.text : '');

    data.forEach(d => S.walkLd(d, (node, parentKey) => {
      const types = S.typesOf(node);
      const id = node['@id'];

      /* --- global identities --- */
      if (types.includes('Organization') && node.name === 'DYNX Labs' && id !== S.GLOBAL_IDS.organization) {
        idProblems.push({ where: p.file, expected: `Organization @id ${S.GLOBAL_IDS.organization}`, found: String(id) });
      }
      if (types.includes('Person') && id !== S.GLOBAL_IDS.person) {
        idProblems.push({ where: p.file, expected: `Person @id ${S.GLOBAL_IDS.person}`, found: String(id) });
      }
      if (types.includes('WebSite') && id !== S.GLOBAL_IDS.website) {
        idProblems.push({ where: p.file, expected: `WebSite @id ${S.GLOBAL_IDS.website}`, found: String(id) });
      }
      if (typeof id === 'string' && id.startsWith(`${S.BASE}/#`) && !Object.values(S.GLOBAL_IDS).includes(id)) {
        idProblems.push({ where: p.file, expected: 'identificador global conocido', found: id });
      }
      if (types.includes('Person') && node.jobTitle !== undefined && node.jobTitle !== 'Founder & CEO') {
        idProblems.push({ where: p.file, expected: 'jobTitle "Founder & CEO"', found: node.jobTitle });
      }

      /* --- page-level entities --- */
      if (types.some(t => PAGE_TYPES.includes(t)) && parentKey !== 'mainEntityOfPage') {
        if (node.url !== p.url) pageEntity.push({ where: p.file, expected: `url ${p.url}`, found: String(node.url) });
        if (id !== `${p.url}#webpage`) pageEntity.push({ where: p.file, expected: `@id ${p.url}#webpage`, found: String(id) });
        if (node.inLanguage !== p.lang) pageEntity.push({ where: p.file, expected: `inLanguage ${p.lang}`, found: String(node.inLanguage) });
        if (!node.isPartOf || node.isPartOf['@id'] !== S.GLOBAL_IDS.website) pageEntity.push({ where: p.file, expected: `isPartOf ${S.GLOBAL_IDS.website}`, found: JSON.stringify(node.isPartOf) });
        if (node.description !== undefined && p.meta && node.description !== dict.meta[p.meta].desc) {
          pageEntity.push({ where: p.file, expected: 'description = meta description del idioma', found: String(node.description).slice(0, 80) });
        }
      }

      /* --- breadcrumbs --- */
      if (types.includes('BreadcrumbList')) {
        crumbCount++;
        const items = node.itemListElement || [];
        const depth = p.kind === 'article' ? 3 : 2;
        if (items.length !== depth) crumbs.push({ where: p.file, expected: `${depth} niveles`, found: `${items.length}` });
        items.forEach((li, i) => {
          if (li.position !== i + 1) crumbs.push({ where: p.file, expected: `position ${i + 1}`, found: String(li.position) });
          if (!S.norm(li.name)) crumbs.push({ where: p.file, expected: 'name con contenido', found: 'vacío' });
          const target = byUrl.get(li.item);
          if (!target || !target.indexable || target.lang !== p.lang || !S.isFile(target.file)) {
            crumbs.push({ where: p.file, expected: `item hacia página /${p.lang}/ existente`, found: String(li.item) });
          }
        });
        if (items[0] && items[0].item !== `${S.BASE}/${p.lang}/`) crumbs.push({ where: p.file, expected: `nivel 1 → ${S.BASE}/${p.lang}/`, found: String(items[0].item) });
        const last = items[items.length - 1];
        if (last && last.item !== p.url) crumbs.push({ where: p.file, expected: `último nivel → ${p.url}`, found: String(last.item) });
        if (p.kind === 'article') {
          if (items[1] && items[1].item !== `${S.BASE}/${p.lang}/insights`) crumbs.push({ where: p.file, expected: `nivel 2 → ${S.BASE}/${p.lang}/insights`, found: String(items[1].item) });
          if (last && last.name !== p.post[p.lang].title) crumbs.push({ where: p.file, expected: `nombre = título del artículo (${p.lang})`, found: String(last.name) });
        } else if (last && dict.breadcrumb && last.name !== dict.breadcrumb[p.slug]) {
          crumbs.push({ where: p.file, expected: `nombre "${dict.breadcrumb[p.slug]}"`, found: String(last.name) });
        }
      }

      /* --- FAQ: structured data = locale data = visible text --- */
      if (types.includes('FAQPage')) {
        const qs = node.mainEntity || [];
        const localeCount = Object.keys(dict.faq || {}).filter(k => /^q\d+$/.test(k)).length;
        if (qs.length !== localeCount) faq.push({ where: p.file, expected: `${localeCount} preguntas (locales/${p.lang}.json)`, found: `${qs.length}` });
        qs.forEach((q, i) => {
          faqQuestions++;
          const qText = S.plain(q.name);
          const aText = S.plain(q.acceptedAnswer && q.acceptedAnswer.text);
          if (!qText || !aText) { faq.push({ where: p.file, expected: `pregunta ${i + 1} con respuesta`, found: 'vacía' }); return; }
          if (qText !== S.plain(dict.faq[`q${i + 1}`])) faq.push({ where: p.file, expected: `faq.q${i + 1} del idioma ${p.lang}`, found: qText.slice(0, 80) });
          if (aText !== S.plain(dict.faq[`a${i + 1}`])) faq.push({ where: p.file, expected: `faq.a${i + 1} del idioma ${p.lang}`, found: aText.slice(0, 80) });
          if (!bodyText.includes(qText)) faq.push({ where: p.file, expected: `pregunta ${i + 1} visible en el HTML`, found: qText.slice(0, 80) });
          if (!bodyText.includes(aText)) faq.push({ where: p.file, expected: `respuesta ${i + 1} visible en el HTML`, found: aText.slice(0, 80) });
        });
      }

      /* --- BlogPosting --- */
      if (types.includes('BlogPosting')) {
        postings++;
        const src = p.post[p.lang];
        const img = `${S.BASE}/assets/images/og/insights/${p.slug}.${p.lang}.png`;
        const cat = (manifest.categories[p.post.category] || {})[p.lang];
        const exp = [
          ['@id', id, p.url], ['headline', node.headline, src.title], ['description', node.description, src.summary],
          ['datePublished', node.datePublished, p.post.date], ['inLanguage', node.inLanguage, p.lang],
          ['articleSection', node.articleSection, cat], ['image', node.image, img],
          ['mainEntityOfPage.@id', node.mainEntityOfPage && node.mainEntityOfPage['@id'], p.url]
        ];
        exp.forEach(([k, found, want]) => { if (found !== want) posting.push({ where: p.file, expected: `${k} = ${String(want).slice(0, 90)}`, found: String(found).slice(0, 90) }); });
        if (!S.isFile(img.replace(`${S.BASE}/`, ''))) posting.push({ where: p.file, expected: 'imagen existente en el proyecto', found: img });
        const a = node.author || {}, pub = node.publisher || {};
        if (a['@id'] !== S.GLOBAL_IDS.person || !S.typesOf(a).includes('Person')) refs.push({ where: p.file, expected: `author → ${S.GLOBAL_IDS.person}`, found: JSON.stringify(a).slice(0, 90) });
        if (pub['@id'] !== S.GLOBAL_IDS.organization || !S.typesOf(pub).includes('Organization')) refs.push({ where: p.file, expected: `publisher → ${S.GLOBAL_IDS.organization}`, found: JSON.stringify(pub).slice(0, 90) });
      }

      /* --- Insights listing ItemList --- */
      if (types.includes('ItemList')) {
        const items = node.itemListElement || [];
        listItems += items.length;
        const want = new Set(posts.map(x => `${S.BASE}/${p.lang}/insights/${x.slug}/`));
        const got = items.map(i => i.url);
        if (items.length !== posts.length) itemList.push({ where: p.file, expected: `${posts.length} elementos`, found: `${items.length}` });
        got.filter(u => !want.has(u)).forEach(u => itemList.push({ where: p.file, expected: `URL de artículo /${p.lang}/`, found: String(u) }));
        if (new Set(got).size !== got.length) itemList.push({ where: p.file, found: 'elementos duplicados' });
        items.forEach((it, i) => {
          if (it.position !== i + 1) itemList.push({ where: p.file, expected: `position ${i + 1}`, found: String(it.position) });
          const post = posts.find(x => `${S.BASE}/${p.lang}/insights/${x.slug}/` === it.url);
          if (post && it.name !== post[p.lang].title) itemList.push({ where: p.file, expected: `name = título ${p.lang}`, found: String(it.name).slice(0, 80) });
        });
      }

      /* --- every same-site URL inside JSON-LD must exist and be non-legacy --- */
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (typeof v !== 'string' || !/^https?:\/\/(www\.)?dynxlabs\.com/i.test(v)) continue;
        if (v === S.BASE || v === `${S.BASE}/` || v.startsWith(`${S.BASE}/#`)) continue;   // global entity URL / ids
        if (!v.startsWith(`${S.BASE}/`)) { urlProblems.push({ where: p.file, expected: `URL https sin www`, found: `${k}: ${v}` }); continue; }
        const pathOnly = v.replace(S.BASE, '').split('#')[0];
        const res = S.resolvePath(pathOnly);
        const isAsset = pathOnly.startsWith('/assets/');
        if (res.status === 'missing' || res.status === 'redirect') urlProblems.push({ where: p.file, expected: 'URL existente', found: `${k}: ${v} (${res.status})` });
        else if (!isAsset && !new RegExp(`^/${p.lang}(/|$)`).test(pathOnly)) urlProblems.push({ where: p.file, expected: `URL de página bajo /${p.lang}/`, found: `${k}: ${v}` });
        else if (/[?]/.test(v) || /\.html$/.test(pathOnly)) urlProblems.push({ where: p.file, expected: 'URL canónica (sin parámetros ni .html)', found: `${k}: ${v}` });
      }
    }));
  }

  const nArticles = existing.filter(p => p.kind === 'article').length;
  report.check(G, 'LD-01', 'Todos los bloques JSON-LD se parsean correctamente', blocks, invalid);
  report.check(G, 'LD-02', 'Tipos esperados por página, sin bloques faltantes, sobrantes ni duplicados', existing.length, typeProblems);
  report.check(G, 'LD-03', 'Identificadores globales coherentes (Organization, Person, WebSite)', blocks, idProblems);
  report.check(G, 'LD-04', 'Entidades de página: url, @id, inLanguage e isPartOf coherentes', existing.length, pageEntity);
  report.check(G, 'LD-05', 'Breadcrumbs coherentes con la jerarquía real y el idioma', crumbCount, crumbs);
  report.check(G, 'LD-06', 'FAQPage = datos del idioma = texto visible', faqQuestions, faq);
  report.check(G, 'LD-07', 'BlogPosting localizado en cada artículo', postings,
    posting.concat(postings !== nArticles ? [{ expected: `${nArticles} BlogPosting`, found: `${postings}` }] : []));
  report.check(G, 'LD-08', 'author y publisher referencian las identidades globales', postings, refs);
  report.check(G, 'LD-09', 'ItemList del listado de Insights completo y localizado', listItems, itemList);
  report.check(G, 'LD-10', 'URLs del sitio dentro de JSON-LD existentes y del idioma correcto', blocks, urlProblems);

  report.count('Bloques JSON-LD parseados', blocks);
  report.count('BreadcrumbList verificados', crumbCount);
  report.count('BlogPosting verificados', postings);
  report.count('Preguntas FAQ verificadas', faqQuestions);
  report.count('Elementos ItemList verificados', listItems);
};
