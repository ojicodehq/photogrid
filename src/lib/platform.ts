import { Capacitor } from "@capacitor/core";

/**
 * Vrai quand l'app tourne en mode « installé » : application native
 * (Capacitor / Android) ou PWA lancée en display-mode standalone.
 *
 * Dans ce cas, la landing marketing (route `/`) n'a pas lieu d'être :
 * l'utilisateur a déjà choisi PhotoGrid et veut l'outil directement.
 * Les visiteurs web normaux, eux, voient bien la landing (utile au SEO).
 */
export function isAppMode(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  if (typeof window === "undefined") return false;
  return Boolean(
    window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone,
  );
}
