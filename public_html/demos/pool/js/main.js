/* Nav state, scroll reveals, and the devis form. */
(() => {
  const nav = document.getElementById("siteNav");
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");

  const hero = document.querySelector(".hero-scroll");
  const setNavScrolled = () => {
    const threshold = hero ? hero.offsetHeight : window.innerHeight * 0.6;
    nav.classList.toggle("is-scrolled", window.scrollY >= threshold);
  };
  setNavScrolled();
  window.addEventListener("scroll", setNavScrolled, { passive: true });
  window.addEventListener("resize", setNavScrolled);

  navToggle.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!open));
    mobileNav.classList.toggle("is-open", !open);
  });
  mobileNav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      mobileNav.classList.remove("is-open");
    })
  );

  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // ponytail: no backend — swaps in a confirmation state client-side only.
  // Wire to a real endpoint (or mailto:) when the business is ready to receive leads.
  const form = document.getElementById("devisForm");
  const success = document.getElementById("devisSuccess");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    form.hidden = true;
    success.hidden = false;
  });
})();
