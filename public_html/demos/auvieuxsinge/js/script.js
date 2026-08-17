(function () {
const { beers, menuCategories, dishesByCategory, events, tableMenu, hours } = window.VSData;
const strings = window.VSStrings;

let activeCategory = 'planches';
let currentLang = localStorage.getItem('vs-lang') === 'en' ? 'en' : 'fr';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

let revealObserver = null;
function getRevealObserver() {
  if (revealObserver || !('IntersectionObserver' in window)) return revealObserver;
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
  return revealObserver;
}

function observeReveal(root) {
  const observer = getRevealObserver();
  if (!observer) {
    root.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
    return;
  }
  root.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
}

function setHtml(container, html) {
  const observer = getRevealObserver();
  if (observer) {
    container.querySelectorAll('[data-reveal]').forEach((el) => observer.unobserve(el));
  }
  container.innerHTML = html;
  observeReveal(container);
}

function renderBeers() {
  const grid = document.getElementById('beers-grid');
  setHtml(grid, beers[currentLang].map((beer, i) => `
    <div class="beer-card" data-reveal style="--reveal-delay:${i * 60}ms">
      <div class="beer-card-top">
        <span class="beer-badge" style="background:${beer.badgeColor}">${escapeHtml(beer.style)}</span>
        <span class="beer-abv">${escapeHtml(beer.abv)}</span>
      </div>
      <h3>${escapeHtml(beer.name)}</h3>
      <p>${escapeHtml(beer.desc)}</p>
      <div class="beer-prices">
        <div><span class="size-label">25 cl</span><span class="price">${escapeHtml(beer.p25)}</span></div>
        <div><span class="size-label">50 cl</span><span class="price">${escapeHtml(beer.p50)}</span></div>
      </div>
    </div>
  `).join(''));
}

function renderCatTabs() {
  const tabs = document.getElementById('cat-tabs');
  tabs.innerHTML = menuCategories[currentLang].map((cat) => `
    <button class="cat-tab${cat.id === activeCategory ? ' active' : ''}" data-cat="${cat.id}">${escapeHtml(cat.label)}</button>
  `).join('');
  tabs.querySelectorAll('.cat-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      renderCatTabs();
      renderDishes();
    });
  });
}

function renderDishes() {
  const grid = document.getElementById('dishes-grid');
  const dishes = dishesByCategory[currentLang][activeCategory] || [];
  setHtml(grid, dishes.map((dish, i) => `
    <div class="dish-row" data-reveal style="--reveal-delay:${i * 50}ms">
      <div class="dish-row-top">
        <span class="dish-name">${escapeHtml(dish.name)}</span>
        <span class="dish-dots"></span>
        <span class="dish-price">${escapeHtml(dish.price)}</span>
      </div>
      <span class="dish-desc">${escapeHtml(dish.desc)}</span>
    </div>
  `).join(''));
}

function renderEvents() {
  const grid = document.getElementById('events-grid');
  setHtml(grid, events[currentLang].map((ev, i) => `
    <div class="event-card" data-reveal style="--reveal-delay:${i * 70}ms; transform:rotate(${ev.tilt})">
      <span class="event-day">${escapeHtml(ev.day)}</span>
      <div class="event-title-wrap"><span>${escapeHtml(ev.title)}</span></div>
      <span class="event-time">${escapeHtml(ev.time)}</span>
      <p class="event-desc">${escapeHtml(ev.desc)}</p>
    </div>
  `).join(''));
}

function renderTableMenu() {
  const container = document.getElementById('table-menu-courses');
  setHtml(container, tableMenu[currentLang].map((course, i) => `
    <div class="course-block" data-reveal style="--reveal-delay:${i * 80}ms">
      <div class="course-heading">
        <span class="line"></span>
        <h3>${escapeHtml(course.title)}</h3>
        <span class="line right"></span>
      </div>
      <div class="course-items">
        ${course.items.map((dish) => `
          <div class="dish-row">
            <div class="dish-row-top">
              <span class="dish-name">${escapeHtml(dish.name)}</span>
              <span class="dish-dots"></span>
              <span class="dish-price green">${escapeHtml(dish.price)}</span>
            </div>
            <span class="dish-desc">${escapeHtml(dish.desc)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join(''));
}

function renderHours(elementId) {
  const container = document.getElementById(elementId);
  container.innerHTML = hours[currentLang].map((h) => `
    <div class="hours-line${h.closed ? ' closed' : ''}">
      <span>${escapeHtml(h.label)}</span>
      <strong>${escapeHtml(h.value)}</strong>
    </div>
  `).join('');
}

function renderAll() {
  renderBeers();
  renderCatTabs();
  renderDishes();
  renderEvents();
  renderTableMenu();
  renderHours('hours-row-brasserie');
  renderHours('hours-row-table');
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const value = strings[currentLang][key];
    if (value === undefined) return;
    const attr = el.dataset.i18nAttr;
    if (attr) {
      el.setAttribute(attr, value);
    } else {
      el.textContent = value;
    }
  });
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('vs-lang', lang);
  applyStaticTranslations();
  renderAll();
}

function setupLangToggle() {
  const btn = document.getElementById('btn-lang');
  btn.addEventListener('click', () => {
    setLang(currentLang === 'fr' ? 'en' : 'fr');
  });
}

function goToPage(page) {
  document.getElementById('page-brasserie').classList.toggle('active', page === 'brasserie');
  document.getElementById('page-table').classList.toggle('active', page === 'table');
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.classList.toggle('active-brasserie', tab.dataset.tab === 'brasserie' && page === 'brasserie');
    tab.classList.toggle('active-table', tab.dataset.tab === 'table' && page === 'table');
  });
  document.querySelector('.navbar').classList.toggle('theme-table', page === 'table');
  window.scrollTo({ top: 0 });
}

function setupNav() {
  document.querySelectorAll('[data-go]').forEach((el) => {
    el.addEventListener('click', () => goToPage(el.dataset.go));
  });
}

function setupScrollLinks() {
  document.querySelectorAll('[data-scroll]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(el.dataset.scroll);
      if (!target) return;
      const y = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
}

applyStaticTranslations();
renderAll();
setupNav();
setupScrollLinks();
setupLangToggle();
observeReveal(document);
})();
