/* ==========================================================================
   Mediaudience — Signal
   JS mínimo y progresivo. El sitio funciona completo sin él.

   Reglas de motion (design/GUIA-DE-USO.md §7):
   base 220ms · entradas de datos hasta 700ms · desplazamientos de ≤8px ·
   sin parallax, sin scroll-jacking, sin bounce · count-up en un único KPI ·
   prefers-reduced-motion: reduce desactiva todo menos cambios de color.
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Drawer de navegación (bajo 1100px) ------------------------------- */

  (function nav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var drawer = document.querySelector('[data-nav-drawer]');
    if (!toggle || !drawer) return;

    var labelEl = toggle.querySelector('[data-nav-toggle-label]');

    function setOpen(open) {
      drawer.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (labelEl) labelEl.textContent = open ? 'Cerrar' : 'Menú';
    }

    toggle.addEventListener('click', function () {
      setOpen(!drawer.classList.contains('is-open'));
    });

    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    var desktop = window.matchMedia('(min-width: 1100px)');
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  })();

  /* --- Revelado al entrar en viewport + barras de dato ------------------ */

  (function reveal() {
    var targets = document.querySelectorAll('.reveal, [data-meters]');
    if (!targets.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  })();

  /* --- Índice de página: sección activa -------------------------------- */

  (function index() {
    var links = document.querySelectorAll('[data-index-link]');
    if (!links.length) return;

    var pairs = [];
    Array.prototype.forEach.call(links, function (link) {
      var id = (link.getAttribute('href') || '').replace(/^#/, '');
      var section = id && document.getElementById(id);
      if (section) pairs.push({ link: link, section: section });
    });
    if (!pairs.length) return;

    var queued = false;

    function pick() {
      queued = false;
      var line = window.innerHeight * 0.25;
      var active = pairs[0];
      pairs.forEach(function (p) {
        if (p.section.getBoundingClientRect().top <= line) active = p;
      });
      pairs.forEach(function (p) {
        p.link.classList.toggle('is-active', p === active);
      });
    }

    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(pick);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    pick();
  })();

  /* --- Count-up: un único KPI héroe por sitio -------------------------- */

  (function countUp() {
    var el = document.querySelector('[data-countup]');
    if (!el || reduced || !('IntersectionObserver' in window)) return;

    var target = parseFloat(el.getAttribute('data-countup'));
    if (isNaN(target)) return;

    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();

      var start = null;
      var duration = 700;   /* motion.duration.slow */

      function frame(now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = String(target);
      }
      requestAnimationFrame(frame);
    }, { threshold: 0.6 });

    io.observe(el);
  })();

  /* --- Formulario: validación junto al campo --------------------------- */

  (function form() {
    var f = document.querySelector('[data-form]');
    if (!f) return;

    var MESSAGES = {
      valueMissing: 'Este campo es obligatorio',
      typeMismatch: 'Revisá el formato del email'
    };

    function messageFor(control) {
      var v = control.validity;
      if (v.valueMissing) return MESSAGES.valueMissing;
      if (v.typeMismatch) return MESSAGES.typeMismatch;
      return control.validationMessage;
    }

    function validate(control) {
      var errorEl = document.getElementById(control.id + '-error');
      var ok = control.checkValidity();
      control.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (errorEl) errorEl.textContent = ok ? '' : messageFor(control);
      return ok;
    }

    var controls = f.querySelectorAll('.field__control');

    Array.prototype.forEach.call(controls, function (control) {
      control.addEventListener('blur', function () { validate(control); });
      control.addEventListener('input', function () {
        if (control.getAttribute('aria-invalid') === 'true') validate(control);
      });
    });

    f.addEventListener('submit', function (e) {
      var firstInvalid = null;
      Array.prototype.forEach.call(controls, function (control) {
        if (!validate(control) && !firstInvalid) firstInvalid = control;
      });
      if (firstInvalid) {
        e.preventDefault();
        firstInvalid.focus();
      }
    });
  })();
})();
