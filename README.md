# Bend&Peel — maquette v4

Site statique (HTML, CSS, JavaScript), sans étape de construction, prêt pour Vercel.

## Pages
- `index.html` accueil
- `dates.html` dates, carte de la tournée, archive
- `date.html?d=2026-11-07-lampisterie` page d’une date (une seule page, remplie depuis les données)
- `photo-video.html`, `sound.html`, `soutenir.html`, `accueillir.html`, `contact.html`, `404.html`

## Mettre à jour
- **Dates** : un seul fichier, `assets/js/data/dates.js`. Le site trie seul entre dates à venir et passées, calcule les statuts et les comptes à rebours (heure de Paris).
- **Images Grok** : déposer `bp-xxx.webp` dans `assets/img/grok/`, puis ajouter `'bp-xxx': true` dans `GROK_READY` (`assets/js/core/media.js`).
- **Extrait sonore** : déposer le fichier dans `assets/audio/` et renseigner `EXTRAIT` dans `assets/js/core/audio.js`. Sans extrait, le bouton lance une nappe provisoire signalée comme telle.

## Réglages utiles pour vérifier
- `?gl=0` force la version sans WebGL, `?now=2026-11-03T12:00:00+01:00` simule une autre date du jour.
- Le mode calme est mémorisé dans le navigateur ; il s’active seul si « réduire les animations » est demandé.

## Crédits
GSAP, ScrollTrigger et SplitText (GreenSock), Lenis, OGL. Polices Fraunces et Inter Tight (SIL Open Font License). Contours des départements : france-geojson.
Réservation et formulaires simulés : rien n’est réservé ni envoyé.
