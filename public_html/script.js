(() => {
  // Hero parallax — scroll (translateY) + mouse (translateX), depth read from each layer's data-depth.
  // Layers from every scene are driven by the same loop; hidden scenes just move invisibly (cheap, no branching).
  const heroScenesEl = document.getElementById('hero-scenes');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroScenesEl && !reduceMotion) {
    const MOUSE_MAX_SHIFT = 60; // px, at depth 1 — actual shift is scaled by each layer's depth
    // Mouse reaction moves layers OPPOSITE the cursor (mouse right -> layers drift left). A layer
    // can opt out entirely with data-mouse-parallax="none" (volcano, clouds/floor in scene 3 — it
    // still gets scroll parallax from its depth, only the mouse term is zeroed) or tone its mouse
    // reaction down/up with a strength number, e.g. data-mouse-parallax="0.5" for half — the depth
    // (and scroll parallax) stays untouched either way. Every .hero-mini-rock (scene 3's 18
    // scattered background rocks) is mouse-inert too, without needing the attribute on each one.
    const layers = Array.from(heroScenesEl.querySelectorAll('.hero-layer')).map(el => {
      const raw = el.dataset.mouseParallax;
      const isMiniRock = el.closest('.hero-mini-rock');
      const mouseFactor = (raw === 'none' || isMiniRock) ? 0 : raw ? -parseFloat(raw) : -1;
      return { el, depth: parseFloat(el.dataset.depth) || 0, mouseFactor };
    });
    let scrollY = window.scrollY;
    let mouseNorm = 0; // -1 (left) .. 1 (right)
    let ticking = false;

    function applyParallax() {
      layers.forEach(({ el, depth, mouseFactor }) => {
        const ty = -scrollY * depth;
        const tx = mouseNorm * MOUSE_MAX_SHIFT * depth * mouseFactor;
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
      ticking = false;
    }
    function requestTick() {
      if (!ticking) { ticking = true; requestAnimationFrame(applyParallax); }
    }
    window.addEventListener('scroll', () => { scrollY = window.scrollY; requestTick(); }, { passive: true });
    window.addEventListener('mousemove', (e) => {
      mouseNorm = (e.clientX / window.innerWidth - 0.5) * 2;
      requestTick();
    }, { passive: true });
    applyParallax();
  }

  // Hero scene switcher — one wheel/swipe gesture slides to the next scene instead of scrolling
  // the page; scroll is locked for the duration of the transition. Add more .hero-scene blocks in
  // index.html to extend past scene 2 — this loop doesn't hardcode a scene count.
  const scenes = Array.from(document.querySelectorAll('.hero-scene'));
  if (scenes.length > 1) {
    // Keep in sync with --scene-duration in style.css.
    const SCENE_DURATION_MS = 1300;
    // Keep in sync with SCENE_DURATION_MS + the longest .hero-slide transition-delay in style.css
    // (currently the butterfly's 0.4s), plus a small buffer.
    const SCENE_LOCK_MS = reduceMotion ? 0 : 1850;
    const ENTER_CLEANUP_MS = 1150; // matches --scene-enter-duration (1s) + buffer
    const SCROLL_TOP_TOLERANCE = 2; // px — only intercept the gesture while the hero fills the viewport
    const SWIPE_THRESHOLD = 40; // px of touch travel before it counts as a deliberate swipe

    let activeIndex = scenes.findIndex(s => s.classList.contains('is-active'));
    if (activeIndex < 0) activeIndex = 0;
    let locked = false;

    // Explicit initial visibility, set synchronously before first paint (this script tag runs at
    // parse time, before the browser paints) — the inactive scene(s) must never rely solely on the
    // .hero-slide transform to stay hidden; belt-and-suspenders per the astronaut/butterfly bug.
    scenes.forEach((s, i) => { s.style.visibility = i === activeIndex ? 'visible' : 'hidden'; });

    // The per-scene headline (.hero-text, kept outside .hero-scene so the existing :has() opacity
    // rule can target it — see its own comment) is pulled in here so it rides the same
    // enter/exit transform as that scene's visual layers.
    function slideLayersOf(sceneEl) {
      const layers = Array.from(sceneEl.querySelectorAll('.hero-slide'));
      const heroText = document.querySelector(`.hero-text[data-hero-text="${sceneEl.dataset.scene}"]`);
      if (heroText) layers.push(heroText);
      return layers;
    }

    // Scrolling back up mirrors some layers' sweep (direction flips via data-directional, or always
    // for the sky) instead of always sweeping the same way — negate the vh sign on its authored
    // transform. Layers without data-directional (or data-fade) keep a single fixed direction
    // regardless of scroll direction.
    function flipY(transform) {
      return transform.replace(/translateY\(\s*(-?[\d.]+)vh\s*\)/, (m, n) => `translateY(${-parseFloat(n)}vh)`);
    }

    // Plays the first-load entrance with the softer power2.out curve (--scene-enter-duration/-ease),
    // then hands the element back to the default --scene-duration/--scene-ease transition.
    function enterScene(sceneEl, { isFirstLoad = false, direction = 1 } = {}) {
      sceneEl.style.visibility = 'visible';
      const layers = slideLayersOf(sceneEl);
      // Layers that exit toward a DIFFERENT side than they enter from (the skies, the smoke) must
      // be snapped back to their entry-side position first, instantly, in case they're currently
      // sitting at their exit position from a previous run — otherwise the 2nd+ transition re-enters
      // from the wrong side (breaks the sky/sky sync and the seam-hiding overlap).
      const toReset = layers.filter(el => el.dataset.enterTransform);
      if (toReset.length) {
        toReset.forEach(el => {
          const flips = el.dataset.fade !== undefined || el.dataset.directional !== undefined;
          const pos = flips && direction === -1 ? flipY(el.dataset.enterTransform) : el.dataset.enterTransform;
          el.style.transition = 'none'; el.style.transform = pos;
        });
        void sceneEl.offsetHeight; // force reflow so the instant reset commits before transitions resume
        toReset.forEach(el => { el.style.transition = ''; });
      }
      if (isFirstLoad) {
        layers.forEach(el => el.classList.add('is-entering'));
        setTimeout(() => layers.forEach(el => el.classList.remove('is-entering')), ENTER_CLEANUP_MS);
      }
      layers.forEach(el => {
        el.style.transform = el.dataset.fade !== undefined ? 'translateY(0) scale(1)' : 'translateY(0)';
        if (el.dataset.fade !== undefined) {
          el.style.opacity = '1';
          // The mask direction follows the ROLE (entering vs exiting) AND the travel direction —
          // going backward the sky sweeps upward instead of downward, so the edge that actually
          // touches the other sky flips too (see flipY comment above).
          const img = el.querySelector('.hero-layer');
          const maskClass = direction === 1 ? 'hero-sky-mask-enter' : 'hero-sky-mask-exit';
          const otherMaskClass = direction === 1 ? 'hero-sky-mask-exit' : 'hero-sky-mask-enter';
          if (img) { img.classList.remove(otherMaskClass); img.classList.add(maskClass); }
        }
      });
    }
    function exitScene(sceneEl, direction = 1) {
      slideLayersOf(sceneEl).forEach(el => {
        const flips = el.dataset.fade !== undefined || el.dataset.directional !== undefined;
        el.style.transform = flips && direction === -1 ? flipY(el.dataset.exitTransform) : el.dataset.exitTransform;
        if (el.dataset.fade !== undefined) {
          el.style.opacity = '0';
          const img = el.querySelector('.hero-layer');
          const maskClass = direction === 1 ? 'hero-sky-mask-exit' : 'hero-sky-mask-enter';
          const otherMaskClass = direction === 1 ? 'hero-sky-mask-enter' : 'hero-sky-mask-exit';
          if (img) { img.classList.remove(otherMaskClass); img.classList.add(maskClass); }
        }
      });
      // Hide only once the exit slide has actually finished, and only if nothing re-activated
      // this scene in the meantime (fast back-and-forth switching).
      setTimeout(() => {
        if (!sceneEl.classList.contains('is-active')) sceneEl.style.visibility = 'hidden';
      }, SCENE_DURATION_MS);
    }

    function goToScene(index, directionOverride) {
      if (index < 0 || index >= scenes.length || index === activeIndex || locked) return;
      const direction = directionOverride || (index > activeIndex ? 1 : -1);
      exitScene(scenes[activeIndex], direction);
      scenes[activeIndex].classList.remove('is-active');
      scenes[index].classList.add('is-active');
      enterScene(scenes[index], { direction });
      activeIndex = index;
      if (SCENE_LOCK_MS > 0) {
        locked = true;
        setTimeout(() => { locked = false; }, SCENE_LOCK_MS);
      }
      scheduleAutoAdvance();
    }

    // Wraps from the last scene back to the first, forcing a forward direction so the loop always
    // reads as continuing forward instead of the last scene "reversing" into the first.
    function goNext() {
      if (activeIndex === scenes.length - 1) goToScene(0, 1);
      else goToScene(activeIndex + 1);
    }

    // Auto-advance every AUTO_ADVANCE_MS, looping past the last scene. Any manual navigation
    // (goToScene, called from every input path below) re-arms the timer via scheduleAutoAdvance.
    // Paused whenever the user has scrolled past the hero — otherwise it keeps cycling scenes (and
    // setting `locked`) off-screen, which the wheel listener below would misread as a reason to
    // block the page's normal scroll even though the hero isn't what's being scrolled anymore.
    const AUTO_ADVANCE_MS = 6000;
    let autoAdvanceTimer = null;
    function scheduleAutoAdvance() {
      if (reduceMotion) return;
      clearTimeout(autoAdvanceTimer);
      if (window.scrollY > SCROLL_TOP_TOLERANCE) return;
      autoAdvanceTimer = setTimeout(goNext, AUTO_ADVANCE_MS);
    }
    window.addEventListener('scroll', () => {
      if (window.scrollY <= SCROLL_TOP_TOLERANCE) scheduleAutoAdvance();
      else clearTimeout(autoAdvanceTimer);
    }, { passive: true });

    // First-load entrance for the initially active scene (double rAF: let the off-screen default
    // position commit to a frame first, so the move to translateY(0) is actually observed as a change).
    if (!reduceMotion) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        enterScene(scenes[activeIndex], { isFirstLoad: true });
      }));
    }

    if (reduceMotion) {
      // No scroll-jacking under reduced motion: scene 2 simply fades in once the user scrolls a
      // little, via the plain opacity transition already defined for .hero-parallax in CSS.
      window.addEventListener('scroll', () => {
        goToScene(window.scrollY > 60 ? 1 : 0);
      }, { passive: true });
    } else {
      window.addEventListener('wheel', (e) => {
        if (window.scrollY > SCROLL_TOP_TOLERANCE) return;
        if (locked) { e.preventDefault(); return; }
        if (e.deltaY > 0 && activeIndex < scenes.length - 1) {
          e.preventDefault();
          goToScene(activeIndex + 1);
        } else if (e.deltaY < 0 && activeIndex > 0) {
          e.preventDefault();
          goToScene(activeIndex - 1);
        }
      }, { passive: false });

      let touchStartY = null;
      window.addEventListener('touchstart', (e) => {
        touchStartY = locked ? null : e.touches[0].clientY;
      }, { passive: true });
      window.addEventListener('touchmove', (e) => {
        if (locked || touchStartY === null || window.scrollY > SCROLL_TOP_TOLERANCE) return;
        const deltaY = touchStartY - e.touches[0].clientY; // positive = swiping up
        if (deltaY > SWIPE_THRESHOLD && activeIndex < scenes.length - 1) {
          e.preventDefault();
          goToScene(activeIndex + 1);
          touchStartY = null;
        } else if (deltaY < -SWIPE_THRESHOLD && activeIndex > 0) {
          e.preventDefault();
          goToScene(activeIndex - 1);
          touchStartY = null;
        }
      }, { passive: false });
    }

    const prevBtn = document.getElementById('hero-scene-prev');
    const nextBtn = document.getElementById('hero-scene-next');
    if (prevBtn) prevBtn.addEventListener('click', () => goToScene(activeIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', goNext);

    scheduleAutoAdvance();
  }
})();

// Side nav — computes the scroll position itself (instead of a plain hash jump) so the target
// section's top lands just past the viewport top, regardless of the sticky hero above it. The
// small SCROLL_OFFSET nudges the landing spot down a bit so a section whose content exactly fills
// one screen doesn't clip its last row against the bottom edge.
(() => {
  const SCROLL_OFFSET = 90; // px scrolled past the section's exact top
  document.querySelectorAll('.side-nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      // #hero is the very top of the page — land on it exactly, no offset, no rect math needed.
      if (href === '#hero') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      const top = target.getBoundingClientRect().top + window.scrollY + SCROLL_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

// Projects grid — each card is a fake macOS browser window, data-driven so new projects are just
// a new entry here. image is a URL string; when omitted, bg (any CSS background value) shows instead.
(() => {
  const PROJECTS = [
    {
      domain: 'auvieuxsinge.fr',
      link: '/demos/auvieuxsinge/',
      bg: 'linear-gradient(135deg, #3a2415, #6b3f1d)',
      image: 'demos/auvieuxsinge/ce_vieux_singe.png',
      name: 'Au Vieux Singe',
      label: { en: 'Neighborhood brasserie', fr: 'Brasserie de quartier' },
      overlayTitle: { en: 'Since 1966', fr: 'Depuis 1966' },
      overlaySub: { en: 'Menu, karaoke nights & seasonal dining.', fr: 'Carte, soirées karaoké et cuisine de saison.' },
      viewLabel: { en: 'View demo', fr: 'Voir la démo' },
    },
    {
      domain: 'domainelemeandre.fr',
      link: 'https://github.com/flamach/LeMeandre',
      bg: 'linear-gradient(135deg, #16302a, #295c46)',
      image: 'demos/ce_lemeandre.png',
      name: 'Le Méandre',
      label: { en: 'Family estate', fr: 'Domaine familial' },
      overlayTitle: { en: 'Stay, dine, unwind', fr: 'Séjourner, dîner, respirer' },
      overlaySub: { en: 'Restaurant, gîtes & spa, bilingual FR/EN.', fr: 'Restaurant, gîtes et spa, bilingue FR/EN.' },
      viewLabel: { en: 'View code', fr: 'Voir le code' },
    },
    {
      domain: 'poolbuilder.fr',
      link: '/demos/pool/',
      bg: 'linear-gradient(135deg, #0d2b3a, #1b5c78)',
      image: 'demos/pool/ce_lame_pool.png',
      name: 'Lame Pool',
      label: { en: 'Custom pool builder', fr: 'Constructeur de piscines' },
      overlayTitle: { en: 'From ground to water', fr: "Du jardin nu à l'eau" },
      overlaySub: { en: 'Scroll-scrubbed hero, bare garden to full pool.', fr: 'Animation hero pilotée par le scroll.' },
      viewLabel: { en: 'View demo', fr: 'Voir la démo' },
    },
    {
      domain: 'kmiepiercings.fr',
      link: '/demos/kmie_piercings/',
      bg: 'linear-gradient(135deg, #2b1720, #6e3648)',
      image: 'demos/kmie_piercings/ce_kmie_piercing.png',
      name: 'Kmie Piercings',
      label: { en: 'Piercing studio', fr: 'Studio de piercing' },
      overlayTitle: { en: 'Curated ear, by appointment', fr: 'Oreille sur mesure, sur rendez-vous' },
      overlaySub: { en: 'Gold & silver jewelry, made in Lille.', fr: 'Bijoux dorés et argentés, à Lille.' },
      viewLabel: { en: 'View demo', fr: 'Voir la démo' },
    },
  ];

  const grid = document.getElementById('project-grid');
  if (!grid) return;

  const ARROW_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>';

  function render() {
    const lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';
    grid.innerHTML = PROJECTS.map(p => `
      <a class="project-window" href="${p.link}" target="_blank" rel="noopener">
        <div class="window-titlebar">
          <div class="window-dots">
            <span class="window-dot window-dot--red"></span>
            <span class="window-dot window-dot--yellow"></span>
            <span class="window-dot window-dot--green"></span>
          </div>
          <span class="window-domain">${p.domain}</span>
        </div>
        <div class="window-preview" style="background:${p.bg}">
          ${p.image ? `<img src="${p.image}" alt="" loading="lazy">` : ''}
        </div>
        <div class="project-meta">
          <div>
            <div class="project-label">${p.label[lang]}</div>
            <div class="project-name">${p.name}</div>
          </div>
          <span class="project-view">${p.viewLabel[lang]} ${ARROW_SVG}</span>
        </div>
      </a>
    `).join('');
  }

  render();
  // i18n.js owns the language toggle; defer to a fresh macrotask so document.documentElement.lang
  // has already been updated by its own click handler before we re-render off of it.
  document.getElementById('lang-toggle')?.addEventListener('click', () => setTimeout(render, 0));
})();
