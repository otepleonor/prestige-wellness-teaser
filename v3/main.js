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

    /* Ghost numerals: ~0.6x scroll speed with a gentle scale */
    $$('.ghost').forEach(ghost => {
      const scope = ghost.closest('[data-ghost-scope]') || ghost.closest('section');
      const travel = () => (scope.offsetHeight + window.innerHeight) * 0.2;
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

  /* Booking preview */
  const TZ = 'Asia/Manila';
  const form = $('#booking-form');
  const done = $('#booking-done');
  const f = {
    name: $('#f-name'), ritual: $('#f-ritual'), date: $('#f-date'), time: $('#f-time')
  };
  const guestInputs = $$('input[name="guests"]');
  const touched = new Set();

  const manilaParts = date => Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).map(p => [p.type, p.value]));
  const todayISO = () => { const p = manilaParts(new Date()); return `${p.year}-${p.month}-${p.day}`; };
  const nowMinutes = () => { const p = manilaParts(new Date()); return Number(p.hour) * 60 + Number(p.minute); };
  const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00+08:00`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const timeLabel = m => `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, '0')} ${m >= 720 ? 'PM' : 'AM'}`;
  const prettyDate = iso => new Intl.DateTimeFormat('en-PH', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(`${iso}T12:00:00+08:00`));

  if (form) {
    f.date.min = todayISO();
    f.date.max = addDays(todayISO(), 60);
    for (let m = 600; m <= 1410; m += 30) {
      const opt = new Option(timeLabel(m), String(m));
      f.time.add(opt);
    }

    const selected = () => f.ritual.selectedOptions[0];
    const guests = () => Number(guestInputs.find(i => i.checked)?.value || 1);

    const rules = {
      name: () => /^[\p{L}][\p{L}\s.'-]{1,39}$/u.test(f.name.value.trim()) ? '' : 'Please share a first name.',
      ritual: () => f.ritual.value ? '' : 'Choose a ritual to begin.',
      date: () => {
        const v = f.date.value;
        if (!v) return 'Choose a date.';
        return v < f.date.min || v > f.date.max ? 'Choose a date within the next 60 days.' : '';
      },
      time: () => {
        if (!f.time.value) return 'Choose a time.';
        const start = Number(f.time.value);
        const length = Number(selected()?.dataset.min || 0);
        if (f.date.value === todayISO() && start < nowMinutes() + 60) return 'That time has passed. Choose a later one.';
        if (start + length > 1440) return 'This ritual would end after midnight. Choose an earlier time.';
        return '';
      },
      guests: () => guests() === 2 && f.ritual.value && selected()?.dataset.couples !== 'true'
        ? 'Two guests are available for massage rituals.' : ''
    };

    const show = (key, message) => {
      const err = $(`#e-${key}`);
      if (err) err.textContent = message;
      const input = key === 'guests' ? null : f[key];
      if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    };
    const check = key => { const m = rules[key](); show(key, m); return !m; };

    Object.entries(f).forEach(([key, input]) => {
      input.addEventListener('blur', () => { touched.add(key); check(key); });
      input.addEventListener('change', () => {
        if (touched.has(key)) check(key);
        if (key === 'ritual' || key === 'date') {
          if (touched.has('time')) check('time');
          if (touched.has('guests')) check('guests');
        }
      });
    });
    guestInputs.forEach(i => i.addEventListener('change', () => { touched.add('guests'); check('guests'); }));

    /* CTAs elsewhere on the page preselect the ritual or the evening */
    $$('[data-ritual], [data-evening]').forEach(link => link.addEventListener('click', () => {
      if (link.dataset.ritual) f.ritual.value = link.dataset.ritual;
      if (link.hasAttribute('data-evening')) f.time.value = '1080';
      if (!form.hidden) setTimeout(() => f.name.focus({ preventScroll: true }), 600);
    }));

    form.addEventListener('submit', e => {
      e.preventDefault();
      const keys = Object.keys(rules);
      keys.forEach(k => touched.add(k));
      const results = keys.map(k => [k, check(k)]);
      const firstBad = results.find(([, ok]) => !ok);
      if (firstBad) {
        const target = firstBad[0] === 'guests' ? guestInputs[0] : f[firstBad[0]];
        target.focus();
        return;
      }
      const ritualName = selected().textContent.split('·')[0].trim();
      const g = guests();
      $('#booking-summary').textContent =
        `${f.name.value.trim()}, ${ritualName}. ${prettyDate(f.date.value)}, ${timeLabel(Number(f.time.value))}. ${g === 2 ? 'Two guests' : 'Just you'}.`;
      form.hidden = true;
      done.hidden = false;
      done.classList.add('is-entering');
      done.focus({ preventScroll: true });
    });

    $('#booking-again').addEventListener('click', () => {
      form.reset();
      touched.clear();
      Object.keys(rules).forEach(k => show(k, ''));
      done.hidden = true;
      done.classList.remove('is-entering');
      form.hidden = false;
      form.classList.add('is-entering');
      f.name.focus({ preventScroll: true });
    });
  }
})();
