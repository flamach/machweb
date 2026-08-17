// Données du menu — isolées ici pour pouvoir être remplacées plus tard
// par un fetch vers une appli de gestion de menu.
// Bilingue (fr/en) pour le bouton de traduction du site.
// Exposées via window.VSData (scripts classiques, pas de modules ES,
// pour que le site fonctionne aussi ouvert directement en file://).

(function () {

const beers = {
  fr: [
    { name: 'La Vieux Singe Blonde', style: 'Blonde', badgeColor: '#e8c15f', abv: '4,8°', desc: "Notre blonde de soif, légère et céréalière. Celle qu'on commande sans réfléchir.", p25: '3,50 €', p50: '6,50 €' },
    { name: 'Ambrée Cannelle', style: 'Ambrée', badgeColor: '#cf8b3e', abv: '5,9°', desc: "Notes de caramel, cannelle et fût de chêne. L'esprit whisky de la maison.", p25: '4,00 €', p50: '7,50 €' },
    { name: 'IPA du Singe', style: 'IPA', badgeColor: '#d9a441', abv: '6,2°', desc: 'Houblonnée à cru, agrumes et résine. Amertume franche, fin de bouche sèche.', p25: '4,20 €', p50: '8,00 €' },
    { name: 'Blanche des Lianes', style: 'Blanche', badgeColor: '#e8d9a8', abv: '4,5°', desc: "Blé, coriandre et écorce d'orange. Fraîche comme une sieste à l'ombre.", p25: '3,80 €', p50: '7,00 €' },
    { name: 'Stout du Comptoir', style: 'Stout', badgeColor: '#a8794a', abv: '5,4°', desc: "Café torréfié, cacao, mousse crémeuse. Le dessert de ceux qui n'aiment pas les desserts.", p25: '4,20 €', p50: '8,00 €' },
    { name: 'Triple 1966', style: 'Triple', badgeColor: '#deb054', abv: '8,5°', desc: 'La costaude de la bande, ronde et fruitée. À déguster, pas à descendre.', p25: '4,80 €', p50: '9,00 €' },
  ],
  en: [
    { name: 'Vieux Singe Blonde', style: 'Blonde', badgeColor: '#e8c15f', abv: '4.8%', desc: "Our easy-drinking blonde, light and malty. The one you order without a second thought.", p25: '€3.50', p50: '€6.50' },
    { name: 'Cinnamon Amber', style: 'Amber', badgeColor: '#cf8b3e', abv: '5.9%', desc: "Notes of caramel, cinnamon and oak. The house's whisky-inspired ale.", p25: '€4.00', p50: '€7.50' },
    { name: 'Monkey IPA', style: 'IPA', badgeColor: '#d9a441', abv: '6.2%', desc: 'Dry-hopped, citrus and resin. Bold bitterness, dry finish.', p25: '€4.20', p50: '€8.00' },
    { name: 'Vines Wheat Beer', style: 'Wheat', badgeColor: '#e8d9a8', abv: '4.5%', desc: "Wheat, coriander and orange peel. Refreshing as a nap in the shade.", p25: '€3.80', p50: '€7.00' },
    { name: 'Bar Stout', style: 'Stout', badgeColor: '#a8794a', abv: '5.4%', desc: "Roasted coffee, cocoa, creamy foam. Dessert for people who don't like dessert.", p25: '€4.20', p50: '€8.00' },
    { name: 'Triple 1966', style: 'Triple', badgeColor: '#deb054', abv: '8.5%', desc: 'The strong one of the bunch, round and fruity. To be savoured, not downed.', p25: '€4.80', p50: '€9.00' },
  ],
};

const menuCategories = {
  fr: [
    { id: 'planches', label: 'Planches' },
    { id: 'burgers', label: 'Burgers' },
    { id: 'plats', label: 'Plats' },
    { id: 'desserts', label: 'Desserts' },
  ],
  en: [
    { id: 'planches', label: 'Platters' },
    { id: 'burgers', label: 'Burgers' },
    { id: 'plats', label: 'Mains' },
    { id: 'desserts', label: 'Desserts' },
  ],
};

const dishesByCategory = {
  fr: {
    planches: [
      { name: 'Planche du Vieux Singe', price: '18 €', desc: 'Charcuteries affinées, comté 18 mois, rillettes maison, pickles et pain grillé.' },
      { name: 'Planche fromages', price: '14 €', desc: "Sélection de l'affineur, confiture de cerise noire, noix et pain de campagne." },
      { name: 'Camembert rôti', price: '12 €', desc: "Au miel et romarin, mouillettes de pain grillé à l'ail." },
      { name: 'Frites maison à partager', price: '6 €', desc: 'Double cuisson, mayonnaise à la bière ambrée.' },
    ],
    burgers: [
      { name: 'Burger du Singe', price: '16,50 €', desc: 'Bœuf charolais, cheddar affiné, oignons confits à la bière, sauce barbecue maison, frites.' },
      { name: 'Burger Cannelle BBQ', price: '17,50 €', desc: 'Poitrine fumée, sauce BBQ whisky-cannelle, cheddar, oignons crispy, frites.' },
      { name: 'Burger chèvre & miel', price: '16 €', desc: 'Chèvre fermier, miel de montagne, roquette, noix, frites.' },
      { name: 'Veggie des Lianes', price: '15 €', desc: 'Galette de pois chiches, halloumi grillé, légumes rôtis, sauce yaourt aux herbes, frites.' },
    ],
    plats: [
      { name: 'Fish & chips maison', price: '17 €', desc: 'Cabillaud en pâte à la blonde du Singe, frites, sauce tartare.' },
      { name: 'Carbonnade flamande', price: '18 €', desc: "Mijotée à l'ambrée cannelle, pain d'épices moutardé, frites." },
      { name: 'Saucisse-purée de bistrot', price: '15,50 €', desc: 'Saucisse fumée artisanale, purée à la moutarde à l\'ancienne, jus corsé.' },
      { name: 'Grande salade César', price: '14,50 €', desc: 'Poulet fermier rôti, croûtons à l\'ail, parmesan, œuf mollet.' },
    ],
    desserts: [
      { name: 'Moelleux chocolat-stout', price: '8 €', desc: 'Cœur coulant à la stout du comptoir, glace vanille.' },
      { name: 'Café ou thé gourmand', price: '8,50 €', desc: 'Trois mignardises du moment.' },
      { name: 'Tarte fine aux pommes', price: '7,50 €', desc: 'Caramel au beurre salé et cannelle, crème épaisse.' },
    ],
  },
  en: {
    planches: [
      { name: 'Vieux Singe Platter', price: '€18', desc: 'Aged cold cuts, 18-month Comté, homemade rillettes, pickles and toasted bread.' },
      { name: 'Cheese Platter', price: '€14', desc: "Cheesemonger's selection, black cherry jam, walnuts and country bread." },
      { name: 'Roasted Camembert', price: '€12', desc: "With honey and rosemary, garlic toast fingers." },
      { name: 'Homemade Fries to Share', price: '€6', desc: 'Double-cooked, amber beer mayonnaise.' },
    ],
    burgers: [
      { name: 'Singe Burger', price: '€16.50', desc: 'Charolais beef, aged cheddar, beer-braised onions, homemade barbecue sauce, fries.' },
      { name: 'Cinnamon BBQ Burger', price: '€17.50', desc: 'Smoked brisket, whisky-cinnamon BBQ sauce, cheddar, crispy onions, fries.' },
      { name: 'Goat Cheese & Honey Burger', price: '€16', desc: 'Farmhouse goat cheese, mountain honey, rocket, walnuts, fries.' },
      { name: 'Veggie of the Vines', price: '€15', desc: 'Chickpea patty, grilled halloumi, roasted vegetables, herb yoghurt sauce, fries.' },
    ],
    plats: [
      { name: 'Homemade Fish & Chips', price: '€17', desc: 'Cod in Vieux Singe blonde beer batter, fries, tartare sauce.' },
      { name: 'Flemish Carbonade', price: '€18', desc: "Slow-cooked in cinnamon amber ale, mustard gingerbread, fries." },
      { name: 'Bistro Sausage & Mash', price: '€15.50', desc: 'Artisan smoked sausage, wholegrain mustard mash, rich pan juices.' },
      { name: 'Big Caesar Salad', price: '€14.50', desc: 'Roast free-range chicken, garlic croutons, parmesan, soft-boiled egg.' },
    ],
    desserts: [
      { name: 'Chocolate-Stout Fondant', price: '€8', desc: 'Molten centre with our bar stout, vanilla ice cream.' },
      { name: 'Coffee or Tea with Sweets', price: '€8.50', desc: 'Three seasonal mini treats.' },
      { name: 'Apple Tart', price: '€7.50', desc: 'Salted butter caramel and cinnamon, thick cream.' },
    ],
  },
};

const events = {
  fr: [
    { day: 'Jeudi', title: 'SOIRÉE KARAOKÉ', time: '20h30', tilt: '-1.2deg', desc: 'Chante, ris, profite ! Toutes les voix sont les bienvenues.' },
    { day: 'Vendredi', title: 'BLIND TEST', time: '20h30', tilt: '1deg', desc: 'Quiz musical par équipes, buzzer en main. Lots à gagner !' },
    { day: 'Dimanche', title: 'APÉRO VINYLE', time: '18h00', tilt: '-0.8deg', desc: 'Apportez vos 33 tours, on les passe. Planches à moitié prix.' },
  ],
  en: [
    { day: 'Thursday', title: 'KARAOKE NIGHT', time: '8:30 pm', tilt: '-1.2deg', desc: 'Sing, laugh, enjoy! Every voice is welcome.' },
    { day: 'Friday', title: 'BLIND TEST', time: '8:30 pm', tilt: '1deg', desc: 'Team music quiz, buzzer in hand. Prizes to win!' },
    { day: 'Sunday', title: 'VINYL APERO', time: '6:00 pm', tilt: '-0.8deg', desc: 'Bring your records, we\'ll spin them. Half-price platters.' },
  ],
};

const tableMenu = {
  fr: [
    { title: 'Entrées', items: [
      { name: 'Velouté de saison', price: '9 €', desc: 'Légumes du marché, huile de noisette, croûtons au levain.' },
      { name: 'Burrata crémeuse', price: '12 €', desc: 'Tomates anciennes, pesto de fanes, focaccia maison.' },
      { name: 'Œuf parfait des sous-bois', price: '11 €', desc: 'Cuit à 63°, crème de champignons, mouillettes truffées.' },
    ]},
    { title: 'Plats', items: [
      { name: 'Magret de canard rôti', price: '24 €', desc: 'Jus au miel et thym, écrasé de pommes de terre, légumes glacés.' },
      { name: 'Pavé de lieu jaune', price: '23 €', desc: "Beurre blanc aux herbes fraîches, risotto d'épeautre, jeunes pousses." },
      { name: 'Risotto verde', price: '19 €', desc: 'Asperges, petits pois, parmesan 24 mois, huile de basilic.' },
    ]},
    { title: 'Desserts', items: [
      { name: 'Pavlova aux fruits rouges', price: '9,50 €', desc: 'Meringue croquante, chantilly vanille, coulis minute.' },
      { name: 'Chocolat grand cru', price: '10 €', desc: 'Crémeux 70%, tuile cacao, glace fève tonka.' },
      { name: 'Fromages affinés', price: '9 €', desc: 'Sélection du moment, pain aux noix, chutney.' },
    ]},
  ],
  en: [
    { title: 'Starters', items: [
      { name: 'Seasonal Velouté', price: '€9', desc: 'Market vegetables, hazelnut oil, sourdough croutons.' },
      { name: 'Creamy Burrata', price: '€12', desc: 'Heirloom tomatoes, herb pesto, homemade focaccia.' },
      { name: 'Perfect Woodland Egg', price: '€11', desc: 'Cooked at 63°C, mushroom cream, truffle soldiers.' },
    ]},
    { title: 'Mains', items: [
      { name: 'Roasted Duck Breast', price: '€24', desc: 'Honey and thyme jus, mashed potatoes, glazed vegetables.' },
      { name: 'Pollock Fillet', price: '€23', desc: "Fresh herb beurre blanc, spelt risotto, young shoots." },
      { name: 'Risotto Verde', price: '€19', desc: 'Asparagus, peas, 24-month parmesan, basil oil.' },
    ]},
    { title: 'Desserts', items: [
      { name: 'Red Berry Pavlova', price: '€9.50', desc: 'Crisp meringue, vanilla chantilly, fresh coulis.' },
      { name: 'Grand Cru Chocolate', price: '€10', desc: 'Creamy 70% chocolate, cocoa tuile, tonka bean ice cream.' },
      { name: 'Aged Cheeses', price: '€9', desc: 'Seasonal selection, walnut bread, chutney.' },
    ]},
  ],
};

const hours = {
  fr: [
    { label: 'Lundi – Jeudi', value: '16h – 00h30' },
    { label: 'Vendredi', value: '16h – 01h30' },
    { label: 'Samedi', value: '11h – 01h30' },
    { label: 'Dimanche', value: '16h – 00h' },
  ],
  en: [
    { label: 'Mon – Thu', value: '4 pm – 12:30 am' },
    { label: 'Friday', value: '4 pm – 1:30 am' },
    { label: 'Saturday', value: '11 am – 1:30 am' },
    { label: 'Sunday', value: '4 pm – 12 am' },
  ],
};

const contact = {
  address: '8 Rue Monsigny\n62200 Boulogne-sur-Mer',
  phone: '06 78 60 32 10',
  phoneHref: 'tel:+33678603210',
  email: 'contact@auvieuxsinge.fr',
  reserveUrl: 'https://www.thefork.fr',
  mapQuery: '8 Rue Monsigny, 62200 Boulogne-sur-Mer',
};

window.VSData = { beers, menuCategories, dishesByCategory, events, tableMenu, hours, contact };

})();
