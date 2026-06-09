import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { requestPersistence } from "@/lib/photoStorage";
import { usePhotoGridStore } from "@/lib/store";

/**
 * Coquille applicative de l'app.
 *
 * `ThemeProvider` (next-themes) enveloppe toutes les routes pour
 * partager la préférence de thème. `Toaster` est monté une seule fois
 * ici. L'`Outlet` rend la route active.
 *
 * Au montage : on demande un stockage non-évictable puis on recharge les
 * photos persistées (IndexedDB). Monté une seule fois, c'est le point
 * idéal pour rehydrater la session avant l'affichage des routes.
 */
export function AppShell() {
  useEffect(() => {
    void requestPersistence();
    void usePhotoGridStore.getState().hydratePhotosFromStorage();
  }, []);

  return (
    <ThemeProvider>
      <Outlet />
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
