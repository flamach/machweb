(() => {
  const SPEED = 1.25;
  const STAR_DENSITY = 0.25;

  // Starfield
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.floor((canvas.width * canvas.height) / 6000 * STAR_DENSITY);
    stars = new Array(count).fill(0).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      speed: (Math.random() * 0.15 + 0.02) * SPEED,
      phase: Math.random() * Math.PI * 2,
      variant: Math.random(),
    }));
  }
  resize();
  window.addEventListener('resize', resize);

  let t = 0;
  function draw() {
    t += 0.016;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > canvas.height) s.y = 0;
      const twinkle = 0.5 + 0.5 * Math.sin(t * 1.5 + s.phase);
      ctx.globalAlpha = 0.3 + twinkle * 0.7;
      ctx.fillStyle = s.variant > 0.9 ? '#f2571f' : '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();

  // Skill gauges — animate on scroll into view
  const skillGauges = document.querySelectorAll('.skill-gauge');
  const aboutSection = document.getElementById('about');
  const gaugeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        skillGauges.forEach(g => {
          const level = g.dataset.level;
          g.style.setProperty('--lvl', level);
          requestAnimationFrame(() => g.classList.add('visible'));
        });
        gaugeObserver.disconnect();
      }
    });
  }, { threshold: 0.25 });
  if (aboutSection) gaugeObserver.observe(aboutSection);

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

    function slideLayersOf(sceneEl) { return Array.from(sceneEl.querySelectorAll('.hero-slide')); }

    // Scrolling back up mirrors the SKY's sweep top<->bottom (the only layer whose enter/exit
    // sides differ) instead of always sweeping down — negate the vh sign on its authored transform.
    // Every other layer (volcano, moon, astronaut, butterfly, rock, smoke) keeps a single fixed
    // direction regardless of scroll direction, as before.
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
          const isSky = el.dataset.fade !== undefined;
          const pos = isSky && direction === -1 ? flipY(el.dataset.enterTransform) : el.dataset.enterTransform;
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
        const isSky = el.dataset.fade !== undefined;
        el.style.transform = isSky && direction === -1 ? flipY(el.dataset.exitTransform) : el.dataset.exitTransform;
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

    function goToScene(index) {
      if (index < 0 || index >= scenes.length || index === activeIndex || locked) return;
      const direction = index > activeIndex ? 1 : -1;
      exitScene(scenes[activeIndex], direction);
      scenes[activeIndex].classList.remove('is-active');
      scenes[index].classList.add('is-active');
      enterScene(scenes[index], { direction });
      activeIndex = index;
      if (SCENE_LOCK_MS > 0) {
        locked = true;
        setTimeout(() => { locked = false; }, SCENE_LOCK_MS);
      }
    }

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
        if (locked) { e.preventDefault(); return; }
        if (window.scrollY > SCROLL_TOP_TOLERANCE) return;
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
  }
})();
