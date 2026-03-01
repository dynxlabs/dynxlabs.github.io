/* ============================================================
   DYNX Labs — Internationalization System
   File: assets/js/i18n.js
   Version: 1.0.0
   ============================================================ */

const I18n = (() => {

  /* ----------------------------------------------------------
     STATE
  ---------------------------------------------------------- */
  let currentLang = 'en';
  let translations = {};

  /* ----------------------------------------------------------
     SUPPORTED LANGUAGES
  ---------------------------------------------------------- */
  const SUPPORTED = ['en', 'es'];
  const DEFAULT   = 'en';

  /* ----------------------------------------------------------
     DETECT INITIAL LANGUAGE
     Priority: 1) localStorage  2) default
  ---------------------------------------------------------- */
  function detectLanguage() {
    const stored = localStorage.getItem('dynx_lang');
    if (stored && SUPPORTED.includes(stored)) return stored;
    return DEFAULT;
  }

  /* ----------------------------------------------------------
     LOAD JSON FILE FOR A GIVEN LANG
  ---------------------------------------------------------- */
  async function loadTranslations(lang) {
    try {
      const res = await fetch(`/locales/${lang}.json`);
      if (!res.ok) throw new Error(`Failed to load ${lang}.json — status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[I18n] Translation load error:', err);
      return null;
    }
  }

  /* ----------------------------------------------------------
     GET NESTED VALUE FROM OBJECT USING DOT NOTATION
     e.g. get('hero.headline1') → translations.hero.headline1
  ---------------------------------------------------------- */
  function get(key) {
    const parts = key.split('.');
    let value = translations;
    for (const part of parts) {
      if (value === undefined || value === null) return key;
      value = value[part];
    }
    return value !== undefined ? String(value) : key;
  }

  /* ----------------------------------------------------------
     REPLACE DYNAMIC TOKENS
     Supports: {year}
  ---------------------------------------------------------- */
  function processTokens(str) {
    return str.replace('{year}', new Date().getFullYear());
  }

  /* ----------------------------------------------------------
     APPLY TRANSLATIONS TO DOM
     Reads [data-i18n="key"] attributes on every element
  ---------------------------------------------------------- */
  function applyToDOM() {
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(el => {
      const key   = el.getAttribute('data-i18n');
      const raw   = get(key);
      const value = processTokens(raw);

      /* aria-label targets */
      if (el.hasAttribute('data-i18n-aria')) {
        el.setAttribute('aria-label', value);
        return;
      }

      /* placeholder targets */
      if (el.hasAttribute('data-i18n-placeholder')) {
        el.setAttribute('placeholder', value);
        return;
      }

      /* default: set textContent */
      el.textContent = value;
    });
  }

  /* ----------------------------------------------------------
     UPDATE LANG BUTTON UI
  ---------------------------------------------------------- */
  function updateLangButtons(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  /* ----------------------------------------------------------
     UPDATE HTML lang ATTRIBUTE
  ---------------------------------------------------------- */
  function updateHTMLLang(lang) {
    document.documentElement.setAttribute('lang', lang);
  }

  /* ----------------------------------------------------------
     PUBLIC: CHANGE LANGUAGE
     Called by lang buttons in the navbar
  ---------------------------------------------------------- */
  async function changeLanguage(lang) {
    if (!SUPPORTED.includes(lang)) return;
    if (lang === currentLang) return;

    const loaded = await loadTranslations(lang);
    if (!loaded) return;

    translations  = loaded;
    currentLang   = lang;

    localStorage.setItem('dynx_lang', lang);
    updateHTMLLang(lang);
    updateLangButtons(lang);
    applyToDOM();
  }

  /* ----------------------------------------------------------
     PUBLIC: INIT
     Called once on DOMContentLoaded from main.js
  ---------------------------------------------------------- */
  async function init() {
    const lang   = detectLanguage();
    const loaded = await loadTranslations(lang);

    if (!loaded) {
      console.warn('[I18n] Could not load translations. Falling back to static HTML text.');
      return;
    }

    translations  = loaded;
    currentLang   = lang;

    updateHTMLLang(lang);
    updateLangButtons(lang);
    applyToDOM();
  }

  /* ----------------------------------------------------------
     PUBLIC API
  ---------------------------------------------------------- */
  return { init, changeLanguage, get };


})();
