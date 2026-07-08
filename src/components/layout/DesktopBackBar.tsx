import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { fr as t } from "@/lib/strings/fr";

/**
 * Barre supérieure desktop (≥ lg) : lien retour vers l'accueil à gauche, titre
 * centré. Partagée par les pages Aperçu et Réglages.
 */
export function DesktopBackBar({ title }: { title: string }) {
  return (
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
          {title}
        </span>
      </div>
      <div className="w-[110px]" />
    </header>
  );
}
