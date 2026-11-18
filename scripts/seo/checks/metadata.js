/* SEO audit — 5.7 Metadata and social sharing */
'use strict';

const fs = require('fs');
const G = '7. Metadatos y social sharing';

/* Width/height from a PNG's IHDR chunk; null if the file is not a PNG. */
function pngSize(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const b = Buffer.alloc(24);
    fs.readSync(fd, b, 0, 24, 0);
    if (b.readUInt32BE(0) !== 0x89504e47 || b.readUInt32BE(4) !== 0x0d0a1a0a) return null;
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  } finally { fs.closeSync(fd); }
}

module.exports = function run(ctx, report) {
  const { S, pages, locales } = ctx;
  const indexable = pages.filter(p => p.indexable && S.isFile(p.file));

  const title = [], desc = [], og = [], tw = [], img = [], locale = [], inherited = [], sameText = [];
  const titlesByLang = { es: new Map(), en: new Map() }, descByLang = { es: new Map(), en: new Map() };
  const imagesChecked = new Set();
  const read = {};

  for (const p of indexable) {
    const { root } = S.doc(p.file);
    const head = root.querySelector('head');
    const metas = head ? head.querySelectorAll('meta') : [];
    const get = (attr, name) => {
      const found = metas.filter(m => m.getAttribute(attr) === name);
      return { n: found.length, v: found.length ? S.plain(found[0].getAttribute('content')) : undefined };
    };
    const dict = locales[p.lang];
    const src = p.kind === 'article' ? p.post[p.lang] : null;
    const wantTitle = S.plain(src ? `${src.title} | DYNX Labs` : dict.meta[p.meta].title);
    const wantOgTitle = S.plain(src ? src.title : dict.meta[p.meta].title);
    const wantDesc = S.plain(src ? src.summary : dict.meta[p.meta].desc);

    const titles = head ? head.querySelectorAll('title') : [];
    const t = titles.length ? S.norm(titles[0].text) : '';
    if (titles.length !== 1) title.push({ where: p.file, expected: '1 <title>', found: `${titles.length}` });
    else if (!t) title.push({ where: p.file, expected: 'title con contenido', found: 'vacío' });
    else if (t !== wantTitle) title.push({ where: p.file, expected: wantTitle, found: t });

    const d = get('name', 'description');
    if (d.n !== 1) desc.push({ where: p.file, expected: '1 meta description', found: `${d.n}` });
    else if (!d.v) desc.push({ where: p.file, expected: 'description con contenido', found: 'vacía' });
    else if (d.v !== wantDesc) desc.push({ where: p.file, expected: wantDesc.slice(0, 90), found: d.v.slice(0, 90) });

    titlesByLang[p.lang].set(t, (titlesByLang[p.lang].get(t) || []).concat(p.file));
    if (d.v) descByLang[p.lang].set(d.v, (descByLang[p.lang].get(d.v) || []).concat(p.file));
    read[p.url] = { title: t, desc: d.v };

    /* Open Graph */
    const want = {
      'og:title': wantOgTitle, 'og:description': wantDesc, 'og:url': p.url,
      'og:type': p.kind === 'article' ? 'article' : 'website'
    };
    for (const k of Object.keys(want)) {
      const m = get('property', k);
      if (m.n !== 1) og.push({ where: p.file, expected: `1 ${k}`, found: `${m.n}` });
      else if (m.v !== want[k]) og.push({ where: p.file, expected: `${k} = ${String(want[k]).slice(0, 90)}`, found: String(m.v).slice(0, 90) });
    }
    const loc = get('property', 'og:locale');
    if (loc.n !== 1) locale.push({ where: p.file, expected: `1 og:locale (${S.OG_LOCALE[p.lang]})`, found: `${loc.n}` });
    else if (loc.v !== S.OG_LOCALE[p.lang]) locale.push({ where: p.file, expected: `og:locale ${S.OG_LOCALE[p.lang]}`, found: loc.v });
    const locAlt = get('property', 'og:locale:alternate');
    if (locAlt.n && locAlt.v !== S.OG_LOCALE[S.other(p.lang)]) locale.push({ where: p.file, expected: `og:locale:alternate ${S.OG_LOCALE[S.other(p.lang)]}`, found: locAlt.v });

    /* Image */
    const oi = get('property', 'og:image');
    const wantImg = p.kind === 'article'
      ? `${S.BASE}/assets/images/og/insights/${p.slug}.${p.lang}.png`
      : `${S.BASE}/assets/images/og/${p.meta}.png`;
    if (oi.n !== 1) img.push({ where: p.file, expected: '1 og:image', found: `${oi.n}` });
    else {
      if (oi.v !== wantImg) img.push({ where: p.file, expected: wantImg, found: oi.v });
      const local = String(oi.v).replace(`${S.BASE}/`, '');
      if (!String(oi.v).startsWith(`${S.BASE}/`) || !S.isFile(local)) img.push({ where: p.file, expected: 'imagen dentro del proyecto', found: oi.v });
      else {
        imagesChecked.add(local);
        const size = pngSize(S.abs(local));
        const w = get('property', 'og:image:width').v, h = get('property', 'og:image:height').v;
        if (!size) img.push({ where: local, expected: 'PNG válido', found: 'firma PNG incorrecta' });
        else if (String(size.w) !== w || String(size.h) !== h) img.push({ where: `${p.file} (${local})`, expected: `og:image:width/height = ${size.w}x${size.h} reales`, found: `${w}x${h}` });
      }
    }

    /* Twitter Cards */
    const twWant = { 'twitter:card': 'summary_large_image', 'twitter:title': wantOgTitle, 'twitter:description': wantDesc, 'twitter:image': oi.v };
    for (const k of Object.keys(twWant)) {
      const m = get('name', k);
      if (m.n !== 1) tw.push({ where: p.file, expected: `1 ${k}`, found: `${m.n}` });
      else if (m.v !== twWant[k]) tw.push({ where: p.file, expected: `${k} = ${String(twWant[k]).slice(0, 90)}`, found: String(m.v).slice(0, 90) });
    }

    /* Nothing inherited from the legacy architecture in <head> */
    const urls = metas.map(m => m.getAttribute('content')).concat(head ? head.querySelectorAll('link').map(l => l.getAttribute('href')) : [])
      .filter(u => typeof u === 'string' && /^https?:\/\/(www\.)?dynxlabs\.com/i.test(u));
    for (const u of urls) {
      const pth = u.replace(/^https?:\/\/(www\.)?dynxlabs\.com/i, '') || '/';
      if (/[?&]lang=/.test(u)) inherited.push({ where: p.file, expected: 'sin ?lang=', found: u });
      else if (!u.startsWith(`${S.BASE}/`)) inherited.push({ where: p.file, expected: 'https://dynxlabs.com/… (sin www, con https)', found: u });
      else if (!pth.startsWith('/assets/') && pth !== '/sitemap.xml' && !/^\/(es|en)(\/|$)/.test(pth)) inherited.push({ where: p.file, expected: 'URL de la nueva arquitectura (/es/ o /en/)', found: u });
    }
  }

  // ES and EN versions must not share the same description (untranslated metadata)
  for (const p of indexable.filter(x => x.lang === 'es')) {
    const twin = read[p.url.replace(`${S.BASE}/es/`, `${S.BASE}/en/`)];
    if (twin && read[p.url].desc && read[p.url].desc === twin.desc) sameText.push({ where: p.file, expected: 'description distinta en ES y EN', found: 'idéntica en ambos idiomas' });
  }
  const dupList = (map, what) => [...map.entries()].filter(([k, v]) => k && v.length > 1).map(([k, v]) => ({ where: v.join(' , '), expected: `${what} único por idioma`, found: k.slice(0, 80) }));

  report.check(G, 'MET-01', '<title> único, con contenido y en el idioma de la página', indexable.length, title);
  report.check(G, 'MET-02', 'Meta description presente y en el idioma de la página', indexable.length, desc);
  report.check(G, 'MET-03', 'Open Graph: og:title, og:description, og:url y og:type correctos', indexable.length, og);
  report.check(G, 'MET-04', 'og:locale corresponde al idioma', indexable.length, locale);
  report.check(G, 'MET-05', 'og:image correcta, dentro del proyecto, PNG válido y dimensiones declaradas reales', indexable.length, img);
  report.check(G, 'MET-06', 'Twitter Cards completas y coherentes con Open Graph', indexable.length, tw);
  report.check(G, 'MET-07', 'Sin metadatos heredados de la arquitectura anterior (?lang=, rutas sin idioma)', indexable.length, inherited);
  report.check(G, 'MET-08', 'Descriptions ES y EN no son idénticas (metadatos traducidos)', indexable.length / 2, sameText);
  report.check(G, 'MET-09', 'Sin <title> duplicados dentro de un mismo idioma', indexable.length,
    dupList(titlesByLang.es, 'title').concat(dupList(titlesByLang.en, 'title')), 'WARNING');
  report.check(G, 'MET-10', 'Sin descriptions duplicadas dentro de un mismo idioma', indexable.length,
    dupList(descByLang.es, 'description').concat(dupList(descByLang.en, 'description')), 'WARNING');

  report.note(G, 'MET-11', 'Imágenes OG de las páginas principales compartidas entre idiomas', 'WARNING',
    'Las 7 imágenes de páginas principales (assets/images/og/<página>.png) son únicas y con texto en inglés; solo los artículos tienen variante .es/.en. Estado aprobado en fases anteriores; no se sustituyen imágenes.');

  report.count('Imágenes OG distintas verificadas', imagesChecked.size);
};
