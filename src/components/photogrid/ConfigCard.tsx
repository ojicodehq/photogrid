import { ChevronRight, Grid3x3 } from "lucide-react";

import { LayoutConfigPanel } from "@/components/photogrid/LayoutConfigPanel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { marginsUniform, orientationLabel } from "@/lib/layoutFormat";
import { usePhotoGridStore } from "@/lib/store";
import { fr as t } from "@/lib/strings/fr";
import type { LayoutConfig } from "@/types";

function summarizeLayout(layout: LayoutConfig): string {
  const grid = `${layout.columns} × ${layout.rows}`;
  const marginsLabel = marginsUniform(layout.margins)
    ? `${layout.margins.top} mm`
    : "marges variées";
  return `${grid} · ${layout.pageSize} ${orientationLabel(
    layout.orientation,
  )} · ${marginsLabel}`;
}

/**
 * Carte récapitulative cliquable de la disposition courante.
 * Ouvre une sheet bottom qui contient le LayoutConfigPanel complet.
 * Remplace l'ancien onglet "Disposition" de la bottom-tab-bar.
 */
export function ConfigCard() {
  const layout = usePhotoGridStore((s) => s.layout);
  const summary = summarizeLayout(layout);

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            type="button"
            data-testid="config-card"
            className="bg-card border-border hover:bg-secondary/40 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]"
          >
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <Grid3x3 className="size-[18px]" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-muted-foreground font-display block text-[10px] font-semibold tracking-[0.12em] uppercase">
                {t.config.title}
              </span>
              <span className="font-display text-[14px] font-bold tracking-tight">
                {summary}
              </span>
            </span>
            <ChevronRight className="text-muted-foreground size-5 shrink-0" />
          </button>
        }
      />
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-3xl px-4 pt-6 pb-8"
      >
        <SheetHeader className="px-1">
          <SheetTitle className="font-display text-xl font-bold tracking-tight">
            {t.config.title}
          </SheetTitle>
          <SheetDescription className="text-[13px]">{summary}</SheetDescription>
        </SheetHeader>
        <div className="mt-2">
          <LayoutConfigPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}
