(() => {
  const fr = {
    'page.title': 'Quentin Machado — Développeur Web Full-Stack',
    'page.description': 'Quentin Machado, développeur web full-stack. Interfaces modernes, précises et performantes.',
    'hero.scene1.title': 'du contenu<br>remarquable',
    'hero.scene1.sub': 'Révélez le potentiel de votre marque<br>grâce à une stratégie sur mesure,<br>une créativité audacieuse<br class="desktop-only">et un storytelling inoubliable.',
    'hero.scene2.title': "l'excellence<br>par le design",
    'hero.scene2.sub': 'Nous façonnons des identités de marque <br class="mobile-only">singulières <br class="desktop-only">et mémorables <br class="mobile-only">pour vous démarquer<br>et sublimer votre présence sur le marché.',
    'hero.scene3.title': 'des expériences<br>percutantes',
    'hero.scene3.sub': 'Nous concevons des expériences immersives et marquantes pour affirmer votre identité et démultiplier votre impact auprès de votre audience.',
    'hero.scene4.title': 'marquez les esprits',
    'hero.scene4.sub': "De la stratégie globale à l'exécution créative, nous bâtissons des univers de marque audacieux qui renforcent votre visibilité et tissent des liens durables.",
    'hero.scene4.cta': "Créons l'exceptionnel",
    'projects.eyebrow': 'Démos',
    'projects.heading': 'Des sites conçus<br>pour durer',
    'projects.sub': 'Des interfaces rapides et sur mesure, pensées pour chaque métier et chaque histoire.',
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

  let current = 'fr';
  try {
    const stored = localStorage.getItem('lang');
    if (stored === 'en' || stored === 'fr') current = stored;
  } catch (e) {}

  applyLang(current);

  const toggle = document.getElementById('lang-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      current = current === 'en' ? 'fr' : 'en';
      applyLang(current);
      try { localStorage.setItem('lang', current); } catch (e) {}
    });
  }
})();
