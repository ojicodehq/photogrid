import { memo, type CSSProperties } from "react";

import { getPaperDimensionsMm } from "@/lib/paperSizes";
import type { FitMode, LayoutConfig, PhotoType } from "@/types";

const FIT_MAP: Record<FitMode, CSSProperties["objectFit"]> = {
  contain: "contain",
  cover: "cover",
  fill: "fill",
};

type PhotoGridProps = {
  photos: PhotoType[];
  layout: LayoutConfig;
  /** Page à afficher (0-indexée). */
  pageIndex?: number;
};

/**
 * Grille de photos en CSS grid, rendant la page courante de l'aperçu.
 *
 * Le conteneur fait la taille du papier en `mm` exact. Le `gap` de la
 * grille produit l'espacement réel ; les marges sont appliquées en
 * `padding` mm. Aucun calcul de pixel/DPI : le navigateur convertit `mm`
 * en `px` à l'écran selon le `transform: scale()` appliqué par le parent
 * (l'impression, elle, passe par le PDF vectoriel — cf. `printService`).
 */
export function PhotoGrid({ photos, layout, pageIndex = 0 }: PhotoGridProps) {
  const paper = getPaperDimensionsMm(layout.pageSize, layout.orientation, {
    width: layout.customWidth,
    height: layout.customHeight,
  });

  const photosPerPage = Math.max(1, layout.rows * layout.columns);
  const totalPages = Math.max(1, Math.ceil(photos.length / photosPerPage));

  const page = Math.min(pageIndex, totalPages - 1);
  const start = page * photosPerPage;
  const pagePhotos = photos.slice(start, start + photosPerPage);

  return <PhotoPage paper={paper} layout={layout} photos={pagePhotos} />;
}

function PhotoPage({
  paper,
  layout,
  photos,
}: {
  paper: { width: number; height: number };
  layout: LayoutConfig;
  photos: PhotoType[];
}) {
  return (
    <section
      className="bg-white shadow-md"
      style={{
        width: `${paper.width}mm`,
        height: `${paper.height}mm`,
        paddingTop: `${layout.margins.top}mm`,
        paddingRight: `${layout.margins.right}mm`,
        paddingBottom: `${layout.margins.bottom}mm`,
        paddingLeft: `${layout.margins.left}mm`,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
          gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
          gap: `${layout.spacing}mm`,
          width: "100%",
          height: "100%",
        }}
      >
        {Array.from({ length: layout.rows * layout.columns }, (_, i) => (
          <Cell key={i} photo={photos[i]} fitMode={layout.fitMode} index={i} />
        ))}
      </div>
    </section>
  );
}

/**
 * Cellule de la grille, mémoïsée sur `(photo, fitMode)`.
 *
 * Les sliders d'espacement, de marges, de format ou d'orientation ne
 * modifient que le conteneur grid (taille du papier, `gap`, `padding`),
 * pas le contenu des cellules : sans `memo`, bouger l'un d'eux re-rendrait
 * inutilement les dizaines de `<img>` à chaque tick. La référence `photo`
 * reste stable tant que la photo ne change pas (les éléments du store ne
 * sont pas recréés par un `slice`), donc la comparaison superficielle suffit.
 */
const Cell = memo(function Cell({
  photo,
  fitMode,
  index,
}: {
  photo: PhotoType | undefined;
  fitMode: FitMode;
  index: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-[1mm]"
      style={{ background: "var(--cell)" }}
    >
      {photo ? (
        <img
          src={photo.thumbUri ?? photo.uri}
          alt={photo.name ?? `photo ${index + 1}`}
          className="size-full"
          style={{
            objectFit: FIT_MAP[fitMode],
            imageOrientation: "from-image",
          }}
          decoding="async"
        />
      ) : null}
    </div>
  );
});
