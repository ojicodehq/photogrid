import { cn } from "@/lib/utils";

/**
 * Photos de démonstration du hero (décoratives, donc `aria-hidden` côté parent).
 * Stockées dans `public/hero/` — locales, conformes au CSP `img-src 'self'`.
 */
const PHOTOS = Array.from({ length: 9 }, (_, i) => `/hero/photo-${i + 1}.webp`);

/**
 * Une case de la grille :
 * - `photo` : vignette remplie
 * - `slot`  : emplacement vide discret (filet fin) → « grille en cours »
 * - `next`  : emplacement « à composer » (liseré terracotta qui respire)
 * - `gap`   : trou transparent (réserve la place sans rien dessiner)
 */
export type HeroCell = "photo" | "slot" | "next" | "gap";

type HeroGridProps = {
  cells: HeroCell[];
  columns: number;
  size?: "sm" | "lg";
  className?: string;
};

/**
 * Grille de photos « en composition » du hero. Les vignettes apparaissent en
 * cascade au chargement (cf. `.hero-cell` dans globals.css), l'emplacement
 * `next` pulse doucement. Entièrement theme-aware (tokens `foreground`/`primary`).
 */
export function HeroGrid({ cells, columns, size = "sm", className }: HeroGridProps) {
  const rounded = size === "lg" ? "rounded-xl" : "rounded-md";
  const gap = size === "lg" ? "gap-2.5" : "gap-1.5";

  let photoIndex = 0;
  let revealIndex = 0;

  return (
    <div
      aria-hidden="true"
      className={cn("grid", gap, className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {cells.map((cell, i) => {
        if (cell === "photo") {
          const src = PHOTOS[photoIndex % PHOTOS.length];
          const delay = revealIndex * 70;
          photoIndex += 1;
          revealIndex += 1;
          return (
            <div
              key={i}
              className={cn(
                // ring + ombre theme-aware : même un ciel clair se détache du cream
                "hero-cell ring-foreground/15 aspect-square bg-cover bg-center shadow-md shadow-black/20 ring-1",
                rounded,
              )}
              style={{
                backgroundImage: `url(${src})`,
                animationDelay: `${delay}ms`,
              }}
            />
          );
        }
        if (cell === "slot") {
          return (
            <div
              key={i}
              className={cn(
                "bg-foreground/[0.05] ring-foreground/15 aspect-square ring-1 ring-inset",
                rounded,
              )}
            />
          );
        }
        if (cell === "next") {
          return (
            <div
              key={i}
              className={cn("hero-next bg-primary/10 aspect-square", rounded)}
            />
          );
        }
        return <div key={i} className="aspect-square" />;
      })}
    </div>
  );
}

/**
 * Motif mobile : cluster de photos en haut à droite, plus dense (peu de vides
 * qui « clignotent » en light), une seule case « next » comme accent. La
 * colonne gauche reste libre pour le titre.
 */
export const HERO_CELLS_MOBILE: HeroCell[] = [
  "photo", "photo", "photo", "photo",
  "gap",   "photo", "photo", "photo",
  "gap",   "gap",   "photo", "photo",
  "gap",   "gap",   "next",  "photo",
  "gap",   "gap",   "gap",   "photo",
];

/** Motif desktop : grille plus pleine, lecture « voilà le résultat ». */
export const HERO_CELLS_DESKTOP: HeroCell[] = [
  "photo", "photo", "photo", "photo",
  "photo", "photo", "photo", "slot",
  "slot",  "photo", "photo", "photo",
  "photo", "photo", "next",  "photo",
];
