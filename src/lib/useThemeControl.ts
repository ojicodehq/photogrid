import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { usePhotoGridStore } from "@/lib/store";
import type { ThemePreference } from "@/types";

// `mounted` : détecte le premier render client. `next-themes` ne connaît le
// thème résolu qu'après le montage ; avant, l'UI thème doit rester neutre pour
// éviter un flash / une valeur fausse. Snapshot serveur `false`, client `true`.
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Point unique de contrôle du thème.
 *
 * Le store Zustand porte la préférence persistée (`'light' | 'dark' | 'system'`),
 * `next-themes` applique la classe `.dark` sur `<html>`. `setTheme` met les deux
 * à jour ensemble : un seul endroit à jour, aucune désynchronisation possible.
 */
export function useThemeControl() {
  const { resolvedTheme, setTheme: setNextTheme } = useTheme();
  const preference = usePhotoGridStore((s) => s.theme);
  const setStoreTheme = usePhotoGridStore((s) => s.setTheme);
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const setTheme = (pref: ThemePreference) => {
    setStoreTheme(pref);
    setNextTheme(pref);
  };

  return { mounted, preference, resolvedTheme, setTheme };
}
