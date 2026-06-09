/**
 * Préparation d'une image avant stockage et impression.
 *
 * Principe : on plafonne le grand côté à `MAX_EDGE` px (= une photo
 * occupant une page A4 pleine à ~300 PPI, le pire cas d'impression de
 * l'app). Au-delà de ce seuil, l'imprimante ne peut de toute façon plus
 * restituer de détail : la réduction est donc invisible sur le papier,
 * tout en allégeant le stockage IndexedDB et le PDF d'un facteur 5 à 20.
 *
 * - Image déjà sous le cap → renvoyée TELLE QUELLE (zéro recompression,
 *   octets et EXIF d'origine préservés).
 * - Image au-dessus → un UNIQUE ré-encodage canvas (JPEG q0.92, ou PNG
 *   si la source est un PNG, pour ne pas perdre la transparence).
 *
 * Subtilité EXIF : on charge le bitmap avec `imageOrientation:
 * "from-image"`, donc le canvas « cuit » l'orientation dans les pixels.
 * Une image réduite repart par conséquent droite, avec
 * `exifOrientation: 1`. Sinon `embedImage.ts` la ferait pivoter une
 * seconde fois à l'impression.
 */

import type { PhotoType } from "@/types";

/** Grand côté maximal : 3500 px ≈ A4 plein format à ~300 PPI. */
export const MAX_EDGE = 3500;

/** Qualité JPEG du seul ré-encodage (élevée : artefacts imperceptibles). */
const JPEG_QUALITY = 0.92;

/** Métadonnées image produites par `prepareImage`, hors `id`/`uri`. */
export type PreparedImage = Pick<
  PhotoType,
  "width" | "height" | "name" | "type" | "size" | "exifOrientation"
> & { blob: Blob };

/**
 * Réduit `file` si son grand côté dépasse `MAX_EDGE`, sinon le renvoie
 * intact. Retourne le `Blob` à persister (réduit ou original) et les
 * métadonnées associées (dimensions visuelles, orientation effective).
 *
 * `sourceOrientation` est l'orientation EXIF lue en amont : elle n'est
 * conservée que dans le cas passe-through (octets originaux). Une image
 * réduite est déjà droite, donc son orientation effective vaut 1.
 *
 * Lève si `createImageBitmap` n'est pas disponible / refuse le fichier :
 * le caller retombe alors sur les octets originaux.
 */
export async function prepareImage(
  file: File,
  sourceOrientation: number,
): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const srcW = bitmap.width;
  const srcH = bitmap.height;
  const longEdge = Math.max(srcW, srcH);

  // Sous le cap : aucune recompression. On garde les octets ET l'EXIF source.
  if (longEdge <= MAX_EDGE) {
    bitmap.close();
    return {
      blob: file,
      width: srcW,
      height: srcH,
      name: file.name,
      type: file.type,
      size: file.size,
      exifOrientation: sourceOrientation,
    };
  }

  const scale = MAX_EDGE / longEdge;
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // Contexte 2D indisponible : on dégrade vers l'original plutôt qu'échouer.
    bitmap.close();
    return {
      blob: file,
      width: srcW,
      height: srcH,
      name: file.name,
      type: file.type,
      size: file.size,
      exifOrientation: sourceOrientation,
    };
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, JPEG_QUALITY),
  );
  // Libère le bitmap du canvas : un buffer HD pèse plusieurs dizaines de Mo,
  // à ne pas laisser traîner jusqu'au GC sur mobile.
  canvas.width = 0;
  canvas.height = 0;

  if (!blob) {
    return {
      blob: file,
      width: srcW,
      height: srcH,
      name: file.name,
      type: file.type,
      size: file.size,
      exifOrientation: sourceOrientation,
    };
  }

  return {
    blob,
    width: w,
    height: h,
    name: file.name,
    type: mime,
    size: blob.size,
    // Pixels déjà droits (orientation cuite par le canvas) → EXIF neutre.
    exifOrientation: 1,
  };
}
