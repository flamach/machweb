(function () {
  const overlay = document.getElementById('loading-screen');
  if (!overlay) return;

  function finish() {
    document.body.classList.remove('loading-lock');
    overlay.remove();
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finish();
    return;
  }

  document.body.classList.add('loading-lock');

  const SPIN_MS = 2200;
  const SEAM_MS = 350;
  const OPEN_MS = 900;

  overlay.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'transform') finish();
  }, { once: true });

  // Filet de sécurité si transitionend ne se déclenche pas (onglet en arrière-plan, etc.)
  setTimeout(finish, SPIN_MS + SEAM_MS + OPEN_MS + 500);

  setTimeout(() => {
    overlay.classList.add('seam');
    setTimeout(() => {
      overlay.classList.remove('seam');
      overlay.classList.add('opening');
    }, SEAM_MS);
  }, SPIN_MS);
})();
