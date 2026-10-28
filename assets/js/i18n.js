/* ============================================================
   DYNX Labs — Internationalization System (FIXED)
   File: assets/js/i18n.js
   Version: 1.1.0 (production-safe)
============================================================ */

const I18n = (() => {

  /* ----------------------------------------------------------
     STATE
  ---------------------------------------------------------- */
  let currentLang = 'en';
  let translations = {};

  const SUPPORTED = ['en', 'es'];
  const DEFAULT = 'en';
  const SITE = 'https://dynxlabs.com';

  // ?lang= in the URL wins (shareable, and how search engines reach the
  // Spanish version). Persist it right away, before other scripts read it.
  (function persistUrlLang() {
    try {
      const q = new URLSearchParams(window.location.search).get('lang');
      if (q && SUPPORTED.includes(q)) localStorage.setItem('dynx_lang', q);
    } catch (e) { /* storage unavailable */ }
  })();

  /* ----------------------------------------------------------
     DETECT LANGUAGE
  ---------------------------------------------------------- */
  function detectLanguage() {
    const stored = localStorage.getItem('dynx_lang');
    if (stored && SUPPORTED.includes(stored)) return stored;
    return DEFAULT;
  }

  /* ----------------------------------------------------------
     LOAD TRANSLATIONS
  ---------------------------------------------------------- */
  async function loadTranslations(lang) {
    try {
      const res = await fetch(`/locales/${lang}.json`);
      if (!res.ok) throw new Error(`Failed ${lang}.json (${res.status})`);
      return await res.json();
    } catch (err) {
      console.error('[I18n] load error:', err);
      return null;
    }
  }

  /* ----------------------------------------------------------
     SAFE GET (NO KEYS LEAKING)
  ---------------------------------------------------------- */
  function get(key) {
    const parts = key.split('.');
    let value = translations;

    for (const part of parts) {
      if (!value || typeof value !== 'object') return '';
      value = value[part];
    }

    if (value === undefined || value === null) return '';
    return String(value);
  }

  /* ----------------------------------------------------------
     TOKENS
  ---------------------------------------------------------- */
  function processTokens(str) {
    if (typeof str !== 'string') return '';
    return str.replace('{year}', new Date().getFullYear());
  }

  /* ----------------------------------------------------------
     VALIDATION (prevents showing broken keys)
  ---------------------------------------------------------- */
  function isInvalid(value) {
    if (!value) return true;
    if (value.trim() === '') return true;
    if (value.includes('.') && /^[a-zA-Z]+\.[a-zA-Z]/.test(value)) return true;
    return false;
  }

  /* ----------------------------------------------------------
     APPLY TO DOM
  ---------------------------------------------------------- */
  function applyToDOM() {
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;

      const raw = get(key);
      const value = processTokens(raw);

      // aria-label
      if (el.hasAttribute('data-i18n-aria')) {
        if (!isInvalid(value)) {
          el.setAttribute('aria-label', value);
        }
        return;
      }

      // placeholder
      if (el.hasAttribute('data-i18n-placeholder')) {
        if (!isInvalid(value)) {
          el.setAttribute('placeholder', value);
        }
        return;
      }

      // meta content (description, og:*, twitter:*)
      if (el.hasAttribute('data-i18n-content')) {
        if (!isInvalid(value)) {
          el.setAttribute('content', value);
        }
        return;
      }

      // text
      if (!isInvalid(value)) {
        el.textContent = value;
      }
    });
  }

  /* ----------------------------------------------------------
     UI HELPERS
  ---------------------------------------------------------- */
  function updateLangButtons(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const active = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function updateHTMLLang(lang) {
    document.documentElement.setAttribute('lang', lang);
  }

  /* ----------------------------------------------------------
     URL + SEO: keep ?lang= in the address bar and point the
     canonical at the current language version
  ---------------------------------------------------------- */
  function syncURL(lang) {
    try {
      const url = new URL(window.location.href);
      if (lang === DEFAULT) url.searchParams.delete('lang');
      else url.searchParams.set('lang', lang);
      if (url.href !== window.location.href) history.replaceState(history.state, '', url.href);
    } catch (e) { /* non-http context */ }
  }

  function updateSEO(lang) {
    const query = lang === DEFAULT ? '' : `?lang=${lang}`;
    const href = SITE + window.location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') + query;

    // Pages that manage their own canonical (insight articles) are left alone.
    if (!document.documentElement.hasAttribute('data-own-canonical')) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = href;
      const og = document.querySelector('meta[property="og:url"]');
      if (og) og.setAttribute('content', href);
    }

    const locale = document.querySelector('meta[property="og:locale"]');
    if (locale) locale.setAttribute('content', lang === 'es' ? 'es_ES' : 'en_US');
  }

  /* ----------------------------------------------------------
     CHANGE LANGUAGE
  ---------------------------------------------------------- */
  async function changeLanguage(lang) {
    if (!SUPPORTED.includes(lang)) return;
    if (lang === currentLang) return;

    const loaded = await loadTranslations(lang);
    if (!loaded) return;

    translations = loaded;
    currentLang = lang;

    localStorage.setItem('dynx_lang', lang);

    updateHTMLLang(lang);
    updateLangButtons(lang);
    applyToDOM();
    syncURL(lang);
    updateSEO(lang);

    window.dispatchEvent(
      new CustomEvent('dynx-lang-changed', { detail: lang })
    );
  }

  /* ----------------------------------------------------------
     INIT (SAFE MODE)
  ---------------------------------------------------------- */
  async function init() {
    const lang = detectLanguage();
    const loaded = await loadTranslations(lang);

    if (!loaded) {
      console.warn('[I18n] fallback mode (no translations loaded)');
      translations = {};
      applyToDOM(); // no crash, keep static HTML
      updateSEO(DEFAULT);
      return;
    }

    translations = loaded;
    currentLang = lang;

    updateHTMLLang(lang);
    updateLangButtons(lang);
    syncURL(lang);
    updateSEO(lang);

    // important: wait next tick to ensure DOM is ready
    requestAnimationFrame(() => {
      applyToDOM();
    });
  }

  /* ----------------------------------------------------------
     PUBLIC API
  ---------------------------------------------------------- */
  return { init, changeLanguage, get };

})();
