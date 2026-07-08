import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fr as t } from "@/lib/strings/fr";

type Props = {
  current: number; // 1-indexed
  total: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

/**
 * Contrôles de pagination. Boutons ronds accent, indicateur "Page X / Y"
 * au centre, accessibles au clavier.
 */
export function PaginationControls({
  current,
  total,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: Props) {
  return (
    <div
      className="mt-4 flex items-center justify-center gap-3"
      aria-label={t.preview.pageOf(current, total)}
    >
      <Button
        size="icon-lg"
        variant="secondary"
        onClick={onPrev}
        disabled={!canGoPrev}
        aria-label="Page précédente"
        className="rounded-full"
      >
        <ChevronLeft className="size-5" />
      </Button>
      <span className="text-foreground min-w-[100px] text-center text-[15px] font-medium tabular-nums">
        {t.preview.pageOf(current, total)}
      </span>
      <Button
        size="icon-lg"
        variant="secondary"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Page suivante"
        className="rounded-full"
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
