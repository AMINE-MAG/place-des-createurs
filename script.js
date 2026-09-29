/* =========================================================
   PLACE DES CRÉATEURS — script.js
   Sections : DATA · i18n · RENDER · COUNTDOWN · NAV ·
              HEADER · REVEAL · UTILS
   ========================================================= */
(() => {
  'use strict';

  /* =====================================================
     === DATA
     ===================================================== */
  const DATA_URL = 'assets/data.json';
  const STORAGE_KEY = 'pdc-lang';

  let DATA = { config: {}, i18n: { fr: {}, en: {} } };
  let currentLang = 'fr';

  async function loadData() {
    try {
      const res = await fetch(DATA_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      DATA = await res.json();
    } catch (err) {
      console.warn('[PDC] data.json introuvable, valeurs par défaut.', err);
    }
  }

  /** Résout "a.b.c" dans un objet imbriqué. */
  function get(obj, path) {
    return path.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
  }

  /* =====================================================
   === i18n
   ===================================================== */
function applyI18n(lang) {
  const dict = DATA.i18n?.[lang];
  if (!dict) {
    console.warn(`[PDC] Langue "${lang}" introuvable dans data.json.`);
    return;
  }

  currentLang = lang;
  document.documentElement.lang = lang;

  // Texte simple
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = get(dict, el.dataset.i18n);
    if (typeof v === 'string') el.textContent = v;
  });

  // aria-label
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    const v = get(dict, el.dataset.i18nAriaLabel);
    if (typeof v === 'string') el.setAttribute('aria-label', v);
  });

  // Meta
  const title = get(dict, 'meta.title');
  const desc  = get(dict, 'meta.description');
  if (title) document.title = title;
  if (desc) {
    const m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute('content', desc);
  }

  // État des boutons FR/EN
  document.querySelectorAll('.lang__btn').forEach((btn) => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  updateBurgerLabel();
}

function setLang(lang) {
  if (!DATA.i18n?.[lang]) {
    console.warn(`[PDC] setLang("${lang}") ignoré : langue absente.`);
    return;
  }

  try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}

  document.body.classList.add('is-lang-changing');

  // On applique tout dans le même tick, puis on retire la classe
  applyI18n(lang);
  renderAll();

  requestAnimationFrame(() => {
    document.body.classList.remove('is-lang-changing');
  });
}

function initLang() {
  let lang = 'fr';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && DATA.i18n?.[stored]) lang = stored;
    else if (DATA.config?.defaultLang && DATA.i18n?.[DATA.config.defaultLang]) {
      lang = DATA.config.defaultLang;
    }
  } catch (_) {}

  // Si aucune langue n'est disponible, on log une erreur explicite
  if (!DATA.i18n?.[lang]) {
    console.error(
      '[PDC] Aucune langue chargée. Vérifie que assets/data.json est bien accessible ' +
      '(lance un serveur local — pas de file://).'
    );
  }

  // Listener sur les boutons
  document.querySelectorAll('.lang__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.lang;
      if (target && target !== currentLang) setLang(target);
    });
  });

  applyI18n(lang);
}
  /* =====================================================
     === CONFIG (URLs, email, etc.)
     ===================================================== */
  function applyConfig() {
    const cfg = DATA.config || {};

    document.querySelectorAll('[data-config-href]').forEach((el) => {
      const key = el.dataset.configHref;
      const val = cfg[key];
      if (!val) return;
      if (el.hasAttribute('data-config-mailto')) el.href = `mailto:${val}`;
      else el.href = val;
    });

    document.querySelectorAll('[data-config-text]').forEach((el) => {
      const val = cfg[el.dataset.configText];
      if (val) el.textContent = val;
    });
  }

  /* =====================================================
     === RENDER (dynamiques : exposants, stands, critères)
     ===================================================== */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
  }

  function renderExhibitors() {
    const container = document.querySelector('[data-render="exhibitors"]');
    if (!container) return;
    const list = get(DATA.i18n[currentLang], 'exhibitors.list') || [];

    container.innerHTML = list.map((item) => `
      <article class="exhibitor" data-reveal>
        <svg class="exhibitor__icon" aria-hidden="true"><use href="#ico-${escapeHtml(item.icon || 'jar')}"/></svg>
        <h4 class="exhibitor__name">${escapeHtml(item.name)}</h4>
        <p class="exhibitor__spec">${escapeHtml(item.specialty)}</p>
      </article>
    `).join('');
  }

  function renderStands() {
    const container = document.querySelector('[data-render="stands"]');
    if (!container) return;
    const list = get(DATA.i18n[currentLang], 'stands.list') || [];

    container.innerHTML = list.map((s) => `
      <article class="stand">
        <header class="stand__head">
          <h4 class="stand__name">${escapeHtml(s.name)}</h4>
          <p class="stand__surface">${escapeHtml(s.surface)}</p>
        </header>
        <p class="stand__price">${escapeHtml(s.price)}</p>
        <ul class="stand__features">
          ${s.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
        </ul>
      </article>
    `).join('');
  }

  function renderEligibility() {
    const container = document.querySelector('[data-render="eligibility"]');
    if (!container) return;
    const list = get(DATA.i18n[currentLang], 'eligibility.list') || [];
    container.innerHTML = list.map((t) => `<li>${escapeHtml(t)}</li>`).join('');
  }

  function renderAll() {
    renderExhibitors();
    renderStands();
    renderEligibility();
    // Nouveaux éléments révélés après rendu → on les enregistre
    observeReveals();
  }

  /* =====================================================
     === COUNTDOWN
     ===================================================== */
  function initCountdown() {
    const target = new Date(DATA.config?.countdownTarget || '2026-12-12T10:00:00+01:00').getTime();
    if (Number.isNaN(target)) return;

    const els = {
      days:    document.querySelector('[data-count="days"]'),
      hours:   document.querySelector('[data-count="hours"]'),
      minutes: document.querySelector('[data-count="minutes"]'),
      seconds: document.querySelector('[data-count="seconds"]'),
    };
    if (!els.days) return;

    const set = (key, value) => {
      const el = els[key];
      const str = String(value).padStart(2, '0');
      if (el.textContent === str) return;
      el.textContent = str;
      if (key === 'seconds') {
        el.classList.remove('is-tick');
        // eslint-disable-next-line no-unused-expressions
        void el.offsetWidth; // restart animation
        el.classList.add('is-tick');
      }
    };

    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      set('days', d);
      set('hours', h);
      set('minutes', m);
      set('seconds', s);
    };

    tick();
    setInterval(tick, 1000);
  }

  /* =====================================================
     === NAV (burger + smooth scroll + close on click)
     ===================================================== */
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('primary-nav');

  function updateBurgerLabel() {
    if (!burger) return;
    const dict = DATA.i18n?.[currentLang] || {};
    const key = burger.getAttribute('aria-expanded') === 'true' ? 'a11y.closeMenu' : 'a11y.openMenu';
    burger.setAttribute('aria-label', dict[key] || '');
  }

  function closeNav() {
    if (!nav || !burger) return;
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    updateBurgerLabel();
  }

  function initNav() {
    if (!burger || !nav) return;

    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';
      nav.classList.toggle('is-open', !open);
      burger.setAttribute('aria-expanded', String(!open));
      updateBurgerLabel();
    });

    nav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 1023px)').matches) closeNav();
      });
    });

    // Escape closes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* =====================================================
     === HEADER (shrink on scroll)
     ===================================================== */
  function initHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    let ticking = false;

    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* =====================================================
     === SCROLL REVEAL (IntersectionObserver)
     ===================================================== */
  let revealObserver = null;

  function observeReveals() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll('[data-reveal]:not(.is-revealed)');

    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }

    targets.forEach((el) => revealObserver.observe(el));
  }

  /* =====================================================
     === TABS (programme)
     ===================================================== */
  function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    if (!tabs.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => {
          t.classList.toggle('is-active', t === tab);
          t.setAttribute('aria-selected', String(t === tab));
        });
        document.querySelectorAll('.panel').forEach((p) => {
          p.hidden = p.id !== tab.getAttribute('aria-controls');
        });
      });
    });
  }

  /* =====================================================
     === BOOT
     ===================================================== */
async function boot() {
  await loadData();

  // Garde : si data.json n'a pas chargé, on le dit clairement
  if (!DATA.i18n?.fr || !DATA.i18n?.en) {
    console.error(
      '[PDC] data.json n\'a pas pu être lu. ' +
      'Ouvre le site via un serveur local (python3 -m http.server 8000).'
    );
  }

  applyConfig();
  initLang();
  renderAll();
  initCountdown();
  initNav();
  initHeader();
  initTabs();
  observeReveals();
}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
