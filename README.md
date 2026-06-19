# PhotoGrid

[![Licence : AGPL-3.0](https://img.shields.io/badge/licence-AGPL--3.0-blue.svg)](./LICENSE)
[![Application web](https://img.shields.io/badge/web-photogrid.ojicode.fr-C4693D.svg)](https://photogrid.ojicode.fr)
[![PWA](https://img.shields.io/badge/PWA-installable-5a5a5a.svg)](https://photogrid.ojicode.fr)

Imprimez plusieurs photos sur une seule feuille. PhotoGrid compose une grille de
photos et l'imprime à l'échelle millimétrique exacte, aux formats
**A4 / A5 / Letter / Legal**. Tout se passe dans le navigateur : aucune photo
n'est envoyée sur un serveur, et l'application fonctionne hors-ligne.

Pratique pour des planches photo, des mosaïques, des contact sheets, ou pour
caser plusieurs tirages sur une même page sans gâcher de papier.

**React 19 + Vite + Tailwind 4 + base-ui.** Application 100 % client, installable
(PWA). Également packagée en application Android via Capacitor.

- Application web : https://photogrid.ojicode.fr
- Application Android (APK signé) : voir les [Releases](https://github.com/ojicodehq/photogrid/releases)

## Aperçu

![PhotoGrid sur ordinateur](./public/screenshots/desktop.png)

<img src="./public/screenshots/mobile.png" alt="PhotoGrid sur mobile" width="320" />

## Installation

**En PWA (recommandé)** : ouvrez le site dans votre navigateur, puis
menu → *Ajouter à l'écran d'accueil*. L'app s'installe et fonctionne hors-ligne.

**En APK Android** : autorisez l'installation depuis des sources inconnues,
puis ouvrez le fichier `.apk` (disponible dans les Releases).

## Fonctionnement

1. Ajoutez vos photos.
2. Choisissez le format de page (A4, A5, Letter, Legal) et l'orientation.
3. Réglez la grille : colonnes, lignes, marges, espacement.
4. Imprimez ou exportez en PDF, au format millimétrique exact.

## Versions : web et Android

La couche web et l'APK Android sont distribués séparément, leurs numéros de
version peuvent donc différer (c'est normal) :

- **Web (PWA)** : mise à jour en continu par OTA, sans réinstallation.
- **APK Android** : publié et signé dans les [Releases](https://github.com/ojicodehq/photogrid/releases) GitHub.

La couche web évolue plus vite que le binaire Android, qui n'est republié que
lorsqu'un changement natif le nécessite.

## Prérequis

- Node.js >= 20

## Développement

```bash
npm install
npm run dev        # serveur de dev Vite (http://localhost:5173)
npm run build      # build de production vers dist/
npm run preview    # prévisualise le build de production
npm run lint       # ESLint
```

## Android (Capacitor)

```bash
npm run build:android   # build web + synchronisation du projet Android
npm run open:android    # ouvre le projet dans Android Studio
npm run release:apk     # build un APK release signé (signature à configurer dans android/)
npm run release:ota     # pousse un correctif web aux APK installés (live-update)
npm run release         # release mobile complète : OTA puis APK, même version
```

`npm run release` enchaîne `release:ota` puis `release:apk` pour publier les
deux canaux sur le même numéro de version. Il ne touche pas à git : il affiche
en fin de course la commande de commit du bump à lancer. Le site web (PWA), lui,
est déployé automatiquement à partir de la branche `main`.

Les scripts de publication lisent l'hôte et le dossier SSH de destination
depuis `.env.local`. Copiez `.env.example` en `.env.local` et renseignez vos
valeurs avant la première release (ce fichier reste local, il n'est pas versionné).

## Déploiement

Le build est statique (`dist/`) : servez-le avec n'importe quel serveur HTTP
statique. Un exemple Docker (nginx) est fourni : voir `Dockerfile`, `nginx.conf`
et `docker-compose.yml`. Le `docker-compose.yml` lit la variable `PUBLIC_DOMAIN`
(cf. `.env.example`) pour le routage.

## Licence

Code source ouvert sous licence **AGPL-3.0** : voir [`LICENSE`](./LICENSE). Vous
pouvez l'utiliser, le modifier et le redistribuer, à condition de publier les
sources de toute version déployée (y compris en service web).

Le nom « PhotoGrid », le logo et l'identité visuelle Ojicode ne sont **pas**
couverts par cette licence : voir [`TRADEMARK.md`](./TRADEMARK.md).

© 2026 Nicodème Cajuste (Ojicode).
