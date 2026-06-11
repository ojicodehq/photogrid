#!/usr/bin/env bash
#
# Build un APK release SIGNÉ puis le publie sur un hôte distant via SSH/SCP.
#
# Prérequis : la signature release doit être configurée dans android/
# (signingConfig dans app/build.gradle lisant un keystore + mots de passe
#  depuis android/gradle.properties — ces fichiers restent HORS du dépôt).
#
# Configurer avant usage (variables d'environnement) :
#   PHOTOGRID_REMOTE_HOST : hôte SSH de destination
#   PHOTOGRID_REMOTE_DIR  : dossier distant où déposer l'APK
#
# Usage : PHOTOGRID_REMOTE_HOST=... PHOTOGRID_REMOTE_DIR=... npm run publish:apk
#
# Étape optionnelle : si `gh` est installé et authentifié, l'APK signé est aussi
# publié sur GitHub Releases (tag vX.Y.Z = version de package.json, synchronisée
# avec build.gradle par le bump APK). Un échec de cette étape n'annule pas le SCP.
#
set -euo pipefail

SLUG="photogrid"
APP_NAME="PhotoGrid"
REMOTE_HOST="${PHOTOGRID_REMOTE_HOST:?Définir PHOTOGRID_REMOTE_HOST (hôte SSH de destination)}"
REMOTE_DIR="${PHOTOGRID_REMOTE_DIR:?Définir PHOTOGRID_REMOTE_DIR (dossier distant des APK)}"
APK_SRC="android/app/build/outputs/apk/release/app-release.apk"

cd "$(dirname "$0")/.."

VERSION=$(node -p "require('./package.json').version")

echo "→ Build web + synchronisation Android…"
npm run build
npx cap sync android

echo "→ Build de l'APK release (signé)…"
(cd android && ./gradlew assembleRelease)

if [ ! -f "$APK_SRC" ]; then
    echo "✗ APK introuvable : $APK_SRC" >&2
    exit 1
fi

echo "→ Génération du sidecar de métadonnées…"
TMP_JSON=$(mktemp)
trap 'rm -f "$TMP_JSON"' EXIT
printf '{"name":"%s","version":"%s"}\n' "$APP_NAME" "$VERSION" > "$TMP_JSON"
chmod 644 "$TMP_JSON"  # mktemp crée en 600 ; le sidecar doit rester lisible

echo "→ Envoi vers $REMOTE_HOST:$REMOTE_DIR…"
ssh "$REMOTE_HOST" "mkdir -p $REMOTE_DIR"
scp "$APK_SRC" "$REMOTE_HOST:$REMOTE_DIR/$SLUG.apk"
scp "$TMP_JSON" "$REMOTE_HOST:$REMOTE_DIR/$SLUG.json"

echo "✓ $SLUG.apk (v$VERSION) publié sur $REMOTE_HOST:$REMOTE_DIR."

# Release GitHub (optionnelle) : publie l'APK signé sur la page Releases, taguée
# v$VERSION. Étape secondaire — un échec ici n'annule pas la livraison SCP.
TAG="v$VERSION"
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    echo "→ Release GitHub $TAG…"
    if gh release view "$TAG" >/dev/null 2>&1; then
        gh release upload "$TAG" "$APK_SRC#$SLUG-$TAG.apk" --clobber \
            && echo "✓ APK ajouté à la release $TAG existante." \
            || echo "⚠ Échec de l'upload sur la release $TAG (ignoré)."
    else
        gh release create "$TAG" "$APK_SRC#$SLUG-$TAG.apk" \
            --title "$APP_NAME $TAG" \
            --notes "Signed Android APK for $APP_NAME $TAG. The web layer ships separately via OTA." \
            && echo "✓ Release GitHub $TAG créée." \
            || echo "⚠ Échec de création de la release $TAG (ignoré)."
    fi
else
    echo "ℹ gh absent ou non authentifié : release GitHub ignorée."
fi
