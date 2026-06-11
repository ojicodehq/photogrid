import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

declare const __APP_VERSION__: string;

/** Version embarquée dans le build, injectée par Vite (cf. vite.config.ts). */
export const BUILD_VERSION = __APP_VERSION__;

/**
 * Version réellement active à l'écran.
 *
 * Sur natif, c'est la version du bundle OTA en cours (Capgo) : elle reflète
 * donc une mise à jour live déjà appliquée. C'est ce repère qui passe de
 * 0.1.3 à 0.1.4 après une MAJ OTA, et permet de vérifier qu'elle a marché.
 *
 * Sur le web, ou si aucun bundle OTA n'est actif (on tourne sur le bundle
 * embarqué), on retombe sur la version de build.
 */
export async function getLiveVersion(): Promise<string> {
  if (!Capacitor.isNativePlatform()) return BUILD_VERSION;
  try {
    // Import dynamique : le plugin Capgo ne charge jamais sur le web.
    const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
    const res = await CapacitorUpdater.current();
    const version = res?.bundle?.version;
    return version && version !== "builtin" ? version : BUILD_VERSION;
  } catch {
    return BUILD_VERSION;
  }
}

/**
 * Hook React : renvoie la version de build de façon synchrone (premier
 * render), puis la version live dès qu'elle est résolue (natif uniquement).
 */
export function useLiveVersion(): string {
  const [version, setVersion] = useState(BUILD_VERSION);
  useEffect(() => {
    let active = true;
    void getLiveVersion().then((v) => {
      if (active) setVersion(v);
    });
    return () => {
      active = false;
    };
  }, []);
  return version;
}
