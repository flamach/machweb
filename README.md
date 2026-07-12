# flamach.dev

Site vitrine / portfolio de Quentin Machado, développeur web full-stack — thème spatial avec modèles 3D interactifs, prise de rendez-vous intégrée et formulaire de contact.

## Aperçu

- Hero animé avec fusée et lune en orbite (3D)
- Section À propos avec jauges de compétences animées
- Grille de projets récents
- Prise de rendez-vous en direct via Cal.eu
- Formulaire de contact via FormSubmit

## Stack

- HTML / CSS / JavaScript vanilla
- [`<model-viewer>`](https://modelviewer.dev/) pour l'affichage des modèles 3D (`.glb`)
- Cal.eu pour la réservation de créneaux
- FormSubmit pour l'envoi du formulaire de contact

## Structure

```
.
├── index.html
├── style.css
├── script.js
└── input/          # modèles 3D (.glb) et favicon
```

## Lancer le site en local

Aucune étape de build nécessaire, il suffit de servir les fichiers statiques :

```bash
python3 -m http.server 8000
```

Puis ouvrir [http://localhost:8000](http://localhost:8000).
