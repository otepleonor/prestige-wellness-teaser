(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const doc = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { gsap, ScrollTrigger } = window;
  const motion = Boolean(gsap && ScrollTrigger) && !reduce;
  const EASE = 'power2.out';

  if (motion) gsap.registerPlugin(ScrollTrigger);

  /* Hero intro: hide before the preloader lifts */
  const heroLines = $$('.hero .line > span');
  const heroFades = $$('.hero [data-hero-fade]');
  if (motion) {
    gsap.set(heroLines, { yPercent: 110 });
    gsap.set(heroFades, { autoAlpha: 0, y: 16 });
  }

  function playIntro() {
    if (!motion) return;
    const [eyebrow, ...rest] = heroFades;
    gsap.timeline({ delay: 0.2 })
      .to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE }, 0)
      .to(heroLines, { yPercent: 0, duration: 0.8, ease: EASE, stagger: 0.1 }, 0.05)
      .to(rest, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.12 }, 0.5);
  }

  /* Preloader */
  const bar = $('.preloader__bar span');
  let progress = 0;
  const setProgress = p => {
    progress = Math.max(progress, p);
    if (bar) bar.style.transform = `scaleX(${progress})`;
  };
  requestAnimationFrame(() => setProgress(0.14));
  const started = performance.now();
  const heroImg = $('.hero__media img');
  const imageReady = new Promise(resolve => {
    if (!heroImg || heroImg.complete) return resolve();
    heroImg.addEventListener('load', resolve, { once: true });
    heroImg.addEventListener('error', resolve, { once: true });
  }).then(() => setProgress(0.8));
  const fontsReady = (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setProgress(0.45));

  Promise.race([Promise.all([imageReady, fontsReady]), new Promise(r => setTimeout(r, 3500))]).then(() => {
    setProgress(1);
    const minimum = reduce ? 0 : 1100;
    const wait = Math.max(0, minimum - (performance.now() - started)) + (reduce ? 0 : 500);
    setTimeout(() => {
      doc.classList.add('loaded');
      playIntro();
      if (motion) ScrollTrigger.refresh();
    }, wait);
  });

  /* Chapter reveals: eyebrow + headline together, then 120ms per step */
  if (motion) {
    $$('[data-reveal]').forEach(group => {
      const items = $$('[data-r]', group).filter(el => el.closest('[data-reveal]') === group);
      if (!items.length) return;
      gsap.set(items, { autoAlpha: 0, y: 28 });
      ScrollTrigger.create({
        trigger: group,
        start: 'top 78%',
        once: true,
        onEnter: () => items.forEach(el => {
          gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE, delay: Number(el.dataset.r || 0) * 0.12 });
        })
      });
    });

    /* Ghost numerals: ~0.8x scroll speed with a gentle scale */
    $$('.ghost').forEach(ghost => {
      const scope = ghost.closest('[data-ghost-scope]') || ghost.closest('section');
      const travel = () => (scope.offsetHeight + window.innerHeight) * 0.1;
      gsap.fromTo(ghost,
        { y: () => -travel(), scale: 0.96 },
        {
          y: () => travel(), scale: 1.04, ease: 'none',
          scrollTrigger: { trigger: scope, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true }
        });
    });

    /* Image parallax: ~0.85x */
    $$('[data-parallax]').forEach(img => {
      const frame = img.parentElement;
      const travel = () => (frame.offsetHeight + window.innerHeight) * 0.075;
      gsap.fromTo(img,
        { y: () => -travel() },
        {
          y: () => travel(), ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true }
        });
    });

    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }

  /* Sticky storytelling: crossfade the pinned image per category */
  const slides = $$('.story__slide');
  const setSlide = i => slides.forEach((slide, j) => slide.classList.toggle('is-active', j === i));
  if ('IntersectionObserver' in window && slides.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setSlide(Number(entry.target.dataset.panel)); });
    }, { rootMargin: '-50% 0px -50% 0px' });
    $$('.panel').forEach(panel => io.observe(panel));
  }

  /* Mobile menu */
  const menu = $('#mobile-menu');
  $('.nav__menu')?.addEventListener('click', () => menu.showModal());
  menu?.addEventListener('click', e => {
    if (e.target.closest('[data-close]') || e.target.closest('a')) menu.close();
  });
})();
