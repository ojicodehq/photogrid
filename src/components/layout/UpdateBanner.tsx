import { RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fr as t } from "@/lib/strings/fr";
import { useOtaUpdate } from "@/lib/useOtaUpdate";

/**
 * Bandeau de mise à jour OTA.
 *
 * S'affiche en haut de l'app quand un bundle live-update est en attente
 * (cf. `useOtaUpdate`). Le bouton « Redémarrer » applique le bundle
 * immédiatement ; sinon il s'appliquera au prochain lancement naturel, donc
 * le bandeau est masquable. Ne rend rien sur le web ni sans mise à jour.
 */
export function UpdateBanner() {
  const { readyVersion, applying, apply, dismiss } = useOtaUpdate();

  if (!readyVersion) return null;

  return (
    <div
      role="status"
      className="border-border bg-card/95 fixed inset-x-0 top-0 z-[60] flex items-center gap-3 border-b px-4 py-2.5 backdrop-blur-sm"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.625rem)" }}
    >
      <RefreshCw className="text-primary size-4 shrink-0" strokeWidth={2.5} />
      <p className="min-w-0 flex-1 text-[13px] leading-tight">
        <span className="font-semibold">{t.update.available}</span>
        <span className="text-muted-foreground"> · {t.update.version(readyVersion)}</span>
      </p>
      <Button
        size="sm"
        onClick={apply}
        disabled={applying}
        aria-busy={applying}
        className="rounded-full px-3.5 font-semibold"
      >
        {applying ? (
          <RefreshCw className="size-3.5 animate-spin" />
        ) : null}
        {t.update.restart}
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t.update.dismiss}
        className="text-muted-foreground hover:bg-secondary -mr-1 flex size-7 shrink-0 items-center justify-center rounded-full transition"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
