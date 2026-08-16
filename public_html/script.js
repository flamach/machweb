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
      ctx.fillStyle = s.variant > 0.85 ? (s.variant > 0.92 ? '#8b5cf6' : '#4cc9f0') : '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();

  // Mobile menu
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  menuToggle.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    menuToggle.textContent = open ? '✕' : '☰';
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    menuToggle.textContent = '☰';
  }));

  // Nav glass droplet — glides between links on hover
  const navLinksEl = document.getElementById('nav-links');
  const navGlass = document.getElementById('nav-glass');
  if (navLinksEl && navGlass && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    navLinksEl.querySelectorAll('a').forEach(link => {
      link.addEventListener('mouseenter', () => {
        const linkRect = link.getBoundingClientRect();
        const parentRect = navLinksEl.getBoundingClientRect();
        navGlass.style.left = (linkRect.left - parentRect.left) + 'px';
        navGlass.style.width = linkRect.width + 'px';
        navGlass.classList.add('visible');
      });
    });
    navLinksEl.addEventListener('mouseleave', () => {
      navGlass.classList.remove('visible');
    });
  }

  // Scroll spy
  const sectionIds = ['hero', 'about', 'projects', 'booking', 'contact'];
  const navLinkEls = document.querySelectorAll('.nav-links a, .mobile-menu a');
  function updateActive() {
    const scrollPos = window.scrollY + window.innerHeight / 3;
    let current = 'hero';
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= scrollPos) current = id;
    });
    navLinkEls.forEach(a => {
      a.classList.toggle('active', a.dataset.section === current);
    });
  }
  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();

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
})();
