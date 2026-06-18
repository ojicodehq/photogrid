import type { PDFDocument, PDFImage } from "pdf-lib";

import type { PhotoType } from "@/types";

/**
 * Embarquement d'une photo dans un document PDF.
 *
 * Principe directeur : **zéro recompression**. Les octets JPEG/PNG
 * sources (le fichier original tel qu'importé, accessible via la blob
 * URL) sont embarqués tels quels : la qualité du tirage papier est donc
 * exactement celle de la photo d'origine, sans rasterisation ni perte.
 *
 * Exception voulue : les segments de métadonnées JPEG (EXIF/IPTC) sont
 * retirés avant embarquement — opération sans perte sur les pixels — pour
 * que GPS, date et modèle d'appareil ne se propagent pas dans le PDF
 * partagé/imprimé. Le PNG n'a pas besoin de ce traitement : pdf-lib
 * ré-encode ses pixels, les chunks de métadonnées ne survivent pas.
 *
 * Seul cas de recompression : un format non géré nativement par pdf-lib
 * (WebP, HEIC…) est transcodé via `<canvas>` en PNG : PNG étant un
 * format sans perte, la qualité reste préservée (au prix de la taille).
 */

export type EmbeddedPhoto = {
  image: PDFImage;
  /** Orientation EXIF (1–8) : à appliquer au dessin, pdf-lib ne le fait pas. */
  exifOrientation: number;
};

/** Récupère les octets bruts d'une photo depuis sa blob URL. */
async function fetchBytes(uri: string): Promise<Uint8Array> {
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Lecture image échouée : ${uri}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Détecte le format via les magic bytes (plus fiable que l'extension). */
function detectFormat(bytes: Uint8Array): "jpg" | "png" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  return null;
}

/**
 * Supprime les segments de métadonnées d'un JPEG : APP1 (EXIF/XMP, dont
 * GPS et date), APP13 (IPTC) et COM (commentaires). Les données image ne
 * sont pas touchées (aucune recompression). APP0 (JFIF) et APP14 (Adobe,
 * indispensable au décodage colorimétrique des JPEG CMYK) sont conservés.
 * L'orientation reste correcte : elle est lue à l'import (exifr) et
 * appliquée au dessin via `photo.exifOrientation`, pas depuis ces octets.
 */
function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
  const STRIPPED = new Set([0xe1, 0xed, 0xfe]);
  const parts: Uint8Array[] = [bytes.subarray(0, 2)];
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    if (marker === 0xff) {
      offset += 1; // octet de bourrage
      continue;
    }
    if (marker === 0xda) break; // SOS : début des données compressées
    const size = 2 + ((bytes[offset + 2] << 8) | bytes[offset + 3]);
    if (!STRIPPED.has(marker)) {
      parts.push(bytes.subarray(offset, offset + size));
    }
    offset += size;
  }
  parts.push(bytes.subarray(offset)); // SOS → fin de fichier, copié tel quel

  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}

/**
 * Transcode une image vers PNG : utilisé en dernier recours pour les
 * formats que pdf-lib ne sait pas embarquer (WebP…). PNG est sans perte :
 * pas de dégradation, seulement un fichier plus lourd.
 *
 * `createImageBitmap` + `OffscreenCanvas` (et non `<img>` + `<canvas>`
 * DOM) : ce module tourne aussi bien dans le Web Worker PDF que sur le
 * main thread (repli), et seules ces API existent dans les deux contextes.
 */
async function transcodeToPng(uri: string): Promise<Uint8Array> {
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Lecture image échouée : ${uri}`);
  const bitmap = await createImageBitmap(await res.blob());

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Contexte canvas 2D indisponible");
  }
  ctx.drawImage(bitmap, 0, 0);
  // Libère le bitmap : une image HD pèse plusieurs dizaines de Mo, à ne
  // pas laisser traîner jusqu'au GC sur mobile.
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: "image/png" });
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Réduit `blob` pour que son grand côté ne dépasse pas `maxEdgePx`, puis
 * renvoie ses octets ré-encodés. Utilisé pour caler chaque photo sur la
 * résolution réellement imprimable de sa cellule (cf. `generatePdf`) :
 * embarquer une image de 3500 px dans une cellule qui n'imprime que ~600 px
 * gaspille la mémoire du worker (octets retenus par pdf-lib jusqu'au
 * `save()`) sans aucun gain visible sur le papier — au-delà de quelques
 * dizaines de photos HD, le worker épuise son tas et les embarquements
 * suivants échouent silencieusement (pages vierges).
 *
 * `imageOrientation: "from-image"` : on « cuit » l'orientation EXIF dans
 * les pixels — exactement comme `prepareImage` à l'import. L'image scalée
 * repart donc droite et l'appelant l'embarque avec `exifOrientation: 1` (pas
 * de rotation au dessin) : aucun risque de double rotation, et aucune
 * dépendance nouvelle vis-à-vis de la WebView au-delà de ce que l'import
 * exige déjà. `wantsPng` préserve la transparence (PNG en entrée).
 * Renvoie `null` si l'image est déjà sous le cap (rien à recompresser).
 */
async function scaleBlobToMaxEdge(
  blob: Blob,
  maxEdgePx: number,
  wantsPng: boolean,
): Promise<Uint8Array | null> {
  const bitmap = await createImageBitmap(blob, {
    imageOrientation: "from-image",
  });
  const longEdge = Math.max(bitmap.width, bitmap.height);
  if (longEdge <= maxEdgePx) {
    bitmap.close();
    return null;
  }

  const scale = maxEdgePx / longEdge;
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return null; // pas de contexte 2D → on retombe sur les octets bruts
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  // PNG conservé pour ne pas perdre la transparence ; sinon JPEG q0.95
  // (artefacts imperceptibles à la résolution d'une cellule, même sur un
  // JPEG déjà compressé une fois).
  const out = wantsPng
    ? await canvas.convertToBlob({ type: "image/png" })
    : await canvas.convertToBlob({ type: "image/jpeg", quality: 0.95 });
  return new Uint8Array(await out.arrayBuffer());
}

/**
 * Embarque une photo dans `pdf` et renvoie l'image PDF + son orientation
 * EXIF.
 *
 * `maxEdgePx` (optionnel) borne le grand côté de l'image embarquée à la
 * résolution utile de sa cellule : au-delà, la photo est réduite via canvas
 * avant embarquement, ce qui plafonne la mémoire du worker sur les gros
 * lots. Sous ce cap (ou sans `maxEdgePx`), on embarque les octets sources
 * tels quels (zéro recompression, métadonnées JPEG retirées pour la
 * confidentialité), avec repli transcodage canvas si pdf-lib refuse.
 */
export async function embedPhoto(
  pdf: PDFDocument,
  photo: PhotoType,
  maxEdgePx?: number,
): Promise<EmbeddedPhoto> {
  // Le grand côté est invariant par rotation EXIF : `photo.width/height`
  // (dimensions visuelles) suffit à décider sans décoder l'image.
  const longEdge = Math.max(photo.width, photo.height);
  if (maxEdgePx && longEdge > maxEdgePx) {
    const blob = await (await fetch(photo.uri)).blob();
    // `photo.type` est fiable (renseigné à l'import) ; `blob.type` peut être
    // vide selon le navigateur quand on fetch une blob URL.
    const wantsPng = photo.type === "image/png" || blob.type === "image/png";
    const scaledBytes = await scaleBlobToMaxEdge(blob, maxEdgePx, wantsPng);
    if (scaledBytes) {
      const image = wantsPng
        ? await pdf.embedPng(scaledBytes)
        : await pdf.embedJpg(scaledBytes);
      // Orientation déjà cuite dans les pixels → neutre au dessin.
      return { image, exifOrientation: 1 };
    }
  }

  const bytes = await fetchBytes(photo.uri);
  const format = detectFormat(bytes);

  let image: PDFImage;
  try {
    if (format === "jpg") {
      image = await pdf.embedJpg(stripJpegMetadata(bytes));
    } else if (format === "png") {
      image = await pdf.embedPng(bytes);
    } else {
      image = await pdf.embedPng(await transcodeToPng(photo.uri));
    }
  } catch {
    // JPEG exotique (CMYK, etc.) refusé par pdf-lib → transcodage PNG.
    image = await pdf.embedPng(await transcodeToPng(photo.uri));
  }

  return { image, exifOrientation: photo.exifOrientation ?? 1 };
}
