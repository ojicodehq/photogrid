import { generatePdf } from "@/lib/pdf/generatePdf";
import type { LayoutConfig, PhotoType } from "@/types";

/**
 * Worker dédié à la génération PDF.
 *
 * Décharge le main thread du travail CPU-bound (parsing JPEG/PNG par
 * pdf-lib, transcodage OffscreenCanvas) qui gelait l'UI 2-8 s sur mobile.
 * Les `blob:` URLs des photos sont fetchables ici (même origine), et le
 * résultat repart en transfert zéro-copie.
 */

type PdfWorkerRequest = { photos: PhotoType[]; layout: LayoutConfig };

export type PdfWorkerResponse =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; error: string };

// `self` est typé `Window` par la lib `dom` du tsconfig : on le recale sur
// le scope réel du worker (signature postMessage(message, transfer)).
const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (e: MessageEvent<PdfWorkerRequest>) => {
  try {
    const bytes = await generatePdf(e.data.photos, e.data.layout);
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
  }
};
