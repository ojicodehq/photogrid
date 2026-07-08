import {
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  SunMedium,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { OjicodeWordmark } from "@/components/brand/OjicodeWordmark";
import { AppHeader } from "@/components/layout/AppHeader";
import { useLiveVersion } from "@/lib/appVersion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/ui/segmented-control";
import { fr as t } from "@/lib/strings/fr";
import { usePhotoGridStore } from "@/lib/store";
import { useInstallPrompt } from "@/lib/useInstallPrompt";
import { cn } from "@/lib/utils";
import type { ThemePreference } from "@/types";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const THEME_OPTIONS: ReadonlyArray<SegmentedOption<ThemePreference>> = [
  { label: t.settings.theme.light, value: "light" },
  { label: t.settings.theme.dark, value: "dark" },
  { label: t.settings.theme.system, value: "system" },
];

export default function SettingsPage() {
  const { setTheme: setNextTheme } = useTheme();
  const themePref = usePhotoGridStore((s) => s.theme);
  const setStoreTheme = usePhotoGridStore((s) => s.setTheme);
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const { available: canInstall, promptInstall } = useInstallPrompt();
  const version = useLiveVersion();

  const applyTheme = (pref: ThemePreference) => {
    setStoreTheme(pref);
    setNextTheme(pref);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Mobile header */}
      <AppHeader
        className="lg:hidden"
        title={t.settings.title}
        variant="blurred-back"
        back={{ href: "/home" }}
      />

      {/* Desktop top bar */}
      <header className="border-border bg-card hidden h-16 items-center border-b px-4 lg:flex">
        <Link
          to="/home"
          className="text-primary hover:bg-secondary/60 -ml-1 flex items-center gap-1 rounded-full px-3 py-2 text-[14px] font-medium transition"
        >
          <ChevronLeft className="size-4" strokeWidth={2.5} />
          {t.preview.empty.back}
        </Link>
        <div className="flex flex-1 justify-center">
          <span className="font-display text-[15px] font-semibold tracking-tight">
            {t.settings.title}
          </span>
        </div>
        <div className="w-[110px]" />
      </header>

      {/* Mobile main */}
      <main className="flex-1 space-y-3 px-5 py-6 lg:hidden">
        <section className="bg-card border-border rounded-2xl border p-4">
          <Label className="text-muted-foreground font-display text-[10px] font-bold tracking-[0.12em] uppercase">
            {t.settings.sections.appearance}
          </Label>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[15px] font-medium">{t.settings.theme.label}</span>
            {mounted && (
              <SegmentedControl
                ariaLabel={t.settings.theme.label}
                options={THEME_OPTIONS}
                value={themePref}
                onChange={applyTheme}
                itemClassName="px-3 text-xs"
              />
            )}
          </div>
        </section>

        {canInstall ? (
          <section className="bg-card border-border rounded-2xl border p-4">
            <Button
              onClick={() => void promptInstall()}
              variant="secondary"
              className="font-display h-11 w-full rounded-xl text-[15px] font-bold tracking-tight"
            >
              <Download className="size-4" />
              {t.settings.install}
            </Button>
          </section>
        ) : null}

        <section className="bg-card border-border rounded-2xl border p-4">
          <Label className="text-muted-foreground font-display text-[10px] font-bold tracking-[0.12em] uppercase">
            {t.settings.sections.about}
          </Label>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-[15px] font-medium">{t.settings.version(version)}</span>
            <span className="text-muted-foreground text-[13px]">{t.settings.author}</span>
          </div>
        </section>
      </main>

      {/* Desktop master-detail */}
      <div className="hidden flex-1 lg:grid lg:grid-cols-[280px_1fr]">
        <aside className="border-border bg-card flex max-h-[calc(100dvh-4rem)] flex-col overflow-y-auto border-r px-4 py-6">
          <h2 className="font-display px-3 pb-3 text-[20px] font-semibold tracking-tight">
            {t.settings.title}
          </h2>
          <nav className="space-y-0.5">
            <NavItem
              icon={<SunMedium className="size-[18px]" strokeWidth={2} />}
              label={t.settings.sections.appearance}
              active
            />
            <NavItem
              icon={<Info className="size-[18px]" strokeWidth={2} />}
              label={t.settings.sections.about}
              active={false}
              targetId="about-section"
            />
          </nav>
          <div className="border-border/60 mt-auto flex flex-col gap-2 border-t px-3 pt-4">
            <OjicodeWordmark height={18} />
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {t.settings.version(version)} · {t.app.tagline}
            </p>
          </div>
        </aside>

        <main className="max-h-[calc(100dvh-4rem)] overflow-y-auto px-12 py-10">
          <div className="mx-auto max-w-3xl">
            {/* Apparence */}
            <header className="mb-8">
              <h1 className="font-display text-[34px] leading-[1.05] font-bold tracking-[-0.02em]">
                {t.settings.appearance.title}
              </h1>
              <p className="text-muted-foreground mt-1.5 text-[15px]">
                {t.settings.appearance.lede}
              </p>
            </header>

            <section className="bg-card border-border mb-5 rounded-2xl border p-6">
              <h2 className="text-[17px] font-semibold">{t.settings.theme.label}</h2>
              <p className="text-muted-foreground mt-1 text-[13px]">
                Choisissez le mode d&apos;affichage. <em>Système</em> suit les
                préférences de votre appareil.
              </p>

              {mounted && (
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <ThemeChip
                    label={t.settings.theme.light}
                    variant="light"
                    active={themePref === "light"}
                    onClick={() => applyTheme("light")}
                  />
                  <ThemeChip
                    label={t.settings.theme.dark}
                    variant="dark"
                    active={themePref === "dark"}
                    onClick={() => applyTheme("dark")}
                  />
                  <ThemeChip
                    label={t.settings.theme.system}
                    variant="system"
                    active={themePref === "system"}
                    onClick={() => applyTheme("system")}
                  />
                </div>
              )}
            </section>

            {canInstall ? (
              <section className="bg-card border-border mb-5 rounded-2xl border p-6">
                <h2 className="text-[17px] font-semibold">
                  {t.settings.install}
                </h2>
                <p className="text-muted-foreground mt-1 text-[13px]">
                  Installez PhotoGrid sur votre appareil pour un accès rapide et
                  l&apos;usage hors-ligne.
                </p>
                <Button
                  onClick={() => void promptInstall()}
                  variant="secondary"
                  className="font-display mt-4 h-11 rounded-xl px-5 text-[14px] font-semibold tracking-tight"
                >
                  <Download className="size-4" />
                  {t.settings.install}
                </Button>
              </section>
            ) : null}

            {/* À propos */}
            <header id="about-section" className="mt-12 mb-6">
              <h1 className="font-display text-[28px] leading-[1.05] font-bold tracking-[-0.02em]">
                {t.settings.about.title}
              </h1>
              <p className="text-muted-foreground mt-1.5 text-[14px]">
                {t.settings.about.lede}
              </p>
            </header>

            <section className="bg-card border-border rounded-2xl border p-6">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <AboutRow
                  label={t.settings.about.version}
                  value={version}
                />
                <div>
                  <dt className="text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
                    {t.settings.about.designedBy}
                  </dt>
                  <dd className="mt-1">
                    <OjicodeWordmark height={22} />
                  </dd>
                </div>
                <AboutRow
                  label={t.settings.about.privacyLabel}
                  value={t.settings.about.privacy}
                />
              </dl>
              <p className="text-muted-foreground border-border mt-5 border-t pt-4 text-[12px] leading-relaxed">
                {t.settings.about.privacyNote}
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  targetId,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  targetId?: string;
}) {
  const className = cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition",
    active
      ? "bg-accent text-primary font-semibold"
      : "text-foreground hover:bg-secondary",
  );
  const content = (
    <>
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ChevronRight className="text-muted-foreground/60 size-4" />
    </>
  );

  if (targetId) {
    return (
      <button
        type="button"
        className={className}
        onClick={() =>
          document
            .getElementById(targetId)
            ?.scrollIntoView({ behavior: "smooth" })
        }
      >
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
}

function ThemeChip({
  label,
  variant,
  active,
  onClick,
}: {
  label: string;
  variant: "light" | "dark" | "system";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-border bg-card rounded-2xl border p-3 text-left transition",
        active
          ? "border-primary ring-primary/15 ring-[3px]"
          : "hover:border-muted-foreground/40",
      )}
    >
      <div className="border-border/60 relative h-[68px] overflow-hidden rounded-lg border">
        {variant === "light" ? <LightPreview /> : null}
        {variant === "dark" ? <DarkPreview /> : null}
        {variant === "system" ? <SystemPreview /> : null}
      </div>
      <div
        className={cn(
          "mt-2.5 text-[13px] font-medium",
          active ? "text-primary" : "text-foreground",
        )}
      >
        {label}
      </div>
    </button>
  );
}

function LightPreview() {
  return (
    <div className="bg-background relative h-full w-full">
      <span className="bg-foreground/60 absolute top-2 right-2 left-2 h-1.5 rounded-full" />
      <span className="bg-primary absolute bottom-2 left-2 h-1.5 w-7 rounded-full" />
    </div>
  );
}

function DarkPreview() {
  return (
    <div
      className="relative h-full w-full"
      style={{ background: "#1c1a17" }}
    >
      <span
        className="absolute top-2 right-2 left-2 h-1.5 rounded-full"
        style={{ background: "rgba(237,233,224,0.6)" }}
      />
      <span
        className="absolute bottom-2 left-2 h-1.5 w-7 rounded-full"
        style={{ background: "#d88a5c" }}
      />
    </div>
  );
}

function SystemPreview() {
  return (
    <div
      className="relative h-full w-full"
      style={{
        background:
          "linear-gradient(90deg, var(--background) 0%, var(--background) 50%, #1c1a17 50%, #1c1a17 100%)",
      }}
    >
      <span className="bg-primary absolute bottom-2 left-2 h-1.5 w-7 rounded-full" />
    </div>
  );
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-[15px] font-medium">{value}</dd>
    </div>
  );
}
