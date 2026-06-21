import { Capacitor } from "@capacitor/core";

/** Instance Umami self-hostée (analytics privacy-friendly, sans cookies). */
const UMAMI_SRC = "https://umami.ojicode.fr/script.js";
const UMAMI_WEBSITE_ID = "a861d65b-62db-43b3-a7dc-313cac7b46cf";
/** Le traceur n'émet que sur ce domaine (cf. `data-domains`). */
const UMAMI_DOMAINS = "photogrid.ojicode.fr";

/**
 * Charge le traceur Umami — **uniquement sur le web public en production**.
 *
 * Volontairement absent de l'app native (Capacitor) : l'APK reste 100 %
 * hors-ligne, sans aucune requête réseau au lancement, conformément à la
 * promesse produit. Le garde `import.meta.env.PROD` évite de polluer les
 * stats depuis le dev local ; `data-domains` borne en plus l'émission au
 * domaine de prod (défense en profondeur).
 *
 * Umami ne reçoit que des données de navigation anonymes (page vue, referrer,
 * pays, navigateur) : aucune photo, aucun contenu utilisateur ne transite —
 * les images ne quittent jamais l'appareil.
 */
export function initAnalytics(): void {
  if (Capacitor.isNativePlatform()) return;
  if (!import.meta.env.PROD) return;
  if (typeof document === "undefined") return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = UMAMI_SRC;
  script.dataset.websiteId = UMAMI_WEBSITE_ID;
  script.dataset.domains = UMAMI_DOMAINS;
  document.head.appendChild(script);
}
