import { prepareImage, type PreparedImage } from "@/lib/imageDownscale";
import type { PhotoType } from "@/types";

/**
 * Limite douce sur le nombre de photos chargées simultanément.
 *
 * Calée sur le plafond du Photo Picker Android (100, cf.
 * `getPickImagesMaxLimit`) : au-delà, le sélecteur système ne renvoie de
 * toute façon pas plus de fichiers en une seule sélection. Chaque photo
 * conserve une blob URL (image compressée) en RAM ; 100 reste sûr sur les
 * WebView et navigateurs mobiles récents. Au-delà, on affiche un toast et
 * on refuse les nouveaux fichiers (l'utilisateur peut ajouter par lots).
 */
export const MAX_PHOTOS = 100;

/**
 * Résultat d'un import : succès porteur de la `PhotoType`, ou échec
 * porteur du nom du fichier et de la raison technique réelle.
 *
 * On renvoie la raison (et non un simple `null`) pour pouvoir l'afficher
 * à l'utilisateur : sur mobile il n'y a pas de console, et un message
 * générique « format non supporté » masque la vraie cause (décodage,
 * mémoire, picker WebView…) et nous prive de tout diagnostic terrain.
 */
export type PhotoImportResult =
  | { ok: true; photo: PhotoType }
  | { ok: false; name: string; reason: string };

/**
 * Convertit un `File` en `PhotoType` :
 * - lit l'EXIF pour récupérer l'orientation source
 * - prépare l'image (réduction au cap si la photo est sur-résolue, cf.
 *   `prepareImage`) et crée une blob URL sur le `Blob` retenu
 * - attribue un `id` stable (clé de persistance IndexedDB)
 *
 * Ne `throw` jamais (sinon `mapWithConcurrency` ferait échouer tout le
 * lot) : en cas d'échec, renvoie `{ ok: false, reason }` avec le détail.
 */
export async function fileToPhoto(file: File): Promise<PhotoImportResult> {
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

    // `prepareImage` échoue si `createImageBitmap` est indisponible / refuse le
    // format : on retombe alors sur les octets originaux, sondés via `<img>`.
    // Les deux chemins renvoient la même forme `PreparedImage`, donc la
    // construction du `PhotoType` en aval est unique.
    const prepared = await prepareImage(file, orientation).catch(() =>
      probeOriginal(file, orientation),
    );

    return {
      ok: true,
      photo: {
        id: crypto.randomUUID(),
        uri: URL.createObjectURL(prepared.blob),
        // Pas de vignette (format exotique tombé sur le fallback) →
        // l'affichage retombe sur le plein-res.
        thumbUri: prepared.thumbBlob
          ? URL.createObjectURL(prepared.thumbBlob)
          : undefined,
        width: prepared.width,
        height: prepared.height,
        name: file.name,
        type: prepared.type,
        size: prepared.size,
        exifOrientation: prepared.exifOrientation,
      },
    };
  } catch (err) {
    // Raison technique réelle (nom + message de l'erreur, ou valeur brute) :
    // affichée temporairement à l'utilisateur pour diagnostiquer les échecs
    // d'import sur les appareils où nous n'avons pas de console.
    const reason =
      err instanceof Error
        ? `${err.name}: ${err.message}`
        : String(err);
    return { ok: false, name: file.name, reason };
  }
}

/**
 * Repli de `prepareImage` : garde les octets originaux du fichier et sonde
 * seulement ses dimensions via `<img>` (aucune vignette, l'affichage retombe
 * sur le plein-res). Renvoie la même forme que `prepareImage` pour que
 * `fileToPhoto` construise le `PhotoType` sans distinguer les deux chemins.
 * Lève si le décodage `<img>` échoue lui aussi (→ import rejeté en amont).
 */
async function probeOriginal(
  file: File,
  orientation: number,
): Promise<PreparedImage> {
  const probe = URL.createObjectURL(file);
  try {
    const { width, height } = await readImageDimensions(probe, orientation);
    return {
      blob: file,
      width,
      height,
      name: file.name,
      type: file.type,
      size: file.size,
      exifOrientation: orientation,
      thumbBlob: undefined,
    };
  } finally {
    URL.revokeObjectURL(probe);
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
    if (p.thumbUri?.startsWith("blob:")) {
      URL.revokeObjectURL(p.thumbUri);
    }
  }
}
