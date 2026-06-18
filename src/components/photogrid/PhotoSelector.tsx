import { ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { fileToPhoto, MAX_PHOTOS, revokePhotos } from "@/lib/imageUtils";
import { mapWithConcurrency } from "@/lib/mapWithConcurrency";
import { fr as t } from "@/lib/strings/fr";
import { usePhotoGridStore } from "@/lib/store";
import type { PhotoType } from "@/types";

/**
 * Composant de sélection des photos.
 *
 * - Input file masqué, déclenché par bouton.
 * - Sur mobile, `accept="image/*"` ouvre la galerie système.
 * - Lit dimensions et EXIF via `fileToPhoto`.
 * - Plafonne à `MAX_PHOTOS` photos pour éviter les crashs RAM mobile.
 * - Au démontage : ne libère PAS les blob URLs (responsabilité du store).
 */
export function PhotoSelector() {
  const photos = usePhotoGridStore((s) => s.photos);
  const addPhotos = usePhotoGridStore((s) => s.addPhotos);
  const removePhoto = usePhotoGridStore((s) => s.removePhoto);
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  // Garde synchrone contre la ré-entrance : `importing` (state) ne devient
  // `true` qu'au prochain render, trop tard pour bloquer un double-clic
  // rapide qui relancerait un import concurrent.
  const importingRef = useRef(false);

  // Avertir le navigateur de libérer les blob URLs si l'onglet se ferme.
  useEffect(() => {
    const handler = () => revokePhotos(usePhotoGridStore.getState().photos);
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (importingRef.current) return; // import déjà en cours

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(t.errors.tooManyPhotos(MAX_PHOTOS));
      return;
    }
    const accepted = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast.warning(t.errors.tooManyPhotos(MAX_PHOTOS));
    }

    const total = accepted.length;
    importingRef.current = true;
    setImporting(true);
    // Toast de progression : le décodage + redimensionnement d'un gros lot
    // prend plusieurs secondes ; on tient l'utilisateur informé (« X/N »).
    const toastId = toast.loading(t.home.importing(0, total));
    try {
      // Concurrence bornée : chaque `fileToPhoto` décode un bitmap complet
      // (~50 Mo transitoires pour une photo 12 Mpx en RGBA) : un `Promise.all`
      // non borné sur un gros lot pourrait saturer la RAM d'une WebView mobile.
      const results = await mapWithConcurrency(
        accepted,
        4,
        (f) => fileToPhoto(f),
        (completed) =>
          toast.loading(t.home.importing(completed, total), { id: toastId }),
      );
      const ok: PhotoType[] = [];
      const failures: { name: string; reason: string }[] = [];
      for (const r of results) {
        if (r.ok) ok.push(r.photo);
        else failures.push({ name: r.name, reason: r.reason });
      }

      if (ok.length > 0) {
        addPhotos(ok);
        toast.success(t.home.imported(ok.length), { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
      if (failures.length > 0) {
        const first = failures[0];
        toast.error(t.errors.importFailed(first.name, first.reason));
      }
    } catch (err) {
      // Chemin inattendu (le décodage par photo est déjà catché dans
      // `fileToPhoto`) : on finalise quand même le toast loading en erreur
      // pour ne pas le laisser tourner indéfiniment.
      const reason = err instanceof Error ? err.message : String(err);
      toast.error(t.errors.importFailed("?", reason), { id: toastId });
    } finally {
      importingRef.current = false;
      setImporting(false);
      // Reset l'input pour pouvoir re-sélectionner les mêmes fichiers
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (photos.length === 0) {
    return (
      <div className="bg-secondary/40 mx-auto flex max-w-md flex-col items-center justify-center rounded-3xl px-6 py-16 text-center">
        <ImagePlus
          className="text-muted-foreground mb-4 size-10"
          strokeWidth={1.5}
        />
        <p className="text-[17px] font-semibold">{t.home.empty.title}</p>
        <p className="text-muted-foreground mt-2 max-w-xs text-[15px]">
          {t.home.empty.subtitle}
        </p>
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={importing}
          aria-busy={importing}
          className="mt-6 h-11 rounded-2xl px-6 text-[15px] font-semibold"
        >
          {importing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          {t.home.empty.cta}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={importing}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5 lg:gap-3 xl:grid-cols-6">
        {photos.map((p, i) => (
          <div
            key={p.uri}
            className="bg-cell relative aspect-square overflow-hidden rounded-xl"
          >
            <img
              src={p.uri}
              alt={p.name ?? `photo ${i + 1}`}
              className="size-full object-cover"
              loading="lazy"
              decoding="async"
              style={{ imageOrientation: "from-image" }}
            />
            <button
              onClick={() => removePhoto(i)}
              aria-label={`Supprimer la photo ${i + 1}`}
              className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/65 text-white transition active:scale-95"
            >
              <X className="size-3.5" strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>

      <Button
        onClick={() => inputRef.current?.click()}
        variant="secondary"
        disabled={importing}
        aria-busy={importing}
        className="h-11 w-full rounded-2xl text-[15px] font-semibold"
      >
        {importing ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ImagePlus className="size-4" />
        )}
        {t.home.actions.add}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={importing}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
