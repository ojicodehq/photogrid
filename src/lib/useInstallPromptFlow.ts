import { useEffect, useRef, useState } from "react";

import { isAppMode } from "@/lib/platform";
import { useInstallPrompt } from "@/lib/useInstallPrompt";
import { useIosStandalone } from "@/lib/useIosStandalone";
import {
  MAX_DISMISSALS,
  readDismissCount,
  recordDismiss,
} from "@/lib/installPromptStorage";
import { usePhotoGridStore } from "@/lib/store";

/** Quelle UI afficher, ou `null` si le prompt n'est pas pertinent ici. */
export type InstallVariant = "android" | "ios";

/**
 * Délai de grâce après le montage : neutralise la transition 0→N créée par
 * l'hydratation des photos depuis IndexedDB (`hydratePhotosFromStorage`),
 * qui n'est PAS un import utilisateur et ne doit pas déclencher le prompt.
 */
const HYDRATION_GRACE_MS = 1000;

type InstallFlow = {
  open: boolean;
  variant: InstallVariant | null;
  /** Lance l'install natif (Android). N'incrémente jamais le compteur de refus. */
  onInstall: () => void;
  /** Fermeture pilotée par le Sheet (backdrop, Escape, croix, « Plus tard »). */
  onOpenChange: (next: boolean) => void;
};

/**
 * Machine à états du prompt d'installation PWA.
 *
 * Deux déclencheurs, tous deux bornés par `canPrompt()` :
 *  1. premier import de photos (transition 0 → >0, hors fenêtre d'hydratation) ;
 *  2. export PDF réussi, uniquement si l'utilisateur a déjà refusé une fois.
 *
 * Après {@link MAX_DISMISSALS} fermetures, plus aucun affichage automatique :
 * le bouton « Installer » des Réglages reste la seule porte d'entrée.
 */
export function useInstallPromptFlow(): InstallFlow {
  const [open, setOpen] = useState(false);

  const { available, installed, promptInstall } = useInstallPrompt();
  const { isIosSafari, isStandalone } = useIosStandalone();

  const totalPhotos = usePhotoGridStore((s) => s.layout.totalPhotos);
  const lastExportAt = usePhotoGridStore((s) => s.lastExportAt);

  const dismissCountRef = useRef<number>(readDismissCount());
  const prevTotalRef = useRef<number>(totalPhotos);
  const lastSeenExportRef = useRef<number | null>(lastExportAt);
  const mountedAtRef = useRef<number>(Date.now());
  // Garde : une fermeture pilotée par l'install natif ne doit jamais compter
  // comme un refus. base-ui n'appelle pas `onOpenChange` sur changement
  // programmatique de `open`, mais ce flag rend la garantie indépendante de
  // ce détail d'implémentation.
  const closingByInstallRef = useRef(false);

  // Variante affichable : Android (event capté) prioritaire, sinon iOS Safari.
  const variant: InstallVariant | null = installed
    ? null
    : available
      ? "android"
      : isIosSafari && !isStandalone
        ? "ios"
        : null;

  const canPrompt = (): boolean =>
    !isAppMode() &&
    !installed &&
    variant !== null &&
    dismissCountRef.current < MAX_DISMISSALS;

  // Trigger 1 — premier import (0 → >0), hors fenêtre d'hydratation.
  useEffect(() => {
    const prev = prevTotalRef.current;
    prevTotalRef.current = totalPhotos;

    if (Date.now() - mountedAtRef.current < HYDRATION_GRACE_MS) return;
    if (prev === 0 && totalPhotos > 0 && canPrompt()) setOpen(true);
    // canPrompt lit des refs + valeurs dérivées stables, pas besoin de l'isoler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPhotos]);

  // Trigger 2 — export réussi, seulement si déjà refusé une fois.
  useEffect(() => {
    if (lastExportAt === null) return;
    if (lastExportAt === lastSeenExportRef.current) return;
    lastSeenExportRef.current = lastExportAt;

    if (dismissCountRef.current >= 1 && canPrompt()) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastExportAt]);

  const onInstall = () => {
    closingByInstallRef.current = true;
    void promptInstall().finally(() => setOpen(false));
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) return;
    if (closingByInstallRef.current) {
      // Fermeture déclenchée par l'install natif : pas un refus.
      closingByInstallRef.current = false;
      return;
    }
    // Toute autre fermeture (backdrop, Escape, « Plus tard ») = un refus.
    dismissCountRef.current = recordDismiss();
  };

  return { open, variant, onInstall, onOpenChange };
}
