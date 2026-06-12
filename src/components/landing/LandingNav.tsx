import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { fr as t } from "@/lib/strings/fr";

/**
 * Défile en douceur vers une section.
 *
 * On n'utilise PAS d'ancres `href="#id"` : l'app tourne sous `HashRouter`,
 * qui interpréterait le hash comme une route et casserait la navigation.
 */
function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/**
 * Barre de navigation collante de la landing (route `/`).
 * Liens internes vers les sections de contenu + CTA vers l'app.
 * Les liens de section sont masqués en mobile pour ne pas encombrer.
 */
export function LandingNav() {
  return (
    <header className="bg-background/80 border-border sticky top-0 z-30 border-b backdrop-blur-md">
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

        {/* CTA masqué en mobile : le hero a déjà son bouton « Commencer »
            proéminent. On évite ainsi le doublon sur petit écran. */}
        <div className="hidden lg:block">
          <Link
            to="/home"
            className={buttonVariants({
              size: "sm",
              className: "rounded-full px-4 font-semibold",
            })}
          >
            {t.welcome.cta}
          </Link>
        </div>
      </div>
    </header>
  );
}
