/* Scroll-scrubbed canvas animation for the hero section. */
(() => {
  const FRAME_COUNT = 100;
  const FRAME_PATH = (i) => `assets/frames/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;
  const CONCURRENCY = 8;
  // Scroll fraction (0..1) at which each phase's copy becomes active.
  const PHASE_STARTS = [0, 0.32, 0.64];

  const section = document.querySelector(".hero-scroll");
  const sticky = document.querySelector(".hero-scroll__sticky");
  const canvas = document.getElementById("heroCanvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const loader = document.getElementById("heroLoader");
  const loaderFill = document.getElementById("heroLoaderFill");
  const loaderPct = document.getElementById("heroLoaderPct");
  const scrollcue = document.getElementById("heroScrollcue");
  const phases = Array.from(document.querySelectorAll(".hero-copy__phase"));

  if (!section || !canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const images = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let currentDrawnIndex = -1;
  // No cap: max quality requested even at the cost of a bigger canvas backing store.
  let dpr = window.devicePixelRatio || 1;

  function sizeCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
  }

  function drawCover(img) {
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!iw || !ih) return;
    const scale = Math.max(cw / iw, ch / ih);
    const sw = cw / scale;
    const sh = ch / scale;
    const sx = (iw - sw) / 2;
    const sy = (ih - sh) / 2;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  }

  function loadImage(index) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        loadedCount++;
        updateLoaderProgress();
        resolve(img);
      };
      img.onerror = () => {
        loadedCount++;
        updateLoaderProgress();
        resolve(img);
      };
      img.src = FRAME_PATH(index + 1);
      images[index] = img;
    });
  }

  function updateLoaderProgress() {
    const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
    loaderFill.style.width = pct + "%";
    loaderPct.textContent = pct + "%";
  }

  async function loadAll() {
    let next = 0;
    async function worker() {
      while (next < FRAME_COUNT) {
        const i = next++;
        await loadImage(i);
        if (i === 0 && images[0]) drawCover(images[0]);
      }
    }
    const workers = Array.from({ length: CONCURRENCY }, worker);
    await Promise.all(workers);
  }

  function frameIndexForProgress(progress) {
    return Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(progress * (FRAME_COUNT - 1))));
  }

  function setActivePhase(progress) {
    let activeIndex = 0;
    for (let i = 0; i < PHASE_STARTS.length; i++) {
      if (progress >= PHASE_STARTS[i]) activeIndex = i;
    }
    phases.forEach((el, i) => {
      el.classList.toggle("is-active", i === activeIndex);
    });
  }

  let latestProgress = 0;
  let ticking = false;

  function computeProgress() {
    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return rect.top <= 0 ? 1 : 0;
    const scrolled = -rect.top;
    return Math.min(1, Math.max(0, scrolled / scrollable));
  }

  function onScroll() {
    latestProgress = computeProgress();
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  function render() {
    ticking = false;
    setActivePhase(latestProgress);

    if (scrollcue) {
      scrollcue.style.opacity = latestProgress > 0.03 ? "0" : "1";
    }

    const idx = frameIndexForProgress(latestProgress);
    if (idx === currentDrawnIndex) return;
    const img = images[idx];
    if (img && img.complete && img.naturalWidth) {
      drawCover(img);
      currentDrawnIndex = idx;
    }
  }

  function onResize() {
    dpr = window.devicePixelRatio || 1;
    sizeCanvas();
    const idx = reduceMotion ? FRAME_COUNT - 1 : Math.max(0, currentDrawnIndex);
    const img = images[idx];
    if (img && img.complete && img.naturalWidth) drawCover(img);
  }

  if (reduceMotion) {
    sizeCanvas();
    setActivePhase(1);
    if (scrollcue) scrollcue.style.display = "none";
    loadImage(FRAME_COUNT - 1).then((img) => {
      drawCover(img);
      currentDrawnIndex = FRAME_COUNT - 1;
      loader.classList.add("is-hidden");
    });
    window.addEventListener("resize", onResize);
    return;
  }

  sizeCanvas();
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, { passive: true });

  loadAll().then(() => {
    loader.classList.add("is-hidden");
    onScroll();
  });
})();
