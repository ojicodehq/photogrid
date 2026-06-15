#!/usr/bin/env bash
#
# Release mobile complète, en UNE commande : publie le correctif web (OTA)
# PUIS régénère et publie l'APK, sur le MÊME versionName (cf. bump-version.mjs,
# qui ne rebumpe que via --web-only). Évite d'oublier un canal ou d'inverser
# l'ordre, donc évite le décalage de version OTA/APK.
#
# Le site web (PWA) n'est PAS concerné : il se déploie tout seul via GitHub
# Actions au push sur main. Ce script ne touche donc qu'aux deux canaux mobiles.
#
# Volontairement, ce script NE touche PAS à git : il publie, puis affiche la
# commande de commit/push du bump à lancer toi-même. Ainsi, un échec du build
# APK ne laisse jamais une version poussée sans artefact publié.
#
# Prérequis : SDK Android + keystore release (cf. publish-apk.sh), clé OTA
# (cf. publish-bundle.sh), et les variables de .env.local (chargées par les
# scripts publish-*).
#
# Usage : npm run release
#
set -euo pipefail

cd "$(dirname "$0")/.."

# --- Garde-fous : état git sain avant de publier quoi que ce soit ---
branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "main" ]; then
    echo "✗ Pas sur main (branche actuelle : $branch). Bascule sur main d'abord." >&2
    exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
    echo "✗ Working tree non propre : commit ou stash tes changements d'abord." >&2
    exit 1
fi
git fetch origin main --quiet
if [ -n "$(git rev-list HEAD..origin/main)" ]; then
    echo "✗ main est en retard sur origin/main : fais 'git pull' d'abord." >&2
    exit 1
fi

# --- Publications : OTA d'abord (porte le bump), APK ensuite (même version) ---
echo "→ Publication OTA…"
npm run release:ota

echo "→ Build + publication APK…"
npm run release:apk

# --- Rappel du commit à faire (le script ne pousse jamais tout seul) ---
version=$(node -p "require('./package.json').version")
echo
echo "✓ OTA + APK publiés en v$version (même versionName sur les deux canaux)."
echo "→ Reste à committer le bump (à ta main) :"
echo "    git add package.json package-lock.json"
echo "    git commit -m \"chore: release v$version\""
echo "    git push"
