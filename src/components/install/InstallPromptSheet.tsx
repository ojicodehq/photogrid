import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { fr as t } from "@/lib/strings/fr";
import { useInstallPromptFlow } from "@/lib/useInstallPromptFlow";

/**
 * Prompt d'installation PWA (bottom sheet), monté une fois dans `AppShell`.
 *
 * Deux variantes pilotées par `useInstallPromptFlow` :
 *  - `android` : bouton d'install natif (`beforeinstallprompt`) ;
 *  - `ios` : instructions manuelles « Partager → Sur l'écran d'accueil »
 *    (Safari iOS n'expose aucun prompt programmatique).
 */
export function InstallPromptSheet() {
  const { open, variant, onInstall, onOpenChange } = useInstallPromptFlow();

  if (variant === null) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-3xl px-4 pt-3 pb-8 sm:mx-auto sm:max-w-md"
      >
        {/* Grip : affordance de fermeture par glissement (convention mobile). */}
        <div
          aria-hidden="true"
          className="bg-border mx-auto mb-3 h-1 w-10 shrink-0 rounded-full"
        />
        {variant === "android" ? (
          <AndroidPrompt onInstall={onInstall} />
        ) : (
          <IosPrompt />
        )}
      </SheetContent>
    </Sheet>
  );
}

function AndroidPrompt({ onInstall }: { onInstall: () => void }) {
  const s = t.installPrompt.android;
  return (
    <div className="flex flex-col items-center px-1 text-center">
      <span
        aria-hidden="true"
        className="bg-primary text-primary-foreground mb-4 flex size-14 items-center justify-center rounded-2xl"
      >
        <Download className="size-7" strokeWidth={2} />
      </span>
      <SheetTitle className="font-display text-foreground text-xl leading-tight font-bold tracking-tight">
        {s.titleLead}{" "}
        <span className="font-accent text-primary font-medium italic">
          {s.titleAccent}
        </span>
      </SheetTitle>
      <SheetDescription className="text-muted-foreground mx-auto mt-2 max-w-[16rem] text-[13px] leading-relaxed">
        {s.body}
      </SheetDescription>
      <div className="mt-6 flex w-full flex-col gap-2.5">
        <Button
          onClick={onInstall}
          className="font-display h-12 w-full rounded-xl text-[15px] font-bold tracking-tight"
        >
          <Download className="size-4" aria-hidden="true" />
          {s.install}
        </Button>
        <SheetClose
          render={
            <Button
              variant="ghost"
              className="text-muted-foreground h-11 w-full rounded-xl text-[14px] font-semibold"
            />
          }
        >
          {s.later}
        </SheetClose>
      </div>
    </div>
  );
}

function IosPrompt() {
  const s = t.installPrompt.ios;
  const steps = [s.steps.share, s.steps.addToHome, s.steps.confirm];

  return (
    <div className="flex flex-col px-1">
      <SheetTitle className="font-display text-foreground text-center text-lg leading-tight font-bold tracking-tight">
        {s.title}
      </SheetTitle>
      <SheetDescription className="text-muted-foreground mx-auto mt-1.5 max-w-[18rem] text-center text-[13px] leading-relaxed">
        {s.body}
      </SheetDescription>
      <ol className="mt-5 flex list-none flex-col gap-3">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="bg-primary/10 text-primary font-display flex size-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold"
            >
              {i + 1}
            </span>
            <span className="min-w-0 text-[14px] leading-snug">
              <span className="text-foreground font-semibold">
                {step.action}
              </span>
              {step.hint ? (
                <span className="text-muted-foreground"> {step.hint}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
      <SheetClose
        render={
          <Button
            variant="ghost"
            className="text-muted-foreground mt-6 h-11 w-full rounded-xl text-[14px] font-semibold"
          />
        }
      >
        {s.later}
      </SheetClose>
    </div>
  );
}
