/* ============================================================
   DYNX Labs — Main JavaScript
   File: assets/js/main.js
   Version: 1.0.1
   ============================================================ */

'use strict';

/* ────────────────────────────────────────────────────────────
   1. NAVBAR
────────────────────────────────────────────────────────────── */
const Navbar = (() => {

  const navbar    = document.getElementById('navbar');
  const menuBtn   = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');

  function init() {
    if (!navbar) return;

    requestAnimationFrame(() => {
      setTimeout(() => navbar.classList.add('visible'), 100);
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (menuBtn && mobileNav) {
      menuBtn.addEventListener('click', toggleMobileMenu);
    }

    if (mobileNav) {
      mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
      });
    }
  }

  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }

  function toggleMobileMenu() {
    const isOpen = mobileNav.classList.toggle('open');
    menuBtn.classList.toggle('open', isOpen);
    menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function closeMobileMenu() {
    mobileNav.classList.remove('open');
    menuBtn.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  return { init };

})();


/* ────────────────────────────────────────────────────────────
   2. SCROLL ANIMATIONS
────────────────────────────────────────────────────────────── */
const ScrollAnimations = (() => {

  function init() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
  }

  return { init };

})();


/* ────────────────────────────────────────────────────────────
   3. FAQ ACCORDION
────────────────────────────────────────────────────────────── */
const FAQ = (() => {

  function init() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(item => {
      const question = item.querySelector('.faq-question');
      if (!question) return;

      question.setAttribute('aria-expanded', 'false');
      question.addEventListener('click', () => toggle(item, items));
    });
  }

  function toggle(targetItem, allItems) {
    const isOpen = targetItem.classList.contains('open');

    allItems.forEach(item => {
      item.classList.remove('open');
      const q = item.querySelector('.faq-question');
      if (q) q.setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      targetItem.classList.add('open');
      const q = targetItem.querySelector('.faq-question');
      if (q) q.setAttribute('aria-expanded', 'true');
    }
  }

  return { init };

})();


/* ────────────────────────────────────────────────────────────
   4. MODALS
────────────────────────────────────────────────────────────── */
const Modals = (() => {

  let activeModal = null;

  function init() {
    document.querySelectorAll('[data-modal-open]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-modal-open');
        open(id);
      });
    });

    document.querySelectorAll('[data-modal-close]').forEach(btn => {
      btn.addEventListener('click', closeActive);
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeActive();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeModal) closeActive();
    });
  }

  function open(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    activeModal = modal;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const closeBtn = modal.querySelector('[data-modal-close]');
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  }

  function closeActive() {
    if (!activeModal) return;

    activeModal.classList.remove('open');
    activeModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeModal = null;
  }

  return { init, open, closeActive };

})();


/* ────────────────────────────────────────────────────────────
   5. COOKIE BANNER
────────────────────────────────────────────────────────────── */
const CookieBanner = (() => {

  const STORAGE_KEY = 'dynx_cookie_consent';
  let banner = null;

  function init() {
    banner = document.getElementById('cookie-banner');
    if (!banner) return;

    const consent = localStorage.getItem(STORAGE_KEY);
    if (consent) return;

    setTimeout(() => banner.classList.add('visible'), 1500);

    const acceptBtn  = document.getElementById('cookie-accept');
    const declineBtn = document.getElementById('cookie-decline');

    if (acceptBtn)  acceptBtn.addEventListener('click',  () => handleConsent(true));
    if (declineBtn) declineBtn.addEventListener('click', () => handleConsent(false));

    const policyLink = banner.querySelector('[data-modal-open]');
    if (policyLink) {
      policyLink.addEventListener('click', (e) => {
        e.preventDefault();
        Modals.open('modal-privacy');
      });
    }
  }

  function handleConsent(accepted) {
    localStorage.setItem(STORAGE_KEY, accepted ? 'accepted' : 'declined');
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 400);
  }

  return { init };

})();


/* ────────────────────────────────────────────────────────────
   6. SMOOTH SCROLL
────────────────────────────────────────────────────────────── */
const SmoothScroll = (() => {

  function init() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const navbarHeight = document.getElementById('navbar')?.offsetHeight || 80;
        const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 16;

        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  return { init };

})();


/* ────────────────────────────────────────────────────────────
   7. MAGNETIC BUTTONS
────────────────────────────────────────────────────────────── */
const MagneticButtons = (() => {

  const STRENGTH = 0.35;

  function init() {
    if (window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('.magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', onMove);
      btn.addEventListener('mouseleave', onLeave);
    });
  }

  function onMove(e) {
    const btn     = e.currentTarget;
    const rect    = btn.getBoundingClientRect();
    const centerX = rect.left + rect.width  / 2;
    const centerY = rect.top  + rect.height / 2;
    const deltaX  = (e.clientX - centerX) * STRENGTH;
    const deltaY  = (e.clientY - centerY) * STRENGTH;

    btn.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }

  function onLeave(e) {
    e.currentTarget.style.transform = 'translate(0, 0)';
  }

  return { init };

})();


/* ────────────────────────────────────────────────────────────
   8. LANGUAGE BUTTONS
────────────────────────────────────────────────────────────── */
const LangButtons = (() => {

  function init() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        if (lang) I18n.changeLanguage(lang);
      });
    });
  }

  return { init };

})();


/* ────────────────────────────────────────────────────────────
   9. WHATSAPP FLOAT PULSE
────────────────────────────────────────────────────────────── */
const WhatsAppFloat = (() => {

  function init() {
    const btn = document.querySelector('.whatsapp-float');
    if (!btn) return;

    const pulseTimer = setTimeout(() => {
      btn.classList.add('pulse');
    }, 3000);

    ['mouseenter', 'click'].forEach(evt => {
      btn.addEventListener(evt, () => {
        btn.classList.remove('pulse');
        clearTimeout(pulseTimer);
      }, { once: true });
    });
  }

  return { init };

})();


/* ────────────────────────────────────────────────────────────
   10. ACTIVE NAV LINK
────────────────────────────────────────────────────────────── */
const ActiveNavLink = (() => {

  function init() {
    const sections = document.querySelectorAll('section[id]');
    const links    = document.querySelectorAll('.navbar-links a[href^="#"], .mobile-nav a[href^="#"]');

    if (!sections.length || !links.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          const id = entry.target.getAttribute('id');
          links.forEach(link => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('nav-active', isActive);
          });
        });
      },
      { threshold: 0.4 }
    );

    sections.forEach(section => observer.observe(section));
  }

  return { init };

})();


/* ────────────────────────────────────────────────────────────
   INIT — DOMContentLoaded
────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {

  await I18n.init();

  Navbar.init();
  ScrollAnimations.init();
  FAQ.init();
  Modals.init();
  CookieBanner.init();
  SmoothScroll.init();
  MagneticButtons.init();
  LangButtons.init();
  WhatsAppFloat.init();
  ActiveNavLink.init();

});