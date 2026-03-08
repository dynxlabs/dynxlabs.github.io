/**
 * ═══════════════════════════════════════════════════════
 * DYNX Labs — Insights Logic
 * ═══════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ─── State ───────────────────────────────────────────
  let currentLang       = localStorage.getItem('dynx-lang') || 'en';
  let currentView       = localStorage.getItem('dynx-insights-view') || 'grid';
  let selectedCategories = [];
  let currentSort       = 'newest';
  let searchQuery       = '';

  // ─── View counter (localStorage) ─────────────────────
  function incrementView(slug) {
    const key = 'dynx-views-' + slug;
    const count = parseInt(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, count);
    return count;
  }

  function getViews(slug) {
    return parseInt(localStorage.getItem('dynx-views-' + slug) || '0');
  }

  function getMostRead() {
    let top = null;
    let topViews = -1;
    INSIGHTS_ARTICLES.forEach(a => {
      const v = getViews(a.slug);
      if (v > topViews) { topViews = v; top = a; }
    });
    return top;
  }

  // ─── Helpers ──────────────────────────────────────────
  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const opts = { year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString(currentLang === 'es' ? 'es-CL' : 'en-US', opts);
  }

  function getCategoryLabel(catKey) {
    const cat = INSIGHTS_CATEGORIES[catKey];
    if (!cat) return catKey;
    return cat[currentLang] || cat.en;
  }

  function getCategoryColor(catKey) {
    return (INSIGHTS_CATEGORIES[catKey] || {}).color || '#2a2a2a';
  }

  function getArticleField(article, field) {
    return (article[currentLang] || article.en)[field] || '';
  }

  // ─── Filter + Sort + Search ───────────────────────────
  function getFilteredArticles() {
    let list = [...INSIGHTS_ARTICLES];

    if (selectedCategories.length > 0) {
      list = list.filter(a => selectedCategories.includes(a.category));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(a => {
        const title   = getArticleField(a, 'title').toLowerCase();
        const summary = getArticleField(a, 'summary').toLowerCase();
        const cat     = getCategoryLabel(a.category).toLowerCase();
        return title.includes(q) || summary.includes(q) || cat.includes(q);
      });
    }

    if (currentSort === 'newest') {
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (currentSort === 'oldest') {
      list.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (currentSort === 'az') {
      list.sort((a, b) => getArticleField(a, 'title').localeCompare(getArticleField(b, 'title')));
    }

    return list;
  }

  // ─── Render Cards ─────────────────────────────────────
  function renderCards() {
    const grid = document.getElementById('insights-grid');
    if (!grid) return;

    const articles = getFilteredArticles();
    const isGrid = currentView === 'grid';

    grid.className = isGrid ? 'insights-grid' : 'insights-list';

    if (articles.length === 0) {
      grid.innerHTML = `<div class="insights-empty">
        <p>${currentLang === 'es' ? 'No se encontraron artículos.' : 'No articles found.'}</p>
      </div>`;
      return;
    }

    grid.innerHTML = articles.map(article => {
      const color   = getCategoryColor(article.category);
      const catLabel = getCategoryLabel(article.category);
      const title   = getArticleField(article, 'title');
      const summary = getArticleField(article, 'summary');
      const readTime = article.readTime[currentLang] || article.readTime.en;
      const date    = formatDate(article.date);

      return `
        <a href="/insights/${article.slug}" 
           class="insight-card ${isGrid ? 'insight-card--grid' : 'insight-card--list'}"
           data-slug="${article.slug}"
           onclick="if(typeof incrementView==='function') incrementView('${article.slug}')">
          <div class="insight-card__color-bar" style="background:${color}">
            <div class="insight-card__color-overlay"></div>
          </div>
          <div class="insight-card__body">
            <span class="insight-card__badge" style="background:${color}22; color:${color}; border-color:${color}44">
              ${catLabel}
            </span>
            <h3 class="insight-card__title">${title}</h3>
            ${isGrid ? `<p class="insight-card__summary">${summary}</p>` : ''}
            <div class="insight-card__meta">
              <span class="insight-card__date">${date}</span>
              <span class="insight-card__dot">·</span>
              <span class="insight-card__read">${readTime}</span>
            </div>
          </div>
        </a>`;
    }).join('');
  }

  // ─── Render Sidebar Filters ───────────────────────────
  function renderFilters() {
    const container = document.getElementById('insights-filters');
    if (!container) return;

    const usedCategories = [...new Set(INSIGHTS_ARTICLES.map(a => a.category))];
    const sortLabel = currentLang === 'es'
      ? { newest: 'Más reciente', oldest: 'Más antiguo', az: 'A–Z' }
      : { newest: 'Newest first', oldest: 'Oldest first', az: 'A–Z' };

    container.innerHTML = `
      <div class="filter-group">
        <button class="filter-group__header" id="sort-toggle" aria-expanded="true">
          <span>${currentLang === 'es' ? 'Ordenar por' : 'Sort by'}</span>
          <svg viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="filter-group__body" id="sort-body">
          ${['newest','oldest','az'].map(s => `
            <label class="filter-option">
              <input type="radio" name="sort" value="${s}" ${currentSort===s?'checked':''} />
              <span>${sortLabel[s]}</span>
            </label>`).join('')}
        </div>
      </div>

      <div class="filter-group">
        <button class="filter-group__header" id="cat-toggle" aria-expanded="true">
          <span>${currentLang === 'es' ? 'Categoría' : 'Category'}</span>
          <svg viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="filter-group__body" id="cat-body">
          ${usedCategories.map(cat => `
            <label class="filter-option">
              <input type="checkbox" name="category" value="${cat}"
                ${selectedCategories.includes(cat) ? 'checked' : ''} />
              <span class="filter-option__dot" style="background:${getCategoryColor(cat)}"></span>
              <span>${getCategoryLabel(cat)}</span>
            </label>`).join('')}
        </div>
      </div>`;

    // Sort toggle
    document.getElementById('sort-toggle')?.addEventListener('click', () => {
      const body = document.getElementById('sort-body');
      const btn  = document.getElementById('sort-toggle');
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !open);
      body.style.display = open ? 'none' : 'flex';
    });

    // Cat toggle
    document.getElementById('cat-toggle')?.addEventListener('click', () => {
      const body = document.getElementById('cat-body');
      const btn  = document.getElementById('cat-toggle');
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !open);
      body.style.display = open ? 'none' : 'flex';
    });

    // Sort change
    container.querySelectorAll('input[name="sort"]').forEach(input => {
      input.addEventListener('change', () => {
        currentSort = input.value;
        renderCards();
      });
    });

    // Category change
    container.querySelectorAll('input[name="category"]').forEach(input => {
      input.addEventListener('change', () => {
        selectedCategories = [...container.querySelectorAll('input[name="category"]:checked')]
          .map(i => i.value);
        renderCards();
      });
    });
  }

  // ─── Search ───────────────────────────────────────────
  function initSearch() {
    const input = document.getElementById('insights-search');
    if (!input) return;
    input.addEventListener('input', () => {
      searchQuery = input.value;
      renderCards();
    });
  }

  // ─── View Toggle (Grid / List) ─────────────────────────
  function initViewToggle() {
    const btnGrid = document.getElementById('view-grid');
    const btnList = document.getElementById('view-list');
    if (!btnGrid || !btnList) return;

    function update() {
      btnGrid.classList.toggle('active', currentView === 'grid');
      btnList.classList.toggle('active', currentView === 'list');
      localStorage.setItem('dynx-insights-view', currentView);
      renderCards();
    }

    btnGrid.addEventListener('click', () => { currentView = 'grid'; update(); });
    btnList.addEventListener('click', () => { currentView = 'list'; update(); });
    update();
  }

  // ─── Mobile Drawer ────────────────────────────────────
  function initMobileDrawer() {
    const btn     = document.getElementById('filter-drawer-btn');
    const drawer  = document.getElementById('filter-drawer');
    const overlay = document.getElementById('filter-overlay');
    const close   = document.getElementById('filter-drawer-close');
    const applyBtn = document.getElementById('filter-apply');
    if (!btn || !drawer) return;

    const open  = () => { drawer.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; };
    const closeDrawer = () => { drawer.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; };

    btn.addEventListener('click', open);
    overlay?.addEventListener('click', closeDrawer);
    close?.addEventListener('click', closeDrawer);
    applyBtn?.addEventListener('click', closeDrawer);
  }

  // ─── Result count ─────────────────────────────────────
  function updateCount() {
    const el = document.getElementById('insights-count');
    if (!el) return;
    const n = getFilteredArticles().length;
    el.textContent = currentLang === 'es'
      ? `${n} artículo${n !== 1 ? 's' : ''}`
      : `${n} article${n !== 1 ? 's' : ''}`;
  }

  // ─── Lang sync ────────────────────────────────────────
  function syncLang() {
    const stored = localStorage.getItem('dynx-lang') || 'en';
    if (stored !== currentLang) {
      currentLang = stored;
      renderFilters();
      renderCards();
      updateCount();
    }
  }

  // ─── Init ─────────────────────────────────────────────
  function init() {
    renderFilters();
    initSearch();
    initViewToggle();
    initMobileDrawer();
    renderCards();
    updateCount();

    // Re-render on lang change
    window.addEventListener('dynx-lang-changed', () => {
      currentLang = localStorage.getItem('dynx-lang') || 'en';
      renderFilters();
      renderCards();
      updateCount();
    });

    // Observe lang button clicks as fallback
    setInterval(syncLang, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for article pages
  window.DYNX_Insights = {
    getArticleBySlug: (slug) => INSIGHTS_ARTICLES.find(a => a.slug === slug),
    getRelated: (slug, limit = 4) => {
      const current = INSIGHTS_ARTICLES.find(a => a.slug === slug);
      if (!current) return [];
      return INSIGHTS_ARTICLES
        .filter(a => a.slug !== slug && a.category === current.category)
        .slice(0, limit);
    },
    getMostRead,
    incrementView,
    getViews,
    getCategoryLabel,
    getCategoryColor,
    formatDate,
    getArticleField,
    getCurrentLang: () => localStorage.getItem('dynx-lang') || 'en'
  };

})();
