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

/**
 * S'abonne à l'arrivée d'un nouveau bundle OTA. En mode `autoUpdate`, le
 * plugin télécharge et met le bundle « en attente » tout seul, puis émet
 * `updateAvailable` : on l'utilise pour prévenir l'utilisateur (un bundle
 * en attente s'appliquera au prochain redémarrage, ou tout de suite via
 * `applyUpdate`). Renvoie une fonction de désabonnement.
 *
 * No-op hors natif (le web n'a pas d'OTA) : le callback n'est jamais appelé.
 */
export async function onUpdateAvailable(
  cb: (version: string) => void,
): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => {};
  try {
    const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
    const handle = await CapacitorUpdater.addListener(
      "updateAvailable",
      (state) => cb(state.bundle.version),
    );
    return () => void handle.remove();
  } catch (err) {
    console.warn("Live-update : écoute updateAvailable a échoué", err);
    return () => {};
  }
}

/**
 * Applique immédiatement le bundle OTA en attente : `reload()` détruit le
 * contexte JS courant et recharge sur le nouveau bundle (équivaut à un
 * redémarrage de l'app, sans repasser par le store). À n'appeler que suite
 * à un `updateAvailable`.
 */
export async function applyUpdate(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
  await CapacitorUpdater.reload();
}
