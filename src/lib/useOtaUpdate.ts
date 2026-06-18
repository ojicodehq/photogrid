import { useCallback, useEffect, useState } from "react";

import { applyUpdate, onUpdateAvailable } from "@/lib/liveUpdate";

/**
 * État d'une mise à jour OTA pour l'UI.
 *
 * `readyVersion` est non-nul dès qu'un bundle est en attente (événement
 * `updateAvailable`) : on affiche alors le bandeau. `apply` recharge l'app
 * sur ce bundle ; `reload()` détruisant le contexte JS, l'appel ne « rend »
 * jamais en cas de succès (d'où l'absence de reset de `applying`).
 *
 * Sur le web, `onUpdateAvailable` est un no-op : `readyVersion` reste nul,
 * le bandeau ne s'affiche jamais.
 */
export function useOtaUpdate() {
  const [readyVersion, setReadyVersion] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void onUpdateAvailable((version) => {
      if (active) setReadyVersion(version);
    }).then((unsub) => {
      if (active) unsubscribe = unsub;
      else unsub(); // démonté avant la résolution : on se désabonne aussitôt
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const apply = useCallback(async () => {
    setApplying(true);
    try {
      await applyUpdate();
    } catch {
      // L'échec n'a pas rechargé : on réautorise le bouton.
      setApplying(false);
    }
  }, []);

  const dismiss = useCallback(() => setReadyVersion(null), []);

  return { readyVersion, applying, apply, dismiss };
}
