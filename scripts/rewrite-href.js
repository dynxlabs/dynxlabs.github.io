/* ============================================================
   DYNX Labs — Internal-link localizer (shared)
   File: scripts/rewrite-href.js

   Single source of truth for rewriting a site-internal link to its
   same-language equivalent (/es/… or /en/…). Used by both
   scripts/build-i18n.js (main pages) and generate-manifest.js
   (article navbar/footer), so the rules never diverge.

   Leaves untouched: external links, mailto/tel/sms, same-page #anchors,
   assets and static resources, and links that are ALREADY localized
   (so it is idempotent and never produces /es/es/…). Query strings and
   #fragments are preserved.
   ============================================================ */

'use strict';

function rewriteHref(href, lang) {
  if (!href) return href;
  if (href.startsWith('#')) return href;                      // same-page anchor

  // Privacy policy uses a different slug per language (/es/privacidad vs /en/privacy);
  // map the language-neutral token here so every page links to the right one.
  if (href === '/privacy-policy') return lang === 'es' ? '/es/privacidad/' : '/en/privacy/';
  if (href === '/terms-of-service') return lang === 'es' ? '/es/terminos/' : '/en/terms/';
  // Cookie policy = the cookies section of the privacy policy.
  if (href === '/cookie-policy') return lang === 'es' ? '/es/privacidad/#sec-6' : '/en/privacy/#sec-6';

  const sameOrigin = href.match(/^https?:\/\/(?:www\.)?dynxlabs\.com(\/[^\s]*)?$/i);
  if (/^(mailto:|tel:|sms:|https?:)/i.test(href) && !sameOrigin) return href; // external
  if (sameOrigin) href = sameOrigin[1] || '/';                // reduce our own absolute URL to a path

  if (!href.startsWith('/')) return href;
  if (/^\/(es|en)(\/|#|$)/.test(href)) return href;           // already localized → idempotent
  if (/^\/(assets|favicon|site\.webmanifest|robots\.txt|sitemap|locales)/i.test(href)) return href; // static

  if (href === '/') return `/${lang}/`;
  if (href.startsWith('/#')) return `/${lang}/${href.slice(1)}`; // "/#about" → "/es/#about"
  return `/${lang}/${href.replace(/^\/+/, '')}`;                 // "/products", "/insights#cat", "/x?y=1" …
}

module.exports = { rewriteHref };
