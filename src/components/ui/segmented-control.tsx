import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  label: string;
  value: T;
};

/**
 * Traitement « pilule sélectionnée » commun à tous les segmented controls de
 * l'app. base-ui expose l'état actif via `data-pressed` (et NON `data-[state=on]`
 * / `aria-pressed`, conventions Radix/shadcn que `toggleVariants` cible sans
 * effet ici) : on factorise donc ce ciblage à un seul endroit plutôt que de le
 * recopier sur chaque item.
 */
const SEGMENTED_ITEM =
  "rounded-full font-medium data-[pressed]:bg-primary data-[pressed]:text-primary-foreground data-[pressed]:shadow-sm data-[pressed]:hover:bg-primary data-[pressed]:hover:text-primary-foreground";

/**
 * Sélecteur segmenté (une option active parmi N), piloté par un tableau
 * d'options. Encapsule le fond en pilule (`bg-secondary`) et le style de l'item
 * sélectionné ; la mise en page (grille, largeur, taille de texte) reste au
 * choix de l'appelant via `className` / `itemClassName`.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  itemClassName,
  ariaLabel,
}: {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
  itemClassName?: string;
  ariaLabel?: string;
}) {
  return (
    <ToggleGroup
      aria-label={ariaLabel}
      value={[value]}
      onValueChange={(values) => {
        const v = values[0];
        if (v) onChange(v as T);
      }}
      className={cn("bg-secondary rounded-full p-1", className)}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className={cn(SEGMENTED_ITEM, itemClassName)}
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
