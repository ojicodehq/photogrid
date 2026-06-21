import { Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";

import { InstallPromptSheet } from "@/components/install/InstallPromptSheet";
import { RouteFallback } from "@/components/layout/RouteFallback";
import { UpdateBanner } from "@/components/layout/UpdateBanner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { notifyAppReady } from "@/lib/liveUpdate";
import { requestPersistence } from "@/lib/photoStorage";
import { cleanupPrintArtifacts } from "@/lib/printCleanup";
import { usePhotoGridStore } from "@/lib/store";

/**
 * Coquille applicative de l'app.
 *
 * `ThemeProvider` (next-themes) enveloppe toutes les routes pour
 * partager la préférence de thème. `Toaster` est monté une seule fois
 * ici. L'`Outlet` rend la route active, derrière un `Suspense` partagé
 * pour les pages chargées en lazy (cf. `AppRouter`).
 *
 * Au montage : on demande un stockage non-évictable puis on recharge les
 * photos persistées (IndexedDB). Monté une seule fois, c'est le point
 * idéal pour rehydrater la session avant l'affichage des routes.
 */
export function AppShell() {
  useEffect(() => {
    // Confirme au plugin OTA que le bundle a démarré (sinon rollback auto).
    void notifyAppReady();
    // Purge un éventuel PDF d'impression resté en cache (natif uniquement).
    void cleanupPrintArtifacts();
    void requestPersistence();
    void usePhotoGridStore.getState().hydratePhotosFromStorage();
  }, []);

  return (
    <ThemeProvider>
      <UpdateBanner />
      <InstallPromptSheet />
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
