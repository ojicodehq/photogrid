import { fr as t } from "@/lib/strings/fr";
import type { Margins, PageOrientation } from "@/types";

/** Libellé d'orientation en minuscules (« portrait » / « paysage »). */
export function orientationLabel(orientation: PageOrientation): string {
  return orientation === "portrait"
    ? t.config.orientation.portrait.toLowerCase()
    : t.config.orientation.landscape.toLowerCase();
}

/** Vrai quand les quatre marges sont identiques. */
export function marginsUniform(m: Margins): boolean {
  return m.top === m.right && m.right === m.bottom && m.bottom === m.left;
}
