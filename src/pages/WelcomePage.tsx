import { Grid3x3, Layers, Printer } from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import {
  HeroGrid,
  HERO_CELLS_DESKTOP,
  HERO_CELLS_MOBILE,
} from "@/components/welcome/HeroGrid";
import { LandingContent } from "@/components/landing/LandingContent";
import { LandingNav } from "@/components/landing/LandingNav";
import { isAppMode } from "@/lib/platform";
import { fr as t } from "@/lib/strings/fr";

export default function WelcomePage() {
  // App installée (PWA standalone ou Capacitor) : on saute la landing
  // marketing et on va droit à l'outil.
  if (isAppMode()) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      {/* Hero : occupe le premier écran sous la barre de navigation */}
      <main className="flex flex-col">
        {/* ---- Mobile : titre par-dessus la grille en haut à droite ----
            min-h = premier écran sous la barre (4rem) : le CTA (mt-auto) se
            cale en bas, le contenu suivant reste sous la ligne de flottaison. */}
        <div className="flex min-h-[calc(100dvh-4rem)] flex-col px-7 pt-7 pb-8 lg:hidden">
          <div className="relative">
            <HeroGrid
              cells={HERO_CELLS_MOBILE}
              columns={4}
              className="absolute -top-1 right-0 z-0 w-[56%] max-w-[216px]"
            />
            {/* Voile : garde le titre lisible là où il croise la grille */}
            <div className="from-background via-background/70 pointer-events-none absolute inset-0 z-[5] bg-gradient-to-r to-transparent to-90%" />

            <div className="relative z-10 pt-[56px]">
              <Eyebrow />
              {/* Halo couleur-fond : le titre reste lisible même posé sur une
                  photo claire (theme-aware via --background). */}
              <h1
                className="font-display mt-4 text-[42px] leading-[0.98] font-extrabold tracking-[-0.02em]"
                style={{
                  textShadow:
                    "0 0 10px var(--background), 0 0 10px var(--background), 0 1px 2px var(--background)",
                }}
              >
                {t.welcome.titleMain}
                <span className="font-accent text-primary mt-1.5 block text-[39px] font-medium italic tracking-[-0.01em]">
                  {t.welcome.titleAccent}
                </span>
              </h1>
            </div>
          </div>

          <p className="text-muted-foreground mt-6 max-w-[300px] text-[15px] leading-relaxed">
            {t.welcome.subtitle}
          </p>

          <ul className="mt-7 flex flex-col gap-3.5">
            <DotItem
              label={t.welcome.bullets.grid.label}
              hint={t.welcome.bullets.grid.hint}
            />
            <DotItem
              label={t.welcome.bullets.formats.label}
              hint={t.welcome.bullets.formats.hint}
            />
            <DotItem
              label={t.welcome.bullets.quality.label}
              hint={t.welcome.bullets.quality.hint}
            />
          </ul>

          <Link
            to="/home"
            data-testid="welcome-cta"
            className={buttonVariants({
              size: "lg",
              className:
                "shadow-primary/25 font-display mt-auto h-14 w-full justify-between rounded-2xl text-[17px] font-bold tracking-tight shadow-lg",
            })}
          >
            <span>{t.welcome.cta}</span>
            <span aria-hidden>→</span>
          </Link>
        </div>

        {/* ---- Desktop : hero split (texte à gauche, grille à droite) ---- */}
        <section className="mx-auto hidden min-h-[calc(100dvh-4rem)] w-full max-w-[1280px] grid-cols-2 items-center gap-[60px] px-20 lg:grid">
          <div className="max-w-[540px]">
            <Eyebrow />

            <h1 className="font-display mt-6 text-[72px] leading-[0.98] font-extrabold tracking-[-0.035em]">
              {t.welcome.titleMain}
              <span className="font-accent text-primary mt-2 block text-[66px] font-medium italic tracking-[-0.02em]">
                {t.welcome.titleAccent}
              </span>
            </h1>

            <p className="text-muted-foreground mt-7 max-w-[460px] text-[18px] leading-[1.55]">
              {t.welcome.subtitle}
            </p>

            <div className="mt-10">
              <Link
                to="/home"
                data-testid="welcome-cta-desktop"
                className={buttonVariants({
                  size: "lg",
                  className:
                    "shadow-primary/25 font-display inline-flex h-12 items-center gap-2.5 rounded-full px-7 text-[15px] font-semibold tracking-tight shadow-lg",
                })}
              >
                <span>{t.welcome.cta}</span>
                <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-7">
              <Bullet
                icon={<Grid3x3 className="size-[18px]" strokeWidth={2} />}
                label={t.welcome.bullets.grid.label}
                hint={t.welcome.bullets.grid.hint}
              />
              <Bullet
                icon={<Layers className="size-[18px]" strokeWidth={2} />}
                label={t.welcome.bullets.formats.label}
                hint={t.welcome.bullets.formats.hint}
              />
              <Bullet
                icon={<Printer className="size-[18px]" strokeWidth={2} />}
                label={t.welcome.bullets.quality.label}
                hint={t.welcome.bullets.quality.hint}
              />
            </div>
          </div>

          <div className="relative mx-auto flex aspect-square w-full max-w-[560px] items-center justify-center">
            {/* Halo terracotta diffus derrière la grille */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at center, color-mix(in oklab, var(--primary) 12%, transparent) 0%, transparent 62%)",
              }}
            />
            <HeroGrid
              cells={HERO_CELLS_DESKTOP}
              columns={4}
              size="lg"
              className="w-[440px]"
            />
          </div>
        </section>
      </main>

      {/* Contenu SEO / informatif sous le hero */}
      <LandingContent />
    </div>
  );
}

/** Eyebrow éditorial : trait court + libellé en capitales espacées. */
function Eyebrow() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="bg-primary h-px w-6" />
      <span className="text-primary font-display text-[11px] font-bold tracking-[0.18em] uppercase">
        {t.welcome.eyebrow}
      </span>
    </div>
  );
}

/** Puce mobile : pastille terracotta + libellé + précision discrète (optionnelle). */
function DotItem({ label, hint }: { label: string; hint?: string }) {
  return (
    <li className="flex items-center gap-3 text-[15px]">
      <span className="bg-primary size-1.5 shrink-0 rounded-full" />
      <span className="font-medium">{label}</span>
      {hint ? (
        <span className="text-muted-foreground text-[12.5px]">· {hint}</span>
      ) : null}
    </li>
  );
}

function Bullet({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-primary mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold">{label}</div>
        {hint ? (
          <div className="text-muted-foreground text-[12px]">{hint}</div>
        ) : null}
      </div>
    </div>
  );
}
