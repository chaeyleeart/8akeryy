/* ============================================================
   8akeryy — shared interactions (runs on every page)
   ============================================================ */
(function () {
  // ---- Smooth scroll (Lenis) ----
  const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  gsap.registerPlugin(ScrollTrigger);
  lenis.on('scroll', ScrollTrigger.update);

  // ---- Mobile nav toggle ----
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav .menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
  }

  // ---- Reveal on scroll (any .reveal element) ----
  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 84%' }
    });
  });

  // ---- HERO intro (main page only) ----
  if (document.querySelector('.hero')) {
    if (document.querySelector('.mascot')) {
      gsap.from('.mascot', { y: 40, scale: .6, opacity: 0, duration: 1, ease: 'back.out(1.7)' });
      gsap.to('.mascot', { y: -14, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }
    gsap.from('.hero h1', { y: 40, opacity: 0, duration: 1, delay: .2, ease: 'power3.out' });
    gsap.from('.hero p', { y: 30, opacity: 0, duration: 1, delay: .45, ease: 'power3.out' });

    document.querySelectorAll('.treat').forEach((el, i) => {
      gsap.to(el, { y: '+=18', duration: 2.4 + i * .3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to(el, {
        yPercent: -40 * (parseFloat(el.dataset.speed) || 1), ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    });
  }

  // ---- Oven "baking" sequence (where present) ----
  if (document.querySelector('.oven')) {
    gsap.timeline({ scrollTrigger: { trigger: '.oven', start: 'top 80%', end: 'top 30%', scrub: true } })
      .to('.oven .glow', { opacity: 1, scale: 1.1, duration: 1 }, 0)
      .to('.oven .cake', { scale: 1, rotate: 0, duration: 1, ease: 'back.out(1.6)' }, 0);
  }

  // ---- Paw print trail following the mouse ----
  const PAW_SVG = '<svg viewBox="0 0 100 100"><g fill="currentColor">' +
    '<ellipse cx="50" cy="64" rx="22" ry="18"/>' +
    '<ellipse cx="26" cy="40" rx="8" ry="11"/>' +
    '<ellipse cx="43" cy="29" rx="8" ry="11"/>' +
    '<ellipse cx="60" cy="29" rx="8" ry="11"/>' +
    '<ellipse cx="77" cy="40" rx="8" ry="11"/>' +
    '</g></svg>';

  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    let lastX = null, lastY = null, side = 1;
    const STEP = 48;
    window.addEventListener('mousemove', (e) => {
      if (lastX === null) { lastX = e.clientX; lastY = e.clientY; return; }
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      if (Math.hypot(dx, dy) < STEP) return;
      lastX = e.clientX; lastY = e.clientY;
      const ang = Math.atan2(dy, dx);
      const off = 11 * side; side *= -1;
      const px = e.clientX + Math.cos(ang + Math.PI / 2) * off;
      const py = e.clientY + Math.sin(ang + Math.PI / 2) * off;
      const el = document.createElement('div');
      el.className = 'paw-print';
      el.style.left = px + 'px'; el.style.top = py + 'px';
      el.style.setProperty('--r', (ang * 180 / Math.PI + 90) + 'deg');
      el.innerHTML = PAW_SVG;
      document.body.appendChild(el);
      gsap.timeline({ onComplete: () => el.remove() })
        .fromTo(el, { opacity: 0, scale: .4 }, { opacity: .55, scale: 1, duration: .18, ease: 'power2.out' })
        .to(el, { opacity: 0, duration: 1.1, delay: .55, ease: 'power1.in' });
    });
  }

  // ---- Smooth in-page anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -20 }); }
      }
    });
  });
})();
