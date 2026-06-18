export type PhotoType = {
  id: string; // identifiant stable, sert de clé IndexedDB
  uri: string; // blob URL via URL.createObjectURL (plein-res, pour le PDF)
  thumbUri?: string; // blob URL d'une vignette légère, pour l'affichage écran
  width: number;
  height: number;
  name?: string;
  type?: string;
  size?: number;
  exifOrientation?: number;
};

export type PageSize = "A4" | "A5" | "Letter" | "Legal" | "Custom";

export type PageOrientation = "portrait" | "landscape";

export type FitMode = "contain" | "cover" | "fill";

export type QualityLevel = "standard" | "high" | "max";

export type Margins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type LayoutConfig = {
  columns: number;
  rows: number;
  spacing: number; // mm (vrais millimètres CSS)
  pageSize: PageSize;
  orientation: PageOrientation;
  fitMode: FitMode;
  margins: Margins;
  quality: QualityLevel;
  totalPhotos: number;
  customWidth?: number; // mm (pour PageSize "Custom")
  customHeight?: number; // mm
};

export type ThemePreference = "light" | "dark" | "system";

export type PaperDimensions = { width: number; height: number };
