import { Moon, Sun } from "lucide-react";

import { useThemeControl } from "@/lib/useThemeControl";

/**
 * Bascule clair / sombre pour la barre de navigation de la landing.
 * Reste cohérent avec les réglages de l'app : `useThemeControl` met à jour
 * next-themes ET le store persistant en un seul point.
 */
export function ThemeToggle() {
  const { mounted, resolvedTheme, setTheme } = useThemeControl();

  // Avant le montage, on réserve l'espace pour éviter tout décalage / flash.
  if (!mounted) {
    return <div className="size-9" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Passer en thème clair" : "Passer en thème sombre"}
      className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors"
    >
      {isDark ? (
        <Sun className="size-[18px]" strokeWidth={2} />
      ) : (
        <Moon className="size-[18px]" strokeWidth={2} />
      )}
    </button>
  );
}
