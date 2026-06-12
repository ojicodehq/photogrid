import { Layers, Sparkles, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { LandingContent } from "@/components/landing/LandingContent";
import { LandingNav } from "@/components/landing/LandingNav";
import { PhotoFan } from "@/components/welcome/PhotoFan";
import { fr as t } from "@/lib/strings/fr";

export default function WelcomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      {/* Hero : occupe le premier écran sous la barre de navigation */}
      <main className="flex min-h-[calc(100dvh-4rem)] flex-col">
        {/* Mobile layout */}
        <div className="flex flex-1 flex-col px-7 pt-8 pb-10 lg:hidden">
          <PhotoFan className="mt-2 mb-8" />

          <h1 className="font-display text-[44px] leading-[0.95] font-bold tracking-tight">
            {t.welcome.titleMain}
            <br />
            <span className="text-primary italic">{t.welcome.titleAccent}</span>
          </h1>

          <p className="text-muted-foreground mt-5 text-[15px] leading-relaxed">
            {t.welcome.subtitle}
          </p>

          <div className="flex-1" />

          <Link
            to="/home"
            data-testid="welcome-cta"
            className={buttonVariants({
              size: "lg",
              className:
                "shadow-primary/25 font-display h-14 w-full justify-between rounded-2xl text-[17px] font-bold tracking-tight shadow-lg",
            })}
          >
            <span>{t.welcome.cta}</span>
            <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Desktop layout : hero split */}
        <section className="mx-auto hidden w-full max-w-[1280px] flex-1 grid-cols-2 items-center gap-[60px] px-20 lg:grid">
          <div className="max-w-[540px]">
            <span className="border-border bg-card inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase">
              <span className="bg-success size-2 animate-pulse rounded-full" />
              {t.welcome.eyebrow}
            </span>

            <h1 className="font-display mt-7 text-[72px] leading-[0.98] font-bold tracking-[-0.035em]">
              {t.welcome.titleMain}
              <br />
              <span className="text-primary italic">
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
                icon={<WifiOff className="size-[18px]" strokeWidth={2} />}
                label={t.welcome.bullets.offline.label}
                hint={t.welcome.bullets.offline.hint}
              />
              <Bullet
                icon={<Layers className="size-[18px]" strokeWidth={2} />}
                label={t.welcome.bullets.formats.label}
                hint={t.welcome.bullets.formats.hint}
              />
              <Bullet
                icon={<Sparkles className="size-[18px]" strokeWidth={2} />}
                label={t.welcome.bullets.instant.label}
                hint={t.welcome.bullets.instant.hint}
              />
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[580px]">
            {/* Halo terracotta diffus derrière le fan */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at center, color-mix(in oklab, var(--primary) 12%, transparent) 0%, transparent 60%)",
              }}
            />
            <PhotoFan className="absolute top-1/2 left-1/2 w-[480px] -translate-x-1/2 -translate-y-1/2" />
          </div>
        </section>
      </main>

      {/* Contenu SEO / informatif sous le hero */}
      <LandingContent />
    </div>
  );
}

function Bullet({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-primary mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold">{label}</div>
        <div className="text-muted-foreground text-[12px]">{hint}</div>
      </div>
    </div>
  );
}
