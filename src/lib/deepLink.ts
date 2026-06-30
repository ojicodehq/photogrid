import type {
  FitMode,
  LayoutConfig,
  PageOrientation,
  PageSize,
  QualityLevel,
} from "@/types";

/**
 * Traduction des query params d'un deep link en configuration de grille.
 *
 * Usage : une page de contenu (« imprimer 4 photos sur une page A4 ») pointe
 * vers l'app déjà réglée, ex. `/#/home?format=a4&cols=2&rows=2`. Le parsing
 * est volontairement permissif sur la casse mais strict sur les valeurs :
 * seul un param présent ET valide produit une entrée du patch, tout le reste
 * est ignoré silencieusement. Aucune dépendance React : fonction pure,
 * testable en isolation.
 */

// Formats standards uniquement : pas de "Custom" via URL (éviterait de devoir
// valider une largeur/hauteur arbitraires).
const PAGE_SIZES: readonly PageSize[] = ["A4", "A5", "Letter", "Legal"];
const ORIENTATIONS: readonly PageOrientation[] = ["portrait", "landscape"];
const FIT_MODES: readonly FitMode[] = ["contain", "cover", "fill"];
const QUALITIES: readonly QualityLevel[] = ["standard", "high", "max"];

// Bornes alignées sur l'UI (sliders) pour rejeter les valeurs absurdes.
const MIN_GRID = 1;
const MAX_GRID = 12;
const MAX_SPACING = 40; // mm

function matchEnum<T extends string>(
  raw: string | null,
  allowed: readonly T[],
): T | undefined {
  if (raw == null) return undefined;
  return allowed.find((v) => v.toLowerCase() === raw.toLowerCase());
}

function parseIntInRange(
  raw: string | null,
  min: number,
  max: number,
): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) return undefined;
  return n;
}

/**
 * Construit un patch de layout à partir des query params.
 * Params reconnus : `format`, `orientation`, `cols`, `rows`, `spacing`,
 * `fit`, `quality`. Retourne `{}` si aucun param exploitable.
 */
export function parseDeepLinkLayout(
  params: URLSearchParams,
): Partial<LayoutConfig> {
  const patch: Partial<LayoutConfig> = {};

  const pageSize = matchEnum(params.get("format"), PAGE_SIZES);
  if (pageSize) patch.pageSize = pageSize;

  const orientation = matchEnum(params.get("orientation"), ORIENTATIONS);
  if (orientation) patch.orientation = orientation;

  const columns = parseIntInRange(params.get("cols"), MIN_GRID, MAX_GRID);
  if (columns !== undefined) patch.columns = columns;

  const rows = parseIntInRange(params.get("rows"), MIN_GRID, MAX_GRID);
  if (rows !== undefined) patch.rows = rows;

  const spacing = parseIntInRange(params.get("spacing"), 0, MAX_SPACING);
  if (spacing !== undefined) patch.spacing = spacing;

  const fitMode = matchEnum(params.get("fit"), FIT_MODES);
  if (fitMode) patch.fitMode = fitMode;

  const quality = matchEnum(params.get("quality"), QUALITIES);
  if (quality) patch.quality = quality;

  return patch;
}
