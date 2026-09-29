/* =========================================================
   PLACE DES CRÉATEURS — script.js
   ========================================================= */
(function () {
  'use strict';

  var DATA_URL = 'assets/data.json';
  var STORAGE_KEY = 'pdc-lang';

  var DATA = { config: {}, i18n: { fr: {}, en: {} } };
  var currentLang = 'fr';
  var DATA_LOADED = false;

  function log() {
    var a = Array.prototype.slice.call(arguments);
    a.unshift('[PDC]');
    console.log.apply(console, a);
  }

  function get(obj, path) {
    var parts = path.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function loadData() {
    return fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        DATA = json;
        DATA_LOADED = true;
        log('data.json chargé. Langues:', Object.keys(DATA.i18n || {}));
      })
      .catch(function (err) {
        console.error('[PDC] data.json KO:', err);
      });
  }

  function applyI18n(lang) {
    var dict = DATA.i18n && DATA.i18n[lang];
    if (!dict) {
      console.warn('[PDC] langue absente:', lang);
      return;
    }
    currentLang = lang;
    document.documentElement.lang = lang;

    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var v = get(dict, nodes[i].getAttribute('data-i18n'));
      if (typeof v === 'string') nodes[i].textContent = v;
    }

    var aria = document.querySelectorAll('[data-i18n-aria-label]');
    for (var j = 0; j < aria.length; j++) {
      var av = get(dict, aria[j].getAttribute('data-i18n-aria-label'));
      if (typeof av === 'string') aria[j].setAttribute('aria-label', av);
    }

    var t = get(dict, 'meta.title');
    if (t) document.title = t;
    var d = get(dict, 'meta.description');
    if (d) {
      var meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', d);
    }

    var btns = document.querySelectorAll('.lang__btn');
    for (var k = 0; k < btns.length; k++) {
      var on = btns[k].getAttribute('data-lang') === lang;
      btns[k].classList.toggle('is-active', on);
      btns[k].setAttribute('aria-pressed', String(on));
    }

    updateBurgerLabel();
    log('langue appliquée:', lang);
  }

  function setLang(lang) {
    if (!DATA.i18n || !DATA.i18n[lang]) {
      console.warn('[PDC] setLang refusé:', lang);
      return;
    }
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    applyI18n(lang);
    renderAll();
  }

  function initLang() {
    var lang = 'fr';
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s && DATA.i18n && DATA.i18n[s]) lang = s;
    } catch (e) {}

    var btns = document.querySelectorAll('.lang__btn');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var target = btn.getAttribute('data-lang');
          log('clic sur', target);
          if (target && target !== currentLang) setLang(target);
        });
      })(btns[i]);
    }
    applyI18n(lang);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderExhibitors() {
    var c = document.querySelector('[data-render="exhibitors"]');
    if (!c) return;
    var list = get(DATA.i18n[currentLang], 'exhibitors.list') || [];
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      html += '<article class="exhibitor" data-reveal>'
        + '<svg class="exhibitor__icon" aria-hidden="true"><use href="#ico-' + escapeHtml(it.icon || 'jar') + '"/></svg>'
        + '<h4 class="exhibitor__name">' + escapeHtml(it.name) + '</h4>'
        + '<p class="exhibitor__spec">' + escapeHtml(it.specialty) + '</p>'
        + '</article>';
    }
    c.innerHTML = html;
  }

  function renderStands() {
    var c = document.querySelector('[data-render="stands"]');
    if (!c) return;
    var list = get(DATA.i18n[currentLang], 'stands.list') || [];
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      var feats = '';
      for (var j = 0; j < s.features.length; j++) {
        feats += '<li>' + escapeHtml(s.features[j]) + '</li>';
      }
      html += '<article class="stand">'
        + '<header class="stand__head">'
        + '<h4 class="stand__name">' + escapeHtml(s.name) + '</h4>'
        + '<p class="stand__surface">' + escapeHtml(s.surface) + '</p>'
        + '</header>'
        + '<p class="stand__price">' + escapeHtml(s.price) + '</p>'
        + '<ul class="stand__features">' + feats + '</ul>'
        + '</article>';
    }
    c.innerHTML = html;
  }

  function renderEligibility() {
    var c = document.querySelector('[data-render="eligibility"]');
    if (!c) return;
    var list = get(DATA.i18n[currentLang], 'eligibility.list') || [];
    var html = '';
    for (var i = 0; i < list.length; i++) {
      html += '<li>' + escapeHtml(list[i]) + '</li>';
    }
    c.innerHTML = html;
  }

  function renderAll() {
    renderExhibitors();
    renderStands();
    renderEligibility();
    observeReveals();
  }

  function applyConfig() {
    var cfg = DATA.config || {};
    var links = document.querySelectorAll('[data-config-href]');
    for (var i = 0; i < links.length; i++) {
      var key = links[i].getAttribute('data-config-href');
      var val = cfg[key];
      if (!val) continue;
      if (links[i].hasAttribute('data-config-mailto')) links[i].href = 'mailto:' + val;
      else links[i].href = val;
    }
    var texts = document.querySelectorAll('[data-config-text]');
    for (var j = 0; j < texts.length; j++) {
      var v = cfg[texts[j].getAttribute('data-config-text')];
      if (v) texts[j].textContent = v;
    }
  }

  function initCountdown() {
    var targetStr = (DATA.config && DATA.config.countdownTarget) || '2026-12-12T10:00:00+01:00';
    var target = new Date(targetStr).getTime();
    if (isNaN(target)) return;

    var el = {
      days: document.querySelector('[data-count="days"]'),
      hours: document.querySelector('[data-count="hours"]'),
      minutes: document.querySelector('[data-count="minutes"]'),
      seconds: document.querySelector('[data-count="seconds"]')
    };
    if (!el.days) return;

    function set(k, v) {
      var s = String(v);
      if (s.length < 2) s = '0' + s;
      if (el[k].textContent === s) return;
      el[k].textContent = s;
      if (k === 'seconds') {
        el[k].classList.remove('is-tick');
        void el[k].offsetWidth;
        el[k].classList.add('is-tick');
      }
    }

    function tick() {
      var diff = Math.max(0, target - Date.now());
      set('days', Math.floor(diff / 86400000));
      set('hours', Math.floor((diff % 86400000) / 3600000));
      set('minutes', Math.floor((diff % 3600000) / 60000));
      set('seconds', Math.floor((diff % 60000) / 1000));
    }

    tick();
    setInterval(tick, 1000);
  }

  var burger = document.querySelector('.burger');
  var nav = document.getElementById('primary-nav');

  function updateBurgerLabel() {
    if (!burger) return;
    var d = (DATA.i18n && DATA.i18n[currentLang]) || {};
    var key = burger.getAttribute('aria-expanded') === 'true' ? 'a11y.closeMenu' : 'a11y.openMenu';
    if (d[key]) burger.setAttribute('aria-label', d[key]);
  }

  function closeNav() {
    if (!nav || !burger) return;
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    updateBurgerLabel();
  }

  function initNav() {
    if (!burger || !nav) return;
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      nav.classList.toggle('is-open', !open);
      burger.setAttribute('aria-expanded', String(!open));
      updateBurgerLabel();
    });
    var links = nav.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        if (window.matchMedia('(max-width: 1023px)').matches) closeNav();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  function initHeader() {
    var h = document.querySelector('.site-header');
    if (!h) return;
    var ticking = false;
    function update() {
      h.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  var revealObserver = null;

  function observeReveals() {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nodes = document.querySelectorAll('[data-reveal]:not(.is-revealed)');
    if (reduced || !('IntersectionObserver' in window)) {
      for (var i = 0; i < nodes.length; i++) nodes[i].classList.add('is-revealed');
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add('is-revealed');
            revealObserver.unobserve(entries[i].target);
          }
        }
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    for (var j = 0; j < nodes.length; j++) revealObserver.observe(nodes[j]);
  }

  function initTabs() {
    var tabs = document.querySelectorAll('.tab');
    if (!tabs.length) return;
    for (var i = 0; i < tabs.length; i++) {
      (function (tab) {
        tab.addEventListener('click', function () {
          for (var k = 0; k < tabs.length; k++) {
            var active = tabs[k] === tab;
            tabs[k].classList.toggle('is-active', active);
            tabs[k].setAttribute('aria-selected', String(active));
          }
          var panels = document.querySelectorAll('.panel');
          for (var p = 0; p < panels.length; p++) {
            panels[p].hidden = panels[p].id !== tab.getAttribute('aria-controls');
          }
        });
      })(tabs[i]);
    }
  }

  function boot() {
    loadData().then(function () {
      if (!DATA_LOADED) {
        console.warn('[PDC] boot sans data.json');
        initNav();
        initHeader();
        initTabs();
        return;
      }
      applyConfig();
      initLang();
      renderAll();
      initCountdown();
      initNav();
      initHeader();
      initTabs();
      observeReveals();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
