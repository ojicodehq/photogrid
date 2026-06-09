#!/usr/bin/env bash
#
# Build le bundle web, le CHIFFRE de bout en bout (clé privée locale) puis
# publie le bundle + le manifest `updates.json` sur l'endpoint OTA public.
# C'est ce qui pousse un correctif web aux APK déjà installés, sans repasser
# par le store (live update Capgo, auto-hébergé).
#
# Prérequis :
#   - .capgo_key_v2 présent à la racine (clé privée E2E, JAMAIS commitée).
#     Sans elle, impossible de signer/chiffrer : l'app rejetterait le bundle.
#   - Variables d'environnement :
#       PHOTOGRID_OTA_HOST : hôte SSH de destination
#       PHOTOGRID_OTA_DIR  : dossier OTA distant
#
# La version publiée est celle de package.json : elle DOIT être strictement
# supérieure à celle embarquée dans l'APK installé, sinon l'app n'applique
# pas la mise à jour. Utiliser `npm run release:ota` qui bumpe avant.
#
# Usage : PHOTOGRID_OTA_HOST=... PHOTOGRID_OTA_DIR=... npm run publish:bundle
#
set -euo pipefail

SLUG="photogrid"
APP_ID="fr.ojicode.photogrid"
PUBLIC_BASE="https://photogrid.ojicode.fr/ota"
REMOTE_HOST="${PHOTOGRID_OTA_HOST:?Définir PHOTOGRID_OTA_HOST (hôte SSH de destination)}"
REMOTE_DIR="${PHOTOGRID_OTA_DIR:?Définir PHOTOGRID_OTA_DIR (dossier OTA distant)}"

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

if [ ! -f "$ROOT/.capgo_key_v2" ]; then
    echo "✗ Clé privée .capgo_key_v2 absente : impossible de chiffrer le bundle." >&2
    exit 1
fi

VERSION=$(node -p "require('./package.json').version")
NAME="$SLUG-$VERSION"

echo "→ Bundle OTA v$VERSION"
echo "→ Build web…"
npm run build

# Artefacts dans un dossier temporaire (jamais dans le repo).
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

echo "→ Zip du bundle…"
ZIP_JSON=$(npx @capgo/cli bundle zip "$APP_ID" \
    --path "$ROOT/dist" --bundle "$VERSION" --name "$WORK/$NAME" --key-v2 --json)
CHECKSUM=$(node -e "process.stdout.write(JSON.parse(process.argv[1]).checksum)" "$ZIP_JSON")

echo "→ Chiffrement E2E…"
ENC_JSON=$(npx @capgo/cli bundle encrypt "$WORK/$NAME" "$CHECKSUM" --json)
ENC_CHECKSUM=$(node -e "process.stdout.write(JSON.parse(process.argv[1]).checksum)" "$ENC_JSON")
SESSION_KEY=$(node -e "process.stdout.write(JSON.parse(process.argv[1]).ivSessionKey)" "$ENC_JSON")
ENC_FILE="$WORK/${NAME}_encrypted.zip"
if [ ! -f "$ENC_FILE" ]; then
    echo "✗ Bundle chiffré introuvable : $ENC_FILE" >&2
    exit 1
fi

echo "→ Génération du manifest updates.json…"
MANIFEST="$WORK/updates.json"
node -e '
const [version, url, session_key, checksum] = process.argv.slice(1);
process.stdout.write(JSON.stringify({ version, url, session_key, checksum }) + "\n");
' "$VERSION" "$PUBLIC_BASE/$NAME.zip" "$SESSION_KEY" "$ENC_CHECKSUM" > "$MANIFEST"

echo "→ Envoi vers $REMOTE_HOST:$REMOTE_DIR…"
ssh "$REMOTE_HOST" "mkdir -p $REMOTE_DIR"
scp "$ENC_FILE" "$REMOTE_HOST:$REMOTE_DIR/$NAME.zip"
# Le manifest est envoyé EN DERNIER : tant qu'il ne pointe pas vers le
# nouveau bundle, aucune app ne tente de le télécharger (pas d'état incohérent).
scp "$MANIFEST" "$REMOTE_HOST:$REMOTE_DIR/updates.json"

echo "✓ Bundle OTA v$VERSION publié : $PUBLIC_BASE/updates.json"
