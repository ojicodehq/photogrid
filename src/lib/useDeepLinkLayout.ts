import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import { parseDeepLinkLayout } from "@/lib/deepLink";
import { usePhotoGridStore } from "@/lib/store";

/**
 * Applique, une seule fois au montage, la configuration de grille passée en
 * deep link (`/#/home?format=a4&cols=2&rows=2`). Les params valides écrasent
 * volontairement les préférences persistées — un deep link exprime une
 * intention explicite — puis sont retirés de l'URL pour qu'un rechargement
 * ne réimpose pas la config par-dessus un réglage manuel ultérieur.
 *
 * Garde `applied` : neutralise le double-montage des effets en StrictMode
 * (dev) et toute ré-exécution. Aucun effet si l'URL ne porte aucun param
 * exploitable.
 */
export function useDeepLinkLayout(): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;

    const patch = parseDeepLinkLayout(searchParams);
    if (Object.keys(patch).length === 0) return;

    usePhotoGridStore.getState().updateLayout(patch);
    setSearchParams({}, { replace: true });
    // Montage unique : on lit volontairement les params initiaux et on ignore
    // leurs changements ultérieurs (la config vit ensuite dans le store).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
