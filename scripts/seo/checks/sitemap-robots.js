/* SEO audit — 5.5 Sitemap and robots.txt */
'use strict';

const G = '5. Sitemap y robots.txt';

/* Minimal well-formedness check + element tree (no external dependency).
   Supports the XML subset a sitemap uses: declaration, comments, elements,
   attributes, text. Throws with a line number on the first error. */
function parseXml(xml) {
  let i = 0;
  const line = () => xml.slice(0, i).split('\n').length;
  const fail = msg => { throw new Error(`línea ${line()}: ${msg}`); };
  const root = { name: '#root', attrs: {}, children: [], text: '' };
  const stack = [root];
  if (xml.charCodeAt(0) === 0xFEFF) i = 1;
  const decl = xml.slice(i).match(/^<\?xml\s[^?]*\?>/);
  if (!decl) fail('falta la declaración <?xml …?> al inicio');
  i += decl[0].length;
  while (i < xml.length) {
    if (xml.startsWith('<!--', i)) {
      const end = xml.indexOf('-->', i + 4);
      if (end < 0) fail('comentario sin cerrar');
      i = end + 3; continue;
    }
    if (xml[i] === '<') {
      const end = xml.indexOf('>', i);
      if (end < 0) fail('etiqueta sin cerrar');
      const tag = xml.slice(i + 1, end);
      if (tag.startsWith('/')) {
        const name = tag.slice(1).trim();
        const open = stack.pop();
        if (!open || open.name !== name) fail(`cierre </${name}> no corresponde a <${open ? open.name : '?'}>`);
        if (stack.length === 0) fail('cierre sin apertura');
      } else {
        const self = tag.endsWith('/');
        const body = self ? tag.slice(0, -1) : tag;
        const m = body.match(/^([A-Za-z_][\w:.-]*)([\s\S]*)$/);
        if (!m) fail(`etiqueta inválida <${tag.slice(0, 30)}>`);
        const attrs = {};
        let rest = m[2];
        const re = /^\s+([A-Za-z_][\w:.-]*)\s*=\s*("([^"<]*)"|'([^'<]*)')/;
        let a;
        while ((a = rest.match(re))) {
          if (attrs[a[1]] !== undefined) fail(`atributo duplicado ${a[1]}`);
          attrs[a[1]] = a[3] !== undefined ? a[3] : a[4];
          rest = rest.slice(a[0].length);
        }
        if (rest.trim() !== '') fail(`atributos mal formados en <${m[1]}>`);
        const el = { name: m[1], attrs, children: [], text: '' };
        stack[stack.length - 1].children.push(el);
        if (!self) stack.push(el);
      }
      i = end + 1; continue;
    }
    const next = xml.indexOf('<', i);
    const text = xml.slice(i, next < 0 ? xml.length : next);
    if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(text)) fail('"&" sin escapar');
    if (stack.length === 1 && text.trim() !== '') fail('texto fuera del elemento raíz');
    stack[stack.length - 1].text += text;
    i = next < 0 ? xml.length : next;
  }
  if (stack.length !== 1) fail(`elemento <${stack[stack.length - 1].name}> sin cerrar`);
  if (root.children.length !== 1) fail(`se esperaba 1 elemento raíz, hay ${root.children.length}`);
  return root.children[0];
}

const unesc = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");

/* robots.txt → Disallow/Allow rules that apply to a given user-agent (Google semantics:
   most specific group wins; within the group the longest matching rule wins, Allow on ties). */
function robotsRules(txt, agent) {
  const groups = []; let cur = null; let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const lineTxt = raw.replace(/#.*$/, '').trim();
    if (!lineTxt) continue;
    const m = lineTxt.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') {
      if (!lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(v.toLowerCase()); lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if ((k === 'allow' || k === 'disallow') && cur) cur.rules.push({ type: k, path: v });
    }
  }
  const specific = groups.filter(g => g.agents.includes(agent.toLowerCase()));
  const chosen = specific.length ? specific : groups.filter(g => g.agents.includes('*'));
  return chosen.reduce((acc, g) => acc.concat(g.rules), []);
}
function robotsAllows(rules, urlPath) {
  let best = null;
  for (const r of rules) {
    if (r.path === '') continue;                       // empty Disallow = allow all
    const re = new RegExp('^' + r.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (!re.test(urlPath)) continue;
    if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.type === 'allow')) best = r;
  }
  return !best || best.type === 'allow';
}

module.exports = function run(ctx, report) {
  const { S, pages, posts } = ctx;
  const indexable = pages.filter(p => p.indexable);
  const expected = new Set(indexable.map(p => p.url));
  // Hand-authored legal pages are in the sitemap but not in the generated model.
  S.LEGAL_PATHS.forEach(pth => expected.add(S.BASE + pth));
  const byUrl = new Map(pages.map(p => [p.url, p]));

  /* ---------- sitemap.xml ---------- */
  let tree = null;
  const wf = [];
  try { tree = parseXml(S.read('sitemap.xml')); } catch (e) { wf.push({ where: 'sitemap.xml', expected: 'XML bien formado', found: e.message }); }
  if (tree && tree.name !== 'urlset') wf.push({ where: 'sitemap.xml', expected: '<urlset>', found: `<${tree.name}>` });
  if (tree && tree.attrs.xmlns !== 'http://www.sitemaps.org/schemas/sitemap/0.9') wf.push({ where: 'sitemap.xml', expected: 'xmlns del protocolo sitemap 0.9', found: String(tree.attrs.xmlns) });
  if (tree && tree.attrs['xmlns:xhtml'] !== 'http://www.w3.org/1999/xhtml') wf.push({ where: 'sitemap.xml', expected: 'xmlns:xhtml declarado', found: String(tree.attrs['xmlns:xhtml']) });
  report.check(G, 'SMP-01', 'sitemap.xml bien formado y con los espacios de nombres correctos', 1, wf);

  const entries = tree ? tree.children.filter(c => c.name === 'url').map(u => {
    const loc = u.children.find(c => c.name === 'loc');
    const alts = {};
    const dupAlt = [];
    u.children.filter(c => c.name === 'xhtml:link').forEach(l => {
      if (alts[l.attrs.hreflang] !== undefined) dupAlt.push(l.attrs.hreflang);
      alts[l.attrs.hreflang] = unesc(l.attrs.href || '');
    });
    return { loc: loc ? unesc(loc.text.trim()) : '', alts, dupAlt, rels: u.children.filter(c => c.name === 'xhtml:link').map(l => l.attrs.rel) };
  }) : [];
  const locs = entries.map(e => e.loc);
  const locSet = new Set(locs);

  report.check(G, 'SMP-02', `Exactamente ${expected.size} URLs`, locs.length,
    locs.length !== expected.size ? [{ where: 'sitemap.xml', expected: `${expected.size} <url>`, found: `${locs.length}` }] : []);
  report.check(G, 'SMP-03', 'El sitemap contiene exactamente las URLs canónicas indexables', expected.size,
    [...expected].filter(u => !locSet.has(u)).map(u => ({ where: 'sitemap.xml', expected: u, found: 'ausente' }))
      .concat(locs.filter(u => !expected.has(u)).map(u => ({ where: 'sitemap.xml', expected: 'solo URLs del modelo aprobado', found: u }))));
  for (const [lang, id] of [['es', 'SMP-04'], ['en', 'SMP-05']]) {
    const n = locs.filter(u => u.startsWith(`${S.BASE}/${lang}/insights/`) && u !== `${S.BASE}/${lang}/insights`).length;
    report.check(G, id, `${posts.length} artículos ${lang.toUpperCase()} en el sitemap`, n,
      n !== posts.length ? [{ where: 'sitemap.xml', expected: `${posts.length}`, found: `${n}` }] : []);
  }
  const seen = new Set(), dups = [];
  locs.forEach(u => { if (seen.has(u)) dups.push({ where: 'sitemap.xml', found: `duplicada: ${u}` }); seen.add(u); });
  report.check(G, 'SMP-06', 'Sin URLs duplicadas', locs.length, dups);
  report.check(G, 'SMP-07', 'Sin URLs legacy, con parámetros, con extensión o de otro dominio', locs.length,
    locs.filter(u => !/^https:\/\/dynxlabs\.com\/(es|en)\//.test(u) || /[?#]/.test(u) || /\.html$/.test(u))
      .map(u => ({ where: 'sitemap.xml', expected: `${S.BASE}/es/… o /en/… canónica`, found: u })));

  const dead = [];
  for (const u of locs) {
    const res = S.resolvePath(u.replace(S.BASE, ''));
    const p = byUrl.get(u);
    if (res.status === 'missing' || res.status === 'redirect') { dead.push({ where: 'sitemap.xml', expected: 'página generada', found: `${u} (${res.status})` }); continue; }
    if (p && !p.indexable) dead.push({ where: 'sitemap.xml', expected: 'página indexable', found: `${u} (404/noindex)` });
    const robots = S.doc(res.file).root.querySelector('meta[name="robots"]');
    if (robots && /noindex/i.test(robots.getAttribute('content') || '')) dead.push({ where: res.file, expected: 'sin noindex', found: robots.getAttribute('content') });
  }
  report.check(G, 'SMP-08', 'Toda URL del sitemap corresponde a una página generada, indexable y no 404', locs.length, dead);

  const altProblems = [];
  const entryByLoc = new Map(entries.map(e => [e.loc, e]));
  for (const e of entries) {
    const m = e.loc.match(/^https:\/\/dynxlabs\.com\/(es|en)\/(.*)$/);
    if (!m) continue;
    // Legal pages have a different slug per language, so their alternates come from an explicit map.
    const want = S.LEGAL_ALTS[e.loc] || { es: `${S.BASE}/es/${m[2]}`, en: `${S.BASE}/en/${m[2]}`, 'x-default': `${S.BASE}/${S.XDEFAULT}/${m[2]}` };
    for (const hl of ['es', 'en', 'x-default']) {
      if (e.alts[hl] !== want[hl]) altProblems.push({ where: e.loc, expected: `${hl} → ${want[hl]}`, found: String(e.alts[hl]) });
    }
    Object.keys(e.alts).filter(k => !['es', 'en', 'x-default'].includes(k)).forEach(k => altProblems.push({ where: e.loc, expected: 'es, en, x-default', found: k }));
    e.dupAlt.forEach(k => altProblems.push({ where: e.loc, found: `hreflang duplicado: ${k}` }));
    e.rels.filter(r => r !== 'alternate').forEach(r => altProblems.push({ where: e.loc, expected: 'rel="alternate"', found: String(r) }));
    const twin = entryByLoc.get(want[m[1] === 'es' ? 'en' : 'es']);
    if (!twin || twin.alts[m[1]] !== e.loc) altProblems.push({ where: e.loc, expected: 'la versión alternativa está en el sitemap y la referencia', found: twin ? String(twin.alts[m[1]]) : 'entrada alternativa ausente' });
  }
  report.check(G, 'SMP-09', 'Alternativas hreflang del sitemap completas y recíprocas', entries.length, altProblems);

  // sitemap hreflang must equal the hreflang in the page <head>
  const mismatch = [];
  for (const e of entries) {
    const p = byUrl.get(e.loc);
    if (!p || !S.isFile(p.file)) continue;
    const head = {};
    S.doc(p.file).root.querySelectorAll('link').filter(l => l.getAttribute('rel') === 'alternate' && l.getAttribute('hreflang'))
      .forEach(l => { head[l.getAttribute('hreflang')] = l.getAttribute('href'); });
    for (const hl of ['es', 'en', 'x-default']) {
      if (head[hl] !== e.alts[hl]) mismatch.push({ where: p.file, expected: `sitemap ${hl} → ${e.alts[hl]}`, found: `HTML ${hl} → ${head[hl]}` });
    }
  }
  report.check(G, 'SMP-10', 'Hreflang del sitemap idéntico al del <head> de cada página', entries.length, mismatch);

  /* ---------- single sitemap ----------
     sitemap_index.xml was retired on 18/11/2026 after it was removed from
     Google Search Console; sitemap.xml is the only sitemap (robots.txt,
     Search Console and Bing). Any other sitemap file would be a stale copy. */
  const extraSitemaps = ['sitemap_index.xml', 'sitemap-index.xml', 'sitemap1.xml'].filter(f => S.isFile(f));
  report.check(G, 'SMP-11', 'Un único sitemap publicado (sitemap.xml); sitemap_index.xml retirado', 1,
    extraSitemaps.map(f => ({ where: f, expected: 'sin sitemaps adicionales', found: 'archivo presente' })));

  /* ---------- robots.txt ---------- */
  const robotsTxt = S.isFile('robots.txt') ? S.read('robots.txt') : null;
  const rb = [];
  if (robotsTxt === null) rb.push({ where: 'robots.txt', expected: 'archivo presente', found: 'no existe' });
  const sitemaps = robotsTxt ? (robotsTxt.match(/^\s*sitemap\s*:\s*(\S+)/gim) || []).map(l => l.replace(/^\s*sitemap\s*:\s*/i, '').trim()) : [];
  if (robotsTxt && (sitemaps.length !== 1 || sitemaps[0] !== `${S.BASE}/sitemap.xml`)) {
    rb.push({ where: 'robots.txt', expected: `Sitemap: ${S.BASE}/sitemap.xml (única)`, found: sitemaps.join(' , ') || 'sin directiva Sitemap' });
  }
  report.check(G, 'RBT-01', 'robots.txt apunta al sitemap correcto', 1, rb);

  const blocked = [];
  let tested = 0;
  if (robotsTxt) {
    const assets = ['/assets/css/styles.css', '/assets/js/i18n.js', '/assets/images/og/home.png', '/sitemap.xml'];
    for (const agent of ['*', 'Googlebot', 'Bingbot']) {
      const rules = robotsRules(robotsTxt, agent);
      for (const path of indexable.map(p => p.path).concat(assets)) {
        tested++;
        if (!robotsAllows(rules, path)) blocked.push({ where: 'robots.txt', expected: `permitido para ${agent}`, found: `bloquea ${path}` });
      }
    }
  }
  report.check(G, 'RBT-02', 'robots.txt no bloquea páginas indexables ni recursos de render (CSS, JS, imágenes)', tested, blocked);

  report.count('URLs en sitemap.xml', locs.length);
  report.count('Artículos ES en sitemap', locs.filter(u => /\/es\/insights\/[^/]+\/$/.test(u)).length);
  report.count('Artículos EN en sitemap', locs.filter(u => /\/en\/insights\/[^/]+\/$/.test(u)).length);
};

module.exports.parseXml = parseXml;
