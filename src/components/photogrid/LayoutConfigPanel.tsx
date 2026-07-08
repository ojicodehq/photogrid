import { useEffect, useRef, useState } from "react";

import { LivePreviewCard } from "@/components/photogrid/LivePreviewCard";
import { Label } from "@/components/ui/label";
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/ui/segmented-control";
import { Slider } from "@/components/ui/slider";
import { fr as t } from "@/lib/strings/fr";
import { usePhotoGridStore } from "@/lib/store";
import { useDebouncedCallback } from "@/lib/useDebounce";
import type {
  FitMode,
  LayoutConfig,
  PageOrientation,
  PageSize,
  QualityLevel,
} from "@/types";

const GRID_PRESETS: ReadonlyArray<{ label: string; columns: number; rows: number }> = [
  { label: "2 × 1", columns: 2, rows: 1 }, // 2 photos côte à côte (horizontal)
  { label: "1 × 2", columns: 1, rows: 2 }, // 2 photos empilées (vertical)
  { label: "2 × 2", columns: 2, rows: 2 },
  { label: "3 × 3", columns: 3, rows: 3 },
  { label: "2 × 3", columns: 2, rows: 3 },
  { label: "3 × 4", columns: 3, rows: 4 },
  { label: "4 × 5", columns: 4, rows: 5 },
  { label: "5 × 5", columns: 5, rows: 5 },
];

const PAGE_SIZES: ReadonlyArray<SegmentedOption<Exclude<PageSize, "Custom">>> = [
  { label: "A4", value: "A4" },
  { label: "A5", value: "A5" },
  { label: "Letter", value: "Letter" },
  { label: "Legal", value: "Legal" },
];

const ORIENTATIONS: ReadonlyArray<SegmentedOption<PageOrientation>> = [
  { label: t.config.orientation.portrait, value: "portrait" },
  { label: t.config.orientation.landscape, value: "landscape" },
];

const FIT_MODES: ReadonlyArray<SegmentedOption<FitMode>> = [
  { label: t.config.fitMode.contain, value: "contain" },
  { label: t.config.fitMode.cover, value: "cover" },
  { label: t.config.fitMode.fill, value: "fill" },
];

const QUALITIES: ReadonlyArray<SegmentedOption<QualityLevel>> = [
  { label: t.config.quality.standard, value: "standard" },
  { label: t.config.quality.high, value: "high" },
  { label: t.config.quality.max, value: "max" },
];

/**
 * Panel de configuration de la grille. Affiché dans l'onglet Disposition de Home.
 *
 * Convention : chaque section iOS-style (label uppercase + carte arrondie),
 * sliders avec feedback visuel local, store mis à jour avec un debounce
 * de 200 ms pour éviter de re-render la preview à chaque pixel.
 */
export function LayoutConfigPanel() {
  const layout = usePhotoGridStore((s) => s.layout);
  const updateLayout = usePhotoGridStore((s) => s.updateLayout);

  return (
    <div className="space-y-4 pb-6">
      <LivePreviewCard />

      {/* Section : Préréglages + Grille */}
      <Section label={t.config.sections.grid}>
        <SubLabel>{t.config.presets}</SubLabel>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {GRID_PRESETS.map((p) => {
            const active =
              layout.columns === p.columns && layout.rows === p.rows;
            return (
              <button
                key={p.label}
                onClick={() => updateLayout({ columns: p.columns, rows: p.rows })}
                className={
                  "h-10 rounded-xl text-[13px] font-medium transition " +
                  (active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-foreground hover:bg-secondary/80")
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <Divider />

        <DebouncedSlider
          label={t.config.columns}
          value={layout.columns}
          min={1}
          max={10}
          step={1}
          onChange={(v) => updateLayout({ columns: v })}
        />
        <DebouncedSlider
          label={t.config.rows}
          value={layout.rows}
          min={1}
          max={10}
          step={1}
          onChange={(v) => updateLayout({ rows: v })}
        />
        <DebouncedSlider
          label={t.config.spacing}
          value={layout.spacing}
          min={0}
          max={40}
          step={1}
          unit={t.config.spacingUnit}
          onChange={(v) => updateLayout({ spacing: v })}
        />
      </Section>

      {/* Section : Format de page */}
      <Section label={t.config.sections.format}>
        <SubLabel>{t.config.pageSize}</SubLabel>
        <SegmentedControl
          ariaLabel={t.config.pageSize}
          options={PAGE_SIZES}
          value={layout.pageSize as Exclude<PageSize, "Custom">}
          onChange={(pageSize) => updateLayout({ pageSize })}
          className="mt-2 grid h-10 w-full grid-cols-4"
          itemClassName="text-[13px]"
        />

        <SubLabel className="mt-4">{t.config.orientation.label}</SubLabel>
        <SegmentedControl
          ariaLabel={t.config.orientation.label}
          options={ORIENTATIONS}
          value={layout.orientation}
          onChange={(orientation) => updateLayout({ orientation })}
          className="mt-2 grid h-10 w-full grid-cols-2"
          itemClassName="text-[13px]"
        />

        <SubLabel className="mt-4">{t.config.fitMode.label}</SubLabel>
        <SegmentedControl
          ariaLabel={t.config.fitMode.label}
          options={FIT_MODES}
          value={layout.fitMode}
          onChange={(fitMode) => updateLayout({ fitMode })}
          className="mt-2 grid h-10 w-full grid-cols-3"
          itemClassName="text-[13px]"
        />

        <SubLabel className="mt-4">{t.config.quality.label}</SubLabel>
        <SegmentedControl
          ariaLabel={t.config.quality.label}
          options={QUALITIES}
          value={layout.quality}
          onChange={(quality) => updateLayout({ quality })}
          className="mt-2 grid h-10 w-full grid-cols-3"
          itemClassName="text-[13px]"
        />
        <p className="text-muted-foreground mt-2 text-[12px]">
          {t.config.quality.hint}
        </p>
      </Section>

      {/* Section : Marges */}
      <Section label={t.config.sections.margins}>
        <DebouncedSlider
          label={t.config.margins.top}
          value={layout.margins.top}
          min={0}
          max={30}
          step={1}
          unit="mm"
          onChange={(v) => updateMargin(layout, updateLayout, "top", v)}
        />
        <DebouncedSlider
          label={t.config.margins.right}
          value={layout.margins.right}
          min={0}
          max={30}
          step={1}
          unit="mm"
          onChange={(v) => updateMargin(layout, updateLayout, "right", v)}
        />
        <DebouncedSlider
          label={t.config.margins.bottom}
          value={layout.margins.bottom}
          min={0}
          max={30}
          step={1}
          unit="mm"
          onChange={(v) => updateMargin(layout, updateLayout, "bottom", v)}
        />
        <DebouncedSlider
          label={t.config.margins.left}
          value={layout.margins.left}
          min={0}
          max={30}
          step={1}
          unit="mm"
          onChange={(v) => updateMargin(layout, updateLayout, "left", v)}
        />
      </Section>
    </div>
  );
}

function updateMargin(
  layout: LayoutConfig,
  updateLayout: (patch: Partial<LayoutConfig>) => void,
  side: keyof LayoutConfig["margins"],
  value: number,
) {
  updateLayout({ margins: { ...layout.margins, [side]: value } });
}

/* -------------------------------------------------------------- */
/* Building blocks                                                */
/* -------------------------------------------------------------- */

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border-border rounded-2xl border p-4">
      <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {label}
      </Label>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function SubLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "text-muted-foreground text-[13px] font-medium" +
        (className ? ` ${className}` : "")
      }
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div className="border-border/60 my-4 border-t" />;
}

/**
 * Slider avec feedback local instantané et update store débouncé.
 * Affiche la valeur courante (avec unité optionnelle) à droite.
 */
function DebouncedSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  const [local, setLocal] = useState(value);
  const lastCommittedRef = useRef(value);
  const debouncedCommit = useDebouncedCallback((v: number) => {
    lastCommittedRef.current = v;
    onChange(v);
  }, 200);

  // Resync uniquement si la valeur du store a changé hors de notre slider
  // (preset, reset, autre composant). Le test contre `lastCommittedRef`
  // évite le re-render inutile après notre propre commit.
  useEffect(() => {
    if (value !== lastCommittedRef.current) {
      lastCommittedRef.current = value;
      setLocal(value);
    }
  }, [value]);

  const handleValueChange = (values: number | readonly number[]) => {
    const v = Array.isArray(values) ? values[0] : (values as number);
    if (typeof v !== "number") return;
    setLocal(v);
    debouncedCommit(v);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[15px]">{label}</span>
        <span className="text-muted-foreground text-[13px] font-medium tabular-nums">
          {local}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <Slider
        value={[local]}
        min={min}
        max={max}
        step={step}
        onValueChange={handleValueChange}
        className="mt-2"
      />
    </div>
  );
}
