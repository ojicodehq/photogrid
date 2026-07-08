import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { usePhotoGridStore } from "@/lib/store";
import type { ThemePreference } from "@/types";

/**
 * Point unique de contrôle du thème.
 *
 * Le store Zustand porte la préférence persistée (`'light' | 'dark' | 'system'`),
 * `next-themes` applique la classe `.dark` sur `<html>`. `setTheme` met les deux
 * à jour ensemble : un seul endroit à jour, aucune désynchronisation possible.
 *
 * `mounted` reste `false` au premier render puis passe à `true` après le montage :
 * `next-themes` ne connaît `resolvedTheme` qu'à ce moment, un consommateur qui en
 * dépend (ex. l'icône de `ThemeToggle`) doit attendre pour ne pas afficher une
 * valeur fausse le temps d'une frame.
 */
export function useThemeControl() {
  const { resolvedTheme, setTheme: setNextTheme } = useTheme();
  const preference = usePhotoGridStore((s) => s.theme);
  const setStoreTheme = usePhotoGridStore((s) => s.setTheme);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const setTheme = (pref: ThemePreference) => {
    setStoreTheme(pref);
    setNextTheme(pref);
  };

  return { mounted, preference, resolvedTheme, setTheme };
}
