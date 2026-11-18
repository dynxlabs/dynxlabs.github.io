/* SEO audit — 5.8 Additional technical quality */
'use strict';

const G = '8. Calidad técnica';

const words = s => (String(s).match(/[\p{L}\p{N}]+/gu) || []).length;

module.exports = function run(ctx, report) {
  const { S, pages, locales } = ctx;
  const existing = pages.filter(p => S.isFile(p.file));

  const structure = [], h1 = [], h1multi = [], alt = [], robots = [], unbaked = [], keys = [], content = [], urls = [], mixed = [], ids = [];
  let imgs = 0, emptyAlt = 0;

  for (const p of existing) {
    const { html, root } = S.doc(p.file);

    /* structure relevant for SEO */
    if (!/^\s*<!doctype html>/i.test(html)) structure.push({ where: p.file, expected: '<!DOCTYPE html> al inicio', found: html.slice(0, 30).trim() });
    for (const tag of ['html', 'head', 'body']) {
      const n = (html.match(new RegExp(`<${tag}[\\s>]`, 'gi')) || []).length;
      if (n !== 1) structure.push({ where: p.file, expected: `1 <${tag}>`, found: `${n}` });
      if ((html.match(new RegExp(`</${tag}>`, 'gi')) || []).length !== 1) structure.push({ where: p.file, expected: `1 </${tag}>`, found: 'cierre ausente o repetido' });
    }
    const head = root.querySelector('head');
    if (!head || head.querySelectorAll('meta').filter(m => m.getAttribute('charset')).length !== 1) structure.push({ where: p.file, expected: '1 meta charset', found: 'ausente o repetido' });
    if (!head || head.querySelectorAll('meta').filter(m => m.getAttribute('name') === 'viewport').length !== 1) structure.push({ where: p.file, expected: '1 meta viewport', found: 'ausente o repetido' });
    if (head && head.querySelector('a, h1, h2, p, div')) structure.push({ where: p.file, expected: '<head> sin contenido de cuerpo', found: 'elementos de cuerpo dentro de <head>' });

    /* headings */
    const hs = root.querySelectorAll('h1');
    if (hs.length === 0 || !S.norm(hs[0].text)) h1.push({ where: p.file, expected: '1 <h1> con texto', found: hs.length ? 'vacío' : 'ausente' });
    if (hs.length > 1) h1multi.push({ where: p.file, expected: '1 <h1>', found: `${hs.length}` });

    /* images */
    for (const i of root.querySelectorAll('img')) {
      imgs++;
      const a = i.getAttribute('alt');
      if (a === undefined || a === null) alt.push({ where: `${p.file} <img src="${i.getAttribute('src')}">`, expected: 'atributo alt', found: 'ausente' });
      else if (a.trim() === '') emptyAlt++;
    }

    /* robots meta */
    const rm = head ? head.querySelectorAll('meta').filter(m => m.getAttribute('name') === 'robots') : [];
    const rc = rm.map(m => String(m.getAttribute('content') || '').toLowerCase()).join(',');
    if (rm.length > 1) robots.push({ where: p.file, expected: '1 meta robots', found: `${rm.length}` });
    if (p.indexable && /noindex|none/.test(rc)) robots.push({ where: p.file, expected: 'indexable (sin noindex)', found: rc });
    if (!p.indexable && !/noindex/.test(rc)) robots.push({ where: p.file, expected: 'noindex en la página 404', found: rc || 'sin meta robots' });

    /* content baked in the initial HTML (no JavaScript needed) */
    const left = root.querySelectorAll('[data-i18n], [data-i18n-label], [data-i18n-content], [data-i18n-aria], [data-i18n-placeholder]').length;
    if (left) unbaked.push({ where: p.file, expected: '0 atributos data-i18n sin resolver', found: `${left}` });
    const dict = locales[p.lang];
    const looksLikeKey = t => /^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9_]+)+$/.test(t) &&
      t.split('.').reduce((v, k) => (v && typeof v === 'object' ? v[k] : undefined), dict) !== undefined;
    root.querySelectorAll('title, h1, h2, h3, p, a, span, button, li, label').forEach(el => {
      const t = S.norm(el.text);
      if (t && t.length < 60 && looksLikeKey(t)) keys.push({ where: p.file, expected: 'texto traducido', found: `clave sin resolver "${t}"` });
    });

    const body = root.querySelector('body');
    const bodyClone = body ? body.text : '';
    if (p.kind === 'article') {
      const main = root.querySelector('#post-main');
      const txt = main ? main.text : '';
      const src = p.post[p.lang];
      const need = Math.floor(words(S.plain(src.body)) * 0.7);
      if (!main) content.push({ where: p.file, expected: '#post-main con el artículo', found: 'ausente' });
      else {
        if (words(txt) < need) content.push({ where: p.file, expected: `≥ ${need} palabras del artículo en el HTML inicial`, found: `${words(txt)}` });
        if (!S.norm(txt).includes(S.plain(src.title))) content.push({ where: p.file, expected: 'título del artículo en el HTML inicial', found: 'ausente' });
        if (hs.length && S.norm(hs[0].text) !== S.plain(src.title)) content.push({ where: p.file, expected: `<h1> = "${S.plain(src.title).slice(0, 60)}"`, found: S.norm(hs[0].text).slice(0, 60) });
      }
      if (/post-wait/.test(html)) content.push({ where: p.file, expected: 'sin guardia "post-wait" (oculta el contenido hasta que corre JS)', found: 'presente' });
      if (/<script[^>]+src="\/assets\/js\/insight-render\.js"/.test(html)) content.push({ where: p.file, expected: 'sin re-render en cliente del artículo', found: 'insight-render.js cargado' });
    } else if (p.kind === 'main') {
      if (words(bodyClone) < 120) content.push({ where: p.file, expected: '≥ 120 palabras en el HTML inicial', found: `${words(bodyClone)}` });
    }

    /* absolute URL hygiene */
    const attrs = [];
    root.querySelectorAll('[href], [src], [content], [action]').forEach(el => ['href', 'src', 'content', 'action'].forEach(k => {
      const v = el.getAttribute(k); if (typeof v === 'string') attrs.push([el.rawTagName, k, v]);
    }));
    for (const [tag, k, v] of attrs) {
      if (/^http:\/\/(www\.)?dynxlabs\.com/i.test(v) || /^https?:\/\/www\.dynxlabs\.com/i.test(v) || /dynxlabs\.github\.io/i.test(v)) {
        urls.push({ where: `${p.file} <${tag} ${k}>`, expected: `${S.BASE}/…`, found: v });
      }
      if (/[?&]lang=/.test(v) && /dynxlabs\.com|^\//.test(v)) urls.push({ where: `${p.file} <${tag} ${k}>`, expected: 'sin ?lang=', found: v });
      if (/^http:\/\//i.test(v) && (k === 'src' || tag === 'link')) mixed.push({ where: `${p.file} <${tag} ${k}>`, expected: 'recurso por https', found: v });
    }

    /* duplicate ids break fragment links */
    const seen = new Map();
    root.querySelectorAll('[id]').forEach(el => { const id = el.getAttribute('id'); seen.set(id, (seen.get(id) || 0) + 1); });
    [...seen.entries()].filter(([, n]) => n > 1).forEach(([id, n]) => ids.push({ where: p.file, expected: `id="${id}" único`, found: `${n} veces` }));
  }

  report.check(G, 'HTM-01', 'Estructura HTML básica (doctype, html, head, body, charset, viewport)', existing.length, structure);
  report.check(G, 'HTM-02', 'Cada página tiene un <h1> con texto', existing.length, h1);
  report.check(G, 'HTM-03', 'Un único <h1> por página', existing.length, h1multi, 'WARNING');
  report.check(G, 'HTM-04', 'Todas las imágenes tienen atributo alt', imgs, alt);
  report.check(G, 'HTM-05', 'Páginas indexables sin noindex; páginas 404 con noindex', existing.length, robots);
  report.check(G, 'HTM-06', 'Sin atributos data-i18n sin resolver (texto horneado en el HTML)', existing.length, unbaked);
  report.check(G, 'HTM-07', 'Sin claves de traducción visibles como texto', existing.length, keys);
  report.check(G, 'HTM-08', 'Contenido esencial presente en el HTML inicial (sin depender de JavaScript)', existing.length, content);
  report.check(G, 'HTM-09', 'URLs absolutas correctas (https, sin www, sin github.io, sin ?lang=)', existing.length, urls);
  report.check(G, 'HTM-10', 'Sin recursos cargados por http (contenido mixto)', existing.length, mixed);
  report.check(G, 'HTM-11', 'Sin atributos id duplicados', existing.length, ids, 'WARNING');

  report.count('Imágenes <img> verificadas', imgs);
  report.count('Imágenes con alt vacío (decorativas)', emptyAlt);
};
