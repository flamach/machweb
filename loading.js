(() => {
  const root = document.getElementById('boot-loader');
  if (!root) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN_DISPLAY = reduced ? 0.4 : 3.0;
  const MAX_WAIT = 12; // safety: never block launch forever
  const RING_T = reduced ? 0 : 1.05;
  const READY_HOLD = reduced ? 0.05 : 0.35;

  const $ = (sel) => root.querySelector(sel);
  const els = {
    stars: $('#bl-stars'),
    bootLines: $('#bl-boot-lines'),
    ring: $('#bl-ring'),
    ringWrap: $('.bl-ring-wrap'),
    pct: $('#bl-pct'),
    status: $('#bl-status'),
    gauges: $('#bl-gauges'),
    annunciators: $('#bl-annunciators'),
    fuelFill: $('#bl-fuel-fill'),
    fuelPct: $('#bl-fuel-pct'),
    hdg: $('#bl-hdg'),
    vel: $('#bl-vel'),
    g: $('#bl-g'),
    flash: $('#bl-flash'),
    dials: root.querySelectorAll('.bl-dial-needle'),
  };

  document.body.classList.add('bl-active');

  // ---- build decorative content ----
  const rnd = (() => { let s = 42; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const starFrag = document.createDocumentFragment();
  for (let i = 0; i < 90; i++) {
    const s = document.createElement('div');
    s.className = 'bl-star';
    s.style.left = (rnd() * 100) + '%';
    s.style.top = (rnd() * 100) + '%';
    s.style.setProperty('--s', (rnd() * 1.6 + 0.4).toFixed(2) + 'px');
    s.style.setProperty('--o', (rnd() * 0.6 + 0.25).toFixed(2));
    s.style.setProperty('--d', (rnd() * 3).toFixed(2) + 's');
    starFrag.appendChild(s);
  }
  els.stars.appendChild(starFrag);

  const GAUGE_TARGETS = [0.85, 0.58, 0.95, 0.48, 0.72, 0.64];
  const gaugeBars = GAUGE_TARGETS.map(() => {
    const cell = document.createElement('div');
    const fill = document.createElement('span');
    cell.appendChild(fill);
    els.gauges.appendChild(cell);
    return fill;
  });

  const WAVE_BARS = 18;
  const waveform = document.getElementById('bl-waveform');
  for (let i = 0; i < WAVE_BARS; i++) {
    const bar = document.createElement('span');
    bar.style.setProperty('--wd', (rnd() * 1.1).toFixed(2) + 's');
    waveform.appendChild(bar);
  }

  const ANNUNCIATORS = [
    ['ENG 1', 0], ['ENG 2', 0], ['O2', 0], ['PRESS', 0],
    ['RCS', 1], ['COM', 0], ['NAV', 0], ['BAT', 1],
  ];
  const annCells = ANNUNCIATORS.map(([label, warn]) => {
    const cell = document.createElement('div');
    cell.textContent = label;
    if (warn) cell.classList.add('bl-warn');
    els.annunciators.appendChild(cell);
    return cell;
  });

  const BOOT_LINE_T = [0.5, 0.64, 0.78, 0.92];
  const bootLineEls = els.bootLines.querySelectorAll('div');

  const PANEL_T = { screen: 0.35, prop: 0.55, nav: 0.75, bottom: 0.95 };
  const panelEls = {
    screen: $('.bl-screen'),
    prop: $('.bl-panel-prop'),
    nav: $('.bl-panel-nav'),
    bottom: $('.bl-bottom'),
  };

  // ---- real asset readiness (gates when the loader is allowed to exit) ----
  const targets = [
    { el: document.querySelector('.planet-3d'), done: false },
    { el: document.querySelector('.ship-3d'), done: false },
  ].filter((t) => t.el);

  if (!targets.length) {
    // nothing to wait for — reveal almost immediately
    targets.push({ el: null, done: true });
  }

  targets.forEach((tg) => {
    if (!tg.el) return;
    if (tg.el.loaded) { tg.done = true; return; }
    tg.el.addEventListener('load', () => { tg.done = true; });
    tg.el.addEventListener('error', () => { tg.done = true; });
  });

  function allLoaded() {
    return targets.every((tg) => tg.done);
  }

  // ---- fake ramp (keeps the UI feeling alive before real progress events land) ----
  function lerp(input, output, t) {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        return output[i] + (output[i + 1] - output[i]) * local;
      }
    }
    return output[output.length - 1];
  }
  const fakeRamp = (t) => lerp([0.5, 1.3, 2.0, 2.6, MIN_DISPLAY], [0, 28, 55, 82, 100], t);

  // ---- audio (best-effort, silently ignored if blocked) ----
  let ac = null;
  function ctx() { return ac || (ac = new (window.AudioContext || window.webkitAudioContext)()); }
  function blip(f) {
    try {
      const a = ctx(), o = a.createOscillator(), g = a.createGain(), n = a.currentTime;
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, n);
      g.gain.exponentialRampToValueAtTime(0.12, n + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, n + 0.16);
      o.connect(g).connect(a.destination); o.start(n); o.stop(n + 0.18);
    } catch (e) {}
  }
  function sweep() {
    try {
      const a = ctx(), o = a.createOscillator(), g = a.createGain(), n = a.currentTime;
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(180, n);
      o.frequency.exponentialRampToValueAtTime(950, n + 0.32);
      g.gain.setValueAtTime(0.0001, n);
      g.gain.exponentialRampToValueAtTime(0.1, n + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, n + 0.4);
      o.connect(g).connect(a.destination); o.start(n); o.stop(n + 0.42);
    } catch (e) {}
  }
  const beepEvents = reduced ? [] : [[0.35, 420], [0.55, 540], [0.75, 640], [0.95, 720], [1.3, 800], [2.3, 900]];
  let beepIdx = 0;

  // ---- state machine ----
  const start = performance.now();
  let ready = false;
  let exiting = false;
  let sweepPlayed = false;

  function frame(now) {
    const t = (now - start) / 1000;

    BOOT_LINE_T.forEach((thr, i) => {
      if (t >= thr) bootLineEls[i].classList.add('bl-on');
    });
    Object.entries(PANEL_T).forEach(([key, thr]) => {
      if (t >= thr) panelEls[key].classList.add('bl-on');
    });
    while (beepIdx < beepEvents.length && t >= beepEvents[beepIdx][0]) {
      blip(beepEvents[beepIdx][1]); beepIdx++;
    }
    ANNUNCIATORS.forEach(([, ], i) => {
      if (t >= PANEL_T.bottom + (0.1 + i * 0.05)) annCells[i].classList.add('bl-on');
    });

    const riseGauge = Math.max(0, Math.min(1, (t - PANEL_T.prop) / 0.9));
    GAUGE_TARGETS.forEach((target, i) => {
      const h = Math.max(0, Math.min(1, (target + 0.06 * Math.sin(t * 5 + i * 1.7)) * riseGauge));
      gaugeBars[i].style.height = (h * 100) + '%';
    });

    els.dials.forEach((needle, i) => {
      const boot = PANEL_T.bottom + i * 0.1;
      const value = i === 0 ? 0.66 : 0.42;
      const rise = Math.max(0, Math.min(1, (t - boot) / 1.0));
      const ang = -120 + Math.max(0, Math.min(1, value * rise)) * 240;
      needle.style.transform = `translateX(-50%) rotate(${ang}deg)`;
    });

    if (t >= RING_T) {
      els.ringWrap.classList.add('bl-on');
      els.status.classList.add('bl-on');
    }

    const pct = Math.min(100, Math.round(fakeRamp(t)));
    els.ring.style.setProperty('--pct', pct);
    els.pct.firstChild.textContent = pct;
    els.fuelFill.style.width = pct + '%';
    els.fuelPct.textContent = pct + '%';

    els.hdg.textContent = (214 + Math.floor(t * 3) % 6).toString().padStart(3, '0') + '°';
    els.vel.textContent = (11.42 + 0.3 * Math.sin(t * 2)).toFixed(2);
    els.g.textContent = (1.0 + 0.02 * Math.sin(t * 3)).toFixed(2);

    const canFinish = (allLoaded() && t >= MIN_DISPLAY) || t >= MAX_WAIT;
    if (!ready && canFinish) {
      ready = true;
      els.status.textContent = '■ LAUNCH';
      els.status.classList.add('bl-ready');
      if (!sweepPlayed && !reduced) { sweep(); sweepPlayed = true; }
      setTimeout(beginExit, READY_HOLD * 1000);
    }

    if (!exiting) requestAnimationFrame(frame);
  }

  function beginExit() {
    if (exiting) return;
    exiting = true;
    if (!reduced) {
      els.flash.classList.add('bl-on');
      setTimeout(() => els.flash.classList.add('bl-off'), 160);
    }
    setTimeout(() => {
      root.classList.add('bl-exit');
      document.body.classList.remove('bl-active');
      setTimeout(() => { root.classList.add('bl-hidden'); root.remove(); }, 650);
    }, reduced ? 0 : 220);
  }

  requestAnimationFrame(frame);
})();
