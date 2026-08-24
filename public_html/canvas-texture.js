// Woven-canvas texture overlay — pure HTML/CSS/JS, no dependencies.
// Draw target: any <canvas data-texture> whose CSS already positions it (absolute, inset:0)
// over the image it should texture. This module only fills the canvas' pixels; the fusion look
// (soft-light blend + low opacity) lives in CSS (see .hero-texture-canvas).
(() => {
  const SPACING = 3; // px between threads — finer spacing = finer weave
  const JITTER = 0.7; // px of random wobble applied to each thread's position
  const GRAIN_AREA_PER_PX = 14; // ~1 grain speck per this many px² of canvas
  const BASE_GRAY = 128; // neutral gray so the weave never tints the photo underneath

  function clamp8(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  function drawWeave(ctx, w, h) {
    ctx.fillStyle = `rgb(${BASE_GRAY},${BASE_GRAY},${BASE_GRAY})`;
    ctx.fillRect(0, 0, w, h);

    // Each thread is a light/dark line pair straddling its (jittered) center line, which reads
    // as a thin rounded ridge once lit — that's the "relief" the brief asks for. Alpha is kept low
    // here since soft-light amplifies contrast rather than dampening it.
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    for (let x = 0; x <= w + SPACING; x += SPACING) {
      const jx = x + (Math.random() * 2 - 1) * JITTER;
      ctx.fillRect(jx - 1, 0, 1, h);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let x = 0; x <= w + SPACING; x += SPACING) {
      const jx = x + (Math.random() * 2 - 1) * JITTER;
      ctx.fillRect(jx, 0, 1, h);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    for (let y = 0; y <= h + SPACING; y += SPACING) {
      const jy = y + (Math.random() * 2 - 1) * JITTER;
      ctx.fillRect(0, jy - 1, w, 1);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let y = 0; y <= h + SPACING; y += SPACING) {
      const jy = y + (Math.random() * 2 - 1) * JITTER;
      ctx.fillRect(0, jy, w, 1);
    }
  }

  // ponytail: direct pixel writes into ImageData instead of ~(w*h/14) individual fillRect calls
  // — at fillRect-per-speck rates this step alone would run 5-10x slower on a full-viewport canvas.
  function drawGrain(ctx, w, h) {
    if (w < 1 || h < 1) return;
    const frame = ctx.getImageData(0, 0, w, h);
    const px = frame.data;
    const count = Math.round((w * h) / GRAIN_AREA_PER_PX);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() * w) | 0;
      const y = (Math.random() * h) | 0;
      const idx = (y * w + x) * 4;
      const delta = Math.random() < 0.5 ? -32 : 32;
      px[idx] = clamp8(px[idx] + delta);
      px[idx + 1] = clamp8(px[idx + 1] + delta);
      px[idx + 2] = clamp8(px[idx + 2] + delta);
    }
    ctx.putImageData(frame, 0, 0);
  }

  // Replicates CSS object-fit/object-position (for <img>) or background-size/background-position
  // (for a CSS background-image div, always given as literal percentage pairs in this codebase) so
  // the mask below lines up with what's actually on screen — a contain-fit or zoomed/panned sprite
  // would otherwise mask against its full bounding box instead of its real visible pixels.
  function fitRect(naturalW, naturalH, boxW, boxH, fit, posX, posY) {
    const boxRatio = boxW / boxH;
    const imgRatio = naturalW / naturalH;
    let drawW, drawH;
    if (fit === 'contain') {
      if (imgRatio > boxRatio) { drawW = boxW; drawH = boxW / imgRatio; }
      else { drawH = boxH; drawW = boxH * imgRatio; }
    } else if (fit === 'cover') {
      if (imgRatio > boxRatio) { drawH = boxH; drawW = boxH * imgRatio; }
      else { drawW = boxW; drawH = boxW / imgRatio; }
    } else {
      // 'fill' (the default) and any other unhandled keyword just stretch to the box — matches
      // every non-cover/contain <img> in this codebase (smoke, rock's box already shares its
      // image's aspect ratio, so fill/contain look identical there anyway).
      drawW = boxW; drawH = boxH;
    }
    return { x: (boxW - drawW) * posX, y: (boxH - drawH) * posY, w: drawW, h: drawH };
  }

  function parsePercentPair(value, fallbackX, fallbackY) {
    const parts = String(value).split(' ').map(parseFloat);
    const x = Number.isFinite(parts[0]) ? parts[0] / 100 : fallbackX;
    const y = Number.isFinite(parts[1]) ? parts[1] / 100 : fallbackY;
    return { x, y };
  }

  function extractUrl(cssValue) {
    const m = /url\((['"]?)(.*?)\1\)/.exec(cssValue || '');
    return m ? m[2] : null;
  }

  // Background-image divs (astronaut, butterfly) have no pixel data of their own to sample, so we
  // load the same URL into a plain Image and cache it on the element — render() may run again on
  // resize and shouldn't re-fetch every time.
  const bgImageCache = new WeakMap();
  function getBgImage(el) {
    if (bgImageCache.has(el)) return bgImageCache.get(el);
    const url = extractUrl(getComputedStyle(el).backgroundImage);
    const img = url ? new Image() : null;
    if (img) img.src = url;
    bgImageCache.set(el, img);
    return img;
  }

  // Resolves what to mask against for a given canvas: either its <img> sibling, or a sibling div
  // painted with a CSS background-image. Returns null if the source image isn't decoded yet (the
  // caller redraws once it is — see waitForMaskSource).
  function resolveMaskDraw(w, h, sourceEl) {
    if (!sourceEl) return null;
    if (sourceEl.tagName === 'IMG') {
      if (!sourceEl.naturalWidth) return null;
      const style = getComputedStyle(sourceEl);
      const pos = parsePercentPair(style.objectPosition, 0.5, 0.5);
      const rect = fitRect(sourceEl.naturalWidth, sourceEl.naturalHeight, w, h, style.objectFit, pos.x, pos.y);
      return { img: sourceEl, rect };
    }
    const bgImg = getBgImage(sourceEl);
    if (!bgImg || !bgImg.complete || !bgImg.naturalWidth) return null;
    const style = getComputedStyle(sourceEl);
    const size = parsePercentPair(style.backgroundSize, 1, 1);
    const pos = parsePercentPair(style.backgroundPosition, 0.5, 0.5);
    const drawW = w * size.x, drawH = h * size.y;
    return { img: bgImg, rect: { x: (w - drawW) * pos.x, y: (h - drawH) * pos.y, w: drawW, h: drawH } };
  }

  // Clips the already-drawn texture to the source's actual visible pixels (its alpha channel, at
  // its real fit/position rect) so a transparent-background sprite — smoke, volcano, the astronaut
  // — doesn't read as a textured rectangle floating over the scene behind it.
  function maskToSource(ctx, w, h, sourceEl) {
    const draw = resolveMaskDraw(w, h, sourceEl);
    if (!draw) return false;
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    maskCanvas.getContext('2d').drawImage(draw.img, draw.rect.x, draw.rect.y, draw.rect.w, draw.rect.h);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    return true;
  }

  function render(canvas, sourceEl) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const ctx = canvas.getContext('2d');
    canvas.width = w;
    canvas.height = h;
    drawWeave(ctx, w, h);
    drawGrain(ctx, w, h);
    const masked = maskToSource(ctx, w, h, sourceEl);
    // Not masked yet only means the source image hasn't decoded — leave texRendered unset so a
    // later redraw (image 'load', or the next ResizeObserver tick) isn't skipped by the guard below.
    canvas.dataset.texRendered = !sourceEl || masked ? '1' : '0';
  }

  function applyCanvasTexture(canvas) {
    // The previous sibling is what this canvas textures: an <img>, or a div painted via a CSS
    // background-image (astronaut/butterfly) — both are handled by resolveMaskDraw above.
    const sourceEl = canvas.previousElementSibling;
    render(canvas, sourceEl);
    new ResizeObserver((entries) => {
      const box = entries[0].contentRect;
      const w = Math.round(box.width), h = Math.round(box.height);
      // Skip redundant redraws (already sized+masked at this exact box) but never skip while a
      // source image is still pending — canvas.width/height already equal w/h then too.
      if (canvas.width === w && canvas.height === h && canvas.dataset.texRendered === '1') return;
      render(canvas, sourceEl);
    }).observe(canvas);
    // Bitmap not ready yet (still loading, or a lazily-fetched background-image) — redraw once it is.
    if (!sourceEl) return;
    const img = sourceEl.tagName === 'IMG' ? sourceEl : getBgImage(sourceEl);
    if (img && !img.complete) img.addEventListener('load', () => render(canvas, sourceEl), { once: true });
  }

  function init() {
    document.querySelectorAll('canvas[data-texture]').forEach(applyCanvasTexture);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.applyCanvasTexture = applyCanvasTexture;
})();
