import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Printer } from "@capgo/capacitor-printer";

import { generatePdfResilient } from "@/lib/pdf/generatePdfAsync";
import { deleteCachedPdf, PDF_FILENAME } from "@/lib/printCleanup";
import type { LayoutConfig, PhotoType } from "@/types";

/**
 * Taille des tranches d'écriture du PDF natif. Multiple de 3 octets : la
 * concaténation des base64 de chaque tranche est alors identique au
 * base64 du fichier entier (aucun padding `=` intermédiaire).
 */
const CHUNK_BYTES = 3_145_728; // 3 Mio

/**
 * Encode des octets en base64. Boucle caractère par caractère : un spread
 * `String.fromCharCode(...chunk)` dépasserait la limite d'arguments sur
 * les WebViews Android anciennes. V8 concatène en rope, le coût reste
 * négligeable devant l'écriture Filesystem.
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Écrit le PDF dans le cache natif par tranches (`writeFile` puis
 * `appendFile`). `Filesystem` n'accepte que du base64 sur natif (`Blob`
 * réservé au web) : encoder le document entier doublait plusieurs fois la
 * taille du PDF en RAM. Ici le pic est borné à une tranche (~3 Mio).
 * Sans `encoding`, Filesystem interprète `data` comme du base64 → binaire.
 */
async function writePdfChunked(bytes: Uint8Array): Promise<string> {
  if (bytes.length === 0) throw new Error("PDF vide");
  let uri = "";
  for (let offset = 0; offset < bytes.length; offset += CHUNK_BYTES) {
    const data = bytesToBase64(bytes.subarray(offset, offset + CHUNK_BYTES));
    if (offset === 0) {
      ({ uri } = await Filesystem.writeFile({
        path: PDF_FILENAME,
        data,
        directory: Directory.Cache,
      }));
    } else {
      await Filesystem.appendFile({
        path: PDF_FILENAME,
        data,
        directory: Directory.Cache,
      });
    }
  }
  return uri;
}

/**
 * Génère le PDF d'impression et le présente à l'utilisateur.
 *
 * La génération tourne dans un Web Worker (cf. `generatePdfResilient`) :
 * l'UI reste réactive pendant les 2-8 s de traitement d'un gros lot.
 *
 * - **Natif (APK Android)** : le PDF est écrit dans le cache par tranches
 *   puis envoyé au PrintManager via `printFile` : et non `printBase64`,
 *   qui crasherait au-delà de ~5 Mo (un lot de photos HD les dépasse
 *   largement).
 * - **Web** : le PDF s'ouvre dans un nouvel onglet ; l'utilisateur
 *   l'imprime ou l'enregistre depuis le lecteur PDF du navigateur.
 *
 * Le PDF lui-même est identique sur les deux plateformes (cf.
 * `generatePdf`) : qualité déterministe, octets sources préservés.
 */
export async function printDocument(
  photos: PhotoType[],
  layout: LayoutConfig,
): Promise<void> {
  const pdfBytes = await generatePdfResilient(photos, layout);

  if (Capacitor.isNativePlatform()) {
    const uri = await writePdfChunked(pdfBytes);
    await Printer.printFile({
      name: "PhotoGrid",
      path: uri,
      mimeType: "application/pdf",
    });
    // `printFile` se résout dès l'envoi au PrintManager, qui relit le
    // fichier en différé pendant le dialogue d'impression : supprimer ici
    // casserait le job. On nettoie au retour en avant-plan (dialogue
    // fermé) ; `cleanupPrintArtifacts` au démarrage sert de filet.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", onVisible);
      void deleteCachedPdf();
    };
    document.addEventListener("visibilitychange", onVisible);
    return;
  }

  // Web : ouverture dans un nouvel onglet (lecteur PDF du navigateur).
  // `generatePdf` a pu durer plusieurs secondes : l'appel est détaché du
  // clic et la pop-up peut être bloquée : on retombe alors sur un
  // téléchargement, qui ne dépend pas du geste utilisateur.
  // Re-wrap dans un Uint8Array adossé à un ArrayBuffer concret : `pdf.save()`
  // type son retour avec `ArrayBufferLike`, non assignable tel quel à BlobPart.
  const blob = new Blob([new Uint8Array(pdfBytes)], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener");
  if (!opened) {
    const link = document.createElement("a");
    link.href = url;
    link.download = "photogrid.pdf";
    link.click();
  }
  // Révocation différée : laisser le temps à l'onglet/téléchargement d'aboutir.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
