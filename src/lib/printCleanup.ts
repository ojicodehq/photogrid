import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";

/**
 * Nettoyage des artefacts d'impression natifs.
 *
 * Module volontairement séparé de `printService` : il est importé par
 * `AppShell` (chunk racine) et ne doit tirer ni pdf-lib ni la chaîne
 * d'impression dans le bundle initial.
 */

/** Nom du PDF temporaire écrit dans le cache natif pour l'impression. */
export const PDF_FILENAME = "photogrid.pdf";

/** Supprime le PDF temporaire du cache natif (silencieux si absent). */
export async function deleteCachedPdf(): Promise<void> {
  try {
    await Filesystem.deleteFile({
      path: PDF_FILENAME,
      directory: Directory.Cache,
    });
  } catch {
    // Fichier absent : rien à nettoyer.
  }
}

/**
 * Purge le PDF résiduel d'une impression précédente. À appeler au
 * démarrage natif : filet de sécurité si l'app a été tuée avant le
 * nettoyage post-impression (cf. `printService`), pour qu'un PDF pleine
 * résolution ne traîne pas indéfiniment dans le cache de l'appareil.
 */
export async function cleanupPrintArtifacts(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await deleteCachedPdf();
}
