/* ============================================================
   DYNX Labs — i18n baking (shared)
   File: scripts/i18n-bake.js

   Single source of truth for baking translated text into a parsed
   DOM at build time. Used by scripts/build-i18n.js (main pages) and
   generate-manifest.js (article navbar/footer), so both render the
   page chrome with exactly the same rules.

   It mirrors what assets/js/i18n.js does at runtime (applyToDOM):
   data-i18n (text), data-i18n-aria, data-i18n-placeholder,
   data-i18n-content and data-i18n-label — and turns the language
   toggle buttons into real links between the two language versions.
   ============================================================ */

'use strict';

const YEAR = new Date().getFullYear();

function get(dict, key) {
  if (!key) return undefined;
  return key.split('.').reduce((v, p) => (v && typeof v === 'object' ? v[p] : undefined), dict);
}

function processTokens(str) {
  return typeof str === 'string' ? str.replace('{year}', YEAR) : str;
}

// mirrors i18n.js isInvalid: empty, or an unresolved "a.b" key string
function isInvalid(v) {
  if (v === undefined || v === null) return true;
  const s = String(v);
  if (s.trim() === '') return true;
  if (s.includes('.') && /^[a-zA-Z]+\.[a-zA-Z]/.test(s)) return true;
  return false;
}

function escapeText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* Bake every data-i18n* attribute under `root` using `dict`. */
function bakeText(root, dict) {
  // ---- data-i18n-label: aria-label from the attribute's own key ----
  root.querySelectorAll('[data-i18n-label]').forEach(el => {
    const val = processTokens(get(dict, el.getAttribute('data-i18n-label')));
    if (!isInvalid(val)) el.setAttribute('aria-label', val);
    el.removeAttribute('data-i18n-label');
  });

  // ---- data-i18n: text / aria flag / placeholder flag / content flag ----
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const val = processTokens(get(dict, el.getAttribute('data-i18n')));
    if (!isInvalid(val)) {
      if (el.hasAttribute('data-i18n-aria'))             el.setAttribute('aria-label', val);
      else if (el.hasAttribute('data-i18n-placeholder')) el.setAttribute('placeholder', val);
      else if (el.hasAttribute('data-i18n-content'))     el.setAttribute('content', val);
      else                                               el.set_content(escapeText(val));
    }
    el.removeAttribute('data-i18n');
    el.removeAttribute('data-i18n-aria');
    el.removeAttribute('data-i18n-placeholder');
    el.removeAttribute('data-i18n-content');
  });

  // ---- strip orphan i18n flags (legacy attrs with no data-i18n sibling;
  //      runtime ignores them too — the aria already came from data-i18n-label) ----
  root.querySelectorAll('[data-i18n-aria], [data-i18n-placeholder], [data-i18n-content]').forEach(el => {
    el.removeAttribute('data-i18n-aria');
    el.removeAttribute('data-i18n-placeholder');
    el.removeAttribute('data-i18n-content');
  });
}

/* Language toggle: turn buttons into real cross-language links.
   `tail` is the page path after the language prefix:
   '' (home), 'products', 'insights/<slug>/' … */
function bakeLangToggle(root, lang, tail) {
  root.querySelectorAll('.lang-btn').forEach(btn => {
    const btnLang = btn.getAttribute('data-lang');
    if (!btnLang) return;
    const label  = (btn.text || btnLang.toUpperCase()).trim();
    const active = btnLang === lang;
    const href   = `/${btnLang}/${tail}`;
    const cls    = `lang-btn${active ? ' active' : ''}`;
    btn.insertAdjacentHTML(
      'afterend',
      `<a href="${href}" class="${cls}" data-lang="${btnLang}" aria-pressed="${active}" hreflang="${btnLang}">${label}</a>`
    );
    btn.remove();
  });
}

module.exports = { YEAR, get, processTokens, isInvalid, escapeText, bakeText, bakeLangToggle };
