import { Capacitor } from "@capacitor/core";

/**
 * Signale au plugin de live-update (Capgo) que l'app a démarré correctement.
 *
 * Indispensable en mode `autoUpdate` : si cet appel n'arrive pas dans les
 * secondes qui suivent le lancement (cf. `appReadyTimeout`), le plugin
 * considère le bundle OTA comme défaillant et effectue un **rollback
 * automatique** vers la version précédente. C'est le filet de sécurité qui
 * empêche un mauvais bundle de « briquer » l'app.
 *
 * No-op hors plateforme native : le web n'a pas d'OTA (il est servi par
 * nginx, mis à jour par le déploiement classique).
 */
export async function notifyAppReady(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    // Import dynamique : le plugin Capgo ne charge jamais sur le web.
    const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
    await CapacitorUpdater.notifyAppReady();
  } catch (err) {
    console.warn("Live-update : notifyAppReady a échoué", err);
  }
}
