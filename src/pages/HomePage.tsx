import { Settings2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { AppHeader } from "@/components/layout/AppHeader";
import { ConfigCard } from "@/components/photogrid/ConfigCard";
import { LayoutConfigPanel } from "@/components/photogrid/LayoutConfigPanel";
import { PhotoSelector } from "@/components/photogrid/PhotoSelector";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fr as t } from "@/lib/strings/fr";
import { useDeepLinkLayout } from "@/lib/useDeepLinkLayout";
import { usePagination } from "@/lib/usePagination";
import { usePhotoGridStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function HomePage() {
  // Applique une éventuelle config passée en deep link (page de contenu →
  // app pré-réglée) avant toute interaction.
  useDeepLinkLayout();

  const photos = usePhotoGridStore((s) => s.photos);
  const clearPhotos = usePhotoGridStore((s) => s.clearPhotos);
  const { photosPerPage } = usePagination();
  const photoCount = photos.length;
  const hasPhotos = photoCount > 0;
  const emptySlots = Math.max(0, photosPerPage - (photoCount % photosPerPage || photosPerPage));

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Mobile header */}
      <AppHeader
        className="lg:hidden"
        title={t.home.title}
        subtitle={t.home.counter(photoCount)}
        rightAction={
          <Link
            to="/settings"
            className="text-primary hover:bg-secondary/60 inline-flex size-9 items-center justify-center rounded-full"
            aria-label={t.settings.title}
          >
            <Settings2 className="size-5" />
          </Link>
        }
      />

      {/* Desktop top bar */}
      <header className="border-border bg-card hidden h-16 items-center border-b px-6 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary text-primary-foreground font-display flex size-9 items-center justify-center rounded-xl text-sm font-bold tracking-tight">
            PG
          </div>
          <div className="font-display text-[13px] font-semibold tracking-wider uppercase">
            {t.app.name}
            <span className="text-muted-foreground ml-2 text-[12px] font-normal tracking-normal normal-case">
              {t.app.by}
            </span>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            className="text-muted-foreground hover:text-foreground hover:bg-secondary inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition"
            aria-label={t.settings.title}
          >
            <Settings2 className="size-4" />
            {t.settings.title}
          </Link>
          {hasPhotos ? (
            <Link
              to="/preview"
              className={cn(
                buttonVariants(),
                "shadow-primary/25 h-10 rounded-full px-5 text-[14px] font-semibold shadow-md",
              )}
            >
              {t.home.actions.preview}
              <span aria-hidden>→</span>
            </Link>
          ) : null}
        </div>
      </header>

      {/* Mobile main */}
      <main className="flex-1 space-y-4 px-5 pb-28 lg:hidden">
        <ConfigCard />
        <PhotoSelector />
        {hasPhotos ? <ClearDialog onConfirm={() => clearPhotos()} /> : null}
      </main>

      {/* Desktop master-detail */}
      <div className="hidden lg:grid lg:grid-cols-[380px_1fr] lg:flex-1">
        <aside className="border-border bg-card flex max-h-[calc(100dvh-4rem)] flex-col overflow-y-auto border-r">
          <div className="px-5 py-6">
            <LayoutConfigPanel />
          </div>
          {hasPhotos ? (
            <div className="border-border/60 bg-card sticky bottom-0 border-t px-5 py-4">
              <Link
                to="/preview"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "shadow-primary/20 h-12 w-full justify-center rounded-2xl text-[15px] font-semibold shadow-md",
                )}
              >
                {t.home.actions.printPreview}
                <span aria-hidden>→</span>
              </Link>
            </div>
          ) : null}
        </aside>

        <main className="max-h-[calc(100dvh-4rem)] overflow-y-auto px-10 py-8">
          <div className="mb-7 flex items-end justify-between gap-6">
            <div className="min-w-0">
              <h1 className="font-display text-[32px] leading-[1.05] font-bold tracking-[-0.02em]">
                {t.home.title}
              </h1>
              <p className="text-muted-foreground mt-1.5 text-[14px]">
                {t.home.counter(photoCount)}
                {hasPhotos ? ` · ${t.home.emptySlots(emptySlots)}` : null}
              </p>
            </div>
            {hasPhotos ? (
              <ClearDialog
                onConfirm={() => clearPhotos()}
                trigger={
                  <Button
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 h-10 rounded-full px-4 text-[14px] font-medium"
                  >
                    <Trash2 className="size-4" />
                    {t.home.actions.clear}
                  </Button>
                }
              />
            ) : null}
          </div>

          <PhotoSelector />
        </main>
      </div>

      {/* Mobile FAB */}
      {hasPhotos ? (
        <div className="no-print fixed right-5 bottom-8 z-10 lg:hidden">
          <Link
            to="/preview"
            className={cn(
              buttonVariants({ size: "lg" }),
              "shadow-primary/30 h-14 rounded-full px-6 text-[15px] font-semibold shadow-lg",
            )}
          >
            {t.home.actions.preview}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ClearDialog({
  onConfirm,
  trigger,
}: {
  onConfirm: () => void;
  trigger?: React.ReactElement;
}) {
  const photos = usePhotoGridStore((s) => s.photos);
  const defaultTrigger = (
    <Button
      variant="ghost"
      className="text-destructive h-10 w-full rounded-2xl text-[14px] font-medium"
    >
      <Trash2 className="size-4" />
      {t.home.actions.clear}
    </Button>
  );
  return (
    <Dialog>
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.home.actions.clearConfirm}</DialogTitle>
          <DialogDescription>
            {t.home.counter(photos.length)} sera supprimée.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button variant="secondary">{t.preview.cancel}</Button>}
          />
          <DialogClose
            render={
              <Button variant="destructive" onClick={onConfirm}>
                {t.home.actions.clear}
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
