<div align="center">

# PhotoGrid

*Plusieurs photos sur une page, à la taille réelle. Dans le navigateur, sans rien envoyer nulle part.*

[![Licence : AGPL-3.0](https://img.shields.io/badge/licence-AGPL--3.0-blue.svg)](./LICENSE)
[![Application web](https://img.shields.io/badge/web-photogrid.ojicode.fr-C4693D.svg)](https://photogrid.ojicode.fr)
[![PWA](https://img.shields.io/badge/PWA-installable-5a5a5a.svg)](https://photogrid.ojicode.fr)

</div>

<!--
  Image de couverture. Pour la remplacer plus tard par une démo animée :
  déposez le fichier dans public/screenshots/demo.gif et changez la ligne
  ci-dessous en :  <img src="./public/screenshots/demo.gif" alt="Démo de PhotoGrid" />
-->
<a href="https://photogrid.ojicode.fr">
  <img src="./public/screenshots/desktop.png" alt="Aperçu de PhotoGrid" width="100%" />
</a>

Vous voulez tirer plusieurs photos sur une même feuille (planche de famille,
photos d'identité, mosaïque, contact sheet) sans en gâcher la moitié à
l'impression ? PhotoGrid pose vos images sur une grille réglable et les sort à
l'échelle millimétrique exacte, en **A4, A5, Letter ou Legal**.

Et vos photos ne bougent pas : tout le traitement se fait dans votre navigateur,
même hors-ligne. Pas de compte, pas d'upload. Le code est ouvert, vous pouvez le
vérifier vous-même.

**React 19 + Vite + Tailwind 4 + base-ui.** Application 100 % client, installable
(PWA), aussi packagée en application Android via Capacitor.

- Application web : https://photogrid.ojicode.fr
- Application Android (APK signé) : voir les [Releases](https://github.com/ojicodehq/photogrid/releases)

## En trois étapes

1. Ajoutez vos photos.
2. Choisissez le format (A4, A5, Letter, Legal), l'orientation et la grille :
   colonnes, lignes, marges, espacement.
3. Imprimez ou exportez en PDF, au millimètre près.

Ce que vous voyez à l'écran correspond exactement à ce qui sort de l'imprimante,
sans mise à l'échelle surprise.

## Sous le capot

Tout l'intérêt est de faire ça **sans serveur**. Voici comment ça tient côté
code :

- **Zéro upload.** Import, redimensionnement, composition et génération du PDF
  tournent dans le navigateur. Les images ne quittent jamais l'appareil.
- **Échelle physique.** La mise en page est calculée en millimètres, pas en
  pixels : le rendu colle aux dimensions réelles du format choisi.
- **PDF hors du thread principal.** La génération s'exécute dans un Web Worker,
  donc l'interface ne fige pas sur un gros lot d'images.
- **Hors-ligne et installable.** Service worker géré par Serwist, photos
  persistées en local via IndexedDB.
- **Android.** La même base web est empaquetée avec Capacitor et reçoit des
  correctifs à chaud (OTA) chiffrés de bout en bout.

Par où commencer la lecture :

- `src/lib/pdf/` : génération du PDF dans un Web Worker.
- `src/lib/printService.ts` : impression navigateur à l'échelle exacte.
- `src/lib/photoStorage.ts` : persistance locale des photos (IndexedDB).
- `src/components/photogrid/` : composition et aperçu de la grille.
- `src/lib/strings/fr.ts` : tous les textes de l'interface, centralisés.

## Lancer le projet en local

Node.js >= 20.

```bash
npm install
npm run dev        # serveur de dev Vite (http://localhost:5173)
npm run build      # build de production vers dist/
npm run preview    # prévisualise le build de production
npm run lint       # ESLint
```

## Licence

Code source ouvert sous licence **AGPL-3.0** : voir [`LICENSE`](./LICENSE). Vous
pouvez l'utiliser, le modifier et le redistribuer, à condition de publier les
sources de toute version déployée (y compris en service web).

© 2026 Nicodème Cajuste (Ojicode).
