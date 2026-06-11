import { prepareImage } from "@/lib/imageDownscale";
import type { PhotoType } from "@/types";

/**
 * Limite douce sur le nombre de photos chargées simultanément.
 *
 * Chaque photo crée une blob URL qui maintient l'image en RAM côté
 * navigateur. Sur mobile, dépasser cette limite peut faire crasher
 * l'onglet (notamment iOS Safari, plus restrictif). Au-delà, on
 * affiche un toast d'avertissement et on refuse les nouveaux fichiers.
 */
export const MAX_PHOTOS = 80;

/**
 * Convertit un `File` en `PhotoType` :
 * - lit l'EXIF pour récupérer l'orientation source
 * - prépare l'image (réduction au cap si la photo est sur-résolue, cf.
 *   `prepareImage`) et crée une blob URL sur le `Blob` retenu
 * - attribue un `id` stable (clé de persistance IndexedDB)
 *
 * En cas d'échec de décodage (format non supporté), retourne `null` :
 * le caller affiche un toast d'erreur et ignore le fichier.
 */
export async function fileToPhoto(file: File): Promise<PhotoType | null> {
  try {
    // EXIF : on n'a besoin que de Orientation. exifr accepte un File.
    // Import dynamique : exifr (~270 Ko) ne charge qu'au premier import de
    // photo, pas au démarrage. S'il est indisponible (chunk non caché),
    // on continue avec l'orientation par défaut plutôt que de rejeter la photo.
    let orientation = 1;
    try {
      const { default: exifr } = await import("exifr");
      const exif = await exifr.parse(file, ["Orientation"]).catch(() => null);
      orientation = (exif?.Orientation as number | undefined) ?? 1;
    } catch {
      // Module exifr indisponible : orientation 1.
    }

    let blob: Blob;
    // Assignés dans les deux branches ci-dessous ; tout échec du fallback
    // relance vers le `catch` externe (→ `null`), jamais lus non initialisés.
    let width!: number;
    let height!: number;
    let exifOrientation: number | undefined;
    let type: string | undefined;
    let size: number | undefined;

    try {
      const prepared = await prepareImage(file, orientation);
      blob = prepared.blob;
      width = prepared.width;
      height = prepared.height;
      exifOrientation = prepared.exifOrientation;
      type = prepared.type;
      size = prepared.size;
    } catch {
      // `createImageBitmap` indisponible / format exotique : on garde les
      // octets originaux et on lit les dimensions via `<img>`.
      blob = file;
      exifOrientation = orientation;
      type = file.type;
      size = file.size;
      const probe = URL.createObjectURL(file);
      try {
        const dims = await readImageDimensions(probe, orientation);
        width = dims.width;
        height = dims.height;
      } finally {
        URL.revokeObjectURL(probe);
      }
    }

    return {
      id: crypto.randomUUID(),
      uri: URL.createObjectURL(blob),
      width,
      height,
      name: file.name,
      type,
      size,
      exifOrientation,
    };
  } catch {
    return null;
  }
}

/**
 * Lit les dimensions naturelles d'une image en respectant l'orientation EXIF.
 * Pour les orientations 5/6/7/8 (rotations 90°), on inverse width/height
 * pour qu'elles correspondent au rendu visuel après application de
 * `image-orientation: from-image`.
 */
function readImageDimensions(
  uri: string,
  orientation: number,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const rotated = orientation >= 5 && orientation <= 8;
      resolve({
        width: rotated ? img.naturalHeight : img.naturalWidth,
        height: rotated ? img.naturalWidth : img.naturalHeight,
      });
    };
    img.onerror = () => reject(new Error("decode failed"));
    img.src = uri;
  });
}

/** Libère les blob URLs d'un set de photos (ex. au déchargement). */
export function revokePhotos(photos: PhotoType[]): void {
  for (const p of photos) {
    if (p.uri.startsWith("blob:")) {
      URL.revokeObjectURL(p.uri);
    }
  }
}
