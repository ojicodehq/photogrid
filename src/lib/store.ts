import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  clearStoredPhotos,
  deletePhoto,
  getAllStoredPhotos,
  putPhotos,
} from "@/lib/photoStorage";
import { revokePhotos } from "@/lib/imageUtils";
import { mapWithConcurrency } from "@/lib/mapWithConcurrency";
import { fr } from "@/lib/strings/fr";
import type {
  LayoutConfig,
  PhotoType,
  ThemePreference,
} from "@/types";

const DEFAULT_LAYOUT: LayoutConfig = {
  columns: 4,
  rows: 5,
  spacing: 5, // mm (vrais millimètres maintenant : slider 0-40 mm)
  pageSize: "A4",
  orientation: "portrait",
  fitMode: "contain",
  margins: { top: 10, right: 10, bottom: 10, left: 10 },
  quality: "high", // ~450 PPI : net au zoom, bon équilibre poids/qualité
  totalPhotos: 0,
};

type PhotoGridState = {
  /** Persisté */
  layout: LayoutConfig;
  theme: ThemePreference;
  /** Session-only : non persisté */
  photos: PhotoType[];
  currentPage: number;
  /**
   * Horodatage du dernier export PDF réussi (session-only). Sert de signal
   * inter-routes au prompt d'installation : `PreviewPage` le pose, le sheet
   * monté dans `AppShell` le lit pour décider d'une relance.
   */
  lastExportAt: number | null;

  // Actions photos
  addPhotos: (photos: PhotoType[]) => void;
  removePhoto: (index: number) => void;
  clearPhotos: () => void;
  /** Recharge les photos persistées depuis IndexedDB (au démarrage). */
  hydratePhotosFromStorage: () => Promise<void>;

  // Actions layout
  updateLayout: (patch: Partial<LayoutConfig>) => void;
  resetLayout: () => void;

  // Actions theme
  setTheme: (t: ThemePreference) => void;

  // Actions pagination
  setCurrentPage: (page: number) => boolean;

  // Signal export
  /** Marque un export PDF réussi (déclencheur de relance du prompt d'install). */
  markExportSuccess: () => void;
};

/**
 * Garde-fou d'hydratation : empêche un double chargement des photos
 * (React StrictMode monte les effets deux fois en dev) qui créerait des
 * blob URLs en double. Flag synchrone, posé avant le premier `await`.
 */
let photosHydrated = false;

/**
 * Persiste un lot de photos dans IndexedDB (best-effort, asynchrone).
 *
 * Les octets sont récupérés via `fetch` sur la blob URL, comme le fait
 * déjà la chaîne d'impression (`embedImage.ts`). Un échec de quota
 * n'interrompt pas la session : la photo reste affichée, elle ne sera
 * simplement pas conservée après fermeture.
 */
async function persistPhotos(newPhotos: PhotoType[]): Promise<void> {
  try {
    // Concurrence bornée : éviter de matérialiser les blobs de tout un
    // lot simultanément avant l'écriture IndexedDB.
    const items = await mapWithConcurrency(newPhotos, 4, async (p) => ({
      id: p.id,
      blob: await (await fetch(p.uri)).blob(),
      thumbBlob: p.thumbUri
        ? await (await fetch(p.thumbUri)).blob()
        : undefined,
      width: p.width,
      height: p.height,
      name: p.name,
      type: p.type,
      size: p.size,
      exifOrientation: p.exifOrientation,
    }));
    await putPhotos(items);
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      toast.error(fr.errors.storageFull);
    } else {
      console.warn("Persistance IndexedDB échouée", err);
    }
  }
}

/**
 * Store global Zustand.
 *
 * `persist` ne sérialise QUE `layout` et `theme` en localStorage (cf.
 * `partialize`). Les `photos` portent des données binaires lourdes :
 * elles sont persistées séparément dans IndexedDB (cf. `photoStorage.ts`)
 * et rechargées au démarrage via `hydratePhotosFromStorage`, qui recrée
 * des blob URLs fraîches (une URL `blob:` est invalidée à chaque reload).
 *
 * L'hydratation `layout`/`theme` depuis `localStorage` reste synchrone au
 * premier render ; celle des photos est asynchrone (IndexedDB).
 */
export const usePhotoGridStore = create<PhotoGridState>()(
  persist(
    (set, get) => ({
      layout: DEFAULT_LAYOUT,
      theme: "system",
      photos: [],
      currentPage: 0,
      lastExportAt: null,

      addPhotos: (newPhotos) => {
        set((state) => {
          const photos = [...state.photos, ...newPhotos];
          return {
            photos,
            layout: { ...state.layout, totalPhotos: photos.length },
          };
        });
        // Persistance IndexedDB détachée du rendu : les photos s'affichent
        // immédiatement, l'écriture disque suit en best-effort.
        void persistPhotos(newPhotos);
      },

      removePhoto: (index) =>
        set((state) => {
          const removed = state.photos[index];
          if (removed) {
            revokePhotos([removed]); // libère plein-res + vignette
            void deletePhoto(removed.id);
          }
          const photos = state.photos.filter((_, i) => i !== index);
          return {
            photos,
            layout: { ...state.layout, totalPhotos: photos.length },
            currentPage: 0,
          };
        }),

      clearPhotos: () =>
        set((state) => {
          revokePhotos(state.photos); // libère plein-res + vignettes
          void clearStoredPhotos();
          return {
            photos: [],
            layout: { ...state.layout, totalPhotos: 0 },
            currentPage: 0,
          };
        }),

      hydratePhotosFromStorage: async () => {
        if (photosHydrated) return;
        photosHydrated = true;
        let created: PhotoType[] = [];
        try {
          const stored = await getAllStoredPhotos();
          if (stored.length === 0) return;
          created = stored.map((s) => ({
            id: s.id,
            uri: URL.createObjectURL(s.blob),
            // Enregistrements d'avant cette version : pas de vignette →
            // l'affichage retombe sur le plein-res.
            thumbUri: s.thumbBlob ? URL.createObjectURL(s.thumbBlob) : undefined,
            width: s.width,
            height: s.height,
            name: s.name,
            type: s.type,
            size: s.size,
            exifOrientation: s.exifOrientation,
          }));
          set((state) => ({
            photos: created,
            layout: { ...state.layout, totalPhotos: created.length },
          }));
        } catch (err) {
          // Révoque les blob URLs déjà créées avant l'échec : sans le `set`,
          // elles ne seraient référencées nulle part et fuiraient en RAM.
          revokePhotos(created);
          photosHydrated = false; // autorise une nouvelle tentative
          console.warn("Hydratation des photos depuis IndexedDB échouée", err);
        }
      },

      updateLayout: (patch) =>
        set((state) => ({ layout: { ...state.layout, ...patch } })),

      resetLayout: () =>
        set((state) => ({
          layout: { ...DEFAULT_LAYOUT, totalPhotos: state.photos.length },
        })),

      setTheme: (t) => set({ theme: t }),

      setCurrentPage: (page) => {
        const { photos, layout } = get();
        const photosPerPage = layout.rows * layout.columns;
        const totalPages = Math.max(1, Math.ceil(photos.length / photosPerPage));
        if (page < 0 || page >= totalPages) return false;
        set({ currentPage: page });
        return true;
      },

      // `lastExportAt` reste hors `partialize` : signal volatile de session,
      // il ne doit pas survivre à un reload (sinon relance fantôme au démarrage).
      markExportSuccess: () => set({ lastExportAt: Date.now() }),
    }),
    {
      name: "photogrid-storage",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // `quality` n'était pas exposé dans l'UI avant la v1 : un "standard"
      // persisté est donc l'ancien défaut, pas un choix utilisateur. On le
      // remonte une seule fois au nouveau défaut "high" (~450 PPI) pour ne pas
      // dégrader la netteté au zoom après mise à jour. Un "standard" choisi
      // sciemment après la v1 est conservé (migrate ne re-tourne pas).
      migrate: (persisted, fromVersion) => {
        const state = persisted as {
          layout?: Partial<LayoutConfig>;
          theme?: PhotoGridState["theme"];
        };
        if (
          fromVersion < 1 &&
          state.layout &&
          (state.layout.quality === "standard" || state.layout.quality == null)
        ) {
          state.layout = { ...state.layout, quality: "high" };
        }
        return state;
      },
      // `totalPhotos` est dérivé de `photos.length` (session-only), donc
      // omis du persist pour éviter qu'une valeur stale traîne en
      // localStorage après reload. Le merge zustand réinjecte 0 depuis
      // DEFAULT_LAYOUT.
      partialize: (state) => ({
        layout: (() => {
          const { totalPhotos: _omit, ...rest } = state.layout;
          return rest as Omit<LayoutConfig, "totalPhotos">;
        })(),
        theme: state.theme,
      }),
    },
  ),
);
