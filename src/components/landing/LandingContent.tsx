import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { fr as t } from "@/lib/strings/fr";

import { Faq } from "./Faq";

/**
 * Contenu de la landing affiché sous le hero (route `/`).
 * Sert à la fois les visiteurs et le référencement (contenu indexable
 * ciblant « imprimer plusieurs photos sur une page »).
 */
export function LandingContent() {
  return (
    <>
      <HowItWorks />
      <Formats />
      <Faq />
      <LandingFooter />
    </>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-[860px]">
        <p className="text-primary text-[13px] font-semibold tracking-[0.08em] uppercase">
          {t.landing.how.eyebrow}
        </p>
        <h2 className="font-display mt-2 text-[clamp(1.8rem,4vw,2.4rem)] font-bold tracking-[-0.02em]">
          {t.landing.how.title}
        </h2>
        <p className="text-muted-foreground mt-3 max-w-[54ch] text-[17px] leading-relaxed">
          {t.landing.how.lead}
        </p>

        <div className="border-border mt-10 border-t">
          {t.landing.how.steps.map((s) => (
            <div
              key={s.n}
              className="border-border grid grid-cols-[52px_1fr] gap-5 border-b py-6"
            >
              <span className="font-display text-primary text-[28px] leading-none font-extrabold">
                {s.n}
              </span>
              <div>
                <h3 className="font-display text-[18px] font-bold">{s.title}</h3>
                <p className="text-muted-foreground mt-1 text-[15px] leading-relaxed">
                  {s.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Formats() {
  return (
    <section id="formats" className="scroll-mt-20 px-6 pb-20 lg:pb-28">
      <div className="mx-auto max-w-[860px]">
        <p className="text-primary text-[13px] font-semibold tracking-[0.08em] uppercase">
          {t.landing.formats.eyebrow}
        </p>
        <h2 className="font-display mt-2 text-[clamp(1.8rem,4vw,2.4rem)] font-bold tracking-[-0.02em]">
          {t.landing.formats.title}
        </h2>
        <p className="text-muted-foreground mt-3 max-w-[54ch] text-[17px] leading-relaxed">
          {t.landing.formats.lead}
        </p>

        <div className="bg-accent mt-9 grid grid-cols-2 gap-4 rounded-3xl p-6 sm:p-9 md:grid-cols-4">
          {t.landing.formats.items.map((f) => (
            <div
              key={f.name}
              className="bg-card border-border rounded-2xl border p-5"
            >
              <div className="font-display text-[20px] font-bold">{f.name}</div>
              <div className="text-muted-foreground mt-1 text-[13px]">
                {f.dim}
              </div>
              <div
                className="bg-primary mt-4 h-1 rounded-full opacity-85"
                style={{ width: `${f.ratio}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-border border-t px-6 py-14">
      <div className="mx-auto flex max-w-[860px] flex-col items-start gap-8">
        <Link
          to="/home"
          className={buttonVariants({
            size: "lg",
            className: "rounded-full px-7 font-semibold",
          })}
        >
          {t.landing.footer.cta}
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="bg-primary text-primary-foreground font-display flex size-7 items-center justify-center rounded-lg text-[12px] font-bold">
            PG
          </div>
          <p className="text-muted-foreground text-[14px]">
            {t.landing.footer.tagline}
          </p>
        </div>
        {/* Lien vers le site de guides (hors SPA) : balise <a> classique pour
            sortir du HashRouter et laisser le reverse-proxy router /guides. */}
        <a
          href="/guides/"
          className="text-muted-foreground hover:text-foreground text-[14px] underline underline-offset-2"
        >
          {t.landing.footer.guides}
        </a>
      </div>
    </footer>
  );
}
