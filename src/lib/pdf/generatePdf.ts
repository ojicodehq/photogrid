import {
  PDFDocument,
  type PDFPage,
  clip,
  closePath,
  concatTransformationMatrix,
  endPath,
  lineTo,
  moveTo,
  popGraphicsState,
  pushGraphicsState,
} from "pdf-lib";

import { MAX_EDGE } from "@/lib/imageDownscale";
import { getPaperDimensionsMm } from "@/lib/paperSizes";
import { type EmbeddedPhoto, embedPhoto } from "@/lib/pdf/embedImage";
import type { FitMode, LayoutConfig, PhotoType } from "@/types";

/**
 * Génération du PDF d'impression.
 *
 * Reproduit fidèlement le layout de `PhotoGrid` (grille CSS en mm) mais
 * en PDF vectoriel : les photos sont placées aux dimensions millimétriques
 * exactes, avec leurs **octets sources** (cf. `embedImage.ts`). Le rendu
 * est donc déterministe et identique web ↔ Android, sans dépendre du
 * moteur d'impression du navigateur ou de la WebView.
 */

/** 1 mm = 72/25.4 points PostScript. */
const MM_TO_PT = 72 / 25.4;

/**
 * Résolution d'impression visée. Au-delà de ~300 PPI l'imprimante grand
 * public ne restitue plus de détail : c'est le plafond utile.
 */
const TARGET_DPI = 300;

/**
 * Marge de sur-échantillonnage appliquée au cap par cellule. Couvre le mode
 * `cover` (l'image déborde la cellule avant rognage, donc tirée plus grand
 * que la cellule) et garde une réserve de netteté au ré-échantillonnage.
 */
const CELL_OVERSAMPLE = 2;

/**
 * Orientation EXIF (1–8) → rotation (degrés, sens anti-horaire, convention
 * PDF) + miroir horizontal préalable. pdf-lib n'applique pas l'EXIF :
 * c'est ce tableau qui rétablit l'image droite.
 */
const EXIF_TRANSFORM: Record<number, { rotate: number; mirror: boolean }> = {
  1: { rotate: 0, mirror: false },
  2: { rotate: 0, mirror: true },
  3: { rotate: 180, mirror: false },
  4: { rotate: 180, mirror: true },
  5: { rotate: 270, mirror: true },
  6: { rotate: 270, mirror: false },
  7: { rotate: 90, mirror: true },
  8: { rotate: 90, mirror: false },
};

/**
 * Dessine une photo dans une cellule (coin bas-gauche `cellX,cellY`),
 * en appliquant le mode d'ajustement et l'orientation EXIF.
 */
function drawPhotoInCell(
  page: PDFPage,
  embedded: EmbeddedPhoto,
  fitMode: FitMode,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number,
): void {
  const { image, exifOrientation } = embedded;
  const { rotate, mirror } = EXIF_TRANSFORM[exifOrientation] ?? EXIF_TRANSFORM[1];
  const quarterTurn = rotate === 90 || rotate === 270;

  // Dimensions visuelles de l'image, une fois l'orientation appliquée.
  const visImgW = quarterTurn ? image.height : image.width;
  const visImgH = quarterTurn ? image.width : image.height;

  // Dimensions cibles dans la cellule selon le mode d'ajustement.
  let drawW: number;
  let drawH: number;
  if (fitMode === "fill") {
    drawW = cellW;
    drawH = cellH;
  } else {
    const scale =
      fitMode === "cover"
        ? Math.max(cellW / visImgW, cellH / visImgH)
        : Math.min(cellW / visImgW, cellH / visImgH);
    drawW = visImgW * scale;
    drawH = visImgH * scale;
  }

  const centerX = cellX + cellW / 2;
  const centerY = cellY + cellH / 2;

  page.pushOperators(pushGraphicsState());

  // Clip à la cellule : indispensable pour `cover` (l'image déborde),
  // inoffensif pour `contain`/`fill`.
  page.pushOperators(
    moveTo(cellX, cellY),
    lineTo(cellX + cellW, cellY),
    lineTo(cellX + cellW, cellY + cellH),
    lineTo(cellX, cellY + cellH),
    closePath(),
    clip(),
    endPath(),
  );

  // Repère centré sur la cellule, puis orientation EXIF.
  // En PDF, le dernier `cm` poussé s'applique en PREMIER aux points de
  // l'image. La sémantique EXIF étant « miroir puis rotation », on pousse
  // donc la rotation avant le miroir (miroir appliqué en premier à l'image).
  page.pushOperators(concatTransformationMatrix(1, 0, 0, 1, centerX, centerY));
  if (rotate !== 0) {
    const a = (rotate * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    page.pushOperators(concatTransformationMatrix(cos, sin, -sin, cos, 0, 0));
  }
  if (mirror) {
    page.pushOperators(concatTransformationMatrix(-1, 0, 0, 1, 0, 0));
  }

  // Dans le repère AVANT rotation, l'image brute occupe des dimensions
  // dont la rotation rétablira l'aspect visuel voulu.
  const rawW = quarterTurn ? drawH : drawW;
  const rawH = quarterTurn ? drawW : drawH;
  page.drawImage(image, {
    x: -rawW / 2,
    y: -rawH / 2,
    width: rawW,
    height: rawH,
  });

  page.pushOperators(popGraphicsState());
}

/**
 * Construit le document PDF complet : une page par lot de
 * `rows × columns` photos, layout en millimètres exacts.
 */
export async function generatePdf(
  photos: PhotoType[],
  layout: LayoutConfig,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  const paper = getPaperDimensionsMm(layout.pageSize, layout.orientation, {
    width: layout.customWidth,
    height: layout.customHeight,
  });
  const pageW = paper.width * MM_TO_PT;
  const pageH = paper.height * MM_TO_PT;

  const { columns, rows, margins, spacing, fitMode } = layout;
  const perPage = Math.max(1, rows * columns);
  const totalPages = Math.max(1, Math.ceil(photos.length / perPage));

  const gap = spacing * MM_TO_PT;
  const contentW = pageW - (margins.left + margins.right) * MM_TO_PT;
  const contentH = pageH - (margins.top + margins.bottom) * MM_TO_PT;
  const cellW = (contentW - (columns - 1) * gap) / columns;
  const cellH = (contentH - (rows - 1) * gap) / rows;

  // Cap pixel par cellule : on n'embarque jamais plus de pixels que la
  // cellule ne peut imprimer à `TARGET_DPI`. Adaptatif à la densité de
  // grille — un 1×1 pleine page garde ~3500 px (cap source `MAX_EDGE`,
  // donc passe-through sans recompression), un 5×5 tombe à ~1200 px. C'est
  // ce qui empêche le worker d'épuiser sa mémoire sur les gros lots.
  const cellMaxEdgePt = Math.max(cellW, cellH);
  const cellMaxEdgePx = (cellMaxEdgePt / MM_TO_PT / 25.4) * TARGET_DPI;
  const maxEdgePx = Math.min(MAX_EDGE, Math.ceil(cellMaxEdgePx * CELL_OVERSAMPLE));

  for (let p = 0; p < totalPages; p++) {
    const page = pdf.addPage([pageW, pageH]);
    const pagePhotos = photos.slice(p * perPage, p * perPage + perPage);

    for (let i = 0; i < pagePhotos.length; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const cellX = margins.left * MM_TO_PT + col * (cellW + gap);
      // Origine PDF en bas : la 1re ligne (row 0) est en haut de page.
      const cellTop = pageH - margins.top * MM_TO_PT - row * (cellH + gap);
      const cellY = cellTop - cellH;

      try {
        const embedded = await embedPhoto(pdf, pagePhotos[i], maxEdgePx);
        drawPhotoInCell(page, embedded, fitMode, cellX, cellY, cellW, cellH);
      } catch (err) {
        // Une photo illisible (blob URL révoquée, fichier corrompu) ne doit
        // pas faire échouer tout le document : sa cellule reste vide.
        console.warn(
          `Photo ignorée à l'impression : ${pagePhotos[i].name ?? i}`,
          err,
        );
      }
    }
  }

  return pdf.save();
}
