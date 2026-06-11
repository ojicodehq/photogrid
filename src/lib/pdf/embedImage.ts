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
 * Embarque une photo dans `pdf` et renvoie l'image PDF + son orientation
 * EXIF. Tente l'embarquement direct des octets sources ; bascule sur le
 * transcodage canvas uniquement si pdf-lib refuse le fichier.
 */
export async function embedPhoto(
  pdf: PDFDocument,
  photo: PhotoType,
): Promise<EmbeddedPhoto> {
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
