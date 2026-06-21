import { isAppMode } from "@/lib/platform";

type IosState = {
  /** iOS + vrai Safari (seul à offrir « Sur l'écran d'accueil »). */
  isIosSafari: boolean;
  /** Déjà lancé en mode app (standalone / natif). */
  isStandalone: boolean;
};

const FALLBACK: IosState = { isIosSafari: false, isStandalone: false };

/**
 * Détecte iOS Safari (hors mode standalone) pour afficher des instructions
 * d'installation manuelles : Safari iOS n'émet jamais `beforeinstallprompt`,
 * il faut donc guider le geste « Partager → Sur l'écran d'accueil ».
 *
 * Évalué une fois (pas de réactivité utile : l'UA ne change pas). Les
 * navigateurs tiers iOS (Chrome/Firefox/Edge/Opera) sont exclus : ils
 * partagent WebKit mais n'exposent pas le même geste fiable.
 */
export function useIosStandalone(): IosState {
  if (typeof navigator === "undefined") return FALLBACK;

  const ua = navigator.userAgent;
  const isIphoneIpod = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ se présente comme un Mac : on le rattrape via le tactile.
  const isIpadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isIosDevice = isIphoneIpod || isIpadOs;

  // Exclut les navigateurs in-app iOS qui ne proposent pas le geste.
  const isRealSafari = !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/.test(ua);

  return {
    isIosSafari: isIosDevice && isRealSafari,
    isStandalone: isAppMode(),
  };
}
