/* ============================================================
   DYNX Labs — Landing: latest insights
   File: assets/js/landing.js
   Renders the 3 most recent articles from /insights/manifest.json
   and re-renders on `dynx-lang-changed`.
   ============================================================ */

'use strict';

(() => {
  const box = document.getElementById('lp-ins');
  if (!box) return;

  const curLang = () => {
    const l = localStorage.getItem('dynx_lang');
    return l === 'es' || l === 'en' ? l : 'en';
  };

  let data = null;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = (o, lang) => (o && (o[lang] != null ? o[lang] : o.en)) || '';

  function fmtDate(d, lang) {
    const x = new Date(d + 'T00:00:00');
    if (isNaN(x)) return '';
    return x.toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function render(lang) {
    if (!data) return;
    const cats = data.categories || {};
    box.innerHTML = (data.articles || []).slice(0, 3).map((a, i) => {
      const cat = cats[a.category] ? pick(cats[a.category], lang) : a.category;
      const title = (a[lang] && a[lang].title) || (a.en && a.en.title) || a.slug;
      const meta = [fmtDate(a.date, lang), pick(a.readTime, lang)].filter(Boolean).map(esc).join(' &middot; ');
      return '<a class="lp-ic" href="/insights/' + encodeURIComponent(a.slug) + '">' +
        '<div class="lp-cover" aria-hidden="true"><span class="lp-cv-p"></span><i class="lp-cv-g"></i>' +
        '<span class="lp-cv-n">0' + (i + 1) + '</span><span class="lp-cv-c">' + esc(cat) + '</span></div>' +
        '<div class="lp-meta">' + meta + '</div><h3>' + esc(title) + '</h3></a>';
    }).join('');
  }

  fetch('/insights/manifest.json')
    .then(r => (r.ok ? r.json() : null))
    .then(d => { if (d) { data = d; render(curLang()); } })
    .catch(() => {});

  window.addEventListener('dynx-lang-changed', e => render((e && e.detail) || curLang()));
})();
