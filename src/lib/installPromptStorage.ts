/**
 * Persistance du compteur de refus du prompt d'installation PWA.
 *
 * Clé dédiée, distincte du persist Zustand (`photogrid-storage`) : ce flag
 * n'a pas besoin de réactivité et ne doit pas transiter par le store. Tous
 * les accès sont protégés (SSR + mode privé / quota) ; en cas d'échec on
 * retombe sur « jamais refusé », jamais sur une exception.
 */

const DISMISS_KEY = "photogrid-install-prompt";

/** Au-delà de ce nombre de refus, le prompt ne s'affiche plus automatiquement. */
export const MAX_DISMISSALS = 2;

type DismissState = {
  dismissCount: number;
  lastDismissedAt: number;
};

/** Lit le nombre de refus enregistrés. Retombe sur 0 si absent/corrompu. */
export function readDismissCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Partial<DismissState>;
    return typeof parsed.dismissCount === "number" ? parsed.dismissCount : 0;
  } catch {
    return 0;
  }
}

/** Incrémente le compteur de refus et renvoie la nouvelle valeur. */
export function recordDismiss(): number {
  const next = readDismissCount() + 1;
  if (typeof window === "undefined") return next;
  try {
    const state: DismissState = {
      dismissCount: next,
      lastDismissedAt: Date.now(),
    };
    window.localStorage.setItem(DISMISS_KEY, JSON.stringify(state));
  } catch {
    // Quota / mode privé : sans persistance le prompt pourra réapparaître,
    // ce n'est pas bloquant.
  }
  return next;
}
