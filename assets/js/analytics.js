/* ============================================================
   DYNX Labs — Google Analytics 4, consent-gated (basic Consent Mode)
   File: assets/js/analytics.js

   Privacy-first: the GA4 library is NOT loaded until the visitor
   accepts in the cookie banner (assets/js/main.js -> CookieBanner),
   so NO cookies (_ga/_ga_*) or network pings happen before consent.
   Returning visitors who already accepted are honoured on load.
   Declining never loads GA4.
   ============================================================ */
(function () {
  var ID = 'G-6DSE9JCQTK';
  var loaded = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  function loadGA() {
    if (loaded) return;
    loaded = true;
    gtag('js', new Date());
    gtag('config', ID, { anonymize_ip: true });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
  }

  // Load GA4 only if this visitor has already accepted.
  try { if (localStorage.getItem('dynx_cookie_consent') === 'accepted') loadGA(); } catch (e) {}

  // Called by the cookie banner on accept (true) / decline (false).
  // On decline GA4 is simply never loaded: no cookies, no pings.
  window.dynxSetAnalyticsConsent = function (granted) {
    if (granted) loadGA();
  };
})();
