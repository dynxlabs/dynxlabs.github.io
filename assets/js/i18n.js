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
      return;
    }

    translations = loaded;
    currentLang = lang;

    updateHTMLLang(lang);
    updateLangButtons(lang);

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
