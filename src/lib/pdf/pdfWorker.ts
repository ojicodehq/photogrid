import { generatePdf } from "@/lib/pdf/generatePdf";
import type { LayoutConfig, PhotoType } from "@/types";

/**
 * Worker dédié à la génération PDF.
 *
 * Décharge le main thread du travail CPU-bound (parsing JPEG/PNG par
 * pdf-lib, transcodage OffscreenCanvas) qui gelait l'UI 2-8 s sur mobile.
 *
 * Les `blob:` URLs créées par le main thread ne sont PLUS fetchables depuis un
 * worker (partitionnement Chrome 137+). Le main thread nous transmet donc les
 * `Blob` sources, dont on recrée ici des `blob:` URLs locales (même partition,
 * lisibles). Le résultat repart en transfert zéro-copie.
 */

type PdfWorkerRequest = {
  photos: PhotoType[];
  layout: LayoutConfig;
  blobs: (Blob | null)[];
};

export type PdfWorkerResponse =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; error: string };

// `self` est typé `Window` par la lib `dom` du tsconfig : on le recale sur
// le scope réel du worker (signature postMessage(message, transfer)).
const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (e: MessageEvent<PdfWorkerRequest>) => {
  const { photos, layout, blobs } = e.data;
  // `blob:` URLs locales recréées pour ce worker : à révoquer en sortie.
  const localUrls: string[] = [];
  try {
    // Recrée une `blob:` URL locale par photo à partir du Blob transmis : les
    // URLs du main thread ne sont plus lisibles ici (partitionnement Chrome
    // 137+). embedImage/generatePdf restent inchangés, ils fetchent ces URLs
    // locales sans souci.
    const localPhotos = photos.map((p, i) => {
      const blob = blobs[i];
      if (!blob) return p; // Blob indisponible → cellule vide (dégradation OK)
      const url = URL.createObjectURL(blob);
      localUrls.push(url);
      return { ...p, uri: url };
    });
    const bytes = await generatePdf(localPhotos, layout);
    const response: PdfWorkerResponse = { ok: true, bytes };
    // Transfert zéro-copie. `buffer` est typé ArrayBufferLike : si un jour
    // pdf-lib renvoyait une vue sur SharedArrayBuffer (non transférable),
    // on copie vers un ArrayBuffer plutôt que de lever DataCloneError.
    const transfer =
      bytes.buffer instanceof ArrayBuffer ? bytes.buffer : bytes.buffer.slice(0);
    ctx.postMessage(response, [transfer]);
  } catch (err) {
    const response: PdfWorkerResponse = { ok: false, error: String(err) };
    ctx.postMessage(response);
  } finally {
    localUrls.forEach((u) => URL.revokeObjectURL(u));
  }
};
