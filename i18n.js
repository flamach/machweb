(() => {
  const fr = {
    'page.title': 'Quentin Machado — Développeur Web Full-Stack',
    'page.description': 'Quentin Machado, développeur web full-stack. Interfaces modernes, précises et performantes.',
    'boot.ariaLabel': 'Chargement du site',
    'nav.about': 'À propos',
    'nav.projects': 'Projets',
    'nav.booking': 'Réserver',
    'nav.contact': 'Contact',
    'menu.open': 'Ouvrir le menu',
    'hero.badge': 'Disponible pour de nouveaux projets',
    'hero.title': 'Quentin Machado <br>\n    <span class="gradient-text">Développeur Web</span> <br>\n    Full-Stack',
    'hero.sub': 'Je conçois et développe des interfaces web modernes, précises et performantes.',
    'hero.ctaProjects': 'Voir mes projets',
    'hero.ctaAbout': 'À propos de moi',
    'hero.scrollHint': 'Descendre',
    'model.rocketAlt': "Fusée en orbite autour d'une lune",
    'model.shipAlt': 'Vaisseau spatial Outer Wilds',
    'model.blackholeAlt': 'Trou noir',
    'about.eyebrow': 'À propos',
    'about.heading': 'Qui suis-je',
    'about.role': 'Développeur Full-Stack',
    'about.vitalYears': 'Années XP',
    'about.vitalProjects': 'Projets',
    'about.vitalCoffees': 'Cafés/jour',
    'about.bio': "Rattaché à la station orbitale du web depuis plus de 4 ans, je conçois des interfaces qui allient précision d'ingénierie et esthétique. Ma spécialité : transformer des besoins produit complexes en expériences fluides et surtout rapide de A à Z.",
    'about.skillsEyebrow': 'Compétences',
    'about.skillAI': 'IA / PROMPTS',
    'projects.eyebrow': 'Projets',
    'projects.heading': 'Projets récents',
    'projects.statusOnline': '● En ligne',
    'projects.statusProgress': '● En cours',
    'projects.orbitalDesc': 'Plateforme e-commerce headless, panier temps réel et paiement en une étape. Trafic multiplié par 3.',
    'projects.signalDesc': 'Tableau de bord analytique temps réel pour équipes produit, visualisation de flux de données massifs.',
    'projects.nebulaDesc': 'CMS headless sur-mesure pour éditeurs de contenu, prévisualisation instantanée et versioning.',
    'projects.deepspaceDesc': 'CRM interne pour équipes commerciales, automatisation de pipelines et reporting.',
    'projects.viewCode': 'Voir le code ↗',
    'booking.eyebrow': 'Rendez-vous',
    'booking.heading': 'Réserver un appel',
    'booking.sub': 'Réservez un créneau de 30 minutes pour discuter de votre projet.',
    'booking.liveTag': 'Réservation en direct',
    'booking.poweredBy': 'Propulsé par <a href="https://www.cal.eu/flamach/30min" target="_blank" rel="noopener">cal.eu/flamach</a>',
    'booking.openNewTab': 'Ouvrir dans un nouvel onglet',
    'contact.heading': 'Discutons de votre projet',
    'contact.sub': 'Un mail, une idée, un projet en tête ? Écrivez-moi, je réponds rapidement.',
    'contact.firstName': 'Prénom',
    'contact.lastName': 'Nom',
    'contact.placeholderFirstName': 'Jean',
    'contact.placeholderLastName': 'Dupont',
    'contact.placeholderEmail': 'jean.dupont@email.com',
    'contact.placeholderMessage': 'Parlez-moi de votre projet...',
    'contact.send': 'Envoyer le message',
    'footer.available': 'Disponible pour de nouveaux projets · 2026',
  };

  const original = { text: {}, html: {}, attr: {} };

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    original.text[key] = el.textContent;
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    original.html[key] = el.innerHTML;
  });
  const ATTRS = ['aria-label', 'alt', 'placeholder', 'content'];
  ATTRS.forEach((attr) => {
    document.querySelectorAll(`[data-i18n-${attr}]`).forEach((el) => {
      const key = el.getAttribute(`data-i18n-${attr}`);
      if (!original.attr[attr]) original.attr[attr] = {};
      original.attr[attr][key] = el.getAttribute(attr);
    });
  });

  function applyLang(lang) {
    const dict = lang === 'fr' ? fr : null;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      el.textContent = dict && dict[key] != null ? dict[key] : original.text[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      el.innerHTML = dict && dict[key] != null ? dict[key] : original.html[key];
    });
    ATTRS.forEach((attr) => {
      document.querySelectorAll(`[data-i18n-${attr}]`).forEach((el) => {
        const key = el.getAttribute(`data-i18n-${attr}`);
        const val = dict && dict[key] != null ? dict[key] : original.attr[attr][key];
        el.setAttribute(attr, val);
      });
    });

    document.documentElement.lang = lang;

    const label = document.getElementById('lang-toggle-label');
    const toggle = document.getElementById('lang-toggle');
    if (label && toggle) {
      label.textContent = lang === 'fr' ? 'EN' : 'FR';
      toggle.setAttribute('aria-label', lang === 'fr' ? 'Switch to English' : 'Switch to French');
    }
  }

  let current = 'en';
  try {
    const stored = localStorage.getItem('lang');
    if (stored === 'en' || stored === 'fr') current = stored;
  } catch (e) {}

  if (current !== 'en') applyLang(current);

  const toggle = document.getElementById('lang-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      current = current === 'en' ? 'fr' : 'en';
      applyLang(current);
      try { localStorage.setItem('lang', current); } catch (e) {}
    });
  }
})();
