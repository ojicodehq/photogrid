import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { fr as t } from "@/lib/strings/fr";

import { ThemeToggle } from "./ThemeToggle";

const NAV_HEIGHT = 64; // hauteur de la barre (h-16)

/**
 * Défile en douceur vers une section, en compensant la hauteur de la barre
 * collante.
 *
 * On n'utilise PAS d'ancres `href="#id"` (le `HashRouter` les prendrait pour
 * des routes), ni `scrollIntoView` + `scroll-margin` : leur combinaison avec
 * un défilement « smooth » provoque un rebond et un alignement approximatif.
 * Un `scrollTo` avec position calculée est déterministe.
 */
function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT - 12;
  window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
}

/**
 * Barre de navigation collante de la landing (route `/`).
 * Liens internes vers les sections de contenu + CTA vers l'app.
 * Les liens de section sont masqués en mobile pour ne pas encombrer.
 */
export function LandingNav() {
  return (
    <header className="bg-background/80 border-border sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary text-primary-foreground font-display flex size-8 items-center justify-center rounded-lg text-[13px] font-bold tracking-tight">
            PG
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight">
            {t.app.name}
          </span>
          <span className="text-muted-foreground hidden text-[12px] sm:inline">
            {t.app.by}
          </span>
        </div>

        <nav className="hidden items-center gap-7 lg:flex">
          <button
            type="button"
            onClick={() => scrollToId("how")}
            className="text-muted-foreground hover:text-foreground cursor-pointer text-[14px] font-medium transition-colors"
          >
            {t.landing.nav.how}
          </button>
          <button
            type="button"
            onClick={() => scrollToId("formats")}
            className="text-muted-foreground hover:text-foreground cursor-pointer text-[14px] font-medium transition-colors"
          >
            {t.landing.nav.formats}
          </button>
          <button
            type="button"
            onClick={() => scrollToId("faq")}
            className="text-muted-foreground hover:text-foreground cursor-pointer text-[14px] font-medium transition-colors"
          >
            {t.landing.nav.faq}
          </button>
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {/* CTA masqué en mobile : le hero a déjà son bouton « Commencer »
              proéminent. On évite ainsi le doublon sur petit écran. */}
          <div className="hidden lg:block">
            <Link
              to="/home"
              className={buttonVariants({
                className:
                  "h-9 rounded-full px-5 text-[14px] font-semibold tracking-tight",
              })}
            >
              {t.welcome.cta}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
