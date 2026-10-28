/* ============================================================
   DYNX Labs — Mega Menu Header
   File: assets/js/megamenu.js
   Single source of truth for the site header (nav, mega menu,
   search modal, mobile drawer). Fully bilingual (EN/ES) and
   re-renders on `dynx-lang-changed`.
============================================================ */
(function () {
  'use strict';

  /* ---------- i18n helpers ---------- */
  function curLang() {
    const l = localStorage.getItem('dynx_lang');
    return l === 'es' ? 'es' : 'en';
  }
  let lang = curLang();
  const L = o => (o && (o[lang] != null ? o[lang] : o.en)) || '';

  /* ---------- Static bilingual data ---------- */
  const CATS = {
    'automatizacion':        { es: 'Automatización',        en: 'Automation' },
    'inteligencia-artificial': { es: 'Inteligencia Artificial', en: 'Artificial Intelligence' },
    'casos-reales':          { es: 'Casos Reales',          en: 'Real Cases' },
    'workflows':             { es: 'Workflows',             en: 'Workflows' }
  };

  const NAV = [
    {
      id: 'soluciones', label: { es: 'Soluciones', en: 'Solutions' },
      pk: { es: 'Qué hacemos', en: 'What we do' },
      primary: [
        { t: { es: 'AI Agents', en: 'AI Agents' }, h: '/#ai-agents' },
        { t: { es: 'Workflow Automation', en: 'Workflow Automation' }, h: '/#workflow' },
        { t: { es: 'Dashboards & Reporting', en: 'Dashboards & Reporting' }, h: '/#dashboards' },
        { t: { es: 'System Integrations', en: 'System Integrations' }, h: '/#integrations' },
        { t: { es: 'Business Intelligence', en: 'Business Intelligence' }, h: '/#bi' },
        { t: { es: 'Custom SaaS', en: 'Custom SaaS' }, h: '/#saas' }
      ],
      sk: { es: 'Cómo trabajamos', en: 'How we work' },
      secondary: [
        { t: { es: 'Nuestro Método', en: 'Our Method' }, h: '/#method' },
        { t: { es: 'Tecnologías', en: 'Tech Stack' }, h: '/#stack' },
        { t: { es: 'Ver todos los servicios', en: 'View all services' }, h: '/#services', arrow: true }
      ]
    },
    {
      id: 'productos', label: { es: 'Productos', en: 'Products' },
      pk: { es: 'Explora', en: 'Explore' },
      primary: [
        { t: { es: 'Visión general de Productos', en: 'Products overview' }, h: '/products' },
        { t: { es: 'Investigación (próximamente)', en: 'Research (coming soon)' }, h: '/research' }
      ],
      sk: { es: 'Mientras tanto', en: 'Meanwhile' },
      secondary: [
        { t: { es: 'Lee nuestros Insights', en: 'Read our Insights' }, h: '/insights', arrow: true },
        { t: { es: 'Hablemos de tu proyecto', en: "Let's talk about your project" }, h: '/contact', arrow: true }
      ]
    },
    {
      id: 'insights', label: { es: 'Insights', en: 'Insights' },
      pk: { es: 'Explora por tema', en: 'Explore by topic' },
      primary: [
        { t: CATS['automatizacion'], h: '/insights#automatizacion' },
        { t: CATS['inteligencia-artificial'], h: '/insights#inteligencia-artificial' },
        { t: CATS['casos-reales'], h: '/insights#casos-reales' },
        { t: CATS['workflows'], h: '/insights#workflows' },
        { t: { es: 'Ver todos los artículos', en: 'View all articles' }, h: '/insights', arrow: true }
      ],
      sk: { es: 'Últimos artículos', en: 'Latest articles' },
      secondary: []   // filled from manifest
    },
    {
      id: 'empresa', label: { es: 'Compañía', en: 'Company' },
      pk: { es: 'Sobre DYNX Labs', en: 'About DYNX Labs' },
      primary: [
        { t: { es: 'Nosotros', en: 'About Us' }, h: '/#about' },
        { t: { es: 'Liderazgo', en: 'Leadership' }, h: '/leadership' },
        { t: { es: 'Nuestro Método', en: 'Our Method' }, h: '/#method' },
        { t: { es: 'Tecnologías', en: 'Tech Stack' }, h: '/#stack' },
        { t: { es: 'FAQ', en: 'FAQ' }, h: '/faq' },
        { t: { es: 'Contacto', en: 'Contact' }, h: '/contact' }
      ],
      sk: { es: 'Conecta', en: 'Connect' },
      secondary: [
        { t: { es: 'Trabaja con Nosotros', en: 'Careers' }, h: 'https://www.linkedin.com/company/dynxlabs/jobs', ext: true },
        { t: { es: 'Inicia un proyecto', en: 'Start a project' }, h: '/contact', arrow: true }
      ]
    }
  ];

  const T = {
    es: { searchPh: 'Buscar soluciones, productos o artículos...', searchAria: 'Buscar en DYNX Labs',
          pills: { todos: 'Todos', soluciones: 'Soluciones', insights: 'Insights', empresa: 'Compañía' },
          noResults: 'Sin resultados para', select: 'Seleccionar', open: 'Abrir menú', close: 'Cerrar menú', brand: 'Buscador DYNX' },
    en: { searchPh: 'Search solutions, products or articles...', searchAria: 'Search DYNX Labs',
          pills: { todos: 'All', soluciones: 'Solutions', insights: 'Insights', empresa: 'Company' },
          noResults: 'No results for', select: 'Select', open: 'Open menu', close: 'Close menu', brand: 'DYNX Search' }
  };

  const SERVICES = [
    { t: 'AI Agents', h: '/#ai-agents' }, { t: 'Workflow Automation', h: '/#workflow' },
    { t: 'Dashboards & Reporting', h: '/#dashboards' }, { t: 'System Integrations', h: '/#integrations' },
    { t: 'Business Intelligence', h: '/#bi' }, { t: 'Custom SaaS', h: '/#saas' }
  ];
  const PAGES = [
    { t: { es: 'Inicio', en: 'Home' }, d: { es: 'Automate the Work. Accelerate the Business.', en: 'Automate the Work. Accelerate the Business.' }, h: '/' },
    { t: { es: 'Productos', en: 'Products' }, d: { es: 'Nuestra línea de productos (en desarrollo)', en: 'Our product line (in development)' }, h: '/products' },
    { t: { es: 'Investigación', en: 'Research' }, d: { es: 'Investigación aplicada (próximamente)', en: 'Applied research (coming soon)' }, h: '/research' },
    { t: { es: 'Liderazgo', en: 'Leadership' }, d: { es: 'Quién dirige DYNX Labs', en: 'Who leads DYNX Labs' }, h: '/leadership' },
    { t: { es: 'FAQ', en: 'FAQ' }, d: { es: 'Preguntas frecuentes', en: 'Frequently asked questions' }, h: '/faq' },
    { t: { es: 'Contacto', en: 'Contact' }, d: { es: 'Hablemos de tu proyecto', en: "Let's talk about your project" }, h: '/contact' }
  ];

  let ARTICLES = []; // {t:{es,en}, cat, slug} from manifest
  let SEARCH = [];   // built index

  function buildSearch() {
    SEARCH = [];
    SERVICES.forEach(s => SEARCH.push({ t: { es: s.t, en: s.t }, d: { es: 'Servicio de DYNX Labs', en: 'DYNX Labs service' }, c: 'soluciones', h: s.h }));
    PAGES.forEach(p => SEARCH.push({ t: p.t, d: p.d, c: 'empresa', h: p.h }));
    ARTICLES.forEach(a => SEARCH.push({ t: a.t, d: CATS[a.cat] || { es: a.cat, en: a.cat }, c: 'insights', h: '/insights/' + a.slug }));
  }

  /* ---------- SVG snippets ---------- */
  const SVG = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    arrow: '<svg class="mm-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    ext: '<svg class="mm-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>',
    hamb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    chev: '<svg class="mm-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
  };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function linkAttrs(it) { return it.ext ? ' target="_blank" rel="noopener noreferrer"' : ''; }
  function itemIcon(it) { return it.ext ? SVG.ext : (it.arrow ? SVG.arrow : ''); }

  /* ---------- DOM refs ---------- */
  let hdr, navWrap, mega, backdrop, searchEl, searchInput, resultsEl, pillsEl, drawer;
  let activeId = null, closeTimer = null;
  let pill = 'todos', activeRes = -1, curResults = [];

  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

  /* ---------- Build chrome (once) ---------- */
  function buildChrome() {
    hdr = document.getElementById('navbar');
    navWrap = document.getElementById('mm-nav');
    mega = document.getElementById('mm-mega');
    if (!hdr || !navWrap || !mega) return false;

    backdrop = document.createElement('div');
    backdrop.id = 'mm-backdrop'; backdrop.className = 'mm-backdrop';
    document.body.appendChild(backdrop);

    searchEl = document.createElement('div');
    searchEl.id = 'mm-search'; searchEl.className = 'mm-search'; searchEl.setAttribute('role', 'dialog');
    searchEl.setAttribute('aria-modal', 'true');
    searchEl.innerHTML =
      '<div class="mm-search-box" role="document">' +
        '<div class="mm-search-top">' +
          '<span class="mm-ic20">' + SVG.search + '</span>' +
          '<input id="mm-search-input" type="text" autocomplete="off">' +
          '<button class="mm-esc" id="mm-search-esc">ESC</button>' +
        '</div>' +
        '<div class="mm-pills" id="mm-pills"></div>' +
        '<div class="mm-results" id="mm-results"></div>' +
        '<div class="mm-search-foot"><span id="mm-foot-select"></span><span id="mm-foot-brand"></span></div>' +
      '</div>';
    document.body.appendChild(searchEl);
    searchInput = searchEl.querySelector('#mm-search-input');
    resultsEl = searchEl.querySelector('#mm-results');
    pillsEl = searchEl.querySelector('#mm-pills');

    drawer = document.createElement('div');
    drawer.id = 'mm-drawer'; drawer.className = 'mm-drawer'; drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    document.body.appendChild(drawer);
    return true;
  }

  /* ---------- Render NAV buttons ---------- */
  function renderNav() {
    navWrap.innerHTML = '';
    NAV.forEach(sec => {
      const b = document.createElement('button');
      b.className = 'mm-navbtn'; b.textContent = L(sec.label);
      b.dataset.id = sec.id;
      b.setAttribute('aria-haspopup', 'true'); b.setAttribute('aria-expanded', 'false');
      b.addEventListener('mouseenter', () => openMega(sec.id));
      b.addEventListener('click', () => { activeId === sec.id ? closeMega() : openMega(sec.id); });
      navWrap.appendChild(b);
    });
    const s = document.createElement('button');
    s.className = 'mm-icon mm-nav-search'; s.setAttribute('aria-label', T[lang].searchAria);
    s.title = 'Ctrl / Cmd + K'; s.innerHTML = SVG.search;
    s.addEventListener('click', openSearch);
    navWrap.appendChild(s);
  }

  /* ---------- Mega menu ---------- */
  function megaHTML(sec) {
    const col = (items, big) => items.map(it =>
      '<li><a class="' + (big ? 'mm-p-link' : 'mm-s-link' + (it.arrow || it.ext ? '' : ' mm-s-sub')) + '" href="' + esc(it.h) + '"' + linkAttrs(it) + '>' +
      '<span>' + esc(L(it.t)) + '</span>' + itemIcon(it) + '</a></li>').join('');
    return '<div class="mm-mega-inner">' +
      '<div class="mm-col-p"><div class="mm-kick">' + esc(L(sec.pk)) + '</div><ul>' + col(sec.primary, true) + '</ul></div>' +
      '<div class="mm-col-s"><div class="mm-kick">' + esc(L(sec.sk)) + '</div><ul>' + col(sec.secondary, false) + '</ul></div>' +
      '</div>';
  }
  function openMega(id) {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    const sec = NAV.find(s => s.id === id); if (!sec) return;
    activeId = id;
    mega.innerHTML = megaHTML(sec);
    mega.classList.add('show'); hdr.classList.add('mm-open'); backdrop.classList.add('show');
    navWrap.querySelectorAll('.mm-navbtn').forEach(b => {
      const on = b.dataset.id === id; b.classList.toggle('active', on); b.setAttribute('aria-expanded', on);
    });
  }
  function closeMega() {
    activeId = null; mega.classList.remove('show'); hdr.classList.remove('mm-open'); backdrop.classList.remove('show');
    navWrap.querySelectorAll('.mm-navbtn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-expanded', 'false'); });
  }

  /* ---------- Search ---------- */
  const PILLKEYS = ['todos', 'soluciones', 'insights', 'empresa'];
  function renderPills() {
    pillsEl.innerHTML = '';
    PILLKEYS.forEach(k => {
      const b = document.createElement('button');
      b.className = 'mm-pill' + (pill === k ? ' on' : ''); b.textContent = T[lang].pills[k];
      b.addEventListener('click', () => { pill = k; renderPills(); runSearch(); });
      pillsEl.appendChild(b);
    });
  }
  function runSearch() {
    const q = norm(searchInput.value); const toks = q.split(/\s+/).filter(Boolean);
    curResults = SEARCH.filter(it => {
      if (pill !== 'todos' && it.c !== pill) return false;
      if (!toks.length) return true;
      const hay = norm(L(it.t) + ' ' + L(it.d) + ' ' + it.c);
      return toks.every(t => hay.includes(t));
    });
    activeRes = curResults.length ? 0 : -1;
    drawResults();
  }
  function drawResults() {
    if (!curResults.length) {
      resultsEl.innerHTML = '<div class="mm-empty">' + esc(T[lang].noResults) + ' “' + esc(searchInput.value) + '”</div>';
      return;
    }
    resultsEl.innerHTML = curResults.map((it, i) =>
      '<a class="mm-res' + (i === activeRes ? ' active' : '') + '" href="' + esc(it.h) + '" data-i="' + i + '">' +
      '<span class="mm-res-main"><span class="mm-res-t">' + esc(L(it.t)) + ' <span class="mm-tag">' + esc(T[lang].pills[it.c] || it.c) + '</span></span>' +
      '<span class="mm-res-d">' + esc(L(it.d)) + '</span></span>' +
      '<svg class="mm-res-ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>'
    ).join('');
    resultsEl.querySelectorAll('.mm-res').forEach(r => {
      r.addEventListener('mousemove', () => { activeRes = +r.dataset.i; markActive(); });
    });
  }
  function markActive() { resultsEl.querySelectorAll('.mm-res').forEach((r, i) => r.classList.toggle('active', i === activeRes)); }
  function scrollActive() { const el = resultsEl.querySelector('.mm-res.active'); if (el) el.scrollIntoView({ block: 'nearest' }); }
  function openSearch() {
    closeMega();
    searchEl.classList.add('show'); document.body.classList.add('mm-lock');
    pill = 'todos'; searchInput.value = ''; searchInput.placeholder = T[lang].searchPh; renderPills(); runSearch();
    setTimeout(() => searchInput.focus(), 40);
  }
  function closeSearch() { searchEl.classList.remove('show'); if (!anyModal()) document.body.classList.remove('mm-lock'); }

  /* ---------- Mobile drawer ---------- */
  function renderDrawer() {
    const secs = NAV.map(sec => {
      const link = it => '<a href="' + esc(it.h) + '"' + linkAttrs(it) + '><span>' + esc(L(it.t)) + '</span>' + itemIcon(it) + '</a>';
      return '<div class="mm-dsec">' +
        '<button class="mm-dsec-h" aria-expanded="false"><span>' + esc(L(sec.label)) + '</span>' + SVG.chev + '</button>' +
        '<div class="mm-dsec-b">' +
          '<div class="mm-dkick">' + esc(L(sec.pk)) + '</div>' + sec.primary.map(link).join('') +
          '<div class="mm-dkick mm-dkick2">' + esc(L(sec.sk)) + '</div>' + sec.secondary.map(link).join('') +
        '</div></div>';
    }).join('');
    drawer.innerHTML =
      '<div class="mm-dtop">' +
        '<a href="/" class="mm-dlogo" aria-label="DYNX Labs"><img src="/assets/icons/logo.svg" alt="DYNX Labs" width="112" height="30"></a>' +
        '<button class="mm-icon" id="mm-drawer-close" aria-label="' + esc(T[lang].close) + '">' + SVG.close + '</button>' +
      '</div>' +
      '<div class="mm-dsearch"><button id="mm-drawer-search">' + SVG.search + '<span>' + esc(T[lang].searchAria) + '...</span></button></div>' +
      '<div class="mm-dsecs">' + secs + '</div>' +
      '<div class="mm-dfoot">' +
        '<div class="mm-dlang" id="mm-dlang">' +
          '<button data-lang="es"' + (lang === 'es' ? ' class="on"' : '') + '>Español</button>' +
          '<button data-lang="en"' + (lang === 'en' ? ' class="on"' : '') + '>English</button>' +
        '</div>' +
        '<a href="/contact" class="mm-dcta">' + (lang === 'es' ? 'Iniciar Proyecto' : 'Start Project') + ' ↗</a>' +
      '</div>';
    drawer.querySelectorAll('.mm-dsec-h').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = btn.parentElement; const open = sec.classList.toggle('open');
        btn.setAttribute('aria-expanded', open);
      });
    });
    drawer.querySelector('#mm-drawer-close').addEventListener('click', closeDrawer);
    drawer.querySelector('#mm-drawer-search').addEventListener('click', () => { closeDrawer(); openSearch(); });
    drawer.querySelectorAll('#mm-dlang button').forEach(b => b.addEventListener('click', () => { setLang(b.dataset.lang, true); }));
    drawer.querySelectorAll('.mm-dsecs a').forEach(a => a.addEventListener('click', e => onLinkClick(e, a, closeDrawer)));
  }
  function openDrawer() { renderDrawer(); drawer.classList.add('show'); document.body.classList.add('mm-lock'); }
  function closeDrawer() { drawer.classList.remove('show'); if (!anyModal()) document.body.classList.remove('mm-lock'); }

  /* ---------- Same-page smooth scroll for hash links ---------- */
  function onLinkClick(e, a, closeFn) {
    const href = a.getAttribute('href') || '';
    const hashIdx = href.indexOf('#');
    if (hashIdx < 0) return; // normal navigation
    const path = href.slice(0, hashIdx) || '/';
    const hash = href.slice(hashIdx);
    const here = location.pathname.replace(/index\.html$/, '') || '/';
    const target = path.replace(/index\.html$/, '') || '/';
    if (here === target) {
      let el;
      try { el = document.querySelector(hash); } catch (_) { el = null; }
      if (el) {
        e.preventDefault();
        if (closeFn) closeFn();
        const offset = (hdr ? hdr.offsetHeight : 64) + 16;
        // offsetTop chain = layout position, unaffected by CSS transforms (fade-up)
        let y = 0, node = el;
        while (node) { y += node.offsetTop; node = node.offsetParent; }
        window.scrollTo({ top: Math.max(0, y - offset), behavior: 'smooth' });
        history.replaceState(null, '', hash);
      }
    }
  }

  function anyModal() { return searchEl.classList.contains('show') || drawer.classList.contains('show'); }

  /* ---------- Language ---------- */
  function setLang(l, propagate) {
    l = (l === 'es') ? 'es' : 'en';
    if (propagate && window.I18n && typeof I18n.changeLanguage === 'function' && l !== lang) {
      I18n.changeLanguage(l); // will re-fire the event that calls applyLang
      return;
    }
    applyLang(l);
  }
  function applyLang(l) {
    lang = l;
    renderNav();
    if (activeId) openMega(activeId);
    if (searchEl.classList.contains('show')) { searchInput.placeholder = T[lang].searchPh; renderPills(); runSearch(); }
    else { searchInput.placeholder = T[lang].searchPh; }
    searchEl.querySelector('#mm-foot-select').textContent = '↵ ' + T[lang].select;
    searchEl.querySelector('#mm-foot-brand').textContent = T[lang].brand;
    if (drawer.classList.contains('show')) renderDrawer();
    const navSearch = navWrap.querySelector('.mm-nav-search'); if (navSearch) navSearch.setAttribute('aria-label', T[lang].searchAria);
  }

  /* ---------- Wire static + global events ---------- */
  function wire() {
    navWrap.addEventListener('mouseleave', () => { closeTimer = setTimeout(closeMega, 180); });
    mega.addEventListener('mouseenter', () => { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } });
    mega.addEventListener('mouseleave', () => { closeTimer = setTimeout(closeMega, 180); });
    mega.addEventListener('click', e => { const a = e.target.closest('a'); if (a) onLinkClick(e, a, closeMega); });
    backdrop.addEventListener('click', closeMega);

    searchInput.addEventListener('input', runSearch);
    searchEl.querySelector('#mm-search-esc').addEventListener('click', closeSearch);
    searchEl.addEventListener('click', e => { if (e.target === searchEl) closeSearch(); });
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (curResults.length) { activeRes = (activeRes + 1) % curResults.length; markActive(); scrollActive(); } }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (curResults.length) { activeRes = (activeRes - 1 + curResults.length) % curResults.length; markActive(); scrollActive(); } }
      else if (e.key === 'Enter') { if (activeRes >= 0 && curResults[activeRes]) { window.location.href = curResults[activeRes].h; } }
    });

    const sm = document.getElementById('mm-search-m'); if (sm) sm.addEventListener('click', openSearch);
    const hb = document.getElementById('mm-hamb'); if (hb) hb.addEventListener('click', openDrawer);

    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') {
        if (searchEl.classList.contains('show')) closeSearch();
        else if (drawer.classList.contains('show')) closeDrawer();
        else if (activeId) closeMega();
      }
    });

    window.addEventListener('dynx-lang-changed', e => { applyLang((e.detail === 'es') ? 'es' : 'en'); });
  }

  /* ---------- Load manifest (articles) ---------- */
  function loadArticles() {
    fetch('/insights/manifest.json').then(r => r.ok ? r.json() : null).then(data => {
      if (!data || !data.articles) return;
      ARTICLES = data.articles.map(a => ({
        slug: a.slug, cat: a.category,
        t: { es: (a.es && a.es.title) || a.slug, en: (a.en && a.en.title) || a.slug }
      }));
      NAV.find(s => s.id === 'insights').secondary = ARTICLES.slice(0, 4).map(a => ({ t: a.t, h: '/insights/' + a.slug }));
      buildSearch();
      if (activeId === 'insights') openMega('insights');
      if (searchEl.classList.contains('show')) runSearch();
      if (drawer.classList.contains('show')) renderDrawer();
    }).catch(() => {});
  }

  /* ---------- Init ---------- */
  function init() {
    if (!buildChrome()) return;
    buildSearch();
    renderNav();
    searchInput.placeholder = T[lang].searchPh;
    searchEl.querySelector('#mm-foot-select').textContent = '↵ ' + T[lang].select;
    searchEl.querySelector('#mm-foot-brand').textContent = T[lang].brand;
    wire();
    loadArticles();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
