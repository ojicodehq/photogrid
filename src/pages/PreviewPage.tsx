import { ChevronLeft, Loader2, Pencil, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/layout/AppHeader";
import { PaginationControls } from "@/components/photogrid/PaginationControls";
import { PhotoGrid } from "@/components/photogrid/PhotoGrid";
import { Button, buttonVariants } from "@/components/ui/button";
import { getPaperDimensionsMm } from "@/lib/paperSizes";
import { fr as t } from "@/lib/strings/fr";
import { usePhotoGridStore } from "@/lib/store";
import { usePagination } from "@/lib/usePagination";
import type { LayoutConfig } from "@/types";
import { cn } from "@/lib/utils";

/** 1mm ≈ 3.7795px @ 96 DPI screen : constante CSS standard. */
const PX_PER_MM = 3.7795;
const DESKTOP_BREAKPOINT = 1024;
const DESKTOP_ASIDE_W = 340;

export default function PreviewPage() {
  const photos = usePhotoGridStore((s) => s.photos);
  const layout = usePhotoGridStore((s) => s.layout);
  const markExportSuccess = usePhotoGridStore((s) => s.markExportSuccess);
  const {
    currentPage,
    totalPages,
    photosPerPage,
    canGoPrev,
    canGoNext,
    goToNextPage,
    goToPrevPage,
    goToPage,
    pageInfo,
  } = usePagination();

  const [scale, setScale] = useState(0.3);
  const [printing, setPrinting] = useState(false);

  const paper = getPaperDimensionsMm(layout.pageSize, layout.orientation, {
    width: layout.customWidth,
    height: layout.customHeight,
  });
  // Dimensions de la feuille en pixels CSS (avant mise à l'échelle).
  const paperWpx = paper.width * PX_PER_MM;
  const paperHpx = paper.height * PX_PER_MM;

  useEffect(() => {
    const compute = () => {
      const isLg = window.innerWidth >= DESKTOP_BREAKPOINT;
      // En desktop on retire la sidebar (340) + paddings stage (~80px).
      // En mobile on garde le calcul historique (90% largeur, 62% hauteur).
      const stageW = isLg
        ? window.innerWidth - DESKTOP_ASIDE_W - 80
        : window.innerWidth * 0.9;
      const stageH = isLg
        ? window.innerHeight - 64 - 80
        : window.innerHeight * 0.62;
      setScale(Math.min(stageW / paperWpx, stageH / paperHpx, 1));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [paperWpx, paperHpx]);

  const handlePrint = async () => {
    if (printing) return;
    setPrinting(true);
    try {
      // Import dynamique : la chaîne d'impression (pdf-lib) ne charge
      // qu'au premier clic, pas avec le chunk de la page.
      const { printDocument } = await import("@/lib/printService");
      await printDocument(photos, layout);
      // Export réussi : signal pour une éventuelle relance du prompt d'install.
      markExportSuccess();
    } catch {
      toast.error(t.errors.printFailed);
    } finally {
      setPrinting(false);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col">
        <AppHeader
          title={t.preview.title}
          variant="blurred-back"
          back={{ href: "/home" }}
        />
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-8">
          <div className="bg-secondary/40 mx-auto flex w-full max-w-md flex-col items-center rounded-3xl px-6 py-16 text-center">
            <p className="text-[17px] font-semibold">
              {t.preview.empty.title}
            </p>
            <p className="text-muted-foreground mt-2 max-w-xs text-[15px]">
              {t.preview.empty.subtitle}
            </p>
            <Link
              to="/home"
              className={cn(buttonVariants(), "mt-6 rounded-2xl px-6")}
            >
              {t.preview.empty.back}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Mobile header */}
      <AppHeader
        className="lg:hidden"
        title={t.preview.title}
        subtitle={t.preview.subtitle(photos.length, totalPages)}
        variant="blurred-back"
        back={{ href: "/home" }}
        rightAction={
          <Link
            to="/home"
            className="text-primary hover:bg-secondary/60 inline-flex size-9 items-center justify-center rounded-full"
            aria-label="Modifier"
          >
            <Pencil className="size-5" />
          </Link>
        }
      />

      {/* Desktop top bar */}
      <header className="no-print border-border bg-card hidden h-16 items-center border-b px-4 lg:flex">
        <Link
          to="/home"
          className="text-primary hover:bg-secondary/60 -ml-1 flex items-center gap-1 rounded-full px-3 py-2 text-[14px] font-medium transition"
        >
          <ChevronLeft className="size-4" strokeWidth={2.5} />
          {t.preview.empty.back}
        </Link>
        <div className="flex flex-1 justify-center">
          <span className="font-display text-[15px] font-semibold tracking-tight">
            {t.preview.title}
          </span>
        </div>
        <div className="w-[110px]" />
      </header>

      {/* Mobile main */}
      <main className="no-print flex flex-1 flex-col items-center justify-center px-4 py-6 lg:hidden">
        <div
          className="overflow-hidden"
          style={{ width: paperWpx * scale, height: paperHpx * scale }}
        >
          <div
            style={{
              width: paperWpx,
              height: paperHpx,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <PhotoGrid
              photos={photos}
              layout={layout}
              pageIndex={currentPage}
              allPages={false}
            />
          </div>
        </div>

        {totalPages > 1 ? (
          <PaginationControls
            current={pageInfo.current}
            total={pageInfo.total}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onPrev={goToPrevPage}
            onNext={goToNextPage}
          />
        ) : null}
      </main>

      {/* Desktop master-detail */}
      <div className="no-print bg-secondary hidden flex-1 lg:grid lg:grid-cols-[340px_1fr]">
        <aside className="border-border bg-card flex max-h-[calc(100dvh-4rem)] flex-col overflow-y-auto border-r">
          {/* Summary */}
          <section className="border-border/60 border-b px-6 py-6">
            <SectionLabel>{t.config.title}</SectionLabel>
            <dl className="mt-3 space-y-2.5 text-[14px]">
              <SummaryRow label={t.config.sections.grid} value={`${layout.columns} × ${layout.rows}`} />
              <SummaryRow
                label={t.config.pageSize}
                value={`${layout.pageSize} ${
                  layout.orientation === "portrait"
                    ? t.config.orientation.portrait.toLowerCase()
                    : t.config.orientation.landscape.toLowerCase()
                }`}
              />
              <SummaryRow
                label={t.config.spacing}
                value={`${layout.spacing} ${t.config.spacingUnit}`}
              />
              <SummaryRow
                label={t.config.sections.margins}
                value={marginsSummary(layout)}
              />
              <SummaryRow
                label={t.config.fitMode.label}
                value={fitModeLabel(layout.fitMode)}
              />
            </dl>
          </section>

          {/* Pages list */}
          <section className="border-border/60 flex-1 border-b px-6 py-6">
            <SectionLabel>
              {t.preview.title} · {t.preview.pagesLabel(totalPages)}
            </SectionLabel>
            <ul className="mt-3 space-y-2.5">
              {Array.from({ length: totalPages }).map((_, i) => {
                const isActive = i === currentPage;
                const start = i * photosPerPage;
                const end = Math.min(start + photosPerPage, photos.length);
                const filled = end - start;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => goToPage(i)}
                      className={cn(
                        "flex w-full items-center gap-3.5 rounded-xl border p-2.5 text-left transition",
                        isActive
                          ? "bg-accent border-primary"
                          : "border-transparent hover:bg-secondary",
                      )}
                    >
                      <PageThumb
                        layout={layout}
                        filled={filled}
                        total={photosPerPage}
                      />
                      <div className="min-w-0 flex-1 text-[13px]">
                        <div
                          className={cn(
                            "font-semibold",
                            isActive ? "text-primary" : "text-foreground",
                          )}
                        >
                          Page {i + 1}
                        </div>
                        <div className="text-muted-foreground text-[12px]">
                          {t.preview.pageSlots(filled, photosPerPage)}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Footer */}
          <div className="bg-background sticky bottom-0 mt-auto flex flex-col gap-2.5 border-t px-6 py-5">
            <Button
              size="lg"
              aria-label={t.preview.print}
              aria-busy={printing}
              disabled={printing}
              onClick={handlePrint}
              className="shadow-primary/30 font-display h-12 w-full justify-center rounded-2xl text-[15px] font-bold tracking-tight shadow-md"
            >
              {printing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Printer className="size-4" />
              )}
              {printing ? t.preview.printing : t.preview.print}
            </Button>
          </div>
        </aside>

        <main className="flex max-h-[calc(100dvh-4rem)] flex-col items-center overflow-y-auto px-10 py-10">
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <div
              className="overflow-hidden"
              style={{ width: paperWpx * scale, height: paperHpx * scale }}
            >
              <div
                style={{
                  width: paperWpx,
                  height: paperHpx,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <PhotoGrid
                  photos={photos}
                  layout={layout}
                  pageIndex={currentPage}
                  allPages={false}
                />
              </div>
            </div>
          </div>

          {totalPages > 1 ? (
            <PaginationControls
              current={pageInfo.current}
              total={pageInfo.total}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              onPrev={goToPrevPage}
              onNext={goToNextPage}
            />
          ) : null}

          <p className="text-muted-foreground mt-6 text-center text-[12px]">
            Aperçu à l&apos;échelle · le rendu imprimé respectera exactement les
            dimensions en millimètres
          </p>
        </main>
      </div>

      {/* Mobile FAB */}
      <div className="no-print fixed right-5 bottom-6 z-10 lg:hidden">
        <Button
          size="lg"
          aria-label={t.preview.print}
          aria-busy={printing}
          disabled={printing}
          className="shadow-primary/30 font-display h-14 rounded-full px-7 text-[15px] font-bold tracking-tight shadow-lg"
          onClick={handlePrint}
        >
          {printing ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Printer className="size-5" />
          )}
          <span>{printing ? t.preview.printing : t.preview.print}</span>
        </Button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground font-display text-[10px] font-bold tracking-[0.12em] uppercase">
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function PageThumb({
  layout,
  filled,
  total,
}: {
  layout: LayoutConfig;
  filled: number;
  total: number;
}) {
  const aspect = layout.orientation === "portrait" ? 48 / 64 : 64 / 48;
  return (
    <div
      className="bg-background border-border/60 shrink-0 rounded-sm border shadow-sm"
      style={{ width: 48, aspectRatio: aspect, padding: 3 }}
    >
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
          gap: 1,
        }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-[0.5px]",
              i < filled ? "bg-primary/85" : "border-border/60 border border-dashed",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function marginsSummary(layout: LayoutConfig): string {
  const m = layout.margins;
  const allEqual =
    m.top === m.right && m.right === m.bottom && m.bottom === m.left;
  return allEqual ? `${m.top} mm` : "variées";
}

function fitModeLabel(mode: LayoutConfig["fitMode"]): string {
  switch (mode) {
    case "contain":
      return t.config.fitMode.contain;
    case "cover":
      return t.config.fitMode.cover;
    case "fill":
      return t.config.fitMode.fill;
  }
}
