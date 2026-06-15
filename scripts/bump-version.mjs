#!/usr/bin/env node
/**
 * Gestion de version, avec UNE seule source de vérité : `package.json`.
 *
 * La version produit (= versionName = version du bundle OTA) ne s'incrémente
 * qu'au moment d'une release web/OTA (`--web-only`). Un build APK NE rebumpe
 * PAS cette version : il reprend telle quelle celle de `package.json` (même
 * code = même version) et n'incrémente que le `versionCode` Android, exigé
 * strictement croissant pour proposer une mise à jour par-dessus une install.
 *
 * Conséquence : l'OTA et l'APK partagent toujours le même versionName. Fini
 * le décalage où l'OTA affichait 0.1.10 et l'APK 0.1.11 pour le même code.
 *
 * Modes :
 *   --web-only : incrémente package.json (+ package-lock), laisse build.gradle.
 *                Appelé par `npm run release:ota`.
 *   (défaut)   : laisse package.json, aligne build.gradle versionName dessus
 *                et incrémente versionCode. Appelé par `npm run release:apk`.
 *
 * Pour livrer une nouvelle version sur les deux canaux : `release:ota` (qui
 * porte le bump) puis `release:apk` (qui reprend la même version). Un APK
 * purement natif sans changement web reste à la version courante ; seul son
 * versionCode avance (Android accepte des versionName identiques).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const webOnly = process.argv.includes("--web-only");

const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [major, minor, patch] = pkg.version.split(".").map(Number);
if ([major, minor, patch].some(Number.isNaN)) {
  throw new Error(`Version package.json non sémantique : ${pkg.version}`);
}

if (webOnly) {
  // Release web/OTA : on incrémente la version produit (source de vérité).
  const next = `${major}.${minor}.${patch + 1}`;
  pkg.version = next;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  // package-lock.json (champ version racine)
  const lockPath = join(root, "package-lock.json");
  if (existsSync(lockPath)) {
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    lock.version = next;
    if (lock.packages?.[""]) lock.packages[""].version = next;
    writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
  }

  console.log(
    `✓ Version web bumpée (OTA) : ${major}.${minor}.${patch} → ${next} (build.gradle inchangé)`,
  );
} else {
  // Build APK : on NE rebumpe PAS package.json. L'APK reprend la version
  // courante (= dernier bundle OTA, même code) comme versionName et n'avance
  // que le versionCode Android. Évite le décalage versionName OTA/APK.
  const version = pkg.version;
  const gradlePath = join(root, "android", "app", "build.gradle");
  let gradle = readFileSync(gradlePath, "utf8");
  const codeMatch = gradle.match(/versionCode\s+(\d+)/);
  if (!codeMatch) throw new Error("versionCode introuvable dans build.gradle");
  const nextCode = Number(codeMatch[1]) + 1;
  gradle = gradle
    .replace(/versionCode\s+\d+/, `versionCode ${nextCode}`)
    .replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
  writeFileSync(gradlePath, gradle);

  console.log(
    `✓ APK : versionName ${version} (aligné sur package.json), versionCode → ${nextCode}`,
  );
}
