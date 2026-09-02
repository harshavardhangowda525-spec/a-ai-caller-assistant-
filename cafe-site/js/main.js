/* =============================================================
   Secrete Celebration Cafe — shared interactions
   Nav, scroll reveal, carousel, lightbox, tabs, forms.
   ============================================================= */
(function () {
  'use strict';

  /* ----------  Mobile nav toggle + sticky state  ---------- */
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('nav-open');
      const open = nav.classList.contains('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    // close menu when a link is tapped
    nav.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('nav-open'); });
    });
  }
  if (nav) {
    const onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ----------  Scroll reveal (IntersectionObserver)  ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ----------  Testimonials carousel  ---------- */
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    const track = root.querySelector('.carousel-track');
    const slides = root.querySelectorAll('.testi');
    const dotsWrap = root.parentElement.querySelector('.carousel-nav');
    if (!track || slides.length === 0) return;
    let i = 0, timer = null;

    // build dots
    let dots = [];
    if (dotsWrap) {
      slides.forEach(function (_, idx) {
        const d = document.createElement('button');
        d.className = 'dot' + (idx === 0 ? ' active' : '');
        d.setAttribute('aria-label', 'Go to testimonial ' + (idx + 1));
        d.addEventListener('click', function () { go(idx); });
        dotsWrap.appendChild(d);
        dots.push(d);
      });
    }
    function go(n) {
      i = (n + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-i * 100) + '%)';
      dots.forEach(function (d, idx) { d.classList.toggle('active', idx === i); });
    }
    function next() { go(i + 1); }
    function prev() { go(i - 1); }
    root.querySelector('.carousel-arrow.next')?.addEventListener('click', function () { next(); reset(); });
    root.querySelector('.carousel-arrow.prev')?.addEventListener('click', function () { prev(); reset(); });
    function start() { timer = setInterval(next, 6000); }
    function reset() { clearInterval(timer); start(); }
    root.addEventListener('mouseenter', function () { clearInterval(timer); });
    root.addEventListener('mouseleave', start);
    start();
  });

  /* ----------  Filter tabs (menu)  ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (tabsRoot) {
    const btns = tabsRoot.querySelectorAll('.tab-btn');
    const scope = document.querySelector(tabsRoot.getAttribute('data-target') || 'body');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        const f = btn.getAttribute('data-filter');
        scope.querySelectorAll('[data-cat]').forEach(function (el) {
          const show = f === 'all' || (' ' + el.getAttribute('data-cat') + ' ').indexOf(' ' + f + ' ') > -1;
          el.style.display = show ? '' : 'none';
        });
      });
    });
  });

  /* ----------  Lightbox (gallery)  ---------- */
  const lbTriggers = Array.from(document.querySelectorAll('[data-lightbox]'));
  const lb = document.getElementById('lightbox');
  if (lb && lbTriggers.length) {
    const lbPhoto = lb.querySelector('.lb-photo');
    const lbCap = lb.querySelector('.lb-cap');
    let idx = 0;
    function open(n) {
      idx = (n + lbTriggers.length) % lbTriggers.length;
      const t = lbTriggers[idx];
      lbPhoto.className = 'lb-photo photo ' + (t.getAttribute('data-photo') || 'ph-latte');
      lbCap.textContent = t.getAttribute('data-cap') || '';
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }
    lbTriggers.forEach(function (t, n) {
      t.addEventListener('click', function () { open(n); });
      t.setAttribute('tabindex', '0');
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter') open(n); });
    });
    lb.querySelector('.lb-close')?.addEventListener('click', close);
    lb.querySelector('.lb-arrow.next')?.addEventListener('click', function () { open(idx + 1); });
    lb.querySelector('.lb-arrow.prev')?.addEventListener('click', function () { open(idx - 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') open(idx + 1);
      if (e.key === 'ArrowLeft') open(idx - 1);
    });
  }

  /* ----------  Forms (newsletter + contact)  ---------- */
  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); }, 3800);
  }
  document.querySelectorAll('[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const kind = form.getAttribute('data-form');
      if (kind === 'newsletter') toast('☕ Welcome to the club! Check your inbox for a treat.');
      else toast('✓ Thanks! We’ll be in touch within one business day.');
      form.reset();
    });
  });

  /* ----------  Footer year  ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
